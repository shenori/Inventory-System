<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Borrowing;
use App\Models\Item;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BorrowingController extends Controller
{
    public function index()
    {
        return response()->json(Borrowing::with('item')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'item_id'              => 'required|exists:items,id',
            'borrower_name'        => 'required|string',
            'contact'              => 'required|string',
            'borrow_date'          => 'required|date',
            'expected_return_date' => 'required|date|after_or_equal:borrow_date',
            'quantity_borrowed'    => 'required|integer|min:1',
        ]);

        $borrowing = DB::transaction(function () use ($request) {
            $item = Item::lockForUpdate()->findOrFail($request->item_id);

            // Check against available_quantity (total - already borrowed)
            if ($item->available_quantity < $request->quantity_borrowed) {
                throw new \Exception(
                    'Only ' . $item->available_quantity . ' available. ' .
                    $item->borrowed_quantity . ' currently borrowed.'
                );
            }

            $oldBorrowed  = $item->borrowed_quantity;
            $oldAvailable = $item->available_quantity;

            // Increase borrowed_quantity; total quantity stays the same
            $item->borrowed_quantity += $request->quantity_borrowed;

            // Set status to borrowed only if nothing is available anymore
            if ($item->available_quantity === 0) {
                $item->status = 'borrowed';
            }

            $item->save();

            $borrowing = Borrowing::create($request->all());

            AuditLog::create([
                'user_id'        => auth()->id(),
                'action'         => 'item.borrowed',
                'auditable_type' => Item::class,
                'auditable_id'   => $item->id,
                'old_values'     => [
                    'borrowed_quantity'  => $oldBorrowed,
                    'available_quantity' => $oldAvailable,
                    'status'             => 'in-store',
                ],
                'new_values'     => [
                    'borrowed_quantity'  => $item->borrowed_quantity,
                    'available_quantity' => $item->available_quantity,
                    'quantity_borrowed'  => $request->quantity_borrowed,
                    'status'             => $item->status,
                ],
            ]);

            return $borrowing;
        });

        return response()->json($borrowing->load('item'), 201);
    }

    public function returnItem(Borrowing $borrowing)
    {
        if ($borrowing->status === 'returned') {
            return response()->json(['message' => 'Already returned'], 400);
        }

        DB::transaction(function () use ($borrowing) {
            $item = Item::lockForUpdate()->find($borrowing->item_id);

            if ($item) {
                $oldBorrowed  = $item->borrowed_quantity;
                $oldAvailable = $item->available_quantity;

                // Decrease borrowed_quantity; total quantity stays the same
                $item->borrowed_quantity = max(0, $item->borrowed_quantity - $borrowing->quantity_borrowed);

                // Restore status to in-store if anything is now available
                if ($item->available_quantity > 0) {
                    $item->status = 'in-store';
                }

                $item->save();

                AuditLog::create([
                    'user_id'        => auth()->id(),
                    'action'         => 'item.returned',
                    'auditable_type' => Item::class,
                    'auditable_id'   => $item->id,
                    'old_values'     => [
                        'borrowed_quantity'  => $oldBorrowed,
                        'available_quantity' => $oldAvailable,
                        'status'             => 'borrowed',
                    ],
                    'new_values'     => [
                        'borrowed_quantity'  => $item->borrowed_quantity,
                        'available_quantity' => $item->available_quantity,
                        'quantity_borrowed'  => $borrowing->quantity_borrowed,
                        'status'             => $item->status,
                    ],
                ]);
            }

            $borrowing->update([
                'status'      => 'returned',
                'returned_at' => now(),
            ]);
        });

        return response()->json($borrowing->fresh()->load('item'));
    }

    public function show(Borrowing $borrowing)
    {
        return response()->json($borrowing->load('item'));
    }
}

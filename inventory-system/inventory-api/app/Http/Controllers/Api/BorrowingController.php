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

            if ($item->available_quantity < $request->quantity_borrowed) {
                throw new \Exception(
                    'Only ' . $item->available_quantity . ' available. ' .
                    $item->borrowed_quantity . ' currently borrowed.'
                );
            }

            $oldBorrowed  = $item->borrowed_quantity;
            $oldAvailable = $item->available_quantity;

            $item->borrowed_quantity += $request->quantity_borrowed;

            if ($item->available_quantity === 0) {
                $item->status = 'borrowed';
            }

            $item->save();

            $borrowing = Borrowing::create($request->all());

            // How much is still left after this borrow
            $remaining = $item->available_quantity;
            $totalQty  = $item->quantity;

            AuditLog::create([
                'user_id'        => auth()->id(),
                'action'         => 'item.borrowed',
                'auditable_type' => Item::class,
                'auditable_id'   => $item->id,
                'old_values'     => [
                    'available' => $oldAvailable,
                    'borrowed'  => $oldBorrowed,
                    'total'     => $totalQty,
                ],
                'new_values'     => [
                    'available'         => $remaining,
                    'borrowed'          => $item->borrowed_quantity,
                    'total'             => $totalQty,
                    'taken_this_time'   => $request->quantity_borrowed,
                    'borrower'          => $request->borrower_name,
                    'expected_return'   => $request->expected_return_date,
                    'stock_level'       => $remaining === 0
                                            ? 'out_of_stock'
                                            : ($remaining <= ($totalQty * 0.2) ? 'low_stock' : 'ok'),
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

                $item->borrowed_quantity = max(0, $item->borrowed_quantity - $borrowing->quantity_borrowed);

                if ($item->available_quantity > 0) {
                    $item->status = 'in-store';
                }

                $item->save();

                // How many days was it out
                $borrowedAt  = \Carbon\Carbon::parse($borrowing->borrow_date);
                $returnedAt  = now();
                $daysOut     = $borrowedAt->diffInDays($returnedAt);

                // Was it returned late?
                $expectedReturn = \Carbon\Carbon::parse($borrowing->expected_return_date);
                $isLate         = $returnedAt->gt($expectedReturn);
                $daysLate       = $isLate ? $expectedReturn->diffInDays($returnedAt) : 0;

                AuditLog::create([
                    'user_id'        => auth()->id(),
                    'action'         => 'item.returned',
                    'auditable_type' => Item::class,
                    'auditable_id'   => $item->id,
                    'old_values'     => [
                        'available' => $oldAvailable,
                        'borrowed'  => $oldBorrowed,
                        'total'     => $item->quantity,
                    ],
                    'new_values'     => [
                        'available'       => $item->available_quantity,
                        'borrowed'        => $item->borrowed_quantity,
                        'total'           => $item->quantity,
                        'returned_qty'    => $borrowing->quantity_borrowed,
                        'borrower'        => $borrowing->borrower_name,
                        'days_out'        => $daysOut,
                        'return_status'   => $isLate ? 'late' : 'on_time',
                        'days_late'       => $daysLate,
                        'stock_level'     => $item->available_quantity === 0
                                                ? 'out_of_stock'
                                                : ($item->available_quantity <= ($item->quantity * 0.2) ? 'low_stock' : 'ok'),
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

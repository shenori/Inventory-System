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

            if ($item->quantity < $request->quantity_borrowed) {
                throw new \Exception('Not enough stock available');
            }

            $item->quantity -= $request->quantity_borrowed;
            $item->status = 'borrowed';
            $item->save();

            $borrowing = Borrowing::create($request->all());

            AuditLog::create([
                'user_id'        => auth()->id(),
                'action'         => 'item.borrowed',
                'auditable_type' => Item::class,
                'auditable_id'   => $item->id,
                'old_values'     => ['quantity' => $item->quantity + $request->quantity_borrowed, 'status' => 'in-store'],
                'new_values'     => ['quantity' => $item->quantity, 'status' => 'borrowed'],
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
            $item = Item::lockForUpdate()->findOrFail($borrowing->item_id);

            $item->quantity += $borrowing->quantity_borrowed;
            $item->status = $item->quantity > 0 ? 'in-store' : $item->status;
            $item->save();

            $borrowing->update([
                'status'      => 'returned',
                'returned_at' => now(),
            ]);

            AuditLog::create([
                'user_id'        => auth()->id(),
                'action'         => 'item.returned',
                'auditable_type' => Item::class,
                'auditable_id'   => $item->id,
                'old_values'     => ['status' => 'borrowed'],
                'new_values'     => ['quantity' => $item->quantity, 'status' => $item->status],
            ]);
        });

        return response()->json($borrowing->fresh()->load('item'));
    }

    public function show(Borrowing $borrowing)
    {
        return response()->json($borrowing->load('item'));
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ItemController extends Controller
{
    public function index()
    {
        return response()->json(Item::with('place.cupboard')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'          => 'required|string',
            'code'          => 'required|string|unique:items',
            'quantity'      => 'required|integer|min:0',
            'serial_number' => 'nullable|string',
            'image'         => 'nullable|image|max:2048',
            'description'   => 'nullable|string',
            'place_id'      => 'required|exists:places,id',
            'status'        => 'in:in-store,borrowed,damaged,missing',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('items', 'public');
        }

        $item = Item::create([
            'name'          => $request->name,
            'code'          => $request->code,
            'quantity'      => $request->quantity,
            'serial_number' => $request->serial_number,
            'description'   => $request->description,
            'place_id'      => $request->place_id,
            'status'        => $request->status,
            'image'         => $imagePath,
        ]);

        AuditLog::create([
            'user_id'        => auth()->id(),
            'action'         => 'item.created',
            'auditable_type' => Item::class,
            'auditable_id'   => $item->id,
            'old_values'     => null,
            'new_values'     => $item->toArray(),
        ]);

        return response()->json($item->load('place.cupboard'), 201);
    }

    public function show(Item $item)
    {
        return response()->json($item->load('place.cupboard', 'borrowings'));
    }

    public function update(Request $request, Item $item)
    {
        $old = $item->toArray();

        $imagePath = $item->image;
        if ($request->hasFile('image')) {
            if ($item->image) {
                Storage::disk('public')->delete($item->image);
            }
            $imagePath = $request->file('image')->store('items', 'public');
        }

        $item->update([
            'name'          => $request->name,
            'code'          => $request->code,
            'quantity'      => $request->quantity,
            'serial_number' => $request->serial_number,
            'description'   => $request->description,
            'place_id'      => $request->place_id,
            'status'        => $request->status,
            'image'         => $imagePath,
        ]);

        AuditLog::create([
            'user_id'        => auth()->id(),
            'action'         => 'item.updated',
            'auditable_type' => Item::class,
            'auditable_id'   => $item->id,
            'old_values'     => $old,
            'new_values'     => $item->toArray(),
        ]);

        return response()->json($item->load('place.cupboard'));
    }

    public function updateQuantity(Request $request, Item $item)
    {
        $request->validate([
            'type'   => 'required|in:increment,decrement',
            'amount' => 'required|integer|min:1',
        ]);

        DB::transaction(function () use ($request, $item) {
            $item = Item::lockForUpdate()->find($item->id);
            $oldQty = $item->quantity;

            if ($request->type === 'decrement') {
                if ($item->quantity < $request->amount) {
                    throw new \Exception('Insufficient quantity');
                }
                $item->quantity -= $request->amount;
            } else {
                $item->quantity += $request->amount;
            }

            $item->save();

            AuditLog::create([
                'user_id'        => auth()->id(),
                'action'         => 'item.quantity.updated',
                'auditable_type' => Item::class,
                'auditable_id'   => $item->id,
                'old_values'     => ['quantity' => $oldQty],
                'new_values'     => ['quantity' => $item->quantity],
            ]);
        });

        return response()->json($item->fresh());
    }

    public function destroy(Item $item)
    {
        if ($item->image) {
            Storage::disk('public')->delete($item->image);
        }
        $item->delete();
        return response()->json(['message' => 'Item deleted']);
    }
}
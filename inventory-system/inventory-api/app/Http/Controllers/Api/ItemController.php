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
            'status'        => $request->status ?? 'in-store',
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

        $request->validate([
            'name'          => 'sometimes|required|string',
            'code'          => 'sometimes|required|string|unique:items,code,' . $item->id,
            'quantity'      => 'sometimes|required|integer|min:0',
            'serial_number' => 'nullable|string',
            'image'         => 'nullable|image|max:2048',
            'description'   => 'nullable|string',
            'place_id'      => 'sometimes|required|exists:places,id',
            'status'        => 'sometimes|in:in-store,borrowed,damaged,missing',
        ]);

        $imagePath = $item->image;
        if ($request->hasFile('image')) {
            if ($item->image) {
                Storage::disk('public')->delete($item->image);
            }
            $imagePath = $request->file('image')->store('items', 'public');
        }

        $item->update([
            'name'          => $request->input('name', $item->name),
            'code'          => $request->input('code', $item->code),
            'quantity'      => $request->input('quantity', $item->quantity),
            'serial_number' => $request->input('serial_number', $item->serial_number),
            'description'   => $request->input('description', $item->description),
            'place_id'      => $request->input('place_id', $item->place_id),
            'status'        => $request->input('status', $item->status),
            'image'         => $imagePath,
        ]);

        // Build a focused diff of what actually changed
        $new = $item->fresh()->toArray();
        $changedOld = [];
        $changedNew = [];
        foreach ($new as $key => $value) {
            if (isset($old[$key]) && $old[$key] !== $value) {
                $changedOld[$key] = $old[$key];
                $changedNew[$key] = $value;
            }
        }

        // Detect status change for a richer action label
        $action = 'item.updated';
        if (isset($changedNew['status'])) {
            $action = 'item.status.changed';
        } elseif (isset($changedNew['quantity'])) {
            $action = 'item.quantity.updated';
        }

        AuditLog::create([
            'user_id'        => auth()->id(),
            'action'         => $action,
            'auditable_type' => Item::class,
            'auditable_id'   => $item->id,
            'old_values'     => $changedOld ?: $old,
            'new_values'     => $changedNew ?: $new,
        ]);

        return response()->json($item->load('place.cupboard'));
    }

    public function updateQuantity(Request $request, Item $item)
    {
        $request->validate([
            'type'   => 'required|in:increment,decrement',
            'amount' => 'required|integer|min:1',
        ]);

        $result = null;

        DB::transaction(function () use ($request, $item, &$result) {
            $lockedItem = Item::lockForUpdate()->find($item->id);
            $oldQty = $lockedItem->quantity;

            if ($request->type === 'decrement') {
                if ($lockedItem->quantity < $request->amount) {
                    throw new \Exception('Insufficient quantity');
                }
                $lockedItem->quantity -= $request->amount;
            } else {
                $lockedItem->quantity += $request->amount;
            }

            $lockedItem->save();

            $change = $lockedItem->quantity - $oldQty; // negative for decrement

            AuditLog::create([
                'user_id'        => auth()->id(),
                'action'         => 'item.quantity.updated',
                'auditable_type' => Item::class,
                'auditable_id'   => $lockedItem->id,
                'old_values'     => [
                    'quantity' => $oldQty,
                ],
                'new_values'     => [
                    'quantity' => $lockedItem->quantity,
                    'change'   => $change,    // e.g. -5 or +3
                    'type'     => $request->type,
                ],
            ]);

            $result = $lockedItem->fresh();
        });

        return response()->json($result);
    }

    public function destroy(Item $item)
    {
        // Log before deleting so we keep a record of what existed
        AuditLog::create([
            'user_id'        => auth()->id(),
            'action'         => 'item.deleted',
            'auditable_type' => Item::class,
            'auditable_id'   => $item->id,
            'old_values'     => $item->toArray(),
            'new_values'     => null,
        ]);

        if ($item->image) {
            Storage::disk('public')->delete($item->image);
        }

        $item->delete();

        return response()->json(['message' => 'Item deleted']);
    }
}

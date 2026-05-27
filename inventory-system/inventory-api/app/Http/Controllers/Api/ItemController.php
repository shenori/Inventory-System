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
            'name'             => $request->name,
            'code'             => $request->code,
            'quantity'         => $request->quantity,
            'borrowed_quantity' => 0,           // always starts at 0
            'serial_number'    => $request->serial_number,
            'description'      => $request->description,
            'place_id'         => $request->place_id,
            'status'           => $request->status ?? 'in-store',
            'image'            => $imagePath,
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

        // When manually adjusting total quantity, ensure it never goes below
        // what is already borrowed
        if ($request->has('quantity')) {
            if ($request->quantity < $item->borrowed_quantity) {
                return response()->json([
                    'message' => 'Total quantity cannot be less than borrowed quantity (' . $item->borrowed_quantity . ')',
                ], 422);
            }
        }

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

        $new = $item->fresh()->toArray();
        $changedOld = [];
        $changedNew = [];
        foreach ($new as $key => $value) {
            if (isset($old[$key]) && $old[$key] !== $value) {
                $changedOld[$key] = $old[$key];
                $changedNew[$key] = $value;
            }
        }

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
            $oldQty       = $lockedItem->quantity;
            $oldAvailable = $lockedItem->available_quantity;

            if ($request->type === 'decrement') {
                // Cannot reduce total below what is already borrowed
                if ($lockedItem->available_quantity < $request->amount) {
                    throw new \Exception(
                        'Only ' . $lockedItem->available_quantity . ' available to remove. ' .
                        $lockedItem->borrowed_quantity . ' currently borrowed.'
                    );
                }
                $lockedItem->quantity -= $request->amount;
            } else {
                $lockedItem->quantity += $request->amount;
            }

            $lockedItem->save();

            $change = $lockedItem->quantity - $oldQty;

            AuditLog::create([
                'user_id'        => auth()->id(),
                'action'         => 'item.quantity.updated',
                'auditable_type' => Item::class,
                'auditable_id'   => $lockedItem->id,
                'old_values'     => [
                    'quantity'           => $oldQty,
                    'available_quantity' => $oldAvailable,
                ],
                'new_values'     => [
                    'quantity'           => $lockedItem->quantity,
                    'available_quantity' => $lockedItem->available_quantity,
                    'change'             => $change,
                    'type'               => $request->type,
                ],
            ]);

            $result = $lockedItem->fresh();
        });

        return response()->json($result);
    }

    public function destroy(Item $item)
    {
        // Block deletion if any items are still borrowed
        if ($item->borrowed_quantity > 0) {
            return response()->json([
                'message' => 'Cannot delete item. ' . $item->borrowed_quantity . ' unit(s) are still borrowed.',
            ], 422);
        }

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

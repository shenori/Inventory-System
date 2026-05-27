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
            'name'              => $request->name,
            'code'              => $request->code,
            'quantity'          => $request->quantity,
            'borrowed_quantity' => 0,
            'serial_number'     => $request->serial_number,
            'description'       => $request->description,
            'place_id'          => $request->place_id,
            'status'            => $request->status ?? 'in-store',
            'image'             => $imagePath,
        ]);

        AuditLog::create([
            'user_id'        => auth()->id(),
            'action'         => 'item.created',
            'auditable_type' => Item::class,
            'auditable_id'   => $item->id,
            'old_values'     => null,
            'new_values'     => [
                'name'      => $item->name,
                'code'      => $item->code,
                'total'     => $item->quantity,
                'available' => $item->available_quantity,
                'borrowed'  => 0,
                'status'    => $item->status,
                'place_id'  => $item->place_id,
            ],
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

        $new = $item->fresh();

        // Detect what kind of change this was
        $action = 'item.updated';
        $changedFields = [];

        if ($old['status'] !== $new->status) {
            $action = 'item.status.changed';
            $changedFields[] = 'status';
        }
        if ($old['quantity'] !== $new->quantity) {
            $action = 'item.quantity.updated';
            $changedFields[] = 'quantity';
        }
        if ($old['name'] !== $new->name)        $changedFields[] = 'name';
        if ($old['place_id'] !== $new->place_id) $changedFields[] = 'place';

        AuditLog::create([
            'user_id'        => auth()->id(),
            'action'         => $action,
            'auditable_type' => Item::class,
            'auditable_id'   => $item->id,
            'old_values'     => [
                'name'      => $old['name'],
                'status'    => $old['status'],
                'total'     => $old['quantity'],
                'available' => $old['quantity'] - ($old['borrowed_quantity'] ?? 0),
                'borrowed'  => $old['borrowed_quantity'] ?? 0,
                'place_id'  => $old['place_id'],
            ],
            'new_values'     => [
                'name'           => $new->name,
                'status'         => $new->status,
                'total'          => $new->quantity,
                'available'      => $new->available_quantity,
                'borrowed'       => $new->borrowed_quantity,
                'place_id'       => $new->place_id,
                'changed_fields' => $changedFields,
            ],
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
            $lockedItem   = Item::lockForUpdate()->find($item->id);
            $oldTotal     = $lockedItem->quantity;
            $oldAvailable = $lockedItem->available_quantity;
            $oldBorrowed  = $lockedItem->borrowed_quantity;

            if ($request->type === 'decrement') {
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

            $change       = $lockedItem->quantity - $oldTotal;
            $newAvailable = $lockedItem->available_quantity;

            AuditLog::create([
                'user_id'        => auth()->id(),
                'action'         => 'item.quantity.updated',
                'auditable_type' => Item::class,
                'auditable_id'   => $lockedItem->id,
                'old_values'     => [
                    'total'     => $oldTotal,
                    'available' => $oldAvailable,
                    'borrowed'  => $oldBorrowed,
                ],
                'new_values'     => [
                    'total'       => $lockedItem->quantity,
                    'available'   => $newAvailable,
                    'borrowed'    => $oldBorrowed,        // borrowed didn't change
                    'change'      => $change,             // e.g. -5 or +10
                    'type'        => $request->type,
                    'stock_level' => $newAvailable === 0
                                        ? 'out_of_stock'
                                        : ($newAvailable <= ($lockedItem->quantity * 0.2) ? 'low_stock' : 'ok'),
                ],
            ]);

            $result = $lockedItem->fresh();
        });

        return response()->json($result);
    }

    public function destroy(Item $item)
    {
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
            'old_values'     => [
                'name'      => $item->name,
                'code'      => $item->code,
                'total'     => $item->quantity,
                'available' => $item->available_quantity,
                'borrowed'  => $item->borrowed_quantity,
                'status'    => $item->status,
            ],
            'new_values'     => null,
        ]);

        if ($item->image) {
            Storage::disk('public')->delete($item->image);
        }

        $item->delete();

        return response()->json(['message' => 'Item deleted']);
    }
}

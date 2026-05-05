<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cupboard;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class CupboardController extends Controller
{
    public function index()
    {
        return response()->json(Cupboard::with('places')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string',
            'location'    => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $cupboard = Cupboard::create($request->only(['name', 'location', 'description']));

        AuditLog::create([
            'user_id'        => auth()->id(),
            'action'         => 'cupboard.created',
            'auditable_type' => Cupboard::class,
            'auditable_id'   => $cupboard->id,
            'old_values'     => null,
            'new_values'     => $cupboard->toArray(),
        ]);

        return response()->json($cupboard, 201);
    }

    public function show(Cupboard $cupboard)
    {
        return response()->json($cupboard->load('places'));
    }

    public function update(Request $request, Cupboard $cupboard)
    {
        $request->validate([
            'name'        => 'sometimes|required|string',
            'location'    => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $old = $cupboard->toArray();
        $cupboard->update($request->only(['name', 'location', 'description']));

        AuditLog::create([
            'user_id'        => auth()->id(),
            'action'         => 'cupboard.updated',
            'auditable_type' => Cupboard::class,
            'auditable_id'   => $cupboard->id,
            'old_values'     => $old,
            'new_values'     => $cupboard->toArray(),
        ]);

        return response()->json($cupboard);
    }

    public function destroy(Cupboard $cupboard)
    {
        $old = $cupboard->toArray();

        $cupboard->delete();

        AuditLog::create([
            'user_id'        => auth()->id(),
            'action'         => 'cupboard.deleted',
            'auditable_type' => Cupboard::class,
            'auditable_id'   => $old['id'],
            'old_values'     => $old,
            'new_values'     => null,
        ]);

        return response()->json(['message' => 'Cupboard deleted']);
    }
}
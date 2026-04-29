<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Place;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class PlaceController extends Controller
{
    public function index()
    {
        return response()->json(Place::with('cupboard')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'cupboard_id' => 'required|exists:cupboards,id',
            'name'        => 'required|string',
            'description' => 'nullable|string',
        ]);

        $place = Place::create($request->all());

        AuditLog::create([
            'user_id'        => auth()->id(),
            'action'         => 'place.created',
            'auditable_type' => Place::class,
            'auditable_id'   => $place->id,
            'old_values'     => null,
            'new_values'     => $place->toArray(),
        ]);

        return response()->json($place, 201);
    }

    public function show(Place $place)
    {
        return response()->json($place->load('cupboard'));
    }

    public function update(Request $request, Place $place)
    {
        $old = $place->toArray();
        $place->update($request->all());

        AuditLog::create([
            'user_id'        => auth()->id(),
            'action'         => 'place.updated',
            'auditable_type' => Place::class,
            'auditable_id'   => $place->id,
            'old_values'     => $old,
            'new_values'     => $place->toArray(),
        ]);

        return response()->json($place);
    }

    public function destroy(Place $place)
    {
        $place->delete();
        return response()->json(['message' => 'Place deleted']);
    }
}
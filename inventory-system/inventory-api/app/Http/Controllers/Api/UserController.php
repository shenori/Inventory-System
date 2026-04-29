<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string',
            'email'    => 'required|email|unique:users',
            'password' => 'required|min:6',
            'role'     => 'required|in:admin,staff',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
        ]);

        AuditLog::create([
            'user_id'        => auth()->id(),
            'action'         => 'user.created',
            'auditable_type' => User::class,
            'auditable_id'   => $user->id,
            'old_values'     => null,
            'new_values'     => ['name' => $user->name, 'email' => $user->email, 'role' => $user->role],
        ]);

        return response()->json($user, 201);
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }
}
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
            // Never log password hash — only safe fields
            'new_values'     => [
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ]);

        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        return response()->json($user);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name'     => 'sometimes|required|string',
            'email'    => 'sometimes|required|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|nullable|min:6',
            'role'     => 'sometimes|required|in:admin,staff',
        ]);

        $oldSafe = [
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role,
        ];

        if ($request->filled('name'))  $user->name  = $request->name;
        if ($request->filled('email')) $user->email = $request->email;
        if ($request->filled('role'))  $user->role  = $request->role;
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        $newSafe = [
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role,
        ];

        // Detect role change for a richer action label
        $action = 'user.updated';
        if ($oldSafe['role'] !== $newSafe['role']) {
            $action = 'user.role.changed';
        } elseif ($request->filled('password')) {
            $action = 'user.password.changed';
        }

        // Only record what actually changed
        $changedOld = array_diff_assoc($oldSafe, $newSafe);
        $changedNew = array_diff_assoc($newSafe, $oldSafe);

        if ($request->filled('password')) {
            $changedNew['password'] = '(changed)';  // never store the hash
        }

        AuditLog::create([
            'user_id'        => auth()->id(),
            'action'         => $action,
            'auditable_type' => User::class,
            'auditable_id'   => $user->id,
            'old_values'     => $changedOld ?: $oldSafe,
            'new_values'     => $changedNew ?: $newSafe,
        ]);

        return response()->json($user);
    }

    public function destroy(User $user)
    {
        // Log before deleting
        AuditLog::create([
            'user_id'        => auth()->id(),
            'action'         => 'user.deleted',
            'auditable_type' => User::class,
            'auditable_id'   => $user->id,
            'old_values'     => [
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
            'new_values'     => null,
        ]);

        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminUserResource;
use App\Http\Resources\SchoolClassResource;
use App\Models\AdminAuditLog;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function users(Request $request)
    {
        $validated = $request->validate([
            'search' => 'nullable|string|max:100',
        ]);

        $query = User::query()->latest();

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $paginated = $query->paginate(25);

        return AdminUserResource::collection($paginated);
    }

    public function classes()
    {
        $classes = SchoolClass::query()
            ->with('owner:id,name,email')
            ->withCount('members')
            ->latest()
            ->paginate(25);

        return SchoolClassResource::collection($classes);
    }

    public function suspend(Request $request, User $user)
    {
        if ($request->user()->is($user)) {
            return response()->json([
                'message' => 'Um administrador não pode suspender a própria conta.',
            ], 422);
        }

        if ($user->is_platform_admin) {
            return response()->json([
                'message' => 'Administradores da plataforma não podem ser suspensos.',
            ], 422);
        }

        $user->forceFill(['is_suspended' => true])->save();
        $user->tokens()->delete();

        AdminAuditLog::create([
            'actor_user_id' => $request->user()->id,
            'target_user_id' => $user->id,
            'action' => 'user.suspended',
        ]);

        return response()->json([
            'message' => 'Usuário suspenso e sessões revogadas.',
        ]);
    }

    public function unsuspend(Request $request, User $user)
    {
        $user->forceFill(['is_suspended' => false])->save();

        AdminAuditLog::create([
            'actor_user_id' => $request->user()->id,
            'target_user_id' => $user->id,
            'action' => 'user.unsuspended',
        ]);

        return response()->json([
            'message' => 'Usuário reativado.',
        ]);
    }
}

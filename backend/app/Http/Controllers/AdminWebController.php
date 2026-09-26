<?php

namespace App\Http\Controllers;

use App\Models\AdminAuditLog;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class AdminWebController extends Controller
{
    public function loginForm(): View
    {
        return view('admin.login');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials)) {
            return back()->withErrors(['email' => 'Credenciais inválidas.'])->onlyInput('email');
        }

        if (! $request->user()->is_platform_admin || $request->user()->is_suspended) {
            Auth::logout();

            return back()->withErrors(['email' => 'Acesso restrito à administração da plataforma.'])->onlyInput('email');
        }

        $request->session()->regenerate();

        return redirect()->route('admin.dashboard');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }

    public function dashboard(Request $request): View
    {
        $filters = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'string'],
            'action' => ['sometimes', 'string'],
        ]);

        $search = trim($filters['search'] ?? '');

        $allowedStatuses = ['todos', 'ativos', 'suspensos'];
        $rawStatus = $filters['status'] ?? 'todos';
        $userStatusFilter = in_array($rawStatus, $allowedStatuses, true) ? $rawStatus : 'todos';

        $allowedActions = ['user.suspended', 'user.unsuspended'];
        $rawAction = $filters['action'] ?? '';
        $actionFilter = in_array($rawAction, $allowedActions, true) ? $rawAction : '';

        $users = User::query()
            ->select(['id', 'name', 'email', 'is_suspended', 'created_at'])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($builder) use ($search): void {
                    $builder->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($userStatusFilter === 'ativos', function ($query): void {
                $query->where('is_suspended', false);
            })
            ->when($userStatusFilter === 'suspensos', function ($query): void {
                $query->where('is_suspended', true);
            })
            ->latest()
            ->paginate(20, ['*'], 'page')
            ->withQueryString();

        $classes = SchoolClass::query()
            ->with('owner:id,name,email')
            ->withCount('members')
            ->latest()
            ->limit(10)
            ->get();

        $auditLogs = AdminAuditLog::query()
            ->with(['actor:id,name,email', 'target:id,name,email'])
            ->when($actionFilter !== '', function ($query) use ($actionFilter): void {
                $query->where('action', $actionFilter);
            })
            ->latest()
            ->paginate(20, ['*'], 'audit_page')
            ->withQueryString();

        $metrics = [
            'total_users' => User::count(),
            'active_users' => User::where('is_suspended', false)->count(),
            'suspended_users' => User::where('is_suspended', true)->count(),
            'total_classes' => SchoolClass::count(),
            'total_audit_logs' => AdminAuditLog::count(),
        ];

        return view('admin.dashboard', compact(
            'users',
            'classes',
            'auditLogs',
            'search',
            'metrics',
            'userStatusFilter',
            'actionFilter'
        ));
    }

    public function suspend(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->is($user)) {
            return back()->withErrors(['admin' => 'A própria conta não pode ser suspensa.']);
        }

        if ($user->is_platform_admin) {
            return back()->withErrors(['admin' => 'Administradores da plataforma não podem ser suspensos.']);
        }

        $user->forceFill(['is_suspended' => true])->save();
        $user->tokens()->delete();
        AdminAuditLog::create([
            'actor_user_id' => $request->user()->id,
            'target_user_id' => $user->id,
            'action' => 'user.suspended',
        ]);

        return back()->with('status', 'Usuário suspenso e sessões revogadas.');
    }

    public function unsuspend(Request $request, User $user): RedirectResponse
    {
        $user->forceFill(['is_suspended' => false])->save();
        AdminAuditLog::create([
            'actor_user_id' => $request->user()->id,
            'target_user_id' => $user->id,
            'action' => 'user.unsuspended',
        ]);

        return back()->with('status', 'Usuário reativado.');
    }
}

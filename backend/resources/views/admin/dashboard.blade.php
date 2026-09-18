<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Console · ANOT</title>
    @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    @endif
</head>
<body class="min-h-screen bg-slate-100 text-slate-900">
    <header class="border-b border-slate-200 bg-slate-950 text-white">
        <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <div><p class="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">ANOT · Console</p><h1 class="mt-1 text-2xl font-bold">Administração da plataforma</h1></div>
            <form method="POST" action="{{ route('admin.logout') }}">@csrf<button class="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">Sair</button></form>
        </div>
    </header>
    <main class="mx-auto max-w-7xl space-y-8 px-6 py-8">
        @if (session('status'))<div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{{ session('status') }}</div>@endif
        @if ($errors->any())<div class="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">{{ $errors->first() }}</div>@endif
        <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h2 class="text-xl font-bold">Usuários</h2><p class="text-sm text-slate-500">Controle de acesso e estado das contas.</p></div><form method="GET" class="flex gap-2"><input name="search" value="{{ $search }}" placeholder="Nome ou e-mail" class="rounded-lg border border-slate-300 px-3 py-2 text-sm"><button class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Buscar</button></form></div>
            <div class="mt-6 overflow-x-auto"><table class="w-full min-w-[680px] text-left text-sm"><thead class="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th class="px-3 py-3">Usuário</th><th class="px-3 py-3">Cadastro</th><th class="px-3 py-3">Estado</th><th class="px-3 py-3 text-right">Ação</th></tr></thead><tbody class="divide-y divide-slate-100">@forelse ($users as $user)<tr><td class="px-3 py-4"><div class="font-semibold">{{ $user->name }}</div><div class="text-slate-500">{{ $user->email }}</div></td><td class="px-3 py-4 text-slate-500">{{ $user->created_at?->format('d/m/Y') }}</td><td class="px-3 py-4">@if ($user->is_suspended)<span class="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">Suspenso</span>@else<span class="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Ativo</span>@endif</td><td class="px-3 py-4 text-right">@if (! auth()->user()->is($user))<form method="POST" action="{{ route($user->is_suspended ? 'admin.users.unsuspend' : 'admin.users.suspend', $user) }}">@csrf<button class="rounded-lg border px-3 py-2 text-xs font-semibold {{ $user->is_suspended ? 'border-emerald-300 text-emerald-700' : 'border-rose-300 text-rose-700' }}">{{ $user->is_suspended ? 'Reativar' : 'Suspender' }}</button></form>@else<span class="text-xs text-slate-400">Sua conta</span>@endif</td></tr>@empty<tr><td colspan="4" class="px-3 py-8 text-center text-slate-500">Nenhum usuário encontrado.</td></tr>@endforelse</tbody></table></div>
            <div class="mt-5">{{ $users->links() }}</div>
        </section>
        <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 class="text-xl font-bold">Turmas recentes</h2><div class="mt-4 grid gap-3 md:grid-cols-2">@forelse ($classes as $class)<article class="rounded-xl border border-slate-200 p-4"><div class="flex items-start justify-between gap-4"><div><h3 class="font-semibold">{{ $class->name }}</h3><p class="mt-1 text-sm text-slate-500">{{ $class->course }} · {{ $class->institution }}</p></div><span class="text-sm font-semibold text-cyan-700">{{ $class->members_count }} membros</span></div><p class="mt-3 text-xs text-slate-500">Responsável: {{ $class->owner?->name ?? 'N/A' }}</p></article>@empty<p class="text-sm text-slate-500">Nenhuma turma cadastrada.</p>@endforelse</div></section>
        <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div class="flex items-center justify-between"><div><h2 class="text-xl font-bold">Auditoria recente</h2><p class="text-sm text-slate-500">Ações críticas executadas no console.</p></div><span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{{ $auditLogs->count() }} registros</span></div><div class="mt-4 divide-y divide-slate-100">@forelse ($auditLogs as $log)<div class="flex flex-col gap-1 py-3 text-sm md:flex-row md:items-center md:justify-between"><span><strong>{{ $log->action }}</strong> · {{ $log->target?->email ?? 'conta removida' }}</span><span class="text-xs text-slate-500">por {{ $log->actor?->email ?? 'sistema' }} · {{ $log->created_at?->format('d/m/Y H:i') }}</span></div>@empty<p class="py-4 text-sm text-slate-500">Nenhuma ação administrativa registrada.</p>@endforelse</div></section>
    </main>
</body>
</html>

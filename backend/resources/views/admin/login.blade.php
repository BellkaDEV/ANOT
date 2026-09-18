<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Administração · ANOT</title>
    @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    @endif
</head>
<body class="min-h-screen bg-slate-950 text-slate-100">
    <main class="mx-auto flex min-h-screen max-w-md items-center px-6">
        <section class="w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <p class="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">ANOT · Console</p>
            <h1 class="text-3xl font-bold">Administração da plataforma</h1>
            <p class="mt-3 text-sm text-slate-400">Acesso exclusivo para administradores globais.</p>
            @if ($errors->any())
                <div class="mt-6 rounded-lg border border-rose-900 bg-rose-950/50 p-3 text-sm text-rose-200">{{ $errors->first() }}</div>
            @endif
            <form method="POST" action="{{ route('admin.login.submit') }}" class="mt-8 space-y-5">
                @csrf
                <label class="block text-sm font-medium">E-mail<input name="email" type="email" required value="{{ old('email') }}" class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3" autocomplete="email"></label>
                <label class="block text-sm font-medium">Senha<input name="password" type="password" required class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3" autocomplete="current-password"></label>
                <button class="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300">Entrar no console</button>
            </form>
        </section>
    </main>
</body>
</html>

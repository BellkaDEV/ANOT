<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Informações oficiais do aplicativo ANOT.">
    <title>{{ $title }} · ANOT</title>
    <style>
        :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: #10233f; background: #f4f7fb; }
        body { margin: 0; line-height: 1.65; }
        header { background: #102f5b; color: white; padding: 28px 20px; }
        nav, main, footer { max-width: 820px; margin: 0 auto; }
        nav { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        nav a { color: white; text-decoration: none; font-weight: 700; }
        nav span { opacity: .8; font-size: .9rem; }
        main { box-sizing: border-box; margin-top: 28px; margin-bottom: 28px; padding: 32px; background: white; border-radius: 18px; box-shadow: 0 8px 28px rgba(16, 47, 91, .08); }
        h1 { margin-top: 0; line-height: 1.2; color: #102f5b; }
        h2 { margin-top: 28px; color: #173f73; }
        a { color: #145bb5; }
        .muted { color: #60708a; }
        footer { padding: 0 20px 36px; color: #60708a; font-size: .9rem; }
        footer a { margin-right: 16px; }
        @media (max-width: 640px) { main { margin: 16px; padding: 24px 20px; } nav { align-items: flex-start; flex-direction: column; } }
    </style>
</head>
<body>
    <header><nav><a href="{{ url('/') }}">ANOT</a><span>Informações oficiais do aplicativo</span></nav></header>
    <main>@yield('content')</main>
    <footer>
        <a href="{{ route('legal.privacy') }}">Privacidade</a>
        <a href="{{ route('legal.terms') }}">Termos</a>
        <a href="{{ route('legal.support') }}">Suporte</a>
        <p>Última atualização: {{ config('app.legal_updated_at', '18/09/2026') }}</p>
    </footer>
</body>
</html>

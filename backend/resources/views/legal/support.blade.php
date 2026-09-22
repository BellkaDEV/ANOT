@extends('legal.layout', ['title' => 'Suporte'])

@section('content')
<h1>Suporte ANOT</h1>
<p>Encontrou um erro, perdeu o acesso ou precisa solicitar exclusão da conta? Envie uma mensagem para <a href="mailto:{{ config('app.support_email', 'suporte@anot.app') }}">{{ config('app.support_email', 'suporte@anot.app') }}</a>.</p>

<h2>Inclua na mensagem</h2>
<ul>
    <li>e-mail da conta, sem enviar sua senha;</li>
    <li>descrição do problema e passos para reproduzi-lo;</li>
    <li>modelo do dispositivo e versão do aplicativo, quando relevante.</li>
</ul>

<p class="muted">Nunca envie senha, token de sessão ou código de recuperação por e-mail.</p>
@endsection

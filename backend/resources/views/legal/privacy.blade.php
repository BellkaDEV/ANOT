@extends('legal.layout', ['title' => 'Política de Privacidade'])

@section('content')
<h1>Política de Privacidade</h1>
<p class="muted">Esta página descreve, em linguagem simples, como o ANOT trata os dados necessários para oferecer seus recursos acadêmicos.</p>

<h2>1. Dados utilizados</h2>
<p>O ANOT pode tratar nome, e-mail, credenciais protegidas, vínculo com turmas, atividades, avisos, eventos e registros de progresso. Dados técnicos mínimos, como logs de segurança e informações de sessão, podem ser registrados para manter o serviço disponível e protegido.</p>

<h2>2. Finalidades</h2>
<p>Usamos esses dados para autenticar usuários, organizar turmas, permitir colaboração acadêmica, enviar mensagens transacionais — como confirmação de e-mail e recuperação de senha —, prevenir abuso e atender solicitações de suporte.</p>

<h2>3. Compartilhamento e segurança</h2>
<p>Não vendemos dados pessoais. O acesso é limitado ao necessário para operar o serviço e pode envolver provedores de hospedagem, banco de dados, e-mail e monitoramento contratados pelo projeto. Aplicamos autenticação, controle de permissões, expiração de sessão, auditoria administrativa e práticas de backup; nenhum sistema conectado à internet oferece risco zero.</p>

<h2>4. Retenção e exclusão</h2>
<p>Os dados são mantidos enquanto a conta e as obrigações operacionais exigirem. O usuário pode solicitar exclusão da conta pelo aplicativo ou pelo canal de suporte. Registros que precisem ser preservados por segurança, auditoria ou obrigação legal serão mantidos somente pelo período necessário.</p>

<h2>5. Seus direitos e contato</h2>
<p>Para dúvidas, correções, solicitações de acesso ou exclusão, fale com o suporte em <a href="mailto:{{ config('app.support_email', 'suporte@anot.app') }}">{{ config('app.support_email', 'suporte@anot.app') }}</a>. O conteúdo deve ser revisado pelo responsável legal do projeto antes do lançamento público.</p>
@endsection

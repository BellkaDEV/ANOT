@extends('legal.layout', ['title' => 'Termos de Uso'])

@section('content')
<h1>Termos de Uso</h1>
<p class="muted">Ao usar o ANOT, você concorda com as regras abaixo e se compromete a utilizar a plataforma de forma responsável.</p>

<h2>1. Finalidade do serviço</h2>
<p>O ANOT oferece ferramentas para organização acadêmica, comunicação de turma, atividades, avisos e eventos. O serviço pode evoluir, ser temporariamente interrompido para manutenção ou exigir atualizações do aplicativo.</p>

<h2>2. Conta e responsabilidade</h2>
<p>Informe dados verdadeiros, proteja sua senha e não compartilhe tokens ou links privados. Cada usuário é responsável pelas ações realizadas em sua conta e por respeitar as regras da instituição ou turma.</p>

<h2>3. Uso aceitável</h2>
<p>É proibido tentar acessar turmas ou contas sem autorização, publicar conteúdo ilícito ou abusivo, explorar falhas, automatizar requisições de forma prejudicial ou utilizar o ANOT para assédio e fraude. Contas podem ser suspensas após análise de segurança.</p>

<h2>4. Conteúdo e disponibilidade</h2>
<p>O usuário mantém a responsabilidade pelo conteúdo que publica. O ANOT não garante disponibilidade ininterrupta nem se responsabiliza por decisões acadêmicas tomadas exclusivamente com base em informações publicadas por usuários.</p>

<h2>5. Encerramento e suporte</h2>
<p>Você pode solicitar a exclusão da conta. Para reportar abuso, erro ou problema de acesso, consulte a página de <a href="{{ route('legal.support') }}">suporte</a>. Estes termos devem ser revisados e aprovados pelo responsável legal do projeto antes da publicação.</p>
@endsection

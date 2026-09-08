# Planejamento de retomada — ANOT

Atualizado em 24 de agosto de 2026.

## Onde o projeto parou

Estamos na fase de **estabilização das funcionalidades recentes**. Foram adicionados recursos de grupos em trabalhos, campos específicos para provas/testes, detalhe de avisos e melhorias de formulário (teclado, data e horário). As alterações ainda estão **sem commit** e o diretório de trabalho está propositalmente com modificações pendentes.

O plano de riscos e produção continua em `CODEX/Concertar.md`.

## O que foi feito

### Banco e backend

- As migrations de grupos e avaliações foram criadas e agora estão aplicadas no banco SQLite local:
  - `2026_08_25_000001_add_group_and_test_fields_to_activities_table`
  - `2026_08_25_000002_create_activity_groups_tables`
- A tabela `activities` recebeu campos para modalidade de trabalho, tamanho de grupo, formato da avaliação e pontuação.
- Foram adicionados modelos, controller e rotas para grupos de atividade, membros e convites.
- Atividades do tipo trabalho podem ser individuais ou em grupos; os grupos são calculados excluindo o owner da turma.
- Foram incluídos testes para grupos, prova/teste e detalhe de avisos.

### Mobile

- Formulário de atividade possui campos próprios para trabalho em grupo e teste/prova.
- Avisos passaram a ter prévia compacta e tela de detalhe.
- Foram incluídos componentes de calendário, campo de data, campo de hora e tratamento de teclado.
- Formulários foram revisados para usar a estrutura de teclado/scroll adicionada.
- O mapper principal passou a reconhecer campos novos de atividade e `content` em avisos.

## Estado validado agora

| Verificação | Resultado |
| --- | --- |
| Migrations locais | Todas aplicadas; nenhuma migration nova pendente. |
| PHPUnit | Passou: 35 testes e 117 assertions. |
| TypeScript | Passou: `npx tsc --noEmit` com código 0. |
| Auditoria Composer | Não registrada nesta retomada; executar novamente antes de deploy. |

## Atenções antes de continuar

- Há arquivos modificados e novos no worktree. Não usar `git reset --hard`, `git checkout --`, `migrate:fresh` ou `db:wipe`.
- Não houve commit nem push.
- A execução dos testes usa banco isolado; ela não substitui teste manual com o app apontando ao banco local.
- Se o Laravel estiver rodando em outro terminal, reiniciá-lo após migrations/configurações relevantes.

## Próxima etapa — executar primeiro

Fazer um smoke test manual completo no app conectado ao backend local, registrando qualquer mensagem de erro exibida:

1. Login e logout.
2. Criar uma turma e entrar em outra com código.
3. Criar, editar, abrir detalhe e excluir aviso.
4. Criar atividade comum.
5. Criar teste/prova com formato e pontuação; editar incluindo valor `0` e “não informado”.
6. Criar trabalho individual.
7. Criar trabalho em grupos; entrar, sair, convidar, aceitar/recusar convite, editar descrição do grupo e expulsar membro.
8. Testar teclado em descrições e notas longas.
9. Testar calendário, horário e tema claro/escuro.

Erros reais encontrados nesse teste devem ser corrigidos antes de iniciar nova feature visual.

## Próxima etapa crítica — segurança e integridade

Após o smoke test, seguir a ordem abaixo, baseada em `CODEX/Concertar.md`:

1. **Autorização de membros:** garantir que `GET /api/classes/{id}/members` só responda a membros da turma; reduzir exposição de e-mail.
2. **Integridade concorrente de grupos:** impedir por garantia de banco/transação que um aluno entre em dois grupos da mesma atividade sob requisições simultâneas.
3. **Segredos e Docker:** remover `APP_KEY` e credenciais do `docker-compose`, fechar porta pública do banco em produção e remover bind mount do código em produção.
4. **Sessão mobile:** substituir token em `AsyncStorage` por armazenamento seguro, validar `/me` ao iniciar e tratar 401 globalmente.
5. **URL da API:** remover IP local/HTTP fixos e configurar `EXPO_PUBLIC_API_URL` com HTTPS em produção.
6. **Sanctum e autenticação:** expiração/revogação de token, senha mais forte, rate limits específicos, recuperação de senha e verificação de e-mail quando o serviço de e-mail estiver configurado.
7. **CI e staging:** pipeline de TypeScript, PHPUnit, auditorias, migrations e documentação de release/rollback.

## Comandos de retomada

```text
git status --short

cd backend
php artisan migrate:status
php vendor/bin/phpunit
composer audit --locked

cd ../mobile
npx tsc --noEmit
```

## Definição de pronto para o próximo checkpoint

- Smoke test manual concluído sem erros de API ou interface.
- Migrations aplicadas e registradas como `Ran`.
- PHPUnit e TypeScript verdes.
- Correções críticas de autorização e concorrência revisadas.
- Nenhuma nova feature iniciada antes de estabilizar os fluxos atuais.

---
title: Mapa de Tarefas e Entregas
tipo: mapa-visual
tags:
  - anot
  - mapa
  - entregas
  - roadmap
criado: 2026-09-08
---

# 🗺️ Mapa de Tarefas & Ciclo de Entregas — ANOT

> Roadmap executivo e técnico do ANOT, conectando cada entrega ao plano, evidência, dependências e critério de pronto. A ordem dentro de cada fase segue risco, prioridade e dependência.

## Visão de status

| Status | Significado |
|---|---|
| ✅ Concluído | Implementado e coberto por validação registrada. |
| 🟡 Parcial | Há código ou decisão iniciada, mas faltam cobertura, integração ou validação de produção. |
| ⏳ Planejado | Ainda não implementado. |
| ⚠️ Bloqueado | Depende de decisão, serviço externo ou pré-requisito ainda inexistente. |

## Fase 0: Concluído (histórico)

| Código | Entrega | Status atual | Prioridade | Complexidade | Dependências | Área |
|---|---|---|:---:|:---:|---|---|
| F0-A | Fundação Laravel 13, Sanctum, SQLite local e contrato inicial de autenticação | ✅ Concluído | P0 | L | — | backend |
| F0-B | Fundação Expo/React Native, telas públicas, login, cadastro e navegação principal | ✅ Concluído | P0 | XL | F0-A | mobile |
| F0-C | CRUD de turmas, código de ingresso e papéis owner/representante/aluno | ✅ Concluído | P0 | XL | F0-A, F0-B | backend/mobile |
| F0-D | CRUD de avisos, atividades, eventos e progresso pessoal | ✅ Concluído | P1 | XL | F0-C | backend/mobile |
| F0-E | Teclado, scroll, campos de data/hora, tema claro/escuro inicial e estados vazios | ✅ Concluído | P2 | L | F0-B | mobile/ux |
| F0-F | Trabalho individual/grupo, avaliações, grupos, convites, detalhe de aviso, migrations e testes iniciais | 🟡 Parcial | P1 | XL | F0-D | backend/mobile |

## Fase 1: Pré-deploy obrigatório (bloqueadores)

| Código | Entrega | Status atual | Prioridade | Complexidade | Dependências | Área |
|---|---|---|:---:|:---:|---|---|
| F1-A | Smoke test manual ponta a ponta: login, turmas, avisos, atividades, grupos, calendário e temas | ⏳ Planejado | P0 | M | F0-F | mobile/backend |
| F1-B | Remover segredos versionados, rotacionar chaves e separar `.env` de desenvolvimento/staging/produção | 🟡 Parcial | P0 | M | F1-A | infra |
| F1-C | Fechar autorização de `GET /classes/{id}/members` e revisar exposição de dados pessoais | 🟡 Parcial | P0 | M | F0-C | backend |
| F1-D | Centralizar autorização em Policies/Gates para turma, membro, aviso, atividade e grupo | 🟡 Parcial | P0 | L | F1-C | backend |
| F1-E | Impedir acesso direto por ID de não-membros em todos os endpoints e criar matriz owner/rep/student/non-member | ⏳ Planejado | P0 | L | F1-D | backend |
| F1-F | Garantir ingresso e criação de associação de turma de forma atômica, idempotente e resistente a colisão | 🟡 Parcial | P0 | L | F1-E | backend |
| F1-G | Impedir que requisições concorrentes coloquem o mesmo aluno em dois grupos da atividade | 🟡 Parcial | P0 | XL | F1-F | backend |
| F1-H | Configurar URL da API por ambiente, bloquear HTTP em produção e validar certificado/domínio | 🟡 Parcial | P0 | M | F1-B | mobile/infra |
| F1-I | Consolidar sessão por dispositivo: SecureStore, `/me` no boot, 401 global, expiração e revogação | 🟡 Parcial | P0 | L | F1-H | backend/mobile |
| F1-J | Fortalecer autenticação: senha forte também no cliente, erro genérico, recuperação e verificação de e-mail | 🟡 Parcial | P0 | XL | F1-I | backend/mobile |
| F1-L | Remover todos os fallbacks que simulam sucesso local após falha de API | 🟡 Parcial | P0 | L | F1-A | mobile |
| F1-M | Substituir QR pseudoaleatório por QR real com payload canônico e ação para abrir o modal | ⏳ Planejado | P0 | M | F1-H | mobile |
| F1-N | Implementar scanner com permissão, validação de payload, QR inválido, turma fechada e fluxo manual | ⏳ Planejado | P0 | L | F1-M | mobile |
| F1-O | Completar deep links Expo, listener com app aberto/fechado e fallback HTTPS compartilhável | 🟡 Parcial | P0 | L | F1-M | mobile/infra |
| F1-Q | Substituir `TODAY_ISO`, meses fixos e datas de protótipo por relógio real, timezone e API | ⏳ Planejado | P0 | L | F1-A | mobile/backend |
| F1-R | Eliminar contas demo, mocks e ações decorativas; validar avisos, eventos, migrations, PHPUnit, TypeScript e Composer audit como gate | 🟡 Parcial | P0 | L | F1-L, F1-Q | mobile/backend/infra |

## Fase 2: Qualidade e estabilidade

| Código | Entrega | Status atual | Prioridade | Complexidade | Dependências | Área |
|---|---|---|:---:|:---:|---|---|
| F2-A | Cobertura de testes da matriz de autorização, acessos diretos por ID e concorrência de join/grupo/convite | 🟡 Parcial | P1 | XL | F1-E, F1-G | backend |
| F2-C | API Resources consistentes, contratos tipados e minimização de e-mail/avatar em respostas | ⏳ Planejado | P1 | L | F1-D | backend/mobile |
| F2-D | Paginação de turmas, membros, avisos, atividades e eventos; eliminar N+1 e cargas excessivas | ⏳ Planejado | P1 | L | F2-C | backend |
| F2-E | Validação uniforme de datas, horários, timezone, textos, limites, enumerações e pontuação | 🟡 Parcial | P1 | L | F1-Q | backend |
| F2-F | Idempotência de mutações mobile, chaves de requisição e retry seguro após perda de rede | ⏳ Planejado | P1 | XL | F1-L | backend/mobile |
| F2-G | Estados reais de loading, vazio, erro, retry e sincronização; remover `setTimeout` artificial | 🟡 Parcial | P1 | M | F1-L | mobile/ux |
| F2-H | Rollback de status/notas quando o progresso falhar e indicador salvo/salvando/falhou | ⏳ Planejado | P1 | M | F2-F, F2-G | mobile |
| F2-I | ThemeProvider único, tokens semânticos, tema Sistema/Claro/Escuro persistente e contraste validado | 🟡 Parcial | P1 | L | F1-L | mobile/ux |
| F2-J | Confirmação e proteção para excluir turma, expulsar, rebaixar, regenerar código e limpar cache | 🟡 Parcial | P1 | M | F1-D | mobile/ux |
| F2-L | Acessibilidade: labels, foco, contraste, fonte ampliada, alvos de 44 px, reduced motion e haptics | ⏳ Planejado | P1 | L | F2-M | mobile/ux |
| F2-M | Sistema visual e componentes: Ionicons/AppIcon, badges sem emoji, headers, safe areas, tipografia, raios e estados vazios | 🟡 Parcial | P2 | L | F2-I | mobile/ux |
| F2-N | Documentar Laravel 13, arquitetura, ambiente, migrations, release, rollback e integridade de deleção | ⏳ Planejado | P1 | L | F1-R, F1-G | backend/infra |

## Fase 3: Produto completo (MVP real)

| Código | Entrega | Status atual | Prioridade | Complexidade | Dependências | Área |
|---|---|---|:---:|:---:|---|---|
| F3-A | Configurações completas de aparência, densidade, fonte, motion, haptics e preferências de notificação | 🟡 Parcial | P1 | L | F2-I, F2-L | mobile/ux |
| F3-B | Push, registro de dispositivo, permissões, timezone, lembretes configuráveis e resumo diário | ⏳ Planejado | P1 | XL | F3-A | backend/mobile/infra |
| F3-C | Feed de avisos persistido e dashboard acionável com hoje, próximos 7 dias, atrasadas e carga semanal | ⏳ Planejado | P1 | XL | F1-Q, F2-G | backend/mobile/ux |
| F3-D | Cache local, fila offline, reenvio idempotente, resolução de conflito e sincronização manual | ⏳ Planejado | P1 | XL | F2-F, F2-H | mobile/backend |
| F3-E | Anexos/links seguros e comentários/menções com moderação por atividade | ⏳ Planejado | P2 | XL | F2-N, F4-A | backend/mobile/infra |
| F3-F | Exportação ICS, busca global, filtros, etiquetas e Kanban pessoal | ⏳ Planejado | P2 | XL | F1-Q, F2-D | backend/mobile/ux |
| F3-G | Conta: senha/e-mail, sessões, biometria, exportação, exclusão e fluxos LGPD | ⏳ Planejado | P1 | XL | F1-J, F2-N | backend/mobile/infra |

## Fase 4: Escala e produção

| Código | Entrega | Status atual | Prioridade | Complexidade | Dependências | Área |
|---|---|---|:---:|:---:|---|---|
| F4-A | PostgreSQL gerenciado com rede privada, criptografia, backup automático e point-in-time recovery | ⏳ Planejado | P0 | XL | F1-B, F2-N | infra |
| F4-B | Docker imutável sem bind mount, banco privado, domínio, TLS, headers de segurança, CDN/WAF e edge rate limit | 🟡 Parcial | P0 | XL | F4-A | infra |
| F4-C | Ambientes isolados e CI/CD com TypeScript, PHPUnit, Pint, auditorias, integração e segredos próprios | 🟡 Parcial | P0 | XL | F1-B, F2-A | infra |
| F4-D | Release controlado com migration única, aprovação, smoke pós-deploy, rollback e versionamento | ⏳ Planejado | P0 | XL | F4-C | infra |
| F4-E | Observabilidade, métricas, alertas, tracing, fila, performance, RPO/RTO, restauração e runbook | ⏳ Planejado | P1 | XL | F4-A, F4-D | backend/infra |
| F4-F | Jobs para expiração/notificações/exportações/limpeza de tokens e otimização de índices/cache/payload | ⏳ Planejado | P1 | XL | F3-B, F4-E | backend/infra |

## Fase 5: Evolução pós-MVP

| Código | Entrega | Status atual | Prioridade | Complexidade | Dependências | Área |
|---|---|---|:---:|:---:|---|---|
| F5-A | Estatísticas privadas, convites com validade/limite/aprovação e colaboração avançada em trabalhos | ⏳ Planejado | P2 | XL | F3-C, F3-G | backend/mobile/ux |
| F5-B | Importação de calendário, exportação PDF/CSV e relatórios por turma | ⏳ Planejado | P2 | XL | F3-F, F3-G | backend/mobile |
| F5-C | Portal web de fallback/ajuda, multi-instituição, métricas de adoção e feedback privado | ⏳ Planejado | P3 | XL | F1-O, F4-B, F3-G | backend/mobile/infra |

## Gates de entrega

1. Nenhum item de Fase 3 ou Fase 5 deve iniciar enquanto F1-R não estiver verde e os bloqueadores P0 não tiverem evidência.
2. Um item só passa a ✅ quando houver implementação, teste adequado, revisão de segurança/UX quando aplicável e registro em [[Walkthroughs/]].
3. Cada entrega de código deve apontar para um plano em [[Planos de Implementação/]], branch, PR e evidência de teste.
4. Toda alteração de contrato de API deve atualizar backend, mobile, testes e documentação na mesma entrega.
5. O fluxo operacional permanece: plano → implementação → testes → walkthrough → revisão → aprovação de merge.

## Links de referência

- [[ANOT — Visão Geral]]
- [[Contexto e Arquitetura]]
- [[Diretrizes de Desenvolvimento]]
- [[CODEX/planejamento.md]]
- [[CODEX/Concertar.md]]
- [[Execução/Agentes/]]

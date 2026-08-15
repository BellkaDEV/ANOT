# BRIEFING COMPLETO — PROJETO ANOT

Você é um tech lead sênior e vai me dar um plano de execução 
detalhado e honesto com base no roadmap abaixo.

---

## CONTEXTO DO PROJETO

**Nome:** ANOT  
**Tipo:** App mobile (React Native / Expo)  
**Propósito:** Centralizar prazos (provas, trabalhos, seminários) 
e comunicados de turmas acadêmicas numa única fonte de verdade, 
substituindo grupos de WhatsApp e o SIGAA.

**Stack definida:**
- Frontend: Expo + TypeScript + React Navigation
- Backend: Laravel (hospedado no Railway)
- Banco: PostgreSQL via Supabase (500MB free)
- Auth: JWT com middleware único JwtAuth
- Build/Deploy: Expo EAS (30 builds/mês free)
- Notificações: Expo Push Notifications
- Avatares: DiceBear (seed = user_id)
- Monitoramento: Sentry + Laravel Telescope + UptimeRobot

**Perfis de usuário:**
- Representante: cria turma, gerencia membros, cria atividades 
  e avisos, vê progresso da turma
- Aluno: entra por código/link, acompanha feed, marca progresso 
  pessoal

**Dois itens JÁ concluídos:**
- Documento de Requisitos (SRS): BD convencional com users/email, 
  dois perfis com auth JWT, decisões de produto documentadas
- Wireframes e Protótipo (Figma): onboarding com cadastro real 
  e fluxo de entrada por código/link

---

## ROADMAP COMPLETO

### FASE 0 — Fundação e Planejamento
Itens pendentes (os 2 concluídos foram SRS e Figma):

1. Modelagem ER
   Tabelas: users (id, nome, email, password, role enum, 
   avatar_seed, created_at), turmas (nome, codigo, link_uuid, 
   representante_id), turma_user (user_id, turma_id, joined_at), 
   atividades, avisos, progresso (user_id + atividade_id + status)

2. Definição de Arquitetura Técnica
   Um único middleware JWT. Roles: representante/aluno definidos 
   em users.role. Mapear todas as rotas REST.

3. Setup de Repositórios e CI/CD
   Git flow, pipelines lint/test/build, ambientes dev e staging.

4. Backlog e Sprint Planning
   User stories BDD, priorização MoSCoW, board configurado.

5. Setup de Hospedagem Gratuita
   Railway (backend Laravel) + Supabase (PostgreSQL 500MB) + 
   Expo EAS (builds). Configurar variáveis de ambiente e SSL.

---

### FASE 1 — Core Backend: Auth & Turmas

1. Migrations e Models
   Tabelas conforme modelagem ER acima.

2. Autenticação JWT — Registro e Login
   POST /auth/registro (nome, email, senha, role)
   POST /auth/login → retorna Bearer token
   Middleware único JwtAuth cobre ambos os perfis.

3. CRUD de Turmas + Entrada por Código
   Criar turma gera código único + link_uuid.
   POST /turmas/{codigo}/entrar vincula user à turma (turma_user).
   Valida role de quem entra.

4. Remoção de Membro
   DELETE /turmas/{id}/membros/{user_id}
   Remove hard delete do vínculo turma_user.
   Representante vê nome + email antes de confirmar.

5. Testes de Auth e Turmas
   Fluxo JWT, roles, entrada por código, tentativa de escrita 
   por aluno (deve ser bloqueada).

---

### FASE 2 — Core Backend: Atividades, Avisos & Progresso

1. CRUD de Atividades
   Criar, editar, excluir (somente representante via role check), 
   listar por turma.

2. CRUD de Avisos
   Mesma lógica de permissões. Sem campo de status. 
   Type diferenciado no payload.

3. Endpoint de Progresso Individual
   PATCH /atividades/{id}/progresso
   Chave composta (user_id, atividade_id).
   user_id vem do JWT, não do body.
   Enum: pendente / fazendo / concluído.

4. Endpoint de Listagem do Feed
   GET /turmas/{id}/feed
   Retorna atividades e avisos mesclados.
   Injeta status pessoal do user autenticado via JOIN com progresso.

5. Endpoint de Listagem de Membros
   GET /turmas/{id}/membros (exclusivo do representante)
   Retorna nome, email, avatar_seed, data de entrada.

6. Testes de Integração das Rotas
   RBAC, payload, status codes.
   Casos críticos: aluno tentando criar, representante vendo 
   progresso alheio.

---

### FASE 3 — Frontend Mobile: Estrutura Base

1. Setup Expo + TypeScript
   Estrutura de pastas, aliases, ESLint/Prettier.
   React Navigation: Bottom Tabs + Stack + Modal.

2. Tema e Design System (Context API)
   ThemeContext dark/light, tokens de cor.
   Componentes base: Button, Card, Badge, StatusPill.

3. Serviço de Autenticação
   AuthContext: registro (nome + email + senha + role), 
   login, logout.
   Token JWT no SecureStore.
   Interceptor Axios injeta Bearer em todas as requisições.

4. Onboarding — Fluxo Aluno
   Registro → cola código ou abre link → entra na turma.
   Avatar DiceBear gerado com seed = user_id.
   Sem perda de progresso em troca de dispositivo.

5. Onboarding — Fluxo Representante
   Registro/login → cria ou acessa turma existente.
   JWT armazenado.

6. Gerenciamento de Estado Global
   Context ou Redux Toolkit: sessão JWT, dados de turmas, 
   feed com progresso.
   Refresh token automático.

---

### FASE 4 — Frontend Mobile: Telas Principais
(quero CHEGAR aqui, não necessariamente concluir)

1. Componente Avatar DiceBear
   Wrapper: seed = user_id (numérico). 
   Tamanhos sm/md/lg. Fallback com inicial do nome (offline).

2. Aba Mural (Feed)
   Cards com borda colorida por status. Filtros por pills. 
   FAB glassmorphism exclusivo do representante. Modal de cadastro.

3. Aba Calendário Dual-View
   Mensal (dots laranja) e semanal.
   Bottom Sheet com descrição completa + seletor de status pessoal.

4. Configurações — Painel Representante
   Lista de membros com nome + email + avatar + data de entrada 
   + botão remover (com confirmação). Código copiável. Toggle tema.

5. Configurações — Visão do Aluno
   Avatar + nome + email. Toggle tema. Lista de turmas vinculadas 
   com opção de sair. Botão logout limpa JWT.

6. Animações e Micro-interações
   Reanimated: transições de card, FAB, bottom sheet, 
   feedback háptico em mudança de status.

---

## O QUE EU PRECISO DE VOCÊ

Analise o roadmap acima e me entregue:

### 1. DIAGNÓSTICO DE DEPENDÊNCIAS
Para cada fase (0 a 3 completa + início da 4), liste quais itens 
BLOQUEIAM outros. O que precisa estar 100% pronto antes do próximo 
começar? Mostre isso como uma cadeia clara de dependências.

### 2. PASSO A PASSO EXECUTÁVEL
Para cada item de cada fase (0 → 3), me dê:
- O que exatamente fazer (não teoria, ação concreta)
- Qual arquivo criar / comando rodar / código escrever
- Como verificar que está funcionando (critério de done)
- Armadilhas comuns para evitar nesse item específico

### 3. ORDEM ÓTIMA DE EXECUÇÃO
Considerando que somos 4 pessoas (Kalleb, Guilherme, João Gabriel, 
Otávio), sugira como paralelizar as tarefas. Quem pode trabalhar 
em quê ao mesmo tempo sem conflito?

### 4. PONTOS DE RISCO
Quais são os 3 maiores riscos técnicos do projeto inteiro que 
podem atrasar ou quebrar tudo? Para cada um: qual o risco, 
quando ele aparece e como mitigar agora.

### 5. CHECKLIST PARA ENTRAR NA FASE 4
Me dê uma lista objetiva de tudo que precisa estar verde 
para considerar as fases 0, 1, 2 e 3 concluídas e começar 
a Fase 4 com segurança.

Seja direto. Sem enrolação. Priorize ação sobre teoria.
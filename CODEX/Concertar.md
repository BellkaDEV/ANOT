# Plano de correção e preparação para produção — ANOT

Data da análise: 24 de agosto de 2026.

## Diagnóstico

O ANOT possui uma base funcional de MVP, mas ainda não deve receber usuários reais em produção. A prioridade é corrigir segurança, autenticação móvel, autorização entre turmas, configuração de nuvem e automação de qualidade antes de ampliar funcionalidades.

## Prioridade 0 — bloquear riscos antes do deploy

1. **Remover e rotacionar segredos versionados.** `backend/docker-compose.yml` contém `APP_KEY` e credenciais PostgreSQL. Usar variáveis de ambiente e um cofre de segredos do provedor; nunca versionar nem reutilizar essas chaves em produção.
2. **Impedir acesso indevido à lista de membros.** `GET /api/classes/{id}/members` verifica somente a existência da turma. Exigir que o solicitante seja membro ou owner antes de retornar membros e seus dados.
3. **Usar HTTPS e URL configurável no aplicativo.** Remover o IP local fixo de `mobile/src/services/api.ts`; utilizar `EXPO_PUBLIC_API_URL` por ambiente e bloquear tráfego HTTP em produção.
4. **Guardar token em armazenamento protegido.** Substituir `AsyncStorage` por `expo-secure-store`. Ao iniciar, validar o token via `/me`; em resposta 401, limpar sessão e retornar ao login.
5. **Definir ciclo de vida de sessão.** Sanctum está com expiração nula. Adotar expiração, token por dispositivo, revogação de todas as sessões e limpeza programada de tokens expirados.
6. **Fortalecer cadastro e login.** Usar regra forte de senha, redefinição de senha, verificação de e-mail e rate limit por IP e e-mail. Manter erro genérico no login.
7. **Limitar tentativa de ingresso por código.** Criar rate limit próprio para `/classes/join`, registrar tentativas abusivas e tratar colisões de código/inscrição de forma atômica.

## Prioridade 1 — qualidade, privacidade e escala

1. Centralizar permissões em Laravel Policies/Gates e remover duplicação de regras nos controllers.
2. Criar testes da matriz completa: não-membro, aluno, representante e owner, incluindo acessos diretos por ID.
3. Aplicar paginação em turmas, membros, avisos, atividades e eventos; evitar consultas N+1.
4. Usar API Resources e devolver apenas os dados pessoais necessários; e-mail de membros não deve ser exposto por padrão.
5. Adicionar validações de formato de datas/horários, limites de tamanho para textos e tratamento idempotente para criações repetidas por falha de rede.
6. Criar trilha de auditoria para moderação e gestão de turma: promoção, expulsão, troca de código, abertura/fechamento e exclusão.
7. Implementar exclusão de conta, exportação de dados, política de retenção e fluxos LGPD.

## Nuvem e operação

1. Usar PostgreSQL gerenciado com backup automático, point-in-time recovery, criptografia e rede privada.
2. Não publicar a porta do banco. Remover o bind mount do código em containers de produção e gerar imagens imutáveis.
3. Usar domínio próprio, TLS, HSTS, `Referrer-Policy`, `Permissions-Policy`, rate limiting no edge e proteção WAF/CDN quando aplicável.
4. Executar migrations uma única vez como etapa controlada do release, não na subida concorrente de cada réplica.
5. Configurar healthcheck, logs estruturados sem dados sensíveis, monitoramento, alertas, métricas e testes de restauração de backup.
6. Manter ambientes isolados: desenvolvimento, staging e produção, cada um com banco e segredos próprios.
7. Criar CI/CD: TypeScript, PHPUnit, análise estática, auditoria de dependências, testes de integração, deploy com rollback e aprovação para produção.

## Produto e experiência

1. Finalizar notificações push, preferências de lembretes e timezone consistente.
2. Criar sincronização offline real: cache local, fila de operações, reenvio idempotente e resolução de conflito.
3. Configurar deep links reais no Expo (`scheme`, Android package e iOS bundle identifier) para que convites funcionem a partir de QR code e compartilhamento.
4. Alinhar a documentação: o repositório atual usa Laravel 13, não Laravel 11.

## Situação das verificações

As tentativas de validação neste ambiente não produziram um resumo final confiável para TypeScript e PHPUnit. Antes de deploy, executar e registrar os resultados em CI:

```text
cd mobile && npx tsc --noEmit
cd backend && php vendor/bin/phpunit
cd backend && composer audit --locked
```

## Revisão de frontend — protótipo versus funcionalidades reais

### Problemas funcionais encontrados

1. **QR code não é QR code.** `mobile/src/components/QRModal.tsx` declara explicitamente que é um placeholder e desenha uma grade pseudoaleatória. Nenhum leitor conseguirá decodificá-la. Deve gerar um QR real com o payload `anot://join?code=<CODIGO>` (ou URL HTTPS de fallback).
2. **O modal de QR está inacessível.** `qrVisible` é iniciado como `false` em `mobile/App.tsx`, mas não há ação que o defina como `true`. Portanto, mesmo o placeholder não pode ser aberto pela interface atual.
3. **“Escanear QR Code” é apenas decoração.** O card em `mobile/src/screens/JoinClassScreen.tsx` não possui `onPress`. Implementar leitura com `expo-camera`, solicitar permissão em tempo de execução, validar o payload e enviar o código ao mesmo fluxo de ingresso manual.
4. **Deep link ainda não está configurado.** O convite compartilha `anot://join?...`, porém `mobile/app.json` não define `scheme`, `android.package` nem `ios.bundleIdentifier`. Além disso, é preciso ouvir o link quando o app já estiver aberto e oferecer página web/HTTPS como fallback.
5. **Há fallbacks que gravam sucesso apenas na memória.** Em `mobile/App.tsx`, falhas de criar/excluir turma, criar/editar/excluir aviso, criar/editar/excluir atividade e moderar membros podem atualizar somente o estado local. Isso contradiz a regra de “zero mocks/fallbacks”: o usuário pode ver uma ação como concluída mesmo sem ela ter sido persistida no backend.
6. **O conteúdo dos avisos é perdido na conversão.** A API retorna `content`, mas `mapBackendClass` procura `description` ou `desc`. Resultado provável: avisos persistidos aparecem sem corpo no app. Mapear `a.content` para `desc`.
7. **Tela de login ainda exibe contas de demonstração.** `LoginScreen.tsx` importa e oferece `DEMO_ACCOUNTS`. Mesmo sem autenticação simulada, isso é inadequado para produção e induz erro de login. Remover do build de produção.
8. **Datas e calendário do fluxo principal são fixos.** `constants.ts` contém `TODAY_ISO` e meses de 2026 estáticos, utilizados por telas do protótipo. Substituir por data real, timezone do usuário e dados retornados pela API. Não manter em paralelo um calendário estático e outro conectado à API.
9. **Configurações de notificação são visuais.** Os dois switches de notificação em `SettingsScreen.tsx` são sempre ligados e têm `onChange: () => {}`. Devem desaparecer até existir persistência e push, ou ser implementados integralmente.
10. **Tema escuro é inconsistente e não persiste.** O toggle fica só no estado de `App.tsx`; ao reiniciar, volta ao claro. Alguns componentes usam `LIGHT`/`DARK`, enquanto outros usam `src/theme/theme.ts` estático. Esses componentes não reagem ao toggle. `app.json` também força `userInterfaceStyle: "light"`.

### Correção recomendada do QR e convite

1. Definir o deep link `anot` e identificadores nativos no Expo.
2. Adicionar gerador QR real e `expo-camera` para leitura.
3. Encodar o convite em uma URL HTTPS canônica, por exemplo `https://app.anot.com/join?code=7K9W2X`; o servidor web redireciona ao app quando instalado e mostra instruções/campo de código quando não estiver.
4. No scanner, aceitar apenas o domínio/prefixo esperado, extrair o código, confirmar a turma e chamar `POST /classes/join`.
5. Testar: câmera permitida/negada, QR inválido, turma fechada, código já usado, app fechado, app aberto e dispositivo sem app instalado.

## Recomendações de design e UX

### Tema escuro mais estético

1. **Criar um único `ThemeProvider`.** Definir tokens semânticos (`surface`, `surfaceElevated`, `textPrimary`, `textSecondary`, `accent`, `danger`, `divider`) e eliminar cores soltas em telas e componentes.
2. **Usar profundidade, não preto puro.** Sugestão: fundo `#0B1220`, superfície `#121C2B`, superfície elevada `#18263A`, borda `#263854`, texto `#E7EEF9` e texto secundário `#9BAEC8`. Manter o laranja um pouco mais luminoso, como `#FFAD45`, apenas para ações e prioridade.
3. **Reduzir azul saturado em grandes áreas.** Reservar o azul-marinho para cabeçalhos, navegação e foco; usar superfícies azul-acinzentadas para leitura longa. Isso deixa avisos e prazos mais confortáveis à noite.
4. **Aprimorar contraste dos estados.** Não reutilizar fundos claros de erro/sucesso no dark mode. Criar versões translúcidas escuras para badges e verificar contraste mínimo de textos e ícones.
5. **Adicionar microdetalhes consistentes.** Cards com borda sutil de 1 px, sombras discretas apenas em superfícies flutuantes, estados pressionados, foco visível e skeletons no mesmo tom do tema.
6. **Persistir preferência e oferecer “Sistema”.** Opções: Sistema, Claro e Escuro; salvar em armazenamento local e reagir a alterações do sistema.

### Melhorias de interface

1. Substituir loaders artificiais com `setTimeout` por estados reais de requisição, erro, retry e vazio.
2. Adicionar confirmação para ações destrutivas: excluir turma, expulsar membro, rebaixar e regenerar código.
3. Tornar a dashboard uma agenda acionável: “vence hoje”, “próximos 7 dias”, “atrasadas” e botão para concluir.
4. Exibir sync status discreto: salvo, salvando, sem conexão e falha ao sincronizar — nunca sinalizar êxito antes do servidor confirmar.
5. Padronizar cabeçalhos, safe area e navegação; hoje coexistem telas de estilos/arquiteturas diferentes.
6. Implementar acessibilidade: rótulos para leitores de tela, alvos de toque de pelo menos 44 px, suporte a fonte ampliada, contraste e feedback háptico opcional.

## Features recomendadas após a estabilização

1. Lembretes configuráveis por atividade (7 dias, 1 dia, 1 hora) e resumo diário.
2. Feed de avisos com leitura, fixação e filtro por prioridade.
3. Anexos e links em avisos/atividades, com antivírus, limites e URLs assinadas.
4. Comentários por atividade, menções e permissões claras de moderação.
5. Calendário integrado ao dispositivo via exportação ICS, não sincronização silenciosa.
6. Busca global por turma, aviso, atividade e disciplina.
7. Filtros, etiquetas e visão Kanban pessoal de atividades.
8. Estatísticas privadas: entregas concluídas, carga semanal e sequência de organização, sem ranking invasivo.
9. Convites com validade, limite de uso e opção de aprovação manual pelo representante para turmas sensíveis.
10. Exportação pessoal em PDF/CSV e importação de calendário acadêmico.

## Proposta visual — ícones profissionais, sem emojis de interface

Emojis devem ser removidos de badges, cards, estados vazios e textos de status. Eles mudam de aparência conforme sistema operacional, têm peso visual inconsistente e enfraquecem a linguagem acadêmica do ANOT. Podem permanecer apenas em conteúdo digitado pelo usuário.

### Sistema recomendado

1. Adotar exclusivamente **Ionicons** — já disponível no projeto — como biblioteca oficial. Não introduzir outra biblioteca enquanto ela cobrir os ícones necessários.
2. Criar um componente `AppIcon` que receba nome, tamanho, cor e acessibilidade. Assim, nomes de ícones e tamanhos não ficam espalhados pelas telas.
3. Padronizar pesos e tamanhos: 16 px para metadados, 20 px para ações em linha, 22–24 px para navegação e 28–32 px para estados vazios.
4. Usar ícone em uma superfície tonal (quadrado arredondado de 36/40 px) para categorias; não usar vários ícones coloridos soltos no mesmo card.
5. Cor comunica estado, não decoração: azul para navegação/informação, âmbar para prazo, vermelho para risco/erro, verde para concluído e roxo para evento. O desenho do ícone permanece coerente.

### Mapeamento sugerido

| Elemento atual | Substituição profissional |
| --- | --- |
| `📝 Dever` | `document-text-outline` |
| `🗂️ Trabalho` | `folder-open-outline` |
| `📊 Teste/Prova` | `school-outline` |
| `📌 Outros` | `bookmark-outline` |
| `🟢 Turma Aberta` | `checkmark-circle-outline` em verde |
| `🔴 Turma Fechada` | `lock-closed-outline` em vermelho |
| `🔔 Nenhum aviso` | `notifications-off-outline` |
| `📋 Nenhuma atividade` | `clipboard-outline` |
| sucesso genérico | `checkmark-circle-outline` |
| alerta/erro | `alert-circle-outline` |

Para badges, o texto deve ser “Aberta” / “Fechada”, acompanhado do ícone; não incluir bolinhas coloridas nem emoji no próprio texto. Isso melhora leitura por acessibilidade e mantém a mesma aparência em Android, iOS e web.

## Configurações — tela proposta para produto completo

A tela atual contém apenas o toggle visual de tema e dois switches sem persistência. Ela deve virar um centro de preferências, com cada opção conectada ao backend ou ao armazenamento local adequado.

### Estrutura recomendada

1. **Aparência**
   - Tema: Sistema, Claro ou Escuro.
   - Densidade: confortável ou compacta.
   - Tamanho do texto: padrão, grande ou extra grande.
   - Reduzir animações e feedback háptico.

2. **Notificações**
   - Permissão do sistema e estado atual.
   - Avisos da turma, novas atividades, alterações de prazo e eventos.
   - Lembretes configuráveis: 7 dias, 1 dia, 1 hora e no horário.
   - Horário silencioso e resumo diário/semanal.

3. **Calendário e tempo**
   - Fuso horário atual.
   - Primeiro dia da semana.
   - Exportar calendário (ICS).
   - Formatos de data e horário.

4. **Dados e sincronização**
   - Estado de sincronização, última sincronização e botão “Sincronizar agora”.
   - Uso de armazenamento offline e opção de limpar cache local.
   - Exportar meus dados.

5. **Conta e segurança**
   - E-mail verificado e opção de reenviar verificação.
   - Alterar senha, alterar e-mail e gerenciar dispositivos/sessões ativas.
   - Ativar biometria para abrir o app, se o dispositivo suportar.
   - Excluir conta em fluxo protegido por confirmação de senha.

6. **Privacidade e suporte**
   - Política de privacidade, termos, permissões concedidas e diagnóstico de conexão.
   - Central de ajuda, reportar problema e versão do aplicativo.

### Regras de UX para configurações

1. Um switch só pode aparecer se funcionar e for persistido. Enquanto não houver push, mostrar uma linha “Notificações em breve” sem controle interativo.
2. Opções perigosas (limpar cache, sair de todos os dispositivos, excluir conta) devem ficar separadas em “Zona de segurança” e exigir confirmação.
3. Informar efeito e estado atual de cada opção: por exemplo, “Tema: Escuro” ou “Última sincronização: agora”.
4. Não sobrecarregar a primeira tela: usar seções, páginas filhas para assuntos longos e busca em configurações quando o volume justificar.

## Outras melhorias de acabamento

1. Criar estados vazios específicos por contexto, com ícone profissional, uma frase curta e ação principal clara.
2. Substituir cards excessivamente arredondados por uma escala de raios consistente: 12 px para componentes, 16 px para cards e 24 px apenas para modais/hero cards.
3. Aplicar escala tipográfica fixa: 12 metadado, 14 corpo, 16 título de card, 20 título de página e 28 título de destaque.
4. Remover caixa alta excessiva; reservar para rótulos pequenos de seção. Ela reduz legibilidade em textos em português.
5. Dar prioridade visual a prazo e ação: data, disciplina e status devem ser mais fáceis de escanear que descrições longas.
6. Criar uma biblioteca interna de componentes: `AppIcon`, `StatusBadge`, `SettingRow`, `EmptyState`, `PageHeader`, `ConfirmDialog` e `SyncIndicator`.

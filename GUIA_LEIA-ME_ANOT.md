# Guia de contexto — projeto ANOT

Este pacote contém uma cópia bruta da pasta do projeto ANOT mantida no Obsidian. Os arquivos originais foram preservados; este guia foi adicionado somente à cópia para orientar quem precisar entender o projeto.

## O que é o ANOT

O ANOT é um aplicativo mobile de gestão acadêmica para alunos e representantes de turma. O sistema reúne turmas, membros, atividades, provas, trabalhos individuais ou em grupo, avisos, convites e eventos de calendário.

## Como ler o pacote

### Arquivos na raiz

- `ANOT — Visão Geral.md`: resumo do produto, stack, papéis e situação atual.
- `Contexto e Arquitetura.md`: arquitetura, tecnologias, modelo de dados, endpoints e decisões técnicas.
- `Diretrizes de Desenvolvimento.md`: regras para alterações, segurança, testes e manutenção.
- `Mapa de Tarefas e Entregas.md`: roadmap técnico, prioridades, dependências, evidências e critérios de pronto.

### `Execução/Agentes/`

Histórico de trabalho e comunicação do projeto. Cada registro descreve uma entrega, diagnóstico, evidência de teste, limitação conhecida e próximos passos.

- `INSTRUÇÕES.md`: protocolo de registro e comunicação.
- Subpastas por participante ou frente de trabalho: registros datados em Markdown.

### `Planos de Implementação/`

Planos detalhados para executar mudanças específicas. Cada plano explica objetivo, contexto, escopo, dependências, validações esperadas e condições de conclusão.

### `Walkthroughs/`

Explicações das entregas já realizadas. Servem para entender o que foi alterado, por que a solução foi escolhida, quais testes passaram e quais limites ainda existem.

## Tipos de arquivo

- `.md`: documentação em Markdown, legível no Obsidian, VS Code ou qualquer editor de texto.
- `INSTRUÇÕES.md`: contrato de organização e registro do trabalho.
- Arquivos com data no nome: registros cronológicos de execução ou planos associados a uma entrega.
- Títulos com `F1-`, `SEC-` ou nomes de funcionalidades: identificadores de frentes do roadmap, como segurança, sessão, autorização, convites e bugs mobile.

## Estado geral registrado

O núcleo do backend e do mobile está implementado: autenticação, turmas, membros, atividades, avisos, eventos, grupos, convites, QR Code e deep links. Também existem registros de segurança, autorização, idempotência e testes automatizados.

As pendências principais são validação em dispositivo físico, fechamento da matriz de autorização, revisão final de qualidade, configuração de staging/produção, backup, build de release e smoke test pós-deploy.

## Como usar sem perder contexto

1. Leia primeiro `ANOT — Visão Geral.md`.
2. Continue com `Contexto e Arquitetura.md`.
3. Consulte `Mapa de Tarefas e Entregas.md` para saber o que está concluído, parcial ou planejado.
4. Abra os planos antes de executar uma mudança.
5. Use os walkthroughs para conferir evidências e limitações.
6. Registre novas decisões e resultados em `Execução/Agentes/`, sem sobrescrever registros anteriores.

## Aviso sobre a cópia

Todos os arquivos do Obsidian foram copiados sem alteração de conteúdo. Este guia é o único arquivo adicional criado na cópia compactada.

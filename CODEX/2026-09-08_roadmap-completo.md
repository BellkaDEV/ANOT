# Roadmap completo do ANOT

**Data:** 2026-09-08
**Agente:** Codex

## Contexto

O pedido foi transformar o mapa existente, que tinha poucas entregas agregadas, em um roadmap profissional para o ANOT. A análise considerou o estado documentado em `CODEX/planejamento.md`, os riscos e recomendações de `CODEX/Concertar.md`, o contrato atual de `backend/routes/api.php`, o fluxo central de `mobile/App.tsx` e os modelos de dados do backend.

O código já cobre uma base funcional de autenticação, turmas, membros, avisos, atividades, eventos e grupos de trabalho. Porém, parte das correções de segurança e produção está apenas parcialmente implementada, e alguns componentes continuam explicitamente prototipais, como o QR pseudoaleatório e o calendário com datas fixas.

## O que foi feito

Foi reestruturado o mapa em seis blocos: histórico concluído, pré-deploy obrigatório, qualidade e estabilidade, produto completo, escala/produção e evolução pós-MVP. O novo mapa contém 50 entregas identificadas por código único, cada uma com status atual, prioridade, complexidade, dependências e área responsável.

As dependências foram ordenadas para colocar autorização, integridade concorrente, sessão, URL segura, remoção de falsos sucessos, QR/deep links, datas reais e gates de validação antes de notificações, offline, anexos e funcionalidades de crescimento. Também foram incluídos itens adicionais observados no código: API Resources e minimização de dados, paginação/N+1, rollback de progresso, consistência atividade-evento, integridade de deleção, observabilidade e release controlado.

## Impacto

O roadmap agora separa claramente o que existe do que está pronto para produção. Itens com código iniciado, mas sem cobertura ou integração completa, foram marcados como parciais em vez de concluídos. Isso evita que a presença de uma implementação preliminar seja confundida com uma entrega validada.

O mapa passa a ser utilizável como instrumento de execução: cada trabalho futuro tem um identificador estável, uma ordem de dependência e um critério implícito de gate. A Fase 1 bloqueia o deploy; as Fases 2 e 3 elevam a qualidade e completam o MVP; as Fases 4 e 5 tratam escala e evolução sem misturar riscos de produção com novas features.

## Próximos passos / pontos de atenção

O próximo agente deve começar pelo smoke test manual e registrar evidências. Em seguida, deve priorizar autorização por turma, matriz de testes, integridade concorrente dos grupos, sessão segura, remoção dos falsos sucessos e configuração de release.

Há divergências entre o diagnóstico histórico e o estado atual do repositório; elas devem ser resolvidas por evidência de teste e não por suposição. Antes de marcar qualquer item como concluído, atualizar o status do mapa, criar o plano técnico correspondente e registrar o walkthrough.

Também é importante manter a separação entre melhorias de produto e requisitos de segurança. Push, offline, anexos e busca são valiosos, mas não devem antecipar os gates de autorização, privacidade, observabilidade, backup, rollback e ambientes isolados.

## Atualizações

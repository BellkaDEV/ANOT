# Diagrama de Caso de Uso — ANOT

> **Arquivo fonte:** `diagrama-caso-de-uso.puml`  
> **Renderizar em:** [PlantUML Online](https://www.plantuml.com/plantuml/uml/) | VS Code (extensão PlantUML) | IntelliJ | Confluence | GitHub Actions com `plantuml`

---

## Como abrir o diagrama

1. Acesse [plantuml.com/plantuml/uml](https://www.plantuml.com/plantuml/uml/)
2. Cole o conteúdo do arquivo `.puml`
3. O diagrama será renderizado automaticamente

Ou instale a extensão **PlantUML** no VS Code e abra o arquivo `.puml` com `Alt+D`.

---

## Legenda das relações

| Notação | Tipo | Significado |
|---------|------|-------------|
| `A --|> B` | **Generalização (herança)** | A herda todos os casos de uso de B |
| `UC1 .> UC2 : <<include>>` | **Include** | UC1 sempre executa UC2 obrigatoriamente |
| `UC3 .> UC1 : <<extend>>` | **Extend** | UC3 pode opcionalmente estender UC1, dado um ponto de extensão |

---

## Hierarquia de Atores (Herança)

```
Usuário Não Autenticado
    └── Aluno                      (herda: registrar, login, logout...)
            └── Representante      (herda: tudo do Aluno + CRUD atividades/avisos/membros)
                    └── Criador    (herda: tudo do Representante + criar/excluir turma, rebaixar rep.)
```

O **Criador** é o ator com maior poder — acumula todos os casos de uso dos atores acima. O papel é atribuído dinamicamente: quem cria a turma é o Criador; quem entra por código é Aluno; Alunos podem ser promovidos a Representante pelo Criador ou por outro Representante.

---

## Relações <<include>> — o que sempre acontece junto

| Caso de uso base | Include obrigatório | Por quê |
|-----------------|--------------------|---------| 
| Fazer login | Validar credenciais | Não é possível logar sem validar |
| Entrar em turma por código | Validar código de acesso | O sistema sempre verifica se o código existe |
| Criar turma | Gerar código único + Gerar QR Code | Toda turma gerada tem esses dois recursos obrigatoriamente |
| Excluir turma | Confirmar exclusão | Toda exclusão exige confirmação |
| Criar atividade | Validar campos + Sincronizar evento no calendário | A atividade só é criada com dados válidos e sempre gera evento |
| Editar atividade | Sincronizar evento no calendário | A alteração de data/tipo reflete no calendário sempre |
| Excluir atividade | Confirmar exclusão + Remover evento vinculado | O evento gerado automaticamente também é removido |
| Criar aviso | Definir prioridade + Calcular data de expiração | Toda criação exige prioridade e a expiração é calculada (21 dias) |
| Excluir aviso | Confirmar exclusão | Toda exclusão exige confirmação |
| Promover a Representante | Verificar role atual | Sistema verifica se o alvo realmente é Aluno |
| Rebaixar a Aluno | Verificar permissão exclusiva do Dono | Só o Criador pode rebaixar — o sistema sempre valida |
| Expulsar membro | Confirmar expulsão + Verificar proteção do Criador | Não é possível expulsar sem confirmação, e o Criador é protegido |

---

## Relações <<extend>> — o que acontece opcionalmente

| Caso de uso base | Extension | Ponto de extensão |
|-----------------|-----------|-------------------|
| Entrar em turma por código | Exibir preview da turma | Somente se o código for válido e a turma for encontrada |
| Visualizar lista de atividades | Filtrar por tipo | Somente se um filtro for selecionado |
| Visualizar lista de atividades | Buscar por texto | Somente se o usuário digitar no campo de busca |
| Criar atividade | Adicionar horário de entrega | Somente se o toggle "Adicionar horário" for ativado |
| Visualizar avisos | Buscar aviso por texto | Somente se o usuário digitar na busca |
| Visualizar avisos | Marcar aviso como lido | Somente se o usuário clicar num aviso |
| Visualizar avisos | Marcar todos como lidos | Somente se o usuário clicar no botão dedicado |
| Visualizar calendário | Navegar entre meses | Somente se o usuário clicar nas setas de navegação |
| Visualizar calendário | Filtrar eventos por tipo | Somente se um chip de tipo for selecionado |
| Visualizar calendário | Selecionar dia | Somente se o usuário tocar em um dia específico |
| Selecionar dia no calendário | Exibir eventos do dia | Somente se o dia selecionado tiver eventos cadastrados |

---

## Subsistemas e seus casos de uso

### 1. Autenticação
- Registrar conta ← `UA`
- Fazer login ← `UA` **[include]** Validar credenciais
- Recuperar senha ← `UA`
- Fazer logout ← `Aluno`

### 2. Gestão de Turmas
- Visualizar turmas do usuário ← `Aluno`
- Entrar em turma por código ← `Aluno` **[include]** Validar código **[extend]** Exibir preview
- Criar turma ← `Criador` **[include]** Gerar código + Gerar QR Code
- Editar dados da turma ← `Criador`
- Compartilhar link de acesso ← `Criador`
- Excluir turma ← `Criador` **[include]** Confirmar exclusão

### 3. Gestão de Atividades
- Visualizar lista ← `Aluno` **[extend]** Filtrar / Buscar
- Visualizar detalhe ← `Aluno`
- Atualizar progresso pessoal ← `Aluno`
- Registrar notas pessoais ← `Aluno`
- Criar atividade ← `Representante` **[include]** Validar + Sincronizar calendário **[extend]** Adicionar horário
- Editar atividade ← `Representante` **[include]** Sincronizar calendário
- Excluir atividade ← `Representante` **[include]** Confirmar + Remover evento

### 4. Gestão de Avisos
- Visualizar avisos ← `Aluno` **[extend]** Buscar / Marcar lido / Marcar todos
- Criar aviso ← `Representante` **[include]** Definir prioridade + Calcular expiração
- Editar aviso ← `Representante`
- Excluir aviso ← `Representante` **[include]** Confirmar exclusão

### 5. Calendário de Eventos
- Visualizar calendário ← `Aluno` **[extend]** Navegar meses / Filtrar tipo / Selecionar dia
- Selecionar dia ← extensão do calendário **[extend]** Exibir eventos do dia

### 6. Gestão de Membros
- Visualizar membros ← `Representante`
- Ver detalhe do membro ← `Representante`
- Promover a Representante ← `Representante` **[include]** Verificar role atual
- Rebaixar a Aluno ← `Criador` **[include]** Verificar permissão exclusiva do Dono
- Expulsar membro ← `Representante` **[include]** Confirmar + Verificar proteção do Criador

### 7. Perfil e Preferências
- Editar nome do perfil ← `Aluno`
- Alternar modo escuro ← `Aluno`
- Configurar notificações push ← `Aluno`
- Visualizar sobre o app ← `Aluno`

---

## Restrições de negócio expressas no diagrama

1. O Criador **nunca** pode ser expulso ou rebaixado — garantido pelo `<<include>>` "Verificar proteção do Criador"
2. "Rebaixar a Aluno" é **exclusivo do Criador** — garantido pelo `<<include>>` "Verificar permissão exclusiva do Dono"
3. Avisos sempre têm expiração calculada em 21 dias — garantido pelo `<<include>>` no "Criar aviso"
4. Toda atividade sincroniza automaticamente com o calendário — garantido pelo `<<include>>` em "Criar atividade" e "Editar atividade"
5. A exclusão de atividade remove o evento vinculado no calendário — garantido pelo `<<include>>` "Remover evento vinculado"

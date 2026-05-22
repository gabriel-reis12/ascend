---
status: investigating
trigger: "Usuário não consegue acessar rotina para incluir exercícios e não consegue cadastrar exercícios na rotina"
created: 2026-05-05
updated: 2026-05-05
---

## Symptoms
- **Expected**: Clicar na rotina (Treino A) abre painel de gerenciamento onde posso adicionar exercícios
- **Actual**: Botão de gerenciar está oculto (opacity-0) e só aparece no hover. Após adicionar exercício, a lista não atualiza (selectedRoutine stale)
- **Errors**: Nenhum erro no console, apenas comportamento incorreto
- **Timeline**: Desde a implementação da Fase 5
- **Reproduction**: Ir em "Minhas Rotinas" → tentar editar uma rotina → tentar adicionar exercício

## Current Focus
- hypothesis: "Dois bugs independentes: (1) UX: botão de gerenciar escondido demais; (2) State Bug: selectedRoutine não é atualizado após fetchData(), causando lista de exercícios stale"
- next_action: "Corrigir ambos: tornar botão de gerenciar sempre visível e sincronizar selectedRoutine com routines após fetchData()"
- test: "Clicar em card de rotina abre gerenciador; após adicionar exercício ele aparece na lista"
- expecting: "Modal de gerenciar abre ao clicar no card; exercícios adicionados aparecem imediatamente"

## Evidence
- timestamp: 2026-05-05T00:17:00Z
  finding: "Botão editar em linha 546-555: `opacity-0 group-hover:opacity-100` - invisível por padrão"
- timestamp: 2026-05-05T00:17:00Z
  finding: "fetchData() em linha 941 recarrega routines[], mas selectedRoutine (linha 82) não é atualizado - é uma cópia stale do objeto"
- timestamp: 2026-05-05T00:17:00Z
  finding: "Modal de gerenciar: após insert em routine_exercises (linha 933-941), selectedRoutine.exercises continua com estado antigo"

## Eliminated
- hypothesis: "Bug de banco de dados"
  reason: "Dados estão sendo salvos corretamente, problema é puramente de estado/UX no frontend"

## Resolution
- root_cause: "Dois problemas: (1) Botão de editar oculto por padrão; (2) selectedRoutine é referência stale após fetchData()"
- fix: "Pendente aplicação"
- verification: ""
- files_changed: []

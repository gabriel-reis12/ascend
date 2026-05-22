# SOP: Manutenção Contínua e Arquivamento

Este procedimento deve ser executado ao final de cada tarefa significativa ou sessão de trabalho.

## Objetivos
- Manter o projeto limpo e organizado.
- Garantir rastreabilidade de mudanças históricas.
- Evitar perda de lógica que pode ser reutilizada no futuro.

## Protocolo

### 1. Triagem de Arquivos
- Identifique arquivos modificados que tornaram outros obsoletos.
- Identifique rascunhos de planejamento (`.txt`, `.md`) que já foram integrados ao código ou planejamento oficial.
- **Ação:** Mova esses arquivos para a pasta `obsoleto/`. Se forem arquivos de sistema importantes, use prefixos como `BACKUP-`.

### 2. Atualização de Histórico
- Abra o arquivo `HISTORY.md`.
- Adicione uma entrada para a data atual (ou atualize a existente).
- Liste:
  - Funcionalidades novas ou alteradas.
  - Refatorações técnicas importantes.
  - Lista de arquivos movidos para `obsoleto/`.

### 3. Check-point de Planejamento
- Verifique se o `ROADMAP.md` em `.planning/` reflete o estado atual.
- Se um Milestone (versão ou conjunto de fases) foi concluído:
  - Crie uma pasta em `.planning/milestones/vX.Y-phases/`.
  - Copie os arquivos de planejamento atuais para lá como registro histórico.

## Edge Cases
- **Conflito de Nomes:** Se mover um arquivo para `obsoleto/` que já existe lá, adicione um timestamp ao nome (ex: `loader-2026-05-01.tsx`).
- **Arquivos Grandes:** Se o arquivo obsoleto for muito grande (ex: `node_modules` de backup), avalie se realmente precisa ser mantido ou se o `.gitignore` já lida com isso.

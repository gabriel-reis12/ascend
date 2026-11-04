---
name: ascend-gameplay-guardian
description: >-
  Use this skill when touching progression logic, XP curves, attributes (strength, endurance, intelligence,
  discipline, vitality), rank levels, class definitions, habit streaks, or weekly boss raid damage.
---

# ASCEND Gameplay Guardian Skill

Esta skill atua como sentinela das regras de gamificação, economia de XP e progressão do caçador, impedindo alterações acidentais nas fórmulas de RPG.

## Responsabilidades

1. **Proteção de Fórmulas e Curvas:**
   - O nível máximo é estritamente 100 (`MAX_LEVEL = 100`).
   - A promoção de Ranks segue rigorosamente: E (1), D (20), C (40), B (60), A (75), S (85), National (95), Monarch (100).
   - As fórmulas de XP exigido por nível em `src/lib/progression.ts` são imutáveis sem aprovação direta do usuário.
2. **Integridade dos 5 Atributos:**
   - Garantir que toda atividade recompense estritamente um dos 5 atributos oficiais: `strength`, `endurance`, `intelligence`, `discipline`, `vitality`.
3. **Mecânica de Raid Semanal:**
   - Assegurar que conclusão de treinos e hábitos continue aplicando dano ao chefe ativo em `useBossStore.ts`.
4. **Preservação de Dados de Usuário:**
   - Nunca disparar ações que resetem ou apaguem históricos de XP, hábitos concluídos ou registros de treinos no banco de dados.

## Checklist do Guardião

- [ ] A alteração tocou em arquivos de progressão?
- [ ] As recompensas de XP continuam dentro dos limites (`MIN_ACTIVITY_XP = 5`, `MAX_ACTIVITY_XP = 50`)?
- [ ] O cálculo de soft-cap diário foi preservado?

## Documento de Apoio
Consulte [docs/ASCEND_GAMEPLAY_RULES.md](../../docs/ASCEND_GAMEPLAY_RULES.md) para valores exatos de caps e fórmulas.


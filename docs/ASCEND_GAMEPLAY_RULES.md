# ASCEND — Regras Oficiais de Gameplay e Progressão

Este documento resume as fórmulas e contratos reais de gamificação do código-fonte em `src/lib/progression.ts` e stores associados.

## 1. Ranks e Níveis (`src/lib/progression.ts`)

- **Nível Máximo:** 100 (`MAX_LEVEL = 100`).
- **Faixas de Rank:**
  - **Rank E:** Nível 1 a 19
  - **Rank D:** Nível 20 a 39
  - **Rank C:** Nível 40 a 59
  - **Rank B:** Nível 60 a 74
  - **Rank A:** Nível 75 a 84
  - **Rank S:** Nível 85 a 94
  - **National:** Nível 95 a 99
  - **Monarch:** Nível 100

## 2. Recompensas e Atributos

O sistema possui 5 atributos fundamentais do Caçador:
1. **Strength (Força):** Recompensado principalmente por treinos de musculação e calistenia.
2. **Endurance (Resistência):** Recompensado por cardios, caminhadas e sustentação física.
3. **Intelligence (Inteligência):** Recompensado por blocos de estudo e leitura.
4. **Discipline (Disciplina):** Recompensado por hábitos repetidos, trabalho e consistência.
5. **Vitality (Vitalidade):** Recompensado por ingestão de água, sono reparador e nutrição.

## 3. Limites Diários de XP (Caps de Segurança)

- `DAILY_COMMON_XP_FULL_CAP = 180` (XP concedido a 100% de rendimento).
- `DAILY_COMMON_XP_SOFT_CAP = 250` (Após 180 XP, rendimento cai para taxa soft de 30%).
- `WEEKLY_BONUS_XP_CAP = 750` (Teto para XP bônus semanal de raids e conquistas).
- `MIN_ACTIVITY_XP = 5` / `MAX_ACTIVITY_XP = 50`.

## 4. Raid Semanal de Chefes (`useBossStore.ts`)

- Cada treino concluído ou refeição batida gera dano ao chefe ativo da semana.
- Conclusão da raid semanal premia o jogador com medalha de conquista e XP bônus.
- **Regra de Ouro:** Nenhuma fórmula, multiplicador ou recompensa deve ser modificada sem autorização expressa.


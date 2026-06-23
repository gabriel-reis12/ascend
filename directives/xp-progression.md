# SOP: Progressão de XP

## Objetivo

Manter a progressão recompensadora no início, sustentável no longo prazo e resistente a repetição artificial de atividades.

## Regras

- A campanha atual possui 100 níveis.
- O primeiro nível exige 100 XP; a exigência cresce por faixas em `src/lib/progression.ts`.
- Promoções: D no nível 20, C no 40, B no 60, A no 75, S no 85, National no 95 e Monarch no 100.
- Tarefas e hábitos configuráveis concedem entre 5 e 50 XP.
- XP comum:
  - 100% até 180 XP efetivos no dia.
  - 30% entre 180 e 250 XP brutos.
  - Sem ganho comum após o teto efetivo de 201 XP.
- XP bônus de bosses, streaks e conquistas não consome o limite diário.
- XP bônus possui teto de 750 XP por semana.
- Eventos devem informar um `eventId` estável ao chamar `addXp` para impedir premiação duplicada.
- Dano causado a bosses deve usar `XpAwardResult.awardedXp`, nunca a recompensa bruta configurada.
- Reversões devem reutilizar o mesmo `eventId` da concessão.

## Validação

1. Executar `npm.cmd run build`.
2. Confirmar que nível 2 exige 100 XP acumulados.
3. Confirmar que a recompensa comum diária não ultrapassa 201 XP.
4. Confirmar que repetir o mesmo evento não concede XP nem dano adicional.
5. Confirmar que bônus aparecem separadamente do limite diário.

## Banco de Dados

Executar a migration `supabase/migrations/20260622_progression_v2.sql` para limitar recompensas persistidas de tarefas e hábitos.

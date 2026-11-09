# ASCEND — ETAPA 04.8: MOBILE EXPERIENCE & PLAYER JOURNEY

**Data:** 2026-11-09  
**Papéis Ativados (ASCEND Agent Team v1):**
- **ASCEND Mobile Engineer** (`ascend-mobile-ux`)
- **ASCEND Creative Director** (`ascend-art-director`, `ascend-design-system`)
- **ASCEND Software Architect** (`ascend-frontend-architect`)
- **ASCEND Gameplay Guardian** (`ascend-gameplay-guardian`)
- **ASCEND QA Engineer** (`ascend-qa-reviewer`)

---

## 1. Diagnóstico da Experiência Mobile

A auditoria funcional completa em navegador real (Chromium Headless via Chrome DevTools Protocol sobre o bundle de produção `dist/`) revelou que, após o endurecimento estrutural da Etapa 04.7, o ASCEND já contava com boa velocidade de carregamento inicial (`index-*.js` de `156.10 kB` / `47.38 kB` gzip) e estética **ASCEND HUD v2** consolidada, mas ainda apresentava fricções de usabilidade cotidiana no mobile:

1. **Home atuando mais como vitrine de status + grade de atalhos de navegação do que como centro de execução imediata:**
   - Embora exibisse o Hero do Caçador, Nível/Rank/XP, o anel de Progresso Diário e os botões de `Ações Rápidas`, o jogador precisava navegar para outras rotas (`/quests`, `/workouts`, `/nutrition`, `/rest`) para concluir um hábito simples, registrar água, registrar sono ou iniciar um treino do dia.
   - Em viewports mobile (`320×700` a `430×932`), o bloco superior (`#tour-portal-header`) ocupava verticalmente quase toda a primeira tela (~780px), empurrando a seção recomendada (`#tour-portal-recommended`) para baixo da primeira dobra visível.
2. **Operações recorrentes de alta frequência exigiam múltiplos toques e trocas de tela:**
   - **Concluir um hábito simples** exigia abrir `/quests`, localizar o card e tocar no checkbox (mínimo de 2 a 3 interações).
   - **Registrar água (`+250ml` / `+500ml`)** ou **registrar sono (`7h` / `8h`)** não estavam disponíveis diretamente na Home em 1 toque.
   - **Iniciar o treino programado do dia** exigia ir até `/workouts`, rolar até a lista ou botão interno e abrir a sessão (3+ interações).
   - **Retomar uma sessão em andamento** (treino ativo ou missão guiada com timer pausado) não contava com um banner contextual imediato no topo de ações da Home.
3. **Ergonomia na execução de treino (`ActiveWorkoutSession.tsx`):**
   - Os botões de ajuste rápido de carga/repetições (`-` / `+`) e o botão de conclusão de série (`Check`) possuíam dimensões de `28×28px` (`size-7`) e `32×32px` (`size-8`), abaixo do alvo ergonômico mobile recomendado ($\ge 44\text{px}$).
   - A conclusão de treino em `Workouts.tsx` utilizava `alert(...)` nativo bloqueante do navegador em vez de feedback integrado ao HUD.

---

## 2. Principais Problemas Encontrados

| ID | Módulo / Arquivo | Problema Identificado | Severidade | Status |
| :--- | :--- | :--- | :---: | :---: |
| **M-01** | [`src/pages/QuickMenu.tsx`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/src/pages/QuickMenu.tsx) | Ausência de Centro de Ação Diária contextual acima da dobra; Home obrigava navegação para concluir a próxima missão ou registrar água/sono. | Alta | **Resolvido** |
| **M-02** | [`src/pages/QuickMenu.tsx`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/src/pages/QuickMenu.tsx) | Altura combinada do Hero + Status empurrava `#tour-portal-recommended` para `> 850px` em telas mobile (`320×700` a `390×844`). | Alta | **Resolvido** (`top = 572px–604px`) |
| **M-03** | [`src/components/workouts/ActiveWorkoutSession.tsx`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/src/components/workouts/ActiveWorkoutSession.tsx) | Botões `-`/`+` de peso/reps (`size-7` = 28px), botão de check de série (`size-8` = 32px) e presets de descanso abaixo de 44px. | Média | **Resolvido** (`44×44px` medido no DOM) |
| **M-04** | [`src/pages/Workouts.tsx`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/src/pages/Workouts.tsx) | Ausência de auto-start via query string (`?start=today` / `?resume=1`) e uso de `alert()` nativo bloqueante ao finalizar treino. | Média | **Resolvido** |
| **M-05** | [`src/lib/supabase.ts`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/src/lib/supabase.ts) | Crash fatal na inicialização (`Uncaught Error: supabaseUrl is required`) quando variáveis `.env` não estão injetadas no ambiente local de teste/build. | Alta | **Resolvido** |
| **S-01** | [`supabase/migrations/20261109_account_deletion_and_security.sql`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/supabase/migrations/20261109_account_deletion_and_security.sql) | Políticas RLS em `profiles` sem cláusula explícita `to authenticated` e limpeza de tabelas-filhas (`meal_plan_items`, `routine_exercises`) implícita na RPC `delete_own_account()`. | Alta (Segurança) | **Resolvido Localmente** |
| **S-02** | [`src/lib/accountDeletion.ts`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/src/lib/accountDeletion.ts) | `requirePasswordReauth` verificava `if (requirePasswordReauth && email)` — se `email` viesse vazio, a reautenticação por senha poderia ser contornada no cliente antes da chamada RPC. | Alta (Segurança) | **Resolvido Localmente** |

---

## 3. Jornada do Primeiro Usuário (Jornada A)

Executada e auditada em viewport mobile (`390×844`) desde a tela de login até a conclusão da primeira atividade na Home:

1. **Criar conta / Login (`/login`, `/register`):**
   - Interface **ASCEND — THE GATE** com campos de `52px` de altura, suporte a autofill (`email`, `current-password`, `new-password`) e botão primário na *Thumb Zone*.
   - Captura real: [`.tmp/screenshots/048/journey_a_login.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/journey_a_login.png).
2. **Onboarding e Revisão do Programa Inicial (`/onboarding`):**
   - Questionário progressivo que coleta objetivo principal, foco de treino, meta nutricional, nível de experiência e restrições.
   - Antes de finalizar, o usuário visualiza a prévia real do seu **Programa Inicial de Treino** (`Treino A/B/C` ou divisão adaptada) e tem seus hábitos iniciais semeados de forma idempotente na tabela canônica `habits`.
   - Captura real: [`.tmp/screenshots/048/journey_a_onboarding.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/journey_a_onboarding.png).
3. **Acesso à Home, Primeira Atividade e Recebimento de XP (`/`):**
   - Ao concluir o onboarding, o jogador chega à Home onde visualiza imediatamente:
     - Sua classe despertada, Nível, Rank e Barra de XP.
     - O **Centro de Ação Diária (`#tour-portal-recommended`)** acima da dobra (`572px` em `390×844`) destacando a **Próxima Missão** com botões diretos **"Concluir"** (1 toque) e **"Iniciar"** (abre `GuidedQuestModal` na própria Home).
     - O card opcional **Caminho do 1º Dia (`HunterGuidanceCard`)** logo abaixo, explicando os 3 passos iniciais com opção de dispensar.

---

## 4. Jornada de Uso Diário (Jornadas B, C e D)

### Jornada B — Utilização Cotidiana (Dia com Treino, Hábitos, Água e Alimentação)
1. **Abertura com sessão persistida (`/`):** Sessão restaurada via `authStorageAdapter` (`ascend-auth-token`) e cache de leitura `hunter-storage` em `663ms` (`390×844`).
2. **Consulta e execução rápida na Home:**
   - **Hábito simples:** Concluído em **1 toque** direto no card `Próxima missão` ou nos atalhos de hábitos do `Modo Rápido` na Home (`+XP` e atributo atualizados instantaneamente).
   - **Água (`+250ml` / `+500ml`):** Registrada em **1 toque** no `Modo Rápido` da Home (`interactionMs = 63ms`), sincronizando com o rastreador diário e auto-concluindo o hábito de hidratação ao atingir a meta.
   - **Refeição habitual:** Card contextual **"Registrar refeição"** na Home abre o modal de confirmação segura (`SafeActionConfirmModal`) e registra em **2 toques** totais (ou até 3 toques com ajuste de gramas no `QuickMealRepeatPanel` em `/nutrition`).
   - **Treino programado:** Card contextual **"Seu treino de hoje está pronto"** na Home exibe o botão **"Iniciar treino"**, que navega para `/workouts?start=today&routine=<id>` e abre o `ActiveWorkoutSession` imediatamente (**1 a 2 interações**).
   - **Registro de séries e finalização:** Botões ergonômicos de `44×44px` para ajuste de peso/reps e check de série; finalização com toast HUD não-bloqueante e dano automático no Boss semanal.
   - Capturas reais: [`.tmp/screenshots/048/journey_b_actions.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/journey_b_actions.png), [`.tmp/screenshots/048/journey_b_active_workout.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/journey_b_active_workout.png), [`.tmp/screenshots/048/journey_b_active_workout_320.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/journey_b_active_workout_320.png).

### Jornada C — Dia sem Treino (Descanso, Hábitos, Foco e Nutrição)
1. Quando não há treino programado para o dia da semana atual (`workoutMissions.length === 0`), o `DailyActionCenter` **não inventa treinos** nem polui a tela: exibe apenas a **Próxima Missão** pendente, a **Refeição** habitual e o **Modo Rápido** (Água, Hábitos pendentes, Sono `7h`/`8h` em 1 toque com `+20 XP · +2 EQU`, e **Foco Tático 15 min** que abre o timer `GuidedQuestModal` diretamente na Home em 1 toque).
2. Capturas reais: [`.tmp/screenshots/048/journey_c_rest_day.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/journey_c_rest_day.png), [`.tmp/screenshots/048/journey_c_focus_modal.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/journey_c_focus_modal.png).

### Jornada D — Retorno após Ausência e Retomada de Sessão
1. Ao reabrir o aplicativo com sessão persistida e atividade em andamento (`ascend_active_workout_<userId>` ou timer guiado ativo em `localStorage`), a Home exibe no topo do `DailyActionCenter` o banner âmbar **"Sessão em Andamento"** com botão de **1 toque ("Retomar")**, permitindo continuar exatamente do ponto onde parou sem reconfigurar perfil ou perder séries registradas.
2. Captura real: [`.tmp/screenshots/048/journey_d_return_resume.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/journey_d_return_resume.png).

---

## 5. Quantidade de Interações Antes e Depois

Medição real comparando o fluxo anterior (Etapa 04.7) com o fluxo otimizado (Etapa 04.8):

| Operação Cotidiana | Antes (Etapa 04.7) | Depois (Etapa 04.8) | Meta da Etapa 04.8 | Resultado |
| :--- | :--- | :--- | :--- | :---: |
| **Concluir hábito simples pendente** | **3 toques** (BottomNav `Missões` $\rightarrow$ localizar card $\rightarrow$ checkbox) | **1 toque** (Botão `Concluir` no card `Próxima missão` ou pílula no `Modo Rápido` da Home) | 1 toque | **Atingida** |
| **Iniciar treino programado de hoje** | **3 a 4 toques** (Ir para `/workouts` $\rightarrow$ rolar $\rightarrow$ abrir ficha $\rightarrow$ iniciar sessão) | **1 a 2 toques** (1 toque no botão `Iniciar treino` na Home abre direto `/workouts?start=today` com sessão ativa, ou 2 toques via `/workouts` $\rightarrow$ `Iniciar Treino Agora`) | Até 2 interações | **Atingida** |
| **Repetir refeição habitual** | **3 a 4 toques** (Ir para `/nutrition` $\rightarrow$ painel de repetição $\rightarrow$ confirmar) | **2 toques na Home** (`Repetir refeição` $\rightarrow$ `Confirmar` no `SafeActionConfirmModal`) ou **3 toques com ajuste de gramas** em `/nutrition` | Até 3 interações | **Atingida** |
| **Registrar água (`+250ml` / `+500ml`)** | **3+ toques** (Navegar para missão/nutrição e atualizar manualmente) | **1 toque** no `Modo Rápido` da Home (`63ms` medidos) | Alta frequência / 1 toque | **Atingida** |
| **Registrar sono (`7h` / `8h`)** | **4 toques** (Menu/ Card `Descanso` $\rightarrow$ `/rest` $\rightarrow$ selecionar horas $\rightarrow$ salvar) | **1 toque** (`Sono 7h` ou `Sono 8h` no `Modo Rápido` da Home, com idempotência diária) | Alta frequência / 1 toque | **Atingida** |
| **Iniciar sessão de foco (15 min)** | **3 toques** (`/quests` ou `/rest` $\rightarrow$ abrir modal $\rightarrow$ iniciar) | **1 toque** (`Foco 15m` no `Modo Rápido` ou botão `Iniciar` na `Próxima missão` direto na Home) | Alta frequência / 1 toque | **Atingida** |
| **Retomar sessão em andamento** | **2 a 3 toques** (Navegar até `/workouts` ou `/quests` e reabrir modal) | **1 toque** no banner contextual `Sessão em Andamento` na Home | Sem perda de progresso | **Atingida** |

---

## 6. Melhorias Implementadas

1. **Centro de Ação Diária Contextual & Modo Rápido (`src/components/home/DailyActionCenter.tsx` + `src/pages/QuickMenu.tsx`):**
   - Integrado à seção `#tour-portal-recommended` da Home, exibindo recomendações 100% baseadas nos dados reais do jogador (`useHabits`, `useTasks`, `food_logs`, `rest_logs`, `localStorage` de sessões ativas).
   - Suporte a:
     - **Banner de Retomada (`Sessão em Andamento`)** para treinos ou Guided Quests em andamento.
     - **Card `Próxima missão`** com conclusão em 1 toque (`Concluir`) ou abertura imediata do modo guiado (`Iniciar`).
     - **Card `Seu treino de hoje está pronto`** com início direto em 1 toque (`Iniciar treino`).
     - **Card `Registrar refeição`** com repetição segura (`Repetir refeição`) ou marcação de cardápio (`Concluir refeição`).
     - **Barra `Modo Rápido (1 Toque)`** para hábitos adicionais pendentes, Água (`+250ml` / `+500ml`), Sono (`7h` / `8h`) e Foco Tático (`15 min`).
2. **Compactação Ergonômica Acima da Dobra na Home (`src/pages/QuickMenu.tsx`):**
   - Ajuste das alturas e paddings mobile do Hero (`h-36 sm:h-60`) e do card `Status do Caçador` (`p-2.5 sm:px-4 sm:py-3.5`, anel `size={78}`) preservando integralmente o **ASCEND HUD v2** e garantindo que `#tour-portal-recommended` comece em `y = 572px` (`375×812`, `390×844`, `430×932`) e `y = 604px` (`320×700`) — **sempre visível na primeira dobra sem necessidade de scroll**.
3. **Início Imediato de Treino e Touch Targets $\ge 44\text{px}$ (`src/pages/Workouts.tsx` + `src/components/workouts/ActiveWorkoutSession.tsx`):**
   - Suporte a `?start=today&routine=<id>` e `?resume=1` em `Workouts.tsx`, abrindo `ActiveWorkoutSession` automaticamente ao chegar da Home.
   - Adição do CTA primário **"INICIAR TREINO AGORA"** / **"RETOMAR TREINO GUIADO"** no topo do card de treino do dia em `Workouts.tsx`.
   - Substituição do `alert()` bloqueante ao concluir treino por toast HUD não-bloqueante (`workoutCompleteToast`) + `triggerGameFeel('questComplete')`.
   - Ampliação dos botões `-`/`+` de carga e repetições, botão de check de série, botão de substituição e presets de descanso em `ActiveWorkoutSession.tsx` para `min-h-[44px] min-w-[40px] sm:min-w-[44px]` (medido no DOM real como `44×44px`).
4. **Endurecimento de Segurança na Exclusão de Conta (`supabase/migrations/20261109_account_deletion_and_security.sql` + `src/lib/accountDeletion.ts`) e Resiliência de Inicialização (`src/lib/supabase.ts`):**
   - Detalhados na Seção 10 abaixo.

---

## 7. Resultados de Performance

Medições reais coletadas via `window.performance` (Navigation Timing + Resource Timing + `performance.memory`) no navegador Chromium executando o build de produção (`dist/`):

| Cenário / Rota | Viewport | Tempo até Tela Utilizável (`usableElapsedMs`) | `domContentLoaded` | Chunks JS Carregados | Memória JS Heap (`usedJSHeapSize`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Home (Cold Start — 1ª abertura)** | `320×700` | `3261 ms` | `2704 ms` | `24` (6 core + 18 ícones/rota) | `6.77 MB` |
| **Home (Sessão Persistida)** | `375×812` | `669 ms` | `64 ms` | `24` | `10.00 MB` |
| **Home (Sessão Persistida)** | `390×844` | `663 ms` | `60 ms` | `24` | `15.03 MB` |
| **Home (Sessão Persistida)** | `430×932` | `668 ms` | `62 ms` | `24` | `14.12 MB` |
| **Login (`THE GATE`)** | `390×844` | `674 ms` | `59 ms` | `6` | `7.12 MB` |
| **Onboarding (`/onboarding`)** | `390×844` | `665 ms` | `56 ms` | `19` | `8.40 MB` |
| **Treino Ativo (`/workouts`)** | `390×844` | `662 ms` | `55 ms` | `28` | `8.90 MB` |
| **Missões (`/quests`)** | `390×844` | `662 ms` | `54 ms` | `25` | `8.20 MB` |
| **Nutrição (`/nutrition`)** | `390×844` | `666 ms` | `56 ms` | `20` | `9.15 MB` |
| **Bosses (`/bosses`)** | `390×844` | `667 ms` | `55 ms` | `19` | `8.65 MB` |
| **Descanso (`/rest`)** | `390×844` | `671 ms` | `57 ms` | `13` | `7.95 MB` |

**Análise de Chunks Principais (Build de Produção Vite 8):**
- `index-DFvk4jRn.js`: `156.10 kB` (`47.38 kB` gzip)
- `QuickMenu-DfpS3vMM.js` (Home + `DailyActionCenter`): `85.86 kB` (`22.27 kB` gzip)
- `GuidedQuestModal-DZ3eRWTB.js`: `34.26 kB` (`11.14 kB` gzip)
- `Quests-BnqOL4d9.js`: `82.37 kB` (`20.03 kB` gzip)
- `Workouts-BwO0XEmX.js`: `148.41 kB` (`29.98 kB` gzip)
- `Nutrition-ChaOfFPG.js`: `197.66 kB` (`44.53 kB` gzip — carregado apenas sob demanda ao acessar `/nutrition`)

---

## 8. Resultados dos Testes

| Verificação / Suíte | Comando Executado | Resultado | Tipo de Verificação |
| :--- | :--- | :---: | :--- |
| **TypeScript Typecheck** | `npm run typecheck` (`tsc --noEmit`) | **PASS (0 erros)** | Estática / Tipos |
| **Production Build** | `npm run build` (`tsc -b && vite build`) | **PASS (7.08s)** | Compilação Real |
| **Auditoria Bilíngue i18n** | `npm run audit:i18n` | **PASS (0 órfãos/ausentes)** | Estática / Dicionários PT-BR & EN-US |
| **Suíte Dedicada Etapa 04.8** | `node --test execution/test_mobile_experience_048.mjs` | **PASS (5/5 subtestes)** | Automatizada (Segurança + UX Mobile) |
| **Bateria Completa do Repositório** | `node execution/run_all_tests.mjs` | **PASS (29/29 suítes, 0 falhas)** | Automatizada Completa |
| **Auditoria Funcional em Navegador Real** | `node execution/audit_mobile_experience_048.mjs` | **PASS (21/21 cenários e capturas)** | Execução Real em Chromium Headless |

---

## 9. Evidências Visuais (Capturas Reais)

Todas as 21 capturas de tela foram geradas a partir de renderização real no Chromium e salvas em `.tmp/screenshots/048/` junto com o relatório de telemetria [`.tmp/screenshots/048/audit_report_048.json`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/audit_report_048.json):

### Responsividade da Home (6 Viewports)
- **320 × 700 (Mobile Compacto):** [`home_320x700.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/home_320x700.png) (`overflow=false`, `aboveFold=true`, `top=604px`)
- **375 × 812 (iPhone X / Mini):** [`home_375x812.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/home_375x812.png) (`overflow=false`, `aboveFold=true`, `top=572px`)
- **390 × 844 (iPhone 14 / 15):** [`home_390x844.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/home_390x844.png) (`overflow=false`, `aboveFold=true`, `top=572px`)
- **430 × 932 (iPhone Pro Max / Android Plus):** [`home_430x932.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/home_430x932.png) (`overflow=false`, `aboveFold=true`, `top=572px`)
- **768 × 1024 (Tablet):** [`home_tablet_768x1024.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/home_tablet_768x1024.png) (`overflow=false`, `aboveFold=true`, `top=801px`)
- **1280 × 800 (Desktop):** [`home_desktop_1280x800.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/home_desktop_1280x800.png) (`overflow=false`, `aboveFold=true`, `top=645px`)

### Jornadas do Jogador (A, B, C, D) e Feedback de Gameplay
- **Jornada A — Login (`THE GATE`):** [`journey_a_login.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/journey_a_login.png)
- **Jornada A — Onboarding:** [`journey_a_onboarding.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/journey_a_onboarding.png)
- **Jornada B — Modo Rápido 1 Toque (Água + Sono registrados na Home):** [`journey_b_actions.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/journey_b_actions.png)
- **Jornada B — Sessão de Treino Ativa (`390×844`):** [`journey_b_active_workout.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/journey_b_active_workout.png)
- **Jornada B — Sessão de Treino Ativa (`320×700`):** [`journey_b_active_workout_320.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/journey_b_active_workout_320.png)
- **Jornada C — Dia sem Treino:** [`journey_c_rest_day.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/journey_c_rest_day.png)
- **Jornada C — Modal de Foco Guiado na Home:** [`journey_c_focus_modal.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/journey_c_focus_modal.png)
- **Jornada D — Retorno e Banner `Sessão em Andamento`:** [`journey_d_return_resume.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/journey_d_return_resume.png)
- **Feedback de Gameplay — Celebração de Rank-Up / Level-Up:** [`feedback_rankup.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/feedback_rankup.png)

### Módulos Principais e Fluxo de Segurança Mobile (`390×844`)
- **Quests (`/quests`):** [`page_quests_390x844.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/page_quests_390x844.png)
- **Nutrição (`/nutrition`):** [`page_nutrition_390x844.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/page_nutrition_390x844.png)
- **Bosses (`/bosses`):** [`page_bosses_390x844.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/page_bosses_390x844.png)
- **Descanso (`/rest`):** [`page_rest_390x844.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/page_rest_390x844.png)
- **Ajustes (`/settings`):** [`page_settings_390x844.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/page_settings_390x844.png)
- **Portal de Exclusão de Conta (`/delete-account`):** [`security_delete_account_390x844.png`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/.tmp/screenshots/048/security_delete_account_390x844.png)

---

## 10. Verificação e Pendências de Segurança (Auditoria da Migration 04.7)

Revisão completa de [`supabase/migrations/20261109_account_deletion_and_security.sql`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/supabase/migrations/20261109_account_deletion_and_security.sql) e [`src/lib/accountDeletion.ts`](file:///d:/Área%20de%20Trabalho/ASCEND/ascend/src/lib/accountDeletion.ts):

### O que foi validado e endurecido localmente nesta etapa:
1. **`SECURITY DEFINER` e `search_path`:** A função `public.delete_own_account()` define explicitamente `security definer` e `set search_path = public, auth`, prevenindo ataques de *search_path hijacking*.
2. **Isolamento por usuário (`auth.uid()`):** A função obtém `v_user_id := auth.uid()` diretamente do contexto JWT autenticado no banco (sem aceitar parâmetros externos de ID de usuário) e aborta com `raise exception 'Not authenticated'` se `v_user_id is null`.
3. **Permissões de `EXECUTE` e RLS em `public.profiles`:**
   - Adicionado `revoke execute on function public.delete_own_account() from public, anon;` antes de `grant execute ... to authenticated;`.
   - Adicionado `to authenticated` explicitamente nas políticas `"Users can delete own profile"` e `"Authenticated users can view public profiles"` em `public.profiles`, impedindo enumeração de perfis públicos pela role anônima (`anon`).
4. **Limpeza de tabelas relacionadas e integridade referencial:**
   - Adicionada exclusão explícita de tabelas-filhas (`public.meal_plan_items` e `public.routine_exercises`) antes da exclusão de `meal_plans`, `workout_routines`, `foods` e `exercises`, evitando falhas de chave estrangeira caso `ON DELETE CASCADE` não esteja configurado em todas as constraints do banco.
   - Adicionado `or action_user_id = v_user_id` na limpeza de `public.friendships` e `or owner_id = v_user_id::text` em `storage.objects`.
5. **Reautenticação obrigatória no cliente (`src/lib/accountDeletion.ts`):**
   - Corrigida condição onde `requirePasswordReauth` só executava `signInWithPassword` se `email` fosse passado por argumento. Agora `executeAccountDeletion` resolve o e-mail a partir de `argumento || user.email` e bloqueia imediatamente se o e-mail ou a senha não puderem ser validados.
   - Nenhuma chave administrativa (`service_role`) está exposta no cliente.

### Pendência para Produção (Homologação Remota):
- Conforme as regras estritas da Etapa 04.8 (*"Não aplicar a migration remotamente"*), a migration `supabase/migrations/20261109_account_deletion_and_security.sql` está **validada e endurecida localmente**, mas **ainda precisa ser aplicada e homologada no projeto Supabase remoto** antes da submissão final para App Store / Google Play.

---

## 11. Problemas Ainda Não Resolvidos

1. **Homologação remota da RPC `public.delete_own_account()` no Supabase de produção:** Depende de autorização para execução da migration no banco remoto (`supabase db push`).
2. **Mutação de dados 100% offline:** Conforme documentado na Etapa 04.7, o ASCEND possui cache local de leitura (`hunter-storage`, sessões ativas de treino/timer e hidratação diária em `localStorage`), mas operações que gravam XP/logs no Supabase (`habit_completions`, `workout_logs`, `food_logs`, `rest_logs`) requerem conectividade com a internet. Uma fila de sincronização offline (*offline mutation queue*) permanece como evolução futura para a etapa Capacitor.

---

## 12. Recomendações para `ASCEND — THE AWAKENING`

A auditoria da **Primeira Experiência (Seção 11)** confirmou que o usuário termina o questionário de `/onboarding` compreendendo seu objetivo, sua classe, seu programa inicial de treinos e sua primeira missão na Home. Para elevar o impacto emocional sem prejudicar a velocidade de uso, recomendamos para a futura introdução **ASCEND — THE AWAKENING**:

1. **Ponto Exato de Inserção:**
   - Inserir **imediatamente após a confirmação do Programa Inicial no último passo do `/onboarding`** (na transição entre `Onboarding.tsx` e a primeira entrada na Home `/`), e **nunca** antes do login ou em aberturas cotidianas do app.
   - Motivo: Nesse momento o jogador já escolheu seu foco e teve sua classe calculada (`Warrior`, `Scholar`, `Monk`, `Creator`, `Leader` ou `Titan`), permitindo que a cena revele sua Classe e seu Rank E recém-despertados.
2. **Estrutura Narrativa e Duração (12 a 18 segundos no máximo):**
   - **Ato 1 (0–4s):** Escuridão abissal `#030408` com pulso neural ciano (`#00F0FF`) — *"O Sistema detectou a sua presença."*
   - **Ato 2 (4–10s):** Síntese rápida dos parâmetros reais escolhidos pelo usuário no onboarding e revelação da insígnia da Classe Despertada + Hexágono Rank E.
   - **Ato 3 (10–15s):** Chamado à primeira ação real (*"Sua primeira missão diária foi gerada"*), aterrissando diretamente no `DailyActionCenter` da Home.
3. **Regras Obrigatórias de UX e Acessibilidade:**
   - Botão **"Pular Introdução" (`Skip`)** visível desde o primeiro segundo (`min-h-[44px]` no canto superior direito).
   - Respeito automático a `prefers-reduced-motion` (exibindo versão estática resumida em card único se ativo).
   - Flag persistente (`ascend_awakening_seen_<userId>`) + opção de rever a cena manualmente em `Ajustes` ou na `Ficha de Atributos (/status)`.

---

## 13. Parecer GO / NO-GO para Homologação Mobile

### **PARECER TÉCNICO E DE UX MOBILE: `GO` (APROVADO PARA HOMOLOGAÇÃO MOBILE)**

**Justificativa:**
- Todas as 4 jornadas mobile (**A — Primeiro Acesso**, **B — Utilização Cotidiana**, **C — Dia sem Treino**, **D — Retorno após Ausência**) foram executadas e validadas em navegador real.
- Todas as metas de redução de toques da Seção 10 foram cumpridas (hábitos, água, sono e foco em **1 toque** na Home; treino programado em **1 a 2 interações**; repetição de refeição em **2 a 3 interações**; retomada de sessão em **1 toque**).
- A seção de ação recomendada (`#tour-portal-recommended`) está visível acima da dobra em todas as resoluções mobile testadas (`320×700`, `375×812`, `390×844`, `430×932`), com `0` overflow horizontal.
- `29/29` suítes de testes automatizados aprovadas, `typecheck` limpo, `build` de produção limpo e auditoria `i18n` com `0` divergências.
- *Ressalva operacional registrada:* Aplicar e homologar a migration `20261109_account_deletion_and_security.sql` no ambiente remoto do Supabase antes da abertura para lojas móveis.

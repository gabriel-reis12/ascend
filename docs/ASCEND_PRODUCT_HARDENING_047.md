# ASCEND — ETAPA 04.7: PRODUCT HARDENING & GAME FEEL

**Data:** 09 de Novembro de 2026  
**Escopo:** Hardening de Produto, Segurança (Apple App Store 5.1.1v / Google Play Data Safety), Code-Splitting, Experiência do Dia 1, Quests Mobile Simplificadas, Game Feel & Celebrações de Evolução, e Repetição Rápida de Refeições antes do empacotamento com Capacitor.

---

## A. Diagnóstico Inicial (Fase A — Validação Crítica da Auditoria)

1. **Contradição de Atributos (5 vs. 7 Atributos):**
   - **Achado:** `docs/ASCEND_GAMEPLAY_RULES.md`, `docs/ASCEND_ARCHITECTURE.md`, `AGENTS.md`, `docs/ASCEND_AGENT_TEAM.md`, `.agents/skills/ascend-gameplay-guardian/SKILL.md` e trechos de `docs/ASCEND_GAME_DESIGN_AUDIT_360.md` mencionavam apenas 5 atributos, enquanto o motor real (`src/stores/useHunterStore.ts`, `src/lib/onboardingRules.ts`, `src/pages/Dashboard.tsx`, `src/lib/achievementsData.ts`) opera com **7 atributos**:
     1. `strength` (Força)
     2. `endurance` (Resistência)
     3. `intelligence` (Inteligência)
     4. `discipline` (Disciplina)
     5. `vitality` (Vitalidade)
     6. `wisdom` (Sabedoria)
     7. `balance` (Equilíbrio)
   - **Correção Aplicada:** Documentação técnica e contratos (`src/components/rpg/StatCard.tsx`, `src/lib/guidedQuests.ts`, `src/pages/Settings.tsx`) alinhados para os 7 atributos reais, sem alterar nenhuma fórmula de XP ou progressão.
2. **Validação da Nota de Segurança (9/10 Auditada):**
   - Autenticação PKCE com `authStorageAdapter` resiliente e RLS ativa em todas as tabelas (`auth.uid() = user_id`).
   - Hardening adicionado: revalidação de identidade por senha (ou sessão ativa verificada no servidor para contas OAuth) antes de excluir conta, política explícita de `DELETE` no próprio perfil, `SELECT` restrito a `auth.uid() = id OR is_public = true` e constraints de integridade de nível/XP em `supabase/migrations/20261109_account_deletion_and_security.sql`.
3. **Verificação da Afirmação "Offline-First":**
   - **Classificação Real:** O ASCEND possui **arquitetura assistida por cache local de leitura e sessão resiliente (`authStorageAdapter`)**, além de timers epoch locais resilientes em `GuidedQuestModal` e `ActiveWorkoutSession`, mas **não é offline-first completo** para mutações de escrita (`insert`/`update`/`delete` exigem conectividade com o Supabase). Documentado em `docs/ASCEND_ARCHITECTURE.md` e `docs/ASCEND_GAME_DESIGN_AUDIT_360.md`.
4. **Estado Inicial do Ambiente:**
   - `npm run typecheck`: `0` erros.
   - `npm run build` (antes da Fase C): chunk monolítico `dist/assets/index-*.js` de `1.672,70 kB` (`440,26 kB` gzip) com aviso `[INEFFECTIVE_DYNAMIC_IMPORT]` em `useBossStore.ts`.
   - `npm run audit:i18n`: `localization audit: ok`.

---

## B. Arquitetura de Execução (Orquestração Multiagente)

Execução coordenada utilizando o **ASCEND Agent Team v1** e o **Skill Pack oficial**:
1. **ASCEND Software Architect** (`ascend-frontend-architect`) — Code-Splitting por rota (`React.lazy`/`Suspense` em `src/App.tsx`), preservação de `<PreferencesProvider>` e `<LocalizationBridge />`, isolamento de chunks em `vite.config.ts`, desacoplamento do import circular `useHunterStore` $\leftrightarrow$ `useBossStore` e arquitetura de exclusão de conta (`src/lib/accountDeletion.ts`).
2. **ASCEND Gameplay Guardian** (`ascend-gameplay-guardian`) — Alinhamento dos 7 atributos oficiais, preservação estrita das curvas de XP/Rank em `src/lib/progression.ts`, celebrações separadas de Level-Up e Rank-Up sem reexibição após F5, e confirmação de dano em Boss Raids.
3. **ASCEND Mobile Engineer** (`ascend-mobile-ux`) — Hierarquia mobile-first de Quests (`320px–430px`), alvos de toque $\ge 44\text{px}$, ações na Thumb Zone e fluxo rápido de repetição de refeições.
4. **ASCEND Creative Director** (`ascend-art-director` + `ascend-design-system`) — Preservação integral da identidade **ASCEND HUD v2** (70% Dark Fantasy / 30% Sci-Fi Tático) sem redesign visual global.
5. **ASCEND QA Engineer** (`ascend-qa-reviewer`) — Bateria de testes automatizados (`28/28` suítes aprovadas), auditoria bilíngue (`PT-BR`/`EN-US`), typecheck e validação de build.

---

## C. Alterações Implementadas (Arquivos Criados e Modificados)

### Novos Arquivos
- `src/lib/accountDeletion.ts` — Serviço de exclusão de conta (revalidação por senha ou sessão OAuth, chamada à RPC `delete_own_account`, fallback de cascata RLS + anonimização, limpeza de `localStorage`/`sessionStorage` e `signOut`).
- `src/pages/auth/DeleteAccountPage.tsx` — Portal web público `/delete-account` compatível com Google Play Data Safety e Apple App Store 5.1.1(v).
- `supabase/migrations/20261109_account_deletion_and_security.sql` — Migration SQL com RPC `public.delete_own_account()` (`SECURITY DEFINER`), políticas RLS de perfil e constraints de integridade.
- `src/lib/gameFeel.ts` — Motor determinístico Web Audio API + Haptics com respeito a `prefers-reduced-motion` e preferências do usuário.
- `src/components/rpg/EvolutionCelebrationModal.tsx` — Modal tático de celebração de Level-Up e Rank-Up.
- `src/components/rpg/BossDamageToast.tsx` — Toast global não-bloqueante de dano confirmado ou regeneração do Boss Semanal.
- `src/components/nutrition/QuickMealRepeatPanel.tsx` — Painel de repetição rápida de refeições de ontem/recentes, favoritas e combinações habituais com revisão de gramas.
- `execution/test_product_hardening_047.mjs` — Suíte automatizada de testes cobrindo as Fases A a G.

### Arquivos Modificados
- `src/App.tsx`, `vite.config.ts` — Code-splitting por rota e vendor chunks, preservando `<PreferencesProvider>` e guardas de sincronização de perfil.
- `src/stores/useHunterStore.ts`, `src/stores/useBossStore.ts` — Listener `onHunterProfileLoaded`, estados efêmeros `pendingLevelUp` e `pendingRankUp` (excluídos do `localStorage`), e confirmação de dano antes de emitir `recentDamage`.
- `src/lib/onboardingSetup.ts`, `src/pages/Onboarding.tsx`, `src/components/home/HunterGuidanceCard.tsx` — Correção da tabela `habits`, prévia completa e confirmação do programa inicial `Treino A/B/C`, e Caminho do 1º Dia.
- `src/pages/Quests.tsx`, `src/components/quests/GuidedQuestModal.tsx`, `src/lib/guidedQuests.tsx` — Hierarquia mobile simplificada, filtros expansíveis, imagens otimizadas `/optimized/Cards/*.jpg` e feedback sonoro/tátil ao concluir timer.
- `src/pages/Nutrition.tsx`, `src/pages/Settings.tsx`, `src/components/ui/hunter-login.tsx`, `src/components/layout/RPGLayout.tsx`, `src/components/rpg/StatCard.tsx`.
- Documentação: `docs/ASCEND_GAMEPLAY_RULES.md`, `docs/ASCEND_ARCHITECTURE.md`, `docs/ASCEND_GAME_DESIGN_AUDIT_360.md`, `AGENTS.md`, `docs/ASCEND_AGENT_TEAM.md`, `.agents/skills/ascend-gameplay-guardian/SKILL.md`, `HISTORY.md`.

---

## D. Melhorias de Experiência (UX Mobile, Quests & Nutrição)

1. **Hierarquia Mobile Simplificada em Quests (`src/pages/Quests.tsx` — Fase E):**
   - Ordem no mobile: (1) **Progresso de Hoje**, (2) **Missões Pendentes de Hoje** (`statusFilter` inicia em `'pending'`), (3) **Ação de Criar Missão** (`Missão Única` / `Quest Recorrente` na Thumb Zone), (4) **Acesso Rápido a Missões Concluídas e Histórico de Hoje**, (5) **Filtros Avançados Expansíveis** (`showAdvancedFilters`), e (6) **Gerenciar / Códex**.
   - Coexistência preservada entre conclusão rápida em 1 toque (`NeonCheckbox`) e execução guiada (`GuidedQuestModal`).
2. **Repetição Rápida de Refeições (`src/components/nutrition/QuickMealRepeatPanel.tsx` — Fase G):**
   - Permite **repetir refeição de ontem** / últimos 7 dias, **repetir refeição favorita** ou selecionar uma **combinação habitual** da Tabela TACO.
   - Modal de revisão permite ajustar gramas (`-25g` / `+25g` ou digitação direta), remover itens e escolher a refeição de destino antes de confirmar, protegido por trava síncrona `submittingLockRef` contra cliques duplicados.

---

## E. Performance (Fase C — Métricas Antes vs. Depois)

| Métrica | Antes (Monolítico) | Depois (Code-Split + Vendor Chunks) | Evolução |
| :--- | :--- | :--- | :--- |
| **Chunk JS de Entrada (`index-*.js`)** | `1.672,70 kB` (`440,26 kB` gzip) | `151,52 kB` (`46,00 kB` gzip) | **-90,9% brutos / -89,6% gzip** |
| **Soma Base Inicial (`index` + `vendor-*` + `i18n`)** | `1.672,70 kB` (`440,26 kB` gzip) | `772,19 kB` (`238,35 kB` gzip) | **-53,8% brutos / -45,9% gzip** |
| **Avisos de Chunk > 500 kB no Build** | `1` aviso (`1.672,70 kB`) | `0` avisos (maior chunk: `224,10 kB`) | **Eliminado (100%)** |
| **Aviso `[INEFFECTIVE_DYNAMIC_IMPORT]`** | Presente (`useBossStore.ts`) | `0` avisos (desacoplado via listener) | **Eliminado (100%)** |
| **Cards Ilustrados de Quests (`guidedQuests.ts`)** | `/Cards/*.jpeg` (`~1.400 kB`/card) | `/optimized/Cards/*.jpg` (`~72 kB`/card) | **-94,8% por imagem** |

---

## F. Gameplay e Feedback de Progressão (Fase F)

1. **Celebrações de Level-Up e Rank-Up (`src/components/rpg/EvolutionCelebrationModal.tsx`):**
   - Celebrações distintas para **Level-Up** e **Rank-Up** (`E -> D -> C -> B -> A -> S -> National -> Monarch`).
   - `pendingLevelUp` e `pendingRankUp` são excluídos da persistência em `localStorage` (`partialize`/`merge`), garantindo que a celebração nunca seja reexibida indevidamente após atualizar a página (`F5`).
2. **Dano Confirmado em Boss (`src/components/rpg/BossDamageToast.tsx` & `src/stores/useBossStore.ts`):**
   - O dano ou regeneração na Raid Semanal é exibido somente após a confirmação de persistência (`safeUpdateBossBattle`), e o toast global é suprimido quando o usuário já está na tela `/bosses` para evitar feedback visual duplicado.
3. **Efeitos Sonoros Sintetizados e Vibração (`src/lib/gameFeel.ts`):**
   - Síntese via Web Audio API + Haptics para `questComplete` (incluindo término de timer no `GuidedQuestModal`), `bossHit`, `levelUp` e `rankUp`, respeitando os toggles em `Settings.tsx` e `prefers-reduced-motion`.

---

## G. Segurança e Exclusão de Conta (Fase B)

1. **Mapeamento Completo de Dados:** `auth.users`, `profiles`, `habits`, `habit_completions`, `tasks`, `workout_routines`, `workout_logs`, `routine_completions`, `exercises` (custom), `food_logs`, `meal_plans`, `meal_completions`, `nutrition_daily_scores`, `foods` (custom), `boss_battles`, `achievements`, `daily_checklist`, `financial_logs`, `financial_goals`, `rest_logs`, `friendships`, `leaderboard_scores` e chaves locais.
2. **Fluxo no App (`Settings.tsx`) e Web (`/delete-account`):**
   - Informa claramente as consequências e lista todas as categorias de dados excluídas.
   - Exige confirmação explícita (`EXCLUIR MINHA CONTA` / `DELETE MY ACCOUNT` + checkbox) e revalida a identidade por senha (ou sessão ativa verificada no servidor para contas OAuth).
   - Executa `supabase.rpc('delete_own_account')` (`SECURITY DEFINER`) + limpeza em cascata e anonimização de perfil público, limpa `localStorage`/`sessionStorage` e invalida a sessão (`signOut()`).

---

## H. Onboarding e Primeiro Dia do Jogador (Fase D)

1. **Persistência Canônica e Idempotência (`src/lib/onboardingSetup.ts`):**
   - Corrigida a tabela de destino de hábitos iniciais para `habits` (em vez da tabela inexistente `daily_habits`), com verificação de registros existentes no banco e flag `ascend_onboarding_seeded_${userId}` para jamais duplicar ou sobrescrever rotinas/hábitos ao atualizar a página ou refazer login.
2. **Treinos Iniciais Personalizados (`src/pages/Onboarding.tsx`):**
   - Sugere `Treino A`, `Treino B`, `Treino C` (ou `2` a `6` sessões conforme disponibilidade), diferenciando iniciantes e avançados, respeitando ambiente (`gym`, `home`, `hybrid`) e restrições articulares (`joelho`, `lombar`, `ombro`, `punho`, `cervical`).
   - Usuários com objetivos puramente cognitivos (`focus_studies`, `discipline`) não são obrigados a ativar fichas físicas por padrão, e todos podem visualizar todos os exercícios prescritos e confirmar antes de ativar (`confirmTrainingProgram`).
3. **Caminho de Entrada no 1º Dia (`src/components/home/HunterGuidanceCard.tsx`):**
   - Apresenta objetivo principal, 1ª missão recomendada, acesso ao programa inicial (`Treino A/B/C`), acesso direto ao plano alimentar (`/nutrition?tab=cardapios`) e orientação breve sobre XP.

---

## I. QA e Evidências de Verificação (Fase I)

- **Typecheck (`npm run typecheck`):** `0` erros TypeScript.
- **Build de Produção (`npm run build`):** Concluído com sucesso sem avisos de chunks > 500 kB ou imports circulares.
- **Auditoria Bilíngue (`npm run audit:i18n`):** `localization audit: ok` (`PT-BR` e `EN-US`).
- **Suíte Automatizada Completa (`node execution/run_all_tests.mjs`):** `28/28` suítes aprovadas (`0` falhas).

---

## J. Pendências Operacionais Remotas

1. **Migration SQL Remota:** O arquivo `supabase/migrations/20261109_account_deletion_and_security.sql` está pronto localmente e aguarda autorização para aplicação no SQL Editor do projeto Supabase remoto (respeitando a restrição de segurança operacional de não aplicar migrations remotas sem autorização).

---

## K. Recomendações para Lançamento (Capacitor / App Store / Google Play)

1. Aplicar `supabase/migrations/20261109_account_deletion_and_security.sql` no ambiente Supabase de produção para habilitar a exclusão direta de `auth.users` via RPC `public.delete_own_account()`.
2. Cadastrar a URL pública `https://<dominio-ascend>/delete-account` no formulário **Data Safety -> Account Deletion URL** da Google Play Console.
3. No script de pré-build do Capacitor (`android`/`ios`), copiar apenas `public/optimized` (excluindo as pastas brutas legadas `public/Classes`, `public/Bosses`, `public/Cards` e `public/Treinos`), reduzindo o pacote nativo em ~149 MB.

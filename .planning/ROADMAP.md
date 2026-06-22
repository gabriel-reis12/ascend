# Roadmap

## Production Stabilization - 2026-06-16
- **Status:** Complete - Supabase remoto validado com REST e smoke test autenticado para missoes, bosses, alimentos, logs, cardapios, exercicios e rotinas.
- **Frontend hardening:** Bosses agora tem timeout defensivo, seletores estaveis do Zustand e estado de erro com retry. Missoes, Recuperacao e Centro de Treinamento exibem falhas reais de sincronizacao em tela.
- **Deploy cache control:** App agora embute `VERCEL_GIT_COMMIT_SHA`, limpa caches locais de dados quando muda de versao e envia `Cache-Control: no-store` pela Vercel para evitar Chrome preso em bundle antigo.
- **Profile cache control:** `hunter-storage` entrou na limpeza por versao/schema para impedir perfil antigo sem campos nutricionais.
- **Nutrition scoring:** Regras de XP nutricional migradas de recompensa instantanea/cardapio completo para avaliacao diaria por TMB + objetivo nutricional, com tabela idempotente `nutrition_daily_scores`.
- **Nutrition UX:** Missoes exibe calorias restantes/objetivo diario; Recuperacao mostra TMB, manutencao estimada, meta calorica e faixa de tolerancia.
- **Nutrition hybrid sync (2026-06-21):** Códex usa valores locais da TACO; conclusões de cardápios geram logs nutricionais reversíveis, entram no total diário e causam dano no boss. Auditoria posterior validou o contrato remoto e corrigiu porções customizadas e sincronizações parciais.
- **Validation:** `npm.cmd run build` aprovado.

## Phase 1: Foundation & UI/UX Base
- **Goal:** Inicializar repositório, dependências, rotas básicas e o "Design System" (Temática RPG Moderno).
- **Status:** ✅ Complete — React 19 + Vite + TailwindCSS v4 (RPG dark/neon theme), Zustand store, RPGLayout com sidebar + rotas, Supabase client configurado.

## Phase 2: Auth & Database (Supabase) + UI Components
- **Goal:** Criar o schema inicial no Supabase, autenticação multi-usuário e base de componentes premium.
- **Status:** ✅ Complete — AuthContext, ProtectedRoute, useRPGStore (loadProfile/saveProfile/reset). Auth UI via 21st.dev `auth-fuse` (AuthUI com Typewriter, split-layout, animated transitions). MobileMenu responsivo com Framer Motion. shadcn/ui configurado (button, card, table, select, comparison-table, animated-check-box). Paleta RPG mapeada via CSS vars. Schema SQL em `supabase/schema.sql`.

## Phase 3: Core RPG & Dashboard
- **Goal:** Implementar o cálculo de XP, Níveis, Títulos e Status Base do jogador — Dashboard completo e polido.
- **Status:** ✅ Complete — Dashboard redesenhado com hero banner + XP bar animada + grade de StatCards (Força/Inteligência/Resistência/Vitalidade) + resumo de quests + modal NewQuestModal (categoria livre pelo usuário, cor, XP, stat alvo) + QuestItem com NeonCheckbox + LevelUpCelebration full-screen. Orbitron font via Google Fonts. useTasks hook com CRUD completo no Supabase. pendingLevelUp/clearLevelUp no store. Tabela `tasks` adicionada ao schema (RLS, idempotente). Estilo Retro-Futurism/Cyberpunk seguindo ui-ux-pro-max.

## Phase 4: Task & Habit Management
- **Goal:** CRUD de tarefas com categorias que alimentam os Status do jogador.
- **Status:** ✅ Complete — Sistema de hábitos diários recorrentes (habits + habit_completions no Supabase). Página Quests com tabs Hoje (toggle diário, reset automático por data) e Gerenciar (ativar/desativar/deletar hábitos). Dashboard mostra progresso de hoje com barra animada + missões especiais (one-time tasks). Sidebar redesenhada com avatar, XP bar, top bar desktop com data e usuário. Qualidade de UI elevada ao nível FitTrack.

### 🎨 Aesthetic & Maintenance Polish (v0.9)
- **Status:** ✅ Complete
- **Loader:** Novo **Matrix Loader** estilo ciberpunk azul elétrico (`matrix-loader.tsx`) substituindo o `HoloPulse`.
- **Cleanup:** Pasta `obsoleto/` criada para isolar componentes legados.
- **History:** Arquivo `HISTORY.md` criado para registro contínuo.

## Phase 5: Workout Module
- **Goal:** Criação de treinos, logging diário e comparativo de carga/repetições semanal.
- **Status:** ✅ Complete — Sistema de gerenciamento de rotinas (A, B, C, D) com ordenação manual, busca de exercícios, persistência automática de carga/reps e aba de evolução com gráficos de volume e recordes pessoais (PRs).

## Phase 6: Nutrition Module
- **Goal:** Registro de refeições e tracking de calorias (Módulo de Nutrição e Missões de Refeições integradas).
- **Status:** ✅ Complete — Implementado o painel de planos de refeições, metas nutricionais diárias, ingestão de macros (Carboidratos, Proteínas, Gorduras, Fibras e Calorias) com cálculo reativo, e sincronização completa com o store de RPG (`useHunterStore`) para XP e subida de nível. Integração visual no Dashboard e cards inferiores de Calorias, Volume e Energia 100% reativos com micro-animações dinâmicas de altíssima qualidade.

## Phase 7: Boss Battles (Raid Semanal)
- **Goal:** Implementação do sistema de Chefes Finais e provações de consistência com lores associadas e persistência de dados.
- **Status:** ✅ Complete — Desenvolvida a store `useBossStore` integrada ao Supabase (`boss_battles`), vinculando a redução de HP do chefe ativo às atividades realizadas no aplicativo (tarefas, treinos, nutrição e hábitos). Criada a página premium ciberpunk `/bosses` com barra de HP neon pulsante, lore imersiva, fraquezas de combate com dano crítico, feed de dano flutuante em Framer Motion e fluxos de vitória, desbloqueio de medalhas e novos títulos equipáveis na página de configurações.
- **2026-06-16 Contract Repair:** adicionada migration consolidada `20260616_repair_app_contract.sql` para alinhar as tabelas/policies RLS do Supabase com o frontend atual, cobrindo missões, hábitos, treinos, nutrição, bosses, achievements e criação automática de profile.

## Phase 8: Módulo Fortuna (Finanças & Metas de Longo Prazo)
- **Goal:** Registro simplificado de transações e investimentos que alimentam a Sabedoria (WIS) e o dano contra o chefe do ciberespaço, além do tracking de objetivos de longo prazo.
- **Status:** ✅ Complete — Criadas as tabelas `financial_logs` e `financial_goals` com RLS restrito. Integrada a quest diária reativa "Códex Financeiro" e o painel dinâmico de metas no Módulo Fortuna, contendo a Quest do Sistema de 20% fixa e premiação de +50 XP e +2 Sabedoria.

## Phase 9: Biblioteca de Programas de Treino (Treinos Pré-Prontos)
- **Goal:** Fornecer modelos estruturados de rotinas esportivas organizadas por frequência de sessões para importação ágil.
- **Status:** ✅ Complete — Implementado o arquivo estático de presets `src/data/workoutPresets.ts` agrupado por programas (3x, 4x, 5x, 6x e Casa). Desenvolvida a aba "Modelos de Treino" em `/workouts` com filtros e modal de visualização detalhada, integrando um fluxo de importação em lote altamente resiliente contra duplicidades e erros de chave estrangeira.

## Phase 10: Módulo de Descanso & Lazer (Templo do Caçador)
- **Goal:** Habilitar o registro de repouso noturno, lazer offline e cronômetro de respiração/meditação para calibrar o atributo de Equilíbrio (BAL) no RPG.
- **Status:** ✅ Complete — Criada a tabela `rest_logs` com políticas RLS. Desenvolvida a rota `/rest` com interface de resumo e formulários de lançamento, contendo também o Templo da Mente (cronômetro guiado em Framer Motion) com recompensas de XP e BAL. Desbloqueado o card "Descanso & Lazer" no Portal de Comando.

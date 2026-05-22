# Roadmap

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

## Phase 5: Workout Module
- **Goal:** Criação de treinos, logging diário e comparativo de carga/repetições semanal.
- **Status:** Not Started

## Phase 6: Nutrition Module
- **Goal:** Registro de refeições e tracking de calorias.
- **Status:** Not Started

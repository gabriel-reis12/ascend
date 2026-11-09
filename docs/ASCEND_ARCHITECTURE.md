# ASCEND — Arquitetura Frontend e Serviços

Este documento descreve a organização técnica da aplicação React, gerenciamento de estado e integrações de banco de dados.

## 1. Stack Tecnológica Real

- **Framework & Runtime:** React 19 + TypeScript + Vite 8 (ESM).
- **Estilização:** Tailwind CSS v4 via `@tailwindcss/vite` e variáveis CSS nativas.
- **Roteamento:** React Router DOM v7 (SPA client-side, centralizado em `src/App.tsx`).
- **Estado Global:** Zustand (`useHunterStore`, `useBossStore`).
- **Autenticação:** Supabase Auth com adaptador multiplataforma (`src/lib/authStorage.ts`) usando `flowType: 'pkce'`, `autoRefreshToken: true` e `ascend-auth-token`.
- **Banco de Dados & Backend:** Supabase JS SDK (`@supabase/supabase-js: ^2.104.1`).

## 2. Padrões de Gerenciamento de Estado

- **`useHunterStore` (`src/stores/useHunterStore.ts`):** Centraliza os 7 atributos (`strength`, `endurance`, `intelligence`, `discipline`, `vitality`, `wisdom`, `balance`), XP atual, nível, rank, celebrações de evolução (`pendingLevelUp`, `pendingRankUp`) e classe escolhida.
- **`useBossStore` (`src/stores/useBossStore.ts`):** Controla o chefe ativo da semana, dano acumulado na raid, feedback de dano recente (`recentDamage`) e histórico de ataques.
- **`useSocialStore` (`src/stores/useSocialStore.ts`):** Controla amizades, solicitações, bloqueios, perfis públicos higienizados e leaderboards sazonais.
- **`useHabits` / `useTasks` (`src/hooks/`):** Custom hooks para sincronização de hábitos diários e tarefas pontuais com o Supabase e cache de leitura em `localStorage` (arquitetura assistida por cache local e sessão resiliente, mas dependente de conexão para persistência definitiva de mutações no banco).

## 3. Diretrizes de Refatoração e Segurança

1. **Zero IA no Client:** Nenhuma chamada à API da Groq, OpenAI ou qualquer LLM client-side.
2. **Proteção de Sessão:** A autenticação utiliza `authStorageAdapter`, desacoplado do `sessionStorage` para suportar ambientes móveis e futuras migrações com Capacitor.
3. **Desacoplamento Gradual:** Ao refatorar componentes gigantes (ex: `Workouts.tsx`, `Quests.tsx`), extrair subcomponentes menores mantendo a compatibilidade de contratos e sem alterar o banco de dados.


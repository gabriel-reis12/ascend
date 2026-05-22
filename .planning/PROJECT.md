# RPG Fitness & Habit Tracker

## Contexto
Um aplicativo de produtividade gamificado no estilo RPG. O usuário ganha status, experiência (XP) e níveis ao concluir tarefas diárias, treinos e registrar a alimentação. O objetivo é transformar a vida real em um jogo, usando psicologia de jogos (loss aversion, progressão, títulos) para incentivar hábitos saudáveis.

## Core Value
Transformar disciplina em diversão através de métricas de progressão de RPG aplicadas à vida real.

## Requirements

### Validated
- [x] Sistema de Autenticação Multi-usuário com Supabase Auth.
- [x] Sistema de Tarefas/Hábitos categorizados com impacto direto em Status (Zustand + Supabase).
- [x] Sistema de Nivelamento (XP), Rank e Títulos dinâmicos (Hunter System).
- [x] Módulo de Treinos com cadastro de rotinas, histórico de carga/reps e aba de evolução com Volume Semanal e recordes.
- [x] Módulo de Alimentação (Nutrição) com metas diárias de macros, ingestão reativa e missões integradas.

### Active
(Nenhum requisito ativo no momento — todos os core features foram entregues com sucesso!)

### Out of Scope
- [ ] App Mobile nativo (iOS/Android) — Inicialmente será um Web App Responsivo (PWA) para validação rápida.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Stack Frontend | React + Vite + TailwindCSS + Framer Motion | Alta performance e excelente para animações "UI/UX Pro Max" estilo RPG. |
| Backend/Auth | Supabase | Simples, escalável e resolve Auth e Database relacionais rapidamente. |
| Thematic | RPG Moderno (Dark Mode + Neon) | Estética premium que agrada usuários focados em produtividade sem parecer infantil. |

---
*Last updated: 2026-05-19 after unifications and bugfixes*


# ASCEND — Especificação do Design System HUD v2

Este documento estabelece as diretrizes oficiais de design, cores, tipografia e componentes para o projeto ASCEND.

## 1. Princípio Visual: 70 / 30

- **70% Funcionalidade Mobile Premium:** Superfícies escuras limpas, tipografia legível (Inter), espaçamentos ergonômicos, listas de tarefas e métricas com contraste elevado e sem poluição visual.
- **30% Atmosfera Dark Fantasy & Sci-Fi HUD:** Elementos de ambientação de RPG concentrados no topo das páginas (arte da classe, insígnia de rank, anéis holográficos, barra octogonal de Boss HP e cantoneiras HUD).

## 2. Tokens de Cor Oficiais

Os tokens estão definidos no Tailwind CSS 4 em `src/index.css`:

| Token CSS / Tailwind | Valor Dark Mode | Valor Light Mode | Aplicação |
| :--- | :--- | :--- | :--- |
| `--hud-bg` (`--color-hud-void`) | `#07080C` | `#f3f6fb` | Fundo principal da aplicação (OLED Deep Void) |
| `--hud-surface` (`--color-hud-surface`) | `#10121A` | `#ffffff` | Fundo padrão de cards e contêineres |
| `--hud-surface-elevated` | `#161924` | `#f8fafc` | Cards em destaque e modais |
| `--hud-cyan` (`--color-hud-cyan`) | `#00F0FF` | `#0284c7` | Acento ciano primário, progresso e CTAs |
| `--hud-purple` (`--color-hud-purple`) | `#A855F7` | `#7e22ce` | Acento secundário roxo e estado *In Progress* |
| `--hud-gold` (`--color-hud-gold`) | `#F59E0B` | `#d97706` | Ranks S/A, medalhas de conquista e +XP |
| `--hud-crimson` (`--color-hud-crimson`)| `#EF4444` | `#dc2626` | HP de Boss, raids e alertas críticos |
| `--hud-success` (`--color-hud-success`)| `#10B981` | `#059669` | Missões e tarefas concluídas (`COMPLETED`) |
| Text Primary (`--color-hud-text-primary`)| `#F8FAFC` | `#0f172a` | Títulos e números principais |
| Text Secondary (`--color-hud-text-secondary`)| `#94A3B8` | `#334155` | Subtítulos, séries, repetições, unidades |
| Text Muted (`--color-hud-text-muted`) | `#64748B` | `#64748b` | Labels inativas e metadados discretos |
| Border Subtle (`--hud-border`) | `rgba(255, 255, 255, 0.08)` | `rgba(148, 163, 184, 0.28)` | Contorno padrão de cards |
| Border Active Cyan | `rgba(0, 240, 255, 0.45)` | `rgba(2, 132, 199, 0.45)` | Borda de destaque ciano |

## 3. Tipografia

- **Orbitron (`font-orbitron`):** Exclusiva para títulos principais (`H1`), Ranks, Níveis, nomes de Bosses e indicadores de prestígio de RPG.
- **Inter (`font-inter`):** Para todo o conteúdo funcional: títulos de missões, séries de exercícios, gramas de macros, campos de formulário e dados cadastrais.

## 4. Biblioteca de Componentes Core HUD v2

1. **`HudCard` (`src/components/ui/hud-card.tsx`):** Card com gradiente radial suave superior, borda translúcida e marcadores de cantoneira opcionais (`corners={true}`).
2. **`TacticalButton` (`src/components/ui/tactical-button.tsx`):** Botão com altura mínima de 52px, variantes `primary`, `secondary` (com filetes laterais ciano/roxo), `danger` e `ghost`.
3. **`NeonProgressBar` (`src/components/ui/neon-progress.tsx`):** Barra com controle de limites (0..max) e variantes `xp`, `boss-hp` (octogonal com rótulo central), `cyan` e `neutral`.
4. **`NeonProgressRing` (`src/components/ui/neon-progress.tsx`):** Indicador circular concêntrico simples (`cyan`) ou duplo (`cyan-purple`).
5. **`RankBadge` (`src/components/ui/rank-badge.tsx`):** Brasão octogonal SVG para os ranks reais `E`, `D`, `C`, `B`, `A`, `S`, `National` e `Monarch`.


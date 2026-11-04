# ASCEND — Diretrizes de UX e Ergonomia Mobile

Este documento orienta o design e o desenvolvimento mobile-first do ASCEND para Android e iOS.

## 1. Viewports e Ergonomia (Thumb Zone)

- **Larguras Alvo:** `320px` (iPhone SE/telas compactas) a `430px` (iPhone Pro Max / Android Ultra).
- **Proibição de Scroll Horizontal:** Toda interface deve fluir estritamente em rolagem vertical (`overflow-x: hidden`).
- **Thumb Zone (Zona do Polegar):**
  - Ações primárias e navegação na metade inferior da tela (Bottom Navigation e Tactical Buttons).
  - Conteúdo visual e de ambientação (Avatar, Rank Crest, Títulos) na metade superior.

## 2. Alvos de Toque (Touch Targets)

- Altura mínima para botões e CTAs: **52px** (`min-h-[52px]`).
- Tamanho mínimo de áreas clicáveis secundárias (ícones, checkboxes, steppers): **44x44px**.
- Feedback tátil visual obrigatório ao pressionar: `active:scale-[0.985]`.

## 3. Safe Areas e Navegação Fixa

- A Bottom Navigation fixa deve incluir espaçamento para o indicador de gestos do sistema operacional:
  - `padding-bottom: env(safe-area-inset-bottom, 16px)`.
- O contêiner de rolagem principal das páginas deve ter padding inferior mínimo de `pb-24` para que o conteúdo final não fique encoberto pela barra fixa.

## 4. Modais e Bottom Sheets

- Em telas móveis (`< 768px`), priorizar a abertura de modais na base da tela (*Bottom Sheet*), com alça superior (*drag handle*) e cantos arredondados (`rounded-t-2xl`).


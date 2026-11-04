---
name: ascend-mobile-ux
description: >-
  Use this skill when designing or implementing mobile navigation, bottom navigation bars, thumb zone ergonomics,
  safe area insets, touch targets (min 44px/52px), and responsive vertical layouts for 320px-430px viewports.
---

# ASCEND Mobile UX Skill

Esta skill rege a experiência mobile-first do aplicativo, garantindo fluidez tátil e ergonomia em dispositivos iOS e Android.

## Responsabilidades

1. **Arquitetura de Navegação:** Implementar e auditar a Bottom Navigation Bar fixa (Home, Quests, Training, Nutrition, Status) com indicador luminoso de aba ativa.
2. **Ergonomia do Polegar (Thumb Zone):** Garantir que ações frequentes fiquem no terço inferior da tela, evitando comandos críticos nos cantos superiores de difícil alcance.
3. **Dimensões Mínimas de Toque:**
   - Botões principais / CTAs táticos: altura mínima de **52px** (`min-h-[52px]`).
   - Botões secundários, ícones e checkboxes: área mínima de **44x44px**.
4. **Safe Areas e Scroll:**
   - Respeitar entalhes e barras de gestos via `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)`.
   - Adicionar `pb-24` em containers roláveis para que a barra inferior não cubra o último item da lista.
   - Proibição estrita de scroll horizontal nas páginas principais.

## Procedimento de Verificação de UX

1. Testar o layout nas larguras de 320px (iPhone SE) e 390px (iPhone padrão).
2. Verificar se modais em telas móveis operam preferencialmente como Bottom Sheets.
3. Confirmar que micro-interações possuem feedback visual imediato (`active:scale-[0.985]`).

## Documento de Apoio
Consulte [docs/ASCEND_MOBILE_GUIDELINES.md](../../docs/ASCEND_MOBILE_GUIDELINES.md) para detalhes de safe areas e layouts móveis.


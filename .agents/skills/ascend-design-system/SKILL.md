---
name: ascend-design-system
description: >-
  Use this skill when implementing or modifying UI components, tokens in Tailwind CSS 4, HudCard,
  TacticalButton, NeonProgressBar, NeonProgressRing, RankBadge, or theme variables in src/index.css.
---

# ASCEND Design System Skill

Esta skill padroniza os blocos de construção visuais do sistema **ASCEND HUD v2**, garantindo reutilização e eliminando código CSS duplicado.

## Responsabilidades

1. **Tokens Tailwind CSS 4:** Centralizar estilizações nos tokens `--hud-*` e utilitários declarados em `src/index.css`.
2. **Componentes Primitivos Oficiais:**
   - `<HudCard variant="..." corners={true}>`: Superfície grafite com cantoneiras HUD opcionais.
   - `<TacticalButton variant="primary|secondary|danger" accent="cyan|purple|gold|crimson">`: Botão tático com min-h de 52px.
   - `<NeonProgressBar value={...} max={...} variant="xp|boss-hp">`: Barra de progresso com clamping de segurança.
   - `<NeonProgressRing value={...} variant="cyan|cyan-purple">`: Anel circular SVG simples ou concêntrico.
   - `<RankBadge rank="E|D|C|B|A|S" size="sm|md|lg">`: Insígnia poligonal estilizada.
3. **Respeito a Reduced Motion:** Utilizar `useReducedMotion()` do Framer Motion e a media query `prefers-reduced-motion` em qualquer nova animação.
4. **Suporte Dual-Theme:** Garantir que novos componentes mantenham legibilidade quando `.theme-light` estiver ativo.

## Procedimento de Uso de Componentes

1. Sempre importar componentes de `@/components/ui/...` em vez de criar divs estilizadas ad-hoc.
2. Não criar novas variantes de cor que não estejam mapeadas na paleta oficial HUD v2.

## Documento de Apoio
Consulte [docs/ASCEND_DESIGN_SYSTEM.md](../../docs/ASCEND_DESIGN_SYSTEM.md) para a API completa dos componentes.


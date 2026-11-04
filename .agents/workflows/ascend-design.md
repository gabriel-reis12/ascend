---
description: >-
  Workflow oficial para implementar ou refinar interfaces do ASCEND, garantindo mobile-first,
  fidelidade às referências em design/references/ e respeito aos tokens do ASCEND HUD v2.
---

# Workflow: ascend-design

Este workflow orquestra a implementação e o polimento visual de telas e componentes no ASCEND.

## 1. Papéis e Agentes Envolvidos

- **Agente Primário:** `ASCEND Mobile Engineer`
- **Agentes Revisores:** `ASCEND Creative Director`, `ASCEND QA Engineer`
- **Skills Vinculadas:** `ascend-art-director`, `ascend-design-system`, `ascend-mobile-ux`, `ascend-qa-reviewer`

---

## 2. Passo a Passo Operacional

1. **Alinhamento Artístico (Creative Director):**
   - Inspecionar a referência visual correspondente em `design/references/`.
   - Confirmar a proporção de 70% funcionalidade mobile / 30% atmosfera RPG HUD.
   - Preservar as artes originais de classes e chefes em `/public/optimized/`.

2. **Ergonomia e Mobile-First (Mobile Engineer):**
   - Validar viewports de 320px a 430px sem rolagem horizontal.
   - Garantir área de toque $\ge 52$px para CTAs e $\ge 44$x$44$px para controles secundários.
   - Assegurar espaçamento seguro para barra inferior (`pb-24`) e safe-areas `env(safe-area-inset-*)`.

3. **Aplicação do Design System (Design System):**
   - Utilizar componentes oficiais: `<HudCard>`, `<TacticalButton>`, `<NeonProgressBar>`, `<NeonProgressRing>` e `<RankBadge>`.
   - Utilizar tokens oficiais `--hud-*` de `src/index.css`.
   - Manter compatibilidade com `.theme-light` e `prefers-reduced-motion`.

4. **Homologação e Testes (QA Engineer):**
   - Executar suíte de testes de componentes (`node execution/test_hud_components.mjs`).
   - Auditar dicionário bilíngue PT-BR/EN-US (`node --experimental-strip-types execution/audit_localization.mjs`).

---

## 3. Regras e Restrições

- Não modificar regras de negócio, XP ou fórmulas de progressão.
- Não introduzir funcionalidades ou botões que não existam na especificação.
- Nunca reintroduzir chamadas de inteligência artificial ou chaves de API no client.


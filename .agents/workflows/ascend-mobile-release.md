---
description: >-
  Workflow oficial para auditoria de prontidão e preparação para empacotamento com Capacitor,
  verificação de armazenamento seguro nativo e checklist de publicação na Google Play e App Store.
---

# Workflow: ascend-mobile-release

Este workflow orquestra a auditoria de conformidade para a futura distribuição móvel nativa do ASCEND no Android e iOS via Capacitor.

## 1. Papéis e Agentes Envolvidos

- **Agente Primário:** `ASCEND Mobile Engineer`
- **Agentes Revisores:** `ASCEND Software Architect`, `ASCEND QA Engineer`
- **Skills Vinculadas:** `ascend-mobile-ux`, `ascend-frontend-architect`, `ascend-qa-reviewer`

---

## 2. Passo a Passo Operacional

1. **Auditoria de Sessão e Storage Nativo:**
   - Confirmar que o cliente Supabase utiliza a camada desacoplada `authStorageAdapter` de `src/lib/authStorage.ts`.
   - Verificar ausência de dependências diretas de `window.sessionStorage` que possam forçar deslogamentos no mobile.

2. **Auditoria de Recursos Nacionais e Viewports:**
   - Verificar conformidade com entalhes de tela (*notch / dynamic island*) e barra de gestos via `env(safe-area-inset-*)`.
   - Garantir que o container principal possua `pb-24` para a Bottom Bar não cobrir botões de ação finais.
   - Auditar suporte futuro a plugins nativos (`@capacitor/haptics`, `@capacitor/push-notifications`).

3. **Checklist de Políticas das Lojas:**
   - Confirmar ausência de APIs não declaradas e de chaves secretas no bundle.
   - Avaliar modelo de faturamento digital (regra Apple IAP / Google Play Billing para compras digitais in-app).

4. **Preparação para Injeção do Capacitor:**
   - Verificar estrutura de assets (`Icon 2.png`, ícones de aplicativo adaptativos 192px/512px e splash screen).
   - Não instalar o Capacitor antecipadamente sem autorização formal do usuário.

---

## 3. Regras e Restrições

- Não instalar `@capacitor/cli` ou dependências nativas nesta etapa de planejamento.
- Não executar builds locais de Android Studio ou Xcode sem autorização.
- Não submeter nada a lojas remotas (Google Play Console ou Apple Developer Program).


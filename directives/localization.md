# SOP: Localização PT-BR / EN-US

## Objetivo

Garantir que autenticação, onboarding, tutorial e todos os módulos respeitem o idioma selecionado pelo usuário.

## Regras

- O idioma deve poder ser escolhido antes do login.
- A escolha deve persistir em `ascend_language`.
- Login, cadastro, onboarding e tutorial devem possuir cópia inglesa explícita.
- Novos componentes devem preferir `usePreferences()` e cópia bilíngue explícita.
- `LocalizationBridge` cobre textos legados durante a migração, incluindo placeholders, títulos, ARIA e diálogos `alert`/`confirm`.
- Conteúdo dinâmico criado pelo usuário não deve ser alterado intencionalmente.
- Datas devem usar o locale selecionado, nunca `pt-BR` fixo.
- Antes de concluir alterações de interface, executar:
  - `npm.cmd run audit:i18n`
  - `npm.cmd run build`

## Arquivos centrais

- `src/contexts/PreferencesContext.tsx`
- `src/components/preferences/LanguageSwitcher.tsx`
- `src/components/preferences/LocalizationBridge.tsx`
- `src/lib/uiEnglish.ts`
- `execution/audit_localization.mjs`

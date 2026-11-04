---
name: ascend-frontend-architect
description: >-
  Use this skill when modifying React 19 architecture, TypeScript contracts, Zustand stores,
  Supabase queries, routing in App.tsx, session persistence in authStorage, or preparing for Capacitor.
---

# ASCEND Frontend Architect Skill

Esta skill rege a integridade arquitetural do código TypeScript/React do ASCEND, prevenindo regressões, vazamento de credenciais e acoplamento indevido.

## Responsabilidades

1. **Arquitetura de Estado:** Manter Zustand (`useHunterStore`, `useBossStore`) como única fonte de verdade para status do caçador e raids, evitando estados concorrentes na UI.
2. **Autenticação Segura:** Preservar o adaptador `authStorageAdapter` e as proteções de concorrência (`loadingProfileRef`, `currentUserRef`) em `src/contexts/AuthContext.tsx`.
3. **Desacoplamento Gradual:** Ao refatorar componentes volumosos (ex: `Quests.tsx`, `Workouts.tsx`), decompor em submódulos funcionais sem alterar os nomes de rotas ou quebrar APIs de dados.
4. **Zero IA no Client:** Não permitir a inserção de chaves de API externas ou chamadas `fetch` a serviços de LLM no bundle web.
5. **Prontidão para Capacitor:** Manter o código isolado de dependências que presumam navegadores desktop, preparando para injeção de plugins nativos móveis.

## Procedimento de Validação Arquitetural

1. Executar checagens de tipos e compilação do Vite antes de submeter alterações.
2. Garantir que efeitos colaterais de rede utilizem `withRetry` quando forem consultas críticas.

## Documento de Apoio
Consulte [docs/ASCEND_ARCHITECTURE.md](../../docs/ASCEND_ARCHITECTURE.md) para detalhes de autenticação e stores.


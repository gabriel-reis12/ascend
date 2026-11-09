# ASCEND — RELATÓRIO TÉCNICO // BETA UX FIX: NAVEGAÇÃO MOBILE E SETTINGS

**Equipe Especializada:** ASCEND Mobile Engineer, Software Architect, Design System Lead & QA Reviewer  
**Data:** 09/11/2026  
**Branch:** `beta`  
**Status de Homologação:** **APROVADO (GO)**

---

## 1. CAUSA RAIZ DO ERRO DE SETTINGS

Durante a auditoria e reprodução em navegador real, foram identificados **três fatores combinados** que impediam a rota `/settings` de carregar adequadamente no ambiente Beta:

1. **Vulnerabilidade de Code-Splitting sem ErrorBoundary em `App.tsx`:**
   - Com a implementação de `React.lazy` na Etapa 04.7 para otimização de performance mobile, as rotas foram envolvidas apenas por `<Suspense fallback={<RouteLoadingFallback />}>`.
   - Em SPAs publicadas na nuvem (como Vercel/CDN), ao publicar uma nova versão com hashes de arquivos alterados (ex: `Settings-[hash].js`), clientes com Service Worker, cache de PWA ou abas abertas da versão anterior tentam buscar o chunk antigo que não existe mais no servidor.
   - O `<Suspense>` **não captura rejeições de promessas de importação dinâmica** (`TypeError: Failed to fetch dynamically imported module: ...`). Como não havia um `ErrorBoundary` em torno das rotas, o erro não tratado derrubava toda a árvore React, resultando em tela branca irreversível para o usuário.

2. **Loop de Hidratação Redundante de Perfil em `Settings.tsx`:**
   - No ciclo de montagem de `Settings.tsx`, um `useEffect` monitorava o objeto `user` e disparava incondicionalmente `void hunterStore.loadProfile(user.id)`.
   - Cada atualização ou refresh de token criava uma nova referência de `user`, reexecutando `loadProfile` e alternando `profileLoading: true` no Zustand. Caso houvesse oscilação ou latência de rede no Supabase, a store definia `profileError`, fazendo o `ProtectedRoute` desviar o fluxo do componente ou travar a tela em estado de carregamento permanente.

3. **Fragilidade de Tipagem em Parâmetros de Montagem:**
   - A função `getClassConfig` realizava `rank.toUpperCase()` sem validação estrita de tipo `typeof r === 'string'`, o que gerava exceções de runtime caso o rank estivesse indefinido ou em formato de objeto antes da hidratação completa.
   - A varredura de títulos (`achievements.forEach`) não possuía guarda defensiva para elementos nulos ou registros parciais.

---

## 2. CORREÇÃO APLICADA

1. **Implementação do `RouteErrorBoundary.tsx` (`src/components/common/RouteErrorBoundary.tsx`):**
   - Criação de um Error Boundary especializado com interceptação de erros de importação dinâmica de chunks (`/Failed to fetch dynamically imported module/i`, `/Importing a module script failed/i`, etc.).
   - **Auto-Reload Preventivo Transparente:** Em caso de descompasso de versão de bundle recém-publicada, executa um recarregamento automático inteligente (com proteção de cooldown em `sessionStorage` para evitar loops).
   - **Interface HUD v2 de Recuperação:** Caso a falha persista, renderiza um card tático `variant="crimson"` com mensagens claras, botão **"Tentar Novamente"**, botão **"Central do Caçador"** (`/hub`) e botão **"Início"** (`/`).
   - **Diagnóstico Técnico Aberto:** Gaveta expansível `<details>` com pilha técnica completa de erros (`error.name`, `error.message`, `error.stack` e `componentStack`), garantindo transparência e observabilidade para a equipe de engenharia.

2. **Carregamento Resiliente com `lazyWithRetry()` em `src/App.tsx`:**
   - Envolvimento de todas as rotas `lazy` na função utilitária `lazyWithRetry()`, que trata falhas transitórias de CDN antes que afetem a montagem.

3. **Blindagem de Montagem em `src/pages/Settings.tsx`:**
   - Restrição do disparo de `loadProfile(user.id)` exclusivamente para cenários onde o perfil ainda não foi carregado ou pertence a outro usuário (`!hunterStore.profileLoaded || hunterStore.profileUserId !== user.id`).
   - Normalização segura de rank (`typeof r === 'string' ? r.toUpperCase() : 'E'`).
   - Tratamento defensivo em `achievements.forEach` e consultas de telemetria com fallback de valor neutro (`0`).

---

## 3. ESTRUTURA FINAL DE NAVEGAÇÃO

### A. 5 Destinos Canônicos da Bottom Navigation Mobile

| Slot | Destino | Rota | Ícone | Função |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Início** | `/` | `Home` | Portal principal de comando, hábitos do dia e resumo rápido |
| **2** | **Missões** | `/quests` | `CheckSquare` | Quadro de missões diárias, semanais e desafios táticos |
| **3** | **Treinos** | `/workouts` | `Dumbbell` | Centro de Treinamento, rotinas ativas e execução de séries |
| **4** | **Nutrição** | `/nutrition` | `Apple` | Códex alimentar, cardápios, metas de macros e hidratação |
| **5** | **Central** | `/hub` | `Compass` | Portal do Caçador, Player Status e acesso a todos os submódulos |

### B. Central do Caçador (`src/pages/HunterHub.tsx`)
A Central funciona como uma base de lançamento operacional, dividida em três níveis visuais com alvos de toque confortáveis ($\ge 44$px/48px):

1. **Header de Identidade:**
   - Imagem de vocação da classe correspondente ao Rank atual com fallback estático.
   - Nome do caçador, classe, título ativo e RankBadge.
   - Barra de progresso de nível com contagem exata de XP.
2. **Card Destaque — Player Status (`/status`):**
   - CTA destacado em card violeta com acesso direto à Ficha de Atributos, radar tático dos 7 atributos e parâmetros biométricos.
3. **Grupos Funcionais Coerentes:**
   - **Desafios & Conquistas:** `Boss Raids` (`/bosses`) + `Trophy Room` (`/trophies`).
   - **Vida, Equilíbrio & Comunidade:** `Fortuna` (`/fortuna`) + `Descanso` (`/rest`) + `Social` (`/social`).
   - **Sistema & Configurações:** `Ajustes` (`/settings`).

### C. Acesso aos Boss Raids e Player Status
- **Boss Raids:** Mantido acesso pelo widget da Home (`QuickMenu.tsx`), pelo menu drawer (`MobileMenu.tsx`), pelo menu lateral desktop (`RPGLayout.tsx`) e agora pelo card de destaque em Desafios na Central.
- **Player Status:** Mantido acesso pelo avatar do caçador na Home, pelo indicador compacto de nível do cabeçalho móvel nas telas internas e pelo card proeminente no topo da Central.

### D. Estados Ativos da Bottom Nav
Ao navegar a partir da Central para qualquer um dos seus submódulos (`/hub`, `/status`, `/bosses`, `/trophies`, `/fortuna`, `/rest`, `/social`, `/settings`), a aba **Central** permanece iluminada com seu halo ciano e indicador superior ativo, evitando desorientação do usuário.

---

## 4. ARQUIVOS MODIFICADOS

| Arquivo | Natureza | Descrição das Modificações |
| :--- | :--- | :--- |
| `src/components/common/RouteErrorBoundary.tsx` | **Novo** | Error boundary para rotas com auto-reload para descompasso de chunks e tela de recuperação HUD |
| `src/pages/HunterHub.tsx` | **Novo** | Central do Caçador com identidade, Player Status em destaque e cards para os 6 submódulos |
| `src/components/layout/BottomNav.tsx` | Modificado | 5 abas oficiais com Central no 5º slot e subPaths mapeados para iluminação consistente |
| `src/components/layout/MobileMenu.tsx` | Modificado | Inclusão de `/hub` (Central) no drawer mobile com ícone `Compass` |
| `src/components/layout/RPGLayout.tsx` | Modificado | Inclusão de `/hub` na sidebar desktop; preservação de links diretos sem duplicidade ou conflito |
| `src/App.tsx` | Modificado | Registro de `HunterHub` nas rotas `/hub` e `/central`, `lazyWithRetry()` e envolvimento em `RouteErrorBoundary` |
| `src/pages/Settings.tsx` | Modificado | Proteção no ciclo de montagem de `loadProfile`, fallback seguro de rank e achievements defensivo |
| `src/contexts/preferences.ts` | Modificado | Adição das chaves de internacionalização `nav.hub` e `nav.central` |
| `execution/qa_beta_navigation_settings.mjs` | **Novo** | Suíte de homologação em navegador real Chromium Headless via CDP Pipe |
| `execution/test_route_error_boundary.mjs` | **Novo** | Suíte de testes unitários para a nova navegação, contratos de erro e Central |
| `execution/test_mobile_layout.mjs` | Modificado | Atualização da asserção de 5 abas oficiais de BottomNav para incluir `/hub` |
| `HISTORY.md` | Modificado | Registro histórico da entrega conforme Golden Rule 1 |

---

## 5. ROTAS VERIFICADAS

- [x] `/` (Início / Portal de Comando)
- [x] `/hub` (Central do Caçador)
- [x] `/central` (Redirecionamento canônico para `/hub`)
- [x] `/status` (Player Status — via Home, header e Central)
- [x] `/quests` (Missões do Caçador)
- [x] `/workouts` (Centro de Treinamento)
- [x] `/nutrition` (Códex de Nutrição)
- [x] `/bosses` (Boss Raids semanais)
- [x] `/trophies` (Salão de Troféus e Títulos)
- [x] `/fortuna` (Finanças e Sabedoria)
- [x] `/rest` (Descanso, Sono e Equilíbrio)
- [x] `/social` (Guilda e Companheiros)
- [x] `/settings` (Ajustes de Sistema — Abertura direta, via menu e pós-reload)

---

## 6. SCREENSHOTS MOBILE E DESKTOP

Evidências visuais geradas e persistidas em `.tmp/screenshots/beta_ux_fix/`:

| Arquivo de Imagem | Resolução | Viewport | Aspecto Validado |
| :--- | :---: | :---: | :--- |
| `hub_320x700.png` | $320 \times 700$ | Mobile Compacto | Sem overflow horizontal, tipografia legível, alvos $\ge 44$px |
| `hub_375x812.png` | $375 \times 812$ | Mobile Padrão | Layout equilibrado, avatar proporcional, alinhamento de cards |
| `hub_mobile_390x844.png` | $390 \times 844$ | Mobile Flagship | Hierarquia visual com destaque de Player Status e 6 cards |
| `hub_430x932.png` | $430 \times 932$ | Mobile Pro Max | Safe areas inferiores respeitadas pela BottomNav |
| `hub_desktop_1280x800.png` | $1280 \times 800$ | Desktop Widescreen | Grid responsivo de 3 colunas, sem cartões esticados artificialmente |
| `hub_en_us_390x844.png` | $390 \times 844$ | Mobile | Bilinguismo completo em EN-US |
| `settings_direct_390x844.png` | $390 \times 844$ | Mobile | Abertura direta de `/settings` com hidratação imediata |
| `settings_reloaded_390x844.png` | $390 \times 844$ | Mobile | Recarregamento de `/settings` sem travas ou tela branca |
| `settings_desktop_1280x800.png` | $1280 \times 800$ | Desktop | Visualização ampla de Ajustes com sidebar lateral ativa |
| `status_from_home_avatar_390x844.png` | $390 \times 844$ | Mobile | Acesso funcional a `/status` a partir do perfil da Home |
| `submodule_boss_raids_390x844.png` | $390 \times 844$ | Mobile | Submódulo Boss Raids com aba Central iluminada |
| `submodule_trophy_room_390x844.png` | $390 \times 844$ | Mobile | Submódulo Trophy Room com aba Central iluminada |
| `submodule_fortuna_390x844.png` | $390 \times 844$ | Mobile | Submódulo Fortuna com aba Central iluminada |
| `submodule_descanso_390x844.png` | $390 \times 844$ | Mobile | Submódulo Descanso com aba Central iluminada |
| `submodule_social_390x844.png` | $390 \times 844$ | Mobile | Submódulo Social com aba Central iluminada |
| `submodule_player_status_390x844.png`| $390 \times 844$ | Mobile | Submódulo Player Status com aba Central iluminada |

---

## 7. TESTES EXECUTADOS

1. **Testes de Homologação em Navegador Real (`execution/qa_beta_navigation_settings.mjs`):**
   - 16/16 testes passaram com 0 exceções não tratadas no runtime.
2. **Suíte Completa de Testes Automatizados (`execution/run_all_tests.mjs`):**
   - **31/31 suítes de teste aprovadas com 100% de sucesso**.
3. **Checagem Estrita de Tipos TypeScript (`npm run typecheck`):**
   - `tsc -b` executado com **0 erros** de compilação.
4. **Build de Produção Vite (`npm run build`):**
   - Compilação concluída com sucesso em 3.39s. Chunk de `HunterHub` gerado com 16.37 kB (3.89 kB gzip).
5. **Auditoria de Internacionalização (`npm run audit:i18n`):**
   - Dicionários validados com sucesso (`localization audit: ok`).

---

## 8. PENDÊNCIAS

- Nenhuma pendência técnica impeditiva.
- Como o ambiente Vercel é remoto e as regras de segurança exigem autorização explícita, a publicação remota da branch `beta` no GitHub aguarda comando do usuário.

---

## 9. VEREDITO FINAL: GO / NO-GO

### **VEREDITO: GO (AUTORIZADO PARA ATUALIZAR O BETA)**

**Justificativa:**
- A falha crítica de carregamento de `/settings` foi solucionada na raiz através do `RouteErrorBoundary`, `lazyWithRetry` e correção de montagem.
- A reorganização mobile para 5 abas (`Início`, `Missões`, `Treinos`, `Nutrição`, `Central`) simplificou a barra inferior enquanto garantiu que nenhum módulo fique escondido ou inacessível.
- O acesso a `Player Status` e `Boss Raids` foi plenamente preservado.
- 100% dos testes reais e unitários foram aprovados.


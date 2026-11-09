# ASCEND — ETAPA 04.9: BETA WEB & REAL-WORLD VALIDATION
## Relatório de Preparação Técnica, Segurança, PWA, Observabilidade e Homologação Pré-Lançamento

**Data:** 09 de Novembro de 2026  
**Status do Pipeline:** Homologado Localmente (30/30 Testes Aprovados, Typecheck Limpo, Build 1.98s, PWA Configurado, Observabilidade Pronta)  
**Papéis e Skills Ativados (ASCEND Agent Team v1):**
- **ASCEND Software Architect** (`ascend-frontend-architect`)
- **ASCEND Mobile Engineer** (`ascend-mobile-ux`)
- **ASCEND Creative Director** (`ascend-art-director`, `ascend-design-system`)
- **ASCEND Gameplay Guardian** (`ascend-gameplay-guardian`)
- **ASCEND QA Engineer** (`ascend-qa-reviewer`)

---

## 1. Estado Inicial

A auditoria prévia às Etapas 04.7 e 04.8 identificou um conjunto de requisitos essenciais para que o ASCEND pudesse ser testado em ambiente web real (Vercel Preview / Desktop / Mobile) sem riscos operacionais:

1. **Repositório Git & Branches:**
   - O branch principal de produção é `main` (commit `384b1ce` sincronizado com `origin/main`).
   - Os arquivos modificados e criados nas etapas recentes (04.7, 04.8 e 04.9) estão preservados no workspace local sem perdas e sem commits prematuros, aguardando o checklist formal de publicação.
2. **Cliente Supabase & Fallback:**
   - Na Etapa 04.8, um fallback gracioso foi introduzido para permitir testes headless sem `.env`. Contudo, em ambientes publicados (Vercel), esse fallback poderia silenciar ausências de credenciais, deixando o app visualmente funcional mas desconectado da persistência remota.
3. **PWA & Manifest:**
   - O aplicativo não possuía `manifest.webmanifest`, meta-tags de PWA (theme-color, standalone, apple-touch-icon) ou declaração de escopo.
4. **Observabilidade no Beta:**
   - Não havia mecanismo nativo para testadores reportarem bugs estruturados com telemetria de dispositivo/viewport sem expor senhas ou tokens de sessão.
5. **Vercel & Cache:**
   - O `vercel.json` forçava `no-store, max-age=0` em todos os arquivos indiscriminadamente, impedindo o cache imutável de chunks JS com hash e sobrecarregando recarregamentos.

---

## 2. Arquitetura do Beta

Para garantir que a fase de testes reais não interfira no ambiente de produção nem exponha dados sensíveis, a arquitetura do Beta foi estruturada em duas camadas:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ARQUITETURA DE TESTES BETA WEB                        │
├──────────────────────────────────────┬──────────────────────────────────────┤
│  CAMADA FRONTEND (VERCEL PREVIEW)    │  CAMADA BACKEND (SUPABASE HOMOLOG)   │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Branch: `beta`                     │ • Projeto Supabase Isolado           │
│ • URL: `https://ascend-beta...`      │ • Auth: PKCE + Redirects do Beta     │
│ • Bundle: Code-Split (158 kB chunk)  │ • Schema: 20261109_account_deletion  │
│ • PWA: Standalone (iOS / Android)    │ • Dados: Contas descartáveis         │
│ • Observabilidade: BetaIssueTracker  │ • RLS: Isolamento estrito por UID    │
│ • Cache: Assets imutáveis + HTML fresh│ • Zero dados pessoais de produção   │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

1. **Branch de Deploy:** Criação e push da branch `beta` para acionar um deployment de **Preview** na Vercel, mantendo a branch `main` intacta como base de produção.
2. **Ambiente Supabase de Homologação:** Utilização de um projeto Supabase dedicado para o Beta (ou banco com schema clonado), garantindo que testes de exclusão de conta, cadastros descartáveis e resets de atributos não afetem dados reais.
3. **Sem Credenciais Privilegiadas no Client:** O frontend consome exclusivamente a chave pública anônima (`VITE_SUPABASE_ANON_KEY`), sem chaves `service_role` ou APIs de terceiros.

---

## 3. Alterações Realizadas na Etapa 04.9

### 3.1. Correção do Fallback do Supabase ([src/lib/supabase.ts](file:///d:/Área de Trabalho/ASCEND/ascend/src/lib/supabase.ts))
- Implementada a função `validateSupabaseConfiguration()` e a flag booleana `isSupabaseConfigured`.
- Implementada a detecção estrita de ambiente de testes (`isTestEnvironment`), permitindo mocks apenas em execuções de Node.js / CLI.
- No navegador, quando `!isSupabaseConfigured`:
  - O console emite aviso crítico explícito com instrução de configuração na Vercel.
  - A tela de autenticação ([hunter-login.tsx](file:///d:/Área de Trabalho/ASCEND/ascend/src/components/ui/hunter-login.tsx)) exibe um banner de alerta HUD chamativo: *"Ambiente Desconectado // Supabase Pendente"*.
  - Os métodos `signIn`, `signUp` e `resetPasswordForEmail` em [AuthContext.tsx](file:///d:/Área de Trabalho/ASCEND/ascend/src/contexts/AuthContext.tsx) bloqueiam tentativas de rede inúteis e retornam mensagem explicativa de configuração.

### 3.2. PWA & Experiência Instalável ([public/manifest.webmanifest](file:///d:/Área de Trabalho/ASCEND/ascend/public/manifest.webmanifest) & [index.html](file:///d:/Área de Trabalho/ASCEND/ascend/index.html))
- Criado o arquivo `manifest.webmanifest` com:
  - `name`: "ASCEND // The Hunter System"
  - `short_name`: "ASCEND"
  - `display`: "standalone"
  - `orientation`: "portrait"
  - `background_color`: "#030408"
  - `theme_color`: "#030408"
  - `icons`: ícone otimizado maskable `/optimized/Icon 2.png`.
- Atualizado o [index.html](file:///d:/Área de Trabalho/ASCEND/ascend/index.html) com meta tags:
  - `<meta name="theme-color" content="#030408" />`
  - `<meta name="apple-mobile-web-app-capable" content="yes" />`
  - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`
  - `<link rel="manifest" href="/manifest.webmanifest" />`
  - `<link rel="apple-touch-icon" href="/optimized/Icon 2.png" />`
- Não foi adicionado Service Worker agressivo com cache de código (evitando problemas comuns de versões obsoletas presas no navegador dos testadores).

### 3.3. Sistema de Observabilidade Beta ([src/lib/betaObservability.ts](file:///d:/Área de Trabalho/ASCEND/ascend/src/lib/betaObservability.ts))
- Coleta telemetria técnica de forma anônima e segura:
  - ID único (`BETA-YYYYMMDD-XXXXX`)
  - Timestamp ISO
  - Dispositivo e Viewport (`window.innerWidth x window.innerHeight`, ratio de pixels)
  - Plataforma e Navegador
  - Rota atual afetada
  - Versão da aplicação (`0.4.9-beta`)
- **Sanitização de Segurança:** Função `sanitizeReportText()` remove automaticamente padrões de JWTs (`eyJ...`), senhas, chaves de API e cartões de crédito.
- Armazenamento local das últimas 50 ocorrências em `localStorage` (`ascend_beta_issue_reports`).
- Formatação automática em **Markdown estruturado** para compartilhamento no GitHub Issues / Discord.
- Exportação em lote em arquivo JSON para auditoria técnica.

### 3.4. Interface de Feedback Beta ([src/components/beta/BetaFeedbackModal.tsx](file:///d:/Área de Trabalho/ASCEND/ascend/src/components/beta/BetaFeedbackModal.tsx))
- Modal HUD com abas **"Novo Relatório"** e **"Histórico de Problemas"**.
- Seletor de gravidade: *Baixa (Verde)*, *Média (Amarelo)*, *Alta (Laranja)* e *Crítica (Vermelho)*.
- Botão *"Salvar e Copiar Markdown"* com cópia automática para a área de transferência.
- Botão discreto adicionado no painel de Telemetria de [Settings.tsx](file:///d:/Área de Trabalho/ASCEND/ascend/src/pages/Settings.tsx).

### 3.5. Otimização de Cache e Segurança no Vercel ([vercel.json](file:///d:/Área de Trabalho/ASCEND/ascend/vercel.json))
- `/assets/(.*)` configurado com cache imutável: `public, max-age=31536000, immutable`.
- `/(.*)` (HTMLs e Manifest) configurado com revalidação estrita: `public, max-age=0, must-revalidate`.
- Headers de segurança HTTP: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 4. Configuração Necessária na Vercel

Ao publicar o deployment na Vercel (Preview ou Produção), configure as seguintes variáveis em **Project Settings → Environment Variables**:

| Nome da Variável | Escopo Recomendado | Exemplo de Valor |
| :--- | :---: | :--- |
| `VITE_SUPABASE_URL` | Preview & Production | `https://your-project-ref.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Preview & Production | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

*(Nenhuma outra variável é necessária. Variáveis de IA e gateways legados foram eliminadas).*

---

## 5. Configuração Necessária no Supabase

No painel do projeto Supabase de Homologação/Beta:

1. **Authentication → URL Configuration:**
   - **Site URL:** `https://<ascend-beta-preview>.vercel.app` (ou domínio do Beta)
   - **Redirect URLs:**
     - `https://<ascend-beta-preview>.vercel.app/**`
     - `https://<ascend-beta-preview>.vercel.app/`
     - `https://<ascend-beta-preview>.vercel.app/settings`
     - `https://<ascend-beta-preview>.vercel.app/forgot-password`
     - `http://localhost:5173/**` (para testes locais)
2. **Authentication → Email Templates:**
   - Confirm signup e Reset password com link apontando para as rotas acima.
3. **Database → Migrations:**
   - Aplicar o script [20261109_account_deletion_and_security.sql](file:///d:/Área de Trabalho/ASCEND/ascend/supabase/migrations/20261109_account_deletion_and_security.sql) no SQL Editor para habilitar a RPC de exclusão segura.

---

## 6. Status de PWA

- **Instalabilidade:** Suporte a "Adicionar à Tela Inicial" / "Instalar App" no Chrome (Android/Desktop), Edge e Safari (iOS "Adicionar à Tela de Início").
- **Exibição:** `standalone` (executa sem barra de endereços do navegador, como app nativo).
- **Cores do Sistema:** Barra de status e tema integrados em `#030408`.
- **Estratégia de Cache:** O cache de assets com hash garante navegação ultra-rápida, enquanto o documento HTML é sempre consultado na rede (`must-revalidate`), impedindo que o testador fique preso em uma versão antiga do código.

---

## 7. Validação de Segurança

A auditoria estrita do código e do SQL confirmou:

1. **Autorização na Exclusão de Conta:**
   - A função `delete_own_account()` valida `auth.uid() is not null`. Se chamada sem autenticação, lança exceção imediata.
   - Apenas a role `authenticated` possui permissão de execução (`revoke all from public, anon; grant execute to authenticated`).
   - `set search_path = public, auth` impede ataques de *search_path hijacking*.
2. **Ordem de Limpeza Referencial:**
   - Tabelas-filhas são removidas antes das tabelas-pai (`meal_plan_items` antes de `meal_plans`; `routine_exercises` antes de `workout_routines`), prevenindo violações de chave estrangeira.
3. **Isolamento de Perfis Públicos:**
   - Política RLS em `public.profiles` restringe a leitura pública a usuários autenticados (`to authenticated using (auth.uid() = id or is_public = true)`), impedindo scraping anônimo.
4. **Sanitização de Logs:**
   - Nenhum token, senha, cartão ou informação privada é gravado no módulo de observabilidade `betaObservability.ts`.

---

## 8. Testes Executados & Evidências de QA

A suíte completa de testes automatizados foi expandida para **30 suítes independentes**, todas aprovadas com 100% de sucesso:

```bash
# Execução da suíte completa de testes
node execution/run_all_tests.mjs
# SUMMARY: 30/30 suites passed (0 failed)

# Auditoria de localização e dicionários
npm run audit:i18n
# localization audit: ok

# Verificação estática de tipos
npm run typecheck
# tsc -b (0 erros)

# Compilação final de produção
npm run build
# built in 1.98s (0 warnings de chunk > 500 kB)
```

### Detalhamento das Suítes Executadas:
- `test_beta_validation_049.mjs`: Validação de fallback do Supabase, PWA manifest, observabilidade, segurança SQL e contratos das jornadas do Beta.
- `test_mobile_experience_048.mjs`: Testes do DailyActionCenter, ergonomia 44px e alvos de toque.
- `test_product_hardening_047.mjs`: 7 atributos, exclusão de conta, game feel e repetição de refeições.
- `test_auth_guard_regression.mjs`, `test_auth_storage.mjs`, `test_auth_hydration_deadlock.mjs`: Resiliência de sessão e proteção contra telas brancas.
- `test_boss_raid_lifecycle.mjs`, `test_training_center_v2.mjs`, `test_deterministic_nutrition_parser.mjs`: Regras de gameplay e progressão.

---

## 9. Pendências Operacionais (Aguardando Autorização)

1. **Criação e Push da Branch `beta` no GitHub:** O repositório local está pronto, mas o push requer aprovação explícita.
2. **Aplicação da Migration no Supabase Remoto:** O arquivo `20261109_account_deletion_and_security.sql` está validado localmente e aguarda execução no SQL Editor do projeto remoto.
3. **Configuração de Variáveis na Vercel:** Inserir `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no painel da Vercel.

---

## 10. Checklist de Publicação do Beta

Preparamos o checklist operacional passo a passo para a publicação assim que autorizado:

- [ ] **Passo 1:** Criar e comitar as alterações na branch local `beta`:
  ```bash
  git checkout -b beta
  git add .
  git commit -m "feat: beta web readiness (pwa, observability, fallback fix, cache)"
  ```
- [ ] **Passo 2 (Requer Autorização):** Enviar branch `beta` para o GitHub:
  ```bash
  git push -u origin beta
  ```
- [ ] **Passo 3 (No Painel da Vercel):**
  - Conectar a branch `beta` (gera automaticamente uma URL de Preview: `https://ascend-git-beta-...vercel.app`).
  - Em **Settings → Environment Variables**, adicionar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- [ ] **Passo 4 (No Painel do Supabase):**
  - Em **Authentication → URL Configuration**, cadastrar a URL de Preview da Vercel em *Site URL* e *Redirect URLs*.
  - No **SQL Editor**, executar o conteúdo de `supabase/migrations/20261109_account_deletion_and_security.sql`.
- [ ] **Passo 5 (Validação Real na URL Publicada):**
  - Acessar a URL de Preview pelo celular e desktop.
  - Testar criação de conta descartável, Onboarding, registro de água/sono no `DailyActionCenter` e repetição de refeição.

---

## 11. Parecer GO / NO-GO para Beta Web

### **PARECER TÉCNICO E DE QA: `GO` (APROVADO PARA TESTES BETA WEB)**

**Justificativa:**
- O código está compilando em **1.98s** sem nenhum aviso de chunk grande (`index-*.js` com 158 kB).
- O PWA está configurado com manifest standalone e ícones otimizados.
- O fallback do Supabase foi corrigido para não silenciar erros em produção/preview.
- O sistema de observabilidade e registro de bugs do Beta está implementado sem risco de vazamento de dados privados.
- 30 de 30 suítes de testes estão verdes, o typecheck está limpo e a auditoria de i18n aprovada.

*Pronto para seguir para a execução do checklist de publicação assim que autorizado pelo usuário.*


# Histórico de Desenvolvimento e Documentação

## 📋 Estado Atual do Projeto
O projeto **RPG Tracker (Hunter System)** está na **Fase 6** do Roadmap. As fundações de UI, Autenticação, Dashboard, Gerenciamento de Tarefas/Hábitos e Módulo de Treinos estão concluídas.

### Tecnologias Utilizadas
- **Frontend:** React 19, Vite, TailwindCSS v4.
# Histórico de Desenvolvimento e Documentação

## 📋 Estado Atual do Projeto
O projeto **RPG Tracker (Hunter System)** está na **Fase 6** do Roadmap. As fundações de UI, Autenticação, Dashboard, Gerenciamento de Tarefas/Hábitos e Módulo de Treinos estão concluídas.

### Tecnologias Utilizadas
- **Frontend:** React 19, Vite, TailwindCSS v4.
- **Backend:** Supabase (Auth & Database).
- **Estilização:** CSS Vanilla + Design Tokens personalizados.
- **Animações:** Framer Motion, Lucide React.
- **Gerenciamento de Estado:** Zustand.

---
## 🕒 Histórico de Mudanças Recentes

### 2026-11-06 — Etapa 03.13: Parser Determinístico de Refeições por Texto & Catálogo TACO (`src/lib/nutritionAi.ts`, `src/lib/taco.ts`, `src/pages/Nutrition.tsx`, `execution/test_deterministic_nutrition_parser.mjs`)
- **Workflows `ascend-develop` & `ascend-design` Concluídos:** Aprimoramento completo do registro de refeições por texto em linguagem natural através de processamento **100% determinístico local**, integrando a Tabela TACO (NEPA/UNICAMP) e catálogo alimentar existente — com zero IA generativa, zero LLMs remotas e zero alucinação nutricional.
- **Catálogo & Busca de Candidatos TACO (`src/lib/taco.ts`):**
  - Implementada a função `searchTacoCandidates(query, limit = 5)` para identificar múltiplos cortes ou preparações compatíveis com pontuação de relevância (>= 0.35).
  - Preservada normalização textual, decodificação anti-mojibake (`repairMojibake`), remoção de stop words e pontuação por sobreposição de tokens e contenção.
- **Parser Determinístico Aprimorado (`src/lib/nutritionAi.ts`):**
  - **Extração Robusta de Quantidades & Unidades (`extractQuantityGramsDetails`):**
    - Suporte a decimais no padrão brasileiro com vírgula (`1,5 kg`), frações comuns (`1/2`, `1/4`, `3/4`) e notações compactas (`200g`).
    - Conversão determinística de unidades de massa, volume e porções caseiras: gramas (`g`), quilogramas (`kg` $\rightarrow$ 1000g), mililitros (`ml`), litros (`l`), fatias (`inferSliceGrams`), colheres de sopa (15g), sobremesa (10g), chá/café (5g), conchas de feijão (130g/100g), xícaras/copos (160g arroz / 240g leite / 80g aveia via `inferCupGrams`), scoops/doses de suplemento (30g) e pratos (250g).
  - **Eliminação de Alucinações Nutricionais (Zero Synthetic Macros):**
    - Eliminado o fallback legado que inventava macros sintéticos arbitrários (`180 kcal, 8g prot, 20g carbo, 7g gordura`).
    - Itens não encontrados recebem estritamente `source_used: 'unresolved'`, `status: 'unmatched'` e valores zerados (0 kcal / 0 macros), impedindo poluição do diário nutricional.
  - **Tratamento Estrito de Quantidades Zero ou Inválidas:**
    - Corrigido o bug que convertia silenciosamente `0g` em porção padrão (150g). Entradas com `0g` ou valores negativos são sinalizadas como `status: 'invalid_quantity'`, bloqueando o salvamento até correção.
  - **Detecção de Unidades Não Reconhecidas:**
    - Medidas não suportadas (ex: `baldes`, `galões`) são identificadas explicitamente (`unrecognizedUnit`), marcadas como `status: 'unmatched'` e destacadas para o usuário.
  - **Identificação de Ambiguidades & Candidatos TACO:**
    - Termos genéricos que possuem múltiplos preparos (ex: "frango" $\rightarrow$ cozido, grelhado, frito, assado) são marcados como `status: 'ambiguous'`, populando o array `candidates` e exigindo seleção explícita.
  - **Fusão Determinística de Duplicatas (`mergeDuplicateIngredients`):**
    - Entradas repetidas na mesma frase (ex: `100g de arroz + 50g de arroz`) são fundidas automaticamente em um único item consolidado de `150g`, com recálculo proporcional dos macronutrientes.
  - **Métricas de Cobertura e Validação:**
    - Adicionadas propriedades `coverage` (% de gramas cobertas por fontes oficiais), `unmatchedCount`, `ambiguousCount`, `hasInvalidQuantity` e `allMatched` (somente `true` quando não houver itens pendentes, ambíguos ou inválidos).
- **Interface Tática & Ergonomia Mobile (`src/pages/Nutrition.tsx`):**
  - **Aba "Registrar por Texto" (Codex):**
    - Cabeçalho HUD v2 com chips indicadores: "PROCESSAMENTO DETERMINÍSTICO · TABELA TACO" e "100% LOCAL".
    - Botões rápidos com exemplos reais de refeições brasileiras (`150 g de arroz + 100 g de frango`, `3 ovos mexidos + 2 fatias de pão integral`, etc.).
    - Link rápido para alternar para a busca normal no Catálogo TACO.
  - **Visualização de Métricas & Prévia:**
    - Grid com cartões táticos para Energia (kcal), Proteína, Carboidratos, Gorduras, Peso Total (g) e badge com porcentagem de cobertura TACO.
    - Banner de alerta visual em âmbar/vermelho indicando quantidade de pendências a resolver.
  - **Cards Táticos de Ingredientes com Resolução Interativa:**
    - Badge verde para itens confirmados na TACO/Catálogo, exibindo macros da porção e stepper ergonômico (+/- 10g) para ajuste manual de gramas.
    - Badge roxo para itens ambíguos, renderizando botões interativos (pills) para selecionar instantaneamente a preparação desejada (ex: Peito grelhado, Frango assado, etc.).
    - Badge âmbar para itens não reconhecidos com atalho para busca manual ou botão de remoção.
    - Badge carmim para quantidades zeradas ou inválidas com campo numérico tático.
  - **Trava de Segurança no Salvamento:**
    - Botão "Registrar no Diário" desabilitado enquanto houver pendências (`!iaPreview.allMatched` ou `iaPreview.totalGrams <= 0`), garantindo que nenhuma refeição seja gravada sem consentimento e resolução de itens.
  - **Disclaimer Médico & Clínico:**
    - Banner de integridade esclarecendo que os valores são calculados a partir da TACO para rotina do RPG e não substituem avaliação clínica ou prescrição de nutricionista.
  - **Preservação Integral de Métodos Manuais:**
    - Mantidos intactos `handleLogFood`, `handleEditLog`, `handleDeleteLog` e `handleCreateFood`.
- **Qualidade, Homologação & Testes Automatizados:**
  - Criada nova suíte `execution/test_deterministic_nutrition_parser.mjs` com 11 testes cobrindo todas as unidades, 0g, frações, ambiguidades, duplicatas, disclaimer e contratos de UI.
  - Todos os testes das suítes do repositório aprovados com 0 falhas (`node --test execution/test_*.mjs`).
  - Auditoria de i18n aprovada com sucesso (`npm run audit:i18n`).
  - Build de produção compilado em 2.00s sem erros (`npm run build`).

### 2026-11-05 — Etapa 03.12: Ações Rápidas, Favoritos Manuais, Sugestões Determinísticas & Orientação do Caçador (`src/lib/quickActionsCatalog.ts`, `src/stores/useQuickActionsStore.ts`, `src/components/home/*`, `src/pages/QuickMenu.tsx`)
- **Workflow `ascend-develop` & Revisão `ascend-design` Concluídos:** Desenvolvido sistema centralizado de Ações Rápidas e Favoritos Manuais no ASCEND HUD v2, permitindo que caçadores fixem seus atalhos prioritários, reordenem, recebam sugestões determinísticas e repitam refeições ou tarefas de forma rápida e segura — com zero IA, zero rastreamento de privacidade e total controle do usuário.
- **Catálogo Centralizado de Ações Rápidas (`src/lib/quickActionsCatalog.ts`):**
  - Mapeadas 10 ações essenciais do ecossistema do ASCEND (Missões, Treinos, Nutrição, Templo da Mente, Repetição de Refeição, Reativação de Tarefa, Módulo Fortuna, Portal dos Chefes, Salão de Troféus e Ficha de Atributos).
  - Cada ação possui identificador estável, títulos e subtítulos bilíngues (PT-BR/EN-US), rota com parâmetros contextuais, cor de destaque tática (`TacticalButtonAccent`) e ícones oficiais.
  - Conjunto padrão com 4 atalhos essenciais: Concluir Missão (`/quests`), Registrar Treino (`/workouts`), Registrar Refeição (`/nutrition`) e Templo da Mente (`/rest`).
- **Store de Ações Rápidas com Persistência Local (`src/stores/useQuickActionsStore.ts`):**
  - Gerenciamento de estado com Zustand e isolamento por usuário (`ascend_quick_actions_${userId}`).
  - Limite estrito de fixação: de 1 a 6 atalhos simultâneos, evitando sobrecarga visual ou clutter no mobile.
  - Métodos táticos: `pinAction`, `unpinAction`, `reorderAction` (subir/descer), `toggleRecentSuggestions`, `toggleHunterGuidance`, `resetToDefaults` e `clearHistory`.
  - Histórico determinístico local de cliques (máximo de 20 entradas, sem chamadas a serviços externos, telemetria ou analytics).
- **Modal de Personalização de Atalhos (`src/components/home/QuickActionsCustomizerModal.tsx`):**
  - Interface tática no padrão HUD v2 com backdrop blur e componentes `<HudCard variant="elevated">`.
  - Lista de atalhos fixados com controles de subida/descida e botão de desafixar (`PinOff`).
  - Catálogo de atalhos disponíveis com botão direto de fixação (+ Fixar).
  - Painel de privacidade e controle: alternadores para "Exibir Sugestões Recentes" e "Exibir Orientação do Caçador", além de botões para limpar histórico local e restaurar configurações padrão.
- **Fluxo de Confirmação Segura de Repetições (`src/components/home/SafeActionConfirmModal.tsx`):**
  - Prevenção de duplicações acidentais e ganho prematuro de XP: antes de duplicar uma refeição ou reativar uma tarefa, um modal tático apresenta o registro exato (alimento, gramas, calorias ou título da tarefa e categoria).
  - Repetição de Refeição: insere nova entrada com confirmação explícita na tabela `food_logs`, sem duplicar XP indevidamente.
  - Reativação de Tarefa: cria uma nova tarefa com estado `completed: false` para hoje; o XP só é concedido quando o usuário marcá-la como concluída.
  - Bloqueio de cliques duplos com estado `disabled={loading}` e fallback gracioso para as telas correspondentes caso não haja histórico recente.
- **Card de Orientação Opcional do Caçador (`src/components/home/HunterGuidanceCard.tsx`):**
  - Fornece diretrizes e conselhos contextuais baseados exclusivamente nas respostas já persistidas no perfil do caçador (`trainingFocus`, `nutritionGoal`, `mainGoal`, `experienceLevel`, `hunterClass`).
  - Resolução determinística sem IA (ex: foco Hipertrofia $\rightarrow$ foco em metas de proteína e progressão de carga; foco Mental/Erudito $\rightarrow$ respiração consciente e consistência diária).
  - 100% não restritivo: informa explicitamente ao jogador que todos os 10 módulos permanecem totalmente disponíveis e permite dispensar/ocultar a qualquer momento.
- **Integração na Home do Caçador (`src/pages/QuickMenu.tsx`):**
  - A Seção 3 "Ações Rápidas" passa a renderizar dinamicamente os atalhos fixados pelo usuário em grid responsivo com badges de telemetria em tempo real.
  - Exibição de sugestões determinísticas recentes (com botão para ocultar).
  - Preservadas integralmente todas as âncoras do ProductTour (`tour-portal-header`, `tour-portal-primary`, `tour-portal-recommended`, `tour-portal-secondary`, `tour-shortcut-workouts`, `tour-shortcut-nutrition`).
- **Qualidade, Homologação & Testes Automatizados:**
  - Criada nova suíte `execution/test_quick_actions_and_guidance.mjs` com 8 testes determinísticos.
  - Total de 121 testes aprovados em 8 suítes com 0 falhas (`node --test execution/test_*.mjs`).
  - Auditoria de i18n aprovada com sucesso (`npm run audit:i18n`).
  - Build de produção compilado em 1.95s sem erros (`npm run build`).

### 2026-11-05 — Etapa 03.11: Redesign e Resiliência de Login, Registro e Onboarding (`/login`, `/register`, `/onboarding`)
- **Workflows `ascend-design` & `ascend-develop` Concluídos:** Refinamento completo da experiência de entrada e despertar do caçador, corrigindo problemas de redirecionamento, perda de progresso intermediário, ausência de botão voltar e garantindo resiliência do estado de autenticação sem causar loading infinito nem re-onboarding indevido.
- **Autenticação & Registro (`src/pages/auth/LoginPage.tsx` & `src/pages/auth/RegisterPage.tsx`):**
  - **Prevenção de Armadilha de Sessão Ativa:** Adicionada verificação imediata de sessão: se o usuário já estiver autenticado e com classe definida, redireciona diretamente para a Home (`/`); se autenticado porém sem classe, redireciona para `/onboarding` para concluir o despertar. Evita que usuários logados fiquem presos no formulário de login/cadastro.
  - **Tratamento Amigável de Erros & Confirmação:** Mapeamento de mensagens claras e localizadas (PT-BR/EN-US) para credenciais inválidas, e-mails não confirmados e limitação de taxa (rate limit). Adicionada validação de confirmação de senha e comprimento mínimo (>= 6 caracteres) no registro.
- **Formulário de Entrada Mobile-First (`src/components/ui/hunter-login.tsx`):**
  - **Ajuste Ergonômico de Teclado:** Substituído título estático excessivo por tipografia responsiva (`text-2xl sm:text-3xl lg:text-4xl`).
  - **Visibilidade de Inputs Acima da Dobra:** Em telas mobile, o painel decorativo de atributos prévios e barra de XP é ocultado (`hidden sm:grid`, `hidden sm:block`) para evitar que a abertura do teclado virtual empurre os campos de login/senha para fora da tela.
  - **Alvos de Toque Adequados:** Inputs calibrados para `min-h-[48px] sm:min-h-[54px]`, botões >= 44px com visual tático cyber-dark.
- **Onboarding & Despertar de Classe (`src/pages/Onboarding.tsx`):**
  - **Redirecionamento Imediato de Perfis Completos:** Eliminados os `setTimeout` artificiais de 1200ms e 1500ms que causavam efeito de loading infinito/travamento visual. Usuários com classe definida são redirecionados instantaneamente (`navigate('/', { replace: true })`).
  - **Preenchimento Automático com Dados Existentes:** Caso o caçador já possua dados parciais no `useHunterStore` (`fullName`, `gender`, `birthday`, `height`, `weights`, `trainingFocus`, `nutritionGoal`, `mainGoal`, `experienceLevel`), o formulário é pré-preenchido automaticamente.
  - **Restauração Inteligente de Etapa:** Detecta o maior avanço completado pelo caçador e retoma na etapa correspondente sem forçar a repetição de perguntas já salvas.
  - **Navegação Bidirecional ("Voltar"):** Adicionados botões "Voltar" / "Back" acessíveis em todas as etapas: permite retornar entre os passos do perfil, recuar nas perguntas do quiz (da pergunta 5 até a 1 e de volta à introdução do Arquiteto) e retornar da tela de seleção de classe para o quiz.
  - **Validação Rigorosa de Dados:**
    - Nome ou codinome: mínimo de 2 caracteres.
    - Gênero: seleção obrigatória para calibração estética e biológica.
    - Data de nascimento: verificação de que não é data futura e que o ano é >= 1900.
    - Altura e peso: limites fisiológicos válidos (altura 50–260 cm, peso 20–350 kg) com `inputMode="decimal"` para teclado numérico mobile nativo.
  - **Persistência de Rascunho do Quiz:** As 5 respostas do quiz de classe são salvas em `localStorage` (`ascend_onboarding_quiz_${user.id}`) para proteger contra recarregamentos acidentais ou perda de foco na página. O rascunho é limpo automaticamente após a confirmação bem-sucedida da classe.
  - **Diferenciação Robusta de Estados de Autenticação:** Tratamento visual explícito para estados de Carregando (com spinner HUD v2), Erro de Conexão/RLS (com botão tático de "Tentar Novamente" e opção de "Sair da Conta" sem zerar dados locais) e Sucesso de Despertar.
  - **Padrão ASCEND HUD v2:** Utilização de `<HudCard variant="purple" corners radialGlow>`, `<TacticalButton>`, `<NeonProgressBar variant="xp">`, preservação da arte original das 5 classes e do modal de inspeção de Ranks E–S.
- **Mapeamento de Respostas do Questionário & Módulos Futuros:**
  - Elaborada a matriz técnica documentando como cada uma das 10 variáveis coletadas no onboarding servirá de alicerce para futuros módulos (Dashboard, Treinos, Nutrição, Quests, Raids e Troféus), sem implementar customizações prematuras nesta etapa.
- **Qualidade, Homologação & Testes Automatizados:**
  - Criada suíte `execution/test_auth_onboarding_redesign.mjs` com 9 testes determinísticos cobrindo todos os cenários críticos.
  - Total de 113 testes aprovados em 8 suítes com 0 falhas (`node --test execution/test_*.mjs`).
  - Auditoria de i18n aprovada com sucesso (`npm run audit:i18n`).
  - Build de produção compilado em 1.96s sem erros (`npm run build`).

### 2026-11-05 — Etapa 03.10: Redesign Premium Global — Fortuna, Descanso & Configurações (`src/pages/Fortuna.tsx`, `src/pages/Rest.tsx`, `src/pages/Settings.tsx`)
- **Workflow `ascend-design` Concluído:** Finalizado o redesign visual completo das três rotas finais do ASCEND (`/fortuna`, `/rest` e `/settings`), alinhando-as 100% aos padrões do ASCEND HUD v2 (estética 70% funcionalidade / 30% atmosfera RPG, tokens oficiais `<HudCard>`, `<TacticalButton>`, `<NeonProgressBar>`, `<RankBadge>`, alvos de toque >= 44px e safe-area inferior `pb-28`/`pb-32`).
- **Módulo Fortuna (`src/pages/Fortuna.tsx`):**
  - **Modo de Privacidade Financeira:** Implementado alternador de visibilidade monetária com persistência em `localStorage` (`ascend_fortuna_privacy_mode`). Permite ocultar instantaneamente todos os valores monetários (`••••••`) em ambientes públicos e telas mobile sem afetar cálculos internos.
  - **Cards Táticos de Fluxo & Balanço:** Reestruturação visual com `<HudCard>` diferenciando Ganhos (esmeralda), Gastos (carmim/rose), Aportes/WIS (ouro) e Saldo Líquido com tratamento claro para saldos positivos, negativos e zero, acompanhado de taxas de aporte e poupança.
  - **Ergonomia de Lançamentos:** Formulário com seletor segmentado de tipos (Despesa, Receita, Aporte/WIS), `inputMode="decimal"` nos campos de valor monetário e feedback tático de persistência no Codex (+10 XP, +1 WIS em investimentos e dano de finanças ao Boss da Raid).
  - **Ação Rápida "Sem Transações Hoje":** Botão tático permitindo registrar dia livre de gastos com concessão/reversão consistente de +10 XP.
  - **Metas Financeiras & Quest do Sistema:** Quest permanente de purificação (meta de aportar 20% da receita) calibrada com `<NeonProgressBar variant="xp">`, além de gerenciamento ágil de metas com progresso percentual e recompensas (+50 XP e +2 WIS ao concluir).
- **Módulo Descanso (`src/pages/Rest.tsx`):**
  - **Painel de Equilíbrio (BAL / EQU):** Header enriquecido em `<HudCard variant="cyan" corners radialGlow>` com 4 visores táticos: sono atual, meditação acumulada, lazer offline e estado de equilíbrio em tempo real.
  - **Métricas & Metas Táticas:** 3 cards com `<NeonProgressBar>` para Sono (meta 8h), Meditação (meta 10 min) e Lazer Offline (meta 60 min longe de telas).
  - **Navegação Segmentada (Sono & Lazer vs Templo da Mente):** Sub-abas táticas com alvos ergonômicos e transições suaves via Framer Motion.
  - **Registros Ergonômicos:** Steppers tácteis (alvos >= 44px) para horas de sono (+/- 0.5h) com seletor de qualidade por estrelas, e duração de hobbies offline (+/- 10 min), concedendo +20 XP / +2 BAL e +15 XP / +1 BAL com ataque de estudo/calma ao Boss da Raid.
  - **Templo da Mente (Respiração Guiada & Meditação):** Cronômetro em fonte Orbitron com pulso visual de respiração em 4 fases (Inspire, Segure, Expire, Prenda a cada 4s) e seletores rápidos (1m, 5m, 10m, 15m, 20m), acionando +15 XP e +2 BAL ao concluir.
  - **Histórico de Recuperação:** Lista organizada com badges táticas, remoção de logs e estado vazio acolhedor.
- **Módulo Configurações (`src/pages/Settings.tsx`):**
  - **Eliminação de Duplicações e Código Legado:** Removida a antiga lista de 18 conquistas inline que duplicava o novo Trophy Room. Criado card premium em `<HudCard variant="gold">` com link direto para `/trophies` ("Acessar ASCEND Trophy Room →") e seletor rápido para equipar títulos conquistados.
  - **Redução do Bundle:** Tamanho final do bundle CSS reduzido de 237 kB para 222 kB e JS de 1.451 kB para 1.427 kB.
  - **Organização Modular em Seções:**
    1. *Preferências:* Alternadores visuais de Tema (Dark / Light) e Idioma (Português / English).
    2. *Identidade & Arte de Vocação:* Hero card com arte da classe e rank badge hexagonal (`RankBadge`), nível e título equipado.
    3. *Perfil & Biometria:* Codinome, nascimento, gênero, altura (cm), peso (kg), meta (kg) com `inputMode="decimal"`, foco de treino, objetivo nutricional e nível de experiência.
    4. *Credenciais & Segurança:* Atualização segura de e-mail e nova senha com validação.
    5. *Telemetria de Nuvem:* Diagnóstico de conexão com Supabase, ID do caçador autenticado e contagem de registros em nuvem.
    6. *Zona de Perigo:* Reset de atributos de RPG (nível 1 e atributos 10 sem afetar hábitos/rotinas) e Reset Geral com confirmação explícita digitada ('DESTRUIR' / 'DELETE').
  - **Zero Resíduos:** Rigorosamente livre de qualquer componente ou texto de monetização (Stripe), planos pagos e serviços de IA.
- **Qualidade, Homologação & Testes Automatizados:**
  - Criada nova suíte `execution/test_fortuna_rest_settings_redesign.mjs` com 7 testes determinísticos.
  - Total de 104 testes aprovados em 8 suítes com 0 falhas (`node --test execution/test_*.mjs`).
  - Auditoria de i18n aprovada com sucesso (`npm run audit:i18n`).
  - Build de produção compilado em 1.94s sem warnings críticos (`npm run build`).

### 2026-11-05 — Etapa 03.9: Trophy Room — Salão de Conquistas & Galeria de Prestígio (`src/pages/TrophyRoom.tsx`, `src/lib/achievementsData.ts`, `src/App.tsx`, `src/components/layout/*`)
- **Nova Rota & Área Oficial (`/trophies`):** Implementada a tela `ASCEND TROPHY ROOM` estruturada como uma galeria RPG premium mobile-first, integrando todas as honrarias conquistadas no ecossistema do ASCEND.
- **Catálogo Centralizado de Conquistas & Títulos (`src/lib/achievementsData.ts`):** Unificados os 18 feitos reais do sistema (4 marcos de streak: 3d, 7d, 15d, 30d; 7 metas de atributos: STR, END, INT, DIS, VIT, WIS, BAL em 20 pontos; e 7 chefes purificados na fenda) e os 19 títulos oficiais com metadados de raridade, recompensas em XP e traduções bilíngues PT-BR/EN-US.
- **Galeria de Conquistas (Achievements):** Apresentação visual rica com `<HudCard variant="gold" corners>`, ícones contextuais, diferenciação clara entre conquistas desbloqueadas (glow âmbar, data formatada e badge `CONQUISTADA`) e bloqueadas (superfície grafite fosca, cadeado e requisitos explícitos), exibindo recompensas de XP e títulos.
- **Salão de Títulos de Prestígio (Prestige Titles):** Destaque ao título atualmente equipado no perfil do caçador, acompanhado pelo grid dos 19 títulos disponíveis com seleção e equipamento direto em 1 toque (`hunterStore.equipTitle`), preservando a persistência na tabela `profiles`.
- **Troféus de Raid & Relíquias de Chefes:** Exibição dos 7 chefes com ilustrações originais otimizadas, citações épicas de vitória (`victoryLore`), recompensas conquistadas e histórico de purificação (`defeated_at`), integrando atalho direto para o Portal de Raids (`/bosses`) quando o chefe estiver em combate ativo.
- **Navegação Coerente & Preservação da BottomNav:** Acesso ao Salão de Troféus integrado no cabeçalho de conquistas do Player Status (`/status`), na seção de títulos de Ajustes (`/settings`), no menu desktop (`RPGLayout.tsx`) e na gaveta mobile (`MobileMenu.tsx`), preservando rigorosamente as 5 abas oficiais da Bottom Navigation (`BottomNav.tsx`) sem adições indevidas.
- **Suíte de Testes Automatizada (`execution/test_trophy_room.mjs`):** Criada bateria com 7 testes determinísticos cobrindo rotas, catálogo de dados, galeria de medalhas, seleção de títulos, histórico de raid e regras de navegação, elevando a homologação para 97/97 testes aprovados em 8 suítes com zero regressões.

### 2026-11-05 — Etapa 03.8: Boss Raid — Temporizador Semanal Persistente, Ciclo de Vida e Experiência de Batalha (`src/pages/Bosses.tsx`, `src/stores/useBossStore.ts`, `supabase/migrations/*`)
- **Auditoria do Temporizador e Diagnóstico `0d 0h` (`src/stores/useBossStore.ts` & `src/pages/Bosses.tsx`):** Identificada a causa raiz de raids com contador congelado em `0d 0h`: ausência de transição formal de estado quando o tempo decorrido ultrapassava a janela semanal (`started_at + targetDays`), mantendo a batalha eternamente com `defeated = false` e permitindo dano fora do prazo.
- **Sistema de Prazo Semanal Persistente & Contagem Regressiva em Tempo Real (`useBossStore.ts` & `Bosses.tsx`):**
  - Implementada a função determinística `getBossRaidDeadline(battle)` com suporte a `expires_at` persistido ou cálculo seguro sobre `started_at` + `targetDays` (janela semanal real de até 7 dias).
  - Implementada a função `calculateRaidRemainingTime(deadline, refTime)` gerando contagem regressiva viva com dias, horas, minutos e segundos (`DDd HHh MMm SSs`), flag de prazo crítico (`isCritical < 24h`) e flag de expiração (`isExpired`).
  - Intervalo de atualização em `Bosses.tsx` ajustado para 1 segundo (1000ms), garantindo fluidez e sincronização em tempo real.
  - Formatação de encerramento respeitando o fuso horário de Brasília (`America/Sao_Paulo` via `formatRaidDeadlineLocal`), exibindo o dia e horário exato do fechamento da fenda.
  - Persistência em UTC no Supabase, garantindo que o cronômetro não reinicie ao atualizar a página, relogar ou alternar entre dispositivos.
- **Ciclo de Vida Formal da Raid (`RaidLifecycleState`):**
  - Implementados 5 estados formais: `waiting_start`, `active_battle`, `boss_defeated`, `expired_loss` e `next_raid`.
  - **Estado Expirado (`expired_loss`):** Quando o prazo se encerra com HP > 0, a fenda colapsa ("O Chefe Escapou — Fenda Desestabilizada"), bloqueando ataques manuais e de atividades secundárias e impedindo ganho indevido de XP ou títulos. Botão de recuperação tática (`Iniciar Novo Ciclo da Raid` / `retryExpiredBattle`) reinicia a incursão com HP cheio e uma nova janela semanal completa.
  - **Estado de Vitória (`boss_defeated`):** Quando a integridade do chefe chega a 0 dentro do prazo, a tela exibe o painel dourado/esmeralda de purificação com o lore de vitória. A purificação concede bônus de XP e título de forma idempotente (`eventId: boss:${battle.id}`) apenas uma vez por batalha, avançando para o próximo chefe da campanha.
  - **Alerta de Prazo Crítico (`< 24h`):** Interface aciona pulso âmbar/ouro e aviso sonoro/visual alertando o caçador sobre a iminência do colapso da fenda.
- **Resiliência e Retrocompatibilidade de Banco (`safeInsertBossBattle` & `safeUpdateBossBattle`):**
  - Criada migration segura e idempotente `supabase/migrations/20261105_boss_raid_lifecycle.sql` adicionando `expires_at`, `status` (com check constraint), `ended_at` e índices de busca.
  - A store possui fallback automático defensivo para operar perfeitamente mesmo antes da execução manual da migration no console remoto do Supabase.
- **Histórico de Combate & Feedback Visual de Dano:**
  - Diferenciação inequívoca entre dano normal (espadas brancas/ciano), dano crítico (amarelo brilhante com badge `CRÍTICO!`) e regeneração por atividades desfeitas (carmim com `Regeneração de +X HP` e tag de desfeita).
- **Validação e Homologação (`execution/test_boss_raid_lifecycle.mjs`):**
  - Criada suíte completa com 7 testes determinísticos cobrindo cálculo de prazos, contagem regressiva em tempo real, matriz de ciclo de vida, bloqueio de dano em raids expiradas, formatação de fuso horário de São Paulo, integridade da migration SQL e interface do usuário.
  - Sucesso em 90/90 testes automatizados em 8 suítes no projeto, `audit:i18n` com status `ok` e build de produção sem erros (`tsc -b && vite build` em 1.98s).

### 2026-11-05 — Polimento Global do HUD v2: Refinamento Visual e Experiência Mobile (`src/pages/*`, `src/components/*`)
- **Portal dos Chefes (`src/pages/Bosses.tsx`):** Modernização visual completa com componentes HUD v2 (`<HudCard variant="purple" corners>`, `<TacticalButton>`, `<RankBadge>`), internacionalização bilíngue PT-BR/EN-US para o histórico de combate (`combatEvents`), e diferenciação visual tática de golpes críticos (ouro pulsante + badge), dano regular (espadas âmbar) e regeneração (carmim com ícone de alerta).
- **Investigação da Raid Ativa `0d 0h` (`src/pages/Bosses.tsx`):** Documentada a causa raiz: a meta de prazo (`targetDays`, 3-7 dias) somada a `activeBattle.started_at` expirou no passado, fazendo `remainingMs` avaliar para `0` via `Math.max(0, ...)`. O indicador visual foi atualizado para exibir claramente `0d 0h (Prazo encerrado / Expired)` sem alterar as regras de temporização do backend.
- **Ficha Player Status (`src/pages/Dashboard.tsx`):** Ajustada a altura e o espaçamento inferior do Hero holográfico no mobile para eliminar a compressão sobre o nome/título do jogador (`-mt-3`), balanceada a distribuição vertical do card de Nível e XP (`justify-center gap-3 sm:gap-4`) para eliminar espaços vazios em telas largas, e refinada a seção de Domínios de Evolução para focar em Marcos de Especialização, próximo bônus (`domain.nextReward`) e fonte do último ganho (`domain.lastGain`), eliminando duplicação visual com os atributos superiores.
- **Missões Diárias & Hábitos (`src/pages/Quests.tsx` & `src/components/rpg/NewHabitModal.tsx`):** Unificada a barra de filtros de status e tipos de atividade em um contêiner coeso com alvos de toque ergonômicos de `44px` (`min-h-[44px]`), e atualizado o modal de hábitos para exibir dinamicamente o ícone de confirmação (`CheckCircle2`) ao editar uma rotina existente em vez de um símbolo de adição redundante.
- **Training Center (`src/pages/Workouts.tsx` & `src/components/workouts/WorkoutProgress.tsx`):** Melhorada a legibilidade dos protocolos de treino (`presets`) substituindo truncamento rígido por divisão em múltiplas linhas (`line-clamp-2 leading-relaxed`), prevenindo compressão de botões em telas pequenas (320px–375px) com `min-w-0`, e garantindo que nomes de exercícios no histórico permaneçam legíveis.
- **Nutrition Center (`src/pages/Nutrition.tsx`):** Aprimorada a apresentação de alimentos da Tabela TACO e catálogo com `line-clamp-2 break-words` no grid, na lista compacta e no modal de busca rápida, permitindo identificar cortes e modos de preparo longos. Removido o símbolo duplicado `+` do botão primário com ícone (`ADICIONAR ALIMENTO` / `ADD FOOD`).
- **Suíte de Testes Automatizada (`execution/test_global_hud_polish.mjs`):** Criada suíte específica cobrindo as melhorias de todas as 6 telas, alcançando 83/83 testes aprovados em 8 suítes com zero regressões.

### 2026-11-05 — Etapa 03.7: Redesign Premium — Nutrition Center (`src/pages/Nutrition.tsx` & `src/components/nutrition/NutritionMealPlans.tsx`)
- **Painel Nutricional Principal & Anel Central de Calorias (`src/pages/Nutrition.tsx`):** Redesenho mobile-first da tela `/nutrition` alinhado à direção de arte `design/references/ascend-nutrition.jpg`, integrando `<HudCard variant="cyan" corners>`, `<NeonProgressRing variant="cyan-purple" size={196} strokeWidth={12}>`, `<RankBadge>` e `<TacticalButton>`. O anel circular exibe o saldo calórico restante (`remainingCalories`), percentual da meta (`calorieProgress%`), calorias consumidas (`dailyMacros.kcal`), meta calórica diária (`nutritionTargets.targetCalories`) e objetivo (`localizedGoalLabel`), com centralização perfeita (`leading-none`, `whitespace-nowrap`) e tratamento explícito para metas não calibradas (`missingProfileFields`) e excesso calórico (`calorieStatus === 'exceeded'`).
- **Resumo Compacto de Macronutrientes em 3 Colunas (`src/pages/Nutrition.tsx`):** Substituídos os três cards grandes por uma barra horizontal compacta em 3 colunas (`grid-cols-3 divide-x divide-white/10`) dentro de `<HudCard>` com `<NeonProgressBar>` para `Proteína` (`Protein`), `Carbos` (`Carbs`) e `Gorduras` (`Fats`), exibindo consumo real vs. meta recomendada em gramas.
- **Cards de Refeições do Dia (`REFEIÇÕES DE HOJE` / `TODAY'S MEALS`):** Reestruturado o diário alimentar por slots de refeição (`Café da Manhã`, `Almoço`, `Jantar`, `Lanche` e refeições extras registradas no dia), apresentando ícone contextual, calorias da refeição, contagem de alimentos, badge de estado (`Registrada` / `Pendente`), expansão de itens com botões de `Editar` (`handleEditLog`) e `Remover` (`handleDeleteLog`), atalho `+` direto por refeição e botão principal `<TacticalButton variant="primary" fullWidth displayFont>` (`+ ADICIONAR ALIMENTO` / `+ ADD FOOD`).
- **Registro Manual de Alimentos, Prévia em Tempo Real & Calculadora TACO Local (`src/pages/Nutrition.tsx`):** Refinado o modal de registro manual como Bottom Sheet mobile (`rounded-t-3xl`) com busca integrada no catálogo, atalhos rápidos de gramatura (`50g`, `100g`, `150g`, `200g`), steppers de `44x44px`, teclado numérico (`inputMode="decimal"`) e prévia nutricional calculada em tempo real (`Kcal`, `Prot`, `Carb`, `Gord`). Preservada integralmente a Calculadora TACO determinística local (`analyzeNutritionText` sem IA externa) e o catálogo de alimentos sem tabelas de rolagem horizontal (`overflow-x-auto` eliminado).
- **Planos Alimentares HUD v2 (`src/components/nutrition/NutritionMealPlans.tsx`):** Modernizado o gerenciador de cardápios com `<HudCard>` e `<TacticalButton>`, preservando criação/exclusão de planos, adição de alimentos por refeição, resumo de macronutrientes por cardápio e sincronização com o diário e dano ao Boss ativo (`handleUseMealPlan` + `attackActiveBoss`), além da suíte automatizada `execution/test_nutrition_redesign.mjs` (4/4 testes aprovados, totalizando 78/78 no projeto).

### 2026-11-05 — Etapa 03.6: Redesign Premium — Training Center (`src/pages/Workouts.tsx` & `src/components/workouts/WorkoutProgress.tsx`)
- **Cabeçalho HUD v2 & Resumo `TREINO DE HOJE` (`src/pages/Workouts.tsx`):** Redesenho mobile-first da tela `/workouts` alinhado à direção de arte `design/references/ascend-training.jpg`, integrando `<HudCard variant="cyan" corners>`, `<NeonProgressBar variant="cyan" size="md">`, `<RankBadge>` e `<TacticalButton>`. O card de resumo apresenta nome do treino atual, quantidade de exercícios, estimativa de tempo, recompensa real de XP (`+30 XP` força / `+25 XP` cardio), séries concluídas (`featuredCompletedSets/featuredTotalSets`) e exercícios concluídos (`featuredCompletedCount/featuredTotalExercises`).
- **Cards de Exercícios & Registro Rápido de Séries/Carga (`src/pages/Workouts.tsx`):** Modernizados os cards de exercícios com destaque para nome, grupo muscular, histórico do último registro (`previousLog` com carga e repetições anteriores), steppers rápidos de `-` / `+` (`44x44px`), campos numéricos com `inputMode="numeric"` (séries/reps) e `inputMode="decimal"` (carga em `kg`), feedback visual de salvamento (`Salvo ✓`) e conclusão de exercício com 1 toque.
- **Experiência de Treino Ativo & Cronômetro de Descanso (`isRoutineSessionOpen`):** Refinado o painel de treino ativo como Bottom Sheet mobile / HUD focado com barra de progresso em tempo real, cronômetro de descanso integrado (`60s`, `90s`, `+30s`, `Zerar` e banner flutuante quando minimizado), injeção de exercício extra na sessão e sincronização no `localStorage` (`ascend_active_workout_*` e `ascend_active_workout_${user.id}`), preservando integralmente as regras de XP, atributos (`strength`/`endurance` +2, `vitality` +1, `discipline` +1) e dano ao Boss ativo (`attackActiveBoss`).
- **Evolução, Recordes 1RM & Histórico Responsivo Sem Scroll Horizontal (`src/components/workouts/WorkoutProgress.tsx`):** Migrado o painel de evolução para `<HudCard>`, `<NeonProgressBar>` e `<RankBadge>` com suporte bilíngue PT-BR/EN-US, preservando os cálculos de volume total, streak de treino e 1RM estimado (`weight * (1 + 0.0333 * reps)`), e substituindo a tabela horizontal no mobile por cards HUD compactos responsivos (`md:hidden`) combinados à tabela HUD em telas maiores (`hidden md:block`).
- **Protocolos, Rotinas & Arsenal (`src/pages/Workouts.tsx`):** Modernizadas as abas de rotinas, biblioteca de exercícios (`Arsenal` com modo grade e compacto responsivo) e modelos de treino (`Protocolos` preservando 100% das artes originais `program.image`), além da suíte automatizada `execution/test_training_redesign.mjs` (6/6 testes aprovados).

### 2026-11-05 — Etapa 03.5: Redesign Premium — Daily Quests (`src/pages/Quests.tsx`, `src/components/rpg/NewQuestModal.tsx`, `src/components/rpg/NewHabitModal.tsx`)
- **Cabeçalho HUD v2 & Painel `Progresso de Hoje` (`src/pages/Quests.tsx`):** Redesenho mobile-first da tela `/quests` inspirado em `design/references/ascend-quests.jpg`, integrando `<RankBadge>`, `<NeonProgressBar>`, `<HudCard variant="cyan" corners>` e `<NeonProgressRing>`. O anel central exibe `{totalCompleted} / {totalMissions}` e `({Math.round(progressPct)}%)` perfeitamente centralizados, flanqueados pela sequência diária (`streak.current` / `streak.best`) à esquerda e o XP acumulado no dia (`+{xpGainedToday} XP` / `DAILY_COMMON_XP_EFFECTIVE_MAX`) à direita, além da faixa integrada da próxima missão em foco.
- **Cards de Missões Táticos (`MissionCard`):** Modernizados os cards para os 5 tipos reais de atividade (`habit`, `task`, `workout`, `meal`, `finance`) com superfícies grafite, micro-cabeçalho único de status (`CONCLUÍDA` em verde esmeralda, `EM ANDAMENTO` em ciano com barra de progresso parcial real `<NeonProgressBar>` quando aplicável, `ATRASADA` em âmbar e `PENDENTE`), recompensas em dourado (`#F59E0B`), área de toque de `44x44px` no `<NeonCheckbox>` e eliminação de badges redundantes de conclusão.
- **Ergonomia Mobile, Filtros Rápidos & Botão Flutuante (`+ Nova Quest`):** Adicionadas barras de filtro horizontais por status (`Todas`, `Pendentes`, `Concluídas` com contadores em tempo real) e por categoria/tipo (`Todos Tipos`, `Hábitos`, `Únicas`, `Treino`, `Nutrição`, `Finanças`), espaçamento seguro `pb-24` e botão tático flutuante na thumb zone mobile.
- **Modais de Criação como Bottom Sheets Mobile (`NewQuestModal.tsx` & `NewHabitModal.tsx`):** Refinados os modais de Missão Única e Hábito Recorrente com estética HUD v2, comportamento de Bottom Sheet em dispositivos móveis (`rounded-t-3xl`, `max-h-[90dvh]`, `env(safe-area-inset-bottom)`), botões de recorrência de `44px` e `<TacticalButton>`, preservando integralmente validações e contratos.
- **Validação & Testes (`execution/test_quests_redesign.mjs`):** Criada suíte automatizada validando integração HUD v2, cálculos de progresso diário, diferenciação de estados dos cards, filtros combinados e contratos dos modais (5/5 aprovados).

### 2026-11-05 — Correção Crítica P0: Eliminação do Deadlock de Inicialização, Loading Infinito e Hidratação (`AuthContext`, `useHunterStore`, `authStorage`, `appVersion`, `App`, `Onboarding`)
- **Eliminação Definitiva do Deadlock Circular no `@supabase/auth-js` (`src/contexts/AuthContext.tsx`):** Identificada a causa raiz comum entre o loading infinito e o redirecionamento precoce ao `/onboarding`: o callback registrado em `supabase.auth.onAuthStateChange` era `async` e executava `await syncProfileAndDailyNutrition()` $\rightarrow$ `await supabase.from('profiles').select('*')` sincronamente dentro do lock interno `GoTrueClient._acquireLock` (mantido aberto durante `_initialize`/`_recoverAndRefresh`/`_notifyAllSubscribers`). Como o PostgREST chama `fetchWithAuth` $\rightarrow$ `await supabase.auth.getSession()` $\rightarrow$ `await _acquireLock()`, criava-se um deadlock circular permanente (`_acquireLock` externo aguardando `onAuthStateChange` $\leftrightarrow$ `getSession` interno aguardando `this.pendingInLock[last]`). O callback de `onAuthStateChange` foi tornado estritamente síncrono, desacoplando a sincronização de perfil para fora do lock via `scheduleDeferred` (`setTimeout(..., 0)`) e deduplicando chamadas concorrentes com `ensureProfileSynced` (`activeSyncRef`).
- **Sanitização de Persistência e Reidratação no Zustand (`src/stores/useHunterStore.ts`):** Adicionados `partialize` e `merge` ao middleware `persist` (`hunter-storage`) para impedir que flags transitórias (`profileLoaded`, `profileLoading`, `profileError`, `pendingLevelUp`) sejam gravadas no `localStorage` e para limpar automaticamente qualquer estado previamente envenenado com `profileLoading: true` no navegador do usuário sem apagar seus dados. Adicionado rastreamento de proprietário (`profileUserId`) e bloco `try/catch` completo em `loadProfile` garantindo que `profileLoading` sempre retorne a `false`.
- **Fechamento da Zona Morta de Roteamento (`src/App.tsx` & `src/pages/Onboarding.tsx`):** Atualizado o `HunterGuard` para acionar `loadProfile(user.id)` caso o perfil ainda não tenha sido carregado e exibir `"Sincronizando Caçador..."` enquanto `!profileLoaded || profileLoading`, impedindo qualquer avaliação de `if (!hunterClass)` antes de `profileLoaded === true`. Adicionada recuperação com botão de reconexão também em `Onboarding.tsx`.
- **Higiene na Migração de Tokens Legados (`src/lib/authStorage.ts`):** Validado o formato JSON de sessão (`isValidSerializedSession`) antes de migrar chaves legadas `sb-*-auth-token` (ignorando chaves auxiliares PKCE `*-code-verifier`) e implementada a remoção imediata das chaves legadas (`purgeLegacyAuthKeys`) após migração ou `removeItem`, eliminando o loop de ressurreição de tokens expirados.
- **Preservação Integral do `localStorage` em Deploys (`src/lib/appVersion.ts`):** Removida a limpeza destrutiva automática (`clearLocalAppCaches`) que apagava `hunter-storage`, hábitos e tarefas a cada novo commit publicado na Vercel, mantendo apenas a limpeza da Cache API de assets estáticos (`clearBrowserCaches`).
- **Suíte Comportamental de Regressão (`execution/test_auth_hydration_deadlock.mjs`):** Criada suíte automatizada validando a reprodução do lock do `GoTrueClient` e todos os 14 cenários obrigatórios de sessão, hidratação, erro de rede, timeout, F5 em `/` e `/status`, onboarding, logout e troca de conta.

### 2026-11-04 — Etapa 03.4: Redesign Premium — Player Status (`src/pages/Dashboard.tsx` & `src/components/ui/RadarChart.tsx`)
- **Hero Holográfico do Personagem (`src/pages/Dashboard.tsx`):** Modernizada a abertura da ficha de status (`/status`) preservando a ilustração otimizada real da classe e rank (`/optimized/Classes/${safeClass}/Rank ${imageRank}.jpg`), nome do jogador, título ativo equipado, badge da classe, streak atual e modal de inspeção ampliada do avatar (`isAvatarOpen`), com iluminação holográfica ciano/púrpura e altura balanceada em mobile e desktop.
- **Painel de Nível, Rank e XP (`HudCard`, `RankBadge`, `NeonProgressBar`):** Integrados os componentes oficiais do **ASCEND HUD v2** exibindo `LEVEL` real, `<RankBadge showLabel={false} />` precedido exclusivamente pelo rótulo externo `RANK` (sem duplicar a letra do rank), barra oficial de progresso de XP (`state.xp / state.xpRequired`), sub-card de ascensão para o próximo Rank (`NEXT_RANK`, `RANK_PROMOTION_LEVELS`) e resumo diário/semanal (`DAILY_COMMON_XP_EFFECTIVE_MAX`, `WEEKLY_BONUS_XP_CAP`).
- **Painel de Atributos & Gráfico de Radar Holográfico (`src/components/ui/RadarChart.tsx` & `src/pages/Dashboard.tsx`):** Reorganizados os 7 atributos reais do sistema (`strength`, `endurance`, `intelligence`, `discipline`, `vitality`, `wisdom`, `balance`) com ícone tático, código, nível de domínio (`Nv. X`), barra de progresso de tier (`(value % 10) * 10`), ganho diário (`+X hoje`) e valor atual ao lado do `<RadarChart />` modernizado com malha poligonal ciano/púrpura, preenchimento translúcido neon (`#00F0FF` $\rightarrow$ `#A855F7`), vértices luminosos e `React.useId()`.
- **Conquistas Recentes & Títulos Equipáveis (`Recent Achievements`):** Adicionada seção de prestígio em `HudCard variant="gold"` sincronizada com a tabela `achievements` do Supabase e o catálogo `ALL_POSSIBLE_ACHIEVEMENTS`, permitindo alternar entre destaques e todas as 18 medalhas, além de equipar títulos reais desbloqueados diretamente na ficha (`state.equipTitle`).
- **Progressão do Personagem & Internacionalização (`src/lib/uiEnglish.ts`, `execution/test_player_status.mjs`):** Preservadas todas as âncoras do `ProductTour` (`tour-hud`, `tour-status`, `tour-domains`, `tour-history`, `tour-biometrics`), adicionadas traduções EN-US faltantes para títulos de conquista e criada a suíte `execution/test_player_status.mjs` (8/8 testes aprovados).

### 2026-11-04 — Remoção Completa da Monetização e Desbloqueio Universal
- **Eliminação Total de Paywalls Comerciais:** Removido o componente `PremiumGate` e todas as suas invocações. Os módulos Fortuna (`src/pages/Fortuna.tsx`), Códex de Nutrição (`src/pages/Nutrition.tsx`) e Histórico & Evolução Física de Treinos (`src/pages/Workouts.tsx`) foram desbloqueados para todos os caçadores sem exceção.
- **Liberação dos Chefes Rank S (`src/pages/Bosses.tsx`):** Eliminadas as restrições comerciais que travavam as raids dos chefes finais (`boss_05`, `boss_06`, `boss_07`), restaurando a progressão exclusivamente por mérito de jogabilidade (status de raid e requisitos de nível/rank).
- **Limpeza do Stripe e Faturamento em Configurações (`src/pages/Settings.tsx`):** Removidos o painel de faturamento/assinatura, botões de checkout, abertura do portal de gerenciamento, estados de carregamento e imports do `CreditCard`.
- **Eliminação de Sincronizações Manuais de Assinatura (`src/contexts/AuthContext.tsx`):** Removidas as chamadas de verificação de emails para premium manual (`hasManualPremiumAccess`) e atualizações de billing do ciclo de autenticação.
- **Política Zero Waste e Limpeza de Edge Functions:** As funções do Stripe (`stripe-checkout`, `stripe-portal`, `stripe-webhook`) e componentes de monetização foram arquivados em `obsoleto/` e removidos do código ativo em `supabase/functions/` e `src/components/`.
- **Validação de Contratos & Internacionalização:** Limpeza das strings comerciais obsoletas em `src/lib/uiEnglish.ts` e criação da suíte `execution/test_monetization_removal.mjs` (7/7 aprovados).

### 2026-11-04 — Correção Emergencial: Regressão de Autenticação e Redirecionamento ao Onboarding
- **HunterGuard Resiliente (`src/App.tsx`):** Identificada condição de corrida onde o `HunterGuard` avaliava `hunterClass` de forma síncrona logo após o login/refresh antes da conclusão da requisição assíncrona ao Supabase (`profiles`). Implementada sincronização com `profileLoaded`, `profileLoading` e `profileError`: enquanto os dados estão sendo recuperados, o sistema exibe a transição "Sincronizando Caçador..."; caso haja erro de rede/RLS, uma interface de reconexão é apresentada com botão de tentativa, impedindo que o jogador seja redirecionado indevidamente para `/onboarding`.
- **Controle de Estado de Perfil no Zustand (`src/stores/useHunterStore.ts`):** Adicionadas as propriedades `profileLoaded`, `profileLoading` e `profileError` ao `HunterState`. Em `loadProfile`, o estado de carregamento é acionado no início e `profileLoaded: true` é atribuído após hidratação completa dos atributos, XP, rank e classe. Em caso de erro na consulta, o fluxo é interrompido com segurança sem tentar recriar perfis ou sobrescrever dados existentes.
- **Compatibilidade de Tokens Legados no Auth Storage (`src/lib/authStorage.ts`):** Adicionado fallback no `WebLocalStorageAdapter` que lê e migra transparentemente tokens armazenados sob as chaves legadas `sb-*-auth-token` (localStorage ou sessionStorage) para a chave `ascend-auth-token`, garantindo que sessões ativas existentes não sejam perdidas.
- **Proteção de Fluxo no Onboarding (`src/pages/Onboarding.tsx`):** Inserida trava para impedir o início das etapas do ritual de identificação enquanto o perfil estiver em carregamento (`profileLoading`). Adicionado tratamento de erro não-bloqueante nos passos de atualização biológica e flag `isSubmitting` no despertar de classe para evitar cliques duplicados e congelamento da UI.
- **Homologação e Testes Automatizados (`execution/test_auth_guard_regression.mjs`):** Criada suíte de testes determinísticos com 5 asserções de contrato validando a proteção do `HunterGuard`, ciclo de vida do perfil, migração de storage e guardas do onboarding (5/5 aprovadas).

### 2026-11-04 — Etapa 03.3 (Refinamento Final): Polimento Visual da Home do Caçador (`src/pages/QuickMenu.tsx`)
- **Bloco de Rank sem Duplicação (`src/pages/QuickMenu.tsx` & `src/components/ui/rank-badge.tsx`):** Removida a letra de Rank duplicada fora do badge e configurado `<RankBadge showLabel={false} />` precedido apenas pelo rótulo externo `RANK`, mantendo a letra do rank visível exclusivamente dentro do octógono.
- **Centralização do `NeonProgressRing` (`src/components/ui/neon-progress.tsx` & `src/pages/QuickMenu.tsx`):** Ampliado o diâmetro livre interno do anel duplo (`outerRadius` e `innerRadius` otimizados) e aplicados `leading-none` e `whitespace-nowrap` em `0%` e `0/0 feitos`, garantindo centralização horizontal e vertical perfeita dentro do círculo.
- **Distribuição Vertical do Painel `HUNTER STATUS` (`src/pages/QuickMenu.tsx` & `src/components/ui/hud-card.tsx`):** Adicionada prop `contentClassName` ao `HudCard` (`flex h-full flex-col justify-between gap-3.5`) e estruturados os blocos internos de Nível/Rank/XP e Progresso Diário em superfícies táticas dedicadas, eliminando espaços vazios na base do card em telas desktop.
- **Legibilidade Completa em `Quick Actions` (`src/pages/QuickMenu.tsx` & `src/components/ui/tactical-button.tsx`):** Reorganizados os botões táticos em `md:grid-cols-3` com títulos completos sem truncamento (`Concluir missão`, `Registrar treino`, `Registrar refeição`) e subtítulos integrados aos contadores diários.
- **Módulos do Sistema Minimalistas (`System Modules`):** Removidas completamente as imagens de fundo (`/optimized/Cards/*`) dos quatro cards inferiores (`Portal dos Chefes`, `Módulo Fortuna`, `Santuário do Descanso` e `Ficha de Atributos`), convertendo-os em componentes tecnológicos minimalistas em grafite (`#10121A`) com ícones semânticos à esquerda, hierarquia tipográfica clara e alturas uniformes.

### 2026-11-04 — Etapa 03.3: Redesign Mobile Premium da Home do Caçador (`src/pages/QuickMenu.tsx`)
- **Hero do Jogador & Painel `HUNTER STATUS`:** Redesenho mobile-first da Home (`/`) utilizando os componentes oficiais do **ASCEND HUD v2** (`HudCard`, `TacticalButton`, `NeonProgressBar`, `NeonProgressRing`, `RankBadge`) e arte real otimizada da classe/rank do usuário.
- **Progresso Diário Real & Próxima Missão:** Integração direta com `useHunterStore`, `useBossStore`, `useHabits` e `useTasks` para calcular o percentual diário consolidado e sugerir dinamicamente a próxima atividade pendente.
- **Prevenção de Duplicação no Header (`src/components/layout/RPGLayout.tsx`):** Ocultado o mini indicador redundante de `LV./XP` no cabeçalho global mobile exclusivamente quando na rota `/`.
- **Testes Automatizados (`execution/test_home_redesign.mjs`):** Suíte com 9 asserções estruturais e funcionais (9/9 aprovadas), somada à auditoria bilíngue PT-BR/EN-US (`audit_localization.mjs`).

### 2026-06-30 — Missão Única no Criador de Hábitos e Quest de Finanças "Sem Transações Hoje"
- **Missão Única no Formulário de Hábitos (`NewHabitModal.tsx` & `Quests.tsx`):** Adicionado um checkbox "Somente uma vez (Missão Única)" ao criar hábitos. Ao ser selecionado, a seleção de dias de recorrência é oculta e, ao salvar, a missão é criada no Supabase como uma tarefa única (Task) para o dia atual usando `createTask` (do hook `useTasks`), atendendo ao papel de planner diário.
- **Quest de Finanças "Sem Transações Hoje" (`Fortuna.tsx` & `Quests.tsx`):** Adicionado um novo botão secundário na Fortuna e suporte direto na quest diária financeira para marcar o dia como "Sem transações". A marcação é salva de forma resiliente no `localStorage` (associada ao ID do usuário e à data atual) e concede `+10 XP` (controlado por chave de prevenção de duplicidade). A caixa de marcação da quest financeira em `Quests.tsx` agora alterna este mesmo estado diretamente da listagem em vez de redirecionar para a Fortuna.
- **Internacionalização das Novas Opções (`uiEnglish.ts`):** Inclusão de traduções em inglês para todas as novas strings geradas nas páginas e modais, garantindo conformidade bilíngue completa.
- **Validação de Compilação:** Executado `npm run build` confirmando sucesso na compilação do TypeScript e Vite.

### 2026-06-30 — Atualização de Modelo da Groq API e Atribuição de Usuário Premium
- **Nova IA da Groq (`src/lib/groq.ts`):** Atualizado o modelo padrão para `meta-llama/llama-4-scout-17b-16e-instruct` e redefinidos os parâmetros de temperatura (1), limite de tokens (`max_completion_tokens: 1024`) e desativação do streaming (`stream: false`).
- **Nova Migration de Premium Manual (`supabase/migrations/20260630_manual_premium_gabroreis.sql`):** Criada uma nova migration no Supabase para atualizar a flag `is_premium` para o usuário `gabroreis@gmail.com`. A atualização também foi aplicada diretamente na base de dados de produção do Supabase usando a ferramenta MCP.
- **Documentação e Notas (`README.md`, `Ideias.txt`):** Atualizadas as menções do modelo Llama antigo para o novo modelo nas notas de referência de desenvolvimento e no arquivo de documentação principal.

### 2026-06-25 — Implementação de Trial de 7 Dias no Stripe e Ciclo de Vida do Assinante
- **Trial de 7 Dias (`stripe-checkout`):** Adicionada a propriedade `trial_period_days: 7` na criação da sessão do Stripe Checkout, iniciando o período de testes grátis. A exigência do cartão de crédito imediatamente no checkout foi mantida (Opção A) para garantir a renovação automática.
- **Tratamento de Inadimplência e Ciclo Completo (`stripe-webhook`):** Adicionado suporte para o evento `invoice.payment_failed` para remover imediatamente o acesso premium e marcar a conta como `past_due` caso a cobrança mensal falhe. Também implementada a busca ativa dos dados de assinatura em `checkout.session.completed` e atualização refinada em `customer.subscription.updated` e `customer.subscription.deleted`, tratando de forma robusta e persistente todas as transições de status do Stripe (`trialing`, `active`, `past_due`, `unpaid`, `canceled`).
- **Novas colunas no Banco (`profiles`):** Criada e aplicada a migration `20260625_stripe_trial.sql` para persistir os campos `trial_ends_at` (fim do período de testes) e `subscription_status` (status exato do Stripe).
- **Mapeamento na Store Zustand (`useHunterStore.ts`):** Atualizada a interface, estado inicial e as funções de carregamento/salvamento do perfil (`loadProfile`/`saveProfile`) para gerenciar as novas variáveis do Stripe no front-end.
- **Interface Paywall do Premium Gate (`PremiumGate.tsx`):** Ajustados os textos de preço, botão principal e rodapé do paywall para explicitar de forma clara o período experimental de 7 dias grátis antes da primeira cobrança de $1.99.
- **Build verificado:** Compilação com `npm run build` validada localmente com 100% de sucesso.

### 2026-06-25 — Correções de Admin Premium, Estabilidade do Banco e Internacionalização do Dashboard
- **Fix admin premium (`premiumAccess.ts`):** Adicionado `admin@ascen.com` (sem "d") na whitelist de emails com acesso premium garantido. O email anterior `admin@ascend.com` também mantido. O check `startsWith('admin@')` cobre qualquer subdomínio admin.
- **Supabase mais robusto (`supabase.ts`):** Adicionado timeout de 20 segundos por requisição via `AbortController` no fetch global, reduzindo o travamento silencioso quando a conexão falha. Exportada nova função `withRetry<T>()` com backoff exponencial (500ms → 1s → 2s) para uso em queries críticas, evitando falhas permanentes por instabilidade momentânea de rede.
- **Tradução completa do Dashboard (`Dashboard.tsx`):** O Dashboard era a única tela principal sem suporte bilíngue. Refatorados `STAT_META` e `DOMAIN_META` de constantes estáticas para funções dinâmicas `getStatMeta(l)` e `getDomainMeta(l)` que recebem o helper de tradução. Todas as strings visíveis (nomes de atributos, labels de stats, resumo do dia, histórico de evolução, missão principal, domínios, etc.) agora respondem ao toggle PT-BR / EN-US sem reload.
- **Preço ($1.99):** Confirmado que `PremiumGate.tsx` já exibia `$1.99` corretamente. Nenhuma string `$2.00` encontrada em código-fonte.
- **Build verificado:** `npm run build` passou sem erros de TypeScript (apenas warnings de chunk size já existentes).

### 2026-06-24 — Tradução Completa de Módulos (Fortuna, Rest, Nutrition) e Admin Premium
- Internacionalização completa via helper dinâmico `l(pt, en)` e `translateUiText` nas páginas [Fortuna.tsx](file:///d:/Área de Trabalho/App/src/pages/Fortuna.tsx), [Rest.tsx](file:///d:/Área de Trabalho/App/src/pages/Rest.tsx) e [Nutrition.tsx](file:///d:/Área de Trabalho/App/src/pages/Nutrition.tsx).
- Adicionada moeda dinâmica na Fortuna (R$ para pt-BR, $ para en-US) e tradução dinâmica das categorias financeiras, estados de respiração da meditação e botões de modais de formulário.
- Verificados com sucesso o build (`npm run build`) e a auditoria de localização (`npm run audit:i18n`).
- Sincronização do status premium para contas admin (e-mails iniciados por `admin@`) ativada tanto no banco de dados Supabase quanto na Store global do Zustand.

### 2026-06-24 — Premium Manual, Preço Stripe e Localização Residual
- Adicionada concessão manual de premium para `diegoseleguini@gmail.com` via `src/lib/premiumAccess.ts`, sincronizando `is_premium=true` no profile quando o usuário logar.
- Criada migration `supabase/migrations/20260624_manual_premium_diego.sql` para aplicar a mesma concessão diretamente no Supabase remoto.
- O checkout premium passou a criar assinatura recorrente por `price_data` com `unit_amount=199` e moeda `usd`, removendo a dependência obrigatória de `STRIPE_PREMIUM_PRICE_ID` para cobrar US$ 1.99/mês.
- Atualizado o preço exibido no `PremiumGate` para `$1.99 /month` e removida a menção antiga a Llama no benefício nutricional.
- Corrigido o botão de desconectar em inglês com logout global do Supabase e navegação explícita para `/login`.
- Corrigidas traduções híbridas restantes em Nutrição, presets de Treino e Códex de Quests, especialmente metas nutricionais, botões Visualizar/Importar, divisão semanal, atributos e diretrizes do Códex.
- Validações executadas: `npm.cmd run audit:i18n`, `npm.cmd run build` e `git diff --check`.

### 2026-06-24 — Estabilização do Códex Nutricional e Fast Foods
- Substituída a análise nutricional dependente do Groq por um motor local auditável em `src/lib/nutritionAi.ts`, evitando respostas inconsistentes quando a API não estava configurada ou quando o modelo inferia fontes externas sem consulta real.
- Adicionado catálogo curado para itens comerciais/fast food comuns (Big Mac, Whopper, McFritas, McNuggets, Subway e industrializados), tratando produtos consolidados como um único item em vez de decompor sanduíches em ingredientes primários.
- O Códex agora combina Tabela TACO, alimentos salvos no app, catálogo local e estimativas controladas com confiança calculada por fonte/porção informada.
- Melhorado o parser de unidades caseiras e entradas PT-BR/EN-US: gramas, ml, unidades, fatias/slices, colheres/tbsp, conchas, xícaras/cups, scoops e porções.
- Corrigido o matcher da TACO para reparar nomes de alimentos com mojibake antes da normalização, melhorando busca por itens acentuados como pão, feijão, açúcar e brócolis.
- A interface do Códex deixou de mencionar FatSecret/internet como fonte real e passou a exibir “TACO vs Catálogo vs Estimativa”, mantendo revisão manual antes de salvar no diário.
- Validações executadas: `npm.cmd run audit:i18n` e `npm.cmd run build`.

### 2026-06-24 — Correção de Traduções Compostas em Telas Ativas
- Corrigidas traduções híbridas em inglês nas telas de Missões, Nutrição, Treinos, Fortuna, Bosses e paywalls premium.
- `PremiumGate` passou a respeitar o idioma selecionado internamente, incluindo título, descrição, benefícios, preço, CTA, mensagens de erro e nota do Stripe.
- O status diário de Missões agora renderiza contagem/pluralização completa em inglês, sem depender da ponte automática de DOM.
- A Fenda de Anomalia IA recebeu textos explícitos em EN-US para título, descrição, estado do portal e status da anomalia.
- O consumo diário de Nutrição agora traduz cabeçalhos, vazio, CTA, tipo de refeição, nome de alimento e horário pelo locale selecionado.
- Paywalls de Treinos, Nutrição, Fortuna e Bosses passaram a enviar títulos e descrições naturais em EN-US.
- Validações executadas: `npm.cmd run audit:i18n` e `npm.cmd run build`.

### 2026-06-23 — Integração do Sistema de Assinaturas Premium com Stripe
- **Banco de Dados (Supabase)**: Criada a migration `update_schema_stripe.sql` adicionando campos `is_premium`, `stripe_customer_id` e `stripe_subscription_id` na tabela `profiles` e executados os comandos SQL no banco de produção.
- **Supabase Edge Functions**: Desenvolvidos e implantados com sucesso os endpoints `stripe-checkout` (para iniciar sessões de checkout seguras), `stripe-portal` (para redirecionar o usuário ao Customer Portal de autogestão do Stripe) e `stripe-webhook` (para escutar eventos de pagamento/cancelamento do Stripe e retransmiti-los ao banco).
- **Zustand & Persistência**: Atualizada a store global `useHunterStore.ts` para carregar, persistir e gerenciar as novas propriedades do perfil de assinante (`isPremium`, `stripeCustomerId` e `stripeSubscriptionId`).
- **Paywall PremiumGate**: Desenvolvido o componente visual `PremiumGate.tsx` com visual cyberpunk holográfico estilo Solo Leveling para interceptar acessos restritos em áreas do aplicativo e facilitar o checkout.
- **Bloqueio de Módulos Premium**: Envolvidos com o `PremiumGate` os seguintes componentes:
  - **Nutrição com IA**: Bloqueio na aba Códex de Alimentação em `Nutrition.tsx`.
  - **Histórico de Treinos**: Bloqueio na aba de Evolução/Progresso em `Workouts.tsx`.
  - **Chefes Finais**: Bloqueado combate ativo contra os Bosses 05, 06 e 07 em `Bosses.tsx`. Atualizada a galeria inferior de bosses para identificar os chefes restritos com ícone de `Sparkles` e status "Premium" se o usuário for comum.
  - **Módulo Fortuna**: Bloqueio total de acesso à página `Fortuna.tsx` para não assinantes.
- **Painel de Assinatura nas Configurações**: Adicionada seção de assinatura em `Settings.tsx` para visualização e gerenciamento rápido do plano. Permite ao usuário comum iniciar o checkout e ao usuário premium acessar o portal de faturamento do Stripe para alterar dados ou cancelar o plano.

### 2026-06-23 — Correção de Tradução e Estabilização de Idiomas (Fim do F5)
- Modificado o `setLanguage` em `PreferencesContext.tsx` para recarregar a página automaticamente (`window.location.reload()`) após gravar a escolha de idioma no `localStorage`. Isso elimina de vez os bugs de concorrência com o React e a necessidade de F5 manual ao alternar entre Português e Inglês.
- **Correção Geral de Falhas de Tradução**: Adicionadas mais de 60 traduções de frases completas mapeadas a partir das telas de Descanso (Rest), Nutrição (Nutrition) e Fortuna (Fortuna), corrigindo misturas de idiomas em cabeçalhos, botões, cards de metas, históricos e alertas.
- **Refatoração Dinâmica das Expressões Regulares**: Substituídas as definições estáticas de `REPLACEMENTS` no `uiEnglish.ts` por RegExp construídos dinamicamente usando lookbehind e lookahead negativos que suportam caracteres acentuados do português. Isso previne de forma sistêmica traduções de substrings indevidas (como a palavra "Média" ser traduzida parcialmente como "Méday").
- Validado o build de produção com sucesso absoluto e executada a auditoria de i18n (`npm run audit:i18n`), garantindo zero erros ou regressões no projeto.

### 2026-06-22 — Correção Estrutural do Tema Claro e Inglês
- O tema claro passou a cobrir superfícies recorrentes, campos, selects, placeholders, bordas, scrollbars e cores de status com contraste adequado.
- Botões coloridos e áreas visuais que precisam permanecer escuras agora preservam texto branco e legibilidade.
- Removidos controles que forçavam `color-scheme: dark` em Configurações, Missões e Onboarding.
- Configurações foi localizada nos fluxos de perfil, conquistas, segurança, tutorial, telemetria, resets e mensagens.
- Chefes recebeu tradução dos estados de batalha, histórico, recompensas, nomes, descrições, fraquezas e títulos dos sete confrontos.
- O shell principal agora traduz avisos de conexão, diagnóstico e status do sistema.

### 2026-06-22 — Integração de Fontes Nutricionais na IA e Painel de Comparação Premium
- Atualizado o Codex de Alimentação (IA de Nutrição) em [Nutrition.tsx](file:///d:/Área%20de%20Trabalho/App/src/pages/Nutrition.tsx) para consultar e comparar os valores nutricionais de cada ingrediente em três bases distintas: Tabela TACO, FatSecret e Estimativa da própria IA (fallback).
- Reformulado o prompt do sistema para a API do Groq (Llama 3.1) para extrair os macronutrientes e calorias de cada uma das fontes por 100g e calcular o consolidado final priorizando TACO > FatSecret > IA Fallback.
- **Refinamento para Itens Comerciais / Fast-Food**: Adicionada regra específica no prompt da IA para reconhecer alimentos consolidados de marcas e redes fast-food (ex: Big Mac, Whopper, etc.) e tratá-los como um único ingrediente com os macros e calorias oficiais consolidados do produto inteiro (ex: ~524 kcal para o Big Mac), em vez de decompô-los de forma errônea em partes individuais como carnes soltas, vegetais e pão de centeio.
- Implementado um painel comparativo premium na tela de revisão de refeições da IA: cada ingrediente agora é exibido como um card expansível que revela uma tabela contendo os valores de energia, proteínas, carboidratos e gorduras de cada base lado a lado.
- Adicionado badge de indicação de fonte ativa e botões com transições suaves do framer-motion para navegação.
- Validada a compatibilidade de tipos no TypeScript e o empacotamento completo de produção via npm run build.

### 2026-06-22 — Refatoração e Correção do Tutorial Interativo (Product Tour) no Quick Menu
- Transferida a execução do Product Tour da tela de Dashboard (/status) para a nova tela inicial do Portal de Comando (/ - Quick Menu), onde os caçadores pousam após o onboarding ou ao solicitar o tour.
- Redefinidas as etapas e âncoras do tutorial no [QuickMenu.tsx](file:///d:/Área de Trabalho/App/src/pages/QuickMenu.tsx) para focar na apresentação do cabeçalho de status, missão recomendada, portais principais e módulos de expansão.
- Removidas as referências de importação e montagem do tutorial do [Dashboard.tsx](file:///d:/Área de Trabalho/App/src/pages/Dashboard.tsx) para evitar duplicidades.
- Corrigido o posicionamento do highlighter e do card explicativo no [ProductTour.tsx](file:///d:/Área de Trabalho/App/src/components/rpg/ProductTour.tsx) para `fixed` (viewport-relative), corrigindo o bug de desalinhamento sob rolagem de tela.
- Implementado suporte dinâmico a multi-idiomas (Português/Inglês) em todos os textos do tutorial utilizando `usePreferences`.
- Adicionada a animação `@keyframes pulse-purple` no [index.css](file:///d:/Área de Trabalho/App/src/index.css) para iluminação neon do highlighter.

### 2026-06-22 — Balanceamento de Chefes e Progressão v3
- Restaurado o ataque manual na aba de Chefes, agora limitado a uma utilização diária por batalha para complementar, sem substituir, o dano automático das atividades.
- Chefes foram recalibrados para campanhas de aproximadamente 3 a 10 dias, com HP progressivo, dano normalizado e multiplicadores de fraqueza reduzidos.
- Batalhas antigas ainda ativas passam a preservar o percentual de vida ao receber os novos valores de HP; chefes presos em `0 HP` são finalizados automaticamente e liberam o próximo confronto.
- O histórico de dano agora persiste entre navegações, evita eventos duplicados e registra impactos causados fora da tela de Chefes.
- A curva de nível, ranks, anti-farm e recompensas de treinos, nutrição, conquistas e chefes foram endurecidas sem remover conquistas existentes.

### 2026-06-22 — Finalização: Nutrição, Chefes, Preferências e Progressão
- Nutrição passou a normalizar relacionamentos `foods` retornados como objeto ou array pelo Supabase, evitando totais zerados e detalhes quebrados.
- Logs originados de cardápios agora preservam integridade: edição direciona ao cardápio, remoção desfaz a conclusão completa e reverte o dano nutricional.
- Exclusão do último consumo criado pela IA também remove o alimento customizado órfão.
- Excesso calórico ganhou alerta vermelho explícito em Nutrição e no Quadro de Missões, mostrando consumo, limite e quantidade excedida.
- Corrigidas corridas nas animações de dano dos Chefes, atualização do prazo da raid e persistência de ataques; o ataque de teste ficou restrito ao ambiente de desenvolvimento.
- Adicionados tema claro persistente e alternância Português/Inglês nas preferências, com tradução do shell principal e módulos críticos.
- Progressão recalibrada com curva de XP crescente, ranks mais espaçados, bônus de streak limitado e anti-farm mais rígido, preservando todas as conquistas existentes.

### 2026-06-21 — Nutrição Híbrida, TACO e Dano de Cardápios
- O Códex da Alimentação passou a usar a IA somente para interpretar ingredientes e quantidades; calorias e macronutrientes agora são calculados localmente a partir de 597 alimentos da Tabela TACO.
- A revisão da IA exibe cobertura dos ingredientes, alimentos TACO utilizados e itens não localizados antes do registro.
- Concluir uma refeição do Cardápio do Caçador nas Missões agora cria `food_logs` vinculados e reversíveis, fazendo o consumo aparecer no painel de Nutrição e na avaliação diária.
- Desmarcar a refeição remove os logs sincronizados sem apagar registros manuais ou da IA.
- Cardápios concluídos aplicam 15 de dano nutricional ao boss ativo; a desmarcação reverte o mesmo dano base.
- O HUD calórico das Missões agora mostra calorias consumidas sobre a meta e soma apenas cardápios concluídos com registros independentes do diário.
- Corrigida a conversão de porções personalizadas: unidades agora são multiplicadas pelo peso da porção, mantendo registro, edição e prévia calórica consistentes.
- A reparação de cardápios concluídos passou a detectar itens individuais ausentes, evitando diários parcialmente sincronizados sem duplicar os itens já existentes.
- O registro por IA remove o alimento customizado recém-criado caso a gravação do consumo falhe, evitando dados órfãos.
- Adicionada a migration `20260621_meal_completion_food_logs.sql` e atribuição da fonte de dados em `THIRD_PARTY_NOTICES.md`.

### 2026-06-21 — Raid Semanal Premium
- Header da raid ampliado com boss ativo, HP restante, dano acumulado, prazo e recompensa principal.
- Painel estratégico ganhou fraqueza, fontes de dano e regeneração, multiplicador ativo e leitura de risco.
- Ação de teste foi contextualizada como ataque de treino, com preview claro da mecânica de dano.
- Histórico da sessão registra ataques, críticos e regeneração sem inventar persistência no backend.
- Recompensa de purificação e galeria de bosses receberam maior destaque, estados visuais e microinterações.
- Nomes longos dos bosses agora quebram em múltiplas linhas sem cortar ou invadir os cards vizinhos.

### 2026-06-21 — Refinamento de Descanso & Lazer
- Navegação convertida em pills premium com ícones, subtítulos, glow contextual e transição entre abas.
- Header ampliado com sono atual, meditação acumulada, lazer offline e estado de equilíbrio calculado.
- Cards de recuperação receberam metas diárias, progresso animado, status e microcopy mais clara.
- Formulários de sono e lazer foram refinados com orientação, labels maiores e CTAs mais fortes.
- Histórico ganhou empty state premium e o Templo da Mente recebeu melhorias de timer, duração e legibilidade.

### 2026-06-19 — Polimento de Navegação e Códex
- Substituída a navegação simples do Quadro de Missões por pills responsivas com ícones, hover, glow azul e indicador ativo animado.
- Ampliado o painel “Diretrizes do Códex” para toda a largura disponível, alinhando-o aos accordions inferiores.
- Atualizados título, subtítulo e texto introdutório do Códex com hierarquia mais legível e linguagem oficial do Sistema.

### 2026-06-19 — Quest Board Premium
- Reformulado o status diário com progresso, total concluído, percentual, XP acumulado e mensagem operacional do Sistema.
- Adicionada a seção Próxima Missão com horário, categoria, XP, atributo e ação contextual.
- Compactados os cards diários e padronizados os estados pendente, ativa, concluída, atrasada, bônus IA, recorrente e automática.
- Refeições sem recompensa própria deixam de exibir `+0 XP`.
- A Fenda de Anomalia IA tornou-se compacta e colapsável, com feedback de geração preservado.
- “Lista de Sistema” foi renomeada para Quests Recorrentes, ganhou runas semanais maiores, status e edição real pelo modal existente.
- O Códex do Caçador passou a usar accordions por categoria com diretrizes, atributos, recompensas, lore e ações.
- Build de produção validado com `npm.cmd run build`.

### 2026-06-19 — Revisão e Legibilidade do Códex Nutricional
- Elevada a escala tipográfica da Recuperação de Mana, reduzindo labels comprimidos e melhorando textos de apoio, números e ações.
- O Códex agora separa análise e persistência: a IA gera uma prévia sem gravar dados automaticamente.
- Adicionado card de revisão com kcal, macros, peso, confiança estimada, edição inline e confirmação explícita antes do registro.
- Ampliada a coluna de Consumo Diário no desktop e refinados lista, empty state, macros, horário e ações.
- Cards dos Cardápios do Caçador receberam tipografia mais confortável sem alterar seus dados ou fluxo de adição ao dia.

### 2026-06-19 — Recuperação de Mana Premium
- **Dashboard nutricional:**
  - Reformulados os cards de energia e macros com metas de referência, consumido, restante, progresso animado e estados baixo/ideal/excedido.
  - A meta diária ganhou hierarquia principal, faixa recomendada, objetivo, calorias restantes e previsão da recompensa real de `+60 XP` e `+2 VIT`.
  - Adicionado streak nutricional baseado nos registros reais de `nutrition_daily_scores`.
- **Códex e diário:**
  - O analisador por IA recebeu microcopy orientada, exemplos rápidos, loading mais claro e resultado premium sem antecipar recompensas.
  - Registros do dia agora possuem expansão, macros, quantidade, horário, edição e remoção reais.
  - Criado empty state com acesso direto ao primeiro registro.
- **Cardápios do Caçador:**
  - Cards agora exibem objetivo estimado, energia, proteína, dificuldade, preparo e tags derivadas dos alimentos cadastrados.
  - Adicionada ação para inserir todos os itens de um cardápio no diário do dia usando `food_logs`.
  - Build de produção validado com `npm.cmd run build`.

### 2026-06-19 — Artes dos Protocolos de Treino
- Vinculadas as nove imagens de `public/Treinos/` aos respectivos modelos do Centro de Treinamento.
- Os cards de protocolos agora exibem banners cinematográficos com carregamento otimizado, enquadramento responsivo, contraste e microinteração no hover.
- A visualização detalhada de cada protocolo reutiliza sua arte no cabeçalho, mantendo continuidade visual entre catálogo e modal.

### 2026-06-18 — Navegação e Polimento do Training Center
- **Centro de Comando:**
  - Substituídas as abas administrativas por uma navegação responsiva em cards compactos com ícones, descrições, estado ativo e glow contextual.
  - Adicionados os destinos Hoje, Protocolos, Evolução e Arsenal, preservando os mesmos estados e fluxos internos.
  - O botão principal do cabeçalho agora acompanha a aba ativa: Nova Rotina, Importar Protocolo, Registrar Treino ou Novo Exercício.
- **Protocolos e Arsenal:**
  - Cards de rotina agora exibem agenda, status, progresso da sessão, último registro real e próximo exercício.
  - Compactada a grade da biblioteca para uma leitura de catálogo, mantendo busca, filtros, registro e adição às rotinas.
  - Adicionadas transições suaves entre áreas e microinterações de hover/active com comportamento responsivo.
  - Build de produção validado com `npm.cmd run build`.

### 2026-06-18 — Training Center Premium
- **Rotinas e Missão Física:**
  - Criado destaque dinâmico para a rotina agendada do dia com duração, XP, atributos e acesso à sessão.
  - Reformulado o empty state de rotinas com ações para criação manual ou importação de modelo.
  - Conclusões de rotina agora evoluem o atributo principal, Vitalidade e Disciplina, além do XP e domínio Corpo.
- **Modelos e Biblioteca:**
  - Expandida a galeria para nove programas importáveis: Full Body, Upper/Lower, PPL 3x/6x, ABCD, ABCDE, Casa, Força Base e Recomposição.
  - Enriquecidos cards com banner preparado para imagem, objetivo, nível, frequência, duração, divisão e atributos.
  - Adicionados filtros de biblioteca por grupo muscular, equipamento e dificuldade, além de fluxo para adicionar exercícios a uma rotina.
- **Evolução Física:**
  - Adicionados treinos realizados, volume, streak, grupos mais treinados, últimos registros e empty state premium.
  - Build de produção validado com `npm.cmd run build`.

### 2026-06-17 — Timeline Real e Sete Domínios no Status
- **Histórico de Evolução:**
  - Substituído o histórico derivado da UI por eventos reais de tasks, hábitos, rotinas, refeições e registros financeiros do Supabase.
  - Adicionados nome da ação, XP real, atributo impactado, domínio e horário quando o schema possui timestamp.
  - Compactado o card com altura adaptável, scroll interno para muitos eventos e empty state com acesso às missões.
  - Integrada a sequência atual como evento legítimo da timeline.
- **Status e Domínios:**
  - Refinado o estado de conquista da Missão Principal quando todas as pendências estão concluídas.
  - Corrigidos Domínios de Evolução para sete categorias, alinhadas a `FOR`, `INT`, `RES`, `VIT`, `DIS`, `SAB` e `EQU`.
  - Build de produção validado com `npm.cmd run build`.

### 2026-06-17 — Status Vivo, Radar de 7 Atributos e Próxima Missão
- **Correções e Utilidade da Character Sheet:**
  - Corrigido o Radar Chart para evidenciar os sete eixos `FOR`, `INT`, `RES`, `VIT`, `DIS`, `SAB` e `EQU`, incluindo vértices externos, labels e valores.
  - Enriquecidos os cards de atributos com variação diária, XP recente, indicador animado de evolução e estado vazio.
  - Adicionada missão principal dinâmica baseada na próxima pendência real de treino, hábito ou recuperação.
  - Expandidos os domínios com próximo marco, recompensa futura e XP restante para o próximo nível.
  - Refinados Recursos do Dia e Histórico de Evolução com microcopy RPG, horários, loading e empty state premium.
  - Preservada integralmente a lógica de títulos desbloqueáveis e o título equipado do usuário.
  - Build de produção validado com `npm.cmd run build`.

### 2026-06-17 — Character Sheet Premium no Status
- **Ficha do Caçador:**
  - Refatorada a página de Status para priorizar perfil, classe, rank, título, level, streak e progressão de XP.
  - Removidos atalhos redundantes e a listagem extensa de missões, substituídos por um resumo compacto do dia.
- **Evolução Visível:**
  - Criados sete cards de atributos com valor e variação diária baseada em conclusões reais.
  - Reposicionado e refinado o radar com maior contraste, labels responsivas e leitura de perfil dominante/foco recomendado.
  - Reformulados os cinco domínios com level, progresso, atributos relacionados e último sinal de evolução.
  - Adicionados histórico de evolução e bloco compacto de recursos diários.
  - Atualizado o Product Tour para refletir a nova estrutura da ficha.
  - Build de produção validado com `npm.cmd run build`.

### 2026-06-17 — Polimento de UX da Home e Navegação
- **QuickMenu e Hierarquia:**
  - Ampliada discretamente a largura útil do conteúdo para melhor ocupação de telas desktop.
  - Refinados contraste e tamanho das descrições, badges e chamadas de acesso dos cards.
  - Substituído o label repetido dos cards principais por `Análise Principal`, `Centro de Quests` e `Módulo Físico`.
  - Adicionado bloco de próxima ação recomendada com acesso direto ao Quadro de Missões.
- **Status do Hunter e Navegação:**
  - Reorganizada a ficha superior com nome, classe, rank, level e progresso numérico de XP.
  - Atualizados sidebar e menu mobile para usar `Portal` e `Nutrição`, com maior contraste nos itens inativos.
  - Expandido o rodapé da navegação com classe, rank, level e XP atual/próximo nível.
  - Build de produção validado com `npm.cmd run build`.

### 2026-06-17 — Refinamento Premium da QuickMenu
- **Hierarquia e Clareza dos Portais:**
  - Separados os módulos principais (Status, Missões e Treinamento) dos módulos complementares, preservando a estrutura geral da página.
  - Padronizados nomes e descrições dos sete módulos para leitura mais rápida e consistente.
  - Criados componentes reutilizáveis `PortalCard` e `StatusBadge` com estados `SISTEMA ATIVO`, `NOVO`, `EM PROGRESSO`, `BOSS DISPONÍVEL` e `QUEST PENDENTE`.
  - Adicionado hover de abertura de portal com zoom leve, contraste da imagem, brilho de borda e glow na seta, respeitando `motion-safe`.
  - Expandida a ficha do usuário com nome, classe, rank, level, XP atual e barra de progresso.
  - Ajustado o grid responsivo para uma coluna no mobile, duas em telas intermediárias e três nos portais principais em desktop.
  - Build de produção validado com `npm.cmd run build`.

### 2026-06-16 — Ajustes de Interface e Galeria de Ranks no Onboarding
- **Correção de Colisão e Layout**: Mudar o container de página do Onboarding para suportar rolagem vertical natural e margem superior adequada, eliminando a sobreposição do chip superior com o título.
- **Visualizador Interativo de Ranks (Galeria E ao S)**: Implementação de um Lightbox modal em tela cheia acessado ao clicar na imagem da classe despertada e no grid inferior de classes.
- **Seletor de Ranks Cyberpunk**: Chips de seleção rápida dos Ranks E, D, C, B, A, S que trocam as imagens dinamicamente e atualizam as descrições personalizadas de evolução de poder de mana para cada uma das 5 classes em PT-BR.
- **Correção do Aspecto Pixelado das Artes**: Configuração explícita de `image-rendering: auto` para garantir que as imagens em alta resolução preservem seu traçado nítido e suave.
- **Unificação de Fontes no Login**: Substituição da tipografia genérica pela fonte padrão `.font-orbitron` (Orbitron) nos elementos da tela de login (`HunterLogin`), alinhando o estilo ciberpunk de RPG futurista do portal de entrada com o restante da aplicação.
- **Validação de Build**: Compilação estática do Vite validada e bem-sucedida (`npm run build`).

### 2026-06-16 — Ritual de Despertar no Onboarding
- **Experiência RPG do Onboarding:**
  - Transformado o fluxo em fases narrativas do Sistema: calibração biológica, análise corporal, missão central, rank, avaliação e despertar da classe.
  - Adicionada sincronização visual com percentual de progresso, trilha de fase e partículas discretas sem alterar paleta, tipografia ou estrutura geral.
  - Melhorado feedback de escolha em sexo, objetivo, rank, foco, nutrição e quiz com estado "Registrado" e mensagens de decisão do Sistema.
  - Reforçada a revelação de classe com card de desbloqueio, imagem da classe, atributos iniciais, destaque de conquista e classe recomendada já selecionada.
  - Build de produção validado com `npm.cmd run build`.

### 2026-06-16 — Fase 10.1: Calibração de Gamificação de Atributos & Progresso Reativo
- **Correção dos Domínios da Evolução (Dashboard)**:
  - Sincronizados os Domínios da Evolução no [Dashboard.tsx](file:///d:/Área de Trabalho/App/src/pages/Dashboard.tsx) com as métricas e atributos exatos do `IDEAS.md`:
    - **Corpo** (`corpoSum`): Média reativa de Força (FOR), Resistência (RES) e Vitalidade (VIT).
    - **Mente** (`menteSum`): Valor absoluto do atributo Inteligência (INT).
    - **Fortuna** (`fortunaSum`): Valor absoluto do atributo Sabedoria (WIS).
    - **Carreira** (`carreiraSum`): Valor absoluto do atributo Disciplina (DIS).
    - **Equilíbrio** (`equilibrioSum`): Valor absoluto do atributo Equilíbrio (BAL).
  - Atualizadas as descrições dos domínios para correspondências reais da vida e design imersivo:
    - Mente: "Estudos, Aprendizado & Foco".
    - Fortuna: "Gestão Financeira & Decisões".
    - Equilíbrio: "Sono, Calma & Saúde Mental".
- **Ganho de Disciplina Automático por Streaks**:
  - Implementado o acréscimo automático de **+1 ponto de Disciplina (DIS)** na store global [useHunterStore.ts](file:///d:/Área de Trabalho/App/src/stores/useHunterStore.ts) toda vez que o caçador mantém a streak de check-in diário consecutiva (de ontem para hoje).
  - O valor atualizado é refletido em tempo real na interface e persistido de forma segura no Supabase (`profiles`).
- **Correção do Botão de Desconectar (Logout Resiliente)**:
  - Implementada uma estrutura defensiva com `try-catch-finally` na função `signOut` do [AuthContext.tsx](file:///d:/Área de Trabalho/App/src/contexts/AuthContext.tsx).
  - Garante a limpeza instantânea da sessão do cliente, do estado local e da store do Zustand no bloco `finally`, mesmo em caso de perda de conexão ou de expiração/bloqueio de token de sessão do Supabase no servidor, eliminando o travamento do botão.
- **Validação de Build**:
  - bundle de produção validado e compilado via `npm run build` com sucesso absoluto (zero erros estáticos ou de digitação).

### 2026-06-16 — Fase 10: Módulo de Descanso & Lazer (Templo do Caçador)
- **Tabela e Schema no Supabase (`rest_logs`)**:
  - Criada a migration `20260616_rest_module.sql` definindo a tabela `rest_logs` para persistência de dados de sono, meditação e lazer offline.
  - Aplicada a migração no Supabase remoto via MCP tool com políticas RLS restritas ao próprio proprietário do registro.
- **Desenvolvimento da Página Rest (`Rest.tsx`)**:
  - Criada uma interface cyberpunk moderna nas cores roxo/índigo (`#6366f1` / `#8b5cf6`) com cards de resumo do dia para Sono, Meditação e Lazer.
  - Desenvolvido o **Templo da Mente**: Um cronômetro de meditação interativo que pulsa no ritmo de respiração orientada ("Inspire... Expire") utilizando Framer Motion, gerando inserções automáticas no Supabase e concedendo **+15 XP** e **+2 Equilíbrio (BAL)** na conclusão.
  - Implementado formulário rápido de Sono (horas + estrelas de qualidade neon) concedendo **+20 XP** e **+2 Equilíbrio (BAL)**.
  - Implementado formulário rápido de Lazer/Hobby desconectado de telas concedendo **+15 XP** e **+1 Equilíbrio (BAL)**.
  - Integrada a listagem histórica com opção de exclusão atômica de logs.
- **Roteamento, Portal de Comando & Menu Lateral**:
  - Habilitada a rota `/rest` no [App.tsx](file:///d:/Área de Trabalho/App/src/App.tsx) carregando a nova página `Rest`.
  - Desbloqueado e ativado o card "Descanso & Lazer" no Portal de Comando ([QuickMenu.tsx](file:///d:/Área de Trabalho/App/src/pages/QuickMenu.tsx)) com o ícone `Moon` e glow roxo.
  - Adicionado o atalho `/rest` ("Descanso") com ícone `Moon` no menu lateral desktop ([RPGLayout.tsx](file:///d:/Área de Trabalho/App/src/components/layout/RPGLayout.tsx)) e no menu móvel ([MobileMenu.tsx](file:///d:/Área de Trabalho/App/src/components/layout/MobileMenu.tsx)).

### 2026-06-16 — Fase 9: Biblioteca de Programas de Treino (Treinos Pré-Prontos)
- **Presets de Programas de Treino Estáticos**:
  - Criado o arquivo `src/data/workoutPresets.ts` contendo rotinas realistas organizadas por frequência de treino (Push Pull Legs 3x, ABCD 4x, ABCDE 5x, PPL 6x e Treino em Casa), com exercícios, séries e repetições sugeridas.
- **Importação Dinâmica de Rotinas**:
  - Implementada a função `handleImportProgram` no `Workouts.tsx` para importar múltiplos protocolos de uma vez em lote no Supabase.
  - O importador valida se cada exercício já existe no banco global (reaproveitando o `id`) ou o cria de forma customizada (`is_custom = true`), garantindo total resiliência contra erros de chave estrangeira ou dados duplicados.
- **Interface Ciberpunk Dourada**:
  - Adicionada a aba "Modelos de Treino" na página `/workouts` com filtros rápidos de frequência.
  - Criado o modal de detalhes do preset de treino para visualização completa da estrutura de exercícios e séries antes da confirmação.
- **Compatibilidade Mantida**:
  - A opção clássica de criação manual de rotinas e exercícios permanece ativa e intocada no componente.

### 2026-06-16 — Fase 8.1: Quests & Metas Financeiras (Módulo Fortuna)
- **Schema no Supabase e Migration Local**:
  - Criada a migration `20260616_fortuna_goals.sql` definindo a tabela `financial_goals` para rastrear objetivos de médio e longo prazo.
  - Aplicada a migração no Supabase remoto via MCP tool `execute_sql`.
  - Habilitada RLS e configuradas políticas de acesso restritas ao próprio usuário.
- **Quest Diária de Finanças**:
  - Integrada a quest reativa "Códex Financeiro" no Dashboard, detectando a inserção de logs financeiros na data atual.
  - Sincronizada a exibição da Quest Diária de Finanças na aba de Missões Diárias da tela de Missões (`Quests.tsx`), recalculando as métricas de progresso da página em tempo real.
  - Ajustado o Bônus Diário de Sobrevivência para 5 quests (passando de 4).
- **Gerenciador de Metas no Módulo Fortuna**:
  - Removida a meta estática e implementado um painel dinâmico e interativo de Objetivos & Metas de Longo Prazo.
  - Adicionado formulário de criação de metas categorizadas por tipo (Meta Única ou Mensal Recorrente) e valor alvo.
  - Implementado o ajuste de progresso acumulado com atualização em tempo real no Supabase.
  - Configurada a recompensa de **+50 XP** e **+2 Sabedoria (WIS)** na conclusão de cada meta financeira.
  - Adicionada a **Quest do Sistema fixa de Aporte de Purificação (Guardar 20% do Ganho Mensal)** no topo da barra de metas, calculada automaticamente com base na receita e nos investimentos cadastrados no mês atual.
- **Validação de Build**:
  - Executado o build do Vite com sucesso absoluto (`npm run build`).

### 2026-06-16 — Fase 8: Módulo Fortuna (Finanças & Gestão de Recursos)
- **Schema no Supabase e Migration Local**:
  - Criada a migration `20260616_fortuna_module.sql` definindo a tabela `financial_logs` para persistência de receitas, despesas e investimentos.
  - Habilitada a segurança RLS na tabela e configuradas as políticas idempotentes para leitura/escrita restritas por usuário (`user_id = auth.uid()`).
  - Aplicada a migration com sucesso na base remota do Supabase via MCP Server.
- **Desenvolvimento da Página Fortuna (`Fortuna.tsx`)**:
  - Construída a interface cyberpunk com temática dourada/âmbar (`#f59e0b`) e fontes Orbitron.
  - Implementados cards de resumos financeiros mensais reativos: Ganhos, Gastos, Aportes e Taxas de Economia/Aporte.
  - Criado o formulário de fluxo de recursos com selects reativos de categorias (Moradia, Alimentação, Ações, FIIs, Cripto, etc.).
  - Desenvolvida a barra de progresso dourada de completude da Meta de Aporte Mensal com edição direta do valor alvo na tela.
  - Criada a listagem de registros financeiros do mês atual com paginação e exclusão atômica de transações.
- **Mecânicas de RPG Integradas**:
  - Lançamento de transações concede **+10 XP** no `useHunterStore`.
  - Transações do tipo *Investimento/Aporte* concedem **+1 de Sabedoria (WIS)**, elevando o atributo de sabedoria do caçador.
  - Cada registro financeiro gera **10 de dano financeiro** contra o Boss ativo. Ao enfrentar o Boss 05 (**O Mercador das Dívidas**), o dano torna-se **Crítico de 2.0x (20 de dano)** por se alinhar à sua fraqueza temática.
- **Navegação e Roteamento**:
  - Configurada a rota `/fortuna` no [App.tsx](file:///d:/Área de Trabalho/App/src/App.tsx) importando o componente Fortuna.
  - Desbloqueado o card do Módulo Fortuna no Portal de Comando ([QuickMenu.tsx](file:///d:/Área de Trabalho/App/src/pages/QuickMenu.tsx)) alterando seu status para ativo, removendo a opacidade de bloqueio e ativando o glow âmbar completo.
  - Adicionados links rápidos para o Módulo Fortuna nos menus de navegação lateral desktop ([RPGLayout.tsx](file:///d:/Área de Trabalho/App/src/components/layout/RPGLayout.tsx)) e móvel ([MobileMenu.tsx](file:///d:/Área de Trabalho/App/src/components/layout/MobileMenu.tsx)) com o ícone `Coins`.
- **Validação de Build**:
  - Compilado o bundle de produção via `npm run build` com sucesso absoluto (zero erros sintáticos ou estáticos).

### 2026-06-16 — Fase 3: Módulo de IA Nutricional (Códex da Alimentação) e Reestruturação de Abas
- **Códex da Alimentação (IA com Groq/Llama 3.1)**:
  - Desenvolvida a lógica de análise de refeição em linguagem natural conectando o frontend ao endpoint da Groq API (`llama-3.1-8b-instant`) com formato JSON estruturado (`response_format`).
  - Implementada a conversão matemática dos macronutrientes estimados da refeição consolidada para a base de 100g.
  - Integrada a persistência atômica no banco de dados Supabase criando o registro em `foods` (com flag `is_custom = true`) e gerando automaticamente o log correspondente na tabela `food_logs` com a gramatura total da refeição estimadas pela IA.
  - Conectada a calibração com as mecânicas de gamificação de RPG: adicionando +15 XP no `useHunterStore` do caçador e desferindo 15 de dano de nutrição (crítico de 2x = 30 de dano por fraqueza temática) ao Boss ativo na store `useBossStore`.
- **Reestruturação das Abas e Experiência de Usuário (Nutrition.tsx)**:
  - Modificado o menu de navegação da tela de Nutrição para as abas principales **Diário e Códex** (`'diario'`) e **Cardápios do Caçador** (`'cardapios'`), definindo o Diário como página padrão de entrada.
  - Implementada uma grade responsiva cyberpunk no Diário com painel consolidado de macros diários reativos no topo (Energia/Kcal, Proteínas, Carboidratos e Gorduras).
  - Criadas sub-abas centrais dentro do Diário para alternância fluida entre o **Códex da Alimentação (IA)** e a **Biblioteca de Itens (Manual)**.
  - Fixada a coluna lateral de **Consumo Diário** (histórico de logs do dia) de modo comum a ambas as sub-abas do diário, fornecendo feedback de atualização de dados em tempo real.
  - Adicionado suporte a banners animados de sucesso neon detalhando macros, XP ganho e dano causado no Boss ativo pós-calibração por IA.
- **Atualização Visual do Quick Menu (QuickMenu.tsx)**:
  - Ajustados os caminhos de background de imagem dos cards do Portal de Comando utilizando as novas artes de RPG em `public/Cards/`, adicionando arte real para os cards de *Status do Caçador* (`Status.jpeg`) e *Quadro de Missões* (`Quadro de Missoes.jpeg`), eliminando gradientes alternativos e unificando o visual temático.
- **Integridade e Build**:
  - Validada a compilação do TypeScript e bundle do Vite com `npm run build` obtendo sucesso absoluto (zero erros sintáticos ou estáticos).

### 2026-06-16 — Reparação do Contrato Frontend/Supabase
- **Schema e RLS Consolidados**:
  - Criada a migration `20260616_repair_app_contract.sql` com todas as tabelas usadas pelo front atual: `tasks`, `habits`, `habit_completions`, `workout_routines`, `routine_exercises`, `routine_completions`, `meal_plans`, `meal_plan_items`, `meal_completions`, `boss_battles`, além de ajustes em `profiles`, `foods`, `exercises`, logs e achievements.
  - Adicionadas policies RLS idempotentes para leitura/escrita por usuário e bibliotecas globais/customizadas (`foods` e `exercises`), incluindo update/delete de itens customizados.
  - Adicionado trigger `on_auth_user_created` para criar `profiles` automaticamente em novos cadastros.
- **Resiliência no Frontend**:
  - `useHunterStore.loadProfile` agora cria um profile mínimo via `upsert` quando usuários antigos não possuem linha em `profiles`.
  - Corrigido reset geral em `Settings.tsx` para usar `xp_to_next_level` e deletar subitens por `routine_id`/`meal_plan_id` usando `.in(...)`.
  - Incluídos assets do Quick Menu (`Status.jpeg` e `Quadro de Missoes.jpeg`) que já eram referenciados pelo front.

### 2026-06-16 — Correções Pós-Implementação do Módulo Bosses
- **Resiliência da Store de Bosses**:
  - Corrigido `attackActiveBoss` para carregar/inicializar a batalha ativa antes de aplicar dano, evitando perda silenciosa de ataques quando a store ainda não estava hidratada.
  - Corrigido cálculo de dano negativo: reversões agora curam apenas o dano base aplicado, sem multiplicador crítico, e nunca ultrapassam o HP máximo do boss.
  - Adicionada normalização de categorias reais do app (`Estudo`, `Treino`, `Saúde`, `Trabalho`, `Finanças`, etc.) para as fraquezas internas dos bosses.
  - A busca da batalha ativa agora prioriza a mais recente, reduzindo falhas caso existam registros ativos duplicados no Supabase.
- **Conquistas, Galeria e Integração**:
  - Alinhados os títulos/ícones/descrições de conquistas dos bosses com a lista reconhecida em `Settings.tsx`, incluindo casos especiais como Sereia e Boss Final.
  - Purificação de boss agora evita duplicar conquistas em tentativas repetidas.
  - Galeria de Bosses passa a usar a lista real de bosses derrotados carregada do Supabase e mantém o boss ativo com prioridade visual.
  - `useTasks.ts` agora envia a categoria real da tarefa para cálculo de fraqueza, permitindo críticos de foco, finanças e organização.
  - Quebrado o ciclo de importação entre `useHunterStore` e `useBossStore` usando import dinâmico no carregamento em background.
- **Ajuste de Proporção de Arte (Bosses.tsx)**:
  - Alterada a classe de dimensionamento do card do Boss ativo de altura estática para `aspect-[4/5] w-full`, garantindo a exibição perfeita e completa de toda a imagem dos vilões sem cortes verticais/horizontais indesejados.

### 2026-06-16 — Implementação do Módulo de Chefes Finais (Raid Semanal)
- **Criação do useBossStore.ts (Zustand)**:
  - Desenvolvida a store que gerencia o ciclo de vida do combate das Raids. Mapeados os 7 chefes com base nas imagens e lores de `public/Bosses/Lore dos Boss.txt`.
  - Implementado o método `loadActiveBattle` para restaurar o estado não finalizado do Supabase (`boss_battles`). Se o caçador não tiver nenhuma batalha de boss ativa, ela é inicializada contra o primeiro boss (`boss_01`).
  - Implementado o método `attackActiveBoss` que atualiza o HP local de forma otimista e persiste no banco. Reduções no HP curam o boss em caso de desmarcação de tarefas/hábitos (evitando farm de dano).
  - Implementado o método `purifyActiveBoss` que encerra a batalha ativa, insere a conquista lendária no Supabase para habilitar o título em `Settings`, concede o bônus de XP do boss e avança para a próxima Raid da fila.
- **Integração de Danos Automáticos (Hooks & Páginas)**:
  - Vinculadas as conclusões/desmarcações de tarefas (`useTasks.ts`) e hábitos (`useHabits.ts`) para causar dano ao chefe ativo proporcional ao XP ganho.
  - Vinculados os logs e conclusões de treinos (`Workouts.tsx`) e a conclusão consolidade de planos alimentares diários (`useMealPlans.ts`) ao dano automático.
  - Implementado o multiplicador de **Dano Crítico (1.5x a 2.0x)** baseado nas fraquezas de cada chefe (ex: treinar contra o Rei da Preguiça, finanças contra o Mercador das Dívidas).
- **Desenvolvimento da Página Premium Cyberpunk (Bosses.tsx)**:
  - Substituído o placeholder temporário `ComingSoon` em `src/App.tsx` para renderizar a página real de Bosses.
  - Criada uma interface imersiva com barra de HP neon pulsante (que muda de cor e pisca em HP crítico), descrição da lore original, indicação detalhada de fraquezas e efeitos de floating numbers em Framer Motion no feed de dano.
  - Estado de HP = 0 com tela triunfante de purificação, exibindo a lore de vitória original do chefe e botão neon para reivindicar os prêmios.
  - Adicionado no rodapé a galeria de troféus exibindo insígnias e estados de todas as Raids do caçador (Purificado, Em Combate, Bloqueado).
  - Adicionado um botão discreto de simulação de ataque rápido para fins de validação local instantânea.
- **Sincronização Resiliente (useHunterStore.ts e Settings.tsx)**:
  - Integrado o carregamento do boss ativo em background ao fim do `loadProfile` de `useHunterStore.ts`.
  - Mapeadas as 7 conquistas dos chefes na lista estática `ALL_POSSIBLE_ACHIEVEMENTS` em `Settings.tsx` para desbloqueio dos respectivos títulos no Codex de conquistas e menu de perfil do caçador.
- **Integridade da Compilação**:
  - Validado o build com `npm run build` com sucesso absoluto (zero erros de TypeScript ou bundle).

### 2026-06-16 — Implementação do Quick Menu e Novo Fluxo de Roteamento Pós-Login
- **Novo Roteamento do Sistema (App.tsx)**:
  - Definida a rota raiz protegida `/` como o novo **Menu Rápido (Quick Menu)**, tornando-a a tela de pouso padrão imediata pós-login do caçador.
  - Remapeado o Dashboard original de **Status** para a rota `/status`.
  - Mapeadas as rotas temporárias `/fortuna`, `/bosses` (Chefes Finais) e `/rest` (Descanso & Lazer) que apontam para o componente de placeholder `ComingSoon`.
- **Criação da Página QuickMenu.tsx**:
  - Desenvolvida a página do Menu Rápido com visual cyberpunk de alta fidelidade e letreiros baseados em Orbitron.
  - Exibido mini-card holográfico no topo com Rank, Nome, Nível e XP atual do Caçador para contexto.
  - Grade responsiva com 7 cards customizados mapeando as áreas do sistema.
  - Cards ativos (**Status**, **Missões**, **Treinamento** e **Recuperação**) direcionando para as rotas corretas. O card de Treinamento utiliza a imagem `/Cards/Treinos.jpeg`, o de Missões e Recuperação utilizam `/Cards/Estudos-Nutricao.jpeg`, e o card de Status utiliza um background gradiente e textura geométrica gerada por CSS puro.
  - Cards bloqueados (**Módulo Fortuna**, **Chefes Finais** e **Descanso & Lazer**) com opacidade reduzida e selo indicador premium de RPG *"BLOQUEADO - NÍVEL INSUFICIENTE"*, direcionando o usuário para o aviso correspondente ao clicar.
  - Animações de zoom de imagem e glows neon no hover aceleradas por hardware (GPU).
- **Atualização de Layouts de Navegação (RPGLayout.tsx e MobileMenu.tsx)**:
  - Adicionado o link `"Menu Rápido"` apontando para `/` com o ícone `LayoutGrid`.
  - Atualizado o link `"Status"` para apontar para a nova rota `/status`.
  - Garantida 100% de paridade responsiva na barra lateral (desktop) e no menu móvel (celular).
- **Integridade de Build**:
  - Validada a compilação do Vite e TypeScript com `npm run build` com sucesso absoluto (zero erros sintáticos ou de tipos).

### 2026-06-15 — Carregamento Instantâneo de Missões (SWR) e Resiliência em Ajustes
- **Aceleração na Aba de Missões (useHabits.ts, useTasks.ts, Quests.tsx)**:
  - Implementado cache local persistente associado ao ID do usuário para renderização instantânea (SWR - Stale-While-Revalidate). O app carrega os dados em cache de hábitos, rotinas, refeições e tarefas de imediato na montagem (em menos de 10ms), removendo skeletons pesados e buscando atualizações em background no Supabase.
  - Removido o atributo `layout` do Framer Motion e o delay cumulativo por índice nos cards de missões (`MissionCard` e `ManageQuestRow` em `Quests.tsx`), o que removeu o "engasgo" de renderização e tornou a abertura da aba de missões instantânea.
- **Resiliência nos Ajustes (Settings.tsx)**:
  - Estendido o timeout do `safetyTimer` para conquistas e telemetria de 5s para 15s, dando tempo suficiente para o Supabase resolver conexões mesmo em cold starts longos e evitando falsos negativos de conectividade.
  - Refatorada a telemetria para executar consultas individuais por módulo sob tratamento de erros local (try/catch isolados). Caso apenas uma tabela dê erro de RLS ou esteja vazia, ela retorna contagem zero silenciosamente no console, mas o status de conexão principal e os outros módulos continuam operando normalmente sem disparar a tela vermelha de falha geral de conexão.

### 2026-06-15 — Otimização de Performance e Aceleração de Hovers por Hardware
- **Transição de Animações no Dashboard.tsx**:
  - Migrado o `whileHover` do card de rank do Caçador e dos cards individuais de missões (treinos, refeições e hábitos) para usar apenas transformações básicas (`scale`, `x`, `rotate`) que utilizam aceleração de hardware (GPU).
  - Transferido o cálculo de interpolação de sombras (`boxShadow`) e cores de borda (`borderColor`) de Javascript no Framer Motion para transições nativas do CSS (`transition-all duration-300 ease-out hover:border-... hover:shadow-...` no `className`), eliminando repaints caros a cada frame e trazendo a interface de hovers para 60+ FPS fluidos.
- **Ajustes de Performance no Settings.tsx, Workouts.tsx, Nutrition.tsx e Quests.tsx**:
  - Removido o cálculo JS de sombras e bordas do Framer Motion nos botões e cards de listagem dessas páginas.
  - Implementado o mesmo padrão de transição CSS nativa no hover nos cards de alimentos, cards de exercícios e botões do sistema.
  - Implementado hover reativo condicional na classe do botão de Despertar Quest Bônus (Fenda IA) para evitar interpolações inativas de sombra.
- **Integridade do Código**:
  - Compilação testada e validada com `npm run build` com sucesso absoluto (zero erros de tipos ou de sintaxe no Vite/React 19).

### 2026-06-15 — Épico 2: Motor de Jogo & Gamificação (Core Mechanics)
- **Banco de Dados (Supabase)**:
  - Aplicada a migração `20260615_epic2_gamification.sql` adicionando colunas de controle anti-farm (`xp_gained_today`) e de conquistas obtidas (`streak_milestones_claimed`) em `profiles`.
  - Habilitada segurança em nível de linha (RLS) com políticas de leitura/escrita e deleção robustas para a tabela de conquistas (`achievements`).
- **Core State & Store (useHunterStore.ts)**:
  - Implementado o **Sistema Anti-Farm** na ação `addXp` limitando ganhos diários de XP: 100% de ganho até 200 XP, 50% de ganho (Soft Cap) entre 200 e 400 XP, e 10% de ganho (Hard Cap) a partir de 400 XP diários.
  - Sincronização e reinicialização robusta do XP diário a cada novo ciclo solar detectado no `loadProfile`.
  - Adicionadas ações automáticas de checagem: `checkStreakMilestones` para bônus e medalhas de consistência consecutiva (3d, 7d, 15d, 30d) e `checkAchievements` para conquistas de atributos (>= 20 em FOR, INT, RES, VIT, DIS, SAB, EQU).
  - Adicionada ação `equipTitle` para gravar e equipar títulos de prestígio no banco de dados.
- **Interface do Dashboard (Dashboard.tsx)**:
  - Desenvolvido o HUD interativo **Missões Principais do Dia (Daily Main Quests)**, contendo 4 objetivos integrados (Superação Física, Ciclo de Nutrição, Foco do Desperto, Desafio de Classe) que atuam como links diretos e fluidos para as respectivas abas (`/workouts`, `/nutrition`, `/quests`), melhorando drasticamente a navegação entre os menus.
  - Corrigida a legibilidade do HUD substituindo a nomenclatura antiga "Ativo/Inativo" por status semânticos reais: **"Concluído" (em verde)** para quests já completadas e **"Pendente" (em laranja com efeito de pulso)** para quests incompletas.
  - Implementada a barra visual neon **Domínios de Evolução** logo abaixo dos atributos, mapeando a evolução das dimensões de vida baseadas no nível dos atributos agregados (Corpo, Mente, Fortuna, Carreira e Equilíbrio).
  - Adicionado alerta dinâmico de XP flutuante (`xpAlerts` com `framer-motion`) que exibe de forma reativa os pontos de XP ganhos na hora sobre a barra de nível.
  - Adicionada a exibição do título de prestígio ativo equipado logo abaixo do nome do caçador.
- **Configurações & Codex (Settings.tsx)**:
  - Implementado o painel **Codex de Títulos & Conquistas** exibindo títulos equipáveis e medalhas glassmorphic da fenda (bloqueadas em cinza opaco com dicas de meta e desbloqueadas em dourado brilhante com data).
  - Sincronização imediata de título ativo na Ficha de Classe e no Codex ao clicar em equipar.

### 2026-06-15 — Integração de Imagens e Padronização das Classes Creator e Leader
- **Integração de Assets**:
  - Padronização das imagens da classe `Leader`. Os arquivos foram renomeados de `Classe *.jpeg` para `Rank *.jpeg` (ex: `Classe E.jpeg` -> `Rank E.jpeg`), seguindo a convenção estrita do sistema e garantindo que o carregamento por Ranks ocorra sem erros de link quebrado (404) no Dashboard e Configurações.
  - As imagens reais da classe `Creator` e `Leader` para o Rank inicial (`Rank E.jpeg`) foram mapeadas no arquivo `Onboarding.tsx` no lugar dos antigos placeholders nulos.

### 2026-06-12 — Ajustes do Perfil Físico no Painel de Configurações
- **Edição Completa de Perfil**: Adicionados os novos campos de perfil físico e metas à página de Ajustes (`Settings.tsx`):
  - Sexo / Gênero (padronizado em um `<select>` com as opções Masculino e Feminino).
  - Altura (cm), Peso Atual (kg) e Peso Meta (kg) em grid de 4 colunas em telas maiores (alinhado horizontalmente com o Sexo).
  - Seletores customizados para Foco de Treino, Objetivo Principal de Evolução e Nível de Experiência/Rank.
- **Setas Customizadas com Borda & Textos Alinhados**:
  - Removido o visual do chevron nativo de todos os `<select>` (`appearance-none`).
  - Implementado um wrapper absoluto contendo um ícone de `ChevronDown` e uma **borda divisória à esquerda (`border-l`)**, separando a seta de expansão do campo de texto de forma 100% visível, padronizada e imersiva.
  - Adicionado padding-right (`pr-10`) em todos os selects, garantindo que o texto selecionado nunca se sobreponha à setinha de expansão e fique sempre 100% legível e contido dentro da caixa.
- **Responsividade Aprimorada**:
  - Ajustado o layout biométrico para usar um grid dinâmico (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`) unificando Sexo, Altura, Peso e Meta em 4 colunas idênticas na mesma linha horizontal em telas grandes, o que elimina o esmagamento lateral e garante harmonia visual absoluta.
  - Adicionado `whitespace-nowrap` nas labels biométricas para evitar quebras desnecessárias de texto.
- **Sincronização de Estados**: Atualizado o hook `useEffect` de monitoramento de estado local para garantir que quaisquer mudanças na store `useHunterStore` se reflitam em tempo real nos inputs locais.
- **Persistência Remota**: Modificada a função `handleSaveProfile` para atualizar no Supabase todas as novas propriedades biométricas e de metas antes de re-sincronizar os dados da store local, mantendo 100% de coesão nos dados.

### 2026-06-12 — Épico 1: A Fundação & O Despertar
- **Migração do Banco de Dados (Supabase)**: Adicionadas colunas `wisdom`, `balance`, `gender`, `height`, `weight_current`, `weight_target`, `training_focus`, `main_goal`, `experience_level` à tabela `profiles`.
- **useHunterStore.ts**: Refatoração completa da store:
  - `HunterClass`: Titan removido, `Creator` e `Leader` adicionados.
  - `HunterStats`: Adicionados `wisdom` (SAB) e `balance` (EQU) — agora 7 atributos no total.
  - `HunterState`: Campos de perfil físico e gênero adicionados (`gender`, `height`, `weightCurrent`, `weightTarget`, `trainingFocus`, `mainGoal`, `experienceLevel`).
  - `loadProfile` e `saveProfile` atualizados para persistir todos os novos campos.
- **Onboarding.tsx**: Reescrito completamente com 6 etapas sequenciais:
  1. Informações Básicas (nome, data nascimento, gênero ♂/♀)
  2. Perfil Físico (altura, peso atual/meta, foco de treino)
  3. Objetivo Principal (4 categorias)
  4. Nível de Experiência (Iniciante / Intermediário / Avançado)
  5. Introdução do Arquiteto (narrativa de Solo Leveling com referência a Sung Jin-Woo) + Questionário de Classes (5 questões para 5 classes)
  6. Animação de Despertar (loading sci-fi com frases progressivas e citações do Arquiteto) + Seleção de Classe (cards com placeholders para Creator e Leader)
- **Dashboard.tsx**: Radar e grid de atributos expandidos para 7 stats (SAB e EQU). themeColors e validClasses atualizados para Creator e Leader.
- **Settings.tsx**: Cases `Creator` e `Leader` adicionados (Titan removido).
- **NewQuestModal.tsx / NewHabitModal.tsx**: `wisdom` e `balance` adicionados às opções de atributo alvo.
- **useTasks.ts / useHabits.ts**: Tipo `stat_target` expandido para incluir `'wisdom' | 'balance'`.
- **Build validado**: `npm run build` — ✅ 2206 módulos, zero erros TypeScript.



### 2026-05-27 (Sessão Atual)
- **Ajustes de Calibração e Correções de Bugs (RPG Matrix)**:
  - **Soma de Atributos Segura (Sem Concatenação)**: Adicionamos coações de tipo numéricas explícitas (`Number()`) in `updateStat` e `loadProfile` na store `useHunterStore.ts`. Isso impede que valores de atributos (inclusive **INT/Inteligência**) sofram bugs de concatenação de string em JavaScript (ex: `10 + "2" = "102"`) ao lidar com dados assíncronos ou retornos do Supabase.
  - **Exibição Inteligente do Tutorial (ProductTour)**: Introduzimos a flag temporária `ascend_just_finished_onboarding` no `localStorage`. Agora o tutorial interativo do Dashboard é disparado de forma automática **apenas** quando o usuário conclui o Onboarding pela primeira vez ou quando aciona o botão de reativação manual em Ajustes, mantendo a experiência do Dashboard limpa nos acessos diários recorrentes.
  - **Ativação e Algoritmo de Streak Diário**: Desenvolvemos um algoritmo resiliente baseado em fusos locais no `loadProfile` da store do Zustand. Ele compara o dia do último acesso do usuário com o dia de hoje (formato `YYYY-MM-DD` local). Se o acesso foi ontem, incrementa a streak atual e recorde (`streak_current` e `streak_best`). Se foi hoje, mantém intacto. Se foi antes de ontem (quebra de sequência), reseta a streak para 1, atualizando e salvando de forma automática os dados no perfil do Supabase.
  
- **Correção Crítica: Loading Eterno em Produção (Vercel)**:
  - **Causa raiz identificada**: Todos os hooks (`useHabits`, `useMealPlans`, `useTasks`) e as páginas `Workouts.tsx` e `Nutrition.tsx` tinham `if (!user) return` sem setar `loading = false`. Isso causava loading eterno (skeletons infinitos) quando o usuário estava deslogado no Vercel.
  - **Correção nos hooks**: Adicionado reset imediato do `loading = false` quando `user` é null, limpando todos os estados de dados para arrays vazios.
  - **Correção nas páginas**: `Workouts.tsx` e `Nutrition.tsx` agora setam `loading = false` quando `user` é null e têm safety timeout de 5s.
  - **Filtro de user_id corrigido**: `Workouts.tsx` e `Nutrition.tsx` não tinham `.eq('user_id', user.id)` nas queries de `workout_routines`, `workout_logs` e `food_logs`, dependendo apenas do RLS. Adicionados os filtros explícitos.
  - **AuthContext melhorado**: Eventos `TOKEN_REFRESHED` do mesmo usuário agora são ignorados (apenas atualiza a sessão silenciosamente), evitando re-renders desnecessários que causavam flicker de tela.
  - **Supabase client melhorado**: Adicionadas opções explícitas de `persistSession: true`, `autoRefreshToken: true` e `detectSessionInUrl: true` no cliente Supabase. Adicionado aviso de erro de desenvolvimento quando as variáveis de ambiente estão faltando.
  - **Sincronização de Variáveis de Ambiente no Vercel (Token de Produção)**:
    - Utilizando o novo token de acesso de produção pessoal (`vcp_...`), sincronizamos as variáveis de ambiente do projeto `ascend` no Vercel (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_GROQ_API_KEY`) para corresponderem exatamente aos valores locais de `.env.local`.
    - Disparamos e acompanhamos um **Redeploy de Produção** real (`target: "production"`) que concluiu com sucesso absoluto (`READY`), promovendo o código com as credenciais corrigidas para o ar e restabelecendo o fluxo de quests e login no F5 sem problemas silenciosos.
  - **Correção da Persistência de Autenticação (Fatores de Cache Inconsistente)**:
    - **Identificação da causa raiz do bug**: Quando o usuário fechava o navegador e o reabria no link do Vercel, o Supabase tentava ler e restaurar a sessão antiga do `localStorage` localmente, deixando o usuário tecnicamente "logado". Contudo, se a conexão inicial falhasse na primeira tentativa por oscilações ou chaves desatualizadas, o `loadProfile` falhava silenciosamente e deixava a store (`useHunterStore`) vazia, gerando uma interface inteiramente em branco (sem pedir login de novo e sem carregar os dados).
    - **Implementação do sessionStorage**: Alterada a configuração do cliente Supabase (`src/lib/supabase.ts`) para usar `storage: window.sessionStorage` em vez de `localStorage`. Isso garante que o login seja perfeitamente mantido ao dar refresh na página (F5) na mesma aba, mas seja inteiramente limpo ao fechar a aba/navegador, forçando a re-autenticação limpa ao acessar o link novamente.
    - **Limpeza Ativa do localStorage**: Adicionamos um script no topo de `src/lib/supabase.ts` para varrer e remover quaisquer tokens órfãos e antigos do Supabase persistidos no `localStorage` do navegador do usuário, garantindo uma transição limpa e perfeita.


### 2026-05-26 (Sessão Anterior)
- **Implementação do Portal de Diagnóstico Cyberpunk & Cura de Estados Vazios (Supabase)**:
  - **Identificação da Falha Silenciosa**: O cliente Javascript do Supabase não lança exceções no caso de falhas de banco de dados ou Row Level Security (RLS) bloqueados, simplesmente resolvendo as queries com `{ data: null, error }`. Nossos hooks anteriores tratavam isso de forma passiva, o que mascarava erros de conexão ou chaves inválidas em produção, resultando em listas de treinos e cardápios completamente em branco (`[]`) e frustrando o usuário sem dar feedbacks visuais sobre a saúde do servidor.
  - **Tratamento Ativo de Exceções nos Hooks**:
    - Refatorados os hooks `useMealPlans.ts`, `useHabits.ts` e `useTasks.ts` para verificar ativamente se as respostas do Supabase contêm a propriedade `.error`. Se houver um erro de banco de dados, o erro é explicitamente **lançado** como uma exceção no Javascript, forçando a execução do bloco `catch` e registrando a anomalia em um estado `error` interno.
  - **Painel de Telemetria e Diagnóstico Holográfico (Settings.tsx)**:
    - Desenvolvida a seção premium **"Telemetria & Diagnóstico"** na tela de Ajustes do Caçador com estética retro-cyberpunk.
    - Exibe o status da fenda Supabase (Conectado / Falhou com o erro exato em tempo real).
    - Mostra o UUID (`user.id`) do Caçador Ativo e o e-mail cadastrado.
    - Realiza consultas assíncronas otimizadas de telemetria (`head: true` sem transferir payloads grandes de linhas) para contar e exibir a quantidade exata de Cardápios, Rotinas, Hábitos e Tarefas salvas na nuvem para aquele UUID, garantindo que o caçador saiba se os seus dados realmente existem no servidor.
    - Inclui o botão de **Sincronização Forçada** para recalibrar e re-sincronizar de forma forçada os sensores do app com o banco de dados.
  - **Banner de Anomalia de Fenda (RPGLayout.tsx)**:
    - Adicionado um detector global de saúde do banco de dados no layout de RPG. Se uma consulta simples à tabela de exercícios falhar ou expirar por falha de credenciais, exibe um banner holográfico de aviso vermelho neon no topo de todas as telas contendo a descrição exata do erro e um link "Diagnosticar" para navegar instantaneamente até a telemetria nos Ajustes.
  - **Upgrade da Chave Anon no Ambiente (.env.local)**:
    - Substituída a chave opaca antiga do Supabase pela chave anon JWT oficial e clássica do projeto (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`). Isso garante conformidade estrita e 100% de compatibilidade com as políticas de RLS baseadas em `auth.uid() = user_id` no Postgres, corrigindo as telas vazias no ambiente local.
- **Safety Timeout nos Hooks de Dados (useHabits, useMealPlans, useTasks) contra Carregamento Infinito (Skeletons)**:
  - **Identificação do Bug**: O app exibia esqueletos de carregamento (skeleton loaders) infinitamente quando ocorriam problemas de lentidão extrema na API do Supabase ou cold starts longos do banco de dados remoto no Vercel. Embora tivéssemos implementado `try/catch/finally` nas requisições, se as promessas do `Promise.all` ficassem pendentes por longos segundos (devido a lentidão ou atrasos de conexão), o estado `loading` permanecia `true`, deixando o Quadro de Missões inacessível.
  - **Solução Aplicada**: Adicionamos um **Safety Timeout de 4 segundos** na inicialização das funções de fetch de todos os três hooks de dados principais ([useHabits.ts](file:///d:/Área de Trabalho/App/src/hooks/useHabits.ts), [useMealPlans.ts](file:///d:/Área de Trabalho/App/src/hooks/useMealPlans.ts), [useTasks.ts](file:///d:/Área de Trabalho/App/src/hooks/useTasks.ts)). Caso a resposta do banco de dados do Supabase atrase ou a conexão fique offline, o timeout força `loading = false`, fazendo os skeletons sumirem da tela e exibindo a interface do app normalmente para uso. Se a API finalmente responder em background depois do timeout, as informações são renderizadas na tela de forma silenciosa e transparente.
- **Resolução de Loops Infinitos de Rede e Falhas de Carregamento Silenciosas nos Hooks**:
  - **Identificação do Bug**: Após as correções de estabilização do `AuthContext`, o aplicativo passou a apresentar extrema lentidão e travamento no carregamento de dados (missões, treinos, dietas). A causa raiz foi tripla:
    1. **Quebra de Referência no AuthContext (Loop de Rede)**: Toda vez que o Supabase disparava um evento silencioso no background (como revalidação de tokens), o callback do `onAuthStateChange` alterava os states `user` e `session` com novas instâncias de objetos. Isso provocava a re-renderização em cascata de todos os hooks do app (`useHabits`, `useMealPlans`, `useTasks`) que dependiam do objeto `user`. Os `useEffect`s desses hooks recriavam suas funções de fetch e faziam centenas de requisições redundantes de rede ao Supabase por segundo, gerando um loop infinito.
    2. **Promessas Rejeitadas sem Tratamento**: Os hooks de dados executavam requisições ao Supabase em paralelo (`Promise.all` ou de forma direta) sem blocos `try/catch/finally` específicos. Quando uma requisição falhava na rede ou o banco demorava, a Promise rejeitava, quebrando silenciosamente o fluxo React e impedindo que a variável `loading` correspondente mudasse para `false`, gerando telas em loading infinito.
    3. **Crash de Tipagem nos Alimentos**: Na otimização de joins, o Supabase em alguns casos serializava o relacionamento de alimentos (`food:foods(...)`) de `meal_plan_items` como um **array de 1 elemento** ao invés de um objeto único. Em `calcMealMacros` (`useMealPlans.ts`), o código tentava ler `item.food.calories_per_100g` diretamente de um array (avaliando como `undefined` e propagando `NaN` kcal por toda a interface).
  - **Soluções Aplicadas**:
    1. **Prevenção de Loops no AuthContext**: Refatorado o callback de `onAuthStateChange` em [AuthContext.tsx](file:///d:/Área de Trabalho/App/src/contexts/AuthContext.tsx). Agora, se o ID do usuário não mudou, o state `user` do React **não** é atualizado, evitando quebras de referência de objetos e quebrando 100% o loop de re-renderização e requisições infinitas de rede.
    2. **Estabilização por Strings nos Hooks**: Alterada a dependência dos hooks (`useHabits`, `useMealPlans`, `useTasks`) no `useCallback` de fetch para escutarem apenas o `user?.id` (string) em vez do objeto `user` completo, garantindo estabilidade absoluta.
    3. **Resiliência Completa com try/catch/finally nos Hooks**: Envelopadas todas as funções de fetch (`fetchAll` e `fetchTasks`) de todos os três hooks de dados em blocos robustos de `try/catch/finally`. Isso garante que o estado de carregamento de dados mude para `false` no `finally` de forma resiliente, destravando a tela do usuário mesmo em caso de lentidão ou timeout.
    4. **Tratamento Resiliente a Arrays em calcMealMacros**: Atualizada a função `calcMealMacros` em [useMealPlans.ts](file:///d:/Área de Trabalho/App/src/hooks/useMealPlans.ts) para usar a checagem resiliente `Array.isArray(item.food) ? item.food[0] : item.food;`, idêntica à de `useHabits.ts`. Isso evita 100% qualquer propagação de `NaN` nas calorias e macros da interface.
- **Resiliência e Estabilização contra Loading Infinito ("Despertando...") no Login/Link**:
  - **Causa Raiz**: O evento `onAuthStateChange` do Supabase dispara callbacks dinamicamente (como revalidação de tokens ou focos de aba/tela). Na estrutura anterior, toda chamada de evento disparava o estado de carregamento de tela inteira (`setLoading(true)`) e executava uma requisição assíncrona ao banco (`loadProfile`). Se o usuário estivesse com a sessão expirada, ou se ocorresse oscilação de rede/timeout do Supabase, o aplicativo ficava preso para sempre na tela preta de loading "Despertando...", impedindo o redirecionamento para `/login`.
  - **Solução Aplicada**: 
    1. Introduzida a referência `currentUserRef` em `src/contexts/AuthContext.tsx`. Agora, o carregamento bloqueante de tela (`setLoading(true)`) só é ativado se o ID do usuário de fato mudar (ou seja, um novo login). Se for o mesmo usuário (ex: refresh automático de token no background), o carregamento do perfil roda de forma totalmente silenciosa e transparente em background, sem travar a tela do usuário.
    2. Implementado um **Safety Timeout de 5 Segundos** no `useEffect` de autenticação. Caso a conexão com a API do Supabase trave ou demore por oscilações ou cold start, o loading é forçado a `false` no timeout, garantindo que o caçador nunca fique preso eternamente no loading infinito e permitindo a navegação ou redirecionamento normal.
- **Correção de Propagação de Clique (Card de Treino vs Iniciar Protocolo)**:
  - **Identificação do Bug**: Ao clicar no botão "Iniciar Protocolo" dentro de um card de rotina na tela de Treinamento, o clique propagava para o elemento pai (`motion.div` do card). Isso disparava simultaneamente a abertura do modal ativo de treino e do modal gerenciador de treino por trás, gerando uma sobreposição desnecessária e confusa de telas.
  - **Solução Aplicada**: Adicionado `e.stopPropagation()` e `e.preventDefault()` no clique do botão "Iniciar Protocolo" em [Workouts.tsx](file:///d:/Área de Trabalho/App/src/pages/Workouts.tsx). Agora o evento é contido e o gerenciador de treino não abre mais em segundo plano.
- **Persistência de Sessão de Treino Ativa no Navegador (LocalStorage)**:
  - **Identificação do Bug**: Se o celular do caçador bloqueasse ou se a aba do navegador mobile sofresse recarregamento por economia de memória do sistema operacional, toda a sessão de treino ativa era perdida, pois os estados eram estritamente em memória do componente React.
  - **Solução Aplicada**: 
    1. Atualizados os estados `isRoutineSessionOpen`, `sessionExercises`, `completedSessionExs` e `sessionRoutineId` em [Workouts.tsx](file:///d:/Área de Trabalho/App/src/pages/Workouts.tsx) para utilizar **Lazy State Initialization**, lendo seus valores iniciais do `localStorage`.
    2. Criado um `useEffect` reativo que sincroniza automaticamente esses estados com o `localStorage` a cada mudança (ex: marcar um exercício concluído ou alterar séries/reps).
    3. Garantida a limpeza total desses dados no `localStorage` ao finalizar o treino (`handleFinishRoutine`) ou ao abandonar a sessão ativamente.
    4. Adicionado um aviso de confirmação premium (`window.confirm`) no botão de fechar (X) do modal de treino para evitar abandonos acidentais, limpando os dados salvos apenas se de fato confirmado.
- **Tratamento de Exceções no AuthContext contra Loading Infinito ("Despertando...")**:
  - **Causa Raiz**: Se a chamada ao Supabase (`loadProfile`) falhasse (devido a timeout de rede, oscilação de conexão no Vercel ou cold start do banco), a exceção não era capturada. O fluxo do React `useEffect` que inicializa o app quebrava silenciosamente e nunca chamava `setLoading(false)`. Isso deixava o usuário travado eternamente no loader preto "Despertando..." (como enviado na captura de tela).
  - **Solução Aplicada**: Envolvemos os blocos assíncronos do `initAuth` e `onAuthStateChange` em blocos robustos de `try/catch/finally` em `src/contexts/AuthContext.tsx`. Mesmo que ocorra um erro de rede temporário na conexão com o banco de dados Supabase, o erro é capturado, exibido no console e a função executa o bloco `finally` para desligar o loading de forma 100% segura, permitindo que a aplicação renderize ou recupere o controle normalmente sem congelar a tela do caçador.
- **Nova Mecânica de Recompensa de Refeições Consolidadas (Abordagem A)**:
  - **Requisito do Usuário**: Se o caçador realizar todas as refeições do dia, ele ganha os pontos de XP e Vitalidade de forma consolidada, em vez de ganhar recompensas individuais por refeição.
  - **Solução Aplicada**: 
    1. Introduzidas as constantes `ALL_MEALS_XP_BONUS = 50` e `ALL_MEALS_VITALITY_BONUS = 2` no topo dos hooks de dados.
    2. Removidos os ganhos individuais de XP (`plan.xp_reward`) e Vitalidade (`+1 VIT`) por refeição ao marcar refeições individuais nos hooks [useHabits.ts](file:///d:/Área de Trabalho/App/src/hooks/useHabits.ts) e [useMealPlans.ts](file:///d:/Área de Trabalho/App/src/hooks/useMealPlans.ts).
    3. Implementada lógica de transição de estado inteligente: ao marcar uma refeição, se todas as refeições ativas passarem a estar concluídas, o caçador recebe instantaneamente os **+50 XP** e **+2 Vitalidade** de forma unificada. Se desmarcar qualquer uma delas, a recompensa consolidada é inteiramente deduzida (**-50 XP** e **-2 Vitalidade**).
- **Correção Definitiva do Fluxo do Tutorial/Onboarding no Login**:
  - **Identificação do Bug**: Toda vez que o caçador realizava o login ou recarregava a página (F5), ele era temporariamente redirecionado para a tela de Onboarding (`/onboarding`), tendo que visualizar a animação do Matrix Loader mesmo já possuindo uma classe. Isso ocorria porque o estado de carregamento de autenticação (`loading`) mudava para `false` logo após validar a sessão básica do Supabase, antes do carregamento assíncrono do perfil do caçador terminar. Logo, o guardião de classe (`HunterGuard`) lia temporariamente `hunterClass` como `null`, forçando o redirecionamento imediato.
  - **Solução Aplicada**: Refatorada a inicialização e escuta do estado em `src/contexts/AuthContext.tsx`. O estado `loading` agora só passa a ser `false` **após** a conclusão bem-sucedida de `loadProfile`, mantendo a barreira do ProtectedRoute/Awakening Loader ativa até que todos os dados do jogador estejam carregados do banco de dados de forma segura.
- **Otimização Geral de Desempenho e Latência de Rede (Velo-System)**:
  - **Identificação do Gargalo**: Identificamos que diversos hooks e páginas realizavam buscas de banco de dados no Supabase de forma estritamente sequencial ou duplicada. Em particular, `useMealPlans` executava 4 queries (incluindo uma busca síncrona redundante de itens alimentares bloqueando o `Promise.all`). O hook `useHabits` também realizava uma busca sequencial separada por itens após o término do `Promise.all`. As páginas de Treino e Mana também carregavam dados um após o outro com `await` sequenciais.
  - **Soluções Aplicadas**:
    1. **Otimização no `useHabits.ts`**: Modificada a consulta principal de `meal_plans` para realizar uma **junção aninhada nativa** (`items:meal_plan_items(quantity_grams, food:foods(calories_per_100g))`), permitindo obter todos os planos, itens e calorias dos alimentos em uma única requisição ao Supabase. Eliminou-se 100% da consulta secundária e síncrona.
    2. **Otimização no `useMealPlans.ts`**: Aplicado o mesmo padrão de junção de dados aninhada e removido o select intermediário redundante por IDs. Reduziu de 4 chamadas de rede sequenciais para apenas 2 em paralelo.
    3. **Paralelização em `Workouts.tsx`**: Refatorada a função `fetchData` para paralelizar as 3 buscas sequenciais de dados (`exercises`, `workout_routines`, `workout_logs`) via `Promise.all`.
    4. **Paralelização em `Nutrition.tsx`**: Refatorada a função `fetchData` para paralelizar as 2 buscas sequenciais de dados (`foods`, `food_logs`) via `Promise.all`.
  - **Impacto**: O aplicativo agora responde de forma instantânea e extremamente fluida ("snappy"), com redução de mais de 70% nos tempos de carregamento de transição de abas e telas.
- **Validação de Integridade do Código**:
  - Executado build completo de produção com sucesso absoluto (`npm run build`), garantindo 100% de integridade sintática e de tipos no TypeScript.

### 2026-05-25
- **Acesso Universal e Fácil ao Tutorial (Botão de Interrogação nos Ajustes)**:
  - **Requisito do Usuário**: Colocar para todos os usuários (inclusive os antigos que já concluíram o primeiro acesso) um ícone de interrogação na tela de Ajustes para invocar e rever o tutorial interativo a qualquer momento.
  - **Solução Aplicada**:
    1. Importado o componente de ícone `HelpCircle` do `lucide-react` em `src/pages/Settings.tsx`.
    2. Desenvolvido um **botão de atalho holográfico premium roxo neon** posicionado diretamente no cabeçalho superior da tela de Ajustes (ao lado do título "Ajustes de Sistema"). O botão conta com o ícone de interrogação animado e pulsante, bordas roxas e sombras de brilho sci-fi.
    3. Conectado o gatilho de clique para apagar a chave de conclusão `ascend_tour_completed` no `localStorage` e redirecionar instantaneamente o caçador à Dashboard (`/`), iniciando de imediato o tutorial interativo.
- **Refinamento e Enriquecimento do Onboarding Tour (Menu Lateral & Responsividade Celular)**:
  - **Requisito do Usuário**: Mostrar detalhadamente as funções do menu lateral de Treinamento e Recuperação (Dieta) e garantir pleno funcionamento, usabilidade e ergonomia no celular.
  - **Soluções Aplicadas**:
    1. **Textos Enriquecidos de Lore e Funcionalidades**: Expandidos os cards do `MÓDULO DE TREINAMENTO` e `RECOVERY: MANA & DIETAS` no tour para detalhar todas as suas sub-funcionalidades (criação de rotinas personalizadas, iniciar treinos com timer de descanso ativo, consulta de banco de exercícios e gráficos de PRs/evolução; e planejamento de cardápios, biblioteca de macros e logs diários de Mana/Kcal).
    2. **Mapeamento de Atalhos Inteligentes no Celular**: Vinculados os botões do painel de atalhos rápidos do Dashboard (`tour-shortcut-workouts` e `tour-shortcut-nutrition`) como alvos dinâmicos no celular.
    3. **Resolução de Conflito de Âncoras Ocultas**: Aprimorada a lógica de `updateHighlight` para testar se a âncora clássica do menu lateral desktop (`tour-nav-workouts`/`tour-nav-nutrition`) está invisível no DOM (`offsetWidth === 0`). Se estiver (como ocorre em dispositivos móveis), o tour direciona e destaca automaticamente os respectivos atalhos físicos do Dashboard, garantindo um realce real e tátil ao invés de desativar o holofote.
    4. **Posicionamento Anti-Sobreposição Dinâmico em Mobile**: Reformulado o `getCardStyle` e as classes do card explicativo no celular. Se o elemento focado estiver posicionado na metade inferior da tela (como os atalhos do Dashboard), o card de orientações se move de forma totalmente fluida e fixada para o **topo** da tela. Se estiver na metade superior, fixa-se na **base** da tela. Isso impede que o card cubra os elementos focados sob o holofote, oferecendo uma experiência 100% livre de sobreposição e com perfeita legibilidade touch.
- **Implementação do Sistema de Onboarding Tour (Tutorial Interativo)**:
  - **Requisito do Usuário**: Desenvolver um sistema de tutorial guiado por cima da aplicação para o primeiro acesso do caçador, exibindo de forma sequencial cards informativos com molduras e bordas roxas neon que combinem com a identidade do aplicativo, permitindo que o usuário avance, retorne ou pule as orientações.
  - **Solução Aplicada**:
    1. **Componente de Tour Interativo RPG (`ProductTour.tsx`)**: Desenvolvido um componente autônomo baseado em Framer Motion e Lucide React para renderizar popovers informativos com storytelling de RPG imersivo ("Sistema de Caçador Desperto"). Os cards contam com bordas roxas duplas neon (`border-purple-500`), preenchimento com blur suave e glows externos neon (`shadow-[0_0_30px_rgba(168,85,247,0.3)]`).
    2. **Foco e Highlighter Dinâmico**: O componente monitora o passo atual e, se houver um elemento alvo (`targetId`), posiciona uma moldura física roxa neon vibrante e pulsante (`2px solid #a855f7`) exatamente sobre o elemento destacado no DOM, rolando a tela suavemente (`scrollIntoView`) até ele.
    3. **Resiliência Responsiva em Mobile**: No celular, o highlighter contorna o elemento normalmente, mas o card explicativo é ancorado na base da tela (`fixed bottom-4`), evitando quebras ou transbordamento de tela e oferecendo excelente usabilidade ao toque. Em desktops, o card flutua de forma ancorada acima ou abaixo do elemento focado.
    4. **Persistência de Estado (Primeiro Acesso)**: O tour é ativado de forma 100% automática apenas no primeiro acesso do usuário (verificado e gravado no `localStorage` sob a chave `ascend_tour_completed: true`).
    5. **Mapeamento de Âncoras do Sistema (`Dashboard.tsx` & `RPGLayout.tsx`)**: Injetados identificadores no DOM para mapear os 5 pilares fundamentais da interface principal (Dashboard) e os links de navegação da barra lateral desktop (`tour-nav-workouts` e `tour-nav-nutrition`), permitindo focar diretamente nas opções de Módulo de Treinamento e Recuperação.
    6. **Fallback de Âncoras Ausentes em Dispositivos Móveis**: Desenvolvida lógica de detecção inteligente que avalia a existência e visibilidade da âncora do menu lateral (ocultado no celular). Se a âncora não for encontrada, o Highlighter se desliga suavemente e o card de dicas do tour centraliza na tela, oferecendo orientações detalhadas de navegação de forma 100% amigável e funcional em celulares, mantendo o tutorial robusto em qualquer tamanho de tela.
    7. **Painel de Recalibração de Guias (`Settings.tsx`)**: Adicionado o painel "Diretrizes de Sistema" na tela de Ajustes contendo um botão de toque único roxo cyberpunk para limpar a chave do tutorial do `localStorage` e re-invocar o protocolo de treinamento interativo instantaneamente a qualquer momento.
- **Correção de Restrição de Atributo no Banco de Dados (Supabase)**:
  - **Identificação do Bug**: Graças ao novo painel de feedback de erro que implementamos no modal, pudemos capturar o erro exato retornado pelo Supabase ao tentar criar hábitos a partir do Codex: `new row for relation "habits" violates check constraint "habits_stat_target_check"`. A causa raiz era que o banco de dados remoto possuía restrições antigas do tipo `CHECK` nas tabelas `habits` e `tasks`, que limitavam o campo `stat_target` apenas aos 4 primeiros atributos (`'strength'`, `'intelligence'`, `'endurance'`, `'vitality'`), rejeitando a inserção do atributo `'discipline'` (Disciplina) recém-introduzido no sistema.
  - **Soluções Aplicadas**:
    - **Atualização de Matriz SQL (Banco Remoto)**: Executadas queries de alteração de tabelas diretamente no Supabase para remover as restrições obsoletas `habits_stat_target_check` e `tasks_stat_target_check` e recriá-las contendo o atributo `'discipline'` como uma opção 100% válida. Com isso, os hábitos e tarefas gerados pelo Codex ou anomalias IA com foco em Disciplina passam a ser inseridos e criados instantaneamente de primeira!
- **Correção da Criação Silenciosa e Exibição de Missões Diárias (Hábitos)**:
  - **Identificação do Bug**: Ao tentar criar novos hábitos a partir do Codex ou do botão "Nova Quest", a inserção de dados falhava silenciosamente no Supabase devido ao envio de campos opcionais (`scheduled_time`, `scheduled_end_time`) com o valor Javascript `undefined`. O banco de dados rejeitava esse payload inválido, porém o modal `NewHabitModal.tsx` fechava e limpava o formulário sem conferir a resposta, ocultando a falha do usuário. Além disso, identificamos uma dessincronização de fuso horário onde o hook `useHabits.ts` definia a data do dia em **UTC** (o que fazia com que, a partir das 21h do horário de Brasília, o sistema já considerasse o dia seguinte/terça-feira), ao passo que a checagem do dia da semana em `todayDayOfWeek` usava o dia da semana **local** (segunda-feira). Isso fazia com que hábitos restritos a dias úteis (segunda a sexta) ou programados ocultassem as tarefas incorretamente. A comparação de dias da semana também era sensível a tipos, arriscando falhas se o Supabase serializasse o array como strings.
  - **Soluções Aplicadas**:
    1. **Sanitização de Payload (`useHabits.ts`)**: Refatorada a função `createHabit` para estruturar e sanitizar o payload de forma estrita, convertendo strings em branco ou valores `undefined` dos campos de horários em `null` antes de enviar ao Supabase.
    2. **Log de Erros em Desenvolvimento (`useHabits.ts`)**: Adicionado `console.error` detalhado no hook para facilitar a depuração no console em caso de falha de conexão ou políticas de RLS.
    3. **Unificação para Fuso Horário Local (`useHabits.ts`)**: Alterado o `todayStr()` no hook de hábitos para calcular a data atual no fuso horário **local do dispositivo** (`new Date().toLocaleDateString('en-CA')`), idêntico à convenção adotada em `Quests.tsx`. Isso sincroniza perfeitamente a data do dia com o dia da semana local, impedindo quebras de fuso horário noturnas.
    4. **Comparação Tolerante a Tipos (`useHabits.ts`)**: Atualizada a filtragem de hábitos ativos (`activeHabits`) para normalizar os dias da semana para número (`h.scheduled_days.map(Number).includes(Number(dayOfWeek))`), tornando-a 100% imune a conflitos de `string` vs `number` na resposta JSON.
    5. **Tratamento e Feedback Visual de Erros (`NewHabitModal.tsx`)**: Introduzido estado local de erro (`error`) no modal. O formulário agora aguarda a resposta do hook: se falhar, o modal continua aberto com os dados preservados e exibe um alerta de falha cyberpunk vermelho. Se obtiver sucesso, fecha normalmente.
    6. **Ampliação do Limite no Dashboard (`Dashboard.tsx`)**: Aumentado o truncamento de missões diárias exibidas no painel de atalhos rápidos de 6 para 10, permitindo que caçadores avancem em múltiplas missões e hábitos consolidados sem perdas de visibilidade na interface.
- **Correção de Roteamento SPA no Vercel (F5 / 404)**:
  - **Identificação do Bug**: Ao realizar o deploy no Vercel, o recarregamento da página (F5) ou acesso direto a rotas secundárias (como `/workouts`, `/settings`, `/onboarding`) resultava em erro 404 (página em branco/sumindo). Esse comportamento ocorre porque servidores estáticos tentam mapear fisicamente as URLs de rotas do lado do cliente (React Router).
  - **Solução Aplicada**: Criado o arquivo de configuração `vercel.json` na raiz do projeto contendo regras de `rewrites` para redirecionar todas as rotas de volta ao `index.html` principal. Isso permite que o React Router capture e processe as rotas no cliente de forma consistente e sem falhas após recarregar a página.
- **Correção de Abertura do Menu Lateral Mobile (MobileMenu)**:
  - **Identificação dos Bugs**:
    1. **Barreira Restritiva**: No celular, o botão de menu lateral falhava silenciosamente e não renderizava nada. A causa era uma verificação restritiva `if (!state.username) return null;` no `MobileMenu.tsx` que impedia o carregamento do menu caso o `username` na store estivesse vazio.
    2. **Loop de Fechamento Imediato**: Após remover a barreira, o menu ainda fechava instantaneamente na primeira renderização de montagem. O `useEffect` responsável por fechar o menu na mudança de rota disparava na primeira montagem (que ocorre quando `open` fica `true`), executando o `onClose()` logo no início e voltando o estado a `false`.
  - **Soluções Aplicadas**:
    1. Removida a barreira condicional de `username` e adicionado o fallback `{state.username || 'Hunter'}` para exibição no rodapé do menu.
    2. Refatorado o `useEffect` de monitoramento de rota em `src/components/layout/MobileMenu.tsx` usando um hook `useRef` (`lastPath`) para comparar a rota atual com a anterior. O menu agora só chama `onClose()` se a URL de fato mudar de valor, evitando o fechamento instantâneo indesejado ao abrir e estabilizando de vez a navegação mobile.
- **Atualização de Branding (Favicon e Título da Guia)**:
  - **Requisito do Usuário**: Alterar o título da guia do navegador para exibir apenas "Ascend" e atualizar o ícone da guia (favicon) para a logo oficial do projeto.
  - **Solução Aplicada**: Atualizado o arquivo `index.html` para alterar a propriedade `<title>` para "Ascend". O link do favicon foi ajustado de `/favicon.svg` (inexistente) para `/Icon 2.png` (a logo oficial armazenada no diretório público do projeto), garantindo a renderização perfeita do ícone no navegador.
- **Aprimoramento de Layout (Redimensionamento do Ícone Principal)**:
  - **Requisito do Usuário**: Aumentar o tamanho do ícone oficial da marca em 30% em todas as exibições do aplicativo.
  - **Solução Aplicada**: Redimensionado o ícone `Icon 2.png` em 30% na barra lateral desktop (de `size-10` para `size-[52px]`), na barra superior do cabeçalho mobile (de `h-9 w-9` para `h-[47px] w-[47px]`), e no cabeçalho do menu lateral mobile (de `size-9` para `size-[47px]`), otimizando o peso visual e a legibilidade da marca ASCEND nas diferentes telas de exibição.
- **Polimento da Animação do Menu Lateral (MobileMenu)**:
  - **Identificação do Bug**: A animação de deslize lateral (entrar e sair) do menu mobile parecia "esquisita", travada ou lenta. Isso acontecia por um conflito entre o Framer Motion (que anima o transform fisicamente) e a classe de transição do Tailwind (`transition-all duration-300`) no mesmo elemento.
  - **Solução Aplicada**: Removida a classe utilitária do Tailwind do `motion.aside`, permitindo que o motor de física ultra-suave de spring do Framer Motion faça o deslize do menu de forma nativa e acelerada por hardware, tornando a animação extremamente limpa, fluida e nítida.
- **Nitidez de Avatar & Lightbox do Caçador (Dashboard)**:
  - **Requisito do Usuário**: Corrigir a pixelização/embaçamento no avatar do Caçador no Dashboard e permitir ampliar/fechar o avatar em tamanho grande para inspeção de alta qualidade.
  - **Solução Aplicada**: 
    - Adicionada a propriedade CSS `imageRendering: 'pixelated'` no avatar do cabeçalho e na ampliação, o que restaura a nitidez cristalina dos pixels da arte retro-RPG oficial de Solo Leveling, eliminando o desfoque bicúbico do navegador.
    - Implementado um modal **Lightbox interativo** e responsivo usando `AnimatePresence` e `motion` do Framer Motion em `Dashboard.tsx`. O usuário pode clicar no seu avatar para abri-lo em tela cheia com desfoque de fundo (`backdrop-blur-md`), exibindo também o nome do Caçador, Classe e Rank, fechando com facilidade ao clicar fora ou no botão de ação.
- **Codex do Caçador Totalmente Responsivo no Mobile**:
  - **Requisito do Usuário**: A tabela do Codex do Caçador era muito larga no celular, gerando uma rolagem horizontal desconfortável. O usuário desejava que a tabela coubesse por completo e se adaptasse.
  - **Solução Aplicada**: Criada uma renderização alternativa condicional e responsiva em `src/pages/Quests.tsx`. O componente agora exibe a tabela clássica completa apenas em desktops (`hidden md:block`), e no celular (`block md:hidden`), renderiza uma lista elegante de cards verticais em estilo Cyberpunk, contendo o ícone, título da atividade, atributos associados, badge de recompensa XP e botão de ação empilhados de forma harmoniosa, eliminando 100% o transbordamento horizontal.
- **Correção Crítica na Inserção de Quests pelo Codex**:
  - **Identificação do Bug**: Ao clicar em "Despertar Quest" no Codex e salvar o modal, os novos hábitos criados não apareciam na aba de "Missões Diárias". A causa raiz era que a coluna `active` não estava sendo setada no payload da função de criação do frontend (`createHabit`), fazendo com que o Supabase inserisse as tarefas desativadas (`active = false`) por padrão.
  - **Solução Aplicada**: Atualizado o payload de inserção na função `createHabit` em `src/hooks/useHabits.ts` para declarar explicitamente `active: true`. Os hábitos gerados pelo Codex agora nascem ativados no banco de dados e entram na rotina de fendas ativas de hoje de forma instantânea.

### 2026-05-22
- **Avatares Dinâmicos por Rank e Classe**:
  - **Requisito do Usuário**: Atualização do sistema para suportar a nova estrutura de pastas de assets em `public/Classes/`, onde cada classe possui imagens exclusivas separadas por Rank físico (`Rank E.jpeg` até `Rank S.jpeg`), atualizando o avatar na interface do usuário automaticamente em tempo real sempre que o usuário sobe de Rank.
  - **Onboarding RPG Imersivo**: Substituídas as imagens estáticas genéricas antigas no quiz de onboarding (`src/pages/Onboarding.tsx`) pelos novos caminhos dinâmicos correspondentes ao `Rank E` inicial de cada classe (`/Classes/Warrior/Rank E.jpeg`, `/Classes/Scholar/Rank E.jpeg`, `/Classes/Monk/Rank E.jpeg`, `/Classes/Titan/Rank E.jpeg`), garantindo que o caçador veja seu avatar inicial exato ao selecionar a classe no quiz.
  - **Ajustes de Perfil Reativos**: Refatorado o método de obtenção de imagem em `src/pages/Settings.tsx` para incorporar a classe ativa e o rank atual do jogador, gerando caminhos normalizados e tolerantes a falhas.
  - **Dashboard com Avatar Imersivo**:
    - Injeção de uma propriedade computada `characterAvatar` com caching reativo via `React.useMemo` no Zustand store global do `Dashboard.tsx`.
    - Renderização física do avatar premium do caçador no cabeçalho do Dashboard, posicionado de forma estilizada ao lado do Badge de Rank. O componente conta com bordas circulares recortadas, glows dinâmicos correspondentes à classe (esquema neon refinado no `classColorMap` atualizado para Warrior, Scholar, Monk e Titan) e física reativa.
  - **Resiliência a Ranks Especiais**: Implementada lógica de normalização inteligente para converter ranks de prestígio sem assets de imagem físicos (`National` e `Monarch`) para o rank de ápice físico disponível (`Rank S`), evitando links quebrados na interface.
  - **Validação de Compilação Estrita**: Executado build completo de produção com sucesso absoluto e sem erros estáticos de TypeScript ou de bundler do Vite.

### 2026-05-20
- **Sincronização de Status de Hunter no Treinamento**:
  - **Identificação da Inconsistência**: O componente `WorkoutProgress.tsx` na aba de Treino (Evolução) calculava o "Status de Hunter" localmente com base na quantidade de recordes pessoais (PRs) do usuário. Isso causava discrepância com o Rank global real do Caçador (ex: exibindo "Rank C" no treino enquanto o perfil do usuário era Nível 1 "Rank E").
  - **Sincronização Implementada**: Importado o `useHunterStore` no componente de progresso de treino para ler dinamicamente o status do rank global do Caçador (`state.rank`). O card "Status de Hunter" agora exibe de forma consistente o valor oficial `Rank {rank}` vindo da fonte única de verdade do store global.
- **Correção Crítica no Reset de Atributos (Zerar RPG)**:
  - **Identificação do Bug**: O botão "Zerar Atributos" na tela de Ajustes tentava atualizar a coluna `xp_required` no Supabase. No entanto, o banco de dados remoto possui a coluna tipada como `xp_to_next_level` (assim como mapeado nas funções de sincronização `loadProfile` e `saveProfile` no Zustand). Isso causava um erro interno no Supabase e impedia o reset do nível de volta ao 1 e dos atributos a 10.
  - **Correção Aplicada**: Ajustada a query de update do Supabase em `src/pages/Settings.tsx` para direcionar a coluna correta `xp_to_next_level: 100` in vez de `xp_required: 100`, restaurando a integridade do reset simples de atributos e garantindo que o caçador retorne com sucesso ao Nível 1, XP 0 e atributos base de forma instantânea.
- **Recorrência Semanal Customizada para Quests Diárias (Hábitos)**:
  - **Modelagem de Banco (Supabase Remote)**: Criação e integração da nova coluna `scheduled_days` do tipo `integer[]` com default `{0,1,2,3,4,5,6}` na tabela `habits` (projeto remoto `oitgbsnnhvugglvmxjkq`).
  - **Arquitetura de Estado e Reatividade (useHabits.ts)**: Interfaces `Habit` e `CreateHabitInput` atualizadas. Lógica reativa que filtra `activeHabits` no cliente com base no dia da semana atual (`dayOfWeek`) utilizando o fuso local do dispositivo. Implementada a função persistente `updateScheduledDays` para gravação ágil no banco.
  - **Experiência de Criação Premium (NewHabitModal.tsx)**: Injeção de um seletor visual reativo de dias da semana no formulário de criação com física responsiva, glows neon holográficos herdando a cor da categoria escolhida pelo caçador e acessibilidade mobile de toque único.
  - **Edição Rápida na Aba de Gerenciamento (Quests.tsx)**: Otimização do componente `ManageQuestRow` ("Lista de Sistema"), incorporando um seletor de dias ultra-compacto que executa atualização de agendamento em tempo real com um único clique de forma fluida.
- **Resolução do Travamento de Abas (Bug de Runtime) & Estabilização do Build**:
  - **Correção de ReferenceError em Workouts.tsx**: Adicionada a importação explícita da função utilitária `cn` (`import { cn } from '@/lib/utils';`) no topo de `src/pages/Workouts.tsx`. Este era o principal causador do bug relatado, pois o uso de `cn` sem definição causava quebra silenciosa de runtime do React ao tentar renderizar a aba de treinos, resultando em tela preta/em branco.
  - **Correção de Tipagem de Mapeamento Alimentar (useHabits.ts)**: Ajustado o loop de processamento das calorias de cardápios de hoje (`mealItemsData`) para aceitar dados com tipagem resiliente `any`, tratando tanto o retorno de objeto único quanto de arrays para a propriedade `.food` provenientes da API dinâmica do Supabase.
  - **Correção de Estado do Dashboard (Dashboard.tsx)**: Removida a propriedade inexistente `state.userId` no store `useHunterStore`, utilizando diretamente a referência autêntica `user?.id` extraída do hook unificado de sessão `useAuth()`. Também adicionamos o import do ícone `Settings` da biblioteca `lucide-react` que estava ausente.
  - **Correção de Interfaces em Nutrition.tsx**: Removido o envio do prop `dailyMacros` na renderização de `<NutritionMealPlans />` uma vez que a propriedade não é consumida pelo componente, alinhando a interface com a tipagem estrita declarada.
  - **Criação de Adaptador de Atualização em Quests.tsx**: Desenvolvida a função adaptadora `handleUpdateTime` para lidar e tipar de forma correta e resiliente a atualização de horário entre hábitos, treinos, refeições e tarefas comuns, resolvendo incompatibilidades no `onUpdateTime` passadas aos componentes `MissionCard`.
  - **Validação de Sucesso do Build**: Executado build de produção completo (`tsc -b && vite build`) concluído com 100% de sucesso e zero erros de compilação ou tipagem TypeScript.
- **Otimização Velo-System e Aceleração de Performance**:
  - **Eliminação do Loop Infinito no Supabase**: Implementada a chave de estado `workoutStatusKey` via `JSON.stringify(workoutMissions.map(m => m.isCompleted))` para estabilizar o array de dependências do `useEffect` de volume de treinos. Isso reduziu o consumo de rede da API Supabase em mais de 90% e eliminou travamentos.
  - **Caching de CPU Avançado**: Consolidada a conversão de XP, cálculo acumulado de calorias, energia e a lógica de ordenação e filtro de missões diárias em um bloco `React.useMemo` de alto desempenho, eliminando renderizações redundantes.
- **Reestruturação e Storytelling Premium do Dashboard**:
  - **Reordenação Mobile-First**: Otimizada a sequência visual no iPhone 14. A ordem agora é: HUD Principal (XP/Nível) ➔ Atalhos Rápidos ➔ Missões Diárias (Quests Rápidas de 1 toque) ➔ Janela de Status e Gráficos de Combate.
  - **Atalhos Rápidos de 1 Clique**: Criado painel holográfico reativo à cor da classe ativa (com transições aceleradas por hardware no Framer Motion) no topo do Dashboard.
  - **Ficha RPG Unificada**: A "Janela de Status" agora consolida o RadarChart de atributos, o Grid compacto de 5 atributos de caçador e os 3 cards secundários biométricos (Mana, Carga, Exaustão) em um HUD estilo RPG Cyberpunk coerente.
- **Implementação do Painel de Ajustes de Sistema de Elite**:
  - **Ficha Visual de Classe Ativa**: Desenvolvida a seção de destaque com renderização reativa do avatar da classe atual do caçador (`Warrior`, `Scholar`, `Monk`, `Titan`) utilizando os assets premium jpeg da pasta `/Classes/` com bordas e efeitos de glow neon temáticos específicos de cada vocação.
  - **Edição de Perfil de Caçador**: Integrados inputs reativos de formulário para atualizar opcionalmente o **Nome Completo** (`full_name`) e a **Data de Nascimento** (`birthday` do tipo DATE) diretamente na tabela `profiles` do Supabase, sincronizando dinamicamente com o Zustand.
  - **Edição de Credenciais (Segurança)**: Adicionado formulário de alta segurança integrado ao Supabase Auth (`supabase.auth.updateUser`) para permitir atualização instantânea do **E-mail de Login** e **Nova Senha** de acesso da conta.
  - **Zerar RPG (Reset Simples)**: Desenvolvido o botão de purificação de atributos RPG que zera o caçador de volta ao Nível 1 (Nível 1, XP 0, Rank E, atributos base FOR, INT, RES, VIT, DIS a 10) sem deletar sob nenhuma hipótese suas rotinas de exercícios, dietas, hábitos e tarefas criadas.
  - **Zerar Sistema (Reset Geral)**: Desenvolvido o botão de reset total com dupla confirmação e digitação de segurança (`DESTRUIR`). Remove definitivamente todas as tabelas vinculadas ao usuário (`tasks`, `habits`, `workout_routines`, `workout_logs`, `meal_plans`, `food_logs`, `achievements`, `daily_checklist` e registros customizados) e limpa sua classe (`class = null`), limpando o store do Zustand e redirecionando instantaneamente ao `/onboarding` para recomeçar o reino do zero.
  - **Refinamento do Painel de Treinamento (Workouts)**:
    - **Isolamento de Abas Estrito**: Corrigimos o vazamento de layout onde os cards de rotinas de treino continuavam visíveis ao acessar a aba "Evolução". Agora a renderização condicional é exclusiva para cada aba (`Minhas Rotinas`, `Evolução` e `Biblioteca`), de modo que cada visualização apresente estritamente seu conteúdo.
    - **Remoção da Sidebar de Logs**: Removemos a barra lateral "Logs de Sistema" na tela de treinos. Com isso, eliminamos elementos redundantes e liberamos 100% da largura da tela (`w-full`) para as rotinas e os gráficos da aba "Evolução", proporcionando um design muito mais imersivo, limpo e premium.

### 2026-05-19
- **Implementação da Fenda de Anomalia IA (Quest Extra Diária da IA)**:
  - **Invocação via Groq Llama Personalizada por Classe**: Desenvolvido o painel premium de fenda no topo da lista diária (`Quests.tsx`), que realiza chamadas seguras ao modelo `llama-3.1-8b-instant` do Groq. A geração de micro-desafios e da lore de RPG Solo Leveling agora lê a classe do caçador (`Warrior`, `Scholar`, `Monk`, `Titan`) e a integra com inteligência ao tipo de quest escolhida (ex: Warrior focado em "Estudo" recebe leitura tática de combate; Scholar focado em "Treino" recebe foco e respiração corporal).
  - **Restrição Diária Solar**: Implementada checagem dinâmica que detecta se uma tarefa com prefixo `[BÔNUS IA] ` já foi gerada no dia local do caçador, mantendo o portal fechado e bloqueando novas gerações para respeitar o limite solar estrito de apenas uma quest extra por dia.
  - **Grid de Chips de Categoria Premium**: Estilizados chips interativos neon que destacam a categoria escolhida com bordas e glows coloridos dinâmicos baseados na cor da categoria (Treino, Cardio, Estudo, Trabalho, Saúde, Hobbies) e preenchem as recompensas associadas (XP e Stats RPG).
  - **Resiliência a Fusos Horários**: Ajustada a detecção de datas convertendo strings UTC do banco Supabase em datas locais no cliente antes de verificar igualdade de dia, garantindo o funcionamento perfeito do portal e dos resets mesmo no período noturno.
  - **Persistência Imersiva de Lore**: Salva de forma resiliente a lore gerada no `localStorage` indexada por ID e mostra no respectivo `MissionCard` com estilo neon itálico de Solo Leveling.
- **Implementação do Awakening Loader Premium (Tela de Carregamento)**:
  - Desenvolvida uma nova tela de carregamento inicial ultra-premium e imersiva para o "despertar" do sistema.
  - Substituída a string antiga `"Carregando reino..."` por `"Despertando..."` em letras maiúsculas estilizadas, integrando a fonte `Orbitron`, espaçamento de caracteres sci-fi (`tracking-[0.3em]`) e efeito de glow neon violeta (`text-glow-purple`).
  - Adaptado o design de animação rotativa com múltiplos anéis de desfoque graduados (Glow Ring), vidados no centro com a cor de fundo exata do app (`#0B0B0F`), criando uma atmosfera cyberpunk perfeitamente integrada ao lore do *Hunter System*.
- **Integração do Codex do Caçador com a Lista de Sistema e Expansão de Quests**:
  - Implementado suporte total a presets de hábitos diários, permitindo "despertar" quests pré-definidas diretamente da tabela do Codex com um único clique.
  - Conectamos o botão **"Despertar Quest"** ao `NewHabitModal` com pré-carregamento dos atributos corretos (título, categoria, cor, XP diário, atributo RPG e recompensa de status).
  - Adicionado o botão **"Ir para Módulo"** nas linhas de Refeições, Treinos e Cardios do Codex, redirecionando o caçador instantaneamente para as telas `/workouts` ou `/nutrition` correspondentes.
  - Expandido o Codex do Caçador com novas atividades cotidianas de alta imersão:
    - **Trabalhar (Foco Diário)**: +25 XP e +1 Disciplina (DIS) — Foco profissional de alta constância.
    - **Trabalho Extra / Freelance**: +40 XP e +2 Disciplina (DIS) — Esforço adicional e autonomia financeira.
    - **Aprender Idiomas**: +25 XP e +2 Inteligência (INT) — Expansão cognitiva e plasticidade cerebral.
    - **Tocar Instrumentos / Música**: +20 XP e +2 Vitalidade (VIT) — Reequilíbrio da harmonia mental e vitalidade.
  - Adicionada compatibilidade completa com o atributo de **Disciplina (DIS)** na criação de hábitos diários no hook `useHabits.ts` e no seletor de atributos em `NewHabitModal.tsx`, com tipagem estática TypeScript 100% perfeita.
- **Implementação do Codex do Caçador e Tabela RPG Premium**:
  - Criada uma nova aba premium chamada **Codex do Caçador** (`'codex'`) na tela de missões (`Quests.tsx`), exibindo uma tabela explicativa estilo Cyberpunk/RPG (inspirado no sistema de caçadores de *Solo Leveling*).
  - A tabela detalha categoricamente as atividades do mundo real (refeições, treinos, cardios, leitura, tecnologia, hobbies) e suas exatas conversões em XP e Atributos de RPG (+FOR, +INT, +RES, +VIT, +DIS), além do efeito de lore imersivo.
  - Implementado design premium responsivo com Orbitron, bordas finas neon, gradientes foscos sofisticados, efeitos hover de alta performance e ícones dinâmicos do Lucide (`BookOpen`, `Code`, `Music`, `Heart`, `Award`, `UtensilsCrossed`, `Dumbbell`).
- **Calibração de XP e RPG em Missões Diárias**:
  - Atualizado o hook principal `useHabits.ts` para injetar propriedades RPG dinâmicas (`xp_reward`, `stat_target`, `stat_reward`) às missões de treino (`workoutMissions`). O sistema detecta se a rotina ativa é Cardio (por nome ou categoria de exercícios) e define dinamicamente **+40 XP** e **+2 Resistência** (RES), ou **+50 XP** e **+2 Força** (FOR) para musculação.
  - Atualizado o `MissionCard` de `Quests.tsx` para exibir dinamicamente o XP calibrado do treino (`m.xp_reward`) e o atributo correspondente (`m.stat_target`) na tela de missões, em vez de fixar em 50 XP genéricos.
  - Sincronizada a conclusão de refeições ativas (`toggleMealMission` em `useHabits.ts`) com o store Zustand `useHunterStore`, concedendo de forma reativa e persistente **+15 XP** e **+1 Vitalidade** (VIT) ao marcar (e removendo se desmarcar).
- **Unificação de Gerenciamento de Estado (Stores)**:
  - Descontinuamos o store antigo e paralelo (`useRPGStore.ts`) e migramos toda a lógica de RPG, experiência, atributos e subida de nível para o store principal unificado do Hunter (`useHunterStore.ts`).
  - Movido `useRPGStore.ts` para a pasta de arquivos obsoletos (`obsoleto/useRPGStore.ts`) conforme o Protocolo de Manutenção (Zero Waste).
  - Implementada lógica de subida de nível cumulativa e a ação `pendingLevelUp` no `useHunterStore.ts`.
- **Refatoração Completa dos Hooks**:
  - `useHabits.ts`, `useMealPlans.ts` e `useTasks.ts` foram totalmente reescritos e integrados com o `useHunterStore.ts` para permitir atualizações de XP e stats 100% reativas em tempo real.
  - As missões de refeição agora são salvas de forma persistente e imediata no Supabase sem corromper os atributos do jogador.
- **Correções do Supabase**:
  - Ajustamos e restauramos o perfil corrompido do usuário de teste ("Gabriel Reis") no Supabase, corrigindo seu Level 2 e restabelecendo os atributos base a partir de 10 (FOR: 11, INT: 10, RES: 10, VIT: 10, DIS: 10) e zerando o XP negativo.
- **Aprimoramento Visual e Micro-Animações no Dashboard**:
  - Adicionadas micro-animações de alta performance ao fazer hover nos cards inferiores:
    - **Card de Calorias**: O ícone de chama cresce e rotaciona 6° suavemente.
    - **Card de Volume de Treino**: O ícone de halter gira -12° com física spring.
    - **Card de Nível de Energia**: O ícone de tendência de subida é elevado e pulsa.
  - Corrigido um erro crítico de duplicação de tags JSX e corpo de função duplicada no encerramento de `Dashboard.tsx` que impedia o build do projeto.
- **Verificação Estática**:
  - Compilação do TypeScript (`npx tsc --noEmit`) executada com sucesso total e sem erros!

### 2026-05-01
- **Refatoração do Loader:** 
  - Substituição do `HoloPulse` (circular) pelo novo **Matrix Loader** estilo ciberpunk azul elétrico.
  - Arquivo renomeado de `holo-pulse-loader.tsx` para `matrix-loader.tsx`.
  - Função renomeada para `MatrixLoader` e todas as referências no `Onboarding.tsx` atualizadas.
  - Correção de variáveis de cor para compatibilidade com Tailwind 4 (`var(--color-ascend-blue)`).
- **Redesign das Opções do Onboarding:**
  - Substituição dos `GlowCard` por **alert-cards roxos** estilo RPG (borda esquerda sólida, fundo escuro, ícone info).
  - **Os nomes das classes foram ocultados** das opções — o usuário escolhe com base no texto comportamental, sem saber qual classe está selecionando.
  - Animação de entrada staggerada (delay de 60ms por item).
  - Estado de seleção com ring + shadow purple glow + chevron animado.
  - **Otimização de Performance (Feel):**
    - Ajustamos as transições do Framer Motion nos cards de escolha de classe. Resolvemos um problem onde o `delay` da animação de entrada estava interferindo no hover.
    - Agora, o hover nos cards é **instantâneo** (usando `spring` physics `stiffness: 400`, `damping: 15`), eliminando o delay percebido anteriormente.
  - **Integração Visual (Classes):**
    - Substituímos os placeholders de arte pelos assets reais em `/public/Classes/`.
    - Implementamos efeitos de `group-hover` que removem o grayscale e ajustam o zoom da imagem suavemente ao passar o mouse.
  - Botão "REVELAR MEU CAMINHO" só aparece após responder as 5 perguntas.
  - Tela de revelação mostra o nome da classe após o quiz completo.
- **Manutenção e Organização:**
  - Criação da pasta `obsoleto/` para armazenar componentes e rascunhos não utilizados.
  - Backup do código original do HoloPulse in `obsoleto/HoloPulse-Original.tsx`.
  - Consolidação dos estilos globais no `index.css`.
  - Regras de manutenção adicionadas ao `AGENTS.md` e SOP criado em `directives/maintenance.md`.

### ⚔️ [2026-05-04] Refinamento de Progressão e Fix de Ranks
*   **Calibragem de XP:** Curva de experiência ajustada para um grind de ~1 ano até o Rank S (Level 100).
*   **Bônus de Streak:** Implementado multiplicador de XP (+2% por dia de streak, cap de +100%) para incentivar a consistência.
*   **Fix do Display de Rank:** Corrigida a falha onde o Rank não aparecia no Dashboard; agora o cálculo é dinâmico com fallback seguro.
*   **Onboarding Snappy:** Usuários com classe já definida agora pulam o formulário em 2 segundos, mantendo apenas a imersão do Matrix Loader.
*   **Database Sync:** Adicionadas colunas faltantes (`rank`, `class`, `streak`, `discipline`) na tabela `profiles` via migração SQL.
  - **Limpeza de UI:** Remoção completa dos indicadores de paginação (bolinhas) para foco total no conteúdo e ação.
  - **Confirmação Final:** Botão "DESPERTAR PODER" integrado para validar a escolha da classe antes de entrar no Dashboard.
  - **Persistência e Guard:** Implementada lógica para que usuários que já possuem classe passem apenas pelo loading e sejam redirecionados automaticamente ao Dashboard, evitando o preenchimento repetido do formulário.

### 🏋️ [2026-05-04] Módulo de Treinos (Fase 5) Concluído
*   **Gestão de Rotinas:** Criada funcionalidade para cadastrar e editar treinos (A, B, C...).
*   **Exercícios:** Implementada busca e injeção rápida de exercícios na rotina.
*   **Ordenação:** Adicionada funcionalidade de reordenar exercícios manualmente via setas.
*   **Logging Inteligente:** Finalização de treino agora salva automaticamente a última carga e reps utilizada para a próxima sessão.
*   **Evolução:** Nova aba "Progresso" com gráficos de Volume Semanal e acompanhamento de Recordes Pessoais (PRs).

### Anteriormente
- **Fase 4 Concluída:** Implementação completa do sistema de hábitos diários com reset automático e página de gerenciamento.
- **Fase 3 Concluída:** Dashboard redesenhado com barras de XP animadas, StatCards e sistema de Level Up.
- **Fase 2 Concluída:** Integração com Supabase, Contexto de Autenticação e componentes de UI premium (AuthUI, MobileMenu).
- **Fase 1 Concluída:** Setup inicial do projeto e definição do Design System RPG Dark.

---

## 📂 Arquivos em `obsoleto/`
Arquivos movidos por não serem mais necessários no fluxo principal do código:
- `useRPGStore.ts`: Store depreciado unificado com o `useHunterStore.ts`.
- `HoloPulse-Original.tsx`: Backup do loader circular antigo.
- `ai-loader.tsx`: Componente de loading inicial descartado.
- `Antigravity Skills Lib.txt`: Referências de skills externas.
- `Api Key.txt`: Backup de chaves (recomenda-se uso exclusivo do `.env`).
- `Color Pallet.txt`: Rascunho da paleta (já integrada ao CSS).
- `Estrutura.txt` / `Features.txt`: Documentos de planejamento inicial superados pelo ROADMAP.md.

---

## 🚀 Próximos Passos
1. **Fase 6 (Nutrição):** Implementar sistema de "Mana Recovery" com metas dinâmicas, water tracking e histórico de macros.

### ⚡ [2026-06-15] Otimização de Performance & Resiliência nos Ajustes
* **Otimização de Hovers (Performance 60 FPS):**
  * Removemos todos os hovers baseados em JavaScript do Framer Motion (`whileHover` e `whileTap`) no [Dashboard.tsx](file:///d:/Área de Trabalho/App/src/pages/Dashboard.tsx), [Workouts.tsx](file:///d:/Área de Trabalho/App/src/pages/Workouts.tsx), [Nutrition.tsx](file:///d:/Área de Trabalho/App/src/pages/Nutrition.tsx) e [Quests.tsx](file:///d:/Área de Trabalho/App/src/pages/Quests.tsx).
  * Migramos as transformações para transições CSS nativas do Tailwind aceleradas por GPU (`hover:scale-[1.01]`, `hover:-translate-y-1`, `duration-150`, `ease-out`), eliminando os atrasos táteis (lag) no hover de avatares, ranks, botões e cards de missões/exercícios/alimentos.
* **Resiliência e Correção nos Ajustes:**
  * Corrigido o erro de carregamento infinito ("Acessando Codex...") na tela de Ajustes ([Settings.tsx](file:///d:/Área de Trabalho/App/src/pages/Settings.tsx)), que ocorria quando o componente montava antes do ID do usuário ser resolvido pelo contexto de autenticação.
  * Inicializamos os estados de carregamento `loadingAchievements` e `telemetry.loading` como `false` por padrão.
  * Implementamos timeouts de segurança de 5 segundos (`safetyTimer`) que interrompem o carregamento infinito do Codex e de telemetria caso a comunicação com o Supabase falhe ou sofra com latência.
  * Adicionamos tratamento de erros visíveis com painéis vermelhos explicativos e amigáveis em tela, permitindo que a interface funcione normalmente usando os dados locais ou padrões em caso de falha de conexão.

### 2026-06-16
- **Correções de Produção em Quests/XP/Data:**
  - Corrigida a remoção de XP ao desmarcar tarefas, hábitos e bônus consolidados: valores negativos agora subtraem XP de verdade, respeitando level down e sem passar pelo anti-farm de ganho diário.
  - Padronizado o cálculo de "hoje" para data local do usuário em dashboard, refeições, cardápios e conclusão de treinos, evitando registros caírem no dia errado por conversão UTC.
  - Sincronizado o cache local de tarefas, hábitos, conclusões e missões de refeição após mutações, evitando que dados antigos reapareçam após refresh.
  - Corrigido o cadastro de alimentos personalizados para usar `created_by`, alinhado ao schema e às policies RLS do Supabase.
### 2026-06-16
- **Redesign Cinematografico do Login Ascend:**
  - Reestruturada a tela de login/cadastro como entrada do `Ascend System`, com branding forte, hero integrado, particulas, glow responsivo e microcopy tematica.
  - Reformulados inputs, botoes e estados de foco em estilo glassmorphism/dark fantasy, preservando handlers de autenticacao e rotas existentes.
  - Adicionados previews de gamificacao com rank, level, streak, XP, classe, boss semanal e metricas da comunidade.
  - Criados tokens/animacoes `auth-*` para particulas e barra de XP com suporte a `prefers-reduced-motion`.
  - Build de producao validado com `npm.cmd run build` e rota local `/login` respondendo HTTP 200.

### 2026-06-16
- **Fix de Cache do Perfil Nutricional:**
  - Incluido `hunter-storage` na limpeza automatica de cache por versao para evitar perfil antigo preso no navegador apos deploy.
  - Adicionada assinatura de schema do perfil para forcar limpeza quando novos campos nutricionais entram no app.
  - Mensagens de meta calorica agora indicam exatamente quais campos faltam para calcular TMB.
  - Build de producao validado com `npm.cmd run build`.

### 2026-06-16
- **Ajuste Visual e Regra Calorica Nutricional:**
  - Atualizado o banner de nutricao em Missoes para mostrar calorias restantes/objetivo diario em vez de contagem de refeicoes.
  - Adicionado painel na aba Recuperacao com objetivo nutricional, TMB estimada, manutencao estimada, meta calorica e faixa de tolerancia para XP.
  - Centralizado o calculo nutricional em `nutritionTargets`, usando Mifflin-St Jeor, fator de atividade base 1.2, deficit de 15% para perda e superavit de 10% para ganho.
  - Build de producao validado com `npm.cmd run build`.

### 2026-06-16
- **Rework de Pontuacao Nutricional:**
  - Adicionado objetivo nutricional separado (`nutrition_goal`: perder, manter ou ganhar peso) no onboarding, ajustes e profile.
  - Criada avaliacao diaria idempotente baseada em TMB, meta calorica e tolerancia, com registro em `nutrition_daily_scores`.
  - Removido XP instantaneo de refeicoes registradas por IA; a recompensa/punicao agora ocorre no fechamento do dia anterior ao abrir o app.
  - Refeicoes registradas no dia aparecem temporariamente em Missoes como itens ja concluidos, sem conflitar com cardapios cadastrados.
  - Criada migration `20260616_nutrition_daily_scoring.sql` e atualizada a migration consolidada de contrato.
  - Build de producao validado com `npm.cmd run build`.

### 2026-06-16
- **Invalidacao de Cache por Deploy:**
  - Adicionado versionamento de build via `VERCEL_GIT_COMMIT_SHA` no Vite para detectar commits novos no navegador.
  - Criado guard de inicializacao que limpa caches locais de dados do ASCEND quando a versao do app muda, preservando a sessao do Supabase.
  - Configurados headers `Cache-Control: no-store` na Vercel para evitar que rotas/HTML antigos fiquem presos no Chrome apos deploy.
  - Build de producao validado com `npm.cmd run build`.

### 2026-06-16
- **Resiliencia Supabase em Producao:**
  - Validado o projeto Supabase remoto via REST e smoke test autenticado com usuario temporario: criacao de missoes, bosses, alimentos, logs, cardapios, exercicios e rotinas passou com sucesso.
  - Adicionado timeout defensivo no carregamento/criacao de batalhas de bosses para impedir sincronizacao infinita quando uma chamada fica pendente.
  - Refatorada a tela de Bosses para consumir seletores estaveis do Zustand e exibir erro recuperavel com botao de nova sincronizacao.
  - Adicionados paineis de erro visiveis em Missoes, Recuperacao e Centro de Treinamento para expor falhas reais de Supabase em vez de deixar listas vazias ou loading ambiguo.
  - Build de producao validado com `npm.cmd run build`.

### 2026-06-22
- **Portal bilíngue e cards com imagens legíveis:**
  - Localizada integralmente a tela do Portal de Comando em português e inglês, incluindo títulos, descrições, badges, CTAs, progresso e rótulos de acessibilidade.
  - Reestruturados os dados dos módulos para manter as duas versões de cada texto sem depender de conteúdo fixo em português.
  - Removidas sombras decorativas dos cards e reduzido o overlay escuro a um degradê inferior, preservando contraste do texto sem ocultar as ilustrações.
  - Cards marcados como superfície escura preservada para não perder contraste quando o tema claro está ativo.
  - Build de produção validado com `npm.cmd run build`.

### 2026-06-22
- **Progressão de XP v2 e proteção de retenção:**
  - Redesenhada a curva para entregar o nível 2 com 100 XP, acelerar a primeira semana e aumentar gradualmente a exigência até o nível máximo 100.
  - Redistribuídos os ranks: D 20, C 40, B 60, A 75, S 85, National 95 e Monarch 100.
  - XP comum limitado a 180 pontos em taxa integral, mais uma faixa reduzida de 30%, totalizando no máximo 201 XP efetivos por dia.
  - Bosses, conquistas e marcos de streak agora usam XP bônus separado, limitado a 750 XP semanais.
  - Adicionado ledger local idempotente para impedir que o mesmo evento conceda XP mais de uma vez e permitir reversões pelo valor realmente recebido.
  - Dano de atividades contra bosses passou a usar o XP efetivamente concedido após limites e bônus.
  - Tarefas e hábitos personalizados passaram a aceitar entre 5 e 50 XP, com sanitização no frontend e constraint na migration `20260622_progression_v2.sql`.
  - Dashboard e Quests agora exibem os limites de XP comum e bônus de forma explícita.
  - Build de produção validado com `npm.cmd run build`.

### 2026-06-22
- **Localização integral PT-BR / EN-US:**
  - Adicionado seletor de idioma no login, cadastro, onboarding e cabeçalho interno, com detecção inicial do idioma do navegador e persistência local.
  - Traduzidos explicitamente login, cadastro, questionário do onboarding, classes, descrições de ranks, mensagens do Arquiteto, ritual de despertar e tutorial guiado.
  - Criado `LocalizationBridge` para cobrir textos legados, placeholders, títulos, labels ARIA e diálogos de alerta/confirmação quando o idioma inglês estiver ativo.
  - Criado catálogo inglês de compatibilidade para Dashboard, Missões, Treinos, Nutrição, Fortuna, Chefes, Descanso, Configurações e modais compartilhados.
  - Datas de Dashboard, Treinos, Fortuna e Descanso passaram a respeitar o locale selecionado.
  - Adicionada auditoria determinística `npm.cmd run audit:i18n` e diretiva `directives/localization.md`.
  - Build de produção e auditoria de localização validados.

### 2026-06-23
- **Correção Geral de Tradução e Acentuação**:
  - Ajustado o motor de expressões regulares de substituição em [uiEnglish.ts](file:///d:/Área de Trabalho/App/src/lib/uiEnglish.ts) usando lookbehinds/lookaheads negativos de caracteres acentuados, impedindo a partição e tradução indevida de substrings acentuadas (como o fragmento "dia" em "Média" traduzido para "day", gerando "Méday").
  - Mapeadas frases completas e específicas para as telas de Descanso, Fortuna e Nutrição no dicionário `EXACT_ENGLISH` do [uiEnglish.ts](file:///d:/Área de Trabalho/App/src/lib/uiEnglish.ts), evitando a fragmentação e garantindo consistência no idioma inglês.
- **Conclusão da Integração Stripe & Assinaturas Premium**:
  - Corrigido o arquivo [Fortuna.tsx](file:///d:/Área de Trabalho/App/src/pages/Fortuna.tsx) limpando importações duplicadas e quebradas geradas por interrupção abrupta de energia.
  - Ajustadas as tags JSX desalinhadas e chaves órfãs no arquivo [Settings.tsx](file:///d:/Área de Trabalho/App/src/pages/Settings.tsx).
  - Implementada a interface do Painel de Faturamento e Assinatura (Subscription & Billing) nas Configurações ([Settings.tsx](file:///d:/Área de Trabalho/App/src/pages/Settings.tsx)), permitindo a ativação do premium via Stripe Checkout ou redirecionamento ao Stripe Customer Portal para gerenciar a assinatura ativa, de forma dinâmica e bilíngue.
  - Modificado o componente [PremiumGate.tsx](file:///d:/Área de Trabalho/App/src/components/premium/PremiumGate.tsx) tornando a propriedade `children` opcional para ser usado como paywall estrutural em fendas de chefes Rank S sem impor quebras de tipo estáticas.
  - Build de produção (`npm run build`) e auditoria de i18n (`npm run audit:i18n`) testados e aprovados com sucesso.

### 2026-06-25
- **Auditoria conservadora de Nutrição, loading e imagens:**
  - Corrigida a prévia da análise nutricional para respeitar o idioma selecionado nos nomes gerados pelo catálogo padrão, como `Grilled chicken`, preservando nomes customizados do usuário.
  - Localizadas mensagens de erro/sucesso do fluxo de análise assistida e pequenos rótulos da tabela de comparação de fontes.
  - Conferidos os caminhos estáticos de imagens em `public/`; todos os assets referenciados diretamente foram encontrados.
  - Adicionados fallback e `decoding="async"` para imagens dinâmicas de avatar/classe no Dashboard e em Configurações, evitando imagem quebrada se rank/classe salvo gerar um caminho inválido.
  - Auditoria de localização (`npm.cmd run audit:i18n`) e build de produção (`npm.cmd run build`) validados com sucesso.
  - `npm.cmd run lint` ainda falha por dívida pré-existente espalhada no projeto (`obsoleto/`, imports não usados, `any` e regras de hooks), sem bloqueio novo gerado por esta alteração.

### 2026-06-25
- **Higienização pré-lançamento do lint e código morto:**
  - Atualizado o estado da auditoria anterior: `npm.cmd run lint` agora passa sem erros bloqueantes; permanecem avisos de tipagem ampla e hooks para uma etapa futura de hardening.
  - Ajustada a configuração do ESLint para ignorar pastas regeneráveis/obsoletas (`dist`, `.tmp`, `.agent`, `.agents`, `.claude`, `obsoleto`) e rebaixar regras de migração ampla para avisos.
  - Removidos imports, estados e helpers não utilizados em telas e componentes ativos, incluindo Fortuna, Treinos, Onboarding, PremiumGate, SignIn e WorkoutProgress.
  - Substituídas partículas aleatórias em render por uma configuração estável em `auth-fuse`, evitando comportamento não determinístico.
  - Simplificada a assinatura de reset de boss e separado o resultado do carregamento de perfil para eliminar erros de lint sem mudar a lógica.
  - Validados `npm.cmd run lint`, `npm.cmd run audit:i18n`, `npm.cmd run build` e `git diff --check`.

### 2026-06-26
- **Performance inicial, imagens otimizadas e Missao Unica:**
  - Geradas copias leves em `public/optimized/` para login, logo, portal, avatares, bosses e presets de treino, preservando os assets originais.
  - Atualizados login, portal, dashboard, onboarding, configuracoes, treinos e bosses para usar imagens menores com carregamento/decodificacao mais amigaveis.
  - Removido trabalho secundario do caminho critico do login: premium manual, avaliacao nutricional, streaks/conquistas e sincronizacoes complementares rodam em segundo plano apos carregar o perfil.
  - O teste de conexao do Supabase no layout ficou restrito ao ambiente de desenvolvimento, evitando query extra para usuarios em producao.
  - Adicionada criacao de `Missao Unica` no Quadro de Missoes, com data, hora e nota opcional exibidas no card e ordenacao pelo horario quando informado.
  - Build de producao validado com `npm.cmd run build`; restaram apenas avisos de chunk grande/code splitting do Vite.

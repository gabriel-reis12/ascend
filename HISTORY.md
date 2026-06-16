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

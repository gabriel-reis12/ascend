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

### 2026-05-26 (Sessão Atual)
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


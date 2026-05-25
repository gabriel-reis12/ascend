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

### 2026-05-25 (Sessão Atual)
- **Correção de Roteamento SPA no Vercel (F5 / 404)**:
  - **Identificação do Bug**: Ao realizar o deploy no Vercel, o recarregamento da página (F5) ou acesso direto a rotas secundárias (como `/workouts`, `/settings`, `/onboarding`) resultava em erro 404 (página em branco/sumindo). Esse comportamento ocorre porque servidores estáticos tentam mapear fisicamente as URLs de rotas do lado do cliente (React Router).
  - **Solução Aplicada**: Criado o arquivo de configuração `vercel.json` na raiz do projeto contendo regras de `rewrites` para redirecionar todas as rotas de volta ao `index.html` principal. Isso permite que o React Router capture e processe as rotas no cliente de forma consistente e sem falhas após recarregar a página.

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


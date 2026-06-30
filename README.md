# ⚔️ RPG Tracker: Hunter System 🌌

> *"Desperte o seu verdadeiro potencial. Monitore suas quests, treine seus atributos e suba de Rank até o topo."*

O **RPG Tracker: Hunter System** é uma aplicação web gamificada ultra-premium, inspirada no universo de *Solo Leveling* e estética *Cyberpunk/Sci-Fi*. Projetada para desenvolvedores e entusiastas de RPG, a plataforma transforma a gestão de produtividade, rotinas de treino e planejamento nutricional em uma jornada de evolução de atributos RPG em tempo real.

---

## 🌟 Recursos Principais

### 1. 📊 HUD de Status & Ficha de Caçador (RPG Engine)
* **Atributos Dinâmicos:** Fortaleça **Força (FOR)**, **Inteligência (INT)**, **Resistência (RES)**, **Vitalidade (VIT)** e **Disciplina (DIS)** completando quests diárias correspondentes.
* **Curva de Experiência Calibrada:** Sistema de subida de nível cumulativo e barra de progresso animada até atingir o ápice do **Level 100**.
* **Radar de Combate:** Gráficos interativos no estilo Radar para visualização e distribuição tridimensional de seus atributos de combate.

### 2. 🎴 Avatares Dinâmicos de Classe & Rank
* **4 Classes Oficiais:** Escolha sua vocação entre **Warrior** (Guerreiro), **Scholar** (Erudito), **Monk** (Monge) ou **Titan** (Titã).
* **Evolução de Rank Reativa:** O seu avatar é atualizado automaticamente em tempo real sempre que você sobe de Rank (**Rank E** a **Rank S**).
* **Resiliência de Ranks Especiais:** Suporte a Ranks de prestígio lendários (**National** e **Monarch**) com normalização inteligente.

### 3. 📅 Quests Diárias, Calendário Semanal & Codex
* **Recorrência Semanal Customizada:** Crie hábitos (Quests) que se repetem reativamente apenas nos dias da semana que você selecionar.
* **Codex do Caçador:** Uma tabela interativa RPG com presets holográficos e presets prontos de hábitos do mundo real (Leitura, Código, Academia, Alimentação) com conversão precisa em recompensas de XP e atributos.

### 4. 🌀 Fenda de Anomalia IA (Quest Extra Groq)
* **Geração Inteligente:** Abra fendas diárias invocando a IA (`meta-llama/llama-4-scout-17b-16e-instruct`) para gerar um desafio personalizado e uma lore imersiva baseada em sua classe atual e no foco escolhido.
* **Restrição Solar Estrita:** Proteção nativa que detecta data e fuso horário, limitando a criação de quests IA a apenas uma por dia local.

### 5. 🏋️ Módulo de Treinamento & Logs
* **Gestão de Rotinas:** Crie, edite e reordene exercícios em suas fichas de treino semanais (A, B, C...).
* **Log Inteligente:** O sistema pré-carrega automaticamente a última carga e repetições salvas para manter sua evolução em foco.
* **Gráficos de Evolução:** Monitore seu **Volume Semanal** de treino e acompanhe seus **Recordes Pessoais (PRs)** em tempo real.

### 6. 🍎 Módulo de Nutrição (Mana Recovery)
* **Planejamento de Calorias:** Rastreie o consumo calórico diário e visualize a divisão de macronutrientes com gráficos circulares.
* **Sincronização de Vitalidade:** A conclusão de suas refeições concede **+15 XP** e **+1 Vitalidade (VIT)** instantaneamente ao seu caçador.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend:** [React 19](https://react.dev/), [Vite](https://vite.dev/), [TypeScript](https://www.typescriptlang.org/)
* **Estilização:** CSS Vanilla + Design Tokens de alta performance e glows neon dinâmicos
* **Gerenciamento de Estado:** [Zustand](https://github.com/pmndrs/zustand)
* **Backend:** [Supabase](https://supabase.com/) (Autenticação, Database Postgres & APIs em tempo real)
* **Animações:** [Framer Motion](https://www.framer.com/motion/) e [Lucide Icons](https://lucide.dev/)
* **Inteligência Artificial:** Integração via API [Groq Cloud](https://groq.com/)

---

## 🚀 Como Iniciar Localmente

### Pré-requisitos
Certifique-se de possuir o [Node.js](https://nodejs.org/) instalado em sua máquina.

### Passos para Instalação

1. **Clone o repositório:**
   ```bash
   git clone <URL_DO_SEU_REPOSITORIO>
   cd App
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env.local` na raiz do projeto com as suas credenciais do Supabase e Groq:
   ```env
   VITE_SUPABASE_URL=seu_supabase_url
   VITE_SUPABASE_ANON_KEY=sua_supabase_anon_key
   VITE_GROQ_API_KEY=sua_groq_api_key
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

---

## 🛡️ Licença

Este projeto é desenvolvido para fins acadêmicos e pessoais de produtividade RPG. Todos os direitos reservados.

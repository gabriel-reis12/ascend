# Especificação de Ideias e Planejamento de Expansão (Ascend)

Este documento registra todas as 16 novas funcionalidades e mecânicas divididas em 4 grandes épicos de evolução do projeto.

---

## 🌌 Épico 1: A Fundação & O Despertar (Onboarding e Estrutura de Dados)
A fundação do sistema, mapeando novos atributos e estabelecendo o rito de passagem para o caçador.

1. **Visão & Posicionamento:** Foco na evolução em 5 dimensões vitais: Corpo, Mente, Fortuna, Carreira e Equilíbrio.
2. **Novo Onboarding (Fluxo Sequencial):** Fluxo moderno que captura:
   - Informações Básicas (Nome, Nascimento)
   - Perfil Físico (Altura, Peso atual, Peso meta, Foco de treino)
   - Objetivo Principal (Vida, Saúde, Finanças, Carreira)
   - Nível de Experiência do Usuário (Iniciante, Intermediário, Avançado)
3. **Questionário de Classe:** Direcionamento algorítmico do caçador com base em suas respostas para uma das 5 classes:
   - **Warrior** (Força/Resistência)
   - **Scholar** (Estudos/Mente)
   - **Creator** (Criação/Carreira/Ideias)
   - **Monk** (Calma/Meditação/Vitalidade)
   - **Leader** (Liderança/Gestão/Finanças)
4. **Tela de Despertar:** Recompensa visual e animação de impacto ao concluir o questionário ("*Despertar concluído. Classe identificada: [Classe]*").
5. **Reestruturação de Atributos:** Mapeamento exato de 7 atributos no banco de dados e no store:
   - `FOR` (Força - `strength`)
   - `RES` (Resistência - `endurance`)
   - `VIT` (Vitalidade - `vitality`)
   - `INT` (Estudo - `intelligence`)
   - `DIS` (Disciplina - `discipline`)
   - `WIS` (Sabedoria - `wisdom` - *Novo!*)
   - `BAL` (Equilíbrio - `balance` - *Novo!*)

---

## ⚙️ Épico 2: Motor de Jogo & Gamificação (Core Mechanics)
A engrenagem mecânica que comanda a retenção, a consistência e a progressão matemática.

6. **Domínios da Evolução:** Dashboard central com progresso em 5 áreas de vida:
   - **Corpo** (atrelado a FOR, RES, VIT)
   - **Mente** (atrelado a INT)
   - **Fortuna** (atrelado a WIS)
   - **Carreira** (atrelado a DIS)
   - **Equilíbrio** (atrelado a BAL)
7. **XP 2.0 (Missões Principais):** Tarefas fixas essenciais responsáveis por 80% do XP diário (Trabalhar, Estudar, Treinar, etc.).
8. **Sistema Anti-Farm:** Retornos decrescentes de XP ao repetir a mesma tarefa no mesmo dia, incentivando a diversificação.
9. **Bônus de Consistência:** Multiplicadores e recompensas de XP para streaks contínuas em marcos (3 dias, 7 dias, 30 dias até 365 dias).
10. **Títulos & Conquistas:** Desbloqueio de insígnias (badges) e nomenclatura especial baseada no estilo de jogo (ex: *Iron Mind*, *Financial Strategist*).

---

## 🤖 Épico 3: Módulos de Expansão & Inteligência Artificial (Funcionalidades)
Ferramentas de utilidade prática que agregam valor diário de forma inteligente e interativa.

11. **IA Nutricional:** Chat ou input inteligente de texto livre ("*Comi 200g de arroz e 150g de frango*") processado por IA para calcular macronutrientes automaticamente, recompensando com XP e VIT.
12. **As Fendas (Missões de IA):** Adaptação do portal de anomalias com IA para gerar tarefas práticas de acordo com as necessidades do caçador (ex: "*Simule seu patrimônio*" ou "*Analise os gastos da semana*").
13. **Biblioteca de Treinos:** Banco de rotinas prontas para importação (PPL, Upper-Lower, ABCDE, Híbrido, Em Casa) com cards ilustrados de cada divisão.
14. **Módulo Fortuna:** Registro financeiro simplificado (gastos, aportes, evolução patrimonial) que alimenta diretamente o atributo `WIS`.
15. **Bosses Semanais:** Batalhas de consistência semanais contra vilões (ex: *Senhor da Procrastinação* com 100 HP). Cada hábito ou quest diária cumprida desfere dano ao boss.

---

## 🎨 Épico 4: Imersão & "Juice" (Front-end, Design e Polimento)
O refino estético e sensorial que torna o aplicativo inesquecível, tátil e viciante.

16. **Direção de Arte (Assets Visuais):** Geração e integração de 20 assets oficiais (5 Classes, 5 Bosses, 4 Treinos, 6 Ranks de E a S).
17. **Micro Animações (Framer Motion):** Transições fluidas ao completar tarefas, interagir com cards e barras de carregamento.
18. **Eventos de Level Up:** Efeitos em tela cheia com animação de partículas ao subir de nível.
19. **Eventos de Rank Up:** Cutscenes ou efeitos cinematográficos raros na transição de categorias (E -> D -> C -> B -> A -> S).
20. **Sound Design:** Mapeamento e acionamento de efeitos sonoros premium nas ações chaves (Despertar, subida de nível, dano em boss, conclusão de quests).

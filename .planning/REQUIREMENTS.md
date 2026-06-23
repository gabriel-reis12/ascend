# Requirements

Documento detalhado de requisitos extraídos do `Features.txt`.

## 1. Gamificação e RPG (Core)
- O usuário deve possuir "Status" (ex: Força, Inteligência, Resistência) que são afetados por tarefas diárias.
- Sistema de Experiência (XP): Ao atingir "x" de XP, o usuário sobe de nível.
- A progressão deve recompensar rapidamente o onboarding, aumentar por faixas até o nível 100 e separar XP comum de recompensas bônus.
- XP comum deve possuir limite diário transparente; bosses, streaks e conquistas usam um limite bônus semanal separado.
- Atividades configuráveis devem ter recompensas entre 5 e 50 XP e não podem conceder XP novamente para o mesmo evento.
- Sistema de Títulos: O nível desbloqueia títulos legais baseados em RPG (ex: Iniciante, Recruta, Soldado, Mestre).

## 2. Tarefas e Hábitos
- O usuário pode adicionar tarefas e atribuí-las a categorias (musculação, alimentação, leitura, água, hobbys, trabalhos).
- O cumprimento da tarefa impacta os status de forma correspondente (ex: Ler aumenta Inteligência).

## 3. Musculação (Workouts)
- O usuário pode criar múltiplas fichas de treino.
- Contador de quantas vezes o treino foi realizado.
- Para cada treino: Mostrar exercício, carga utilizada e repetições.
- UI: Coluna lado-a-lado para comparar a carga da semana anterior com a atual e indicar progresso (seta verde se subiu, etc).

## 4. Alimentação (Nutrition)
- O usuário pode registrar refeições.
- Deve permitir a inclusão de calorias aproximadas por refeição (ex: 4 ovos + 2 pães = ~500 kcal).
- Dashboard visual das calorias diárias.

## 5. Autenticação
- Sistema de login e registro para que múltiplos usuários possam usar o app na mesma instalação/servidor, mantendo dados isolados.

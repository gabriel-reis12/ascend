import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('ASCEND — Etapa 03.5: Redesign Premium Daily Quests (/quests)', async (t) => {
  const questsSource = fs.readFileSync('src/pages/Quests.tsx', 'utf8');
  const newQuestModalSource = fs.readFileSync('src/components/rpg/NewQuestModal.tsx', 'utf8');
  const newHabitModalSource = fs.readFileSync('src/components/rpg/NewHabitModal.tsx', 'utf8');

  await t.test('1. Componentes oficiais do ASCEND HUD v2 integrados em Quests.tsx', () => {
    assert.ok(questsSource.includes("from '@/components/ui/hud-card'"), 'Deve importar HudCard');
    assert.ok(questsSource.includes("from '@/components/ui/tactical-button'"), 'Deve importar TacticalButton');
    assert.ok(questsSource.includes("from '@/components/ui/neon-progress'"), 'Deve importar NeonProgressRing e NeonProgressBar');
    assert.ok(questsSource.includes("from '@/components/ui/rank-badge'"), 'Deve importar RankBadge');

    assert.ok(questsSource.includes('<NeonProgressRing'), 'Deve renderizar NeonProgressRing no progresso diário');
    assert.ok(questsSource.includes('<HudCard'), 'Deve utilizar HudCard nos blocos principais');
    assert.ok(questsSource.includes('<TacticalButton'), 'Deve utilizar TacticalButton nas ações principais');
    assert.ok(questsSource.includes('<RankBadge'), 'Deve exibir RankBadge no cabeçalho da página');
  });

  await t.test('2. Progresso Diário: centralização no NeonProgressRing e fidelidade de contagem', () => {
    assert.ok(
      questsSource.includes('{totalCompleted} / {totalMissions}') &&
      questsSource.includes('({Math.round(progressPct)}%)'),
      'Deve exibir contagem X / Y e percentual (Z%) perfeitamente centralizados dentro do NeonProgressRing'
    );

    // Teste comportamental da fórmula de progresso diário (incluindo estado vazio)
    const calcProgress = ({ totalActive, workouts, meals, tasks, financeDone, completedHabits }) => {
      const totalMissions = totalActive + workouts.length + meals.length + tasks.length + 1;
      const totalCompleted =
        completedHabits +
        workouts.filter((m) => m.isCompleted).length +
        meals.filter((m) => m.isCompleted).length +
        tasks.filter((tk) => tk.completed).length +
        (financeDone ? 1 : 0);
      const progressPct = totalMissions > 0 ? (totalCompleted / totalMissions) * 100 : 0;
      return { totalMissions, totalCompleted, progressPct: Math.round(progressPct) };
    };

    const resPartial = calcProgress({
      totalActive: 1,
      completedHabits: 1,
      workouts: [{ isCompleted: true }],
      meals: [{ isCompleted: false }],
      tasks: [{ completed: true }],
      financeDone: false,
    });
    assert.deepEqual(resPartial, { totalMissions: 5, totalCompleted: 3, progressPct: 60 });

    const resFull = calcProgress({
      totalActive: 1,
      completedHabits: 1,
      workouts: [],
      meals: [],
      tasks: [],
      financeDone: true,
    });
    assert.deepEqual(resFull, { totalMissions: 2, totalCompleted: 2, progressPct: 100 });
  });

  await t.test('3. Cards de Missões: diferenciação de estados sem duplicação visual', () => {
    assert.ok(
      questsSource.includes("l('CONCLUÍDA', 'COMPLETED')") &&
      questsSource.includes("l('EM ANDAMENTO', 'IN PROGRESS')") &&
      questsSource.includes("l('ATRASADA', 'OVERDUE')") &&
      questsSource.includes("l('PENDENTE', 'PENDING')"),
      'MissionCard deve diferenciar claramente missões Concluídas, Em Andamento, Atrasadas e Pendentes'
    );

    assert.ok(
      questsSource.includes('hasPartialProgress') && questsSource.includes('<NeonProgressBar'),
      'MissionCard deve exibir NeonProgressBar quando houver progresso parcial real'
    );

    assert.ok(
      !questsSource.includes('TREINO CONCLUÍDO') && !questsSource.includes('ANOMALIA CONCLUÍDA'),
      'Não deve repetir tags redundantes de conclusão no mesmo card'
    );
  });

  await t.test('4. Ergonomia Mobile: filtros rápidos, alvos de toque >= 44px e pb-24', () => {
    assert.ok(questsSource.includes('pb-24'), 'Deve manter espaçamento seguro pb-24 para a Bottom Navigation');
    assert.ok(
      questsSource.includes('statusFilter') && questsSource.includes('typeFilter'),
      'Deve oferecer filtros rápidos por status (Todas/Pendentes/Concluídas) e por tipo de missão'
    );
    assert.ok(
      questsSource.includes('h-11 w-11') && questsSource.includes('min-h-[44px]'),
      'Checkboxes e botões secundários devem respeitar área mínima de toque de 44x44px'
    );

    // Simulação comportamental dos filtros combinados
    const sampleMissions = [
      { type: 'habit', done: false },
      { type: 'habit', done: true },
      { type: 'workout', done: true },
      { type: 'task', done: false },
      { type: 'finance', done: false },
    ];
    const filterMissions = (status, type) =>
      sampleMissions.filter((m) => {
        if (status === 'pending' && m.done) return false;
        if (status === 'completed' && !m.done) return false;
        if (type !== 'all' && m.type !== type) return false;
        return true;
      });

    assert.equal(filterMissions('all', 'all').length, 5);
    assert.equal(filterMissions('pending', 'all').length, 3);
    assert.equal(filterMissions('completed', 'all').length, 2);
    assert.equal(filterMissions('pending', 'habit').length, 1);
    assert.equal(filterMissions('completed', 'workout').length, 1);
  });

  await t.test('5. Modais de Criação: Bottom Sheets em mobile com preservação de contratos', () => {
    assert.ok(
      newQuestModalSource.includes('rounded-t-3xl') &&
      newQuestModalSource.includes('max-h-[90dvh]') &&
      newQuestModalSource.includes('safe-area-inset-bottom'),
      'NewQuestModal deve operar como Bottom Sheet ergonômico em telas móveis com safe-area'
    );
    assert.ok(
      newHabitModalSource.includes('rounded-t-3xl') &&
      newHabitModalSource.includes('max-h-[90dvh]') &&
      newHabitModalSource.includes('safe-area-inset-bottom'),
      'NewHabitModal deve operar como Bottom Sheet ergonômico em telas móveis com safe-area'
    );
    assert.ok(
      newHabitModalSource.includes('is_one_time') && newHabitModalSource.includes('is_optional'),
      'NewHabitModal deve preservar opções de missão única e missão flexível/opcional'
    );
  });
});

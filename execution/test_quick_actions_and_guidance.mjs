import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  QUICK_ACTIONS_CATALOG,
  DEFAULT_PINNED_ACTION_IDS,
  MAX_PINNED_ACTIONS,
  MIN_PINNED_ACTIONS,
  getQuickActionById,
} from '../src/lib/quickActionsCatalog.ts';

test('ASCEND — Ações Rápidas, Favoritos Manuais, Sugestões Determinísticas & Orientação do Caçador', async (t) => {
  const quickMenu = fs.readFileSync('src/pages/QuickMenu.tsx', 'utf8');
  const catalogFile = fs.readFileSync('src/lib/quickActionsCatalog.ts', 'utf8');
  const storeFile = fs.readFileSync('src/stores/useQuickActionsStore.ts', 'utf8');
  const modalFile = fs.readFileSync('src/components/home/SafeActionConfirmModal.tsx', 'utf8');
  const customizerFile = fs.readFileSync('src/components/home/QuickActionsCustomizerModal.tsx', 'utf8');
  const guidanceFile = fs.readFileSync('src/components/home/HunterGuidanceCard.tsx', 'utf8');

  await t.test('1. Catálogo oficial de Ações Rápidas existe com 10 ações e metadados completos', () => {
    assert.equal(QUICK_ACTIONS_CATALOG.length, 10, 'Deve conter 10 ações no catálogo');
    assert.equal(MAX_PINNED_ACTIONS, 6, 'Limite máximo de atalhos fixados deve ser 6');
    assert.equal(MIN_PINNED_ACTIONS, 1, 'Limite mínimo de atalhos fixados deve ser 1');
    assert.deepEqual(
      DEFAULT_PINNED_ACTION_IDS,
      ['quests_complete', 'workouts_log', 'nutrition_log', 'mind_temple'],
      'Atalhos padrão devem cobrir missões, treinos, nutrição e mente'
    );

    for (const action of QUICK_ACTIONS_CATALOG) {
      assert.ok(action.id, 'Ação deve ter id único');
      assert.ok(action.titlePt && action.titleEn, `Ação ${action.id} deve ter títulos bilíngues`);
      assert.ok(action.sublabelPt && action.sublabelEn, `Ação ${action.id} deve ter subtítulos bilíngues`);
      assert.ok(action.path.startsWith('/'), `Ação ${action.id} deve ter rota válida iniciando com /`);
    }

    assert.ok(getQuickActionById('workouts_log'), 'getQuickActionById deve localizar workouts_log');
    assert.ok(getQuickActionById('repeat_recent_meal')?.canRepeatDirectly, 'repeat_recent_meal deve ter flag canRepeatDirectly');
  });

  await t.test('2. Store de Ações Rápidas suporta fixação (1-6), reordenação, remoção e persistência local por usuário', () => {
    assert.ok(storeFile.includes('pinAction'), 'Store deve implementar pinAction');
    assert.ok(storeFile.includes('unpinAction'), 'Store deve implementar unpinAction');
    assert.ok(storeFile.includes('reorderAction'), 'Store deve implementar reorderAction');
    assert.ok(storeFile.includes('toggleRecentSuggestions'), 'Store deve implementar toggleRecentSuggestions');
    assert.ok(storeFile.includes('toggleHunterGuidance'), 'Store deve implementar toggleHunterGuidance');
    assert.ok(storeFile.includes('resetToDefaults'), 'Store deve implementar resetToDefaults');
    assert.ok(storeFile.includes('clearHistory'), 'Store deve implementar clearHistory');

    // Validação de limites
    assert.ok(
      storeFile.includes('pinnedActionIds.length >= MAX_PINNED_ACTIONS'),
      'pinAction deve respeitar limite máximo de atalhos'
    );
    assert.ok(
      storeFile.includes('pinnedActionIds.length <= MIN_PINNED_ACTIONS'),
      'unpinAction deve respeitar limite mínimo de atalhos'
    );

    // Isolamento e privacidade por usuário
    assert.ok(
      storeFile.includes('ascend_quick_actions_') && storeFile.includes('ascend_action_history_'),
      'Store deve utilizar chaves isoladas no localStorage'
    );
  });

  await t.test('3. Sugestões determinísticas e recentes sem IA, sem envio a terceiros e com controle de visibilidade', () => {
    assert.ok(
      quickMenu.includes('deterministicSuggestions'),
      'QuickMenu deve computar sugestões determinísticas a partir de rotinas e refeições reais'
    );
    assert.ok(
      quickMenu.includes('showRecentSuggestions'),
      'QuickMenu deve respeitar a preferência de exibição de sugestões'
    );
    assert.ok(
      quickMenu.includes('toggleRecentSuggestions(false)'),
      'Usuário deve poder ocultar sugestões recentes com 1 clique'
    );
    assert.ok(
      !storeFile.includes('fetch(') && !storeFile.includes('analytics'),
      'Store não deve fazer telemetria externa ou requisições de tracking'
    );
  });

  await t.test('4. Fluxo de confirmação segura de repetição sem duplicação acidental nem ganho prematuro de XP', () => {
    // SafeActionConfirmModal
    assert.ok(
      modalFile.includes('SafeActionConfirmModal'),
      'Componente SafeActionConfirmModal deve existir'
    );
    assert.ok(
      modalFile.includes('handleConfirmMealRepeat') && modalFile.includes('handleConfirmTaskRepeat'),
      'Modal deve implementar handlers seguros de confirmação para refeição e tarefa'
    );
    assert.ok(
      modalFile.includes('supabase.from(\'food_logs\').insert'),
      'Repetição de refeição deve inserir log no banco com confirmação explícita'
    );
    assert.ok(
      modalFile.includes('createTask('),
      'Repetição de tarefa deve reativar como PENDENTE sem conceder XP prematuramente'
    );
    assert.ok(
      modalFile.includes('loading') && modalFile.includes('disabled={loading}'),
      'Botão de confirmação deve desabilitar durante a requisição para evitar cliques duplos'
    );
    assert.ok(
      modalFile.includes('onNavigateFallback'),
      'Caso não haja histórico para repetir, deve fornecer fallback gracioso para a tela correspondente'
    );
  });

  await t.test('5. Orientação do Caçador como guia opcional sem restrição de módulos', () => {
    assert.ok(
      guidanceFile.includes('HunterGuidanceCard'),
      'Componente HunterGuidanceCard deve existir'
    );
    assert.ok(
      guidanceFile.includes('trainingFocus') &&
      guidanceFile.includes('nutritionGoal') &&
      guidanceFile.includes('mainGoal'),
      'Orientação deve ler dados reais já persistidos no perfil do caçador'
    );
    assert.ok(
      guidanceFile.includes('toggleHunterGuidance(false)'),
      'Card deve permitir dispensar/ocultar a qualquer momento com consentimento'
    );
    assert.ok(
      guidanceFile.includes('Todos os módulos permanecem 100% disponíveis'),
      'Card deve informar explicitamente que nenhum módulo é restrito'
    );
  });

  await t.test('6. Modal de personalização (QuickActionsCustomizerModal) com HUD v2 e ergonomia mobile', () => {
    assert.ok(
      customizerFile.includes('QuickActionsCustomizerModal'),
      'Componente QuickActionsCustomizerModal deve existir'
    );
    assert.ok(
      customizerFile.includes('reorderAction(action.id, \'up\')') &&
      customizerFile.includes('reorderAction(action.id, \'down\')'),
      'Modal deve permitir reordenação para cima e para baixo'
    );
    assert.ok(
      customizerFile.includes('unpinAction(action.id)') &&
      customizerFile.includes('pinAction(action.id)'),
      'Modal deve permitir fixar e desafixar'
    );
    assert.ok(
      customizerFile.includes('resetToDefaults'),
      'Modal deve permitir restaurar atalhos aos padrões de fábrica'
    );
  });

  await t.test('7. QuickMenu integra componentes HUD v2 e preserva âncoras de tour e rotas essenciais', () => {
    assert.ok(quickMenu.includes('QuickActionsCustomizerModal'), 'QuickMenu deve renderizar modal de personalização');
    assert.ok(quickMenu.includes('SafeActionConfirmModal'), 'QuickMenu deve renderizar modal de confirmação segura');
    assert.ok(quickMenu.includes('HunterGuidanceCard'), 'QuickMenu deve renderizar card opcional de orientação');

    const essentialTourIds = [
      'tour-portal-header',
      'tour-portal-primary',
      'tour-portal-recommended',
      'tour-portal-secondary',
      'tour-shortcut-workouts',
      'tour-shortcut-nutrition',
    ];
    for (const id of essentialTourIds) {
      assert.ok(quickMenu.includes(id), `QuickMenu deve manter âncora ${id}`);
    }
  });
});


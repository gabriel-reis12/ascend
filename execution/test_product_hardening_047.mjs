import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  getCalibratedInitialStats,
  getInitialHabitPresets,
  mapMainGoalToTrainingGoal,
} from '../src/lib/onboardingRules.ts';
import { generateTrainingProtocol } from '../src/lib/trainingGenerator.ts';
import {
  isSoundEnabled,
  setSoundEnabled,
  isHapticsEnabled,
  setHapticsEnabled,
} from '../src/lib/gameFeel.ts';

const root = process.cwd();
const read = (relPath) => fs.readFileSync(path.join(root, relPath), 'utf8');

test('Fase A.1 — Contratos e Documentação refletem os 7 atributos reais sem alterar fórmulas de progressão', () => {
  const hunterStore = read('src/stores/useHunterStore.ts');
  const settings = read('src/pages/Settings.tsx');
  const gameplayRules = read('docs/ASCEND_GAMEPLAY_RULES.md');
  const archDocs = read('docs/ASCEND_ARCHITECTURE.md');
  const auditDocs = read('docs/ASCEND_GAME_DESIGN_AUDIT_360.md');

  const sevenAttributes = [
    'strength',
    'endurance',
    'intelligence',
    'discipline',
    'vitality',
    'wisdom',
    'balance',
  ];

  for (const attr of sevenAttributes) {
    assert.ok(hunterStore.includes(attr), `useHunterStore.ts deve conter o atributo ${attr}`);
    assert.ok(
      gameplayRules.toLowerCase().includes(attr),
      `ASCEND_GAMEPLAY_RULES.md deve documentar o atributo ${attr}`
    );
  }

  // Settings reset deve restaurar wisdom: 10 e balance: 10
  const wisdomMatches = settings.match(/wisdom:\s*10/g) || [];
  const balanceMatches = settings.match(/balance:\s*10/g) || [];
  assert.ok(
    wisdomMatches.length >= 2 && balanceMatches.length >= 2,
    'Settings.tsx deve resetar wisdom: 10 e balance: 10 tanto em handleResetRPG quanto em handleResetAll'
  );

  // Documentação de arquitetura deve esclarecer cache local vs offline-first
  assert.ok(
    archDocs.includes('arquitetura assistida por cache local e sessão resiliente'),
    'ASCEND_ARCHITECTURE.md deve documentar a arquitetura real de persistência local'
  );
  assert.ok(
    auditDocs.includes('Classificação Corrigida: Assistido por Cache Local, Não Offline-First Completo'),
    'ASCEND_GAME_DESIGN_AUDIT_360.md deve conter a nota de validação da Etapa 04.7'
  );
});

test('Fase B — Fluxo de Exclusão de Conta (Settings, /delete-account, Serviço e Migration Backend)', () => {
  const accountDeletionSrc = read('src/lib/accountDeletion.ts');
  assert.ok(
    accountDeletionSrc.includes('export function isValidDeletionConfirmation') &&
      accountDeletionSrc.includes('ACCOUNT_DELETION_CONFIRM_PHRASES'),
    'Serviço de exclusão deve validar confirmação explícita EXCLUIR / DELETE'
  );
  assert.ok(
    accountDeletionSrc.includes('USER_DATA_CATEGORIES_DELETED'),
    'Deve exportar a lista completa de domínios de dados que serão excluídos'
  );
  assert.ok(
    accountDeletionSrc.includes("supabase.rpc('delete_own_account')"),
    'Serviço de exclusão deve invocar a RPC segura delete_own_account no backend'
  );
  assert.ok(
    accountDeletionSrc.includes('signInWithPassword') &&
      accountDeletionSrc.includes('requirePasswordReauth'),
    'Serviço de exclusão deve suportar revalidação de identidade por senha e sessão OAuth'
  );
  assert.ok(
    accountDeletionSrc.includes('supabase.auth.signOut'),
    'Serviço de exclusão deve invalidar a sessão após concluir'
  );

  const migrationSql = read('supabase/migrations/20261109_account_deletion_and_security.sql').toLowerCase();
  assert.ok(
    migrationSql.includes('create or replace function public.delete_own_account()') &&
      migrationSql.includes('security definer'),
    'Migration SQL deve declarar public.delete_own_account() como SECURITY DEFINER'
  );
  assert.ok(
    migrationSql.includes('delete from auth.users where id ='),
    'Migration SQL deve excluir o registro de auth.users do próprio usuário autenticado'
  );

  const settingsSrc = read('src/pages/Settings.tsx');
  assert.ok(
    settingsSrc.includes('Excluir minha conta') && settingsSrc.includes('Delete my account'),
    'Settings.tsx deve oferecer a ação Excluir minha conta bilíngue'
  );

  const deletePageSrc = read('src/pages/auth/DeleteAccountPage.tsx');
  assert.ok(
    deletePageSrc.includes('executeAccountDeletion') &&
      deletePageSrc.includes('Portal de Privacidade & Exclusão'),
    'DeleteAccountPage.tsx deve oferecer o portal web de exclusão compatível com Google Play e Apple'
  );

  const loginSrc = read('src/components/ui/hunter-login.tsx');
  assert.ok(
    loginSrc.includes('/delete-account'),
    'Tela de Login deve conter link público para /delete-account'
  );
});

test('Fase C — Performance, Code-Splitting por Rota e eliminação de import dinâmico circular', () => {
  const appSrc = read('src/App.tsx');
  assert.ok(
    appSrc.includes('<PreferencesProvider>'),
    'src/App.tsx deve envolver a árvore com <PreferencesProvider> para evitar crash em usePreferences()'
  );
  assert.ok(
    appSrc.includes('Suspense') && appSrc.includes('lazy('),
    'src/App.tsx deve utilizar React.lazy e Suspense para code-splitting por rota'
  );
  assert.ok(
    appSrc.includes('<LocalizationBridge />'),
    'src/App.tsx deve preservar <LocalizationBridge />'
  );
  assert.ok(
    appSrc.includes('path="/delete-account"'),
    'src/App.tsx deve expor a rota pública /delete-account'
  );
  assert.ok(
    appSrc.includes('loadProfile(user.id)') && appSrc.includes('signOut()'),
    'src/App.tsx deve sincronizar o perfil no ProtectedRoute e oferecer opção de encerrar sessão em caso de falha'
  );

  const hunterStoreSrc = read('src/stores/useHunterStore.ts');
  assert.ok(
    !hunterStoreSrc.includes("import('./useBossStore')"),
    'useHunterStore.ts não deve conter import dinâmico circular para useBossStore'
  );
  assert.ok(
    hunterStoreSrc.includes('onHunterProfileLoaded'),
    'useHunterStore.ts deve notificar ouvintes via onHunterProfileLoaded'
  );
  assert.ok(
    hunterStoreSrc.includes('pendingRankUp: _pendingRankUp') &&
      hunterStoreSrc.includes('pendingRankUp: null'),
    'useHunterStore.ts não deve persistir pendingRankUp no localStorage para não repetir celebrações após F5 (Req 7.1)'
  );
});

test('Fase D — Onboarding Inteligente, Treinos Iniciais (A/B/C), Confirmação do Usuário e Caminho do Dia 1', () => {
  const beginnerProtocol = generateTrainingProtocol({
    goal: mapMainGoalToTrainingGoal('hypertrophy'),
    experience: 'beginner',
    frequency: 3,
    environment: 'gym',
    restrictions: [],
    durationMinutes: 60,
  });

  assert.equal(beginnerProtocol.routines.length, 3);
  assert.ok(beginnerProtocol.routines[0].name.includes('A'));
  assert.ok(beginnerProtocol.routines[1].name.includes('B'));
  assert.ok(beginnerProtocol.routines[2].name.includes('C'));

  // Respeito à disponibilidade declarada (ex: 2 dias -> 2 fichas, não obriga 3 treinos)
  const twoDayProtocol = generateTrainingProtocol({
    goal: 'weight_loss',
    experience: 'beginner',
    frequency: 2,
    environment: 'home',
    restrictions: [],
    durationMinutes: 30,
  });
  assert.equal(twoDayProtocol.routines.length, 2, 'Disponibilidade de 2 dias deve gerar apenas 2 treinos');

  // Diferenciação entre iniciante e avançado
  const advancedProtocol = generateTrainingProtocol({
    goal: 'hypertrophy',
    experience: 'advanced',
    frequency: 3,
    environment: 'gym',
    restrictions: [],
    durationMinutes: 60,
  });
  assert.notDeepEqual(
    beginnerProtocol.routines[0].exercises,
    advancedProtocol.routines[0].exercises,
    'Iniciantes e avançados devem receber prescrições distintas'
  );

  // Respeito a restrições físicas declaradas
  const restrictedProtocol = generateTrainingProtocol({
    goal: 'hypertrophy',
    experience: 'intermediate',
    frequency: 3,
    environment: 'gym',
    restrictions: ['joelho'],
    durationMinutes: 60,
  });
  const allRestrictedExerciseNames = restrictedProtocol.routines
    .flatMap((r) => r.exercises.map((e) => e.name.toLowerCase()));
  assert.ok(
    !allRestrictedExerciseNames.some((n) => n.includes('agachamento livre')),
    'Restrição de joelho deve filtrar exercícios de alto impacto articular como Agachamento Livre'
  );

  // Hábitos iniciais determinísticos
  const habits = getInitialHabitPresets('hypertrophy');
  assert.ok(habits.length >= 3);
  const calibrated = getCalibratedInitialStats('Warrior');
  assert.equal(calibrated.strength, 13);

  // Persistência canônica em habits e idempotência em onboardingSetup.ts
  const setupSrc = read('src/lib/onboardingSetup.ts');
  assert.ok(
    !setupSrc.includes("from('daily_habits')"),
    'onboardingSetup.ts não deve referenciar a tabela inexistente daily_habits'
  );
  assert.ok(
    setupSrc.includes("from('habits')"),
    'onboardingSetup.ts deve persistir hábitos iniciais na tabela canônica habits'
  );
  assert.ok(
    setupSrc.includes('confirmTrainingProgram'),
    'onboardingSetup.ts deve respeitar a confirmação do usuário (confirmTrainingProgram)'
  );

  // Onboarding.tsx permite visualizar e confirmar programa antes de ativá-lo
  const onboardingPageSrc = read('src/pages/Onboarding.tsx');
  assert.ok(
    onboardingPageSrc.includes('confirmTrainingProgram') &&
      onboardingPageSrc.includes('previewProtocol'),
    'Onboarding.tsx deve permitir inspecionar os exercícios das fichas e confirmar antes de ativar'
  );

  // HunterGuidanceCard.tsx apresenta caminho claro de entrada no Dia 1
  const guidanceSrc = read('src/components/home/HunterGuidanceCard.tsx');
  assert.ok(
    guidanceSrc.includes('Caminho do 1º Dia') &&
      guidanceSrc.includes('Como funciona o XP') &&
      guidanceSrc.includes('1ª Missão do Dia'),
    'HunterGuidanceCard.tsx deve apresentar o Caminho do Dia 1 completo e orientação breve sobre XP'
  );
});

test('Fase E — Quests Mobile Simplificadas (Hierarquia Pendentes Hoje + Filtros Compactos Expansíveis)', () => {
  const questsSrc = read('src/pages/Quests.tsx');
  assert.ok(
    questsSrc.includes("useState<'all' | 'pending' | 'completed'>('pending')"),
    "Quests.tsx deve iniciar com statusFilter = 'pending' por padrão para priorizar missões pendentes de hoje"
  );
  assert.ok(
    questsSrc.includes('showAdvancedFilters'),
    'Quests.tsx deve agrupar filtros secundários de atributo/tipo em seção compacta expansível'
  );
  assert.ok(
    questsSrc.includes('GuidedQuestModal'),
    'Quests.tsx deve preservar a coexistência entre conclusão rápida (1 toque) e modo guiado'
  );
});

test('Fase F — Feedback de Evolução, Dano em Boss e Game Feel (Som/Vibração + Reduced Motion)', () => {
  const modalSrc = read('src/components/rpg/EvolutionCelebrationModal.tsx');
  assert.ok(
    modalSrc.includes('pendingLevelUp') && modalSrc.includes('pendingRankUp'),
    'EvolutionCelebrationModal.tsx deve celebrar tanto Level-Up quanto Rank-Up separadamente'
  );

  const bossToastSrc = read('src/components/rpg/BossDamageToast.tsx');
  assert.ok(
    bossToastSrc.includes('recentDamage') &&
      bossToastSrc.includes('activeBattle') &&
      bossToastSrc.includes("location.pathname === '/bosses'"),
    'BossDamageToast.tsx deve exibir o dano real confirmado do Boss sem duplicar o feedback na tela /bosses'
  );

  const bossStoreSrc = read('src/stores/useBossStore.ts');
  assert.ok(
    bossStoreSrc.indexOf('safeUpdateBossBattle') < bossStoreSrc.indexOf('recentDamage: { id: damageEventId'),
    'useBossStore.ts deve confirmar o dano via safeUpdateBossBattle antes de emitir recentDamage (Req 7.3)'
  );

  const layoutSrc = read('src/components/layout/RPGLayout.tsx');
  assert.ok(
    layoutSrc.includes('<EvolutionCelebrationModal />') &&
      layoutSrc.includes('<BossDamageToast />'),
    'RPGLayout.tsx deve montar globalmente EvolutionCelebrationModal e BossDamageToast'
  );

  // Testar preferências de som e vibração
  setSoundEnabled(false);
  assert.equal(isSoundEnabled(), false);
  setSoundEnabled(true);
  assert.equal(isSoundEnabled(), true);

  setHapticsEnabled(false);
  assert.equal(isHapticsEnabled(), false);
  setHapticsEnabled(true);
  assert.equal(isHapticsEnabled(), true);
});

test('Fase G — Repetição Rápida de Refeições na Nutrição (Recentes, Ontem, Favoritas, Habituais, Revisão de Gramas e Lock Anti-Duplicidade)', () => {
  const repeatPanelSrc = read('src/components/nutrition/QuickMealRepeatPanel.tsx');
  assert.ok(
    repeatPanelSrc.includes('submittingLockRef') &&
      repeatPanelSrc.includes('handleAdjustReviewQty') &&
      repeatPanelSrc.includes('handleSaveTodaySlotAsFavorite') &&
      repeatPanelSrc.includes('Repetir refeição de ontem') &&
      repeatPanelSrc.includes('Combinação Habitual'),
    'QuickMealRepeatPanel.tsx deve suportar repetição de refeições de ontem/recentes, favoritas, combinações habituais, ajuste de gramas antes de confirmar e trava contra cliques duplicados'
  );

  const nutritionSrc = read('src/pages/Nutrition.tsx');
  assert.ok(
    nutritionSrc.includes('<QuickMealRepeatPanel') && nutritionSrc.includes('foods={foods}'),
    'Nutrition.tsx deve integrar o painel QuickMealRepeatPanel passando o catálogo foods'
  );
});

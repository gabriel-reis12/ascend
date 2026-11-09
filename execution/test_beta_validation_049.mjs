import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Etapa 04.9 — Validação de Configuração do Supabase & Prevenção de Silenciamento', async (t) => {
  const supabaseTs = fs.readFileSync(path.join(rootDir, 'src/lib/supabase.ts'), 'utf-8');

  assert.ok(
    supabaseTs.includes('validateSupabaseConfiguration'),
    'supabase.ts deve exportar validateSupabaseConfiguration()'
  );
  assert.ok(
    supabaseTs.includes('isSupabaseConfigured'),
    'supabase.ts deve exportar isSupabaseConfigured'
  );
  assert.ok(
    supabaseTs.includes('isTestEnvironment'),
    'supabase.ts deve identificar explicitamente o ambiente de testes'
  );
  assert.ok(
    !supabaseTs.includes('rawSupabaseUrl || \'https://placeholder.supabase.co\'') ||
      supabaseTs.includes('placeholder controlado'),
    'O cliente não deve mascarar credenciais ausentes em ambientes de produção/preview'
  );

  const authContextTs = fs.readFileSync(path.join(rootDir, 'src/contexts/AuthContext.tsx'), 'utf-8');
  assert.ok(
    authContextTs.includes('isSupabaseConfigured'),
    'AuthContext deve checar isSupabaseConfigured antes de disparar chamadas de autenticação'
  );

  const hunterLoginTs = fs.readFileSync(path.join(rootDir, 'src/components/ui/hunter-login.tsx'), 'utf-8');
  assert.ok(
    hunterLoginTs.includes('isSupabaseConfigured'),
    'hunter-login.tsx deve exibir aviso HUD visível se a infraestrutura estiver ausente'
  );
});

test('Etapa 04.9 — Experiência Instalável (PWA Manifest & Meta Tags)', async (t) => {
  const manifestPath = path.join(rootDir, 'public/manifest.webmanifest');
  assert.ok(fs.existsSync(manifestPath), 'public/manifest.webmanifest deve existir');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  assert.equal(manifest.display, 'standalone', 'PWA deve ter display standalone');
  assert.equal(manifest.start_url, '/', 'start_url deve ser /');
  assert.equal(manifest.theme_color, '#030408', 'theme_color deve respeitar o HUD v2 (#030408)');
  assert.ok(manifest.icons?.length > 0, 'PWA deve declarar ícones');

  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  assert.ok(
    indexHtml.includes('/manifest.webmanifest'),
    'index.html deve referenciar o manifest.webmanifest'
  );
  assert.ok(
    indexHtml.includes('name="theme-color" content="#030408"'),
    'index.html deve conter meta theme-color #030408'
  );
  assert.ok(
    indexHtml.includes('name="apple-mobile-web-app-capable" content="yes"'),
    'index.html deve habilitar standalone no iOS Safari'
  );
  assert.ok(
    indexHtml.includes('rel="apple-touch-icon"'),
    'index.html deve declarar apple-touch-icon'
  );
});

test('Etapa 04.9 — Sistema de Observabilidade do Beta (Sem Vazamento de PII/Tokens)', async (t) => {
  const obsModule = await import('../src/lib/betaObservability.ts');

  // Teste de sanitização de segurança
  const unsafeText = 'Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.sig password="mySecretPassword123" card: 4111-2222-3333-4444';
  const sanitized = obsModule.sanitizeReportText(unsafeText);

  assert.ok(!sanitized.includes('eyJhbGci'), 'Sanitização deve ocultar tokens JWT');
  assert.ok(!sanitized.includes('mySecretPassword123'), 'Sanitização deve ocultar senhas');
  assert.ok(!sanitized.includes('4111-2222-3333-4444'), 'Sanitização deve ocultar cartões');
  assert.ok(sanitized.includes('[TOKEN_SANITIZED]'), 'Deve aplicar placeholder de token');
  assert.ok(sanitized.includes('[REDACTED]'), 'Deve aplicar placeholder de credencial');

  // Teste de formatação Markdown
  const testReport = {
    id: 'BETA-20261109-TEST1',
    createdAt: new Date().toISOString(),
    device: {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
      viewport: '390x844 (ratio: 3)',
      language: 'pt-BR',
      isMobile: true,
      platform: 'iPhone',
    },
    screen: '/workouts',
    title: 'Falha ao registrar série 3',
    stepsToReproduce: '1. Iniciar Treino A\n2. Clicar em completar série 3',
    expectedResult: 'Série ficar verde',
    actualResult: 'Botão não respondeu',
    severity: 'high',
    status: 'open',
    appVersion: '0.4.9-beta',
    buildMode: 'production',
  };

  const md = obsModule.formatBetaReportAsMarkdown(testReport);
  assert.ok(md.includes('[BETA-20261109-TEST1]'), 'Markdown deve conter o ID do problema');
  assert.ok(md.includes('🟠 Alta'), 'Markdown deve formatar a gravidade com badge visual');
  assert.ok(md.includes('/workouts'), 'Markdown deve conter a tela afetada');
  assert.ok(md.includes('390x844'), 'Markdown deve conter dados de viewport mobile');
});

test('Etapa 04.9 — Auditoria Estrita de Segurança na Exclusão de Conta (RPC & RLS)', async (t) => {
  const sqlPath = path.join(rootDir, 'supabase/migrations/20261109_account_deletion_and_security.sql');
  assert.ok(fs.existsSync(sqlPath), 'Migration SQL deve existir localmente');

  const sql = fs.readFileSync(sqlPath, 'utf-8');

  // Verificação de privilégios e search_path
  assert.ok(sql.includes('security definer'), 'RPC delete_own_account deve ser security definer');
  assert.ok(sql.includes('set search_path = public, auth'), 'search_path deve ser explicitamente restrito a public, auth');
  assert.ok(sql.includes('v_user_id := auth.uid()'), 'Deve capturar auth.uid()');
  assert.ok(sql.includes('if v_user_id is null then'), 'Deve validar explicitamente a autenticação');
  assert.ok(sql.includes('revoke all on function public.delete_own_account() from public, anon;'), 'Deve revogar execute de public e anon');
  assert.ok(sql.includes('grant execute on function public.delete_own_account() to authenticated;'), 'Deve conceder execute apenas a authenticated');

  // Verificação de ordem topológica de deleção (filhos antes dos pais)
  const mealPlanItemsPos = sql.indexOf('delete from public.meal_plan_items');
  const mealPlansPos = sql.indexOf('delete from public.meal_plans');
  assert.ok(mealPlanItemsPos !== -1 && mealPlansPos !== -1 && mealPlanItemsPos < mealPlansPos, 'meal_plan_items deve ser deletado antes de meal_plans');

  const routineExercisesPos = sql.indexOf('delete from public.routine_exercises');
  const workoutRoutinesPos = sql.indexOf('delete from public.workout_routines');
  assert.ok(routineExercisesPos !== -1 && workoutRoutinesPos !== -1 && routineExercisesPos < workoutRoutinesPos, 'routine_exercises deve ser deletado antes de workout_routines');

  const profilesPos = sql.indexOf('delete from public.profiles');
  const authUsersPos = sql.indexOf('delete from auth.users');
  assert.ok(profilesPos !== -1 && authUsersPos !== -1 && profilesPos < authUsersPos, 'profiles deve ser deletado antes de auth.users');
});

test('Etapa 04.9 — Jornadas do Beta (Contratos e Fluxos Integrados)', async (t) => {
  // Jornada A: Onboarding Inteligente semeia Treino A/B/C e Hábitos sem tela vazia
  const onboardingSetupTs = fs.readFileSync(path.join(rootDir, 'src/lib/onboardingSetup.ts'), 'utf-8');
  assert.ok(onboardingSetupTs.includes('workout_routines'), 'Onboarding deve semear rotinas de treino');
  assert.ok(
    onboardingSetupTs.includes('ascend_onboarding_routines_seeded_') &&
      onboardingSetupTs.includes('ascend_onboarding_habits_seeded_'),
    'Deve possuir flags de idempotência para evitar duplicatas em treinos e hábitos'
  );

  // Jornada B: DailyActionCenter na Home permite ações em 1 toque
  const actionCenterTs = fs.readFileSync(path.join(rootDir, 'src/components/home/DailyActionCenter.tsx'), 'utf-8');
  assert.ok(actionCenterTs.includes('handleAddWater'), 'DailyActionCenter deve permitir registrar água em 1 toque');
  assert.ok(actionCenterTs.includes('handleQuickLogSleep'), 'DailyActionCenter deve permitir registrar sono em 1 toque');
  assert.ok(actionCenterTs.includes('handleQuickCompleteHabit'), 'DailyActionCenter deve permitir completar hábito em 1 toque');

  // Jornada C: Retorno com sessão persistida sem logout indevido
  const authStorageTs = fs.readFileSync(path.join(rootDir, 'src/lib/authStorage.ts'), 'utf-8');
  assert.ok(authStorageTs.includes('ascend-auth-token'), 'authStorage deve persistir tokens sob ascend-auth-token');
});

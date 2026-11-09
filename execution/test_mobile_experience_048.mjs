import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  isSoundEnabled,
  setSoundEnabled,
  isHapticsEnabled,
  setHapticsEnabled,
} from '../src/lib/gameFeel.ts';

const root = process.cwd();
const read = (relPath) => fs.readFileSync(path.join(root, relPath), 'utf8');

test('Etapa 04.8 (Seção 7) — Verificação de Segurança da Migration 20261109_account_deletion_and_security.sql', () => {
  const sql = read('supabase/migrations/20261109_account_deletion_and_security.sql');
  const sqlLower = sql.toLowerCase();

  // 1. SECURITY DEFINER & search_path fixo
  assert.ok(
    sqlLower.includes('security definer') &&
      sqlLower.includes('set search_path = public, auth'),
    'delete_own_account() deve ser SECURITY DEFINER com set search_path = public, auth'
  );

  // 2. Validação explícita de auth.uid() para isolamento por usuário
  assert.ok(
    sqlLower.includes('v_user_id := auth.uid();') &&
      sqlLower.includes('if v_user_id is null then') &&
      sqlLower.includes('raise exception'),
    'delete_own_account() deve validar auth.uid() e abortar se não autenticado'
  );

  // 3. Permissões EXECUTE restritas a authenticated e revogadas de public e anon
  assert.ok(
    sqlLower.includes('revoke all on function public.delete_own_account() from public, anon;') &&
      sqlLower.includes('grant execute on function public.delete_own_account() to authenticated;'),
    'EXECUTE deve ser revogado de public e anon e concedido exclusivamente a authenticated'
  );

  // 4. Políticas RLS em public.profiles restritas ao role authenticated
  assert.ok(
    sqlLower.includes('on public.profiles for delete\n  to authenticated\n  using (auth.uid() = id);') ||
      sqlLower.includes('on public.profiles for delete') && sqlLower.includes('to authenticated'),
    'Políticas em public.profiles devem especificar explicitamente TO authenticated'
  );

  // 5. Limpeza de tabelas filhas (meal_plan_items, routine_exercises) e friendships (action_user_id)
  assert.ok(
    sqlLower.includes('delete from public.meal_plan_items') &&
      sqlLower.includes('delete from public.routine_exercises'),
    'Migration deve limpar tabelas filhas meal_plan_items e routine_exercises antes de remover meal_plans e workout_routines'
  );

  assert.ok(
    sqlLower.includes('action_user_id = v_user_id'),
    'Migration deve limpar friendships onde user_id, friend_id ou action_user_id pertencem ao usuário'
  );

  // 6. Exclusão definitiva em public.profiles e auth.users
  assert.ok(
    sqlLower.includes('delete from public.profiles where id = v_user_id;') &&
      sqlLower.includes('delete from auth.users where id = v_user_id;'),
    'Migration deve remover o registro em public.profiles e auth.users para o próprio v_user_id'
  );
});

test('Etapa 04.8 (Seção 7) — Segurança e Tratamento de Falhas Parciais em src/lib/accountDeletion.ts', () => {
  const src = read('src/lib/accountDeletion.ts');

  // Ausência absoluta de credenciais administrativas no cliente
  assert.ok(
    !src.includes('service_role') && !src.includes('SUPABASE_SERVICE_ROLE_KEY'),
    'accountDeletion.ts jamais deve expor ou referenciar service_role no frontend'
  );

  // Reautenticação estrita mesmo se email não for passado diretamente no input
  assert.ok(
    src.includes('let resolvedEmail = email?.trim()') &&
      src.includes('supabase.auth.getUser()') &&
      src.includes('if (!resolvedEmail)'),
    'accountDeletion.ts deve resolver e exigir o e-mail da sessão antes de signInWithPassword quando requirePasswordReauth = true'
  );

  // Limpeza de tabelas filhas no fallback RLS e rastreamento de falhas parciais
  assert.ok(
    src.includes("from('routine_exercises')") &&
      src.includes("from('meal_plan_items')") &&
      src.includes('partialFailures'),
    'Fallback RLS deve limpar routine_exercises e meal_plan_items e registrar eventuais partialFailures'
  );
});

test('Etapa 04.8 (Seções 2 e 3) — Centro de Ação Contextual e Modo Rápido na Home', () => {
  const quickMenuSrc = read('src/pages/QuickMenu.tsx');
  const actionCenterSrc = read('src/components/home/DailyActionCenter.tsx');

  // Home deve renderizar DailyActionCenter logo após o Hero/Status
  assert.ok(
    quickMenuSrc.includes('<DailyActionCenter') &&
      quickMenuSrc.indexOf('<DailyActionCenter') < quickMenuSrc.indexOf('<HunterGuidanceCard'),
    'QuickMenu.tsx deve posicionar DailyActionCenter acima de HunterGuidanceCard e Ações Rápidas para visibilidade imediata'
  );

  // Textos e ações contextuais baseadas em dados reais exigidos na especificação
  assert.ok(
    actionCenterSrc.includes('Seu treino de hoje está pronto.') &&
      actionCenterSrc.includes('Iniciar treino'),
    'DailyActionCenter deve exibir "Seu treino de hoje está pronto." e botão "Iniciar treino" quando há treino pendente'
  );

  assert.ok(
    actionCenterSrc.includes('Próxima missão') &&
      actionCenterSrc.includes('Concluir') &&
      actionCenterSrc.includes('Iniciar'),
    'DailyActionCenter deve exibir "Próxima missão" com botões de 1 toque "Concluir" e "Iniciar"'
  );

  assert.ok(
    actionCenterSrc.includes('Repetir refeição') &&
      actionCenterSrc.includes('Concluir refeição'),
    'DailyActionCenter deve permitir repetir refeição habitual ou concluir refeição planejada'
  );

  // Modo Rápido (Água +250ml/+500ml, Sono 7h/8h, Foco 15m, Retomada de Sessão)
  assert.ok(
    actionCenterSrc.includes('+250ml') &&
      actionCenterSrc.includes('+500ml') &&
      actionCenterSrc.includes('handleQuickLogSleep(7)') &&
      actionCenterSrc.includes('handleQuickLogSleep(8)') &&
      actionCenterSrc.includes('handleQuickFocusSession') &&
      actionCenterSrc.includes('Sessão em Andamento'),
    'DailyActionCenter deve oferecer controles rápidos de Água (+250ml/+500ml), Sono (7h/8h), Foco Tático (15m) e Retomada de Sessão em Andamento'
  );
});

test('Etapa 04.8 (Seções 5 e 10) — Experiência de Execução de Treino e Alvos de Toque Mobile (>= 44px)', () => {
  const workoutsSrc = read('src/pages/Workouts.tsx');
  const activeSessionSrc = read('src/components/workouts/ActiveWorkoutSession.tsx');

  // Suporte a início direto (?start=today) e retomada (?resume=1) + CTA acima da dobra
  assert.ok(
    workoutsSrc.includes("searchParams.get('start')") &&
      workoutsSrc.includes("searchParams.get('resume')") &&
      workoutsSrc.includes('INICIAR TREINO AGORA'),
    'Workouts.tsx deve suportar início rápido via ?start=today, retomada via ?resume=1 e exibir botão INICIAR TREINO AGORA acima da lista de exercícios'
  );

  // Ausência de alert bloqueante ao concluir sessão de treino
  assert.ok(
    workoutsSrc.includes('workoutCompleteToast') &&
      !workoutsSrc.includes('Treino concluído com sucesso! Volume total: ${sessionVolume} kg (+${xpResult.awardedXp} XP)\n        ),\n      );'),
    'Workouts.tsx deve utilizar toast HUD não bloqueante ao finalizar sessão de treino'
  );

  // Touch targets >= 44px nos controles de série de ActiveWorkoutSession
  assert.ok(
    activeSessionSrc.includes('min-h-[44px]') &&
      !activeSessionSrc.includes('size-7 rounded-lg'),
    'ActiveWorkoutSession.tsx deve utilizar alvos de toque >= 44px (sem botões pequenos size-7 de 28px)'
  );
});

test('Etapa 04.8 (Seção 6) — Feedback de Gameplay e Acessibilidade (Som & Vibração)', () => {
  setSoundEnabled(false);
  assert.equal(isSoundEnabled(), false);
  setSoundEnabled(true);
  assert.equal(isSoundEnabled(), true);

  setHapticsEnabled(false);
  assert.equal(isHapticsEnabled(), false);
  setHapticsEnabled(true);
  assert.equal(isHapticsEnabled(), true);
});

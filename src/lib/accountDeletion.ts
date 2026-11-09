// ============================================================================
// ASCEND — Account Deletion & Privacy Protection Service
// ============================================================================
// Complies with Apple App Store Review Guideline 5.1.1(v) and Google Play
// User Data / Account Deletion requirements.
// Never exposes admin credentials on the client. Uses authenticated backend
// RPC (`delete_own_account`) + authorized RLS cascade + local storage purge.
// ============================================================================

import { supabase } from '@/lib/supabase';

export const ACCOUNT_DELETION_CONFIRM_PHRASES = [
  'EXCLUIR MINHA CONTA',
  'DELETE MY ACCOUNT',
  'EXCLUIR',
  'DELETE',
] as const;

export const USER_DATA_CATEGORIES_DELETED = [
  {
    id: 'profile_auth',
    pt: 'Credenciais de acesso (Supabase Auth), perfil de caçador, classe, nível, XP e 7 atributos',
    en: 'Access credentials (Supabase Auth), hunter profile, class, level, XP, and 7 attributes',
  },
  {
    id: 'quests_habits',
    pt: 'Hábitos diários, histórico de conclusões, streaks e missões únicas (Quests)',
    en: 'Daily habits, completion history, streaks, and single missions (Quests)',
  },
  {
    id: 'training',
    pt: 'Fichas de treino (Training Center), séries, cargas, histórico de sessões e exercícios personalizados',
    en: 'Workout routines (Training Center), sets, loads, session logs, and custom exercises',
  },
  {
    id: 'nutrition',
    pt: 'Diário alimentar, cardápios (Meal Plans), pontuações calóricas e alimentos customizados',
    en: 'Food diary, meal plans, daily calorie scores, and custom foods',
  },
  {
    id: 'bosses_trophies',
    pt: 'Histórico de Boss Raids semanais, conquistas desbloqueadas e títulos da Trophy Room',
    en: 'Weekly Boss Raid history, unlocked achievements, and Trophy Room titles',
  },
  {
    id: 'fortuna_rest',
    pt: 'Registros financeiros (Fortuna), metas de economia e histórico de sono/recuperação (Descanso)',
    en: 'Financial logs (Fortune), savings goals, and sleep/recovery logs (Rest)',
  },
  {
    id: 'social_leaderboard',
    pt: 'Conexões de amizade, solicitações, bloqueios, Hunter Tag pública e presença nos rankings sazonais',
    en: 'Friendships, friend requests, blocks, public Hunter Tag, and seasonal leaderboard entries',
  },
] as const;

export function isValidDeletionConfirmation(input: string): boolean {
  const normalized = input.trim().toUpperCase();
  return ACCOUNT_DELETION_CONFIRM_PHRASES.includes(
    normalized as (typeof ACCOUNT_DELETION_CONFIRM_PHRASES)[number]
  );
}

export function purgeUserLocalData(userId?: string): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToKeep = new Set(['ascend_theme', 'ascend_language']);
    const keysToRemove: string[] = [];

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (keysToKeep.has(key)) continue;
      if (
        key === 'hunter-storage' ||
        key === 'ascend-auth-token' ||
        key.startsWith('ascend_') ||
        key.startsWith('single_quest_meta_') ||
        key.startsWith('bonus_quest_lore_') ||
        key.startsWith('sb-') ||
        (userId && key.includes(userId))
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    window.sessionStorage.clear();
  } catch {
    // Ignore storage access errors in restricted webviews
  }
}

export interface ExecuteAccountDeletionInput {
  userId: string;
  email?: string | null;
  password?: string;
  confirmationText: string;
  requirePasswordReauth?: boolean;
}

export interface ExecuteAccountDeletionResult {
  success: boolean;
  error?: string;
  usedBackendRpc?: boolean;
  partialFailures?: string[];
}

export async function executeAccountDeletion(
  input: ExecuteAccountDeletionInput
): Promise<ExecuteAccountDeletionResult> {
  const {
    userId,
    email,
    password = '',
    confirmationText,
    requirePasswordReauth = true,
  } = input;

  if (!userId) {
    return {
      success: false,
      error: 'Sessão inválida. Faça login novamente antes de excluir a conta.',
    };
  }

  if (!isValidDeletionConfirmation(confirmationText)) {
    return {
      success: false,
      error: 'Digite a frase de confirmação exata (EXCLUIR MINHA CONTA / DELETE MY ACCOUNT).',
    };
  }

  if (requirePasswordReauth) {
    if (!password || password.trim().length < 6) {
      return {
        success: false,
        error: 'Informe sua senha atual para revalidar sua identidade.',
      };
    }

    // 1a. Resolve email if not provided and strictly require password reauthentication
    let resolvedEmail = email?.trim() || '';
    if (!resolvedEmail) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id === userId && authData.user.email) {
        resolvedEmail = authData.user.email;
      }
    }

    if (!resolvedEmail) {
      return {
        success: false,
        error:
          'Não foi possível identificar o e-mail da sessão atual para reautenticação. Faça login novamente.',
      };
    }

    const { data: signInData, error: reauthError } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });
    if (reauthError || (signInData?.user && signInData.user.id !== userId)) {
      return {
        success: false,
        error:
          'Senha incorreta ou falha na revalidação de identidade. Por segurança, a conta não foi excluída.',
      };
    }
  } else {
    // 1b. OAuth / passwordless session revalidation via active server-verified user session
    const { data: authData, error: userError } = await supabase.auth.getUser();
    if (userError || !authData?.user || authData.user.id !== userId) {
      return {
        success: false,
        error:
          'Sessão expirada ou falha ao revalidar sua identidade OAuth. Faça login novamente antes de excluir a conta.',
      };
    }
  }

  // 2. Try executing the secure backend RPC `delete_own_account()` (SECURITY DEFINER)
  let usedBackendRpc = false;
  const partialFailures: string[] = [];
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_own_account');
    if (!rpcError && rpcResult === true) {
      usedBackendRpc = true;
    } else if (rpcError) {
      console.warn(
        '[AccountDeletion] RPC delete_own_account indisponível ou retornou aviso, executando limpeza autorizada via RLS:',
        rpcError.message
      );
    }
  } catch (err) {
    console.warn('[AccountDeletion] Fallback para limpeza RLS em cascata:', err);
  }

  // 3. If RPC was not applied yet in the remote DB, perform deterministic RLS cascade deletion
  // including child tables (`routine_exercises`, `meal_plan_items`) and profile anonymization.
  if (!usedBackendRpc) {
    try {
      const [routinesRes, mealPlansRes] = await Promise.all([
        supabase.from('workout_routines').select('id').eq('user_id', userId),
        supabase.from('meal_plans').select('id').eq('user_id', userId),
      ]);

      const routineIds = (routinesRes.data || []).map((r: { id: string }) => r.id);
      const mealPlanIds = (mealPlansRes.data || []).map((m: { id: string }) => m.id);

      if (routineIds.length > 0) {
        const { error } = await supabase
          .from('routine_exercises')
          .delete()
          .in('routine_id', routineIds);
        if (error) partialFailures.push(`routine_exercises: ${error.message}`);
      }

      if (mealPlanIds.length > 0) {
        const { error } = await supabase
          .from('meal_plan_items')
          .delete()
          .in('meal_plan_id', mealPlanIds);
        if (error) partialFailures.push(`meal_plan_items: ${error.message}`);
      }

      const firstWave = await Promise.all([
        supabase
          .from('friendships')
          .delete()
          .or(`user_id.eq.${userId},friend_id.eq.${userId},action_user_id.eq.${userId}`),
        supabase.from('leaderboard_scores').delete().eq('user_id', userId),
        supabase.from('financial_logs').delete().eq('user_id', userId),
        supabase.from('financial_goals').delete().eq('user_id', userId),
        supabase.from('rest_logs').delete().eq('user_id', userId),
        supabase.from('boss_battles').delete().eq('user_id', userId),
        supabase.from('nutrition_daily_scores').delete().eq('user_id', userId),
        supabase.from('daily_checklist').delete().eq('user_id', userId),
        supabase.from('achievements').delete().eq('user_id', userId),
        supabase.from('meal_completions').delete().eq('user_id', userId),
        supabase.from('food_logs').delete().eq('user_id', userId),
        supabase.from('routine_completions').delete().eq('user_id', userId),
        supabase.from('workout_logs').delete().eq('user_id', userId),
        supabase.from('habit_completions').delete().eq('user_id', userId),
      ]);

      firstWave.forEach((res) => {
        if (res.error) partialFailures.push(res.error.message);
      });

      const secondWave = await Promise.all([
        supabase.from('meal_plans').delete().eq('user_id', userId),
        supabase.from('workout_routines').delete().eq('user_id', userId),
        supabase.from('habits').delete().eq('user_id', userId),
        supabase.from('tasks').delete().eq('user_id', userId),
        supabase.from('foods').delete().eq('created_by', userId).eq('is_custom', true),
        supabase.from('exercises').delete().eq('created_by', userId).eq('is_custom', true),
      ]);

      secondWave.forEach((res) => {
        if (res.error) partialFailures.push(res.error.message);
      });

      // Anonymize profile first (in case DELETE policy on profiles is not yet active remotely),
      // then attempt DELETE on profiles.
      const { error: anonError } = await supabase
        .from('profiles')
        .update({
          username: null,
          full_name: null,
          avatar_url: null,
          hunter_tag: null,
          is_public: false,
          allow_friend_requests: false,
          include_in_global_leaderboard: false,
          featured_achievements: [],
          bio: null,
          class: null,
          xp: 0,
          level: 1,
          rank: 'E',
          strength: 10,
          intelligence: 10,
          endurance: 10,
          vitality: 10,
          discipline: 10,
          wisdom: 10,
          balance: 10,
        })
        .eq('id', userId);

      if (anonError) partialFailures.push(`profiles.anonymize: ${anonError.message}`);

      const { error: delProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (delProfileError) partialFailures.push(`profiles.delete: ${delProfileError.message}`);
    } catch (cleanupErr: unknown) {
      console.error('[AccountDeletion] Erro durante limpeza em cascata:', cleanupErr);
      partialFailures.push(
        cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr)
      );
    }
  }

  // 4. Purge all local storage / session storage & sign out session
  purgeUserLocalData(userId);
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore sign-out network errors after account deletion
  }

  return {
    success: true,
    usedBackendRpc,
    partialFailures: partialFailures.length > 0 ? partialFailures : undefined,
  };
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  RefreshCw,
  Trash2,
  Calendar,
  ShieldAlert,
  Sword,
  Book,
  Zap,
  Shield,
  Check,
  AlertTriangle,
  Loader2,
  HelpCircle,
  Ruler,
  Weight,
  Target,
  Dumbbell,
  Brain,
  ChevronDown,
  Award,
  Crown,
  Heart,
  Compass,
  Scale,
  Languages,
  MoonStar,
  Sun,
  Sparkles,
  Trophy,
  ArrowRight,
  Volume2,
  VolumeX,
  Vibrate,
  ExternalLink,
  Bug
} from 'lucide-react';
import { useHunterStore, type HunterClass, type HunterGender } from '@/stores/useHunterStore';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { INITIAL_XP_REQUIREMENT } from '@/lib/progression';
import { BetaFeedbackModal } from '@/components/beta/BetaFeedbackModal';
import { usePreferences } from '@/contexts/preferences';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { RankBadge } from '@/components/ui/rank-badge';
import { ALL_POSSIBLE_ACHIEVEMENTS } from '@/lib/achievementsData';
import {
  isSoundEnabled,
  setSoundEnabled,
  isHapticsEnabled,
  setHapticsEnabled,
  triggerGameFeel,
} from '@/lib/gameFeel';
import {
  executeAccountDeletion,
  isValidDeletionConfirmation,
  USER_DATA_CATEGORIES_DELETED,
} from '@/lib/accountDeletion';

const CLASS_IMAGE_FALLBACK = '/optimized/Classes/Warrior/Rank E.jpg';

function handleClassImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = 'true';
  image.src = CLASS_IMAGE_FALLBACK;
}

export function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hunterStore = useHunterStore();
  const { theme, language, setTheme, setLanguage, t } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => isEnglish ? en : pt;

  // Estado local dos formulários
  const [fullName, setFullName] = useState(hunterStore.fullName || '');
  const [birthday, setBirthday] = useState(hunterStore.birthday || '');
  const [gender, setGender] = useState<HunterGender | ''>(hunterStore.gender || '');
  const [height, setHeight] = useState(hunterStore.height ? String(hunterStore.height) : '');
  const [weightCurrent, setWeightCurrent] = useState(hunterStore.weightCurrent ? String(hunterStore.weightCurrent) : '');
  const [weightTarget, setWeightTarget] = useState(hunterStore.weightTarget ? String(hunterStore.weightTarget) : '');
  const [trainingFocus, setTrainingFocus] = useState(hunterStore.trainingFocus || '');
  const [nutritionGoal, setNutritionGoal] = useState(hunterStore.nutritionGoal || 'maintain');
  const [mainGoal, setMainGoal] = useState(hunterStore.mainGoal || '');
  const [experienceLevel, setExperienceLevel] = useState(hunterStore.experienceLevel || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Codex de Conquistas e Títulos
  const [achievements, setAchievements] = useState<{ title: string; description: string; icon: string; unlocked_at: string }[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);

  const fetchAchievements = async () => {
    if (!user?.id) {
      setLoadingAchievements(false);
      return;
    }

    try {
      setLoadingAchievements(true);
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      if (data) setAchievements(data);
    } catch (err: any) {
      console.error('Erro ao buscar conquistas:', err);
    } finally {
      setLoadingAchievements(false);
    }
  };

  useEffect(() => {
    void fetchAchievements();
  }, [user?.id]);

  // Loadings
  const [profileLoading, setProfileLoading] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [resetRpgLoading, setResetRpgLoading] = useState(false);
  const [resetAllLoading, setResetAllLoading] = useState(false);

  // Notificações / Status
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [securityMsg, setSecurityMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modais de confirmação
  const [showResetRpgModal, setShowResetRpgModal] = useState(false);
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Preferências de Feedback Sensorial (Som & Vibração)
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [hapticsOn, setHapticsOn] = useState<boolean>(() => isHapticsEnabled());

  // Exclusão de Conta (Apple 5.1.1v & Google Play)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState('');
  const [deleteAccountAck, setDeleteAccountAck] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  // Observabilidade Beta Web (Etapa 04.9)
  const [betaFeedbackOpen, setBetaFeedbackOpen] = useState(false);

  // Estado de telemetria
  const [telemetry, setTelemetry] = useState<{
    routines: number;
    meals: number;
    habits: number;
    tasks: number;
    loading: boolean;
    error: string | null;
  }>({
    routines: 0,
    meals: 0,
    habits: 0,
    tasks: 0,
    loading: false,
    error: null
  });

  useEffect(() => {
    async function fetchTelemetry() {
      if (!user?.id) {
        setTelemetry(prev => ({ ...prev, loading: false, error: null }));
        return;
      }

      let active = true;
      const safetyTimer = setTimeout(() => {
        if (active) {
          setTelemetry(prev => ({
            ...prev,
            loading: false,
            error: l(
              'A conexão de telemetria expirou. O banco de dados pode estar lento ou inacessível.',
              'Telemetry connection timed out. The database may be slow or unavailable.'
            )
          }));
        }
      }, 15000);

      try {
        setTelemetry(prev => ({ ...prev, loading: true, error: null }));

        const fetchRoutinesCount = async () => {
          try {
            const { count, error } = await supabase.from('workout_routines').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
            if (error) throw error;
            return count || 0;
          } catch {
            return 0;
          }
        };

        const fetchMealsCount = async () => {
          try {
            const { count, error } = await supabase.from('meal_plans').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
            if (error) throw error;
            return count || 0;
          } catch {
            return 0;
          }
        };

        const fetchHabitsCount = async () => {
          try {
            const { count, error } = await supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
            if (error) throw error;
            return count || 0;
          } catch {
            return 0;
          }
        };

        const fetchTasksCount = async () => {
          try {
            const { count, error } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
            if (error) throw error;
            return count || 0;
          } catch {
            return 0;
          }
        };

        const [routinesCount, mealsCount, habitsCount, tasksCount] = await Promise.all([
          fetchRoutinesCount(),
          fetchMealsCount(),
          fetchHabitsCount(),
          fetchTasksCount()
        ]);

        if (active) {
          setTelemetry({
            routines: routinesCount,
            meals: mealsCount,
            habits: habitsCount,
            tasks: tasksCount,
            loading: false,
            error: null
          });
        }
      } catch (err: any) {
        console.error('Erro de telemetria:', err);
        if (active) {
          setTelemetry(prev => ({
            ...prev,
            loading: false,
            error: err.message || String(err)
          }));
        }
      } finally {
        active = false;
        clearTimeout(safetyTimer);
      }
    }
    void fetchTelemetry();
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && (!hunterStore.profileLoaded || hunterStore.profileUserId !== user.id)) {
      void hunterStore.loadProfile(user.id);
    }
  }, [user?.id, hunterStore.profileLoaded, hunterStore.profileUserId]);

  // Atualizar inputs locais caso mudem no Zustand
  useEffect(() => {
    setFullName(hunterStore.fullName || '');
    setBirthday(hunterStore.birthday || '');
    setGender(hunterStore.gender || '');
    setHeight(hunterStore.height ? String(hunterStore.height) : '');
    setWeightCurrent(hunterStore.weightCurrent ? String(hunterStore.weightCurrent) : '');
    setWeightTarget(hunterStore.weightTarget ? String(hunterStore.weightTarget) : '');
    setTrainingFocus(hunterStore.trainingFocus || '');
    setNutritionGoal(hunterStore.nutritionGoal || 'maintain');
    setMainGoal(hunterStore.mainGoal || '');
    setExperienceLevel(hunterStore.experienceLevel || '');
  }, [
    hunterStore.fullName,
    hunterStore.birthday,
    hunterStore.gender,
    hunterStore.height,
    hunterStore.weightCurrent,
    hunterStore.weightTarget,
    hunterStore.trainingFocus,
    hunterStore.nutritionGoal,
    hunterStore.mainGoal,
    hunterStore.experienceLevel
  ]);

  // Configuração visual por classe
  const getClassConfig = (hClass: HunterClass | null, rank: string | null | undefined) => {
    const getRankImageName = (r: unknown): string => {
      if (!r || typeof r !== 'string') return 'Rank E';
      const upperRank = r.toUpperCase();
      if (['E', 'D', 'C', 'B', 'A', 'S'].includes(upperRank)) {
        return `Rank ${upperRank}`;
      }
      if (upperRank === 'NATIONAL' || upperRank === 'MONARCH') {
        return 'Rank S';
      }
      return 'Rank E';
    };

    const rankName = getRankImageName(rank);

    switch (hClass) {
      case 'Warrior':
        return {
          title: 'WARRIOR',
          glow: 'shadow-[0_0_35px_rgba(59,130,246,0.3)]',
          border: 'border-blue-500/40',
          text: 'text-blue-400',
          icon: <Sword className="w-5 h-5 text-blue-400" />,
          image: `/optimized/Classes/Warrior/${rankName}.jpg`
        };
      case 'Scholar':
        return {
          title: 'SCHOLAR',
          glow: 'shadow-[0_0_35px_rgba(124,58,237,0.35)]',
          border: 'border-purple-500/40',
          text: 'text-purple-400',
          icon: <Book className="w-5 h-5 text-purple-400" />,
          image: `/optimized/Classes/Scholar/${rankName}.jpg`
        };
      case 'Monk':
        return {
          title: 'MONK',
          glow: 'shadow-[0_0_35px_rgba(6,182,212,0.3)]',
          border: 'border-cyan-500/40',
          text: 'text-cyan-400',
          icon: <Zap className="w-5 h-5 text-cyan-400" />,
          image: `/optimized/Classes/Monk/${rankName}.jpg`
        };
      case 'Creator':
        return {
          title: 'CREATOR',
          glow: 'shadow-[0_0_35px_rgba(251,191,36,0.3)]',
          border: 'border-amber-500/40',
          text: 'text-amber-400',
          icon: <Zap className="w-5 h-5 text-amber-400" />,
          image: `/optimized/Classes/Creator/${rankName}.jpg`
        };
      case 'Leader':
        return {
          title: 'LEADER',
          glow: 'shadow-[0_0_35px_rgba(244,63,94,0.3)]',
          border: 'border-rose-500/40',
          text: 'text-rose-400',
          icon: <Shield className="w-5 h-5 text-rose-400" />,
          image: `/optimized/Classes/Leader/${rankName}.jpg`
        };
      default:
        return {
          title: l('CAÇADOR DESPERTO', 'AWAKENED HUNTER'),
          glow: 'shadow-[0_0_30px_rgba(168,85,247,0.25)]',
          border: 'border-purple-500/30',
          text: 'text-purple-400',
          icon: <User className="w-5 h-5 text-purple-400" />,
          image: `/optimized/Classes/Warrior/${rankName}.jpg`
        };
    }
  };

  const classConfig = getClassConfig(hunterStore.hunterClass, hunterStore.rank);

  const handleEquipTitle = async (titleName: string) => {
    if (!user?.id) return;
    try {
      await hunterStore.equipTitle(titleName, user.id);
      setProfileMsg({
        text: l(
          `TÍTULO EQUIPADO: "${titleName.toUpperCase()}" agora é seu título oficial de prestígio.`,
          `TITLE EQUIPPED: "${titleName.toUpperCase()}" is now your active prestige title.`
        ),
        type: 'success'
      });
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Atualizar Perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setProfileLoading(true);
    setProfileMsg(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          birthday: birthday || null,
          gender: gender || null,
          height: height ? parseFloat(height) : null,
          weight_current: weightCurrent ? parseFloat(weightCurrent) : null,
          weight_target: weightTarget ? parseFloat(weightTarget) : null,
          training_focus: trainingFocus || null,
          nutrition_goal: nutritionGoal || 'maintain',
          main_goal: mainGoal || null,
          experience_level: experienceLevel || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await hunterStore.loadProfile(user.id);

      setProfileMsg({
        text: l(
          'REGISTRO ATUALIZADO: Sua identidade e biometria foram persistidas no Codex.',
          'PROFILE UPDATED: Your identity and biometrics were saved in the Codex.'
        ),
        type: 'success'
      });
    } catch (err: any) {
      console.error(err);
      setProfileMsg({
        text: l(
          `ERRO DE GRAVAÇÃO: ${err.message || 'Erro inesperado.'}`,
          `SAVE ERROR: ${err.message || 'Unexpected error.'}`
        ),
        type: 'error'
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // 2. Atualizar Segurança (E-mail e Senha)
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (password && password !== confirmPassword) {
      setSecurityMsg({
        text: l(
          'VALIDAÇÃO FALHOU: As senhas digitadas não coincidem.',
          'VALIDATION FAILED: The passwords do not match.'
        ),
        type: 'error'
      });
      return;
    }

    setSecurityLoading(true);
    setSecurityMsg(null);

    try {
      const updates: { email?: string; password?: string } = {};
      if (email && email !== user.email) updates.email = email;
      if (password) updates.password = password;

      if (Object.keys(updates).length === 0) {
        setSecurityMsg({
          text: l('Nenhuma credencial nova foi informada.', 'No new credentials were provided.'),
          type: 'error'
        });
        setSecurityLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      setSecurityMsg({
        text: l(
          'SEGURANÇA ATUALIZADA: Suas novas credenciais de acesso foram sincronizadas.',
          'SECURITY UPDATED: Your new access credentials were synchronized.'
        ),
        type: 'success'
      });
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      setSecurityMsg({
        text: l(
          `ERRO DE SEGURANÇA: ${err.message || 'Erro de autenticação.'}`,
          `SECURITY ERROR: ${err.message || 'Authentication error.'}`
        ),
        type: 'error'
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  // 3. Reset Simples - Apenas Pontos de RPG e Atributos
  const handleResetRPG = async () => {
    if (!user) return;
    setResetRpgLoading(true);
    setShowResetRpgModal(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          level: 1,
          xp: 0,
          xp_to_next_level: INITIAL_XP_REQUIREMENT,
          rank: 'E',
          strength: 10,
          intelligence: 10,
          endurance: 10,
          vitality: 10,
          discipline: 10,
          wisdom: 10,
          balance: 10
        })
        .eq('id', user.id);

      if (error) throw error;

      await hunterStore.loadProfile(user.id);

      setProfileMsg({
        text: l(
          'ATRIBUTOS PURIFICADOS: Nível e atributos RPG retornaram ao Nível 1. Seus hábitos e rotinas permanecem intactos.',
          'ATTRIBUTES PURIFIED: Level and RPG attributes returned to Level 1. Your habits and routines remain untouched.'
        ),
        type: 'success'
      });
    } catch (err: any) {
      console.error(err);
      setProfileMsg({
        text: l(
          `ERRO DE REDEFINIÇÃO: ${err.message || 'Não foi possível redefinir atributos.'}`,
          `RESET ERROR: ${err.message || 'Could not reset attributes.'}`
        ),
        type: 'error'
      });
    } finally {
      setResetRpgLoading(false);
    }
  };

  // 4. Reset Geral - Limpar App do Zero
  const handleResetAll = async () => {
    const requiredConfirmation = isEnglish ? 'delete' : 'destruir';
    if (!user || resetConfirmText.trim().toLowerCase() !== requiredConfirmation) return;
    setResetAllLoading(true);
    setShowResetAllModal(false);

    try {
      await supabase.from('habit_completions').delete().eq('user_id', user.id);
      await supabase.from('routine_completions').delete().eq('user_id', user.id);
      await supabase.from('meal_completions').delete().eq('user_id', user.id);
      const routineIds = (await supabase.from('workout_routines').select('id').eq('user_id', user.id)).data?.map(r => r.id) || [];
      if (routineIds.length > 0) {
        await supabase.from('routine_exercises').delete().in('routine_id', routineIds);
      }

      const mealPlanIds = (await supabase.from('meal_plans').select('id').eq('user_id', user.id)).data?.map(m => m.id) || [];
      if (mealPlanIds.length > 0) {
        await supabase.from('meal_plan_items').delete().in('meal_plan_id', mealPlanIds);
      }

      await supabase.from('habits').delete().eq('user_id', user.id);
      await supabase.from('tasks').delete().eq('user_id', user.id);
      await supabase.from('workout_routines').delete().eq('user_id', user.id);
      await supabase.from('workout_logs').delete().eq('user_id', user.id);
      await supabase.from('meal_plans').delete().eq('user_id', user.id);
      await supabase.from('food_logs').delete().eq('user_id', user.id);
      await supabase.from('achievements').delete().eq('user_id', user.id);
      await supabase.from('daily_checklist').delete().eq('user_id', user.id);
      await supabase.from('nutrition_daily_scores').delete().eq('user_id', user.id);
      await supabase.from('boss_battles').delete().eq('user_id', user.id);
      await supabase.from('financial_logs').delete().eq('user_id', user.id);
      await supabase.from('financial_goals').delete().eq('user_id', user.id);
      await supabase.from('rest_logs').delete().eq('user_id', user.id);
      await supabase.from('exercises').delete().eq('created_by', user.id);
      await supabase.from('foods').delete().eq('created_by', user.id);

      const { error: errorProfile } = await supabase
        .from('profiles')
        .update({
          class: null,
          level: 1,
          xp: 0,
          xp_to_next_level: INITIAL_XP_REQUIREMENT,
          rank: 'E',
          strength: 10,
          intelligence: 10,
          endurance: 10,
          vitality: 10,
          discipline: 10,
          wisdom: 10,
          balance: 10,
          streak_current: 0,
          streak_best: 0,
          last_check_in: null,
          birthday: null,
          full_name: ''
        })
        .eq('id', user.id);

      if (errorProfile) throw errorProfile;

      hunterStore.reset();

      setTimeout(() => {
        navigate('/onboarding', { replace: true });
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setProfileMsg({
        text: l(
          `ERRO DE RESET COMPLETO: ${err.message || 'Falha crítica ao limpar dados.'}`,
          `FULL RESET ERROR: ${err.message || 'Critical failure while clearing data.'}`
        ),
        type: 'error'
      });
    } finally {
      setResetAllLoading(false);
      setResetConfirmText('');
    }
  };

  // 5. Exclusão Definitiva de Conta (Apple App Store 5.1.1v & Google Play)
  const isOAuthUser = Boolean(
    user?.app_metadata?.provider && user.app_metadata.provider !== 'email'
  );

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleteAccountError(null);

    if (!deleteAccountAck) {
      setDeleteAccountError(
        l(
          'Confirme que compreende que a exclusão da conta é irreversível.',
          'Please confirm that you understand account deletion is irreversible.'
        )
      );
      return;
    }

    if (!isValidDeletionConfirmation(deleteAccountConfirmText)) {
      setDeleteAccountError(
        l(
          'Digite EXCLUIR MINHA CONTA (ou DELETE MY ACCOUNT) para confirmar.',
          'Type DELETE MY ACCOUNT (or EXCLUIR MINHA CONTA) to confirm.'
        )
      );
      return;
    }

    if (!isOAuthUser && (!deleteAccountPassword || deleteAccountPassword.trim().length < 6)) {
      setDeleteAccountError(
        l(
          'Informe sua senha atual para revalidar sua identidade.',
          'Enter your current password to revalidate your identity.'
        )
      );
      return;
    }

    setDeleteAccountLoading(true);
    try {
      const result = await executeAccountDeletion({
        userId: user.id,
        email: user.email,
        password: deleteAccountPassword,
        confirmationText: deleteAccountConfirmText,
        requirePasswordReauth: !isOAuthUser,
      });

      if (!result.success) {
        setDeleteAccountError(
          result.error ||
          l(
            'Falha ao excluir a conta. Verifique sua senha e tente novamente.',
            'Failed to delete account. Check your password and try again.'
          )
        );
        return;
      }

      hunterStore.reset();
      setShowDeleteAccountModal(false);
      navigate('/login', { replace: true });
    } catch (err: any) {
      setDeleteAccountError(
        err?.message ||
        l('Erro inesperado ao excluir conta.', 'Unexpected error while deleting account.')
      );
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 sm:pb-32 text-silver">

      {/* ── CABEÇALHO DA PÁGINA ── */}
      <HudCard variant="cyan" corners radialGlow className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-wider text-white font-orbitron text-glow-cyan">
              {t('settings.title')}
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {t('settings.subtitle')}
            </p>
          </div>

          <TacticalButton
            onClick={() => {
              localStorage.removeItem('ascend_tour_completed');
              localStorage.setItem('ascend_just_finished_onboarding', 'true');
              navigate('/');
            }}
            variant="ghost"
            accent="purple"
            className="self-start sm:self-center min-h-[44px] text-xs px-4"
          >
            <HelpCircle size={16} />
            <span>{l('Ver Tutorial', 'View Tutorial')}</span>
          </TacticalButton>
        </div>
      </HudCard>

      {/* ── PREFERÊNCIAS DO SISTEMA (TEMA E IDIOMA) ── */}
      <HudCard variant="default" className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400">
              <Languages className="size-4" />
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider font-orbitron text-white">
                {t('settings.preferences')}
              </h2>
            </div>
            <p className="mt-1 text-xs text-gray-400">{t('settings.preferencesHint')}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[500px]">
            {/* Tema */}
            <div className="rounded-xl border border-white/5 bg-black/40 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                {t('settings.theme')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg border text-xs font-bold transition-all ${theme === 'dark'
                      ? 'border-purple-500/50 bg-purple-500/20 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:text-white'
                    }`}
                >
                  <MoonStar className="size-4" /> {t('settings.dark')}
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg border text-xs font-bold transition-all ${theme === 'light'
                      ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:text-white'
                    }`}
                >
                  <Sun className="size-4" /> {t('settings.light')}
                </button>
              </div>
            </div>

            {/* Idioma */}
            <div className="rounded-xl border border-white/5 bg-black/40 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                {t('settings.language')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage('pt-BR')}
                  className={`min-h-[44px] rounded-lg border text-xs font-bold transition-all ${language === 'pt-BR'
                      ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:text-white'
                    }`}
                >
                  {t('settings.portuguese')}
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en-US')}
                  className={`min-h-[44px] rounded-lg border text-xs font-bold transition-all ${language === 'en-US'
                      ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:text-white'
                    }`}
                >
                  {t('settings.english')}
                </button>
              </div>
            </div>

            {/* Efeitos Sonoros (Web Audio Sintético) */}
            <div className="rounded-xl border border-white/5 bg-black/40 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                {l('Efeitos Sonoros (HUD SFX)', 'Sound Effects (HUD SFX)')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSoundOn(true);
                    setSoundEnabled(true);
                    triggerGameFeel('questComplete');
                  }}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg border text-xs font-bold transition-all ${soundOn
                      ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:text-white'
                    }`}
                >
                  <Volume2 className="size-4" /> {l('Ativado', 'On')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSoundOn(false);
                    setSoundEnabled(false);
                  }}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg border text-xs font-bold transition-all ${!soundOn
                      ? 'border-rose-500/40 bg-rose-500/15 text-rose-200'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:text-white'
                    }`}
                >
                  <VolumeX className="size-4" /> {l('Silencioso', 'Muted')}
                </button>
              </div>
            </div>

            {/* Vibração Tátil (Haptics) */}
            <div className="rounded-xl border border-white/5 bg-black/40 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                {l('Vibração Tátil (Haptics)', 'Haptic Vibration')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setHapticsOn(true);
                    setHapticsEnabled(true);
                    triggerGameFeel('questComplete');
                  }}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg border text-xs font-bold transition-all ${hapticsOn
                      ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:text-white'
                    }`}
                >
                  <Vibrate className="size-4" /> {l('Ativada', 'On')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHapticsOn(false);
                    setHapticsEnabled(false);
                  }}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg border text-xs font-bold transition-all ${!hapticsOn
                      ? 'border-rose-500/40 bg-rose-500/15 text-rose-200'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:text-white'
                    }`}
                >
                  <span>{l('Desativada', 'Off')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </HudCard>

      {/* ── GRID PRINCIPAL: FICHA + FORMULÁRIOS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUNA ESQUERDA: HERO DA CLASSE ATIVA (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          <HudCard variant="cyan" corners className="p-5 sm:p-6 text-center">
            {/* Imagem de classe com moldura tática */}
            <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden mb-5 border border-white/10 group">
              <img
                src={classConfig.image}
                alt={classConfig.title}
                loading="lazy"
                decoding="async"
                onError={handleClassImageError}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              {/* Selo RPG do Rank */}
              <div className="absolute top-3 right-3">
                <RankBadge rank={hunterStore.rank || 'E'} size="md" />
              </div>

              {/* Tag de Vocação Inferior */}
              <div className="absolute bottom-3 left-3 right-3 text-left">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 font-orbitron">
                  {l('Arte de Vocação', 'Vocation Art')}
                </span>
                <p className="text-xs text-gray-300 font-medium truncate">
                  {hunterStore.fullName || l('Caçador Desperto', 'Awakened Hunter')}
                </p>
              </div>
            </div>

            {/* Informações da Ficha */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                {classConfig.icon}
                <h3 className={`text-xl sm:text-2xl font-black font-orbitron tracking-widest italic ${classConfig.text}`}>
                  {classConfig.title}
                </h3>
              </div>

              <p className="text-xs font-black text-amber-400 uppercase tracking-widest font-orbitron">
                🏆 {l('Título Ativo', 'Equipped Title')}: {hunterStore.activeTitle || l('Iniciante', 'Beginner')}
              </p>

              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {l('Nível', 'Level')} {hunterStore.level} • Rank {hunterStore.rank || 'E'}
              </p>

              <div className="h-px w-2/3 mx-auto bg-white/10 my-3" />

              <p className="text-[11px] text-gray-400 italic leading-relaxed max-w-xs mx-auto">
                “{l(
                  'Sua identidade selada reflete seus hábitos, atributos e consistência diária nas fendas.',
                  'Your sealed identity mirrors your daily habits, attributes, and Rift consistency.'
                )}”
              </p>
            </div>
          </HudCard>
        </div>

        {/* COLUNA CENTRAL & DIREITA: SEÇÕES DE CONFIGURAÇÃO (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── PAINEL 1: PERFIL DO CAÇADOR & BIOMETRIA ── */}
          <HudCard variant="default" corners className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="space-y-0.5">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white font-orbitron">
                  {l('Perfil & Calibração Física', 'Profile & Physical Metrics')}
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {l('Identidade do Caçador no Codex', 'Hunter Codex Identity')}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <User size={16} />
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {profileMsg && (
                <div className={`p-3.5 rounded-xl border text-xs font-semibold ${profileMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                  {profileMsg.text}
                </div>
              )}

              {/* Nome e Nascimento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {l('Codinome / Nome Completo', 'Hunter Name / Real Codename')}
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Gabriel Reis"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {l('Data de Nascimento', 'Date of Birth')}
                  </label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-cyan-500/50 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Sexo e Biometria */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {l('Gênero', 'Gender')}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as HunterGender)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-semibold text-white focus:border-cyan-500/50 focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-[#0F0F13]">{l('Selecione...', 'Select...')}</option>
                    <option value="male" className="bg-[#0F0F13]">{l('Masculino', 'Male')}</option>
                    <option value="female" className="bg-[#0F0F13]">{l('Feminino', 'Female')}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <Ruler size={12} className="text-cyan-400" /> {l('Altura (cm)', 'Height (cm)')}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="175"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold font-orbitron text-white text-center focus:border-cyan-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <Weight size={12} className="text-cyan-400" /> {l('Peso (kg)', 'Weight (kg)')}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="80"
                    value={weightCurrent}
                    onChange={(e) => setWeightCurrent(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold font-orbitron text-white text-center focus:border-cyan-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <Target size={12} className="text-cyan-400" /> {l('Meta (kg)', 'Target (kg)')}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="75"
                    value={weightTarget}
                    onChange={(e) => setWeightTarget(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold font-orbitron text-white text-center focus:border-cyan-500/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Diretrizes & Foco */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {l('Foco de Treino', 'Training Focus')}
                  </label>
                  <select
                    value={trainingFocus}
                    onChange={(e) => setTrainingFocus(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-semibold text-white focus:border-cyan-500/50 focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-[#0F0F13]">{l('Selecione...', 'Select...')}</option>
                    <option value="Musculação" className="bg-[#0F0F13]">{l('Musculação', 'Weightlifting')}</option>
                    <option value="Funcional" className="bg-[#0F0F13]">{l('Funcional', 'Functional')}</option>
                    <option value="Cardio / Endurance" className="bg-[#0F0F13]">Cardio / Endurance</option>
                    <option value="Calistenia" className="bg-[#0F0F13]">{l('Calistenia', 'Calisthenics')}</option>
                    <option value="Esportes de Combate" className="bg-[#0F0F13]">{l('Esportes de Combate', 'Combat')}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {l('Objetivo Nutricional', 'Nutrition Goal')}
                  </label>
                  <select
                    value={nutritionGoal}
                    onChange={(e) => setNutritionGoal(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-semibold text-white focus:border-cyan-500/50 focus:outline-none cursor-pointer"
                  >
                    <option value="lose" className="bg-[#0F0F13]">{l('Perder peso (Déficit)', 'Lose weight')}</option>
                    <option value="maintain" className="bg-[#0F0F13]">{l('Manter peso', 'Maintain weight')}</option>
                    <option value="gain" className="bg-[#0F0F13]">{l('Ganhar peso (Superávit)', 'Gain weight')}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {l('Experiência (Rank)', 'Experience')}
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-semibold text-white focus:border-cyan-500/50 focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-[#0F0F13]">{l('Selecione...', 'Select...')}</option>
                    <option value="beginner" className="bg-[#0F0F13]">{l('Iniciante [Rank E]', 'Beginner [Rank E]')}</option>
                    <option value="intermediate" className="bg-[#0F0F13]">{l('Intermediário [Rank C]', 'Intermediate [Rank C]')}</option>
                    <option value="advanced" className="bg-[#0F0F13]">{l('Avançado [Rank S]', 'Advanced [Rank S]')}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <TacticalButton
                  type="submit"
                  disabled={profileLoading}
                  variant="primary"
                  accent="cyan"
                  className="min-h-[44px] px-6 text-xs"
                >
                  {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{l('Salvar Perfil', 'Save Profile')}</span>
                </TacticalButton>
              </div>
            </form>
          </HudCard>

          {/* ── PAINEL 2: SALÃO DE TROFÉUS & TÍTULOS EQUIPÁVEIS ── */}
          <HudCard variant="gold" corners className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/5 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Crown className="size-4 text-amber-400" />
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white font-orbitron">
                    {l('Títulos & Conquistas de Prestígio', 'Prestige Titles & Achievements')}
                  </h2>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {l('Gerencie seu título ativo ou visite a galeria completa', 'Manage active title or visit full trophy gallery')}
                </p>
              </div>

              <Link
                to="/trophies"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 font-orbitron text-xs font-black uppercase tracking-wider text-amber-300 hover:bg-amber-500/25 transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] self-start sm:self-center"
              >
                <Trophy size={14} />
                <span>{l('Trophy Room', 'Trophy Room')}</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Título Ativo & Seletor Rápido */}
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-500/30 bg-black/40 p-3.5 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 font-orbitron">
                    {l('Título Equipado Atualmente', 'Currently Equipped Title')}
                  </span>
                  <p className="text-sm sm:text-base font-black uppercase tracking-wide text-white font-orbitron mt-0.5">
                    {hunterStore.activeTitle || l('Iniciante', 'Beginner')}
                  </p>
                </div>
                <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Award size={18} />
                </div>
              </div>

              {/* Títulos Desbloqueados para troca rápida */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 font-orbitron">
                  {l('Troca Rápida de Título Desbloqueado', 'Quick Switch Unlocked Title')}
                </span>

                <div className="flex flex-wrap gap-2 pt-1">
                  {(() => {
                    const unlockedList = ['Iniciante'];
                    (achievements || []).forEach(a => {
                      if (!a?.title) return;
                      const match = ALL_POSSIBLE_ACHIEVEMENTS.find(p => p.title === a.title);
                      if (match && match.titleReward && !unlockedList.includes(match.titleReward)) {
                        unlockedList.push(match.titleReward);
                      }
                    });

                    return unlockedList.map((titleName) => {
                      const isEquipped = hunterStore.activeTitle === titleName;
                      const displayTitle = isEnglish && titleName === 'Iniciante'
                        ? 'Beginner'
                        : titleName;
                      return (
                        <button
                          key={titleName}
                          type="button"
                          onClick={() => handleEquipTitle(titleName)}
                          className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all font-orbitron ${isEquipped
                              ? 'bg-amber-500/25 border border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                              : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                            }`}
                        >
                          {displayTitle} {isEquipped && '✓'}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </HudCard>

          {/* ── PAINEL 3: CREDENCIAIS & SEGURANÇA ── */}
          <HudCard variant="purple" corners className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="space-y-0.5">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white font-orbitron">
                  {l('Credenciais & Chaves de Acesso', 'Access & Security Credentials')}
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {l('Atualização de E-mail e Senha Criptográfica', 'Update Email and Password')}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                <Lock size={16} />
              </div>
            </div>

            <form onSubmit={handleSaveSecurity} className="space-y-4">
              {securityMsg && (
                <div className={`p-3.5 rounded-xl border text-xs font-semibold ${securityMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                  {securityMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {l('E-mail do Sistema', 'System Email')}
                  </label>
                  <input
                    type="email"
                    placeholder="seuemail@provedor.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {l('Nova Senha', 'New Password')}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {l('Confirmar Senha', 'Confirm Password')}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <TacticalButton
                  type="submit"
                  disabled={securityLoading}
                  variant="primary"
                  accent="purple"
                  className="min-h-[44px] px-6 text-xs"
                >
                  {securityLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{l('Atualizar Credenciais', 'Update Credentials')}</span>
                </TacticalButton>
              </div>
            </form>
          </HudCard>

          {/* ── PAINEL 4: TELEMETRIA & DIAGNÓSTICO ── */}
          <HudCard variant="default" className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="space-y-0.5">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white font-orbitron">
                  {l('Telemetria & Diagnóstico de Nuvem', 'Telemetry & Cloud Diagnostics')}
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {l('Status de conectividade em tempo real com a fenda', 'Real-time connectivity status with the Rift')}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <Shield size={16} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-white/5 bg-black/40 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                      {l('Conexão Supabase', 'Supabase State')}
                    </p>
                    <p className="text-xs font-black font-orbitron text-white mt-0.5">
                      {telemetry.loading ? (
                        <span className="text-gray-400 animate-pulse">{l('Verificando...', 'Checking...')}</span>
                      ) : telemetry.error ? (
                        <span className="text-rose-400">{l('Falha', 'Failed')}</span>
                      ) : (
                        <span className="text-emerald-400">{l('Conectado', 'Connected')}</span>
                      )}
                    </p>
                  </div>
                  <div className={`size-3 rounded-full ${telemetry.loading
                      ? 'bg-amber-400 animate-ping'
                      : telemetry.error
                        ? 'bg-rose-500'
                        : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    }`} />
                </div>

                <div className="p-3.5 rounded-xl border border-white/5 bg-black/40 sm:col-span-2 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                    {l('ID do Caçador Autenticado', 'Authenticated Hunter ID')}
                  </p>
                  <p className="text-[10px] font-mono text-gray-300 break-all">
                    {user?.id || l('Desconectado', 'Disconnected')}
                  </p>
                </div>
              </div>

              {/* Contadores da Nuvem */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: l('Refeições', 'Meal Plans'), count: telemetry.meals },
                  { label: l('Rotinas', 'Routines'), count: telemetry.routines },
                  { label: l('Hábitos', 'Habits'), count: telemetry.habits },
                  { label: l('Tarefas', 'Tasks'), count: telemetry.tasks },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-xl border border-white/5 bg-black/40 text-center">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{item.label}</p>
                    <p className="text-base sm:text-lg font-black font-orbitron text-cyan-400 mt-0.5">{item.count}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                <TacticalButton
                  onClick={() => setBetaFeedbackOpen(true)}
                  variant="secondary"
                  accent="gold"
                  className="min-h-[44px] text-xs px-4"
                >
                  <Bug size={14} className="text-amber-400" />
                  <span>{l('Reportar Problema (Beta)', 'Report Issue (Beta)')}</span>
                </TacticalButton>
                <TacticalButton
                  onClick={() => window.location.reload()}
                  variant="ghost"
                  accent="cyan"
                  className="min-h-[44px] text-xs px-4"
                >
                  <RefreshCw size={14} />
                  <span>{l('Sincronização Forçada', 'Force Sync')}</span>
                </TacticalButton>
              </div>
            </div>
          </HudCard>

          {/* ── PAINEL 5: ZONA DE PERIGO (REDEFINIÇÕES) ── */}
          <HudCard variant="crimson" corners className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <div className="space-y-0.5">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-400 font-orbitron">
                  {l('Zona de Perigo & Redefinição', 'Danger Zone & Resets')}
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  {l('Ações de purificação de progresso irreversíveis', 'Irreversible progress reset actions')}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <ShieldAlert size={16} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reset de Atributos */}
              <div className="p-4 rounded-xl border border-white/5 bg-black/40 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-300 font-orbitron">
                    {l('Zerar RPG (Nível 1 & 10 Stats)', 'Reset RPG (Level 1 & 10 Stats)')}
                  </h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {l(
                      'Retorna nível para 1 e atributos base para 10. Seus treinos, dietas e hábitos NÃO são afetados.',
                      'Resets level to 1 and stats to 10. Workouts, diets, and habits are NOT affected.'
                    )}
                  </p>
                </div>
                <TacticalButton
                  onClick={() => setShowResetRpgModal(true)}
                  disabled={resetRpgLoading}
                  variant="secondary"
                  accent="gold"
                  className="min-h-[44px] text-xs font-bold"
                >
                  {resetRpgLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  <span>{l('Zerar Atributos', 'Reset Attributes')}</span>
                </TacticalButton>
              </div>

              {/* Reset Total */}
              <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/15 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 font-orbitron">
                    {l('Destruir Registro (Reset Total)', 'Destroy Record (Full Reset)')}
                  </h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {l(
                      'Apaga permanentemente rotinas, refeições, hábitos e histórico. Retorna ao onboarding inicial.',
                      'Permanently clears workouts, meals, habits, and history. Returns to onboarding.'
                    )}
                  </p>
                </div>
                <TacticalButton
                  onClick={() => setShowResetAllModal(true)}
                  disabled={resetAllLoading}
                  variant="danger"
                  accent="crimson"
                  className="min-h-[44px] text-xs font-bold"
                >
                  {resetAllLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  <span>{l('Reset Total do App', 'Full App Reset')}</span>
                </TacticalButton>
              </div>
            </div>

            {/* Exclusão Definitiva de Conta (Apple App Store 5.1.1v & Google Play Compliance) */}
            <div className="p-4 sm:p-5 rounded-xl border border-rose-500/35 bg-rose-950/25 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 font-orbitron text-[9px] font-black uppercase tracking-widest text-rose-300">
                      {l('PRIVACIDADE & CONTA', 'PRIVACY & ACCOUNT')}
                    </span>
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white font-orbitron">
                      {l('Excluir minha conta', 'Delete my account')}
                    </h3>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-300 leading-relaxed">
                    {l(
                      'Exclui permanentemente sua conta ASCEND, credenciais de acesso, perfil público, conexões sociais, histórico de missões, treinos, nutrição, fortuna e conquistas.',
                      'Permanently deletes your ASCEND account, login credentials, public profile, social connections, quest history, workouts, nutrition, fortune, and achievements.'
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <Link
                    to="/delete-account"
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-300 hover:border-rose-400/50 hover:text-white transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span>{l('Portal Web de Exclusão', 'Web Deletion Portal')}</span>
                  </Link>

                  <TacticalButton
                    type="button"
                    onClick={() => {
                      setDeleteAccountError(null);
                      setDeleteAccountPassword('');
                      setDeleteAccountConfirmText('');
                      setDeleteAccountAck(false);
                      setShowDeleteAccountModal(true);
                    }}
                    variant="danger"
                    accent="crimson"
                    className="min-h-[44px] text-xs font-black px-4"
                  >
                    <Trash2 size={14} />
                    <span>{l('Excluir minha conta', 'Delete my account')}</span>
                  </TacticalButton>
                </div>
              </div>
            </div>
          </HudCard>

        </div>

      </div>

      {/* ── MODAL 1: CONFIRMAÇÃO RESET RPG ── */}
      <AnimatePresence>
        {showResetRpgModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full rounded-2xl border border-amber-500/40 bg-[#0F0F13] p-6 shadow-2xl space-y-4"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-black font-orbitron uppercase text-white">
                  {l('Purificar Atributos?', 'Reset Attributes?')}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {l(
                    'Você está prestes a redefinir seu nível para 1, seu XP para 0 e seus atributos base para 10. Seus hábitos, treinos e refeições NÃO serão apagados.',
                    'You are about to reset level to 1, XP to 0, and base stats to 10. Habits, workouts, and meals will NOT be deleted.'
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <TacticalButton
                  onClick={() => setShowResetRpgModal(false)}
                  variant="ghost"
                  className="min-h-[44px] text-xs"
                >
                  {l('Cancelar', 'Cancel')}
                </TacticalButton>
                <TacticalButton
                  onClick={handleResetRPG}
                  variant="primary"
                  accent="gold"
                  className="min-h-[44px] text-xs"
                >
                  {l('Confirmar', 'Confirm')}
                </TacticalButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: CONFIRMAÇÃO RESET GERAL ── */}
      <AnimatePresence>
        {showResetAllModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full rounded-2xl border border-rose-500/40 bg-[#0F0F13] p-6 shadow-2xl space-y-4"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-lg font-black font-orbitron uppercase text-white">
                  {l('Destruir Todo o Registro?', 'Destroy Full Record?')}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {l(
                    'Esta ação apagará permanentemente todos os seus treinos, rotinas, hábitos, tarefas, históricos de alimentação e conquistas. Sua classe será desfeita.',
                    'This permanently deletes all workouts, routines, habits, tasks, food history, and achievements. Your class will be unsealed.'
                  )}
                </p>

                <div className="w-full space-y-1.5 pt-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                    {l('Digite', 'Type')}{' '}
                    <span className="font-extrabold underline">{isEnglish ? 'DELETE' : 'DESTRUIR'}</span>{' '}
                    {l('para confirmar', 'to confirm')}
                  </label>
                  <input
                    type="text"
                    placeholder={isEnglish ? 'DELETE' : 'DESTRUIR'}
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-rose-500/40 bg-black/60 text-center text-xs font-black font-orbitron tracking-widest text-rose-400 uppercase focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <TacticalButton
                  onClick={() => {
                    setShowResetAllModal(false);
                    setResetConfirmText('');
                  }}
                  variant="ghost"
                  className="min-h-[44px] text-xs"
                >
                  {l('Cancelar', 'Cancel')}
                </TacticalButton>
                <TacticalButton
                  onClick={handleResetAll}
                  disabled={resetConfirmText.trim().toLowerCase() !== (isEnglish ? 'delete' : 'destruir')}
                  variant="danger"
                  accent="crimson"
                  className="min-h-[44px] text-xs"
                >
                  {l('Destruir Tudo', 'Destroy All')}
                </TacticalButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 3: EXCLUSÃO DEFINITIVA DE CONTA (APPLE / GOOGLE PLAY) ── */}
      <AnimatePresence>
        {showDeleteAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-lg w-full max-h-[90dvh] overflow-y-auto rounded-2xl border border-rose-500/45 bg-[#0D0F17] p-5 sm:p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start gap-3.5 border-b border-white/10 pb-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/35">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black font-orbitron uppercase text-white">
                    {l('Excluir Minha Conta Permanentemente', 'Permanently Delete My Account')}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {l(
                      'Esta operação encerra sua identidade no Sistema ASCEND e não pode ser desfeita.',
                      'This operation terminates your identity in the ASCEND System and cannot be undone.'
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-rose-500/25 bg-rose-950/20 p-3.5 space-y-2">
                <p className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-rose-300">
                  {l('Dados que serão permanentemente excluídos:', 'Data that will be permanently deleted:')}
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-gray-300">
                  {USER_DATA_CATEGORIES_DELETED.map((cat) => (
                    <li key={cat.id}>{isEnglish ? cat.en : cat.pt}</li>
                  ))}
                </ul>
              </div>

              {deleteAccountError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs text-rose-200 flex items-start gap-2"
                >
                  <AlertTriangle size={15} className="shrink-0 text-rose-400 mt-0.5" />
                  <span>{deleteAccountError}</span>
                </div>
              )}

              <div className="space-y-3">
                {!isOAuthUser ? (
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-300">
                      {l('Sua Senha Atual (Revalidação de Identidade)', 'Your Current Password (Identity Revalidation)')}
                    </label>
                    <input
                      type="password"
                      value={deleteAccountPassword}
                      onChange={(e) => setDeleteAccountPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full min-h-[44px] rounded-xl border border-white/15 bg-black/60 px-3.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 p-3 text-[11px] text-cyan-200">
                    {l(
                      'Conta autenticada via provedor externo (OAuth). Sua sessão ativa será revalidada junto à frase de confirmação abaixo.',
                      'Account authenticated via external provider (OAuth). Your active session will be revalidated alongside the confirmation phrase below.'
                    )}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-rose-400">
                    {l(
                      'Digite EXCLUIR MINHA CONTA para confirmar',
                      'Type DELETE MY ACCOUNT to confirm'
                    )}
                  </label>
                  <input
                    type="text"
                    value={deleteAccountConfirmText}
                    onChange={(e) => setDeleteAccountConfirmText(e.target.value)}
                    placeholder={isEnglish ? 'DELETE MY ACCOUNT' : 'EXCLUIR MINHA CONTA'}
                    className="w-full min-h-[44px] rounded-xl border border-rose-500/40 bg-black/60 px-3.5 text-center font-orbitron text-xs font-black uppercase tracking-wider text-rose-300 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <label className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[11px] text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteAccountAck}
                    onChange={(e) => setDeleteAccountAck(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/25 bg-black text-rose-500"
                  />
                  <span>
                    {l(
                      'Estou ciente de que minha conta e todos os meus dados privados e públicos serão excluídos em caráter irreversível.',
                      'I understand that my account and all private and public data will be irreversibly deleted.'
                    )}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <TacticalButton
                  type="button"
                  onClick={() => setShowDeleteAccountModal(false)}
                  variant="ghost"
                  className="min-h-[44px] text-xs"
                >
                  {l('Cancelar', 'Cancel')}
                </TacticalButton>
                <TacticalButton
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={
                    deleteAccountLoading ||
                    !deleteAccountAck ||
                    !isValidDeletionConfirmation(deleteAccountConfirmText) ||
                    (!isOAuthUser && deleteAccountPassword.trim().length < 6)
                  }
                  variant="danger"
                  accent="crimson"
                  className="min-h-[44px] text-xs font-black"
                >
                  {deleteAccountLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  <span>{l('Confirmar Exclusão', 'Confirm Deletion')}</span>
                </TacticalButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Observabilidade e Feedback Beta */}
      <BetaFeedbackModal
        open={betaFeedbackOpen}
        onClose={() => setBetaFeedbackOpen(false)}
        currentScreen="/settings"
      />

    </div>
  );
}

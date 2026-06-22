import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  Flame,
  Crown,
  Heart,
  Compass,
  Scale,
  Languages,
  MoonStar,
  Sun
} from 'lucide-react';
import { useHunterStore, type HunterClass, type HunterGender } from '../stores/useHunterStore';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { INITIAL_XP_REQUIREMENT } from '../lib/progression';
import { usePreferences } from '../contexts/preferences';

const ALL_POSSIBLE_ACHIEVEMENTS = [
  // Streak
  { key: '3d', title: 'Iniciante da Consistência', desc: 'Mantenha uma streak de 3 dias seguidos', icon: 'Flame', titleReward: 'Constante', xp: 30 },
  { key: '7d', title: 'Guerreiro Diário', desc: 'Mantenha uma streak de 7 dias seguidos', icon: 'Calendar', titleReward: 'Persistente', xp: 70 },
  { key: '15d', title: 'Mestre da Rotina', desc: 'Mantenha uma streak de 15 dias seguidos', icon: 'Shield', titleReward: 'Inabalável', xp: 140 },
  { key: '30d', title: 'Lenda Ativa', desc: 'Mantenha uma streak de 30 dias seguidos', icon: 'Crown', titleReward: 'Monarca da Rotina', xp: 250 },
  // Atributos
  { key: 'strength', title: 'Força Absoluta', desc: 'Alcance 20 pontos de Força', icon: 'Sword', titleReward: 'Colosso', xp: 50 },
  { key: 'intelligence', title: 'Mente Brilhante', desc: 'Alcance 20 pontos de Inteligência', icon: 'Book', titleReward: 'Arquimago', xp: 50 },
  { key: 'endurance', title: 'Inquebrável', desc: 'Alcance 20 pontos de Resistência', icon: 'Shield', titleReward: 'Bastião', xp: 50 },
  { key: 'vitality', title: 'Vigor Eterno', desc: 'Alcance 20 pontos de Vitalidade', icon: 'Heart', titleReward: 'Imortal', xp: 50 },
  { key: 'discipline', title: 'Mente de Ferro', desc: 'Alcance 20 pontos de Disciplina', icon: 'Brain', titleReward: 'Focado', xp: 50 },
  { key: 'wisdom', title: 'Olhar Aguçado', desc: 'Alcance 20 pontos de Sabedoria', icon: 'Compass', titleReward: 'Eremita', xp: 50 },
  { key: 'balance', title: 'Zenith', desc: 'Alcance 20 pontos de Equilíbrio', icon: 'Scale', titleReward: 'Harmônico', xp: 50 },
  // Chefes Finais
  { key: 'boss_01', title: 'O Senhor da Procrastinação Derrotado', desc: 'Purificou o Senhor da Procrastinação', icon: 'Sword', titleReward: 'Executor Implacável', xp: 100 },
  { key: 'boss_02', title: 'O Rei da Preguiça Derrotado', desc: 'Purificou o Rei da Preguiça', icon: 'Flame', titleReward: 'O Incansável', xp: 130 },
  { key: 'boss_03', title: 'A Sereia da Distração Derrotada', desc: 'Purificou a Sereia da Distração', icon: 'Brain', titleReward: 'Mestre do Foco', xp: 160 },
  { key: 'boss_04', title: 'O Devorador do Progresso Derrotado', desc: 'Purificou o Devorador do Progresso', icon: 'Heart', titleReward: 'Mestre da Disciplina', xp: 200 },
  { key: 'boss_05', title: 'O Mercador das Dívidas Derrotado', desc: 'Purificou o Mercador das Dívidas', icon: 'Scale', titleReward: 'Guardião da Liberdade', xp: 240 },
  { key: 'boss_06', title: 'O Arauto do Caos Derrotado', desc: 'Purificou o Arauto do Caos', icon: 'Compass', titleReward: 'Mestre da Clareza', xp: 300 },
  { key: 'boss_07', title: 'O Reflexo da Autossabotagem Purificado', desc: 'Superou a si mesmo e purificou o Reflexo da Autossabotagem', icon: 'Crown', titleReward: 'O Purificado', xp: 400 },
];

const EN_ACHIEVEMENT_COPY: Record<string, { title: string; desc: string }> = {
  '3d': { title: 'Consistency Initiate', desc: 'Maintain a 3-day streak' },
  '7d': { title: 'Daily Warrior', desc: 'Maintain a 7-day streak' },
  '15d': { title: 'Routine Master', desc: 'Maintain a 15-day streak' },
  '30d': { title: 'Active Legend', desc: 'Maintain a 30-day streak' },
  strength: { title: 'Absolute Strength', desc: 'Reach 20 Strength points' },
  intelligence: { title: 'Brilliant Mind', desc: 'Reach 20 Intelligence points' },
  endurance: { title: 'Unbreakable', desc: 'Reach 20 Endurance points' },
  vitality: { title: 'Eternal Vigor', desc: 'Reach 20 Vitality points' },
  discipline: { title: 'Iron Mind', desc: 'Reach 20 Discipline points' },
  wisdom: { title: 'Keen Insight', desc: 'Reach 20 Wisdom points' },
  balance: { title: 'Zenith', desc: 'Reach 20 Balance points' },
  boss_01: { title: 'Lord of Procrastination Defeated', desc: 'Purified the Lord of Procrastination' },
  boss_02: { title: 'King of Sloth Defeated', desc: 'Purified the King of Sloth' },
  boss_03: { title: 'Siren of Distraction Defeated', desc: 'Purified the Siren of Distraction' },
  boss_04: { title: 'Devourer of Progress Defeated', desc: 'Purified the Devourer of Progress' },
  boss_05: { title: 'Merchant of Debt Defeated', desc: 'Purified the Merchant of Debt' },
  boss_06: { title: 'Herald of Chaos Defeated', desc: 'Purified the Herald of Chaos' },
  boss_07: { title: 'Reflection of Self-Sabotage Purified', desc: 'Overcame yourself and purified the final reflection' },
};

const getAchievementIcon = (iconName: string, size = 20, className = '') => {
  switch (iconName) {
    case 'Flame': return <Flame size={size} className={className} />;
    case 'Calendar': return <Calendar size={size} className={className} />;
    case 'Shield': return <Shield size={size} className={className} />;
    case 'Crown': return <Crown size={size} className={className} />;
    case 'Sword': return <Sword size={size} className={className} />;
    case 'Book': return <Book size={size} className={className} />;
    case 'Heart': return <Heart size={size} className={className} />;
    case 'Brain': return <Brain size={size} className={className} />;
    case 'Compass': return <Compass size={size} className={className} />;
    case 'Scale': return <Scale size={size} className={className} />;
    default: return <Award size={size} className={className} />;
  }
};

export function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hunterStore = useHunterStore();
  const { theme, language, setTheme, setLanguage, t } = usePreferences();
  const l = (pt: string, en: string) => language === 'en-US' ? en : pt;
  
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
  const [achievementsError, setAchievementsError] = useState<string | null>(null);

  const fetchAchievements = async () => {
    if (!user?.id) {
      setLoadingAchievements(false);
      setAchievementsError(null);
      return;
    }

    const safetyTimer = setTimeout(() => {
      setLoadingAchievements(false);
      setAchievementsError(l(
        'A sincronização do Codex expirou. O banco de dados pode estar lento ou inacessível.',
        'Codex synchronization timed out. The database may be slow or unavailable.'
      ));
      console.warn('[Settings] Safety timeout disparado para conquistas.');
    }, 15000); // Aumentado para 15 segundos para cold starts do Supabase

    try {
      setLoadingAchievements(true);
      setAchievementsError(null);
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setAchievements(data);
      }
    } catch (err: any) {
      console.error('Erro ao buscar conquistas:', err);
      setAchievementsError(err.message || String(err));
    } finally {
      clearTimeout(safetyTimer);
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
          console.warn('[Settings] Safety timeout disparado para telemetria.');
        }
      }, 15000); // Aumentado para 15 segundos para cold starts do Supabase

      try {
        setTelemetry(prev => ({ ...prev, loading: true, error: null }));
        
        // Consultas isoladas com tratamento de erros para que falhas de RLS ou tabela vazia
        // em um módulo específico não derrubem as demais contagens ou a telemetria inteira
        const fetchRoutinesCount = async () => {
          try {
            const { count, error } = await supabase.from('workout_routines').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
            if (error) throw error;
            return count || 0;
          } catch (e) {
            console.warn('[Settings Telemetry] Falha ao contar rotinas:', e);
            return 0;
          }
        };

        const fetchMealsCount = async () => {
          try {
            const { count, error } = await supabase.from('meal_plans').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
            if (error) throw error;
            return count || 0;
          } catch (e) {
            console.warn('[Settings Telemetry] Falha ao contar refeições:', e);
            return 0;
          }
        };

        const fetchHabitsCount = async () => {
          try {
            const { count, error } = await supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
            if (error) throw error;
            return count || 0;
          } catch (e) {
            console.warn('[Settings Telemetry] Falha ao contar hábitos:', e);
            return 0;
          }
        };

        const fetchTasksCount = async () => {
          try {
            const { count, error } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
            if (error) throw error;
            return count || 0;
          } catch (e) {
            console.warn('[Settings Telemetry] Falha ao contar tarefas:', e);
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
    if (user) {
      void hunterStore.loadProfile(user.id);
    }
  }, [user]);

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
    const getRankImageName = (r: string | null | undefined): string => {
      if (!r) return 'Rank E';
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
          glow: 'shadow-[0_0_35px_rgba(59,130,246,0.35)]',
          border: 'border-blue-500/40',
          bgGlow: 'bg-blue-500/5',
          text: 'text-blue-400',
          icon: <Sword className="w-6 h-6 text-blue-400" />,
          image: `/Classes/Warrior/${rankName}.jpeg`
        };
      case 'Scholar':
        return {
          title: 'SCHOLAR',
          glow: 'shadow-[0_0_35px_rgba(124,58,237,0.4)]',
          border: 'border-purple-500/40',
          bgGlow: 'bg-purple-500/5',
          text: 'text-purple-400',
          icon: <Book className="w-6 h-6 text-purple-400" />,
          image: `/Classes/Scholar/${rankName}.jpeg`
        };
      case 'Monk':
        return {
          title: 'MONK',
          glow: 'shadow-[0_0_35px_rgba(6,182,212,0.35)]',
          border: 'border-cyan-500/40',
          bgGlow: 'bg-cyan-500/5',
          text: 'text-cyan-400',
          icon: <Zap className="w-6 h-6 text-cyan-400" />,
          image: `/Classes/Monk/${rankName}.jpeg`
        };
      case 'Creator':
        return {
          title: 'CREATOR',
          glow: 'shadow-[0_0_35px_rgba(251,191,36,0.35)]',
          border: 'border-amber-500/40',
          bgGlow: 'bg-amber-500/5',
          text: 'text-amber-400',
          icon: <Zap className="w-6 h-6 text-amber-400" />,
          image: `/Classes/Creator/${rankName}.jpeg`
        };
      case 'Leader':
        return {
          title: 'LEADER',
          glow: 'shadow-[0_0_35px_rgba(244,63,94,0.35)]',
          border: 'border-rose-500/40',
          bgGlow: 'bg-rose-500/5',
          text: 'text-rose-400',
          icon: <Shield className="w-6 h-6 text-rose-400" />,
          image: `/Classes/Leader/${rankName}.jpeg`
        };

      default:
        return {
          title: l('CAÇADOR DESPERTO', 'AWAKENED HUNTER'),
          glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
          border: 'border-purple-500/30',
          bgGlow: 'bg-purple-500/5',
          text: 'text-purple-400',
          icon: <User className="w-6 h-6 text-purple-400" />,
          image: `/Classes/Warrior/${rankName}.jpeg`
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
          `TÍTULO EQUIPADO: "${titleName.toUpperCase()}" agora é o seu título oficial de prestígio.`,
          `TITLE EQUIPPED: "${titleName.toUpperCase()}" is now your official prestige title.`
        ),
        type: 'success'
      });
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Atualizar Perfil Opcional
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
      
      // Sincronizar Zustand
      await hunterStore.loadProfile(user.id);
      
      setProfileMsg({
        text: l(
          'REGISTRO ATUALIZADO: Sua identidade no Codex foi gravada com sucesso.',
          'PROFILE UPDATED: Your Codex identity was saved successfully.'
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
          'SISTEMA DE SEGURANÇA ATUALIZADO: Suas novas chaves de acesso foram sincronizadas.',
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
          discipline: 10
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Sincronizar local
      await hunterStore.loadProfile(user.id);
      
      // Feedback Épico
      setProfileMsg({
        text: l(
          'FALHA DE REGISTRO CORRIGIDA: Seus atributos bônus e níveis de caçador foram purificados de volta ao Nível 1. Suas missões permanecem intactas.',
          'PROGRESSION RESET: Your bonus attributes and Hunter level returned to Level 1. Your quests remain intact.'
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
    const requiredConfirmation = language === 'en-US' ? 'delete' : 'destruir';
    if (!user || resetConfirmText.trim().toLowerCase() !== requiredConfirmation) return;
    setResetAllLoading(true);
    setShowResetAllModal(false);
    
    try {
      // 1. Deletar completions e subitens
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

      // 2. Deletar tabelas principais
      await supabase.from('habits').delete().eq('user_id', user.id);
      await supabase.from('tasks').delete().eq('user_id', user.id);
      await supabase.from('workout_routines').delete().eq('user_id', user.id);
      await supabase.from('workout_logs').delete().eq('user_id', user.id);
      await supabase.from('meal_plans').delete().eq('user_id', user.id);
      await supabase.from('food_logs').delete().eq('user_id', user.id);
      await supabase.from('achievements').delete().eq('user_id', user.id);
      await supabase.from('daily_checklist').delete().eq('user_id', user.id);
      await supabase.from('nutrition_daily_scores').delete().eq('user_id', user.id);

      // 3. Deletar customs criados pelo usuário
      await supabase.from('exercises').delete().eq('created_by', user.id);
      await supabase.from('foods').delete().eq('created_by', user.id);

      // 4. Redefinir perfil no Supabase de volta ao estado purificado inicial (class = null, etc)
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
          streak_current: 0,
          streak_best: 0,
          last_check_in: null,
          birthday: null,
          full_name: ''
        })
        .eq('id', user.id);
        
      if (errorProfile) throw errorProfile;
      
      // 5. Limpar Zustand Store e redirecionar imediatamente para o onboarding
      hunterStore.reset();
      
      // Pequeno delay dramático
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

  return (
    <div className="space-y-8 pb-16 text-silver">
      
      {/* ── TÍTULO DA PÁGINA ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-l-2 border-blue-500 pl-4 py-1">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-wider text-white font-orbitron text-glow-blue">
            {t('settings.title')}
          </h1>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {t('settings.subtitle')}
          </p>
        </div>

        {/* Botão Holográfico do Tutorial */}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(168,85,247,0.4)', borderColor: 'rgba(168,85,247,0.6)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            localStorage.removeItem('ascend_tour_completed');
            localStorage.setItem('ascend_just_finished_onboarding', 'true');
            navigate('/');
          }}
          className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/5 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-purple-400 transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.1)] self-start sm:self-auto"
          title={l('Ver Tutorial Interativo', 'View interactive tutorial')}
        >
          <HelpCircle size={16} className="animate-pulse" />
          <span>{l('Ver Tutorial', 'View Tutorial')}</span>
        </motion.button>
      </div>

      <section className="rounded-3xl border border-blue-500/20 bg-[#0F0F13] p-5 shadow-xl sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-400">
              <Languages className="size-4" />
              <h2 className="text-sm font-black uppercase tracking-wider font-orbitron">
                {t('settings.preferences')}
              </h2>
            </div>
            <p className="mt-2 text-xs text-gray-500">{t('settings.preferencesHint')}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[520px]">
            <div className="rounded-2xl border border-white/5 bg-black/25 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                {t('settings.theme')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex min-h-10 items-center justify-center gap-2 rounded-xl border text-xs font-bold transition ${
                    theme === 'dark'
                      ? 'border-purple-500/40 bg-purple-500/15 text-purple-300'
                      : 'border-white/5 bg-white/5 text-gray-500 hover:text-white'
                  }`}
                >
                  <MoonStar className="size-4" /> {t('settings.dark')}
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex min-h-10 items-center justify-center gap-2 rounded-xl border text-xs font-bold transition ${
                    theme === 'light'
                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-500'
                      : 'border-white/5 bg-white/5 text-gray-500 hover:text-white'
                  }`}
                >
                  <Sun className="size-4" /> {t('settings.light')}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/25 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                {t('settings.language')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage('pt-BR')}
                  className={`min-h-10 rounded-xl border text-xs font-bold transition ${
                    language === 'pt-BR'
                      ? 'border-blue-500/40 bg-blue-500/15 text-blue-400'
                      : 'border-white/5 bg-white/5 text-gray-500 hover:text-white'
                  }`}
                >
                  {t('settings.portuguese')}
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en-US')}
                  className={`min-h-10 rounded-xl border text-xs font-bold transition ${
                    language === 'en-US'
                      ? 'border-blue-500/40 bg-blue-500/15 text-blue-400'
                      : 'border-white/5 bg-white/5 text-gray-500 hover:text-white'
                  }`}
                >
                  {t('settings.english')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* COLUNA ESQUERDA: FICHA DA CLASSE ATIVA */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-3xl border ${classConfig.border} bg-[#0F0F13] p-5 sm:p-6 text-center ${classConfig.glow}`}
          >
            {/* Glow centralizador */}
            <div className={`absolute inset-0 z-10 bg-gradient-to-b ${
              theme === 'light'
                ? 'from-white/20 via-transparent to-white/95'
                : 'from-[#0f0f13] via-transparent to-[#0f0f13]'
            }`} />
            
            {/* Imagem de classe com blur de entrada */}
            <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden mb-5 sm:mb-6 group border border-[#1e1e26]">
              <img 
                src={classConfig.image} 
                alt={classConfig.title} 
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
              
              {/* Selo RPG do Rank */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex size-10 sm:size-12 items-center justify-center rounded-xl sm:rounded-2xl border border-blue-500/40 bg-black/70 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <span className="text-xl sm:text-2xl font-black text-blue-400 italic font-orbitron">{hunterStore.rank || 'E'}</span>
              </div>
            </div>

            {/* Texto de Ficha */}
            <div className="relative z-20 space-y-2">
              <div className="flex items-center justify-center gap-2">
                {classConfig.icon}
                <h3 className={`text-2xl font-black font-orbitron tracking-widest italic ${classConfig.text}`}>
                  {classConfig.title}
                </h3>
              </div>
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.25em] font-orbitron animate-pulse">
                🏆 {l('Título', 'Title')}: {hunterStore.activeTitle || l('Iniciante', 'Beginner')}
              </p>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mt-1">
                {l('Nível', 'Level')} {hunterStore.level} {l('Caçador', 'Hunter')}
              </p>
              <div className="h-px w-2/3 mx-auto bg-gray-800/80 my-4" />
              
              {/* Descrição temática */}
              <p className="text-xs text-gray-500 italic max-w-xs mx-auto leading-relaxed">
                “{l(
                  'Esta é a sua arte de vocação selada nas fendas profundas. Seu progresso, conquistas e reputação são espelhados em seus atributos de batalha diária.',
                  'This is your calling, sealed within the deepest rifts. Your progress, achievements, and reputation are reflected in your daily battle attributes.'
                )}”
              </p>
            </div>
          </motion.div>
        </div>

        {/* COLUNA CENTRAL & DIREITA: FORMULÁRIOS E ZONAS */}
        <div className="lg:col-span-2 space-y-8">

          {/* PAINEL 1: PERFIL DO CAÇADOR (NOME E ANIVERSÁRIO) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-5 sm:p-8 shadow-xl relative overflow-hidden"
          >
            <div className="mb-5 sm:mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white font-orbitron">
                  {language === 'en-US' ? (
                    <>Hunter <span className="text-blue-500">Profile</span></>
                  ) : (
                    <>Perfil de <span className="text-blue-500">Caçador</span></>
                  )}
                </h2>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  {l('Dados de Identidade Opcionais no Codex', 'Optional identity data stored in the Codex')}
                </p>
              </div>
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <User size={16} />
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5 sm:space-y-6">
              {profileMsg && (
                <div className={`p-4 rounded-xl border text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${
                  profileMsg.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {profileMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Nome Completo */}
                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500">
                    {l('Nome de Batismo (Codinome Real)', 'Hunter Name (Real Codename)')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: Gabriel Reis"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-semibold text-white placeholder-gray-600 transition-all focus:border-blue-500 focus:bg-black/60 focus:outline-none focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                    />
                    <User className="absolute left-3.5 top-3 sm:top-3.5 w-4 h-4 text-gray-600" />
                  </div>
                </div>

                {/* Data de Nascimento */}
                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500">
                    {l('Data de Nascimento (Ciclo Solar)', 'Date of Birth (Solar Cycle)')}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-semibold text-white placeholder-gray-600 transition-all focus:border-blue-500 focus:bg-black/60 focus:outline-none focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                    />
                    <Calendar className="absolute left-3.5 top-3 sm:top-3.5 w-4 h-4 text-gray-600" />
                  </div>
                </div>

              </div>

              {/* Divisor */}
              <div className="border-t border-[#1e1e26] my-6" />

              {/* Subtítulo Seção 2: Biometria */}
              <div className="space-y-1 mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 font-orbitron">
                  {l('Parâmetros Biométricos & Gênero', 'Biometrics & Gender')}
                </h3>
                <p className="text-[8px] font-bold uppercase tracking-widest text-gray-600">
                  {l('Calibração de Atributos Físicos e Imagem no Perfil do Caçador', 'Physical attribute and Hunter profile calibration')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Sexo */}
                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500">
                    {l('Sexo (Gênero)', 'Gender')}
                  </label>
                  <div className="relative">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as HunterGender)}
                      className="w-full pl-3 pr-10 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-semibold text-white transition-all focus:border-blue-500 focus:bg-black/60 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="">{l('Selecione...', 'Select...')}</option>
                      <option value="male">{l('Masculino', 'Male')}</option>
                      <option value="female">{l('Feminino', 'Female')}</option>
                    </select>
                    <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-10 border-l border-[#1e1e26] pointer-events-none text-gray-500">
                      <ChevronDown size={14} className="text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Registro Biométrico (Altura, Peso, Peso Meta) */}
                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1 whitespace-nowrap">
                    <Ruler className="w-3.5 h-3.5 text-blue-400 shrink-0" /> {l('Altura', 'Height')} (cm)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 175"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-bold font-orbitron text-white text-center transition-all focus:border-blue-500 focus:bg-black/60 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1 whitespace-nowrap">
                    <Weight className="w-3.5 h-3.5 text-blue-400 shrink-0" /> {l('Peso', 'Weight')} (kg)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 80"
                    value={weightCurrent}
                    onChange={(e) => setWeightCurrent(e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-bold font-orbitron text-white text-center transition-all focus:border-blue-500 focus:bg-black/60 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1 whitespace-nowrap">
                    <Target className="w-3.5 h-3.5 text-blue-400 shrink-0" /> {l('Meta', 'Target')} (kg)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 75"
                    value={weightTarget}
                    onChange={(e) => setWeightTarget(e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-bold font-orbitron text-white text-center transition-all focus:border-blue-500 focus:bg-black/60 focus:outline-none"
                  />
                </div>
              </div>

              {/* Divisor */}
              <div className="border-t border-[#1e1e26] my-6" />

              {/* Subtítulo Seção 3: Objetivos */}
              <div className="space-y-1 mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 font-orbitron">
                  {l('Diretrizes & Foco de Evolução', 'Growth Guidelines & Focus')}
                </h3>
                <p className="text-[8px] font-bold uppercase tracking-widest text-gray-600">
                  {l('Definições de Metas de Treino, Carreira e Nível de Experiência', 'Training, career, and experience-level goals')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Foco de Treino */}
                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-blue-400 shrink-0" /> {l('Foco de Treino', 'Training Focus')}
                  </label>
                  <div className="relative">
                    <select
                      value={trainingFocus}
                      onChange={(e) => setTrainingFocus(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-semibold text-white transition-all focus:border-blue-500 focus:bg-black/60 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="">{l('Selecione um foco...', 'Select a focus...')}</option>
                      <option value="Musculação">{l('Musculação', 'Strength Training')}</option>
                      <option value="Funcional">{l('Funcional', 'Functional Training')}</option>
                      <option value="Cardio / Endurance">Cardio / Endurance</option>
                      <option value="Esportes de Combate">{l('Esportes de Combate', 'Combat Sports')}</option>
                      <option value="Calistenia">{l('Calistenia', 'Calisthenics')}</option>
                      <option value="Flexibilidade / Yoga">{l('Flexibilidade / Yoga', 'Flexibility / Yoga')}</option>
                    </select>
                    <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-10 border-l border-[#1e1e26] pointer-events-none text-gray-500">
                      <ChevronDown size={14} className="text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Objetivo Nutricional */}
                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-blue-400 shrink-0" /> {l('Objetivo Nutricional', 'Nutrition Goal')}
                  </label>
                  <div className="relative">
                    <select
                      value={nutritionGoal}
                      onChange={(e) => setNutritionGoal(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-semibold text-white transition-all focus:border-blue-500 focus:bg-black/60 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="lose">{l('Perder peso', 'Lose weight')}</option>
                      <option value="maintain">{l('Manter peso', 'Maintain weight')}</option>
                      <option value="gain">{l('Ganhar peso', 'Gain weight')}</option>
                    </select>
                    <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-10 border-l border-[#1e1e26] pointer-events-none text-gray-500">
                      <ChevronDown size={14} className="text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Objetivo Principal */}
                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-blue-400 shrink-0" /> {l('Objetivo Principal', 'Main Goal')}
                  </label>
                  <div className="relative">
                    <select
                      value={mainGoal}
                      onChange={(e) => setMainGoal(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-semibold text-white transition-all focus:border-blue-500 focus:bg-black/60 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="">{l('Selecione um objetivo...', 'Select a goal...')}</option>
                      <option value="general">{l('Evolução Geral', 'Overall Growth')}</option>
                      <option value="health">{l('Performance & Saúde', 'Performance & Health')}</option>
                      <option value="finance">{l('Independência Financeira', 'Financial Independence')}</option>
                      <option value="career">{l('Carreira & Habilidades', 'Career & Skills')}</option>
                    </select>
                    <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-10 border-l border-[#1e1e26] pointer-events-none text-gray-500">
                      <ChevronDown size={14} className="text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Nível de Experiência */}
                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0" /> {l('Experiência', 'Experience')} (Rank)
                  </label>
                  <div className="relative">
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-semibold text-white transition-all focus:border-blue-500 focus:bg-black/60 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="">{l('Selecione a experiência...', 'Select experience level...')}</option>
                      <option value="beginner">{l('Iniciante', 'Beginner')} [Rank E]</option>
                      <option value="intermediate">{l('Intermediário', 'Intermediate')} [Rank C]</option>
                      <option value="advanced">{l('Avançado', 'Advanced')} [Rank S]</option>
                    </select>
                    <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-10 border-l border-[#1e1e26] pointer-events-none text-gray-500">
                      <ChevronDown size={14} className="text-gray-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl bg-blue-600 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/30 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {profileLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {l('Atualizar Registro', 'Update Profile')}
                </button>
              </div>
            </form>
          </motion.div>

          {/* PAINEL 1.5: CODEX DE CONQUISTAS E TÍTULOS EQUIPÁVEIS */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-5 sm:p-8 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="mb-5 sm:mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white font-orbitron">
                  {language === 'en-US' ? (
                    <>Titles & Achievements <span className="text-amber-400">Codex</span></>
                  ) : (
                    <>Codex de <span className="text-amber-400">Títulos & Conquistas</span></>
                  )}
                </h2>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  {l('Desbloqueie Desafios e Equipe Títulos de Prestígio', 'Unlock challenges and equip prestige titles')}
                </p>
              </div>
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Award size={16} />
              </div>
            </div>

            <div className="space-y-6">
              {/* Seção 1: Títulos Equipáveis */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 font-orbitron flex items-center gap-1.5">
                  <Crown size={14} /> {l('Títulos Desbloqueados', 'Unlocked Titles')}
                </h3>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest leading-relaxed">
                  {l(
                    'Títulos liberados ao conquistar marcos importantes. Escolha um para exibir no seu perfil.',
                    'Titles earned through major milestones. Choose one to display on your profile.'
                  )}
                </p>

                {/* Grid de títulos obtidos */}
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {(() => {
                    const unlockedList = ['Iniciante'];
                    achievements.forEach(a => {
                      const match = ALL_POSSIBLE_ACHIEVEMENTS.find(p => p.title === a.title);
                      if (match && match.titleReward && !unlockedList.includes(match.titleReward)) {
                        unlockedList.push(match.titleReward);
                      }
                    });

                    return unlockedList.map((titleName) => {
                      const isEquipped = hunterStore.activeTitle === titleName;
                      const displayTitle = language === 'en-US' && titleName === 'Iniciante'
                        ? 'Beginner'
                        : titleName;
                      return (
                        <button
                          key={titleName}
                          type="button"
                          onClick={() => handleEquipTitle(titleName)}
                          className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                            isEquipped
                              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                              : 'bg-black/30 border border-[#1e1e26] text-gray-400 hover:border-gray-500/40 hover:text-white'
                          }`}
                        >
                          {displayTitle} {isEquipped && '✓'}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Divisor */}
              <div className="border-t border-[#1e1e26] border-dashed" />

              {/* Seção 2: Medalhas/Badges de Conquistas */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 font-orbitron flex items-center gap-1.5">
                  <Award size={14} /> {l('Medalhas da Fenda', 'Rift Medals')}
                </h3>

                {loadingAchievements ? (
                  <div className="py-6 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-[10px] font-black uppercase text-gray-600 tracking-wider">
                      {l('Acessando Codex...', 'Accessing Codex...')}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {achievementsError && (
                      <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-400 font-semibold uppercase tracking-wide">
                        ⚠️ {achievementsError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ALL_POSSIBLE_ACHIEVEMENTS.map((item) => {
                      const matchingUnlock = achievements.find(a => a.title === item.title);
                      const isUnlocked = !!matchingUnlock;
                      const localizedAchievement = language === 'en-US' ? EN_ACHIEVEMENT_COPY[item.key] : null;
                      
                      return (
                        <div
                          key={item.title}
                          className={`relative flex items-center gap-3.5 rounded-2xl border p-3.5 transition-all ${
                            isUnlocked
                              ? 'border-amber-500/30 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.05)] text-amber-400 animate-glow-amber'
                              : 'border-[#1E1E26] bg-black/20 text-gray-600 opacity-60'
                          }`}
                        >
                          <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${
                            isUnlocked 
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                              : 'border-[#1E1E26] bg-white/5 text-gray-700'
                          }`}>
                            {getAchievementIcon(item.icon, 18, isUnlocked ? 'animate-pulse' : '')}
                          </div>
                          
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-[10px] font-black uppercase tracking-wider font-orbitron truncate ${
                                isUnlocked ? 'text-amber-300' : 'text-gray-500'
                              }`}>
                                {localizedAchievement?.title || item.title}
                              </p>
                              {isUnlocked && (
                                <span className="text-[8px] font-black text-amber-500 tracking-widest shrink-0 font-orbitron">
                                  +{item.xp} XP
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-normal">
                              {localizedAchievement?.desc || item.desc}
                            </p>
                            {isUnlocked && matchingUnlock.unlocked_at && (
                              <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">
                                {l('Desbloqueado', 'Unlocked')}: {new Date(matchingUnlock.unlocked_at).toLocaleDateString(language)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* PAINEL 2: CREDENCIAIS DE ACESSO (SEGURANÇA) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-5 sm:p-8 shadow-xl relative overflow-hidden"
          >
            <div className="mb-5 sm:mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white font-orbitron">
                  {language === 'en-US' ? (
                    <>Access <span className="text-purple-500">Credentials</span></>
                  ) : (
                    <>Credenciais de <span className="text-purple-500">Acesso</span></>
                  )}
                </h2>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  {l('Modificação de Chaves Criptográficas', 'Update authentication credentials')}
                </p>
              </div>
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                <Lock size={16} />
              </div>
            </div>

            <form onSubmit={handleSaveSecurity} className="space-y-5 sm:space-y-6">
              {securityMsg && (
                <div className={`p-4 rounded-xl border text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${
                  securityMsg.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {securityMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* E-mail */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500">
                    {l('E-mail do Sistema', 'System Email')}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="seuemail@provedor.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-semibold text-white placeholder-gray-600 transition-all focus:border-purple-500 focus:bg-black/60 focus:outline-none focus:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                    />
                    <Mail className="absolute left-3.5 top-3 sm:top-3.5 w-4 h-4 text-gray-600" />
                  </div>
                </div>

                {/* Nova Senha */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500">
                    {l('Nova Senha', 'New Password')}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-semibold text-white placeholder-gray-600 transition-all focus:border-purple-500 focus:bg-black/60 focus:outline-none focus:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                    />
                    <Lock className="absolute left-3.5 top-3 sm:top-3.5 w-4 h-4 text-gray-600" />
                  </div>
                </div>

                {/* Confirmar Senha */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500">
                    {l('Confirmar Senha', 'Confirm Password')}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-semibold text-white placeholder-gray-600 transition-all focus:border-purple-500 focus:bg-black/60 focus:outline-none focus:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                    />
                    <Lock className="absolute left-3.5 top-3 sm:top-3.5 w-4 h-4 text-gray-600" />
                  </div>
                </div>

              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={securityLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl bg-purple-600 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-purple-600/20 transition-all hover:bg-purple-500 hover:shadow-purple-500/30 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {securityLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {l('Atualizar Segurança', 'Update Security')}
                </button>
              </div>
            </form>
          </motion.div>

          {/* PAINEL 2.5: DIRETRIZES DE SISTEMA (TUTORIAL) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-3xl border border-purple-500/20 bg-[#0F0F13] p-5 sm:p-8 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="mb-5 sm:mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white font-orbitron">
                  {language === 'en-US' ? (
                    <>System <span className="text-purple-400">Guidelines</span></>
                  ) : (
                    <>Diretrizes de <span className="text-purple-400">Sistema</span></>
                  )}
                </h2>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  {l('Calibração de Interface e Guias Virtuais', 'Interface calibration and virtual guides')}
                </p>
              </div>
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                <Zap className="w-4 h-4 text-purple-400 fill-purple-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-semibold italic">
                “{l(
                  'Se você deseja recalibrar seus sensores cognitivos e rever a apresentação holográfica das seções e módulos vitais do aplicativo, re-inicie o protocolo de guia do caçador.',
                  'To recalibrate the interface and review the app’s essential modules, restart the Hunter guide protocol.'
                )}”
              </p>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('ascend_tour_completed');
                    localStorage.setItem('ascend_just_finished_onboarding', 'true');
                    navigate('/');
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl border border-purple-500/30 bg-purple-500/5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-purple-400 transition-all hover:bg-purple-500/20 hover:border-purple-500 active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {l('Reiniciar Guia do Caçador', 'Restart Hunter Guide')}
                </button>
              </div>
            </div>
          </motion.div>

          {/* PAINEL 2.8: PORTAL DE TELEMETRIA E DIAGNÓSTICO */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.28 }}
            className="rounded-3xl border border-blue-500/20 bg-[#0F0F13] p-5 sm:p-8 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="mb-5 sm:mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white font-orbitron">
                  {l('Telemetria &', 'Telemetry &')} <span className="text-blue-400">{l('Diagnóstico', 'Diagnostics')}</span>
                </h2>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  {l('Status de Conectividade do Caçador com a Fenda', 'Hunter connectivity status with the Rift')}
                </p>
              </div>
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <Shield className="w-4 h-4 text-blue-400 fill-blue-500/20 animate-pulse" />
              </div>
            </div>

            <div className="space-y-6">
              {/* Status de Conexão */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-[#1e1e26] bg-black/40 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                      {l('Conexão Supabase', 'Supabase Connection')}
                    </p>
                    <p className="text-xs font-black uppercase tracking-widest font-orbitron text-white">
                      {telemetry.loading ? (
                        <span className="text-gray-400 animate-pulse">{l('Consultando...', 'Checking...')}</span>
                      ) : telemetry.error ? (
                        <span className="text-rose-500">{l('Falhou', 'Failed')}</span>
                      ) : (
                        <span className="text-emerald-400 text-glow-emerald">{l('Conectado', 'Connected')}</span>
                      )}
                    </p>
                  </div>
                  <div className={`size-3 rounded-full ${
                    telemetry.loading 
                      ? 'bg-yellow-500 animate-ping' 
                      : telemetry.error 
                        ? 'bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
                        : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                  }`} />
                </div>

                <div className="p-4 rounded-2xl border border-[#1e1e26] bg-black/40 space-y-1 md:col-span-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                    {l('ID do Caçador Ativo', 'Active Hunter ID')}
                  </p>
                  <p className="text-[10px] font-semibold text-gray-400 font-mono break-all leading-none py-1 selection:bg-blue-500/30 selection:text-white">
                    {user?.id || l('Desconectado', 'Disconnected')}
                  </p>
                </div>
              </div>

              {/* Erros Detectados */}
              {telemetry.error && (
                <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 text-xs text-rose-400 space-y-1 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-black uppercase tracking-wider text-rose-500">
                      {l('Anomalia de Conexão Detectada', 'Connection Anomaly Detected')}
                    </p>
                    <p className="font-semibold font-mono text-[11px] leading-relaxed break-all bg-black/40 p-2 rounded-lg border border-rose-950/40">
                      {telemetry.error}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {l(
                        '* Dica: Verifique se suas chaves do Supabase no Vercel/Ambiente de Produção estão preenchidas corretamente e possuem permissão nas tabelas.',
                        '* Tip: Check that your Supabase keys are correctly configured in Vercel/production and have table permissions.'
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Contagem de Linhas */}
              <div className="p-5 rounded-2xl border border-[#1e1e26] bg-black/20">
                <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                  {l('Registros na Nuvem (Sincronização)', 'Cloud Records (Synchronization)')}
                </h4>
                {telemetry.loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 rounded-xl border border-[#1a1a22] bg-black/40 text-center space-y-1">
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{l('Cardápios', 'Meal Plans')}</p>
                      <p className="text-lg font-black font-orbitron text-blue-400">{telemetry.meals}</p>
                    </div>
                    <div className="p-3 rounded-xl border border-[#1a1a22] bg-black/40 text-center space-y-1">
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{l('Rotinas', 'Routines')}</p>
                      <p className="text-lg font-black font-orbitron text-blue-400">{telemetry.routines}</p>
                    </div>
                    <div className="p-3 rounded-xl border border-[#1a1a22] bg-black/40 text-center space-y-1">
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{l('Hábitos', 'Habits')}</p>
                      <p className="text-lg font-black font-orbitron text-blue-400">{telemetry.habits}</p>
                    </div>
                    <div className="p-3 rounded-xl border border-[#1a1a22] bg-black/40 text-center space-y-1">
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{l('Tarefas', 'Tasks')}</p>
                      <p className="text-lg font-black font-orbitron text-blue-400">{telemetry.tasks}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl border border-blue-500/30 bg-blue-500/5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-blue-400 transition-all hover:bg-blue-500/20 hover:border-blue-500 active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {l('Sincronização Forçada', 'Force Synchronization')}
                </button>
              </div>
            </div>
          </motion.div>

          {/* PAINEL 3: ZONA DE PERIGO (REDEFINIÇÕES) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl border border-rose-500/20 bg-[#0F0F13] p-5 sm:p-8 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="mb-5 sm:mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white font-orbitron">
                  {language === 'en-US' ? (
                    <>Danger <span className="text-rose-500">Zone</span></>
                  ) : (
                    <>Zona de <span className="text-rose-500">Perigo</span></>
                  )}
                </h2>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  {l('Ações Irreversíveis de Modificação de Matriz', 'Irreversible system actions')}
                </p>
              </div>
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                <ShieldAlert size={16} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Reset Simples (Zerar RPG) */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[#1e1e26] bg-black/30 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
                    {l('Zerar RPG (Atributos & XP)', 'Reset RPG (Attributes & XP)')}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                    {l(
                      'Retorna seu progresso ao Nível 1 e redefine todos os atributos base (FOR, INT, RES, VIT, DIS) para 10.',
                      'Returns your progress to Level 1 and resets every base attribute (STR, INT, END, VIT, DIS) to 10.'
                    )}
                    <span className="text-orange-400/90 font-bold block mt-1">
                      ⚠️ {l(
                        'Seus treinos, dietas, hábitos e tarefas permanecem intactos.',
                        'Your workouts, meal plans, habits, and tasks remain untouched.'
                      )}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetRpgModal(true)}
                  disabled={resetRpgLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl border border-orange-500/30 bg-orange-500/5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-orange-400 transition-all hover:bg-orange-500/20 hover:border-orange-500 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {resetRpgLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {l('Zerar Atributos', 'Reset Attributes')}
                </button>
              </div>

              {/* Reset Geral (Reset total) */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[#1e1e26] bg-black/30 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    {l('Destruir Registro (Reset Geral)', 'Destroy Record (Full Reset)')}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                    {l(
                      'Apaga permanentemente todos os treinos, refeições, tarefas, hábitos e históricos. Sua classe também será removida e o onboarding será reiniciado.',
                      'Permanently deletes all workouts, meals, tasks, habits, and history. Your class is also removed and onboarding starts again.'
                    )}
                    <span className="text-rose-500 font-bold block mt-1">
                      💀 {l('Ação totalmente irreversível!', 'This action cannot be undone!')}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetAllModal(true)}
                  disabled={resetAllLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-rose-500 transition-all hover:bg-rose-500/20 hover:border-rose-500 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {resetAllLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {l('Zerar Sistema do App', 'Reset Entire App')}
                </button>
              </div>

            </div>
          </motion.div>

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
              className="max-w-md w-full rounded-[2rem] border border-orange-500/30 bg-[#0F0F13] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black font-orbitron uppercase text-white tracking-wide">
                  {l('Purificar Atributos?', 'Reset Attributes?')}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {l(
                    'Você está prestes a redefinir seu nível de Caçador para 1, seu XP para 0 e todos os atributos RPG base para 10.',
                    'You are about to reset your Hunter level to 1, XP to 0, and every base RPG attribute to 10.'
                  )}
                </p>
                <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-500/10 text-xs text-orange-300 font-semibold leading-relaxed">
                  💡 {l(
                    'Seus hábitos, treinos, tarefas e planos alimentares NÃO serão afetados!',
                    'Your habits, workouts, tasks, and meal plans will NOT be affected!'
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                  <button
                    type="button"
                    onClick={() => setShowResetRpgModal(false)}
                    className="py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-black/60 active:scale-95 cursor-pointer"
                  >
                    {l('Abortar', 'Cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetRPG}
                    className="py-3 rounded-xl bg-orange-600 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-500 active:scale-95 cursor-pointer"
                  >
                    {l('Confirmar Reset', 'Confirm Reset')}
                  </button>
                </div>
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
              className="max-w-md w-full rounded-[2rem] border border-rose-500/30 bg-[#0F0F13] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black font-orbitron uppercase text-white tracking-wide">
                  {l('Destruição da Matriz!', 'Destroy System Record!')}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {l(
                    'Isso irá deletar de forma definitiva todos os seus treinos, rotinas, hábitos, tarefas, registros de comida e conquistas. Sua classe será apagada e você recomeçará do zero.',
                    'This permanently deletes all workouts, routines, habits, tasks, food logs, and achievements. Your Hunter class will be removed and you will start over.'
                  )}
                </p>
                
                <div className="w-full space-y-2 mt-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                    {l('Digite', 'Type')}{' '}
                    <span className="font-extrabold underline">{language === 'en-US' ? 'DELETE' : 'DESTRUIR'}</span>{' '}
                    {l('para confirmar', 'to confirm')}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'en-US' ? 'DELETE' : 'DESTRUIR'}
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    className="w-full py-3 rounded-xl border border-rose-500/30 bg-black/60 text-center text-sm font-black tracking-widest text-rose-500 uppercase placeholder-rose-950 focus:border-rose-500 focus:outline-none focus:bg-black/80"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetAllModal(false);
                      setResetConfirmText('');
                    }}
                    className="py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-black/60 active:scale-95 cursor-pointer"
                  >
                    {l('Cancelar', 'Cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetAll}
                    disabled={resetConfirmText.trim().toLowerCase() !== (language === 'en-US' ? 'delete' : 'destruir')}
                    className="py-3 rounded-xl bg-rose-600 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-500 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    {l('Confirmar Destruição', 'Confirm Deletion')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

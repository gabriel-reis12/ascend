import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Dumbbell,
  History,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  X,
  LayoutGrid,
  Table as TableIcon,
  Zap,
  Target,
  Layers,
  Repeat,
  Weight,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Trash2,
  Timer,
  Eye,
  Upload,
  CalendarDays,
  Gauge,
  Trophy,
  Play,
  Pause,
  RotateCcw,
  Settings2,
  Check,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useHunterStore } from '@/stores/useHunterStore';
import { useBossStore } from '@/stores/useBossStore';
import { WorkoutProgress } from '@/components/workouts/WorkoutProgress';
import { cn } from '@/lib/utils';
import { localDateString } from '@/lib/date';
import { WORKOUT_PROGRAM_PRESETS } from '@/data/workoutPresets';
import type { WorkoutProgramPreset } from '@/data/workoutPresets';
import { usePreferences } from '@/contexts/preferences';
import { translateUiText } from '@/lib/uiEnglish';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { NeonProgressBar } from '@/components/ui/neon-progress';
import { RankBadge } from '@/components/ui/rank-badge';

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  category: string;
  calories_per_minute: number;
  is_custom: boolean;
  created_by: string | null;
}

interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  weight_kg: number;
  order_index: number;
  exercise?: Exercise;
}

interface WorkoutRoutine {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  exercises?: RoutineExercise[];
  scheduled_days?: number[];
}

interface WorkoutLog {
  id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  weight_kg: number;
  logged_at: string;
  exercise?: Exercise;
}

const PROGRAM_META: Record<string, { objective: string; level: string; split: string; attributes: string }> = {
  'full-body-3x': { objective: 'Base muscular e consistência', level: 'Iniciante', split: 'Corpo inteiro A/B/C', attributes: 'FOR · VIT · RES' },
  'upper-lower-4x': { objective: 'Hipertrofia equilibrada', level: 'Intermediário', split: 'Upper / Lower 2x', attributes: 'FOR · RES · DIS' },
  'ppl-3x': { objective: 'Hipertrofia com recuperação', level: 'Iniciante', split: 'Push / Pull / Legs', attributes: 'FOR · VIT · DIS' },
  'ppl-6x': { objective: 'Volume e frequência máxima', level: 'Avançado', split: 'PPL repetido 2x', attributes: 'FOR · RES · DIS' },
  'abcd-4x': { objective: 'Hipertrofia por grupamento', level: 'Intermediário', split: 'Peito / Costas / Pernas / Ombros', attributes: 'FOR · VIT · DIS' },
  'abcde-5x': { objective: 'Especialização muscular', level: 'Avançado', split: 'Um grupamento por dia', attributes: 'FOR · DIS · RES' },
  'casa-3x': { objective: 'Condicionamento sem academia', level: 'Iniciante', split: 'Superiores / Inferiores / Core', attributes: 'VIT · RES · DIS' },
  'forca-base-3x': { objective: 'Progressão de força', level: 'Intermediário', split: 'Agachamento / Terra / Potência', attributes: 'FOR · RES · DIS' },
  'recomposicao-4x': { objective: 'Massa magra e gasto energético', level: 'Intermediário', split: 'Upper / Lower / Full / Cardio', attributes: 'VIT · FOR · RES' },
};

function inferEquipment(exercise: Exercise) {
  const name = exercise.name.toLowerCase();
  if (name.includes('halter')) return 'Halteres';
  if (name.includes('barra') || name.includes('terra') || name.includes('agachamento livre')) return 'Barra';
  if (name.includes('polia') || name.includes('pulley') || name.includes('cadeira') || name.includes('leg press') || name.includes('mesa')) return 'Máquina';
  if (name.includes('solo') || name.includes('prancha') || name.includes('flexão') || name.includes('polichinelo')) return 'Peso corporal';
  return 'Outros';
}

function inferDifficulty(exercise: Exercise) {
  const name = exercise.name.toLowerCase();
  if (name.includes('terra') || name.includes('agachamento livre') || name.includes('desenvolvimento militar')) return 'Avançado';
  if (exercise.category.toLowerCase().includes('flex') || exercise.category.toLowerCase().includes('mobil')) return 'Iniciante';
  return 'Intermediário';
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

const TRAINING_TABS = [
  { id: 'routines' as const, title: 'Hoje', description: 'Missão física atual', icon: Target, tone: 'cyan' },
  { id: 'presets' as const, title: 'Protocolos', description: 'Modelos de treino', icon: Layers, tone: 'amber' },
  { id: 'progress' as const, title: 'Evolução', description: 'Dados e progresso', icon: TrendingUp, tone: 'purple' },
  { id: 'library' as const, title: 'Arsenal', description: 'Biblioteca de exercícios', icon: Dumbbell, tone: 'cyan' },
];

export function Workouts() {
  const { language, t } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const tx = (value?: string | null) => (isEnglish && value ? translateUiText(value) : value);
  const dayLabels =
    language === 'en-US'
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const { user } = useAuth();
  const { addXp, updateStat, rank } = useHunterStore();

  const [activeTab, setActiveTab] = useState<'library' | 'routines' | 'progress' | 'presets'>('routines');
  const [selectedPreset, setSelectedPreset] = useState<WorkoutProgramPreset | null>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isImportingPreset, setIsImportingPreset] = useState(false);
  const [presetFilter, setPresetFilter] = useState<
    'Todos' | '3x na semana' | '4x na semana' | '5x na semana' | '6x na semana' | 'Treino em Casa'
  >('Todos');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('Todos');
  const [equipmentFilter, setEquipmentFilter] = useState('Todos');
  const [difficultyFilter, setDifficultyFilter] = useState('Todos');
  const [exerciseToAdd, setExerciseToAdd] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewExerciseModalOpen, setIsNewExerciseModalOpen] = useState(false);
  const [isNewRoutineModalOpen, setIsNewRoutineModalOpen] = useState(false);
  const [isEditRoutineModalOpen, setIsEditRoutineModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<WorkoutRoutine | null>(null);
  const [savedFeedbackId, setSavedFeedbackId] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    routineId: string | null;
    routineName: string;
  }>({
    isOpen: false,
    routineId: null,
    routineName: '',
  });

  // Routine Session State (carregados do localStorage para persistir em caso de refresh/bloqueio)
  const [isRoutineSessionOpen, setIsRoutineSessionOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ascend_active_workout_open') === 'true';
    } catch {
      return false;
    }
  });
  const [sessionExercises, setSessionExercises] = useState<RoutineExercise[]>(() => {
    try {
      const stored = localStorage.getItem('ascend_active_workout_exercises');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [completedSessionExs, setCompletedSessionExs] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('ascend_active_workout_completed');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [sessionRoutineId, setSessionRoutineId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('ascend_active_workout_routine_id');
    } catch {
      return null;
    }
  });

  // Sincroniza estado de treino ativo com o localStorage para suportar recarregamento de aba/bloqueio de tela
  useEffect(() => {
    try {
      localStorage.setItem('ascend_active_workout_open', String(isRoutineSessionOpen));
      localStorage.setItem('ascend_active_workout_exercises', JSON.stringify(sessionExercises));
      localStorage.setItem('ascend_active_workout_completed', JSON.stringify(completedSessionExs));
      if (sessionRoutineId) {
        localStorage.setItem('ascend_active_workout_routine_id', sessionRoutineId);
      } else {
        localStorage.removeItem('ascend_active_workout_routine_id');
      }
      if (user?.id) {
        if (isRoutineSessionOpen || (sessionRoutineId && completedSessionExs.length > 0)) {
          localStorage.setItem(
            `ascend_active_workout_${user.id}`,
            JSON.stringify({ routineId: sessionRoutineId, updatedAt: Date.now() }),
          );
        } else {
          localStorage.removeItem(`ascend_active_workout_${user.id}`);
        }
      }
    } catch (err) {
      console.error('Erro ao salvar sessão de treino no localStorage:', err);
    }
  }, [isRoutineSessionOpen, sessionExercises, completedSessionExs, sessionRoutineId, user?.id]);

  // Log Form State
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(12);
  const [weight, setWeight] = useState(0);

  // Rest Timer State
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);

  // New Exercise Form State
  const [newExName, setNewExName] = useState('');
  const [newExGroup, setNewExGroup] = useState('Peito');
  const [newExCategory, setNewExCategory] = useState('Força');

  // New Routine Form State
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDays, setNewRoutineDays] = useState<number[]>([]);

  // Management Search State
  const [routineExSearch, setRoutineExSearch] = useState('');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => prev - 1);
      }, 1000);
    } else if (restTimer === 0) {
      setIsResting(false);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  useEffect(() => {
    fetchData();
  }, [user]);

  // FIX: Mantém selectedRoutine sincronizado com o estado fresco após qualquer fetch
  useEffect(() => {
    if (selectedRoutine) {
      const updated = routines.find((r) => r.id === selectedRoutine.id);
      if (updated) {
        if (JSON.stringify(updated.exercises) !== JSON.stringify(selectedRoutine.exercises)) {
          setSelectedRoutine(updated);
        }
      }
    }
  }, [routines]);

  const triggerSavedFeedback = (id: string) => {
    setSavedFeedbackId(id);
    setTimeout(() => {
      setSavedFeedbackId((prev) => (prev === id ? null : prev));
    }, 1400);
  };

  const handleExerciseFieldChange = (reId: string, field: 'sets' | 'reps' | 'weight_kg', value: number) => {
    const safeVal = Math.max(0, value);
    setSelectedRoutine((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises?.map((re) => (re.id === reId ? { ...re, [field]: safeVal } : re)),
      };
    });
  };

  async function fetchData() {
    if (!user) {
      setLoading(false);
      setRoutines([]);
      setLogs([]);
      return;
    }
    setLoading(true);
    setDataError(null);

    const safetyTimer = setTimeout(() => {
      setLoading(false);
      console.warn('[Workouts] Safety timeout disparado.');
    }, 5000);

    try {
      const [
        { data: exData, error: exError },
        { data: routineData, error: routineError },
        { data: logData, error: logError },
      ] = await Promise.all([
        supabase.from('exercises').select('*').order('name'),
        supabase
          .from('workout_routines')
          .select(`
            *,
            exercises:routine_exercises(
              *,
              exercise:exercises(*)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('workout_logs')
          .select(`
            *,
            exercise:exercises(*)
          `)
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(100),
      ]);

      if (exError) throw exError;
      setExercises(exData || []);

      if (routineError) throw routineError;
      setRoutines(routineData || []);

      if (logError) throw logError;
      setLogs(logData || []);
    } catch (err) {
      console.error('Error fetching workout data:', err);
      setDataError(err instanceof Error ? err.message : String(err));
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  }

  async function handleUpdateRoutineExercise(reId: string, updates: Partial<RoutineExercise>) {
    try {
      setRoutines((prev) =>
        prev.map((r) => ({
          ...r,
          exercises: r.exercises?.map((re) => (re.id === reId ? { ...re, ...updates } : re)),
        })),
      );
      setSessionExercises((prev) => prev.map((re) => (re.id === reId ? { ...re, ...updates } : re)));

      const { error } = await supabase.from('routine_exercises').update(updates).eq('id', reId);
      if (error) throw error;
      triggerSavedFeedback(reId);
      fetchData();
    } catch (err) {
      console.error('Error updating routine exercise:', err);
    }
  }

  async function handleMoveExercise(routineId: string, exerciseId: string, direction: 'up' | 'down') {
    const routine = routines.find((r) => r.id === routineId);
    if (!routine || !routine.exercises) return;

    const sortedExs = [...routine.exercises].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const index = sortedExs.findIndex((e) => e.id === exerciseId);

    if (direction === 'up' && index > 0) {
      const temp = sortedExs[index - 1];
      sortedExs[index - 1] = sortedExs[index];
      sortedExs[index] = temp;
    } else if (direction === 'down' && index < sortedExs.length - 1) {
      const temp = sortedExs[index + 1];
      sortedExs[index + 1] = sortedExs[index];
      sortedExs[index] = temp;
    } else {
      return;
    }

    try {
      const updates = sortedExs.map((e, i) =>
        supabase.from('routine_exercises').update({ order_index: i }).eq('id', e.id),
      );
      await Promise.all(updates);
      fetchData();
    } catch (err) {
      console.error('Error reordering exercises:', err);
    }
  }

  const handleSessionFieldChange = (reId: string, field: 'sets' | 'reps' | 'weight_kg', value: number) => {
    const safeVal = Math.max(0, value);
    setSessionExercises((prev) => prev.map((re) => (re.id === reId ? { ...re, [field]: safeVal } : re)));
  };

  async function handleStartRoutine(routine: WorkoutRoutine) {
    if (!routine.exercises || routine.exercises.length === 0) {
      setSelectedRoutine(routine);
      setIsEditRoutineModalOpen(true);
      return;
    }
    if (sessionRoutineId === routine.id && sessionExercises.length > 0) {
      setIsRoutineSessionOpen(true);
      return;
    }
    const sortedExercises = [...routine.exercises].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    setSessionExercises(sortedExercises);
    setCompletedSessionExs([]);
    setSessionRoutineId(routine.id);
    setIsResting(false);
    setRestTimer(0);
    setRoutineExSearch('');
    setIsRoutineSessionOpen(true);
  }

  async function handleCompleteSessionExercise(ex: RoutineExercise) {
    if (!user) return;
    try {
      const { error } = await supabase.from('workout_logs').insert({
        user_id: user.id,
        exercise_id: ex.exercise_id,
        sets: ex.sets,
        reps: ex.reps,
        weight_kg: ex.weight_kg,
      });

      if (error) throw error;

      await supabase
        .from('routine_exercises')
        .update({
          weight_kg: ex.weight_kg,
          reps: ex.reps,
          sets: ex.sets,
        })
        .eq('id', ex.id);

      setCompletedSessionExs((prev) => (prev.includes(ex.id) ? prev : [...prev, ex.id]));
      setRestTimer(60);
      setIsResting(true);
      triggerSavedFeedback(ex.id);
    } catch (err) {
      console.error('Error logging session exercise:', err);
    }
  }

  async function handleInlineCompleteExercise(routine: WorkoutRoutine, ex: RoutineExercise) {
    if (!user) return;
    if (sessionRoutineId !== routine.id || sessionExercises.length === 0) {
      const sortedExercises = [...(routine.exercises || [])].sort(
        (a, b) => (a.order_index || 0) - (b.order_index || 0),
      );
      setSessionExercises(sortedExercises);
      setSessionRoutineId(routine.id);
      setCompletedSessionExs([ex.id]);
    } else if (completedSessionExs.includes(ex.id)) {
      setCompletedSessionExs((prev) => prev.filter((id) => id !== ex.id));
      return;
    }
    await handleCompleteSessionExercise(ex);
  }

  async function handleFinishRoutine() {
    if (!user || !sessionRoutineId) return;
    try {
      const activeRoutine = routines.find((r) => r.id === sessionRoutineId);
      const isCardio = activeRoutine
        ? activeRoutine.name.toLowerCase().includes('cardio') ||
        activeRoutine.exercises?.some((ex) => ex.exercise?.category?.toLowerCase() === 'cardio')
        : false;

      const xpReward = isCardio ? 25 : 30;
      const statTarget = isCardio ? 'endurance' : 'strength';

      await supabase.from('routine_completions').upsert(
        {
          user_id: user.id,
          routine_id: sessionRoutineId,
          completed_date: localDateString(),
          xp_awarded: xpReward,
        },
        { onConflict: 'user_id,routine_id,completed_date' },
      );

      const completionDate = localDateString();
      const xpResult = await addXp(xpReward, user.id, {
        eventId: `workout-routine:${sessionRoutineId}:${completionDate}`,
      });
      if (xpResult.awardedXp > 0) {
        await updateStat(statTarget, 2, user.id);
        await updateStat('vitality', 1, user.id);
        await updateStat('discipline', 1, user.id);
      }

      if (xpResult.awardedXp > 0) {
        await useBossStore.getState().attackActiveBoss(user.id, xpResult.awardedXp, 'workout');
      }

      setIsRoutineSessionOpen(false);
      setSessionRoutineId(null);
      setCompletedSessionExs([]);
      setSessionExercises([]);
      setIsResting(false);
      setRestTimer(0);
      fetchData();
    } catch (err) {
      console.error('Error finishing routine:', err);
    }
  }

  async function handleAddExerciseToSession(exercise: Exercise) {
    if (!sessionRoutineId) return;
    try {
      const newOrderIndex = sessionExercises.length;
      const { data, error } = await supabase
        .from('routine_exercises')
        .insert({
          routine_id: sessionRoutineId,
          exercise_id: exercise.id,
          sets: 3,
          reps: 12,
          weight_kg: 0,
          order_index: newOrderIndex,
        })
        .select('*, exercise:exercises(*)')
        .single();

      if (error) throw error;
      if (data) {
        setSessionExercises((prev) => [...prev, data]);
        setRoutineExSearch('');
      }
    } catch (err) {
      console.error('Error adding exercise to session:', err);
    }
  }

  async function handleAddExerciseToRoutine(routine: WorkoutRoutine, exercise: Exercise) {
    const alreadyExists = routine.exercises?.some((item) => item.exercise_id === exercise.id);
    if (alreadyExists) {
      alert(l('Este exercício já faz parte da rotina selecionada.', 'This exercise is already in the selected routine.'));
      return;
    }

    try {
      const { error } = await supabase.from('routine_exercises').insert({
        routine_id: routine.id,
        exercise_id: exercise.id,
        sets: 3,
        reps: 12,
        weight_kg: 0,
        order_index: routine.exercises?.length || 0,
      });
      if (error) throw error;
      setExerciseToAdd(null);
      await fetchData();
    } catch (err) {
      console.error('Error adding exercise to routine:', err);
      alert(l('Não foi possível adicionar o exercício à rotina.', 'Could not add exercise to routine.'));
    }
  }

  async function handleDeleteRoutine(routineId: string) {
    try {
      const { error: exError } = await supabase.from('routine_exercises').delete().eq('routine_id', routineId);
      if (exError) throw exError;

      const { error } = await supabase.from('workout_routines').delete().eq('id', routineId);
      if (error) throw error;

      if (selectedRoutine?.id === routineId) {
        setIsEditRoutineModalOpen(false);
        setSelectedRoutine(null);
      }
      if (sessionRoutineId === routineId) {
        setIsRoutineSessionOpen(false);
        setSessionRoutineId(null);
        setSessionExercises([]);
        setCompletedSessionExs([]);
      }

      setDeleteConfirm({ isOpen: false, routineId: null, routineName: '' });
      fetchData();
    } catch (err) {
      console.error('Error deleting routine:', err);
      alert(l('Erro ao excluir rotina. Tente novamente.', 'Error deleting routine. Try again.'));
    }
  }

  function confirmDelete(routine: WorkoutRoutine) {
    setDeleteConfirm({
      isOpen: true,
      routineId: routine.id,
      routineName: routine.name,
    });
  }

  async function handleCreateRoutine() {
    if (!user || !newRoutineName) return;

    try {
      const { error } = await supabase.from('workout_routines').insert({
        user_id: user.id,
        name: newRoutineName,
        scheduled_days: newRoutineDays,
      });

      if (error) throw error;

      setIsNewRoutineModalOpen(false);
      setNewRoutineName('');
      setNewRoutineDays([]);
      fetchData();
    } catch (err) {
      console.error('Error creating routine:', err);
    }
  }

  async function handleImportProgram(program: WorkoutProgramPreset) {
    if (!user) return;
    setLoading(true);
    setIsImportingPreset(true);
    setIsPresetModalOpen(false);
    try {
      const dayMap: Record<string, number> = {
        dom: 0,
        seg: 1,
        ter: 2,
        qua: 3,
        qui: 4,
        sex: 5,
        sab: 6,
      };

      const currentExercises = [...exercises];

      for (const r of program.routines) {
        const numericDays = r.scheduled_days
          .map((d) => dayMap[d.toLowerCase()])
          .filter((v) => v !== undefined);
        const { data: newRoutine, error: routineErr } = await supabase
          .from('workout_routines')
          .insert({
            user_id: user.id,
            name: r.name,
            scheduled_days: numericDays,
          })
          .select()
          .single();

        if (routineErr) throw routineErr;
        if (!newRoutine) throw new Error('Erro ao criar rotina.');

        for (let i = 0; i < r.exercises.length; i++) {
          const ex = r.exercises[i];
          const matchedExercise = currentExercises.find(
            (e) => e.name.toLowerCase().trim() === ex.name.toLowerCase().trim(),
          );

          let exerciseId = matchedExercise?.id;

          if (!exerciseId) {
            const { data: createdEx, error: createExErr } = await supabase
              .from('exercises')
              .insert({
                name: ex.name,
                muscle_group: ex.muscle_group,
                category: ex.category,
                is_custom: true,
                created_by: user.id,
              })
              .select()
              .single();

            if (createExErr) throw createExErr;
            if (!createdEx) throw new Error('Erro ao criar exercício.');

            exerciseId = createdEx.id;
            currentExercises.push(createdEx);
          }

          const { error: joinErr } = await supabase.from('routine_exercises').insert({
            routine_id: newRoutine.id,
            exercise_id: exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            weight_kg: ex.weight_kg,
            order_index: i,
          });

          if (joinErr) throw joinErr;
        }
      }

      setExercises(currentExercises);
      alert(l(`Programa "${program.title}" importado com sucesso!`, `Program "${program.title}" imported successfully!`));
      setActiveTab('routines');
      fetchData();
    } catch (err) {
      console.error('Erro ao importar programa de treino:', err);
      alert(l('Ocorreu um erro ao importar o programa de treino. Tente novamente.', 'Error importing workout program. Try again.'));
    } finally {
      setLoading(false);
      setIsImportingPreset(false);
    }
  }

  async function handleLogWorkout() {
    if (!user || !selectedExercise) return;

    try {
      const { data: workoutLog, error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: user.id,
          exercise_id: selectedExercise.id,
          sets,
          reps,
          weight_kg: weight,
        })
        .select('id')
        .single();

      if (error) throw error;

      const xpResult = await addXp(10, user.id, {
        eventId: `workout-log:${workoutLog.id}`,
      });

      if (xpResult.awardedXp > 0) {
        await useBossStore.getState().attackActiveBoss(user.id, xpResult.awardedXp, 'workout');
      }

      setIsModalOpen(false);
      setSelectedExercise(null);
      fetchData();
    } catch (err) {
      console.error('Error logging workout:', err);
    }
  }

  async function handleCreateExercise() {
    if (!user || !newExName.trim()) return;

    try {
      const { error } = await supabase.from('exercises').insert({
        name: newExName.trim(),
        muscle_group: newExGroup,
        category: newExCategory,
        is_custom: true,
        created_by: user.id,
      });

      if (error) {
        console.error('Erro ao cadastrar exercício:', error);
        alert(`Erro: ${error.message}`);
        return;
      }

      setIsNewExerciseModalOpen(false);
      setNewExName('');
      setNewExGroup('Peito');
      setNewExCategory('Força');
      fetchData();
    } catch (err) {
      console.error('Error creating exercise:', err);
    }
  }

  const muscleGroups = [...new Set(exercises.map((exercise) => exercise.muscle_group))].sort();
  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch =
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.muscle_group.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscle = muscleFilter === 'Todos' || exercise.muscle_group === muscleFilter;
    const matchesEquipment = equipmentFilter === 'Todos' || inferEquipment(exercise) === equipmentFilter;
    const matchesDifficulty = difficultyFilter === 'Todos' || inferDifficulty(exercise) === difficultyFilter;
    return matchesSearch && matchesMuscle && matchesEquipment && matchesDifficulty;
  });

  // Featured / Today's Routine resolution
  const activeRoutineFromSession = sessionRoutineId
    ? routines.find((r) => r.id === sessionRoutineId) || null
    : null;
  const scheduledTodayRoutine =
    routines.find((routine) => routine.scheduled_days?.includes(new Date().getDay())) || null;
  const featuredRoutine = activeRoutineFromSession || scheduledTodayRoutine || routines[0] || null;

  const featuredExercises = featuredRoutine
    ? sessionRoutineId === featuredRoutine.id && sessionExercises.length > 0
      ? sessionExercises
      : [...(featuredRoutine.exercises || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    : [];

  const featuredCompletedIds =
    featuredRoutine && sessionRoutineId === featuredRoutine.id ? completedSessionExs : [];

  const featuredTotalExercises = featuredExercises.length;
  const featuredCompletedCount = featuredCompletedIds.length;
  const featuredTotalSets = featuredExercises.reduce((sum, item) => sum + (item.sets || 0), 0);
  const featuredCompletedSets = featuredExercises
    .filter((item) => featuredCompletedIds.includes(item.id))
    .reduce((sum, item) => sum + (item.sets || 0), 0);

  const featuredIsCardio =
    featuredRoutine?.name.toLowerCase().includes('cardio') ||
    featuredExercises.some((item) => item.exercise?.category?.toLowerCase() === 'cardio') ||
    false;
  const featuredXpReward = featuredIsCardio ? 25 : 30;
  const featuredDuration = featuredRoutine ? Math.max(20, (featuredTotalExercises || 1) * 8) : 0;
  const featuredProgressPct =
    featuredTotalExercises > 0 ? Math.round((featuredCompletedCount / featuredTotalExercises) * 100) : 0;

  const activeSessionProgress =
    sessionExercises.length > 0 ? Math.round((completedSessionExs.length / sessionExercises.length) * 100) : 0;

  const handleContextAction = () => {
    if (activeTab === 'routines') {
      setIsNewRoutineModalOpen(true);
      return;
    }
    if (activeTab === 'presets') {
      setSelectedPreset(WORKOUT_PROGRAM_PRESETS[0] || null);
      setIsPresetModalOpen(Boolean(WORKOUT_PROGRAM_PRESETS[0]));
      return;
    }
    if (activeTab === 'progress') {
      if (exercises[0]) {
        setSelectedExercise(exercises[0]);
        setIsModalOpen(true);
      } else {
        setActiveTab('library');
      }
      return;
    }
    setIsNewExerciseModalOpen(true);
  };

  const contextualAction = {
    routines: { label: l('Nova Rotina', 'New Routine'), icon: Plus, variant: 'cyan' as const },
    presets: { label: l('Explorar Modelos', 'Explore Models'), icon: Upload, variant: 'amber' as const },
    progress: { label: l('Registrar Série', 'Log Set'), icon: Zap, variant: 'purple' as const },
    library: { label: l('Novo Exercício', 'New Exercise'), icon: Plus, variant: 'cyan' as const },
  }[activeTab];
  const ContextActionIcon = contextualAction.icon;

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-24">
      {/* HUD v2 Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
            <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">
              {l('CENTRO DE TREINAMENTO', 'TRAINING CENTER')}
            </span>
          </div>
          <h1 className="mt-0.5 truncate font-orbitron text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
            {t('pages.workouts')}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <RankBadge rank={rank as 'E' | 'D' | 'C' | 'B' | 'A' | 'S'} size="sm" showLabel={false} />
          <TacticalButton
            variant="secondary"
            accent={contextualAction.variant === 'amber' ? 'gold' : contextualAction.variant}
            onClick={handleContextAction}
            leftIcon={<ContextActionIcon className="size-3.5" />}
          >
            {contextualAction.label}
          </TacticalButton>
        </div>
      </div>

      {/* Navigation Tabs (Ergonomic Mobile-First HUD Bar) */}
      <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-white/10 bg-[#0D0F18]/90 p-1.5 backdrop-blur-md">
        {TRAINING_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center transition-all sm:flex-row sm:gap-2.5 sm:px-3',
                isActive
                  ? 'border-cyan-400/45 bg-cyan-500/15 text-cyan-200 shadow-[0_0_16px_rgba(0,240,255,0.14)]'
                  : 'border-transparent bg-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200',
              )}
            >
              <TabIcon className={cn('size-4 shrink-0', isActive ? 'text-cyan-300' : 'text-slate-400')} />
              <span className="truncate font-orbitron text-[10px] font-black uppercase tracking-wider sm:text-xs">
                {tx(tab.title)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Rest Timer Floating Banner (when resting and modal is closed) */}
      {isResting && restTimer > 0 && !isRoutineSessionOpen && (
        <HudCard variant="cyan" className="p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-300">
                <Timer className="size-5 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                  {l('Descanso em Andamento', 'Rest Timer Active')}
                </p>
                <p className="font-mono text-lg font-black text-white">{formatTimer(restTimer)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRestTimer((prev) => prev + 30)}
                className="min-h-[40px] rounded-xl border border-white/10 bg-white/5 px-3 font-mono text-xs font-bold text-slate-200 hover:bg-white/10"
              >
                +30s
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResting(false);
                  setRestTimer(0);
                }}
                className="min-h-[40px] rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-bold uppercase text-rose-300"
              >
                {l('Pular', 'Skip')}
              </button>
            </div>
          </div>
        </HudCard>
      )}

      {/* Main Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="space-y-5"
      >
        {dataError && (
          <HudCard variant="crimson" className="p-4">
            <p className="text-xs font-semibold text-rose-200">
              <span className="font-orbitron font-black uppercase tracking-wider text-rose-400">
                {l('Falha na sincronização: ', 'Sync failure: ')}
              </span>
              {dataError}
            </p>
          </HudCard>
        )}

        {/* TAB 1: HOJE & ROTINAS */}
        {activeTab === 'routines' && (
          <div className="space-y-6">
            {/* Hero Summary Card: TODAY'S WORKOUT (Ref: ascend-training.jpg) */}
            {featuredRoutine ? (
              <div className="space-y-4">
                <HudCard variant="cyan" corners className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400">
                          {sessionRoutineId === featuredRoutine.id && featuredCompletedCount > 0
                            ? l('TREINO EM ANDAMENTO', 'WORKOUT IN PROGRESS')
                            : scheduledTodayRoutine?.id === featuredRoutine.id
                              ? l('TREINO DE HOJE', "TODAY'S WORKOUT")
                              : l('TREINO SELECIONADO', 'SELECTED WORKOUT')}
                        </span>
                      </div>
                      <h2 className="mt-1 truncate font-orbitron text-lg font-black uppercase tracking-tight text-white sm:text-2xl">
                        {featuredRoutine.name}
                      </h2>

                      {/* Metadata Pill (Exercises • Duration • XP Reward) */}
                      <div className="mt-2.5 inline-flex flex-wrap items-center gap-2 rounded-full border border-cyan-400/25 bg-[#090B12]/80 px-3.5 py-1.5 text-xs font-semibold text-slate-200">
                        <span>
                          {l('Exercícios:', 'Exercises:')}{' '}
                          <strong className="font-mono text-white">{featuredTotalExercises}</strong>
                        </span>
                        <span className="text-cyan-400/50">•</span>
                        <span className="font-mono text-slate-300">{featuredDuration} min</span>
                        <span className="text-cyan-400/50">•</span>
                        <span className="font-mono font-bold text-amber-400">+{featuredXpReward} XP</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRoutine(featuredRoutine);
                        setIsEditRoutineModalOpen(true);
                      }}
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
                      aria-label={l('Configurar rotina', 'Configure routine')}
                    >
                      <Settings2 className="size-4" />
                    </button>
                  </div>

                  {/* Workout Progress Bar */}
                  <div className="mt-4 space-y-2">
                    <NeonProgressBar value={featuredProgressPct} max={100} variant="cyan" size="md" />
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                      <span className="font-mono text-slate-400">
                        {l('Séries:', 'Sets:')} {featuredCompletedSets}/{featuredTotalSets}
                      </span>
                      <span className="font-orbitron text-cyan-300">
                        {featuredCompletedCount}/{featuredTotalExercises}{' '}
                        {l('CONCLUÍDOS', 'COMPLETED')}
                      </span>
                    </div>
                  </div>
                </HudCard>

                {/* Exercise Cards List for Featured / Today's Workout */}
                {featuredExercises.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="font-orbitron text-xs font-black uppercase tracking-[0.18em] text-slate-300">
                        {l('Sequência de Exercícios', 'Exercise Sequence')}
                      </h3>
                      <span className="text-[11px] font-medium text-slate-400">
                        {l('Ajuste rápido de carga e séries', 'Quick weight & set controls')}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {featuredExercises.map((re, idx) => {
                        const isCompleted = featuredCompletedIds.includes(re.id);
                        const previousLog = logs.find((logItem) => logItem.exercise_id === re.exercise_id);
                        const isSaved = savedFeedbackId === re.id;

                        return (
                          <HudCard
                            key={re.id}
                            variant={isCompleted ? 'success' : idx === featuredCompletedCount ? 'cyan' : 'default'}
                            className="p-3.5 sm:p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => handleInlineCompleteExercise(featuredRoutine, re)}
                                  aria-label={
                                    isCompleted
                                      ? l('Desmarcar exercício', 'Unmark exercise')
                                      : l('Concluir exercício', 'Complete exercise')
                                  }
                                  className={cn(
                                    'flex size-11 shrink-0 items-center justify-center rounded-xl border transition-all',
                                    isCompleted
                                      ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                                      : 'border-cyan-400/25 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400/50',
                                  )}
                                >
                                  {isCompleted ? (
                                    <Check className="size-5" strokeWidth={3} />
                                  ) : (
                                    <Dumbbell className="size-5" />
                                  )}
                                </button>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-mono text-[10px] font-bold uppercase text-cyan-400">
                                      #{idx + 1}
                                    </span>
                                    <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-300">
                                      {tx(re.exercise?.muscle_group)}
                                    </span>
                                    {previousLog && (
                                      <span className="inline-flex items-center gap-1 rounded-md border border-purple-400/20 bg-purple-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-purple-300">
                                        <History className="size-2.5" />
                                        {previousLog.weight_kg}kg × {previousLog.reps}r
                                      </span>
                                    )}
                                    {isSaved && (
                                      <span className="text-[10px] font-bold uppercase text-emerald-400">
                                        {l('Salvo ✓', 'Saved ✓')}
                                      </span>
                                    )}
                                  </div>

                                  <h4
                                    className={cn(
                                      'mt-1 truncate font-orbitron text-sm font-black uppercase tracking-tight sm:text-base',
                                      isCompleted ? 'text-emerald-200 line-through opacity-85' : 'text-white',
                                    )}
                                  >
                                    {tx(re.exercise?.name)}
                                  </h4>

                                  <p className="mt-0.5 font-mono text-xs font-semibold text-slate-300">
                                    {re.sets} {l('séries', 'sets')} × {re.reps} reps •{' '}
                                    <span className="font-bold text-cyan-300">{re.weight_kg} kg</span>
                                  </p>
                                </div>
                              </div>

                              {/* Quick Weight Stepper (- / +) & Complete Toggle */}
                              <div className="flex shrink-0 items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateRoutineExercise(re.id, {
                                      weight_kg: Math.max(0, Number((re.weight_kg - 2.5).toFixed(1))),
                                    })
                                  }
                                  className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-[#0A0C14] font-mono text-base font-bold text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-white active:scale-95"
                                  aria-label={l('Reduzir carga', 'Decrease weight')}
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateRoutineExercise(re.id, {
                                      weight_kg: Number((re.weight_kg + 2.5).toFixed(1)),
                                    })
                                  }
                                  className="flex size-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 font-mono text-base font-bold text-cyan-200 transition-colors hover:bg-cyan-500/20 hover:text-white active:scale-95"
                                  aria-label={l('Aumentar carga', 'Increase weight')}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Inline Numeric Fields (Sets / Reps / Weight KG) */}
                            <div className="mt-3 grid grid-cols-4 gap-2 border-t border-white/[0.06] pt-3">
                              <label className="flex flex-col rounded-xl border border-white/[0.07] bg-[#090B12]/90 px-2.5 py-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                  {l('Séries', 'Sets')}
                                </span>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min={1}
                                  value={re.sets}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                    handleSessionFieldChange(re.id, 'sets', val);
                                    setRoutines((prev) =>
                                      prev.map((r) => ({
                                        ...r,
                                        exercises: r.exercises?.map((item) =>
                                          item.id === re.id ? { ...item, sets: val } : item,
                                        ),
                                      })),
                                    );
                                  }}
                                  onBlur={(e) =>
                                    handleUpdateRoutineExercise(re.id, {
                                      sets: Math.max(1, parseInt(e.target.value) || 1),
                                    })
                                  }
                                  className="mt-0.5 w-full bg-transparent font-mono text-sm font-black text-white focus:outline-none"
                                />
                              </label>

                              <label className="flex flex-col rounded-xl border border-white/[0.07] bg-[#090B12]/90 px-2.5 py-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                  Reps
                                </span>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min={1}
                                  value={re.reps}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                    handleSessionFieldChange(re.id, 'reps', val);
                                    setRoutines((prev) =>
                                      prev.map((r) => ({
                                        ...r,
                                        exercises: r.exercises?.map((item) =>
                                          item.id === re.id ? { ...item, reps: val } : item,
                                        ),
                                      })),
                                    );
                                  }}
                                  onBlur={(e) =>
                                    handleUpdateRoutineExercise(re.id, {
                                      reps: Math.max(1, parseInt(e.target.value) || 1),
                                    })
                                  }
                                  className="mt-0.5 w-full bg-transparent font-mono text-sm font-black text-white focus:outline-none"
                                />
                              </label>

                              <label className="flex flex-col rounded-xl border border-cyan-400/20 bg-[#090B12]/90 px-2.5 py-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400">
                                  {l('Carga (KG)', 'Weight (KG)')}
                                </span>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.5"
                                  min={0}
                                  value={re.weight_kg}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                                    handleSessionFieldChange(re.id, 'weight_kg', val);
                                    setRoutines((prev) =>
                                      prev.map((r) => ({
                                        ...r,
                                        exercises: r.exercises?.map((item) =>
                                          item.id === re.id ? { ...item, weight_kg: val } : item,
                                        ),
                                      })),
                                    );
                                  }}
                                  onBlur={(e) =>
                                    handleUpdateRoutineExercise(re.id, {
                                      weight_kg: Math.max(0, parseFloat(e.target.value) || 0),
                                    })
                                  }
                                  className="mt-0.5 w-full bg-transparent font-mono text-sm font-black text-cyan-300 focus:outline-none"
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() => handleInlineCompleteExercise(featuredRoutine, re)}
                                className={cn(
                                  'flex min-h-[44px] flex-col items-center justify-center rounded-xl border px-2 text-center font-orbitron text-[10px] font-black uppercase tracking-wider transition-all',
                                  isCompleted
                                    ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
                                    : 'border-cyan-400/35 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25',
                                )}
                              >
                                {isCompleted ? l('Feito ✓', 'Done ✓') : l('Concluir', 'Complete')}
                              </button>
                            </div>
                          </HudCard>
                        );
                      })}
                    </div>

                    {/* Primary Bottom CTA for Today's Workout */}
                    <div className="pt-1">
                      {sessionRoutineId === featuredRoutine.id && featuredCompletedCount > 0 ? (
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          <TacticalButton
                            variant="secondary"
                            fullWidth
                            displayFont
                            leftIcon={<Timer className="size-4" />}
                            onClick={() => handleStartRoutine(featuredRoutine)}
                          >
                            {l('Abrir Modo Foco & Timer', 'Open Focus Mode & Timer')}
                          </TacticalButton>
                          <TacticalButton
                            variant="primary"
                            fullWidth
                            displayFont
                            leftIcon={<CheckCircle2 className="size-4" />}
                            onClick={handleFinishRoutine}
                          >
                            {l(`Finalizar Treino (+${featuredXpReward} XP)`, `Finish Workout (+${featuredXpReward} XP)`)}
                          </TacticalButton>
                        </div>
                      ) : (
                        <TacticalButton
                          variant="primary"
                          fullWidth
                          displayFont
                          leftIcon={<Zap className="size-4" />}
                          onClick={() => handleStartRoutine(featuredRoutine)}
                        >
                          {l('INICIAR TREINO', 'START WORKOUT')}
                        </TacticalButton>
                      )}
                    </div>
                  </div>
                ) : (
                  <HudCard variant="default" className="p-6 text-center">
                    <p className="text-xs text-slate-400">
                      {l(
                        'Esta rotina ainda não possui exercícios configurados.',
                        'This routine does not have exercises configured yet.',
                      )}
                    </p>
                    <div className="mt-4 flex justify-center">
                      <TacticalButton
                        variant="primary"
                        onClick={() => {
                          setSelectedRoutine(featuredRoutine);
                          setIsEditRoutineModalOpen(true);
                        }}
                        leftIcon={<Plus className="size-4" />}
                      >
                        {l('Adicionar Exercícios', 'Add Exercises')}
                      </TacticalButton>
                    </div>
                  </HudCard>
                )}
              </div>
            ) : null}

            {/* All Registered Routines Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-orbitron text-xs font-black uppercase tracking-[0.18em] text-slate-300">
                  {l('Minhas Rotinas de Treino', 'My Workout Routines')} ({routines.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewRoutineModalOpen(true)}
                  className="text-xs font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300"
                >
                  + {l('Nova Rotina', 'New Routine')}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {routines.map((routine) => {
                  const sortedRoutineExercises = [...(routine.exercises || [])].sort(
                    (a, b) => (a.order_index || 0) - (b.order_index || 0),
                  );
                  const routineExerciseIds = new Set(sortedRoutineExercises.map((item) => item.exercise_id));
                  const lastRoutineLog = logs.find((logItem) => routineExerciseIds.has(logItem.exercise_id));
                  const isActiveSession = sessionRoutineId === routine.id && completedSessionExs.length > 0;
                  const routineProgress = isActiveSession ? activeSessionProgress : 0;
                  const isScheduledToday = routine.scheduled_days?.includes(new Date().getDay());

                  return (
                    <HudCard
                      key={routine.id}
                      variant={isActiveSession ? 'cyan' : isScheduledToday ? 'purple' : 'default'}
                      className="flex flex-col justify-between p-4 sm:p-5"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {isScheduledToday && (
                                <span className="rounded-md border border-purple-400/35 bg-purple-500/15 px-2 py-0.5 font-orbitron text-[9px] font-black uppercase tracking-wider text-purple-300">
                                  {l('Hoje', 'Today')}
                                </span>
                              )}
                              {isActiveSession && (
                                <span className="rounded-md border border-cyan-400/35 bg-cyan-500/15 px-2 py-0.5 font-orbitron text-[9px] font-black uppercase tracking-wider text-cyan-300">
                                  {l('Em Andamento', 'In Progress')}
                                </span>
                              )}
                              <span className="font-mono text-[10px] font-semibold text-slate-400">
                                {sortedRoutineExercises.length} {l('exercícios', 'exercises')}
                              </span>
                            </div>

                            <h4 className="mt-1.5 truncate font-orbitron text-base font-black uppercase tracking-tight text-white">
                              {routine.name}
                            </h4>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRoutine(routine);
                                setIsEditRoutineModalOpen(true);
                              }}
                              className="flex min-h-[40px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[10px] font-bold uppercase tracking-wider text-slate-300 transition-colors hover:border-cyan-400/30 hover:text-white"
                            >
                              {l('Gerenciar', 'Manage')}
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDelete(routine)}
                              aria-label={l(`Excluir rotina ${routine.name}`, `Delete routine ${routine.name}`)}
                              className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>

                        {/* Scheduled Days Pills */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {dayLabels.map((day, idx) => {
                            const isScheduled = routine.scheduled_days?.includes(idx);
                            return (
                              <span
                                key={day}
                                className={cn(
                                  'rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                                  isScheduled
                                    ? 'border-cyan-400/35 bg-cyan-500/15 text-cyan-200'
                                    : 'border-white/[0.05] bg-black/20 text-slate-600',
                                )}
                              >
                                {day}
                              </span>
                            );
                          })}
                        </div>

                        {/* Last log & progress */}
                        <div className="mt-3.5 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                            <span>
                              {lastRoutineLog
                                ? `${l('Último:', 'Last:')} ${new Date(lastRoutineLog.logged_at).toLocaleDateString(language)}`
                                : l('Sem registros', 'No logs yet')}
                            </span>
                            <span className="font-mono text-cyan-300">{routineProgress}%</span>
                          </div>
                          <NeonProgressBar value={routineProgress} max={100} variant="cyan" size="sm" />
                        </div>
                      </div>

                      <div className="mt-4 pt-2">
                        <TacticalButton
                          variant={isActiveSession ? 'primary' : 'secondary'}
                          fullWidth
                          displayFont
                          leftIcon={<Zap className="size-4" />}
                          onClick={() => handleStartRoutine(routine)}
                        >
                          {isActiveSession
                            ? l('Continuar Treino', 'Continue Workout')
                            : l('Iniciar Treino', 'Start Workout')}
                        </TacticalButton>
                      </div>
                    </HudCard>
                  );
                })}

                {routines.length === 0 && !loading && (
                  <HudCard variant="default" className="col-span-full p-8 text-center">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-400">
                      <Layers className="size-7" />
                    </div>
                    <h3 className="mt-4 font-orbitron text-sm font-black uppercase tracking-wider text-white">
                      {l('Nenhuma Rotina Cadastrada', 'No Routines Registered')}
                    </h3>
                    <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-400">
                      {l(
                        'Crie uma rotina personalizada ou importe um protocolo pronto para iniciar seu treinamento.',
                        'Create a custom routine or import a preset protocol to start your training.',
                      )}
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                      <TacticalButton
                        variant="primary"
                        leftIcon={<Plus className="size-4" />}
                        onClick={() => setIsNewRoutineModalOpen(true)}
                      >
                        {l('Criar Rotina', 'Create Routine')}
                      </TacticalButton>
                      <TacticalButton
                        variant="secondary"
                        accent="gold"
                        leftIcon={<Layers className="size-4" />}
                        onClick={() => setActiveTab('presets')}
                      >
                        {l('Ver Protocolos', 'View Protocols')}
                      </TacticalButton>
                    </div>
                  </HudCard>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROTOCOLOS (PRESETS) */}
        {activeTab === 'presets' && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-1.5">
              {(
                ['Todos', '3x na semana', '4x na semana', '5x na semana', '6x na semana', 'Treino em Casa'] as const
              ).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setPresetFilter(filter)}
                  className={cn(
                    'min-h-[40px] rounded-xl border px-3.5 py-2 font-orbitron text-[10px] font-black uppercase tracking-wider transition-all',
                    presetFilter === filter
                      ? 'border-amber-400/50 bg-amber-500/15 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'border-white/10 bg-[#0D0F18] text-slate-400 hover:border-amber-400/30 hover:text-amber-300',
                  )}
                >
                  {filter === 'Treino em Casa'
                    ? l('Em Casa', 'Home')
                    : filter === 'Todos'
                      ? l('Todos', 'All')
                      : tx(filter)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WORKOUT_PROGRAM_PRESETS.filter(
                (p) => presetFilter === 'Todos' || p.frequency === presetFilter,
              ).map((program) => {
                const meta = PROGRAM_META[program.id] || {
                  objective: l('Evolução física estruturada', 'Structured physical progression'),
                  level: l('Intermediário', 'Intermediate'),
                  split: program.routines.map((routine) => routine.name).join(' / '),
                  attributes: 'FOR · VIT · RES',
                };
                const programFrequency = tx(program.frequency);
                const programTitle = tx(program.title);
                const programDescription = tx(program.description);
                const programDuration = tx(program.estimatedDuration)?.replace(
                  l(' por sessão', ' per session'),
                  '',
                );
                const programObjective = tx(meta.objective);
                const programLevel = tx(meta.level);
                const programSplit = tx(meta.split);
                const programAttributes = tx(meta.attributes);

                return (
                  <HudCard
                    key={program.id}
                    variant="gold"
                    className="group flex flex-col overflow-hidden p-0"
                  >
                    <div className="relative h-36 overflow-hidden border-b border-white/10 bg-[#09090D]">
                      <img
                        src={program.image}
                        alt={l(`Arte do protocolo ${program.title}`, `Artwork for ${programTitle} protocol`)}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F18] via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span className="rounded-lg border border-amber-400/30 bg-black/70 px-2.5 py-1 font-orbitron text-[9px] font-black uppercase tracking-widest text-amber-300 backdrop-blur-md">
                          {programFrequency}
                        </span>
                        <span className="rounded-md border border-white/15 bg-black/70 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-300 backdrop-blur-md">
                          {programLevel}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      <h3 className="font-orbitron text-base font-black uppercase tracking-tight text-white">
                        {programTitle}
                      </h3>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        {programObjective}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
                        {programDescription}
                      </p>

                      <div className="mt-3.5 grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-white/[0.06] bg-black/30 p-2.5">
                          <div className="flex items-center gap-1.5 text-cyan-400">
                            <CalendarDays className="size-3.5" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              {l('Duração', 'Duration')}
                            </span>
                          </div>
                          <p className="mt-1 font-mono text-xs font-bold text-slate-200">{programDuration}</p>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-black/30 p-2.5">
                          <div className="flex items-center gap-1.5 text-purple-400">
                            <Gauge className="size-3.5" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              {l('Atributos', 'Attributes')}
                            </span>
                          </div>
                          <p className="mt-1 font-mono text-xs font-bold text-purple-300">{programAttributes}</p>
                        </div>
                      </div>

                      <div className="mt-2.5 rounded-xl border border-white/[0.06] bg-black/20 p-2.5">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          {l('Divisão semanal', 'Weekly split')}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-300">
                          {programSplit}
                        </p>
                      </div>

                      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                        <TacticalButton
                          variant="secondary"
                          leftIcon={<Eye className="size-3.5" />}
                          onClick={() => {
                            setSelectedPreset(program);
                            setIsPresetModalOpen(true);
                          }}
                        >
                          {l('Visualizar', 'Inspect')}
                        </TacticalButton>
                        <TacticalButton
                          variant="secondary"
                          accent="gold"
                          disabled={loading}
                          leftIcon={<Upload className="size-3.5" />}
                          onClick={() => handleImportProgram(program)}
                        >
                          {loading && isImportingPreset ? l('Importando...', 'Importing...') : l('Importar', 'Import')}
                        </TacticalButton>
                      </div>
                    </div>
                  </HudCard>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: EVOLUÇÃO (PROGRESS) */}
        {activeTab === 'progress' && <WorkoutProgress />}

        {/* TAB 4: ARSENAL (EXERCISE LIBRARY) */}
        {activeTab === 'library' && (
          <div className="space-y-4">
            <HudCard variant="default" className="p-3.5 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={l(
                      'Buscar exercício ou grupo muscular...',
                      'Search exercise or muscle group...',
                    )}
                    className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#090B12] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1 self-end rounded-xl border border-white/10 bg-[#090B12] p-1 sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-label={l('Visualização em grade', 'Grid view')}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-lg transition-colors',
                      viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white',
                    )}
                  >
                    <LayoutGrid className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    aria-label={l('Visualização compacta', 'Compact view')}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-lg transition-colors',
                      viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white',
                    )}
                  >
                    <TableIcon className="size-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <select
                  value={muscleFilter}
                  onChange={(e) => setMuscleFilter(e.target.value)}
                  className="min-h-[42px] rounded-xl border border-white/10 bg-[#090B12] px-3.5 py-2 text-xs font-bold text-slate-200 outline-none focus:border-cyan-400/50"
                >
                  <option value="Todos">{l('Todos os grupos', 'All muscle groups')}</option>
                  {muscleGroups.map((group) => (
                    <option key={group} value={group}>
                      {tx(group)}
                    </option>
                  ))}
                </select>
                <select
                  value={equipmentFilter}
                  onChange={(e) => setEquipmentFilter(e.target.value)}
                  className="min-h-[42px] rounded-xl border border-white/10 bg-[#090B12] px-3.5 py-2 text-xs font-bold text-slate-200 outline-none focus:border-cyan-400/50"
                >
                  {['Todos', 'Barra', 'Halteres', 'Máquina', 'Peso corporal', 'Outros'].map((option) => (
                    <option key={option} value={option}>
                      {option === 'Todos' ? l('Todos os equipamentos', 'All equipment') : tx(option)}
                    </option>
                  ))}
                </select>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="min-h-[42px] rounded-xl border border-white/10 bg-[#090B12] px-3.5 py-2 text-xs font-bold text-slate-200 outline-none focus:border-cyan-400/50"
                >
                  {['Todos', 'Iniciante', 'Intermediário', 'Avançado'].map((option) => (
                    <option key={option} value={option}>
                      {option === 'Todos' ? l('Todas as dificuldades', 'All difficulties') : tx(option)}
                    </option>
                  ))}
                </select>
              </div>
            </HudCard>

            {loading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="h-40 animate-pulse rounded-2xl border border-white/10 bg-[#12131C]/80"
                    />
                  ))}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredExercises.map((ex) => {
                  const lastLog = logs.find((item) => item.exercise_id === ex.id);
                  return (
                    <HudCard key={ex.id} variant="default" className="flex flex-col justify-between p-4">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex size-9 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-400">
                            <Dumbbell className="size-4" />
                          </div>
                          <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            {tx(inferDifficulty(ex))}
                          </span>
                        </div>

                        <h3 className="mt-3 font-orbitron text-xs font-black uppercase leading-snug text-white sm:text-sm">
                          {tx(ex.name)}
                        </h3>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                          {tx(ex.muscle_group)} · {tx(ex.category)}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                          <span>{tx(inferEquipment(ex))}</span>
                          {lastLog && (
                            <span className="font-mono text-purple-300">
                              {l('Último:', 'Last:')} {lastLog.weight_kg}kg × {lastLog.reps}r
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExercise(ex);
                            setIsModalOpen(true);
                          }}
                          className="min-h-[40px] rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[10px] font-bold uppercase tracking-wider text-slate-200 transition-colors hover:border-cyan-400/35 hover:text-white"
                        >
                          {l('Registrar', 'Log Set')}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            routines.length === 0 ? setIsNewRoutineModalOpen(true) : setExerciseToAdd(ex)
                          }
                          className="min-h-[40px] rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-3 text-[10px] font-bold uppercase tracking-wider text-cyan-200 transition-colors hover:bg-cyan-500/25 hover:text-white"
                        >
                          + {l('Rotina', 'Routine')}
                        </button>
                      </div>
                    </HudCard>
                  );
                })}
                {filteredExercises.length === 0 && (
                  <HudCard variant="default" className="col-span-full p-8 text-center">
                    <Search className="mx-auto size-7 text-slate-500" />
                    <p className="mt-3 font-orbitron text-xs font-black uppercase tracking-wider text-white">
                      {l('Nenhum exercício encontrado', 'No exercises found')}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {l(
                        'Ajuste os filtros ou cadastre um novo exercício personalizado.',
                        'Adjust the filters or create a new custom exercise.',
                      )}
                    </p>
                  </HudCard>
                )}
              </div>
            ) : (
              /* Compact List Mode (Responsive cards on mobile, table on desktop) */
              <div className="space-y-2">
                {filteredExercises.map((ex) => {
                  const lastLog = logs.find((item) => item.exercise_id === ex.id);
                  return (
                    <HudCard key={ex.id} variant="default" className="p-3 sm:px-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-orbitron text-xs font-black uppercase text-white">
                            {tx(ex.name)}
                          </p>
                          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                            {tx(ex.muscle_group)} · {tx(ex.category)}
                            {lastLog ? ` · ${lastLog.weight_kg}kg × ${lastLog.reps}r` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedExercise(ex);
                              setIsModalOpen(true);
                            }}
                            className="min-h-[40px] rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[10px] font-bold uppercase tracking-wider text-slate-200 hover:border-cyan-400/40"
                          >
                            {l('Registrar', 'Log')}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              routines.length === 0 ? setIsNewRoutineModalOpen(true) : setExerciseToAdd(ex)
                            }
                            className="min-h-[40px] rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-3 text-[10px] font-bold uppercase tracking-wider text-cyan-200"
                          >
                            + {l('Rotina', 'Add')}
                          </button>
                        </div>
                      </div>
                    </HudCard>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* MODALS & ACTIVE WORKOUT HUD */}
      <AnimatePresence>
        {/* 1. Log Individual Exercise Modal */}
        {isModalOpen && selectedExercise && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="relative w-full max-w-md overflow-hidden rounded-t-3xl border border-cyan-400/30 bg-[#0D0F18] p-6 shadow-2xl sm:rounded-3xl"
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white"
                aria-label={l('Fechar registro de treino', 'Close workout log')}
              >
                <X className="size-5" />
              </button>

              <div className="flex items-center gap-3.5 pr-12">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-300">
                  <Dumbbell className="size-6" />
                </div>
                <div className="min-w-0">
                  <span className="font-orbitron text-[10px] font-black uppercase tracking-widest text-cyan-400">
                    {tx(selectedExercise.muscle_group)} · +10 XP
                  </span>
                  <h2 className="truncate font-orbitron text-base font-black uppercase text-white sm:text-lg">
                    {tx(selectedExercise.name)}
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-[#090B12] p-3.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {l('Séries', 'Sets')}
                    </label>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSets(Math.max(1, sets - 1))}
                        className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 font-mono text-base font-bold text-white"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={sets}
                        onChange={(e) => setSets(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 bg-transparent text-center font-orbitron text-lg font-black text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setSets(sets + 1)}
                        className="flex size-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 font-mono text-base font-bold text-cyan-200"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#090B12] p-3.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {l('Repetições', 'Reps')}
                    </label>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setReps(Math.max(1, reps - 1))}
                        className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 font-mono text-base font-bold text-white"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={reps}
                        onChange={(e) => setReps(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 bg-transparent text-center font-orbitron text-lg font-black text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setReps(reps + 1)}
                        className="flex size-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 font-mono text-base font-bold text-cyan-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-400/25 bg-[#090B12] p-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                      {l('Carga Utilizada (KG)', 'Weight Used (KG)')}
                    </label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setWeight(Math.max(0, Number((weight - 2.5).toFixed(1))))}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs font-bold text-slate-300"
                      >
                        -2.5kg
                      </button>
                      <button
                        type="button"
                        onClick={() => setWeight(Number((weight + 2.5).toFixed(1)))}
                        className="rounded-lg border border-cyan-400/30 bg-cyan-500/15 px-2.5 py-1 font-mono text-xs font-bold text-cyan-200"
                      >
                        +2.5kg
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min={0}
                    value={weight}
                    onChange={(e) => setWeight(Math.max(0, Number(e.target.value)))}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-center font-orbitron text-xl font-black text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <TacticalButton
                  variant="primary"
                  fullWidth
                  displayFont
                  leftIcon={<Zap className="size-4" />}
                  onClick={handleLogWorkout}
                >
                  {l('Confirmar Série (+10 XP)', 'Confirm Set (+10 XP)')}
                </TacticalButton>
              </div>
            </motion.div>
          </div>
        )}

        {/* 2. Add Exercise to Routine Picker Modal */}
        {exerciseToAdd && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExerciseToAdd(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="relative w-full max-w-md rounded-t-3xl border border-cyan-400/30 bg-[#0D0F18] p-6 shadow-2xl sm:rounded-3xl"
            >
              <button
                type="button"
                onClick={() => setExerciseToAdd(null)}
                className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
              <p className="font-orbitron text-[10px] font-black uppercase tracking-widest text-cyan-400">
                {l('Vincular ao Protocolo', 'Attach to Routine')}
              </p>
              <h2 className="mt-1 pr-10 font-orbitron text-lg font-black uppercase text-white">
                {tx(exerciseToAdd.name)}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {l('Escolha em qual rotina este exercício será adicionado.', 'Choose which routine to add this exercise to.')}
              </p>
              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                {routines.map((routine) => (
                  <button
                    key={routine.id}
                    type="button"
                    onClick={() => handleAddExerciseToRoutine(routine, exerciseToAdd)}
                    className="flex min-h-[52px] w-full items-center justify-between rounded-2xl border border-white/10 bg-[#090B12] p-4 text-left transition-all hover:border-cyan-400/40"
                  >
                    <div>
                      <p className="font-orbitron text-xs font-black uppercase text-white">{routine.name}</p>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        {routine.exercises?.length || 0} {l('exercícios', 'exercises')}
                      </p>
                    </div>
                    <Plus className="size-4 text-cyan-400" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* 3. Create New Exercise Modal */}
        {isNewExerciseModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewExerciseModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="relative w-full max-w-md overflow-hidden rounded-t-3xl border border-cyan-400/30 bg-[#0D0F18] p-6 shadow-2xl sm:rounded-3xl"
            >
              <button
                type="button"
                onClick={() => setIsNewExerciseModalOpen(false)}
                className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>

              <div className="flex items-center gap-3.5 pr-10">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-300">
                  <Plus className="size-6" />
                </div>
                <div>
                  <span className="font-orbitron text-[10px] font-black uppercase tracking-widest text-cyan-400">
                    {l('Arsenal Customizado', 'Custom Arsenal')}
                  </span>
                  <h2 className="font-orbitron text-lg font-black uppercase text-white">
                    {l('Novo Exercício', 'New Exercise')}
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {l('Nome do Exercício', 'Exercise Name')}
                  </label>
                  <input
                    type="text"
                    placeholder={l('Ex: Supino Inclinado com Halteres', 'Ex: Incline Dumbbell Press')}
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-white/10 bg-[#090B12] px-4 py-3 text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {l('Grupo Muscular', 'Muscle Group')}
                    </label>
                    <select
                      value={newExGroup}
                      onChange={(e) => setNewExGroup(e.target.value)}
                      className="mt-1.5 min-h-[48px] w-full rounded-xl border border-white/10 bg-[#090B12] px-3 py-3 text-xs font-bold text-white focus:border-cyan-400 focus:outline-none"
                    >
                      {['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core', 'Cardio', 'Corpo Inteiro'].map(
                        (g) => (
                          <option key={g} value={g}>
                            {tx(g)}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {l('Categoria', 'Category')}
                    </label>
                    <select
                      value={newExCategory}
                      onChange={(e) => setNewExCategory(e.target.value)}
                      className="mt-1.5 min-h-[48px] w-full rounded-xl border border-white/10 bg-[#090B12] px-3 py-3 text-xs font-bold text-white focus:border-cyan-400 focus:outline-none"
                    >
                      {['Força', 'Cardio', 'Flexibilidade', 'Mobilidade'].map((c) => (
                        <option key={c} value={c}>
                          {tx(c)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <TacticalButton variant="primary" fullWidth displayFont onClick={handleCreateExercise}>
                  {l('Adicionar ao Arsenal', 'Add to Arsenal')}
                </TacticalButton>
              </div>
            </motion.div>
          </div>
        )}

        {/* 4. Create New Routine Modal */}
        {isNewRoutineModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewRoutineModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="relative w-full max-w-md overflow-hidden rounded-t-3xl border border-purple-400/30 bg-[#0D0F18] p-6 shadow-2xl sm:rounded-3xl"
            >
              <button
                type="button"
                onClick={() => setIsNewRoutineModalOpen(false)}
                className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>

              <div className="flex items-center gap-3.5 pr-10">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-purple-400/30 bg-purple-500/15 text-purple-300">
                  <Target className="size-6" />
                </div>
                <div>
                  <span className="font-orbitron text-[10px] font-black uppercase tracking-widest text-purple-400">
                    {l('Planejamento de Treino', 'Workout Planning')}
                  </span>
                  <h2 className="font-orbitron text-lg font-black uppercase text-white">
                    {l('Nova Rotina', 'New Routine')}
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {l('Identificação da Rotina', 'Routine Name')}
                  </label>
                  <input
                    type="text"
                    placeholder={l('Ex: Treino A - Superiores (Força)', 'Ex: Upper Body — Strength')}
                    value={newRoutineName}
                    onChange={(e) => setNewRoutineName(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-white/10 bg-[#090B12] px-4 py-3 text-sm font-bold text-white placeholder:text-slate-600 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {l('Dias da Semana', 'Scheduled Days')}
                  </label>
                  <div className="mt-2 grid grid-cols-7 gap-1.5">
                    {dayLabels.map((day, idx) => {
                      const isSelected = newRoutineDays.includes(idx);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setNewRoutineDays((prev) => prev.filter((d) => d !== idx));
                            } else {
                              setNewRoutineDays((prev) => [...prev, idx].sort());
                            }
                          }}
                          className={cn(
                            'min-h-[42px] rounded-xl border text-[10px] font-black uppercase transition-all',
                            isSelected
                              ? 'border-purple-400 bg-purple-500/25 text-white'
                              : 'border-white/10 bg-[#090B12] text-slate-400',
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <TacticalButton variant="primary" fullWidth displayFont onClick={handleCreateRoutine}>
                  {l('Criar Rotina', 'Create Routine')}
                </TacticalButton>
              </div>
            </motion.div>
          </div>
        )}

        {/* 5. Manage / Edit Routine Modal */}
        {isEditRoutineModalOpen && selectedRoutine && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditRoutineModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-cyan-400/30 bg-[#0D0F18] shadow-2xl sm:rounded-3xl"
            >
              <div className="border-b border-white/10 p-5 sm:p-6">
                <button
                  type="button"
                  onClick={() => setIsEditRoutineModalOpen(false)}
                  className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white"
                  aria-label={l('Fechar configuração da rotina', 'Close routine settings')}
                >
                  <X className="size-5" />
                </button>

                <span className="font-orbitron text-[10px] font-black uppercase tracking-widest text-cyan-400">
                  {l('Configuração de Rotina', 'Routine Configuration')}
                </span>
                <h2 className="mt-0.5 pr-12 font-orbitron text-lg font-black uppercase text-white sm:text-xl">
                  {selectedRoutine.name}
                </h2>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {dayLabels.map((day, idx) => {
                    const isScheduled = selectedRoutine.scheduled_days?.includes(idx);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={async () => {
                          const currentDays = selectedRoutine.scheduled_days || [];
                          const newDays = isScheduled
                            ? currentDays.filter((d) => d !== idx)
                            : [...currentDays, idx].sort();
                          const { error } = await supabase
                            .from('workout_routines')
                            .update({ scheduled_days: newDays })
                            .eq('id', selectedRoutine.id);
                          if (!error) {
                            setSelectedRoutine({ ...selectedRoutine, scheduled_days: newDays });
                            fetchData();
                          }
                        }}
                        className={cn(
                          'min-h-[36px] rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase transition-all',
                          isScheduled
                            ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200'
                            : 'border-white/10 bg-[#090B12] text-slate-500 hover:text-slate-300',
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
                {/* Inject Exercise Search */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                    {l('Adicionar Exercício à Rotina', 'Add Exercise to Routine')}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={l('Buscar exercício no arsenal...', 'Search exercise in arsenal...')}
                      value={routineExSearch}
                      onChange={(e) => setRoutineExSearch(e.target.value)}
                      className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#090B12] py-2.5 pl-10 pr-4 text-xs font-bold text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  {routineExSearch && (
                    <div className="max-h-44 divide-y divide-white/5 overflow-y-auto rounded-xl border border-white/10 bg-[#090B12]">
                      {exercises
                        .filter((e) => e.name.toLowerCase().includes(routineExSearch.toLowerCase()))
                        .map((ex) => (
                          <button
                            key={ex.id}
                            type="button"
                            onClick={async () => {
                              const currentCount = selectedRoutine.exercises?.length || 0;
                              const { error } = await supabase.from('routine_exercises').insert({
                                routine_id: selectedRoutine.id,
                                exercise_id: ex.id,
                                sets: 3,
                                reps: 12,
                                weight_kg: 0,
                                order_index: currentCount,
                              });
                              if (!error) {
                                setRoutineExSearch('');
                                fetchData();
                              }
                            }}
                            className="flex min-h-[44px] w-full items-center justify-between px-4 py-2.5 text-left hover:bg-cyan-500/10"
                          >
                            <span className="text-xs font-bold uppercase text-white">{tx(ex.name)}</span>
                            <span className="text-[10px] font-bold uppercase text-cyan-400">
                              + {l('Injetar', 'Inject')}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Routine Exercises List */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {l('Sequência de Exercícios', 'Exercise Sequence')} ({selectedRoutine.exercises?.length || 0})
                  </label>

                  <div className="space-y-2.5">
                    {selectedRoutine.exercises
                      ?.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                      .map((re, index) => (
                        <div
                          key={re.id}
                          className="rounded-2xl border border-white/10 bg-[#090B12] p-3.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex flex-col gap-0.5">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoveExercise(selectedRoutine.id, re.id, 'up')}
                                  className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-20"
                                >
                                  <ChevronUp className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === (selectedRoutine.exercises?.length || 0) - 1}
                                  onClick={() => handleMoveExercise(selectedRoutine.id, re.id, 'down')}
                                  className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-20"
                                >
                                  <ChevronDown className="size-3.5" />
                                </button>
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-orbitron text-xs font-black uppercase text-white">
                                  {tx(re.exercise?.name)}
                                </p>
                                <p className="text-[10px] font-semibold uppercase text-cyan-400">
                                  {tx(re.exercise?.muscle_group)}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={async () => {
                                await supabase.from('routine_exercises').delete().eq('id', re.id);
                                fetchData();
                              }}
                              className="flex size-9 items-center justify-center rounded-xl border border-white/10 text-slate-400 hover:border-rose-500/40 hover:text-rose-300"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-2">
                            <label className="rounded-xl border border-white/10 bg-black/40 px-2.5 py-1.5">
                              <span className="text-[9px] font-bold uppercase text-slate-400">
                                {l('Séries', 'Sets')}
                              </span>
                              <input
                                type="number"
                                inputMode="numeric"
                                value={re.sets}
                                onChange={(e) =>
                                  handleExerciseFieldChange(re.id, 'sets', parseInt(e.target.value) || 0)
                                }
                                onBlur={(e) =>
                                  handleUpdateRoutineExercise(re.id, { sets: parseInt(e.target.value) || 1 })
                                }
                                className="mt-0.5 w-full bg-transparent font-mono text-xs font-black text-white focus:outline-none"
                              />
                            </label>
                            <label className="rounded-xl border border-white/10 bg-black/40 px-2.5 py-1.5">
                              <span className="text-[9px] font-bold uppercase text-slate-400">Reps</span>
                              <input
                                type="number"
                                inputMode="numeric"
                                value={re.reps}
                                onChange={(e) =>
                                  handleExerciseFieldChange(re.id, 'reps', parseInt(e.target.value) || 0)
                                }
                                onBlur={(e) =>
                                  handleUpdateRoutineExercise(re.id, { reps: parseInt(e.target.value) || 1 })
                                }
                                className="mt-0.5 w-full bg-transparent font-mono text-xs font-black text-white focus:outline-none"
                              />
                            </label>
                            <label className="rounded-xl border border-cyan-400/20 bg-black/40 px-2.5 py-1.5">
                              <span className="text-[9px] font-bold uppercase text-cyan-400">KG</span>
                              <input
                                type="number"
                                inputMode="decimal"
                                step="0.5"
                                value={re.weight_kg}
                                onChange={(e) =>
                                  handleExerciseFieldChange(re.id, 'weight_kg', parseFloat(e.target.value) || 0)
                                }
                                onBlur={(e) =>
                                  handleUpdateRoutineExercise(re.id, {
                                    weight_kg: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="mt-0.5 w-full bg-transparent font-mono text-xs font-black text-cyan-300 focus:outline-none"
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 p-4 sm:p-5">
                <TacticalButton
                  variant="primary"
                  fullWidth
                  displayFont
                  onClick={() => setIsEditRoutineModalOpen(false)}
                >
                  {l('Salvar e Fechar', 'Save & Close')}
                </TacticalButton>
              </div>
            </motion.div>
          </div>
        )}

        {/* 6. ACTIVE WORKOUT SESSION HUD (isRoutineSessionOpen) */}
        {isRoutineSessionOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRoutineSessionOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="relative flex h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-cyan-400/35 bg-[#0B0D16] shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-3xl"
            >
              {/* Top Progress Line */}
              <div className="p-5 pb-4 border-b border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400">
                      {l('SESSÃO DE TREINO ATIVA', 'ACTIVE WORKOUT SESSION')}
                    </span>
                    <h2 className="mt-0.5 truncate font-orbitron text-lg font-black uppercase text-white sm:text-xl">
                      {routines.find((r) => r.id === sessionRoutineId)?.name ||
                        l('Protocolo em Execução', 'Active Protocol')}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsRoutineSessionOpen(false)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white"
                    aria-label={l('Minimizar sessão de treino', 'Minimize workout session')}
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Global Session Progress */}
                <div className="mt-3 space-y-1.5">
                  <NeonProgressBar value={activeSessionProgress} max={100} variant="cyan" size="md" />
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-slate-400">
                      {completedSessionExs.length}/{sessionExercises.length}{' '}
                      {l('exercícios concluídos', 'exercises completed')}
                    </span>
                    <span className="font-mono text-cyan-300">{activeSessionProgress}%</span>
                  </div>
                </div>

                {/* Integrated Rest Timer HUD */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#07080E] p-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'flex size-9 items-center justify-center rounded-xl border',
                        isResting
                          ? 'border-cyan-400/40 bg-cyan-500/20 text-cyan-300'
                          : 'border-white/10 bg-white/5 text-slate-400',
                      )}
                    >
                      <Timer className="size-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {l('Descanso', 'Rest Timer')}
                      </p>
                      <p className="font-mono text-base font-black text-white">
                        {isResting ? formatTimer(restTimer) : l('Pronto', 'Ready')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setRestTimer(60);
                        setIsResting(true);
                      }}
                      className="min-h-[40px] rounded-xl border border-white/10 bg-white/5 px-3 font-mono text-xs font-bold text-slate-200 hover:border-cyan-400/35"
                    >
                      60s
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRestTimer(90);
                        setIsResting(true);
                      }}
                      className="min-h-[40px] rounded-xl border border-white/10 bg-white/5 px-3 font-mono text-xs font-bold text-slate-200 hover:border-cyan-400/35"
                    >
                      90s
                    </button>
                    {isResting && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsResting(false);
                          setRestTimer(0);
                        }}
                        className="min-h-[40px] rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 text-xs font-bold uppercase text-rose-300"
                      >
                        {l('Zerar', 'Reset')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Session Exercises List */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
                {sessionExercises.map((ex, idx) => {
                  const isCompleted = completedSessionExs.includes(ex.id);
                  const previousLog = logs.find((item) => item.exercise_id === ex.exercise_id);

                  return (
                    <HudCard
                      key={ex.id}
                      variant={isCompleted ? 'success' : 'cyan'}
                      className="p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-cyan-400">
                              #{idx + 1}
                            </span>
                            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-300">
                              {tx(ex.exercise?.muscle_group)}
                            </span>
                            {previousLog && (
                              <span className="rounded-md border border-purple-400/25 bg-purple-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-purple-300">
                                {l('Anterior:', 'Prev:')} {previousLog.weight_kg}kg × {previousLog.reps}r
                              </span>
                            )}
                          </div>
                          <h4
                            className={cn(
                              'mt-1 font-orbitron text-sm font-black uppercase text-white sm:text-base',
                              isCompleted && 'text-emerald-200 line-through opacity-80',
                            )}
                          >
                            {tx(ex.exercise?.name)}
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCompleteSessionExercise(ex)}
                          disabled={isCompleted}
                          className={cn(
                            'min-h-[44px] shrink-0 rounded-xl border px-4 font-orbitron text-[10px] font-black uppercase tracking-wider transition-all',
                            isCompleted
                              ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300'
                              : 'border-cyan-400/50 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30',
                          )}
                        >
                          {isCompleted ? l('Concluído ✓', 'Completed ✓') : l('Concluir Série', 'Complete Set')}
                        </button>
                      </div>

                      {!isCompleted && (
                        <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
                          <div className="rounded-xl border border-white/10 bg-[#07080E] p-2">
                            <span className="block text-[9px] font-bold uppercase text-slate-400">
                              {l('Séries', 'Sets')}
                            </span>
                            <div className="mt-1 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleSessionFieldChange(ex.id, 'sets', Math.max(1, ex.sets - 1))}
                                className="flex size-8 items-center justify-center rounded-lg bg-white/5 font-mono text-sm font-bold text-white"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                inputMode="numeric"
                                value={ex.sets}
                                onChange={(e) =>
                                  handleSessionFieldChange(ex.id, 'sets', Math.max(1, parseInt(e.target.value) || 1))
                                }
                                className="w-10 bg-transparent text-center font-mono text-sm font-black text-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSessionFieldChange(ex.id, 'sets', ex.sets + 1)}
                                className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/15 font-mono text-sm font-bold text-cyan-200"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-[#07080E] p-2">
                            <span className="block text-[9px] font-bold uppercase text-slate-400">Reps</span>
                            <div className="mt-1 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleSessionFieldChange(ex.id, 'reps', Math.max(1, ex.reps - 1))}
                                className="flex size-8 items-center justify-center rounded-lg bg-white/5 font-mono text-sm font-bold text-white"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                inputMode="numeric"
                                value={ex.reps}
                                onChange={(e) =>
                                  handleSessionFieldChange(ex.id, 'reps', Math.max(1, parseInt(e.target.value) || 1))
                                }
                                className="w-10 bg-transparent text-center font-mono text-sm font-black text-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSessionFieldChange(ex.id, 'reps', ex.reps + 1)}
                                className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/15 font-mono text-sm font-bold text-cyan-200"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="rounded-xl border border-cyan-400/25 bg-[#07080E] p-2">
                            <span className="block text-[9px] font-bold uppercase text-cyan-400">KG</span>
                            <div className="mt-1 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() =>
                                  handleSessionFieldChange(
                                    ex.id,
                                    'weight_kg',
                                    Math.max(0, Number((ex.weight_kg - 2.5).toFixed(1))),
                                  )
                                }
                                className="flex size-8 items-center justify-center rounded-lg bg-white/5 font-mono text-sm font-bold text-white"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                inputMode="decimal"
                                step="0.5"
                                value={ex.weight_kg}
                                onChange={(e) =>
                                  handleSessionFieldChange(
                                    ex.id,
                                    'weight_kg',
                                    Math.max(0, parseFloat(e.target.value) || 0),
                                  )
                                }
                                className="w-12 bg-transparent text-center font-mono text-sm font-black text-cyan-300 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleSessionFieldChange(
                                    ex.id,
                                    'weight_kg',
                                    Number((ex.weight_kg + 2.5).toFixed(1)),
                                  )
                                }
                                className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/15 font-mono text-sm font-bold text-cyan-200"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </HudCard>
                  );
                })}

                {/* Add Extra Exercise During Active Session */}
                <div className="rounded-2xl border border-dashed border-white/15 bg-[#07080E]/80 p-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    + {l('Adicionar Exercício Extra na Sessão', 'Add Extra Exercise to Session')}
                  </label>
                  <div className="relative mt-2">
                    <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder={l('Buscar exercício extra...', 'Search extra exercise...')}
                      value={routineExSearch}
                      onChange={(e) => setRoutineExSearch(e.target.value)}
                      className="min-h-[42px] w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-10 pr-4 text-xs font-bold text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  {routineExSearch && (
                    <div className="mt-2 max-h-36 divide-y divide-white/5 overflow-y-auto rounded-xl border border-white/10 bg-black/60">
                      {exercises
                        .filter((e) => e.name.toLowerCase().includes(routineExSearch.toLowerCase()))
                        .map((ex) => (
                          <button
                            key={ex.id}
                            type="button"
                            onClick={() => handleAddExerciseToSession(ex)}
                            className="flex min-h-[40px] w-full items-center justify-between px-3.5 py-2 text-left hover:bg-cyan-500/10"
                          >
                            <span className="text-xs font-bold uppercase text-white">{tx(ex.name)}</span>
                            <span className="text-[10px] font-bold uppercase text-cyan-400">
                              + {l('Adicionar', 'Add')}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Active Session Footer CTA */}
              <div className="border-t border-white/10 bg-[#090B12] p-4 sm:p-5">
                <TacticalButton
                  variant="primary"
                  fullWidth
                  displayFont
                  leftIcon={<CheckCircle2 className="size-5" />}
                  onClick={handleFinishRoutine}
                >
                  {l('Finalizar Treino e Resgatar XP', 'Finish Workout & Claim XP')}
                </TacticalButton>
              </div>
            </motion.div>
          </div>
        )}

        {/* 7. Delete Confirmation Modal */}
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm({ isOpen: false, routineId: null, routineName: '' })}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl border border-rose-500/35 bg-[#0D0F18] p-6 text-center shadow-2xl"
            >
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/15 text-rose-400">
                <AlertTriangle className="size-7" />
              </div>
              <h2 className="mt-4 font-orbitron text-lg font-black uppercase text-white">
                {l('Excluir Rotina?', 'Delete Routine?')}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                {l('Você está prestes a remover a rotina', 'You are about to remove the routine')}{' '}
                <strong className="text-white">"{deleteConfirm.routineName}"</strong>.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <TacticalButton
                  variant="secondary"
                  onClick={() => setDeleteConfirm({ isOpen: false, routineId: null, routineName: '' })}
                >
                  {l('Cancelar', 'Cancel')}
                </TacticalButton>
                <TacticalButton
                  variant="danger"
                  onClick={() => deleteConfirm.routineId && handleDeleteRoutine(deleteConfirm.routineId)}
                >
                  {l('Confirmar', 'Confirm')}
                </TacticalButton>
              </div>
            </motion.div>
          </div>
        )}

        {/* 8. Preset Details Modal */}
        {isPresetModalOpen && selectedPreset && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPresetModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-amber-400/35 bg-[#0D0F18] shadow-2xl sm:rounded-3xl"
            >
              <div className="relative overflow-hidden border-b border-white/10 p-6">
                <img
                  src={selectedPreset.image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-center opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0D0F18] via-[#0D0F18]/85 to-transparent" />
                <button
                  type="button"
                  onClick={() => setIsPresetModalOpen(false)}
                  className="absolute right-5 top-5 z-10 flex size-10 items-center justify-center rounded-xl border border-white/15 bg-black/50 text-slate-300 hover:text-white"
                  aria-label={l('Fechar detalhes do protocolo', 'Close protocol details')}
                >
                  <X className="size-5" />
                </button>

                <div className="relative flex items-center gap-4 pr-12">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/35 bg-amber-500/20 text-amber-300">
                    <Dumbbell className="size-6" />
                  </div>
                  <div>
                    <p className="font-orbitron text-[10px] font-black uppercase tracking-widest text-amber-400">
                      {tx(selectedPreset.frequency)} · {tx(selectedPreset.estimatedDuration)}
                    </p>
                    <h2 className="mt-0.5 font-orbitron text-lg font-black uppercase text-white sm:text-xl">
                      {tx(selectedPreset.title)}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
                <p className="text-xs leading-relaxed text-slate-300">{tx(selectedPreset.description)}</p>

                <div className="space-y-4">
                  {selectedPreset.routines.map((routine, rIdx) => (
                    <HudCard key={rIdx} variant="default" className="p-4">
                      <h3 className="font-orbitron text-xs font-black uppercase tracking-wider text-amber-400">
                        {tx(routine.name)}
                      </h3>
                      <div className="mt-3 space-y-2">
                        {routine.exercises.map((ex, exIdx) => (
                          <div
                            key={exIdx}
                            className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-black/30 p-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold uppercase text-white">{tx(ex.name)}</p>
                              <p className="text-[10px] font-semibold uppercase text-slate-400">
                                {tx(ex.muscle_group)} · {tx(ex.category)}
                              </p>
                            </div>
                            <span className="shrink-0 font-mono text-xs font-bold text-amber-300">
                              {ex.sets}×{ex.reps}{' '}
                              {ex.weight_kg > 0 ? `· ${ex.weight_kg}kg` : `· ${l('Corporal', 'Body')}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </HudCard>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-white/10 bg-[#090B12] p-4 sm:p-5">
                <TacticalButton variant="secondary" onClick={() => setIsPresetModalOpen(false)}>
                  {l('Voltar', 'Back')}
                </TacticalButton>
                <TacticalButton
                  variant="secondary"
                  accent="gold"
                  disabled={loading}
                  leftIcon={<Upload className="size-4" />}
                  onClick={() => handleImportProgram(selectedPreset)}
                >
                  {loading ? l('Importando...', 'Importing...') : l('Importar Protocolo', 'Import Protocol')}
                </TacticalButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Dumbbell, 
  History, 
  TrendingUp, 
  ChevronRight,
  Filter,
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
  Flame
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useHunterStore } from '@/stores/useHunterStore';
import { useBossStore } from '@/stores/useBossStore';
import { WorkoutProgress } from '@/components/workouts/WorkoutProgress';
import { cn } from '@/lib/utils';
import { localDateString } from '@/lib/date';
import { WORKOUT_PROGRAM_PRESETS } from '@/data/workoutPresets';
import type { WorkoutProgramPreset, PresetRoutine } from '@/data/workoutPresets';
import { usePreferences } from '@/contexts/preferences';
import { PremiumGate } from '@/components/premium/PremiumGate';

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

const TRAINING_TABS = [
  { id: 'routines' as const, title: 'Hoje', description: 'Missão física atual', icon: Target, tone: 'purple' },
  { id: 'presets' as const, title: 'Protocolos', description: 'Modelos de treino', icon: Layers, tone: 'amber' },
  { id: 'progress' as const, title: 'Evolução', description: 'Dados e progresso', icon: TrendingUp, tone: 'blue' },
  { id: 'library' as const, title: 'Arsenal', description: 'Biblioteca de exercícios', icon: Dumbbell, tone: 'cyan' },
];

export function Workouts() {
  const { language, t } = usePreferences();
  const l = (pt: string, en: string) => language === 'en-US' ? en : pt;
  const dayLabels = language === 'en-US'
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const { user } = useAuth();
  const { addXp, updateStat } = useHunterStore();
  const [activeTab, setActiveTab] = useState<'library' | 'routines' | 'progress' | 'presets'>('routines');
  const [selectedPreset, setSelectedPreset] = useState<WorkoutProgramPreset | null>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isImportingPreset, setIsImportingPreset] = useState(false);
  const [presetFilter, setPresetFilter] = useState<'Todos' | '3x na semana' | '4x na semana' | '5x na semana' | '6x na semana' | 'Treino em Casa'>('Todos');
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
  
  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    routineId: string | null;
    routineName: string;
  }>({
    isOpen: false,
    routineId: null,
    routineName: ''
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
    } catch (err) {
      console.error('Erro ao salvar sessão de treino no localStorage:', err);
    }
  }, [isRoutineSessionOpen, sessionExercises, completedSessionExs, sessionRoutineId]);
  
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
  const [isAddingExercise, setIsAddingExercise] = useState(false);

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
      const updated = routines.find(r => r.id === selectedRoutine.id);
      if (updated) {
        // Only update if there's a difference to avoid overriding local typing edits
        if (JSON.stringify(updated.exercises) !== JSON.stringify(selectedRoutine.exercises)) {
           setSelectedRoutine(updated);
        }
      }
    }
  }, [routines]);

  const handleExerciseFieldChange = (reId: string, field: 'sets' | 'reps' | 'weight_kg', value: number) => {
    setSelectedRoutine(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises?.map(re => 
          re.id === reId ? { ...re, [field]: value } : re
        )
      };
    });
  };

  async function fetchData() {
    // Se não há usuário, reseta o loading imediatamente (evita skeleton eterno)
    if (!user) {
      setLoading(false);
      setRoutines([]);
      setLogs([]);
      return;
    }
    setLoading(true);
    setDataError(null);

    // Safety timeout de 5s para evitar skeleton eterno em caso de lentidão
    const safetyTimer = setTimeout(() => {
      setLoading(false);
      console.warn('[Workouts] Safety timeout disparado.');
    }, 5000);
    
    try {
      const [
        { data: exData, error: exError },
        { data: routineData, error: routineError },
        { data: logData, error: logError }
      ] = await Promise.all([
        supabase
          .from('exercises')
          .select('*')
          .order('name'),
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
          .limit(100)
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
      const { error } = await supabase
        .from('routine_exercises')
        .update(updates)
        .eq('id', reId);

      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error updating routine exercise:', err);
    }
  }

  async function handleMoveExercise(routineId: string, exerciseId: string, direction: 'up' | 'down') {
    const routine = routines.find(r => r.id === routineId);
    if (!routine || !routine.exercises) return;

    const sortedExs = [...routine.exercises].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const index = sortedExs.findIndex(e => e.id === exerciseId);
    
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
        supabase.from('routine_exercises').update({ order_index: i }).eq('id', e.id)
      );
      await Promise.all(updates);
      fetchData();
    } catch (err) {
      console.error('Error reordering exercises:', err);
    }
  }

  const handleSessionFieldChange = (reId: string, field: 'sets' | 'reps' | 'weight_kg', value: number) => {
    setSessionExercises(prev => 
      prev.map(re => re.id === reId ? { ...re, [field]: value } : re)
    );
  };

  async function handleStartRoutine(routine: WorkoutRoutine) {
    if (!routine.exercises || routine.exercises.length === 0) return;
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
      
      await supabase.from('routine_exercises').update({
        weight_kg: ex.weight_kg,
        reps: ex.reps,
        sets: ex.sets
      }).eq('id', ex.id);

      setCompletedSessionExs(prev => [...prev, ex.id]);
      setRestTimer(60);
      setIsResting(true);
    } catch (err) {
      console.error('Error logging session exercise:', err);
    }
  }

  async function handleFinishRoutine() {
    if (!user || !sessionRoutineId) return;
    try {
      const activeRoutine = routines.find(r => r.id === sessionRoutineId);
      const isCardio = activeRoutine 
        ? (activeRoutine.name.toLowerCase().includes('cardio') || 
           activeRoutine.exercises?.some(ex => ex.exercise?.category?.toLowerCase() === 'cardio'))
        : false;

      const xpReward = isCardio ? 25 : 30;
      const statTarget = isCardio ? 'endurance' : 'strength';

      await supabase.from('routine_completions').upsert({
        user_id: user.id,
        routine_id: sessionRoutineId,
        completed_date: localDateString(),
        xp_awarded: xpReward,
      }, { onConflict: 'user_id,routine_id,completed_date' });

      const completionDate = localDateString();
      const xpResult = await addXp(xpReward, user.id, {
        eventId: `workout-routine:${sessionRoutineId}:${completionDate}`,
      });
      if (xpResult.awardedXp > 0) {
        await updateStat(statTarget, 2, user.id);
        await updateStat('vitality', 1, user.id);
        await updateStat('discipline', 1, user.id);
      }
      
      // Causar dano ao chefe ativo na Raid
      if (xpResult.awardedXp > 0) {
        await useBossStore.getState().attackActiveBoss(user.id, xpResult.awardedXp, 'workout');
      }
      
      setIsRoutineSessionOpen(false);
      setSessionRoutineId(null);
      setCompletedSessionExs([]);
      setSessionExercises([]);
      fetchData();
    } catch (err) {
      console.error('Error finishing routine:', err);
    }
  }

  async function handleAddExerciseToSession(exercise: Exercise) {
    if (!sessionRoutineId) return;
    try {
      const newOrderIndex = sessionExercises.length;
      const { data, error } = await supabase.from('routine_exercises').insert({
        routine_id: sessionRoutineId,
        exercise_id: exercise.id,
        sets: 3,
        reps: 12,
        weight_kg: 0,
        order_index: newOrderIndex
      }).select('*, exercise:exercises(*)').single();

      if (error) throw error;
      if (data) {
        setSessionExercises(prev => [...prev, data]);
        setRoutineExSearch('');
      }
    } catch (err) {
      console.error('Error adding exercise to session:', err);
    }
  }

  async function handleAddExerciseToRoutine(routine: WorkoutRoutine, exercise: Exercise) {
    const alreadyExists = routine.exercises?.some(item => item.exercise_id === exercise.id);
    if (alreadyExists) {
      alert('Este exercício já faz parte da rotina selecionada.');
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
      alert('Não foi possível adicionar o exercício à rotina.');
    }
  }

  async function handleDeleteRoutine(routineId: string) {
    try {
      console.log('Iniciando exclusão da rotina:', routineId);
      
      // Exclui os exercícios vinculados primeiro
      const { error: exError } = await supabase
        .from('routine_exercises')
        .delete()
        .eq('routine_id', routineId);
        
      if (exError) throw exError;

      const { error } = await supabase
        .from('workout_routines')
        .delete()
        .eq('id', routineId);

      if (error) throw error;
      
      console.log('Rotina excluída com sucesso');
      
      // Limpa estados se a rotina deletada for a selecionada
      if (selectedRoutine?.id === routineId) {
        setIsEditRoutineModalOpen(false);
        setSelectedRoutine(null);
      }
      
      // Fecha o modal de confirmação
      setDeleteConfirm({ isOpen: false, routineId: null, routineName: '' });
      
      fetchData();
    } catch (err) {
      console.error('Error deleting routine:', err);
      alert('Erro ao excluir rotina. Tente novamente.');
    }
  }

  function confirmDelete(routine: WorkoutRoutine) {
    setDeleteConfirm({
      isOpen: true,
      routineId: routine.id,
      routineName: routine.name
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
        sab: 6
      };

      let currentExercises = [...exercises];

      for (const r of program.routines) {
        const numericDays = r.scheduled_days.map(d => dayMap[d.toLowerCase()]).filter(v => v !== undefined);
        const { data: newRoutine, error: routineErr } = await supabase
          .from('workout_routines')
          .insert({
            user_id: user.id,
            name: r.name,
            scheduled_days: numericDays
          })
          .select()
          .single();

        if (routineErr) throw routineErr;
        if (!newRoutine) throw new Error("Erro ao criar rotina.");

        for (let i = 0; i < r.exercises.length; i++) {
          const ex = r.exercises[i];
          let matchedExercise = currentExercises.find(
            e => e.name.toLowerCase().trim() === ex.name.toLowerCase().trim()
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
                created_by: user.id
              })
              .select()
              .single();

            if (createExErr) throw createExErr;
            if (!createdEx) throw new Error("Erro ao criar exercício.");
            
            exerciseId = createdEx.id;
            currentExercises.push(createdEx);
          }

          const { error: joinErr } = await supabase
            .from('routine_exercises')
            .insert({
              routine_id: newRoutine.id,
              exercise_id: exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              weight_kg: ex.weight_kg,
              order_index: i
            });

          if (joinErr) throw joinErr;
        }
      }

      setExercises(currentExercises);
      alert(`Programa "${program.title}" importado com sucesso!`);
      setActiveTab('routines');
      fetchData();
    } catch (err) {
      console.error('Erro ao importar programa de treino:', err);
      alert('Ocorreu um erro ao importar o programa de treino. Tente novamente.');
    } finally {
      setLoading(false);
      setIsImportingPreset(false);
    }
  }

  async function handleLogWorkout() {
    if (!user || !selectedExercise) return;

    try {
      const { data: workoutLog, error } = await supabase.from('workout_logs').insert({
        user_id: user.id,
        exercise_id: selectedExercise.id,
        sets,
        reps,
        weight_kg: weight,
      }).select('id').single();

      if (error) throw error;
      
      // Add XP Reward for individual logging
      const xpResult = await addXp(10, user.id, {
        eventId: `workout-log:${workoutLog.id}`,
      });
      
      // Causar dano ao chefe ativo na Raid (menor intensidade)
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
        created_by: user.id
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

  const muscleGroups = [...new Set(exercises.map(exercise => exercise.muscle_group))].sort();
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch =
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.muscle_group.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscle = muscleFilter === 'Todos' || exercise.muscle_group === muscleFilter;
    const matchesEquipment = equipmentFilter === 'Todos' || inferEquipment(exercise) === equipmentFilter;
    const matchesDifficulty = difficultyFilter === 'Todos' || inferDifficulty(exercise) === difficultyFilter;
    return matchesSearch && matchesMuscle && matchesEquipment && matchesDifficulty;
  });

  const todayRoutine = routines.find(routine => routine.scheduled_days?.includes(new Date().getDay())) || null;
  const todayRoutineIsCardio = todayRoutine?.exercises?.some(item => item.exercise?.category?.toLowerCase() === 'cardio') || false;
  const todayRoutineDuration = todayRoutine ? Math.max(25, (todayRoutine.exercises?.length || 1) * 8) : 0;
  const activeSessionProgress = sessionExercises.length > 0 ? Math.round((completedSessionExs.length / sessionExercises.length) * 100) : 0;

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
    routines: { label: 'Nova Rotina', icon: Plus, className: 'bg-purple-600 hover:bg-purple-500 hover:shadow-[0_0_18px_rgba(147,51,234,0.3)]' },
    presets: { label: 'Importar Protocolo', icon: Upload, className: 'bg-amber-600 hover:bg-amber-500 hover:shadow-[0_0_18px_rgba(245,158,11,0.3)]' },
    progress: { label: 'Registrar Treino', icon: Zap, className: 'bg-blue-600 hover:bg-blue-500 hover:shadow-[0_0_18px_rgba(59,130,246,0.3)]' },
    library: { label: 'Novo Exercício', icon: Plus, className: 'bg-cyan-600 hover:bg-cyan-500 hover:shadow-[0_0_18px_rgba(6,182,212,0.3)]' },
  }[activeTab];
  const ContextActionIcon = contextualAction.icon;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-1 w-4 bg-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Training Center</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {t('pages.workouts')}
          </h1>
        </div>
        
        <button
          type="button"
          onClick={handleContextAction}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all duration-200 active:scale-[0.98] ${contextualAction.className}`}
        >
          <ContextActionIcon className="size-4" strokeWidth={3} />
          {contextualAction.label}
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#1E1E26] bg-[#0B0B0F] p-2 sm:grid-cols-4">
        {TRAINING_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          const activeTone = {
            purple: 'border-purple-500/45 bg-purple-500/10 text-purple-300 shadow-[0_0_22px_rgba(147,51,234,0.12)]',
            amber: 'border-amber-500/45 bg-amber-500/10 text-amber-300 shadow-[0_0_22px_rgba(245,158,11,0.1)]',
            blue: 'border-blue-500/45 bg-blue-500/10 text-blue-300 shadow-[0_0_22px_rgba(59,130,246,0.1)]',
            cyan: 'border-cyan-500/45 bg-cyan-500/10 text-cyan-300 shadow-[0_0_22px_rgba(6,182,212,0.1)]',
          }[tab.tone];

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`group relative flex min-h-[72px] items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 text-left transition-all duration-200 active:scale-[0.99] ${
                isActive
                  ? activeTone
                  : 'border-transparent bg-white/[0.025] text-gray-500 hover:border-white/10 hover:bg-white/[0.045] hover:text-gray-200'
              }`}
            >
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg border transition-all ${
                isActive ? 'border-current/20 bg-current/10' : 'border-white/5 bg-black/20 group-hover:border-white/10'
              }`}>
                <TabIcon className="size-4" strokeWidth={2.2} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[10px] font-black uppercase tracking-[0.16em] text-current" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {tab.title}
                </span>
                <span className={`mt-1 block truncate text-[9px] font-semibold ${isActive ? 'text-white/60' : 'text-gray-600 group-hover:text-gray-500'}`}>
                  {tab.description}
                </span>
              </span>
              {isActive && (
                <motion.span
                  layoutId="training-active-tab"
                  className="absolute inset-x-3 bottom-0 h-px rounded-full bg-current"
                />
              )}
            </button>
          );
        })}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="space-y-6"
      >
        {dataError && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-xs font-semibold text-rose-200">
            <span className="font-black uppercase tracking-widest text-rose-400">Falha na sincronizacao: </span>
            {dataError}
          </div>
        )}
        {activeTab === 'library' && (
          <>
              <div className="space-y-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Buscar exercício ou grupo muscular..."
                      className="w-full rounded-xl border border-[#1E1E26] bg-[#0F0F13] py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-1 rounded-xl border border-[#1E1E26] bg-[#0F0F13] p-1">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}>
                      <LayoutGrid size={16} />
                    </button>
                    <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}>
                      <TableIcon size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)} className="rounded-xl border border-[#1E1E26] bg-[#0F0F13] px-4 py-3 text-xs font-bold text-gray-300 outline-none focus:border-blue-500/50">
                    <option value="Todos">Todos os grupos</option>
                    {muscleGroups.map(group => <option key={group} value={group}>{group}</option>)}
                  </select>
                  <select value={equipmentFilter} onChange={(e) => setEquipmentFilter(e.target.value)} className="rounded-xl border border-[#1E1E26] bg-[#0F0F13] px-4 py-3 text-xs font-bold text-gray-300 outline-none focus:border-blue-500/50">
                    {['Todos', 'Barra', 'Halteres', 'Máquina', 'Peso corporal', 'Outros'].map(option => <option key={option} value={option}>{option === 'Todos' ? 'Todos os equipamentos' : option}</option>)}
                  </select>
                  <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="rounded-xl border border-[#1E1E26] bg-[#0F0F13] px-4 py-3 text-xs font-bold text-gray-300 outline-none focus:border-blue-500/50">
                    {['Todos', 'Iniciante', 'Intermediário', 'Avançado'].map(option => <option key={option} value={option}>{option === 'Todos' ? 'Todas as dificuldades' : option}</option>)}
                  </select>
                </div>
              </div>

              <div className="min-h-[400px]">
                {loading ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {Array(6).fill(0).map((_, i) => (
                      <div key={i} className="h-44 animate-pulse rounded-2xl bg-white/5 border border-white/5" />
                    ))}
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {filteredExercises.map((ex) => (
                      <div key={ex.id} className="group flex min-h-44 flex-col rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-[#15151B] hover:shadow-[0_0_18px_rgba(59,130,246,0.1)]">
                        <div className="flex items-center justify-between">
                          <div className="flex size-9 items-center justify-center rounded-lg border border-blue-500/15 bg-blue-500/10 text-blue-400 transition-colors group-hover:border-blue-500/30">
                            <Dumbbell className="size-4" />
                          </div>
                          <span className="rounded-md border border-white/5 bg-white/5 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-gray-500">{inferDifficulty(ex)}</span>
                        </div>
                        <div className="mt-3 flex-1">
                          <h3 className="text-xs font-bold uppercase leading-snug text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>{ex.name}</h3>
                          <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-blue-400">
                            {ex.muscle_group} · {ex.category}
                          </p>
                          <p className="mt-2 text-[8px] font-bold uppercase tracking-wider text-gray-600">{inferEquipment(ex)}</p>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#1E1E26] pt-3">
                          <button type="button" onClick={() => { setSelectedExercise(ex); setIsModalOpen(true); }} className="rounded-lg border border-[#252530] bg-white/5 py-2 text-[8px] font-black uppercase tracking-wider text-gray-400 transition-colors hover:border-white/15 hover:text-white">
                            Registrar
                          </button>
                          <button type="button" onClick={() => routines.length === 0 ? setIsNewRoutineModalOpen(true) : setExerciseToAdd(ex)} className="rounded-lg border border-blue-500/25 bg-blue-500/10 py-2 text-[8px] font-black uppercase tracking-wider text-blue-300 transition-all hover:border-blue-400/50 hover:bg-blue-500/20 hover:text-white">
                            Adicionar
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredExercises.length === 0 && (
                      <div className="col-span-full rounded-3xl border border-dashed border-[#252530] bg-[#0F0F13] p-10 text-center">
                        <Search className="mx-auto h-7 w-7 text-gray-700" />
                        <p className="mt-3 text-xs font-black uppercase tracking-wider text-gray-500">Nenhum exercício encontrado</p>
                        <p className="mt-1 text-xs text-gray-600">Ajuste os filtros ou cadastre um novo exercício.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#1E1E26] bg-white/5">
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Exercício</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Grupo Muscular</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Categoria</th>
                          <th className="px-6 py-4 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E1E26]">
                        {filteredExercises.map((ex) => (
                          <tr 
                            key={ex.id} 
                            className="group hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedExercise(ex);
                              setIsModalOpen(true);
                            }}
                          >
                            <td className="px-6 py-4">
                              <span className="font-bold text-white uppercase text-xs" style={{ fontFamily: 'Orbitron, sans-serif' }}>{ex.name}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{ex.muscle_group}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-blue-400 font-black uppercase tracking-widest italic">{ex.category}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <ChevronRight size={16} className="ml-auto text-gray-700 group-hover:text-blue-500" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-6">
              {/* Filtros por frequência */}
              <div className="flex flex-wrap gap-2">
                {(['Todos', '3x na semana', '4x na semana', '5x na semana', '6x na semana', 'Treino em Casa'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setPresetFilter(filter)}
                    className={`rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
                      presetFilter === filter
                        ? 'border-amber-500 bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'border-[#1E1E26] bg-[#0F0F13] text-gray-500 hover:border-amber-500/50 hover:text-amber-400'
                    }`}
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    {filter === 'Treino em Casa' ? 'Em Casa' : filter === 'Todos' ? 'Todos os Modelos' : filter}
                  </button>
                ))}
              </div>

              {/* Grid de Programas de Treino */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {WORKOUT_PROGRAM_PRESETS
                  .filter(p => presetFilter === 'Todos' || p.frequency === presetFilter)
                  .map((program) => {
                    const meta = PROGRAM_META[program.id] || {
                      objective: 'Evolução física estruturada',
                      level: 'Intermediário',
                      split: program.routines.map(routine => routine.name).join(' / '),
                      attributes: 'FOR · VIT · RES',
                    };
                    return (
                    <div
                      key={program.id}
                      className="group relative overflow-hidden rounded-3xl border border-[#1E1E26] bg-[#0F0F13] transition-all duration-200 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-[0_0_24px_rgba(245,158,11,0.12)] flex flex-col"
                    >
                      <div className="relative h-36 overflow-hidden border-b border-[#1E1E26] bg-[#09090D]">
                        <img
                          src={program.image}
                          alt={`Arte do protocolo ${program.title}`}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F13] via-black/10 to-black/5" />
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent opacity-70" />
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <div className="mb-4 flex items-center justify-between gap-2">
                          <span className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-amber-400 font-orbitron">
                            {program.frequency}
                          </span>
                          <span className="rounded-md border border-white/5 bg-white/5 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-gray-500">
                            {meta.level}
                          </span>
                        </div>

                        <h3 className="text-lg font-black uppercase italic text-white tracking-tight leading-snug" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                          {program.title}
                        </h3>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-amber-400">{meta.objective}</p>
                        <p className="mt-3 text-xs text-gray-500 leading-relaxed line-clamp-2">{program.description}</p>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-white/5 bg-black/25 p-3">
                            <CalendarDays className="h-3.5 w-3.5 text-blue-400" />
                            <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-gray-600">Duração</p>
                            <p className="mt-1 text-[10px] font-bold text-gray-300">{program.estimatedDuration.replace(' por sessão', '')}</p>
                          </div>
                          <div className="rounded-xl border border-white/5 bg-black/25 p-3">
                            <Gauge className="h-3.5 w-3.5 text-purple-400" />
                            <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-gray-600">Atributos</p>
                            <p className="mt-1 text-[10px] font-bold text-purple-300">{meta.attributes}</p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-[#1E1E26] bg-black/20 p-3">
                          <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">Divisão semanal</p>
                          <p className="mt-1 text-[10px] font-semibold leading-relaxed text-gray-400">{meta.split}</p>
                        </div>

                      <div className="mt-auto flex gap-2 pt-5">
                        <button
                          onClick={() => {
                            setSelectedPreset(program);
                            setIsPresetModalOpen(true);
                          }}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#1E1E26] bg-white/5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-white/10 hover:text-white"
                          style={{ fontFamily: 'Orbitron, sans-serif' }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Visualizar
                        </button>
                        <button
                          onClick={() => handleImportProgram(program)}
                          disabled={loading}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50"
                          style={{ fontFamily: 'Orbitron, sans-serif' }}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {loading && isImportingPreset ? 'Importando...' : 'Importar'}
                        </button>
                      </div>
                    </div>
                    </div>
                  )})}
              </div>
            </div>
          )}

          {activeTab === 'routines' && (
            /* Rotinas UI */
            <div className="space-y-5">
              {todayRoutine && (
                <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-[#0F0F13] p-5 shadow-[0_0_28px_rgba(147,51,234,0.1)] sm:p-6">
                  <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-purple-500/10 to-transparent" />
                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-purple-500/25 bg-purple-500/10 text-purple-300">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.24em] text-purple-400 font-orbitron">Missão Física do Dia</p>
                        <h2 className="mt-1 text-lg font-black uppercase tracking-tight text-white font-orbitron">{todayRoutine.name}</h2>
                        <div className="mt-2 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-wider">
                          <span className="text-gray-400">{todayRoutineDuration} min</span>
                          <span className="text-gray-700">•</span>
                          <span className="text-amber-400">+{todayRoutineIsCardio ? 40 : 50} XP</span>
                          <span className="text-gray-700">•</span>
                          <span className="text-blue-300">{todayRoutineIsCardio ? 'RES +2' : 'FOR +2'} · VIT +1 · DIS +1 · Corpo</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartRoutine(todayRoutine)}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/15 px-5 text-[10px] font-black uppercase tracking-widest text-purple-200 transition-all hover:bg-purple-600 hover:text-white hover:shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                    >
                      <Zap className="h-4 w-4" />
                      Iniciar missão
                    </button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {routines.map((routine) => {
                  const splitMatch = routine.name.match(/^[A-Z](?=\s*-|\s|$)/i);
                  const splitLetter = splitMatch ? splitMatch[0].toUpperCase() : null;
                  const sortedRoutineExercises = [...(routine.exercises || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
                  const routineExerciseIds = new Set(sortedRoutineExercises.map(item => item.exercise_id));
                  const lastRoutineLog = logs.find(log => routineExerciseIds.has(log.exercise_id));
                  const isActiveSession = isRoutineSessionOpen && sessionRoutineId === routine.id;
                  const routineProgress = isActiveSession ? activeSessionProgress : 0;
                  const nextExercise = isActiveSession
                    ? sessionExercises.find(item => !completedSessionExs.includes(item.id))
                    : sortedRoutineExercises[0];
                  const scheduledDays = routine.scheduled_days?.length
                    ? routine.scheduled_days.map(day => dayLabels[day]).filter(Boolean).join(' · ')
                    : 'Sem agenda';
                  const protocolStatus = isActiveSession
                    ? 'Em progresso'
                    : todayRoutine?.id === routine.id
                      ? 'Missão de hoje'
                      : 'Protocolo ativo';

                  return (
                    <div
                      key={routine.id}
                      className="group relative overflow-hidden rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6 transition-all duration-150 ease-out hover:border-purple-500/50 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(147,51,234,0.15)] cursor-pointer"
                      onClick={() => {
                        setSelectedRoutine(routine);
                        setIsEditRoutineModalOpen(true);
                      }}
                    >
                      <div className="absolute -right-4 -top-4 size-24 bg-purple-600/5 blur-3xl group-hover:bg-purple-600/10" />
                      
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {splitLetter ? (
                            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-600 text-white font-black text-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              {splitLetter}
                            </div>
                          ) : (
                            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.1)]">
                              <Target size={20} strokeWidth={2.5} />
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-black uppercase italic text-white tracking-tight leading-none" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              {routine.name}
                            </h3>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mt-1">Protocolo de Treinamento</p>
                          </div>
                        </div>
                        {/* FIX: Botões sempre visíveis, com stopPropagation para não conflitar com o click do card */}
                        <div className="flex gap-1 relative z-20">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setSelectedRoutine(routine);
                              setIsEditRoutineModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-600/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-purple-400 transition-all hover:bg-purple-600 hover:text-white"
                          >
                            <TableIcon size={12} />
                            Gerenciar
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              confirmDelete(routine);
                            }}
                            className="rounded-lg border border-red-500/20 bg-red-500/5 p-1.5 text-gray-500 transition-all hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-500"
                            title="Excluir Rotina"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-5 grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">Agenda</p>
                          <div className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-300">
                            <CalendarDays className="size-3.5 text-purple-400" />
                            <span className="truncate">{scheduledDays}</span>
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">Status</p>
                          <div className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-purple-300">
                            <span className={`size-1.5 rounded-full ${isActiveSession ? 'animate-pulse bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]' : 'bg-purple-500/60'}`} />
                            <span className="truncate">{protocolStatus}</span>
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">Último registro</p>
                          <p className="mt-2 truncate text-[10px] font-bold text-gray-300">
                            {lastRoutineLog
                              ? new Date(lastRoutineLog.logged_at).toLocaleDateString(language, { day: '2-digit', month: 'short' })
                              : 'Nenhum registro'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">Próximo exercício</p>
                          <p className="mt-2 truncate text-[10px] font-bold uppercase text-gray-300">
                            {nextExercise?.exercise?.name || 'Definir exercício'}
                          </p>
                        </div>
                      </div>

                      <div className="mb-5">
                        <div className="mb-2 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.18em]">
                          <span className="text-gray-600">Progresso do protocolo</span>
                          <span className={isActiveSession ? 'text-purple-300' : 'text-gray-600'}>{routineProgress}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-black/50">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${routineProgress}%` }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-purple-700 via-purple-500 to-blue-400 shadow-[0_0_10px_rgba(147,51,234,0.45)]"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleStartRoutine(routine);
                        }}
                        className="w-full rounded-xl bg-purple-600/10 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 transition-all hover:bg-purple-600 hover:text-white border border-purple-600/20"
                        style={{ fontFamily: 'Orbitron, sans-serif' }}
                      >
                        {isActiveSession ? 'Continuar Protocolo' : 'Iniciar Protocolo'}
                      </button>
                    </div>
                  );
                })}

                {routines.length === 0 && (
                  <div className="relative col-span-full overflow-hidden rounded-3xl border border-dashed border-purple-500/20 bg-[#0F0F13] px-6 py-14 text-center">
                    <div className="absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 bg-purple-500/8 blur-3xl" />
                    <div className="relative mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-400 shadow-[0_0_24px_rgba(147,51,234,0.12)]">
                      <Dumbbell size={30} strokeWidth={1.5} />
                    </div>
                    <h3 className="relative text-base font-black uppercase tracking-tight text-white font-orbitron">Seu arsenal físico ainda está vazio</h3>
                    <p className="relative mx-auto mt-2 max-w-md text-xs leading-relaxed text-gray-500">
                      Crie um protocolo personalizado ou importe um modelo completo para iniciar sua evolução em FOR, VIT, RES e DIS.
                    </p>
                    <div className="relative mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                      <button onClick={() => setIsNewRoutineModalOpen(true)} className="rounded-xl bg-purple-600 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-purple-500 hover:shadow-[0_0_18px_rgba(147,51,234,0.25)]">
                        Criar rotina
                      </button>
                      <button onClick={() => setActiveTab('presets')} className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-amber-300 transition-all hover:border-amber-400/50 hover:bg-amber-500/15 hover:text-white">
                        Importar modelo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <PremiumGate
              title={l('Histórico e Evolução Físicos Restritos', 'Physical History & Progression Locked')}
              description={l(
                'O painel de evolução corporal, análise de carga e histórico detalhado de treinos realizados requer ativação de assinatura premium.',
                'Body progression, load analysis, and detailed workout history require an active premium subscription.'
              )}
            >
              <div className="space-y-6">
                <WorkoutProgress />
              </div>
            </PremiumGate>
          )}
      </motion.div>

      <AnimatePresence>
        {exerciseToAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExerciseToAdd(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 18 }}
              className="relative w-full max-w-md rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6 shadow-2xl"
            >
              <button onClick={() => setExerciseToAdd(null)} className="absolute right-5 top-5 text-gray-500 transition-colors hover:text-white">
                <X className="h-5 w-5" />
              </button>
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-blue-400 font-orbitron">Adicionar ao treino</p>
              <h2 className="mt-2 pr-8 text-lg font-black uppercase text-white font-orbitron">{exerciseToAdd.name}</h2>
              <p className="mt-1 text-xs text-gray-500">Selecione a rotina que receberá este exercício.</p>
              <div className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-1">
                {routines.map(routine => (
                  <button
                    key={routine.id}
                    type="button"
                    onClick={() => handleAddExerciseToRoutine(routine, exerciseToAdd)}
                    className="flex w-full items-center justify-between rounded-xl border border-[#1E1E26] bg-black/30 p-4 text-left transition-all hover:border-blue-500/40 hover:bg-blue-500/5"
                  >
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-white">{routine.name}</p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-gray-600">{routine.exercises?.length || 0} exercícios</p>
                    </div>
                    <Plus className="h-4 w-4 text-blue-400" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Novo Exercício - ESTAVA FALTANDO */}
      <AnimatePresence>
        {isNewExerciseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewExerciseModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-8 shadow-2xl"
            >
              <button 
                onClick={() => setIsNewExerciseModalOpen(false)}
                className="absolute right-6 top-6 text-gray-500 hover:text-white"
              >
                <X className="size-6" />
              </button>

              <div className="mb-8 flex items-center gap-5">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                  <Dumbbell className="size-8" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase italic text-white tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Novo <span className="text-blue-500">Exercício</span>
                  </h2>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-600">Adicione à sua biblioteca de treino</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Nome do Exercício *</label>
                  <input 
                    type="text" 
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    placeholder="Ex: Supino Reto, Agachamento..."
                    className="w-full rounded-xl border border-[#1E1E26] bg-black p-4 text-white focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Grupo Muscular</label>
                  <select 
                    value={newExGroup}
                    onChange={(e) => setNewExGroup(e.target.value)}
                    className="w-full rounded-xl border border-[#1E1E26] bg-black p-4 text-white focus:border-blue-500 focus:outline-none"
                  >
                    {['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Glúteos', 'Core', 'Cardio', 'Full Body'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Categoria</label>
                  <select 
                    value={newExCategory}
                    onChange={(e) => setNewExCategory(e.target.value)}
                    className="w-full rounded-xl border border-[#1E1E26] bg-black p-4 text-white focus:border-blue-500 focus:outline-none"
                  >
                    {['Força', 'Cardio', 'Flexibilidade', 'Mobilidade', 'Potência'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={handleCreateExercise}
                  disabled={!newExName.trim()}
                  className="w-full rounded-2xl bg-blue-600 py-5 font-black uppercase italic tracking-[0.2em] text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Cadastrar Exercício
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Nova Rotina */}
      <AnimatePresence>
        {isNewRoutineModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewRoutineModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-8 shadow-2xl"
            >
              <button 
                onClick={() => setIsNewRoutineModalOpen(false)}
                className="absolute right-6 top-6 text-gray-500 hover:text-white"
              >
                <X className="size-6" />
              </button>

              <div className="mb-8 flex items-center gap-5">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.15)]">
                  <Target className="size-8" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase italic text-white tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Nova <span className="text-purple-500">Rotina</span>
                  </h2>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-600">Defina um novo protocolo de treino</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Nome da Rotina</label>
                  <input 
                    type="text" 
                    value={newRoutineName}
                    onChange={(e) => setNewRoutineName(e.target.value)}
                    placeholder="Ex: Treino A - Empurrar"
                    className="w-full rounded-xl border border-[#1E1E26] bg-black p-4 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {['A', 'B', 'C', 'D'].map((letter) => (
                    <button
                      key={letter}
                      onClick={() => setNewRoutineName(`Treino ${letter}`)}
                      className="rounded-lg border border-[#1E1E26] bg-white/5 py-2 text-[10px] font-black text-gray-400 transition-all hover:border-purple-500 hover:text-purple-400"
                    >
                      Split {letter}
                    </button>
                  ))}
                </div>

                {/* Seletor de Dias da Semana */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Dias de Treino</label>
                  <div className="flex gap-2">
                    {dayLabels.map((day, idx) => {
                      const isSelected = newRoutineDays.includes(idx);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setNewRoutineDays(prev =>
                              isSelected ? prev.filter(d => d !== idx) : [...prev, idx].sort()
                            );
                          }}
                          className={`flex-1 rounded-xl border py-2 text-[9px] font-black uppercase transition-all ${
                            isSelected
                              ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                              : 'border-[#1E1E26] bg-white/5 text-gray-500 hover:border-purple-500/50 hover:text-purple-400'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button 
                  onClick={handleCreateRoutine}
                  className="w-full rounded-2xl bg-purple-600 py-5 font-black uppercase italic tracking-[0.2em] text-white transition-all hover:bg-purple-500 hover:shadow-[0_0_30px_rgba(147,51,234,0.4)]"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Inicializar Rotina
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Gerenciar Rotina */}
      <AnimatePresence>
        {isEditRoutineModalOpen && selectedRoutine && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditRoutineModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col rounded-3xl border border-[#1E1E26] bg-[#0F0F13] shadow-2xl"
            >
              <div className="p-8 border-b border-[#1E1E26]">
                <button 
                  onClick={() => setIsEditRoutineModalOpen(false)}
                  className="absolute right-6 top-6 text-gray-500 hover:text-white"
                >
                  <X className="size-6" />
                </button>

                <div className="flex items-center gap-5">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-500">
                    <Target className="size-7" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase italic text-white tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      Gerenciar <span className="text-purple-500">{selectedRoutine.name}</span>
                    </h2>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-600">Configure os exercícios deste protocolo</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {/* Dias da Semana */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Dias da Semana</h3>
                  <div className="flex flex-wrap gap-2">
                    {dayLabels.map((day, idx) => {
                      const isSelected = selectedRoutine.scheduled_days?.includes(idx) ?? false;
                      return (
                        <button
                          key={day}
                          onClick={async () => {
                            const currentDays = selectedRoutine.scheduled_days || [];
                            const newDays = isSelected 
                              ? currentDays.filter(d => d !== idx)
                              : [...currentDays, idx].sort();
                            
                            try {
                              const { error } = await supabase
                                .from('workout_routines')
                                .update({ scheduled_days: newDays })
                                .eq('id', selectedRoutine.id);
                              
                              if (!error) {
                                setSelectedRoutine({ ...selectedRoutine, scheduled_days: newDays });
                                fetchData();
                              }
                            } catch (err) {
                              console.error('Error updating scheduled days:', err);
                            }
                          }}
                          className={`flex-1 min-w-[40px] rounded-xl border py-2 text-[10px] font-black uppercase transition-all ${
                            isSelected 
                              ? 'border-purple-500 bg-purple-500/20 text-purple-400' 
                              : 'border-[#1E1E26] bg-white/5 text-gray-500 hover:border-purple-500/50 hover:text-purple-400'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lista de Exercícios na Rotina */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Exercícios Vinculados</h3>
                  {selectedRoutine.exercises && selectedRoutine.exercises.length > 0 ? (
                    [...selectedRoutine.exercises]
                      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                      .map((re, idx, arr) => (
                      <div key={re.id} className="flex flex-col gap-4 rounded-2xl border border-[#1E1E26] bg-white/5 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                              <Dumbbell size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white uppercase">{re.exercise?.name}</p>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">
                                {re.exercise?.muscle_group}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <button 
                                disabled={idx === 0}
                                onClick={() => handleMoveExercise(selectedRoutine.id, re.id, 'up')}
                                className="p-2 text-gray-600 hover:text-purple-500 disabled:opacity-30 disabled:hover:text-gray-600 transition-colors"
                              >
                                <ChevronUp size={16} />
                              </button>
                              <button 
                                disabled={idx === arr.length - 1}
                                onClick={() => handleMoveExercise(selectedRoutine.id, re.id, 'down')}
                                className="p-2 text-gray-600 hover:text-purple-500 disabled:opacity-30 disabled:hover:text-gray-600 transition-colors"
                              >
                                <ChevronDown size={16} />
                              </button>
                            </div>
                            <button 
                              onClick={async () => {
                                const { error } = await supabase.from('routine_exercises').delete().eq('id', re.id);
                                if (!error) fetchData();
                              }}
                              className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                          {/* Séries */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 px-1">
                              <Layers size={10} className="text-purple-500" />
                              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Séries</label>
                            </div>
                            <div className="flex items-center gap-1 bg-black/40 rounded-xl border border-[#1E1E26] p-1 group/input focus-within:border-purple-500/50 transition-all">
                              <input 
                                type="number"
                                inputMode="numeric"
                                value={re.sets}
                                onChange={(e) => handleExerciseFieldChange(re.id, 'sets', parseInt(e.target.value) || 0)}
                                onBlur={(e) => handleUpdateRoutineExercise(re.id, { sets: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="w-full text-center bg-transparent text-sm font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>
                          </div>

                          {/* Repetições */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 px-1">
                              <Repeat size={10} className="text-purple-500" />
                              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Reps</label>
                            </div>
                            <div className="flex items-center gap-1 bg-black/40 rounded-xl border border-[#1E1E26] p-1 group/input focus-within:border-purple-500/50 transition-all">
                              <input 
                                type="number"
                                inputMode="numeric"
                                value={re.reps}
                                onChange={(e) => handleExerciseFieldChange(re.id, 'reps', parseInt(e.target.value) || 0)}
                                onBlur={(e) => handleUpdateRoutineExercise(re.id, { reps: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="w-full text-center bg-transparent text-sm font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>
                          </div>

                          {/* Carga */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 px-1">
                              <Weight size={10} className="text-purple-500" />
                              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Carga (kg)</label>
                            </div>
                            <div className="flex items-center gap-1 bg-black/40 rounded-xl border border-[#1E1E26] p-1 group/input focus-within:border-purple-500/50 transition-all">
                              <input 
                                type="number"
                                inputMode="decimal"
                                value={re.weight_kg}
                                onChange={(e) => handleExerciseFieldChange(re.id, 'weight_kg', parseFloat(e.target.value) || 0)}
                                onBlur={(e) => handleUpdateRoutineExercise(re.id, { weight_kg: Math.max(0, parseFloat(e.target.value) || 0) })}
                                className="w-full text-center bg-transparent text-sm font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#1E1E26] p-10 text-center">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Nenhum exercício neste protocolo.</p>
                    </div>
                  )}
                </div>

                {/* Adicionar Novo Exercício à Rotina */}
                <div className="pt-6 border-t border-[#1E1E26] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500">Injetar Exercício</h3>
                    <div className="relative w-48">
                      <Search className="absolute left-3 top-1/2 size-3 -translate-y-1/2 text-gray-600" />
                      <input 
                        type="text" 
                        placeholder="Buscar..."
                        value={routineExSearch}
                        onChange={(e) => setRoutineExSearch(e.target.value)}
                        className="w-full rounded-lg border border-[#1E1E26] bg-black py-2 pl-8 pr-3 text-[10px] text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {exercises
                      .filter(ex => ex.name.toLowerCase().includes(routineExSearch.toLowerCase()))
                      .slice(0, 10)
                      .map(ex => {
                        const isAdded = selectedRoutine.exercises?.some(re => re.exercise_id === ex.id);
                        return (
                          <button
                            key={ex.id}
                            disabled={isAdded}
                            onClick={async () => {
                              const { error } = await supabase.from('routine_exercises').insert({
                                routine_id: selectedRoutine.id,
                                exercise_id: ex.id,
                                sets: 3,
                                reps: 12,
                                weight_kg: 0,
                                order_index: (selectedRoutine.exercises?.length || 0)
                              });
                              if (!error) fetchData();
                            }}
                            className={`flex items-center justify-between rounded-xl border border-[#1E1E26] p-3 transition-all ${isAdded ? 'bg-purple-600/10 border-purple-500/30 opacity-50 cursor-not-allowed' : 'bg-black hover:border-purple-500/50'}`}
                          >
                            <div className="text-left">
                              <p className="text-[10px] font-bold text-white uppercase">{ex.name}</p>
                              <p className="text-[9px] text-gray-600 uppercase tracking-widest">{ex.muscle_group}</p>
                            </div>
                            {isAdded ? (
                              <CheckCircle2 size={14} className="text-purple-500" />
                            ) : (
                              <Plus size={14} className="text-gray-600" />
                            )}
                          </button>
                        );
                      })
                    }
                    {exercises.filter(ex => ex.name.toLowerCase().includes(routineExSearch.toLowerCase())).length === 0 && (
                      <p className="text-[10px] text-gray-700 uppercase font-black text-center py-4">Nenhum exercício encontrado.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-[#1E1E26] bg-[#0F0F13] flex gap-3">
                <button 
                  onClick={() => confirmDelete(selectedRoutine)}
                  className="flex-1 rounded-2xl border border-red-500/20 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 transition-all hover:bg-red-500/10 flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  Excluir Protocolo
                </button>
                <button 
                  onClick={() => setIsEditRoutineModalOpen(false)}
                  className="flex-[2] rounded-2xl border border-purple-500/20 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-purple-500 transition-all hover:bg-purple-600/10"
                >
                  Fechar Gerenciador
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal de Sessão de Treino (Iniciar Protocolo) */}
      <AnimatePresence>
        {isRoutineSessionOpen && sessionExercises.length > 0 && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[2rem] border border-[#1E1E26] bg-[#0F0F13] shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              {/* Progress Bar (Global) */}
              <div className="absolute top-0 left-0 h-1 bg-purple-600 transition-all duration-500" 
                style={{ width: `${(completedSessionExs.length / sessionExercises.length) * 100}%` }} 
              />

              <div className="p-6 border-b border-[#1E1E26] shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.4)] text-white">
                      <Zap size={24} fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500">
                        {completedSessionExs.length} de {sessionExercises.length} Concluídos
                      </p>
                      <h2 className="text-xl font-black uppercase italic text-white tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        Treino em Andamento
                      </h2>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm("Deseja mesmo abandonar o treino atual? Seu progresso nesta sessão será perdido.")) {
                        setIsRoutineSessionOpen(false);
                        setSessionExercises([]);
                        setCompletedSessionExs([]);
                        setSessionRoutineId(null);
                      }
                    }}
                    className="size-10 flex items-center justify-center rounded-full bg-white/5 text-gray-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Rest Timer Global */}
                <div className={cn(
                  "rounded-xl border p-3 flex items-center justify-between transition-all duration-300",
                  isResting ? "border-green-500/30 bg-green-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "border-[#1E1E26] bg-black"
                )}>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex size-8 items-center justify-center rounded-lg transition-all duration-300",
                      isResting ? "bg-green-500/20 text-green-500 animate-pulse" : "bg-[#1E1E26] text-gray-400"
                    )}>
                      <Timer size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Descanso</p>
                      <p className="text-sm font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {Math.floor(restTimer / 60).toString().padStart(2, '0')}:{(restTimer % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setRestTimer(60); setIsResting(true); }}
                      className="rounded-lg bg-white/5 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                    >60s</button>
                    <button 
                      onClick={() => { setRestTimer(90); setIsResting(true); }}
                      className="rounded-lg bg-white/5 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                    >90s</button>
                    {isResting ? (
                      <button 
                        onClick={() => setIsResting(false)}
                        className="rounded-lg bg-red-500/20 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/30 transition-all"
                      >Parar</button>
                    ) : (
                      <button 
                        onClick={() => { if(restTimer > 0) setIsResting(true); else { setRestTimer(60); setIsResting(true); } }}
                        className="rounded-lg bg-green-500/20 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-green-500 hover:bg-green-500/30 transition-all"
                      >Iniciar</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable list of exercises */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {sessionExercises.map((re) => {
                  const isCompleted = completedSessionExs.includes(re.id);
                  const previousLog = logs.find(log => log.exercise_id === re.exercise_id);

                  return (
                    <div key={re.id} className={`rounded-2xl border ${isCompleted ? 'border-green-500/30 bg-green-500/5 opacity-60' : 'border-[#1E1E26] bg-white/5'} p-4 transition-all`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex size-10 items-center justify-center rounded-xl ${isCompleted ? 'bg-green-500/20 text-green-500' : 'bg-purple-500/10 text-purple-400'}`}>
                            {isCompleted ? <CheckCircle2 size={18} /> : <Dumbbell size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white uppercase">{re.exercise?.name}</p>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">
                              {re.exercise?.muscle_group}
                            </p>
                          </div>
                        </div>
                        {previousLog && (
                          <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-0.5">Último Recorde</p>
                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tight">
                              {previousLog.sets}S x {previousLog.reps}R • {previousLog.weight_kg}kg
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {/* Séries */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-1">
                            <Layers size={10} className="text-purple-500" />
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Séries</label>
                          </div>
                          <div className="flex items-center bg-black/40 rounded-xl border border-[#1E1E26] overflow-hidden">
                            <button onClick={() => handleSessionFieldChange(re.id, 'sets', Math.max(1, re.sets - 1))} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-base font-bold shrink-0 hover:bg-white/5">-</button>
                            <input 
                              type="number" value={re.sets} onChange={(e) => handleSessionFieldChange(re.id, 'sets', parseInt(e.target.value) || 0)}
                              className="w-full text-center bg-transparent text-sm font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button onClick={() => handleSessionFieldChange(re.id, 'sets', re.sets + 1)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-base font-bold shrink-0 hover:bg-white/5">+</button>
                          </div>
                        </div>
                        {/* Reps */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-1">
                            <Repeat size={10} className="text-purple-500" />
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Reps</label>
                          </div>
                          <div className="flex items-center bg-black/40 rounded-xl border border-[#1E1E26] overflow-hidden">
                            <button onClick={() => handleSessionFieldChange(re.id, 'reps', Math.max(1, re.reps - 1))} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-base font-bold shrink-0 hover:bg-white/5">-</button>
                            <input 
                              type="number" value={re.reps} onChange={(e) => handleSessionFieldChange(re.id, 'reps', parseInt(e.target.value) || 0)}
                              className="w-full text-center bg-transparent text-sm font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button onClick={() => handleSessionFieldChange(re.id, 'reps', re.reps + 1)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-base font-bold shrink-0 hover:bg-white/5">+</button>
                          </div>
                        </div>
                        {/* Carga */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-1">
                            <Weight size={10} className="text-purple-500" />
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Carga (kg)</label>
                          </div>
                          <div className="flex items-center bg-black/40 rounded-xl border border-[#1E1E26] overflow-hidden">
                            <button onClick={() => handleSessionFieldChange(re.id, 'weight_kg', Math.max(0, re.weight_kg - 1))} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-base font-bold shrink-0 hover:bg-white/5">-</button>
                            <input 
                              type="number" value={re.weight_kg} onChange={(e) => handleSessionFieldChange(re.id, 'weight_kg', parseFloat(e.target.value) || 0)}
                              className="w-full text-center bg-transparent text-sm font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button onClick={() => handleSessionFieldChange(re.id, 'weight_kg', re.weight_kg + 1)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-base font-bold shrink-0 hover:bg-white/5">+</button>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleCompleteSessionExercise(re)}
                        disabled={isCompleted}
                        className={`w-full rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                          isCompleted 
                            ? 'bg-green-500/20 text-green-500' 
                            : 'bg-white/5 text-white hover:bg-purple-600 hover:text-white border border-[#1E1E26] hover:border-purple-500'
                        }`}
                      >
                        <CheckCircle2 size={16} />
                        {isCompleted ? 'Concluído' : 'Concluir'}
                      </button>
                    </div>
                  );
                })}

                {/* Adicionar Exercício Extra */}
                <div className="pt-4 border-t border-[#1E1E26] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500">Exercício Extra</h3>
                    <div className="relative w-48">
                      <Search className="absolute left-3 top-1/2 size-3 -translate-y-1/2 text-gray-600" />
                      <input 
                        type="text" 
                        placeholder="Buscar..."
                        value={routineExSearch}
                        onChange={(e) => setRoutineExSearch(e.target.value)}
                        className="w-full rounded-lg border border-[#1E1E26] bg-black py-2 pl-8 pr-3 text-[10px] text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {routineExSearch && (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {exercises
                        .filter(ex => ex.name.toLowerCase().includes(routineExSearch.toLowerCase()))
                        .slice(0, 10)
                        .map(ex => {
                          const isAdded = sessionExercises.some(re => re.exercise_id === ex.id);
                          return (
                            <button
                              key={ex.id}
                              disabled={isAdded}
                              onClick={() => handleAddExerciseToSession(ex)}
                              className={`flex items-center justify-between rounded-xl border border-[#1E1E26] p-3 transition-all ${isAdded ? 'bg-purple-600/10 border-purple-500/30 opacity-50 cursor-not-allowed' : 'bg-black hover:border-purple-500/50'}`}
                            >
                              <div className="text-left">
                                <p className="text-[10px] font-bold text-white uppercase">{ex.name}</p>
                                <p className="text-[9px] text-gray-600 uppercase tracking-widest">{ex.muscle_group}</p>
                              </div>
                              {isAdded ? (
                                <CheckCircle2 size={14} className="text-purple-500" />
                              ) : (
                                <Plus size={14} className="text-gray-600" />
                              )}
                            </button>
                          );
                        })
                      }
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-[#1E1E26] bg-[#0F0F13] shrink-0">
                <button 
                  onClick={handleFinishRoutine}
                  className="w-full rounded-[2rem] bg-gradient-to-r from-purple-600 to-blue-600 py-5 text-sm font-black uppercase italic tracking-[0.3em] text-white shadow-[0_10px_30px_rgba(147,51,234,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Finalizar Treino
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Logar Exercício Avulso */}
      <AnimatePresence>
        {isModalOpen && selectedExercise && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-[#1E1E26] bg-[#0F0F13] shadow-2xl"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute right-6 top-6 text-gray-500 hover:text-white"
              >
                <X className="size-6" />
              </button>

              <div className="p-8 pb-6 border-b border-[#1E1E26]">
                <div className="flex items-center gap-5">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-500">
                    <Dumbbell className="size-7" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase italic text-white tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {selectedExercise.name}
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                      {selectedExercise.muscle_group} • {selectedExercise.category}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {(() => {
                  const previousLog = logs.find(log => log.exercise_id === selectedExercise.id);
                  if (previousLog) {
                    return (
                      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-center gap-3">
                        <History size={16} className="text-blue-500" />
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-0.5">Último Recorde</p>
                          <p className="text-xs font-bold text-gray-300 uppercase tracking-tight">
                            {previousLog.sets} Séries <span className="text-gray-600 px-1">x</span> {previousLog.reps} Reps <span className="text-gray-600 px-1">•</span> <span className="text-white">{previousLog.weight_kg}kg</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-center">Séries</label>
                    <div className="flex flex-col items-center gap-2">
                      <button 
                        onClick={() => setSets(sets + 1)}
                        className="size-8 flex items-center justify-center rounded-lg bg-[#1E1E26] text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                      >+</button>
                      <input 
                        type="number"
                        value={sets}
                        onChange={(e) => setSets(parseInt(e.target.value) || 1)}
                        className="w-full text-center text-xl font-black bg-transparent text-white focus:outline-none"
                      />
                      <button 
                        onClick={() => setSets(Math.max(1, sets - 1))}
                        className="size-8 flex items-center justify-center rounded-lg bg-[#1E1E26] text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                      >-</button>
                    </div>
                  </div>

                  <div className="space-y-2 border-x border-[#1E1E26]">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-center">Reps</label>
                    <div className="flex flex-col items-center gap-2">
                      <button 
                        onClick={() => setReps(reps + 1)}
                        className="size-8 flex items-center justify-center rounded-lg bg-[#1E1E26] text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                      >+</button>
                      <input 
                        type="number"
                        value={reps}
                        onChange={(e) => setReps(parseInt(e.target.value) || 1)}
                        className="w-full text-center text-xl font-black bg-transparent text-white focus:outline-none"
                      />
                      <button 
                        onClick={() => setReps(Math.max(1, reps - 1))}
                        className="size-8 flex items-center justify-center rounded-lg bg-[#1E1E26] text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                      >-</button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-center">Peso (KG)</label>
                    <div className="flex flex-col items-center gap-2">
                      <button 
                        onClick={() => setWeight(weight + 1)}
                        className="size-8 flex items-center justify-center rounded-lg bg-[#1E1E26] text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                      >+</button>
                      <input 
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                        className="w-full text-center text-xl font-black bg-transparent text-white focus:outline-none"
                      />
                      <button 
                        onClick={() => setWeight(Math.max(0, weight - 1))}
                        className="size-8 flex items-center justify-center rounded-lg bg-[#1E1E26] text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                      >-</button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleLogWorkout}
                  className="w-full mt-4 rounded-xl bg-blue-600 py-4 font-black uppercase italic tracking-[0.2em] text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  <CheckCircle2 size={18} />
                  Marcar como Concluído
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal de Confirmação de Exclusão (RPG Style) */}
      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm({ isOpen: false, routineId: null, routineName: '' })}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-red-500/30 bg-[#0F0F13] shadow-[0_0_50px_rgba(239,68,68,0.15)]"
            >
              <div className="p-8 text-center">
                <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <AlertTriangle size={32} />
                </div>
                
                <h2 className="mb-2 text-xl font-black uppercase italic text-white tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Confirmar <span className="text-red-500">Exclusão</span>
                </h2>
                
                <p className="mb-8 text-xs font-medium text-gray-500 leading-relaxed">
                  Tem certeza que deseja deletar o protocolo <span className="text-white font-bold">"{deleteConfirm.routineName}"</span>? 
                  Esta ação é irreversível e removerá todos os dados vinculados.
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setDeleteConfirm({ isOpen: false, routineId: null, routineName: '' })}
                    className="rounded-xl border border-[#1E1E26] bg-white/5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-white/10 hover:text-white"
                  >
                    Abortar
                  </button>
                  <button 
                    onClick={() => deleteConfirm.routineId && handleDeleteRoutine(deleteConfirm.routineId)}
                    className="rounded-xl bg-red-600 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Modal de Detalhes do Preset de Treino */}
      <AnimatePresence>
        {isPresetModalOpen && selectedPreset && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPresetModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col rounded-3xl border border-[#1E1E26] bg-[#0F0F13] shadow-2xl"
            >
              <div className="relative overflow-hidden border-b border-[#1E1E26] p-8">
                <img
                  src={selectedPreset.image}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover object-center opacity-35"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F13] via-[#0F0F13]/85 to-[#0F0F13]/35" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F13] via-transparent to-black/20" />
                <button 
                  onClick={() => setIsPresetModalOpen(false)}
                  className="absolute right-6 top-6 z-10 flex size-9 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-gray-400 backdrop-blur-md transition-colors hover:border-white/20 hover:text-white"
                  aria-label="Fechar detalhes do protocolo"
                >
                  <X className="size-5" />
                </button>

                <div className="relative flex items-center gap-5 pr-12">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-600/20 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)] backdrop-blur-md">
                    <Dumbbell className="size-7" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase italic text-white tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {selectedPreset.title}
                    </h2>
                    <p className="text-xs font-black uppercase tracking-widest text-amber-500 font-orbitron">{selectedPreset.frequency} · {selectedPreset.estimatedDuration}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <p className="text-sm text-gray-400 leading-relaxed">
                  {selectedPreset.description}
                </p>

                <div className="space-y-6">
                  {selectedPreset.routines.map((routine, rIdx) => (
                    <div key={rIdx} className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-400 font-orbitron">
                        {routine.name}
                      </h3>
                      <div className="space-y-2">
                        {routine.exercises.map((ex, exIdx) => (
                          <div key={exIdx} className="flex items-center justify-between rounded-2xl border border-[#1E1E26] bg-white/5 p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex size-8 items-center justify-center rounded-lg bg-white/5 text-gray-400">
                                <span className="text-xs font-bold font-orbitron">{exIdx + 1}</span>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white uppercase">{ex.name}</p>
                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                  {ex.muscle_group} · {ex.category}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono">
                                {ex.weight_kg > 0 ? `${ex.weight_kg} KG` : 'Peso Corporal'}
                              </span>
                              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-mono">
                                {ex.sets}S x {ex.reps}R
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 border-t border-[#1E1E26] bg-white/5 flex gap-4">
                <button 
                  onClick={() => setIsPresetModalOpen(false)}
                  className="flex-1 rounded-xl border border-[#1E1E26] bg-white/5 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-white/10 hover:text-white"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Voltar
                </button>
                <button 
                  onClick={() => handleImportProgram(selectedPreset)}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-amber-600 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {loading ? 'Importando...' : 'Importar Programa Completo'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

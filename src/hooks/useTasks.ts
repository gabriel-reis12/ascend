import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useHunterStore } from '@/stores/useHunterStore';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  category: string;
  category_color: string;
  xp_reward: number;
  stat_target: 'strength' | 'intelligence' | 'endurance' | 'vitality' | 'discipline' | null;
  stat_reward: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface CreateTaskInput {
  title: string;
  category: string;
  category_color: string;
  xp_reward: number;
  stat_target: Task['stat_target'];
  stat_reward: number;
}

export function useTasks() {
  const { user } = useAuth();
  const addXp = useHunterStore((s) => s.addXp);
  const updateStat = useHunterStore((s) => s.updateStat);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    // Se não há usuário, reseta o loading imediatamente (evita skeleton eterno)
    if (!user?.id) {
      setLoading(false);
      setTasks([]);
      return;
    }
    setLoading(true);
    setError(null);

    let active = true;

    // Safety timeout de 5 segundos: garante que o visual de skeletons saia da tela
    // caso as queries do Supabase demorem ou travem temporariamente (ex: cold starts)
    const safetyTimeout = setTimeout(() => {
      if (active) {
        setLoading(false);
        console.warn('Safety timeout de useTasks disparado. Forçando loading = false.');
      }
    }, 5000);

    try {
      const { data, error: dbError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (dbError) throw dbError;
      if (!active) return;
      setTasks(data ?? []);
    } catch (err: any) {
      console.error('Erro ao buscar tarefas:', err);
      if (active) {
        setError(err.message || String(err));
      }
    } finally {
      if (active) {
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const createTask = async (input: CreateTaskInput): Promise<{ data: Task | null; error: string | null }> => {
    if (!user) return { data: null, error: 'Usuário não autenticado' };
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...input, user_id: user.id })
      .select()
      .single();
    if (!error && data) {
      setTasks((prev) => [data, ...prev]);
    }
    return { data: data as Task | null, error: error?.message ?? null };
  };

  const completeTask = async (taskId: string) => {
    if (!user) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.completed) return;

    const { error } = await supabase
      .from('tasks')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', taskId);

    if (!error) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: true, completed_at: new Date().toISOString() } : t
        )
      );
      await addXp(task.xp_reward, user.id);
      if (task.stat_target) await updateStat(task.stat_target, task.stat_reward, user.id);
    }
  };

  const uncompleteTask = async (taskId: string) => {
    if (!user) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.completed) return;

    const { error } = await supabase
      .from('tasks')
      .update({ completed: false, completed_at: null })
      .eq('id', taskId);

    if (!error) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: false, completed_at: null } : t))
      );
      await addXp(-task.xp_reward, user.id);
      if (task.stat_target) await updateStat(task.stat_target, -task.stat_reward, user.id);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (!error) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return {
    tasks,
    pendingTasks,
    completedTasks,
    loading,
    error,
    createTask,
    completeTask,
    uncompleteTask,
    deleteTask,
    refetch: fetchTasks,
  };
}

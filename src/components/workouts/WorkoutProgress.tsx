import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Award, 
  Activity, 
  Calendar,
  Flame,
  Zap,
  Trophy,
  Dumbbell,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useHunterStore } from '@/stores/useHunterStore';

interface WorkoutLog {
  id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  weight_kg: number;
  logged_at: string;
  exercise?: {
    name: string;
    muscle_group: string;
  };
}

interface PersonalRecord {
  exercise_name: string;
  max_weight: number;
  max_reps: number;
  estimated_1rm: number;
  last_date: string;
}

export function WorkoutProgress() {
  const { user } = useAuth();
  const rank = useHunterStore((s) => s.rank);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVolume, setTotalVolume] = useState(0);

  async function fetchProgress() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workout_logs')
        .select(`
          *,
          exercise:exercises(name, muscle_group)
        `)
        .order('logged_at', { ascending: false });

      if (error) throw error;
      
      const typedLogs = data as WorkoutLog[];
      setLogs(typedLogs);

      // Process PRs
      const prMap = new Map<string, PersonalRecord>();
      let volume = 0;

      typedLogs.forEach(log => {
        const name = log.exercise?.name || 'Exercício Desconhecido';
        const weight = log.weight_kg || 0;
        const reps = log.reps || 0;
        const sets = log.sets || 0;
        
        // Volume calculation
        volume += (weight * reps * sets);

        // 1RM Calculation: Weight * (1 + 0.0333 * Reps)
        const current1rm = weight * (1 + 0.0333 * reps);
        
        const existing = prMap.get(name);
        if (!existing || current1rm > existing.estimated_1rm) {
          prMap.set(name, {
            exercise_name: name,
            max_weight: weight,
            max_reps: reps,
            estimated_1rm: current1rm,
            last_date: log.logged_at
          });
        }
      });

      setPrs(Array.from(prMap.values()).sort((a, b) => b.estimated_1rm - a.estimated_1rm));
      setTotalVolume(volume);

    } catch (err) {
      console.error('Error fetching progress:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-3xl bg-white/5" />
        ))}
      </div>
    );
  }

  const trainingDates = [...new Set(logs.map(log => new Date(log.logged_at).toLocaleDateString('en-CA')))].sort().reverse();
  let trainingStreak = 0;
  if (trainingDates.length > 0) {
    const cursor = new Date();
    const today = cursor.toLocaleDateString('en-CA');
    if (trainingDates[0] !== today) cursor.setDate(cursor.getDate() - 1);
    for (const date of trainingDates) {
      if (date !== cursor.toLocaleDateString('en-CA')) break;
      trainingStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  const muscleGroups = Array.from(
    logs.reduce((map, log) => {
      const group = log.exercise?.muscle_group || 'Geral';
      map.set(group, (map.get(group) || 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]);
  const maxGroupLogs = muscleGroups[0]?.[1] || 1;

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6 relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 size-24 bg-blue-600/5 blur-3xl" />
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Volume Total</p>
              <h3 className="text-2xl font-black text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {totalVolume.toLocaleString()} <span className="text-xs text-blue-500 uppercase not-italic">KG</span>
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6 relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 size-24 bg-purple-600/5 blur-3xl" />
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Treinos Realizados</p>
              <h3 className="text-2xl font-black text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {trainingDates.length} <span className="text-xs text-purple-500 uppercase not-italic">DIAS</span>
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-orange-500/20 bg-orange-500/5 p-6 relative overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
              <Flame size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Streak de Treino</p>
              <h3 className="text-2xl font-black text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {trainingStreak} <span className="text-xs text-orange-400 uppercase not-italic">DIAS</span>
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6 relative overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              <Trophy size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Status de Hunter</p>
              <h3 className="text-2xl font-black text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Rank {rank}
              </h3>
            </div>
          </div>
        </motion.div>
      </div>

      {logs.length === 0 && (
        <div className="rounded-3xl border border-dashed border-blue-500/20 bg-[#0F0F13] p-10 text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-blue-500/35" />
          <h3 className="mt-4 text-sm font-black uppercase tracking-wider text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            O Sistema ainda não registrou evolução física
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-gray-500">
            Conclua sua primeira sessão para revelar volume, streak, recordes e grupos musculares mais treinados.
          </p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <BarChart3 className="size-5 text-cyan-400" />
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Grupos Mais <span className="text-cyan-400">Treinados</span>
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {muscleGroups.slice(0, 6).map(([group, count]) => (
              <div key={group} className="rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-cyan-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-white">{group}</span>
                  </div>
                  <span className="text-[9px] font-black text-gray-500">{count} registros</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/50">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(count / maxGroupLogs) * 100}%` }} className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Records */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <Award className="size-5 text-blue-500" />
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Recordes de <span className="text-blue-500">Poder</span> (Estimated 1RM)
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {prs.map((pr, index) => (
            <motion.div
              key={pr.exercise_name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative flex items-center justify-between rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 transition-all hover:border-blue-500/50 hover:bg-[#16161D]"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <Flame size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {pr.exercise_name}
                  </h4>
                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                    Último: {new Date(pr.last_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-1">Estimated Max</p>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-xl font-black text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {Math.round(pr.estimated_1rm)}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">KG</span>
                </div>
              </div>
            </motion.div>
          ))}

          {prs.length === 0 && logs.length > 0 && (
            <div className="col-span-full py-12 text-center rounded-3xl border-2 border-dashed border-[#1E1E26]">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-700">Inicie seu treinamento para capturar dados de evolução.</p>
            </div>
          )}
        </div>
      </div>

      {/* History Log */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <Calendar className="size-5 text-purple-500" />
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Arquivo de <span className="text-purple-500">Missões</span> Recentes
          </h2>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-[#1E1E26] bg-[#0F0F13]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1E1E26] bg-white/5">
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Data</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Exercício</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">Carga/Reps</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">Potencial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E26]">
              {logs.slice(0, 10).map((log) => {
                const pwr = (log.weight_kg || 0) * (1 + 0.0333 * (log.reps || 0));
                return (
                  <tr key={log.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">
                        {new Date(log.logged_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-white uppercase tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {log.exercise?.name}
                      </p>
                      <p className="text-[9px] font-bold text-purple-500 uppercase tracking-widest italic">{log.exercise?.muscle_group}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black text-white uppercase tracking-widest">
                        {log.weight_kg}kg <span className="text-gray-500 mx-1">x</span> {log.reps}r
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-12 bg-gray-800 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (pwr/200)*100)}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-blue-400 italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                          {Math.round(pwr)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
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
  BarChart3,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useHunterStore } from '@/stores/useHunterStore';
import { usePreferences } from '@/contexts/preferences';
import { translateUiText } from '@/lib/uiEnglish';
import { HudCard } from '@/components/ui/hud-card';
import { NeonProgressBar } from '@/components/ui/neon-progress';
import { RankBadge } from '@/components/ui/rank-badge';

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
  const { language } = usePreferences();
  const l = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const tx = (text?: string | null) => (language === 'en-US' && text ? translateUiText(text) : text || '');
  const rank = useHunterStore((s) => s.rank);

  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVolume, setTotalVolume] = useState(0);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('workout_logs')
        .select(`
          *,
          exercise:exercises(name, muscle_group)
        `)
        .order('logged_at', { ascending: false });

      if (user?.id) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const typedLogs = (data || []) as WorkoutLog[];
      setLogs(typedLogs);

      // Process PRs
      const prMap = new Map<string, PersonalRecord>();
      let volume = 0;

      typedLogs.forEach((log) => {
        const name = log.exercise?.name || 'Exercício Desconhecido';
        const weight = log.weight_kg || 0;
        const reps = log.reps || 0;
        const sets = log.sets || 0;

        // Volume calculation
        volume += weight * reps * sets;

        // 1RM Calculation: Weight * (1 + 0.0333 * Reps)
        const current1rm = weight * (1 + 0.0333 * reps);

        const existing = prMap.get(name);
        if (!existing || current1rm > existing.estimated_1rm) {
          prMap.set(name, {
            exercise_name: name,
            max_weight: weight,
            max_reps: reps,
            estimated_1rm: current1rm,
            last_date: log.logged_at,
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
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchProgress();
    } else {
      setLoading(false);
    }
  }, [user, fetchProgress]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-[#12131C]/80" />
          ))}
      </div>
    );
  }

  const trainingDates = [
    ...new Set(logs.map((log) => new Date(log.logged_at).toLocaleDateString('en-CA'))),
  ]
    .sort()
    .reverse();

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
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <HudCard variant="cyan" className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-400">
              <Activity className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">
                {l('Volume Total', 'Total Volume')}
              </p>
              <h3 className="mt-0.5 truncate font-orbitron text-lg font-black text-white sm:text-xl">
                {totalVolume.toLocaleString(language)}{' '}
                <span className="text-[10px] font-bold uppercase text-cyan-400">KG</span>
              </h3>
            </div>
          </div>
        </HudCard>

        <HudCard variant="purple" className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-purple-400/25 bg-purple-500/10 text-purple-400">
              <Zap className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">
                {l('Treinos Realizados', 'Workouts Completed')}
              </p>
              <h3 className="mt-0.5 truncate font-orbitron text-lg font-black text-white sm:text-xl">
                {trainingDates.length}{' '}
                <span className="text-[10px] font-bold uppercase text-purple-400">
                  {l('DIAS', 'DAYS')}
                </span>
              </h3>
            </div>
          </div>
        </HudCard>

        <HudCard variant="gold" className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/10 text-amber-400">
              <Flame className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">
                {l('Streak de Treino', 'Training Streak')}
              </p>
              <h3 className="mt-0.5 truncate font-orbitron text-lg font-black text-white sm:text-xl">
                {trainingStreak}{' '}
                <span className="text-[10px] font-bold uppercase text-amber-400">
                  {l('DIAS', 'DAYS')}
                </span>
              </h3>
            </div>
          </div>
        </HudCard>

        <HudCard variant="default" className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-300">
                <Trophy className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {l('Status de Hunter', 'Hunter Status')}
                </p>
                <h3 className="mt-0.5 truncate font-orbitron text-base font-black text-white sm:text-lg">
                  Rank {rank}
                </h3>
              </div>
            </div>
            <RankBadge rank={rank as 'E' | 'D' | 'C' | 'B' | 'A' | 'S'} size="sm" showLabel={false} />
          </div>
        </HudCard>
      </div>

      {/* Empty State */}
      {logs.length === 0 && (
        <HudCard variant="default" className="p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-400">
            <TrendingUp className="size-6" />
          </div>
          <h3 className="mt-4 font-orbitron text-sm font-black uppercase tracking-wider text-white">
            {l(
              'O Sistema ainda não registrou evolução física',
              'The System has not recorded physical evolution yet',
            )}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-400">
            {l(
              'Conclua sua primeira sessão para revelar volume, streak, recordes e grupos musculares mais treinados.',
              'Complete your first session to reveal volume, streak, personal records, and top muscle groups.',
            )}
          </p>
        </HudCard>
      )}

      {/* Most Trained Muscle Groups */}
      {logs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <BarChart3 className="size-4 text-cyan-400" />
            <h2 className="font-orbitron text-xs font-black uppercase tracking-[0.18em] text-white sm:text-sm">
              {l('Grupos Mais', 'Most Trained')}{' '}
              <span className="text-cyan-400">{l('Treinados', 'Muscle Groups')}</span>
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {muscleGroups.slice(0, 6).map(([group, count]) => {
              const pct = Math.round((count / maxGroupLogs) * 100);
              return (
                <HudCard key={group} variant="default" className="p-4">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Dumbbell className="size-4 shrink-0 text-cyan-400" />
                      <span className="truncate text-xs font-bold uppercase tracking-wider text-white">
                        {tx(group)}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] font-bold text-cyan-300">
                      {count} {l('registros', 'logs')}
                    </span>
                  </div>
                  <NeonProgressBar value={pct} max={100} variant="cyan" size="sm" />
                </HudCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Personal Records (Estimated 1RM) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 px-1">
          <Award className="size-4 text-amber-400" />
          <h2 className="font-orbitron text-xs font-black uppercase tracking-[0.18em] text-white sm:text-sm">
            {l('Recordes de', 'Power')}{' '}
            <span className="text-amber-400">{l('Poder', 'Records')}</span>{' '}
            <span className="text-[10px] font-bold text-slate-400">(1RM)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {prs.map((pr, index) => (
            <motion.div
              key={pr.exercise_name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <HudCard variant="default" className="p-4 transition-colors hover:border-amber-400/35">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/10 text-amber-400">
                      <Flame className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate font-orbitron text-xs font-black uppercase tracking-tight text-white sm:text-sm">
                        {tx(pr.exercise_name)}
                      </h4>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {l('Pico:', 'Best:')} {pr.max_weight}kg × {pr.max_reps}r ·{' '}
                        {new Date(pr.last_date).toLocaleDateString(language)}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                      1RM {l('Est.', 'Est.')}
                    </p>
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="font-orbitron text-lg font-black text-white">
                        {Math.round(pr.estimated_1rm)}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-slate-400">KG</span>
                    </div>
                  </div>
                </div>
              </HudCard>
            </motion.div>
          ))}

          {prs.length === 0 && logs.length > 0 && (
            <HudCard variant="default" className="col-span-full p-8 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                {l(
                  'Inicie seu treinamento para capturar dados de evolução.',
                  'Start your workout to capture progression data.',
                )}
              </p>
            </HudCard>
          )}
        </div>
      </div>

      {/* History Log — Mobile Compact HUD Cards + Desktop HUD Table (No horizontal scroll on mobile) */}
      {logs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <Calendar className="size-4 text-purple-400" />
            <h2 className="font-orbitron text-xs font-black uppercase tracking-[0.18em] text-white sm:text-sm">
              {l('Arquivo de', 'Recent')}{' '}
              <span className="text-purple-400">{l('Missões Recentes', 'Workout Logs')}</span>
            </h2>
          </div>

          {/* Mobile Responsive Compact Cards (320px - 767px) */}
          <div className="space-y-2.5 md:hidden">
            {logs.slice(0, 10).map((log) => {
              const pwr = (log.weight_kg || 0) * (1 + 0.0333 * (log.reps || 0));
              const pwrPct = Math.min(100, Math.round((pwr / 200) * 100));
              return (
                <HudCard key={log.id} variant="default" className="p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-purple-400/25 bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-300">
                          {tx(log.exercise?.muscle_group || 'Geral')}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {new Date(log.logged_at).toLocaleDateString(language)}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 font-orbitron text-xs font-black uppercase text-white leading-snug break-words">
                        {tx(log.exercise?.name || 'Exercício')}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 font-mono text-xs font-bold text-cyan-200">
                        {log.sets ? `${log.sets}×${log.reps}` : `${log.reps}r`} · {log.weight_kg}kg
                      </span>
                      <p className="mt-1 font-mono text-[10px] font-bold text-slate-400">
                        1RM: <span className="text-cyan-400">{Math.round(pwr)}kg</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <NeonProgressBar value={pwrPct} max={100} variant="cyan" size="sm" />
                  </div>
                </HudCard>
              );
            })}
          </div>

          {/* Desktop HUD Table (768px+) */}
          <HudCard variant="default" className="hidden overflow-hidden p-0 md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {l('Data', 'Date')}
                  </th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {l('Exercício', 'Exercise')}
                  </th>
                  <th className="px-5 py-3.5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {l('Séries / Carga', 'Sets / Weight')}
                  </th>
                  <th className="px-5 py-3.5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {l('Potencial (1RM)', 'Potential (1RM)')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {logs.slice(0, 10).map((log) => {
                  const pwr = (log.weight_kg || 0) * (1 + 0.0333 * (log.reps || 0));
                  const pwrPct = Math.min(100, Math.round((pwr / 200) * 100));
                  return (
                    <tr key={log.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold text-slate-400">
                          {new Date(log.logged_at).toLocaleDateString(language)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-orbitron text-xs font-black uppercase tracking-tight text-white">
                          {tx(log.exercise?.name || 'Exercício')}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">
                          {tx(log.exercise?.muscle_group || 'Geral')}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 font-mono text-xs font-bold text-cyan-200">
                          {log.sets ? `${log.sets}s × ` : ''}
                          {log.reps}r · {log.weight_kg}kg
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-20">
                            <NeonProgressBar value={pwrPct} max={100} variant="cyan" size="sm" />
                          </div>
                          <span className="w-12 font-orbitron text-xs font-black text-cyan-400">
                            {Math.round(pwr)}kg
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </HudCard>
        </div>
      )}
    </div>
  );
}

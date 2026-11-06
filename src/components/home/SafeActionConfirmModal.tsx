import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Repeat, Sparkles, Apple } from 'lucide-react';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { usePreferences } from '@/contexts/preferences';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, type Task } from '@/hooks/useTasks';

export interface RecentMealItem {
  food_id: string;
  food_name: string;
  quantity_grams: number;
  meal_type: string;
  calories: number;
}

interface SafeActionConfirmModalProps {
  open: boolean;
  onClose: () => void;
  actionType: 'meal' | 'task';
  recentMeal?: RecentMealItem | null;
  recentTask?: Task | null;
  onSuccess?: (message: string) => void;
  onNavigateFallback?: (path: string) => void;
}

export function SafeActionConfirmModal({
  open,
  onClose,
  actionType,
  recentMeal,
  recentTask,
  onSuccess,
  onNavigateFallback,
}: SafeActionConfirmModalProps) {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const { user } = useAuth();
  const { createTask } = useTasks();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleConfirmMealRepeat = async () => {
    if (!user || !recentMeal) {
      if (onNavigateFallback) onNavigateFallback('/nutrition');
      onClose();
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const payload = {
        user_id: user.id,
        food_id: recentMeal.food_id,
        quantity_grams: recentMeal.quantity_grams,
        meal_type: recentMeal.meal_type || 'Almoço',
        source: 'manual',
      };
      const { error } = await supabase.from('food_logs').insert(payload);
      if (error) throw error;

      if (onSuccess) {
        onSuccess(
          l(
            `Refeição "${recentMeal.food_name}" (${recentMeal.quantity_grams}g) registrada com sucesso!`,
            `Meal "${recentMeal.food_name}" (${recentMeal.quantity_grams}g) logged successfully!`
          )
        );
      }
      onClose();
    } catch (err: any) {
      console.error('[SafeActionConfirmModal] Erro ao repetir refeição:', err);
      setErrorMsg(
        err.message ||
          l(
            'Falha ao duplicar refeição com segurança. Redirecionando para o Diário...',
            'Failed to repeat meal safely. Redirecting to Food Log...'
          )
      );
      setTimeout(() => {
        if (onNavigateFallback) onNavigateFallback('/nutrition');
        onClose();
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTaskRepeat = async () => {
    if (!user || !recentTask) {
      if (onNavigateFallback) onNavigateFallback('/quests');
      onClose();
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await createTask({
        title: recentTask.title,
        category: recentTask.category,
        category_color: recentTask.category_color,
        xp_reward: recentTask.xp_reward,
        stat_target: recentTask.stat_target,
        stat_reward: recentTask.stat_reward,
      });

      if (res.error) throw new Error(res.error);

      if (onSuccess) {
        onSuccess(
          l(
            `Tarefa "${recentTask.title}" reativada como pendente para hoje!`,
            `Task "${recentTask.title}" reactivated as pending for today!`
          )
        );
      }
      onClose();
    } catch (err: any) {
      console.error('[SafeActionConfirmModal] Erro ao repetir tarefa:', err);
      setErrorMsg(
        err.message ||
          l(
            'Falha ao reativar tarefa. Redirecionando para o quadro de missões...',
            'Failed to reactivate task. Redirecting to quest board...'
          )
      );
      setTimeout(() => {
        if (onNavigateFallback) onNavigateFallback('/quests');
        onClose();
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  const isMeal = actionType === 'meal';
  const hasData = isMeal ? Boolean(recentMeal) : Boolean(recentTask);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md z-10"
        >
          <HudCard
            variant={isMeal ? 'cyan' : 'purple'}
            corners
            radialGlow
            className="border-white/15 bg-[#0D1019]/95 shadow-2xl p-5 sm:p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                    isMeal
                      ? 'border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF]'
                      : 'border-[#A855F7]/30 bg-[#A855F7]/10 text-[#A855F7]'
                  }`}
                >
                  {isMeal ? (
                    <Repeat className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <h3 className="font-orbitron text-sm sm:text-base font-bold uppercase tracking-wider text-white">
                    {isMeal
                      ? l('Confirmar Repetição de Refeição', 'Confirm Repeat Meal')
                      : l('Reativar Tarefa Concluída', 'Reactivate Completed Task')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {l('Confirmação de segurança ASCEND', 'ASCEND Safety Confirmation')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-white/20 hover:text-white"
                aria-label={l('Fechar', 'Close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="py-4 space-y-3.5">
              {hasData ? (
                <>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 space-y-2">
                    <span className="font-orbitron text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {isMeal
                        ? l('Último Registro Encontrado', 'Latest Recorded Entry')
                        : l('Tarefa para Reativar', 'Task to Reactivate')}
                    </span>

                    {isMeal && recentMeal && (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate text-sm sm:text-base">
                            {recentMeal.food_name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {recentMeal.meal_type} • {recentMeal.quantity_grams}g
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-orbitron text-sm font-bold text-[#00F0FF]">
                            {Math.round(recentMeal.calories)} kcal
                          </span>
                        </div>
                      </div>
                    )}

                    {!isMeal && recentTask && (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate text-sm sm:text-base">
                            {recentTask.title}
                          </p>
                          <p className="text-xs text-slate-400">{recentTask.category}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-orbitron text-xs font-bold text-[#A855F7]">
                            +{recentTask.xp_reward} XP
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Warning Note */}
                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                    <span>
                      {isMeal
                        ? l(
                            'Esta ação duplicará os macronutrientes no dia de hoje. Não haverá duplicação indevida de XP.',
                            'This will duplicate the macros into today. XP will not be granted prematurely.'
                          )
                        : l(
                            'A tarefa será criada como PENDENTE para hoje. O XP só será concedido quando você marcá-la como concluída.',
                            'The task will be created as PENDING for today. XP is only granted once completed.'
                          )}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <p className="text-sm text-slate-300">
                    {isMeal
                      ? l(
                          'Nenhum registro anterior encontrado para repetir.',
                          'No previous food log found to repeat.'
                        )
                      : l(
                          'Nenhuma tarefa concluída recentemente encontrada.',
                          'No recently completed task found.'
                        )}
                  </p>
                  <p className="text-xs text-slate-400">
                    {l(
                      'Deseja abrir a página correspondente para registrar manualmente?',
                      'Would you like to open the page to register manually?'
                    )}
                  </p>
                </div>
              )}

              {errorMsg && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
              <TacticalButton
                variant="ghost"
                onClick={onClose}
                className="min-h-[44px] px-4 text-xs font-bold"
              >
                {l('Cancelar', 'Cancel')}
              </TacticalButton>

              {hasData ? (
                <TacticalButton
                  variant="primary"
                  accent={isMeal ? 'cyan' : 'purple'}
                  onClick={isMeal ? handleConfirmMealRepeat : handleConfirmTaskRepeat}
                  disabled={loading}
                  className="min-h-[44px] px-5 text-xs font-bold"
                >
                  {loading
                    ? l('Registrando...', 'Registering...')
                    : isMeal
                    ? l('Confirmar Lançamento', 'Confirm Entry')
                    : l('Reativar Tarefa', 'Reactivate Task')}
                </TacticalButton>
              ) : (
                <TacticalButton
                  variant="primary"
                  accent="cyan"
                  onClick={() => {
                    if (onNavigateFallback) {
                      onNavigateFallback(isMeal ? '/nutrition' : '/quests');
                    }
                    onClose();
                  }}
                  className="min-h-[44px] px-5 text-xs font-bold"
                >
                  {isMeal ? l('Abrir Nutrição', 'Open Nutrition') : l('Abrir Missões', 'Open Quests')}
                </TacticalButton>
              )}
            </div>
          </HudCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


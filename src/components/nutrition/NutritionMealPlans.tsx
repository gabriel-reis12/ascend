import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Search,
  Trash2,
  UtensilsCrossed,
  Zap,
  Apple,
  ChevronDown,
  Flame,
  Droplets,
  Scale,
  Clock,
  Gauge,
  CheckCircle2,
} from 'lucide-react';
import { useMealPlans, calcMealMacros, type MealPlan } from '@/hooks/useMealPlans';
import type { Food } from '@/types/nutrition';
import { usePreferences } from '@/contexts/preferences';
import { translateUiText } from '@/lib/uiEnglish';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { cn } from '@/lib/utils';

interface NutritionMealPlansProps {
  foods: Food[];
  onUsePlan: (plan: MealPlan) => Promise<void>;
  feedback?: string | null;
}

function getPlanMetadata(plan: MealPlan, macros: ReturnType<typeof calcMealMacros>) {
  const itemCount = plan.items?.length ?? 0;
  const name = plan.name.toLowerCase();
  const objective =
    macros.protein >= 30
      ? 'Suporte à força e recuperação'
      : macros.carbs >= 45
        ? 'Energia e reposição'
        : 'Equilíbrio e consistência';
  const difficulty = itemCount <= 3 ? 'Fácil' : itemCount <= 5 ? 'Moderada' : 'Estruturada';
  const prepTime = itemCount === 0 ? '--' : `${Math.min(45, 10 + itemCount * 5)} min`;
  const tags = [
    itemCount > 0 && itemCount <= 3 ? 'Rápido' : 'Planejado',
    macros.protein >= 30 ? 'Alto em proteína' : 'Equilibrado',
    name.includes('pré') || name.includes('pre') ? 'Pré-treino' : null,
    name.includes('pós') || name.includes('pos') ? 'Pós-treino' : null,
  ].filter(Boolean) as string[];

  return { objective, difficulty, prepTime, tags };
}

function MacroBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className={cn('font-orbitron text-xs font-black sm:text-sm', color)}>{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
    </div>
  );
}

function FoodSearchResult({
  food,
  onAdd,
}: {
  food: Food;
  onAdd: (foodId: string, quantityGrams: number) => void;
}) {
  const { language } = usePreferences();
  const tx = (value?: string | null) => (language === 'en-US' && value ? translateUiText(value) : value);
  const isCustomUnit = !!food.serving_unit && !!food.serving_size;
  const [qty, setQty] = useState(isCustomUnit ? 1 : 100);

  const handleAdd = () => {
    const safeQty = Math.max(1, qty || 1);
    const finalGrams = isCustomUnit ? safeQty * food.serving_size! : safeQty;
    onAdd(food.id, finalGrams);
  };

  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#090B12] p-2.5">
      <div className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold uppercase text-white">{tx(food.name)}</span>
        <span className="text-[10px] font-medium text-slate-400">
          {isCustomUnit
            ? `${food.serving_size}g / ${tx(food.serving_unit)}`
            : `${food.calories_per_100g} kcal/100g · ${food.protein_per_100g}g P`}
        </span>
      </div>
      <input
        type="number"
        inputMode="decimal"
        value={qty}
        onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
        className="h-9 w-16 rounded-lg border border-white/10 bg-black px-2 text-center font-mono text-xs font-bold text-white focus:border-cyan-400 focus:outline-none"
        min={1}
      />
      <span className="text-[10px] font-bold uppercase text-slate-400">
        {isCustomUnit ? tx(food.serving_unit) : 'g'}
      </span>
      <button
        type="button"
        onClick={handleAdd}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/35 bg-cyan-500/20 text-cyan-200 transition-colors hover:bg-cyan-500/30"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function MealPlanCard({
  plan,
  onDelete,
  foods,
  onAddItem,
  onRemoveItem,
  onUsePlan,
  isUsing,
}: {
  plan: MealPlan;
  onDelete: (id: string) => void;
  foods: Food[];
  onAddItem: (planId: string, foodId: string, qty: number) => void;
  onRemoveItem: (itemId: string, planId: string) => void;
  onUsePlan: (plan: MealPlan) => Promise<void>;
  isUsing: boolean;
}) {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const tx = (value?: string | null) => (isEnglish && value ? translateUiText(value) : value);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);

  const macros = calcMealMacros(plan.items ?? []);
  const metadata = getPlanMetadata(plan, macros);
  const filtered = foods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6);

  return (
    <HudCard variant="default" className="overflow-hidden p-0">
      {/* Card Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-300">
            <UtensilsCrossed className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {metadata.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300"
                >
                  {tx(tag)}
                </span>
              ))}
              <span className="font-mono text-[10px] font-bold text-amber-400">+{plan.xp_reward} XP</span>
            </div>
            <p className="mt-1 truncate font-orbitron text-sm font-black uppercase tracking-tight text-white sm:text-base">
              {tx(plan.name)}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">{tx(metadata.objective)}</p>
          </div>

          {confirmDel ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onDelete(plan.id)}
                className="min-h-[36px] rounded-lg border border-rose-500/40 bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-300"
              >
                {l('Sim', 'Yes')}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDel(false)}
                className="min-h-[36px] rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-400"
              >
                {l('Não', 'No')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDel(true)}
              aria-label={l('Excluir plano alimentar', 'Delete meal plan')}
              className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition-colors hover:border-rose-500/35 hover:text-rose-300"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>

        {/* Compact Metrics Row */}
        <div className="mt-3.5 grid grid-cols-4 gap-2 rounded-xl border border-white/[0.06] bg-[#090B12]/90 p-2.5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {l('Energia', 'Energy')}
            </p>
            <p className="mt-0.5 font-mono text-xs font-black text-cyan-300">{Math.round(macros.kcal)} kcal</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {l('Proteína', 'Protein')}
            </p>
            <p className="mt-0.5 font-mono text-xs font-black text-purple-300">{macros.protein.toFixed(0)}g</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {l('Itens', 'Items')}
            </p>
            <p className="mt-0.5 font-mono text-xs font-black text-white">{(plan.items ?? []).length}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {l('Preparo', 'Prep')}
            </p>
            <p className="mt-0.5 font-mono text-xs font-black text-emerald-300">{metadata.prepTime}</p>
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          <div className="flex-1">
            <TacticalButton
              variant="primary"
              fullWidth
              displayFont
              disabled={isUsing || !plan.items?.length}
              leftIcon={isUsing ? <Clock className="size-4 animate-spin" /> : <Plus className="size-4" />}
              onClick={() => void onUsePlan(plan)}
            >
              {isUsing ? l('Registrando...', 'Logging...') : l('Registrar no Diário', 'Log to Diary')}
            </TacticalButton>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="flex size-[52px] shrink-0 items-center justify-center rounded-xl border border-white/12 bg-[#121521] text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-white"
            aria-label={
              expanded ? l('Recolher cardápio', 'Collapse meal plan') : l('Expandir cardápio', 'Expand meal plan')
            }
          >
            <ChevronDown className={cn('size-5 transition-transform', expanded && 'rotate-180 text-cyan-300')} />
          </button>
        </div>
      </div>

      {/* Expanded Details: Items + Macro Totals + Search */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/10 bg-[#080A11]"
          >
            <div className="space-y-4 p-4 sm:p-5">
              {(plan.items ?? []).length === 0 ? (
                <p className="py-2 text-center text-xs text-slate-400">
                  {l('Nenhum alimento vinculado a esta refeição.', 'No foods linked to this meal yet.')}
                </p>
              ) : (
                <div className="space-y-2">
                  {(plan.items ?? []).map((item) => {
                    const ratio = item.quantity_grams / 100;
                    const kcal = (item.food?.calories_per_100g ?? 0) * ratio;
                    const isCustom = !!item.food?.serving_unit && !!item.food?.serving_size;
                    const displayQty = isCustom
                      ? Number((item.quantity_grams / item.food!.serving_size!).toFixed(2))
                      : item.quantity_grams;
                    const displayUnit = isCustom ? item.food!.serving_unit : 'g';

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Apple className="size-4 shrink-0 text-cyan-400" />
                          <div className="min-w-0">
                            <span className="block truncate text-xs font-bold uppercase text-white">
                              {tx(item.food?.name)}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {displayQty} {tx(displayUnit)} ·{' '}
                              <strong className="text-cyan-300">{Math.round(kcal)} kcal</strong>
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id, plan.id)}
                          aria-label={l('Remover alimento do plano', 'Remove food from plan')}
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-500/15 hover:text-rose-300"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {(plan.items ?? []).length > 0 && (
                <div className="grid grid-cols-4 rounded-xl border border-cyan-400/20 bg-cyan-500/[0.05] p-3">
                  <MacroBadge label="Kcal" value={Math.round(macros.kcal).toString()} color="text-cyan-300" />
                  <MacroBadge label="Prot" value={`${macros.protein.toFixed(0)}g`} color="text-purple-300" />
                  <MacroBadge label="Carb" value={`${macros.carbs.toFixed(0)}g`} color="text-emerald-300" />
                  <MacroBadge label="Gord" value={`${macros.fat.toFixed(0)}g`} color="text-amber-300" />
                </div>
              )}

              {/* Add Food to Meal Plan */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                  + {l('Adicionar Alimento ao Cardápio', 'Add Food to Meal Plan')}
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={l('Buscar alimento...', 'Search food...')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="min-h-[42px] w-full rounded-xl border border-white/10 bg-black/60 py-2 pl-10 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                {search && (
                  <div className="max-h-48 space-y-1.5 overflow-y-auto pt-1">
                    {filtered.map((food) => (
                      <FoodSearchResult
                        key={food.id}
                        food={food}
                        onAdd={(fId, qGrams) => {
                          onAddItem(plan.id, fId, qGrams);
                          setSearch('');
                        }}
                      />
                    ))}
                    {filtered.length === 0 && (
                      <p className="py-2 text-center text-xs text-slate-400">
                        {l('Nenhum alimento encontrado.', 'No food found.')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </HudCard>
  );
}

export function NutritionMealPlans({ foods, onUsePlan, feedback }: NutritionMealPlansProps) {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const tx = (value?: string | null) => (isEnglish && value ? translateUiText(value) : value);
  const {
    mealPlans,
    loading,
    createMealPlan,
    deleteMealPlan,
    addItemToMeal,
    removeItemFromMeal,
  } = useMealPlans();

  const [newName, setNewName] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [usingPlanId, setUsingPlanId] = useState<string | null>(null);

  async function handleUsePlan(plan: MealPlan) {
    setUsingPlanId(plan.id);
    try {
      await onUsePlan(plan);
    } finally {
      setUsingPlanId(null);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    await createMealPlan(newName.trim(), 30);
    setNewName('');
    setModalOpen(false);
  }

  const activeMealPlans = mealPlans.filter((p) => p.is_active);
  const totals = activeMealPlans.reduce(
    (acc, p) => {
      const macros = calcMealMacros(p.items ?? []);
      return {
        kcal: acc.kcal + macros.kcal,
        protein: acc.protein + macros.protein,
        carbs: acc.carbs + macros.carbs,
        fat: acc.fat + macros.fat,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <div className="space-y-5">
      {feedback && (
        <HudCard variant="success" className="p-3.5">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-200">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
            <span>{tx(feedback)}</span>
          </div>
        </HudCard>
      )}

      {/* Summary Header Card for Meal Plans */}
      <HudCard variant="cyan" corners className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
              {l('PLANEJAMENTO NUTRICIONAL', 'MEAL PLAN OVERVIEW')}
            </span>
            <h2 className="mt-0.5 font-orbitron text-lg font-black uppercase text-white sm:text-xl">
              {Math.round(totals.kcal)}{' '}
              <span className="text-xs font-bold text-cyan-300">kcal {l('planejadas', 'planned')}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-amber-400/30 bg-amber-500/15 px-3 py-1.5 font-mono text-xs font-bold text-amber-300">
              +{activeMealPlans.reduce((a, p) => a + p.xp_reward, 0)} XP
            </span>
            <TacticalButton
              variant="secondary"
              leftIcon={<Plus className="size-4" />}
              onClick={() => setModalOpen(true)}
            >
              {l('Nova Refeição', 'New Meal')}
            </TacticalButton>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 divide-x divide-white/10 rounded-xl border border-white/[0.07] bg-[#090B12]/90 p-3 text-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
              {l('Proteínas', 'Protein')}
            </p>
            <p className="mt-0.5 font-mono text-sm font-black text-white">{totals.protein.toFixed(1)}g</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
              {l('Carboidratos', 'Carbs')}
            </p>
            <p className="mt-0.5 font-mono text-sm font-black text-white">{totals.carbs.toFixed(1)}g</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
              {l('Gorduras', 'Fats')}
            </p>
            <p className="mt-0.5 font-mono text-sm font-black text-white">{totals.fat.toFixed(1)}g</p>
          </div>
        </div>
      </HudCard>

      {/* Meal Plans List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-[#12131C]/80" />
          ))}
        </div>
      ) : mealPlans.length === 0 ? (
        <HudCard variant="default" className="p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-300">
            <UtensilsCrossed className="size-6" />
          </div>
          <h3 className="mt-4 font-orbitron text-sm font-black uppercase tracking-wider text-white">
            {l('Nenhum Cardápio Definido', 'No Meal Plan Defined')}
          </h3>
          <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-slate-400">
            {l(
              'Monte refeições fixas para registrar vários alimentos de uma só vez e sincronizar com suas missões diárias.',
              'Build fixed meals to log multiple foods at once and sync with your daily quests.',
            )}
          </p>
          <div className="mt-5 flex justify-center">
            <TacticalButton
              variant="primary"
              displayFont
              leftIcon={<Plus className="size-4" />}
              onClick={() => setModalOpen(true)}
            >
              {l('Criar Primeira Refeição', 'Create First Meal')}
            </TacticalButton>
          </div>
        </HudCard>
      ) : (
        <div className="space-y-3">
          {mealPlans.map((plan) => (
            <MealPlanCard
              key={plan.id}
              plan={plan}
              onDelete={deleteMealPlan}
              foods={foods}
              onAddItem={addItemToMeal}
              onRemoveItem={removeItemFromMeal}
              onUsePlan={handleUsePlan}
              isUsing={usingPlanId === plan.id}
            />
          ))}
        </div>
      )}

      {/* Create New Meal Plan Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="relative w-full max-w-md rounded-t-3xl border border-cyan-400/35 bg-[#0D0F18] p-6 shadow-2xl sm:rounded-3xl"
            >
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>

              <div className="mb-5 flex items-center gap-3.5 pr-10">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-300">
                  <UtensilsCrossed className="size-6" />
                </div>
                <div>
                  <span className="font-orbitron text-[10px] font-black uppercase tracking-widest text-cyan-400">
                    {l('Planejamento Nutricional', 'Meal Planning')}
                  </span>
                  <h2 className="font-orbitron text-lg font-black uppercase text-white">
                    {l('Nova Refeição', 'New Meal')}
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {l('Nome da Refeição', 'Meal Name')}
                  </label>
                  <input
                    type="text"
                    placeholder={l('Ex: Café da Manhã, Pós-Treino...', 'E.g. Breakfast, Post-Workout...')}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    autoFocus
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-white/10 bg-[#090B12] px-4 py-3 text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <TacticalButton
                  variant="primary"
                  fullWidth
                  displayFont
                  disabled={!newName.trim()}
                  onClick={handleCreate}
                >
                  {l('Criar Refeição', 'Create Meal')}
                </TacticalButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

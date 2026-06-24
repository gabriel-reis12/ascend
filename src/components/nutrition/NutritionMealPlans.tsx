import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search, Trash2, UtensilsCrossed, Zap, Apple, ChevronDown, Flame, Droplets, Scale, Clock, Gauge, CheckCircle2 } from 'lucide-react';
import { useMealPlans, calcMealMacros, type MealPlan } from '@/hooks/useMealPlans';
import type { Food } from '@/types/nutrition';
import { usePreferences } from '@/contexts/preferences';
import { translateUiText } from '@/lib/uiEnglish';

interface NutritionMealPlansProps {
  foods: Food[];
  onUsePlan: (plan: MealPlan) => Promise<void>;
  feedback?: string | null;
}

function getPlanMetadata(plan: MealPlan, macros: ReturnType<typeof calcMealMacros>) {
  const itemCount = plan.items?.length ?? 0;
  const name = plan.name.toLowerCase();
  const objective = macros.protein >= 30
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
      <span className={`text-sm font-black ${color}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>{value}</span>
      <span className="text-xs font-medium text-gray-500">{label}</span>
    </div>
  );
}

function FoodSearchResult({ food, onAdd }: { food: Food; onAdd: (foodId: string, quantityGrams: number) => void }) {
  const { language } = usePreferences();
  const tx = (value?: string | null) => language === 'en-US' && value ? translateUiText(value) : value;
  const isCustomUnit = !!food.serving_unit && !!food.serving_size;
  const [qty, setQty] = useState(isCustomUnit ? 1 : 100);

  const handleAdd = () => {
    const finalGrams = isCustomUnit ? qty * food.serving_size! : qty;
    onAdd(food.id, finalGrams);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
      <div className="flex-1 min-w-0">
        <span className="text-xs font-bold text-white uppercase truncate block">{tx(food.name)}</span>
        <span className="text-xs text-gray-500">
           {isCustomUnit ? `${food.serving_size}g / ${tx(food.serving_unit)}` : `${food.calories_per_100g} kcal/100g`}
        </span>
      </div>
      <input
        type="number"
        value={qty}
        onChange={e => setQty(Number(e.target.value))}
        className="w-14 rounded-lg border border-[#1E1E26] bg-black px-2 py-1 text-center text-xs text-white focus:outline-none"
        min={1}
      />
      <span className="text-xs text-gray-500">{isCustomUnit ? tx(food.serving_unit) : 'g'}</span>
      <button
        onClick={handleAdd}
        className="rounded-lg bg-orange-600 p-1.5 text-white hover:bg-orange-500"
      >
        <Plus size={12} />
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
  const tx = (value?: string | null) => isEnglish && value ? translateUiText(value) : value;
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);

  const macros = calcMealMacros(plan.items ?? []);
  const metadata = getPlanMetadata(plan, macros);
  const filtered = foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] transition-all hover:border-orange-500/25 hover:shadow-[0_0_20px_rgba(249,115,22,0.07)]"
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-orange-500/15 bg-orange-500/10 transition-all">
            <UtensilsCrossed size={18} className="text-orange-400" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-black uppercase tracking-tight text-white"
              style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {tx(plan.name)}
            </p>
            <p className="mt-1 text-[13px] font-medium text-gray-500">{tx(metadata.objective)}</p>
          </div>

          {confirmDel ? (
            <div className="flex gap-1">
              <button onClick={() => onDelete(plan.id)} className="rounded-lg bg-red-500/20 px-2 py-1 text-xs font-bold text-red-400 hover:bg-red-500/30">{l('Sim', 'Yes')}</button>
              <button onClick={() => setConfirmDel(false)} className="rounded-lg bg-white/5 px-2 py-1 text-xs font-bold text-gray-500">{l('Não', 'No')}</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)} className="text-gray-700 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: l('Energia', 'Energy'), value: `${Math.round(macros.kcal)} kcal`, icon: Flame, tone: 'text-orange-400' },
            { label: l('Proteína', 'Protein'), value: `${macros.protein.toFixed(0)}g`, icon: Zap, tone: 'text-purple-400' },
            { label: l('Dificuldade', 'Difficulty'), value: tx(metadata.difficulty), icon: Gauge, tone: 'text-blue-400' },
            { label: l('Preparo', 'Prep'), value: metadata.prepTime, icon: Clock, tone: 'text-emerald-400' },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-white/5 bg-black/25 p-3">
              <item.icon className={`size-3.5 ${item.tone}`} />
              <p className="mt-2 text-xs font-medium text-gray-500">{item.label}</p>
              <p className="mt-1 text-sm font-bold text-gray-300">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {metadata.tags.map(tag => (
            <span key={tag} className="rounded-md border border-orange-500/15 bg-orange-500/5 px-2 py-1 text-xs font-semibold text-orange-300">
              {tx(tag)}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <button
            type="button"
            onClick={() => void onUsePlan(plan)}
            disabled={isUsing || !plan.items?.length}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-bold text-white transition-all hover:bg-orange-500 hover:shadow-[0_0_18px_rgba(249,115,22,0.24)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isUsing ? <Clock className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            {isUsing ? l('Adicionando...', 'Adding...') : l('Adicionar ao dia', 'Add to day')}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(p => !p)}
            className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-500 transition-colors hover:text-white"
            aria-label={expanded ? l('Recolher cardápio', 'Collapse meal plan') : l('Expandir cardápio', 'Expand meal plan')}
          >
            <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded: itens + macros + busca */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[#1E1E26]"
          >
            <div className="p-4 space-y-4">
              {/* Itens da refeição */}
              {(plan.items ?? []).length === 0 ? (
                <p className="py-2 text-center text-[13px] font-medium text-gray-500">
                  {l('Nenhum alimento adicionado ainda.', 'No food added yet.')}
                </p>
              ) : (
                <div className="space-y-2">
                  {(plan.items ?? []).map(item => {
                    const ratio = item.quantity_grams / 100;
                    const kcal = (item.food?.calories_per_100g ?? 0) * ratio;
                    const isCustom = !!item.food?.serving_unit && !!item.food?.serving_size;
                    const displayQty = isCustom ? Number((item.quantity_grams / item.food!.serving_size!).toFixed(2)) : item.quantity_grams;
                    const displayUnit = isCustom ? item.food!.serving_unit : 'g';

                    return (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
                        <Apple size={12} className="shrink-0 text-orange-400" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-white uppercase truncate block">{tx(item.food?.name)}</span>
                          <span className="text-xs text-gray-500">{displayQty} {tx(displayUnit)} · {Math.round(kcal)} kcal</span>
                        </div>
                        <button onClick={() => onRemoveItem(item.id, plan.id)} className="text-gray-700 hover:text-red-400">
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Totais de macros */}
              {(plan.items ?? []).length > 0 && (
                <div className="flex justify-around rounded-xl bg-orange-500/5 border border-orange-500/10 p-3">
                  <MacroBadge label="Kcal" value={Math.round(macros.kcal).toString()} color="text-orange-400" />
                  <MacroBadge label="Prot" value={`${macros.protein.toFixed(0)}g`} color="text-blue-400" />
                  <MacroBadge label="Carb" value={`${macros.carbs.toFixed(0)}g`} color="text-cyan-400" />
                  <MacroBadge label="Gord" value={`${macros.fat.toFixed(0)}g`} color="text-yellow-400" />
                </div>
              )}

              {/* Adicionar alimento */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-400">{l('Adicionar alimento', 'Add food')}</p>
                <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder={l('Buscar alimento...', 'Search food...')}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-[#1E1E26] bg-black py-2 pl-8 pr-3 text-xs text-white placeholder:text-gray-600 focus:border-orange-500/50 focus:outline-none"
                  />
                </div>

                {search && (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {filtered.map(food => (
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
                      <p className="py-2 text-center text-[13px] text-gray-500">{l('Nenhum alimento encontrado.', 'No food found.')}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function NutritionMealPlans({ foods, onUsePlan, feedback }: NutritionMealPlansProps) {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const tx = (value?: string | null) => isEnglish && value ? translateUiText(value) : value;
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
    await createMealPlan(newName.trim(), 30); // XP Padrão fixado em 30
    setNewName('');
    setModalOpen(false);
  }

  const activeMealPlans = mealPlans.filter((p) => p.is_active);
  const totals = activeMealPlans.reduce((acc, p) => {
    const macros = calcMealMacros(p.items ?? []);
    return {
      kcal: acc.kcal + macros.kcal,
      protein: acc.protein + macros.protein,
      carbs: acc.carbs + macros.carbs,
      fat: acc.fat + macros.fat,
    };
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <div className="space-y-6">
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm font-semibold text-emerald-200"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
          {tx(feedback)}
        </motion.div>
      )}
      {/* Stats Board */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
        {[
          { label: l('Energia (kcal)', 'Energy (kcal)'), value: totals.kcal.toFixed(0), icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: l('Proteína', 'Protein'), value: totals.protein.toFixed(1) + 'g', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: l('Carbos', 'Carbs'), value: totals.carbs.toFixed(1) + 'g', icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
          { label: l('Gorduras', 'Fats'), value: totals.fat.toFixed(1) + 'g', icon: Scale, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className={`flex size-9 sm:size-12 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="size-5 sm:size-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                <p className="text-sm sm:text-xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats rápidos */}
      <div className="flex items-center gap-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 px-5 py-3">
        <UtensilsCrossed size={18} className="text-orange-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-400">{l('Total energético dos cardápios', 'Total energy across meal plans')}</p>
          <p className="text-xl font-black text-orange-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {Math.round(totals.kcal)} <span className="text-xs text-gray-600">kcal</span>
          </p>
        </div>
        <div className="flex items-center gap-1 text-sm font-bold text-yellow-500">
          <Zap size={12} fill="currentColor" />
          {activeMealPlans.reduce((a, p) => a + p.xp_reward, 0)} XP
        </div>
      </div>

      {/* Header + botão */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">
          {mealPlans.length} {l('refeição(ões) definida(s)', 'meal(s) defined')}
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all"
        >
          <Plus size={14} strokeWidth={3} /> {l('Nova Refeição', 'New Meal')}
        </button>
      </div>

      {/* Lista de cardápios */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/5" />)}
        </div>
      ) : mealPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-orange-500/5 p-8">
            <UtensilsCrossed size={48} className="text-gray-700" />
          </div>
          <h3 className="text-sm font-bold uppercase italic text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {l('Nenhum Cardápio Definido', 'No Meal Plan Defined')}
          </h3>
          <p className="mt-2 max-w-xs text-[11px] uppercase tracking-widest text-gray-600">
            {l('Crie suas refeições para que apareçam como missões diárias.', 'Create meals so they appear as daily quests.')}
          </p>
          <button onClick={() => setModalOpen(true)} className="mt-5 text-[11px] font-black uppercase tracking-widest text-orange-400 hover:underline">
            {l('+ Criar Primeira Refeição', '+ Create First Meal')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {mealPlans.map(plan => (
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

      {/* Modal criar refeição */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-7 shadow-2xl"
            >
              <button onClick={() => setModalOpen(false)} className="absolute right-5 top-5 text-gray-500 hover:text-white">
                <X size={20} />
              </button>

              <div className="mb-6 flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                  <UtensilsCrossed size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase italic text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {l('Nova', 'New')} <span className="text-orange-400">{l('Refeição', 'Meal')}</span>
                  </h2>
                  <p className="text-[13px] text-gray-500">{l('Defina seu cardápio', 'Define your meal plan')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-300">{l('Nome da refeição', 'Meal name')}</label>
                  <input
                    type="text"
                    placeholder={l('Ex: Café da Manhã, Ref. 1, Pré-Treino...', 'E.g. Breakfast, Meal 1, Pre-workout...')}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    autoFocus
                    className="w-full rounded-xl border border-[#1E1E26] bg-black p-3.5 text-sm text-white placeholder:text-gray-600 focus:border-orange-500/50 focus:outline-none"
                  />
                </div>


                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="w-full rounded-2xl bg-orange-600 py-4 font-black uppercase italic tracking-[0.15em] text-white transition-all hover:bg-orange-500 hover:shadow-[0_0_25px_rgba(249,115,22,0.35)] disabled:opacity-40"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {l('Criar Refeição', 'Create Meal')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

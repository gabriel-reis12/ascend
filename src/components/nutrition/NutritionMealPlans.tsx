import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search, Trash2, UtensilsCrossed, Zap, Apple, ChevronDown, Flame, Droplets, Scale } from 'lucide-react';
import { useMealPlans, calcMealMacros, type MealPlan } from '@/hooks/useMealPlans';
import type { Food } from '@/types/nutrition';

interface NutritionMealPlansProps {
  foods: Food[];
}

function MacroBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-xs font-black ${color}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>{value}</span>
      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">{label}</span>
    </div>
  );
}

function FoodSearchResult({ food, onAdd }: { food: Food; onAdd: (foodId: string, quantityGrams: number) => void }) {
  const isCustomUnit = !!food.serving_unit && !!food.serving_size;
  const [qty, setQty] = useState(isCustomUnit ? 1 : 100);

  const handleAdd = () => {
    const finalGrams = isCustomUnit ? qty * food.serving_size! : qty;
    onAdd(food.id, finalGrams);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
      <div className="flex-1 min-w-0">
        <span className="text-xs font-bold text-white uppercase truncate block">{food.name}</span>
        <span className="text-[10px] text-gray-500">
           {isCustomUnit ? `${food.serving_size}g / ${food.serving_unit}` : `${food.calories_per_100g} kcal/100g`}
        </span>
      </div>
      <input
        type="number"
        value={qty}
        onChange={e => setQty(Number(e.target.value))}
        className="w-14 rounded-lg border border-[#1E1E26] bg-black px-2 py-1 text-center text-xs text-white focus:outline-none"
        min={1}
      />
      <span className="text-[10px] text-gray-600">{isCustomUnit ? food.serving_unit : 'g'}</span>
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
}: {
  plan: MealPlan;
  onDelete: (id: string) => void;
  foods: Food[];
  onAddItem: (planId: string, foodId: string, qty: number) => void;
  onRemoveItem: (itemId: string, planId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);

  const macros = calcMealMacros(plan.items ?? []);
  const filtered = foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] transition-all"
    >
      {/* Card Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 transition-all">
          <UtensilsCrossed size={18} className="text-orange-400" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black uppercase tracking-tight text-white"
            style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {plan.name}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">
              {Math.round(macros.kcal)} kcal
            </span>
            <span className="text-[10px] font-bold text-gray-600 uppercase">
              +{plan.xp_reward} XP
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setExpanded(p => !p)} className="text-gray-500 hover:text-white transition-colors">
            <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>

          {confirmDel ? (
            <div className="flex gap-1">
              <button onClick={() => onDelete(plan.id)} className="rounded-lg bg-red-500/20 px-2 py-1 text-[9px] font-black text-red-400 hover:bg-red-500/30">SIM</button>
              <button onClick={() => setConfirmDel(false)} className="rounded-lg bg-white/5 px-2 py-1 text-[9px] font-black text-gray-500">NÃO</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)} className="text-gray-700 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
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
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-600 py-2">
                  Nenhum alimento adicionado ainda.
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
                          <span className="text-xs font-bold text-white uppercase truncate block">{item.food?.name}</span>
                          <span className="text-[10px] text-gray-500">{displayQty} {displayUnit} · {Math.round(kcal)} kcal</span>
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
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">+ Adicionar Alimento</p>
                <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar alimento..."
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
                      <p className="py-2 text-center text-[10px] text-gray-600">Nenhum alimento encontrado.</p>
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

export function NutritionMealPlans({ foods }: NutritionMealPlansProps) {
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
      {/* Stats Board */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
        {[
          { label: 'Energia (kcal)', value: totals.kcal.toFixed(0), icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Proteína', value: totals.protein.toFixed(1) + 'g', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Carbos', value: totals.carbs.toFixed(1) + 'g', icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
          { label: 'Gorduras', value: totals.fat.toFixed(1) + 'g', icon: Scale, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className={`flex size-9 sm:size-12 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="size-5 sm:size-6" />
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500">{stat.label}</p>
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
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Kcal do Cardápio</p>
          <p className="text-xl font-black text-orange-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {Math.round(totals.kcal)} <span className="text-xs text-gray-600">kcal</span>
          </p>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-black text-yellow-500 uppercase">
          <Zap size={12} fill="currentColor" />
          {activeMealPlans.reduce((a, p) => a + p.xp_reward, 0)} XP
        </div>
      </div>

      {/* Header + botão */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
          {mealPlans.length} refeição(ões) definida(s)
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white hover:bg-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all"
        >
          <Plus size={14} strokeWidth={3} /> Nova Refeição
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
            Nenhum Cardápio Definido
          </h3>
          <p className="mt-2 max-w-xs text-[11px] uppercase tracking-widest text-gray-600">
            Crie suas refeições para que apareçam como missões diárias.
          </p>
          <button onClick={() => setModalOpen(true)} className="mt-5 text-[11px] font-black uppercase tracking-widest text-orange-400 hover:underline">
            + Criar Primeira Refeição
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
                    Nova <span className="text-orange-400">Refeição</span>
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-gray-600">Defina seu cardápio</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Nome da Refeição</label>
                  <input
                    type="text"
                    placeholder="Ex: Café da Manhã, Ref. 1, Pré-Treino..."
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
                  Criar Refeição
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

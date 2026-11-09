import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Minus,
  Plus,
  Repeat,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { supabase } from '@/lib/supabase';
import { localDayBounds } from '@/lib/date';
import { usePreferences } from '@/contexts/preferences';
import { triggerGameFeel } from '@/lib/gameFeel';

export interface RepeatableMealItem {
  food_id: string;
  food_name: string;
  quantity_grams: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

export interface MealCombinationPreset {
  id: string;
  title: string;
  meal_type: string;
  sourceLabel: string;
  isFavorite?: boolean;
  items: RepeatableMealItem[];
}

interface FoodMetricShape {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

interface QuickMealRepeatPanelProps {
  userId: string | undefined;
  todayLogs: Array<{
    id: string;
    food_id: string;
    quantity_grams: number;
    meal_type: string;
    food?: FoodMetricShape | FoodMetricShape[] | null;
  }>;
  foods?: FoodMetricShape[];
  onRepeated: (message: string) => void;
}

const FAVORITE_MEALS_KEY_PREFIX = 'ascend_favorite_meal_combos_';

export function QuickMealRepeatPanel({
  userId,
  todayLogs,
  foods = [],
  onRepeated,
}: QuickMealRepeatPanelProps) {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);

  const [recentCombos, setRecentCombos] = useState<MealCombinationPreset[]>([]);
  const [favoriteCombos, setFavoriteCombos] = useState<MealCombinationPreset[]>([]);
  const [reviewCombo, setReviewCombo] = useState<MealCombinationPreset | null>(null);
  const [reviewMealType, setReviewMealType] = useState<string>('Almoço');
  const [reviewItems, setReviewItems] = useState<RepeatableMealItem[]>([]);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingLockRef = useRef(false);

  // Carrega favoritos salvos localmente
  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(`${FAVORITE_MEALS_KEY_PREFIX}${userId}`);
      if (raw) {
        setFavoriteCombos(JSON.parse(raw));
      }
    } catch {
      // Ignore storage parse errors
    }
  }, [userId]);

  const saveFavorites = (next: MealCombinationPreset[]) => {
    setFavoriteCombos(next);
    if (!userId) return;
    try {
      localStorage.setItem(`${FAVORITE_MEALS_KEY_PREFIX}${userId}`, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  };

  // Busca refeições recentes (últimos 7 dias antes de hoje) para repetição rápida
  useEffect(() => {
    async function fetchRecentMeals() {
      if (!userId) return;
      try {
        const { startIso } = localDayBounds();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
          .from('food_logs')
          .select('id, food_id, quantity_grams, meal_type, logged_at, food:foods(*)')
          .eq('user_id', userId)
          .lt('logged_at', startIso)
          .gte('logged_at', sevenDaysAgo.toISOString())
          .order('logged_at', { ascending: false })
          .limit(40);

        if (error || !data) return;

        // Agrupar por data + meal_type para montar combinações completas
        const grouped = new Map<string, MealCombinationPreset>();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toLocaleDateString('en-CA');

        for (const row of data as any[]) {
          const foodObj = Array.isArray(row.food) ? row.food[0] : row.food;
          if (!foodObj || !row.food_id) continue;

          const dayKey = new Date(row.logged_at).toLocaleDateString('en-CA');
          const mType = row.meal_type || 'Almoço';
          const groupKey = `${dayKey}:${mType}`;
          const isYesterday = dayKey === yesterdayKey;

          if (!grouped.has(groupKey)) {
            grouped.set(groupKey, {
              id: `recent_${groupKey}`,
              title: isYesterday
                ? `${mType} (${l('Repetir refeição de ontem', "Repeat yesterday's meal")})`
                : mType,
              meal_type: mType,
              sourceLabel: isYesterday ? l('Ontem', 'Yesterday') : dayKey,
              items: [],
            });
          }

          const group = grouped.get(groupKey)!;
          // Se o mesmo alimento já estiver no grupo, soma as gramas
          const existingItem = group.items.find((i) => i.food_id === row.food_id);
          if (existingItem) {
            existingItem.quantity_grams += Number(row.quantity_grams) || 100;
          } else {
            group.items.push({
              food_id: row.food_id,
              food_name: foodObj.name || 'Alimento',
              quantity_grams: Number(row.quantity_grams) || 100,
              calories_per_100g: Number(foodObj.calories_per_100g) || 0,
              protein_per_100g: Number(foodObj.protein_per_100g) || 0,
              carbs_per_100g: Number(foodObj.carbs_per_100g) || 0,
              fat_per_100g: Number(foodObj.fat_per_100g) || 0,
            });
          }
        }

        setRecentCombos(Array.from(grouped.values()).slice(0, 4));
      } catch {
        // Ignore network errors silently
      }
    }

    void fetchRecentMeals();
  }, [userId]);

  // Permite salvar uma refeição registrada hoje como Favorita (consolidando itens duplicados)
  const handleSaveTodaySlotAsFavorite = (mealType: string) => {
    const deduplicated = new Map<string, RepeatableMealItem>();

    for (const log of todayLogs) {
      const foodObj = Array.isArray(log.food) ? log.food[0] : log.food;
      if (log.meal_type !== mealType || !foodObj || !log.food_id) continue;

      const grams = Number(log.quantity_grams) || 100;
      const existing = deduplicated.get(log.food_id);
      if (existing) {
        existing.quantity_grams += grams;
      } else {
        deduplicated.set(log.food_id, {
          food_id: log.food_id,
          food_name: foodObj.name || 'Alimento',
          quantity_grams: grams,
          calories_per_100g: Number(foodObj.calories_per_100g) || 0,
          protein_per_100g: Number(foodObj.protein_per_100g) || 0,
          carbs_per_100g: Number(foodObj.carbs_per_100g) || 0,
          fat_per_100g: Number(foodObj.fat_per_100g) || 0,
        });
      }
    }

    const slotItems = Array.from(deduplicated.values());
    if (slotItems.length === 0) return;

    const newFav: MealCombinationPreset = {
      id: `fav_${mealType}_${slotItems.map((item) => item.food_id).join('_')}`,
      title: `${mealType} (${slotItems.length} ${slotItems.length === 1 ? 'item' : 'itens'})`,
      meal_type: mealType,
      sourceLabel: l('Combinação Favorita', 'Favorite Combo'),
      isFavorite: true,
      items: slotItems,
    };

    const next = [newFav, ...favoriteCombos.filter((f) => f.title !== newFav.title)].slice(0, 6);
    saveFavorites(next);
    onRepeated(
      l(
        `Combinação de ${mealType} salva nos seus Favoritos!`,
        `${mealType} combination saved to your Favorites!`
      )
    );
  };

  const handleRemoveFavorite = (id: string) => {
    saveFavorites(favoriteCombos.filter((f) => f.id !== id));
  };

  const openReviewModal = (combo: MealCombinationPreset) => {
    setReviewError(null);
    setReviewCombo(combo);
    setReviewMealType(combo.meal_type || 'Almoço');
    setReviewItems(combo.items.map((item) => ({ ...item })));
  };

  const handleAdjustReviewQty = (index: number, nextGrams: number) => {
    setReviewItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, quantity_grams: Math.max(5, Math.round(nextGrams)) } : item
      )
    );
  };

  const handleRemoveReviewItem = (index: number) => {
    setReviewItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmRepeat = async () => {
    if (!userId || !reviewCombo || reviewItems.length === 0) return;
    if (submittingLockRef.current || isSubmitting) return;

    submittingLockRef.current = true;
    setIsSubmitting(true);
    setReviewError(null);

    try {
      const payloads = reviewItems.map((item) => ({
        user_id: userId,
        food_id: item.food_id,
        quantity_grams: Math.max(1, Number(item.quantity_grams) || 100),
        meal_type: reviewMealType,
      }));

      const { error } = await supabase.from('food_logs').insert(payloads);
      if (error) throw error;

      triggerGameFeel('questComplete');
      setReviewCombo(null);
      onRepeated(
        l(
          `Refeição repetida com sucesso em ${reviewMealType} (${reviewItems.length} ${
            reviewItems.length === 1 ? 'item' : 'itens'
          })!`,
          `Meal repeated successfully in ${reviewMealType} (${reviewItems.length} ${
            reviewItems.length === 1 ? 'item' : 'items'
          })!`
        )
      );
    } catch (err: unknown) {
      console.error('[QuickMealRepeatPanel] Erro ao repetir refeição:', err);
      setReviewError(
        err instanceof Error
          ? err.message
          : l(
              'Não foi possível registrar a refeição. Tente novamente.',
              'Could not log this meal. Please try again.'
            )
      );
    } finally {
      setIsSubmitting(false);
      submittingLockRef.current = false;
    }
  };

  const todayLoggedMealTypes = Array.from(
    new Set(todayLogs.filter((l) => l.food).map((l) => l.meal_type))
  );

  // Combinações habituais determinísticas baseadas no catálogo TACO carregado (Req 8.1)
  const habitualCombos: MealCombinationPreset[] = (() => {
    if (!foods || foods.length === 0) return [];
    const findFood = (keywords: string[]) =>
      foods.find((f) => {
        const lower = f.name.toLowerCase();
        return keywords.some((kw) => lower.includes(kw));
      });

    const rice = findFood(['arroz']);
    const chicken = findFood(['frango', 'peito de frango']);
    const beans = findFood(['feijão', 'feijao']);
    const egg = findFood(['ovo']);
    const oats = findFood(['aveia', 'pão', 'pao', 'banana']);

    const combos: MealCombinationPreset[] = [];
    if (rice && chicken) {
      const lunchItems: RepeatableMealItem[] = [
        {
          food_id: rice.id,
          food_name: rice.name,
          quantity_grams: 150,
          calories_per_100g: Number(rice.calories_per_100g) || 0,
          protein_per_100g: Number(rice.protein_per_100g) || 0,
          carbs_per_100g: Number(rice.carbs_per_100g) || 0,
          fat_per_100g: Number(rice.fat_per_100g) || 0,
        },
        {
          food_id: chicken.id,
          food_name: chicken.name,
          quantity_grams: 120,
          calories_per_100g: Number(chicken.calories_per_100g) || 0,
          protein_per_100g: Number(chicken.protein_per_100g) || 0,
          carbs_per_100g: Number(chicken.carbs_per_100g) || 0,
          fat_per_100g: Number(chicken.fat_per_100g) || 0,
        },
      ];
      if (beans) {
        lunchItems.push({
          food_id: beans.id,
          food_name: beans.name,
          quantity_grams: 100,
          calories_per_100g: Number(beans.calories_per_100g) || 0,
          protein_per_100g: Number(beans.protein_per_100g) || 0,
          carbs_per_100g: Number(beans.carbs_per_100g) || 0,
          fat_per_100g: Number(beans.fat_per_100g) || 0,
        });
      }
      combos.push({
        id: 'habitual_lunch_pf',
        title: l('Prato Base Proteico', 'Habitual Protein Plate'),
        meal_type: 'Almoço',
        sourceLabel: l('Combinação Habitual', 'Habitual Combo'),
        items: lunchItems,
      });
    }

    if (egg && oats && egg.id !== oats.id) {
      combos.push({
        id: 'habitual_breakfast_power',
        title: l('Café Proteico Habitual', 'Habitual Protein Breakfast'),
        meal_type: 'Café da Manhã',
        sourceLabel: l('Combinação Habitual', 'Habitual Combo'),
        items: [
          {
            food_id: egg.id,
            food_name: egg.name,
            quantity_grams: 100,
            calories_per_100g: Number(egg.calories_per_100g) || 0,
            protein_per_100g: Number(egg.protein_per_100g) || 0,
            carbs_per_100g: Number(egg.carbs_per_100g) || 0,
            fat_per_100g: Number(egg.fat_per_100g) || 0,
          },
          {
            food_id: oats.id,
            food_name: oats.name,
            quantity_grams: 60,
            calories_per_100g: Number(oats.calories_per_100g) || 0,
            protein_per_100g: Number(oats.protein_per_100g) || 0,
            carbs_per_100g: Number(oats.carbs_per_100g) || 0,
            fat_per_100g: Number(oats.fat_per_100g) || 0,
          },
        ],
      });
    }

    return combos;
  })();

  const allCombos = [...favoriteCombos, ...recentCombos, ...habitualCombos];

  return (
    <HudCard variant="default" className="p-4 sm:p-5 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#00F0FF]/35 bg-[#00F0FF]/10 text-[#00F0FF]">
            <Repeat className="size-4" />
          </div>
          <div>
            <h3 className="font-orbitron text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              {l('Repetição Rápida & Refeições Favoritas', 'Quick Repeat & Favorite Meals')}
            </h3>
            <p className="text-[11px] text-slate-400">
              {l(
                'Repita refeições recentes ou favoritas revisando as quantidades antes de confirmar.',
                'Repeat recent or favorite meals and review quantities before confirming.'
              )}
            </p>
          </div>
        </div>

        {/* Botões rápidos para favoritar uma refeição já lançada hoje */}
        {todayLoggedMealTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {todayLoggedMealTypes.map((mType) => (
              <button
                key={mType}
                type="button"
                onClick={() => handleSaveTodaySlotAsFavorite(mType)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-amber-400/35 bg-amber-500/10 px-2.5 py-1 font-orbitron text-[9px] font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                <Star className="size-3 fill-amber-400 text-amber-400" />
                <span>
                  {l(`Favoritar ${mType}`, `Save ${mType}`)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {allCombos.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-black/30 p-3.5 text-xs text-slate-400 flex items-center justify-between gap-3">
          <span>
            {l(
              'Assim que você registrar refeições no diário ou favoritar uma refeição de hoje, elas aparecerão aqui para repetição em 1 toque.',
              'Once you log meals in the diary or favorite a meal from today, they will appear here for 1-tap repetition.'
            )}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {allCombos.map((combo) => {
            const totalKcal = Math.round(
              combo.items.reduce(
                (sum, item) => sum + (item.calories_per_100g * item.quantity_grams) / 100,
                0
              )
            );
            const totalProtein = Math.round(
              combo.items.reduce(
                (sum, item) => sum + (item.protein_per_100g * item.quantity_grams) / 100,
                0
              )
            );

            return (
              <div
                key={combo.id}
                className="flex items-center justify-between gap-2.5 rounded-xl border border-white/10 bg-[#080A11]/90 p-3 hover:border-cyan-400/35 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {combo.isFavorite ? (
                      <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
                    ) : (
                      <Clock className="size-3.5 shrink-0 text-cyan-400" />
                    )}
                    <span className="truncate font-orbitron text-xs font-bold uppercase text-white">
                      {combo.title}
                    </span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-slate-400 shrink-0">
                      {combo.sourceLabel}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-slate-400">
                    {combo.items.map((i) => `${i.food_name} (${i.quantity_grams}g)`).join(', ')}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] font-bold text-cyan-300">
                    {totalKcal} kcal · P: {totalProtein}g
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {combo.isFavorite && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFavorite(combo.id)}
                      aria-label={l('Remover favorito', 'Remove favorite')}
                      className="flex size-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:border-rose-500/40 hover:text-rose-300"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                  <TacticalButton
                    type="button"
                    variant="secondary"
                    accent="cyan"
                    onClick={() => openReviewModal(combo)}
                    className="min-h-[40px] px-3 text-[11px] font-bold"
                  >
                    <Repeat className="size-3.5" />
                    <span>{l('Repetir', 'Repeat')}</span>
                  </TacticalButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Revisão de Quantidades antes de Confirmar Repetição */}
      <AnimatePresence>
        {reviewCombo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-[#00F0FF]/40 bg-[#0B0E17] p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <span className="font-orbitron text-[10px] font-bold uppercase tracking-widest text-[#00F0FF]">
                    {l('Revisar Quantidades', 'Review Quantities')}
                  </span>
                  <h4 className="font-orbitron text-sm sm:text-base font-black uppercase text-white">
                    {reviewCombo.title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewCombo(null)}
                  className="flex size-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Seleção da Refeição de Destino */}
              <div>
                <label className="mb-1.5 block font-orbitron text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {l('Registrar em qual refeição de hoje?', 'Log into which meal today?')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {['Café da Manhã', 'Almoço', 'Lanche', 'Jantar'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setReviewMealType(slot)}
                      className={`min-h-[38px] rounded-lg border px-2 py-1 font-orbitron text-[10px] font-bold uppercase transition-all ${
                        reviewMealType === slot
                          ? 'border-[#00F0FF]/50 bg-[#00F0FF]/15 text-[#00F0FF]'
                          : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de Alimentos com Ajuste de Gramas */}
              {reviewError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-2.5 text-xs text-rose-200"
                >
                  {reviewError}
                </div>
              )}

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {reviewItems.map((item, idx) => {
                  const itemKcal = Math.round((item.calories_per_100g * item.quantity_grams) / 100);
                  return (
                    <div
                      key={`${item.food_id}-${idx}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 p-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-white">{item.food_name}</p>
                        <p className="font-mono text-[10px] text-cyan-300">{itemKcal} kcal</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAdjustReviewQty(idx, item.quantity_grams - 25)}
                          className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white"
                          aria-label={l('Diminuir 25g', 'Decrease 25g')}
                        >
                          <Minus className="size-3" />
                        </button>
                        <input
                          type="number"
                          inputMode="decimal"
                          min={5}
                          max={2000}
                          value={item.quantity_grams}
                          onChange={(e) =>
                            handleAdjustReviewQty(idx, parseFloat(e.target.value) || 5)
                          }
                          className="w-16 rounded-lg border border-white/15 bg-black/70 px-1.5 py-1 text-center font-mono text-xs font-bold text-white focus:border-[#00F0FF] focus:outline-none"
                        />
                        <span className="text-[10px] font-mono text-slate-400">g</span>
                        <button
                          type="button"
                          onClick={() => handleAdjustReviewQty(idx, item.quantity_grams + 25)}
                          className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white"
                          aria-label={l('Aumentar 25g', 'Increase 25g')}
                        >
                          <Plus className="size-3" />
                        </button>
                        {reviewItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveReviewItem(idx)}
                            className="flex size-8 items-center justify-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                            aria-label={l('Remover item', 'Remove item')}
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <span className="font-mono text-xs font-bold text-slate-300">
                  {l('Total estimado:', 'Estimated total:')}{' '}
                  <strong className="text-[#00F0FF]">
                    {Math.round(
                      reviewItems.reduce(
                        (sum, i) => sum + (i.calories_per_100g * i.quantity_grams) / 100,
                        0
                      )
                    )}{' '}
                    kcal
                  </strong>
                </span>

                <div className="flex items-center gap-2">
                  <TacticalButton
                    type="button"
                    variant="ghost"
                    onClick={() => setReviewCombo(null)}
                    className="min-h-[42px] px-3 text-xs"
                  >
                    {l('Cancelar', 'Cancel')}
                  </TacticalButton>
                  <TacticalButton
                    type="button"
                    variant="primary"
                    accent="cyan"
                    displayFont
                    disabled={isSubmitting || reviewItems.length === 0}
                    onClick={handleConfirmRepeat}
                    leftIcon={<CheckCircle2 className="size-4" />}
                    className="min-h-[42px] px-4 text-xs font-black"
                  >
                    {isSubmitting
                      ? l('Registrando...', 'Logging...')
                      : l('Confirmar Refeição', 'Confirm Meal')}
                  </TacticalButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </HudCard>
  );
}

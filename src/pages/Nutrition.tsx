import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Apple,
  History,
  X,
  Flame,
  Zap,
  Droplets,
  LayoutGrid,
  Table as TableIcon,
  UtensilsCrossed,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Trash2,
  Clock,
  CheckCircle2,
  Target,
  Gauge,
  AlertTriangle,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Calculator,
  Edit3,
  Scale,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { NutritionMealPlans } from '@/components/nutrition/NutritionMealPlans';
import type { Food } from '@/types/nutrition';
import { localDateString, localDayBounds } from '@/lib/date';
import { useHunterStore } from '@/stores/useHunterStore';
import { useBossStore } from '@/stores/useBossStore';
import { calculateNutritionTargets } from '@/lib/nutritionTargets';
import type { MealPlan } from '@/hooks/useMealPlans';
import { usePreferences } from '@/contexts/preferences';
import { translateUiText } from '@/lib/uiEnglish';
import { analyzeNutritionText, type NutritionAiIngredient } from '@/lib/nutritionAi';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { NeonProgressBar, NeonProgressRing } from '@/components/ui/neon-progress';
import { RankBadge } from '@/components/ui/rank-badge';
import { cn } from '@/lib/utils';

interface FoodLog {
  id: string;
  food_id: string;
  quantity_grams: number;
  meal_type: string;
  logged_at: string;
  food?: Food | Food[];
  source?: string;
  meal_plan_id?: string | null;
  meal_completion_id?: string | null;
}

function normalizeFoodLog(log: FoodLog): FoodLog {
  const food = Array.isArray(log.food) ? log.food[0] : log.food;
  return {
    ...log,
    quantity_grams: Number(log.quantity_grams) || 0,
    food,
  };
}

function foodFromLog(log: FoodLog) {
  return Array.isArray(log.food) ? log.food[0] : log.food;
}

interface NutritionScore {
  date: string;
  success: boolean;
}

function quantityToGrams(food: Food, quantity: number) {
  return food.serving_size && food.serving_unit ? quantity * food.serving_size : quantity;
}

function gramsToQuantity(food: Food, grams: number) {
  return food.serving_size && food.serving_unit ? grams / food.serving_size : grams;
}

type NutritionStatus = 'low' | 'ideal' | 'exceeded';

const DEFAULT_MEAL_SLOTS: Array<{
  id: string;
  pt: string;
  en: string;
  icon: LucideIcon;
}> = [
  { id: 'Café da Manhã', pt: 'Café da Manhã', en: 'Breakfast', icon: Coffee },
  { id: 'Almoço', pt: 'Almoço', en: 'Lunch', icon: Sun },
  { id: 'Jantar', pt: 'Jantar', en: 'Dinner', icon: Moon },
  { id: 'Lanche', pt: 'Lanche', en: 'Snack', icon: Cookie },
];

const NUTRITION_PROMPTS = [
  {
    label: { 'pt-BR': 'Prato completo', 'en-US': 'Full plate' },
    text: {
      'pt-BR': '150g de frango, 150g de arroz, 100g de feijão e salada',
      'en-US': '150g grilled chicken, 150g rice, 100g beans and salad',
    },
  },
  {
    label: { 'pt-BR': 'Lanche rápido', 'en-US': 'Quick snack' },
    text: {
      'pt-BR': 'Iogurte natural, banana, aveia e mel',
      'en-US': 'Plain yogurt, banana, oats and honey',
    },
  },
  {
    label: { 'pt-BR': 'Café proteico', 'en-US': 'Protein breakfast' },
    text: {
      'pt-BR': 'Omelete com 3 ovos, queijo e pão integral',
      'en-US': 'Omelet with 3 eggs, cheese and whole wheat bread',
    },
  },
];

export function Nutrition() {
  const { user } = useAuth();
  const hunterProfile = useHunterStore();
  const { language, t } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const tx = (value?: string | null) => (isEnglish && value ? translateUiText(value) : value);

  const [activeTab, setActiveTab] = useState<'diario' | 'cardapios'>('diario');
  const [subTab, setSubTab] = useState<'library' | 'codex'>('library');
  const [foods, setFoods] = useState<Food[]>([]);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalFoodSearch, setModalFoodSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewFoodModalOpen, setIsNewFoodModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [expandedMealCategory, setExpandedMealCategory] = useState<string | null>(null);

  // Log Form State
  const [quantity, setQuantity] = useState(100);
  const [mealType, setMealType] = useState('Almoço');

  // New Food Form State
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCals, setNewFoodCals] = useState(0);
  const [newFoodProtein, setNewFoodProtein] = useState(0);
  const [newFoodCarbs, setNewFoodCarbs] = useState(0);
  const [newFoodFat, setNewFoodFat] = useState(0);
  const [newFoodCategory, setNewFoodCategory] = useState('Outros');
  const [newFoodServingSize, setNewFoodServingSize] = useState<number | undefined>();
  const [newFoodServingUnit, setNewFoodServingUnit] = useState<string>('');

  // TACO Text Calculator State (Deterministic Local Parser)
  const [iaTextInput, setIaTextInput] = useState('');
  const [iaMealType, setIaMealType] = useState('Almoço');
  const [iaLoading, setIaLoading] = useState(false);
  const [iaError, setIaError] = useState<string | null>(null);

  const [iaPreview, setIaPreview] = useState<{
    mealName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    totalGrams: number;
    confidence: number;
    ingredients: NutritionAiIngredient[];
  } | null>(null);
  const [expandedIaIngs, setExpandedIaIngs] = useState<Set<number>>(new Set());

  const toggleIaIngExpanded = (index: number) => {
    setExpandedIaIngs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const [iaEditing, setIaEditing] = useState(false);
  const [iaRegistering, setIaRegistering] = useState(false);
  const [iaRegistrationSuccess, setIaRegistrationSuccess] = useState<string | null>(null);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [mealPlanFeedback, setMealPlanFeedback] = useState<string | null>(null);
  const [nutritionStreak, setNutritionStreak] = useState(0);

  useEffect(() => {
    fetchData();
  }, [user]);

  const triggerFeedback = (message: string) => {
    setSaveFeedback(message);
    setTimeout(() => {
      setSaveFeedback((prev) => (prev === message ? null : prev));
    }, 2800);
  };

  async function fetchData() {
    if (!user) {
      setLoading(false);
      setFoods([]);
      setLogs([]);
      setNutritionStreak(0);
      return;
    }
    setLoading(true);
    setDataError(null);

    const safetyTimer = setTimeout(() => {
      setLoading(false);
      console.warn('[Nutrition] Safety timeout disparado.');
    }, 5000);

    try {
      const { startIso, endIso } = localDayBounds();
      const [
        { data: foodData, error: foodError },
        { data: logData, error: logError },
        { data: scoreData, error: scoreError },
      ] = await Promise.all([
        supabase.from('foods').select('*').order('name'),
        supabase
          .from('food_logs')
          .select(`
            *,
            food:foods(*)
          `)
          .eq('user_id', user.id)
          .gte('logged_at', startIso)
          .lte('logged_at', endIso)
          .order('logged_at', { ascending: false }),
        supabase
          .from('nutrition_daily_scores')
          .select('date, success')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(30),
      ]);

      if (foodError) throw foodError;
      setFoods(foodData || []);

      if (logError) throw logError;
      setLogs(((logData || []) as FoodLog[]).map(normalizeFoodLog));
      if (scoreError) throw scoreError;

      const scoresByDate = new Map(
        ((scoreData as NutritionScore[]) || []).map((score) => [score.date, score.success]),
      );
      const cursor = new Date();
      cursor.setDate(cursor.getDate() - 1);
      let streak = 0;
      while (scoresByDate.get(localDateString(cursor)) === true) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }
      setNutritionStreak(streak);
    } catch (err) {
      console.error('Error fetching nutrition data:', err);
      setDataError(err instanceof Error ? err.message : String(err));
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  }

  async function handleLogFood() {
    if (!user || !selectedFood) return;

    try {
      const safeQty = Math.max(0.1, Number(quantity) || 0);
      const finalGrams = quantityToGrams(selectedFood, safeQty);

      const payload = {
        user_id: user.id,
        food_id: selectedFood.id,
        quantity_grams: finalGrams,
        meal_type: mealType,
      };
      const { error } = editingLogId
        ? await supabase.from('food_logs').update(payload).eq('id', editingLogId).eq('user_id', user.id)
        : await supabase.from('food_logs').insert(payload);

      if (error) throw error;

      const loggedFoodName = selectedFood.name;
      setIsModalOpen(false);
      setSelectedFood(null);
      setEditingLogId(null);
      setQuantity(100);
      setModalFoodSearch('');
      triggerFeedback(
        editingLogId
          ? l(`Registro de ${loggedFoodName} atualizado.`, `${loggedFoodName} log updated.`)
          : l(`${loggedFoodName} adicionado em ${mealType}.`, `${loggedFoodName} added to ${tx(mealType)}.`),
      );
      fetchData();
    } catch (err) {
      console.error('Error logging food:', err);
    }
  }

  function handleEditLog(log: FoodLog) {
    if (log.source === 'meal_plan') {
      setDataError(
        l(
          'Refeições do Cardápio do Caçador devem ser ajustadas no próprio cardápio. Desmarque a missão antes de alterar os itens.',
          "Meals from the Hunter's Meal Plan must be adjusted in the plan itself. Uncheck the quest before changing items.",
        ),
      );
      return;
    }

    const food = foodFromLog(log);
    if (!food) return;
    const displayQuantity = gramsToQuantity(food, log.quantity_grams);

    setSelectedFood(food);
    setQuantity(Number(displayQuantity.toFixed(2)));
    setMealType(log.meal_type);
    setEditingLogId(log.id);
    setIsModalOpen(true);
  }

  async function handleDeleteLog(logId: string) {
    if (!user) return;
    const targetLog = logs.find((log) => log.id === logId);
    if (targetLog?.source === 'meal_plan' && targetLog.meal_completion_id) {
      const { data: deleted, error: completionError } = await supabase
        .from('meal_completions')
        .delete()
        .eq('id', targetLog.meal_completion_id)
        .eq('user_id', user.id)
        .select('id');

      if (completionError) {
        setDataError(completionError.message);
        return;
      }

      setLogs((current) =>
        current.filter((log) => log.meal_completion_id !== targetLog.meal_completion_id),
      );
      if ((deleted ?? []).length > 0) {
        await useBossStore.getState().attackActiveBoss(user.id, -15, 'nutrition');
      }
      triggerFeedback(l('Refeição do cardápio removida do dia.', 'Meal plan removed from today.'));
      return;
    }

    const { error } = await supabase.from('food_logs').delete().eq('id', logId).eq('user_id', user.id);
    if (error) {
      setDataError(error.message);
      return;
    }
    setLogs((current) => current.filter((log) => log.id !== logId));
    triggerFeedback(l('Alimento removido do diário.', 'Food removed from diary.'));

    if (targetLog?.source === 'ai' && targetLog.food_id) {
      const { count } = await supabase
        .from('food_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('food_id', targetLog.food_id);

      if ((count ?? 0) === 0) {
        await supabase.from('foods').delete().eq('id', targetLog.food_id).eq('created_by', user.id);
      }
    }
  }

  async function handleUseMealPlan(plan: MealPlan) {
    if (!user || !plan.items?.length) return;
    setMealPlanFeedback(null);

    const today = localDateString();
    const { data: existingCompletion, error: lookupError } = await supabase
      .from('meal_completions')
      .select('id')
      .eq('user_id', user.id)
      .eq('meal_plan_id', plan.id)
      .eq('completed_at', today)
      .maybeSingle();

    if (lookupError) {
      setDataError(lookupError.message);
      return;
    }

    if (existingCompletion) {
      const { data: syncedItems, error: syncedItemsError } = await supabase
        .from('food_logs')
        .select('meal_plan_item_id')
        .eq('user_id', user.id)
        .eq('meal_completion_id', existingCompletion.id);

      if (syncedItemsError) {
        setDataError(syncedItemsError.message);
        return;
      }

      const syncedItemIds = new Set(
        (syncedItems ?? []).map((log) => log.meal_plan_item_id).filter(Boolean),
      );
      const missingItems = plan.items.filter((item) => !syncedItemIds.has(item.id));

      if (missingItems.length > 0) {
        const { error: repairError } = await supabase.from('food_logs').insert(
          missingItems.map((item) => ({
            user_id: user.id,
            food_id: item.food_id,
            quantity_grams: item.quantity_grams,
            meal_type: plan.name,
            source: 'meal_plan',
            meal_plan_id: plan.id,
            meal_plan_item_id: item.id,
            meal_completion_id: existingCompletion.id,
          })),
        );

        if (repairError && repairError.code !== '23505') {
          setDataError(repairError.message);
          return;
        }
      }

      setMealPlanFeedback(`${plan.name} já está contabilizado e sincronizado no diário de hoje.`);
      await fetchData();
      return;
    }

    const { data: completion, error: completionError } = await supabase
      .from('meal_completions')
      .insert({
        user_id: user.id,
        meal_plan_id: plan.id,
        completed_at: today,
      })
      .select('id')
      .single();

    if (completionError || !completion) {
      setDataError(completionError?.message ?? 'Não foi possível concluir a refeição.');
      return;
    }

    const { error: logError } = await supabase.from('food_logs').insert(
      plan.items.map((item) => ({
        user_id: user.id,
        food_id: item.food_id,
        quantity_grams: item.quantity_grams,
        meal_type: plan.name,
        source: 'meal_plan',
        meal_plan_id: plan.id,
        meal_plan_item_id: item.id,
        meal_completion_id: completion.id,
      })),
    );

    if (logError) {
      await supabase.from('meal_completions').delete().eq('id', completion.id);
      setDataError(logError.message);
      return;
    }

    await useBossStore.getState().attackActiveBoss(user.id, 15, 'nutrition');
    setMealPlanFeedback(`${plan.name} foi concluído e adicionado ao diário de hoje.`);
    await fetchData();
  }

  async function handleCreateFood() {
    if (!user || !newFoodName) return;

    try {
      const { data: created, error } = await supabase
        .from('foods')
        .insert({
          name: newFoodName,
          calories_per_100g: newFoodCals,
          protein_per_100g: newFoodProtein,
          carbs_per_100g: newFoodCarbs,
          fat_per_100g: newFoodFat,
          category: newFoodCategory,
          is_custom: true,
          created_by: user.id,
          serving_size: newFoodServingSize || null,
          serving_unit: newFoodServingUnit || null,
        })
        .select('*')
        .single();

      if (error) throw error;

      setIsNewFoodModalOpen(false);
      setNewFoodName('');
      setNewFoodCals(0);
      setNewFoodProtein(0);
      setNewFoodCarbs(0);
      setNewFoodFat(0);
      setNewFoodServingSize(undefined);
      setNewFoodServingUnit('');
      await fetchData();
      if (created) {
        setSelectedFood(created as Food);
        setQuantity(created.serving_unit && created.serving_size ? 1 : 100);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error('Error creating food:', err);
    }
  }

  async function handleAnalyzeMealIa() {
    if (!user) return;
    if (!iaTextInput.trim()) {
      setIaError(
        l(
          'Descreva os alimentos e quantidades para calcular via Tabela TACO.',
          'Describe the foods and quantities to calculate via the TACO table.',
        ),
      );
      return;
    }

    setIaLoading(true);
    setIaError(null);
    setIaPreview(null);
    setIaEditing(false);
    setIaRegistrationSuccess(null);
    setExpandedIaIngs(new Set());

    try {
      setIaPreview(analyzeNutritionText(iaTextInput, foods, language));
    } catch (err: unknown) {
      console.error('[Calculadora TACO] Erro ao processar:', err);
      setIaError(
        err instanceof Error
          ? isEnglish
            ? translateUiText(err.message)
            : err.message
          : l(
              'Não foi possível calcular os alimentos informados. Verifique a descrição.',
              'Could not calculate the foods provided. Check your description.',
            ),
      );
    } finally {
      setIaLoading(false);
    }
  }

  async function handleRegisterIaMeal() {
    if (!user || !iaPreview) return;
    setIaRegistering(true);
    setIaError(null);

    try {
      const scaleFactor = 100 / iaPreview.totalGrams;
      const { data: food, error: foodError } = await supabase
        .from('foods')
        .insert({
          name: iaPreview.mealName,
          calories_per_100g: Math.round(iaPreview.calories * scaleFactor),
          protein_per_100g: Number((iaPreview.protein * scaleFactor).toFixed(1)),
          carbs_per_100g: Number((iaPreview.carbs * scaleFactor).toFixed(1)),
          fat_per_100g: Number((iaPreview.fat * scaleFactor).toFixed(1)),
          category: 'Outros',
          is_custom: true,
          created_by: user.id,
        })
        .select()
        .single();

      if (foodError) throw foodError;

      const { error: logError } = await supabase.from('food_logs').insert({
        user_id: user.id,
        food_id: food.id,
        quantity_grams: iaPreview.totalGrams,
        meal_type: iaMealType,
        source: 'ai',
      });

      if (logError) {
        await supabase.from('foods').delete().eq('id', food.id).eq('created_by', user.id);
        throw logError;
      }

      setIaRegistrationSuccess(
        l(`${iaPreview.mealName} foi registrado no diário.`, `${iaPreview.mealName} was saved to the diary.`),
      );
      triggerFeedback(
        l(`${iaPreview.mealName} registrado em ${iaMealType}.`, `${iaPreview.mealName} logged to ${tx(iaMealType)}.`),
      );
      setIaPreview(null);
      setIaEditing(false);
      setIaTextInput('');
      await fetchData();
    } catch (err: unknown) {
      console.error('[Calculadora TACO] Erro ao registrar:', err);
      setIaError(
        err instanceof Error
          ? isEnglish
            ? translateUiText(err.message)
            : err.message
          : l('Não foi possível registrar a refeição. Tente novamente.', 'The meal could not be logged. Try again.'),
      );
    } finally {
      setIaRegistering(false);
    }
  }

  const filteredFoods = foods.filter((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const modalFilteredFoods = foods
    .filter((f) => f.name.toLowerCase().includes(modalFoodSearch.toLowerCase()))
    .slice(0, 20);

  const dailyMacros = logs.reduce(
    (acc, log) => {
      const food = foodFromLog(log);
      if (!food) return acc;
      const ratio = log.quantity_grams / 100;
      return {
        kcal: acc.kcal + (Number(food.calories_per_100g) || 0) * ratio,
        protein: acc.protein + (Number(food.protein_per_100g) || 0) * ratio,
        carbs: acc.carbs + (Number(food.carbs_per_100g) || 0) * ratio,
        fat: acc.fat + (Number(food.fat_per_100g) || 0) * ratio,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const nutritionTargets = calculateNutritionTargets({
    birthday: hunterProfile.birthday,
    gender: hunterProfile.gender,
    height: hunterProfile.height,
    weightCurrent: hunterProfile.weightCurrent,
    nutritionGoal: hunterProfile.nutritionGoal,
  });
  const remainingCalories = nutritionTargets.targetCalories
    ? Math.max(0, nutritionTargets.targetCalories - dailyMacros.kcal)
    : null;
  const calorieProgress = nutritionTargets.targetCalories
    ? Math.min(100, Math.round((dailyMacros.kcal / nutritionTargets.targetCalories) * 100))
    : 0;
  const macroTargets = nutritionTargets.targetCalories
    ? {
        protein: (nutritionTargets.targetCalories * 0.25) / 4,
        carbs: (nutritionTargets.targetCalories * 0.45) / 4,
        fat: (nutritionTargets.targetCalories * 0.3) / 9,
      }
    : { protein: null, carbs: null, fat: null };

  const calorieStatus: NutritionStatus =
    !nutritionTargets.minCalories || !nutritionTargets.maxCalories
      ? 'low'
      : dailyMacros.kcal < nutritionTargets.minCalories
        ? 'low'
        : dailyMacros.kcal <= nutritionTargets.maxCalories
          ? 'ideal'
          : 'exceeded';
  const isInsideRecommendedRange = calorieStatus === 'ideal';
  const projectedNutritionXp = 35;
  const localizedGoalLabel = l(
    nutritionTargets.goalLabel,
    nutritionTargets.goal === 'lose'
      ? 'Lose weight'
      : nutritionTargets.goal === 'gain'
        ? 'Gain weight'
        : 'Maintain weight',
  );
  const missingProfileFields = nutritionTargets.missingFields.length
    ? nutritionTargets.missingFields.map((field) => tx(field)).join(', ')
    : l('dados físicos', 'physical data');

  // Build Meal Slots for Today's Meals (4 core slots + any extra custom meal types logged today)
  const extraMealTypes = Array.from(
    new Set(
      logs
        .map((log) => log.meal_type)
        .filter((mt) => !DEFAULT_MEAL_SLOTS.some((slot) => slot.id === mt)),
    ),
  );

  const allMealSlots = [
    ...DEFAULT_MEAL_SLOTS,
    ...extraMealTypes.map((mt) => ({
      id: mt,
      pt: mt,
      en: tx(mt) || mt,
      icon: UtensilsCrossed,
    })),
  ];

  const openAddFoodForMeal = (targetMealType?: string, preselectedFood?: Food | null) => {
    if (targetMealType) {
      setMealType(targetMealType);
    }
    setEditingLogId(null);
    if (preselectedFood) {
      setSelectedFood(preselectedFood);
      setQuantity(preselectedFood.serving_unit && preselectedFood.serving_size ? 1 : 100);
    } else {
      setSelectedFood(null);
      setQuantity(100);
      setModalFoodSearch('');
    }
    setIsModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-24">
      {/* HUD v2 Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
            <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">
              {t('nutrition.eyebrow')}
            </span>
          </div>
          <h1 className="mt-0.5 truncate font-orbitron text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
            {t('nutrition.title')}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <RankBadge
            rank={hunterProfile.rank as 'E' | 'D' | 'C' | 'B' | 'A' | 'S'}
            size="sm"
            showLabel={false}
          />
          <TacticalButton
            variant="secondary"
            accent="cyan"
            leftIcon={<Plus className="size-3.5" />}
            onClick={() => setIsNewFoodModalOpen(true)}
          >
            {l('Novo Alimento', 'New Food')}
          </TacticalButton>
        </div>
      </div>

      {/* Main Navigation Tabs (Diário / Cardápios) */}
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-white/10 bg-[#0D0F18]/90 p-1.5 backdrop-blur-md">
        {[
          { id: 'diario' as const, label: t('nutrition.diary'), icon: BookOpen },
          { id: 'cardapios' as const, label: t('nutrition.mealPlans'), icon: UtensilsCrossed },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-3 py-2 font-orbitron text-xs font-black uppercase tracking-wider transition-all',
                isActive
                  ? 'border-cyan-400/45 bg-cyan-500/15 text-cyan-200 shadow-[0_0_16px_rgba(0,240,255,0.14)]'
                  : 'border-transparent bg-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200',
              )}
            >
              <tab.icon className={cn('size-4', isActive ? 'text-cyan-300' : 'text-slate-400')} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Save Feedback Toast Banner */}
      <AnimatePresence>
        {saveFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <HudCard variant="success" className="p-3.5">
              <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-200">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                <span>{saveFeedback}</span>
              </div>
            </HudCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 2: CARDÁPIOS (MEAL PLANS) */}
      {activeTab === 'cardapios' && (
        <NutritionMealPlans foods={foods} onUsePlan={handleUseMealPlan} feedback={mealPlanFeedback} />
      )}

      {/* TAB 1: DIÁRIO NUTRICIONAL */}
      {activeTab === 'diario' && (
        <div className="space-y-5">
          {dataError && (
            <HudCard variant="crimson" className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold text-rose-200">
                  <span className="font-orbitron font-black uppercase tracking-wider text-rose-400">
                    {l('Aviso: ', 'Notice: ')}
                  </span>
                  {dataError}
                </p>
                <button
                  type="button"
                  onClick={() => setDataError(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            </HudCard>
          )}

          {/* 2. PAINEL NUTRICIONAL PRINCIPAL (Ref: ascend-nutrition.jpg) */}
          <HudCard variant="cyan" corners radialGlow className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target className="size-4 text-cyan-400" />
                <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
                  {l('BALANÇO CALÓRICO DIÁRIO', 'DAILY CALORIE BALANCE')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                  +{projectedNutritionXp} XP · +2 VIT
                </span>
                {nutritionStreak > 0 && (
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                    {nutritionStreak}d streak
                  </span>
                )}
              </div>
            </div>

            {/* Circular Progress Ring (Centered & Contained) */}
            <div className="my-5 flex flex-col items-center justify-center">
              <NeonProgressRing
                value={calorieProgress}
                max={100}
                size={196}
                strokeWidth={12}
                variant="cyan-purple"
                ariaLabel={l('Progresso da meta calórica', 'Calorie goal progress')}
              >
                <div className="flex max-w-[144px] flex-col items-center justify-center text-center leading-none">
                  {nutritionTargets.targetCalories ? (
                    dailyMacros.kcal <= nutritionTargets.targetCalories ? (
                      <>
                        <div className="flex items-baseline justify-center gap-1 whitespace-nowrap">
                          <span className="font-orbitron text-2xl font-black tracking-tight text-white sm:text-3xl">
                            {Math.round(remainingCalories ?? 0).toLocaleString(language)}
                          </span>
                          <span className="text-[11px] font-bold uppercase text-cyan-300">kcal</span>
                        </div>
                        <span className="mt-1.5 text-[11px] font-semibold text-slate-400">
                          {l('kcal restantes', 'kcal remaining')}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline justify-center gap-1 whitespace-nowrap">
                          <span className="font-orbitron text-2xl font-black tracking-tight text-amber-300 sm:text-3xl">
                            +{Math.round(dailyMacros.kcal - nutritionTargets.targetCalories).toLocaleString(language)}
                          </span>
                          <span className="text-[11px] font-bold uppercase text-amber-300">kcal</span>
                        </div>
                        <span className="mt-1.5 text-[11px] font-semibold text-amber-200/80">
                          {l('acima da meta', 'over target')}
                        </span>
                      </>
                    )
                  ) : (
                    <>
                      <div className="flex items-baseline justify-center gap-1 whitespace-nowrap">
                        <span className="font-orbitron text-2xl font-black tracking-tight text-white sm:text-3xl">
                          {Math.round(dailyMacros.kcal).toLocaleString(language)}
                        </span>
                        <span className="text-[11px] font-bold uppercase text-cyan-300">kcal</span>
                      </div>
                      <span className="mt-1.5 text-[11px] font-semibold text-slate-400">
                        {l('kcal consumidas', 'kcal consumed')}
                      </span>
                    </>
                  )}
                  <span className="mt-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                    {calorieProgress}% {l('da meta', 'of goal')}
                  </span>
                </div>
              </NeonProgressRing>
            </div>

            {/* 3-Column Calorie Summary Strip */}
            <div className="grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-[#080A11]/90 p-3 text-center">
              <div className="px-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {l('Consumido', 'Consumed')}
                </p>
                <p className="mt-0.5 font-orbitron text-sm font-black text-white sm:text-base">
                  {Math.round(dailyMacros.kcal)}{' '}
                  <span className="text-[10px] font-normal text-slate-400">kcal</span>
                </p>
              </div>
              <div className="px-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {l('Meta Diária', 'Daily Goal')}
                </p>
                <p className="mt-0.5 font-orbitron text-sm font-black text-cyan-300 sm:text-base">
                  {nutritionTargets.targetCalories ?? '--'}{' '}
                  <span className="text-[10px] font-normal text-slate-400">kcal</span>
                </p>
              </div>
              <div className="px-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {l('Objetivo', 'Objective')}
                </p>
                <p className="mt-0.5 truncate font-orbitron text-xs font-black uppercase text-purple-300 sm:text-sm">
                  {localizedGoalLabel}
                </p>
              </div>
            </div>

            {/* Calibration or Exceeded Notice */}
            {!nutritionTargets.targetCalories && (
              <p className="mt-3 text-center text-xs text-slate-400">
                {l(
                  `Complete no perfil (${missingProfileFields}) para calibrar sua meta calórica diária.`,
                  `Complete in your profile (${missingProfileFields}) to calibrate your daily calorie target.`,
                )}
              </p>
            )}

            {calorieStatus === 'exceeded' && nutritionTargets.maxCalories && (
              <div
                role="alert"
                className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-rose-500/35 bg-rose-500/10 p-3 text-xs text-rose-200"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-400" />
                <p className="leading-relaxed">
                  {language === 'en-US' ? (
                    <>
                      <strong className="font-orbitron uppercase text-rose-300">{t('nutrition.exceeded')}:</strong>{' '}
                      You consumed <strong>{Math.round(dailyMacros.kcal)} kcal</strong>, exceeding the recommended
                      limit of <strong>{nutritionTargets.maxCalories} kcal</strong>.
                    </>
                  ) : (
                    <>
                      <strong className="font-orbitron uppercase text-rose-300">{t('nutrition.exceeded')}:</strong>{' '}
                      Você consumiu <strong>{Math.round(dailyMacros.kcal)} kcal</strong>, ultrapassando o limite
                      recomendado de <strong>{nutritionTargets.maxCalories} kcal</strong>.
                    </>
                  )}
                </p>
              </div>
            )}
          </HudCard>

          {/* 3. MACRONUTRIENTES (Compact Horizontal Summary Card — Ref: ascend-nutrition.jpg) */}
          <HudCard variant="default" className="p-3.5 sm:p-4">
            <div className="grid grid-cols-3 divide-x divide-white/10">
              {/* Protein */}
              <div className="pr-2.5 sm:pr-4">
                <div className="flex items-center gap-1.5">
                  <Zap className="size-3.5 shrink-0 text-purple-400" />
                  <span className="truncate font-orbitron text-[10px] font-black uppercase tracking-wider text-slate-200 sm:text-xs">
                    {l('Proteína', 'Protein')}
                  </span>
                </div>
                <div className="my-2">
                  <NeonProgressBar
                    value={dailyMacros.protein}
                    max={macroTargets.protein || 100}
                    variant="xp"
                    size="sm"
                  />
                </div>
                <p className="font-mono text-xs font-bold text-white sm:text-sm">
                  {Math.round(dailyMacros.protein)}
                  <span className="text-[11px] font-normal text-slate-400">
                    {' '}
                    / {macroTargets.protein ? `${Math.round(macroTargets.protein)}g` : '--g'}
                  </span>
                </p>
              </div>

              {/* Carbs */}
              <div className="px-2.5 sm:px-4">
                <div className="flex items-center gap-1.5">
                  <Apple className="size-3.5 shrink-0 text-cyan-400" />
                  <span className="truncate font-orbitron text-[10px] font-black uppercase tracking-wider text-slate-200 sm:text-xs">
                    {l('Carbos', 'Carbs')}
                  </span>
                </div>
                <div className="my-2">
                  <NeonProgressBar
                    value={dailyMacros.carbs}
                    max={macroTargets.carbs || 100}
                    variant="cyan"
                    size="sm"
                  />
                </div>
                <p className="font-mono text-xs font-bold text-white sm:text-sm">
                  {Math.round(dailyMacros.carbs)}
                  <span className="text-[11px] font-normal text-slate-400">
                    {' '}
                    / {macroTargets.carbs ? `${Math.round(macroTargets.carbs)}g` : '--g'}
                  </span>
                </p>
              </div>

              {/* Fats */}
              <div className="pl-2.5 sm:pl-4">
                <div className="flex items-center gap-1.5">
                  <Droplets className="size-3.5 shrink-0 text-amber-400" />
                  <span className="truncate font-orbitron text-[10px] font-black uppercase tracking-wider text-slate-200 sm:text-xs">
                    {l('Gorduras', 'Fats')}
                  </span>
                </div>
                <div className="my-2">
                  <NeonProgressBar
                    value={dailyMacros.fat}
                    max={macroTargets.fat || 100}
                    variant="neutral"
                    size="sm"
                  />
                </div>
                <p className="font-mono text-xs font-bold text-white sm:text-sm">
                  {Math.round(dailyMacros.fat)}
                  <span className="text-[11px] font-normal text-slate-400">
                    {' '}
                    / {macroTargets.fat ? `${Math.round(macroTargets.fat)}g` : '--g'}
                  </span>
                </p>
              </div>
            </div>
          </HudCard>

          {/* 4. REFEIÇÕES DO DIA (TODAY'S MEALS — Ref: ascend-nutrition.jpg) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-orbitron text-xs font-black uppercase tracking-[0.18em] text-slate-200 sm:text-sm">
                {l('REFEIÇÕES DE HOJE', "TODAY'S MEALS")}
              </h2>
              <span className="font-mono text-[11px] font-semibold text-slate-400">
                {logs.length} {logs.length === 1 ? l('registro hoje', 'item logged') : l('registros hoje', 'items logged')}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {allMealSlots.map((slot) => {
                const SlotIcon = slot.icon;
                const slotLogs = logs.filter((log) => log.meal_type === slot.id);
                const slotKcal = slotLogs.reduce((sum, log) => {
                  const food = foodFromLog(log);
                  return sum + ((Number(food?.calories_per_100g) || 0) * log.quantity_grams) / 100;
                }, 0);
                const hasLogs = slotLogs.length > 0;
                const isExpanded = expandedMealCategory === slot.id;

                return (
                  <HudCard
                    key={slot.id}
                    variant={hasLogs ? 'cyan' : 'default'}
                    className="overflow-hidden p-0"
                  >
                    <div className="flex items-center justify-between gap-2 p-3.5 sm:p-4">
                      <button
                        type="button"
                        onClick={() =>
                          hasLogs
                            ? setExpandedMealCategory((prev) => (prev === slot.id ? null : slot.id))
                            : openAddFoodForMeal(slot.id)
                        }
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div
                          className={cn(
                            'flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors',
                            hasLogs
                              ? 'border-cyan-400/35 bg-cyan-500/15 text-cyan-300'
                              : 'border-white/10 bg-[#090B12] text-slate-400',
                          )}
                        >
                          <SlotIcon className="size-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="truncate font-orbitron text-xs font-black uppercase text-white sm:text-sm">
                              {isEnglish ? slot.en : slot.pt}
                            </h3>
                            {hasLogs && (
                              <span className="inline-block size-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            )}
                          </div>
                          <p className="mt-0.5 font-mono text-xs font-semibold text-slate-300">
                            {hasLogs ? (
                              <>
                                <strong className="text-cyan-300">{Math.round(slotKcal)} kcal</strong> ·{' '}
                                <span className="text-slate-400">
                                  {slotLogs.length} {slotLogs.length === 1 ? l('item', 'item') : l('itens', 'items')}
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-500">{l('0 kcal · Adicionar', '0 kcal · Add food')}</span>
                            )}
                          </p>
                        </div>
                      </button>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {hasLogs && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedMealCategory((prev) => (prev === slot.id ? null : slot.id))
                            }
                            aria-label={l('Ver alimentos da refeição', 'View meal foods')}
                            className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:text-white"
                          >
                            <ChevronDown
                              className={cn('size-4 transition-transform', isExpanded && 'rotate-180 text-cyan-300')}
                            />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openAddFoodForMeal(slot.id)}
                          aria-label={l(`Adicionar alimento em ${slot.pt}`, `Add food to ${slot.en}`)}
                          className="flex size-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-200 transition-colors hover:bg-cyan-500/25 hover:text-white"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Meal Items Details */}
                    <AnimatePresence initial={false}>
                      {isExpanded && hasLogs && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-white/10 bg-[#080A11]"
                        >
                          <div className="divide-y divide-white/[0.06] p-3">
                            {slotLogs.map((log) => {
                              const food = foodFromLog(log);
                              const isCustom = !!food?.serving_unit && !!food?.serving_size;
                              const displayQty =
                                isCustom && food
                                  ? Number(gramsToQuantity(food, log.quantity_grams).toFixed(2))
                                  : log.quantity_grams;
                              const displayUnit = isCustom ? food?.serving_unit : 'g';
                              const ratio = log.quantity_grams / 100;
                              const kcal = (Number(food?.calories_per_100g) || 0) * ratio;
                              const protein = (Number(food?.protein_per_100g) || 0) * ratio;
                              const carbs = (Number(food?.carbs_per_100g) || 0) * ratio;
                              const fat = (Number(food?.fat_per_100g) || 0) * ratio;

                              return (
                                <div key={log.id} className="py-2.5 first:pt-0 last:pb-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-xs font-bold uppercase text-white">
                                        {tx(food?.name) || l('Alimento', 'Food')}
                                      </p>
                                      <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                                        {displayQty}
                                        {displayUnit} · <strong className="text-cyan-300">{Math.round(kcal)} kcal</strong>{' '}
                                        · P:{protein.toFixed(1)}g C:{carbs.toFixed(1)}g G:{fat.toFixed(1)}g
                                      </p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleEditLog(log)}
                                        aria-label={l('Editar registro', 'Edit log')}
                                        className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-400/40 hover:text-white"
                                      >
                                        <Edit3 className="size-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void handleDeleteLog(log.id)}
                                        aria-label={l('Remover registro', 'Remove log')}
                                        className="flex size-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </HudCard>
                );
              })}
            </div>

            {/* Primary CTA Button (+ ADD FOOD — Ref: ascend-nutrition.jpg) */}
            <div className="pt-1">
              <TacticalButton
                variant="primary"
                fullWidth
                displayFont
                leftIcon={<Plus className="size-4" />}
                onClick={() => openAddFoodForMeal()}
              >
                {l('+ ADICIONAR ALIMENTO', '+ ADD FOOD')}
              </TacticalButton>
            </div>
          </div>

          {/* 5. BASE DE ALIMENTOS & CALCULADORA TACO */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1.5 rounded-xl border border-white/10 bg-[#0D0F18] p-1">
                <button
                  type="button"
                  onClick={() => setSubTab('library')}
                  className={cn(
                    'flex min-h-[40px] items-center gap-2 rounded-lg px-3.5 py-1.5 font-orbitron text-[10px] font-black uppercase tracking-wider transition-all',
                    subTab === 'library'
                      ? 'border border-cyan-400/40 bg-cyan-500/15 text-cyan-200'
                      : 'text-slate-400 hover:text-white',
                  )}
                >
                  <BookOpen className="size-3.5" />
                  {t('nutrition.library')}
                </button>
                <button
                  type="button"
                  onClick={() => setSubTab('codex')}
                  className={cn(
                    'flex min-h-[40px] items-center gap-2 rounded-lg px-3.5 py-1.5 font-orbitron text-[10px] font-black uppercase tracking-wider transition-all',
                    subTab === 'codex'
                      ? 'border border-purple-400/40 bg-purple-500/15 text-purple-200'
                      : 'text-slate-400 hover:text-white',
                  )}
                >
                  <Calculator className="size-3.5" />
                  {l('Calculadora TACO', 'TACO Calculator')}
                </button>
              </div>
            </div>

            {/* SubTab A: Biblioteca de Alimentos (Manual Search & Selection) */}
            {subTab === 'library' && (
              <div className="space-y-3.5">
                <HudCard variant="default" className="p-3.5">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder={l('Buscar alimento no catálogo...', 'Search food in catalog...')}
                        className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#090B12] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#090B12] p-1">
                      <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        aria-label={l('Grade', 'Grid')}
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
                        aria-label={l('Lista compacta', 'Compact list')}
                        className={cn(
                          'flex size-9 items-center justify-center rounded-lg transition-colors',
                          viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white',
                        )}
                      >
                        <TableIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                </HudCard>

                {loading ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array(6)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="h-24 animate-pulse rounded-2xl border border-white/10 bg-[#12131C]/80"
                        />
                      ))}
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredFoods.map((food) => (
                      <HudCard
                        key={food.id}
                        variant="default"
                        className="cursor-pointer p-4 transition-colors hover:border-cyan-400/40"
                        onClick={() => openAddFoodForMeal(mealType, food)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-300">
                              <Apple className="size-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate font-orbitron text-xs font-black uppercase text-white sm:text-sm">
                                {tx(food.name)}
                              </h3>
                              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                                {tx(food.category)} · P:{food.protein_per_100g}g C:{food.carbs_per_100g}g G:
                                {food.fat_per_100g}g
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-2 py-1 font-mono text-xs font-bold text-cyan-200">
                            {food.calories_per_100g} kcal
                          </span>
                        </div>
                      </HudCard>
                    ))}
                    {filteredFoods.length === 0 && (
                      <HudCard variant="default" className="col-span-full p-8 text-center">
                        <p className="font-orbitron text-xs font-black uppercase text-white">
                          {l('Nenhum alimento encontrado', 'No food found')}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {l(
                            'Cadastre um novo alimento personalizado ou utilize a Calculadora TACO.',
                            'Register a new custom food or use the TACO Calculator.',
                          )}
                        </p>
                      </HudCard>
                    )}
                  </div>
                ) : (
                  /* Responsive Compact List (No horizontal scroll on mobile) */
                  <div className="space-y-2">
                    {filteredFoods.map((food) => (
                      <HudCard
                        key={food.id}
                        variant="default"
                        className="cursor-pointer p-3 transition-colors hover:border-cyan-400/40"
                        onClick={() => openAddFoodForMeal(mealType, food)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-orbitron text-xs font-black uppercase text-white">
                              {tx(food.name)}
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] font-semibold text-slate-400">
                              {tx(food.category)} · P:{food.protein_per_100g}g · C:{food.carbs_per_100g}g · G:
                              {food.fat_per_100g}g
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="font-mono text-xs font-bold text-cyan-300">
                              {food.calories_per_100g} kcal
                            </span>
                            <ChevronRight className="size-4 text-slate-500" />
                          </div>
                        </div>
                      </HudCard>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SubTab B: Calculadora TACO por Texto (Deterministic Local Parser) */}
            {subTab === 'codex' && (
              <HudCard variant="purple" corners className="space-y-4 p-4 sm:p-6">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">
                      {l('TABELA TACO & CATÁLOGO LOCAL', 'TACO TABLE & LOCAL CATALOG')}
                    </span>
                    <span className="rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      TACO
                    </span>
                  </div>
                  <h3 className="mt-1 font-orbitron text-base font-black uppercase text-white sm:text-lg">
                    {l('Calculadora de Refeição por Texto', 'Text Meal Calculator')}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    {l(
                      'Digite os alimentos e quantidades (ex: "150g de frango, 150g de arroz, 100g de feijão") para calcular calorias e macronutrientes pela Tabela TACO.',
                      'Enter foods and quantities (e.g. "150g chicken, 150g rice, 100g beans") to calculate calories and macros via the TACO table.',
                    )}
                  </p>
                </div>

                <div className="space-y-3">
                  <textarea
                    value={iaTextInput}
                    onChange={(e) => setIaTextInput(e.target.value)}
                    placeholder={l(
                      'Ex: 150g de filé de frango, 200g de arroz integral, 100g de feijão carioca...',
                      'Ex: 150g grilled chicken, 200g brown rice, 100g beans...',
                    )}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-[#090B12] p-3.5 text-sm leading-relaxed text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none"
                  />

                  <div className="flex flex-wrap gap-1.5">
                    {NUTRITION_PROMPTS.map((prompt) => (
                      <button
                        key={prompt.label['pt-BR']}
                        type="button"
                        onClick={() => setIaTextInput(prompt.text[language])}
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-purple-400/40 hover:text-white"
                      >
                        {prompt.label[language]}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <select
                      value={iaMealType}
                      onChange={(e) => setIaMealType(e.target.value)}
                      className="min-h-[48px] w-full rounded-xl border border-white/10 bg-[#090B12] px-3.5 py-2.5 text-xs font-bold text-white focus:border-purple-400 focus:outline-none"
                    >
                      <option value="Café da Manhã">{l('Café da Manhã', 'Breakfast')}</option>
                      <option value="Almoço">{l('Almoço', 'Lunch')}</option>
                      <option value="Lanche">{l('Lanche', 'Snack')}</option>
                      <option value="Jantar">{l('Jantar', 'Dinner')}</option>
                    </select>

                    <TacticalButton
                      variant="primary"
                      fullWidth
                      displayFont
                      disabled={iaLoading}
                      leftIcon={<Calculator className="size-4" />}
                      onClick={handleAnalyzeMealIa}
                    >
                      {iaLoading ? l('Calculando...', 'Calculating...') : l('Calcular Nutrientes', 'Calculate Nutrients')}
                    </TacticalButton>
                  </div>
                </div>

                {iaError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                    {iaError}
                  </div>
                )}

                {iaRegistrationSuccess && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-200">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                    {iaRegistrationSuccess}
                  </div>
                )}

                {iaPreview && (
                  <div className="space-y-4 rounded-2xl border border-purple-400/30 bg-[#080A11] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-orbitron text-[10px] font-black uppercase tracking-widest text-purple-300">
                          {l('Resultado do Cálculo TACO', 'TACO Calculation Result')}
                        </span>
                        {iaEditing ? (
                          <input
                            value={iaPreview.mealName}
                            onChange={(event) =>
                              setIaPreview((current) =>
                                current ? { ...current, mealName: event.target.value } : current,
                              )
                            }
                            className="mt-1.5 w-full rounded-lg border border-purple-400/40 bg-black/60 px-3 py-2 text-sm font-bold text-white focus:outline-none"
                            aria-label={l('Nome da refeição', 'Meal name')}
                          />
                        ) : (
                          <h4 className="mt-1 font-orbitron text-sm font-black uppercase text-white">
                            {iaPreview.mealName}
                          </h4>
                        )}
                      </div>
                      <span className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-bold text-emerald-300">
                        {iaPreview.confidence}% TACO
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {[
                        { key: 'calories' as const, label: l('Energia', 'Energy'), unit: 'kcal', tone: 'text-cyan-300' },
                        { key: 'protein' as const, label: l('Proteína', 'Protein'), unit: 'g', tone: 'text-purple-300' },
                        { key: 'carbs' as const, label: l('Carbos', 'Carbs'), unit: 'g', tone: 'text-emerald-300' },
                        { key: 'fat' as const, label: l('Gorduras', 'Fat'), unit: 'g', tone: 'text-amber-300' },
                        { key: 'totalGrams' as const, label: l('Peso', 'Weight'), unit: 'g', tone: 'text-slate-200' },
                      ].map((metric) => (
                        <div key={metric.key} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5">
                          <p className="text-[10px] font-bold uppercase text-slate-400">{metric.label}</p>
                          {iaEditing ? (
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0"
                              value={iaPreview[metric.key]}
                              onChange={(event) =>
                                setIaPreview((current) =>
                                  current
                                    ? {
                                        ...current,
                                        [metric.key]: Math.max(0, Number(event.target.value)),
                                      }
                                    : current,
                                )
                              }
                              className={cn(
                                'mt-1 w-full rounded border border-white/15 bg-black px-2 py-1 font-mono text-xs font-bold focus:outline-none',
                                metric.tone,
                              )}
                            />
                          ) : (
                            <p className={cn('mt-1 font-mono text-sm font-black', metric.tone)}>
                              {iaPreview[metric.key]} <span className="text-[10px]">{metric.unit}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Ingredients List (Responsive without horizontal table scroll) */}
                    <div className="space-y-2">
                      {iaPreview.ingredients.map((ing, idx) => (
                        <div
                          key={idx}
                          className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]"
                        >
                          <button
                            type="button"
                            onClick={() => toggleIaIngExpanded(idx)}
                            className="flex w-full items-center justify-between gap-2 p-3 text-left"
                          >
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white">{ing.name}</span>
                              <span className="ml-1.5 font-mono text-[11px] text-slate-400">({ing.grams}g)</span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="rounded border border-purple-400/30 bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-purple-300">
                                {ing.final.source_used === 'taco'
                                  ? 'TACO'
                                  : ing.final.source_used === 'catalog'
                                    ? l('Catálogo', 'Catalog')
                                    : l('Estimativa', 'Estimate')}
                              </span>
                              <ChevronDown
                                className={cn(
                                  'size-4 text-slate-400 transition-transform',
                                  expandedIaIngs.has(idx) && 'rotate-180',
                                )}
                              />
                            </div>
                          </button>

                          {expandedIaIngs.has(idx) && (
                            <div className="grid grid-cols-1 gap-2 border-t border-white/5 bg-black/40 p-3 text-xs sm:grid-cols-3">
                              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                                <p className="font-bold text-purple-300">TACO (100g)</p>
                                <p className="mt-0.5 font-mono text-[11px] text-slate-300">
                                  {ing.taco.found
                                    ? `${ing.taco.kcal}kcal · P:${ing.taco.protein}g C:${ing.taco.carbs}g G:${ing.taco.fat}g`
                                    : l('Não encontrado', 'Not found')}
                                </p>
                              </div>
                              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                                <p className="font-bold text-cyan-300">{l('Catálogo (100g)', 'Catalog (100g)')}</p>
                                <p className="mt-0.5 font-mono text-[11px] text-slate-300">
                                  {ing.catalog.found
                                    ? `${ing.catalog.kcal}kcal · P:${ing.catalog.protein}g C:${ing.catalog.carbs}g G:${ing.catalog.fat}g`
                                    : l('Não encontrado', 'Not found')}
                                </p>
                              </div>
                              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                                <p className="font-bold text-amber-300">{l('Estimativa (100g)', 'Estimate (100g)')}</p>
                                <p className="mt-0.5 font-mono text-[11px] text-slate-300">
                                  {`${ing.estimate.kcal}kcal · P:${ing.estimate.protein}g C:${ing.estimate.carbs}g G:${ing.estimate.fat}g`}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <TacticalButton
                        variant="secondary"
                        fullWidth
                        onClick={() => setIaEditing((current) => !current)}
                      >
                        {iaEditing ? l('Concluir Edição', 'Done Editing') : l('Ajustar Valores', 'Adjust Values')}
                      </TacticalButton>
                      <TacticalButton
                        variant="primary"
                        fullWidth
                        displayFont
                        disabled={iaRegistering || iaPreview.totalGrams <= 0 || !iaPreview.mealName.trim()}
                        onClick={() => void handleRegisterIaMeal()}
                      >
                        {iaRegistering ? l('Salvando...', 'Saving...') : l('Registrar no Diário', 'Save to Diary')}
                      </TacticalButton>
                    </div>
                  </div>
                )}
              </HudCard>
            )}
          </div>
        </div>
      )}

      {/* MODALS: MANUAL FOOD LOGGING & NEW FOOD CREATION */}
      <AnimatePresence>
        {/* 1. Manual Food Logging Modal / Bottom Sheet */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setEditingLogId(null);
              }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-cyan-400/35 bg-[#0D0F18] p-5 shadow-2xl sm:rounded-3xl sm:p-6"
            >
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingLogId(null);
                }}
                className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white"
                aria-label={l('Fechar registro alimentar', 'Close food log')}
              >
                <X className="size-5" />
              </button>

              <div className="flex items-center gap-3.5 pr-12">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-300">
                  <Apple className="size-6" />
                </div>
                <div className="min-w-0">
                  <span className="font-orbitron text-[10px] font-black uppercase tracking-widest text-cyan-400">
                    {editingLogId
                      ? l('EDITAR REGISTRO', 'EDIT RECORD')
                      : l('REGISTRO DE ALIMENTO', 'LOG FOOD')}
                  </span>
                  <h2 className="truncate font-orbitron text-base font-black uppercase text-white sm:text-lg">
                    {selectedFood ? tx(selectedFood.name) : l('Selecionar Alimento', 'Select Food')}
                  </h2>
                </div>
              </div>

              <div className="mt-5 flex-1 space-y-4 overflow-y-auto pr-0.5">
                {/* Meal Type Selector */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {l('Refeição do Dia', 'Meal Category')}
                  </label>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {DEFAULT_MEAL_SLOTS.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setMealType(slot.id)}
                        className={cn(
                          'min-h-[40px] rounded-xl border px-2.5 py-1.5 text-[10px] font-bold uppercase transition-all',
                          mealType === slot.id
                            ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200'
                            : 'border-white/10 bg-[#090B12] text-slate-400 hover:text-white',
                        )}
                      >
                        {isEnglish ? slot.en : slot.pt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 1: Pick Food if none selected yet */}
                {!selectedFood ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder={l('Buscar alimento por nome...', 'Search food by name...')}
                        value={modalFoodSearch}
                        onChange={(e) => setModalFoodSearch(e.target.value)}
                        autoFocus
                        className="min-h-[46px] w-full rounded-xl border border-white/10 bg-[#090B12] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>

                    <div className="max-h-64 space-y-1.5 overflow-y-auto">
                      {modalFilteredFoods.map((food) => (
                        <button
                          key={food.id}
                          type="button"
                          onClick={() => {
                            setSelectedFood(food);
                            setQuantity(food.serving_unit && food.serving_size ? 1 : 100);
                          }}
                          className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-[#090B12] px-3.5 py-2.5 text-left transition-colors hover:border-cyan-400/40"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold uppercase text-white">{tx(food.name)}</p>
                            <p className="text-[10px] text-slate-400">
                              P:{food.protein_per_100g}g · C:{food.carbs_per_100g}g · G:{food.fat_per_100g}g
                            </p>
                          </div>
                          <span className="shrink-0 font-mono text-xs font-bold text-cyan-300">
                            {food.calories_per_100g} kcal
                          </span>
                        </button>
                      ))}
                      {modalFilteredFoods.length === 0 && (
                        <div className="py-6 text-center">
                          <p className="text-xs text-slate-400">
                            {l('Alimento não encontrado no catálogo.', 'Food not found in catalog.')}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setIsModalOpen(false);
                              setNewFoodName(modalFoodSearch);
                              setIsNewFoodModalOpen(true);
                            }}
                            className="mt-2 text-xs font-bold uppercase text-cyan-400 hover:underline"
                          >
                            + {l('Cadastrar Novo Alimento', 'Create New Food')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Step 2: Quantity & Live Nutritional Preview */
                  <div className="space-y-4">
                    {!editingLogId && (
                      <button
                        type="button"
                        onClick={() => setSelectedFood(null)}
                        className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 hover:underline"
                      >
                        ← {l('Trocar alimento', 'Change food')}
                      </button>
                    )}

                    <div className="rounded-2xl border border-cyan-400/25 bg-[#090B12] p-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                          {l('Quantidade', 'Quantity')} (
                          {selectedFood.serving_unit ? tx(selectedFood.serving_unit) : l('Gramas', 'Grams')})
                        </label>
                        {!selectedFood.serving_unit && (
                          <div className="flex gap-1">
                            {[50, 100, 150, 200].map((presetG) => (
                              <button
                                key={presetG}
                                type="button"
                                onClick={() => setQuantity(presetG)}
                                className={cn(
                                  'rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold',
                                  quantity === presetG
                                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                                    : 'border-white/10 bg-white/5 text-slate-400',
                                )}
                              >
                                {presetG}g
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity((prev) =>
                              Math.max(
                                selectedFood.serving_unit ? 0.5 : 10,
                                Number((prev - (selectedFood.serving_unit ? 0.5 : 25)).toFixed(1)),
                              ),
                            )
                          }
                          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 font-mono text-base font-bold text-white"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0.1}
                          step={selectedFood.serving_unit ? '0.5' : '10'}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-center font-orbitron text-xl font-black text-white focus:border-cyan-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity((prev) =>
                              Number((prev + (selectedFood.serving_unit ? 0.5 : 25)).toFixed(1)),
                            )
                          }
                          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 font-mono text-base font-bold text-cyan-200"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Live Calculated Macros Preview */}
                    {(() => {
                      const grams = quantityToGrams(selectedFood, Math.max(0, quantity || 0));
                      const ratio = grams / 100;
                      const cals = Math.round((selectedFood.calories_per_100g || 0) * ratio);
                      const prot = ((selectedFood.protein_per_100g || 0) * ratio).toFixed(1);
                      const carb = ((selectedFood.carbs_per_100g || 0) * ratio).toFixed(1);
                      const fatVal = ((selectedFood.fat_per_100g || 0) * ratio).toFixed(1);

                      return (
                        <div className="grid grid-cols-4 divide-x divide-white/10 rounded-2xl border border-white/10 bg-[#090B12] p-3 text-center">
                          <div>
                            <p className="text-[9px] font-bold uppercase text-slate-400">Kcal</p>
                            <p className="mt-0.5 font-orbitron text-sm font-black text-cyan-300">{cals}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase text-slate-400">Prot</p>
                            <p className="mt-0.5 font-mono text-xs font-bold text-purple-300">{prot}g</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase text-slate-400">Carb</p>
                            <p className="mt-0.5 font-mono text-xs font-bold text-emerald-300">{carb}g</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase text-slate-400">
                              {l('Gord', 'Fat')}
                            </p>
                            <p className="mt-0.5 font-mono text-xs font-bold text-amber-300">{fatVal}g</p>
                          </div>
                        </div>
                      );
                    })()}

                    <TacticalButton
                      variant="primary"
                      fullWidth
                      displayFont
                      leftIcon={<CheckCircle2 className="size-4" />}
                      onClick={handleLogFood}
                    >
                      {editingLogId ? l('Salvar Alterações', 'Save Changes') : l('Confirmar Registro', 'Confirm Log')}
                    </TacticalButton>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* 2. Create New Custom Food Modal */}
        {isNewFoodModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewFoodModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-cyan-400/35 bg-[#0D0F18] p-6 shadow-2xl sm:rounded-3xl"
            >
              <button
                type="button"
                onClick={() => setIsNewFoodModalOpen(false)}
                className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>

              <div className="mb-5 flex items-center gap-3.5 pr-10">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-300">
                  <Plus className="size-6" />
                </div>
                <div>
                  <span className="font-orbitron text-[10px] font-black uppercase tracking-widest text-cyan-400">
                    {l('Catálogo Personalizado', 'Custom Catalog')}
                  </span>
                  <h2 className="font-orbitron text-lg font-black uppercase text-white">
                    {l('Novo Alimento', 'New Food')}
                  </h2>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {l('Nome do Alimento', 'Food Name')}
                  </label>
                  <input
                    type="text"
                    value={newFoodName}
                    onChange={(e) => setNewFoodName(e.target.value)}
                    placeholder={l('Ex: Pão Integral Artesanal', 'e.g., Artisan Whole Wheat Bread')}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-white/10 bg-[#090B12] px-3.5 py-2.5 text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {l('Kcal (por 100g)', 'Kcal (per 100g)')}
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={newFoodCals}
                      onChange={(e) => setNewFoodCals(parseFloat(e.target.value) || 0)}
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-white/10 bg-[#090B12] px-3.5 py-2 text-sm font-mono font-bold text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {l('Proteína (g)', 'Protein (g)')}
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={newFoodProtein}
                      onChange={(e) => setNewFoodProtein(parseFloat(e.target.value) || 0)}
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-white/10 bg-[#090B12] px-3.5 py-2 text-sm font-mono font-bold text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {l('Carboidratos (g)', 'Carbs (g)')}
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={newFoodCarbs}
                      onChange={(e) => setNewFoodCarbs(parseFloat(e.target.value) || 0)}
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-white/10 bg-[#090B12] px-3.5 py-2 text-sm font-mono font-bold text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {l('Gorduras (g)', 'Fat (g)')}
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={newFoodFat}
                      onChange={(e) => setNewFoodFat(parseFloat(e.target.value) || 0)}
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-white/10 bg-[#090B12] px-3.5 py-2 text-sm font-mono font-bold text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {l('Peso da Porção (g)', 'Serving Grams (g)')}
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={newFoodServingSize || ''}
                      onChange={(e) =>
                        setNewFoodServingSize(e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                      placeholder={l('Opcional (ex: 50)', 'Optional (e.g. 50)')}
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-white/10 bg-[#090B12] px-3.5 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {l('Unidade Caseira', 'Serving Unit')}
                    </label>
                    <input
                      type="text"
                      value={newFoodServingUnit}
                      onChange={(e) => setNewFoodServingUnit(e.target.value)}
                      placeholder={l('Ex: fatias, un', 'e.g. slices, unit')}
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-white/10 bg-[#090B12] px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {l('Categoria', 'Category')}
                  </label>
                  <select
                    value={newFoodCategory}
                    onChange={(e) => setNewFoodCategory(e.target.value)}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-white/10 bg-[#090B12] px-3.5 py-2 text-xs font-bold text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="Proteína">{l('Proteína', 'Protein')}</option>
                    <option value="Carboidrato">{l('Carboidrato', 'Carbohydrate')}</option>
                    <option value="Gordura">{l('Gordura', 'Fat')}</option>
                    <option value="Outros">{l('Outros', 'Others')}</option>
                  </select>
                </div>

                <div className="pt-2">
                  <TacticalButton
                    variant="primary"
                    fullWidth
                    displayFont
                    disabled={!newFoodName.trim()}
                    onClick={handleCreateFood}
                  >
                    {l('Salvar Alimento', 'Save Food')}
                  </TacticalButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

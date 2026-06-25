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
  Sparkles,
  Brain,
  Cpu,
  ChevronDown,
  Trash2,
  Clock,
  CheckCircle2,
  Target,
  Gauge,
  AlertTriangle
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
import { calculateMealFromTaco } from '@/lib/taco';
import { usePreferences } from '@/contexts/preferences';
import { PremiumGate } from '@/components/premium/PremiumGate';
import { translateUiText } from '@/lib/uiEnglish';

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
  return food.serving_size && food.serving_unit
    ? quantity * food.serving_size
    : quantity;
}

function gramsToQuantity(food: Food, grams: number) {
  return food.serving_size && food.serving_unit
    ? grams / food.serving_size
    : grams;
}

type NutritionStatus = 'low' | 'ideal' | 'exceeded';

const NUTRITION_PROMPTS = [
  { label: 'Prato completo', text: '150g de frango, arroz, feijão e salada' },
  { label: 'Lanche rápido', text: 'Iogurte natural, banana, aveia e mel' },
  { label: 'Café proteico', text: 'Omelete com 3 ovos, queijo e pão integral' },
];

function NutritionMetricCard({
  label,
  unit,
  consumed,
  target,
  icon: Icon,
  accent,
  bar,
  status,
}: {
  label: string;
  unit: string;
  consumed: number;
  target: number | null;
  icon: LucideIcon;
  accent: string;
  bar: string;
  status: NutritionStatus;
}) {
  const progress = target ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
  const remaining = target ? Math.max(0, target - consumed) : null;
  const statusStyle = {
    low: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    ideal: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    exceeded: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
  }[status];
  const statusLabel = { low: 'Baixo', ideal: 'Ideal', exceeded: 'Excedido' }[status];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-4 shadow-lg transition-colors hover:border-white/10 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-gray-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-white sm:text-3xl" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {consumed.toFixed(unit === 'kcal' ? 0 : 1)}
            <span className={`ml-1 text-sm ${accent}`}>{unit}</span>
          </p>
        </div>
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/5 ${accent}`}>
          <Icon className="size-4" />
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold">
          <span className="text-gray-600">{target ? `Meta ${Math.round(target)} ${unit}` : 'Meta indisponível'}</span>
          <span className={`rounded-md border px-1.5 py-0.5 ${statusStyle}`}>{statusLabel}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-black/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className={`h-full rounded-full ${bar}`}
          />
        </div>
        <p className="mt-2 text-xs font-medium text-gray-500">
          {remaining === null
            ? 'Complete seu perfil para calibrar.'
            : remaining > 0
              ? `${remaining.toFixed(unit === 'kcal' ? 0 : 1)} ${unit} restantes`
              : `Referência alcançada em ${progress}%`}
        </p>
      </div>
    </motion.div>
  );
}

export function Nutrition() {
  const { user } = useAuth();
  const hunterProfile = useHunterStore();
  const { language, t } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => isEnglish ? en : pt;
  const tx = (value?: string | null) => isEnglish && value ? translateUiText(value) : value;

  const [activeTab, setActiveTab] = useState<'diario' | 'cardapios'>('diario');
  const [subTab, setSubTab] = useState<'codex' | 'library'>('codex');
  const [foods, setFoods] = useState<Food[]>([]);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewFoodModalOpen, setIsNewFoodModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  
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

  // IA State
  const [iaTextInput, setIaTextInput] = useState('');
  const [iaMealType, setIaMealType] = useState('Almoço');
  const [iaLoading, setIaLoading] = useState(false);
  const [iaError, setIaError] = useState<string | null>(null);
  interface IaIngredientSourceData {
    found: boolean;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  }
  
  interface IaIngredient {
    name: string;
    grams: number;
    taco: IaIngredientSourceData;
    fatsecret: IaIngredientSourceData;
    ia_fallback: Omit<IaIngredientSourceData, 'found'> & { reason?: string };
    final: {
      source_used: 'taco' | 'fatsecret' | 'ia_fallback';
      kcal: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  }

  const [iaPreview, setIaPreview] = useState<{
    mealName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    totalGrams: number;
    confidence: number;
    ingredients: IaIngredient[];
  } | null>(null);
  const [expandedIaIngs, setExpandedIaIngs] = useState<Set<number>>(new Set());
  
  const toggleIaIngExpanded = (index: number) => {
    setExpandedIaIngs(prev => {
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
        supabase
          .from('foods')
          .select('*')
          .order('name'),
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

      const scoresByDate = new Map((scoreData as NutritionScore[] || []).map(score => [score.date, score.success]));
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
      const finalGrams = quantityToGrams(selectedFood, quantity);

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
      
      setIsModalOpen(false);
      setSelectedFood(null);
      setEditingLogId(null);
      setQuantity(100);
      fetchData();
    } catch (err) {
      console.error('Error logging food:', err);
    }
  }

  function handleEditLog(log: FoodLog) {
    if (log.source === 'meal_plan') {
      setDataError('Refeições do Cardápio do Caçador devem ser ajustadas no próprio cardápio. Desmarque a missão antes de alterar os itens.');
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
    const targetLog = logs.find(log => log.id === logId);
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

      setLogs(current => current.filter(log => log.meal_completion_id !== targetLog.meal_completion_id));
      if ((deleted ?? []).length > 0) {
        await useBossStore.getState().attackActiveBoss(user.id, -15, 'nutrition');
      }
      return;
    }

    const { error } = await supabase.from('food_logs').delete().eq('id', logId).eq('user_id', user.id);
    if (error) {
      setDataError(error.message);
      return;
    }
    setLogs(current => current.filter(log => log.id !== logId));

    if (targetLog?.source === 'ai' && targetLog.food_id) {
      const { count } = await supabase
        .from('food_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('food_id', targetLog.food_id);

      if ((count ?? 0) === 0) {
        await supabase
          .from('foods')
          .delete()
          .eq('id', targetLog.food_id)
          .eq('created_by', user.id);
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
        (syncedItems ?? []).map(log => log.meal_plan_item_id).filter(Boolean)
      );
      const missingItems = plan.items.filter(item => !syncedItemIds.has(item.id));

      if (missingItems.length > 0) {
        const { error: repairError } = await supabase.from('food_logs').insert(
          missingItems.map(item => ({
            user_id: user.id,
            food_id: item.food_id,
            quantity_grams: item.quantity_grams,
            meal_type: plan.name,
            source: 'meal_plan',
            meal_plan_id: plan.id,
            meal_plan_item_id: item.id,
            meal_completion_id: existingCompletion.id,
          }))
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
      plan.items.map(item => ({
        user_id: user.id,
        food_id: item.food_id,
        quantity_grams: item.quantity_grams,
        meal_type: plan.name,
        source: 'meal_plan',
        meal_plan_id: plan.id,
        meal_plan_item_id: item.id,
        meal_completion_id: completion.id,
      }))
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
      const { error } = await supabase.from('foods').insert({
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
      });

      if (error) throw error;
      
      setIsNewFoodModalOpen(false);
      setNewFoodName('');
      setNewFoodCals(0);
      setNewFoodProtein(0);
      setNewFoodCarbs(0);
      setNewFoodFat(0);
      setNewFoodServingSize(undefined);
      setNewFoodServingUnit('');
      fetchData();
    } catch (err) {
      console.error('Error creating food:', err);
    }
  }

  async function handleAnalyzeMealIa() {
    if (!user) return;
    if (!iaTextInput.trim()) {
      setIaError('Descreva a refeição para que o Códex possa calibrar.');
      return;
    }

    setIaLoading(true);
    setIaError(null);
    setIaPreview(null);
    setIaEditing(false);
    setIaRegistrationSuccess(null);
    setExpandedIaIngs(new Set());

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
      setIaError('A chave do Códex Neural (Groq API Key) não foi detectada no sistema. Por favor, configure a variável VITE_GROQ_API_KEY no arquivo .env.local.');
      setIaLoading(false);
      return;
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `Você é o Códex da Alimentação, um assistente neural de nutrição integrado a um sistema ciberpunk de RPG de vida real.
Sua tarefa é decompor a descrição livre da refeição em ingredientes, estimar o peso em gramas de cada item e obter as informações nutricionais por 100g de 3 fontes distintas:
1. Tabela TACO (Tabela Brasileira de Composição de Alimentos)
2. FatSecret (Base de dados muito utilizada em aplicativos de nutrição)
3. Estimativa de fallback própria da IA (caso falte informações em um ou nos dois anteriores)

Regras especiais para alimentos comerciais e de marcas:
- **Alimentos Comerciais, Fast-Food e Pratos Prontos de Marcas**: Se o usuário descrever um alimento comercial de marca, item de fast-food (ex: "Big Mac", "Whopper", "McFritas", "Subway de Frango", etc.) ou prato industrializado consolidado (ex: "Lasanha Sadia"), você **NÃO deve decompô-lo** em ingredientes primários separados. Em vez disso, retorne-o como um único ingrediente contendo o nome do produto oficial com a respectiva marca (ex: "Big Mac (McDonald's)") e o peso total estimado dele. Para as informações nutricionais por 100g das fontes (especialmente FatSecret e IA Fallback), utilize os dados nutricionais oficiais do produto inteiro (ex: para o Big Mac, o valor oficial de ~222 kcal por 100g, que equivale a ~524 kcal por sanduíche de 236g). Não tente estimar os ingredientes do sanduíche separados se o item completo possui tabela oficial consolidada.

Regras para obter os dados de cada fonte por 100g:
- Para a fonte 'taco', verifique se o ingrediente existe na Tabela TACO. Se sim, defina 'found' como true e forneça os valores (kcal, protein, carbs, fat). Se não, defina 'found' como false e coloque os valores zerados.
- Para a fonte 'fatsecret', verifique se o ingrediente existe na base FatSecret. Se sim, defina 'found' como true e forneça os valores (kcal, protein, carbs, fat). Se não, defina 'found' como false e coloque os valores zerados.
- Para a fonte 'ia_fallback', estime com base no seu conhecimento os valores médios ideais por 100g para o alimento.
- No campo 'final', defina qual fonte foi a escolhida para ser a principal de acordo com a disponibilidade (prioridade: taco > fatsecret > ia_fallback) e forneça os valores consolidados por 100g desse ingrediente no campo correspondente, além do nome da fonte usada no campo 'source_used'.

Retorne APENAS um objeto JSON válido sem qualquer introdução, conclusão ou blocos de código markdown.

Formato do JSON esperado:
{
  "meal_name": "Nome descritivo em português, curto, em caixa alta (ex: PRATO DE ARROZ, FEIJÃO E FRANGO GRELHADO)",
  "confidence_percentage": 90,
  "ingredients": [
    {
      "name": "arroz branco cozido",
      "grams": 150,
      "taco": {
        "found": true,
        "kcal": 130,
        "protein": 2.5,
        "carbs": 28.2,
        "fat": 0.2
      },
      "fatsecret": {
        "found": true,
        "kcal": 130,
        "protein": 2.7,
        "carbs": 28.0,
        "fat": 0.3
      },
      "ia_fallback": {
        "kcal": 130,
        "protein": 2.6,
        "carbs": 28.1,
        "fat": 0.25
      },
      "final": {
        "source_used": "taco",
        "kcal": 130,
        "protein": 2.5,
        "carbs": 28.2,
        "fat": 0.2
      }
    }
  ]
}

Converta unidades caseiras (unidade, fatia, colher, concha, xícara) para gramas com uma estimativa realista. Preserve o estado de preparo: cru, cozido, assado, frito ou grelhado. Não invente ingredientes que não estejam no texto.`
            },
            {
              role: 'user',
              content: `Analise a refeição: "${iaTextInput}"`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro do servidor Groq (Status: ${response.status})`);
      }

      const responseData = await response.json();
      const content = responseData.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Nenhuma resposta retornada do modelo de IA.');
      }

      const parsedData = JSON.parse(content);
      const { meal_name, ingredients, confidence_percentage } = parsedData;

      if (!meal_name || !Array.isArray(ingredients) || ingredients.length === 0) {
        throw new Error('Formato de dados incompleto retornado pelo modelo de IA.');
      }

      let totalKcal = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let totalGrams = 0;

      ingredients.forEach((ing: any) => {
        const grams = Number(ing.grams) || 0;
        const ratio = grams / 100;
        totalKcal += (Number(ing.final?.kcal) || 0) * ratio;
        totalProtein += (Number(ing.final?.protein) || 0) * ratio;
        totalCarbs += (Number(ing.final?.carbs) || 0) * ratio;
        totalFat += (Number(ing.final?.fat) || 0) * ratio;
        totalGrams += grams;
      });

      const detailSignals = iaTextInput.match(/\b\d+(?:[.,]\d+)?\s*(?:g|gramas?|ml|unidades?|fatias?|colheres?)\b/gi)?.length ?? 0;
      const confidence = confidence_percentage || Math.min(98, Math.round(80 + detailSignals * 2));

      setIaPreview({
        mealName: meal_name,
        calories: Math.round(totalKcal),
        protein: Number(totalProtein.toFixed(1)),
        carbs: Number(totalCarbs.toFixed(1)),
        fat: Number(totalFat.toFixed(1)),
        totalGrams: Math.round(totalGrams),
        confidence: confidence,
        ingredients: ingredients
      });

    } catch (err: unknown) {
      console.error('[Códex IA] Erro ao processar:', err);
      setIaError(err instanceof Error ? err.message : 'Houve uma anomalia na calibração neural. Tente novamente.');
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
        await supabase
          .from('foods')
          .delete()
          .eq('id', food.id)
          .eq('created_by', user.id);
        throw logError;
      }

      setIaRegistrationSuccess(`${iaPreview.mealName} foi registrado no diário.`);
      setIaPreview(null);
      setIaEditing(false);
      setIaTextInput('');
      await fetchData();
    } catch (err: unknown) {
      console.error('[Códex IA] Erro ao registrar:', err);
      setIaError(err instanceof Error ? err.message : 'Não foi possível registrar a refeição. Tente novamente.');
    } finally {
      setIaRegistering(false);
    }
  }

  const filteredFoods = foods.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dailyMacros = logs.reduce((acc, log) => {
    const food = foodFromLog(log);
    if (!food) return acc;
    const ratio = log.quantity_grams / 100;
    return {
      kcal: acc.kcal + (Number(food.calories_per_100g) || 0) * ratio,
      protein: acc.protein + (Number(food.protein_per_100g) || 0) * ratio,
      carbs: acc.carbs + (Number(food.carbs_per_100g) || 0) * ratio,
      fat: acc.fat + (Number(food.fat_per_100g) || 0) * ratio,
    };
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });

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

  function getReferenceStatus(consumed: number, target: number | null): NutritionStatus {
    if (!target || consumed < target * 0.75) return 'low';
    if (consumed <= target * 1.1) return 'ideal';
    return 'exceeded';
  }

  const calorieStatus: NutritionStatus = !nutritionTargets.minCalories || !nutritionTargets.maxCalories
    ? 'low'
    : dailyMacros.kcal < nutritionTargets.minCalories
      ? 'low'
      : dailyMacros.kcal <= nutritionTargets.maxCalories
        ? 'ideal'
        : 'exceeded';
  const isInsideRecommendedRange = calorieStatus === 'ideal';
  const projectedNutritionXp = 35;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-1 w-4 bg-purple-500" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-purple-500">{t('nutrition.eyebrow')}</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {t('nutrition.title')}
          </h1>
        </div>
        
        {activeTab === 'diario' && subTab === 'library' && (
          <button 
            onClick={() => setIsNewFoodModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            <Plus className="size-4" strokeWidth={3} />
            Novo Alimento
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-[#1E1E26] pb-px">
        {[
          { id: 'diario', label: t('nutrition.diary'), icon: BookOpen },
          { id: 'cardapios', label: t('nutrition.mealPlans'), icon: UtensilsCrossed },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-bold transition-all ${
              activeTab === tab.id ? 'text-orange-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="nutrition-tab"
                className="absolute bottom-0 left-0 h-0.5 w-full bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.6)]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Cardápios Tab */}
      {activeTab === 'cardapios' && (
        <NutritionMealPlans
          foods={foods}
          onUsePlan={handleUseMealPlan}
          feedback={mealPlanFeedback}
        />
      )}

      {/* Diário de Consumo Tab */}
      {activeTab === 'diario' && (
        <div className="space-y-6">
          {dataError && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-xs font-semibold text-rose-200">
              <span className="font-black uppercase tracking-widest text-rose-400">Falha na sincronizacao: </span>
              {dataError}
            </div>
          )}
          {calorieStatus === 'exceeded' && nutritionTargets.maxCalories && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              aria-live="assertive"
              className="relative overflow-hidden rounded-2xl border-2 border-red-500 bg-red-500/15 p-5 shadow-[0_0_28px_rgba(239,68,68,0.22)]"
            >
              <div className="absolute inset-y-0 left-0 w-1.5 bg-red-500" />
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-red-500/40 bg-red-500/20 text-red-400">
                  <AlertTriangle className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-red-400 font-orbitron">
                    {t('nutrition.exceeded')}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-red-100">
                    {language === 'en-US' ? (
                      <>
                        {t('nutrition.exceededBody')} You consumed <strong>{Math.round(dailyMacros.kcal)} kcal</strong>,
                        exceeding the recommended limit of <strong>{nutritionTargets.maxCalories} kcal</strong> by{' '}
                        <strong>{Math.round(dailyMacros.kcal - nutritionTargets.maxCalories)} kcal</strong>.
                      </>
                    ) : (
                      <>
                        {t('nutrition.exceededBody')} Você consumiu <strong>{Math.round(dailyMacros.kcal)} kcal</strong>,
                        ultrapassando o limite recomendado de <strong>{nutritionTargets.maxCalories} kcal</strong> em{' '}
                        <strong>{Math.round(dailyMacros.kcal - nutritionTargets.maxCalories)} kcal</strong>.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NutritionMetricCard
              label="Energia diária"
              unit="kcal"
              consumed={dailyMacros.kcal}
              target={nutritionTargets.targetCalories}
              icon={Flame}
              accent="text-orange-400"
              bar="bg-gradient-to-r from-orange-700 via-orange-500 to-amber-300 shadow-[0_0_10px_rgba(249,115,22,0.45)]"
              status={calorieStatus}
            />
            <NutritionMetricCard
              label="Proteínas"
              unit="g"
              consumed={dailyMacros.protein}
              target={macroTargets.protein}
              icon={Zap}
              accent="text-purple-400"
              bar="bg-gradient-to-r from-purple-700 via-purple-500 to-fuchsia-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
              status={getReferenceStatus(dailyMacros.protein, macroTargets.protein)}
            />
            <NutritionMetricCard
              label="Carboidratos"
              unit="g"
              consumed={dailyMacros.carbs}
              target={macroTargets.carbs}
              icon={Apple}
              accent="text-green-400"
              bar="bg-gradient-to-r from-emerald-700 via-green-500 to-lime-300 shadow-[0_0_10px_rgba(34,197,94,0.35)]"
              status={getReferenceStatus(dailyMacros.carbs, macroTargets.carbs)}
            />
            <NutritionMetricCard
              label="Gorduras"
              unit="g"
              consumed={dailyMacros.fat}
              target={macroTargets.fat}
              icon={Droplets}
              accent="text-blue-400"
              bar="bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-300 shadow-[0_0_10px_rgba(59,130,246,0.35)]"
              status={getReferenceStatus(dailyMacros.fat, macroTargets.fat)}
            />
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-orange-500/25 bg-[#0F0F13] p-5 shadow-[0_0_28px_rgba(249,115,22,0.08)] sm:p-6">
            <div className="absolute right-0 top-0 h-full w-72 bg-gradient-to-l from-orange-500/10 to-transparent" />
            <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="flex items-center gap-2 text-orange-400">
                  <Target className="size-4" />
                  <span className="text-sm font-bold">Meta diária de recuperação</span>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                  <h2 className="text-2xl font-black uppercase text-white sm:text-3xl" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {Math.round(dailyMacros.kcal)}
                  </h2>
                  <p className="pb-1 text-xs font-black uppercase tracking-widest text-gray-500">
                    de {nutritionTargets.targetCalories ?? '--'} kcal
                  </p>
                </div>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-gray-400">
                  {nutritionTargets.targetCalories
                    ? remainingCalories && remainingCalories > 0
                      ? `${Math.round(remainingCalories)} kcal disponíveis para completar o objetivo de ${nutritionTargets.goalLabel.toLowerCase()} com consistência.`
                      : isInsideRecommendedRange
                        ? 'Faixa recomendada alcançada. O Sistema avaliará o resultado no fechamento do dia.'
                        : 'A referência diária foi ultrapassada. Siga normalmente e priorize consistência ao longo dos dias.'
                    : `Complete no perfil: ${nutritionTargets.missingFields.join(', ') || 'dados físicos'}.`}
                </p>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                    <span className="text-gray-500">Sincronização energética</span>
                    <span className="text-orange-300">{calorieProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-black/60">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${calorieProgress}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-orange-700 via-orange-500 to-amber-300 shadow-[0_0_14px_rgba(249,115,22,0.5)]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Objetivo', value: nutritionTargets.goalLabel, icon: Gauge, tone: 'text-orange-300' },
                  { label: 'Restante', value: remainingCalories === null ? '--' : `${Math.round(remainingCalories)} kcal`, icon: Flame, tone: 'text-white' },
                  {
                    label: 'Faixa recomendada',
                    value: nutritionTargets.minCalories && nutritionTargets.maxCalories
                      ? `${nutritionTargets.minCalories}–${nutritionTargets.maxCalories}`
                      : '--',
                    icon: Target,
                    tone: 'text-white',
                  },
                  {
                    label: 'XP previsto',
                    value: `+${projectedNutritionXp} XP`,
                    icon: Zap,
                    tone: isInsideRecommendedRange ? 'text-purple-300' : 'text-gray-400',
                  },
                ].map(item => (
                  <div key={item.label} className="rounded-xl border border-white/5 bg-black/30 p-3">
                    <item.icon className={`size-3.5 ${item.tone}`} />
                    <p className="mt-2 text-xs font-medium text-gray-500">{item.label}</p>
                    <p className={`mt-1 text-sm font-bold ${item.tone}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="relative mt-4 border-t border-white/5 pt-3 text-[13px] leading-relaxed text-gray-500">
              Referências de macros são estimativas visuais do Sistema. A recompensa real é processada pela avaliação nutricional diária.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-purple-500/15 bg-purple-500/[0.035] p-4">
              <p className="text-xs font-bold text-purple-400">Suporte físico</p>
              <p className="mt-2 text-sm font-bold text-white">Proteína em faixa de referência</p>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-500">Acompanha a preparação de FOR e RES sem conceder atributos automaticamente.</p>
            </div>
            <div className="rounded-2xl border border-orange-500/15 bg-orange-500/[0.035] p-4">
              <p className="text-xs font-bold text-orange-400">Recompensa diária</p>
              <p className="mt-2 text-sm font-bold text-white">+35 XP · +2 VIT</p>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-500">Concedidos pelo Sistema no fechamento de um dia dentro da faixa recomendada.</p>
            </div>
            <div className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.035] p-4">
              <p className="text-xs font-bold text-blue-400">Streak nutricional</p>
              <p className="mt-2 text-sm font-bold text-white">{nutritionStreak} {nutritionStreak === 1 ? 'dia' : 'dias'}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-500">Sequência real de avaliações concluídas dentro da meta energética.</p>
            </div>
          </div>

          {/* Layout de 2 Colunas */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            
            {/* Coluna Principal das Sub-Abas */}
            <div className="space-y-4 lg:col-span-3">
              
              {/* Seletor Cyberpunk de Sub-Abas */}
              <div className="flex gap-2 rounded-xl bg-[#0F0F13] border border-[#1E1E26] p-1.5 w-fit">
                <button
                  onClick={() => setSubTab('codex')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                    subTab === 'codex' 
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Sparkles size={12} className={subTab === 'codex' ? "animate-pulse" : ""} />
                  {t('nutrition.codex')}
                </button>
                <button
                  onClick={() => setSubTab('library')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                    subTab === 'library' 
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <BookOpen size={12} />
                  {t('nutrition.library')}
                </button>
              </div>

              {/* Conteúdo: Códex da Alimentação (IA) */}
              {subTab === 'codex' && (
                <PremiumGate
                  title={l('Códex de Alimentação Restrito', 'Food Codex Locked')}
                  description={l(
                    'A calibração e análise de nutrientes via rede neural avançada (IA) requer ativação de assinatura premium.',
                    'Nutrient calibration and analysis through the advanced neural network (AI) require an active premium subscription.'
                  )}
                >
                  <div className="relative space-y-6 overflow-hidden rounded-3xl border border-purple-500/20 bg-[#0F0F13] p-5 shadow-[0_0_28px_rgba(168,85,247,0.07)] sm:p-7">
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-purple-500/5 blur-3xl" />
                  
                  <div className="space-y-1 relative z-10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-purple-400">
                        <Brain size={16} className="animate-pulse" />
                        <h2 className="text-xl font-black uppercase sm:text-2xl" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                          CÓDEX DA ALIMENTAÇÃO
                        </h2>
                      </div>
                      <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-300">
                        IA ativa
                      </span>
                    </div>
                    <p className="max-w-2xl text-sm leading-relaxed text-gray-300">
                      Descreva sua refeição e o Sistema calculará calorias, macros e impacto na sua recuperação.
                    </p>
                  </div>

                  {/* Formulário do Códex */}
                  <div className="space-y-4 relative z-10">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-300">Descrição da refeição</label>
                      <textarea
                        value={iaTextInput}
                        onChange={(e) => setIaTextInput(e.target.value)}
                        placeholder="Ex: Almocei 150g de filé de frango, 200g de arroz integral, 100g de feijão carioca e salada com uma colher de sopa de azeite..."
                        rows={5}
                        className="w-full resize-none rounded-2xl border border-[#252530] bg-[#0A0A0D] p-5 text-base leading-relaxed text-white placeholder:text-gray-600 transition-all focus:border-purple-500/50 focus:shadow-[0_0_18px_rgba(168,85,247,0.12)] focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-2 pt-1">
                        {NUTRITION_PROMPTS.map(prompt => (
                          <button
                            key={prompt.label}
                            type="button"
                            onClick={() => setIaTextInput(prompt.text)}
                            className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-left text-[13px] font-medium text-gray-400 transition-all hover:border-purple-500/30 hover:bg-purple-500/5 hover:text-purple-200"
                          >
                            {prompt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Período</label>
                        <select
                          value={iaMealType}
                          onChange={(e) => setIaMealType(e.target.value)}
                          className="w-full rounded-xl border border-[#1E1E26] bg-[#0A0A0D] p-4 text-sm text-white focus:border-purple-500 focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value="Café da Manhã">Café da Manhã</option>
                          <option value="Almoço">Almoço</option>
                          <option value="Lanche">Lanche</option>
                          <option value="Jantar">Jantar</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={handleAnalyzeMealIa}
                          disabled={iaLoading}
                          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border border-purple-400/30 bg-gradient-to-r from-purple-700 via-purple-600 to-blue-600 px-4 text-sm font-black uppercase text-white shadow-[0_0_24px_rgba(168,85,247,0.18)] transition-all hover:brightness-110 hover:shadow-[0_0_30px_rgba(168,85,247,0.28)] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
                          style={{ fontFamily: 'Orbitron, sans-serif' }}
                        >
                          {iaLoading ? (
                            <>
                              <Cpu size={14} className="animate-spin text-purple-400" />
                              Sistema analisando nutrientes...
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} className="text-purple-300" />
                              Analisar refeição
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Banners de Resposta */}
                  <AnimatePresence>
                    {iaError && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-xl border border-red-500/25 bg-red-500/5 p-4 text-xs text-red-400 flex items-start gap-2 relative z-10"
                      >
                        <span className="font-bold">ANOMALIA:</span> {iaError}
                      </motion.div>
                    )}

                    {iaRegistrationSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm font-semibold text-emerald-200"
                      >
                        <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
                        {iaRegistrationSuccess}
                      </motion.div>
                    )}

                    {iaPreview && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="relative z-10 space-y-5 overflow-hidden rounded-2xl border border-purple-500/30 bg-[#0A0A0D] p-5 shadow-[0_0_24px_rgba(168,85,247,0.1)] sm:p-6"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-purple-400">
                              <Zap size={18} />
                              <span className="text-sm font-black uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                Análise concluída
                              </span>
                            </div>
                            {iaEditing ? (
                              <input
                                value={iaPreview.mealName}
                                onChange={event => setIaPreview(current => current ? { ...current, mealName: event.target.value } : current)}
                                className="mt-3 w-full rounded-lg border border-purple-500/30 bg-black/40 px-3 py-2 text-base font-bold text-white outline-none focus:border-purple-400"
                                aria-label="Nome da refeição"
                              />
                            ) : (
                              <p className="mt-2 text-lg font-bold text-white">{iaPreview.mealName}</p>
                            )}
                          </div>
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-right">
                            <p className="text-xs font-medium text-gray-400">Confiança estimada</p>
                            <p className="mt-1 text-lg font-black text-emerald-300">{iaPreview.confidence}%</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                          {[
                            { key: 'calories' as const, label: 'Energia', unit: 'kcal', tone: 'text-orange-400' },
                            { key: 'protein' as const, label: 'Proteína', unit: 'g', tone: 'text-purple-400' },
                            { key: 'carbs' as const, label: 'Carboidratos', unit: 'g', tone: 'text-green-400' },
                            { key: 'fat' as const, label: 'Gorduras', unit: 'g', tone: 'text-blue-400' },
                            { key: 'totalGrams' as const, label: 'Peso estimado', unit: 'g', tone: 'text-gray-300' },
                          ].map(metric => (
                            <div key={metric.key} className="rounded-xl border border-white/5 bg-white/[0.035] p-3">
                              <p className="text-xs font-medium text-gray-500">{metric.label}</p>
                              {iaEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={iaPreview[metric.key]}
                                  onChange={event => setIaPreview(current => current ? {
                                    ...current,
                                    [metric.key]: Math.max(0, Number(event.target.value)),
                                  } : current)}
                                  className={`mt-2 w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-base font-bold outline-none focus:border-purple-500/50 ${metric.tone}`}
                                  aria-label={metric.label}
                                />
                              ) : (
                                <p className={`mt-2 text-lg font-black ${metric.tone}`}>
                                  {iaPreview[metric.key]} <span className="text-xs font-semibold">{metric.unit}</span>
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="space-y-3">
                          <p className="text-xs font-black uppercase tracking-widest text-purple-400 font-orbitron">
                            Ingredientes & Comparação de Fontes (TACO vs FatSecret vs IA)
                          </p>
                          <div className="space-y-2">
                            {iaPreview.ingredients.map((ing, idx) => (
                              <div key={idx} className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] transition-all hover:border-white/10">
                                <button
                                  type="button"
                                  onClick={() => toggleIaIngExpanded(idx)}
                                  className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-white/[0.04]"
                                >
                                  <div>
                                    <span className="font-bold text-white text-sm">{ing.name}</span>
                                    <span className="ml-2 text-xs font-semibold text-gray-500">({ing.grams}g)</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                      ing.final.source_used === 'taco' 
                                        ? 'border-purple-500/35 bg-purple-500/10 text-purple-400' 
                                        : ing.final.source_used === 'fatsecret'
                                          ? 'border-orange-500/35 bg-orange-500/10 text-orange-400'
                                          : 'border-amber-500/35 bg-amber-500/10 text-amber-400'
                                    }`}>
                                      Fonte: {ing.final.source_used === 'taco' ? 'TACO' : ing.final.source_used === 'fatsecret' ? 'FatSecret' : 'IA Fallback'}
                                    </span>
                                    <ChevronDown className={`size-4 text-gray-500 transition-transform duration-200 ${expandedIaIngs.has(idx) ? 'rotate-180' : ''}`} />
                                  </div>
                                </button>
                                
                                <AnimatePresence>
                                  {expandedIaIngs.has(idx) && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="border-t border-white/5 bg-black/40 px-4 py-3"
                                    >
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs text-gray-400">
                                          <thead>
                                            <tr className="border-b border-white/5 text-[9px] uppercase font-black tracking-widest text-gray-500">
                                              <th className="pb-2">Fonte (por 100g)</th>
                                              <th className="pb-2 text-right">Energia</th>
                                              <th className="pb-2 text-right">Prot.</th>
                                              <th className="pb-2 text-right">Carb.</th>
                                              <th className="pb-2 text-right">Gord.</th>
                                              <th className="pb-2 text-right">Status</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-white/5">
                                            {/* Linha TACO */}
                                            <tr className={ing.final.source_used === 'taco' ? 'text-purple-300 font-bold' : ''}>
                                              <td className="py-2.5 flex items-center gap-1.5">
                                                <span className={`size-1.5 rounded-full ${ing.taco.found ? 'bg-purple-500' : 'bg-gray-700'}`} />
                                                Tabela TACO
                                              </td>
                                              <td className="py-2.5 text-right">{ing.taco.found ? `${ing.taco.kcal} kcal` : '--'}</td>
                                              <td className="py-2.5 text-right">{ing.taco.found ? `${ing.taco.protein}g` : '--'}</td>
                                              <td className="py-2.5 text-right">{ing.taco.found ? `${ing.taco.carbs}g` : '--'}</td>
                                              <td className="py-2.5 text-right">{ing.taco.found ? `${ing.taco.fat}g` : '--'}</td>
                                              <td className="py-2.5 text-right">
                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                  ing.taco.found ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-600'
                                                }`}>
                                                  {ing.taco.found ? 'Disponível' : 'N/D'}
                                                </span>
                                              </td>
                                            </tr>
                                            {/* Linha FatSecret */}
                                            <tr className={ing.final.source_used === 'fatsecret' ? 'text-orange-300 font-bold' : ''}>
                                              <td className="py-2.5 flex items-center gap-1.5">
                                                <span className={`size-1.5 rounded-full ${ing.fatsecret.found ? 'bg-orange-500' : 'bg-gray-700'}`} />
                                                FatSecret
                                              </td>
                                              <td className="py-2.5 text-right">{ing.fatsecret.found ? `${ing.fatsecret.kcal} kcal` : '--'}</td>
                                              <td className="py-2.5 text-right">{ing.fatsecret.found ? `${ing.fatsecret.protein}g` : '--'}</td>
                                              <td className="py-2.5 text-right">{ing.fatsecret.found ? `${ing.fatsecret.carbs}g` : '--'}</td>
                                              <td className="py-2.5 text-right">{ing.fatsecret.found ? `${ing.fatsecret.fat}g` : '--'}</td>
                                              <td className="py-2.5 text-right">
                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                  ing.fatsecret.found ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-600'
                                                }`}>
                                                  {ing.fatsecret.found ? 'Disponível' : 'N/D'}
                                                </span>
                                              </td>
                                            </tr>
                                            {/* Linha IA Fallback */}
                                            <tr className={ing.final.source_used === 'ia_fallback' ? 'text-amber-300 font-bold' : ''}>
                                              <td className="py-2.5 flex items-center gap-1.5">
                                                <span className="size-1.5 rounded-full bg-amber-500" />
                                                IA Fallback
                                              </td>
                                              <td className="py-2.5 text-right">{ing.ia_fallback.kcal} kcal</td>
                                              <td className="py-2.5 text-right">{ing.ia_fallback.protein}g</td>
                                              <td className="py-2.5 text-right">{ing.ia_fallback.carbs}g</td>
                                              <td className="py-2.5 text-right">{ing.ia_fallback.fat}g</td>
                                              <td className="py-2.5 text-right">
                                                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                                  Ativo
                                                </span>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                        </div>
                        <p className="text-[13px] leading-relaxed text-gray-500">
                          Os macronutrientes da refeição foram calculados de forma consolidada comparando a Tabela TACO, base do FatSecret e estimativa da IA (fallback) para cada item individual. Revise os dados antes de registrar.
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setIaEditing(current => !current)}
                            className="min-h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-gray-300 transition-colors hover:border-purple-500/30 hover:text-white"
                          >
                            {iaEditing ? 'Concluir edição' : 'Editar antes de salvar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleRegisterIaMeal()}
                            disabled={iaRegistering || iaPreview.totalGrams <= 0 || !iaPreview.mealName.trim()}
                            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 text-sm font-black uppercase text-white transition-all hover:bg-purple-500 hover:shadow-[0_0_22px_rgba(168,85,247,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {iaRegistering ? <Cpu className="size-4 animate-spin" /> : <BookOpen className="size-4" />}
                            {iaRegistering ? 'Registrando...' : 'Registrar no diário'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </div>
                </PremiumGate>
              )}

              {/* Conteúdo: Biblioteca de Suprimentos */}
              {subTab === 'library' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="text" 
                        placeholder="Buscar suprimentos nutricionais..."
                        className="w-full rounded-xl border border-[#1E1E26] bg-[#0F0F13] py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center gap-1 rounded-xl border border-[#1E1E26] bg-[#0F0F13] p-1">
                      <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
                      >
                        <LayoutGrid size={16} />
                      </button>
                      <button 
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
                      >
                        <TableIcon size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="min-h-[400px]">
                    {loading ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Array(6).fill(0).map((_, i) => (
                          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
                        ))}
                      </div>
                    ) : viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredFoods.map((food) => (
                          <button
                            key={food.id}
                            onClick={() => {
                              setSelectedFood(food);
                              setIsModalOpen(true);
                            }}
                            className="flex flex-col gap-3 rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 text-left transition-all duration-150 ease-out hover:bg-[#16161D] hover:border-purple-500/50 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                                <Apple className="size-5" />
                              </div>
                              <span className="text-xs font-bold text-gray-500">{food.calories_per_100g} kcal</span>
                            </div>
                            <div>
                              <h3 className="font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>{food.name}</h3>
                              <p className="mt-1 text-[13px] font-semibold text-purple-400">
                                {food.category} • {food.protein_per_100g}g Prot.
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13]">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-[#1E1E26] bg-white/5">
                              <th className="px-6 py-4 text-xs font-semibold text-gray-400">Alimento</th>
                              <th className="px-6 py-4 text-xs font-semibold text-gray-400">Calorias (100g)</th>
                              <th className="px-6 py-4 text-xs font-semibold text-gray-400">Proteína (100g)</th>
                              <th className="px-6 py-4 text-xs font-semibold text-gray-400">Categoria</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1E1E26]">
                            {filteredFoods.map((food) => (
                              <tr 
                                key={food.id} 
                                className="group hover:bg-white/5 transition-colors cursor-pointer"
                                onClick={() => {
                                  setSelectedFood(food);
                                  setIsModalOpen(true);
                                }}
                              >
                                <td className="px-6 py-4">
                                  <span className="font-bold text-white uppercase text-xs" style={{ fontFamily: 'Orbitron, sans-serif' }}>{food.name}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-xs text-orange-400 font-bold uppercase tracking-widest">{food.calories_per_100g} kcal</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-xs text-blue-400 font-bold uppercase tracking-widest">{food.protein_per_100g}g</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-xs text-purple-400 font-black uppercase tracking-widest italic">{food.category}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Coluna Lateral de Logs (Consumo Diário) */}
            <div className="space-y-4 lg:col-span-2">
              <div className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6 shadow-lg">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-black uppercase text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {l('CONSUMO DIÁRIO', 'DAILY CONSUMPTION')}
                  </h2>
                  <History className="size-4 text-purple-500" />
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {logs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-purple-500/20 bg-purple-500/[0.03] px-4 py-10 text-center">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
                        <UtensilsCrossed className="size-5" />
                      </div>
                      <p className="mt-4 text-sm font-bold text-white">{l('O Sistema ainda não detectou nutrientes hoje.', 'The System has not detected nutrients today.')}</p>
                      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{l('Registre uma refeição para iniciar sua recuperação de mana.', 'Log a meal to begin your mana recovery.')}</p>
                      <button
                        type="button"
                        onClick={() => setSubTab('codex')}
                        className="mt-5 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-purple-500 hover:shadow-[0_0_18px_rgba(168,85,247,0.25)]"
                      >
                        {l('Registrar refeição', 'Log meal')}
                      </button>
                    </div>
                  ) : (
                    logs.map((log) => {
                      const food = foodFromLog(log);
                      const isCustom = !!food?.serving_unit && !!food?.serving_size;
                      const displayQty = isCustom && food ? Number(gramsToQuantity(food, log.quantity_grams).toFixed(2)) : log.quantity_grams;
                      const displayUnit = isCustom ? food?.serving_unit : 'G';
                      const ratio = log.quantity_grams / 100;
                      const kcal = (Number(food?.calories_per_100g) || 0) * ratio;
                      const protein = (Number(food?.protein_per_100g) || 0) * ratio;
                      const carbs = (Number(food?.carbs_per_100g) || 0) * ratio;
                      const fat = (Number(food?.fat_per_100g) || 0) * ratio;
                      const isExpanded = expandedLogIds.has(log.id);

                      return (
                        <motion.div layout key={log.id} className="relative overflow-hidden rounded-xl border border-[#1E1E26] bg-white/[0.035] transition-all hover:border-purple-500/25 hover:bg-white/[0.055]">
                          <button
                            type="button"
                            onClick={() => setExpandedLogIds(current => {
                              const next = new Set(current);
                              if (next.has(log.id)) next.delete(log.id);
                              else next.add(log.id);
                              return next;
                            })}
                            className="w-full p-4 text-left"
                            aria-expanded={isExpanded}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <span className="rounded-md border border-purple-500/15 bg-purple-500/10 px-2 py-1 text-xs font-semibold text-purple-300">
                                  {tx(log.meal_type)}
                                </span>
                                <p className="mt-2 truncate text-sm font-bold text-white">{tx(food?.name) || l('Alimento indisponível', 'Food unavailable')}</p>
                              </div>
                              <ChevronDown className={`mt-1 size-4 shrink-0 text-gray-600 transition-transform ${isExpanded ? 'rotate-180 text-purple-400' : ''}`} />
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <p className="text-sm font-bold text-orange-300">
                                {kcal.toFixed(0)} kcal
                              </p>
                              <p className="flex items-center gap-1 text-xs font-medium text-gray-500">
                                <Clock className="size-3" />
                                {new Date(log.logged_at).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="border-t border-white/5 px-4 pb-4 pt-3">
                                  <div className="grid grid-cols-3 gap-2">
                                    {[
                                      ['Proteína', `${protein.toFixed(1)}g`],
                                      ['Carbos', `${carbs.toFixed(1)}g`],
                                      ['Gorduras', `${fat.toFixed(1)}g`],
                                    ].map(([label, value]) => (
                                      <div key={label} className="rounded-lg bg-black/25 p-2 text-center">
                                        <p className="text-xs font-medium text-gray-500">{label}</p>
                                        <p className="mt-1 text-sm font-bold text-gray-300">{value}</p>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                                    <span className="text-gray-500">{displayQty}{displayUnit} registrados</span>
                                    <span className="font-black uppercase text-purple-300">XP diário pendente</span>
                                  </div>
                                  <div className="mt-3 grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditLog(log)}
                                      className="rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-gray-400 transition-colors hover:text-white"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteLog(log.id)}
                                      className="flex items-center justify-center gap-1 rounded-lg border border-red-500/15 bg-red-500/5 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                                    >
                                      <Trash2 className="size-3" />
                                      Remover
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modais - Registro & Novo Alimento */}
      <AnimatePresence>
        {isModalOpen && selectedFood && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setEditingLogId(null);
              }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-8 shadow-2xl"
            >
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingLogId(null);
                }}
                className="absolute right-6 top-6 text-gray-500 hover:text-white"
              >
                <X className="size-6" />
              </button>

              <div className="mb-8 flex items-center gap-5">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                  <Apple className="size-8" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase italic text-white tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {editingLogId ? 'Editar' : 'Registrar'} <span className="text-purple-500">Recuperação</span>
                  </h2>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-600">{selectedFood.name}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Tipo de recurso</label>
                  <select 
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full rounded-xl border border-[#1E1E26] bg-black p-4 text-white focus:border-purple-500 focus:outline-none appearance-none"
                  >
                    <option value="Café da Manhã">Café da Manhã</option>
                    <option value="Almoço">Almoço</option>
                    <option value="Café da Tarde">Café da Tarde</option>
                    <option value="Jantar">Jantar</option>
                    <option value="Lanche">Lanche</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">
                    Quantidade ({selectedFood.serving_unit || 'Gramas'})
                  </label>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-[#1E1E26] bg-black p-4 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="rounded-xl bg-purple-500/5 p-4 border border-purple-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-400">Conversão de energia</span>
                    <span className="text-lg font-black text-purple-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {((selectedFood.calories_per_100g * quantityToGrams(selectedFood, quantity)) / 100).toFixed(0)} kcal
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleLogFood}
                  className="w-full rounded-2xl bg-purple-600 py-5 font-black uppercase italic tracking-[0.2em] text-white transition-all hover:bg-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {editingLogId ? 'Salvar Registro' : 'Confirmar Recuperação'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNewFoodModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewFoodModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-8 shadow-2xl"
            >
              <button 
                onClick={() => setIsNewFoodModalOpen(false)}
                className="absolute right-6 top-6 text-gray-500 hover:text-white"
              >
                <X className="size-6" />
              </button>

              <div className="mb-8 flex items-center gap-5">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                  <Plus className="size-8" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase italic text-white tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Novo <span className="text-purple-500">Recurso</span>
                  </h2>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-600">Expanda a base de dados do sistema</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Nome do item</label>
                  <input 
                    type="text" 
                    value={newFoodName}
                    onChange={(e) => setNewFoodName(e.target.value)}
                    placeholder="Ex: Arroz Integral"
                    className="w-full rounded-xl border border-[#1E1E26] bg-black p-4 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Kcal por porção/100g</label>
                    <input 
                      type="number" 
                      value={newFoodCals}
                      onChange={(e) => setNewFoodCals(parseFloat(e.target.value))}
                      className="w-full rounded-xl border border-[#1E1E26] bg-black p-4 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Proteína (g)</label>
                    <input 
                      type="number" 
                      value={newFoodProtein}
                      onChange={(e) => setNewFoodProtein(parseFloat(e.target.value))}
                      className="w-full rounded-xl border border-[#1E1E26] bg-black p-4 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Carboidratos (g)</label>
                    <input 
                      type="number" 
                      value={newFoodCarbs}
                      onChange={(e) => setNewFoodCarbs(parseFloat(e.target.value))}
                      className="w-full rounded-xl border border-[#1E1E26] bg-black p-4 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Gorduras (g)</label>
                    <input 
                      type="number" 
                      value={newFoodFat}
                      onChange={(e) => setNewFoodFat(parseFloat(e.target.value))}
                      className="w-full rounded-xl border border-[#1E1E26] bg-black p-4 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">
                      Porção (ex: 2)
                    </label>
                    <input 
                      type="number" 
                      value={newFoodServingSize || ''}
                      onChange={(e) => setNewFoodServingSize(e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Opcional"
                      className="w-full rounded-xl border border-[#1E1E26] bg-black p-4 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">
                      Unidade (ex: fatias)
                    </label>
                    <input 
                      type="text" 
                      value={newFoodServingUnit}
                      onChange={(e) => setNewFoodServingUnit(e.target.value)}
                      placeholder="Opcional"
                      className="w-full rounded-xl border border-[#1E1E26] bg-black p-4 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Categoria</label>
                  <select 
                    value={newFoodCategory}
                    onChange={(e) => setNewFoodCategory(e.target.value)}
                    className="w-full rounded-xl border border-[#1E1E26] bg-black p-4 text-white focus:border-purple-500 focus:outline-none appearance-none"
                  >
                    <option value="Proteína">Proteína</option>
                    <option value="Carboidrato">Carboidrato</option>
                    <option value="Gordura">Gordura</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <button 
                  onClick={handleCreateFood}
                  className="w-full rounded-2xl bg-purple-600 py-5 font-black uppercase italic tracking-[0.2em] text-white transition-all hover:bg-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Registrar Recurso
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

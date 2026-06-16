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
  Scale,
  LayoutGrid,
  Table as TableIcon,
  UtensilsCrossed,
  BookOpen,
  Sparkles,
  Brain,
  Cpu
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { NutritionMealPlans } from '@/components/nutrition/NutritionMealPlans';
import type { Food } from '@/types/nutrition';
import { localDayBounds } from '@/lib/date';
import { useHunterStore } from '@/stores/useHunterStore';
import { calculateNutritionTargets } from '@/lib/nutritionTargets';

interface FoodLog {
  id: string;
  food_id: string;
  quantity_grams: number;
  meal_type: string;
  logged_at: string;
  food?: Food;
}

export function Nutrition() {
  const { user } = useAuth();
  const hunterProfile = useHunterStore();

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
  const [iaSuccessAlert, setIaSuccessAlert] = useState<{
    mealName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    xp: number;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) {
      setLoading(false);
      setFoods([]);
      setLogs([]);
      return;
    }
    setLoading(true);
    setDataError(null);

    const safetyTimer = setTimeout(() => {
      setLoading(false);
      console.warn('[Nutrition] Safety timeout disparado.');
    }, 5000);
    
    try {
      const { startIso } = localDayBounds();
      const [
        { data: foodData, error: foodError },
        { data: logData, error: logError }
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
          .order('logged_at', { ascending: false })
      ]);
      
      if (foodError) throw foodError;
      setFoods(foodData || []);
 
      if (logError) throw logError;
      setLogs(logData || []);
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
      const isCustomUnit = !!selectedFood.serving_unit && !!selectedFood.serving_size;
      const finalGrams = isCustomUnit ? quantity * (100 / selectedFood.serving_size!) : quantity;

      const { error } = await supabase.from('food_logs').insert({
        user_id: user.id,
        food_id: selectedFood.id,
        quantity_grams: finalGrams,
        meal_type: mealType,
      });

      if (error) throw error;
      
      setIsModalOpen(false);
      setSelectedFood(null);
      setQuantity(100);
      fetchData();
    } catch (err) {
      console.error('Error logging food:', err);
    }
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
    setIaSuccessAlert(null);

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
Sua tarefa é analisar a descrição livre da refeição do caçador e retornar EXCLUSIVAMENTE um objeto JSON estruturado contendo a estimativa de macronutrientes do prato inteiro.
Não insira nenhuma introdução, conclusão ou texto explicativo. Retorne apenas o JSON.

Formato do JSON esperado:
{
  "meal_name": "Nome descritivo em português, curto, em caixa alta (ex: PRATO DE ARROZ, FEIJÃO E FRANGO GRELHADO)",
  "calories": 450, // número inteiro de calorias totais
  "protein": 32,   // gramas totais de proteína (número)
  "carbs": 48,     // gramas totais de carboidratos (número)
  "fat": 11,       // gramas totais de gordura (número)
  "total_grams": 350 // estimativa do peso total da refeição em gramas (número)
}

Caso o texto do caçador não contenha comida válida ou seja sem sentido, tente estimar ou assuma uma refeição padrão simples baseada nas palavras que encontrar.`
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
      const { meal_name, calories, protein, carbs, fat, total_grams } = parsedData;

      if (!meal_name || !calories || !total_grams) {
        throw new Error('Formato de dados incompleto retornado pelo modelo de IA.');
      }

      // 1. Converter valores para a base de 100g para salvar na tabela `foods`
      const scaleFactor = 100 / total_grams;
      const calories_per_100g = Math.round(calories * scaleFactor);
      const protein_per_100g = Number((protein * scaleFactor).toFixed(1));
      const carbs_per_100g = Number((carbs * scaleFactor).toFixed(1));
      const fat_per_100g = Number((fat * scaleFactor).toFixed(1));

      // 2. Inserir comida customizada na tabela `foods`
      const { data: food, error: foodError } = await supabase
        .from('foods')
        .insert({
          name: meal_name,
          calories_per_100g,
          protein_per_100g,
          carbs_per_100g,
          fat_per_100g,
          category: 'Outros',
          is_custom: true,
          created_by: user.id
        })
        .select()
        .single();

      if (foodError) throw foodError;

      // 3. Inserir log correspondente em `food_logs`
      const { error: logError } = await supabase
        .from('food_logs')
        .insert({
          user_id: user.id,
          food_id: food.id,
          quantity_grams: total_grams,
          meal_type: iaMealType
        });

      if (logError) throw logError;

      // 4. Configurar sucesso para o alert animado. XP nutricional e boss sao avaliados no fechamento diario.
      setIaSuccessAlert({
        mealName: meal_name,
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
        xp: 0
      });

      // Resetar campo de entrada de texto
      setIaTextInput('');

      // Recarregar os dados na tela
      await fetchData();

    } catch (err: any) {
      console.error('[Códex IA] Erro ao processar:', err);
      setIaError(err.message || 'Houve uma anomalia na calibração neural. Tente novamente.');
    } finally {
      setIaLoading(false);
    }
  }

  const filteredFoods = foods.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dailyMacros = logs.reduce((acc, log) => {
    if (!log.food) return acc;
    const ratio = log.quantity_grams / 100;
    return {
      kcal: acc.kcal + (log.food.calories_per_100g || 0) * ratio,
      protein: acc.protein + (log.food.protein_per_100g || 0) * ratio,
      carbs: acc.carbs + (log.food.carbs_per_100g || 0) * ratio,
      fat: acc.fat + (log.food.fat_per_100g || 0) * ratio,
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-1 w-4 bg-purple-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500">Resource Recovery</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Recuperação de <span className="text-purple-500">Mana</span>
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
          { id: 'diario', label: 'Diário e Códex', icon: BookOpen },
          { id: 'cardapios', label: 'Cardápios do Caçador', icon: UtensilsCrossed },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`relative flex items-center gap-2 px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
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
        <NutritionMealPlans foods={foods} />
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
          {/* Painel Consolidado de Macros do Dia */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Calorias */}
            <div className="relative overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-lg">
              <div className="absolute right-4 top-4 size-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <Flame className="size-5 animate-pulse" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Energia Diária</span>
              <h3 className="mt-2 text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {dailyMacros.kcal.toFixed(0)} <span className="text-xs text-orange-400">kcal</span>
              </h3>
            </div>

            {/* Proteínas */}
            <div className="relative overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-lg">
              <div className="absolute right-4 top-4 size-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Zap className="size-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Proteínas</span>
              <h3 className="mt-2 text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {dailyMacros.protein.toFixed(1)} <span className="text-xs text-purple-400">g</span>
              </h3>
            </div>

            {/* Carboidratos */}
            <div className="relative overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-lg">
              <div className="absolute right-4 top-4 size-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                <Apple className="size-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Carboidratos</span>
              <h3 className="mt-2 text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {dailyMacros.carbs.toFixed(1)} <span className="text-xs text-green-400">g</span>
              </h3>
            </div>

            {/* Gorduras */}
            <div className="relative overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-lg">
              <div className="absolute right-4 top-4 size-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Droplets className="size-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Gorduras</span>
              <h3 className="mt-2 text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {dailyMacros.fat.toFixed(1)} <span className="text-xs text-blue-400">g</span>
              </h3>
            </div>
          </div>

          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5 shadow-lg">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                  Meta Calorica Diaria
                </span>
                <h2 className="mt-1 text-xl font-black uppercase text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {nutritionTargets.targetCalories
                    ? `${Math.round(dailyMacros.kcal)} / ${nutritionTargets.targetCalories} kcal`
                    : 'Perfil incompleto'}
                </h2>
                <p className="mt-2 text-xs font-semibold text-gray-500">
                  {nutritionTargets.targetCalories
                    ? `Faltam ${Math.round(remainingCalories ?? 0)} kcal para sua meta de ${nutritionTargets.goalLabel.toLowerCase()}.`
                    : `Faltam no perfil: ${nutritionTargets.missingFields.join(', ') || 'dados fisicos'}. Atualize em Ajustes.`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[560px]">
                <div className="rounded-xl border border-[#1E1E26] bg-black/30 p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Objetivo</p>
                  <p className="mt-1 text-xs font-black uppercase text-orange-300">{nutritionTargets.goalLabel}</p>
                </div>
                <div className="rounded-xl border border-[#1E1E26] bg-black/30 p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">TMB</p>
                  <p className="mt-1 text-xs font-black text-white">{nutritionTargets.bmr ?? '--'} kcal</p>
                </div>
                <div className="rounded-xl border border-[#1E1E26] bg-black/30 p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Manutencao</p>
                  <p className="mt-1 text-xs font-black text-white">{nutritionTargets.maintenanceCalories ?? '--'} kcal</p>
                </div>
                <div className="rounded-xl border border-[#1E1E26] bg-black/30 p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Faixa XP</p>
                  <p className="mt-1 text-xs font-black text-white">
                    {nutritionTargets.minCalories && nutritionTargets.maxCalories
                      ? `${nutritionTargets.minCalories}-${nutritionTargets.maxCalories}`
                      : '--'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Layout de 2 Colunas */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            
            {/* Coluna Principal das Sub-Abas */}
            <div className="lg:col-span-3 space-y-4">
              
              {/* Seletor Cyberpunk de Sub-Abas */}
              <div className="flex gap-2 rounded-xl bg-[#0F0F13] border border-[#1E1E26] p-1.5 w-fit">
                <button
                  onClick={() => setSubTab('codex')}
                  className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                    subTab === 'codex' 
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Sparkles size={12} className={subTab === 'codex' ? "animate-pulse" : ""} />
                  Códex da Alimentação
                </button>
                <button
                  onClick={() => setSubTab('library')}
                  className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                    subTab === 'library' 
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <BookOpen size={12} />
                  Biblioteca de Itens
                </button>
              </div>

              {/* Conteúdo: Códex da Alimentação (IA) */}
              {subTab === 'codex' && (
                <div className="rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-6 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-purple-500/5 blur-3xl" />
                  
                  <div className="space-y-1 relative z-10">
                    <div className="flex items-center gap-2 text-purple-400">
                      <Brain size={16} className="animate-pulse" />
                      <h2 className="text-sm font-black uppercase tracking-widest italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        CÓDEX DA ALIMENTAÇÃO (IA)
                      </h2>
                    </div>
                    <p className="text-xs text-gray-500">
                      Descreva sua refeição de forma livre. O Códex neural estimará os macros e registrará o suprimento em seu banco de dados automaticamente.
                    </p>
                  </div>

                  {/* Formulário do Códex */}
                  <div className="space-y-4 relative z-10">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Descrição Livre do Prato</label>
                      <textarea
                        value={iaTextInput}
                        onChange={(e) => setIaTextInput(e.target.value)}
                        placeholder="Ex: Almocei 150g de filé de frango, 200g de arroz integral, 100g de feijão carioca e salada com uma colher de sopa de azeite..."
                        rows={4}
                        className="w-full rounded-xl border border-[#1E1E26] bg-[#0A0A0D] p-4 text-sm text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:shadow-[0_0_15px_rgba(168,85,247,0.15)] focus:outline-none transition-all resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Período de Consumo</label>
                        <select
                          value={iaMealType}
                          onChange={(e) => setIaMealType(e.target.value)}
                          className="w-full rounded-xl border border-[#1E1E26] bg-[#0A0A0D] p-4 text-sm text-white focus:border-purple-500 focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value="Café da Manhã">Café da Manhã</option>
                          <option value="Almoço">Almoço</option>
                          <option value="Café da Tarde">Café da Tarde</option>
                          <option value="Jantar">Jantar</option>
                          <option value="Lanche">Lanche</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={handleAnalyzeMealIa}
                          disabled={iaLoading}
                          className="w-full rounded-xl bg-purple-600/90 hover:bg-purple-500 disabled:bg-purple-900/40 disabled:text-gray-500 text-white font-black uppercase tracking-widest text-xs py-4.5 px-4 flex items-center justify-center gap-2 border border-purple-500/30 transition-all cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.1)] active:scale-95"
                          style={{ fontFamily: 'Orbitron, sans-serif' }}
                        >
                          {iaLoading ? (
                            <>
                              <Cpu size={14} className="animate-spin text-purple-400" />
                              Calibrando Suprimentos...
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} className="text-purple-300" />
                              Calibrar Nutrientes (IA)
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

                    {iaSuccessAlert && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-5 space-y-3 relative z-10 shadow-[0_0_20px_rgba(168,85,247,0.05)]"
                      >
                        <div className="flex items-center gap-2 text-purple-400">
                          <Zap size={16} className="animate-bounce" />
                          <span className="font-black text-xs uppercase tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            REFEIÇÃO CATALOGADA COM SUCESSO!
                          </span>
                        </div>
                        <div className="text-xs text-gray-300">
                          <p className="font-bold text-white text-sm uppercase">{iaSuccessAlert.mealName}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                            <div className="bg-[#0A0A0D] border border-[#1E1E26] p-2 rounded-lg text-center">
                              <span className="text-[9px] text-gray-500 uppercase block font-black">Energia</span>
                              <span className="text-sm font-bold text-orange-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>+{iaSuccessAlert.calories} kcal</span>
                            </div>
                            <div className="bg-[#0A0A0D] border border-[#1E1E26] p-2 rounded-lg text-center">
                              <span className="text-[9px] text-gray-500 uppercase block font-black">Proteína</span>
                              <span className="text-sm font-bold text-purple-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>+{iaSuccessAlert.protein}g</span>
                            </div>
                            <div className="bg-[#0A0A0D] border border-[#1E1E26] p-2 rounded-lg text-center">
                              <span className="text-[9px] text-gray-500 uppercase block font-black">Carbos</span>
                              <span className="text-sm font-bold text-green-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>+{iaSuccessAlert.carbs}g</span>
                            </div>
                            <div className="bg-[#0A0A0D] border border-[#1E1E26] p-2 rounded-lg text-center">
                              <span className="text-[9px] text-gray-500 uppercase block font-black">Gordura</span>
                              <span className="text-sm font-bold text-blue-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>+{iaSuccessAlert.fat}g</span>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-3 py-2.5 rounded-lg border border-purple-500/20">
                            <span>SISTEMA: registro computado para a avaliacao diaria</span>
                            <span>ATAQUE AO BOSS: -15 HP (CRÍTICO!)</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{food.calories_per_100g} KCAL</span>
                            </div>
                            <div>
                              <h3 className="font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>{food.name}</h3>
                              <p className="mt-1 text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] italic">
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
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Alimento</th>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Calorias (100g)</th>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Proteína (100g)</th>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Categoria</th>
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
            <div className="space-y-4">
              <div className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6 shadow-lg">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-widest text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    CONSUMO DIÁRIO
                  </h2>
                  <History className="size-4 text-purple-500" />
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {logs.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-[10px] uppercase font-bold text-gray-600">Nenhum nutriente detectado.</p>
                    </div>
                  ) : (
                    logs.map((log) => {
                      const isCustom = !!log.food?.serving_unit && !!log.food?.serving_size;
                      const displayQty = isCustom ? Number((log.quantity_grams / (100 / log.food!.serving_size!)).toFixed(2)) : log.quantity_grams;
                      const displayUnit = isCustom ? log.food!.serving_unit : 'G';
                      const ratio = log.quantity_grams / 100;
                      const kcal = (log.food?.calories_per_100g || 0) * ratio;

                      return (
                        <div key={log.id} className="relative overflow-hidden rounded-xl border border-[#1E1E26] bg-white/5 p-4 transition-all hover:bg-white/10">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-white uppercase truncate pr-4">{log.food?.name}</p>
                            <span className="text-[9px] font-black text-purple-500 uppercase tracking-tighter bg-purple-500/10 px-1.5 py-0.5 rounded">
                              {log.meal_type}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                              {displayQty}{displayUnit} • {kcal.toFixed(0)} KCAL
                            </p>
                            <p className="text-[9px] font-bold text-gray-700 uppercase">
                              {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
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
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-8 shadow-2xl"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
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
                    Registrar <span className="text-purple-500">Recuperação</span>
                  </h2>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-600">{selectedFood.name}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Tipo de Recurso</label>
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
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Conversão de Energia</span>
                    <span className="text-lg font-black text-purple-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {((selectedFood.calories_per_100g * ((selectedFood.serving_size ? quantity * (100 / selectedFood.serving_size) : quantity) / 100))).toFixed(0)} kcal
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleLogFood}
                  className="w-full rounded-2xl bg-purple-600 py-5 font-black uppercase italic tracking-[0.2em] text-white transition-all hover:bg-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Confirmar Recuperação
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
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Nome do Item</label>
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
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Kcal (por porção/100g)</label>
                    <input 
                      type="number" 
                      value={newFoodCals}
                      onChange={(e) => setNewFoodCals(parseFloat(e.target.value))}
                      className="w-full rounded-xl border border-[#1E1E26] bg-black p-4 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Proteína (g)</label>
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
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Carbos (g)</label>
                    <input 
                      type="number" 
                      value={newFoodCarbs}
                      onChange={(e) => setNewFoodCarbs(parseFloat(e.target.value))}
                      className="w-full rounded-xl border border-[#1E1E26] bg-black p-4 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Gorduras (g)</label>
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
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
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
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
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
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Categoria</label>
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

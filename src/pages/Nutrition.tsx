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
  BookOpen
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { NutritionMealPlans } from '@/components/nutrition/NutritionMealPlans';
import type { Food } from '@/types/nutrition';

// Food type now in @/types/nutrition

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
  const [activeTab, setActiveTab] = useState<'library' | 'cardapios'>('cardapios');
  const [foods, setFoods] = useState<Food[]>([]);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    // Se não há usuário, reseta o loading imediatamente (evita skeleton eterno)
    if (!user) {
      setLoading(false);
      setFoods([]);
      setLogs([]);
      return;
    }
    setLoading(true);

    // Safety timeout de 5s para evitar skeleton eterno em caso de lentidão
    const safetyTimer = setTimeout(() => {
      setLoading(false);
      console.warn('[Nutrition] Safety timeout disparado.');
    }, 5000);
    
    try {
      const today = new Date().toISOString().split('T')[0];
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
          .gte('logged_at', `${today}T00:00:00Z`)
          .order('logged_at', { ascending: false })
      ]);
      
      if (foodError) throw foodError;
      setFoods(foodData || []);
 
      if (logError) throw logError;
      setLogs(logData || []);
    } catch (err) {
      console.error('Error fetching nutrition data:', err);
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
        user_id: user.id,
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
        
        {activeTab === 'library' && (
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
          { id: 'cardapios', label: 'Meus Cardápios', icon: UtensilsCrossed },
          { id: 'library', label: 'Biblioteca', icon: BookOpen },
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

      {/* Library Tab wrapper */}
      {activeTab === 'library' && <>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Biblioteca de Alimentos */}
        <div className="lg:col-span-3 space-y-4">
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
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
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
                  <motion.button
                    key={food.id}
                    whileHover={{ y: -4, borderColor: 'rgba(168,85,247,0.5)' }}
                    onClick={() => {
                      setSelectedFood(food);
                      setIsModalOpen(true);
                    }}
                    className="flex flex-col gap-3 rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 text-left transition-all hover:bg-[#16161D]"
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
                  </motion.button>
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

        {/* Sidebar Logs */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                CONSUMO DIÁRIO
              </h2>
              <History className="size-4 text-purple-500" />
            </div>

            <div className="space-y-3">
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
      </>
      }
    </div>
  );
}

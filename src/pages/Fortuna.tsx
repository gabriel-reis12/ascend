import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Trash2, 
  History, 
  Sparkles, 
  Lock, 
  Target, 
  Briefcase, 
  ShoppingCart, 
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useHunterStore } from '@/stores/useHunterStore';
import { useBossStore } from '@/stores/useBossStore';

interface FinancialLog {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'investment';
  category: string;
  date: string;
  created_at: string;
}

export function Fortuna() {
  const { user } = useAuth();
  const hunterStore = useHunterStore();
  const bossStore = useBossStore();

  const [logs, setLogs] = useState<FinancialLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [type, setType] = useState<'income' | 'expense' | 'investment'>('expense');
  const [category, setCategory] = useState('Outros');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD local

  // Meta de Aporte
  const [monthlyTarget, setMonthlyTarget] = useState<number>(1000);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState<number | ''>(1000);

  // Feedbacks
  const [formLoading, setFormLoading] = useState(false);
  const [successAlert, setSuccessAlert] = useState<{
    desc: string;
    amount: number;
    type: string;
    xp: number;
    wisdom: number;
  } | null>(null);

  const categoriesByType = {
    income: ['Salário', 'Freelance', 'Rendimentos', 'Vendas', 'Outros'],
    expense: ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Assinaturas', 'Outros'],
    investment: ['Ações', 'FIIs', 'Renda Fixa', 'Criptomoedas', 'Reserva de Emergência', 'Outros']
  };

  useEffect(() => {
    setCategory(categoriesByType[type][0]);
  }, [type]);

  useEffect(() => {
    fetchFinancialData();
  }, [user]);

  async function fetchFinancialData() {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA');

      const { data, error: fetchErr } = await supabase
        .from('financial_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setLogs(data || []);
    } catch (err: any) {
      console.error('[Fortuna] Erro ao buscar dados financeiros:', err);
      setError(err.message || 'Erro ao sincronizar com o banco.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!description.trim() || !amount || amount <= 0) {
      setError('Por favor, preencha a descrição e um valor maior que zero.');
      return;
    }

    setFormLoading(true);
    setError(null);
    setSuccessAlert(null);

    try {
      const { data, error: insertErr } = await supabase
        .from('financial_logs')
        .insert({
          user_id: user.id,
          description: description.trim(),
          amount: Number(amount),
          type,
          category,
          date
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Ganhar XP e Sabedoria
      let xpGained = 10;
      let wisGained = 0;

      if (type === 'investment') {
        wisGained = 1;
        // Investimentos geram sabedoria (+1 WIS)
        await hunterStore.updateStat('wisdom', 1, user.id);
      }
      
      await hunterStore.addXp(xpGained, user.id);

      // Atacar Boss ativo com dano de finanças
      await bossStore.attackActiveBoss(user.id, 10, 'finance');

      setSuccessAlert({
        desc: description.trim(),
        amount: Number(amount),
        type,
        xp: xpGained,
        wisdom: wisGained
      });

      // Limpar formulário
      setDescription('');
      setAmount('');
      setDate(new Date().toLocaleDateString('en-CA'));

      // Recarregar logs
      await fetchFinancialData();
    } catch (err: any) {
      console.error('[Fortuna] Erro ao cadastrar transação:', err);
      setError(err.message || 'Erro ao registrar transação no Supabase.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeleteTransaction(id: string) {
    if (!user) return;
    try {
      const { error: deleteErr } = await supabase
        .from('financial_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteErr) throw deleteErr;

      // Recarregar logs
      await fetchFinancialData();
    } catch (err: any) {
      console.error('[Fortuna] Erro ao deletar transação:', err);
      setError(err.message || 'Erro ao excluir a transação.');
    }
  }

  // Cálculos consolidados do mês
  const monthlySummary = logs.reduce((acc, log) => {
    if (log.type === 'income') {
      acc.income += Number(log.amount);
    } else if (log.type === 'expense') {
      acc.expense += Number(log.amount);
    } else if (log.type === 'investment') {
      acc.investment += Number(log.amount);
    }
    return acc;
  }, { income: 0, expense: 0, investment: 0 });

  const totalOutflow = monthlySummary.expense + monthlySummary.investment;
  const savingsRate = monthlySummary.income > 0 
    ? ((monthlySummary.income - monthlySummary.expense) / monthlySummary.income) * 100 
    : 0;

  const investmentRate = monthlySummary.income > 0 
    ? (monthlySummary.investment / monthlySummary.income) * 100 
    : 0;

  const targetProgress = Math.min(100, (monthlySummary.investment / monthlyTarget) * 100);

  function handleSaveTarget() {
    if (tempTarget !== '' && tempTarget > 0) {
      setMonthlyTarget(Number(tempTarget));
      setIsEditingTarget(false);
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
              Gestão de Recursos
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Atributo: WIS (Sabedoria)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white font-orbitron">
            Módulo <span className="text-amber-400">Fortuna</span>
          </h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500 leading-relaxed">
            Controle de fluxo de moedas e rito de investimentos para purificação de dívidas.
          </p>
        </div>
        <div className="flex items-center gap-3 z-10">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Coins size={18} />
          </div>
        </div>
      </div>

      {/* Visores de Resumo Financeiro (Topo) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-lg">
          <div className="absolute right-4 top-4 size-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ArrowUpRight size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ganhos do Mês</span>
          <h3 className="mt-2 text-xl sm:text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            R$ {monthlySummary.income.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>

        {/* Despesa */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-lg">
          <div className="absolute right-4 top-4 size-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <ArrowDownLeft size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Gastos do Mês</span>
          <h3 className="mt-2 text-xl sm:text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            R$ {monthlySummary.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>

        {/* Investimento */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-lg">
          <div className="absolute right-4 top-4 size-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Coins size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Aportado no Mês</span>
          <h3 className="mt-2 text-xl sm:text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            R$ {monthlySummary.investment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>

        {/* Taxas de Economia */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-lg">
          <div className="absolute right-4 top-4 size-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <DollarSign size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Aporte / Poupança</span>
          <h3 className="mt-2 text-lg sm:text-xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {investmentRate.toFixed(0)}% <span className="text-xs text-gray-600">/</span> {savingsRate.toFixed(0)}%
          </h3>
        </div>
      </div>

      {/* Grid de 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Coluna Principal: Formulário e Histórico */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Formulário de Nova Transação */}
          <div className="rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#1E1E26] pb-3 text-amber-400">
              <Plus size={16} />
              <h2 className="text-xs font-black uppercase tracking-widest font-orbitron">
                Registrar Fluxo de Recurso
              </h2>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Descrição</label>
                  <input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Salário, Supermercado, Aporte FIIs..."
                    className="w-full rounded-xl border border-[#1E1E26] bg-[#0A0A0D] p-4 text-sm text-white placeholder:text-gray-600 focus:border-amber-500/40 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-[#1E1E26] bg-[#0A0A0D] p-4 text-sm text-white placeholder:text-gray-600 focus:border-amber-500/40 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Tipo</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full rounded-xl border border-[#1E1E26] bg-[#0A0A0D] p-4 text-sm text-white focus:border-amber-500/40 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="expense">Despesa (Saída)</option>
                    <option value="income">Receita (Entrada)</option>
                    <option value="investment">Investimento / Aporte</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Categoria</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-[#1E1E26] bg-[#0A0A0D] p-4 text-sm text-white focus:border-amber-500/40 focus:outline-none appearance-none cursor-pointer"
                  >
                    {categoriesByType[type].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Data</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-[#1E1E26] bg-[#0A0A0D] p-4 text-sm text-white focus:border-amber-500/40 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full rounded-xl bg-amber-600/90 hover:bg-amber-500 disabled:bg-amber-900/40 disabled:text-gray-500 text-white font-black uppercase tracking-widest text-xs py-4 px-4 border border-amber-500/30 transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.05)] active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {formLoading ? 'Registrando no Codex...' : 'Registrar Transação'}
              </button>
            </form>

            {/* Banners de Sucesso ou Erro */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-400 flex items-start gap-2"
                >
                  <ShieldAlert className="size-4 shrink-0 text-rose-400" />
                  <div>
                    <span className="font-bold">ANOMALIA FINANCEIRA:</span> {error}
                  </div>
                </motion.div>
              )}

              {successAlert && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-2 relative overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.05)]"
                >
                  <div className="flex items-center gap-2 text-amber-400">
                    <Sparkles size={16} className="animate-bounce" />
                    <span className="font-black text-xs uppercase tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      REGISTRO PERSISTIDO NO CODEX NEURAL
                    </span>
                  </div>
                  <div className="text-xs text-gray-300">
                    <p className="font-semibold text-white">
                      Lançamento de <span className="uppercase text-amber-400 font-bold">{successAlert.desc}</span> no valor de R$ {successAlert.amount.toFixed(2)} registrado.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
                      <span>SISTEMA: +{successAlert.xp} XP obtidos</span>
                      {successAlert.wisdom > 0 && (
                        <>
                          <span className="text-gray-600">|</span>
                          <span className="text-blue-400">ATRIBUTOS: +{successAlert.wisdom} Sabedoria (WIS)</span>
                        </>
                      )}
                      <span className="text-gray-600">|</span>
                      <span>ATAQUE AO BOSS: -10 HP</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Histórico Recente */}
          <div className="rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E1E26] pb-3">
              <div className="flex items-center gap-2 text-gray-400">
                <History size={16} />
                <h2 className="text-xs font-black uppercase tracking-widest font-orbitron">
                  Registros do Mês Atual
                </h2>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#1E1E26] bg-black/30">
              {loading ? (
                <div className="p-8 text-center space-y-2">
                  <div className="size-8 rounded-full border-2 border-amber-500/10 border-t-amber-500 animate-spin mx-auto" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Lendo logs de transações...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-[10px] uppercase font-bold text-gray-600">Nenhum fluxo de moedas registrado este mês.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1E1E26] bg-white/5 text-[9px] font-black uppercase tracking-widest text-gray-400">
                        <th className="px-5 py-3">Descrição</th>
                        <th className="px-5 py-3">Categoria</th>
                        <th className="px-5 py-3">Tipo</th>
                        <th className="px-5 py-3">Valor</th>
                        <th className="px-5 py-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E1E26] text-xs">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3">
                            <span className="font-bold text-white uppercase">{log.description}</span>
                            <span className="block text-[9px] text-gray-600 font-bold uppercase mt-0.5">
                              {new Date(log.date).toLocaleDateString('pt-BR')}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-gray-500/10 border border-gray-500/25 text-gray-400">
                              {log.category}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${
                              log.type === 'income' 
                                ? 'text-emerald-400' 
                                : log.type === 'expense' 
                                  ? 'text-rose-400' 
                                  : 'text-amber-400'
                            }`}>
                              {log.type === 'income' ? 'Receita' : log.type === 'expense' ? 'Despesa' : 'Aporte'}
                            </span>
                          </td>
                          <td className={`px-5 py-3 font-bold font-orbitron ${
                            log.type === 'income' 
                              ? 'text-emerald-400' 
                              : log.type === 'expense' 
                                ? 'text-rose-400' 
                                : 'text-amber-400'
                          }`}>
                            {log.type === 'income' ? '+' : '-'} R$ {log.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleDeleteTransaction(log.id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Excluir transação"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Coluna Lateral: Metas e Dicas */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Meta de Aportes */}
          <div className="rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E1E26] pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Target size={16} />
                <h2 className="text-xs font-black uppercase tracking-widest font-orbitron">
                  Meta de Aporte Mensal
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block">Progresso</span>
                  <span className="text-base font-black text-white font-orbitron">
                    R$ {monthlySummary.investment.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block">Meta</span>
                  
                  {isEditingTarget ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input 
                        type="number"
                        value={tempTarget}
                        onChange={(e) => setTempTarget(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-20 rounded border border-[#1E1E26] bg-[#0A0A0D] py-0.5 px-1.5 text-xs text-white focus:outline-none"
                      />
                      <button 
                        onClick={handleSaveTarget}
                        className="bg-amber-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black cursor-pointer"
                      >
                        SALVAR
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 justify-end mt-1">
                      <span className="text-sm font-bold text-amber-400 font-orbitron">
                        R$ {monthlyTarget.toLocaleString('pt-BR')}
                      </span>
                      <button 
                        onClick={() => {
                          setTempTarget(monthlyTarget);
                          setIsEditingTarget(true);
                        }}
                        className="text-[9px] text-gray-500 hover:text-white uppercase font-black"
                      >
                        [EDITAR]
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="space-y-1">
                <div className="h-3 w-full bg-black/50 rounded-full border border-[#1e1e26] p-[2px] overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    style={{ width: `${targetProgress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-600">
                  <span>{targetProgress.toFixed(0)}% Concluído</span>
                  {targetProgress >= 100 && (
                    <span className="text-amber-400 animate-pulse">REQUISITO ALCANÇADO!</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dicas do Códex */}
          <div className="rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-28 h-28 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2 text-blue-400 border-b border-[#1E1E26] pb-3">
              <Sparkles size={16} />
              <h2 className="text-xs font-black uppercase tracking-widest font-orbitron">
                Provérbios da Sabedoria (WIS)
              </h2>
            </div>

            <div className="space-y-3 text-xs text-gray-400 leading-relaxed font-semibold">
              <p>
                🛡️ <span className="text-white">Aporte de Proteção:</span> Investidores consistentes mitigam o poder do <span className="text-rose-400">Mercador das Dívidas</span>. Cada aporte causa dano crítico!
              </p>
              <p>
                ⚖️ <span className="text-white">Taxa de Aporte Saudável:</span> Procure direcionar pelo menos <span className="text-amber-400 font-bold">20%</span> da sua receita mensal para aportes/investimentos para purificar seu fluxo energético.
              </p>
              <p>
                🧠 <span className="text-white">Wisdom Stat:</span> O atributo de Sabedoria aumenta sua resiliência a impulsos de gratificação imediata. A Sabedoria é seu escudo!
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

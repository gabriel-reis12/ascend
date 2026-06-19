import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Coins, 
  Trash2, 
  History, 
  Sparkles, 
  Target, 
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Trophy,
  Activity,
  CalendarDays,
  ChevronDown,
  Gauge,
  Landmark
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

interface FinancialGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  type: 'one_time' | 'recurring_monthly';
  completed: boolean;
  created_at: string;
}

export function Fortuna() {
  const { user } = useAuth();
  const hunterStore = useHunterStore();
  const bossStore = useBossStore();

  const [logs, setLogs] = useState<FinancialLog[]>([]);
  const [previousMonthLogs, setPreviousMonthLogs] = useState<FinancialLog[]>([]);
  const [investmentDates, setInvestmentDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [type, setType] = useState<'income' | 'expense' | 'investment'>('expense');
  const [category, setCategory] = useState('Outros');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD local

  // Metas & Objetivos
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState<number | ''>('');
  const [goalType, setGoalType] = useState<'one_time' | 'recurring_monthly'>('one_time');
  const [goalCurrent, setGoalCurrent] = useState<number | ''>('');
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [tempGoalProgress, setTempGoalProgress] = useState<number | ''>('');

  // Feedbacks
  const [formLoading, setFormLoading] = useState(false);
  const [showAdvancedFlow, setShowAdvancedFlow] = useState(false);
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
    fetchFinancialData();
    fetchGoals();
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

      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString('en-CA');
      const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0).toLocaleDateString('en-CA');

      const [currentResult, previousResult, investmentResult] = await Promise.all([
        supabase
          .from('financial_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startOfMonth)
          .lte('date', endOfMonth)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('financial_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startOfPreviousMonth)
          .lte('date', endOfPreviousMonth),
        supabase
          .from('financial_logs')
          .select('date')
          .eq('user_id', user.id)
          .eq('type', 'investment')
          .order('date', { ascending: false }),
      ]);

      if (currentResult.error) throw currentResult.error;
      if (previousResult.error) throw previousResult.error;
      if (investmentResult.error) throw investmentResult.error;
      setLogs(currentResult.data || []);
      setPreviousMonthLogs(previousResult.data || []);
      setInvestmentDates((investmentResult.data || []).map(item => item.date));
    } catch (err: unknown) {
      console.error('[Fortuna] Erro ao buscar dados financeiros:', err);
      setError(err instanceof Error ? err.message : 'Erro ao sincronizar com o banco.');
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
      const { error: insertErr } = await supabase
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
      const xpGained = 10;
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
    } catch (err: unknown) {
      console.error('[Fortuna] Erro ao cadastrar transação:', err);
      setError(err instanceof Error ? err.message : 'Erro ao registrar transação no Supabase.');
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
    } catch (err: unknown) {
      console.error('[Fortuna] Erro ao deletar transação:', err);
      setError(err instanceof Error ? err.message : 'Erro ao excluir a transação.');
    }
  }

  async function fetchGoals() {
    if (!user) {
      setLoadingGoals(false);
      return;
    }
    setLoadingGoals(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setGoals(data || []);
    } catch (err: unknown) {
      console.error('[Fortuna] Erro ao buscar metas financeiras:', err);
    } finally {
      setLoadingGoals(false);
    }
  }

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!goalTitle.trim() || !goalTarget || goalTarget <= 0) {
      setError('Por favor, insira o título e o valor alvo da meta.');
      return;
    }

    try {
      const targetVal = Number(goalTarget);
      const currentVal = Number(goalCurrent || 0);
      const isCompleted = currentVal >= targetVal;

      const { error: insertErr } = await supabase
        .from('financial_goals')
        .insert({
          user_id: user.id,
          title: goalTitle.trim(),
          target_amount: targetVal,
          current_amount: currentVal,
          type: goalType,
          completed: isCompleted
        });

      if (insertErr) throw insertErr;

      // Recompensa se já iniciar completa
      if (isCompleted) {
        await hunterStore.addXp(50, user.id);
        await hunterStore.updateStat('wisdom', 2, user.id);
        setSuccessAlert({
          desc: `Meta criada e concluída: "${goalTitle.trim()}"`,
          amount: targetVal,
          type: 'investment',
          xp: 50,
          wisdom: 2
        });
      } else {
        setSuccessAlert({
          desc: `Meta criada: "${goalTitle.trim()}"`,
          amount: targetVal,
          type: 'investment',
          xp: 10,
          wisdom: 0
        });
        await hunterStore.addXp(10, user.id);
      }

      setGoalTitle('');
      setGoalTarget('');
      setGoalCurrent('');
      setGoalType('one_time');
      setShowNewGoalForm(false);
      await fetchGoals();
    } catch (err: unknown) {
      console.error('[Fortuna] Erro ao criar meta:', err);
      setError(err instanceof Error ? err.message : 'Erro ao registrar a meta.');
    }
  }

  async function handleUpdateGoalProgress(goal: FinancialGoal, newAmount: number) {
    if (!user) return;
    const isCompleted = newAmount >= goal.target_amount;
    const justCompleted = isCompleted && !goal.completed;

    try {
      const { error: updateErr } = await supabase
        .from('financial_goals')
        .update({
          current_amount: newAmount,
          completed: isCompleted
        })
        .eq('id', goal.id)
        .eq('user_id', user.id);

      if (updateErr) throw updateErr;

      if (justCompleted) {
        // Conceder recompensa lendária por meta concluída (+50 XP e +2 WIS)
        await hunterStore.addXp(50, user.id);
        await hunterStore.updateStat('wisdom', 2, user.id);

        setSuccessAlert({
          desc: `CONQUISTA: Meta "${goal.title}" concluída com sucesso!`,
          amount: goal.target_amount,
          type: 'investment',
          xp: 50,
          wisdom: 2
        });
      }

      setEditingGoalId(null);
      setTempGoalProgress('');
      await fetchGoals();
    } catch (err: unknown) {
      console.error('[Fortuna] Erro ao atualizar progresso da meta:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar o progresso.');
    }
  }

  async function handleDeleteGoal(id: string) {
    if (!user) return;
    try {
      const { error: deleteErr } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteErr) throw deleteErr;
      await fetchGoals();
    } catch (err: unknown) {
      console.error('[Fortuna] Erro ao deletar meta:', err);
      setError(err instanceof Error ? err.message : 'Erro ao excluir a meta.');
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
  const previousSummary = previousMonthLogs.reduce((acc, log) => {
    acc[log.type] += Number(log.amount);
    return acc;
  }, { income: 0, expense: 0, investment: 0 });
  const netBalance = monthlySummary.income - totalOutflow;
  const previousNetBalance = previousSummary.income - previousSummary.expense - previousSummary.investment;
  const flowStatus = netBalance > 0 ? 'Fluxo positivo' : netBalance < 0 ? 'Fluxo sob atenção' : 'Fluxo equilibrado';
  const primaryGoal = goals.find(goal => !goal.completed) || goals[0] || null;
  const primaryGoalRemaining = primaryGoal ? Math.max(0, primaryGoal.target_amount - primaryGoal.current_amount) : 0;
  const primaryGoalPct = primaryGoal ? Math.min(100, (primaryGoal.current_amount / primaryGoal.target_amount) * 100) : 0;
  const estimatedGoalMonths = primaryGoal && monthlySummary.investment > 0
    ? Math.max(1, Math.ceil(primaryGoalRemaining / monthlySummary.investment))
    : null;
  const monthlyInvestmentKeys = new Set(investmentDates.map(value => value.slice(0, 7)));
  let contributionStreak = 0;
  const streakCursor = new Date();
  while (monthlyInvestmentKeys.has(`${streakCursor.getFullYear()}-${String(streakCursor.getMonth() + 1).padStart(2, '0')}`)) {
    contributionStreak++;
    streakCursor.setMonth(streakCursor.getMonth() - 1);
  }

  const variationLabel = (current: number, previous: number, inverse = false) => {
    if (previous <= 0) return current > 0 ? 'Primeiro registro comparável' : 'Sem registros no período';
    const variation = ((current - previous) / previous) * 100;
    const favorable = inverse ? variation <= 0 : variation >= 0;
    return `${variation >= 0 ? '+' : ''}${variation.toFixed(0)}% vs mês anterior${favorable ? '' : ' · atenção'}`;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Cabeçalho */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-[#0F0F13] p-6 shadow-[0_0_28px_rgba(245,158,11,0.07)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 grid gap-6 xl:grid-cols-[1fr_1.15fr] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400">
                Central financeira do Sistema
              </span>
              <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-400">
                WIS · Sabedoria
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-black uppercase tracking-wider text-white sm:text-3xl font-orbitron">
              Módulo <span className="text-amber-400">Fortuna</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-400">
              Controle seu fluxo, proteja recursos e transforme consistência financeira em evolução de Sabedoria.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Saldo líquido', value: `R$ ${netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Landmark, tone: netBalance >= 0 ? 'text-emerald-300' : 'text-rose-300' },
              { label: 'Status do fluxo', value: `${flowStatus} · ${netBalance >= previousNetBalance ? 'evoluindo' : 'recalibrar'}`, icon: Activity, tone: netBalance >= 0 ? 'text-emerald-300' : 'text-amber-300' },
              { label: 'Meta principal', value: primaryGoal ? `${primaryGoal.title} · ${primaryGoalPct.toFixed(0)}%${estimatedGoalMonths ? ` · ${estimatedGoalMonths}m` : ''}` : 'Defina um objetivo', icon: Target, tone: 'text-amber-300' },
              { label: 'Consistência', value: `${contributionStreak} ${contributionStreak === 1 ? 'mês com aporte' : 'meses com aporte'}`, icon: CalendarDays, tone: 'text-blue-300' },
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-white/5 bg-black/25 p-3 transition-colors hover:border-white/10">
                <item.icon className={`size-4 ${item.tone}`} />
                <p className="mt-2 text-xs font-medium text-gray-500">{item.label}</p>
                <p className={`mt-1 truncate text-sm font-bold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visores de Resumo Financeiro (Topo) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita */}
        <motion.div whileHover={{ y: -2 }} className="relative overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-lg transition-colors hover:border-emerald-500/20">
          <div className="absolute right-4 top-4 size-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ArrowUpRight size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ganhos do Mês</span>
          <h3 className="mt-2 text-xl sm:text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            R$ {monthlySummary.income.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="mt-3 text-xs text-gray-500">{variationLabel(monthlySummary.income, previousSummary.income)}</p>
        </motion.div>

        {/* Despesa */}
        <motion.div whileHover={{ y: -2 }} className="relative overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-lg transition-colors hover:border-rose-500/20">
          <div className="absolute right-4 top-4 size-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <ArrowDownLeft size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Gastos do Mês</span>
          <h3 className="mt-2 text-xl sm:text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            R$ {monthlySummary.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="mt-3 text-xs text-gray-500">
            {monthlySummary.expense === 0 ? 'Sem saídas registradas' : variationLabel(monthlySummary.expense, previousSummary.expense, true)}
          </p>
        </motion.div>

        {/* Investimento */}
        <motion.div whileHover={{ y: -2 }} className="relative overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-lg transition-colors hover:border-amber-500/25">
          <div className="absolute right-4 top-4 size-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Coins size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Aportado no Mês</span>
          <h3 className="mt-2 text-xl sm:text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            R$ {monthlySummary.investment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="mt-3 text-xs text-gray-500">{investmentRate >= 20 ? 'Meta de proteção atingida' : variationLabel(monthlySummary.investment, previousSummary.investment)}</p>
        </motion.div>

        {/* Taxas de Economia */}
        <motion.div whileHover={{ y: -2 }} className="relative overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-lg transition-colors hover:border-blue-500/20">
          <div className="absolute right-4 top-4 size-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <DollarSign size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Aporte / Poupança</span>
          <h3 className="mt-2 text-lg sm:text-xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {investmentRate.toFixed(0)}% <span className="text-xs text-gray-600">/</span> {savingsRate.toFixed(0)}%
          </h3>
          <p className="mt-3 text-xs text-gray-500">{investmentRate.toFixed(0)}% da renda protegida em aportes</p>
        </motion.div>
      </div>

      {/* Grid de 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Coluna Principal: Formulário e Histórico */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Formulário de Nova Transação */}
          <div className="space-y-5 rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-6 shadow-lg">
            <div className="flex items-center gap-3 border-b border-[#1E1E26] pb-4 text-amber-400">
              <div className="flex size-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                <Plus size={18} />
              </div>
              <div>
                <h2 className="text-base font-black font-orbitron">Registrar fluxo</h2>
                <p className="mt-1 text-xs text-gray-500">Entrada rápida no livro financeiro do Sistema.</p>
              </div>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#1E1E26] bg-black/25 p-1.5">
                {[
                  { value: 'income' as const, label: 'Receita', icon: ArrowUpRight, tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
                  { value: 'expense' as const, label: 'Gasto', icon: ArrowDownLeft, tone: 'border-rose-500/30 bg-rose-500/10 text-rose-300' },
                  { value: 'investment' as const, label: 'Aporte', icon: Coins, tone: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setType(option.value);
                      setCategory(categoriesByType[option.value][0]);
                    }}
                    className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border text-sm font-bold transition-all ${
                      type === option.value ? option.tone : 'border-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300'
                    }`}
                  >
                    <option.icon className="size-4" />
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Descrição</label>
                  <input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Salário, Supermercado, Aporte FIIs..."
                    className="w-full rounded-xl border border-[#1E1E26] bg-[#0A0A0D] p-4 text-sm text-white placeholder:text-gray-600 focus:border-amber-500/40 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Valor (R$)</label>
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

              <button
                type="button"
                onClick={() => setShowAdvancedFlow(current => !current)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-300"
              >
                <ChevronDown className={`size-4 transition-transform ${showAdvancedFlow ? 'rotate-180' : ''}`} />
                Opções avançadas
              </button>

              <AnimatePresence initial={false}>
                {showAdvancedFlow && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 gap-4 rounded-xl border border-white/5 bg-black/20 p-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Categoria</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full cursor-pointer appearance-none rounded-xl border border-[#1E1E26] bg-[#0A0A0D] p-4 text-sm text-white focus:border-amber-500/40 focus:outline-none"
                        >
                          {categoriesByType[type].map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Data</label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full cursor-pointer rounded-xl border border-[#1E1E26] bg-[#0A0A0D] p-4 text-sm text-white focus:border-amber-500/40 focus:outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={formLoading}
                className="flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 px-4 text-sm font-black uppercase text-white shadow-[0_0_22px_rgba(245,158,11,0.14)] transition-all hover:brightness-110 hover:shadow-[0_0_28px_rgba(245,158,11,0.22)] active:scale-[0.98] disabled:bg-amber-900/40 disabled:text-gray-500"
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
                      {logs.map((log) => {
                        const LogIcon = log.type === 'income' ? ArrowUpRight : log.type === 'expense' ? ArrowDownLeft : Coins;
                        const logTone = log.type === 'income'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : log.type === 'expense'
                            ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                            : 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                        return (
                        <tr key={log.id} className="group hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg border ${logTone}`}>
                                <LogIcon className="size-4" />
                              </span>
                              <div>
                                <span className="font-bold text-white">{log.description}</span>
                                <span className="block text-xs text-gray-600 font-semibold mt-0.5">
                                  {new Date(log.date).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-gray-500/10 border border-gray-500/25 text-gray-400">
                              {log.category}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold ${logTone}`}>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Coluna Lateral: Metas e Dicas */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Objetivos & Metas de Longo Prazo */}
          <div className="rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E1E26] pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Target size={16} />
                <h2 className="text-xs font-black uppercase tracking-widest font-orbitron">
                  Objetivos & Metas
                </h2>
              </div>
              <button
                onClick={() => setShowNewGoalForm(!showNewGoalForm)}
                className="text-[10px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/25 cursor-pointer"
              >
                <Plus size={10} />
                {showNewGoalForm ? 'Fechar' : 'Nova'}
              </button>
            </div>

            {/* Form de Nova Meta */}
            <AnimatePresence>
              {showNewGoalForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateGoal}
                  className="space-y-3 bg-[#0A0A0D] p-4 rounded-xl border border-[#1E1E26] overflow-hidden"
                >
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-500">Título do Objetivo</label>
                    <input
                      type="text"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      placeholder="Ex: Guardar 40 mil para o carro"
                      className="w-full rounded-lg border border-[#1E1E26] bg-[#0F0F13] py-2 px-3 text-xs text-white placeholder:text-gray-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-500">Valor Alvo (R$)</label>
                      <input
                        type="number"
                        value={goalTarget}
                        onChange={(e) => setGoalTarget(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="40000"
                        className="w-full rounded-lg border border-[#1E1E26] bg-[#0F0F13] py-2 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-500">Acumulado Inicial (R$)</label>
                      <input
                        type="number"
                        value={goalCurrent}
                        onChange={(e) => setGoalCurrent(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="0"
                        className="w-full rounded-lg border border-[#1E1E26] bg-[#0F0F13] py-2 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-500">Tipo de Objetivo</label>
                    <select
                      value={goalType}
                      onChange={(e) => setGoalType(e.target.value as 'one_time' | 'recurring_monthly')}
                      className="w-full rounded-lg border border-[#1E1E26] bg-[#0F0F13] py-2 px-3 text-xs text-white focus:outline-none"
                    >
                      <option value="one_time">Meta Única (Ex: Comprar Carro)</option>
                      <option value="recurring_monthly">Meta Mensal (Ex: Investir 300 reais/mês)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-600 text-white text-[10px] py-2 rounded-lg font-black uppercase tracking-widest hover:bg-amber-500 transition-colors cursor-pointer"
                  >
                    Estabelecer Objetivo
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Lista de Metas */}
            <div className="space-y-4">
              {loadingGoals ? (
                <div className="py-6 text-center">
                  <div className="size-6 rounded-full border-2 border-amber-500/10 border-t-amber-500 animate-spin mx-auto" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mt-2">Sincronizando metas...</p>
                </div>
              ) : (
                <>
                  {/* Quest do Sistema Permanente */}
                  {(() => {
                    const systemTarget = monthlySummary.income * 0.2;
                    const systemProgress = monthlySummary.investment;
                    const systemPct = monthlySummary.income > 0 ? Math.min(100, (systemProgress / systemTarget) * 100) : 0;
                    const isSystemCompleted = monthlySummary.income > 0 && systemPct >= 100;

                    return (
                      <div 
                        className={`relative overflow-hidden rounded-xl border p-4 bg-[#0A0A0D] transition-all ${
                          isSystemCompleted 
                            ? 'border-amber-500/40 bg-amber-500/[0.02] shadow-[0_0_15px_rgba(245,158,11,0.08)]' 
                            : 'border-[#1E1E26]'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Quest do Sistema
                            </span>
                            <h3 className={`text-xs font-bold mt-2 uppercase ${isSystemCompleted ? 'text-amber-400 line-through opacity-85' : 'text-white'}`}>
                              Aporte de Purificação (Guardar 20% do Ganho)
                            </h3>
                          </div>

                          <div className="flex items-center gap-1">
                            {isSystemCompleted ? (
                              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse">
                                <Trophy size={13} />
                              </div>
                            ) : (
                              <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                Fixa
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progresso e Valores */}
                        <div className="mt-3.5 space-y-1.5">
                          <div className="flex justify-between items-end text-[10px]">
                            {monthlySummary.income > 0 ? (
                              <span className="font-bold text-gray-400">
                                R$ {systemProgress.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-gray-600">/</span> R$ {systemTarget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="font-bold text-gray-500 uppercase tracking-wider">
                                Aguardando receita mensal...
                              </span>
                            )}
                            <span className="font-orbitron font-black text-amber-400">
                              {systemPct.toFixed(0)}%
                            </span>
                          </div>

                          {/* Barra */}
                          <div className="h-2 w-full bg-black/55 rounded-full border border-white/5 p-[1px] overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]`}
                              style={{ width: `${systemPct}%` }}
                            />
                          </div>
                          <p className="text-[8px] text-gray-500 uppercase tracking-wide leading-tight mt-1">
                            Calculado automaticamente com base na receita e nos investimentos deste mês.
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="border-t border-[#1E1E26] border-dashed pt-4 mt-4" />

                  {/* Metas dos Usuários */}
                  {goals.length === 0 ? (
                    <div className="py-6 text-center bg-black/10 rounded-xl border border-[#1E1E26] border-dashed p-4">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Nenhum objetivo personalizado estabelecido.</p>
                      <p className="text-[8px] text-gray-500 uppercase mt-1">Crie objetivos para expandir sua Sabedoria.</p>
                    </div>
                  ) : (
                    goals.map((goal) => {
                      const pct = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
                      const isCompleted = goal.completed || pct >= 100;
                      const isPrimary = primaryGoal?.id === goal.id;
                      const remaining = Math.max(0, goal.target_amount - goal.current_amount);
                      const forecastMonths = monthlySummary.investment > 0 && remaining > 0
                        ? Math.ceil(remaining / monthlySummary.investment)
                        : null;

                      return (
                        <div 
                          key={goal.id} 
                          className={`relative overflow-hidden rounded-xl border p-4 bg-[#0A0A0D] transition-all hover:-translate-y-0.5 ${
                            isCompleted 
                              ? 'border-amber-500/40 bg-amber-500/[0.02] shadow-[0_0_15px_rgba(245,158,11,0.08)]' 
                              : isPrimary
                                ? 'border-blue-500/35 shadow-[0_0_18px_rgba(59,130,246,0.08)]'
                                : 'border-[#1E1E26] hover:border-white/10'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                goal.type === 'recurring_monthly' 
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {goal.type === 'recurring_monthly' ? 'Mensal Recorrente' : 'Objetivo Único'}
                              </span>
                              {isPrimary && !isCompleted && (
                                <span className="ml-1.5 rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-blue-300">
                                  Meta principal
                                </span>
                              )}
                              <h3 className={`text-xs font-bold mt-2 uppercase ${isCompleted ? 'text-amber-400 line-through opacity-85' : 'text-white'}`}>
                                {goal.title}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1">
                              {isCompleted ? (
                                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse">
                                  <Trophy size={13} />
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (editingGoalId === goal.id) {
                                      setEditingGoalId(null);
                                    } else {
                                      setEditingGoalId(goal.id);
                                      setTempGoalProgress(goal.current_amount);
                                    }
                                  }}
                                  className="text-[9px] text-gray-500 hover:text-white uppercase font-black px-1.5 py-0.5 rounded bg-white/5 border border-white/10 cursor-pointer"
                                >
                                  [EDITAR]
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="p-1 rounded text-gray-600 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Remover meta"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Progresso e Valores */}
                          <div className="mt-3.5 space-y-1.5">
                            <div className="flex justify-between items-end text-[10px]">
                              <span className="font-bold text-gray-400">
                                R$ {goal.current_amount.toLocaleString('pt-BR')} <span className="text-gray-600">/</span> R$ {goal.target_amount.toLocaleString('pt-BR')}
                              </span>
                              <span className="font-orbitron font-black text-amber-400">
                                {pct.toFixed(0)}%
                              </span>
                            </div>

                            {/* Barra */}
                            <div className="h-2 w-full bg-black/55 rounded-full border border-white/5 p-[1px] overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.55, ease: 'easeOut' }}
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isCompleted 
                                    ? 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                                    : 'bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                                }`}
                              />
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <div className="rounded-lg border border-white/5 bg-white/[0.025] p-2.5">
                                <p className="text-[9px] font-semibold text-gray-500">Valor restante</p>
                                <p className="mt-1 text-xs font-bold text-white">R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              </div>
                              <div className="rounded-lg border border-white/5 bg-white/[0.025] p-2.5">
                                <p className="text-[9px] font-semibold text-gray-500">Previsão estimada</p>
                                <p className="mt-1 text-xs font-bold text-blue-300">
                                  {isCompleted ? 'Concluída' : forecastMonths ? `${forecastMonths} ${forecastMonths === 1 ? 'mês' : 'meses'}` : 'Aguardando aportes'}
                                </p>
                              </div>
                            </div>

                            {/* Editor de progresso */}
                            {editingGoalId === goal.id && (
                              <div className="mt-3 flex items-center gap-2 bg-[#0F0F13] p-2 rounded-lg border border-[#1E1E26] animate-slide-down">
                                <input
                                  type="number"
                                  value={tempGoalProgress}
                                  onChange={(e) => setTempGoalProgress(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                  placeholder="Novo valor"
                                  className="w-full rounded border border-[#1E1E26] bg-[#0A0A0D] py-1 px-2 text-xs text-white focus:outline-none"
                                />
                                <button
                                  onClick={() => handleUpdateGoalProgress(goal, Number(tempGoalProgress))}
                                  className="bg-amber-600 text-white text-[9px] px-2.5 py-1.5 rounded font-black cursor-pointer uppercase tracking-widest shrink-0"
                                >
                                  Salvar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>

          {/* Dicas do Códex */}
          <div className="relative space-y-5 overflow-hidden rounded-2xl border border-blue-500/20 bg-[#101016] p-6 shadow-[0_0_24px_rgba(59,130,246,0.06)]">
            <div className="absolute right-0 top-0 h-full w-40 bg-gradient-to-l from-blue-500/8 to-transparent pointer-events-none" />
            
            <div className="relative flex items-center gap-3 border-b border-[#1E1E26] pb-4 text-blue-400">
              <div className="flex size-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                <Sparkles size={18} />
              </div>
              <div>
              <h2 className="text-base font-black font-orbitron">
                Provérbios da Sabedoria (WIS)
              </h2>
              <p className="mt-1 text-xs text-gray-500">Orientações do Sistema para proteger e evoluir recursos.</p>
              </div>
            </div>

            <div className="relative space-y-3">
              {[
                { title: 'Aporte de proteção', text: 'A consistência reduz a vulnerabilidade ao Mercador das Dívidas e fortalece sua reserva.', icon: ShieldAlert, tone: 'text-blue-300' },
                { title: 'Taxa de aporte saudável', text: 'A referência do Sistema é proteger 20% da receita mensal sempre que sua realidade permitir.', icon: Gauge, tone: 'text-amber-300' },
                { title: 'Sabedoria como escudo', text: 'Planejamento e revisão frequente aumentam sua resistência a decisões impulsivas.', icon: Sparkles, tone: 'text-purple-300' },
              ].map(proverb => (
                <div key={proverb.title} className="rounded-xl border border-white/5 bg-black/20 p-4 transition-colors hover:border-white/10">
                  <div className="flex items-start gap-3">
                    <proverb.icon className={`mt-0.5 size-4 shrink-0 ${proverb.tone}`} />
                    <p className="text-sm leading-relaxed text-gray-400">
                      <span className="font-bold text-white">{proverb.title}:</span> {proverb.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

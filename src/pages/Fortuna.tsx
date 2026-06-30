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
  Trophy
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useHunterStore } from '@/stores/useHunterStore';
import { useBossStore } from '@/stores/useBossStore';
import { usePreferences } from '@/contexts/preferences';
import { PremiumGate } from '@/components/premium/PremiumGate';

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
  const { language } = usePreferences();
  const l = (pt: string, en: string) => language === 'en-US' ? en : pt;
  const numberLocale = language === 'en-US' ? 'en-US' : 'pt-BR';
  const currencySymbol = l('R$', '$');

  const translateCategory = (cat: string) => {
    const ptToEn: Record<string, string> = {
      'Salário': 'Salary',
      'Freelance': 'Freelance',
      'Rendimentos': 'Yields',
      'Vendas': 'Sales',
      'Outros': 'Others',
      'Moradia': 'Housing',
      'Alimentação': 'Food',
      'Transporte': 'Transportation',
      'Saúde': 'Health',
      'Lazer': 'Leisure',
      'Assinaturas': 'Subscriptions',
      'Ações': 'Stocks',
      'FIIs': 'REITs',
      'Renda Fixa': 'Fixed Income',
      'Criptomoedas': 'Cryptocurrencies',
      'Reserva de Emergência': 'Emergency Fund'
    };
    return language === 'en-US' ? (ptToEn[cat] || cat) : cat;
  };

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
  const [successAlert, setSuccessAlert] = useState<{
    desc: string;
    amount: number;
    type: string;
    xp: number;
    wisdom: number;
  } | null>(null);

  const [noTxToday, setNoTxToday] = useState(false);

  useEffect(() => {
    if (!user) return;
    const todayYYYYMMDD = new Date().toLocaleDateString('en-CA');
    const noTxKey = `ascend_finance_no_tx_${user.id}_${todayYYYYMMDD}`;
    setNoTxToday(localStorage.getItem(noTxKey) === 'true');
  }, [user, successAlert]);

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
      setError(l('Por favor, preencha a descrição e um valor maior que zero.', 'Please enter a description and a value greater than zero.'));
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
      const xpGained = 10;
      let wisGained = 0;

      if (type === 'investment') {
        wisGained = 1;
        // Investimentos geram sabedoria (+1 WIS)
        await hunterStore.updateStat('wisdom', 1, user.id);
      }
      
      const xpResult = await hunterStore.addXp(xpGained, user.id, {
        eventId: `finance-log:${data.id}`,
      });

      // Atacar Boss ativo com dano de finanças
      if (xpResult.awardedXp > 0) {
        await bossStore.attackActiveBoss(user.id, xpResult.awardedXp, 'finance');
      }

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

  async function handleNoTransactionsToday() {
    if (!user) return;
    const todayYYYYMMDD = new Date().toLocaleDateString('en-CA');
    const noTxKey = `ascend_finance_no_tx_${user.id}_${todayYYYYMMDD}`;
    const isCurrentlyNoTx = localStorage.getItem(noTxKey) === 'true';

    setError(null);
    setSuccessAlert(null);

    if (isCurrentlyNoTx) {
      localStorage.removeItem(noTxKey);
      setNoTxToday(false);
      const xpKey = `ascend_finance_no_tx_xp_${user.id}_${todayYYYYMMDD}`;
      if (localStorage.getItem(xpKey) === 'true') {
        await hunterStore.addXp(-10, user.id, {
          eventId: `finance-no-tx:${todayYYYYMMDD}`,
        });
        localStorage.removeItem(xpKey);
      }
    } else {
      const { data } = await supabase
        .from('financial_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', todayYYYYMMDD);
      if (data && data.length > 0) {
        setError(l('Você já possui transações registradas hoje!', 'You already have transactions registered today!'));
        return;
      }

      localStorage.setItem(noTxKey, 'true');
      setNoTxToday(true);
      const xpKey = `ascend_finance_no_tx_xp_${user.id}_${todayYYYYMMDD}`;
      if (localStorage.getItem(xpKey) !== 'true') {
        await hunterStore.addXp(10, user.id, {
          eventId: `finance-no-tx:${todayYYYYMMDD}`,
        });
        localStorage.setItem(xpKey, 'true');
        setSuccessAlert({
          desc: l('Confirmado: Sem transações hoje', 'Confirmed: No transactions today'),
          amount: 0,
          type: 'income',
          xp: 10,
          wisdom: 0
        });
      }
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
    } catch (err: any) {
      console.error('[Fortuna] Erro ao buscar metas financeiras:', err);
    } finally {
      setLoadingGoals(false);
    }
  }

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!goalTitle.trim() || !goalTarget || goalTarget <= 0) {
      setError(l('Por favor, insira o título e o valor alvo da meta.', 'Please enter the title and target amount of the goal.'));
      return;
    }

    try {
      const targetVal = Number(goalTarget);
      const currentVal = Number(goalCurrent || 0);
      const isCompleted = currentVal >= targetVal;

      const { data: createdGoal, error: insertErr } = await supabase
        .from('financial_goals')
        .insert({
          user_id: user.id,
          title: goalTitle.trim(),
          target_amount: targetVal,
          current_amount: currentVal,
          type: goalType,
          completed: isCompleted
        })
        .select('id')
        .single();

      if (insertErr) throw insertErr;

      // Recompensa se já iniciar completa
      if (isCompleted) {
        await hunterStore.addXp(50, user.id, {
          eventId: `finance-goal-created:${createdGoal.id}`,
        });
        await hunterStore.updateStat('wisdom', 2, user.id);
        setSuccessAlert({
          desc: l(`Meta criada e concluída: "${goalTitle.trim()}"`, `Goal created and completed: "${goalTitle.trim()}"`),
          amount: targetVal,
          type: 'investment',
          xp: 50,
          wisdom: 2
        });
      } else {
        setSuccessAlert({
          desc: l(`Meta criada: "${goalTitle.trim()}"`, `Goal created: "${goalTitle.trim()}"`),
          amount: targetVal,
          type: 'investment',
          xp: 10,
          wisdom: 0
        });
        await hunterStore.addXp(10, user.id, {
          eventId: `finance-goal-created:${createdGoal.id}`,
        });
      }

      setGoalTitle('');
      setGoalTarget('');
      setGoalCurrent('');
      setGoalType('one_time');
      setShowNewGoalForm(false);
      await fetchGoals();
    } catch (err: any) {
      console.error('[Fortuna] Erro ao criar meta:', err);
      setError(err.message || 'Erro ao registrar a meta.');
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
        await hunterStore.addXp(50, user.id, {
          eventId: `finance-goal-completed:${goal.id}`,
        });
        await hunterStore.updateStat('wisdom', 2, user.id);

        setSuccessAlert({
          desc: l(`CONQUISTA: Meta "${goal.title}" concluída com sucesso!`, `ACHIEVEMENT: Goal "${goal.title}" completed successfully!`),
          amount: goal.target_amount,
          type: 'investment',
          xp: 50,
          wisdom: 2
        });
      }

      setEditingGoalId(null);
      setTempGoalProgress('');
      await fetchGoals();
    } catch (err: any) {
      console.error('[Fortuna] Erro ao atualizar progresso da meta:', err);
      setError(err.message || 'Erro ao atualizar o progresso.');
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
    } catch (err: any) {
      console.error('[Fortuna] Erro ao deletar meta:', err);
      setError(err.message || 'Erro ao excluir a meta.');
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

  const savingsRate = monthlySummary.income > 0 
    ? ((monthlySummary.income - monthlySummary.expense) / monthlySummary.income) * 100 
    : 0;

  const investmentRate = monthlySummary.income > 0 
    ? (monthlySummary.investment / monthlySummary.income) * 100 
    : 0;

  return (
    <PremiumGate
      title={l('Módulo da Fortuna Restrito', 'Fortune Module Locked')}
      description={l(
        'O gerenciamento financeiro e controle do fluxo de moedas são privilégios de caçadores de alto nível. Desperte o Premium para acessar a Fortuna e derrotar o Mercador das Dívidas.',
        'Financial management and coin-flow control are privileges for high-level hunters. Awaken Premium to access Fortune and defeat the Debt Merchant.'
      )}
    >
      <div className="space-y-8 pb-12">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-1 z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                {l('Gestão de Recursos', 'Resource Management')}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {l('Atributo: WIS (Sabedoria)', 'Stat: WIS (Wisdom)')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white font-orbitron">
              {l('Módulo', 'Module')} <span className="text-amber-400">{l('Fortuna', 'Fortune')}</span>
            </h1>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500 leading-relaxed">
              {l('Controle de fluxo de moedas e rito de investimentos para purificação de dívidas.', 'Coin flow control and investment rituals to purify debts.')}
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
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{l('Ganhos do Mês', 'Monthly Earnings')}</span>
            <h3 className="mt-2 text-xl sm:text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {currencySymbol} {monthlySummary.income.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>

          {/* Despesa */}
          <div className="relative overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-lg">
            <div className="absolute right-4 top-4 size-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ArrowDownLeft size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{l('Gastos do Mês', 'Monthly Expenses')}</span>
            <h3 className="mt-2 text-xl sm:text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {currencySymbol} {monthlySummary.expense.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>

          {/* Investimento */}
          <div className="relative overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-lg">
            <div className="absolute right-4 top-4 size-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Coins size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{l('Aportado no Mês', 'Monthly Investments')}</span>
            <h3 className="mt-2 text-xl sm:text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {currencySymbol} {monthlySummary.investment.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>

          {/* Taxas de Economia */}
          <div className="relative overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-lg">
            <div className="absolute right-4 top-4 size-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{l('Aporte / Poupança', 'Investments / Savings')}</span>
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
                  {l('Registrar Fluxo de Recurso', 'Log Resource Flow')}
                </h2>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{l('Descrição', 'Description')}</label>
                    <input 
                      type="text" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={l('Ex: Salário, Supermercado, Aporte FIIs...', 'e.g., Salary, Supermarket, REITs...')}
                      className="w-full rounded-xl border border-[#1E1E26] bg-[#0A0A0D] p-4 text-sm text-white placeholder:text-gray-600 focus:border-amber-500/40 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{l(`Valor (${currencySymbol})`, `Amount (${currencySymbol})`)}</label>
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
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{l('Tipo', 'Type')}</label>
                    <select 
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full rounded-xl border border-[#1E1E26] bg-[#0A0A0D] p-4 text-sm text-white focus:border-amber-500/40 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="expense">{l('Despesa (Saída)', 'Expense (Outflow)')}</option>
                      <option value="income">{l('Receita (Entrada)', 'Income (Inflow)')}</option>
                      <option value="investment">{l('Investimento / Aporte', 'Investment / Contribution')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{l('Categoria', 'Category')}</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-[#1E1E26] bg-[#0A0A0D] p-4 text-sm text-white focus:border-amber-500/40 focus:outline-none appearance-none cursor-pointer"
                    >
                      {categoriesByType[type].map((cat) => (
                        <option key={cat} value={cat}>{translateCategory(cat)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{l('Data', 'Date')}</label>
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
                  {formLoading ? l('Registrando no Codex...', 'Recording in Codex...') : l('Registrar Transação', 'Log Transaction')}
                </button>

                <button
                  type="button"
                  onClick={handleNoTransactionsToday}
                  className={`w-full rounded-xl font-black uppercase tracking-widest text-xs py-3.5 px-4 border transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 mt-2 ${
                    noTxToday 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                      : 'bg-transparent border-[#1E1E26] text-gray-400 hover:bg-white/5'
                  }`}
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {noTxToday ? l('Desfazer \'Sem Transações\'', 'Undo \'No Transactions\'') : l('Nenhuma Transação Hoje', 'No Transactions Today')}
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
                      <span className="font-bold">{l('ANOMALIA FINANCEIRA:', 'FINANCIAL ANOMALY:')}</span> {error}
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
                        {l('REGISTRO PERSISTIDO NO CODEX NEURAL', 'RECORD PERSISTED IN NEURAL CODEX')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-300">
                      <p className="font-semibold text-white">
                        {l(
                          `Lançamento de "${successAlert.desc}" no valor de R$ ${successAlert.amount.toFixed(2)} registrado.`,
                          `Entry of "${successAlert.desc}" amounting to $ ${successAlert.amount.toFixed(2)} registered.`
                        )}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
                        <span>{l(`SISTEMA: +${successAlert.xp} XP obtidos`, `SYSTEM: +${successAlert.xp} XP earned`)}</span>
                        {successAlert.wisdom > 0 && (
                          <>
                            <span className="text-gray-600">|</span>
                            <span className="text-blue-400">{l(`ATRIBUTOS: +${successAlert.wisdom} Sabedoria (WIS)`, `STATS: +${successAlert.wisdom} Wisdom (WIS)`)}</span>
                          </>
                        )}
                        <span className="text-gray-600">|</span>
                        <span>{l('ATAQUE AO BOSS: -10 HP', 'BOSS ATTACK: -10 HP')}</span>
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
                    {l('Registros do Mês Atual', 'Current Month Records')}
                  </h2>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#1E1E26] bg-black/30">
                {loading ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="size-8 rounded-full border-2 border-amber-500/10 border-t-amber-500 animate-spin mx-auto" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{l('Lendo logs de transações...', 'Reading transaction logs...')}</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-600">{l('Nenhum fluxo de moedas registrado este mês.', 'No coin flow logged this month.')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#1E1E26] bg-white/5 text-[9px] font-black uppercase tracking-widest text-gray-400">
                          <th className="px-5 py-3">{l('Descrição', 'Description')}</th>
                          <th className="px-5 py-3">{l('Categoria', 'Category')}</th>
                          <th className="px-5 py-3">{l('Tipo', 'Type')}</th>
                          <th className="px-5 py-3">{l('Valor', 'Amount')}</th>
                          <th className="px-5 py-3 text-right">{l('Ação', 'Action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E1E26] text-xs">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-5 py-3">
                              <span className="font-bold text-white uppercase">{log.description}</span>
                              <span className="block text-[9px] text-gray-600 font-bold uppercase mt-0.5">
                                {new Date(log.date).toLocaleDateString(language)}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-gray-500/10 border border-gray-500/25 text-gray-400">
                                {translateCategory(log.category)}
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
                                {log.type === 'income' ? l('Receita', 'Income') : log.type === 'expense' ? l('Despesa', 'Expense') : l('Aporte', 'Investment')}
                              </span>
                            </td>
                            <td className={`px-5 py-3 font-bold font-orbitron ${
                              log.type === 'income' 
                                ? 'text-emerald-400' 
                                : log.type === 'expense' 
                                  ? 'text-rose-400' 
                                  : 'text-amber-400'
                            }`}>
                              {log.type === 'income' ? '+' : '-'} {currencySymbol} {log.amount.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <button
                                onClick={() => handleDeleteTransaction(log.id)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title={l('Excluir transação', 'Delete transaction')}
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
            
            {/* Objetivos & Metas de Longo Prazo */}
            <div className="rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1E1E26] pb-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <Target size={16} />
                  <h2 className="text-xs font-black uppercase tracking-widest font-orbitron">
                    {l('Objetivos & Metas', 'Objectives & Goals')}
                  </h2>
                </div>
                <button
                  onClick={() => setShowNewGoalForm(!showNewGoalForm)}
                  className="text-[10px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/25 cursor-pointer"
                >
                  <Plus size={10} />
                  {showNewGoalForm ? l('Fechar', 'Close') : l('Nova', 'New')}
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
                      <label className="text-[9px] font-black uppercase text-gray-500">{l('Título do Objetivo', 'Goal Title')}</label>
                      <input
                        type="text"
                        value={goalTitle}
                        onChange={(e) => setGoalTitle(e.target.value)}
                        placeholder={l('Ex: Guardar 40 mil para o carro', 'e.g., Save 40k for the car')}
                        className="w-full rounded-lg border border-[#1E1E26] bg-[#0F0F13] py-2 px-3 text-xs text-white placeholder:text-gray-600 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-500">{l(`Valor Alvo (${currencySymbol})`, `Target Amount (${currencySymbol})`)}</label>
                        <input
                          type="number"
                          value={goalTarget}
                          onChange={(e) => setGoalTarget(e.target.value === '' ? '' : parseFloat(e.target.value))}
                          placeholder="40000"
                          className="w-full rounded-lg border border-[#1E1E26] bg-[#0F0F13] py-2 px-3 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-500">{l(`Acumulado Inicial (${currencySymbol})`, `Initial Accumulated (${currencySymbol})`)}</label>
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
                      <label className="text-[9px] font-black uppercase text-gray-500">{l('Tipo de Objetivo', 'Goal Type')}</label>
                      <select
                        value={goalType}
                        onChange={(e) => setGoalType(e.target.value as any)}
                        className="w-full rounded-lg border border-[#1E1E26] bg-[#0F0F13] py-2 px-3 text-xs text-white focus:outline-none"
                      >
                        <option value="one_time">{l('Meta Única (Ex: Comprar Carro)', 'Single Goal (e.g., Buy Car)')}</option>
                        <option value="recurring_monthly">{l('Meta Mensal (Ex: Investir 300 reais/mês)', 'Monthly Goal (e.g., Invest $300/mo)')}</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-amber-600 text-white text-[10px] py-2 rounded-lg font-black uppercase tracking-widest hover:bg-amber-500 transition-colors cursor-pointer"
                    >
                      {l('Estabelecer Objetivo', 'Establish Goal')}
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
                                {l('Quest do Sistema', 'System Quest')}
                              </span>
                              <h3 className={`text-xs font-bold mt-2 uppercase ${isSystemCompleted ? 'text-amber-400 line-through opacity-85' : 'text-white'}`}>
                                {l('Aporte de Purificação (Guardar 20% do Ganho)', 'Purification Contribution (Save 20% of Income)')}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1">
                              {isSystemCompleted ? (
                                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse">
                                  <Trophy size={13} />
                                </div>
                              ) : (
                                <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                  {l('Fixa', 'Fixed')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Progresso e Valores */}
                          <div className="mt-3.5 space-y-1.5">
                            <div className="flex justify-between items-end text-[10px]">
                              {monthlySummary.income > 0 ? (
                                <span className="font-bold text-gray-400">
                                  {currencySymbol} {systemProgress.toLocaleString(numberLocale, { minimumFractionDigits: 2 })} <span className="text-gray-600">/</span> {currencySymbol} {systemTarget.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
                                </span>
                              ) : (
                                <span className="font-bold text-gray-500 uppercase tracking-wider">
                                  {l('Aguardando receita mensal...', 'Awaiting monthly income...')}
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
                              {l('Calculado automaticamente com base na receita e nos investimentos deste mês.', 'Automatically calculated based on this month\'s income and investments.')}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="border-t border-[#1E1E26] border-dashed pt-4 mt-4" />

                    {/* Metas dos Usuários */}
                    {goals.length === 0 ? (
                      <div className="py-6 text-center bg-black/10 rounded-xl border border-[#1E1E26] border-dashed p-4">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">{l('Nenhum objetivo personalizado estabelecido.', 'No custom goal established.')}</p>
                        <p className="text-[8px] text-gray-500 uppercase mt-1">{l('Crie objetivos para expandir sua Sabedoria.', 'Create goals to expand your Wisdom.')}</p>
                      </div>
                    ) : (
                      goals.map((goal) => {
                        const pct = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
                        const isCompleted = goal.completed || pct >= 100;

                        return (
                          <div 
                            key={goal.id} 
                            className={`relative overflow-hidden rounded-xl border p-4 bg-[#0A0A0D] transition-all ${
                              isCompleted 
                                ? 'border-amber-500/40 bg-amber-500/[0.02] shadow-[0_0_15px_rgba(245,158,11,0.08)]' 
                                : 'border-[#1E1E26]'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                  goal.type === 'recurring_monthly' 
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {goal.type === 'recurring_monthly' ? l('Mensal Recorrente', 'Monthly Recurring') : l('Objetivo Único', 'Single Goal')}
                                </span>
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
                                    {l('[EDITAR]', '[EDIT]')}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteGoal(goal.id)}
                                  className="p-1 rounded text-gray-600 hover:text-rose-400 transition-colors cursor-pointer"
                                  title={l('Remover meta', 'Remove goal')}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Progresso e Valores */}
                            <div className="mt-3.5 space-y-1.5">
                              <div className="flex justify-between items-end text-[10px]">
                                <span className="font-bold text-gray-400">
                                  {currencySymbol} {goal.current_amount.toLocaleString(numberLocale)} <span className="text-gray-600">/</span> {currencySymbol} {goal.target_amount.toLocaleString(numberLocale)}
                                </span>
                                <span className="font-orbitron font-black text-amber-400">
                                  {pct.toFixed(0)}%
                                </span>
                              </div>

                              {/* Barra */}
                              <div className="h-2 w-full bg-black/55 rounded-full border border-white/5 p-[1px] overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isCompleted 
                                      ? 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                                      : 'bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>

                              {/* Editor de progresso */}
                              {editingGoalId === goal.id && (
                                <div className="mt-3 flex items-center gap-2 bg-[#0F0F13] p-2 rounded-lg border border-[#1E1E26] animate-slide-down">
                                  <input
                                    type="number"
                                    value={tempGoalProgress}
                                    onChange={(e) => setTempGoalProgress(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    placeholder={l('Novo valor', 'New value')}
                                    className="w-full rounded border border-[#1E1E26] bg-[#0A0A0D] py-1 px-2 text-xs text-white focus:outline-none"
                                  />
                                  <button
                                    onClick={() => handleUpdateGoalProgress(goal, Number(tempGoalProgress))}
                                    className="bg-amber-600 text-white text-[9px] px-2.5 py-1.5 rounded font-black cursor-pointer uppercase tracking-widest shrink-0"
                                  >
                                    {l('Salvar', 'Save')}
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
            <div className="rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-28 h-28 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-2 text-blue-400 border-b border-[#1E1E26] pb-3">
                <Sparkles size={16} />
                <h2 className="text-xs font-black uppercase tracking-widest font-orbitron">
                  {l('Provérbios da Sabedoria (WIS)', 'Proverbs of Wisdom (WIS)')}
                </h2>
              </div>

              <div className="space-y-3 text-xs text-gray-400 leading-relaxed font-semibold">
                <p>
                  🛡️ <span className="text-white">{l('Aporte de Proteção:', 'Protection Contribution:')}</span> {l('Investidores consistentes mitigam o poder do', 'Consistent investors mitigate the power of')} <span className="text-rose-400">{l('Mercador das Dívidas', 'Debt Merchant')}</span>. {l('Cada aporte causa dano crítico!', 'Each contribution inflicts critical damage!')}
                </p>
                <p>
                  ⚖️ <span className="text-white">{l('Taxa de Aporte Saudável:', 'Healthy Contribution Rate:')}</span> {l('Procure direcionar pelo menos', 'Aim to direct at least')} <span className="text-amber-400 font-bold">20%</span> {l('da sua receita mensal para aportes/investimentos para purificar seu fluxo energético.', 'of your monthly income towards contributions/investments to purify your energy flow.')}
                </p>
                <p>
                  🧠 <span className="text-white">{l('Wisdom Stat:', 'Wisdom Stat:')}</span> {l('O atributo de Sabedoria aumenta sua resiliência a impulsos de gratificação imediata. A Sabedoria é seu escudo!', 'The Wisdom attribute increases your resilience to instant gratification impulses. Wisdom is your shield!')}
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </PremiumGate>
  );
}

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
  Eye,
  EyeOff,
  Wallet,
  TrendingUp,
  Scale,
  Calendar,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useHunterStore } from '@/stores/useHunterStore';
import { useBossStore } from '@/stores/useBossStore';
import { usePreferences } from '@/contexts/preferences';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { NeonProgressBar } from '@/components/ui/neon-progress';

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

const PRIVACY_STORAGE_KEY = 'ascend_fortuna_privacy_mode';

export function Fortuna() {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => isEnglish ? en : pt;
  const numberLocale = isEnglish ? 'en-US' : 'pt-BR';
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
    return isEnglish ? (ptToEn[cat] || cat) : cat;
  };

  const { user } = useAuth();
  const hunterStore = useHunterStore();
  const bossStore = useBossStore();

  const [logs, setLogs] = useState<FinancialLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modo de Privacidade (Ocultar Valores em Público)
  const [showValues, setShowValues] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(PRIVACY_STORAGE_KEY);
      return stored !== 'hidden';
    } catch {
      return true;
    }
  });

  const togglePrivacy = () => {
    setShowValues(prev => {
      const next = !prev;
      try {
        localStorage.setItem(PRIVACY_STORAGE_KEY, next ? 'visible' : 'hidden');
      } catch {}
      return next;
    });
  };

  const formatCurrency = (val: number, showSign = false) => {
    if (!showValues) return '••••••';
    const formatted = Math.abs(val).toLocaleString(numberLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    if (showSign && val > 0) return `+ ${currencySymbol} ${formatted}`;
    if (showSign && val < 0) return `- ${currencySymbol} ${formatted}`;
    return `${currencySymbol} ${formatted}`;
  };

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
      setError(err.message || l('Erro ao sincronizar com o banco.', 'Error syncing with database.'));
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
      setError(err.message || l('Erro ao registrar transação no Supabase.', 'Error logging transaction in Supabase.'));
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
      setError(err.message || l('Erro ao excluir a transação.', 'Error deleting transaction.'));
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
      setError(err.message || l('Erro ao registrar a meta.', 'Error registering goal.'));
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
      setError(err.message || l('Erro ao atualizar o progresso.', 'Error updating progress.'));
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
      setError(err.message || l('Erro ao excluir a meta.', 'Error deleting goal.'));
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

  const netBalance = monthlySummary.income - monthlySummary.expense;

  const savingsRate = monthlySummary.income > 0 
    ? ((monthlySummary.income - monthlySummary.expense) / monthlySummary.income) * 100 
    : 0;

  const investmentRate = monthlySummary.income > 0 
    ? (monthlySummary.investment / monthlySummary.income) * 100 
    : 0;

  return (
    <div className="space-y-6 pb-28 sm:pb-32">
      {/* ── CABEÇALHO HUD v2 ── */}
      <HudCard variant="gold" corners radialGlow className="relative overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {l('Gestão de Recursos', 'Resource Management')}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {l('Atributo: WIS (Sabedoria)', 'Stat: WIS (Wisdom)')}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white italic font-orbitron">
              {l('Módulo', 'Module')} <span className="text-amber-400">{l('Fortuna', 'Fortuna')}</span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-400 max-w-xl leading-relaxed">
              {l(
                'Controle o fluxo de moedas, calibre seus aportes e purifique a fenda contra o Mercador das Dívidas.',
                'Control coin flow, calibrate contributions, and purify the Rift against the Merchant of Debt.'
              )}
            </p>
          </div>

          {/* Ações do Cabeçalho: Privacidade e Ícone */}
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <button
              type="button"
              onClick={togglePrivacy}
              className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                showValues
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white'
              }`}
              title={showValues ? l('Ocultar valores monetários', 'Hide monetary values') : l('Exibir valores monetários', 'Show monetary values')}
            >
              {showValues ? <Eye size={16} /> : <EyeOff size={16} />}
              <span className="font-orbitron uppercase text-[10px] tracking-wider">
                {showValues ? l('Privacidade', 'Privacy') : l('Oculto', 'Hidden')}
              </span>
            </button>

            <div className="flex size-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.2)]">
              <Coins size={22} />
            </div>
          </div>
        </div>
      </HudCard>

      {/* ── PAINEL DE SALDOS CONSOLIDADOS (MÊS ATUAL) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Receita / Ganhos */}
        <HudCard variant="default" className="relative p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              {l('Ganhos do Mês', 'Monthly Inflow')}
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <p className="mt-3 text-lg sm:text-2xl font-black text-emerald-400 font-orbitron truncate">
            {formatCurrency(monthlySummary.income)}
          </p>
          <p className="mt-1 text-[10px] text-gray-500 uppercase tracking-widest">
            {logs.filter(l => l.type === 'income').length} {l('entradas', 'inflows')}
          </p>
        </HudCard>

        {/* Despesas / Gastos */}
        <HudCard variant="default" className="relative p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              {l('Gastos do Mês', 'Monthly Expenses')}
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/25">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <p className="mt-3 text-lg sm:text-2xl font-black text-rose-400 font-orbitron truncate">
            {formatCurrency(monthlySummary.expense)}
          </p>
          <p className="mt-1 text-[10px] text-gray-500 uppercase tracking-widest">
            {logs.filter(l => l.type === 'expense').length} {l('saídas', 'outflows')}
          </p>
        </HudCard>

        {/* Investimentos / Aportes */}
        <HudCard variant="gold" className="relative p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
              {l('Aportes (WIS)', 'Investments (WIS)')}
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="mt-3 text-lg sm:text-2xl font-black text-amber-400 font-orbitron truncate">
            {formatCurrency(monthlySummary.investment)}
          </p>
          <p className="mt-1 text-[10px] text-amber-400/70 uppercase tracking-widest">
            {logs.filter(l => l.type === 'investment').length} {l('aportes selados', 'sealed deposits')}
          </p>
        </HudCard>

        {/* Saldo Líquido & Taxa */}
        <HudCard variant="default" className="relative p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              {l('Saldo Líquido', 'Net Balance')}
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
              <Scale size={16} />
            </div>
          </div>
          <p className={`mt-3 text-lg sm:text-2xl font-black font-orbitron truncate ${
            netBalance > 0 ? 'text-emerald-400' : netBalance < 0 ? 'text-rose-400' : 'text-gray-300'
          }`}>
            {formatCurrency(netBalance, true)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-gray-400">
            <span>{l('Aporte:', 'Invest:')} <b className="text-amber-400 font-orbitron">{investmentRate.toFixed(0)}%</b></span>
            <span>•</span>
            <span>{l('Poupança:', 'Savings:')} <b className="text-cyan-400 font-orbitron">{savingsRate.toFixed(0)}%</b></span>
          </div>
        </HudCard>
      </div>

      {/* ── BOTÃO RÁPIDO: SEM TRANSAÇÕES HOJE ── */}
      <HudCard variant={noTxToday ? 'gold' : 'default'} className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${
              noTxToday 
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-400' 
                : 'border-white/10 bg-white/5 text-gray-400'
            }`}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-white font-orbitron">
                {noTxToday ? l('Disciplina Financeira Confirmada', 'Financial Discipline Confirmed') : l('Dia Livre de Gastos?', 'Zero Spending Today?')}
              </p>
              <p className="text-xs text-gray-400">
                {noTxToday
                  ? l('Você registrou ausência de transações supérfluas hoje. Bônus de +10 XP concedido.', 'You logged no unnecessary transactions today. +10 XP bonus granted.')
                  : l('Se você não realizou transações hoje, confirme para manter a constância e receber +10 XP.', 'If you made no expenses today, confirm to maintain consistency and gain +10 XP.')}
              </p>
            </div>
          </div>

          <TacticalButton
            onClick={handleNoTransactionsToday}
            variant={noTxToday ? 'secondary' : 'primary'}
            accent="gold"
            className="self-start sm:self-center shrink-0 min-h-[44px] text-xs px-4"
          >
            {noTxToday ? l('Desfazer Confirmação', 'Undo Confirmation') : l('Nenhum Gasto Hoje (+10 XP)', 'No Spending Today (+10 XP)')}
          </TacticalButton>
        </div>
      </HudCard>

      {/* ── ALERTA DE ERRO OU SUCESSO ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300 flex items-start gap-3"
          >
            <ShieldAlert size={18} className="shrink-0 text-rose-400 mt-0.5" />
            <div>
              <span className="font-black uppercase tracking-wider text-rose-400">{l('Anomalia Financeira:', 'Financial Anomaly:')} </span>
              {error}
            </div>
          </motion.div>
        )}

        {successAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 shadow-[0_0_24px_rgba(245,158,11,0.15)] relative overflow-hidden"
          >
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles size={18} className="animate-pulse" />
              <span className="font-black text-xs uppercase tracking-widest font-orbitron">
                {l('REGISTRO PERSISTIDO NO CODEX', 'RECORD PERSISTED IN CODEX')}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-200 font-medium">
              {l(
                `Lançamento de "${successAlert.desc}" no valor de ${formatCurrency(successAlert.amount)} registrado.`,
                `Entry of "${successAlert.desc}" for ${formatCurrency(successAlert.amount)} logged.`
              )}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <span className="rounded-md border border-amber-500/30 bg-amber-500/20 px-2.5 py-1 text-amber-300">
                +{successAlert.xp} XP
              </span>
              {successAlert.wisdom > 0 && (
                <span className="rounded-md border border-cyan-500/30 bg-cyan-500/20 px-2.5 py-1 text-cyan-300">
                  +{successAlert.wisdom} {l('Sabedoria (WIS)', 'Wisdom (WIS)')}
                </span>
              )}
              <span className="rounded-md border border-rose-500/30 bg-rose-500/20 px-2.5 py-1 text-rose-300">
                {l('Ataque ao Boss: Ativo', 'Boss Attack: Active')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CORPO PRINCIPAL EM 2 COLUNAS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO E HISTÓRICO (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Formulário de Registro */}
          <HudCard variant="gold" corners className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5 text-amber-400">
                <Plus size={18} />
                <h2 className="text-sm font-black uppercase tracking-wider font-orbitron text-white">
                  {l('Registrar Fluxo de Moedas', 'Log Coin Flow')}
                </h2>
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                +10 XP
              </span>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              {/* Seletor Segmentado de Tipo */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  {l('Tipo de Transação', 'Transaction Type')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'expense' as const, label: l('Despesa', 'Expense'), tone: 'rose' },
                    { id: 'income' as const, label: l('Receita', 'Income'), tone: 'emerald' },
                    { id: 'investment' as const, label: l('Aporte / WIS', 'Investment'), tone: 'amber' }
                  ].map((t) => {
                    const isSelected = type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id)}
                        className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-wider transition-all font-orbitron ${
                          isSelected
                            ? t.tone === 'rose'
                              ? 'border-rose-500/50 bg-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                              : t.tone === 'emerald'
                                ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                                : 'border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Descrição e Valor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {l('Descrição', 'Description')}
                  </label>
                  <input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={l('Ex: Salário, Supermercado, Aporte FIIs...', 'e.g., Salary, Groceries, Stocks...')}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {l(`Valor (${currencySymbol})`, `Amount (${currencySymbol})`)}
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs sm:text-sm font-bold font-orbitron text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                </div>
              </div>

              {/* Categoria e Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {l('Categoria', 'Category')}
                  </label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-amber-500/50 focus:outline-none cursor-pointer"
                  >
                    {categoriesByType[type].map((cat) => (
                      <option key={cat} value={cat} className="bg-[#0F0F13] text-white">
                        {translateCategory(cat)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {l('Data', 'Date')}
                  </label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-amber-500/50 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <TacticalButton
                type="submit"
                disabled={formLoading}
                variant="primary"
                accent="gold"
                displayFont
                className="w-full min-h-[48px] text-xs font-black"
              >
                {formLoading ? l('Registrando no Codex...', 'Recording in Codex...') : l('Registrar Transação (+10 XP)', 'Log Transaction (+10 XP)')}
              </TacticalButton>
            </form>
          </HudCard>

          {/* Histórico Recente do Mês */}
          <HudCard variant="default" className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 text-gray-300">
                <History size={16} />
                <h2 className="text-xs font-black uppercase tracking-wider font-orbitron text-white">
                  {l('Histórico do Mês Atual', 'Current Month Records')}
                </h2>
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {logs.length} {l('registros', 'entries')}
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center space-y-2">
                <div className="size-8 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin mx-auto" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  {l('Sincronizando registros...', 'Syncing records...')}
                </p>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center space-y-2 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6">
                <Wallet className="size-8 text-gray-600 mx-auto" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {l('Nenhuma movimentação registrada neste mês.', 'No movements logged this month.')}
                </p>
                <p className="text-[11px] text-gray-600">
                  {l('Cadastre suas receitas e despesas acima para alimentar seu histórico.', 'Record your income and expenses above to populate your history.')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => {
                  const isIncome = log.type === 'income';
                  const isInvestment = log.type === 'investment';
                  return (
                    <div
                      key={log.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 hover:border-amber-500/30 hover:bg-amber-500/[0.02] transition-all"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${
                          isIncome
                            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                            : isInvestment
                              ? 'border-amber-500/30 bg-amber-500/15 text-amber-400'
                              : 'border-rose-500/30 bg-rose-500/15 text-rose-400'
                        }`}>
                          {isIncome ? <ArrowUpRight size={16} /> : isInvestment ? <Coins size={16} /> : <ArrowDownLeft size={16} />}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-wide">
                            {log.description}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-500">
                            <span>{new Date(log.date).toLocaleDateString(language)}</span>
                            <span>•</span>
                            <span className="rounded bg-white/5 px-1.5 py-0.5 font-semibold text-gray-400">
                              {translateCategory(log.category)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <span className={`text-xs sm:text-sm font-black font-orbitron ${
                          isIncome
                            ? 'text-emerald-400'
                            : isInvestment
                              ? 'text-amber-400'
                              : 'text-rose-400'
                        }`}>
                          {isIncome ? '+' : '-'} {formatCurrency(log.amount)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteTransaction(log.id)}
                          className="flex size-8 items-center justify-center rounded-lg text-gray-600 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                          title={l('Excluir transação', 'Delete transaction')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </HudCard>

        </div>

        {/* COLUNA DIREITA: METAS & PROVÉRBIOS DE SABEDORIA (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Metas & Objetivos Financeiros */}
          <HudCard variant="gold" className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Target size={16} />
                <h2 className="text-xs font-black uppercase tracking-wider font-orbitron text-white">
                  {l('Objetivos & Metas', 'Goals & Objectives')}
                </h2>
              </div>

              <TacticalButton
                onClick={() => setShowNewGoalForm(!showNewGoalForm)}
                variant="ghost"
                accent="gold"
                className="min-h-[36px] text-[10px] py-1 px-3"
              >
                <Plus size={12} />
                {showNewGoalForm ? l('Fechar', 'Close') : l('Nova Meta', 'New Goal')}
              </TacticalButton>
            </div>

            {/* Form de Nova Meta */}
            <AnimatePresence>
              {showNewGoalForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateGoal}
                  className="space-y-3 rounded-xl border border-amber-500/30 bg-black/40 p-3.5 overflow-hidden"
                >
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400">{l('Título do Objetivo', 'Goal Title')}</label>
                    <input
                      type="text"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      placeholder={l('Ex: Reserva de emergência', 'e.g., Emergency fund')}
                      className="w-full min-h-[38px] rounded-lg border border-white/10 bg-[#0F0F13] px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400">{l(`Alvo (${currencySymbol})`, `Target (${currencySymbol})`)}</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={goalTarget}
                        onChange={(e) => setGoalTarget(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="5000"
                        className="w-full min-h-[38px] rounded-lg border border-white/10 bg-[#0F0F13] px-3 py-1.5 text-xs font-bold font-orbitron text-white focus:border-amber-500/50 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400">{l(`Inicial (${currencySymbol})`, `Initial (${currencySymbol})`)}</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={goalCurrent}
                        onChange={(e) => setGoalCurrent(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="0"
                        className="w-full min-h-[38px] rounded-lg border border-white/10 bg-[#0F0F13] px-3 py-1.5 text-xs font-bold font-orbitron text-white focus:border-amber-500/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400">{l('Tipo', 'Type')}</label>
                    <select
                      value={goalType}
                      onChange={(e) => setGoalType(e.target.value as any)}
                      className="w-full min-h-[38px] rounded-lg border border-white/10 bg-[#0F0F13] px-3 py-1.5 text-xs text-white focus:border-amber-500/50 focus:outline-none cursor-pointer"
                    >
                      <option value="one_time">{l('Meta Única (Ex: Comprar Carro)', 'Single Goal')}</option>
                      <option value="recurring_monthly">{l('Meta Mensal (Ex: Aportar todo mês)', 'Monthly Goal')}</option>
                    </select>
                  </div>

                  <TacticalButton
                    type="submit"
                    variant="primary"
                    accent="gold"
                    className="w-full min-h-[40px] text-xs"
                  >
                    {l('Salvar Meta', 'Save Goal')}
                  </TacticalButton>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Lista de Metas */}
            <div className="space-y-3">
              {/* Quest Permanente do Sistema */}
              {(() => {
                const systemTarget = monthlySummary.income * 0.2;
                const systemProgress = monthlySummary.investment;
                const systemPct = monthlySummary.income > 0 ? Math.min(100, (systemProgress / systemTarget) * 100) : 0;
                const isSystemCompleted = monthlySummary.income > 0 && systemPct >= 100;

                return (
                  <div className={`rounded-xl border p-4 transition-all ${
                    isSystemCompleted
                      ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'border-white/10 bg-black/40'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-300">
                          {l('Quest do Sistema', 'System Quest')}
                        </span>
                        <h4 className={`mt-1.5 text-xs font-bold uppercase ${isSystemCompleted ? 'text-amber-300' : 'text-white'}`}>
                          {l('Aporte de Purificação (20% do Ganho)', 'Purification Deposit (20% of Income)')}
                        </h4>
                      </div>

                      {isSystemCompleted ? (
                        <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                          <Trophy size={14} />
                        </div>
                      ) : (
                        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-400">
                          {l('Fixa', 'Fixed')}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-400 font-medium">
                          {monthlySummary.income > 0 ? (
                            <>{formatCurrency(systemProgress)} / {formatCurrency(systemTarget)}</>
                          ) : (
                            l('Aguardando receita do mês...', 'Awaiting monthly income...')
                          )}
                        </span>
                        <span className="font-bold font-orbitron text-amber-400">
                          {systemPct.toFixed(0)}%
                        </span>
                      </div>

                      <NeonProgressBar
                        value={systemProgress}
                        max={systemTarget > 0 ? systemTarget : 100}
                        variant="xp"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Metas Criadas pelo Usuário */}
              {loadingGoals ? (
                <div className="py-6 text-center space-y-1">
                  <div className="size-6 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin mx-auto" />
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">{l('Carregando metas...', 'Loading goals...')}</p>
                </div>
              ) : goals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-center">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {l('Nenhum objetivo personalizado estabelecido.', 'No custom goals set.')}
                  </p>
                  <p className="mt-0.5 text-[9px] text-gray-600">
                    {l('Crie metas para receber bônus de Sabedoria.', 'Create goals to earn Wisdom bonuses.')}
                  </p>
                </div>
              ) : (
                goals.map((goal) => {
                  const pct = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
                  const isCompleted = goal.completed || pct >= 100;

                  return (
                    <div
                      key={goal.id}
                      className={`rounded-xl border p-4 transition-all ${
                        isCompleted
                          ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                          : 'border-white/10 bg-black/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${
                            goal.type === 'recurring_monthly'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {goal.type === 'recurring_monthly' ? l('Mensal', 'Monthly') : l('Única', 'Single')}
                          </span>
                          <h4 className={`mt-1.5 text-xs font-bold uppercase ${isCompleted ? 'text-amber-300' : 'text-white'}`}>
                            {goal.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isCompleted ? (
                            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                              <Trophy size={14} />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (editingGoalId === goal.id) {
                                  setEditingGoalId(null);
                                } else {
                                  setEditingGoalId(goal.id);
                                  setTempGoalProgress(goal.current_amount);
                                }
                              }}
                              className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold text-gray-300 hover:text-white uppercase transition-colors"
                            >
                              {l('Editar', 'Edit')}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="p-1 text-gray-600 hover:text-rose-400 transition-colors"
                            title={l('Excluir meta', 'Delete goal')}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-400 font-medium">
                            {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                          </span>
                          <span className="font-bold font-orbitron text-amber-400">
                            {pct.toFixed(0)}%
                          </span>
                        </div>

                        <NeonProgressBar
                          value={goal.current_amount}
                          max={goal.target_amount}
                          variant={isCompleted ? 'xp' : 'cyan'}
                        />

                        {/* Editor Rápido de Progresso */}
                        {editingGoalId === goal.id && (
                          <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-[#0F0F13] p-2">
                            <input
                              type="number"
                              inputMode="decimal"
                              value={tempGoalProgress}
                              onChange={(e) => setTempGoalProgress(e.target.value === '' ? '' : parseFloat(e.target.value))}
                              placeholder={l('Novo valor acumulado', 'New accumulated amount')}
                              className="w-full min-h-[32px] rounded border border-white/10 bg-black/50 px-2 text-xs font-orbitron text-white focus:outline-none"
                            />
                            <TacticalButton
                              onClick={() => handleUpdateGoalProgress(goal, Number(tempGoalProgress))}
                              variant="primary"
                              accent="gold"
                              className="shrink-0 min-h-[32px] text-[10px] py-1 px-3"
                            >
                              {l('Salvar', 'Save')}
                            </TacticalButton>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </HudCard>

          {/* Dicas do Codex / Provérbios de Sabedoria */}
          <HudCard variant="default" className="p-5 sm:p-6 space-y-3.5">
            <div className="flex items-center gap-2 text-cyan-400 border-b border-white/5 pb-2.5">
              <Sparkles size={16} />
              <h3 className="text-xs font-black uppercase tracking-wider font-orbitron text-white">
                {l('Provérbios da Sabedoria (WIS)', 'Proverbs of Wisdom (WIS)')}
              </h3>
            </div>

            <div className="space-y-3 text-xs text-gray-400 leading-relaxed">
              <p>
                🛡️ <span className="font-bold text-white">{l('Aporte de Proteção:', 'Protection Contribution:')}</span> {l('Investidores consistentes atenuam as dívidas da fenda e causam dano crítico no chefe semanal.', 'Consistent investors lessen Rift debts and inflict critical damage on the weekly boss.')}
              </p>
              <p>
                ⚖️ <span className="font-bold text-white">{l('Meta dos 20%:', '20% Milestone:')}</span> {l('Manter 20% dos ganhos direcionados para reservas e investimentos gera estabilidade e eleva seu rank.', 'Directing 20% of income toward investments grants stability and elevates your rank.')}
              </p>
              <p>
                🧠 <span className="font-bold text-white">{l('Atributo Sabedoria:', 'Wisdom Stat:')}</span> {l('A Sabedoria atua como blindagem cognitiva contra impulsos de consumo imediato.', 'Wisdom acts as cognitive armor against instant gratification impulses.')}
              </p>
            </div>
          </HudCard>

        </div>

      </div>
    </div>
  );
}

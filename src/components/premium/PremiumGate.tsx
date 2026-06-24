import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, Cpu, ShieldAlert, CheckCircle2, Flame, Swords } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useHunterStore } from '@/stores/useHunterStore';

interface PremiumGateProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
}

export function PremiumGate({ children, title, description }: PremiumGateProps) {
  const isPremium = useHunterStore((s) => s.isPremium);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Se o caçador já for Premium, renderiza o conteúdo normal
  if (isPremium) {
    return <>{children || null}</>;
  }

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke('stripe-checkout');
      
      if (functionError) {
        // Tratar erro do Supabase
        const errBody = await functionError.context?.json().catch(() => ({}));
        throw new Error(errBody?.error || functionError.message || "Erro ao conectar ao servidor de checkout.");
      }

      if (data?.url) {
        // Redireciona o usuário para o Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("URL do Stripe Checkout não foi gerada pelo servidor.");
      }
    } catch (err: any) {
      console.error('[PremiumGate] Erro ao redirecionar para checkout:', err);
      setError(err.message || 'Falha ao iniciar o portal de pagamento. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-purple-500/25 bg-[#0A0A0E] p-8 shadow-[0_0_40px_rgba(147,51,234,0.08)] text-center max-w-2xl mx-auto my-6">
      {/* Luzes de Fundo Ciberpunk */}
      <div className="absolute -left-20 -top-20 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Ícone Holográfico Bloqueado */}
      <div className="relative mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl border border-purple-500/40 bg-purple-500/10 text-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.25)] animate-pulse">
        <Lock size={36} strokeWidth={1.8} className="text-purple-300" />
        <div className="absolute -inset-1 rounded-2xl border border-purple-500/10 animate-ping opacity-30" />
      </div>

      {/* Título Cyberpunk */}
      <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white font-orbitron italic">
        {title || "Fenda Dimensional Restrita"}
      </h2>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">
        Requer Chave do Despertar (Nível Premium)
      </p>

      {/* Descrição */}
      <p className="mt-4 text-sm leading-relaxed text-gray-400 max-w-md mx-auto">
        {description || "Esta área contém recursos avançados do Sistema. Desperte seu potencial completo e quebre os limites do seu treino."}
      </p>

      {/* Benefícios */}
      <div className="mt-6 p-4 rounded-2xl border border-white/5 bg-black/40 text-left max-w-md mx-auto space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400 font-orbitron">
          Benefícios do Despertar Premium
        </h4>
        <ul className="space-y-2 text-xs font-semibold text-gray-300">
          <li className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            <span>Códex de Nutrição com IA ativa (Llama 3.1)</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            <span>Histórico de Treinos e Gráficos de Evolução Física</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            <span>Acesso às Raids Finais: Últimos 3 Bosses</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            <span>Módulo Fortuna de Gestão Financeira & Metas</span>
          </li>
        </ul>
      </div>

      {/* Ação de Assinatura */}
      <div className="mt-8 space-y-4 max-w-md mx-auto">
        <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs font-bold text-gray-500">
          <span>Assinatura Mensal Recorrente</span>
          <span className="text-lg font-black text-white font-orbitron">$ 2,00 <span className="text-[10px] font-sans font-semibold text-gray-500">/mês</span></span>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="relative group w-full min-h-14 overflow-hidden rounded-xl bg-gradient-to-r from-purple-700 via-purple-600 to-blue-600 px-6 font-black uppercase text-white shadow-[0_0_24px_rgba(168,85,247,0.18)] transition-all duration-200 active:scale-[0.98] disabled:cursor-wait disabled:opacity-75 flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          {loading ? (
            <>
              <Cpu size={16} className="animate-spin text-purple-300" />
              Sincronizando com Stripe...
            </>
          ) : (
            <>
              <Sparkles size={16} className="text-purple-300 animate-pulse" />
              Desbloquear Todos os Módulos
            </>
          )}
        </button>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-[11px] text-rose-400 flex items-start gap-2 text-left"
          >
            <ShieldAlert size={14} className="shrink-0 text-rose-400 mt-0.5" />
            <div>
              <span className="font-bold">ANOMALIA NO CHECKOUT:</span> {error}
              <p className="mt-1 text-gray-500 font-medium">Nota: Certifique-se de que a variável STRIPE_SECRET_KEY e as chaves de teste estão configuradas no Supabase.</p>
            </div>
          </motion.div>
        )}
      </div>

      <p className="mt-4 text-[10px] text-gray-500 font-medium leading-relaxed">
        Pagamento seguro via Stripe. Cancele a qualquer momento nas configurações do seu perfil.
      </p>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Dumbbell, 
  Apple, 
  Coins, 
  Skull, 
  Moon, 
  ArrowRight,
  Shield,
  Zap,
  Lock
} from 'lucide-react';
import { useHunterStore } from '../stores/useHunterStore';

interface CommandCard {
  title: string;
  desc: string;
  path: string;
  status: 'active' | 'locked';
  statusLabel: string;
  icon: React.ReactNode;
  color: string; // cor do glow/borda neon
  bgClass: string; // gradiente se não houver arte física
  image?: string; // imagem em public/Cards/
}

export function QuickMenu() {
  const navigate = useNavigate();
  const state = useHunterStore();

  const cards: CommandCard[] = [
    {
      title: 'Status do Caçador',
      desc: 'Visualize seus atributos, nível, rank e gráficos de domínios da evolução.',
      path: '/status',
      status: 'active',
      statusLabel: 'MÓDULO ATIVADO',
      icon: <LayoutDashboard className="w-5 h-5" />,
      color: 'border-blue-500/30 hover:border-blue-500/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] text-blue-400',
      bgClass: 'bg-gradient-to-br from-blue-950/45 via-blue-900/10 to-transparent border-blue-500/20'
    },
    {
      title: 'Quadro de Missões',
      desc: 'Gerencie seus hábitos diários, tarefas normais e invoque a quest bônus da Fenda IA.',
      path: '/quests',
      status: 'active',
      statusLabel: 'SISTEMA ATIVO',
      icon: <CheckSquare className="w-5 h-5" />,
      color: 'border-cyan-500/30 hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] text-cyan-400',
      bgClass: '',
      image: '/Cards/Estudos-Nutricao.jpeg'
    },
    {
      title: 'Módulo de Treinamento',
      desc: 'Gerencie rotinas de exercícios, registre cargas/repetições e monitore sua evolução de volume.',
      path: '/workouts',
      status: 'active',
      statusLabel: 'SISTEMA ATIVO',
      icon: <Dumbbell className="w-5 h-5" />,
      color: 'border-purple-500/30 hover:border-purple-500/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] text-purple-400',
      bgClass: '',
      image: '/Cards/Treinos.jpeg'
    },
    {
      title: 'Recuperação & Nutrição',
      desc: 'Monte seu plano de refeições, controle suas calorias e registre alimentos com suporte a IA.',
      path: '/nutrition',
      status: 'active',
      statusLabel: 'SISTEMA ATIVO',
      icon: <Apple className="w-5 h-5" />,
      color: 'border-orange-500/30 hover:border-orange-400/60 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] text-orange-400',
      bgClass: '',
      image: '/Cards/Estudos-Nutricao.jpeg'
    },
    {
      title: 'Módulo Fortuna',
      desc: 'Controle de finanças pessoais, economia e aportes. Melhora o atributo de Sabedoria (WIS).',
      path: '/fortuna',
      status: 'locked',
      statusLabel: 'NÍVEL INSUFICIENTE',
      icon: <Coins className="w-5 h-5" />,
      color: 'border-amber-500/20 hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.08)] text-amber-500/70',
      bgClass: '',
      image: '/Cards/Fortuna.jpeg'
    },
    {
      title: 'Chefes Finais (Raid)',
      desc: 'Participe de batalhas semanais contra vilões da procrastinação. Hábitos completados desferem dano.',
      path: '/bosses',
      status: 'locked',
      statusLabel: 'NÍVEL INSUFICIENTE',
      icon: <Skull className="w-5 h-5" />,
      color: 'border-rose-500/20 hover:border-rose-500/40 hover:shadow-[0_0_20px_rgba(244,63,94,0.08)] text-rose-500/70',
      bgClass: '',
      image: '/Cards/Chefes Finais.jpeg'
    },
    {
      title: 'Descanso & Lazer',
      desc: 'Monitore sua qualidade de sono e descanso mental para recuperar pontos de vitalidade (VIT).',
      path: '/rest',
      status: 'locked',
      statusLabel: 'NÍVEL INSUFICIENTE',
      icon: <Moon className="w-5 h-5" />,
      color: 'border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)] text-emerald-500/70',
      bgClass: '',
      image: '/Cards/Descanso-Lazer.jpeg'
    }
  ];

  return (
    <div className="space-y-8 pb-16 text-silver">
      
      {/* ── CADASTRADO / CABEÇALHO ── */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-[#0F0F13] p-6 shadow-[0_0_25px_rgba(59,130,246,0.05)]">
        {/* Glow de fundo */}
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400 font-orbitron">
                Sistema de Integração Neural
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-wider text-white font-orbitron text-glow-blue">
              Portal de <span className="text-blue-500">Comando</span>
            </h1>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gray-500 leading-normal">
              Selecione o portal ativo para calibrar seus atributos físicos e intelectuais.
            </p>
          </div>

          {/* Mini Ficha de Status Rápida */}
          <div className="flex items-center gap-4 bg-black/40 border border-[#1e1e26] rounded-2xl p-4 shrink-0">
            <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-black text-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] font-orbitron italic">
              {state.rank || 'E'}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-white uppercase tracking-wider">{state.username || 'Caçador'}</p>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                <span className="text-blue-400">Level {state.level}</span>
                <span className="text-gray-600">|</span>
                <span className="text-amber-400 flex items-center gap-0.5"><Zap size={10} fill="currentColor" /> {state.xp} XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── GRADE DE PORTAIS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const isLocked = card.status === 'locked';

          return (
            <div
              key={card.title}
              onClick={() => navigate(card.path)}
              className={`group relative overflow-hidden rounded-2xl border bg-[#0F0F13] p-5 flex flex-col justify-between min-h-[200px] transition-all duration-300 ease-out cursor-pointer hover:-translate-y-1 ${
                card.color
              } ${isLocked ? 'opacity-70 hover:opacity-95' : ''}`}
            >
              {/* Imagem de Fundo do Card */}
              {card.image ? (
                <>
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <img 
                      src={card.image} 
                      alt={card.title} 
                      className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${
                        isLocked ? 'blur-[1px] grayscale-[40%]' : ''
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/85 to-black/30 z-10" />
                  </div>
                </>
              ) : (
                /* Gradiente Alternativo se não houver imagem */
                <div className={`absolute inset-0 z-0 overflow-hidden ${card.bgClass}`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/90 to-transparent z-10" />
                </div>
              )}

              {/* Top Card Info (Selo e Ícone) */}
              <div className="relative z-20 flex items-center justify-between w-full">
                <div className={`flex size-9 items-center justify-center rounded-xl border transition-colors ${
                  isLocked 
                    ? 'border-[#1e1e26] bg-black/55 text-gray-500' 
                    : 'border-white/5 bg-black/60 text-white group-hover:text-glow-blue'
                }`}>
                  {isLocked ? <Lock size={16} className="text-gray-500" /> : card.icon}
                </div>

                {/* Selo de Status do Portal */}
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border font-orbitron ${
                  isLocked 
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-glow-emerald animate-pulse'
                }`}>
                  {card.statusLabel}
                </span>
              </div>

              {/* Bot Card Info (Título, Desc e Seta) */}
              <div className="relative z-20 mt-8 space-y-2">
                <h3 className={`text-base font-black uppercase tracking-wider font-orbitron flex items-center gap-1.5 transition-colors ${
                  isLocked ? 'text-gray-400 group-hover:text-white' : 'text-white group-hover:text-blue-400'
                }`}>
                  {card.title}
                </h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                  {card.desc}
                </p>

                <div className="flex justify-end pt-2">
                  <div className={`flex size-7 items-center justify-center rounded-lg border transition-all ${
                    isLocked 
                      ? 'border-[#1e1e26] bg-black/40 text-gray-600' 
                      : 'border-[#1e1e26] bg-black/60 text-blue-400 group-hover:border-blue-500 group-hover:bg-blue-500/10 group-hover:translate-x-1'
                  }`}>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Apple,
  ArrowRight,
  CheckSquare,
  Coins,
  Dumbbell,
  LayoutDashboard,
  Lock,
  Moon,
  Skull,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useHunterStore } from '../stores/useHunterStore';

type PortalBadge =
  | 'SISTEMA ATIVO'
  | 'NOVO'
  | 'EM PROGRESSO'
  | 'BOSS DISPONÍVEL'
  | 'QUEST PENDENTE';

interface CommandCard {
  title: string;
  desc: string;
  path: string;
  status: 'active' | 'locked';
  badge: PortalBadge;
  priority: 'primary' | 'secondary';
  icon: React.ReactNode;
  color: string;
  arrowColor: string;
  image: string;
}

const badgeStyles: Record<PortalBadge, string> = {
  'SISTEMA ATIVO': 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
  NOVO: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  'EM PROGRESSO': 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  'BOSS DISPONÍVEL': 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  'QUEST PENDENTE': 'border-amber-500/30 bg-amber-500/10 text-amber-300',
};

const cards: CommandCard[] = [
  {
    title: 'Status do Caçador',
    desc: 'Visualize atributos, nível, rank e evolução dos domínios.',
    path: '/status',
    status: 'active',
    badge: 'SISTEMA ATIVO',
    priority: 'primary',
    icon: <LayoutDashboard className="h-5 w-5" />,
    color: 'border-blue-500/40 hover:border-blue-400/80 hover:shadow-[0_0_34px_rgba(59,130,246,0.2)]',
    arrowColor: 'group-hover:border-blue-400/70 group-hover:bg-blue-500/15 group-hover:text-blue-300 group-hover:shadow-[0_0_18px_rgba(59,130,246,0.45)]',
    image: '/Cards/Status.jpeg',
  },
  {
    title: 'Quadro de Missões',
    desc: 'Gerencie hábitos, tarefas e quests bônus da IA.',
    path: '/quests',
    status: 'active',
    badge: 'QUEST PENDENTE',
    priority: 'primary',
    icon: <CheckSquare className="h-5 w-5" />,
    color: 'border-cyan-500/40 hover:border-cyan-300/80 hover:shadow-[0_0_34px_rgba(6,182,212,0.2)]',
    arrowColor: 'group-hover:border-cyan-400/70 group-hover:bg-cyan-500/15 group-hover:text-cyan-300 group-hover:shadow-[0_0_18px_rgba(6,182,212,0.45)]',
    image: '/Cards/Quadro de Missoes.jpeg',
  },
  {
    title: 'Centro de Treinamento',
    desc: 'Registre cargas, repetições e acompanhe sua evolução.',
    path: '/workouts',
    status: 'active',
    badge: 'EM PROGRESSO',
    priority: 'primary',
    icon: <Dumbbell className="h-5 w-5" />,
    color: 'border-purple-500/40 hover:border-purple-400/80 hover:shadow-[0_0_34px_rgba(168,85,247,0.2)]',
    arrowColor: 'group-hover:border-purple-400/70 group-hover:bg-purple-500/15 group-hover:text-purple-300 group-hover:shadow-[0_0_18px_rgba(168,85,247,0.45)]',
    image: '/Cards/Treinos.jpeg',
  },
  {
    title: 'Recuperação & Nutrição',
    desc: 'Monte refeições, registre alimentos e acompanhe sua estratégia.',
    path: '/nutrition',
    status: 'active',
    badge: 'NOVO',
    priority: 'secondary',
    icon: <Apple className="h-5 w-5" />,
    color: 'border-orange-500/25 hover:border-orange-400/65 hover:shadow-[0_0_28px_rgba(249,115,22,0.16)]',
    arrowColor: 'group-hover:border-orange-400/60 group-hover:bg-orange-500/15 group-hover:text-orange-300 group-hover:shadow-[0_0_16px_rgba(249,115,22,0.4)]',
    image: '/Cards/Estudos-Nutricao.jpeg',
  },
  {
    title: 'Módulo Fortuna',
    desc: 'Controle finanças, economia e evolução do atributo WIS.',
    path: '/fortuna',
    status: 'active',
    badge: 'SISTEMA ATIVO',
    priority: 'secondary',
    icon: <Coins className="h-5 w-5" />,
    color: 'border-amber-500/25 hover:border-amber-400/65 hover:shadow-[0_0_28px_rgba(245,158,11,0.16)]',
    arrowColor: 'group-hover:border-amber-400/60 group-hover:bg-amber-500/15 group-hover:text-amber-300 group-hover:shadow-[0_0_16px_rgba(245,158,11,0.4)]',
    image: '/Cards/Fortuna.jpeg',
  },
  {
    title: 'Portal dos Chefes',
    desc: 'Enfrente bosses semanais causados por hábitos ruins.',
    path: '/bosses',
    status: 'active',
    badge: 'BOSS DISPONÍVEL',
    priority: 'secondary',
    icon: <Skull className="h-5 w-5" />,
    color: 'border-rose-500/25 hover:border-rose-400/65 hover:shadow-[0_0_28px_rgba(244,63,94,0.16)]',
    arrowColor: 'group-hover:border-rose-400/60 group-hover:bg-rose-500/15 group-hover:text-rose-300 group-hover:shadow-[0_0_16px_rgba(244,63,94,0.4)]',
    image: '/Cards/Chefes Finais.jpeg',
  },
  {
    title: 'Santuário do Descanso',
    desc: 'Monitore sono, descanso e equilíbrio mental.',
    path: '/rest',
    status: 'active',
    badge: 'SISTEMA ATIVO',
    priority: 'secondary',
    icon: <Moon className="h-5 w-5" />,
    color: 'border-indigo-500/25 hover:border-indigo-400/65 hover:shadow-[0_0_28px_rgba(99,102,241,0.16)]',
    arrowColor: 'group-hover:border-indigo-400/60 group-hover:bg-indigo-500/15 group-hover:text-indigo-300 group-hover:shadow-[0_0_16px_rgba(99,102,241,0.4)]',
    image: '/Cards/Descanso-Lazer.jpeg',
  },
];

function StatusBadge({ badge }: { badge: PortalBadge }) {
  return (
    <span
      className={`rounded-md border px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] font-orbitron shadow-[0_0_12px_rgba(0,0,0,0.22)] ${badgeStyles[badge]}`}
    >
      {badge}
    </span>
  );
}

function PortalCard({ card, onOpen }: { card: CommandCard; onOpen: () => void }) {
  const isLocked = card.status === 'locked';
  const isPrimary = card.priority === 'primary';

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Abrir ${card.title}`}
      className={`group relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border bg-[#0F0F13] p-5 text-left transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.015] ${
        isPrimary ? 'min-h-[244px] lg:min-h-[260px]' : 'min-h-[205px]'
      } ${card.color} ${isLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={card.image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className={`h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:contrast-125 group-hover:saturate-125 ${
            isLocked ? 'grayscale-[40%] blur-[1px]' : ''
          }`}
        />
        <div
          className={`absolute inset-0 z-10 transition-opacity duration-500 ${
            isPrimary
              ? 'bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/78 to-black/15'
              : 'bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/88 to-black/30'
          } group-hover:via-[#0B0B0F]/70`}
        />
      </div>

      <div className="pointer-events-none absolute inset-[-35%] z-10 scale-75 rounded-full border border-white/0 opacity-0 transition-all duration-700 group-hover:scale-100 group-hover:border-white/10 group-hover:opacity-100 group-hover:shadow-[inset_0_0_80px_rgba(59,130,246,0.12)]" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_78%_22%,rgba(255,255,255,0.13),transparent_28%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative z-20 flex w-full items-start justify-between gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-300 ${
            isLocked
              ? 'border-[#1e1e26] bg-black/55 text-gray-500'
              : 'border-white/10 bg-black/60 text-white group-hover:border-white/25 group-hover:bg-black/75 group-hover:shadow-[0_0_18px_rgba(255,255,255,0.12)]'
          }`}
        >
          {isLocked ? <Lock size={16} /> : card.icon}
        </div>
        <StatusBadge badge={card.badge} />
      </div>

      <div className="relative z-20 mt-10">
        {isPrimary && (
          <div className="mb-2 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-blue-400/80 font-orbitron">
            <Sparkles className="h-3 w-3" />
            Portal principal
          </div>
        )}
        <h2
          className={`font-orbitron font-black uppercase text-white transition-colors duration-300 ${
            isPrimary ? 'text-lg tracking-[0.08em]' : 'text-[15px] tracking-[0.07em]'
          }`}
        >
          {card.title}
        </h2>
        <p className={`mt-2 max-w-[92%] font-semibold leading-relaxed text-gray-400 ${isPrimary ? 'text-xs' : 'text-[11px]'}`}>
          {card.desc}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-gray-600 transition-colors group-hover:text-gray-400">
            Acessar módulo
          </span>
          <div
            className={`flex size-8 items-center justify-center rounded-lg border border-[#252530] bg-black/65 text-gray-500 transition-all duration-300 group-hover:translate-x-1 ${card.arrowColor}`}
          >
            <ArrowRight size={15} />
          </div>
        </div>
      </div>
    </button>
  );
}

export function QuickMenu() {
  const navigate = useNavigate();
  const state = useHunterStore();
  const xpPct = state.xpRequired > 0 ? Math.min(100, (state.xp / state.xpRequired) * 100) : 0;
  const hunterName = state.username || state.fullName || 'Caçador';
  const hunterClass = state.hunterClass || 'Classe não definida';

  return (
    <div className="space-y-8 pb-16 text-silver">
      <section className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-[#0F0F13] p-5 shadow-[0_0_25px_rgba(59,130,246,0.05)] sm:p-6">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400 font-orbitron">
                Sistema de Integração Neural
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase italic tracking-wider text-white font-orbitron text-glow-blue sm:text-3xl">
              Portal de <span className="text-blue-500">Comando</span>
            </h1>
            <p className="max-w-xl text-[11px] font-semibold uppercase leading-relaxed tracking-widest text-gray-500 sm:text-xs">
              Selecione um portal para acessar seu próximo eixo de evolução.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-[#252530] bg-black/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:max-w-[390px]">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-black italic text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] font-orbitron">
                {state.rank || 'E'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black uppercase tracking-wider text-white">{hunterName}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
                  {hunterClass} <span className="text-gray-700">·</span> Rank {state.rank || 'E'}{' '}
                  <span className="text-gray-700">·</span> Level {state.level}{' '}
                  <span className="text-gray-700">·</span>{' '}
                  <span className="text-amber-400"><Zap className="mr-0.5 inline h-3 w-3" fill="currentColor" />{state.xp} XP</span>
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-[9px] font-bold uppercase tracking-widest text-gray-600">
                <span>Progresso para o próximo level</span>
                <span>{state.xp} / {state.xpRequired} XP</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_10px_rgba(59,130,246,0.45)] transition-[width] duration-700"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="primary-portals-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-blue-500 font-orbitron">Núcleo do Sistema</p>
            <h2 id="primary-portals-title" className="mt-1 text-sm font-black uppercase tracking-wider text-white font-orbitron">
              Portais principais
            </h2>
          </div>
          <span className="hidden text-[9px] font-bold uppercase tracking-widest text-gray-600 sm:block">3 módulos prioritários</span>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.filter(card => card.priority === 'primary').map(card => (
            <PortalCard key={card.title} card={card} onOpen={() => navigate(card.path)} />
          ))}
        </div>
      </section>

      <section aria-labelledby="secondary-portals-title">
        <div className="mb-4">
          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-gray-600 font-orbitron">Expansões conectadas</p>
          <h2 id="secondary-portals-title" className="mt-1 text-sm font-black uppercase tracking-wider text-white font-orbitron">
            Módulos complementares
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {cards.filter(card => card.priority === 'secondary').map(card => (
            <PortalCard key={card.title} card={card} onOpen={() => navigate(card.path)} />
          ))}
        </div>
      </section>
    </div>
  );
}

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
import { usePreferences } from '@/contexts/preferences';
import { ProductTour } from '@/components/rpg/ProductTour';
import { MAX_LEVEL } from '@/lib/progression';

type PortalBadge = 'active' | 'new' | 'progress' | 'boss' | 'quest';

interface LocalizedCopy {
  pt: string;
  en: string;
}

interface CommandCard {
  title: LocalizedCopy;
  desc: LocalizedCopy;
  path: string;
  status: 'active' | 'locked';
  badge: PortalBadge;
  priority: 'primary' | 'secondary';
  primaryLabel?: LocalizedCopy;
  icon: React.ReactNode;
  color: string;
  arrowColor: string;
  image: string;
}

const badgeStyles: Record<PortalBadge, string> = {
  active: 'border-emerald-400/45 bg-emerald-950/75 text-emerald-300',
  new: 'border-cyan-400/45 bg-cyan-950/75 text-cyan-200',
  progress: 'border-blue-400/45 bg-blue-950/75 text-blue-200',
  boss: 'border-rose-400/45 bg-rose-950/75 text-rose-300',
  quest: 'border-amber-400/45 bg-amber-950/75 text-amber-200',
};

const cards: CommandCard[] = [
  {
    title: { pt: 'Status do Caçador', en: 'Hunter Status' },
    desc: {
      pt: 'Visualize atributos, nível, rank e evolução dos domínios.',
      en: 'Review attributes, level, rank, and domain progression.',
    },
    path: '/status',
    status: 'active',
    badge: 'active',
    priority: 'primary',
    primaryLabel: { pt: 'Análise Principal', en: 'Core Analysis' },
    icon: <LayoutDashboard className="h-5 w-5" />,
    color: 'border-blue-500/40 hover:border-blue-400/80',
    arrowColor: 'group-hover:border-blue-400/70 group-hover:bg-blue-500/25 group-hover:text-blue-200',
    image: '/Cards/Status.jpeg',
  },
  {
    title: { pt: 'Quadro de Missões', en: 'Quest Board' },
    desc: {
      pt: 'Gerencie hábitos, tarefas e quests bônus da IA.',
      en: 'Manage habits, tasks, and AI-generated bonus quests.',
    },
    path: '/quests',
    status: 'active',
    badge: 'quest',
    priority: 'primary',
    primaryLabel: { pt: 'Centro de Quests', en: 'Quest Center' },
    icon: <CheckSquare className="h-5 w-5" />,
    color: 'border-cyan-500/40 hover:border-cyan-300/80',
    arrowColor: 'group-hover:border-cyan-400/70 group-hover:bg-cyan-500/25 group-hover:text-cyan-200',
    image: '/Cards/Quadro de Missoes.jpeg',
  },
  {
    title: { pt: 'Centro de Treinamento', en: 'Training Center' },
    desc: {
      pt: 'Registre cargas, repetições e acompanhe sua evolução.',
      en: 'Log weights and reps while tracking your progression.',
    },
    path: '/workouts',
    status: 'active',
    badge: 'progress',
    priority: 'primary',
    primaryLabel: { pt: 'Módulo Físico', en: 'Physical Module' },
    icon: <Dumbbell className="h-5 w-5" />,
    color: 'border-purple-500/40 hover:border-purple-400/80',
    arrowColor: 'group-hover:border-purple-400/70 group-hover:bg-purple-500/25 group-hover:text-purple-200',
    image: '/Cards/Treinos.jpeg',
  },
  {
    title: { pt: 'Recuperação & Nutrição', en: 'Recovery & Nutrition' },
    desc: {
      pt: 'Monte refeições, registre alimentos e acompanhe sua estratégia.',
      en: 'Build meals, log foods, and monitor your nutrition strategy.',
    },
    path: '/nutrition',
    status: 'active',
    badge: 'new',
    priority: 'secondary',
    icon: <Apple className="h-5 w-5" />,
    color: 'border-orange-500/35 hover:border-orange-400/70',
    arrowColor: 'group-hover:border-orange-400/60 group-hover:bg-orange-500/25 group-hover:text-orange-200',
    image: '/Cards/Estudos-Nutricao.jpeg',
  },
  {
    title: { pt: 'Módulo Fortuna', en: 'Fortune Module' },
    desc: {
      pt: 'Controle finanças, economia e evolução do atributo WIS.',
      en: 'Manage finances, savings, and progression of your WIS attribute.',
    },
    path: '/fortuna',
    status: 'active',
    badge: 'active',
    priority: 'secondary',
    icon: <Coins className="h-5 w-5" />,
    color: 'border-amber-500/35 hover:border-amber-400/70',
    arrowColor: 'group-hover:border-amber-400/60 group-hover:bg-amber-500/25 group-hover:text-amber-200',
    image: '/Cards/Fortuna.jpeg',
  },
  {
    title: { pt: 'Portal dos Chefes', en: 'Boss Portal' },
    desc: {
      pt: 'Enfrente bosses semanais causados por hábitos ruins.',
      en: 'Face weekly bosses created by destructive habits.',
    },
    path: '/bosses',
    status: 'active',
    badge: 'boss',
    priority: 'secondary',
    icon: <Skull className="h-5 w-5" />,
    color: 'border-rose-500/35 hover:border-rose-400/70',
    arrowColor: 'group-hover:border-rose-400/60 group-hover:bg-rose-500/25 group-hover:text-rose-200',
    image: '/Cards/Chefes Finais.jpeg',
  },
  {
    title: { pt: 'Santuário do Descanso', en: 'Recovery Sanctuary' },
    desc: {
      pt: 'Monitore sono, descanso e equilíbrio mental.',
      en: 'Track sleep, recovery, leisure, and mental balance.',
    },
    path: '/rest',
    status: 'active',
    badge: 'active',
    priority: 'secondary',
    icon: <Moon className="h-5 w-5" />,
    color: 'border-indigo-500/35 hover:border-indigo-400/70',
    arrowColor: 'group-hover:border-indigo-400/60 group-hover:bg-indigo-500/25 group-hover:text-indigo-200',
    image: '/Cards/Descanso-Lazer.jpeg',
  },
];

const badgeCopy: Record<PortalBadge, LocalizedCopy> = {
  active: { pt: 'Sistema ativo', en: 'System active' },
  new: { pt: 'Novo', en: 'New' },
  progress: { pt: 'Em progresso', en: 'In progress' },
  boss: { pt: 'Boss disponível', en: 'Boss available' },
  quest: { pt: 'Quest pendente', en: 'Quest pending' },
};

function StatusBadge({ badge, isEnglish }: { badge: PortalBadge; isEnglish: boolean }) {
  return (
    <span
      className={`rounded-md border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] font-orbitron ${badgeStyles[badge]}`}
    >
      {isEnglish ? badgeCopy[badge].en : badgeCopy[badge].pt}
    </span>
  );
}

function PortalCard({ card, onOpen, isEnglish }: { card: CommandCard; onOpen: () => void; isEnglish: boolean }) {
  const isLocked = card.status === 'locked';
  const isPrimary = card.priority === 'primary';
  const copy = (value: LocalizedCopy) => isEnglish ? value.en : value.pt;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${isEnglish ? 'Open' : 'Abrir'} ${copy(card.title)}`}
      className={`theme-preserve-dark group relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border bg-[#0F0F13] p-5 text-left transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 motion-safe:hover:-translate-y-1 ${
        isPrimary ? 'min-h-[244px] lg:min-h-[260px]' : 'min-h-[205px]'
      } ${card.color} ${isLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={card.image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035] ${
            isLocked ? 'grayscale-[40%] blur-[1px]' : ''
          }`}
        />
        <div
          className={`absolute inset-0 z-10 transition-opacity duration-500 ${
            isPrimary
              ? 'bg-gradient-to-t from-black/90 via-black/20 via-55% to-transparent'
              : 'bg-gradient-to-t from-black/90 via-black/15 via-58% to-transparent'
          }`}
        />
      </div>

      <div className="relative z-20 flex w-full items-start justify-between gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-300 ${
            isLocked
              ? 'border-[#1e1e26] bg-black/55 text-gray-500'
              : 'border-white/25 bg-black/55 text-white group-hover:border-white/40 group-hover:bg-black/70'
          }`}
        >
          {isLocked ? <Lock size={16} /> : card.icon}
        </div>
        <StatusBadge badge={card.badge} isEnglish={isEnglish} />
      </div>

      <div className="relative z-20 mt-10">
        {isPrimary && (
          <div className="mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-blue-300 font-orbitron">
            <Sparkles className="h-3 w-3" />
            {card.primaryLabel && copy(card.primaryLabel)}
          </div>
        )}
        <h2
          className={`font-orbitron font-black uppercase text-white transition-colors duration-300 ${
            isPrimary ? 'text-lg tracking-[0.08em]' : 'text-[15px] tracking-[0.07em]'
          }`}
        >
          {copy(card.title)}
        </h2>
        <p className={`mt-2 max-w-[96%] font-semibold leading-relaxed text-gray-300 ${isPrimary ? 'text-[13px]' : 'text-xs'}`}>
          {copy(card.desc)}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400 transition-colors group-hover:text-white">
            {isEnglish ? 'Open module' : 'Acessar módulo'}
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
  const { language, t } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => isEnglish ? en : pt;
  const navigate = useNavigate();
  const state = useHunterStore();
  const xpPct = state.level >= MAX_LEVEL
    ? 100
    : state.xpRequired > 0
      ? Math.min(100, (state.xp / state.xpRequired) * 100)
      : 0;
  const hunterName = state.username || state.fullName || l('Caçador', 'Hunter');
  const hunterClass = state.hunterClass || l('Classe não definida', 'Class not selected');

  return (
    <div className="space-y-8 pb-16 text-silver">
      <section id="tour-portal-header" className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-[#0F0F13] p-5 shadow-[0_0_25px_rgba(59,130,246,0.05)] sm:p-6">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400 font-orbitron">
                {l('Sistema de Integração Neural', 'Neural Integration System')}
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase italic tracking-wider text-white font-orbitron text-glow-blue sm:text-3xl">
              {t('pages.portal')}
            </h1>
            <p className="max-w-xl text-[11px] font-semibold uppercase leading-relaxed tracking-widest text-gray-500 sm:text-xs">
              {l(
                'Selecione um portal para acessar seu próximo eixo de evolução.',
                'Select a portal to access your next path of progression.',
              )}
            </p>
          </div>

          <div className="w-full rounded-2xl border border-blue-500/15 bg-black/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_24px_rgba(59,130,246,0.06)] lg:max-w-[410px]">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-black italic text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] font-orbitron">
                {state.rank || 'E'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black uppercase tracking-[0.12em] text-white">{hunterName}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                  {hunterClass} <span className="text-gray-600">•</span> Rank {state.rank || 'E'}
                </p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.1em] text-blue-400">
                  {l('Nível', 'Level')} {state.level} <span className="text-gray-600">—</span>{' '}
                  <span className="text-amber-400"><Zap className="mr-0.5 inline h-3 w-3" fill="currentColor" />{state.xp} / {state.xpRequired} XP</span>
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-[9px] font-bold uppercase tracking-widest text-gray-600">
                <span>{l('Progresso para o próximo nível', 'Progress to next level')}</span>
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

      <section id="tour-portal-recommended" className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-[#0F0F13] px-5 py-4 shadow-[0_0_24px_rgba(124,58,237,0.06)]">
        <div className="absolute right-0 top-0 h-full w-40 bg-gradient-to-l from-purple-500/8 to-transparent" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-300">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-purple-400 font-orbitron">
                {l('Próxima ação recomendada', 'Recommended next action')}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-200">
                {l('Complete sua primeira missão diária para ganhar XP.', 'Complete your first daily quest to earn XP.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/quests')}
            className="flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-purple-200 transition-all hover:border-purple-400/60 hover:bg-purple-500/20 hover:text-white hover:shadow-[0_0_18px_rgba(124,58,237,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
          >
            {l('Abrir Quadro de Missões', 'Open Quest Board')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section aria-labelledby="primary-portals-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-blue-500 font-orbitron">
              {l('Núcleo do Sistema', 'System Core')}
            </p>
            <h2 id="primary-portals-title" className="mt-1 text-sm font-black uppercase tracking-wider text-white font-orbitron">
              {l('Portais principais', 'Primary portals')}
            </h2>
          </div>
          <span className="hidden text-[9px] font-bold uppercase tracking-widest text-gray-600 sm:block">
            {l('3 módulos prioritários', '3 priority modules')}
          </span>
        </div>
        <div id="tour-portal-primary" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.filter(card => card.priority === 'primary').map(card => (
            <PortalCard key={card.path} card={card} isEnglish={isEnglish} onOpen={() => navigate(card.path)} />
          ))}
        </div>
      </section>

      <section aria-labelledby="secondary-portals-title">
        <div className="mb-4">
          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-gray-600 font-orbitron">
            {l('Expansões conectadas', 'Connected expansions')}
          </p>
          <h2 id="secondary-portals-title" className="mt-1 text-sm font-black uppercase tracking-wider text-white font-orbitron">
            {l('Módulos complementares', 'Complementary modules')}
          </h2>
        </div>
        <div id="tour-portal-secondary" className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {cards.filter(card => card.priority === 'secondary').map(card => (
            <PortalCard key={card.path} card={card} isEnglish={isEnglish} onOpen={() => navigate(card.path)} />
          ))}
        </div>
      </section>
      <ProductTour />
    </div>
  );
}

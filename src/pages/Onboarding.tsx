import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useHunterStore, type HunterClass, type HunterGender } from '../stores/useHunterStore';
import { supabase } from '../lib/supabase';
import { MatrixLoader } from '../components/ui/matrix-loader';
import {
  Shield, Sword, Book, Zap, ChevronRight, ChevronLeft, Lightbulb, Crown,
  User, Calendar, Ruler, Weight, Target, Brain, Dumbbell, Star,
  CheckCircle2, ArrowRight, Sparkles, Activity, ScanLine, Trophy,
  Maximize2, X, AlertTriangle, ArrowLeft, LogOut, Flame, Apple,
  Clock, Check, Layers
} from 'lucide-react';
import { usePreferences } from '@/contexts/preferences';
import { LanguageSwitcher } from '@/components/preferences/LanguageSwitcher';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { NeonProgressBar } from '@/components/ui/neon-progress';
import {
  applyHunterInitialSetup,
  getCalibratedInitialStats,
  getRecommendedPinnedActions,
  getInitialHabitPresets,
  mapMainGoalToTrainingGoal,
} from '@/lib/onboardingSetup';
import { generateTrainingProtocol } from '@/lib/trainingGenerator';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type OnboardingStep =
  | 'loading'
  | 'basic-info'
  | 'physical-profile'
  | 'main-goal'
  | 'experience-level'
  | 'architect-intro'
  | 'class-quiz'
  | 'awakening'
  | 'class-selection';

interface FormData {
  fullName: string;
  birthday: string;
  gender: HunterGender | '';
  height: string;
  weightCurrent: string;
  weightTarget: string;
  trainingFocus: string;
  nutritionGoal: string;
  mainGoal: string;
  experienceLevel: string;
  workoutFrequency: number;
  workoutEnvironment: 'gym' | 'home' | 'hybrid';
  physicalRestrictions: Array<'lombar' | 'joelho' | 'ombro' | 'punho' | 'cervical'>;
  primaryDifficulty: string;
  dailyAvailability: '30' | '60' | '90';
}

// ─── Dados do Questionário (narrativa do Arquiteto) ───────────────────────────
const QUESTIONS = [
  {
    id: 'q1',
    title: '"Quando você pensa em evoluir, o que te vem primeiro à mente?"',
    options: [
      { id: 'Warrior',  label: 'Superar meus limites físicos. Ser mais forte e inabalável.' },
      { id: 'Scholar',  label: 'Aprender. Dominar conhecimento e habilidades com precisão.' },
      { id: 'Creator',  label: 'Criar. Construir algo que inspire e impacte o mundo.' },
      { id: 'Monk',     label: 'Equilíbrio. Paz interior e harmonia entre corpo e mente.' },
      { id: 'Leader',   label: 'Liderar. Elevar as pessoas ao meu redor enquanto cresço.' },
    ],
  },
  {
    id: 'q2',
    title: '"Um obstáculo aparece na sua frente. Como você age?"',
    options: [
      { id: 'Warrior',  label: 'Enfrento de cabeça com força e determinação, sem recuar.' },
      { id: 'Scholar',  label: 'Estudo o problema a fundo e encontro a solução mais inteligente.' },
      { id: 'Creator',  label: 'Procuro um ângulo diferente. Encontro soluções que ninguém viu.' },
      { id: 'Monk',     label: 'Respiro fundo, me adapto e fluo ao redor dele como água.' },
      { id: 'Leader',   label: 'Mobilizo quem está ao meu redor. Juntos resolvemos mais rápido.' },
    ],
  },
  {
    id: 'q3',
    title: '"O que não pode faltar na sua rotina de evolução?"',
    options: [
      { id: 'Warrior',  label: 'Progressão constante de intensidade e superação de carga.' },
      { id: 'Scholar',  label: 'Registro metódico, análise de progresso e aprendizado diário.' },
      { id: 'Creator',  label: 'Espaço para criar, experimentar e expressar minhas ideias.' },
      { id: 'Monk',     label: 'Mobilidade, meditação e escuta do próprio corpo.' },
      { id: 'Leader',   label: 'Conexão com pessoas. Feedback, mentoria e relacionamentos.' },
    ],
  },
  {
    id: 'q4',
    title: '"Como você prefere ser lembrado por quem te conhece?"',
    options: [
      { id: 'Warrior',  label: 'Pela força física e conquistas que todo mundo consegue ver.' },
      { id: 'Scholar',  label: 'Pela clareza, inteligência e profundidade de conhecimento.' },
      { id: 'Creator',  label: 'Por ter criado algo que durou muito além de mim.' },
      { id: 'Monk',     label: 'Pela calma e equilíbrio mesmo sob pressão extrema.' },
      { id: 'Leader',   label: 'Por ter transformado a vida de quem caminhou comigo.' },
    ],
  },
  {
    id: 'q5',
    title: '"Qual dessas frases ressoa mais fundo em você?"',
    options: [
      { id: 'Warrior',  label: '"O ferro forja o guerreiro. A dor é combustível."' },
      { id: 'Scholar',  label: '"Conhecimento é poder absoluto. Cada página é uma arma."' },
      { id: 'Creator',  label: '"Quem cria, deixa marcas que o tempo não apaga."' },
      { id: 'Monk',     label: '"A mente em silêncio move montanhas invisíveis."' },
      { id: 'Leader',   label: '"Um verdadeiro líder caminha à frente, mas nunca sozinho."' },
    ],
  },
];

const QUESTIONS_EN = [
  {
    id: 'q1',
    title: '"When you think about evolving, what comes to mind first?"',
    options: [
      { id: 'Warrior', label: 'Push past my physical limits. Become stronger and unshakable.' },
      { id: 'Scholar', label: 'Learn. Master knowledge and skills with precision.' },
      { id: 'Creator', label: 'Create. Build something that inspires and impacts the world.' },
      { id: 'Monk', label: 'Balance. Inner peace and harmony between body and mind.' },
      { id: 'Leader', label: 'Lead. Elevate the people around me as I grow.' },
    ],
  },
  {
    id: 'q2',
    title: '"An obstacle appears before you. How do you act?"',
    options: [
      { id: 'Warrior', label: 'I face it head-on with strength and determination.' },
      { id: 'Scholar', label: 'I study the problem deeply and find the smartest solution.' },
      { id: 'Creator', label: 'I seek a different angle and find solutions no one has seen.' },
      { id: 'Monk', label: 'I breathe, adapt, and flow around it like water.' },
      { id: 'Leader', label: 'I mobilize those around me. Together we solve it faster.' },
    ],
  },
  {
    id: 'q3',
    title: '"What must be present in your evolution routine?"',
    options: [
      { id: 'Warrior', label: 'Constant intensity progression and overcoming heavier loads.' },
      { id: 'Scholar', label: 'Methodical records, progress analysis, and daily learning.' },
      { id: 'Creator', label: 'Space to create, experiment, and express my ideas.' },
      { id: 'Monk', label: 'Mobility, meditation, and listening to my own body.' },
      { id: 'Leader', label: 'Connection with people, feedback, mentoring, and relationships.' },
    ],
  },
  {
    id: 'q4',
    title: '"How would you like to be remembered?"',
    options: [
      { id: 'Warrior', label: 'For physical strength and achievements everyone can see.' },
      { id: 'Scholar', label: 'For clarity, intelligence, and depth of knowledge.' },
      { id: 'Creator', label: 'For creating something that lasted far beyond me.' },
      { id: 'Monk', label: 'For calm and balance even under extreme pressure.' },
      { id: 'Leader', label: 'For transforming the lives of those who walked with me.' },
    ],
  },
  {
    id: 'q5',
    title: '"Which phrase resonates most deeply with you?"',
    options: [
      { id: 'Warrior', label: '"Iron forges the warrior. Pain is fuel."' },
      { id: 'Scholar', label: '"Knowledge is absolute power. Every page is a weapon."' },
      { id: 'Creator', label: '"Those who create leave marks time cannot erase."' },
      { id: 'Monk', label: '"A silent mind moves invisible mountains."' },
      { id: 'Leader', label: '"A true leader walks ahead, but never alone."' },
    ],
  },
];

// ─── Classes ──────────────────────────────────────────────────────────────────
const CLASSES = [
  {
    id: 'Warrior' as HunterClass,
    name: 'WARRIOR',
    tagline: 'O Corpo é a Arma',
    description: 'Especialista em Força Bruta. Sua jornada é pavimentada por ferro e superação física.',
    icon: <Sword className="w-8 h-8 text-blue-400" />,
    color: 'border-blue-500/50 hover:border-blue-400',
    accent: 'text-blue-400',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
    image: '/optimized/Classes/Warrior/Rank E.jpg',
    stats: 'FOR 13 · RES 12 · VIT 11',
  },
  {
    id: 'Scholar' as HunterClass,
    name: 'SCHOLAR',
    tagline: 'A Mente é o Campo de Batalha',
    description: 'Mestre da Mente. Evolução pelo conhecimento, foco e disciplina intelectual.',
    icon: <Book className="w-8 h-8 text-purple-400" />,
    color: 'border-purple-500/50 hover:border-purple-400',
    accent: 'text-purple-400',
    glow: 'shadow-[0_0_30px_rgba(124,58,237,0.3)]',
    image: '/optimized/Classes/Scholar/Rank E.jpg',
    stats: 'INT 13 · SAB 12 · DIS 11',
  },
  {
    id: 'Creator' as HunterClass,
    name: 'CREATOR',
    tagline: 'Criar é Evoluir',
    description: 'Arquiteto de Mundos. Evolui construindo, expressando e inovando sem limites.',
    icon: <Sparkles className="w-8 h-8 text-amber-400" />,
    color: 'border-amber-500/50 hover:border-amber-400',
    accent: 'text-amber-400',
    glow: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]',
    image: '/optimized/Classes/Creator/Rank E.jpg',
    stats: 'INT 12 · DIS 12 · SAB 11',
  },
  {
    id: 'Monk' as HunterClass,
    name: 'MONK',
    tagline: 'O Equilíbrio é Poder',
    description: 'Harmonia Total. Busca a perfeição entre o corpo e a mente através da vitalidade.',
    icon: <Zap className="w-8 h-8 text-cyan-400" />,
    color: 'border-cyan-500/50 hover:border-cyan-400',
    accent: 'text-cyan-400',
    glow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]',
    image: '/optimized/Classes/Monk/Rank E.jpg',
    stats: 'VIT 13 · EQU 12 · RES 11',
  },
  {
    id: 'Leader' as HunterClass,
    name: 'LEADER',
    tagline: 'Quem Lidera, Multiplica',
    description: 'Comandante Supremo. Cresce elevando os que estão ao seu redor.',
    icon: <Crown className="w-8 h-8 text-rose-400" />,
    color: 'border-rose-500/50 hover:border-rose-400',
    accent: 'text-rose-400',
    glow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]',
    image: '/optimized/Classes/Leader/Rank E.jpg',
    stats: 'DIS 13 · SAB 12 · EQU 11',
  },
];

const CLASS_EN: Record<HunterClass, { tagline: string; description: string }> = {
  Warrior: {
    tagline: 'The Body Is the Weapon',
    description: 'A specialist in raw strength. Your journey is paved with iron and physical conquest.',
  },
  Scholar: {
    tagline: 'The Mind Is the Battlefield',
    description: 'Master of the mind. Evolves through knowledge, focus, and intellectual discipline.',
  },
  Creator: {
    tagline: 'To Create Is to Evolve',
    description: 'Architect of worlds. Evolves by building, expressing, and innovating without limits.',
  },
  Monk: {
    tagline: 'Balance Is Power',
    description: 'Total harmony. Seeks perfection between body and mind through vitality.',
  },
  Leader: {
    tagline: 'Leadership Multiplies',
    description: 'Supreme commander. Grows by elevating everyone around them.',
  },
};

const RANK_DESCRIPTIONS: Record<HunterClass, Record<string, string>> = {
  Warrior: {
    E: "Soldado Recruta. Força física ligeiramente elevada. O início de sua pavimentação por ferro.",
    D: "Guerreiro de Vanguarda. Corpo blindado capaz de suportar impactos diretos de mana.",
    C: "Cavaleiro do Caos. Domínio excelente de combate a curta distância e golpes destruidores.",
    B: "Paladino da Ruína. A força física gera ondas de choque destrutivas ao colidir.",
    A: "Warlord Titã. Um exército de um homem só capaz de limpar fendas de alto nível sozinho.",
    S: "Monarca do Ferro. O ápice da força inabalável. Nada no universo pode romper sua armadura."
  },
  Scholar: {
    E: "Aprendiz de Mana. Percepção sensorial e leitura inicial do fluxo oculto de energia.",
    D: "Mago Incipiente. Foco mental afiado e raciocínio lógico sob pressão extrema.",
    C: "Sabedor das Runas. Decifração de escritas proibidas e conjuração de feitiços médios.",
    B: "Arquimago do Conhecimento. Domínio de feitiços complexos e estratégias profundas de evolução.",
    A: "Sábio Dimensional. Distorção das leis físicas simples e manipulação de espaço-tempo.",
    S: "Arquivista do Destino. Conhecimento absoluto do Sistema. Sua mente calcula todas as variáveis do universo."
  },
  Creator: {
    E: "Artesão Iniciante. Criação de ferramentas rudimentares e prototipagem rápida de hábitos.",
    D: "Inventor do Sistema. Planejamento geométrico de rotinas de alta durabilidade.",
    C: "Forjador de Runas. Criação de itens de suporte que auxiliam na jornada e aumentam a produtividade.",
    B: "Engenheiro de Mana. Automação de processos cognitivos e rotinas de evolução em lote.",
    A: "Arquiteto da Fenda. Manipulação espacial de áreas personalizadas de treino corporal.",
    S: "Criador do Vazio. Capacidade de manifestar e forjar qualquer realidade através da mana pura."
  },
  Monk: {
    E: "Iniciado do Templo. Respiração controlada e meditação básica para equilíbrio inicial.",
    D: "Monge da Brisa. Agilidade física aprimorada e flexibilidade muscular.",
    C: "Guerreiro Espiritual. Alinhamento perfeito permitindo cura e remoção rápida de fadiga física.",
    B: "Mestre do Qi. Manipulação interna de energia vital para imunidade a desgastes diários.",
    A: "Asceta Iluminado. Estado mental inabalável e imunidade completa à fadiga psicológica.",
    S: "Monarca do Nirvana. Controle biológico perfeito. Sua vitalidade e energia de mana tornam-se infinitas."
  },
  Leader: {
    E: "Líder de Esquadrão. Orientação de pequenos grupos e compartilhamento de metas de evolução.",
    D: "Comandante de Campo. Capacidade de inspirar persistência e disciplina nos companheiros.",
    C: "Estrategista de Guilda. Coordenação de equipes para maximizar o rendimento coletivo.",
    B: "General das Fendas. Habilidade tática superior para liderar campanhas complexas de evolução.",
    A: "Soberano da Aliança. Influência massiva guiando guildas inteiras em direção ao progresso.",
    S: "Imperador do Destino. Autoridade soberana. Sua presença eleva o poder de todos ao redor a níveis lendários."
  }
};

const RANK_DESCRIPTIONS_EN: Record<HunterClass, Record<string, string>> = {
  Warrior: {
    E: 'Recruit Soldier. Slightly elevated physical strength—the beginning of your iron path.',
    D: 'Vanguard Warrior. An armored body capable of enduring direct mana impacts.',
    C: 'Chaos Knight. Excellent close-combat mastery and devastating strikes.',
    B: 'Paladin of Ruin. Physical strength creates destructive shockwaves on impact.',
    A: 'Titan Warlord. A one-person army capable of clearing high-level Gates alone.',
    S: 'Iron Monarch. The peak of unshakable strength. Nothing can break your armor.',
  },
  Scholar: {
    E: 'Mana Apprentice. Initial perception and reading of hidden energy flows.',
    D: 'Emerging Mage. Sharp mental focus and logical reasoning under extreme pressure.',
    C: 'Rune Sage. Deciphers forbidden writings and casts intermediate spells.',
    B: 'Archmage of Knowledge. Master of complex spells and deep evolution strategies.',
    A: 'Dimensional Sage. Distorts simple physical laws and manipulates space-time.',
    S: 'Archivist of Fate. Absolute knowledge of the System and all its variables.',
  },
  Creator: {
    E: 'Novice Artisan. Creates basic tools and rapidly prototypes habits.',
    D: 'System Inventor. Geometric planning of highly durable routines.',
    C: 'Rune Forger. Creates support items that increase productivity.',
    B: 'Mana Engineer. Automates cognitive processes and evolution routines.',
    A: 'Gate Architect. Spatial manipulation of personalized training areas.',
    S: 'Void Creator. Manifests and forges reality through pure mana.',
  },
  Monk: {
    E: 'Temple Initiate. Controlled breathing and basic meditation.',
    D: 'Breeze Monk. Enhanced physical agility and muscular flexibility.',
    C: 'Spirit Warrior. Perfect alignment enables healing and rapid fatigue removal.',
    B: 'Master of Qi. Manipulates vital energy to resist daily wear.',
    A: 'Enlightened Ascetic. An unshakable mind immune to psychological fatigue.',
    S: 'Monarch of Nirvana. Perfect biological control and seemingly infinite vitality.',
  },
  Leader: {
    E: 'Squad Leader. Guides small groups and shares evolution goals.',
    D: 'Field Commander. Inspires persistence and discipline in companions.',
    C: 'Guild Strategist. Coordinates teams to maximize collective output.',
    B: 'Gate General. Superior tactical ability for complex evolution campaigns.',
    A: 'Alliance Sovereign. Guides entire guilds toward progress.',
    S: 'Emperor of Fate. A sovereign presence that elevates everyone nearby.',
  },
};

const AWAKENING_MESSAGES = [
  'Inicializando protocolo de avaliação...',
  'Lendo assinatura biológica e mana...',
  'Configurando metas fisiológicas e metabólicas...',
  'Sintetizando rotinas de treinamento e hábitos...',
  'Padrão de linhagem identificado na Fenda...',
  'Setup Inicial pronto. Classe determinada pelo Arquiteto.',
];

const AWAKENING_MESSAGES_EN = [
  'Initializing assessment protocol...',
  'Reading biological and mana signature...',
  'Configuring physiological & metabolic targets...',
  'Synthesizing workout routines and daily habits...',
  'Lineage pattern identified in the Gate...',
  'Initial setup ready. Class determined by the Architect.',
];

const RITUAL_STEPS: Array<{ id: Exclude<OnboardingStep, 'loading'>; label: string; phase: string }> = [
  { id: 'basic-info', label: 'Calibração de Identidade', phase: 'Fase I' },
  { id: 'physical-profile', label: 'Análise Corporal & Ambiente', phase: 'Fase II' },
  { id: 'main-goal', label: 'Missão Central & Foco', phase: 'Fase III' },
  { id: 'experience-level', label: 'Calibração de Rank & Tempo', phase: 'Fase IV' },
  { id: 'architect-intro', label: 'Contato do Arquiteto', phase: 'Fase V' },
  { id: 'class-quiz', label: 'Avaliação do Sistema', phase: 'Fase VI' },
  { id: 'awakening', label: 'Síntese de Mana & Setup', phase: 'Fase VII' },
  { id: 'class-selection', label: 'Despertar da Classe', phase: 'Fase VIII' },
];

const RITUAL_STEPS_EN: typeof RITUAL_STEPS = [
  { id: 'basic-info', label: 'Identity Calibration', phase: 'Phase I' },
  { id: 'physical-profile', label: 'Body Analysis & Setup', phase: 'Phase II' },
  { id: 'main-goal', label: 'Core Mission & Focus', phase: 'Phase III' },
  { id: 'experience-level', label: 'Rank Calibration & Time', phase: 'Phase IV' },
  { id: 'architect-intro', label: 'Architect Contact', phase: 'Phase V' },
  { id: 'class-quiz', label: 'System Assessment', phase: 'Phase VI' },
  { id: 'awakening', label: 'Mana Synthesis & Setup', phase: 'Phase VII' },
  { id: 'class-selection', label: 'Class Awakening', phase: 'Phase VIII' },
];

const getRitualProgress = (step: OnboardingStep, currentQuestionIndex: number) => {
  if (step === 'loading') return 0;
  const baseIndex = RITUAL_STEPS.findIndex(item => item.id === step);
  if (baseIndex < 0) return 0;
  const baseProgress = (baseIndex / RITUAL_STEPS.length) * 100;
  if (step === 'class-quiz') {
    return Math.round(baseProgress + ((currentQuestionIndex + 1) / QUESTIONS.length) * (100 / RITUAL_STEPS.length));
  }
  if (step === 'awakening') return 92;
  if (step === 'class-selection') return 100;
  return Math.round(((baseIndex + 1) / RITUAL_STEPS.length) * 100);
};

// ─── Componente OptionCard ────────────────────────────────────────────────────
function OptionCard({
  label,
  sublabel,
  isSelected,
  onClick,
  icon,
  delay = 0,
}: {
  label: string;
  sublabel?: string;
  isSelected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.button
      type="button"
      role="button"
      aria-pressed={isSelected}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      transition={{ delay, duration: 0.2 }}
      onClick={onClick}
      className={`
        w-full group relative flex min-h-[52px] items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border-l-4 cursor-pointer select-none overflow-hidden text-left
        transition-all duration-200 ease-out
        ${isSelected
          ? 'bg-purple-500/20 border-purple-400 shadow-[0_0_20px_rgba(124,58,237,0.35)] ring-1 ring-purple-500/50'
          : 'bg-[#12131A] border-purple-900/40 hover:bg-purple-950/30 hover:border-purple-600/70 hover:shadow-[0_0_15px_rgba(124,58,237,0.12)]'}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <p className={`text-xs sm:text-sm font-medium leading-snug ${isSelected ? 'text-purple-100 font-semibold' : 'text-gray-300'}`}>
          {label}
        </p>
        {sublabel && (
          <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1 font-mono">
            {sublabel}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        <CheckCircle2 className={`w-4 h-4 transition-colors ${isSelected ? 'text-purple-400' : 'text-gray-600'}`} />
      </div>
    </motion.button>
  );
}

// ─── Componente StepHeader ────────────────────────────────────────────────────
function StepHeader({ step, total, label, progress }: { step: number; total: number; label: string; progress?: number }) {
  const { language } = usePreferences();
  return (
    <div className="space-y-3 text-center mb-6">
      {typeof progress === 'number' && (
        <div className="mx-auto max-w-sm rounded-xl border border-purple-500/20 bg-purple-950/20 p-2.5 shadow-[0_0_20px_rgba(124,58,237,0.1)]">
          <div className="mb-1.5 flex items-center justify-between text-[9px] font-orbitron uppercase tracking-widest text-purple-400">
            <span className="flex items-center gap-1.5"><ScanLine className="w-3 h-3" /> {language === 'en-US' ? 'Awakening Progress' : 'Progresso do Despertar'}</span>
            <span className="font-bold">{progress}%</span>
          </div>
          <NeonProgressBar value={progress} max={100} variant="xp" size="sm" />
        </div>
      )}
      <span className="inline-block text-[10px] font-orbitron text-purple-400 tracking-[0.25em] uppercase">
        {language === 'en-US' ? `Phase ${step} of ${total}` : `Fase ${step} de ${total}`} · {label}
      </span>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export function Onboarding() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const hunterStore = useHunterStore();
  const { hunterClass, setHunterClass, profileLoaded, profileLoading, profileError, loadProfile } = hunterStore;
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => isEnglish ? en : pt;

  const questions = isEnglish ? QUESTIONS_EN : QUESTIONS;
  const classes = CLASSES.map(hunterClassData => ({
    ...hunterClassData,
    ...(isEnglish ? CLASS_EN[hunterClassData.id] : {}),
  }));
  const rankDescriptions = isEnglish ? RANK_DESCRIPTIONS_EN : RANK_DESCRIPTIONS;
  const awakeningMessages = isEnglish ? AWAKENING_MESSAGES_EN : AWAKENING_MESSAGES;
  const ritualSteps = isEnglish ? RITUAL_STEPS_EN : RITUAL_STEPS;

  const [step, setStep] = useState<OnboardingStep>('loading');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealedClass, setRevealedClass] = useState<HunterClass | null>(null);
  const [selectedClass, setSelectedClass] = useState<HunterClass | null>(null);
  const [awakeningMsgIdx, setAwakeningMsgIdx] = useState(0);
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [previewClassId, setPreviewClassId] = useState<HunterClass | null>(null);
  const [previewRank, setPreviewRank] = useState<'E' | 'D' | 'C' | 'B' | 'A' | 'S'>('E');

  const [form, setForm] = useState<FormData>({
    fullName: '',
    birthday: '',
    gender: '',
    height: '',
    weightCurrent: '',
    weightTarget: '',
    trainingFocus: 'Musculação',
    nutritionGoal: 'maintain',
    mainGoal: 'general_health',
    experienceLevel: 'beginner',
    workoutFrequency: 3,
    workoutEnvironment: 'gym',
    physicalRestrictions: [],
    primaryDifficulty: 'inconsistency',
    dailyAvailability: '60',
  });

  // 1. Redirecionamento Imediato de Perfil Completo
  useEffect(() => {
    if (hunterClass) {
      navigate('/', { replace: true });
    }
  }, [hunterClass, navigate]);

  // 2. Garantir sincronização se o profile ainda não foi lido
  useEffect(() => {
    if (user?.id && !profileLoaded && !profileLoading && !profileError) {
      void loadProfile(user.id);
    }
  }, [user?.id, profileLoaded, profileLoading, profileError, loadProfile]);

  // 3. Preenchimento Inteligente com Dados Já Existentes do Caçador
  useEffect(() => {
    if (profileLoaded && user) {
      setForm(prev => ({
        fullName: prev.fullName || hunterStore.fullName || '',
        birthday: prev.birthday || hunterStore.birthday || '',
        gender: prev.gender || (hunterStore.gender as HunterGender) || '',
        height: prev.height || (hunterStore.height ? String(hunterStore.height) : ''),
        weightCurrent: prev.weightCurrent || (hunterStore.weightCurrent ? String(hunterStore.weightCurrent) : ''),
        weightTarget: prev.weightTarget || (hunterStore.weightTarget ? String(hunterStore.weightTarget) : ''),
        trainingFocus: prev.trainingFocus || hunterStore.trainingFocus || 'Musculação',
        nutritionGoal: prev.nutritionGoal || hunterStore.nutritionGoal || 'maintain',
        mainGoal: prev.mainGoal || hunterStore.mainGoal || 'general_health',
        experienceLevel: prev.experienceLevel || hunterStore.experienceLevel || 'beginner',
        workoutFrequency: prev.workoutFrequency || 3,
        workoutEnvironment: prev.workoutEnvironment || 'gym',
        physicalRestrictions: prev.physicalRestrictions || [],
        primaryDifficulty: prev.primaryDifficulty || 'inconsistency',
        dailyAvailability: prev.dailyAvailability || '60',
      }));
    }
  }, [profileLoaded, user, hunterStore]);

  // 4. Restauração de Rascunho do Quiz
  useEffect(() => {
    if (!user?.id) return;
    try {
      const savedQuiz = localStorage.getItem(`ascend_onboarding_quiz_${user.id}`);
      if (savedQuiz) {
        const parsed = JSON.parse(savedQuiz);
        if (parsed && typeof parsed === 'object') {
          setAnswers(parsed);
        }
      }
    } catch {}
  }, [user?.id]);

  // 5. Restauração de Etapa Adequada (Sem Repetir Passos Desnecessariamente)
  useEffect(() => {
    if (profileLoading) return;
    if (hunterClass) return;

    if (profileLoaded && step === 'loading') {
      if (hunterStore.experienceLevel) {
        setStep('architect-intro');
      } else if (hunterStore.mainGoal) {
        setStep('experience-level');
      } else if (hunterStore.trainingFocus || hunterStore.height || hunterStore.weightCurrent) {
        setStep('main-goal');
      } else if (hunterStore.fullName && hunterStore.gender) {
        setStep('physical-profile');
      } else {
        setStep('basic-info');
      }
    }
  }, [hunterClass, profileLoaded, profileLoading, hunterStore, step]);

  // Animação de mensagens na síntese de mana (awakening)
  useEffect(() => {
    if (step !== 'awakening') return;
    const interval = setInterval(() => {
      setAwakeningMsgIdx(prev => {
        if (prev >= awakeningMessages.length - 1) {
          clearInterval(interval);
          setTimeout(() => setStep('class-selection'), 600);
          return prev;
        }
        return prev + 1;
      });
    }, 700);
    return () => clearInterval(interval);
  }, [awakeningMessages.length, step]);

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setValidationError(null);
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const registerDecision = <K extends keyof FormData>(key: K, value: FormData[K], message: string) => {
    setField(key, value);
    setDecisionFeedback(message);
  };

  useEffect(() => {
    if (!decisionFeedback) return;
    const t = setTimeout(() => setDecisionFeedback(null), 1800);
    return () => clearTimeout(t);
  }, [decisionFeedback]);

  const calculateSuggestedClass = (): HunterClass => {
    const counts: Record<string, number> = { Warrior: 0, Scholar: 0, Creator: 0, Monk: 0, Leader: 0 };
    Object.values(answers).forEach(val => { if (counts[val] !== undefined) counts[val]++; });
    let topClass: HunterClass = 'Warrior';
    let max = 0;
    Object.entries(counts).forEach(([cls, count]) => {
      if (count > max) { max = count; topClass = cls as HunterClass; }
    });
    return topClass;
  };

  // ─── Handlers de Validação e Avanço ───
  const handleSaveBasicInfo = async () => {
    setValidationError(null);
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      setValidationError(l('Por favor, informe seu nome ou codinome (mínimo 2 letras).', 'Please enter your name or codename (minimum 2 characters).'));
      return;
    }
    if (!form.gender) {
      setValidationError(l('Por favor, selecione seu gênero para calibrar a imagem do caçador.', 'Please select your gender to calibrate your hunter profile.'));
      return;
    }
    if (form.birthday) {
      const birthDate = new Date(form.birthday);
      const now = new Date();
      if (isNaN(birthDate.getTime()) || birthDate > now || birthDate.getFullYear() < 1900) {
        setValidationError(l('Data de nascimento inválida.', 'Invalid date of birth.'));
        return;
      }
    }

    if (user) {
      try {
        await supabase.from('profiles').update({
          full_name: form.fullName.trim(),
          birthday: form.birthday || null,
          gender: form.gender || null,
        }).eq('id', user.id);
        useHunterStore.setState({
          fullName: form.fullName.trim(),
          birthday: form.birthday || '',
          gender: form.gender || null,
        });
      } catch (err) {
        console.warn('[Onboarding] Falha ao sincronizar dados básicos:', err);
      }
    }
    setStep('physical-profile');
  };

  const handleSavePhysicalProfile = async () => {
    setValidationError(null);
    const h = form.height ? parseFloat(form.height) : null;
    const wc = form.weightCurrent ? parseFloat(form.weightCurrent) : null;
    const wt = form.weightTarget ? parseFloat(form.weightTarget) : null;

    if (h !== null && (isNaN(h) || h < 50 || h > 260)) {
      setValidationError(l('Altura deve estar entre 50 e 260 cm.', 'Height must be between 50 and 260 cm.'));
      return;
    }
    if (wc !== null && (isNaN(wc) || wc < 20 || wc > 350)) {
      setValidationError(l('Peso atual deve estar entre 20 e 350 kg.', 'Current weight must be between 20 and 350 kg.'));
      return;
    }
    if (wt !== null && (isNaN(wt) || wt < 20 || wt > 350)) {
      setValidationError(l('Peso meta deve estar entre 20 e 350 kg.', 'Target weight must be between 20 and 350 kg.'));
      return;
    }

    if (user) {
      try {
        await supabase.from('profiles').update({
          height: h,
          weight_current: wc,
          weight_target: wt,
          training_focus: form.trainingFocus || null,
          nutrition_goal: form.nutritionGoal || 'maintain',
        }).eq('id', user.id);
        useHunterStore.setState({
          height: h,
          weightCurrent: wc,
          weightTarget: wt,
          trainingFocus: form.trainingFocus || null,
          nutritionGoal: form.nutritionGoal || 'maintain',
        });
      } catch (err) {
        console.warn('[Onboarding] Falha ao sincronizar perfil físico:', err);
      }
    }
    setStep('main-goal');
  };

  const handleSaveMainGoal = async () => {
    setValidationError(null);
    if (!form.mainGoal) {
      setValidationError(l('Por favor, selecione seu objetivo central.', 'Please select your core mission.'));
      return;
    }
    if (user) {
      try {
        await supabase.from('profiles').update({ main_goal: form.mainGoal }).eq('id', user.id);
        useHunterStore.setState({ mainGoal: form.mainGoal });
      } catch (err) {
        console.warn('[Onboarding] Falha ao sincronizar objetivo principal:', err);
      }
    }
    setStep('experience-level');
  };

  const handleSaveExperience = async () => {
    setValidationError(null);
    if (!form.experienceLevel) {
      setValidationError(l('Por favor, selecione seu nível de experiência.', 'Please select your experience rank.'));
      return;
    }
    if (user) {
      try {
        await supabase.from('profiles').update({ experience_level: form.experienceLevel }).eq('id', user.id);
        useHunterStore.setState({ experienceLevel: form.experienceLevel });
      } catch (err) {
        console.warn('[Onboarding] Falha ao sincronizar nível de experiência:', err);
      }
    }
    setStep('architect-intro');
  };

  const handleSelectQuizOption = (value: string) => {
    setValidationError(null);
    const questionId = questions[currentQuestionIndex].id;
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    if (user?.id) {
      try {
        localStorage.setItem(`ascend_onboarding_quiz_${user.id}`, JSON.stringify(newAnswers));
      } catch {}
    }
    setDecisionFeedback(l('Resposta registrada pelo Arquiteto.', 'Answer recorded by the Architect.'));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      const suggested = calculateSuggestedClass();
      setRevealedClass(suggested);
      setSelectedClass(suggested);
      setStep('awakening');
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      setStep('architect-intro');
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmTrainingProgram, setConfirmTrainingProgram] = useState(true);

  // Ajusta sugestão inicial do programa de treinos conforme o objetivo principal declarado (Req 5.2)
  useEffect(() => {
    const isNonPhysicalGoal = ['focus_studies', 'discipline'].includes(form.mainGoal);
    setConfirmTrainingProgram(!isNonPhysicalGoal);
  }, [form.mainGoal]);

  const previewProtocol = useMemo(() => {
    const trainingGoal = mapMainGoalToTrainingGoal(form.mainGoal || 'general_health');
    return generateTrainingProtocol({
      goal: trainingGoal,
      experience: (form.experienceLevel as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
      frequency: (form.workoutFrequency || 3) as 2 | 3 | 4 | 5 | 6,
      durationMinutes: (Number(form.dailyAvailability) || 60) as 30 | 45 | 60 | 90,
      environment: form.workoutEnvironment || 'gym',
      restrictions: form.physicalRestrictions || [],
    });
  }, [
    form.mainGoal,
    form.experienceLevel,
    form.workoutFrequency,
    form.dailyAvailability,
    form.workoutEnvironment,
    form.physicalRestrictions,
  ]);

  const handleConfirmClass = async () => {
    if (!user || !selectedClass || isSubmitting) return;
    setIsSubmitting(true);
    setValidationError(null);
    try {
      // 1. Executa o Setup Inicial Inteligente em todos os módulos
      await applyHunterInitialSetup({
        userId: user.id,
        fullName: form.fullName,
        birthday: form.birthday,
        gender: form.gender ? (form.gender as 'male' | 'female') : undefined,
        height: form.height ? parseFloat(form.height) : undefined,
        weightCurrent: form.weightCurrent ? parseFloat(form.weightCurrent) : undefined,
        weightTarget: form.weightTarget ? parseFloat(form.weightTarget) : undefined,
        mainGoal: form.mainGoal || 'general_health',
        nutritionGoal: (form.nutritionGoal as 'lose' | 'maintain' | 'gain') || 'maintain',
        trainingFocus: form.trainingFocus || 'Musculação',
        experienceLevel: (form.experienceLevel as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
        hunterClass: selectedClass,
        workoutFrequency: (form.workoutFrequency || 3) as 2 | 3 | 4 | 5 | 6,
        workoutEnvironment: form.workoutEnvironment || 'gym',
        physicalRestrictions: form.physicalRestrictions || [],
        primaryDifficulty: form.primaryDifficulty,
        dailyAvailability: form.dailyAvailability || '60',
        confirmTrainingProgram,
      });

      // 2. Registra classe e finaliza rascunho
      await setHunterClass(selectedClass, user.id);
      localStorage.setItem('ascend_just_finished_onboarding', 'true');
      try {
        localStorage.removeItem(`ascend_onboarding_quiz_${user.id}`);
      } catch {}

      navigate('/');
    } catch (err: any) {
      console.error('[Onboarding] Erro ao confirmar classe:', err);
      setValidationError(err.message || l('Falha ao registrar classe no Sistema. Tente novamente.', 'Failed to register class. Please try again.'));
      setIsSubmitting(false);
    }
  };

  const toggleRestriction = (res: 'lombar' | 'joelho' | 'ombro' | 'punho' | 'cervical') => {
    setForm(prev => {
      const exists = prev.physicalRestrictions.includes(res);
      const updated = exists
        ? prev.physicalRestrictions.filter(r => r !== res)
        : [...prev.physicalRestrictions, res];
      return { ...prev, physicalRestrictions: updated };
    });
  };

  const currentAnswer = answers[questions[currentQuestionIndex]?.id];
  const ritualProgress = getRitualProgress(step, currentQuestionIndex);
  const currentRitual = ritualSteps.find(item => item.id === step) || ritualSteps[0];
  const revealedClassData = classes.find(c => c.id === (selectedClass || revealedClass));

  return (
    <div className="relative min-h-screen bg-[#07080C] text-white flex flex-col items-center justify-start pt-16 sm:pt-20 pb-16 px-4 sm:px-6 overflow-y-auto">
      
      {/* Barra Superior com Seletor de Idioma e Status */}
      <header className="absolute top-4 left-4 right-4 flex items-center justify-between z-30 pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400">
            <Sparkles size={16} />
          </div>
          <span className="text-[10px] font-black font-orbitron uppercase tracking-widest text-gray-400 hidden sm:inline">
            ASCEND Awakening
          </span>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-gray-400 hover:text-white transition-colors"
            title={l('Encerrar sessão', 'Sign out')}
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">{l('Sair', 'Sign Out')}</span>
          </button>
        </div>
      </header>

      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_12%,rgba(168,85,247,0.12),transparent_38%),radial-gradient(circle_at_20%_80%,rgba(0,240,255,0.08),transparent_35%)]" />

      {/* Barra de Etapa Flutuante */}
      {step !== 'loading' && (
        <div className="mb-6 flex items-center gap-2.5 rounded-full border border-purple-500/30 bg-[#0F0F13]/85 px-4 py-1.5 shadow-[0_0_20px_rgba(168,85,247,0.15)] backdrop-blur-md">
          <span className="text-[9px] font-black font-orbitron uppercase tracking-widest text-purple-400">{currentRitual.phase}</span>
          <span className="h-1 w-1 rounded-full bg-purple-500" />
          <span className="text-[9px] font-bold font-orbitron uppercase tracking-widest text-gray-300">{currentRitual.label}</span>
          <span className="h-1 w-1 rounded-full bg-purple-500" />
          <span className="text-[9px] font-black font-orbitron text-cyan-400">{ritualProgress}%</span>
        </div>
      )}

      {/* Feedback de Validação / Erro */}
      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 max-w-lg w-full rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2.5"
          >
            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">

        {/* ── LOADING & SINCRONIZAÇÃO ── */}
        {step === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center my-auto">
            {!profileLoaded && profileError ? (
              <HudCard variant="crimson" corners className="max-w-md w-full p-6 text-center space-y-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 mx-auto">
                  <AlertTriangle size={24} />
                </div>
                <h2 className="text-lg font-orbitron font-black text-rose-400 uppercase">
                  {l('FALHA DE SINCRONIZAÇÃO', 'SYNCHRONIZATION FAILURE')}
                </h2>
                <p className="text-xs text-gray-400 font-mono leading-relaxed">{profileError}</p>
                <div className="flex flex-col gap-2 pt-2">
                  <TacticalButton
                    onClick={() => {
                      if (user) void loadProfile(user.id);
                    }}
                    variant="primary"
                    accent="crimson"
                    className="min-h-[44px] text-xs font-bold"
                  >
                    {l('Tentar Reconectar ao Sistema', 'Retry System Connection')}
                  </TacticalButton>
                  <TacticalButton
                    onClick={() => void signOut()}
                    variant="ghost"
                    className="min-h-[40px] text-xs"
                  >
                    {l('Encerrar Sessão', 'Sign Out')}
                  </TacticalButton>
                </div>
              </HudCard>
            ) : (
              <MatrixLoader />
            )}
          </motion.div>
        )}

        {/* ── FASE 1: INFORMAÇÕES BÁSICAS ── */}
        {step === 'basic-info' && (
          <motion.div key="basic-info" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.3 }} className="max-w-lg w-full">
            <HudCard variant="purple" corners radialGlow className="p-5 sm:p-7 space-y-5">
              <StepHeader step={1} total={8} label={l('Calibração Biológica', 'Biological Calibration')} progress={ritualProgress} />

              <div className="text-center space-y-1">
                <h1 className="text-xl sm:text-2xl font-orbitron font-bold text-white leading-tight">
                  {l('O Sistema precisa reconhecer o', 'The System must recognize the')} <span className="text-purple-400">{l('Caçador', 'Hunter')}</span>
                </h1>
                <p className="text-xs text-gray-400">
                  {l('Sua assinatura biológica será gravada antes da abertura da primeira Fenda.', 'Your biological signature is recorded before the first Rift opens.')}
                </p>
              </div>

              <div className="space-y-4">
                {/* Nome */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-orbitron text-purple-300 uppercase tracking-widest font-bold">
                    <User className="w-3.5 h-3.5" /> {l('Nome ou Codinome', 'Hunter Name or Codename')} *
                  </label>
                  <input
                    type="text"
                    placeholder={l('Ex: Gabriel Reis', 'e.g., Gabriel Reis')}
                    value={form.fullName}
                    onChange={e => setField('fullName', e.target.value)}
                    className="w-full min-h-[46px] bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs sm:text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Data de Nascimento */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-orbitron text-purple-300 uppercase tracking-widest font-bold">
                    <Calendar className="w-3.5 h-3.5" /> {l('Data de Nascimento', 'Date of Birth')}
                  </label>
                  <input
                    type="date"
                    value={form.birthday}
                    onChange={e => setField('birthday', e.target.value)}
                    className="w-full min-h-[46px] bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs sm:text-sm text-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Gênero */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-orbitron text-purple-300 uppercase tracking-widest font-bold">
                    <Shield className="w-3.5 h-3.5" /> {l('Gênero do Avatar', 'Avatar Gender')} *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'male', label: l('Masculino', 'Male'), icon: '♂' },
                      { value: 'female', label: l('Feminino', 'Female'), icon: '♀' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => registerDecision(
                          'gender',
                          opt.value as HunterGender,
                          isEnglish ? `${opt.label} recorded by the System` : `Gênero ${opt.label.toLowerCase()} registrado`,
                        )}
                        className={`flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl border text-xs font-bold transition-all ${
                          form.gender === opt.value
                            ? 'border-purple-500 bg-purple-500/20 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                            : 'border-white/10 bg-black/40 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span className="text-lg">{opt.icon}</span>
                        <span className="font-orbitron uppercase tracking-wider">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <TacticalButton
                  onClick={handleSaveBasicInfo}
                  variant="primary"
                  accent="purple"
                  displayFont
                  className="min-h-[46px] px-6 text-xs"
                >
                  <span>{l('PRÓXIMO PASSO', 'NEXT STEP')}</span>
                  <ChevronRight size={16} />
                </TacticalButton>
              </div>
            </HudCard>
          </motion.div>
        )}

        {/* ── FASE 2: PERFIL FÍSICO & AMBIENTE ── */}
        {step === 'physical-profile' && (
          <motion.div key="physical" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.3 }} className="max-w-lg w-full">
            <HudCard variant="purple" corners radialGlow className="p-5 sm:p-7 space-y-5">
              <StepHeader step={2} total={8} label={l('Análise Corporal & Ambiente', 'Body Analysis & Setup')} progress={ritualProgress} />

              <div className="text-center space-y-1">
                <h1 className="text-xl sm:text-2xl font-orbitron font-bold leading-tight">
                  {l('Varredura Biomecânica', 'Biomechanical Baseline')}
                </h1>
                <p className="text-xs text-gray-400">
                  {l('Métricas físicas ajustam o volume inicial, cálculo calórico e segurança articular.', 'Physical metrics adjust starting load, calorie goals, and joint safety.')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { key: 'height', label: l('Altura (cm)', 'Height (cm)'), placeholder: '175', icon: <Ruler className="w-3 h-3" /> },
                    { key: 'weightCurrent', label: l('Peso (kg)', 'Weight (kg)'), placeholder: '80', icon: <Weight className="w-3 h-3" /> },
                    { key: 'weightTarget', label: l('Meta (kg)', 'Target (kg)'), placeholder: '75', icon: <Target className="w-3 h-3" /> },
                  ].map(field => (
                    <div key={field.key} className="space-y-1">
                      <label className="flex items-center gap-1 text-[9px] font-orbitron text-purple-300 uppercase tracking-widest font-bold truncate">
                        {field.icon} {field.label}
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder={field.placeholder}
                        value={form[field.key as keyof FormData] as string}
                        onChange={e => setField(field.key as keyof FormData, e.target.value)}
                        className="w-full min-h-[46px] bg-black/50 border border-white/10 rounded-xl px-2 py-2 text-xs sm:text-sm text-center font-orbitron font-bold text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Ambiente de Treino */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-orbitron text-purple-300 uppercase tracking-widest font-bold">
                    {l('Ambiente de Treinamento', 'Training Environment')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'gym', label: l('Academia', 'Gym'), icon: '🏋️' },
                      { value: 'home', label: l('Em Casa', 'Home'), icon: '🏠' },
                      { value: 'hybrid', label: l('Híbrido', 'Hybrid'), icon: '⚡' },
                    ].map(env => (
                      <button
                        key={env.value}
                        type="button"
                        onClick={() => registerDecision('workoutEnvironment', env.value as any, env.label)}
                        className={`min-h-[44px] px-2 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          form.workoutEnvironment === env.value
                            ? 'border-purple-500 bg-purple-500/20 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                            : 'border-white/10 bg-black/40 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <span>{env.icon}</span>
                        <span>{env.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Restrições Articulares */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-orbitron text-purple-300 uppercase tracking-widest font-bold">
                      {l('Restrições Físicas / Articulares', 'Physical / Joint Restrictions')}
                    </label>
                    <span className="text-[9px] text-gray-400 font-mono">
                      {form.physicalRestrictions.length === 0 ? l('Nenhuma', 'None') : `${form.physicalRestrictions.length} ${l('ativas', 'active')}`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'lombar', label: l('Lombar', 'Lower Back') },
                      { id: 'joelho', label: l('Joelho', 'Knee') },
                      { id: 'ombro', label: l('Ombro', 'Shoulder') },
                      { id: 'punho', label: l('Punho', 'Wrist') },
                      { id: 'cervical', label: l('Cervical', 'Neck') },
                    ].map(res => {
                      const isSelected = form.physicalRestrictions.includes(res.id as any);
                      return (
                        <button
                          key={res.id}
                          type="button"
                          onClick={() => toggleRestriction(res.id as any)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                            isSelected
                              ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                              : 'border-white/10 bg-black/40 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          {isSelected ? '⚠ ' : ''}{res.label}
                        </button>
                      );
                    })}
                    {form.physicalRestrictions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setField('physicalRestrictions', [])}
                        className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[10px] font-mono text-gray-400 hover:text-white"
                      >
                        {l('Limpar', 'Clear')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Objetivo Nutricional */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-orbitron text-purple-300 uppercase tracking-widest font-bold">
                    {l('Diretriz Nutricional Inicial', 'Initial Nutrition Goal')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'lose', label: l('Déficit / Perder', 'Lose weight'), sub: '-15% kcal' },
                      { value: 'maintain', label: l('Manter peso', 'Maintain weight'), sub: 'Equilíbrio' },
                      { value: 'gain', label: l('Superávit / Ganhar', 'Gain weight'), sub: '+10% kcal' },
                    ].map(goal => (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() => registerDecision('nutritionGoal', goal.value, goal.label)}
                        className={`min-h-[50px] px-2 py-1.5 rounded-xl border text-[11px] font-bold transition-all text-center flex flex-col justify-center ${
                          form.nutritionGoal === goal.value
                            ? 'border-purple-500 bg-purple-500/20 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                            : 'border-white/10 bg-black/40 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <span>{goal.label}</span>
                        <span className="text-[9px] font-mono opacity-70">{goal.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botões de Ação com Voltar */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <TacticalButton
                  onClick={() => setStep('basic-info')}
                  variant="ghost"
                  className="min-h-[46px] px-4 text-xs font-bold"
                >
                  <ChevronLeft size={16} />
                  <span>{l('Voltar', 'Back')}</span>
                </TacticalButton>

                <TacticalButton
                  onClick={handleSavePhysicalProfile}
                  variant="primary"
                  accent="purple"
                  displayFont
                  className="min-h-[46px] px-6 text-xs"
                >
                  <span>{l('PRÓXIMO PASSO', 'NEXT STEP')}</span>
                  <ChevronRight size={16} />
                </TacticalButton>
              </div>
            </HudCard>
          </motion.div>
        )}

        {/* ── FASE 3: OBJETIVO PRINCIPAL & DIFICULDADE ── */}
        {step === 'main-goal' && (
          <motion.div key="main-goal" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.3 }} className="max-w-lg w-full">
            <HudCard variant="purple" corners radialGlow className="p-5 sm:p-7 space-y-5">
              <StepHeader step={3} total={8} label={l('Missão Central & Foco', 'Core Mission & Focus')} progress={ritualProgress} />

              <div className="text-center space-y-1">
                <h1 className="text-xl sm:text-2xl font-orbitron font-bold leading-tight">
                  {l('Qual é sua', 'What is your')} <span className="text-purple-400">{l('Missão Central', 'Core Mission')}</span>?
                </h1>
                <p className="text-xs text-gray-400">
                  {l('Esta diretriz guiará suas quests diárias, hábitos recomendados e foco do app.', 'This directive guides your daily quests, recommended habits, and app focus.')}
                </p>
              </div>

              <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
                {[
                  { value: 'weight_loss', label: l('Perder Peso & Definição', 'Weight Loss & Definition'), sub: l('Déficit calórico, gasto energético e queima de gordura.', 'Caloric deficit, fat burn, and physical conditioning.'), icon: <Flame className="w-4 h-4 text-rose-400" /> },
                  { value: 'hypertrophy', label: l('Ganhar Massa Muscular', 'Build Muscle & Hypertrophy'), sub: l('Sobrecarga progressiva de carga, proteína e síntese.', 'Progressive overload, high protein, and muscle growth.'), icon: <Dumbbell className="w-4 h-4 text-blue-400" /> },
                  { value: 'conditioning', label: l('Condicionamento & Performance', 'Conditioning & Stamina'), sub: l('Resistência cardiovascular, agilidade e vitalidade.', 'Cardiovascular stamina, mobility, and agility.'), icon: <Activity className="w-4 h-4 text-cyan-400" /> },
                  { value: 'discipline', label: l('Aumentar Disciplina & Rotina', 'Build Routine & Discipline'), sub: l('Constância diária, quebra de procrastinação e foco.', 'Consistency, anti-procrastination, and daily habits.'), icon: <Shield className="w-4 h-4 text-purple-400" /> },
                  { value: 'nutrition', label: l('Melhorar Alimentação', 'Improve Nutrition & Health'), sub: l('Qualidade alimentar, diário regular e metas nutricionais.', 'Clean eating, TACO food logs, and balanced macros.'), icon: <Apple className="w-4 h-4 text-emerald-400" /> },
                  { value: 'focus_studies', label: l('Foco, Estudos & Carreira', 'Deep Focus & Studies'), sub: l('Blocos de concentração profunda e leitura diária.', 'Deep work blocks, technical reading, and learning.'), icon: <Brain className="w-4 h-4 text-amber-400" /> },
                  { value: 'general_health', label: l('Equilíbrio Geral & Bem-Estar', 'Overall Balance & Health'), sub: l('Crescer em harmonia entre corpo, mente e descanso.', 'Grow in balance across body, mind, and recovery.'), icon: <Star className="w-4 h-4 text-amber-300" /> },
                ].map((opt, idx) => (
                  <OptionCard
                    key={opt.value}
                    label={opt.label}
                    sublabel={opt.sub}
                    isSelected={form.mainGoal === opt.value}
                    onClick={() => registerDecision(
                      'mainGoal',
                      opt.value,
                      isEnglish ? `Mission locked: ${opt.label}` : `Missão travada: ${opt.label}`,
                    )}
                    icon={opt.icon}
                    delay={idx * 0.03}
                  />
                ))}
              </div>

              {/* Principal Dificuldade */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <label className="text-[10px] font-orbitron text-purple-300 uppercase tracking-widest font-bold">
                  {l('Principal Dificuldade a Vencer', 'Main Challenge to Overcome')}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'inconsistency', label: l('Falta de Constância', 'Lack of Consistency') },
                    { id: 'poor_diet', label: l('Dieta Desorganizada', 'Chaotic Nutrition') },
                    { id: 'procrastination', label: l('Procrastinação', 'Procrastination') },
                    { id: 'low_energy', label: l('Pouca Energia', 'Low Energy') },
                  ].map(diff => (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => registerDecision('primaryDifficulty', diff.id, diff.label)}
                      className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all text-left truncate ${
                        form.primaryDifficulty === diff.id
                          ? 'border-purple-400 bg-purple-500/20 text-purple-200'
                          : 'border-white/10 bg-black/40 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões com Voltar */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <TacticalButton
                  onClick={() => setStep('physical-profile')}
                  variant="ghost"
                  className="min-h-[46px] px-4 text-xs font-bold"
                >
                  <ChevronLeft size={16} />
                  <span>{l('Voltar', 'Back')}</span>
                </TacticalButton>

                <TacticalButton
                  onClick={handleSaveMainGoal}
                  disabled={!form.mainGoal}
                  variant="primary"
                  accent="purple"
                  displayFont
                  className="min-h-[46px] px-6 text-xs"
                >
                  <span>{l('PRÓXIMO PASSO', 'NEXT STEP')}</span>
                  <ChevronRight size={16} />
                </TacticalButton>
              </div>
            </HudCard>
          </motion.div>
        )}

        {/* ── FASE 4: NÍVEL DE EXPERIÊNCIA & FREQUÊNCIA ── */}
        {step === 'experience-level' && (
          <motion.div key="experience" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.3 }} className="max-w-lg w-full">
            <HudCard variant="purple" corners radialGlow className="p-5 sm:p-7 space-y-5">
              <StepHeader step={4} total={8} label={l('Calibração de Rank & Tempo', 'Rank Calibration & Time')} progress={ritualProgress} />

              <div className="text-center space-y-1">
                <h1 className="text-xl sm:text-2xl font-orbitron font-bold leading-tight">
                  {l('Frequência e', 'Frequency &')} <span className="text-purple-400">Rank</span> {l('Inicial', 'Calibration')}
                </h1>
                <p className="text-xs text-gray-400">
                  {l('Calibramos o compromisso semanal para você manter consistência sem estafa.', 'We calibrate weekly commitments so you maintain daily streak without burnout.')}
                </p>
              </div>

              <div className="space-y-4">
                {/* Frequência Semanal */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-orbitron text-purple-300 uppercase tracking-widest font-bold">
                    {l('Frequência Semanal Desejada', 'Desired Weekly Frequency')}
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[2, 3, 4, 5, 6].map(freq => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => registerDecision('workoutFrequency', freq, `${freq}x`)}
                        className={`min-h-[46px] rounded-xl border text-center font-orbitron font-bold transition-all ${
                          form.workoutFrequency === freq
                            ? 'border-purple-400 bg-purple-500/25 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                            : 'border-white/10 bg-black/40 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <span className="text-sm block">{freq}x</span>
                        <span className="text-[8px] uppercase tracking-tighter opacity-70 block">{l('dias', 'days')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Disponibilidade de Tempo por Dia */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-orbitron text-purple-300 uppercase tracking-widest font-bold">
                    {l('Disponibilidade de Tempo por Sessão', 'Time Availability per Session')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: '30', label: '15-30 min', sub: l('Sessão rápida', 'Quick session') },
                      { value: '60', label: '45-60 min', sub: l('Padrão de ouro', 'Gold standard') },
                      { value: '90', label: '60+ min', sub: l('Avançado/longo', 'Deep immersion') },
                    ].map(dur => (
                      <button
                        key={dur.value}
                        type="button"
                        onClick={() => registerDecision('dailyAvailability', dur.value as any, dur.label)}
                        className={`min-h-[48px] rounded-xl border text-center p-1.5 transition-all ${
                          form.dailyAvailability === dur.value
                            ? 'border-purple-400 bg-purple-500/25 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                            : 'border-white/10 bg-black/40 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <span className="font-orbitron text-xs font-bold block">{dur.label}</span>
                        <span className="text-[9px] font-mono text-gray-400 block">{dur.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rank de Experiência */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-orbitron text-purple-300 uppercase tracking-widest font-bold">
                    {l('Nível de Experiência Atual', 'Current Experience Level')}
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'beginner', rank: 'E', label: l('Iniciante', 'Beginner'), sub: l('Construindo a base diária. Cada passo conta.', 'Building baseline habits. Every step counts.') },
                      { value: 'intermediate', rank: 'C', label: l('Intermediário', 'Intermediate'), sub: l('Já possuo rotinas ativas. Quero acelerar o nível.', 'Already active. Want to accelerate growth.') },
                      { value: 'advanced', rank: 'S', label: l('Avançado', 'Advanced'), sub: l('Alta disciplina e performance. Busco o limite máximo.', 'High performance discipline. Seeking max potential.') },
                    ].map(opt => (
                      <OptionCard
                        key={opt.value}
                        label={`[Rank ${opt.rank}] ${opt.label}`}
                        sublabel={opt.sub}
                        isSelected={form.experienceLevel === opt.value}
                        onClick={() => registerDecision(
                          'experienceLevel',
                          opt.value,
                          isEnglish ? `Rank ${opt.rank} accepted` : `Rank ${opt.rank} aceito`,
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Botões com Voltar */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <TacticalButton
                  onClick={() => setStep('main-goal')}
                  variant="ghost"
                  className="min-h-[46px] px-4 text-xs font-bold"
                >
                  <ChevronLeft size={16} />
                  <span>{l('Voltar', 'Back')}</span>
                </TacticalButton>

                <TacticalButton
                  onClick={handleSaveExperience}
                  disabled={!form.experienceLevel}
                  variant="primary"
                  accent="purple"
                  displayFont
                  className="min-h-[46px] px-6 text-xs"
                >
                  <span>{l('AVANÇAR', 'CONTINUE')}</span>
                  <ChevronRight size={16} />
                </TacticalButton>
              </div>
            </HudCard>
          </motion.div>
        )}

        {/* ── FASE 5: O ARQUITETO (INTRODUÇÃO) ── */}
        {step === 'architect-intro' && (
          <motion.div key="architect" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-xl w-full">
            <HudCard variant="purple" corners radialGlow className="p-6 sm:p-8 text-center space-y-6">
              <div className="size-16 mx-auto rounded-2xl bg-purple-900/40 border border-purple-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)]">
                <Lightbulb className="w-8 h-8 text-purple-300" />
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-orbitron text-purple-400 tracking-[0.3em] uppercase">Transmissão Recebida</p>
                <h2 className="text-2xl sm:text-3xl font-orbitron font-bold text-white">
                  {l('Eu sou o', 'I am the')} <span className="text-purple-400">{l('Arquiteto', 'Architect')}</span>
                </h2>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm text-gray-300 leading-relaxed max-w-md mx-auto">
                <p>{l('Fui eu quem construiu o sistema das Fendas. Eu ofereço o caminho da evolução contínua.', 'I built the Gate System. I offer the path of continuous evolution.')}</p>
                <p className="text-purple-200/90 italic font-semibold border-l-2 border-purple-500 pl-3.5 text-left my-2">
                  “{l('Responda com honestidade às próximas 5 questões. O Sistema não mente — e você também não deveria.', 'Answer the next 5 questions honestly. The System does not lie — and neither should you.')}”
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <TacticalButton
                  onClick={() => setStep('experience-level')}
                  variant="ghost"
                  className="min-h-[46px] px-4 text-xs font-bold"
                >
                  <ChevronLeft size={16} />
                  <span>{l('Voltar', 'Back')}</span>
                </TacticalButton>

                <TacticalButton
                  onClick={() => setStep('class-quiz')}
                  variant="primary"
                  accent="purple"
                  displayFont
                  className="min-h-[46px] px-6 text-xs"
                >
                  <span>{l('ACEITAR O DESAFIO', 'ACCEPT CHALLENGE')}</span>
                  <ArrowRight size={16} />
                </TacticalButton>
              </div>
            </HudCard>
          </motion.div>
        )}

        {/* ── FASE 6: QUESTIONÁRIO DE CLASSES ── */}
        {step === 'class-quiz' && (
          <motion.div key="class-quiz" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.3 }} className="max-w-2xl w-full">
            <HudCard variant="purple" corners radialGlow className="p-5 sm:p-7 space-y-6">
              <StepHeader step={6} total={8} label={l('Avaliação do Sistema', 'System Assessment')} progress={ritualProgress} />

              <div className="text-center space-y-2">
                <span className="text-[10px] font-orbitron text-purple-400 tracking-[0.25em] uppercase">
                  {l('Questão', 'Question')} {currentQuestionIndex + 1} / {questions.length}
                </span>
                <h2 className="text-lg sm:text-xl font-orbitron font-bold text-white leading-snug max-w-xl mx-auto">
                  {questions[currentQuestionIndex].title}
                </h2>
              </div>

              <div className="space-y-2.5">
                {questions[currentQuestionIndex].options.map((opt, idx) => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    isSelected={currentAnswer === opt.id}
                    onClick={() => handleSelectQuizOption(opt.id)}
                    delay={idx * 0.04}
                  />
                ))}
              </div>

              {/* Botões de Navegação do Quiz com Voltar */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <TacticalButton
                  onClick={handlePrevQuestion}
                  variant="ghost"
                  className="min-h-[46px] px-4 text-xs font-bold"
                >
                  <ChevronLeft size={16} />
                  <span>{l('Voltar', 'Back')}</span>
                </TacticalButton>

                <TacticalButton
                  onClick={handleNextQuestion}
                  disabled={!currentAnswer}
                  variant="primary"
                  accent="purple"
                  displayFont
                  className="min-h-[46px] px-6 text-xs"
                >
                  <span>
                    {currentQuestionIndex === questions.length - 1
                      ? l('REVELAR MEU CAMINHO', 'REVEAL MY PATH')
                      : l('PRÓXIMA QUESTÃO', 'NEXT QUESTION')}
                  </span>
                  <ChevronRight size={16} />
                </TacticalButton>
              </div>
            </HudCard>
          </motion.div>
        )}

        {/* ── FASE 7: SÍNTESE DE MANA & SETUP AUTOMÁTICO ── */}
        {step === 'awakening' && (
          <motion.div key="awakening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md w-full text-center space-y-6 my-auto">
            <HudCard variant="purple" corners radialGlow className="p-8 space-y-6">
              <div className="relative flex items-center justify-center mx-auto w-28 h-28">
                <motion.div
                  className="absolute inset-0 rounded-full border border-purple-500/40"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.2, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="size-20 rounded-full bg-purple-900/60 border border-purple-500/60 flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.5)]">
                  <Sparkles className="w-10 h-10 text-purple-300 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-orbitron text-purple-400 tracking-[0.3em] uppercase">Avaliação de Mana em Curso</p>
                <h2 className="text-xl font-orbitron font-bold text-white">{l('Sincronizando Setup do Caçador...', 'Synchronizing Hunter Setup...')}</h2>
                <div className="h-6 flex items-center justify-center">
                  <p className="text-xs text-purple-300 font-mono">
                    &gt; {awakeningMessages[awakeningMsgIdx]}
                  </p>
                </div>
              </div>

              <NeonProgressBar value={awakeningMsgIdx + 1} max={awakeningMessages.length} variant="xp" size="sm" />
            </HudCard>
          </motion.div>
        )}

        {/* ── FASE 8: SELEÇÃO, PREVIEW DO SETUP & DESPERTAR DE CLASSE ── */}
        {step === 'class-selection' && (
          <motion.div key="classes" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-5xl w-full space-y-6">
            
            {/* Cabeçalho */}
            <div className="text-center space-y-1.5">
              <span className="text-[10px] font-orbitron text-purple-400 tracking-[0.3em] uppercase">
                {l('Resultado da Avaliação · Solo Leveling', 'Assessment Result · Solo Leveling')}
              </span>
              <h1 className="text-2xl sm:text-3xl font-orbitron font-black text-white">
                {l('Classe Despertada:', 'Awakened Class:')} <span className="text-purple-400">{selectedClass || revealedClass}</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto">
                {l('O Sistema identificou sua essência e preparou o seu setup inicial personalizado.', 'The System recognized your essence and tailored your personalized initial setup.')}
              </p>
            </div>

            {/* Card Destaque da Classe Recomendada */}
            {revealedClassData && (
              <HudCard variant="purple" corners radialGlow className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                <div
                  onClick={() => {
                    setPreviewClassId(revealedClassData.id);
                    setPreviewRank('E');
                  }}
                  className="md:col-span-4 relative aspect-[4/3] md:aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer group"
                >
                  <img
                    src={revealedClassData.image}
                    alt={revealedClassData.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-2.5 rounded-full border border-purple-400/40 bg-purple-600/40 px-2.5 py-0.5 text-[9px] font-orbitron uppercase text-purple-100 font-bold">
                    {l('Despertar Recomendado', 'Recommended Awakening')}
                  </div>
                  <div className="absolute top-2.5 right-2.5 rounded-full p-1.5 bg-black/60 text-white/70 group-hover:text-white transition-colors">
                    <Maximize2 size={14} />
                  </div>
                </div>

                <div className="md:col-span-8 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-black/40">
                      {revealedClassData.icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-orbitron text-purple-400 uppercase tracking-widest">{revealedClassData.tagline}</span>
                      <h2 className={`text-xl sm:text-2xl font-orbitron font-black ${revealedClassData.accent}`}>{revealedClassData.name}</h2>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{revealedClassData.description}</p>
                  
                  {/* Atributos Calibrados */}
                  <div className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 inline-block">
                    <span className="text-[9px] font-orbitron text-gray-400 uppercase tracking-widest mr-2">{l('Atributos Iniciais:', 'Starting Stats:')}</span>
                    <span className="font-mono text-xs font-bold text-purple-200">
                      {revealedClassData.stats}
                    </span>
                  </div>
                </div>
              </HudCard>
            )}

            {/* RESUMO TÁTICO: O QUE O SISTEMA CONFIGUROU */}
            <HudCard variant="cyan" corners className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="size-4 text-cyan-400" />
                <h3 className="font-orbitron text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                  {l('SETUP INICIAL CONFIGURADO PELO SISTEMA', 'INITIAL SETUP CONFIGURED BY THE SYSTEM')}
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                  <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-bold uppercase font-orbitron">
                    <Dumbbell className="size-3" />
                    <span>{l('Treino Tático', 'Workout Split')}</span>
                  </div>
                  <p className="font-orbitron text-xs font-black text-white mt-1">
                    {form.workoutFrequency}x {l('por semana', 'per week')}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                    {form.workoutEnvironment === 'gym' ? l('Academia', 'Gym') : form.workoutEnvironment === 'home' ? l('Em Casa', 'Home') : l('Híbrido', 'Hybrid')}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                  <div className="flex items-center gap-1.5 text-purple-400 text-[10px] font-bold uppercase font-orbitron">
                    <Apple className="size-3" />
                    <span>{l('Nutrição', 'Nutrition')}</span>
                  </div>
                  <p className="font-orbitron text-xs font-black text-white mt-1">
                    {form.nutritionGoal === 'lose' ? l('Déficit Calórico', 'Calorie Deficit') : form.nutritionGoal === 'gain' ? l('Superávit Massa', 'Calorie Surplus') : l('Manutenção', 'Maintenance')}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                    4 {l('refeições prontas', 'meals configured')}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                  <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase font-orbitron">
                    <Shield className="size-3" />
                    <span>{l('Hábitos Iniciais', 'Core Habits')}</span>
                  </div>
                  <p className="font-orbitron text-xs font-black text-white mt-1">
                    3 {l('missões ativas', 'active quests')}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                    {l('Foco:', 'Focus:')} {form.mainGoal.replace('_', ' ')}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase font-orbitron">
                    <Zap className="size-3" />
                    <span>{l('Atalhos da Home', 'Quick Actions')}</span>
                  </div>
                  <p className="font-orbitron text-xs font-black text-white mt-1">
                    4 {l('atalhos fixados', 'pinned actions')}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                    {l('Acesso instantâneo', 'Instant access')}
                  </p>
                </div>
              </div>

              {/* Prévia e Confirmação Explícita das Fichas Iniciais (Treino A/B/C) */}
              <div className="mt-3 rounded-xl border border-[#00F0FF]/25 bg-black/50 p-3.5 text-left space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-[#00F0FF]">
                      {l('Programa de Treino Sugerido:', 'Suggested Workout Program:')} {previewProtocol.splitType}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {l(
                        'Revise e confirme se deseja ativar estas fichas iniciais no Training Center:',
                        'Review and confirm whether to activate these starter routines in the Training Center:'
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setConfirmTrainingProgram((prev) => !prev)}
                    className={`inline-flex min-h-[38px] items-center gap-2 rounded-lg border px-3 py-1.5 font-orbitron text-[10px] font-bold uppercase tracking-wider transition-all ${
                      confirmTrainingProgram
                        ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                        : 'border-white/15 bg-white/5 text-slate-400'
                    }`}
                  >
                    <Check size={13} className={confirmTrainingProgram ? 'opacity-100' : 'opacity-40'} />
                    <span>
                      {confirmTrainingProgram
                        ? l('Ativar Programa Inicial', 'Activate Starter Program')
                        : l('Criar Rotinas Depois', 'Create Routines Later')}
                    </span>
                  </button>
                </div>

                {confirmTrainingProgram && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {previewProtocol.routines.map((routine, idx) => (
                      <div
                        key={routine.name}
                        className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-orbitron text-[10px] font-black uppercase text-white truncate">
                            {routine.name}
                          </span>
                          <span className="rounded bg-[#00F0FF]/15 px-1.5 py-0.5 font-mono text-[9px] text-[#00F0FF] shrink-0">
                            {routine.exercises.length} {l('exerc.', 'ex.')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {routine.exercises
                            .map((ex) => `${ex.name} (${ex.sets}x${ex.reps})`)
                            .join(' • ')}
                        </p>
                        <span className="block text-[9px] font-mono text-slate-500">
                          {l(`Sessão ${String.fromCharCode(65 + idx)}`, `Session ${String.fromCharCode(65 + idx)}`)} •{' '}
                          {form.dailyAvailability || '60'} min
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </HudCard>

            {/* Grid com Todas as 5 Classes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {classes.map(c => {
                const isSelected = selectedClass === c.id;
                const isSuggested = revealedClass === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedClass(c.id);
                      setDecisionFeedback(isEnglish ? `${c.name} selected` : `${c.name} selecionado`);
                    }}
                    className={`rounded-2xl border p-3.5 text-center transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-1 ring-purple-500'
                        : 'border-white/10 bg-[#0F0F13] hover:border-white/20'
                    }`}
                  >
                    <div className="space-y-1.5">
                      {isSuggested && (
                        <span className="rounded bg-purple-600/80 px-1.5 py-0.5 text-[8px] font-orbitron uppercase text-white font-bold block truncate">
                          ✦ {l('Sugerida', 'Suggested')}
                        </span>
                      )}
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 mx-auto w-full">
                        <img
                          src={c.image}
                          alt={c.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className={`text-xs sm:text-sm font-black font-orbitron ${c.accent}`}>{c.name}</h3>
                      <p className="text-[9px] text-gray-500 line-clamp-2">{c.tagline}</p>
                    </div>

                    <div className="pt-1">
                      <span className={`block w-full py-1 rounded text-[9px] font-bold font-orbitron uppercase ${
                        isSelected ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400'
                      }`}>
                        {isSelected ? l('Selecionada ✓', 'Selected ✓') : l('Escolher', 'Choose')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Ações Inferiores com Voltar e Despertar */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <TacticalButton
                onClick={() => {
                  setCurrentQuestionIndex(4);
                  setStep('class-quiz');
                }}
                variant="ghost"
                className="min-h-[46px] px-5 text-xs font-bold w-full sm:w-auto"
              >
                <ChevronLeft size={16} />
                <span>{l('Rever Perguntas', 'Review Questions')}</span>
              </TacticalButton>

              <TacticalButton
                onClick={handleConfirmClass}
                disabled={!selectedClass || isSubmitting}
                variant="primary"
                accent="purple"
                displayFont
                className="min-h-[48px] px-8 text-xs font-black w-full sm:w-auto"
              >
                <Sparkles size={16} />
                <span>{isSubmitting ? l('DESPERTANDO...', 'AWAKENING...') : l('DESPERTAR PODER & INICIAR', 'AWAKEN POWER & START')}</span>
              </TacticalButton>
            </div>
          </motion.div>
        )}

        {/* Modal Lightbox de Preview dos Ranks E-S */}
        <AnimatePresence>
          {previewClassId && (
            <div
              onClick={() => setPreviewClassId(null)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl rounded-2xl border border-purple-500/40 bg-[#0F0F13] p-5 shadow-2xl space-y-4"
              >
                <button
                  type="button"
                  onClick={() => setPreviewClassId(null)}
                  className="absolute top-3.5 right-3.5 rounded-lg border border-white/10 bg-white/5 p-1.5 text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/50">
                    <img
                      src={`/optimized/Classes/${previewClassId}/Rank ${previewRank}.jpg`}
                      alt={`${previewClassId} Rank ${previewRank}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2.5 left-2.5 rounded bg-black/80 border border-purple-400/40 px-2 py-0.5 text-[10px] font-orbitron font-black text-purple-300">
                      RANK {previewRank}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-xl font-black font-orbitron uppercase text-white">
                        {classes.find(c => c.id === previewClassId)?.name}
                      </h3>
                      <p className="text-xs text-purple-300/80 font-orbitron">{classes.find(c => c.id === previewClassId)?.tagline}</p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-orbitron text-gray-400 uppercase tracking-widest">{l('Nível de Rank:', 'Rank Level:')}</span>
                      <div className="grid grid-cols-6 gap-1.5">
                        {(['E', 'D', 'C', 'B', 'A', 'S'] as const).map(rk => (
                          <button
                            key={rk}
                            type="button"
                            onClick={() => setPreviewRank(rk)}
                            className={`py-1.5 rounded-lg text-xs font-black font-orbitron border transition-all ${
                              previewRank === rk
                                ? 'border-purple-400 bg-purple-500/30 text-white'
                                : 'border-white/10 bg-white/5 text-gray-400'
                            }`}
                          >
                            {rk}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-white/10 bg-black/40">
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {rankDescriptions[previewClassId]?.[previewRank] || ''}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </AnimatePresence>

    </div>
  );
}

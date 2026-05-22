import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useHunterStore, type HunterClass } from '../stores/useHunterStore';
import { MatrixLoader } from '../components/ui/matrix-loader';
import { Shield, Sword, Book, Zap, ChevronRight } from 'lucide-react';

// Ícone SVG usado no card de opção (estilo "info" do design de referência)
const OptionIcon = () => (
  <svg
    stroke="currentColor"
    viewBox="0 0 24 24"
    fill="none"
    className="h-4 w-4 flex-shrink-0 mr-3 text-purple-400"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      strokeWidth="2"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

const QUESTIONS = [
  {
    id: 'q1',
    title: 'O que te motiva a acordar todo dia e dar o seu melhor?',
    options: [
      { id: 'Warrior', label: 'Superar meus limites físicos e me tornar inabalável.' },
      { id: 'Scholar', label: 'Aprender coisas novas e dominar habilidades com precisão.' },
      { id: 'Monk',    label: 'Alcançar paz interior, leveza e agilidade na mente e no corpo.' },
      { id: 'Titan',   label: 'Construir uma base sólida para suportar qualquer desafio.' },
    ]
  },
  {
    id: 'q2',
    title: 'Você se depara com um obstáculo enorme. O que você faz?',
    options: [
      { id: 'Warrior', label: 'Enfrento de cabeça com força e determinação sem recuar.' },
      { id: 'Scholar', label: 'Estudo o problema fundo e encontro a solução mais inteligente.' },
      { id: 'Monk',    label: 'Respiro fundo, me adapto e fluo ao redor dele como água.' },
      { id: 'Titan',   label: 'Resisto. A dor é temporária e eu não desisto jamais.' },
    ]
  },
  {
    id: 'q3',
    title: 'Qual ambiente te deixa no estado ideal de foco?',
    options: [
      { id: 'Warrior', label: 'Pesos, ferro e música alta que deixam o sangue fluindo.' },
      { id: 'Scholar', label: 'Silêncio absoluto, organização e zero distrações ao redor.' },
      { id: 'Monk',    label: 'A natureza ou um espaço aberto, tranquilo e com boa energia.' },
      { id: 'Titan',   label: 'Qualquer lugar onde eu possa testar minha resistência ao limite.' },
    ]
  },
  {
    id: 'q4',
    title: 'O que não pode faltar na sua rotina de evolução?',
    options: [
      { id: 'Warrior', label: 'Progressão de carga constante e intensidade crescente.' },
      { id: 'Scholar', label: 'Registro metódico, análise de progresso e aprendizado contínuo.' },
      { id: 'Monk',    label: 'Mobilidade, meditação e escuta do próprio corpo.' },
      { id: 'Titan',   label: 'Nunca falhar. O mais importante é aparecer todo maldito dia.' },
    ]
  },
  {
    id: 'q5',
    title: 'Como você quer ser visto por quem te observa evoluir?',
    options: [
      { id: 'Warrior', label: 'Pela força física e pelas conquistas que todo mundo consegue ver.' },
      { id: 'Scholar', label: 'Pela clareza, inteligência e profundidade de conhecimento.' },
      { id: 'Monk',    label: 'Pela calma e pelo equilíbrio mesmo sob muita pressão.' },
      { id: 'Titan',   label: 'Pela teimosia em nunca desistir, não importa o quão difícil seja.' },
    ]
  }
];

const CLASSES = [
  {
    id: 'Warrior',
    name: 'WARRIOR',
    description: 'Especialista em Força Bruta. Sua jornada é pavimentada por pesos e superação física.',
    icon: <Sword className="w-12 h-12 text-blue-400" />,
    color: 'border-blue-500/50 hover:bg-blue-500/10',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
    image: '/Classes/Warrior/Rank E.jpeg'
  },
  {
    id: 'Scholar',
    name: 'SCHOLAR',
    description: 'Mestre da Mente. Sua evolução vem do conhecimento, foco e disciplina intelectual.',
    icon: <Book className="w-12 h-12 text-purple-400" />,
    color: 'border-purple-500/50 hover:bg-purple-500/10',
    glow: 'shadow-[0_0_30px_rgba(124,58,237,0.3)]',
    image: '/Classes/Scholar/Rank E.jpeg'
  },
  {
    id: 'Monk',
    name: 'MONK',
    description: 'Equilíbrio e Agilidade. Busca a perfeição entre o corpo e a mente através da vitalidade.',
    icon: <Zap className="w-12 h-12 text-cyan-400" />,
    color: 'border-cyan-500/50 hover:bg-cyan-500/10',
    glow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]',
    image: '/Classes/Monk/Rank E.jpeg'
  },
  {
    id: 'Titan',
    name: 'TITAN',
    description: 'Resistência Inabalável. Focado em suportar qualquer carga e durar mais que todos.',
    icon: <Shield className="w-12 h-12 text-red-400" />,
    color: 'border-red-500/50 hover:bg-red-500/10',
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]',
    image: '/Classes/Titan/Rank E.jpeg'
  }
];

export function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hunterClass, setHunterClass } = useHunterStore();
  const [step, setStep] = useState<'loading' | 'questions' | 'class-selection'>('loading');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealedClass, setRevealedClass] = useState<HunterClass | null>(null);
  const [selectedClass, setSelectedClass] = useState<HunterClass | null>(null);

  useEffect(() => {
    // Se já tiver classe, redireciona mais rápido (mantém um pouco de loading pela estética)
    if (hunterClass) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      // Se não tiver, espera o tempo total do loader de matriz para começar as perguntas
      const timer = setTimeout(() => {
        setStep('questions');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [hunterClass, navigate]);

  const handleSelectOption = (value: string) => {
    const questionId = QUESTIONS[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleGoToReveal();
    }
  };



  const calculateSuggestedClass = (): HunterClass => {
    const counts: Record<string, number> = { Warrior: 0, Scholar: 0, Monk: 0, Titan: 0 };
    Object.values(answers).forEach(val => {
      if (counts[val] !== undefined) counts[val]++;
    });

    let topClass: HunterClass = 'Warrior';
    let max = 0;
    Object.entries(counts).forEach(([cls, count]) => {
      if (count > max) { max = count; topClass = cls as HunterClass; }
    });

    return topClass;
  };

  const handleGoToReveal = () => {
    const suggested = calculateSuggestedClass();
    setRevealedClass(suggested);
    setStep('class-selection');
  };

  const handleConfirmClass = async () => {
    if (user && selectedClass) {
      await setHunterClass(selectedClass, user.id);
      navigate('/');
    }
  };

  const allAnswered = Object.keys(answers).length === QUESTIONS.length;
  const currentAnswer = answers[QUESTIONS[currentQuestionIndex]?.id];

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-silver flex items-center justify-center p-6">
      <AnimatePresence mode="wait">

        {/* ── LOADING ── */}
        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <MatrixLoader />
          </motion.div>
        )}

        {/* ── QUESTIONS ── */}
        {step === 'questions' && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl w-full flex flex-col items-center gap-10"
          >
            {/* Header */}
            <div className="space-y-3 text-center">
              <span className="text-[10px] font-orbitron text-purple-400 tracking-[0.3em] uppercase">
                Avaliação de Perfil &nbsp;·&nbsp; {currentQuestionIndex + 1} / {QUESTIONS.length}
              </span>
              <AnimatePresence mode="wait">
                <motion.h2
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl md:text-3xl font-orbitron font-bold text-white leading-tight"
                >
                  {QUESTIONS[currentQuestionIndex].title}
                </motion.h2>
              </AnimatePresence>
            </div>

            {/* Options – estilo alert-card roxo */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="w-full space-y-3"
              >
                {QUESTIONS[currentQuestionIndex].options.map((opt, idx) => {
                  const isSelected = currentAnswer === opt.id;
                  return (
                    <motion.div
                      key={opt.id}
                      role="button"
                      aria-pressed={isSelected}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06, duration: 0.3 }}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`
                        relative flex items-center gap-3 p-4 rounded-xl
                        border-l-4 cursor-pointer select-none
                        transition-all duration-150 ease-out
                        hover:scale-[1.01] active:scale-[0.99]
                        ${isSelected
                          ? 'bg-purple-500/20 border-purple-400 shadow-[0_0_20px_rgba(124,58,237,0.35)] ring-1 ring-purple-500/50'
                          : 'bg-purple-950/30 border-purple-700/60 hover:bg-purple-900/40 hover:border-purple-500'
                        }
                      `}
                    >
                      {/* Ícone */}
                      <OptionIcon />

                      {/* Texto */}
                      <p className={`text-sm font-medium leading-snug flex-1 ${isSelected ? 'text-purple-100' : 'text-purple-200/80'}`}>
                        {opt.label}
                      </p>

                      {/* Chevron de confirmação */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: isSelected ? 1 : 0, scale: isSelected ? 1 : 0.6 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      </motion.div>

                      {/* Glow de seleção */}
                      {isSelected && (
                        <motion.div
                          layoutId="option-glow"
                          className="absolute inset-0 rounded-xl bg-purple-500/10 pointer-events-none"
                        />
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Footer: botão final */}
            <div className="flex flex-col items-center gap-5 w-full">


              <AnimatePresence>
                {currentAnswer && (
                  <motion.button
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    onClick={handleNext}
                    className="btn-next-step mt-2"
                  >
                    <span>
                      {currentQuestionIndex === QUESTIONS.length - 1 
                        ? 'REVELAR MEU CAMINHO' 
                        : 'PRÓXIMO PASSO'}
                    </span>
                    <ChevronRight strokeWidth={3} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ── CLASS SELECTION (REVEAL) ── */}
        {step === 'class-selection' && (
          <motion.div
            key="classes"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl w-full text-center space-y-12"
          >
            {/* Reveal header */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-[10px] font-orbitron text-purple-400 tracking-[0.3em] uppercase">
                Resultado da Avaliação
              </p>
              <h1 className="text-3xl md:text-4xl font-orbitron font-bold text-white tracking-tight">
                O seu caminho é o&nbsp;
                <span className="text-purple-400">{revealedClass}</span>
              </h1>
              <p className="text-silver/60 max-w-lg mx-auto text-sm leading-relaxed">
                Baseado nas suas respostas, identificamos sua essência. Mas a escolha final é sempre sua — confirme ou escolha outro caminho abaixo.
              </p>
            </motion.div>

            {/* Cards de classe */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {CLASSES.map((c, idx) => {
                const isSuggested = revealedClass === c.id;
                return (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -12,
                      transition: { type: 'spring', stiffness: 400, damping: 15 } 
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ 
                      opacity: { delay: 0.15 + idx * 0.08, duration: 0.4 },
                      y: { delay: 0.15 + idx * 0.08, duration: 0.4 }
                    }}
                    onClick={() => setSelectedClass(c.id as HunterClass)}
                    className={`
                      relative glass-panel p-6 flex flex-col items-center gap-5 group
                      border-2 transition-colors duration-200 ${c.color} ${c.glow}
                      ${selectedClass === c.id ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0B0B0F]' : ''}
                      ${isSuggested && !selectedClass ? 'border-purple-400/50' : ''}
                    `}
                  >
                    {isSuggested && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute -top-3 bg-purple-600 text-white text-[9px] font-orbitron uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_12px_rgba(124,58,237,0.6)]"
                      >
                        ✦ Recomendado
                      </motion.div>
                    )}

                    <div className="p-4 rounded-full bg-black/40 border border-white/10 shadow-inner">
                      {c.icon}
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-orbitron font-bold text-xl text-white">{c.name}</h3>
                      <p className="text-xs text-silver/60 leading-relaxed">{c.description}</p>
                    </div>

                    <div className="w-full aspect-[4/5] relative rounded-lg overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors">
                      <img 
                        src={c.image} 
                        alt={c.name} 
                        className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>

                    <div className="mt-auto w-full pt-2">
                      <div className="text-[10px] font-orbitron text-purple-400 uppercase tracking-widest">
                        Escolher este caminho
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Botão de Confirmação Final */}
            <div className="flex justify-center pt-8">
              <AnimatePresence>
                {selectedClass && (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    onClick={handleConfirmClass}
                    className="btn-next-step"
                  >
                    <span>DESPERTAR PODER</span>
                    <ChevronRight strokeWidth={3} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}



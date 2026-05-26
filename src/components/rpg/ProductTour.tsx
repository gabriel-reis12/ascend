import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Zap, Play } from 'lucide-react';

interface TourStep {
  title: string;
  lore: string;
  target?: string;
  position?: 'top' | 'bottom' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'SISTEMA DESPERTO',
    lore: 'O Sistema de Caçador foi recalibrado e integrado com sucesso. A partir de agora, suas ações no plano real moldarão sua força RPG. Vamos calibrar seus módulos vitais para iniciar a subida de Rank.',
    position: 'center',
  },
  {
    title: 'HUD DE RESTRUTURAÇÃO VITAL',
    lore: 'Aqui são exibidos sua classe de caçador, sua sequência de consistência (Streak) e seu Rank atual. Purifique quests e acumule pontos de experiência para preencher a barra de XP e subir de nível!',
    target: 'tour-hud',
    position: 'bottom',
  },
  {
    title: 'ATALHOS DE ACESSO RÁPIDO',
    lore: 'Seus painéis de calibração rápidos. Acesse seus treinos ativos, recupere mana ajustando sua dieta alimentar, confira seu mural de missões ou gerencie as credenciais no menu de sistema.',
    target: 'tour-shortcuts',
    position: 'bottom',
  },
  {
    title: 'MURAL DE MISSÕES DIÁRIAS',
    lore: 'Suas tarefas físicas e hábitos agendados para hoje aparecem aqui como fendas ativas. Purifique cada uma das missões clicando nelas para acumular XP e ganhar bônus de atributos em tempo real.',
    target: 'tour-quests',
    position: 'top',
  },
  {
    title: 'JANELA DE STATUS HOLOGRÁFICA',
    lore: 'A representação visual da sua fortitude de combate. Visualize o equilíbrio de seus atributos de Força, Inteligência, Resistência, Vitalidade e Disciplina. Mantenha-os balanceados para moldar o combatente definitivo!',
    target: 'tour-status',
    position: 'top',
  },
  {
    title: 'REGISTROS FÍSICOS & BIOMETRIA',
    lore: 'Consolidação de seus dados de biomassa e energia. Acompanhe sua ingestão de Mana (Kcal acumuladas), Carga (Volume total de ferro erguido) e Fadiga (Nível de exaustão com base nas missões cumpridas).',
    target: 'tour-biometrics',
    position: 'top',
  },
  {
    title: 'EVOLUÇÃO LIBERADA',
    lore: 'A calibração do sistema está completa. O portal do Rank E ao Rank S está livre de barreiras. Mostre sua determinação, enfrente seus deveres diários e alcance o ápice do seu poder. Ascenda!',
    position: 'center',
  },
];

export function ProductTour() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Inicialização do Tour se não concluído
  useEffect(() => {
    const completed = localStorage.getItem('ascend_tour_completed');
    if (!completed) {
      // Pequeno delay para garantir que a página renderizou completamente antes de calcular as posições das âncoras
      const timer = setTimeout(() => {
        setOpen(true);
        setCurrentStep(0);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Detector de Responsividade
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Atualização dinâmica de âncora/highlighter
  const updateHighlight = useCallback(() => {
    if (!open) return;
    const step = TOUR_STEPS[currentStep];
    if (step && step.target) {
      const element = document.getElementById(step.target);
      if (element) {
        // Rola suavemente até o elemento se necessário
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Timeout pequeno para esperar a rolagem estabilizar antes de tirar o bounding box
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setHighlightRect(rect);
        }, 150);
        return;
      }
    }
    setHighlightRect(null);
  }, [open, currentStep]);

  useEffect(() => {
    updateHighlight();
  }, [updateHighlight]);

  // Listener para reajuste em resize ou scroll
  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight);
    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
    };
  }, [open, updateHighlight]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    localStorage.setItem('ascend_tour_completed', 'true');
    setOpen(false);
  };

  if (!open) return null;

  const step = TOUR_STEPS[currentStep];

  // Cálculo de Posição do Card (Apenas em Desktop, em Mobile fica fixo na base)
  const getCardStyle = () => {
    if (isMobile || !highlightRect) {
      if (step.position === 'center' || !highlightRect) {
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '440px',
        };
      }
      return {}; // No mobile fica fixo na base via classes Tailwind
    }

    const spacing = 18;
    const cardWidth = 420;
    const leftPos = Math.max(20, Math.min(window.innerWidth - cardWidth - 20, highlightRect.left + (highlightRect.width / 2) - (cardWidth / 2)));

    if (step.position === 'top') {
      return {
        top: `${Math.max(20, highlightRect.top - spacing)}px`,
        left: `${leftPos}px`,
        transform: 'translateY(-100%)',
        width: `${cardWidth}px`,
      };
    }

    // Default: bottom
    return {
      top: `${highlightRect.bottom + spacing}px`,
      left: `${leftPos}px`,
      width: `${cardWidth}px`,
    };
  };

  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden pointer-events-none">
      {/* ── Backdrop Escuro com Recorte Virtual ─────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-[1px] pointer-events-auto"
      />

      {/* ── Highlighter de Foco com Borda Roxa Neon ─────────────── */}
      <AnimatePresence>
        {highlightRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              top: highlightRect.top - 6,
              left: highlightRect.left - 6,
              width: highlightRect.width + 12,
              height: highlightRect.height + 12
            }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute rounded-2xl border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] z-[1000] pointer-events-none animate-pulse-purple"
            style={{
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.4), inset 0 0 10px rgba(168, 85, 247, 0.2)'
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Card Explicativo Cyberpunk do Tour ───────────────────── */}
      <div className="absolute inset-0 z-[1001] flex items-center justify-center p-4">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: isMobile ? 40 : 15, scale: isMobile ? 1 : 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 26, stiffness: 210 }}
          style={getCardStyle()}
          className={`w-full max-w-md pointer-events-auto rounded-2xl border-2 border-purple-500 bg-[#0F0F13] p-5 sm:p-6 shadow-[0_0_30px_rgba(168,85,247,0.3)] flex flex-col justify-between ${
            isMobile && highlightRect ? 'fixed bottom-4 left-4 right-4 max-w-none' : ''
          }`}
        >
          {/* Glowing matrix lines inside card */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent pointer-events-none rounded-2xl" />

          {/* Header */}
          <div className="relative mb-4 flex items-center justify-between border-b border-purple-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-purple-400 fill-purple-400 animate-pulse" />
              <h4 
                className="text-xs sm:text-sm font-black uppercase tracking-wider text-purple-400 font-orbitron"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {step.title}
              </h4>
            </div>
            <button 
              onClick={handleClose}
              className="rounded-lg p-1 text-gray-500 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Lore/Descricao */}
          <div className="relative mb-5 flex-1">
            <p className="text-xs sm:text-sm leading-relaxed text-gray-300 font-medium italic">
              "{step.lore}"
            </p>
          </div>

          {/* Footer Controls */}
          <div className="relative border-t border-purple-500/20 pt-4 flex items-center justify-between">
            {/* Step Counter */}
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 font-orbitron">
              Sistema <span className="text-purple-500">{currentStep + 1}</span> / {TOUR_STEPS.length}
            </span>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Skip Button */}
              {currentStep < TOUR_STEPS.length - 1 && (
                <button
                  onClick={handleClose}
                  className="rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Pular
                </button>
              )}

              {/* Prev Button */}
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex size-8 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all shrink-0"
                >
                  <ChevronLeft size={16} strokeWidth={3} />
                </button>
              )}

              {/* Next/Done Button */}
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(168,85,247,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-[10px] font-black uppercase italic tracking-widest text-white hover:bg-purple-500 transition-all shadow-md"
              >
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <>
                    <span>Despertar</span>
                    <Play size={10} className="fill-current" />
                  </>
                ) : (
                  <>
                    <span>Avançar</span>
                    <ChevronRight size={10} strokeWidth={3} />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

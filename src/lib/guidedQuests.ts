/**
 * ASCEND — Guided Quests Engine (Etapa 04.5)
 *
 * Motor determinístico de atividades interativas e exercícios guiados.
 * Suporta três categorias de interação:
 *  A. Exercício por repetições (Reps-based: flexões, agachamentos, abdominais, etc.)
 *  B. Atividade por tempo (Time-based: meditação, foco/deep work, leitura, mobilidade, etc.)
 *  C. Rotina de exercícios (Workout routine: redireciona para o Training Center 2.0 existente)
 *
 * Resiliência total: cálculo de tempo baseado no relógio epoch (Date.now()), imune a
 * bloqueio de tela, suspensão de aba ou recarregamento da página.
 * Zero dependências de IA externa, câmera ou serviços de terceiros.
 */

export type GuidedMode = 'reps' | 'timer' | 'routine';

export interface GuidedActivityConfig {
  mode: GuidedMode;
  defaultTarget: number; // e.g. 20 reps or 600 seconds
  targetUnit: 'reps' | 'seconds';
  label: { pt: string; en: string };
  instructions: { pt: string; en: string };
  postureTips: { pt: string[]; en: string[] };
  suggestedStat: 'strength' | 'endurance' | 'intelligence' | 'discipline' | 'vitality' | 'wisdom' | 'balance';
  statBonus: number;
  cardImage: string;
  iconName: 'dumbbell' | 'flame' | 'clock' | 'book' | 'zap' | 'shield' | 'heart' | 'sparkles';
  cadenceDescription?: { pt: string; en: string };
}

export interface GuidedQuestSession {
  questId: string;
  questType: 'habit' | 'task' | 'workout';
  mode: GuidedMode;
  title: string;
  category: string;
  categoryColor: string;
  targetValue: number; // reps target or duration in seconds
  currentValue: number; // completed reps or elapsed seconds
  targetTimestamp?: number | null; // Date.now() + remainingMs (when running timer)
  isPaused: boolean;
  remainingWhenPaused?: number | null;
  startedAt: number;
  xpReward: number;
  statTarget?: string | null;
  statReward?: number;
  notes?: string;
}

export const GUIDED_ACTIVITY_PRESETS: Record<string, GuidedActivityConfig> = {
  push_ups: {
    mode: 'reps',
    defaultTarget: 20,
    targetUnit: 'reps',
    label: { pt: 'Flexões de Braço', en: 'Push-ups' },
    instructions: {
      pt: 'Execute flexões completas com postura alinhada, cotovelos a 45 graus e abdômen contraído.',
      en: 'Perform full range push-ups with straight spine, elbows at 45 degrees, and tight core.',
    },
    postureTips: {
      pt: [
        'Mantenha as mãos alinhadas à largura dos ombros.',
        'Mantenha core e glúteos contraídos formando uma linha reta dos calcanhares à cabeça.',
        'Desça até o peito quase tocar o solo (2 segundos) e empurre com explosão controlada (1 segundo).',
      ],
      en: [
        'Place hands shoulder-width apart on the floor.',
        'Keep core and glutes engaged in a straight line from heels to head.',
        'Lower until chest is just above floor (2s) and press up with control (1s).',
      ],
    },
    suggestedStat: 'strength',
    statBonus: 2,
    cardImage: '/optimized/Cards/Treinos.jpg',
    iconName: 'dumbbell',
    cadenceDescription: { pt: '2s descida • 1s explosão • Expire na subida', en: '2s down • 1s up • Exhale on press' },
  },
  squats: {
    mode: 'reps',
    defaultTarget: 25,
    targetUnit: 'reps',
    label: { pt: 'Agachamentos Livres', en: 'Air Squats' },
    instructions: {
      pt: 'Agache empurrando o quadril para trás, mantendo joelhos alinhados com as pontas dos pés.',
      en: 'Squat by hinging hips back, keeping knees tracking over toes and chest proud.',
    },
    postureTips: {
      pt: [
        'Pés afastados na largura dos ombros, peso equilibrado nos calcanhares.',
        'Empurre o quadril para trás como se fosse sentar em um banco invisível.',
        'Desça até as coxas ficarem paralelas ao solo e suba empurrando pelo calcanhar.',
      ],
      en: [
        'Feet shoulder-width apart, weight balanced across heels.',
        'Hinge hips backward as if sitting into an invisible chair.',
        'Descend until thighs are parallel to ground, drive back up through heels.',
      ],
    },
    suggestedStat: 'strength',
    statBonus: 2,
    cardImage: '/optimized/Cards/Treinos.jpg',
    iconName: 'flame',
    cadenceDescription: { pt: '2s descida • 1s subida • Joelhos firmes', en: '2s down • 1s up • Knees stable' },
  },
  sit_ups: {
    mode: 'reps',
    defaultTarget: 30,
    targetUnit: 'reps',
    label: { pt: 'Abdominais', en: 'Core Sit-ups' },
    instructions: {
      pt: 'Fortaleça a parede abdominal com flexões de tronco controladas sem puxar a cervical.',
      en: 'Strengthen core with controlled trunk flexions without straining the neck.',
    },
    postureTips: {
      pt: [
        'Deite com joelhos flexionados e pés firmes no chão.',
        'Contraia o abdômen ao subir, expirando completamente o ar.',
        'Não puxe a cabeça com as mãos; apoie as pontas dos dedos nas têmporas.',
      ],
      en: [
        'Lie supine with knees bent and feet planted firmly.',
        'Contract abdominal wall as you rise, exhaling fully.',
        'Do not pull your neck with hands; touch fingertips lightly to temples.',
      ],
    },
    suggestedStat: 'endurance',
    statBonus: 2,
    cardImage: '/optimized/Cards/Treinos.jpg',
    iconName: 'zap',
    cadenceDescription: { pt: 'Subida firme • Descida controlada', en: 'Firm ascent • Controlled descent' },
  },
  pull_ups: {
    mode: 'reps',
    defaultTarget: 8,
    targetUnit: 'reps',
    label: { pt: 'Barra Fixa', en: 'Pull-ups' },
    instructions: {
      pt: 'Puxe o corpo até o queixo ultrapassar a barra, sem balançar ou usar embalo.',
      en: 'Pull body upward until chin clears the bar, maintaining strict form without swinging.',
    },
    postureTips: {
      pt: [
        'Inicie com pegada firme e escápulas ativadas para baixo.',
        'Puxe os cotovelos em direção aos bolsos até o peito aproximar da barra.',
        'Desça em velocidade controlada até extensão quase completa dos braços.',
      ],
      en: [
        'Begin with firm grip and scapulae retracted down.',
        'Drive elbows toward your hips until chest approaches the bar.',
        'Lower with steady control to near-full arm extension.',
      ],
    },
    suggestedStat: 'strength',
    statBonus: 2,
    cardImage: '/optimized/Cards/Treinos.jpg',
    iconName: 'dumbbell',
  },
  calf_raises: {
    mode: 'reps',
    defaultTarget: 30,
    targetUnit: 'reps',
    label: { pt: 'Elevação de Panturrilha', en: 'Calf Raises' },
    instructions: {
      pt: 'Eleve o corpo sobre as pontas dos pés com amplitude máxima e contração no topo.',
      en: 'Rise up on toes with maximum range of motion and deliberate peak contraction.',
    },
    postureTips: {
      pt: [
        'Fique de pé com apoio suave das mãos na parede para equilíbrio.',
        'Eleve os calcanhares o mais alto possível e segure por 1 segundo no topo.',
        'Desça devagar sentindo o alongamento do tendão de Aquiles.',
      ],
      en: [
        'Stand tall with light hand support for balance.',
        'Raise heels as high as possible and hold 1 second at the top.',
        'Lower slowly feeling the Achilles stretch.',
      ],
    },
    suggestedStat: 'endurance',
    statBonus: 1,
    cardImage: '/optimized/Cards/Treinos.jpg',
    iconName: 'flame',
  },
  jumping_jacks: {
    mode: 'reps',
    defaultTarget: 40,
    targetUnit: 'reps',
    label: { pt: 'Polichinelos', en: 'Jumping Jacks' },
    instructions: {
      pt: 'Ritmo aeróbico contínuo abrindo e fechando pernas e braços em sincronia.',
      en: 'Continuous aerobic rhythm opening and closing limbs in sync.',
    },
    postureTips: {
      pt: [
        'Amorteça o impacto aterrissando suavemente nas pontas dos pés.',
        'Mantenha ritmo constante sem prender a respiração.',
      ],
      en: [
        'Absorb impact by landing softly on balls of feet.',
        'Maintain a steady cadence without holding breath.',
      ],
    },
    suggestedStat: 'endurance',
    statBonus: 1,
    cardImage: '/optimized/Cards/Treinos.jpg',
    iconName: 'heart',
  },
  meditation: {
    mode: 'timer',
    defaultTarget: 600, // 10 minutes
    targetUnit: 'seconds',
    label: { pt: 'Meditação & Atenção Plena', en: 'Meditation & Mindfulness' },
    instructions: {
      pt: 'Sente-se em postura estável e ancore sua atenção na respiração presente.',
      en: 'Sit in a stable posture and anchor attention on present breath.',
    },
    postureTips: {
      pt: [
        'Coluna ereta e relaxada, ombros soltos para trás e para baixo.',
        'Observe o ar entrando e saindo naturalmente pelas narinas.',
        'Quando a mente divagar, perceba sem julgar e volte suavemente à respiração.',
      ],
      en: [
        'Spine straight and relaxed, shoulders rolled down and back.',
        'Observe airflow moving in and out through nostrils naturally.',
        'When thoughts wander, notice without judgment and gently return to breath.',
      ],
    },
    suggestedStat: 'vitality',
    statBonus: 2,
    cardImage: '/optimized/Cards/Descanso-Lazer.jpg',
    iconName: 'sparkles',
  },
  deep_work: {
    mode: 'timer',
    defaultTarget: 1500, // 25 minutes (Pomodoro / Focus Block)
    targetUnit: 'seconds',
    label: { pt: 'Foco Máximo & Deep Work', en: 'Deep Work Focus Block' },
    instructions: {
      pt: 'Bloco de concentração profunda ininterrupta dedicado a uma única meta de alta relevância.',
      en: 'Unbroken deep concentration block dedicated to a single high-impact goal.',
    },
    postureTips: {
      pt: [
        'Silencie celular, feche abas secundárias e notificações invasivas.',
        'Defina previamente o resultado exato que será entregue ao término.',
        'Mantenha ritmo fluido sem interrupções até o soar do alarme tático.',
      ],
      en: [
        'Silence phone, close extra browser tabs, and mute notifications.',
        'Define the exact deliverable expected when the block ends.',
        'Maintain flow without interruptions until the tactical chime sounds.',
      ],
    },
    suggestedStat: 'discipline',
    statBonus: 2,
    cardImage: '/optimized/Cards/Quadro de Missoes.jpg',
    iconName: 'zap',
  },
  reading: {
    mode: 'timer',
    defaultTarget: 1200, // 20 minutes
    targetUnit: 'seconds',
    label: { pt: 'Leitura & Aprendizado', en: 'Reading & Knowledge' },
    instructions: {
      pt: 'Leitura focada de livros técnicos, literatura ou material de aprimoramento contínuo.',
      en: 'Focused reading of books, technical publications, or self-development works.',
    },
    postureTips: {
      pt: [
        'Iluminação adequada e postura confortável com apoio para o livro ou leitor.',
        'Tenha um caderno ou bloco à mão para registrar citações e insights-chave.',
        'Priorize absorção e reflexão crítica sobre velocidade superficial.',
      ],
      en: [
        'Ensure proper lighting and comfortable posture with arm support.',
        'Keep a notebook nearby to record key quotes and takeaways.',
        'Prioritize deep understanding and reflection over raw reading speed.',
      ],
    },
    suggestedStat: 'intelligence',
    statBonus: 2,
    cardImage: '/optimized/Cards/Estudos-Nutricao.jpg',
    iconName: 'book',
  },
  mobility: {
    mode: 'timer',
    defaultTarget: 600, // 10 minutes
    targetUnit: 'seconds',
    label: { pt: 'Alongamento & Mobilidade', en: 'Mobility & Stretching' },
    instructions: {
      pt: 'Alívio de tensão articular e ampliação do arco de movimento com respiração ritmada.',
      en: 'Release joint tension and expand range of motion with measured breathing.',
    },
    postureTips: {
      pt: [
        'Respire profundamente durante cada postura sem forçar até a dor aguda.',
        'Sustente cada ângulo por 25 a 35 segundos com suavidade.',
        'Foque em quadris, cadeia posterior, ombros e coluna torácica.',
      ],
      en: [
        'Breathe deeply into each position without straining into sharp pain.',
        'Hold each stretch for 25-35 seconds with gentle intention.',
        'Target hips, hamstrings, shoulders, and thoracic spine.',
      ],
    },
    suggestedStat: 'vitality',
    statBonus: 1,
    cardImage: '/optimized/Cards/Descanso-Lazer.jpg',
    iconName: 'shield',
  },
  breathwork: {
    mode: 'timer',
    defaultTarget: 300, // 5 minutes
    targetUnit: 'seconds',
    label: { pt: 'Respiração Consciente (Box Breathing)', en: 'Conscious Breathwork' },
    instructions: {
      pt: 'Ciclo tático 4x4: 4s inspirar, 4s segurar, 4s expirar, 4s vazio para desaceleração.',
      en: 'Tactical 4x4 cycle: 4s inhale, 4s hold, 4s exhale, 4s hold to reset nervous system.',
    },
    postureTips: {
      pt: [
        'Inspire pelo nariz expandindo a caixa torácica e abdômen inferior.',
        'Segure com pulmões cheios mantendo a garganta relaxada.',
        'Expire suavemente pela boca soltando o ar por completo.',
      ],
      en: [
        'Inhale through nose expanding chest and lower belly.',
        'Hold full lungs while keeping throat relaxed.',
        'Exhale smoothly through mouth releasing all air.',
      ],
    },
    suggestedStat: 'vitality',
    statBonus: 1,
    cardImage: '/optimized/Cards/Descanso-Lazer.jpg',
    iconName: 'heart',
  },
  walking: {
    mode: 'timer',
    defaultTarget: 1200, // 20 minutes
    targetUnit: 'seconds',
    label: { pt: 'Caminhada & Cardio Leve', en: 'Walk & Light Cardio' },
    instructions: {
      pt: 'Caminhada em ritmo constante para circulação, clareza mental e gasto energético.',
      en: 'Brisk walking pace for cardiovascular circulation, mental clarity, and stamina.',
    },
    postureTips: {
      pt: [
        'Postura ereta, ombros alinhados e olhar no horizonte.',
        'Mantenha passadas firmes com rolamento suave do calcanhar à ponta.',
      ],
      en: [
        'Keep spine upright, shoulders relaxed, and gaze forward.',
        'Maintain purposeful strides rolling smoothly from heel to toe.',
      ],
    },
    suggestedStat: 'endurance',
    statBonus: 2,
    cardImage: '/optimized/Cards/Treinos.jpg',
    iconName: 'flame',
  },
  workout_routine: {
    mode: 'routine',
    defaultTarget: 0,
    targetUnit: 'seconds',
    label: { pt: 'Rotina de Treinamento', en: 'Workout Routine' },
    instructions: {
      pt: 'Execute a rotina personalizada no Training Center com séries, cargas e descanso integrados.',
      en: 'Execute your custom routine in the Training Center with tracked sets, load, and rest.',
    },
    postureTips: {
      pt: ['Aquecimento prévio obrigatório', 'Controle da carga na fase excêntrica'],
      en: ['Proper warmup recommended', 'Control weight on eccentric phase'],
    },
    suggestedStat: 'strength',
    statBonus: 2,
    cardImage: '/optimized/Cards/Treinos.jpg',
    iconName: 'dumbbell',
  },
};

/**
 * Remove acentos e caracteres especiais para comparação fonética/textual robusta.
 */
function normalizeText(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Identifica deterministamente se um título ou categoria corresponde a um dos presets guiados.
 */
export function detectGuidedActivity(title: string, category: string = ''): GuidedActivityConfig {
  const normTitle = normalizeText(title);
  const normCat = normalizeText(category);
  const combined = `${normTitle} ${normCat}`;

  // 1. Extração de tempo explícito no título (ex: "Estudo focado 45 minutos", "Alongamento 15 min")
  const minuteMatch = normTitle.match(/(\d+)\s*(?:min|minuto|minutos)/);
  if (minuteMatch) {
    const minutes = Math.max(1, Math.min(180, parseInt(minuteMatch[1], 10)));
    const targetSeconds = minutes * 60;

    if (combined.includes('medita') || combined.includes('mindful')) {
      return { ...GUIDED_ACTIVITY_PRESETS.meditation, defaultTarget: targetSeconds };
    }
    if (combined.includes('deep work') || combined.includes('foco') || combined.includes('pomodoro')) {
      return { ...GUIDED_ACTIVITY_PRESETS.deep_work, defaultTarget: targetSeconds };
    }
    if (combined.includes('ler') || combined.includes('leitura') || combined.includes('livro') || combined.includes('estudo') || combined.includes('estudar')) {
      return { ...GUIDED_ACTIVITY_PRESETS.reading, defaultTarget: targetSeconds };
    }
    if (combined.includes('alongar') || combined.includes('mobilidade') || combined.includes('yoga')) {
      return { ...GUIDED_ACTIVITY_PRESETS.mobility, defaultTarget: targetSeconds };
    }
    if (combined.includes('respir') || combined.includes('breath')) {
      return { ...GUIDED_ACTIVITY_PRESETS.breathwork, defaultTarget: targetSeconds };
    }
    if (combined.includes('caminh') || combined.includes('corrida') || combined.includes('cardio')) {
      return { ...GUIDED_ACTIVITY_PRESETS.walking, defaultTarget: targetSeconds };
    }

    return {
      mode: 'timer',
      defaultTarget: targetSeconds,
      targetUnit: 'seconds',
      label: { pt: title, en: title },
      instructions: {
        pt: `Sessão cronometrada de ${minutes} minutos focada na conclusão do objetivo.`,
        en: `Timed session of ${minutes} minutes focused on goal completion.`,
      },
      postureTips: {
        pt: ['Mantenha atenção focada e minimize interrupções durante o tempo ativo.'],
        en: ['Stay focused and minimize interruptions while time is active.'],
      },
      suggestedStat: 'discipline',
      statBonus: 1,
      cardImage: '/optimized/Cards/Quadro de Missoes.jpg',
      iconName: 'clock',
    };
  }

  // 2. Extração de repetições explícitas no título (ex: "50 flexões", "Polichinelos 50 reps")
  const repMatch = normTitle.match(/(\d+)\s*(?:rep|reps|repeticoes|vezes)/);
  if (repMatch) {
    const reps = Math.max(5, Math.min(500, parseInt(repMatch[1], 10)));
    if (combined.includes('flexao') || combined.includes('flexoe') || combined.includes('push')) {
      return { ...GUIDED_ACTIVITY_PRESETS.push_ups, defaultTarget: reps };
    }
    if (combined.includes('agachamento') || combined.includes('squat')) {
      return { ...GUIDED_ACTIVITY_PRESETS.squats, defaultTarget: reps };
    }
    if (combined.includes('abdominal') || combined.includes('abdominais') || combined.includes('sit up') || combined.includes('situp')) {
      return { ...GUIDED_ACTIVITY_PRESETS.sit_ups, defaultTarget: reps };
    }
    if (combined.includes('panturrilha') || combined.includes('calf')) {
      return { ...GUIDED_ACTIVITY_PRESETS.calf_raises, defaultTarget: reps };
    }
    if (combined.includes('polichinelo') || combined.includes('jumping jack')) {
      return { ...GUIDED_ACTIVITY_PRESETS.jumping_jacks, defaultTarget: reps };
    }

    return {
      mode: 'reps',
      defaultTarget: reps,
      targetUnit: 'reps',
      label: { pt: title, en: title },
      instructions: {
        pt: `Execute a meta de ${reps} repetições com boa cadência e forma técnica.`,
        en: `Complete the target of ${reps} repetitions with proper cadence and technique.`,
      },
      postureTips: {
        pt: ['Priorize a técnica e controle do movimento sobre a velocidade.'],
        en: ['Prioritize strict form and control over speed.'],
      },
      suggestedStat: 'strength',
      statBonus: 2,
      cardImage: '/optimized/Cards/Treinos.jpg',
      iconName: 'dumbbell',
    };
  }

  // 3. Verificação de exercícios isolados baseados em repetições
  const isRepsExercise =
    combined.includes('flexao') ||
    combined.includes('flexoe') ||
    combined.includes('push up') ||
    combined.includes('pushup') ||
    combined.includes('agachamento') ||
    combined.includes('squat') ||
    combined.includes('abdominal') ||
    combined.includes('abdominais') ||
    combined.includes('sit up') ||
    combined.includes('situp') ||
    combined.includes('crunch') ||
    combined.includes('barra fixa') ||
    combined.includes('pull up') ||
    combined.includes('chin up') ||
    combined.includes('panturrilha') ||
    combined.includes('calf') ||
    combined.includes('polichinelo') ||
    combined.includes('jumping jack');

  if (combined.includes('flexao') || combined.includes('flexoe') || combined.includes('push up') || combined.includes('pushup')) {
    return GUIDED_ACTIVITY_PRESETS.push_ups;
  }
  if (combined.includes('agachamento') || combined.includes('squat')) {
    return GUIDED_ACTIVITY_PRESETS.squats;
  }
  if (combined.includes('abdominal') || combined.includes('abdominais') || combined.includes('sit up') || combined.includes('situp') || combined.includes('crunch')) {
    return GUIDED_ACTIVITY_PRESETS.sit_ups;
  }
  if (combined.includes('barra fixa') || combined.includes('pull up') || combined.includes('chin up')) {
    return GUIDED_ACTIVITY_PRESETS.pull_ups;
  }
  if (combined.includes('panturrilha') || combined.includes('calf')) {
    return GUIDED_ACTIVITY_PRESETS.calf_raises;
  }
  if (combined.includes('polichinelo') || combined.includes('jumping jack')) {
    return GUIDED_ACTIVITY_PRESETS.jumping_jacks;
  }

  // 4. Categorias ou títulos de rotinas completas de treino (sem exercício em reps isolado)
  if (
    !isRepsExercise &&
    (normCat === 'treino' ||
      normCat === 'workout' ||
      combined.includes('ficha') ||
      combined.includes('musculacao') ||
      combined.includes('rotina de treino'))
  ) {
    return GUIDED_ACTIVITY_PRESETS.workout_routine;
  }

  // 5. Verificação de atividades baseadas em tempo
  if (combined.includes('medita') || combined.includes('mindful') || combined.includes('zen')) {
    return GUIDED_ACTIVITY_PRESETS.meditation;
  }
  if (
    combined.includes('deep work') ||
    combined.includes('foco') ||
    combined.includes('pomodoro') ||
    combined.includes('trabalhar') ||
    combined.includes('trabalho')
  ) {
    return GUIDED_ACTIVITY_PRESETS.deep_work;
  }
  if (
    combined.includes('ler') ||
    combined.includes('leitura') ||
    combined.includes('livro') ||
    combined.includes('estudo') ||
    combined.includes('estudar') ||
    combined.includes('programar') ||
    combined.includes('programacao')
  ) {
    return GUIDED_ACTIVITY_PRESETS.reading;
  }
  if (combined.includes('alongar') || combined.includes('alongamento') || combined.includes('mobilidade') || combined.includes('yoga')) {
    return GUIDED_ACTIVITY_PRESETS.mobility;
  }
  if (combined.includes('respir') || combined.includes('breath')) {
    return GUIDED_ACTIVITY_PRESETS.breathwork;
  }
  if (combined.includes('caminh') || combined.includes('walk') || combined.includes('corrida') || combined.includes('cardio') || combined.includes('pedal')) {
    return GUIDED_ACTIVITY_PRESETS.walking;
  }

  // Fallback padrão amigável: se for exercício físico -> reps (20), senão timer de foco (10 min)
  const isPhysical = normCat.includes('treino') || normCat.includes('saude') || normCat.includes('corpo');
  if (isPhysical) {
    return {
      mode: 'reps',
      defaultTarget: 20,
      targetUnit: 'reps',
      label: { pt: title, en: title },
      instructions: {
        pt: 'Execute a sequência de repetições com respiração compassada e ritmo constante.',
        en: 'Perform repetition set with steady breathing and consistent pace.',
      },
      postureTips: {
        pt: ['Controle o movimento e respire de forma sincronizada.'],
        en: ['Control movement and sync breathing with each rep.'],
      },
      suggestedStat: 'strength',
      statBonus: 1,
      cardImage: '/optimized/Cards/Treinos.jpg',
      iconName: 'dumbbell',
    };
  }

  return {
    mode: 'timer',
    defaultTarget: 600, // 10 min
    targetUnit: 'seconds',
    label: { pt: title, en: title },
    instructions: {
      pt: 'Sessão cronometrada tática para execução deliberada do objetivo.',
      en: 'Timed tactical session for deliberate execution of objective.',
    },
    postureTips: {
      pt: ['Mantenha a atenção plena na atividade até a conclusão do timer.'],
      en: ['Keep full awareness on activity until timer completes.'],
    },
    suggestedStat: 'discipline',
    statBonus: 1,
    cardImage: '/optimized/Cards/Quadro de Missoes.jpg',
    iconName: 'clock',
  };
}

/**
 * Verifica se uma atividade é elegível para o modo guiado.
 */
export function isGuidedEligible(
  title: string,
  _category: string = '',
  type: 'habit' | 'task' | 'workout' | 'meal' | 'finance' = 'habit'
): boolean {
  void _category;
  if (type === 'workout') return true;
  if (type === 'meal' || type === 'finance') return false; // Redirecionam para módulos específicos
  return Boolean(title && title.trim().length > 0);
}

const STORAGE_PREFIX = 'ascend_guided_session_';

/**
 * Salva a sessão ativa de missão guiada no localStorage vinculada ao usuário.
 */
export function saveGuidedSession(session: GuidedQuestSession, userId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(session));
  } catch (err) {
    console.warn('[GuidedQuests] Erro ao salvar sessão guiada:', err);
  }
}

/**
 * Carrega a sessão ativa de missão guiada do localStorage.
 */
export function loadGuidedSession(userId: string): GuidedQuestSession | null {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return null;
    return JSON.parse(raw) as GuidedQuestSession;
  } catch (err) {
    console.warn('[GuidedQuests] Erro ao carregar sessão guiada:', err);
    return null;
  }
}

/**
 * Remove a sessão ativa do localStorage.
 */
export function clearGuidedSession(userId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${userId}`);
  } catch (err) {
    console.warn('[GuidedQuests] Erro ao limpar sessão guiada:', err);
  }
}

/**
 * Calcula o tempo restante de forma resiliente baseando-se no timestamp epoch.
 * Imune a suspensões de abas, bloqueio de tela e reload da página.
 */
export function calculateRemainingSeconds(session: GuidedQuestSession): number {
  if (session.mode !== 'timer') return 0;
  if (session.isPaused) {
    return Math.max(0, session.remainingWhenPaused ?? session.targetValue);
  }
  if (!session.targetTimestamp) {
    return Math.max(0, session.targetValue - session.currentValue);
  }
  const remainingMs = session.targetTimestamp - Date.now();
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

/**
 * Formata segundos em string digital MM:SS de alta legibilidade.
 */
export function formatTimeMMSS(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safeSec / 60);
  const s = safeSec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

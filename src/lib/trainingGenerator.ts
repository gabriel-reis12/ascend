import {
  EXERCISE_ARSENAL,
  type ExerciseDefinition,
  type Equipment,
  type MuscleGroup,
  type Complexity,
} from '../data/exerciseArsenal.ts';

export type TrainingGoal =
  | 'hypertrophy'
  | 'strength'
  | 'conditioning'
  | 'weight_loss'
  | 'health';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type TrainingEnvironment = 'gym' | 'home' | 'hybrid';

export type PhysicalRestriction = 'lombar' | 'joelho' | 'ombro' | 'punho' | 'cervical';

export interface TrainingGeneratorInput {
  goal: TrainingGoal;
  experience: ExperienceLevel;
  frequency: 2 | 3 | 4 | 5 | 6;
  durationMinutes: 30 | 45 | 60 | 90;
  environment: TrainingEnvironment;
  availableEquipment?: Equipment[];
  restrictions?: PhysicalRestriction[];
  preferredMuscleFocus?: MuscleGroup;
  additionalModalities?: string[];
}

export interface GeneratedExercise {
  name: string;
  muscle_group: MuscleGroup;
  category: string;
  sets: number;
  reps: number;
  weight_kg: number;
  rest_seconds: number;
  notesPt: string;
  notesEn: string;
}

export interface GeneratedRoutine {
  name: string;
  focusPt: string;
  focusEn: string;
  scheduled_days: number[]; // 0 = Dom, 1 = Seg, 2 = Ter, etc.
  dayLabelsPt: string[];
  dayLabelsEn: string[];
  exercises: GeneratedExercise[];
}

export interface GeneratedProtocol {
  id: string;
  name: string;
  nameEn: string;
  goal: TrainingGoal;
  goalLabelPt: string;
  goalLabelEn: string;
  splitType: string;
  splitDescriptionPt: string;
  splitDescriptionEn: string;
  frequency: number;
  frequencyLabelPt: string;
  frequencyLabelEn: string;
  estimatedDuration: string;
  routines: GeneratedRoutine[];
  targetAttributes: string[];
  clinicalDisclaimerPt: string;
  clinicalDisclaimerEn: string;
}

const DEFAULT_EQUIPMENT_GYM: Equipment[] = [
  'Barra',
  'Halteres',
  'Máquina',
  'Polia / Cabo',
  'Banco',
  'Peso Corporal',
  'Kettlebell',
];

const DEFAULT_EQUIPMENT_HOME: Equipment[] = [
  'Halteres',
  'Peso Corporal',
  'Elásticos',
  'Banco',
];

export function resolveAvailableEquipment(
  env: TrainingEnvironment,
  custom?: Equipment[]
): Equipment[] {
  if (custom && custom.length > 0) return custom;
  if (env === 'gym') return DEFAULT_EQUIPMENT_GYM;
  if (env === 'home') return DEFAULT_EQUIPMENT_HOME;
  return Array.from(new Set([...DEFAULT_EQUIPMENT_GYM, ...DEFAULT_EQUIPMENT_HOME]));
}

function filterExercises(
  exercises: ExerciseDefinition[],
  allowedEquipment: Equipment[],
  restrictions: PhysicalRestriction[] = []
): ExerciseDefinition[] {
  return exercises.filter((ex) => {
    // Verifica restrições físicas
    if (restrictions.length > 0 && ex.avoidIfRestriction) {
      const hasConflict = ex.avoidIfRestriction.some((r) => restrictions.includes(r));
      if (hasConflict) return false;
    }

    // Verifica equipamentos disponíveis
    const hasEquipment = ex.equipment.some((eq) => allowedEquipment.includes(eq));
    return hasEquipment;
  });
}

function getPrescriptionParameters(goal: TrainingGoal, duration: number) {
  let defaultSets = 3;
  let defaultReps = 10;
  let restSeconds = 60;
  let targetExerciseCount = 5;

  switch (goal) {
    case 'strength':
      defaultSets = 4;
      defaultReps = 5;
      restSeconds = 120;
      break;
    case 'hypertrophy':
      defaultSets = 3;
      defaultReps = 10;
      restSeconds = 75;
      break;
    case 'conditioning':
    case 'weight_loss':
      defaultSets = 3;
      defaultReps = 14;
      restSeconds = 45;
      break;
    case 'health':
    default:
      defaultSets = 3;
      defaultReps = 12;
      restSeconds = 60;
      break;
  }

  // Ajusta quantidade de exercícios pelo tempo disponível
  if (duration <= 30) {
    targetExerciseCount = 3;
    defaultSets = Math.min(defaultSets, 3);
  } else if (duration <= 45) {
    targetExerciseCount = 4;
  } else if (duration <= 60) {
    targetExerciseCount = 5;
  } else {
    // 90 min
    targetExerciseCount = 7;
    defaultSets = Math.max(defaultSets, 4);
  }

  return { defaultSets, defaultReps, restSeconds, targetExerciseCount };
}

function selectBestExercise(
  availablePool: ExerciseDefinition[],
  primaryMuscle: MuscleGroup,
  selectedNames: Set<string>,
  fallbackPool: ExerciseDefinition[]
): ExerciseDefinition | null {
  const match = availablePool.find(
    (e) => e.muscle_group === primaryMuscle && !selectedNames.has(e.name)
  );
  if (match) return match;

  const secondaryMatch = availablePool.find(
    (e) => e.secondary_muscles.includes(primaryMuscle) && !selectedNames.has(e.name)
  );
  if (secondaryMatch) return secondaryMatch;

  // Fallback no catálogo geral com peso corporal
  const fallback = fallbackPool.find(
    (e) =>
      (e.muscle_group === primaryMuscle || e.secondary_muscles.includes(primaryMuscle)) &&
      !selectedNames.has(e.name)
  );
  return fallback || null;
}

export function generateTrainingProtocol(
  input: TrainingGeneratorInput
): GeneratedProtocol {
  const {
    goal,
    experience,
    frequency,
    durationMinutes,
    environment,
    availableEquipment: customEq,
    restrictions = [],
  } = input;

  const equipment = resolveAvailableEquipment(environment, customEq);
  const eligiblePool = filterExercises(EXERCISE_ARSENAL, equipment, restrictions);
  const safeFallbackPool = EXERCISE_ARSENAL.filter((ex) => {
    if (restrictions.length > 0 && ex.avoidIfRestriction) {
      return !ex.avoidIfRestriction.some((r) => restrictions.includes(r));
    }
    return true;
  });
  const { defaultSets, defaultReps, restSeconds, targetExerciseCount } =
    getPrescriptionParameters(goal, durationMinutes);

  let splitType = 'Full Body';
  let splitDescPt = 'Treino de corpo inteiro com estímulos equilibrados.';
  let splitDescEn = 'Full body training with balanced stimulation.';
  let routines: GeneratedRoutine[] = [];

  // ==========================================
  // 1. DIVISÃO: 2 DIAS (Full Body A/B)
  // ==========================================
  if (frequency === 2) {
    splitType = 'Full Body 2x';
    splitDescPt = 'Divisão em 2 sessões semanais alternando ênfase superior e inferior para recuperação ideal.';
    splitDescEn = '2-day weekly split alternating upper and lower emphasis for optimal recovery.';

    const routineAExercises: GeneratedExercise[] = [];
    const routineBExercises: GeneratedExercise[] = [];
    const selectedA = new Set<string>();
    const selectedB = new Set<string>();

    const musclesA: MuscleGroup[] = ['Peito', 'Costas', 'Quadríceps', 'Ombros', 'Abdômen / Core'];
    const musclesB: MuscleGroup[] = ['Posteriores', 'Costas', 'Peito', 'Bíceps', 'Tríceps', 'Panturrilhas'];

    for (const m of musclesA.slice(0, targetExerciseCount)) {
      const ex = selectBestExercise(eligiblePool, m, selectedA, safeFallbackPool);
      if (ex) {
        selectedA.add(ex.name);
        routineAExercises.push({
          name: ex.name,
          muscle_group: ex.muscle_group,
          category: ex.category,
          sets: defaultSets,
          reps: defaultReps,
          weight_kg: 0,
          rest_seconds: restSeconds,
          notesPt: ex.tipsPt,
          notesEn: ex.tipsEn,
        });
      }
    }

    for (const m of musclesB.slice(0, targetExerciseCount)) {
      const ex = selectBestExercise(eligiblePool, m, selectedB, safeFallbackPool);
      if (ex) {
        selectedB.add(ex.name);
        routineBExercises.push({
          name: ex.name,
          muscle_group: ex.muscle_group,
          category: ex.category,
          sets: defaultSets,
          reps: defaultReps,
          weight_kg: 0,
          rest_seconds: restSeconds,
          notesPt: ex.tipsPt,
          notesEn: ex.tipsEn,
        });
      }
    }

    routines = [
      {
        name: 'Treino A — Foco Superiores & Base',
        focusPt: 'Peito, Costas, Quadríceps e Core',
        focusEn: 'Chest, Back, Quads and Core',
        scheduled_days: [2], // Terça
        dayLabelsPt: ['Ter'],
        dayLabelsEn: ['Tue'],
        exercises: routineAExercises,
      },
      {
        name: 'Treino B — Foco Inferiores & Auxiliares',
        focusPt: 'Posteriores, Costas, Braços e Panturrilhas',
        focusEn: 'Hamstrings, Back, Arms and Calves',
        scheduled_days: [5], // Sexta
        dayLabelsPt: ['Sex'],
        dayLabelsEn: ['Fri'],
        exercises: routineBExercises,
      },
    ];
  }

  // ==========================================
  // 2. DIVISÃO: 3 DIAS (PPL ou Full Body 3x)
  // ==========================================
  else if (frequency === 3) {
    if (experience === 'beginner' || goal === 'health' || goal === 'conditioning') {
      splitType = 'Full Body 3x';
      splitDescPt = 'Corpo inteiro 3x por semana (Seg / Qua / Sex) garantindo frequência e recuperação consistentes.';
      splitDescEn = 'Full body 3x weekly (Mon / Wed / Fri) for consistent frequency and full recovery.';

      const templates = [
        { name: 'Treino A (Seg)', day: 1, labelPt: 'Seg', labelEn: 'Mon', muscles: ['Quadríceps', 'Peito', 'Costas', 'Ombros', 'Abdômen / Core'] as MuscleGroup[] },
        { name: 'Treino B (Qua)', day: 3, labelPt: 'Qua', labelEn: 'Wed', muscles: ['Posteriores', 'Costas', 'Peito', 'Bíceps', 'Tríceps'] as MuscleGroup[] },
        { name: 'Treino C (Sex)', day: 5, labelPt: 'Sex', labelEn: 'Fri', muscles: ['Glúteos', 'Quadríceps', 'Ombros', 'Panturrilhas', 'Abdômen / Core'] as MuscleGroup[] },
      ];

      routines = templates.map((tmpl) => {
        const selected = new Set<string>();
        const exs: GeneratedExercise[] = [];
        for (const m of tmpl.muscles.slice(0, targetExerciseCount)) {
          const ex = selectBestExercise(eligiblePool, m, selected, safeFallbackPool);
          if (ex) {
            selected.add(ex.name);
            exs.push({
              name: ex.name,
              muscle_group: ex.muscle_group,
              category: ex.category,
              sets: defaultSets,
              reps: defaultReps,
              weight_kg: 0,
              rest_seconds: restSeconds,
              notesPt: ex.tipsPt,
              notesEn: ex.tipsEn,
            });
          }
        }
        return {
          name: tmpl.name,
          focusPt: tmpl.muscles.slice(0, 3).join(', '),
          focusEn: tmpl.muscles.slice(0, 3).join(', '),
          scheduled_days: [tmpl.day],
          dayLabelsPt: [tmpl.labelPt],
          dayLabelsEn: [tmpl.labelEn],
          exercises: exs,
        };
      });
    } else {
      splitType = 'Push / Pull / Legs (PPL 3x)';
      splitDescPt = 'A clássica divisão de empurrar, puxar e pernas com 48h a 72h de descanso para máxima hipertrofia.';
      splitDescEn = 'Classic push, pull, legs division with 48h-72h recovery for optimal hypertrophy.';

      const templates = [
        { name: 'A - Push (Empurrar)', day: 1, labelPt: 'Seg', labelEn: 'Mon', focusPt: 'Peito, Ombros e Tríceps', focusEn: 'Chest, Shoulders & Triceps', muscles: ['Peito', 'Ombros', 'Tríceps', 'Peito', 'Ombros'] as MuscleGroup[] },
        { name: 'B - Pull (Puxar)', day: 3, labelPt: 'Qua', labelEn: 'Wed', focusPt: 'Costas, Bíceps e Trapézio', focusEn: 'Back & Biceps', muscles: ['Costas', 'Costas', 'Bíceps', 'Ombros', 'Abdômen / Core'] as MuscleGroup[] },
        { name: 'C - Legs (Pernas)', day: 5, labelPt: 'Sex', labelEn: 'Fri', focusPt: 'Quadríceps, Posteriores e Panturrilhas', focusEn: 'Quads, Hamstrings & Calves', muscles: ['Quadríceps', 'Posteriores', 'Quadríceps', 'Glúteos', 'Panturrilhas'] as MuscleGroup[] },
      ];

      routines = templates.map((tmpl) => {
        const selected = new Set<string>();
        const exs: GeneratedExercise[] = [];
        for (const m of tmpl.muscles.slice(0, targetExerciseCount)) {
          const ex = selectBestExercise(eligiblePool, m, selected, safeFallbackPool);
          if (ex) {
            selected.add(ex.name);
            exs.push({
              name: ex.name,
              muscle_group: ex.muscle_group,
              category: ex.category,
              sets: defaultSets,
              reps: defaultReps,
              weight_kg: 0,
              rest_seconds: restSeconds,
              notesPt: ex.tipsPt,
              notesEn: ex.tipsEn,
            });
          }
        }
        return {
          name: tmpl.name,
          focusPt: tmpl.focusPt,
          focusEn: tmpl.focusEn,
          scheduled_days: [tmpl.day],
          dayLabelsPt: [tmpl.labelPt],
          dayLabelsEn: [tmpl.labelEn],
          exercises: exs,
        };
      });
    }
  }

  // ==========================================
  // 3. DIVISÃO: 4 DIAS (Upper / Lower ou ABCD)
  // ==========================================
  else if (frequency === 4) {
    if (experience === 'advanced' && goal === 'hypertrophy') {
      splitType = 'ABCD Hipertrofia';
      splitDescPt = 'Divisão de grupos musculares sinérgicos permitindo alto volume semanal por sessão.';
      splitDescEn = 'Synergistic muscle group division allowing high volume per workout session.';

      const templates = [
        { name: 'A - Peito & Tríceps', day: 1, labelPt: 'Seg', labelEn: 'Mon', muscles: ['Peito', 'Peito', 'Tríceps', 'Tríceps', 'Ombros'] as MuscleGroup[] },
        { name: 'B - Costas & Bíceps', day: 2, labelPt: 'Ter', labelEn: 'Tue', muscles: ['Costas', 'Costas', 'Bíceps', 'Bíceps', 'Abdômen / Core'] as MuscleGroup[] },
        { name: 'C - Pernas Completo', day: 4, labelPt: 'Qui', labelEn: 'Thu', muscles: ['Quadríceps', 'Posteriores', 'Quadríceps', 'Glúteos', 'Panturrilhas'] as MuscleGroup[] },
        { name: 'D - Ombros & Core', day: 5, labelPt: 'Sex', labelEn: 'Fri', muscles: ['Ombros', 'Ombros', 'Ombros', 'Abdômen / Core', 'Cardio'] as MuscleGroup[] },
      ];

      routines = templates.map((tmpl) => {
        const selected = new Set<string>();
        const exs: GeneratedExercise[] = [];
        for (const m of tmpl.muscles.slice(0, targetExerciseCount)) {
          const ex = selectBestExercise(eligiblePool, m, selected, safeFallbackPool);
          if (ex) {
            selected.add(ex.name);
            exs.push({
              name: ex.name,
              muscle_group: ex.muscle_group,
              category: ex.category,
              sets: defaultSets,
              reps: defaultReps,
              weight_kg: 0,
              rest_seconds: restSeconds,
              notesPt: ex.tipsPt,
              notesEn: ex.tipsEn,
            });
          }
        }
        return {
          name: tmpl.name,
          focusPt: tmpl.muscles.slice(0, 2).join(' & '),
          focusEn: tmpl.muscles.slice(0, 2).join(' & '),
          scheduled_days: [tmpl.day],
          dayLabelsPt: [tmpl.labelPt],
          dayLabelsEn: [tmpl.labelEn],
          exercises: exs,
        };
      });
    } else {
      splitType = 'Upper / Lower (4x)';
      splitDescPt = 'Superiores e inferiores 2x na semana com distribuição balanceada de estímulos e recuperação.';
      splitDescEn = 'Upper & Lower 2x weekly with balanced frequency and optimal structural recovery.';

      const templates = [
        { name: 'A - Superiores Força', day: 1, labelPt: 'Seg', labelEn: 'Mon', muscles: ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps'] as MuscleGroup[] },
        { name: 'B - Inferiores Força', day: 2, labelPt: 'Ter', labelEn: 'Tue', muscles: ['Quadríceps', 'Posteriores', 'Glúteos', 'Panturrilhas', 'Abdômen / Core'] as MuscleGroup[] },
        { name: 'C - Superiores Volume', day: 4, labelPt: 'Qui', labelEn: 'Thu', muscles: ['Costas', 'Peito', 'Ombros', 'Tríceps', 'Bíceps'] as MuscleGroup[] },
        { name: 'D - Inferiores Volume', day: 5, labelPt: 'Sex', labelEn: 'Fri', muscles: ['Quadríceps', 'Posteriores', 'Quadríceps', 'Panturrilhas', 'Abdômen / Core'] as MuscleGroup[] },
      ];

      routines = templates.map((tmpl) => {
        const selected = new Set<string>();
        const exs: GeneratedExercise[] = [];
        for (const m of tmpl.muscles.slice(0, targetExerciseCount)) {
          const ex = selectBestExercise(eligiblePool, m, selected, safeFallbackPool);
          if (ex) {
            selected.add(ex.name);
            exs.push({
              name: ex.name,
              muscle_group: ex.muscle_group,
              category: ex.category,
              sets: defaultSets,
              reps: defaultReps,
              weight_kg: 0,
              rest_seconds: restSeconds,
              notesPt: ex.tipsPt,
              notesEn: ex.tipsEn,
            });
          }
        }
        return {
          name: tmpl.name,
          focusPt: tmpl.name.includes('Superiores') ? 'Peito, Costas, Ombros e Braços' : 'Quadríceps, Posteriores e Core',
          focusEn: tmpl.name.includes('Superiores') ? 'Chest, Back, Shoulders & Arms' : 'Quads, Hamstrings & Core',
          scheduled_days: [tmpl.day],
          dayLabelsPt: [tmpl.labelPt],
          dayLabelsEn: [tmpl.labelEn],
          exercises: exs,
        };
      });
    }
  }

  // ==========================================
  // 4. DIVISÃO: 5 DIAS (ABCDE Especialização)
  // ==========================================
  else if (frequency === 5) {
    splitType = 'ABCDE Especialização';
    splitDescPt = 'Divisão de isolamento por grupamento muscular com volume concentrado diário.';
    splitDescEn = 'Targeted muscle group isolation division with concentrated daily volume.';

    const templates = [
      { name: 'A - Peitoral & Core', day: 1, labelPt: 'Seg', labelEn: 'Mon', muscles: ['Peito', 'Peito', 'Peito', 'Abdômen / Core', 'Tríceps'] as MuscleGroup[] },
      { name: 'B - Costas & Lombar', day: 2, labelPt: 'Ter', labelEn: 'Tue', muscles: ['Costas', 'Costas', 'Costas', 'Bíceps', 'Abdômen / Core'] as MuscleGroup[] },
      { name: 'C - Pernas Completo', day: 3, labelPt: 'Qua', labelEn: 'Wed', muscles: ['Quadríceps', 'Quadríceps', 'Posteriores', 'Glúteos', 'Panturrilhas'] as MuscleGroup[] },
      { name: 'D - Ombros & Trapézio', day: 4, labelPt: 'Qui', labelEn: 'Thu', muscles: ['Ombros', 'Ombros', 'Ombros', 'Peito', 'Abdômen / Core'] as MuscleGroup[] },
      { name: 'E - Braços (Bíceps & Tríceps)', day: 5, labelPt: 'Sex', labelEn: 'Fri', muscles: ['Bíceps', 'Tríceps', 'Bíceps', 'Tríceps', 'Panturrilhas'] as MuscleGroup[] },
    ];

    routines = templates.map((tmpl) => {
      const selected = new Set<string>();
      const exs: GeneratedExercise[] = [];
      for (const m of tmpl.muscles.slice(0, targetExerciseCount)) {
        const ex = selectBestExercise(eligiblePool, m, selected, safeFallbackPool);
        if (ex) {
          selected.add(ex.name);
          exs.push({
            name: ex.name,
            muscle_group: ex.muscle_group,
            category: ex.category,
            sets: defaultSets,
            reps: defaultReps,
            weight_kg: 0,
            rest_seconds: restSeconds,
            notesPt: ex.tipsPt,
            notesEn: ex.tipsEn,
          });
        }
      }
      return {
        name: tmpl.name,
        focusPt: tmpl.name,
        focusEn: tmpl.name,
        scheduled_days: [tmpl.day],
        dayLabelsPt: [tmpl.labelPt],
        dayLabelsEn: [tmpl.labelEn],
        exercises: exs,
      };
    });
  }

  // ==========================================
  // 5. DIVISÃO: 6 DIAS (PPL 2x)
  // ==========================================
  else if (frequency === 6) {
    splitType = 'Push / Pull / Legs (PPL 2x)';
    splitDescPt = 'Alta frequência semanal repetindo o ciclo PPL duas vezes para atletas avançados.';
    splitDescEn = 'High weekly frequency repeating the PPL cycle twice for advanced athletes.';

    const templates = [
      { name: 'A1 - Push (Empurrar)', day: 1, labelPt: 'Seg', labelEn: 'Mon', muscles: ['Peito', 'Ombros', 'Tríceps', 'Peito'] as MuscleGroup[] },
      { name: 'B1 - Pull (Puxar)', day: 2, labelPt: 'Ter', labelEn: 'Tue', muscles: ['Costas', 'Costas', 'Bíceps', 'Ombros'] as MuscleGroup[] },
      { name: 'C1 - Legs (Pernas)', day: 3, labelPt: 'Qua', labelEn: 'Wed', muscles: ['Quadríceps', 'Posteriores', 'Panturrilhas', 'Glúteos'] as MuscleGroup[] },
      { name: 'A2 - Push (Hipertrofia)', day: 4, labelPt: 'Qui', labelEn: 'Thu', muscles: ['Peito', 'Ombros', 'Tríceps', 'Abdômen / Core'] as MuscleGroup[] },
      { name: 'B2 - Pull (Densidade)', day: 5, labelPt: 'Sex', labelEn: 'Fri', muscles: ['Costas', 'Costas', 'Bíceps', 'Abdômen / Core'] as MuscleGroup[] },
      { name: 'C2 - Legs (Posteriores/Glúteos)', day: 6, labelPt: 'Sáb', labelEn: 'Sat', muscles: ['Posteriores', 'Quadríceps', 'Glúteos', 'Panturrilhas'] as MuscleGroup[] },
    ];

    routines = templates.map((tmpl) => {
      const selected = new Set<string>();
      const exs: GeneratedExercise[] = [];
      for (const m of tmpl.muscles.slice(0, targetExerciseCount)) {
        const ex = selectBestExercise(eligiblePool, m, selected, safeFallbackPool);
        if (ex) {
          selected.add(ex.name);
          exs.push({
            name: ex.name,
            muscle_group: ex.muscle_group,
            category: ex.category,
            sets: defaultSets,
            reps: defaultReps,
            weight_kg: 0,
            rest_seconds: restSeconds,
            notesPt: ex.tipsPt,
            notesEn: ex.tipsEn,
          });
        }
      }
      return {
        name: tmpl.name,
        focusPt: tmpl.name,
        focusEn: tmpl.name,
        scheduled_days: [tmpl.day],
        dayLabelsPt: [tmpl.labelPt],
        dayLabelsEn: [tmpl.labelEn],
        exercises: exs,
      };
    });
  }

  // Meta de atributos RPG evoluídos
  const targetAttributes =
    goal === 'strength'
      ? ['FOR', 'RES', 'DIS']
      : goal === 'conditioning' || goal === 'weight_loss'
      ? ['VIT', 'RES', 'DIS']
      : ['FOR', 'VIT', 'DIS'];

  const goalLabelsPt: Record<TrainingGoal, string> = {
    hypertrophy: 'Hipertrofia & Volume Muscular',
    strength: 'Força & Potência Neuromuscular',
    conditioning: 'Condicionamento Físico & Resistência',
    weight_loss: 'Emagrecimento & Queima Calórica',
    health: 'Saúde Geral, Longevidade & Postura',
  };

  const goalLabelsEn: Record<TrainingGoal, string> = {
    hypertrophy: 'Hypertrophy & Muscle Volume',
    strength: 'Strength & Neuromuscular Power',
    conditioning: 'Conditioning & Stamina',
    weight_loss: 'Fat Loss & Calorie Burn',
    health: 'General Health, Longevity & Posture',
  };

  return {
    id: `custom-proto-${Date.now()}`,
    name: `Protocolo ${splitType} (${frequency}x)`,
    nameEn: `${splitType} Protocol (${frequency}x)`,
    goal,
    goalLabelPt: goalLabelsPt[goal],
    goalLabelEn: goalLabelsEn[goal],
    splitType,
    splitDescriptionPt: splitDescPt,
    splitDescriptionEn: splitDescEn,
    frequency,
    frequencyLabelPt: `${frequency} dias por semana`,
    frequencyLabelEn: `${frequency} days per week`,
    estimatedDuration: `${durationMinutes} min por sessão`,
    routines,
    targetAttributes,
    clinicalDisclaimerPt:
      'Aviso de Integridade: As recomendações do Códex são determinísticas e fundamentadas em diretrizes gerais de treinamento físico (ACSM/NSCA). Em caso de limitações articulares ou dores persistentes, consulte um profissional de Educação Física ou Fisioterapeuta.',
    clinicalDisclaimerEn:
      'Integrity Notice: Codex recommendations are deterministic based on general exercise guidelines (ACSM/NSCA). Consult a certified trainer or physician for medical clearance.',
  };
}

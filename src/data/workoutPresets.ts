export interface PresetExercise {
  name: string;
  muscle_group: string;
  category: string;
  sets: number;
  reps: number;
  weight_kg: number;
}

export interface PresetRoutine {
  name: string;
  scheduled_days: string[];
  exercises: PresetExercise[];
}

export interface WorkoutProgramPreset {
  id: string;
  title: string;
  image: string;
  frequency: '3x na semana' | '4x na semana' | '5x na semana' | '6x na semana' | 'Treino em Casa';
  description: string;
  estimatedDuration: string;
  routines: PresetRoutine[];
}

export const WORKOUT_PROGRAM_PRESETS: WorkoutProgramPreset[] = [
  {
    id: 'ppl-3x',
    title: 'Push Pull Legs 3x',
    image: '/optimized/Treinos/Push Pull Legs 3x.jpg',
    frequency: '3x na semana',
    description: 'A divisão clássica e mais eficiente para hipertrofia e força. Ideal para quem treina segundas, quartas e sextas.',
    estimatedDuration: '50-60 min por sessão',
    routines: [
      {
        name: 'A - Push (Empurrar)',
        scheduled_days: ['seg'],
        exercises: [
          { name: 'Supino Reto com Barra', muscle_group: 'Peito', category: 'Força', sets: 4, reps: 10, weight_kg: 40 },
          { name: 'Desenvolvimento Militar', muscle_group: 'Ombros', category: 'Força', sets: 4, reps: 8, weight_kg: 20 },
          { name: 'Supino Inclinado com Halteres', muscle_group: 'Peito', category: 'Força', sets: 3, reps: 10, weight_kg: 18 },
          { name: 'Tríceps Pulley (Corda)', muscle_group: 'Tríceps', category: 'Força', sets: 3, reps: 12, weight_kg: 15 },
          { name: 'Elevação Lateral', muscle_group: 'Ombros', category: 'Força', sets: 4, reps: 12, weight_kg: 8 }
        ]
      },
      {
        name: 'B - Pull (Puxar)',
        scheduled_days: ['qua'],
        exercises: [
          { name: 'Levantamento Terra', muscle_group: 'Costas', category: 'Força', sets: 3, reps: 8, weight_kg: 60 },
          { name: 'Puxada Alta (Pulley)', muscle_group: 'Costas', category: 'Força', sets: 4, reps: 10, weight_kg: 45 },
          { name: 'Remada Curvada com Barra', muscle_group: 'Costas', category: 'Força', sets: 3, reps: 10, weight_kg: 30 },
          { name: 'Rosca Direta com Barra W', muscle_group: 'Bíceps', category: 'Força', sets: 3, reps: 12, weight_kg: 16 },
          { name: 'Crucifixo Invertido', muscle_group: 'Ombros', category: 'Força', sets: 3, reps: 12, weight_kg: 10 }
        ]
      },
      {
        name: 'C - Legs (Pernas)',
        scheduled_days: ['sex'],
        exercises: [
          { name: 'Agachamento Livre', muscle_group: 'Quadríceps', category: 'Força', sets: 4, reps: 10, weight_kg: 50 },
          { name: 'Leg Press 45º', muscle_group: 'Pernas', category: 'Força', sets: 4, reps: 10, weight_kg: 120 },
          { name: 'Cadeira Extensora', muscle_group: 'Quadríceps', category: 'Força', sets: 3, reps: 12, weight_kg: 35 },
          { name: 'Mesa Flexora', muscle_group: 'Posteriores', category: 'Força', sets: 3, reps: 12, weight_kg: 25 },
          { name: 'Panturrilhas em Pé', muscle_group: 'Panturrilhas', category: 'Força', sets: 4, reps: 15, weight_kg: 30 }
        ]
      }
    ]
  },
  {
    id: 'abcd-4x',
    title: 'ABCD Hipertrofia',
    image: '/optimized/Treinos/ABCD Hipertrofia.jpg',
    frequency: '4x na semana',
    description: 'Divisão que permite maior volume semanal por grupo muscular e maior tempo de descanso. Excelente para intermediários.',
    estimatedDuration: '45-55 min por sessão',
    routines: [
      {
        name: 'A - Peito e Tríceps',
        scheduled_days: ['seg'],
        exercises: [
          { name: 'Supino Reto com Barra', muscle_group: 'Peito', category: 'Força', sets: 4, reps: 10, weight_kg: 40 },
          { name: 'Supino Inclinado com Barra', muscle_group: 'Peito', category: 'Força', sets: 3, reps: 10, weight_kg: 30 },
          { name: 'Crucifixo Reto com Halteres', muscle_group: 'Peito', category: 'Força', sets: 3, reps: 12, weight_kg: 14 },
          { name: 'Tríceps Testa', muscle_group: 'Tríceps', category: 'Força', sets: 3, reps: 10, weight_kg: 16 },
          { name: 'Tríceps Francês', muscle_group: 'Tríceps', category: 'Força', sets: 3, reps: 12, weight_kg: 12 }
        ]
      },
      {
        name: 'B - Costas e Bíceps',
        scheduled_days: ['ter'],
        exercises: [
          { name: 'Puxada Alta (Pulley)', muscle_group: 'Costas', category: 'Força', sets: 4, reps: 10, weight_kg: 45 },
          { name: 'Remada Baixa (Triângulo)', muscle_group: 'Costas', category: 'Força', sets: 3, reps: 10, weight_kg: 40 },
          { name: 'Remada Unilateral com Halter', muscle_group: 'Costas', category: 'Força', sets: 3, reps: 12, weight_kg: 18 },
          { name: 'Rosca Alternada com Halteres', muscle_group: 'Bíceps', category: 'Força', sets: 3, reps: 12, weight_kg: 12 },
          { name: 'Rosca Concentrada', muscle_group: 'Bíceps', category: 'Força', sets: 3, reps: 12, weight_kg: 10 }
        ]
      },
      {
        name: 'C - Pernas Completo',
        scheduled_days: ['qui'],
        exercises: [
          { name: 'Agachamento Livre', muscle_group: 'Quadríceps', category: 'Força', sets: 4, reps: 10, weight_kg: 50 },
          { name: 'Leg Press 45º', muscle_group: 'Pernas', category: 'Força', sets: 3, reps: 10, weight_kg: 120 },
          { name: 'Stiff com Barra', muscle_group: 'Posteriores', category: 'Força', sets: 3, reps: 10, weight_kg: 30 },
          { name: 'Cadeira Flexora', muscle_group: 'Posteriores', category: 'Força', sets: 3, reps: 12, weight_kg: 25 },
          { name: 'Panturrilhas Sentado', muscle_group: 'Panturrilhas', category: 'Força', sets: 4, reps: 15, weight_kg: 20 }
        ]
      },
      {
        name: 'D - Ombros e Abdômen',
        scheduled_days: ['sex'],
        exercises: [
          { name: 'Desenvolvimento com Halteres', muscle_group: 'Ombros', category: 'Força', sets: 4, reps: 10, weight_kg: 14 },
          { name: 'Elevação Lateral', muscle_group: 'Ombros', category: 'Força', sets: 4, reps: 12, weight_kg: 8 },
          { name: 'Crucifixo Invertido', muscle_group: 'Ombros', category: 'Força', sets: 3, reps: 12, weight_kg: 10 },
          { name: 'Abdominal Supra (Solo)', muscle_group: 'Abdômen', category: 'Força', sets: 4, reps: 20, weight_kg: 0 },
          { name: 'Elevação de Pernas', muscle_group: 'Abdômen', category: 'Força', sets: 3, reps: 15, weight_kg: 0 }
        ]
      }
    ]
  },
  {
    id: 'abcde-5x',
    title: 'ABCDE Clássico',
    image: '/optimized/Treinos/ABCDE Clássico.jpg',
    frequency: '5x na semana',
    description: 'Foco em altíssima intensidade por grupo muscular com uma sessão por dia de segunda a sexta. Recomendado para caçadores avançados.',
    estimatedDuration: '40-50 min por sessão',
    routines: [
      {
        name: 'A - Peito',
        scheduled_days: ['seg'],
        exercises: [
          { name: 'Supino Reto com Barra', muscle_group: 'Peito', category: 'Força', sets: 4, reps: 10, weight_kg: 45 },
          { name: 'Supino Inclinado com Halteres', muscle_group: 'Peito', category: 'Força', sets: 4, reps: 10, weight_kg: 20 },
          { name: 'Crossover (Polia)', muscle_group: 'Peito', category: 'Força', sets: 3, reps: 12, weight_kg: 20 },
          { name: 'Pec Deck (Voador)', muscle_group: 'Peito', category: 'Força', sets: 3, reps: 12, weight_kg: 40 }
        ]
      },
      {
        name: 'B - Costas',
        scheduled_days: ['ter'],
        exercises: [
          { name: 'Puxada Alta (Pulley)', muscle_group: 'Costas', category: 'Força', sets: 4, reps: 10, weight_kg: 50 },
          { name: 'Remada Curvada com Barra', muscle_group: 'Costas', category: 'Força', sets: 4, reps: 10, weight_kg: 40 },
          { name: 'Remada Baixa (Cavalinho)', muscle_group: 'Costas', category: 'Força', sets: 3, reps: 12, weight_kg: 35 },
          { name: 'Pull Down (Polia)', muscle_group: 'Costas', category: 'Força', sets: 3, reps: 15, weight_kg: 20 }
        ]
      },
      {
        name: 'C - Pernas',
        scheduled_days: ['qua'],
        exercises: [
          { name: 'Agachamento Livre', muscle_group: 'Quadríceps', category: 'Força', sets: 4, reps: 10, weight_kg: 55 },
          { name: 'Leg Press 45º', muscle_group: 'Pernas', category: 'Força', sets: 4, reps: 10, weight_kg: 140 },
          { name: 'Cadeira Extensora', muscle_group: 'Quadríceps', category: 'Força', sets: 3, reps: 12, weight_kg: 40 },
          { name: 'Stiff com Halteres', muscle_group: 'Posteriores', category: 'Força', sets: 3, reps: 12, weight_kg: 16 },
          { name: 'Panturrilhas em Pé', muscle_group: 'Panturrilhas', category: 'Força', sets: 4, reps: 15, weight_kg: 30 }
        ]
      },
      {
        name: 'D - Ombros',
        scheduled_days: ['qui'],
        exercises: [
          { name: 'Desenvolvimento Militar', muscle_group: 'Ombros', category: 'Força', sets: 4, reps: 8, weight_kg: 22 },
          { name: 'Elevação Lateral', muscle_group: 'Ombros', category: 'Força', sets: 4, reps: 12, weight_kg: 9 },
          { name: 'Elevação Frontal com Halteres', muscle_group: 'Ombros', category: 'Força', sets: 3, reps: 12, weight_kg: 10 },
          { name: 'Crucifixo Invertido', muscle_group: 'Ombros', category: 'Força', sets: 3, reps: 12, weight_kg: 12 }
        ]
      },
      {
        name: 'E - Braços (Bíceps + Tríceps)',
        scheduled_days: ['sex'],
        exercises: [
          { name: 'Rosca Direta com Barra W', muscle_group: 'Bíceps', category: 'Força', sets: 3, reps: 12, weight_kg: 18 },
          { name: 'Tríceps Pulley (Corda)', muscle_group: 'Tríceps', category: 'Força', sets: 3, reps: 12, weight_kg: 18 },
          { name: 'Rosca Martelo com Halteres', muscle_group: 'Bíceps', category: 'Força', sets: 3, reps: 12, weight_kg: 12 },
          { name: 'Tríceps Pulley (Barra)', muscle_group: 'Tríceps', category: 'Força', sets: 3, reps: 12, weight_kg: 20 },
          { name: 'Rosca Inversa com Barra', muscle_group: 'Antebraço', category: 'Força', sets: 3, reps: 15, weight_kg: 12 }
        ]
      }
    ]
  },
  {
    id: 'ppl-6x',
    title: 'Push Pull Legs 6x',
    image: '/optimized/Treinos/Push Pull Legs 6x.jpg',
    frequency: '6x na semana',
    description: 'Volume e frequência máximos para atletas com rotina de treino dedicada. Duplica a divisão PPL cobrindo de segunda a sábado.',
    estimatedDuration: '50-60 min por sessão',
    routines: [
      {
        name: 'A - Push 1 (Empurrar)',
        scheduled_days: ['seg'],
        exercises: [
          { name: 'Supino Reto com Barra', muscle_group: 'Peito', category: 'Força', sets: 4, reps: 8, weight_kg: 45 },
          { name: 'Desenvolvimento Militar', muscle_group: 'Ombros', category: 'Força', sets: 4, reps: 8, weight_kg: 20 },
          { name: 'Supino Inclinado com Halteres', muscle_group: 'Peito', category: 'Força', sets: 3, reps: 10, weight_kg: 20 },
          { name: 'Tríceps Pulley (Corda)', muscle_group: 'Tríceps', category: 'Força', sets: 3, reps: 12, weight_kg: 16 },
          { name: 'Elevação Lateral', muscle_group: 'Ombros', category: 'Força', sets: 4, reps: 12, weight_kg: 8 }
        ]
      },
      {
        name: 'B - Pull 1 (Puxar)',
        scheduled_days: ['ter'],
        exercises: [
          { name: 'Levantamento Terra', muscle_group: 'Costas', category: 'Força', sets: 3, reps: 8, weight_kg: 60 },
          { name: 'Puxada Alta (Pulley)', muscle_group: 'Costas', category: 'Força', sets: 4, reps: 10, weight_kg: 45 },
          { name: 'Remada Curvada com Barra', muscle_group: 'Costas', category: 'Força', sets: 3, reps: 10, weight_kg: 35 },
          { name: 'Rosca Direta com Barra W', muscle_group: 'Bíceps', category: 'Força', sets: 3, reps: 12, weight_kg: 18 },
          { name: 'Crucifixo Invertido', muscle_group: 'Ombros', category: 'Força', sets: 3, reps: 12, weight_kg: 10 }
        ]
      },
      {
        name: 'C - Legs 1 (Pernas)',
        scheduled_days: ['qua'],
        exercises: [
          { name: 'Agachamento Livre', muscle_group: 'Quadríceps', category: 'Força', sets: 4, reps: 10, weight_kg: 50 },
          { name: 'Leg Press 45º', muscle_group: 'Pernas', category: 'Força', sets: 3, reps: 10, weight_kg: 130 },
          { name: 'Cadeira Extensora', muscle_group: 'Quadríceps', category: 'Força', sets: 3, reps: 12, weight_kg: 35 },
          { name: 'Mesa Flexora', muscle_group: 'Posteriores', category: 'Força', sets: 3, reps: 12, weight_kg: 25 },
          { name: 'Panturrilhas em Pé', muscle_group: 'Panturrilhas', category: 'Força', sets: 4, reps: 15, weight_kg: 30 }
        ]
      },
      {
        name: 'D - Push 2 (Foco Isoladores)',
        scheduled_days: ['qui'],
        exercises: [
          { name: 'Supino Inclinado com Halteres', muscle_group: 'Peito', category: 'Força', sets: 4, reps: 8, weight_kg: 22 },
          { name: 'Supino Reto com Halteres', muscle_group: 'Peito', category: 'Força', sets: 3, reps: 10, weight_kg: 20 },
          { name: 'Elevação Lateral na Polia', muscle_group: 'Ombros', category: 'Força', sets: 4, reps: 12, weight_kg: 10 },
          { name: 'Tríceps Testa', muscle_group: 'Tríceps', category: 'Força', sets: 3, reps: 10, weight_kg: 16 },
          { name: 'Tríceps Francês', muscle_group: 'Tríceps', category: 'Força', sets: 3, reps: 12, weight_kg: 12 }
        ]
      },
      {
        name: 'E - Pull 2 (Foco Volume)',
        scheduled_days: ['sex'],
        exercises: [
          { name: 'Remada Curvada com Barra', muscle_group: 'Costas', category: 'Força', sets: 4, reps: 8, weight_kg: 40 },
          { name: 'Puxada Triângulo (Pulley)', muscle_group: 'Costas', category: 'Força', sets: 3, reps: 10, weight_kg: 45 },
          { name: 'Rosca Alternada com Halteres', muscle_group: 'Bíceps', category: 'Força', sets: 3, reps: 12, weight_kg: 12 },
          { name: 'Rosca Martelo', muscle_group: 'Bíceps', category: 'Força', sets: 3, reps: 12, weight_kg: 12 },
          { name: 'Encolhimento com Halteres', muscle_group: 'Costas', category: 'Força', sets: 3, reps: 15, weight_kg: 24 }
        ]
      },
      {
        name: 'F - Legs 2 (Foco Posteriores)',
        scheduled_days: ['sab'],
        exercises: [
          { name: 'Stiff com Barra', muscle_group: 'Posteriores', category: 'Força', sets: 4, reps: 10, weight_kg: 40 },
          { name: 'Agachamento Sumô com Halter', muscle_group: 'Pernas', category: 'Força', sets: 3, reps: 10, weight_kg: 26 },
          { name: 'Cadeira Flexora', muscle_group: 'Posteriores', category: 'Força', sets: 4, reps: 12, weight_kg: 30 },
          { name: 'Cadeira Extensora', muscle_group: 'Quadríceps', category: 'Força', sets: 3, reps: 12, weight_kg: 40 },
          { name: 'Panturrilhas Sentado', muscle_group: 'Panturrilhas', category: 'Força', sets: 4, reps: 15, weight_kg: 25 }
        ]
      }
    ]
  },
  {
    id: 'casa-3x',
    title: 'Treino em Casa',
    image: '/optimized/Treinos/Treino em Casa.jpg',
    frequency: 'Treino em Casa',
    description: 'Programa completo utilizando apenas o peso do corpo. Excelente para manter a forma e consistência de qualquer lugar.',
    estimatedDuration: '35-45 min por sessão',
    routines: [
      {
        name: 'A - Superiores (Peso Corporal)',
        scheduled_days: ['seg'],
        exercises: [
          { name: 'Flexão de Braço (Solo)', muscle_group: 'Peito', category: 'Força', sets: 4, reps: 12, weight_kg: 0 },
          { name: 'Flexão Inclinada (Apoio)', muscle_group: 'Peito', category: 'Força', sets: 3, reps: 12, weight_kg: 0 },
          { name: 'Tríceps Banco (Cadeira)', muscle_group: 'Tríceps', category: 'Força', sets: 3, reps: 15, weight_kg: 0 },
          { name: 'Elevação Lateral com Garrafas', muscle_group: 'Ombros', category: 'Força', sets: 4, reps: 15, weight_kg: 0 }
        ]
      },
      {
        name: 'B - Inferiores (Peso Corporal)',
        scheduled_days: ['qua'],
        exercises: [
          { name: 'Agachamento Livre (Corporal)', muscle_group: 'Quadríceps', category: 'Força', sets: 4, reps: 20, weight_kg: 0 },
          { name: 'Avanço / Passada', muscle_group: 'Pernas', category: 'Força', sets: 3, reps: 12, weight_kg: 0 },
          { name: 'Elevação Pélvica (Solo)', muscle_group: 'Posteriores', category: 'Força', sets: 3, reps: 20, weight_kg: 0 },
          { name: 'Panturrilhas Unilateral (Degrau)', muscle_group: 'Panturrilhas', category: 'Força', sets: 4, reps: 15, weight_kg: 0 }
        ]
      },
      {
        name: 'C - Core e Cardio',
        scheduled_days: ['sex'],
        exercises: [
          { name: 'Prancha Abdominal', muscle_group: 'Abdômen', category: 'Força', sets: 3, reps: 45, weight_kg: 0 },
          { name: 'Mountain Climbers', muscle_group: 'Abdômen', category: 'Força', sets: 3, reps: 30, weight_kg: 0 },
          { name: 'Abdominal Remador', muscle_group: 'Abdômen', category: 'Força', sets: 3, reps: 20, weight_kg: 0 },
          { name: 'Polichinelos', muscle_group: 'Cardio', category: 'Cardio', sets: 3, reps: 50, weight_kg: 0 }
        ]
      }
    ]
  },
  {
    id: 'full-body-3x',
    title: 'Full Body 3x',
    image: '/optimized/Treinos/Full Body 3x.jpg',
    frequency: '3x na semana',
    description: 'Treino completo de corpo inteiro com progressão simples, alta frequência e excelente recuperação.',
    estimatedDuration: '45-55 min por sessão',
    routines: [
      {
        name: 'Full Body A',
        scheduled_days: ['seg'],
        exercises: [
          { name: 'Agachamento Livre', muscle_group: 'Quadríceps', category: 'Força', sets: 4, reps: 8, weight_kg: 40 },
          { name: 'Supino Reto com Barra', muscle_group: 'Peito', category: 'Força', sets: 4, reps: 8, weight_kg: 30 },
          { name: 'Remada Curvada com Barra', muscle_group: 'Costas', category: 'Força', sets: 3, reps: 10, weight_kg: 25 },
          { name: 'Prancha Abdominal', muscle_group: 'Abdômen', category: 'Força', sets: 3, reps: 40, weight_kg: 0 }
        ]
      },
      {
        name: 'Full Body B',
        scheduled_days: ['qua'],
        exercises: [
          { name: 'Levantamento Terra', muscle_group: 'Costas', category: 'Força', sets: 3, reps: 6, weight_kg: 50 },
          { name: 'Desenvolvimento Militar', muscle_group: 'Ombros', category: 'Força', sets: 4, reps: 8, weight_kg: 18 },
          { name: 'Avanço / Passada', muscle_group: 'Pernas', category: 'Força', sets: 3, reps: 10, weight_kg: 12 },
          { name: 'Puxada Alta (Pulley)', muscle_group: 'Costas', category: 'Força', sets: 3, reps: 10, weight_kg: 35 }
        ]
      },
      {
        name: 'Full Body C',
        scheduled_days: ['sex'],
        exercises: [
          { name: 'Leg Press 45º', muscle_group: 'Pernas', category: 'Força', sets: 4, reps: 10, weight_kg: 90 },
          { name: 'Supino Inclinado com Halteres', muscle_group: 'Peito', category: 'Força', sets: 3, reps: 10, weight_kg: 14 },
          { name: 'Remada Unilateral com Halter', muscle_group: 'Costas', category: 'Força', sets: 3, reps: 12, weight_kg: 16 },
          { name: 'Elevação Lateral', muscle_group: 'Ombros', category: 'Força', sets: 3, reps: 12, weight_kg: 6 }
        ]
      }
    ]
  },
  {
    id: 'upper-lower-4x',
    title: 'Upper/Lower 4x',
    image: '/optimized/Treinos/UpperLower 4x.jpg',
    frequency: '4x na semana',
    description: 'Alternância eficiente entre membros superiores e inferiores para força e hipertrofia equilibradas.',
    estimatedDuration: '50-60 min por sessão',
    routines: [
      {
        name: 'Upper A - Força',
        scheduled_days: ['seg'],
        exercises: [
          { name: 'Supino Reto com Barra', muscle_group: 'Peito', category: 'Força', sets: 4, reps: 6, weight_kg: 45 },
          { name: 'Remada Curvada com Barra', muscle_group: 'Costas', category: 'Força', sets: 4, reps: 6, weight_kg: 40 },
          { name: 'Desenvolvimento Militar', muscle_group: 'Ombros', category: 'Força', sets: 3, reps: 8, weight_kg: 20 },
          { name: 'Rosca Direta com Barra W', muscle_group: 'Bíceps', category: 'Força', sets: 3, reps: 10, weight_kg: 16 }
        ]
      },
      {
        name: 'Lower A - Força',
        scheduled_days: ['ter'],
        exercises: [
          { name: 'Agachamento Livre', muscle_group: 'Quadríceps', category: 'Força', sets: 4, reps: 6, weight_kg: 55 },
          { name: 'Stiff com Barra', muscle_group: 'Posteriores', category: 'Força', sets: 4, reps: 8, weight_kg: 35 },
          { name: 'Leg Press 45º', muscle_group: 'Pernas', category: 'Força', sets: 3, reps: 10, weight_kg: 110 },
          { name: 'Panturrilhas em Pé', muscle_group: 'Panturrilhas', category: 'Força', sets: 4, reps: 15, weight_kg: 25 }
        ]
      },
      {
        name: 'Upper B - Volume',
        scheduled_days: ['qui'],
        exercises: [
          { name: 'Supino Inclinado com Halteres', muscle_group: 'Peito', category: 'Força', sets: 4, reps: 10, weight_kg: 18 },
          { name: 'Puxada Alta (Pulley)', muscle_group: 'Costas', category: 'Força', sets: 4, reps: 10, weight_kg: 40 },
          { name: 'Elevação Lateral', muscle_group: 'Ombros', category: 'Força', sets: 4, reps: 12, weight_kg: 8 },
          { name: 'Tríceps Pulley (Corda)', muscle_group: 'Tríceps', category: 'Força', sets: 3, reps: 12, weight_kg: 15 }
        ]
      },
      {
        name: 'Lower B - Volume',
        scheduled_days: ['sex'],
        exercises: [
          { name: 'Agachamento Sumô com Halter', muscle_group: 'Pernas', category: 'Força', sets: 4, reps: 10, weight_kg: 24 },
          { name: 'Cadeira Extensora', muscle_group: 'Quadríceps', category: 'Força', sets: 3, reps: 12, weight_kg: 35 },
          { name: 'Mesa Flexora', muscle_group: 'Posteriores', category: 'Força', sets: 3, reps: 12, weight_kg: 25 },
          { name: 'Elevação Pélvica (Solo)', muscle_group: 'Posteriores', category: 'Força', sets: 4, reps: 12, weight_kg: 30 }
        ]
      }
    ]
  },
  {
    id: 'forca-base-3x',
    title: 'Força Base 3x',
    image: '/optimized/Treinos/Força Base 3x.jpg',
    frequency: '3x na semana',
    description: 'Fundamentos de força com foco nos grandes levantamentos e progressão consistente de carga.',
    estimatedDuration: '55-65 min por sessão',
    routines: [
      {
        name: 'Força A - Agachamento',
        scheduled_days: ['seg'],
        exercises: [
          { name: 'Agachamento Livre', muscle_group: 'Quadríceps', category: 'Força', sets: 5, reps: 5, weight_kg: 60 },
          { name: 'Supino Reto com Barra', muscle_group: 'Peito', category: 'Força', sets: 5, reps: 5, weight_kg: 45 },
          { name: 'Remada Curvada com Barra', muscle_group: 'Costas', category: 'Força', sets: 4, reps: 6, weight_kg: 40 }
        ]
      },
      {
        name: 'Força B - Terra',
        scheduled_days: ['qua'],
        exercises: [
          { name: 'Levantamento Terra', muscle_group: 'Costas', category: 'Força', sets: 5, reps: 3, weight_kg: 70 },
          { name: 'Desenvolvimento Militar', muscle_group: 'Ombros', category: 'Força', sets: 5, reps: 5, weight_kg: 25 },
          { name: 'Puxada Alta (Pulley)', muscle_group: 'Costas', category: 'Força', sets: 4, reps: 8, weight_kg: 45 }
        ]
      },
      {
        name: 'Força C - Potência',
        scheduled_days: ['sex'],
        exercises: [
          { name: 'Agachamento Livre', muscle_group: 'Quadríceps', category: 'Força', sets: 4, reps: 5, weight_kg: 55 },
          { name: 'Supino Reto com Barra', muscle_group: 'Peito', category: 'Força', sets: 4, reps: 5, weight_kg: 42 },
          { name: 'Stiff com Barra', muscle_group: 'Posteriores', category: 'Força', sets: 4, reps: 6, weight_kg: 45 }
        ]
      }
    ]
  },
  {
    id: 'recomposicao-4x',
    title: 'Recomposição Corporal',
    image: '/optimized/Treinos/Recomposição Corporal.jpg',
    frequency: '4x na semana',
    description: 'Combina musculação e condicionamento para aumentar massa magra enquanto melhora o gasto energético.',
    estimatedDuration: '45-60 min por sessão',
    routines: [
      {
        name: 'A - Superiores Metabólico',
        scheduled_days: ['seg'],
        exercises: [
          { name: 'Supino Reto com Halteres', muscle_group: 'Peito', category: 'Força', sets: 4, reps: 12, weight_kg: 16 },
          { name: 'Remada Baixa (Triângulo)', muscle_group: 'Costas', category: 'Força', sets: 4, reps: 12, weight_kg: 35 },
          { name: 'Elevação Lateral', muscle_group: 'Ombros', category: 'Força', sets: 3, reps: 15, weight_kg: 6 }
        ]
      },
      {
        name: 'B - Inferiores Metabólico',
        scheduled_days: ['ter'],
        exercises: [
          { name: 'Agachamento Livre', muscle_group: 'Quadríceps', category: 'Força', sets: 4, reps: 12, weight_kg: 40 },
          { name: 'Stiff com Halteres', muscle_group: 'Posteriores', category: 'Força', sets: 4, reps: 12, weight_kg: 14 },
          { name: 'Avanço / Passada', muscle_group: 'Pernas', category: 'Força', sets: 3, reps: 12, weight_kg: 10 }
        ]
      },
      {
        name: 'C - Full Body',
        scheduled_days: ['qui'],
        exercises: [
          { name: 'Leg Press 45º', muscle_group: 'Pernas', category: 'Força', sets: 3, reps: 15, weight_kg: 90 },
          { name: 'Supino Inclinado com Halteres', muscle_group: 'Peito', category: 'Força', sets: 3, reps: 12, weight_kg: 14 },
          { name: 'Puxada Alta (Pulley)', muscle_group: 'Costas', category: 'Força', sets: 3, reps: 12, weight_kg: 35 }
        ]
      },
      {
        name: 'D - Condicionamento',
        scheduled_days: ['sab'],
        exercises: [
          { name: 'Mountain Climbers', muscle_group: 'Abdômen', category: 'Cardio', sets: 4, reps: 30, weight_kg: 0 },
          { name: 'Polichinelos', muscle_group: 'Cardio', category: 'Cardio', sets: 4, reps: 50, weight_kg: 0 },
          { name: 'Prancha Abdominal', muscle_group: 'Abdômen', category: 'Força', sets: 4, reps: 45, weight_kg: 0 }
        ]
      }
    ]
  }
];

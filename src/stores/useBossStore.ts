import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useHunterStore } from './useHunterStore';

export interface BossDefinition {
  id: string;
  name: string;
  title: string;
  titleReward: string;
  achievementTitle: string;
  achievementDescription: string;
  achievementIcon: string;
  maxHp: number;
  image: string;
  lore: string;
  victoryLore: string;
  weakness: string;
  weaknessCategory: string; // Categoria de atividade que ativa o crítico
  color: string; // Cor neon em HSL/Hex para a UI
  xpReward: number;
}

export interface BossBattle {
  id: string;
  user_id: string;
  boss_id: string;
  name: string;
  title_reward: string;
  current_hp: number;
  max_hp: number;
  defeated: boolean;
  started_at: string;
  last_attack_at: string | null;
  defeated_at: string | null;
}

export const BOSS_LIST: BossDefinition[] = [
  {
    id: 'boss_01',
    name: 'O Senhor da Procrastinação',
    title: 'Boss 01',
    titleReward: 'Executor Implacável',
    achievementTitle: 'O Senhor da Procrastinação Derrotado',
    achievementDescription: 'Purificou o Senhor da Procrastinação',
    achievementIcon: 'Sword',
    maxHp: 100,
    image: '/Bosses/O Senhor da Procrastinação.jpeg',
    lore: 'Uma entidade gigantesca feita de correntes, relógios quebrados e fumaça negra. Ao seu redor existem centenas de missões abandonadas, projetos inacabados e metas esquecidas.',
    victoryLore: 'Com foco inabalável, você cortou as correntes e destruiu os relógios quebrados. O tempo agora pertence a você. Você se tornou um Executor Implacável!',
    weakness: 'Completar tarefas diárias comuns e quests.',
    weaknessCategory: 'task',
    color: '#8b5cf6', // Roxo
    xpReward: 300,
  },
  {
    id: 'boss_02',
    name: 'O Rei da Preguiça',
    title: 'Boss 02',
    titleReward: 'O Incansável',
    achievementTitle: 'O Rei da Preguiça Derrotado',
    achievementDescription: 'Purificou o Rei da Preguiça',
    achievementIcon: 'Flame',
    maxHp: 100,
    image: '/Bosses/O Rei da Preguiça.jpeg',
    lore: 'Uma criatura colossal sentada em um trono gigantesco de pedra e lodo. Ela não luta; apenas permanece imóvel. Correntes negras se espalham pelo chão, drenando a energia vital e a motivação de qualquer um que ouse se aproximar.',
    victoryLore: 'Seus treinos intensos e constância física fizeram o trono desmoronar e a letargia se dissipar. Nada pode parar o seu avanço!',
    weakness: 'Concluir treinos na aba Musculação (Workouts).',
    weaknessCategory: 'workout',
    color: '#ef4444', // Vermelho
    xpReward: 350,
  },
  {
    id: 'boss_03',
    name: 'A Sereia da Distração',
    title: 'Boss 03',
    titleReward: 'Mestre do Foco',
    achievementTitle: 'A Sereia da Distração Derrotada',
    achievementDescription: 'Purificou a Sereia da Distração',
    achievementIcon: 'Brain',
    maxHp: 120,
    image: '/Bosses/A Sereia da Distração.jpeg',
    lore: 'Uma entidade etérea que flutua acima de um oceano digital formado por telas luminosas. Ao seu redor brilham notificações, redes sociais e vídeos curtos. Os caçadores hipnotizados ficam presos olhando para as telas enquanto sua energia vital é sugada.',
    victoryLore: 'Você silenciou o ruído digital e recuperou sua atenção profunda. As luzes vazias não têm mais poder sobre a sua mente.',
    weakness: 'Hábitos e tarefas de Leitura, Estudo e Foco Profundo.',
    weaknessCategory: 'foco',
    color: '#3b82f6', // Azul
    xpReward: 400,
  },
  {
    id: 'boss_04',
    name: 'O Devorador do Progresso',
    title: 'Boss 04',
    titleReward: 'Mestre da Disciplina',
    achievementTitle: 'O Devorador do Progresso Derrotado',
    achievementDescription: 'Purificou o Devorador do Progresso',
    achievementIcon: 'Heart',
    maxHp: 120,
    image: '/Bosses/O Devorador do Progresso.jpeg',
    lore: 'Uma criatura colossal e insaciável formada por energia escura e fragmentos de excessos, impulsos e gratificação imediata. Ele não destrói os caçadores por combate direto, mas os convence a abandonar seu potencial em troca de prazeres rápidos.',
    victoryLore: 'Sua rotina nutricional perfeita, controle calórico e hidratação enfraqueceram a criatura até que ela ficasse em silêncio. A disciplina é seu novo escudo.',
    weakness: 'Marcar refeições, manter metas nutricionais de calorias/água e sono no horário.',
    weaknessCategory: 'nutrition',
    color: '#10b981', // Verde
    xpReward: 450,
  },
  {
    id: 'boss_05',
    name: 'O Mercador das Dívidas',
    title: 'Boss 05',
    titleReward: 'Guardião da Liberdade',
    achievementTitle: 'O Mercador das Dívidas Derrotado',
    achievementDescription: 'Purificou o Mercador das Dívidas',
    achievementIcon: 'Scale',
    maxHp: 150,
    image: '/Bosses/O Mercador das Dívidas.jpeg',
    lore: 'Sentado dentro de um mercado dimensional infinito cheio de ouro e armaduras lendárias, o Mercador domina pela sedução. Ele nunca obriga ninguém; ele apenas oferece. Mas atrás de cada item fácil existe uma corrente invisível que prende sua liberdade futura.',
    victoryLore: 'Ao registrar seus gastos e controlar suas compras por impulso, você quebrou o contrato dourado do Mercador e conquistou sua verdadeira liberdade.',
    weakness: 'Hábitos de Finanças, controle de despesas e aportes de investimento.',
    weaknessCategory: 'finance',
    color: '#f59e0b', // Âmbar
    xpReward: 500,
  },
  {
    id: 'boss_06',
    name: 'O Arauto do Caos',
    title: 'Boss 06',
    titleReward: 'Mestre da Clareza',
    achievementTitle: 'O Arauto do Caos Derrotado',
    achievementDescription: 'Purificou o Arauto do Caos',
    achievementIcon: 'Compass',
    maxHp: 150,
    image: '/Bosses/O Arauto do Caos.jpeg',
    lore: 'Uma catástrofe silenciosa. Ele não ataca com força física, mas transforma toda a sua vida em ruído e confusão. Sob sua influência, as prioridades somem, os planos se misturam e você acorda muito ocupado, mas nunca produtivo.',
    victoryLore: 'Ao definir metas claras, planejar suas semanas e organizar sua rotina, o nevoeiro do Arauto se dissipou. O caminho agora está limpo.',
    weakness: 'Planejamento semanal, metas de prioridade e organização de ambiente.',
    weaknessCategory: 'organization',
    color: '#06b6d4', // Ciano
    xpReward: 550,
  },
  {
    id: 'boss_07',
    name: 'O Reflexo da Autossabotagem',
    title: 'Boss Final',
    titleReward: 'O Purificado',
    achievementTitle: 'O Reflexo da Autossabotagem Purificado',
    achievementDescription: 'Superou a si mesmo e purificou o Reflexo da Autossabotagem',
    achievementIcon: 'Crown',
    maxHp: 200,
    image: '/Bosses/O Reflexo da Autossabotagem.jpeg',
    lore: 'A origem de todos os males. Após derrotar todos os chefes anteriores, você alcança o último portal e encontra apenas um espelho. Dentro dele está você mesmo: a soma de todas as versões de você que desistiram no passado.',
    victoryLore: 'Ao manter sua consistência e não desistir diante das dificuldades, você purificou a versão mais fraca de si mesmo. O sistema foi totalmente dominado.',
    weakness: 'Manter a consistência diária ativa e streaks consecutivas longas.',
    weaknessCategory: 'streak',
    color: '#ec4899', // Rosa
    xpReward: 800,
  },
];

interface BossStoreState {
  activeBattle: BossBattle | null;
  defeatedBossIds: string[];
  loading: boolean;
  error: string | null;
  recentDamage: { damage: number; isCritical: boolean } | null;

  loadActiveBattle: (userId: string) => Promise<void>;
  attackActiveBoss: (userId: string, baseDamage: number, actionType: string) => Promise<void>;
  purifyActiveBoss: (userId: string) => Promise<void>;
  resetBattle: (userId: string) => Promise<void>;
}

const normalizeActionType = (actionType: string) => {
  const normalized = actionType
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized.includes('workout') || normalized.includes('treino') || normalized.includes('cardio')) return 'workout';
  if (
    normalized.includes('estudo') ||
    normalized.includes('leitura') ||
    normalized.includes('idioma') ||
    normalized.includes('program') ||
    normalized.includes('tech') ||
    normalized.includes('foco')
  ) return 'foco';
  if (
    normalized.includes('nutrition') ||
    normalized.includes('nutricao') ||
    normalized.includes('saude') ||
    normalized.includes('aliment') ||
    normalized.includes('refeic') ||
    normalized.includes('mana')
  ) return 'nutrition';
  if (
    normalized.includes('finance') ||
    normalized.includes('financ') ||
    normalized.includes('divida') ||
    normalized.includes('invest') ||
    normalized.includes('freelance')
  ) return 'finance';
  if (
    normalized.includes('organization') ||
    normalized.includes('organiz') ||
    normalized.includes('planej') ||
    normalized.includes('trabalho') ||
    normalized.includes('produt') ||
    normalized.includes('rotina')
  ) return 'organization';
  if (normalized.includes('streak') || normalized.includes('consistencia')) return 'streak';
  return 'task';
};

export const useBossStore = create<BossStoreState>((set, get) => ({
  activeBattle: null,
  defeatedBossIds: [],
  loading: false,
  error: null,
  recentDamage: null,

  loadActiveBattle: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      // 1. Buscar se há alguma batalha ativa (defeated = false)
      const { data: active, error: activeErr } = await supabase
        .from('boss_battles')
        .select('*')
        .eq('user_id', userId)
        .eq('defeated', false)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeErr) throw activeErr;

      // 2. Se não há batalha ativa, precisamos determinar qual é o próximo boss.
      // Buscaremos todas as batalhas derrotadas para ver a sequência.
      const { data: completed, error: completedErr } = await supabase
        .from('boss_battles')
        .select('boss_id')
        .eq('user_id', userId)
        .eq('defeated', true);

      if (completedErr) throw completedErr;

      const completedIds = completed ? completed.map(c => c.boss_id) : [];
      const defeatedBossIds = [...new Set(completedIds)];

      if (active) {
        set({ activeBattle: active, defeatedBossIds, loading: false });
        return;
      }

      // Encontrar o primeiro Boss na sequência de BOSS_LIST que não está na lista de concluídos
      let nextBossDef = BOSS_LIST.find(b => !completedIds.includes(b.id));

      // Se todos foram derrotados, o caçador completou a campanha.
      // Podemos reiniciar ou instanciar o boss final novamente para desafios infinitos (ou reiniciar a lista).
      if (!nextBossDef) {
        // Se já derrotou tudo, reinicia no boss_01 para uma nova jornada de prestígio
        nextBossDef = BOSS_LIST[0];
      }

      // 3. Criar a nova batalha no Supabase
      const newBattleObj = {
        user_id: userId,
        boss_id: nextBossDef.id,
        name: nextBossDef.name,
        title_reward: nextBossDef.titleReward,
        current_hp: nextBossDef.maxHp,
        max_hp: nextBossDef.maxHp,
        defeated: false,
        started_at: new Date().toISOString()
      };

      const { data: created, error: createErr } = await supabase
        .from('boss_battles')
        .insert(newBattleObj)
        .select()
        .single();

      if (createErr) throw createErr;

      set({ activeBattle: created, defeatedBossIds, loading: false });
    } catch (err: any) {
      console.error('[useBossStore] Erro ao carregar/iniciar batalha:', err);
      set({ error: err.message || 'Erro desconhecido', loading: false });
    }
  },

  attackActiveBoss: async (userId: string, baseDamage: number, actionType: string) => {
    if (!get().activeBattle) {
      await get().loadActiveBattle(userId);
    }

    const { activeBattle } = get();
    if (!activeBattle || activeBattle.defeated || activeBattle.current_hp <= 0) return;

    // Encontra a definição estática do Boss para aplicar bônus
    const bossDef = BOSS_LIST.find(b => b.id === activeBattle.boss_id);
    const normalizedActionType = normalizeActionType(actionType);
    const direction = baseDamage < 0 ? -1 : 1;
    let finalDamage = Math.abs(baseDamage);
    let isCritical = false;

    if (bossDef && direction > 0) {
      // Se a categoria da ação bater com a categoria de fraqueza do chefe, aplica dano crítico
      if (normalizedActionType === bossDef.weaknessCategory) {
        finalDamage = Math.round(finalDamage * 2.0); // 2x Dano Crítico
        isCritical = true;
      } else if (
        // Algumas sinergias adicionais de classes ou categorias gerais
        (bossDef.id === 'boss_01' && normalizedActionType === 'task') ||
        (bossDef.id === 'boss_03' && normalizedActionType === 'foco') ||
        (bossDef.id === 'boss_07' && normalizedActionType === 'streak')
      ) {
        finalDamage = Math.round(finalDamage * 1.5);
        isCritical = true;
      }
    }

    // O HP não pode descer abaixo de zero
    finalDamage *= direction;

    const newHp = Math.min(activeBattle.max_hp, Math.max(0, activeBattle.current_hp - finalDamage));
    const actualDamage = activeBattle.current_hp - newHp;

    // Atualiza estado local de forma otimista
    set({
      activeBattle: {
        ...activeBattle,
        current_hp: newHp,
        last_attack_at: new Date().toISOString()
      },
      recentDamage: { damage: actualDamage, isCritical }
    });

    // Limpa o indicador de dano recente após 2 segundos
    setTimeout(() => {
      set({ recentDamage: null });
    }, 2500);

    try {
      // Atualiza o banco de dados de forma silenciosa em background
      await supabase
        .from('boss_battles')
        .update({
          current_hp: newHp,
          last_attack_at: new Date().toISOString()
        })
        .eq('id', activeBattle.id);
    } catch (err) {
      console.error('[useBossStore] Erro ao persistir ataque ao boss:', err);
    }
  },

  purifyActiveBoss: async (userId: string) => {
    const { activeBattle } = get();
    if (!activeBattle || activeBattle.current_hp > 0 || activeBattle.defeated) return;

    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      
      // 1. Atualizar o status da batalha no Supabase para derrotada
      const { error: updateErr } = await supabase
        .from('boss_battles')
        .update({
          defeated: true,
          defeated_at: now
        })
        .eq('id', activeBattle.id);

      if (updateErr) throw updateErr;

      // 2. Encontrar a recompensa definida do Boss
      const bossDef = BOSS_LIST.find(b => b.id === activeBattle.boss_id);
      const xpReward = bossDef ? bossDef.xpReward : 300;
      const titleReward = bossDef ? bossDef.titleReward : 'Vencedor';
      const achievementTitle = bossDef ? bossDef.achievementTitle : `${activeBattle.name} Derrotado`;
      const achievementDescription = bossDef
        ? bossDef.achievementDescription
        : `Purificou o chefe ${activeBattle.name} e conquistou o título "${titleReward}".`;
      const achievementIcon = bossDef ? bossDef.achievementIcon : 'Award';

      // 3. Adicionar uma conquista para desbloquear o título
      const { data: existingAchievement, error: existingAchievementErr } = await supabase
        .from('achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('title', achievementTitle)
        .maybeSingle();

      if (existingAchievementErr) throw existingAchievementErr;

      if (!existingAchievement) {
        const { error: achievementErr } = await supabase
          .from('achievements')
          .insert({
            user_id: userId,
            title: achievementTitle,
            description: achievementDescription,
            icon: achievementIcon,
            unlocked_at: now
          });

        if (achievementErr) throw achievementErr;
      }

      // 4. Conceder XP bônus ao caçador
      const hunterStore = useHunterStore.getState();
      await hunterStore.addXp(xpReward, userId);

      // Opcional: Equipa o novo título automaticamente
      await hunterStore.equipTitle(titleReward, userId);

      // 5. Recarregar batalha ativa, que irá instanciar automaticamente o próximo boss
      set((state) => ({
        activeBattle: null,
        defeatedBossIds: [...new Set([...state.defeatedBossIds, activeBattle.boss_id])]
      }));
      await get().loadActiveBattle(userId);
    } catch (err: any) {
      console.error('[useBossStore] Erro ao purificar boss:', err);
      set({ error: err.message || 'Erro ao purificar o boss', loading: false });
    }
  },

  resetBattle: async (userId: string) => {
    const { activeBattle } = get();
    if (!activeBattle) return;

    set({ loading: true });
    try {
      const { error } = await supabase
        .from('boss_battles')
        .update({
          current_hp: activeBattle.max_hp,
          last_attack_at: null
        })
        .eq('id', activeBattle.id);

      if (error) throw error;

      set({
        activeBattle: {
          ...activeBattle,
          current_hp: activeBattle.max_hp,
          last_attack_at: null
        },
        loading: false
      });
    } catch (err: any) {
      console.error('[useBossStore] Erro ao resetar batalha:', err);
      set({ error: err.message || 'Erro ao resetar batalha', loading: false });
    }
  }
}));

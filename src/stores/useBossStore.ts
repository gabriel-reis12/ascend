import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useHunterStore, onHunterProfileLoaded } from './useHunterStore';

export type RaidLifecycleState =
  | 'waiting_start'
  | 'active_battle'
  | 'boss_defeated'
  | 'expired_loss'
  | 'next_raid';

export interface BossDefinition {
  id: string;
  name: string;
  title: string;
  titleReward: string;
  achievementTitle: string;
  achievementDescription: string;
  achievementIcon: string;
  maxHp: number;
  targetDays: number;
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
  expires_at?: string | null;
  status?: 'active' | 'defeated' | 'expired' | string | null;
  ended_at?: string | null;
}

export interface RaidTimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isExpired: boolean;
  isCritical: boolean; // Menos de 24 horas restantes
  formattedString: string; // Ex: "03d 14h 22m 10s"
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
    maxHp: 160,
    targetDays: 3,
    image: '/optimized/Bosses/O Senhor da Procrastinação.jpg',
    lore: 'Uma entidade gigantesca feita de correntes, relógios quebrados e fumaça negra. Ao seu redor existem centenas de missões abandonadas, projetos inacabados e metas esquecidas.',
    victoryLore: 'Com foco inabalável, você cortou as correntes e destruiu os relógios quebrados. O tempo agora pertence a você. Você se tornou um Executor Implacável!',
    weakness: 'Completar tarefas diárias comuns e quests.',
    weaknessCategory: 'task',
    color: '#8b5cf6', // Roxo
    xpReward: 100,
  },
  {
    id: 'boss_02',
    name: 'O Rei da Preguiça',
    title: 'Boss 02',
    titleReward: 'O Incansável',
    achievementTitle: 'O Rei da Preguiça Derrotado',
    achievementDescription: 'Purificou o Rei da Preguiça',
    achievementIcon: 'Flame',
    maxHp: 210,
    targetDays: 4,
    image: '/optimized/Bosses/O Rei da Preguiça.jpg',
    lore: 'Uma criatura colossal sentada em um trono gigantesco de pedra e lodo. Ela não luta; apenas permanece imóvel. Correntes negras se espalham pelo chão, drenando a energia vital e a motivação de qualquer um que ouse se aproximar.',
    victoryLore: 'Seus treinos intensos e constância física fizeram o trono desmoronar e a letargia se dissipar. Nada pode parar o seu avanço!',
    weakness: 'Concluir treinos na aba Musculação (Workouts).',
    weaknessCategory: 'workout',
    color: '#ef4444', // Vermelho
    xpReward: 130,
  },
  {
    id: 'boss_03',
    name: 'A Sereia da Distração',
    title: 'Boss 03',
    titleReward: 'Mestre do Foco',
    achievementTitle: 'A Sereia da Distração Derrotada',
    achievementDescription: 'Purificou a Sereia da Distração',
    achievementIcon: 'Brain',
    maxHp: 260,
    targetDays: 5,
    image: '/optimized/Bosses/A Sereia da Distração.jpg',
    lore: 'Uma entidade etérea que flutua acima de um oceano digital formado por telas luminosas. Ao seu redor brilham notificações, redes sociais e vídeos curtos. Os caçadores hipnotizados ficam presos olhando para as telas enquanto sua energia vital é sugada.',
    victoryLore: 'Você silenciou o ruído digital e recuperou sua atenção profunda. As luzes vazias não têm mais poder sobre a sua mente.',
    weakness: 'Hábitos e tarefas de Leitura, Estudo e Foco Profundo.',
    weaknessCategory: 'foco',
    color: '#3b82f6', // Azul
    xpReward: 160,
  },
  {
    id: 'boss_04',
    name: 'O Devorador do Progresso',
    title: 'Boss 04',
    titleReward: 'Mestre da Disciplina',
    achievementTitle: 'O Devorador do Progresso Derrotado',
    achievementDescription: 'Purificou o Devorador do Progresso',
    achievementIcon: 'Heart',
    maxHp: 310,
    targetDays: 6,
    image: '/optimized/Bosses/O Devorador do Progresso.jpg',
    lore: 'Uma criatura colossal e insaciável formada por energia escura e fragmentos de excessos, impulsos e gratificação imediata. Ele não destrói os caçadores por combate direto, mas os convence a abandonar seu potencial em troca de prazeres rápidos.',
    victoryLore: 'Sua rotina nutricional perfeita, controle calórico e hidratação enfraqueceram a criatura até que ela ficasse em silêncio. A disciplina é seu novo escudo.',
    weakness: 'Marcar refeições, manter metas nutricionais de calorias/água e sono no horário.',
    weaknessCategory: 'nutrition',
    color: '#10b981', // Verde
    xpReward: 200,
  },
  {
    id: 'boss_05',
    name: 'O Mercador das Dívidas',
    title: 'Boss 05',
    titleReward: 'Guardião da Liberdade',
    achievementTitle: 'O Mercador das Dívidas Derrotado',
    achievementDescription: 'Purificou o Mercador das Dívidas',
    achievementIcon: 'Scale',
    maxHp: 360,
    targetDays: 7,
    image: '/optimized/Bosses/O Mercador das Dívidas.jpg',
    lore: 'Sentado dentro de um mercado dimensional infinito cheio de ouro e armaduras lendárias, o Mercador domina pela sedução. Ele nunca obriga ninguém; ele apenas oferece. Mas atrás de cada item fácil existe uma corrente invisível que prende sua liberdade futura.',
    victoryLore: 'Ao registrar seus gastos e controlar suas compras por impulso, você quebrou o contrato dourado do Mercador e conquistou sua verdadeira liberdade.',
    weakness: 'Hábitos de Finanças, controle de despesas e aportes de investimento.',
    weaknessCategory: 'finance',
    color: '#f59e0b', // Âmbar
    xpReward: 240,
  },
  {
    id: 'boss_06',
    name: 'O Arauto do Caos',
    title: 'Boss 06',
    titleReward: 'Mestre da Clareza',
    achievementTitle: 'O Arauto do Caos Derrotado',
    achievementDescription: 'Purificou o Arauto do Caos',
    achievementIcon: 'Compass',
    maxHp: 410,
    targetDays: 7, // Janela semanal real de até 7 dias
    image: '/optimized/Bosses/O Arauto do Caos.jpg',
    lore: 'Uma catástrofe silenciosa. Ele não ataca com força física, mas transforma toda a sua vida em ruído e confusão. Sob sua influência, as prioridades somem, os planos se misturam e você acorda muito ocupado, mas nunca produtivo.',
    victoryLore: 'Ao definir metas claras, planejar suas semanas e organizar sua rotina, o nevoeiro do Arauto se dissipou. O caminho agora está limpo.',
    weakness: 'Planejamento semanal, metas de prioridade e organização de ambiente.',
    weaknessCategory: 'organization',
    color: '#06b6d4', // Ciano
    xpReward: 300,
  },
  {
    id: 'boss_07',
    name: 'O Reflexo da Autossabotagem',
    title: 'Boss Final',
    titleReward: 'O Purificado',
    achievementTitle: 'O Reflexo da Autossabotagem Purificado',
    achievementDescription: 'Superou a si mesmo e purificou o Reflexo da Autossabotagem',
    achievementIcon: 'Crown',
    maxHp: 500,
    targetDays: 7, // Janela semanal real de até 7 dias
    image: '/optimized/Bosses/O Reflexo da Autossabotagem.jpg',
    lore: 'A origem de todos os males. Após derrotar todos os chefes anteriores, você alcança o último portal e encontra apenas um espelho. Dentro dele está você mesmo: a soma de todas as versões de você que desistiram no passado.',
    victoryLore: 'Ao manter sua consistência e não desistir diante das dificuldades, você purificou a versão mais fraca de si mesmo. O sistema foi totalmente dominado.',
    weakness: 'Manter a consistência diária ativa e streaks consecutivas longas.',
    weaknessCategory: 'streak',
    color: '#ec4899', // Rosa
    xpReward: 400,
  },
];

export const getBossRaidDeadline = (
  battle: Pick<BossBattle, 'started_at' | 'expires_at' | 'boss_id'>,
  targetDaysFallback = 7
): Date => {
  if (battle.expires_at) {
    const parsed = new Date(battle.expires_at);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  const bossDef = BOSS_LIST.find(b => b.id === battle.boss_id);
  const days = Math.min(bossDef?.targetDays ?? targetDaysFallback, 7);
  const startedTime = new Date(battle.started_at).getTime();
  return new Date(startedTime + days * 24 * 60 * 60 * 1000);
};

export const isBattleExpired = (
  battle: Pick<BossBattle, 'started_at' | 'expires_at' | 'boss_id' | 'status'>,
  referenceTime = Date.now()
): boolean => {
  if (battle.status === 'expired') return true;
  const deadline = getBossRaidDeadline(battle);
  return referenceTime >= deadline.getTime();
};

export const getRaidLifecycleState = (
  battle: BossBattle | null | undefined,
  referenceTime = Date.now()
): RaidLifecycleState => {
  if (!battle) return 'waiting_start';
  if (battle.defeated || battle.current_hp <= 0) return 'boss_defeated';
  if (battle.status === 'expired') return 'expired_loss';

  const deadline = getBossRaidDeadline(battle);
  if (referenceTime >= deadline.getTime()) {
    return 'expired_loss';
  }
  return 'active_battle';
};

export const calculateRaidRemainingTime = (
  deadlineToCalculate: Date | string | null | undefined,
  referenceTime = Date.now()
): RaidTimeRemaining => {
  if (!deadlineToCalculate) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isExpired: true,
      isCritical: false,
      formattedString: '00d 00h 00m 00s',
    };
  }

  const deadlineMs = typeof deadlineToCalculate === 'string'
    ? new Date(deadlineToCalculate).getTime()
    : deadlineToCalculate.getTime();
  const diffMs = deadlineMs - referenceTime;

  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isExpired: true,
      isCritical: false,
      formattedString: '00d 00h 00m 00s',
    };
  }

  const seconds = Math.floor((diffMs / 1000) % 60);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isCritical = diffMs < 24 * 60 * 60 * 1000;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedString = `${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diffMs,
    isExpired: false,
    isCritical,
    formattedString,
  };
};

export const formatRaidDeadlineLocal = (
  deadline: Date | string | null | undefined,
  locale = 'pt-BR'
): string => {
  if (!deadline) return '--';
  const date = typeof deadline === 'string' ? new Date(deadline) : deadline;
  return new Intl.DateTimeFormat(locale === 'en-US' ? 'en-US' : 'pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

interface BossStoreState {
  activeBattle: BossBattle | null;
  defeatedBossIds: string[];
  loading: boolean;
  error: string | null;
  recentDamage: { id: string; damage: number; isCritical: boolean } | null;

  loadActiveBattle: (userId: string) => Promise<void>;
  attackActiveBoss: (userId: string, baseDamage: number, actionType: string) => Promise<void>;
  purifyActiveBoss: (userId: string) => Promise<void>;
  resetBattle: () => Promise<void>;
  retryExpiredBattle: (userId: string) => Promise<void>;
  startNextRaid: (userId: string) => Promise<void>;
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

const normalizeCombatDamage = (baseDamage: number) => {
  const magnitude = Math.max(1, Math.abs(baseDamage));
  return Math.max(3, Math.round(Math.sqrt(magnitude) * 1.6));
};

const withTimeout = async <T,>(promise: PromiseLike<T>, label: string, ms = 12000): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} demorou demais para responder.`)), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const safeUpdateBossBattle = async (
  id: string,
  userId: string,
  updates: Record<string, any>
) => {
  try {
    const { data, error } = await supabase
      .from('boss_battles')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (!error) return { data: data as BossBattle | null, error: null };

    // Fallback defensivo para colunas novas (expires_at, status, ended_at) se a migration ainda não foi executada no Supabase
    const errorMsg = (error.message || '').toLowerCase();
    if (
      errorMsg.includes('expires_at') ||
      errorMsg.includes('status') ||
      errorMsg.includes('ended_at') ||
      error.code === 'PGRST204' ||
      error.code === '42703'
    ) {
      const coreUpdates = { ...updates };
      delete coreUpdates.expires_at;
      delete coreUpdates.status;
      delete coreUpdates.ended_at;

      const fallbackRes = await supabase
        .from('boss_battles')
        .update(coreUpdates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      return { data: fallbackRes.data as BossBattle | null, error: fallbackRes.error };
    }

    return { data: null, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
};

const safeInsertBossBattle = async (
  battleObj: Record<string, any>
) => {
  try {
    const { data, error } = await supabase
      .from('boss_battles')
      .insert(battleObj)
      .select()
      .single();

    if (!error) return { data: data as BossBattle | null, error: null };

    const errorMsg = (error.message || '').toLowerCase();
    if (
      errorMsg.includes('expires_at') ||
      errorMsg.includes('status') ||
      errorMsg.includes('ended_at') ||
      error.code === 'PGRST204' ||
      error.code === '42703'
    ) {
      const coreObj = { ...battleObj };
      delete coreObj.expires_at;
      delete coreObj.status;
      delete coreObj.ended_at;

      const fallbackRes = await supabase
        .from('boss_battles')
        .insert(coreObj)
        .select()
        .single();

      return { data: fallbackRes.data as BossBattle | null, error: fallbackRes.error };
    }

    return { data: null, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
};

const persistCombatEvent = (
  userId: string,
  event: { id: string; damage: number; critical: boolean; occurredAt: string; bossName: string }
) => {
  if (typeof window === 'undefined') return;
  const key = `ascend_boss_combat_events_${userId}`;
  try {
    const current = JSON.parse(window.localStorage.getItem(key) || '[]') as typeof event[];
    window.localStorage.setItem(key, JSON.stringify([event, ...current.filter(item => item.id !== event.id)].slice(0, 8)));
  } catch {
    window.localStorage.setItem(key, JSON.stringify([event]));
  }
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
      const { data: active, error: activeErr } = await withTimeout(
        supabase
          .from('boss_battles')
          .select('*')
          .eq('user_id', userId)
          .eq('defeated', false)
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        'A busca da batalha ativa'
      );

      if (activeErr) throw activeErr;

      // 2. Se não há batalha ativa, precisamos determinar qual é o próximo boss.
      // Buscaremos todas as batalhas derrotadas para ver a sequência.
      const { data: completed, error: completedErr } = await withTimeout(
        supabase
          .from('boss_battles')
          .select('boss_id')
          .eq('user_id', userId)
          .eq('defeated', true),
        'A busca dos bosses derrotados'
      );

      if (completedErr) throw completedErr;

      const completedIds = completed ? completed.map(c => c.boss_id) : [];
      const defeatedBossIds = [...new Set(completedIds)];

      if (active) {
        const activeDefinition = BOSS_LIST.find(boss => boss.id === active.boss_id);
        const targetDays = Math.min(activeDefinition?.targetDays ?? 7, 7);
        const deadline = getBossRaidDeadline(active, targetDays);
        const isExpired = Date.now() >= deadline.getTime() && active.current_hp > 0;

        let normalizedBattle: BossBattle = {
          ...active,
          expires_at: active.expires_at || deadline.toISOString(),
          status: isExpired ? 'expired' : active.status || 'active',
        };

        if (activeDefinition && active.current_hp > 0 && active.max_hp !== activeDefinition.maxHp) {
          const remainingRatio = active.max_hp > 0 ? active.current_hp / active.max_hp : 1;
          const scaledCurrentHp = Math.max(1, Math.round(activeDefinition.maxHp * remainingRatio));
          const { data: scaledBattle, error: scaleError } = await safeUpdateBossBattle(
            active.id,
            userId,
            {
              current_hp: scaledCurrentHp,
              max_hp: activeDefinition.maxHp,
            }
          );

          if (!scaleError && scaledBattle) {
            normalizedBattle = {
              ...scaledBattle,
              expires_at: scaledBattle.expires_at || deadline.toISOString(),
              status: isExpired ? 'expired' : scaledBattle.status || 'active',
            };
          }
        }

        set({ activeBattle: normalizedBattle, defeatedBossIds, loading: false });
        return;
      }

      // Encontrar o primeiro Boss na sequência de BOSS_LIST que não está na lista de concluídos
      let nextBossDef = BOSS_LIST.find(b => !completedIds.includes(b.id));

      // Se todos foram derrotados, o caçador completou a campanha: reinicia no boss_01 para nova jornada
      if (!nextBossDef) {
        nextBossDef = BOSS_LIST[0];
      }

      // 3. Criar a nova batalha no Supabase com prazo semanal persistente
      const targetDays = Math.min(nextBossDef.targetDays || 7, 7);
      const now = new Date();
      const startedAt = now.toISOString();
      const expiresAt = new Date(now.getTime() + targetDays * 24 * 60 * 60 * 1000).toISOString();

      const newBattleObj = {
        user_id: userId,
        boss_id: nextBossDef.id,
        name: nextBossDef.name,
        title_reward: nextBossDef.titleReward,
        current_hp: nextBossDef.maxHp,
        max_hp: nextBossDef.maxHp,
        defeated: false,
        started_at: startedAt,
        expires_at: expiresAt,
        status: 'active',
      };

      const { data: created, error: createErr } = await withTimeout(
        safeInsertBossBattle(newBattleObj),
        'A criacao da batalha ativa'
      );

      if (createErr) throw createErr;

      const createdBattle: BossBattle = created || {
        id: `local-${Date.now()}`,
        ...newBattleObj,
        last_attack_at: null,
        defeated_at: null,
        ended_at: null,
      };

      set({ activeBattle: createdBattle, defeatedBossIds, loading: false });
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

    // BLOQUEIO DE PRAZO EXPIRADO:
    // Se o prazo da raid encerrou, rejeita o ataque e não permite aplicar dano.
    if (isBattleExpired(activeBattle)) {
      console.warn('[useBossStore] Ataque rejeitado: o prazo da raid encerrou.');
      set((state) => ({
        activeBattle: state.activeBattle
          ? { ...state.activeBattle, status: 'expired' }
          : null,
      }));
      return;
    }

    // Encontra a definição estática do Boss para aplicar bônus
    const bossDef = BOSS_LIST.find(b => b.id === activeBattle.boss_id);
    const normalizedActionType = normalizeActionType(actionType);
    const direction = baseDamage < 0 ? -1 : 1;
    let finalDamage = normalizeCombatDamage(baseDamage);
    let isCritical = false;

    if (bossDef) {
      // O mesmo multiplicador é usado na reversão para impedir farm ao marcar/desmarcar.
      if (normalizedActionType === bossDef.weaknessCategory) {
        finalDamage = Math.round(finalDamage * 1.75);
        isCritical = direction > 0;
      } else if (
        // Algumas sinergias adicionais de classes ou categorias gerais
        (bossDef.id === 'boss_01' && normalizedActionType === 'task') ||
        (bossDef.id === 'boss_03' && normalizedActionType === 'foco') ||
        (bossDef.id === 'boss_07' && normalizedActionType === 'streak')
      ) {
        finalDamage = Math.round(finalDamage * 1.35);
        isCritical = direction > 0;
      }
    }

    // O HP não pode descer abaixo de zero
    finalDamage *= direction;

    const newHp = Math.min(activeBattle.max_hp, Math.max(0, activeBattle.current_hp - finalDamage));
    const actualDamage = activeBattle.current_hp - newHp;

    if (actualDamage === 0) return;

    const attackTimestamp = new Date().toISOString();

    try {
      // Confirma o ataque no banco de dados antes de emitir o feedback de dano (Req 7.3)
      const { error: updateError } = await safeUpdateBossBattle(
        activeBattle.id,
        userId,
        {
          current_hp: newHp,
          last_attack_at: attackTimestamp,
        }
      );
      if (updateError) throw updateError;

      const damageEventId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      persistCombatEvent(userId, {
        id: damageEventId,
        damage: actualDamage,
        critical: isCritical,
        occurredAt: attackTimestamp,
        bossName: activeBattle.name,
      });

      set({
        activeBattle: {
          ...activeBattle,
          current_hp: newHp,
          last_attack_at: attackTimestamp,
        },
        recentDamage: { id: damageEventId, damage: actualDamage, isCritical }
      });

      // Limpa o indicador de dano recente após 2.5 segundos
      setTimeout(() => {
        if (get().recentDamage?.id === damageEventId) {
          set({ recentDamage: null });
        }
      }, 2500);
    } catch (err) {
      console.error('[useBossStore] Erro ao persistir ataque ao boss:', err);
      set({ error: 'O ataque não pôde ser persistido. Sincronizando novamente...' });
      await get().loadActiveBattle(userId);
    }
  },

  purifyActiveBoss: async (userId: string) => {
    const { activeBattle } = get();
    if (!activeBattle || activeBattle.current_hp > 0 || activeBattle.defeated) return;

    // Batalha expirada sem vitória não pode ser purificada
    if (activeBattle.status === 'expired' && activeBattle.current_hp > 0) return;

    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();

      // 1. Atualizar o status da batalha no Supabase para derrotada (atômico e idempotente)
      const { data: finalizedBattles, error: updateErr } = await supabase
        .from('boss_battles')
        .update({
          defeated: true,
          defeated_at: now,
          status: 'defeated',
          ended_at: now,
        })
        .eq('id', activeBattle.id)
        .eq('user_id', userId)
        .eq('defeated', false)
        .lte('current_hp', 0)
        .select('id');

      if (updateErr) {
        // Fallback defensivo caso colunas status/ended_at ainda não estejam criadas
        const { data: fallbackFinalized, error: fallbackErr } = await supabase
          .from('boss_battles')
          .update({
            defeated: true,
            defeated_at: now,
          })
          .eq('id', activeBattle.id)
          .eq('user_id', userId)
          .eq('defeated', false)
          .lte('current_hp', 0)
          .select('id');

        if (fallbackErr) throw fallbackErr;
        if (!fallbackFinalized?.length) {
          set({ activeBattle: null, loading: false });
          await get().loadActiveBattle(userId);
          return;
        }
      } else if (!finalizedBattles?.length) {
        set({ activeBattle: null, loading: false });
        await get().loadActiveBattle(userId);
        return;
      }

      // 2. Encontrar a recompensa definida do Boss
      const bossDef = BOSS_LIST.find(b => b.id === activeBattle.boss_id);
      const xpReward = bossDef ? bossDef.xpReward : 100;
      const titleReward = bossDef ? bossDef.titleReward : 'Vencedor';
      const achievementTitle = bossDef ? bossDef.achievementTitle : `${activeBattle.name} Derrotado`;
      const achievementDescription = bossDef
        ? bossDef.achievementDescription
        : `Purificou o chefe ${activeBattle.name} e conquistou o título "${titleReward}".`;
      const achievementIcon = bossDef ? bossDef.achievementIcon : 'Award';

      // 3. Adicionar conquista para desbloquear título (idempotente)
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
            unlocked_at: now,
          });

        if (achievementErr) throw achievementErr;
      }

      // 4. Conceder XP bônus ao caçador (idempotente via eventId)
      const hunterStore = useHunterStore.getState();
      await hunterStore.addXp(xpReward, userId, {
        source: 'bonus',
        eventId: `boss:${activeBattle.id}`,
        applyStreakBonus: false,
        checkAchievements: false,
      });

      // Equipa o novo título desbloqueado
      await hunterStore.equipTitle(titleReward, userId);

      // 5. Recarregar batalha ativa, instanciando automaticamente o próximo boss
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

  resetBattle: async () => {
    const { activeBattle } = get();
    if (!activeBattle) return;

    set({ loading: true });
    try {
      const bossDef = BOSS_LIST.find(b => b.id === activeBattle.boss_id);
      const targetDays = Math.min(bossDef?.targetDays ?? 7, 7);
      const now = new Date();
      const startedAt = now.toISOString();
      const expiresAt = new Date(now.getTime() + targetDays * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await safeUpdateBossBattle(
        activeBattle.id,
        activeBattle.user_id,
        {
          current_hp: activeBattle.max_hp,
          last_attack_at: null,
          started_at: startedAt,
          expires_at: expiresAt,
          status: 'active',
          defeated: false,
        }
      );

      if (error) throw error;

      set({
        activeBattle: data || {
          ...activeBattle,
          current_hp: activeBattle.max_hp,
          last_attack_at: null,
          started_at: startedAt,
          expires_at: expiresAt,
          status: 'active',
          defeated: false,
        },
        loading: false
      });
    } catch (err: any) {
      console.error('[useBossStore] Erro ao resetar batalha:', err);
      set({ error: err.message || 'Erro ao resetar batalha', loading: false });
    }
  },

  retryExpiredBattle: async (userId: string) => {
    const { activeBattle } = get();
    if (!activeBattle) return;

    set({ loading: true, error: null });
    try {
      const bossDef = BOSS_LIST.find(b => b.id === activeBattle.boss_id) || BOSS_LIST[0];
      const targetDays = Math.min(bossDef.targetDays || 7, 7);
      const now = new Date();
      const startedAt = now.toISOString();
      const expiresAt = new Date(now.getTime() + targetDays * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await safeUpdateBossBattle(
        activeBattle.id,
        userId,
        {
          current_hp: bossDef.maxHp,
          max_hp: bossDef.maxHp,
          defeated: false,
          started_at: startedAt,
          expires_at: expiresAt,
          status: 'active',
          last_attack_at: null,
          defeated_at: null,
          ended_at: null,
        }
      );

      if (error) throw error;

      set({
        activeBattle: data || {
          ...activeBattle,
          current_hp: bossDef.maxHp,
          max_hp: bossDef.maxHp,
          defeated: false,
          started_at: startedAt,
          expires_at: expiresAt,
          status: 'active',
          last_attack_at: null,
          defeated_at: null,
          ended_at: null,
        },
        loading: false
      });
    } catch (err: any) {
      console.error('[useBossStore] Erro ao reiniciar raid expirada:', err);
      set({ error: err.message || 'Erro ao reiniciar batalha', loading: false });
    }
  },

  startNextRaid: async (userId: string) => {
    set({ loading: true, error: null });
    await get().loadActiveBattle(userId);
  },
}));

onHunterProfileLoaded((userId) => {
  void useBossStore.getState().loadActiveBattle(userId);
});

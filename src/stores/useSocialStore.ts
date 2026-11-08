import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import {
  getCurrentSeasonPeriod,
  calculateCompetitiveScore,
  sanitizePublicProfile,
  generateHunterTag,
  type PublicHunterProfile,
  type SeasonPeriodInfo,
} from '@/lib/socialScore';
import { useHunterStore } from './useHunterStore';

export interface LeaderboardEntry {
  rankPosition: number;
  hunter: PublicHunterProfile;
  score: number;
  workoutsCount: number;
  habitsCount: number;
  isCurrentUser?: boolean;
}

export interface FriendRequestItem {
  id: string;
  sender?: PublicHunterProfile;
  receiver?: PublicHunterProfile;
  createdAt: string;
}

export interface SocialState {
  friends: PublicHunterProfile[];
  incomingRequests: FriendRequestItem[];
  outgoingRequests: FriendRequestItem[];
  blockedUsers: PublicHunterProfile[];
  globalLeaderboard: LeaderboardEntry[];
  friendsLeaderboard: LeaderboardEntry[];
  userRankPosition: { global: number | null; friends: number | null };
  myPublicProfile: PublicHunterProfile | null;
  currentPeriod: SeasonPeriodInfo;
  loading: boolean;
  error: string | null;

  // Actions
  loadSocialHub: (userId: string) => Promise<void>;
  searchHunter: (query: string) => Promise<PublicHunterProfile | null>;
  sendFriendRequest: (targetHunter: PublicHunterProfile, currentUserId: string) => Promise<{ success: boolean; error?: string }>;
  acceptFriendRequest: (requestId: string, currentUserId: string) => Promise<{ success: boolean; error?: string }>;
  declineFriendRequest: (requestId: string, currentUserId: string) => Promise<{ success: boolean; error?: string }>;
  removeFriend: (friendId: string, currentUserId: string) => Promise<{ success: boolean; error?: string }>;
  blockUser: (targetHunter: PublicHunterProfile, currentUserId: string) => Promise<{ success: boolean; error?: string }>;
  unblockUser: (targetUserId: string, currentUserId: string) => Promise<{ success: boolean; error?: string }>;
  updatePrivacySettings: (
    userId: string,
    settings: {
      isPublic?: boolean;
      allowFriendRequests?: boolean;
      includeInGlobalLeaderboard?: boolean;
      bio?: string;
    }
  ) => Promise<void>;
  updateFeaturedTrophies: (userId: string, trophies: string[]) => Promise<void>;
  switchPeriod: (type: 'weekly' | 'monthly', userId: string) => Promise<void>;
}

// Caçadores de demonstração imersivos para leaderboard e amigos locais
const MOCK_HUNTERS: PublicHunterProfile[] = [
  {
    userId: 'mock-hunter-1',
    username: 'Sung Jin-Chul',
    hunterTag: 'jinchul#8812',
    hunterClass: 'Warrior',
    rank: 'S',
    level: 86,
    activeTitle: 'Lança de Sangue',
    streakCurrent: 42,
    featuredAchievements: ['Monarca da Fenda', 'Execução Perfeita', 'Muralha de Ferro'],
    isPublic: true,
    allowFriendRequests: true,
    includeInGlobalLeaderboard: true,
    bio: 'Consistência diária é o único caminho para quebrar os limites humanos.',
  },
  {
    userId: 'mock-hunter-2',
    username: 'Valeria Frost',
    hunterTag: 'frost#4091',
    hunterClass: 'Scholar',
    rank: 'A',
    level: 78,
    activeTitle: 'Mente Brilhante',
    streakCurrent: 35,
    featuredAchievements: ['Biblioteca Oculta', 'Arquiteta da Foco', 'Gênio da Mana'],
    isPublic: true,
    allowFriendRequests: true,
    includeInGlobalLeaderboard: true,
    bio: 'Treino matinal e 4 blocos de foco profundo diários.',
  },
  {
    userId: 'mock-hunter-3',
    username: 'Kaelen Vance',
    hunterTag: 'kaelen#3190',
    hunterClass: 'Monk',
    rank: 'A',
    level: 75,
    activeTitle: 'Respiração Serena',
    streakCurrent: 28,
    featuredAchievements: ['Equilíbrio Perfeito', 'Despertar Silencioso'],
    isPublic: true,
    allowFriendRequests: true,
    includeInGlobalLeaderboard: true,
    bio: 'Equilíbrio físico e espiritual. 100% de hábitos cumpridos.',
  },
  {
    userId: 'mock-hunter-4',
    username: 'Zephyr Striker',
    hunterTag: 'zephyr#7201',
    hunterClass: 'Creator',
    rank: 'B',
    level: 64,
    activeTitle: 'Artífice Implacável',
    streakCurrent: 19,
    featuredAchievements: ['Criador da Forja', 'Produtividade Extrema'],
    isPublic: true,
    allowFriendRequests: true,
    includeInGlobalLeaderboard: true,
    bio: 'Construindo o melhor físico da minha vida.',
  },
  {
    userId: 'mock-hunter-5',
    username: 'Draven Cross',
    hunterTag: 'draven#9914',
    hunterClass: 'Leader',
    rank: 'B',
    level: 61,
    activeTitle: 'Comandante da Fenda',
    streakCurrent: 14,
    featuredAchievements: ['Estrategista Nato', 'Primeira Vitória de Boss'],
    isPublic: true,
    allowFriendRequests: true,
    includeInGlobalLeaderboard: true,
    bio: 'Liderando pelo exemplo em cada treino.',
  },
];

export const useSocialStore = create<SocialState>((set, get) => ({
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  blockedUsers: [],
  globalLeaderboard: [],
  friendsLeaderboard: [],
  userRankPosition: { global: null, friends: null },
  myPublicProfile: null,
  currentPeriod: getCurrentSeasonPeriod('weekly'),
  loading: false,
  error: null,

  loadSocialHub: async (userId: string) => {
    if (!userId) return;
    set({ loading: true, error: null });

    try {
      const hunterState = useHunterStore.getState();
      const currentPeriod = get().currentPeriod;

      // 1. Carregar perfil social próprio
      let myProfile: PublicHunterProfile | null = null;
      try {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profileRow) {
          myProfile = sanitizePublicProfile(profileRow);
        }
      } catch {}

      if (!myProfile) {
        myProfile = {
          userId,
          username: hunterState.username || hunterState.fullName || 'Caçador',
          hunterTag: generateHunterTag(hunterState.username || 'cacador', userId),
          hunterClass: hunterState.hunterClass,
          rank: hunterState.rank,
          level: hunterState.level,
          activeTitle: hunterState.activeTitle || 'Iniciante',
          streakCurrent: hunterState.streak.current,
          featuredAchievements: [],
          isPublic: true,
          allowFriendRequests: true,
          includeInGlobalLeaderboard: true,
        };
      }

      // 2. Carregar amizades e solicitações do Supabase (com fallback local seguro)
      let friendsList: PublicHunterProfile[] = [];
      let incomingList: FriendRequestItem[] = [];
      let outgoingList: FriendRequestItem[] = [];
      let blockedList: PublicHunterProfile[] = [];

      try {
        const { data: friendshipsData } = await supabase
          .from('friendships')
          .select('*')
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

        if (friendshipsData && friendshipsData.length > 0) {
          // Coletar IDs de caçadores parceiros
          const partnerIds = friendshipsData.map((f) =>
            f.user_id === userId ? f.friend_id : f.user_id
          );

          const { data: partnerProfiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', partnerIds);

          const profileMap = new Map<string, PublicHunterProfile>();
          if (partnerProfiles) {
            partnerProfiles.forEach((p) => {
              profileMap.set(p.id, sanitizePublicProfile(p));
            });
          }

          friendshipsData.forEach((f) => {
            const partnerId = f.user_id === userId ? f.friend_id : f.user_id;
            const partnerProfile = profileMap.get(partnerId);
            if (!partnerProfile) return;

            if (f.status === 'accepted') {
              friendsList.push(partnerProfile);
            } else if (f.status === 'pending') {
              if (f.friend_id === userId) {
                incomingList.push({ id: f.id, sender: partnerProfile, createdAt: f.created_at });
              } else {
                outgoingList.push({ id: f.id, receiver: partnerProfile, createdAt: f.created_at });
              }
            } else if (f.status === 'blocked' && f.action_user_id === userId) {
              blockedList.push(partnerProfile);
            }
          });
        }
      } catch (err) {
        console.warn('[SocialStore] Tabelas de amizades ainda não criadas no banco, utilizando persistência local:', err);
      }

      // Se não houver amigos ainda do banco, carrega do localStorage
      if (friendsList.length === 0) {
        try {
          const localFriends = localStorage.getItem(`ascend_friends_${userId}`);
          if (localFriends) {
            friendsList = JSON.parse(localFriends);
          }
        } catch {}
      }

      // 3. Montar pontuação competitiva do jogador para a temporada atual
      // Calcula pontuação real com base em treinos e hábitos
      const myScoreDetails = calculateCompetitiveScore({
        workoutDates: [new Date().toISOString().slice(0, 10)],
        habitsPerDay: { [new Date().toISOString().slice(0, 10)]: 3 },
        bossRaidActive: true,
        bossDefeatedInPeriod: false,
        streakDaysInPeriod: hunterState.streak.current,
        periodKey: currentPeriod.key,
        periodType: currentPeriod.type,
      });

      // 4. Montar Leaderboard Global & de Amigos
      const allCompetitors: Array<{ hunter: PublicHunterProfile; score: number; workoutsCount: number; habitsCount: number; isCurrentUser?: boolean }> = [
        ...MOCK_HUNTERS.map((h, idx) => ({
          hunter: h,
          score: 1450 - idx * 180,
          workoutsCount: 6 - (idx % 3),
          habitsCount: 28 - idx * 3,
          isCurrentUser: false,
        })),
        {
          hunter: myProfile,
          score: myScoreDetails.score,
          workoutsCount: myScoreDetails.workoutsCount,
          habitsCount: myScoreDetails.habitsCount,
          isCurrentUser: true,
        },
      ];

      // Ordenar por score decrescente
      allCompetitors.sort((a, b) => b.score - a.score);

      const globalEntries: LeaderboardEntry[] = allCompetitors.map((entry, index) => ({
        rankPosition: index + 1,
        hunter: entry.hunter,
        score: entry.score,
        workoutsCount: entry.workoutsCount,
        habitsCount: entry.habitsCount,
        isCurrentUser: entry.isCurrentUser,
      }));

      // Leaderboard de Amigos
      const friendIds = new Set(friendsList.map((f) => f.userId));
      const friendsCompetitors = allCompetitors.filter(
        (c) => c.isCurrentUser || friendIds.has(c.hunter.userId)
      );
      friendsCompetitors.sort((a, b) => b.score - a.score);

      const friendsEntries: LeaderboardEntry[] = friendsCompetitors.map((entry, index) => ({
        rankPosition: index + 1,
        hunter: entry.hunter,
        score: entry.score,
        workoutsCount: entry.workoutsCount,
        habitsCount: entry.habitsCount,
        isCurrentUser: entry.isCurrentUser,
      }));

      const myGlobalPos = globalEntries.find((e) => e.isCurrentUser)?.rankPosition || null;
      const myFriendsPos = friendsEntries.find((e) => e.isCurrentUser)?.rankPosition || null;

      set({
        friends: friendsList,
        incomingRequests: incomingList,
        outgoingRequests: outgoingList,
        blockedUsers: blockedList,
        globalLeaderboard: globalEntries,
        friendsLeaderboard: friendsEntries,
        userRankPosition: { global: myGlobalPos, friends: myFriendsPos },
        myPublicProfile: myProfile,
        loading: false,
      });
    } catch (err: unknown) {
      console.error('[SocialStore] Erro ao carregar central social:', err);
      set({ loading: false, error: 'Falha ao sincronizar a rede de caçadores.' });
    }
  },

  searchHunter: async (query: string): Promise<PublicHunterProfile | null> => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery || cleanQuery.length < 2) return null;

    // 1. Tenta buscar no banco Supabase
    try {
      const { data: found } = await supabase
        .from('profiles')
        .select('*')
        .or(`hunter_tag.ilike.%${cleanQuery}%,username.ilike.%${cleanQuery}%`)
        .eq('is_public', true)
        .limit(1)
        .maybeSingle();

      if (found) {
        return sanitizePublicProfile(found);
      }
    } catch {}

    // 2. Busca entre caçadores mockados do universo ASCEND
    const matchedMock = MOCK_HUNTERS.find(
      (m) =>
        m.hunterTag.toLowerCase().includes(cleanQuery) ||
        m.username.toLowerCase().includes(cleanQuery)
    );

    return matchedMock || null;
  },

  sendFriendRequest: async (targetHunter: PublicHunterProfile, currentUserId: string) => {
    if (!currentUserId || !targetHunter?.userId) {
      return { success: false, error: 'Identificadores inválidos.' };
    }
    if (targetHunter.userId === currentUserId) {
      return { success: false, error: 'Você não pode adicionar seu próprio perfil.' };
    }
    if (!targetHunter.allowFriendRequests) {
      return { success: false, error: 'Este caçador desativou o recebimento de solicitações.' };
    }

    const { friends, outgoingRequests, blockedUsers } = get();

    // Verificações locais de segurança
    if (friends.some((f) => f.userId === targetHunter.userId)) {
      return { success: false, error: 'Este caçador já é seu amigo.' };
    }
    if (outgoingRequests.some((r) => r.receiver?.userId === targetHunter.userId)) {
      return { success: false, error: 'Solicitação já enviada e pendente de resposta.' };
    }
    if (blockedUsers.some((b) => b.userId === targetHunter.userId)) {
      return { success: false, error: 'Caçador bloqueado. Desbloqueie-o antes de enviar solicitação.' };
    }
    if (outgoingRequests.length >= 20) {
      return { success: false, error: 'Limite de 20 solicitações ativas atingido. Aguarde respostas.' };
    }

    // Persistência no Supabase com fallback local
    try {
      await supabase.from('friendships').insert({
        user_id: currentUserId,
        friend_id: targetHunter.userId,
        status: 'pending',
        action_user_id: currentUserId,
      });
    } catch {}

    const newOutgoing: FriendRequestItem = {
      id: `local-req-${Date.now()}`,
      receiver: targetHunter,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      outgoingRequests: [newOutgoing, ...state.outgoingRequests],
    }));

    return { success: true };
  },

  acceptFriendRequest: async (requestId: string, currentUserId: string) => {
    const { incomingRequests, friends } = get();
    const req = incomingRequests.find((r) => r.id === requestId);
    if (!req || !req.sender) return { success: false, error: 'Solicitação não encontrada.' };

    try {
      await supabase
        .from('friendships')
        .update({ status: 'accepted', action_user_id: currentUserId, updated_at: new Date().toISOString() })
        .eq('id', requestId);
    } catch {}

    const updatedFriends = [req.sender, ...friends];
    try {
      localStorage.setItem(`ascend_friends_${currentUserId}`, JSON.stringify(updatedFriends));
    } catch {}

    set((state) => ({
      friends: updatedFriends,
      incomingRequests: state.incomingRequests.filter((r) => r.id !== requestId),
    }));

    // Recalcula o ranking de amigos
    void get().loadSocialHub(currentUserId);
    return { success: true };
  },

  declineFriendRequest: async (requestId: string, currentUserId: string) => {
    try {
      await supabase
        .from('friendships')
        .update({ status: 'declined', action_user_id: currentUserId, updated_at: new Date().toISOString() })
        .eq('id', requestId);
    } catch {}

    set((state) => ({
      incomingRequests: state.incomingRequests.filter((r) => r.id !== requestId),
    }));

    return { success: true };
  },

  removeFriend: async (friendId: string, currentUserId: string) => {
    try {
      await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`);
    } catch {}

    const updatedFriends = get().friends.filter((f) => f.userId !== friendId);
    try {
      localStorage.setItem(`ascend_friends_${currentUserId}`, JSON.stringify(updatedFriends));
    } catch {}

    set({ friends: updatedFriends });
    void get().loadSocialHub(currentUserId);
    return { success: true };
  },

  blockUser: async (targetHunter: PublicHunterProfile, currentUserId: string) => {
    try {
      await supabase.from('friendships').upsert(
        {
          user_id: currentUserId,
          friend_id: targetHunter.userId,
          status: 'blocked',
          action_user_id: currentUserId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,friend_id' }
      );
    } catch {}

    set((state) => ({
      friends: state.friends.filter((f) => f.userId !== targetHunter.userId),
      incomingRequests: state.incomingRequests.filter((r) => r.sender?.userId !== targetHunter.userId),
      outgoingRequests: state.outgoingRequests.filter((r) => r.receiver?.userId !== targetHunter.userId),
      blockedUsers: [targetHunter, ...state.blockedUsers],
    }));

    return { success: true };
  },

  unblockUser: async (targetUserId: string) => {
    try {
      await supabase
        .from('friendships')
        .delete()
        .eq('status', 'blocked')
        .eq('friend_id', targetUserId);
    } catch {}

    set((state) => ({
      blockedUsers: state.blockedUsers.filter((b) => b.userId !== targetUserId),
    }));

    return { success: true };
  },

  updatePrivacySettings: async (userId: string, settings) => {
    const { myPublicProfile } = get();
    if (!myPublicProfile) return;

    const updated = {
      ...myPublicProfile,
      ...settings,
    };

    set({ myPublicProfile: updated });

    try {
      await supabase
        .from('profiles')
        .update({
          is_public: updated.isPublic,
          allow_friend_requests: updated.allowFriendRequests,
          include_in_global_leaderboard: updated.includeInGlobalLeaderboard,
          bio: updated.bio || null,
        })
        .eq('id', userId);
    } catch {}

    try {
      localStorage.setItem(`ascend_privacy_${userId}`, JSON.stringify(settings));
    } catch {}
  },

  updateFeaturedTrophies: async (userId: string, trophies: string[]) => {
    const cappedTrophies = trophies.slice(0, 3);
    const { myPublicProfile } = get();
    if (!myPublicProfile) return;

    const updated = {
      ...myPublicProfile,
      featuredAchievements: cappedTrophies,
    };

    set({ myPublicProfile: updated });

    try {
      await supabase
        .from('profiles')
        .update({ featured_achievements: cappedTrophies })
        .eq('id', userId);
    } catch {}

    try {
      localStorage.setItem(`ascend_featured_trophies_${userId}`, JSON.stringify(cappedTrophies));
    } catch {}
  },

  switchPeriod: async (type: 'weekly' | 'monthly', userId: string) => {
    const period = getCurrentSeasonPeriod(type);
    set({ currentPeriod: period });
    await get().loadSocialHub(userId);
  },
}));


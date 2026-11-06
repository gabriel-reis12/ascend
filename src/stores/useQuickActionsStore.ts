import { create } from 'zustand';
import {
  DEFAULT_PINNED_ACTION_IDS,
  MAX_PINNED_ACTIONS,
  MIN_PINNED_ACTIONS,
  QUICK_ACTIONS_CATALOG,
} from '@/lib/quickActionsCatalog';

export interface ActionHistoryEntry {
  id: string;
  timestamp: number;
}

interface QuickActionsState {
  pinnedActionIds: string[];
  showRecentSuggestions: boolean;
  showHunterGuidance: boolean;
  actionHistory: ActionHistoryEntry[];
  currentUserId: string | null;

  // Actions
  initializeForUser: (userId: string | null) => void;
  pinAction: (id: string) => boolean;
  unpinAction: (id: string) => boolean;
  reorderAction: (id: string, direction: 'up' | 'down') => void;
  toggleRecentSuggestions: (show?: boolean) => void;
  toggleHunterGuidance: (show?: boolean) => void;
  recordActionClick: (id: string) => void;
  clearHistory: () => void;
  resetToDefaults: () => void;
}

const STORAGE_PREFIX = 'ascend_quick_actions_';
const HISTORY_PREFIX = 'ascend_action_history_';

function getStorageKey(userId: string | null): string {
  return `${STORAGE_PREFIX}${userId || 'guest'}`;
}

function getHistoryKey(userId: string | null): string {
  return `${HISTORY_PREFIX}${userId || 'guest'}`;
}

interface StoredPreferences {
  pinnedActionIds: string[];
  showRecentSuggestions: boolean;
  showHunterGuidance: boolean;
}

function loadStoredPreferences(userId: string | null): StoredPreferences {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      const validPinned = Array.isArray(parsed.pinnedActionIds)
        ? parsed.pinnedActionIds.filter((id: string) =>
            QUICK_ACTIONS_CATALOG.some((a) => a.id === id)
          )
        : [];

      return {
        pinnedActionIds:
          validPinned.length >= MIN_PINNED_ACTIONS
            ? validPinned.slice(0, MAX_PINNED_ACTIONS)
            : [...DEFAULT_PINNED_ACTION_IDS],
        showRecentSuggestions:
          typeof parsed.showRecentSuggestions === 'boolean'
            ? parsed.showRecentSuggestions
            : true,
        showHunterGuidance:
          typeof parsed.showHunterGuidance === 'boolean'
            ? parsed.showHunterGuidance
            : true,
      };
    }
  } catch (err) {
    console.warn('[useQuickActionsStore] Falha ao ler preferências:', err);
  }

  return {
    pinnedActionIds: [...DEFAULT_PINNED_ACTION_IDS],
    showRecentSuggestions: true,
    showHunterGuidance: true,
  };
}

function loadStoredHistory(userId: string | null): ActionHistoryEntry[] {
  try {
    const raw = localStorage.getItem(getHistoryKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 20);
      }
    }
  } catch {}
  return [];
}

function savePreferences(
  userId: string | null,
  prefs: StoredPreferences
) {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(prefs));
  } catch (err) {
    console.warn('[useQuickActionsStore] Falha ao persistir preferências:', err);
  }
}

function saveHistory(userId: string | null, history: ActionHistoryEntry[]) {
  try {
    localStorage.setItem(getHistoryKey(userId), JSON.stringify(history.slice(0, 20)));
  } catch (err) {
    console.warn('[useQuickActionsStore] Falha ao persistir histórico:', err);
  }
}

export const useQuickActionsStore = create<QuickActionsState>((set, get) => ({
  pinnedActionIds: [...DEFAULT_PINNED_ACTION_IDS],
  showRecentSuggestions: true,
  showHunterGuidance: true,
  actionHistory: [],
  currentUserId: null,

  initializeForUser: (userId: string | null) => {
    const prefs = loadStoredPreferences(userId);
    const history = loadStoredHistory(userId);
    set({
      currentUserId: userId,
      pinnedActionIds: prefs.pinnedActionIds,
      showRecentSuggestions: prefs.showRecentSuggestions,
      showHunterGuidance: prefs.showHunterGuidance,
      actionHistory: history,
    });
  },

  pinAction: (id: string) => {
    const { pinnedActionIds, currentUserId, showRecentSuggestions, showHunterGuidance } = get();
    if (pinnedActionIds.includes(id)) return false;
    if (pinnedActionIds.length >= MAX_PINNED_ACTIONS) return false;

    const next = [...pinnedActionIds, id];
    set({ pinnedActionIds: next });
    savePreferences(currentUserId, {
      pinnedActionIds: next,
      showRecentSuggestions,
      showHunterGuidance,
    });
    return true;
  },

  unpinAction: (id: string) => {
    const { pinnedActionIds, currentUserId, showRecentSuggestions, showHunterGuidance } = get();
    if (pinnedActionIds.length <= MIN_PINNED_ACTIONS) return false;
    const next = pinnedActionIds.filter((actionId) => actionId !== id);
    set({ pinnedActionIds: next });
    savePreferences(currentUserId, {
      pinnedActionIds: next,
      showRecentSuggestions,
      showHunterGuidance,
    });
    return true;
  },

  reorderAction: (id: string, direction: 'up' | 'down') => {
    const { pinnedActionIds, currentUserId, showRecentSuggestions, showHunterGuidance } = get();
    const index = pinnedActionIds.indexOf(id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pinnedActionIds.length) return;

    const next = [...pinnedActionIds];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;

    set({ pinnedActionIds: next });
    savePreferences(currentUserId, {
      pinnedActionIds: next,
      showRecentSuggestions,
      showHunterGuidance,
    });
  },

  toggleRecentSuggestions: (show?: boolean) => {
    const { currentUserId, showRecentSuggestions, pinnedActionIds, showHunterGuidance } = get();
    const nextVal = typeof show === 'boolean' ? show : !showRecentSuggestions;
    set({ showRecentSuggestions: nextVal });
    savePreferences(currentUserId, {
      pinnedActionIds,
      showRecentSuggestions: nextVal,
      showHunterGuidance,
    });
  },

  toggleHunterGuidance: (show?: boolean) => {
    const { currentUserId, showHunterGuidance, pinnedActionIds, showRecentSuggestions } = get();
    const nextVal = typeof show === 'boolean' ? show : !showHunterGuidance;
    set({ showHunterGuidance: nextVal });
    savePreferences(currentUserId, {
      pinnedActionIds,
      showRecentSuggestions,
      showHunterGuidance: nextVal,
    });
  },

  recordActionClick: (id: string) => {
    const { actionHistory, currentUserId } = get();
    const newEntry: ActionHistoryEntry = { id, timestamp: Date.now() };
    const nextHistory = [newEntry, ...actionHistory.filter((h) => h.id !== id)].slice(0, 20);
    set({ actionHistory: nextHistory });
    saveHistory(currentUserId, nextHistory);
  },

  clearHistory: () => {
    const { currentUserId } = get();
    set({ actionHistory: [] });
    saveHistory(currentUserId, []);
  },

  resetToDefaults: () => {
    const { currentUserId } = get();
    const defaults: StoredPreferences = {
      pinnedActionIds: [...DEFAULT_PINNED_ACTION_IDS],
      showRecentSuggestions: true,
      showHunterGuidance: true,
    };
    set({
      pinnedActionIds: defaults.pinnedActionIds,
      showRecentSuggestions: defaults.showRecentSuggestions,
      showHunterGuidance: defaults.showHunterGuidance,
    });
    savePreferences(currentUserId, defaults);
  },
}));


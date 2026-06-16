const VERSION_KEY = 'ascend_app_version';
const PROFILE_SCHEMA_KEY = 'ascend_profile_schema_version';
const PROFILE_SCHEMA_VERSION = '2026-06-16-nutrition-goal-v2';

const LOCAL_CACHE_PREFIXES = [
  'ascend_tasks_',
  'ascend_habits_',
  'ascend_completed_',
  'ascend_workouts_',
  'ascend_meals_',
  'ascend_active_workout_',
  'bonus_quest_lore_',
  'hunter-storage',
];

declare const __APP_VERSION__: string;

function clearLocalAppCaches() {
  if (typeof window === 'undefined') return;

  for (const key of Object.keys(window.localStorage)) {
    if (LOCAL_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      window.localStorage.removeItem(key);
    }
  }
}

async function clearBrowserCaches() {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    const cacheNames = await window.caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.toLowerCase().includes('ascend') || name.toLowerCase().includes('vite'))
        .map((name) => window.caches.delete(name))
    );
  } catch (error) {
    console.warn('[AppVersion] Nao foi possivel limpar Cache API:', error);
  }
}

export function syncAppVersion() {
  if (typeof window === 'undefined') return;

  const currentVersion = __APP_VERSION__;
  const previousVersion = window.localStorage.getItem(VERSION_KEY);
  const previousProfileSchema = window.localStorage.getItem(PROFILE_SCHEMA_KEY);

  if ((previousVersion && previousVersion !== currentVersion) || previousProfileSchema !== PROFILE_SCHEMA_VERSION) {
    clearLocalAppCaches();
    void clearBrowserCaches();
  }

  window.localStorage.setItem(VERSION_KEY, currentVersion);
  window.localStorage.setItem(PROFILE_SCHEMA_KEY, PROFILE_SCHEMA_VERSION);
}

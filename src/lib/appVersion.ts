const VERSION_KEY = 'ascend_app_version';
const PROFILE_SCHEMA_KEY = 'ascend_profile_schema_version';
const PROFILE_SCHEMA_VERSION = '2026-06-22-progression-v3';

declare const __APP_VERSION__: string;

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

  try {
    const currentVersion = __APP_VERSION__;
    const previousVersion = window.localStorage.getItem(VERSION_KEY);
    const previousProfileSchema = window.localStorage.getItem(PROFILE_SCHEMA_KEY);

    if ((previousVersion && previousVersion !== currentVersion) || previousProfileSchema !== PROFILE_SCHEMA_VERSION) {
      // Preserva integralmente os dados no localStorage (hunter-storage, hábitos, missões, sessão)
      // e limpa apenas caches de assets estáticos do navegador (Cache API).
      void clearBrowserCaches();
    }

    window.localStorage.setItem(VERSION_KEY, currentVersion);
    window.localStorage.setItem(PROFILE_SCHEMA_KEY, PROFILE_SCHEMA_VERSION);
  } catch (error) {
    console.warn('[AppVersion] Falha ao sincronizar versao da aplicacao:', error);
  }
}

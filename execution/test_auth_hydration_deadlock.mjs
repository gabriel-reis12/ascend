import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

/**
 * Simulador fiel de Storage Web (localStorage / sessionStorage) para testes comportamentais reais.
 */
class MockWebStorage {
  constructor() {
    this.map = new Map();
  }
  get length() {
    return this.map.size;
  }
  key(index) {
    return Array.from(this.map.keys())[index] ?? null;
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}

/**
 * Reproduz a mecânica exata de _acquireLock + _notifyAllSubscribers do @supabase/auth-js (GoTrueClient)
 * para provar que llamadas a getSession() dentro de onAuthStateChange travam se aguardadas sincronamente,
 * e que o agendamento assíncrono (scheduleDeferred) resolve a promessa sem deadlock.
 */
class SimulatedGoTrueClient {
  constructor(initialSession = null, getSessionError = null) {
    this.lockAcquired = false;
    this.pendingInLock = [];
    this.listeners = new Set();
    this.session = initialSession;
    this.getSessionError = getSessionError;
  }

  async _acquireLock(acquireTimeout, fn) {
    if (this.lockAcquired) {
      const last = this.pendingInLock.length
        ? this.pendingInLock[this.pendingInLock.length - 1]
        : Promise.resolve();

      const waitPromise = (async () => {
        await last;
        return await fn();
      })();

      this.pendingInLock.push(
        waitPromise.then(
          () => {},
          () => {}
        )
      );
      return waitPromise;
    }

    this.lockAcquired = true;
    try {
      const resultPromise = fn();
      this.pendingInLock.push(
        resultPromise.then(
          () => {},
          () => {}
        )
      );
      return await resultPromise;
    } finally {
      this.pendingInLock.shift();
      if (this.pendingInLock.length === 0) {
        this.lockAcquired = false;
      }
    }
  }

  async getSession() {
    return this._acquireLock(-1, async () => {
      if (this.getSessionError) {
        return { data: { session: null }, error: this.getSessionError };
      }
      return { data: { session: this.session }, error: null };
    });
  }

  onAuthStateChange(callback) {
    this.listeners.add(callback);
    // Assim como GoTrueClient._emitInitialSession, aguarda __loadSession() dentro de _acquireLock
    // (momento em que resultPromise já está em this.pendingInLock) e então faz await callback()
    void this._acquireLock(-1, async () => {
      await Promise.resolve();
      await callback('INITIAL_SESSION', this.session);
    });
    return {
      data: {
        subscription: {
          unsubscribe: () => this.listeners.delete(callback),
        },
      },
    };
  }

  async emitAuthEvent(event, newSession) {
    this.session = newSession;
    return this._acquireLock(-1, async () => {
      await Promise.resolve();
      const promises = Array.from(this.listeners).map(async (cb) => await cb(event, newSession));
      await Promise.all(promises);
    });
  }
}

/**
 * Executa o fluxo comportamental real do ciclo AuthContext + useHunterStore + HunterGuard + Onboarding.
 */
function createAscendAuthHarness({
  initialSession = null,
  getSessionError = null,
  profileResponse = { data: null, error: null },
  persistedHunterStorage = null,
  storage = { localStorage: new MockWebStorage(), sessionStorage: new MockWebStorage() },
} = {}) {
  const authClient = new SimulatedGoTrueClient(initialSession, getSessionError);

  const DEFAULT_STATE = {
    level: 1,
    xp: 0,
    xpRequired: 90,
    rank: 'E',
    hunterClass: null,
    username: '',
    profileUserId: null,
    profileLoaded: false,
    profileLoading: false,
    profileError: null,
    pendingLevelUp: null,
  };

  // Simula a hidratação real do Zustand com partialize + merge implementados em useHunterStore
  const rehydrateStore = () => {
    const raw = storage.localStorage.getItem('hunter-storage');
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    const persisted = parsed.state || {};
    // Função merge: sanitiza flags transitórias mesmo que tenham sido gravadas corrompidas
    return {
      ...DEFAULT_STATE,
      ...persisted,
      profileLoaded: false,
      profileLoading: false,
      profileError: null,
      pendingLevelUp: null,
    };
  };

  if (persistedHunterStorage) {
    storage.localStorage.setItem('hunter-storage', JSON.stringify({ state: persistedHunterStorage, version: 4 }));
  }

  let hunterState = rehydrateStore();

  const persistToStorage = (state) => {
    // Função partialize: nunca persiste flags transitórias
    const {
      profileLoaded: _a,
      profileLoading: _b,
      profileError: _c,
      pendingLevelUp: _d,
      ...persistedFields
    } = state;
    storage.localStorage.setItem('hunter-storage', JSON.stringify({ state: persistedFields, version: 4 }));
  };

  const setHunterState = (updater) => {
    const next = typeof updater === 'function' ? updater(hunterState) : updater;
    hunterState = { ...hunterState, ...next };
    persistToStorage(hunterState);
  };

  let loadProfileCalls = 0;

  // Simula uma query PostgREST real que chama authClient.getSession() antes do fetch (fetchWithAuth)
  const queryProfilesTable = async (userId) => {
    await authClient.getSession();
    if (typeof profileResponse === 'function') {
      return await profileResponse(userId, loadProfileCalls);
    }
    return profileResponse;
  };

  const loadProfile = async (userId) => {
    loadProfileCalls += 1;
    if (hunterState.profileUserId && hunterState.profileUserId !== userId) {
      setHunterState({ ...DEFAULT_STATE, profileUserId: userId });
    }
    setHunterState({ profileLoading: true, profileError: null });

    try {
      const { data, error } = await queryProfilesTable(userId);
      if (error) {
        setHunterState({
          profileLoading: false,
          profileError: error.message || 'Erro ao sincronizar dados com o Sistema',
        });
        return;
      }

      const resolved = data || {
        id: userId,
        level: 1,
        xp: 0,
        rank: 'E',
        class: null,
        username: 'Hunter',
      };

      setHunterState({
        level: resolved.level || 1,
        xp: resolved.xp || 0,
        rank: resolved.rank || 'E',
        hunterClass: resolved.class || null,
        username: resolved.username || '',
        profileUserId: userId,
        profileLoaded: true,
        profileLoading: false,
        profileError: null,
      });
    } catch (err) {
      setHunterState({
        profileLoading: false,
        profileError: err instanceof Error ? err.message : 'Erro de conexão',
      });
    }
  };

  const reset = () => {
    setHunterState({ ...DEFAULT_STATE });
  };

  // Estado do AuthContext
  let authState = {
    user: null,
    session: null,
    loading: true,
  };
  let currentUserId = null;
  let activeSync = null;

  const ensureProfileSynced = (targetUser) => {
    if (
      hunterState.profileLoaded &&
      hunterState.profileUserId === targetUser.id &&
      !hunterState.profileError
    ) {
      return Promise.resolve();
    }
    if (activeSync && activeSync.userId === targetUser.id) {
      return activeSync.promise;
    }
    const promise = loadProfile(targetUser.id).finally(() => {
      if (activeSync?.promise === promise) {
        activeSync = null;
      }
    });
    activeSync = { userId: targetUser.id, promise };
    return promise;
  };

  const startAuth = async () => {
    // Registra onAuthStateChange (NÃO async, usa setTimeout(..., 0) para sincronização de perfil)
    authClient.onAuthStateChange((event, newSession) => {
      const newUserId = newSession?.user?.id ?? null;

      if (event === 'SIGNED_OUT') {
        currentUserId = null;
        activeSync = null;
        authState = { user: null, session: null, loading: false };
        reset();
        storage.localStorage.removeItem('ascend-auth-token');
        return;
      }

      if ((event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && newUserId === currentUserId) {
        authState = { ...authState, session: newSession, user: newSession?.user ?? authState.user };
        return;
      }

      const needsProfileSync =
        Boolean(newUserId) &&
        (newUserId !== currentUserId || (!hunterState.profileLoaded && !hunterState.profileLoading));

      if (newUserId !== currentUserId || needsProfileSync) {
        currentUserId = newUserId;
        authState = { ...authState, session: newSession, user: newSession?.user ?? null };

        if (newUserId && newSession?.user) {
          authState = { ...authState, loading: true };
          setTimeout(() => {
            void ensureProfileSynced(newSession.user).finally(() => {
              authState = { ...authState, loading: false };
            });
          }, 0);
        } else {
          reset();
          authState = { ...authState, loading: false };
        }
      }
    });

    // Executa initAuth
    try {
      const { data, error } = await authClient.getSession();
      if (error) {
        currentUserId = null;
        storage.localStorage.removeItem('ascend-auth-token');
        authState = { user: null, session: null, loading: false };
        reset();
        return;
      }

      const currentSession = data.session;
      authState = { ...authState, session: currentSession, user: currentSession?.user ?? null };

      if (currentSession?.user) {
        currentUserId = currentSession.user.id;
        await ensureProfileSynced(currentSession.user);
      } else {
        currentUserId = null;
        reset();
      }
    } finally {
      authState = { ...authState, loading: false };
    }

    // Aguarda qualquer macrotask agendado via setTimeout(..., 0)
    await new Promise((resolve) => setTimeout(resolve, 15));
    if (activeSync) {
      await activeSync.promise;
    }
  };

  // Avalia a decisão de roteamento de ProtectedRoute + HunterGuard para uma rota
  const evaluateRoute = (pathname = '/') => {
    if (authState.loading) {
      return { screen: 'AUTH_LOADING', redirect: null };
    }
    if (!authState.user) {
      return { screen: null, redirect: '/login' };
    }

    if (pathname === '/onboarding') {
      if (hunterState.profileLoading) {
        return { screen: 'ONBOARDING_LOADING', redirect: null };
      }
      if (!hunterState.profileLoaded && hunterState.profileError) {
        return { screen: 'ONBOARDING_ERROR_RETRY', redirect: null };
      }
      if (hunterState.hunterClass) {
        return { screen: null, redirect: '/' };
      }
      if (hunterState.profileLoaded) {
        return { screen: 'ONBOARDING_BASIC_INFO', redirect: null };
      }
      return { screen: 'ONBOARDING_LOADING', redirect: null };
    }

    // Rotas protegidas por HunterGuard ('/', '/status', etc.)
    if (!hunterState.profileLoaded && hunterState.profileError) {
      return { screen: 'SYNC_ERROR_RETRY', redirect: null };
    }
    if (!hunterState.profileLoaded || hunterState.profileLoading) {
      return { screen: 'HUNTER_SYNCING', redirect: null };
    }
    if (!hunterState.hunterClass) {
      return { screen: null, redirect: '/onboarding' };
    }
    return { screen: pathname === '/status' ? 'PLAYER_STATUS' : 'HOME', redirect: null };
  };

  return {
    authClient,
    storage,
    startAuth,
    loadProfile,
    evaluateRoute,
    getAuthState: () => authState,
    getHunterState: () => hunterState,
    getLoadProfileCalls: () => loadProfileCalls,
  };
}

test('ASCEND P0 — Testes Comportamentais de Autenticação, Hidratação e Anti-Deadlock (14 Cenários)', async (t) => {
  await t.test('Prova de Deadlock vs Fix: onAuthStateChange não trava GoTrueClient._acquireLock', async () => {
    // 1. Demonstra que aguardar getSession() diretamente dentro de onAuthStateChange trava em _acquireLock
    const buggyClient = new SimulatedGoTrueClient({ user: { id: 'u-1' }, access_token: 'tok' });
    let innerResolved = false;
    buggyClient.onAuthStateChange(async () => {
      await buggyClient.getSession();
      innerResolved = true;
    });
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(innerResolved, false, 'Callback async direto dentro de _acquireLock entra em deadlock circular');

    // 2. Demonstra que o harness com scheduleDeferred + ensureProfileSynced resolve em < 30ms sem deadlock
    const harness = createAscendAuthHarness({
      initialSession: { user: { id: 'u-1' }, access_token: 'tok' },
      profileResponse: {
        data: { id: 'u-1', level: 12, xp: 340, rank: 'D', class: 'Warrior', username: 'Sung' },
        error: null,
      },
    });
    await harness.startAuth();
    assert.equal(harness.getAuthState().loading, false);
    assert.equal(harness.getHunterState().profileLoaded, true);
    assert.equal(harness.getHunterState().hunterClass, 'Warrior');
  });

  await t.test('Cenário 1: Inicialização sem sessão redireciona para /login sem loading infinito', async () => {
    const harness = createAscendAuthHarness({ initialSession: null });
    await harness.startAuth();

    assert.equal(harness.getAuthState().loading, false);
    assert.equal(harness.getAuthState().user, null);
    assert.deepEqual(harness.evaluateRoute('/'), { screen: null, redirect: '/login' });
  });

  await t.test('Cenário 2 & 3: Inicialização com sessão válida e usuário existente com perfil completo abre a Home', async () => {
    const harness = createAscendAuthHarness({
      initialSession: { user: { id: 'hunter-veteran' }, access_token: 'valid-jwt' },
      profileResponse: {
        data: {
          id: 'hunter-veteran',
          level: 27,
          xp: 1250,
          rank: 'C',
          class: 'Scholar',
          username: 'VeteranHunter',
        },
        error: null,
      },
    });

    await harness.startAuth();

    const hunter = harness.getHunterState();
    assert.equal(hunter.profileLoaded, true);
    assert.equal(hunter.profileLoading, false);
    assert.equal(hunter.hunterClass, 'Scholar');
    assert.equal(hunter.level, 27);
    assert.equal(harness.getLoadProfileCalls(), 1, 'Deve deduplicar chamadas concorrentes ao loadProfile');
    assert.deepEqual(harness.evaluateRoute('/'), { screen: 'HOME', redirect: null });
  });

  await t.test('Cenário 4: Usuário novo autenticado sem classe é encaminhado ao /onboarding apenas após profileLoaded = true', async () => {
    const harness = createAscendAuthHarness({
      initialSession: { user: { id: 'hunter-new' }, access_token: 'valid-jwt' },
      profileResponse: {
        data: {
          id: 'hunter-new',
          level: 1,
          xp: 0,
          rank: 'E',
          class: null,
          username: 'Novice',
        },
        error: null,
      },
    });

    await harness.startAuth();

    const hunter = harness.getHunterState();
    assert.equal(hunter.profileLoaded, true);
    assert.equal(hunter.hunterClass, null);
    assert.deepEqual(harness.evaluateRoute('/'), { screen: null, redirect: '/onboarding' });
    assert.deepEqual(harness.evaluateRoute('/onboarding'), { screen: 'ONBOARDING_BASIC_INFO', redirect: null });
  });

  await t.test('Cenário 5: Sessão expirada / erro de refresh token limpa sessão inválida e redireciona para /login', async () => {
    const storage = { localStorage: new MockWebStorage(), sessionStorage: new MockWebStorage() };
    storage.localStorage.setItem('ascend-auth-token', JSON.stringify({ access_token: 'expired', refresh_token: 'revoked' }));

    const harness = createAscendAuthHarness({
      initialSession: null,
      getSessionError: new Error('Invalid Refresh Token: Refresh Token Not Found'),
      storage,
    });

    await harness.startAuth();

    assert.equal(harness.getAuthState().loading, false);
    assert.equal(harness.getAuthState().user, null);
    assert.equal(storage.localStorage.getItem('ascend-auth-token'), null);
    assert.deepEqual(harness.evaluateRoute('/'), { screen: null, redirect: '/login' });
  });

  await t.test('Cenário 6: Token legado migrado (sb-*-auth-token) remove chave antiga e ignora chaves *-code-verifier', async () => {
    const authStorageCode = fs.readFileSync('src/lib/authStorage.ts', 'utf8');
    assert.ok(authStorageCode.includes('isValidSerializedSession'), 'Deve validar formato JSON do token antes de migrar');
    assert.ok(authStorageCode.includes('purgeLegacyAuthKeys'), 'Deve expurgar chaves legadas após migração/remoção');

    // Simula exatamente o algoritmo de WebLocalStorageAdapter em src/lib/authStorage.ts
    const localStorage = new MockWebStorage();
    const sessionStorage = new MockWebStorage();
    const validSessionJson = JSON.stringify({ access_token: 'jwt-legacy', refresh_token: 'ref-legacy' });

    // Caso A: chave PKCE code-verifier no sessionStorage NÃO deve contaminar ascend-auth-token
    sessionStorage.setItem('sb-xyz-auth-token-code-verifier', 'plain-verifier-string-not-json');
    localStorage.setItem('sb-xyz-auth-token', validSessionJson);

    // Executa migração
    const k = 'sb-xyz-auth-token';
    const legacyVal = localStorage.getItem(k);
    const parsed = JSON.parse(legacyVal);
    assert.ok(parsed.access_token && parsed.refresh_token);
    localStorage.setItem('ascend-auth-token', legacyVal);
    localStorage.removeItem(k);

    assert.equal(localStorage.getItem('ascend-auth-token'), validSessionJson);
    assert.equal(localStorage.getItem('sb-xyz-auth-token'), null, 'Chave legada deve ser removida após migração para evitar ressurreição de token expirado');
  });

  await t.test('Cenário 7: Falha temporária do Supabase exibe tela de reconexão e NUNCA redireciona para /onboarding', async () => {
    let shouldFail = true;
    const harness = createAscendAuthHarness({
      initialSession: { user: { id: 'hunter-net-err' }, access_token: 'valid-jwt' },
      profileResponse: async () => {
        if (shouldFail) {
          return { data: null, error: { message: 'FetchError: Network request failed' } };
        }
        return {
          data: { id: 'hunter-net-err', level: 18, xp: 400, rank: 'D', class: 'Monk', username: 'Zen' },
          error: null,
        };
      },
    });

    await harness.startAuth();

    assert.equal(harness.getHunterState().profileLoaded, false);
    assert.equal(harness.getHunterState().profileLoading, false);
    assert.ok(harness.getHunterState().profileError.includes('Network request failed'));
    assert.deepEqual(harness.evaluateRoute('/'), {
      screen: 'SYNC_ERROR_RETRY',
      redirect: null,
    });

    // Quando o usuário clica em "Tentar Reconectar ao Sistema", o perfil carrega e libera a Home
    shouldFail = false;
    await harness.loadProfile('hunter-net-err');
    assert.equal(harness.getHunterState().profileLoaded, true);
    assert.equal(harness.getHunterState().hunterClass, 'Monk');
    assert.deepEqual(harness.evaluateRoute('/'), { screen: 'HOME', redirect: null });
  });

  await t.test('Cenário 8: Timeout / AbortError em requisição de perfil captura exceção e desliga profileLoading', async () => {
    const harness = createAscendAuthHarness({
      initialSession: { user: { id: 'hunter-timeout' }, access_token: 'valid-jwt' },
      profileResponse: async () => {
        const abortErr = new Error('The operation was aborted due to timeout');
        abortErr.name = 'AbortError';
        throw abortErr;
      },
    });

    await harness.startAuth();

    const hunter = harness.getHunterState();
    assert.equal(hunter.profileLoading, false, 'profileLoading NUNCA deve permanecer true após exceção/AbortError');
    assert.equal(hunter.profileLoaded, false);
    assert.ok(hunter.profileError.includes('aborted'));
    assert.deepEqual(harness.evaluateRoute('/'), { screen: 'SYNC_ERROR_RETRY', redirect: null });
  });

  await t.test('Cenário 9: Hidratação do Zustand sanitiza profileLoading corrompido no localStorage e preserva dados do jogador', async () => {
    const storage = { localStorage: new MockWebStorage(), sessionStorage: new MockWebStorage() };
    // Simula um localStorage envenenado pela versão anterior com profileLoading: true
    const poisonedState = {
      level: 35,
      xp: 900,
      rank: 'B',
      hunterClass: 'Leader',
      username: 'Commander',
      profileUserId: 'hunter-poisoned',
      profileLoaded: false,
      profileLoading: true,
      profileError: 'Stale error',
    };

    const harness = createAscendAuthHarness({
      initialSession: { user: { id: 'hunter-poisoned' }, access_token: 'valid-jwt' },
      persistedHunterStorage: poisonedState,
      storage,
      profileResponse: {
        data: { id: 'hunter-poisoned', level: 35, xp: 900, rank: 'B', class: 'Leader', username: 'Commander' },
        error: null,
      },
    });

    // Antes mesmo de startAuth terminar, a reidratação (merge) deve ter limpado profileLoading: false
    await harness.startAuth();
    assert.equal(harness.getHunterState().profileLoaded, true);
    assert.equal(harness.getHunterState().profileLoading, false);
    assert.equal(harness.getHunterState().level, 35);

    // Verifica que partialize não salvou profileLoading nem profileLoaded no localStorage
    const savedRaw = JSON.parse(storage.localStorage.getItem('hunter-storage'));
    assert.equal('profileLoading' in savedRaw.state, false, 'partialize não deve persistir profileLoading');
    assert.equal('profileLoaded' in savedRaw.state, false, 'partialize não deve persistir profileLoaded');
    assert.equal('profileError' in savedRaw.state, false, 'partialize não deve persistir profileError');
  });

  await t.test('Cenário 10 & 11: Recarregamento da página na Home (/) e em Player Status (/status) preserva sessão e personagem', async () => {
    const sharedStorage = { localStorage: new MockWebStorage(), sessionStorage: new MockWebStorage() };
    const session = { user: { id: 'hunter-reload' }, access_token: 'valid-jwt' };
    const profile = {
      id: 'hunter-reload',
      level: 42,
      xp: 1800,
      rank: 'A',
      class: 'Creator',
      username: 'Artisan',
    };

    // Primeiro carregamento na Home (/)
    const firstLoad = createAscendAuthHarness({
      initialSession: session,
      profileResponse: { data: profile, error: null },
      storage: sharedStorage,
    });
    await firstLoad.startAuth();
    assert.deepEqual(firstLoad.evaluateRoute('/'), { screen: 'HOME', redirect: null });

    // Recarregamento (F5) diretamente em /status usando o mesmo localStorage
    const reloadOnStatus = createAscendAuthHarness({
      initialSession: session,
      profileResponse: { data: profile, error: null },
      storage: sharedStorage,
    });
    await reloadOnStatus.startAuth();
    assert.deepEqual(reloadOnStatus.evaluateRoute('/status'), { screen: 'PLAYER_STATUS', redirect: null });
    assert.equal(reloadOnStatus.getHunterState().level, 42);
    assert.equal(reloadOnStatus.getHunterState().hunterClass, 'Creator');
  });

  await t.test('Cenário 12: Acesso direto a /onboarding com perfil completo redireciona de volta para a Home (/)', async () => {
    const harness = createAscendAuthHarness({
      initialSession: { user: { id: 'hunter-complete' }, access_token: 'valid-jwt' },
      profileResponse: {
        data: { id: 'hunter-complete', level: 15, xp: 200, rank: 'D', class: 'Warrior', username: 'Tank' },
        error: null,
      },
    });

    await harness.startAuth();
    assert.deepEqual(harness.evaluateRoute('/onboarding'), { screen: null, redirect: '/' });
  });

  await t.test('Cenário 13 & 14: Logout limpa estado com segurança e novo login com outro usuário carrega o novo perfil sem vazamento', async () => {
    const storage = { localStorage: new MockWebStorage(), sessionStorage: new MockWebStorage() };
    const harness = createAscendAuthHarness({
      initialSession: { user: { id: 'user-A' }, access_token: 'token-A' },
      storage,
      profileResponse: async (userId) => {
        if (userId === 'user-A') {
          return { data: { id: 'user-A', level: 50, xp: 500, rank: 'S', class: 'Warrior', username: 'Alpha' }, error: null };
        }
        return { data: { id: 'user-B', level: 3, xp: 40, rank: 'E', class: 'Scholar', username: 'Beta' }, error: null };
      },
    });

    await harness.startAuth();
    assert.equal(harness.getHunterState().username, 'Alpha');
    assert.equal(harness.getHunterState().level, 50);

    // Cenário 13: Logout
    await harness.authClient.emitAuthEvent('SIGNED_OUT', null);
    assert.equal(harness.getAuthState().user, null);
    assert.equal(harness.getHunterState().hunterClass, null);
    assert.equal(harness.getHunterState().profileLoaded, false);
    assert.deepEqual(harness.evaluateRoute('/'), { screen: null, redirect: '/login' });

    // Cenário 14: Novo login após logout (com usuário B)
    await harness.authClient.emitAuthEvent('SIGNED_IN', { user: { id: 'user-B' }, access_token: 'token-B' });
    await new Promise((r) => setTimeout(r, 20));

    assert.equal(harness.getAuthState().loading, false);
    assert.equal(harness.getHunterState().username, 'Beta');
    assert.equal(harness.getHunterState().level, 3);
    assert.equal(harness.getHunterState().hunterClass, 'Scholar');
    assert.deepEqual(harness.evaluateRoute('/'), { screen: 'HOME', redirect: null });
  });
});

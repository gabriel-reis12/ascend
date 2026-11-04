import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('ASCEND — Regressão de Autenticação e Onboarding: Validação de Contratos', async (t) => {
  await t.test('HunterGuard em App.tsx deve proteger contra redirecionamento precoce', () => {
    const appContent = fs.readFileSync('src/App.tsx', 'utf8');

    // Deve checar profileLoaded / profileLoading
    assert.ok(
      appContent.includes('profileLoaded') && appContent.includes('profileLoading'),
      'HunterGuard deve inspecionar profileLoaded e profileLoading'
    );

    // Deve exibir estado de sincronização seguro durante carregamento
    assert.ok(
      appContent.includes('Sincronizando Caçador...'),
      'HunterGuard deve renderizar estado de sincronização seguro'
    );

    // Deve exibir tela de reconexão em caso de erro em vez de redirecionar para onboarding
    assert.ok(
      appContent.includes('FALHA DE SINCRONIZAÇÃO') && appContent.includes('Tentar Reconectar ao Sistema'),
      'HunterGuard deve fornecer opção de reconexão em caso de erro sem chutar o usuário para onboarding'
    );
  });

  await t.test('useHunterStore deve rastrear profileLoaded, profileLoading e profileError', () => {
    const storeContent = fs.readFileSync('src/stores/useHunterStore.ts', 'utf8');

    assert.ok(
      storeContent.includes('profileLoaded: boolean') &&
      storeContent.includes('profileLoading: boolean') &&
      storeContent.includes('profileError: string | null'),
      'Interface HunterState deve incluir os campos de estado de perfil'
    );

    assert.ok(
      storeContent.includes('set({ profileLoading: true, profileError: null })'),
      'loadProfile deve marcar profileLoading como true no início'
    );

    assert.ok(
      storeContent.includes('profileLoaded: true'),
      'loadProfile deve marcar profileLoaded como true quando o perfil for recuperado com sucesso'
    );
  });

  await t.test('authStorageAdapter deve conter fallback de migração para tokens legados', () => {
    const storageContent = fs.readFileSync('src/lib/authStorage.ts', 'utf8');

    assert.ok(
      storageContent.includes('ascend-auth-token'),
      'authStorage deve reconhecer ascend-auth-token'
    );

    assert.ok(
      storageContent.includes('sb-') && storageContent.includes('-auth-token'),
      'authStorage deve inspecionar chaves legadas sb-*-auth-token'
    );
  });

  await t.test('Onboarding.tsx não deve avançar prematuramente enquanto o perfil carrega', () => {
    const onboardingContent = fs.readFileSync('src/pages/Onboarding.tsx', 'utf8');

    assert.ok(
      onboardingContent.includes('if (profileLoading) return;'),
      'Onboarding deve aguardar término de profileLoading'
    );

    assert.ok(
      onboardingContent.includes('isSubmitting'),
      'Onboarding deve controlar estado de submissão para evitar múltiplos cliques'
    );
  });
});


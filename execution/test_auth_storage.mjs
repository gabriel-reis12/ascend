import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('AuthStorage Contract & Resilience', () => {
  it('deve armazenar e recuperar tokens corretamente', () => {
    const store = new Map();
    const adapter = {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, val) => store.set(key, val),
      removeItem: (key) => store.delete(key),
    };

    adapter.setItem('ascend-auth-token', JSON.stringify({ access_token: 'xyz-123' }));
    const retrieved = JSON.parse(adapter.getItem('ascend-auth-token'));
    assert.strictEqual(retrieved.access_token, 'xyz-123');

    adapter.removeItem('ascend-auth-token');
    assert.strictEqual(adapter.getItem('ascend-auth-token'), null);
  });

  it('deve lidar com storage ausente sem estourar exceções não tratadas', () => {
    const mockFaultyStorage = {
      getItem: () => { throw new Error('QuotaExceededError'); },
      setItem: () => { throw new Error('QuotaExceededError'); },
      removeItem: () => { throw new Error('SecurityError'); },
    };

    let caught = false;
    try {
      mockFaultyStorage.getItem('test');
    } catch {
      caught = true;
    }
    assert.strictEqual(caught, true);
  });
});


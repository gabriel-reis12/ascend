import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('ASCEND — Remoção Completa de Monetização: Validação de Contratos', async (t) => {
  await t.test('Nenhum componente PremiumGate deve existir no src/', () => {
    assert.strictEqual(
      fs.existsSync('src/components/premium/PremiumGate.tsx'),
      false,
      'src/components/premium/PremiumGate.tsx não deve existir'
    );
    assert.strictEqual(
      fs.existsSync('src/lib/premiumAccess.ts'),
      false,
      'src/lib/premiumAccess.ts não deve existir'
    );
  });

  await t.test('Nenhum arquivo ativo em src/ deve importar PremiumGate ou Stripe SDK', () => {
    const checkDir = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = `${dir}/${item}`;
        if (fs.statSync(fullPath).isDirectory()) {
          checkDir(fullPath);
        } else if (/\.(ts|tsx)$/.test(item)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          assert.strictEqual(
            content.includes('PremiumGate'),
            false,
            `Arquivo ${fullPath} ainda contém referência a PremiumGate`
          );
          assert.strictEqual(
            content.includes('stripe-checkout'),
            false,
            `Arquivo ${fullPath} ainda contém invocação de stripe-checkout`
          );
          assert.strictEqual(
            content.includes('stripe-portal'),
            false,
            `Arquivo ${fullPath} ainda contém invocação de stripe-portal`
          );
        }
      }
    };

    checkDir('src');
  });

  await t.test('Bosses.tsx não deve conter restrições de boss premium', () => {
    const bossesContent = fs.readFileSync('src/pages/Bosses.tsx', 'utf8');
    assert.strictEqual(
      bossesContent.includes('isPremiumBoss'),
      false,
      'Bosses.tsx não deve ter lógica isPremiumBoss'
    );
    assert.strictEqual(
      bossesContent.includes('isPremiumLocked'),
      false,
      'Bosses.tsx não deve ter lógica isPremiumLocked'
    );
  });

  await t.test('Fortuna, Nutrition e Workouts devem estar totalmente desbloqueados', () => {
    const fortunaContent = fs.readFileSync('src/pages/Fortuna.tsx', 'utf8');
    const nutritionContent = fs.readFileSync('src/pages/Nutrition.tsx', 'utf8');
    const workoutsContent = fs.readFileSync('src/pages/Workouts.tsx', 'utf8');

    assert.strictEqual(fortunaContent.includes('<PremiumGate'), false);
    assert.strictEqual(nutritionContent.includes('<PremiumGate'), false);
    assert.strictEqual(workoutsContent.includes('<PremiumGate'), false);
  });

  await t.test('Settings.tsx não deve conter seção de faturamento ou botões Stripe', () => {
    const settingsContent = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
    assert.strictEqual(settingsContent.includes('handleStripeCheckout'), false);
    assert.strictEqual(settingsContent.includes('handleStripePortal'), false);
    assert.strictEqual(settingsContent.includes('CreditCard'), false);
  });

  await t.test('Arquivos obsoletos devem estar preservados na pasta obsoleto/', () => {
    assert.ok(
      fs.existsSync('obsoleto/premium-components/PremiumGate.tsx.bak'),
      'PremiumGate deve estar arquivado em obsoleto/'
    );
    assert.ok(
      fs.existsSync('obsoleto/premium-components/premiumAccess.ts.bak'),
      'premiumAccess deve estar arquivado em obsoleto/'
    );
    assert.ok(
      fs.existsSync('obsoleto/stripe-functions/stripe-checkout/index.ts.bak'),
      'stripe-checkout deve estar arquivado em obsoleto/'
    );
  });
});


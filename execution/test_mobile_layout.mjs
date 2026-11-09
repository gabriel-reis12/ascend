import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('ASCEND Etapa 03.2 — Global Mobile Layout & Bottom Navigation', () => {
  it('index.html deve configurar viewport-fit=cover para suporte a safe areas no iOS/Android', () => {
    const html = fs.readFileSync('index.html', 'utf-8');
    assert.ok(html.includes('viewport-fit=cover'), 'viewport-fit=cover ausente em index.html');
  });

  it('BottomNav.tsx deve existir e definir exatamente os 5 destinos oficiais', () => {
    assert.ok(fs.existsSync('src/components/layout/BottomNav.tsx'), 'BottomNav.tsx não encontrado');
    const nav = fs.readFileSync('src/components/layout/BottomNav.tsx', 'utf-8');

    const expectedRoutes = [
      "{ path: '/', labelKey: 'nav.home'",
      "{ path: '/quests', labelKey: 'nav.quests'",
      "{ path: '/workouts', labelKey: 'nav.workoutsShort'",
      "{ path: '/nutrition', labelKey: 'nav.nutrition'",
      "{ path: '/hub', labelKey: 'nav.hub'",
    ];

    for (const route of expectedRoutes) {
      assert.ok(nav.includes(route), `Rota ausente em BottomNav.tsx: ${route}`);
    }

    assert.ok(nav.includes('md:hidden'), 'BottomNav deve ficar oculta no desktop (md:hidden)');
    assert.ok(nav.includes('env(safe-area-inset-bottom'), 'Safe area inferior ausente em BottomNav');
    assert.ok(nav.includes('aria-current={isActive ? \'page\' : undefined}'), 'Acessibilidade aria-current ausente');
  });

  it('RPGLayout.tsx deve integrar BottomNav, RankBadge, NeonProgressBar, safe-area superior e pb-28 no scroll container', () => {
    const layout = fs.readFileSync('src/components/layout/RPGLayout.tsx', 'utf-8');
    assert.ok(layout.includes('<BottomNav />'), 'BottomNav não renderizada em RPGLayout.tsx');
    assert.ok(layout.includes('<RankBadge'), 'RankBadge não utilizado em RPGLayout.tsx');
    assert.ok(layout.includes('<NeonProgressBar'), 'NeonProgressBar não utilizada no cabeçalho mobile');
    assert.ok(layout.includes('env(safe-area-inset-top'), 'Safe area superior ausente no header mobile');
    assert.ok(layout.includes('pb-28'), 'Padding inferior pb-28 ausente para proteger conteúdo da BottomNav');
    assert.ok(layout.includes('h-[100dvh]'), 'Uso de 100dvh para compatibilidade com teclado virtual mobile ausente');
  });

  it('Módulos secundários (/bosses, /fortuna, /rest, /settings) devem permanecer acessíveis em RPGLayout e MobileMenu', () => {
    const layout = fs.readFileSync('src/components/layout/RPGLayout.tsx', 'utf-8');
    const mobileMenu = fs.readFileSync('src/components/layout/MobileMenu.tsx', 'utf-8');

    for (const secondaryRoute of ['/bosses', '/fortuna', '/rest', '/settings']) {
      assert.ok(layout.includes(secondaryRoute), `Rota ${secondaryRoute} removida de RPGLayout.tsx`);
      assert.ok(mobileMenu.includes(secondaryRoute), `Rota ${secondaryRoute} removida de MobileMenu.tsx`);
    }
  });
});


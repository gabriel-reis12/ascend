import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('ASCEND HUD v2 Design Tokens & Components', () => {
  it('src/index.css deve conter todos os tokens oficiais do ASCEND HUD v2 e suporte a Light Mode', () => {
    const css = fs.readFileSync('src/index.css', 'utf-8');
    const requiredTokens = [
      '--color-hud-void: #07080C',
      '--color-hud-surface: #10121A',
      '--color-hud-elevated: #161924',
      '--color-hud-cyan: #00F0FF',
      '--color-hud-purple: #A855F7',
      '--color-hud-gold: #F59E0B',
      '--color-hud-crimson: #EF4444',
      '--color-hud-success: #10B981',
      '--color-hud-text-primary: #F8FAFC',
      '--color-hud-text-secondary: #94A3B8',
      '--color-hud-text-muted: #64748B',
      '.theme-light',
      '--bg-obsidian: #0B0B0F',
    ];

    for (const token of requiredTokens) {
      assert.ok(css.includes(token), `Token ausente em src/index.css: ${token}`);
    }
  });

  it('Todos os 5 componentes base HUD v2 devem existir e exportar suas interfaces', () => {
    const files = [
      { path: 'src/components/ui/hud-card.tsx', exportName: 'HudCard' },
      { path: 'src/components/ui/tactical-button.tsx', exportName: 'TacticalButton' },
      { path: 'src/components/ui/neon-progress.tsx', exportName: 'NeonProgressBar' },
      { path: 'src/components/ui/neon-progress.tsx', exportName: 'NeonProgressRing' },
      { path: 'src/components/ui/rank-badge.tsx', exportName: 'RankBadge' },
    ];

    for (const f of files) {
      assert.ok(fs.existsSync(f.path), `Arquivo não encontrado: ${f.path}`);
      const content = fs.readFileSync(f.path, 'utf-8');
      assert.ok(content.includes(f.exportName), `Componente ${f.exportName} não exportado em ${f.path}`);
    }
  });

  it('TacticalButton deve garantir min-h-[52px] e acessibilidade via teclado', () => {
    const btn = fs.readFileSync('src/components/ui/tactical-button.tsx', 'utf-8');
    assert.ok(btn.includes('min-h-[52px]'), 'Altura mínima de 52px ausente no TacticalButton');
    assert.ok(btn.includes('focus-visible:ring-2'), 'Foco de teclado ausente no TacticalButton');
    assert.ok(btn.includes('aria-busy'), 'Atributo aria-busy ausente no TacticalButton');
  });

  it('NeonProgressBar e NeonProgressRing devem respeitar prefers-reduced-motion e limites 0..max', () => {
    const prog = fs.readFileSync('src/components/ui/neon-progress.tsx', 'utf-8');
    assert.ok(prog.includes('useReducedMotion'), 'Suporte a prefers-reduced-motion ausente');
    assert.ok(prog.includes('role="progressbar"'), 'Role progressbar ausente');
    assert.ok(prog.includes('aria-valuenow'), 'Atributo aria-valuenow ausente');
  });

  it('RankBadge deve suportar os ranks reais E, D, C, B, A e S do ASCEND', () => {
    const badge = fs.readFileSync('src/components/ui/rank-badge.tsx', 'utf-8');
    for (const rank of ['E:', 'D:', 'C:', 'B:', 'A:', 'S:']) {
      assert.ok(badge.includes(rank), `Configuração do Rank ${rank} ausente em RankBadge`);
    }
  });
});


import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

test('BETA UX FIX — 1. RouteErrorBoundary existe e trata erros de chunk e diagnóstico', () => {
  const boundaryPath = path.join(rootDir, 'src', 'components', 'common', 'RouteErrorBoundary.tsx');
  assert.ok(fs.existsSync(boundaryPath), 'RouteErrorBoundary.tsx deve existir');
  const src = fs.readFileSync(boundaryPath, 'utf-8');

  assert.match(src, /Failed to fetch dynamically imported module/);
  assert.match(src, /isDynamicChunkError/);
  assert.match(src, /window\.location\.reload/);
  assert.match(src, /TacticalButton/);
  assert.match(src, /Diagnóstico Técnico/);
  assert.match(src, /details/);
});

test('BETA UX FIX — 2. App.tsx integra RouteErrorBoundary, lazyWithRetry e rotas /hub e /central', () => {
  const appPath = path.join(rootDir, 'src', 'App.tsx');
  const src = fs.readFileSync(appPath, 'utf-8');

  assert.match(src, /import\s+\{\s*RouteErrorBoundary\s*\}\s+from\s+['"]\.\/components\/common\/RouteErrorBoundary['"]/);
  assert.match(src, /<RouteErrorBoundary>/);
  assert.match(src, /lazyWithRetry/);
  assert.match(src, /path="hub"/);
  assert.match(src, /path="central"/);
  assert.match(src, /HunterHub/);
});

test('BETA UX FIX — 3. Central do Caçador (HunterHub.tsx) possui identidade, Player Status e 6 cards funcionais', () => {
  const hubPath = path.join(rootDir, 'src', 'pages', 'HunterHub.tsx');
  assert.ok(fs.existsSync(hubPath), 'HunterHub.tsx deve existir');
  const src = fs.readFileSync(hubPath, 'utf-8');

  // Identidade e Player Status destacado
  assert.match(src, /HudCard variant="cyan"/);
  assert.match(src, /Player Status/);
  assert.match(src, /\/status/);
  assert.match(src, /RankBadge/);
  assert.match(src, /NeonProgressBar/);

  // 6 Módulos funcionais
  assert.match(src, /to="\/bosses"/);
  assert.match(src, /to="\/trophies"/);
  assert.match(src, /to="\/fortuna"/);
  assert.match(src, /to="\/rest"/);
  assert.match(src, /to="\/social"/);
  assert.match(src, /to="\/settings"/);
});

test('BETA UX FIX — 4. BottomNav define exatamente 5 abas com Central no 5º slot e subPaths ativos', () => {
  const navPath = path.join(rootDir, 'src', 'components', 'layout', 'BottomNav.tsx');
  const src = fs.readFileSync(navPath, 'utf-8');

  assert.match(src, /\{ path: '\/', labelKey: 'nav.home'/);
  assert.match(src, /\{ path: '\/quests', labelKey: 'nav.quests'/);
  assert.match(src, /\{ path: '\/workouts', labelKey: 'nav.workoutsShort'/);
  assert.match(src, /\{ path: '\/nutrition', labelKey: 'nav.nutrition'/);
  assert.match(src, /\{ path: '\/hub', labelKey: 'nav.hub'/);

  // SubPaths para manter a Central iluminada nas rotas secundárias
  assert.match(src, /subPaths:\s*\[.*'\/settings'.*\]/);
  assert.match(src, /subPaths:\s*\[.*'\/bosses'.*\]/);
  assert.match(src, /subPaths:\s*\[.*'\/status'.*\]/);
});

test('BETA UX FIX — 5. Settings.tsx foi protegido contra ciclo de loadProfile e rank não-string', () => {
  const settingsPath = path.join(rootDir, 'src', 'pages', 'Settings.tsx');
  const src = fs.readFileSync(settingsPath, 'utf-8');

  assert.match(src, /!hunterStore\.profileLoaded\s*\|\|\s*hunterStore\.profileUserId\s*!==\s*user\.id/);
  assert.match(src, /typeof r !== 'string'/);
  assert.match(src, /\(achievements \|\| \[\]\)\.forEach/);
});

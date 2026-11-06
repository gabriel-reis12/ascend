import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const fortunaPath = path.join(rootDir, 'src', 'pages', 'Fortuna.tsx');
const restPath = path.join(rootDir, 'src', 'pages', 'Rest.tsx');
const settingsPath = path.join(rootDir, 'src', 'pages', 'Settings.tsx');

const fortunaSource = fs.readFileSync(fortunaPath, 'utf-8');
const restSource = fs.readFileSync(restPath, 'utf-8');
const settingsSource = fs.readFileSync(settingsPath, 'utf-8');

test('Fortuna HUD v2 — 1. Componentes oficiais HUD v2, ergonomia e safe-area', () => {
  assert.match(fortunaSource, /import\s+\{\s*HudCard\s*\}\s+from\s+['"]@\/components\/ui\/hud-card['"]/);
  assert.match(fortunaSource, /import\s+\{\s*TacticalButton\s*\}\s+from\s+['"]@\/components\/ui\/tactical-button['"]/);
  assert.match(fortunaSource, /import\s+\{\s*NeonProgressBar\s*\}\s+from\s+['"]@\/components\/ui\/neon-progress['"]/);
  assert.match(fortunaSource, /<HudCard variant="gold"/);
  assert.match(fortunaSource, /pb-28/);
  assert.match(fortunaSource, /inputMode="decimal"/);
});

test('Fortuna HUD v2 — 2. Modo de privacidade financeira e visibilidade de moeda', () => {
  assert.match(fortunaSource, /ascend_fortuna_privacy_mode/);
  assert.match(fortunaSource, /showValues/);
  assert.match(fortunaSource, /togglePrivacy/);
  assert.match(fortunaSource, /••••••/);
  assert.match(fortunaSource, /formatCurrency/);
});

test('Fortuna HUD v2 — 3. Preservação de contratos, XP (+10), WIS (+1), Boss attack e No-Tx', () => {
  // Transações geram XP e dano de finanças ao Boss
  assert.match(fortunaSource, /hunterStore\.addXp\(xpGained,\s*user\.id/);
  assert.match(fortunaSource, /bossStore\.attackActiveBoss\(user\.id,\s*xpResult\.awardedXp,\s*'finance'\)/);
  // Investimento gera Sabedoria (WIS +1)
  assert.match(fortunaSource, /hunterStore\.updateStat\('wisdom',\s*1,\s*user\.id\)/);
  // Ação rápida sem transações hoje
  assert.match(fortunaSource, /handleNoTransactionsToday/);
  assert.match(fortunaSource, /ascend_finance_no_tx_/);
  // Metas financeiras
  assert.match(fortunaSource, /handleCreateGoal/);
  assert.match(fortunaSource, /handleUpdateGoalProgress/);
});

test('Rest HUD v2 — 4. Componentes oficiais HUD v2, ergonomia e safe-area', () => {
  assert.match(restSource, /import\s+\{\s*HudCard\s*\}\s+from\s+['"]@\/components\/ui\/hud-card['"]/);
  assert.match(restSource, /import\s+\{\s*TacticalButton\s*\}\s+from\s+['"]@\/components\/ui\/tactical-button['"]/);
  assert.match(restSource, /import\s+\{\s*NeonProgressBar\s*\}\s+from\s+['"]@\/components\/ui\/neon-progress['"]/);
  assert.match(restSource, /<HudCard variant="cyan"/);
  assert.match(restSource, /pb-28/);
  assert.match(restSource, /min-h-\[44px\]/);
});

test('Rest HUD v2 — 5. Sono, Lazer e Templo da Mente com preservação de XP, BAL e ataque Estudo', () => {
  // Sono (+20 XP, +2 Equilíbrio)
  assert.match(restSource, /handleLogSleep/);
  assert.match(restSource, /addXp\(20,\s*user\.id/);
  assert.match(restSource, /updateStat\('balance',\s*2,\s*user\.id\)/);
  // Lazer (+15 XP, +1 Equilíbrio)
  assert.match(restSource, /handleLogHobby/);
  assert.match(restSource, /addXp\(15,\s*user\.id/);
  assert.match(restSource, /updateStat\('balance',\s*1,\s*user\.id\)/);
  // Meditação e Respiração Guiada (+15 XP, +2 Equilíbrio)
  assert.match(restSource, /handleCompleteMeditation/);
  assert.match(restSource, /breatheState/);
  assert.match(restSource, /attackActiveBoss\(user\.id,\s*xpResult\.awardedXp,\s*'Estudo'\)/);
});

test('Settings HUD v2 — 6. Componentes oficiais HUD v2, ergonomia e seções agrupadas', () => {
  assert.match(settingsSource, /import\s+\{\s*HudCard\s*\}\s+from\s+['"]@\/components\/ui\/hud-card['"]/);
  assert.match(settingsSource, /import\s+\{\s*TacticalButton\s*\}\s+from\s+['"]@\/components\/ui\/tactical-button['"]/);
  assert.match(settingsSource, /import\s+\{\s*RankBadge\s*\}\s+from\s+['"]@\/components\/ui\/rank-badge['"]/);
  assert.match(settingsSource, /pb-28/);
  assert.match(settingsSource, /inputMode="decimal"/);
  assert.match(settingsSource, /min-h-\[44px\]/);
});

test('Settings HUD v2 — 7. Integração com Trophy Room, títulos ativos e zero monetização/IA residual', () => {
  // Link para o Trophy Room
  assert.match(settingsSource, /to="\/trophies"/);
  assert.match(settingsSource, /Trophy Room/);
  // Equipar título
  assert.match(settingsSource, /hunterStore\.equipTitle\(titleName,\s*user\.id\)/);
  assert.match(settingsSource, /hunterStore\.activeTitle/);
  // Zero resíduos de monetização ou IA
  assert.doesNotMatch(settingsSource, /PremiumGate/);
  assert.doesNotMatch(settingsSource, /stripe/i);
  assert.doesNotMatch(settingsSource, /gemini/i);
  assert.doesNotMatch(settingsSource, /openai/i);
});


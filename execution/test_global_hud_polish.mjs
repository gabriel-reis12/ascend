import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const bossesPath = path.join(rootDir, 'src', 'pages', 'Bosses.tsx');
const dashboardPath = path.join(rootDir, 'src', 'pages', 'Dashboard.tsx');
const questsPath = path.join(rootDir, 'src', 'pages', 'Quests.tsx');
const workoutsPath = path.join(rootDir, 'src', 'pages', 'Workouts.tsx');
const nutritionPath = path.join(rootDir, 'src', 'pages', 'Nutrition.tsx');
const newHabitModalPath = path.join(rootDir, 'src', 'components', 'rpg', 'NewHabitModal.tsx');

const bossesSource = fs.readFileSync(bossesPath, 'utf-8');
const dashboardSource = fs.readFileSync(dashboardPath, 'utf-8');
const questsSource = fs.readFileSync(questsPath, 'utf-8');
const workoutsSource = fs.readFileSync(workoutsPath, 'utf-8');
const nutritionSource = fs.readFileSync(nutritionPath, 'utf-8');
const newHabitModalSource = fs.readFileSync(newHabitModalPath, 'utf-8');

test('Global HUD Polish — Bosses.tsx integrates HudCard, TacticalButton, RankBadge and localized combat events', () => {
  assert.match(bossesSource, /import\s+\{\s*HudCard\s*\}\s+from\s+['"]@\/components\/ui\/hud-card['"]/);
  assert.match(bossesSource, /import\s+\{\s*TacticalButton\s*\}\s+from\s+['"]@\/components\/ui\/tactical-button['"]/);
  assert.match(bossesSource, /import\s+\{\s*RankBadge\s*\}\s+from\s+['"]@\/components\/ui\/rank-badge['"]/);
  assert.match(bossesSource, /<HudCard variant=\{headerCardVariant\}|<HudCard variant="purple"/);
  assert.match(bossesSource, /<TacticalButton/);
  assert.match(bossesSource, /isRaidExpired/);
  // Localized combat event feed
  assert.match(bossesSource, /l\(`Regeneração de \+\$\{Math\.abs\(event\.damage\)\} HP`/);
  assert.match(bossesSource, /l\(`\$\{event\.damage\} de dano aplicado`/);
  assert.match(bossesSource, /l\('CRÍTICO', 'CRITICAL'\)/);
});

test('Global HUD Polish — Dashboard.tsx maintains balanced distribution and eliminates evolution domains redundancy', () => {
  // Balanced vertical distribution without stretching voids
  assert.match(dashboardSource, /contentClassName="flex h-full flex-col justify-center gap-3 sm:gap-4"/);
  // Evolution domains streamlined around milestone rewards and activity sources
  assert.match(dashboardSource, /domain\.nextReward/);
  assert.match(dashboardSource, /domain\.lastGain/);
});

test('Global HUD Polish — Quests.tsx and NewHabitModal.tsx feature cohesive 44px filters and dynamic submit icons', () => {
  // Cohesive filter bar with min-h-[44px] touch targets
  assert.match(questsSource, /min-h-\[44px\]/);
  // Dynamic button icon in NewHabitModal
  assert.match(newHabitModalSource, /isEditing \? <CheckCircle2/);
});

test('Global HUD Polish — Workouts.tsx displays readable multi-line split and flexible buttons', () => {
  assert.match(workoutsSource, /line-clamp-2 text-xs font-semibold leading-relaxed text-slate-200/);
  assert.match(workoutsSource, /min-w-0/);
});

test('Global HUD Polish — Nutrition.tsx displays non-truncated TACO food names and eliminates duplicate plus', () => {
  // TACO food names use line-clamp-2 and break-words for clear identification
  assert.match(nutritionSource, /line-clamp-2.*font-orbitron.*break-words/);
  // Primary CTA button has clean text without redundant plus symbol
  assert.match(nutritionSource, /l\('ADICIONAR ALIMENTO', 'ADD FOOD'\)/);
  assert.doesNotMatch(nutritionSource, /l\('\+ ADICIONAR ALIMENTO', '\+ ADD FOOD'\)/);
});


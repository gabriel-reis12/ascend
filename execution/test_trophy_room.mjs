import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const appPath = path.join(rootDir, 'src', 'App.tsx');
const trophyRoomPath = path.join(rootDir, 'src', 'pages', 'TrophyRoom.tsx');
const dataPath = path.join(rootDir, 'src', 'lib', 'achievementsData.ts');
const dashboardPath = path.join(rootDir, 'src', 'pages', 'Dashboard.tsx');
const settingsPath = path.join(rootDir, 'src', 'pages', 'Settings.tsx');
const layoutPath = path.join(rootDir, 'src', 'components', 'layout', 'RPGLayout.tsx');
const mobileMenuPath = path.join(rootDir, 'src', 'components', 'layout', 'MobileMenu.tsx');
const bottomNavPath = path.join(rootDir, 'src', 'components', 'layout', 'BottomNav.tsx');

const appSource = fs.readFileSync(appPath, 'utf-8');
const trophyRoomSource = fs.readFileSync(trophyRoomPath, 'utf-8');
const dataSource = fs.readFileSync(dataPath, 'utf-8');
const dashboardSource = fs.readFileSync(dashboardPath, 'utf-8');
const settingsSource = fs.readFileSync(settingsPath, 'utf-8');
const layoutSource = fs.readFileSync(layoutPath, 'utf-8');
const mobileMenuSource = fs.readFileSync(mobileMenuPath, 'utf-8');
const bottomNavSource = fs.readFileSync(bottomNavPath, 'utf-8');

test('Etapa 03.9 — 1. Rota dedicada /trophies e nome oficial ASCEND TROPHY ROOM', () => {
  // Rota no App.tsx
  assert.match(appSource, /<Route\s+path="trophies"\s+element=\{<TrophyRoom\s*\/>\}\s*\/>/);
  assert.match(appSource, /import\s+\{\s*TrophyRoom\s*\}\s+from\s+['"]\.\/pages\/TrophyRoom['"]/);

  // Nome oficial e título na página
  assert.match(trophyRoomSource, /ASCEND TROPHY ROOM/);
  assert.match(trophyRoomSource, /l\('Salão de Conquistas & Troféus', 'Hall of Trophies & Honors'\)/);
});

test('Etapa 03.9 — 2. Catálogo centralizado de Conquistas e Títulos reais (src/lib/achievementsData.ts)', () => {
  assert.match(dataSource, /export const ALL_POSSIBLE_ACHIEVEMENTS/);
  assert.match(dataSource, /export const ALL_PRESTIGE_TITLES/);
  assert.match(dataSource, /export const EN_ACHIEVEMENT_COPY/);
  assert.match(dataSource, /export const EN_TITLE_COPY/);

  // Validação dos 18 feitos reais (Streaks 3d, 7d, 15d, 30d; 7 stats; 7 bosses)
  assert.match(dataSource, /key:\s*'3d'/);
  assert.match(dataSource, /key:\s*'30d'/);
  assert.match(dataSource, /key:\s*'strength'/);
  assert.match(dataSource, /key:\s*'balance'/);
  assert.match(dataSource, /key:\s*'boss_01'/);
  assert.match(dataSource, /key:\s*'boss_07'/);

  // Validação dos 19 títulos oficiais do ASCEND
  assert.match(dataSource, /name:\s*'Iniciante'/);
  assert.match(dataSource, /name:\s*'Constante'/);
  assert.match(dataSource, /name:\s*'Monarca da Rotina'/);
  assert.match(dataSource, /name:\s*'Executor Implacável'/);
  assert.match(dataSource, /name:\s*'O Purificado'/);
});

test('Etapa 03.9 — 3. Galeria de Conquistas com estados de desbloqueio, XP e títulos concedidos', () => {
  // Consumo das 18 conquistas reais
  assert.match(trophyRoomSource, /ALL_POSSIBLE_ACHIEVEMENTS/);
  assert.match(trophyRoomSource, /unlockedAchievements/);

  // Apresentação de estados: Conquistada vs Bloqueada
  assert.match(trophyRoomSource, /l\('CONQUISTADA', 'UNLOCKED'\)/);
  assert.match(trophyRoomSource, /l\('BLOQUEADA', 'LOCKED'\)/);

  // Recompensas reais (+XP e Título)
  assert.match(trophyRoomSource, /\+\{item\.xp\} XP/);
  assert.match(trophyRoomSource, /item\.titleReward/);
});

test('Etapa 03.9 — 4. Salão de Títulos com seleção, estado equipado e persistência existente', () => {
  // Lista de títulos e verificação de equipado
  assert.match(trophyRoomSource, /ALL_PRESTIGE_TITLES/);
  assert.match(trophyRoomSource, /hunterStore\.activeTitle/);
  assert.match(trophyRoomSource, /l\('Título Atualmente Equipado', 'Currently Equipped Title'\)/);

  // Ação de equipar título reutilizando useHunterStore.equipTitle
  assert.match(trophyRoomSource, /hunterStore\.equipTitle\(titleName,\s*user\.id\)/);
  assert.match(trophyRoomSource, /handleEquipTitle\(title\.name\)/);
  assert.match(trophyRoomSource, /l\('Equipar Título', 'Equip Title'\)/);
  assert.match(trophyRoomSource, /l\('ATIVO NO PERFIL', 'ACTIVE ON PROFILE'\)/);
});

test('Etapa 03.9 — 5. Troféus de Raid com arte original, estados de vitória e sem duplicação', () => {
  assert.match(trophyRoomSource, /BOSS_LIST/);
  assert.match(trophyRoomSource, /boss\.image/);
  assert.match(trophyRoomSource, /boss\.victoryLore/);

  // Estados de vitória e combate
  assert.match(trophyRoomSource, /l\('PURIFICADO', 'PURIFIED'\)/);
  assert.match(trophyRoomSource, /l\('EM COMBATE', 'IN BATTLE'\)/);
  assert.match(trophyRoomSource, /l\('SELADO', 'SEALED'\)/);
});

test('Etapa 03.9 — 6. Navegação integrada em pontos coerentes sem adicionar 6ª aba na BottomNav', () => {
  // Acesso via Player Status (/status)
  assert.match(dashboardSource, /to="\/trophies"/);
  assert.match(dashboardSource, /l\('Salão de Troféus', 'Trophy Room'\)/);

  // Acesso via Ajustes (/settings)
  assert.match(settingsSource, /to="\/trophies"/);

  // Acesso via Desktop Sidebar (RPGLayout) e MobileMenu
  assert.match(layoutSource, /path:\s*'\/trophies'/);
  assert.match(mobileMenuSource, /path:\s*'\/trophies'/);

  // Bottom Navigation preserva ESTRITAMENTE as 5 abas oficiais (sem 6ª aba)
  assert.doesNotMatch(bottomNavSource, /path:\s*'\/trophies'/);
  assert.match(bottomNavSource, /grid-cols-5/);
});

test('Etapa 03.9 — 7. Padrão ASCEND HUD v2, ergonomia mobile e safe-area inferior (pb-28)', () => {
  assert.match(trophyRoomSource, /<HudCard/);
  assert.match(trophyRoomSource, /<TacticalButton/);
  assert.match(trophyRoomSource, /<NeonProgressBar/);
  assert.match(trophyRoomSource, /<RankBadge/);
  assert.match(trophyRoomSource, /pb-28/);
  assert.match(trophyRoomSource, /min-h-\[44px\]/);
});

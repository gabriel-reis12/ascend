import fs from 'node:fs';
import path from 'node:path';
import { translateUiText } from '../src/lib/uiEnglish.ts';

const root = process.cwd();
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');
const failures = [];

const requireText = (file, snippets) => {
  const content = read(file);
  for (const snippet of snippets) {
    if (!content.includes(snippet)) failures.push(`${file}: missing ${snippet}`);
  }
};

requireText('src/App.tsx', ['<LocalizationBridge />']);
requireText('src/components/ui/hunter-login.tsx', ['<LanguageSwitcher compact />', "usePreferences()"]);
requireText('src/pages/Onboarding.tsx', ['QUESTIONS_EN', 'RANK_DESCRIPTIONS_EN', '<LanguageSwitcher']);
requireText('src/components/rpg/ProductTour.tsx', ['COMMAND PORTAL', 'HUNTER ASCENSION']);
requireText('src/components/layout/RPGLayout.tsx', ['<LanguageSwitcher compact />']);

const routedScreens = [
  'src/pages/Dashboard.tsx',
  'src/pages/Quests.tsx',
  'src/pages/Workouts.tsx',
  'src/pages/Nutrition.tsx',
  'src/pages/Fortuna.tsx',
  'src/pages/Bosses.tsx',
  'src/pages/Rest.tsx',
  'src/pages/Settings.tsx',
  'src/pages/QuickMenu.tsx',
];

for (const screen of routedScreens) {
  const content = read(screen);
  if (/toLocale(?:Date|Time|String)\('pt-BR'/.test(content)) {
    failures.push(`${screen}: hardcoded pt-BR locale`);
  }
}

const samples = [
  ['Nova Missão', 'New Quest'],
  ['Treino concluído', 'Workout completed'],
  ['Registrar Transação', 'Log Transaction'],
  ['Estado de equilíbrio', 'Balance state'],
  ['Buscar suprimentos nutricionais...', 'Search nutritional supplies...'],
  ['Acessar módulo', 'Open module'],
  ['refeição(ões) definida(s)', 'meal(s) defined'],
  ['Crie suas refeições para que apareçam como missões diárias.', 'Create meals so they appear as daily quests.'],
  ['Missão Flexível / Opcional', 'Flexible / Optional quest'],
  ['Supino Reto com Barra', 'Barbell Bench Press'],
  ['C - Legs (Pernas)', 'C - Legs'],
  ['Força Base 3x', 'Base Strength 3x'],
  ['O Senhor da Procrastinação', 'The Lord of Procrastination'],
  ['Recompensas da Purificação', 'Purification Rewards'],
  ['Ganhos do Mês', 'Income This Month'],
  ['Templo do Silêncio', 'Temple of Silence'],
  ['Selecionar idioma', 'Select language'],
  ['Confirmar Senha', 'Confirm Password'],
];

for (const [portuguese, english] of samples) {
  const actual = translateUiText(portuguese);
  if (actual !== english) failures.push(`translation mismatch: "${portuguese}" -> "${actual}"`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('localization audit: ok');

import fs from 'node:fs';

// 1. Atualizar QuickMenu.tsx
const quickMenuPath = 'src/pages/QuickMenu.tsx';
let quickMenu = fs.readFileSync(quickMenuPath, 'utf-8');
quickMenu = quickMenu.replace(
  'Gerencie hábitos, tarefas e quests bônus da IA.',
  'Gerencie hábitos, tarefas e quests bônus diárias.'
);
quickMenu = quickMenu.replace(
  'Manage habits, tasks, and AI-generated bonus quests.',
  'Manage habits, tasks, and daily bonus quests.'
);
fs.writeFileSync(quickMenuPath, quickMenu, 'utf-8');
console.log('QuickMenu.tsx atualizado com sucesso!');

// 2. Atualizar Settings.tsx
const settingsPath = 'src/pages/Settings.tsx';
let settings = fs.readFileSync(settingsPath, 'utf-8');
settings = settings.replace(
  "{l('Você possui acesso ilimitado a todos os portais, fendas e IA do Sistema.', 'You have unlimited access to all system portals, rifts, and AI.')}",
  "{l('Você possui acesso ilimitado a todos os portais, fendas e recursos do Sistema.', 'You have unlimited access to all system portals, rifts, and features.')}"
);
settings = settings.replace(
  "{l('Desbloqueie fendas Rank S, IA nutricional e ferramentas de finanças.', 'Unlock Rank S rifts, nutrition AI, and financial tools.')}",
  "{l('Desbloqueie fendas Rank S, análise nutricional avançada e ferramentas de finanças.', 'Unlock Rank S rifts, advanced nutrition analysis, and financial tools.')}"
);
fs.writeFileSync(settingsPath, settings, 'utf-8');
console.log('Settings.tsx atualizado com sucesso!');

// 3. Atualizar uiEnglish.ts
const uiEnglishPath = 'src/lib/uiEnglish.ts';
let uiEnglish = fs.readFileSync(uiEnglishPath, 'utf-8');
uiEnglish = uiEnglish.replace(
  "'Gerencie hábitos, tarefas e quests bônus da IA.': 'Manage habits, tasks, and AI bonus quests.',",
  "'Gerencie hábitos, tarefas e quests bônus diárias.': 'Manage habits, tasks, and daily bonus quests.',"
);
uiEnglish = uiEnglish.replace(
  "'Bônus IA': 'AI Bonus',",
  "'Bônus': 'Bonus',"
);
fs.writeFileSync(uiEnglishPath, uiEnglish, 'utf-8');
console.log('uiEnglish.ts atualizado com sucesso!');


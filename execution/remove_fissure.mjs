import fs from 'node:fs';

const filePath = 'src/pages/Quests.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Remover import de bonusQuests
content = content.replace("import { generateBonusQuest } from '@/lib/bonusQuests';\n", "");
content = content.replace("import { generateBonusQuest } from '@/lib/bonusQuests';", "");

// 2. Remover estados de Fenda e bônus
content = content.replace("  const [fissureExpanded, setFissureExpanded] = useState(false);\n", "");
content = content.replace("  const [fissureExpanded, setFissureExpanded] = useState(false);", "");

const stateBlockRegex = /  const \[selectedCategory, setSelectedCategory\] = useState<string>\('Estudo'\);\s*const \[generatingBonus, setGeneratingBonus\] = useState<boolean>\(false\);\s*const \[bonusError, setBonusError\] = useState<string \| null>\(null\);/g;
content = content.replace(stateBlockRegex, "");

// 3. Remover handleAwakenBonusQuest e bonusQuestToday
const handleAwakenRegex = /\s*\/\/ Busca se já gerou a quest extra diária[\s\S]*?finally\s*\{\s*setGeneratingBonus\(false\);\s*\}\s*\};/g;
content = content.replace(handleAwakenRegex, "");

// 4. Remover widget JSX da Fenda de Anomalia
const fissureWidgetRegex = /\s*\{\/\* FENDA DE ANOMALIA DA IA \(WIDGET PREMIUM\) \*\/\}[\s\S]*?<\/AnimatePresence>\s*<\/div>\s*<\/div>/g;
content = content.replace(fissureWidgetRegex, "");

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Quests.tsx limpo com sucesso!');


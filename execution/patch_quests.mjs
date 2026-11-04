import fs from 'node:fs';

const filePath = 'src/pages/Quests.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Substituir busca de bônus diário
content = content.replace(
  "const bonusQuestToday = tasks.find(t => t.title.startsWith('[BÔNUS IA] ') && isToday(t.created_at));",
  "const bonusQuestToday = tasks.find(t => (t.title.startsWith('[BÔNUS] ') || t.title.startsWith('[BÔNUS IA] ')) && isToday(t.created_at));"
);

// 2. Substituir chamada assíncrona por síncrona determinística
content = content.replace(
  "const result = await generateBonusQuest(selectedCategory, existingTitles, hunterClass || 'Warrior');",
  "const result = generateBonusQuest(selectedCategory, existingTitles, hunterClass || 'Warrior');"
);

// 3. Substituir título salvo
content = content.replace(
  "title: `[BÔNUS IA] ${result.title}`,",
  "title: `[BÔNUS] ${result.title}`,"
);

// 4. Substituir mensagem de erro
content = content.replace(
  "setBonusError(err instanceof Error ? err.message : 'Falha na conexão neural com o Groq.');",
  "setBonusError(err instanceof Error ? err.message : 'Falha ao sintonizar com a Fenda do Sistema.');"
);

// 5. Substituir identificação isBonus
content = content.replace(
  "const isBonus = type === 'task' && title.startsWith('[BÔNUS IA] ');",
  "const isBonus = type === 'task' && (title.startsWith('[BÔNUS] ') || title.startsWith('[BÔNUS IA] '));"
);

// 6. Substituir strip do displayTitle
content = content.replace(
  "const displayTitle = isBonus ? title.replace('[BÔNUS IA] ', '') : title;",
  "const displayTitle = isBonus ? title.replace(/^\\[BÔNUS( IA)?\\]\\s*/, '') : title;"
);

// 7. Substituir badge 'Bônus IA'
content = content.replace(
  ">Bônus IA</span>",
  ">Bônus</span>"
);

// 8. Substituir título na próxima missão
content = content.replace(
  "nextMission.data.title.replace('[BÔNUS IA] ', '')",
  "nextMission.data.title.replace(/^\\[BÔNUS( IA)?\\]\\s*/, '')"
);

// 9. Substituir header da Fenda
content = content.replace(
  "{l('Fenda de Anomalia', 'Anomaly Gate')} <span className=\"text-cyan-400\">{l('IA', 'AI')}</span>",
  "{l('Fenda de Anomalia', 'Anomaly Gate')}"
);

// 10. Substituir aria-label
content = content.replace(
  "aria-label={fissureExpanded ? l('Recolher Fenda IA', 'Collapse AI Gate') : l('Expandir Fenda IA', 'Expand AI Gate')}",
  "aria-label={fissureExpanded ? l('Recolher Fenda', 'Collapse Gate') : l('Expandir Fenda', 'Expand Gate')}"
);

// 11. Substituir exibição do título de hoje
content = content.replace(
  "{bonusQuestToday.title.replace('[BÔNUS IA] ', '')}",
  "{bonusQuestToday.title.replace(/^\\[BÔNUS( IA)?\\]\\s*/, '')}"
);

// 12. Substituir texto de descrição do Llama IA
content = content.replace(
  "Escolha um dos seus focos de evolução abaixo para recalibrar o Sistema. O Llama IA gerará uma missão bônus temporária única de altíssimo rendimento para a sua rotina de hoje.",
  "Escolha um dos seus focos de evolução abaixo para sintonizar a Fenda. O Sistema calibrará uma missão bônus temporária única de alto rendimento para a sua rotina de hoje."
);

// 13. Substituir texto do botão
content = content.replace(
  "CALIBRANDO MATRIX...",
  "CALIBRANDO FENDA..."
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Quests.tsx atualizado com sucesso!');


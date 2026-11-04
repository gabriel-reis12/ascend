import fs from 'node:fs';

const filePath = 'src/contexts/preferences.ts';
let content = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');

if (!content.includes("'nav.home'")) {
  content = content.replace(
    "  'nav.portal': { 'pt-BR': 'Portal', 'en-US': 'Portal' },",
    "  'nav.portal': { 'pt-BR': 'Portal', 'en-US': 'Portal' },\n  'nav.home': { 'pt-BR': 'Início', 'en-US': 'Home' },\n  'nav.workoutsShort': { 'pt-BR': 'Treinos', 'en-US': 'Training' },"
  );
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('preferences.ts atualizado com nav.home e nav.workoutsShort!');


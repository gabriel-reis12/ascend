import fs from 'node:fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');

if (!content.includes("import { HudPreview } from './pages/HudPreview';")) {
  content = content.replace(
    "import { LocalizationBridge } from './components/preferences/LocalizationBridge';",
    "import { LocalizationBridge } from './components/preferences/LocalizationBridge';\nimport { HudPreview } from './pages/HudPreview';"
  );
}

if (!content.includes('path="/dev/hud"')) {
  content = content.replace(
    '<Route path="/register" element={<RegisterPage />} />',
    '<Route path="/register" element={<RegisterPage />} />\n          {import.meta.env.DEV && <Route path="/dev/hud" element={<HudPreview />} />}'
  );
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('App.tsx atualizado com rota /dev/hud apenas em DEV.');


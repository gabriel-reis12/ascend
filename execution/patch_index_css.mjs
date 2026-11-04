import fs from 'node:fs';

const filePath = 'src/index.css';
let css = fs.readFileSync(filePath, 'utf-8');

const oldBlock = `/* ── Design Tokens ── */
@theme {
  --color-obsidian: #0B0B0F;
  --color-graphite: #1A1C22;
  --color-silver: #C9CED6;
  --color-ascend-blue: #3B82F6;
  --color-royal-purple: #7C3AED;
}

:root {
  --bg-obsidian: #0B0B0F;
  --bg-graphite: #1A1C22;
  --surface-primary: #0F0F13;
  --surface-secondary: #15151B;
  --surface-muted: rgba(255, 255, 255, 0.05);
  --surface-input: rgba(0, 0, 0, 0.4);
  --border-subtle: #1E1E26;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #64748b;
  --text-silver: #C9CED6;
  --ascend-blue: #3B82F6;
  --royal-purple: #7C3AED;
  --font-orbitron: 'Orbitron', sans-serif;
  --font-inter: 'Inter', sans-serif;
}

.theme-light {
  --bg-obsidian: #f3f6fb;
  --bg-graphite: #e2e8f0;
  --surface-primary: #ffffff;
  --surface-secondary: #f8fafc;
  --surface-muted: rgba(226, 232, 240, 0.72);
  --surface-input: #eef3f9;
  --border-subtle: #d7e0ec;
  --text-primary: #0f172a;
  --text-secondary: #334155;
  --text-muted: #64748b;
  --text-silver: #334155;
}`;

const newBlock = `/* ── Design Tokens (ASCEND HUD v2 + Legacy Support) ── */
@theme {
  --color-obsidian: #0B0B0F;
  --color-graphite: #1A1C22;
  --color-silver: #C9CED6;
  --color-ascend-blue: #3B82F6;
  --color-royal-purple: #7C3AED;

  /* ASCEND HUD v2 Official Tokens */
  --color-hud-void: #07080C;
  --color-hud-surface: #10121A;
  --color-hud-elevated: #161924;
  --color-hud-cyan: #00F0FF;
  --color-hud-purple: #A855F7;
  --color-hud-gold: #F59E0B;
  --color-hud-crimson: #EF4444;
  --color-hud-success: #10B981;
  --color-hud-text-primary: #F8FAFC;
  --color-hud-text-secondary: #94A3B8;
  --color-hud-text-muted: #64748B;
}

:root {
  /* Legacy Variables Preserved */
  --bg-obsidian: #0B0B0F;
  --bg-graphite: #1A1C22;
  --surface-primary: #0F0F13;
  --surface-secondary: #15151B;
  --surface-muted: rgba(255, 255, 255, 0.05);
  --surface-input: rgba(0, 0, 0, 0.4);
  --border-subtle: #1E1E26;
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  --text-silver: #C9CED6;
  --ascend-blue: #3B82F6;
  --royal-purple: #7C3AED;
  --font-orbitron: 'Orbitron', sans-serif;
  --font-inter: 'Inter', sans-serif;

  /* ASCEND HUD v2 CSS Variables */
  --hud-bg: #07080C;
  --hud-surface: #10121A;
  --hud-surface-elevated: #161924;
  --hud-surface-glass: rgba(16, 18, 26, 0.85);
  --hud-cyan: #00F0FF;
  --hud-purple: #A855F7;
  --hud-gold: #F59E0B;
  --hud-crimson: #EF4444;
  --hud-success: #10B981;
  --hud-border: rgba(255, 255, 255, 0.08);
  --hud-border-strong: rgba(255, 255, 255, 0.14);
  --hud-border-cyan: rgba(0, 240, 255, 0.45);
  --hud-border-purple: rgba(168, 85, 247, 0.45);
  --hud-border-gold: rgba(245, 158, 11, 0.45);
  --hud-border-crimson: rgba(239, 68, 68, 0.45);
}

.theme-light {
  --bg-obsidian: #f3f6fb;
  --bg-graphite: #e2e8f0;
  --surface-primary: #ffffff;
  --surface-secondary: #f8fafc;
  --surface-muted: rgba(226, 232, 240, 0.72);
  --surface-input: #eef3f9;
  --border-subtle: #d7e0ec;
  --text-primary: #0f172a;
  --text-secondary: #334155;
  --text-muted: #64748b;
  --text-silver: #334155;

  /* Light Mode Adaptations for HUD v2 */
  --hud-bg: #f3f6fb;
  --hud-surface: #ffffff;
  --hud-surface-elevated: #f8fafc;
  --hud-surface-glass: rgba(255, 255, 255, 0.88);
  --hud-cyan: #0284c7;
  --hud-purple: #7e22ce;
  --hud-gold: #d97706;
  --hud-crimson: #dc2626;
  --hud-success: #059669;
  --hud-border: rgba(148, 163, 184, 0.28);
  --hud-border-strong: rgba(148, 163, 184, 0.42);
  --hud-border-cyan: rgba(2, 132, 199, 0.45);
  --hud-border-purple: rgba(126, 34, 206, 0.45);
  --hud-border-gold: rgba(217, 119, 6, 0.45);
  --hud-border-crimson: rgba(220, 38, 38, 0.45);
}`;

// Normaliza CRLF para LF na busca
const normalizedCss = css.replace(/\r\n/g, '\n');
if (!normalizedCss.includes(oldBlock)) {
  throw new Error('Bloco antigo não encontrado em src/index.css');
}

let updated = normalizedCss.replace(oldBlock, newBlock);

// Adicionar utilitários HUD v2 ao final se ainda não existirem
const hudUtilities = `
/* ── ASCEND HUD v2 Utilities ── */
.hud-glow-cyan {
  box-shadow: 0 0 16px rgba(0, 240, 255, 0.28);
}
.hud-glow-purple {
  box-shadow: 0 0 16px rgba(168, 85, 247, 0.28);
}
.hud-glow-gold {
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.28);
}
.hud-glow-crimson {
  box-shadow: 0 0 16px rgba(239, 68, 68, 0.28);
}
.text-glow-cyan {
  text-shadow: 0 0 12px rgba(0, 240, 255, 0.45);
}
.text-glow-gold {
  text-shadow: 0 0 12px rgba(245, 158, 11, 0.45);
}
.theme-light .text-glow-cyan,
.theme-light .text-glow-gold {
  text-shadow: none;
}
.theme-light [class~="bg-[#07080C]"],
.theme-light [class~="bg-[#10121A]"],
.theme-light [class~="bg-[#161924]"] {
  background-color: #ffffff !important;
}
`;

if (!updated.includes('/* ── ASCEND HUD v2 Utilities ── */')) {
  updated = updated.trimEnd() + '\n' + hudUtilities;
}

fs.writeFileSync(filePath, updated, 'utf-8');
console.log('src/index.css atualizado com sucesso!');


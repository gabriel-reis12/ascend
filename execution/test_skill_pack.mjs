import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('ASCEND Skill Pack v1 Discovery & Validation', () => {
  const expectedSkills = [
    'ascend-art-director',
    'ascend-mobile-ux',
    'ascend-design-system',
    'ascend-frontend-architect',
    'ascend-gameplay-guardian',
    'ascend-qa-reviewer',
  ];

  const expectedDocs = [
    'docs/ASCEND_DESIGN_SYSTEM.md',
    'docs/ASCEND_ARCHITECTURE.md',
    'docs/ASCEND_GAMEPLAY_RULES.md',
    'docs/ASCEND_MOBILE_GUIDELINES.md',
  ];

  it('Todas as 6 pastas de skills devem existir em .agents/skills/ com SKILL.md válido', () => {
    for (const skill of expectedSkills) {
      const skillPath = path.join('.agents', 'skills', skill, 'SKILL.md');
      assert.ok(fs.existsSync(skillPath), `Arquivo ausente: ${skillPath}`);

      const content = fs.readFileSync(skillPath, 'utf-8');
      assert.ok(content.startsWith('---'), `Frontmatter ausente no início de: ${skillPath}`);
      assert.ok(content.includes(`name: ${skill}`), `Campo name inválido em: ${skillPath}`);
      assert.ok(content.includes('description:'), `Campo description ausente em: ${skillPath}`);
    }
  });

  it('Os 4 documentos técnicos centrais devem existir na pasta docs/', () => {
    for (const doc of expectedDocs) {
      assert.ok(fs.existsSync(doc), `Documentação ausente: ${doc}`);
      const content = fs.readFileSync(doc, 'utf-8');
      assert.ok(content.length > 200, `Documentação muito curta ou vazia: ${doc}`);
    }
  });

  it('AGENTS.md deve conter a matriz de ativação das skills sem remover regras anteriores', () => {
    const agentsMd = fs.readFileSync('AGENTS.md', 'utf-8');
    assert.ok(agentsMd.includes('Matriz de Ativação do ASCEND'), 'Matriz ausente em AGENTS.md');
    assert.ok(agentsMd.includes('ascend-art-director'), 'Skill art director não referenciada em AGENTS.md');
    assert.ok(agentsMd.includes('Regras de Ouro'), 'Regras de Ouro foram removidas de AGENTS.md');
  });
});


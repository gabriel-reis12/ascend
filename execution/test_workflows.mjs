import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('ASCEND Workflows v1 Architecture & Validation', () => {
  const workflowDir = path.join('.agents', 'workflows');
  const expectedWorkflows = [
    'ascend-design.md',
    'ascend-develop.md',
    'ascend-review.md',
    'ascend-mobile-release.md',
  ];

  it('O diretório .agents/workflows deve existir e conter os 4 workflows oficiais', () => {
    assert.ok(fs.existsSync(workflowDir), `Diretório ausente: ${workflowDir}`);

    for (const wf of expectedWorkflows) {
      const wfPath = path.join(workflowDir, wf);
      assert.ok(fs.existsSync(wfPath), `Workflow ausente: ${wfPath}`);
      const content = fs.readFileSync(wfPath, 'utf-8');
      assert.ok(content.startsWith('---'), `Frontmatter ausente em: ${wfPath}`);
      assert.ok(content.includes('description:'), `Campo description ausente em: ${wfPath}`);
      assert.ok(content.includes('Agente Primário:'), `Agente primário não definido em: ${wfPath}`);
      assert.ok(content.includes('Skills Vinculadas:'), `Skills vinculadas não definidas em: ${wfPath}`);
    }
  });

  it('Os workflows devem referenciar estritamente agentes do ASCEND Agent Team v1', () => {
    const validAgents = [
      'ASCEND Creative Director',
      'ASCEND Mobile Engineer',
      'ASCEND Software Architect',
      'ASCEND Gameplay Guardian',
      'ASCEND QA Engineer',
    ];

    for (const wf of expectedWorkflows) {
      const content = fs.readFileSync(path.join(workflowDir, wf), 'utf-8');
      const hasValidAgent = validAgents.some(agent => content.includes(agent));
      assert.ok(hasValidAgent, `Nenhum agente válido encontrado em: ${wf}`);
    }
  });

  it('Os workflows devem referenciar estritamente skills do ASCEND Skill Pack v1', () => {
    const validSkills = [
      'ascend-art-director',
      'ascend-mobile-ux',
      'ascend-design-system',
      'ascend-frontend-architect',
      'ascend-gameplay-guardian',
      'ascend-qa-reviewer',
    ];

    for (const wf of expectedWorkflows) {
      const content = fs.readFileSync(path.join(workflowDir, wf), 'utf-8');
      const hasValidSkill = validSkills.some(skill => content.includes(skill));
      assert.ok(hasValidSkill, `Nenhuma skill válida encontrada em: ${wf}`);
    }
  });
});


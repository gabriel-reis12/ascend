import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('ASCEND Agent Team v1 Architecture & Alignment', () => {
  const agentTeamDoc = 'docs/ASCEND_AGENT_TEAM.md';

  it('docs/ASCEND_AGENT_TEAM.md deve existir e definir os 5 agentes oficiais', () => {
    assert.ok(fs.existsSync(agentTeamDoc), `Arquivo ausente: ${agentTeamDoc}`);
    const content = fs.readFileSync(agentTeamDoc, 'utf-8');

    const expectedAgents = [
      'ASCEND Creative Director',
      'ASCEND Mobile Engineer',
      'ASCEND Software Architect',
      'ASCEND Gameplay Guardian',
      'ASCEND QA Engineer',
    ];

    for (const agent of expectedAgents) {
      assert.ok(content.includes(agent), `Agente não documentado em ${agentTeamDoc}: ${agent}`);
    }
  });

  it('docs/ASCEND_AGENT_TEAM.md deve conter as 10 regras de colaboração e os 4 workflows', () => {
    const content = fs.readFileSync(agentTeamDoc, 'utf-8');
    assert.ok(content.includes('As 10 Regras de Ouro de Colaboração'), 'Seção de 10 regras ausente');
    assert.ok(content.includes('Workflows de Orquestração Sequencial'), 'Seção de workflows ausente');
    assert.ok(content.includes('Workflow de Redesign de Tela'), 'Workflow 1 ausente');
    assert.ok(content.includes('Workflow de Refatoração e Arquitetura'), 'Workflow 2 ausente');
    assert.ok(content.includes('Workflow de Navegação Mobile'), 'Workflow 3 ausente');
    assert.ok(content.includes('Workflow de Gamificação e Atributos'), 'Workflow 4 ausente');
  });

  it('AGENTS.md deve integrar o ASCEND Agent Team v1 na Camada 2 e na Matriz de Ativação', () => {
    const agentsMd = fs.readFileSync('AGENTS.md', 'utf-8');
    assert.ok(agentsMd.includes('ASCEND Agent Team v1'), 'Referência ao time ausente em AGENTS.md');
    assert.ok(agentsMd.includes('Creative Director'), 'Creative Director ausente em AGENTS.md');
    assert.ok(agentsMd.includes('Mobile Engineer'), 'Mobile Engineer ausente em AGENTS.md');
    assert.ok(agentsMd.includes('Software Architect'), 'Software Architect ausente em AGENTS.md');
    assert.ok(agentsMd.includes('Gameplay Guardian'), 'Gameplay Guardian ausente em AGENTS.md');
    assert.ok(agentsMd.includes('QA Engineer'), 'QA Engineer ausente em AGENTS.md');
  });
});


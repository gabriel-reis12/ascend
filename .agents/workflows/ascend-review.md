---
description: >-
  Workflow oficial para auditoria de qualidade, execução de testes automatizados,
  verificação de responsividade, i18n bilíngue e validação de entregas no ASCEND.
---

# Workflow: ascend-review

Este workflow orquestra a etapa final de homologação técnica e visual de qualquer entrega no ASCEND.

## 1. Papéis e Agentes Envolvidos

- **Agente Primário:** `ASCEND QA Engineer`
- **Agentes de Suporte:** `ASCEND Creative Director` (para QA visual), `ASCEND Software Architect` (para build/types)
- **Skills Vinculadas:** `ascend-qa-reviewer`, `ascend-art-director`, `ascend-mobile-ux`

---

## 2. Passo a Passo Operacional

1. **Mapeamento de Arquivos:**
   - Inspecionar via `git status` exatamente quais arquivos foram adicionados ou modificados.
   - Confirmar ausência de arquivos temporários soltos ou lixo fora de diretórios oficiais.

2. **Execução de Testes Automatizados:**
   - Teste de agentes e governança: `node execution/test_agent_team.mjs`
   - Teste de skills e documentação: `node execution/test_skill_pack.mjs`
   - Teste de componentes HUD v2: `node execution/test_hud_components.mjs`
   - Teste de autenticação e storage: `node execution/test_auth_storage.mjs`

3. **Auditoria de Internacionalização (PT-BR / EN-US):**
   - Executar auditoria de dicionários: `node --experimental-strip-types execution/audit_localization.mjs`
   - Confirmar ausência de textos hardcoded que quebrem em qualquer idioma.

4. **Auditoria Visual & Acessibilidade:**
   - Confirmar atributos de acessibilidade (`role="progressbar"`, `aria-label`, contraste).
   - Verificar ausência de overflow horizontal em 320px–430px.

5. **Emissão de Relatório:**
   - Registrar no relatório as evidências reais de execução dos comandos e o status de aprovação.

---

## 3. Regras e Restrições

- Nunca declarar aprovação de teste que não foi efetivamente executado via terminal.
- Não considerar a mera existência de um arquivo como evidência de funcionamento de código.


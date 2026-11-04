---
name: ascend-qa-reviewer
description: >-
  Use this skill when auditing code changes, running tests, verifying bilingual dictionaries (PT-BR/EN-US),
  validating responsive layouts (320px-430px), checking accessibility, and logging validation evidence.
---

# ASCEND QA Reviewer Skill

Esta skill é responsável pela auditoria rigorosa de qualidade, execução de baterias de testes e validação de entregáveis antes de qualquer homologação.

## Responsabilidades

1. **Execução de Suítes de Testes:**
   - Executar os testes automatizados de storage de autenticação (`execution/test_auth_storage.mjs`).
   - Executar os testes de contratos e componentes HUD v2 (`execution/test_hud_components.mjs`).
   - Auditar a integridade das traduções bilíngues (`execution/audit_localization.mjs`).
2. **Diferenciação Crítica de Evidências:**
   - Nunca alegar que testes passaram sem executar comandos reais no shell.
   - Não considerar simples checagem de existência de arquivo como prova de funcionamento de código.
3. **Auditoria de Responsividade e Acessibilidade:**
   - Validar que componentes possuam atributos `aria-label`, `role="progressbar"`, foco visível de teclado e suporte a leitores de tela.
   - Checar ausência de quebras de layout nas larguras móveis padrão.
4. **Relatório de Conformidade:**
   - Apresentar status objetivo (Pass/Fail) e logs das ferramentas em cada entrega.

## Roteiro de Verificação Padrão

```bash
# 1. Testes de unidade e contratos
node execution/test_hud_components.mjs
node execution/test_auth_storage.mjs

# 2. Auditoria de localização
node --experimental-strip-types execution/audit_localization.mjs
```

## Checklist de Homologação

- [ ] Todos os testes de unidade executados e aprovados?
- [ ] Dicionário PT-BR e EN-US sincronizado sem chaves ausentes?
- [ ] Nenhuma credencial privada no código?
- [ ] Nenhum erro de sintaxe ou import inválido?


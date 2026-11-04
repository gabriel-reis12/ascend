---
description: >-
  Workflow oficial para desenvolvimento de lógica, refatoração e gerenciamento de estado no ASCEND,
  garantindo contratos TypeScript, integridade do Supabase e zero IA no client.
---

# Workflow: ascend-develop

Este workflow orquestra a alteração de lógica de aplicação, integração com Supabase e stores Zustand.

## 1. Papéis e Agentes Envolvidos

- **Agente Primário:** `ASCEND Software Architect`
- **Agentes Revisores:** `ASCEND Gameplay Guardian`, `ASCEND QA Engineer`
- **Skills Vinculadas:** `ascend-frontend-architect`, `ascend-gameplay-guardian`, `ascend-qa-reviewer`

---

## 2. Passo a Passo Operacional

1. **Análise de Contratos (Software Architect):**
   - Inspecionar dependências do arquivo em `src/stores/`, `src/hooks/` ou `src/lib/`.
   - Garantir que contratos de TypeScript e propriedades existentes permaneçam estáveis.
   - Preservar a sessão multiplataforma do Supabase Auth em `src/lib/authStorage.ts`.

2. **Implementação de Escopo Mínimo (Software Architect):**
   - Executar alterações estritamente necessárias para a tarefa.
   - Decompor monólitos em submódulos isolados quando necessário, mantendo compatibilidade retroativa.
   - Proibição estrita de chamadas externas a serviços de LLM ou chaves de IA no código frontend.

3. **Revisão de Gamificação (Gameplay Guardian):**
   - Se a alteração envolver XP, Ranks, Níveis, atributos ou dano de chefes, validar contra as fórmulas em `src/lib/progression.ts`.
   - Garantir que caps diários (`DAILY_COMMON_XP_FULL_CAP = 180`) e regras de progressão sejam mantidos.
   - Proteger histórico e registros salvos do caçador contra exclusões arbitrárias.

4. **Validação Técnica (QA Engineer):**
   - Executar testes de persistência (`node execution/test_auth_storage.mjs`).
   - Validar integridade dos contratos e suítes do projeto.

---

## 3. Regras e Restrições

- Não executar migrations ou alterar tabelas do Supabase sem autorização.
- Não executar commits, push ou deploys remotos.
- Manter política *Zero Waste*: arquivos substituídos vão para `obsoleto/`.


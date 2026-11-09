# Instruções do Agente

Este arquivo define a arquitetura de operação para este projeto, baseada em 3 camadas para maximizar a confiabilidade e eficiência.

## Arquitetura de 3 Camadas

### Camada 1: Diretiva (O que fazer)
• Basicamente são SOPs escritos em Markdown, que vivem em `directives/` e no Skill Pack oficial em `.agents/skills/`.
• Definem objetivos, entradas, ferramentas/scripts a usar, saídas e edge cases.
• Instruções em linguagem natural.

### Camada 2: Orquestração (Tomada de decisão)
• É a IA (Antigravity). Função: roteamento inteligente e execução de papéis especializados.
• Operar utilizando o **ASCEND Agent Team v1** (documentado em `docs/ASCEND_AGENT_TEAM.md`), alternando entre os papéis:
  1. **ASCEND Creative Director** (Direção de arte & estética 70/30)
  2. **ASCEND Mobile Engineer** (Mobile-first, Bottom Nav & safe areas)
  3. **ASCEND Software Architect** (React 19, TypeScript, Zustand & Supabase)
  4. **ASCEND Gameplay Guardian** (XP, Níveis, Ranks & 7 Atributos)
  5. **ASCEND QA Engineer** (Testes reais, auditoria i18n & homologação)
• Antes de implementar qualquer etapa, consultar as instruções das skills relevantes e declarar no relatório quais papéis e skills foram utilizados.

### Camada 3: Execução (Fazer o trabalho)
• Scripts determinísticos em Python/Node dentro de `execution/`.
• Variáveis de ambiente vivem no `.env`.
• Lida com chamadas de API, processamento de dados, operações de arquivos.

## Regras de Ouro (Protocolo de Manutenção)

1. **Documentação Obrigatória:** Toda alteração de funcionalidade ou refatoração deve ser registrada no `HISTORY.md` ao final da sessão, com data e descrição clara.
2. **Política de Descarte (Zero Waste):** Arquivos que deixarem de ser úteis (scripts antigos, componentes substituídos, rascunhos de planejamento) **NUNCA** devem ser deletados permanentemente de imediato. Devem ser movidos para a pasta `obsoleto/`.
3. **Persistência de Planos:** Manter a pasta `.planning/` atualizada com o estado real do projeto, movendo marcos concluídos para `.planning/milestones/`.

## Matriz de Ativação do ASCEND Agent Team & Skill Pack

Quando executar tarefas no projeto, o Antigravity deve orquestrar os agentes especializados e consultar ativamente as skills em `.agents/skills/`:

| Tipo de Tarefa | Workflow de Agentes | Skills Obrigatórias a Consultar |
| :--- | :--- | :--- |
| **Redesign Visual & Temas** | Creative Director $\rightarrow$ Mobile Engineer $\rightarrow$ QA Engineer | `ascend-art-director` + `ascend-design-system` + `ascend-qa-reviewer` |
| **Navegação & Ergonomia Mobile** | Mobile Engineer $\rightarrow$ Creative Director $\rightarrow$ QA Engineer | `ascend-mobile-ux` + `ascend-frontend-architect` + `ascend-qa-reviewer` |
| **Telas de Atributos, XP e Raid** | Gameplay Guardian $\rightarrow$ Design System $\rightarrow$ QA Engineer | `ascend-gameplay-guardian` + `ascend-design-system` + `ascend-qa-reviewer` |
| **Refatoração & Estado (Zustand/Auth)**| Software Architect $\rightarrow$ Gameplay Guardian $\rightarrow$ QA Engineer | `ascend-frontend-architect` + `ascend-gameplay-guardian` + `ascend-qa-reviewer` |
| **Validação e Homologação** | QA Engineer | `ascend-qa-reviewer` |

## Documentação Técnica Central

- Definição do ASCEND Agent Team v1: `docs/ASCEND_AGENT_TEAM.md`
- Diretrizes de Design HUD v2: `docs/ASCEND_DESIGN_SYSTEM.md`
- Arquitetura Frontend & Stores: `docs/ASCEND_ARCHITECTURE.md`
- Fórmulas de Gamificação: `docs/ASCEND_GAMEPLAY_RULES.md`
- Ergonomia Mobile & Safe Areas: `docs/ASCEND_MOBILE_GUIDELINES.md`

## Organização de Arquivos

.agents/skills/ # Pacote oficial de Agent Skills especializadas
docs/           # Documentação técnica central de referência
.tmp/           # Arquivos intermediários (sempre regeneráveis)
execution/      # Scripts determinísticos de teste e automação
directives/     # SOPs em Markdown
.env            # Variáveis de ambiente e APIs
credentials.json
token.json      # Credenciais de OAuth para Google (no .gitignore)

# Instruções do Agente

Este arquivo define a arquitetura de operação para este projeto, baseada em 3 camadas para maximizar a confiabilidade e eficiência.

## Arquitetura de 3 Camadas

### Camada 1: Diretiva (O que fazer)
• Basicamente são SOPs escritos em Markdown, que vivem em `directives/`
• Definem objetivos, entradas, ferramentas/scripts a usar, saídas e edge cases
• Instruções em linguagem natural.

### Camada 2: Orquestração (Tomada de decisão)
• É a IA (Antigravity). Função: roteamento inteligente.
• Ler diretivas, chamar ferramentas de execução na ordem correta, lidar com erros.

### Camada 3: Execução (Fazer o trabalho)
• Scripts determinísticos em Python dentro de `execution/`
• Variáveis de ambiente vivem no `.env`
• Lida com chamadas de API, processamento de dados, operações de arquivos.

## Regras de Ouro (Protocolo de Manutenção)

1. **Documentação Obrigatória:** Toda alteração de funcionalidade ou refatoração deve ser registrada no `HISTORY.md` ao final da sessão, com data e descrição clara.
2. **Política de Descarte (Zero Waste):** Arquivos que deixarem de ser úteis (scripts antigos, componentes substituídos, rascunhos de planejamento) **NUNCA** devem ser deletados permanentemente de imediato. Devem ser movidos para a pasta `obsoleto/`.
3. **Persistência de Planos:** Manter a pasta `.planning/` atualizada com o estado real do projeto, movendo marcos concluídos para `.planning/milestones/`.

## Organização de Arquivos

.tmp/           # Arquivos intermediários (sempre regeneráveis)
execution/      # Scripts Python determinísticos
directives/     # SOPs em Markdown
.env            # Variáveis de ambiente e APIs
credentials.json
token.json      # Credenciais de OAuth para Google (no .gitignore)

# ADR 0001 — Motor independente de UI, backend e persistência

Status: aceito nesta fundação. Data: 2026-09-16.

## Contexto

Partidas síncronas e assíncronas precisam compartilhar regras autoritativas. Acoplar regras a componentes React, handlers HTTP ou modelos Prisma faria a execução depender de apresentação, transporte ou infraestrutura e dificultaria replay e testes.

## Decisão

Manter `game-engine` como biblioteca TypeScript, com contrato `GameState + GameCommand → Result<GameState, GameRuleError>`. O domínio possui schemas próprios. O motor valida entradas, não modifica o input e não lê estado externo. Aleatoriedade usa algoritmo versionado com estado explícito.

O servidor autentica/autoriza nas fronteiras, carrega o estado e persiste a saída através de `GameRepository`. Prisma é um adaptador substituível. A UI apresenta projeções autorizadas. Nem tipos Prisma nem DTOs de infraestrutura são o domínio principal.

## Consequências

- O mesmo motor pode rodar em testes, ferramentas de replay e workers sem interface ou banco.
- O cliente pode eventualmente usar o motor para previews, mas isso não lhe dá autoridade; o servidor revalida tudo.
- Concorrência e autenticação continuam sendo responsabilidades do servidor.
- Copiar/validar o estado inteiro é simples e seguro para esta etapa, mas exige revisão de desempenho conforme o histórico crescer.
- Mudanças de RNG, formato de snapshot e semântica de comandos exigem versionamento deliberado.

Alternativas descartadas: regras nos componentes (duplicação e autoridade indevida), regras nos handlers (dependência de transporte) e domínio derivado do Prisma (acoplamento a persistência).

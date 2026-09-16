# ADR 0002 — Convenções técnicas sem antecipar game design

Status: aceito nesta fundação. Data: 2026-09-16.

## Decisões

- Snapshot JSON com formato versionado e log privado, sem declarar event sourcing completo.
- Revisionamento otimista para toda transição, com compare-and-swap no repository.
- Recursos inteiros não negativos, protegidos contra overflow; escala econômica pendente.
- Seed uint32 e Mulberry32 v1. Nenhuma ação usa sorteio ainda.
- Ordens são intenções; custos e efeitos ausentes não são substituídos por regras provisórias.
- Configuração de pontos de comando armazenada na partida, padrão 4, sem consumo até a definição dos custos.
- Identidade de civilização derivada da posição inicial, sem catálogo de povos jogáveis.
- Mapa inicial vazio ou fornecido; sem geração procedural, distribuição inicial ou terreno inventados.
- Next.js somente como shell; HTTP somente health. Serviço em memória demonstra o fluxo sem expor mutações desprotegidas.

## Dependências

O lockfile fixa as versões verificadas. Prisma 7.10 usa cliente gerado explicitamente e adapter PostgreSQL. A geração/validação segue a [documentação oficial do Prisma](https://docs.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/generating-prisma-client); o shell segue o [App Router do Next.js](https://nextjs.org/docs/app/getting-started/installation).

Overrides de `deepmerge-ts` 8.0.2 e `mysql2` 3.24.4 corrigem alertas transitivos do CLI Prisma encontrados na instalação. `deepmerge-ts` cruza uma versão major; geração, validação do schema e compilação precisam permanecer cobertas ao atualizar Prisma. Remover os overrides quando upstream incorporar as correções. MySQL não é utilizado pelo jogo, mas a dependência acompanha o CLI Prisma.

## Limitações aceitas

Confirmação de planejamento, timeout, scheduler, autenticação, regras de visibilidade e resolução de conflitos precisam ser especificados. Sem essas definições, a aplicação não é um multiplayer pronto para produção.

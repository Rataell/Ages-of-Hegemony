# Public Alpha v0.1 — checkpoint pré-delta

Data: 2026-09-19

## Base preservada

- Branch: `feature/aoh-playable-alpha-v1`.
- HEAD: `193bf87bc63693b5f7f4ab08aae441d7f56f09b9`.
- A implementação alpha permanece sem commit. Nenhum arquivo foi descartado ou restaurado.
- `.agents/`, `docs/auditoria-2026-09-18.md`, a slice em `/` e o servidor local na porta 3000 foram preservados.
- O relatório e o código concordam sobre envelope alpha v4, cinco fases, Era V para Hegemonia, cinco recursos e combate por força + 2d6. Portanto, os deltas da Concept Bible ainda não estavam implementados neste checkpoint.

## Arquitetura atual

- `packages/game-domain`: schemas Zod, catálogo e envelope alpha.
- `packages/game-engine`: reducers determinísticos, RNG privado, migração v3→v4, turno, cidade, diplomacia, combate, mundo, cartas e Hegemonia.
- `apps/server`: boundary HTTP, cookie assinado, autorização por assento, serviço, CAS e repositories em memória/PostgreSQL.
- `apps/web/app/alpha`: cliente por polling e projeção server-side.
- `prisma`: tabela aditiva `AlphaMatch` com snapshot JSON e versão CAS.
- `tests` e `e2e`: 356 testes unitários/integração local e quatro cenários de navegador.

## Mapa de migração

- Escritores: criação da partida e `applyAlphaCommand`; persistência ocorre em `AlphaGameService` e `AlphaPrismaRepository`.
- Leitores: `AlphaRoomSchema`, projeções privadas, UI alpha, testes e harness determinístico.
- Formato atual: `AlphaState.schemaVersion = 4`, dentro do snapshot JSON de `AlphaRoom`.
- Caminho de avanço: expandir schemas e regras em envelope v5; migrar v4→v5 de forma explícita e idempotente; aceitar snapshots v5 em execução; preservar original v4 para rollback.
- Rollback: manter snapshot v4 original no resultado da migração e evitar qualquer contração destrutiva nesta rodada.
- Compatibilidade: repository deve decodificar room antiga, migrar somente envelope conhecido e persistir nova versão por CAS. Versões desconhecidas devem falhar sem modificar dados.

## Gates antes dos deltas

- `lint`: passou.
- `typecheck`: passou.
- `production build`: passou.
- `Prisma validate`: passou.
- `git diff --check`: passou.
- testes: 356/356 passaram. Primeira tentativa ficou bloqueada pelo download do engine Prisma no sandbox; repetição autorizada passou.
- E2E: 3/4 passaram. `alpha-conflict.spec.ts` falhou ao abrir o fixture pela URL com `Identificador de partida inválido`; investigação localizada necessária.
- PostgreSQL real: não executado; `ALPHA_TEST_DATABASE_URL` não está disponível no checkpoint.

## Riscos observados

- Recursos, eras e fases pertencem também ao núcleo v3 usado pela slice anterior. Alterá-los diretamente quebraria compatibilidade. O delta deve pertencer ao envelope alpha v5 ou incluir adaptação explícita.
- Snapshot PostgreSQL é validado diretamente como room atual. Migração precisa entrar no decode antes de exigir o schema novo.
- O escopo final depende de credenciais externas, remote Git e destinos Railway/Supabase ainda ausentes. Implementação local pode avançar sem inventar esses dados.

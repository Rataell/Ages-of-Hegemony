# Relatório — Rodada 1

## Entrega

Monorepo TypeScript com `apps/web` (Next.js/React), `apps/server` (Node.js), `packages/game-domain` (Zod e tipos nominais), `packages/game-engine` (motor independente) e `packages/shared` (`Result`). Prisma/PostgreSQL ficam atrás de um repository. O diretório estava vazio e não tinha Git; o repositório foi iniciado diretamente em `feature/aoh-foundation-engine`, sem criar ou modificar `main`.

```text
apps/web/app/{layout.tsx,page.tsx,style.css}
apps/server/src/
  game-service.ts             autoridade e projeção por jogador
  repository.ts              porta e adaptador em memória
  prisma-repository.ts        snapshots e compare-and-swap PostgreSQL
  database.ts                composição do adapter Prisma
  http.ts / main.ts           health check Node.js
  demo.ts                    prova funcional completa
packages/game-domain/src/{model.ts,serialization.ts,index.ts}
packages/game-engine/src/{engine.ts,resources.ts,hex.ts,random.ts,index.ts}
packages/shared/src/index.ts
prisma/schema.prisma
prisma/migrations/202609160001_foundation/migration.sql
tests/{engine,primitives,server,prisma-repository}.test.ts
docs/{architecture,game-domain,game-loop,roadmap}.md
docs/decisions/0001-independent-engine.md
docs/decisions/0002-foundation-conventions.md
```

## Decisões e suposições

O motor retorna novos valores sem modificar inputs. Entradas e snapshots são validados em runtime. Toda transição exige a versão esperada, e o repository verifica atomicamente a versão persistida. Ordens adversárias e o log privado não são publicados na visão do jogador.

Inicialização técnica: rodada 1, Fundação, MAINTENANCE, partida ativa, recursos zerados, nenhuma cidade e mapa vazio ou explicitamente fornecido. RNG uint32 com Mulberry32 versionado. Recursos usam inteiros seguros. `baseCommandPoints = 4` é configuração por partida; não há custo de ordem presumido. A ordem dos comandos aceitos faz parte da entrada determinística.

O ciclo registra intenções, mas não aplica efeitos de ações. Ao entrar na manutenção seguinte, incrementa a rodada e limpa filas, preservando o histórico. O log atual é trilha de acontecimentos, não event sourcing completo. A autenticação real e o scheduler não foram simulados como se estivessem prontos: apenas o serviço interno está implementado, e HTTP expõe exclusivamente health check.

## Validação executada

Ambiente: Windows, Node 26.4.0, npm 12.0.1. Dependências reproduzíveis no lockfile.

| Verificação | Resultado |
| --- | --- |
| `npm run lint` | Passou, zero warnings |
| `npm run typecheck` | Passou, incluindo testes e Next.js |
| `npm test` | 63 testes passaram em 4 arquivos |
| `npm run build` | Passou, bibliotecas/servidor e páginas estáticas Next.js |
| `npm run db:validate` | Schema Prisma válido |
| `npm run demo` | Rodada 2, MAINTENANCE, versão 6, sete eventos após round-trip JSON |
| Auditoria na instalação final | Zero vulnerabilidades reportadas |

Testes cobrem 2–6 jogadores e rejeição de 0/1/7/8, IDs e mapas inválidos, configuração, ciclo completo, todas as 20 transições ilegais, estado inativo, comandos desconhecidos, versões obsoletas, ordens independentes, propriedade/alvo/duplicata, imutabilidade, replay e serialização. Também cobrem recursos negativos/fracionários/não finitos/overflow, `canAfford`, vizinhança e distância axial, RNG determinístico e retomada por estado, privacidade, impersonação, compare-and-swap, cópias no repository, contrato Prisma e HTTP health.

Vitest e a etapa de subprocessos do Next.js precisaram executar fora do sandbox após bloqueios EPERM do Windows. O binário de geração Prisma também exigiu acesso de rede inicial. As execuções finais concluíram com sucesso; não foram desabilitados testes ou verificações de tipos para contornar erros.

## Pendências e riscos

Não há PostgreSQL nem Docker disponíveis neste ambiente. O schema foi validado e o adaptador foi testado com doubles; migração e concorrência reais entre conexões continuam pendentes. Isso não é apresentado como cobertura de integração com banco.

Permanecem para próximas rodadas: efeitos/custos das ordens, política de encerramento do planejamento, resolução de conflitos, autenticação, WebSocket, regras de visibilidade, geração procedural, cidades e demais sistemas de design listados no escopo original. Não houve deploy.

Riscos centrais: crescimento do log e cópia integral por comando; justiça de ordenação não resolvida por controle de versão; necessidade de proteger o estado autoritativo; versionamento futuro de snapshots/replays; revisão dos overrides transitivos usados para corrigir a auditoria do CLI Prisma. Detalhes e ações estão em [roadmap.md](roadmap.md).

O commit atômico de entrega é identificado no relatório final da tarefa e em `git log -1`.

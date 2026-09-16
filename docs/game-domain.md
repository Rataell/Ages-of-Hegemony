# Domínio — v0.3

`game-domain` define contratos Zod e tipos TypeScript inferidos. As regras executáveis continuam no `game-engine`.

## Organização

- `core.ts`: IDs nominais, enums, recursos, coordenadas e alocação populacional.
- `rules.ts`: GameRulesConfig, defaults provisórios e validação da configuração.
- `model.ts`: cidade, civilização, jogador, estado, comandos, eventos e invariantes.
- `serialization.ts`: encode/decode validado com discriminação de versão.

São preservados IDs nominais, recursos, cinco eras, cinco domínios, seis hegemonias conceituais e ordens da Rodada 1. Não há implementação de vitória.

## Estado

GameState conserva gameId, version, seed/RNG, status, playerCount, players, map, round, era, phase, config, pendingOrders e eventLog. schemaVersion agora é 2. O RNG continua Mulberry32 v1 e não é consumido por manutenção ou gestão.

CivilizationState inclui government (inicialmente PROTO_GOVERNANCE), capitalCityId, administrativeCapacity, administrativeLoad, administrationStatus e cidades. CityState inclui name, population, stability, development, specialization, workers, foundedRound e growthProgress, além das identidades.

Os schemas exigem trabalhadores inteiros não negativos somando exatamente a população, estabilidade inteira 0–100, desenvolvimento 1–5 e dentro do máximo configurado, população até o cap, progresso até um threshold, propriedade coerente, capital própria, hexágonos válidos e únicos e administração não negativa com status consistente. O motor recalcula administração ao criar cidades, executar gestão e manutenção. Todo output de comando passa pelo schema antes de retornar.

## Comandos

| Comando | Autoridade/fase | Efeito |
| --- | --- | --- |
| SUBMIT_ORDER | Jogador, PLANNING | Registra intenção genérica na fila própria |
| ADVANCE_PHASE | Scheduler interno | Próxima fase legal; manutenção ao sair dela |
| ASSIGN_POPULATION | Dono, PLANNING | Substitui distribuição preservando população |
| DEVELOP_CITY | Dono, PLANNING | Paga custo configurado e aumenta um nível |
| SPECIALIZE_CITY | Dono, PLANNING | Escolha inicial de especialização |
| ADOPT_GOVERNMENT | Jogador, PLANNING | Escolha inicial de governo |

Todos exigem expectedVersion. Os novos comandos de gestão carregam playerId; o serviço compara com a identidade confiável externa ao JSON. Comandos rejeitados não gastam recursos nem geram eventos. Payloads estritos rejeitam campos inesperados.

## Eventos

Mantidos: GAME_CREATED, ORDER_SUBMITTED e PHASE_ADVANCED.

Adicionados: CITY_DEVELOPED, CITY_SPECIALIZED, POPULATION_ASSIGNED, POPULATION_GROWN, GROWTH_PROGRESS_CHANGED, FOOD_SHORTAGE, FOOD_CONSUMED, RESOURCES_PRODUCED, STABILITY_CHANGED, GOVERNMENT_ADOPTED e ADMINISTRATIVE_OVEREXTENSION.

Uma transação pode gerar múltiplos eventos com a mesma revisão. A ordem do array define sua sequência. Não há timestamps implícitos. O log permanece privado e não é event sourcing completo.

## Compatibilidade

JSONB e GameRepository permanecem. Snapshot 1 é rejeitado com SNAPSHOT_MIGRATION_REQUIRED, sem sobrescrever dados. A forma antiga de **criação** (jogadores, seed, config opcional com somente baseCommandPoints) continua aceita, recebendo defaults atuais. Isso não implica migração automática de partidas salvas.

Veja [cidades/população](cities-and-population.md), [governos](governments.md) e [ADR 0003](decisions/0003-civilization-maintenance-and-snapshots.md).

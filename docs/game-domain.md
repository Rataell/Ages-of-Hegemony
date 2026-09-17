# Domínio — v0.4

`game-domain` define contratos Zod e tipos inferidos. As transições e a produção continuam no `game-engine`.

## Organização

- `core.ts`: IDs nominais, enums, recursos, terrenos, features, melhorias, coordenadas e alocação populacional.
- `rules.ts`: GameRulesConfig, defaults provisórios e validação da configuração da partida.
- `territory.ts`: catálogos de território/distritos/edifícios e breakdowns econômicos.
- `territory-invariants.ts`: integridade relacional de território, trabalho e infraestrutura.
- `model.ts`: cidade, civilização, jogador, estado, comandos e eventos.
- `serialization.ts`: encode/decode validado com discriminação de versão.
- `snapshots/v2`: contratos históricos congelados usados pela migração explícita.

São preservados cinco recursos, cinco eras, cinco domínios, seis hegemonias conceituais e envelopes de ordens da Rodada 1. Não há implementação de vitória.

## Estado e integridade

GameState conserva gameId, version, seed/RNG, status, playerCount, players, map, round, era, phase, config, pendingOrders e eventLog. `schemaVersion` é **3**. RNG continua Mulberry32 v1 e não é consumido por manutenção ou gestão.

HexTile contém terrain, features, ownerId, controllerCityId e improvement. CityState acrescenta workedHexIds, districts e buildings aos campos de população, estabilidade, desenvolvimento, especialização e trabalhadores. CivilizationState preserva governo, capital e administração; estoque civilizacional continua no jogador. `BuildingCatalogEntry` vincula cada edifício a um distrito.

Schemas exigem inteiros seguros não negativos, trabalhadores somando população, estabilidade 0–100, desenvolvimento 1–5 dentro do máximo configurado, população até o cap e capital própria. Centros e controladores são coerentes; território deve estar conectado e no raio; trabalho exige produtores suficientes, produtividade e exclusividade. Distritos respeitam slots/unicidade e edifícios exigem distrito e rodadas válidas.

O motor recalcula administração ao criar o jogo e após comandos. Todo output passa pelo schema. Schemas verificam integridade, mas não provam autenticidade nem toda a causalidade histórica; persistência permanece confiável.

## Comandos

| Comando | Autoridade/fase | Efeito |
| --- | --- | --- |
| SUBMIT_ORDER | Jogador, PLANNING | Registra intenção genérica na fila própria |
| ADVANCE_PHASE | Scheduler interno | Próxima fase legal; manutenção ao sair dela |
| ASSIGN_POPULATION | Dono, PLANNING | Redistribui trabalhadores sem invalidar trabalho territorial |
| DEVELOP_CITY | Dono, PLANNING | Paga custo e aumenta desenvolvimento |
| SPECIALIZE_CITY | Dono, PLANNING | Escolha inicial de especialização |
| ADOPT_GOVERNMENT | Jogador, PLANNING | Escolha inicial de governo |
| CLAIM_HEX | Dono da cidade, PLANNING | Paga claim de hex livre conectado e no raio |
| ASSIGN_WORKED_HEXES | Dono da cidade, PLANNING | Substitui lista de trabalho territorial |
| IMPROVE_HEX | Dono do território, PLANNING | Paga melhoria compatível única |
| FOUND_CITY | Dono do território, PLANNING | Paga fundação e transfere controle do centro |
| BUILD_DISTRICT | Dono da cidade, PLANNING | Paga distrito em slot disponível |
| BUILD_BUILDING | Dono da cidade, PLANNING | Paga edifício com distrito correspondente |

Todos exigem expectedVersion. O serviço compara playerId com a identidade confiável externa ao JSON. Payloads são estritos. Rejeições não gastam recursos nem geram eventos. Gestão é imediata, sem resolver de disputa simultânea.

## Eventos e breakdown

Eventos v0.3 permanecem. V0.4 acrescenta HEX_CLAIMED, WORKED_HEXES_ASSIGNED, HEX_IMPROVED, CITY_FOUNDED, DISTRICT_BUILT e BUILDING_BUILT. RESOURCES_PRODUCED inclui EconomyBreakdown nos novos ciclos. O campo é opcional para preservar eventos históricos v2 sem fabricar explicações.

CityProductionBreakdown separa population, terrain, feature, improvement, district, building, specialization, government e stability. EconomyBreakdown reconcilia bruto, ajuste administrativo, crédito, consumo e estoque final. Deltas podem ser negativos; estoques e resultados não.

Uma transição pode emitir vários eventos com a mesma revisão; a ordem do array é determinística. Não há timestamps implícitos. Log permanece privado e não constitui event sourcing completo.

## Compatibilidade

JSONB e GameRepository permanecem. `deserializeGameState` exige v3; v2 retorna orientação para executar `migrateSnapshotV2ToV3` no motor e persistir deliberadamente o resultado. Defaults: UNKNOWN, features vazias, nenhum trabalho/melhoria/distrito/edifício. Somente centros existentes recebem propriedade/controlador inferidos. Recursos, RNG e eventos permanecem.

V1 continua exigindo conversão explícita com orientação ao commit antigo. Versão desconhecida é rejeitada. Defaults permissivos existem apenas no input de criação de cenários; não completam silenciosamente snapshots v3 incompletos.

Veja [economia e território](economy-and-territory.md), [distritos e edifícios](districts-and-buildings.md), [cidades/população](cities-and-population.md), [governos](governments.md) e [ADR 0004](decisions/0004-territorial-economy-and-snapshot-v3.md).

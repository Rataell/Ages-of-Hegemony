# Domínio inicial

IDs nominais: `GameId`, `PlayerId`, `CivilizationId`, `CityId`, `HexId`. Os quatro primeiros usam identificadores ASCII limitados a 100 caracteres; IDs reservados de objetos JavaScript são rejeitados. Hexágonos têm identidade canônica `q,r` em coordenadas axiais inteiras, limitadas a ±1.000.000 no mapa persistido.

| Conceito | Valores |
| --- | --- |
| Era | FOUNDATION, EXPANSION, CIVILIZATION, EMPIRES, HEGEMONY |
| Recursos | FOOD, MATERIALS, WEALTH, KNOWLEDGE, INFLUENCE |
| Domínios | KNOWLEDGE, SOCIETY, ECONOMY, WARFARE, CULTURE |
| Hegemonias | MILITARY, ECONOMIC, SCIENTIFIC, CULTURAL, POLITICAL, TERRITORIAL |
| Ordens | EXPLORE, EXPAND, DEVELOP, BUILD, RECRUIT, RESEARCH, MOVE, NEGOTIATE, INFLUENCE |

## Estado

`GameState` contém `schemaVersion`, `gameId`, `version`, `seed`, `rng`, `status`, `playerCount`, `players`, `map`, `round`, `era`, `phase`, `config`, `pendingOrders`, `eventLog`.

A partida nasce ativa, na Fundação, rodada 1, fase MAINTENANCE e revisão 0. Há uma civilização vazia por jogador, recursos zerados, sem cidades ou mapa gerado. Um mapa explícito pode ser fornecido na criação. Esses valores são convenções técnicas de inicialização, não balanceamento.

`PlayerState` tem identidade, nome, recursos e civilização. `CivilizationState` contém identidade, proprietário e cidades. `CityState` contém `id`, `ownerId`, `hexId`, `population`, `stability`, `development`. População e desenvolvimento usam inteiros não negativos; estabilidade aceita número finito, sem inventar escala. Nenhum comando de fundação de cidades foi implementado.

Referências de proprietário, cidade e hexágono são verificadas no snapshot. IDs de civilizações, cidades, jogadores e tiles não podem se repetir nos respectivos conjuntos. É necessário existir exatamente uma fila de ordens por jogador.

## Recursos

`ResourcePool` possui `food`, `materials`, `wealth`, `knowledge`, `influence`. Valores são inteiros seguros e não negativos nesta fundação. Uma futura economia fracionária deve definir unidade mínima explícita antes de mudar esse contrato.

`addResource` e `spendResource` retornam `Result<ResourcePool, GameRuleError>` e não alteram o pool recebido. Valores negativos, fracionários, não finitos e overflow são rejeitados; gastos insuficientes retornam erro. `canAfford(pool, cost)` recebe dois pools completos e compara os cinco recursos, aceitando custo zero e rejeitando dados inválidos.

## Ordens e eventos

`PlayerOrder` é um envelope com `id`, `playerId`, `type` e `targetHexId` opcional. O alvo, se presente, deve existir no mapa. Ainda não é um payload completo de ação. Não há custos, prioridades, alcance ou execução implícita.

IDs de ordens são únicos **dentro da rodada**. O servidor rejeita duplicatas, sem prometer idempotência de transporte. O histórico preserva ordem e rodada, permitindo distinguir IDs reutilizados em rodadas diferentes.

Eventos implementados: `GAME_CREATED`, `ORDER_SUBMITTED`, `PHASE_ADVANCED`. Cada transição aceita gera exatamente um evento, com revisão e rodada. A criação gera o evento de revisão 0. O log é privado e inclui o envelope da ordem. `CITY_FOUNDED`, `RESOURCE_GAINED`, `TECH_UNLOCKED`, `ARMY_MOVED`, `BATTLE_RESOLVED`, `TREATY_SIGNED`, `ERA_ADVANCED` e `HEGEMONY_DECLARED` só devem ganhar payloads quando seus sistemas forem especificados.

O log não é um sistema completo de event sourcing: não guarda todo o input inicial nem a futura configuração de regras. O replay validado nesta rodada usa snapshot inicial e sequência de comandos. Schemas validam forma, referências e sequência de versões, mas não provam autenticidade criptográfica nem toda a causalidade de um snapshot externo.

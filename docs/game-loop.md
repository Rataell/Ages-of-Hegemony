# Ciclo de rodada

```text
MAINTENANCE → PLANNING → RESOLUTION → REACTION → END_ROUND
     ↑                                              │
     └──────────────────────────────────────────────┘
```

Somente a próxima fase exata é aceita. Não há pulos, retorno ou repetição de fase. Na transição END_ROUND → MAINTENANCE, a rodada aumenta uma vez e as filas de ordens são esvaziadas. Os eventos históricos permanecem.

Em PLANNING, jogadores podem registrar ordens em `pendingOrders[playerId]`. Um comando aceito incrementa `version` e gera `ORDER_SUBMITTED`. Cada comando exige a versão atual; comandos rejeitados não alteram o estado nem o log.

Não há requisito de todos os jogadores confirmarem, prazo de fase, ordem de iniciativa ou readiness automático. O serviço só avança por decisão explícita de um chamador interno autorizado. Essas políticas devem ser definidas para suportar partidas síncronas e assíncronas.

RESOLUTION é um ponto de extensão sem efeitos nesta rodada. Não cobra recursos, não usa RNG, não cria unidades e não resolve ordens. Exploration, Economy, Development, Movement, Diplomacy, Conflict e Consequences são candidatas a subfases; a sequência definitiva e as políticas de conflito ainda precisam ser aprovadas no design.

`config.baseCommandPoints` tem padrão 4 e pode variar por partida. Não há custo presumido de 1 por ordem, limite presumido de quatro ordens ou gasto implícito: ainda faltam os custos das ações e as regras de modificadores. As filas são estruturalmente livres nesta prova de conceito; limites de transporte e abuso serão necessários antes de expor multiplayer.

## Exemplo executável

`npm run demo` executa no servidor, com repository em memória:

1. Cria dois jogadores com seed 42.
2. Avança para PLANNING.
3. Envia uma intenção EXPLORE pelo serviço, com identidade separada do comando.
4. Avança por RESOLUTION, REACTION, END_ROUND e MAINTENANCE.
5. Serializa e restaura o snapshot.

Resultado: rodada 2, MAINTENANCE, versão 6, sete eventos, filas vazias e nenhum efeito de exploração inventado.

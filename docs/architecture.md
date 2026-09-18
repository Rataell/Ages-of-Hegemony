# Arquitetura

## Dependências

```text
Next.js/React (apresentação)
         ↓ futuro transporte autenticado HTTP/WebSocket
Servidor Node.js → GameService → game-engine → game-domain → shared
                      ↓                              ↑
                 GameRepository                 Zod (validação)
                  ↙          ↘
            memória       Prisma → PostgreSQL
```

`apps/web` não importa o motor nem Prisma diretamente. Client Components enviam comandos para o Route Handler `POST /api/local`, exclusivo de desenvolvimento. O adaptador `@aoh/server/local-play` resolve a perspectiva da sessão, chama GameService e devolve projeções e previews. Os imports do cliente para esse pacote são somente tipos e desaparecem do bundle. `game-engine` não conhece servidor, transporte ou banco. `game-domain` define schemas Zod e deriva tipos com `z.infer`. `shared` contém somente o resultado discriminado genérico.

Workspaces npm e project references TypeScript bastam para este tamanho de monorepo; não há orquestrador adicional. Os exports dos pacotes apontam para `dist`, e `compile` resolve a ordem. Alterações nos pacotes precisam de uma nova compilação antes de executar consumidores.

## Autoridade e transporte

O serviço carrega o snapshot autoritativo, valida o comando no motor e persiste com compare-and-swap. `expectedVersion` identifica a revisão usada pelo chamador. Um `UPDATE ... WHERE id = ? AND version = ?` torna concorrência explícita: somente uma gravação vence; o cliente perdedor precisa recarregar e decidir sobre o reenvio.

`GameService.submit` aceita identidade previamente autenticada, separada do JSON do comando, e compara essa identidade ao proprietário da ordem. O contexto é uma capacidade interna, não uma implementação de autenticação. `advance` é reservado a um futuro scheduler/admin. Não expor esse método diretamente a jogadores.

`GET /health` permanece ligado a loopback. `POST /api/local` oferece uma capacidade separada de desenvolvimento: cookie HttpOnly/SameSite Strict, origem exata, JSON limitado e bloqueio fora de NODE_ENV=development. O modo permite explicitamente trocar perspectivas e avançar o scheduler, sem representar autorização multiplayer. O futuro adaptador WebSocket deve autenticar a sessão, validar limites de entrada, lidar com conflitos e enviar `PlayerView` apenas ao destinatário correto. O serviço não abre sockets.

`PlayerView` usa lista explícita de campos. Não inclui seed, RNG, adversários completos, mapa não filtrado nem eventLog. Uma política interna confiável pode liberar população/desenvolvimento/especialização de cidades visíveis e governos conhecidos. Alocação adversária e detalhes internos não são incluídos; por padrão não há dados adversários visíveis. A política real de fog of war aguarda especificação. Nunca publicar `GameState` diretamente por broadcast.

## Persistência

Um registro `Game` tem `id`, `version` (`BIGINT`) e `snapshot` (`JSONB`). O domínio usa números inteiros seguros; o adaptador converte a versão para `bigint` somente na fronteira Prisma. O snapshot é validado ao escrever e ao ler, e a leitura verifica a coerência com as colunas de controle.

`schemaVersion = 3` versiona o formato persistido, enquanto `version` conta transições. V1 e v2 retornam `SNAPSHOT_MIGRATION_REQUIRED`; versões desconhecidas retornam `UNSUPPORTED_SCHEMA`. V2 tem transformação explícita `migrateSnapshotV2ToV3`, que valida contratos históricos congelados, preserva UNKNOWN e infere somente centros de cidades. V1 mantém a orientação de conversão manual. Não há conversão silenciosa. Uma transição pode emitir vários eventos com a mesma revisão, em ordem estável. JSONB acomoda v3 sem migração SQL nova. Execução contra PostgreSQL real é uma verificação adicional, não coberta pelos doubles. Veja [ADR 0004](decisions/0004-territorial-economy-and-snapshot-v3.md).

## Economia territorial

`game-domain/territory.ts` define catálogos configuráveis, infraestrutura e contratos de breakdown. Invariantes relacionais validam ownership, controlador, conectividade, alcance, trabalho e infraestrutura ao carregar snapshots. A distância axial compartilhada evita divergência com o motor.

`game-engine/territory-commands.ts` executa os seis comandos territoriais; `economy.ts` explica produção por fonte; `urban.ts` deriva capacidades e limiar de crescimento. `maintenance.ts` mantém a sequência econômica e retorna reconciliação exata. Aritmética centralizada usa BigInt intermediário e verifica inteiros seguros antes de retornar números.

`GameService` valida o ator recebido por contexto externo, persiste via CAS e projeta território próprio ou liberado pela política confiável de visibilidade. Último breakdown próprio e prévia são separados. Local Play revela geografia e cidades públicas dos fixtures, mas mantém privados recursos, trabalhadores e eventos adversários. A disponibilidade de ações usa `applyCommand` sobre cópias sem persistir; custos vêm dos catálogos. Previews não alteram estado nem substituem validação no submit. Claims imediatos não implementam disputa simultânea; CAS protege a gravação, não estabelece iniciativa estratégica.

## Determinismo e limites

O motor depende apenas do estado e do comando explícitos. Não usa relógio, rede, banco ou `Math.random()`. IDs são fornecidos no input ou derivados da posição inicial dos jogadores. A ordem dessa lista é parte do input.

Mulberry32 é identificado como `mulberry32-v1`, com seed e estado RNG serializáveis. A função `randomStep` retorna valor e próximo estado. O wrapper `RandomSource` é mutável por conveniência, mas reducers futuros devem guardar explicitamente o estado retornado. O RNG não é criptográfico e sua seed não deve ser publicada se revelar sorteios futuros.

Mesmos inputs e mesma sequência **aceita** de comandos produzem os mesmos snapshots. Chegada simultânea pela rede não implica ordenação determinística entre servidores. Arbitragem de resolução e uma fila autoritativa são decisões futuras.

O motor valida e copia o snapshot inteiro a cada comando: prioriza integridade e isolamento na fundação. Log e snapshots crescem, portanto será necessário medir e introduzir checkpoints/segmentação em partidas longas. O retorno não é congelado em runtime; os chamadores devem tratá-lo como um valor. Nenhum input é modificado.

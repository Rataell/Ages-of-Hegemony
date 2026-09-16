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

`apps/web` não importa o motor nem Prisma. `game-engine` não conhece servidor, transporte ou banco. `game-domain` define schemas Zod e deriva tipos com `z.infer`, evitando divergência entre contrato runtime e TypeScript. `shared` contém somente o resultado discriminado genérico.

Workspaces npm e project references TypeScript bastam para este tamanho de monorepo; não há orquestrador adicional. Os exports dos pacotes apontam para `dist`, e `compile` resolve a ordem. Alterações nos pacotes precisam de uma nova compilação antes de executar consumidores.

## Autoridade e transporte

O serviço carrega o snapshot autoritativo, valida o comando no motor e persiste com compare-and-swap. `expectedVersion` identifica a revisão usada pelo chamador. Um `UPDATE ... WHERE id = ? AND version = ?` torna concorrência explícita: somente uma gravação vence; o cliente perdedor precisa recarregar e decidir sobre o reenvio.

`GameService.submit` aceita identidade previamente autenticada, separada do JSON do comando, e compara essa identidade ao proprietário da ordem. O contexto é uma capacidade interna, não uma implementação de autenticação. `advance` é reservado a um futuro scheduler/admin. Não expor esse método diretamente a jogadores.

A única rota HTTP implementada é `GET /health`, ligada a loopback. O futuro adaptador WebSocket deve usar o mesmo serviço, autenticar a sessão, validar limites de entrada, lidar com conflitos e enviar `PlayerView` apenas ao destinatário correto. O serviço não abre sockets, permitindo usar um transporte síncrono ou um executor assíncrono.

`PlayerView` usa lista explícita de campos. Não inclui seed, RNG, outros jogadores, mapa não filtrado nem eventLog autoritativo (que contém ordens privadas). Visibilidade do mapa, diplomacia, eventos públicos e dados de adversários aguardam especificação. Nunca publicar `GameState` diretamente por broadcast.

## Persistência

Um registro `Game` tem `id`, `version` (`BIGINT`) e `snapshot` (`JSONB`). O domínio usa números inteiros seguros; o adaptador converte a versão para `bigint` somente na fronteira Prisma. O snapshot é validado ao escrever e ao ler, e a leitura verifica a coerência com as colunas de controle.

`schemaVersion = 1` versiona o formato persistido, enquanto `version` conta transições. Formatos desconhecidos são rejeitados. Migrações de snapshots ainda precisam ser implementadas quando o domínio mudar. A migração SQL inicial está versionada; execução contra um PostgreSQL real é uma verificação adicional de integração, não coberta pelos doubles de teste.

## Determinismo e limites

O motor depende apenas do estado e do comando explícitos. Não usa relógio, rede, banco ou `Math.random()`. IDs são fornecidos no input ou derivados da posição inicial dos jogadores. A ordem dessa lista é parte do input.

Mulberry32 é identificado como `mulberry32-v1`, com seed e estado RNG serializáveis. A função `randomStep` retorna valor e próximo estado. O wrapper `RandomSource` é mutável por conveniência, mas reducers futuros devem guardar explicitamente o estado retornado. O RNG não é criptográfico e sua seed não deve ser publicada se revelar sorteios futuros.

Mesmos inputs e mesma sequência **aceita** de comandos produzem os mesmos snapshots. Chegada simultânea pela rede não implica ordenação determinística entre servidores. Arbitragem de resolução e uma fila autoritativa são decisões futuras.

O motor valida e copia o snapshot inteiro a cada comando: prioriza integridade e isolamento na fundação. Log e snapshots crescem, portanto será necessário medir e introduzir checkpoints/segmentação em partidas longas. O retorno não é congelado em runtime; os chamadores devem tratá-lo como um valor. Nenhum input é modificado.

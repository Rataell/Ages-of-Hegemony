# Multiplayer alpha — implementação em andamento

A nova fronteira usa `AlphaGameService`, separada do `GameService` econômico legado. O navegador envia intenções por HTTP. O servidor verifica uma sessão assinada, resolve seu lugar no lobby, executa a engine, salva por compare-and-swap e retorna uma projeção permitida. O cliente não escolhe livremente `playerId`. O modo local antigo continua sendo uma ferramenta exclusiva de desenvolvimento e sua rota já retorna 404 fora desse ambiente.

## Identidade e convites

A sessão é emitida pelo servidor com identidade UUID, expiração de 90 dias e assinatura HMAC-SHA256. A chave `ALPHA_SESSION_SECRET` deve ser privada, ter pelo menos 32 bytes e permanecer estável entre reinícios. Alterá-la invalida sessões existentes. Não há conta, recuperação de sessão apagada nem revogação individual nesta implementação.

Em HTTPS, o cookie usa `__Host-`, `Secure`, `HttpOnly`, `SameSite=Strict` e `Path=/`, sem Domain. O JSON nunca contém esse cookie ou as identidades privadas das outras pessoas. Convites têm 128 bits aleatórios e ficam disponíveis somente aos participantes. Reentrar com o mesmo cookie recupera o mesmo lugar; criar outro cookie não recupera automaticamente um lugar antigo.

Lobby suporta 2–6 lugares, nomes, civilizações exclusivas, semente, preset e prontidão. O anfitrião inicia somente com pelo menos duas pessoas prontas. O nome da partida, jogadores e configurações são públicos entre participantes; mãos, ambições, ordens, decks e RNG privado não são.

## Concorrência e tempo

Cada mutação de lobby ou partida grava um único snapshot de sala com CAS. O versionamento da sala é separado do versionamento da engine alpha e do núcleo econômico. Uma disputa de gravação retorna conflito; o cliente precisa atualizar. Essa disputa nunca define iniciativa estratégica.

Sem timer, apenas decisões dos participantes avançam a partida. Presets temporizados usam o relógio do servidor. Ao consultar uma sala vencida, o servidor confirma os participantes pendentes e conserva ordens já enfileiradas. Se ambições ainda não foram escolhidas, conserva as duas primeiras da ordem privada de distribuição. Reação usa o mesmo intervalo para permitir passagem automática. Uma sala sem consultas processa o prazo na próxima consulta, sem simular várias rodadas de inatividade. Isso é uma simplificação explícita de polling, não um scheduler contínuo.

## HTTP

`GET /api/alpha?gameId=...` retorna a projeção autenticada. `POST /api/alpha` aceita operações `create`, `join`, `lobby` e `command`. Mutação exige Origin igual a `ALPHA_PUBLIC_ORIGIN`. Corpos JSON são limitados a 16 KiB. Respostas não são cacheadas e não habilitam CORS. Limites por processo: 120 solicitações/minuto por sessão, 30 anônimas/minuto no conjunto e 20 criações/entradas por minuto no conjunto. Esses limites são conservadores para testes pequenos; não são distribuídos entre réplicas.

O runtime público exige PostgreSQL e configuração explícita. Não há fallback silencioso para memória. O repository em memória existe apenas para testes. Testes de serviço e HTTP cobrem duas identidades, reconexão do serviço, acesso indevido, convites, prontidão, CAS e deadlines. Isso ainda não constitui prova de persistência PostgreSQL nem E2E com dois navegadores.

## Aleatoriedade privada

Partidas públicas recebem 256 bits aleatórios privados no servidor. Cartas e dados usam um fluxo determinístico HMAC-SHA256 com contador, armazenado exclusivamente no snapshot autoritativo. A semente pública do lobby não permite reconstruir decks ou o fluxo de dados. O mapa combina essa semente com a entropia privada. Fixtures locais e migrações antigas usam derivação determinística para regressão e não devem ser reutilizadas como partidas públicas competitivas.

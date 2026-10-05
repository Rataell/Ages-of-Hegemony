# Mesa compartilhada — sincronização, visibilidade e latência (2026-10-05)

## Arquitetura de sincronização

- **Fonte da verdade:** o servidor. Nada é aplicado localmente antes da confirmação.
- **Push:** SSE em `GET /api/alpha?gameId=…&stream=1` (`apps/server/src/alpha-http.ts`, `alpha-bus.ts`). Cada `save` bem-sucedido da sala publica `{gameId, version, at}` no barramento em processo (`PublishingAlphaRepository`). O stream não carrega estado de jogo; a associação é verificada como numa leitura (403 para quem não está sentado, 401 sem sessão).
- **Cliente:** ao receber o push, lê a PRÓPRIA projeção autoritativa (`GET /api/alpha?gameId=…`), com coalescência de leituras simultâneas. `window.__aohSync` guarda `push`/`applied` com timestamps (instrumentação). Poll de segurança: 5 s com o canal aberto, 2,5 s sem ele.
- **Limite conhecido:** o barramento é em memória de UM processo (instância única). Com várias instâncias troca-se por Postgres LISTEN/NOTIFY ou Redis; o poll de segurança já garante convergência.

## Latência medida (`scripts/alpha-multiwindow.mjs`, Chromium headless, uma janela por assento, mesma máquina)

Atraso = do `save` no servidor até o DOM da OUTRA janela mostrar a mudança (sem refresh manual). Eventos: N Regiões viram na resolução da rodada 1 (todas as civilizações exploram), N Pioneiros movem para Regiões públicas, um Posto é fundado.

| Janela | Mesa | Amostras | save → push (ms) | save → DOM, média (ms) | máx (ms) | Notas |
|---|---|---|---|---|---|---|
| 1280×720 | 2p | 5 | 12 | 112 | 150 | — |
| 1280×720 | 4p | 11 | 19 | 260 | 500 | — |
| 1280×720 | 6p | 17 | 18 | 342 | 719 | — |
| 1366×768 | 2p | 5 | 11 | 94 | 150 | — |
| 1366×768 | 4p | 3 | 12 | 198 | 228 | — |
| 1366×768 | 6p | 17 | 20 | 437 | 964 | — |

O push chega em ~10–20 ms; o resto é leitura da projeção e renderização, que cresce com o número de janelas disputando a mesma CPU (6 Chromium + servidor numa máquina). Todas abaixo de 1 s. Combate: `e2e/alpha-conflict.spec.ts` confere dados, retirada e vitória nas duas perspectivas (transporte em processo, sem SSE: por polling).

Capturas (por mesa, nos dois tamanhos): `1280x720/Np/` e `1366x768/Np/`: primeiro segundo, mesa inteira oculta, Pátrias, Região antes/depois de virar nos outros, Pioneiros movidos vistos por todos, Posto novo nos outros, inspector aberto (deslocamento do mapa < 0,3 px), Mesa e Focar.

## O que deixou de ser privado

- Terreno, costas, features e recursos físicos de qualquer Região aberta; Região aberta = revelada por qualquer civilização que não seja a dona da Pátria (Pátria fechada para os outros até alguém explorá-la; `HOMELANDS_PUBLIC` em `alpha-world.ts` abre todas desde o início).
- Cidades, nível, muralhas, propriedade, estradas e melhorias em Regiões abertas.
- TODAS as peças em Regiões abertas (Pioneiros, Enviados, exércitos, frotas, Bandos, Piratas); sem raio de visão.
- Batalhas resolvidas (com dados e postura já revelada), guerras declaradas, descobertas de Região, fundações e estradas como Crônica pública.
- Memória por jogador de terreno de Região fechada (não existe mais): `knownHexIds` = Regiões abertas.

## O que continua secreto

Ordens enquanto planejadas; mão de Manobras; Ambições; postura defensiva antes da resolução; RNG; a descoberta (`kind`) de uma Região só para quem a revelou; carga de transporte naval; tratados e ofertas de outros; pesquisa, recursos e Graus de rivais; conteúdo de Região fechada (terreno, camp spawn, povos).

## Testes de privacidade

`tests/alpha-privacy.test.ts` (camada A só topologia, Pátria fechada → aberta, tudo público no mapa, nada privado), `tests/alpha-world.test.ts` (reveal público e imediato, Região aberta não vira de novo), `tests/alpha-ux-round-1.test.ts`, `tests/alpha-discoveries.test.ts`, `tests/alpha-push.test.ts` (SSE: version-only, 403/401).

## Bugs encontrados e corrigidos

- O CSS dava `padding` de 398 px ao `<svg>` do mapa com o Inspector aberto: o mapa encolhia e saía do centro (causa da câmera "espremida"). Removido; o Inspector é gaveta sobre o mapa.
- Capital no centro da Pátria denunciava o hex: agora num hex externo.
- Seletores de teste por sufixo de `aria-label` (`1,4` casava com `-1,4`).
- Explorar uma Região já aberta por outra ordem na mesma rodada falhava a Ordem: agora só avisa.

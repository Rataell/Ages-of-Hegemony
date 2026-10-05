# Pátrias públicas — alinhamento CODE ↔ canon V5.1b FINAL v11 (2026-10-05)

- `HOMELANDS_PUBLIC = true`: todas as Pátrias abertas no primeiro snapshot (terreno, capital, Pioneiros, peças, estruturas, propriedade, civilização); Regiões de fronteira fechadas até alguém explorar; aberta, pública para sempre.
- `capitalHex`: hex real da Pátria, o centro quando o terreno comporta cidade (sempre nas Pátrias autoradas), senão sorteio determinístico pela seed entre os hexes externos elegíveis (Planície primeiro). Nenhuma lógica de esconder posição.
- Ver não é Contato: `refreshKnowledge` separa visibilidade de mesa de Contato diplomático. Contato = peça/cidade a 1 hex de peça/cidade/hex do outro (ou missão de influência). Teste: `tests/alpha-patrias-public.test.ts`.
- População de cidade rival continua privada (`visibleCities[].population = null`); Cofre, alocação, Ordens, mão, Ambições, RNG, postura, carga naval e tratados seguem privados.
- Pátrias de 2p passaram a vizinhas (5 hexes): com 10 hexes e uma Região fechada no meio, os bots só se encontravam em 1/4 das partidas. Ver `../v51b-shared-table/PATRIAS.md`.
- Consequência: a capital no centro não tem Região fechada adjacente; o Pioneiro caminha até a borda da Pátria (rodada 1, todos veem) e explora na rodada 2.

## Primeiro snapshot e latência (SSE preservado, `scripts/alpha-multiwindow.mjs`)

| Janela | Mesa | Regiões abertas / fechadas | Capitais visíveis | Contatos no início | Amostras | save → push (ms) | save → DOM média (ms) | máx (ms) |
|---|---|---|---|---|---|---|---|---|
| 1280x720 | 2p | 2 / 28 | 2 | 0 | 5 | 14 | 165 | 270 |
| 1280x720 | 4p | 4 / 26 | 4 | 0 | 15 | 18 | 201 | 301 |
| 1280x720 | 6p | 6 / 24 | 6 | 0 | 23 | 20 | 302 | 754 |
| 1366x768 | 2p | 2 / 28 | 2 | 0 | 7 | 11 | 139 | 207 |
| 1366x768 | 4p | 4 / 26 | 4 | 0 | 15 | 13 | 189 | 357 |
| 1366x768 | 6p | 6 / 24 | 6 | 0 | 23 | 19 | 318 | 700 |

Capturas por mesa e tamanho (`1280x720/` e `1366x768/`): 01 primeiro segundo · 02 Pátrias abertas + fronteiras fechadas · 03 Pátrias dos outros · 04b Pioneiros andando visto por todos · 05a/05b antes/depois da primeira exploração em outra janela · 07 peças movidas · 04 cidade nova · 06 inspector sem deslocar o mapa · 08 mapa parcialmente descoberto · 09 Mesa · 10 Focar.

## Regressões encontradas

- Rate limit: o refresh por push de 6 janelas estourava os 120 req/min de leitura por sessão. Leituras agora têm cota própria (600/min) e o cliente coalesce rajadas em uma leitura a cada 200 ms.
- Exploração só a partir da rodada 2 (a capital no centro não encosta em Região fechada).
- Testes dependentes de geometria ou de visão por raio reescritos (war-access, bandos, privacidade).

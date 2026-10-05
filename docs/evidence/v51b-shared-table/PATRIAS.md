# Pátrias públicas, capital dentro da Pátria: distâncias e ritmo de contato

Capital = centro da Pátria (o hex gerado; hexIds[0]) sempre que o terreno comporta uma cidade (nas Pátrias autoradas é Planície); senão sorteio determinístico pela seed entre os hexes externos elegíveis, Planície primeiro. Nada é escondido nem deslocado por privacidade.

## Geometria (seeds 1–12)

| mesa | capital↔capital mais próxima (mín / média) | capital↔capital média | Pátria↔Pátria |
|---|---|---|---|
| 2p | 5 / 5 | 5 | 5 hexes entre centros (vizinhas no anel) |
| 4p | 5 / 5 | 8 | 5 (vizinhas) e 10 (opostas) |
| 6p | 5 / 5 | 7,6 | 5 |

Antes (capital num hex externo, Pátrias a 60°/180°): 2p 9–10, 4p 5–10, 6p 5. A 2p passou de posições opostas (10) para vizinhas (5): com 10 hexes e uma Região fechada no meio, os bots só se encontravam em 1 de 4 partidas em 35 rodadas.

## Ritmo (bots competentes, 35 rodadas; "—" = não aconteceu)

| mesa | 1º Contato (rodada) | 1ª fronteira compartilhada | 1º combate jogador × jogador | 1ª cidade adicional | partidas |
|---|---|---|---|---|---|
| 2p | 12,7 (3/6) | 8 (2/6) | — | 12 (3/6) | 6 |
| 4p | 6,5 (4/4) | 10,7 (3/4) | — | 5,8 (4/4) | 4 |
| 6p | 7,8 (4/4) | 13,3 (4/4) | — | 6,3 (4/4) | 4 |

Leitura: ver a Pátria não cria Contato (testado); o Contato exige proximidade (peça ou cidade a 1 hex) ou missão de influência. Nenhuma guerra nas rodadas 1–2 (contato mais cedo: rodada 6). Os bots não escoltam nem exploram em direção ao rival (sem exército, V51B-16); as sessões humanas/UI com `--contact=forced` seguem sendo o teste de contato e combate. 4p/6p são naturalmente mais apertadas que 2p apenas em número de vizinhos; a 2p a distância é a mesma (5).

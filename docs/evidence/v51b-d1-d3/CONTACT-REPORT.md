# V51B-12 — playtest de UI com contato forçado (2026-10-05)

Driver: `scripts/alpha-ui-playtest.mjs --contact=forced` (só cliques, QUICK 21 rodadas). Servidor: `ALPHA_PLAYTEST_LOG=1 npm run dev:alpha`.

| Mesa | Opções | 1º contato | 1º tratado | 1ª guerra | 1º combate jogador × jogador |
|---|---|---|---|---|---|
| 2p warrior × builder | sem mapa revelado | nunca | — | — | — |
| 2p warrior × builder | `--reveal` | r6 | — | r8 | nenhum |
| 4p warrior, builder, diplomat, expansionist | natural | r5 | r6 (8 no driver) | r6 | nenhum |
| 6p + warrior, trader | natural | r3 | r5 | r6 | **r12** (7 combates PvP) |

Achados:

- Contato em 2p só acontece com o mapa revelado: com um Explorador e uma Ordem de Expedição por rodada, descobrir e atravessar 9 hexes não cabe em 21 rodadas. Isso apoia a mudança Colono/Mesa pública (o jogador vê onde o outro está).
- Em todas as mesas o assento 1 (Aurélia, warrior) foi o alvo dos Bandos: 17–20 assaltos decisivos sem defensor, cidade N1, população 2, Ânimo médio < 1, Prestígio 0–4; o builder (Valgard) nunca foi atacado e fez 20–21 de Prestígio. Mesmas seeds, mesmo mapa: os Acampamentos de abertura ficam mais perto de uma capital (V51B-16).
- Sem exército nenhum assento atacou: o warrior não consegue mobilizar (capital de 2 habitantes sem Disponível).
- Screenshots: `ui-contact-*/shots` (A: milestones; PvP no 6p). Fricção local fora do git.

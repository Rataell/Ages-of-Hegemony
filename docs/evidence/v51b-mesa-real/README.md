# V5.1b — Mesa real (dev:alpha, 2 seats, "Mapa revelado")

Captured by `node scripts/alpha-v51b-shots.mjs` against `npm run dev:alpha` through the real HTTP boundary and two Chromium windows
(1366×768 and 1440×900). `run.json` lists the viewport checks (no global scroll in every shot) and the command log.

| File | What it shows |
|---|---|
| `01-mesa-faixa-*` | Mesa after round 1: Faixa with one Ressonância socket filled, map protagonist, tray with one gold CTA |
| `02-tabuleiro-*`, `03-teia-detalhe-*`, `04-heranca-*`, `04b-governo-lider-*` | Tabuleiro da Civilização: sockets, Reserva, Teia 40+10, Herança I/II/III, Identidade, Líder, Governo from the projection |
| `05-cidade-elevar-*` | City card with the three Elevar conditions |
| `06-ameaca-mapa-*` | Acampamento on the map (Ameaça numeral) |
| `09-virada-de-era-*` | Era-turn panel, real step ("Passo 7 de 9"), marching Bandos with dashed heading |

Combat preview/result are not in this set: the bot's army never reached an attack inside the Era-turn window, and the one battle
that happened was against a world Bando outside the captured panel. The engine-seeded combat shots are in `docs/evidence/v51b-ui/`
(`09-combate-previa`, `10-combate-resultado`).

# Alpha V1.2 — Lane C: Mundo (Pioneiro e água, navios, mares, costas, topologia)

Branch `stabilize/alpha-v1.2-audit` (base RC4). Auditoria **somente leitura**: nada em `packages/` ou `apps/` foi alterado, sem `npm run compile`, sem commit/push/deploy. Tudo o que foi criado é novo:

| Arquivo | Papel |
| --- | --- |
| `scripts/lib/alpha-world-invariants.mjs` | Scanner de invariantes (estado e projeção do servidor), drivers de partida, varreduras exaustivas e cenários sintéticos |
| `scripts/alpha-world-invariants.mjs` | CLI do scanner (matriz preset × jogadores × sementes × modos) |
| `scripts/lib/alpha-world-topology.mjs` | Medição de topologia (componentes de SEA, água navegável, terra) e lista `PROPERTIES` |
| `scripts/alpha-world-topology.mjs` | CLI do relatório de topologia (3 tamanhos de mapa) |
| `tests/v12-audit-pioneer-water.test.ts` | Teste do invariante "peça terrestre fora do barco nunca fica em SEA" + REPROs |
| `tests/v12-audit-world-connectivity.test.ts` | Validador de conectividade por preset (GUARD passa; FINDING com `it.fails`) |
| `docs/evidence/v12-lane-c/` | Dados brutos (`world-connectivity.json`, `scan/<PRESET>/pioneer-water-scan.{json,log}`) |

Convenção dos testes: `GUARD` = vale hoje e a auditoria **preserva**. `it.fails('… REPRO …')` = o defeito existe hoje; o teste fica verde enquanto o defeito existir e fica **vermelho quando for corrigido** — é o sinal para trocar por `it(...)`.

## 1. Veredito

1. **Não há bug de estado que ponha um Pioneiro (ou qualquer peça terrestre fora de barco) em `SEA`.** 108 partidas (4 presets × 2/4/6 jogadores × 3 sementes × 3 modos, 8 rodadas), **31 508 comandos**, o estado inteiro varrido **após cada comando** (inclui 617 sondas ilegais, 1 286 entradas de fronteira com todas as orientações legais, 194 movimentos em grupo, 83 EMBARK, 55 DISEMBARK, 99 descobertas navais): **0 violações de peça**. Mais a varredura exaustiva Região fechada × hex × orientação legal pelo `resolveFrontierMove` real: **2 670 casos a pé + 202 navais, 0 violações**.
2. O que o jogador vê como "Pioneiro na água" tem **quatro causas reais**, nenhuma é peça em SEA:
   - **COAST é terra e água** (`alpha-water.ts:1-7`) e a UI pinta COAST como água (cor, glifo e textura iguais ao mar) — a peça fica *legalmente* num hex que *parece* mar (UX-2).
   - **WORLD-11 (BUG, alta):** povos independentes, Acampamentos (e Piratas) são posicionados no terreno **provisório** (rotação 0) de Regiões fechadas; ao virar a Região o terreno muda e o povo/acampamento acaba **no mar** (ou o pirata **em terra**). Reproduz em partida normal de bots.
   - **WORLD-10 (RULE):** reivindicar território dentro de uma Região ainda fechada fixa a orientação em rotação 0, revela o hex e deixa um Pioneiro andar numa Região "fechada" (peça sobre um cartão virado para baixo).
   - **Lagos:** não existe terreno lago, mas existem ~5 corpos d'água navegáveis de 1-6 hexes por mapa (tamanho de uma poça) onde o motor deixa construir Porto e lançar navios (RULE-2), além de "costas para lugar nenhum" (RULE-1/WORLD-1).
3. Geografia: as quatro promessas dos presets quebram em escala (ver §5): oceano da CONTINENTAL partido em 7-10 corpos em **100 %** dos mundos; INLAND_SEA com ilhotas de jazida em **92 %**; ARCHIPELAGO com corredor de terra entre Pátrias em **75 %**; ilhotas inalcançáveis a pé. Garantias que **valem** e foram preservadas: Regiões de 7 hexes, rotação que mantém jazidas e terreno já observado, Pátrias intocadas, metal a ≤ 2 Regiões, uma massa de terra comum onde o preset promete.

## 2. Terreno: o que `COAST` e `SEA` significam hoje

| Terreno | Peça terrestre pisa | Navio entra | Fonte |
| --- | --- | --- | --- |
| `SEA` | não (`canEnter` falso; `disembarkBlock` recusa) | sim | `alpha-military.ts:44-47`, `alpha-water.ts:5-7`, `alpha-naval.ts:73-80` |
| `COAST` | **sim** (`isLandTerrain`) | **sim** (`isNavigableTerrain`) | `alpha-water.ts:5-9` |
| demais | sim | não | idem |

- Existem **duas** definições de "porto": `isPort` (`alpha-naval.ts:31-34`: COAST **ou** vizinho de água navegável; usada para recrutar navios, bloqueio, piratas) e `harborHex`/`isCoastalCity` (`alpha-water.ts:22-27`: exige **aresta compartilhada** com água navegável; usada no Distrito Marítimo). Divergem numa COAST sem vizinho d'água (RULE-1).
- Nenhuma das duas olha o **tamanho** do corpo d'água: uma poça de 1 SEA + 2 COAST vale como mar (RULE-2).
- Terreno de Região fechada em `state.core.map` é o da **rotação 0 provisória**; só vira definitivo quando alguém revela (`revealRegion`, `alpha-world.ts:197`) ou quando a orientação é "fixada" por ter peça, dono de hex ou revelação (`regionOrientationFixed`, `alpha-world.ts:122-124`).

## 3. Tarefa 1 — Pioneiro e água

### 3.1 Invariante e escopo da varredura

`scanState` (em `scripts/lib/alpha-world-invariants.mjs`) roda após **cada** comando aceito (hook em `box.apply`, a mesma API que a política de bots do servidor usa) e checa: peça terrestre sem carrier em SEA/UNKNOWN; navio fora de água navegável; carrier pendurado/inexistente, em outro hex, que não transporta, acima da capacidade; peça fora do mapa; cidade em água; povo independente/Acampamento em SEA e Pirata em terra; melhoria/estrada em SEA; terreno já visto que muda; Região ≠ 7 hexes; rotação divergente do terreno; Região fechada com peça/hex possuído; empilhamento acima do limite. `projectionScan` compara o que `alphaPlayerView` (servidor) manda a cada assento com o estado autoritativo.

Drivers: (a) política de bots real em todos os assentos; (b) *wanderer* semeado nos assentos pares (movimentos legais aleatórios, entradas de fronteira com **todas** as orientações legais, grupos de até 3 peças na mesma casa, EMBARK/DISEMBARK, frotas com carga, mais **sondas ilegais** que os validadores precisam recusar); (c) `frontierSweep` (cada Região fechada × hex × orientação legal pelo `resolveFrontierMove`, a pé e por mar); (d) `cargoScenarios` (naufrágio, resgate, ida-e-volta embarcar/desembarcar); (e) `raceScenario` (duas civilizações entram na mesma Região no mesmo turno com orientações diferentes, por comandos e READY reais); (f) `entitySweep` (cada Região com povo/acampamento × cada orientação que um jogador pode escolher).

### 3.2 Matriz de casos (resultado)

| # | Caso | Onde no motor | Resultado |
| --- | --- | --- | --- |
| 1 | MOVE comum, rota por hexes conhecidos, cada peça validada com seu terreno | `alpha-military.ts:65-84` (`canEnter` por peça e por passo) | OK; 617 sondas "entrar em SEA conhecido" recusadas |
| 2 | MOVE de fronteira (entrar em Região fechada) | `alpha-frontier.ts:118-153`, `resolveFrontierMove :155-165` | OK; 2 670 + 202 casos exaustivos, 0 peça fora do terreno |
| 3 | Orientação ilegal em fronteira | `entryRotations :97-105`, `planFrontierMove :148` | OK com várias orientações (recusa); **com uma só orientação a ordem é aceita e a rotação enviada é ignorada** (por desenho: aplicada automaticamente) |
| 4 | Revelar/rotacionar Região | `alpha-world.ts:197-212` | OK: terreno já observado nunca muda, 7 hexes, jazida preservada nas 6 rotações (GUARD G1/G2) |
| 5 | EXPLORE legado | `alpha-world.ts:212-221`; fila recusa em `alpha-turn.ts:144` | OK (a peça não se move) |
| 6 | EMBARK / DISEMBARK | `alpha-naval.ts:54-90` | OK; desembarque em SEA recusado ("Desembarque em terra") |
| 7 | Naufrágio / perda do transporte | `settleCargo`, `alpha-naval.ts:95-116` | Sem peça flutuando nem carrier pendurado; **mas perde peça que poderia ficar numa COAST** (RULE-3) |
| 8 | Transporte com a frota movendo | `alpha-phases.ts:140`, `settleCargo` | OK |
| 9 | Descoberta (Perigo remove o descobridor; Âncoras etc.) | `alpha-discoveries.ts:55-70`, `resolveFrontierMove` | OK (Perigo some com a peça por regra; não deixa carga pendurada: `settleCargo` roda depois) |
| 10 | Movimento em grupo (várias peças, mesmo caminho) | `validateMilitaryOrder` valida cada peça; fronteira exige mesmo hex de partida e pior mobilidade | OK; 194 grupos |
| 11 | Pilha / limite | `alpha-stack.ts` | OK; só avisos de pilhas herdadas (SOFT) |
| 12 | Recuo/avanço de combate (anfíbio) | `alpha-combat.ts:154-166, 242` (`canEnter` do recuo; avanço só para o alvo validado) | OK por leitura e pelos 108 jogos |
| 13 | Corrida: duas civs, mesma Região, orientações diferentes | `alpha-phases.ts:138-167` | OK: a 2ª ordem falha limpa ("A Região já havia sido revelada…"), a peça fica onde estava, nunca em SEA. Custa a ação da 2ª civ (UX-4) |
| 14 | Recrutar, Pioneiros iniciais, herança, fundar | `alpha-military.ts:19-41`, `alpha-world.ts:63`, `alpha-kits.ts:123-146`, `alpha-cities.ts` | OK (`SEA` recusado em fundar; herança só em terra) |
| 15 | Projeção servidor × estado | `apps/server/src/alpha-projection.ts:65-69` | Nenhuma peça sem hex projetado, nenhum terreno divergente; **mas** hexes de Região fechada chegam ao dono (UX-1) |
| 16 | Desenho web de peças | `apps/web/app/play/hex-map.tsx:505-540` | Carga embarcada não é desenhada (selo "carga N"); peça em COAST desenhada no centro de um hex pintado como água (UX-2) |

## 4. Matriz de achados

Classes: BUG / RULE / BALANCE / UX / WORLD / LEGACY. Severidade: Alta (quebra regra ou estado, frequente), Média, Baixa. Frequências medidas com 6-16 sementes × 2/4/6 jogadores × {criação, Regiões todas viradas}.

| ID | Classe | Sev. | Achado | Repro (preset · semente · jogadores · passo) | Causa (arquivo:linha) | Correção mínima | Teste de regressão |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **WORLD-11** | **BUG** | **Alta** | Povo independente / Acampamento termina em **SEA** (Pirata em terra) quando a Região fechada em que foi posto é virada. 27 % dos povos (118/432) e 17 % dos acampamentos (48/288) iniciais têm alguma orientação legal que os afoga; 90 % dos mundos MISTO, 87 % ARQUIPÉLAGO, 97 % MAR INTERIOR, 20 % CONTINENTAL | MISTO · 1 · 4 jog. · Pioneiro em −4,1 entra em −3,1 com rotação 2: `independent-2` (−2,2, Região 11) vira SEA. Em partida: MISTO · 2 · 2 jog. rodada 5 (`independent-2` em −2,3); MISTO · 3 · 2 jog. rodada 4 (`camp-r1-e1-n1` em −1,−1) **só com bots**; CONTINENTAL · 2 · 4 jog. rodada 9 (`pirate-r5-e304-n3` em MOUNTAINS −6,9) | `alpha-world.ts:72` (povos escolhidos em terreno de rotação 0, também de Região fechada), `:75` e `alpha-threats.ts:54-57` (Acampamento/Pirata em hex "não visto"); `alpha-world.ts:122-124` `regionOrientationFixed` ignora povos/ameaças; `alpha-frontier.ts:87` e `alpha-world.ts:162` (`keepsKnown`) só protegem terreno **observado** | Tratar o hex de povo/Acampamento (terra) e de Pirata (água navegável) como terreno "conhecido" em `profileOf` (`alpha-frontier.ts:80-95`) e `explorationAccess` (`alpha-world.ts:147-165`), excluindo as rotações que o tirariam do terreno certo; alternativa de gerador: só colocar nesses hexes o centro da Região (rotação-invariante, PLAINS) | `tests/v12-audit-pioneer-water.test.ts` › `it.fails('WORLD-11 REPRO …')` (inclui partida real e `entitySweep`) |
| WORLD-10 | RULE | Média | `CLAIM_HEX` aceita hex de Região **ainda fechada**: fixa a orientação em rotação 0 sem Descoberta, torna o hex visível ao dono e o Pioneiro anda numa Região "fechada" (peça em cartão virado para baixo). Ocorre em toda partida (bots reivindicam na rodada 3-5) | ARQUIPÉLAGO · 2 · 2 jog. · rodada 5 `MANAGE` do p1, hex −1,−3 (Região 9); MISTO · 2 · 4 jog. · rodada 3 `pioneer-1-2` em −2,4 (Região 17, fechada) | `alpha-unit-options.ts:126` (`free` inclui qualquer hex), `territory-commands.ts:41-50` (sem checagem de Região aberta), `alpha-world.ts:93` (hex possuído é visível), `:122-124` (dono fixa orientação) | Recusar claim em hex de Região em que `regionOpenFor(actor)` é falso (em `alphaClaimOptions` e no comando) | `it.fails('WORLD-10 REPRO …')` |
| RULE-1 | RULE | Média | `isPort` (recruta navios) e `harborHex` (Distrito Marítimo) discordam numa COAST sem vizinho d'água ("costa para lugar nenhum"): navio lançado num hex cercado de terra | MISTO · 1 · 2 jog.: 2 costas isoladas (Padrão: MISTO 93 %, MAR INTERIOR 82 %, ARQUIPÉLAGO 47 % dos mundos; CONTINENTAL 4 %) | `alpha-naval.ts:31-34` (`terrain === 'COAST'`) × `alpha-water.ts:22-27`; `launchHex` cai no hex da cidade `alpha-naval.ts:46-52` | Uma só definição: `isPort = harborHex !== null` | `it.fails('RULE-1 REPRO …')` e teste MECHANICS |
| RULE-2 | RULE | Média | Porto e navios aceitam **poça** (corpo navegável de 1-6 hexes) como mar. no MISTO e na CONTINENTAL 34-47 % dos cais possíveis de um mapa dão para poças (ARQUIPÉLAGO 13-18 %, MAR INTERIOR 25-32 %); capital da Pátria 1 na CONTINENTAL tem cais num corpo de mediana 2 hexes (16/20 ≤ 6) | MISTO · 1 · 2 jog.: 22 hexes de cais só-poça; `harborHex`/`launchHex` aceitam | `alpha-water.ts:22-27`, `alpha-naval.ts:46-52` (sem tamanho/conexão) | `harborHex`/`isPort`/`launchHex` exigem corpo navegável ≥ 7 hexes (BFS por rodada, cache); Pátria sem cais real ver WORLD-2 | `it.fails('RULE-2 REPRO …')` + `MECHANICS … pond` |
| WORLD-2 | WORLD | Média | MISTO e CONTINENTAL: uma Pátria ativa só alcança poças (MISTO 4p 63 %, 6p 75 % dos mundos; CONTINENTAL 4p/6p 53 %) | MISTO · 4 · 2 jog. com Regiões viradas: Pátria 1 só cais num corpo de 6 | templates `alpha-regions.ts:10-17` (Pátrias 1/4/6 com costa mínima) e `alpha-presets.ts:92-93` (CONTINENTAL troca COAST por PLAINS) | Gerador: garantir corpo ≥ 7 a ≤ 3 hexes da capital (ou aceitar e tratar WORLD-2 só como informação, se RULE-2 for corrigido) | `it.fails('WORLD-2 REPRO …')` |
| WORLD-3 | WORLD | Média | CONTINENTAL promete "oceano real" na borda; o anel é **8-11 corpos separados** (100 % dos mundos nos 3 tamanhos; 12-19 hexes de borda secos) | CONTINENTAL · 1 · 2 jog. | `alpha-presets.ts:87` (jazida nunca é escavada, inclusive na borda), `:91` (MOUNTAINS na borda ficam), Pátria ativa na borda intocada | Escavar a borda a SEA mesmo com jazida/montanha, ou mover a jazida do template; ou assumir "costa recortada" e corrigir o texto do preset | `it.fails('WORLD-3 REPRO …')` |
| WORLD-4 | WORLD | Baixa | CONTINENTAL: ilhotas desconectadas da "grande massa" (26 % Padrão, 31 % Compacto, 47 % Amplo) | CONTINENTAL · 1 · 2 jog.: massas de 160 e 1 hex | mesma escavação de borda | Reconectar ou converter ilhotas de 1 hex | `it.fails('WORLD-4 REPRO …')` |
| WORLD-5 | WORLD | Média | MAR INTERIOR: jazidas ficam como **ilhotas no meio do mar** (92 % Padrão, 94 % Compacto, 97 % Amplo; ≈ 2-3 hexes secos nos 19 do centro); metal alcançável só por navio | MAR INTERIOR · 1 · 2 jog.: `−1,−1` MOUNTAINS+METAL, `0,−2` HILLS+METAL, `2,−1` MOUNTAINS+METAL | `alpha-presets.ts:87` e `:97` | Escavar também a jazida do mar central (ou mover a jazida para fora do disco) | `it.fails('WORLD-5 REPRO …')` |
| WORLD-6 | WORLD | Baixa | MAR INTERIOR: fragmentos de terra < 1 Região (36 % Padrão, 47 % Compacto, 48 % Amplo) | MAR INTERIOR · 2 · 2 jog.: fragmento de 1 hex | escavação do disco central sobre templates com costa | Idem | `it.fails('WORLD-6 REPRO …')` |
| WORLD-7 | WORLD | Média | ARQUIPÉLAGO promete "sem corredor de terra", mas duas Pátrias dividem massa de terra em **75 %** dos mundos Padrão (55 % Compacto, 70 % Amplo); hexes de jazida e montanha formam as pontes; COMPACTO 9 % e AMPLO 4 % dos mundos viram **uma única** massa | ARQUIPÉLAGO · 3 · 2 jog. com Regiões viradas | `alpha-presets.ts:77` (estreito de 1 hex) × `:87` (jazida não escavada) | Escavar o estreito mesmo sobre jazida | `it.fails('WORLD-7 REPRO …')`; G7 só passa no Padrão (`--sizes=COMPACT,WIDE` no CLI mostra a falha) |
| WORLD-8 | WORLD | Baixa | ARQUIPÉLAGO: uma Pátria sem cais real a ≤ 3 hexes (1/96 mundos, 6p) | ARQUIPÉLAGO · 3 · 6 jog. com Regiões viradas, Pátria 3 | estreitos nunca tocam Pátria ativa (`alpha-presets.ts:75-79`) | Garantir um estreito junto a cada ilha de Pátria | `it.fails('WORLD-8 REPRO …')` |
| WORLD-9 | WORLD | Baixa | ARQUIPÉLAGO: 2-3 ilhotas < 7 hexes por mundo (96 % Padrão, 64 % Compacto, 88 % Amplo), inalcançáveis a pé | ARQUIPÉLAGO · 1 · 2 jog.: 3, 2 e 1 hex | corte por estreito em Regiões vizinhas | Fundir ilhotas < 7 ou aceitar como recife (mensagem ao jogador) | `it.fails('WORLD-9 REPRO …')` |
| WORLD-1 | WORLD | Baixa | "Costa para lugar nenhum": COAST sem vizinho navegável (Padrão: MISTO 93 %, MAR INTERIOR 82 %, ARQUIPÉLAGO 47 %, CONTINENTAL 4 % dos mundos; Compacto/Amplo na mesma faixa, Amplo ≈ 3 por mapa); é a origem de RULE-1 | MISTO · 1 · 2 jog.: 2 | templates `alpha-regions.ts` (`PCSSCCP`, `PCSCCFP`…) + cortes dos presets deixam COAST órfã | Converter COAST isolada em PLAINS na etapa do preset | `it.fails('WORLD-1 REPRO …')` |
| RULE-3 | RULE | Baixa | Naufrágio num hex **COAST** (terra) perde peças que poderiam ficar: 2 Pioneiros a bordo, frota afundada em COAST → 1 salvo na vizinha, 1 perdido | cenário `sunk-on-coast-with-land` em qualquer mundo (ARQUIPÉLAGO · 2 · 4 jog.) | `alpha-naval.ts:106-112` procura "costa livre vizinha" e salva só 1 peça | Se o hex do naufrágio é terra (`isLandTerrain`), desembarcar tudo no lugar, sujeito a `stackBlock` | `it.fails('RULE-3 REPRO …')` |
| UX-1 | UX | Média | O servidor projeta ao dono o terreno de hexes dentro de Regiões fechadas (consequência de WORLD-10) e a web desenha esses hexes e a peça **por cima** do cartão virado para baixo (tiles são desenhados depois de `region-backs`) | ARQUIPÉLAGO · 2 · 2 jog. · rodada 6 (`PROJECTION_CLOSED_REGION_TERRAIN`); MISTO · 2 · 4 jog. · rodada 3 (`PROJECTION_UNIT_IN_CLOSED_BOARD`) | `alpha-projection.ts:65` (`visibleTerritory`), `alpha-world.ts:93`; `hex-map.tsx:302-345` | Resolver WORLD-10; defesa: a projeção não manda hex de Região `closed` | `it.fails('UX-1 REPRO …')` |
| UX-2 | UX | Média | COAST (terra) é pintada **igual à água**: `--coast #3f6d7c` × `--sea #264a5c` (mesmo azul-petróleo), mesmo glifo `≈`, mesma textura; a peça fica no centro do hex → "Pioneiro na água" | qualquer Pioneiro em COAST | `apps/web/app/design/tokens.css:51-52`, `play/hex-map.tsx:93-94`, `style.css:761-766`, peças `hex-map.tsx:512` | COAST com franja de areia/terra e glifo próprio; base de terra sob peça terrestre em COAST; tooltip "Costa (terra e água)" | sem teste automático (visual): verificar com screenshot `alpha-art-shots.mjs` |
| UX-3 | UX | Baixa | `explorationHints` (`coast`, `biome`) e a decisão de ANCHORAGE leem o terreno provisório (rotação 0): a dica pode estar errada depois de virar (leitura de código, não medido) | — | `alpha-discoveries.ts:17, 27, 85-100` | Calcular dica/ANCORADOURO sobre a união das rotações legais | — |
| UX-4 | UX | Baixa | Quem perde a corrida pela mesma Região gasta a ação à toa | cenário `raceScenario` | `alpha-phases.ts:145, 167` | Mensagem já existe; opcional: devolver a ação | — |
| BALANCE-1 | BALANCE | Baixa | Acesso a recursos por Pátria dentro de 1 Região: sem Peixe — CONTINENTAL 4p 69 %, 6p 75 % dos mundos; sem Pedra — ARQUIPÉLAGO 6p 44 %, CONTINENTAL 4p 38 %. Metal: **0 falhas** (garantia preservada) | CLI `alpha-world-topology.mjs` (`noFishR1Pct`, `noStoneR1Pct`) | Pátrias 2/3/5 sem costa nos templates; CONTINENTAL troca COAST por PLAINS; estreitos escavam colinas | Medir como regra de aceite do gerador; sem decisão de design | — |
| LEGACY-1 | LEGACY | Baixa | Atlas sem `art`: cargas embarcadas contadas como peças comuns no hex de mar | modo `!art` | `hex-map.tsx:521-540` | Filtrar `carrierId` também nesse ramo | — |

## 5. Tarefa 2 — Geografia e presets

### 5.1 Medidas (Padrão 30 Regiões; 16 sementes; criação e Regiões viradas; médias por mundo)

Corpo navegável = componente conexo de COAST+SEA (a verdade do motor). Poça = corpo de ≤ 6 hexes. Massa de terra inclui COAST.

| Preset · jogadores | SEA hexes | corpos SEA | corpos navegáveis | maior corpo nav. | poças | cais em poça | costas p/ nenhum lugar | massas de terra | fragmentos < 7 | Pátrias na mesma massa |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MISTO · 2 | 14 | 9,1 | 6,8 | 20,7 | 4,7 | 35 % | 1,5 | 1 | 0 | 100 % |
| MISTO · 4 | 14 | 9,4 | 7,6 | 16,2 | 5,4 | 43 % | 1,4 | 1 | 0 | 100 % |
| MISTO · 6 | 14 | 9,1 | 6,8 | 18,8 | 4,8 | 39 % | 1,3 | 1 | 0 | 100 % |
| CONTINENTAL · 2 | 50 | 8,3 | 8,6 | 18,6 | 5,1 | 34 % | 0,1 | 1,2 | 0,2 | 100 % |
| CONTINENTAL · 4 | 48 | 9,6 | 9,2 | 17,1 | 5,9 | 40 % | 0 | 1,3 | 0,3 | 100 % |
| CONTINENTAL · 6 | 46 | 11,4 | 10,7 | 15,1 | 7,3 | 47 % | 0,1 | 1,3 | 0,3 | 100 % |
| ARQUIPÉLAGO · 2 | 52 | 6,7 | 5,1 | 55,3 | 3,4 | 17 % | 0,6 | 5,4 | 2,4 | 31 % |
| ARQUIPÉLAGO · 4 | 47 | 7,6 | 5,3 | 52,5 | 3,4 | 18 % | 0,6 | 4,3 | 2,2 | 28 % |
| ARQUIPÉLAGO · 6 | 57 | 7,2 | 5,1 | 52,1 | 2,6 | 13 % | 0,4 | 4,5 | 1,8 | 13 % |
| MAR INTERIOR · 2 | 29 | 7,8 | 6,2 | 33,8 | 4,3 | 32 % | 1,2 | 1,4 | 0,4 | 100 % |
| MAR INTERIOR · 4 | 30 | 8,2 | 5,8 | 32,8 | 3,5 | 25 % | 1,0 | 1,5 | 0,5 | 100 % |
| MAR INTERIOR · 6 | 28 | 9,0 | 6,6 | 28,6 | 4,2 | 31 % | 1,1 | 1,2 | 0,2 | 100 % |

Leitura: **só o ARQUIPÉLAGO tem um mar de verdade** (maior corpo 52-55 hexes). MISTO tem apenas poças (maior corpo ≈ 16-21 hexes, ≈ 5 poças por mapa, nenhum "oceano" — por desenho "baías e lagos dos templates", mas o motor os trata como mar); CONTINENTAL promete oceano na borda e entrega 8-11 corpos de ~15 hexes; MAR INTERIOR tem um corpo central (G6 passa) mas com ilhotas de jazida. Compacto (24) e Amplo (43) repetem o padrão (`docs/evidence/v12-lane-c/world-connectivity.json`); o Amplo duplica poças (≈ 10 por mapa) e costas para nenhum lugar (≈ 3).

Distância entre capitais (hexes, mínimo por mundo): 2p 10, 4p 7, 6p 5 no Padrão (Compacto 2p 11 / 4p 5; Amplo 14/10/7). Nenhuma Pátria isolada de terra nos presets de continente; metal ≤ 2 Regiões em 100 % (**0** falhas nos 2 048 mundos medidos: 16 sementes × 2/4/6 (Compacto 2/4) jogadores × criação e viradas × 3 tamanhos).

### 5.2 Classificação do problema reportado ("mar × lagos × costa × massas de terra")

- **Topológico (principal):** corpos d'água desconexos tratados como o mesmo "mar" (MISTO/CONTINENTAL: 5-7 poças por mapa; oceano da CONTINENTAL partido; jazidas furando mar e estreito); massas de terra fragmentadas por ilhotas < 7 hexes (CONTINENTAL 22-30 % dos mundos com ilhota < 7 hexes, MAR INTERIOR 25-48 %, ARQUIPÉLAGO 88-95 %); Pátrias com água só em poça (MISTO/CONTINENTAL 53-75 %).
- **Mecânico:** o motor não tem conceito de "corpo navegável" — `isPort`, `harborHex`, `launchHex`, entrada naval de fronteira e a auditoria `auditWorld` (`alpha-world-audit.ts:44-49`, mede só `largestSea` de SEA, não de água navegável) tratam qualquer COAST/SEA como mar (RULE-1, RULE-2). Não há problema de embarcar (EMBARK exige hex adjacente, e DISEMBARK não pisa em SEA).
- **Visual:** COAST desenhada como água (UX-2); hex de Região fechada visível por cima do cartão (UX-1).
- **Não é** um bug de posição de peça (§3).

### 5.3 Propriedades de conectividade propostas (implementadas em `PROPERTIES`)

| ID | Preset(s) | Tipo hoje | Propriedade |
| --- | --- | --- | --- |
| G1 | todos | GUARD | Toda Região tem exatamente 7 hexes distintos |
| G2 | todos | GUARD | Uma Região mantém suas jazidas nas 6 rotações (jazida viaja com o terreno) |
| G3 | todos | GUARD | Pátrias ativas ficam em rotação 0 com terreno autoral |
| G4 | todos | GUARD | Metal a ≤ 2 Regiões de cada Pátria ativa |
| G5 | MISTO, CONTINENTAL, MAR INTERIOR | GUARD | Todas as Pátrias ativas na mesma massa de terra |
| G6 | MAR INTERIOR | GUARD | O mar central é um só corpo |
| G7 | ARQUIPÉLAGO | GUARD (Padrão) | ≥ 2 massas de terra |
| F1/F2 | todos | FINDING | Sem COAST sem vizinho navegável; `isPort ⇔ harborHex` |
| F3 | todos | FINDING | Cais só em corpo navegável ≥ 7 hexes |
| F4 | MISTO, CONTINENTAL | FINDING | Nenhuma Pátria ativa só com poça por perto |
| F5/F6 | CONTINENTAL | FINDING | Anel de oceano único; uma só massa de terra |
| F7/F8 | MAR INTERIOR | FINDING | Disco central sem hex seco; sem fragmentos < 7 |
| F9/F10/F11 | ARQUIPÉLAGO | FINDING | Sem corredor de terra entre Pátrias; cada Pátria com cais real ≤ 3 hexes; sem ilhotas < 7 |

Propostas por preset: **ARQUIPÉLAGO** — ≥ 1 corpo navegável que toque todas as costas de Pátria (F10) e nenhuma ponte de terra (F9); **CONTINENTAL** — o anel externo é um único corpo (F5) ou o preset passa a se chamar "Continente com baías"; **MAR INTERIOR** — o disco central todo água (F7); **MISTO** — não promete mar: basta F1/F2/F3 (poças existem mas não são mar).

## 6. O que foi preservado (garantias medidas, 0 falhas)

Regiões de 7 hexes e footprint contíguo (G1); rotação preserva jazidas e terreno observado (G2; `TERRAIN_MUTATED` e `METAL_NOT_PRESERVED` = 0 em 2 872 reveladas); Pátrias ativas intocadas (G3); acesso a metal (G4); Pátrias na mesma massa onde o preset promete (G5); entrada de fronteira só por orientação que faz o hex de entrada pisável (0 peça fora do terreno); Distrito Marítimo exige aresta d'água (RULE-1 só mostra a discordância com `isPort`).

## 7. Como reproduzir

```
node scripts/alpha-world-invariants.mjs --presets=MIXED --seeds=1,2,3 --rounds=8 --modes=bots,wander,naval   # matriz (≈ 6 min por preset)
node scripts/alpha-world-topology.mjs --seeds=16                                                              # medidas e propriedades (≈ 70 s)
npx vitest run tests/v12-audit-pioneer-water.test.ts tests/v12-audit-world-connectivity.test.ts              # ≈ 35 s
```

Pré-requisito: pacotes compilados (`packages/*/dist`, `apps/server/dist`) como no RC4; nada foi recompilado nesta auditoria.

## 8. Limites

- UX-2, UX-3 e LEGACY-1 foram **lidos no código/CSS**, não renderizados; recomenda-se checar com `scripts/alpha-art-shots.mjs`.
- O *wanderer* cobre a pé, por mar e grupos, mas combate anfíbio/naufrágio por combate só foi exercitado por leitura de `alpha-combat.ts` e pelos cenários sintéticos de `settleCargo` (nenhum jogo com guerra naval ocorreu nas 108 partidas).
- Ordem de grandeza de WORLD-11 em campo: 8 povos, 1 Acampamento e 1 Pirata fora do terreno certo nas 108 partidas de 8 rodadas (≈ 1 a cada 11 partidas).
- Não há decisão de design nova aqui: as correções acima são mínimas; as de gerador (WORLD-2…9) pedem decisão de produto antes de mexer nos números travados do baseline V5.1a.

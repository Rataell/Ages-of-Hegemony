# Alpha V1.2 — Lane E: Ameaças, nomenclatura e legado

Branch `stabilize/alpha-v1.2-audit` (baseline RC4). Auditoria somente leitura: nenhum arquivo de `packages/` ou `apps/` foi alterado, sem compile, sem commit. Artefatos novos: este documento, `scripts/alpha-threat-audit.mjs`, `docs/evidence/v12-audit/lane-e/`.

## 0. Resumo executivo

1. **Ameaças (BALANCE/RULE, alta).** O Bando em marcha é **imortal e estático**: chega adjacente à cidade, ataca a cada rodada ímpar para sempre e nunca recua nem morre. Nas 22 partidas medidas, as **77 ameaças que atacaram fizeram 967 assaltos (média 12,6 por ameaça), todos na mesma cidade, 0 em peça isolada**; o mundo venceu 93% (903). A discrepância "55 assaltos × 12 eventos de spawn/marcha" (semente 1, 2 jogadores) é isso: 4–5 ameaças atacando o mesmo alvo a cada rodada ímpar (§2.2).
2. **O canal de dano é o Ânimo, não o hex bloqueado.** Cada vitória do mundo tira 1 de Ânimo da cidade; não há recuperação natural; Ânimo ≤ 1 = Revolta (cidade não produz, só aceita Governar). Três vitórias levam uma cidade de Estável (4) a Revolta. Hex bloqueado custa só 0–19 Alimento por jogador na partida inteira (≤ 2,3% do Alimento das Eras I–II); Revolta chega a 25–43% das cidades já nas Eras IV–V quando o controle sem ameaças tem 0–2% (QUICK 2p).
3. **Economia inicial:** Era I não é afetada (nenhuma ameaça parte antes da primeira Virada de Era). O primeiro assalto cai na rodada 5–7 (QUICK), 7–10 (STANDARD), 7–11 (EPIC), isto é, **na Era II**. Em 2 jogadores a produção de Alimento da Era II cai 27–53% contra o controle sem ameaças (3 sementes) quando a cidade está desguarnecida; em 4 jogadores a queda é 2–7%. **Não é inviabilidade estrutural nas Eras I–II, mas a partir da Era III uma cidade desguarnecida entra em Revolta e a economia desmonta.** Ressalva: os bots matam 0 acampamentos em 54 partidas e defendem com 1–3,5 de Defesa contra 7–12 de Ataque; o jogador humano pode defender, mas defender custa caro (§2.6).
4. **Fix mínimo (F-T1)** — o Bando volta ao seu Acampamento (`homeHexId`, campo hoje nunca lido) depois de assaltar e só parte de novo na próxima Virada de Era. Emulado no harness (6 partidas): assaltos 26→11 (QUICK 2p) e 44→15 (STANDARD 2p); cidades em Revolta 25%→5% (controle 0,3%) e 29%→21% (controle 19%, que é piso estrutural de Ânimo fora da lane); população final +31% / +14%.
5. **Nomenclatura:** "Bárbaro" aparece em só **3 textos visíveis** (Descoberta CAMP: `alpha-threats.ts:56,59`, `alpha-discoveries.ts:72`). Lista exata de 26 mudanças em §3, nenhuma aplicada; nenhum teste afirma sobre "Bárbaro" e os 4 asserts de "Acampamento" continuam válidos. Risco real: rótulos de ameaça duplicados em 5 lugares (F-N1).
6. **Thalos / nomes antigos:** **LEGADO, não bug vivo.** Fonte provável dos screenshots: sala v1.1 reaberta em leitura (`alpha-shell.tsx:219` renderiza o tabuleiro com a capital congelada "Farol de Thalos" ao lado do nome novo "Nórdicos"). Segunda fonte, só em dev: Local Play em `/` com `names[]` hardcoded (`local-maps.ts:10`). Nenhum caminho de produção emite o nome antigo numa partida v1.2 nova (§4).

## 1. Método e limites

- Harness: `scripts/lib/alpha-bots.mjs` `playMatch` (compile **não** reexecutado; usei os `dist/` existentes). Script novo `scripts/alpha-threat-audit.mjs` (`run` e `summary`), instrumentando o gancho `scenario('round-start')` para medir, a cada rodada, o rendimento real de cada cidade contra o rendimento com os Bandos recolocados em `CAMPED` (contrafactual exato de `hexBlockedByThreat`), mais ameaças vivas, rotas suspensas, Ânimo e relatório econômico.
- Matriz: **presets QUICK=21, STANDARD=35, EPIC=49 rodadas** (o "49" do pedido é o EPIC: 7 Eras × 7 rodadas; `alphaRules` em `game-domain/src/alpha.ts:60`) × 2/4/6 jogadores × sementes 1–3 × {com ameaças, controle sem ameaças (limpa `state.threats` a cada início de rodada)}. Concluído: 2p e 4p com 3 sementes; 6p com sementes 1–2 (QUICK) e 1 (STANDARD, EPIC), porque o 6p custou 4–10 min por partida com a máquina carregada. Mais 6 partidas com o fix emulado (2p, QUICK e STANDARD, sementes 1–3). Total 50 arquivos JSON em `docs/evidence/v12-audit/lane-e/runs/`.
- Limites: persona `competent`, defesa dos bots fraca, `kills = 0` (nenhum bot destruiu um acampamento); n=1–3 por célula, então tratar percentuais como ordem de grandeza. O contraste "com × sem ameaças" inclui a reação dos bots (recrutar, atacar), não só o dano direto. Naval/rotas quase não foram exercitados (rotas máx. 1 por partida).
- Reproduzir: `node scripts/alpha-threat-audit.mjs run --seed=1 --players=2 --preset=STANDARD [--control|--fix=retreat]` e `node scripts/alpha-threat-audit.mjs summary` (gera `docs/evidence/v12-audit/lane-e/summary.md`).

## 2. Tarefa 1 — Ameaças

### 2.1 Mapa das regras (como o código funciona hoje)

| Tema | Regra implementada | Onde |
|---|---|---|
| Tipos | `CAMP` (terrestre) e `PIRATE` (naval); estados `CAMPED` e `MARCHING`; nível I–III; `fresh` (RECÉM-SURGIDO) | `game-domain/src/alpha-threats.ts:9-24` |
| Força | Nível I = 2 Infantaria; II = 3 Infantaria + 1 Arqueiros (Cavalaria a partir da Era III); III = 4 Infantaria + 1 Cavalaria (+1 Cerco a partir da Era V). Pirata nível N = N Frotas. Todas as peças da ameaça têm **Grau I fixo** (`threatPieces`, `alpha-threats.ts:278`). Poder de ataque base: I = 4, II = 8 (9 com Cavalaria), III = 11 (12 com Cerco) | `game-domain/src/alpha-threats.ts:26-35`, `unit strength` do catálogo |
| Teto | Acampamentos = jogadores + 2; Piratas = ⌈jogadores/2⌉ + 1. Acima do teto, SPAWN vira REFORÇO | `engine/alpha-threats.ts:25`, `:101-113` |
| Abertura | 2 Acampamentos criados na geração do mundo, fora da vista, a 3–5 hexes de uma cidade, já maduros (`fresh=false`); `threatsSpawned` zerado | `alpha-world.ts:75`, `alpha-threats.ts:49-66` |
| Surgimento depois | **Só por eventos**: Pulso do Mundo `wp-migration-wave` (SPAWN terrestre) e `wp-unstable-routes` (SPAWN pirata); preço da Repercussão Pedra e Metal (SPAWN terrestre) e Comércio (SPAWN pirata); Descoberta `CAMP` (10% das Regiões); REFORÇO via Confluência 2 | `alpha-concept.ts:260-261`, `alpha-resonance.ts:101,103,133`, `alpha-discoveries.ts:71-73` |
| Crescimento | Só na **Virada de Era** (passo 4): todo Acampamento parado sem peça/cidade de jogador a ≤ 2 hexes ganha +1 nível | `alpha-threats.ts:116-124`, `alpha-era-turn.ts:104` |
| Maturação | Acampamento novo fica vulnerável (não parte) até passar uma rodada de Planejamento completa | `alpha-threats.ts:127`, `alpha-phases.ts:376` |
| Lançamento | `CAMPED` → `MARCHING` **somente** (a) na Virada de Era (passo 4, `launch:true`), (b) Pulso `wp-raiders` "Bandos em marcha", (c) Confluência 1. Todos os Acampamentos maduros com alvo partem **juntos** | `alpha-threats.ts:209-216`, `alpha-concept.ts:247`, `alpha-resonance.ts:129` |
| Movimento | `MARCHING` age **nas rodadas ímpares** na Manutenção (1 hex; 2 hexes se Cavalaria nível ≥ II), mais na Virada de Era se ainda não agiu na rodada | `alpha-phases.ts:288`, `alpha-threats.ts:203,213` |
| Alvo | terrestre: cidade alcançável mais próxima, menor defesa, maior valor; pirata: rota marítima mais longa, senão porto com menos Frotas | `alpha-threats.ts:162-192` |
| Chegada | Se o próximo hex é cidade ou tem peça de jogador: **Assalto** (`break`: o Bando **não anda mais nesse turno e fica parado onde está**). Sem lutadores no hex e fora de cidade: elimina as peças expostas (Pioneiro, Enviado, Explorador) sem teste | `alpha-threats.ts:225-238`, `:249-255` |
| Pilhagem | Bando que **entra** em hex com melhoria de jogador a destrói; pirata adjacente a porto tira até 2 Riqueza do dono por ativação; toda rota que cruza o hex é suspensa | `alpha-threats.ts:240-247`, `:257-267`, `:269-272` |
| Efeito sobre produção | `hexBlockedByThreat`: hex ocupado por Bando **em marcha** não rende em Produzir; o Produtor desse hex vira ocioso (rende ½ Alimento) | `alpha-threats.ts:274`, `alpha-city.ts:93,106-107` |
| Dano do Assalto | vitória do mundo ⇒ **Ânimo da cidade −1** (`alpha-threats.ts:340`), mata peças defensoras, pode abalar a fortificação. Cidade nunca é capturada. Ânimo ≤ 1 = **Revolta ⇒ capacidade 0, a cidade não produz e só aceita Governar** (`alpha-city.ts:19,61`, `alpha-urban.ts:53`). Não há recuperação natural de Ânimo, só Governar/Templo | `alpha-threats.ts:340`, `alpha-government.ts:89` |
| Recompensa | só quando o Acampamento morre ainda `CAMPED` (nível+1 Riqueza, nível−1 Prestígio; nível III abre a carta Despojos). Matar Bando em campo **não paga nada** | `alpha-threats.ts:296-306` |
| Piratas | surgem só se alguma cidade tem Porto; marcham sobre rotas marítimas e portos | `alpha-threats.ts:57-65,169-192` |
| Povos Independentes | 3 por mundo (Aldeia, Vila, Cidade-estado), fixos, sem movimento e **sem relação mecânica com ameaças**. 6 ações (`TRADE`, `NEGOTIATE`, `INFLUENCE`, `PROTECT`, `INTEGRATE`, `CONQUER`); `HOSTIL` apenas bloqueia comércio e influência | `alpha-independents.ts:13-105`, `alpha-world.ts:62-73` |

### 2.2 O mistério "55 THREAT_ASSAULT vs 12 eventos de spawn/marcha" (semente 1, 2 jogadores, 35 rodadas)

**Não é bug de contagem; é um comportamento de regra.** Cada THREAT_ASSAULT é um *ataque de uma ameaça já em marcha*, não um surgimento. Os 12 eventos eram: 3 `THREAT_SPAWNED` + 1 `THREAT_REINFORCED` + 3 `THREATS_GREW` + 5 `THREAT_MARCHING` (4 na Virada da Era I, 1 na Era VI). As 4–5 ameaças que existiram assaltaram sempre o mesmo alvo:

| ameaça | assaltos | rodadas | hex alvo | vitórias do mundo | ataque médio × defesa média |
|---|---|---|---|---|---|
| `camp-r1-e1-n1` | 17 | 9,10,11,13,15,17,19,20,21,23,25,27,29,30,31,33,35 | −4,−2 (cidade de p2) | 17 | 15,3 × 1,5 |
| `camp-r2-e69-n4` | 17 | idem | −4,−2 | 17 | 5,8 × 1,0 |
| `camp-r1-e1-n2` | 15 | 11 → 35 | −4,−2 | 15 | 6,0 × 1,0 |
| `camp-r1-e28-n3` | 4 | 10,11,13,15 | 4,2 (cidade de p1) | 0 (repelido) | 6,0 × 9,8 |
| `camp-r25-e898-n4` | 2 | 33,35 | −4,−2 | 2 | 19,0 × 1,0 |

Mecanismo: (1) o Bando chega adjacente à cidade e ataca (`actThreat`, `break`); (2) **nada o remove**: não há retirada, dispersão, tempo de vida nem limite de ataques, e o `homeHexId` existe no esquema mas **nunca é lido** (`grep homeHexId` ⇒ só a gravação em `newThreat`); (3) só jogador matando-o poderia tirá-lo, mas matar Bando em campo não rende recompensa (`alpha-threats.ts:296-297`), então o incentivo é zero; (4) a cada rodada ímpar ele ataca de novo (`alpha-phases.ts:288`). 46 dos 55 assaltos caíram em rodada ímpar; os 9 pares são a Virada de Era nas rodadas 10, 20 e 30 que faz o Bando agir **duas rodadas seguidas** (10→11, 20→21, 30→31).
### 2.3 Quantas ameaças, quando, quão fortes (medido)

Fonte: `docs/evidence/v12-audit/lane-e/summary.md` (seções A e B). Média das sementes, partidas com ameaças.

| preset | jog. | spawns após a abertura (telemetria) | ameaças que marcharam | assaltos | assaltos por jogador | assaltos por ameaça | destruídas pelo jogador |
|---|---|---|---|---|---|---|---|
| QUICK 21 | 2 | 1,7 | 3,3 | 26,3 | 13,2 | 7,9 | 0 |
| QUICK 21 | 4 | 1,3 | 2,7 | 23,0 | 5,8 | 8,6 | 0 |
| QUICK 21 | 6 | 4,5 | 5,5 | 41,5 | 6,9 | 8,3 | 0 |
| STANDARD 35 | 2 | 1,3 | 3,3 | 43,7 | 21,9 | 13,1 | 0 |
| STANDARD 35 | 4 | 2,3 | 3,7 | 39,0 | 9,8 | 10,6 | 0 |
| STANDARD 35 | 6 | 2,0 | 4,0 | 58,0 | 9,7 | 14,5 | 0 |
| EPIC 49 | 2 | 1,7 | 3,3 | 68,3 | 34,2 | 20,5 | 0 |
| EPIC 49 | 4 | 1,3 | 2,7 | 59,0 | 14,8 | 22,1 | 0 |
| EPIC 49 | 6 | 4,0 | 6,0 | 48,0 | 8,0 | 8,0 | 0 |

Leituras:

- **Frequência:** a população de ameaças é basicamente os 2 Acampamentos de abertura + 1–4 surgidos por evento (Pulso, preço de Repercussão, Descoberta). O teto (jogadores + 2) quase nunca é atingido, então **a pressão por assento cai com o número de jogadores**: 2 jogadores recebem ~2× os assaltos por assento de 4–6 (21,9 contra 9,7–9,8 em STANDARD).
- **Surgimento por Era (STANDARD 2p):** spawns/reforços 1,0 (Era I), 0,3, 0, 0, 0,3, 0, 0; crescimentos (+1 nível, só na Virada) ≈0,2 por Era. As ameaças vivas ficam em 2,5–3,0 Acampamentos o jogo todo; Piratas existiram em 8 de 22 partidas.
- **Força:** composição só muda por nível (I = 4, II = 8–9, III = 11–12 de Poder base) e, em Era, apenas troca Arqueiros→Cavalaria (Era III) e adiciona Cerco (Era V). Peças sempre Grau I. Ataque total medido: 7–8 (Era II, 2p), 10–12 (Eras III–VII, 6p). **Não há escalonamento por Era**; a defesa do jogador cresce por Graus e Teia, então a ameaça é perigosa só entre as Eras II e IV.
- **Primeiro assalto:** rodada 5–7 (QUICK), 7–10 (STANDARD), 7–11 (EPIC). Todos os Acampamentos maduros **partem juntos na primeira Virada de Era** (4 de uma vez na semente 1): onda sincronizada, previsível e que cai toda no mesmo vizinho mais próximo (na semente 1, 4 das 5 ameaças foram sobre a mesma cidade de p2).
- **Resultado dos assaltos (967):** mundo vence 903 (93,4%: 767 decisivas + 136 vitórias); defesa vence 64 (53 empates táticos, 9 vitórias, 2 decisivas). Defesa média por assalto 1,0–3,5 contra ataque 7–12 em todas as Eras: **os bots quase não defendem** (limite do harness).
- **Pilhagem/rotas/emboscada:** `THREAT_PILLAGE`: 1–7 eventos acumulados nas 3 sementes por configuração; `THREAT_AMBUSH` (peças expostas mortas) 1 evento em 22 partidas; rotas suspensas: 33 rodadas-rota em 4 de 22 partidas, nunca mais de 1 rota existente. **Rotas e pilhagem são marginais** (e mal exercitadas pelos bots).

### 2.4 Perda de produção por ameaça (números)

Duas medidas independentes (`summary.md` D, C, F, G):

**(a) Direta: hex bloqueado (`hexBlockedByThreat`).** Por jogador, na partida inteira: Alimento perdido 1,1–19,2 (2p STANDARD 8,3; 2p EPIC 19,2; 6p STANDARD 8,5; 4p QUICK 1,8), Riqueza+Madeira/Pedra/Metal 0–18,0. **Eras I–II: 0 a 2,7 Alimento por jogador (0–2,3% da produção).** Hexes bloqueados por rodada 0,0–0,9, concentrados nas cidades atingidas (cidades afetadas/rodada = hexes bloqueados, ou seja, um hex por cidade). O número pode ser **negativo** (ex.: −0,11 Alimento/rodada, QUICK 2p Era II): o Produtor do hex bloqueado vira ocioso e rende ½ Alimento (`alpha-city.ts:106-107`), mais que um hex de floresta/colina; ver F-T7.

**(b) Indireta: Ânimo → Revolta (o canal real).** Percentual de cidades em Revolta por Era, com ameaças × controle sem ameaças:

| config | Era II | Era III | Era IV | Era V | Era VI | Era VII |
|---|---|---|---|---|---|---|
| QUICK 2p | 0 × 0 | 11,1 × 0 | 25,0 × 1,9 | 42,9 × 0 | 38,1 × 0 | 40,5 × 0 |
| STANDARD 2p | 1,6 × 0 | 17,9 × 1,2 | 28,9 × 0 | 41,3 × 18,6 | 46,3 × 45,0 | 48,8 × 55,0 |
| STANDARD 6p (n=1) | 3,1 × 0 | 10,7 × 5,0 | 22,7 × 0 | 34,2 × 13,8 | 43,8 × 15,0 | 62,5 × 12,5 |
| EPIC 2p | 14,4 × 10,3 | 37,0 × 17,6 | 36,1 × 55,0 | 55,5 × 70,0 | 57,3 × 76,4 | 55,6 × 85,0 |

Duas conclusões: (1) em QUICK a Revolta é causada quase só por ameaça (0–2% sem ameaça); (2) **em STANDARD/EPIC o controle sem ameaças também desce a 45–85% de Revolta nas Eras VI–VII**: há um problema estrutural de Ânimo independente das ameaças (o Ânimo nunca se recupera sozinho; só Governar/Templo) que deve ser tratado na lane de economia (F-T2b). As ameaças antecipam e agravam esse colapso nas Eras III–V.

**(c) Ponta a ponta (com × sem ameaças, mesmas sementes).** Produção de Alimento por jogador nas Eras I–II / população e cidades no fim da Era II:

| config | Alimento Eras I–II | pop fim Era II | cidades fim Era II |
|---|---|---|---|
| QUICK 2p | 27,8 × 32,8 (−15%) | 8,2 × 9,5 | 2,0 × 2,7 |
| STANDARD 2p | 61,7 × 86,3 (−29%) | 10,7 × 14,8 | 2,2 × 2,8 |
| STANDARD 4p | 60,8 × 62,7 (−3%) | 11,8 × 11,9 | 2,3 × 2,6 |
| STANDARD 6p (n=1) | 64,8 × 81,7 (−21%) | 10,5 × 12,5 | 2,5 × 2,7 |
| EPIC 2p | 105,0 × 121,8 (−14%) | 14,5 × 15,3 | 2,8 × 3,0 |

Era I isolada é idêntica nos dois braços em 11 de 18 pares (sem ação de ameaça; nos demais os bots divergiram por RNG/reação a Acampamentos visíveis); a diferença nasce **na Era II**, onde o corte por semente em STANDARD 2p é −53% (5 assaltos), −27% (3) e −29% (3). Partida inteira, 2p: Alimento produzido por jogador cai de 266 → 129 (QUICK, −51%) e de 418 → 260 (STANDARD, −38%). Esse contraste inclui a reação dos bots e o piso estrutural de Ânimo, então o efeito puro das ameaças é menor que o número bruto, mas a direção e a ordem de grandeza são claras.

### 2.5 A economia inicial (Eras I–II) fica estruturalmente inviável?

**Não nas Eras I–II em geral; sim em risco a partir da Era II em 2 jogadores, e sim a partir da Era III para qualquer cidade sem guarnição.**

- Era I: zero ação de ameaça; nenhum Acampamento parte antes da primeira Virada de Era (`alpha-threats.ts:213` + `alpha-era-turn.ts:104`).
- Era II: onda inicial chega; 2p perde 27–53% do Alimento da Era; 4p perde 2–7%.
- Era III em diante: três vitórias do mundo levam uma cidade a Revolta; ela só retorna com Governar (1 ação principal, custo de Influência), enquanto o Bando continua atacando a cada rodada ímpar. É uma espiral: a cidade desguarnecida nunca sai da Revolta.
- O que um jogador humano pagaria para evitar isso (benchmark `bandBenchmark`, 600 tiros por célula, Grau I, sem tecnologia; `docs/evidence/v12-audit/lane-e/band-benchmark.json`):

| Bando | defensores (Infantaria) | sem muralha: defesa vence / empate / bando vence | com Paliçada | com Muralha de Pedra |
|---|---|---|---|---|
| Nível I (Poder 4) | 2 | 31% / 64% / 5% | 64% / 35% / 1% | 82% / 19% / 0% |
| Nível I | 3 | 90% / 10% / 0% | 97% / 3% / 0% | 100% / 1% / 0% |
| Nível II Era II (Poder 8) | 3 | 0% / 49% / 51% | 6% / 54% / 41% | 24% / 53% / 23% |
| Nível II Era II | 4 | 35% / 52% / 13% | 61% / 34% / 6% | 81% / 18% / 2% |
| Nível II Era III+ (Cavalaria) | 4 | 16% / 60% / 24% | 40% / 48% / 12% | 56% / 37% / 8% |
| Nível III Era V+ (Poder 11–12) | 4 | 0% / 8% / 92% | 0% / 1% / 99% | 0% / 8% / 92% |

  Cada defensor custa 1 Alimento + 2 Madeira/Pedra e **1 Alimento de manutenção por rodada** (catálogo), e ocupa 1 habitante no papel Soldado (regra V5.1a: "1 Soldado por unidade terrestre básica"). Defender de verdade uma cidade de pop 4–6 contra um Nível II exige 4 Soldados + Paliçada, isto é, **a maior parte da população**. Atacar o Acampamento antes de ele partir é viável só com 4–6 Infantaria contra Nível I e 6+ contra Nível II (benchmark de ofensiva), e é a única ação que paga recompensa.

### 2.6 Povos Independentes e `INDEPENDENT_ACTION`

Sem relação mecânica com Ameaças: 3 povos fixos (Aldeia, Vila, Cidade-estado) criados no mundo (`alpha-world.ts:62-73`), imóveis, 6 ações (`alpha-independents.ts:118`). A atitude `HOSTIL` só bloqueia comércio e influência; nunca ataca. Isso confirma a decisão de nomenclatura: **Povos Independentes não são Saqueadores** e a UI não deve misturá-los (em `alpha-board.tsx:234-235` já são painéis separados). Observações: o número é fixo (3) mesmo com 6 jogadores (WORLD, baixa); `INDEPENDENT_ACTION` só é válido em Planejamento (`independentBlock`).

## 3. Tarefa 2 — Nomenclatura: sair de "Bárbaro"

### 3.1 Estado atual (varredura completa)

Varredura de `Bárbaro|Barbar|barbarian` em `apps/`, `packages/*/src`, `tests/`, `e2e/`, `scripts/`, `prisma/`, `openspec/`, `docs/` (fora de `docs/evidence`): **13 linhas em 7 arquivos; só 3 estão em código de produção e são texto visível**. Nada em `apps/web`, nenhum teste afirma sobre "Bárbaro". Bruto: `docs/evidence/v12-audit/lane-e/grep-barbaro-all.txt`, varredura de termos correlatos em `grep-nomenclature-src.txt`.

Os 3 textos visíveis ao jogador:

1. `DISCOVERY_NAMES.CAMP = 'Acampamento Bárbaro'` — aparece como prefixo do evento de Descoberta (`alpha-discoveries.ts:39` monta `${DISCOVERY_NAMES[kind]}: …`), ou seja, no log/Painel "Região revelada".
2. `DISCOVERY_INFO.CAMP.effect = 'Surge um acampamento bárbaro na região.'` — Compêndio (`alpha-compendium.tsx:14`) e painel da Região.
3. `say('um acampamento bárbaro se esconde na região.')` — mensagem do evento de Descoberta.

Os demais termos (Bando, Acampamento, Piratas, Povo independente) são visíveis e espalhados em 4 pontos da UI + 12 do motor/domínio, **sem fonte única**: `THREAT_NAMES` (domain) é export morto, `threatName()` (engine) e três cópias literais em `apps/web` repetem as mesmas strings. Isso é o principal risco de a renomeação ficar pela metade (ver F-N1).

Já existe base canônica: `docs/product/canonical-terminology-v4.md:40-41` define **"Povo independente"** (assentamento neutro; *não é* bando) e **"Bando saqueador"** (força neutra hostil). A proposta abaixo apenas normaliza a UI a essa terminologia.

### 3.2 Proposta de vocabulário (visível)

| Conceito | Hoje (visível) | Proposto | ID interno (não muda) |
|---|---|---|---|
| Origem territorial, parada | `Acampamento` / `Acampamento Bárbaro` (só Descoberta) | **Acampamento de Saqueadores** | `ThreatKind 'CAMP'`, `ThreatStatus 'CAMPED'`, `DiscoveryKind 'CAMP'` |
| Força terrestre em marcha | `Bando`, `Bando em marcha`, `Um bando` | **Bando de Saqueadores** (frase) / **Saqueadores** (título compacto, emblema) | `ThreatStatus 'MARCHING'`, evento `THREAT_*` |
| Ameaça naval | `Piratas`, `Ancoradouro pirata` | **Piratas** / **Ancoradouro pirata** (sem mudança; só unificar) | `ThreatKind 'PIRATE'` |
| Grupos/comunidades diplomáticas | `Povo independente` / `POVO INDEPENDENTE` | **Povos Independentes** (rótulo da categoria) / "Povo Independente" no singular; nunca saqueadores | `state.independents`, `INDEPENDENT_ACTION` |
| Umbrella | `Ameaça I–III`, `Ameaças do Mundo` | manter | — |

Decisão de gramática (para não quebrar concordância das frases do motor): usar **"Bando de Saqueadores"** em frases (masculino singular, os verbos `destruído/atacou/foi repelido` continuam corretos) e **"Saqueadores"** só em títulos curtos/badges. Se o PO preferir "Saqueadores" em todo lugar, é preciso flexionar plural em 4 mensagens (`destruídos`, `atacaram`, `foram repelidos`) — não recomendado.

### 3.3 Lista exata de mudanças (NÃO aplicada)

Legenda: **V** = texto visível; **I** = ID/estrutura interna (não mudar); **C** = comentário/doc interno.

| # | arquivo:linha | de | para | tipo |
|---|---|---|---|---|
| 1 | `packages/game-domain/src/alpha-threats.ts:59` | `CAMP: 'Acampamento Bárbaro'` | `CAMP: 'Acampamento de Saqueadores'` | V |
| 2 | `packages/game-domain/src/alpha-threats.ts:56` | `name: 'Acampamento'` / `effect: 'Surge um acampamento bárbaro na região.'` | `name: 'Acampamento de Saqueadores'` / `effect: 'Surge um acampamento de saqueadores na região.'` | V |
| 3 | `packages/game-engine/src/alpha-discoveries.ts:72` | `'um acampamento bárbaro se esconde na região.'` | `'um acampamento de saqueadores se esconde na região.'` | V |
| 4 | `packages/game-domain/src/alpha-threats.ts:38` | `THREAT_NAMES = { CAMP: { camp: 'Acampamento', band: 'Bando' }, PIRATE: {…} }` | `{ camp: 'Acampamento de Saqueadores', band: 'Bando de Saqueadores', short: 'Saqueadores' }`; **passar a ser a fonte única** | V (hoje export morto) |
| 5 | `packages/game-engine/src/alpha-threats.ts:27` | `threatName()`: `'Acampamento'` / `'Bando'` | ler `THREAT_NAMES` (`'Acampamento de Saqueadores'` / `'Bando de Saqueadores'`) | V |
| 6 | `packages/game-engine/src/alpha-threats.ts:103,108,111` | `label = 'de fronteira'` → "Uma ameaça de fronteira surgiu/se reforçou…" | `label = 'de saqueadores'` | V |
| 7 | `packages/game-engine/src/alpha-threats.ts:222` | `'Um bando partiu'` | `'Um bando de saqueadores partiu'` | V |
| 8 | `packages/game-engine/src/alpha-threats.ts:244` | `Um bando pilhou uma melhoria em …` | `Um bando de saqueadores pilhou uma melhoria em …` | V |
| 9 | `packages/game-engine/src/alpha-threats.ts:252` | `Um bando surpreendeu peças desprotegidas em …` | `Um bando de saqueadores surpreendeu peças desprotegidas em …` | V |
| 10 | `packages/game-engine/src/alpha-threats.ts:305,357` e `alpha-combat.ts:252` | usam `threatName()` | herdam o item 5 (sem edição) | V |
| 11 | `packages/game-engine/src/alpha-era-turn.ts:105` | `` `${grown} Acampamento(s) cresceram; as Ameaças agiram.` `` | `` `${grown} Acampamento(s) de Saqueadores cresceram; as Ameaças agiram.` `` | V |
| 12 | `packages/game-domain/src/alpha-concept.ts:247` | Pulso `'Bandos em marcha'` (id `wp-raiders`) | `'Bandos de Saqueadores em marcha'` (id **não muda**) | V |
| 13 | `packages/game-domain/src/alpha.ts:360` | `'Os bandos de fronteira agora são Acampamentos com Ameaça I–III (regras V5.1b).'` | `'Os bandos de saqueadores de fronteira agora são Acampamentos de Saqueadores com Ameaça I–III (regras V5.1b).'` | V (evento de migração de save) |
| 14 | `packages/game-domain/src/alpha-resonance.ts:101` | `priceText: 'o barulho atrai um Acampamento'` | `'o barulho atrai um Acampamento de Saqueadores'` | V |
| 15 | `packages/game-domain/src/alpha-threats.ts:68` | carta `enc-camp-spoils`: título `Despojos do acampamento` / texto `O acampamento caído…` | `Despojos do acampamento de saqueadores` / `O acampamento de saqueadores caído…` (id **não muda**) | V |
| 16 | `apps/web/app/alpha/alpha-board.tsx:129` | `'Um bando'` | `'Um bando de saqueadores'` (ou importar de `THREAT_NAMES`) | V |
| 17 | `apps/web/app/alpha/alpha-board.tsx:234` | `aria-label`: `'Acampamento'` / `'Bando em marcha'`; eyebrow `'ACAMPAMENTO'` / `'BANDO EM MARCHA'` | `'Acampamento de Saqueadores'` / `'Bando de Saqueadores em marcha'`; `'ACAMPAMENTO DE SAQUEADORES'` / `'SAQUEADORES EM MARCHA'` | V |
| 18 | `apps/web/app/alpha/alpha-board.tsx:235` | `aria-label="Povo independente"`, eyebrow `POVO INDEPENDENTE · …` | sem mudança (já correto); título da aba `Povo` → `Povo Independente` | V (opcional) |
| 19 | `apps/web/app/alpha/alpha-table.tsx:397` | `title`: `'Acampamento'` / `'Bando em marcha'` | `THREAT_NAMES.CAMP.camp` / `'Saqueadores em marcha'` | V |
| 20 | `apps/web/app/alpha/alpha-details.tsx:104` | `'Um bando'` | `'Um bando de saqueadores'` | V |
| 21 | `apps/web/app/play/hex-map.tsx:494` | `<title>`: `'Acampamento'` / `'Bando em marcha'` | idem 19 | V |
| 22 | `apps/web/app/play/hex-map.tsx:493` | `<title>Povo independente (…)` | sem mudança | — |
| 23 | `packages/game-engine/src/alpha-phases.ts:144`, `alpha-concept.ts:30` | `'As Ameaças do Mundo'` / `'Ameaças do Mundo'` | manter (termo guarda-chuva) | — |
| 24 | `docs/product/rules-v5-proposal.md:499` ("Acampamento Bárbaro") e `:589` ("bárbaros" → "saqueadores"); `aoh-core10-addendum-exploration-world-v1.md:98,266`; `aoh-core10-mockups-v1.html:205,962`; `experience-v2/concepts/v5-proposal.html:188,207,236` | `Acampamento Bárbaro` | `Acampamento de Saqueadores` | C (docs de produto; `v5-proposal.html:236` é mockup) |
| 25 | `docs/product/sim/v51b-ressonancia-bandos.py:1` | docstring "barbarian bands" | "raider bands" | C |
| 26 | `docs/product/canonical-terminology-v4.md:40-41` | `Povo independente`, `Bando saqueador` | acrescentar linhas: `Acampamento de Saqueadores`, `Povos Independentes (categoria)` | C |

**IDs que NÃO devem ser renomeados** (compatibilidade de saves/eventos/seeds): `ThreatKind 'CAMP'|'PIRATE'`, `ThreatStatus 'CAMPED'|'MARCHING'`, `DiscoveryKind 'CAMP'`, tipos de evento `THREAT_SPAWNED|REINFORCED|NONE|MARCHING|ASSAULT|PILLAGE|AMBUSH|DESTROYED|BATTLE|GREW`, ids de ameaça `camp-r…`/`pirate-r…`, Pulso `wp-raiders`, carta `enc-camp-spoils`, campos `threats`, `homeHexId`, `independents`, comando `INDEPENDENT_ACTION`, legado `raidBands` (migração em `alpha.ts:348-360`), classes CSS `alpha-raid`, `alpha-threat`, `kind-CAMP`, `status-CAMPED`.

### 3.4 Testes que afirmam sobre strings antigas

Nenhum teste afirma sobre "Bárbaro". Asserts de string tocados pela proposta (todos continuam passando por serem **substring**, desde que se mantenha "Acampamento" no início):

| teste | assert | sobrevive à proposta? |
|---|---|---|
| `tests/alpha-era-turn.test.ts:75` | `summary` do passo 4 `toMatch(/Acampamento/)` | sim (item 11 mantém a palavra) |
| `tests/alpha-snapshot-upgrade.test.ts:64` | `message.includes('Acampamentos')` | sim (item 13: "Acampamentos de Saqueadores") |
| `e2e/interaction-v2.spec.ts:234` | `.ctx-plate` `toContainText('Acampamento')` | sim (item 19) |
| `tests/alpha-ui-coverage.test.ts:35` | `not.toMatch(/Contestar presença\|Ação de povo independente/i)` | sim (não toca esses textos) |

Sem asserts em: `Bando em marcha`, `Bandos em marcha`, `Piratas`, `Ancoradouro pirata`, `THREAT_NAMES`, `DISCOVERY_NAMES`. Os nomes de arquivos de screenshot (`bando-em-marcha`, `acampamento-antes-de-ativar`, `pirata-no-mar` em `e2e/v51b-*.spec.ts`) são só nomes de arquivo (renomear opcional). Testes que mencionam Bando/Acampamento só em `describe/it` (`tests/alpha-threats.test.ts`, `tests/external-threat-fixtures.test.ts`) são títulos, sem assert de texto.

**Testes novos propostos**
- `tests/alpha-nomenclature.test.ts`: (a) varre `DISCOVERY_NAMES`, `DISCOVERY_INFO`, `THREAT_NAMES`, `ENCOUNTER_CARDS`, `WORLD_PULSE_CARDS` e `REPERCUSSION_CARDS` com `not.toMatch(/b[aá]rbar/i)`; (b) `threatName` para os 4 pares kind×status devolve exatamente o contrato de `THREAT_NAMES`; (c) gera uma Descoberta `CAMP` e afirma que o evento não contém "bárbar" e contém "Saqueadores".
- Guarda de lint opcional (`scripts/` ou vitest) que falha se qualquer arquivo em `apps/web/app` ou `packages/*/src` contiver `/b[aá]rbar/i` fora de comentários.

**Achado F-N1 (UX, média):** os rótulos de ameaça são duplicados em 5 lugares (engine `threatName`, domain `THREAT_NAMES` morto, `alpha-board.tsx:234`, `alpha-table.tsx:397`, `hex-map.tsx:494`). Renomear sem consolidar deixa divergência garantida. Correção mínima: `THREAT_NAMES` vira fonte única exportada de `@aoh/game-domain`, engine e web importam; teste de contrato (b) acima.
## 4. Tarefa 3 — Nomes antigos de civilização ("Thalos")

### 4.1 Conclusão

**"Thalos" e os demais nomes fantasia são LEGADO, não um bug vivo do Core 10.** Nenhum caminho de produção que cria uma partida v1.2 emite o nome antigo. Há **uma fonte provável dos screenshots** (sala v1.1 reaberta em modo leitura, com capitais congeladas no snapshot) e **um caminho vivo só em desenvolvimento** (Local Play em `/`, com nomes de jogador hardcoded). O restante são IDs internos (chassis) e docs históricos.

Cronologia: o catálogo antigo (Aurélia, Valgard, Merídia, Thalos, Saren, Kor, Orinth, Nymara, Veyra, Solenne, Dravik, Elyra) foi substituído pelo Core 10 em `1f96810` (2026-10-07 01:42) e as salas v1.1 viraram somente leitura em `ad8799a` (01:44). Antes disso, `CIVILIZATIONS[].name` era "Thalos" e `.capital` era "Farol de Thalos" (confirmado por `git show 1f96810^:packages/game-domain/src/alpha-institutions.ts`).

### 4.2 Por que um jogador ainda pode ver "Thalos"

| # | Origem | Natureza | Alcança partida nova v1.2? | Evidência |
|---|---|---|---|---|
| L1 | **Snapshot de sala v1.1 com `game`** (Postgres `AlphaMatch.snapshot`). A capital é gravada no estado da partida (`core.players[].civilization.cities[].name`) no momento da criação: "Farol de Thalos", "Passo de Valgard", "Celeiro Áureo", "Porto das Margens", "Vale do Concílio", "Forja de Kor", "Mirante de Orinth", "Bosque da Memória", "Ágora de Solenne", "Aqueduto de Dravik". `apps/web/app/alpha/alpha-shell.tsx:219` renderiza `AlphaBoard` para sala legada que tenha `game`, com um toast "somente leitura". O nome da civilização sai novo (`civilizationDisplayName('thalos')` = "Nórdicos"), mas a cidade continua "Farol de Thalos": mistura que parece bug. A Figura também pode ser a legada (`alpha-leaders.ts:52-63`: "Kaelis Orran" etc., `legacy:true`). | **LEGADO** | não (`createAlphaRoom` fixa `contentVersion:'v1.2'`, `alpha-service.ts:119`; `isCore10Chassis` em `alpha-service.ts:209`; `alpha-room.ts:28`) | `docs/evidence/v51b-ui-playtest/run-6p-quick/session.json:3062` mostra "Farol de Thalos" numa partida de 2026-10-05 |
| L2 | **Local Play em `/` (dev only)**: `apps/server/src/local-maps.ts:10` `names = ['Aurélia','Valgard','Merídia','Thalos','Saren','Kor']` vira nome de jogador e de capital da cena `localScenario`. `next.config.ts` redireciona `/` → `/alpha` apenas com `NODE_ENV==='production'`; em `npm run dev` o `/` mostra o GameShell legado; `/api/local` só responde em `development`. `e2e/local-play.spec.ts:195` afirma `civ-brand` "Valgard". | **LEGADO vivo só em dev** | não em produção | `apps/server/src/local-play.ts:35`, `apps/web/next.config.ts` |
| L3 | **Textos de design**: `apps/web/app/design/tokens.json:444` amostra tipográfica "Passo de Valgard" (rota `/design`). | cosmético | não (amostra) | — |
| L4 | **Harness de bots/tests** usam `D.CIVILIZATIONS` (12, incluindo Veyra/Elyra com capital "Encruzilhada de Veyra"/"Escola de Elyra") em `scripts/lib/alpha-bots.mjs:27`. `createAlphaGame` aceita qualquer id de `CIVILIZATIONS`; o corte Core-10 está só na camada de sala/serviço. | **DEBT** de teste | não pelo serviço | `packages/game-engine/src/alpha-world.ts:58,63` |

### 4.3 Onde cada nome antigo ainda existe

| Camada | Ocorrências | Classe | Pode vazar para partida nova? |
|---|---|---|---|
| IDs chassis (`'thalos'`, `'valgard'`…) em `alpha-core10.ts` (`chassis`), `alpha-institutions.ts:6-18`, `alpha-civilization-kits.ts`, `alpha-web.ts:129-146` (heranças `heritage('thalos',…)`), `alpha-leaders.ts:52-63`, `alpha-kits.ts` (54 refs), `table-art.ts:91 CHASSIS_CULTURE`, `alpha-room.ts`, fixtures e testes (~25 arquivos) | ~300 linhas (`docs/evidence/v12-audit/lane-e/grep-oldciv-src.txt`) | **ID interno, intencional** (`alpha-core10.ts:3-6`: "hidden technical id every save, kit, card and heritage still uses") | não: UI usa `civilizationDisplayName`/`core10OfChassis` (`alpha-roster.tsx`, `alpha-civ-board.tsx:137`, `alpha-hand.tsx:37`, `alpha-panels.tsx:164`) |
| Nome exibido "Veyra", "Elyra", "Norvak" (`CIVILIZATIONS[].name`, kits `bibleOnly('norvak',…)` `alpha-civilization-kits.ts:174`, heranças `veyra/elyra/norvak`) | 3 civs fora do Core 10 | **catálogo não jogável em v1.2** | não: `isCore10Chassis` barra seleção e bot (`alpha-service.ts:209,236`); Compêndio e lobby listam `CORE10` (`alpha-compendium.tsx:24`, `alpha-roster.tsx:66`) |
| Líderes fantasia (12) | `alpha-leaders.ts:52-63`, `legacy: isCore10Chassis(...)` | catálogo legado | só em salas v1.1; `leaderOfCivilization` prefere Figura recomendada do Core 10 |
| Capitais antigas | só em snapshots já gravados (não há mais no código; `alpha-institutions.ts:6-18` já tem Hedeby, Atenas…) | **dados persistidos** | não |
| Nomes de jogador/cidade `names[]` | `local-maps.ts:10` | legado dev | só em dev |
| Pools de nomes de cidade | **inexistente**: não há pool; capital vem de `CIVILIZATIONS[].capital` (`alpha-world.ts:58`), nome de cidade nova é digitado (placeholder `Novo Horizonte`, `alpha-table.tsx:70`) | — | não |
| Bots | nome = `Bot N` (`alpha-service.ts:242`) | — | não |
| Prisma | `prisma/schema.prisma`: só `Json snapshot`; nenhuma coluna/enum de civ | — | migração é de dados, não de schema |
| `packages/game-domain/src/snapshots/v2` | sem ocorrência de nomes antigos | — | — |
| Docs | 7–19 docs de produto por nome (`docs/product/*`, `docs/playable-alpha-report.md`, `docs/external-alpha-v1.2-rc2.md:58` "Nórdicos (Thalos)", `naval-audit.md`) | histórico | não (docs) |
| Guardas existentes | `scripts/alpha-lobby-noscroll.mjs:16` `OLD_NAMES` regex falha o smoke se o lobby mostrar nome antigo | proteção | só cobre o lobby |

### 4.4 Tabela de decisão

| Pergunta | Resposta | Classe | Ação |
|---|---|---|---|
| "Thalos" aparece em partida **nova** criada pelo fluxo de produção? | Não. Seleção restrita a `CORE10_CHASSIS`; capital vem de `CIVILIZATIONS[].capital` (novo); Figura obrigatória em v1.2 (`alpha-room.ts:30`) | n/a | nenhuma |
| "Thalos" aparece ao reabrir sala antiga v1.1 com `game`? | Sim, na capital congelada e (se a Figura for legada) no nome da Figura | **LEGADO** | ver proposta P1-P3 |
| "Thalos" aparece em `npm run dev` em `/`? | Sim (nomes de jogador do Local Play) | **LEGADO dev** | P4 |
| `civilizationDisplayName` pode devolver nome antigo? | Não: devolve nome Core 10 ou o literal `'Civilização'` (`alpha-core10.ts:1256`) | — | nenhuma |
| `civilizationKit(id).name` pode devolver "Veyra/Elyra/Norvak" em v1.2? | Só se um estado com essas civs existir (harness/testes) | **DEBT** de harness | P5 |
| Existe bug vivo? | Não encontrado. Risco residual: `createAlphaGame` não impõe o recorte Core 10 (confia na camada de sala) | **RULE/DEBT baixa** | P5 |

### 4.5 Proposta de migração/limpeza (sem alterar Core 10)

- **P1 (UX, média): sala v1.1 com `game` não renderiza o tabuleiro.** Em `alpha-shell.tsx:219`, trocar a condição para `room.game && !room.legacy` e cair em `<LegacyRoom/>` (que já mostra "Civilização da versão 1.1" para civs fora do Core 10 e o nome Core 10 para as demais). Resolve a mistura "Nórdicos + Farol de Thalos" sem tocar em dados. Teste: render de sala `legacy:true` com `game` ⇒ não contém "Farol de Thalos" nem `.alpha-board`; contém `.alpha-lobby-legacy`.
- **P2 (dados, baixa): consulta de inventário** (somente leitura) para saber quantas salas têm nome antigo congelado:
  `select id, status, snapshot->>'contentVersion' cv from "AlphaMatch" where snapshot::text ~ '(Farol de Thalos|Passo de Valgard|Celeiro Áureo|Porto das Margens|Vale do Concílio|Forja de Kor|Mirante de Orinth|Bosque da Memória|Ágora de Solenne|Aqueduto de Dravik)';`
  Não reescrever: `AlphaMatchArchive` já existe para preservar originais, e a regra do projeto é "nunca apagar/reescrever legado" (`alpha-prisma-repository.ts:33-34`). Se o PO quiser limpar, só via migração com arquivamento prévio em `AlphaMatchArchive` (`ARCHIVE_REASON_*`).
- **P3 (opcional): máscara de exibição** `legacyCityName(name)` que, para sala `legacy`, troca as 10 capitais antigas pelo nome histórico atual (Hedeby, Atenas…). Só se o PO quiser manter salas v1.1 visíveis; custo > P1.
- **P4 (baixa): Local Play**: trocar `names` em `local-maps.ts:10` por `CORE10.map(c => c.name)` (ou "Jogador 1…6") e atualizar `e2e/local-play.spec.ts:195`; ou mover o GameShell legado para `/dev/local` e redirecionar `/` para `/alpha` também em dev.
- **P5 (baixa): travar o recorte Core 10 no motor**: em `createAlphaGame`, rejeitar `civilization` fora de `CORE10_CHASSIS` quando `rules.contentVersion` for v1.2 (ou aceitar flag `legacyCatalog:true` para harness). Testes: `createAlphaGame` com `'veyra'` falha; harness de bots passa a usar `CORE10_CHASSIS` (`alpha-bots.mjs:27`).
- **P6 (guarda):** generalizar o `OLD_NAMES` do `alpha-lobby-noscroll.mjs` para um teste vitest que inicia uma sala v1.2 de 6 bots e afirma `not.toMatch(OLD_NAMES)` em todo o JSON da view (`roomView`) — protege lobby, capital, Figura, cartas e eventos.
- **Docs:** acrescentar nota de rodapé "nomes antigos = chassis internos" em `docs/playable-alpha-report.md:28` e `docs/external-alpha-v1.2-rc2.md:58`; não renomear docs históricos.
## 5. Matriz de achados

Classes: BUG, RULE, BALANCE, UX, WORLD, LEGACY. Severidade: Alta, Média, Baixa.

| ID | Classe | Sev. | Achado | Repro | Causa (arquivo:linha) | Correção mínima | Teste de regressão |
|---|---|---|---|---|---|---|---|
| F-T1 | BALANCE/RULE | Alta | Bando em marcha ataca a mesma cidade a cada rodada ímpar, indefinidamente (12,6 assaltos por ameaça; 77/77 nunca mudam de hex; 93% vitórias do mundo) | `node scripts/alpha-threat-audit.mjs run --seed=1 --players=2 --preset=STANDARD`; ver `worldBattles` no JSON: 55 assaltos de 5 ameaças | `alpha-threats.ts:213` (age toda rodada ímpar, sem tempo de vida), `:225-238` (assalto faz `break` e o Bando fica parado), `:296-297` (sem recompensa em campo), `homeHexId` gravado em `:70` e nunca lido | Ao fim de `assault()`: `threat.status='CAMPED'; threat.hexId=threat.homeHexId; threat.fresh=false` (volta ao Acampamento; só parte na próxima Virada). Alternativa: dissolver o Bando após o 1º assalto | Novo teste em `tests/alpha-threats.test.ts`: após um assalto a uma cidade, a ameaça está `CAMPED` em `homeHexId` e `lastActedRound` impede novo assalto até `launch:true`; teste de bot: nenhuma ameaça faz > 1 assalto por Era em 35 rodadas |
| F-T2 | BALANCE | Alta | Cada vitória do mundo = −1 Ânimo; sem recuperação natural; Revolta zera produção; 3 vitórias bastam (4→1) | Mesma partida: de 3/5 cidades em Revolta a partir da rodada 18 | `alpha-threats.ts:340`, `alpha-city.ts:19,61`, `alpha-urban.ts:53`, recuperação só em `alpha-government.ts:89` e Governar | Limitar a perda de Ânimo por ameaça a 1 por cidade por Era, e/ou +1 Ânimo na rodada sem assalto | Teste: 3 assaltos vitoriosos na mesma Era reduzem o Ânimo em no máximo 1 |
| F-T2b | BUG/BALANCE (cross-lane) | Alta | Mesmo **sem ameaças**, 45–85% das cidades estão em Revolta nas Eras VI–VII (STANDARD/EPIC 2p) e 14–22% em QUICK 6p (Eras VI–VII): o Ânimo só desce | `--control`, `summary.md` seção F | `alpha-phases.ts:245,269,276` (perdas por manutenção/sobre-extensão) e `:374` do urbano (−1 por 2 ações), sem recuperação passiva | Encaminhar à lane de economia (Ânimo base/recuperação). Fora do escopo de ameaças | Medir Revolta no controle ≤ 10% até a Era V |
| F-T3 | BALANCE | Média | Defender custa caro: Nível II Era III+ exige 4 Infantaria + Paliçada para ~40% de vitória; Nível I exige 3; cada defensor é 1 habitante Soldado + 1 Alimento/rodada. Bots: Defesa 1–3,5 × Ataque 7–12 | `bandBenchmark` + `summary.md` seção E | Poder fixo por nível (`game-domain alpha-threats.ts:30-35`), peças Grau I | Playtest humano antes de ajustar; se confirmar, Nível II = 2 Infantaria + 1 Arqueiros ou reduzir Poder em Era II | Benchmark: Nível I vs 3 Infantaria+Paliçada ≥ 90% defesa; Nível II vs 4 Infantaria+Paliçada ≥ 60% |
| F-T4 | BALANCE | Média | Ameaça sem escalonamento por Era (Poder 4/8–9/11–12 sempre Grau I); onda sincronizada na 1ª Virada, todas no vizinho mais próximo | `summary.md` seção B, atk médio por Era | `threatComposition` só troca Arqueiros→Cavalaria (Era III) e +Cerco (Era V) | Decisão de design: nível cresce por Era ou o Grau da ameaça sobe com a Teia média; escalonar o lançamento (um Acampamento por Virada) | Teste de composição por Era; teste de lançamento escalonado |
| F-T5 | RULE | Baixa | Cadência depende da paridade da Virada de Era: Viradas em rodada par (10, 20, 30) fazem o Bando agir em rodadas consecutivas (10→11) | seed 1: assaltos nas rodadas 9,10,11 / 19,20,21 / 29,30,31 | `alpha-threats.ts:213` (`lastActedRound >= round`) + `alpha-phases.ts:288` (só rodadas ímpares) | Usar o mesmo gatilho (Manutenção) no passo 4 da Virada em vez de `activateThreats` com `launch:true` para os já em marcha | Teste: Bando em marcha age no máximo 1× a cada 2 rodadas em qualquer preset |
| F-T6 | RULE | Média | Sem incentivo para destruir Bando em campo (recompensa só `CAMPED`); bots: 0 acampamentos destruídos em todas as partidas medidas | `kills 0` em todo `run-log.txt` | `alpha-threats.ts:296-297` | Pagar metade da recompensa por Bando destruído, ou Prestígio mínimo | Teste: Bando destruído em campo paga 1 Riqueza (ou valor decidido) uma vez |
| F-T7 | BUG | Baixa | Bloquear um hex pode **aumentar** Alimento (Produtor ocioso rende ½) | `loss.food` negativo em rodadas com hex bloqueado | `alpha-city.ts:93,106-107` | Hex bloqueado mantém o Produtor alocado (não ocioso) | Teste: cityYield com hex bloqueado ≤ sem bloqueio para todos os recursos |
| F-T8 | BUG | Baixa | `telemetry.threatAttacks` soma assaltos do mundo (`alpha-threats.ts:346`) e ataques do jogador a ameaças (`alpha-combat.ts:244`), embora o schema diga "attacks they made" | leitura de código; nas execuções medidas é igual ao nº de batalhas do mundo porque os bots não atacam ameaças | `alpha-concept.ts:404-405` | Contador separado `threatStrikes` para ataques do jogador | Teste de telemetria: ataque do jogador não incrementa `threatAttacks` |
| F-T9 | WORLD | Baixa | Pressão por assento cai com jogadores (21,9 assaltos por jogador em 2p × 9,7 em 6p, STANDARD); spawns só por evento; teto jogadores+2 nunca atingido | `summary.md` seção A | `alpha-threats.ts:25,101-113` | Spawn adicional na Virada se `acampamentos < ⌈jogadores/2⌉ + 1` | Teste: após a Virada, nº de Acampamentos ≥ piso |
| F-T10 | WORLD | Baixa | Rotas e Piratas quase inertes na simulação (≤ 1 rota por partida, 1 emboscada em 22 partidas); impacto naval não medido | seção 2.3 | `alpha-threats.ts:257-272` | Cenário dedicado com 2 rotas marítimas antes de ajustar | Teste de cenário pirata com rota ativa |
| F-T11 | WORLD | Baixa | Povos Independentes: 3 fixos independente de nº de jogadores; sem interação com ameaças | leitura de código | `alpha-world.ts:62-73` | Nenhuma por ora; manter separado de Saqueadores | — |
| F-N1 | UX | Média | Rótulos de ameaça em 5 lugares, `THREAT_NAMES` é export morto: renomear deixa divergência | §3 | `game-domain alpha-threats.ts:38`, `engine alpha-threats.ts:27`, `alpha-board.tsx:234`, `alpha-table.tsx:397`, `hex-map.tsx:494` | `THREAT_NAMES` como fonte única | `tests/alpha-nomenclature.test.ts` (§3.4) |
| F-N2 | UX | Média | "Acampamento Bárbaro" / "acampamento bárbaro" visível (3 textos) | Revelar Região com Descoberta CAMP | `game-domain alpha-threats.ts:56,59`; `engine alpha-discoveries.ts:72` | §3.3 itens 1–3 | Guarda `not.toMatch(/b[aá]rbar/i)` |
| F-L1 | LEGACY | Média | Sala v1.1 com `game` abre o tabuleiro mostrando capital congelada ("Farol de Thalos") junto ao nome novo ("Nórdicos") | Abrir sala v1.1 salva (ver `tests/fixtures/v11-room.json`) | `alpha-shell.tsx:219` | P1: `room.game && !room.legacy` | Render de sala legada não contém "Farol de Thalos" |
| F-L2 | LEGACY | Baixa | Local Play em `/` (dev) usa `names = ['Aurélia','Valgard','Merídia','Thalos',…]` | `npm run dev`, abrir `/` | `apps/server/src/local-maps.ts:10` | P4 | atualizar `e2e/local-play.spec.ts:195` |
| F-L3 | LEGACY/RULE | Baixa | `createAlphaGame` aceita civs fora do Core 10 (Veyra, Elyra); o recorte está só na sala/serviço; harness de bots usa as 12 | `alpha-bots.mjs:27` | `alpha-world.ts:58,63` | P5 | `createAlphaGame` com `'veyra'` em v1.2 falha |

## 6. Plano mínimo e ordem

1. **F-T1** (uma função, 3 linhas) + teste: remove o cerco permanente; maior efeito por menor custo (Revolta QUICK 2p 25%→5%).
2. **F-T2** (cap de perda de Ânimo por ameaça) + **F-T5** (cadência) juntos, mesmo arquivo.
3. **F-N1 + F-N2** (fonte única de nomes e fim de "Bárbaro"), junto com os testes de §3.4.
4. **F-L1** e **F-L2** (só apresentação); P2 (inventário SQL) antes de decidir qualquer limpeza de dados.
5. Playtest humano de defesa (F-T3/F-T4) antes de mexer em Poder/composição: os bots não defendem, então o ajuste de números ainda não tem base.
6. F-T2b vai para a lane de economia.

## 7. Evidência (`docs/evidence/v12-audit/lane-e/`)

- `summary.md` — tabelas A–G geradas por `node scripts/alpha-threat-audit.mjs summary`.
- `runs/*.json` — 50 partidas (`thr-` com ameaças, `ctl-` controle, `fix-retreat-` fix emulado); `run-log.txt`, `fix-log.txt`.
- `band-benchmark.json` — `bandBenchmark(600)` da defesa/ataque por nível.
- `grep-barbaro-all.txt`, `grep-nomenclature-src.txt`, `grep-oldciv-src.txt` — varreduras brutas.
- Script: `scripts/alpha-threat-audit.mjs`.

# Design — V5.1b in the engine

Canon: `docs/product/rules-v5-proposal.md`. Everything below only fills what the canon leaves open or reconciles an apparent contradiction.
Each item is an **Interpretation (I-n)**: written here before the code uses it.

## Snapshot versioning (S0)

- `AlphaState` gets `rulesVersion: z.enum(['v5.1a','v5.1b']).default('v5.1a')`; new matches are `v5.1b`.
- `AlphaStateSchema` preprocess `upgradeToV51b(raw)`: if `rulesVersion !== 'v5.1b'`: delete `pressure`; add defaults for every new field (`resonance`, `threats`, `eraTurn`, `pendingChoices`, region `discovery`); replace `rules.combat` and `rules.units` with the V5.1b catalogs; set `rulesVersion='v5.1b'`; push an event `SAVE_UPGRADED`. Never silent: the event is public to the match and the upgrade is covered by tests with a V5.1a fixture.
- Unknown legacy keys never make parsing throw; the strict schema stays strict for the V5.1b shape.

## Ressonância (S1)

- `player.resonance = { slots: ResonanceSlot[] (0..4 stored; the 5th resolves and clears), cycles: number, marks: Mark[] }`.
  - `ResonanceSlot = { advancementId, source: 'WEB'|'CONVERGENCE'|'HERITAGE', domains: [WebDomain] | [WebDomain, WebDomain] }`.
  - Heritage domain = domain of the universal advance that opens it. Convergence domains = domains of its two or three prerequisites; the first two distinct ones (catalog order) are stored.
  - `marks` (permanent, one per researched advance, `{advancementId, domain(s), round}`) is the Reserva de Marcos / cubes on the Teia. It is derived from `research` and never a limit; the stored copy is only for ordering and animation (`round`).
- **I-1 (composition).** count[d] = number of slots whose domains include d (a Convergence adds 1 to each of its two domains). Priority: (1) some count ≥ 3 → DOMINANT of the highest count (tie: first in catalog order Saber, Terra e Mar, Pedra e Metal, Governo, Troca); (2) all five domains present → CONFLUENCE; (3) at least two domains with count 2 → HYBRID of the two highest (ties by catalog order); (4) otherwise → PAIR (family of the domain with count 2, light tone). 5 distinct single-domain slots is the canonical Confluência; the rule above is its superset when a Convergence displays two domains.
- Registration happens when the research resolves (`researchAdvancement`). On the 5th slot the engine builds the composition, resolves one Repercussão, pushes a `ResonanceCycle` to `player.resonance.history` (cap 10) and clears the slots. `cycles` counts.
- **Repercussão card** = data (`REPERCUSSION_CARDS`): `{id, name, kind: DOMINANT|HYBRID|PAIR|CONFLUENCE, domains, applies: 'SELF'|'ALL', text, price: Op[], options: [{id,label,ops: Op[]},{…}], mitigatedBy: advancementId[], leveragedBy: advancementId[]}`. Draw: deterministic from the private RNG among cards matching (kind, domains). Confluência cards always carry a large option and a price.
  - `Op` vocabulary: `GAIN{resource,n}`, `LOSE{resource,n}`, `MOOD{scope:'CAPITAL'|'LOWEST'|'ALL',delta}`, `PRESTIGE{n}`, `POPULATION{n}` (Disponível in capital), `THREAT{command:'SPAWN'|'REINFORCE'|'ACTIVATE',kind?:'LAND'|'PIRATE'}`. `price` is applied at once unless a `mitigatedBy` advancement is researched ("mitigado por"); a `leveragedBy` advancement adds +1 to each GAIN of the chosen option ("aproveitado por").
  - The choice is a **pending choice** (`player.pendingChoices`): `{id, source: 'REPERCUSSION'|'ENCOUNTER'|'PULSE', cardId, createdRound, options}`. New command `RESOLVE_CHOICE {choiceId, optionId}` (free action, legal in PLANNING and ERA_TURN). Unresolved choices auto-pick option 0 when the next Era turn starts, with a public-to-owner event.
  - Pedra e Metal and Troca families may carry `THREAT SPAWN` in their price (canon §21b); Troca carries `PIRATE`.
- Rhythm check lives in telemetry (cycles per civ).

## Combat (S2)

- **Pure core** `resolveShock(input) → ShockResult` in `alpha-shock.ts`: takes both sides as descriptors (`pieces: {id?, kind, grade}[]`, `posture`, static modifier list, `inCity`, `fortification`, `terrain`, `supplied`, `reaction?`) and the state's private RNG; returns rolls, per-side breakdown, totals, `delta`, `outcome`. Used by player battles (`alpha-combat.ts`) and by world threats (S3), so Bandos/Piratas "usam o mesmo motor".
- Die faces: Impacto, Impacto, Guarda, Manobra, Comando, Vazio (already `dieFaces`). One die per fighting piece, rolled attackers first then defenders, in id order.
- Power: Infantaria 2, Guarda 2, Arqueiros 2, Cavalaria 3, Cerco 1, Frota 3 (catalog). Atiradores/Arcabuzeiros/Galera de Guerra/Fragata/Artilharia are **Grades of a family**, not new classes (`kind` stays the family; grade from research).
- Posture circle: Assalto > Manobra > Manter > Assalto, winner +1; each posture empowers one face (existing). `HOLD` is displayed "Manter".
- Totals per side = Σ Power + Σ face contributions + signatures + terrain (defender: Colina +1, Montanha +2) + fortification (intact full, damaged half, breached 0; city defender only) + supply (−2) + Leader/technology/cards (`strengthSources`) + ≤ 1 Reaction per side.
- **I-2 (Guarda face).** Per §11b a Guarda face cancels 1 enemy Impacto (2 when its posture is Manter). It counts for the defender, and for the attacker only when the attacker's posture is Manter or the piece is Infantaria Grau III (Linha "também vale quando ataca"). This is how the table row and §11b are both true.
- **Signatures (one per family)** — Comando face triggers: Infantaria *Linha*: each Guarda face cancels 1 (Grau II: 2) and always counts for this family when defending; III: also attacking. Guarda *Muro*: +1 power when defending its own city; never retires from a city with intact fortification (II: also +1 in Colina/Montanha; III: +2 in the city). Arqueiros *Salva*: a Comando face from an Arqueiros piece gives +1 Poder (II: +2; III: and the Salva ignores 1 level of the target's fortification). Cavalaria *Flanco*: a Comando face from Cavalaria gives +1 on Planície (II unchanged; III: +2 and also on Colina); moves 2 (Grau II 3, III 3). Cerco *Brecha*: +2 against a fortified city; a Comando face opens 1 step of Integridade (II: 2; III: ignores Paliçada and Muralha). Frota *Abordagem*: a Comando face blocks the enemy port after victory for the next round (II: transports 3 and Grau I transports 2; III: captures Mercante — Mercante is not in the engine, so III only keeps the block; recorded as divergence).
- **Graus** from `player.research`: Infantaria II Treino de Manobras, III Ferro. Guarda II Fortificação, III Defesa Profunda. Arqueiros II Metalurgia, III Pólvora. Cavalaria II Guerra de Movimento, III Doutrina Naval + Guerra de Movimento. Cerco II Engenharia, III Artilharia. Frota II Arquitetura Naval, III Balística. All pieces already on the map get the new grade immediately (grade is computed, never stored per piece).
- **Δ** = Ataque − Defesa. `|Δ| ≤ 1` TIE: each side with ≥ 2 pieces loses 1; attacker stays out (does not advance). `|Δ| 2–4` VICTORY: loser loses 1. `|Δ| ≥ 5` DECISIVE: loser loses 2. Δ > 0 attacker may advance (stack limits as before); Δ < 0 defender holds, never advances.
- **I-3 (capture).** A city never "retreats". Defenders inside a city stay and take the losses. The attacker enters and captures when Δ > 0 and no defending piece survives, or when the victory is DECISIVE and no Guarda survives (canon: "vitória decisiva contra cidade sem Guarda viva captura"). Otherwise the siege continues next round. Defenders in the open retreat to a free neighbouring hex (existing rule) or are destroyed if none.
- **I-4 (casualties).** Canon says "baixas escolhidas pelo dono, Cerco por último". Until the owner-choice command exists the engine applies the owner's standing preference deterministically: weakest Power first, Cerco last. Recorded as a divergence in the Gap Register.
- City defence is **pieces + fortification only**: the old "level + garrison" strength and "Defensores abrigados" extra are removed (they are not in the canon; garrison is a stack limit, not Power).
- `battle.outcome ∈ TIE|VICTORY|DECISIVE`, `battle.delta`; `winnerId` = attacker when Δ>0 else defender. `victories` only counts Δ > 0.

## World threats (S3)

- `state.threats: Threat[]`, `Threat = { id, kind: 'CAMP'|'PIRATE', hexId, homeHexId, level: 1|2|3, status: 'CAMPED'|'MARCHING', composition: {kind, count}[], createdRound, rewardPaid: boolean, lastActedRound }`. `raidBands` is migrated into level-1/2 CAMP threats (kept for read until removed).
- **I-5 (camp = band).** A threat that is CAMPED is the Acampamento (fixed, attackable, grows at the Era turn if no player piece within 2 hexes). Activation turns it into a MARCHING Bando that moves 1 hex per round (2 with Cavalaria on level II+) toward its target. A Bando destroyed in the field pays nothing and frees the cap slot; an Acampamento destroyed while CAMPED pays the reward once (I: 2 Riqueza; II: 3 Riqueza + 1 Prestígio; III: 4 Riqueza + 2 Prestígio + 1 Encontro). Eliminating pays the attacker.
- Composition by level and Era (canon §21b): I = 2 Infantaria; II = 3 Infantaria + 1 Arqueiros (Cavalaria instead of Arqueiros from Era III); III = 4 Infantaria + 1 Cavalaria (+ 1 Cerco from Era V). Pirates (**I-6**, not authored in canon): I = 1 Frota, II = 2 Frotas, III = 3 Frotas. Composition is recomputed from level and Era at growth/reinforce time.
- Caps: CAMP count (CAMPED + MARCHING) ≤ players + 2; PIRATE count ≤ ⌈players/2⌉ + 1. A `SPAWN` over the cap becomes `REINFORCE` of an eligible existing threat (+1 level up to III; the one farthest from player pieces).
- Event commands (`ThreatCommand`) from Pulso, Repercussão, Encontro and the Era turn: `SPAWN{kind}`, `REINFORCE{kind}`, `ACTIVATE`. The Era turn always runs ACTIVATE (step 4) and growth.
- Spawn eligibility (land): hex not claimed, 3–5 hexes from some city, outside the vision of every player at that moment, never adjacent to a city, not SEA/MOUNTAINS. Pirates: SEA hex within 3–5 of a coastal city or on an active maritime route; deterministic pick: farthest from player pieces, ties by hex id, among eligible; RNG only breaks ties among equals.
- Target (land): 1) reachable by land, 2) nearest city, 3) lowest defence (Guarda + fortification), 4) highest economic value (level + districts). Pirates: 1) richest maritime route, 2) nearest port, 3) port with fewest Frotas.
- Raid effects when a Bando reaches or meets a target: attacks pieces (shock core, always Assalto), blocks collection of a hex while occupying it, pillages an improvement, cuts road/route while occupying, kills exposed civilians (Explorador/Pioneiro/Enviado alone). Pirates block the route while in it, pillage port (−2 Riqueza to owner), fight Frotas, never land.
- Bando vs city: same shock core; a Bando can capture nothing (it only pillages; city Ânimo −1 on a successful assault).

## Descobertas e Encontros (S4)

- Region content is decided at game creation from the private RNG and stored hidden in `regions[].discovery = { kind: 'RUIN'|'DEPOSIT'|'PASSAGE'|'ANCHORAGE'|'DANGER'|'CAMP'|'NONE', resolved: boolean }`. A frontier region keeps authored Peoples/features as today. Only revealed regions expose `discovery.kind` in the projection.
- Revealing applies: RUIN → Encounter (pending choice: +2 Conhecimento or +2 Cultura, some give a map hint); DEPOSIT → +Pedra/Metal and a deposit feature; PASSAGE → natural road on the region's centre-adjacent hex; ANCHORAGE → natural port flag on a coast hex; DANGER → may cost the Explorer unless `web-experimental-method` is researched (then the preview warns first); CAMP → `SPAWN` threat in the region (cap applies). Advances give partial info before exploring (Matemática: biome; Método Experimental: danger/coast; Cartografia: coast at 2) via `explorePreview`.

## Virada de Era (S5)

- New phase `ERA_TURN` after `END_ROUND` of the last round of every Era except the last of the match. State `eraTurn: { era, step: 1..9, log: {step,summary}[] } | null`.
- Steps run in order; 1–4 automatic, 5 and 7 wait for players (READY ends the wait), 6, 8, 9 automatic:
  1. Sustento/efeitos de fim de Era (Ânimo for surplus food: +1 where Alimento exceeds consumption; the round-5 maintenance already ran).
  2. Pontuar no máximo 1 Ambição (best completed, deterministic).
  3. Pulso do Mundo global (one card; choices as pending choices; `mitigatedBy` honoured; may carry a threat command).
  4. Ameaças: growth then ACTIVATE.
  5. Reforma de Governo (command `MANAGE/ADOPT_GOVERNMENT` legal only in ERA_TURN, ≤ 1 per player per Era).
  6. Líder: `eraAbilityUsed=false`.
  7. Manobras +1 (cap 5), Reações back, Ambição swap (`CHOOSE_AMBITIONS` allowed once for one unfinished).
  8. Liberar o próximo patamar da Teia (`player.era` of the Web tier unlocks; already driven by Era).
  9. Advance Era: all civilizations together, round+1, `openRound`.
- Pulso is drawn only here (and once at match start for Era I). Pressão and its extra Pulse are gone.
- **Governo (I-7).** Reform requires: prerequisite Web node, minimum Era, 4 Influência (Era ≤ III) or 6, and an **Influência Order reserved in the last round of the Era** (a planned `GOVERNMENT_REFORM` that occupies one Order slot and is only executed at step 5). The capital becomes Abalada for the first round of the new Era. Maximum 1 per Era.

## Privacy (S6)

Never projected: unresolved orders of others, secret Ambições, others' hands, RNG, a defender's posture before resolution, naval cargo of rivals, anything beyond the fog, unresolved pending choices of others, hidden `regions[].discovery` and threats outside vision. Threats move every round: only those inside current vision are shown.

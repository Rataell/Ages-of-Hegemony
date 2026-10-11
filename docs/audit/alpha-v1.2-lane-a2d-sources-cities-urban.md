# Alpha V1.2 — Lane A2+D: fontes de Conhecimento / Influência / Cultura, níveis N1–N7 e ações urbanas

Baseline preservado: branch `stabilize/alpha-v1.2-audit`, RC4 `dca181a`. Esta lane é **somente leitura sobre `packages/` e `apps/`**: nenhum número de balanço foi alterado, `npm run compile` não foi executado (os scripts e testes leem o `dist` que as outras lanes usam como medida), nada foi commitado.

Classificação usada: **BUG** (o motor/UI faz algo diferente do que declara), **RULE** (a regra, como escrita, produz o problema), **BALANCE** (a regra funciona, os números não fecham), **UX** (informação ou controle enganoso), **WORLD** (mapa/regiões), **LEGACY** (resto de modelo antigo ou promessa sem motor).

## 0. Evidência produzida

| Artefato | O que é |
|---|---|
| `scripts/alpha-city-path.mjs` | Tabelas reais (`CITY_LADDER`, `ELEVATE_TABLE`, `WEB_ADVANCES`) → fecho de pré-requisitos, Conhecimento, recursos, Ordens, rodada mínima por Era, comida de crescimento. Com `--drive` joga um agente de **capital única** pelo `applyAlphaCommand` (Ordens, Ânimo, fome e portão de Era reais). `--trace` imprime rodada a rodada. |
| `tests/v12-audit-urban-planning.test.ts` | U-01…U-12: planos aceitos no Planejamento que quebram na Resolução, segunda ativação, Próspera, armazenamento. |
| `tests/v12-audit-urban-display.test.ts` | D-01…D-04: custo/efeito mostrado × aplicado, edifícios inalcançáveis, página "Produção". |
| `tests/v12-audit-urban-sources.test.ts` | S-01…S-06: fontes das três moedas, papéis, Heranças inertes, promessas da Teia sem leitor, limiares de Hegemonia acima do armazenamento. |
| `tests/v12-audit-urban-helpers.ts` | cenários sobre cópia do estado; só fala com o motor por `applyAlphaCommand`. |

Convenção dos testes (igual à lane B): `it.fails('REPRO …')` descreve o comportamento **esperado** e hoje falha, logo a suíte fica verde; quando o defeito for corrigido o teste fica vermelho e deve virar `it`. `it` simples é GUARD (correto hoje) ou CHARACTERIZATION (comportamento classificado como decisão de regra). Execução: `npx vitest run tests/v12-audit-urban-planning.test.ts tests/v12-audit-urban-display.test.ts tests/v12-audit-urban-sources.test.ts` → **18 passam + 20 "expected fail"**; cada REPRO foi conferido uma vez trocando `it.fails` por `it` para ver que falha pelo motivo declarado (não por erro de montagem).

Amostras de bots (competentes, 2 jogadores, 35 rodadas, sementes 1–3) e as simulações do agente foram rodadas localmente; os números citados abaixo saem dessas execuções.

---

## 1. Resumo (o que mais importa)

| ID | Classe | Achado |
|---|---|---|
| **A2D-01** | BUG | **21 dos 29 edifícios nunca podem ser construídos.** `Construir` só aceita os 7 do catálogo legado (`BuildingTypeSchema` em `territory.ts:6`): Celeiro, Mercado, Biblioteca, Arquivo, Quartel, Oficina, Centro Cultural. Templo, Teatro, Chancelaria, Tesouro, Banco, Academia, Armazém, Fundição… estão só no enum alpha. A Teia anuncia 18 tags `building:*` sem opção de Construir (16 edifícios do enum + `MANUFACTURE` e `MONUMENT`, que nem existem no enum). |
| **A2D-02** | BUG/UX | O texto de efeito de Construir vem do catálogo legado e **não é o que Produzir credita**: Distrito Cultural diz "+1 Influência" mas rende +1 **Cultura**; Agrário diz +1, rende +2; Mercado/Biblioteca/Oficina/Centro Cultural prometem +1 e **rendem 0** (só liberam o 3º par do papel). |
| **A2D-03** | UX/BUG | A página **Produção** da cidade (`cityDetails.production`) é o `deriveCityProductionBreakdown` legado, não o `cityYield`: para 4 Eruditos + Acadêmico mostra 5 Conhecimento, o motor credita 3. |
| **A2D-04** | BUG | Construir **Marítimo** mostra custo 0 e cobra 3 Madeira + 1 Pedra (`urbanCost` não tem ramo `MARITIME`). |
| **A2D-05** | BUG (bot) + RULE | Bots terminam com 0 Eruditos por **lacuna dos bots** (alocação por `floor`, paridade, persona ignorada, Soldados primeiro) agravada por regra: 1 Erudito rende **0,5** Conhecimento e só em **pares**. Principalmente lacuna de bot; não há "papel padrão" (todo habitante novo nasce Disponível) e a UI de População não ajuda (§2.2). |
| **A2D-06** | BALANCE/RULE | **Influência existe** (Ação Cívica: +1 por Ordem Cidade; passivo +1/rodada para 2 das 10 civilizações jogáveis; cartas da civilização; Obras de Legado; Pulsos; Ressonância), mas sob demanda custa **uma Ordem e uma ativação por 1 ponto**. Aurélia, Valgard e Kor não têm **nenhuma** fonte de Conhecimento ou Influência fora de Eruditos/Ação Cívica. |
| **A2D-07** | RULE | **Hegemonia Cultural exige 25 Influência**, mas o teto de armazenamento é 18 mesmo com todos os edifícios e uma Metrópole (hard cap 20). Hegemonia Econômica exige 30 Riqueza: com os edifícios construíveis o teto é 24. Inalcançáveis hoje. |
| **A2D-08** | LEGACY | 54 Heranças são `PLANNED` (efeito só texto) e **custam** Conhecimento + recurso temático (Influência em várias). 17 promessas "rule:*" da Teia não têm leitor no motor (inclui "Eruditos rendem Influência 1×/Era" e "Presença Enraizada rende Cultura"). |
| **A2D-09** | BUG | **Teocracia é só penalidade**: suas duas vantagens dependem do Templo (inconstruível); a limitação (+1 Conhecimento no 1º avanço de Saber por Era) vale. |
| **A2D-10** | RULE/BALANCE | O portão de **Era domina** a escada: N3 só na rodada 6, N5 na 16, N7 na 31. Caminho mínimo a N7 = 17 avanços (72 Conhecimento) + 6 Elevar e é possível no motor **exatamente na rodada 31**; um agente razoável de capital única chegou a N7 em 2 de 9 execuções (a mesma semente). |
| **U-01…U-09, U-12** | BUG/UX | **Planos aceitos que viram `ACTION_FAILED`**: nada é reservado entre planos (recursos, vagas, distrito repetido, Elevar duas vezes, Recrutar antes de Elevar, Soldado removido por redistribuição livre, Conhecimento dividido, Governar duas vezes, bônus de Próspera). A Ordem é gasta à toa. |
| **U-10** | GUARD | A penalidade da 2ª ativação está implementada onde o cânone manda (`alpha-urban.ts:371-375`). |

---

## 2. TAREFA 1 — E-3: fontes de Conhecimento, Influência e Cultura

### 2.1 Inventário completo (o que o motor realmente faz)

Legenda de classe: (a) sem fonte no motor · (b) existe mas economicamente inviável · (c) viável mas ignorada pelos bots · (d) liberada tarde · (e) demanda ≫ oferta.

**Conhecimento**

| Fonte | Onde | Rendimento real | Classe |
|---|---|---|---|
| Eruditos | `alpha-city.ts:108-111` `pairs()` | 1 por **par**; máx. 2 pares sem Biblioteca (4 Eruditos → 2); 3º+ par exige Biblioteca; Meritocracia rende por 1 (máx. 4). Teste S-02: 1/2/4/6/8 Eruditos → 0/1/2/2/2, Biblioteca com 6 → 3 | (b),(c) |
| Distrito Acadêmico | `alpha-city.ts:115` | +1 fixo por Produzir | (b) |
| Passivo da civilização (MAINTENANCE) | `alpha-institutions.ts` (domínio) `passives` | +1/rodada para **meridia, thalos, orinth, solenne, dravik** (5 das 10); 0 para aurelia, valgard, saren, kor, nymara | (b) |
| Cartas da civilização (FREE, 1×/Era cada) | `alpha-civilization-kits.ts`, `alpha-cards.ts:73-83` | meridia 10, thalos 9, orinth 26, solenne 15 em 35 rodadas | (c) — nenhum bot joga `PLAY_CIVILIZATION_CARD` |
| Conselheiros (HIRE_ADVISOR) | `alpha-cards.ts:43-47` | +1/rodada (advisor-7, 8, 17, 18); custa 3 Riqueza + 2 Conhecimento + 1 Ordem Influência; máx. 2 | (c) — bots nunca contratam |
| Obras de Legado científicas | `alpha-legacy-works.ts` | +1/rodada (Arquivo dos Horizontes, Instrumento, Pátio); custo 11–12 recursos em 3 passos; exige Capacidade 2 e distrito Acadêmico | (b),(d) (Era VI para a de portão `web-synthesis`) |
| Pulsos / Ressonância / evento mundial / carta de estratégia | `alpha-concept.ts:231-263`, `alpha-resonance.ts` (domínio), `alpha-cards.ts` | esporádicos (±1–3) | — |
| Governar sob Meritocracia | `alpha-city.ts:313` | +1 por Governar | (b) |
| Elyra / Thalos exploração | `alpha-kits.ts:36` | +1 por Região revelada | (b) |
| Estoque inicial | `alpha-world.ts:57` | 8 | — |

Demanda (sinks) de Conhecimento: **toda a Teia = 261** (50 linhas; Eras I–VII: 14/21/40/44/48/60/34) · caminho a N7 = 72 · Elevar N5/N6/N7 = 2+3+4 = 9 · Heranças 15 por civilização (3/5/7 + 1–2 temático) · conselheiro 2 · Obras 3–5 · Teocracia +1 · Solenne +1 nos de Era I. O cap de armazenamento é 10 (hard 20). (e) Para civilizações sem passivo, a única fonte contínua é o Erudito: 4 Eruditos + Acadêmico = 3 Conhecimento por Produzir; os 72 do caminho a N7 pedem ≈ 24–36 Ordens de Produzir dedicadas.

**Influência** (não classificar como "sem produção": ela tem fonte, só é cara)

| Fonte | Onde | Rendimento | Classe |
|---|---|---|---|
| **Ação Cívica** em cidade própria | `alpha-urban.ts:363-366`, `balance.civicInfluence = 1` | **+1 Influência** (+10 coesão) por Ordem Cidade e uma ativação (teste S-01) | (b),(c) — bots só usam Ação Cívica para integrar cidades ocupadas |
| Passivo da civilização | domínio `passives` | +1/rodada para **saren, solenne** (veyra/elyra não selecionáveis) | (b) |
| Cartas da civilização | kits | thalos 10, saren 21, nymara 15, solenne 14 em 35 rodadas | (c) |
| Conselheiros | advisor-9, advisor-10 | +1/rodada | (c) |
| Obras de Legado políticas/culturais | `legacy-works` | +1/rodada: Casa dos Acordos (custa 3 Influência), Conselho dos Horizontes (custa 5), Monumento das Vozes (custa 4 Cultura; porta `web-renaissance`, Era VI) | (b),(d) |
| Pulsos Festival (+2) / Peregrinação (+1) | `alpha-concept.ts:235,251` | ~1 por partida | — |
| Ressonância (Repercussão a cada 3 avanços) | `alpha-resonance.ts` | 1–2 (opções Debate público, Concórdia, Rede de contatos, Geração nova) | — |
| Estoque inicial / Saren +2 | `alpha-world.ts:57`, `alpha-kits.ts:144` | 8 | — |
| Troca entre jogadores | `alpha-trade.ts` | transferência, não produção | — |
| **Promessa sem motor**: "Eruditos rendem Influência 1×/Era" (Academias Cívicas) | tag `rule:scholar-influence-once-per-era` sem leitor | 0 | **(a)** |
| Heranças (Saren "+1 Influência por tratado", etc.) | `PLANNED` | 0 | **(a)** |
| Tratados, rotas, líderes | `alpha-diplomacy.ts`, `alpha-trade.ts`, `alpha-leaders.ts` | rotas rendem Riqueza; tratados só movem recursos; líderes não produzem (passivos: armazenamento, suprimento, integração) | **(a)** |

Sinks de Influência: reivindicar hex **1** cada (`territory.claimCost`) — uma cidade N7 puxa ~4; reforma de governo **4** (Eras I–III) ou **6** (IV–VII) por Era; integrar cidade ocupada 3 por ação; Enviado 1 (Valgard +1); povos independentes 1 por ação de Influência (Proteger exige 2, Integrar 3 pontos); República +1 para declarar guerra; Obras 3/5; várias Heranças 1–2; Hegemonia Cultural 25 (inalcançável, A2D-07). (e) Quem não tem passivo vive de 8 iniciais + 1 por Ordem Cidade: uma reforma por Era já custa 4–6 Ordens.

**Cultura**

| Fonte | Onde | Rendimento | Classe |
|---|---|---|---|
| Distrito Cultural | `alpha-city.ts:117` | +1 Cultura por Produzir (a UI diz "+1 Influência", A2D-02) | (b) |
| **Templo** | `alpha-city.ts:120` | +1 (+1 Teocracia) — **inconstruível** (A2D-01) | **(a) na prática** |
| Ressonância | GOVERNMENT B, KNOWLEDGE B, Confluências | 1–2 | — |
| Teatro (+5 de limite), "Presença Enraizada rende Cultura", Obras | tags sem leitor / inconstruível | 0 | **(a)** |

Sinks de Cultura: Governar (1 por nível; alternativa 2 Riqueza) e Monumento das Vozes (4). Ambos reais, sem fonte confiável além do Distrito Cultural: Governar vira "2 Riqueza" na prática.

### 2.2 Por que os bots terminam com 0 Eruditos — lacuna de bot, de UI ou de regra?

Fatos verificados:

1. **Não existe papel padrão por escolha.** A capital nasce com 1 Produtor + 1 Erudito (`alpha-world.ts:58`); uma cidade fundada nasce com `unassignedPopulation(1)` (`founding.ts`); `Crescer` soma 1 **Disponível** (`alpha-phases.ts:258`); mobilizar/fome removem Disponível primeiro. Disponível não produz. Teste GUARD S-03.
2. O jogador **pode** reatribuir (comando `ASSIGN_POPULATION`, classe FREE, sem Ordem), **uma vez por cidade por rodada** (`alpha-turn.ts:97`, `allocationRound`) e só no Planejamento. Sem custo.
3. O bot (`scripts/lib/alpha-bots.mjs:118-148`, idêntico em `apps/server/src/alpha-bot-policy.ts:104-132`) **chama** `ASSIGN_POPULATION` toda rodada, mas: (i) separa Soldados antes (`min(floor(pop/3), …)`), (ii) 30–70% viram Produtores, (iii) o resto é dividido por `floor(rest * peso / total)` com pesos `0,6 + déficit` — com `rest` = 2–3 o `floor` zera Eruditos; (iv) o resto sobra para **Artesãos** se faltar Madeira (`woodShort`, quase sempre) ou para Eruditos senão; (v) o papel de cada **persona** (`roles`) só vale para o bot `naive`; os competentes usam só déficits, então o "scholar" não é diferente; (vi) um Erudito ímpar não rende, e o bot nunca garante paridade; (vii) o déficit de Conhecimento é `max(0, 6 − estoque)` e o passivo de +1/rodada mantém o estoque acima disso.
4. Medido (competentes, 2 jogadores, 35 rodadas, sementes 1–3): par de Eruditos presente em **4%, 19% e 17%** das rodadas-assento; média 0,4–1,3 Eruditos contra 2,2–3,4 Soldados.
5. **UI**: a tela de População (`apps/web/app/play/inspectors.tsx:44-107`) tem campos numéricos, sem prévia de rendimento, sem a regra do par, e a descrição de "Disponível" diz "arraste para um papel" (o cânone §6 fala de fichas arrastáveis; não existe). A página "Produção" ao lado mostra o cálculo legado (A2D-03). Um humano que não conheça a regra do par distribui Eruditos ímpares.

Veredito: **lacuna do bot (principal)**, **lacuna de UI (secundária, agrava para humanos)**, **regra (de fundo)**: 0,5 Conhecimento por cabeça só em pares e 2 pares sem Biblioteca tornam o Erudito pior que um Produtor numa hex trabalhada (≈2 Alimento) ou que um Soldado. O agente de `alpha-city-path` com pares=1 alcançou N6/N7 enquanto pares=0 ficou 1 nível abaixo; ou seja, a regra funciona quando alguém a usa.

### 2.3 Fontes ignoradas pelos bots (c)

Nenhuma ocorrência em `alpha-bots.mjs` / `alpha-bot-policy.ts` de `HIRE_ADVISOR`, `PLAY_CIVILIZATION_CARD`, `PROPOSE_TRADE`, `CONTEST_PRESENCE`; `CIVIC_ACTION` só para cidades ocupadas. Isso explica "Influência = 0 produzida em 35 rodadas" e "Conhecimento só do passivo" do E-3: **o repro do E-3 mede o bot, não o jogo**.

---

## 3. TAREFA 2 — N1–N7: requisitos efetivos e caminhos

### 3.1 Tabela (de `CITY_LADDER` + `ELEVATE_TABLE`)

| Nível | Pop mín | Teto de pop | Capac. | Vagas | Alcance | Era mín do Elevar (rodada) | Custo do Elevar | Avanço da Teia |
|---|---|---|---|---|---|---|---|---|
| N1 Posto | 2 | 4 | 1 | 1 | 2 | — | — | — |
| N2 Povoado | 4 | 6 | 1 | 1 | 2 | I (1) | 3 Madeira | Agricultura |
| N3 Vila | 6 | 8 | 2 | 2 | 3 | II (6) | 4 Madeira, 2 Pedra | Alvenaria |
| N4 Cidade | 8 | 11 | 2 | 3 | 3 | III (11) | 5 Mad., 3 Pedra, 2 Riqueza | Engenharia |
| N5 Grande Cidade | 11 | 14 | 3 | 4 | 4 | IV (16) | 6 Mad., 5 Pedra, 3 Riq., 2 Conh. | Urbanismo |
| N6 Metrópole | 14 | 18 | 3 | 5 | 4 | V (21) | 8 Mad., 6 Pedra, 5 Riq., 3 Conh. | Saneamento |
| N7 Metr. Imperial | 18 | 20 | 4 | 6 | 5 | **VII (31)** | 10 Mad., 8 Pedra, 8 Riq., 4 Conh. | Saneamento + Metrópoles do Mundo |

Nenhum Elevar exige edifícios nem distritos. Ânimo: Revolta bloqueia (só Governar/Ação Cívica); Abalada permite 1 ativação; Estável/Próspera, 2 (a 2ª custa 1 Ânimo). A Era dá **uma subida por Era**, exceto na Era VI (nenhuma). A população espera a Era: o teto do nível é o mínimo do próximo, então N3→N4 (pop 8) fica parada de ~r8 até r11.

### 3.2 Caminho mínimo (saída de `node scripts/alpha-city-path.mjs`)

| Alvo | Avanços | Conhecimento da Teia (+Elevar) | Recursos de Elevar acumulados | Ordens mín. (pesquisa + Elevar) | Rodada mín. | Crescer (Alimento) 3 / 2 c/ Celeiro | Sustento até lá |
|---|---|---|---|---|---|---|---|
| **N3** | 2 (Agricultura, Alvenaria) | 4 | 7 Mad., 2 Pedra | 4 | **6** | 12 / 8 | 8 |
| **N5** | 8 (+Metalurgia, Engenharia, Narrativas, Escrita, Códigos, Urbanismo) | 24 + 2 | 18 Mad., 10 Pedra, 5 Riq., 2 Conh. | 12 | **16** | 27 / 18 | 29 |
| **N7** | 17 (+Matemática, Filosofia Natural, Saneamento, Troca, Moeda, Mercado Regional, Logística, Banco, Metrópoles do Mundo) | 72 + 9 | 36 Mad., 24 Pedra, 18 Riq., 9 Conh. | 23 | **31** | 48 / 32 | 80 |

Todos os números acima são o piso: o gargalo duro é a **Era** (rodada 6/16/31), não as Ordens (de 155 possíveis até a rodada 31 só 23 são obrigatórias). Crescer é no máximo +1 hab./cidade/rodada, então N7 pede ≥ 16 rodadas de crescimento ininterrupto numa só cidade (48 Alimento de Crescer + 80 de sustento ≈ 8 Alimento/rodada média, 128 no total).

### 3.3 Caminho razoável — validado no motor (`--drive`)

Agente de capital única (Produzir toda rodada, reivindica hexes, Artesãos/Mercadores em pares quando falta Madeira/Riqueza, Governar só se a comida aguenta, Elevar usa a 2ª ativação se Estável, Avanços pela cadeia do alvo N7). `civ=meridia`, 35 rodadas, 3 sementes × pares de Eruditos {0,1,2}:

| semente | pares=0 | pares=1 | pares=2 |
|---|---|---|---|
| 1 | N6 (r27) | **N7 (r31)** — N3 r6, N4 r12, N5 r16, N6 r24 | **N7 (r31)** |
| 2 | N4 (r15) | N4 (r13) | N3 |
| 3 | N5 (r29) | N4 (r13) | N4 (r13) |

`civ=valgard` (sem passivo de Conhecimento), pares=1: N6 (r26) / N5 (r18) / N5 (r20).
Na melhor execução (meridia, semente 1, pares=1) as Ordens gastas até a rodada 31 foram: Produzir 31, Avanço 17, Elevar 6, Reivindicar 3, Construir 2, Governar 2 (**≈ 62 de 155**). Os fracassos (sementes 2–3) são a espiral de fome → Ânimo 0 → **Revolta** do E-1: em Revolta `Produzir` e `Elevar` ficam bloqueados (`cityGate`) e o remédio (Governar) compete pela única ativação da cidade Abalada. Resultado: **o caminho mínimo a N7 existe, é exato (r31) e só é cumprido com Produzir toda rodada e uma Ordem de Elevar acompanhando a 2ª ativação; o resto tropeça em comida e Ânimo**. Um jogador que expande para 3 cidades divide a mesma Ordem por mais ativações; não foi simulado.

Gargalos por recurso (todos observados no `--trace`): Madeira/Pedra/Riqueza para Elevar só vêm de Artesãos (Madeira apenas — o cânone diz "Madeira ou Pedra", o motor só dá Madeira), Mercadores, hexes de Floresta/Colina e Distritos Industrial/Comercial; Riqueza também sofre o cap 15 e descarta no ato (U-11).

---

## 4. TAREFA 3 — Auditoria das ações urbanas

### 4.1 Mecânica (como o motor realmente opera)

* Cinco Ordens por rodada (`alphaActionCapacity`): CITY, EXPEDITION, ADVANCE, INFLUENCE, LEGACY; tipos podem repetir. `URBAN_ACTION` ≠ RESEARCH ocupa CITY; RESEARCH ocupa ADVANCE e **não** consome ativação da cidade (`alpha-urban.ts:45-46`). `CLAIM_HEX` e `IMPROVE_HEX` (MANAGE) ocupam CITY **imediatamente** e não consomem ativação. Redistribuir população e hexes trabalhados é FREE.
* Ativações por cidade (`cityGate`): Revolta 1 (só Governar/Ação Cívica), Abalada 1, Estável/Próspera 2; Sobre-extensão limita a 1; Conselho no máximo uma 2ª ativação **na civilização inteira**. Verificado consistente entre Planejamento (`planned`) e Resolução (`urbanActionsUsed`).
* **Penalidade da 2ª ativação**: `performUrbanAction`, final (`alpha-urban.ts:371-375`): `if (urbanActionsUsed === 2) mood -= 1`, nunca para RESEARCH. É o cânone (§10). Teste GUARD U-10: 1 Produzir → Ânimo 4; 2 Produzir → 3; Produzir + Avanço → 4. Duas Produzir creditam o dobro (BALANCE: o único preço é 1 Ânimo; recuperar custa uma ativação de Governar, por isso o regime sustentável é 1 ativação/rodada, como mostrou o agente).
* Próspera: +1 Capacidade **só na primeira ativação** (`activationCapacity`, `urbanActionsUsed === 0`).
* Planejamento: `alpha-turn.ts:129-133` roda `urbanBlock` contra o estado **atual** e guarda o plano; nada é reservado. Resolução (`alpha-phases.ts:179-210`): por slot, depois por iniciativa; cada plano é atômico; falha → `ACTION_FAILED`, plano descartado, **Ordem perdida**. Ordem entre os planos de um mesmo jogador = ordem de inserção (não há reordenar).
* Governos (§16): conferidos contra `alpha-government.ts` — Conselho (1º nível de Governar grátis, Adm +1, 1 segunda ativação), Monarquia, República, Oligarquia, Confederação (cap 3 na capital), Meritocracia (+1 Conhecimento por Governar, Recrutar ≤1), Autocracia: todos aplicados. Exceções: **Teocracia** morta (A2D-09); Chancelaria (Adm +1 e +5 Influência de limite) inconstruível; "ADMINISTRATIVE: Governar +1" do `DISTRICT_CATALOG` não existe no motor.
* Administração: carga/capacidade conforme cânone (`alpha-city.ts:255-277`); a Chancelaria nunca soma (A2D-01).

### 4.2 Custos/limites mostrados × aplicados

| Item | Mostrado | Aplicado | Achado |
|---|---|---|---|
| Construir Marítimo | custo vazio | 3 Madeira + 1 Pedra (`districtEntry('MARITIME').cost`) | D-01 (BUG) |
| Efeito de distrito/edifício | catálogo legado (`urbanOptions` usa `territory.*.production`) | `cityYield` | D-02: AGRÁRIO 1×2, INDUSTRIAL 1 "Madeira/Pedra" × 1+1, CULTURAL Influência × Cultura; MERCADO/BIBLIOTECA/OFICINA/CENTRO CULTURAL prometem +1 e rendem 0 |
| Página Produção da cidade | `deriveCityProductionBreakdown` | `cityYield` | D-04: Erudito rende por cabeça (5 × 3) |
| Custo de distrito em `DISTRICT_CATALOG` (3 Madeira + 1 Pedra todos) | só o Marítimo usa | `territory.districts.*.cost` (2–3 materiais, alguns +1 Riqueza) | dado duplicado, divergente (LEGACY) |
| Limite de Recrutar com Próspera | `recruitLimit` assume 1ª ativação | 2ª ativação perde o bônus | U-08 |
| Prévia do 2º Produzir | inclui +1 Capacidade | não inclui | U-09 |
| Contador de ativações da cidade (`plannedUrbanActions`, `alpha-projection.ts:24`) | conta Avanços carregados pela cidade | Avanço não usa ativação | U-12: o gate web (`alpha-panels.tsx:32`) esconde a 2ª ativação real; e a faixa "cidade sem ação planejada não produz" (`alpha-board.tsx:128`) é suprimida por um Avanço |
| Custo de Avanço sob Teocracia | +1 em todo plano de Saber | só o primeiro do Era paga | prévia pessimista (UX menor) |
| Governar com Conselho | mostra 1 Cultura/2 Riqueza | 1º nível grátis | UX menor |

### 4.3 Planos aceitos que viram inválidos na Resolução

Todos reproduzidos (planejamento aceito, `ACTION_FAILED` na resolução); cada REPRO é `it.fails`:

| ID | Cenário (cidade/estado mínimo) | Motivo da falha | Classe |
|---|---|---|---|
| **U-01** | `[Construir Agrário, Construir Industrial]` com 4 Madeira, 0 Riqueza | Recursos insuficientes: o 2º plano lia o estoque cheio | BUG/UX |
| **U-02a** | mesmo distrito duas vezes | "Um distrito de cada tipo por cidade" | BUG/UX |
| **U-02b** | dois distritos com 1 vaga | "Sem vagas de distrito" | BUG/UX |
| **U-03** | `[Elevar, Elevar]` | o 2º lê o mesmo nível; falha por Era | BUG/UX |
| **U-04** | `[Recrutar, Elevar]` com pop exata 4 | Recrutar mobiliza na hora → pop 3 < 4. O inverso `[Elevar, Recrutar]` funciona (GUARD) | BUG/UX |
| **U-05** | Recrutar planejado, depois **Redistribuir** (FREE) tira o Soldado | "Sem Soldado nem habitante Disponível" | BUG/UX |
| **U-06** | 3 avanços de 2 Conhecimento com 4 Conhecimento | o 3º falha; o mesmo avanço duas vezes **é** recusado (GUARD, E-1) | BUG/UX |
| **U-07** | `[Governar, Governar]` em cidade Estável | o 1º leva a Próspera; o 2º "já está Próspera" | BUG/UX |
| **U-08** | Próspera `[Produzir, Recrutar ×3]` | o limite 3 vale só para a 1ª ativação; a Recrutar vira 2ª (limite 2) e falha inteira. O inverso funciona | BUG/UX |
| **U-09** | prévia do 2º Produzir de Próspera | inclui bônus que só a 1ª ativação recebe | UX |
| **U-12** | contador `plannedUrbanActions` | conta Avanço como ativação | UX |
| **U-11** (CHARACTERIZATION) | `[Produzir, Construir]` com estoque no limite | `alphaGain` descarta o excesso **no ato** (`alpha-resources.ts:110-117`), antes do Construir da mesma rodada gastar; `[Construir, Produzir]` perde menos | RULE/UX |

Conservadores (não são defeito, só limite de UX; U-06 CHAR): não dá para planejar um avanço junto do que ele abre, nem distrito + edifício nele, nem Elevar + construir na vaga nova, nem encadear com o que a Produção da mesma rodada renderia.

Não verificado em teste (leitura): Conselho e Sobre-extensão são conservadores entre planejamento e resolução; o limite de pilhas por hex e o custo de Alimento de Recrutar entre cidades diferentes sofrem do mesmo problema de reserva que U-01 (mesma causa).

---

## 5. Achados detalhados (repro · causa · correção mínima · teste de regressão)

### A2D-01 · BUG — 21 de 29 edifícios inconstruíveis
* **Repro**: `tests/v12-audit-urban-display.test.ts` D-03 (`it.fails` lista Academia, Banco, Chancelaria, Tribunal, Fundição, Irrigação, Laboratório, Farol, Moinho, Observatório, Casa dos Escribas, Estaleiro, Templo, Teatro, Tesouro, Armazém e as tags `MANUFACTURE`, `MONUMENT` que nem existem no enum). CHAR confirma só 7 construíveis.
* **Causa**: `UrbanBuildTargetSchema` (`alpha.ts:79`) e `urbanOptions` iteram `BuildingTypeSchema` do **core legado** (`territory.ts:6`, 7 valores), enquanto `cityYield`, armazenamento, Administração e a Teia usam `AlphaBuildingSchema` (29). `BUILD_BUILDING` do core só conhece o catálogo de 7 (custo, distrito).
* **Efeitos**: Templo (Cultura e Teocracia), Chancelaria (Adm +1, +5 Influência), Tesouro/Banco/Teatro/Academia/Armazém/Fundição (limites), Irrigação/Moinho, Tribunal… Cultura e Influência ficam sem armazém e sem edifício produtor; caps de Riqueza/Influência ficam no básico.
* **Correção mínima**: estender o catálogo de edifícios do core com os alpha (custo, distrito, `workerRequirement`) e aceitar `AlphaBuildingSchema` no comando; sem tocar números, usar a coluna "Custo" do cânone §9 (Teatro, Tesouro, …). Alternativa curta: entregar apenas Templo, Chancelaria, Tesouro, Banco, Teatro, Academia, Armazém (os que o motor já lê).
* **Teste**: virar `it` o REPRO D-03; adicionar teste de que `Construir` de cada edifício com tag `building:*` desbloqueada passa e credita o que o motor lê (Templo +1 Cultura).

### A2D-02 · BUG/UX — efeito exibido de distrito/edifício
* **Repro**: D-02a/b (+ CHAR dos 3 distritos e 4 edifícios divergentes).
* **Causa**: `urbanOptions` (`alpha-urban.ts:203-204`) imprime `territory.districts[d].production` / `buildings[b].production` (modelo legado por trabalhador), mas `cityYield` aplica a regra V5.1a (distrito fixo; edifício só destrava o 3º par).
* **Correção mínima**: gerar o texto a partir de uma tabela única ligada ao `cityYield` (`DISTRICT_CATALOG.effect` já tem os textos certos: "+2 Alimento", "+1 Cultura"…); para edifícios dizer "libera o 3º par de Eruditos/Mercadores/Artesãos" (e limites de armazenamento).
* **Teste**: virar `it` D-02a/b.

### A2D-03 · UX/BUG — página Produção usa o cálculo legado
* **Repro**: D-04. **Causa**: `alpha-projection.ts:56` usa `deriveCityProductionBreakdown`. **Correção mínima**: expor `cityYield(...)` com as mesmas fontes (hexes, pares, distritos). **Teste**: virar `it` D-04.

### A2D-04 · BUG — custo do Marítimo
* **Repro**: D-01. **Causa**: `urbanCost` não trata `kind === 'MARITIME'`. **Correção**: `if (action === 'BUILD' && params.build?.kind === 'MARITIME') return districtEntry('MARITIME').cost` (passando por `alphaCostWithMetal`). **Teste**: D-01 vira `it`.

### A2D-05 · BUG (bot) + RULE — 0 Eruditos
* Ver §2.2. **Repro**: amostra de bots (4–19% das rodadas com par); S-02/S-03 provam regra e ausência de papel padrão.
* **Correção mínima (bot)**: alocar Eruditos em pares (`scholars = 2*floor(...)`), reservar o par antes de Soldados quando `miss.knowledge > 0`, usar `persona.roles` também nos competentes. **(UI)**: mostrar o rendimento por papel ao digitar ("2 Eruditos = 1 Conhecimento; Biblioteca para o 3º par") e trocar "arraste" por texto real. **(Regra, decisão)**: se o objetivo é que o Erudito valha uma cabeça, rendimento por 1 até 2 ou 4 cabeças, ou Distrito Acadêmico +1 por par — não alterar sem decisão.
* **Teste**: bot competente de 20 rodadas mantém ≥1 par em ≥50% das rodadas-assento (hoje 4–19%).

### A2D-06 · BALANCE/RULE — escassez de Influência e Conhecimento por civilização
* **Repro**: S-01 (CHAR: só `saren`, `solenne` têm passivo de Influência; só `dravik, meridia, orinth, solenne, thalos` de Conhecimento). **Medido**: Influência produzida em 35 rodadas por bots ≤ 12 pontos (cartas/pulsos), sem passivo. **Observação**: a reforma de governo (4–6) + reivindicações já esgotam 8 iniciais.
* **Decisão pendente**: se a Ação Cívica deve render 1 (hoje) — alternativas fora do escopo desta lane: +1 por par de Eruditos (a promessa `scholar-influence-once-per-era` da Teia já aponta isso) ou Chancelaria/Tribunal produzirem. Antes de qualquer número, destravar A2D-01 e A2D-08.

### A2D-07 · RULE — Hegemonia por estoque acima do teto de armazenamento
* **Repro**: S-06a/b. Cultural: 25 Influência × teto 18 (hard cap 20; ninguém tem bônus de Influência). Econômica: 30 Riqueza × melhor teto 24 com os edifícios construíveis (30 só com Tesouro+Banco+Metrópole+Figura +6, inconstruíveis hoje).
* **Causa**: `alphaRules().hegemonyRequirements` compara `player.resources` com mínimos (25/30) sem relação com `limits.hardCap` (20/30). **Correção mínima**: baixar os mínimos abaixo do teto alcançável (ex.: Cultural 15 Influência) ou medir acumulado por Era. Decisão de regra (E-2 da parte 1 já pede decidir Era como calendário ou maturidade).
* **Teste**: S-06 vira `it`; invariante "todo limiar de estoque ≤ teto máximo alcançável".

### A2D-08 · LEGACY — Heranças inertes e promessas da Teia sem leitor
* **Repro**: S-04 (54 `PLANNED`; pesquisar não muda `cityYield`), S-05 (8 promessas de Conhecimento/Influência/Cultura sem leitor) e S-05b (9 promessas de economia/cidade). `unlocks` só são lidos para `district:`, `government:`, `work:` e 9 tags `rule:`; `building:*`, `elevate:*`, `unit:*`, `improvement:*` não são lidas por `hasUnlock`.
* **Efeito**: o jogador paga Conhecimento (e Influência em várias Heranças) por texto. Heranças servem hoje como marca barata de Ressonância (`registerAdvance`).
* **Correção mínima**: marcar o texto "em breve" na UI para as `PLANNED` e para as tags sem leitor, ou implementar primeiro as que movem as três moedas: `scholar-influence-once-per-era`, `scholar-no-library`, `first-advance-discount`, `rooted-presence-yields-culture`, `knowledge-limit-plus-3`.
* **Teste**: S-05/S-05b viram `it`; um teste por tag implementada.

### A2D-09 · BUG — Teocracia sem vantagens
* **Causa**: `templeMoodRecovery`/`templeCulture` só atuam com `TEMPLE` na cidade (`alpha-government.ts:85-93`, `alpha-city.ts:120`); o Templo é inconstruível (A2D-01). A limitação +1 Conhecimento em Saber é aplicada (`advanceCost`). **Correção**: A2D-01. **Teste**: cidade com Templo construído sob Teocracia recupera 1 Ânimo/rodada e rende 2 Cultura.

### A2D-10 · RULE/BALANCE — a Era é o portão
* Ver §3. O motor permite N7 na rodada 31, o que um agente de capital única consegue em 2 de 9 execuções (as duas, com a mesma semente 1). Para jogadores reais (E-2) a escada tem folga de Ordens e falta de comida/Ânimo. **Decisão pendente**; nada alterado.

### U-xx · Planos aceitos que viram inválidos
* **Causa comum**: `alpha-turn.ts:129-133` valida cada plano contra `state` sem refletir os planos anteriores; a Resolução é a primeira vez que a sequência é executada.
* **Correção mínima (uma só para U-01…U-08)**: no ramo `PLANNING` de `URBAN_ACTION`, validar o novo plano sobre uma **projeção**: `structuredClone(state)`, executar `performUrbanAction` dos planos já guardados (na mesma ordem, fase interna `URBAN_ACTIONS`, sem mutar o estado real) e só então rodar `urbanBlock` do plano novo. O mesmo `structuredClone` já é usado em `recruitCountBlock` (`alpha-urban.ts:75`, E-1). A projeção também deve revalidar a fila ao receber `ASSIGN_POPULATION` (U-05) — recusar a redistribuição que quebra um plano reservado — e entrar na prévia (U-09). Custo: O(planos) por comando, estado pequeno.
* **Alternativas**: (i) `ACTION_FAILED` devolver a Ordem (`spentCommands`) — corrige o prejuízo mas não a surpresa; (ii) UI mostrar "planejado" já com a fila simulada.
* **Teste de regressão**: cada REPRO vira `it`; e um teste de propriedade: qualquer sequência de planos aceitos por `applyAlphaCommand` em Planejamento não produz `ACTION_FAILED` na Resolução.
* **U-11**: decidir se o descarte por limite deve ocorrer ao fim da Resolução urbana (o cânone §9 fala em descartar após a ação). Hoje é por `alphaGain` imediato.
* **U-12**: contar `plannedUrbanActions` só para ações ≠ RESEARCH (a mesma regra de `alpha-urban.ts:49`).

---

## 6. Limites, o que não foi verificado

* O agente de `alpha-city-path` joga uma capital única contra um adversário parado; não mede expansão, guerra, ameaças nem comércio. Os resultados dizem o que é **possível**, não o que um humano faz.
* Mapas: sementes 1–3 do preset MIXED; sementes 2–3 caíram em Revolta no agente (comida/Ânimo), consistente com E-1 da parte 1; não separei efeito de mapa de efeito de política.
* Culturas/presença cultural (`CONTEST_PRESENCE`) só conferidas por leitura; não produzem recursos.
* O ledger não foi tocado; os cenários dos testes zeram `roundLedgers` antes de agir (a abertura é recriada preguiçosamente), para poder editar estoques à mão sem violar a equação do relatório.
* O texto "arraste" e a ausência de prévia na população foram lidos no código web; não rodei o navegador (política de testes de um ciclo por fatia).

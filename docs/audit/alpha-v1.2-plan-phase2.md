# Alpha V1.2 — planos da fase seguinte (edifícios e assaltos)

Branch `stabilize/alpha-v1.2-audit`. Nada aqui foi implementado: são planos com evidência. Fontes: código em `packages/` (verificado nesta sessão), `docs/product/rules-v5-proposal.md` (canon V5.1a), lanes A2D e E.

---

## 1. Catálogo urbano: 22 de 29 edifícios inacessíveis

### 1.1 O que o código faz hoje (verificado)
- `AlphaBuildingSchema` (`alpha-concept.ts:90-96`) lista **29** edifícios. `BuildingTypeSchema` do núcleo (`territory.ts:6`) lista **7**: `GRANARY MARKET LIBRARY ARCHIVE BARRACKS WORKSHOP CULTURAL_CENTER`.
- `urbanOptions` percorre `BuildingTypeSchema.options` (7) e `buildBlock` usa `rules.buildings[build.building]` do núcleo: os outros 22 **nunca aparecem** e o comando `URBAN_ACTION BUILD` os recusa pelo schema. É o item GR-23 do registro de lacunas (`canonical-gap-register.md:55`, "7 de 29", P1, ABERTO).
- O Distrito Marítimo é a única exceção: constrói o Porto por um caminho próprio (`alpha-urban.ts`, ramo `MARITIME`).

### 1.2 Quatro fontes que discordam
| Fonte | O que define | Estado |
|---|---|---|
| `DISTRICT_CATALOG` (`alpha-city-ladder.ts:76-85`) | família de edifícios por distrito (29 nomes) | só nomes e distrito; **sem custo nem efeito** |
| núcleo `territory.buildings` (7 edifícios) | distrito, custo em "materials", produção legado | valores v0.4 |
| canon V5.1a (`rules-v5-proposal.md` §5, §9, §17) | custos em Madeira/Pedra/Riqueza/Conhecimento/Cultura, efeitos, avanço que abre | **referência** |
| `balance.storagePerBuilding` | +5 de limite para 10 edifícios | implementado |

Divergências já visíveis (todas verificadas):
- **Arquivo**: núcleo = distrito *Administrativo*; catálogo e canon = *Acadêmico*. Hoje só se constrói onde o núcleo manda.
- **Custos**: Celeiro "2 materials" (núcleo) × "2 Madeira 1 Pedra" (canon); Mercado "2 materials + 1 wealth" × "2 Madeira 2 Riqueza"; todos os distritos "2–3 materials" (núcleo) × "3 Madeira 1 Pedra" (canon e Marítimo).
- **Efeito exibido × aplicado** (A2D, D-02): Agrário mostra +1 e rende +2; Cultural mostra "+1 Influência" e rende +1 Cultura; Mercado/Biblioteca/Oficina prometem +1 e só liberam o 3º par do papel.
- Canon cita **Manufatura, Monumento, Entreposto** que não existem no schema; o schema tem **Casa dos Escribas, Praça Cívica, Santuário, Casa da Tradição, Campo de Treino, Laboratório (edifício)** que o canon não define.

### 1.3 Classificação dos 22 (efeito × canon)
| Grupo | Edifícios | Situação |
|---|---|---|
| **T1 — efeito já existe no motor, só falta construir** (8) | `WAREHOUSE` (+5 Madeira, +5 Pedra de limite), `TREASURY` e `BANK` (+5 Riqueza cada), `FOUNDRY` (+5 Metal), `ACADEMY` (+5 Conhecimento), `CHANCELLERY` (+1 Administração, +5 Influência), `THEATER` (+5 Cultura), `TEMPLE` (+1 Cultura por Produzir, Teocracia) | leitores em `alpha-resources.ts` (`alphaStorageCapacity`), `alpha-city.ts:120` e `:271`, `alpha-government.ts:89` |
| **Já acessível por outro caminho** (1) | `PORT` | vem com o Distrito Marítimo |
| **T2 — canon define o efeito, o motor não lê** (7) | `MILL` (Moinho dobra com Rotação de Culturas; efeito-base não escrito), `OBSERVATORY` (prévia de perigo/costa antes de explorar; conta para a Hegemonia Científica), `COURT` (Tribunal, Urbanismo), `ARSENAL`, `SHIPYARD` (Estaleiro), `LIGHTHOUSE` (Farol), `IRRIGATION` (no canon é **melhoria** de hex, não edifício) | `0` referências de efeito em `packages/game-engine/src` e `apps/server/src` |
| **T3 — sem definição no canon** (6) | `SCRIBES_HOUSE`, `LABORATORY`, `CIVIC_SQUARE`, `SANCTUARY`, `TRADITION_HOUSE`, `TRAINING_GROUND` | decisão do PO: definir ou retirar do schema |

### 1.4 Por que é prioritário além de "faltam botões"
Vitórias e Obras dependem dos inacessíveis (canon §19, §17): Hegemonia **Científica** exige 3 Observatórios/Academias; **Econômica**, 2 Tesouros ou o Entreposto; **Cultural**, o Monumento das Vozes (que exige Teatro); as Obras de Legado têm pré-requisitos Academia, Chancelaria e Teatro. A Teocracia, sem Templo, só tem a limitação. A Cultura, sem Templo, só tem o Distrito Cultural (A2D). Os tetos de armazenamento ficam no básico (15/10).

### 1.5 Plano (cada fase com seus testes; **nenhum edifício sem efeito implementado fica disponível**)

**B0 · decisão do PO (antes de código)**
1. Fonte de verdade dos custos: canon V5.1a (recomendado). Os custos do núcleo passam a ser derivados do catálogo, não o contrário.
2. Família do Arquivo: Acadêmico (canon). Migração do que já existe (Arquivo construído no Administrativo) precisa de regra: manter onde está, sem nova construção ali.
3. T3: definir ou retirar. T2: aceitar construir `MILL`, `COURT`, `ARSENAL`, `SHIPYARD`, `LIGHTHOUSE`, `OBSERVATORY` só quando o efeito existir; `IRRIGATION` sai do conjunto de edifícios.

**B1 · catálogo único (domínio)**: `ALPHA_BUILDING_CATALOG` com `id, district, cost (AlphaResourcePool), advance (tag building:X da Teia), effect: {kind, params}, implemented`. Testes: (a) todo `building:X` da Teia aponta para um edifício do catálogo; (b) todo edifício do catálogo está em exatamente uma família de `DISTRICT_CATALOG`; (c) `implemented: true` ⇒ existe um leitor registrado para o `effect.kind` (teste que falha se um `kind` não tem leitor); (d) custos = tabela do canon (teste de paridade com um JSON do canon, não com o código).

**B2 · motor**: alvo `BUILD` aceita `AlphaBuildingSchema`; `buildBlock`/`performUrbanAction` leem o catálogo (distrito presente, `hasUnlock('building:X')`, não duplicado, `alphaCanAfford(custo, 'BUILD')`). Os 7 do núcleo continuam pelo comando do núcleo, mas o custo do núcleo é sobrescrito com o do catálogo na criação do jogo (uma só tabela). `syncCityMetadata` já preserva os edifícios fora do núcleo. Testes: bloqueios (sem distrito, sem avanço, duplicado, sem recursos incl. Cultura do Templo — depende de E-7, já corrigido), custo mostrado = custo pago, persistência (round trip e snapshot sem o edifício), 2 ativações e Ordens.

**B3 · T1 em ordem de menor risco**: `WAREHOUSE`, `TREASURY`, `BANK`, `FOUNDRY`, `ACADEMY`, `CHANCELLERY`, `THEATER`, `TEMPLE`. Para cada um, teste de efeito observável: limite sobe +5 respeitando o teto 30/20 e "um de cada tipo por civilização conta"; `TEMPLE` +1 Cultura em Produzir e Teocracia recupera Ânimo; `CHANCELLERY` +1 de capacidade administrativa (uma por civilização). Medição antes/depois com as políticas de A1 (descarte por limite, Elevar bloqueado por recurso, Cultura no estoque).

**B4 · T2** um a um, cada um com o efeito implementado e testado no mesmo PR; **B5 · T3** conforme B0.

**B6 · UI/bots**: efeito exibido gerado do `effect.kind` (uma fonte), linha de consequências (limite, par de papel); as políticas competentes passam a construir Armazém quando há excedente, Templo quando falta Cultura, Academia/Tesouro por limite. E2E: construir e ver o limite subir.

Riscos: os limites maiores reduzem o descarte (hoje 4–9 Alimento/rodada) e mudam a leitura do ritmo; por isso a medição antes/depois é parte de B3. A mudança é de BUG estrutural, mas **altera economia**: pede a comparação quantitativa que o PO exigiu.

---

## 2. Ameaças terrestres: 967 assaltos

### 2.1 Mecanismo (lido em `alpha-threats.ts`)
1. `activateThreats` (`alpha-phases.ts` `runMaintenance`, rodadas ímpares) manda cada ameaça `MARCHING` agir uma vez por rodada (`lastActedRound`).
2. `actThreat`: o alvo é a cidade mais próxima com menor defesa (`landTarget`). Ao chegar ao hex vizinho, o próximo passo é o hex da cidade ⇒ `assault(state, threat, hex)` e `break` (`:213`). **O Bando nunca entra na cidade.**
3. `assault` resolve o choque com a postura do defensor. Em vitória do mundo (`delta > 0`): `meta.mood = max(0, mood − 1)` (`:340`) e o Bando só se move se não houver cidade nem peça no hex.
4. Resultado: o Bando fica **adjacente, vivo, `MARCHING`**, e assalta de novo em cada rodada ímpar. `homeHexId` é gravado em `newThreat` e **nunca lido**. Não há recuo, tempo de vida, cansaço, nem teto de Ânimo perdido por rodada.
5. Recuperação do defensor: Governar (Cultura ou 2 Riqueza), Templo (hoje inconstruível), +1 de Ânimo na Virada de Era. Sem fontes de Ânimo, três vitórias levam a cidade de Estável a Revolta; a Revolta zera a produção (E-1).
6. Neutralizar: o Acampamento (`CAMPED`) paga recompensa uma vez ao ser destruído com a Ordem Expedição; Bando em campo não paga nada (I-22). Nas 22 partidas da lane E os bots destruíram **0** acampamentos; o ataque dos Bandos é 7–12 e a defesa média 1–3,5.

### 2.2 É defeito ou é regra?
- **Não é divergência do canon** (§21b): "o bando escolhe o alvo… move 1 hex por rodada… combate usa o mesmo motor… sempre em Assalto". O canon **não diz** o que o Bando faz depois de vencer.
- É **lacuna de regra com efeito estrutural**: um evento que o canon descreve como "ameaça" vira cerco permanente e sua única consequência mecânica escala só pelo Ânimo. Medido (lane E, QUICK 2p): Revolta em 25% (Era IV) e 43% (Era V) das cidades com ameaças contra 2% e 0% sem elas; hexes bloqueados custam ≤ 2,3% do Alimento nas Eras I–II (não é o canal).
- Medido por mim (A1, 7 pares peace × world, 4 jogadores, seed 1): Revolta em 3,8% das rodadas-assento sem Ameaças e **25,5% com**.

### 2.3 Opções (nenhuma remove a ameaça nem a torna decorativa)
| Opção | O que muda | Evidência |
|---|---|---|
| **R1 · o Bando recua ao Acampamento depois de assaltar** (`homeHexId`), volta a `CAMPED` e só parte na próxima Virada de Era ou `ATIVAR AMEAÇAS` | transforma cerco em investida; usa um campo que já existe | emulado pela lane E em 6 partidas 2p: assaltos 26→11 (QUICK) e 44→15 (STANDARD); Revolta 25%→5% e 29%→21%; população final +31% / +14% |
| R2 · teto de Ânimo perdido por rodada (ex.: 1 por cidade por rodada, qualquer número de assaltos) | limita o canal cumulativo sem mudar a frequência | não medida |
| R3 · Bando "exausto": depois de vencer age em rodada sim, rodada não | reduz a cadência | não medida |
| R4 · só melhorar a reação (alertas, bots atacam Bandos) | não corrige a regra | os bots não destroem acampamentos hoje |

Recomendação: **R1** como causa-raiz (o Bando para de ser um cerco), com R2 como segunda camada se a Revolta em "world" ainda passar de ~10% depois. Antes de implementar: repetir o par peace × world de A1 com R1 emulado, em 21/35/49, e checar que a defesa continua importante (assaltos continuam acontecendo; a pressão passa a ser episódica por Era).

### 2.4 Testes previstos
- Bando que vence um assalto volta ao hex do Acampamento (`homeHexId`) e fica `CAMPED`; a cidade perde no máximo o Ânimo daquele assalto; na rodada ímpar seguinte não há novo assalto; na Virada de Era seguinte o Bando é relançado.
- Bando que perde (pilha eliminada) some; Acampamento destruído ainda paga recompensa uma vez.
- Alvo: a cidade mais próxima, menor defesa, maior valor (canon) — inalterado.
- Piratas: não alterados.
- Regressão de balanço: assaltos/rodada e % de Revolta com e sem Ameaças nas políticas de A1.

### 2.5 Nomenclatura (futura, não aplicada)
"Saqueadores" / "Acampamento de Saqueadores" / "Piratas" / "Povos Independentes" com IDs internos mantidos; a lista de 26 linhas está em `alpha-v1.2-lane-e-threats-naming-legacy.md` §3.3. `THREAT_NAMES` deve virar a fonte única dos rótulos (hoje duplicados em 5 lugares).

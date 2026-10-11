# Alpha V1.2 — B0: reconciliação do catálogo de edifícios

Branch `stabilize/alpha-v1.2-audit`. Fonte única no código: `packages/game-domain/src/alpha-building-catalog.ts` (`ALPHA_BUILDING_CATALOG`, 29 entradas). Testes: `tests/v12-fix-catalog.test.ts`.

## 1. Quatro fontes que discordavam

| Fonte | Onde | O que define |
|---|---|---|
| **V5.1a (canon)** | `docs/product/rules-v5-proposal.md` §5, §9, §17, §18 e §23 | famílias, custos específicos, limites de armazenamento, avanço que abre cada edifício |
| **Catálogo atual** | `DISTRICT_CATALOG` (`alpha-city-ladder.ts`) | família por distrito (29 nomes), sem custo nem efeito |
| **Engine** | `alpha-resources.ts` (`alphaStorageCapacity`), `alpha-city.ts` (`cityYield`, `administration`, `growCost`), `alpha-government.ts` | os efeitos que de fato existem |
| **UI/schema** | `BuildingTypeSchema` do núcleo (7), `UrbanBuildTargetSchema`, `urbanOptions` | o que podia ser pedido com Construir (antes: 7) |

Regras de decisão usadas para escolher entre valores divergentes:
1. **Edifício já construível (os 7 do núcleo):** manter o custo e o distrito do núcleo. Mudá-los seria um rebalanceamento silencioso de algo que já se joga; a divergência com o canon fica registrada para a fase de economia.
2. **Edifício novo (os 8 com efeito pronto):** custo e requisito do **canon**, depois de checar se o custo é pagável com os recursos que existem. Não houve ajuste numérico.
3. **Edifício sem efeito no motor ou sem efeito no canon:** não é oferecido. Nenhum custo ou efeito foi inventado.
4. **IDs:** nenhum foi removido do schema (os saves podem citá-los).

## 2. Tabela de reconciliação (29 ids + 3 só do canon)

Era = Era da Teia em que o avanço abre o edifício (I Fundação · II Expansão · III Consolidação · IV Civilização · V Impérios · VI Potências · VII Ascensão). Custos em Madeira/Pedra/Metal/Riqueza/Conhecimento/Influência/Cultura.

| ID · Nome | V5.1a (família · custo · efeito · avanço/Era) | Catálogo/núcleo antes | Engine | UI/schema antes → depois | Custo escolhido | Requisito aplicado | Efeito aplicado | Estado | Decisão e motivo |
|---|---|---|---|---|---|---|---|---|---|
| `GRANARY` Celeiro | Agrário · 2 Mad 1 Ped · Crescer custa 2; limite Alimento +5 · Agricultura (I) | AGRARIAN · 2 materiais | `growCost` 2; armazenamento +5 | oferecido → oferecido | **núcleo (2 materiais)** | distrito Agrário | idem engine | **CORE** | custo do núcleo mantido (regra 1). Canon dá "Crescer custa 2" só com Agronomia (VI) para a civilização inteira; o motor dá 2 em qualquer cidade com Celeiro: divergência registrada, não tocada |
| `MILL` Moinho | Agrário · 2 Mad 1 Ped · **efeito não escrito** ("Moinho dobra" com Rotação de Culturas) · no código Rotação de Culturas (IV), no canon é edifício básico | família Agrária | **nenhum leitor** | não oferecido → não oferecido | — | — | — | **PENDING** | sem efeito definido no canon: ver decisão D1 |
| `IRRIGATION` Irrigação | **melhoria de hex**, 2 Mad 1 Ped, Irrigação (II) | família Agrária (nome) | `farmBonus` lê o avanço `web-irrigation`, não um edifício | — | — | — | Fazenda +1 Alimento (pelo avanço) | **IMPROVEMENT** | nunca é edifício urbano (decisão do PO) |
| `MARKET` Mercado | Comercial · 2 Mad 2 Riq · 3º par de Mercadores · Troca (I) | COMMERCIAL · 2 materiais + 1 Riq | `ROLE_BUILDING` (3º par) | oferecido → oferecido | **núcleo** | distrito Comercial | libera o 3º par (+1 Riqueza/par) | **CORE** | regra 1. O "+1 Riqueza" do núcleo é só texto: a descrição agora diz o que o motor faz |
| `TREASURY` Tesouro | Comercial · 2 Ped 3 Riq · Riqueza +5 · Moeda (II) | só nome | `storagePerBuilding` +5 | **inacessível** → construível | **2 Ped 3 Riq** | Comercial + Moeda | limite de Riqueza +5 | **CATALOG** | canon; pagável |
| `BANK` Banco | Comercial · 3 Ped 3 Riq 1 Conh · Riqueza +5 · Banco (V) | só nome | `storagePerBuilding` +5 | inacessível → construível | **3 Ped 3 Riq 1 Conh** | Comercial + Banco | limite de Riqueza +5 | **CATALOG** | canon. O "crédito 1×/Era" é regra do **avanço** (`rule:credit-once-per-era`, sem leitor), não do edifício |
| `SCRIBES_HOUSE` Casa dos Escribas | **não consta** (Escrita lista só Biblioteca e Arquivo) | tag `building:SCRIBES_HOUSE` em Escrita | nenhum | — | — | — | — | **UNDEFINED** | PO: manter fora (prioridade C) |
| `LIBRARY` Biblioteca | Acadêmico · 2 Mad 1 Ped 1 Conh · 3º par de Eruditos · Escrita (I) | ACADEMIC · 3 materiais + 1 Riq | `ROLE_BUILDING` | oferecido → oferecido | **núcleo** | distrito Acadêmico | libera o 3º par | **CORE** | regra 1 |
| `ACADEMY` Academia | Acadêmico · 3 Ped 2 Conh · Conhecimento +5 · Filosofia Natural (III) | só nome | `storagePerBuilding` +5 | inacessível → construível | **3 Ped 2 Conh** | Acadêmico + Filosofia Natural | limite de Conhecimento +5 | **CATALOG** | canon; pré-requisito de uma Obra do canon |
| `OBSERVATORY` Observatório | Acadêmico · 3 Ped 3 Conh · "prévia de perigo/costa antes de explorar" · Método Experimental (IV); conta para a Hegemonia Científica (§23) | só nome | a regra `exploration-preview-danger` **não tem leitor** | — | — | — | — | **PENDING** | decisão D2 |
| `LABORATORY` Laboratório | **é um avanço da Teia** (V), não edifício | tag `building:LABORATORY` | nenhum | — | — | — | — | **UNDEFINED** | PO: manter fora |
| `ARCHIVE` Arquivo | Acadêmico · 2 Mad 2 Ped 1 Conh · Conhecimento +5 · Escrita (I) | **núcleo: ADMINISTRATIVE** · 2 materiais; catálogo: ACADEMIC | `storagePerBuilding` +5 | oferecido (no Administrativo) → idem | **núcleo** | distrito **Administrativo** (núcleo) | limite de Conhecimento +5 | **CORE** | **divergência de família** (canon/catálogo: Acadêmico). Mantido o do núcleo: mudar a família quebraria o que já está construído em saves e mudaria onde se pode construir; decisão D3 |
| `COURT` Tribunal | Administrativo · 3 Ped 1 Riq 2 Infl · **efeito não escrito** · Urbanismo (III) | só nome | nenhum leitor | — | — | — | — | **PENDING** | decisão D2 |
| `CHANCELLERY` Chancelaria | Administrativo · 2 Ped 2 Riq 2 Infl · Influência +5 e Capacidade Administrativa +1 (uma por civilização) · Códigos (II) | só nome | `administration()` +1; `storagePerBuilding` +5 | inacessível → construível | **2 Ped 2 Riq 2 Infl** | Administrativo + Códigos | Cap. Administrativa +1 (uma) e limite de Influência +5 | **CATALOG** | canon |
| `CIVIC_SQUARE` Praça Cívica | **não consta** | nenhum avanço a abre | nenhum | — | — | — | — | **UNDEFINED** | manter fora |
| `BARRACKS` Quartel | Militar · 2 Mad 2 Ped · **sem efeito escrito** (o distrito Militar dá guarnição +1) · Formações (I) | MILITARY · 3 materiais; v0.4: guarnição +2 | **nenhum leitor** (a pilha de cidade só lê o distrito Militar) | oferecido → **não oferecido** | — | — | — | **PENDING** | **vendia um edifício sem efeito**: regra do PO ("nenhum edifício sem efeito"). Os já construídos continuam válidos. Decisão D4 |
| `ARSENAL` Arsenal | Militar · 2 Ped 3 Metal · **efeito e avanço não escritos** | só nome | nenhum | — | — | — | — | **PENDING** | decisão D2 (nenhum avanço o abre hoje) |
| `TRAINING_GROUND` Campo de Treino | **não consta** | nenhum avanço | nenhum | — | — | — | — | **UNDEFINED** | manter fora |
| `WORKSHOP` Oficina | Industrial · 2 Mad 1 Ped **1 Metal** · 3º par de Artesãos · Metalurgia (II) | INDUSTRIAL · 3 materiais | `ROLE_BUILDING` | oferecido → oferecido | **núcleo** | distrito Industrial | libera o 3º par | **CORE** | regra 1. Nota: o canon pede 1 Metal, e o Metal é escasso (A1: 0,01/rodada) |
| `FOUNDRY` Fundição | Industrial · 3 Ped 2 Metal · Metal +5 · Ferro (IV) | só nome | `storagePerBuilding` +5 | inacessível → construível | **3 Ped 2 Metal** | Industrial + Ferro | limite de Metal +5 | **CATALOG** | canon. O Metal não é obstáculo: `alphaCanAfford` deixa a Riqueza cobrir até 50% do custo de materiais, e 2 Metal faltando em 5 de materiais cabe (4 Riqueza) |
| `WAREHOUSE` Armazém | Industrial · 3 Mad 1 Ped · Madeira +5, Pedra +5 · Alvenaria (I) | só nome | `alphaStorageCapacity` (Madeira e Pedra) | inacessível → construível | **3 Mad 1 Ped** | Industrial + Alvenaria | limite de Madeira e Pedra +5 | **CATALOG** | canon |
| `THEATER` Teatro | Cultural · 3 Ped 2 Cult · Cultura +5 · Escolas de Expressão (IV) | só nome | `storagePerBuilding` +5 | inacessível → construível | **3 Ped 2 Cult** | Cultural + Escolas de Expressão | limite de Cultura +5 | **CATALOG** | canon; depende de E-7 (Cultura agora é debitada) |
| `CULTURAL_CENTER` Centro cultural | **não consta** | CULTURAL · 2 materiais + 1 Riq · "+1 Influência" | **nenhum leitor** (o +1 não é creditado) | oferecido → **não oferecido** | — | — | — | **PENDING** | mesma razão do Quartel; fora do canon. Decisão D4 |
| `TEMPLE` Templo | Cultural · 2 Ped 1 Cult · Cultura +1 por Templo · Narrativas Comuns (I) | só nome | `cityYield` +1 Cultura; Teocracia recupera Ânimo | inacessível → construível | **2 Ped 1 Cult** | Cultural + Narrativas | +1 Cultura por Produzir; Teocracia | **CATALOG** | canon; viável: o distrito Cultural já rende Cultura |
| `SANCTUARY` Santuário | **não consta** | nenhum avanço | nenhum | — | — | — | — | **UNDEFINED** | manter fora |
| `TRADITION_HOUSE` Casa da Tradição | **não consta** | nenhum avanço | nenhum | — | — | — | — | **UNDEFINED** | manter fora |
| `PORT` Porto | **incluído** no Marítimo · Navegação Costeira (I) | Marítimo | `isPort` / `harborHex` | já vinha com o distrito | incluído | distrito Marítimo | liga a cidade à água | **DISTRICT** | sem compra duplicada (decisão do PO); Construir recusa com "O Porto vem com o Distrito Marítimo." |
| `SHIPYARD` Estaleiro | Marítimo · 4 Mad 2 Metal · **efeito não escrito** · Arquitetura Naval (III) | só nome | nenhum | — | — | — | — | **PENDING** | decisão D2 |
| `LIGHTHOUSE` Farol | Marítimo · 3 Ped 1 Mad 1 Riq · **efeito não escrito** (a Herança "Rede de Faróis" o supõe) · Navegação Oceânica (IV) | só nome | nenhum | — | — | — | — | **PENDING** | decisão D2 |
| *(só canon)* Manufatura | Industrial · 3 Mad 3 Ped 1 Metal · Manufaturas Técnicas (IV, convergência) | — | — | tag `building:MANUFACTURE` sem id no schema | — | — | — | fora do escopo | id inexistente no schema; não criado |
| *(só canon)* Monumento | Cultural · 4 Ped 2 Cult · Patrimônio Compartilhado | — | — | tag `building:MONUMENT` sem id no schema | — | — | — | fora do escopo | idem |
| *(só canon)* Entreposto | Marítimo · 4 Mad 2 Ped 3 Riq · pré-requisito da Obra Entreposto das Marés | — | — | sem tag nem id | — | — | — | fora do escopo | idem |

Contagem final: **13 oferecidos** (5 CORE com efeito real + 8 CATALOG), 1 DISTRICT, 1 IMPROVEMENT, **8 PENDING** (6 do canon sem efeito + Quartel + Centro cultural), **6 UNDEFINED**. 13 + 1 + 1 + 8 + 6 = 29.

## 3. Outras divergências registradas (não corrigidas nesta fase)

| Tema | Canon | Código | Decisão |
|---|---|---|---|
| Avanço que abre o distrito **Industrial** | §5: Metalurgia (II); mesma §18 (Alvenaria, I): "Industrial, Muralha, Armazém, Elevar N3" | `DISTRICT_CATALOG`: Metalurgia; Web e `buildBlock`: Alvenaria (`district:INDUSTRIAL`) | o motor segue a Web (Alvenaria). Armazém (Alvenaria) fica construível já na Era I. O canon discorda de si mesmo; registrado |
| Custos de **distrito** | 3 Madeira 1 Pedra, todos | núcleo: 2–3 "materiais" (+ Riqueza em alguns); Marítimo: 3 Mad + 1 Ped | não alterado (regra 1) |
| Produção de distrito exibida | Agrário +2 Alimento; Cultural +1 Cultura | texto do núcleo: Agrário +1; Cultural "+1 Influência" | a Produção real (`cityYield`) já segue o canon; o texto das opções de **distrito** ainda vem do núcleo (A2D D-02, UX) |
| Limites de armazenamento | um de cada tipo por civilização conta | `alphaStorageCapacity` já faz isso | a opção avisa "já existe um na civilização" quando se repetiria |
| **Hegemonia** | §23: "Riqueza no limite"; Científica = Comunidade de Descoberta · 3 Observatórios/Academias · 2 Heranças | `rules.hegemonyRequirements` ainda lê a lista V5.1a antiga (registro V51B-14) | ver `alpha-v1.2-hegemony-audit.md` |

## 4. Decisões que dependem do PO (nada foi inventado)

| ID | Pergunta | Edifícios | Opção mínima sugerida |
|---|---|---|---|
| **D1** | Qual é o efeito-base do Moinho? O canon só diz "Moinho dobra" (Rotação de Culturas) | Moinho | (a) +1 Alimento por Produzir na cidade, +2 com Rotação de Culturas; (b) +1 Alimento por Fazenda trabalhada. Qualquer uma precisa de leitor e de teste |
| **D2** | Efeito de Observatório, Tribunal, Arsenal, Estaleiro e Farol. O canon dá custo e família, mas não o efeito (Observatório: só a regra do avanço) | os cinco | Observatório: contar para a Hegemonia e entregar `exploration-preview-danger`; Tribunal: +1 Governar (o distrito já dá); Estaleiro: exigido para recrutar Frota/Galera de Guerra na cidade; Farol: visão 2 no mar (a Herança já fala em visão 2); Arsenal: Grau das peças (o canon não diz). Cada um é uma regra nova |
| **D3** | Família do Arquivo: Acadêmico (canon) ou Administrativo (núcleo)? | Arquivo | manter até a fase de economia; migrar com regra de saves |
| **D4** | Quartel e Centro cultural: manter fora até terem efeito (aplicado) ou dar-lhes um efeito agora? | Quartel, Centro cultural | manter fora (aplicado); o Quartel pode ganhar "guarnição +1" lendo o limite de pilha |

Efeitos marcados como PENDING só devem ser implementados com uma dessas decisões; isso evita regras criadas sem aprovação e é o conflito estrutural que o PO pediu para parar e apresentar.

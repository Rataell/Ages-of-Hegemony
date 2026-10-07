# CITY & MATERIAL CULTURE CONCEPT V2

Status: **proposta de conceito**. Nada aqui altera código, motor, `BUILD`, `IMPROVE_HEX`, `controllerCityId`, assets finais, civilizações ou deploy.
Mockups V2: `docs/product/city-material-culture-mockups-v2.html` (também publicado como Artifact).
Substitui a **representação visual** da V1. A **mecânica-base** da V1 (corpo conectado, Porto como face da cidade, um hex uma cidade) está aprovada e é refinada aqui.

Princípio: preservar a lógica espacial própria do AoH e evitar que a cidade pareça um diagrama técnico de seis slots.

---

## 0. Correções à V1 (auditoria refeita)

A V1 auditou o contrato antigo (`territory.ts`: 7 distritos, 7 edifícios). O Alpha vivo tem mais coisa. Fatos novos, com origem:

| # | Fato | Onde | Efeito sobre a proposta |
|---|---|---|---|
| F1 | O catálogo de **8 distritos e 29 edifícios** do canon **já existe no domínio**. Distritos: Agrário, Comercial, Acadêmico, Administrativo, Militar, Industrial, Cultural, **Marítimo**. | `alpha-city-ladder.ts` (`DISTRICT_CATALOG`) | A V1 dizia "GAP-6: não está no motor". Correção: está no domínio, mas **o caminho de construção do motor ainda usa os 7+7 do núcleo econômico** (`alpha-urban.ts` lê `rules.buildings`). Os outros 22 edifícios não são construíveis hoje. |
| F2 | **Porto existe no catálogo**: edifício `PORT` do Distrito Marítimo (com `SHIPYARD` e `LIGHTHOUSE`). Marítimo tem `coastal: true`. | idem | A V1 dizia "Porto não é componente". Correção: é um edifício **do catálogo**, ainda não construível. |
| F3 | **`coastal: true` não é imposto em lugar nenhum** do motor. | busca por `coastal` em `game-engine` e `game-domain` | Um Distrito Marítimo poderia ser construído numa cidade interior. **GAP-9**. |
| F4 | **"Hex Trabalhado" já existe**: `city.workedHexIds` e o comando `ASSIGN_WORKED_HEXES`, que exige hex do jogador, `controllerCityId` igual à cidade, distância ≤ raio, terreno produtivo, e que nenhuma outra cidade o trabalhe. | `territory-commands.ts` | O conceito não nasce na V2: ele é **formalizado e ligado às melhorias**. |
| F5 | O **rendimento da cidade** já é: centro + hexes trabalhados (até `min(Capacidade, Produtores)`) + Produtores ociosos + pares de papéis com edifício + efeitos planos de distrito. Melhoria entra pelo rendimento do hex (`tileYieldBreakdown`). | `alpha-city.ts` (`cityYield`) | A produção que o usuário quer **já é assim**. Mudam as condições de entrada (§10), não a fórmula. |
| F6 | **Água**: `WATER = {COAST, SEA}` em `alpha-naval.ts`; a legalidade de unidade naval aceita o mesmo par (`alpha.ts`); `COAST` também aceita fundar cidade e reivindicar. `isPort` = cidade em Costa **ou** vizinha de Costa/Mar. | `alpha-naval.ts`, `alpha.ts`, `territory.ts` | Três lugares concordam no conjunto. Falta **uma definição nomeada** e a regra de borda (§8). |
| F7 | **Raio e vagas indexam `development` (1–5)**, não o nível N1–N7: `cityRadii[city.development - 1]` e `districtSlots[city.development - 1]`. A escada N1–N7 define 1,1,2,3,4,5,6 vagas, mas **não localizei onde o motor as impõe** (só em texto de opção). | `territory-commands.ts`, `territory-invariants.ts`, `alpha-city-ladder.ts` | Mantém o **GAP-2** da V1 e o amplia (§12). |
| F8 | `IMPROVE_HEX` só confere dono e terreno (V1, GAP-1). Melhoria **não** exige hex trabalhado, nem domínio conectado. | `territory-commands.ts` | Continua sendo a origem da Fazenda/Mina "do outro lado". |

---

## 1. Comparação com Clash of Cultures: Monumental Edition

**Limite desta seção.** O manual **não está no repositório** e eu não o li. A comparação vem do que conheço das regras públicas do jogo. Onde a precisão de regra importa, marquei **[confirmar]**: o dono do produto deve checar no manual antes de qualquer afirmação definitiva. Nada abaixo cita página ou texto.

### 1.1 Quatro colunas

| Tema | A. Princípio abstrato compartilhado (livre) | B. Mecanicamente parecido (cuidado) | C. Estruturalmente diferente no AoH | D. Evitar replicar |
|---|---|---|---|---|
| **Tamanho da cidade** | Cidades crescem e ficam mais fortes ao longo do jogo. | Há um teto de crescimento [confirmar]. | O nível N1–N7 vem de **população, Era, avanço da Teia e Elevar** (`ELEVATE_TABLE`). Construir **não** muda o nível. | Cada edifício ou maravilha ser uma peça que **aumenta o tamanho** da cidade. |
| **Edifícios** | Cidades se especializam construindo. | Um edifício de cada tipo por cidade [confirmar]. | Edifício pertence a uma **família de Distrito**; o Distrito ocupa **vaga** liberada pela cidade. Vaga é **capacidade**, não tamanho. | Edifício como peça física que "constitui" a cidade. |
| **Porto** | Porto liga a cidade à água. | Porto exige costa adjacente [confirmar]. | **Cais derivado da aresta de água** do hex da cidade; o Distrito Marítimo o amplia (Estaleiro, Farol). | Tratar Porto como um edifício comum de lista com o mesmo texto de requisito. |
| **Maravilha / Obra** | Obras grandes dão identidade e prestígio. | Maravilha exige um edifício prévio [confirmar]. | **Obra de Legado**: 3 passos, uma Ordem de Legado por passo, única no mundo, +4 Prestígio, pré-requisito = Distrito (e Fortaleza / 3 cidades conectadas em duas). | Lista de maravilhas, seus nomes, efeitos e custos. |
| **Coleta** | Cidade tira recursos do entorno. | Coleta do próprio espaço e dos adjacentes, em quantidade ligada ao **tamanho** [confirmar]. | **Hexes Trabalhados**: Produtores × Capacidade × melhoria × papéis × distritos. Tamanho da cidade não define quantos hexes se coletam. | "Cidade maior coleta mais espaços". |
| **Território** | Controlar espaço importa. | — | **Três camadas**: Território, Hex Trabalhado, Cidade (§9). | Fundir soberania e economia numa coisa só. |
| **Felicidade/Ânimo** | Estabilidade importa. | Há estados de humor [confirmar]. | Ânimo 0–6 com bandas e efeitos próprios (Abalada, Revolta) | Reusar nomes e limiares. |

### 1.2 O que o AoH **não** adota (invariantes)

> **INV-1.** O nível N1–N7 é função **somente** de: população, Era, requisitos da Teia e a ação Elevar.
> **INV-2.** Nenhuma construção (Distrito, Edifício, Fortificação, Porto, Obra) altera **nível, Capacidade da escada nem raio**.
> **INV-3.** Construções ocupam **vagas** que o nível já liberou. Vaga livre é capacidade ociosa, não "cidade menor".

Como validar na implementação (não agora): um teste de propriedade que constrói 0 e depois todos os edifícios possíveis numa cidade N5 e afirma `nível`, `capacidade` e `raio` iguais. Visualmente, a seção "Mesmo N5, mesma base" dos mockups mostra a regra: **a base é a mesma**, só a silhueta muda.

### 1.3 Cláusula limpa

O único empréstimo é abstrato: "a cidade cresce e suas construções a caracterizam". A relação física *peça = tamanho* é rejeitada de propósito. Não usar peças, formas, iconografia, nomes, listas, layouts nem regras de nenhum jogo existente.

---

## 2. A cidade não é um diagrama de seis slots

Internamente o motor pode continuar com vagas. Visualmente:

- **Sem** seis casinhas equidistantes, hex subdividido, fios, linhas de engenharia ou círculos de slot.
- **Uma miniatura de cidade** em leve perspectiva (vista de cima com volumes que "levantam"), com **contorno orgânico** e ruas curvas.
- **Posições de construção são âncoras autorais por nível**, invisíveis, **assimétricas**. Cada nível usa as primeiras *n* âncoras (n = vagas do nível). O desenho nunca mostra a âncora; mostra o **resultado**.
- **Vaga livre = terreno vago** (horta, entulho, pedra solta). É informação sem ser um símbolo de interface. O número de vagas (usadas/livres) segue nos painéis de texto.

### Crescimento por nível

| Nível | Silhueta | Elementos | Coração cívico |
|---|---|---|---|
| N1 Posto | assentamento pequeno | 3 cabanas, estandarte, fogueira | fogueira |
| N2 Aldeia | vila crescendo | ~6 casas, ruas de terra | poço |
| N3 Vila | vila crescendo | ~10 casas, praça | poço + praça |
| N4 Cidade | cidade mais densa | ~16 casas, salão cívico com torre | salão cívico |
| N5 Grande Cidade | cidade mais densa | ~24, casas de dois andares | monumento cívico |
| N6 Metrópole | metrópole marcante | ~32, avenida, cúpulas | fórum com cúpula dourada |
| N7 Metrópole Imperial | metrópole marcante | ~44, avenidas, palácio ao fundo | palácio com torres e cúpula |

Ver "Crescimento N1 → N7" nos mockups, em dois tamanhos.

---

## 3. Três famílias

Classificação de **cada componente real** do canon e do domínio.

### A. EDIFÍCIOS URBANOS (vivem dentro do hex da cidade)

| Componente | Origem | Onde na cidade | Observação |
|---|---|---|---|
| 8 Distritos | `DISTRICT_CATALOG` | quarteirão (chão tingido) | ocupa **vaga**; não muda nível |
| 29 Edifícios | `DISTRICT_CATALOG` | sobre o quarteirão do seu distrito | silhueta própria (§4) |
| Estruturas de civilização (Celeiro Comum, Caravana, Santuário Solar, Aqueduto; Casa de Câmbio e Laboratório Real em autoria) | `alpha-civilization-kits.ts` | variante visual de um edifício | **GAP-7**: não dizem em que vaga entram |
| Obra de Legado (12) | `alpha-legacy-works.ts` | **Marco**: peça alta ligada ao quarteirão do pré-requisito | §12 |

### B. INFRAESTRUTURA DE BORDA (da cidade, usa uma borda/condição espacial)

| Componente | Borda/condição | Observação |
|---|---|---|
| **Fortificação** (Paliçada, Muralha de Pedra, Fortaleza, Bastião, Cidadela) + estado Intacta/Danificada/Rompida | contorno da cidade | §13 |
| **Cais/Porto** (`PORT`) | aresta que toca Água Navegável | §7 |
| **Estaleiro** (`SHIPYARD`) | idem, na mesma frente d'água | do Distrito Marítimo |
| **Farol** (`LIGHTHOUSE`) | idem, ponto alto na costa | do Distrito Marítimo |

`PORT`, `SHIPYARD` e `LIGHTHOUSE` são *edifícios do catálogo* do Distrito Marítimo, mas **fisicamente** são de borda. Esta é uma regra de classificação: **a família segue onde a peça existe, não em que lista do catálogo ela aparece.**

### C. MELHORIAS TERRITORIAIS (existem em Hexes Trabalhados)

| Componente | Terreno | Observação |
|---|---|---|
| Fazenda `FARM` | Planície (ou feature Fértil) | bônus de Agronomia no rendimento |
| Madeireira `LUMBER_CAMP` | Floresta | — |
| Pedreira `QUARRY` | Colinas/Montanhas | pedra |
| Mina `MINE` | Colinas/Montanhas | metal se o hex tem a feature METAL |
| Pesqueiro `FISHERY` | Costa **com** feature Peixe | usa a mesma definição de Água Navegável (§8) |

Fora das famílias: **Estrada** (`BUILD_ROAD`) é uma **rede** do jogador, não de uma cidade (**GAP-8**: regras de ligação não auditadas); **Acampamentos/Ameaças** são sistema autônomo.

---

## 4. Edifícios urbanos: silhueta própria

**Gramática:** a **cor do quarteirão** (chão) identifica o distrito; a **forma do telhado** (volume) identifica o edifício. Três traços reconhecíveis no máximo por edifício. Nunca ícone colorido genérico.

Cores de distrito: Agrário verde-oliva, Comercial dourado, Acadêmico azul, Administrativo roxo, Militar vermelho, Industrial pedra, Cultural magenta, Marítimo turquesa.

| Distrito | Edifício | Silhueta (3 traços) |
|---|---|---|
| Agrário | Celeiro | telhado de palha comprido, porta escura, sacas à frente |
| | Moinho | casa pequena com **roda d'água** |
| | Irrigação | **arcada baixa** com faixa de água |
| Comercial | Mercado | **toldos listrados** sobre praça sem paredes |
| | Tesouraria | caixa de pedra com frontão branco e barra dourada |
| | Banco | colunas e **cúpula dourada** pequena |
| Acadêmico | Biblioteca | fachada longa com janelas em arco, telhado de ardósia |
| | Academia | **pórtico de colunas e cúpula azul** com pináculo |
| | Observatório | torre cilíndrica, **cúpula azul com fenda** e luneta |
| | Arquivo | torre estreita com **fileiras de janelas** douradas |
| | Laboratório | casa com chaminé e **redoma verde** |
| | Casa dos Escribas | casa de telhado alto + torrinha com lucarna |
| Administrativo | Chancelaria | bloco com **duas torres baixas** e bandeira |
| | Tribunal | escadaria, **frontão** e colunas cinza |
| | Praça Cívica | calçada aberta, coluna central e bandeira |
| Militar | Quartel | **pátio** com duas torres de canto e bandeiras |
| | Arsenal | galpão baixo escuro com **lanças em rack** |
| | Campo de Treino | terreno batido com **dois bonecos** de treino |
| Industrial | Oficina | casa com **chaminé** e fumaça |
| | Fundição | **chaminé alta**, porta brilhante, fumaça densa |
| | Armazém | galpão longo com **três portões** |
| Cultural | Templo | **degraus, colunas e frontão dourado** |
| | Teatro | **meia-arena** em degraus |
| | Centro Cultural | rotunda magenta com bandeiras |
| | Santuário | **torre alta de pináculo** com luz na porta |
| | Casa da Tradição | casa longa com **cumeeiras curvas** e totem |
| Marítimo | Porto | cais de madeira, **guindaste** e armazém |
| | Estaleiro | **casco em estaleiro** com cavernas à mostra |
| | Farol | **torre listrada** com luz no topo |

A folha completa está nos mockups ("29 edifícios urbanos").

**Quantos edifícios cabem num quarteirão?** O motor não limita: uma de cada tipo por cidade; o Distrito Acadêmico tem 6 edifícios possíveis. Regra visual: o quarteirão **cresce em bloco** e, acima de 3 edifícios, a escala de cada peça diminui 20 %. **GAP-13**: confirmar se um teto por distrito deve existir (decisão de regra, não proposta aqui).

---

## 5. Melhorias territoriais e o HEX TRABALHADO

### 5.1 Definição formal

> **Hex Trabalhado** = hex que **uma cidade específica** trabalha para produção econômica.
> Existe no motor como `city.workedHexIds`. Não é o mesmo que território nem que cidade (§9).

Uma melhoria territorial só pode ser construída num Hex Trabalhado.

### 5.2 Requisitos gerais (todos)

| # | Requisito | Já existe? |
|---|---|---|
| 1 | Hex **controlado pelo jogador** (`ownerId`) | sim |
| 2 | **Atribuído a uma cidade** (`controllerCityId = cidade`) | sim |
| 3 | **Dentro do alcance** da cidade (raio) | sim, indexado por `development` (**GAP-2**) |
| 4 | **Conectado ao domínio** da cidade: cadeia de hexes adjacentes, todos com o mesmo `controllerCityId`, até o hex da cidade | **não**: o motor mede só distância em linha reta (**GAP-12**) |
| 5 | **Trabalhado** pela cidade (`workedHexIds` inclui o hex) | sim (comando existente) |
| 6 | **Terreno compatível** e requisitos específicos (§5.3) | sim |

"Não usar apenas 'o hex é meu'": os requisitos 2–5 substituem isso.

### 5.3 Requisitos específicos

| Melhoria | Requisito específico |
|---|---|
| Fazenda | Planície, ou feature Fértil em Planície/Floresta/Colinas |
| Mina | Colinas ou Montanhas; rende **metal** só com a feature METAL |
| Madeireira | Floresta |
| Pedreira | Colinas ou Montanhas |
| Pesqueiro | Costa **com** feature Peixe |

### 5.4 Duas perguntas que a regra levanta (precisam de decisão)

1. **Ordem.** Como o hex tem de estar trabalhado antes, o jogador **atribui** o hex e **depois** melhora. A cidade só trabalha `min(Capacidade, Produtores)` hexes (N1 trabalha 1 hex além do centro). Isto **encarece de propósito** as melhorias: elas competem por um espaço de trabalho escasso, e esse espaço vem de população e papéis. É coerente com o desenho próprio do AoH. **Decisão D-A.**
2. **Hex desatribuído depois.** Proposta: a melhoria **permanece** e fica **ociosa** (rende 0, desenho esmaecido); o hex continua reservado àquela cidade. Alternativa: destruir a melhoria, que é punitiva demais. **Decisão D-B.**

### 5.5 Representação

Hex Trabalhado mostra um **estandarte pequeno na cor da cidade** plantado no hex (não um fio). Ao selecionar a cidade, o domínio dela acende suavemente (contorno), e os demais esmaecem. Melhoria ociosa = cor lavada, sem estandarte erguido.

---

## 6. Um hex, uma cidade

No V1 deste conceito, um hex Trabalhado pertence funcionalmente a **uma só** cidade.

- `controllerCityId` é **um único campo** por hex: já garante unicidade.
- Quando duas cidades **do mesmo jogador** podem alcançar o mesmo hex, **a primeira atribuição** define a cidade controladora.
- `ASSIGN_WORKED_HEXES` já recusa hex trabalhado por outra cidade: **sem produção duplicada**.
- **Realocação** (mover um hex de uma cidade a outra) fica **fora deste slice**.
- Disputa **entre jogadores** já é resolvida por `ownerId`.

---

## 7. Porto

> **Porto não é melhoria territorial.** É infraestrutura física **da cidade**.

Só existe se **o próprio hex da cidade compartilhar uma aresta com Água Navegável** (§8). Aparece **encaixado nessa aresta** e **avança sobre a água**.

### Dois níveis na mesma aresta

| Nível | O que é | Quando existe | Efeito mecânico |
|---|---|---|---|
| **Cais** | cais de madeira simples + um barco | **sempre** que há aresta de água (derivado, sem custo) | o mesmo que hoje: a cidade é porto (`isPort`) e lança frota |
| **Porto** (`PORT`) | cais ampliado, guindaste, armazém | edifício do Distrito Marítimo | os efeitos do catálogo ("Porto incluído"); nenhuma regra nova |
| **Estaleiro**, **Farol** | casco em estaleiro; torre luminosa | idem | idem |

Não há ligação nova entre construir o `PORT` e lançar frotas: a regra de hoje (aresta de água → porto) continua valendo. Se o jogo quiser que lançar frota exija o `PORT` construído, é **mudança de regra**, fora desta proposta. **GAP-10.**

### O que fica proibido

Cidade interior → cadeia territorial → Porto remoto. **Não existe.** Se o jogador quer Porto numa costa, precisa de uma **cidade costeira** ali. O Pesqueiro (Família C) **não** é Porto: dá comida e riqueza, nunca base naval.

### Qual aresta recebe o cais

Se há mais de uma aresta de água, o cais usa a que dá para **SEA**; empate, a de **menor índice**. Estaleiro e Farol usam outras arestas de água, se houver; senão dividem a mesma frente.

### Distrito Marítimo exige aresta de água (`coastal: true`)

Hoje o campo existe e não é imposto (F3). Para o Porto fazer sentido físico, a implementação futura deve impor: **Marítimo só em cidade com aresta de água**. É uma validação que **o catálogo já pede**; mesmo assim é mudança de regra aplicada. **Decisão D-C.**

---

## 8. ÁGUA NAVEGÁVEL (definição única)

Hoje o jogo usa o par `{COAST, SEA}` em três lugares, sem nome: conjunto `WATER` (naval), legalidade da unidade naval, e feature Peixe (`COAST`, `SEA`). **Proposta: nomear e centralizar.**

> **Água Navegável** = hex cujo terreno é **`COAST` ou `SEA`**.
> Costa é **anfíbia**: é terra reivindicável (aceita cidade e melhoria) **e** água onde navios entram.

Uma só função de domínio (`isNavigable(terrain)`), e uma derivada:

> **Aresta de água** de um hex = aresta compartilhada com um hex vizinho de Água Navegável.

Usada por **todos** estes consumidores, sem exceção:

| Consumidor | Hoje | Com a definição única |
|---|---|---|
| Porto/Cais | `isPort`: cidade em Costa **ou** vizinha de Costa/Mar | cidade com **≥ 1 aresta de água** |
| Lançamento de Frota | hex da cidade se Costa; senão primeiro vizinho de água | **inalterado** (a regra de onde lança não muda) |
| Movimento naval | `COAST`/`SEA` legais | **inalterado** |
| Bloqueio de porto | vizinhos de água | **inalterado** |
| Pesqueiro | terreno `COAST` + feature Peixe | **inalterado**; passa a citar a função |

**Única mudança comportamental:** uma cidade **em Costa sem nenhum vizinho de água** (terreno `COAST` isolado) deixa de ser porto. Hoje conta como porto sem ter aresta que justifique. Resolve o **GAP-3** (texto "ao lado de Costa/Mar" × lançamento exige água adjacente). **Medir antes de implementar:** quantas das posições de cidade nos mapas reais teriam essa característica (esperado: muito poucas ou nenhuma).

Rios e lagos **não** são navegáveis no V1 (RIVER é feature de terra).

---

## 9. CIDADE NÃO É TERRITÓRIO

Três coisas diferentes, três camadas.

| | **TERRITÓRIO** | **HEX TRABALHADO** | **CIDADE** |
|---|---|---|---|
| É | soberania / controle político | economia de **uma** cidade | núcleo urbano |
| Dado no motor | `tile.ownerId` | `tile.controllerCityId` + `city.workedHexIds` | `player.civilization.cities[]` |
| Serve a | fronteira, suprimento, tratados | produção, melhoria | vagas, distritos, defesa, Obras |
| Um hex pode ser | do jogador, sem cidade que o trabalhe | trabalhado por **uma** cidade | só **um** hex de cidade por cidade |
| Camada visual | tinta suave de fronteira (já existe) | estandarte pequeno + contorno ao selecionar | miniatura (§2) |
| Perda | por conquista de hex | junto com a cidade que o trabalha (se cai a cidade, o domínio vira território solto até ser reivindicado) | captura/destruição |

Essa separação é característica própria do AoH e é **o que impede** a cidade de virar "um conjunto de hexes que ela coleta".

---

## 10. Produção

**Não copiar** "a cidade coleta do próprio espaço e adjacentes por tamanho". O AoH mantém o sistema próprio. O motor já faz isto (`cityYield`):

1. **Centro** da cidade rende (sempre).
2. **Hexes Trabalhados**: até `min(Capacidade, Produtores)`. Cada um rende **o rendimento do hex** (terreno + feature + **melhoria**).
3. **Produtores ociosos** (sem hex) rendem 1 Alimento a cada dois.
4. **Papéis**: Artesãos, Mercadores e Eruditos rendem 1 do seu recurso por par, com o edifício da família.
5. **Distritos**: efeito plano por Produzir (ex.: Agrário +2 Alimento, Marítimo +1).
6. **Obras** ligadas à cidade, quando `ON_PRODUCE`.

Isto é: **população + papéis + melhorias + cidade + capacidade**.

### O que a V2 muda (e o que não)

| | |
|---|---|
| **Fórmulas, números** | **nada muda** |
| Fazenda/Mina | **modifica o rendimento daquele hex para aquela cidade**; **não** cria "mais um espaço coletável" |
| Número de hexes que rendem | **continua** limitado por Produtores e Capacidade; melhoria muda o **valor por hex**, não a **quantidade** |
| Entrada | só entra Hex Trabalhado conectado (§5): fim da Fazenda "do outro lado" |
| Visibilidade | a Mesa mostra por que um hex rende ou não: trabalhado/ocioso/desconectado |

### Efeito de jogo previsível (para a decisão D-A)

Como melhorias disputam hexes trabalhados, uma cidade pequena (Capacidade 1) decide **qual** hex vale a melhoria. Isto aumenta a escolha, e não a conta.

---

## 11. Design da cidade: três propostas visuais

As três aparecem nos mockups, com a mesma cidade N4 (Celeiro, Mercado, Academia), em três tamanhos.

- **A. Miniatura modular.** Sem base; cada peça é uma miniatura encaixada no terreno.
- **B. Base urbana evolutiva.** Uma base própria por N1–N7; construções só deformam a silhueta (blocos coloridos).
- **C. Híbrido.** Base por nível **+** poucas peças fisicamente reconhecíveis **+** quarteirão colorido no chão.

| Critério | A. Modular | B. Base evolutiva | **C. Híbrido** |
|---|---|---|---|
| Legibilidade em zoom distante | fraca (sem base, dissolve) | **boa** (massa clara) | **boa** (massa + 3–4 pontos distintos) |
| Poluição visual | alta | **baixa** | média-baixa, com limite de peças nomeadas |
| Sensação de board game | alta de perto | média (parece mapa) | **alta de perto**, limpa de longe |
| Porto / Fortificação / Obra | encaixam, mas somem no ruído | fortificação sim; Porto e Obra viram bloco | **os três têm forma própria e encaixe** |
| Mobile (hex menor) | pior | melhor | bom: perde detalhe, mantém massa + cor + 1 marco |
| Peças de arte (estimativa) | ≈ 60 + regras de encaixe | ≈ 32, sem identidade por edifício | ≈ 62, todas SVG procedural no V1 |

### Recomendação: **C (híbrido)**

Porque é a única em que **Celeiro e Mercado continuam sendo coisas diferentes** (exigência da §4 do pedido) sem sacrificar a leitura de longe. B é a mais barata mas apaga a identidade do edifício; A é a mais "mesa física" mas inunda o hex.

### Níveis de detalhe (LOD) para C

| Zoom | Hex | Mostra |
|---|---|---|
| **Mesa** (encaixe) | ≈ 42 px | base por nível + **cor dos quarteirões** + **marcos**: cais, muralha, Obra, fumaça |
| **Focar** (2,4×) | ≈ 100 px | + silhueta dos edifícios + casas |
| **Perto** | > 170 px | + janelas, estandartes, detalhes de ofício |

---

## 12. Obras de Legado

O sistema existente **permanece**: 12 Obras (6 canon + 6 convertidas), 3 passos, +4 Prestígio, única no mundo. **Sem Monumentos paralelos.**

Cada Obra concluída tem **três representações da mesma forma**:

1. **Silhueta própria** (a peça).
2. **Miniatura na cidade** como **Marco**: peça alta, a única que passa do contorno do hex, num vértice de fundo, ligada ao **quarteirão do seu pré-requisito**.
3. **Ilustração na carta**: a mesma silhueta em escala grande.

| Obra | Caminho | Pré-requisito | Silhueta |
|---|---|---|---|
| Arquivo dos Horizontes | Científico | Acadêmico | **torre escalonada** de estantes com cúpula azul |
| Casa dos Acordos | Político | Administrativo | **salão circular** em arcos concêntricos com bandeira |
| Entreposto das Marés | Econômico | Comercial | **armazém sobre palafitas** com régua de maré |
| Monumento das Vozes | Cultural | Cultural | **cinco monólitos** de alturas diferentes, com sulcos magenta |
| Cidadela da Vigília | Militar | Militar + Fortaleza | **torre de menagem** com duas torres e fogo de vigia |
| Estrada das Comunidades | Territorial | Industrial + 3 cidades ligadas | **arco triplo / portal** com marco de estrada |
| Instrumento do Firmamento | Científico | Acadêmico | **esfera armilar** sobre pilar |
| Pátio da Investigação | Científico | Acadêmico | **quadra de colunata** com cúpula central |
| Conselho dos Horizontes | Político | Administrativo | **círculo de pilares** com estandarte alto |
| Casa da Medida Comum | Econômico | Comercial | **disco-moeda vertical** sobre casa de colunas |
| Reservas dos Terraços | Territorial | Agrário | **pirâmide de terraços** com silo |
| Fundição Compartilhada | Econômico | Industrial | **duas chaminés ligadas por ponte**, forno aceso |

**Progresso** (nos mockups, para o Arquivo): passo 1 = **andaime**; passo 2 = **estrutura**; passo 3 = **coroada**. Cor do **caminho** no topo e no cabeçalho da carta.

**Regra de leitura:** até 2 Marcos desenhados por cidade; o excedente vira `+1`. **GAP-5:** confirmar se uma cidade pode abrigar mais de uma Obra.

Nenhum obelisco genérico.

---

## 13. Fortificação

**Integra a silhueta**: a muralha **segue o contorno da cidade**, não o hexágono.

| Nível | Forma |
|---|---|
| Paliçada | estacas de madeira em volta, partes abertas |
| Muralha de Pedra | muralha contínua de pedra com ameias |
| Fortaleza | + torres redondas e **portão** |
| Bastião | + bastiões angulares, muralha mais alta e escura |
| Cidadela | + **cidadela interior** no centro |

Estado: **Danificada** = trecho quebrado; **Rompida** = brecha aberta no lado do cerco.

**Leitura em zoom real (42 px):** a Paliçada (marrom) e a muralha de pedra (cinza) se distinguem do chão. **Fortaleza, Bastião e Cidadela quase se confundem.** Nesses níveis, o nível da Fortificação precisa ser repetido na placa da cidade ou aparecer só no Focar. Está dito aqui de propósito: **não prometo** diferenciar 3 níveis altos em 42 px.

---

## 14. Mockups V2 (A–F)

`docs/product/city-material-culture-mockups-v2.html`. Cada cena em **três tamanhos**: Perto (ampliado), Focar (hex ≈ 100 px) e **Mesa real** (hex ≈ 42 px, 1 px da página = 1 px da tela, medido numa captura real da Mesa em 1280×720).

| Cena | O que prova | Leitura em tamanho real |
|---|---|---|
| A. N1 | Posto = assentamento mínimo; vaga livre como horta | mancha de terra com pontos quentes; basta para N1 |
| B. N3 + Celeiro + Fazenda externa | urbano e territorial separados | Celeiro = ponto verde-palha na cidade; Fazenda = hex listrado |
| C. Cidade costeira + Porto | borda: o cais avança sobre a água | **o cais é a peça mais legível**: linha de madeira e barco |
| D. Cidade industrial + Mina | Hex Trabalhado com Mina; indústria urbana | fumaça + chão cinza = indústria; Mina = boca escura (**fraca na textura de colina**: pede contorno de contraste) |
| E. N5 fortificada | muralha na silhueta | anel de pedra é o primeiro sinal; torres só como "dentes" |
| F. N7 + Obra | Marco acima do contorno | pino alto de topo dourado; a silhueta única só aparece de perto |

### Honestidade sobre o que **não** se lê em 42 px

- **Edifício individual** (Celeiro × Mercado) **não** é distinguível; vira cor do quarteirão. A identidade do edifício vive do **Focar** para cima e no painel da cidade.
- **A Obra** é identificável como marco, não como *qual* Obra.
- **Os níveis altos da Fortificação** se confundem.
- **Mobile:** não medi. Estimo hex menor que 42 px; medir antes de aprovar o LOD "Mesa".

---

## 15. O que **não** foi feito

Nada foi implementado ou alterado: motor, `BUILD`, `IMPROVE_HEX`, `controllerCityId`, assets finais, civilizações, banco, deploy. Os mockups são **ilustrações procedurais descartáveis** em HTML, sem relação com o código do jogo.

---

## 16. GAPs

| ID | Tema | Estado na V2 |
|---|---|---|
| GAP-1 | `IMPROVE_HEX` só confere dono e terreno | **proposta** (§5) |
| GAP-2 | Raio e vagas indexam `development` (1–5); N1–N7 tem 7 passos | **em aberto** (§12 do pedido; opção abaixo) |
| GAP-3 | "ao lado de Costa/Mar" × lançamento exige água adjacente | **proposta** (§8) |
| GAP-4 | Distritos e Edifícios sem representação | **proposta** (§2, §4) |
| GAP-5 | Mais de uma Obra por cidade? | em aberto |
| GAP-6 | 29 edifícios existem no domínio, motor constrói só 7+7 | **correção da V1**; trabalho de fiação em slice próprio |
| GAP-7 | Estruturas de civilização sem vaga | em aberto |
| GAP-8 | Regras de Estrada | em aberto |
| GAP-9 | `coastal: true` do Marítimo não imposto | decisão D-C |
| GAP-10 | `PORT` (edifício) × `isPort` (derivado): o edifício deve ser exigido para lançar? | **recomendo não**; decisão |
| GAP-12 | Raio mede distância reta; falta cadeia de domínio conectado | **proposta** (§5.2, req. 4) |
| GAP-13 | Teto de edifícios por distrito | em aberto |

**Opção mínima para o GAP-2 (sem mexer em números).** Mapear o nível N1–N7 ao raio atual de forma que o **teto continue 3** e a sequência existente se preserve: N1–N2 → 1, N3–N4 → 2, N5–N7 → 3. É a menor mudança que remove a ambiguidade; a decisão e a conferência com os playtests ficam para a implementação. As vagas seguem a escada (1,1,2,3,4,5,6).

---

## 17. Decisões a aprovar

1. **Invariantes INV-1..3**: nível independente de construções.
2. **Representação C (híbrido)** com LOD Mesa/Focar/Perto; vagas como âncoras invisíveis, vaga livre como terreno vago.
3. **Três famílias** A/B/C e a regra "a família segue onde a peça existe".
4. **Hex Trabalhado** como requisito de melhoria, com os 6 requisitos (incluindo domínio conectado), e **D-A** (atribuir antes de melhorar) e **D-B** (melhoria ociosa permanece).
5. **Um hex, uma cidade**, sem realocação.
6. **Porto**: aresta de água; Cais derivado + Porto/Estaleiro/Farol do Distrito Marítimo; **Água Navegável = COAST ∪ SEA**; **D-C** (impor `coastal`).
7. **Obras**: Marco com silhueta própria, 3 passos de construção, ilustração de carta com a mesma forma.
8. **Fortificação** na silhueta, sabendo que os 3 níveis altos se confundem a 42 px.
9. **GAP-2**: mapeamento mínimo N1–N7 → raio (ou outra opção).

Ordem sugerida quando for implementar, cada passo independente: (i) `isNavigable`/`waterEdges` no domínio e `isPort` por aresta; (ii) `IMPROVE_HEX` por Hex Trabalhado conectado + estado ocioso; (iii) arte de cidade C em N1–N7; (iv) quarteirões e silhuetas; (v) cais, Fortificação por silhueta; (vi) Marcos das Obras e cartas; (vii) fiação dos 22 edifícios restantes (slice de regra, separado).

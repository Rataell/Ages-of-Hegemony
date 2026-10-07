# AOH MATERIAL CULTURE & CIVILIZATIONS CONCEPT V1

Status: **proposta de conceito**. Nada aqui altera código, motor, regras, IDs de civilização, snapshots, banco, Estradas, `workedHexIds`, raio, produção, `IMPROVE_HEX`, assets finais ou deploy. Nenhum teste do jogo foi rodado.
Mockups: `docs/product/aoh-material-culture-mockups-v1.html` (também publicado como Artifact).
Base: V2.1 da cidade (direção visual **aprovada**), com o escopo mecânico **corrigido** neste documento.

---

## 0. Escopo e regra de segurança

**Não é uma reforma do sistema territorial.** O único comportamento espacial que se busca agora é o **Porto**. Todo o resto preserva o motor atual até auditoria específica.

Cada proposta recebe uma classe antes de qualquer mudança:

| Classe | Significado | Precisa de aprovação específica? |
|---|---|---|
| **A. VISUAL ONLY** | arte, pele, texto de exibição | não |
| **B. REPRESENTAÇÃO DE REGRA EXISTENTE** | desenhar o que o motor já faz | não |
| **C. MUDANÇA DE REGRA** | altera o que o motor aceita ou calcula | **sim, uma a uma** |

Um mockup não cria regra por si. Onde um desenho depende de uma regra que o motor não tem, o item está marcado **C** e fica pendente.

---

## 1. Regra visual consolidada da cidade

Aprovada na V2.1 e mantida.

1. **Miniatura escultórica**: pedra, madeira, bronze; base de pedra elevada; luz do alto à esquerda; leitura top-down com leve perspectiva; pouca saturação; poucos elementos dominantes.
2. **N1–N7 por massa, densidade, altura e contorno**, não por multiplicar casinhas. O nível continua vindo de população, Era, Teia e Elevar.
3. **Todos** os Distritos e Edifícios (incluindo Estaleiro e Farol) pertencem ao **hex da cidade**. Nenhum ganha hex próprio por ter requisito de costa ou terreno.
4. **Fortificação** modifica o contorno da cidade. Na Mesa: paliçada, muralha, muralha com torres. Os 5 níveis exatos ficam no Focar e no selo.
5. **Obra de Legado** é peça física especial da cidade: pino alto na Mesa, forma no Focar, ilustração completa na carta.
6. **Três níveis de detalhe**: Mesa (≈ 42 px, sem os 29 edifícios), Focar (≈ 100 px), Detalhe (painel/carta, todos os edifícios).
7. **Cor do jogador = posse** (aro da base, estandarte). **Identidade da civilização = outra camada** (§11).
8. Território, Hex Trabalhado e melhorias territoriais: **o que o jogo mostra hoje continua**. Nada novo é proposto aqui (§4).

---

## 2. Porto: a única mudança espacial deste slice

### 2.1 O que está aprovado conceitualmente
- O Porto pertence à **cidade**.
- A cidade precisa **tocar água válida**.
- O cais **atravessa uma aresta** do hex da cidade e se projeta, em parte, para o hex de Água Navegável adjacente.
- O Porto **nunca** aparece remotamente no território.

```
Cidade [terra] ── aresta ── cais ──▶ [água navegável]
```

### 2.2 Estaleiro e Farol
Dentro da cidade. O Estaleiro fica junto da zona portuária; o Farol é o marco vertical da frente d'água. Os três pertencem à mesma cidade. A **construção** deles depende da condição costeira do Distrito Marítimo (decisão D-P3).

### 2.3 Auditoria da contradição: Distrito Marítimo × `PORT`

Fatos do código (nada alterado):

| Fato | Onde |
|---|---|
| O catálogo do Distrito Marítimo diz `effect: 'Porto incluído; navios; pesca +1 Alimento'` e `coastal: true`; `buildings: ['PORT','SHIPYARD','LIGHTHOUSE']` | `alpha-city-ladder.ts` (`DISTRICT_CATALOG`) |
| A Navegação Costeira desbloqueia **ao mesmo tempo** `district:MARITIME`, `building:PORT`, `unit:COASTAL_VESSEL`, `improvement:FISHERY` | `alpha-web.ts` |
| Farol tem custo próprio na Herança (`Farol custa −2`), indicando edifício comprável | `alpha-web.ts` (Thalos) |
| O motor de construção usa o conjunto antigo (7 distritos + 7 edifícios do núcleo econômico). **Nenhum** dos 29 edifícios do catálogo, incluindo `PORT`, é construível hoje | `alpha-urban.ts` |
| `coastal: true` **não é verificado** em nenhum ponto do motor | busca por `coastal` |
| Cidade é porto (`isPort`) se está em `COAST` **ou** vizinha de `COAST`/`SEA`; frotas lançam sem qualquer edifício | `alpha-naval.ts` |

Duas leituras do catálogo, em conflito:
- **Texto do efeito** → o Distrito Marítimo **já inclui** o Porto.
- **Lista de edifícios + token de desbloqueio** → `PORT` é um **edifício separado**.

Opções:

| Opção | O que significa | Regra muda? | A favor | Contra |
|---|---|---|---|---|
| **O1. Marítimo inclui o Porto** | construir o Distrito Marítimo já cria o Porto; `PORT` vira o nome do componente incluído, não uma compra à parte | sim (C) | segue o texto do efeito; mais simples | a lista de edifícios fica nominal |
| **O2. `PORT` é edifício à parte** | Distrito Marítimo e `PORT` são compras distintas; o texto "Porto incluído" muda | sim (C) | segue a lista e o token | custo do `PORT` **não existe** no catálogo; mexe em economia |
| **O3. Porto derivado, Marítimo amplia** | a regra de hoje (aresta de água → porto) continua; Marítimo/`PORT` só ampliam o desenho | **não** (B) | zero risco no motor | contradiz "Porto é Edifício do Distrito Marítimo" |

**Recomendação:** adotar **O3 como interim visual** (classe B), e **decidir O1 × O2 depois**, com os custos do catálogo em mãos. Enquanto isso o cais é **desenhado** onde o motor já diz que a cidade é porto **e** existe aresta de água para desenhá-lo. O motor **não** é alterado até a decisão **D-P1**.

### 2.4 Caso-limite descoberto
`isPort` aceita cidade em `COAST` **sem nenhum vizinho de água**. Aí **não há aresta** para o cais atravessar: o desenho **não é possível**. Opções: (a) não desenhar cais e sinalizar; (b) apertar `isPort` para exigir aresta de água (mudança C). Antes de decidir, **medir** quantas posições de cidade nos mapas reais caem nesse caso (esperado: poucas ou nenhuma). Decisão **D-P2**.

### 2.5 Água Navegável
`{COAST, SEA}` já é o par usado por navegação, legalidade naval, bloqueio, lançamento e Pesqueiro. Nomeá-lo numa única função **sem mudar comportamento** é B. Mudar o `isPort` é C (D-P2).

### 2.6 Porto cultural
A **gramática** é universal (cidade → cais atravessa a aresta → água). A **forma** muda por cultura: mole de pedra (Leontia), píer de madeira com postes laqueados (Yuhan), embarcadouro de pedra encaixada com barcos de junco (Tawanta). Ver mockup B.

---

## 3. Matriz VISUAL / REGRA EXISTENTE / MUDANÇA DE REGRA

| # | Proposta | Classe | Estado |
|---|---|---|---|
| 1 | Cidade como miniatura escultórica (base, pedra, madeira, bronze) | A | aprovada (V2.1) |
| 2 | N1–N7 por massa, densidade, altura, contorno | A | aprovada |
| 3 | Vaga livre como terreno vago, vagas invisíveis | B | aprovada (representa as vagas da escada; **onde o motor as impõe** não foi localizado) |
| 4 | Distritos como pátios discretos + pequeno acento | A | aprovada |
| 5 | 29 silhuetas de edifício e 3 LODs | A | aprovada |
| 6 | Distritos e Edifícios, incluindo Estaleiro e Farol, no hex da cidade | B | é a lógica atual |
| 7 | Fortificação no contorno, 3 leituras na Mesa | B | representa nível e estado existentes |
| 8 | Obras: peça + carta com a mesma silhueta | B + A | sistema atual preservado |
| 9 | **Pele cultural** da cidade (material, telhado, ornamento, estandarte) | **A** | nova, esta proposta |
| 10 | Cor do jogador = posse (aro, estandarte) | B | já existe posse |
| 11 | **Cais atravessando a aresta** onde `isPort` é verdadeiro e há aresta de água | **B** | nova, esta proposta |
| 12 | Água Navegável nomeada como `{COAST, SEA}` sem mudar comportamento | B | refatoração/documento |
| 13 | Apertar `isPort` (exigir aresta de água) | **C** | **pendente** (D-P2, medir antes) |
| 14 | Marítimo inclui Porto (O1) ou `PORT` à parte (O2) | **C** | **pendente** (D-P1) |
| 15 | Impor `coastal` do Marítimo | **C** | **pendente** (D-P3) |
| 16 | Hex Trabalhado como requisito de melhoria | **C** | **SUSPENSA** |
| 17 | Domínio conectado / cadeia territorial | **C** | **SUSPENSA** (§4) |
| 18 | Melhoria ociosa | **C** | **SUSPENSA** |
| 19 | Mapeamento nível N1–N7 → raio funcional | **C** | **SUSPENSA** |
| 20 | Um hex, uma cidade | B | já é assim (`controllerCityId` único; `ASSIGN_WORKED_HEXES` recusa hex de outra cidade) |
| 21 | Território × Hex Trabalhado × Cidade como três camadas (descrição) | B | descreve o existente |
| 22 | Estradas | — | **NÃO MUDAM** |
| 23 | Nomes, matrizes e arte das civilizações | A | proposta (IDs técnicos preservados) |
| 24 | Chassi mecânico das 18 civilizações preservado | B | nada muda |
| 25 | Renomear assinaturas e heranças **só como texto de exibição** | A | atenção: ver §5.3 |
| 26 | Retratos, tipo de Líder, título | A | proposta |
| 27 | Passiva e Poder 1×/Era dos Líderes | B | preservados do chassi |
| 28 | Cartas de Líder, Civilização, Obra, Herança | A | proposta |
| 29 | Trocar IDs, apagar civs atuais, snapshots, banco | — | **não feito; fora de escopo** |

Resumo: **a única candidata a mudança de regra neste slice é o Porto** (itens 13–15), e nenhuma está aprovada.

---

## 4. Auditoria de risco: Estradas e sistemas territoriais

O AoH **já tem Estradas**. Antes de qualquer regra nova de "corpo conectado" ou cadeia territorial, o que existe hoje:

| Sistema | Como funciona hoje | Onde |
|---|---|---|
| Lista de estradas | `state.roads`: lista **global da partida** de hexes, sem dono nem cidade. Sem duplicatas; nunca em `SEA`/`UNKNOWN` | `alpha.ts` |
| Construir | `BUILD_ROAD`: ação principal; o hex precisa ser do jogador e sem estrada; custa `roadCost` (1 Materiais) com desconto de kit (Dravik) | `alpha-turn.ts` |
| Movimento | peça terrestre paga **1** por hex com estrada, em vez do custo do terreno | `alpha-military.ts`, `alpha-unit-options.ts` |
| Suprimento | a busca de suprimento atravessa hexes **do jogador** ou hexes **sem dono que tenham estrada** | `alpha-military.ts` |
| Governo | Autocracia dá suprimento a até N hexes de uma estrada | `alpha-military.ts`, `alpha-government.ts` |
| Descobertas | a "passagem natural" abre até 3 estradas numa região | `alpha-discoveries.ts` |
| Kits e Heranças | Dravik: Estrada e melhorias mais baratas, depósitos alcançam 2 hexes; Kaedor: rota terrestre atravessa Deserto sem Estrada | `alpha-kits.ts`, `alpha-web.ts` |
| Obra de Legado | Estrada das Comunidades exige cidades **ligadas por rotas comerciais** (não por estradas) | `alpha-legacy-works.ts` |
| Hexes trabalhados | `ASSIGN_WORKED_HEXES`: hex do jogador, `controllerCityId` = a cidade, distância ≤ raio (por `development`), terreno produtivo, uma cidade só. **Não** consulta estradas | `territory-commands.ts` |
| Mapa | o mapa desenha segmentos de estrada entre hexes de estrada e cidades | `hex-map.tsx` |

### Riscos identificados

| # | Risco | Por quê |
|---|---|---|
| R1 | Uma cadeia territorial nova **colide com a conectividade por estrada**. | "Conexão" já tem **três significados**: suprimento (hexes próprios ou estrada em hex sem dono), rotas comerciais, e a rede de estradas. Um quarto significado cria ambiguidade. |
| R2 | A estrada é **global e não pertence a cidade**. | Uma regra "hex conectado à cidade X" não tem onde se apoiar nas estradas atuais. |
| R3 | A estrada vale em **hex sem dono**; o domínio de cidade só em hex do jogador. | As duas redes não coincidem. |
| R4 | `ASSIGN_WORKED_HEXES` mede **raio por `development` (1–5)**, não por nível N1–N7. | Tocar no raio mexe em Capacidade, produção e expansão. |
| R5 | Kits (Dravik, Kaedor) e a Autocracia **dependem de estradas**. | Qualquer regra que redefina "ligado" altera três kits/governos. |
| R6 | A produção da cidade depende de `workedHexIds`, Capacidade e Produtores. | Um requisito novo para melhorias muda a economia inicial. |

**Decisão deste slice: Estradas não mudam.** Registro como **dependências para a auditoria futura**: `state.roads`, `BUILD_ROAD`, custos de movimento, BFS de suprimento, Autocracia, kits Dravik/Kaedor, Obra Estrada das Comunidades, `ASSIGN_WORKED_HEXES`, `cityRadii`, `development`.

---

## 5. Civilizações híbridas histórico-mitológicas

### 5.1 Método: **chassi preservado, identidade substituída**

A diversidade mecânica das 18 civilizações atuais já está desenhada (afinidade, Trait, Limitation, assinatura, 3 Heranças, marca, e para as 12 jogáveis Líder e 3 cartas). A proposta **não reescreve** nada disso. Ela **troca a identidade cultural** de cada chassi:

- o **ID técnico** (`aurelia`, `valgard`…) **permanece**;
- o **nome canônico, a matriz, a lenda, a arquitetura, a paleta, o símbolo e o padrão** são novos;
- **Trait, Limitation, assinatura, Heranças e marca** mantêm as regras atuais; só o **texto de exibição** pode ganhar o nome cultural;
- o **Líder** mantém Passiva e Poder 1×/Era do chassi; mudam retrato, nome, título e tipo.

Isto torna tudo **A (visual)** ou **B (representa regra existente)**.

### 5.2 O que "híbrida" significa aqui
Base cultural/histórica **reconhecível** + mitos, lendas ou tradições **associados** + **interpretação artística original** do AoH. Não é "Roma, Egito, Grécia, China" como um Civilization genérico, e não é fantasia sem âncora. A cobertura **não se limita à Europa/Mediterrâneo**: África (3: Nilo, Sahel, costa suaíli), Europa (3), Ásia ocidental e central (4), Sul da Ásia (1), Ásia oriental (2), Sudeste Asiático (1), Oceania (1), Américas (2) e estepe eurasiana (1), num total de 18.

Os **nomes** abaixo são **de trabalho**: derivados de termos das culturas, **sem** reproduzir etnônimos vivos. Precisam de revisão de pronúncia e sensibilidade.

### 5.3 Pontos de atenção do chassi
- **Qaghar (`targan`)**: a assinatura atual é "Elefantes de Guerra" e a Limitation cita elefantes. A cultura é a estepe, sem elefantes. Renomear para "Cavalaria Couraçada" é **texto**, mas a Limitation precisa de reescrita equivalente, **sem mudar o efeito**. Resolver antes de qualquer arte.
- **Nomes de assinaturas** como "Celeiro Comum" ou "Santuário Solar" aparecem em kits, mensagens e testes. Renomear só em exibição exige localizar todas as strings; **não feito**.
- **Afinidade Militar** só existe na expansão (Qaghar). Os 12 pilotos cobrem 7 afinidades.

### 5.4 Chassi → cultura (18)

| ID técnico | Nome proposto | Afinidade | Matriz | Estado atual |
|---|---|---|---|---|
| `aurelia` | Nokor | Agrária | Sudeste Asiático khmer | jogável |
| `valgard` | Leontia | Territorial | Mundo helênico (póleis) | jogável |
| `meridia` | Uruvane | Econômica | Mesopotâmia (cidades-rio) | jogável |
| `thalos` | Moanara | Marítima | Oceania polinésia | jogável |
| `saren` | Sahelor | Política | África Ocidental sudanesa (mandê) | jogável |
| `kor` | Yuhan | Territorial | China antiga (Xia–Zhou) | jogável |
| `orinth` | Bharani | Científica | Subcontinente indiano (Índia clássica) | jogável |
| `nymara` | Eirelon | Cultural | Mundo celta atlântico | jogável |
| `veyra` | Sogdar | Política | Sogdiana (Ásia Central, Rota da Seda) | jogável |
| `solenne` | Parsar | Cultural | Irã aquemênida | jogável |
| `dravik` | Tawanta | Territorial | Andes (Tawantinsuyu e antecessores) | jogável |
| `elyra` | Yaxkin | Científica | Mesoamérica (maia clássica) | jogável |
| `kaedor` | Sabaar | Econômica | Arábia do Sul (Sabeia) e Rota do Incenso | AUTHORING |
| `lumaris` | Seorin | Científica | Coreia (Silla e Goryeo) | AUTHORING |
| `targan` | Qaghar | Militar | Estepe eurasiana | AUTHORING |
| `iskara` | Khemara | Cultural | Egito antigo (vale do Nilo) | AUTHORING |
| `veloria` | Kilwara | Política | Costa suaíli do Índico | AUTHORING |
| `norvak` | Fjorvik | Marítima | Escandinávia (era dos vikings) | AUTHORING |

### 5.5 12 civilizações piloto

### 1. Nokor · `aurelia` · piloto
- **Matriz e período:** Sudeste Asiático khmer, séc. IX–XIII d.C..
- **Componente lendário:** Tradição de fundação: o sábio Preah Thong e a princesa-naga Neang Neak (lenda khmer, não fato histórico).
- **Identidade visual:** Templos-montanha escalonados, galerias de torres em botão de lótus, reservatórios (baray), casas sobre palafitas. Materiais: Arenito rosado, laterita, madeira escura, bronze. Símbolo: Espiga de arroz (emblema atual) + cabeça de naga nos beirais. Padrão: Faixas de lótus sobre ondas do reservatório.
- **Paleta:** #b28b6a · #6e4a3a · #7b8a5a · #b8914d
- **Afinidade:** Agrária (inalterada).
- **Trait (atual):** Fazendas trabalhadas rendem +1 Alimento quando a cidade Produz.
- **Limitation (atual):** Manutenção militar +1 Alimento a cada 4 peças.
- **Assinatura:** Celeiro Comum → Reservatório-Celeiro. Mesmo efeito; só o nome e a peça.
- **3 Heranças (nomes atuais):** Celeiros Comuns · Terraços Dourados · Reserva da Abundância.
- **Candidatos a Líder** (recomendado em negrito; título: *Guardião dos Reservatórios*): **Jayavarman VII** [Histórico] rei khmer, séc. XII–XIII; grandes obras públicas; Neang Neak [Lendário] princesa-naga da lenda de fundação.

### 2. Leontia · `valgard` · piloto
- **Matriz e período:** Mundo helênico (póleis), séc. VIII–IV a.C..
- **Componente lendário:** Tradição heroica: Homero, Héracles e a memória de Termópilas, já lendarizada pelos relatos posteriores.
- **Identidade visual:** Mármore claro, peristilos e pátios, telhados baixos de terracota, ágora, muralhas ciclópicas. Materiais: Mármore, calcário, terracota, bronze. Símbolo: Passo (emblema atual) + escudo redondo de bronze. Padrão: Friso de meandro.
- **Paleta:** #e4ddc8 · #b9825e · #7f8a8f · #b8914d
- **Afinidade:** Territorial (inalterada).
- **Trait (atual):** +1 alcance de suprimento para peças em território próprio.
- **Limitation (atual):** Enviados custam +1 Influência.
- **Assinatura:** Guarda de Escudos → Falange de Escudos. Mesmo efeito; família guarda.
- **3 Heranças (nomes atuais):** Passos Guardados · Refúgios de Montanha · Muralha Viva.
- **Candidatos a Líder** (recomendado em negrito; título: *Senhor das Passagens*): **Leônidas I** [Histórico] rei de Esparta, Termópilas (480 a.C.); a tradição o heroiciza; Héracles [Mitológico] herói mitológico.

### 3. Uruvane · `meridia` · piloto
- **Matriz e período:** Mesopotâmia (cidades-rio), c. 3500–500 a.C..
- **Componente lendário:** Epopeia de Gilgamesh, rei de Uruk (figura atestada nas listas de reis; a epopeia é literária e lendária).
- **Identidade visual:** Tijolo cru e cozido, zigurates, muralhas maciças, pátios internos, canais. Materiais: Tijolo de barro, betume, cerâmica vidrada azul, cobre. Símbolo: Ondas (emblema atual) + cunha. Padrão: Friso de tijolo em relevo.
- **Paleta:** #b98f62 · #8a6a4a · #2f6f8f · #c9a54e
- **Afinidade:** Econômica (inalterada).
- **Trait (atual):** A primeira oferta comercial concluída em cada rodada rende +1 Riqueza.
- **Limitation (atual):** Fortificação não passa de Muralha de Pedra até a Era IV.
- **Assinatura:** Caravana → Karum (entreposto). Mesmo efeito.
- **3 Heranças (nomes atuais):** Feira das Margens · Entrepostos Fluviais · Casa das Margens.
- **Candidatos a Líder** (recomendado em negrito; título: *Voz das Margens*): **Enheduanna** [Histórico] alta sacerdotisa e poeta de Ur, séc. XXIII a.C.; Gilgamesh [Semi-lendário] rei de Uruk, semi-lendário.

### 4. Moanara · `thalos` · piloto
- **Matriz e período:** Oceania polinésia, expansão polinésia, séc. I–XIV d.C..
- **Componente lendário:** Tradição de Māui, que pesca as ilhas, e do navegador Kupe (tradições vivas; requer consulta cultural).
- **Identidade visual:** Casas longas de madeira e palha, plataformas cerimoniais de coral e basalto, canoas duplas. Materiais: Madeira, fibra, coral, basalto, concha. Símbolo: Farol (emblema atual) como fogo-baliza. Padrão: Geometria de tecido de casca (kapa).
- **Paleta:** #2f6f7f · #c9b389 · #6b4e3a · #e0d6bd
- **Afinidade:** Marítima (inalterada).
- **Trait (atual):** Revelar uma região costeira rende +1 Conhecimento.
- **Limitation (atual):** Exércitos terrestres têm −1 de suprimento longe de rotas.
- **Assinatura:** Infantaria Naval → Guerreiros de Canoa. Mesmo efeito; família infantaria.
- **3 Heranças (nomes atuais):** Cartas das Marés · Infantaria Naval · Rede de Faróis.
- **Candidatos a Líder** (recomendado em negrito; título: *Cartógrafo das Costas*): **Kupe** [Semi-lendário] navegador da tradição māori, semi-lendário; Māui [Mitológico] herói-demiurgo, tradição viva.

### 5. Sahelor · `saren` · piloto
- **Matriz e período:** África Ocidental sudanesa (mandê), séc. XIII–XIV d.C..
- **Componente lendário:** Epopeia de Sundiata, conservada pelos griôs (tradição oral; a epopeia mistura história e lenda).
- **Identidade visual:** Edifícios de terra crua com vigas salientes, pátios, praças de assembleia, muralhas de adobe. Materiais: Adobe, vigas de madeira, estuque de terra, ouro. Símbolo: Três vozes (emblema atual). Padrão: Faixas de lama tingida (bogolan).
- **Paleta:** #b5835a · #6f4a32 · #d4b98a · #2f5a4a
- **Afinidade:** Política (inalterada).
- **Trait (atual):** Tratados de Saren duram +1 rodada.
- **Limitation (atual):** Cavalaria custa +1 Alimento de manutenção.
- **Assinatura:** Enviado Senatorial → Griô-Enviado. Mesmo efeito.
- **3 Heranças (nomes atuais):** Convocação dos Vales · Enviados Senatoriais · Concílio Permanente.
- **Candidatos a Líder** (recomendado em negrito; título: *Presidente do Concílio*): **Sundiata Keita** [Histórico] fundador do Mali; a epopeia o lendariza; Sogolon [Lendário] mãe de Sundiata na epopeia.

### 6. Yuhan · `kor` · piloto
- **Matriz e período:** China antiga (Xia–Zhou), tradição do séc. XXI a.C. ao séc. III a.C..
- **Componente lendário:** Yu, o Grande, que doma as inundações (tradição fundadora; semi-lendário).
- **Identidade visual:** Taipa (terra batida), madeira escura laqueada, telhados de beirais curvos, muralhas, fundições de bronze. Materiais: Taipa, madeira laqueada, telha cinza, bronze. Símbolo: Bigorna (emblema atual) + caldeirão de bronze. Padrão: Meandro de raios (leiwen).
- **Paleta:** #6e5a48 · #8e4a3c · #3f4448 · #b8914d
- **Afinidade:** Territorial (inalterada).
- **Trait (atual):** Pedreiras trabalhadas em Colinas rendem +1 Pedra quando a cidade Produz.
- **Limitation (atual):** Frotas têm −1 movimento.
- **Assinatura:** Engenheiros de Cerco (nome mantido). Mesmo efeito.
- **3 Heranças (nomes atuais):** Mutirão de Oficinas · Forja Profunda · Têmpera de Kor.
- **Candidatos a Líder** (recomendado em negrito; título: *Mestre da Transformação*): **Yu, o Grande** [Semi-lendário] fundador tradicional da dinastia Xia; semi-lendário; Lu Ban [Histórico] artífice do séc. V a.C., muito lendarizado.

### 7. Bharani · `orinth` · piloto
- **Matriz e período:** Subcontinente indiano (Índia clássica), séc. V–VI d.C..
- **Componente lendário:** Tradição dos sábios-astrônomos e dos ciclos de eras (cosmologia clássica).
- **Identidade visual:** Poços escalonados, mandapas, templos de pedra com torre, observatórios de pedra. Materiais: Arenito, madeira, estuque, cobre. Símbolo: Olho (emblema atual) como mirante. Padrão: Treliça geométrica (jali).
- **Paleta:** #c28a5a · #9a6a4a · #3d5f7a · #b8914d
- **Afinidade:** Científica (inalterada).
- **Trait (atual):** O primeiro avanço de cada domínio custa 1 Conhecimento a menos.
- **Limitation (atual):** Cavalaria custa +1 Alimento de manutenção.
- **Assinatura:** Astrônomo-Pioneiro (nome mantido). Mesmo efeito.
- **3 Heranças (nomes atuais):** Círculo de Estudos · Mirante das Medidas · Síntese de Orinth.
- **Candidatos a Líder** (recomendado em negrito; título: *Observador-Chefe*): **Aryabhata** [Histórico] matemático e astrônomo, c. 476 d.C.; Varahamihira [Histórico] astrônomo e polímata, séc. VI.

### 8. Eirelon · `nymara` · piloto
- **Matriz e período:** Mundo celta atlântico, séc. VI a.C.–V d.C..
- **Componente lendário:** Ciclos míticos irlandeses e galeses; Amergin, poeta lendário que canta a terra.
- **Identidade visual:** Casas redondas de madeira e palha, fortes de colina, círculos de pedra, bosques consagrados. Materiais: Carvalho, palha, turfa, pedra, bronze. Símbolo: Folha (emblema atual) + nó. Padrão: Entrelaçado e espirais.
- **Paleta:** #5f7a4f · #7a5a3a · #9a9a8a · #b8914d
- **Afinidade:** Cultural (inalterada).
- **Trait (atual):** A Ação cívica rende +1 Influência.
- **Limitation (atual):** Modernizações custam +1 Metal.
- **Assinatura:** Bardo-Enviado (nome mantido). Mesmo efeito.
- **3 Heranças (nomes atuais):** Partilha de Sementes · Bosque da Memória · Raízes Compartilhadas.
- **Candidatos a Líder** (recomendado em negrito; título: *Memória Viva*): **Amergin** [Lendário] poeta lendário dos ciclos míticos; Boudica [Histórico] rainha dos icenos, séc. I d.C..

### 9. Sogdar · `veyra` · piloto
- **Matriz e período:** Sogdiana (Ásia Central, Rota da Seda), séc. IV–VIII d.C..
- **Componente lendário:** Tradições épicas iranianas partilhadas (Rostam); ausência de mito fundador próprio bem preservado, a completar por pesquisa.
- **Identidade visual:** Casas-fortaleza de adobe, caravançarais, salões com murais, torres de guarda. Materiais: Adobe, madeira, estuque pintado, lápis-lazúli. Símbolo: Encruzilhada (emblema atual). Padrão: Medalhões de pérolas.
- **Paleta:** #a77c52 · #3f6f8f · #8a3f3a · #d8c9a0
- **Afinidade:** Política (inalterada).
- **Trait (atual):** Enviados custam 1 Riqueza a menos.
- **Limitation (atual):** Infantaria só avança para Profissional na Era III.
- **Assinatura:** Embaixador Errante (nome mantido). Mesmo efeito.
- **3 Heranças (nomes atuais):** Câmara de Trocas · Padrões de Confiança · Encruzilhada do Mundo.
- **Candidatos a Líder** (recomendado em negrito; título: *Árbitro das Rotas*): **Nanai-vandak** [Histórico] mercador sogdiano das Cartas Antigas, séc. IV; Spitamenes [Histórico] líder sogdiano contra Alexandre.

### 10. Parsar · `solenne` · piloto
- **Matriz e período:** Irã aquemênida, séc. VI–IV a.C..
- **Componente lendário:** Shahnameh: Jamshid e Rostam (epopeia literária posterior; lenda, não história).
- **Identidade visual:** Terraços palaciais de pedra, salas hipostilas com capitéis de touro e leão, relevos de delegações. Materiais: Calcário cinza, tijolo vidrado azul, cedro, ouro. Símbolo: Sol (emblema atual) como luz. Padrão: Friso de rosetas e procissão de povos.
- **Paleta:** #b7ad98 · #2f5f8f · #c9a54e · #8a5a4a
- **Afinidade:** Cultural (inalterada).
- **Trait (atual):** Disputas culturais de Solenne ganham +1 na defesa.
- **Limitation (atual):** Avanços de Conhecimento da Era I custam +1.
- **Assinatura:** Santuário Solar → Santuário da Luz. Mesmo efeito (+1 legado por era).
- **3 Heranças (nomes atuais):** Assembleia de Vozes · Instituições Abertas · Ágora das Nações.
- **Candidatos a Líder** (recomendado em negrito; título: *Anfitrião das Nações*): **Ciro, o Grande** [Histórico] fundador do Império Aquemênida, c. 600–530 a.C.; Jamshid [Lendário] rei lendário do Shahnameh.

### 11. Tawanta · `dravik` · piloto
- **Matriz e período:** Andes (Tawantinsuyu e antecessores), séc. XV–XVI d.C. (raízes anteriores).
- **Componente lendário:** Origem de Manco Cápac e Mama Ocllo (tradição de origem inca, lenda).
- **Identidade visual:** Alvenaria de pedra encaixada sem argamassa, portas trapezoidais, terraços agrícolas, depósitos, estradas. Materiais: Granito e andesito, palha ichu, adobe. Símbolo: Arcos (emblema atual) como trapézio e canal. Padrão: Tocapu (quadros xadrez).
- **Paleta:** #a9a493 · #7d7967 · #b79c62 · #a54a3a
- **Afinidade:** Territorial (inalterada).
- **Trait (atual):** Estradas e melhorias custam 1 Madeira/Pedra a menos.
- **Limitation (atual):** Rotas comerciais rendem −1 Riqueza.
- **Assinatura:** Aqueduto → Canal de Terraços. Mesmo efeito (−1 alimento para crescer).
- **3 Heranças (nomes atuais):** Jornada de Construção · Aquedutos · Redes de Abastecimento.
- **Candidatos a Líder** (recomendado em negrito; título: *Arquiteto das Obras*): **Pachacútec** [Histórico] governante inca do séc. XV; a tradição dinástica o amplia; Mama Ocllo [Lendário] figura de origem da lenda inca.

### 12. Yaxkin · `elyra` · piloto
- **Matriz e período:** Mesoamérica (maia clássica), séc. III–IX d.C..
- **Componente lendário:** Popol Vuh: os Gêmeos Heróis e Ixquic (texto de tradição maia quiché; mito).
- **Identidade visual:** Pirâmides escalonadas de calcário estucado, observatórios, praças, abóbadas em falso arco. Materiais: Calcário, estuque, jade, madeira. Símbolo: Chama (emblema atual) como marca de tempo. Padrão: Glifos e entrelaçados.
- **Paleta:** #cfc6a8 · #4f7a5a · #b4532f · #b8914d
- **Afinidade:** Científica (inalterada).
- **Trait (atual):** Revelar uma região rende +1 Conhecimento.
- **Limitation (atual):** Cerco custa +1 Metal.
- **Assinatura:** Cartógrafa (nome mantido). Mesmo efeito.
- **3 Heranças (nomes atuais):** Escola Itinerante · Curadoria de Saberes · Vínculos Comunitários.
- **Candidatos a Líder** (recomendado em negrito; título: *Curadora Itinerante*): **Ixquic** [Mitológico] figura do Popol Vuh; K’inich Janaab’ Pakal [Histórico] governante de Palenque, séc. VII.

### 5.6 Expansão para 18 (os 6 slots AUTHORING)

Hoje estes seis **não têm Líder, capital nem cartas** e ficam como AUTHORING. A proposta já entrega matriz, identidade e candidatos a Líder; o que falta (capital, 3 cartas) continua sendo autoria futura.

### 13. Sabaar · `kaedor` · expansão
- **Matriz e período:** Arábia do Sul (Sabeia) e Rota do Incenso, séc. X a.C.–VI d.C..
- **Componente lendário:** Tradição da Rainha de Saba (relatos bíblicos, corânicos e etíopes; sensível, requer revisão).
- **Identidade visual:** Torres de pedra e tijolo, templos de pilares monolíticos, cisternas, barragem de Marib. Materiais: Calcário, alabastro, tijolo cru, incenso. Símbolo: Moeda (emblema atual) como balança. Padrão: Friso de íbex e escrita monumental.
- **Paleta:** #c6a577 · #7a5a3a · #d9c9a0 · #3f5f6a
- **Afinidade:** Econômica (inalterada).
- **Trait (atual):** Tesouros dão +2 de capacidade.
- **Limitation (atual):** Armazéns dão apenas +2.
- **Assinatura:** Casa de Câmbio (nome mantido). Mesmo efeito.
- **3 Heranças (nomes atuais):** Caravanas do Deserto · Entrepostos de Oásis · Casa das Balanças.
- **Candidatos a Líder** (recomendado em negrito; título: *Senhora das Caravanas*): **Rainha de Saba** [Lendário] figura lendária de tradições múltiplas; Rei sabeu histórico [Histórico] a pesquisar.

### 14. Seorin · `lumaris` · expansão
- **Matriz e período:** Coreia (Silla e Goryeo), séc. VII–XIII d.C..
- **Componente lendário:** Mito de Dangun e dos fundadores de reinos (tradição fundadora coreana).
- **Identidade visual:** Observatório de pedra, templos de madeira com beirais, arquivos, tumbas em túmulo. Materiais: Granito, madeira, telha cinza, papel. Símbolo: Prisma (emblema atual). Padrão: Nuvens e fios de beiral.
- **Paleta:** #7f8a8a · #a74a3c · #dcd5c4 · #2f4f4a
- **Afinidade:** Científica (inalterada).
- **Trait (atual):** Bibliotecas rendem +1 Conhecimento.
- **Limitation (atual):** Guarnição máxima de cidade −1.
- **Assinatura:** Laboratório Real (nome mantido). Mesmo efeito.
- **3 Heranças (nomes atuais):** Luz dos Arquivos · Observadores da Costa · Academia do Horizonte.
- **Candidatos a Líder** (recomendado em negrito; título: *Observadora do Brilho*): **Rainha Seondeok** [Histórico] Silla, 632–647; tradição do observatório; Dangun [Mitológico] mito fundador.

### 15. Qaghar · `targan` · expansão
- **Matriz e período:** Estepe eurasiana, séc. III a.C.–XIII d.C..
- **Componente lendário:** Epopeia de Oğuz Kağan (tradição turca).
- **Identidade visual:** Tendas-palácio de feltro, carros, fortes de madeira, túmulos em kurgan. Materiais: Feltro, couro, madeira, ferro, ouro. Símbolo: Presa (emblema atual) como estandarte de cauda de cavalo. Padrão: Estilo animal estepário.
- **Paleta:** #8a6a4a · #c8b99a · #5a4a3a · #b8914d
- **Afinidade:** Militar (inalterada).
- **Trait (atual):** Oficinas ao lado de Minas rendem +1 Metal.
- **Limitation (atual):** Celeiros dão apenas +2 e Elefantes exigem Alimento extra.
- **Assinatura:** Elefantes de Guerra → Cavalaria Couraçada. Atenção: o texto atual cita elefantes; renomear é mudança de texto, a regra fica.
- **3 Heranças (nomes atuais):** Marcha das Estepes · Arqueiros Montados · Horda Disciplinada.
- **Candidatos a Líder** (recomendado em negrito; título: *Senhor das Marchas*): **Modu Chanyu** [Histórico] chefe xiongnu, c. 209 a.C.; Oğuz Kağan [Lendário] herói da epopeia.

### 16. Khemara · `iskara` · expansão
- **Matriz e período:** Egito antigo (vale do Nilo), c. 3000–300 a.C..
- **Componente lendário:** Ciclo de Osíris, Ísis e Hórus (mito da religião antiga).
- **Identidade visual:** Pilonos, obeliscos, colunatas papiriformes, mastabas e pirâmides, templos funerários. Materiais: Calcário, arenito, tijolo cru, ouro, lápis-lazúli. Símbolo: Espiral (emblema atual) como ciclo. Padrão: Friso de papiro e lótus.
- **Paleta:** #e0d5b8 · #3f8f9a · #c9a54e · #7a4a3a
- **Afinidade:** Cultural (inalterada).
- **Trait (atual):** Cada Obra de Legado concluída rende +2 Prestígio.
- **Limitation (atual):** Perde 1 Legado ao abandonar uma cidade cultural.
- **Assinatura:** Guardião dos Ancestrais → Guardião da Necrópole. Mesmo efeito.
- **3 Heranças (nomes atuais):** Fogo Sagrado · Guardiões do Templo · Chama Perene.
- **Candidatos a Líder** (recomendado em negrito; título: *Guardiã da Memória*): **Hatshepsut** [Histórico] faraó do Novo Reino, séc. XV a.C.; Ísis (Aset) [Mitológico] deusa do mito egípcio.

### 17. Kilwara · `veloria` · expansão
- **Matriz e período:** Costa suaíli do Índico, séc. IX–XVI d.C..
- **Componente lendário:** Tradições de fundação das cidades suaílis (xirazis e Shungwaya; incertas e sensíveis, requer revisão).
- **Identidade visual:** Casas de pedra de coral com nichos, portas entalhadas, mesquitas e cais de coral. Materiais: Coral talhado, cal, madeira de mangue, velas de dhow. Símbolo: Elos (emblema atual). Padrão: Entalhe de portas e ondas.
- **Paleta:** #d8cdb4 · #2f7f8a · #8a5a3a · #b8914d
- **Afinidade:** Política (inalterada).
- **Trait (atual):** Pactos de Não Agressão custam metade da Influência.
- **Limitation (atual):** Exércitos combinados têm no máximo 4 peças por hex.
- **Assinatura:** Voz Federada (nome mantido). Mesmo efeito.
- **3 Heranças (nomes atuais):** Rota das Moedas · Prismas de Veloria · Bolsa das Marés.
- **Candidatos a Líder** (recomendado em negrito; título: *Voz da Liga*): **Fundador xirazi de Kilwa** [Semi-lendário] tradição de fundação; a pesquisar; A pesquisar [Histórico] figura histórica a escolher com consultoria.

### 18. Fjorvik · `norvak` · expansão
- **Matriz e período:** Escandinávia (era dos vikings), séc. VIII–XI d.C..
- **Componente lendário:** Sagas e Eddas; Skaði e Freydís Eiríksdóttir (figura de saga).
- **Identidade visual:** Salões longos de madeira com telhado de turfa, estaleiros de drakkar, pedras rúnicas. Materiais: Carvalho e pinho escuro, turfa, ferro, pedra. Símbolo: Floco (emblema atual) como nó de gelo. Padrão: Entrelaçado de animais.
- **Paleta:** #4a3a2c · #7a8a8f · #c9d2d4 · #8a3f3a
- **Afinidade:** Marítima (inalterada).
- **Trait (atual):** Unidades ignoram penalidades de terreno frio.
- **Limitation (atual):** Fazendas em planície rendem −1 Alimento.
- **Assinatura:** Rompe-Gelo (nome mantido). Mesmo efeito.
- **3 Heranças (nomes atuais):** Presas do Norte · Inverno Longo · Flocos de Norvak.
- **Candidatos a Líder** (recomendado em negrito; título: *Senhora do Inverno*): **Freydís Eiríksdóttir** [Semi-lendário] figura das sagas, semi-histórica; Skaði [Mitológico] deusa-gigante do inverno.

---

## 6. Líderes

### 6.1 Convenção de tipo (obrigatória)
Cada Líder carrega uma **etiqueta de tipo**, visível na carta:

| Tipo | Regra de apresentação |
|---|---|
| **Histórico** | pode ter data e atribuição; a nota cita a fonte ampla |
| **Semi-lendário** | **sem** datas de nascimento e morte; nota "tradição de…" |
| **Lendário** | idem; nota cita a obra ou tradição (epopeia, saga) |
| **Mitológico** | nota "figura de mito"; nunca descrito como pessoa |

**Nenhuma figura lendária é apresentada como fato histórico.** Figuras ligadas a **religiões vivas** não são Líderes; usam-se heróis, reis, sábios, poetas ou figuras de mito de religiões antigas, sempre com a etiqueta.

### 6.2 O que a carta traz
Retrato próprio, nome, título, civilização, **Passiva** e **Poder 1× por Era** (textos reais do chassi), símbolo da civilização e moldura/padrão da cultura. Os 12 pilotos e os 6 de expansão têm 2 candidatos cada, listados em §5.5 e §5.6, com recomendado em negrito.

### 6.3 Sensibilidade
Moanara, Sahelor, Tawanta, Yaxkin, Sabaar e Kilwara se ligam a **tradições vivas**. Recomendo **revisão por especialista ou consulta cultural** antes de qualquer arte final, evitando símbolos sagrados e máscaras rituais.

---

## 7. Linguagem de retratos

**Pictórico histórico + gravura premium + luz cinematográfica suave.**

| Dimensão | Regra |
|---|---|
| Enquadramento | busto em 3/4 ou perfil, ombros cortados, olhar fora da câmera |
| Luz | chave suave a ~45° do alto, quente; contraluz frio fino; sombra ≤ 35 % da área do rosto |
| Técnica | subpintura tonal com velatura; **hachura de gravura** só em sombras e contornos, em baixa opacidade |
| Paleta | a da civilização, dessaturada; fundo = degradê de matiz da civilização com vinheta |
| Figurino e ornamento | **pesquisados e específicos** (não "fantasia genérica") |
| Rosto | individual, digno, sem sorriso exagerado, envelhecimento natural |
| Moldura | **fora** da arte (pertence à carta) |
| **Evitar** | fotografia moderna, poros hiper-realistas, olhos de anime, armadura com brilho de concept art de videogame, caricatura, iconografia de religiões vivas |

Os retratos nos mockups são **silhuetas com luz e hachura**, para provar a linguagem, **não arte final**.

---

## 8. Linguagem de cartas

Linguagem comum para **Líder, Civilização, Obra de Legado e Herança**.

**Hierarquia fixa:** **ARTE → NOME → IDENTIDADE → EFEITO.**

| Zona | Conteúdo |
|---|---|
| Arte | retrato (Líder), cidade na pele da cultura (Civilização), peça da Obra, cidade da Herança |
| Nome | serifa de exibição + título em itálico |
| Identidade | etiquetas de tipo (Histórico/…, afinidade, civilização), linha curta de contexto |
| Efeito | rótulos em caixa-alta pequena (Passiva, Poder, Trait, Limitation, Assinatura, Custo, Requisito) e o texto real da regra |
| Moldura | filete de bronze fino por dentro de uma margem escura; **sem molduras ornamentais**; só uma **faixa de padrão da cultura** de 14 px na base |

---

## 9. Obras de Legado

O sistema atual **permanece** (12 Obras, 3 passos, +4 Prestígio, única no mundo). **Não existe sistema paralelo de Monumentos.**

Cada Obra tem:
- **peça 3D própria** na Mesa, com a silhueta já definida (V2/V2.1: torre escalonada, monólitos, fundição de duas chaminés, terraços…);
- **arte própria na carta**, com **a mesma forma**;
- **o material de quem a constrói** (calcário claro, madeira escura, pedra encaixada…), sem mudar o efeito.

Escalas: **Mesa** = pino alto; **Focar** = a forma começa a aparecer; **Cartão** = ilustração completa e os 3 passos. Os mockups mostram **Monumento das Vozes (Leontia), Fundição Compartilhada (Yuhan) e Reservas dos Terraços (Tawanta)**, com custo, requisito e efeito do catálogo real.

---

## 10. Cultura material: o que muda e o que não muda

| Camada | Pode variar por civilização | **Não** varia |
|---|---|---|
| Material | tom da pedra, madeira, tijolo, adobe, colmo | tamanho mecânico |
| Telhado | plano, baixo de terracota, curvo, colmo | slots, capacidade |
| Ornamento | friso do aro, padrão do estandarte | raio |
| Coração cívico | pórtico, pagode, plataforma escalonada | produção |
| Muralha e torres | cor, tampa da torre | nível de Fortificação |
| Porto | mole, píer, embarcadouro | a regra (cidade → aresta → água) |
| Estandarte | forma (gonfalão, escudo, flâmula…) | posse (cor do jogador) |

**Salvo regra explícita da civilização.** A cultura material é **pele**; não altera nenhuma regra.

**Cor do jogador × civilização.** A cor do jogador é **posse** (aro e estandarte). A identidade da civilização é outra camada. Um jogador azul com Leontia continua com arquitetura helênica; o azul é só acento. O mockup mostra Leontia com quatro cores de jogador.

---

## 11. Exemplos: N3, N5, N7 em três culturas

Mockups (`aoh-material-culture-mockups-v1.html`):

- **A.** mesma cidade N5 em Leontia, Yuhan e Tawanta (Mesa, Focar, close-up);
- **B.** cidade costeira N4 com Porto nas três culturas;
- matriz **N3 / N5 / N7 × 3 culturas** (Focar e Mesa);
- **C.** 3 cartas de Líder; **D.** 3 cartas de Civilização; **E.** 3 Obras (peça + carta); mais uma carta de Herança.

### Leitura honesta
- A **42 px**, o que separa as culturas é a **tonalidade da massa** (pedra clara, madeira escura, pedra cinza), o aro e a cor do telhado cívico. **Telhado curvo, terraço e ornamento só aparecem no Focar.**
- O **Porto** continua sendo a peça mais legível a 42 px, nas três culturas.
- As cartas são **linguagem**, não arte final: retratos e Obras são silhuetas procedurais.

---

## 12. O que **não** foi feito
Trocar IDs; apagar as 18 civilizações atuais; mudar snapshots ou banco; alterar Estradas, `workedHexIds`, raio, produção, `IMPROVE_HEX` ou o motor territorial; gerar assets finais; deploy. Também **não** rodei testes do jogo: só renderizei os mockups no Chromium.

---

## 13. Decisões a aprovar

1. **Escopo:** classes A/B/C; **só o Porto** é candidato a mudança de regra; território, Estradas, raio e melhorias **suspensos**.
2. **Porto:** o cais atravessa a aresta; **interim O3** (desenhar onde `isPort` é verdadeiro e há aresta de água, classe B).
   - **D-P1:** Marítimo inclui o Porto (O1) ou `PORT` é edifício à parte (O2)?
   - **D-P2:** apertar `isPort` para exigir aresta de água (depois de **medir**)?
   - **D-P3:** impor `coastal` no Distrito Marítimo?
3. **Método de civilizações:** chassi preservado, identidade substituída, IDs mantidos.
4. **As 12 civilizações piloto e as 6 de expansão** (nomes de trabalho, matrizes, candidatos a Líder), com a convenção de tipo e a cautela com tradições vivas.
5. **Linguagem de retrato e de cartas** (§7, §8).
6. **Cultura material como pele** (§10), com a regra "cor do jogador ≠ identidade da civilização".
7. Resolver o caso **Qaghar / Elefantes** (§5.3) antes de qualquer arte.

# Terminologia canônica e modelo de domínio de UX — V4 (rascunho)

Escopo: as palavras que o jogador lê. Cada termo tem **uma** definição.

Decisões aprovadas em 2026-10-03 e incorporadas aqui: DEC-001, DEC-002, DEC-004, DEC-005 (com alteração) e DEC-010.

Onde o termo depende de uma decisão pendente, aparece a marca `[DEC-xxx]` (ver `product-owner-decision-register.md`). Nesses casos a definição vale só até a decisão.

Substitui, quando aprovado, `docs/glossary.md`. Aquele glossário é da fatia antiga: descreve 5 fases, "Materiais" e Desenvolvimento I–V como nível da cidade, e diverge do Alpha.

Colunas das tabelas:
- **Definição**: o que o termo é.
- **Não significa**: com o que não confundir.
- **UI hoje**: onde aparece no Alpha atual.
- **Código**: símbolo correspondente, quando ajuda.

## 1. Tempo e turno

| Termo | Definição | Não significa | UI hoje | Código |
|---|---|---|---|---|
| **Partida** | Uma mesa de 2–6 civilizações do lobby ao fim | Sessão do navegador | Lobby, tela final | `AlphaRoom` |
| **Rodada** | Ciclo completo: Pulso → Planejamento → resolução → Conflitos → manutenção → fim | Fase; turno individual (todos jogam juntos) | Barra superior "Rodada N / M" | `core.round`, `roundLimit` |
| **Fase** | Etapa da rodada no motor. São 8; Planejamento e Conflitos são as interativas, as demais resolvem sozinhas e mostram consequências. Uma fase do motor **não** corresponde necessariamente a uma tela ou clique (DEC-004, aprovada) | Era; tela | Barra de fase | `AlphaRoundPhaseSchema` |
| **Planejamento** | Fase secreta e simultânea em que se reservam ações | "Turno do jogador" | Botão "Confirmar planejamento" | `PLANNING` |
| **Resolução** | Execução automática do que foi planejado, por iniciativa | Fase em que o jogador age | Painel "Resolvendo a rodada" | `advanceAfterReady` |
| **Iniciativa** | Ordem em que as decisões da rodada se resolvem; gira a cada rodada | Vantagem de combate | Lista "Ana › Beto" na barra | `initiative` |
| **Era** | Um dos **6 estágios** de progressão civilizacional (DEC-005, aprovada): I Fundação, II Expansão, III Civilização, IV Impérios, V **Potências**, VI **Ascensão** (DEC-023, aprovada). Abre possibilidades; não concede vitória | Duração da partida; fase; **Hegemonia** (não é era) | Aba Eras & Hegemonia, barra superior | `AlphaEraSchema` (hoje `ASCENSION`=V exibido "Ascensão", `HEGEMONY`=VI exibido "Hegemonia": divergência) |

## 2. Mapa

| Termo | Definição | Não significa | UI hoje | Código |
|---|---|---|---|---|
| **Hexágono / hex** | Célula individual do tabuleiro, com terreno, dono e unidades (DEC-010, aprovada) | Região; território | Mapa, "Alvo: 7,6" | `HexTile` |
| **Região** | Agrupamento estrutural de **7 hexágonos** do mapa Alpha; unidade de exploração (DEC-010, aprovada) | Célula (sentido antigo da Bíblia); território; país | "Explorar esta região" | `regions`, `REGION_TEMPLATES` |
| **Território** | Conjunto de hexágonos sob controle/reivindicação de uma civilização ou cidade, conforme as regras (DEC-010, aprovada) | Região; mapa conhecido | Inspetor Território | `HexTile.ownerId`, `controllerCityId` |
| **Desconhecido** | Hex nunca visto ("?") | Hex vazio | Mapa | `frontier` |
| **Conhecido** | Hex já visto, fora da visão atual; mostra terreno, não unidades | Visível | Hoje não tem estilo próprio | `knownHexIds` |
| **Visível** | Hex na visão atual (território próprio e vizinhos de cidades e peças) | Conhecido | Mapa | `visibleHexIds` |
| **Contato** | Ter visto uma cidade ou peça de outra civilização; libera diplomacia | Tratado; amizade | Diplomacia "Sem contato" | `contacts` |
| **Povo independente** | Assentamento neutro (Aldeia, Vila, Cidade-estado) com atitude e influência | Civilização; bando | Ícone de casa no mapa; Inspetor | `independents` |
| **Bando saqueador** | Força neutra hostil que avança e ataca o mais fraco | Povo independente; civilização em guerra | Ícone de lâminas | `raidBands` |

## 3. Cidade e território

| Termo | Definição | Não significa | UI hoje | Código |
|---|---|---|---|---|
| **Cidade** | Assentamento de uma civilização, com população e uma ação por rodada | Território | Conselho, mapa | `CityState` + `AlphaCity` |
| **Capital** | Primeira cidade; status político (★) | Nível de cidade | ★ no mapa | `capitalCityId` |
| **Nível da cidade** | **A única progressão canônica da cidade, 1–7** (DEC-002, aprovada). Composto por população + infraestrutura/requisitos + investimento (fórmula a especificar). No Alpha atual ainda é só um rótulo derivado da população | Era; só população | Painel da cidade | hoje `cityLevelForPopulation` (implementação a migrar) |
| **Desenvolvimento** | **Não é termo canônico** (DEC-002, aprovada). Nome interno do Alpha para a progressão 1–5 cujas funções serão absorvidas pelo Nível. Não deve aparecer na UI V2 | Nível | Hoje: "Desenvolver cidade", "Desenvolvimento N" | `CityState.development` (legado) |
| **Distrito** | Zona especializada da cidade (Agrário, Comercial, Acadêmico, Administrativo, Militar, Industrial, Cultural); ocupa uma vaga | Edifício; especialização | Construir → Distrito | `DistrictTypeSchema` |
| **Edifício** | Estrutura dentro de um distrito (ex.: Celeiro no Agrário) | Distrito; melhoria | Construir → Edifício | `BuildingTypeSchema` |
| **Especialização** | Vocação permanente da cidade; dobra a produção do distrito do mesmo tipo | Distrito | Painel da cidade | `specialization` |
| **Melhoria** | Obra num hex de território (Fazenda, Serraria, Pedreira, Mina, Pesqueiro) | Edifício | Território → Melhorias | `improvementCatalog` |
| **Estrada** | Melhoria de movimento (custo 1 por hex para tropas de terra) | Rota comercial | Território → Construir estrada | `roads` |
| **Fortificação** | Muralha da cidade (Paliçada → Cidadela) com integridade (íntegra, danificada, brecha) | Guarnição | Painel da cidade | `fortification` |
| **Guarnição** | Limite de peças militares numa cidade (6 + distrito Militar + fortificação + doutrina, teto 10) | Força de defesa; Soldado (papel sem efeito hoje) | "Guarnição x/y" | `alpha-stack.ts` |
| **Hex trabalhado** | Hex do território onde um Produtor colhe | Hex reivindicado | "Escolher territórios trabalhados" | `workedHexIds` |
| **Ocupada** | Cidade capturada, ainda não integrada; só faz Ação cívica | Destruída | Painel "Ocupada, integração N%" | `status: OCCUPIED` |
| **Integração** | Progresso (0–100%) de uma cidade ocupada até virar própria | Coesão | Painel da cidade | `integration` |

## 4. População e bem-estar

| Termo | Definição | Não significa | UI hoje | Código |
|---|---|---|---|---|
| **Habitante** | Unidade de população; come Alimento e tem um papel | Peça (os habitantes nunca andam no mapa) | Painel da cidade | `population` |
| **Papel** | Produtor, Artesão, Mercador, Estudioso, Soldado, Livre | Classe social | Habitantes e trabalho | `workers` |
| **Crescimento** | Medidor que enche com o Alimento que sobra da Produção; ao completar, +1 habitante | Produção de Alimento | "Crescimento x / y" | `growthProgress` |
| **Ânimo** | Humor da cidade (7 estados); altera a produção e a estabilidade [DEC-022] | Estabilidade | "Ânimo Serenidade (…)" | `AlphaCity.mood` |
| **Estabilidade** | Ordem institucional da cidade (0–100); altera a produção por faixa | Ânimo; Coesão | Medidor do painel | `CityState.stability` |
| **Coesão local** | Hoje é um número sem efeito em regra [DEC-016/022] | Estabilidade | Painel cultural (dono) | `localCohesion` |

## 5. Economia e Estado

| Termo | Definição | Não significa | UI hoje | Código |
|---|---|---|---|---|
| **Recursos** | Alimento, Madeira, Pedra, Metal, Riqueza (armazenáveis) + Conhecimento, Influência (sem teto) | "Materiais" (termo legado = Madeira+Pedra+Metal; não deve aparecer na UI) | Barra superior | `ALPHA_RESOURCE_KEYS` |
| **Armazém** | Teto de cada recurso armazenável; o excedente é descartado [DEC-008] | Edifício Armazém | Medidor sob cada recurso | `alphaStorageCapacity` |
| **Produção** | O que uma cidade gera ao escolher **Produzir** | Renda automática (não existe) | Ação "Produzir" | `productionOutput` |
| **Administração** | Carga do Estado / capacidade; acima da capacidade = Sobre-extensão | Ações | "Administração x / y" | `deriveAdministration` |
| **Sobre-extensão** | Carga > capacidade: −10% de produção não-alimentar, −3 estabilidade/rodada | Falência | Alerta na barra | `OVEREXTENDED` |
| **Ação principal** | Unidade do orçamento da rodada (5–10, padrão 7) para planejar | Ação da cidade; "ponto de comando" (legado) | "Ações principais x / y" | `actionsPerRound`, `ACTION_CLASS` |
| **Ação livre** | Decisão que não gasta orçamento (responder proposta, postura, confirmar…) | Ação grátis de recurso | — | `ACTION_CLASS FREE` |
| **Ação da cidade** | A única ação de cada cidade na rodada (Produzir, Construir, Recrutar, Pesquisar, Investimento público, Sustentar comércio, Ação cívica); também gasta 1 ação principal | Ação principal | Painel "Ação da cidade" | `URBAN_ACTION`, `cityActions` |
| **Comando** | Termo legado de bônus de ações; hoje sem efeito [DEC-018] | Ação principal | Cartas e líderes "+1 ponto de comando" | `COMMAND` |

## 6. Conhecimento e progresso

| Termo | Definição | Não significa | UI hoje | Código |
|---|---|---|---|---|
| **Conhecimento** | Recurso gasto para pesquisar | Teia; Prestígio | Barra superior | `knowledge` |
| **Teia Civilizacional** | Grafo de avanços com pré-requisitos [DEC-012] | Árvore linear; era | Aba Teia | `ADVANCEMENTS` |
| **Avanço** | Nó da Teia pesquisado por uma ação da cidade | Era | Cartões da Teia | `research` |
| **Convergência** | Avanço que exige dois domínios | — | Rótulo "Convergência" | — |
| **Marco de era** | Critério contado para avançar de era | Marco de Prestígio | Eras & Hegemonia | `ALPHA_ERA_MILESTONES` |

## 7. Poder, cultura e vitória

| Termo | Definição | Não significa | UI hoje | Código |
|---|---|---|---|---|
| **Prestígio** | Placar da partida; decide a vitória no limite de rodadas | Influência; Legado | Barra superior, tela final | `prestige` |
| **Influência** | Recurso político (reivindicar, integrar, povos, cultura) | Cultura; Prestígio | Barra superior | `influence` |
| **Cultura** | Domínio conceitual (distritos Culturais, presença, Hegemonia Cultural); não é recurso | Influência | Aba/domínio | — |
| **Presença cultural** | Posição de uma civilização numa cidade estrangeira (Contato → Enraizada → Predominante; até 3 por cidade) | Influência; território | Inspetor Território (cidade) | `foreignPresence` |
| **Disputa cultural** | Duelo de dados entre duas presenças estrangeiras numa cidade | Guerra | "Disputar · 1 ação" | `CONTEST_PRESENCE` |
| **Âncora cultural** | Presença que chegou a Predominante; dá bônus de disputa | Capital | Painel cultural | `culturalAnchor` |
| **Legado** | Trilha cultural permanente da Bíblia; **não existe no Alpha** [DEC-016] | Prestígio | — | — |
| **Hegemonia** | **Condição/estado de vitória** (DEC-005, aprovada): declarar um caminho e manter os requisitos por 2 rodadas completas. Declarável **só na Era VI — Ascensão** (DEC-006, aprovada); requisitos contam a partida toda | **Era** (não é era); Prestígio | Eras & Hegemonia | `hegemony` |
| **Caminho de Hegemonia** | Militar, Econômica, Científica, Cultural, Política, Territorial | Estratégia livre | Cartões de caminho | `HegemonyPathSchema` |
| **Ambição** | Objetivo secreto que dá Prestígio uma vez | Caminho de Hegemonia | Cartas & Projetos | `AMBITION` |

## 8. Diplomacia e comércio

| Termo | Definição | Não significa | UI hoje | Código |
|---|---|---|---|---|
| **Tratado** | Acordo formal entre duas civilizações por 3 rodadas (Acordo comercial, Pacto de não agressão, Fronteiras abertas, Pacto defensivo, Aliança, Embargo) | Oferta comercial | Diplomacia | `treaties` |
| **Acordo comercial** | Tratado que permite rotas internacionais (e abre o território do parceiro à rota) | Rota comercial; Oferta comercial | Tipo de tratado | `TRADE_AGREEMENT` |
| **Rota comercial** | Ligação entre duas cidades por caminho conhecido; rende só com Sustentar comércio [DEC-019] | Acordo comercial; estrada | Rotas comerciais | `routes` |
| **Oferta comercial** | Troca imediata, presente, promessa futura ou empréstimo de recursos entre duas civilizações | Tratado | "Troca de recursos" | `tradeOffers` |
| **Calote** | Promessa ou empréstimo não pago no prazo (−2 Prestígio) | Quebra de tratado | Diplomacia | `DEFAULTED` |
| **Guerra** | Estado entre duas civilizações que permite ataques | Ataque | "Em guerra" | `wars` |

## 9. Militar

| Termo | Definição | Não significa | UI hoje | Código |
|---|---|---|---|---|
| **Peça** | Unidade no mapa (militar ou civil) | Habitante | Conselho "Peças" | `units` |
| **Peça civil** | Explorador, Pioneiro, Emissário; não luta | Habitante | "Civis" | strength 0 |
| **Pilha** | Peças de uma civilização num hex; limites Exército 6, Civis 2, Frota 4 | Exército inteiro | "Exército 5/6" | `alpha-stack.ts` |
| **Força** | Soma de força das peças + modificadores | Prestígio | Prévia de ataque | `strength` |
| **Postura** | Assalto, Defesa (Manter), Manobra; ciclo de vantagem | Formação | Seletor | `BattlePostureSchema` |
| **Dado tático** | Um d6 por peça; faces Vazio, Impacto ×2, Guarda, Manobra, Comando | Dado de cultura | Relatório de batalha | `TacticalFaceSchema` |
| **Suprimento** | Peça dentro do alcance de uma cidade própria ou ligada por território/estrada; sem ele, −2 [DEC-009] | Comida | "abastecido / sem suprimento" | `unitSupply` |
| **Reação** | Carta jogada na fase Conflitos por atacante/defensor | Contra-ataque | Chamada de Conflitos | `REACTION` |

## 10. Cartas, eventos e obras

| Termo | Definição | Não significa | UI hoje | Código |
|---|---|---|---|---|
| **Pulso do mundo** | Efeito automático de cada rodada para todos (±recurso) [DEC-017] | Evento mundial | Resultados da rodada | `WORLD_PULSE_CARDS` |
| **Evento mundial** | Carta trocada a cada 2 rodadas; cada civilização escolhe recurso ou +1 Prestígio [DEC-017] | Pulso | Cartas & Projetos | `WORLD_EVENT` |
| **Carta de estratégia** | Carta da mão jogada no Planejamento (ou Reação) | Ambição | Mão | `STRATEGY` |
| **Conselheiro** | Carta permanente contratada (até 2) | Líder | Cartas & Projetos | `ADVISOR` |
| **Grande Projeto** | Obra única no mundo (12), feita numa cidade com distrito e era; dá Prestígio. A Bíblia chama de "Obra de Legado" | Edifício | Cartas & Projetos | `GREAT_PROJECTS` |
| **Líder** | Personagem da civilização: passiva + habilidade 1×/era (não existe na Bíblia) [DEC-011] | Conselheiro | Eras & Hegemonia | `LEADERS` |

## 11. Conflitos de terminologia encontrados (a resolver na UI V2)

1. **"Nível" e "Desenvolvimento"** aparecem os dois na mesma cidade. **Resolvido (DEC-002):** só Nível; o Alpha ainda exibe ambos.
2. **"Hegemonia"** é nome de era, de vitória e de aba. **Resolvido (DEC-005):** só vitória. O Alpha ainda chama a Era VI de Hegemonia e a V de Ascensão; nomes canônicos em DEC-023 (aprovada): V Potências, VI Ascensão.
3. **"Região"** muda de sentido entre a Bíblia (célula) e o Alpha (bloco de 7). **Resolvido (DEC-010):** região = 7 hexágonos.
4. **"Ações principais" (Alpha) × "Comandos" (Canvas) × "pontos de comando"** (cartas e líderes legados) [DEC-018].
5. **"Materiais"** ainda aparece em ofertas de tratado, ênfases de civilização e Crônicas, mas não existe como recurso.
6. **"Guarnição"** tem três sentidos no código: limite de pilha, força de defesa (`garrisonCapacity`) e papel Soldado (sem efeito).
7. **"Estudioso"** (Alpha) × **"Erudito"** (Bíblia).
8. **"Grande Projeto"** (Alpha) × **"Obra de Legado"** (Bíblia).
9. **"Evento mundial" × "Pulso do mundo"**: dois sistemas com nomes próximos [DEC-017].
10. **"Defesa"** é ao mesmo tempo postura (Manter Posição) e fortificação/guarnição.
11. **`docs/glossary.md`, `docs/rules-reference.md`, `docs/player-guide.md`** descrevem a fatia antiga (5 fases, 5 recursos) e contradizem o Alpha.

## 12. Modelo de domínio de UX (objetos que a interface manipula)

- **Civilização**
  - recursos e tetos;
  - Administração;
  - ações;
  - Prestígio;
  - era;
  - governo;
  - líder;
  - mão de cartas;
  - relações.
- **Cidade**
  - Nível 1–7;
  - população e papéis;
  - crescimento;
  - ânimo, estabilidade, integração;
  - distritos e edifícios;
  - fortificação;
  - ação da rodada;
  - presença cultural estrangeira.
- **Hex**
  - terreno;
  - estado de conhecimento;
  - dono;
  - melhoria;
  - estrada;
  - ocupantes (peças, povo, bando);
  - opções (mover, explorar, reivindicar, atacar).
- **Pilha/peça**
  - composição;
  - suprimento;
  - ordem da rodada;
  - destinos e alvos possíveis.
- **Relação** (par de civilizações)
  - contato;
  - paz ou guerra;
  - tratados;
  - propostas;
  - ofertas;
  - rotas.
- **Povo independente**
  - tipo;
  - atitude;
  - influência por civilização;
  - protetor;
  - ações possíveis.
- **Rodada**
  - fase;
  - iniciativa;
  - prontos;
  - resultado (eventos visíveis a quem viu).
- **Conhecimento**
  - Teia;
  - eras e marcos;
  - caminhos de Hegemonia;
  - cartas;
  - projetos;
  - crônicas.

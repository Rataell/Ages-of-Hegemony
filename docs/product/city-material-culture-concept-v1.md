# CITY & MATERIAL CULTURE CONCEPT V1

Status: **proposta de conceito**. Nada aqui altera código, regras, banco ou conteúdo. Mockups visuais: `docs/product/city-material-culture-mockups.html` (também publicado como Artifact).
Base de auditoria: `packages/game-domain` (`territory.ts`, `alpha-city-ladder.ts`, `alpha-legacy-works.ts`, `alpha-civilization-kits.ts`), `packages/game-engine` (`territory-commands.ts`, `alpha-unit-options.ts`, `alpha-naval.ts`), `apps/web` (`table-art.ts`, `hex-map.tsx`).

---

## 0. O que a auditoria encontrou (fatos)

| Fato | Onde | Consequência |
|---|---|---|
| **Melhoria de hex só checa dono e terreno.** `IMPROVE_HEX` exige `tile.ownerId === jogador` e terreno compatível; não recebe cidade, não mede distância, não exige conexão. | `territory-commands.ts` | É a origem do caso "Porto/Fazenda longe da cidade": qualquer hex do território serve. **GAP-1** |
| **A "área funcional" já existe nos dados**: cada hex reivindicado guarda `controllerCityId`, e os hexes trabalhados (`workedHexIds`) só podem ser desses. | `core.ts` (HexTile), `CLAIM_HEX` | O modelo proposto não cria dado novo: faz a melhoria obedecer o que o hex já diz. |
| **Raio de reivindicação** vem de `cityRadii` = `[1,1,2,2,3]`, indexado por *desenvolvimento* (5 passos), enquanto a escada de cidade tem **7 níveis** (N1–N7). | `territory.ts`, `alpha-unit-options.ts` | Duas escalas para "tamanho da cidade". **GAP-2** |
| **Porto não é componente.** Uma cidade "é porto" quando está em Costa ou ao lado de Costa/Mar; frotas lançam em hex de água adjacente. Não há construção, slot, carta nem representação. | `alpha-naval.ts` | O texto diz "ao lado de Costa/Mar" mas o lançamento exige água adjacente: se só há `COAST` (terra costeira) vizinho, a regra se contradiz. **GAP-3** |
| **Distritos (7) e Edifícios (7)** ocupam *vagas* da cidade (`slots` por nível: 1,1,2,3,4,5,6), mas **não têm representação na Mesa**: a cidade é só uma arte procedural por nível + selo `N·Cap` + anel de fortificação. | `alpha-city-ladder.ts`, `table-art.ts` | A cidade "acumula números" em vez de crescer. **GAP-4** |
| **Fortificação**: 5 níveis (Paliçada → Cidadela) + estado Intacta/Danificada/Rompida; é da cidade, já desenhada como anel. | `alpha-concept.ts`, `fortificationArt` | Já é "corpo da cidade". Falta ligar nível ↔ forma. |
| **Obras de Legado**: 12 linhas (6 canon + 6 convertidas), 3 passos, +4 Prestígio, pré-requisito = distrito (e Fortaleza / 3 cidades conectadas em duas). Única no mundo. Só existem como **carta/lista** em Cartas & Projetos. | `alpha-legacy-works.ts` | Já é o único sistema de monumentos (não criar um segundo). Falta presença física. **GAP-5** |
| O catálogo de **29 edifícios** do canon (GR-23) **não está no motor**: hoje são 7 distritos + 7 edifícios; Obras usam o distrito como pré-requisito "provisório". | comentário em `alpha-legacy-works.ts` | A taxonomia precisa caber nos 7+7 de hoje e crescer para 29. **GAP-6** |
| **Estruturas de civilização**: 4 jogáveis (Celeiro Comum, Caravana, Santuário Solar, Aqueduto) + 2 em autoria (Casa de Câmbio, Laboratório Real). Não dizem em que vaga entram. | `alpha-civilization-kits.ts` | **GAP-7** |
| Melhorias: `FARM`, `LUMBER_CAMP`, `QUARRY`, `MINE`, `FISHERY` (esta exige Costa + feature Peixe). **Não há "Serraria" nem "Porto" no conteúdo.** | `territory.ts` | Só se modela o que existe. |
| Estrada: `BUILD_ROAD` por hex (rede, não de uma cidade). Regras de ligação não auditadas aqui. | `alpha-actions.ts` | **GAP-8** |
| 12 civilizações jogáveis + 6 em autoria; 12 Líderes (só as jogáveis). | kits | Base para cartas/identidade. |

---

## 1. Princípio

> **Tudo tem LUGAR, CONEXÃO e FUNÇÃO.**
> - **Lugar**: existe num ponto físico da Mesa (um hex, uma aresta, um vértice, uma vaga).
> - **Conexão**: consegue traçar uma cadeia válida até a cidade que a possui.
> - **Função**: o que ela produz/protege/permite é legível pela forma.

Pergunta de projeto: "**onde esta construção fisicamente existe?**", não "qual cidade pagou".

## 2. Modelo espacial: o CORPO DA CIDADE (três anéis)

A taxonomia do AoH não pede três nomes genéricos; pede **a geometria do hex**. Um hex tem **1 centro, 6 arestas, 6 vértices**. Isso casa com o conteúdo real: a escada tem **no máximo 6 vagas** (N7 = 6), a fortificação é um **cinturão**, e Obras são **marcos**.

| Anel | Onde | O que mora ali | Regra de pertencimento |
|---|---|---|---|
| **1. Núcleo** (o hex da cidade) | Centro + 6 **Lotes** (cunhas voltadas às 6 arestas) | **Coração** (identidade, nível, capital), **Distritos** (1 por Lote, até `slots` do nível) e seus **Edifícios** (a "cobertura" do Lote), **Estrutura de civilização** (variante visual de um Edifício) | Existe **dentro** do hex da cidade. Não precisa de conexão: *é* a cidade. |
| **2. Cinturão e Face** (borda do núcleo) | 6 arestas e 6 vértices | **Fortificação** (anel nas arestas; torres nos vértices a partir de Fortaleza), **Porto** (cais numa aresta que **toca água navegável**), **Marcos** (Obras de Legado) em vértices de fundo | Existe **na borda** do hex da cidade. Porto só pode estar numa aresta que realmente encosta em água. |
| **3. Área funcional (AF)** | Hexes com `controllerCityId = esta cidade`, contíguos ao núcleo, dentro do raio | **Melhorias territoriais**: Fazenda, Madeireira (LUMBER_CAMP), Pedreira, Mina, Pesqueiro | Existe **num hex da AF**, com terreno adequado, ligado por cadeia contígua ao núcleo. |

Fora dos anéis: **Território do jogador** (hexes com `ownerId`), **Estradas** (rede) e **Acampamentos/Ameaças** (sistema autônomo).

### Separar TERRITÓRIO de ÁREA FUNCIONAL

- **Território do jogador** = "isto é meu" (`ownerId`). Serve a fronteira, suprimento, tratados.
- **Área funcional da cidade** = "isto é *desta cidade*" (`controllerCityId`). Serve produção, melhoria, trabalho.
- Controlar um hex **não** autoriza qualquer cidade a construir nele. Só a cidade que o controla funcionalmente.

## 3. Regra conceitual de CONECTIVIDADE (uma só, sistêmica)

> **Corpo conectado.** Uma construção vinculada à cidade só existe num hex da **área funcional** dessa cidade, e essa área é **contígua** ao núcleo: da construção ao núcleo há uma cadeia de hexes adjacentes, todos da mesma AF, dentro do raio de reivindicação.

Por quê esta e não as alternativas:

| Opção | Veredito |
|---|---|
| Só adjacência ao núcleo | Rígida demais (Fazendas ficariam no anel 1; N1–N2 teriam 6 vagas de terreno) |
| Raio puro (distância ≤ R) | Barato, mas permite "ilhas" e hex do outro lado de um rival ou do mar |
| Rede de estradas | Bom no futuro, pesado agora (exige o sistema de estrada) |
| **AF contígua + raio** | **Reaproveita o que existe** (`controllerCityId`, `cityRadii`, `workedHexIds`); a conectividade é garantida **uma vez, na reivindicação** (a AF só cresce por hex adjacente à própria AF/núcleo) e **herdada por tudo**: Fazenda, Mina, Pesqueiro, futuras melhorias. Zero regra especial por construção. |

Corolários:
1. `IMPROVE_HEX` deixa de ser "hex do jogador" e passa a ser "hex da AF desta cidade" (a cidade é derivada de `controllerCityId`; não precisa de parâmetro novo).
2. Produção só conta em hex **trabalhado** (já é assim). Uma melhoria fora da zona trabalhada existe, mas rende zero: o jogador vê *porquê*.
3. Estradas, no futuro, **estendem o raio** (um hex ligado por estrada ao núcleo conta como adjacente) sem mudar a regra.
4. Contiguidade vale também na captura: se a cidade cai, a AF inteira passa com ela; fragmentos desconectados viram território solto (sem dono funcional) até serem reivindicados.

## 4. Edifício urbano × melhoria territorial

| | **Urbano (Núcleo / Cinturão / Marco)** | **Territorial (AF)** |
|---|---|---|
| Existe em | Lote, aresta ou vértice do **hex da cidade** | **Hex** da área funcional |
| Ocupa | Vaga da cidade (Lote) ou borda | O hex inteiro (um por hex) |
| Terreno | Nenhum (o hex da cidade já foi validado na fundação) | Exigido (catálogo atual) |
| Conexão | Implícita | Cadeia contígua da AF |
| Paga/pertence | A cidade | A cidade que controla o hex |
| Pode ser remoto? | **Nunca** | **Nunca fora da AF**; remoto *dentro* do raio, sim |
| Exemplos reais | Distritos, Edifícios, Fortificação, Porto, Obras | Fazenda, Madeireira, Pedreira, Mina, Pesqueiro |

## 5. PORTO (caso fundamental)

**Proposta recomendada (elegante): o Porto é uma _face_ do núcleo, não uma construção remota.**

- Uma aresta do hex da cidade **toca água navegável** ⇒ essa aresta pode abrigar o **cais**. Só existe onde existe água encostada: **é fisicamente impossível** pô-lo em outra costa do território.
- **Pertence a uma cidade** (a do núcleo). A **orientação visual aponta para a água** (o cais é desenhado na própria aresta).
- **Cidade interior não tem Porto.** Para ter um: (a) fundar/capturar uma cidade costeira, ou (b) ganhar acesso por **AF até a costa** *apenas* como **Pesqueiro** (comida e Riqueza), nunca como base naval.
- Definição única de "navegável": hex `SEA` (ou rio largo no futuro). Resolve o **GAP-3** (hoje `COAST` terra costeira conta como "perto").

Duas formas de dar *função* ao cais (a decidir, nenhuma muda a regra espacial):
- **P-A (recomendada para V1):** o Porto é **derivado** (como hoje): tem-se cais **automaticamente** quando há aresta de água. A carta/peça só **mostra** o que já vale (lançar frota, rota marítima, bloqueio). Zero conteúdo novo.
- **P-B (V2, se o jogo pedir):** "Porto" vira **Edifício do Distrito Comercial** com requisito `aresta-de-água`; sobe de Cais → Porto → Arsenal. Continua preso à aresta.

Rejeitado: "Atracadouro remoto" (hex costeiro da AF servindo de base). Reabre o problema que queremos fechar.

## 6. FAZENDA

- **Territorial.** Hex da AF, terreno Planície (ou feature Fértil), como hoje.
- Pertence à cidade que **controla** o hex; mostra um **fio de cor** da cidade na borda do hex (responde "esta Fazenda é de quem?").
- Rende se o hex for **trabalhado**. Anexo urbano relacionado (**Celeiro**, Distrito Agrário) fica **no Lote**, nunca no campo.
- Forma: **mosaico de talhões** (campos em faixas) na escala do hex.

## 7. MINA (e Pedreira)

- **Territorial.** Hex da AF em Colinas/Montanhas (Mina também exige o feature de metal quando o conteúdo marcar), como hoje.
- "**Esta Mina abastece qual cidade?**" = a cidade da AF. Mostrada por: contorno da AF da cidade selecionada + fio de cor.
- A Mina é **tão distante quanto o raio da AF permitir** *e* conectada pela cadeia. Se a cadeia se rompe (hex perdido para um rival), a Mina fica **desconectada**: continua no mapa, **rende 0** e é marcada ⛓︎ (estado legível).
- Forma: **boca de poço + carrinho + escória**, em tom de pedra/metal.

## 8. FORTIFICAÇÃO

- **Urbana, borda do núcleo.** Não ocupa Lote.
- Forma por nível (a mesma gramática, mais segmentos): Paliçada = estacas pontilhadas nas arestas; Muralha de Pedra = linha contínua; Fortaleza = + **torres nos 6 vértices**; Bastião = torres em **cunha**; Cidadela = **cidadela interior** no Coração.
- Estado visível: Danificada = **1 segmento quebrado**; Rompida = **brecha aberta** na aresta atacada (o lado do cerco).
- Informação mínima: nível por forma (sem número); estado por brecha.

## 9. MONUMENTO / OBRA DE LEGADO

- **Não criar sistema paralelo.** O monumento *é* a Obra de Legado já existente (12 linhas). A carta de Obra e a peça na Mesa são **a mesma coisa em duas escalas**.
- **Marco** num dos **vértices de fundo** do hex da cidade (os dois mais altos na tela). Cada Obra tem **silhueta própria** (torre-arquivo, obelisco-vozes, cidadela-vigília…), sempre **mais alta que qualquer Lote**, e é a **única** peça que ultrapassa o contorno do hex.
- Progresso: **3 passos** = **andaime → estrutura → coroamento** (o mesmo "3 de 3" da carta). Obra concluída ganha a cor da civilização no topo.
- Regra de leitura: até **2 Marcos** desenhados por cidade; o excedente vira contador `+1` (preservando legibilidade; **GAP-5**: confirmar se uma cidade pode abrigar mais de uma Obra).
- Pré-requisito continua sendo o Distrito (e Fortaleza / 3 cidades conectadas): a Obra **nasce sobre o Lote do distrito exigido** (ex.: Arquivo dos Horizontes sobre o Lote Acadêmico). Isso dá "lugar" ao pré-requisito.

## 10. VÁRIAS CIDADES (sobreposição)

Regra legível para tabuleiro: **um hex, uma cidade funcional.**
- Quando dois alcances (de duas cidades **do mesmo jogador**) cobrem o mesmo hex, quem **reivindica primeiro** o controla (`controllerCityId`). Sem disputa interna.
- Melhoria **pertence à cidade do hex** no momento da obra.
- **Realocar** (opcional, fora do V1): ação de Governar paga em Influência, move **um hex** de uma AF para outra **só se ficar contíguo** à nova cidade; a melhoria vai junto. Sem isso, nada muda depois.
- Disputa **entre jogadores** já é resolvida por `ownerId` (hex tem 1 dono). Não há "área funcional disputada".
- Para o jogador ver: ao selecionar uma cidade, **sua AF acende** (contorno na cor da cidade, hexes de outras cidades do jogador esmaecidos).

## 11. EVOLUÇÃO VISUAL N1 → N7 (linguagem modular)

Uma **regra de crescimento** única, em 4 eixos; cada nível acende o que o motor já dá:

| Nível | Lotes (vagas) | Altura (skyline) | Cinturão | Coração |
|---|---|---|---|---|
| N1 Posto | 1 (aberto) | cabana + paliçada opcional | — | fogueira/estandarte |
| N2 Aldeia | 1 | casas baixas | paliçada possível | praça de terra |
| N3 Vila | 2 | telhados | muralha possível | poço/praça |
| N4 Cidade | 3 | torres baixas | muralha | praça calçada |
| N5 Grande Cidade | 4 | 2 níveis de altura | fortaleza | monumento cívico |
| N6 Metrópole | 5 | avenidas, cúpulas | bastião | fórum |
| N7 Metrópole Imperial | 6 (anel completo) | skyline contínua | cidadela | palácio |

Anti-ruído: **máx. 9 elementos legíveis no núcleo** (Coração + 6 Lotes + cinturão + Marco). Ícones só em zoom próximo; em zoom aberto = **silhueta + selo**. Cor e **altura** carregam significado; símbolos não.

## 12. Referência de sensação (cláusula limpa)

O único princípio emprestado é **abstrato**: "a cidade cresce fisicamente e suas melhorias parecem parte dela". Não usar peças, formas, iconografia, layouts, regras nem nomes de nenhum jogo existente. A solução acima (hex-corpo com Lotes, cinturão, marcos de vértice, AF contígua) é própria do AoH e deriva da geometria do hex e do catálogo do jogo.

## 13. PEÇAS (digitais)

Unidade: **apótema do hex = 1 u** (hex de lado ≈ 1,15 u).

| Peça | Forma | Escala | Orientação | Liga ao hex | Prioridade visual | Informação que mostra |
|---|---|---|---|---|---|---|
| Núcleo / Coração | Praça + cor da civilização, nível pelo "skyline" | 0,78 u de raio | fixa | centro | 3 | nível (forma), capital (estandarte), Ânimo baixo (fumaça/cinza) |
| Lote + Distrito | Cunha com bloco construído; cor do distrito | 0,45 u | voltado à aresta | cunha da aresta *i* | 4 | tipo do distrito (cor+silhueta) |
| Edifício (cobertura) | Elemento alto sobre o Lote | 0,25 u | segue o Lote | sobre o Lote | 4 | qual edifício (silhueta) ; skin da civilização |
| Estrutura de civilização | Variante do edifício, ornamento próprio | = edifício | segue o Lote | idem | 3 | identidade da civilização |
| Fortificação | Anel nas arestas + torres nos vértices | contorno do hex | fixa | 6 arestas/vértices | 2 | nível (forma), estado (brecha) |
| Porto | Cais + barco | 0,5 u para fora da aresta | **aponta à água** | aresta de água | 2 | existe/lança frota; bloqueado (corrente) |
| Marco (Obra) | Silhueta alta única | 1,2–1,6 u de altura | vértice de fundo | vértice | **1** | qual Obra; passo 1–3; concluída |
| Fazenda | Talhões | hex inteiro (≈ 0,85 u) | alinhada à grade | hex da AF | 5 | de quem (fio de cor), rendendo ou não |
| Madeireira | Clareira + pilha de toras | hex | — | hex | 5 | idem |
| Pedreira / Mina | Corte / boca de poço | hex | — | hex | 5 | idem + ⛓︎ se desconectada |
| Pesqueiro | Rede/estacas na costa | hex costeiro | para a água | hex | 5 | idem |
| Fio de cidade | Linha fina na cor da cidade | 1 px | — | borda do hex | 6 | pertencimento (*qual cidade*) |

Prioridade de leitura: **Marco > Cinturão/Porto > Núcleo > Distritos > Melhorias > fio**.

## 14. CARTAS E ILUSTRAÇÕES (linguagem, sem arte final)

Direção geral: **gravura tingida** (ink + lavis chapado) em fundo de pergaminho escuro, coerente com o vidro escuro da Mesa; paleta por Era; mesma moldura-base para as três famílias, cabeçalho de cor por categoria. A **silhueta** é o elo carta ↔ peça (a mesma forma aparece pequena na Mesa e grande na carta).

### Líder
- **Retrato/figura** em arco superior (busto, 3/4), emoldurado pelo **emblema da civilização** (espiga, farol, passo…) como "vitral" atrás.
- Moldura: filete na cor da civilização; canto com o **selo** (já existe `sealArt`).
- Hierarquia: **Nome** (display, maior) → título → **Passiva** (bloco curto) → **Poder da Era** (bloco destacado, 1× por Era) → rodapé: civilização e afinidade.
- Identidade: roupas/objetos remetem à afinidade (agrária, marítima, científica…) sem ancorar em cultura real específica *até* a decisão da §16.

### Monumento / Obra
- **Ilustração principal** = a silhueta do Marco em cenário (Lote de origem ao fundo).
- À esquerda uma **faixa vertical de 3 passos** (andaime → estrutura → coroamento) e o **custo por passo** (2/2/2 etc.).
- Efeito permanente (ícone de recurso + texto curto) e **+4 Prestígio**.
- Cabeçalho na cor do **caminho** (Científico, Político, Econômico, Cultural, Militar, Territorial). Cada Obra tem **ilustração e silhueta únicas**.

### Civilização
- Carta-bandeira: **emblema** (já existe), paleta (2 cores + 1 acento), **padrão** (textura do estandarte), **Líder** ao lado, **Estrutura de civilização** como ornamento e a **Herança**.

## 15. Civilizações: três direções (proposta separada, **sem substituir nada**)

| | **A. Histórico real** | **B. Mitológico** | **C. Híbrido histórico-mitológico** |
|---|---|---|---|
| Ideia | Povos/culturas reais por Era | Panteões e lendas | **Âncora geográfico-cultural real + epítetos/lideranças lendárias** |
| Líderes | Pessoas reais (sensibilidade, precisão, "quem pode ser vilão?") | Deuses/heróis (não são pessoas) | Figuras arquetípicas ("a Rainha do Delta", "o Guardião do Passo") ancoradas a uma região |
| Bandeiras/emblemas | Heráldica real (atenção a direitos e símbolos sensíveis) | Símbolos sagrados (risco de apropriação) | Emblemas **derivados** (como os atuais), inspirados e nunca copiados |
| Monumentos | Obras reais (Pirâmide, Coliseu…): reconhecíveis, mas travam a Era | Templos lendários | Obras **arquetípicas** com silhueta própria que *evocam* sem reproduzir |
| Cartas/Teia/Heranças | A Teia é universal e atemporal: choca com "cada povo em sua época" | Ok, mas fantasioso demais para um jogo de eras | A Teia continua universal; a identidade vive em Líder, Herança e Estrutura |
| Originalidade | Baixa (muitos jogos de civilização histórica) | Média (crowded) | **Alta** |
| Risco | Estereótipo, anacronismo, direitos, escolha de quem entra | Religiosidade viva, apropriação | Precisa de curadoria para ficar coerente |
| Impacto no que já existe | Reescreve kits, Heranças e líderes; conflita com afinidade-como-regra | Reescreve nomes; mantém regras | **Mantém afinidades e regras**; troca nomes/arte por camadas |

**Recomendação: C (híbrido).** O AoH já nasceu de **arquétipos de afinidade** (Agrária, Marítima, Científica…); C preserva esse design, ganha originalidade, evita reproduzir pessoas e religiões vivas e permite **crescer** (6 civilizações em autoria) sem ancorar cada Era numa cronologia que a Teia não tem. Etapas sugeridas: (1) escolher 3 civilizações-piloto; (2) definir região-âncora, paleta, emblema e Líder lendário de cada uma; (3) aplicar aos cards; (4) só depois renomear o restante. Nada disso começa antes da aprovação.

## 16. MATRIZ OBRIGATÓRIA (componentes que existem hoje)

Legenda: **PERT** = pertence à cidade; **HEX** = ocupa hex; **CONEX** = precisa de conexão; **REMOTO** = pode ser remoto hoje; **GAP** = sem regra/representação.

| COMPONENTE | TIPO | PERT. | OCUPA HEX? | CONEXÃO? | TERRENO | ADJACÊNCIA | REMOTO? | MESA hoje → proposta | CARTA hoje → proposta | OBS |
|---|---|---|---|---|---|---|---|---|---|---|
| Cidade (Posto→Império, N1–N7) | Núcleo | — (é a cidade) | Sim, 1 hex | — | Planície/Floresta/Colinas/Costa | Distância mínima entre cidades 2 | — | Arte procedural + selo `N·Cap` → **Coração + Lotes** | Detalhes (texto) → carta de civilização | GAP-2 (raio por 5 passos × 7 níveis) |
| Distrito Agrário | Urbano | Sim | Não (Lote) | Implícita | Nenhum | — | Não | **Nada** → Lote verde | Lista em Detalhes → carta de distrito | GAP-4 |
| Distrito Comercial | Urbano | Sim | Não (Lote) | Implícita | Nenhum | — | Não | Nada → Lote dourado | idem | GAP-4 |
| Distrito Acadêmico | Urbano | Sim | Não (Lote) | Implícita | Nenhum | — | Não | Nada → Lote azul | idem | pré-req. de 3 Obras; GAP-4 |
| Distrito Administrativo | Urbano | Sim | Não (Lote) | Implícita | Nenhum | — | Não | Nada → Lote roxo | idem | pré-req. de 2 Obras; +Capacidade adm.; GAP-4 |
| Distrito Militar | Urbano | Sim | Não (Lote) | Implícita | Nenhum | — | Não | Nada → Lote vermelho | idem | + guarnição; pré-req. Cidadela; GAP-4 |
| Distrito Industrial | Urbano | Sim | Não (Lote) | Implícita | Nenhum | — | Não | Nada → Lote cinza-pedra | idem | pré-req. de 2 Obras; GAP-4 |
| Distrito Cultural | Urbano | Sim | Não (Lote) | Implícita | Nenhum | — | Não | Nada → Lote magenta | idem | pré-req. Monumento das Vozes; GAP-4 |
| Celeiro (GRANARY) | Urbano (Edifício) | Sim | Não | Exige Distrito Agrário | Nenhum | No Lote | Não | Nada → cobertura do Lote | Detalhes → carta | −2 no limiar de crescimento |
| Mercado (MARKET) | Urbano (Edifício) | Sim | Não | Exige Distrito Comercial | Nenhum | No Lote | Não | idem | idem | +Riqueza |
| Biblioteca (LIBRARY) | Urbano (Edifício) | Sim | Não | Exige Distrito Acadêmico | Nenhum | No Lote | Não | idem | idem | +Conhecimento |
| Arquivo (ARCHIVE) | Urbano (Edifício) | Sim | Não | Exige Distrito Administrativo | Nenhum | No Lote | Não | idem | idem | +Capacidade administrativa |
| Quartel (BARRACKS) | Urbano (Edifício) | Sim | Não | Exige Distrito Militar | Nenhum | No Lote | Não | idem | idem | +2 guarnição |
| Oficina (WORKSHOP) | Urbano (Edifício) | Sim | Não | Exige Distrito Industrial | Nenhum | No Lote | Não | idem | idem | +Materiais |
| Centro Cultural (CULTURAL_CENTER) | Urbano (Edifício) | Sim | Não | Exige Distrito Cultural | Nenhum | No Lote | Não | idem | idem | +Influência |
| Catálogo de 29 edifícios do canon | — | — | — | — | — | — | — | — | — | **GAP-6**: não está no motor |
| Estrutura de civilização (Celeiro Comum, Caravana, Santuário Solar, Aqueduto; Casa de Câmbio e Laboratório Real em autoria) | Urbano | Sim | Não | Sem regra de vaga | Nenhum | — | Não | Nada → **skin** de um Edifício | Kit na carta de civilização | **GAP-7**: em que Lote entra? |
| Fortificação (Paliçada, Muralha de Pedra, Fortaleza, Bastião, Cidadela) | Cinturão | Sim | Não (borda) | Implícita | Nenhum | — | Não | **Anel já desenhado** (nível/estado) → formas por nível | Texto → carta | Pré-req. da Cidadela da Vigília |
| Porto | Face do núcleo | Sim (derivado) | Não (aresta) | Aresta toca água | Costa/Mar adjacente | Aresta de água | **Não existe como componente** | **Nada** → cais na aresta | Nada → opcional (P-B) | **GAP-3** (definição de "navegável") |
| Fazenda (FARM) | Territorial | **Hoje só do jogador** | Sim | **Não exigida hoje** | Planície ou feature Fértil | Nenhuma | **Sim, hoje (GAP-1)** | Glifo no hex → talhões + fio | Nada | Regra proposta: AF contígua |
| Madeireira (LUMBER_CAMP) | Territorial | idem | Sim | **Não exigida hoje** | Floresta | Nenhuma | **Sim, hoje** | Glifo → clareira | Nada | A ideia de "serraria" = esta |
| Pedreira (QUARRY) | Territorial | idem | Sim | **Não exigida hoje** | Colinas/Montanhas | Nenhuma | **Sim, hoje** | Glifo → corte | Nada | — |
| Mina (MINE) | Territorial | idem | Sim | **Não exigida hoje** | Colinas/Montanhas | Nenhuma | **Sim, hoje** | Glifo → boca de poço | Nada | — |
| Pesqueiro (FISHERY) | Territorial | idem | Sim | **Não exigida hoje** | Costa **com** feature Peixe | Nenhuma | **Sim, hoje** | Glifo → estacas/rede | Nada | Único "ponto de água" produtivo |
| Estrada (BUILD_ROAD) | Rede | Não (do jogador) | Sim | Não auditado | — | — | — | Linha entre hexes | Nada | **GAP-8** |
| Obras de Legado (12: 6 canon + 6 convertidas) | Marco | Sim (1 cidade) | Não (vértice de fundo) | Distrito/Fortaleza/3 cidades conectadas | Nenhum | No Lote do pré-requisito | Não | **Nada** (só carta) → silhueta própria | **Carta em Cartas & Projetos** → carta ilustrada | GAP-5; único no mundo, 3 passos |

## 17. Mockups A–H

Ver `docs/product/city-material-culture-mockups.html` (publicado também como Artifact). Mostram **a linguagem**, não o acabamento: A) Cidade N1; B) N3 com Fazenda + Celeiro; C) cidade costeira com Porto (e o caso proibido: interior com Porto remoto); D) Mina vinculada por área funcional contígua; E) N5 fortificada; F) cidade com Obra; G) carta de Líder; H) carta de Monumento.

## 18. Critério de sucesso → regra que o garante

| Pergunta visual | Garantia |
|---|---|
| Onde a cidade termina? | O núcleo é o hex; o contorno da AF mostra o resto |
| O que pertence a ela? | Fio de cor + AF acende ao selecionar |
| Quais hexes explora? | Hexes trabalhados com ponto; fora do trabalho rendem 0 e dizem por quê |
| Onde está a Fazenda/Mina? | Hex da AF com a peça própria; cadeia visível |
| Onde está o Porto? | Cais na aresta que toca a água |
| Onde está a Fortificação? | Cinturão nas arestas/vértices |
| Qual Monumento ela possui? | Marco alto, silhueta única |
| **Absurdo evitado** (Porto do outro lado) | Porto = aresta do núcleo; melhoria = hex da AF contígua |

## 19. Recomendação final e decisões a aprovar

1. **Aprovar o modelo de três anéis** (Núcleo/Lotes, Cinturão-Face-Marcos, Área funcional).
2. **Aprovar a regra única "corpo conectado"**: melhoria só em hex da AF da cidade, contígua e dentro do raio; contiguidade garantida na reivindicação.
3. **Aprovar Porto = face do núcleo (P-A)**; P-B só se o jogo pedir mais profundidade naval.
4. **Aprovar Obra = Marco no vértice de fundo, sobre o Lote do pré-requisito**, sem sistema paralelo.
5. **Aprovar "um hex, uma cidade funcional"** (sem realocação no V1).
6. **Resolver os GAPs antes de implementar:** 1, 2 (unificar escala nível/raio), 3 (definição de água navegável), 5 (mais de uma Obra por cidade?), 6/7 (29 edifícios; vaga das estruturas de civilização), 8 (estradas).
7. **Civilizações: direção C**, em etapas e **depois** deste modelo.

Ordem sugerida quando for implementar (cada passo independente, nada agora): (i) validar `IMPROVE_HEX` pela AF e mostrar o fio/AF na Mesa; (ii) Lotes e Marcos na arte do núcleo (sem regra nova); (iii) Porto na aresta; (iv) cartas de Líder e Obra; (v) civilizações-piloto.

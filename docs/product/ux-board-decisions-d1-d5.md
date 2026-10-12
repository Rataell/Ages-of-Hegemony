# Decisões D1–D5 da diretriz de UX de tabuleiro

Branch `ux/board-directive-v1`. Autorizadas pelo dono do produto após a auditoria `ux-board-directive-v1.md`. Conceitos visuais: `ux-board-directive-v2-mesa.html` (Artifact navegável; fontes em `mesa-viva/`). Nada foi publicado, mesclado em `main`, marcado `frozen` ou implantado; a RC5 publicada e os saves existentes não são tocados.

## D1 — Mover: regra nova
Uma mesma Ordem de Mover desloca várias peças para destinos diferentes, como uma ação coordenada.
- Proposta inicial para playtest: até 3 peças por Ordem, juntas ou separadas.
- Cada peça tem origem, caminho e destino próprios; custo de terreno, alcance, bônus e restrições aplicam-se por peça.
- A Ordem é confirmada como conjunto coerente: sem movimento ilegal, sem cobrança duplicada, e peças continuam podendo andar juntas.
- **Antes de fixar o limite**: confrontar com a pilha existente (hoje `MOVE = {unitIds 1..24, path}`; uma pilha de N peças anda junta por 1 Ordem). A leitura literal "3 peças" impediria uma pilha de 4+ de andar junta numa só Ordem, o que seria regressão militar. O Artifact compara "3 peças" e "3 trajetos" (pilha conta 1 trajeto).
- Implementação: motor e testes primeiro, depois interface. Compatibilidade: o formato antigo `{unitIds, path}` continua válido; a regra nova vale para partidas novas, sem migrar saves.

### D1 · formato final implementado (V12-UX-04, 2026-10-12)
Opção 2: dois formatos de MOVE, exatamente um por Ordem (`StrategicOrderSchema`, um `strictObject` com `superRefine`; `moveLegs(order)` do domínio é o único leitor de caminho e peças).
- **Legado** `{id, type:'MOVE', unitIds, path, rotation?}`: um trajeto, pilha de até 24 peças, 1 Ordem. Intocado (bots, `playtest-log`, saves e escolta). Uma pilha de 6 peças continua custando 1 Ordem.
- **Coordenado** `{id, type:'MOVE', legs:[{unitIds, path, rotation?}, ...]}`: 2..3 legs, `unitIds` disjuntos entre legs, no máximo `COORDINATED_MOVE_MAX_PIECES = 3` peças somando as legs (limite provisório de playtest). Uma leg pode levar um grupo junto; origens e destinos podem ser iguais ou diferentes. Uma leg com 1 peça por trajeto é gravada como legado pelo cliente.
- **Custo**: 1 Ordem EXPEDIÇÃO por ordem, cobrada ao enfileirar. "Cada peça só em uma Ordem por rodada" vale somando as legs.
- **Validação por leg**: orçamento por peça (grau + bônus de cartas/instituições/kit; o de uma leg com várias peças é o da mais lenta), terreno, adjacência, fronteira, ameaça, pilha (as chegadas das outras legs ao mesmo hex somam) e descoberta (cada leg precisa do próprio descobridor e da própria rotação; duas legs na mesma Região fechada: a 1ª revela, a 2ª resolve como movimento comum e pode falhar sozinha). Qualquer leg ilegal recusa a Ordem inteira ao enfileirar, com mensagem concreta (`Trajeto 2 de 3: ...`).
- **Resolução por leg**: uma leg que deixou de ser legal gera `ORDER_FAILED` só dela e as outras seguem; um `MOVEMENT` por leg (com `hexId` e `fromHexId`) e uma mensagem na Crônica por leg. Cancelar (`CANCEL_ORDER`) cancela a Ordem inteira.
- **Leitura para a interface**: `previewMoveOrder(state, actor, legs)` (somente leitura; por leg `ok, cost, budget, remaining, path, blockers, frontierRisk`, e no nível da Ordem `ok, ordersBefore/After, blockers`) é exposto pelo servidor como operação `movePreview`; a projeção ganha `coordinatedMove: {enabled, maxPieces, usedPieces, queued, pieces:[{unitId, inOrder, orderId?, legIndex?}]}`. A interface não recalcula orçamento.
- **Isolamento**: `rules.coordinatedMove` (opcional) é ligado só na criação de partida nova (`createAlphaGame`, padrão ligado; o servidor passa `true`). Saves RC4/RC5 não têm o campo: continuam lidos, aceitam o formato legado e recusam `legs` com "Mover coordenado não está ativo nesta partida.". Rollback para a RC5: mesas antigas (sem o campo) continuam legíveis nos dois sentidos. Mesas NOVAS carregam `rules.coordinatedMove` e `AlphaRulesSchema` é `strictObject`, então um binário RC5 não as lê; o rollback só vale antes de partidas novas serem criadas com a regra (ou se o servidor passar `coordinatedMove:false` ao criar mesas, o que mantém o esquema antigo).

## D2 — Pioneiro e descoberta
- Perigo de 50% (sem Método Experimental) continua provisoriamente, porque é o canon atual (`rules-v5-proposal.md:499`).
- Toda peça perdida gera: aviso antes da ação quando a informação puder ser mostrada, evento explícito `LOSSES`, resultado legível, registro na Crônica e feedback no mapa.
- Orientação de Região que deixaria uma peça em terreno incompatível é impedida. Nunca apagar peça em silêncio.
- **Investigação do relato "sumiu ao revelar água"**: nos 1601 reveals testados em 6 mundos o Pioneiro permaneceu sempre em `state.units`, em terra (Costa conta como terra), visível e persistido (`tests/ux-repro-pioneer-reveal.test.ts`). A única remoção é o Perigo, sem evento. Em ~30–53% dos reveals fora do Continental o Pioneiro termina sobre Costa, que hoje tem a mesma cor e textura do Mar; isso explica "o Pioneiro na água". Correção: diferenciar Costa de Mar, evento `LOSSES`, aviso prévio.

## D3 — Saqueadores
Aprovado:
1. No máximo um assalto à mesma cidade por rodada, somando todos os Bandos.
2. Recuo e reorganização também após assalto a peças no campo.
3. Limite coerente para pilhagem repetida de Piratas, sem eliminar a ameaça.

Registrar como mudança de regra no registro de lacunas antes de implementar.

**Travessia de água**: auditoria de trajetórias (`tests/ux-repro-bando-water.test.ts`, 12 testes). O motor é correto: `alpha-threats.ts:133` trata Costa como terra e Mar como intransponível; o BFS roda sobre vizinhos reais; Cavalaria não salta hex. Dois fatores de aparência explicam o relato: Costa e Mar compartilham cor e textura (`hex-map.tsx:93-94`, `style.css:761-767`), e a linha de rumo do Bando é uma reta centro-a-centro (`hex-map.tsx:636-642`) que cruza o Mar em 59/228 rotas do Arquipélago e 74/363 do Mar Interior. Fato de geração, não pedido: 9 de 20 Acampamentos do Arquipélago nascem em ilha sem cidade e ficam `WAITING` para sempre.

Miniaturas obrigatórias: Bandos, Acampamentos e Piratas são peças reais do motor, com silhuetas de unidade (Infantaria, Cavalaria, Atiradores, Barca, Frota), base de ferro angular, estados de marcha, ataque, recuo, reorganização e destruído. Preservar névoa de guerra.

## D4 — Governar: escolha explícita
O jogador escolhe quantos níveis recuperar dentro da Capacidade real. A ficha mostra Ânimo atual → previsto, níveis, custo total em Cultura ou Riqueza, Ordem e ativação consumidas, disponibilidade na resolução, bloqueios concretos. Corrigir o texto de Revolta (`activationCapacity` 0 vs `operatingCapacity`). Reservar ou prever o custo para não perder Ordem. Ação sem efeito não é confirmável. Recuperação emergencial e suas restrições ficam como estão.

## D5 — Bônus de movimento: sem teto
Sem teto arbitrário. A queixa do playtest é que o movimento não aceitava o bônus da carta, não excesso de alcance. Reproduzir com e sem bônus no motor e na interface (alcance base, alcance com +2, hexes permitidos, caminho aceito, duração, peças afetadas, resolução). Motor rejeitando o que deveria aceitar: corrigir o motor. UI impedindo selecionar ou confirmar: corrigir a UI. Não resolver só com texto ou selo. Testes em `tests/ux-repro-move-bonus.test.ts`.

## Sequência
1. Artifact e documentação das regras (feito).
2. Reproduzir os bugs em testes determinísticos (água, Pioneiro: feito; bônus: em curso).
3. Integridade do motor e regras novas.
4. Ficha de Ação e `previewAction`.
5. Miniaturas, trajetórias e indicadores na mesa.
6. Validação em desktop, celular e partidas reais. Sem simulações em massa.

## D6 (proposta, aguardando números): pesca em Mar com navios
Pedido do dono: o Mar também tem peixes, pescados só por navios, com mais Alimento que a pesca da margem, como em Clash of Cultures. O manual de Clash of Cultures (avanço Pesca, edifício Porto) deixa a cidade coletar Alimento de um espaço de Mar adjacente; o AoH hoje só tem Pesqueiro (`FISHERY`, +1 Alimento) sobre Costa com `FISH`. Proposta registrada como V12-UX-05 e desenhada no Artifact (cardume de alto-mar e Pesca de frota). Nada foi implementado: números (+2), limites, exigência de Porto e geração de cardumes dependem de confirmação.

## Costa
A Costa passa a ser desenhada como águas rasas (turquesa claro com bancos de areia), não areia. Regra de motor inalterada: Costa conta como terra para peças terrestres e é navegável por navios.

## Estradas em rede (conceito)
No motor `state.roads` é uma lista de hexes (não SEA/UNKNOWN); o mapa já liga cada hex com estrada a todos os vizinhos com estrada ou cidade (`hex-map.tsx` meias-linhas por vizinho). O conceito (Artifact, "Estradas em rede") define a leitura visual: ponta (1 vizinho), reta e curva (2), cruzamento ou estrela (3 a 6) com cantaria no centro, passadiço de tábuas sobre Costa, ponte sobre Rio, e custo de movimento 1 para peças terrestres. Falta portar `roadLayer` (docs/product/mesa-viva/02b-terrain.js) para o mapa do jogo.

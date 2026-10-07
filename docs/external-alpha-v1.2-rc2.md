# External Alpha V1.2 · RC2 — Mover é descobrir, progressão naval, Ressonância física

Escopo do RC2 (última passagem estrutural antes do frozen): fundir **exploração** no **Mover**, tornar o mar uma consequência da progressão (e não de um "barco explorador"), tornar a Ressonância visível como peças físicas e incorporar as correções de `1d7b779`. Nada de combate, economia, 5 Ordens, Hegemonia, ARID, Patronos, novas unidades ou novas civilizações foi tocado.

## 1. Princípio canônico

**Mover é a Ordem.** Abrir uma Região é uma consequência especial de um Mover cujo último passo entra numa Região fechada. Não existe uma Ordem estratégica "Explorar" para partidas novas. O jogador pensa "mover o Pioneiro para o desconhecido", não "usar outra ação".

A categoria **Expedição** continua sendo uma das cinco Ordens do jogo (Cidade, Expedição, Avanço, Influência, Legado) e já continha Mover, Atacar e Fundar. Ela não foi tocada: o chip "Expedição" da barra inferior agora mostra no tooltip que ela cobre "Mover (inclui descobrir), Atacar e Fundar".

## 2. Arquitetura (motor)

- `MOVE` ganhou o campo opcional `rotation` (0–5): é o *payload de descoberta*. Sem ele, o Mover é comum.
- `packages/game-engine/src/alpha-frontier.ts` (novo) reúne a regra:
  - `frontierRegionOf` / `isFrontierMove`: o último hex do caminho está numa Região fechada para o ator.
  - `planFrontierMove`: valida (na fila e de novo na resolução) e devolve o plano; `resolveFrontierMove`: gira/revela a Região (`revealRegion`), move o grupo para o hex de entrada, resolve a Descoberta uma vez (`applyDiscovery`) e acomoda a carga (`settleCargo`).
  - `entryRotations`: orientações em que o **hex de entrada** é pisável pelo grupo (terra para terrestres; água navegável para navios); orientação fixa (Região já tocada) responde com a própria rotação; terreno já observado por alguém nunca muda.
  - `discovererOf`: quem conduz a descoberta (Pioneiro; navio com Pioneiro a bordo; navio de civilização com Navegação Oceânica).
- `alphaUnitOptions` (por peça) deixou de trazer `explore` e passou a trazer `movement`, `frontier` (Regiões fechadas com hexes de entrada, caminho e orientações; `block` quando não há entrada), `discoverer` e `frontierNote`.
- Resolução (`resolveOrders`): um `MOVE` de fronteira vira evento de resolução do tipo `DISCOVERY` ("Descoberta") com mensagem "X entrou em <Região> — Região revelada." Não existe mais uma linha "explorou".
- Revelação compartilhada: `revealRegion(state, actor, region, rotation)` foi extraída de `exploreRegion`; os dois caminhos usam a mesma função.

## 3. EXPLORE legado (V1.1 e planos feitos antes do RC2)

`EXPLORE` continua no schema e no resolvedor, **somente leitura**:
- snapshots V1.1 e salas v1.2 com ordens `EXPLORE` já planejadas ainda parseiam e resolvem;
- `QUEUE_ORDER` com `EXPLORE` é recusado ("Explorar agora é Mover…");
- clientes e bots novos nunca o criam; a UI não tem mais "Explorar".

## 4. Regra final do Pioneiro e da escolta

- Estado inicial: **o Pioneiro é a única peça que revela Regiões** por terra. Infantaria, Guarda, Arqueiros, Cavalaria, Engenho de Cerco e Enviado só andam por Regiões já reveladas, **exceto** quando fazem parte do mesmo grupo de um Pioneiro.
- **Uma Ordem MOVE** para: mover em território conhecido; mover o Pioneiro para uma Região fechada e revelá-la; Pioneiro + escolta revelando; navio + Pioneiro revelando; navio com a capacidade naval. Nunca MOVE + EXPLORE (nunca duas das cinco Ordens).
- **Grupo físico**: todas as peças começam no **mesmo hex** e seguem o **mesmo caminho**. Não existe "movimento do grupo": cada peça mantém seu movimento e o caminho precisa ser pago por todas; a mais lenta limita o grupo (Pioneiro 3 + Engenho de Cerco 1 só descobrem juntos entrando direto).
- **Movimento canônico preservado**: Infantaria/Guarda/Arqueiros/Cavalaria 2 (Cavalaria Grau II 3), Engenho de Cerco 1, Frota 3, Pioneiro 3, Enviado 3; custos PLAINS/COAST/SEA/UNKNOWN 1, FOREST/HILLS 2, MOUNTAINS 3, Estrada (peça terrestre) 1; bônus de instituição, cartas, kits e Grau mantidos.
- **Entrada no desconhecido**: custa `UNKNOWN` (1) e é **obrigatoriamente o último passo**. O terreno revelado **nunca é cobrado retroativamente** (um Engenho de Cerco de movimento 1 entra numa montanha recém-aberta). Depois da entrada o movimento termina; nos próximos Moves vale o terreno real.
- **Região, não hex**: não há névoa hex a hex. "Por onde o Pioneiro passou" significa a Região que ele abriu; depois disso, qualquer peça entra normalmente.
- Kit Elyra (Cartógrafa): o Pioneiro entra no desconhecido sem gastar movimento (`kitFrontierCost`), no lugar do antigo "revela a 2 hexes".
- Entrada terrestre: PLAINS, FOREST, HILLS, MOUNTAINS, COAST; SEA não serve. Sem nenhuma orientação terrestre para os hexes de entrada: **"Requer acesso naval."**
- Sem Pioneiro: a Região fechada não é destino (não é destacada); o cloud da peça mostra "Necessita de um Pioneiro para descobrir."
- Orientação: uma só válida → automática; várias → o jogador escolhe ("Orientação 1 de N", abstrata, sem terreno); nenhuma → bloqueio.
- **Concorrência**: se outra civilização abre a Região antes, o Move seguinte é revalidado contra o estado agora conhecido: movimento comum, sem girar de novo e sem repetir a Descoberta. O diário diz "A Região já havia sido revelada." (ou, se o Move comum não couber, "A Região já havia sido revelada; o movimento não pôde ser feito: …"). Isto corrige a linha "explorou" duplicada da RC1.
- Ameaça escondida no hex de entrada: a Região abre, a Descoberta resolve, mas o grupo fica na fronteira.
- Perigo: o explorador da Descoberta (`explorerId`) é o **Pioneiro** (com escolta ou não) ou o navio que navega sozinho. Comportamento do Perigo preservado (sem rebalanceamento).

## 5. Mar: capacidade da civilização, não classe de barco

**Auditoria do catálogo naval**: existiam `COASTAL_VESSEL` (Era I, Força 0, civil, transporta 1, "explora") e `FLEET` (Era II, Força 3, transporta 2, 3 no Grau II). Combate, bloqueio, Porto, embarque e naufrágio são genéricos por domínio SEA/Força > 0.

Decisão:
- **Nenhuma terceira classe naval.** O id técnico `COASTAL_VESSEL` fica (saves intactos).
- `COASTAL_VESSEL` foi **reautorada** como **"Barca de Patrulha"**: navio leve inicial de **Força 1** (Frota = 3), movimento 3, transporta 1 peça, patrulha, escolta, bloqueia e combate. Não é mais a "peça que só explora". O texto visível mudou em toda a UI (Compêndio, Guia, tour, peças no mapa); salas já em andamento guardam a ficha antiga no próprio snapshot.
- **Antes do avanço**: nenhum navio revela Região sozinho. Para descobrir por água: **navio + Pioneiro embarcado** (qualquer navio capaz de transportar). O Pioneiro conduz; o navio é o veículo. A carga continua a bordo (não desembarca sozinha); `DISEMBARK` continua separado.
- **Avanço naval = Navegação Oceânica** (`web-ocean-navigation`, já existente na Teia, Era IV da Teia): ganhou o unlock `rule:naval-discovery`. Depois dele, **qualquer unidade naval da civilização** abre Regiões navegáveis fechadas sem Pioneiro (a regra é por domínio/capacidade, lida pelo unlock — nenhum id de barco rígido). Unidades terrestres não ganham nada. Nenhum avanço novo foi criado.
- **Cartografia ≠ Navegação Oceânica**: Cartografia segue sendo *informação prévia* (dicas de costa via `explorationHints`); Navegação Oceânica é a *capacidade de descobrir sem Pioneiro*. Não foram fundidas.
- O navio continua sendo de guerra: ganhar a capacidade não remove Força, combate, transporte, bloqueio, stack, manutenção nem upgrades.
- O risco continua: enviar um navio ao desconhecido expõe unidade, carga, Pioneiro e posição.
- Nórdicos (Thalos) seguem com sinergias de custo/Porto/Heranças; a Teia continua universal (nenhuma árvore naval exclusiva).

## 6. UI

- Pioneiro: **Mover**, **Fundar** (e **Com escolta** quando há militares livres no mesmo hex). Não existe "Explorar".
- Mover ativo: hexes conhecidos legais como sempre; as Regiões fechadas alcançáveis aparecem como destino especial (borda tracejada dourada, o selo `?` no nó **Mover**). Clicar um hex da Região escolhe a entrada (a mais barata, ou o hex clicado se for uma entrada).
- Uma orientação: a ordem entra direto. Várias: seletor abstrato "Orientação da Região" → "Confirmar movimento".
- Ordem planejada: "Mover · descobrir" no mapa; "Mover · … → desconhecido" na lista de ordens.
- Resolução: o painel de Resultados mostra **"Descoberta"** (não "Exploração") e depois o painel REGIÃO REVELADA para o descobridor.
- Navio: sem Pioneiro e sem a Navegação Oceânica, a Região não é destino e o cloud diz "Necessita de um Pioneiro embarcado ou de Navegação Oceânica para descobrir."

## 7. Ressonância — auditoria e interface física

**Auditoria (código + testes)**: nada precisou ser reescrito; já funcionava ponta a ponta.
- **Marca permanente × encaixe temporário**: `registerAdvance` (único ponto: `alpha-institutions.ts`, comprar Teia/Convergência/Herança) adiciona uma **marca permanente** a `resonance.marks` (sem duplicar, nunca limpa) e um **encaixe temporário** a `resonance.slots`. Convergência ocupa um encaixe com dois domínios; Herança entra com o domínio do seu requisito.
- **Ciclo**: encaixes 1–4 só enchem; no 5º, `slots` esvazia na hora, `classifyResonance` escolhe Dominante / Confluência / Híbrida / Par, `pickRepercussion` sorteia a carta de forma determinística, o preço vale salvo `mitigatedBy`, o ganho +1 com `leveragedBy`, nasce uma escolha pendente `REPERCUSSION`, `history` guarda os cinco encaixes (últimos 10) e a telemetria conta. `RESOLVE_CHOICE` aplica; sem resposta, o Turno de Era escolhe a opção 0. Bots resolvem a escolha.
- **Teste determinístico** (`tests/alpha-resonance.test.ts`, 21 testes): 1/5, 2/5, 3/5, 4/5 → Repercussão no 5º → slots 0 com as 5 marcas intactas, novo ciclo em 1/5 com 6 marcas; save/reload idêntico em 3/5, com a escolha pendente e depois da resolução.
- **Interface**: fichas que **não dependem só de cor** (forma = origem: quadrado Teia, losango Convergência, hexágono Herança; glifo de linha = domínio; Convergência com dois glifos), bandeja de **cinco encaixes** em vez de "3/5" só em texto, ficha permanente em cada nó da Teia, contador compacto "3 / 5" no topo que abre a Teia/Ressonância, animação curta (ficha entra no nó → voa ao encaixe → no 5º os cinco respondem → Repercussão → limpa encaixes; marcas ficam) e `prefers-reduced-motion` desliga tudo. Evidência 1280×720 + mobile em `docs/evidence/rc2/resonance/` (A–H, escala de cinza, daltonismo).

## 8. Bots

- Pensam MOVE: o Pioneiro caminha até uma entrada e leva a orientação; nunca criam `EXPLORE`.
- Mar antes do avanço: um Pioneiro junto a um navio próprio embarca (`EMBARK`); o navio com carga descobre; sem Pioneiro, o navio não tenta. Persona exploradora com navio e sem Pioneiro recruta um Pioneiro em mundo de água.
- Mar depois do avanço: o navio elegível descobre sozinho (Frota ou Barca).
- Um Pioneiro embarcado desembarca num sítio legal de cidade quando o navio não tem mais nada a abrir.
- Não houve redesenho da IA. **Gap conhecido (BOT)**: bots de personas que não exploram não montam expedições navais, e nas sondagens de 14 rodadas em Arquipélago/Mar Interior a descoberta por navio ocorreu em parte das partidas, não em todas.

## 9. Testes

- `tests/alpha-move-discovery.test.ts` (14): Move terrestre (Pioneiro sozinho, Infantaria sozinha, escolta, grupo no mesmo hex e limite da peça mais lenta, UNKNOWN = 1 e último passo, terreno revelado nunca cobrado, Região já aberta, duas civilizações, explorador do Perigo) e naval (sem/com Pioneiro, carga embarcada, Navegação Oceânica para Frota e Barca, terrestres sem unlock, save/reload).
- `tests/alpha-bots-discovery.test.ts` (3), `tests/alpha-naval.test.ts` (Barca armada, bloqueio), `tests/alpha-resonance.test.ts` (21), e2e `e2e/move-discovery-live.spec.ts` (7) e `e2e/resonance-live.spec.ts` (2).

## 10. Operação

Ver o relatório do RC2 (`docs/external-alpha-v1.2-rc2-report.md`).

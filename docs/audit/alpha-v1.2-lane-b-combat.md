# Alpha V1.2 · Lane B · Auditoria de guerra e combate

Branch `stabilize/alpha-v1.2-audit` (baseline RC4). Auditoria **somente leitura** do código-fonte: nenhum arquivo em `packages/` ou `apps/` foi alterado, a matemática de combate não foi tocada, nada foi commitado. Entregáveis novos:

- `docs/audit/alpha-v1.2-lane-b-combat.md` (este arquivo)
- `tests/v12-audit-combat-helpers.ts` (fixture de linha de planícies com 2–3 jogadores, **sem** o +Movimento gratuito da arena antiga)
- `tests/v12-audit-combat-flow.test.ts`, `tests/v12-audit-combat-sync.test.ts`, `tests/v12-audit-combat-siege-naval.test.ts`

## 1. Linha de base e como ler os testes

Antes: `alpha-combat`, `external-combat-fixtures`, `alpha-casualty-priority`, `alpha-conflict-call`, `alpha-conflict-recovery`, `alpha-diplomacy`, `alpha-guard-identity`, `alpha-naval`, `alpha-stack`, `alpha-supply`, `alpha-threats`, `alpha-war-access`, `external-threat-fixtures`: **13 arquivos, 202 testes, todos verdes** (e continuam verdes depois dos novos arquivos).

Novos: **3 arquivos, 50 testes = 31 verdes + 19 `it.fails` (REPRO)**. Convenção:

- `it.fails('REPRO: …')`: o corpo declara o comportamento **esperado** e hoje lança; o vitest o reporta como passando. Quando o bug for corrigido o teste passará a "falhar" (`Expect test to fail`) e deve virar `it(...)`. É o teste de regressão de cada achado.
- `it('CHARACTERIZATION …')` / `it('RULE …')`: congela o comportamento atual que o relatório marca como decisão de regra/balanço/UX.
- `it(...)` sem prefixo: guarda de comportamento correto hoje.

Rodar: `npx vitest run tests/v12-audit-combat-flow.test.ts tests/v12-audit-combat-sync.test.ts tests/v12-audit-combat-siege-naval.test.ts`

Nota de método: a arena compartilhada `tests/alpha-arena.ts` dá ao jogador 1 um efeito `MOVEMENT +5` (o schema aceita no máximo 2: o estado da arena **não é válido** para `AlphaStateSchema`). Isso esconde toda regra de custo de movimento no ataque (B-01). Os novos testes usam `line()` sem o efeito.

## 2. Matriz de achados

Severidade: **P1** quebra o jogo real/um fluxo central; **P2** erro de regra, exploração ou perda clara de informação; **P3** inconsistência localizada; **P4** baixo impacto. Tipos: BUG, RULE (decisão de regra), BALANCE, UX, WORLD, LEGACY.

| ID | Tipo | Sev | Achado | Onde | Teste |
|---|---|---|---|---|---|
| B-12 | BUG (cliente) | **P1** em mesas de 3+ | O cliente lê "em guerra" como "esse jogador está em guerra com *alguém*": some o botão "Declarar guerra…", o card mostra "Em guerra" e a aba Troca é bloqueada | `apps/web/app/alpha/alpha-table.tsx:162`, `alpha-panels.tsx:158` | sync: 2 REPRO |
| B-01 | BUG/RULE | **P1** | O ATTACK cobra o custo de terreno do hex **alvo** como se fosse movimento: Engenho de cerco (mov. 1) nunca ataca Floresta/Colina/Montanha, Infantaria/Cavalaria nunca atacam Montanha, um grupo misto trava na peça mais lenta | `alpha-military.ts:81,83` | flow: 4 REPRO |
| B-02 | BUG | **P2** | Captura de cidade de **terceiro sem guerra**: se a guarnição de B estiver dentro da cidade de C, A (em guerra só com B) toma a cidade de C | `alpha-military.ts:88-96`, `alpha-combat.ts:32,151,167` | flow: 1 REPRO |
| B-10 | UX | **P2** | Captura de cidade **não gera nenhum evento** (nem para a vítima, nem para a mesa) | `alpha-combat.ts:167`, `alpha-cities.ts:37-71` | flow: 1 REPRO |
| B-08 | UX/BUG | **P2** | Ordem de ataque que falha (alvo se moveu/morreu) aparece só nas Crônicas; não entra no relatório de rodada nem no overlay "Resultados"; a Ordem é gasta | `alpha-phases.ts:163-168` | flow: 1 REPRO |
| B-13 | UX | **P2** | A janela CONFLITOS só para quem tem carta de Reação. Defensor sem carta é atacado no mesmo clique que fecha o Planejamento, sem aviso | `alpha-phases.ts:391-393` | sync: 2 CHAR |
| B-03b | BALANCE/RULE | **P2** | Sem refúgio, **toda a pilha** derrotada é destruída (uma VITÓRIA que deveria custar 1 peça custa tudo); o refúgio recusa hex de aliado e de terceiros | `alpha-combat.ts:155-156` | flow: 2 CHAR |
| B-06 | RULE | **P2** | Frotas sozinhas ocupam uma cidade costeira (sem tropa terrestre, sem guarnição) | `alpha-combat.ts:151-167`, `alpha-military.ts:44-47` | flow: 1 REPRO |
| B-15 | UX | P3 | `BattleReport`: mostra ids internos, só "Peças perdidas: N" sem lado, e "Retirada para X" ambíguo | `alpha-combat.tsx:67,72` | sync: 3 REPRO |
| B-03 | BUG | P3 | Defensor derrotado recua para o hex de um Acampamento/Bando e passa a coabitar com a ameaça | `alpha-combat.ts:155` | flow: 1 REPRO |
| B-04 | BUG (estado) | P3 | Após cair uma capital, a nova capital do dono antigo fica com `meta.capital=false` (marca de capital some na Mesa) | `alpha-cities.ts:44,64` | flow: 1 REPRO |
| B-04b | RULE | P3 | Civilização sem cidades continua viva: sem evento, sem eliminação, sem vitória por conquista; humano segue obrigado a dar READY em toda fase | `alpha-cities.ts:44`, `alpha-phases.ts` | flow: 1 CHAR |
| B-05 | BUG | P3 | `DEMOBILIZE` (e `DISEMBARK`) aceitam peças já reservadas em ordem: o ATTACK inteiro morre na resolução com "A ordem contém uma peça que não pertence a você." | `alpha-city.ts:217`, `alpha-naval.ts:73` | flow: 1 REPRO + 1 CHAR |
| B-07 | BUG | P3 | Carga de frota afundada é "resgatada" para dentro de cidade inimiga vazia | `alpha-naval.ts:109` | flow: 1 REPRO |
| B-09 | UX | P3 | Aliado puxado à guerra por Pacto Defensivo entra em guerra sem nenhum aviso | `alpha-diplomacy.ts:64-68`, `alpha-phases.ts:199` | flow: 1 REPRO |
| B-14 | BUG | P4 | Reparar muralha fica acoplado a pagar Ânimo em governos sem nível grátis (só o Conselho tem) | `alpha-city.ts:295` | siege: 1 REPRO |
| B-16 | BALANCE | P4 | Lista de pontos de balanço (seção 4) | vários | siege/flow/sync: CHAR |
| B-17 | PERF | P4 | `battles`, `events`, `roundReports` crescem sem poda e vão inteiros em cada poll | `alpha-projection.ts:75-77` | sync: 1 informativo |
| L-01 | LATENT | P4 | `viewersAt` não inclui o defensor em `always` | `alpha-phases.ts:70,150,154` | sem teste (ver 3.L) |

## 3. Detalhe por achado

### B-12 · "em guerra" lido como "em guerra com qualquer um" (P1, cliente)
- **Repro:** mesa com 3 jogadores. `wars = [[p2,p3]]`. A projeção entrega `wars` global a todos (`alpha-projection.ts:73`, `wars:state.wars`), então p1 recebe `[["p2","p3"]]` (teste "ships the GLOBAL war list"). No cliente, `hostileTo()` faz `game.wars.some(pair => pair.includes(other))` e o `RelationCard` faz `war=game.wars.some(pair=>pair.includes(otherId))`. Para p1, p2 aparece como "Em guerra" (`status`, classe `is-war`), o botão "Declarar guerra…" some (`{!war&&…}`), a aba Troca mostra "Em guerra: o comércio está suspenso" e, na Mesa, "Atacar" pula o passo "Em paz" (envia ATTACK direto e o servidor recusa com "Declare guerra antes…", sem oferecer a declaração).
- **Por que o playtest de 2 jogadores não vê:** com 2 pessoas qualquer par de `wars` envolve o outro.
- **Correção mínima:** `game.wars.some(pair => pair.includes(selfId) && pair.includes(other))` (Mesa) e `pair.includes(self) && pair.includes(otherId)` (painel, `const self=game.self.playerId` já existe ali).
- **Regressão:** `v12-audit-combat-sync.test.ts` → dois `it.fails` "alpha-table.tsx hostileTo()…" e "alpha-panels.tsx RelationCard…" (contrato de código-fonte; não há harness React). Ideal: extrair `atWarWith(wars, self, other)` para um módulo puro e testar com dados.
- Observação (WORLD): a lista global de guerras é pública por desenho (`WAR_DECLARED` é evento público); o comentário de `cityMarks` ("revelaria uma guerra entre terceiros") diz o contrário. Só o cliente precisa filtrar.

### B-01 · ATTACK cobra o terreno do alvo como movimento (P1)
- **Repro (`v12-audit-combat-flow`, bloco "B-01"):** linha de planícies, guerra declarada, `validateMilitaryOrder`:

  | alvo | Infantaria | Cavalaria | Cerco |
  |---|---|---|---|
  | Planície | ok | ok | ok |
  | Floresta (custo 2) | ok | ok | **"Caminho excede a mobilidade da peça."** |
  | Colina (custo 2) | ok | ok | **idem**, inclusive cidade em Colina |
  | Montanha (custo 3) | **idem** | **idem** | **idem** |
- **Causa:** `alpha-military.ts:77-83` percorre `path=[order.target]` para ATTACK e soma `movementCosts[terrain]` do alvo (linha 81), comparando com a mobilidade (linha 83). Cerco tem movimento 1; Infantaria/Guarda/Arqueiros/Cavalaria 2; Montanha custa 3. Atacar não entra no hex; só o vencedor avança (e a pilha cabe pelo `stackRoom`).
- **Efeito de jogo:** a única peça que quebra muralha (canon §11b "Fortaleza exige Cerco") não alcança cidade em Floresta/Colina; `mountainDefense +2` e `hillDefense +1` só funcionam contra peças que nunca poderiam atacar; um exército com 1 Cerco inteiro fica travado. Humanos veem apenas "Caminho excede a mobilidade da peça." (o texto fala de "caminho" num ataque de 1 hex).
- **Correção mínima:** para `order.type==='ATTACK'` exigir só adjacência + `canEnter` + (se quiser) estrada/mobilidade ≥ 1, sem somar `movementCosts` do alvo. Ex.: `if (order.type==='MOVE') cost+=…; else cost=0;` antes da checagem da linha 83.
- **Regressão:** 4 `it.fails` (Cerco×Colina-cidade, Cerco×Floresta, grupo misto×Floresta, Infantaria×Montanha) + 1 CHAR de controle (Planície).
- Decisão de design pendente (RULE): se o PO quer manter "atacar custa entrar", então Cerco precisa de mobilidade ≥ 2 ou o custo do Cerco no alvo deve ser reduzido; hoje a regra torna o Cerco inútil em metade do mapa.

### B-02 · Captura de cidade de terceiro sem declaração de guerra (P2)
- **Repro:** 3 jogadores. `wars=[[p1,p2]]`. Peça de p2 em cima da cidade de p3 (possível com Fronteiras Abertas/Aliança, ou por B-07). p1 ordena ATTACK nesse hex: o queue aceita (`defender = enemies[0]?.ownerId` → p2, em guerra). Na resolução `sidesOf` também usa o dono da peça (`alpha-combat.ts:32`), e `captured` só confere `city.ownerId !== actor` (linha 151). Resultado do teste: batalha DECISIVE, `occupyCity(c3)`, `wars` continua `[[p1,p2]]`, p3 perdeu a cidade sem guerra.
- **Correção mínima:** em `validateMilitaryOrder` exigir guerra com **todos** os donos presentes no hex (cada `enemies[].ownerId` **e** `city.ownerId`); em `resolveBattleWithFaces` só capturar se `atWar(actor, city.ownerId)`.
- **Regressão:** `it.fails` "B-02 · p1 … captures p3's city".

### B-10 · Captura de cidade sem evento (P2, UX)
- A resolução emite COMBAT, LOSSES, RETREAT, ADVANCE (`alpha-phases.ts:150-161`); `occupyCity` só grava `CITY_TRANSFERRED` no `core.eventLog`. A vítima descobre pela lista de cidades; nenhum resolution/alphaEvent diz "X tomou Y".
- **Correção mínima:** em `resolveBattleWithFaces`, quando `captured`, `alphaEvent(state,'CITY_CAPTURED',…, null)` + `resolutionEvent({type:'COMBAT'|'ROUND_EVENT',…,visibleTo:viewers,cityId,hexId})`.
- **Regressão:** `it.fails` "a captured city is announced".

### B-08 · Ordem de ataque falha sem rastro no relatório (P2)
- **Repro (fluxo completo por comandos):** p1 enfileira ATTACK em `4,0`; p2 enfileira MOVE da peça para `5,0`. `ORDERS_MOVEMENT` resolve o MOVE primeiro; o ATTACK lança "Não há adversário conhecido nesse destino.", que vira só `alphaEvent('ORDER_FAILED', …, [p1])` (`alpha-phases.ts:167`). O relatório de rodada de p1 traz apenas `MOVEMENT` de p2 e `ROUND_EVENT`s; **sem `FAILURE`** (compare com `resolvePlannedActions`, que emite `FAILURE`, linha 207). A Ordem fica gasta (sem reembolso).
- **Correção mínima:** no `catch` do `resolveOrders` emitir `resolutionEvent(state,{type:'FAILURE',actorId:id,visibleTo:[id],message:reason,hexId:target,unitIds})`. Opcional: mensagem específica por ordem ("Seu ataque em 4,0 não achou alvo: a peça se moveu.").
- **Regressão:** `it.fails` "a failed ATTACK … appears in the round report resolution".
- Nota (RULE): como MOVE/TRADE resolvem antes de ATTACK, um alvo que anda sempre foge; o ataque é "tiro no vazio" e custa a Ordem. Se isso é desejado, a UI deve avisar no preview ("alvo pode se mover antes").

### B-13 · Janela de Conflitos / reação do defensor (P2, UX)
- `advanceAfterReady` marca `ready=false` só para quem é parte de um ataque **e** tem carta de Reação na mão (linhas 391-392). Defensor sem carta: o ataque resolve dentro do clique que fecha o Planejamento; `incomingAttacks` só existe em CONFLICTS (`alpha-projection.ts`, `state.phase==='CONFLICTS'`), então esse jogador nunca vê "você está sendo atacado" (teste CHAR: após 3 READY, `round` já é 2, `incomingAttacks=[]`). Com carta, o jogador é retido, vê o aviso, mas `SET_DEFENSE_POSTURE` e `SET_CASUALTY_PRIORITY` são recusados em CONFLICTS (decisão canônica: postura em segredo no Planejamento) – só resta jogar a carta.
- Armadilha de balanço/UX: postura padrão do ataque é `ASSAULT` (`alpha-table.tsx:70`, schema default) e a do defensor é `HOLD` (`alpha.ts:135`), e Manter vence Assalto: **toda batalha sem personalização dá +1 ao defensor** (CHAR no teste).
- **Sugestão:** abrir sempre a pausa de CONFLITOS para um defensor **humano** (modo "informativo": só READY), ou no mínimo destacar no overlay "Resultados" quem atacou o quê; avisar na prévia que o círculo é ASSAULT<HOLD<MANEUVER<ASSAULT e que a postura padrão do defensor é Manter.

### B-03b · Retirada: pilha inteira morre e refúgio restritivo (P2, balanço/regra)
- Canon §11b: "|Δ| 2–4: vitória, o perdedor perde **1** e recua". Engine (`alpha-combat.ts:155-156`): se nenhum vizinho serve, **os sobreviventes são adicionados a `losses`**. O refúgio exige `ownerId===null || ownerId===defender`, sem aliado, sem hex de terceiros, e todo sobrevivente precisa `canEnter` (pilha mista terra+navio quase nunca acha hex).
- **Repro (CHAR):** 4 Infantaria × 3 em `4,0`, HOLD×HOLD, dados vazios → Δ +2 = VITÓRIA; `5,0` pertence ao atacante: `losses=3`, `retreat=null`, defensor zerado. Idem se `5,0` for de um terceiro.
- **Efeito:** exércitos em fronteira entre territórios (justamente onde a guerra acontece) são aniquilados em qualquer vitória; o relatório mostra "Peças perdidas: 3" numa "vitória".
- **Opções:** (a) refúgio aceita `movementOpen(defender, tile.ownerId)` (aliado/fronteira aberta/guerra); (b) sem refúgio o defensor **permanece** e só paga as baixas do desfecho (ou o atacante não avança); (c) manter, mas registrar `routed: string[]` no `battle` e mostrá-lo.

### B-06 · Frotas capturam cidades sozinhas (P2, regra)
- `canEnter` deixa `SEA` entrar em `COAST`; a cidade em Costa é alvo válido para Frota; se `survivors===0` (cidade sem guarnição) `captured` é verdadeiro e as Frotas "avançam" para a cidade (`fits.forEach(hexId=target)`) e `occupyCity` roda. Teste: 2 Frotas × cidade costeira vazia → `OCCUPIED`, frotas em `5,0`.
- **Sugestão:** exigir ao menos uma peça terrestre entre as sobreviventes avançando para `captured`; Frota apenas bombardeia/bloqueia (já existe Abordagem/bloqueio).

### B-15 · Relatório de batalha na UI (P3)
- `alpha-combat.tsx:67` imprime `roll.unitId` cru (`unit-p1-12-3: Comando: Salva …`); `:72` mostra "Peças perdidas: N" sem dizer de qual lado nem quais; `retreat` guarda a origem do **atacante** (derrota/empate) ou o refúgio do **defensor** (vitória), e a UI diz "Retirada para X" nos dois casos sem dizer quem recuou.
- **Correção mínima:** usar `battle.attackerUnits/defenderUnits ∩ battle.losses` para listar por lado com nome da peça (ex. "Beto perdeu Infantaria ×2"), trocar `unitId` por nome/ordem (`Infantaria #1`), e rotular "Atacante permaneceu em X" vs "Defensor recuou para X". O texto já existe pronto em `lossesMessage` (engine).
- **Regressão:** 3 `it.fails` de contrato de código-fonte.

### B-03 · Recuo para hex de ameaça (P3)
- O filtro do refúgio (`alpha-combat.ts:155`) não olha `state.threats`; o `MOVE` bloqueia hex de ameaça (`alpha-military.ts:80`) mas o recuo não. Teste: Acampamento em `5,0`, 5 defensores derrotados terminam em `5,0` junto do acampamento. Depois disso `isThreatTarget` é falso (há peça no hex) e o acampamento fica fora do combate.
- **Correção:** `&& !state.threats.some(t => t.hexId === id)` no filtro (e em `settleCargo` `shore`).

### B-04 / B-04b · Capital capturada e civilização sem cidades (P3)
- `occupyCity` troca `previous.civilization.capitalCityId` (linha 44) mas só atualiza `meta.capital` da cidade capturada (linha 64). Nova capital do antigo dono: `capital=false` → o único consumidor (`cityMarks.capital` na projeção) deixa de marcá-la. **Correção:** após a troca, `state.cities.filter(c=>c.currentOwnerId===previous.id).forEach(m=>m.capital=m.cityId===previous.civilization.capitalCityId)`.
- Última cidade capturada: `capitalCityId=null`, a partida segue `ACTIVE` (teste verde com `completeRound`), sem evento de eliminação e sem condição "último de pé". O humano eliminado precisa dar READY em toda fase. **Decisão de regra:** estado `eliminated` (auto-ready, sem Ordens) e vitória por conquista, ou deixar para a Hegemonia/limite de rodadas (então documentar).

### B-05 · Comandos livres que invalidam ordens já reservadas (P3)
- `embarkBlock` e `settleWithPioneer` consultam as ordens ("Cancele as ordens dessas peças"); `demobilize` e `disembarkBlock` não. Repro: 3 Infantaria na cidade com ATTACK enfileirado; `DEMOBILIZE a3` → `ok`; na resolução a ordem inteira falha com "A ordem contém uma peça que não pertence a você." (teste CHAR) e nenhuma batalha acontece.
- **Correção:** copiar a checagem `ordered(state, actor)` (de `alpha-naval.ts:52`) para `demobilize` e `disembarkBlock`.

### B-07 · Resgate de carga para dentro de cidade inimiga (P3)
- `settleCargo` escolhe o primeiro vizinho não-mar sem peça estrangeira (`alpha-naval.ts:109`), sem checar `enemyCityAt`/`movementOpen`. Teste: frota de p1 afundada ao lado da cidade costeira vazia de p2: `pi1` termina dentro da cidade de p2 (e `pi2` é perdida). Resultado: peças de dois donos no mesmo hex (cidade).
- **Correção:** acrescentar `!enemyCityAt(state, unit.ownerId, tile.id) && movementOpen(state, unit.ownerId, tile.ownerId)` ao `find` do `shore`.

### B-09 · Pacto Defensivo sem aviso (P3)
- `manageDiplomacy` chama `enterWar(defender, actor)` para cada aliado do alvo; o evento `WAR_DECLARED` cita só ator e alvo (`alpha-phases.ts:199`). `wars` ganha `[p1,p3]` sem mensagem. **Correção:** `alphaEvent`/`resolutionEvent` "p3 entrou na guerra por pacto com p2" (público).

### B-14 · Reparo acoplado ao pagamento de Ânimo (P4)
- `governBlock` (`alpha-city.ts:295`) recusa Governar quando `mood<6`, o governo não dá nível grátis (só o Conselho dá) e não há 1 Cultura/2 Riqueza, mesmo com Pedra para reparar. Governo ≠ Conselho, Cultura 0, Riqueza 1, muralha BREACHED → lança. **Correção:** permitir a ação quando há reparo possível (`fortification.state!=='INTACT' && Pedra>=1`) e pagar só o que existe.

### L-01 · `viewersAt` (latente)
- `viewersAt(state, target, [id])` não inclui o **defensor** em `always` (`alpha-phases.ts:150,154,158`). Hoje inofensivo: no modelo "Mesa compartilhada" toda Região aberta é pública e `knownHexIds == visibleHexIds`, então o defensor sempre enxerga o hex. Passa a ser bug se alguma Região voltar a ser privada ou se houver peças em Região fechada. **Endurecer:** `viewersAt(state, target, [id, defenderId])`. Sem teste (não reproduzível sem alterar `regionIsPublic`).
- Do mesmo modo `battles` (projeção) usa a visão **atual** do hex para mostrar batalhas antigas a terceiros; irrelevante enquanto tudo é público.

## 4. B-16 · Pontos de balanço (caracterizados, não são bugs)

1. "Sem suprimento −2" é **uma** penalidade fixa por lado, não por peça (teste: 1 ou 6 peças fora de alcance = −2).
2. Quem toma uma cidade distante fica sem suprimento dentro dela (cidade ocupada não abastece ninguém): a guarnição conquistadora defende com −2 (teste).
3. Fortificação capturada mantém nível/estado (conquista de cidade BREACHED entrega muralha quebrada); reparar é **1 passo por Governar** (BREACHED→DAMAGED→INTACT = 2 ativações), enquanto um Cerco abre até 2 passos numa só batalha.
4. Reação (cartas STRENGTH 1–2) é **grátis**: o canon §10 fala em "Reações 0–1 recurso"; `manageCard` não cobra nada. Vale para a rodada inteira, também nas batalhas contra Bando no mesmo ciclo.
5. Resolução sequencial por iniciativa: quem vem antes na iniciativa pode zerar a pilha que contra-atacaria (a ordem do segundo falha). A iniciativa gira a cada rodada (teste CHAR).
6. Empate tático: lado com 1 peça não perde nada, lado com 2+ perde 1; atacante de 2 peças contra defensor de 1 perde peça sem ganhar nada (canon, mas pode surpreender).

## 5. O que foi verificado e está correto

- **Autorização:** não ataca sem guerra (inclusive com Aliança ativa), não ataca peças próprias nem hex vazio, peça civil não ataca, uma peça = uma ordem (recusa em `QUEUE_ORDER`), declaração planejada na mesma rodada libera o ataque e resolve em DIPLOMACIA antes de CONFLITOS.
- **Atomicidade:** `resolveOrders` resolve cada ordem em `structuredClone` + `AlphaStateSchema.parse`; batalha e peças nunca ficam meio gravadas. Uma ordem que falha deixa o estado intacto.
- **Integridade sob volume:** 300 batalhas semeadas (composições, terrenos, fortificações, posturas, cidade/campo) → estado sempre válido, nenhum hex com dois donos, ida e volta JSON idêntica de `battles` e `units`. (Probe adicional de 400 batalhas sem anomalias.)
- **Privacidade:** a fila de ordens, a postura do defensor e a prioridade de baixas de rivais não saem do servidor (`defensePosture` só em `self`); `incomingAttacks` só para o defensor, só em CONFLITOS, só atacante+hex; a prévia devolve `posture:'UNKNOWN'` para o defensor. Todos os assentos recebem o mesmo registro de batalha.
- **Prévia × resolução:** mesmo `staticSide`/passivas; no teste Cerco+Muralha o `Sem suprimento −2` e `Brecha +2` batem; a prévia omite (por desenho) dado, postura e Cerco-ignora/brecha.
- **Pilhas, anfíbio, ameaças:** limites de pilha no avanço, penalidade −1 de desembarque, derrotado anfíbio fica a bordo, Acampamento destruído paga uma vez, peça terrestre não ataca pirata, ataque a ameaça só de hex adjacente.
- **CONFLITOS sem deadlock:** só as partes com Reação ficam não prontas; os demais já entram prontos; o timer do servidor (`expire`) dá READY por quem faltar.

## 6. Ordem sugerida de correção

1. **B-12** (cliente, 2 linhas) e **B-01** (regra de custo no ATTACK).
2. **B-02** (guerra com todos os donos do hex) e **B-10 / B-08 / B-09** (eventos).
3. **B-13** (janela de conflito para defensor humano) e **B-03b / B-06** (decisão de regra do PO).
4. **B-03, B-04, B-05, B-07, B-14, B-15** (pequenos).
5. B-04b / L-01 / B-17 quando a eliminação e a visibilidade forem tratadas.

Cada correção tem um `it.fails` que vira `it` ao ser corrigido; nenhum deles depende de semente (usam dados forçados ou composições em que o resultado independe do dado).

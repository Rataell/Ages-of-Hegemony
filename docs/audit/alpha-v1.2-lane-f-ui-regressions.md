# Alpha V1.2 — Lane F: auditoria de UI e regressões

Baseline: RC4 (`stabilize/alpha-v1.2-audit`, HEAD `7ad69c4`). Método: análise estática do código (nenhum arquivo em `packages/` ou `apps/` foi editado; os prints do playtest não estavam disponíveis; o app não foi executado). Onde a conclusão depende de comportamento em tela, está marcado **(a confirmar em tela)**. Sem redesenho de UI: todas as correções abaixo são mínimas e preservam o Modelo de Interação V2 (nuvem na mesa, Detalhes em leitura, camadas de vidro).

Legenda: **BUG** = o código faz algo diferente do que mostra/promete; **UX** = informação ausente ou enganosa sem erro de lógica; **LEGACY** = resto de modelo antigo na UI. Severidade: A (alta) / M (média) / B (baixa). Caminhos abreviados: `web/` = `apps/web/app/alpha/`, `eng/` = `packages/game-engine/src/`, `srv/` = `apps/server/src/`.

## Matriz de achados

| ID | Tipo | Sev | Resumo | Causa (arquivo:linha) |
|---|---|---|---|---|
| F-01 | BUG | A | Dicas automáticas cobrem a Virada de Era | `web/alpha.css:456` (`.alpha-tour` z 60) > `web/alpha.css:497` (`.alpha-era-turn` z 40); `web/alpha-tour.tsx:84` sem filtro de fase |
| F-02 | UX | B | Caixa da Virada pode invadir a bandeja (botão "Confirmar Virada") | `web/alpha.css:497` `max-height: calc(100vh - 150px)` a partir de `top: 92px` |
| F-03 | UX | A | Nenhuma previsão do saldo de fim de rodada antes de Confirmar | `web/alpha-board.tsx:127-136` (`planningWarnings`), `:264` |
| F-04 | BUG | M | Previsão de Alimento assume "todas as cidades Produzem" e ignora o plano | `eng/alpha-growth.ts:39-45` |
| F-05 | BUG | A | Ordem Crescer × manutenção militar diverge entre previsão e motor; texto de fome atribui a causa errada | `eng/alpha-growth.ts:44-52` vs `eng/alpha-phases.ts:249-263`; `web/alpha-details.tsx:68` |
| F-06 | BUG | A | Página "Produção" usa o modelo econômico legado, não o rendimento real da cidade | `srv/alpha-projection.ts:56` (`deriveCityProductionBreakdown`), `web/alpha-details.tsx:90`; real: `eng/alpha-city.ts:83` `cityYield` |
| F-07 | LEGACY | M | Relatório de manutenção fala em "estabilidade" e omite Ânimo e Riqueza dos navios | `web/alpha-panels.tsx:215` |
| F-08 | UX | A | Fome, falta de manutenção e descarte não aparecem no replay da rodada, nem na mesa | `eng/alpha-phases.ts:246,270,277`; `eng/alpha-resources.ts:171`; `web/alpha-board.tsx:140,203` |
| F-09 | BUG | M | Ordens de Mover/Atacar que falham são silenciosas na mesa | `eng/alpha-phases.ts:167` (só `alphaEvent`) vs `:206-207` (ação urbana emite `FAILURE`) |
| F-10 | UX | M | Pós-batalha pobre: coordenada crua, perdas só em número, id interno de peça na tela | `eng/alpha-messages.ts:65-71`; `web/alpha-combat.tsx:67,79` |
| F-11 | UX | A | Recrutar mostra só o custo em recursos, não -1 habitante nem a manutenção | `eng/alpha-urban.ts:208` (efeito de RECRUIT), `eng/alpha-city.ts:206-215` (`mobilize`), `:163` (`militaryUpkeep`) |
| F-12 | BUG | A | Governar mostra o custo de 1 nível, mas paga até a Capacidade da cidade | `eng/alpha-urban.ts:166`, `eng/alpha-city.ts:287-312` (`governCost`, `governCity`) |
| F-13 | UX | M | A 2ª ativação (−1 Ânimo) não é avisada na hora de escolher; a nuvem diz "já usou sua ativação" | `eng/alpha-urban.ts:372-374`; `web/alpha-table.tsx:263`; `web/alpha-details.tsx:69` |
| F-14 | BUG | A | Limite de ações por cidade: cliente ≠ motor (conta Pesquisa, ignora Ânimo/Sobre-extensão/Conselho) | `web/alpha-panels.tsx:32,40`; `srv/alpha-projection.ts:24`; motor `eng/alpha-urban.ts:49-62` |
| F-15 | BUG | M | Aviso "não produz nesta rodada" só dispara com 0 ações; Construir/Pesquisar também faz a cidade não produzir | `web/alpha-board.tsx:128` |
| F-16 | BUG | M | Custos planejados não se somam: 2ª/3ª ação "cabe" no plano e falha na resolução | `eng/alpha-urban.ts:87-118` (`buildBlock`), `eng/alpha-turn.ts:130-133`, `eng/alpha-phases.ts:203-208` |
| F-17 | UX | M | Fundar não mostra o efeito na Administração (carga +1, Sobre-extensão) | `web/alpha-table.tsx:291-292` (cartão `settle`), `eng/alpha-city.ts:261-277` |
| F-18 | UX | B | Texto do tour desatualizado ("uma ação por rodada") | `web/alpha-tour.tsx:23` |
| F-19 | UX | B | Resultados da última rodada de cada Era só aparecem depois da Virada; "visto" fica em `sessionStorage` | `web/alpha-board.tsx:54,56,140` |
| F-20 | UX | B | Progresso do tour/dicas por sala (`aoh-tour-<roomId>`): toda partida nova repete as dicas | `web/alpha-tour.tsx:41` |
| F-21 | LEGACY | M | Fontes de nomes antigos (Thalos etc.) ainda vivas fora do Core 10 | ver seção 7 |
| F-22 | OK | – | Persistência: ordens, ações planejadas e escolhas vivem no servidor; SSE + poll + recuperação de versão | ver seção 6 |

---

## 1. Dicas sobre a Virada de Era (F-01, F-02)

**Mecanismo.** `AlphaTour` é montado em `web/alpha-board.tsx:206` e a Virada em `:212`. A dica automática (`web/alpha-tour.tsx:80-86`) avalia `TOUR_STEPS[].when(game)` a cada mudança do jogo; nada considera `game.phase`. A nova Era abre justamente os gatilhos das dicas situacionais (`works`: Obras de Legado liberadas; `event`: evento mundial; `era`; `war`; `naval`; `contact`; `port`). Várias disparam na própria Virada.

**Camadas** (todas `position: fixed` na mesma raiz):

| Camada | z-index | Local |
|---|---|---|
| Overlay do tour/dica `.alpha-tour` (+ halo com `box-shadow: 0 0 0 9999px`) | **60** | `web/alpha.css:456-458` |
| Backdrop modal (Dicas, ambições, finale) | 50 | `web/alpha.css:236` |
| Virada de Era `.alpha-era-turn`, Resultados `.alpha-resolution-phase`, Chamada de conflito | 40 | `web/alpha.css:497`, `:103`, `:271` |
| Livro/Tabuleiro (`strategic-surface`), Cofre, bandeja | 22-30 | `web/alpha.css:312,377` |

Consequências: (a) o cartão da dica (z 60, `pointer-events: auto`) é desenhado sobre a Virada e pode cobrir os botões `RESOLVE_CHOICE`/"Trocar"; (b) o halo escurece a tela inteira, inclusive a Virada; (c) a âncora `.alpha-livro-button` fica na faixa superior e o cartão nasce logo abaixo (`web/alpha-tour.tsx:56-60`), onde a Virada começa (`top: 92px`, centrada); (d) âncora ausente (ex.: `.alpha-resolution-phase`, suprimida em `ERA_TURN`, `web/alpha-board.tsx:140`) cai no cartão centralizado em `top: 30vh` (`web/alpha-tour.tsx:53`), em cima da caixa.

**Correção mínima (F-01).** Em `AlphaTour`, receber `suspended` e não disparar dicas situacionais enquanto houver superfície bloqueante: `game.phase === 'ERA_TURN' || conflictCall || replay || game.winner`. Ao sair da superfície a dica continua pendente (`progress.done` só marca ao fechar). Opcional, defesa em profundidade: `.alpha-tour` abaixo de `.alpha-era-turn` no modo `tip` (z 35); o tour guiado (`mode='tour'`) pode manter 60.
**Teste.** vitest: extrair a decisão para função pura `dueTip(game, progress, ctx)` e afirmar `null` em `phase==='ERA_TURN'` com `works` pendente. e2e (`e2e/`, fixture `alpha-fixture.ts`): semear partida em `ERA_TURN` com Obras liberadas e dicas ativas; `expect(page.locator('.alpha-tour-card')).toHaveCount(0)` e o botão de uma escolha pendente clicável (`elementFromPoint` no centro do botão devolve o botão).

**F-02 (a confirmar em tela).** A caixa da Virada vai até `100vh - 58px` e a bandeja tem `--tray-height` ≥ 64 px; em 1280×720 com 9 passos + escolhas, a borda inferior pode tocar a bandeja onde está "Confirmar Virada". Correção: `max-height: calc(100dvh - var(--strip-height) - var(--tray-height) - 36px)` (mesma fórmula de `web/alpha.css:377` para Resultados). Teste e2e 1280×720: `boundingBox` da Virada termina acima de `.alpha-tray`.

## 2. Informação econômica no momento de confirmar (F-03 a F-07)

**O que o cliente já recebe** (`srv/alpha-projection.ts:56`): `cityDetails[].growth.civilization = {foodProduced, foodEaten, shortage, surplus}` (de `growthForecast`), por cidade `eats/growCost/willGrow/capped/ceiling`, mais `self.resources`, `storage` (limites), `administration`, `self.plannedActions`, `costs`. **O que não existe**: Riqueza de manutenção naval, descarte previsto por limite, efeito no Ânimo, custos já comprometidos pelo plano, produção condicionada ao plano.

**Onde é exibido hoje**: chip "Alimento curto" na faixa (`web/alpha-board.tsx:192`), frase única no Resumo da cidade (`web/alpha-details.tsx:68`), Cofre > Limites mostra `n / cap` (`is-full`) sem previsão. A caixa "Antes de confirmar" (`web/alpha-board.tsx:127-136,264`) lista só: cidades sem ação, ameaças a ≤ N hex, evento mundial, propostas, peças sem ordem.

- **F-03 (UX, A).** Falta a linha "Fim da rodada (previsto)". Correção mínima: ampliar `GrowthForecast` (`eng/alpha-growth.ts`) com `wealthUpkeep`, `foodStockAfter`, `wealthAfter` e `discard: Record<resource, number>` (aplicando `alphaStorageCapacity`), exportar na projeção e renderizar uma linha na caixa "Antes de confirmar" e no Cofre > Limites: `Alimento 12 +5 −7 → 10 · Riqueza 4 −2 → 2 · descarta 3 Madeira`. Teste: vitest sobre `growthForecast` com estoque acima do limite → `discard.wood === excedente`; e2e: caixa "Antes de confirmar" contém "Fim da rodada".
- **F-04 (BUG, M).** `growthForecast` soma a produção de **todas** as cidades não ocupadas (`eng/alpha-growth.ts:39-41`) e usa `progress.resources.food` sem descontar o que o plano gasta antes da manutenção (`:45`). A previsão não muda quando o jogador troca Produzir por Construir. Correção: parâmetro opcional `plan` (de `progress.plannedActions`) com `producing = cidades com PRODUCE planejado` e `stock -= custo de alimento dos planos`; manter a leitura "se todas produzirem" como segunda linha. Teste: duas cidades, uma planeja BUILD → `foodProduced` cai pela produção dela.
- **F-05 (BUG, A).** O motor faz sustento → **Crescer** (se `food >= custo`, sem olhar o exército) → manutenção militar (`eng/alpha-phases.ts:249-263`). A previsão calcula `surplus` já **descontando** o exército antes de decidir `willGrow` (`eng/alpha-growth.ts:44-52`). Resultado: a tela diz "não sobra para crescer" enquanto o motor cresce e depois falha a manutenção (`UPKEEP_SHORTAGE`: Ânimo −1 em todas as cidades). Além disso `shortage` inclui o exército, mas `web/alpha-details.tsx:68` diz "cidades sem sustento perdem um habitante e Ânimo", o que só vale para o sustento dos habitantes. Decisão de regra necessária (não é da lane F): ou o motor paga a manutenção militar **antes** de Crescer, ou a previsão segue a ordem do motor. Correção mínima de UI: separar `shortagePopulation` e `shortageMilitary` e dois textos. Teste: estado com Alimento = sustento + 3 e 3 peças; afirmar que `willGrow` previsto == crescimento real após `runMaintenance` (paridade previsão × motor, hoje divergente).
- **F-06 (BUG, A).** `Detalhes > Produção` ("Total líquido", "Estimativa por manutenção, já com o sustento", `web/alpha-details.tsx:90`) vem de `deriveCityProductionBreakdown` do núcleo legado (`eng/economy.ts:13`): produção por trabalhador, multiplicador de **estabilidade**, "materiais". O rendimento real de Produzir é `cityYield` (`eng/alpha-city.ts:83`: centro + `min(Capacidade, produtores)` hexes, pares de Artesãos/Mercadores/Eruditos, distritos, bônus de Ânimo). A mesma cidade mostra números diferentes na página Produção e no efeito de Produzir da nuvem (`eng/alpha-urban.ts:200`). Correção mínima: trocar a fonte do `production` por `productionOutput(state, actor, cityId)` e rotular "Rende ao Produzir (sem descontar sustento)". Teste vitest: `cityDetails[i].production.total` == `productionOutput(...).output` para cidade com Eruditos pares e Distrito Agrário.
- **F-07 (LEGACY, M).** `AlphaReports` (`web/alpha-panels.tsx:215`) imprime "Faltou alimento: a estabilidade caiu" e "Estabilidade X → Y" por cidade; no Alpha a Estabilidade não muda (`eng/alpha-phases.ts:212-214`) e quem cai é o Ânimo. A frase só cita Alimento: a Riqueza dos navios (`upkeepRequired.wealth`) não aparece. O ledger fecha antes da Virada (`buildRoundReports`), então Pulso/recompensas/reforma ficam fora do relatório. Correção: adicionar `moodBefore/moodAfter` a `report.cities` (domain + `buildRoundReports`), trocar o texto, incluir Riqueza e a nota "a Virada de Era altera recursos depois deste relatório". Teste: vitest em `buildRoundReports` (mood presente) + e2e: o texto "estabilidade" não aparece no relatório.

## 3. Custos sem consequências futuras (F-11, F-12, F-13, F-16, F-17)

- **F-11 Recrutar (UX, A).** `urbanCost` devolve só recursos; o efeito é "Força · Movimento · até N peça(s) por ativação". Não aparecem: −1 habitante por peça terrestre de combate (`mobilize`; repor custa 3 Alimento de Crescer), +1 Alimento de manutenção a cada 2 peças (`militaryUpkeep`), +1 Riqueza/rodada por navio, bloqueio quando a cidade chegaria a 0 habitante (`mobilizationBlock`). Correção: `UrbanOption.consequences: string[]` montado no motor (mesma fonte das regras) e mostrado no cartão `confirm` (`web/alpha-table.tsx`) e em `AlphaUrban` (`web/alpha-panels.tsx:56`). Teste vitest: `urbanOptions(...).cities[id]` para INFANTRY inclui "−1 habitante"; para Frota, "1 Riqueza por rodada".
- **F-12 Governar (BUG, A).** `urbanCost(PROMOTE_MOOD)` = `governCost` = 1 Cultura **ou** 2 Riqueza (um nível). `governCity` repete o pagamento até `operatingCapacity` níveis ou Ânimo 6, trocando de Cultura para Riqueza quando a Cultura acaba. O cartão "Custo: 1 Cultura" subestima (até Capacidade×custo) e o jogador não escolhe quantos níveis. Correção mínima: calcular no motor o custo total real (`levels = min(reach, 6 − mood)`, simulando `governCost` a cada nível) e exibir "até N níveis · custo total X"; opcional `levels` no comando. Teste: cidade Capacidade 3, Ânimo 2, Cultura 1, Riqueza 6 → custo exibido == recursos debitados.
- **F-13 2ª ativação (UX, M).** Regra: a 2ª ativação da cidade na rodada custa 1 Ânimo na resolução (`eng/alpha-urban.ts:372-374`). A UI só diz isso numa linha fixa dos Detalhes (`web/alpha-details.tsx:69`) e nada no momento de escolher. A nuvem ainda afirma "Planejado: X. A cidade já usou sua ativação." (`web/alpha-table.tsx:263`), embora uma cidade Estável/Próspera aceite a segunda. Correção: quando já há 1 ação (sem Pesquisa) e a cidade permite 2, acrescentar ao cartão de confirmação "2ª ativação desta cidade: −1 Ânimo (X → X−1)" e trocar a frase da nuvem por "Ativações: 1 de 2 usadas". Teste e2e: planejar Produzir e abrir Construir na mesma cidade → o cartão mostra o aviso.
- **F-16 Custos não cumulativos (BUG, M).** `buildBlock`/`governBlock`/`elevateBlock` validam `alphaCanAfford` contra o estoque atual, e `eng/alpha-turn.ts:130-133` enfileira sem reservar. Dois planos de 10 Madeira com 12 Madeira passam no plano e o segundo falha na resolução (`ACTION_FAILED`, a Ordem é perdida). `recruitCountBlock` já resolve o caso de Recrutar simulando os planos anteriores num `structuredClone` (`eng/alpha-urban.ts:72-76`). Correção: o mesmo padrão para qualquer ação no PLANNING (simular os planos já feitos, na ordem de resolução); cobre também "mesmo distrito duas vezes" e vagas de distrito. Teste vitest: dois BUILD_DISTRICT com recursos para um → o segundo planejamento retorna "Recursos insuficientes".
- **F-17 Fundar (UX, M).** O cartão de fundação mostra `costChips(game.costs.founding)` e o bloqueio; não mostra que a Administração sobe 1 (ocupada: 2) e que passar da capacidade causa Sobre-extensão (Ânimo −1 por rodada na cidade mais abalada, `eng/alpha-phases.ts:272-277`). Correção: linha "Administração 3/4 → 4/4 (ou Sobre-extensão)" a partir de `game.administration`. Teste e2e: com carga = capacidade, o cartão de Fundar mostra "Sobre-extensão".

## 4. Limites exibidos × aplicados; ações restantes por cidade (F-14, F-15)

**Regra do motor** (`cityGate`, `eng/alpha-urban.ts:37-65`): `planned` conta ações urbanas da cidade **exceto RESEARCH**; `allowed = min(cityActions=2, activationsAllowed(meta), overextended ? 1 : 2)` onde `activationsAllowed` = 1 se Abalada ou Revolta, 2 se Estável/Próspera (`eng/alpha-city.ts:68`); Conselho limita a uma 2ª ativação na civilização inteira; na fase `URBAN_ACTIONS` vale `urbanActionsUsed`. A mesma função alimenta `urbanBlock`, portanto `option.blocked` (em `game.urban`) já traz a razão correta.

**O cliente** (`cityActionGate`, `web/alpha-panels.tsx:24-34`) repete uma versão errada: `state.plannedUrbanActions >= game.rules.balance.cityActions`, onde `plannedUrbanActions` (`srv/alpha-projection.ts:24`) conta **todas** as `URBAN_ACTION`, inclusive RESEARCH. E `reasonOf = cityActionGate(...) ?? o.blocked` (`web/alpha-table.tsx:202`) deixa o falso positivo vencer.

- **F-14 (BUG, A).**
  1. Cidade com Pesquisa planejada (a cidade só "carrega" a Pesquisa) + uma ação real: o cliente conta 2 e bloqueia ("Esta cidade já possui sua ação planejada") enquanto o motor permitiria a 2ª ativação. Falso bloqueio.
  2. "Ações planejáveis da cidade: N / 2" (`web/alpha-panels.tsx:40,58`) ignora Ânimo Abalado (teto 1), Sobre-extensão (1), Conselho, e conta Pesquisa. Mostra 2/2 numa cidade Abalada; o botão só é barrado por `o.blocked`, o contador mente.
  3. Os Detalhes mostram "Ativações: 2" (`web/alpha-details.tsx:62`) que é `activationsAllowed`, o teto, não as restantes. A nuvem (`web/alpha-table.tsx`) não mostra restantes em lugar nenhum: o dado "ações restantes por cidade" só existe na aba Ações dos Detalhes e errado.
  4. Comentário de `activationsAllowed` diz "none in Revolta" mas o código devolve 1 (`eng/alpha-city.ts:67-68`); o `cityGate` bloqueia o resto com a mensagem de Revolta. Só documentação.
  Correção mínima: exportar do motor `cityActivationsLeft(state, actor, cityId)` (mesmo cálculo do `cityGate`, sem Pesquisa) e projetá-lo em `cityStates[].activations = {allowed, used, planned, left}`; o cliente apaga a lógica própria de `cityActionGate` (mantém fase/pronto/ocupada) e usa `left`. Mostrar "Ativações 1/2" no subtítulo da nuvem da cidade. Testes: vitest de paridade `cityActivationsLeft` × `urbanBlock` em 4 casos (Estável, Abalada, Sobre-extensão, só Pesquisa planejada); e2e: planejar Pesquisa na cidade A e depois Construir na mesma cidade → botão habilitado.
- **F-15 (BUG, M).** `planningWarnings` (`web/alpha-board.tsx:128`) só avisa quando `plannedUrbanActions === 0`. Com Construir, Recrutar ou só Pesquisa planejados a cidade também não produz (Produzir é a ação), e nada avisa; o tour reforça "sem Produzir, ela não produz" (`web/alpha-tour.tsx:23`). Correção: avisar quando não há `PRODUCE` planejado e a cidade tem produtores; texto "X não produzirá (a ação planejada é Construir)". Teste: cidade só com Construir → aviso presente.

## 5. Feedback de combate e de manutenção (F-08, F-09, F-10)

- **F-08 (UX, A).** `FOOD_SHORTAGE`, `UPKEEP_SHORTAGE`, `STORAGE_DISCARD`, `POPULATION_GROWN`, `ADMINISTRATIVE_OVEREXTENSION` são emitidos só com `alphaEvent` (log `state.events`). O replay "Resultados autorizados" (`web/alpha-board.tsx:203`), a "Última resolução" da bandeja (`:269`) e os halos usam `resolutionEvents`, onde a manutenção entra apenas como "Manutenção da rodada N concluída" (`eng/alpha-phases.ts:297`). O jogador vê fome só como (a) som (`web/audio/audio-diff.ts:47`), (b) Livro > Crônicas > Acontecimentos, lista de 60 itens misturados a ruído ("Decisão de gestão aplicada.", `web/alpha-panels.tsx:217`), (c) relatório de Manutenção. `UPKEEP_SHORTAGE` não diz qual recurso nem quanto faltou; `STORAGE_DISCARD` apareceu 53 vezes numa partida (economia parte 1) sem aviso visual. Correção mínima: emitir também `resolutionEvent` (`visibleTo:[owner]`, `cityId` quando por cidade) nesses pontos e enriquecer o texto ("Faltaram 2 Alimento para as peças; Ânimo −1 em todas as cidades"). Teste: vitest em `maintainCivilizations` com fome → `state.resolutionEvents` contém mensagem do jogador; e2e: após uma rodada com descarte, o painel de Resultados lista "descartado".
- **F-09 (BUG, M).** Quando um Mover/Atacar/Explorar planejado falha na resolução, o `catch` só chama `alphaEvent(..., 'ORDER_FAILED', ...)` (`eng/alpha-phases.ts:167`). A falha de ação urbana, ao contrário, também emite `resolutionEvent({type:'FAILURE'})` (`:206-207`). Um ataque que não ocorreu (alvo se moveu, regra mudou) some do replay e do halo. Correção: espelhar o `resolutionEvent` `FAILURE` com `hexId`/`unitIds` da ordem. Teste: ordem MOVE inválida na resolução → `resolutionEvents` contém `FAILURE` para o dono.
- **F-10 (UX, M).** `battleMessage` usa `battle.hexId` cru ("em 7,6"); `lossesMessage` lista nomes e some quando não há perdas; `BattleReport` mostra "Peças perdidas: N" só como número (`web/alpha-combat.tsx:79`) e as notas de dado imprimem `roll.unitId` (id interno, `:67`). Sem menção a Ânimo, suprimento ou fortificação no texto do replay, nem lista de quais peças cada lado perdeu. Correção: trocar hex por nome da cidade/Região (ou "hex 7,6"), agregar por tipo ("Infantaria ×2"), exibir nome da peça no lugar do id e listar perdas por dono. Teste vitest em `battleMessage/lossesMessage` e e2e: `BattleReport` sem texto que case `/unit-|recruit-/`.

## 6. Persistência e previews obsoletas (F-19, F-20; F-22 = ok)

Verificado, sem achado:
- Ordens (`self.orders`) e ações planejadas (`self.plannedActions`) são estado do servidor e voltam na projeção após recarregar; a bandeja "Ordens planejadas" e os `planMarks` vêm delas (`web/alpha-board.tsx:117-125`).
- O cliente lê a projeção autoritativa por SSE (`web/alpha-shell.tsx:91-105`), com poll de 2,5 s, `pull('open')` ao reconectar e `sendWithRecovery` (`web/send-command.ts`) que refaz o comando só em `VERSION_CONFLICT`, com a versão nova. Prévias (`orderPreviews`, `urban.*.blocked`, `cost`) são calculadas pelo servidor a cada versão; o cartão `confirm` relê a opção viva por chave (`optionKey`), então não há custo obsoleto na tela; o servidor revalida no comando.
- Estado só de cliente (passos da nuvem, opção escolhida, quantidade, aba, cidade selecionada) é descartado ao recarregar: esperado.

Achados menores:
- **F-19 (UX, B).** "Resultados já vistos" fica em `sessionStorage` por sala (`web/alpha-board.tsx:54,56`): nova aba/dispositivo reabre o último replay. O replay é suprimido em `ERA_TURN` (`:140`), então o da última rodada de cada Era só aparece depois da Virada, já fora de contexto (e, pelo F-01, junto das dicas). Correção: mostrar o replay antes da Virada (colapsado) ou resumir no passo 1 da Virada.
- **F-20 (UX, B).** `aoh-tour-<roomId>` (`web/alpha-tour.tsx:41`) é por sala: cada partida nova repete tour e dicas automáticas; a opção global `aoh-tour-off` só vem por URL. Correção: chavear `done`/`tourDone` por navegador (`aoh-tour-v1`) e deixar `tipsOff` global. Teste e2e: duas salas seguidas, a segunda sem dica já vista.

## 7. Nomes antigos de civilização (F-21, para a lane E)

Caminhos que **leem o nome vivo do conteúdo** (Core 10), seguros: `civilizationDisplayName(chassis)` → `core10OfChassis(...).name` (`packages/game-domain/src/alpha-core10.ts:1254-1256`, fallback "Civilização"), usado em `web/alpha-board.tsx:189,191,216`, `web/alpha-hand.tsx:37`, `web/alpha-roster.tsx:32,201`, `web/alpha-panels.tsx:164`, `web/alpha-table.tsx:413`, `web/alpha-civ-board.tsx:137`; presença cultural usa `core10OfChassis(id)?.name ?? 'Povo local'` (`web/alpha-board.tsx:236`). O chassi técnico (`thalos`, `valgard`…) é id interno; o texto "Nórdicos" vem do Core 10.

Caminhos que **leem dado antigo ou armazenado** e podem mostrar nome legado:
1. `CIVILIZATIONS` em `packages/game-domain/src/alpha-institutions.ts:6-18` (12 civilizações do modelo antigo, inclui `veyra` e `elyra`, rótulos como "Incas (Tawantinsuyu)", "Israel e Judá"). Usos: nome da **capital** gravado no estado ao criar a partida (`eng/alpha-world.ts:58`: "Cusco", "Atenas", "Hedeby"…), `civilizationKit(...).name/identity/capital` (`packages/game-domain/src/alpha-civilization-kits.ts:61-62`), passivas (`eng/alpha-institutions.ts:11,24,133`) e validação (`packages/game-domain/src/alpha.ts:276`, `srv/alpha-room.ts:28`). Nomes de cidade já gravados em partidas salvas não mudam com o conteúdo.
2. `srv/local-maps.ts:10` (`names = ['Aurélia','Valgard','Merídia','Thalos','Saren','Kor']`): nomes de jogador **e** de capital do cenário local (`/play`, `srv/local-play.ts`). É o único "Thalos" literal em código de produção fora do id técnico, e vive em qualquer estado derivado desse cenário.
3. Conteúdo antigo por chassi: `packages/game-domain/src/alpha-web.ts:132` (`heritage('thalos', …)`), `alpha-leaders.ts:55`, `alpha-civilization-kits.ts:91,96` (cartas "Thing da Costa" etc.).
4. `LegacyRoom` (`web/alpha-roster.tsx:195-201`) cobre sala v1.1 com "Civilização da versão 1.1" quando o chassi não é Core 10 (correto).
5. `web/table-art.ts:91` mapeia chassi → cultura de arte (id técnico, não exibido).
Sugestão (decidir com a lane E): fonte única do nome de capital no Core 10, e `CIVILIZATIONS` só como tabela técnica (id, cor, passivas). Teste vitest de contrato: para todo `chassis` do Core 10, `civilizationKit(id).name === core10OfChassis(id).name`, e nenhuma string de UI em `apps/web/app` casa `/\bThalos\b/`.

---

## Ordem sugerida de correção

1. F-01 (dicas × Virada) e F-14 (limite de ativações): regressões visíveis, correção local, sem regra.
2. F-06 (Produção legada), F-12 (custo do Governar), F-08/F-09 (eventos de manutenção/falha na resolução): cada uma é uma linha de projeção ou de `resolutionEvent`.
3. F-03/F-04/F-05 (previsão de fim de rodada): precisa da decisão de regra do F-05 antes.
4. F-11/F-13/F-16/F-17 (consequências no cartão de confirmação): um campo `consequences` em `UrbanOption` serve aos quatro.
5. F-07, F-10, F-15, F-18 a F-21: textos e limpeza de legado.

Nenhum número de balanço foi alterado ou proposto aqui; F-05 e F-12 expõem decisões de regra (ordem Crescer/manutenção; Governar por nível escolhido) que ficam para o PO.

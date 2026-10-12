# Diretriz de UX de Tabuleiro Digital — auditoria e proposta (v1)

Base: playtest humano da RC5 (branch `rc5/alpha-v1.2`, HEAD `d9a7af4`), manual de referência de jogo de tabuleiro físico (só princípios de apresentação; nenhum nome, ícone ou arte copiado) e leitura do código. **Nada foi implementado, nada foi rodado em massa, nenhum save foi tocado.**

Limite da evidência: o relato escrito do playtest RC5 não está no repositório (`docs/playtest` só tem o roteiro; `docs/evidence/rc12` é só captura de tela). Os veredictos abaixo vêm de leitura de código e de dois repros pequenos (já apagados). Onde o relato não bate com o código, está dito.

---

## 1. Bugs confirmados (ordem de ataque)

Legenda: **C** confirmado · **NR** não reproduzido · **P** gap de produto (não é bug de motor).

### Integridade de regra (Fase 0)

| ID | Item | Veredito | Causa (arquivo:linha) | Correção mínima |
|---|---|---|---|---|
| UXB-01 | Pioneiro some na revelação | **C** (perda silenciosa) · ligação com água/rotação **NR** | `alpha-discoveries.ts:64-69` caso `DANGER`: sem Método Experimental, 50% de chance de remover a peça que explora (regra: `rules-v5-proposal.md:499`). A mensagem `alpha-messages.ts:57-60` diz "entrou… Região revelada" mesmo com a peça removida; nenhum evento `LOSSES` (compare `alpha-naval.ts:117`); `alpha-discovery.tsx:53-62` só mostra o texto genérico. Revelação nunca rotaciona sob peça (`regionOrientationFixed`), então água é provável coincidência. Repro: contador RNG 1–4 remove, 0 e 5 não. | Emitir `LOSSES` com `hexId`/`unitIds`; mensagem reflete o resultado; painel de Região mostra "perdeu / escapou"; prévia "Perigo possível: 50%" no Mover para Região fechada. A regra não muda. |
| UXB-02 | Governar | **C** (4 defeitos) | (a) Cartão mostra custo de **1 nível**, motor cobra até `operatingCapacity` níveis (`alpha-city.ts:314,355-381`; F-12 aberto). (b) Texto usa `activationCapacity` (0 em Revolta): "até 0 níveis" quando o motor aplica +2 (`alpha-urban.ts:253`, `alpha-projection.ts:24`, `alpha-details.tsx:69`) — **bug novo**. (c) Custos não são reservados no plano: um Construir anterior drena a Cultura e o Governar falha com `ACTION_FAILED`, perdendo a Ordem (`alpha-turn.ts:130-133`, `alpha-phases.ts:179-205`; F-16). (d) Ânimo 6 + fortificação danificada sem Pedra passa no `governBlock` e vira no-op que gasta a ativação (`alpha-city.ts:321`). Sem cobrança dupla. Governar fica escondido em "Mais ações" quando Elevar está aberto (`alpha-table.tsx:263`). Penalidades da manutenção (assalto −1, fome −1, manutenção −1, sobre-extensão −1) comem o ganho sem aviso. | Função única `governReach()` usada por motor, texto e projeção; custo e ganho totais na prévia; `urbanBlock` simula planos anteriores (padrão já existe em `recruitCountBlock`); bloquear o no-op; Governar fica na raiz com Ânimo ≤ 3. |
| UXB-03 | Previsão de fome otimista | **C** | `alpha-growth.ts:36-52`: assume que toda cidade produz e ignora o gasto dos planos; ordem difere da do motor. Quem troca Produzir por Governar/Construir não vê a fome chegar. | Previsão lê os planos na ordem de resolução (parte do `previewAction`). |
| UXB-04 | Recrutar quantidade > 1 | **C** | Cartão mostra custo e bloqueio de **1 peça** (`alpha-table.tsx:203`); motor valida a contagem (`alpha-urban.ts:92`). | Custo × qtd + bloqueio por contagem no preview. |
| UXB-05 | Atacar sem prévia | **C** | Na nuvem, o clique no alvo reserva direto (`alpha-table.tsx:190,365`). `combatPreview` (`alpha-combat.ts:74`) só roda para ordem já reservada (`alpha-projection.ts:47`). | Prévia antes da reserva, respeitando informação oculta. |

### Movimento e cartas

| ID | Item | Veredito | Evidência | Ação |
|---|---|---|---|---|
| UXB-06 | Mover várias peças a destinos diferentes com **uma** Ordem | **P** — o motor segue o canon, não há bug | Canon `rules-v5-proposal.md:32`: Expedição = "uma pilha ou peça". `MOVE = {unitIds, path}` (`alpha.ts:107`): um caminho por Ordem; cada peça entra em **uma** Ordem por rodada. Destinos diferentes = Ordens diferentes. | **Decisão D1.** O motor aceita subconjunto de peças, mas a UI não deixa dividir a pilha (`alpha-table.tsx:83-95,282`): tudo-ou-nada. |
| UXB-07 | `reachable()` diverge do validador | **C** (baixa) | Não exclui hexes com Ameaça nem `pendingArrivals` (`alpha-unit-options.ts:70-90`), que o servidor recusa (`alpha-military.ts:79`, `alpha-turn.ts:152`). A UI destaca um destino e a confirmação falha. Mensagens de recusa juntam 4 causas (`alpha-military.ts:83-84`). | Corrigir `reachable()`; motivos separados. |
| UXB-08 | Cartas de movimento +2 | **NR** no motor | `strategy-22` e `strategy-24` dão +2 (`game-domain/alpha-cards.ts:12`), aplicado em `institutionBonus` nos 3 pontos de alcance, vale a rodada inteira, todas as peças, todas as Ordens MOVE. Repro: Pioneiro 3 → 5. O cliente não recalcula (lê `unitOptions`). | UX: selo "+N mov." ignora bônus permanente/tecnologia (`alpha-board.tsx:147-161`); texto da carta não diz que são pontos de custo de terreno (planície 1, floresta/colina 2, montanha 3) nem que vale para todas as peças. Sem teto de soma (até +4 ou mais) — **D5**. Se o jogador viu o bônus "não funcionar": o motor recusa jogar a carta fora de PLANNING ou além de 2/rodada, com a mensagem de 3 causas (`alpha-cards.ts:55`). |

### Mesa física

| ID | Item | Veredito | Evidência | Ação |
|---|---|---|---|---|
| UXB-09 | Saqueadores "excessivos" | **NR** como violação de regra | Máximo 1 ação por Bando por rodada (`alpha-threats.ts:211-220`); cap de Acampamentos = jogadores+2 (igual ao canon); R1 já reduz assaltos (42/52/88 → 12,5/11,3/20,5 por partida em bots). A percepção tem causas reais: **S1** cada Bando escolhe sozinho o alvo mais próximo, então em 2 jogadores até 4 assaltos/rodada na mesma cidade (−4 Ânimo), tudo legal (F-T2 propôs limite, nunca aplicado); **S2** assalto a peça no campo não aciona recuo (`alpha-threats.ts:~287`); **S3** pirata pilha o porto a cada ativação sem fim; **S4/S5** recuo ilegível (mesmo "X", sem rumo, sem evento no mapa). | **Decisão D3** para S1–S3 (muda regra). S4/S5 são só interface. |
| UXB-10 | Sem miniaturas / Acampamento como "X" | **C** | Ameaça = crachá 38×20 com glifo de traço fino (`hex-map.tsx:529`; tenda = Acampamento, "X" = Bando, vela = Pirata). `pieceArt` com 9 silhuetas já existe (`table-art.ts:730`) e `threat.composition` chega ao cliente, mas não é desenhada. Peças dos jogadores: **uma** figura por dono por hex (a mais numerosa) + contador (`hex-map.tsx:~551`). Pilha ≠ entidades. `unit.id` é estável. | Reusar `pieceArt` na cor de ameaça; cluster com contador; arte de tenda do Acampamento; glifo próprio para recuo. |
| UXB-11 | Movimento difícil de acompanhar | **C** | Só existe `piece-arrive` (pop de 520 ms) no destino (`alpha.css:669`, `hex-map.tsx:206-219`): teleporte com flash. Ameaças nem entram no diff. Sem origem→destino. Animação **não** está desacoplada do estado (deriva do diff, ids estáveis). | Guardar posição anterior por id; seta/fantasma ~1 s; incluir ameaças; `resolutionEvent` com `hexId` em marcha/recuo. |
| UXB-12 | Ânimo só em texto | **C** | `Ânimo N/6` em Detalhes (`alpha-details.tsx:60`) e subtítulo da nuvem; `cityMarks` nem traz `mood` (`alpha-projection.ts:33`); selo do hex mostra só `pop · nível` (`hex-map.tsx:~480`). Faixas do motor: 0–1 Revolta · 2–3 Abalada · 4 Estável · 5–6 Próspera. | Selo de Ânimo no hex (4 estados, forma + cor + número), previsão de Ânimo na prévia. |
| UXB-13 | Economia vs Ordens | **C** parcial | Ativações da cidade (`cityActivations`) e Ordens globais (`game.actions`) vivem em lugares distintos; `cityGate` exige as duas (`alpha-urban.ts:78-79`). Nota da nuvem "A cidade já usou sua ativação" é falsa para cidade com 2 ativações (`alpha-table.tsx:267`; F-13). Aba Produção usa estimativa legada (F-06). | Duas linhas rotuladas: "Ordens da civilização N" e "Ativações desta cidade M". |

### Outros gaps do contrato (achados da matriz)

- Produzir: `productionOutput` omite `kitProduceBonus` e o efeito da Próspera na 1ª ativação; prévia ≠ aplicado.
- Comércio: texto omite kit, zero de Oligarquia/Abalada e renda do destinatário.
- Fundar: `costs.founding` sem desconto da Confederação (`alpha-projection.ts:50` vs `alpha-cities.ts:15`).
- Reivindicar: executa em 1 clique sem mostrar custo; erros do core em **inglês** (`territory-commands.ts`: "Cannot afford configured cost").
- Hegemonia: botão desabilitado sem texto (`alpha-panels.tsx:77`). Cartas/Conselheiro: bloqueio com 2–3 causas numa string.
- Resultado: ações imediatas não têm toast; planejadas usam `urbanActionMessage`, mais pobre que a mensagem interna de `performUrbanAction`. Em lugar nenhum existe diff previsto × aplicado.

### Cálculos duplicados no cliente (12)

Mão/Figura espelham `alpha-cards.ts`/`alpha-leaders.ts` (`alpha-hand.tsx:41-58`); `structuralBlock` ≈ `researchBlock` (`alpha-civ-board.tsx:20`); filtro de pesquisa **lendo o texto** do bloqueio (`alpha-panels.tsx:43`); `MONARCHY=2` e "−2 Prestígio" hardcoded (`alpha-panels.tsx:58,170,175`); distância/alvos a 1 hex e `hostileTo` (`alpha-table.tsx:46,152-165`); `stackViewVerdict` sem `pendingArrivals` (:181); `home` de Desmobilizar (:312); escolta (:118-132,282); lista de melhorias/Estrada e `workable` (:343, `alpha-board.tsx:163`); `population >= minPopulation` e texto da 2ª ativação (`alpha-details.tsx:69,72`); avisos de planejamento (`alpha-board.tsx:129`); tradução de erros por código (`presentation.ts:21`).

---

## 2. Matriz das ações existentes

Classes: **PLN** = planejada, resolve ao confirmar a fase (só `URBAN_ACTION`, `PROPOSE_TREATY`, `DECLARE_WAR`, e `QUEUE_ORDER` que fica em `player.orders`); **IMD** = imediata, paga e aplica no clique. Planejar **não reserva** recursos (`alpha-diplomacy.ts:34`). Bloqueio: **E** = estruturado/concreto, **S** = string genérica, **—** = só descobre depois do erro. Prévia hoje: **T** texto fixo · **H** hexes iluminados · **R** só após reserva · **0** nenhuma.

| # | Ação (comando) | Classe | Consome | Bloqueio hoje | Prévia hoje | Lacuna principal |
|---|---|---|---|---|---|---|
| 1 | Produzir (`URBAN_ACTION PRODUCE`) | PLN | 1 Ordem cidade, 1 ativação, 2ª ativação −1 Ânimo | E (`cityGate`) | T | omite bônus de kit/Próspera e o Ânimo da 2ª ativação |
| 2 | Construir | PLN | recursos (Riqueza substitui 50–60%) | S ×5 ("Recursos insuficientes"), avanço sem nome | chips de custo bruto | substituição por Riqueza oculta; não diz qual recurso falta |
| 3 | Elevar | PLN | recursos, pop, Era, avanço | E; avanço por ids crus | lista ✓/✗ com nomes no Detalhes | texto de bloqueio ≠ lista da mesma tela |
| 4 | Recrutar (1–6) | PLN | recursos + manutenção futura | E (avanço nomeado) / S (recursos, reserva, Era) | chips de 1 peça | qtd>1 (UXB-04); upkeep futuro não aparece |
| 5 | Pesquisar | PLN | recursos; Ordem AVANÇO (sem ativação) | S (pré-req sem nome, Era sem número) | Teia | duplicação no cliente |
| 6 | Governar (`PROMOTE_MOOD`) | PLN | Cultura 1 / 2 Riqueza **por nível** + 1 Pedra de reparo | E | T ("até N níveis") | UXB-02 |
| 7 | Recuperação emergencial | PLN | 0 → Ânimo 4, 1×/episódio | E | T | resultado genérico |
| 8 | Sustentar rota (`SUPPORT_TRADE`) | PLN | — | E | T | omite kit/Oligarquia/receptor |
| 9 | Mover capital | PLN | 1 Ordem (Monarquia 2) | E | T | Monarquia hardcoded |
| 10 | Ação cívica | PLN | integração | E | T | ok |
| 11 | Crescer | automático | 3 Alimento (2 com Celeiro) | — | `growthForecast` | otimista (UXB-03) |
| 12 | Mover / Explorar (`QUEUE_ORDER MOVE`) | PLN | 1 Ordem Expedição | S (4 causas) | H | UXB-07; sem custo de terreno nem aviso de Perigo |
| 13 | Atacar (`QUEUE_ORDER ATTACK`) | PLN | 1 Ordem Expedição | E | R | UXB-05 |
| 14 | Missão de influência | PLN | 1 Ordem Influência | E | H | — |
| 15 | Rota comercial | PLN | 1 Ordem Influência | — (só no clique) | 0 | sem pré-checagem |
| 16 | Fundar (`SETTLE`) | IMD | Ordem + custo | E (dry-run `settleBlock`) | cartão | desconto Confederação |
| 17 | Embarcar/Desembarcar/Desmobilizar | IMD | Ordem Expedição | — (nó some) | lista | sem motivo quando vazio |
| 18 | Reivindicar / Melhorar / Estrada / Trabalhar | IMD | recursos; Ordem cidade | — / erro em inglês | Melhorar e Estrada: cartão; Reivindicar: 0 | Reivindicar sem custo visível |
| 19 | Papéis (`ASSIGN_POPULATION`) | IMD livre | 1×/rodada/cidade | — | soma no cliente | só descobre após erro |
| 20 | Povos independentes | IMD | custo por ação | E (dry-run) | `effect`+`cost` | **melhor exemplo existente** |
| 21 | Disputar presença cultural | IMD | 1 Ordem Influência | — | texto fixo | resultado só em `cultureContests` |
| 22 | Tratado / Guerra | PLN | 1 Ordem Influência; guerra −2 Prestígio (+Influência na República) | `diplomacyBlock` existe, **não exposto** | confirmação de texto | República omitida |
| 23 | Troca de recursos | IMD | no aceite | `tradeBlock` não exposto | formulário | erro vira banner |
| 24 | Cartas (`PLAY_CARD`) | IMD livre | máx. 2/rodada; Reação 1/rodada | S (3 causas) | mão recalcula | UXB-08 |
| 25 | Conselheiro | IMD | custo | S (2 causas) | botão mudo | — |
| 26 | Poder da Figura | IMD livre | 1×/Era | E (`leaderBlock`) | mão + Livro (strings repetidas) | efeito não aparece no resultado |
| 27 | Escolhas (ambições, mundo) | IMD livre | — | S | pergaminhos | genérico |
| 28 | Obra de Legado | IMD | passo (Ordem Legado) | E (`legacyWorkView`) | por cidade: `blocker`+`nextStepCost` | **melhor padrão** |
| 29 | Hegemonia | IMD | Ordem Legado | botão mudo | progresso por requisito | sem texto de bloqueio |
| 30 | Reforma de governo | PLN (reserva) | pago na Virada | E (`governmentOptions`) | sem recálculo no cliente | reserva não retém Influência |
| 31 | Postura / prioridade de baixas | IMD livre | — | E | seletores | — |
| 32 | Pronto / Cancelar | — | — | ambições | "Antes de confirmar" | cancelar não devolve nada |

Não existe `previewAction`. Peças reaproveitáveis: `urbanOptions`, `urbanBlock/urbanCost`, `alphaUnitOptions`, `alphaClaimOptions`, `combatPreview`, `independentBlock`, `settleBlock`, `legacyWorkView`, `governmentOptions`, `growthForecast`.

---

## 3. Proposta visual única — Ficha de Ação

**Uma** ficha, com a mesma gramática para toda ação, ancorada ao hex dentro da nuvem existente (nível "Confirmar": `CloudLevel.card`, `.ctx-card/.ctx-cost/.ctx-go`). Zero mudança de layout global; vale em desktop e celular (a nuvem já se ajusta a ≤ 760 px).

Mockup navegável: `docs/product/ux-board-directive-v1-mockup.html`.

```
┌─ GOVERNAR · Valdrim (Povoado, Abalada) ────────[ Ordem 2/5 · Ativação 1/2 ]┐
│ ELEGIBILIDADE  ✓ pode agir                                                  │
│   (ou)  ✗ Falta 1 Cultura (tem 0) · Riqueza 2 cobriria · [ver Cultura]      │
│ CUSTO   Cultura 2 ▸ 3→1   ·  Pedra 1 ▸ 4→3   ·  Ordem Cidade  ·  Ativação   │
│ PREVISTO (tracejado)                                                        │
│   Ânimo 2 → 4  (Abalada → Estável)    +2 níveis, Capacidade 2               │
│   Depois, na manutenção: assalto de Bando possível (−1) · fome não prevista │
│   Produz como Capacidade 2 (hoje 1)                                         │
│ [ Cancelar ]                                         [ Confirmar Governar ] │
└─────────────────────────────────────────────────────────────────────────────┘
        depois de resolver, a MESMA ficha vira RESULTADO (borda sólida):
        APLICADO  Ânimo 2 → 4 ✓ igual ao previsto   |   Cultura −2 ✓
        ou  Δ diferente: "Pedra −0 (reparo não necessário)"
```

Seis faixas fixas, sempre na mesma ordem: **Estado atual · Elegibilidade · Custo · Previsto · Confirmar · Aplicado**.

Regras de apresentação:
1. **Bloqueio é sempre causa concreta + como destravar**: "Falta 1 Cultura (tem 0)", "Exige o avanço Cartografia", "Hex fora de alcance: 5 de 3 pontos", "Cidade sem ativação (2/2 usadas)", "Terreno: Montanha custa 3". Cada causa é uma linha própria, ligada à peça/hex; nunca uma string com 4 causas.
2. **Custo em chips com saldo** (`ResourceDisplay`, mesmas cores dos 8 recursos): `tem → fica`. Ordem (tipo e quantas restam), ativação (x/y), Ânimo, manutenção futura. Substituição por Riqueza aparece como linha própria.
3. **Previsto tracejado, Aplicado sólido.** Itens incertos (combate, Perigo) mostram faixa ou probabilidade e nunca revelam informação oculta.
4. **Diff previsto × aplicado** no resultado: "✓ igual" ou "Δ" com o motivo, e **perdas explícitas** (a peça perdida em Perigo vira linha vermelha na ficha e halo no mapa).
5. **No mapa**: hexes legais acesos (já existe `targets`) com custo de terreno por hex; selo "+N mov." soma todas as fontes; Perigo possível marcado no hex fechado.
6. **Mover (multi-peça)**: seleção de subconjunto da pilha (contador por tipo) antes do destino; a ficha lista "Estas N peças · Ordem Expedição 1 · custo de terreno X/Y".

### Contrato de motor (nenhum cálculo novo no cliente)

Novo `packages/game-engine/src/alpha-preview.ts`:

```ts
previewAction(state, actor, command) → {
  eligible: boolean,
  blockers: { code, message, missing?: {resource|advance|era|hex, have, need}, unlock?: Ref }[],
  cost: { resources, order: OrderType|null, activation: boolean, mood: number },
  effects: { kind, target, before, after, certainty: 'EXACT'|'RANGE'|'HIDDEN' }[],
  upkeepAfter?, warnings[], resolvesAt: 'NOW'|'RESOLUTION'
}
```

- Elegibilidade orquestra `LEGAL_COMMANDS` + limite de Ordens + o `*Block` de cada comando; os `*Block` passam a devolver `{code,message,missing}` preservando `message` (compatível).
- Efeito por dry-run em `structuredClone(state)` (padrão já usado em `independentBlock`/`settleBlock`/`recruitCountBlock`), simulando os planos anteriores na ordem de resolução — resolve UXB-02c e UXB-03 de uma vez.
- Servidor: operação `preview` no envelope `alpha-http.ts:12-19`, somente leitura (sem salvar, sem versão).
- Resultado: o motor devolve em `resolutionEvent` o efeito **aplicado** (campo opcional `applied`), para o diff.
- **Compatibilidade RC5**: tudo aditivo (campos opcionais, operação nova de leitura); nenhum esquema de snapshot muda; saves RC5 carregam sem migração.

### HUD permanente

- **Barra inferior (Cofre + Ordens)**: os oito recursos já estão fixos (RC5). Acrescentar duas linhas rotuladas distintas, "Ordens da civilização" e "Ativações da cidade selecionada", e o delta líquido previsto da rodada por recurso (setinha), sem terceira linha no celular (a bandeja já está no teto de 118 px).
- **Barra superior**: selo da civilização + **retrato pequeno do Líder** (`figure-portraits.ts`) com popover de Passiva e Poder 1×/Era (hoje só na mão); Era/rodada/fase como estão.
- **Cluster único de alertas**: hoje há 1 chip (Sobre-extensão/Alimento curto). Passa a mostrar contadores — fome (N cidades), manutenção insuficiente, Revolta, pendências do plano (`planningWarnings`, hoje só ao clicar Confirmar) — cada um abre popover leve com a lista de cidades e atalho para a cidade. Não cria painel novo.
- **Celular**: nenhuma altura nova; o cluster vira "!" com contador (já existe a regra ≤ 1500 px); a ficha usa a nuvem, que já se ajusta.

### Ânimo — marcador original

Selo no hex da cidade (anel + figura + número), forma **e** cor (daltonismo), `aria-label` com valor:
Próspera = anel dourado aberto + traço de sol nascente · Estável = anel liso · Abalada = anel rachado, cor âmbar · Revolta = anel quebrado vermelho + faíscas. Desenho próprio, sem rosto copiado de outro jogo; as "expressões" são feitas por traços de boca/sobrancelha simplificados dentro do selo.

### Mesa

Miniaturas por entidade (uma figura por unidade até 3, depois "+N"), cores de ameaça, tenda para Acampamento, seta de recuo, seta origem→destino de ~1 s derivada do diff por `id`, `resolutionEvent` com `hexId` em marcha/recuo. O que não deve ser reescrito: `alpha-board.tsx`, `alpha-table.tsx`, `hex-map.tsx`, `alpha-panels.tsx`, `table-art.ts`, `alpha.css` (alturas de bandeja).

---

## 4. Ordem de implementação proposta

0. **Integridade** (sem UI nova): UXB-01 (evento + mensagem de Perigo), UXB-02 (`governReach`, custo total, no-op, simulação de planos), UXB-07 (`reachable`). Cada um com teste que vira `it` (os que hoje são `it.fails` invertem).
1. **Ficha de Ação + `previewAction`** validada em **Produzir, Governar, Mover, Recrutar**; teste "prévia == aplicado" por ação (igualdade do diff, sem dupla cobrança).
2. Estender a Construir, Pesquisar, Elevar, Atacar, Reivindicar, Fundar, Cartas; remover os 12 cálculos duplicados à medida que cada ação migra.
3. Mapa: selo de Ânimo, miniaturas de ameaça, trilha de movimento, retrato do Líder e cluster de alertas.
4. Validação: Playwright direcionado desktop + celular por ação; um playtest humano de 2 jogadores; fixture RC4/RC5 carregando sem migração.

Sem deploy, sem merge em `main`, sem `frozen`, sem push.

---

## 5. Decisões que precisam do dono do produto

- **D1 — Mover.** (a) *Recomendado:* manter o canon (uma Ordem = uma pilha/peça, um caminho) e adicionar divisão de pilha na UI (o motor já aceita subconjunto). (b) Mudar o canon para multi-destino por Ordem: exige registrar antes e mudar o schema `MOVE`.
- **D2 — Perigo.** Manter 50% de perda sem Método Experimental, com evento, mensagem e prévia (recomendado), ou mudar a regra. A ligação com água continua não reproduzida: se você tiver o save/sala do caso, ele resolve a dúvida.
- **D3 — Saqueadores.** S1 (no máximo 1 assalto de Bando por cidade por rodada), S2 (recuo também após assalto a peça) e S3 (limite para a pilhagem pirata) **mudam regra**; pela linha de base V5.1 devem ser registrados no registro de lacunas antes. Autoriza registrar e implementar? S4/S5 são só interface e entram na Fase 3.
- **D4 — Governar.** Manter a aplicação automática "até Capacidade níveis" e só mostrar o custo certo (recomendado), ou deixar o jogador escolher quantos níveis (comando novo `levels`).
- **D5 — Cartas de movimento.** Existe teto para a soma de bônus (cartas + conselheiros + Figura + civilização)? Hoje não há.

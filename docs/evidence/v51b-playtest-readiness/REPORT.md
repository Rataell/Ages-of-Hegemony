# Playtest readiness slice — relatório

Nada de regra econômica, distância de Pátria, Δ de combate, nº de Ordens ou duração de Era foi alterado. Tudo local; sem push, merge ou deploy.

## 1. Pioneiros iniciais = 2 (congelado)
`STARTING_PIONEERS_DEFAULT = 2` (`packages/game-domain/src/alpha.ts`); `startingPioneers` continua configurável (`createAlphaGame`, bots). Motivo observado (10 seeds × 2p/4p/6p, ver `docs/evidence/v51b-pioneers/REPORT.md`): com 1, 37–50% dos assentos ficam sem Pioneiro depois de fundar, a 2ª exploração atrasa e a reposição leva várias rodadas; com 2 não houve expansão explosiva, a 1ª cidade extra não acelerou e as cidades ficaram limitadas pela economia. Sem mais tuning até um playtest humano contradizer.

## 2. Economia dos bots (V51B-16) — só estratégia do bot
Causas-raiz encontradas (não eram falta de planejamento de comida):
1. **Produzir era pulado**: a atividade da cidade ia para Elevar/Recrutar/Pesquisar e o assento ficava sem renda naquela rodada.
2. **Crescer é automático e vem antes da manutenção das peças** (`alpha-phases.ts`): o excedente de Alimento vira população e, sem sobra, as peças não são pagas (`UPKEEP_SHORTAGE`, −1 Ânimo em todas as cidades).
3. **Ânimo ≤ 1 = Revolta: a cidade não produz** → espiral: sem produção, mais fome, menos Ânimo.
4. Ordens planejadas pagam e agem só na resolução; a projeção precisa somar o que já está na fila.
5. Bug do bot: `combatPreview().defender.total` não existe (NaN) → nenhum ataque era feito nunca (ver §6).

O que o bot faz agora (`scripts/lib/alpha-bots.mjs`): `foodProjection` (mesma conta do cartão da cidade: FOOD_NOW, FOOD_INCOME_NEXT, POP_MAINTENANCE, MILITARY_MAINTENANCE, RESERVE_AFTER_ACTION = `endStock`, e o vão estrutural no teto de população) reproduz a ordem do motor e inclui Ordens já planejadas; Produzir é obrigatório só no menor conjunto de cidades que mantém a manutenção paga; fundar/recrutar/construir/Elevar só quando não há fome, peças pagas, reserva (2 na Era I, 1 depois) e a renda cobre a população no teto; austeridade (fome ou peças sem pagar na rodada anterior, ou Ânimo ≤ 1) congela expansão e recrutamento; socorro imediato por Troca com povo independente; Governar prioriza cidade com Ânimo ≤ 2; fundar respeita a capacidade administrativa.
Registro por assento/rodada em `ctx.foodLog` (produção, sustento populacional, sustento militar, estoque, déficit, Ânimo mínimo, carga administrativa) e `ctx.foodSpend` (comandos que gastaram Alimento).

Resultado (`economy-after.json`, 10 seeds × 35 rodadas): todos os assentos chegam à Era V (2p 20/20, 4p 40/40, 6p 60/60), população ~10–11,5 na Era III, ~2 cidades. Fome (turnos-assento com `FOOD_SHORTAGE`): 2p 15,9%, 4p 29,5%, 6p 21,9%; peças sem pagar 11–19%. Por faixa: **Eras I–II 5%, III–IV 13,5%, V–VII 35,9%**. Antes (mesma máquina, primeiro diagnóstico, 2p, 3 seeds): fome 41%, peças sem pagar 29%, comida chegando a 0 desde a Era II e população caindo.
**Limite honesto:** funcional até a Era IV; da Era V em diante (e nas partidas com guerra) a espiral de Ânimo volta. Não ajustei mais (instrução: sem balancear comida).

## 3. `--contact=forced`
Era bug de ferramenta (o driver dependia de os bots caminharem). Agora `forceContactSetup` (engine) coloca um Pioneiro de cada uma das duas Pátrias mais próximas em hexes adjacentes; o Contato **não é escrito**: `refreshKnowledge` aplica a regra real (≤ 1 hex) e a função lança erro se ela não disparar. A Região de fronteira entre as Pátrias é aberta (pública, como qualquer Região explorada). Ligado por `ALPHA_FORCE_CONTACT=1` (só dev; ignorado em produção), evento público "Cenário de teste: contato forçado".
Teste `tests/alpha-forced-contact.test.ts`: 2/4/6 assentos × 10 seeds, Contato na **rodada 1**, scouts adjacentes, determinístico, estado válido. Driver de UI com `--contact=forced`: sessão 2p real → contato **rodada 1**, tratado rodada 3; sai com código 2 se o Contato não ocorrer até a rodada 2.

## 4. Virada sem governo elegível
`reformState` (`apps/web/app/alpha/reform.ts`): sem governo elegível a superfície mostra uma linha ("nenhuma reforma disponível") e não a decisão falsa; com governo elegível mostra a decisão. 6 testes (`alpha-reform-state.test.ts`).

## 5. Cerco × muralha — resposta: **A, comportamento correto**
Trace: a Brecha tem duas partes. (a) passiva "+2 Poder por Cerco contra cidade fortificada" (sempre); (b) "abre 1 passo de Integridade" (Grau II/III: 2) **só quando a peça de Cerco rola a face Comando** (`alpha-shock.ts`, `tally`). A muralha só muda se algum Cerco rolou Comando (1 face em 6). Medido: 40 batalhas de Cerco contra Muralha de Pedra, 11 com Comando de Cerco, e em exatamente essas 11 a Integridade mudou; nas outras 29 ficou INTACT, mesmo com DECISIVE (a vitória veio de Impacto/Brecha passiva). Bate com o cânone (Brecha: "um Comando abre 1 passo", `rules-v5-proposal.md` §Cerco). Teste determinístico novo em `alpha-combat.test.ts` (DECISIVE sem Comando → INTACT, replay idêntico; os de Comando forçado já existiam).

## 6. Suprimento no combate real
`tests/alpha-supply.test.ts` (6 testes, motor real): atacante suprido ×sem suprimento (−`unsuppliedPenalty`), defensor suprido ×sem suprimento (mesma penalidade na defesa), território próprio e estradas ampliando o alcance (e uma lacuna na cadeia quebrando), pilha que marcha para fora do alcance perde o suprimento depois do movimento, replay idêntico, projeção (dono vê `supply` e o motivo; rival não). Manutenção/attrition: no motor o suprimento só afeta o combate (a falta de Alimento das peças é outro mecanismo, `UPKEEP_SHORTAGE`); não há desgaste por suprimento. Depósito: o nó Logística libera `improvement:DEPOT` mas o motor não tem esse efeito (lacuna registrada). UI: a linha "Sem suprimento" agora explica o porquê no relatório de batalha e no preview (`alpha-combat.tsx`).

## 7. Combate orgânico dos bots (35 rodadas, 10 seeds, sem tropas injetadas)
| personas | assentos | partidas com guerra | guerras | 1º contato | batalhas PvP | 1ª PvP | atacante venceu | empates | decisivas | capturas | penalidade de suprimento |
|---|---|---|---|---|---|---|---|---|---|---|---|
| mistas | 2p | 2/10 | 2 | 6,0 | 0 | — | — | — | — | 0 | — |
| mistas | 4p | 7/10 | 7 | 10,7 | 1 | 20 | 1 | 0 | 0 | 1 | 0 |
| mistas | 6p | 10/10 | 15 | 5,1 | 3 | 29,3 | 3 | 0 | 1 | 3 | 0 |
| guerreiros | 2p | 6/10 | 6 | 5,2 | 4 | 17,5 | 4 | 0 | 1 | 3 | 1 |
| guerreiros | 4p | 9/10 | 19 | 11,8 | 17 | 23,7 | 14 | 3 | 3 | 11 | 6 |
| guerreiros | 6p | 10/10 | 35 | 5,0 | 25 | 17,8 | 22 | 2 | 12 | 19 | 4 |
Pilhas: atacante 1–2 peças contra defensor 0–0,3: quase tudo é captura de cidade sem guarnição. Perdas de peças: 10 no total. **Auditoria da política militar** (a causa do zero anterior): o NaN no preview (nenhum ataque era emitido), a escolha de alvo (o Acampamento mais próximo vencia a cidade inimiga e exigia 13 de Poder), o piso de força 5 contra cidade vazia, a guarnição de 2 por cidade em guerra e a ausência de força de campo. Corrigido; o mapa não foi tocado. O que ainda falta para combates duros: os bots não sustentam exército (a economia só paga guarnições) e quase nunca se defendem, então PvP orgânico é de captura, não de batalha campal.

## 8. V51B-01 — prioridade de baixas (alternativa C) implementada
`SET_CASUALTY_PRIORITY` (livre, só no Planejamento, antes de Pronto); `casualtyPriority {order, byHex}` por jogador (padrão civilização + sobrescrita por pilha); `chooseLosses` lê a lista na resolução, sem prompt. **Sem lista, comportamento idêntico ao motor** (`engineOrder`; padrão exibido = `defaultCasualtyPriority`, derivado da regra: por força, Cerco por último). Peças sem força nunca passam à frente de combatentes; tipos ausentes ignorados; lista incompleta completa com a ordem do motor; validação no servidor (só tipos de combate, hex com peça própria, fase e Pronto). Projeção: o dono recebe a sua lista e o padrão; rival nunca. UI compacta (Livro → Conselho → "Prioridade de baixas", ▲▼, escopo "todas as pilhas"/hex, "voltar ao padrão"). 16 testes novos (`alpha-casualty-priority`: 1 baixa, 2 baixas/decisiva, tipos ausentes, incompleta, override por hex, empate tático por dono, replay, civil, comando, projeção; `alpha-casualty-ui`).

## 9. Playtest humano real
Comando único: `npm run playtest:human` (dev server em `http://127.0.0.1:3001/alpha` com contato forçado + log de playtest). Telemetria humana: `ui` (painel aberto, decisão mostrada/respondida, Virada exibida) com tempo desde a abertura da rodada, mais o que o log já tinha (planning_open, command com Ordens planejadas/canceladas/propostas/prioridade de baixas, ready com `planningMs`, contato, tratado, guerra, combate, era_turn). Só enums e ids; nunca texto livre ou nomes. Passo a passo em `docs/playtest/human-alpha-playtest.md`.

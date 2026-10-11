# Alpha V1.2 — auditoria de economia e progressão (parte 1)

Baseline preservado: RC4 `dca181a` · deploy `12ef4ddf` · tag `external-alpha-v1.2-rc4`. Nenhum `frozen` criado. Nenhum número do balanço foi alterado nesta parte.

Evidência: `node scripts/alpha-economy-audit.mjs --seed=1 --players=2` (bots, 35 rodadas) e `node scripts/alpha-bot-economy.mjs --players=2,4 --seeds=4`. Os bots jogam de forma limitada: os achados abaixo separam **mecanismo verificado no motor** de **intensidade medida com bots**.

## O ciclo de uma rodada, como o motor o executa

| # | Etapa | Onde | Efeito nos recursos |
|---|---|---|---|
| 1 | `WORLD_PULSE` (rodada 1; nas demais, passo 3 do turno de Era) | `alpha-phases.ts` `drawWorldPulse` | ± recurso para **todas** as civilizações |
| 2 | `ROUND_START` | `applyRecurringEffects` | Teia/Heranças creditam recursos (canal `institutions`) |
| 3 | `PLANNING` → `URBAN_ACTIONS` | `resolvePlannedActions` | **Produzir é uma Ordem** (de 5 por rodada). Só então a cidade rende; Construir/Elevar/Recrutar/Pesquisar pagam aqui |
| 4 | Movimento, Diplomacia, Conflitos | `resolveOrders` | Rotas, custos de ordens |
| 5 | `INTEGRATION_MAINTENANCE` | `runMaintenance` | efeitos `MAINTENANCE` → **sustento** (1 Alimento/2 hab. por cidade, capital primeiro) → **Crescer** (3 Alimento, 2 com Celeiro) → **manutenção militar** (1 Alimento/2 peças, 1 Riqueza/navio) → sobre-extensão → **descarte por limite** |
| 6 | `END_ROUND` | `endRound` | relatório; `passEraByCalendar` roda na abertura da rodada seguinte |

Consequência da ordem: a produção é creditada **antes** do sustento, mas o sustento é obrigatório e a produção é opcional (custa Ordem). O descarte por limite roda **depois** de pagar tudo, então excedente de uma rodada de produção grande é perdido enquanto as rodadas sem produzir passam fome.

A equação do ledger `abertura + ganhos − despesas − perdas − manutenção paga − descartes = fechamento` fecha com **0 violações** nos dois assentos da amostra (o relatório não esconde recurso).

## Achados

### E-1 · RULE — Revolta é uma espiral de morte sem saída
- **Repro**: seed 1, 2 jogadores, `p1`. Rodada ~14: fome → Ânimo 0 nas duas cidades. Das rodadas 18 a 35 a produção de Alimento é 0 e a população cai de 12 para 3.
- **Causa**: `activationCapacity` retorna 0 em Revolta (`alpha-city.ts:57-61`) → `cityYield` devolve pool vazio. O único remédio, Governar (`PROMOTE_MOOD`), custa 1 Cultura ou 2 Riqueza por nível (`governCost`). Uma civilização sem Cultura nem Riqueza não consegue pagar, não produz, não ganha Cultura/Riqueza e a fome continua tirando Ânimo (`maintainCivilizations`).
- **Correção mínima (a decidir)**: o canon §10 diz que a Revolta não produz; ele não diz que o remédio precisa de um recurso que a Revolta impede de obter. Proposta: o **primeiro nível** de Governar numa cidade em Revolta custa Alimento ou nada (um passo de emergência por rodada). Alternativa: cidade em Revolta rende o centro (1 hex) mas nada mais.
- **Teste de regressão**: civilização com Ânimo 0, 0 Cultura, 0 Riqueza deve conseguir sair de Revolta em ≤ 2 rodadas com Alimento ≥ sustento.

### E-2 · RULE — Eras avançam por calendário, a economia não
- **Repro**: seed 1, `p2` termina a rodada 35 em Era **ASCENSION** com cidades `HAMLET` / `VILLAGE` / `HAMLET`, 0 edifícios, 20 habitantes, 17 avanços.
- **Causa**: `passEraByCalendar` (`alpha-institutions.ts`, chamada em `openRound`) muda a Era por rodada, independente de progresso. As tabelas de Elevar (`ELEVATE_TABLE`) exigem Era mínima, mas nada obriga a cidade a subir; o custo de Elevar (N7: 10 Madeira, 8 Pedra, 8 Riqueza, 4 Conhecimento, mais população 18) fica fora do alcance de uma economia de 5 Ordens por rodada.
- **O que isto mostra**: a Era é só um relógio e libera conteúdo; os requisitos de crescimento (população 4/6/8/11/14/18, avanços da Teia por nível) não acompanham o ritmo.
- **Decisão pendente**: se a Era deve ser gatilho de ritmo (calendário) ou de maturidade. Não alterar números antes de decidir.

### E-3 · BALANCE — Conhecimento e Influência não têm fonte de produção
- **Repro**: nas 35 rodadas de `p2`, produção de Conhecimento = 0 (todo ganho vem de `institutions` ≈ +1/rodada) e Influência = 0. Conhecimento oscila 1–4 e cada pesquisa o zera.
- **Causa**: Conhecimento só vem de Eruditos em pares (`pairs(scholars, …)` → 1 por 2 Eruditos, 2 pares sem Biblioteca) e Governar de governo; a Influência não aparece em `cityYield`. Os assentos da amostra têm 0 Eruditos (`workers.scholars = 0`).
- **Correção mínima**: depende de como a população vira papel (`MANAGE`). Verificar se há papel padrão e se a UI deixa o jogador atribuir Eruditos.
- **Pendente**: medir com um assento que designe Eruditos antes de mexer em valores.

### E-4 · RULE — Descarte por limite e fome convivem
- **Repro**: `p2`, rodadas 23–24: descarte de 4 e 10 Alimento enquanto rodadas 17, 18, 32, 33 fecham a 0 Alimento.
- **Causa**: Produzir rende em pulsos (uma Ordem por cidade); limite de Alimento 15 (`state.rules.balance.limits`) corta o pico, e o sustento drena rodada a rodada. Produzir a cada rodada não é possível em 3 cidades: 3 Ordens de 5.
- **Fica claro**: o consumo é por rodada e a produção é por Ordem. O fluxo só fecha se Ordens de Produzir ≥ cidades (≈ 60% das Ordens com 3 cidades).

### E-5 · BALANCE (medido) — fome crescente nas Eras finais
`alpha-bot-economy` (2 e 4 jogadores, 4 sementes): fome ou peças sem manutenção em 4,2% das rodadas-assento nas Eras I–II, 12,5% nas III–IV e **54,2% nas V–VII**. População média 12–14 (Era III) cai para 10,6–11,4 (Era V) com 2,5 cidades e menos de 4 peças. A economia não escala com o ritmo das Eras.

### E-6 · UX — descartes e manutenção sem aviso antes de confirmar
`STORAGE_DISCARD` apareceu 53 vezes na partida; o jogador só vê depois. Já existe previsão de manutenção (`foodNow/income/sustenance/military/endStock` no bot). Falta expor o saldo previsto da rodada na mesa antes de `READY`. (A verificar na UI antes de classificar como correção.)

## Não verificado ainda (mensagem do pedido veio cortada em "Aten…")
- Auditoria de WORLD (terrenos), LEGACY (partidas antigas), Traits/Figuras/Heranças/bônus da Teia e custos de Distritos/Fortificações em tabela.
- Teste com assento que designe Eruditos/Mercadores.
- Impacto da manutenção naval (1 Riqueza/navio) sem fonte de Riqueza.

## Próximo passo proposto
1. Decidir E-1 (primeiro nível de Governar em Revolta) e E-2 (Era como calendário ou como maturidade).
2. Só então ajustar o balanço com os testes de regressão listados acima.

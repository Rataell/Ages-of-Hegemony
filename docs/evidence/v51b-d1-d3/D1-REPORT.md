# D-1 — Acampamento RECÉM-SURGIDO: o que os testes mostram (2026-10-05)

Pergunta do PO: em 2p/4p/6p, alguns Acampamentos passam a ser destruídos antes de gerar Bando?

**Resposta honesta: não, e não por causa da regra.**

| Teste | Resultado |
|---|---|
| Engine (`tests/alpha-threats.test.ts`, bloco D-1) | A regra funciona: camp fresco não parte na mesma cadeia (SURGIR→ATIVAR), amadurece após um Planejamento completo, e um camp fresco atacado dentro da janela morre acampado, paga a recompensa e nunca vira Bando. |
| 27 partidas de bots (`REPORT.md`, 2/4/6p × 3 seeds × naive/competent/hardcore) | 0 Acampamentos destruídos acampados, 0 ataques de jogador ao mundo (igual ao baseline anterior). |
| Bots que varrem o anel 3–5 hexes (`sweep/`, competent+hardcore) | idem: 0. |
| `scripts/alpha-camp-window.mjs` (antes × D-1, 18 partidas cada) | idêntico: 0 destruídos; atraso médio até partir 3,8–4,6 rodadas nas duas variantes; nenhum camp partiu na mesma rodada em que surgiu. |
| Com garrison injetado (3, 4, 6, 8 Infantaria) + mapa revelado | 0: o exército fica sem Alimento (6 peças comem 6/rodada numa capital de 2 habitantes), trava fora do suprimento e nunca chega ao camp. |

Causas:

1. **Os bots não têm exército.** Recrutar Infantaria exige um habitante Disponível; a capital começa com 2 (Produtor + Erudito), sem Disponível (`Sem Soldado nem habitante Disponível para mobilizar`). Armies chegam a 0 em ~r11 nos 4 assentos.
2. **O caminho que D-1 fecha raramente acontece:** camp surgido e lançado na mesma Virada (Pulso passo 3 → Ameaças passo 4) ou SURGIR→ATIVAR na mesma cadeia. Nos bots, os camps novos surgem por Repercussão e esperam ~4 rodadas até a próxima Virada de qualquer forma.
3. **Camps surgem fora de visão** (regra de sítio) e só um Explorador adjacente os vê.

Conclusão para o PO: a janela existe e está testada, mas a contra-jogada real depende de poder recrutar cedo e sustentar um exército. Isso é questão econômica (mobilização/Alimento), não de D-1. Registrado como V51B-16 (classe C) no Gap Register.

Sessões de UI com contato forçado: ver `CONTACT-REPORT.md`.

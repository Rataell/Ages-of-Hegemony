# Slice PLAYABILITY / PIONEIRO / BOTS — relatório

Mapa e distâncias congelados (nada reposicionado). Dados: `PIONEERS-competent.md`, `pioneers-competent.json`, `pvp-validate*.json`, `ui-forced-2p/`.

## 1. Bots (V51B-16) — o que mudou em `scripts/lib/alpha-bots.mjs`
- Pioneiro: antes mover (score 90) vencia explorar (58) e o bot nunca abria Região. Agora: com 2 Pioneiros o primeiro funda e o segundo explora; com 1, funda quando há sítio legal ao alcance e senão explora. Caminha até a Região fechada mais próxima, explora, evita hexes a ≤2 de ameaça visível, só funda com custo pago (Alimento 5/Materiais 3/Riqueza 2) e reserva esse custo contra outros gastos.
- Exército mínimo (garrison → pilha de campo) com portão de comida; alvo de ataque inimigo usa a força real dos defensores.
- Novo: `startingPioneers` em `createAlphaGame`/`createBotMatch`; contadores de Ordens por tipo.

**Limite honesto:** a economia dos bots ainda colapsa em fome a partir da Era II (Alimento ≈ 0, população encolhendo). Resultado: ~1,5 cidade na Era III, exércitos de 2–3 peças, guerras declaradas (2p: 4/4 partidas; 6p: 3–4 por partida) mas **nenhuma batalha jogador×jogador espontânea** em 12 partidas de 35 rodadas (`alpha-pvp-combat.mjs`). Os bots ainda não são bons o bastante para balancear economia/combate.

## 2. 1 vs 2 Pioneiros (10 seeds × 2p/4p/6p, 20 rodadas, bots competentes)
| | 1ª Região | 2ª Região | 1ª cidade extra | 1º Contato (assentos que alcançaram) | Pioneiros E2→E5 | Regiões abertas E5/assento | cidades fim E-III | sem Pioneiro após fundar | parou de explorar |
|---|---|---|---|---|---|---|---|---|---|
| 2p·1 | 5,0 | 5,4 | 8,3 | 5,8 (10/20) | 0,95→0,60 | 2,4 | 1,55 | 10/20 | 8/20 |
| 2p·2 | 3,2 | 4,6 | 9,4 | 5,0 (12/20) | 1,85→1,45 | 6,8 | 1,40 | 2/20 | 6/20 |
| 4p·1 | 2,9 | 6,1 | 7,3 | 9,2 (12/40) | 0,93→0,53 | 2,5 | 1,68 | 19/40 | 19/40 |
| 4p·2 | 2,9 | 4,0 | 9,8 | 13,3 (26/40) | 1,77→1,27 | 5,5 | 1,50 | 7/40 | 9/40 |
| 6p·1 | 3,3 | 6,4 | 8,0 | 8,6 (29/60) | 0,98→0,65 | 2,4 | 1,53 | 22/60 | 20/60 |
| 6p·2 | 3,2 | 4,8 | 8,5 | 7,3 (53/60) | 1,95→1,53 | 3,9 | 1,45 | 4/60 | 14/60 |

Leitura contra o critério:
- 1 Pioneiro cria o gargalo explorar×fundar: metade dos assentos fica sem Pioneiro depois de fundar (≈50% em 2p/4p, 37% em 6p), ~1/3 a ½ para de explorar, 2ª Região só na rodada ~6, e o Pioneiro de reposição custa (recrutado só em 5–7 rodadas).
- 2 Pioneiros **não** causam expansão explosiva: 1ª cidade extra não vem antes (8,5–9,8 contra 7,3–8,3), cidades fim E-III iguais (~1,4–1,7, limitadas pela comida), Regiões abertas por assento 4–7 até a Era V de 30 (fronteira não some), contato não vem mais cedo em 4p (13,3 vs 9,2 por falta de contato forçado, não por aceleração) e em 2p/6p vem 0,8–1,3 rodadas antes. O Pioneiro continua escasso: o 2º se consome ao fundar.
- **Recomendação: manter 2 Pioneiros iniciais.** Ressalva: bots economicamente fracos; o limite de cidades vem da comida, então o teste de "expansão explosiva" só fica confirmado com humanos.

## 3. Primeiro contato
Bots (2p warrior, 35 rodadas): rodada 4, 6, 26, 27 (média ≈ 16, mediana 16); 4p: 9–11; 6p: 4–7.

## 4. Combate real (`alpha-pvp-validate.mjs`, 5 casos × 2p/4p/6p × 3 seeds = 45 batalhas)
Condição inicial injetada (tropas/guerra/muralha), `ATTACK` enfileirado por `applyAlphaCommand`, resolução pelo motor real. Nenhum resultado injetado.
- Verificado em batalhas reais: posturas (Assalto vence Manobra, Manter vence Assalto: +1 nos modificadores), Guarda ("Muro (Guarda I)+1"), Cavalaria ("Flanco (Cavalaria I)+1"), Cerco ("Brecha (Engenho de cerco I)+2" por Cerco; Infantaria sem Cerco não ganha Brecha), Fortificação +2, Arqueiros contam como peças táticas, resultados VICTORY/DECISIVE/TIE com baixas 0–2 e recuo do perdedor (retreat), captura de cidade (sem guarnição e DECISIVE com muralha).
- Suprimento ("Sem suprimento") não apareceu nesses casos (a pilha estava ao lado da própria Pátria): **não validado** aqui.
- Observação a investigar, não afirmada como bug: com 2 Cerco e DECISIVE a muralha seguiu `STONE_WALL/INTACT→INTACT` no registro.
- Atacante com superioridade numérica injetada venceu 31 de 45 batalhas (69%); os 14 empates TIE com recuo do atacante concentram-se em 4p/6p.

## 5. Sessão de UI com contato forçado (automação, **não é humano**)
2p QUICK, 14 rodadas, 287 s de parede, 682 ações de UI, atrito 18 (14 do guerreiro). Tempo médio de Planejamento do driver: 10,5 s (A), 13,2 s (B) — são tempos de cliques automáticos, não de pessoa. Contato forçado **não ocorreu** em 14 rodadas (o driver forçado ainda segue o fluxo do antigo Explorador); nenhum tratado/guerra/combate. Sessão humana real continua necessária (V51B-12 aberto).
Atrito dominante: "reforma indisponível: 0 governos liberados" na última rodada de cada Era.

## 6. V51B-01
Ver `docs/product/v51b-01-casualty-choice-proposal.md`. Recomendação: C (prioridade de baixas pré-definida), não implementada.

# Diagnóstico da Revolta na rodada 5 (partida real da validação)

Data: 2026-10-13. Branch `rc6/alpha-v1.2`. Escopo: explicar por que a cidade "humana" da partida real de `e2e/real-game-validation.spec.ts` chegou à Revolta, sem mudar custos nem regras.

## Quem jogou

O "humano" dessa partida é um roteiro de teste, não uma pessoa: a cada rodada ele tenta Produzir uma vez e, da rodada 2 em diante, Recrutar Infantaria; confirma e passa. O outro assento é um bot. A partida original era em memória e se perdeu; a reconstrução abaixo repete o mesmo fluxo pela interface real (lobby, bot, Ficha), com a projeção do servidor capturada a cada rodada. A semente padrão produziu a mesma partida nas duas execuções antes da correção, então o quadro é determinístico para este roteiro.

A capital é um Posto (nível mais baixo), 2 habitantes no início, sem hex trabalhado. A produção vem só da população: **+2 Alimento por Produzir**. Infantaria custa 1 Alimento e 2 Madeira para recrutar e 1 Alimento por rodada de manutenção. Crescer custa 3 Alimento.

## Rodadas 1 a 5 antes da correção (o que o jogador viu)

| Rodada | População | Ânimo no início | Alimento no início | Produção | Manutenção (exigida / paga) | Peças | Ordens gastas | Ameaças |
|---|---|---|---|---|---|---|---|---|
| 1 | 2 → 3 | 5 Próspera | 15 | 0 (Produzir "sem efeito": armazém cheio) | 1 / 1 | 2 Pioneiros | 0 | nenhuma à vista |
| 2 | 3 → 3 | 5 Próspera | 11 | +2 | 2 / 2 | 2 Pioneiros | 2 (Produzir, Recrutar) | nenhuma |
| 3 | 3 → 4 | 4 Estável | 7 | **0 (Produzir bloqueado)** | 3 / 3 | + 1 Infantaria | 0 | nenhuma |
| 4 | 4 → 3 | 4 Estável | 1 | +2 | 3 / **2** (falta, Ânimo −1) | + 1 Infantaria | 2 | nenhuma |
| 5 | 3 → 2 | 2 Abalada | 0 | **0 (Produzir bloqueado)** | 3 / **0**; fome: perde 1 habitante e Ânimo | 2 Infantarias | 0 | nenhuma |
| 6 (início) | 2 | **0 Revolta** | 0 | | | | | |

Ameaças: dois Acampamentos de Saqueadores cresceram na virada de Era (fim da rodada 3) e partiram; nenhum chegou à cidade nem apareceu no campo de visão até a rodada 6. Não houve penalidade de ameaça.

Ânimo: 5 → 4 na rodada 2 (a 2ª ativação do dia, Recrutar depois de Produzir, custa 1 Ânimo; o Posto só tem 1 de Capacidade fora da Próspera), 4 → 2 na rodada 4 (2ª ativação −1 e falta de manutenção −1), 2 → 0 na rodada 5 (fome e falta de manutenção).

## O defeito demonstrado

Nas rodadas 3 e 5 a Ficha de Ação respondeu "Na resolução esta ação falharia… Esta cidade já usou suas ativações nesta rodada" para Produzir, com a cidade tendo 2 ativações livres (a projeção dizia `activations.left = 2`). O jogador, seguindo o que a Ficha dizia, não produziu. Causa: o `previewAction` simula a resolução num clone em fase `URBAN_ACTIONS`, mas não zerava `urbanActionsUsed` da cidade, como faz a transição real `PLANNING → URBAN_ACTIONS`. Na rodada seguinte a uma em que a cidade agiu, o clone herdava a contagem antiga e todas as ações urbanas apareciam como esgotadas. O planejador (`QUEUE`) usa outra conta e aceitaria o comando; só a Ficha, que é a interface, bloqueava.

Esse defeito é meu (Ficha, slice B2b) e não aparecia nos testes porque todos partem de partida nova ou de estado semeado com contagem zero. Corrigido em `packages/game-engine/src/alpha-preview.ts` e `alpha-urban.ts` (o mesmo reset nos dois pontos que clonam para `URBAN_ACTIONS`), com `tests/ux-preview-stale-activations.test.ts` (falha sem a correção, passa com ela) e uma guarda na partida real que falha se a Ficha voltar a dizer "já usou suas ativações".

## O que continua sendo consequência das decisões do roteiro

Com a correção, o mesmo roteiro joga Produzir nas rodadas 2 a 6 e ainda assim empobrece:

| Rodada | Ânimo no início | Alimento no início | Produção | Manutenção exigida / paga | Infantarias |
|---|---|---|---|---|---|
| 2 | 5 | 11 | +2 | 2 / 2 | 0 |
| 3 | 4 | 7 | +2 | 2 / 2 | 1 |
| 4 | 4 | 6 | +2 | 3 / 3 | 2 |
| 5 | 3 Abalada | 1 | +2 | 4 / 3 (falta, Ânimo −1) | 3 |
| 6 | 2 Abalada | 0 | | | 3 |

A renda é +2 Alimento por rodada; cada Infantaria recrutada custa 1 Alimento na hora e 1 por rodada para sempre, e a cidade cresce a 3 Alimento. Com três Infantarias a manutenção (4) passa da renda. A Revolta deixa de chegar na rodada 5 (a cidade chega à rodada 6 Abalada, com Ânimo 2), mas a trajetória continua descendente: o roteiro recruta uma peça por rodada sem ter fonte de Alimento.

## Era evitável? Havia recuperação?

Sim. Nada ali é economicamente impossível:

- Dois Pioneiros ficaram parados em casa durante a partida inteira; havia 6 hexes reclamáveis ao redor da capital (`claimOptions`), e um hex trabalhado com Fazenda daria mais Alimento que os +2 da população.
- Deixar de recrutar, ou desmobilizar uma Infantaria, corta a manutenção de 1 Alimento por peça.
- Governar está disponível em qualquer Ânimo: o primeiro nível custa 0 sob a Proto-Governança e a recuperação de emergência em Revolta leva o Ânimo a 4 sem custo (`govern.emergency.available = true`). Na partida antes da correção, em Revolta (Ânimo 0), a Ficha oferecia Governar como única ação, como a regra manda.
- As Ordens não foram o limite: no máximo 2 de 5 por rodada.

O que continua sendo um defeito de regra conhecido é outro, o E-A1-08 do registro: um Povoado em Revolta sem Alimento e com muita Riqueza não sobe a Ânimo 2 em três rodadas só com Governar (1 nível por rodada, limitado pela Capacidade). Não é o que aconteceu aqui e não foi alterado.

## Conclusão

- A Revolta na rodada 5 foi em parte **legítima** (política do roteiro: recrutar sem renda de Alimento, 2ª ativação paga com Ânimo, Pioneiros parados) e em parte **causada por um defeito real da Ficha** (Produzir bloqueado nas rodadas 3 e 5), que eu corrigi.
- Não existia situação economicamente impossível de evitar.
- Nenhum custo ou regra foi alterado.
- Para o playtest humano: o balanço inicial é apertado (Posto com +2 de Alimento e sem hex trabalhado). É uma observação para o dono, não uma correção feita.

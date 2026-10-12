# Alpha V1.2 · Fase 3 — checkpoint: 54 partidas de 21 rodadas, 4 jogadores

Suíte `e3` (3 modelos × 3 políticas × 6 seeds = 54 partidas, **Ameaças ligadas com R1**, recuperação emergencial ligada nas políticas). Pareado: mesma política, mesma seed e mesma civilização nos três modelos. Controle 0 = baseline atual (RC4 + correções + R1); Controle 1 = M1 isolado (capital Povoado N2, 4 habitantes, Agricultura pesquisada); Candidato A = M1 + redução de 15% na população exigida para Elevar. Nada foi aplicado ao motor: o M1 e o M4 são ajustes de cena na harness (`scripts/lib/alpha-econ-policies.mjs`).

Evidência bruta: `docs/evidence/v12-audit/e3/21p4-{base,starthamlet,candA}/` (sem versionar; ~15 MB). Tabelas geradas por `node scripts/alpha-experiment-report.mjs e3 21 4`.

Políticas: Equilibrada, Crescimento e Pesquisa (as mesmas dos testes anteriores, mais Pesquisa). Média por civilização ao fim da rodada 21; "Δ pareado" é a média da diferença por civilização contra o Controle 0, com o número de pares em que a variável subiu (↑) e desceu (↓). Cada partida tem 4 civilizações, então são 72 pares por modelo.

| modelo | n | população | cidades | nível máx. | N3 | N4 | N5 | N6 | N7 | distritos | edifícios | avanços | Conhecimento | Cultura | Prestígio | fome % | Revolta % | Ânimo | exércitos | navios | Obras | Hegemonia (req.) | Ordens disp. | Ordens não usadas % | assaltos |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Controle 0 · baseline | 18 | 19.2 | 2.3 | 4 | 0.8 | 0.8 | 0.2 | 0 | 0 | 1.6 | 0.3 | 16.2 | 3.5 | 1.9 | 11.8 | 4 | 3.5 | 3.4 | 1.2 | 0 | 0 | 1.2 | 5.3 | 21.9 | 8.9 |
| Controle 1 · M1 | 18 | 22.7 | 2.4 | 4.3 | 0.8 | 1 | 0.4 | 0 | 0 | 2.2 | 1 | 17.9 | 3.8 | 1.9 | 10.8 | 3 | 3.3 | 3.6 | 1.6 | 0 | 0 | 1.4 | 5.3 | 17.4 | 10.2 |
| Candidato A · M1+M4 15% | 18 | 20.3 | 2.3 | 4.5 | 0.6 | 1.1 | 0.5 | 0 | 0 | 2.5 | 1.4 | 17.5 | 3.6 | 1.9 | 11 | 1.5 | 1.7 | 3.8 | 1.7 | 0 | 0 | 1.4 | 5.3 | 17.4 | 9.9 |

Δ pareado contra o Controle 0 (mesma política e mesma seed; entre parênteses, pares acima ↑ e abaixo ↓):

| modelo | pares | população | cidades | nível máx. | N3 | N4 | N5 | N6 | N7 | distritos | edifícios | avanços | Conhecimento | Cultura | Prestígio | fome % | Revolta % | Ânimo | exércitos | navios | Obras | Hegemonia (req.) | Ordens disp. | Ordens não usadas % | assaltos |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Controle 1 · M1 | 18 | +3.53 (17↑ 1↓/18) | +0.1 (5↑ 1↓/18) | +0.25 (11↑ 4↓/18) | -0.07 (4↑ 9↓/18) | +0.24 (10↑ 5↓/18) | +0.24 (9↑ 2↓/18) | +0 (0↑ 0↓/18) | +0 (0↑ 0↓/18) | +0.63 (16↑ 2↓/18) | +0.71 (16↑ 2↓/18) | +1.71 (16↑ 1↓/18) | +0.33 (17↑ 1↓/18) | -0.01 (6↑ 8↓/18) | -1.01 (5↑ 13↓/18) | -0.99 (6↑ 6↓/18) | -0.2 (11↑ 7↓/18) | +0.17 (13↑ 4↓/18) | +0.36 (8↑ 2↓/18) | +0 (0↑ 0↓/18) | +0 (0↑ 0↓/18) | +0.19 (10↑ 1↓/18) | 0 (6↑ 8↓/18) | -4.5 (2↑ 16↓/18) | +1.33 (11↑ 4↓/18) |
| Candidato A · M1+M4 15% | 18 | +1.08 (13↑ 5↓/18) | +0.03 (3↑ 1↓/18) | +0.47 (15↑ 0↓/18) | -0.25 (4↑ 10↓/18) | +0.38 (13↑ 4↓/18) | +0.32 (14↑ 1↓/18) | +0.03 (2↑ 0↓/18) | +0 (0↑ 0↓/18) | +0.93 (14↑ 3↓/18) | +1.11 (18↑ 0↓/18) | +1.26 (18↑ 0↓/18) | +0.09 (11↑ 7↓/18) | +0.02 (8↑ 5↓/18) | -0.86 (5↑ 13↓/18) | -2.58 (4↑ 9↓/18) | -1.85 (5↑ 10↓/18) | +0.43 (16↑ 2↓/18) | +0.46 (8↑ 2↓/18) | +0 (0↑ 0↓/18) | +0 (0↑ 0↓/18) | +0.22 (10↑ 1↓/18) | +0 (9↑ 7↓/18) | -4.43 (2↑ 16↓/18) | +1.06 (11↑ 4↓/18) |

Origem do Prestígio por civilização (média) e diferença pareada:

| modelo | n | Prestígio | Marcos ★ | Ambições | Obras | Regiões | outras (cartas, Ressonância, Ameaças) | Ambições concluídas |
|---|---|---|---|---|---|---|---|---|
| Controle 0 · baseline | 18 | 11.85 | 0 | 1.79 | 0 | 2.72 | 7.33 | 0.64 |
| Controle 1 · M1 | 18 | 10.83 | 0 | 1.93 | 0 | 1.78 | 7.13 | 0.69 |
| Candidato A · M1+M4 15% | 18 | 10.99 | 0 | 2.1 | 0 | 1.69 | 7.19 | 0.74 |
| Δ Controle 1 · M1 | 18 | -1.01 (5↑ 13↓/18) | +0 (0↑ 0↓/18) | +0.14 (4↑ 0↓/18) | +0 (0↑ 0↓/18) | -0.94 (1↑ 14↓/18) | -0.21 (10↑ 7↓/18) | +0.06 (4↑ 0↓/18) |
| Δ Candidato A · M1+M4 15% | 18 | -0.86 (5↑ 13↓/18) | +0 (0↑ 0↓/18) | +0.31 (8↑ 1↓/18) | +0 (0↑ 0↓/18) | -1.03 (1↑ 15↓/18) | -0.14 (7↑ 10↓/18) | +0.1 (8↑ 1↓/18) |


## Leitura

**M1 isolado.** População +3,5 (17 de 18 partidas), distritos +0,6, edifícios +0,7, avanços +1,7 (16 de 18), Conhecimento +0,3, Ânimo +0,17; fome 4,0% → 3,0% e Revolta 3,5% → 3,3% (praticamente igual). As Ordens não usadas caem de 21,9% para 17,4%: o M1 dá mais coisa útil para fazer. Nível máximo +0,25.

**Candidato A (M1 + M4 15%).** Nível máximo +0,47 (15 de 18 sem nenhum par pior), edifícios +1,1 (18 de 18), avanços +1,3 (18 de 18), distritos +0,9, N4 +0,4, N5 +0,3; **fome cai de 4,0% para 1,5% e a Revolta de 3,5% para 1,7%** (menos fome e menos Revolta que o baseline, não mais). A população sobe menos que no M1 (+1,1 contra +3,5): a Elevação mais barata troca habitantes por nível. Exércitos +0,4. Nenhuma Obra de Legado em nenhum dos 54 jogos (as políticas não constroem; ver cenário de Obra). N6 e N7 não aparecem em 21 rodadas em nenhum modelo (N7 continua excepcional).

**Hegemonia**: o melhor caminho cumpre 1,2 de 3 requisitos no baseline e 1,4 nos dois modelos; ninguém declara em 21 rodadas (a Era VII só começa na rodada 19).

**Ordens**: o limite é 5 por rodada nos três modelos; a parte não usada é 21,9% (baseline), 17,4% (M1) e 17,4% (A). Os modelos não criam Ordens, apenas deixam menos delas ociosas.

## O Prestígio do M1: de onde vem a diferença (confirmado nos dados)

O M1 perde **−1,01 de Prestígio** por civilização (erro-padrão 0,34; 5 pares acima e 13 abaixo de 18 jogos); o Candidato A perde −0,86 (EP 0,36). Decomposição pelas fontes registradas (Marcos ★, Ambições, Obras, Regiões exploradas, o resto):

| Fonte | Δ M1 | EP | Δ Candidato A |
|---|---|---|---|
| **Regiões exploradas (+1 cada)** | **−0,94** | 0,18 | **−1,03** |
| Ambições concluídas | +0,14 | 0,07 | +0,31 |
| Marcos ★ e Obras | 0 | – | 0 |
| Resto (cartas, Ressonância, Pulso) | −0,21 | 0,26 | −0,14 |
| **Total** | **−1,01** | 0,34 | **−0,86** |

Quase toda a perda é de **Regiões exploradas**. Por quê: o mesmo roteiro de política, com mais para fazer nas cidades, passa Ordens da Expedição para a Cidade:

- Ordens de Cidade por civilização: **52,2 → 60,0** (+7,8; 61 de 72 pares sobem); Ordens de Expedição: **11,5 → 7,4** (−4,1; 41 de 72 descem). Candidato A: Cidade +8,4, Expedição −4,9.
- Correlação entre a queda de Ordens de Expedição e a queda de Regiões exploradas, por civilização: **+0,70** (M1) e +0,61 (A); a correlação entre mais Cidade e menos Expedição é −0,62 / −0,60. Pioneiros médios em campo: 1,18 → 1,02 (M1).
- Quando se desconta a parte de Regiões, o resto da diferença é −0,07 por civilização.

Por política (EP entre parênteses): **Crescimento** perde −1,62 (0,42), dos quais −2,04 (0,29) são Regiões e +0,21 resto: é a política que mais troca expedição por cidade. **Pesquisa** *ganha* +1,33 (0,52) e quase não explora (Regiões −0,21). **Equilibrada** perde −2,75 (0,47), mas só −0,58 são Regiões; −2,25 (0,33) são "resto". Esse resto de Equilibrada (e o oposto de Pesquisa, +1,42) **não é explicado por exploração**: vem de cartas, Ressonância e Pulso, que nesta harness resolvem sempre a primeira opção e variam com o estado da cidade. Os dois efeitos opostos se anulam na média (−0,21, EP 0,26, não significativo). A origem exata do "resto" será fechada com 4 partidas de Equilibrada com atribuição de Prestígio por comando (instrumento já no código); não foi inventada.

**Conclusão**: a perda do M1 é **custo de oportunidade de Ordens** (menos exploração porque há mais para fazer nas cidades), não menos pontuação por desenvolvimento nem menos oportunidades de pontuar; o M1 não remove nenhuma fonte de Prestígio. **Não há compensação artificial de +2 Prestígio.** A confirmação com uma política que prioriza explorar (Expansão) está nos cenários finais.

## Tempo por partida (real)

- 54 partidas de 21 rodadas, 4 jogadores: **média 25,6 s por partida** (mín. 18,6 s, máx. 75 s) de tempo de motor.
- 6 jogadores: 38 a 61 s por partida em condições normais.
- **O relógio de parede é pior que o do motor.** Entre 22:13 e 23:32, 8 partidas de 6 jogadores levaram de 3 a 27 minutos cada (562, 1427, 506, 904, 1629, 722 s…). A fila rodou nesse intervalo junto com meus `tsc`/`vitest` (eu rodei testes durante a fila) e com períodos de máquina lenta ou suspensa; é o mesmo sintoma da suíte completa de 83 minutos. Os resultados dessas partidas não mudam (o motor é determinístico, só o relógio estica), mas o tempo total da fila estourou. Não rodo mais nada pesado enquanto a fila corre.

# Alpha V1.2 — relatório da Fase 2 (catálogo, Saqueadores, ritmo econômico)

Branch `stabilize/alpha-v1.2-audit` · base RC4 `dca181a` · nada publicado, nada deployado, `main` intocada, sem `frozen`.
Commits da fase: `ad3451f` (catálogo + Hegemonia) · `3fb770f` (R1 + Saqueadores) · `fd8223e` (e2e dirigido e testes) · `c36eb2d` (compatibilidade de snapshot) · mais os de dados/documentos listados no fim.

## 1. Catálogo de edifícios
Tabela de reconciliação completa (29 ids + 3 só do canon, com fonte V5.1a, catálogo, motor, UI/schema, custo, requisito, efeito, Era, estado, decisão e motivo): **`alpha-v1.2-building-reconciliation.md`**. Fonte única no código: `ALPHA_BUILDING_CATALOG`.

Regra aplicada: os 5 edifícios já construíveis com efeito real mantêm custo e distrito do núcleo (não foi rebalanceado nada que já se jogava); os 8 novos usam o canon V5.1a depois de checar se o custo é pagável; nada sem efeito é vendido; nenhum id saiu do schema.

| Grupo | Edifícios | Estado |
|---|---|---|
| **Disponíveis e funcionais (13)** | Celeiro, Mercado, Biblioteca, Arquivo, Oficina (núcleo) · **Armazém, Tesouro, Banco, Fundição, Academia, Chancelaria, Teatro, Templo** (novos) | construíveis, com requisito (distrito + avanço da Teia), custo mostrado = custo pago, efeito observável |
| Porto | incluído no Distrito Marítimo | sem compra duplicada; Construir recusa com "O Porto vem com o Distrito Marítimo." |
| Irrigação | melhoria de hex | recusada como edifício |
| **Parados por falta de efeito no canon (8)** | Moinho, Observatório, Tribunal, Arsenal, Estaleiro, Farol (prioridade B) + **Quartel e Centro cultural** | não oferecidos; ver decisões D1–D4 |
| Prioridade C (6) | Casa dos Escribas, Laboratório, Praça Cívica, Santuário, Casa da Tradição, Campo de Treino | não oferecidos, sem custo nem efeito inventados |

**Conflito estrutural que parou a prioridade B (como você pediu):** o canon V5.1a dá custo e família ao Moinho, Observatório, Tribunal, Arsenal, Estaleiro e Farol, mas **não escreve o efeito** de nenhum (Observatório só traz a regra do avanço, que também não tem leitor). Implementar seria inventar regra. A decisão que falta está em D1–D4 da reconciliação, com uma opção mínima por edifício.

**Achado a mais, fora do pedido:** Quartel e Centro cultural **já eram vendidos sem efeito** no Alpha (o Quartel só dava capacidade de guarnição, que a pilha da cidade não lê; o "+1 Influência" do Centro não era creditado). Pela sua regra ("nenhum edifício sem o efeito anunciado") deixaram de ser oferecidos; os já construídos continuam válidos. É reversível: diga se prefere manter à venda com o texto honesto ("sem efeito mecânico ainda").

Efeitos verificados em teste (49 testes em `tests/v12-fix-catalog.test.ts`): Armazém +5 Madeira e +5 Pedra de limite; Tesouro e Banco +5 Riqueza; Fundição +5 Metal; Academia +5 Conhecimento; Teatro +5 Cultura; Chancelaria +1 Capacidade Administrativa e +5 Influência; Templo +1 Cultura por Produzir. Para cada um: bloqueio sem distrito / sem avanço / já existente / sem recursos; Cultura nunca coberta por Riqueza; custo exibido = custo pago; persistência; limite máximo 30/20 respeitado; a opção avisa quando já há um na civilização (o limite não soma de novo).
Correção ao lado: o custo exibido do Distrito Marítimo era 0 e cobrava 3 Madeira + 1 Pedra; agora mostra o que cobra.

## 2. Hegemonias
Auditoria completa em **`alpha-v1.2-hegemony-audit.md`**. Duas condições eram **provadamente inatingíveis**:
- Cultural exigia **Influência ≥ 25**, e o teto absoluto do estoque é **20**.
- Econômica exigia **Riqueza ≥ 30**: sem Figura que suba a Riqueza o máximo é 28 (15 + Tesouro 5 + Banco 5 + Metrópole 3), e sem os edifícios, 15.

Correção mínima, conforme o canon §23 ("Riqueza **no limite**"): o mínimo efetivo de um requisito de estoque é `min(declarado, limite de armazenamento)`; o valor declarado segue em `declaredMinimum`. As quatro outras Hegemonias não dependem de edifício (as Obras de Legado exigem **distrito**, não edifício). Não troquei a lista do motor pela do canon §23 (registro V51B-14: é redesenho) e não endureci as Obras com os novos edifícios (endureceria as Hegemonias).

## 3. Saqueadores (R1): antes e depois
Implementado: Acampamento → aproximação → assalto a uma cidade → resultado → **recuo** por passos legais até o Acampamento (no campo, atacável, sem assaltar e sem pagar recompensa) → **reorganização** (acampado; só relançável a partir de uma rodada completa depois) → nova incursão só quando relançado (Virada de Era ou ATIVAR AMEAÇAS). Sem teletransporte; o Bando anda no máximo sua velocidade por ativação. Se o Acampamento foi tomado/ocupado enquanto o Bando estava fora, ele acampa no sítio válido mais próximo (≥ 3 hexes de toda cidade) ou **se dispersa** com evento público. Piratas não mudam. Nome visível **Saqueadores** (`THREAT_NAMES` é a fonte única; ids, tipos de evento e `camp-r…` intactos). Testes: `tests/v12-fix-raiders.test.ts` (10).

Medição com as mesmas seeds e políticas (Equilibrada e Militarização; 4 jogadores; seeds 1 e 2; **n = 4 partidas por célula**). A = sem Ameaças, B = Ameaças atuais, C = com R1:

| perfil | condição | n | assaltos/partida | assaltos/cidade | vitórias do mundo em cidades | Revolta % | Ânimo baixo % | recuperação (rodadas) | fome/peças % | população | cidades | nível máx. | Alimento (abertura) | Acampamentos mortos | ataques do jogador | confrontos/partida |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 21 | A · sem Ameaças | 4 | 0 | 0 | 0 | 1.2 | 0.6 | – | 3.3 | 18.3 | 2.4 | 3.2 | 5 | 0 | 0 | 0 |
| 21 | B · Ameaças atuais | 4 | 42.3 | 4.52 | 40.3 | 21.7 | 13.8 | 4.1 | 6 | 15.6 | 2.4 | 2.9 | 5 | 0 | 0 | 42.3 |
| 21 | C · com R1 | 4 | 12.5 | 1.28 | 12 | 3.3 | 1.6 | – | 0.9 | 17.9 | 2.5 | 3.4 | 5.2 | 0 | 0 | 12.5 |
| 35 | A · sem Ameaças | 4 | 0 | 0 | 0 | 17.5 | 17.7 | – | 19.3 | 13.6 | 2.3 | 3.5 | 4.6 | 0 | 0 | 0 |
| 35 | B · Ameaças atuais | 4 | 51.8 | 5.93 | 50 | 34.3 | 27.6 | 5.2 | 22.1 | 12.3 | 2.3 | 3.6 | 4.4 | 0 | 0 | 51.8 |
| 35 | C · com R1 | 4 | 11.3 | 1.25 | 10.5 | 19.6 | 18 | 5.7 | 18.9 | 14.3 | 2.4 | 3.6 | 4.7 | 0 | 0 | 11.3 |
| 49 | A · sem Ameaças | 4 | 0 | 0 | 0 | 14.3 | 14.3 | – | 15.6 | 13.7 | 2.5 | 4.1 | 4.5 | 0 | 0 | 0 |
| 49 | B · Ameaças atuais | 4 | 88 | 9.58 | 82.3 | 34.8 | 28.1 | 4.9 | 20.4 | 12.9 | 2.4 | 3.8 | 4.3 | 0 | 0 | 88 |
| 49 | C · com R1 | 4 | 20.5 | 2.06 | 18.8 | 15.2 | 15.2 | 3.8 | 13.9 | 15.3 | 2.5 | 4 | 4.5 | 0 | 0 | 20.5 |

Leitura:
- Assaltos por partida: **−70%** (21 rodadas: 42,3 → 12,5), −78% (35: 51,8 → 11,3), −77% (49: 88 → 20,5). Assaltos por cidade: 4,5 → 1,3 / 5,9 → 1,3 / 9,6 → 2,1.
- Revolta: 21,7% → 3,3% (A: 1,2%) · 34,3% → 19,6% (A: 17,5%) · 34,8% → 15,2% (A: 14,3%). **R1 elimina o excesso de Revolta causado pelas Ameaças e o resto é economia** (a Equilibrada espirala sozinha em 35 e 49 rodadas, também sem Ameaças: ver §4).
- A ameaça continua real (12–20 assaltos por partida; 1,3 a 2,1 por cidade): é incursão, não cerco.
- **Limite da medição:** as políticas nunca atacam Saqueadores (0 ataques do jogador, 0 Acampamentos mortos em A, B e C), então **reação e contra-ataque não aparecem nos números**. O que está provado é o que o motor permite (teste: peça adjacente a um Bando que recua pode ordenar o ataque; sem recompensa em campo, recompensa uma vez se destruído acampado). Medir a reação exige uma política defensiva; fica como próximo passo.

## 4. Recuperação de Revolta (E-1) em partidas reais
Mesma política Equilibrada, mesmas seeds, com e sem o uso da recuperação emergencial (8 pares; uso opt-in `AOH_POLICY_EMERGENCY=1`):

| Cenário | seed | Revolta % sem → com | população final sem → com |
|---|---|---|---|
| sem Ameaças, 35 rod. | 1 | 21,4 → 7,9 | 18,3 → 25,0 |
| sem Ameaças, 35 rod. | 2 | 48,6 → 43,6 | 7,8 → 8,5 |
| sem Ameaças, 49 rod. | 1 | 20,4 → 14,8 | 14,3 → 24,0 |
| sem Ameaças, 49 rod. | 2 | 36,7 → 26,5 | 8,8 → 16,0 |
| Ameaças + R1, 35 rod. | 1 | 34,3 → 18,6 | 14,5 → 22,8 |
| Ameaças + R1, 35 rod. | 2 | 39,3 → 35,7 | 13,5 → 17,3 |
| Ameaças + R1, 49 rod. | 1 | 18,4 → 11,7 | 21,5 → 27,0 |
| Ameaças + R1, 49 rod. | 2 | 38,8 → 28,6 | 9,8 → 16,8 |

Melhora em **8 de 8** pares (Revolta menor, população maior). Não elimina a espiral nas seeds em que a política passa fome por falta de produção (35 rod., seed 2 continua em 43,6%): aí o problema é a economia da política, não a recuperação. Ânimo 4 mostrou-se **viável nos cenários normais**; não adicionei proteções.

## 5. Modelos econômicos para 21 rodadas
Nenhum aplicado ao motor; todos são edições do estado inicial/tabelas **só na medição** (`scripts/lib/alpha-econ-policies.mjs`, `VARIANTS`).

**Parâmetros exatos**
- **M1 (Controle 1):** a capital começa **Povoado (N2, `HAMLET`)** com **4 habitantes** (2 Produtores + 2 Eruditos), `development: 1`, **Agricultura** pesquisada. Nada mais muda (estoques, Figura, demais cidades).
- **Candidato A = M1 + M4 moderado:** a escada de cidades exige **15% menos habitantes**: `Math.round(mínimo × 0,85)`, nunca abaixo do nível anterior + 1: **2/4/6/8/11/14/18 → 2/3/5/7/9/12/15**. Tetos de Era inalterados.
- **Candidato B = M1 + M2b:** uma cidade alimentada que **cresceu** na rodada pode crescer um **segundo habitante** se está abaixo do teto do nível, o dono não passou fome e há Alimento (mesmo custo, 3 ou 2 com Celeiro). Emulado no início do Planejamento seguinte (ajuste de medição; o laço do motor não foi tocado).
- Controle 0: o baseline atual (RC4 + correções + R1).
- Condições: **Ameaças ativas (com R1)**, políticas Equilibrada e Crescimento, 21 rodadas; **4 jogadores seeds 1–4 (n = 8 pares) e 6 jogadores seeds 1–2 (n = 4 pares)**. Comparação pareada por política/seed.

### 21 rodadas — médias por assento
| perfil | jogadores | modelo | n | população | cidades | nível máx. | distritos+edif. | avanços | peças | fome/peças % | Revolta % | Ânimo médio | consumo Alimento/rodada | Alimento | Madeira | Riqueza | Conhecimento | Obras de Legado | Hegemonia (req. cumpridos) | Prestígio | assaltos | confrontos |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 21 | 4 | Controle 0 · baseline atual (RC4 + correções + R1) | 8 | 20.3 | 2.4 | 4 | 2 | 14 | 1.4 | 2.7 | 3.4 | 3.3 | 6.8 | 5.4 | 5.9 | 13.2 | 3.6 | 0 | 1.3 | 12.8 | 9.9 | 9.9 |
| 21 | 4 | Controle 1 · M1 | 8 | 24 | 2.6 | 4.4 | 3.2 | 15.2 | 1.7 | 3.6 | 2.7 | 3.5 | 8.4 | 6 | 6.7 | 12 | 3.9 | 0 | 1.5 | 10.6 | 10.3 | 10.3 |
| 21 | 4 | Candidato A · M1+M4(15%) | 8 | 20.6 | 2.4 | 4.5 | 3.6 | 15.2 | 1.7 | 2.8 | 3.3 | 3.6 | 8.1 | 7 | 6.7 | 11.1 | 3.5 | 0 | 1.4 | 10.8 | 10.8 | 10.8 |
| 21 | 4 | Candidato B · M1+M2b | 8 | 22.9 | 2.4 | 4.5 | 2.8 | 14.9 | 1.3 | 6.4 | 6.3 | 3.4 | 8.4 | 5.1 | 7.1 | 12.2 | 3.7 | 0 | 1.4 | 10.5 | 11.1 | 11.1 |
| 21 | 6 | Controle 0 · baseline atual (RC4 + correções + R1) | 4 | 20.9 | 2.4 | 4.1 | 2.1 | 13.9 | 1.3 | 3.8 | 4 | 3.4 | 6.8 | 5.4 | 6.2 | 13.2 | 3.6 | 0 | 1.2 | 12.4 | 11.5 | 11.5 |
| 21 | 6 | Controle 1 · M1 | 4 | 24.2 | 2.4 | 4.5 | 3.6 | 15 | 2 | 3.2 | 3.6 | 3.5 | 8.7 | 6.1 | 6.7 | 13.1 | 3.6 | 0 | 1.6 | 10.9 | 9.3 | 9.3 |
| 21 | 6 | Candidato A · M1+M4(15%) | 4 | 21.3 | 2.3 | 4.7 | 4.2 | 15.2 | 2.1 | 3 | 2.6 | 3.7 | 8.2 | 7.3 | 7 | 12.2 | 3.7 | 0 | 1.5 | 10.7 | 8.3 | 8.3 |
| 21 | 6 | Candidato B · M1+M2b | 4 | 22.8 | 2.2 | 4.7 | 3.3 | 15.2 | 1.7 | 5.4 | 3.6 | 3.5 | 8.4 | 5.6 | 7.7 | 13.3 | 3.7 | 0 | 1.3 | 10 | 8.8 | 8.8 |

Δ pareado contra o Controle 0 (média da diferença; entre parênteses, em quantos pares a variante ficou acima): pop · level · built · research · hungerPct · revoltPct · meanMood · consumption · works · hegemonyMet · prestige · assaults

| jogadores | modelo | pares | pop | level | built | research | hungerPct | revoltPct | meanMood | consumption | works | hegemonyMet | prestige | assaults |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4 | Controle 1 · M1 | 8 | +3.72 (8/8) | +0.41 (5/8) | +1.22 (7/8) | +1.19 (6/8) | +0.89 (5/8) | -0.74 (3/8) | +0.17 (7/8) | +1.67 (8/8) | +0 (0/8) | +0.25 (6/8) | -2.16 (0/8) | +0.38 (4/8) |
| 4 | Candidato A · M1+M4(15%) | 8 | +0.28 (4/8) | +0.5 (8/8) | +1.66 (7/8) | +1.19 (8/8) | +0.15 (5/8) | -0.15 (3/8) | +0.31 (8/8) | +1.32 (8/8) | +0 (0/8) | +0.13 (4/8) | -1.94 (0/8) | +0.88 (4/8) |
| 4 | Candidato B · M1+M2b | 8 | +2.63 (7/8) | +0.5 (7/8) | +0.88 (7/8) | +0.91 (7/8) | +3.72 (5/8) | +2.83 (5/8) | +0.1 (5/8) | +1.59 (8/8) | +0 (0/8) | +0.16 (3/8) | -2.25 (0/8) | +1.25 (5/8) |
| 6 | Controle 1 · M1 | 4 | +3.29 (4/4) | +0.38 (3/4) | +1.5 (4/4) | +1.08 (3/4) | -0.6 (2/4) | -0.4 (3/4) | +0.11 (3/4) | +1.84 (4/4) | +0 (0/4) | +0.38 (3/4) | -1.5 (0/4) | -2.25 (0/4) |
| 6 | Candidato A · M1+M4(15%) | 4 | +0.38 (1/4) | +0.54 (4/4) | +2.08 (4/4) | +1.29 (4/4) | -0.79 (1/4) | -1.39 (2/4) | +0.28 (4/4) | +1.35 (4/4) | +0 (0/4) | +0.25 (3/4) | -1.67 (0/4) | -3.25 (0/4) |
| 6 | Candidato B · M1+M2b | 4 | +1.96 (3/4) | +0.54 (4/4) | +1.17 (4/4) | +1.29 (3/4) | +1.59 (2/4) | -0.4 (2/4) | +0.06 (3/4) | +1.55 (4/4) | +0 (0/4) | +0.04 (2/4) | -2.33 (0/4) | -2.75 (1/4) |

### Repetição em 35 e 49 rodadas (Equilibrada, 4 jogadores, seeds 1–2, **n = 2 pares**: só detecta regressão)
| perfil | jogadores | modelo | n | população | cidades | nível máx. | distritos+edif. | avanços | peças | fome/peças % | Revolta % | Ânimo médio | consumo Alimento/rodada | Alimento | Madeira | Riqueza | Conhecimento | Obras de Legado | Hegemonia (req. cumpridos) | Prestígio | assaltos | confrontos |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 35 | 4 | Controle 0 · baseline atual (RC4 + correções + R1) | 2 | 14 | 2.8 | 4.1 | 1.3 | 19.3 | 1.3 | 37.9 | 36.8 | 2.1 | 5.7 | 2.8 | 6.4 | 9.9 | 3 | 0 | 1 | 13.1 | 10 | 10 |
| 35 | 4 | Controle 1 · M1 | 2 | 29 | 3 | 5 | 4.3 | 23.6 | 2.1 | 20.7 | 22.5 | 2.9 | 11.3 | 4.3 | 8.2 | 9 | 3.8 | 0 | 1.5 | 11.5 | 14.5 | 14.5 |
| 35 | 4 | Candidato A · M1+M4(15%) | 2 | 23.6 | 3 | 5.3 | 4 | 23.4 | 2.4 | 16.4 | 15.4 | 2.9 | 10 | 4.5 | 7.7 | 8.7 | 3.7 | 0 | 1.1 | 11.5 | 11 | 11 |
| 35 | 4 | Candidato B · M1+M2b | 2 | 21 | 2.8 | 4.9 | 1.5 | 24.4 | 1.5 | 18.2 | 18.9 | 2.7 | 9.6 | 2.9 | 8.7 | 10.4 | 3.8 | 0 | 1 | 11.5 | 10 | 10 |

Δ pareado contra o Controle 0 (média da diferença; entre parênteses, em quantos pares a variante ficou acima): pop · level · built · research · hungerPct · revoltPct · meanMood · consumption · works · hegemonyMet · prestige · assaults

| jogadores | modelo | pares | pop | level | built | research | hungerPct | revoltPct | meanMood | consumption | works | hegemonyMet | prestige | assaults |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4 | Controle 1 · M1 | 2 | +15 (2/2) | +0.88 (2/2) | +3 (2/2) | +4.38 (2/2) | -17.14 (0/2) | -14.29 (0/2) | +0.8 (2/2) | +5.55 (2/2) | +0 (0/2) | +0.5 (2/2) | -1.62 (0/2) | +4.5 (2/2) |
| 4 | Candidato A · M1+M4(15%) | 2 | +9.63 (2/2) | +1.13 (2/2) | +2.75 (2/2) | +4.13 (2/2) | -21.43 (0/2) | -21.43 (0/2) | +0.74 (2/2) | +4.31 (2/2) | +0 (0/2) | +0.13 (1/2) | -1.62 (0/2) | +1 (1/2) |
| 4 | Candidato B · M1+M2b | 2 | +7 (2/2) | +0.75 (2/2) | +0.25 (1/2) | +5.13 (2/2) | -19.64 (0/2) | -17.86 (0/2) | +0.58 (2/2) | +3.85 (2/2) | +0 (0/2) | +0 (0/2) | -1.62 (0/2) | +0 (1/2) |

| perfil | jogadores | modelo | n | população | cidades | nível máx. | distritos+edif. | avanços | peças | fome/peças % | Revolta % | Ânimo médio | consumo Alimento/rodada | Alimento | Madeira | Riqueza | Conhecimento | Obras de Legado | Hegemonia (req. cumpridos) | Prestígio | assaltos | confrontos |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 49 | 4 | Controle 0 · baseline atual (RC4 + correções + R1) | 2 | 15.6 | 3 | 4.8 | 3.1 | 26.5 | 1.6 | 27.3 | 28.6 | 2.2 | 8.3 | 2.9 | 8.3 | 10.3 | 3.7 | 0 | 1 | 14.6 | 24 | 24 |
| 49 | 4 | Controle 1 · M1 | 2 | 15.6 | 3 | 4.5 | 2.4 | 29 | 1.4 | 24 | 27.6 | 2.3 | 9.4 | 2.7 | 9.4 | 10.1 | 3.7 | 0 | 1 | 12.9 | 19 | 19 |
| 49 | 4 | Candidato A · M1+M4(15%) | 2 | 22.1 | 3 | 5.3 | 1.8 | 29.4 | 1.1 | 17.3 | 18.4 | 2.6 | 9.9 | 3.4 | 9.6 | 10.3 | 4 | 0 | 1 | 11.9 | 16 | 16 |
| 49 | 4 | Candidato B · M1+M2b | 2 | 21.3 | 2.8 | 5 | 1.6 | 28.5 | 1.3 | 16.6 | 18.9 | 2.6 | 10 | 2.8 | 9.6 | 10.5 | 3.7 | 0 | 1 | 11.1 | 19 | 19 |

Δ pareado contra o Controle 0 (média da diferença; entre parênteses, em quantos pares a variante ficou acima): pop · level · built · research · hungerPct · revoltPct · meanMood · consumption · works · hegemonyMet · prestige · assaults

| jogadores | modelo | pares | pop | level | built | research | hungerPct | revoltPct | meanMood | consumption | works | hegemonyMet | prestige | assaults |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4 | Controle 1 · M1 | 2 | +0 (1/2) | -0.25 (0/2) | -0.75 (1/2) | +2.5 (2/2) | -3.32 (1/2) | -1.02 (1/2) | +0.15 (1/2) | +1.09 (1/2) | +0 (0/2) | +0 (0/2) | -1.75 (0/2) | -5 (0/2) |
| 4 | Candidato A · M1+M4(15%) | 2 | +6.5 (1/2) | +0.5 (2/2) | -1.37 (0/2) | +2.88 (2/2) | -9.95 (1/2) | -10.2 (0/2) | +0.39 (2/2) | +1.58 (2/2) | +0 (0/2) | +0 (0/2) | -2.75 (0/2) | -8 (0/2) |
| 4 | Candidato B · M1+M2b | 2 | +5.63 (2/2) | +0.25 (2/2) | -1.5 (0/2) | +2 (1/2) | -10.71 (1/2) | -9.69 (1/2) | +0.36 (1/2) | +1.7 (2/2) | +0 (0/2) | +0 (0/2) | -3.5 (0/2) | -5 (0/2) |

### Confirmação com a recuperação de Revolta ligada nas políticas (21 rodadas, 4 jogadores, seeds 1–2, n = 4)
| perfil | jogadores | modelo | n | população | cidades | nível máx. | distritos+edif. | avanços | peças | fome/peças % | Revolta % | Ânimo médio | consumo Alimento/rodada | Alimento | Madeira | Riqueza | Conhecimento | Obras de Legado | Hegemonia (req. cumpridos) | Prestígio | assaltos | confrontos |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 21 | 4 | Controle 0 · baseline atual (RC4 + correções + R1) | 4 | 21.2 | 2.5 | 4.1 | 1.8 | 13.7 | 1.4 | 2.1 | 2.7 | 3.4 | 7 | 5.1 | 5.3 | 14.2 | 3.5 | 0 | 1.4 | 13.1 | 10.3 | 10.3 |
| 21 | 4 | Controle 1 · M1 | 4 | 23.6 | 2.6 | 4.3 | 3 | 14.9 | 1.7 | 3.3 | 2.7 | 3.5 | 8.3 | 6 | 6.6 | 13.3 | 3.8 | 0 | 1.5 | 10.8 | 10.5 | 10.5 |
| 21 | 4 | Candidato A · M1+M4(15%) | 4 | 20.6 | 2.4 | 4.4 | 3.7 | 15.1 | 1.9 | 2.7 | 2.1 | 3.7 | 8.1 | 6.9 | 6.7 | 12.6 | 3.5 | 0 | 1.4 | 11.1 | 10.5 | 10.5 |
| 21 | 4 | Candidato B · M1+M2b | 4 | 23.5 | 2.4 | 4.5 | 2.4 | 14.8 | 1.1 | 4.8 | 4.8 | 3.5 | 8.6 | 4.7 | 7 | 12.9 | 3.9 | 0 | 1.6 | 11.1 | 11.5 | 11.5 |

Δ pareado contra o Controle 0 (média da diferença; entre parênteses, em quantos pares a variante ficou acima): pop · level · built · research · hungerPct · revoltPct · meanMood · consumption · works · hegemonyMet · prestige · assaults

| jogadores | modelo | pares | pop | level | built | research | hungerPct | revoltPct | meanMood | consumption | works | hegemonyMet | prestige | assaults |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4 | Controle 1 · M1 | 4 | +2.38 (4/4) | +0.25 (2/4) | +1.25 (4/4) | +1.19 (3/4) | +1.19 (2/4) | +0 (2/4) | +0.15 (4/4) | +1.35 (4/4) | +0 (0/4) | +0.13 (2/4) | -2.31 (0/4) | +0.25 (2/4) |
| 4 | Candidato A · M1+M4(15%) | 4 | -0.62 (2/4) | +0.31 (3/4) | +1.94 (3/4) | +1.44 (4/4) | +0.6 (2/4) | -0.6 (1/4) | +0.28 (3/4) | +1.13 (4/4) | +0 (0/4) | +0.06 (2/4) | -2.06 (0/4) | +0.25 (1/4) |
| 4 | Candidato B · M1+M2b | 4 | +2.31 (4/4) | +0.44 (4/4) | +0.69 (3/4) | +1.13 (4/4) | +2.68 (2/4) | +2.08 (3/4) | +0.08 (3/4) | +1.64 (4/4) | +0 (0/4) | +0.19 (2/4) | -2 (1/4) | +1.25 (3/4) |

### O que os números dizem (n pequeno: diferenças < 0,3 nível são ruído)
- **M1** é consistente: **+3,7 habitantes (8/8), +1,2 construções, +1,2 avanços, +0,4 nível**; fome e Revolta praticamente iguais. Em 35 rodadas o ganho se repete (+15 habitantes, +0,9 nível); em 49 rodadas (n = 2) **não há ganho de nível nem de população** — o efeito de M1 é de partida, e some quando a partida é longa. Custo: **−2 de Prestígio** em todas as partidas (a capital deixa de ganhar o prestígio de subir de nível; relevante, porque a vitória por limite de rodadas é por Prestígio).
- **Candidato A** (M1 + 15%): nível **+0,5 em 8/8**, construções **+1,7**, avanços **+1,2 em 8/8**, Ânimo **+0,3 em 8/8**; **sem custo em população (+0,3), fome (+0,15 pp) nem Revolta (−0,15 pp)**. Em 35 e 49 rodadas não regride (nível +1,1/+0,5; fome e Revolta menores, mas n = 2 e a política espirala em algumas seeds). É o que melhora o desenvolvimento sem tensionar a comida.
- **Candidato B** (M1 + crescer 2): nível **+0,5** e população **+2,6**, mas **fome +3,7 pp e Revolta +2,8 pp** (5/8 pares): o crescimento extra consome mais Alimento do que a produção em blocos sustenta. Comprova a leitura anterior de que o gargalo é o ritmo do crescimento, mas que acelerá-lo sem produção custa estabilidade.
- **Combate / Saqueadores:** assaltos sem diferença relevante entre modelos (±1). **Expansão:** cidades 2,4–2,6 em todos (sem efeito). **Teia:** +1,2 avanços em M1 e A. **Obras de Legado: 0 em todas as partidas** — as políticas não constroem Obras em 21 rodadas; **não medido**. **Hegemonias:** 1,3–1,6 dos 3 requisitos do melhor caminho; ninguém declara em 21 rodadas.
- Nenhum modelo faz o nível médio passar de ~4,5 em 21 rodadas (teto de Era N7): N7 segue excepcional, como previsto.

### Recomendação sobre as 21 rodadas (não aprovada como regra)
1. **M1 sozinho já é um ganho seguro e barato**, mas mexe no Prestígio (decisão sua: compensar ou aceitar).
2. Entre os candidatos, **A é o melhor equilibrado**: mais níveis, construções e avanços sem custo de comida. **B não é recomendado** sem antes ampliar a produção de Alimento.
3. Próximos passos antes de decidir: mais seeds em 35/49 (n = 2 não basta), medir **Obras de Legado e reação a Saqueadores** com políticas que construam Obras e ataquem Acampamentos, e rodar os candidatos com a recuperação de Revolta ligada nas políticas (já há uma amostra n = 4 acima, com a mesma ordem).

## 6. Verificações pendentes da Fase 1 (todas fechadas)
| Item | Resultado |
|---|---|
| Débito de Cultura no **cliente** | a projeção entrega `cost.culture` e o motivo do bloqueio; `costText` já mostra "Cultura"; teste com Cultura 0/1/2/3 |
| Débito de Cultura no **ledger** | o ledger legado de cinco recursos não representa Cultura (verificado); contabilidade independente: variação do estoque = custo exibido, em teste; o relatório da rodada continua fechando |
| E-7 com Cultura e Riqueza juntas | Cultura 1+Riqueza 2, 2+2, 0+4, 1+1: o Governar paga por nível, Cultura primeiro, Riqueza no que faltar, e para quando não paga |
| `EMERGENCY_GOVERN` não explorável | teste de propriedade com 400 históricos aleatórios + relapso forçado a cada rodada (40 rodadas → exatamente 1 uso); só reabre depois de uma rodada posterior fechada em Estável |
| Seed do teste de bots 1 → 2 | mantida a **propriedade** (a partida de 35 rodadas alcança fome, batalha, bando e fortificação); a seed 1 perdeu fome e fortificação porque os bots passaram a usar a recuperação de Revolta; a seed 2 cobre as quatro (verificado com a build atual). Fome e fortificação têm testes dedicados (`maintenance.test.ts`, combate/cerco) |
| `e2e/strip-six-seats.spec.ts` | o erro de typecheck (`[...el.children]`, TS2488) **já existia no RC4** (confirmado compilando o RC4 em worktree); causa: lib `DOM` sem `DOM.Iterable`. Corrigido em `e2e/tsconfig.json`; o spec não mudou; os 3 tamanhos (1280, 1366, 1440) passam |
| Playwright dirigido | **24 de 24**: combate (`alpha-conflict`, `v51b-table` combate), ameaças (`v51b-threat-intent`), nuvem urbana e Revolta (`interaction-v2`, 11 casos), seis lugares (3 tamanhos) e **4 casos novos** (`v12-urban-emergency`: recuperação emergencial lidera a nuvem sem Cultura/Riqueza e é planejada em um clique; não é oferecida de novo no mesmo episódio; cidade Estável mantém a 2ª ativação; cidade Abalada mostra que a cidade já tem sua ação) |

## 7. Compatibilidade de snapshots
`tests/fixtures/rc4-midgame-state.json` foi produzido **pelo próprio motor RC4** (`dca181a`, compilado em worktree descartável, 14 rodadas, 2 jogadores, Ameaças ativas) e não tem `revoltEmergencyRound`, `Threat.withdrawing` nem `Threat.readyRound`. Em `tests/v12-fix-snapshot-compat.test.ts`: carrega pelo caminho público com os padrões neutros; joga **8 rodadas** a mais sem erro e válido a cada rodada; salva e carrega de novo igual; uma cidade em Revolta desse save pode usar a recuperação. Também: um save que já contém Quartel/Centro cultural/Observatório (não mais oferecidos) carrega.

## 8. Testes
| Lane | Testes direcionados |
|---|---|
| A · catálogo/Hegemonia | `v12-fix-catalog` 49 · `v12-audit-urban-*` atualizados (D-01 e D-03 viraram positivos) · 33 arquivos / 394 testes verdes na seleção |
| C · Saqueadores | `v12-fix-raiders` 10 · `alpha-threats` e `external-threat-fixtures` 53 |
| Fase 1 · pendências | `v12-fix-culture` 14 · `v12-fix-revolt` 16 · `v12-fix-snapshot-compat` 5 · `v12-fix-ui` 7 · `v12-fix-world11` 8 |
| E2E | Playwright 24/24 |
| Gate de fronteira | `tsc -b`, `tsc -p tests`, `tsc -p e2e`, `tsc` do web e `eslint . --max-warnings 0` **limpos**. Suíte completa: **127 arquivos**; na primeira execução 113 passaram e **14 falharam por timeout**, mas essa execução durou 83 min (a máquina ficou lenta/suspensa durante a rodada; os testes duravam milhões de ms). Os 14 arquivos foram **reexecutados e passaram (14/14; 171 testes + 17 `it.fails`)** em 75 s |

## 9. Compromissos e pendências
- Dados brutos das medições (≈ 65 MB) **fora do git**; os resumos (`summary*.md/json`) e um `digest.json` por suíte (14–80 KB) estão commitados. Regerar: `scripts/alpha-experiment-runner.mjs` + `scripts/alpha-experiment-report.mjs`. As medições rodaram em cópias congeladas da build (`pre-r1`, `post-r1`), para que as edições do código não contaminassem as partidas.
- Limitações: n pequeno nos candidatos de 35/49; Obras e reação não medidas; M2b foi emulado (não mexi no laço de Crescer); a Equilibrada espirala sozinha em seeds específicas (problema da política/economia, ainda sem tratamento).
- **Decisões suas:** D1–D4 (efeitos de Moinho, Observatório, Tribunal, Arsenal, Estaleiro, Farol; Arquivo Acadêmico × Administrativo; Quartel e Centro cultural); qual modelo de 21 rodadas e o Prestígio de M1; se a lista de Hegemonia do motor passa à do canon §23 (V51B-14); se as Obras passam a exigir o edifício.

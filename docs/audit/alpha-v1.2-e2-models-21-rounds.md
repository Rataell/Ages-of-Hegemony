# Alpha V1.2 — E-2: modelos comparativos para a partida de 21 rodadas (preliminar)

Decisão do PO: as Eras permanecem por calendário; N7 pode seguir excepcional; o critério é **progressão significativa**, não obrigar todas as civilizações a chegar a N7. Preferência inicial: condições iniciais + aceleração moderada de mecanismos existentes. **Nenhum modelo é regra; nada foi aplicado ao motor.** Todos são edições do estado inicial feitas só na medição (`scripts/lib/alpha-econ-policies.mjs`, `VARIANTS`).

## 1. Definição exata de cada modelo

| Modelo | Definição | Como foi avaliado |
|---|---|---|
| **M1 · condições iniciais** | A capital começa como **Povoado (N2)** com **4 habitantes** (2 Produtores, 2 Eruditos) e o avanço **Agricultura** já pesquisado (que é o requisito do Elevar a N2). Nada mais muda | **simulado** (variante `starthamlet`) |
| **M2 · "Crescer a 2"** — duas leituras. **M2a:** Crescer passa a custar **2 Alimento** por habitante em toda cidade (hoje 3; 2 com Celeiro, `growCost` em `alpha-city.ts`). **M2b:** a cidade alimentada pode crescer **2 habitantes por rodada** (hoje 1 por cidade por rodada, `maintainCivilizations`), cada um com o custo atual | **analítico** com os dados medidos (abaixo). Não simulado: exigiria alterar `growCost`/o laço de Crescer, o que está fora do que foi autorizado |
| **M3 · multiplicador de Conhecimento** | todo Conhecimento ganho (Eruditos, Distrito Acadêmico, instituições, cartas) rende ×1,5 (arredondado para cima) | **analítico** |
| **M4 · sprint** | Elevar e a escada de cidades exigem **25% menos habitantes** (arredondado para cima, ordem estrita): 4/6/8/11/14/18 viram 3/5/6/9/11/14. Os tetos de Era não mudam | **simulado** (variante `sprint`, edita `CITY_LADDER`/`ELEVATE_TABLE` só no processo da partida) |

Por que M4 não mexe nos tetos de Era: no perfil de 21 rodadas o Elevar é bloqueado por **Era em 0%** das cidade-rodadas e por **população em 34%** (A1, tabela G). Reduzir o teto de Era não destrava nada; a população sim.

## 2. Medição (simulado) — M1 e M4 contra RC4

Política: Equilibrada, Crescimento e Pesquisa (as três mais úteis para progressão), **modo *peace*** (sem Ameaças), as **mesmas seeds** da linha de base. 21 rodadas: 2 jogadores seeds 1 e 2, e 4 jogadores seed 1 (n = 9 por modelo). 35 e 49 rodadas: 2 jogadores seeds 1 e 2 (n = 6). Todas as 42 partidas terminaram (`FINISHED`, 0 falhas). Arquivos em `docs/evidence/v12-audit/models/`; tabela em `summary.md`; regerar com `node scripts/alpha-economy-models.mjs report`.

Médias por assento ao fim da partida:

| perfil | modelo | n | nível máx. | cidades | pop. | avanços | distritos+edif. | peças | fome/peças % | Revolta % | Alimento descartado/rodada |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 21 | RC4 | 9 | 4,0 | 2,2 | 19,7 | 17,6 | 3,1 | 1,8 | 4,2 | 3,4 | 4,2 |
| 21 | **M1** | 9 | **4,5** | 2,4 | 22,7 | 18,8 | 3,8 | 2,3 | 3,3 | 2,0 | 5,5 |
| 21 | **M4** | 9 | **4,4** | 2,4 | 18,7 | 16,9 | 2,8 | 1,7 | 0,9 | 0,1 | 5,3 |
| 35 | RC4 | 6 | 4,8 | 2,3 | 25,3 | 26,2 | 2,0 | 2,2 | 11,7 | 8,8 | 6,5 |
| 35 | M1 | 6 | 5,1 | 2,3 | 24,5 | 26,8 | 2,3 | 2,0 | 11,7 | 8,3 | 7,7 |
| 35 | M4 | 6 | 5,4 | 2,3 | 21,3 | 26,4 | 1,8 | 2,0 | 7,9 | 6,9 | 7,4 |
| 49 | RC4 | 6 | 5,3 | 2,3 | 26,5 | 32,8 | 2,1 | 2,0 | 11,4 | 8,3 | 7,7 |
| 49 | M1 | 6 | 5,8 | 2,3 | 28,9 | 34,0 | 2,8 | 2,3 | 8,5 | 6,8 | 8,9 |
| 49 | M4 | 6 | 6,1 | 2,3 | 26,8 | 32,0 | 1,8 | 2,3 | 5,8 | 3,4 | 9,9 |

Leitura (n pequeno, uma seed por célula: **diferença < 0,3 nível é ruído**):
- **M1**: +0,5 nível no perfil de 21 (4,0 → 4,5), +0,3 em 35, +0,5 em 49; mais população e mais construções; efeito parecido nos três perfis (não é um atalho que só ajuda a partida curta). Custo: +1 Alimento descartado por rodada (o alimento já sobra).
- **M4**: +0,4 / +0,6 / +0,8 de nível, **menos fome e menos Revolta** (0,9% e 0,1% no 21), mas **menos população** (18,7 contra 19,7 no 21) e **menos distritos+edifícios**: as cidades sobem de nível com menos gente, o que reduz o consumo; o ganho de nível vem de um limiar menor, não de mais desenvolvimento.
- Em nenhum modelo o nível médio chega a N5 em 21 rodadas (teto de Era N7); chegar a N5 é aceitável como "progressão significativa", N7 permanece excepcional.
- **Expansão** (cidades): 2,2 → 2,4 em 21 (ambos); sem efeito em 35/49. **Teia** (avanços): 17,6 → 18,8 (M1), 16,9 (M4) em 21; sem diferença relevante em 35/49. **Combate** e **Obras de Legado**: **não medidos** (modo *peace* remove Ameaças e as políticas não constroem Obras); fica como lacuna explícita.

## 3. M2 e M3: estimativa a partir dos gargalos medidos (não simulados)

Dados de A1, perfil de 21, 25 partidas de política (1 890 assento-rodadas):
- **M2a (custo 2):** em **62%** das assento-rodadas o limite de Alimento descarta Alimento (média **7,1** quando descarta), e fome ocorre em **3,9%**. O custo de Crescer **não é o que limita o crescimento**; o limite é +1 habitante por cidade por rodada e o teto de população do nível. Estimativa: efeito ≈ 0 no nível e na população (economiza ~1 Alimento por crescimento, que já sobra).
- **M2b (2 habitantes por rodada):** é o único "Crescer a 2" que ataca o relógio de população (o bloqueio por população é **34%** dos Elevar no 21). Estimativa: acelera o Povoado→Vila→Cidade quando há Alimento, mas **aumenta o consumo** (sustento 1 por 2 habitantes) e a fome/Revolta, porque a produção já é em blocos. Precisa de medição própria antes de qualquer decisão.
- **M3 (Conhecimento ×1,5):** Pesquisa sem Conhecimento em **21%** das tentativas (21 rodadas) e **44%** das tentativas encontram **nenhum nó disponível** (pré-requisitos/Era), então só uma parte pequena do problema é Conhecimento; Elevar quase nunca é bloqueado por Conhecimento (0–2%). Estimativa: mais avanços (Teia), pouco efeito em cidades. Vale para a Teia, não para o ritmo urbano.

## 4. Conclusão preliminar e próximos passos

1. O gargalo urbano do perfil curto é **população** (e Madeira), não Era, Conhecimento nem custo de Crescer. M1 e M4 agem nesse gargalo; M2a e M3 não.
2. A preferência do PO (condições iniciais + aceleração moderada) é coerente com os dados: **M1 melhora todos os perfis sem tirar população** e é reversível (é só estado inicial). **M4** dá mais nível, mas **tira população e construções** e muda a fórmula de Elevar em todas as partidas (efeito em 35/49 também).
3. Antes de escolher: (a) combinar M1 com M2b (ou com M4 moderado, 15%) e medir; (b) repetir com 4 e 6 jogadores e mais seeds; (c) medir Combate e Obras (modo *world*); (d) conferir que a Revolta/fome de 35/49 não piora.
4. Nada disto substitui o rebalanceamento econômico: só deve ser feito **depois** das correções de integridade (E-7, catálogo de edifícios, assaltos) porque elas mudam o próprio ritmo.

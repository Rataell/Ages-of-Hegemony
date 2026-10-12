# Alpha V1.2 — auditoria das Hegemonias (condições de vitória)

Código: `packages/game-engine/src/alpha-hegemony.ts` (`hegemonyProgress`, `declareHegemony`, `refreshHegemony`, `hegemonyWinner`); valores em `alphaRules().hegemonyRequirements` (`alpha.ts`). Testes: `tests/v12-fix-catalog.test.ts` (bloco "Hegemonia"). Declarar só na Era VII (Ascensão) e sustentar `hegemonyHoldRounds = 2` rodadas.

## 1. Requisitos vivos, alcançáveis?

| Caminho | Requisitos no motor (V5.1a antigo) | Depende de edifício? | Alcançável? | Problema provado |
|---|---|---|---|---|
| **Militar** | Força total ≥ 12 · 2 vitórias · 2 peças em território alheio | não | sim | — |
| **Econômica** | **Riqueza ≥ 30** · 2 rotas internacionais · 1 parceiro comercial | só pelo limite de armazenamento | **só com Figura que sobe a Riqueza** (limite máximo sem ela: 15 + 5 Tesouro + 5 Banco + 3 Metrópole = **28** < 30); sem Tesouro/Banco, **15** | **contradição provada**: o número exigido é maior que o limite que a maioria das civilizações pode ter |
| **Científica** | 2 avanços da Era VII · 2 distritos Acadêmicos · 1 Obra científica | não (as Obras exigem **distrito**, não edifício; `alpha-legacy-works.ts`) | sim | — |
| **Cultural** | **Influência ≥ 25** · 2 distritos Culturais · presença estrangeira ≥ 3 | só pelo limite | **nunca**: o limite máximo de Influência é o teto absoluto **20** (base 10 + 5 Chancelaria + 3 Metrópole = 18) | **contradição provada**: 25 > 20 |
| **Política** | 1 parceiro de tratado · presença estrangeira ≥ 3 · 1 Obra política | não | sim | — |
| **Territorial** | 10/14/18 hexes · 2–3 cidades N5+ · dentro da Capacidade Administrativa | não | sim | — |

Edifícios de prioridade A tornam o **limite** possível (Tesouro, Banco, Chancelaria), mas não removem a contradição numérica: 25 e 30 são absolutos, o canon diz **"Riqueza no limite"** (§23, Econômica).

## 2. Correção aplicada (revisada na Fase 3)

**Primeira versão (Fase 2), com defeito:** `min(declarado, limite de armazenamento da própria civilização)`. A auditoria da Fase 3 provou o exploit que a regra criava: **quanto menos armazenamento, mais fácil a Hegemonia**. Uma civilização sem Tesouro/Banco precisava de só 15 de Riqueza (e sem Chancelaria, 10 de Influência), enquanto quem construía o armazenamento precisava de 28. O teste da Fase 2 chegou a fixar esses 15 e 10.

**Regra atual:** `min(declarado, teto estático das regras)`, em que o teto estático (`alphaStorageCeiling`) é base + um de cada edifício de armazenamento + bônus de Metrópole, limitado ao teto absoluto, e **não depende do jogador** (nem de edifícios construídos, nem de Figura):

| Estoque | Declarado | Teto estático | Barra efetiva | Teto absoluto |
|---|---|---|---|---|
| Riqueza | 30 | 15 + 5 Tesouro + 5 Banco + 3 Metrópole = 28 | **28** | 30 |
| Influência | 25 | 10 + 5 Chancelaria + 3 Metrópole = 18 | **18** | 20 |

Comparação das regras, por situação de armazenamento (Riqueza / Influência):

| Situação | Capacidade do jogador | Barra, regra da Fase 2 | Barra, regra atual |
|---|---|---|---|
| Sem edifícios de armazenamento | 15 / 10 | 15 / 10 (**trivial**) | 28 / 18 |
| Tesouro | 20 / 10 | 20 / 10 | 28 / 18 |
| Tesouro + Banco | 25 / 10 | 25 / 10 | 28 / 18 |
| Tesouro + Banco + Metrópole + Chancelaria | 28 / 18 | 28 / 18 | 28 / 18 |
| Idem com a Figura de Meridia (+6 Riqueza) | 30 / 18 | 30 / 18 | 28 / 18 |

Condições especiais das Figuras: só a Figura de Meridia (Isaure Mekhan) aumenta o limite de Riqueza (+6, sempre limitado a 30); nenhuma Figura aumenta o limite de Influência. Resultado: **as duas barras são alcançáveis por qualquer civilização sem Figura**, e a Figura de Meridia só dá folga de 2 de Riqueza. Construir menos armazenamento deixa de ajudar: sem os edifícios a barra segue em 28/18 e o estoque nem cabe.

Efeito sobre a dificuldade: a Hegemonia Econômica passa a exigir **Tesouro + Banco + uma Metrópole** (cerca de 5 Pedra, 6 Riqueza e 1 Conhecimento nos edifícios, mais chegar a N6) e manter 28 de Riqueza por duas rodadas; a Cultural, **Chancelaria + Metrópole** e 18 de Influência. Não é trivial e não é impossível; é a leitura de "no limite" do canon sem o buraco.

Testes (`tests/v12-fix-catalog.test.ts`, bloco "Hegemonia"): a barra é 28/18 sem edifícios e com todos; estoque no limite-base (15/10) não qualifica; tudo construído e cheio qualifica sem Figura; a capacidade do jogador sem Figura chega exatamente ao teto estático; nenhuma métrica lê edifício; nenhum requisito passa de um teto absoluto.

## 3. O que **não** foi mudado e por quê
- A lista do motor ainda não é a do canon §23 (Comunidade de Descoberta, Memória do Mundo, Conselho de Civilizações, Estrada das Comunidades…): é o registro **V51B-14** do `openspec/changes/rules-v51b-engine/design.md`. Trocar a lista é redesenho de regra e pede aprovação.
- As Obras de Legado continuam exigindo o **distrito** como pré-requisito (`LegacyWorkRequirement.district`: "stand-in" até o catálogo existir). O canon pede o edifício (Academia, Chancelaria, Teatro, Entreposto). Com o catálogo agora disponível dá para migrar Academia/Chancelaria/Teatro, mas isso **endurece** as Obras e portanto as Hegemonias; fica para a fase de economia.
- Rotas internacionais ≥ 2 e parceiros comerciais são raros nas simulações (lane E: no máximo 1 rota por partida); não é impossibilidade, é balanço de rotas.

## 4. Divergências com o canon §23 que precisam de decisão futura

Nada disto foi alterado. Lista do canon (`docs/product/rules-v5-proposal.md` §23) contra o motor:

| Caminho | Canon §23 | Motor hoje |
|---|---|---|
| Militar | Força ≥ 14 · 3 vitórias · 2 cidades capturadas ou integradas | Força ≥ 12 · 2 vitórias · 2 peças em território alheio |
| Econômica | Riqueza no limite · 3 rotas internacionais · Entreposto das Marés ou 2 Tesouros | Riqueza (barra 28) · 2 rotas internacionais · 1 parceiro comercial |
| Científica | Comunidade de Descoberta ★ · 3 Observatórios/Academias · 2 Heranças | 2 avanços da Era VII · 2 distritos Acadêmicos · 1 Obra científica |
| Cultural | Memória do Mundo ★ · presença Predominante em 3 cidades estrangeiras · Monumento das Vozes | Influência (barra 18) · 2 distritos Culturais · presença estrangeira ≥ 3 |
| Política | Conselho de Civilizações ★ · Aliança ativa com 2 civilizações · 1 povo integrado | 1 parceiro de tratado · presença estrangeira ≥ 3 · 1 Obra política |
| Territorial | 20 hexes · 2 cidades N5+ · Estrada das Comunidades | 10/14/18 hexes · 2–3 cidades N5+ · dentro da Capacidade Administrativa |

Pontos de decisão: (1) trocar a lista inteira pela do canon (V51B-14); (2) os marcos ★ da Teia carregam a tag `hegemony:X` ("Hegemonia elegível") que o motor **não lê** — declarar só exige a Era VII; (3) Observatórios/Academias e Tesouros do canon só viram requisito se o Observatório e os demais edifícios existirem; (4) as Obras de Legado exigem **distrito**, o canon pede o **edifício** (Academia, Chancelaria, Teatro, Entreposto). Mudar (1), (3) ou (4) endurece as Hegemonias e deve esperar o catálogo fechado.

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

## 2. Correção aplicada (contradição comprovada, mínima)

`hegemonyProgress`: para as métricas de estoque `wealth` e `influence` o **mínimo efetivo** é `min(valor declarado, limite de armazenamento da civilização)`. O valor declarado continua em `declaredMinimum`. Assim:
- sem edifícios: Riqueza 15 e Influência 10 (estoque cheio);
- com Tesouro, Banco e Metrópole: o mínimo sobe até 28, nunca acima do teto 30 (Riqueza) / 20 (Influência);
- quem tem Figura que sobe o limite continua exigido pelo valor declarado, até 30.

Isso segue a letra do canon ("Riqueza no limite") sem inventar números. Não altera os outros 16 requisitos.

Testes: o mínimo efetivo não passa do teto absoluto em nenhum caminho; encher o estoque cumpre o requisito e ficar 1 abaixo não cumpre; construir Tesouro, Banco e Metrópole eleva o mínimo para 28; nenhuma métrica lê um edifício.

## 3. O que **não** foi mudado e por quê
- A lista do motor ainda não é a do canon §23 (Comunidade de Descoberta, Memória do Mundo, Conselho de Civilizações, Estrada das Comunidades…): é o registro **V51B-14** do `openspec/changes/rules-v51b-engine/design.md`. Trocar a lista é redesenho de regra e pede aprovação.
- As Obras de Legado continuam exigindo o **distrito** como pré-requisito (`LegacyWorkRequirement.district`: "stand-in" até o catálogo existir). O canon pede o edifício (Academia, Chancelaria, Teatro, Entreposto). Com o catálogo agora disponível dá para migrar Academia/Chancelaria/Teatro, mas isso **endurece** as Obras e portanto as Hegemonias; fica para a fase de economia.
- Rotas internacionais ≥ 2 e parceiros comerciais são raros nas simulações (lane E: no máximo 1 rota por partida); não é impossibilidade, é balanço de rotas.

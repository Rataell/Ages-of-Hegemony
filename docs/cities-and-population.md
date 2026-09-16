# Cidades e população — v0.3

As regras abaixo são provisórias e ficam em `GameRulesConfig`, persistida por partida. Não são números definitivos de balanceamento.

## Cidade e cenário inicial

Uma cidade possui identidade, dono, hexágono, nome, população, estabilidade, desenvolvimento, especialização principal opcional, alocação, rodada de fundação e progresso de crescimento. Cada hexágono comporta uma cidade. Não há construção livre de cidades: o serviço interno aceita `initialCities` na criação de um cenário confiável. Não é um comando de jogador nem uma definição de custo de fundação.

A criação sem cidades permanece suportada. No cenário com cidades, o padrão é população 2, estabilidade 60, desenvolvimento 1, nenhuma especialização e progresso zero. Sem alocação explícita, todos ficam `UNASSIGNED`. A primeira cidade fornecida para cada jogador é sua capital, identificada por `capitalCityId`; a ordem do cenário é parte do input. Estoques iniciais podem ser fornecidos pelo cenário interno. O cliente não recebe autoridade para criar esses valores.

## População e produção

| Função | Campo | Produção por trabalhador/ciclo |
| --- | --- | --- |
| PRODUCER | producers | 2 food |
| ARTISAN | artisans | 1 materials |
| MERCHANT | merchants | 1 wealth |
| SCHOLAR | scholars | 1 knowledge |
| SOLDIER | soldiers | Nenhuma |
| UNASSIGNED | unassigned | Nenhuma |

Todos os números são inteiros seguros e não negativos. A soma dos seis campos deve ser **exatamente igual** à população. `ASSIGN_POPULATION` substitui a distribuição inteira, exige dono correto e emite `POPULATION_ASSIGNED`. Não cobra custo nem altera pontos de comando: esses custos ainda não foram definidos.

Produção é calculada com os trabalhadores e a estabilidade do início da manutenção. Aplica-se o bônus da especialização por trabalhador, o modificador do governo e o percentual da faixa de estabilidade. Percentuais usam aritmética inteira e arredondamento para baixo em cada etapa. Produtos percentuais usam `bigint` internamente, mas todos os estados e eventos continuam JSON com números seguros. Overflow rejeita a transição inteira.

## Alimento e crescimento

1. Somar produção ao estoque da civilização.
2. Cobrar `foodPerPopulation = 1` por habitante existente no início do ciclo.
3. Pagar até o alimento disponível; nenhum saldo fica negativo.
4. Se faltar, emitir `FOOD_SHORTAGE` com requerido, pago e déficit. Todas as cidades do jogador perdem 5 de estabilidade e não crescem nesse ciclo. Ninguém morre e o progresso acumulado é preservado.
5. Sem falta, somente `max(0, alimento produzido agora − consumo total)` conta como excedente de crescimento. Estoques antigos não geram progresso repetidamente.
6. Dividir esse excedente igualmente entre cidades abaixo da capacidade. O resto inteiro vai por ordem lexical dos IDs, explicitamente determinística. Cidades na capacidade não recebem cota.
7. Cada 10 de progresso permite um habitante, limitado a 1 por manutenção e à capacidade urbana. Novos habitantes ficam não alocados e começam a consumir no próximo ciclo.

O excedente permanece no estoque: progresso é um indicador, não um segundo gasto de alimento. O progresso remanescente é limitado a um threshold. Cidades já na capacidade mantêm seu progresso, sem acumular mais. Os parâmetros `growthThreshold` e `maxGrowthPerMaintenance` são configuráveis. Essa política de distribuição e armazenamento é provisória e deve ser revisitada no balanceamento.

## Estabilidade

| Faixa padrão | Categoria | Percentual de produção |
| --- | --- | --- |
| 0–19 | CRITICAL | 75% |
| 20–39 | UNSTABLE | 90% |
| 40–59 | TENSE | 100% |
| 60–79 | STABLE | 100% |
| 80–100 | PROSPEROUS | 110% |

O snapshot exige inteiro 0–100. A função `clampStability` limita os deltas gerados pelo motor; não se corrigem silenciosamente snapshots inválidos. Limiares, percentuais e bloqueio de desenvolvimento em CRITICAL são configuráveis. No fim da manutenção, somam-se os deltas de governo, falta de alimento e excesso administrativo e aplica-se um único clamp. Mudanças geram `STABILITY_CHANGED`.

Os predicados de governo leem a estabilidade anterior ao ciclo. Isso evita que atualizar a capital primeiro altere o efeito nas outras cidades.

## Desenvolvimento

| Nível | Limite populacional | Custo para o próximo nível |
| --- | --- | --- |
| 1 | 3 | 5 materials |
| 2 | 5 | 10 materials |
| 3 | 8 | 15 materials |
| 4 | 12 | 20 materials |
| 5 | 16 | Sem próximo nível |

`DEVELOP_CITY` verifica propriedade, máximo, estabilidade crítica e recursos antes de aplicar qualquer gasto. O custo é um pool completo configurável, capaz de usar os cinco recursos. Aumenta um nível, recalcula administração e emite `CITY_DEVELOPED`. Nenhum edifício, distrito ou tecnologia foi implícito nesse comando.

## Especializações

`SPECIALIZE_CITY` exige propriedade, desenvolvimento mínimo (padrão 1) e ausência de especialização. A escolha inicial não tem custo definido; qualquer segunda escolha, inclusive a mesma, é rejeitada. Não há respecialização.

| Especialização | Efeito padrão |
| --- | --- |
| AGRARIAN | +1 food por produtor |
| INDUSTRIAL | +1 materials por artesão |
| COMMERCIAL | +1 wealth por mercador |
| ACADEMIC | +1 knowledge por estudioso |
| ADMINISTRATIVE | +2 capacidade administrativa |
| MILITARY | Hook de preparação futura = 1; nenhum efeito militar executado |
| CULTURAL | Hook de influência futura = 1; nenhuma produção de influência executada |

Todos os campos ficam em `specializationModifiers`. Não há produção econômica de soldados nesta versão.

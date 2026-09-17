# Economia e território — v0.4

Os cinco recursos pertencem à civilização. Cidades produzem para esse estoque compartilhado. Todos os valores de balanceamento estão em `GameRulesConfig`, com o catálogo territorial em `territory.ts`; são provisórios.

## Terreno e recursos naturais

| TerrainType | Food | Materials | Wealth |
| --- | ---: | ---: | ---: |
| UNKNOWN | 0 | 0 | 0 |
| PLAINS | 2 | 0 | 0 |
| FOREST | 1 | 1 | 0 |
| HILLS | 0 | 2 | 0 |
| MOUNTAINS | 0 | 2 | 0 |
| COAST | 1 | 0 | 1 |
| SEA | 1 | 0 | 0 |

`TileYield` contém somente food, materials e wealth. Conhecimento e influência continuam urbanos. `UNKNOWN` não pode ter features, melhorias ou trabalho; permite preservar centros antigos sem inventar sua geografia. Cenários fornecem os terrenos explicitamente; não há geração procedural.

| Feature | Terrenos aceitos | Bônus |
| --- | --- | --- |
| RIVER | PLAINS, FOREST, HILLS, COAST | +1 food |
| FERTILE | PLAINS, FOREST, HILLS | +1 food |
| TIMBER | FOREST | +1 materials |
| STONE | HILLS, MOUNTAINS | +1 materials |
| METAL | HILLS, MOUNTAINS | +1 materials |
| FISH | COAST, SEA | +1 food |

Features são únicas no hex, mas podem coexistir quando compatíveis. O schema valida combinações contra o catálogo da partida.

## Propriedade, alcance e conexão

`ownerId` e `controllerCityId` são ambos nulos ou identificam um jogador e uma cidade desse jogador. Cada hex tem um controlador. Centros pertencem sempre à cidade correspondente. Raios por desenvolvimento: **1, 1, 2, 2, 3**. O schema verifica alcance e um caminho de hexes próprios adjacentes até o centro. Esse caminho pode atravessar território de outra cidade da mesma civilização; não pode atravessar hex livre ou estrangeiro.

`CLAIM_HEX` exige PLANNING, proprietário da cidade, versão atual, terreno conhecido que não seja SEA, hex livre, alcance e conexão. Custa **1 influence**. Hex próprio já reclamado também é rejeitado; não há transferência administrativa nesta versão.

Claims são imediatos e só aceitam território livre. **Disputas simultâneas ficam para um resolver futuro. CAS não constitui regra estratégica de iniciativa.** Um conflito de versão exige recarregar e reavaliar; não garante que o comando ainda seja válido.

## Trabalho e subsistência

`ASSIGN_WORKED_HEXES` substitui a lista inteira, sem duplicatas, em ordem canônica de IDs. Cada hex deve ser produtivo, próprio, administrado por aquela cidade e dentro do raio. Não pode ser trabalhado por outra cidade. A quantidade não excede `workers.producers`. Reduzir produtores abaixo do trabalho atual exige primeiro remover atribuições.

Cada produtor territorial recebe terreno + features + melhoria **em lugar** da produção básica. Produtores restantes conservam a subsistência v0.3. Especialização urbana continua aplicando seu bônus por trabalhador, separadamente da subsistência. Um centro conhecido também pode ser trabalhado; não produz automaticamente.

SEA tem yield descritivo no catálogo, mas não pode ser reclamado, administrado, melhorado, trabalhado ou fundado. A opção mais simples desta rodada é manter navegação desativada e permitir FISHERY somente em COAST com FISH. UNKNOWN não pode ser reclamado; centros migrados continuam funcionais via subsistência.

## Melhorias

| Melhoria | Compatibilidade | Custo | Bônus |
| --- | --- | --- | --- |
| FARM | PLAINS ou feature FERTILE | 1 materials | +1 food |
| LUMBER_CAMP | FOREST | 1 materials | +1 materials |
| QUARRY | HILLS ou MOUNTAINS | 2 materials | +1 materials |
| MINE | HILLS ou MOUNTAINS | 2 materials + 1 wealth | +2 materials |
| FISHERY | COAST com FISH | 1 materials | +1 food |

STONE e METAL enriquecem o yield, mas não são obrigatórios para QUARRY/MINE. `IMPROVE_HEX` exige propriedade e ausência de melhoria anterior. Há uma melhoria principal por hex, sem substituição, demolição ou tempo de construção. Custos são pagos atomicamente.

## Fundação abstrata

`FOUND_CITY` exige hex próprio, sem cidade, nome válido de 1–80 caracteres, ID de cidade único e distância hexagonal mínima **2** de qualquer cidade. PLAINS, FOREST, HILLS e COAST são terrenos válidos; MOUNTAINS não admite fundação nesta configuração. Um hex trabalhado deve ser desatribuído antes da fundação. O comando não cria Settler.

Custo: **5 food + 3 materials + 2 wealth**. Estado inicial: população **1**, um habitante não alocado, estabilidade **60**, desenvolvimento **1**, especialização nula, progresso **0**, listas de trabalho/distritos/edifícios vazias. Centro passa ao novo controlador, preservando proprietário e eventual melhoria. A capital existente permanece. Nenhum hex vizinho é transferido automaticamente.

Administração é recalculada no mesmo snapshot; consumo, produção e consequências de estabilidade incluem a nova cidade na próxima manutenção. Não há manutenção extra oculta durante o comando.

## Produção e explicação

Ordem por cidade: população não territorial → terreno trabalhado → features → melhorias → distritos → edifícios → especialização e sinergia → governo → estabilidade inicial. As nove fontes aparecem em `CityProductionBreakdown.sources`, inclusive fontes zero. `delta` pode ser negativo para modificadores; `total` é não negativo.

Governo aplica os percentuais existentes à wealth acumulada com uma divisão inteira. Estabilidade aplica seu percentual ao resultado com outra divisão inteira. Não foram adicionados percentuais territoriais. Cada divisão arredonda para baixo; não se combina os dois percentuais antes de arredondar.

Depois: produção bruta é creditada, alimento é consumido, falta/crescimento são resolvidos, administração é calculada após crescimento, excesso reduz produção nova não alimentar, estabilidade muda e administração final é recalculada. Excedente novo compartilhado mantém distribuição determinística por ID de cidade. GRANARY usa o limiar local nesse crescimento.

`EconomyBreakdown` registra cidades, gross, administrativeAdjustment, credited, foodRequired, foodPaid, opening, closing e netChange. Para cada recurso:

```text
soma dos deltas da cidade = total da cidade
soma dos totais das cidades = gross
gross + administrativeAdjustment = credited
opening + credited - consumo de food = closing
opening + netChange = closing
```

`RESOURCES_PRODUCED.resources` é exatamente `credited`. O evento guarda o breakdown calculado antes de alterações de população/estabilidade; a UI não tenta reconstruir esse histórico. Eventos v2 migrados podem não ter breakdown. A projeção distingue último resultado de prévia da próxima manutenção.

## Administração e segurança

Território acrescenta `floor(hexes próprios / controlledHexesPerLoad)`, com divisor padrão **5**, incluindo centros. Distritos/edifícios somam capacidade. Persistem cargas de cidade, população e desenvolvimento e os modificadores de governo da v0.3.

Schemas rejeitam negativos indevidos, frações, NaN, Infinity e números fora de inteiros seguros. Somas, multiplicações e percentuais usam intermediários BigInt, verificando a conversão final. Overflow retorna `NUMERIC_OVERFLOW` e cancela a transição inteira. A inspeção informa erro de yield/prévia quando uma configuração extrema não permite cálculo seguro; não mascara o valor com zero.

Custos, yields e efeitos configuráveis vivem no domínio; transições e cálculo vivem no motor. Prisma e autorização ficam no servidor. `PlayerView` filtra território próprio ou explicitamente visível, mantendo privados RNG, log e dados internos adversários.

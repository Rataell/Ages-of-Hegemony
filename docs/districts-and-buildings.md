# Distritos e edifícios — v0.4

Especialização é a identidade predominante da cidade. Distrito é infraestrutura construída; não muda a especialização. Cada cidade tem **1, 2, 3, 4 ou 5 slots**, conforme desenvolvimento. Os limites são configuráveis. Provisoriamente, existe no máximo um distrito de cada tipo por cidade.

`BUILD_DISTRICT` verifica proprietário, PLANNING, expectedVersion, slots, duplicação, desenvolvimento mínimo e estoque. O custo é debitado junto com a criação e o evento `DISTRICT_BUILT`. Falhas não alteram recursos nem estado.

| Distrito | Custo | Efeito por manutenção |
| --- | --- | --- |
| AGRARIAN | 2 materials | +1 food se houver Producer |
| COMMERCIAL | 2 materials + 1 wealth | +1 wealth se houver Merchant |
| ACADEMIC | 3 materials + 1 wealth | +1 knowledge se houver Scholar |
| ADMINISTRATIVE | 3 materials | +1 capacidade administrativa |
| MILITARY | 3 materials | +1 capacidade de guarnição local |
| INDUSTRIAL | 3 materials | +1 materials se houver Artisan |
| CULTURAL | 2 materials + 1 wealth | +1 influence |

Producer ativo significa pelo menos um produtor alocado, territorial ou de subsistência. Demais condições consultam a alocação urbana correspondente. Efeitos administrativos e de guarnição são derivados imediatamente, sem esperar manutenção.

## Catálogo mínimo de edifícios

`BuildingType`, `BuildingState` e `BuildingCatalogEntry` constituem o contrato genérico. Estado registra tipo e rodada de construção. Catálogo registra distrito obrigatório, custo, desenvolvimento mínimo, requisito de trabalhador, produção, capacidade administrativa, guarnição e redução do limiar de crescimento.

| Edifício | Distrito | Custo | Efeito |
| --- | --- | --- | --- |
| GRANARY | AGRARIAN | 2 materials | growthThreshold local −2, piso 1 |
| MARKET | COMMERCIAL | 2 materials + 1 wealth | +1 wealth com Merchant |
| LIBRARY | ACADEMIC | 3 materials + 1 wealth | +1 knowledge com Scholar |
| ARCHIVE | ADMINISTRATIVE | 2 materials | +1 capacidade administrativa |
| BARRACKS | MILITARY | 3 materials | +2 capacidade de guarnição |
| WORKSHOP | INDUSTRIAL | 3 materials | +1 materials com Artisan |
| CULTURAL_CENTER | CULTURAL | 2 materials + 1 wealth | +1 influence |

Valores modestos e provisórios estão em `GameRulesConfig.territory.buildings`. `BUILD_BUILDING` exige distrito correspondente, proprietário, cidade válida, PLANNING, versão atual, desenvolvimento e recursos suficientes. Duplicatas são rejeitadas. Cada cidade pode construir uma unidade de cada tipo, registrada na lista da cidade e ligada ao distrito pelo catálogo. Não há tabelas SQL por edifício.

**Construção é instantânea em v0.4.** Não existem filas, duração, trabalhadores de obra ou manutenção recorrente de edifícios. `BUILDING_BUILT` registra custo e identidade. Distrito e edifício são pagos por comandos separados, cada um atômico.

## Especialização e efeitos

Se a especialização corresponde ao distrito, o catálogo oferece mais uma unidade do efeito desse distrito, respeitando seu requisito de trabalhador. ADMINISTRATIVE recebe +1 capacidade adicional; MILITARY recebe +1 guarnição adicional. Isso se soma ao bônus existente da especialização v0.3, sem multiplicadores novos. Edifícios não recebem uma segunda sinergia.

GRANARY reduz o limiar local de crescimento, não produz food. MARKET/LIBRARY/WORKSHOP ficam inativos sem seu trabalhador. CULTURAL e CULTURAL_CENTER não exigem trabalhador. As fontes district, building e specialization permanecem separadas no breakdown.

MILITARY e BARRACKS apenas calculam `garrisonCapacity`. Não recrutam unidades, não gastam soldados, não atacam, não causam dano e não resolvem batalhas. O indicador é um dado para um sistema militar futuro.

## Integridade

Snapshots validam slots, unicidade, desenvolvimento, distrito obrigatório e rodadas coerentes (edifício não antecede distrito). A administração derivada é atualizada após cada comando. Testes cobrem efeitos ativos/inativos, custos, duplicatas, autorização, fases, versões, limiares e overflow.

# V4 Gap Map — canônico proposto × Alpha atual

**Base:** `feature/aoh-playable-alpha-v1` @ `547ff39`. Canônico = `canonical-product-spec-v4-draft.md`; se depender de uma decisão, o ID aparece entre colchetes.

**Status:**
- **IMPLEMENTADO**: existe e se comporta como proposto.
- **PARCIAL**: existe, mas simplificado.
- **NÃO IMPLEMENTADO**: não existe.
- **DIVERGENTE**: existe com outra regra.
- **REMOVER/CONSOLIDAR**: existe e deve sair ou fundir-se.

**Prioridade:** A antes do Alpha externo · B Experience V2 · C Beta · D futuro.

## Rodada e ritmo

| Canônico proposto | Alpha atual | Status | Prior. |
|---|---|---|---|
| 8 fases nomeadas, resolução por iniciativa | igual (`AlphaRoundPhaseSchema`, `advanceAfterReady`) | IMPLEMENTADO | — |
| 2 fases interativas + replay por etapa [DEC-004] | 2 interativas; replay em painel único | PARCIAL | B |
| Comandos de fase inalcançáveis removidos | `LEGAL_COMMANDS` de Ações urbanas/Diplomacia nunca rodam | REMOVER/CONSOLIDAR | C |
| Orçamento de ações 5–10 honesto [DEC-018] | fixo; efeitos "+Comando" sem efeito | DIVERGENTE | **A** |
| Voltar a planejar, checagem antes de confirmar | sim | IMPLEMENTADO | — |
| Durações com papel de vitória por modo [DEC-003] | 9/15/20; Hegemonia inalcançável em Rápida | DIVERGENTE | A (comunicar) / C (regra) |
| Voto de Ritmo, assíncrono | prazo por fase só | NÃO IMPLEMENTADO | D |

## Mapa e mundo

| Canônico proposto | Alpha atual | Status | Prior. |
|---|---|---|---|
| "Hex" = célula; "região" = bloco de 7 [DEC-010] | código usa assim; Bíblia usa "região" = célula | DIVERGENTE (Bíblia) | B (termo) |
| Mapa fixo 210 hexes no Alpha | igual | IMPLEMENTADO | — |
| Três estados de névoa distintos na UI | "conhecido" sem estilo próprio | PARCIAL | **B** |
| Minimapa, camadas, caminho e setas desenhados | ausentes | NÃO IMPLEMENTADO | **B** |
| Descobertas (ruína, jazida, terra fértil…) | só depósito de Metal; RIVER/FERTILE/FISH nunca gerados | NÃO IMPLEMENTADO | D |
| Tamanhos por nº de jogadores, arquétipos | 4 predefinições | PARCIAL | D |
| Raio de revelação por Teia | região inteira, sem aumento | NÃO IMPLEMENTADO | C |
| Rotação não desloca depósito de Metal para terreno inválido | desloca | DIVERGENTE (bug) | C |
| Contato confiável em 6p [DEC-020] | 59/72 civilizações na simulação | PARCIAL | C (medir antes) |

## Civilizações

| Canônico proposto | Alpha atual | Status | Prior. |
|---|---|---|---|
| 12 civilizações com líder [DEC-011] | igual | IMPLEMENTADO | — |
| Ênfase descrita com 7 recursos | "Materiais" no texto de ênfase | DIVERGENTE | **A** |
| Habilidade de civilização 1×/era [DEC-011] | 1×/rodada | DIVERGENTE | C |
| Habilidades de líder com efeito | Comando (Merídia, Orinth) e Coesão (Kor, Elyra) sem efeito | DIVERGENTE | **A** |
| Kits iniciais e limitações | iguais para todos | NÃO IMPLEMENTADO | C |
| Civilizações 13–18, unidades exclusivas | — | NÃO IMPLEMENTADO | D |

## Cidades e população

| Canônico proposto | Alpha atual | Status | Prior. |
|---|---|---|---|
| Uma progressão: Nível 1–7 [DEC-002] | Desenvolvimento 1–5 (regras) + Nível 1–7 (rótulo) | REMOVER/CONSOLIDAR | B (desenho) / C (regra) |
| 1 ação por cidade, Produzir obrigatório para produzir | igual | IMPLEMENTADO | — |
| Crescimento sem microgestão, ritmo lento [DEC-007] | cidade inicial não cresce sem mudar papéis | DIVERGENTE | C (após métricas) |
| Previsão de crescimento = regra do motor | a previsão por cidade inclui ON_PRODUCE; o motor é civilizacional e sem ON_PRODUCE | DIVERGENTE (bug UI) | **A** |
| Ânimo com causas de queda [DEC-022] | só sobe; Exultante inalcançável | PARCIAL | C |
| Coesão com efeito ou fora [DEC-016/022] | sem efeito | REMOVER/CONSOLIDAR | **A** (UI) / C |
| Soldado com função | sem efeito | PARCIAL | C |
| Integração de ocupada | Ação cívica, +25% | IMPLEMENTADO | — |
| Reparo de fortificação | inexistente | NÃO IMPLEMENTADO | C |
| "Guarnição" com um só sentido | 3 sentidos | REMOVER/CONSOLIDAR | B (termo) |

## Economia

| Canônico proposto | Alpha atual | Status | Prior. |
|---|---|---|---|
| 7 recursos, sem "Materiais" na UI | 7 na barra; "Materiais" em tratados, Crônicas e ênfase | PARCIAL | **A** |
| Pool legado eliminado internamente | espelhado (`syncLegacyResources`) | REMOVER/CONSOLIDAR | C |
| Armazém civilizacional por Nível [DEC-008] | por cidade × nº de cidades | DIVERGENTE | C |
| Armazém, Tesouro e Banco construíveis | só no esquema | NÃO IMPLEMENTADO | C |
| Mercado e Banco (monetizar, converter) | — | NÃO IMPLEMENTADO | C |
| Substituição por Riqueza até 50% | igual (arredonda para baixo) | IMPLEMENTADO | — |
| Renda de rota passiva + amplificação [DEC-019] | só via Sustentar comércio | DIVERGENTE | C |
| Administração e sobre-extensão | igual | IMPLEMENTADO | — |

## Teia, edifícios, distritos

| Canônico proposto | Alpha atual | Status | Prior. |
|---|---|---|---|
| Teia qualitativa (desbloqueios) [DEC-012] | 50 nós de bônus; 4 desbloqueios de pilha | DIVERGENTE | C |
| Efeitos dos nós sempre ativos | 5 nós de Comando sem efeito | DIVERGENTE | **A** |
| Teia em grafo navegável | grade de cartões | PARCIAL | **B** |
| Catálogo de edifícios ligado à Teia [DEC-013] | 7 construíveis | PARCIAL | C |
| 22 edifícios do esquema Alpha sem uso; distrito Marítimo | órfãos | REMOVER/CONSOLIDAR | C |
| Vagas de edifício por Nível | edifícios não ocupam vaga | NÃO IMPLEMENTADO | C |
| Regra 1 melhoria produtiva + 1 de infraestrutura | — | NÃO IMPLEMENTADO | D |
| Estrada útil para suprimento | só em território próprio (redundante) | DIVERGENTE | C |

## Militar e naval

| Canônico proposto | Alpha atual | Status | Prior. |
|---|---|---|---|
| Dado tático, posturas, fortificação com integridade, pilhas | igual | IMPLEMENTADO | — |
| Chamada de Conflitos só para as partes | igual | IMPLEMENTADO | — |
| Suprimento progressivo com efeito proporcional [DEC-009] | raio 3 fixo, −2 por lado | DIVERGENTE | C |
| Escalas e Modernização | 9 classes fixas | NÃO IMPLEMENTADO | C |
| Até 3 choques por batalha | 1 choque | DIVERGENTE | C |
| Peças civis não morrem primeiro | morrem primeiro | DIVERGENTE | C |
| Guarda com bônus defendendo cidade | bônus só no ataque | DIVERGENTE | C |
| Frota com caminho real ou escondida [DEC-014] | capitais em Planície → Frota inalcançável | DIVERGENTE | **A** |
| Naval: transporte e bloqueio | — | NÃO IMPLEMENTADO | C |
| Naval completo (7 navios, missões, naufrágio) | — | NÃO IMPLEMENTADO | D |
| Setas de ataque, prévia no mapa | prévia no Inspetor | PARCIAL | B |

## Diplomacia e comércio

| Canônico proposto | Alpha atual | Status | Prior. |
|---|---|---|---|
| 6 tratados com efeitos | igual | IMPLEMENTADO | — |
| PNA impede declarar guerra? [DEC-015] | não impede | [DEC-015] | B (decisão) |
| Embargo unilateral? [DEC-015] | exige aceite | [DEC-015] | C |
| Ofertas comerciais (4 tipos), calote | igual; `treatyTerms` ignorado | IMPLEMENTADO / REMOVER `treatyTerms` | C |
| Reputação | — | NÃO IMPLEMENTADO | C |
| Confiança e Tensão | — | NÃO IMPLEMENTADO (não recomendado) | — |
| Custo de Influência nos tratados | — | NÃO IMPLEMENTADO | C |
| Financiar a ação de outro jogador | — | NÃO IMPLEMENTADO | C |
| Rotas desenhadas no mapa | não | NÃO IMPLEMENTADO | B |

## Cultura e povos

| Canônico proposto | Alpha atual | Status | Prior. |
|---|---|---|---|
| Influência / Presença / Prestígio separados [DEC-016] | separados no código; sobreposição na linguagem | PARCIAL | B (termo) |
| Disputa possível em 2p [DEC-016] | só entre duas estrangeiras | DIVERGENTE | **A** (comunicar) / C |
| Legado Cultural | — | NÃO IMPLEMENTADO | D |
| Camada cultural no mapa | — | NÃO IMPLEMENTADO | B |
| Povos com 6 interações | igual; atitude só sobe; Proteger sem efeito; Conquistar sem guerra | PARCIAL | C |
| Bandos atacáveis; movimento por gatilho | inatacáveis; andam sempre | DIVERGENTE | C |

## Cartas, eventos, projetos

| Canônico proposto | Alpha atual | Status | Prior. |
|---|---|---|---|
| Pulso (clima) e Evento (decisão) distintos [DEC-017] | dois sistemas com nomes próximos | PARCIAL | B (termo) |
| Cartas sempre com efeito | 5 estratégias e 2 conselheiros de Comando sem efeito | DIVERGENTE | **A** |
| Baralhos reembaralham | estratégia e ambição não reembaralham (secam em 6p) | DIVERGENTE | **A** |
| Pulso condicional com severidade | ±recurso para todos; 2 cartas sem efeito | PARCIAL | C |
| Obras de Legado com efeito único e etapas | 12 projetos genéricos de 1 etapa | PARCIAL | C |
| Táticas e Encontros | — | NÃO IMPLEMENTADO | D |

## Governos, eras, vitória

| Canônico proposto | Alpha atual | Status | Prior. |
|---|---|---|---|
| Governos sem efeitos fantasmas [DEC-021] | campos `future*` lidos em lugar nenhum; a doc os anuncia | DIVERGENTE | **A** (UI/doc) |
| 7 governos, adoção por era, reforma | 5, adoção a qualquer hora, definitiva | PARCIAL | C |
| Eras por critérios contados | igual | IMPLEMENTADO | — |
| Nº e nome das eras [DEC-005] | 6, a VI chama-se Hegemonia | [DEC-005] | **B** |
| Metas de Hegemonia escaladas [DEC-006] | fixas (exceto Territorial por duração) | DIVERGENTE | C |
| Prestígio por marcos únicos | parcial (sem conquista/fundação) | PARCIAL | C |
| Tela final com ranking e desempate | igual | IMPLEMENTADO | — |
| Modo de vitória configurável | — | NÃO IMPLEMENTADO | C |

## Interface (Canvas × Alpha)

| Canônico proposto | Alpha atual | Status | Prior. |
|---|---|---|---|
| Shell em tela cheia: Conselho, mapa, Inspetor e barra de fase | igual (≥901 px) | IMPLEMENTADO | — |
| Barra global: recursos e tetos, Administração, ações, Prestígio, era/rodada/fase | igual | IMPLEMENTADO | — |
| Alertas de pendência por aba | sim | IMPLEMENTADO | — |
| Abas Cidades, Guerra e Cultura (Canvas) | não existem (conteúdo no Inspetor/Crônicas) | DIVERGENTE | B (decidir arquitetura) |
| Menu de contexto sobre o mapa | ordens no Inspetor | PARCIAL | B |
| Gaveta da cidade com tabuleiro de distritos e escada de níveis | painel lateral textual | PARCIAL | B |
| Ranking de Prestígio durante a partida | só no fim | NÃO IMPLEMENTADO | B |
| "Caminho de Hegemonia mais próximo" | — | NÃO IMPLEMENTADO | B |
| Onboarding sobre o tabuleiro (coach marks) | modal "Como jogar" | PARCIAL | B |
| Compêndio pesquisável com glossário | — | NÃO IMPLEMENTADO | B |
| Tela inicial com mesas recentes | retoma só a última mesa | PARCIAL | B |
| Criação com cartões visuais e prévia do mundo | selects | PARCIAL | B |
| Lobby em mesa, seleção de civ com detalhe | lista/grade com ênfase, capital e líder | PARCIAL | B |
| Responsivo: gavetas no tablet, abas no celular | barra de fase fixa ≤900 px; resto empilhado | PARCIAL | B |
| Feedback de consequência (resultado da rodada) | painel de resolução + Crônicas | IMPLEMENTADO (camada CONSEQUENCE a formalizar) | B |

## Documentação e telemetria

| Canônico proposto | Alpha atual | Status | Prior. |
|---|---|---|---|
| Uma doc de regras atual | `docs/glossary.md`, `rules-reference.md`, `player-guide.md` descrevem a fatia antiga | REMOVER/CONSOLIDAR | **A** |
| Telemetria para as métricas de DEC-003/007/018/020 | contadores declarados e nunca escritos | PARCIAL | **A**/C |

## Correção à auditoria de 2026-10-03

`docs/audit/concept-vs-alpha-2026-10-03.md` compara "30 regiões" do Alpha com "37–127 regiões" da Bíblia como se fossem a mesma unidade. Não são: a "região" da Bíblia é uma célula. Ver DEC-010.

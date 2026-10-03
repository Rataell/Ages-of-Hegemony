# V4 Gap Map — canônico × Alpha atual

**Base**
- Código: `feature/aoh-playable-alpha-v1` @ `547ff39`. Desde então só mudou documentação.
- Canônico: `canonical-product-spec-v4-draft.md`.
- Decisões aprovadas em 2026-10-03: DEC-001, DEC-002, DEC-004, DEC-005 (com alteração), DEC-010. As outras aparecem como `[DEC-xxx]`, abertas.

**Status**

| Status | Significado |
|---|---|
| IMPLEMENTADO | existe e se comporta como o canônico |
| PARCIAL | existe, mas simplificado |
| NÃO IMPLEMENTADO | não existe |
| DIVERGENTE | existe com outra regra que o canônico |
| **INERTE** | existe no modelo/código (e às vezes na UI), mas não produz efeito estratégico relevante |
| **INCONSISTENTE** | UI, documentação e/ou motor expressam comportamentos diferentes |
| REMOVER/CONSOLIDAR | existe e deve sair ou fundir-se |

**Prioridade:** A antes do Alpha externo · B Experience V2 · C Beta · D futuro. Lacunas de conteúdo (naval completo, edifícios extras, civilizações 13–18, Mercado/Banco, Legado, novas cartas, mapas) **não** são correções.

---

## Alpha correctness before Experience V2

Só problemas de correção/integridade do que **já está exposto** no Alpha, a resolver antes da reconstrução visual. Nenhum foi corrigido ainda (aguarda aprovação). Lacunas de conteúdo ficam de fora.

### P0 — comportamento incorreto, UI enganosa ou violação de regra

| ID | Problema | Evidência | Status |
|---|---|---|---|
| P0-1 | **Efeitos de Comando prometem +ações e não dão nada.** 5 cartas de estratégia (jogáveis, consomem carta), 2 conselheiros (contratação paga com recursos), as habilidades de líder de Merídia e Orinth (1×/era) e 5 avanços de Sociedade. O texto da UI diz "+N Ações principais" | `alphaActionCapacity` retorna `actionsPerRound` fixo (`ge/alpha-actions.ts:12`) | INERTE + INCONSISTENTE [DEC-018] |
| P0-2 | **Previsão de crescimento da cidade diverge do motor.** A UI calcula por cidade e soma ON_PRODUCE; o motor usa a produção da civilização inteira sem ON_PRODUCE e conta comida que o armazém descartará | `apps/server/src/alpha-projection.ts` (cityDetails) × `ge/alpha-phases.ts:195-206` | INCONSISTENTE |
| P0-3 | **"Materiais" aparece como recurso** (ofertas dentro de tratados, ênfase da civilização, tabela das Crônicas), mas o jogador tem Madeira/Pedra/Metal e o custo é dividido por regra oculta | `ResourceDealSchema` legado; `CIVILIZATIONS.bias`; `AlphaReports` usa `RESOURCE_KEYS` | INCONSISTENTE |
| P0-4 | **A rotação na exploração move o terreno mas não o depósito de Metal**; o depósito pode cair em hex onde a Mina é proibida (recurso perdido) | `ge/alpha-world.ts:115-120` (features não giram) | INCONSISTENTE (regra) |
| P0-5 | **A Guarda é descrita como "Defesa de cidades e fortificações"**, mas o bônus de cidade (+2) só vale quando ela **ataca** uma cidade | `gd/alpha-catalog.ts:22`, `ge/alpha-combat.ts:58` | INCONSISTENTE |

### P1 — sistema exposto, porém inerte

| ID | Problema | Evidência | Status |
|---|---|---|---|
| P1-1 | **Coesão local:** exibida e alterada (Ação cívica, disputa), sem consumidor em regra. As habilidades de líder de Kor e Elyra (+15 Coesão) não têm efeito estratégico | só escrita em `ge/alpha-culture.ts:97`, `ge/alpha-urban.ts:299`, `ge/alpha-leaders.ts:56` | INERTE [DEC-016/022] |
| P1-2 | **Ânimo:** só sobe. Revolta, Desânimo e Inquietação (0–2) são inalcançáveis, salvo povos conquistados (iniciam em 1); Exultante (6) é inalcançável (teto 5). A UI expõe a escala inteira | nenhum código reduz o ânimo | INERTE (parcial) [DEC-022] |
| P1-3 | **Frota:** listada em Recrutar a partir da Expansão; exige cidade em Costa, e todas as capitais iniciais ficam em Planície | `ge/alpha-military.ts:10-23`, `gd/alpha-regions.ts` | INERTE na prática [DEC-014] |
| P1-4 | **Disputa cultural** impossível em 2 jogadores (exige duas presenças estrangeiras); o guia a menciona | `ge/alpha-culture.ts:71-79` | INERTE em 2p [DEC-016] |
| P1-5 | **Hegemonia em partida Rápida:** a aba mostra caminhos e "Declarar", mas a sexta era é inalcançável em 9 rodadas | ritmo observado (era III na rodada 6) | INERTE em Rápida [DEC-003/006] |
| P1-6 | **Baralhos de estratégia e ambição** não reembaralham; com 6 jogadores a compra seca por volta da rodada 3 e a mão para de renovar | `ge/alpha-cards.ts:7-23` | INERTE (após esgotar) |
| P1-7 | **Proteger povo independente:** ação paga e exposta; `protectorId` não tem efeito | `ge/alpha-independents.ts` | INERTE |
| P1-8 | **Atitudes Hostil e Desconfiado:** descritas na UI ("Negociar…"), nunca ocorrem (todos começam Neutros e só melhoram) | `ge/alpha-world.ts:72` | INERTE |
| P1-9 | **Pulso do mundo:** "Bandos em marcha" e "Refugiados da fronteira" sem efeito ("sem efeito nos recursos") | `gd/alpha-concept.ts:191,197` | INERTE |
| P1-10 | **Papel Soldado:** alocável, sem efeito (a UI o chama de "Guarnição militar da cidade") | `ge/economy.ts`; `gd/rules.ts` | INERTE |

### P2 — dívida técnica ou documentação

| ID | Problema | Evidência | Status |
|---|---|---|---|
| P2-1 | **Efeitos `future*` de governo e especialização** (Rep./Olig./Teoc.: +10% Conhecimento/Influência etc.; especializações Militar/Cultural) existem nos dados e são anunciados na documentação antiga; nunca são lidos. A UI do Alpha não os mostra | `gd/rules.ts:76-78` | INERTE + INCONSISTENTE (doc) [DEC-021] |
| P2-2 | **Documentação antiga** (`docs/glossary.md`, `docs/rules-reference.md`, `docs/player-guide.md`, `docs/compendium.md`): 5 fases, 5 recursos, Desenvolvimento como nível | — | INCONSISTENTE |
| P2-3 | **Telemetria** declara contadores nunca escritos (batalhas, capturas, declarações de Hegemonia, `prestigeBySource`…); necessários para as métricas de DEC-003/007/018/020 | `AlphaTelemetrySchema` (`gd/alpha-concept.ts:301`) | INERTE |
| P2-4 | **`LEGAL_COMMANDS` de Ações urbanas e Diplomacia** nunca executam (fases não interativas) | `ge/alpha-phases.ts:47-56` | INERTE / REMOVER |
| P2-5 | **`treatyTerms`** aceito nas ofertas e ignorado | `ge/alpha-trade.ts` | INERTE / REMOVER |
| P2-6 | **Pool legado de 5 recursos espelhado** (`syncLegacyResources`); +1 Material ímpar vira sempre Madeira | `ge/alpha-resources.ts:53`, `gd/alpha-concept.ts:32` | REMOVER/CONSOLIDAR |
| P2-7 | **Código de crescimento duplicado** (Alpha × core) | `ge/alpha-phases.ts:195` × `ge/maintenance.ts:22` | REMOVER/CONSOLIDAR |
| P2-8 | **Configurações nunca lidas:** `overflowRule`, `cultureDice`, `metalAccessDistance`, `MoodStateSchema`, `GovernmentCatalogSchema` | `gd/alpha-concept.ts` | INERTE |
| P2-9 | **MANAGE FOUND_CITY** não é bloqueado e falharia com erro genérico de integridade (sem uso pela UI) | `ge/alpha-turn.ts:65` | INCONSISTENTE (API) |
| P2-10 | **Penalidade de −5** por falta de manutenção de peças é um literal no código, não uma regra configurável | `ge/alpha-phases.ts:220` | dívida |

---

## Mapa completo por sistema

### Rodada e ritmo

| Canônico | Alpha atual | Status | Prior. |
|---|---|---|---|
| 8 fases; Planejamento e Conflitos interativas; as demais automáticas com consequências claras (DEC-004) | igual | IMPLEMENTADO | — |
| "Uma fase do motor não é uma tela" (DEC-004) | a UI tem painel de resolução único | PARCIAL | B |
| Orçamento de ações honesto [DEC-018] | fixo; "+Comando" sem efeito | INERTE (P0-1) | A |
| Durações com papel de vitória por modo [DEC-003] | 9/15/20; Hegemonia inalcançável na Rápida | INERTE na Rápida (P1-5) | A (comunicar) / C |
| Voltar a planejar, checagem antes de confirmar | sim | IMPLEMENTADO | — |
| Voto de Ritmo, assíncrono | prazo por fase | NÃO IMPLEMENTADO | D |

### Mapa e mundo

| Canônico | Alpha atual | Status | Prior. |
|---|---|---|---|
| Hexágono = célula; região = 7 hexágonos; território = hexágonos controlados (DEC-010) | o código usa assim | IMPLEMENTADO | — |
| Mapa fixo de 210 hexágonos no Alpha | igual | IMPLEMENTADO | — |
| Três estados de névoa distintos na UI | "conhecido" sem estilo próprio | PARCIAL | B |
| Minimapa, camadas, caminho e setas desenhados | ausentes | NÃO IMPLEMENTADO | B |
| Depósito acompanha a rotação | não acompanha | INCONSISTENTE (P0-4) | A |
| Descobertas; tamanhos em hexágonos por nº de jogadores; arquétipos | — | NÃO IMPLEMENTADO | D |
| Raio de revelação por Teia | — | NÃO IMPLEMENTADO | C |
| Contato confiável em 6p [DEC-020] | 59/72 na simulação | PARCIAL | C (medir) |

### Civilizações

| Canônico | Alpha atual | Status | Prior. |
|---|---|---|---|
| 12 civilizações com líder [DEC-011] | igual | IMPLEMENTADO | — |
| Ênfase descrita nos 7 recursos | "Materiais" | INCONSISTENTE (P0-3) | A |
| Habilidades de líder com efeito | Comando (P0-1) e Coesão (P1-1) | INERTE | A |
| Habilidade de civilização 1×/era [DEC-011] | 1×/rodada | DIVERGENTE | C |
| Kits e limitações; civilizações 13–18; unidades exclusivas | — | NÃO IMPLEMENTADO | C/D |

### Cidades e população

| Canônico | Alpha atual | Status | Prior. |
|---|---|---|---|
| **Nível 1–7 como única progressão**, composto por população + infraestrutura/requisitos + investimento (DEC-002) | Desenvolvimento 1–5 (regras) + Nível 1–7 (rótulo só por população) | DIVERGENTE / REMOVER Desenvolvimento como conceito público | B (UI) / C (regra) |
| 1 ação por cidade; sem Produzir não produz | igual | IMPLEMENTADO | — |
| Previsão de crescimento = regra do motor | diverge | INCONSISTENTE (P0-2) | A |
| Crescimento sem microgestão [DEC-007] | a cidade inicial não cresce sem mudança | DIVERGENTE | C (após métricas) |
| Ânimo com causas de queda [DEC-022] | só sobe | INERTE parcial (P1-2) | A (UI) / C |
| Coesão com efeito ou fora [DEC-016/022] | sem efeito | INERTE (P1-1) | A |
| Soldado com função | sem efeito | INERTE (P1-10) | A (UI) / C |
| "Guarnição" com um só sentido | 3 sentidos | REMOVER/CONSOLIDAR (termo) | B |
| Integração de cidade ocupada | Ação cívica +25% | IMPLEMENTADO | — |
| Reparo de fortificação | — | NÃO IMPLEMENTADO | C |

### Economia

| Canônico | Alpha atual | Status | Prior. |
|---|---|---|---|
| 7 recursos; "Materiais" fora da UI | parcial | INCONSISTENTE (P0-3) | A |
| Pool legado eliminado | espelhado | REMOVER/CONSOLIDAR (P2-6) | C |
| Armazém civilizacional por Nível [DEC-008] | por cidade × nº de cidades | DIVERGENTE | C |
| Substituição por Riqueza ≤50% | igual | IMPLEMENTADO | — |
| Renda de rota passiva + amplificação [DEC-019] | só "Sustentar comércio" | DIVERGENTE | C |
| Administração e sobre-extensão | igual | IMPLEMENTADO | — |
| Mercado/Banco; Armazém/Tesouro/Banco construíveis | — | NÃO IMPLEMENTADO (conteúdo) | C |

### Teia, edifícios, distritos

| Canônico | Alpha atual | Status | Prior. |
|---|---|---|---|
| Teia qualitativa [DEC-012] | 50 nós de bônus; 4 desbloqueios de pilha | DIVERGENTE | C |
| Nós sempre com efeito | 5 nós de Comando | INERTE (P0-1) | A |
| Teia em grafo | grade | PARCIAL | B |
| Catálogo de edifícios ligado à Teia [DEC-013] | 7 construíveis | PARCIAL | C |
| 22 edifícios do esquema e distrito Marítimo | órfãos | REMOVER/CONSOLIDAR (conteúdo, não correção) | C |
| Estrada útil para suprimento [DEC-009] | redundante | DIVERGENTE | C |

### Militar e naval

| Canônico | Alpha atual | Status | Prior. |
|---|---|---|---|
| Dado tático, posturas, fortificação, pilhas, chamada de Conflitos | igual | IMPLEMENTADO | — |
| Descrição da Guarda = regra | diverge | INCONSISTENTE (P0-5) | A |
| Frota com caminho real ou oculta [DEC-014] | inalcançável | INERTE (P1-3) | A |
| Suprimento progressivo [DEC-009]; escalas; até 3 choques; civis não morrem primeiro | — | DIVERGENTE / NÃO IMPLEMENTADO | C |
| Naval (transporte, bloqueio; depois completo) | — | NÃO IMPLEMENTADO | C/D |

### Diplomacia e comércio

| Canônico | Alpha atual | Status | Prior. |
|---|---|---|---|
| 6 tratados; ofertas comerciais (4 tipos); calote | igual | IMPLEMENTADO | — |
| `treatyTerms` | ignorado | INERTE (P2-5) | C |
| PNA impede guerra? Embargo unilateral? [DEC-015] | não / exige aceite | aberto | C |
| Reputação; custo de Influência; financiar a ação de outro jogador | — | NÃO IMPLEMENTADO | C |
| Rotas desenhadas | não | NÃO IMPLEMENTADO | B |

### Cultura e povos

| Canônico | Alpha atual | Status | Prior. |
|---|---|---|---|
| Influência / Presença / Prestígio separados [DEC-016] | separados no código; linguagem sobreposta | PARCIAL | B (termo) |
| Disputa possível em 2p [DEC-016] | impossível | INERTE em 2p (P1-4) | A (comunicar) / C |
| Proteger com efeito | sem efeito | INERTE (P1-7) | A (UI) / C |
| Atitudes variadas | só Neutro → Amistoso | INERTE (P1-8) | C |
| Bandos atacáveis e por gatilho | inatacáveis; andam sempre | DIVERGENTE | C |
| Camada cultural no mapa | — | NÃO IMPLEMENTADO | B |
| Legado Cultural | — | NÃO IMPLEMENTADO (conteúdo) | D |

### Cartas, eventos, projetos

| Canônico | Alpha atual | Status | Prior. |
|---|---|---|---|
| Pulso e Evento distintos [DEC-017] | nomes próximos | PARCIAL | B (termo) |
| Cartas sempre com efeito | Comando (P0-1); Pulso nulo (P1-9) | INERTE | A |
| Baralhos reembaralham | não (P1-6) | INERTE (após esgotar) | A |
| Pulso condicional; Obras com efeito e etapas | genérico | PARCIAL | C |
| Táticas e Encontros | — | NÃO IMPLEMENTADO (conteúdo) | D |

### Governos, eras, vitória

| Canônico | Alpha atual | Status | Prior. |
|---|---|---|---|
| Governos sem efeitos fantasmas [DEC-021] | `future*` | INERTE + INCONSISTENTE doc (P2-1) | A (doc) |
| 7 governos, adoção por era, reforma | 5, definitivos | PARCIAL | C |
| **6 eras de progressão; Hegemonia não é era** (DEC-005) | 6 eras com a VI chamada Hegemonia, sem avanços, só para declarar | DIVERGENTE | B (UI/termo) / C (regra) |
| Nomes das Eras V/VI [DEC-023] | V Ascensão, VI Hegemonia | aberto | B |
| Eras por critérios contados | igual | IMPLEMENTADO | — |
| Metas de Hegemonia escaladas [DEC-006] | fixas | DIVERGENTE | C |
| Prestígio por marcos únicos; modo de vitória configurável | parcial | PARCIAL | C |
| Tela final com ranking e desempate | igual | IMPLEMENTADO | — |

### Interface (Canvas × Alpha)

| Canônico | Alpha atual | Status | Prior. |
|---|---|---|---|
| Shell em tela cheia, barra global, alertas por aba | sim | IMPLEMENTADO | — |
| Nível único na UI (sem "Desenvolvimento") | ambos exibidos | DIVERGENTE (DEC-002) | B |
| Linha das eras sem "Hegemonia" como era | exibe Hegemonia como era 6 | DIVERGENTE (DEC-005) | B |
| Abas Cidades, Guerra, Cultura (Canvas) | conteúdo no Inspetor/Crônicas | DIVERGENTE | B (arquitetura) |
| Menu de contexto no mapa; gaveta da cidade | Inspetor lateral | PARCIAL | B |
| Ranking ao vivo; caminho de Hegemonia mais próximo | — | NÃO IMPLEMENTADO | B |
| Onboarding sobre o tabuleiro; compêndio pesquisável | modal "Como jogar" | PARCIAL | B |
| Telas de entrada (mesas recentes, criação visual, lobby em mesa, detalhe de civ) | funcionais, simples | PARCIAL | B |
| Responsivo (gavetas, abas no celular) | barra de fase fixa | PARCIAL | B |
| Camada CONSEQUÊNCIA (resultado da rodada) | painel + Crônicas | PARCIAL | B |

### Documentação e telemetria

| Canônico | Alpha atual | Status | Prior. |
|---|---|---|---|
| Uma doc de regras atual | docs da fatia antiga | INCONSISTENTE (P2-2) | A |
| Telemetria para métricas | contadores nunca escritos | INERTE (P2-3) | A/C |

---

## Correção à auditoria de 2026-10-03

`docs/audit/concept-vs-alpha-2026-10-03.md` comparou "30 regiões" com "37–127 regiões" da Bíblia. Pela terminologia aprovada (DEC-010), a "região" da Bíblia era uma célula (hexágono). Em hexágonos, o Alpha tem 210.

# Correção semântica do Alpha antes da Experience/UI V2 — 2026-10-03

Branch `fix/aoh-alpha-correctness-pre-v2`, a partir de `1b07a82`. Commits apenas locais (sem push, merge ou deploy).
Fontes de regra: decisões aprovadas no [registro de decisões](product/product-owner-decision-register.md), [especificação V4](product/canonical-product-spec-v4-draft.md) e [mapa de lacunas](product/v4-gap-map.md).

Nenhuma correção mudou consumo, limiares, custos, valores de combate ou o balanceamento da economia.

## Decisões incorporadas

- **DEC-023 (aprovada):** eras I Fundação, II Expansão, III Civilização, IV Impérios, V Potências, VI Ascensão. "Hegemonia" não é era. A Teia não foi redistribuída. A UI do Alpha passou a mostrar esses nomes; os identificadores internos (`ASCENSION` = Era V, `HEGEMONY` = Era VI) não mudaram.
- **DEC-006 (aprovada na parte da declaração):** requisitos são construídos e contados a partir de qualquer era; a declaração só ocorre na Era VI (Ascensão). Partida curta pode terminar por Prestígio. A escala das metas segue aberta.

## P0

### P0-1 — Comando / +Ações principais (`95752e9`)

- **Antes:** cartas de estratégia de Comando, os conselheiros 15 e 16, as habilidades de líder de Merídia e Orinth e os avanços de Comando anunciavam "+N Ações principais" e o limite da rodada continuava fixo.
- **Reprodução:** contratar `advisor-15` ou pesquisar `adv-1-2-2`; o contador da rodada continuava em 7.
- **Causa:** `alphaActionCapacity` devolvia `actionsPerRound` sem ler nenhum modificador.
- **Correção:** limite = base da partida + diferença do governo (`commandPointsDelta`, ex.: Confederação −1) + `institutionBonus(…, 'COMMAND')`. Esse bônus já respeita duração (efeitos temporários valem só na rodada), escopo e jogador, e cada fonte conta uma vez. O servidor calcula; a projeção mostra o mesmo número.
- **Teste:** `tests/alpha-command-actions.test.ts` (base e projeção iguais; avanço e conselheiro permanentes; carta só na rodada e uma vez; gasto até o novo limite e recusa `ACTION_LIMIT` depois; Confederação). Ajuste em `tests/alpha-leaders.test.ts`, que antes fixava o efeito inerte.
- **Agora:** todo modificador de +Ações conteúdo existente altera o limite real.
- **Adiado:** nada.

### P0-2 — Previsão de crescimento (`93ce41f`)

- **Antes:** o painel da cidade dizia "Com Produzir: +X Alimento; a população come Y… cresce em N rodadas", calculado por cidade e somando bônus ON_PRODUCE. A manutenção calcula a sobra da civilização inteira, só com o Alimento do Produzir, e a divide entre as cidades abaixo do teto.
- **Reprodução:** com duas cidades, ou com um conselheiro de Alimento ON_PRODUCE, a previsão e o crescimento real diferiam.
- **Causa:** duas implementações da regra (manutenção e projeção).
- **Correção:** `packages/game-engine/src/alpha-growth.ts` é a fonte única: `growthShares` (divisão), `growCity` (progresso, limiar, +1 por rodada no máximo, teto) e `growthForecast` (previsão supondo que todas as cidades próprias não ocupadas Produzem). A manutenção usa `growthShares`/`growCity`; a projeção expõe `cityDetails[].growth` (sem nova chave de topo); a UI explica que a sobra é da civilização e dividida.
- **Teste:** `tests/alpha-growth-forecast.test.ts`: cidade inicial; hex de Alimento trabalhado; progresso acumulado abaixo do limiar; cruzamento do limiar quando a previsão diz 1 rodada; fome (sem crescimento); divisão entre cidades; projeção igual à previsão. Cada caso roda a rodada real e compara com a previsão.
- **Agora:** previsão, projeção, UI e manutenção usam a mesma regra.
- **Registrado, sem mudança:** o motor conta para o crescimento o Alimento produzido mesmo que o armazém cheio o descarte depois. É a regra atual; a previsão a segue. Mudá-la seria balanceamento.

### P0-3 — "Materiais" (`c3901c9`)

Classificação das ocorrências:

| Ocorrência | Classe | Tratamento |
|---|---|---|
| Campo "Materiais" na troca de recursos dos tratados | C | O acordo passou a usar os 7 recursos. Antes, o pagador pagava Madeira→Pedra→Metal e o recebedor ganhava ⌈m/2⌉ Madeira e ⌊m/2⌋ Pedra (o valor mudava de tipo). Tratados salvos no formato antigo são lidos com a mesma divisão. |
| Ênfase da civilização ("Ênfase em Materiais") | C | "Madeira e Pedra" (o que o efeito credita). |
| Efeitos de produção (avanços, conselheiros, passivas) mostrados como "+1 Materiais" | C | Mostram o que creditam (`alphaGainOf`: +1 Madeira; +3 → +2 Madeira, +1 Pedra). |
| Textos das opções urbanas (Produzir, pesquisa) | C | Rendimento convertido para os 7 recursos; contribuições de edifícios aparecem como "Madeira/Pedra". |
| Tabela "Economia da cidade" e rendimento do hex | C | Coluna/ícone rotulado "Madeira/Pedra", com a regra da divisão explicada. |
| Tabela das Crônicas (livro-razão da rodada) | C | Coluna rotulada "Madeira + Pedra + Metal": o livro-razão ainda agrega os três. |
| Pool legado interno (`syncLegacyResources`, custos autorais em materiais) | B | Mantido: removê-lo exige reescrever custos e o livro-razão (P2-6). Não aparece como recurso. |
| Página raiz `/` (protótipo legado de 5 recursos, compêndio com custos em Materiais) | A no seu próprio modelo | Fora do Alpha; ver "Problemas adicionais". |

- **Teste:** `tests/alpha-materials-terminology.test.ts` (divisão; ênfases; opções urbanas e visão do jogador sem "Materiais" para todas as civilizações com efeito de materiais) e dois casos novos em `tests/alpha-diplomacy.test.ts` (troca de Pedra entregue como Pedra; tratado legado lido nos 7 recursos).
- **Adiado:** livro-razão em 7 recursos (exige migrar relatórios salvos) e custos autorais por recurso (balanceamento).

### P0-4 — Rotação de região (`2728e4d`)

- **Antes:** explorar uma região com giro rodava o terreno, mas o depósito de Metal ficava na posição original; podia cair em Planície, longe da Colina a que pertencia.
- **Causa:** `exploreRegion` girava só `terrain`; `features` não eram tocadas.
- **Correção:** `rotatedRegionContent` (domínio) mapeia terreno e depósito pelo mesmo índice para qualquer rotação; `rotatedRegionTiles` aplica o giro mantendo no lugar as sobreposições do preset e do corredor de contato, e o depósito segue a regra de criação (só em Colina/Montanha). Validação e exploração usam a mesma função; a guarda de terreno conhecido também recusa giros que mudariam um depósito já visto.
- **Teste:** `tests/alpha-world.test.ts`: as 6 rotações, para todas as regiões intocadas da partida, de forma determinística; e um caso integrado em que a exploração com giro move o depósito.
- **Agora:** terreno e depósito giram juntos.

### P0-5 — Guarda (`f1b803b`)

- **Fontes:** papel da Guarda no catálogo ("Defesa de cidades e fortificações"), família defensiva na Bíblia, e a instrução do PO: o bônus de cidade vale ao **defender**.
- **Antes:** o `cityModifier` da Guarda (+2) era somado como "Equipamento contra cidade" quando ela atacava e nunca quando defendia.
- **Correção:** cada classe declara o lado do modificador de cidade (`cityModifierSide`: Guarda `DEFENSE`; demais `ATTACK`, como o Cerco). Partidas salvas sem o campo resolvem pela classe. O defensor recebe "Guarda da cidade"; prévia e relatório de batalha usam o mesmo detalhamento. Valor inalterado.
- **Teste:** `tests/alpha-combat.test.ts`: Guarda defendendo cidade (+2), atacando (nada), em campo aberto (nada), Cerco atacando (+3), prévia igual, regra de partidas antigas.

## P1

### P1 corrigido

| ID | Classe | Correção |
|---|---|---|
| P1-6 Baralhos | A | A regra de compra (+1 carta por rodada até 5, a partida inteira) pressupõe continuidade. Quando o baralho de estratégia acaba, as estratégias descartadas voltam embaralhadas pela semente da partida, no momento da compra (`2065d62`; `tests/alpha-deck-reshuffle.test.ts`). Ambições são distribuídas uma vez (sem continuidade); o baralho de eventos mundiais (24) dura mais que a partida mais longa (20 rodadas, 1 evento a cada 2). |
| P1-10 Soldado (só texto) | B + texto | Nenhuma regra lê soldados. A descrição "Guarnição militar da cidade" era falsa; agora diz "Ainda sem efeito: não produz nem defende" (`27c9c7d`). A função continua decisão aberta. |

### P1 adiado

| ID | Classe | Motivo |
|---|---|---|
| P1-1 Coesão | B | Sem consumidor em regra; DEC-016/DEC-022 abertas. Não se inventou função. As habilidades de líder de Kor e Elyra (+15 Coesão) continuam sem efeito estratégico. |
| P1-2 Ânimo | B | Só sobe; não há sistema de queda (DEC-022). A UI mostra o estado atual corretamente. |
| P1-3 Frota | C | Sem sistema naval (DEC-014). A opção aparece bloqueada com o motivo verdadeiro ("Esquadras requerem uma cidade costeira"), então não foi ocultada. |
| P1-4 Disputa cultural em 2p | B | A regra exige duas presenças estrangeiras; o botão "Disputar" só aparece quando existe outra presença, então a UI não oferece ação impossível. Falta decidir se o dono pode disputar (DEC-016). |
| P1-7 Proteger povo | B | Nenhuma regra inequívoca dá efeito a `protectorId`. O texto ("Torna-se protetor") não promete efeito. |
| P1-8 Hostil/Desconfiado | B | Nenhuma regra define como um povo fica hostil. O texto descreve a escala, não um estado atual. |
| P1-9 Pulso sem efeito | B | "Bandos em marcha" e "Refugiados da fronteira" não têm regra definida (DEC-017); a mensagem já diz "sem efeito nos recursos". |

## Seis comportamentos suspeitos

| # | Comportamento | Diagnóstico | Base |
|---|---|---|---|
| 1 | Custo de 1 Material não aceita Riqueza | **REGRA INTENCIONAL** | Riqueza cobre até 50% do custo em materiais, arredondado para baixo (`wealthMaterialCostPercentMax`, spec V4 §8). ⌊0,5⌋ = 0. |
| 2 | Material ímpar vai para Madeira | **DECISÃO NECESSÁRIA** | Conversão legada documentada (⌈m/2⌉ Madeira, ⌊m/2⌋ Pedra; o pagamento usa Madeira→Pedra→Metal). Os custos autorais estão em "materiais"; dar a cada custo Madeira/Pedra próprios é trabalho de conteúdo e balanceamento (P2-6). |
| 3 | Civis escolhidos primeiro como baixas | **DECISÃO NECESSÁRIA** | O código ordena baixas pela menor força (civis têm força 0), de propósito e de forma determinística, mas nenhuma fonte canônica define quem cai primeiro. Efeito colateral: um Explorador junto ao exército absorve uma baixa. |
| 4 | PNA permite declarar guerra | **REGRA INTENCIONAL** hoje; **DECISÃO NECESSÁRIA** (DEC-015) | Spec V4 §12: "PNA não impede declarar guerra (só custa −2 Prestígio por tratado)". A DEC-015 pergunta se deve bloquear. |
| 5 | Embargo precisa do aceite do alvo | **REGRA INTENCIONAL** hoje; **DECISÃO NECESSÁRIA** (DEC-015) | O Embargo é um tipo de tratado (spec V4 §12). A DEC-015 pergunta se deve ser unilateral. |
| 6 | Conquistar povo independente sem guerra | **REGRA INTENCIONAL** | Guerra é um estado entre civilizações; povos independentes não são jogadores. A ação exige Força no hex (2/3/4) e o texto diz isso. A falta de Prestígio na conquista é questão de DEC-020. |

Nenhum dos seis viola uma regra canônica inequívoca; nenhum foi alterado.

## Problemas adicionais encontrados

1. **Giro da região quase sempre recusado.** A peça que explora fica a 1 hex da região e enxerga parte dela; a guarda de terreno conhecido recusa qualquer giro que mude um hex visto. A UI oferece "você escolhe como ela é girada", mas a maioria das escolhas falha na validação. Decidir: a visão da própria peça exploradora conta como "conhecido"? (não alterado)
2. **Página raiz `/`** serve o protótipo legado de 5 recursos (compêndio com custos em "Materiais"). O Alpha está em `/alpha`. Decidir se `/` redireciona.
3. **Crescimento conta Alimento descartado** pelo armazém (ver P0-2). Regra atual mantida.
4. **Livro-razão da rodada em 5 recursos:** as Crônicas não separam Madeira, Pedra e Metal (ver P0-3).
5. Durante esta tarefa, um commit (`166db78`, nomes das eras) foi primeiro gravado com erro de tipo (chave duplicada) e corrigido por `--amend` antes de qualquer outro passo; nenhum commit final tem erro.

## Portões finais

| Portão | Resultado |
|---|---|
| `node scripts/project-task.mjs lint` | ok (0 problemas) |
| `npm run typecheck` | ok |
| `npx vitest run` | 57 arquivos, 732 testes, todos passam |
| `npm run test:e2e` | 6/6 (todas as specs: alpha-conflict, alpha-play, alpha-shell-fullscreen, alpha-ux-round-1, local-play ×2) |
| `npm run build` | ok |
| `npm run db:validate` | schema Prisma válido |
| `git diff --check` | ok |

PostgreSQL não foi exercitado: nenhuma mudança de schema Prisma; o estado salvo continua compatível (tratados e catálogo de peças antigos são lidos pelo novo schema, coberto por testes).

## Decisões abertas que afetam a V2

DEC-014 (Frota), DEC-015 (PNA bloqueia guerra? Embargo unilateral?), DEC-016 (Coesão; disputa em 2p), DEC-017 (Pulso sem efeito), DEC-020 (Prestígio por conquista), DEC-022 (Ânimo/Coesão), ordem de baixas (nova), visão do explorador e giro (nova), conversão de materiais por custo (P2-6), DEC-006 (escala das metas).

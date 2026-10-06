# NO-SCROLL UX PASS — checkpoint (1280×720, mobile 390×844)

Princípio: **trocar conteúdo, não empilhar conteúdo.** Detalhes, Cofre, Governo, Teia e Livro mostram UMA página por vez dentro de um frame de tamanho fixo.
Auditoria automática: `node scripts/alpha-noscroll-shots.mjs` (lista, por estado, elementos que rolam e elementos que cortam o próprio conteúdo; `audit-1280x720.json`).

| # | Superfície | Captura | SCROLL |
|---|---|---|---|
| 1 | Cidade → Detalhes / Resumo | `01-cidade-resumo` | nenhum |
| 2 | Cidade → Produção | `02-cidade-producao` | nenhum |
| 3 | Cidade → População (+ `03b` Defesa, `03c` Ações, `03d` Ações/Pesquisar) | `03-cidade-populacao` | nenhum |
| 4 | Pilha militar (`04` Resumo, `04b` Composição, `04c` Suprimento) | `04b-pilha-composicao` | nenhum |
| 5 | Cofre (`05` Recursos, `05b` Limites) | `05-cofre-recursos` | nenhum |
| 6 | Governo (`06a` Identidade, `06` Governo) | `06-governo` | nenhum |
| 7 | Tabuleiro / Teia (`07` Ressonância, `07b` avanço, `07c` Desbloqueia, `07d` Herança) | `07b-teia-selecionado` | nenhum (Teia = pan/zoom; o viewport interno é espacial, não rola) |
| 8 | Livro (`08` Conselho, `08b` Cartas, `08c` Diplomacia, `08d` Eras, `08e` Crônicas) | `08-livro-conselho` | nenhum no uso normal; páginas textuais (Peças, Manutenção, Conflitos, Acontecimentos, Obras, Kit) têm UM scroll interno só se o conteúdo exigir |
| 9 | Mobile: cidade (`09` Resumo, `09b` População, `09c` Produção) | `09-mobile-cidade-resumo` | nenhum |

## Classificação da auditoria técnica (A necessário · B vira troca de estado · C resíduo · D histórico/textual)
| Local | Classe | Estado |
|---|---|---|
| `.alpha-context .alpha-panel-body` (Detalhes) | era B | **feito**: frame fixo + segmentos |
| `AlphaCity` (`<details>` empilhados) | era B | **feito**: Resumo · População · Produção · Defesa · Ações |
| `AlphaUrban` (5 `<details>` + detalhe abaixo) | era B | **feito**: chips por tipo, 8 opções/página, detalhe substitui a lista |
| `ArmyList` `<details>` "ver composição" | era B | **feito**: Resumo · Composição · Suprimento · Ordens |
| `.alpha-livro .alpha-tab-body` | era B | **feito**: segmentos por área; `.alpha-page.is-scroll` só em página textual |
| Conselho / Cartas / Diplomacia / Eras / Crônicas | era B | **feito** (Pages) |
| Cofre (resources + facts) | era B | **feito**: Recursos · Limites |
| Governo (lista vertical + `<details>`) | era B | **feito**: cards compactos, detalhe substitui, "Ainda fechados: N" |
| Teia: `.alpha-node-detail` `max-height:30%; overflow:auto` | era B | **feito**: Resumo · Desbloqueia, sem scroll |
| `.alpha-civ-resonance`, Herança, Identidade (`overflow:auto`) | era B | **feito**: sem scroll; Identidade em segmentos |
| `.alpha-action-queue` / `.alpha-resolution-log` (popover da bandeja, max-height 300) | A | mantido (lista curta, um scroll) |
| `.alpha-resolution-phase` (resultados da rodada) | D | mantido (um scroll) |
| `.alpha-era-turn` (Virada, 9 passos), `.alpha-conflict-call`, `.alpha-tips`, `.alpha-modal` | B? | **ainda pendente** (diálogos modais; avaliar paginar a Virada em passos) |
| `AttackPreview` `<details>` | A | mantido (um único, "prévia → detalhe") |
| `.alpha-council`/`.alpha-inspector` legados (≤900 px stacked layout, `alpha.css`) | C | resíduo do shell antigo; fora da Mesa |
| `GovernmentReform` (`<details open>`) | C | componente sem uso; remover num passo de limpeza |

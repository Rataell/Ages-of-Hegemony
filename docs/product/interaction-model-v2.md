# Interaction Model V2 — Table First

Não altera regras. Muda a FORMA de interagir com a Mesa.

## Dois tipos de interação
- **A. Ações da Mesa** (físicas, imediatas, espaciais): hex, cidade, Pioneiro, pilha militar, território. A decisão nasce NO LUGAR: uma nuvem de ações ancorada ao hex/peça. Quando a ação envolve espaço (mover, explorar, atacar), a nuvem se dobra numa pílula e **o mapa é a interface**: os hexes legais acendem e o clique no hex é a ordem.
- **B. Gestão estratégica** (Teia, Ressonância, Tabuleiro, Governo, Livro, catálogos grandes): superfícies grandes, em vidro translúcido sobre a Mesa. Nunca a nuvem.

## Quatro níveis de densidade
RELANCE (desenhado na Mesa: selos, marcas de plano `✓ Produzir`, halos) → SELEÇÃO (a nuvem: 1 ação dominante + 2–3 alternativas + •••) → DECISÃO (o nível seguinte da MESMA nuvem: Construir → Distrito → Confirmar; ou o modo alvo no mapa) → DETALHE (Livro, Tabuleiro, Teia, Detalhes). Selecionar nunca abre DETALHE.

## Componentes (`apps/web/app/alpha/`)
| Peça | Arquivo | Papel |
|---|---|---|
| `TableContextCloud` · `ContextActionNode` · `ContextAnchor` (`useHexAnchor`) | `table-cloud.tsx` | nuvem ancorada ao hex (segue pan/zoom a cada frame, nunca move a câmera), morph de níveis ~150 ms, Esc volta um nível/fecha, setas/Tab, nós ≥ 40 px, ícone + rótulo |
| `TargetMode` (`TargetChip`) | `table-cloud.tsx` + `hex-map.tsx` (`targets`) | pílula "Mover… clique no destino · Esc"; o mapa acende os hexes legais (move/explore/attack/claim/mission) e escurece o resto |
| geometria | `cloud-layout.ts` | arco voltado ao meio da mesa, dentro da safe area, sem sobrepor a peça nem a si mesma (testado) |
| lógica de ações | `alpha-table.tsx` (`useTable`) | cidade, Pioneiro, pilha militar, hex: nós, dominância por contexto, gates e razões (nada é escondido: o nó desabilitado diz por quê) |
| `StrategicSurface` (GlassPanel) | `strategic-surface.tsx` + `table-cloud.css` | vidro: fundo translúcido, `backdrop-filter: blur(16px)`, borda discreta, sombra mínima; Esc fecha |
| `PanZoom` | `pan-zoom.tsx` | pan (arrastar/setas) e zoom (roda, +/−, Ajustar, Ver tudo) próprios da Teia |

## Dominância (só ordena, não esconde)
Cidade: Revolta → GOVERNAR; fome → PRODUZIR; padrão PRODUZIR; ELEVAR aparece como oportunidade; com ação já planejada, TROCAR AÇÃO. Pioneiro: ao lado de Região fechada → EXPLORAR; senão FUNDAR se legal; senão MOVER. Pilha: ATACAR se há alvo hostil adjacente, senão MOVER.

## Regras de comportamento
Clicar fora fecha · Esc volta um nível ou fecha · outra peça troca o contexto · executar a ação recolhe a nuvem e o resultado aparece no mapa (marca `✓` no hex) · o Inspector virou **Detalhes** (fechado por padrão; só informação e o catálogo "Ver todas as ações"); Mover/Produzir/Atacar/Explorar/Fundar não existem mais lá.

## Sem scroll global
`html/body` 100dvh overflow hidden na Mesa; faixa e bandeja fixas; nuvem e Detalhes não alteram a altura da página (o container da mesa usa `overflow: clip`, nunca scrollável por programa). Scroll interno só em: Livro, Herança/Identidade, listas de Governo e textos longos.

## Evidências
`docs/evidence/v51b-interaction-v2/` (1280×720): A cidade · B Pioneiro · C pilha militar · D Mover · E Explorar · F Teia · G Tabuleiro/Ressonância · H zero scroll (`checkpoint-*.json`).

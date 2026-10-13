# Hierarquia visual da mesa (regra de prioridade das ilustrações)

Regra do dono (2026-10-12): nenhuma ilustração pode se interpor a outra. Cada uma tem a sua prioridade e a prioritária nunca perde leitura para o fundo.

Camadas, de baixo para cima:
1. **Relevo do terreno** (fundo). Opacidade reduzida; nunca disputa atenção.
2. **Território** (contorno interno na cor do assento).
3. **Recurso e melhoria** (Rio, Fértil, Madeira, Pedra, Metal, Cardume; Fazenda, Lenha, Pedreira, Mina, Pesqueiro). Hex livre: arte pequena (70%) deslocada para cima e à esquerda. **Hex ocupado por peça, cidade ou ameaça: apenas um selo no canto superior esquerdo.**
4. **Estradas** (rede). Passam por baixo das peças; em hex ocupado por peça esmaecem e perdem o cruzamento central; na cidade só chegam à borda.
5. **Cidades.**
6. **Peças e ameaças** (miniaturas, com base e contorno de tinta). **Prioridade máxima de leitura.**
7. **Trajetórias, alvos iluminados, halos** (sempre com contorno escuro para ler sobre qualquer fundo).
8. **Marcadores** (selo de Ânimo, Perigo, contadores) e **rótulos/HUD**.

Regras de implementação:
- O terreno nunca captura eventos (`pointer-events: none`); a interação vive numa camada de acerto por hex.
- O mapa conhece os hexes ocupados (peças próprias e visíveis, cidades, ameaças visíveis) e os repassa à camada de terreno e de estradas.
- Em hex ocupado: relevo a ~32% de opacidade, recurso/melhoria como selo, estrada a ~42% sem hub.
- Fundo e arte de apoio em baixa saturação; a cor viva é das peças, ameaças e marcadores.
- Referência visual: Artifact Mesa Viva (https://claude.ai/artifact/RP1caGQ8rDfqk77AGa6HgR), `hexArt(..., occ)` e `roadLayer(..., occ)` em `docs/product/mesa-viva/02b-terrain.js`.

## Composição de hexágono (implementação)
- `apps/web/app/alpha/hex-compose.ts` (jogo) e `docs/product/mesa-viva/06-compose.js` (Artifact) usam a mesma tabela de slots, em unidades de um hex de raio 52. Peça, cidade, acampamento e tropa ocupam a faixa central e a faixa de baixo; nível, Ânimo, território trabalhado, selos de recurso, nome, custo de destino e etiqueta de trajeto ocupam cantos e laterais livres do MESMO hex. Nada sai do hexágono (não cobre miniatura vizinha); figura que não cabe vira "+N" e nunca é encolhida; um terceiro grupo no mesmo hex é declarado em `hidden`, nunca descartado em silêncio.
- A ocupação vem das entidades reais (peças, cidades, ameaças, povos, rascunho de Mover), nunca de listas de posições escritas à mão. No Artifact as cenas descrevem a mesa como entidades e derivam ocupação, visão e layout delas.
- Trilhas (caminho de Bando, último passo, rascunho de Mover) são desenhadas por baixo de todos os hexes; o halo de alvo é underlay; fantasmas e etiquetas do rascunho ocupam slots.
- Testes: `tests/hex-compose.test.ts` (casos difíceis: cidade com três ou quatro classes, cidade com estrada e mina, acampamento com Bando, Frota sobre recurso, dois exércitos, vários selos de Ânimo, rascunho de Mover), `e2e/layout-hard-cases.spec.ts` (caixas reais do DOM nas resoluções 1440×900, 1280×720 e 390×844, nos zooms mínimo, normal, Focar e máximo; Ficha, placa e barra inferior não cobrem peça, cidade nem guerreiro) e `e2e/layout-probe.ts`.

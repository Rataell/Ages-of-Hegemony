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

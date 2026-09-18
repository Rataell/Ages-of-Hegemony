# Ages of Hegemony — First Playable Product Slice

A primeira experiência visual usa uma mesa cartográfica: chrome grafite, acento bronze, mapa claro, serif nos títulos e sans-serif nos controles. Tokens centralizam superfícies, texto, recursos, terrenos e seis civilizações. Não há assets externos ou fontes bloqueantes.

## Começar

1. Execute `npm run dev:web`; abra http://127.0.0.1:3000.
2. Escolha 2–6 jogadores e clique Nova Partida. Duel atende 2; Standard 3–4; Epic 5–6.
3. Execute manutenção para entrar em Planejamento. Feche o relatório.
4. Selecione Aurélia, adote governo e redistribua população. A soma inclui habitantes livres.
5. Selecione a planície `3,2`, reivindique e construa Fazenda. Em Cidade, use Atribuir território, marque o hex e aplique.
6. Construa distrito Agrário e Celeiro. Custos e requisitos aparecem no catálogo.
7. Desenvolva a cidade até III. Reivindique `4,2` e funde Fronteira. O local não pode estar trabalhado.
8. Avance Resolução, Reação, Fim da rodada, Manutenção e execute a manutenção. Confira produção, consumo, crescimento, estabilidade e administração.

## Interface

GameShell separa projeção de seleção local. Top bar reúne identidade, governo, recursos, administração, rodada e fase. Civilization panel lista cidades e a ferramenta discreta Developer/Hotseat. HexMap usa SVG axial, terreno distinto, borda de proprietário, marcador de capital, população/desenvolvimento, melhoria, trabalho e elegibilidade. Clique/Enter seleciona; arrastar move; controles ajustam zoom; lista de cidades centraliza.

CityInspector reúne habitantes, território, desenvolvimento, especialização permanente, slots, edifícios e breakdown. HexInspector mostra características, proprietário, controlador, rendimento, distância, trabalho e ações. ActionBrowser usa dialog nativo com Escape, foco contido e retorno de foco. Ações inválidas permanecem visíveis com razão. RoundReport e histórico renderizam apenas eventos próprios autorizados.

Em 390 px os painéis seguem abaixo do mapa, com rolagem e aviso de experiência ideal no desktop. Desktop mantém três colunas; detalhes recolhíveis reduzem carga visual. Não há mecânicas falsas nos placeholders Pesquisa, Diplomacia, Militar e Hegemonia.

## Escopo e desempenho

Mapa máximo atual: 168 hexes. SVG evita biblioteca cartográfica e assets pesados. Pan/zoom são transformações da câmera local. Consultas de disponibilidade são feitas no servidor e reutilizam validação integral, privilegiando correção. Medir custo de snapshots/logs longos antes de escalar para milhares de hexes; não há alegação de benchmark nessa escala.

Capturas e resultados executados constam em [relatório](round-product-slice-report.md). npm permanece o único gerenciador: artefatos pnpm preexistentes ficam ignorados e preservados localmente.

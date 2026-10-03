# Auditoria: conceito × Alpha atual (2026-10-03)

Fontes comparadas:

- **Bíblia de conceito** "Ages of Hegemony — Complete Concept Bible · V3.1" (artefato `QrXXeJtE…`, 28 pranchas; a camada v3 é a autoritativa).
- **Canvas de UX/UI** "Concepção de Produto, UI e UX" (artefato `8BJPUCa5…`, 20 telas 1440×900; a tela 08 é interativa).
- **Jogo real**: branch `feature/aoh-playable-alpha-v1`, HEAD `86b565a`, servidor `npm run dev:alpha`.

> **Correção (V4):** a Bíblia chama de "região" uma célula do tabuleiro; o Alpha chama de "região" um bloco de 7 hexes. Comparar "30 regiões" com "37–127 regiões" mistura unidades: em células, o Alpha tem 210. Ver `docs/product/product-owner-decision-register.md` DEC-010.

Legenda: **OK** = implementado e jogável · **Parcial** = existe, mas simplificado em relação ao conceito · **Ausente** = não existe · **Diverge** = existe com regra ou número diferente.

## 1. Veredito

A Alpha joga uma partida de ponta a ponta para 2 a 6 pessoas. Ela cobre todos os pilares do conceito em forma simplificada: explorar, expandir, governar, negociar, guerrear e Hegemonia. A **estrutura** segue o conceito: 6 eras, 8 fases, 7 recursos, 7 níveis de cidade, 6 papéis de habitante, 6 tratados, 6 caminhos de Hegemonia, dado tático, posturas, fortificações e presença cultural.

A **profundidade** fica bem abaixo da bíblia v3:

- 12 de 18 civilizações;
- 1 tipo de navio de 7;
- unidades sem progressão;
- Teia genérica, sem desbloqueios;
- cerca de 7 edifícios de cerca de 30;
- mapa fixo de 30 regiões, contra 37–127;
- 108 cartas de 222;
- Hegemonia com metas fixas, não escaladas pela mesa.

Na **interface**, o shell segue o canvas: tela cheia, Conselho, mapa, Inspetor e barra de fase. Faltam as peças visuais mais marcantes do canvas:

- minimapa;
- camadas;
- menu de contexto no mapa;
- caminho e setas desenhados;
- gaveta da cidade;
- grafo da Teia;
- onboarding sobre o tabuleiro;
- compêndio pesquisável.

Estimativa grosseira de cobertura, por área:

| Área | Regras (bíblia) | Interface (canvas) |
|---|---|---|
| Rodada, fases, planejamento simultâneo | 85% | 90% |
| Mapa e exploração | 40% | 60% |
| Economia e armazenamento | 55% | 80% |
| Cidades, distritos, edifícios | 35% | 45% |
| Combate terrestre | 60% | 70% |
| Naval | 10% | 10% |
| Teia (pesquisa) | 30% | 35% |
| Governos | 50% | 40% |
| Civilizações | 40% | 70% |
| Diplomacia e mercado | 55% | 75% |
| Cartas e Pulso | 35% | 55% |
| Cultura e povos independentes | 50% | 50% |
| Eras e Hegemonia | 50% | 60% |
| Entrada (início, criação, lobby) | — | 80% |
| Ajuda, compêndio, onboarding | 15% | 25% |
| Responsividade | — | 40% |

## 2. Estado atual do jogo (fatos)

- **Partidas:** 2–6 jogadores. Duração Rápida/Padrão/Épica com 9/15/20 rodadas. Mundo Misto, Continental, Arquipélago ou Mar Interior. Semente, prazo por fase em 7 valores e ações por rodada de 5 a 10.
- **Conteúdo:**
  - 12 civilizações e 12 líderes;
  - 9 classes de peça: Infantaria 2/2, Guarda 2/2, Arqueiros 2/1, Cavalaria 3/2, Cerco 1/1, Frota 3/3, Explorador 3/0, Pioneiro 2/0, Emissário 3/0 (movimento/força);
  - 50 avanços;
  - 108 cartas: 24 eventos mundiais, 30 de estratégia, 24 ambições, 18 conselheiros e 12 Grandes Projetos;
  - 24 cartas de Pulso;
  - 30 regiões autorais em 210 hexes;
  - 6 eras e 6 caminhos de Hegemonia;
  - 6 tratados;
  - 8 distritos no esquema, 7 construíveis;
  - 7 edifícios construíveis (29 no esquema Alpha, sem uso);
  - 7 níveis de cidade, 7 estados de ânimo, 6 níveis de fortificação, 3 níveis de presença cultural.
- **Regras-chave:**
  - 1 ação por cidade por rodada; sem Produzir, a cidade não produz;
  - armazém por cidade de 20 Alimento, 15 Madeira, 15 Pedra, 10 Metal e 25 Riqueza;
  - Riqueza cobre até 50% do custo em materiais;
  - acordos duram 3 rodadas;
  - Hegemonia exige 2 rodadas sustentadas;
  - 2 cartas por rodada;
  - pilhas: Exército 6, Civis 2, Frota 4.
- **Qualidade:** lint ok, typecheck ok, 700/700 testes, 6/6 E2E, build ok. A suíte PostgreSQL passa em Docker.
- **Jogado de verdade:**
  - 2p até o fim, com guerra, reação e combate;
  - 2p com desenvolvimento até a era Civilização;
  - 4p até o contato;
  - 6p com as 9 rodadas pelo `alpha:lab`, 0 erros.
  - Contato na simulação (12 sementes): 2p 24/24, 4p 48/48, 6p 59/72.

## 3. Regras: bíblia v3 × Alpha

### 3.1 Rodada e ritmo

| Conceito | Alpha | Status |
|---|---|---|
| 8 fases (Pulso, Planejamento, Ações urbanas, Ordens, Diplomacia, Conflitos, Integração, Fim) | As mesmas 8; resolução por iniciativa | OK |
| Planejamento secreto e simultâneo | Sim; os outros veem só Planejando/Pronto | OK |
| Relógio 3/5/8 min ou assíncrono 1–8 h; Voto de Ritmo | Prazo por fase (sem prazo, 3/5/8 min, 1/4/8 h); sem Voto de Ritmo | Parcial |
| Duração 24/36/48 rodadas (eras de 4/6/8 rodadas) | 9/15/20 rodadas | Diverge |
| Ação urbana escalada pelo nível (Produzir +(2+⌈0,8L⌉), Recrutar 1+⌊L/2⌋…) | Valores fixos por produção do território; não escalam com o nível | Diverge |
| Produzir e Construir disputam o mesmo espaço | 1 ação por cidade cobre tudo | OK |

### 3.2 Mapa e exploração

| Conceito | Alpha | Status |
|---|---|---|
| Tamanhos 37/61/91/127 regiões | Grade fixa de 30 regiões (210 hexes) | Ausente |
| 7 arquétipos | 4 predefinições (Misto, Continental, Arquipélago, Mar Interior) | Parcial |
| Terrenos incluindo Deserto e frio | Planície, Floresta, Colinas, Montanha, Costa, Mar | Parcial |
| Exploração por região (7 hexes); raio 2/3 com Cartografia/Navegação | Região de 7 hexes; sem aumento de raio | Parcial |
| Fichas de descoberta (Ruína, Jazida, Terra Fértil, Aldeia, Porto Antigo, Ninho de Perigo) | Só depósito de Metal | Ausente |
| Capitais a ≥3 hexes, partida garantida viável | Casas autorais compactas e corredor terrestre garantido | OK |
| Neblina como opção | Neblina sempre ligada | Parcial |

### 3.3 Povos independentes e bandos

| Conceito | Alpha | Status |
|---|---|---|
| Aldeia/Vila/Cidade-Estado (2/4/8 habitantes) | Os 3 tipos (viram cidades de 1/2/3 habitantes) | Parcial |
| 4 atitudes, 6 interações | As 4 atitudes e as 6 interações (Comerciar dá +2 Alimento; Proteger e Integrar exigem influência) | Parcial |
| Guarnições com "quantidade ≠ força" | Força fixa para conquistar (2/3/4) | Parcial |
| 4 tipos de bando com contramedidas; movem só quando disparados | 2 bandos genéricos que andam todo fim de rodada | Diverge |

### 3.4 Economia

| Conceito | Alpha | Status |
|---|---|---|
| 5 materiais + Conhecimento e Influência fora do armazém | Os mesmos 7; Conhecimento e Influência sem teto | OK |
| Teto por civilização: 8–12 + Σ níveis + edifícios | Teto base × número de cidades + Celeiro/Armazém/Tesouro/Banco + líder | Diverge |
| Riqueza = material até 50% | Igual | OK |
| Mercado (troca 3:2, monetizar 3:1), Banco (1:1, empréstimos) | Não implementado | Ausente |
| Excedente: perde, monetiza ou vira crescimento 4:1 | Excedente descartado e registrado; crescimento com sobra de comida, limiar 10 | Parcial |
| Manutenção de 1 Comida por 2 habitantes | 1 por habitante | Diverge |
| Legado Cultural 0–40 com marcos | Ausente | Ausente |

### 3.5 Cidades

| Conceito | Alpha | Status |
|---|---|---|
| 7 níveis (Posto … Metrópole Imperial) subidos com recursos e Teia | 7 níveis derivados da população; em paralelo, "Desenvolvimento" 1–5 com custo | Diverge (dois sistemas) |
| Espaços de edifício por nível (1/3/5/7/10/13/16) | Espaços de distrito por desenvolvimento | Diverge |
| 8 distritos (Marítimo só na costa) | 7 construíveis; Marítimo só no esquema | Parcial |
| Cerca de 30 edifícios em cadeias ligadas à Teia | 7 edifícios simples | Parcial |
| Melhorias: 1 produtiva + 1 de infraestrutura por hex | Fazenda, Serraria, Pedreira, Mina, Pesqueiro e estrada; sem a regra de duas camadas | Parcial |
| 6 papéis de habitante | Os 6, mesmos nomes | OK |
| Ânimo 0–6 separado de Estabilidade 0–6; Coesão Local | Ânimo 7 estados; Estabilidade 0–100; Coesão local existe | Parcial |
| Cidade ocupada → integração | Ocupação, integração por Ação cívica, recursos saqueados | OK |

### 3.6 Fortificação e combate

| Conceito | Alpha | Status |
|---|---|---|
| 5 fortificações (Paliçada … Cidadela) + integridade (Íntegra/Danificada/Brecha) | Os mesmos 5 níveis e estados | OK |
| Dado tático (Vazio, Impacto×2, Guarda, Manobra, Comando), um por peça | Mesmas faces, um dado por peça | OK |
| Posturas em ciclo (Assalto > Manobra > Manter > Assalto) | 3 posturas; defensiva privada até a batalha | OK |
| Terreno converte Vazio em Guarda; batalha em 12 passos, até 3 choques | Modificadores de terreno, suprimento, fortificação, técnica, líder e cartas, com detalhamento | Parcial |
| Sem suprimento: Comando anulado e manutenção dobrada | Penalidade fixa | Diverge |
| Raio de suprimento 1+⌈L/2⌉, estradas +1 | Raio 3 + estradas/território | Diverge |
| Capacidade do hex: 6/7/8 + 2 civis; guarnição 6–10; mar 4/5 | Mesmos limites; Comando por avanço | OK |
| Unidades em escalas (Milícia → Mosqueteiros) e Modernização | 9 classes fixas, sem escala | Ausente |
| 5 unidades exclusivas de civilização | Nenhuma | Ausente |
| 7 navios, missões, transporte, naufrágio e resgate | 1 "Frota"; sem transporte nem missões | Ausente |

### 3.7 Teia Civilizacional

| Conceito | Alpha | Status |
|---|---|---|
| 40 avanços em cadeias nomeadas que desbloqueiam edifícios, unidades e níveis | 50 avanços (5 eras × 5 domínios × 2) com efeitos genéricos (+1 de produção, Força, Comando) | Diverge |
| 10 convergências | Existem, sem os efeitos da bíblia | Parcial |
| 3 escolhas exclusivas | 1 exclusão (Centralização × Federação) | Parcial |

### 3.8 Governos

| Conceito | Alpha | Status |
|---|---|---|
| 7 governos (+ Meritocracia, Autocracia), soma de 16 em cinco eixos, adotados na Era III | 5 governos da camada econômica; adoção a qualquer momento | Parcial |
| Repressão por governo | Ausente | Ausente |

### 3.9 Civilizações

| Conceito | Alpha | Status |
|---|---|---|
| 18 civilizações com kit inicial, traço, habilidade 1×/Era, componente exclusivo e limitação | 12 civilizações; ênfase em 2 recursos, habilidade 1×/rodada e líder com passiva e habilidade 1×/Era | Parcial |
| Kaedor, Lumaris, Targan, Iskara, Veloria, Norvak | Não existem | Ausente |
| Limitações e kits iniciais | Não existem (todos começam iguais: Pioneiro + Explorador) | Ausente |

### 3.10 Diplomacia e mercado

| Conceito | Alpha | Status |
|---|---|---|
| 6 tratados | Os 6; propor, aceitar, recusar, encerrar (−2 Prestígio) | OK |
| Custo de Influência; Confiança e Tensão 0–5 por par | Sem custo; sem medidores | Ausente |
| Escada de Reputação (Desacreditado … Prestigiado) | Ausente | Ausente |
| Mercado livre: troca imediata, compromisso futuro, empréstimo com garantia | Troca imediata, presente, promessa e empréstimo; calote = −2 Prestígio; sem garantia nem juros | Parcial |
| Financiar a ação urbana de outro jogador | Ausente | Ausente |
| Rotas com renda proporcional ao nível; rotas por terra exigem Moeda e por mar Crédito | Rota com renda fixa; sem exigência de avanço; suspensa em guerra ou embargo | Parcial |

### 3.11 Cartas e Pulso

| Conceito | Alpha | Status |
|---|---|---|
| 222 cartas (Pulso 60, Encontros 30, Táticas 45, Estratégia 33, Ambições 24, Conselheiros 18, Obras 12) | 108 cartas; sem Encontros nem Táticas com composição | Parcial |
| Pulso com 60 eventos condicionais e severidade I–III | 24 eventos de ±recurso para todos, sem condição | Parcial |
| Cartas táticas exigem composição | 5 "reações" de +Força | Parcial |

### 3.12 Obras de Legado e Hegemonia

| Conceito | Alpha | Status |
|---|---|---|
| 12 Obras com efeitos únicos (Grande Arquivo, Fórum Mundial…) | 12 Grandes Projetos genéricos (+2 de produção, 4 Prestígio) | Parcial |
| Declarar → contestar → sustentar 2 rodadas | Declarar na Era da Hegemonia e sustentar 2 rodadas | OK |
| Requisitos escalados por jogadores, mapa e arquétipo | Metas fixas (por exemplo, Força 12 e Riqueza 30) | Diverge |
| Livro de marcos de Prestígio, uma vez cada, antifarm | Prestígio por exploração, pesquisa, era, evento, ambição e projeto | Parcial |
| Modos de vitória (Hegemonia+Prestígio, só Prestígio, Conquista Total) | Só Hegemonia+Prestígio | Parcial |
| Hegemonia alcançável | Em QUICK (9 rodadas) nunca se chega à Era VI | Lacuna de equilíbrio |

### 3.13 Regras personalizáveis

Faltam: tamanho do mapa, população inicial 2/3, neblina on/off, intensidade de bandos e Pulso, nível máximo de cidade, modo de vitória, Voto de Ritmo, presets Acelerado e Épico da bíblia.

### 3.14 Ajuda e identidade

| Conceito | Alpha | Status |
|---|---|---|
| Compêndio pesquisável, ajuda contextual, tutorial por era, Anais | Guia "Como jogar" em modal; Crônicas com relatórios, batalhas e eventos | Parcial |
| Tipografia da bíblia (Marcellus, Newsreader, IBM Plex Mono) | Cinzel + sans do sistema | Diverge |

## 4. Interface: canvas × Alpha (tela a tela)

| Tela do canvas | Alpha atual | Status |
|---|---|---|
| 04 Tela inicial com mapa de fundo, "Preparar uma mesa", "Tenho um convite" e mesas recentes | Formulário "Seu nome" + criar/entrar; volta à última mesa automaticamente; sem lista de mesas recentes nem mapa de fundo | Parcial |
| 05 Criação com cartões visuais e prévia do mundo | Selects (lugares, duração, ações, mundo, semente, prazo); sem prévia, sem tamanho do mapa, sem habitantes iniciais | Parcial |
| 06 Lobby com mesa redonda e assentos | Lista de assentos; Copiar código e Copiar link; pronto; iniciar | Parcial |
| 07 Seleção de civilização com detalhe e prévia da pátria | Grade com ênfase, capital e passiva do líder; sem painel de detalhe nem prévia | Parcial |
| 08 Shell: barra superior, 9 abas, Conselho, mapa, Inspetor, barra de fase | Barra com 7 recursos e armazém, Administração, Ações, Prestígio, era/rodada/fase; 6 abas + Como jogar; Conselho e Inspetor recolhíveis; barra de fase com ordem de iniciativa | OK no essencial |
| Abas Cidades, Guerra, Cultura | Não existem como abas (cultura vive no Inspetor; guerra no Militar/Crônicas) | Ausente |
| 09 Mapa: minimapa | Não | Ausente |
| 09 Mapa: camadas (Fronteiras/Recursos/Rotas/Suprimento/Influência) | Não | Ausente |
| 09 Mapa: menu de contexto (Mover/Atacar/Explorar/Fundar) | Não no mapa; o Inspetor oferece a ordem que cabe no hex | Parcial |
| 09 Mapa: caminho numerado e setas de ataque | Destinos destacados; caminho e setas não são desenhados | Parcial |
| 09 Mapa: três estados de neblina | Desconhecido "?" e visível; "conhecido fora de vista" sem estilo próprio | Parcial |
| 09 Mapa: zoom 0,5–4×, Centralizar, ajuste à área conhecida | Sim | OK |
| 10 Gaveta da cidade com tabuleiro de distritos, escada de níveis, escala de ânimo, armazém | Painel lateral com habitantes, crescimento, nível, ânimo (texto), fortificação, economia; sem tabuleiro visual | Parcial |
| 11 Teia em grafo (era × domínio, linhas de pré-requisito) | Grade de cartões com busca e filtro de domínio | Parcial |
| 12 Diplomacia com mesa de 6 tratados, proposta em pergaminho, rota no mapa | Cartão por civilização com estado, acordos, propostas, ajuda de cada tratado, guerra com confirmação, ofertas comerciais; sem desenho da rota | OK / Parcial |
| 13 Guerra: relatório de batalha, ciclo de posturas, legenda das faces | Prévia do ataque, chamada de Conflitos para o defensor, relatório com faces e modificadores nas Crônicas; sem diagrama do ciclo | OK / Parcial |
| 14 Cartas: mão em leque, evento em pergaminho, ambições, conselheiros, projeto em 5 etapas | Mão, evento com escolha, ambições, conselheiros, projetos de uma etapa; sem leque | Parcial |
| 15 Cultura: camada de influência no mapa, espaços, dados | Presença e disputa no Inspetor de cidade; sem camada no mapa | Parcial |
| 16 Eras e Hegemonia: linha do tempo, 6 caminhos com medidores, "Caminho mais próximo", ranking | Linha das eras, critérios, 6 caminhos com progresso, declarar; sem "caminho mais próximo" nem ranking durante a partida | Parcial |
| 17 Onboarding sobre o tabuleiro + compêndio com busca e glossário | Modal "Como jogar"; sem coach marks, busca nem glossário | Parcial |
| 19 Responsividade: gavetas no tablet, barra de abas no celular | Barra de fase fixa em ≤900 px; o resto empilha | Parcial |
| Pontos que o canvas marcava "Em breve" | Ofertas comerciais e disputa cultural já existem no jogo | À frente do canvas |

## 5. Onde a Alpha vai além do canvas

- Destinos alcançáveis e regiões exploráveis destacados no mapa, calculados com as regras do servidor.
- Hexes reivindicáveis destacados.
- Checagem antes de confirmar: cidades sem ação, peças paradas, evento mundial e propostas pendentes.
- Alertas nas abas.
- "Voltar a planejar".
- Guerra declarada e ataque na mesma rodada.
- Relatório de rodada que fecha a conta (estoque inicial + linhas = final).
- Ofertas comerciais em 4 modalidades.
- Ações com povos independentes, com o que falta para cada uma.
- Disputa cultural.
- Tela final com ranking.

## 6. Riscos e inconsistências encontrados

1. **Dois sistemas de porte de cidade.** Existe "Desenvolvimento" 1–5, que é pago e controla os distritos, e existe "Nível" 1–7, que deriva da população. A bíblia tem só o nível, subido com recursos e Teia.
2. **Esquema sem uso.** Há 29 edifícios Alpha e o distrito Marítimo no esquema, mas só 7 edifícios e 7 distritos são construíveis.
3. **Hegemonia inalcançável em QUICK.** A bíblia prevê 24–48 rodadas; o jogo usa 9–20.
4. **Crescimento.** Uma cidade nova produz exatamente o que come: manutenção de 1 por habitante (a bíblia diz 1 por 2) e limiar de crescimento 10.
5. **Bandos.** Andam todo fim de rodada; na bíblia, só quando um evento dispara.
6. **Contato em 6p.** 13 de 72 civilizações ficam sem contato em 9 rodadas.
7. **Bíblia inconsistente consigo mesma.** A capa fala em "50 avanços", mas lista 40. A estratégia aparece como 30–36 e como 33. A prancha 08 usa o traço v1 de Aurélia. As Obras ainda estão em termos v1. O relógio aparece como 3/5/8 e como 1/2/4 min.
8. **Canvas × bíblia divergem.**
   - Canvas: 12 civilizações, 9/15/20 rodadas, 5 eras na capa e líderes.
   - Bíblia v3: 18 civilizações, 24/36/48 rodadas, 6 eras e nenhum líder.
   - A Alpha segue o canvas. É preciso decidir qual dos dois é a referência.

## 7. Prioridades sugeridas (ordem)

1. **Decisões de produto:** escolher entre canvas e bíblia v3 como referência de números (rodadas, civilizações, líderes). Unificar Nível e Desenvolvimento. Definir se QUICK pode terminar por Hegemonia.
2. **Mapa vivo:** minimapa, caminho e setas desenhados, estado "conhecido" escurecido, camadas Fronteiras/Rotas/Influência.
3. **Cidade:** subir de nível com custos e Teia; espaços de edifício; edifícios em cadeia ligados à Teia; gaveta visual da cidade.
4. **Teia:** cadeias nomeadas da bíblia com desbloqueios reais de edifícios, unidades, níveis e raio de exploração; grafo navegável.
5. **Exército:** escalas de unidade e Modernização; navios e transporte.
6. **Mercado e reputação:** Confiança, Tensão, Reputação, custo de Influência dos tratados, Mercado e Banco.
7. **Conteúdo:** as 6 civilizações faltantes, Pulso condicional com severidade, Encontros e cartas Táticas, Obras de Legado com efeitos únicos.
8. **Ajuda:** onboarding sobre o tabuleiro, compêndio pesquisável, "caminho mais próximo", ranking ao vivo.
9. **Configuração:** tamanhos de mapa 37/61/91, população inicial, intensidade de bandos e Pulso, modo de vitória.

# AOH CORE 10: CONCEPT FINAL ADDENDUM
## Exploração · Mundo · Figuras · Obras de Legado

Status: **proposta de conceito**. Nada aqui altera engine, saves, IDs, balanceamento ou deploy. Nenhum teste do jogo foi rodado.
Mockups (artifact): `docs/product/aoh-core10-mockups-v1.html`.
Medições do gerador: `docs/evidence/world-generator-audit-2026-10/` (scripts somente leitura sobre `dist`; **o motor não foi alterado**).

Complementa `aoh-historical-civilizations-core10-figures-v1.md`.

---

## 1. Helênicos: pool de 6 Figuras

Iniciais (proposta): **Odisseu, Alexandre Magno, Agamenon**. Reservas: **Leônidas I, Héracles, Artemísia I**. Não se balanceou nenhuma; Passiva e Poder são **conceituais** e usam só os tipos existentes.

| Figura | Classe | Arquétipo | Passiva conceitual | Poder 1×/Era conceitual | Risco principal |
|---|---|---|---|---|---|
| **Odisseu** | LENDÁRIO | Explorador-Estrategista | Naus de Ítaca (limite de Madeira +6) | Rota do Retorno (+1 movimento) | armadura de hoplita em figura da Idade do Bronze |
| **Alexandre Magno** | HISTÓRICO | Conquistador-Comandante | Cidades de Alexandre (Integração +10) | Campanha Relâmpago (+1 comando) | imperialismo; macedônio × grego clássico |
| **Agamenon** | LENDÁRIO | Rei-Comandante | Ouro de Micenas (limite de Riqueza +6) | Assembleia dos Reis (+1 comando) | a "Máscara de Agamenon" não é dele |
| Leônidas I | HISTÓRICO | Comandante-Defensor | Refúgios abastecidos (Suprimento +1) | Muralha Viva (+2 Força) | cultura pop |
| **Héracles** | **MITOLÓGICO** | Herói-Campeão | Muralhas de Tirinto (limite de Pedra +6) | Fúria do Campeão (+2 Força) | "Hércules" é o nome romano; imagem de cinema |
| Artemísia I | HISTÓRICO | Comandante Naval | Frota de Halicarnasso (limite de Madeira +6) | Esquadra Unida (+15 coesão) | aliada dos persas em Salamina |

Fonte e auditoria completas de Agamenon, Héracles e Artemísia: seção "Helênicos" de `core10.py` espelhada no catálogo do artifact. **Decisão D-F1:** quais três entram primeiro.

---

## 2. Sistema de cartas

Quatro cartas, **uma só linguagem**: **arte principal → nome → identidade → efeito → ícones**.

| Carta | Arte | Identidade | Efeito | Ícones |
|---|---|---|---|---|
| **Civilização** | cidade N5 na pele da cultura | região e período; afinidade | Trait, Limitation, Assinatura | suprimento, escudo, influência |
| **Figura** | retrato | classe + civilização | Passiva e Poder 1×/Era | recurso e ação |
| **Obra de Legado** | peça da Obra em cena | caminho, origem (Inspirada/Autoral) | requisito, custo em 3 passos, efeito, +4 Prestígio | recursos, estrela |
| **Descoberta/Encontro** | marco 3D sobre o hex | tipo da Descoberta | escolha ou efeito | recurso do resultado |

Moldura comum: filete de bronze por dentro de margem escura, **uma faixa de padrão da cultura** na base, tipografia de gravura para nomes. Ver "Sistema de cartas" no artifact (as quatro cartas lado a lado, com texto real do catálogo).

---

## 3. Obras de Legado

O sistema continua o **atual**: 12 linhas (6 canon + 6 convertidas), 3 passos (uma Ordem de Legado por passo), +4 Prestígio, única no mundo, pré-requisito de Distrito. **Nenhum sistema novo.**

### 3.1 Direção híbrida
Tipologias históricas **inspiram**, mas a forma é do AoH: o **Arquivo dos Horizontes** lembra a arquitetura helenística (biblioteca, torre de arquivo) e **não é** "a Biblioteca de Alexandria". Cada Obra tem **duas representações relacionadas**: carta ilustrada e peça 3D na Mesa, com a mesma silhueta.

### 3.2 Catálogo real (12) e origem tipológica

| Obra | Caminho | Requisito | Custo | Efeito | Origem |
|---|---|---|---|---|---|
| **Arquivo dos Horizontes** | Científico | Acadêmico | Pedra 6, Madeira 4, Conhecimento 3 | +1 Conhecimento/rodada | **Inspirada** (biblioteca helenística, torre-arquivo) |
| **Casa dos Acordos** | Político | Administrativo | Pedra 5, Riqueza 3, Influência 3 | +1 Influência | Autoral (salão circular) |
| **Entreposto das Marés** | Econômico | Comercial | Madeira 5, Pedra 4, Riqueza 4 | +1 Riqueza | **Inspirada** (armazém portuário sobre palafitas) |
| **Monumento das Vozes** | Cultural | Cultural | Pedra 6, Madeira 2, Cultura 4 | +1 Influência | Autoral (cinco monólitos) |
| **Cidadela da Vigília** | Militar | Militar + Fortaleza | Pedra 8, Metal 4, Riqueza 2 | +1 Materiais | **Inspirada** (torre de menagem) |
| **Estrada das Comunidades** | Territorial | Industrial + 3 cidades ligadas por rotas | Madeira 6, Pedra 6, Riqueza 2 | +1 Materiais | Autoral (portal triplo) |
| Instrumento do Firmamento | Científico | Acadêmico | Pedra 5, Conhecimento 5, Metal 2 | +1 Conhecimento | Autoral (esfera armilar) |
| Pátio da Investigação | Científico | Acadêmico | Pedra 4, Madeira 4, Conhecimento 4 | +1 Conhecimento | Inspirada (colunata) |
| Conselho dos Horizontes | Político | Administrativo | Pedra 4, Riqueza 3, Influência 5 | +1 Influência | Autoral (círculo de pilares) |
| Casa da Medida Comum | Econômico | Comercial | Pedra 4, Madeira 2, Riqueza 6 | +1 Riqueza | Autoral (disco-moeda) |
| Reservas dos Terraços | Territorial | Agrário | Madeira 4, Pedra 5, Alimento 3 | +1 Alimento ao Produzir | Inspirada (terraços) |
| Fundição Compartilhada | Econômico | Industrial | Pedra 5, Metal 4, Madeira 3 | +1 Materiais ao Produzir | Autoral (chaminés e ponte) |

Todas as 12 aparecem no artifact (6 com carta e peça completas, 6 em formato compacto).

### 3.3 Cultura material das Obras
Mesma Obra, mesma regra, mesma silhueta-base; muda o **acabamento da civilização que a construiu**. Exemplo mostrado, **Arquivo dos Horizontes**: Helênicos (mármore e terracota, acroteria), Egípcios (arenito e azul-egípcio, cornija e pirâmide dourada), Nórdicos (madeira e pedra, finais de proa entalhados). Nos mockups o ornamento extra existe só para o Arquivo; as demais Obras mudam o material.

---

## 4. Exploração como experiência física

### 4.1 O que o motor já tem (preservado)
Regiões fechadas (as de fronteira começam viradas para baixo; as Pátrias são públicas). `EXPLORE`: peça + hex alvo + `rotation` (0–5). O **primeiro explorador** de uma Região intacta escolhe a orientação; depois ela é fixa. Não se pode girar de modo que um terreno **já observado** mude. A ordem é planejada em segredo e resolvida em sequência. Reveal: terrenos, `+1 Prestígio`, Conhecimento por kit, e a Descoberta.

### 4.2 Sequência proposta
1. seleciona a Região fechada · 2. ela ganha destaque · 3. quando permitido, escolhe a orientação · 4. a peça se ergue e gira · 5. vira e revela · 6. os terrenos aparecem · 7. uma Descoberta pode surgir · 8. a Descoberta ganha apresentação própria.
Hoje as etapas 2–8 são só um evento de log (`DISCOVERY`) e um botão "↻ 60°" que cicla às cegas.

### 4.3 Imersão
Painel curto: **REGIÃO REVELADA → arte/peça → nome → texto → efeito ou escolha → Continuar.** Com escolha, usa o sistema existente de **escolha pendente** (`addPendingChoice`). Não bloqueia o ritmo: cada painel é de um toque.

### 4.4 Descobertas existentes (preservadas, nenhum baralho paralelo)
O motor tem **7 resultados** (só Regiões de fronteira; Pátrias = NONE):

| Resultado | Chance | Efeito atual |
|---|---|---|
| NONE "Terra comum" | 25 % | nada |
| RUIN **"Vestígio"** | 20 % | escolha pendente com 1 de 3 cartas de Encontro (*Arquivo soterrado*, *Santuário esquecido*, *Mapa nas paredes*), 2 opções cada |
| DEPOSIT "Jazida" | 15 % | +2 Pedra, +1 Metal; a primeira rocha ganha a feature Metal |
| PASSAGE "Passagem" | 10 % | abre até 3 hexes de estrada (centro e vizinhos sem mar nem montanha) |
| ANCHORAGE "Ancoradouro" | 10 % | +1 Riqueza e feature Peixe; vira NONE se a Região não tem água |
| DANGER "Perigo" | 10 % | 50 % de perder a peça que explorou, salvo Método Experimental |
| CAMP "Acampamento Bárbaro" | 10 % | cria uma Ameaça terrestre |

**Nome:** o motor chama RUIN de **Vestígio**, não "Ruína". Unificar.

### 4.5 Marcos 3D (board-game premium, não cenário pesado)
Vestígio: colunas quebradas, base de estátua, fundação. Jazida: afloramento com veios de bronze e cristais. Passagem: fenda rochosa com trilha de cascalho. Ancoradouro: enseada com cais e bote. Acampamento: tendas, fogueira, estacas. **Perigo: sem peça permanente** (aviso temporário). Passagem e Ancoradouro persistem porque mudam o mapa (estrada, peixe).

---

## 5. Regra exata da entrada terrestre

**Pioneiro é peça terrestre e nunca entra em SEA.** O motor já impede o *movimento* para SEA; o que falta é impedir que a *exploração* escolha uma orientação sem saída.

```
LAND = { PLAINS, FOREST, HILLS, MOUNTAINS, COAST }       // SEA não é entrada terrestre
reach(U) = kitExplorationReach(U)                         // 1; 2 para o Pioneiro de Elyra
tile_k(h) = rotatedRegionTiles(state, R, k)[h].terrain     // a mesma função usada ao revelar

entrada(U,R,k) = { h ∈ R : tile_k(h) ∈ LAND
                   ∧ existe caminho U → h de ≤ reach passos
                     cujos hexes intermediários são terra conhecida (≠ SEA, ≠ UNKNOWN) }

valida(U,R,k) = entrada(U,R,k) ≠ ∅
                ∧ (k = R.rotation, se a orientação já está fixada)
                ∧ (para hexes já observados, tile_k(h) = terreno atual)     // regra existente
V = { k ∈ 0..5 : valida(U,R,k) }

|V| = 1  → usar automaticamente
|V| ≥ 2  → o jogador escolhe entre V (só as válidas aparecem)
|V| = 0  → EXPLORE por peça terrestre não é oferecido: "Requer acesso naval."
```

Não se altera terreno depois da revelação; não se converte SEA em terra. Movimento: MONTANHAS custa 3 e o orçamento do Pioneiro é 3, então entra em um hex isolado. Bloqueios dinâmicos (cidade inimiga, peça alheia, fronteira fechada) continuam sendo checados no movimento, como hoje.

**Detalhe importante:** os *overrides de preset* (SEA do Arquipélago etc.) **não giram** com a Região (`rotatedRegionTiles` só gira o que ainda é o terreno do template). A validade tem de usar `rotatedRegionTiles`, não o template.

### 5.1 O que as medições dizem sobre a regra
Distribuição de orientações válidas por ponto de aproximação (40 seeds, 4 jogadores):

| Preset | 0 válidas | 4 | 5 | 6 |
|---|---|---|---|---|
| Misto | 0 % | 8,2 % | 16,8 % | 75,0 % |
| Arquipélago | **23,6 %** | 8,4 % | 13,2 % | 54,8 % |
| Mar Interior | 0 % | 5,9 % | 10,7 % | 83,4 % |

**Achados:** (a) nunca há 1, 2 ou 3 válidas, porque o Pioneiro toca no máximo 2 hexes da Região; (b) a regra só "morde" no **Arquipélago** (23,6 % das aproximações; ~0,2 Região por mapa sem acesso terrestre algum); (c) a escolha de 4 a 6 orientações é, na prática, **cega**: o jogador não vê o terreno. O seletor com "3 orientações válidas" do mockup é **ilustrativo**; nos mapas atuais ele só apareceria com mais mar.

### 5.2 Vazamento de informação
Mostrar só as orientações válidas revela, de leve, onde há mar na borda. **Recomendação:** mostrar as orientações **sem terreno**; a Cartografia e o Método Experimental já revelam "costa" (`explorationHints`).

### 5.3 Exploração naval (futuro, sem nova unidade)
Se |V| = 0, a Região exige explorador de **domínio marítimo** (Frota ou Embarcação Costeira junto à Região) ou um **Porto** com acesso. Já existe base: o motor **não restringe EXPLORE a Pioneiros** (qualquer peça própria adjacente pode explorar; hoje a UI oferece a todas) e a Herança "Cartas das Marés" já fala de Pioneiro em Embarcação Costeira revelando Região costeira a distância 2. Isto torna arquipélagos e mares relevantes sem criar unidade.

---

## 6. Auditoria do gerador de mapas

**Confirmado:** o footprint é **fixo**: `REGION_COUNT = 30`, `layoutBoard(playerCount, seed)` ignora tamanho. 6 Pátrias + 24 fronteiras = exatamente os 30 `REGION_TEMPLATES`. O lobby só oferece o preset de mundo (`WORLD_OPTIONS`). **A opção de tamanho não está implementada.**

### 6.1 Os presets reais (40 seeds, 2/4/6 jogadores)

| Preset | Hexes de mar | Componentes | Maior mar | "Costa" sem mar vizinho | Massas de terra | Sem entrada terrestre | Metal/mapa |
|---|---|---|---|---|---|---|---|
| **Misto** | 14 | 9,3 | 2,8 | 11 | 1 | 0 % | 21 |
| **Continental** | 0 | 0 | 0 | **37** | 1 | 0 % | 21 |
| **Arquipélago** | 71–80 | 12,6–14,3 | 18,5–25,7 | 0,6–0,9 | 3,4–4,3 | **24 %** | 17–18 |
| **Mar Interior** | 19 | 16,4–17 | **2,2** | 7–8 | 1 | 0 % | **14** |

**Os presets não produzem a experiência do nome:**
- **Mar Interior** é ~17 **poças** de 1–2 hexes (o centro de cada Região interna vira SEA, cercado de COAST), não um mar; perde ~35 % do metal.
- **Continental** apenas remove o SEA e deixa 37 "costas" sem água (COAST sem vizinho SEA).
- **Misto** tem ~14 hexes de mar em ~9 poças de até 3 hexes: naval quase inexistente.
- **Arquipélago** é o único com mar real, mas aplica ruído (hash < 2/5 dos hexes não-montanha viram SEA nas Regiões sem Pátria) e depois um **corredor forçado**: uma busca 0-1 converte a cadeia mais barata de SEA em COAST para **ligar as Pátrias ativas por terra**. A "ilha" vira ponte, e o corredor é visualmente óbvio.

### 6.2 Garantias hoje
- **Pátrias válidas e distribuídas:** sim; `chooseHomelands` maximiza a menor distância, depois a soma, depois a justiça da divisão.
- **Pátria isolada:** o corredor garante ligação **por terra** entre as ativas; é a fonte do artifício acima.
- **Metal:** 21 jazidas por mapa (Misto). A **sexta Pátria não tem metal na própria Região** (16,7 % das Pátrias com 6 jogadores), mas há metal a ≤ 2 Regiões em **todas** as amostras. Mar Interior cai para ~14; Arquipélago ~17–18 (hexes de colina viram mar).
- **Mar não bloqueia Pioneiros de forma absurda:** só no Arquipélago (24 % das aproximações sem entrada).
- **Conectividade:** Misto, Continental e Mar Interior têm 1 massa de terra; Arquipélago 3–4.

---

## 7. Três footprints reais

Preservado: **Região = 7 hexes**, sem hexes soltos. Cada tamanho foi medido rodando o `chooseHomelands` real sobre o lattice para N regiões (o motor não foi alterado).

> **Achado:** o cache de Pátrias do motor (`tiesCache`) é indexado **só pela contagem de jogadores**. Com footprint variável ele devolve resultados de outro mapa (reproduzido). Precisa ser indexado pelo footprint.

### 7.1 Medição: distância mínima entre Pátrias (Regiões) e entre capitais (hexes)

| Regiões | Hexes | Pátrias elegíveis | 2p | 3p | 4p | 5p | 6p |
|---|---|---|---|---|---|---|---|
| 19 | 133 | 7 | 2 · 5 | 2 · 5 | 1 · 3 | 1 · 3 | 1 · 3 |
| 22 | 154 | 11 | 3 · 7 | 3 · 7 | 2 · 5 | 1 · 3 | 1 · 3 |
| **24** | 168 | 12 | **4 · 11** | **3 · 7** | **2 · 5** | **2 · 5** | **1 · 3** |
| 27 | 189 | 15 | 4 · 10 | 3 · 7 | 3 · 7 | 2 · 5 | 2 · 5 |
| **30 (hoje)** | 210 | 18 | **4 · 12** | **4 · 10** | **3 · 7** | **2 · 5** | **2 · 5** |
| 37 | 259 | 19 | 4 · 12 | 4 · 10 | 3 · 7 | 2 · 5 | 2 · 6 |
| 40 | 280 | 25 | 6 · 15 | 4 · 10 | 3 · 9 | 3 · 7 | 2 · 5 |
| **43** | 301 | 31 | **6 · 15** | **5 · 14** | **4 · 10** | **3 · 7** | **3 · 7** |
| 48 | 336 | 32 | 6 · 16 | 5 · 12 | 4 · 10 | 3 · 7 | 3 · 8 |
| 54 | 378 | 36 | 6 · 16 | 6 · 15 | 4 · 11 | 3 · 7 | 3 · 7 |

(célula: distância em Regiões · distância mínima em hexes entre capitais; o segundo número varia com o desempate pela seed.)

**Limites que decidem os números:** (a) com poucas Regiões só 7 são elegíveis (≥ 5 vizinhos) e 6 jogadores ficam **adjacentes** (distância 1); (b) a distância entre Pátrias **satura** em 3 para 5–6 jogadores a partir de ~43 Regiões; (c) o salto de Amplo para 6 jogadores acontece em 43, não em 48.

### 7.2 Proposta

| Footprint | Regiões | Hexes | Fronteiras | Jogadores | Templates novos |
|---|---|---|---|---|---|
| **COMPACTO** | **24** | 168 | 18 | 2–5 (**não** 6: Pátrias adjacentes) | 0 (sorteia 18 dos 24) |
| **PADRÃO** | **30** | 210 | 24 | 2–6 | 0 (é o de hoje) |
| **AMPLO** | **43** | 301 | 37 | 2–6 | **13** (hoje há 24 fronteiras) |

Regiões de fronteira por jogador (2·3·4·5·6): Compacto 9·6·4,5·3,6·(3); Padrão 12·8·6·4,8·4; Amplo 18,5·12,3·9,3·7,4·6,2.

**Contato estimado** = ⌈(distância das capitais em hexes − 2) ÷ 4⌉ rodadas, com dois Pioneiros se aproximando (orçamento de movimento 3, custo médio ~1,5): Compacto 3·2·1·1·1; Padrão 3·2·2·1·1; Amplo 4·3·2·2·2. **É estimativa; medir com bots antes de fechar.** **Espaço para Ameaças:** Compacto fica apertado a partir de 5 jogadores (3 Regiões de fronteira por jogador).

### 7.3 Lobby
**Tamanho recomendado ou escolha manual.** 2 jogadores: Compacto (ou Padrão) · 3–4: Padrão · 5–6: Amplo. Exceções permitidas: 2 jogadores em Amplo (jogo exploratório), 4 em Compacto (contato e conflito mais cedo). Compacto não é oferecido para 6.

**Densidade naval** depende do preset, não do tamanho: a proporção de mar deve ser mantida por regra do preset ao escalar.

---

## 8. Variedade de mapa: presets

Mantêm-se os quatro nomes. Para **produzir experiências diferentes** (conceito; não implementado):

| Preset | Intenção | Garantia proposta |
|---|---|---|
| **Continental** | uma massa de terra com **oceano externo** na borda | todo o interior em terra; mar só na orla; portos só na periferia |
| **Arquipélago** | Pátrias em ilhas, **sem corredor forçado** | cada Pátria autossuficiente (comida, madeira, metal); ilhas vizinhas a ≤ 2 hexes de mar; metal por ilha |
| **Mar Interior** | um **mar conectado** no centro | componente de mar ≥ 12 hexes (em 30 Regiões), orla de COAST; metal preservado |
| **Misto** | como hoje, com mais lagos | ~14–25 hexes de mar |

### Garantias de geração (qualquer seed)
Pátrias válidas e bem distribuídas · nenhuma isolada por acidente · recursos essenciais acessíveis · **metal a ≤ 2 Regiões de cada Pátria** · fronteiras exploráveis · mar não bloqueia Pioneiros de forma absurda (ver regra §5) · conectividade por preset (terra única no Continental, Misto e Mar Interior; ilhas alcançáveis por mar curto no Arquipélago). **Sem corredor artificial visualmente óbvio** só para satisfazer teste.

---

## 9. Teste específico de exploração (plano)

Para cada preset × tamanho × 2–6 jogadores, centenas de seeds rápidos:
1. **Propriedade:** um Pioneiro terrestre nunca precisa entrar em SEA para completar uma exploração válida.
2. Quando há rotações: **pelo menos uma válida** onde a Região deveria ser acessível por terra.
3. Se |V| = 0: a UI mostra **"Requer acesso naval."**
4. Conectividade conforme o preset; metal ≤ 2 Regiões; Pátrias a distância ≥ mínimo do footprint.
5. Corredor: contar hexes SEA → COAST abertos pelo gerador (meta: zero no Arquipélago).
6. `chooseHomelands` com cache por footprint.

---

## 10. Mockups novos (artifact)
A. Região fechada · B. Pioneiro junto à Região · C. seletor de orientação (ilustrativo, 3 válidas) · D. frames da virada · E. Região com Vestígio 3D · F. Região com Jazida · G. Região marítima ("Requer acesso naval", com dados reais de um mapa Arquipélago) · H, I, J. footprints Compacto, Padrão e Amplo (lattice real) · K. os quatro presets de hoje (mapas reais, seed 7) · L. 6 Obras com carta e peça (+ as outras 6) e a cultura material · M. roster helênico de 6. Mais: sistema de cartas e os seis marcos de Descoberta.

---

## 11. Gaps antes da implementação final
1. **Footprint variável:** `REGION_COUNT` constante; `layoutBoard` varre só i, j ∈ [−4, 4]; `tiesCache` por contagem de jogadores.
2. **Templates:** 30 hoje; Amplo precisa de 13 fronteiras novas (nomes e padrões autorais).
3. **Presets sem identidade** (Mar Interior, Continental) e **corredor forçado** no Arquipélago.
4. **Exploração sem filtro de entrada**; o botão ↻ cicla às cegas.
5. **Overrides de preset não giram**; a validade tem de usar `rotatedRegionTiles`.
6. **Vazamento** das orientações válidas (decisão: mostrar sem terreno).
7. **EXPLORE por qualquer peça:** decidir se Frotas e tropas continuam podendo.
8. **Nomes:** "Vestígio" × "Ruína"; "Acampamento Bárbaro".
9. **Apresentação:** revelação hoje é uma linha de log; faltam painel e marcadores persistentes.
10. **Metal:** sexta Pátria sem metal local; Mar Interior e Arquipélago reduzem o metal.
11. **Preset × metal × corredor:** precisa de regra por preset em vez de pós-correção.
12. **Contato:** estimativa; medir com bots.

## 12. Decisões a aprovar
1. **D-F1:** as três Figuras iniciais de Helênicos.
2. Sistema de cartas (§2) e a direção híbrida das Obras (§3).
3. Regra exata da entrada terrestre (§5), incluindo **mostrar orientações sem terreno** e "Requer acesso naval".
4. Footprints **24 / 30 / 43** e a regra de lobby (§7); aceitar 13 templates novos para o Amplo.
5. Redesenho conceitual dos presets (§8), em especial **eliminar o corredor forçado**.
6. Plano de testes (§9).

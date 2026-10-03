# Ages of Hegemony — Canonical Product Specification V4 (DRAFT)

**Status:** rascunho.
- **Aprovadas em 2026-10-03 e incorporadas:** DEC-001 (a V4 é a fonte normativa quando aprovada), DEC-002 (Nível 1–7 único), DEC-004 (8 fases; nem toda fase é tela), DEC-005 com alteração (6 eras; Hegemonia não é era) e DEC-010 (hex / região / território).
- **Aprovadas depois:** DEC-023 (V Potências, VI Ascensão) e DEC-006 quanto à declaração (só na Era VI — Ascensão; requisitos contabilizados a partida toda).
- **Abertas:** as demais. Seções que dependem delas continuam não normativas.

**Fontes**
- **Bíblia v3.1:** artefato `QrXXeJtE…`, 28 pranchas, camada v3 autoritativa.
- **Canvas UX:** artefato `8BJPUCa5…`, 20 telas.
- **Código:** `feature/aoh-playable-alpha-v1`, `547ff39`, Alpha em `packages/game-domain/src/alpha*.ts`, `packages/game-engine/src/alpha*.ts`, `apps/server/src/alpha-projection.ts`, `apps/web/app/alpha/`.
- **Auditorias:** `docs/audit/concept-vs-alpha-2026-10-03.md`, `docs/audit/alpha-full-audit-2026-09-21.md` e `docs/alpha-playtest-2026-10-03.md`.
- **OpenSpec:** `openspec/changes/public-alpha-v0-1-closure`.

**Hierarquia**
- Código = o que está implementado.
- Bíblia = intenção de design.
- Canvas = intenção de experiência.
- V4 = verdade normativa futura, depois da aprovação.

**Convenções**
- Cada seção traz: **Canônico proposto** (o que a V4 recomenda), **Alpha hoje** (fatos do código, com símbolo ou arquivo), **Divergências** (Bíblia × Canvas × Alpha) e **Decisões** (IDs do registro). `[DECISÃO DO PRODUCT OWNER]` marca o que não está definido.
- Abreviações de caminho: `gd/` = `packages/game-domain/src/`; `ge/` = `packages/game-engine/src/`.
- Prioridades (seção 23): A = antes do Alpha externo; B = Experience V2; C = Beta; D = futuro/expansão.

---

## 1. Product vision

**Canônico proposto:** jogo de estratégia 4X por turnos simultâneos para 2–6 pessoas. Parece uma **mesa de estratégia, não um site** (Canvas 20). O mapa é o protagonista: nenhum caminho de poder vence sozinho (Bíblia): território, guerra, ciência, economia, diplomacia e cultura se sustentam e se contêm. Sem IA, sem contas: mesa por convite.

**Alpha hoje:** a partida vai de ponta a ponta para 2–6 jogadores, com convite por código ou link, sessão por cookie e PostgreSQL validado. Pilares cobertos em forma simplificada.

**Divergência:** a Bíblia é um jogo de tabuleiro físico + digital (componentes, miniaturas). O Canvas e o Alpha são só digitais. A V4 trata o produto como **digital-first**; a lista de componentes da Bíblia (prancha 26) fica fora do escopo.

## 2. Design pillars

| Pilar (Bíblia/Canvas) | Promessa | Alpha hoje |
|---|---|---|
| Explorar | revelar o mapa, oportunidades, ameaças | exploração por região de 7 hexes; sem descobertas |
| Expandir | cidades, território, redes | fundar, reivindicar, estradas |
| Governar (Desenvolvimento) | população, distritos, especialização | papéis, distritos, governo, ânimo/estabilidade |
| Negociar | tratados, influência, comércio | 6 tratados, ofertas comerciais, rotas, povos |
| Guerrear | logística, cerco, projeção | dado tático, posturas, fortificação, captura |
| Legar / Hegemonia | caminhos declarados e contestáveis | 6 caminhos com metas fixas; Prestígio decide no limite |

**Princípios de experiência (Canvas 02, mantidos):**
1. O mapa ocupa ~60% da tela.
2. Sem rolagem global.
3. A ação da fase está sempre à mão.
4. Contexto sob demanda.
5. Informação em camadas.
6. Materialidade (bronze, pedra, pergaminho).
7. A névoa faz parte do jogo.
8. Desktop primeiro.

Regra de ouro: se uma decisão exige rolar a página, o layout está errado.

## 3. Core loop

**Canônico proposto:**
- **Ciclo da rodada:** MAPA → CONTEXTO → DECISÃO → CONSEQUÊNCIA.
  1. O jogador lê o mapa.
  2. Seleciona algo e vê contexto e opções legais.
  3. Reserva ações com custo e prévia.
  4. Confirma.
  5. Vê o resultado que ele próprio pôde observar.
- **Ciclo da partida:** explorar → contato → expandir/especializar → eras → disputa por Prestígio ou Hegemonia.

**Alpha hoje:** igual, com planejamento secreto e simultâneo, resolução por iniciativa e painel de resultados por jogador (`resolutionEvent` com `visibleTo`).

## 4. Round structure

**Alpha hoje** (`gd/alpha-concept.ts:7-16`, `ge/alpha-phases.ts`):

| # | Fase | Espera jogadores? | O que acontece |
|---|---|---|---|
| 1 | Pulso do mundo | não | carta de Pulso para todos; mão +1; evento mundial a cada 2 rodadas |
| 2 | Planejamento | **sim** | reservar ações (secreto); ações livres; "Voltar a planejar" |
| 3 | Ações urbanas | não | ações das cidades por vaga e iniciativa |
| 4 | Ordens e movimento | não | explorar, mover, rotas |
| 5 | Diplomacia e comércio | não | propostas e guerras planejadas; tratados aceitos entram em vigor |
| 6 | Conflitos | **só atacante/defensor com carta de reação** | reações, ataques, missões de influência |
| 7 | Integração e manutenção | não | rotas, ofertas vencidas, bandos, efeitos, consumo, crescimento, armazém |
| 8 | Fim da rodada | não | ambições, relatório, Hegemonia, limite, iniciativa gira |

**Orçamento de ações**
- Ações principais por rodada: 5–10, padrão 7 (`actionsPerRound`).
- Cada cidade tem 1 ação de cidade, que também gasta 1 ação principal.
- `ACTION_CLASS` define o que é ação principal, livre ou reação.

**Divergências**
- **Canvas:** "Concluir fase" em todas as 8 fases.
- **Bíblia:** Voto de Ritmo e modo assíncrono de 1–8 h. A Bíblia também prevê **financiar a ação urbana de outro jogador** e cartas táticas na batalha.
- **Alpha:** 2 fases interativas; prazo por fase em 7 valores; sem Voto de Ritmo.
- **Decisões:** DEC-004 (fases interativas), DEC-018 (ações e Comando).

**Canônico (DEC-004, aprovada):** 8 fases no motor.
- Planejamento e Conflitos são as principais fases interativas.
- As demais resolvem automaticamente e apresentam claramente suas consequências.
- **Princípio UX canônico: "uma fase do motor não precisa corresponder a uma tela ou clique".**
- Replay por etapa da Resolução é a forma recomendada de apresentar consequências (detalhe de UX V2, não decisão).

O orçamento de ações é a variável central de ritmo (ver §20).

## 5. World / map

**Alpha hoje** (`ge/alpha-world.ts`, `gd/alpha-regions.ts`):

| Aspecto | Estado |
|---|---|
| Grade | 6×5 regiões de 7 hexes = **210 hexes**, fixa para qualquer número de jogadores |
| Templates | 30 (6 pátrias, 24 fronteiras); pátrias em casas fixas por nº de jogadores; fronteiras embaralhadas pelo RNG privado |
| Terrenos | Planície, Floresta, Colinas, Montanha, Costa, Mar (sem Deserto ou frio) |
| Predefinições | Misto, Continental, Arquipélago, Mar Interior (4); corredor de terra garantido entre capitais ativas |
| Recursos especiais | só depósito de Metal (1 por região); RIVER, FERTILE, TIMBER, STONE e FISH existem no catálogo e nunca são gerados |
| Névoa | desconhecido / conhecido / visível; visão = território + 1 hex ao redor de cidades e peças |
| Exploração | qualquer peça adjacente revela a região inteira (+1 Prestígio); o primeiro explorador escolhe a rotação |
| Povos independentes | 3 (Aldeia, Vila, Cidade-estado) em terreno disputado |
| Bandos saqueadores | 2 (força 2 e 3) nos ermos |
| Equidade | capitais em casas autorais compactas |

**Bíblia:** mapas de 37/61/91/127 células (que ela chama de "regiões"; na V4 = hexágonos; raio 3–6), 7 arquétipos, Deserto, 6 fichas de descoberta, raio de revelação 1/2/3 com Cartografia/Navegação, névoa opcional.

> **Nota histórica:** a Bíblia usava "região" para uma célula. Na terminologia canônica (DEC-010), o mapa Alpha tem 210 hexágonos em 30 regiões. Os tamanhos 37/61/91/127 da Bíblia correspondem a hexágonos, não a regiões.

**Canônico proposto:**
- Terminologia espacial (DEC-010, aprovada):
  - **hexágono/hex** = célula individual do tabuleiro;
  - **região** = agrupamento estrutural de 7 hexágonos do mapa Alpha;
  - **território** = hexágonos sob controle/reivindicação de uma civilização ou cidade conforme as regras.
- Tamanhos de mapa futuros são medidos em hexágonos.
- O mapa do Alpha continua fixo.
- Para depois, tamanhos em hexes por número de jogadores, arquétipos e descobertas (D).
- Os três estados de conhecimento precisam ser **visíveis e distintos na UI** (B). Hoje "conhecido" não tem estilo próprio.

**Contato** [DEC-020] (`scripts/alpha-contact-sim.mjs`, 12 sementes, QUICK):

| Jogadores | Civilizações com contato | Rodada (mediana / pior) |
|---|---|---|
| 2 | 24/24 | — / 4 |
| 4 | 48/48 | mediana 3 |
| 6 | 59/72 | mediana 4 / pior 7 |

## 6. Civilizations

**Alpha hoje** (`gd/alpha-institutions.ts:39-55`, `gd/alpha-leaders.ts`):

- **12 civilizações:** Aurélia, Valgard, Merídia, Thalos, Saren, Kor, Orinth, Nymara, Veyra, Solenne, Dravik, Elyra.
- Cada uma tem:
  - capital própria;
  - 2 recursos de ênfase (+1 de cada por manutenção);
  - habilidade **1×/rodada** (+2 A +1 B, ação principal).
- **Líder** (12):
  - passiva: armazém +6 (+4 Metal), raio de suprimento +1 ou integração +10;
  - habilidade 1×/era: Força +2, Movimento +1, Comando +1 (sem efeito), ânimo +1, coesão +15 (sem efeito) ou prorrogar tratado +2.
- Kit inicial igual para todos: 1 Pioneiro + 1 Explorador; capital com 2 habitantes.

**Bíblia:**
- 18 civilizações, em 7 inclinações (Política, Territorial, Econômica, Marítima, Científica, Cultural, Militar).
- Cada uma com kit inicial, traço, habilidade 1×/era, componente exclusivo e limitação; perfil que soma 15.
- 5 unidades exclusivas. **Sem líderes.**
- Faltam no Alpha: Kaedor, Lumaris, Targan, Iskara, Veloria, Norvak.

**Canvas:** 12 civilizações com "viés" de um recurso e um líder de exemplo. A Elyra aparece com "identidade a definir".

**Canônico proposto:** 12 no Alpha, com líderes; as outras 6 são conteúdo D. Identidade qualitativa (kit, limitação) no C. [DEC-011]

**Achados**
- A ênfase usa o termo legado "Materiais".
- A habilidade 1×/rodada diverge do 1×/era da Bíblia.
- Dois líderes (Kor, Elyra) agem sobre Coesão, que não tem efeito.
- Dois líderes (Merídia, Orinth) dão Comando, sem efeito.

## 7. Cities

### 7.1 Alpha hoje: duas progressões

| | Desenvolvimento 1–5 | Nível 1–7 |
|---|---|---|
| Definição | `gd/core.ts:72`, `CityState.development` | `CityLevelSchema`, `cityLevelForPopulation` (`gd/alpha-concept.ts:51-56`) |
| Como muda | DEVELOP_CITY: 5/10/15/20 Materiais, ação principal, bloqueado em estabilidade Crítica | 1 nível por habitante (satura em 7) |
| Efeitos | teto de população 3/5/8/12/16; raio de reivindicação/trabalho 1/1/2/2/3; vagas de distrito 1–5; carga administrativa; +Força de defesa da cidade; defesa contra bandos; marco de era; Hegemonia Territorial; estabilidade da República | **nenhum** (só rótulo) |
| Não afeta | armazém, produção, nº de ações, suprimento, pilhas, fortificação | — |

**Bíblia:**
- Uma escada: Posto, Aldeia, Vila, Cidade, Grande Cidade, Metrópole, Metrópole Imperial.
- Por nível: habitantes 2/4/6/8/11/14/18, distritos 1–8, vagas de edifício 1/3/5/7/10/13/16 e influência.
- Custo em recursos + avanço da Teia (Assembleia, Código de Leis, Burocracia, Direito Civil, Estado Nacional).
- O nível escala Produzir, Recrutar e Pesquisar, o raio de suprimento e o armazém.

**Canvas:** escada 1–7 "conceitual" e o botão "Desenvolver cidade". Em "Perguntas em aberto" registra que as cidades não sobem de nível hoje.

### 7.2 Canônico (DEC-002, aprovada)

A cidade tem **uma única progressão: Nível 1–7**.
- O Desenvolvimento 1–5 **deixa de ser conceito público/canônico**; suas responsabilidades serão absorvidas pelo Nível.
- O Nível **não depende só de população**. A progressão é composta por três pilares:
  1. **população** (requisito mínimo de habitantes);
  2. **infraestrutura/requisitos** (distritos, edifícios, avanços da Teia ou outros requisitos a definir);
  3. **investimento** (custo em recursos e ação para subir).
- O Nível absorve as funções atuais do Desenvolvimento e acrescenta o que a Bíblia liga ao nível quando os sistemas existirem: vagas de edifício, escala de Produzir, raio de suprimento e armazém.
- **Não implementado.** A fórmula exata (que requisitos por nível, custos, tetos) é detalhamento de regras da V4 a validar por playtest; não é uma decisão aberta nova.

### 7.3 Efeitos colaterais da recomendação

- **Regras:** `populationCap`, `cityRadii`, `districtSlots`, `deriveAdministration`, `alpha-combat.ts:71`, defesa contra bandos (`alpha-world.ts:129`), critério `development` dos marcos, `developedCities` (Hegemonia) e a estabilidade da República.
- **UI:** painel da cidade, botão Desenvolver, critérios de era, cartão Territorial.
- **Persistência:** migração de save.

### 7.4 Migração conceitual (não implementar)

1. Para saves existentes, o nível inicial deriva do Desenvolvimento pago (investimento já feito) e não só da população. Tabela proposta (a validar):

| Desenvolvimento | Nível |
|---|---|
| 1 | 2 |
| 2 | 3 |
| 3 | 4 |
| 4 | 5 |
| 5 | 6 |

   O Nível 7 fica reservado.
2. Converter limiares que hoje leem Desenvolvimento ≥3 (Territorial, República) para Nível ≥4.
3. Custos e tetos passam a ser parâmetros da escada única, reequilibrados por playtest.
4. Saves antigos: migração aditiva (o campo `development` permanece lido e derivado), como nas migrações v3→v5.

### 7.5 Outros fatos da cidade

- 1 ação por rodada.
- Ocupação → integração por Ação cívica (3 Influência, +25%; a partir da rodada seguinte à captura).
- Fortificação: 5 níveis com integridade. **Não há ação de reparo**; só o nível seguinte restaura.
- A guarnição tem três sentidos no código (ver terminologia, item 6).

## 8. Population

**Alpha hoje** (`gd/rules.ts:62-67`, `ge/alpha-phases.ts:183-232`, `ge/economy.ts`):

| Item | Regra |
|---|---|
| Consumo | 1 Alimento/habitante/rodada |
| Crescimento | limiar 10 (Celeiro 8); +1/rodada no máximo |
| Fonte do crescimento | só o Alimento **creditado por Produzir** menos o consumo, na civilização inteira, dividido por igual entre as cidades abaixo do teto |
| Papéis | Produtor 2 Alimento (ou o rendimento do hex trabalhado), Artesão 1 Material, Mercador 1 Riqueza, Estudioso 1 Conhecimento; Soldado e Livre não produzem nada |
| Cidade inicial | 1 Produtor + 1 Estudioso; produz +2 Alimento e come 2 → **não cresce sem mudança** |
| Falta de comida | −5 de estabilidade em todas as cidades, sem crescimento |
| População | nunca diminui |

**Bíblia:**
- 1 Comida a cada 2 habitantes.
- Excedente → crescimento 4:1.
- Papéis com 6 atributos (Produção, Comércio, Conhecimento, Defesa, Crescimento, Administração); Soldado com Defesa.

### 8.5 Comportamento desejado e métricas [DEC-007]

Sem rebalancear agora.

**Comportamento desejado:** a primeira cidade cresce sem microgestão em ritmo lento; especializar papéis e trabalhar hexes acelera; não há bola de neve exponencial.

**Métricas a coletar** (telemetria hoje ausente; `telemetry` tem campos nunca escritos):
- rodada em que a primeira cidade chega a 3 e a 5 habitantes;
- % de cidades estagnadas por 3+ rodadas;
- população total por rodada (2/4/6p);
- % de rodadas com Produzir em todas as cidades;
- número de mudanças de papel por partida.

**Bug de UI registrado:** a previsão "Com Produzir… cresce em N rodadas" (`apps/server/src/alpha-projection.ts`) soma efeitos ON_PRODUCE e calcula por cidade. O motor usa a produção da civilização inteira sem ON_PRODUCE. A previsão pode divergir. Prioridade A (corrigir ou remover) após aprovação.

## 9. Economy

### Alpha hoje

- **7 recursos**
  - Alimento, Madeira, Pedra, Metal, Riqueza: armazenáveis.
  - Conhecimento, Influência: sem teto.
  - O pool legado de 5 (com "Materiais") ainda é espelhado internamente (`syncLegacyResources`), e a produção é creditada como Materiais e dividida Madeira ⌈m/2⌉ / Pedra ⌊m/2⌋.
- **Produção:** só existe pela ação Produzir (`productionOutput`). Nada é automático, exceto efeitos de manutenção: passivas de civilização, avanços, conselheiros e projetos.
- **Armazém:** base por cidade × nº de cidades (Alimento 20, Madeira 15, Pedra 15, Metal 10, Riqueza 25), + Celeiro +10 Alimento, + líder. Armazém, Tesouro e Banco dariam bônus mas não são construíveis. O excedente é descartado e registrado [DEC-008].
- **Riqueza substitui materiais:** 2 Riqueza = 1 material, até 50% do custo em materiais (arredondado para baixo; custos de 1 não permitem substituição).
- **Metal:** depósito + Mina + Produtor trabalhando o hex.
- **Administração:** carga = ⌊hexes/5⌋ + Σ por cidade [1 + ⌊(dev−1)/2⌋ + ⌊pop/5⌋]; capacidade = 3 + governo + distrito Administrativo/Arquivo. Sobre-extensão: −10% da produção não-alimentar e −3 de estabilidade/rodada.
- **Estabilidade** (0–100) por faixa: 75/90/100/100/110%.
- **Ânimo** (0–6):
  - Efeito por estado: −100/−50/−25/0/+10/+20/+30% e estabilidade −2…+1.
  - **Só sobe**: Investimento público (3 Riqueza, até 5) e líder. Exultante é inalcançável. [DEC-022]
- **Rotas:** renda **só** via ação Sustentar comércio (+2 Riqueza por rota de origem, +1 ao receptor estrangeiro) [DEC-019].

### Bíblia

- Tetos civilizacionais (8–12 + Σ níveis + edifícios).
- Mercado (troca 3:2, monetizar 3:1) e Banco (1:1, empréstimos).
- Excedente → monetizar ou crescer.
- Legado Cultural 0–40.
- Riqueza nunca compra Conhecimento ou Influência (igual ao Alpha).

### Canônico proposto

- 7 recursos, e "Materiais" removido da UI (A).
- Produção ativa por Produzir (manter: é a decisão central da cidade).
- Armazém civilizacional com escala por Nível depois de DEC-002 (C).
- Mercado e Banco no C.
- Ânimo com causas de queda (C) [DEC-022].

## 10. Technology / Teia

### Alpha hoje (`gd/alpha-institutions.ts:19-37`)

- **Estrutura:** 50 avanços = 5 eras × 5 domínios (Conhecimento, Sociedade, Economia, Guerra, Cultura) × 2 ramos. Custo 2–6 Conhecimento. Cada um é pesquisado por uma ação de cidade e dá +1 Prestígio.
- **Pré-requisitos:** o ramo 1 da era anterior no mesmo domínio.
- **Convergências:** 10, que exigem também o ramo 1 do domínio vizinho.
- **Exclusão:** só 1 par (Centralização × Federação).
- **Efeitos:**
  - +1 de produção na manutenção (maioria);
  - Força +1 (Guerra, ramo 2);
  - **Comando +1** (Sociedade, ramo 2), sem efeito [DEC-018].
- **Desbloqueios qualitativos:** só 4, todos limites de pilha (Treino de Manobras 7, Comando Coordenado 8, Cartografia Operacional frota 5, Doutrina de Proteção guarnição +1).
- **Não liberam:** edifício, unidade, governo, ação, navegação ou raio de exploração.

### Bíblia

- 40 avanços em cadeias nomeadas por domínio.
- Cada um libera algo concreto:
  - edifícios (Escrita → Casa dos Escribas);
  - unidades (Ferro → Infantaria Profissional);
  - níveis de cidade (Assembleia → Nível III);
  - raio de revelação (Cartografia);
  - rotas (Moeda, Crédito);
  - Comando (Burocracia).
- 10 convergências com efeito próprio.
- 3 escolhas OU.
- **Inconsistência interna:** a capa diz "50 avanços".

### Canvas

Grade era × domínio com os mesmos 50 nomes do Alpha, linhas de pré-requisito e exclusão.

### Função canônica proposta [DEC-012]

A Teia é o sistema que **muda o que a civilização pode fazer** (mudança qualitativa); bônus numéricos ficam secundários.

| Categoria | Exemplos | Pré-condição |
|---|---|---|
| Edifícios | Celeiro, Mercado, Biblioteca, Porto | DEC-013 |
| Unidades e modernização | Lanceiros, Cerco | DEC-014 |
| Nível de cidade | IV, V, VI, VII | DEC-002 |
| Exploração | raio 2 | — |
| Comércio | rotas por terra e por mar | DEC-019 |
| Governos | Era III | DEC-021 |
| Capacidades militares | pilha, guarnição | **já existe** |

Bônus numéricos permanecem como recompensa secundária.

**No Alpha externo:** manter os nós atuais e corrigir os efeitos mortos (A).

## 11. Military

### Alpha hoje (`gd/alpha-catalog.ts`, `ge/alpha-combat.ts`, `ge/alpha-stack.ts`)

**Peças** (9 classes; movimento/força):

| Peça | Mov/Força | Observação |
|---|---|---|
| Infantaria | 2/2 | |
| Guarda | 2/2 | modificador contra cidade +2, só no ataque |
| Arqueiros | 2/1 | |
| Cavalaria | 3/2 | Planície +1 |
| Cerco | 1/1 | abre brecha |
| Frota | 3/3 | Costa/Mar |
| Explorador | 3/0 | |
| Pioneiro | 2/0 | |
| Emissário | 3/0 | |

- Limite: 24 peças por civilização.
- Guarda, Arqueiros, Cavalaria e Cerco exigem distrito Militar.

**Combate:** 1 choque.
- Força + modificadores estáticos discriminados (terreno, suprimento −2, fortificação 0–5, defensores abrigados, técnica, líder, cartas).
- Posturas em ciclo; a vencedora ganha +1 e uma face reforçada.
- 1 d6 por peça com força; Comando por classe.
- Empate favorece o defensor.
- Perdas só no lado derrotado (1/2/3 pela margem; as mais fracas morrem primeiro, então civis antes).
- O defensor recua para hex vizinho ou é destruído. O atacante vencedor avança o que cabe na pilha e captura a cidade.

**Pilhas:** Exército 6 (7/8 por avanço), Civis 2, Frota 4 (5); guarnição 6 + Militar + fortificação + doutrina (teto 10).

**Guerra:** exige declaração; o ataque pode ser reservado na mesma rodada da declaração. A paz vem só por Pacto de não agressão ou Aliança aceitos. PNA **não impede** declarar guerra (só custa −2 Prestígio por tratado).

### Bíblia

- 6 famílias com escalas (Milícia → Mosqueteiros etc.), atributos ATQ/GRD/MOV/SUP/MAN e Modernização (pagar a diferença).
- 5 unidades exclusivas.
- Combate em até 3 choques e 12 passos.
- Terreno converte Vazio em Guarda.
- Cartas táticas com composição.
- Sem suprimento: Comando anulado e manutenção dobrada.

### Canônico proposto

- Manter o núcleo do Alpha (dado tático, posturas, fortificação, pilhas): é a parte mais fiel à Bíblia.
- Escalas e Modernização no C.
- Unidades exclusivas no D.
- Decidir no B se PNA bloqueia guerra [DEC-015].

## 12. Naval

**Alpha hoje:**
- Uma classe Frota (Costa/Mar, força 3), recrutável só em cidade de Costa.
- **Todas as capitais iniciais ficam em Planície**, então na prática nenhuma capital recruta Frota.
- Sem transporte, bloqueio, missões ou naufrágio.

**Bíblia:**
- 7 navios: Embarcação Costeira, Mercante, Galera, Galera de Guerra, Nau de Transporte, Carraca, Fragata.
- Missões: Escoltar, Bloquear, Transportar, Patrulhar.
- Vagas de embarque por tipo de peça.
- Naufrágio com resgate.
- Desembarque anfíbio com penalidade.
- Porto abastece.
- Rotas marítimas exigem Crédito.
- Piratas são um tipo de bando.

**Canônico proposto (visão; não implementar):** naval como camada própria com quatro funções — transporte, bloqueio de rota/porto, combate e comércio marítimo. Mínimo viável no C (transporte + bloqueio); o resto no D. No Alpha externo, **esconder a Frota** ou dar a ela um caminho real [DEC-014].

## 13. Diplomacy

### Alpha hoje (`ge/alpha-diplomacy.ts`, `ge/alpha-trade.ts`)

- **Contato:** por visão mútua ou missão de influência.
- **Tratados:** 6, cada um por 3 rodadas. Proposta = ação principal; resposta livre.
  - Fronteiras abertas e Aliança abrem movimento.
  - Acordo comercial permite rota internacional.
  - Pacto defensivo e Aliança chamam aliados (1 nível).
  - PNA e Aliança encerram guerra.
  - Embargo bloqueia rotas e ofertas. **Precisa do aceite do alvo.**
- **Quebra:** encerrar um tratado ativo custa −2 Prestígio; declarar guerra com tratado ativo ou aceito, −2 por tratado.
- **Ofertas comerciais:**
  - Tipos: troca imediata, presente, promessa, empréstimo.
  - Bens exatos; recusadas em guerra ou embargo; até 4 abertas.
  - Valem na própria rodada.
  - Calote = −2 Prestígio.
  - `treatyTerms` é aceito e ignorado.
- **Rotas:** caminho conhecido; suspensas em guerra, embargo ou perda da origem; renda só com Sustentar comércio.

### Bíblia

- Confiança 0–5 e Tensão 0–5 por par.
- Reputação em 5 níveis.
- Custo de Influência nos tratados.
- Garantias em contratos e juros.
- Financiar a ação urbana de outro jogador.
- Mercado e Banco.
- Renda de rota proporcional ao nível.
- Rotas por terra exigem Moeda, por mar Crédito.

### Classificação proposta [DEC-015]

| Sistema | Classe | Motivo |
|---|---|---|
| Tratados (6) | essencial (existe) | eixo da diplomacia |
| Ofertas comerciais (4) | essencial (existe) | interação econômica entre jogadores |
| Reputação | opcional, pós-Alpha (C) | memória de quebras e calotes; função distinta do Prestígio |
| Confiança | redundante com Reputação + tratados | não adicionar |
| Tensão | redundante com guerra/embargo; só se houver escalada automática | não adicionar agora |
| Custo de Influência nos tratados | opcional (C) | dá função à Influência |
| Garantias e juros | pós-Alpha (D) | complexidade alta, uso raro |
| Financiar a ação de outro jogador | opcional (C) | interação nova e distinta |
| Mercado/Banco | C (economia) | conversão de excedente |

## 14. Culture

### Modelo canônico proposto [DEC-016]

| Conceito | O que é | Unidade | Ganha com | Gasta / perde com |
|---|---|---|---|---|
| **Influência** | recurso político | número sem teto | distritos e edifícios culturais, Ação cívica, cartas | reivindicar, integrar, povos, Emissário, (tratados) |
| **Cultura** | domínio temático (Teia, distritos, caminho) | — | — | — |
| **Presença cultural** | posição de uma civilização numa cidade estrangeira | Contato → Enraizada → Predominante (3 vagas) | missão de influência do Emissário; vencer disputa | perder disputa |
| **Disputa cultural** | duelo 2d6 + nível + distritos Culturais (até 3) + âncora | evento | ação principal | — |
| **Legado** (Bíblia) | trilha permanente de 0–40 com marcos | — | — | não existe no Alpha; decidir se entra (C) |
| **Prestígio** | placar da partida | pontos | marcos e realizações | quebras e calotes |

### Alpha hoje

- A presença nasce de missão de influência (Emissário vizinho, em paz).
- Disputa só entre duas civilizações **estrangeiras** à cidade, ou seja, **impossível em 2 jogadores**.
- A Coesão local não tem efeito, e as habilidades Coesão +15 (Kor, Elyra) são inúteis.
- A Hegemonia Cultural usa Influência ≥25, 2 distritos Culturais e presença em 3 cidades.

## 15. Independent peoples

### Alpha hoje (`ge/alpha-independents.ts`)

- **3 povos:** Aldeia, Vila, Cidade-estado, que viram cidades de 1/2/3 habitantes.
- **Atitudes:** 4 (Hostil, Desconfiado, Neutro, Amistoso). **Todos começam Neutros e só melhoram**, então Hostil e Desconfiado nunca ocorrem.
- **6 ações** (ação principal, basta o hex conhecido):

| Ação | Regra |
|---|---|
| Comerciar | 1 Riqueza → 2 Alimento |
| Negociar | atitude +1 (recusado se já Amistoso) |
| Influenciar | +1 de influência sobre o povo |
| Proteger | Amistoso + influência 2; `protectorId` sem efeito |
| Integrar | Amistoso + influência 3 → vira cidade |
| Conquistar | Força no hex 2/3/4; **não exige guerra** |

- **Bandos:** 2, avançam 1 hex por rodada até o alvo fraco mais próximo, matam a peça mais fraca e reduzem a estabilidade. Não podem ser atacados e nunca morrem.

### Bíblia

- Aldeia/Vila/Cidade-estado com 2/4/8 habitantes e guarnições "quantidade ≠ força".
- Atitudes iniciais variadas.
- Interações com contrato ou tributo.
- 4 tipos de bando com contramedidas, que **só se movem quando disparados**.

### Canônico proposto

- Povos como no Alpha + atitudes iniciais variadas e uma função para Proteger (C).
- Bandos atacáveis (B/C).
- Decidir entre "movem sempre" e "movem quando disparados" [DEC-017 relacionado].

## 16. Events / cards / projects

### Inventário Alpha (`gd/alpha-cards.ts`, `gd/alpha-concept.ts:175-200`)

| Família | Qtde | Função hoje |
|---|---|---|
| Pulso do mundo | 24 | 1 por rodada, automático, ±1–2 de um recurso para todos (2 sem efeito) |
| Evento mundial | 24 | trocado a cada 2 rodadas (rodadas 1, 2, 4, 6…); cada um escolhe recurso +2 ou +1 Prestígio |
| Estratégia | 30 | 15 de recurso; 5 reações (+Força); 5 de Movimento; **5 de Comando (sem efeito)** |
| Ambição | 24 | 3 por métrica; secretas; 2 escolhidas |
| Conselheiro | 18 | +1 recurso por rodada; Força; Movimento; **Comando (sem efeito)** |
| Grande Projeto | 12 | único no mundo; distrito + era; +2 recurso, +4 Prestígio |

- **Total de cartas:** 108 (+24 de Pulso).
- **Distribuição:** mão inicial de 3 estratégias e 3 ambições; +1 por rodada até 5; os baralhos de estratégia e ambição **não são reembaralhados**, e com 6 jogadores a estratégia acaba por volta da rodada 3.

### Bíblia (v3)

| Família | Qtde |
|---|---|
| Pulso | 60 (20 positivos, 24 negativos, 16 mistos; severidade I–III) |
| Encontros de Fronteira | 30 |
| Táticas | 45 (com composição de exército) |
| Estratégia | 33 |
| Ambições | 24 |
| Conselheiros | 18 |
| Obras de Legado | 12 |
| **Total** | **222** |

Inconsistências internas da Bíblia: o cabeçalho de Estratégia diz 30–36 contra 33 nos dados; as Obras usam termos v1 ("alvo −2").

**Canvas:** projetos em 5 etapas com concorrência ("Beto 2/5").

### Canônico proposto [DEC-017]

| Item | Proposta |
|---|---|
| Pulso | "clima do mundo", automático |
| Evento mundial | decisão |
| Pulso condicional com severidade | C |
| Encontros e Táticas | D |
| Obras com efeitos únicos e etapas | C |
| Reembaralhar o descarte | A |
| Remover ou consertar cartas de Comando | A |
| Números canônicos | só após DEC-001 |

## 17. Governments

### Alpha hoje (`gd/rules.ts:74-80`, `ge/management.ts`)

- **5 governos:** Monarquia, República, Oligarquia, Teocracia, Confederação.
- **Adoção:** grátis, a qualquer momento, 1 ação; **definitiva**.
- **Efeitos que funcionam:**
  - capacidade administrativa (Monarquia +2, Confederação +1 por cidade);
  - estabilidade (Monarquia na capital, República em cidades dev ≥3, Teocracia +2, Confederação +2 com 2+ cidades);
  - Riqueza +10/15% (Oligarquia).
- **Efeitos sem efeito:**
  - os campos `future*` (+10% de Conhecimento/Influência etc.), que a doc antiga anuncia;
  - Comando −1 da Confederação.
- **No código, sem uso:** Meritocracia e Autocracia aparecem em `GovernmentCatalogSchema`.

### Bíblia

- 7 governos, com 5 eixos que somam 16.
- Adoção na Era III; reforma com custo político.
- Repressão disponível em Monarquia e Autocracia.
- Ligação com sistemas (Templos, Praças, Mercados).

### Canônico proposto [DEC-021]

- **Alpha:** 5 governos, remover da UI e da doc os efeitos inexistentes (A).
- **Beta:** 7 governos, adoção a partir de uma era, reforma com custo, efeitos ligados à Teia e a edifícios (C).

## 18. Eras

### Alpha hoje (`ge/alpha-institutions.ts:73-89`, `gd/alpha-concept.ts:293-299`)

- **6 eras.** Avançar = ação principal, sem custo, +2 Prestígio.
- **Critérios contados** (cidades, população, território, distritos, pesquisa, desenvolvimento, contatos, governo):
  - Fundação → Expansão: 4 de 7;
  - os passos seguintes: 4–5 de 8.
- **O que cada era abre:**
  - unidades (Expansão: Arqueiros, Cavalaria, Frota; Civilização: Cerco);
  - fortificações por era;
  - 10 avanços por era (Hegemonia: nenhum);
  - Grandes Projetos (Civilização/Impérios);
  - a Era VI só libera declarar Hegemonia.
- **Ritmo observado:** bot de desenvolvimento chega a Expansão na rodada 3 e a Civilização na rodada 6; ninguém chega à Era VI em 9 rodadas.

### Bíblia e Canvas

- **Bíblia:** 6 eras (Hegemonia é a VI); as eras "abrem possibilidades, nunca concedem"; rodadas por era = total/6.
- **Canvas:** "5 eras" na capa e linha do tempo I–V, mas "Era III: 3 de 5 critérios".

### Canônico (DEC-005, aprovada com alteração)

- Eras como **marcos de capacidade** (abrem opções), avançadas por critérios contados (manter).
- **6 eras** de progressão civilizacional (DEC-005, aprovada com alteração).
- **Hegemonia não é era**: é condição/estado de vitória (§19).
- A sexta era é o estágio final de ascensão, imediatamente anterior à disputa plena por Hegemonia.

Nomenclatura canônica provisória:

| Era | Nome | Origem |
|---|---|---|
| I | Fundação | Bíblia, Canvas, Alpha |
| II | Expansão | Bíblia, Canvas, Alpha |
| III | Civilização | Bíblia, Canvas, Alpha |
| IV | Impérios | Bíblia, Canvas, Alpha |
| V | **Potências** | DEC-023 (nas fontes antigas, V = Ascensão) |
| VI | **Ascensão** | DEC-023 (nas fontes antigas, VI = Hegemonia; o Canvas não tem VI) |

O Alpha atual diverge: os IDs são `ASCENSION` = V e `HEGEMONY` = VI, e a Era VI só libera declarar Hegemonia e não tem avanços. A migração é futura (gap map).
- O ritmo de eras deve casar com DEC-003.

## 19. Prestige / Hegemony / victory

### Prestígio (Alpha)

| Variação | Fonte |
|---|---|
| +1 | região explorada (1ª vez) |
| +1 | avanço pesquisado |
| +2 | era |
| +1 | Evento mundial com escolha Prestígio |
| +4 | Grande Projeto |
| +2/3/4 | ambição (uma vez cada) |
| −2 | por tratado quebrado ao declarar guerra |
| −2 | ao encerrar tratado ativo |
| −2 | calote |

- Batalhas, capturas, fundar cidade e cultura **não dão** Prestígio.
- Piso: 0.

### Hegemonia (Alpha)

| Caminho | Metas (fixas) |
|---|---|
| Militar | Força 12; vitórias 2; peças militares em território estrangeiro 2 |
| Econômica | Riqueza 30; rotas internacionais 2; parceiros comerciais 1 |
| Científica | pesquisas da Ascensão 2; distritos Acadêmicos 2; projeto científico 1 |
| Cultural | Influência 25; distritos Culturais 2; cidades estrangeiras com presença 3 |
| Política | parceiros diplomáticos 1; cidades com presença 3; projeto político 1 |
| Territorial | território 10/14/18 (por duração); cidades dev ≥3: 2/3; dentro da capacidade |

- **Declaração:** só na Era VI, permanente, grátis, sem exigir as metas no ato.
- **Sustentação:** `qualifiedSince` zera em qualquer falha; vence quem tiver `rodada − qualifiedSince ≥ 2`, verificado no fim da rodada; empate pela iniciativa.
- **Limite de rodadas:** vence o maior Prestígio; desempate por pesquisas, população, Riqueza e iniciativa.

### Bíblia

- Declarar → contestar → sustentar 2 rodadas.
- Metas **escaladas** por jogadores, tamanho do mapa (células na Bíblia) e arquétipo.
- Livro de marcos de Prestígio (cidades, distritos, cadeias, governo, Obra, presença, conquista, exploração 25%), cada marco uma vez.
- Modos de vitória: Hegemonia + Prestígio, só Prestígio, Conquista Total.

### Canônico [DEC-003; DEC-006 aprovada quanto à declaração]

- Os requisitos de um Caminho podem ser construídos e contabilizados ao longo de toda a partida.
- **Declarar Hegemonia só na Era VI — Ascensão** (DEC-006). Depois de declarar, sustentar 2 rodadas completas.
- A progressão não é comprimida para a Rápida; partida curta pode terminar por Prestígio (aceitável).
- Metas fixas ou escaladas: **ainda aberto** (DEC-006, parte de escala).
- Prestígio por marcos únicos (antifarm), incluindo conquista e fundação (C).
- Modo de vitória escolhido na criação da mesa (C).
- **"Hegemonia" designa exclusivamente a condição de vitória e os seus caminhos (DEC-005, aprovada).** A declaração é liberada na Era VI — Ascensão (no código, o ID ainda é `HEGEMONY`).

## 20. Match configuration

### Alpha (`apps/server/src/alpha-room.ts:23`)

| Opção | Valores |
|---|---|
| Lugares | 2–6 |
| Duração | Rápida, Padrão, Épica (9/15/20 rodadas) |
| Mundo | Misto, Continental, Arquipélago, Mar Interior |
| Semente | opcional |
| Prazo por fase | nenhum, 3, 5, 8 min, 1, 4, 8 h; ao vencer, o jogador é dado como pronto e as ambições são escolhidas automaticamente |
| Ações por rodada | 5–10, padrão 7 |

### Bíblia

- População inicial 2/3.
- Duração 24/36/48.
- Mapa 37/61/91/127.
- 7 arquétipos.
- Névoa, povos e intensidade de bandos/Pulso como opções.
- Cartas táticas.
- Armazém ilimitado (casual).
- Nível máximo 5/6/7.
- Modo de vitória.
- Relógio 3/5/8 min.
- Voto de Ritmo.
- Assíncrono.
- Presets Acelerado e Épico.

### Ações por rodada como variável central (sem alterar)

Hoje, o padrão de 7 ações quase nunca se esgota em jogo dirigido (bots usam 2–4).

Métricas futuras, por número de jogadores:
- tempo mediano de Planejamento;
- ações usadas e não usadas;
- ações recusadas;
- tempo de espera do último jogador;
- nº de decisões com custo de oportunidade real (cidade sem Produzir, peça parada).

### Canônico proposto

Manter as opções do Alpha. Adicionar no C:
- tamanho do mapa;
- população inicial;
- intensidade de bandos/Pulso;
- modo de vitória.

## 21. Canonical terminology

Ver `docs/product/canonical-terminology-v4.md`.

Resolvidas por decisão aprovada (o Alpha ainda precisa migrar a UI):
- Nível × Desenvolvimento → só Nível (DEC-002);
- Hegemonia era × vitória → só vitória (DEC-005);
- Região célula × bloco → região = 7 hexágonos (DEC-010).

Colisões ainda abertas:
- Ações × Comando;
- "Materiais";
- Guarnição (3 sentidos);
- Pulso × Evento mundial;
- Grande Projeto × Obra de Legado.

## 22. UX information architecture

### 22.1 Cinco camadas (validação)

| Camada | Conteúdo | Avaliação |
|---|---|---|
| GLOBAL | rodada, fase, iniciativa, prontos, recursos e tetos, Administração, ações, Prestígio, era | Adequada. Acrescentar o **modo de vitória da mesa** e o **alerta de pendências** (evento, proposta) |
| WORLD | mapa, estados de névoa, cidades, peças, territórios, fronteiras, rotas, povos, bandos, presença cultural, ordens desenhadas | Adequada; é o centro |
| CONTEXT | cidade, hex/território, pilha, civilização (relação), povo independente | Adequada. Acrescentar **relação diplomática** como contexto selecionável a partir do mapa |
| DECISION | ação, custo, requisitos e o que falta, prévia (combate, crescimento), confirmação, cancelamento | Adequada. Acrescentar **orçamento** (ações e vaga da cidade) e **checagem antes de confirmar** |
| KNOWLEDGE | Teia, cartas, projetos, eras e Hegemonia, crônicas, compêndio | Adequada. **Falta CONSEQUENCE como camada própria**: o resultado da rodada (eventos, batalhas, relatório de recursos) não é conhecimento de referência; é feedback |

**Proposta:** seis camadas — GLOBAL, WORLD, CONTEXT, DECISION, **CONSEQUENCE**, KNOWLEDGE.

### 22.2 Elementos centrais da Experience V2 (sem desenhar)

| Elemento | Hoje |
|---|---|
| Mapa protagonista | sim, 3 colunas |
| Minimapa | ausente |
| Caminho visual (pathfinding) | destinos destacados; caminho não desenhado |
| Setas de ataque | ausente |
| Fronteiras | cor do dono |
| Rotas | não desenhadas |
| Camada cultural | ausente |
| Três estados de névoa | "conhecido" sem estilo |
| Seleção contextual | Inspetor Cidade/Território/Militar |
| Painel da cidade | lateral; sem tabuleiro de distritos |
| Teia em grafo | grade de cartões |
| Hierarquia de recursos | barra única com 7 recursos e tetos |
| Fase/rodada | barra inferior + superior |
| Feedback de consequências | painel de resolução + Crônicas |

**Bloqueios do desenho:** DEC-001, DEC-002, DEC-004, DEC-005 e DEC-010 foram **aprovadas**. **DEC-023** (nomes das eras) também foi aprovada. Princípio derivado da DEC-004: as telas da V2 representam **Planejar → Resultado → (Conflitos)**, não 8 fases.

## 23. Alpha / Beta / Future scope

As correções de integridade que precedem a reconstrução visual estão em `v4-gap-map.md`, seção **"Alpha correctness before Experience V2"** (P0/P1/P2). A tabela abaixo é a matriz de escopo por sistema.

| Sistema | Classe | Justificativa |
|---|---|---|
| Efeitos de Comando mortos (cartas, conselheiros, líderes, Confederação) | **A** | Hoje há conteúdo que não faz nada |
| Coesão sem efeito (2 líderes inúteis) | **A** | Idem |
| Frota impossível de recrutar nas capitais | **A** | Unidade anunciada e inalcançável |
| Previsão de crescimento divergente | **A** | A UI não pode mentir |
| "Materiais" na UI | **A** | Recurso inexistente |
| Doc antiga (glossário, regras, guia de 5 fases) | **A** | Contradiz o jogo para testadores |
| Reembaralhar baralhos esgotados (6p) | **A** | A mão seca na rodada ~3 |
| Rápida não alcança Hegemonia: comunicar | **A** | Expectativa errada |
| Disputa cultural impossível em 2p: comunicar ou decidir | **A** | Botão sem caso de uso |
| Nível 1–7 como única escada na UI (DEC-002 aprovada; regra no C) | **B** | A UI V2 desenha uma escada |
| Minimapa, caminho, setas, névoa em 3 estados, camadas | **B** | Núcleo do Canvas |
| Painel/gaveta da cidade | **B** | Canvas 10 |
| Teia em grafo | **B** | Canvas 11 (depende do formato da Teia) |
| Terminologia unificada | **B** | Base da UI V2 |
| Teia qualitativa e catálogo de edifícios | **C** | Mudança de regras ampla |
| Nível com custos e Teia; armazém por nível | **C** | Depende de DEC-002/008 |
| Suprimento progressivo e estrada útil | **C** | Logística |
| Escalas de unidade e Modernização | **C** | Profundidade militar |
| Naval mínimo (transporte, bloqueio) | **C** | Mapas com mar |
| Reputação, custo de tratado, financiar ação | **C** | Profundidade diplomática |
| Mercado e Banco | **C** | Economia de excedente |
| 7 governos com reforma | **C** | Governo como escolha recorrente |
| Metas de Hegemonia escaladas; marcos de Prestígio | **C** | Vitória justa em 2–6p |
| Pulso condicional e Obras com efeito | **C** | Eventos com decisão |
| Tamanhos de mapa, arquétipos, descobertas | **D** | Gerador novo |
| Civilizações 13–18, unidades exclusivas | **D** | Conteúdo |
| Naval completo (7 navios) | **D** | Expansão |
| Cartas Táticas e Encontros | **D** | Conteúdo |
| Legado Cultural | **D** | Depende de DEC-016 |
| Voto de Ritmo, assíncrono | **D** | Infraestrutura |

## 24. Known unresolved decisions

Ver `product-owner-decision-register.md`.
- **Aprovadas:** DEC-001, DEC-002, DEC-004, DEC-005 (com alteração), DEC-010.
- **Aprovadas depois:** DEC-023; DEC-006 (declaração).
- **Abertas:** DEC-003, DEC-006 (escala das metas), DEC-007, DEC-008, DEC-009, DEC-011 a DEC-022.

### Inconsistências adicionais registradas (sem decisão própria)

1. A rotação na exploração move terreno mas não o depósito de Metal, que pode parar fora de Colina/Montanha.
2. Arredondamento para baixo da substituição por Riqueza: custos de 1 Material nunca permitem substituir.
3. Um Material ímpar vira sempre Madeira (+1 Material → 1 Madeira, 0 Pedra).
4. Guarda: o modificador de cidade vale só no ataque.
5. Perdas matam primeiro as peças civis do lado derrotado.
6. Telemetria declara contadores (batalhas, capturas, Hegemonia) que nunca são escritos.
7. Embargo exige aceite do alvo e conta como "tratado" para ambições.
8. Conquistar povo independente não exige guerra nem dá Prestígio.
9. MANAGE FOUND_CITY não é bloqueado e falharia com erro genérico de integridade.
10. A habilidade da civilização é 1×/rodada; a do líder, 1×/era.
11. A previsão de crescimento da UI e o motor calculam de forma diferente (§8.5).
12. O Canvas mostra o viés de civilização com recursos diferentes do Alpha (ex.: Valgard "Pedra" × Alpha Materiais+Alimento).

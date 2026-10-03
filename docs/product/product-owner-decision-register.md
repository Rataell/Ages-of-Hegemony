# Registro de decisões do Product Owner — V4

Status: **DEC-001, DEC-002, DEC-004, DEC-005 (com alteração), DEC-010, DEC-023 e DEC-006 (quanto à declaração) APROVADAS em 2026-10-03**. As demais estão **AGUARDANDO PRODUCT OWNER**. Uma decisão nova, DEC-023, surgiu da aprovação da DEC-005.
Ordem: primeiro as que bloqueiam a Experience/UI V2 (marcadas **[bloqueia UX V2]**), depois regras.
Fontes: Bíblia v3.1 (artefato `QrXXeJtE…`), Canvas UX (artefato `8BJPUCa5…`), código em `feature/aoh-playable-alpha-v1` (`547ff39`). Detalhes em `canonical-product-spec-v4-draft.md`.

---

## DEC-001 — Qual fonte manda nos números do produto **[bloqueia UX V2]**

**Problema:** Bíblia v3 diz 18 civilizações, 24/36/48 rodadas, 6 eras, sem líderes, 222 cartas. Canvas diz 12 civilizações, 9/15/20 rodadas, "5 eras" na capa (mas 6 caminhos), com líderes. Alpha segue o Canvas (12 civs, 12 líderes, 9/15/20, 6 eras, 108 cartas).

**Opção A:** Bíblia v3 é a meta de conteúdo; Alpha/Canvas são um recorte.
**Opção B:** Canvas + Alpha são a base; a Bíblia vira banco de ideias.
**Opção C:** V4 decide sistema a sistema (este documento), sem fonte vencedora.

**Recomendação:** C. Bíblia para intenção de design, Canvas para experiência, código para o que existe; números só entram na V4 por decisão explícita.

**Consequências:** a V4 vira a única referência; Bíblia e Canvas ficam como históricos.

**Status: APROVADA.** Nenhuma fonte histórica vence automaticamente. A V4, depois de aprovada, é a fonte normativa do produto. Bíblia, Canvas e Alpha permanecem como referências históricas, conceituais e de implementação.

---

## DEC-002 — Uma progressão de cidade: Nível 1–7 substitui Desenvolvimento 1–5 **[bloqueia UX V2]**

**Problema:** o código tem dois "tamanhos" de cidade.
- *Desenvolvimento* 1–5 é pago (5/10/15/20 Materiais). Ele define:
  - teto de população 3/5/8/12/16;
  - raio de reivindicação 1/1/2/2/3;
  - vagas de distrito 1–5;
  - carga administrativa;
  - força de defesa e de defesa contra bandos;
  - critério de era;
  - Hegemonia Territorial.
- *Nível* 1–7 é só rótulo derivado da população (`cityLevelForPopulation`); nenhuma regra o lê.

A Bíblia tem só Nível 1–7, subido com recursos + avanço da Teia.

**Opção A:** Nível 1–7 único (absorve tudo que Desenvolvimento faz; sobe com custo e, depois, Teia).
**Opção B:** Desenvolvimento único (1–5); remover o rótulo Nível.
**Opção C:** manter os dois e explicar (Nível = porte populacional, Desenvolvimento = infraestrutura).

**Recomendação:** A, com migração conceitual (spec §7.4). B é mais barata, mas perde os 7 nomes que Canvas e Bíblia usam. C mantém a confusão.

**Consequências:** a UX V2 desenha uma escada só. A migração de saves precisa de um mapeamento Desenvolvimento→Nível, e os custos e tetos precisam de reequilíbrio (playtest).

**Status: APROVADA.** Uma progressão de cidade: **Nível 1–7**. O Desenvolvimento 1–5 deixa de ser conceito público/canônico; suas responsabilidades serão absorvidas pelo Nível no futuro. O Nível **não depende só de população**: compõe-se de população + infraestrutura/requisitos + investimento. Não implementar ainda. A fórmula da composição fica pendente de especificação de regras (não é decisão nova; é detalhamento da V4, com playtest).

---

## DEC-003 — Arquitetura da duração da partida

**Problema:** Alpha tem 9/15/20 rodadas, número nascido na implementação (`14253aa`, 2026-09-20); a Bíblia não o menciona. A Bíblia pede 24/36/48 (4/6/8 rodadas por era). Com 9 rodadas, ninguém chega à Era VI e a vitória é sempre por Prestígio. Melhor caso observado: era 3 na rodada 6.

**Opção A:** adotar 24/36/48 da Bíblia.
**Opção B:** manter 9/15/20 e declarar que Rápida termina por Prestígio.
**Opção C:** três modos com papéis distintos — Rápida (Prestígio), Padrão (ciclo completo, Hegemonia possível), Épica (progressão máxima) — com números fixados só depois de simulação e playtest.

**Recomendação:** C. Medir antes de fixar: rodada média por era, rodada do 1º contato, 1ª guerra, % de partidas com Hegemonia declarada e tempo real por rodada em 2/4/6p.

**Consequências:** a UI precisa comunicar o modo de vitória de cada duração. Os critérios de era e as metas de Hegemonia dependem desta decisão.

---

## DEC-004 — Fases interativas **[bloqueia UX V2]**

**Problema:** o Canvas mostra as 8 fases com botão "Concluir fase" em cada uma. O Alpha só espera jogadores em Planejamento e Conflitos; as outras 6 resolvem sozinhas (`INTERACTIVE_PHASES`). Os `LEGAL_COMMANDS` de Ações urbanas e Diplomacia nunca são alcançáveis.

**Opção A:** manter 2 fases interativas (planejar tudo → ver resolução → reagir).
**Opção B:** tornar interativas as 8 fases do Canvas.
**Opção C:** 2 interativas + "pausas de leitura" opcionais (replay por etapa).

**Recomendação:** A (+ replay por etapa da C). Menos espera multiplayer e já testado em 2–6p.

**Consequências:** a UX V2 desenha um ciclo **Planejar → Resolução → (Conflitos) → Resultado**, não 8 telas de fase. Remover os comandos inalcançáveis.

**Status: APROVADA.** Manter as 8 fases. Planejamento e Conflitos são as principais fases interativas; as demais podem ser resolução automática com apresentação clara das consequências. Princípio UX canônico: **"uma fase do motor não precisa corresponder a uma tela ou clique"**.

---

## DEC-005 — Eras: quantas e o que é "Hegemonia" **[bloqueia UX V2]**

**Problema:**
- Bíblia: 6 eras, com a VI chamada Hegemonia.
- Canvas: "5 eras" na capa e linha do tempo I–V.
- Alpha: 6 eras (`AlphaEraSchema`), e a VI só libera `DECLARE_HEGEMONY`.

"Hegemonia" é ao mesmo tempo era, caminho e vitória.

**Opção A:** 6 eras; a Era VI chama-se Hegemonia (como hoje).
**Opção B:** 5 eras; Hegemonia deixa de ser era e vira declaração liberada ao fim da Era V.
**Opção C:** 6 eras com a VI renomeada (ex.: "Supremacia") para separar o termo.

**Recomendação:** B se DEC-003 mantiver partidas curtas; A se adotar durações longas. Em qualquer caso, "Hegemonia" na UI = vitória/caminho, nunca nome de fase.

**Consequências:** muda a linha do tempo, os critérios de era (`ALPHA_ERA_MILESTONES`) e o texto do guia.

**Status: APROVADA COM ALTERAÇÃO.** A recomendação de 5 eras não foi adotada.
- **6 eras** de progressão civilizacional.
- **"Hegemonia" não é era**: é uma condição/estado de vitória.
- A sexta era representa o estágio final de ascensão, imediatamente anterior à disputa plena por Hegemonia.
- Nome provisório da Era VI: **Ascensão**. Nas fontes, Ascensão é a Era V; a Bíblia a descreve como a "ponte" que antecede a disputa final, que é o papel aprovado para a VI.
- Nomes definidos na **DEC-023** (aprovada): V Potências, VI Ascensão.

---

## DEC-006 — Metas de Hegemonia fixas ou escaladas

**Problema:** o Alpha usa metas fixas (ex.: Força 12, Riqueza 30, Influência 25); só a Territorial muda por duração. A Bíblia escala pela mesa (jogadores, tamanho do mapa, arquétipo). Hoje a declaração é permanente e não exige cumprir nada, e Pacto de não agressão não impede guerra.

**Opção A:** manter fixas.
**Opção B:** escalar por nº de jogadores e duração (não por mapa enquanto o mapa for fixo).
**Opção C:** escala completa da Bíblia.

**Recomendação:** B, com tabela validada por simulação.

**Consequências:** a UI de Hegemonia mostra metas "desta mesa".

**Status: APROVADA (declaração e contabilização).**
- Os requisitos de um Caminho de Hegemonia podem ser construídos e contabilizados ao longo de toda a partida.
- **Declarar Hegemonia só é permitido na Era VI — Ascensão.**
- A progressão não é comprimida para que uma partida Rápida alcance a Hegemonia: uma partida curta pode legitimamente terminar por Prestígio.
- **Continua aberto:** se as metas são fixas ou escaladas (opções A/B/C acima).

---

## DEC-007 — Comida e crescimento

**Problema:** o Alpha consome 1 Alimento por habitante. A Bíblia diz ~1 por 2. Uma cidade inicial produz 2 e come 2 → não cresce sem microgestão. Só Produzir conta para crescer; o excedente é dividido por igual entre as cidades (nível civilização).

**Opção A:** 1 por habitante e reequilibrar a produção.
**Opção B:** 1 por 2 habitantes (Bíblia).
**Opção C:** manter e ensinar (UI já avisa).

**Recomendação:** decidir só com métricas (spec §8.5): rodada da 1ª cidade com pop 3, % de cidades estagnadas, população total por rodada.

**Consequências:** afeta critérios de era, desempate final e Hegemonia Territorial.

---

## DEC-008 — Armazenamento por cidade ou civilizacional

**Problema:** Alpha = base × nº de cidades + edifícios + líder. Bíblia = 8–12 + soma dos níveis + edifícios. Armazém/Tesouro/Banco existem no código mas não são construíveis.

**Opção A:** manter por cidade.
**Opção B:** fórmula da Bíblia (escala com o nível; depende de DEC-002).
**Opção C:** civilizacional sem nível (base + por cidade).

**Recomendação:** B após DEC-002; até lá A.

**Consequências:** a UI mostra o teto global; a "decisão de armazenar ou monetizar" só existe com Mercado/Banco (DEC-016).

---

## DEC-009 — Suprimento e logística

**Problema:** Alpha = raio fixo 3 (+1 líder) ou ligação por território, penalidade −2 fixa por lado e nenhum outro efeito. A estrada quase não acrescenta (só se constrói em território próprio, que já conta). Bíblia = raio 1+⌈Nível/2⌉, estradas/postos +1, sem suprimento anula Comando e dobra manutenção.

**Opção A:** manter.
**Opção B:** raio por Nível + estrada fora do território + efeito proporcional.
**Opção C:** Bíblia completa.

**Recomendação:** B (pós-Alpha externo); a UI V2 precisa de camada de suprimento.

**Consequências:** a guerra longe de casa passa a custar; a estrada ganha função.

---

## DEC-010 — Mapa: terminologia espacial e tamanho **[bloqueia UX V2]**

**Problema:** na **Bíblia, "região" é uma célula do tabuleiro**. As unidades movem-se e recuam "uma região". A exploração revela "anéis de região" (raio 1 = 7 células; Cartografia raio 2 = 19; Navegação Oceânica raio 3 = 37). O mapa tem 37/61/91/127 regiões (raio 3/4/5/6) e a caixa traz 127 peças de região. **No Alpha, "região" é um bloco de 7 hexes** (30 regiões = 210 hexes) e a célula chama-se "hex". Na unidade da Bíblia, o mapa do Alpha tem 210 células, mais que o tamanho Épico da Bíblia (127). Os números da Bíblia e do Alpha não são comparáveis sem fixar o termo.

**Opção A:** "hex" = célula; "região" = bloco de 7 hexes (como no Alpha); tamanhos medidos em hexes.
**Opção B:** adotar o termo da Bíblia ("região" = célula) e renomear o bloco de 7 (ex.: "província").
**Opção C:** abolir o bloco e explorar por raio de células, como na Bíblia.

**Recomendação:** A. O código e a UI já usam "hex"; o bloco de 7 é a unidade de exploração e rotação. Manter o mapa fixo no Alpha e definir os tamanhos futuros em hexes (o atual é 210) por número de jogadores.

**Consequências:** a UI V2 precisa de minimapa já com 210 hexes. Mapas maiores pioram o contato (DEC-020).

**Status: APROVADA.** Terminologia espacial canônica:
- **Hexágono / hex** = célula individual do tabuleiro.
- **Região** = agrupamento estrutural de 7 hexágonos usado pelo mapa Alpha.
- **Território** = conjunto de hexágonos sob controle/reivindicação de uma civilização ou cidade, conforme as regras.

Tamanhos de mapa futuros continuam em aberto e serão medidos em hexes.

---

## DEC-011 — Civilizações e líderes

**Problema:** Alpha tem 12 civs com 2 recursos de ênfase, habilidade a cada rodada e líder (passiva + habilidade 1×/era). A Bíblia tem 18 civs com kit inicial, traço, habilidade 1×/era, componente, limitação e unidade exclusiva — e sem líderes.

**Opção A:** 12 civs + líderes; outras 6 são conteúdo futuro.
**Opção B:** 18 civs agora.
**Opção C:** 12 civs reescritas no formato da Bíblia (kit/limitação), sem líderes.

**Recomendação:** A no Alpha; para o Beta, avaliar dar a cada civ uma identidade qualitativa (C parcial) mantendo líderes.

**Consequências:** a seleção de civilização na UX V2 mostra ênfase + líder; a habilidade "1×/rodada" deveria virar 1×/era (decidir).

---

## DEC-012 — Função da Teia Civilizacional

**Problema:** 50 avanços genéricos (+1 de produção, Força, Comando). Só 4 avanços mudam regras (limites de pilha). Nenhum libera edifício, unidade, governo ou navegação. A Bíblia: 40 avanços em cadeias nomeadas que liberam edifícios, unidades, níveis de cidade e raio de exploração.

**Opção A:** manter bônus numéricos.
**Opção B:** Teia qualitativa (cada avanço muda o que a civilização pode fazer), 40 nós da Bíblia.
**Opção C:** híbrida: nós da Bíblia, mas só os desbloqueios cujos sistemas existem.

**Recomendação:** C para o Beta; no Alpha externo manter A e corrigir os efeitos mortos (DEC-018).

**Consequências:** a Teia em grafo (UX V2) depende do formato escolhido; edifícios (DEC-013) dependem daqui.

---

## DEC-013 — Catálogo de edifícios e distritos

**Problema:** 7 edifícios construíveis. 29 no esquema Alpha: 22 sem uso, e Armazém/Tesouro/Banco só com efeito teórico. O distrito Marítimo é inalcançável. Os edifícios não ocupam vaga.

**Opção A:** manter 7 e apagar órfãos.
**Opção B:** catálogo da Bíblia (≈30 em cadeias, vagas por Nível).
**Opção C:** catálogo intermediário ligado à Teia (C de DEC-012).

**Recomendação:** no Alpha, não expor nada novo e marcar os órfãos para remoção ou consolidação. No Beta, C.

**Consequências:** a gaveta da cidade na UX V2 precisa saber se há "vagas de edifício".

---

## DEC-014 — Escopo militar e naval

**Problema:** 9 classes fixas, sem escalas nem modernização. Uma "Frota" única, sem transporte. Todas as capitais iniciais ficam em Planície, então nenhuma capital recruta Frota. Combate em 1 choque (Bíblia: até 3).

**Opção A:** militar e naval completos da Bíblia antes do Beta.
**Opção B:** Alpha sem naval visível (esconder Frota) e escalas militares no Beta.
**Opção C:** naval mínimo (transporte + bloqueio) no Beta e o resto como expansão.

**Recomendação:** B + C.

**Consequências:** a UX V2 não desenha telas navais agora.

---

## DEC-015 — Diplomacia: quais medidores

**Problema:** a Bíblia tem Confiança 0–5, Tensão 0–5 e Reputação (5 níveis), custo de Influência nos tratados, garantias e Mercado/Banco. O Alpha tem 6 tratados sem custo, 4 tipos de oferta comercial e calote −2 Prestígio. Pacto de não agressão não impede guerra; Embargo precisa do aceite do alvo.

**Opção A:** só Reputação (memória de calotes/quebras), que substitui Confiança.
**Opção B:** Confiança + Tensão + Reputação.
**Opção C:** nenhum medidor novo; custo em Prestígio já pune.

**Recomendação:** A (pós-Alpha). Resolver antes: Embargo unilateral? PNA impede declarar guerra?

**Consequências:** cada medidor novo precisa de uso estratégico próprio.

---

## DEC-016 — Modelo de Cultura

**Problema:** Influência (recurso), Presença cultural (contato/enraizada/predominante), Coesão local (sem efeito), Legado (Bíblia, ausente), Prestígio (pontos). A disputa exige duas civs estrangeiras na mesma cidade → impossível em 2p. Duas habilidades de líder agem sobre Coesão e não fazem nada.

**Opção A:** Influência = recurso; Presença = posição; Legado = trilha permanente; Prestígio = placar; Coesão removida ou ligada a Resistência.
**Opção B:** sem Legado; Presença alimenta Prestígio.
**Opção C:** manter.

**Recomendação:** A no Beta. No Alpha: Coesão com efeito ou fora da UI, e decidir se o dono da cidade pode disputar presença (habilita 2p).

**Consequências:** a camada cultural do mapa (UX V2) mostra Presença, não Influência.

---

## DEC-017 — Eventos: Pulso e Evento mundial

**Problema:** dois sistemas. O Pulso (todo início de rodada, automático, ±1–2 recurso para todos) e o Evento mundial (a cada 2 rodadas, escolha recurso ou +1 Prestígio). Na Bíblia o Pulso tem 60 cartas condicionais com severidade.

**Opção A:** fundir em um Pulso com escolha.
**Opção B:** Pulso = clima do mundo; Evento = decisão.
**Opção C:** Pulso condicional da Bíblia.

**Recomendação:** B no Alpha (nomes distintos na UI); C no Beta.

**Consequências:** a UX V2 tem um lugar só para "o que aconteceu no mundo".

---

## DEC-018 — Ações por rodada e efeitos de Comando mortos

**Problema:** as ações por rodada são fixas (5–10, padrão 7). Os efeitos "+Comando" não fazem nada em partidas novas: 5 avanços de Sociedade, 5 cartas de estratégia, 2 conselheiros, 2 líderes e a penalidade da Confederação.

**Opção A:** ações fixas; trocar todos os efeitos de Comando por outros.
**Opção B:** limite = configurado + bônus de Comando.
**Opção C:** remover esses conteúdos.

**Recomendação:** B ou A, antes do Alpha externo (hoje há cartas que não fazem nada).

**Consequências:** um contador de ações honesto na UI.

---

## DEC-019 — Rotas comerciais: renda passiva ou ação

**Problema:** a rota não rende sozinha; só "Sustentar comércio" (ação da cidade, +2 Riqueza por rota) rende, o que custa o Produzir daquela cidade. A Bíblia e o Canvas dizem "+2 Riqueza por rodada".

**Opção A:** renda passiva por rota na manutenção.
**Opção B:** manter como ação.
**Opção C:** passiva pequena + ação amplifica.

**Recomendação:** C. **Consequências:** a camada de rotas no mapa mostra renda.

---

## DEC-020 — Contato em mesas grandes

**Problema:** simulação (12 sementes, QUICK, exploração dirigida): 2p 24/24, 4p 48/48, 6p 59/72 civilizações com contato; o pior caso em 6p é a rodada 7. Sem contato, diplomacia e guerra não acontecem.

**Opção A:** ajustar as casas de 6p.
**Opção B:** visão/exploração maior (raio por Teia, DEC-012).
**Opção C:** aceitar e medir com humanos.

**Recomendação:** C agora (instrumentar), A se humanos confirmarem.

---

## DEC-021 — Governos

**Problema:** o Alpha tem 5 governos; a adoção é gratuita, a qualquer momento, e nunca muda. Muitos efeitos `future*` não fazem nada. A Bíblia tem 7 (+Meritocracia, Autocracia), adoção na Era III, reforma com custo e Repressão. `GovernmentCatalogSchema` já lista os 7.

**Opção A:** 5, como hoje, mas remover os efeitos fantasmas da UI.
**Opção B:** 7 da Bíblia com adoção na Era III e reforma.
**Opção C:** 5 + reforma.

**Recomendação:** A no Alpha; B no Beta.

---

## DEC-022 — Ânimo, Estabilidade e Coesão

**Problema:** Ânimo 0–6 só sobe (nada o reduz; Exultante é inalcançável). Estabilidade vai de 0 a 100 (Bíblia 0–6). A Coesão não tem efeito.

**Opção A:** manter três medidores com causas de queda claras.
**Opção B:** fundir Estabilidade e Coesão.
**Opção C:** Bíblia (Ânimo 0–6 + Estabilidade 0–6, Coesão derivada).

**Recomendação:** B ou C no Beta. No Alpha, a UI deve dizer o que cada medidor faz hoje.

---

## DEC-023 — Nomes da Era V e da Era VI (decorre da DEC-005)

**Problema:** as fontes têm 6 nomes, e um deles é Hegemonia: Fundação, Expansão, Civilização, Impérios, Ascensão, Hegemonia (Bíblia e Alpha; o Canvas para em Ascensão). A DEC-005 tirou Hegemonia da lista de eras e manteve 6 eras, então falta um nome. O papel aprovado para a Era VI ("estágio final imediatamente anterior à disputa plena por Hegemonia") coincide com a descrição da Bíblia para Ascensão, hoje Era V.

**Opção A:** Ascensão passa a ser a Era VI; a Era V recebe um nome novo (a definir pelo PO).
**Opção B:** Ascensão continua Era V; a Era VI recebe um nome novo.
**Opção C:** Ascensão continua V e a VI fica sem nome próprio ("Era VI") até haver conteúdo para ela.

**Recomendação:** A, que segue a instrução da aprovação e o texto da Bíblia.

**Consequências:** o código usa os IDs `ASCENSION` (V) e `HEGEMONY` (VI) em `AlphaEraSchema`. A renomeação será uma migração aditiva futura. Os critérios de era e o conteúdo da Teia por era (hoje 10 avanços em Fundação–Ascensão, 0 em Hegemonia) precisam ser redistribuídos.

**Status: APROVADA.** Eras canônicas: I Fundação, II Expansão, III Civilização, IV Impérios, **V Potências**, **VI Ascensão**. "Hegemonia" não é era. A Teia não é redistribuída agora (trabalho posterior).

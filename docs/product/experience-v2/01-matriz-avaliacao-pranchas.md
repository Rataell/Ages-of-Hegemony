# Experience V2 — Matriz de avaliação das pranchas 01–20

Data: 2026-10-03. Insumo: `AoH-Proposta-UI-UX.pdf` (aprovado como referência histórica/visual, **não normativa**).

**Hierarquia de autoridade**
1. Canonical Product Specification V4 + decisões aprovadas (DEC-001, 002, 004, 005, 006 [declaração], 010, 023).
2. Página 22 do PDF ("O que mudou desde o canvas").
3. Pranchas 01–20 (proposta anterior de UX/UI).
4. Canvas e Bíblia anteriores (referência histórica).

**Teses fortes preservadas, salvo evidência contrária**
- "Ages of Hegemony deve parecer uma mesa de estratégia, não um site."
- "O mapa é o protagonista."

**Classes:** KEEP (continua correto) · EVOLVE (ideia certa, precisa evoluir) · RETHINK (arquitetura deve ser reconsiderada) · DROP (não sobrevive à V2).

**Hipóteses que NÃO são preservadas por padrão:** Conselho permanente, Inspetor permanente, navegação por abas, cidade inteira no painel lateral, Teia em grade, responsividade em pilha.

---

## Resumo

| Classe | Itens |
|---|---|
| KEEP | 02·P2, 02·P4, 02·P7, 03a, 04, 06, 09, 17, regra "nunca um botão que falha" (20) |
| EVOLVE | 01, 02·P1, 02·P3, 02·P5, 02·P6, 02·P8, 05, 07, 12, 13, 14, 15, 16, 18, 20 |
| RETHINK | 03b, 08, 10, 11, 19 |
| DROP | "Concluir fase" em fases automáticas; abas como navegação primária; Conselho e Inspetor fixos; "Anatomia da tela" no produto; Coesão com função inventada (15); números e sistemas conceituais apresentados como regra (5, 10, 12, 14, 15) |

O que a avaliação mostra: as pranchas acertam o **tom** (mesa, materialidade, névoa, mapa) e erram a **arquitetura de presença** — quase tudo fica aberto o tempo todo em três colunas fixas, e o mapa, chamado de protagonista, recebe só ~60% da tela. A V2 inverte: o mapa é a tela inteira; o resto aparece quando é chamado e some quando a decisão termina.

---

## Matriz

| Prancha | Classe | Motivo | Solução V2 |
|---|---|---|---|
| **01 · Visão do produto** | EVOLVE | A tese ("tabuleiro que acontece na tela") e os seis verbos estão certos. Os números estão desatualizados: mostra **5 eras** (V4: 6, DEC-005/023). "O Conselho e o Inspector dão contexto" amarra a visão a uma arquitetura de colunas que é só hipótese. | Manter a tese e os seis verbos. Corrigir números (6 eras; Hegemonia como vitória). Reescrever o alvo como "o mapa é a mesa; o contexto aparece onde você olha e some quando a decisão termina". |
| **02 · P1 — O mapa é o protagonista** | EVOLVE | Tese forte, mantida. Mas "~60% da tela" com duas colunas fixas é um teto, não um protagonismo: em 1366×768 o mapa fica com ~860 px de largura. | O mapa ocupa **100% da área de jogo** como camada de fundo; a UI flutua nas bordas. Meta: em Planejamento, ≥ 80% do mapa visível sem nada aberto; nenhum painel empurra o mapa, só o cobre parcialmente e de forma recolhível. |
| **02 · P2 — Sem rolagem global** | KEEP | Correto e confirmado pelo Alpha (página longa foi a principal queixa). | Mantido. Regra de aceite: nenhuma decisão de rodada exige rolar a página. |
| **02 · P3 — A ação está sempre à mão** | EVOLVE | Certo, mas a "barra de ação" da prancha é só mensagem + botão de fase. Não mostra o **orçamento** (ações principais, vaga de cada cidade), que a V4 §22.1 pede na camada DECISION. | Barra inferior vira a **Bandeja de Ordens**: orçamento visível (ex.: 5/7 ações, vagas de cidade), ordens reservadas como fichas canceláveis, checagem antes de confirmar e o botão do momento. |
| **02 · P4 — Contexto sob demanda** | KEEP | Correto, e contradiz a própria prancha 08 (Inspetor sempre aberto). | Mantido como regra dura: contexto nasce de uma seleção e morre com ela. Sem seleção, não há painel de contexto. |
| **02 · P5 — Informação em camadas** | EVOLVE | Relance → resumo → detalhe está certo. Falta ligar às seis camadas da V4 (GLOBAL, WORLD, CONTEXT, DECISION, CONSEQUENCE, KNOWLEDGE); a prancha não tem lugar para CONSEQUENCE. | Cada camada da V4 ganha uma superfície própria (ver arquitetura). Relance/resumo/detalhe vira a regra interna de cada superfície. |
| **02 · P6 — Materialidade** | EVOLVE | Bronze, pedra e pergaminho dão identidade. Risco: textura demais compete com o mapa, e a prancha usa texto de 10–11 px, ilegível. | Materialidade nas **molduras e peças**, não no texto. Pergaminho só para CONSEQUENCE (crônica, eventos, relatório). Texto mínimo 12 px; corpo 14 px. |
| **02 · P7 — A névoa é parte do jogo** | KEEP | Três estados (desconhecido, conhecido, visível) sem vazamento: correto e exigido pela projeção do servidor. | Mantido. Acrescenta: a névoa também vale para dados (prévia de defesa só do que é visível; postura adversária "desconhecida"). |
| **02 · P8 — Desktop primeiro** | EVOLVE | Prioridade certa. A solução para celular ("pilha vertical") é uma página empilhada, exatamente o que a tese condena. | Desktop primeiro; celular **mapa primeiro** com folhas deslizantes (ver 19). |
| **03a · Jornada do jogador (7 etapas)** | KEEP | Chegar → preparar → escolher → primeiro conselho → rodadas → eras → Hegemonia é uma boa espinha da experiência. | Mantida; "Eras" passa a ter 6 etapas e "Hegemonia" é desfecho (DEC-005). |
| **03b · Laço da rodada em 8 fases, cada uma com "Concluir fase"** | RETHINK | Contradiz a DEC-004 (aprovada): só Planejamento e Conflitos são interativas, e "uma fase do motor não precisa corresponder a uma tela ou clique". Oito confirmações por rodada multiplicam a espera em 2–6 jogadores. | O jogador vive **três momentos**: **Planejar → Resultado → Conflitos** (este só quando há ataque ou reação). As 8 fases do motor aparecem dentro do Resultado como etapas de um replay, não como telas. |
| **04 · Tela inicial** | KEEP | Duas portas claras (preparar mesa / tenho convite), mesas recentes sem conta, aviso de ambiente de teste. | Mantida. Ajustes de texto apenas. |
| **05 · Criação da partida** | EVOLVE | Estrutura boa (resumo lateral, escolhas grandes). Mistura regras inexistentes com reais: tamanhos de mapa 37/61/91 (classe D), "habitantes iniciais" (não existe). Omite o que existe: **ações por rodada (5–10)** e o fato de partida Rápida poder terminar por Prestígio (DEC-006). | Só opções reais; o que não existe sai da tela (não "em breve"). Acrescentar ações por rodada e uma frase de expectativa por duração ("Rápida: vitória por Prestígio é o desfecho comum"). |
| **06 · Lobby** | KEEP | Código + link, assentos com estado, regras da mesa visíveis, "sair só esquece neste navegador": tudo correto e já validado no Alpha. | Mantido. Remover "habitantes iniciais" das regras da mesa. |
| **07 · Seleção de civilização** | EVOLVE | Grade de 12 tabuleiros boa. Dados errados: vieses não batem com o Alpha (ex.: Valgard "Pedra"; no Alpha, Madeira e Pedra + Alimento), Elyra "a definir", líder genérico. | Ficha da civilização com dados reais: ênfase (os dois recursos), habilidade da civilização, líder com passiva e habilidade 1×/era. Formato do líder segue DEC-011 (aberta). |
| **08 · Shell principal da partida** | RETHINK | É a prancha central e a que mais conflita com as teses: Conselho fixo (250 px) + Inspetor fixo (340 px) + 9 abas + top bar + barra = mapa espremido. Mostra "Comandos 2/4" (vocabulário em disputa, DEC-018) e "Anatomia da tela" (ferramenta de design no produto). | **Mesa**: mapa em tela cheia; **Faixa de Estado** no topo (rodada, momento, quem falta, recursos de relance, alertas); **Bandeja de Ordens** embaixo; **Cartão de Seleção** ancorado ao objeto; **Trilho de Peças** recolhido à esquerda (ícones de cidades, pilhas, alertas) que abre por cima do mapa; **Tabuleiros** (Teia, Diplomacia, Cartas, Eras, Crônicas) como sobreposições chamadas por atalho, não abas. |
| **09 · Mapa do mundo** | KEEP | A prancha mais sólida: três estados de névoa, camadas ligáveis, minimapa, menu contextual na seleção, caminho numerado com custo, enquadramento inicial ajustado ao conhecido, zoom limitado. | Mantida como base do WORLD. Acrescentar: contorno de região (DEC-010), setas de ataque e rotas desenhadas (V4 §22.2), camada cultural, ordens reservadas desenhadas com o estado "planejado" distinto do "resolvido". |
| **10 · Cidade e gestão urbana** | RETHINK | A gaveta sobre o atlas é melhor que a página, mas ainda tira o jogador do mapa e põe a cidade inteira (distritos, habitantes, produção, armazém, fortificação, especializações) numa folha. Mostra regras inexistentes como reais: nomes dos níveis, "Desenvolver cidade" exigindo Administração, especializações; Soldados como papel útil. | **Lente da cidade**: o mapa aproxima o território da cidade; hexes trabalhados, distritos e fortificação ficam **no próprio mapa**; um cartão compacto mostra Nível 1–7 (DEC-002), habitantes e a **ação urbana da rodada** com prévia. Detalhe (economia, armazém) só sob demanda. Nada de nome de nível ou regra de subida até a especificação do Nível. |
| **11 · Pesquisa · Teia Civilizacional** | RETHINK | Grade 5 domínios × **5 eras** (V4: 6); "V · Ascensão" na coluna errada (DEC-023). A grade lê como tabela, não como rede; esconde a pergunta do jogador ("o que isto destrava?"). O formato da Teia ainda é decisão aberta (DEC-012). | **Teia como rede**: anéis por era (I–VI) do centro para fora, domínios como setores; foco em **caminhos** (o que destrava, o que exclui). Desenho tolerante ao formato final (aceita mais ou menos nós). |
| **12 · Diplomacia e comércio** | EVOLVE | A "mesa diplomática" com propostas e tratados ativos é boa. Textos e regras errados: "Pacto de não agressão impede ataques mútuos" (no Alpha não impede; DEC-015 aberta); "custo de Influência" inexistente; **ofertas de troca "em breve"**, mas elas existem no Alpha (4 tipos). | **Relação a partir do mapa**: clicar numa fronteira ou capital abre o cartão da relação (V4 §22.1). O tabuleiro de Diplomacia vira uma **mesa com os assentos** das civilizações; propostas chegam como pergaminhos na Faixa de Estado. Textos dos tratados = regra atual, com a regra aberta marcada. |
| **13 · Guerra e combate** | EVOLVE | Relatório de batalha com origem de cada número, posturas em ciclo, faces do dado e regra de avanço/retirada: tudo certo e coerente com o Alpha. Limites "Command I: 7" e "naval: 5" são conceituais. | Ordem de ataque desenhada no mapa com prévia no Cartão de Seleção. Em Conflitos, a **Folha de Batalha** ocupa o centro (dados rolando, detalhamento) e volta ao mapa com o resultado. Só limites reais. |
| **14 · Cartas, eventos e Grandes Projetos** | EVOLVE | Mão como leque e ambições privadas: bom. Confunde **Pulso** (automático) com **Evento mundial** (escolha) — DEC-017 recomenda nomes distintos. Grande Projeto "em 5 etapas com concorrência" é classe C (no Alpha, uma ação). | **Mão em leque** recolhida na borda inferior, abre no Planejamento. Evento mundial (escolha) chega como pergaminho no Planejar; o Pulso (automático, "clima do mundo") é um aviso na Faixa de Estado ao abrir a rodada e entra no Resumo da rodada. Grandes Projetos com a regra atual (uma construção). |
| **15 · Cultura e influência** | EVOLVE | Camada de influência no mapa com alcance: certa. Inventa função para a **Coesão** ("resiste a influências") — proibido inventar (DEC-016/022 abertas). Diz que a disputa cultural "não existe", mas existe (só não ocorre em 2 jogadores). "Espaços" e "dados culturais" são conceituais. | Camada cultural do mapa (presença por cidade: contato, enraizada, predominante). Disputa como ação do Cartão de Seleção quando legal. Coesão fora da UI até decisão. |
| **16 · Eras e Hegemonia** | EVOLVE | Rastreador de caminhos com metas e progresso, e "caminho mais próximo" com ação sugerida: excelente. Linha com **5 eras**; não diz que a **declaração só ocorre na Era VI** (DEC-006). | Linha de **6 eras**; rastreador mantido; declarar aparece só na Era VI; antes disso mostra "contando requisitos". Ranking de Prestígio conforme a visibilidade real. |
| **17 · Compêndio e onboarding** | KEEP | Guia sobre a própria tela, curto, dispensável; verbetes com "Onde vejo isso no jogo?". | Mantido. Ensina os três momentos (Planejar, Resultado, Conflitos) em vez de oito fases. |
| **18 · Design system "Bronze e Pedra"** | EVOLVE | Paleta, tipografia e regra "cor nunca é o único sinal" estão certas. Escala tipográfica pequena demais (10–13 px); só 4 cores de civilização para 6 assentos; lilás "em breve" vira um sistema visual para algo que não deveria aparecer. | Escala maior (12/14/16/20/28). Seis cores de civilização com padrão/brasão para daltonismo. Remover o estado "em breve" do vocabulário: o que não existe não aparece. |
| **19 · Responsividade** | RETHINK | Desktop em 3 colunas com larguras fixas e celular como **pilha vertical** com barra de abas de site. Isso reintroduz a página. | **Mesma arquitetura em todos os tamanhos**: mapa cheio + Faixa + Bandeja + Cartão. Desktop: cartões ancorados. Tablet: igual, com alvos de toque. Celular: Cartão vira folha inferior, Tabuleiros viram tela cheia, Bandeja compacta. |
| **20 · Síntese da experiência** | EVOLVE | A frase-tese é mantida. "Conselho à esquerda, Inspector à direita" é a hipótese que a V2 reconsidera. A regra "sistema incompleto: oculto ou marcado, nunca um erro" está certa (KEEP). | Síntese V2: "um mapa que é a mesa; o contexto aparece onde você olha; a rodada tem três momentos". Roteiro reordenado: mesa e bandeja → seleção e ordens no mapa → Resultado → lente da cidade → tabuleiros. |

---

## Itens transversais a eliminar (DROP)

| Item | Onde aparece | Motivo |
|---|---|---|
| "Concluir fase" nas fases automáticas | 03, 10–16 | DEC-004 |
| Abas como navegação primária | 08 e todas as telas de sistema | Transformam sistemas em páginas; trocam o mapa por listas |
| Conselho e Inspetor sempre abertos | 08, 10–16, 19 | Contradizem P1 e P4 |
| "Anatomia da tela" | 08 | Ferramenta de apresentação do canvas |
| Função inventada para Coesão | 15 | DEC-016/022 abertas |
| Regras conceituais exibidas como reais (nomes de nível, 5 etapas de projeto, custo de Influência em tratados, limites de pilha por doutrina) | 10, 12, 13, 14 | DEC-001: a V4 manda; a UI não pode prometer regra inexistente |
| Estado visual "Em breve" | 12, 15, 18, 20 | Substituído por "não aparece" |

# Experience V2 — Arquitetura de experiência e interface

Data: 2026-10-03. Status: **proposta**, não implementada.
Base: [matriz das pranchas](01-matriz-avaliacao-pranchas.md), Canonical Spec V4 (§1–4, §22) e decisões aprovadas.

## 1. Teses

1. **Ages of Hegemony parece uma mesa de estratégia, não um site.**
2. **O mapa é o protagonista.** Não é "a maior coluna": é a mesa inteira. Toda outra superfície flutua sobre ele, é recolhível e nunca o empurra.
3. **O contexto aparece onde você olha.** Seleção cria contexto; fim da decisão o remove.
4. **A rodada tem três momentos para o jogador:** Planejar → Resultado → Conflitos (DEC-004). As 8 fases do motor continuam, mas não viram telas nem cliques.
5. **A UI não promete regra que não existe** (DEC-001). Sistema sem regra não aparece; não há estado "em breve".

Regra de aceite herdada: *se uma decisão exige rolar a página, o layout está errado.*
Regra nova: *se o mapa está coberto por mais de 40% numa decisão que acontece no mapa, o layout está errado.*

## 2. Os três momentos da rodada

| Momento | Fases do motor | O jogador | Tela |
|---|---|---|---|
| **Planejar** | 1 Pulso (já resolvido ao abrir), 2 Planejamento | Lê o mapa, seleciona, reserva ordens e ações urbanas, joga cartas, responde ao evento mundial e propostas | Mesa + Cartão de Seleção + Bandeja de Ordens |
| **Resultado** | 3 Ações urbanas, 4 Ordens e movimento, 5 Diplomacia e comércio, 7 Integração e manutenção, 8 Fim da rodada | Assiste ao replay do que pôde observar, etapa por etapa, sobre o mapa; lê a crônica e o livro-razão | Mesa em modo replay + Linha da Crônica |
| **Conflitos** (só quando há) | 6 Conflitos | Atacante e defensor com reação decidem; todos veem o resultado visível para si | Folha de Batalha sobre a Mesa |

Ordem real do motor: o Resultado é mostrado em duas partes quando há Conflitos (etapas 3–5, depois Conflitos, depois 7–8). Para quem não está em batalha, o Conflito é só uma etapa a mais do replay.

Espera: enquanto outros planejam, a Faixa de Estado mostra quem falta; o jogador pode **voltar a planejar** até todos confirmarem (já existe no Alpha).

## 3. Superfícies

Cada camada da V4 §22.1 tem uma superfície dona. Nenhuma superfície serve a duas camadas por padrão.

| Superfície | Camada V4 | Onde | Quando existe |
|---|---|---|---|
| **Mesa** (mapa) | WORLD | tela inteira, atrás de tudo | sempre |
| **Faixa de Estado** | GLOBAL | topo, altura ~56 px | sempre |
| **Cartão de Seleção** | CONTEXT (+ prévia de DECISION) | ancorado ao objeto selecionado; desloca-se para não cobri-lo | enquanto houver seleção |
| **Bandeja de Ordens** | DECISION | base, altura ~72 px recolhida | sempre em Planejar; resumida nos outros momentos |
| **Trilho** | atalho para WORLD | borda esquerda, 56 px de ícones | sempre; abre por cima do mapa ao passar/clicar |
| **Lente da Cidade** | CONTEXT (cidade) | o próprio mapa aproximado + Cartão da Cidade | ao abrir uma cidade |
| **Linha da Crônica** | CONSEQUENCE | base, substitui a Bandeja no Resultado | no Resultado; reabrível |
| **Folha de Batalha** | CONSEQUENCE + DECISION (reação) | centro, sobre o mapa escurecido | em Conflitos e ao rever uma batalha |
| **Tabuleiros** | KNOWLEDGE | sobreposição grande; o mapa continua visível e escurecido nas bordas | sob demanda, um por vez |
| **Mão de cartas** | DECISION | leque recolhido acima da Bandeja | em Planejar |

### 3.1 Faixa de Estado (GLOBAL)

Da esquerda para a direita:
- civilização, era (I–VI) e governo;
- **7 recursos de relance**: número + medidor de teto; detalhe ao passar (produção prevista, teto, descarte);
- Administração (carga/capacidade) e Prestígio;
- rodada e limite; **momento** (Planejar / Resultado / Conflitos); **quem falta** confirmar (avatares);
- **alertas**: evento mundial pendente, proposta recebida, ataque recebido, cidade sem ação — cada alerta leva ao objeto;
- **acesso aos Tabuleiros**: ícones com contador (Teia, Diplomacia, Cartas, Eras e Hegemonia, Crônicas, Compêndio). Não são abas: abrem uma sobreposição e voltam ao mapa.

Modo de vitória da mesa (V4 §22.1) aparece no Tabuleiro de Eras e no ponto de rodada ("Rodada 6/15 · vence o Prestígio ou a Hegemonia").

### 3.2 Cartão de Seleção (CONTEXT)

Uma estrutura para todos os objetos: **cabeçalho** (o que é, dono, estado de névoa) → **relance** (3–5 fatos) → **ações legais** com custo e o que falta → **prévia** da ação escolhida → botão **Reservar** (cria uma ficha na Bandeja). "Detalhe" abre a camada de cálculo dentro do próprio cartão.

| Objeto | Relance | Ações |
|---|---|---|
| Hex/território | terreno, dono, rendimento, depósito, custo de movimento | reivindicar, melhoria, estrada, fundar (com pioneiro) |
| Pilha | composição, força, suprimento, limite da pilha | mover (desenha caminho), atacar (desenha seta + prévia), explorar (escolha de orientação), missão de influência |
| Cidade | Nível 1–7, habitantes, ânimo, estabilidade, ação urbana da rodada | abrir Lente da Cidade; ação urbana rápida (Produzir) |
| Civilização (fronteira, capital, peça) | relação (paz/guerra, tratados, rotas), contato | propor tratado, oferta comercial, declarar guerra (com confirmação e custo em Prestígio) |
| Povo independente | tipo, atitude, sua influência | as 6 ações com custo e requisito |
| Bando saqueador | força, alvo provável | — |

Ancoragem: em desktop o cartão aparece ao lado do objeto, do lado com mais espaço livre, e não cobre o objeto nem o caminho desenhado. Em celular vira folha inferior.

### 3.3 Bandeja de Ordens (DECISION)

- **Orçamento**: "Ações 5/7" (vocabulário único "Ações", até a DEC-018 decidir Comando) e as **vagas de cidade** (um ponto por cidade, cheio quando a ação urbana foi reservada).
- **Fichas** das ordens reservadas, na ordem de resolução; clicar destaca no mapa; × cancela.
- **Checagem antes de confirmar**: cidades sem ação, peças paradas, evento sem resposta. Não bloqueia; avisa.
- **Botão do momento**: "Confirmar planejamento" → depois "Voltar a planejar" enquanto outros não confirmaram.

### 3.4 Trilho

Coluna de ícones de 56 px: cidades (com ponto de "sem ação"), pilhas (com contador e estado de suprimento), alertas. Passar o mouse mostra o nome; clicar **centraliza o mapa e seleciona**. Abrir o trilho mostra a lista por cima do mapa; ela fecha ao selecionar. Substitui o Conselho permanente.

### 3.5 Lente da Cidade

A cidade não é uma página nem uma gaveta: é o mapa aproximado.
- o mapa centraliza e aproxima o território da cidade; o resto escurece;
- hexes trabalhados mostram o rendimento sobre o hex; distritos e fortificação aparecem como peças da cidade;
- **Cartão da Cidade** (ancorado): Nível (escada 1–7, DEC-002, sem nomes nem regra de subida até a especificação), habitantes por papel, ânimo e estabilidade, **previsão de crescimento** (regra única do motor), **ação urbana da rodada** com opções, custo e prévia;
- **Detalhe sob demanda** dentro do cartão: economia por fonte, armazém e descarte, guarnição.
- Esc ou clicar fora volta ao zoom anterior com a seleção preservada.

### 3.6 Tabuleiros (KNOWLEDGE)

Sobreposições grandes (cerca de 85% da tela), uma por vez, com o mapa visível e escurecido nas bordas. Sempre com "voltar ao mapa" (Esc) e ligações de volta ao mapa ("mostrar no mapa").

| Tabuleiro | Conteúdo | Ligação com o mapa |
|---|---|---|
| **Teia Civilizacional** | rede em anéis por era (I–VI) e setores por domínio; caminho do nó; exclusões; quem pesquisa (cidade) | pesquisar reserva a ação urbana de uma cidade |
| **Diplomacia** | mesa com os assentos das civilizações; por assento: relação, tratados, rotas, propostas; ofertas comerciais | "mostrar fronteira", "mostrar rota" |
| **Cartas e Projetos** | mão completa, ambições secretas, conselheiros, mercado, Grandes Projetos | jogar carta volta ao Planejamento |
| **Eras e Hegemonia** | linha de 6 eras com marcos; rastreador dos 6 caminhos; caminho mais próximo; declaração (só Era VI); Prestígio | "ir para o objeto que falta" |
| **Crônicas** | rodadas anteriores: replay, livro-razão, batalhas | rever no mapa |
| **Compêndio** | regras e glossário com "onde vejo isso no jogo" | destaca o elemento na tela |

### 3.7 Resultado (CONSEQUENCE)

- Ao confirmarem todos, a Mesa entra em **replay**: cada etapa do motor visível para o jogador é uma batida (ações urbanas → movimentos → diplomacia → conflitos → manutenção → fim da rodada).
- A **Linha da Crônica** na base mostra as batidas como contas; avançar, pausar, pular. Cada batida destaca no mapa o que mudou (peça que andou, hex reivindicado, cidade que cresceu).
- No fim: **Resumo da rodada** em pergaminho (recursos início → fim, cresceu/perdeu, batalhas, Prestígio, eventos) e "Planejar rodada N+1".
- Só aparece o que o servidor projeta para o jogador (`resolutionEvent.visibleTo`).

### 3.8 Folha de Batalha

Centro da tela, sobre o mapa escurecido, com o hex da batalha visível. Lados com peças, postura, detalhamento de cada número e dados táticos. Em Conflitos, quem tem reação decide aqui. Depois, a folha encolhe para o hex e o replay continua.

## 4. Regras de presença

1. Sem seleção, apenas Faixa, Trilho recolhido e Bandeja. Mapa visível ≥ 85%.
2. No máximo **um** Cartão de Seleção e **um** Tabuleiro ao mesmo tempo. Abrir um Tabuleiro esconde o Cartão; fechar devolve a seleção.
3. Nada empurra o mapa; tudo cobre parcialmente e recolhe.
4. Superfícies modais (Folha de Batalha, evento mundial) só quando a decisão é obrigatória ou é um resultado.
5. Esc sempre volta um nível: Detalhe → Cartão → Mesa.

## 5. Fluxos principais

| Fluxo | Passos |
|---|---|
| Reservar ataque | selecionar pilha → "Atacar" → hexes alvo destacados → escolher alvo (seta desenhada) → postura → prévia no cartão → Reservar → ficha na Bandeja |
| Ação urbana | clicar cidade → cartão com ação rápida ou "Abrir lente" → escolher ação → prévia (custo, crescimento, produção) → Reservar → vaga da cidade cheia |
| Pesquisar | Tabuleiro da Teia → nó → "Pesquisar com Aurora" → Reservar (gasta a vaga urbana) → volta ao mapa |
| Tratado | clicar fronteira/capital → cartão da relação → "Propor" → termos → Reservar |
| Responder proposta | alerta na Faixa → pergaminho com Aceitar/Recusar (ação livre) |
| Evento mundial | pergaminho no início do Planejar → escolha → fecha |
| Confirmar | Bandeja → checagem → Confirmar → "aguardando Beto, Clara" → Resultado |
| Ver o que aconteceu | Resultado automático; depois Crônicas |

## 6. Navegação e atalhos

Mouse/toque primeiro; teclado completo. `Espaço` centraliza; `Tab` próxima peça sem ordem; `1–9` cidades; `T` Teia, `D` Diplomacia, `C` Cartas, `E` Eras, `R` Crônicas, `?` Compêndio; `Enter` reserva; `Esc` volta.

## 7. Tamanhos de tela

A arquitetura é a mesma em todos os tamanhos; muda a forma das superfícies.

| Tamanho | Cartão | Tabuleiros | Bandeja | Trilho |
|---|---|---|---|---|
| Desktop ≥ 1280 | ancorado ao objeto | sobreposição 85% | completa | ícones à esquerda |
| Tablet | ancorado; alvos ≥ 44 px | sobreposição 95% | completa | ícones à esquerda |
| Celular | folha inferior (meia altura, arrastável) | tela cheia | compacta (orçamento + botão; fichas numa folha) | botão "peças" que abre uma folha |

Nunca uma página empilhada; o mapa continua sendo a tela.

## 8. Tratamento das decisões em aberto

| Tema | Na V2 |
|---|---|
| Ações × Comando (DEC-018) | só "Ações"; modificadores aparecem como "+1 Ação" |
| Coesão (DEC-016/022) | não aparece |
| Ânimo | estado atual com efeito; sem prometer queda |
| Frota (DEC-014) | aparece bloqueada com o motivo real |
| Nível 1–7 (DEC-002) | escada visível; sem nomes nem regra de subida até a especificação |
| Teia (DEC-012) | rede em anéis tolerante ao formato final |
| PNA e Embargo (DEC-015) | texto da regra atual |
| Pulso × Evento mundial (DEC-017) | nomes distintos: Pulso como aviso na Faixa ao abrir a rodada (já resolvido); Evento mundial como decisão no Planejar |
| Hegemonia (DEC-006) | contagem desde o início; declarar só na Era VI |

## 9. Hipóteses a validar em playtest

| Hipótese | Métrica |
|---|---|
| Mapa como mesa reduz rolagem e troca de tela | trocas de superfície por rodada; 0 rolagens de página |
| Três momentos reduzem a espera | tempo médio entre confirmações; desistências por rodada |
| Cartão ancorado é suficiente sem Inspetor fixo | tempo até a primeira ordem; aberturas de "Detalhe" |
| Lente da Cidade substitui a página de cidade | tempo da ação urbana; erros de vaga não usada |
| Replay comunica consequências | perguntas "o que aconteceu?" no playtest; aberturas de Crônicas |
| Teia em rede ajuda a planejar | nós pesquisados fora de um caminho |

## 10. Do Alpha atual à V2 (sem implementar)

| Alpha hoje | V2 |
|---|---|
| Top bar + barra inferior | Faixa de Estado + Bandeja de Ordens |
| Conselho (coluna esquerda) | Trilho |
| Inspetor Cidade/Território/Militar | Cartão de Seleção por objeto |
| Painel da cidade | Lente da Cidade |
| Abas Teia/Cartas/Diplomacia/Eras/Crônicas | Tabuleiros sob demanda |
| Painel de resolução + Crônicas | Resultado (replay) + Crônicas |
| `alphaPlayerView` | inalterado como fonte; a V2 é apresentação |

## 11. Fora de escopo desta proposta

Implementação; mudanças de regra; sistemas classe C/D da V4 (naval, Mercado/Banco, Legado, Reputação); tamanhos de mapa; novas civilizações.

# Experience V2.2 — Identidade visual na mesa

Data: 2026-10-03. **Proposta visual.** Nenhuma regra nova; nada implementado no produto.

A estrutura da V2.1 continua valendo:

- interface limpa e mapa dominante, sem rolagem global;
- Cofre e Livro;
- uma única ação dominante (CTA), com pouco ouro;
- informação sob demanda.

Esta etapa só troca o que está **sobre** o mapa: cidades, peças, navios, bandeiras e cartas.

- Conceitos: [`concepts/v22-identity.html`](concepts/v22-identity.html), 13 pranchas de 1440×900:
  - `a1`–`a3`: cidade, fortificação e peças;
  - `a4`/`a4b`: teste no mapa;
  - `a5`–`a8`: naval, civilizações, colisões e bandeira aplicada;
  - `a9`: kit;
  - `a10`: cartas;
  - `a11`/`a12`: Mesa V2.1, colorida e em cinza.
- Arte compartilhada: [`concepts/art-v22.js`](concepts/art-v22.js). O mesmo código desenha os conceitos e o [protótipo jogável](prototype/index.html).

## 1. Regra de leitura

1. **Forma** diz o que é: uma família de peça, o nível da cidade ou o tipo de navio.
2. **Cor** diz de quem é. É a cor do assento, nunca a da civilização.
3. **Texto** só sob demanda, ao selecionar ou abrir o Livro.

São permanentes apenas:

- o nome da cidade;
- o número do nível;
- a contagem da pilha.

Caminho e alvo usam pergaminho claro (`#f4ecd8`), não ouro. O ouro fica reservado à ação dominante.

## 2. Cidade top-down — A/B

| | A · plano puro | B · plano com profundidade leve |
|---|---|---|
| Desenho | telhados, ruas e praças vistos de cima | o mesmo plano + sombra projetada e cumeeira |
| Leitura a 60 px | melhor: contraste limpo | sombras somam ruído abaixo de 70 px |
| Custo de arte | baixo, gerável por regra | médio |
| **Recomendação** | **A na mesa** | B só no Foco (cidade aberta) |

A cidade **ocupa o hex inteiro**. O nível se lê pelo traçado, não pela altura:

| Nível | Traçado |
|---|---|
| 1 · Posto | 3 cabanas e uma trilha |
| 2 · Aldeia | clareira, praça e duas trilhas |
| 3 · Vila | duas ruas cruzadas e praça cívica |
| 4 · Cidade | quadras em grade |
| 5 · Grande Cidade | avenidas diagonais e mais densidade |
| 6 · Metrópole | anel viário do antigo limite, jardins e cúpula cívica |
| 7 · Metrópole Imperial | cidadela com pátio e quatro torres; seis avenidas radiais |

A cor do assento aparece em dois lugares: o telhado do centro cívico e a borda do hex. O resto da cidade é neutro.

**Nível de detalhe (LOD)**

| Distância | O que aparece | Tamanho |
|---|---|---|
| Afastado | selo hexagonal com o número do nível | 20 px |
| Normal | cidade top-down + bandeira + nível + nome | 60–85 px (hex) |
| Foco | cumeeiras, jardins, emblema da civilização na praça | 220 px+ |

**Fortificação = overlay separado**, desenhado na borda do hex, nunca dentro da cidade. Usa a escada canônica do Alpha (doc 09).

| Nível | Overlay |
|---|---|
| Paliçada | estacas tracejadas de madeira |
| Muralha de Pedra | muro contínuo e 3 torres quadradas |
| Fortaleza | muro grosso, 6 torres redondas e portão |
| Baluarte | bastiões em ponta |
| Cidadela | fosso, bastiões e muralha interna |

Integridade baixa abre brechas com entulho. No protótipo, que não tem fortificação, o distrito Militar desenha a Paliçada; é só um mapeamento visual.

## 3. Atlas de peças

| Família | Silhueta | Classe |
|---|---|---|
| Infantaria | bloco com três lanças (pente) | militar |
| Guarda | escudo alto com bossa | militar |
| Atiradores | arco em D com flecha atravessada | militar |
| Cavalaria | cabeça de cavalo | militar |
| Cerco | catapulta com duas rodas e braço | militar |
| Explorador | rosa dos ventos em disco de pergaminho | civil |
| Pioneiro | casa + bandeira de fundação em disco | civil |
| Enviado | carta lacrada em disco | civil |
| Guarda de Escudos (Valgard) | três escudos + estrela | assinatura |
| Elefantes de Guerra (Targan) | cabeça com orelhas e presas + estrela | assinatura |
| Cavalaria das Estepes (DEC-011) | cavalo + arco + estrela | assinatura |
| Infantaria Naval (Thalos) | pente + âncora + estrela | assinatura |
| Engenheiros de Cerco (Kor) | catapulta + martelo + estrela | assinatura |

**Regras**

- Peças militares têm a silhueta cheia na cor do assento, com contorno escuro.
- Peças civis são um disco de pergaminho com aro do assento. A classe se lê antes da família.
- A assinatura é a silhueta da família com uma variação e uma estrela. Lê-se primeiro a família, depois a exceção.
- O degrau tecnológico (UXDEC-015) aparece como pontos na base, sem trocar a silhueta.
- A pilha mostra a família dominante e a contagem.
- **Peças civis nunca se escondem sob o exército.** Explorador, Pioneiro e Enviado na mesma casa aparecem como discos de 18 px ao lado da pilha.

**Testes** (prancha `a3` e mapa `a4`/`a4b`)

- 36 px e 28 px, em escala de cinza;
- em dois assentos de cores próximas;
- em quatro terrenos;
- no mapa inteiro com hex de 52 px e no recorte a 100%.

Correções feitas pelo teste:

- O primeiro Explorador (luneta diagonal) parecia placa de proibido; virou rosa dos ventos.
- O Enviado em pergaminho enrolado virava mancha; virou carta lacrada.

## 4. Atlas naval

**FUTURO no Alpha.** O Alpha tem uma só classe Frota e nenhuma capital costeira recruta. O visual fica pronto e o motor não muda até a DEC-014.

| Navio | Função visível no casco |
|---|---|
| Embarcação Costeira | casco curto, 2 remos por lado |
| Mercante | casco largo, porões quadrados, 1 vela |
| Galera | casco longo, 7 remos por lado |
| Galera de Guerra | esporão na proa, escudos na amurada |
| Nau de Transporte | 6 vagas circulares no convés, 2 mastros |
| Carraca | castelos de proa e popa, 3 mastros |
| Fragata | casco esguio, portinholas, 3 mastros |

A proa aponta para o destino. Tamanho mínimo na mesa: 38 px de casco.

Fragilidade conhecida: em cinza a 38 px, Carraca e Fragata se aproximam (as velas dominam). Antes da arte final, a Carraca precisa de um casco mais largo e castelos mais escuros.

## 5. Civilização ≠ cor

**Identidade = emblema + selo + bandeira + padrão de borda.** A cor é do assento.

- 3 selos (Círculo, Hexágono, Losango) × 6 bandeiras (Reta, Bifurcada, Flâmula, Gonfalão, Escudo, Arredondada) = 18 pares únicos.
- 6 padrões de borda territorial: Sólida, Tracejada, Pontilhada, Dupla, Traço-ponto, Faixa interna.
- Os 12 emblemas da V2.1 seguem, com três redesenhados para não colidir:
  - Saren: três vozes;
  - Orinth: olho do mirante;
  - Veyra: encruzilhada.
- Há 6 emblemas novos para as civilizações só da Bíblia: moeda, prisma, presa, espiral, elos e floco.

| Civilização | Emblema | Selo | Bandeira | Borda | Fonte |
|---|---|---|---|---|---|
| Aurélia | espiga | Círculo | Gonfalão | Sólida | Alpha |
| Valgard | passo | Hexágono | Escudo | Tracejada | Alpha |
| Merídia | ondas | Círculo | Bifurcada | Pontilhada | Alpha |
| Thalos | farol | Losango | Flâmula | Pontilhada | Alpha |
| Saren | três vozes | Hexágono | Reta | Dupla | Alpha |
| Kor | bigorna | Losango | Escudo | Sólida | Alpha |
| Orinth | olho | Losango | Arredondada | Traço-ponto | Alpha |
| Nymara | folha | Círculo | Arredondada | Faixa | Alpha |
| Veyra | encruzilhada | Hexágono | Bifurcada | Traço-ponto | Alpha |
| Solenne | sol | Círculo | Reta | Faixa | Alpha |
| Dravik | arcos | Hexágono | Gonfalão | Dupla | Alpha |
| Elyra | chama | Círculo | Flâmula | Tracejada | Alpha |
| Kaedor | moeda | Losango | Reta | Tracejada | Bíblia |
| Lumaris | prisma | Hexágono | Flâmula | Faixa | Bíblia |
| Targan | presa | Losango | Bifurcada | Sólida | Bíblia |
| Iskara | espiral | Losango | Gonfalão | Pontilhada | Bíblia |
| Veloria | elos | Hexágono | Arredondada | Sólida | Bíblia |
| Norvak | floco | Círculo | Escudo | Dupla | Bíblia |

**Colisões** (prancha `a7`, medidas no navegador)

Método:

1. Cada emblema é desenhado num bitmap de 28 px.
2. Para cada par, mede-se a interseção sobre a união dos traços.
3. A partir de 0,45, o par precisa diferir em pelo menos 2 de 3 canais (selo, bandeira, borda).

| Par | Semelhança | Canais diferentes | Veredito |
|---|---|---|---|
| Dravik × Veloria | 0,49 | bandeira, borda | passa pelo conjunto |
| Aurélia × Elyra | 0,49 | bandeira, borda | passa pelo conjunto |
| Orinth × Veloria | 0,46 | selo, borda | passa pelo conjunto |
| Nymara × Elyra | 0,45 | bandeira, borda | passa pelo conjunto |
| Orinth × Iskara | 0,45 | bandeira, borda | passa pelo conjunto |

A medida é grosseira, porque todo emblema ocupa o mesmo quadro. Ela ordena os pares para revisão; não substitui o teste com jogadores. Os sigilos procedurais da Bíblia continuam como exploração, e estes emblemas também não são arte final.

**Bandeira aplicada** (prancha `a8`): a mesma bandeira pequena aparece em seis lugares.

- **Cidade:** no canto do hex.
- **Seleção:** junto à peça.
- **Lobby:** com o selo.
- **Diplomacia:** frente a frente.
- **Ranking:** com uma faixa da cor do assento.
- **Captura:** a bandeira antiga cai e esmaece; a nova sobe.

O campo da bandeira leva a cor do assento e o desenho leva a civilização. Isso evita um carnaval de cores.

## 6. Demonstração na Mesa V2.1 (pranchas `a11` e `a12`)

Dois assentos de cores próximas, de propósito: Valgard em azul `#6ca7d9` e Thalos em verde-água `#5cb3a5`. A cena tem:

- uma Grande Cidade com Muralha de Pedra e bandeira em escudo;
- uma Cidade de Thalos com Paliçada e flâmula;
- Explorador, Pioneiro selecionado (caminho e alvo em pergaminho) e Enviado;
- exército de Infantaria ×4, com o selo “+1 F” da carta que o reforçou;
- Guarda de Escudos ×2 (assinatura);
- Cavalaria de Thalos ×3;
- uma Galera de Guerra e um Mercante;
- o leque de cartas recolhido, uma bandeja com uma única ação dourada.

Em cinza (`a12`), os dois azuis viram o mesmo cinza. Mesmo assim, cada assento continua identificável:

- **borda:** tracejada × pontilhada;
- **selo:** hexágono × losango;
- **bandeira:** escudo × flâmula;
- **peças:** pela silhueta.

## 7. Verificação em partida real (protótipo)

Partida no [protótipo](prototype/index.html), com a nova arte, contra dois bots:

- Aurélia em azul, Valgard em verde-água e Merídia em terracota;
- 15 rodadas automáticas, em desktop (1440×900) e mobile (390×844);
- 0 erros de página;
- mobile sem rolagem global (390 × 844).

| Item | Resultado |
|---|---|
| Cidade | ✓ top-down, ocupa o hex |
| Nível | ✓ 1, 3, 4 e 5 se distinguem sem ler o número — **mas só num estado semeado** (ver achado 1) |
| Pioneiro × Explorador | ✓ discos distintos; junto ao exército, aparecem como satélites (antes ficavam escondidos sob a pilha) |
| Exército | ✓ silhueta + contagem |
| Navio | ✗ não existe no protótipo nem no Alpha (FUTURO); demonstrado só em `a11` |
| Dono | ✓ borda, telhado cívico e campo da bandeira na cor do assento |
| Civilização | ✓ sólida × tracejada × pontilhada, e bandeiras distintas; passa em cinza |
| Fortificação | ✓ Paliçada sobre a cidade com distrito Militar — fraca a zoom 1,0 (achado 2) |
| Alvo/movimento | ✓ caminho e alvo em pergaminho; antes eram dourados, como o CTA |
| O que a carta fez | parcial: aviso “Reservas Coordenadas: +2 Alimento agora.” Não há selo no alvo (achado 3) |
| Ouro | ✓ uma só ação dourada; o CTA da bandeja perde o ouro quando uma carta está em foco |
| Cartas | ✓ desktop: leque recolhido, levanta no hover, uma carta em foco · mobile: gaveta horizontal |

**Achados**

1. **Nenhuma cidade passa de Posto em 15 rodadas** de jogo automático no protótipo.
   - A sobra de Alimento é dividida entre as cidades e consumida pelas peças. O crescimento chega a 8 de 10 em 14 rodadas.
   - É balanceamento do protótipo, não do Alpha. Para ver os níveis em partida, foi usado um estado semeado e rotulado (capital com 12 habitantes).
   - Corrigir antes do próximo teste com pessoas.
2. **A Paliçada é sutil** com hex de 60 px. O contorno foi reforçado (traço escuro + madeira clara), mas ainda pede um teste a 100% com jogadores.
3. **A carta mostra o resultado só no aviso.** O conceito `a11` propõe um selo efêmero no alvo (“+1 F”); falta no protótipo.
4. O nome “Arqueiros” (Alpha) × “Atiradores” (Bíblia) continua divergente (doc 09).

## 8. Decisões propostas

| ID | Decisão | Recomendação |
|---|---|---|
| UXDEC-016 | Cidade A ou B | A na mesa, B só no Foco |
| UXDEC-017 | Fortificação como overlay na borda do hex | adotar |
| UXDEC-018 | Peças civis em disco; nunca escondidas sob a pilha | adotar |
| UXDEC-019 | Identidade = emblema + selo + bandeira + borda; cor só do assento | adotar; substitui a cor da civilização do Alpha (`colors[]` em `alpha-institutions.ts`) quando houver implementação |
| UXDEC-020 | Caminho e alvo em pergaminho; ouro só no CTA | adotar |

O que não muda nesta etapa: o motor, os dados do Alpha, o número de civilizações em jogo (12) e o naval (FUTURO).

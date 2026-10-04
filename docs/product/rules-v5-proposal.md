# Ages of Hegemony — Regras V5.1a FINAL (CANONICAL BASELINE)

Data: 2026-10-04. **V5.1 aprovada como base; V5.1a é a correção final antes do engine** (Capacidade como potência da ativação, redistribuição no Planejamento, mobilização, Capacidade efetiva, N7 só na Era VII, Administração sem carga zero, nomes de recursos por extenso). Nada implementado no engine ainda. Tudo aqui é conteúdo original de AoH; referências externas valem só como princípio de design (ordens limitadas, um mundo que reage, eras que escalam).

A V5.1 reconcilia a V5 com o documento antigo ("Ages of Hegemony.html", a Bíblia) e o canvas. A direção da V5 fica: 7 Eras, 5 rodadas por Era, 5 Ordens, 8 recursos, limites 15/10, Ânimo como estado social principal, 18 civilizações, Líderes, Manobras, Ambições, Pulso/Pressão, Encontros, Hegemonia na Era VII, UX V2.2. O que a V5.1 recupera da Bíblia e o que descarta está no §20.

A proposta visual está em [`experience-v2/concepts/v5-proposal.html`](experience-v2/concepts/v5-proposal.html) (19 pranchas) e no artifact publicado.

---

## 1. Estrutura

| Parâmetro | Padrão | Personalizável |
|---|---|---|
| Eras | 7: I Fundação · II Expansão · III Consolidação · IV Civilização · V Impérios · VI Potências · VII Ascensão | número de Eras |
| Rodadas por Era | 5 | 3–7 |
| Ordens por rodada | 5 | 3–6 |
| Total padrão | 35 rodadas | — |
| Vitória | Hegemonia declarada na Era VII e sustentada 2 rodadas; senão, maior Prestígio na rodada 35 | — |

Hegemonia não é Era. A Era VII apenas abre a Declaração.

**Fórmula de toda ação:** ORDEM (tempo) + RECURSOS (custo) + TECNOLOGIA (avanço da Teia que desbloqueia) + INFRAESTRUTURA (distrito/edifício/porto que habilita) = ação. Quando qualquer parte falta, a UI mostra qual.

## 2. As 5 Ordens

Uma Ordem autoriza uma ação; não paga o custo. Recursos, avanço e infraestrutura continuam obrigatórios. Tipos podem repetir.

| Ordem | Autoriza | Peça/alvo |
|---|---|---|
| **Cidade** | Produzir · Construir · Recrutar · Governar · **Elevar** (subir de nível) | uma cidade (ativação) |
| **Expedição** | mover · explorar · fundar · embarcar/transportar · desembarcar · atacar quando o movimento gera conflito | uma pilha ou peça |
| **Avanço** | pesquisar um avanço da Teia ou de Herança | — |
| **Influência** | tratado · oferta comercial · rota · missão cultural · ação com povo independente · integração política · **adoção ou reforma de Governo** | um Enviado, cidade ou civilização |
| **Legado** | iniciar/avançar Obra de Legado · empreendimento excepcional (grande migração) · Declaração de Hegemonia | uma cidade ou a civilização |

**Ações livres** (sem Ordem): responder a propostas, jogar 1 Manobra proativa e 1 Reação por rodada, escolher no Pulso, ajustar postura defensiva, usar o poder do Líder, cancelar uma Ordem antes de confirmar. **Redistribuir a população** de uma cidade também não gasta Ordem, mas só durante o Planejamento, uma vez por cidade; ao confirmar o planejamento a alocação trava para a rodada (§6).

## 3. Recursos (8)

| Recurso | Função | Limite-base |
|---|---|---|
| Alimento | sustento, crescimento, Pioneiros, manutenção militar, campanhas | 15 |
| Madeira | infraestrutura leve, edifícios, navios, máquinas | 15 |
| Pedra | urbanização, fortificações, Obras | 15 |
| Riqueza | comércio, contratos; cobre até 50% de custo material; nunca Conhecimento/Influência/Cultura | 15 |
| Metal | tropas especializadas, cerco, navios militares | 10 |
| Conhecimento | Teia e Herança | 10 |
| Influência | diplomacia, Enviados, governos, integração, povos | 10 |
| Cultura | presença cultural, ações culturais, recuperação de Ânimo, cartas, Obras | 10 |

Excedente é perdido no fim da fase de Manutenção, salvo conversão permitida por regra (Mercado: até 3 de material excedente → 1 Riqueza). O Cofre mostra sempre `atual / limite`. Infraestrutura que sobe limites: §9; teto absoluto 30 / 20. Se Riqueza ou Conhecimento baterem no teto cedo, ajusta-se geração, custos, sumidouros ou frequência de gasto — nunca o teto: o limite existe para criar decisão.

## 4. Cidade: a escada e como se sobe

| Nível | Nome | Habitantes (mín.) | Capacidade | Vagas de distrito | Alcance de suprimento | Guarnição |
|---|---|---|---|---|---|---|
| 1 | Posto | 2 | 1 | 1 | 2 | 4 |
| 2 | Aldeia | 4 | 1 | 1 | 2 | 4 |
| 3 | Vila | 6 | 2 | 2 | 3 | 5 |
| 4 | Cidade | 8 | 2 | 3 | 3 | 6 |
| 5 | Grande Cidade | 11 | 3 | 4 | 4 | 7 |
| 6 | Metrópole | 14 | 3 | 5 | 4 | 8 |
| 7 | Metrópole Imperial | 18 | 4 | 6 | 5 | 10 |

Habitantes máximos por nível: o mínimo do nível seguinte − 1 (Imperial: 20). A cidade cresce até o teto e para; só volta a crescer depois de Elevar.

**Elevar** (ação da Ordem Cidade). A cidade sobe um nível quando cumpre as três condições:

| Para | Habitantes | Custo de desenvolvimento | Avanço exigido (Teia) | Era mín. |
|---|---|---|---|---|
| N2 Aldeia | 4 | 3 Madeira | Agricultura | I |
| N3 Vila | 6 | 4 Madeira 2 Pedra | Alvenaria | II |
| N4 Cidade | 8 | 5 Madeira 3 Pedra 2 Riqueza | Engenharia | III |
| N5 Grande Cidade | 11 | 6 Madeira 5 Pedra 3 Riqueza 2 Conhecimento | Urbanismo | IV |
| N6 Metrópole | 14 | 8 Madeira 6 Pedra 5 Riqueza 3 Conhecimento | Saneamento | V |
| N7 Imperial | 18 | 10 Madeira 8 Pedra 8 Riqueza 4 Conhecimento | Saneamento **e** Convergência Metrópoles do Mundo | **VII** |

N7 só existe na Era VII — Ascensão: é o selo do fim de partida, nunca da Era VI. Os custos vêm da Bíblia (N2 4 Alimento/3 Madeira … N7 12/12/6/12/4) rebalanceados para caber no Cofre: nenhum componente passa de 10 (cap base 15), e Alimento sai do custo porque já foi gasto no crescimento. Desenvolvimento 1–5 é eliminado. O Nível substitui tudo o que ele fazia: Capacidade, vagas, alcance de suprimento e de produção, armazém (§9) e guarnição.

**Capacidade é a potência da ativação.** Não é especialização (isso são vagas e distritos, §5) nem só hexes. Cada ação da Ordem Cidade lê a Capacidade de um jeito:
- **Produzir:** território e fontes trabalhadas = centro + Capacidade hexes (pelos Produtores).
- **Recrutar:** carga máxima da ativação: peças recrutadas ≤ Capacidade (e ≤ Soldados).
- **Construir:** porte: 1 construção por ativação; um edifício avançado, fortificação de Fortaleza para cima ou passo de Obra exige Capacidade ≥ 2; nível ≥ 3 com Capacidade ≥ 2 pode construir e produzir na mesma ativação gastando 2 pontos.
- **Governar:** alcance e intensidade: recupera até Capacidade níveis de Ânimo distribuídos entre esta cidade e cidades ligadas por estrada dentro do alcance de suprimento; repara Capacidade passos de Integridade.

**Capacidade efetiva** = menor entre a Capacidade do nível construído e a Capacidade do nível cuja população mínima a cidade ainda tem. O nível construído nunca cai por perda de habitantes: uma Metrópole devastada continua Metrópole (vagas, alcance, guarnição), mas opera como Vila até repor gente. O selo no mapa mostra `N6 · 2/3` e o Cartão diz "opera abaixo da capacidade: 7 habitantes (Vila)".

**Administração.** Carga: cidade integrada 1; cidade **Ocupada** (capturada, Integração < 100) 2. Capacidade Administrativa = **2 (base) + 1 (capital) + 1 por distrito Administrativo + 1 Chancelaria (uma por civilização) + governo + Teia (Códigos +1, Urbanismo +1) + efeitos específicos (Líder, Herança, Manobra)**. Nenhuma cidade vale carga zero; uma cidade avançada com distrito Administrativo paga a própria carga e sobra 0. Carga > Capacidade Administrativa = **Sobre-extensão**: no fim de cada rodada em Sobre-extensão, a cidade de menor Ânimo perde 1 nível de Ânimo, e nenhuma cidade pode fazer a segunda ativação. Nada mais: sem contador, sem barra.

**Raio de reivindicação:** 1 nos níveis 1–2, 2 nos 3–5, 3 nos 6–7.

## 5. Distritos (8) e vagas

Oito distritos: **Agrário, Comercial, Acadêmico, Administrativo, Militar, Industrial, Cultural, Marítimo** (Marítimo exige costa). Cada um ocupa 1 vaga e habilita edifícios da própria família. As vagas crescem com o nível (1/1/2/3/4/5/6): nenhuma cidade constrói tudo; a Imperial escolhe 6 de 8.

| Distrito | Efeito base | Edifícios da família | Avanço que abre |
|---|---|---|---|
| Agrário | +2 Alimento por Produzir | Celeiro, Moinho, Irrigação (melhoria) | Agricultura |
| Comercial | +1 Riqueza por Produzir; rota a partir desta cidade | Mercado, Tesouro, Banco | Troca |
| Acadêmico | +1 Conhecimento por Produzir | Biblioteca, Academia, Observatório, Arquivo | Escrita |
| Administrativo | Capacidade Administrativa +1; Governar +1 | Chancelaria, Tribunal | Códigos |
| Militar | Recrutar sem limite de Capacidade (ainda ≤ Soldados); guarnição +1 | Quartel, Arsenal, Fortaleza+ | Formações |
| Industrial | +1 Madeira e +1 Pedra por Produzir | Oficina, Fundição, Manufatura | Metalurgia |
| Cultural | +1 Cultura por Produzir | Templo, Teatro, Monumento | Narrativas |
| Marítimo | Porto incluído; navios; pesca +1 Alimento | Estaleiro, Farol, Entreposto | Navegação Costeira |

Fortificações não ocupam vaga (camada própria, UXDEC-017).

## 6. População: papéis

Cada habitante tem um papel. **Redistribuir** acontece só durante o Planejamento, uma vez por cidade, sem Ordem; ao confirmar o planejamento a alocação trava para a rodada inteira. Tecnologias, governos ou Líderes podem criar exceções explícitas (ex.: Monarquia pode redistribuir a capital na Resolução 1×/Era). A UI é uma linha de fichas arrastáveis no Cartão da cidade, bloqueada depois de confirmar.

| Papel | Rende por Produzir | Observação |
|---|---|---|
| Produtor | trabalha 1 hex (até a Capacidade); a cada 2 Produtores sem hex, +1 Alimento | base da colheita |
| Artesão | a cada 2, +1 Madeira ou +1 Pedra (escolha) | exige Oficina para o 3º+ par |
| Mercador | a cada 2, +1 Riqueza | exige Mercado para o 3º+ par |
| Erudito | a cada 2, +1 Conhecimento | exige Biblioteca para o 3º+ par |
| Soldado | nada | é quem Recrutar converte em peça (mobilização, abaixo) |
| Disponível | nada | recém-chegado; substitui "Não Alocado" |

**Mobilização (ciclo de vida).** Habitante Soldado → Recrutar → peça militar no mapa. Uma unidade terrestre básica (Infantaria, Guarda, Atiradores, Cavalaria, Arcabuzeiros) mobiliza 1 Soldado. Cerco e Artilharia mobilizam 1 Soldado mais os recursos e a infraestrutura da tabela (§11); navios não mobilizam. A cidade perde o habitante na hora.
- Peça **destruída**: o habitante mobilizado está perdido.
- Peça **desmobilizada** voluntariamente (Ordem Expedição, dentro de cidade própria e suprida): volta como 1 Disponível nessa cidade.
- O nível construído da cidade não cai por mobilização; a **Capacidade efetiva** cai (§4). Se a população ficar abaixo do mínimo do nível, a cidade não Eleva nem cresce além do teto do nível efetivo até repor.

## 7. Sustento e crescimento

**Sustento: 1 Alimento por 2 habitantes (arredonda para cima), por cidade**, pago na Manutenção. Peças militares: 1 Alimento por 2 peças. Navios: 1 Riqueza cada. Civis nada.

Testado contra a alternativa 1 Alimento/habitante (§19): com Capacidade 1/1/2/2/3/3/4, 1/hab exige mais Alimento do que uma Aldeia ou Cidade consegue colher mesmo com todos os hexes em Fazenda, e trava o jogo no N1–N2 em todas as simulações. 1 por 2 habitantes mantém a fome real (uma Aldeia sem Fazenda não se sustenta) e deixa N6–N7 alcançáveis com Irrigação, Rotação e Agrário.

**Fome:** Alimento insuficiente na Manutenção → a cidade perde 1 habitante (o Disponível primeiro, Soldado por último) e −1 Ânimo. Duas rodadas seguidas: −1 nível de Ânimo extra.

**Crescer:** no fim da Manutenção, para cada cidade, se o Alimento restante ≥ 3 e a cidade está abaixo do teto do nível, pague 3 Alimento e ganhe 1 habitante Disponível. Uma vez por cidade por rodada; a maior cidade cresce primeiro. Celeiro: Crescer custa 2 nessa cidade.

## 8. Suprimento

Alcance de suprimento de uma cidade = `1 + teto(Nível / 2)` → 2/2/3/3/4/4/5 hexes. Estradas ligam alcances (uma peça numa estrada contínua até uma cidade está suprida). Depósito (melhoria, 2 Madeira 1 Pedra, exige Logística) cria um ponto de alcance 1. Portos próprios suprem o mar adjacente.

Peça fora de suprimento: na Manutenção paga +1 Alimento por peça (extra); se não pagar, atrito: −1 Força permanente na peça (peça com Força 0 some) e não pode atacar na rodada seguinte. Testado em §19: N1–N2 alcançam 2 hexes (defensivo), N5+ projetam 4–5 hexes, isto é, uma guerra ofensiva de verdade pede Grande Cidade ou cadeia de estradas e depósitos.

## 9. Armazenamento

Limite-base 15 (Alimento, Madeira, Pedra, Riqueza) e 10 (Metal, Conhecimento, Influência, Cultura). Infraestrutura sobe limites, sempre com teto 2× o base (30/20):

| Infraestrutura | Sobe | Família | Avanço |
|---|---|---|---|
| Celeiro | Alimento +5 | Agrário | Agricultura |
| Armazém | Madeira +5, Pedra +5 | Industrial | Alvenaria |
| Tesouro | Riqueza +5 | Comercial | Moeda |
| Banco | Riqueza +5 | Comercial | Banco |
| Fundição | Metal +5 | Industrial | Ferro |
| Arquivo | Conhecimento +5 | Acadêmico | Escrita |
| Academia | Conhecimento +5 | Acadêmico | Filosofia Natural |
| Chancelaria | Influência +5 | Administrativo | Códigos |
| Teatro | Cultura +5 | Cultural | Escolas de Expressão |
| Metrópole (N6+) | +3 em tudo | nível | — |

Um edifício de cada por civilização conta para o limite (o segundo Celeiro não soma). Teste (§19): todo custo de Elevar cabe no cap base, inclusive N7 (10 Madeira); com um Armazém sobra espaço para Elevar e construir na mesma Era.

## 10. Ânimo

Estados: **Próspera** (+1 Capacidade na primeira ativação da rodada) · **Estável** · **Abalada** (−1 Capacidade, mínimo 1; não pode segunda ativação) · **Revolta** (só Governar e recuperação; não produz).

- Uma cidade ativa no máximo 2× por rodada (duas Ordens Cidade). Após a segunda ativação, perde 1 nível de Ânimo.
- Reduzem: fome, cerco, captura, guerra prolongada (3+ rodadas em guerra: −1 por Era), falta de manutenção, Pulsos, Sobre-extensão.
- Recuperam: Governar (+1, custa 1 Cultura ou 2 Riqueza), Alimento acima do consumo no fim da Era (+1), Teatro/Templo, avanços, Líder, Manobras.
- **Estabilidade e Coesão são removidas.** Estabilidade vira Ânimo. Coesão vira **Integração** (0–100) só em cidades capturadas; ao chegar a 100 a cidade é própria e entra em Abalada.

## 11. Custos propostos

**Peças** (Era mínima; terrestres mobilizam 1 Soldado)

| Peça | Custo | Total | Era | Avanço |
|---|---|---|---|---|
| Explorador | 1 Alimento 1 Riqueza | 2 | I | — |
| Pioneiro | 2 Alimento 1 Madeira | 3 | I | — |
| Enviado | 1 Riqueza 1 Influência | 2 | I | — |
| Infantaria | 1 Alimento 2 Madeira | 3 | I | — |
| Guarda | 1 Alimento 2 Pedra | 3 | I | Formações |
| Atiradores | 1 Alimento 1 Madeira 1 Metal | 3 | II | Metalurgia |
| Cavalaria | 2 Alimento 1 Madeira 1 Metal 1 Riqueza | 5 | II | Treino de Manobras |
| Cerco | 2 Madeira 1 Pedra 2 Metal 1 Riqueza | 6 | III | Engenharia |
| Arcabuzeiros | 1 Alimento 1 Madeira 2 Metal | 4 | V | Pólvora |
| Artilharia | 2 Madeira 1 Pedra 3 Metal 1 Riqueza | 7 | VI | Artilharia |
| Embarcação Costeira | 2 Madeira 1 Riqueza | 3 | I | Navegação Costeira |
| Mercante | 2 Madeira 2 Riqueza | 4 | II | Cartografia |
| Galera | 3 Madeira 1 Metal 1 Riqueza | 5 | II | Cartografia |
| Galera de Guerra | 3 Madeira 2 Metal 1 Riqueza | 6 | III | Arquitetura Naval |
| Nau de Transporte | 4 Madeira 1 Metal 2 Riqueza | 7 | III | Arquitetura Naval |
| Carraca | 4 Madeira 2 Metal 1 Riqueza | 7 | IV | Navegação Oceânica |
| Fragata | 3 Madeira 3 Metal 1 Riqueza | 7 | V | Balística |

Manutenção: 1 Alimento por 2 peças militares; navios 1 Riqueza; civis nada.

**Melhorias:** Fazenda 1 Madeira · Serraria 1 Madeira · Pedreira 2 Madeira · Mina 2 Madeira 1 Riqueza (Metalurgia) · Pesqueiro 1 Madeira 1 Riqueza · Estrada 1 Madeira 1 Pedra · Irrigação 2 Madeira 1 Pedra (Irrigação, Era II) · Depósito 2 Madeira 1 Pedra (Logística).

**Distritos:** todos 3 Madeira 1 Pedra; exigem o avanço da tabela do §5.

**Edifícios básicos** (3–5): Celeiro 2 Madeira 1 Pedra · Moinho 2 Madeira 1 Pedra · Mercado 2 Madeira 2 Riqueza · Biblioteca 2 Madeira 1 Pedra 1 Conhecimento · Quartel 2 Madeira 2 Pedra · Oficina 2 Madeira 1 Pedra 1 Metal · Templo 2 Pedra 1 Cultura · Porto (incluído no Marítimo) · Armazém 3 Madeira 1 Pedra.

**Edifícios avançados** (4–7): Academia 3 Pedra 2 Conhecimento · Arquivo 2 Madeira 2 Pedra 1 Conhecimento · Tesouro 2 Pedra 3 Riqueza · Banco 3 Pedra 3 Riqueza 1 Conhecimento · Fundição 3 Pedra 2 Metal · Arsenal 2 Pedra 3 Metal · Manufatura 3 Madeira 3 Pedra 1 Metal · Teatro 3 Pedra 2 Cultura · Monumento 4 Pedra 2 Cultura · Chancelaria 2 Pedra 2 Riqueza 2 Influência · Tribunal 3 Pedra 1 Riqueza 2 Influência · Estaleiro 4 Madeira 2 Metal · Farol 3 Pedra 1 Madeira 1 Riqueza · Observatório 3 Pedra 3 Conhecimento · Entreposto 4 Madeira 2 Pedra 3 Riqueza.

**Fortificações** (camada própria): Paliçada 3 Madeira · Muralha de Pedra 4 Pedra 1 Madeira (Alvenaria) · Fortaleza 5 Pedra 2 Metal (Fortificação, Era III) · Baluarte 6 Pedra 2 Metal 1 Riqueza (Pólvora, Era V) · Cidadela 7 Pedra 3 Metal 2 Riqueza (Defesa Profunda, Era IV+). Reparo: 1 passo de Integridade por 1 Pedra, via Governar.

**Obras de Legado** (10–16 + pré-requisito; uma por cidade, única no mundo), exemplos: Arquivo dos Horizontes 6 Pedra 4 Madeira 3 Conhecimento (Academia) · Casa dos Acordos 5 Pedra 3 Riqueza 3 Influência (Chancelaria) · Entreposto das Marés 5 Madeira 4 Pedra 4 Riqueza (Entreposto + Mercante) · Monumento das Vozes 6 Pedra 2 Madeira 4 Cultura (Teatro) · Cidadela da Vigília 8 Pedra 4 Metal 2 Riqueza (Fortaleza) · Estrada das Comunidades 6 Madeira 6 Pedra 2 Riqueza (3 cidades ligadas). Cada Obra: +4 Prestígio e um efeito único permanente.

**Cartas:** Manobras 0–3 recursos; Reações 0–1; Líder sem custo (passiva) e poder 1×/Era sem custo; Ambições sem custo.

**Teia:** patamar I 2 Conhecimento · II 3 Conhecimento · III 4 Conhecimento · IV 5 Conhecimento · V 6 Conhecimento · VI 7 Conhecimento · VII 8 Conhecimento. Convergências: custo do patamar +2 Conhecimento. Herança: tabela do §13.

## 12. Teia Civilizacional (40 avanços + 10 Convergências = 50)

Cinco domínios, 40 avanços em **cadeias com pré-requisito real**; 10 **Convergências** exigem avanços de dois ou três domínios. Cada patamar abre na passagem para a Era correspondente. **Todo avanço desbloqueia algo** da lista: nível de cidade, distrito, edifício, fortificação, unidade, modernização, navio, rota, governo, exploração, armazém, logística. Sem Prestígio automático; Prestígio só nos marcos (★).

Três pares são **escolhas OU** (exclusivas): escolher um fecha o outro para a partida.

**Saber (Conhecimento) — 8**
| Era | Avanço | Pré | Desbloqueia |
|---|---|---|---|
| I | Escrita | — | Acadêmico, Biblioteca, Arquivo |
| II | Matemática | Escrita | Elevar N3 custa −1 Pedra; Explorador alcance 2 |
| III | Filosofia Natural | Matemática | Academia; 1º avanço de cada domínio por Era −1 Conhecimento |
| IV | Método Experimental | Filosofia Natural | Observatório; prévia de perigo/costa antes de explorar |
| V | Laboratório | Método Experimental | Cerco +1 Brecha; abre Balística e Agronomia |
| VI | Síntese | Laboratório | limite Conhecimento +3; Obra Arquivo dos Horizontes |
| VI | Educação Pública | Síntese + Códigos | Erudito rende +1 por par sem exigir Biblioteca |
| VII | Comunidade de Descoberta ★ | Educação Pública | +3 Prestígio; Hegemonia Científica elegível |

**Terra e Mar (Alimento, exploração) — 8**
| I | Agricultura | — | Fazenda, Agrário, Celeiro, Elevar N2 |
| I | Navegação Costeira | — | Marítimo, Embarcação Costeira, Pesqueiro |
| II | Irrigação | Agricultura | Irrigação (+1 Alimento por Fazenda); mitiga Pulso Seca |
| II | Cartografia | Navegação Costeira | Mercante, Galera; Explorador em navio revela costa a 2 |
| III | Arquitetura Naval | Cartografia | Galera de Guerra, Nau de Transporte, Estaleiro |
| IV | Rotação de Culturas | Irrigação | +1 Alimento por Fazenda; Moinho dobra |
| IV | Navegação Oceânica | Arquitetura Naval + Matemática | Carraca; travessia de oceano; Farol |
| VI | Agronomia | Rotação + Laboratório | +1 Alimento por Fazenda; Crescer custa 2 em toda cidade com Celeiro |

**Pedra e Metal (construção, guerra) — 9**
| I | Alvenaria | — | Industrial, Muralha de Pedra, Armazém, Elevar N3 |
| I | Formações de Guarda | — | Militar, Quartel, Guarda |
| II | Metalurgia | Alvenaria | Mina, Oficina, Atiradores |
| II | Treino de Manobras | Formações | Cavalaria; Exército 7 |
| III | Engenharia | Metalurgia | Cerco, Estrada dupla, Elevar N4 |
| III | Fortificação | Engenharia + Formações | Fortaleza; reparo via Governar custa 0 |
| IV | Ferro | Metalurgia | Fundição; Infantaria +1 Força (modernização) |
| V | Pólvora | Ferro + Laboratório | Arcabuzeiros; Baluarte |
| VI | Artilharia | Pólvora | Artilharia; cerco ignora Paliçada |

**Governo (Influência, Cultura) — 8**
| I | Narrativas Comuns | — | Cultural, Templo; Cultura +1 por Templo |
| II | Códigos | Narrativas + Escrita | Administrativo, Chancelaria; Enviado integra +10 |
| III | Urbanismo | Códigos + Alvenaria | Elevar N5; Tribunal |
| III | **Centralização OU Federalização** | Códigos | Centralização: Monarquia/Autocracia; capital +1 Capacidade. Federalização: Confederação/República; vagas +1 em cidades N3+ |
| IV | Escolas de Expressão | Narrativas + Códigos | Teatro; Governar com Cultura recupera 2 níveis |
| V | Saneamento | Urbanismo + Filosofia Natural | Elevar N6; fome não tira habitante na primeira rodada |
| VI | Pacto de Continuidade | Saneamento | Ânimo nunca cai abaixo de Abalada por guerra |
| VII | Conselho de Civilizações ★ | Pacto | +3 Prestígio; Hegemonia Política elegível |

**Troca (Riqueza) — 7**
| I | Troca | — | Comercial, Mercado; conversão de excedente |
| II | Moeda | Troca | Tesouro; rotas +1 Riqueza |
| III | Mercado Regional | Moeda | contratos Promessa/Empréstimo; Riqueza cobre 60% em Construir |
| IV | Logística | Mercado Regional + Engenharia | Depósito; suprimento +1; Nau de Transporte carrega 3 |
| V | Banco | Mercado Regional | Banco; crédito 1×/Era (adiantar 5 Riqueza, devolver 6) |
| VI | **Autossuficiência OU Economia Comercial** | Banco | Autossuficiência: Produzir +1 em cada distrito produtivo, rotas −1. Economia Comercial: rotas +2 Riqueza, Mercador rende por 1 |
| VII | Economia Interdependente ★ | escolha VI | +3 Prestígio; Hegemonia Econômica elegível |

**Convergências (10)** — exigem avanços de 2–3 domínios; custo do patamar +2 Conhecimento.

| Era | Convergência | Exige | Desbloqueia |
|---|---|---|---|
| III | Academias Cívicas | Filosofia Natural + Códigos | Academia custa −1 Pedra; Meritocracia; Erudito rende Influência 1×/Era |
| III | Rotas Costeiras | Cartografia + Moeda | rota marítima (porto a porto) rende +2 |
| IV | Manufaturas Técnicas | Ferro + Mercado Regional | Manufatura; Artesão rende por 1 com Oficina |
| IV | **Defesa Profunda OU Guerra de Movimento** | Fortificação + Logística | Defesa Profunda: Cidadela; guarnição +2. Guerra de Movimento: Exército 8; Cavalaria move 3 |
| V | Metrópoles do Mundo | Urbanismo + Logística + Banco | Elevar N7 |
| V | Balística | Pólvora + Método Experimental | Fragata; Artilharia +1 Brecha |
| V | Patrimônio Compartilhado | Escolas de Expressão + Moeda | presença Enraizada rende 1 Cultura/Era; Monumento |
| VI | Renascimento | Síntese + Escolas de Expressão + Banco | Obra Monumento das Vozes; Teatro +5 Cultura de limite extra |
| VI | Doutrina Naval | Navegação Oceânica + Artilharia | Fragata +1 Força; bloqueio com 1 navio |
| VII | Estratégia de Contenção ★ | Artilharia + escolha Defesa/Movimento | +3 Prestígio; Hegemonia Militar elegível |

Memória do Mundo ★ (Hegemonia Cultural) é o efeito de Renascimento + Pacto de Continuidade juntos: quem tem os dois ganha +3 Prestígio e fica elegível, sem nó extra. Contagem final: 8 + 8 + 9 + 8 + 7 = 40 avanços de domínio + 10 Convergências = 50 universais; 3 escolhas OU.

Na UI, o Livro mostra só o patamar atual e o próximo; linhas iluminam o alcançável; as Convergências aparecem entre as colunas que ligam; a Herança da civilização aparece ligada ao avanço que a abre (§13).

## 13. Avanços de Herança (18 civilizações × 3 = 54, fora dos 50)

Cada civilização tem 3 Heranças. Cada uma depende de um avanço universal, tem Era mínima, custa Conhecimento (+1 recurso temático) e é opcional. Visualmente, aparece na Teia como um ramo lateral saindo do avanço que a exige, na cor da civilização.

Custo por Era mínima: I–II 3 Conhecimento · III–IV 5 Conhecimento · V–VI 7 Conhecimento (+1 recurso temático).

**Valgard** (guardas das passagens)
| Herança | Pré (Teia) | Era | Custo | Efeito |
|---|---|---|---|---|
| Passos Guardados | Formações de Guarda | II | 3 Conhecimento 1 Pedra | Guardas em cidade fortificada +1 na defesa |
| Refúgios de Montanha | Fortificação | III | 5 Conhecimento 1 Pedra | Fortaleza em Colina/Montanha custa −2 Pedra; Paliçada grátis ao fundar em Colina |
| Muralha Viva | Defesa Profunda | VI | 7 Conhecimento 2 Metal | cidades sitiadas não perdem Ânimo; reparo custa 0 |

**Thalos** (cartógrafos das costas)
| Cartas das Marés | Navegação Costeira | I | 3 Conhecimento 1 Riqueza | Explorador em Embarcação Costeira revela Região costeira a distância 2 |
| Infantaria Naval | Arquitetura Naval | III | 5 Conhecimento 1 Metal | Infantaria desembarca sem penalidade anfíbia |
| Rede de Faróis | Navegação Oceânica | IV | 5 Conhecimento 1 Pedra | Farol custa −2; portos dão visão 2 no mar; bloqueio contra Thalos exige 2 navios |

Thalos e as demais civilizações do roster canônico (18, DEC-011) seguem o mesmo molde (uma Herança cedo, uma média, uma tardia; cada uma pendurada num avanço de domínio diferente). Qualquer civilização pode ignorar sua Herança e investir só na Teia.

## 14. Modelo de civilização

| Campo | O que é | Exemplo Valgard |
|---|---|---|
| Inclinação | domínio em que o 1º avanço de cada Era custa −1 Conhecimento | Pedra e Metal |
| Traço passivo | regra permanente pequena | Guarnição +1 em Colina/Montanha |
| Componente assinatura | 1 unidade, edifício ou melhoria própria | Guarda de Escudos (Guarda com Força +1 em defesa) |
| Limitação | um custo real | Marítimo custa +1 Pedra; Elevar N6+ exige Fortaleza |
| 3 Heranças | §13 | Passos Guardados, Refúgios de Montanha, Muralha Viva |
| Identidade | nome, cor própria (≠ cor do assento, UXDEC-019), selo, crônica curta | — |

A habilidade 1×/Era da civilização (Bíblia) **sai**: o único poder 1×/Era é o do Líder (§15). Assim nunca há dois gatilhos "uma vez por Era" competindo.

## 15. Líderes

2 por civilização; escolhe 1 na preparação. Só: nome, título, crônica curta, passiva, poder 1×/Era, afinidade. Exemplo Valgard: **Toren Hjalvar, Senhor das Passagens** (passiva: peças em território próprio sempre supridas; poder: Muralha Viva, +2 Força nos conflitos da rodada; afinidade Pedra e Metal) · **Ysolde Varn, Guardiã dos Refúgios** (passiva: Governar em cidade fortificada recupera +1 Ânimo; poder: Portões Abertos, uma cidade Revolta volta a Abalada; afinidade Governo).

## 16. Governos (7)

Mesmo orçamento de poder: cada governo tem 2 vantagens e 1 limitação, todas escritas em Ânimo, Administração, economia, pesquisa, guerra, diplomacia, Ordens ou custos. Nenhuma usa Estabilidade/Coesão. Trocar: **Ordem Influência** + Influência (4 na Era I–III, 6 depois) + avanço exigido; a capital fica Abalada por 1 rodada. Todos começam em Conselho (forma inicial, fora dos 7).

| Governo | Abre com | Vantagens | Limitação |
|---|---|---|---|
| Conselho (inicial) | — | Governar custa 1 a menos; Capacidade Administrativa +1 | máx. 1 segunda ativação por rodada |
| Monarquia | Centralização | capital +1 Capacidade; Recrutar na capital ignora Capacidade | mudar de capital custa 2 Ordens |
| República | Federalização | Ambições: máx. 2 pontuadas por Era; +1 Manobra na mão | declarar guerra custa 1 Influência extra e 1 Ordem Influência |
| Oligarquia | Moeda | rotas +1 Riqueza; Riqueza cobre 60% em qualquer custo material | cidades com Ânimo Abalada não geram Riqueza |
| Teocracia | Escolas de Expressão | Templo recupera Ânimo 1×/rodada sem Ordem; Cultura +1 por cidade com Templo | Saber: 1º avanço de cada Era custa +1 Conhecimento |
| Confederação | Federalização | Capacidade Administrativa +2; fundar custa −1 Madeira | Capacidade da capital nunca passa de 3 |
| Meritocracia | Academias Cívicas | Erudito rende por 1; Governar +1 Conhecimento | Recrutar ≤ 1 peça por ativação |
| Autocracia | Centralização + Fortificação | Exército máx. +1; peças próprias sempre supridas a 1 hex de estrada | cada cidade conquistada começa com Integração 0 e Ânimo Revolta |

## 17. Cartas

| Família | Regra |
|---|---|
| Líderes | persistentes, 1 por jogador |
| Manobras | mão máx. 5, começa com 3, +1 por Era; tags Ação / Tática / Reação; 1 proativa + 1 Reação por rodada; não substituem Ordens salvo texto explícito |
| Ambições | 3 → escolhe 2; máx. 2 ativas; 2/3/4 Prestígio; máx. 1 pontuada por Era; troca 1 não concluída na passagem de Era |
| Pulso do Mundo | 1 obrigatório no início de cada Era + Pressão |
| Encontros | gerados pela exploração; escolha com 2 opções |
| Obras de Legado | projetos únicos, fora da mão |

## 18. Pressão, Pulso e Teia

- **Pressão decide QUANDO.** Começa em 0 na partida e **não zera na Virada de Era**: o Pulso obrigatório da Virada não toca a Pressão; o valor restante atravessa a mudança de Era. Soma: fundação de cidade +1 · declaração de guerra +2 · captura de cidade +2 · Elevar a N5+ +1 · Convergência +1 · Obra concluída +2 · Encontro extraordinário +1. **Limiar = 4 + 2 × jogadores** (2j = 8, 4j = 12, 6j = 16). Ao atingir o limiar: Pulso adicional imediato e só então Pressão volta a 0. Esperado: 1 Pulso extra a cada 2–3 rodadas em mesa ativa, nunca toda rodada.
- **Pulso decide O QUÊ.** A carta é condicional: diz a quem se aplica e oferece escolha. Exemplos: **Seca Regional** (cidades sem Irrigação: −2 Alimento; com Irrigação: −1; com Agrário: nada) · **Colheita Farta** (cada Fazenda +1; Celeiro guarda além do limite nesta rodada) · **Epidemia** (cidades N4+ sem Saneamento: −1 habitante; com Saneamento: −1 Ânimo) · **Migração** (+1 Disponível na cidade de maior Ânimo de cada jogador; sem Alimento para o sustento, −1 Ânimo) · **Rotas Instáveis** (rotas sem Farol/Estrada rendem 0) · **Descoberta Partilhada** (quem tem Academia ganha 2 Conhecimento; os outros, 1 Conhecimento).
- **Teia e infraestrutura decidem COMO.** Todo Pulso tem uma linha "mitigado por" com um avanço ou edifício. É assim que a tecnologia protege.

## 19. Simulação (modelo matemático, 35 rodadas)

Modelo: 1 capital + colônias nas rodadas 5 e 11; cada cidade colhe Capacidade hexes (60% Fazenda, 2 Alimento cada, +1 com Irrigação/Rotação/Agronomia; os outros 2 Madeira ou Pedra); papéis a 50% Produtor, 25% Artesão/Mercador/Erudito; Elevar quando habitantes atingem o mínimo e há custo, avanço e Era; Crescer 3 Alimento; limites 15/10 (+5 por infraestrutura, até 4); recrutamento 1 peça a cada 3 rodadas; pesquisa 1 avanço a cada 2 rodadas. Scripts: `docs/product/sim/v51-sustento.py`, `docs/product/sim/v51-trajetoria.py`.

**A. Sustento vs colheita máxima por nível (todos os hexes Fazenda + Agrário):**

| Nível | Hab. | Cap. | Precisa 1/hab | Precisa 1 por 2 | Colheita máx. (Era mín.) | Saldo 1/hab | Saldo 1 por 2 |
|---|---|---|---|---|---|---|---|
| Posto | 2 | 1 | 2 | 1 | 2 | 0 | +1 |
| Aldeia | 4 | 1 | 4 | 2 | 2 | **−2** | 0 |
| Vila | 6 | 2 | 6 | 3 | 8 (Era II) | +2 | +5 |
| Cidade | 8 | 2 | 8 | 4 | 8 (Era III) | **0** | +4 |
| Grande Cidade | 11 | 3 | 11 | 6 | 15 (Era IV) | +4 | +9 |
| Metrópole | 14 | 3 | 14 | 7 | 15 (Era V) | +1 | +8 |
| Imperial | 18 | 4 | 18 | 9 | 23 (Era VI) | +5 | +14 |

1 Alimento/habitante dá saldo negativo na Aldeia e zero na Cidade mesmo no caso ótimo: trava antes de qualquer outra coisa. 1 por 2 habitantes deixa 40–60% da colheita para crescer, recrutar e campanhas.

**B. Trajetória 35 rodadas** (sustento 1 por 2, Crescer 3 Alimento):

| Rodada | Era | Cidades | Observação |
|---|---|---|---|
| 5 | I | Aldeia 4 · Posto 2 | sem fome |
| 10 | II | Aldeia 5 · Aldeia 4 | Elevar N3 espera Alvenaria/Pedra |
| 15 | III | Vila 7 · Vila 7 | Cofre cheio de Riqueza: investir em Mercado/Tesouro |
| 20 | IV | Cidade 10 · Cidade 8 | 10 avanços pesquisados |
| 25 | V | Metrópole 15 · Grande Cidade 13 | — |
| 30 | VI | Metrópole 17 · Metrópole 17 | esperam a Era VII |
| 35 | VII | Imperial 20 · Imperial 20 | 17 avanços; 0 rodadas de fome |

Elevações da capital (V5.1): N2 r2, N3 r11, N4 r18, N5 r21, N6 r24, N7 r28. Curva pedida: Eras I–II Postos/Aldeias/Vilas ✔, III–IV Vilas/Cidades/Grandes Cidades ✔, V–VI Grandes Cidades/Metrópoles ✔, VII Imperial — cedo demais na V5.1. Correção V5.1a: N7 exige Era VII (ver F). A mesma simulação com 1 Alimento/habitante não sai do Posto em 35 rodadas (12 rodadas de fome); com Crescer a 4 Alimento, nem com 1 por 2 sai do Posto (saldo do Posto é +1).

**C. Armazém vs Elevar:** todos os custos cabem no limite base (maior componente 10 ≤ 15; Conhecimento 4 ≤ 10). Sem Armazém, Elevar N6+ consome 2/3 do Cofre de Madeira e trava construção na mesma rodada: intencional.

**D. Suprimento `1 + teto(N/2)`:** Posto/Aldeia 2 hexes (defensivo); Vila/Cidade 3; Grande Cidade/Metrópole 4; Imperial 5. Numa mesa de 2 jogadores a distância típica entre capitais é 6–8 hexes: ofensiva real só a partir de N5 ou com estradas e Depósitos. Resultado desejado.

**E′. Administração, 2–6 jogadores** (`docs/product/sim/v51a-administracao.py`): cidades por mesa (2j até 7, 4j até 5, 6j até 4), uma cidade Ocupada a partir da rodada 25 em mesas de 3+. Capacidade Administrativa base 3 (2 + capital) sobe para 6 com Códigos, Urbanismo e Chancelaria. Resultado: até 3 cidades nunca há Sobre-extensão; 4–6 cidades cabem com os avanços; 2 jogadores com 7 cidades ou uma conquista em mesa de 3–4 exigem 1 distrito Administrativo; uma conquista em mesa de 3 com 6 cidades exige 2. Conquista pesa 2 até integrar: é o custo administrativo real da guerra.

**F. N7 na Era VII:** a trajetória de B refeita com Era mínima VII eleva a Imperial na rodada 31 (antes: 28), com duas cidades no modelo passivo que nada gasta em guerra ou Obras. Em mesa real, N7 compete com Hegemonia e Obras pelos mesmos recursos: raridade esperada ≤ 1 por jogador. Fica em playtest.

**G. Recrutamento por Soldados:** uma Vila (6 hab.) com 2 Soldados recruta 2 peças por ativação e fica em 4 habitantes, abaixo do mínimo da Vila: não cresce até repor. Isso dá peso real a cada recrutamento, sem baixar o nível.

## 20. O que a V5.1 recupera e o que descarta da Bíblia

**Recuperado (rebalanceado):** nível de cidade por habitantes + custo de desenvolvimento + avanço da Teia (§4); Capacidade separada de especialização, 8 distritos e vagas por nível (§5); papéis de população com "Disponível" (§6); recrutamento com Soldados (§6); cadeias e bifurcações da Teia (Escrita→Matemática→Filosofia Natural→Método Experimental→Laboratório; Navegação Costeira→Cartografia→Arquitetura Naval→Navegação Oceânica; Agricultura→Irrigação→Rotação→Agronomia; Alvenaria→Engenharia→Fortificação; Metalurgia→Ferro→Pólvora→Artilharia; Troca→Moeda→Mercado→Banco), Convergências nomeadas (Academias Cívicas, Manufaturas Técnicas, Balística, Renascimento) e escolhas OU (Centralização/Federalização, Defesa Profunda/Guerra de Movimento, Autossuficiência/Economia Comercial) (§12); Herança 3 por civ dependente de avanço universal (§13); modelo de civilização com Inclinação, Traço, Componente assinatura, Limitação (§14); infraestrutura que sobe armazém com teto (§9); suprimento por nível com manutenção fora do raio (§8); 7 governos com vantagem/limitação (§16); Pulso condicional mitigado por tecnologia (§18).

**Descartado:** barra de Estabilidade; contador de Coesão; Desenvolvimento 1–5; 7 ações urbanas independentes (as cidades usam só as 5 ações da Ordem Cidade); Pulso toda rodada; Legado Cultural 0–40 (Cultura é recurso); três rodadas obrigatórias de combate; contratos e crédito cedo demais (crédito só com Banco, Era V); Cultura/Prestígio/Legado fazendo o mesmo trabalho (Cultura = recurso, Prestígio = pontuação, Legado = Obras); habilidade 1×/Era da civilização (vai para o Líder).

## 21. Exploração

Mundo gerado por seed, oculto. Região = 7 hexes. Explorador adjacente escolhe **qual Região oculta** revelar (direção); o conteúdo é o real da seed; sem rotação. Avanços dão prévia (bioma, recurso, costa, perigo). Descoberta narrativa gera Encontro. Explorador, Pioneiro e Enviado mantêm papéis separados.

## 22. Passagem de Era

Após a 5ª rodada: efeitos de fim de Era → pontuar no máx. 1 Ambição → poder do Líder recupera → mão +1 Manobra (até 5), Reações descartadas voltam ao baralho → mudança de Governo permitida se elegível (Ordem Influência na primeira rodada da Era, custa Influência) → efeitos "por Era" → abre patamar da Teia → Pulso obrigatório (não altera a Pressão) → Era seguinte.

## 23. Hegemonia (Era VII)

| Caminho | Requisitos (3) |
|---|---|
| Militar | Força total ≥ 14 · 3 vitórias · 2 cidades capturadas ou integradas |
| Econômica | Riqueza no limite · 3 rotas internacionais · Entreposto das Marés ou 2 Tesouros |
| Científica | Comunidade de Descoberta · 3 Observatórios/Academias · 2 Heranças |
| Cultural | Memória do Mundo · presença Predominante em 3 cidades estrangeiras · Monumento das Vozes |
| Política | Conselho de Civilizações · Aliança ativa com 2 civilizações · 1 povo integrado |
| Territorial | 20 hexes · 2 cidades N5+ · Estrada das Comunidades |

Declarar (Ordem Legado) só com os 3 cumpridos; sustentar 2 rodadas completas; vitória imediata. Senão, Prestígio na rodada 35.

## 24. Prestígio (fontes)

Explorar Região +1 · fundar cidade +1 · cidade atinge N4 +1, N6 +2, N7 +3 · avanço ★ +3 · Obra +4 · Ambição 2/3/4 · vitória defensiva +1, captura +2 · integrar povo +2 · presença Predominante +1 · Pulso (escolha) +1.

## 25. Regra × decisão × UI

| Regra | Por que existe | Que decisão cria | Risco | Como a UI esconde |
|---|---|---|---|---|
| 5 Ordens | tempo escasso, não recursos infinitos | o que fazer esta rodada | contar ordens | Bandeja com 5 fichas; cada ação ocupa uma ao ser planejada |
| Elevar (hab. + custo + avanço) | crescimento é projeto, não contador | investir na capital × fundar outra | três condições | Cartão mostra as três com ✓/✗ e um botão Elevar |
| Capacidade × vagas | um multiplicador, oito especializações | que distritos esta cidade terá | tabela | número no selo; vagas como quadrados vazios no Cartão |
| Papéis de população | produção depende de gente | quem trabalha onde, antes de confirmar | micro | fichas arrastáveis no Planejamento; travadas após confirmar; padrão automático |
| Capacidade efetiva | cidade devastada opera abaixo do nível | repor gente ou aceitar | dois números | selo `N6 · 2/3`; Cartão explica em uma linha |
| Administração (carga × capacidade) | expandir e conquistar custa governo | Administrativo ou parar | fórmula | Livro·Conselho mostra `carga 5 / capacidade 6`; Sobre-extensão como aviso na Faixa |
| Sustento 1 por 2 | fome real sem contabilidade pesada | crescer ou recrutar | esquecer | Cofre mostra "−N Alimento na Manutenção" |
| Ânimo 4 estados | consequência de forçar a cidade | ativar 2× agora e pagar depois | estados | cor da praça e aviso na segunda ativação |
| Limites 15/10 + infra | sem acumular, gastar | gastar ou construir armazém | contas | Cofre atual/limite com barra; aviso só perto do teto |
| Teia 40+10 com OU | identidade por caminho | que tronco seguir; qual lado da escolha | grafo | Livro mostra só o patamar atual + próximo; Convergências entre colunas; OU como carta dupla |
| Herança paga | assimetria opcional | investir na identidade ou não | 54 nós | 3 ramos na cor da civ saindo do avanço que os abre |
| Suprimento por nível | guerra longe exige cidade grande | onde apoiar a campanha | raio | halo de suprimento ao selecionar exército; peças fora com borda tracejada |
| Pressão / Pulso condicional | mundo reage e tecnologia protege | agir e provocar Pulso | medidor extra | barra fina na Faixa; a carta de Pulso mostra "mitigado por" |
| Governos 7 | estilo com custo | trocar ou não | 8 textos | Livro·Conselho mostra só o atual e os elegíveis |
| Hegemonia 3 requisitos | corrida clara | qual caminho | 6×3 | Livro·Hegemonia mostra só os 2 caminhos mais próximos |

## 26. Números que ainda pedem playtest

1. Custo de Crescer (3 Alimento): 4 trava o Posto no modelo; 3 pode ser rápido demais com Celeiro.
2. Elevar N7 (Era VII + Saneamento + Metrópoles do Mundo + 10 Madeira): confirmar raridade (meta: ≤ 1 por jogador na rodada 35).
3. Rendimento dos papéis (1 por par) vs Capacidade: no modelo, Riqueza e Conhecimento enchem o Cofre nas Eras III–IV; talvez 1 por 3 Mercadores.
4. Sustento militar 1 por 2 peças e atrito −1 Força: testar com exércitos de 6–8.
5. Limiar de Pressão 4 + 2 × jogadores com os novos gatilhos (Elevar N5+, Convergência).
6. Pesos das escolhas OU (Centralização/Federalização etc.) e das 7 limitações de governo: orçamento igual no papel, não na mesa.
7. Alcance de suprimento 1 + teto(N/2) em mapas de 4–6 jogadores (distâncias menores).
8. Custo das Convergências (+2 Conhecimento) vs ritmo de 1 avanço a cada 2 rodadas.
9. Capacidade Administrativa base 2 + capital 1: se mesas de 2 expandirem além de 7 cidades, a fórmula pode precisar de +1 por Era.
10. Governar com alcance = Capacidade: testar se recuperar vários níveis de Ânimo numa ativação banaliza o Ânimo.

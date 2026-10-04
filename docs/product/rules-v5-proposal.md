# Ages of Hegemony — Regras V5.1 (proposta para aprovação)

Data: 2026-10-04. **Proposta.** Nada implementado no engine. Tudo aqui é conteúdo original de AoH; referências externas valem só como princípio de design (ordens limitadas, um mundo que reage, eras que escalam).

A V5.1 reconcilia a V5 com o documento antigo ("Ages of Hegemony.html", a Bíblia) e o canvas. A direção da V5 fica: 7 Eras, 5 rodadas por Era, 5 Ordens, 8 recursos, limites 15/10, Ânimo como estado social principal, 18 civilizações, Líderes, Manobras, Ambições, Pulso/Pressão, Encontros, Hegemonia na Era VII, UX V2.2. O que a V5.1 recupera da Bíblia e o que descarta está no §20.

A proposta visual está em [`experience-v2/concepts/v5-proposal.html`](experience-v2/concepts/v5-proposal.html) (16 pranchas) e no artifact publicado.

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
| **Influência** | tratado · oferta comercial · rota · missão cultural · ação com povo independente · integração política | um Enviado, cidade ou civilização |
| **Legado** | iniciar/avançar Obra de Legado · empreendimento excepcional (declarar Hegemonia, grande migração, reforma de governo) | uma cidade ou a civilização |

**Ações livres** (sem Ordem): responder a propostas, jogar 1 Manobra proativa e 1 Reação por rodada, escolher no Pulso, ajustar postura defensiva, usar o poder do Líder, **redistribuir a população de uma cidade** (uma vez por rodada por cidade), cancelar uma Ordem antes de confirmar.

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

Excedente é perdido no fim da fase de Manutenção, salvo conversão permitida por regra (Mercado: até 3 de material excedente → 1 Riqueza). O Cofre mostra sempre `atual / limite`. Infraestrutura que sobe limites: §9.

## 4. Cidade: a escada e como se sobe

| Nível | Nome | Habitantes (mín.) | Capacidade | Vagas de distrito | Alcance de suprimento | Guarnição | Peso admin. |
|---|---|---|---|---|---|---|---|
| 1 | Posto | 2 | 1 | 1 | 2 | 4 | 1 |
| 2 | Aldeia | 4 | 1 | 1 | 2 | 4 | 1 |
| 3 | Vila | 6 | 2 | 2 | 3 | 5 | 1 |
| 4 | Cidade | 8 | 2 | 3 | 3 | 6 | 1 |
| 5 | Grande Cidade | 11 | 3 | 4 | 4 | 7 | 0 |
| 6 | Metrópole | 14 | 3 | 5 | 4 | 8 | 0 |
| 7 | Metrópole Imperial | 18 | 4 | 6 | 5 | 10 | 0 |

Habitantes máximos por nível: o mínimo do nível seguinte − 1 (Imperial: 20). A cidade cresce até o teto e para; só volta a crescer depois de Elevar.

**Elevar** (ação da Ordem Cidade). A cidade sobe um nível quando cumpre as três condições:

| Para | Habitantes | Custo de desenvolvimento | Avanço exigido (Teia) | Era mín. |
|---|---|---|---|---|
| N2 Aldeia | 4 | 3 Madeira | Agricultura | I |
| N3 Vila | 6 | 4 Madeira 2 Pedra | Alvenaria | II |
| N4 Cidade | 8 | 5 Madeira 3 Pedra 2 Riqueza | Engenharia | III |
| N5 Grande Cidade | 11 | 6 Madeira 5 Pedra 3 Riqueza 2 Conhecimento | Urbanismo | IV |
| N6 Metrópole | 14 | 8 Madeira 6 Pedra 5 Riqueza 3 Conhecimento | Saneamento | V |
| N7 Imperial | 18 | 10 Madeira 8 Pedra 8 Riqueza 4 Conhecimento | Convergência Metrópoles do Mundo | VI |

Os custos vêm da Bíblia (N2 4A/3Md … N7 12/12/6/12/4) rebalanceados para caber no Cofre: nenhum componente passa de 10 (cap base 15), e Alimento sai do custo porque já foi gasto no crescimento. Desenvolvimento 1–5 é eliminado. O Nível substitui tudo o que ele fazia: Capacidade, vagas, alcance de suprimento e de produção, armazém (§9), guarnição e peso administrativo.

**Capacidade** é quantos hexes a cidade trabalha além do centro, e nada mais. Não é especialização: a especialização vem dos distritos (§5) e da distribuição da população (§6).
- **Produzir:** colhe centro + Capacidade hexes trabalhados.
- **Recrutar:** peças por ativação ≤ Capacidade, e ≤ Soldados disponíveis (§6).
- **Construir:** 1 construção por ativação; nível ≥ 3 pode construir e produzir na mesma ativação se Capacidade ≥ 2 (gasta 2 pontos).
- **Administração:** cada cidade N1–N4 pesa 1; a soma de Capacidade das cidades ≥ soma dos pesos, senão Sobre-extensão (−1 Ânimo em todas no fim da Era). Cidades N5+ pesam 0 (a Bíblia dava +influência por nível; aqui o nível paga a própria administração).

**Raio de reivindicação:** 1 nos níveis 1–2, 2 nos 3–5, 3 nos 6–7.

## 5. Distritos (8) e vagas

Oito distritos: **Agrário, Comercial, Acadêmico, Administrativo, Militar, Industrial, Cultural, Marítimo** (Marítimo exige costa). Cada um ocupa 1 vaga e habilita edifícios da própria família. As vagas crescem com o nível (1/1/2/3/4/5/6): nenhuma cidade constrói tudo; a Imperial escolhe 6 de 8.

| Distrito | Efeito base | Edifícios da família | Avanço que abre |
|---|---|---|---|
| Agrário | +2 Alimento por Produzir | Celeiro, Moinho, Irrigação (melhoria) | Agricultura |
| Comercial | +1 Riqueza por Produzir; rota a partir desta cidade | Mercado, Tesouro, Banco | Troca |
| Acadêmico | +1 Conhecimento por Produzir | Biblioteca, Academia, Observatório, Arquivo | Escrita |
| Administrativo | peso admin. da cidade = 0; Governar +1 | Chancelaria, Tribunal | Códigos |
| Militar | Recrutar sem limite de Capacidade (ainda ≤ Soldados); guarnição +1 | Quartel, Arsenal, Fortaleza+ | Formações |
| Industrial | +1 Madeira e +1 Pedra por Produzir | Oficina, Fundição, Manufatura | Metalurgia |
| Cultural | +1 Cultura por Produzir | Templo, Teatro, Monumento | Narrativas |
| Marítimo | Porto incluído; navios; pesca +1 Alimento | Estaleiro, Farol, Entreposto | Navegação Costeira |

Fortificações não ocupam vaga (camada própria, UXDEC-017).

## 6. População: papéis

Cada habitante tem um papel. A redistribuição é ação livre (1×/rodada/cidade) e a UI é uma linha de fichas arrastáveis no Cartão da cidade.

| Papel | Rende por Produzir | Observação |
|---|---|---|
| Produtor | trabalha 1 hex (até a Capacidade); a cada 2 Produtores sem hex, +1 Alimento | base da colheita |
| Artesão | a cada 2, +1 Madeira ou +1 Pedra (escolha) | exige Oficina para o 3º+ par |
| Mercador | a cada 2, +1 Riqueza | exige Mercado para o 3º+ par |
| Erudito | a cada 2, +1 Conhecimento | exige Biblioteca para o 3º+ par |
| Soldado | nada | é quem Recrutar converte em peça; peça desfeita volta como Soldado |
| Disponível | nada | recém-chegado; substitui "Não Alocado" |

**Recrutar** gasta 1 Soldado por peça terrestre (navios não gastam). A cidade perde o habitante; se cair abaixo do mínimo do nível, não desce de nível, mas não Eleva nem cresce até repor. Peça militar dissolvida em cidade própria devolve 1 habitante Disponível.

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

**Peças** (Alimento/Madeira/Pedra/Metal/Riqueza; Era mínima; terrestres gastam 1 Soldado)

| Peça | Custo | Total | Era | Avanço |
|---|---|---|---|---|
| Explorador | 1A 1R | 2 | I | — |
| Pioneiro | 2A 1Md | 3 | I | — |
| Enviado | 1R 1Inf | 2 | I | — |
| Infantaria | 1A 2Md | 3 | I | — |
| Guarda | 1A 2P | 3 | I | Formações |
| Atiradores | 1A 1Md 1Mt | 3 | II | Metalurgia |
| Cavalaria | 2A 1Md 1Mt 1R | 5 | II | Treino de Manobras |
| Cerco | 2Md 1P 2Mt 1R | 6 | III | Engenharia |
| Arcabuzeiros | 1A 1Md 2Mt | 4 | V | Pólvora |
| Artilharia | 2Md 1P 3Mt 1R | 7 | VI | Artilharia |
| Embarcação Costeira | 2Md 1R | 3 | I | Navegação Costeira |
| Mercante | 2Md 2R | 4 | II | Cartografia |
| Galera | 3Md 1Mt 1R | 5 | II | Cartografia |
| Galera de Guerra | 3Md 2Mt 1R | 6 | III | Arquitetura Naval |
| Nau de Transporte | 4Md 1Mt 2R | 7 | III | Arquitetura Naval |
| Carraca | 4Md 2Mt 1R | 7 | IV | Navegação Oceânica |
| Fragata | 3Md 3Mt 1R | 7 | V | Balística |

Manutenção: 1 Alimento por 2 peças militares; navios 1 Riqueza; civis nada.

**Melhorias:** Fazenda 1Md · Serraria 1Md · Pedreira 2Md · Mina 2Md 1R (Metalurgia) · Pesqueiro 1Md 1R · Estrada 1Md 1P · Irrigação 2Md 1P (Irrigação, Era II) · Depósito 2Md 1P (Logística).

**Distritos:** todos 3Md 1P; exigem o avanço da tabela do §5.

**Edifícios básicos** (3–5): Celeiro 2Md 1P · Moinho 2Md 1P · Mercado 2Md 2R · Biblioteca 2Md 1P 1C · Quartel 2Md 2P · Oficina 2Md 1P 1Mt · Templo 2P 1Cu · Porto (incluído no Marítimo) · Armazém 3Md 1P.

**Edifícios avançados** (4–7): Academia 3P 2C · Arquivo 2Md 2P 1C · Tesouro 2P 3R · Banco 3P 3R 1C · Fundição 3P 2Mt · Arsenal 2P 3Mt · Manufatura 3Md 3P 1Mt · Teatro 3P 2Cu · Monumento 4P 2Cu · Chancelaria 2P 2R 2Inf · Tribunal 3P 1R 2Inf · Estaleiro 4Md 2Mt · Farol 3P 1Md 1R · Observatório 3P 3C · Entreposto 4Md 2P 3R.

**Fortificações** (camada própria): Paliçada 3Md · Muralha de Pedra 4P 1Md (Alvenaria) · Fortaleza 5P 2Mt (Fortificação, Era III) · Baluarte 6P 2Mt 1R (Pólvora, Era V) · Cidadela 7P 3Mt 2R (Defesa Profunda, Era IV+). Reparo: 1 passo de Integridade por 1 Pedra, via Governar.

**Obras de Legado** (10–16 + pré-requisito; uma por cidade, única no mundo), exemplos: Arquivo dos Horizontes 6P 4Md 3C (Academia) · Casa dos Acordos 5P 3R 3Inf (Chancelaria) · Entreposto das Marés 5Md 4P 4R (Entreposto + Mercante) · Monumento das Vozes 6P 2Md 4Cu (Teatro) · Cidadela da Vigília 8P 4Mt 2R (Fortaleza) · Estrada das Comunidades 6Md 6P 2R (3 cidades ligadas). Cada Obra: +4 Prestígio e um efeito único permanente.

**Cartas:** Manobras 0–3 recursos; Reações 0–1; Líder sem custo (passiva) e poder 1×/Era sem custo; Ambições sem custo.

**Teia:** patamar I 2C · II 3C · III 4C · IV 5C · V 6C · VI 7C · VII 8C. Convergências: custo do patamar +2C. Herança: tabela do §13.

## 12. Teia Civilizacional (40 avanços + 10 Convergências = 50)

Cinco domínios, 40 avanços em **cadeias com pré-requisito real**; 10 **Convergências** exigem avanços de dois ou três domínios. Cada patamar abre na passagem para a Era correspondente. **Todo avanço desbloqueia algo** da lista: nível de cidade, distrito, edifício, fortificação, unidade, modernização, navio, rota, governo, exploração, armazém, logística. Sem Prestígio automático; Prestígio só nos marcos (★).

Três pares são **escolhas OU** (exclusivas): escolher um fecha o outro para a partida.

**Saber (Conhecimento) — 8**
| Era | Avanço | Pré | Desbloqueia |
|---|---|---|---|
| I | Escrita | — | Acadêmico, Biblioteca, Arquivo |
| II | Matemática | Escrita | Elevar N3 custa −1 Pedra; Explorador alcance 2 |
| III | Filosofia Natural | Matemática | Academia; 1º avanço de cada domínio por Era −1C |
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

**Convergências (10)** — exigem avanços de 2–3 domínios; custo do patamar +2C.

| Era | Convergência | Exige | Desbloqueia |
|---|---|---|---|
| III | Academias Cívicas | Filosofia Natural + Códigos | Academia custa −1P; Meritocracia; Erudito rende Influência 1×/Era |
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

Custo por Era mínima: I–II 3C · III–IV 5C · V–VI 7C (+1 recurso temático).

**Valgard** (guardas das passagens)
| Herança | Pré (Teia) | Era | Custo | Efeito |
|---|---|---|---|---|
| Passos Guardados | Formações de Guarda | II | 3C 1P | Guardas em cidade fortificada +1 na defesa |
| Refúgios de Montanha | Fortificação | III | 5C 1P | Fortaleza em Colina/Montanha custa −2 Pedra; Paliçada grátis ao fundar em Colina |
| Muralha Viva | Defesa Profunda | VI | 7C 2Mt | cidades sitiadas não perdem Ânimo; reparo custa 0 |

**Thalos** (cartógrafos das costas)
| Cartas das Marés | Navegação Costeira | I | 3C 1R | Explorador em Embarcação Costeira revela Região costeira a distância 2 |
| Infantaria Naval | Arquitetura Naval | III | 5C 1Mt | Infantaria desembarca sem penalidade anfíbia |
| Rede de Faróis | Navegação Oceânica | IV | 5C 1P | Farol custa −2; portos dão visão 2 no mar; bloqueio contra Thalos exige 2 navios |

**Ashkar** (senhores das caravanas)
| Caravanas do Deserto | Troca | I | 3C 1R | rota terrestre atravessa Deserto sem Estrada |
| Entrepostos de Oásis | Mercado Regional | III | 5C 1R | Comercial em Deserto rende +1 Riqueza e +1 Alimento |
| Casa das Balanças | Banco | V | 7C 2R | crédito 2×/Era; Riqueza cobre 75% em Construir |

As outras 15 seguem o mesmo molde (uma Herança cedo, uma média, uma tardia; cada uma pendurada num avanço de domínio diferente). Qualquer civilização pode ignorar sua Herança e investir só na Teia.

## 14. Modelo de civilização

| Campo | O que é | Exemplo Valgard |
|---|---|---|
| Inclinação | domínio em que o 1º avanço de cada Era custa −1C | Pedra e Metal |
| Traço passivo | regra permanente pequena | Guarnição +1 em Colina/Montanha |
| Componente assinatura | 1 unidade, edifício ou melhoria própria | Guarda de Escudos (Guarda com Força +1 em defesa) |
| Limitação | um custo real | Marítimo custa +1 Pedra; Elevar N6+ exige Fortaleza |
| 3 Heranças | §13 | Passos Guardados, Refúgios de Montanha, Muralha Viva |
| Identidade | nome, cor própria (≠ cor do assento, UXDEC-019), selo, crônica curta | — |

A habilidade 1×/Era da civilização (Bíblia) **sai**: o único poder 1×/Era é o do Líder (§15). Assim nunca há dois gatilhos "uma vez por Era" competindo.

## 15. Líderes

2 por civilização; escolhe 1 na preparação. Só: nome, título, crônica curta, passiva, poder 1×/Era, afinidade. Exemplo Valgard: **Toren Hjalvar, Senhor das Passagens** (passiva: peças em território próprio sempre supridas; poder: Muralha Viva, +2 Força nos conflitos da rodada; afinidade Pedra e Metal) · **Ysolde Varn, Guardiã dos Refúgios** (passiva: Governar em cidade fortificada recupera +1 Ânimo; poder: Portões Abertos, uma cidade Revolta volta a Abalada; afinidade Governo).

## 16. Governos (7)

Mesmo orçamento de poder: cada governo tem 2 vantagens e 1 limitação, todas escritas em Ânimo, Administração, economia, pesquisa, guerra, diplomacia, Ordens ou custos. Nenhuma usa Estabilidade/Coesão. Trocar: Ordem Legado + Influência (4 na Era I–III, 6 depois) + avanço exigido; a capital fica Abalada por 1 rodada. Todos começam em Conselho (forma inicial, fora dos 7).

| Governo | Abre com | Vantagens | Limitação |
|---|---|---|---|
| Conselho (inicial) | — | Governar custa 1 a menos; Sobre-extensão só a partir de 3 cidades | máx. 1 segunda ativação por rodada |
| Monarquia | Centralização | capital +1 Capacidade; Recrutar na capital ignora Capacidade | mudar de capital custa 2 Ordens |
| República | Federalização | Ambições: máx. 2 pontuadas por Era; +1 Manobra na mão | declarar guerra custa 1 Influência extra e 1 Ordem Influência |
| Oligarquia | Moeda | rotas +1 Riqueza; Riqueza cobre 60% em qualquer custo material | cidades com Ânimo Abalada não geram Riqueza |
| Teocracia | Escolas de Expressão | Templo recupera Ânimo 1×/rodada sem Ordem; Cultura +1 por cidade com Templo | Saber: 1º avanço de cada Era custa +1C |
| Confederação | Federalização | cidades N1–N4 pesam 0; fundar custa −1 Madeira | Capacidade da capital nunca passa de 3 |
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

- **Pressão decide QUANDO.** Começa em 0 a cada Era. Soma: fundação de cidade +1 · declaração de guerra +2 · captura de cidade +2 · Elevar a N5+ +1 · Convergência +1 · Obra concluída +2 · Encontro extraordinário +1. **Limiar = 4 + 2 × jogadores** (2j = 8, 4j = 12, 6j = 16). Ao atingir: Pulso adicional imediato, Pressão volta a 0. Esperado: 1 Pulso extra a cada 2–3 rodadas em mesa ativa, nunca toda rodada.
- **Pulso decide O QUÊ.** A carta é condicional: diz a quem se aplica e oferece escolha. Exemplos: **Seca Regional** (cidades sem Irrigação: −2 Alimento; com Irrigação: −1; com Agrário: nada) · **Colheita Farta** (cada Fazenda +1; Celeiro guarda além do limite nesta rodada) · **Epidemia** (cidades N4+ sem Saneamento: −1 habitante; com Saneamento: −1 Ânimo) · **Migração** (+1 Disponível na cidade de maior Ânimo de cada jogador; sem Alimento para o sustento, −1 Ânimo) · **Rotas Instáveis** (rotas sem Farol/Estrada rendem 0) · **Descoberta Partilhada** (quem tem Academia ganha 2C; os outros, 1C).
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
| 30 | VI | Imperial · Imperial | ambas no teto 20 |
| 35 | VII | Imperial · Imperial | 17 avanços; 0 rodadas de fome |

Elevações da capital: N2 r2, N3 r11, N4 r18, N5 r21, N6 r24, N7 r28. Curva pedida: Eras I–II Postos/Aldeias/Vilas ✔, III–IV Vilas/Cidades/Grandes Cidades ✔, V–VI Grandes Cidades/Metrópoles ✔, VII Imperial — **cedo demais e demais**: duas Imperiais na rodada 30 com um plano passivo. Correção adotada: Elevar N7 exige a Convergência Metrópoles do Mundo (Era V, três domínios) e 10 Madeira. A mesma simulação com 1 Alimento/habitante não sai do Posto em 35 rodadas (12 rodadas de fome); com Crescer a 4 Alimento, nem com 1 por 2 sai do Posto (saldo do Posto é +1).

**C. Armazém vs Elevar:** todos os custos cabem no limite base (maior componente 10 ≤ 15; Conhecimento 4 ≤ 10). Sem Armazém, Elevar N6+ consome 2/3 do Cofre de Madeira e trava construção na mesma rodada: intencional.

**D. Suprimento `1 + teto(N/2)`:** Posto/Aldeia 2 hexes (defensivo); Vila/Cidade 3; Grande Cidade/Metrópole 4; Imperial 5. Numa mesa de 2 jogadores a distância típica entre capitais é 6–8 hexes: ofensiva real só a partir de N5 ou com estradas e Depósitos. Resultado desejado.

**E. Recrutamento por Soldados:** uma Vila (6 hab.) com 2 Soldados recruta 2 peças por ativação e fica em 4 habitantes, abaixo do mínimo da Vila: não cresce até repor. Isso dá peso real a cada recrutamento, sem baixar o nível.

## 20. O que a V5.1 recupera e o que descarta da Bíblia

**Recuperado (rebalanceado):** nível de cidade por habitantes + custo de desenvolvimento + avanço da Teia (§4); Capacidade separada de especialização, 8 distritos e vagas por nível (§5); papéis de população com "Disponível" (§6); recrutamento com Soldados (§6); cadeias e bifurcações da Teia (Escrita→Matemática→Filosofia Natural→Método Experimental→Laboratório; Navegação Costeira→Cartografia→Arquitetura Naval→Navegação Oceânica; Agricultura→Irrigação→Rotação→Agronomia; Alvenaria→Engenharia→Fortificação; Metalurgia→Ferro→Pólvora→Artilharia; Troca→Moeda→Mercado→Banco), Convergências nomeadas (Academias Cívicas, Manufaturas Técnicas, Balística, Renascimento) e escolhas OU (Centralização/Federalização, Defesa Profunda/Guerra de Movimento, Autossuficiência/Economia Comercial) (§12); Herança 3 por civ dependente de avanço universal (§13); modelo de civilização com Inclinação, Traço, Componente assinatura, Limitação (§14); infraestrutura que sobe armazém com teto (§9); suprimento por nível com manutenção fora do raio (§8); 7 governos com vantagem/limitação (§16); Pulso condicional mitigado por tecnologia (§18).

**Descartado:** barra de Estabilidade; contador de Coesão; Desenvolvimento 1–5; 7 ações urbanas independentes (as cidades usam só as 5 ações da Ordem Cidade); Pulso toda rodada; Legado Cultural 0–40 (Cultura é recurso); três rodadas obrigatórias de combate; contratos e crédito cedo demais (crédito só com Banco, Era V); Cultura/Prestígio/Legado fazendo o mesmo trabalho (Cultura = recurso, Prestígio = pontuação, Legado = Obras); habilidade 1×/Era da civilização (vai para o Líder).

## 21. Exploração

Mundo gerado por seed, oculto. Região = 7 hexes. Explorador adjacente escolhe **qual Região oculta** revelar (direção); o conteúdo é o real da seed; sem rotação. Avanços dão prévia (bioma, recurso, costa, perigo). Descoberta narrativa gera Encontro. Explorador, Pioneiro e Enviado mantêm papéis separados.

## 22. Passagem de Era

Após a 5ª rodada: efeitos de fim de Era → pontuar no máx. 1 Ambição → poder do Líder recupera → mão +1 Manobra (até 5), Reações descartadas voltam ao baralho → mudança de Governo permitida se elegível (custa Influência) → efeitos "por Era" → abre patamar da Teia → Pulso obrigatório → Era seguinte.

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
| Papéis de população | produção depende de gente | quem trabalha onde | micro | fichas arrastáveis numa linha; padrão automático |
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
2. Elevar N7: custo e Convergência Metrópoles do Mundo foram endurecidos depois da simulação; confirmar que Imperial fica rara (meta: ≤ 1 por jogador na rodada 35).
3. Rendimento dos papéis (1 por par) vs Capacidade: no modelo, Riqueza e Conhecimento enchem o Cofre nas Eras III–IV; talvez 1 por 3 Mercadores.
4. Sustento militar 1 por 2 peças e atrito −1 Força: testar com exércitos de 6–8.
5. Limiar de Pressão 4 + 2 × jogadores com os novos gatilhos (Elevar N5+, Convergência).
6. Pesos das escolhas OU (Centralização/Federalização etc.) e das 7 limitações de governo: orçamento igual no papel, não na mesa.
7. Alcance de suprimento 1 + teto(N/2) em mapas de 4–6 jogadores (distâncias menores).
8. Custo das Convergências (+2C) vs ritmo de 1 avanço a cada 2 rodadas.

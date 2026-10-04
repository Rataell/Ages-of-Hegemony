# Ages of Hegemony — Regras V5 (proposta para aprovação)

Data: 2026-10-04. **Proposta.** Nada implementado. Tudo aqui é conteúdo original de AoH; referências externas valem só como princípio de design (ordens limitadas, um mundo que reage, eras que escalam).

A proposta visual que aplica estas regras está em [`experience-v2/concepts/v5-proposal.html`](experience-v2/concepts/v5-proposal.html) (15 pranchas) e no artifact publicado.

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

## 2. As 5 Ordens

Uma Ordem autoriza uma ação; não paga o custo. Recursos e pré-requisitos continuam obrigatórios. Tipos podem repetir.

| Ordem | Autoriza | Peça/alvo |
|---|---|---|
| **Cidade** | Produzir · Construir · Recrutar · Governar | uma cidade (ativação) |
| **Expedição** | mover · explorar · fundar · embarcar/transportar · desembarcar · atacar quando o movimento gera conflito | uma pilha ou peça |
| **Avanço** | pesquisar um avanço da Teia ou de Herança | — |
| **Influência** | tratado · oferta comercial · rota · missão cultural · ação com povo independente · integração política | um Enviado, cidade ou civilização |
| **Legado** | iniciar/avançar Obra de Legado · empreendimento excepcional (declarar Hegemonia, grande migração, reforma de governo) | uma cidade ou a civilização |

**Ações livres** (sem Ordem): responder a propostas, jogar 1 Manobra proativa e 1 Reação por rodada, escolher no Pulso, ajustar postura defensiva, usar o poder do Líder, cancelar uma Ordem antes de confirmar.

## 3. Recursos (8)

| Recurso | Função | Limite-base |
|---|---|---|
| Alimento | população, crescimento, Pioneiros, manutenção, campanhas | 15 |
| Madeira | infraestrutura leve, edifícios, navios, máquinas | 15 |
| Pedra | urbanização, fortificações, Obras | 15 |
| Riqueza | comércio, contratos; cobre até 50% de custo material; nunca Conhecimento/Influência/Cultura | 15 |
| Metal | tropas especializadas, cerco, navios militares | 10 |
| Conhecimento | Teia e Herança | 10 |
| Influência | diplomacia, Enviados, governos, integração, povos | 10 |
| Cultura | presença cultural, ações culturais, recuperação de Ânimo, cartas, Obras | 10 |

Limites sobem por infraestrutura e avanços, sempre com teto: Armazém +5 (um por cidade), Tesouro +5, Arquivo +3 Conhecimento, Chancelaria +3 Influência, Teatro +3 Cultura; nunca acima de 2× o limite-base. Excedente é perdido no fim da fase de Manutenção, salvo conversão permitida por regra (Mercado: até 3 de material excedente → 1 Riqueza). O Cofre mostra sempre `atual / limite`.

## 4. Cidade: uma escada

| Nível | Nome | Habitantes | Capacidade | Vagas de distrito | Guarnição |
|---|---|---|---|---|---|
| 1 | Posto | 2 | 1 | 1 | 4 |
| 2 | Aldeia | 4 | 1 | 1 | 4 |
| 3 | Vila | 6 | 2 | 2 | 5 |
| 4 | Cidade | 8 | 2 | 3 | 6 |
| 5 | Grande Cidade | 11 | 3 | 4 | 7 |
| 6 | Metrópole | 14 | 3 | 5 | 8 |
| 7 | Metrópole Imperial | 18 | 4 | 6 | 10 |

População determina o nível. Desenvolvimento 1–5 é eliminado; o que ele fazia passa para o Nível (raio de reivindicação = 1 nos níveis 1–2, 2 nos 3–5, 3 nos 6–7).

**Capacidade** é o único multiplicador urbano:
- **Produzir:** cada ponto de Capacidade colhe um hex trabalhado a mais além do centro (Posto colhe centro + 1).
- **Recrutar:** peças recrutadas por ativação ≤ Capacidade.
- **Construir:** 1 construção por ativação; nível ≥ 3 pode construir e produzir na mesma ativação se Capacidade ≥ 2 (gasta 2 pontos).
- **Administração:** cada cidade pesa 1; a soma de Capacidade das cidades ≥ número de cidades, senão Sobre-extensão (−1 Ânimo em todas no fim da Era).

## 5. Ânimo

Estados: **Próspera** (+1 Capacidade na primeira ativação da rodada) · **Estável** · **Abalada** (−1 Capacidade, mínimo 1; não pode segunda ativação) · **Revolta** (só Governar e recuperação; não produz).

- Uma cidade ativa no máximo 2× por rodada (duas Ordens Cidade). Após a segunda ativação, perde 1 nível de Ânimo.
- Reduzem: fome, cerco, captura, guerra prolongada (3+ rodadas em guerra: −1 por Era), falta de manutenção, Pulsos.
- Recuperam: Governar (+1, custa 1 Cultura ou 2 Riqueza), Alimento acima do consumo no fim da Era (+1), Teatro/Templo, avanços, Líder, Manobras.
- **Estabilidade e Coesão são removidas.** Estabilidade vira Ânimo. Coesão vira **Integração** (0–100) só em cidades capturadas; ao chegar a 100 a cidade é própria e entra em Abalada.

## 6. Custos propostos

**Peças** (Alimento/Madeira/Pedra/Metal/Riqueza; Era mínima)

| Peça | Custo | Total | Era |
|---|---|---|---|
| Explorador | 1A 1R | 2 | I |
| Pioneiro | 2A 1Md | 3 | I |
| Enviado | 1R 1Inf | 2 | I |
| Infantaria | 1A 2Md | 3 | I |
| Guarda | 1A 2P | 3 | I |
| Atiradores | 1A 1Md 1Mt | 3 | II |
| Cavalaria | 2A 1Md 1Mt 1R | 5 | II |
| Cerco | 2Md 1P 2Mt 1R | 6 | III |
| Embarcação Costeira | 2Md 1R | 3 | I |
| Mercante | 2Md 2R | 4 | II |
| Galera | 3Md 1Mt 1R | 5 | II |
| Galera de Guerra | 3Md 2Mt 1R | 6 | III |
| Nau de Transporte | 4Md 1Mt 2R | 7 | III |
| Carraca | 4Md 2Mt 1R | 7 | IV |
| Fragata | 3Md 3Mt 1R | 7 | V |

Manutenção: 1 Alimento por peça militar; navios 1 Riqueza; civis nada.

**Melhorias:** Fazenda 1Md · Serraria 1Md · Pedreira 2Md · Mina 2Md 1R · Pesqueiro 1Md 1R · Estrada 1Md 1P · Irrigação 2Md 1P (Era III).

**Distritos** (todos 3Md 1P; Marítimo exige costa): Agrário, Comercial, Acadêmico, Administrativo, Militar, Industrial, Cultural, Marítimo.

**Edifícios básicos** (3–5): Celeiro 2Md 1P · Mercado 2Md 2R · Biblioteca 2Md 1P 1C* · Quartel 2Md 2P · Oficina 2Md 1P 1Mt · Templo 2P 1Cu · Porto 3Md 1P · Armazém 3Md 1P. (*C = Conhecimento; Cu = Cultura.)

**Edifícios avançados** (4–7): Academia 3P 2C · Tesouro 2P 3R · Arsenal 2P 3Mt · Teatro 3P 2Cu · Chancelaria 2P 2R 2Inf · Estaleiro 4Md 2Mt · Farol 3P 1Md 1R · Observatório 3P 3C.

**Fortificações:** Paliçada 3Md · Muralha de Pedra 4P 1Md · Fortaleza 5P 2Mt (Era III) · Baluarte 6P 2Mt 1R (Era IV) · Cidadela 7P 3Mt 2R (Era V). Reparo: 1 passo de Integridade por 1 Pedra, via Governar.

**Obras de Legado** (10–16 + pré-requisito; uma por cidade, única no mundo), exemplos: Arquivo dos Horizontes 6P 4Md 3C (Academia) · Casa dos Acordos 5P 3R 3Inf (Chancelaria) · Entreposto das Marés 5Md 4P 4R (Porto + Mercante) · Monumento das Vozes 6P 2Md 4Cu (Teatro) · Cidadela da Vigília 8P 4Mt 2R (Fortaleza) · Estrada das Comunidades 6Md 6P 2R (3 cidades ligadas). Cada Obra: +4 Prestígio e um efeito único permanente.

**Cartas:** Manobras 0–3 recursos; Reações 0–1; Líder sem custo (passiva) e poder 1×/Era sem custo; Ambições sem custo.

**Teia:** Era I 2C · II 3C · III 4C · IV 5C · V 6C · VI 7C · VII 8C. Avanços especiais +1–2 recursos temáticos.

## 7. Teia Civilizacional (49 avanços: 7 patamares × 5 domínios × 1–2)

Cada patamar abre na passagem para a Era correspondente. Pré-requisitos reais: um avanço do mesmo domínio no patamar anterior, e às vezes um de outro domínio (ponte). Sem +1 Prestígio automático; Prestígio só em marcos (★).

**Conhecimento (C)**
| Era | Avanço | Pré | Custo | Efeito / desbloqueia |
|---|---|---|---|---|
| I | Registros de Sinais | — | 2C | Biblioteca; Explorador vê o bioma predominante da Região vizinha antes de explorar |
| II | Mapas de Referência | Registros | 3C | Explorador alcance 2; indício de recurso antes de explorar |
| III | Método de Comparação | Mapas | 4C | Academia; 1º avanço de cada domínio por Era −1C |
| IV | Redes de Observatórios | Método + Pesos de Troca (E) | 5C 1Md | Observatório; vê perigo/costa antes de explorar |
| V | Instrumentos de Precisão | Redes | 6C 1Mt | Fragata; Cerco +1 Brecha |
| VI | Síntese de Evidências | Instrumentos | 7C | limite de Conhecimento +3; Obra Arquivo dos Horizontes |
| VII | Comunidade de Descoberta ★ | Síntese | 8C 2Cu | +3 Prestígio; Hegemonia Científica elegível |

**Sociedade (S)**
| I | Assembleias de Bairro | — | 2C | Governar +1 Ânimo extra 1×/Era; governo Conselho |
| II | Centralização do Conselho | Assembleias | 3C | Administrativo +1 Capacidade de administração; governo Monarquia |
| III | Códigos de Acesso | Centralização | 4C 1Inf | Chancelaria; Enviado integra +10 |
| IV | Serviço por Mérito | Códigos + Método (C) | 5C | governo Meritocracia; recrutar sem distrito Militar 1 peça/Era |
| V | Representação Regional | Serviço | 6C 1Inf | cidades N5+ pesam 0 na administração |
| VI | Pacto de Continuidade | Representação | 7C | Ânimo nunca cai abaixo de Abalada por guerra |
| VII | Conselho de Civilizações ★ | Pacto | 8C 2Inf | +3 Prestígio; Hegemonia Política elegível |

**Economia (E)**
| I | Pesos de Troca | — | 2C | Mercado; conversão de excedente |
| II | Contabilidade de Rotas | Pesos | 3C | rotas +1 Riqueza; Mercante |
| III | Contratos de Produção | Contabilidade | 4C 1R | Tesouro; ofertas Promessa/Empréstimo |
| IV | Câmaras de Compensação | Contratos + Códigos (S) | 5C | limite Riqueza +5; Riqueza cobre 60% em Construir |
| V | Sistemas de Distribuição | Câmaras | 6C 1Md | Armazém +5 em todas; Irrigação em qualquer terreno |
| VI | Crédito de Infraestrutura | Sistemas | 7C | Obras −2 Pedra; Carraca |
| VII | Economia Interdependente ★ | Crédito | 8C 2R | +3 Prestígio; Hegemonia Econômica elegível |

**Guerra (G)**
| I | Formações de Guarda | — | 2C | Quartel; Guarda |
| II | Treino de Manobras | Formações | 3C | Exército 7; Cavalaria flanqueia em Colina |
| III | Engenharia de Posição | Treino | 4C 1Mt | Fortaleza; Cerco |
| IV | Logística de Campanha | Engenharia + Contabilidade (E) | 5C | suprimento +1; Nau de Transporte |
| V | Comando Coordenado | Logística | 6C 1Mt | Exército 8; Arsenal |
| VI | Doutrina de Proteção | Comando | 7C | guarnição +1; Cidadela |
| VII | Estratégia de Contenção ★ | Doutrina | 8C 2Mt | +3 Prestígio; Hegemonia Militar elegível |

**Cultura (Cu)**
| I | Narrativas Comuns | — | 2C | Templo; Cultura +1 por Templo |
| II | Casas de Memória | Narrativas | 3C | Enviado cria presença a distância 2 |
| III | Escolas de Expressão | Casas | 4C 1Cu | Teatro; Governar com Cultura recupera 2 níveis |
| IV | Patrimônio Compartilhado | Escolas + Centralização (S) | 5C | presença Enraizada rende 1 Cultura/Era |
| V | Intercâmbio de Mestres | Patrimônio | 6C 1Cu | disputa cultural +1; Obra Monumento das Vozes |
| VI | Arquivos de Tradição | Intercâmbio | 7C | limite Cultura +3 |
| VII | Memória do Mundo ★ | Arquivos | 8C 2Cu | +3 Prestígio; Hegemonia Cultural elegível |

Bifurcações: no patamar III cada domínio tem um segundo avanço alternativo (exclusivo): C Círculos de Investigação (+1C por Acadêmico) × Método; S Federação dos Distritos (vagas +1) × Códigos; E Ofícios Cooperados (Industrial +1Md+1P) × Contratos; G Sinais de Patrulha (visão +1) × Engenharia; Cu Festivais de Encontro (+1 Ânimo/Era) × Escolas. Total 49 + 5 alternativos = 54 nós.

## 8. Avanços de Herança (3 por civilização)

Pagos em Conhecimento, com pré-requisito na Teia universal e Era mínima. Exemplos completos para duas civilizações; as outras 16 seguem o mesmo molde no artifact.

**Valgard** (guardas das passagens)
| Herança | Pré (Teia) | Era | Custo | Efeito |
|---|---|---|---|---|
| Passos Guardados | Formações de Guarda | II | 3C 1P | Guardas em cidade fortificada +1 na defesa (Guarda de Escudos) |
| Refúgios de Montanha | Engenharia de Posição | III | 4C 1P | Fortaleza em Colina/Montanha custa −2 Pedra; Paliçada na fundação em Colina |
| Muralha Viva | Doutrina de Proteção | VI | 7C 2Mt | 1×/Era: todas as fortificações reparam 1 passo; cidades sitiadas não perdem Ânimo |

**Thalos** (cartógrafos das costas)
| Cartas das Marés | Registros de Sinais | I | 2C 1R | Explorador em Embarcação Costeira revela Região costeira a distância 2 |
| Infantaria Naval | Treino de Manobras + Porto | III | 4C 1Mt | Infantaria desembarca sem penalidade anfíbia |
| Rede de Faróis | Redes de Observatórios | IV | 5C 1P | Farol custa −2; portos próprios dão visão 2 no mar; bloqueio contra Thalos exige 2 navios |

Qualquer civilização pode ignorar sua Herança e investir só na Teia.

## 9. Líderes

2 por civilização; escolhe 1 na preparação. Só: nome, título, crônica curta, passiva, poder 1×/Era, afinidade. Exemplo Valgard: **Toren Hjalvar, Senhor das Passagens** (passiva: peças em território próprio sempre supridas; poder: Muralha Viva, +2 Força nos conflitos da rodada; afinidade Guerra) · **Ysolde Varn, Guardiã dos Refúgios** (passiva: Governar em cidade fortificada recupera +1 Ânimo; poder: Portões Abertos, uma cidade Revolta volta a Abalada; afinidade Sociedade).

## 10. Cartas

| Família | Regra |
|---|---|
| Líderes | persistentes, 1 por jogador |
| Manobras | mão máx. 5, começa com 3, +1 por Era; tags Ação / Tática / Reação; 1 proativa + 1 Reação por rodada; não substituem Ordens salvo texto explícito |
| Ambições | 3 → escolhe 2; máx. 2 ativas; 2/3/4 Prestígio; máx. 1 pontuada por Era; troca 1 não concluída na passagem de Era |
| Pulso do Mundo | 1 obrigatório no início de cada Era + Pressão |
| Encontros | gerados pela exploração; escolha com 2 opções |
| Obras de Legado | projetos únicos, fora da mão |

## 11. Pressão do Mundo

Pressão começa em 0 a cada Era. Soma: fundação de cidade +1 · declaração de guerra +2 · captura de cidade +2 · avanço de patamar VI–VII +1 · Obra concluída +2 · Encontro extraordinário +1 · Era avança (reset). **Limiar = 4 + 2 × jogadores** (2j = 8, 4j = 12, 6j = 16). Ao atingir: Pulso adicional imediato, Pressão volta a 0. Esperado: 1 Pulso extra a cada 2–3 rodadas em mesa ativa, nunca toda rodada.

## 12. Exploração

Mundo gerado por seed, oculto. Região = 7 hexes. Explorador adjacente escolhe **qual Região oculta** revelar (direção); o conteúdo é o real da seed; sem rotação. Avanços dão prévia (bioma, recurso, costa, perigo). Descoberta narrativa gera Encontro. Explorador, Pioneiro e Enviado mantêm papéis separados.

## 13. Passagem de Era

Após a 5ª rodada: efeitos de fim de Era → pontuar no máx. 1 Ambição → poder do Líder recupera → mão +1 Manobra (até 5), Reações descartadas voltam ao baralho → mudança de Governo permitida se elegível (custa Influência) → efeitos "por Era" → abre patamar da Teia → Pulso obrigatório → Era seguinte.

## 14. Hegemonia (Era VII)

| Caminho | Requisitos (3) |
|---|---|
| Militar | Força total ≥ 14 · 3 vitórias · 2 cidades capturadas ou integradas |
| Econômica | Riqueza no limite · 3 rotas internacionais · Entreposto das Marés ou 2 Tesouros |
| Científica | Comunidade de Descoberta · 3 Observatórios/Academias · 2 Heranças |
| Cultural | Memória do Mundo · presença Predominante em 3 cidades estrangeiras · Monumento das Vozes |
| Política | Conselho de Civilizações · Aliança ativa com 2 civilizações · 1 povo integrado |
| Territorial | 20 hexes · 2 cidades N5+ · Estrada das Comunidades |

Declarar (Ordem Legado) só com os 3 cumpridos; sustentar 2 rodadas completas; vitória imediata. Senão, Prestígio na rodada 35.

## 15. Prestígio (fontes)

Explorar Região +1 · fundar cidade +1 · cidade atinge N4 +1, N6 +2 · avanço ★ +3 · Obra +4 · Ambição 2/3/4 · vitória defensiva +1, captura +2 · integrar povo +2 · presença Predominante +1 · Pulso (escolha) +1.

## 16. Regra × decisão × UI

| Regra | Por que existe | Que decisão cria | Risco | Como a UI esconde |
|---|---|---|---|---|
| 5 Ordens | tempo escasso, não recursos infinitos | o que fazer esta rodada | contar ordens | Bandeja com 5 fichas; cada ação ocupa uma ao ser planejada |
| Capacidade | um multiplicador urbano | crescer uma cidade × fundar outra | tabela | número no selo da cidade; Cartão mostra "colhe 3 hexes" |
| Ânimo 4 estados | consequência de forçar a cidade | ativar 2× agora e pagar depois | estados | cor da praça e aviso na segunda ativação |
| Limites 15/10 | sem acumular, gastar | gastar ou perder | contas | Cofre atual/limite com barra; aviso só perto do teto |
| Teia com pré-requisitos | identidade por caminho | que tronco seguir | grafo | Livro mostra só o patamar atual + próximo; linhas iluminam o alcançável |
| Herança paga | assimetria opcional | investir na identidade ou não | 54+ nós | 3 cartas no tabuleiro da civ, cinza até o pré-requisito |
| Pressão | mundo reage ao jogo | agir e provocar Pulso | medidor extra | barra fina na Faixa; só pulsa quando perto do limiar |
| Exploração por direção | escolha espacial sem manipular o mundo | para onde | prévias | Regiões ocultas com prévia por ícone; clique revela |
| Passagem de Era | ritmo e renovação | trocar Ambição, governo | sequência | um painel "Virada de Era" com 5 passos, 1 CTA |
| Hegemonia 3 requisitos | corrida clara | qual caminho | 6×3 | Livro·Hegemonia mostra só os 2 caminhos mais próximos no mapa da corrida |

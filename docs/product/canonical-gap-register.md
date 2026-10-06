# Canonical Gap Register

Data: 2026-10-04. Substitui, como lista de trabalho, os docs 09–11 de `docs/product/experience-v2/` (que continuam como fundamentação).

**Fontes de cânone:** Canonical Spec V4 e decisões aprovadas, incluindo as de 2026-10-04:

- UXDEC-016 a 020;
- DEC-011: 18 civilizações;
- DEC-014: naval é core planejado do Alpha.

A Bíblia v3.1 vale onde não contradiz essas fontes.

**Severidade:**

| Nível | Significado |
|---|---|
| **P0** | quebra ou impede a partida |
| **P1** | sistema central ausente ou incorreto |
| **P2** | sistema existe mas está incompleto |
| **P3** | refinamento |

**Colunas:**

- **Engine, Server, Proj., UI:** ✓ completo · ◐ parcial · ✗ ausente · — não se aplica.
- **Proj.:** projeção por jogador e privacidade (`apps/server/src/alpha-projection.ts`).
- **Teste:** arquivo em `tests/` ou `e2e/`.
- **Alcançável:** se a capacidade é alcançável num playtest real a partir da UI.

A coluna **Ação** termina com o estado: FEITO (commit) · PRÓXIMO · ABERTO · BLOQUEADO (decisão).

| ID | Sistema | Regra canônica | Engine | Server | Proj. | UI | Teste | Alcançável | Sev. | Depende de | Ação |
|---|---|---|---|---|---|---|---|---|---|---|---|
| GR-01 | Nomenclatura | Peça diplomática = **Enviado** (ID `ENVOY`) | ✓ | ✓ | — | ✓ | — | sim | P1 | — | Rótulos “Emissário”→“Enviado” no catálogo, motor, UI e cânone · FEITO |
| GR-02 | Nomenclatura | Peça fundadora = **Pioneiro**; `SETTLER` só migra | ✓ | — | — | ✓ | alpha-migration | sim | P2 | — | Remover `SETTLER` das listas de civis; ENVOY entra como civil (estava contado como Exército) · FEITO |
| GR-03 | Civilizações | Roster canônico de **18**; identidade do Alpha para as 12; mecânicas da Bíblia realocadas por identidade | ◐ | ✓ | — | ◐ | alpha-civilization-kits | sim (12) | P1 | DEC-011 | Catálogo `CIVILIZATION_KITS` (18) com fonte e estado de cada item · FEITO · lobby compacto para 18 · PRÓXIMO |
| GR-04 | Civilizações | As 6 da Bíblia sem líder/capital/cartas autorados não são inventadas | ✓ | ✓ | — | ◐ | alpha-civilization-kits | não (em autoria) | P2 | autoria | Disponibilidade `AUTHORING` com lacunas listadas · FEITO · autoria · ABERTO |
| GR-05 | Kit | Traço, herança, assinatura e limitação aplicados pelo motor | ◐ | ✓ | ✓ | ◐ (lobby mostra ativo × planejado) | — | não | P1 | GR-03 | 30 itens ACTIVE no motor: herança inicial; custos de Enviado, Cerco, pesquisa, estradas e melhorias; exploração; tratados; Ação cívica; disputa cultural; rotas; produção de pedreiras (Kor) e fazendas (Aurélia); primeira troca (Merídia); movimento de frota; suprimento; teto de fortificação; manutenção · FEITO · especializações iniciais, assinaturas (peças e estruturas novas) e itens que dependem de sistemas futuros seguem PLANNED · ABERTO |
| GR-06 | Kit · cartas | 3 cartas próprias no tabuleiro da civilização, liberadas nas Eras I/III/V, 1× por Era | ✗ | ✗ | ✗ | ✗ | — | não | P1 | GR-03 | `PLAY_CIVILIZATION_CARD`, estado por Era, validação no schema, cartas no leque com a bandeira da civilização · FEITO |
| GR-07 | Identidade | Cor do assento = dono; civilização = emblema + selo + bandeira + borda (UXDEC-019) | — | — | ✓ | ✗ | alpha-civilization-kits | — | P1 | GR-03 | Paleta sem ouro e marca (bandeira, borda) no mapa · FEITO · lobby · PRÓXIMO |
| GR-08 | Mapa · cidade | Cidade top-down que ocupa o hex; nível 1–7 lido pelo traçado (UXDEC-016) | — | — | ◐ | ✗ | — | sim | P1 | — | Arte `table-art.ts` no HexMap do Alpha · FEITO |
| GR-09 | Mapa · fortificação | Camada independente com Paliçada…Cidadela, dano e brecha (UXDEC-017) | ✓ | ✓ | ◐ (só nível, só cidade própria) | ✗ | alpha-combat | parcial | P1 | — | `cityMarks` projeta nível + estado das cidades visíveis; camada desenhada · FEITO |
| GR-10 | Mapa · peças | Silhuetas próprias por família; Explorador, Pioneiro e Enviado sem disco (UXDEC-018) | — | — | ✓ | ✗ (crachá genérico) | — | sim | P1 | — | Silhuetas no HexMap; civis ao lado da pilha, nunca escondidas · FEITO |
| GR-11 | Mapa · borda | Borda territorial na cor do assento com o padrão da civilização | — | — | ✓ | ◐ (cor só) | — | sim | P2 | GR-07 | Bordas por aresta com padrão · FEITO |
| GR-12 | Mapa · ouro | Ouro só na ação dominante (UXDEC-020) | — | — | — | ◐ | — | sim | P2 | — | Paleta de assento sem ouro; seleção, alvo e reivindicação neutros no mapa · FEITO · botões dourados duplicados na bandeja/inspetor · ABERTO |
| GR-13 | Cartas · UX | Mão em leque recolhido (desktop) e gaveta horizontal (mobile); uma carta em foco | — | — | ✓ | ✗ (só na aba Cartas) | — | parcial | P2 | — | Leque recolhido sobre o mapa, carta em foco com a única ação dourada, gaveta horizontal no celular · FEITO |
| GR-14 | Cartas · resultado | O efeito de carta ou ordem aparece no alvo (selo/halo), não só em texto | ◐ (eventos têm hex) | ✓ | ✓ (via relatórios) | ✗ | alpha-privacy | parcial | P2 | — | Halos e etiquetas no hex de cada evento durante a resolução; selo “+N Força / +N mov.” nas peças enquanto o efeito de carta dura; painel de resolução encostado ao lado do mapa · FEITO |
| GR-15 | Cidade | Uma escada só: Nível 1–7 (DEC-002) | ◐ (Desenvolvimento 1–5 tem efeito; Nível só rótulo) | ✓ | ✓ | ◐ (“Nível” = desenvolvimento no Conselho) | alpha-urban | sim | P1 | fórmula do Nível | Rótulo honesto agora (“Desenvolvimento” × “Nível”) · FEITO · unificar quando a fórmula fechar · BLOQUEADO |
| GR-16 | Fortificação | Reparo da Integridade: **V4 diz que não há reparo** (só o nível seguinte restaura); a Bíblia tem “Reparar (1 Pedra)” | ✗ | — | — | ✗ | — | não | P1 | **decisão** | BLOQUEADO: decidir se o Alpha adota o reparo da Bíblia |
| GR-17 | Fortificação | Dono vê o estado da própria muralha | — | — | ✗ | ✗ | — | não | P1 | GR-09 | Ver GR-09 |
| GR-18 | Líderes | Habilidade de Era de Kor e Elyra com efeito real (hoje coesão sem efeito) | ✗ | — | — | ◐ | alpha-leaders | sim (inerte) | P1 | GR-16 (Kor), DEC-022 | BLOQUEADO: só com reparo decidido (Kor) ou Coesão com efeito (DEC-022); o orçamento de líderes não permite inventar outro efeito |
| GR-19 | Povos | Proteger tem efeito | ✗ | — | ✓ | ✓ | alpha-independents | sim (inerte) | P1 | P1-7 | ABERTO |
| GR-20 | Bandos | Bandos podem ser combatidos e enfraquecem | ✗ | — | ✓ | ✓ | alpha-raids | não | P2 | — | ABERTO |
| GR-21 | Pulso | Pulsos “Bandos em marcha” e “Refugiados” têm efeito; Pulso atual visível | ◐ | ✓ | ✓ | ✓ | alpha-phases | sim | P2 | DEC-017 | Pulso da rodada sobre o mapa, com efeito e “sem efeito nos recursos” quando nulo · FEITO · efeito dos dois pulsos nulos · BLOQUEADO (DEC-017) |
| GR-22 | Melhorias | Features de terreno geradas (Rio, Fértil, Madeira, Pedra, Pesca); Pesqueiro construível | ✓ (Pesca, Madeira, Fértil, Pedra, Metal; Rio não) | — | ✓ | ✓ | alpha-features | sim | P1 | — | Uma feature de cada tipo por região, autorada pelo modelo e girada com ela · FEITO · Rio · ABERTO |
| GR-23 | Edifícios | Armazém, Tesouro, Banco, Porto, Estaleiro, Farol construíveis | ✗ (7 de 29) | — | ✓ | ◐ | alpha-urban | não | P1 | DEC-013; naval (Porto) | ABERTO |
| GR-24 | **Naval** | Core planejado: recrutar, mover no mar, embarcar, desembarcar, transportar, ocupação hostil, combate, afundar, bloqueio, porto, fog | ◐ (Frota move e luta) | ✓ | ✓ | ◐ | alpha-military | **não** (capital nunca costeira) | **P1** | DEC-014 | Vertical slice no motor: porto = cidade na Costa ou vizinha à água (a capital costeira recruta), Frota lançada na água vizinha, carga com vagas (Frota 3; Cavalaria e Cerco ocupam 2), combate e naufrágio com resgate, bloqueio, carga oculta para rivais · FEITO · UI de embarque/desembarque e carga no mapa · FEITO · playtest na Era II · PRÓXIMO |
| GR-25 | Naval | Embarque, transporte e desembarque | ✓ | ✓ | ✓ | ✓ | alpha-naval | Era II | P1 | GR-24 | `EMBARK`/`DISEMBARK` (1 ação), carga acompanha a frota, ataque anfíbio −1 · FEITO |
| GR-26 | Naval | Bloqueio de porto e rota | ✓ | ✓ | — | ◐ (motivo no recrutamento) | alpha-naval | Era II | P1 | GR-24 | Frota inimiga em guerra junto ao porto impede lançar frotas e suspende as rotas da cidade · FEITO · aviso “Porto bloqueado” na cidade (só para o dono) · FEITO |
| GR-27 | Naval | Sete classes do atlas auditadas contra o cânone | — | — | — | — | — | — | P2 | GR-24 | Auditoria em `naval-audit.md` (divergências e ordem: Costeira → Galera de Guerra → Nau → Mercante → Carraca/Fragata) · FEITO · **Embarcação Costeira** (Era I, transporte 1, sem combate, não bloqueia; navios genéricos por domínio no motor; saves antigos preenchidos pelo catálogo) · FEITO · Galera de Guerra, Nau, Escoltar · ABERTO |
| GR-28 | Mapa | Estradas e rotas desenhadas | ✓ | ✓ | ✓ | ✓ | — | sim | P2 | — | Estradas visíveis e rotas próprias (suspensas em vermelho) dentro de cada hex, sob as peças · FEITO |
| GR-29 | Guerra | Cidade cercada por território reivindicado continua atacável | ✓ | — | ✓ | ✓ | alpha-war-access | sim | **P0** (confirmado) | — | Guerra abre o território do inimigo ao movimento; entrar na cidade inimiga continua sendo ataque; em paz, fronteiras seguem fechadas sem tratado · FEITO |
| GR-30 | Diplomacia | Embargo sem aceite do alvo; PNA bloqueia guerra? | ◐ | ✓ | ✓ | ✓ | — | sim | P2 | DEC-015 | BLOQUEADO |
| GR-31 | Eras | IDs `ASCENSION`=V e `HEGEMONY`=VI com rótulos Potências/Ascensão; métrica `eraFiveResearch` rotulada certa | ◐ | ✓ | ✓ | ◐ | alpha-milestones | sim | P3 | migração | Corrigir rótulo da métrica · ABERTO · migrar IDs depois |
| GR-32 | Armazém | Teto civilizacional | ◐ | ✓ | ✓ | ✓ | alpha-storage-metal | sim | P2 | DEC-008 | BLOQUEADO |
| GR-33 | Cultura | Presença com efeito além da Hegemonia; Coesão | ◐ | ✓ | ✓ | ✓ | alpha-culture | sim | P2 | DEC-016, DEC-022 | BLOQUEADO |
| GR-34 | Mesa viva | Presença, pausa, suspender, retomar no servidor | ✗ | ✗ | ✗ | ✗ | — | não | P2 | UXDEC-001…008 | ABERTO |
| GR-35 | Unidades | Escalas, Modernização, unidades assinatura no motor | ◐ | — | — | ◐ | alpha-kit-effects | sim | P2 | DEC-014, GR-05 | Assinaturas como variante da família: Guarda de Escudos (Valgard), Engenheiros de Cerco (Kor), Infantaria Naval (Thalos), Exploradores de Elyra; estrela no mapa · FEITO · demais assinaturas, escalas e Modernização · ABERTO |
| GR-36 | Testes | Comandos sem teste: HIRE_ADVISOR, BUILD_ROAD, EMBARGO | ✓ | ✓ | ✓ | ✓ | ◐ (alpha-untested-commands) | sim | P3 | — | HIRE_ADVISOR e BUILD_ROAD · FEITO · EMBARGO depende da DEC-015 · BLOQUEADO |
| GR-37 | Layout | Mesa V2.1 (mapa protagonista, Cofre, Livro, um CTA, 1366×768) no produto | — | — | — | ◐ (Conselho/Inspetor/abas) | e2e | sim | P2 | — | Passo 1: abaixo de 1400 px o Conselho começa recolhido; clicar num hex com peças abre o inspetor militar com a pilha; Pulso e mão sobre o mapa · FEITO · Cofre/Livro como sobreposições · ABERTO |

## Ordem de execução

1. **Canon e schemas:** GR-01 a 04 e GR-15 (rótulo).
2. **Visual V2.2 no produto:** GR-07 a 12, 13 e 14.
3. **Regras decididas e sistemas inertes:** GR-16 a 19 e 21.
4. **Civilizações e assimetria:** GR-05 e 06.
5. **Naval core:** GR-24 a 27.
6. **Conteúdo:** GR-22 e 23.
7. **Balanceamento e polimento.**

O progresso é registrado aqui, linha a linha, com o commit que fecha cada item.

## V5.1b — migração (2026-10-05)

Baseline: `docs/product/rules-v5-proposal.md` (V5.1b FINAL). Interpretações I-1…I-n em `openspec/changes/rules-v51b-engine/design.md`. Commits: 6efad49 (S0/S1), 73c5efc (S2), 073835d (S3/S4), 13d754f (S5), 5917e9d (S5b), 4310ac7 (S6), a7ac1f3 e b5e8113 (UI), fef3d9c e a71b204 (playtest).

### Fechado

| Sistema | Estado |
|---|---|
| Ressonância 5 encaixes, composição, Repercussão (27 cartas), Reserva de Marcos, remoção da Pressão | FEITO, motor + projeção + Tabuleiro |
| Combate: um choque, Δ (empate/vitória/decisiva), Poder por família, assinaturas, Graus I–III, captura, 1 Reação por lado | FEITO |
| Acampamentos, Bandos, Piratas, limites, crescimento, alvo, recompensa, comandos SURGIR/REFORÇAR/ATIVAR | FEITO |
| Descobertas ocultas e Encontros | FEITO |
| Virada de Era em 9 passos, Pulso só na Virada | FEITO |
| 7 governos com 2 vantagens e 1 limitação, reforma 1/Era | FEITO |
| Versionamento de saves (`rulesVersion`, `SAVE_UPGRADED`) | FEITO |
| Privacidade dos novos campos, CAS, replay | FEITO (`alpha-privacy`, `alpha-cas-replay`) |
| Telemetria por rodada e playtest headless 2/4/6 | FEITO (`docs/evidence/v51b-playtest/`) |

### Divergências restantes

| ID | Divergência | Severidade |
|---|---|---|
| V51B-01 | Baixas escolhidas pelo dono: motor aplica "mais fraco primeiro, Cerco por último" (I-4/I-17) | P2 |
| V51B-02 | Abordagem Grau III captura Mercante: Mercante não existe no motor | P3 |
| V51B-03 | Reforma de governo reservada no planejamento da última rodada; passos 1–6 rodam juntos na abertura da Virada (I-28/I-31) | P2 |
| V51B-04 | Ancoradouro pirata simplificado; níveis de Pirata e composição não autorados no cânone (I-6, I-24) | P3 |
| V51B-05 | Linha de alvo do Bando é estimada no cliente; projeção não expõe o alvo | P3 |
| V51B-06 | Heranças catalogadas para 18 civilizações; Alpha joga 12 | P2 |
| V51B-07 | Teto de população do cânone (§4) impedia Elevar; corrigido (I-37) — erratum no canon | registrado |
| V51B-08 | Capturas reais de combate e de cidade degradada ausentes na pilha real (existem em e2e semeado) | P3 |
| V51B-09 | Tempo humano por fase não medido (só tempo de motor) | P2 |

### Suspeitas de balanço (playtest, sem retuning)

Ver `docs/evidence/v51b-playtest/REPORT.md`. Relacionadas a §26: item 2 (N7 raro; nenhum bot passou de N4–N5), 3 (Cofres), 4 (sustento), 5 (ritmo de Repercussão: 1,1–1,8 por civ nos bots, canon prevê 3–4), 10 (Governar × Ânimo). Bots competentes (27 partidas, 3020f26/73d25b6/383516c): N6 em r25–29, N7 raro (1/9); Repercussões 3,5–3,7 por civ (ok); Bandos atacam cidades sem defensor (~98%) e nenhum Acampamento morre acampado (Acampamentos de Pulso ativam no mesmo turno, recompensa inalcançável: suspeita P1 para playtest humano); primeiro assalto r7–11 (sim: 5–6); Graus pouco decisivos em 3v3; Soldados saem da população e custam caro em civs pequenas.

### Verificação final (2026-10-05)

lint, typecheck, 914 testes (79 arquivos), build web e 10 e2e: verdes.

### Classificação para playtest humano (2026-10-05)

Classes: **A** bug/correção obrigatória antes do playtest · **B** divergência aceitável temporariamente · **C** decisão de design que exige validação humana · **D** conteúdo ausente que impede testar parte importante.

| ID | Classe | Impacto | Risco | Recomendação | Bloqueia playtest? |
|---|---|---|---|---|---|
| V51B-01 | B | o jogador não escolhe quais peças morrem; perde agência tática, não quebra a partida | baixo a médio (reclamação em combates com Cerco misturado) | manter; observar na sessão; depois um comando de preferência de baixas | não |
| V51B-02 | B | só afeta Frota Grau III (captura de Mercante inexistente) | baixo | manter; Mercante entra com o conteúdo naval | não |
| V51B-03 | C | a reforma de governo precisa ser reservada uma rodada antes da Virada | médio (UX: jogador pode não entender a reserva) | validar com humanos se a reserva é clara; não mexer antes | não |
| V51B-04 | C | níveis de Pirata e Ancoradouro não autorados no cânone; pirata aparece pouco | baixo a médio | validar se Piratas importam em mapas com mar; autorar depois | não |
| V51B-05 | B | linha de alvo do Bando é estimativa do cliente e pode enganar a defesa | médio (decisão de defesa com informação imprecisa) | expor o alvo real de Bandos visíveis na projeção (público pela regra) antes de medir defesa; marcado "rumo provável" até lá | não |
| V51B-06 | B | 6 das 18 civilizações não são jogáveis (em autoria) | baixo | manter | não |
| V51B-07 | B | erratum já aplicado (teto de população); documento canônico registra | baixo | manter | não |
| V51B-08 | B | capturas reais de combate e cidade degradada ausentes | baixo | resolvido na rodada de UI desta fase (natural × semeado) | não |
| V51B-09 | C | tempo humano por fase só estimado | médio | instrumentação dev-only desta fase mede; confirmar duração de 35 rodadas | não |
| V51B-10 (novo) | C/D | Legado usa o Grande Projeto antigo (1 passo, ~11 recursos, efeito +2/rodada), não as Obras de Legado do §11; Legado é situacional por Era IV + distrito | médio (efeito mais forte que o cânone; jogador não consegue Legado antes da Era IV) | decisão D-3: manter como Obra do Alpha ou implementar Obras canônicas antes de avaliar Legado | não, mas Legado não é avaliável |
| V51B-11 (novo) | C | I-5/I-20 fazem o Acampamento virar Bando no próximo Virada de Era; a recompensa canônica por destruir o Acampamento fica praticamente inalcançável (0 de 27 partidas) | alto para a leitura de Bandos | decisão D-1: manter, Acampamento persistente que envia Bandos, ou Acampamento novo não ativa no mesmo turno | não |
| V51B-12 (novo) | C | combate jogador × jogador nunca ocorreu naturalmente nas 45 partidas de bots (bots sem exército); a fronteira compartilhada só aparece em 6 jogadores | alto para o critério central de contato | a primeira sessão humana deve forçar contato, diplomacia e guerra pela UI; ver investigação | não |
| V51B-13 (novo) | C | I-2 (Guarda do atacante só em Manter/Linha III) desloca 3v3 Infantaria de 14/57/29 para 8/53/39 | médio | decisão D-2 | não |

Evidência e causas: `docs/evidence/v51b-investigation/` (tabelas, variantes e Graus por situação).


### Decisões do PO e novas divergências (2026-10-05)

| ID | Estado |
|---|---|
| V51B-11 / D-1 | FECHADO: Acampamento RECÉM-SURGIDO (`fresh`) fica vulnerável uma rodada completa de Planejamento antes de lançar o primeiro Bando (design I-5/I-20 + D-1). |
| V51B-13 / D-2 | FECHADO sem mudança de regra: a Guarda ao atacar só vale em Manter; a identidade defensiva é preservada. Matriz em `docs/evidence/v51b-investigation/GUARDA-3V3.md`. |
| V51B-10 / D-3 | FECHADO: as Obras de Legado (§11) são o único sistema; Grande Projeto removido (`ADVANCE_LEGACY_WORK`, `legacyWorks`, I-42…I-46). Efeitos únicos por Obra seguem como placeholders do Alpha; as 6 Obras convertidas não têm custo no texto canônico. |
| V51B-14 (novo) | ABERTO, P2: os requisitos de Hegemonia do motor são os da V5.1a, não os do §23 (Comunidade de Descoberta, Memória do Mundo, Estrada das Comunidades etc.). Registrado, sem mudança: exige decisão de escopo. |
| V51B-15 (novo) | ABERTO, P3: os 29 edifícios do cânone não existem (7 no motor, GR-23); o pré-requisito de uma Obra usa o distrito correspondente (I-43). |
| V51B-16 (novo) | ABERTO, P1, classe C: sem exército nenhum assento contra-ataca; o assento mais próximo dos Acampamentos de abertura é devastado por Bandos (17–20 assaltos decisivos, N1 pop 2). Mobilizar exige habitante Disponível; um exército de 6 come 6 Alimento por rodada. D-1 está testada no motor mas não é exercitável pelos bots. Ver `docs/evidence/v51b-d1-d3/D1-REPORT.md`. — 2026-10: Pioneiro explora/funda, exército mínimo e alvo de ataque corrigidos; economia de fome ainda impede batalha PvP espontânea (ver docs/evidence/v51b-pioneers/REPORT.md). |

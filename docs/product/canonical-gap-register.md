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
| GR-27 | Naval | Sete classes do atlas auditadas contra o cânone | — | — | — | — | — | — | P2 | GR-24 | Auditoria em `naval-audit.md` (divergências e ordem: Costeira → Galera de Guerra → Nau → Mercante → Carraca/Fragata) · FEITO · esquema por classe e Escoltar · ABERTO |
| GR-28 | Mapa | Estradas e rotas desenhadas | ✓ | ✓ | ✓ | ✓ | — | sim | P2 | — | Estradas visíveis e rotas próprias (suspensas em vermelho) dentro de cada hex, sob as peças · FEITO |
| GR-29 | Guerra | Cidade cercada por território reivindicado continua atacável | ✓ | — | ✓ | ✓ | alpha-war-access | sim | **P0** (confirmado) | — | Guerra abre o território do inimigo ao movimento; entrar na cidade inimiga continua sendo ataque; em paz, fronteiras seguem fechadas sem tratado · FEITO |
| GR-30 | Diplomacia | Embargo sem aceite do alvo; PNA bloqueia guerra? | ◐ | ✓ | ✓ | ✓ | — | sim | P2 | DEC-015 | BLOQUEADO |
| GR-31 | Eras | IDs `ASCENSION`=V e `HEGEMONY`=VI com rótulos Potências/Ascensão; métrica `eraFiveResearch` rotulada certa | ◐ | ✓ | ✓ | ◐ | alpha-milestones | sim | P3 | migração | Corrigir rótulo da métrica · ABERTO · migrar IDs depois |
| GR-32 | Armazém | Teto civilizacional | ◐ | ✓ | ✓ | ✓ | alpha-storage-metal | sim | P2 | DEC-008 | BLOQUEADO |
| GR-33 | Cultura | Presença com efeito além da Hegemonia; Coesão | ◐ | ✓ | ✓ | ✓ | alpha-culture | sim | P2 | DEC-016, DEC-022 | BLOQUEADO |
| GR-34 | Mesa viva | Presença, pausa, suspender, retomar no servidor | ✗ | ✗ | ✗ | ✗ | — | não | P2 | UXDEC-001…008 | ABERTO |
| GR-35 | Unidades | Escalas, Modernização, unidades assinatura no motor | ✗ | — | — | ✗ | — | não | P2 | DEC-014, GR-05 | ABERTO |
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

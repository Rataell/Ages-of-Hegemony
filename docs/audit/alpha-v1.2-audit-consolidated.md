# Alpha V1.2 — auditoria consolidada (diagnóstico)

Branch: `stabilize/alpha-v1.2-audit` (derivada do RC4 `dca181a`; tag `external-alpha-v1.2-rc4`). Nada publicado, nada deployado, `main` intocada, sem `frozen`. **Nenhum arquivo de `packages/` ou `apps/` foi alterado**: tudo abaixo é medição e testes de reprodução.

Relatórios por lane (detalhe, `file:line`, repro, teste):

| Lane | Arquivo |
|---|---|
| A1 Economia e ritmo | dados em `docs/evidence/v12-audit/lane-a1/` (84 partidas, `summary/tables.md`); análise nesta página (§3) |
| A2+D Fontes, cidades, ações urbanas | `alpha-v1.2-lane-a2d-sources-cities-urban.md` |
| B Combate | `alpha-v1.2-lane-b-combat.md` |
| C Mundo | `alpha-v1.2-lane-c-world.md` |
| E Ameaças, nomes, legado | `alpha-v1.2-lane-e-threats-naming-legacy.md` |
| F UI | `alpha-v1.2-lane-f-ui-regressions.md` |

Limites do que se afirma: lanes B, C, E e F foram feitas por subagentes e **eu não reli todo o código que eles citam**; os números de A1 vêm de scripts de política que escrevi/consumi, e as simulações de bots (E-5) jogam pior que políticas disciplinadas. Cada achado diz qual evidência o sustenta. A lane F é análise estática (os screenshots do playtest não estavam disponíveis); F-02 e F-17 pedem confirmação em tela.

---

## 1. Matriz de achados

Severidade: **P1** quebra fluxo central ou cria espiral irreversível · **P2** erro de regra/informação com efeito real · **P3** menor. Classe: BUG (implementação contradiz canon/UI), RULE (regra com resultado contraditório), BALANCE, WORLD, UX, LEGACY.

### Economia e progressão

| ID | Classe | Sev. | Achado | Causa (lane) |
|---|---|---|---|---|
| E-1 | RULE | P1 | Revolta é espiral sem saída: capacidade 0, Governar exige Cultura/Riqueza que a cidade não consegue produzir | `alpha-city.ts` `activationCapacity`/`governCost` (parte 1) |
| **E-7** | **BUG** | **P1** | **Custo de Cultura nunca é debitado.** `alphaCanAfford`/`alphaPay` não tratam `culture`. Governar mostra "1 Cultura" e é grátis para quem tem ≥ 1 Cultura; Cultura não diminui. A1 mediu 1 300 Governar com custo de Cultura exibido e nenhum débito | `alpha-resources.ts` (`alphaPay` debita comida, conhecimento, influência, materiais, riqueza; não cultura). Afeta qualquer custo futuro em Cultura |
| E-2 | RULE (decidida) | — | Era por calendário permanece. Ver §3 para o ritmo | decisão A/B do PO |
| E-3a | BUG | P1 | 21 de 29 edifícios nunca podem ser construídos (`urbanOptions` e `UrbanBuildTargetSchema` usam o `BuildingTypeSchema` legado de 7 valores). Faltam Templo, Chancelaria, Teatro, Tesouro, Banco, Academia, Armazém… Consequências: Teocracia só tem a penalidade; Cultura só vem do Distrito Cultural; tetos de armazenamento ficam no básico | A2D |
| E-3b | RULE | P2 | Hegemonia Cultural exige 25 Influência e a Econômica 30 Riqueza; o teto máximo alcançável é 18 e 24. Inalcançáveis | A2D |
| E-3c | BUG | P2 | 17 promessas `rule:*` da Teia não têm leitor no motor (ex.: "Eruditos rendem Influência 1×/Era", "Presença Enraizada rende Cultura"); 54 Heranças são só texto | A2D |
| E-3d | BUG/UX | P2 | Efeito mostrado em Construir ≠ efeito creditado (Cultural diz "+1 Influência" e rende +1 Cultura; Agrário diz +1 e rende +2; Mercado/Biblioteca/Oficina prometem +1 e rendem 0; Marítimo custo exibido 0, cobrado 3 Madeira + 1 Pedra). Produção exibida × creditada diverge em 818 de 16 709 Produzir (5%) | A2D, A1 |
| E-4 | BALANCE | P2 | Produzir é Ordem e o limite de Alimento (15) obriga a cadência. Ver §3.2: o mínimo é ≈ 0,4–0,6 Produzir por cidade por rodada; as políticas gastam mais e descartam 7,1 Alimento por rodada | A1 |
| E-5 | BALANCE | P2 | Fome nas Eras finais: 54% das rodadas-assento nas Eras V–VII com os bots antigos; com políticas disciplinadas é 3–15% (fome/peças) e 1–13% (Revolta). Os bots exageram | A1 |
| E-6 | UX | P2 | Sem previsão do fim de rodada (sustento, Crescer, manutenção, descartes, Ânimo) antes de Confirmar | lane F (F-03/F-04) |
| E-8 | BUG | P2 | Cadeia do relatório quebra na Virada de Era (1 380 de 1 890 viradas): fluxos de Pulso/recompensas/reformas da Virada ficam fora de qualquer relatório (Influência −637, Conhecimento +341, Alimento +307, Metal +186 na amostra) | A1 |
| E-9 | BUG | P3 | Rodada 1: 104 assentos abrem acima do limite (Alimento 16–19 > 15) | A1 |

### Ações urbanas (Ordens, ativações, planejamento)

| ID | Classe | Sev. | Achado |
|---|---|---|---|
| U-1…U-8 | BUG | P1 | O Planejamento valida cada plano contra o estado atual e não reserva nada. Perdem a Ordem na resolução (`ACTION_FAILED`): recursos/Conhecimento divididos entre planos; mesmo distrito duas vezes; distrito além das vagas; Elevar ×2; [Recrutar, Elevar]; Recrutar + redistribuição que remove o Soldado; Governar ×2; bônus de Próspera em [Produzir, Recrutar ×3]. A1 mediu **5% das Ordens usadas** perdidas assim (1 917 de 35 973). Fix mínimo: validar o plano novo sobre uma projeção (`structuredClone` + `performUrbanAction` dos planos guardados), como `recruitCountBlock` já faz |
| U-9 | UX | P2 | Prévia do 2º Produzir inclui bônus que ele não recebe |
| F-14 | BUG | P1 | Limite de ações por cidade difere entre cliente e motor (cliente conta Pesquisa e ignora Ânimo/Sobre-extensão/Conselho); "Ações planejáveis N/2" mente em cidade Abalada; "ações restantes" aparece só na aba Ações dos Detalhes e errada |
| F-06 | BUG | P2 | Detalhes > Produção usa o modelo legado (`deriveCityProductionBreakdown`), não `cityYield` (mostra 5 Conhecimento onde o motor dá 3) |
| F-12 | BUG | P2 | Governar mostra custo de 1 nível; `governCity` paga até a Capacidade, trocando Cultura por Riqueza no meio |
| F-05 | RULE | P2 | Motor: sustento → Crescer → manutenção militar. Previsão da UI desconta o exército antes de decidir o crescimento: a tela diz "não cresce" e o motor cresce e gera `UPKEEP_SHORTAGE`. Decisão de regra do PO |
| F-11/13/16/17 | UX | P2 | Consequências sem aviso: Recrutar (−1 habitante, manutenção), 2ª ativação (−1 Ânimo), custos planejados não somam, Fundar (carga de Administração) |

### Combate

| ID | Classe | Sev. | Achado |
|---|---|---|---|
| B-12 | BUG | P1 | Em mesas de 3+, o cliente lê "em guerra" como "este jogador está em guerra com alguém" (`alpha-table.tsx:162`, `alpha-panels.tsx:158`, `wars.some(pair => pair.includes(other))`). Some "Declarar guerra", Troca é bloqueada, "Atacar" pula "Em paz" e o servidor recusa. Playtest de 2 jogadores não vê |
| B-01 | BUG | P1 | ATTACK soma o custo de terreno do hex alvo como movimento (`alpha-military.ts:81,83`): Cerco (mov. 1) nunca ataca Floresta/Colina/cidade em Colina; Infantaria/Cavalaria (mov. 2) nunca atacam Montanha; grupo misto trava na peça mais lenta |
| B-02 | BUG | P2 | Captura de cidade de terceiro sem guerra, via guarnição dentro dela (`alpha-military.ts:88-96`, `alpha-combat.ts:32,151`) |
| B-10/B-08/B-09 | BUG | P2 | Captura de cidade sem evento; ataque que falha (alvo andou) só vai às Crônicas e gasta a Ordem; aliado puxado por Pacto Defensivo entra na guerra sem aviso |
| B-13 | RULE | P2 | Janela de CONFLITOS só existe para quem tem carta de Reação: defensor sem carta é atacado no clique que fecha o Planejamento e não vê aviso; Postura e prioridade de baixas recusadas em CONFLITOS; postura padrão Assalto perde para Manter (+1 ao defensor) |
| B-03b | BALANCE/RULE | P2 | Sem refúgio, a pilha derrotada inteira morre; refúgio recusa hex de aliado/terceiros |
| B-06 | RULE | P2 | Frotas sozinhas ocupam cidade costeira vazia (decisão do PO) |
| B-03/04/04b/05/07/14/15/16/17 | vários | P3–P4 | ver lane B |

Verificado e correto (lane B): não ataca sem guerra nem com Aliança ativa; não ataca peça própria; resolução atômica; 300 batalhas semeadas sempre com estado válido e round-trip JSON idêntico; todos os assentos recebem o mesmo registro; prévia e resolução batem.

### Mundo, Pioneiro e água

| ID | Classe | Sev. | Achado |
|---|---|---|---|
| (invariante) | — | — | **Pioneiro não embarcado nunca ocupa `SEA`**: 0 violações em 108 partidas (4 presets × 2/4/6 × 3 seeds × bots/wanderer/naval), 31 508 comandos varridos, 2 670 entradas de fronteira a pé e 202 navais, embarque/desembarque/naufrágio/grupos |
| UX-2 | UX | P2 | `COAST` é terra **e** água (`alpha-water.ts:5-9`) mas a UI pinta COAST como mar (`--coast` × `--sea`, mesmo glifo `≈`): o Pioneiro legal em COAST parece estar na água. Lido no CSS, não renderizado |
| WORLD-11 | BUG | P1 | Povo independente, Acampamento e Pirata são postos no terreno provisório (rotação 0) de Região fechada; ao virar, o povo/acampamento acaba em `SEA` e o Pirata em terra. 27% dos povos e 17% dos acampamentos; 87–97% dos mundos MISTO/ARQUIPÉLAGO/MAR INTERIOR. Repro: MISTO · seed 3 · 2 jog. · rodada 4, `camp-r1-e1-n1` em −1,−1. Fix: pinar hexes de povo/ameaça em `profileOf`/`explorationAccess` |
| WORLD-10 | RULE | P2 | `CLAIM_HEX` aceita hex de Região fechada (fixa rotação 0 sem Descoberta; Pioneiro numa Região fechada; UI desenha por cima do cartão virado) |
| RULE-1/2 | RULE | P2 | `isPort` (`alpha-naval.ts:31`) e `harborHex` (`alpha-water.ts:22`) discordam numa COAST sem vizinho d'água (93% dos mundos MISTO); Porto e navios aceitam poças de 1–6 hexes (34–47% dos cais possíveis no MISTO/CONTINENTAL). Fix: corpo navegável ≥ 7 hexes e `isPort = harborHex !== null` |
| RULE-3 | RULE | P3 | Naufrágio em COAST perde peça que poderia ficar |
| WORLD-2…9, BALANCE-1 | WORLD | P2 | CONTINENTAL: oceano da borda partido em 8–11 corpos em 100% dos mundos; MAR INTERIOR: jazidas viram ilhotas em 92–97%; ARQUIPÉLAGO: corredor de terra entre Pátrias em 55–75%, ilhotas < 7 hexes em 64–96%; sem Peixe a ≤ 1 Região em 69–75% dos CONTINENTAL 4–6p. Pedem decisão de produto (números travados do V5.1a) |

### Ameaças, nomes e legado

| ID | Classe | Sev. | Achado |
|---|---|---|---|
| F-T1 | RULE | P1 | O Bando assalta a mesma cidade toda rodada ímpar e nunca recua (`homeHexId` nunca é lido, `alpha-threats.ts:213,225-238,296`). 967 assaltos em 22 partidas (12,6 por ameaça); 100% em hex de cidade; mundo venceu 93%; 0 acampamentos destruídos por bots. O dano real vai pelo **Ânimo** (cada vitória do mundo −1, `alpha-threats.ts:340`): Revolta em 25% (Era IV) e 43% (Era V) das cidades no QUICK 2p, contra 2% e 0% sem ameaças. Hex bloqueado custa só ≤ 2,3% do Alimento nas Eras I–II. Fix mínimo: o Bando volta ao Acampamento depois de assaltar (emulado em 6 partidas 2p: assaltos 26→11 QUICK e 44→15 STANDARD; Revolta 25%→5% e 29%→21%) |
| F-T2…T11 | BALANCE/BUG | P2–P3 | Cadência por paridade de Virada, onda sincronizada, sem escalonamento por Era, `threatAttacks` mistura mundo e jogador, hex bloqueado pode dar Alimento negativo, etc. (lane E) |
| F-N1/N2 | UX | P2 | "Bárbaro" aparece em 3 textos visíveis (`game-domain/src/alpha-threats.ts:56,59`, `game-engine/src/alpha-discoveries.ts:72`); rótulos duplicados em 5 lugares e `THREAT_NAMES` é export morto. Proposta Saqueadores / Acampamento de Saqueadores / Piratas / Povos Independentes, com `THREAT_NAMES` como fonte única; lista de 26 linhas na lane E, não aplicada. Povos Independentes não têm relação mecânica com ameaças |
| F-L1/L2 | LEGACY | P3 | "Thalos" vem de sala v1.1 reaberta (`alpha-shell.tsx:219` renderiza tabuleiro de sala legada com capital congelada "Farol de Thalos") e do Local Play em dev (`local-maps.ts:10`). Nenhum caminho de produção emite nome antigo em partida v1.2 nova. Core 10 intocado |

### UI

| ID | Classe | Sev. | Achado |
|---|---|---|---|
| F-01 | BUG | P1 | Dicas automáticas cobrem a Virada de Era: `.alpha-tour` z-index 60 (`alpha.css:456`) × `.alpha-era-turn` 40 (`:497`); `AlphaTour` (`alpha-tour.tsx:84`) dispara sem olhar `game.phase`. Fix: não disparar em `ERA_TURN`/conflito/replay |
| F-08/F-09 | BUG/UX | P2 | `FOOD_SHORTAGE`, `UPKEEP_SHORTAGE`, `STORAGE_DISCARD`, `ADMINISTRATIVE_OVEREXTENSION` vão só para `alphaEvent`, não para `resolutionEvents`; Mover/Atacar que falham ficam silenciosos (`alpha-phases.ts:167`) |
| F-07 | LEGACY | P3 | Relatório de manutenção fala em "estabilidade" e omite Ânimo e Riqueza dos navios |
| F-10 | UX | P3 | Texto de batalha traz coordenada crua, perdas sem lado |

Os relatórios das lanes têm mais itens que esta matriz (a matriz traz os de maior efeito; as lanes trazem os P3/P4 e as correções sugeridas).

---

## 2. Recuperação emergencial em Revolta (decisão A)

### 2.1 Como a manutenção maltrata o Ânimo (código)
Por rodada, depois das ações: fome da própria cidade **−1** (`alpha-phases.ts` `maintainCivilizations`); peças sem manutenção **−1 em todas as cidades**; Sobre-extensão **−1** na cidade mais baixa; 2ª ativação **−1** (`alpha-urban.ts`, quando `urbanActionsUsed === 2`); cada vitória de ameaça do mundo **−1** (`alpha-threats.ts:340`). Efeitos positivos: Virada de Era **+1** em todas (`alpha-era-turn.ts:63`), Templo, Governar.

### 2.2 Experimento no motor real
`node scripts/alpha-revolt-recovery.mjs`. Rodada 2 (2 jogadores, seed 1); o Ânimo da cidade é posto no valor X que o Governar emergencial deixaria; o saldo é editado para o cenário; a rodada fecha sem ordens e se lê Ânimo e população **depois da manutenção real**. Cenário com navio sem Riqueza foi descartado (estado inválido: navio em hex de cidade); a falta de Riqueza naval é a mesma penalidade "−1 por peças sem manutenção" do cenário S2/S3.

| Cenário | X=2 | X=3 | X=4 | X=5 |
|---|---|---|---|---|
| S0 sem faltas | 2 | 3 | 4 | 5 |
| S1 fome (0 Alimento, sem peças) | **1 Revolta** | 2 Abalada | 3 Abalada | 4 Estável |
| S2 só peças sem manutenção | **1 Revolta** | 2 Abalada | 3 Abalada | 4 Estável |
| S3 fome **e** peças sem manutenção | **0 Revolta** | **1 Revolta** | 2 Abalada | 3 Abalada |

Leitura: **Ânimo 3 basta quando só há uma falta (S1, S2), mas falha quando fome e peças faltam juntas (S3)**: volta a Revolta com o benefício gasto. Ânimo 4 sobrevive a duas faltas simultâneas (termina Abalada, com Capacidade ≥ 1 para Produzir). Nenhum valor sobrevive a duas faltas **mais** Sobre-extensão ou vitória de ameaça na mesma rodada (−3/−4); isso é aceitável como "escolha difícil", mas deve ficar escrito.

A população cai 1 em fome em todos os casos (6→5): a recuperação de Ânimo não é imunidade à fome.

### 2.3 Especificação proposta (aguarda aprovação do valor)
- Nova ação `PROMOTE_MOOD` modalidade emergencial: consome uma Ordem e uma ativação urbana; custo 0; só com `moodBand === 'REVOLT'`; define Ânimo = **4** (recomendado; 3 como alternativa que falha em S3).
- Marcador por cidade `revoltEmergencyRound: number | null` (default `null`, compatível com saves antigos pelo schema). Uma vez por episódio.
- **Fim do episódio** (rearmar): ao fechar a manutenção de uma rodada **posterior** à do uso com Ânimo ≥ 4 (Estável). Ânimo 4 imediato no mesmo round não rearma; sair e voltar a Revolta antes de se estabilizar não dá segundo benefício. Teste anti-exploração: cidade que cai de novo em Revolta duas rodadas depois não pode reusar; só reusa depois de uma rodada completa em Estável.
- Governar normal inalterado (nos custos existentes); o Governar emergencial não produz, não alimenta e não repara fortificação.
- Sem produção automática, sem subsídio, sem imunidade à fome: a cidade precisa produzir na rodada seguinte; se não produzir, a fome volta a derrubá-la e o benefício já foi gasto.
- Pendência: o bug E-7 (Cultura não debitada) muda o custo real do Governar normal; ao corrigi-lo, Governar passa a consumir Cultura. Isso piora a recuperação normal de civilizações com Cultura e deve ser medido junto.

Testes previstos: S0–S3 acima viram teste de integração (Ânimo 4 → ≥ 2 em S3); `Revolta → emergencial → Produzir na rodada seguinte aumenta Alimento`; reuso bloqueado; rearme após uma rodada em Estável; save antigo sem o campo carrega; ação recusada fora de Revolta; Ordem e ativação consumidas.

---

## 3. Economia: ritmo de 21/35/49 rodadas

Fonte: 75 partidas de política (Crescimento, Pesquisa, Expansão, Militarização, Equilibrada; 5 por política e perfil) × perfis 21/35/49, em 2 e 4 jogadores com 2 seeds e 6 jogadores com 1 seed; `docs/evidence/v12-audit/lane-a1/summary/tables.md` (regerado por mim com `node scripts/alpha-economy-report.mjs` depois que os processos terminaram; a versão que a lane A1 deixou cobria só 51). As 9 partidas restantes são de uma política auxiliar `metalculture`, só para sondar Cultura e Metal (conciliação completa em `alpha-v1.2-lane-a1-data-reconciliation.md`). **Todas as tabelas de A1 são em modo *peace*: as Ameaças do Mundo são removidas entre as rodadas, então medem só a economia.** Em 7 pares peace × world (4 jogadores, seed 1, indicativo) a Revolta sobe de 3,8% para 25,5% das rodadas-assento quando as Ameaças existem. A execução foi interrompida por carga de CPU, então **as diferenças entre perfis são indicativas, não estatísticas**.

### 3.1 Geometria do calendário
| Perfil | Rodadas/Era | Ordens totais (×5) | Início das Eras |
|---|---|---|---|
| 21 | 3 | 105 | 1/4/7/10/13/16/19 |
| 35 | 5 | 175 | 1/6/11/16/21/26/31 |
| 49 | 7 | 245 | 1/8/15/22/29/36/43 |

O Pulso do Mundo cai 7 vezes em todos os perfis (1 por Era): em 21 rodadas ele pesa 2,3× mais por rodada que em 49.

### 3.2 Desenvolvimento por perfil
Nível máximo atingido (média de todas as políticas) × teto de nível da Era:

| Perfil | Era I | II | III | IV | V | VI | VII | atingimento do teto na Era VII |
|---|---|---|---|---|---|---|---|---|
| teto da Era | N2 | N3 | N4 | N5 | N6 | N6 | N7 | — |
| 21 | 1,6 | 2,0 | 2,3 | 2,6 | 2,9 | 3,4 | 3,8 | 55% |
| 35 | 1,6 | 2,3 | 2,8 | 3,4 | 3,8 | 4,0 | 4,1 | 59% |
| 49 | 1,8 | 2,7 | 3,4 | 4,2 | 4,3 | 4,5 | 4,6 | 66% |

Por política na Era VII (cidades · nível máx. · avanços): Crescimento 21: 2c·N4,5·14p; 35: 2c·N5,2·21p; 49: 2c·N5,6·28p. Pesquisa 49: 2c·N4,9·40p (a mais alta em avanços). Expansão 49: 3,1c·N3,4·27p. Militarização 49: 2c·N3,4·28p. Equilibrada 49: 2,9c·N5,6·29p (a única que sustenta quase 3 cidades e N5,6).

Avanços liberados × feitos na Era VII: 21: 16,1/53; 35: 23,6/53; 49: 30,4/53. Em todos os perfis a árvore fica abaixo de 60% concluída.

**Mesmo em 49 rodadas nenhuma política chega a N7 em média; o Equilibrada em 49 chega a N5,6.** Em 21 rodadas o melhor perfil (Crescimento) termina em N4,5. O portão mínimo viável calculado pela lane A2D (rodada mais cedo possível, jogo perfeito): N3 = r6, N5 = r16, N7 = r31 no calendário de 35; N7 exige 17 avanços (72 Conhecimento), 36 Madeira, 24 Pedra, 18 Riqueza e 16 crescimentos seguidos de população (48 + 80 de sustento = 128 Alimento). Uma capital única jogada à mão chegou a N7 em 2 de 9 execuções, na rodada 31 exata, usando ≈ 62 das 155 Ordens.

Conclusão: **o freio das cidades não são as Ordens, são os recursos (Conhecimento, Madeira, Pedra) e o crescimento populacional de +1 por cidade por rodada**, que não escalam com o tamanho da Era. A medida direta: "Ordem ociosa" em 56% (21), 66% (35) e 73% (49) das rodadas-assento, com 1,2–1,5 Ordens ociosas por rodada.

### 3.3 Gargalos de Elevar
Por cidade-rodada (G): Elevar pronto 46% (21), 52% (35), 53% (49); bloqueado por população 34%/30%/29%; por Era 0%/2%/6%; por avanço da Teia 9%/7%/5%; por recursos 11%/10%/8%. O recurso que falta é Madeira (11%/8%/4%), depois Pedra (2–3%) e Conhecimento (0–1%). Pesquisa sem Conhecimento: 21%/30%/35% das tentativas; pesquisa "sem nós" 44%/34%/28%.

População é o bloqueio dominante em todos os perfis, e é o único que não depende de Ordem alguma além de Produzir (Crescer custa 3 Alimento e roda na manutenção): é um relógio. Em 21 rodadas ele não pode correr mais depressa.

### 3.4 Ordens para sustentar 1, 2, 3 cidades (pergunta C)
Medido (D2, todas as políticas): 

| Cidades | Produzir/rodada | Governar/rodada | manutenção/rodada | % das 5 Ordens | Alimento produzido | consumido | descartado |
|---|---|---|---|---|---|---|---|
| 1 | 0,53 | 0,04 | 0,57 | 11% | 3,8 | 2,9 | 0,4 |
| 2 | 1,79 | 0,03 | 1,81 | 35% | 18,1 | 9,3 | 7,5 |
| 3 | 2,36 | 0,48 | 2,84 | 55% | 21,1 | 10,7 | 9,5 |
| 4 | 3,85 | 0 | 3,85 | 76% | 31,3 | 12,1 | 18,5 |

Mínimo modelado (E2, população no teto + guarnição, rendimento medido por nível): **0,39–0,62 Produzir por rodada por cidade**, ou 1,2–1,9 Ordens para 3 cidades (24–37% das 5). As políticas usam 55% porque Produzem mais do que consomem e **descartam 9,5 Alimento por rodada** com 3 cidades (≈ 45% do produzido). A causa é o limite de Alimento 15 contra rendimento de 6–17 Alimento por Produzir: um Produzir de N4+ (12–17) enche o armazém numa rodada, então a cidade fica sem produzir 1–2 rodadas e depois produz em bloco, e o excedente é descartado. Em termos de desenho: o custo de "manter 3 cidades" é **≈ 1/3 das Ordens se o jogador planejar bem, ≈ 1/2 se jogar em blocos**. É uma consequência de produção explícita + limite de armazém, não um erro de conta.

Opções a comparar (não aplicadas): (1) elevar o limite de Alimento (Celeiro/Armazém, hoje inconstruíveis por E-3a — corrigir E-3a já devolve parte); (2) permitir que Produzir de uma cidade com Capacidade ≥ 3 renda menos por hex e mais frequente; (3) nada, e comunicar com previsão (E-6).

### 3.5 Outros recursos (C, todas as políticas)
| Recurso | produção/rodada | gasto/rodada | descarte | % rodadas no limite | observação |
|---|---|---|---|---|---|
| Alimento | 16,8 | 0,28 + 10,55 consumo | 7,09 | 3% | superprodução em blocos |
| Madeira | 2,52 | 1,15 | 1,68 | 34% | gasta em Elevar (0,6) |
| Pedra | 0,34 | 0,34 | 0,23 | 10% | |
| Metal | 0,01 | 0 | 0,01 | 1% | nenhuma política gasta; 26% das rodadas em 0 |
| Riqueza | 0,18 | 0,39 | 0,64 | **47%** | parada no limite; só serve de substituto de material |
| Conhecimento | 1,27 (+0,96 outras) | 2,27 | 0,07 | 2% | **demanda > oferta**; pesquisa 2,2/rodada |
| Influência | 0 (+0,38 outras) | 0,20 | 0,23 | **28%** | quase sem demanda; parada no limite |
| Cultura | 0 (+0,06) | **0** | 0 | 0% | **sem demanda efetiva e custo nunca debitado (E-7)** |

---

## 4. Conhecimento, Influência e Cultura (E-3 aprofundado)

Classificação por recurso, conforme a lane A2D e os fluxos de A1:

| Recurso | Fontes existentes | Classificação |
|---|---|---|
| **Conhecimento** | Eruditos (1 por par; 2 pares sem Biblioteca); Distrito Acadêmico +1; Governar de governo; Academia/Biblioteca (inconstruíveis, E-3a); instituições (+0,5/rodada); cartas, Pulso, escolhas | **Demanda muito superior à oferta** (oferta 1,27 + 0,96, gasto 2,27; 21–35% das pesquisas bloqueadas por Conhecimento) **e** fonte viável ignorada pelo bot: os bots terminam com 0 Eruditos por lacuna do bot (alocação com `floor`, não garante pares, Soldados primeiro, ignora o `roles` da persona); medido par de Eruditos em 4–19% das rodadas-assento; Aurélia, Valgard e Kor não têm outra fonte além de Eruditos e Ação Cívica |
| **Influência** | Ação Cívica (+1 por Ordem, por Cidade e por ativação); passivo +1/rodada em 2 de 10 civs (saren, solenne); cartas da civilização; conselheiros; Obras de Legado; Ressonância | **Existe fonte; é cara; sem demanda.** O relatório parcial errou ao dizer que não tinha: a Influência não está em `cityYield`, mas tem 5 fontes. Estoque 7,2 e no limite em 28% das rodadas: sobra, não falta. Os bots só usam Ação Cívica para integrar cidades ocupadas e nunca contratam conselheiros nem jogam cartas da civilização. Demanda: Reivindicar Hex (0,2/rodada) e a Hegemonia Cultural (25, inalcançável por E-3b) |
| **Cultura** | Distrito Cultural +1; Templo +1 (**inconstruível**); Ressonância; escolha do Pulso (+2) | **Fonte desbloqueada tarde demais / quase sem fonte** (+0,06/rodada) e **sem demanda efetiva porque o custo não é debitado (E-7)** |
| **Metal** | Mina sobre jazida com Produtor | Fonte viável mas **economicamente irrelevante**: produção 0,01/rodada, nenhuma política gasta; Fortificações de Era IV+ usam Metal |
| **Riqueza** | Mercadores (1/par), Distrito Comercial, rotas, Banco/Tesouro (inconstruíveis) | Sem demanda: parada no limite em 47% das rodadas |

Por que os bots do relatório parcial terminaram com 0 Eruditos: não existe papel padrão (todo habitante novo nasce `unassigned`); reatribuição é livre, 1 vez por cidade por rodada; o bot não garante pares; a UI de População é um campo numérico sem prévia de rendimento, e o texto de "Disponível" diz "arraste" (não há arrastar). É **lacuna do bot e da UI, não da regra**; a regra é só dura (par exato).

Não se propõe geração automática. Ordem de correção por impacto: E-3a (edifícios inconstruíveis) devolve Templo, Biblioteca, Academia, Armazém, Banco; E-7 dá sentido à Cultura; E-3c remove promessas sem leitor ou implementa as 17; E-3b realinha limites de Hegemonia.

---

## 5. Requisitos efetivos N1–N7 (tabela real)

Tabela de `ELEVATE_TABLE` + escada (`alpha-city-ladder.ts`), com o portão de Era calculado nos três calendários (rodada em que a Era mínima começa):

| Nível | Pop. mín. | Capac. | Vagas | Custo de Elevar | Avanço na Teia | Era mínima | Portão de rodada (21/35/49) |
|---|---|---|---|---|---|---|---|
| N2 Povoado | 4 | 1 | 1 | 3 Madeira | web-agriculture | I | 1/1/1 |
| N3 Vila | 6 | 2 | 2 | 4 Madeira, 2 Pedra | web-masonry | II | 4/6/8 |
| N4 Cidade | 8 | 2 | 3 | 5 Madeira, 3 Pedra, 2 Riqueza | web-engineering | III | 7/11/15 |
| N5 Grande Cidade | 11 | 3 | 4 | 6 Madeira, 5 Pedra, 3 Riqueza, 2 Conhecimento | web-urbanism | IV | 10/16/22 |
| N6 Metrópole | 14 | 3 | 5 | 8 Madeira, 6 Pedra, 5 Riqueza, 3 Conhecimento | web-sanitation | V | 13/21/29 |
| N7 Metrópole Imperial | 18 | 4 | 6 | 10 Madeira, 8 Pedra, 8 Riqueza, 4 Conhecimento | web-sanitation + web-world-metropolises | VII | 19/31/43 |

(O nível N1 é o Posto de fundação.) Rodada mínima real (A2D): **N3 = r6, N5 = r16, N7 = r31** no calendário de 35 — igual ao portão de Era, ou seja, **no jogo perfeito o portão é a Era**; fora do jogo perfeito, é população e Conhecimento.

Rendimento medido de um Produzir por nível (A1 tabela E): Alimento 6,2 (N1) · 7,2 (N2) · 9,7 (N3) · 9,6 (N4) · 13,7 (N5) · 13,3 (N6) · 20,6 (N7); sustento no teto de população 2/3/4/6/7/9/10 Alimento por rodada. Madeira por Produzir: 0,6/1,0/1,6/1,8/2,5/3,6/7,3 — **o custo de Elevar em Madeira é 3/4/5/6/8/10 e uma cidade N1–N4 rende 0,6–1,8 Madeira por Produzir**: obter 5 Madeira é 3–8 Produzir. Isso explica Madeira ser o recurso que mais bloqueia Elevar (4–10%).

Hipóteses "caminho de uma estratégia razoável" (A2D, capital única com 3 políticas de Eruditos): 2 de 9 chegaram a N7 em r31; 7 de 9 terminaram entre N3 e N6, as seeds 2–3 caíram em fome → Ânimo 0 → Revolta (E-1). Não confirmei fora da amostra.

---

## 6. Combate: casos reproduzidos

Reproduções em `tests/v12-audit-combat-*.test.ts` (50 testes: 31 verdes de guarda + 19 `it.fails` de REPRO que passarão a falhar, e então viram `it`, quando o bug for corrigido). A arena compartilhada `tests/alpha-arena.ts` dá +5 Movimento ao jogador 1 (o schema aceita 2), o que esconde B-01; a fixture nova não tem isso. Baseline antes e depois: 13 arquivos / 202 testes verdes. Comando: `npx vitest run tests/v12-audit-combat-flow.test.ts tests/v12-audit-combat-sync.test.ts tests/v12-audit-combat-siege-naval.test.ts`.

Fluxo completo coberto: declaração de guerra → ordem de ataque → reação (CONFLITOS, cartas, Postura, prioridade de baixas) → força → resultado → perdas → retirada/captura → estado persistido. Casos prioritários: B-12, B-01, B-02, B-10, B-08, B-13, B-03b, B-06 (detalhe e `file:line` na lane B). A matemática de combate não foi alterada em nenhum ponto.

Não coberto: combate anfíbio e naufrágio por combate só por leitura de `alpha-combat.ts` e cenários sintéticos de `settleCargo`; nenhuma das 108 partidas da lane C teve guerra naval.

---

## 7. Pioneiro e água
Veredito: **não há Pioneiro (nem peça terrestre) em `SEA` fora de barco**. O que o jogador vê é COAST pintada como mar (UX-2). O defeito real e relacionado é WORLD-11 (povos/acampamentos/piratas em terreno provisório) e WORLD-10 (`CLAIM_HEX` em Região fechada deixa Pioneiro numa Região fechada). Scanners: `tests/v12-audit-pioneer-water.test.ts` (19 testes, 4 `it.fails`: RULE-3, WORLD-10, UX-1, WORLD-11), `scripts/alpha-world-invariants.mjs`.

## 8. Presets
Medido em 16 seeds × 3 tamanhos (`docs/evidence/v12-lane-c/`, `scripts/alpha-world-topology.mjs`): CONTINENTAL parte o oceano da borda em 8–11 corpos em 100% dos mundos; MAR INTERIOR cria ilhotas de jazida em 92–97%; ARQUIPÉLAGO tem corredor de terra entre Pátrias em 55–75% e ilhotas < 7 hexes em 64–96%; **só o ARQUIPÉLAGO tem mar de verdade** (maior corpo ≈ 52–55 hexes); MISTO só tem poças (≈ 5 por mapa). Diagnóstico: o problema é **topológico** (corpos d'água fragmentados e ilhotas) e **mecânico** (Porto/navios aceitam poças e `isPort`≠`harborHex`), com um componente **visual** (COAST). Não é problema de embarcar. Sem novo terreno `LAKE`. Preservado em todos os mundos medidos: Regiões de 7 hexes, rotação que mantém jazidas e terreno já observado, Pátrias, metal a ≤ 2 Regiões, Distrito Marítimo exigindo aresta d'água. `tests/v12-audit-world-connectivity.test.ts` (21 testes, 11 `it.fails`).

## 9. Ações por cidade
Resultado da lane A2D: a penalidade da 2ª ativação está implementada onde o canon manda (`alpha-urban.ts`, GUARD U-10); os governos conferem com o canon, exceto a Teocracia (sem Templo, E-3a). O que falta é consistência de Planejamento (U-1…U-8, 5% das Ordens perdidas) e de interface (F-14, F-06, F-12, E-3d). `plannedUrbanActions` conta Avanço como ativação e esconde a 2ª ativação real. Testes: `tests/v12-audit-urban-{planning,display,sources}.test.ts` (18 verdes + 20 `it.fails`).

---

## 10. Plano de correções mínimas

Ordem proposta; **BUG** = implementação contradiz canon/UI e pode ser corrigida sem decisão de balanço; **RULE/BALANCE** = precisa de aprovação (valor ou comportamento).

### Fase 1 — BUG sem decisão de design (pequenas, locais, com teste)
1. **E-7** `alphaCanAfford`/`alphaPay` passam a tratar `culture`. *Atenção:* reduz Governar gratuito; medir junto com 2.
2. **B-12** cliente exige `pair.includes(self)`. **B-01** ATTACK exige só adjacência + `canEnter`.
3. **F-01** não disparar dicas em `ERA_TURN`/conflito/replay. **F-14** motor exporta `cityActivationsLeft` e a projeção o entrega.
4. **WORLD-11** pinar hexes de povo e ameaça em `profileOf`/`explorationAccess`.
5. **U-1…U-8** validar plano novo sobre projeção dos planos guardados.
6. **B-10/B-08/B-09, F-08/F-09** eventos de resolução para captura, ordem que falha, Pacto Defensivo e escassez/descarte.
7. **E-3a** edifícios inconstruíveis: alinhar `urbanOptions`/`UrbanBuildTargetSchema` ao `ALPHA_BUILDINGS` de 29 edifícios. **Maior mudança de BUG**: devolve Templo, Armazém etc.; mede-se antes/depois porque altera a economia.
8. **E-3d, F-06, F-12** mostrar na UI o que o motor aplica.

### Fase 2 — Decisão A aprovada (Revolta)
9. Governar emergencial (§2.3). Recomendado Ânimo **4**; confirmar 3 ou 4.

### Fase 3 — RULE/BALANCE que precisam de decisão e de comparação antes/depois
10. **F-T1** Bando volta ao Acampamento (reduz assaltos 26→11 QUICK). RULE, medido.
11. **E-3b** limites de Hegemonia (25 Influência/30 Riqueza contra teto 18/24).
12. **E-3c** 17 promessas da Teia sem leitor: implementar ou retirar texto.
13. **B-13/B-03b/B-06** janela de Conflitos, refúgio da pilha derrotada, Frota ocupando cidade vazia.
14. **F-05** ordem sustento → Crescer → manutenção militar versus previsão.
15. Ritmo de 21 rodadas (§3.2): modelos a comparar — (a) condições iniciais da partida curta (população/Alimento inicial maior); (b) custo de Crescer 2 em vez de 3 só no perfil curto; (c) multiplicador de Conhecimento do perfil curto; (d) nada, com a partida curta declarada "estilo sprint" com tetos de Era reduzidos. **Nenhum será aplicado sem medição de 5 políticas × 2/4 jogadores.**
16. Presets (WORLD-2…9): decisão de produto sobre números travados do V5.1a; correção mecânica barata: corpo navegável ≥ 7 hexes e `isPort = harborHex !== null` (RULE-1/2).
17. Nomenclatura Saqueadores/Piratas (lista de 26 linhas); `THREAT_NAMES` como fonte única.
18. LEGACY: renderizar `LegacyRoom` em vez do tabuleiro quando `room.legacy`; guarda de teste `OLD_NAMES`.

### Pendências de decisão (resumo)
- **Governar emergencial: Ânimo 3 ou 4** (3 falha no cenário fome + peças; recomendado 4).
- **E-7**: aceitar que Governar passe a custar Cultura de verdade.
- **Ritmo curto (21)**: qual dos modelos medir.
- **Bando e Ânimo**: F-T1 antes de mexer em Poder/composição (playtest humano de defesa).
- Limites de Hegemonia e promessas da Teia sem leitor.

## 11. O que ainda não foi feito
- Lanes B/C/E/F não foram revisadas por mim linha a linha.
- Matriz A1 incompleta (6 jogadores com 1 seed; processos interrompidos por carga de CPU).
- Nenhum screenshot do playtest foi visto: F-02, F-17, UX-2, UX-3, LEGACY-1 sem confirmação em tela.
- Suíte completa não foi rodada (só testes direcionados), conforme combinado.
- Nenhuma correção de motor/UI foi implementada.

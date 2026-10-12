# Alpha V1.2 · Fase 3 — relatório consolidado

Branch `stabilize/alpha-v1.2-audit` (a partir do RC4 `dca181a`). Nada foi publicado: sem push, sem deploy, sem merge em `main`, sem tag `frozen`. Documentos de apoio: `alpha-v1.2-phase3-catalog-closure.md` (especificações, Quartel, Arquivo), `alpha-v1.2-phase3-checkpoint-21p4.md`, `alpha-v1.2-hegemony-audit.md` (revisado), `match-report-v1-design.md`.

## 1. Seis especificações propostas (nada implementado)

Detalhes completos (condições, custo, efeito exato, momento, limite, Teia/Heranças, exploits, testes) em `alpha-v1.2-phase3-catalog-closure.md`. Resumo:

| Edifício | Custo (canon) | Efeito proposto | Limite |
|---|---|---|---|
| Moinho | 2 Madeira, 1 Pedra | Ao Produzir: **+1 Alimento por Fazenda efetivamente trabalhada nesta ativação, máx. +2** | por cidade; não rende em Revolta; não é automático |
| Observatório | 3 Pedra, 3 Conhecimento | Dicas de exploração (as que o jogador já tem direito) para Regiões fechadas a **até 6 hexes da cidade** (hoje 4 de uma peça) | só informação: não revela, não substitui o Pioneiro |
| Tribunal | 3 Pedra, 1 Riqueza, 2 Influência | A 2ª ativação da cidade **não custa o −1 de Ânimo**, **1 vez por rodada por civilização** | Governar continua pago (Cultura/Riqueza e uma Ordem) |
| Arsenal | 2 Pedra, 3 Metal | **−1 Metal** em Cavalaria e Cerco recrutados na cidade (piso 0) | depois de todas as validações; precisa de um avanço que o abra (proposta: `building:ARSENAL` em Engenharia) |
| Estaleiro | 4 Madeira, 2 Metal | Frota/Barca: **−1 Riqueza** ao recrutar; **até 2 navios** ancorados na cidade não pagam a manutenção de Riqueza | não cria classe de navio nem é requisito |
| Farol | 3 Pedra, 1 Madeira, 1 Riqueza | Pilhagem pirata no porto rouba **1** (em vez de 2); o bloqueio exige **2** embarcações armadas inimigas | não revela Região; não soma com a Herança "Rede de Faróis" |

Achado paralelo: as tags `unit:*` da Teia **não são lidas** no recrutamento (só Era, distrito Militar e porto); Cavalaria e Cerco hoje não exigem o avanço que os "abre". Isso precisa de decisão separada (D-UNIT); o Arsenal foi escrito para funcionar nos dois casos. Também corrigi o texto de Formações de Guarda ("Distrito Militar, ~~Quartel~~, Guarda"; tag e id mantidos).

## 2. Plano seguro para o Arquivo Acadêmico

Auditado: a exigência de distrito do Arquivo mora no **snapshot** (`core.config.territory`), então mudar o **padrão** só vale para jogos novos e saves RC4 seguem com o que carregam. Um Arquivo já construído nunca é revalidado contra o distrito (o +5 de Conhecimento lê a presença do edifício). Medi o impacto trocando só o padrão (experimento descartável, revertido): **3 testes falham, todos por fixarem o comportamento antigo** (`alpha-match`, `compendium-onboarding`, `territory-infrastructure`); bots e compatibilidade de snapshot seguem verdes. **Plano**: um commit com a constante e os 3 testes atualizados, mais testes novos (RC4 com Administrativo ainda constrói; jogo novo exige Acadêmico; Arquivo existente mantém +5 após salvar e carregar; núcleo e `buildBlock` concordam). Não apliquei, porque você condicionou a mudança à aprovação do plano.

## 3. Quartel (e Centro cultural)

Continuam fora. **Retirar o Quartel não impossibilitou nenhum recrutamento**: `recruitBlock` valida Era, **distrito Militar** (Guarda, Atiradores, Cavalaria, Cerco), porto (navios), reserva, pilha e recursos, e não lê nenhum edifício; teste novo trava isso. O distrito Militar continua construível. Um Quartel antigo em save continua válido e sem efeito.

## 4. Comparação ampliada dos modelos de 21 rodadas

Ameaças R1 ligadas, recuperação emergencial ligada, políticas Equilibrada, Crescimento e Pesquisa, pares (mesma política, seed e civilização). Δ contra o baseline (↑/↓ = pares melhores/piores):

| Perfil | n pares | Modelo | População | Nível máx. | Edifícios | Avanços | Prestígio | Fome (pp) | Revolta (pp) | Ânimo |
|---|---|---|---|---|---|---|---|---|---|---|
| 21 r, 4 j | 18 | M1 | +3,5 (17↑) | +0,25 | +0,7 | +1,7 | −1,0 (13↓) | −1,0 | −0,2 | +0,17 |
| | | **M1+M4 15%** | +1,1 | **+0,47** (15↑ 0↓) | **+1,1** (18↑) | +1,3 (18↑) | −0,9 (13↓) | **−2,6** | **−1,9** | +0,43 |
| 21 r, 6 j | 9 | M1 | +3,6 (9↑ 0↓) | +0,57 | +0,8 | +1,7 | −0,8 | −0,5 | +0,5 | +0,15 |
| | | **M1+M4 15%** | +0,6 | **+0,52** (8↑ 0↓) | **+1,1** (9↑) | +0,9 | −0,7 | +0,1 | 0,0 | +0,34 (9↑) |
| 35 r, 4 j (controle) | 4 | M1 | +6,8 | +0,31 | +0,9 | +2,8 | −1,1 | −5,5 | −5,5 | +0,34 |
| | | M1+M4 15% | +1,9 | +0,38 | +0,7 | +2,2 | −1,0 | −6,1 | −6,1 | +0,12 |
| 49 r, 4 j (controle) | 4 | M1 | +1,9 | −0,12 | +0,1 | +2,1 | −0,3 | −5,4 | −4,3 | +0,07 |
| | | M1+M4 15% | +2,4 | +0,44 | 0,0 | +1,5 | −1,3 | −7,3 | −7,4 | +0,23 |

Leitura: o Candidato A mantém o ganho de nível e de construção em 4 e 6 jogadores sem custo em fome nem Revolta (em 4 jogadores, menos); em 35 e 49 rodadas não regride (amostra de 4 pares, só controle). Tabelas completas por métrica (N3–N7, distritos, Conhecimento, Cultura, exércitos, Ordens ociosas, assaltos…) em `docs/evidence/v12-audit/e3/summary-*.md`. **Nenhum modelo foi aplicado ao motor.** N6/N7 não aparecem em 21 rodadas em nenhum modelo; Obras e Hegemonia estão na seção 6.

## 5. Por que o M1 perde Prestígio

M1 perde −1,0 por civilização (erro-padrão 0,34) no pareamento de 54 partidas. Decomposição pelas fontes:
- **Regiões exploradas: −0,94 (EP 0,18)**: com M1, a política passa **+7,8 Ordens para Cidade** e **−4,1 de Expedição** por civilização; a correlação entre menos Expedição e menos Regiões é +0,70.
- Ambições +0,14, "resto" −0,21 (não significativo).
- Por política: Crescimento −1,6 (quase tudo exploração), Pesquisa **+1,3**, Equilibrada −2,8 (só −0,6 é exploração).
- **Atribuição por comando** (4 partidas de Equilibrada com o instrumento): **55% de todo o Prestígio** vem de `RESOLVE_CHOICE`: as Repercussões (opção "Prestígio +1") que a harness sempre resolve pela primeira opção; elas caem 62 → 53 com M1, e a perda em Regiões é −5 pontos. O mecanismo exato que liga M1 a menos Repercussões **não foi isolado**; a Crônica passa a registrar `resonance.cycles`, o que permite isolá-lo em partidas reais.
- **Teste com uma política que prioriza explorar** (Expansão, 16 civilizações): M1 **+0,12 (EP 0,45)** e Candidato A −0,19 (EP 0,41): **sem perda de Prestígio**, mesmo cedendo 2,7 a 3,4 Ordens de Expedição.

Conclusão: o −1 é **custo de oportunidade de Ordens dependente da política**, não menos pontuação por desenvolvimento nem menos oportunidades de pontuar. **Sem compensação artificial.**

## 6. Viabilidade de uma Obra de Legado (cenário intencional)

Política de simulação com a opção `AOH_POLICY_OBRA`: termina a Obra em andamento, senão inicia a mais barata que alguma cidade possa começar (distrito, Capacidade 2, avanço, custo do passo), com pontuação acima de Construir e abaixo de Elevar/Pesquisa. Pareada contra as mesmas partidas sem Obra (21 rodadas: 4 seeds; 35 rodadas: 2 seeds).

| Perfil | Modelo | Obras iniciadas / concluídas (16 ou 8 civilizações) | Rodadas de início | Δ Prestígio | Δ Ordens de Cidade | Δ população | Δ nível |
|---|---|---|---|---|---|---|---|
| 21 r | baseline | 4 / 3 | 8, 10, 10, 20 | +0,75 | −0,6 | −0,5 | −0,25 |
| 21 r | M1+M4 15% | 6 / 6 | 5, 5, 5, 5, 10, 11 | +1,44 | −0,75 | −0,1 | −0,2 |
| 35 r | baseline | 3 / 2 | 29, 31, 33 | +1,25 | 0 | 0 | −0,1 |
| 35 r | M1+M4 15% | 5 / 5 | 7, 8, 11, 12, 14 | +2,88 | −0,6 | +0,75 | 0 |

- **Viável**: custa **3 Ordens de Legado + 12 a 16 recursos** (limites de estoque 15/20 comportam) e dá **+4 Prestígio**, o que é **~1,3 Prestígio por Ordem, cerca de 5× a exploração** (~0,24 por Ordem de Expedição nos mesmos dados). O sacrifício medido é **~0,6 a 0,75 Ordens de Cidade por civilização** (as 3 Ordens de Legado); população, nível, edifícios, avanços, fome e Revolta não pioram além do ruído (n pequeno).
- **O gargalo é o distrito**: dos bloqueios registrados, ~75% são "a cidade precisa do distrito que serve de pré-requisito"; duas Obras ainda exigem Síntese/Renascimento (Era VI+); "única no mundo" entra em 4 a 10% dos bloqueios: as 12 Obras são disputadas pelas civilizações.
- Observação de balanço (sem mudar nada): a relação +4 Prestígio por 3 Ordens é a mais barata do jogo; como o desempate do limite de rodadas é o Prestígio, vale acompanhar nas partidas reais se as Obras viram o caminho dominante.

## 7. Auditoria do exploit nos limites de Hegemonia

**Encontrei e corrigi um exploit que a minha correção da Fase 2 criou.** `min(declarado, capacidade do jogador)` fazia da menor capacidade o caminho mais fácil: sem Tesouro/Banco a Riqueza exigida era 15 (e Influência 10, sem Chancelaria), contra 28 para quem construía o armazenamento; o teste da Fase 2 fixava esses valores. Agora: `min(declarado, teto estático das regras)` (`alphaStorageCeiling`: base + um de cada edifício de armazenamento + bônus de Metrópole, limitado ao teto absoluto, **sem depender do jogador**): **Riqueza 28** (declarado 30), **Influência 18** (declarado 25). Tabela comparativa por situação de armazenamento e das Figuras (só a de Meridia sobe a Riqueza, +6; nenhuma sobe a Influência) em `alpha-v1.2-hegemony-audit.md`. As barras ficam alcançáveis por qualquer civilização sem Figura (Tesouro + Banco + Metrópole; Chancelaria + Metrópole) e não triviais. **Divergências com o canon §23 que precisam de decisão futura** (lista completa no mesmo documento): lista de requisitos inteira (V51B-14), marcos ★ com tag `hegemony:X` que o motor não lê, Observatórios/Academias/Tesouros como requisito, Obras exigindo o edifício em vez do distrito.

## 8. Saqueadores: contra-ataque e perseguição

Cenário determinístico (`tests/v12-phase3-raiders-pursuit.test.ts`), no motor real, sem dezenas de partidas: localizar (abrir a Região do Acampamento), aviso de aproximação, defesa, **contra-ataque** com 3 infantes (resolução real de batalha com dados fixos), **perseguição** (movimentos legais com o resolvedor de ordens), Acampamento alcançado e **destruído** (+3 Riqueza e +1 Prestígio, uma vez). Verificado: o Bando recua 1 hex por ativação (velocidade da Ameaça II), **nunca teleporta** (distância ≤ velocidade a cada passo, só terreno legal), é sempre alvo legal, volta ao Acampamento e o reorganiza por uma rodada completa; depois de destruído não deixa fantasma. Achados: uma peça sozinha perde de forma decisiva para um Bando de 4 peças (Força 8); é preciso uma força de 3 ou mais para vencê-lo. As políticas de simulação continuam sem atacar Saqueadores: esta é a prova de que o motor permite, não a medida de como jogadores reagem.

## 9. Estado dos testes e das pendências

**Execução integral em condições quietas** (nenhuma simulação nem navegador rodando, 3 workers, `nice`): **129 de 129 arquivos passam, 1469 testes passam + 56 `it.fails` esperados, 0 falhas, 0 timeouts, 84,6 s.** O arquivo mais lento foi `alpha-bot-playtest` (56 s), seguido de `alpha-http-matches` (34 s) e `v12-audit-pioneer-water` (32 s), todos abaixo dos seus limites. Isso resolve o gate que estava inconclusivo: os 14 timeouts da execução anterior eram da máquina (a execução de 83 minutos coincidiu com suspensão e carga), não de funcionalidade. Nenhum timeout foi aumentado e nenhum teste foi removido para produzir verde.

Demais gates, todos com saída 0: `tsc -b` (pacotes), `tsc` dos testes, do e2e e do web, `eslint . --max-warnings 0`. Playwright: `e2e/alpha-conflict.spec.ts` (inclui agora a Crônica da Partida: seis seções, exportação JSON, captura de evidência) passa; antes, nesta fase, os 24 e2e dirigidos da Fase 2 já estavam verdes e não foram alterados.

**Pendências**
- Seis edifícios (Moinho, Observatório, Tribunal, Arsenal, Estaleiro, Farol) seguem fora até a aprovação das especificações; Quartel e Centro cultural seguem fora; seis ids "UNDEFINED" do canon seguem fora.
- Arquivo Acadêmico: plano pronto, não aplicado.
- Candidato A: não incorporado ao motor.
- Políticas de simulação ainda não atacam Saqueadores nem constroem Obras por conta própria (o cenário de Obra é opt-in); o contra-ataque foi provado por teste, não medido por comportamento.
- Amostras pequenas: 4 pares nos controles de 35 e 49 rodadas e 9 pares de 6 jogadores; qualquer conclusão sobre dominância depende de dados ao vivo (a Crônica e o agregador existem para isso).
- Cultura continua sem fluxos no ledger legado (só estoque).
- Fora do Alpha: o Compêndio da tela legada `/play` ainda cita o Quartel.
- Sistema de relatórios: partidas encerradas antes dele não têm relatório gravado (ganham um reconstruído em memória); relatórios de partidas ao vivo exigem a produção real para ter dados humanos.

## 10. Commits locais da Fase 3

Ver `git log` da branch: `6e4f9fc` (Hegemonia: teto estático; teste de perseguição), `097f084` (fechamento do catálogo; texto da Teia; atribuição de Prestígio e opção de Obra na harness), `ae0658b` (os 5 edifícios do núcleo funcionam), `64950b8` (checkpoint das 54 partidas), `86a765e` (sistema de relatórios) e `41d6368` (e2e da Crônica).

## Decisões que preciso de você

1. Aprovar (ou ajustar) cada uma das seis especificações; D-UNIT (exigir o avanço de unidade no recrutamento?).
2. Aprovar o plano do Arquivo Acadêmico (default-only, sem migração de saves).
3. Candidato A como regra de 21 rodadas (só depois de mais dados ao vivo).
4. Se as Obras (+4 Prestígio por 3 Ordens) devem ser acompanhadas ou ajustadas antes do deploy.
5. Hegemonia: trocar a lista pelo canon §23 e as Obras para exigir edifício.

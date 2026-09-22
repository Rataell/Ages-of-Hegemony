# Auditoria total e playtest técnico — Ages of Hegemony Alpha v0.1

- Data: 2026-09-21
- Branch: `feature/aoh-alpha-full-audit-v1` (criada a partir de `f0a99a3`, shell da Fase 1)
- Escopo: descobrir, testar, registrar, reproduzir e classificar. Nenhuma feature nova. Correções apenas pequenas, inequívocas e de baixo risco (seção 21).
- Evidências: `docs/audit/evidence/alpha-full-audit/` (scripts em `harness/`, resultados em `results/`, capturas em `screens/`). Nenhum cookie, senha, URL de banco ou segredo foi salvo.
- Não houve merge, push nem deploy. `main` não foi tocada. O servidor de desenvolvimento do usuário (porta 3001) e `apps/web/.env.local` não foram alterados.

---

## 1. Resumo executivo

A Alpha está tecnicamente sólida: **0 P0**. Sessão, isolamento entre jogadores, fog of war, CAS de versão, prazos, paridade prévia/engine de combate e paridade das opções urbanas se sustentaram em todos os testes. Nenhuma resposta 5xx, nenhum aviso de hidratação, nenhum `unhandledRejection` e nenhum acesso ao Prisma em modo memória apareceram em ~23 mil requisições atendidas pelo servidor de auditoria.

O maior risco não é um bug: é **alcance de jogo**. Em partidas QUICK de 2, 4 e 6 pessoas (9 rodadas completas cada, sem anomalias de integridade) e num "rush" dirigido de 2 jogadores (9 rodadas QUICK e 15 rodadas STANDARD) **ninguém chegou a fazer contato com outra civilização**. Diplomacia, tratados, guerra, rotas e combate existem e passam nos testes de engine, no Monte Carlo e no E2E, mas uma partida real de teste não os alcança (GP-1, P1, decisão do dono).

Achados: **P0 0 · P1 1 · P2 5 · P3 7**. Dois P3 foram corrigidos nesta branch (UI-1, BASE-1); todo o resto está registrado, não corrigido, porque exige decisão sobre regra, fluxo, mapa ou navegação.

Partidas completas executadas por HTTP real: **QUICK 2p (9 rodadas), QUICK 4p (9 rodadas), QUICK 6p (9 rodadas, duas vezes)**, mais 2 partidas "rush" (QUICK 9 e STANDARD 15 rodadas). Requisição total registrada pelo harness: 13,6 mil.

Sobre o pedido "Economia de ações da rodada": **não foi implementado** (mexe em fluxo de turno, regra de economia e schema persistido, o que esta auditoria proíbe sem sua decisão). Foi feita a classificação centralizada dos comandos reais (Apêndice A) e uma proposta OpenSpec completa em `openspec/changes/alpha-round-action-economy/` (proposta, desenho, tarefas e spec), em três fatias com aval entre elas. A auditoria já trouxe evidência para essa proposta: o orçamento compartilhado de "pontos de comando" faz decisões baratas (reivindicar terreno) bloquearem decisões centrais (fundar cidade, propor tratado, declarar guerra).

Exit criterion (criar mesa → convidar → escolher civ → iniciar → jogar várias rodadas → governar → pesquisar → mover → explorar → lutar → interagir → avançar eras → terminar sem estados quebrados): **atendido exceto "lutar" e "interagir diplomaticamente" em partida jogada** (GP-1). Combate e Hegemonia foram exercitados pelo E2E `alpha-conflict.spec.ts` (fixture) e pelo Monte Carlo em processo.

---

## 2. Baseline

| Item | Valor |
|---|---|
| Commit base | `f0a99a3 feat(alpha): full-screen game shell foundation (phase 1)` |
| Node / npm | v26.4.0 / 12.0.1 |
| Next / Prisma / Playwright / TypeScript | 16.3.5 (Turbopack) / 7.10.0 (só produção) / 1.63.0 / 5.9.3 |
| SO | Windows 11 Pro 10.0.26100 |

Gates no baseline (antes de qualquer alteração), `evidence/baseline.txt`:

| Gate | Resultado |
|---|---|
| `npm run lint` | ✓ |
| `npm run typecheck` | ✓ |
| `npm test` | **628/629** — 1 falha (BASE-1, teste de guarda com 5 s de limite; reproduziu 3/3 sob carga) |
| `npm run build` | ✓ |
| `git diff --check` | ✓ |
| `openspec validate --strict --all` | ✓ (2/2) |

Gates finais (após as correções da seção 21), `evidence/results/gate-*.txt`:

| Gate | Resultado |
|---|---|
| `npm run lint` | ✓ (0 avisos; ver nota) |
| `npm run typecheck` | ✓ |
| `npm test` | ✓ **631/631** (44 arquivos; 629 anteriores + 2 novos) |
| `npm run test:e2e` | ✓ **6/6** (2,1 min) |
| `npm run build` | ✓ |
| `git diff --check` | ✓ (apenas avisos LF→CRLF do Git, sem linhas ofensoras) |
| `openspec validate --strict --all` | ✓ (3/3, incluindo a nova proposta) |

Nota do lint: os scripts do harness em `docs/audit/evidence/**` são evidência, não produto; foram adicionados às exclusões de `eslint.config.mjs` (263 erros de `no-undef`/`no-unused-vars` neles, 0 no produto).

### Ambiente local (Parte B)

Servidor de auditoria em `127.0.0.1:3002` com `dev:alpha` (zero-config, memória). Para coexistir com o `next dev` do usuário na 3001 (o Next 16 recusa dois `next dev` no mesmo diretório) usei `AOH_E2E=1`, que só troca o `distDir` para `.next-e2e`.

| Verificação | Resultado |
|---|---|
| Sobe sem PostgreSQL, Docker nem migrações; `/api/alpha/health` = `{ok:true, storage:"memory"}` | ✓ (pronto em ~8 s depois do `prisma generate`/`tsc -b`) |
| Porta ocupada | ✓ mensagem clara, código de saída 3, instantâneo, sem derrubar o servidor existente |
| Reiniciar apaga as partidas | ✓ código de convite criado antes → `404 NOT_FOUND "Convite não encontrado."`; sessão antiga → 401 |
| Fast Refresh de `.tsx` | ✓ 879 ms, sem recarregar a página (estado `window` preservado), partida intacta; reverter 10 ms |
| Fast Refresh de `.css` | ✓ 417 ms, sem recarregar |
| Edição em `apps/server` (recompilada por `tsc -b -w`) | ✓ visível na API em 6,3 s; a partida criada antes continua existindo (o armazenamento em memória sobrevive ao recarregamento do módulo); reversão em 3,1 s |
| Edição em `packages/game-engine` | ✓ visível em 4,8 s; partida preservada; reversão em 3,2 s |
| Edição em `packages/game-domain` e `packages/shared` | ✓ servidor e partida seguem saudáveis; o watcher registrou as recompilações e 0 erros TS. O script não mede o instante exato do efeito (edição só de comentário) |
| Todas as edições temporárias revertidas | ✓ `git status` limpo em `apps/` e `packages/` |
| Encerrar o processo | ✓ árvore de processos encerrada com `taskkill /T`: porta liberada, 0 processos órfãos (o `tsc` restante pertence ao servidor do usuário) |
| Ctrl+C literal | **NÃO TESTADO**: o shell da ferramenta não é interativo; substituído pelo encerramento da árvore acima |
| Rodar **sem** `apps/web/.env.local` | **NÃO TESTADO**: o arquivo é do usuário e não foi movido. Coberto por `tests/local-alpha-script.test.ts` (`runZeroConfig`) e pelo `health` em modo memória |

Aviso: as edições temporárias de `packages/*` e `apps/server` recompilam também o servidor do usuário (mesmo diretório), por poucos segundos.

---

## 3. O que funciona

- **Sessão e identidade**: cookie assinado HttpOnly; 6 assentos com 6 cookies distintos; 7º jogador recusado (`LOBBY_CLOSED`) e sem cookie emitido; reentrada do mesmo cookie é idempotente e não renomeia nem duplica o assento; cookie ausente/inválido/adulterado/de outra mesa → 401/403.
- **Endurecimento HTTP**: POST sem `Origin` ou com `Origin` externo → 403; `Sec-Fetch-Site: cross-site` → 403; PUT/DELETE/PATCH → 405; `Content-Type` errado, corpo > 16 KiB, JSON inválido, campo extra, operação ou comando desconhecido → 400; `gameId` inválido → 400.
- **Identidade vem da sessão**: `playerId` forjado em `MANAGE` → 403 e estado do outro jogador intocado; carta/ambição de outro jogador → recusa; mãos privadas, ordens, pesquisa e semente do RNG nunca aparecem na projeção de outros.
- **Criação**: as 19 opções visíveis no formulário (lugares 2–6, duração, mundo, prazo) criam mesa; 24 casos válidos e 13 inválidos por API se comportam como esperado; não há seletor de tamanho de mundo (o motor tem grade fixa de 30 regiões).
- **Convites**: "Copiar código" copia só o código; "Copiar link" copia `/alpha?join=<código>`; falha da área de transferência mostra mensagem legível; o link pré-preenche o código; mesa cheia recusa com mensagem clara.
- **Lobby**: 12 civilizações; duplicada/desconhecida/sem civ recusadas; trocar antes de "Pronto" libera a antiga; "Pronto" trava a troca; "Voltar à preparação" reabre; só o anfitrião inicia, e só com todos prontos; `VERSION_CONFLICT` em versão velha; duas escritas simultâneas → exatamente uma vence.
- **Prazos (relógio falso, sem esperar horas)**: 18/18. Todos os sete valores de prazo geram o deadline certo; uma partida de 2 jogadores inertes termina sozinha por prazos (27 expirações, sem erro); comando após o prazo recebe conflito e é descartado; ambições são escolhidas automaticamente para quem não escolheu; salto de 30 dias avança uma fase por leitura, nunca pula rodada em silêncio.
- **Combate (Monte Carlo, 1 200 batalhas)**: prévia e engine concordam em todas (0 problemas): 609 vitórias do atacante, 591 do defensor, 43 empates, 534 batalhas em cidade, 827 retiradas (373 com perda), 158 avanços parciais.
- **Cidade e território**: 6 rodadas-cidade × 28 opções urbanas, 13–20 bloqueadas por vez: **0 divergências** entre a razão de bloqueio mostrada e a recusa real; custo prévio = custo cobrado; comando recusado não consome recurso parcial.
- **Pesquisa**: avanço pesquisável na rodada 1 (8 de 10 disponíveis); custo cobrado = prévia; segunda ação urbana na mesma cidade recusada; o avanço some da lista.
- **Concorrência (4 jogadores)**: 4 READY simultâneos → 1 aceito, 3 conflitos; três PRODUCE idênticos em paralelo → 1 aplicado; reenvio de requisição antiga → 409; todos os jogadores enxergam a mesma versão depois.
- **Reload/reconexão**: F5, segunda aba, fechar e reabrir mantêm identidade e partida; sem cookie → tela de entrada; sair da partida devolve à entrada e "entrar com o código" volta ao mesmo assento.
- **`alpha:players`**: 2/3/4/6 com e sem `--auto-join --start` (2–9 s); 7, 1 e `--layout=grid` recusados com mensagem; sessões isoladas.
- **Partidas completas** (seção 10): 3 partidas × 9 rodadas, 0 anomalias de integridade.
- **Rate limit** (seção 8): limites, `Retry-After`, recuperação e isolamento entre sessões funcionam.
- **Logs**: 0 respostas 5xx, 0 avisos, 0 erros de hidratação, 0 `unhandledRejection`, 0 uso de Prisma em modo memória (só o `prisma generate` do preparo).

## 4. O que quebrou

Nada quebrou em execução. O que falhou durante a auditoria:

| O que | Natureza |
|---|---|
| `npm test` 628/629 no baseline (BASE-1) | teste com limite de 5 s sob carga; corrigido (seção 21) |
| Uma anomalia "SHOULD_HAVE_BEEN_REFUSED" na partida 2p | **artefato do harness**: a primeira ação urbana esgotou as tentativas por `VERSION_CONFLICT` (política antiga de 1 nova tentativa), logo a "segunda" foi a única aplicada. Refeito com 10 tentativas: 0 anomalias em 4p, 6p e nos rushes. Confirmado por teste direto (s8, s13) que a segunda ação urbana na mesma cidade é recusada |
| Falhas transitórias de `429` no meu próprio harness | os baldes globais de criar/entrar (20/min) compartilhados entre scripts; não é falha de produto (ver RL-1) |

---

## 5. P0 / P1

**P0: nenhum.** Nenhum bloqueio de partida, nenhum vazamento de informação, nenhuma corrupção de estado.

**P1**

- **GP-1 — Contato, diplomacia, guerra e combate não são alcançáveis numa partida real de teste.**
  - Fatos medidos: em 2p, as capitais ficam a **27 hexágonos** (`0,0` e `15,12`); pioneiro/infantaria movem 2, explorador/cavalaria 3; mover só é possível por hexágonos **conhecidos**; cada peça faz **uma ordem por rodada** (explorar *ou* mover); explorar revela uma região de 7 hexágonos sem mover a peça; o contato exige uma peça ou cidade alheia a ≤ 1 hexágono de uma peça, cidade ou território seu.
  - Resultado: bots ruidosos 2p/4p/6p (9 rodadas): 0 contatos, 0 tratados, 0 guerras, 0 batalhas, 1 cidade por jogador. **Rush dirigido** (ambos marcham para a capital do outro desde a rodada 1, com exploradores e infantaria): após **9 rodadas QUICK** a menor distância entre peças era **13**; após **15 rodadas STANDARD**, **7**. `contacts: [0,0]` em todas as rodadas (`results/s12-rush-*.json`).
  - Ressalva: meu rush usa caminho guloso, não é ótimo; prova que uma marcha simples não chega, não que seja impossível.
  - Por que é P1: as mecânicas centrais de interação (o que diferencia um jogo de N pessoas de N jogos solo) não são exercitáveis no formato de teste padrão.
  - Não corrigido: depende de mapa, balanceamento e fluxo (decisão sua). Ver seção 24.

---

## 6. P2

| ID | Resumo |
|---|---|
| **GP-2** | O orçamento de "pontos de comando" (4) é compartilhado por ordens e por `MANAGE` (reivindicar, melhorar, desenvolver, especializar), estrada, era, habilidade da civilização, fundar cidade, tratado, guerra, conselheiro e projeto; ações urbanas ficam de fora e têm limite próprio por cidade. Efeito medido: nos jogos de bot, `SETTLE`, `PROPOSE_TREATY`, `DECLARE_WAR` e `HIRE_ADVISOR` foram recusados com "Sem pontos de comando disponíveis" porque 2 reivindicações + 1 melhoria + 1 estrada já tinham consumido os 4. Códigos de recusa inconsistentes (`COMMAND_LIMIT` só em `MANAGE`; `RULE_FAILURE` nos demais) e frases diferentes. É o insumo da proposta de economia de ações (Apêndice A) |
| **MP-CAS-1** | O compare-and-swap de `expectedVersion` é da **sala inteira**, não por jogador: jogadores planejando ordens privadas em paralelo se atropelam. Medido: rajada de 4 jogadores × 10 comandos válidos em PLANNING → **75 % 409**; nas partidas, 3,7 % (4p) e 7,9–8,2 % (6p) dos comandos precisaram de **mais de uma** nova tentativa; o cliente real tenta **uma** vez. Na partida 2p com política antiga de 1 nova tentativa, 4 de 13 `WORLD_CHOICE` (31 %) falharam depois da nova tentativa. Sem perda de integridade (nenhum comando aplicado duas vezes, versões consistentes), mas com humanos simultâneos em 4–6 lugares é uma fonte de "cliquei e nada aconteceu" |
| **RL-1** | Os baldes anônimo (30/min) e global de criar/entrar (20/min) são **compartilhados por todos**: um cliente sem cookie que dispare 30 leituras faz qualquer visitante novo receber 429 por até 60 s (medido: o 29º pedido anônimo já recebe 429; enquanto isso, `create` novo → 429). Sessões já autenticadas não são afetadas. Aceitável em Alpha fechada; risco real se o link for público |
| **RESP-1** | Em ≤ 900 px o shell não cabe na tela: a página tem 1 789 px de altura em 390×844 e 1 653 px em 768×1024, e o botão de fase fica no fim da página (`top` 1 739 px), sem barra fixa. A Fase 1 atendeu só ≥ 901 px por escopo |
| **RES-1** | A interface ainda usa os rótulos do conjunto legado de 5 recursos ("Materiais") onde o servidor cobra o conjunto de 7 (madeira, pedra, metal). Exemplo medido: melhoria Fazenda mostra custo `materials 1` e cobra `wood 1`. É a tarefa aberta 8.1 de `public-alpha-v0-1-closure` |

## 7. P3

| ID | Resumo |
|---|---|
| **RESP-2** | Em 1024×768 e em 960×600 (zoom 150 % de 1440×900) o `main-nav` transborda na horizontal (rolagem interna); as demais áreas cabem. Em 1366, 1440, 1920 e 1152×720 (zoom 125 %) não há transbordo |
| **UI-1** *(corrigido)* | Hexágono desconhecido dizia "Livre · Controle: nenhum" no tooltip/`<title>`, afirmando algo que o jogador não sabe |
| **BASE-1** *(corrigido)* | Teste `remote database guard … refuses any remote database…` estourava 5 s sob carga (12 processos filhos) |
| **UX-2** | `/alpha` sem `?game=` só retoma a última partida depois que a própria página enviou uma requisição (o `localStorage` só é gravado após um POST). Quem entrou por link `?game=` e só leu cai na tela de entrada ao abrir `/alpha` |
| **API-1** | `INVALID_CHOICE` usa a mesma frase ("Escolha uma civilização disponível antes de confirmar Pronto.") para civilização duplicada, desconhecida e "Pronto sem civilização" |
| **API-2** | Algumas mensagens do motor de gestão saem em inglês pela API ("Cannot afford city development", "Replacing improvements is not available"); a interface traduz por **código**, então o jogador não as vê. Consumidores diretos da API veem inglês |
| **MV-1** | Uma ordem `MOVE` com caminho que volta ao próprio hexágono de origem (A→B→A, custo ≤ mobilidade) é aceita e consome um ponto sem mover a peça |

## P4 (ideias, não classificadas como defeito)

Retomada de partida também depois de só ler por link; `Retry-After` proporcional à janela restante; cabeçalho do balde de convites por IP em vez de global; campo `contactHint`/vigia para acelerar o primeiro contato; painel de "por que fui recusado" unificado; console de fixtures só para dev para exercitar guerra/hegemonia sem jogar 15 rodadas.

---

## 8. Segurança e privacidade

| Verificação | Resultado |
|---|---|
| Sem cookie / cookie inválido / assinatura adulterada / id de outro convidado com assinatura alheia | 401 |
| Sessão de outra mesa lendo esta | 403 `FORBIDDEN` |
| Origem externa, sem `Origin`, `Sec-Fetch-Site: cross-site` (POST e GET) | 403 |
| Método fora de GET/POST | 405 |
| `Content-Type` ≠ JSON; corpo > 16 KiB; JSON inválido; campo extra; operação/comando desconhecidos; `gameId` inválido | 400 |
| `playerId` forjado; carta e ambição de outro jogador | recusado, estado do outro intocado |
| Projeção contém semente do RNG, contador ou estado do núcleo? | não |
| Lista pública de jogadores contém mão, ordens ou pesquisa alheias? | não |
| DOM da página do jogador A contém dados do B (17 segredos procurados no HTML, atributos, `title`, `aria-label`, classes, SVG) | 0 ocorrências |
| Mensagem do 429 vaza detalhe interno? | não (`{"code":"RATE_LIMIT","message":"Muitas solicitações. Aguarde um minuto."}`); `Cache-Control: no-store` |

**Rate limit (Parte Y)**, `results/s10-ratelimit.json`:

| Cenário | Resultado |
|---|---|
| 40 leituras anônimas seguidas | 28 × 401 e depois 12 × 429; 1º 429 no pedido nº 29; `Retry-After: 60` |
| Sessão válida durante a inundação anônima | 200 (não é afetada) |
| Visitante novo criando mesa durante a inundação | 429 (RL-1) |
| Recuperação do balde anônimo | ~60 s, igual ao `Retry-After` |
| 130 leituras de uma sessão | 120 × 200 e depois 429 (1º 429 no nº 121) |
| Outra sessão durante esse teste | 200 (balde por sessão) |
| Escrita da sessão limitada | 429 (um balde por sessão, leitura + escrita) |
| 26 criações de mesa | 20 × 200 e 6 × 429; nenhum 5xx |

Cada aba consome ~24 leituras/min só de polling (6 por 15 s), ou 20 % do orçamento de 120/min da sessão; várias abas da mesma sessão dividem o mesmo balde (risco de 429 perto do limite).

Classificação de todos os 4xx do log de auditoria (18 925 × 200, 2 532 × 400, 1 743 × 409, 43 × 429, 42 × 401, 8 × 403, 6 × 404, 3 × 405; **0 × 5xx**): todos esperados. Os 400 vêm dos casos negativos do harness e das recusas deliberadas do bot (atomicidade verificada: recusa não muda estado); os 409 são o CAS (MP-CAS-1); 401/403/404/405/429 são os testes de segurança e de limite.

## 9. Fog of war

Método: três projeções (A, B, C) por partida, procura de segredos nas respostas JSON, no DOM, em atributos, `title`, `aria-label`, classes e SVG; estado React = exatamente a projeção recebida.

- A projeção de cada jogador traz apenas o que ele conhece (`knownTerritory`, `frontier`, `visibleTerritory`); não há campo de outro jogador com mão, ordens ou pesquisa; ordens e postura defensiva do rival ficam privadas até uma batalha revelá-las.
- Nenhum hexágono não projetado é desenhado (teste do UX round 1 mantido).
- "Visualmente escondido" não é usado como proteção: nada privado chega ao navegador.
- Hexágono desconhecido: só `Desconhecido · q,r` depois de UI-1; antes dizia "Livre".
- Minimapas: **não existem** no Alpha real (o conceito tem), portanto nada a vazar; quando existirem, repetir esta varredura.
- Renderização por dados de outro jogador (inspetor, cidades estrangeiras): só campos públicos.

## 10. Multiplayer 2–6

| Partida | Rodadas | Tempo | Comandos | Anomalias de integridade | Nova tentativa >1 |
|---|---|---|---|---|---|
| QUICK 2p (seed 1) | 9 (`ROUND_LIMIT`) | 427 s | 442 | 0 (1 artefato do harness, seção 4) | n/m (política antiga) |
| QUICK 4p (seed 2) | 9 (`ROUND_LIMIT`) | 484 s | 833 | 0 | 3,7 % |
| QUICK 6p (seed 4, refeita para gravar JSON) | 9 (`ROUND_LIMIT`) | 500 s | 1 203 | 0 | 8,2 % |
| QUICK 6p (seed 3, primeira execução) | 9 (`ROUND_LIMIT`) | 493 s | 1 222 | 0 | 7,9 % |

Cada comando do bot verifica: recusa não altera o estado do próprio jogador; aceite incrementa a versão; nenhum 5xx. Todos os jogadores chegaram à Era **Civilização** e a 2–3 de 5 marcos; 1 cidade cada; 0 contatos.

Cobertura de comandos nas partidas (aceitos/recusados, 4p): postura 36/0; reivindicar 25/6; melhorar 9/27; estrada 5/31; carta de estratégia 23/33; mover 27+7+3; cancelar 28/0; avançar era 8/3; produzir 15/0; recrutar 6/0; construir 5/0; humor 6/0; ação cívica 4/0; governo 4/0; habilidade civ. 29/3; habilidade do líder 7/25; conselheiro 1/3; especializar 4/24; **fundar cidade 0/4, tratado 0/4, guerra 0/1, projeto 0/4, explorar 0/7** (recusas por orçamento, requisitos de era/distrito e distância). O resto das recusas é intencional (casos negativos).

Simultaneidade: seção 6 (MP-CAS-1). Rajada em PLANNING: 40 comandos válidos → 10 × 200 e 30 × 409; sem 5xx; versão final igual para os 4 jogadores; a versão avançou exatamente o número de escritas aceitas (10).

## 11. Loop da rodada

Oito fases: Pulso do mundo → Planejamento → Ações urbanas → Ordens e movimento → Diplomacia e comércio → Conflitos → Integração e manutenção → Fim da rodada. Interativas: 4 (Planejamento, Ações urbanas, Diplomacia e comércio e, só quando há ataque e alguém tem carta de reação, Conflitos).

- Cada jogador confirma **até 4 vezes por rodada** (3 fixas). É o ponto de atrito que o seu pedido de economia de ações quer reduzir; a análise está no Apêndice A.
- Ordens (mover, explorar, comerciar) resolvem em "Ordens e movimento"; ataque e influência em "Conflitos".
- Ordem `MOVE`: um custo por rodada por peça; "cada peça pode participar de apenas uma ordem por rodada".
- Prazos: testados por relógio falso (seção 3).
- Recusa de comando após todos estarem prontos: `ALREADY_READY`.
- Estado de vitória: o jogo fecha por `ROUND_LIMIT` (9/15/20 rodadas conforme QUICK/STANDARD/EPIC) ou por Hegemonia.

## 12. Combate

- Monte Carlo em processo (`s5-combat-montecarlo.mjs`, N = 1 200): 0 divergência entre prévia e resultado.
- Posturas, dados, fortificação e limites de pilha estão cobertos pelos testes do repositório (631 passam) e pelo E2E `alpha-conflict.spec.ts` (dados de batalha, retirada e fim por Hegemonia vistos nas duas perspectivas).
- **Não alcançado em partida jogada** (GP-1). Reações (`PLAY_CARD` em Conflitos) só existem quando há ataque; não observadas ao vivo.

## 13. Economia e cidades

- Recursos: 7 (alimento, madeira, pedra, metal, riqueza, conhecimento, influência) no servidor; UI ainda com rótulos legados (RES-1).
- Pontos de comando: capacidade 4 (`baseCommandPoints`) + modificadores de governo e instituição; usados = `spentCommands + ordens na fila`; zeram por rodada. Medido em `s4`: `{capacity: 4, spentCommands: 3, ordersHeld: 1, accepted: 1, firstRefusal: 2}`.
- Ações urbanas: 1 por cidade por rodada (`balance.cityActions`); 28 opções por cidade; razões de bloqueio idênticas às recusas do servidor.
- Território: reivindicar custa 1 Influência; melhoria Fazenda custa 1 madeira; estrada 1 madeira; melhorar um hexágono já melhorado → `ALREADY_IMPROVED` (troca indisponível).
- Movimento: infantaria/pioneiro mobilidade 2: 1 hexágono ok (custo 1), 2 hexágonos custo 3 recusado, 3 hexágonos custo 5 recusado, hexágono desconhecido recusado (MV-1: caminho A→B→A aceito).
- Atomicidade: nenhum comando recusado consumiu recurso parcial em nenhuma das partidas.

## 14. Mapa

- 210 hexágonos, 30 regiões de 7, grade 6×5; casas fixas por número de jogadores; QUICK/STANDARD/EPIC só mudam rodadas.
- Enquadramento inicial pelos hexágonos projetados; "Centralizar" restaura; zoom 0,5–4 respeitado; pan limitado ao quadro; `viewBox` sempre finito (0 `NaN`/`Infinity`).
- Seleção por Enter e Espaço (1 selecionado por vez, inspetor muda).
- Tamanhos de mundo 37/61/91 não existem (auditoria já registrada em `alpha-v0-1-ux-round-1`).
- Distância entre casas em 2p: 27 hexágonos (GP-1).
- **NÃO TESTADO**: toque/pinça em dispositivo real (só ponteiro e teclado); geração de mapa com sementes extremas além de 0, 1 e 4 294 967 295 na criação.

## 15. UX, scrolling, viewport

| Viewport | Altura do documento | Barra de navegação transborda? | Botão de fase (`top`–`bottom`) |
|---|---|---|---|
| 1366×768 | 768/768 | não | 720–761 |
| 1440×900 | 900/900 | não | 852–893 |
| 1920×1080 | 1080/1080 | não | 1032–1073 |
| 1152×720 (zoom 125 % de 1440×900) | 720/720 | não | 672–713 |
| 960×600 (zoom 150 %) | 600/600 | **sim** (RESP-2) | 552–593 |
| 1024×768 | 768/768 | **sim** (RESP-2) | 720–761 |
| 768×1024 | **1 653**/1 024 | sim | 1 602–1 643 (RESP-1) |
| 390×844 | **1 789**/844 | sim | 1 739–1 779 (RESP-1) |

≥ 901 px: sem rolagem de página, barra superior, navegação e barra de ação fixas, painéis com rolagem interna (E2E `alpha-shell-fullscreen.spec.ts` verde). Capturas em `screens/vp-*.png`, `map-after-interaction.png`.

## 16. Responsividade

Ver seção 15. Desktop e zoom 125 % ok. Zoom 150 % e tablet: navegação com rolagem lateral. Celular/tablet vertical: página longa, ação de fase no fim (RESP-1). Escopo da Fase 1 foi ≥ 901 px; o shell móvel é fatia futura.

## 17. Acessibilidade

Medido no jogo real: 0 botões sem nome; 0 campos sem rótulo; 0 hexágonos sem `aria-label`; 0 hexágonos fora da ordem de tab; 0 SVG sem rótulo; 1 `h1`; `lang="pt-BR"`; marcos `nav` e `main`; **0 de 41 elementos amostrados com contraste baixo**; 0 elementos focáveis sem indicador de foco; teclado no mapa (Enter/Espaço). Estado não depende só de cor (texto "Elegível", "Trabalhado", "Pronto/Preparando").

**NÃO TESTADO**: `prefers-reduced-motion` (não emulado); leitor de tela real; tema claro completo (contraste amostrado no tema padrão); Firefox e WebKit (só Chromium).

## 18. Performance

| Medida | Valor |
|---|---|
| Servidor pronto (dev, zero-config) | ~8 s (inclui `prisma generate` e `tsc -b`) |
| `GET /alpha` | mediana 49 ms, máx 388 ms (n = 218; primeira: 140 ms) |
| `POST /api/alpha` (200) | p50 24 ms, p95 47 ms, máx 187 ms (n = 3 469) |
| Polling `GET` | p50 18 ms, p95 57 ms, máx 444 ms (n = 15 142) |
| Polling do cliente | 24/min por aba |
| Mesa 2p vs 6p (navegador) | heap 17 → 20,7 MB; nós DOM 510 → 514; 0 layouts forçados; 6 recálculos de estilo; 0,22 s de tarefa |
| Partida de 9 rodadas por bots | 427–500 s, dominada pelo ritmo do harness (polling de 700 ms e novas tentativas), não pelo servidor |

**NÃO TESTADO**: sessão longa (> 30 min) para vazamento de memória; PostgreSQL de produção; carga real fora do localhost.

## 19. Conceito (Artifact) vs Alpha real

Artifacts usados **só** como norte de UX. O canvas de 20 pranchas é o meu próprio conceito; a página de regras foi lida apenas em estilos e títulos `h2` (leitura parcial declarada), nunca como regra.

| Área | Situação | Observação |
|---|---|---|
| Shell de jogo | **IMPLEMENTADO** (≥ 901 px) | Fase 1: sem rolagem, barras fixas. Divergência: sem versão móvel (RESP-1) |
| Mapa | **IMPLEMENTADO / PARCIAL** | Mapa hexagonal com fog, foco, zoom, centralizar. **Sem minimapa** (NÃO IMPLEMENTADO) |
| Cidade | **IMPLEMENTADO / PARCIAL** | 28 ações urbanas, decomposição de produção, distritos e edifícios. Rótulos de 5 recursos (RES-1) |
| Teia (pesquisa) | **PARCIAL** | Aba "Teia Civilizacional" com 10 avanços por era, busca e domínio; pesquisa funciona (S13). Não é ainda a teia visual do conceito |
| Diplomacia | **PARCIAL** | Contato, tratados, guerra, emissários/influência. `PROPOSE_TRADE`, `RESPOND_TRADE`, `CONTEST_PRESENCE`, `INDEPENDENT_ACTION` → `NOT_IMPLEMENTED`. Não alcançável em partida (GP-1) |
| Guerra | **IMPLEMENTADO** | Combate tático (posturas, dados, fortificação, pilhas). Verificado por Monte Carlo/E2E, não ao vivo |
| Cartas | **PARCIAL** | Mão, conselheiros, projetos, reações. 23 cartas jogadas, 1 conselheiro, 0 projetos (requisitos de era/distrito) |
| Cultura | **PARCIAL** | Distrito, edifício e ação cívica; sem trilha própria visível |
| Eras / Hegemonia | **IMPLEMENTADO** | Marcos, `ADVANCE_ERA` (8 sucessos em 4p), `DECLARE_HEGEMONY` (recusa correta quando não atendida); vitória por Hegemonia via E2E |
| Onboarding | **NÃO IMPLEMENTADO** no Alpha | Existe no slice local (`/`), não em `/alpha`; painel "Sobre o teste" |
| Compêndio | **NÃO IMPLEMENTADO** no Alpha | Existe no slice local |
| Responsividade | **PARCIAL** | ≥ 901 px |
| Design system | **PARCIAL** | Tokens CSS e temas (Sistema/Claro/Escuro) reaproveitados do slice; sem biblioteca de componentes compartilhada |
| Economia de ações por rodada | **CONCEITO** | Proposta em `openspec/changes/alpha-round-action-economy/` |

## 20. Sistemas ainda conceituais

Minimapa; teia visual de pesquisa; compêndio e onboarding no Alpha; comércio entre jogadores (`PROPOSE_TRADE`); disputa de presença; ações de potências independentes; trilha de cultura; mundos de 37/61/91 regiões; "Resolvendo a rodada" com eventos por jogador; economia de ações configurável; shell móvel. Nenhum deles foi implementado nesta auditoria.

## 21. Bugs corrigidos

| ID | Correção | Teste |
|---|---|---|
| UI-1 | `tileSummary()` em `apps/web/app/play/map-frame.ts`, usada por `hex-map.tsx`: hexágono `UNKNOWN` mostra só `Desconhecido · q,r` | `tests/alpha-audit-fixes.test.ts` (2 casos) |
| BASE-1 | `describe('remote database guard', { timeout: 30_000 })` em `tests/local-alpha-script.test.ts` | a suíte inteira passa (631/631) |
| — | `docs/audit/evidence/**` na exclusão do ESLint (scripts de evidência, não produto) | `npm run lint` verde |

Nada de regra, fluxo, balanceamento, mapa, schema ou navegação foi alterado.

## 22. Bugs não corrigidos (e por quê)

| ID | Motivo |
|---|---|
| GP-1 | mapa, balanceamento e fluxo: decisão do dono |
| GP-2 | regra de economia: proposta OpenSpec aguardando aval |
| MP-CAS-1 | mudança de concorrência/contrato do cliente (CAS por jogador ou reconciliação): decisão de arquitetura |
| RL-1 | política de limites: decisão de segurança/produto |
| RESP-1, RESP-2 | navegação/layout estrutural móvel: fora do escopo da correção segura |
| RES-1 | tarefa 8.1 já aberta (mostrar sete recursos); toca projeção e UI |
| UX-2 | pequeno, mas muda o contrato de retomada; deixado para o slice de UX |
| API-1, API-2, MV-1 | mudar códigos/mensagens/validação de ordens pode quebrar o mapeamento da UI e os testes; melhor junto com a unificação de recusas (GP-2) |

## 23. Riscos antes da próxima Alpha

1. **Ninguém chega a interagir** (GP-1): a próxima rodada de testes humanos vai gastar as sessões sem exercitar diplomacia, guerra e combate.
2. **Orçamento de comando** faz o jogador "gastar" nas decisões erradas (GP-2) e produz recusas difíceis de entender.
3. **Conflito de versão** com 4–6 humanos jogando ao mesmo tempo (MP-CAS-1): a nova tentativa única do cliente falha em alguma fração das ações.
4. **Limites compartilhados** (RL-1) se o link for divulgado.
5. **Expiração preguiçosa**: os prazos só são aplicados quando alguém lê ou envia comando; sem tráfego a partida "congela" até a próxima leitura (correto, mas surpreende em prazos longos).
6. **Reinício apaga tudo** no modo memória (intencional em dev): nunca use o modo memória para playtest remoto.
7. **Servidor de produção (PostgreSQL) não exercitado** nesta auditoria (NÃO TESTADO).

## 24. Recomendação de próximo slice

Em ordem, cada passo com aval antes do seguinte:

1. **Decidir o alcance de contato** (GP-1): opções sem mexer em regra de combate: mais rodadas por padrão para testes, homelands mais próximos em 2–3 jogadores, ou uma peça inicial que explore mais longe. Sem isso, a economia de ações é otimizada às cegas.
2. **Fatia A da economia de ações** (`alpha-round-action-economy`): opção "Ações por rodada 5–10", classificação central, contador único, ações urbanas na mesma economia, contador "Ações 3/7" no shell. É o mínimo para comparar 5 vs 10 decisões nos playtests; resolve GP-2 e API-2 juntos.
3. **Reduzir 409** (MP-CAS-1): reconciliação no cliente (reler, reaplicar, retentar com recuo) ou CAS por jogador para comandos privados.
4. **Sete recursos na interface** (RES-1, tarefa 8.1).
5. Fatias B e C da economia de ações (planejamento privado simultâneo; "Resolvendo a rodada"), depois de A.
6. Shell móvel (RESP-1/2) só depois.

---

## Apêndice A — Economia de ações da rodada

### Decisão desta auditoria

Não implementar. O pedido altera fluxo de turno, regra de economia e schema persistido; a auditoria proíbe isso sem decisão. Entregue: classificação central dos comandos reais (abaixo) e proposta OpenSpec em **três fatias com aval entre elas** (`openspec/changes/alpha-round-action-economy/`: `proposal.md`, `design.md`, `tasks.md`, `specs/…/spec.md`; `openspec validate --strict` verde).

### Classificação dos comandos reais

Fonte: `packages/game-engine/src/alpha-turn.ts` (`applyAlphaCommand`) e `alpha-phases.ts` (`LEGAL_COMMANDS`).

| Comando | Hoje | Classe proposta |
|---|---|---|
| `QUEUE_ORDER` MOVE (peça ou grupo) | 1 vaga por ordem | PRINCIPAL (1 por ordem, qualquer nº de hexágonos ≤ mobilidade) |
| `QUEUE_ORDER` EXPLORE / ATTACK / TRADE / INFLUENCE | 1 vaga | PRINCIPAL |
| `CANCEL_ORDER` | libera a vaga | LIVRE |
| `SETTLE` | 1 | PRINCIPAL |
| `MANAGE` CLAIM_HEX / IMPROVE_HEX / DEVELOP_CITY / SPECIALIZE_CITY | 1 | PRINCIPAL |
| `MANAGE` ASSIGN_POPULATION / ASSIGN_WORKED_HEXES / ADOPT_GOVERNMENT | 0 | LIVRE (adotar governo: a confirmar) |
| `BUILD_ROAD`, `CIVILIZATION_ABILITY` | 1 | PRINCIPAL |
| `ADVANCE_ERA` | 1 | PRINCIPAL (a confirmar: é marco) |
| `LEADER_ABILITY` | 0 (1 por Era) | LIVRE com limite próprio |
| `PROPOSE_TREATY`, `DECLARE_WAR` | 1 | PRINCIPAL |
| `RESPOND_TREATY`, `END_TREATY` | 0 | LIVRE |
| `HIRE_ADVISOR`, `BUILD_PROJECT` | 1 | PRINCIPAL |
| `URBAN_ACTION` (produzir, construir, recrutar, pesquisar, humor, apoio ao comércio, ação cívica) | 0 do orçamento; 1 por cidade | PRINCIPAL + limite por cidade com mensagem própria |
| `PLAY_CARD` em Planejamento | 0 | LIVRE (a confirmar) |
| `PLAY_CARD` em Conflitos | 0 | REAÇÃO (nunca consome ação planejada) |
| `SET_DEFENSE_POSTURE`, `CHOOSE_AMBITIONS`, `WORLD_CHOICE`, `DECLARE_HEGEMONY`, `READY` | 0 | LIVRE |
| Selecionar, inspecionar, mover câmera, zoom, abrir painel, ler regras, prévia, trocar aba | só cliente | LIVRE (nunca enviados) |
| `PROPOSE_TRADE`, `RESPOND_TRADE`, `CONTEST_PRESENCE`, `INDEPENDENT_ACTION` | `NOT_IMPLEMENTED` | sem classe |

Inconsistências achadas: só `MANAGE` recusa com `COMMAND_LIMIT` (os outros com `RULE_FAILURE` e frase diferente); ações urbanas ignoram o orçamento; a mesma "quantidade de esforço" custa ponto em território e nada em cidade.

### Ritmo da rodada (investigação pedida)

Hoje: até 4 confirmações por rodada. Proposta: **PULSO DO MUNDO → PLANEJAMENTO DAS AÇÕES → TODOS CONFIRMAM → RESOLUÇÃO → MANUTENÇÃO → FIM DA RODADA**, com uma confirmação para planejamento + urbano + diplomacia (Conflitos continua à parte porque reações dependem da ordem do atacante revelada). As sub-fases do motor (`URBAN_ACTIONS`, `ORDERS_MOVEMENT`, `DIPLOMACY_TRADE`) ficam como sub-fases de resolução, para não mudar a ordem de resolução em que os testes se apoiam. Detalhes, riscos (efeitos urbanos deixam de ser imediatos) e decisões abertas: `design.md`.

### Privacidade e visibilidade

Ordens já são privadas hoje (`player.orders` não é projetado a terceiros). Para urbano e diplomacia reservados, o outro jogador recebe só `{playerId, status: Planejando | Pronto}`; um teste percorre todos os campos da projeção alheia procurando ids, alvos e custos. Nada privado é enviado e escondido por CSS. Exemplo de visibilidade pedido (Ana move o explorador; Beto só vê se a visão dele permitir) está como cenário na spec.

### Testes previstos (todos registrados em `tasks.md`)

Classificação exaustiva (falha de compilação sem classe); cobrança única; recusa atômica; MOVE de vários hexágonos = 1; grupo = 1; cancelar libera; urbano cobra e respeita o limite por cidade; 5 e 10 aceitos, 4 e 11 recusados; sala antiga carrega igual; teste de propriedade (usado nunca passa do limite); privacidade; replays determinísticos por classe; partidas 2/4/6 por HTTP; capturas em 1366×768, 1440×900 e 1920×1080; E2E de dois navegadores para o exemplo de visibilidade.

---

## Apêndice B — NÃO TESTADO

| Item | Motivo |
|---|---|
| Ctrl+C literal no `dev:alpha` | shell não interativo; substituído por encerrar a árvore de processos |
| Rodar sem `apps/web/.env.local` | arquivo do usuário, não movido; coberto por teste de script e `health` |
| Combate, guerra, tratado, rota, projeto, reação e Hegemonia em **partida jogada por HTTP** | inalcançáveis nos formatos testados (GP-1); cobertos por Monte Carlo, testes do repositório e E2E `alpha-conflict.spec.ts` |
| Toque/pinça em dispositivo real | só ponteiro e teclado |
| `prefers-reduced-motion`, leitor de tela, tema claro completo | não emulados |
| Firefox e WebKit | só Chromium |
| Sessão longa (> 30 min) e memória | não executada |
| PostgreSQL de produção, Railway, deploy | fora do escopo; sem banco/Docker nesta auditoria |
| Simulação de janelas do `alpha:players` em modo com interface (6 janelas visíveis) | testado só em modo `ALPHA_PLAYERS_HEADLESS=1 --once` |

---

## Tabela final de achados

| ID | Severidade | Área | Reprodução | Esperado | Atual | Evidência | Correção sugerida |
|---|---|---|---|---|---|---|---|
| GP-1 | P1 | Jogabilidade / alcance | Criar QUICK 2p (seed 1), ambos marcham para a capital do outro por 9 rodadas (ou 15 em STANDARD) | Contato, diplomacia, guerra e combate exercitáveis numa partida de teste | Capitais a 27 hexágonos; menor distância entre peças 13 (QUICK) e 7 (STANDARD); 0 contatos em 2/4/6p e nos rushes | `results/s12-rush-quick-seed1.json`, `s12-rush-standard-seed2.json`, `s2-match-*.json` | Decisão do dono: mais rodadas por padrão para teste, homelands mais próximos em 2–3 jogadores ou unidade inicial de exploração; não mexer em combate |
| GP-2 | P2 | Economia / comandos | 4 pontos: 2 × CLAIM_HEX + 1 × IMPROVE_HEX + 1 × BUILD_ROAD, depois SETTLE, PROPOSE_TREATY ou DECLARE_WAR | Uma economia global, previsível, com uma mensagem única | Orçamento único só para parte dos comandos; urbano fora; `COMMAND_LIMIT` vs `RULE_FAILURE`; fundar cidade, tratado e guerra recusados por "Sem pontos de comando" | `results/s2-match-4p-seed2.json` (tabela), `s4-city-territory.json` (`commandPoints`), `alpha-turn.ts` | Proposta `alpha-round-action-economy` (fatia A) |
| MP-CAS-1 | P2 | Multiplayer | 4 jogadores enviam `SET_DEFENSE_POSTURE` em paralelo em PLANNING | Comandos privados de jogadores diferentes não se bloqueiam | CAS da sala inteira: 75 % de 409 na rajada; 3,7–8,2 % das ações de bots precisam de > 1 nova tentativa; cliente tenta 1 vez | `results/s8b-burst.json`, `s2-match-4p/6p*.json` (`conflictStats`) | Reconciliação no cliente (reler, reaplicar, recuar) ou CAS por jogador |
| RL-1 | P2 | Segurança / disponibilidade | 40 leituras anônimas seguidas; depois `create` de outro visitante | Um cliente não impede os demais | Balde anônimo (30/min) e de criar/entrar (20/min) são compartilhados: novo visitante recebe 429 por até 60 s | `results/s10-ratelimit.json` | Chave por IP/origem ou limite maior para criar/entrar; decisão de segurança |
| RESP-1 | P2 | Responsividade | Abrir partida em 390×844 ou 768×1024 | Ação de fase acessível sem rolar a página | Documento de 1 789 e 1 653 px; botão de fase no fim; sem barra fixa | `results/s7-ui.json`, `screens/vp-390x844.png`, `vp-768x1024.png` | Fatia de shell móvel (≤ 900 px) |
| RES-1 | P2 | Interface / recursos | Melhorar Fazenda; comparar custo mostrado e recurso cobrado | Mesmos recursos e rótulos no custo e no saldo (7 recursos) | Custo em "Materiais" (legado); servidor cobra madeira | `results/s4-city-territory.json` (`catalogCost` vs `spent`), tarefa 8.1 aberta | Fechar a tarefa 8.1 |
| RESP-2 | P3 | Responsividade | 1024×768 ou zoom 150 % em 1440×900 | Navegação cabe ou colapsa com clareza | Rolagem lateral interna do `main-nav` | `results/s7-ui.json`, `screens/vp-1024x768.png`, `vp-960x600.png` | Colapsar rótulos ou menu de estouro |
| UI-1 | P3 | Fog / acessibilidade | Passar o mouse num hexágono desconhecido | Nada sobre dono ou controle | "Livre · Controle: nenhum" | `results/s7-ui.json`, `map-frame.ts` | **Corrigido** (`tileSummary`, teste novo) |
| BASE-1 | P3 | Testes | `npm test` sob carga | 629/629 estável | 1 falha por limite de 5 s (12 processos) | `evidence/baseline.txt`, `gate-test.txt` | **Corrigido** (`timeout: 30_000` no `describe`) |
| UX-2 | P3 | UX / retomada | Entrar por `?game=<id>`, só ler, abrir `/alpha` | Retoma a última partida | Mostra a tela de entrada até a página enviar um POST | `results/s3-players-reload.json` | Gravar o id no `localStorage` também após leitura bem-sucedida |
| API-1 | P3 | Lobby / mensagens | `CHOOSE_CIVILIZATION` duplicada, desconhecida ou `LOBBY_READY` sem civ | Mensagem específica para cada causa | Mesma frase "Escolha uma civilização disponível antes de confirmar Pronto." | `results/s1-console.txt` | Três mensagens; junto com a unificação de recusas |
| API-2 | P3 | API / mensagens | `DEVELOP_CITY` sem recursos; melhorar hexágono já melhorado | Mensagem em PT-BR e código único para limite de comando | "Cannot afford city development", "Replacing improvements is not available"; `COMMAND_LIMIT` vs `RULE_FAILURE` | `results/s2-match-4p-seed2.json` (amostras), `s4-city-territory.json` | Traduzir no motor de gestão; unificar código |
| MV-1 | P3 | Movimento | `MOVE` com caminho A→B→A (custo ≤ mobilidade) | Recusar ou não cobrar ponto de comando | Aceito, consome 1 ponto, a peça não se move | `results/s4-city-territory.json` (`orders`) | Recusar caminho com hexágono repetido ou que termina na origem |

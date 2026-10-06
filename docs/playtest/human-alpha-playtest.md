# Playtest humano — Alpha V5.1b

Uma página. Em 5 minutos você está jogando.

## 1. Subir o jogo

```sh
npm install                                  # só na primeira vez
ALPHA_PLAYTEST_LOG=1 npm run dev:alpha       # terminal 1: servidor local com o log de métricas ligado
```

Se aparecer "A porta 3001 já está em uso", há um servidor antigo: `lsof -nP -tiTCP:3001 -sTCP:LISTEN | xargs kill` e rode de novo.

Abra **http://127.0.0.1:3001/alpha** (use `127.0.0.1`, não `localhost`). As partidas ficam em memória: reiniciar o servidor apaga tudo.
Se não quiser medir, rode só `npm run dev:alpha`.

## 2. Abrir 2, 4 ou 6 lugares sozinho

Num segundo terminal, com o servidor rodando:

```sh
npm run alpha:players -- --players=2 --start     # 2 janelas, cria a mesa, escolhe civilizações e inicia
npm run alpha:players -- --players=4 --start     # idem com 4
npm run alpha:players -- --players=6 --start     # idem com 6
```

Sem `--start` você cria a mesa e escolhe as civilizações à mão. Com amigos: cada pessoa abre a URL, uma cria a mesa e as outras entram pelo código.
Na criação, **Duração** define o tamanho: `QUICK` = 21 rodadas (7 Eras × 3, ~45–60 min), `STANDARD` = 35 rodadas (7 × 5, o jogo de verdade).
Primeira vez: use `QUICK` com 2 lugares.

### Sessão humana com contato forçado (V51B-12)

Comando único (servidor local com contato forçado + log de playtest; ninguém joga por você):

```sh
npm run playtest:human
```

Abra `http://127.0.0.1:3001/alpha` em duas janelas (uma por pessoa), crie uma sala de 2 lugares, escolham civilização, Pronto, iniciar. Com `ALPHA_FORCE_CONTACT=1` (ligado por esse comando, nunca em produção) dois Pioneiros, um de cada lado, começam frente a frente entre as duas Pátrias mais próximas: o Contato nasce da regra normal de proximidade (≤ 1 hex), já na rodada 1, e o Diário da Mesa avisa "Cenário de teste: contato forçado". Use-o só para chegar cedo a diplomacia, guerra e combate; não use a sessão para julgar distância natural.

O log (`docs/evidence/playtests/<data>-<partida>/events.jsonl`) guarda, sem texto livre nem nomes: abertura e confirmação do Planejamento (`planning_open`, `ready` com `planningMs`), cada comando (Ordens planejadas, canceladas, propostas diplomáticas, prioridade de baixas), contato, tratado, guerra, combate, Virada de Era, e momentos de tela (`ui`: painel aberto, decisão mostrada/respondida, Virada exibida) com o tempo desde a abertura da rodada. Resumo: `node scripts/alpha-playtest-summary.mjs <pasta>`.

O driver automático continua existindo para regressão (`node scripts/alpha-ui-playtest.mjs --players=2 --contact=forced`, servidor iniciado com o comando acima): ele falha com código 2 se o Contato não ocorrer até a rodada 2.

### Mesa local com vários lugares (você ou o Claude controlando todos)

`npm run alpha:players -- --players=2 --start` abre 2 janelas isoladas, cria a mesa, escolhe as civilizações e inicia; cada janela é um lugar. É a mesma interface do jogo (a nuvem de ações nasce na peça), então serve para jogar contra si mesmo ou para o Claude controlar um dos lugares por cliques. `node scripts/alpha-ux-smoke.mjs` e `node scripts/alpha-ux-checkpoint.mjs` fazem isso sem janela visível e gravam capturas e métricas de scroll em `docs/evidence/v51b-interaction-v2/`.

## 3. Objetivo da sessão

Jogar até a Era IV ou até alguém declarar Hegemonia, e responder: **o jogo cria decisões ou preenche tempo?**
Tente de propósito: fundar uma segunda cidade, pesquisar, **encontrar o outro jogador**, propor um tratado, declarar guerra, atacar, subir uma cidade de nível, passar uma Virada de Era e trocar de governo.

## 4. O que observar (anote só o que incomodar ou surpreender)

- Você sabia o que fazer na rodada 1 sem ler nada? Onde travou?
- Quantas Ordens você realmente quis usar? Alguma rodada foi "confirmar sem pensar"?
- O mapa: você enxerga seu território e o que é clicável? Algum hex ficou escondido atrás de um painel?
- Fome: sua população cresce? Você entendeu por que não?
- Bandos/Piratas: você viu o aviso antes do ataque? Teve tempo de reagir? O alvo do Bando (linha e painel) estava claro? Um Acampamento "recém-surgido" deu tempo para atacá-lo antes de partir?
- Contato: em que rodada encontrou o outro jogador? Teve motivo para conversar ou lutar?
- Ressonância e Tabuleiro: você entendeu o que os 5 encaixes e a Repercussão fazem?
- Quanto tempo uma rodada levou (planejar → resolver)? Quando ficou longa demais?
- Mesa e legibilidade: a Mesa pareceu um lugar? Você percebeu o outro jogador (placa, Pátria)? As nuvens contextuais ficaram claras? O mapa continuou legível quando começou a encher? Diplomacia e primeiro combate: o que faltou saber?

**Regra da sessão: não balancear durante o jogo. Registrar primeiro; ajustar só depois, com a bateria completa.**

## 5. Perguntas depois da partida (2 minutos)

1. Em uma frase, qual foi sua estratégia? Ela funcionou?
2. Qual decisão foi mais difícil? Qual foi óbvia demais?
3. Houve uma rodada em que você não tinha o que fazer?
4. O que você achou injusto (fome, Bandos, sorte do dado, vizinho)?
5. Você jogaria mais uma partida agora? Por quê?

## 6. Bugs: registre assim

`rodada · fase · o que você tentou · o que esperava · o que aconteceu · print`
Exemplo: `R4 · Planejamento · Elevar sem Pedra · esperava botão bloqueado com motivo · a ação foi aceita e falhou na resolução`.
Banner "Estado atualizado por outra ação" em mesas de 4–6: o cliente já tenta de novo 3 vezes sozinho; se ainda aparecer, clique de novo (anote quantas vezes).
Reforma de governo: só na **última rodada da Era**, em Tabuleiro da Civilização (selo da civilização) → Governo.

## 7. Métricas coletadas sozinhas (só local, nada sai da máquina)

Com `ALPHA_PLAYTEST_LOG=1` o servidor grava `docs/evidence/playtests/<data>-<partida>/events.jsonl`: duração do planejamento, ações disponíveis e escolhidas, ações recusadas e motivo, recursos, população, níveis, pesquisas, Ordens, contatos, tratados, guerras, combates (Δ e Graus), Bandos/Piratas vistos, Viradas de Era e fim da partida. Só rótulos `player-N`, nunca nomes.

Resumo e comparação entre sessões:

```sh
node scripts/alpha-playtest-summary.mjs docs/evidence/playtests/<pasta-da-sessão>
node scripts/alpha-playtest-summary.mjs --compare <sessãoA> <sessãoB>
```

Para ver o jogo "jogado por clique" sem você, como referência: `node scripts/alpha-ui-playtest.mjs --players=4 --preset=QUICK --rounds=21` (precisa do servidor rodando; escreve `session.json` e prints em `--out`).

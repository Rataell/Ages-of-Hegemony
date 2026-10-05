# Playtest humano — Alpha V5.1b

Uma página. Em 5 minutos você está jogando.

## 1. Subir o jogo

```sh
npm install                                  # só na primeira vez
ALPHA_PLAYTEST_LOG=1 npm run dev:alpha       # terminal 1: servidor local com o log de métricas ligado
```

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

## 3. Objetivo da sessão

Jogar até a Era IV ou até alguém declarar Hegemonia, e responder: **o jogo cria decisões ou preenche tempo?**
Tente de propósito: fundar uma segunda cidade, pesquisar, **encontrar o outro jogador**, propor um tratado, declarar guerra, atacar, subir uma cidade de nível, passar uma Virada de Era e trocar de governo.

## 4. O que observar (anote só o que incomodar ou surpreender)

- Você sabia o que fazer na rodada 1 sem ler nada? Onde travou?
- Quantas Ordens você realmente quis usar? Alguma rodada foi "confirmar sem pensar"?
- O mapa: você enxerga seu território e o que é clicável? Algum hex ficou escondido atrás de um painel?
- Fome: sua população cresce? Você entendeu por que não?
- Bandos/Piratas: você viu o aviso antes do ataque? Teve tempo de reagir?
- Contato: em que rodada encontrou o outro jogador? Teve motivo para conversar ou lutar?
- Ressonância e Tabuleiro: você entendeu o que os 5 encaixes e a Repercussão fazem?
- Quanto tempo uma rodada levou (planejar → resolver)? Quando ficou longa demais?

## 5. Perguntas depois da partida (2 minutos)

1. Em uma frase, qual foi sua estratégia? Ela funcionou?
2. Qual decisão foi mais difícil? Qual foi óbvia demais?
3. Houve uma rodada em que você não tinha o que fazer?
4. O que você achou injusto (fome, Bandos, sorte do dado, vizinho)?
5. Você jogaria mais uma partida agora? Por quê?

## 6. Bugs: registre assim

`rodada · fase · o que você tentou · o que esperava · o que aconteceu · print`
Exemplo: `R4 · Planejamento · Recrutar 2× na mesma cidade · esperava bloqueio · a 2ª ação falhou na resolução e a Ordem sumiu`.
Banner "Estado atualizado por outra ação" em mesas de 4–6: **normal**, clique de novo (anote quantas vezes).

## 7. Métricas coletadas sozinhas (só local, nada sai da máquina)

Com `ALPHA_PLAYTEST_LOG=1` o servidor grava `docs/evidence/playtests/<data>-<partida>/events.jsonl`: duração do planejamento, ações disponíveis e escolhidas, ações recusadas e motivo, recursos, população, níveis, pesquisas, Ordens, contatos, tratados, guerras, combates (Δ e Graus), Bandos/Piratas vistos, Viradas de Era e fim da partida. Só rótulos `player-N`, nunca nomes.

Resumo e comparação entre sessões:

```sh
node scripts/alpha-playtest-summary.mjs docs/evidence/playtests/<pasta-da-sessão>
node scripts/alpha-playtest-summary.mjs --compare <sessãoA> <sessãoB>
```

Para ver o jogo "jogado por clique" sem você, como referência: `node scripts/alpha-ui-playtest.mjs --players=4 --preset=QUICK --rounds=21` (precisa do servidor rodando; escreve `session.json` e prints em `--out`).

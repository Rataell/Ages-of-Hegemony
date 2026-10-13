# External Alpha V1.2 · RC6 candidata (local)

Branch `rc6/alpha-v1.2`, criada a partir de `ux/board-directive-v1` (que saiu da `rc5/alpha-v1.2`). Versão exposta em `/api/alpha/health`: `alpha-external-1.2-rc6`. A RC5 publicada, o `main` e qualquer `frozen` não foram tocados. Não houve push, deploy nem merge. Esta candidata existe só para o teste pessoal do dono, antes de qualquer pedido novo de regra ou de interface.

## O que entra

- **Ficha de Ação** (Estado → Elegibilidade → Custo → Prévia → Confirmação → Resultado) para Produzir, Governar, Recrutar, Construir, Elevar, Pesquisar, Mover, Fundar, Estrada, Claim, Improve e Work. Os números vêm do `previewAction` do motor; a interface não recalcula nada. Atacar, Influência e Comércio têm prévia parcial; cartas, diplomacia, Conselheiro e Hegemonia ainda não passam pela Ficha.
- **D1 · Mover coordenado**: uma Ordem pode levar de 2 a 3 trajetos, no máximo 3 peças no total, só em partidas novas (`rules.coordinatedMove`). Cada trajeto resolve sozinho: se um falha, os outros seguem e a Ordem não é devolvida. O movimento comum (pilha de até 24 peças) não mudou.
- **D2 · Perigo**: os 50% continuam, mas o aviso aparece antes ("Perigo possível ao explorar uma Região fechada") e a perda aparece depois, como linha de Perdas em Resultados, com mensagem honesta e marco `DANGER_LOSS` na Crônica da Partida.
- **D3 · Bandos e Piratas**: um assalto por cidade por rodada, recuo após o assalto, pilhagem de porto uma vez por rodada; a rota planejada é desenhada hex a hex pelo motor. Bando anda sobre COAST (água rasa, caminhável) e nunca sobre SEA; Pirata fica no SEA.
- **D4 · Governar por níveis**: o jogador escolhe quantos níveis, vê o Ânimo antes e depois e o custo total; o bloqueio nomeia o plano anterior que gastou o estoque.
- **D5 · Bônus de movimento**: sem teto; o motor estava certo, o defeito era a lista de hexes congelada na interface.
- **Mesa Viva**: peças, cidades, acampamentos, selos de Ânimo e trilhas compostos em slots do mesmo hex, sem sobrepor a ilustração prioritária (`docs/product/ux-board-layering.md`). Em telas de celular, painéis e Fichas terminam acima da bandeja.
- **Falha de ordem nunca é silenciosa**: uma ordem que falha na resolução agora também é uma linha `FAILURE` em Resultados (antes ia só para o log de acontecimentos). Isso fechou a reprodução B-08.

## Gates (2026-10-12, nesta máquina)

- `npx tsc -b`, `tsc -p tests`, `tsc -p e2e`, `tsc -p apps/web`: limpos.
- `npx eslint . --max-warnings 0`: limpo.
- `npx vitest run --maxWorkers=3`: 147 arquivos, 1767 passam, 54 falhas esperadas (`it.fails`).
- Playwright dirigido (layout em 3 larguras, partida real, Ficha, interação V2, mover coordenado, Governar, Pioneiro, água): 35 passam. Um teste de Pioneiro falhou uma vez sob carga paralela (o primeiro toque na peça caiu antes de o mapa assentar); passou sozinho em quatro execuções e ganhou uma repetição do toque.
- Nenhuma simulação em massa foi executada.

## Resposta aos dez pontos do gate

| # | Ponto | Resultado |
|---|---|---|
| 1 | Transbordo horizontal do Artifact em 390 px | Corrigido; medido em 320, 360, 390, 414, 768 e 1280 px sem transbordo. Artifact republicado (versão 10, mesma URL). |
| 2 | Composição no app real | `e2e/real-game-validation.spec.ts`: partida real com lobby, bot e ações reais, 3 larguras, Ficha aberta, Confirmar não coberto. |
| 3 | Três trajetos em uma Ordem | `e2e/coordinated-move-full.spec.ts`: prévia por trajeto, uma confirmação, persistência após recarregar, resolução dos três; e falha de um trajeto (Acampamento surge no destino do 3º) sem cancelar os outros dois, com a mensagem "trajeto 3 de 3" em Resultados e a Ordem consumida uma vez. |
| 4 | Governar | `e2e/governar-matrix.spec.ts`: vários níveis com saldo e aplicado igual ao previsto; sem saldo (bloqueio com a causa, nenhuma Ordem gasta); saldo para um nível só; plano anterior que consome o estoque. Esse último mostrou uma falha real, corrigida: o bloqueio dizia "você tem 0 Cultura" sem nomear o plano anterior; agora diz "Planos anteriores desta rodada: Governar em … (gasta 1 Cultura)". |
| 5 | Bônus +2 | `e2e/interaction-v2.spec.ts` (D-A): jogar a carta com o Mover aberto ilumina o destino extra, que é selecionado, confirmado e resolvido (a peça chega ao hex). |
| 6 | Pioneiro e Saqueadores | `e2e/pioneer-danger.spec.ts`: aviso antes; num caso a peça se perde e Resultados mostra "Perigo: a peça Pioneiro foi perdida ao entrar em …", no outro a Região é revelada. O contador de RNG de cada caso é achado pelo pipeline real da rodada, sem depender de sorte. `e2e/raiders-water.spec.ts`: a rota desenhada do Bando cruza a ponte COAST de um fosso de SEA e nunca um hex SEA; fosso fechado = sem rota (IDLE); a rota do Pirata é só SEA. A marcha rodada a rodada continua provada em `tests/ux-repro-bando-water.test.ts`. |
| 7 | Desktop e celular com mapa populado e Ficha | `e2e/layout-hard-cases.spec.ts` e `e2e/real-game-validation.spec.ts` (sem colisões de DOM, painéis claros das peças, Confirmar acessível). |
| 8 | Crônica | `tests/ux-chronicle-audit.test.ts`: custo previsto == custo aplicado == linha de Acontecimentos; só o autor lê o bloco aplicado e as falhas; falha de plano vira linha de Resultados com a causa. A Crônica da Partida (`MatchReportV1`) é um resumo: leva Perigo, batalhas, marcos, mas não custos previstos nem aplicados por ação. Isso é por desenho e não foi mudado. |
| 9 | Incompatibilidade com a RC5 | Abaixo. |
| 10 | `it.fails` abertas | `docs/audit/ux-itfails-register.md`: 54 (eram 55), com arquivo:linha, tema e relevância para este playtest (18 altas). |

## Incompatibilidade binária RC5 × RC6

Os schemas de gravação são estritos. A RC6 acrescenta campos opcionais que a RC5 recusa:

- `rules.coordinatedMove` (gravado em toda partida **nova**), `legs` na Ordem MOVE e `levels` no plano/ordem de Governar;
- `ResolutionEvent.applied` e `ResolutionEvent.fromHexId` (gravados em qualquer partida quando uma ação urbana planejada resolve ou um Bando se move).

Consequências verificadas no código (`apps/server/src/alpha-prisma-repository.ts`, `decode`):

1. **Uma partida criada na RC6 não abre num binário RC5.** O `decode` falha com "Invalid alpha match snapshot": erro controlado, 503 só para essa partida, nada é gravado nem apagado, o processo continua.
2. **Uma partida criada na RC5 e continuada num binário RC6 também deixa de abrir na RC5** depois da primeira rodada que grave `applied`, `fromHexId` ou `levels`. Antes disso a gravação é idêntica à da RC5 (os campos só são escritos quando carregam informação), mas isso não protege na prática: basta um Governar ou um passo de Bando.
3. Não há migração de banco: `prisma/` não mudou. O problema é só o formato do JSON do snapshot.

Por isso **a RC6 nunca deve apontar para o banco da RC5**, nem temporariamente, e um rollback RC6 → RC5 sobre o mesmo banco não é seguro.

## Estratégia segura de deploy e rollback (proposta, nada executado)

1. **Ambiente separado.** Um serviço novo (ex.: `aoh-alpha-rc6`) com **banco próprio** (outro projeto ou schema do Supabase), `ALPHA_SESSION_SECRET` novo e `ALPHA_PUBLIC_ORIGIN` próprio. A RC5 mantém serviço, banco, segredo e domínio. Cookies não se misturam porque a origem é outra.
2. **Antes de subir.** `prisma migrate deploy` só no banco novo (não há migration nova, serve de verificação); `curl /api/alpha/health` deve responder `release: alpha-external-1.2-rc6`, `database: true`, `migration: true`; `scripts/alpha-smoke.mjs` (`health`, `play`, reinício, `resume`) contra o domínio novo.
3. **Partidas da RC5 ficam onde estão**, jogadas na URL da RC5 até acabarem. Não se migra partida em andamento.
4. **Rollback da RC6 = desligar ou apontar de volta o domínio de teste.** Como o banco da RC6 é separado, nada da RC5 é afetado; as partidas da RC6 apenas deixam de ser acessíveis, sem perda (o snapshot permanece).
5. **Backup.** Exportar o banco da RC5 antes de qualquer mudança de infraestrutura, mesmo sem tocá-lo.
6. **Opção para o futuro, só com autorização:** um hotfix RC5.1 com leitura tolerante (`looseObject` nos schemas afetados) permitiria rollback sobre o mesmo banco. Não foi feito; é uma decisão de risco do dono.
7. Para uma partida RC6 que precise de regras antigas, criar com `coordinatedMove: false` não basta: `applied`, `fromHexId` e `levels` continuam sendo gravados.

## Como rodar localmente

```
npm install
npm run dev:alpha    # http://127.0.0.1:3001/alpha  (use 127.0.0.1; reiniciar apaga as mesas em memória)
```

Duas pessoas na mesma máquina: uma janela anônima ou perfil por jogador; "Adicionar bot" no lobby. Mover coordenado só existe em mesas criadas por esta versão.

## Limites conhecidos desta candidata

- Atacar, cartas, Conselheiro e Hegemonia ainda não passam pela Ficha.
- Hexes alcançáveis só com uma carta +2 ainda não jogada não aparecem iluminados.
- Pesca de frota em bancos de mar (+2 Alimento) é só proposta (V12-UX-05); os números não foram confirmados.
- Cidade muito cheia reduz para 62% de escala; o resto da ilustração prioritária se mantém.
- Na partida real validada a cidade humana caiu em Revolta na rodada 5 (ver E-A1-08 no registro de `it.fails`): vale observar no playtest.
- O registro de `it.fails` lista o que ainda é defeito conhecido; nada ali foi corrigido nesta rodada além de B-08.

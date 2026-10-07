# External Alpha 1.2 · RC1: relatório de deploy, smoke e playtest

## Estado
- **Commit implantado:** `64d969c` (branch `feature/external-alpha-finalization-rc`; a branch de deploy `fix/aoh-alpha-correctness-pre-v2` foi avançada por fast-forward até ele). **Tag imutável:** `external-alpha-v1.2-rc1` → `64d969c`. Rollback: o último deploy estável anterior era `55cf8a66` (commit `9545c55`).
- **Deploy em produção:** `70f4adf2` (rebuild de `e188de83`, mesmo commit, depois da rotação dos segredos). URL: https://aoh-alpha-production.up.railway.app
- **Health:** `{"ok":true,"database":true,"migration":true,"maxSeats":6,"accessProtected":true,"singleInstance":true}`. Sem migrations novas (3 aplicadas, "No pending migrations").
- **ALPHA_MAX_SEATS efetivo:** 6. **ALPHA_ACCESS_CODE:** mantido (criar sala exige; convidado por link não digita).
- **Config Railway tocada:** `ALPHA_MAX_SEATS=6`; `RAILPACK_START_CMD` (= o `startCommand` do `railway.json`, porque redeploys via API não liam o `railway.json` e o Railpack falhava com "No start command detected"); `serviceInstance` com os mesmos comando de build/start e healthcheck.

## Rotação de segredos (valores não impressos)
1. `ALPHA_SESSION_SECRET`: novo valor aleatório; um cookie de sessão emitido antes passou a responder 401 depois do redeploy (as sessões antigas deixaram de valer).
2. Senha do PostgreSQL: trocada com `ALTER USER` executado **dentro do container do app, na rede privada**, por um comando de start temporário (sem proxy público; não há `DATABASE_PUBLIC_URL`). O script tenta a credencial nova primeiro, depois a antiga, troca, e confirma: `rotation: new ok, old rejected`. Em seguida `DATABASE_URL`/`DIRECT_URL` do app e `POSTGRES_PASSWORD`/`PGPASSWORD`/`DATABASE_URL` do serviço Postgres foram atualizados, as variáveis temporárias removidas e o app reimplantado. Uma sala criada antes do último redeploy continuou legível depois dele (snapshot preservado, credencial nova).
3. `ALPHA_ACCESS_CODE` também apareceu no terminal da sessão por causa do `railway variables`; não estava na lista de rotação e não foi alterado.

## Smoke público (`scripts/alpha-rc-smoke.mjs`) — todos PASS
Acesso (criar sem código é recusado; com código ok); convite abre e entra com nome lembrado, sem código; só o Core 10 é selecionável; Figura ★ pré-selecionada, escolha de Figura, Figuras ocultas até todos prontos e reveladas juntas; Compacto (recomendado para 2), Padrão, Amplo e Arquipélago selecionáveis; partida inicia; reação; SSE; reload; suspender/retomar; mapas reais de 168/210/301 hexes e sem scroll de documento em Compacto, Padrão (Continental, Arquipélago, Mar Interior) e Amplo.

## Gate de 6 lugares (`... six`) — todos PASS
1H+5B com Amplo recomendado; 6 civilizações distintas; 6 Pátrias, 301 hexes; bots confirmam e a rodada resolve; reload mantém os 6 lugares; suspender/retomar. Mais: 6 sessões humanas por convite, presença/SSE ONLINE nas seis, 6 civilizações distintas, todos prontos, início e uma rodada resolvida.

## Exploração ao vivo
- **UI com cenário determinístico** (`e2e/exploration-live.spec.ts`, 4/4): Pioneiro → Região fechada com destaque → seletor **abstrato** de orientações (sem terreno) → confirmar → virada física (quadros em `docs/evidence/rc12/exploration/`) → painel REGIÃO REVELADA (Jazida, Vestígio com escolha); caso de **uma** orientação (automático); **"Requer acesso naval."** com Explorar desativado; **Frota/Embarcação Costeira** explorando por água navegável.
- **No deploy real** (playtest abaixo): Pioneiros exploram por API/UI; no Arquipélago a Embarcação Costeira explorou por mar em 5 rodadas (Ancoradouro ×3, Passagem ×2, Vestígio ×2…).

## Playtest (API pública + bots reais; política de cliente, não humano)
- `padrao-misto` (1H+3B, Padrão Misto, 14 rodadas): guerra entre bots, 19/30 Regiões abertas, sem estagnação; só conflitos de versão (409) esperados.
- `arquipelago-naval` (1H+2B, Arquipélago, Nórdicos, 14 rodadas): Distrito Marítimo (Porto) construído, 2 embarcações, exploração naval repetida, Pioneiros "Requer acesso naval." quando aplicável.
- Evidência em `docs/evidence/rc12/playtest-*/` (log.json + capturas).

### Achados
| Classe | Achado | Estado |
|---|---|---|
| UX | com 4 selos de iniciativa + alerta, o número da rodada ficava truncado no topo em 1280 px | corrigido no código (`R. 10 / 35` em telas estreitas); **não implantado** |
| VISUAL/copy | "Poder do Líder" na Virada de Era e "Líder" em linhas de combate/avisos | corrigido no código ("Figura"); **não implantado** |
| UX | dois navios exploram a mesma Região na mesma rodada: o diário diz "explorou" duas vezes (a segunda é no-op) | registrado |
| RULE | uma Embarcação pode ser perdida ao explorar uma Região com Perigo (regra existente: 50% se não houver Método Experimental) | registrado |
| BOT/WORLD | em mundos de água os bots constroem 1 embarcação; Arquipélago com 2 bots abriu 14–21 de 30 Regiões em 14 rodadas | registrado |
| infra | o limite de 6 salas/min por cliente derrubava specs e2e em sequência; agora `ALPHA_CREATE_RATE_PER_MINUTE` (e2e usa 120) | no código; não implantado |
| infra | `railway up` por CLI falha (upload 236 MB e Railpack sem start); o deploy válido é por git na branch ligada | documentado |

## Compatibilidade de salas V1.1
Sala sem `contentVersion` abre como legada **somente leitura** (mensagem controlada, nada avança nem é gravado); se o conteúdo deixar de validar, aparece como mesa legada sem jogo, nunca como erro 503. Coberto por `tests/alpha-legacy-room.test.ts` com uma sala V1.1 real. Em produção, as salas anteriores a esta RC seguem esse caminho.

## Testes desta rodada
`node scripts/rc-gate.mjs` OK; suíte completa 109 arquivos / 1215 testes OK (após ajuste de uma expectativa de texto); Playwright 38/39 na rodada completa (o 1 que falhou, `v51b-table` combate, passou isolado: instável em suíte cheia); testes de Postgres via docker 7/7.

## Gaps reais
- O playtest foi dirigido por política de cliente sobre a API pública, não por uma pessoa jogando: não valida sensação de jogo, áudio, nem leitura da UI por um olhar humano.
- Pioneiros não fundam cidades sozinhos na política de teste (só bots fundaram): a fundação por UI foi coberta pelos e2e existentes, não por este playtest.
- Itens adiados (fora do escopo de estabilização): som na sala de criação/lobby, mais emojis/reações personalizadas, mais tipos de mapa e níveis além dos 3 tamanhos × 4 presets atuais. Ameaças aleatórias (acampamentos, piratas) já existem e aparecem durante o jogo.

# AoH External Alpha — operação (2–4 pessoas, uma instância)

## Arquitetura de deploy
1 aplicação Next.js (`apps/web`, API em `/api/alpha`) + 1 PostgreSQL + HTTPS + **UMA instância** (`railway.json` → `numReplicas: 1`). SSE e presença vivem em memória do processo: **não escale horizontalmente**. Se o provedor não garantir uma instância, trocar o barramento por Postgres LISTEN/NOTIFY antes de abrir (o cliente já se recupera: ao reabrir o SSE ele busca a projeção autoritativa e há um poll de segurança de 2,5–5 s).
Vercel/serverless **não serve** (SSE e presença em memória). Railway (já preparado em `docs/deploy-railway.md`), Fly (1 máquina) ou um VPS com Docker servem.

## Variáveis (no serviço, nunca no repositório)
| Variável | Para quê |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | PostgreSQL (runtime / migrations) |
| `ALPHA_SESSION_SECRET` | assina o cookie de sessão (≥32 bytes; é o "SESSION/SIGNING secret"); estável entre deploys |
| `ALPHA_PUBLIC_ORIGIN` | origem HTTPS pública exata |
| `ALPHA_ACCESS_CODE` | barreira de entrada para criar/entrar em mesa |
| `ALPHA_MAX_SEATS` | 2..6 (padrão 4 em produção) |

Migrations: **nenhuma nova** (o snapshot é JSON; os estados SUSPENDED/CLOSED usam a coluna `status` existente). `npx prisma migrate deploy` é aditivo/seguro.

## Ciclo de vida da sala
`LOBBY → ACTIVE ⇄ SUSPENDED → FINISHED`, ou `CLOSED` (sala fechada pelo anfitrião no lobby, ou partida encerrada por votação; a mesa fica só para leitura).
- **Lobby:** anfitrião remove jogador, muda lugares (2–4), fecha a sala, inicia.
- **Host** é papel administrativo. Ao sair de propósito ("Sair e poder voltar") ou ficar 60 s sem sinal, passa ao jogador ativo de menor lugar (`HOST_TRANSFERRED`). Quem volta volta como convidado.
- **Sair** nunca destrói o lugar: o mesmo navegador ("Voltar à minha partida") ou o link de convite reassume o mesmo assento.
- **Presença:** Online (SSE aberto) · Reconectando (até 20 s) · Ausente. Ausência nunca é abandono.
- **Remoção:** só por votação dos jogadores ativos (maioria estrita; mesa de 2 só remove quem esteve ausente ≥10 min). Aprovada → civilização **EM GUARDA** (mantém tudo, confirma cada fase sem Ordens, o jogador pode **Reassumir**).
- **Encerrar partida em andamento:** "Solicitar encerramento" → maioria simples dos ativos → `CLOSED`.
- **Suspender / Retomar:** só o anfitrião, só em ponto seguro (Planejamento, sem decisão obrigatória pendente, ambições escolhidas). Snapshot já é persistente; "Retomar" reinicia o prazo da fase.

## Reações e marcas
👏 Boa jogada · 😮 Surpresa · 🤔 Pensando · ⚠ Atenção · 😄 Gostei · 👀 Estou vendo (botão "Reagir" ou clique na própria placa). "Marcar para todos" no Detalhes de um hex. Efêmeras (SSE, não salvas), cooldown 1,5 s / 3 s por jogador.

## Logs (JSON por linha, sem nomes/cookies/cartas)
`ROOM_CREATED PLAYER_JOINED PLAYER_LEFT PLAYER_RECONNECTED HOST_TRANSFERRED GAME_STARTED GAME_SUSPENDED GAME_RESUMED GAME_CLOSED PLAYER_REMOVED SEAT_ON_GUARD VOTE_OPENED VOTE_RESOLVED SSE_CONNECTED SSE_DISCONNECTED COMMAND_REJECTED SAVE_CONFLICT ENGINE_ERROR`. `ALPHA_LOG=0` silencia.

## Verificação rápida pós-deploy
`curl https://<dominio>/api/alpha/health` → `{ok:true,release:"alpha-external-0.2",maxSeats:4,accessProtected:true,singleInstance:true,...}`. `node scripts/alpha-smoke.mjs play`.

## Desligar / reverter
Pausar ou escalar a zero o serviço (as mesas ficam no PostgreSQL). Rollback = reimplantar a versão anterior; dados preservados. Nunca `migrate reset`.

## Limitações conhecidas
Uma instância; presença em memória (após reiniciar, todos aparecem Reconectando por 20 s); código de convite é o link longo; animação de dado não está ligada ao relatório de batalha (a face exibida já é a autoritativa); áudio não foi ouvido em navegador por humano; 5–6 jogadores existem no motor mas não são oferecidos.

## Deploy real (Railway) — registro
- Projeto Railway **AoH External Alpha** (ambiente `production`), serviço `aoh-alpha` + `Postgres`, domínio `https://aoh-alpha-production.up.railway.app`, região ams, **1 réplica**.
- Fonte: GitHub `Rataell/Ages-of-Hegemony`, branch **`fix/aoh-alpha-correctness-pre-v2`** (nunca `main`). Push nessa branch reimplanta.
- `railway.json`: `startCommand = npx prisma migrate deploy && npm run start -w @aoh/web` (migrations aditivas na subida; instância única, sem corrida), health `/api/alpha/health`, `numReplicas: 1`.
- Variáveis (só no Railway): `DATABASE_URL`/`DIRECT_URL` = referência `${{Postgres.DATABASE_URL}}` (rede privada), `ALPHA_SESSION_SECRET`, `ALPHA_ACCESS_CODE`, `ALPHA_PUBLIC_ORIGIN`, `ALPHA_MAX_SEATS=4`.
- Logs: `railway logs -s aoh-alpha -d` (deploy), `-b` (build). Pausar: `railway service scale ams=0 -s aoh-alpha` (ou remover o deploy: `railway down -s aoh-alpha`). Rollback: Railway → serviço → Deployments → Redeploy do deploy anterior (ou `git revert` + push na branch).
- Verificação viva: `ALPHA_BASE_URL=… ALPHA_ACCESS_CODE=… npx playwright test -c playwright.external.config.ts`; `node scripts/alpha-live-persistence.mjs plan|verify`; `node scripts/alpha-live-rooms.mjs`.

## V1.1 — Bots (experimental)
- **Lobby:** o anfitrião usa "Adicionar bot" em cada lugar vazio (2–4 lugares no total, pelo menos 1 humano) e "Remover bot" antes de iniciar. O bot é um assento real (civilização, Pátria, recursos, mão, Ordens), marcado **BOT** na placa e no lobby.
- **Política:** a política de bot **já existente** (`scripts/lib/alpha-bots.mjs`, persona + skill "competent") foi portada sem mudar comportamento para `apps/server/src/alpha-bot-policy.ts`. Roda **no servidor**.
- **Sem informação privilegiada:** o bot só recebe `redactStateForSeat` (`alpha-bot-view.ts`): mão/Ambições/Ordens/planos/pesquisa/recursos dos rivais, Regiões fechadas, peças/cidades/ameaças fora de visão, baralhos e RNG futuro são removidos. As decisões voltam como **comandos canônicos** (`applyAlphaCommand`), validados pelo motor como os de um humano.
- **Ritmo:** planeja na hora; confirma "Pronto" após 0,5–1,5 s (`ALPHA_BOT_DELAY_MS`; `0` nos testes). Nunca age em SUSPENDED/CLOSED/FINISHED. Se a política falhar, responde o mínimo legal (Ambições, escolhas pendentes, evento mundial) e confirma; logs `BOT_ADDED BOT_REMOVED BOT_PLAN_STARTED BOT_PLAN_CONFIRMED BOT_COMMAND_REJECTED BOT_DECISION_FALLBACK`.
- **Regras sociais:** bot nunca é host, não vota, não vira EM GUARDA, não pode ser removido por voto e não conta como "jogador ativo" administrativo. Humano que cai **não** vira bot (continua Ausente/EM GUARDA/Reassumir).
- **Limitações da política (registradas, não corrigidas):** não usa reações sociais; não define prioridade de baixas nem Reação de combate (usa os padrões do motor); joga fraco em guerra/combate; memória de plano (por rodada) é em RAM e é refeita após reiniciar; Ameaças do Mundo são outro sistema.

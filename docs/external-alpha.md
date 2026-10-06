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

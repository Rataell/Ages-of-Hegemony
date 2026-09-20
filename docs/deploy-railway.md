# Deploy da Closed Alpha (Railway + Supabase/PostgreSQL)

Status: preparado, **não executado**. Nenhum deploy, push, commit ou tag foi feito. Segredos nunca entram no repositório.

## O que sobe

Um único serviço Next.js (`apps/web`), com API em `/api/alpha` e health em `/api/alpha/health`. `railway.json` define build, migration antes do start, start e healthcheck. Node >= 22.12. npm é autoritativo (`package-lock.json`); pnpm não é usado.

## Variáveis (serviço Railway)

| Variável | Obrigatória | Observação |
| --- | --- | --- |
| `DATABASE_URL` | sim | Conexão de runtime do Supabase (pooler, SSL). Só no servidor. |
| `DIRECT_URL` | recomendada | Conexão direta para `prisma migrate deploy` (o pooler transacional não serve para migrations). |
| `ALPHA_SESSION_SECRET` | sim | Aleatório privado, mínimo 32 bytes. `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `ALPHA_PUBLIC_ORIGIN` | sim | URL HTTPS pública exata, sem barra final (ex.: `https://<servico>.up.railway.app`). Produção recusa origem HTTP. |
| `NEXT_PUBLIC_ALPHA_FEEDBACK_URL` | opcional | Link de feedback (formulário/e-mail). Lida no **build**; sem ela só existe "Copiar diagnóstico". |
| `NODE_ENV`, `PORT` | automáticas | Railway define. |

## Comandos

```sh
# 1. Uma vez: aplicar migrations no banco alpha identificado (nunca migrate dev/reset)
DATABASE_URL="<direta>" npx prisma migrate deploy
DATABASE_URL="<direta>" npx prisma migrate status

# 2. Railway (após o remote Git existir)
railway login
railway link                      # projeto/serviço da alpha
railway variables --set "ALPHA_SESSION_SECRET=<gerado>" --set "ALPHA_PUBLIC_ORIGIN=https://<dominio>" --set "DATABASE_URL=<runtime>" --set "DIRECT_URL=<direta>"
railway up                        # ou push na branch ligada ao serviço

# 3. Verificação pós-deploy
curl -s https://<dominio>/api/alpha/health   # {"ok":true,...,"migration":true}
```

`railway.json` roda `npx prisma migrate deploy` como `preDeployCommand` (usa `DIRECT_URL` quando definida, via `prisma.config.ts`) e usa o health como gate de release.

## Rollback

Reimplantar a versão anterior no Railway. Tabelas e snapshots são preservados (migrations só aditivas, snapshot original arquivado em `AlphaMatchArchive`). Nunca `migrate reset` nem apagar tabelas.

## Oculto ou desligado na Closed Alpha

- `/` (fatia local) redireciona para `/alpha`; `/api/local` responde 404 em produção; o link "experiência local" some.
- Sem controles para ofertas comerciais, contestação cultural e ações de povos independentes (comandos existem no schema e respondem `NOT_IMPLEMENTED`; nenhum controle os envia; teste `tests/alpha-ui-coverage.test.ts`).
- Sem IA, espectadores, matchmaking, ranking, contas ou WebSocket (polling de 2,5 s).

## Smoke da Closed Alpha

`scripts/alpha-smoke.mjs` faz o smoke por HTTP real, no build local ou no domínio público (sem credenciais; cria uma partida QUICK descartável):

```sh
export ALPHA_SMOKE_URL=https://<dominio> ALPHA_PUBLIC_ORIGIN=https://<dominio>
node scripts/alpha-smoke.mjs health   # /api/alpha/health ok, banco e migrations
node scripts/alpha-smoke.mjs play     # lobby, 2 pessoas, uma rodada completa, recarga, sessão forjada recusada
# reiniciar o serviço (railway redeploy / restart)
node scripts/alpha-smoke.mjs resume   # mesma partida, mesma versão e recursos, mais uma rodada
```

Resultado local (2026-09-20): build de produção + PostgreSQL 18 real (embarcado, porta local): `health`, `play`, reinício do processo e `resume` passaram; `prisma validate`, `migrate deploy` (3 migrations) e `npm run test:db` (6 testes) também. Repetir no domínio público antes de convidar testadores.

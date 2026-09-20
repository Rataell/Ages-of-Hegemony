# Closed Alpha local

Roda a mesma aplicação de produção (Next.js + Prisma/PostgreSQL) na sua máquina, com Fast Refresh, em `http://127.0.0.1:3001/alpha`. Nada aqui muda o build, o Railway ou o `main`.

Requisitos: Node >= 22.12, npm, e um PostgreSQL local (o `docker-compose.yml` já traz um: `npm run db:up`).

## Setup (uma vez)

```sh
npm install
npm run db:up                                   # PostgreSQL local em 127.0.0.1:5432 (Docker)
# Windows PowerShell: Copy-Item apps/web/.env.local.example apps/web/.env.local
cp apps/web/.env.local.example apps/web/.env.local
```

Edite `apps/web/.env.local`:

- `DATABASE_URL`: já vem apontando para o banco do `docker compose`.
- `ALPHA_SESSION_SECRET`: gere com `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
- `ALPHA_PUBLIC_ORIGIN`: deixe `http://127.0.0.1:3001`.
- `DIRECT_URL`: opcional; só com banco hospedado por pooler.

```sh
npm run alpha:env:check      # confere o arquivo; imprime só nomes, nunca valores
npm run db:migrate:local     # prisma migrate deploy no banco do .env.local
```

## Dia a dia

```sh
npm run dev:alpha            # prepara o workspace e sobe http://127.0.0.1:3001/alpha
```

- Alterações em `apps/web` recarregam na hora (Fast Refresh).
- Alterações em `packages/*` e `apps/server` precisam recompilar: use `npm run dev:alpha -- --watch-packages` ou rode `npm run compile` e recarregue.
- Abra por `http://127.0.0.1:3001/alpha`. Em `localhost` a checagem de origem recusa as requisições.
- Health: `http://127.0.0.1:3001/api/alpha/health`. O smoke real por HTTP: `ALPHA_SMOKE_URL=http://127.0.0.1:3001 node scripts/alpha-smoke.mjs play`.
- Para jogar sozinho, use duas janelas (uma anônima): cada uma recebe sua própria sessão de convidado.

## O que o script valida

Se algo faltar, `dev:alpha` para com uma mensagem por variável, sem mostrar valores:

- `.env.local` ausente, com instrução de cópia;
- `DATABASE_URL` ausente ou que não seja `postgresql://…`;
- `ALPHA_SESSION_SECRET` ausente ou com menos de 32 caracteres;
- `ALPHA_PUBLIC_ORIGIN` diferente de `http://127.0.0.1:3001`;
- aviso (não bloqueia) se nada responde na porta do banco.

`db:migrate:local` só aceita banco em `localhost`/`127.0.0.1`. Para migrar um banco remoto de propósito: `node scripts/local-alpha.mjs migrate --allow-remote`. Ele usa `prisma migrate deploy` (nunca `migrate dev` nem `reset`).

O `.env.local` real é ignorado pelo Git (`.env.*`); só o `.env.local.example` é versionado. Em produção as variáveis vêm do Railway (veja `docs/deploy-railway.md`), não deste arquivo.

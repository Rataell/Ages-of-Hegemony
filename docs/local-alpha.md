# Closed Alpha local

Roda a mesma aplicação de produção (Next.js + Prisma/PostgreSQL) na sua máquina, em `http://127.0.0.1:3001/alpha`, com alterações em tempo real antes de qualquer commit, push ou deploy. Nada aqui muda o build, o Railway ou o `main`.

Requisitos: Node >= 22.12, npm e **um PostgreSQL de desenvolvimento separado do de produção** (local ou externo). Sem Docker obrigatório.

## Setup (uma vez)

```sh
npm install
# Windows PowerShell: Copy-Item apps/web/.env.local.example apps/web/.env.local
cp apps/web/.env.local.example apps/web/.env.local
```

Edite `apps/web/.env.local` (ignorado pelo Git; só o `.env.local.example` é versionado):

- `DATABASE_URL`: o banco de **desenvolvimento**. Hosts do Railway são recusados pelos scripts.
- `ALPHA_SESSION_SECRET`: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
- `ALPHA_PUBLIC_ORIGIN`: exatamente `http://127.0.0.1:3001`.
- `DIRECT_URL`: opcional, só com banco hospedado por pooler.

```sh
npm run alpha:env:check      # confere o arquivo; imprime só nomes, nunca valores
npm run db:migrate:local     # prisma migrate deploy (recusa banco remoto sem --allow-remote)
```

## Trabalhar em tempo real

```sh
npm run dev:alpha
```

Sobe o Next em `127.0.0.1:3001` **e** `tsc -b -w` para `packages/shared`, `game-domain`, `game-engine` e `apps/server`:

- `.tsx`/`.css` em `apps/web`: Fast Refresh.
- Código em `packages/*` e `apps/server`: o `tsc` recompila para `dist` e o servidor local recarrega o módulo; a próxima requisição já usa o código novo, sem reiniciar e sem `npm run compile`. (Em desenvolvimento o runtime da Alpha é reconstruído quando o módulo recarrega; em produção ele é criado uma vez, como antes.)
- Ctrl+C encerra o Next e o `tsc` (e os processos filhos). Se um dos dois cair, o outro é encerrado.
- `npm run dev:alpha -- --no-watch-packages` liga só o Next.
- Abra por `http://127.0.0.1:3001/alpha`, não por `localhost` (a origem é conferida a cada requisição).
- Se a porta 3001 estiver ocupada, o script avisa. Outra porta: `ALPHA_LOCAL_PORT=3002` e `ALPHA_PUBLIC_ORIGIN=http://127.0.0.1:3002`.
- Health: `http://127.0.0.1:3001/api/alpha/health`.

Se faltar algo, ele para com uma mensagem por variável, sem mostrar valores: `.env.local` ausente, `DATABASE_URL` inválida ou apontando para o Railway, `ALPHA_SESSION_SECRET` com menos de 32 caracteres, `ALPHA_PUBLIC_ORIGIN` diferente do local. Com banco externo, ele mostra `host:porta/banco` (sem credenciais) para você conferir que não é o de produção.

## Vários jogadores sozinho (só desenvolvimento)

Com `npm run dev:alpha` rodando, em outro terminal:

```sh
npm run alpha:players -- --players=2
```

Abre 2 janelas Chromium (Playwright), cada uma um navegador separado com cookie e sessão de convidado próprios, em `/alpha`, com os nomes "Jogador A", "Jogador B"… já preenchidos. Você cria a mesa e entra nas outras pelo código ou link, como no fluxo real. De 2 a 6 jogadores.

Atalhos opcionais, que só preenchem os mesmos formulários:

- `--auto-join`: cria a mesa na janela A (com o número de lugares) e entra nas demais pelo link de convite.
- `--start`: além disso, cada janela escolhe uma civilização, confirma, e a A inicia a partida.
- `--no-names` (não preenche nomes), `--layout=none` (sem organizar as janelas), `--screen=1920x1080`.

Não há personificação, troca de `guestId`, cookie forjado nem endpoint novo: o harness fica em `scripts/`, fora do app e do servidor, e recusa qualquer endereço que não seja local. Se o Chromium do Playwright faltar: `npx playwright install chromium`.

## Smoke por HTTP

`ALPHA_SMOKE_URL=http://127.0.0.1:3001 ALPHA_PUBLIC_ORIGIN=http://127.0.0.1:3001 node scripts/alpha-smoke.mjs play` cria uma partida descartável no banco de desenvolvimento.

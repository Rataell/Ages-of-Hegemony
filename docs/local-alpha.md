# Closed Alpha local

Roda a mesma aplicação (Next.js) na sua máquina, em `http://127.0.0.1:3001/alpha`, com alterações em tempo real antes de qualquer commit, push ou deploy. Nada aqui muda o build, o Railway ou o `main`.

Requisitos: Node >= 22.12 e `npm install`. **Sem PostgreSQL, Railway, Docker, `.env.local` ou migrations.**

## Começar

```sh
npm install
npm run dev:alpha
```

Abra `http://127.0.0.1:3001/alpha` (não `localhost`: a origem é conferida a cada requisição).

- As partidas ficam **em memória** neste processo. Sobrevivem a Fast Refresh e a recarga de módulos; reiniciar o `npm run dev:alpha` as apaga.
- O segredo de sessão é gerado aleatoriamente a cada execução e a origem é definida pelo script. Cada navegador continua recebendo sua própria sessão de convidado assinada, como em produção.
- Fast Refresh para `.tsx`/`.css` em `apps/web`; `tsc -b -w` recompila `packages/*` e `apps/server`, e a próxima requisição já usa o código novo (sem `npm run compile`).
- Ctrl+C encerra o Next e o `tsc` com seus processos filhos. `npm run dev:alpha -- --no-watch-packages` liga só o Next.
- Porta 3001 ocupada: o script avisa. Outra porta: `ALPHA_LOCAL_PORT=3002 npm run dev:alpha`.
- Health: `http://127.0.0.1:3001/api/alpha/health` responde `{"ok":true,"service":"ages-of-hegemony-alpha","release":"alpha-v0.1","storage":"memory"}`.

O armazenamento em memória **só existe fora de produção**: com `NODE_ENV=production` o servidor exige PostgreSQL e recusa `ALPHA_STORAGE=memory`. O health de produção continua verificando banco e migrations.

## Vários jogadores sozinho (só desenvolvimento)

Com `npm run dev:alpha` rodando, em outro terminal:

```sh
npm run alpha:players -- --players=2
```

Abre 2 janelas Chromium (Playwright), cada uma um navegador separado com cookie e sessão de convidado próprios, em `/alpha`, com "Jogador A", "Jogador B"… já preenchidos. Você cria a mesa e entra nas outras pelo código ou link, como no fluxo real. De 2 a 6 jogadores.

Atalhos opcionais, que só preenchem os mesmos formulários:

- `--auto-join`: cria a mesa na janela A (com o número de lugares) e entra nas demais pelo link de convite.
- `--start`: além disso, cada janela escolhe uma civilização, confirma, e a A inicia a partida.
- `--no-names` (não preenche nomes), `--layout=none` (sem organizar as janelas), `--screen=1920x1080`.

Não há personificação, troca de `guestId`, cookie forjado nem endpoint novo: o harness fica em `scripts/`, fora do app e do servidor, e recusa qualquer endereço que não seja local. Se o Chromium do Playwright faltar: `npx playwright install chromium`.

## Avançado: PostgreSQL de desenvolvimento

Só quando você quiser testar persistência de verdade. Fora do fluxo principal.

```sh
cp apps/web/.env.local.example apps/web/.env.local     # PowerShell: Copy-Item ...
# edite: DATABASE_URL (banco de DESENVOLVIMENTO), ALPHA_SESSION_SECRET (>=32), ALPHA_PUBLIC_ORIGIN=http://127.0.0.1:3001
npm run alpha:env:check        # confere o arquivo; nunca imprime valores
npm run db:migrate:local       # prisma migrate deploy
npm run dev:alpha:pg           # mesmo servidor, sobre o PostgreSQL (ALPHA_STORAGE=postgres)
```

Se faltar algo, o script para com uma mensagem por variável, sem mostrar valores. Nenhuma URL, senha ou segredo é impresso.

### Banco remoto de desenvolvimento (ex.: Railway, ambiente `development`)

Banco em `localhost`/`127.0.0.1`: usado normalmente. Banco **remoto** é recusado por padrão e só é aceito quando **as duas** condições valem:

1. `apps/web/.env.local` contém a linha `AOH_LOCAL_DB_ENV=development` (escrita no próprio arquivo; uma variável só no shell não vale);
2. o comando leva `--allow-remote`.

```sh
npm run alpha:env:check                                # basta o marcador
npm run db:migrate:local -- --allow-remote
npm run db:migrate:local -- --allow-remote --dry-run   # só valida, não aplica nada
npm run dev:alpha:pg -- --allow-remote
```

O script **não tenta descobrir se um host é produção**: desenvolvimento e produção podem usar a mesma infraestrutura e o mesmo proxy. O marcador é uma declaração sua; só o use com o banco do ambiente de desenvolvimento. `ALPHA_PUBLIC_ORIGIN` continua precisando ser `http://127.0.0.1:3001`, o que barra um `.env` de produção copiado por engano.

O smoke por HTTP (`node scripts/alpha-smoke.mjs play`, com `ALPHA_SMOKE_URL=http://127.0.0.1:3001`) funciona nos dois modos.

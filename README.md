# Ages of Hegemony

Jogo 4X original para **2–6 jogadores**, na v0.4: economia territorial, melhorias, expansão urbana, distritos e edifícios sobre um motor determinístico. Valores de balanceamento são provisórios; combate e multiplayer completo continuam fora do escopo.

## Executar

Recomendado: Node.js 24 LTS e npm 11+ (a implementação também foi verificada com Node 26.4 / npm 12).

```sh
npm ci
npm run check
npm run demo
```

`compile` gera o cliente Prisma e compila os pacotes na ordem das referências TypeScript. A primeira geração pode precisar baixar o binário do Prisma. Nenhum banco é necessário para lint, typecheck, testes unitários, build ou demo.

Em terminais separados:

```sh
npm run dev:web
npm run dev:server
```

Interface jogável: http://127.0.0.1:3000. Use **Nova Partida**, escolha 2–6 jogadores locais e execute a primeira manutenção para entrar em Planejamento. O mapa SVG permite selecionar cidades e territórios, distribuir população, reivindicar, trabalhar, melhorar, construir, desenvolver e fundar cidades. A barra inferior avança as fases e abre o relatório econômico.

**Local Development Gameplay Session:** hotseat/perspectivas de debug, sem IA, autenticação ou multiplayer. O servidor mantém progresso temporário em memória. `POST /api/local` funciona somente em desenvolvimento; `next dev` escuta loopback. O navegador nunca executa regras nem recebe GameState completo. Leia [Local Play](docs/local-play-mode.md) e [guia da vertical slice](docs/product-vertical-slice.md).

Health check opcional: http://127.0.0.1:4000/health. Não é necessário iniciar `dev:server` para jogar. `npm run demo` continua executando o cenário técnico e verificando restauração v3 e migração explícita v2.

E2E: `npx playwright install chromium`, depois `npm run test:e2e`. O teste inicia o servidor quando necessário e grava screenshots em `docs/evidence/product-slice/`. npm e `package-lock.json` são autoritativos; arquivos provisórios locais de pnpm são ignorados, não representam migração.

## PostgreSQL opcional

Crie um banco de desenvolvimento, configure `DATABASE_URL` no ambiente e aplique a migração. O arquivo `.env.example` é uma referência; o projeto não carrega `.env` automaticamente.

PowerShell:

```powershell
$env:DATABASE_URL = 'postgresql://aoh:aoh@localhost:5432/aoh?schema=public'
npm run db:validate
npx prisma migrate deploy
```

`connectDatabase(url)` cria o adaptador PostgreSQL. Injete o repository retornado em `GameService` e chame `close()` no encerramento. O executável de health check não abre conexão com o banco; o demo usa memória. Não há credenciais de produção no repositório.

## Verificações

| Comando | Finalidade |
| --- | --- |
| `npm run lint` | ESLint, proibição de `any` explícito e de dependências de infraestrutura no domínio/motor |
| `npm run typecheck` | Compilação estrita dos pacotes, servidor, testes e Next.js |
| `npm test` | Vitest: regras, determinismo, validação e fronteiras do servidor |
| `npm run build` | Pacotes/servidor JavaScript + build de produção Next.js |
| `npm run demo` | Reclamar → trabalhar → melhorar → produzir → construir → fundar → administrar → restaurar v3 e migrar v2 |
| `npm run db:validate` | Validação do schema Prisma |

## Organização

```text
apps/
  web/app/                  página Next.js/React
  server/src/               serviço, visão privada, repositories, HTTP e demo
packages/
  shared/src/               Result<T, E>
  game-domain/src/          tipos, schemas e serialização
  game-engine/src/          comandos, fases, recursos, hexágonos e RNG
prisma/                     schema e migração PostgreSQL
docs/                       arquitetura, domínio, loop, decisões e pendências
tests/                      testes Vitest e configuração de tipos
```

Consulte [arquitetura](docs/architecture.md), [domínio](docs/game-domain.md), [loop](docs/game-loop.md), [cidades/população](docs/cities-and-population.md), [governos](docs/governments.md), [compatibilidade](docs/decisions/0003-civilization-maintenance-and-snapshots.md) e [pendências](docs/roadmap.md).

Snapshots atuais usam schema 3. V2 requer migração explícita `migrateSnapshotV2ToV3`. Snapshots da Rodada 1 são recusados com orientação explícita de conversão e devem ser preservados; o commit `9d63e69` continua sendo a referência para carregá-los. Não há migração SQL nova nesta rodada.

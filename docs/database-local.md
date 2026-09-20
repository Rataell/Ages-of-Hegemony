# PostgreSQL local (Docker)

Somente para desenvolvimento e testes de integração. Web e server **não** rodam em contêiner. O banco da Public Alpha (Supabase) nunca é usado por `test:db`.

## Serviços (`docker-compose.yml`)

| Serviço | Porta | Dados | Uso |
|---|---|---|---|
| `db-dev` | 127.0.0.1:5432 | volume persistente `aoh-dev-data` | desenvolvimento |
| `db-test` (perfil `test`) | 127.0.0.1:5433 | `tmpfs`, efêmero | testes de integração |

Ambos têm healthcheck (`pg_isready`). Credenciais `aoh/aoh` são descartáveis e locais.

## Comandos

- `npm run db:up` inicia o banco de desenvolvimento e espera ficar saudável. `npm run db:down` o para sem apagar dados.
- `npm run db:deploy` aplica as migrations ao banco apontado por `DATABASE_URL` (`postgresql://aoh:aoh@localhost:5432/aoh`).
- `npm run test:db:docker` sobe `db-test`, aplica `prisma migrate deploy`, roda a suíte de integração e remove o contêiner (`KEEP_TEST_DB=1` mantém).
- `npm run test:db` roda a suíte contra o `ALPHA_TEST_DATABASE_URL` já definido e migrado (local, porta 5433).

## Salvaguardas

A suíte e o script recusam qualquer host que não seja `localhost`/`127.0.0.1`/`::1`. Nunca use `migrate dev` ou `migrate reset` em banco público. Os testes removem apenas as linhas que criaram.

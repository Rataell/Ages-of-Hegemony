# Proposta de hospedagem da RC6 (nada provisionado)

Data: 2026-10-13. Esta é uma proposta. Nenhum recurso foi criado, alterado, apagado ou promovido, e nenhum segredo foi lido ou impresso. Só consultei, em modo leitura, `railway status`/`railway list` (nomes de serviços e ambientes) e a documentação pública de preços.

## Onde estamos hoje no Railway

Workspace "Rafael Reina.'s Projects", dois projetos: `carefree-essence` e `AoH External Alpha`.

Projeto `AoH External Alpha`: **4 serviços**.

| Ambiente | Serviço | Conteúdo |
|---|---|---|
| `production` | `aoh-alpha` | RC4 (branch `fix/aoh-alpha-correctness-pre-v2`), online |
| `production` | `Postgres` | banco do RC4, 1 volume |
| `rc5-preview` | `aoh-alpha-rc5` | RC5 (branch `rc5/alpha-v1.2`) |
| `rc5-preview` | `Postgres-7GKq` | banco da RC5 e das suas partidas, 1 volume |

Repositório ligado: `Rataell/Ages-of-Hegemony`. O deploy é por push no branch que o serviço acompanha (a nota da RC5 diz que `railway up` e o redeploy da CLI falharam no Railpack).

## O limite real

Os metadados das implantações listam `plan=trial`. Não consegui ver o plano atual no painel de cobrança; **confirme em Settings → Billing** antes de decidir. Se for mesmo Trial, os limites oficiais ([railway.com/pricing](https://railway.com/pricing), [docs.railway.com/reference/pricing/plans](https://docs.railway.com/reference/pricing/plans)) são:

| | Trial | Free | Hobby | Pro |
|---|---|---|---|---|
| Serviços por projeto | **5** | 3 | 50 | 100 |
| Projetos por workspace | **2** (já usados) | 1 | 50 | 100 |
| vCPU / RAM por serviço | 2 / 1 GB | 1 / 0,5 GB | até 48 / 48 GB | até 1000 / 1 TB |
| Volume por serviço | 0,5 GB | 0,5 GB | 5 GB | 1 TB |
| Preço do plano | crédito único de US$ 5 (30 dias) | US$ 0 | US$ 5/mês com US$ 5 de uso | US$ 20/mês com US$ 20 de uso |

Uso: RAM US$ 10 por GB-mês, vCPU US$ 20 por vCPU-mês, volume US$ 0,15 por GB-mês, saída de rede US$ 0,05 por GB. A documentação diz que, ao esgotar o crédito do Trial, **os serviços são parados** até migrar para um plano pago. Isso vale para o RC4 em produção também, e é um risco independente da RC6.

Consequência: com 4 serviços e limite 5, cabe **mais um** serviço no projeto. Uma RC6 completa (aplicação mais Postgres próprio) precisa de dois, então não cabe no Trial sem mudar o desenho ou o plano. Um projeto novo também não cabe (já são 2 projetos).

## Restrição de segurança

A RC6 nunca deve apontar para o banco da RC5 nem para o do RC4: os schemas de gravação são estritos, uma partida gravada pela RC6 não abre num binário RC5, e uma partida da RC5 continuada na RC6 também deixa de abrir na RC5 (ver `docs/external-alpha-v1.2-rc6.md`). Todas as opções abaixo respeitam isso. Nenhuma toca `aoh-alpha`, `Postgres` ou `aoh-alpha-rc5`.

## Opções

### A. Hobby e ambiente próprio (mais limpo)
1. Você aprova o upgrade para Hobby (US$ 5/mês, 50 serviços por projeto, volumes de 5 GB). Eu não faço upgrade sozinho.
2. Novo ambiente vazio `rc6-preview` no mesmo projeto, com um serviço `aoh-alpha-rc6` (branch `rc6/alpha-v1.2`) e um Postgres novo, volume próprio, rede privada do ambiente, segredos e código de acesso novos, domínio próprio. Serviços: 4 → 6.
3. Custo adicional estimado (a medir em Billing → Usage nos primeiros dias): aplicação Next com cerca de 0,5 GB de RAM e 0,05 vCPU ≈ US$ 6/mês; Postgres pequeno com cerca de 0,25 GB, 0,02 vCPU e volume de 0,5 GB ≈ US$ 3/mês; total ≈ US$ 9/mês além do plano. O ambiente pode ser desligado depois do playtest.
4. Isolamento: total (instância, volume, rede, segredos).

### B. Sem mudar de plano: aplicação no 5º serviço, banco no Supabase
1. Serviço `aoh-alpha-rc6` no Railway (5 de 5), banco num projeto Supabase novo e exclusivo da RC6 (a documentação original de deploy já previa Supabase: `DATABASE_URL` pelo pooler com SSL e `DIRECT_URL` direta para `prisma migrate deploy`).
2. Custo: US$ 6/mês estimados pela aplicação no Railway; Supabase no plano gratuito (sujeito aos limites e à pausa por inatividade do plano gratuito, que eu não verifiquei).
3. Isolamento: físico, o banco da RC6 não compartilha instância com nenhum outro. Contra: outro fornecedor e mais latência.
4. A criação do projeto Supabase precisa da sua aprovação.

### C. Sem mudar de plano nem de fornecedor: um banco lógico separado dentro do Postgres da RC5
1. Serviço `aoh-alpha-rc6` no ambiente `rc5-preview` (5 de 5), para alcançar `Postgres-7GKq` pela rede privada.
2. Dentro dessa instância: um papel `aoh_rc6` e um banco `aoh_rc6` novos, sem nenhuma permissão no banco da RC5. As tabelas, as migrações e o `_prisma_migrations` ficam só no banco novo.
3. Contra: a instância e o volume (limite de 0,5 GB no Trial) são compartilhados com as partidas da RC5; um erro de URL aponta a RC6 para a instância das partidas. Mitigação: papel sem acesso ao banco da RC5, backup antes e verificação do nome do banco no `health`.
4. É a única opção sem custo de plano e sem novo fornecedor, mas é a de isolamento mais fraco.

### D. Substituir a RC5 (não recomendado)
Só se for imprescindível. Antes de qualquer substituição:
1. Exportar todas as partidas da RC5: `pg_dump -Fc` de `Postgres-7GKq` (via `railway connect` ou o proxy TCP do serviço), guardado fora do repositório, com checksum, e um `pg_restore --list` para verificar o conteúdo. Conferir também o número de partidas pela API da RC5.
2. Não apagar `Postgres-7GKq`; só repontar o serviço.
3. Recuperação: redeploy do commit da RC5 (`rc5/alpha-v1.2`) no mesmo serviço e `DATABASE_URL` de volta ao banco original; se o banco tiver sido tocado, `pg_restore` do dump.
4. Eu não executo nenhuma exclusão ou troca sem sua aprovação.

## Recomendação

- **Se você aprovar o upgrade para Hobby: opção A.** É a mais limpa (um ambiente por versão, cada um com o seu banco) e ainda acaba com o risco de o Trial esgotar e parar o RC4.
- **Se não houver upgrade: opção B**, pelo isolamento físico do banco. Opção C só se preferir não abrir conta de outro fornecedor, ciente de que compartilha instância com as partidas da RC5.
- Em qualquer caso, antes de subir: confirmar o plano e o crédito restante em Billing, e fazer um dump da RC5 como seguro.

## O que cada passo precisa de você

| Passo | Quem | Observação |
|---|---|---|
| Confirmar o plano em Billing | você | decide entre A e B/C |
| Upgrade para Hobby | você | só opção A |
| Push do branch `rc6/alpha-v1.2` para `origin` | você autoriza, eu executo | necessário para o deploy por branch |
| Criar ambiente/serviço/Postgres (A) ou serviço (B, C) | você aprova, eu executo | segredos novos gerados e guardados só no Railway |
| Criar projeto Supabase | você aprova | só opção B |
| Smoke público | eu | `scripts/rc5-public-smoke.mjs` tem a versão `rc5` fixa; precisa de uma cópia `rc6` |
| Exclusões e rollback | você aprova | a RC6 se desliga removendo o serviço da RC6, sem tocar RC4 nem RC5 |

## Verificação depois de subir (quando aprovado)

`GET /api/alpha/health` com `release: alpha-external-1.2-rc6`, `database: true`, `migration: true`, `accessProtected`; smoke `health`, `play` (lobby, duas pessoas, uma rodada, recarga), reinício do serviço e `resume`; conferir que o RC4 e a RC5 continuam respondendo com as suas versões e o mesmo número de partidas.

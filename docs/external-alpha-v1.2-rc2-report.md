# External Alpha V1.2 · RC2 / RC3 — relatório

Escopo: *Mover é descobrir*, progressão naval, Ressonância física, rotação do `ALPHA_ACCESS_CODE` e o deploy de `1d7b779` (incluído como base). Arquitetura e regras estão em `docs/external-alpha-v1.2-rc2.md`. **Não foi criado o `external-alpha-v1.2-frozen`**: ele espera o playtest humano.

## 1. Estado de produção

| | Commit | Deploy | Tag |
|---|---|---|---|
| RC1 (anterior) | `64d969c` | `70f4adf2` | `external-alpha-v1.2-rc1` (não movida) |
| RC2 | `b66d9f6` | `d4178fd5` | `external-alpha-v1.2-rc2` |
| **RC3 (ativo)** | `b93fd02` | `2013d777` | `external-alpha-v1.2-rc3` |

- RC2 já inclui `1d7b779` (número da rodada, "Figura", relatório RC1). **RC3 = RC2 + uma correção de interface** (§5): a faixa do topo cortava Era/rodada/Ressonância/fase com seis lugares a 1280 px. Foi corrigida e reimplantada porque prejudica o jogo; por isso o RC2 foi seguido de um RC3 (a tag do RC2 não foi movida).
- Branch de trabalho: `feature/external-alpha-finalization-rc` (o serviço Railway acompanha `fix/aoh-alpha-correctness-pre-v2`, que recebeu fast-forward até `b93fd02`). Nada foi mesclado em `main`.
- Rollback: o deploy anterior `70f4adf2` (RC1, `64d969c`) e, abaixo dele, `55cf8a66`. Sem migrations novas em nenhum dos dois deploys.
- Health (RC3): `database:true`, `migration:true`, `maxSeats:6`, `accessProtected:true`, `singleInstance:true`.

## 2. `ALPHA_ACCESS_CODE`

Rotacionado antes do RC2, **sem imprimir o valor** (gerado local, gravado no Railway por stdin com `--skip-deploys`, aplicado pelo deploy seguinte).
- Código antigo: **HTTP 403 `ACCESS_CODE`**. Código novo: **HTTP 200**, sala criada.
- Convidados continuam entrando **sem digitar código** (smoke: "invite link auto-joins a device with a remembered name (no access code)").
- O valor novo está só nas Variables do Railway (o arquivo temporário do antigo foi apagado). `ALPHA_SESSION_SECRET` e a senha do Postgres não foram tocados nesta passagem (rotacionados no RC1).

## 3. Smoke público (RC2 e RC3)

`scripts/alpha-rc-smoke.mjs all`: **45 PASS, 0 FAIL** nos dois deploys. Cobre health, criar sala (sem código recusado), convite sem código, Core 10 (chassi oculto recusado), Figuras ocultas até todos prontos, Compacto/Padrão/Amplo, presets (Arquipélago, Continental, Mar Interior, Misto), reação, SSE, reload, suspend/resume, **gate de 6 lugares** (1H+5B: Amplo recomendado, seis civilizações distintas, bots confirmam, rodada resolve, reload mantém os seis, suspend/resume; e seis sessões humanas com presença ONLINE), mundos sem scroll de documento. Capturas em `docs/evidence/rc2/public/`.

UI de produção (`scripts/alpha-rc2-prod-ui.mjs`, sala real): o cloud do Pioneiro tem **Mover** e **Fundar**, nunca "Explorar"; Mover destaca Regiões fechadas; o seletor de orientação aparece; a ordem fica "Mover · descobrir"; sem scroll de documento.

## 4. Playtest em produção (política de cliente pela API pública, bots reais — **não é playtest humano**)

- **1H+3B · Padrão · Misto · 14 rodadas**: dois Pioneiros descobrem por Move nas rodadas 1–2 (aceitos e resolvidos), depois um funda; Descobertas Vestígio, Perigo e Terra comum; 13 de 30 Regiões abertas ao fim.
- **1H+3B · Padrão · Arquipélago · `--naval`**: Porto (Distrito Marítimo) construído, **Barca de Patrulha recrutada**, Pioneiro **embarca** (`EMBARK`), e a Barca com o Pioneiro a bordo **descobre pelo mar** (seed 9: ordens de descobrir da Barca aceitas nas rodadas 4–10; seed 31: nas rodadas 2–4; as Descobertas do mundo ao fim, de todos os lugares, incluíam Ancoradouro, Perigo, Vestígio, Passagem e Acampamento). Antes do embarque a Barca é recusada com "Necessita de um Pioneiro embarcado ou de Navegação Oceânica para descobrir."; o Pioneiro vê "Requer acesso naval." onde não há entrada por terra; do navio, "Requer acesso por terra." quando só há costa de terra. Em seed 9 o Perigo levou o Pioneiro embarcado e a Barca perdeu a capacidade de descobrir (regra existente do Perigo, sem alteração).
- Navegação Oceânica (navio sozinho) **não** foi vista em produção (exige pesquisar até a Era IV da Teia); está coberta por e2e de UI com fixture (`e2e/move-discovery-live.spec.ts`) e por testes de motor.
- Logs: `docs/evidence/rc2/playtest-*/log.json`.

## 5. Achados (classificados)

| Classe | Achado | Estado |
|---|---|---|
| **VISUAL/UX** | Com 4–6 lugares a 1280 px a faixa do topo cortava o texto de Era/rodada e escondia a Ressonância e a fase | **Corrigido no RC3** e implantado; e2e mede 1280/1366/1440 com seis lugares e com um alerta injetado |
| WORLD | Em Arquipélago algumas Regiões vizinhas só têm costa de terra para o navio ("Requer acesso por terra") e nenhum caminho de terra para o Pioneiro ("Requer acesso naval"); uma ilha pode ficar sem Região abrível por um tempo | Registrado; não é bloqueio (outras Regiões abrem e o acesso muda), mas merece olhar humano |
| BOT | Bots de personas que não exploram não montam expedição naval; nas sondagens de 14 rodadas a descoberta por navio ocorreu em parte das partidas | Registrado (sem redesenho de IA) |
| RULE | O Perigo pode eliminar o Pioneiro embarcado; o navio fica sem descobridor | Regra existente, só registrada |
| UX | O seletor "Orientação 1 de N" é abstrato e quase sempre tem 5–6 opções equivalentes | Intencional (não vaza terreno); a avaliar no playtest humano |
| — | Scripts de laboratório antigos (`alpha-lab`, `alpha-pioneer-compare`) ainda usam o formato antigo de explorar | Sem uso nos gates |
| — | Nenhum BLOCKER aberto | |

AUDIO e sensação de jogo: **não avaliados** (dependem do playtest humano).

## 6. Testes e gate

- `node scripts/rc-gate.mjs` (compile, tipos de testes, tipos do web, lint, 28 arquivos / 259 testes estruturais): **OK** (RC3).
- Suíte completa `vitest`: **1236/1236** (111 arquivos). Postgres em Docker: 7/7.
- e2e: 41 passando na rodada completa; as 2 falhas de `interaction-v2` (esperavam o Explorar antigo) foram atualizadas; `strip-six-seats` (3), `move-discovery-live` (7), `resonance-live` (2) e `v51b-table` passam; o `v51b-table` e a "Navegação Oceânica" do `move-discovery-live` já falharam de forma intermitente só com a máquina carregada na rodada completa e passam isoladas.
- Novos: `tests/alpha-move-discovery.test.ts` (14), `tests/alpha-bots-discovery.test.ts` (3), `tests/alpha-resonance.test.ts` (+marcas × encaixes), `tests/alpha-naval.test.ts` (Barca armada e bloqueio).

## 7. Compatibilidade de salas

- Salas V1.1 continuam somente leitura (409 `LEGACY_ROOM`), sem travar nem apagar; `EXPLORE` continua válido no schema e resolve em planos feitos antes do RC2, mas ninguém novo o cria. O fixture real de uma sala V1.1 (`tests/fixtures/v11-room.json`) segue passando em `tests/alpha-legacy-room.test.ts`.
- Salas do RC1 em andamento guardam a ficha antiga do navio leve no snapshot (Força 0); novas salas usam a Barca de Patrulha (Força 1).

## 8. O que falta antes do frozen

Playtest humano real (movimento, Pioneiro, expedição, exploração naval, mapas, combate, cartas, Core 10, Figuras, Ressonância, áudio, ritmo). Depois dele: corrigir apenas bugs reais, gate curto, deploy final e `external-alpha-v1.2-frozen`. Fora do escopo desta passagem (decisão do pedido): som na sala de criação/lobby, mais emojis/reações, mais tipos/níveis de mapa, novas Figuras, Patronos, ARID, rebalanceamentos.

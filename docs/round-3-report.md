# Relatório — Rodada 3 / v0.4

## 1. Resumo

Economia territorial integrada ao ciclo civilizacional: terrenos/features, propriedade e controle, trabalho por produtores, melhorias, fundação, distritos e edifícios. Produção é determinística e explicada por fontes reconciliadas com o estoque. Snapshot v3 e migração explícita v2 estão implementados. Não há combate, unidades, diplomacia, procedural, IA ou hegemonia.

## 2. Branch e commit

Branch isolada: `feature/aoh-economy-territory`, baseada em `66472ae` de `feature/aoh-cities-governments`. A branch e uma implementação parcial já estavam presentes ao iniciar esta execução; foram preservadas e completadas. Não foi necessário criar outra worktree. Nenhum merge em main e nenhum deploy.

Commit final atômico: `feat: add territorial economy districts and city expansion`, contendo este relatório. O hash é informado na entrega e pode ser consultado com `git log -1 --format=%H feature/aoh-economy-territory`. Não se grava um hash autorreferente dentro do próprio commit. Workspaces e lockfile identificam versão 0.4.0, sem atualização de dependências.

## 3. Arquivos principais

| Área | Arquivos |
| --- | --- |
| Domínio | `core.ts`, `model.ts`, `rules.ts`, `territory.ts`, `territory-invariants.ts`, `serialization.ts`, `snapshots/v2/*` |
| Motor | `territory-commands.ts`, `economy.ts`, `urban.ts`, `migration.ts`, `arithmetic.ts`, `stability.ts`, `civilization.ts`, `maintenance.ts`, `management.ts`, `engine.ts`, `hex.ts` |
| Servidor | `game-service.ts`, `debug-scenario.ts`, `demo.ts`, `fixtures/snapshot-v2.ts` |
| Web | `app/page.tsx`, `app/style.css` |
| Testes | `territory.test.ts`, `territory-infrastructure.test.ts`, `territory-integration.test.ts`, `territory-helpers.ts`, ajuste de fixtures em `governments.test.ts` |
| Documentação | arquitetura, domínio, loop, roadmap, economia/território, distritos/edifícios e ADR 0004 |

Os arquivos locais preexistentes `AGENTS.md` e `RTK.md` são preservados e versionados como instruções do repositório.

## 4. Modelo territorial

HexTile tem proprietário e controlador únicos e coerentes. Centros pertencem à cidade. Raios configurados por desenvolvimento: 1/1/2/2/3. Claims custam 1 influence e exigem hex livre, conhecido, não SEA, conectado por território próprio e no alcance. Caminho pode atravessar cidades da mesma civilização. CAS protege persistência; disputa simultânea continua pendente de resolver estratégico.

## 5. Yields

UNKNOWN 0/0/0; PLAINS 2/0/0; FOREST 1/1/0; HILLS e MOUNTAINS 0/2/0; COAST 1/0/1; SEA 1/0/0 descritivo, sem exploração normal. Ordem: food/materials/wealth. RIVER/FERTILE/FISH acrescentam food e TIMBER/STONE/METAL acrescentam materials, conforme compatibilidade configurada.

Produtor trabalha no máximo um hex produtivo da sua cidade. Território substitui sua subsistência, sem duplicação. Produtores não associados mantêm o modelo anterior. Features duplicadas, trabalho estrangeiro, controle incorreto e alcance inválido são rejeitados.

## 6. Melhorias

FARM +1 food; LUMBER_CAMP e QUARRY +1 materials; MINE +2 materials; FISHERY +1 food. Uma melhoria principal por hex, sem substituição. Custos e compatibilidade estão no catálogo. FISHERY exige COAST com FISH; SEA permanece inativo.

## 7. Fundação

FOUND_CITY paga 5 food/3 materials/2 wealth em território próprio, terrestre válido, vazio, não trabalhado, a distância mínima 2 de qualquer cidade. Nome validado e ID único. Nova cidade inicia com população 1 não alocada, estabilidade 60, desenvolvimento 1, especialização nula e progresso zero. Centro muda de controlador; capital permanece. Administração é atualizada imediatamente; ciclo seguinte inclui consumo, produção e estabilidade da nova cidade.

## 8. Distritos

AGRARIAN, COMMERCIAL, ACADEMIC, ADMINISTRATIVE, MILITARY, INDUSTRIAL e CULTURAL. Slots 1/2/3/4/5 por desenvolvimento; provisoriamente um distrito de cada tipo. Custos, desenvolvimento mínimo, requisitos de trabalhadores e efeitos inteiros são configuráveis. Sinergia com especialização correspondente soma uma unidade do efeito, sem porcentagem nova.

## 9. Edifícios

GRANARY reduz limiar local de crescimento em 2, piso 1. MARKET, LIBRARY e WORKSHOP somam produção com trabalhador correspondente. ARCHIVE soma capacidade administrativa; CULTURAL_CENTER soma influence; BARRACKS soma guarnição. Cada edifício exige seu distrito e não admite duplicação. Construção instantânea, sem fila. MILITARY/BARRACKS não criam unidades, ataque ou dano.

## 10. Pipeline econômico

População → terreno → features → melhoria → distrito → edifício → especialização → governo → estabilidade. Depois crédito, consumo, falta/crescimento, administração após crescimento, ajuste econômico administrativo, estabilidade e administração final. Percentuais v0.3 mantêm divisões inteiras separadas; intermediários BigInt evitam overflow silencioso. Falha cancela a transição inteira.

## 11. Breakdown

CityProductionBreakdown separa nove fontes. EconomyBreakdown registra bruto, ajuste administrativo, crédito, consumo, abertura, fechamento e variação líquida. Soma das fontes é exatamente produção; bruto + ajuste é crédito; abertura + crédito − consumo é fechamento. O evento RESOURCES_PRODUCED registra esse resultado. Projeção distingue histórico de prévia; frontend só renderiza.

## 12. Administração

Um ponto de carga a cada cinco hexes próprios, incluindo centros. Custos anteriores de cidades/desenvolvimento/população permanecem. ADMINISTRATIVE e ARCHIVE acrescentam capacidade. Fundação e construções refletem valores derivados no mesmo snapshot. Excesso administrativo mantém penalidade somente na produção nova não alimentar.

## 13. Snapshot e migração

Schema v3 estrito. `migrateSnapshotV2ToV3` valida schema histórico v2 congelado, copia sem mutar, acrescenta defaults seguros e recalcula administração. UNKNOWN não vira PLAINS. Somente centros recebem propriedade inferida; demais hexes ficam livres. Eventos históricos são preservados sem breakdown fabricado. V1 permanece rejeitado com orientação explícita; versões desconhecidas também são rejeitadas. JSONB e Prisma permanecem sem migração SQL nova.

## 14. Privacidade

Comandos mantêm identidade autenticada separada do JSON, ownership, PLANNING, expectedVersion e Zod. PlayerView filtra território próprio ou explicitamente visível e não publica GameState bruto, seed, RNG, ordens adversárias ou eventLog. Breakdown é somente próprio. Testes verificam allowlist e isolamento de referências. Motor não importa Prisma; UI não calcula regras.

## 15. Testes

**158 antigos + 119 novos = 277 testes passando, em 11 arquivos.** Nenhum teste foi eliminado. Duas fixtures no teste de governos foram adaptadas ao formato HexTile v3 com controle dos novos centros; as mesmas verificações de governo e estabilidade permanecem.

Cobertura nova: sete terrenos, seis features, configurações inválidas, determinismo, conexão/alcance, custos e ownership, concorrência de claim com débito único, trabalho/subsistência, cinco melhorias, fundação e administração, sete distritos, cinco limites de slots, sete edifícios e seus efeitos, autorização/fase/versão dos seis comandos, reconciliação e produção pequena, overflow, projeções, v3 round-trip, v2 explícito, rejeição v1/desconhecido e demo determinística.

## 16. Validação obrigatória

Executada em 17/09/2026, com prefixo RTK conforme instruções locais:

| Comando | Resultado |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 277/277 |
| `npm run build` | PASS — Next.js e pacotes compilados, página de inspeção pré-renderizada |
| `npm run db:validate` | PASS |
| `npm run demo` | PASS — duas cidades, administração, produção, v3 idêntico e v2 migrado |
| `git diff --check` | PASS |

As primeiras tentativas no sandbox falharam por rede bloqueada do Prisma e criação de subprocessos do Vite (`spawn EPERM`). Com execução externa autorizada, os gates passaram. Não foram erros de regra nem resultados de teste ignorados.

Demo final: rodada 3, versão 23, capital Aurora população 3/desenvolvimento 3, Fronteira população 1, capacidade/carga 3/3. Última produção bruta: 9 food e 2 materials; consumo 3 food; estoque final food 36, materials 31, wealth 18, knowledge 0, influence 7. Snapshot restaurado é idêntico.

## 17. Suposições

- Território de cidades aliadas da mesma civilização pode conectar claims; não há transferência manual de controlador.
- UNKNOWN não pode ser reclamado/trabalhado; centros legados usam subsistência.
- SEA fica totalmente sem economia; FISHERY somente em COAST com FISH.
- MOUNTAINS pode ser reclamado e trabalhado, mas não fundado na configuração padrão.
- Hex trabalhado deve ser desatribuído antes de fundar; nenhuma reassociação implícita de produtores.
- Construção instantânea, um distrito/edifício de cada tipo, valores provisórios.

## 18. TODOs

Resolver de claims simultâneos; navegação; geração procedural independente; transporte autenticado; fog of war; validação PostgreSQL real entre conexões; medição de mapas/logs grandes; balanceamento e eventual fila de construção. Esses sistemas não foram acrescentados nesta rodada.

## 19. Riscos e limites da prova

Arredondamento ainda pesa em produção pequena, embora ordem e reconciliação estejam testadas. Validação integral e conectividade podem custar caro em mapas grandes. Breakdown aumenta tamanho do log. Testes Prisma usam doubles: schema validado não equivale a integração com banco real. UI foi compilada e pré-renderizada; não houve sessão manual em navegador. Schemas não provam autenticidade histórica. Não há garantia estratégica de iniciativa via CAS.

## 20. Estado Git

Entrega em um commit atômico na branch indicada. A condição de encerramento é `git status --porcelain` vazio após commit e `git diff --check` aprovado. O resultado observado e o hash final são registrados na mensagem de entrega. Nenhum merge, push ou deploy foi executado.

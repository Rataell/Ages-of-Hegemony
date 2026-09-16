# Relatório — Rodada 2 / v0.3

## 1. Resumo

Implementada a camada civilizacional: cidades, alocação populacional, produção, consumo, crescimento, estabilidade, desenvolvimento, especializações, governos e administração. Motor independente, resultados determinísticos, inputs preservados, validação Zod, privacidade e compare-and-swap permanecem.

Branch: `feature/aoh-cities-governments`, criada diretamente do commit `9d63e69`. Nenhum merge ou deploy. Workspaces identificados como versão 0.3.0.

## 2. Arquivos alterados

```text
packages/game-domain/src/
  core.ts                    IDs/enums, recursos e alocação
  rules.ts                   GameRulesConfig e defaults provisórios
  model.ts                   cidades, civilizações, comandos, eventos, invariantes
  serialization.ts           snapshots v2 e erros de compatibilidade
  index.ts                   exports
packages/game-engine/src/
  civilization.ts            produção, governo, estabilidade, administração
  maintenance.ts             pipeline puro por jogador
  management.ts              quatro comandos de gestão
  engine.ts                  criação, dispatch, manutenção atômica e validação final
  index.ts                   exports
apps/server/src/
  game-service.ts            autorização e projeção pública/privada
  prisma-repository.ts       leitura de snapshot versionada
  debug-scenario.ts          cenário determinístico compartilhado por demo/UI
  demo.ts                    demonstração executável
apps/web/app/{page.tsx,style.css}
tests/{cities,maintenance,governments,civilization-integration}.test.ts
tests/civilization-helpers.ts
tests/engine.test.ts          caso de versão desconhecida atualizado para 999
docs/{architecture,game-domain,game-loop,roadmap}.md
docs/{cities-and-population,governments,round-2-report}.md
docs/decisions/0003-civilization-maintenance-and-snapshots.md
README.md, manifests dos workspaces e package-lock.json
```

## 3. Modelo de população

Seis campos explícitos: producers, artisans, merchants, scholars, soldiers, unassigned. Inteiros não negativos e soma exatamente igual à população. Reatribuição exige dono correto, fase PLANNING e expectedVersion. Crescimento gera habitantes não alocados. População nunca excede o cap de desenvolvimento.

## 4. Modelo de estabilidade

Inteiro 0–100, com cinco faixas: CRITICAL 0–19, UNSTABLE 20–39, TENSE 40–59, STABLE 60–79, PROSPEROUS 80–100. Produção padrão em 75/90/100/100/110%. CRITICAL bloqueia desenvolvimento por padrão. Valores gerados são limitados por clamp; snapshots inválidos são rejeitados. Faixas, percentuais e deltas são configuráveis.

## 5. Modelo administrativo

Carga por cidade: `1 + floor((development - 1)/2) + floor(population/5)`. Capacidade base 3, acrescida de modificadores de governo/especialização e reduzida pela condição de instabilidade aplicável. Capacidade tem piso zero. OVEREXTENDED exige carga maior que capacidade e causa, por manutenção, −3 estabilidade e retenção de 90% da produção nova não alimentar. Não consome estoque antigo nem destrói cidades.

## 6. Governos implementados

- PROTO_GOVERNANCE inicial explícito, sem modificadores.
- MONARCHY: capacidade e capital; crise da capital penaliza o Estado.
- REPUBLIC: estabilidade em cidades desenvolvidas e capacidade reduzida por cidades instáveis.
- OLIGARCHY: eficiência de riqueza e sinergia comercial.
- THEOCRACY: estabilidade geral.
- CONFEDERATION: capacidade por cidade, estabilidade distribuída e redução configurável de pontos de comando.

Readoção/troca é bloqueada. Hooks de conhecimento/influência, desigualdade, reformas e preparação militar estão configurados e documentados como **inativos**. Não há eleições, sucessão, religião ou classes sociais.

## 7. Produção e manutenção

Saída de MAINTENANCE executa uma única transação: produção → especialização → governo → estabilidade inicial → estoque → consumo → falta → excedente/crescimento → administração → consequências → estabilidade final → eventos/fase.

Padrões: produtor 2 food; artesão/mercador/estudioso 1 do recurso correspondente; consumo 1 food por habitante; crescimento a cada 10, máximo 1 por ciclo. Somente o excedente da produção nova gera progresso. Distribuição igual entre cidades elegíveis, com restos por ID lexical. Progressos ficam limitados a um threshold. Shortage preserva população/progresso e bloqueia crescimento de todas as cidades do jogador nesse ciclo.

O demo terminou na rodada 6, PLANNING, versão 30, com Monarquia, população 3, estabilidade 75, desenvolvimento 2, AGRARIAN, dois produtores e um não alocado, capacidade 5/carga 1, 18 food e 15 materials. O snapshot restaurado é idêntico.

## 8. Eventos adicionados

CITY_DEVELOPED, CITY_SPECIALIZED, POPULATION_ASSIGNED, POPULATION_GROWN, GROWTH_PROGRESS_CHANGED, FOOD_SHORTAGE, FOOD_CONSUMED, RESOURCES_PRODUCED, STABILITY_CHANGED, GOVERNMENT_ADOPTED, ADMINISTRATIVE_OVEREXTENSION. Uma revisão pode conter vários eventos em ordem estável. O log permanece privado.

## 9. Migrações

Schema de snapshot 2. V1 retorna SNAPSHOT_MIGRATION_REQUIRED com referência ao commit original e orientação para conversão explícita. Não há defaults destrutivos, clamp silencioso ou sobrescrita de v1. Versões desconhecidas retornam UNSUPPORTED_SCHEMA. O adaptador Prisma usa esse decodificador na leitura.

Não houve alteração de schema SQL: JSONB continua adequado. Não há migração SQL nova. Nenhum PostgreSQL/Docker está disponível neste ambiente; integração real com banco continua pendente.

## 10. Testes

**158 testes passaram em 8 arquivos: 63 de regressão + 95 novos.** Cobertura nova inclui somas de população menores/maiores, negativos/frações/não finitos, propriedade, custos atômicos, desenvolvimento máximo, especialização única, bônus, adoção única, todos os governos e trade-offs ativos, faixas/clamp, falta de alimento, crescimento e caps, excesso por crescimento, atualização administrativa após mudança de estabilidade, imutabilidade, overflow, determinismo, snapshots, visibilidade e concorrência de novos comandos.

O teste de demo verifica o estado restaurado e a projeção privada usados pela UI. O HTML de produção foi inspecionado para confirmar presença de governo, capacidade administrativa, cidade, especialização, desenvolvimento e alocação. Não se afirma cobertura E2E interativa: a interface é somente inspeção.

## 11. Verificações

| Verificação | Resultado |
| --- | --- |
| `npm run check` | PASS (lint + typecheck + testes + build) |
| `npm run lint` | PASS, zero warnings |
| `npm run typecheck` | PASS, incluindo testes e Next.js |
| `npm test` | PASS, 158/158 |
| `npm run build` | PASS, pacotes/servidor e Next.js |
| `npm run db:validate` | PASS |
| `npm run demo` | PASS |
| `git diff --check` | PASS |

Vitest e build executados com a permissão necessária para subprocessos Windows, sem desativar verificações. Lockfile atualizado; instalação reportou zero vulnerabilidades.

## 12. Compatibilidade com Rodada 1

RNG, hexágonos, recursos, fases, ordens genéricas, proteção de privacidade, versionamento otimista e contratos de repository continuam cobertos pelos 63 testes originais. O teste de schema desconhecido troca apenas o literal 2 por 999, porque 2 agora é o schema válido. Criação sem cidades e config legada com baseCommandPoints continuam aceitas. Snapshots salvos v1 requerem conversão explícita, conforme seção 9.

## 13. Decisões arquiteturais

Regras permanecem no motor. Comandos de gestão são imediatos em PLANNING; não se confundem com resolvedores de ordens genéricas. Manutenção e fase são atômicas. A configuração completa está no snapshot. Vários eventos compartilham uma revisão. O Server Component de debug recebe projeção de um cenário isolado do pacote servidor; não há lógica de governo/custos/crescimento no navegador. Veja ADR 0003.

## 14. Suposições explícitas

Capital é a primeira cidade fornecida pelo cenário; cidades iniciais têm desenvolvimento 1, estabilidade 60 e população padrão 2. Setup não define uma regra de fundação jogável. Alimento é compartilhado pela civilização; falta afeta suas cidades. Crescimento não gasta alimento adicional, não reaproveita estoque como novo excedente e cobra o recém-nascido só no ciclo seguinte. Especialização inicial e adoção são gratuitas, sem requisito de era adicional; custos de comando não foram inventados. Todas essas decisões e os números provisórios estão nos documentos de cidades e governos.

## 15. TODOs deliberados

Economia territorial, distritos, edifícios e fundação jogável aguardam v0.4. Também pendentes: reforma/respecialização, efeitos dos hooks futuros, custos de pontos de comando, fog of war real, autenticação, HTTP/WS de gameplay, scheduler e arbitragem simultânea, migração explícita de cenários antigos, integração PostgreSQL e E2E jogável.

## 16. Riscos

Arredondamento inteiro torna bônus/penalidades perceptíveis em produção pequena; exige balanceamento. Snapshot e log completos crescem e são copiados/validados a cada comando. CAS não define justiça de iniciativa. Estado autoritativo não deve ser publicado. Consumidores de eventos precisam suportar vários eventos por revisão. Não existe migração automática v1 nem validação de banco real. Modificadores de governo que cruzam limiares na estabilidade final afetam as consequências da manutenção seguinte, sem loops recursivos.

## 17. Commit

Commit atômico de entrega: `feat: add cities population governments and deterministic maintenance` na branch `feature/aoh-cities-governments`, com pai `9d63e69`. O hash é apresentado na resposta final e pode ser obtido por `git log -1 --format=%h` após a entrega. A árvore é verificada limpa após o commit; nenhum merge/deploy é realizado.

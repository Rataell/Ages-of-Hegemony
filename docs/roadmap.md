# Próximas rodadas e riscos

## First Playable Product Slice

Interface cartográfica SVG, comandos de gestão reais, previews no servidor, hotseat de desenvolvimento e relatório privado. Fixtures manuais Duel/Standard/Epic (84/126/168 hexes), sem geração procedural. Veja [relatório](round-product-slice-report.md).

Gate obrigatório antes de multiplayer persistente: comprovar PostgreSQL real, JSONB, CAS entre conexões independentes, backup/restauração e isolamento de sessões. Local Play usa somente memória e não cumpre esse gate. Ordens genéricas continuam infraestrutura futura; nenhuma resolução estratégica foi adicionada.

## v0.4 — Implementado

Terrenos/features, ownership/controlador, claims conectados, trabalho por produtor, cinco melhorias, fundação abstrata, sete distritos e sete edifícios mínimos. Produção determinística com breakdown reconciliado, carga territorial, snapshot v3 e migração explícita v2. Inspeção e demo usam projeções do servidor. Custos e efeitos permanecem provisórios.

## Próximas decisões de produto

- Resolver futuro para disputas simultâneas de claims, independente de CAS e chegada da rede.
- Regras de navegação e exploração de SEA; atualmente só COAST com FISH aceita FISHERY.
- Transferência administrativa entre cidades, substituição de melhorias e demolição, se necessárias.
- Revisão de balanceamento territorial, especialização, crescimento, slots e carga administrativa.
- Filas e tempo de construção apenas após especificação; v0.4 é instantânea.
- Custos de pontos de comando e hooks ainda inativos de governos/especializações.
- Gerador procedural como sistema próprio, sem embuti-lo em cenários ou migrações.

## Engenharia antes de multiplayer

- Autenticação real e autorização de lobby/scheduler; identidade fora do JSON.
- HTTP/WebSocket autenticado sobre GameService, limites, reconexão e idempotência.
- Fog of war e conhecimento diplomático; listas de visibilidade vêm somente do servidor.
- Fechamento do planejamento, prazos e ordenação autoritativa de resolução.
- PostgreSQL real: JSONB e CAS entre conexões independentes; doubles não substituem essa integração.
- Processo operacional de backup e gravação deliberada de snapshots migrados v2; conversão v1 continua manual.
- Entrega confiável pós-commit e identidade de eventos que compartilham uma revisão.
- Medir validação/cópia integral, conectividade e crescimento do log com breakdowns; depois introduzir checkpoints se necessário.
- Manter E2E Playwright da gestão jogável e ampliar cobertura conforme surgirem sistemas reais.

## Fora do escopo atual

Combate, unidades móveis, guerras, diplomacia, rotas internacionais, Teia Civilizacional completa, fog of war completo, geração procedural, IA e hegemonia. MILITARY/BARRACKS apenas expõem capacidade de guarnição. Religião, eleições, sucessão, classes sociais, corrupção avançada, revoltas, espionagem e matchmaking também aguardam sistemas próprios.

## Riscos conhecidos

1. Arredondamento para baixo pesa em produções pequenas; testes fixam a ordem, mas balanceamento precisa de jogo real.
2. Validação/cópia integral e busca de conexão aumentam de custo com mapa e histórico.
3. Controle de versão não define justiça de iniciativa.
4. Estado autoritativo nunca deve ser publicado por broadcast; usar projeções autorizadas.
5. UNKNOWN preserva legado sem inventar geografia, mas exige cenário explícito para ativar trabalho territorial nesses hexes.
6. Excesso administrativo é avaliado após crescimento; estabilidade final pode mudar status sem reaplicar penalidades no ciclo.
7. Schemas garantem integridade estrutural/relacional, não autenticidade nem toda causalidade histórica.
8. Overrides transitivos do CLI Prisma precisam de revisão em upgrades; ver ADR 0002.

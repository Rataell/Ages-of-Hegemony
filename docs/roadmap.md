# Próximas rodadas e riscos

## v0.4 — Economia, distritos, construções e recursos territoriais

- Especificar produção territorial, distritos e edifícios antes de implementar comandos.
- Definir custo/requisitos de fundação; initialCities é somente setup confiável.
- Revisar valores provisórios de população, especializações, desenvolvimento, governos e administração.
- Confirmar política de excedente compartilhado, arredondamento e estoque de progresso.
- Definir custos de pontos de comando; hoje só se calcula a capacidade.
- Especificar hooks futuros de influência, conhecimento, preparação militar, desigualdade e reformas antes de ativá-los.

## Engenharia antes de multiplayer

- Autenticação real e autorização de lobby/scheduler; identidade fora do JSON.
- HTTP/WebSocket autenticado sobre GameService, limites de entrada/frequência, reconexão e idempotência.
- Fog of war e conhecimento diplomático. As listas de visibilidade da projeção devem vir do servidor, nunca diretamente do cliente.
- Fechamento do planejamento, prazos e ordenação da resolução simultânea. Gestão imediata não resolve conflitos entre jogadores.
- Integração PostgreSQL real: migração inicial, JSONB e CAS entre conexões independentes.
- Conversão explícita de snapshots v1 quando houver cenários reais; não adivinhar estabilidade, desenvolvimento ou trabalhadores antigos.
- Entrega confiável pós-commit e identidade de eventos: múltiplos eventos agora compartilham uma revisão.
- Medir cópia/validação integral e segmentar logs/checkpoints para partidas longas.
- E2E Playwright quando a UI tiver comandos jogáveis.

## Fora do escopo

Combate, unidades detalhadas, battle resolver, mapa procedural, Teia completa, religião, eleições, sucessão, classes sociais, corrupção avançada, revoltas, felicidade individual, distritos completos, edifícios, trade routes, tratados, espionagem, hegemonia, IA e matchmaking.

## Riscos conhecidos

1. Arredondamento para baixo tem efeitos fortes em produções pequenas; números são provisórios.
2. Cópia e validação integral ficam mais caras conforme o log cresce.
3. Controle de versão não define justiça de iniciativa/ordenação.
4. Estado autoritativo não deve ser publicado por broadcast; usar projeções autorizadas.
5. Snapshot v1 requer conversão deliberada; rejeição orientada preserva o original.
6. Eventos de excesso registram a avaliação após crescimento. A estabilidade final pode mudar o status, sem reaplicar consequências no mesmo ciclo.
7. Schemas verificam integridade estrutural, não autenticidade nem toda a causalidade histórica. Persistência é fronteira confiável.
8. Overrides transitivos do CLI Prisma precisam de revisão em upgrades; ver ADR 0002.

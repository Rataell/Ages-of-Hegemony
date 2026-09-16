# Pendências deliberadas e riscos

## Próximas especificações de design

- Definir payload e validação de cada ação antes de adicionar seu executor.
- Definir custos e modificadores de pontos de comando antes de limitar ou consumir ordens.
- Definir o encerramento do planejamento: confirmações, prazos, desistência e jogadores desconectados.
- Definir ordenação e conflitos da resolução simultânea antes de adicionar subfases.
- Definir mapa inicial, terrenos, visibilidade e exploração antes de publicar tiles aos jogadores.
- Definir escala de estabilidade, desenvolvimento e recursos antes de criar cidades/economia.
- Definir avanço de era e hegemonia antes de adicionar transições ou condições de vitória.

Governos, formas de Estado, civilizações jogáveis, teias tecnológicas completas, custos de tecnologia, combate, dano, moral, unidades, naval, espionagem, revoltas, maravilhas e balanceamento econômico ficam fora desta rodada.

## Engenharia antes de multiplayer

- Adicionar autenticação real e autorização de lobby/scheduler; manter a identidade fora do corpo do comando.
- Implementar HTTP/WS autenticado sobre `GameService`, com projeções por destinatário, limites de tamanho/frequência e política de reconexão.
- Definir idempotência e ordenação de comandos aceitos; reenvio após conflito não pode ocorrer silenciosamente.
- Adicionar teste de integração PostgreSQL real para migração, round-trip JSONB e CAS entre conexões independentes.
- Adicionar migrações de snapshots e política de compatibilidade de replays ao mudar regras/RNG.
- Medir custo de cópia, validação e log; criar checkpoints e histórico segmentado quando necessário.
- Definir entrega de eventos pós-commit (por exemplo, outbox) antes de broadcast confiável.
- Implementar testes E2E Playwright quando houver fluxo jogável na UI.

## Riscos conhecidos

1. Snapshot/log completos têm crescimento linear por comando; não adequados sem medição a partidas longas.
2. Revisionamento detecta disputa, mas não estabelece justiça de resolução entre jogadores.
3. O estado autoritativo e eventos contêm ordens privadas; publicar esses objetos seria vazamento.
4. Replay de comandos é determinístico para a mesma sequência; o log atual sozinho não reconstitui uma partida do zero.
5. O adaptador Prisma pode compilar e passar testes com doubles sem provar configuração, permissões ou concorrência de um banco real.
6. Overrides transitivos devem ser revisitados em upgrades; ver ADR 0002.

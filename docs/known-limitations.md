# Limitações conhecidas da alpha em desenvolvimento

Esta branch ainda não é uma versão pública liberada. A interface usa `TEST BUILD`. O cenário automatizado consegue terminar uma partida; isso não comprova que uma partida normal esteja equilibrada ou que o deploy esteja disponível.

## Bloqueadores de liberação

- Closed Alpha: deploy preparado em [deploy-railway.md](deploy-railway.md), não executado. Falta remote Git, projeto Railway/Supabase e os segredos do dono. Smoke (`scripts/alpha-smoke.mjs`: lobby, 2 pessoas, rodada, recarga, reinício, continuação) passou em build de produção contra PostgreSQL 18 real e embarcado, não no Docker `db-test`, no Supabase nem no domínio público.
- As migrations foram aplicadas e testadas em PostgreSQL local real, mas ainda não no banco Supabase da alpha.
- Não há URL pública, destino Railway confirmado nem remote Git configurado.
- O E2E alpha intercepta HTTP no navegador e executa o boundary real com um repository de teste em memória. Não comprova transporte implantado ou durabilidade PostgreSQL.
- Assentamentos neutros, manual alpha completo, compêndio alpha e apresentação de componentes ainda precisam ser concluídos.
- Validação manual de todas as ações, E2E de combate, evidências de término no navegador e auditoria de privacidade completa permanecem pendentes.

## Simplificações implementadas

- Sem IA, espectadores, matchmaking, ranking ou áudio.
- Polling HTTP, sem WebSocket. A identidade usa cookie assinado pelo servidor; não há contas de usuário.
- Temporizadores são processados na próxima leitura ou comando. Não há scheduler que avance uma mesa sem acessos.
- Esquadras operam em costa/mar; não transportam exércitos. Recrutamento exige cidade costeira, sem distrito Marítimo.
- Reação ocorre antes de resolver conflitos e oferece cartas elegíveis. Não há escolha de reação depois dos dados.
- Eventos mundiais oferecem recurso ou Prestígio. As 24 cartas usam esse modelo simples de decisão.
- Conselheiros fornecem modificadores persistentes. Não há substituição ou demissão pela interface.
- Baralhos são finitos, sem reciclagem automática. Ao esgotar um baralho, novas compras cessam.
- Embargo é acordo bilateral. Não há contraproposta estruturada; os jogadores podem recusar e enviar outra proposta.
- Pactos defensivos convocam parceiros diretos do defensor; não disparam cadeias recursivas de alianças.
- Captura preserva o jogador, transfere a cidade, aplica ocupação e permite integração posterior. Recuperação depende de recursos e peças sobreviventes.
- Os 50 avanços, 108 cartas e 12 civilizações têm conteúdo declarativo inicial. Contagem não implica diversidade ou balanceamento final.

## Produto e equilíbrio

Playtest de 2026-10-03 e lacunas restantes: [alpha-playtest-2026-10-03.md](alpha-playtest-2026-10-03.md). Em resumo: uma cidade nova produz exatamente o Alimento que consome e só cresce com Produtores em hexes de Alimento; em QUICK (9 rodadas) a Era da Hegemonia não é alcançada e a partida termina por Prestígio; em 6 lugares parte das civilizações ainda não faz contato.

O mapa usa SVG e 210 hexes nos cenários alpha atuais. Ainda faltam medições representativas em 2, 4 e 6 clientes. Símbolos de unidades e Grandes Projetos precisam de maior distinção visual; a bandeja de cartas ainda fica na sua aba. Ações urbanas, movimento, exploração, fundação e reivindicação mostram antes da tentativa o que o servidor aceita; tratados e cartas ainda mostram só o custo.

O teste de partida completa começa com cinco cidades e reservas ampliadas para compor sistemas em poucas rodadas. Ele não é IA, não mede duração real e não substitui playtests a partir do lobby padrão. As durações QUICK/STANDARD/EPIC são hipóteses; os limites efetivos são 9/15/20 rodadas.

Verificação pública de colisão do nome ainda pendente. Formal trademark clearance remains a pre-commercial-release task.

> Métricas de contato/PvP/capturas dos relatórios de bots anteriores são **PRE-HOME-MAXIMIN** (capitais a ~5 hexes); não valem para o mapa atual. O dado válido virá do playtest humano real.

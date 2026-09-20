# Public Alpha v0.1 — plano executável

## Base auditada

Branch de origem: `feature/aoh-player-guide-compendium`, HEAD `193bf87`.
Ancestry confirmada: `3b8f8d3` (slice) → `f58bb57` (Visual Interaction Closure) → `193bf87` (guia, onboarding, compêndio).
Nova branch: `feature/aoh-playable-alpha-v1`. Baseline executado: 297 testes aprovados em 14 arquivos.
Arquivos locais preexistentes preservados: `.agents/` e `docs/auditoria-2026-09-18.md`.

## Fronteiras preservadas

O navegador envia intenções. Servidor identifica o jogador, carrega o agregado, executa a engine, valida e salva por compare-and-swap. Projeções excluem planos, mãos, objetivos, RNG, decks e tokens adversários. CAS protege concorrência, nunca define iniciativa.

A slice e seus snapshots v3 continuam legíveis e testáveis. A alpha adiciona um envelope v4 explícito para estado estratégico, contendo o estado econômico v3 existente, sem conversão silenciosa. A migração mantém uma cópia original imutável; rollback restaura essa cópia, sem tentar reduzir uma partida alpha já jogada a v3. A nova persistência deve aceitar somente seu schema declarado.

## Marcos e condições de passagem

1. Auditoria e contrato: ancestry, regressão, plano, inventário de acesso. Nenhuma alegação de deploy sem evidência.
2. Núcleo estratégico: schema/invariantes v4, migração explícita, presets, pontos de comando, iniciativa, ordens editáveis, prontidão, fases e vitória. Prova determinística antes da UI.
3. Mundo e peças: regiões, exploração/projeção, unidades, caminhos, logística, combate e ocupação. Testes de privacidade e invariantes.
4. Instituições e conteúdo: pesquisa/eras, civilizações, tratados/comércio, cartas, projetos, prestígio/hegemonia. Catálogos declarativos com integridade referencial e cenário completo.
5. Multiplayer persistente: identidade de convidado, lobby, PostgreSQL/Prisma, autorização, CAS, limites, reconexão, polling explícito. Prova real de banco e dois clientes.
6. Produto: reutilizar mapa, cidade, compêndio e onboarding; adicionar tabuleiros, peças, cartas, batalhas, temas e ajuda PT-BR. E2E e inspeção visual.
7. Manual e distribuição: documentação coerente, auxílio imprimível, diagnóstico seguro, configuração Railway/Supabase, verificação pública de nome.
8. Release: gates completos, commit, tag somente com todos os gates aprovados; push/deploy somente com destino e credenciais disponíveis.

## Acesso encontrado

Não há remote Git configurado. DATABASE_URL, DIRECT_URL, RAILWAY_TOKEN e SUPABASE_ACCESS_TOKEN não estavam configurados no processo. Railway CLI, psql e Docker não foram encontrados no PATH. Os projetos Railway/Supabase foram solicitados ao usuário; o trabalho local independente continua.

## Correções documentais necessárias

O relatório anterior cita um caminho de regras inexistente e o manual descreve quatro fases. A engine atual possui cinco. O novo manual será derivado dos sistemas implementados, sem usar esses trechos como especificação autoritativa.

## Simplificações permitidas

Sem IA completa, ranking, espectadores ou áudio obrigatório. Polling autenticado é suficiente para a alpha. FLEET pode operar sem transporte de exércitos; não adicionar MARITIME se costa bastar para recrutamento. Tempo-alvo dos presets permanece hipótese de balanceamento. Números de conteúdo são requisitos, não evidência de qualidade por si só.

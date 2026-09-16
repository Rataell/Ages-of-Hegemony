# ADR 0003 — Gestão civilizacional, manutenção atômica e snapshots v2

Status: aceito na Rodada 2.

## Contexto

Uma manutenção agora pode produzir recursos, consumir alimento, fazer crescer várias cidades e alterar estabilidade. O contrato anterior pressupunha um evento por comando. Novos campos de cidades também tornam inseguros defaults silenciosos para snapshots antigos (por exemplo, desenvolvimento 0 e estabilidade sem escala na Rodada 1).

## Decisões

1. **Gestão em PLANNING.** ASSIGN_POPULATION, DEVELOP_CITY, SPECIALIZE_CITY e ADOPT_GOVERNMENT são comandos imediatos de gestão da própria civilização. Não são efeitos das antigas ordens genéricas DEVELOP/BUILD etc. Essas continuam como intenções pendentes sem resolução. A gestão imediata não executa conflitos entre jogadores e fica explicitamente separada de uma futura resolução simultânea.
2. **Manutenção ao sair da fase.** MAINTENANCE → PLANNING executa o pipeline e a transição no mesmo novo snapshot, incluindo a primeira rodada. Não existe endpoint nem comando de jogador para repetir manutenção. Versão e fase protegem contra repetição; a gravação usa o mesmo CAS do repository.
3. **Uma revisão, vários eventos.** A revisão incrementa uma única vez por comando. Todos os eventos da transação carregam essa revisão e a ordem no array é determinística. A sequência de revisões deve ser contígua; eventos podem compartilhar a revisão. O evento de fase encerra a transação de manutenção. A identidade de evento para um futuro consumidor pode ser `(gameId, version, ordinalNaRevisão)`.
4. **Schema 2.** Snapshots atuais usam `schemaVersion = 2`. Leitura de v1 retorna `SNAPSHOT_MIGRATION_REQUIRED`, com orientação para manter o original e usar o commit 9d63e69. Não há conversão destrutiva/automática. Versões desconhecidas retornam `UNSUPPORTED_SCHEMA`. A compatibilidade legada precisa de uma conversão de cenário explícita quando houver partidas reais a migrar.
5. **Prisma permanece JSONB.** Não há necessidade de alterar colunas ou criar tabelas novas. O adaptador usa o decodificador versionado ao carregar snapshots e preserva o compare-and-swap por revisão. Nenhuma migração SQL nova é necessária.
6. **UI de inspeção no servidor.** O Server Component Next.js chama um cenário de demonstração isolado no pacote servidor. Só recebe `PlayerView` e uma descrição fixa dos passos. Não há engine em Client Components, regras calculadas no navegador ou acesso a partidas reais.

## Consequências

Os 63 testes da fundação permanecem ativos; apenas o exemplo de versão desconhecida passou de 2 para 999, pois 2 agora é a versão válida. Jogos sem cidades mantêm a contagem antiga de um evento por comando. O histórico continua sendo trilha de eventos, não event sourcing completo.

A nova configuração está persistida por partida. Antes de introduzir novos modificadores, será preciso versionar novamente o schema ou fornecer migração explícita. O snapshot completo continua sendo copiado/validado por comando; desempenho e segmentação do log seguem no roadmap.

Escolhas provisórias como distribuição do excedente, estoque, arredondamento e penalidades estão documentadas em `cities-and-population.md` e `governments.md`; não foram tratadas como regras definitivas de design.

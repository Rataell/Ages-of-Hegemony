# ADR 0004 — Economia territorial e snapshots v3

Status: aceita na Rodada 3.

## Contexto

A v0.3 não registra terrenos nem infraestrutura. É necessário preservar partidas existentes sem inventar geografia e explicar produção inteira, mantendo o motor independente de persistência e apresentação.

## Decisão

O snapshot v3 armazena terreno, features, proprietário, controlador e melhoria no hex; trabalho, distritos e edifícios na cidade. Configuração contém catálogos completos da partida. Invariantes relacionais ficam no domínio para validação de snapshots; transições e derivação econômica ficam no motor. A distância axial é compartilhada pelo validador e pela API hexagonal existente, evitando duas fórmulas.

`migrateSnapshotV2ToV3` é uma transformação explícita e pura no motor, pois precisa recalcular administração. O domínio conserva schemas v2 congelados em `snapshots/v2`, sem depender dos schemas v3 mutáveis. Isso duplica contratos históricos deliberadamente para evitar que futuras mudanças de regras alterem a leitura do legado. Não existe migração automática na leitura nem gravação do original.

Migração valida v2, acrescenta catálogo territorial padrão, usa UNKNOWN e listas vazias, infere propriedade apenas dos centros existentes e recalcula administração com o mapa. Recursos, RNG, comandos pendentes e eventos históricos permanecem. Eventos antigos de produção não recebem um breakdown fabricado. V1 continua requerendo conversão explícita conforme ADR 0003. Versões desconhecidas são rejeitadas.

O breakdown é calculado no motor e anexado ao evento econômico; projeção do servidor entrega somente o resultado próprio e território autorizado. A prévia econômica é separada do resultado histórico. JSONB comporta v3 sem alteração Prisma ou migração SQL vazia.

## Limitações deliberadas

Claims são gestão imediata de território livre. Compare-and-swap evita gravações perdidas, mas não resolve disputas simultâneas como regra estratégica. Não se inferiu iniciativa a partir da ordem da rede. SEA permanece sem economia; FISHERY opera somente em COAST com FISH. Construção é instantânea e há um distrito de cada tipo por cidade.

## Consequências

Custos e produção são auditáveis por fonte. Aritmética usa inteiros seguros e intermediários BigInt. Snapshots ficam maiores pelo catálogo e breakdowns; validação integral e busca de conectividade precisam de medição antes de mapas grandes. Não se introduzem banco no motor, cálculo na UI, geração procedural ou sistemas militares.

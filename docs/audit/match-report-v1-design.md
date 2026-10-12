# MatchReportV1 — auditoria das fontes, desenho e plano da interface

Escopo: gerar, guardar e ler um relatório de partida **sem alterar regras, economia, combate nem RNG**, reaproveitando o estado final autoritativo. Nada foi publicado.

## 1. Auditoria das fontes de dados

Fontes lidas (código, não suposição). Tudo vem de `AlphaState` (pacote de domínio/motor) e dos metadados da sala (servidor).

| Fonte | O que tem | Confiável? | Limite conhecido |
|---|---|---|---|
| `telemetry.roundLog` (1 linha por civilização por rodada fechada) | Ordens comprometidas por categoria, fluxos nos 5 pools do ledger, **estoque de fechamento dos 8 recursos**, quais estão no limite, população, cidades, níveis, Ânimos, pesquisas, Herança, ciclos de Ressonância, Prestígio, Hegemonia por caminho | Sim | Guarda só as **últimas 260 linhas**: 6 jogadores × 49 rodadas = 294 perde as ~6 primeiras rodadas (o relatório marca `truncated`). A linha da última rodada tem o Prestígio **antes** do `scoreAmbitions` final |
| `telemetry` (contadores globais) | Fundações/capturas, batalhas, Ameaças (geradas, ataques, mortes), ofertas de comércio, produção por recurso | Parcial | Contadores **globais** (todas as civilizações); `productionByResource` só conta a ação Produzir, soma todos os jogadores. **Campos mortos** (declarados, nunca escritos): `prestigeBySource`, `hegemonyDeclarations`, `hegemonyInterruptions`, `durationMs` — não usados |
| `roundReports` (ledger legado, 5 pools) | Abertura, produção/minas/comércio/instituições/outros, perdas, gastos, manutenção devida e paga, descarte, fechamento, por civilização e rodada, **nunca apagado** | Só para os 5 pools | Madeira, Pedra e Metal fundidos em `materials`; **Cultura fora do ledger**; efeitos do turno de Era ficam fora; `roundLedgers` só guarda a rodada corrente |
| `events` | Texto em português, ~55 tipos, público ou por assento (`audience`) | Para **contagem por tipo/assento** | Texto livre, sem teto; pode ter nomes de exibição → o relatório **nunca copia texto de evento** |
| `resolutionEvents` | Tipo estruturado (PRODUCTION, CONSTRUCTION, RECRUITMENT, RESEARCH, FOUNDATION…) com `actorId` | Sim | O texto da pesquisa traz o nome, não o id |
| `battles` | Atacante, defensor (`world` para Ameaças), unidades dos dois lados, vencedor, resultado, perdas | Sim | `losses` é uma lista única: o lado se obtém pela pertença às unidades do ataque/defesa |
| `core.eventLog` | `CITY_FOUNDED`, `CITY_TRANSFERRED` (com dono anterior), `DISTRICT_BUILT`, `BUILDING_BUILT` com rodada | Para fundação e captura | Construções do Alpha nem sempre passam por ele |
| `players[]` | Prestígio, pesquisas **em ordem de aquisição**, Ambições concluídas, Hegemonia declarada, Figura, Ressonância, vitórias, Regiões exploradas, contatos | Sim | Não guarda a rodada de cada pesquisa nem o histórico de governos (só o governo final e a Era da última reforma) |
| `cities` + `core` | Nível, Ânimo final, distritos, edifícios, população, `foundedRound` | Estado final | Sem histórico de construção; a trajetória vem do `roundLog` |
| `legacyWorks` | Obra, dono, cidade, passos, rodada de início e de conclusão | Sim, completo | — |
| `treaties`, `tradeOffers` | Todos mantidos com estado final | Sim | `wars` e `routes` só têm o que está ativo ao fim |
| `winner` | Vencedor, motivo (`HEGEMONY` ou `ROUND_LIMIT`), rodada | Sim | Há um só ponto de escrita no motor (`endRound`) |
| Sala (`AlphaRoom`) | Assentos com `bot` e `botPersona`, `seed`, `mapSize`, `worldPreset`, `contentVersion` | Sim | **Humano × bot só existe na sala**, não no estado: o gerador recebe isso como contexto |
| Versão | `rulesVersion`, `contentVersion` ('v1.2'), `release` do servidor; `alphaVersion` e `telemetry.version` são **literais velhos** ('0.1.0-alpha.1') | Parcial | Não existe SHA de build; por isso o relatório leva um **`economyFingerprint`** (hash de balance, unidades, requisitos de Hegemonia, combate, calendário) |

### O que NÃO é preservado e como o relatório trata
Estoque inicial exato dos 8 recursos (o primeiro valor é o fechamento da 1ª rodada), fluxos por recurso de Madeira/Pedra/Metal/Cultura, rodada de cada pesquisa, histórico de governos, quem declarou guerra a quem, ordens rejeitadas na hora do envio, número de Elevar por civilização, unidades recrutadas por civilização além dos eventos de resolução. Cada um aparece em `quality` como `UNAVAILABLE` ou `PARTIAL`, com a razão, e **nunca** como zero.

Partidas antigas: uma sala encerrada antes do relatório ganha um relatório **reconstruído em memória** (`origin: RECONSTRUCTED`), só do que o estado preserva; nada é escrito na leitura.

## 2. Formato `MatchReportV1` (`packages/game-domain/src/alpha-match-report.ts`)

Blocos: identificação (`match`, `seats`), `result` (vencedor, ranking com o critério de desempate de cada posição, Hegemonias, Prestígio por fonte), `civilizations`, `economy`, `actions`, `conflicts`, `timeline`, `coverage`, `quality`.

- `schemaVersion` fixo em 1. Um relatório gravado **nunca é regenerado** por um patch; mudar o formato é um `schemaVersion` novo.
- Procedência por campo: `quality[]` com `OBSERVED`, `CALCULATED`, `PARTIAL` ou `UNAVAILABLE` e a nota.
- Privacidade: assentos por id, civilização, Figura e tipo (humano/bot/desconhecido). Sem nomes de exibição, ids de convidado, código de convite, tokens, e-mails nem `privateRng`. O texto da linha do tempo é gerado a partir de registros estruturados, nunca copiado de eventos.
- Compacto: séries como vetores de números, linha do tempo curada em no máximo 160 marcos; uma partida curta ocupa poucos KB (o teste trava < 40 KB).
- `economyFingerprint` e `configKey` permitem não misturar economias e não contar a mesma seed e configuração duas vezes.

## 3. Geração, guarda e leitura

- **Gerador** puro `buildMatchReport(estadoFinal, contexto)` (motor). Mesmo estado e mesmo contexto = mesmos bytes.
- **Gancho único**: `ReportingAlphaRepository` envolve o repositório e gera o relatório no `save` que transforma a sala em `FINISHED`. Todo caminho para o fim (comando, expiração por prazo, bots, guardas) passa por esse `save`. Falha → registrada, a sala é salva sem relatório; **o fim da partida nunca é bloqueado**.
- **Guarda**: campo opcional `report` (padrão `null`) no registro da sala. Sem migração de banco (a coluna é JSON), snapshots antigos carregam. Já guardado, não é tocado de novo.
- **Leitura**: `GET /api/alpha?gameId=…&report=1`. Exige assento na partida e partida `FINISHED` (senão 409 `NOT_FINISHED`; sem assento 403). Não vai na visão ao vivo da sala, então não pesa em cada atualização e não vaza nada durante o jogo. Sobrevive a recarregar a página: é o dado guardado.
- **Salas de partidas já encerradas**: reconstrução em memória marcada `RECONSTRUCTED`.

## 4. Exportação e simulação

- JSON: o próprio relatório. CSV: `matchReportToCsv` (uma linha por assento, colunas comparáveis); os dois estão no botão da Crônica.
- Simulações: `scripts/lib/emit-match-report.mjs` (usado por `alpha-bot-economy.mjs --reports=<dir>` e `alpha-bot-playtest.mjs --reports=<dir>`) usa **o mesmo gerador** do servidor, com todos os assentos como `BOT`.
- Execuções já gravadas: `scripts/alpha-reports-from-runs.mjs` converte os arquivos de run existentes em relatórios `IMPORTED_RUN` **sem re-simular**. Eles têm os fluxos de 8 recursos da harness (que o motor ao vivo não grava) e marcam como indisponíveis ids de pesquisa, tipos de edifício, batalhas por assento e diplomacia.

## 5. Agregador do Meta (`scripts/alpha-meta-report.mjs`)

Lê qualquer pasta de relatórios. Filtros: `--rules`, `--content`, `--fingerprint`, `--players`, `--rounds`, `--world`, `--map`, `--civ`, `--kind=humans|bots|mixed`, `--policy`, `--origin`.
- **Nunca mistura economias**: um bloco por `economyFingerprint`.
- **Amostras independentes**: a mesma `configKey` conta uma vez; repetições são contadas e avisadas.
- **Tamanho da amostra sempre visível**; grupo com menos de 30 partidas independentes recebe aviso e nenhuma estratégia pode ser dita dominante; célula com menos de 20 observações diz "dados insuficientes". Taxas com intervalo de Wilson de 95%.
- Calcula: taxa de vitória por civilização, Governo, Figura e humano×bot; avanços mais/menos pesquisados e ordem mediana de aquisição; edifícios e distritos mais construídos; nível urbano alcançado por Era; recursos mais escassos (rodadas vazias/no limite); fome e Revolta; distribuição das Ordens e as ociosas; frequência e resultado de conflitos; condições de vitória; viabilidade de Obras de Legado.
- Um relatório que declara um campo `UNAVAILABLE` é **ignorado naquela métrica**, em vez de contar zeros.

## 6. Plano da interface (menor escopo)

Entregue: um componente `AlphaChronicle` (`apps/web/app/alpha/alpha-chronicle.tsx`) aberto por um botão **“Crônica da Partida”** na tela final existente (e no cartão compacto que a substitui). Seis seções em `Segments` já usado nas Folhas da Mesa: **Resumo** (ranking com o desempate, de onde veio o Prestígio, Hegemonias), **Civilizações** (cartão por civilização), **Economia** (miniaturas de população/Prestígio/nível/Ânimo, fome, Revolta, estoque final, rodadas vazio/no limite por recurso), **Desenvolvimento** (distritos, edifícios, pesquisas por domínio, primeira cidade de cada nível), **Conflitos** (ataques, defesas, peças perdidas, assaltos, Ordens usadas e ociosas, tratados), **Linha do tempo**. Sem página administrativa. Rodapé recolhido “O que esta Crônica não sabe” lista tudo o que é parcial ou indisponível, em linguagem direta. Estilo: mesmos tokens e superfície do modal da tela final (nenhum token novo), responsivo, a Crônica rola dentro do modal.

Fora desta primeira versão (para decidir): gráficos maiores por recurso, comparar com a média do Meta dentro da partida, compartilhar a Crônica por link, uma ferramenta administrativa com upload de relatórios.

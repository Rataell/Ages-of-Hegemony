# Relatório — First Playable Product Slice

## A. Estado inicial

Base: `feature/aoh-economy-territory`, commit `b580236` (`feat: add territorial economy districts and city expansion`). Ancestry de `66472ae` confirmada antes da edição. Branch criada a partir desse HEAD: `feature/aoh-playable-product-slice`.

Regressão inicial executada: 277 testes em 11 arquivos, todos aprovados. Snapshot atual v3, com migração explícita v2 para v3. A página existente era somente leitura. README ainda dizia schema 2. Existiam `docs/auditoria-2026-09-18.md`, `pnpm-lock.yaml` e `pnpm-workspace.yaml` não rastreados; foram preservados.

## B. Arquitetura adicionada

UI React → fetch → Next Route Handler → LocalPlay → GameService → engine/validação → InMemoryGameRepository/CAS → PlayerView → UI.

Engine, schemas, regras, migrações e interfaces do repository existentes permaneceram sem alteração. LocalPlay pertence ao servidor; custos e disponibilidade são derivados por configuração e execução de comandos sem persistência. Submissões validam novamente antes de salvar. Imports de tipos no cliente desaparecem no bundle; ESLint proíbe importar engine/Prisma/Node nos componentes de gameplay.

## C. Local Play Mode

Sessão local temporária com cookie HttpOnly/SameSite Strict e IDs aleatórios gerados fora da engine. Perspectiva ativa mantida no servidor; comandos não podem assumir outro ator. Troca explícita de perspectiva não altera propriedade. Avanço de fase é uma capacidade de scheduler de desenvolvimento separada de submit.

Rota indisponível fora de NODE_ENV=development. Origem deve ser local e corresponder ao Host real; nextUrl normaliza localhost, portanto não serve sozinho para a comparação de origem. Script de desenvolvimento escuta loopback. Sem autenticação, lobby, WebSocket ou multiplayer fictício. Nenhum banco foi alterado.

## D. Interface

Tela inicial com Nova Partida e 2–6 jogadores, GameShell, barra de recursos, painel civilizacional, mapa, inspectores de cidade/território, PopulationManager, ActionBrowser, seleção de governo, controle de fases, relatório e histórico. UI state separado dos dados autoritativos. Guia inicial dispensável, detalhes recolhíveis, foco visível, inputs rotulados e dialog nativo com Escape/foco.

Tokens de tema/recursos/civilizações; serif e sans-serif locais; símbolos SVG de recursos. Mobile mantém mapa acessível e painéis com rolagem. Nenhuma fonte ou arte externa bloqueante.

## E. Mapa

SVG axial com pan, zoom, seleção por clique/teclado e centralização por cidade. Sete terrenos, símbolos de features, cor de proprietário, controlador no tooltip/inspector, capital, população/desenvolvimento, melhorias, trabalho e elegibilidade. Fixtures literais: Duel 84, Standard 126, Epic 168 hexes. Sem gerador procedural.

## F. Fluxos jogáveis

ADOPT_GOVERNMENT, ASSIGN_POPULATION, CLAIM_HEX, ASSIGN_WORKED_HEXES, IMPROVE_HEX, DEVELOP_CITY, SPECIALIZE_CITY, BUILD_DISTRICT, BUILD_BUILDING e FOUND_CITY. Avanço de todas as fases existentes e manutenção com produção/consumo/crescimento/estabilidade/administração reais. Especialização não pode ser trocada; construção e claim continuam imediatos, conforme engine.

Feedback atualiza projeção, mapa, recursos, inspector e mensagem derivada do último evento próprio. Ações indisponíveis exibem motivo; erro autoritativo não altera estado. Breakdown por fonte é renderizado sem reconstrução matemática no navegador.

## G. Sistemas futuros

Pesquisa, Diplomacia, Militar e Hegemonia aparecem somente como indisponíveis. FOUNDATION é o rótulo atual; não há transição falsa de eras. PlayerOrder genéricas continuam infraestrutura sem resolução estratégica. Sem IA, combate, unidades, comércio internacional, vitória ou fog of war completo.

## H. Testes

- 277 testes existentes preservados.
- 9 testes novos de LocalPlay: cinco contagens de jogadores, ciclo completo, privacidade/ownership/versão/scheduler, concorrência CAS, entradas/sessões inválidas.
- Vitest final: **286 testes em 12 arquivos, PASS**.
- Playwright: **2 E2E, PASS**. Fluxo visual inclui nova partida, seleção, redistribuição, claim, Fazenda, trabalho territorial, distrito, Celeiro, rodada, recursos, erro inválido, Monarquia, desenvolvimento III, fundação de Fronteira e troca de perspectivas. Segundo E2E cobre origem externa e injeção de scheduler.
- Total: **288 casos automatizados**. Nenhum teste antigo removido.

## I. Browser validation

Chromium headless real instalado pelo Playwright. Não havia navegador exposto pela ferramenta de UI. A porta 3000 pertencia a outro aplicativo; E2E usa 3107 e não interrompe esse processo. Sem mocks de fetch ou engine. Nenhum pageerror no fluxo final; overflow horizontal verificado nas três larguras.

Revisão visual das capturas confirmou mapa, seleção, recursos, catálogos e relatório. A primeira revisão encontrou BOM invalidando :root; foi removido e uma asserção de estilo computado evita aceitar novamente capturas sem tema. Erro inicial de origem causado pela normalização Next também foi corrigido e coberto pelo E2E.

## J. Screenshots

[Índice de evidências](evidence/product-slice/README.md): mapa geral, cidade, catálogo de distrito e relatório em **1440×900, 1280×800 e 390×844**, mais duas capturas da página completa. PNGs locais pequenos, sem dados externos. No mobile a captura da cidade é feita após rolar até o inspector.

## K. Performance

SVG com até 168 hexes e componente memoizado; pan/zoom não consultam o servidor. Consultas de ações cartográficas limitam candidatos ao raio da cidade. Amostras locais isoladas de projeção/previews iniciais: 60 ms para Duel e 40 ms para Epic; são observações de uma execução, não benchmark estatístico nem garantia. Validação integral e log crescente continuam os principais riscos para partidas longas.

## L. Auditoria corrigida

README atualizado de schema 2 para schema 3, mantendo migração explícita v2. Arquitetura/loop/roadmap refletem interação real. npm e package-lock permanecem autoritativos. Artefatos pnpm provisórios foram auditados, preservados e ignorados deliberadamente; não houve migração de gerenciador. Arquivos AGENTS.md/CLAUDE.md gerados pelo Next são incluídos conforme orientação do framework. Auditoria preexistente permanece fora do commit.

## M. Gates

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run db:validate` e `git diff --check`: **PASS**. `npm run check` executou lint/typecheck/test/build em sequência. `npm run test:e2e`: **PASS**. Typecheck inclui E2E e configuração Playwright. Downloads Prisma/Chromium exigiram rede fora do sandbox; nenhum gate foi omitido por isso.

## N. TODOs

Refinar UX e balanceamento a partir desta experiência. Comprovar PostgreSQL real antes de multiplayer persistente. Especificar autenticação/lobby/transporte, arbitragem, fog of war e resolução estratégica em rodadas próprias. Medir sessões longas antes de introduzir checkpoints ou otimizações da engine.

## O. Riscos e limites

Sessões e partidas permanecem em memória sem expiração/coleta; reinício perde progresso. Abas com o mesmo cookie compartilham perspectiva, sem sincronização automática. Histórico visual mostra os últimos 60 eventos próprios. Mapas são revelados e estoques iniciais generosos: são fixtures de laboratório. Texto de alguns erros raros preserva mensagem inglesa original como fallback. Mobile oferece acesso, mas gestão extensa é melhor no desktop. PostgreSQL real continua não comprovado.

## P. Commit

Entrega na branch `feature/aoh-playable-product-slice`, commit com assunto `feat: add local playable product slice`. Hash final informado na resposta de entrega e disponível em `git log -1`. Sem merge, push ou deploy.

## Q. Estado Git

Somente arquivos desta slice e arquivos gerados pelo Next são preparados para o commit. `docs/auditoria-2026-09-18.md` preexistente permanece não rastreado; arquivos pnpm preexistentes permanecem ignorados. Nenhuma alteração de banco, histórico ou trabalho alheio.

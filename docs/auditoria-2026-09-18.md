# Auditoria do estado atual — Ages of Hegemony

Data: 18/09/2026. Versão declarada: 0.4.0. Base: commit `b580236`, branch `feature/aoh-economy-territory`.

## Parecer

Temos uma fundação técnica funcional de um jogo 4X, com simulação econômica, cidades, governos e expansão territorial. A base passou nas verificações automatizadas executadas nesta auditoria. Ainda não temos uma experiência jogável completa: a interface apresenta um cenário fixo, não recebe comandos e não acessa partidas reais; multiplayer, resolução estratégica e condições de vitória permanecem pendentes.

Não é possível atribuir um percentual confiável de conclusão sem definir o escopo da primeira versão jogável. O estágio atual é um protótipo técnico de simulação, com demonstração visual.

## Inventário confirmado

| Área | O que existe | Limite atual |
| --- | --- | --- |
| Organização | Monorepo TypeScript: web, servidor, domínio, motor e utilitários compartilhados | Fluxo documentado usa npm; arquivos locais de pnpm também estão presentes |
| Motor | Criação para 2–6 jogadores, cinco fases, versões de estado, RNG serializável e transições determinísticas | Determinismo depende da mesma sequência aceita de comandos; não define ordem de chegada pela rede |
| Economia | Food, materials, wealth, knowledge e influence; produção, consumo, crescimento, escassez e estabilidade | Balanceamento provisório, sem validação por partidas reais |
| Cidades | Capital, fundação, população, seis categorias de alocação, desenvolvimento 1–5 e sete especializações | Fundação abstrata, sem unidade colonizadora |
| Governos | Proto-governo e cinco governos adotáveis; modificadores e administração | Alguns efeitos futuros e consumo de pontos de comando ainda inativos |
| Território | Coordenadas hexagonais, sete categorias de terreno, seis características, propriedade, controle, alcance e conexão | UNKNOWN é legado sem produção; SEA não tem exploração econômica normal |
| Infraestrutura | Cinco melhorias, sete distritos e sete edifícios, com custos e requisitos | Construção instantânea; capacidade militar não equivale a combate |
| Persistência | Repositório em memória e adaptador Prisma/PostgreSQL; snapshot v3 e escrita condicionada à versão | Banco real e concorrência entre conexões independentes não foram testados |
| Compatibilidade | Serialização validada, restauração e migração explícita v2 → v3 | V1 exige conversão manual; não há migração silenciosa |
| Servidor | Serviço de comandos, checagem do ator, projeções privadas e proteção contra gravações concorrentes | Identidade vem de contexto confiável; autenticação real não existe |
| HTTP | GET /health, escutando em loopback | Sem API de partidas ou WebSocket |
| Interface | Next.js/React, painel de cidades, território e detalhamento da economia calculado no servidor | Somente leitura, pré-renderizado, sem mapa interativo ou partida persistente |

## Comportamento e invariantes

O caminho implementado é entrada validada → motor → snapshot validado → persistência condicionada à versão → projeção do jogador. O motor não depende de banco ou transporte. Comandos verificam fase, propriedade, custos e versão; falhas de validação ou overflow impedem a transição completa. A manutenção discrimina produção, consumo e variação de estoque, permitindo reconciliar os valores.

As projeções evitam divulgar seed, RNG, ordens adversárias e log autoritativo. Isso é uma boa base de privacidade, mas a política efetiva de fog of war e a autenticação ainda precisam ser construídas.

Os comandos de gestão e território produzem efeitos imediatos em PLANNING. Já os envelopes genéricos EXPLORE, EXPAND, DEVELOP, BUILD, RECRUIT, RESEARCH, MOVE, NEGOTIATE e INFLUENCE apenas entram na fila. RESOLUTION e REACTION não aplicam seus efeitos; a fila é limpa na passagem de END_ROUND para MAINTENANCE. Portanto, aceitar essas ordens não significa que seus sistemas estejam implementados.

## Achados e prioridades

1. **Bloqueador de jogabilidade:** falta conectar ações do jogador a uma partida real. Evidências: `apps/web/app/page.tsx`, `apps/server/src/http.ts` e `packages/game-engine/src/engine.ts`. A próxima entrega deve ter um fluxo completo de ação, feedback e passagem de rodada.
2. **Bloqueador de multiplayer:** faltam autenticação, lobby, encerramento de planejamento, scheduler, arbitragem das disputas e reconexão/idempotência. O controle de versão impede atualizações perdidas, mas não estabelece justiça estratégica.
3. **Lacuna de persistência:** `tests/prisma-repository.test.ts` substitui chamadas Prisma por mocks. É necessário testar PostgreSQL real, JSONB, recuperação e duas conexões concorrentes antes de confiar partidas persistentes ao sistema.
4. **Documentação inconsistente:** o último parágrafo de `README.md` declara schema 2, enquanto `packages/game-domain/src/model.ts` exige schema 3. O início do próprio README já menciona v3. Corrigir evita orientação errada sobre saves.
5. **Instalação a consolidar:** `pnpm-lock.yaml` e `pnpm-workspace.yaml` estavam não rastreados antes desta auditoria. O segundo contém valores textuais provisórios em `allowBuilds`. Definir e documentar o gerenciador oficial e validar instalação limpa; isso não foi necessário para os testes com dependências já instaladas.
6. **Escala sem medição:** validação e cópia integral do estado, buscas de conectividade e crescimento do log podem aumentar o custo por comando. É um risco arquitetural conhecido, não uma lentidão demonstrada nesta auditoria. Medir com mapas e históricos representativos antes de otimizar.
7. **Automação de entrega:** não foi encontrada configuração versionada de CI no inventário examinado. Os scripts locais existem; executá-los em CI daria uma verificação repetível a cada alteração.

## Verificações executadas

Ambiente: Node 26.4.0 e npm 12.0.1, com dependências já instaladas.

| Verificação | Resultado |
| --- | --- |
| `npm run check` | PASS: lint, typecheck, testes e build |
| Vitest, dentro de check | 277 testes aprovados em 11 arquivos |
| Build Next.js | PASS, página inicial estática pré-renderizada |
| `npm run db:validate` | PASS |
| `node apps/server/dist/demo.js` | PASS usando o build disponível no momento da execução |
| `git diff --check`, antes do relatório | PASS |

As tentativas iniciais no sandbox falharam por acesso ao cache Prisma e criação de subprocessos (`EPERM`). A verificação completa foi reexecutada com acesso ampliado e passou. Esses bloqueios ambientais não foram classificados como falhas do produto.

A demo chegou à rodada 3, revisão 23, com Aurora e Fronteira, capacidade/carga administrativa 3/3 e estoque de 36 food, 31 materials, 18 wealth, 0 knowledge e 7 influence. Demonstrou restauração v3 idêntica e migração v2 → v3. O teste de integração da demo também passou dentro da suíte recompilada.

Limites: sem sessão manual no navegador, E2E, PostgreSQL real, instalação limpa, teste de carga, auditoria de vulnerabilidades de dependências ou pentest. Quantidade de testes não equivale a percentual de cobertura; não foi gerado relatório de cobertura. O parecer combina leitura dos caminhos principais, documentação e verificações automatizadas, não uma revisão exaustiva de cada linha.

## Próxima entrega recomendada

Construir uma partida local jogável usando o GameService e os comandos existentes: selecionar cidade/hex, atribuir trabalhadores, reclamar território, construir e avançar rodada, com erros e custos visíveis. Critério de conclusão: o usuário consegue realizar esse ciclo pela interface e observar seus efeitos econômicos sem executar scripts.

Antes de disponibilizar partidas compartilhadas, completar autenticação/autorização, regras de encerramento e resolução e integração PostgreSQL real. Depois, expandir os sistemas estratégicos conforme prioridade de produto: exploração, pesquisa, unidades, combate, diplomacia e vitória/hegemonia.

Nenhuma regra ou configuração foi alterada nesta auditoria. Este relatório é o único arquivo acrescentado; os arquivos locais de pnpm foram preservados. Não houve commit, push ou deploy.

# Public Alpha v0.1 — relatório de trabalho

**Estado: implementação em andamento; release não aprovada.** Este relatório é um checkpoint, não uma declaração de entrega pública.

## Base e Git

- Base: `feature/aoh-player-guide-compendium`, commit `193bf87`.
- Ancestry confirmada: slice `3b8f8d3`, fechamento visual `f58bb57`, guia/onboarding/compêndio `193bf87`.
- Trabalho: `feature/aoh-playable-alpha-v1`. HEAD ainda `193bf87`; alterações alpha não commitadas neste checkpoint.
- Sem tag alpha, push ou deploy. Nenhum remote Git configurado.
- Arquivos preexistentes preservados: `.agents/` e `docs/auditoria-2026-09-18.md`.

## Arquitetura e sistemas

A UI envia comandos HTTP. O boundary valida origem, corpo e cookie assinado; o serviço resolve o assento, carrega o repository, executa a engine e grava por CAS. O cliente recebe projeção permitida. A iniciativa é explícita e rotativa, independente da ordem das gravações no banco.

O envelope alpha v4 preserva o núcleo econômico v3. A migração explícita guarda o snapshot original para rollback. RNG privado determinístico usa HMAC-SHA256; o seed público do lobby não expõe baralhos, mapa ou dados futuros.

Implementados: lobby 2–6, convidado, escolha civilizacional, prontidão, reconexão, polling, temporizadores por consulta, pontos de comando, cinco fases, ordens, exploração, névoa, recrutamento, movimento, suprimento, guerra, captura/integração, pesquisa, eras, cartas, projetos, tratados, comércio, influência, Prestígio e vitória. Gestão urbana reutiliza as regras da slice.

Ainda não existe prova de que todos esses fluxos estejam completos na experiência pública. Veja [known-limitations.md](known-limitations.md).

## Conteúdo e apresentação

- 30 regiões autorais: 6 pátrias e 24 fronteiras. Tabuleiro alpha: 210 hexes SVG.
- 12 civilizações: Aurélia, Valgard, Merídia, Thalos, Saren, Kor, Orinth, Nymara, Veyra, Solenne, Dravik e Elyra.
- 6 unidades: Pioneiro, Infantaria, Cavalaria, Engenho de cerco, Esquadra e Emissário.
- 50 avanços: 40 comuns e 10 convergências; divergência entre centralização e federação.
- 108 cartas: 24 eventos, 30 estratégias, 24 ambições, 18 conselheiros e 12 Grandes Projetos.
- Projetos são exclusivos, custam recursos e exigem era/distrito. O catálogo define seus efeitos e Prestígio.
- UI `/alpha`: lobby, mapa, tabuleiro, cidade, pesquisa, cartas, diplomacia, eras, Hegemonia, relatórios, dados de combate e diagnóstico seguro. Temas claro/escuro/sistema.
- Componentes tabletop, manual alpha, compêndio ampliado, ajuda imprimível e acabamento visual continuam incompletos.

## Regras estratégicas verificadas

Combate usa força, modificadores e 2d6 privados determinísticos por lado. Empate favorece defensor; margem define perdas e sobreviventes derrotados recuam quando possível. Não há transporte naval. A UI ainda precisa discriminar todas as parcelas antes da confirmação.

Tratados e trocas são validados pelo servidor. Rotas dependem de acesso e acordos. Pactos defensivos convocam parceiros diretos, sem cadeia recursiva. Hegemonia exige Era V, declaração pública, requisitos visíveis e duas rodadas completas posteriores à qualificação. No limite de rodadas, Prestígio decide com desempate determinístico.

## Banco e implantação

Repository PostgreSQL/Prisma e migration aditiva `20260919000100_alpha_match` escritos. Persistem lobby, participantes, snapshot, versão, status e timestamps. Runtime público não aceita fallback em memória.

Variáveis: `DATABASE_URL`, `DIRECT_URL` quando necessário para migrations, `ALPHA_SESSION_SECRET` e `ALPHA_PUBLIC_ORIGIN`. Teste isolado exige `ALPHA_TEST_DATABASE_URL`. Não há credenciais reais disponíveis neste checkpoint.

Migration no banco alpha: **não executada**. Integração PostgreSQL: **não executada**. Reinício do processo implantado: **não verificado**. Topologia proposta: Next/Node na Railway e PostgreSQL Supabase. URL pública: **inexistente**.

## Testes e auditoria

Baseline: 297 testes / 14 arquivos. Antes das últimas alterações, 354 testes / 25 arquivos passaram. O novo cenário completo passou isoladamente; a execução conjunta ultrapassou o timeout padrão de 5 segundos. Timeout restrito ao cenário foi ajustado para 15 segundos; a regressão completa precisa ser repetida.

Última execução de navegador: **3 E2E PASS**, incluindo dois contextos alpha, gestão, prontidão, reconexão, privacidade e regressão da slice local. O E2E alpha usa repository de teste em memória; não comprova PostgreSQL ou transporte implantado. Tema escuro após recarga tem asserção própria.

Lint e typecheck passaram antes das últimas adições de teste PostgreSQL e proteção da rotação. Build de produção, Prisma validate e diff check da alpha atual ainda precisam ser registrados. Não interpretar gates antigos como prova do diff atual.

Proteções existentes: cookie HttpOnly assinado, identidade resolvida no servidor, validação de origem, limite de corpo, rate limit por processo, CAS, projeções sem mãos/objetivos/ordens/RNG adversários, rotas locais restritas a desenvolvimento. Auditoria final de segurança ainda pendente; não há declaração de ausência de vazamentos.

Capturas em `docs/evidence/playable-alpha-v1/`. Faltam evidências completas de batalha, projeto, progressão, manual e compêndio alpha. Acessibilidade básica e ausência de overflow foram exercitadas nos fluxos automatizados; revisão manual completa e medições de desempenho 2/4/6 continuam pendentes.

## Próximos gates

Concluir lacunas documentadas, repetir checks após alterações, executar prova PostgreSQL, E2E real e revisão visual. Depois identificar destino/credenciais, verificar publicamente colisão do nome e realizar deploy. Formal trademark clearance remains a pre-commercial-release task.

Commit final e tag `v0.1.0-alpha.1` somente após entrega efetiva e todos os gates obrigatórios aprovados. Nenhuma alegação de release, publicação ou persistência real neste checkpoint.

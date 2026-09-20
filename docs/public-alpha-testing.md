# Validação da alpha

## Execução local

Use npm. `npm run dev:web` compila os pacotes e inicia Next. A slice de desenvolvimento continua em `/`; a alpha está em `/alpha`. Para usar a API alpha real, configure PostgreSQL, `ALPHA_SESSION_SECRET` e `ALPHA_PUBLIC_ORIGIN`. Sem configuração, o endpoint responde 503; não existe fallback público em memória.

## Provas automatizadas

- `npm test`: regressão da engine, migração, catálogos, projeções, HTTP, serviço, cidades, guerra, diplomacia, Hegemonia e cenário completo.
- `npm run test:e2e`: slice local e dois contextos alpha independentes. Usa porta 3107 e diretório `.next-e2e`, preservando o servidor de desenvolvimento na porta 3000.
- `npm run test:db:docker`: sobe um PostgreSQL efêmero em Docker (porta 5433), aplica as migrations e roda a integração. `npm run test:db` usa um `ALPHA_TEST_DATABASE_URL` local já migrado. Ambos recusam hosts não locais; o Supabase da alpha nunca é usado. Consulte [database-local.md](database-local.md) e [supabase.md](supabase.md).
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm run db:validate` e `git diff --check`: gates adicionais.
- `npm run db:deploy`: aplicar migrations no destino alpha identificado. Não executar `migrate dev` nem `migrate reset` em ambiente público.

O E2E alpha usa `AlphaHttp`, `AlphaGameService` e engine reais, mas substitui somente o repository por memória e encaminha requisições via interceptação Playwright. Isso permite verificar identidade, cookies, interface, projeções e comandos sem alegar prova de rede ou banco implantado.

## Cenário determinístico de partida completa

`tests/alpha-match-scenario.ts` define uma preparação deliberadamente rica em recursos e cidades. Depois da preparação, toda alteração passa por `applyAlphaCommand`.

O roteiro escolhe ambições, usa carta, adota governo, negocia comércio e fronteiras, explora, pesquisa, cria rota, move pioneiro, recruta, funda cidade, declara guerra, combate com retirada, desenvolve cidades, constrói distritos e arquivos, reivindica e trabalha território, melhora terreno, avança eras, conclui projeto e consolida Hegemonia. O teste repete o roteiro e compara todo o estado e o histórico de comandos.

Critérios: estado válido, vencedor p1 por Hegemonia, cinco eras percorridas, combate com perdas e retirada, receita comercial em relatório e Grande Projeto concluído. O teste tem timeout próprio de 15 segundos porque executa duas partidas completas. Não aumenta o timeout dos demais testes.

## Evidências e pendências

Capturas automatizadas em `docs/evidence/playable-alpha-v1/` cobrem interfaces já exercitadas em 1440, 1280 e 390 pixels, incluindo tema e reconexão. Arquivo de imagem, por si só, não significa revisão visual completa.

Antes de liberar: repetir o fluxo com API e PostgreSQL reais, reiniciar o processo servidor com partida ativa, testar reconexão, validar combate no navegador e término, conferir privacidade com dois clientes e revisar o manual contra as regras. Registrar falhas e status real em [playable-alpha-report.md](playable-alpha-report.md). Nenhum teste em memória substitui esses gates.

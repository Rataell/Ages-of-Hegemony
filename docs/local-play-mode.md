# Local Development Gameplay Session

Execute `npm run dev:web` e abra http://127.0.0.1:3000. Não requer banco, conta, IA ou servidor de health check. `npm run build` verifica o bundle, mas Local Play retorna 404 em produção deliberadamente.

## Caminho autoritativo

Client Component → fetch JSON → Next Route Handler → LocalPlay → GameService → engine/validação → repository CAS → PlayerView → React.

O cookie HttpOnly identifica uma sessão aleatória mantida no processo do servidor. A perspectiva ativa pertence à sessão; o JSON não pode se autodeclarar outro ator. Trocar perspectiva é uma capacidade explícita de hotseat/debug e não transfere ownership. Duas abas com o mesmo cookie compartilham perspectiva. Comandos incluem expectedVersion; conflitos retornam a projeção atual e exigem decisão de reenvio.

Somente NODE_ENV=development habilita a rota. A origem precisa corresponder ao servidor e o payload JSON tem limite de 16 KiB após leitura. O script escuta 127.0.0.1. Não exponha esse servidor como multiplayer: trocar jogador e avançar fase são capacidades de desenvolvimento, não autenticação. O comando ADVANCE_PHASE continua proibido em GameService.submit; a ação local advance usa GameService.advance e nunca retorna GameState.

## Dados e previews

Mapas literais em local-maps.ts definem terreno, centros e estoques iniciais. IDs de sessão/partida usam aleatoriedade do servidor, fora da engine. Regras e RNG do jogo permanecem determinísticos. A geografia é revelada para inspeção; fog of war completo não existe. Só cidades públicas adversárias são projetadas, sem alocação ou recursos. Histórico contém apenas eventos com playerId da perspectiva atual.

Disponibilidade executa applyCommand sem salvar o resultado. Custos vêm da configuração; rendimento posterior vem de tileYieldBreakdown. O submit valida novamente e salva via compare-and-swap. Candidatos cartográficos limitam consultas pelo raio calculado no servidor. O navegador mantém apenas seleção, modais, pan/zoom, formulários e dados projetados.

## Limitações

Progresso temporário: reiniciar o servidor, recompilar o adaptador ou perder o cookie pode encerrar acesso à partida. Retomar sessão funciona enquanto cookie e processo existem. Não há save em nuvem, expiração, coleta de sessões, execução distribuída ou sincronização entre abas. O histórico mostrado limita-se aos últimos 60 eventos próprios; o log autoritativo continua integral em memória. Essa retenção deve ser revisada antes de sessões longas ou compartilhadas.

Fixtures e recursos iniciais são laboratório de UX. Ordens PlayerOrder genéricas não são usadas; combate, pesquisa, diplomacia, IA, transporte multiplayer e vitória permanecem ausentes. PostgreSQL real é gate futuro obrigatório.

## Verificação

`npm test` cobre fixtures para 2–6 jogadores, fluxo completo, ownership, privacidade, conflitos e invalidação. `npm run test:e2e` usa Chromium/Playwright e o servidor Next real. Instale o navegador com `npx playwright install chromium`. Nenhum segredo ou serviço externo é necessário para jogar.

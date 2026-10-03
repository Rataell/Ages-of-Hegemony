# Playtest e correções — Alpha v0.1 (2026-10-03)

- Branch: `feature/aoh-playable-alpha-v1`. Base: `a4bdc4e` (`feat(alpha): advance playable systems`).
- Máquina: macOS, Node 26.10, npm (lockfile `package-lock.json`).
- Escopo: jogar como usuário real em 2, 4 e 6 lugares, corrigir o que impede uma partida de ponta a ponta e medir o alcance de contato.
- Sem push, merge, deploy ou mudança de produção. Commits locais, um por fatia.

## Como foi jogado

| Meio | Uso |
|---|---|
| Navegador real (Playwright headless, sessões salvas por lugar) | Criar mesa, entrar, escolher civilização, cada decisão de rodada clicada pela interface, capturas de tela de cada passo |
| Bots HTTP pela API pública, com o cookie de cada lugar | Avançar rodadas repetitivas até contato, guerra e fim de partida; a interface foi inspecionada nos momentos-chave |
| `npm run alpha:lab -- --players=N --contact` | Fluxo completo em 2/4/6 navegadores |
| `node scripts/alpha-contact-sim.mjs` (novo) | Partidas em processo com várias sementes para medir a rodada do primeiro contato |

Partidas completas jogadas nesta sessão: 2p até o fim por limite de rodadas (com guerra, reação e combate), 2p com desenvolvimento (pesquisa, distritos, segunda cidade, eras até Civilização), 4p até o contato.

## O que impedia ou confundia o jogo, e o que mudou

| Achado no jogo | Correção | Commit |
|---|---|---|
| "Confirmar planejamento" recusado na rodada 1 sem causa visível: ambições secretas escondidas na aba Cartas | O tabuleiro abre na escolha de ambições na rodada 1 (pode ser adiada) | `eecdfa8` |
| Explorar era um botão escondido em "Outras ordens"; mover exigia clicar hex a hex; ataque oferecido a peças civis | O servidor projeta, por peça, destinos alcançáveis (caminho pronto), regiões exploráveis e o bloqueio de fundação, com as regras dos validadores. O mapa destaca alvos e o inspetor oferece a ordem que cabe no hex | `eecdfa8` |
| Dois exploradores na mesma região na mesma rodada: o segundo era recusado | Só o primeiro explorador orienta uma região intocada; os demais usam a orientação fixada | `eecdfa8` |
| Barra superior com 5 recursos legados ("Materiais") | 7 recursos autoritativos com medidor de armazém | `eecdfa8` |
| Capital com o nome do jogador | Capital nomeada pela civilização | `eecdfa8` |
| Resolução com identificadores ("ação PRODUCE") e sem detalhe; painel transparente (token de cor inexistente) | Mensagens dizem quem, o quê, onde e quanto; painel sólido | `eecdfa8` |
| Diplomacia: formulário de 10 campos, sem estado de relação nem explicação dos tratados | Um cartão por civilização: paz/guerra, acordos, propostas recebidas, ações planejadas, ajuda de cada tratado, guerra com confirmação | `2d21fa6` |
| Guerra declarada só permitia atacar na rodada seguinte | Ataque pode ser reservado com a declaração planejada (a declaração resolve antes dos Conflitos) | `2d21fa6` |
| Fase Conflitos: defensor não sabia que estava sendo atacado; quem não participava esperava | Só atacante e defensor com carta de reação aguardam; o defensor vê quem ataca qual hex e reage no mesmo painel | `2d21fa6` |
| Confirmação por engano não podia ser desfeita | `UNREADY` ("Voltar a planejar") enquanto alguém ainda decide | `2d21fa6` |
| Peças estrangeiras indistinguíveis no mapa | Selo com a cor do dono; estrangeiras tracejadas | `2d21fa6` |
| Fim de partida: uma linha, sem placar nem próxima ação | Resultado com motivo, ranking com critérios de desempate, nova partida/crônicas/mapa final | `348e31f` |
| Cidade sem ação = rodada sem produção, sem aviso | Checagem antes de confirmar (cidades sem ação, peças paradas, evento mundial, propostas sem resposta) | `e26be04`, `bd4e723` |
| Evento mundial (recurso ou Prestígio grátis) e propostas recebidas ficavam escondidos | Ponto de alerta na aba correspondente | `bd4e723` |
| Contato dependia de gastar ações em recrutamento | Toda civilização começa com um Explorador (ver medição) | `142c53e` |
| Sem regras dentro do `/alpha` | "Como jogar", com números lidos das regras da partida | `4d726bd` |
| Cidade com ação planejada continuava oferecendo o menu inteiro | "Nesta rodada: <ação>" com "Trocar ação" | `2c3f786` |
| Reivindicar território: botão em qualquer hex, recusa só no servidor | Hexes reivindicáveis destacados (simulação da regra real) | `80db4e2` |
| Pulso do mundo sem efeito descrito | "Nova pedreira — +2 Pedra para todas as civilizações." | `70b26fc` |
| Duas cidades podiam reservar o mesmo avanço (ação perdida) | Recusado na reserva | `37a750a` |
| Crônicas: "Produção creditada 0" e "Consumo 0 de 0" (campos do motor antigo) | Relatório com todas as linhas do ledger, fechando estoque inicial + linhas = final | `04d3cb5` |
| Crescimento populacional invisível | Medidor de crescimento e previsão de sobra de Alimento por rodada | `04d3cb5` |
| Hexes trabalhados aceitavam hexes sem dono | Seleção limitada ao território da cidade | `c1929a2` |
| Celular: botão de confirmar a 1 765 px de rolagem | Barra de fase fixa no rodapé em ≤ 900 px | `a0419eb` |

## Revisão de textos (OpenSpec 8.5)

| Área | Verificação |
|---|---|
| Eras | Fundação, Expansão, Civilização, Impérios, Ascensão, Hegemonia em toda a interface; critérios com rótulos em português |
| Fases | Planejamento, Ações urbanas, Ordens e movimento, Diplomacia e comércio, Conflitos, Integração e manutenção, Fim da rodada |
| Vitória | "Hegemonia <caminho> consolidada" ou "Maior Prestígio ao fim das N rodadas"; desempate descrito até a iniciativa |
| Guia | "Como jogar" lê rodadas, ações, duração de acordos e peças das regras da partida |
| Mensagens | Resolução sem identificadores de comando; recusas do motor Alpha em português; códigos do motor territorial traduzidos por `ruleMessage` |
| Rótulos | "Inspector" corrigido para "Inspetor"; unidades, níveis de cidade, ânimo, fortificação, atitudes de povos e presença cultural traduzidos |

## Layout e acesso (OpenSpec 8.6)

1440×900, 1280×800 e 390×844, temas Claro e Escuro: sem rolagem horizontal. Em 1280 os cartões de peças cabem no Conselho. Em ≤ 900 px a barra de fase fica fixa. Diálogos recebem foco; o guia fecha com Esc; hexes são selecionáveis por Tab e Enter/Espaço.

## Medição: rodada do primeiro contato

`node scripts/alpha-contact-sim.mjs --seeds=12` (QUICK, exploração dirigida à capital rival mais próxima):

| Lugares | Antes (só Pioneiro) | Depois (Pioneiro + Explorador) |
|---|---|---|
| 2 | 10/24 civilizações com contato, pior rodada 6 | 24/24, pior rodada 4 |
| 4 | 36/48, mediana 4 | 48/48, mediana 3 |
| 6 | 51/72, mediana 6 | 59/72, mediana 4 |

Em jogo real (2p, pela interface e bots): contato na rodada 5, guerra declarada e ataque na rodada 6, reação e combate resolvidos na 7, fim por limite na 9.

## Checklist de ações (OpenSpec 10.3, aguarda assinatura do dono)

Legenda: **UI** = feito clicando no navegador nesta sessão; **HTTP** = pela API pública com o cookie do lugar (bot); **E2E** = coberto por spec Playwright; **—** = não exercitado em jogo nesta sessão (só testes de unidade).

| Comando | Como foi exercitado |
|---|---|
| Ambições secretas | UI, E2E |
| Produzir | UI, HTTP, E2E |
| Construir distrito | HTTP, E2E |
| Construir edifício / fortificação | — |
| Recrutar | HTTP, E2E |
| Pesquisar | HTTP, E2E |
| Investimento público, Sustentar comércio, Ação cívica | — |
| Mover, Explorar | UI, HTTP, E2E |
| Atacar (com guerra planejada na mesma rodada) | UI, E2E |
| Missão de influência (Emissário) | — |
| Rota comercial | — (teste de unidade de rotas) |
| Cancelar ordem / Trocar ação | UI |
| Fundar cidade | HTTP |
| Reivindicar território | UI, HTTP, E2E |
| Distribuir habitantes, territórios trabalhados | UI, E2E |
| Melhoria (Fazenda) | E2E |
| Desenvolver cidade, adotar governo, especializar | — |
| Estrada | — |
| Propor tratado, recusar | UI |
| Aceitar tratado, encerrar tratado | — (E2E aceita em cenário) |
| Declarar guerra | UI, E2E |
| Carta de reação | UI |
| Cartas de planejamento, contratar conselheiro, Grande Projeto | — |
| Escolha do evento mundial | HTTP |
| Avançar de era | HTTP |
| Habilidade da civilização, habilidade do líder | — (testes de unidade) |
| Postura defensiva | E2E |
| Declarar Hegemonia | E2E (cenário roteirizado) |
| Oferta comercial (troca imediata), aceitar | UI |
| Presente, promessa, empréstimo | — (testes de unidade) |
| Povo independente: negociar, influenciar | UI |
| Povo independente: comerciar, proteger, integrar, conquistar | — (testes de unidade) |
| Disputa cultural | — (testes de unidade) |
| Confirmar / Voltar a planejar | UI |

Partidas: 2p até o fim (guerra, reação, combate), 2p com desenvolvimento até a era Civilização, 4p até contato, 6p completa (9 rodadas) pelo `alpha:lab` com 0 erros.

## Gates ao fim da sessão

`npm run lint` ✓ · `npm run typecheck` ✓ · `npm test` 700/700 (54 arquivos) ✓ · `npm run test:e2e` 6/6 ✓ · `npm run build` ✓ · `npm run db:validate` ✓ · `git diff --check` ✓ · `npm run test:db:docker` 6/6 ✓ (PostgreSQL 17 em Docker). `openspec validate` não rodou: a CLI não está instalada neste Mac.

## Lacunas que continuam (por prioridade)

1. **Crescimento populacional**: uma cidade nova produz exatamente o que come; sem realocar Produtores e reivindicar/trabalhar hexes de Alimento ela não cresce. A interface agora explica, mas o ritmo padrão é lento para QUICK (9 rodadas).
2. **Hegemonia em QUICK**: chegar à Era da Hegemonia exige 5 avanços de era; em 9 rodadas o melhor caso observado foi Civilização (era 3). QUICK termina por Prestígio na prática.
3. **6 lugares**: 13 de 72 civilizações ainda sem contato em 9 rodadas na simulação.
4. **CAS por sala** (MP-CAS-1 da auditoria): a re-tentativa automática única (OpenSpec 7.6) cobre o caso humano típico; rajadas simultâneas em 6p ainda podem mostrar "A partida mudou".
5. **Celular**: a barra de fase está fixa, mas o restante ainda é uma página longa (Conselho, mapa e inspetor empilhados).
6. **Acordos com troca de recursos** usam o vocabulário de 5 recursos (Materiais = madeira/pedra/metal).
7. Tarefas abertas em `openspec/changes/public-alpha-v0-1-closure/tasks.md` (comércio entre jogadores, ações de povos independentes, PostgreSQL em Docker, deploy).

## Reproduzir

```bash
npm install
npm run dev:alpha                     # http://127.0.0.1:3001/alpha
npm run alpha:players -- --players=4 --auto-join --start
npm run alpha:lab -- --players=4 --rounds=4 --contact
node scripts/alpha-contact-sim.mjs --seeds=12
```

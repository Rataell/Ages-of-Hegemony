# External Alpha V1.2 · RC5 — estabilização jogável

Branch `rc5/alpha-v1.2`, a partir de `e9187c4` (`stabilize/alpha-v1.2-audit`). RC4 (`dca181a`, tag `external-alpha-v1.2-rc4`) e o `main` não foram tocados. Versão exposta em `/api/alpha/health`: `alpha-external-1.2-rc5`. Nenhuma tag `frozen`.

## O que a RC5 faz

### 1. Seis edifícios (efeitos mínimos da Fase 3, conectados ao motor, ao catálogo, à interface e aos testes)
Todos entram pelo caminho `CATALOG`: exigem o distrito da família na cidade, um por cidade, o avanço da Teia e o custo; o texto do efeito aparece na lista de construção e é o que o motor aplica.

| Edifício | Custo | Abre com | Efeito (lido por) |
|---|---|---|---|
| Moinho | 2 Madeira, 1 Pedra | Rotação de Culturas | Ao Produzir, +1 Alimento por Fazenda efetivamente trabalhada, máx. +2 (`cityYield`) |
| Observatório | 3 Pedra, 3 Conhecimento | Método Experimental | Dicas de exploração de Regiões fechadas até 6 hexes da cidade; não revela, não substitui o Pioneiro (`explorationHints`) |
| Tribunal | 3 Pedra, 1 Riqueza, 2 Influência | Urbanismo | A 2ª ativação da cidade não custa Ânimo, 1× por rodada na civilização (`courtWaives`); Governar segue pago |
| Arsenal | 2 Pedra, 3 Metal | **Ferro** (Era IV; a mesma que abre a Fundição) | Cavalaria e Cerco recrutados na cidade: −1 Metal (`kitUnitCost`) |
| Estaleiro | 4 Madeira, 2 Metal | Arquitetura Naval | Frota e Barca: −1 Riqueza ao recrutar; até 2 navios ancorados na cidade não pagam manutenção (`kitUnitCost`, `militaryUpkeep`) |
| Farol | 3 Pedra, 1 Madeira, 1 Riqueza | Navegação Oceânica | Pilhagem pirata no porto rouba 1 (em vez de 2); bloqueio exige 2 navios armados do mesmo inimigo; boarding vencido continua valendo (`pillagePort`, `blockadedBy`) |

Nenhuma tecnologia nova foi criada: o Arsenal passou a ser uma tag `building:ARSENAL` em Ferro (verificado contra Metalurgia, Engenharia e Treino de Manobras). Quartel e Centro cultural continuam fora (sem efeito); o texto de Formações de Guarda não os cita. Bots, Compêndio, Guia e Crônica conhecem os seis.

### 2. Tags `unit:*` são pré-requisito de recrutamento
O canon (§11, "Peça × Avanço") e as tags da Teia concordavam; o motor não lia. Agora `recruitBlock` exige: **Guarda** ← Formações de Guarda; **Atiradores** ← Metalurgia; **Cavalaria** ← Treino de Manobras; **Cerco** ← Engenharia; **Barca de Patrulha** ← Navegação Costeira; **Frota** ← **Cartografia** (a tag estava em Arquitetura Naval, Era III, mas a Frota é Era II e a Galera do canon é Cartografia; Arquitetura Naval segue dando Estaleiro e Frota Grau II). **Infantaria, Pioneiro e Enviado não têm avanço**: toda civilização forma um exército básico desde a rodada 1 (testado nas 12 civilizações jogáveis). Peças iniciais (a Guarda de Valgard, os Pioneiros) são peças postas e não são afetadas. Motor, lista de opções e interface usam a mesma verificação, e a mensagem diz o avanço ("Exige o avanço da Teia Cartografia."). Bots pesquisam Navegação Costeira/Cartografia (exploradores e mundos de água) e Formações (guerreiros).

### 3. Arquivo Acadêmico
Em partidas **novas** o Arquivo é da família Acadêmica (padrão do `territory`). **Nenhuma migração**: um snapshot carrega o requisito com que foi criado (o RC4 segue exigindo o Administrativo), e um Arquivo já construído mantém o +5 de Conhecimento qualquer que seja o distrito.

### 4. Ritmo experimental de 21 rodadas (M1 + M4 15%)
Selecionável na criação da mesa **só com a duração Rápida (21 rodadas)**: "Ritmo das cidades: Padrão (ritmo anterior) / Acelerado (experimental)". O padrão é o ritmo anterior. Acelerado = capital já Povoado com 4 habitantes (2 Produtores, 2 Eruditos), desenvolvimento 1 e Agricultura, e Elevar pede 3/5/7/9/12/15 habitantes (em vez de 4/6/8/11/14/18); custos, avanços, Eras, capacidade e vagas iguais. É guardado na sala e nas regras da partida (`rules.pace`), fica fixo, aparece na sala e na Crônica, e **entra na impressão digital de economia** do relatório, então o agregador do Meta nunca o mistura com o ritmo padrão. Partidas de 35 e 49 rodadas e partidas já iniciadas não são afetadas (a criação recusa o ritmo acelerado fora da duração Rápida). O bônus de vaga da Federalização passou a ser por nível (Vila ou mais), não pelo mínimo de população padrão, para não sumir no ritmo acelerado.

### 5. Obras, Hegemonias, Prestígio: inalterados
Obras com os custos e +4 Prestígio atuais; limites fixos das Hegemonias (Riqueza 28, Influência 18); sem compensação de Prestígio para o M1; sem novos requisitos de edifício.

### 6. Crônica da Partida e Meta
`MatchReportV1` preservado. A Crônica abre da tela final, mostra os oito recursos, desenvolvimento urbano, avanços na ordem pesquisada, combate, Prestígio por fonte e os marcos, com a procedência de cada dado ("O que esta Crônica não sabe"). O ritmo vai no relatório (`match.pace`). Um relatório de partida real é gravado uma vez ao fim e lido por `GET /api/alpha?gameId=…&report=1` (só quem tem assento, só partida encerrada).

### 7. Duas mudanças de interface pedidas
- **Cofre na Bandeja**: os oito recursos ficam sempre visíveis na barra de baixo, cada um com a cor do tipo e o número em âmbar quando o armazém está cheio; o toque abre os limites e a Administração. O botão do topo saiu; da Bandeja saíram os chips de ordens por tipo e o contador "x / y prontos" (a lista "Ordens planejadas" e o selo de cada assento seguem).
- **Figura na mão**: a carta da Figura aparece no leque com as outras (e na gaveta do celular), com a ilustração do selo da civilização e as iniciais da Figura como retrato provisório; ao abrir mostra a Passiva e o Poder 1× por Era e o botão "Usar o Poder" (mesmo comando e mesmas travas da página Figura). No celular a mão sobe acima da Bandeja.

- **Mapa com trackpad e mouse**: rolar/deslizar com dois dedos ou a roda move o mapa; Shift + roda move de lado; Ctrl/Cmd + roda (ou o gesto de pinça no Mac) dá zoom em torno do cursor; a página nunca rola. Vale para o mapa da Mesa e para o mapa do lobby.
- **Passada de sobreposições**: no celular a Bandeja tem duas linhas (Cofre; ordens e botão principal) e o botão Confirmar planejamento deixou de sair da tela (o teto de 72 px da Bandeja agora é 118 px em telas até 900 px, com os controles do mapa e a gaveta de cartas acima dela); o aviso de Pulso fica por cima da placa de assento quando as duas coincidem.

## Compatibilidade e reversibilidade
- Saves RC4 e anteriores: carregam sem migração (fixture `rc4-midgame-state.json` joga 8 rodadas e salva/recarrega). Os campos novos têm padrão (`rules.pace`, `room.pace`, `room.report`).
- **Forma em disco**: uma mesa que não usa nada novo é gravada exatamente como no RC4 (sem `pace`, sem `report` até acabar), então um rollback para o RC4 ainda lê as mesas em andamento. Uma mesa de ritmo acelerado e uma partida encerrada com Crônica não são legíveis pelo RC4 (esquemas estritos).
- Sem migração de banco (a coluna é JSON).

## Incompatibilidades conhecidas
- Quem recruitava Frota, Barca, Guarda, Atiradores, Cavalaria ou Cerco sem pesquisar o avanço (o motor deixava) agora é recusado; saves antigos continuam com as peças que já têm. Testes e scripts que recrutavam assim foram ajustados.
- Em jogos novos o Arquivo pede o distrito Acadêmico (quem só tem o Administrativo não o constrói).
- A Frota agora abre em Cartografia (Era II) e não em Arquitetura Naval (Era III).
- As medições anteriores de "candA" (Candidato A) foram feitas com um mecanismo de simulação; a regra da RC5 é a mesma, mas não foi reexecutada em centenas de partidas (por decisão).

## Como rodar localmente (sem tocar em nenhum ambiente)
```
npm install          # uma vez
npm run dev:alpha    # http://127.0.0.1:3001/alpha  (use 127.0.0.1, não localhost; memória: reiniciar apaga as mesas)
```
Várias pessoas na mesma máquina: uma janela anônima ou um perfil de navegador por jogador; quem cria a mesa passa o código ou o link `/alpha/join/<código>`. Bots: "Adicionar bot" no lobby. Outra porta: `ALPHA_LOCAL_PORT=3002 npm run dev:alpha`.

## Roteiro curto de playtest humano
1. **Mesa curta, ritmo acelerado**: Duração Rápida → Opções da mesa → Ritmo das cidades: Acelerado. A capital já deve ser Povoado com 4 habitantes. Compare com uma segunda mesa no ritmo padrão (mesma semente).
2. **Cofre e Figura**: os oito recursos estão na barra de baixo? Abra a carta da Figura no leque: a Passiva e o Poder aparecem? Use o Poder.
3. **Economia e construção**: construa Moinho (com Fazendas trabalhadas), Observatório, Tribunal, Arsenal, Estaleiro e Farol e confira se o efeito do texto é o que aconteceu (Produzir, dicas de exploração, segunda ativação sem perder Ânimo, preço de Cavalaria, manutenção de navios, pilhagem). Alguma coisa parece comprável e inútil?
4. **Recrutamento**: sem pesquisar, só Infantaria, Pioneiro e Enviado; Guarda/Atiradores/Cavalaria/Cerco/Frota/Barca pedem o avanço citado na mensagem. Isso impede de formar um exército básico?
5. **Combate e Saqueadores**: deixe um Bando se aproximar, defenda, contra-ataque, persiga e destrua o Acampamento (o Bando recua, reorganiza uma rodada e não teleporta).
6. **Navegação e água**: Frota (Cartografia), Estaleiro, Farol, bloqueio e pilhagem; mundos Arquipélago e Mar Interior.
7. **Hegemonias**: Riqueza 28 e Influência 18 são alcançáveis? (Tesouro + Banco + Metrópole; Chancelaria + Metrópole.)
8. **Fim da partida**: a tela final abre a **Crônica da Partida**; confira os oito recursos, o desenvolvimento, os avanços e o Prestígio; exporte o JSON.

Reporte o que parecer errado com a rodada, a cidade e a ação.

## Resultados dos gates (local, sem deploy)
- `npx tsc -b`, tipos de `apps/web`, `npx eslint . --max-warnings 0`: limpos.
- Suíte completa (`vitest run`): 135 arquivos, 1543 testes passam, 56 falhas esperadas (as já conhecidas, marcadas).
- Playwright (desktop e celular, 17 arquivos): 58 passam em uma rodada com 2 trabalhadores; 2 testes (`external-gate` 4 jogadores por SSE e `move-discovery-live` Infantaria sozinha) falharam sob carga e passam isolados (20 s).
- Fumaça de partida curta com bots (padrão e acelerada) e a Crônica da partida real: `tests/rc5-smoke.test.ts`.
- Nenhuma simulação em massa foi reexecutada.

## Testes E2E registrados como possíveis instáveis (flaky)
Na rodada completa com 2 trabalhadores em paralelo, dois testes falharam e passaram isolados (1 trabalhador, 20 s): `e2e/external-gate.spec.ts:126` (4 jogadores, a Mesa abre para todos e uma reação chega a todos por SSE) e `e2e/move-discovery-live.spec.ts:164` (Infantaria sozinha: Mover não destaca Região fechada). Os testes seguem no repositório, sem alteração; a causa suspeita é a carga do servidor de desenvolvimento em paralelo (tempo de espera), não verificada. Se voltarem a falhar isolados, é bug real.

## Frota exige Cartografia: confere com o canon
Canon V5.1a (`docs/product/rules-v5-proposal.md`): a Galera (Frota Grau I) é Era II e abre com **Cartografia** (linha da tabela de peças e Era II da Teia); Arquitetura Naval (Era III) abre a Galera de Guerra (Frota Grau II), a Nau de Transporte e o Estaleiro. A auditoria antiga (`naval-audit.md`) citava Metalurgia para a Galera e está superada. A RC5 segue o canon; nenhum ajuste de balanceamento foi feito além disso.

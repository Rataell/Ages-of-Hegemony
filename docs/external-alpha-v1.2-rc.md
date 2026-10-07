# External Alpha 1.2 (RC): Core 10, mundo, exploração

Branch `feature/external-alpha-finalization-rc`. Este documento registra o que a RC 1.2 muda, as auditorias feitas antes de tocar o código e o que ficou conscientemente de fora. Conceito: `docs/product/aoh-historical-civilizations-core10-figures-v1.md`, `aoh-core10-addendum-exploration-world-v1.md`, `aoh-material-culture-and-civilizations-concept-v1.md`.

## 1. Versionamento e salas antigas

- Cada sala guarda `contentVersion` (`v1.1` | `v1.2`). Salas criadas por esta versão gravam `v1.2`; uma sala sem o campo é lida como `v1.1`.
- **Sala V1.1**: abre normalmente (o estado ainda valida contra os catálogos atuais: ids técnicos, ids de Heranças, ids de líderes e de cartas foram mantidos), mas é **somente leitura**. `read` não roda housekeeping, expiração nem timers de bots e não grava nada; `lobby`, `command`, `roomAction` e `join` devolvem `LEGACY_ROOM` (HTTP 409) com a mensagem "Esta partida foi criada em uma versão anterior do Alpha (1.1)…". A projeção traz `legacy: true` e `legacyMessage`.
- **Sala V1.1 que deixe de validar** (conteúdo mudou demais): `decode` não lança mais; devolve uma mesa legada **sem o jogo** (`game: null`), com a mesma mensagem. Nada é apagado nem reescrito. Só um snapshot da geração atual que esteja corrompido continua falhando (503 controlado).
- **Formato em disco**: sala `v1.1` é gravada exatamente no formato V1 (sem `contentVersion`, `mapSize` nem `figureId`), então um rollback para o código V1.1 continua abrindo as salas antigas. Salas `v1.2` carregam as chaves novas e **não** abrem no código V1.1 (falham de forma controlada, sem apagar).
- Cobertura: `tests/alpha-legacy-room.test.ts` usa uma sala V1.1 **real** (gerada pelo código da tag `external-alpha-v1.1-bots-parity`, 1 humano + 2 bots, rodada 9) em `tests/fixtures/v11-room.json`.
- Não há version pinning de regras: partidas novas usam sempre a versão nova.

## 2. Core 10 e Figuras

Visível ao jogador: Helênicos, Egípcios, Mesopotâmicos, Persas, Israel e Judá, Romanos, Nórdicos, Chineses, Índia Antiga, Incas (Tawantinsuyu). O id técnico oculto (o que o estado, os kits, as cartas e as Heranças usam) não mudou, para não quebrar saves, regex de ids e testes:

| Civilização | chassi oculto | Civilização | chassi oculto |
|---|---|---|---|
| Helênicos | `valgard` | Romanos | `kor` |
| Egípcios | `nymara` | Nórdicos | `thalos` |
| Mesopotâmicos | `meridia` | Chineses | `orinth` |
| Persas | `dravik` | Índia Antiga | `saren` |
| Israel e Judá | `solenne` | Incas | `aurelia` |

`veyra` e `elyra` continuam válidos no esquema (salas V1.1) mas **não são selecionáveis**: o servidor só aceita os dez chassis do Core 10 (`CORE10_CHASSIS`) numa sala `v1.2`. Os seis chassis só-Bíblia (`kaedor`…`norvak`) seguem em autoria. A UI usa sempre `civilizationDisplayName()`.

**Figuras** (rótulo de UI; internamente `leader`): 3 por civilização, 30 no total, cada uma com **uma Passiva e um Poder 1× por Era**, usando só os tipos que já existiam (Passivas: limite de recurso, Suprimento +1, Integração +10; Poderes: Força, Movimento, Comando, Ânimo, Coesão, Tratados). Os dados vêm de `docs/product/aoh-historical-civilizations-core10-figures-v1.md` (`packages/game-domain/src/alpha-core10.ts`). Helênicos: Odisseu, Alexandre Magno (★), Agamenon; as reservas Leônidas, Héracles e Artemísia I existem só como conteúdo do Compêndio ("em breve").

Seleção: civilização → três Figuras → ★ recomendada pré-selecionada → o jogador escolhe → confirma com **Pronto**. As escolhas ficam **privadas até todos os lugares estarem prontos** (o servidor devolve `figureId: null` para os outros e `figureChosen: true`), então são reveladas ao mesmo tempo. A escolha vive na sala (F5 não perde). Bots escolhem a civilização livre pela semente e a Figura deterministicamente (`(seed + índice) % 3`). Ações de lobby novas: `CHOOSE_FIGURE`, `SET_WORLD`.

## 3. Traits, Limitações, Assinaturas e Heranças

Regra: 1 identidade mecânica forte + 1 contrapartida real + 3 Heranças + a Figura. Nenhum subsistema por cultura; só ganchos pequenos sobre mecanismos existentes (`packages/game-engine/src/alpha-kits.ts`). Estado de cada item (ACTIVE = a engine aplica; PLANNED = canon ainda sem regra, a UI diz "planejada").

| Civilização | Trait | Limitação | Assinatura |
|---|---|---|---|
| Helênicos | +1 suprimento no território próprio (ACTIVE) | Enviados +1 Influência (ACTIVE) | Falange de Escudos: Guardas +1 na defesa de cidade fortificada (ACTIVE) |
| Egípcios | **Cheia do Nilo**: a Seca custa 1 Alimento a menos; se a Irrigação a impede, +1 Alimento (ACTIVE, novo) | Frotas −1 movimento (ACTIVE) | **Casa da Eternidade**: Obra de Legado concluída rende +2 Prestígio (ACTIVE, novo) |
| Mesopotâmicos | primeira oferta comercial da rodada +1 Riqueza (ACTIVE) | Fortificação ≤ Muralha de Pedra até a Era IV (ACTIVE) | Karum (PLANNED) |
| Persas | obras −1 Madeira/Pedra; **Estrada Real**: peça sobre Estrada +1 suprimento (ACTIVE, novo) | rotas −1 Riqueza (ACTIVE) | Qanat (PLANNED) |
| Israel e Judá | disputas culturais +1 na defesa (ACTIVE); capital começa com +1 Ânimo (ACTIVE) | avanços de Conhecimento da Era I +1 (ACTIVE) | Casa do Templo (PLANNED) |
| Romanos | pedreira em Colina +1 Pedra; **Via Militar**: peça sobre Estrada (ou em hex próprio ao lado dela) conta como abastecida (ACTIVE, novo) | Frotas −1 movimento (ACTIVE) | Legionários-Engenheiros: Cerco +1 Brecha (ACTIVE) |
| Nórdicos | revelar região costeira +1 Conhecimento (ACTIVE) | exércitos terrestres −1 suprimento fora do território próprio (ACTIVE, antes PLANNED) | Incursores de Drakkar: sem penalidade anfíbia (ACTIVE) |
| Chineses | primeiro avanço de cada domínio −1 Conhecimento (ACTIVE) | Cavalaria +1 Alimento de manutenção (ACTIVE) | Astrônomo Imperial (PLANNED) |
| Índia Antiga | tratados +1 rodada (ACTIVE) | Cavalaria +1 Alimento de manutenção (ACTIVE) | Dūta Imperial (PLANNED) |
| Incas | fazendas +1 Alimento ao Produzir (ACTIVE); **Qhapaq Ñan**: Estrada em Colina/Montanha −1 Madeira/Pedra (ACTIVE, novo) | manutenção militar +1 Alimento a cada 4 peças (ACTIVE) | Qollqa Comum (PLANNED) |

As **54 Heranças** (3 por chassi) continuam **texto, status PLANNED** (o motor só as usa para liberar a pesquisa e preencher soquetes de Ressonância). As 30 do Core 10 foram reescritas com nomes e efeitos próprios, sem repetir a Trait/Assinatura da civilização nem um Avanço universal; ids `her-<chassi>-<n>` e pré-requisitos foram mantidos (compatibilidade com salas V1.1). A aba de Heranças mostra o status para a UI nunca prometer regra inerte.

Egípcios usam o chassi `nymara` (o plano B do documento de conceito) porque `iskara` está em autoria (sem capital, líder nem cartas).

## 4. Auditorias feitas antes de tocar o código

**Ressonância / Teia.** Continuam universais. Ressonância só dispara em `researchAdvancement → registerAdvance`: cada avanço (Teia, Convergência ou Herança) marca um soquete; o 5º resolve uma Repercussão. Uma Herança entra com o domínio do seu pré-requisito `web-*`. Nada foi alterado; só se escolheu deliberadamente o pré-requisito de cada Herança. Nenhuma Teia paralela por civilização.

**Irrigação / Seca (comportamento preservado).** Seca (`wp-drought`, `wp-regional-drought`) = perda única de 2 Alimento em todas as civilizações, aplicada ao abrir a rodada 1 e no passo 3 do Turno de Era; **Irrigação** (`web-irrigation`) a evita (`PULSE_MITIGATED`) e dá +1 Alimento por Fazenda trabalhada; o `IRRIGATION` do Distrito Agrário não tem efeito (edifício não construível). Não existe terreno ARID e **não foi criado** nenhum. Sinergia egípcia (pequena, sem imunidade): −1 na perda quando não há Irrigação; +1 Alimento quando a Irrigação a impede. **Futuro (documentado, não implementado):** terreno árido persistente, Seca que reduz produção por hex em vez de perda única, Celeiro mitigando Seca (hoje a Herança Incas só descreve), e Irrigação como melhoria por hex.

**Estradas (não redesenhadas).** `state.roads` é global e compartilhada; `BUILD_ROAD` é Ação principal (custo `roadCost` 1 Madeira/Pedra, em território próprio); unidade terrestre numa Estrada paga 1; Autocracia abastece a 1 hex de Estrada; abastecimento BFS passa por hexes próprios ou sem dono com Estrada; Passagem (Descoberta) abre até 3 hexes. As sinergias usam essa mesma rede: Persas (+1 suprimento sobre Estrada), Romanos (suprido sobre/ao lado de Estrada), Incas (Estrada em Colina/Montanha −1). Não há outra definição de conectividade.

## 5. Mundo

- **Tamanhos reais**: Compacto 24 Regiões / 168 hexes, Padrão 30 / 210, Amplo 43 / 301 (1 Região = 7 hexes). Recomendado: 2 jogadores Compacto, 3–4 Padrão, 5–6 Amplo. Escolha manual: Compacto só 2–4; Padrão e Amplo 2–6 (`MAP_FOOTPRINT`, `mapSizeAllows`). O cache de homelands (`tiesCache`) passou a incluir a geometria do footprint na chave, e a busca maximin ganhou poda (Amplo com 6 jogadores caiu de ~8,5 s para ~0,5 s). 13 novos templates de fronteira (37 no total; 43 templates). O mapa Padrão com a mesma semente continua o mesmo desenho (o embaralhamento de 24 templates foi preservado).
- **Presets são transformações puras por hex** (`alpha-presets.ts`), reaplicadas a cada rotação de uma Região oculta, então girar nunca desfaz nem vaza o formato do mundo. O hex com o depósito de metal nunca é escavado, e as Pátrias ativas nunca são tocadas. **Não há mais corredor terrestre artificial.**
  - **Misto**: os templates como são (baías e lagos, uma massa de terra).
  - **Continental**: uma grande massa de terra dentro de uma borda oceânica real (o aro do tabuleiro é mar; o mar interno vira terra; Costa só junto ao oceano).
  - **Arquipélago**: as Regiões se agrupam em ilhas (cada Pátria semeia uma) e um estreito de 1 hex é escavado entre ilhas vizinhas.
  - **Mar Interior**: o centro do tabuleiro é um corpo de água conectado (≥ 12 hexes em todas as sementes testadas).
- **Garantias** (`auditWorld` + `tests/alpha-world-presets.test.ts`, tamanho × preset × 2/4/6 jogadores × 12 sementes): footprint contíguo sem buracos, 6 homelands distintos, metal a no máximo 2 Regiões de toda Pátria, nenhuma Pátria estruturalmente condenada (sem água alcançável nem terra até outra Pátria), Continental ligado por terra, Mar Interior ≥ 12, presets distintos pela estrutura (maior massa de terra, maior corpo de mar, ilhas).
- **Medição de identidade × terreno** (4 jogadores, 40 sementes, raio 5 da capital): em todos os presets toda Pátria vê costa/mar, colinas/montanhas e planícies (0% sem algum deles); o preset desloca as proporções (costa/mar 14 Misto, 14 Continental, 27 Arquipélago, 21 Mar Interior) sem entregar "o terreno favorito" a ninguém.

## 6. Exploração

> **Substituído no RC2** por *Mover é descobrir* (ver `docs/external-alpha-v1.2-rc2.md`): não existe mais uma Ordem de explorar para partidas novas; `EXPLORE` é somente leitura. O que segue descreve a regra de acesso/orientação, que o RC2 reaproveita como subfluxo do Mover.

- **Quem explora**: só **Pioneiro** (terra) e **Frota / Embarcação Costeira** (mar). Peças militares terrestres, Enviados e peças embarcadas não recebem `EXPLORE` (a validação do servidor recusa; as opções da UI vêm vazias).
- **Entrada terrestre** (`explorationAccess`, usa `rotatedRegionTiles`): terra = PLAINS, FOREST, HILLS, MOUNTAINS, COAST; SEA não é entrada. O conjunto V das orientações com ao menos um hex de entrada em terra: |V| = 1 → aplicada automaticamente (a ordem pode trazer qualquer rotação); |V| ≥ 2 → o jogador escolhe; |V| = 0 → **"Requer acesso naval."** e nenhuma exploração terrestre é oferecida. Orientações que alterariam terreno já observado por alguém são excluídas. Nunca se converte SEA em terra depois da revelação.
- **Entrada naval**: mesma regra com a verdade canônica de água navegável (`isNavigableWater`: COAST ou SEA); o espelho da mensagem é "Requer acesso por terra.".
- **Privacidade da rotação**: as opções devolvem só `rotations` (números) e `block`; o seletor da UI mostra orientações abstratas, sem terreno. Cartografia e Método Experimental seguem como as formas legítimas de informação prévia.
- Dois exploradores da mesma Região na mesma rodada: o segundo recebe `REGION_ALREADY_OPEN` e a Região não muda. Uma Descoberta resolve uma vez.
- **Descobertas** (nomes canônicos): Vestígio (Encontro com escolha pendente), Jazida, Passagem, Ancoradouro, Perigo, Acampamento, Terra comum (NONE). Textos e efeitos em `DISCOVERY_INFO`.

## 7. Porto, Distrito Marítimo e água

`isNavigableWater` / `isCoastalCity` / `harborHex` (`alpha-water.ts`) são a **única** fonte para navios, Porto, Distrito Marítimo, exploração naval e auditoria do mundo. O **Distrito Marítimo inclui o Porto básico** (não se compra à parte); só pode ser construído em cidade com uma aresta compartilhada com água navegável; custa o preço de um distrito e rende +1 Alimento ao Produzir (já codificado em `cityYield`). Estaleiro e Farol continuam opcionais e **ainda sem efeito** (documentado). O recrutamento naval continua usando a regra geométrica `isPort` (comportamento inalterado). O cais é a única construção urbana que se projeta para fora da cidade (a projeção entrega `harbor` apenas com Distrito Marítimo).

## 8. Bots

> RC2: bots pensam MOVE; ver `docs/external-alpha-v1.2-rc2.md` §8.

Escolhem civilização do Core 10 e Figura (pela semente); usam o Poder da Figura só quando o motor diz que ele muda algo (nunca comando recusado); exploram com Pioneiro e, em mundos de água ou sem acesso por terra, constroem uma Embarcação Costeira/Frota e exploram por mar; nunca recebem `EXPLORE` para tropa militar; uma Região marcada "Requer acesso naval." deixa de ser objetivo de caminhada (sem travar). As opções de exploração dos bots vêm do estado real (como as de um humano), porque a cópia redigida esconde o conteúdo das Regiões.

## 9. Convites e acesso

Quem entra por convite **nunca** digita o código de acesso do Alpha (`join` não o exige mais); criar sala o exige apenas se `ALPHA_ACCESS_CODE` estiver definido no servidor (e a UI o lembra no dispositivo). O dispositivo lembra um **nome** (`aoh-alpha-name`, sem conta); abrir `/alpha/join/<código>` entra automaticamente na sala por uma requisição `POST` do cliente (nunca por GET/redirect, para pré-visualizadores de link não entrarem). Limites de taxa agora são por cliente (`X-Forwarded-For`) e por convite, não globais.

## 10. O que ficou para depois

Terreno ARID e Seca por hex; efeitos reais das Heranças (54 PLANNED); Estaleiro/Farol com efeito; assinaturas PLANNED; Figuras de reserva jogáveis; retratos finais; Patronos (sem mecânica); Cleópatra/Nabucodonosor etc. como Figuras; `iskara` como chassi próprio dos Egípcios; version pinning de regras entre versões.

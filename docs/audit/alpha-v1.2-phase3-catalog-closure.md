# Alpha V1.2 · Fase 3 — fechamento do catálogo (especificações, Quartel, Arquivo)

Branch `stabilize/alpha-v1.2-audit`. **Nada aqui está implementado**: são propostas para aprovação. Os seis edifícios continuam `PENDING` e não aparecem como compra até a aprovação. O catálogo vivo é `packages/game-domain/src/alpha-building-catalog.ts` (13 construíveis).

Como ler as especificações: todo edifício novo entra pelo caminho `CATALOG` (já testado nos oito da Fase 2): exige o distrito da família na cidade, um por cidade, o avanço da Teia que carrega a tag `building:X`, e paga o custo pelo `alphaCanAfford`/`alphaPay` com escopo `BUILD`. Custos são os do canon V5.1a, **verificados contra os limites de armazenamento** (nenhum custo passa de um estoque que a civilização possa ter). O efeito é novo código num leitor existente, nunca um subsistema novo.

Calendário em que cada edifício existe (Era do avanço que o abre): Era III começa nas rodadas 7 / 11 / 15 (perfis de 21 / 35 / 49 rodadas); Era IV, nas rodadas 10 / 16 / 22.

## 1. Seis especificações

| | Moinho | Observatório | Tribunal | Arsenal | Estaleiro | Farol |
|---|---|---|---|---|---|---|
| Família / distrito | Agrário | Acadêmico | Administrativo | Militar | Marítimo (cidade com Porto) | Marítimo (cidade com Porto) |
| Custo (canon) | 2 Madeira, 1 Pedra | 3 Pedra, 3 Conhecimento | 3 Pedra, 1 Riqueza, 2 Influência | 2 Pedra, 3 Metal | 4 Madeira, 2 Metal | 3 Pedra, 1 Madeira, 1 Riqueza |
| Avanço da Teia | Rotação de Culturas (IV) | Método Experimental (IV) | Urbanismo (III) | **nenhum hoje**: proposta `building:ARSENAL` em Engenharia (III) | Arquitetura Naval (III) | Navegação Oceânica (IV) |

### 1.1 Moinho — a Fazenda que de fato trabalha rende mais

- **Condições**: distrito Agrário na cidade; Rotação de Culturas; um por cidade.
- **Efeito exato**: ao Produzir na cidade, **+1 Alimento por hex de Fazenda efetivamente trabalhado nesta ativação, no máximo +2**. "Efetivamente trabalhado" é o mesmo recorte que `cityYield` já usa para o rendimento (os primeiros `min(Capacidade, produtores)` hexes de `workedHexIds`, sem o hex-sede e sem hex bloqueado por uma Ameaça). Fazenda ociosa, fora da Capacidade, não conta.
- **Momento**: no cálculo do Produzir (`cityYield`), por isso o cartão do Produzir mostra o ganho antes de confirmar. A nota do cartão diz "Moinho +N".
- **Limite**: um Produzir por ativação já é a regra; cidade em Revolta não produz (retorno antecipado de `cityYield`), então o Moinho também não rende. Sem efeito fora do Produzir (não torna produção automática).
- **Teia**: a Rotação de Culturas já dá +1 por Fazenda (`farmBonus`); o Moinho soma ao bônus, com teto próprio de +2. Não interage com Heranças (nenhuma delas é lida pelo motor).
- **Tamanho**: nas partidas de 35/49 rodadas, cidades N3–N5 produzem 5–9 Alimento por Produzir com 2–3 hexes trabalhados; o Moinho acrescenta de 0 a 2 (cerca de +20% a +35% no melhor caso, 0 sem Fazenda trabalhada). N1–N2 trabalham 1 hex: no máximo +1.
- **Exploits**: contar só o recorte trabalhado impede encher a cidade de Fazendas ociosas; o teto +2 impede que cidades grandes escalem; Alimento já tem o limite de armazenamento (15 base, 30 máximo). Risco real: Alimento em excesso acelera o Crescer (foi o que o Candidato B mediu: fome menor, mas a população sobe sem o resto da economia acompanhar). Por isso a versão conservadora (+1 fixo se houver ao menos uma Fazenda trabalhada) fica como alternativa.
- **Testes**: cidade com 0, 1, 2 e 3 Fazendas trabalhadas rende +0, +1, +2, +2; Fazenda fora da Capacidade não conta; Revolta não rende; N1 rende no máximo +1; o relatório da rodada fecha (razão de livro); a pré-visualização do cartão é igual ao ganho real.

### 1.2 Observatório — saber antes de mandar o Pioneiro

- **Condições**: distrito Acadêmico; Método Experimental; um por cidade.
- **Efeito exato**: `explorationHints` (já implementado) lista dicas (perigo, costa, bioma) de Regiões **fechadas** a até 4 hexes de uma peça própria. Com Observatório, **as Regiões fechadas a até 6 hexes da cidade que o tem** também entram na lista, com os mesmos campos que o jogador já tem direito (cada campo continua exigindo o seu avanço: bioma exige Matemática, perigo e costa exigem Método Experimental). **Não revela Região, não move peça, não entrega o Pioneiro**: Mover para uma Região fechada continua exigindo Pioneiro (ou navegação oceânica no mar).
- **Momento**: ao montar a projeção da mesa (cálculo puro, sem mudança de estado).
- **Limite**: raio 6 a partir de cada Observatório; vários não somam.
- **Teia/Heranças**: a Herança "Observatório Imperial" (Orinth, PLANEJADA, sem leitor) promete "prévia de recurso"; **não é implementada aqui** e não pode ser misturada: o conteúdo (`discovery.kind`) é sorteio privado e só `DANGER`/`CAMP` já são expostos como "perigo". O Observatório não adiciona nenhum campo novo.
- **Exploits**: nenhum de recurso (é informação); o vazamento possível é expor mais do que o dado atual: o teste garante que o conjunto de campos é idêntico ao já existente, só com alcance maior.
- **Valor**: baixo em números, útil em decisão (poupa um Pioneiro de 3 Alimento + 2 Madeira que a Região perigosa mata em 50% dos casos). Alternativa não recomendada: +1 Conhecimento por Produzir (duplicaria o distrito Acadêmico).
- **Testes**: Região a 5 hexes da cidade, sem peça: sem Observatório não aparece, com Observatório aparece; a 7 hexes não aparece; `revealedBy` e `knownHexIds` não mudam; campos sem o avanço correspondente continuam nulos.

### 1.3 Tribunal — estabilidade sem tornar Governar gratuito

- **Condições**: distrito Administrativo; Urbanismo; um por cidade.
- **Efeito exato**: **a segunda ativação da cidade na rodada não custa o −1 de Ânimo** (hoje cobrado em `alpha-urban.ts`, depois da ação, quando `urbanActionsUsed` chega a 2). **Uma vez por rodada por civilização**, na cidade com Tribunal que a usar primeiro. A segunda ativação só existe com Ânimo Estável ou melhor (a faixa Abalada tem 1 ativação), então o Tribunal nunca abre ação a uma cidade em crise.
- **Momento**: ao registrar a ativação (mesmo ponto do −1); o aviso do cartão da segunda ativação diz "Tribunal: sem custo de Ânimo (1 por rodada)".
- **Limite**: 1 por rodada por civilização (`meta`/contador por rodada reiniciado na abertura da rodada, como `urbanActionsUsed`).
- **Por que não torna Governar gratuito**: Governar continua custando 1 Cultura ou 2 Riqueza por nível e uma Ordem. O Tribunal só evita uma perda de Ânimo que existe hoje; vale por rodada, no máximo, o mesmo que 1 nível de Governar (1 Cultura ou 2 Riqueza) **sem gastar a Ordem de Governar**. Esse é o ganho real e é a razão do limite de 1 por rodada.
- **Teia**: Urbanismo já dá +1 Capacidade Administrativa (`rule:admin-capacity-plus-1`); não se soma ao Tribunal. Teocracia + Templo (+1 Ânimo/rodada sem Ordem) soma, e é o par que mais empurra a cidade ao Ânimo 6; o limite de 1/rodada/civilização existe por causa dessa soma.
- **Exploits**: concentrar Ordens numa cidade já era possível com −1 de Ânimo por rodada; o Tribunal remove esse custo para uma cidade. Como o total de Ordens é 5, não cria Ordens. Alternativa mais fraca, se o teste de medição mostrar excesso: o Tribunal protege só do −1 de Sobre-extensão.
- **Testes**: 2ª ativação na cidade com Tribunal mantém o Ânimo; 3ª não existe; uma 2ª cidade com Tribunal na mesma rodada paga o −1; na rodada seguinte o direito volta; Governar continua cobrando Cultura/Riqueza; cidade Abalada não ganha 2ª ativação.

### 1.4 Arsenal — equipamento para peças que já têm metal

- **Condições**: distrito Militar; **precisa de um avanço que o abra: proposta `building:ARSENAL` em Engenharia** (hoje nenhum avanço carrega a tag; sem ela o edifício seria inalcançável); um por cidade.
- **Efeito exato**: **−1 Metal** no custo de **Cavalaria e Engenho de Cerco** recrutados na cidade (piso 0). Aplica-se depois de todas as validações de `recruitBlock` (Era, distrito Militar, reserva de unidades, pilha, mobilização) e depois do ajuste de civilização (`kitUnitCost`: o Cerco de Elyra custa +1 Metal, o Arsenal desconta 1 sobre o resultado). A pré-visualização e a cobrança usam a mesma função de custo.
- **Momento**: ao Recrutar. Limite: por peça recrutada; o limite de recrutamento por ativação (até 6 com distrito Militar) não muda.
- **O que o Arsenal não faz**: não é requisito de nenhuma unidade, não dá Grau, não muda Era nem distrito, não dá peça grátis.
- **Achado de auditoria (não é do Arsenal)**: as tags `unit:CAVALRY`, `unit:SIEGE` etc. da Teia **não são lidas** no recrutamento: `recruitBlock` valida só Era, distrito Militar e porto. Ou seja, o avanço que "abre" Cavalaria ou Cerco hoje não é exigido. O Arsenal foi escrito para funcionar igual se essa exigência for aplicada depois. Precisa de decisão separada (D-UNIT).
- **Tamanho**: Metal é o recurso mais escasso (uma Mina rende 1 por Produzir); o Arsenal custa 3 Metal e devolve 1 a 2 por Cavalaria/Cerco, então se paga na 2ª ou 3ª peça. Gastar Riqueza no lugar do Metal também funciona (50% da falta, regra existente).
- **Exploits**: Cavalaria sem Metal não sai de graça (2 Alimento, 2 Materiais e 1 Riqueza continuam); o teto de 24 peças e a manutenção seguem valendo.
- **Testes**: Cavalaria e Cerco custam 1 Metal a menos na cidade com Arsenal e o preço exibido é o cobrado; Infantaria, Guarda e Atiradores não mudam; cidade sem Arsenal não muda; Cerco de Elyra desconta sobre o Metal já aumentado; todas as validações de `recruitBlock` continuam recusando (Era, distrito, reserva).

### 1.5 Estaleiro — construir e manter navios no porto

- **Condições**: distrito Marítimo (que já inclui o Porto); Arquitetura Naval; um por cidade.
- **Efeito exato (duas partes pequenas)**:
  1. **Construção**: Frota e Barca de Patrulha recrutadas na cidade custam **1 Riqueza a menos** (piso 0): Frota 2 → 1 Riqueza, Barca 1 → 0.
  2. **Manutenção**: **até 2 navios** parados na cidade ou na água adjacente a ela **não pagam a Riqueza de manutenção** (hoje 1 Riqueza por navio, `militaryUpkeep`).
- **Momento**: (1) ao Recrutar; (2) na manutenção da rodada, pela mesma função usada pela previsão e pela projeção.
- **Limite**: um Estaleiro por cidade; 2 navios isentos por Estaleiro.
- **O que o Estaleiro não faz**: não cria classe de navio, não repara (não existe vida de navio), não é requisito para recrutar navios, não altera o limite de pilha.
- **Teia/Heranças**: Arquitetura Naval já dá Grau II de Frota e pilha 5; a Herança "Quilha e Remo" (Thalos, sem leitor) promete "Frotas custam −1" e **não pode se somar** sem decisão (D-HERANÇA).
- **Tamanho**: até 2 Riqueza por rodada de manutenção e 1 por navio construído; o custo (4 Madeira + 2 Metal) se paga em 3 a 4 rodadas com 2 navios ancorados.
- **Testes**: custo exibido = cobrado; sem Estaleiro nada muda; terceiro navio paga; navio longe do porto paga; ledger fecha; sem porto o edifício não pode ser construído.

### 1.6 Farol — costa mais segura, sem revelar nada

- **Condições**: distrito Marítimo (Porto); Navegação Oceânica; um por cidade.
- **Efeito exato**:
  1. **Piratas**: a pilhagem de porto (hoje 2 Riqueza, `pillagePort`) rouba **1** Riqueza num porto com Farol.
  2. **Bloqueio**: o porto com Farol só é bloqueado por **duas ou mais embarcações armadas** inimigas em guerra junto a ele (hoje uma basta, `blockadedBy`). O bloqueio por abordagem vencida (`portBlockedUntil`) continua valendo: o Farol não desfaz um resultado de batalha.
- **Momento**: (1) na ativação das Ameaças (ímpares); (2) quando o bloqueio é avaliado (rotas, recrutamento naval).
- **Limite**: por cidade; não soma entre Faróis.
- **O que o Farol não faz**: **não revela Região**, não dá visão (não existe raio de visão no motor), não chama `revealRegion`/descoberta.
- **Teia/Heranças**: a Herança "Rede de Faróis" / "Fogos de Sinal" (PLANEJADA, sem leitor) repete a cláusula "bloqueio exige 2 navios": é **a mesma regra, não soma**. O resto da Herança (visão 2, custo −2) não é implementado.
- **Exploits**: a Riqueza protegida é no máximo 1 por ativação; ninguém fica imune (a pilhagem continua); o limiar de 2 navios não impede o bloqueio por quem investe mais.
- **Testes**: pilhagem rouba 1 com Farol e 2 sem; com Riqueza 0 não rouba negativo; um navio armado não bloqueia, dois bloqueiam; bloqueio por abordagem continua; nenhuma Região muda de estado.

### 1.7 O que muda no código quando aprovado (por edifício)

Cada um: trocar `PENDING` → `CATALOG` + `implemented: true` + `cost` + texto no `ALPHA_BUILDING_CATALOG`; um leitor no motor; `tests/v12-fix-catalog.test.ts` (as linhas que fixam estes seis como `PENDING`) passa a testar o efeito; textos de UI que hoje dizem "sem efeito" (`alpha-guide.tsx:40`, `alpha-compendium.tsx:48`, `DISTRICT_CATALOG`) são trocados. Arsenal também ganha `building:ARSENAL` em Engenharia. Nenhum id some; saves antigos carregam.

## 2. Quartel e Centro cultural

**Continuam indisponíveis**; o catálogo os marca `PENDING` e nenhum lugar da interface oferece compra nem diz "sem efeito mecânico ainda". Dois ajustes desta fase:
- A descrição de Formações de Guarda na Teia dizia "Distrito Militar, **Quartel**, Guarda." Agora diz "Distrito Militar, Guarda." (a tag `building:BARRACKS` e o id ficam: saves e a lista do catálogo seguem iguais). Teste novo: nenhuma descrição de avanço cita um edifício retirado.
- Texto antigo do Compêndio da tela `/play` (legado) ainda cita o Quartel; fica fora do escopo do Alpha e registrado.

**O Quartel retirado quebrou algum recrutamento? Não.** `recruitBlock` (`alpha-military.ts`) valida: cidade própria não ocupada, Era da peça, **distrito Militar** para Guarda, Atiradores, Cavalaria e Cerco, porto para navios, reserva de 24, pilha, recursos e mobilização. Nenhuma leitura de `buildings`. O teste novo trava isso (o arquivo não contém `BARRACKS`). Infantaria, Pioneiro e Enviado não pedem distrito algum. O distrito Militar continua construível (Formações de Guarda) e dá limite de recrutamento 6, bônus de pilha da guarnição e o pré-requisito da Obra "Cidadela da Vigília". O Quartel antigo só tinha o `garrisonCapacity` do núcleo antigo, que a pilha de cidade do Alpha não lê (o RC4 vendia o edifício sem efeito, já documentado na Fase 2). Um Quartel já construído em save antigo continua válido e continua sem efeito.

Possível futuro (não implementar sem aprovar): Quartel = +1 de limite de guarnição lendo o limite de pilha existente.

## 3. Arquivo — plano seguro para a família Acadêmica

### Estado auditado
- A exigência de distrito do Arquivo **vive no snapshot** (`core.config.territory.buildings.ARCHIVE.district = ADMINISTRATIVE`). `buildBlock` e o comando do núcleo leem essa mesma configuração. Mudar o **padrão** (`createDefaultTerritoryRules`) só afeta jogos novos; saves RC4 e anteriores continuam com a exigência que carregam, **sem migração e sem risco**.
- Um Arquivo já construído **nunca é revalidado** contra o distrito: o limite de Conhecimento +5 lê a presença do edifício (`alphaStorageCapacity`), não o distrito. Não existe comando de demolir distrito ou edifício.
- O fixture RC4 (`tests/fixtures/rc4-midgame-state.json`) tem 0 Arquivos e nenhum distrito Acadêmico ou Administrativo: ele prova que o save carrega, não prova a manutenção de um Arquivo; o teste da migração cria o caso.
- O +1 de Capacidade Administrativa do Arquivo no núcleo é sobrescrito por `refreshAlphaAdministration`: no Alpha o único efeito vivo é Conhecimento +5.
- Avanço que abre o Arquivo: Escrita (Era I), o mesmo que abre o distrito Acadêmico. O distrito Administrativo vem de Códigos (Era II), então hoje o Arquivo só aparece depois da Era II; na família Acadêmica ele pode aparecer já na Era I.

### Medição do impacto (experimento descartável, revertido)
Troquei só o padrão `ARCHIVE: ADMINISTRATIVE → ACADEMIC`, recompilei e rodei os 8 arquivos que tocam Arquivo/Teia/bots/snapshots: **3 testes falham, todos por fixarem o comportamento antigo**, nenhum por defeito:
1. `tests/alpha-match.test.ts` (partida determinística): constrói Administrativo e Arquivo em 4 cidades; passaria a precisar do distrito Acadêmico.
2. `tests/compendium-onboarding.test.ts`: assume `buildings.ARCHIVE.district === 'ADMINISTRATIVE'`.
3. `tests/territory-infrastructure.test.ts`: o caso do Arquivo no distrito Administrativo.
O teste de bots (`alpha-bot-playtest`) e o de compatibilidade de snapshot continuam verdes.

### Plano (um commit, quando aprovado)
1. `territory.ts`: padrão do Arquivo passa a `ACADEMIC` (mantém o custo de 2 materiais; custo canon "2 Madeira, 2 Pedra, 1 Conhecimento" é decisão separada). **Sem migração de saves**: jogos antigos continuam com Administrativo.
2. Atualizar os 3 testes acima para a família Acadêmica e **adicionar**: (a) RC4 com Administrativo e sem Acadêmico ainda constrói Arquivo; (b) jogo novo exige Acadêmico e recusa só-Administrativo com a mensagem do motor; (c) cidade com Arquivo construído sob a regra antiga mantém +5 Conhecimento depois de salvar e carregar; (d) o comando do núcleo e o `buildBlock` concordam nos dois casos.
3. Texto: `compendium-modal.tsx` (tela legada), `docs/districts-and-buildings.md`.
4. Bots: nada a mudar (os testes passaram); rodar a bateria de bots uma vez.

### Impactos aceitos e ressalvas
- Uma cidade nova com 1 vaga de distrito precisará escolher Acadêmico (também dá +1 Conhecimento por Produzir) para ter Arquivo; quem hoje depende do Administrativo para Arquivo ganha o acesso mais cedo (Era I).
- Quem tem Administrativo e não Acadêmico perde o acesso ao Arquivo em jogos **novos** (a vaga custa 3 Madeira + 1 Pedra, e o Acadêmico é mais cedo). Sem beco sem saída: o limite de Conhecimento também vem da Academia (edifício do catálogo, também Acadêmico).
- O +1 Capacidade Administrativa do núcleo para o Arquivo é código morto no Alpha: não perde nada.
- Risco de balanço: nenhum (a produção não muda; só onde se constrói).

**Recomendação**: aprovar o plano acima. É pequeno (uma constante e três testes) e não toca saves. Não apliquei porque a sua instrução condiciona a mudança à aprovação do plano.

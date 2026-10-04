# Experience V2.1 — Calm Strategy

Proposta, não implementada. Complementa a [arquitetura V2](02-arquitetura-v2.md); onde divergir, vale este documento.

## Tese

**Calma por padrão. Profunda sob demanda.**
O jogo pode ser complexo; a tela não deve parecer complexa.

Ao olhar a mesa, um jogador novo responde em segundos:
1. **Onde estou** — brasão, rodada e momento.
2. **O que está acontecendo** — o mapa e a presença dos outros.
3. **O que merece atenção** — no máximo um sinal de ATENÇÃO por vez em destaque.
4. **O que posso fazer agora** — uma ação dominante.
5. **Qual a consequência provável** — prévia junto da ação.

"Clean" significa **menos coisas competindo ao mesmo tempo**, não menos jogo. Não vale: esconder o essencial, ícones sem rótulo, menus misteriosos, gestos invisíveis.

## Regras cognitivas

| Regra | Aplicação |
|---|---|
| **Recognition > Recall** | ações legais aparecem com rótulo e custo; o jogador reconhece, não lembra regras |
| **Progressive disclosure** | Relance → Foco → Detalhe (tabela abaixo) |
| **Contextual relevance** | a tela destaca o que importa no momento: recursos, alertas e ações seguem a decisão atual |
| **Consistent placement** | topo = onde/quando/quem; base = o que vou fazer; junto ao objeto = contexto; Livro = consulta |
| **Clear feedback** | toda ação responde em ≤ 200 ms: ficha na Bandeja, traço no mapa, número que muda |
| **Reversibility** | no Planejar, toda reserva tem ✕ e "Voltar a planejar" existe até todos confirmarem |
| **Error prevention > error message** | ação impossível por regra conhecida não aparece; ação possível mas cara aparece com o que falta |
| **Calm default state** | sem problemas, nenhum elemento pisca, nenhum badge, nenhum vermelho |

## Uma decisão dominante

Em cada contexto:
- **1 ação dominante** (único botão preenchido em ouro na tela);
- **até 2–3 alternativas** secundárias (contorno);
- o resto em **"Mais (n)"**, com a contagem visível.

O dominante é escolhido por **regra ou pelo que o jogador iniciou**, nunca por conselho inventado:

| Contexto | Dominante | Alternativas | Em "Mais" |
|---|---|---|---|
| Mesa sem seleção | Confirmar planejamento | — | — |
| Cidade sem ação reservada | Produzir (sem ela a cidade não produz) | Construir, Recrutar | Pesquisar, Investimento, Comércio, Cívica |
| Cidade com ação reservada | Concluído ✓ (desfazer) | — | Detalhe |
| Pilha selecionada | Mover (ou a ordem que o jogador iniciou) | Atacar, Explorar | Fundar, Missão de influência |
| Ataque escolhido | Reservar ataque | trocar postura | Detalhe do cálculo |
| Proposta recebida | Responder (Aceitar/Recusar) | Ver termos | — |
| Relação sem proposta | Propor acordo | Oferta comercial | demais acordos, declarar guerra |
| Nó da Teia disponível | Reservar pesquisa | escolher cidade | Detalhe |
| Resultado | Continuar | Pular para o resumo | controles do replay |
| Folha de Batalha (participante) | Ver no mapa | Detalhe | — |

Nunca mais de **um botão dominante visível na tela inteira**. Se o cartão tem um dominante, o "Confirmar planejamento" da Bandeja fica em contorno até o cartão fechar.

## Recursos contextuais

Os 7 recursos continuam existindo e acessíveis; muda a **hierarquia**.

| Estado | Como aparecem |
|---|---|
| Neutro | Faixa mostra só o **Cofre** (ícone + "7 recursos"); nenhum número compete com o mapa |
| Decisão com custo | os recursos do custo sobem para a Faixa com **saldo → saldo após** (ex.: Madeira 18 → 14) |
| Decisão com ganho | os recursos ganhos sobem com **+n** em verde |
| Recurso crítico | sobe sozinho com sinal ATENÇÃO: armazém cheio (descarte iminente), Alimento insuficiente para a população, Administração acima da capacidade |
| Cofre aberto | os 7 com saldo, teto, produção prevista e descarte |

| Contexto | Em primeiro plano |
|---|---|
| Pesquisar | Conhecimento |
| Construir / Desenvolver | Madeira, Pedra, Metal (+ Riqueza se substituir materiais) |
| Recrutar | recursos do custo da peça (+ Metal quando houver) |
| Diplomacia, tratados, ofertas | Influência, Riqueza |
| Investimento público | Riqueza |
| Produzir | os recursos que a cidade vai gerar |
| Exército, ataque | nenhum (ataque não custa recurso; custa Ação) |

## Alertas

O estado normal é silencioso. Quatro níveis, cada um com forma própria (nunca só cor):

| Nível | Forma | Onde | Exemplos (Alpha) |
|---|---|---|---|
| **Informativo** | texto discreto, sem ícone de alerta | Crônica, cartão do objeto | rota rendeu Riqueza; Pulso do mundo; outro jogador confirmou |
| **Atenção** | anel âmbar no objeto + linha na checagem antes de confirmar | mapa e Bandeja | cidade sem ação urbana; evento mundial sem resposta; proposta recebida; armazém cheio |
| **Ação necessária** | Bandeja troca o dominante para a pendência; Confirmar fica bloqueado com o motivo | Bandeja | escolher ambições (rodada 1); reação em Conflitos quando o jogador é parte |
| **Crítico** | faixa de pergaminho no topo por 6 s + entrada na Crônica | topo | capital atacada; uma civilização declarou Hegemonia; vitória; jogador removido |

Regras: no máximo **1 Crítico** visível; Atenção nunca pisca; nenhum contador vermelho para Informativo; tudo vai para a Crônica.

## Densidade progressiva

| Domínio | RELANCE (sempre que o objeto está na tela) | FOCO (ao selecionar / decidir) | DETALHE (só quando pedido) |
|---|---|---|---|
| **Cidade** | brasão, Nível, anel de "sem ação" | ação urbana (1 + 2 + Mais), crescimento em rodadas, efeito previsto | habitantes por papel, economia por fonte, armazém, guarnição, escada 1–7 |
| **Exército** | escudo com número de peças, cor e símbolo do dono | composição, ordem possível, prévia 20×8 | limite da pilha, suprimento, cálculo completo |
| **Diplomacia** | contorno de fronteira; selo de guerra na fronteira | relação (paz/guerra, acordos ativos), proposta pendente | termos, duração, histórico, regras de cada acordo |
| **Teia** | nós disponíveis agora | efeito, custo, quem pesquisa | pré-requisitos, exclusões, caminho completo |
| **Combate** | placar e vencedor | dados táticos, consequência | linhas do cálculo e origem de cada número |
| **Recursos** | Cofre (nenhum número) | recursos da decisão atual com saldo após | os 7 com teto, produção prevista e descarte |
| **Resultado** | 1 etapa por vez + pergaminho no mapa | resumo da rodada (o que mudou para mim) | livro-razão e Crônica completa |

## Validação mental por perfil

| Perfil | Regra de aceite |
|---|---|
| Jogador novo | identifica a ação dominante em < 5 s em qualquer quadro |
| Jogador experiente | atalhos para tudo; "Mais" lembra a última escolha; nenhum passo extra para ordens repetidas |
| 1366 px | a Faixa não quebra linha; o cartão cabe sem cobrir o objeto |
| Celular | as mesmas regras: 1 dominante, Cofre, presença no topo |
| Daltônico | civilização e alerta reconhecíveis em escala de cinza (símbolo + padrão + forma) |
| Cansado após 90 min | corpo ≥ 14 px, contraste ≥ 7:1 no texto principal, nenhum elemento animado em repouso, nenhuma informação que exija ler mais de 2 linhas para decidir |

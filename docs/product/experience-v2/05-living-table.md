# Experience V2.1 — Living Table (mesa viva)

Proposta, não implementada. Objetivo: **presença humana leve** — sem rede social, sem chat complexo.

## Fatos do Alpha que condicionam o desenho

| Fato | Fonte | Consequência |
|---|---|---|
| Não há presença, conexão nem "última atividade" no servidor | `apps/server/src` (sem heartbeat) | tudo abaixo exige um sinal de presença novo (decisão técnica futura) |
| A mesa tem um anfitrião | `hostGuestId` em `alpha-room.ts` | base possível para regras de pausa e remoção |
| Prazo por fase: 0 (sem prazo), 3, 5, 8 min, 1, 4 ou 8 h | `planningSeconds` | **com prazo**, quem não confirmou é confirmado automaticamente ao vencer (`alpha-service.ts:23`); **sem prazo**, um ausente trava a mesa |
| Só a escolha de ambições bloqueia o READY | `alpha-turn.ts:99` | "Ação necessária" é rara no Planejar |
| "Voltar a planejar" existe até todos confirmarem | `UNREADY` | reversibilidade já garantida |

## 1. Presença dos jogadores

Cada jogador é um **selo de presença** na Faixa de Estado (28 px), sem painel permanente.

| Parte do selo | Significado |
|---|---|
| Emblema da civilização (forma + cor + padrão) | quem |
| Inicial do nome sobre o emblema no foco/hover; nome completo no hover/toque | nome |
| Marca inferior: ✓ (confirmou) · … (planejando) · nada (fora do Planejar) | pronto |
| Ponto de conexão: cheio (presente) · vazado (ausente) · tracejado (desconectado) · girando (reconectando) | conexão |
| Anel do momento: ouro (anfitrião) | papel |

O selo do próprio jogador fica primeiro e um pouco maior. Ordem dos demais = iniciativa da rodada (já existe no motor).

## 2. Inatividade

Nunca começa com modal. Escada de estados:

| Estado | Gatilho conceitual | Selo | Banner | Ações |
|---|---|---|---|---|
| **Atraso leve** | todos os outros confirmaram há ≥ 1 min | "…" pulsa devagar uma vez | — | — |
| **Ausente** | sem atividade há ≥ 3 min (ou 25% do prazo) | ponto vazado | "Beto parece estar ausente · 4 min" | Aguardar · Chamar Beto · Opções |
| **Desconectado** | sessão sem sinal | ponto tracejado | "Beto desconectou · 1 min" | Aguardar · Opções |
| **Reconectando** | sinal voltou, carregando | ponto girando | "Beto está voltando…" (substitui o anterior) | — |
| **Voltou** | sessão ativa | ponto cheio | "Beto voltou à mesa" por 4 s | — |
| **Elegível para remoção** | ausente/desconectado além do limite da UXDEC-003 | ponto vazado + traço | banner ganha "Remover da mesa" dentro de Opções | Aguardar · Opções |
| **Removido** | remoção confirmada | selo sai da Faixa | Crítico: "Beto foi removido da mesa por …" + Crônica | — |

Com prazo por fase ligado, o banner mostra também o que já acontece hoje: "Se o prazo acabar, as decisões de Beto serão confirmadas como estão · 2:10".

Regras: o banner é **uma faixa fina abaixo da Faixa de Estado**, não cobre o mapa, pode ser recolhida (vira um ponto no selo), e só existe um banner de inatividade por vez (se dois estão ausentes: "Beto e Clara parecem ausentes").

## 3. Chamar (toque)

- Botão **"Chamar Beto"** no banner ou no menu do selo.
- Beto, ao estar na partida (aba aberta ou ao voltar), vê: **"Ana chamou você para a mesa."** — uma faixa de pergaminho com o brasão de Ana e o botão do momento ("Voltar ao Planejar").
- Limite: 1 chamada por jogador a cada 2 min por quem chama; o botão mostra "Chamado há 40 s".
- Sem notificações externas nesta fase (e-mail, push): fora de escopo.

## 4. Remoção (decisão aberta)

Ver **UXDEC-003**. Qualquer alternativa tem a mesma proteção contra remoção acidental:
1. só disponível no estado **Elegível**;
2. está dentro de **Opções** (nunca no primeiro nível do banner);
3. tela de confirmação diz **o que acontece com a civilização** (ver UXDEC-004) e quanto tempo Beto está ausente;
4. confirmação por **segurar 2 s** (ou digitar o nome em mobile acessível);
5. **5 s para desfazer** depois de confirmar;
6. sempre registrada na Crônica com autor.

## 5. Reações

Poucas reações, como **selos de mesa** (não emojis), no estilo bronze e pergaminho.

| Selo | Nome | Forma |
|---|---|---|
| ❦ | **Boa jogada** | coroa de louros |
| ✶ | **Surpresa** | estrela de oito pontas |
| ⚔ | **Desafio** | manopla / espadas cruzadas |
| ⚭ | **Acordo** | mãos dadas / dois elos |
| ⚑ | **Celebração** | estandarte |
| ☾ | **Humor** | máscara sorridente |

**Contextuais**: o anel de reações sugere 3 de acordo com o último acontecimento visível:

| Contexto | Sugeridas |
|---|---|
| Batalha (vista por quem reage) | Boa jogada (*Bem lutado*), Desafio, Surpresa |
| Tratado aceito / proposta | Acordo, Boa jogada, Humor |
| Hegemonia declarada / era nova | Celebração, Surpresa, Desafio |
| Neutro | Boa jogada, Humor, Celebração |

Regras UX:
- abrir: tocar no próprio selo (ou `R` + número); o anel abre ao lado do selo e fecha ao escolher;
- exibição: o selo da reação **sai do selo de quem reagiu** e fica 2,5 s ao lado dele; nunca no meio do mapa;
- associação clara: a reação fica colada ao selo do autor, com a cor/padrão dele;
- anti-spam: 1 reação a cada 4 s por jogador; no máximo 3 visíveis na mesa; repetidas viram "×2";
- **Silenciar reações** (para mim) e **silenciar de alguém** no menu do selo;
- nunca bloqueia interação nem foco do teclado;
- mobile: toque longo no próprio selo abre o anel.

Reações não carregam texto livre (sem moderação nesta fase).

## 6. Pausar a mesa

- Pedido: menu da mesa (no brasão) → **"Pedir pausa"**.
- Efeito: faixa fina no topo **"Mesa em pausa · pedida por Ana · 2 min"** com os selos presentes e **Retomar**; o mapa fica levemente dessaturado e só permite consulta (inspecionar, abrir Livro), sem reservar.
- Prazo por fase **congela** durante a pausa (conceito: o relógio do servidor para; hoje não existe).
- Quem pode pausar e retomar: **UXDEC-005**.
- Não existe popup cobrindo o mapa.

## 7. Suspender e continuar depois

| | Pausar | Suspender |
|---|---|---|
| Sessão | continua aberta | é encerrada; a mesa fica guardada |
| Duração | minutos | horas a dias |
| Volta | Retomar | Home → "Mesas em andamento" → Continuar |

**Pontos seguros** (a suspensão só acontece neles; pedir fora deles agenda para o próximo):
1. **Fim do Planejamento** — todos confirmaram; nada foi resolvido ainda.
2. **Fim do Resultado** — replay visto por todos os presentes; o resumo está na Crônica.
3. **Fim da rodada** — o ponto preferido.

Nunca suspender **durante Conflitos** nem **no meio do replay**, onde a compreensão da rodada ficaria partida.
Fluxo: "Guardar a mesa e continuar depois" → mostra o próximo ponto seguro → quem precisa concordar (UXDEC-006) → ao chegar no ponto: "Mesa guardada · rodada 8 · Planejar" com o código da mesa.

## 8. Retomar

**Home · Mesas em andamento**: cartões de campanha, não de sessão.

| Campo | Exemplo |
|---|---|
| Nome + brasões dos assentos | Mesa dos Horizontes |
| Ponto da campanha | Era III · Rodada 8 · Planejar |
| Última sessão | ontem, 21:40 |
| Estado | Pausada · Guardada · Aguardando Clara · Anfitriã ausente · Todos presentes |
| Sua situação | "Você ainda não confirmou" / "Sua vez de responder a uma proposta" |
| Ação | **Continuar** |

**Retorno à partida**: ao entrar, um cartão "Bem-vinda de volta" ancorado ao topo com 3 linhas (onde a campanha está, o que mudou para você desde a última sessão, o que está pendente) e **Voltar à mesa**; a Crônica completa fica a um toque. O mapa já aparece por baixo.

## UXDECs

| ID | Pergunta | Alternativas | Recomendação |
|---|---|---|---|
| **UXDEC-001** | O que a presença mostra aos outros | A) só pronto/não pronto · B) pronto + conexão · C) pronto + conexão + "planejando agora" | **B**: C revela ritmo de planejamento (informação estratégica) |
| **UXDEC-002** | Limiares de inatividade | A) fixos (1/3 min) · B) proporcionais ao prazo · C) configuráveis na criação | **B** com mínimo de 3 min |
| **UXDEC-003** | Quem remove um jogador | A) só anfitrião · B) votação da maioria dos presentes · C) regra escolhida na criação da mesa | **C** com padrão **B**; anfitrião não pode remover sozinho quem está desconectado há menos de 10 min |
| **UXDEC-004** | O que acontece com a civilização removida | A) sai do jogo (cidades viram povos independentes) · B) fica em "guarda": confirma sempre sem ordens, mantém território · C) o assento fica aberto para outra pessoa | **B** por padrão, **C** opcional — preserva a mesa e não muda regras de vitória |
| **UXDEC-005** | Quem pausa e retoma | A) qualquer jogador pausa, qualquer um retoma · B) qualquer um pausa (limite de 2 por pessoa por sessão), só quem pediu ou o anfitrião retoma · C) só o anfitrião | **B** |
| **UXDEC-006** | Consentimento para suspender | A) anfitrião decide · B) todos os presentes concordam · C) maioria | **A** com aviso a todos e ponto seguro obrigatório |
| **UXDEC-007** | Reações | A) conjunto fixo de 6 · B) 6 + contextuais sugeridas · C) desativadas por padrão | **B**, com silenciar por jogador |
| **UXDEC-008** | Chamar fora do jogo | A) só dentro da partida · B) + aviso do navegador · C) + e-mail/push | **A** nesta fase |

Todas dependem de capacidades de servidor que não existem (presença, pausa, suspensão com ponto seguro, remoção). Nenhuma está implementada.

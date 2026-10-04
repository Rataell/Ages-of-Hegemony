# Experience V2.1 — Auditoria de carga cognitiva dos 9 conceitos V2

Data: 2026-10-03. Base: [`concepts/v2-concepts.html`](concepts/v2-concepts.html) e `AoH-Experience-V2.pdf`. Proposta, não implementada.

**Pergunta aplicada a cada elemento:** *precisa realmente estar na tela AGORA?*

| Classe | Significado |
|---|---|
| **ALWAYS** | visível o tempo todo |
| **CONTEXTUAL** | aparece só quando pertinente ao que o jogador faz ou ao estado da mesa |
| **ON DEMAND** | fica atrás de uma interação (passar o mouse, tocar, abrir) |
| **INTERRUPTIVE** | pode interromper só quando exige decisão |

## Resumo

A V2 acertou a arquitetura (mapa como mesa, contexto ancorado, três momentos), mas **não aplicou a pergunta "agora?" à Faixa de Estado, ao Trilho e aos cartões**. No conceito 1 há **37 elementos ALWAYS** e **15 alvos clicáveis permanentes** num estado em que o jogador ainda não decidiu nada. A V2.1 reduz para **9 ALWAYS** e **5 alvos permanentes**, sem esconder informação: muda a hierarquia e o momento em que ela aparece.

## Conceito 1 — Mesa · Planejar sem seleção

| Elemento | V2 | V2.1 | Motivo |
|---|---|---|---|
| Brasão + nome da civilização | ALWAYS | ALWAYS (compacto) | onde estou |
| Era + governo como texto | ALWAYS | ON DEMAND (no brasão) | não muda dentro da rodada |
| 7 recursos com rótulo e medidor | ALWAYS (21 itens) | **CONTEXTUAL**: 0–3 em destaque; demais em "Cofre" ON DEMAND | competem igualmente o tempo inteiro |
| Administração | ALWAYS | CONTEXTUAL (sobe ao Cofre quando ≥ capacidade) | só importa perto do limite |
| Prestígio | ALWAYS | ON DEMAND (Livro · Eras) e no fim da rodada | não decide o Planejar |
| Rodada X/Y | ALWAYS | ALWAYS (fundido com o momento) | quando estou |
| 3 pílulas de momento | ALWAYS | ALWAYS como **um** rótulo ("Rodada 6 · Planejar") | 3 pílulas para 1 informação |
| Avatares de quem falta | ALWAYS | ALWAYS como **presença** (selo + estado) | a mesa é de pessoas |
| Alerta (evento mundial) | ALWAYS, ouro | CONTEXTUAL nível ATENÇÃO, no objeto e na checagem | não é bloqueante (o motor não exige resposta para confirmar) |
| 6 ícones de Tabuleiros | ALWAYS | **1 botão "Livro"** com os 6 dentro + atalhos | 6 alvos para uma função de consulta |
| Trilho (7 ícones) | ALWAYS | ON DEMAND: botão "Suas peças (8)" e `Tab` | o mapa já mostra cidades e peças |
| Pontos "sem ação" no Trilho | ALWAYS | CONTEXTUAL no próprio mapa (anel na cidade) | atenção no objeto, não numa lista |
| Orçamento de Ações | ALWAYS | ALWAYS | o que posso fazer |
| Vagas de cidade (3 pontos) | ALWAYS | CONTEXTUAL (aparecem ao selecionar cidade ou na checagem) | redundante com o anel no mapa |
| Fichas de ordens | ALWAYS | ALWAYS quando existem (0 = nada) | consequência do que fiz |
| "+ selecione no mapa" | ALWAYS | removido | instrução permanente vira ruído |
| Checagem ("3 cidades sem ação") | ALWAYS | CONTEXTUAL (só ao aproximar de Confirmar ou quando > 0 em fim de prazo) | aviso cedo demais é ruído |
| Confirmar planejamento | ALWAYS, ouro | ALWAYS, **única ação dominante** | próxima decisão |

**Contagem:** V2 = 37 ALWAYS · 15 alvos · 4 acentos dourados competindo (pílula Planejar, alerta, avatar, CTA). V2.1 = 9 ALWAYS · 5 alvos · 1 acento dominante.

## Conceito 2 — Seleção e ataque

| Elemento | V2 | V2.1 |
|---|---|---|
| Cartão ancorado à direita, a ~400 px do alvo | ALWAYS ao selecionar | Cartão **ao lado do alvo** (≤ 60 px), sem cobrir o alvo |
| 4 fatos (alvo, defesa visível, limite, custo) | ALWAYS no cartão | RELANCE: 2 (alvo, custo); FOCO: defesa visível; DETALHE: limite da pilha |
| Postura (3 opções iguais) | ALWAYS | CONTEXTUAL: começa na última usada, troca em um toque |
| Prévia (2 números + 2 linhas + link) | ALWAYS | FOCO: placar 20×8 + 1 linha; DETALHE: cálculo |
| Reservar ataque + Mover | 2 botões | **1 dominante** (Reservar ataque) + "Outras ordens" |
| Recursos da Faixa | 7 iguais | **contextuais**: nenhum recurso é custo de ataque → a Faixa fica quieta |

## Conceito 3 — Lente da Cidade

| Elemento | V2 | V2.1 |
|---|---|---|
| Escada 1–7 | ALWAYS | RELANCE: "Nível 4"; escada em DETALHE |
| 6 papéis de habitantes | ALWAYS | FOCO só se o jogador abrir "Habitantes"; RELANCE: "6 habitantes" |
| Crescimento com explicação | ALWAYS | RELANCE: barra + "≈ 4 rodadas"; explicação em DETALHE |
| **7 botões de ação urbana iguais** | ALWAYS | **1 dominante + 2 alternativas + "Mais (4)"** |
| Texto do efeito de Produzir | ALWAYS | FOCO: efeito da ação escolhida, com os recursos afetados destacados na Faixa |
| Rendimento sobre os hexes | ALWAYS na lente | mantido (está no mapa, não compete) |

Critério do dominante (regra, não conselho): **Produzir** é dominante porque "sem esta escolha a cidade não produz" (consequência real do motor). Se a cidade já reservou ação, o dominante é **Concluído ✓** e as alternativas somem.

## Conceito 4 — Resultado

| Elemento | V2 | V2.1 |
|---|---|---|
| 6 cartões de etapa sempre abertos | ALWAYS | 1 etapa em FOCO + trilha de 6 pontos |
| Pergaminhos sobre o mapa | CONTEXTUAL | mantido, **um por vez**, 3 s |
| Controles ⏮ ⏸ ⏭ + pular | ALWAYS | ON DEMAND (aparecem ao passar o mouse na Crônica); "Pular" fica |
| Etapas sem nada visível para o jogador | mostradas apagadas | **omitidas** |

## Conceito 5 — Folha de Batalha

| Elemento | V2 | V2.1 |
|---|---|---|
| Dois quadros de 5–6 linhas cada | ALWAYS | RELANCE: placar 20×8 + vencedor + consequência em 1 linha; FOCO: dados táticos; DETALHE: linhas do cálculo |
| Folha cobrindo 75% da tela | INTERRUPTIVE para todos | INTERRUPTIVE **só para atacante e defensor**; os demais veem a batida no replay |

## Conceito 6 — Teia

| Elemento | V2 | V2.1 |
|---|---|---|
| 60 nós com o mesmo peso | ALWAYS | RELANCE: só nós **disponíveis agora** com cor; pesquisados como trilha; bloqueados em 15% de opacidade |
| Painel do nó | ALWAYS | FOCO ao escolher um nó |
| Recursos | 7 iguais | Conhecimento em primeiro plano |

## Conceito 7 — Diplomacia

| Elemento | V2 | V2.1 |
|---|---|---|
| **7 botões "Propor" iguais** | ALWAYS | 1 dominante contextual (ex.: responder à proposta pendente) + 2 sugeridos pela situação legal + "Outros acordos" |
| Linha explicando PNA | ALWAYS | DETALHE do acordo |
| Declarar guerra | ALWAYS, vermelho | ON DEMAND em "Outros", com confirmação |
| Recursos | 7 iguais | Influência e Riqueza em primeiro plano |

## Conceito 8 — Eras e Hegemonia

| Elemento | V2 | V2.1 |
|---|---|---|
| 6 caminhos × 3 metas = 18 barras | ALWAYS | RELANCE: caminho mais próximo + 2 próximos; demais recolhidos |
| Linha das eras | ALWAYS | mantida (é o mapa da campanha) |

## Conceito 9 — Celular

| Elemento | V2 | V2.1 |
|---|---|---|
| Faixa com 3 recursos em texto | ALWAYS | selo + "R6 · Planejar" + presença; recursos no Cofre |
| Folha de seleção com 3 posturas | ALWAYS | mesmas regras do desktop: 1 dominante |

## Medidas comparadas (estado neutro e seleção)

| Medida | V2 · C1 | V2.1 · 10A | V2.1 · 10B | V2 · C2 | V2.1 · 11 |
|---|---|---|---|---|---|
| Elementos ALWAYS | 37 | 9 | 7 | 37 + 15 do cartão | 9 + 7 do cartão |
| Alvos clicáveis permanentes | 15 | 5 | 4 | 15 + 6 | 5 + 3 |
| Decisões expostas ao mesmo tempo | 1 + 6 tabuleiros + 7 peças | 1 | 1 | 5 (3 posturas + 2 botões) | 2 (postura + Reservar) |
| CTAs com destaque | 2–4 | 1 | 1 | 2 | 1 |
| Área de mapa livre | ~78% | ~92% | ~96% | ~62% | ~80% |
| Distância mapa → decisão | — | — | — | ~400 px | ≤ 60 px |
| Informação irrelevante ao momento | Prestígio, governo, era, 7 recursos, 6 tabuleiros | nenhuma ALWAYS | nenhuma ALWAYS | 7 recursos, limite da pilha | nenhuma |

Contagens feitas sobre os quadros 1440×900; "alvo" = elemento clicável; áreas estimadas pela soma das superfícies opacas.

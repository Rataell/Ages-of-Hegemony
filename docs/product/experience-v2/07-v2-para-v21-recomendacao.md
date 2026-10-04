# Experience V2.1 — Comparação V2 → V2.1, validação e recomendação

Proposta, não implementada. Conceitos em [`concepts/v21-concepts.html`](concepts/v21-concepts.html) (`?f=` `10a`, `10b`, `11`–`20`, `cansa`).

## O que muda de V2 para V2.1

| Tema | V2 | V2.1 |
|---|---|---|
| Faixa de Estado | 56 px, 25 elementos (7 recursos, 3 pílulas, 6 tabuleiros…) | 48 px, 6 elementos: brasão (menu), "Rodada · momento", Cofre, Livro, presença |
| Recursos | 7 iguais e sempre visíveis | **Cofre** contextual: só os recursos da decisão (saldo → depois) e os críticos |
| Tabuleiros | 6 ícones | **Livro** (1 botão + atalhos) |
| Trilho | coluna permanente | "Suas peças" sob demanda + `Tab`; atenção no próprio mapa |
| Alertas | badges e destaque dourado | 4 níveis (Informativo, Atenção, Ação necessária, Crítico); estado normal silencioso |
| Ações | fileiras de 6–7 botões iguais | **1 dominante + 2–3 alternativas + Mais (n)**; um único ouro na tela |
| Cartão | ancorado à direita | ao lado do objeto, Relance/Foco/Detalhe |
| Pessoas | avatares de "quem falta" | **selos de presença** com pronto, conexão e papel |
| Social | — | reações como selos, chamar, ausência, pausa, suspender, retomar |
| Identidade | cor do dono | emblema + padrão + cor do assento; escala de cinza testada |
| Campanha | sessão | mesas em andamento na Home; retorno com 3 linhas |

## Conceitos novos

| # | Conceito | Ideia central |
|---|---|---|
| 10A | Mesa Clean · faixa compacta | 9 elementos ALWAYS; atenção no objeto |
| 10B | Mesa Clean · sem faixa | quatro ilhas nos cantos; ~96% de mapa |
| 11 | Seleção contextual | cartão junto da cidade; Cofre mostra só o que Produzir muda |
| 12 | Jogador ausente | banner fino com Aguardar · Chamar · Opções; escada de estados |
| 13 | Opções de remoção | só no estado Elegível; votação; segurar 2 s; desfazer 5 s |
| 14 | Reações | 6 selos; sugestões por contexto; saem do selo do autor |
| 15 | Pausa | faixa sob a faixa da mesa; mapa dessaturado, só consulta |
| 16 | Suspender | "Guardar a mesa e continuar depois" no próximo ponto seguro |
| 17 | Home | mesas em andamento como campanhas |
| 18 | Retorno | "Bem-vinda de volta": 3 linhas e o mapa por baixo |
| 19 | Identidade | emblemas, padrões de fronteira, teste em cinza e a 12 px |
| 20 | Mobile | ausência, reações e pausa no celular |
| — | Por que esta tela não cansa | V2 × V2.1 com medidas |

## A/B: faixa compacta (10A) × sem faixa (10B)

| Critério | 10A | 10B |
|---|---|---|
| Mapa livre | ~92% | ~96% |
| Aprendizado (jogador novo) | melhor: tudo num lugar, com rótulos | pior: quatro lugares para procurar |
| Consistent placement | forte | médio |
| 1366 px | cabe numa linha | cabe |
| Celular | vira a faixa do celular sem mudança | já é o modelo do celular |
| Sensação de mesa | boa | excelente |

**Recomendação:** **10A** como padrão; **10B** como "modo mesa" (alternância pelo jogador ou automático em telas ≥ 1920 px). Mesma informação, mesmas posições relativas.

## Validação por perfil

✓ = passa · ◐ = passa com ressalva · ✗ = falha

| Conceito | Novo | Experiente | 1366 px | Celular | Daltônico | Cansado 90 min |
|---|---|---|---|---|---|---|
| 10A | ✓ uma ação dourada | ✓ atalhos | ✓ | ✓ | ✓ emblemas | ✓ |
| 10B | ◐ procura Cofre e Livro | ✓ | ✓ | ✓ | ✓ | ✓ |
| 11 | ✓ dominante explicado pela regra | ◐ precisa de atalho para "Mais" | ◐ cartão pode cobrir vizinhos | ✓ folha | ✓ | ✓ |
| 12 | ✓ | ✓ | ✓ | ✓ | ✓ ponto vazado ≠ tracejado | ✓ |
| 13 | ✓ consequências explícitas | ◐ segurar 2 s é lento (intencional) | ✓ | ✓ toque longo | ✓ | ✓ |
| 14 | ✓ rótulos sob os selos | ✓ `R` + número | ✓ | ✓ | ✓ formas distintas | ✓ some em 2,5 s |
| 15 | ✓ | ✓ | ✓ | ✓ | ◐ dessaturar é sinal fraco; rótulo "Pausa" compensa | ✓ |
| 16 | ◐ ponto seguro precisa de uma frase de explicação | ✓ | ✓ | ◐ linha do tempo comprime | ✓ | ✓ |
| 17 | ✓ | ✓ | ✓ | ✓ cartões empilhados (lista, não página de jogo) | ✓ | ✓ |
| 18 | ✓ | ◐ deve permitir "não mostrar de novo nesta mesa" | ✓ | ✓ | ✓ | ✓ |
| 19 | ✓ | ✓ | ✓ | ◐ emblema a 12 px no celular precisa de zoom | ✓ testado em cinza | ✓ |
| 20 | ✓ | ✓ | — | ✓ | ✓ | ✓ |

Ressalvas viram tarefas de desenho, não bloqueios.

## UXDECs novas

| ID | Tema | Recomendação |
|---|---|---|
| UXDEC-001 | o que a presença revela | pronto + conexão |
| UXDEC-002 | limiares de inatividade | proporcionais ao prazo, mínimo 3 min |
| UXDEC-003 | quem remove | regra na criação, padrão votação |
| UXDEC-004 | destino da civilização removida | guarda; assento pode ser assumido |
| UXDEC-005 | quem pausa e retoma | qualquer um pausa (limite); quem pediu ou anfitrião retoma |
| UXDEC-006 | consentimento para suspender | anfitrião, com aviso e ponto seguro |
| UXDEC-007 | reações | 6 selos + sugestões contextuais; silenciar |
| UXDEC-008 | chamar fora do jogo | só dentro da partida nesta fase |
| UXDEC-009 | cor no mapa | cor do assento; cor da civilização no brasão |
| UXDEC-010 | figura do líder | silhueta heráldica |
| UXDEC-011 | Faixa 10A × 10B | 10A padrão, 10B como modo mesa |

Detalhes: [Living Table](05-living-table.md), [Identidade](06-identidade-civilizacoes.md).

## Recomendação final

1. **Adotar Calm Strategy como regra de aceite da V2**: um ouro por tela; nenhum recurso permanente; atenção no objeto; Relance/Foco/Detalhe em todos os domínios.
2. **Mesa 10A como padrão** e 10B como modo mesa.
3. **Presença e ausência primeiro** dentro da Mesa Viva: são as que resolvem um problema real do Alpha (mesa sem prazo travada por um ausente). Reações em seguida. Pausa e suspensão dependem de capacidades novas de servidor.
4. **Identidade por emblema + padrão + cor do assento** antes de qualquer arte final.
5. **Decidir UXDEC-003, 004 e 006** antes de desenhar telas finais de remoção e suspensão: são regras de convivência, não só interface.
6. **Validar em playtest** com as medidas da [auditoria](03-auditoria-carga-cognitiva.md): elementos ALWAYS, CTAs concorrentes, tempo até a primeira ordem, e legibilidade após 90 min.

Nada disto está implementado. Nenhuma regra de jogo foi alterada.

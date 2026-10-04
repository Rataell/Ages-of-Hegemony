# Experience V2.1 — Sistema de identidade das civilizações

Direção de sistema, não arte final. Proposta, não implementada.

## Regra

**Identidade nunca depende só de cor.** Cada civilização é reconhecível por **forma** (emblema) e **padrão**, em escala de cinza e a 12 px no mapa.

## Camadas de identidade

| Camada | Uso | Tamanho mínimo |
|---|---|---|
| **Emblema** | silhueta geométrica de 1 traço; mapa, selos, peças | 12 px |
| **Brasão expandido** | emblema dentro de escudo com moldura e lema; lobby, seleção, final | 64 px |
| **Cor principal** | preenchimento de selos e fronteiras | — |
| **Cor secundária** | moldura, detalhes, estandarte | — |
| **Padrão** | traço da fronteira e textura do estandarte; acessibilidade | 2 px de traço |
| **Figura representativa** | líder (retrato ou silhueta); seleção, diplomacia | 48 px |
| **Estandarte** | flâmula vertical com emblema; cidade capital, final da partida | 24 px de largura |
| **Assinatura das peças** | escudo das pilhas com o emblema no lugar do símbolo genérico | 16 px |

## Emblemas (direção)

Formas distintas entre si por silhueta, não por detalhe interno. Nomes do Alpha.

| Civilização | Emblema | Ideia |
|---|---|---|
| Aurélia | espiga | cultivo e reservas comuns |
| Valgard | passo entre dois picos | guardas das passagens |
| Merídia | duas ondas | margens distantes |
| Thalos | farol | cartógrafos das costas |
| Saren | anel de conselho (círculo com centro) | acordos entre comunidades |
| Kor | bigorna | transformação material |
| Orinth | estrela-bússola de 4 pontas | métodos e medidas |
| Nymara | folha | paisagem e memória |
| Veyra | encruzilhada (X no círculo) | rotas e confiança |
| Solenne | sol nascente (meio disco com raios) | encontros e instituições |
| Dravik | arcos de aqueduto | obras e abastecimento |
| Elyra | chama de lamparina | saberes itinerantes |

## Cor por assento, padrão por assento

Doze cores de civilização não se distinguem entre si para todos os jogadores. Proposta: **numa mesa (até 6 assentos) cada assento recebe uma combinação garantidamente distinta** de cor e padrão:

| Assento | Cor (fronteira/selo) | Padrão de fronteira |
|---|---|---|
| 1 | ouro `#e0bd78` | contínuo |
| 2 | azul `#7cc0d6` | tracejado longo |
| 3 | rosa `#d090a8` | pontilhado |
| 4 | verde `#a3d09a` | duplo |
| 5 | lilás `#c4a3e0` | traço-ponto |
| 6 | laranja `#e09a6c` | dentado |

O emblema é sempre o da civilização. A cor própria da civilização aparece no **brasão expandido** (lobby, seleção, final); no mapa vale a cor do assento. Decisão: **UXDEC-009**.

## Aplicação

| Lugar | O que aparece |
|---|---|
| Lobby | brasão expandido 64 px por assento + estado |
| Seleção de civilização | brasão expandido 96 px, figura do líder, estandarte, ênfase em recursos reais |
| Mapa · fronteira | traço na cor e no padrão do assento |
| Mapa · cidade | coroa com o emblema; capital com estandarte de 24 px |
| Mapa · exército | escudo com o emblema do dono e número de peças |
| Cidade (lente) | estandarte no cartão; emblema na coroa |
| Diplomacia | brasão 48 px por assento na mesa; selo nos acordos |
| Reação social | a reação sai do selo do autor e herda a moldura dele |
| Ranking / final | estandartes ordenados por Prestígio; brasão expandido do vencedor |

## Testes obrigatórios

1. Escala de cinza: os 6 assentos distintos por emblema e padrão.
2. 12 px: emblema reconhecível sem a cor.
3. Protanopia/deuteranopia/tritanopia: pares de assento distinguíveis pelo padrão.
4. Fundo de terreno: fronteira legível sobre Planície, Floresta, Costa e Mar (contorno escuro de 1 px).

| UXDEC | Pergunta | Alternativas | Recomendação |
|---|---|---|---|
| **UXDEC-009** | Cor no mapa | A) cor da civilização · B) cor do assento · C) a civilização escolhe entre 2 cores | **B** no mapa, cor própria no brasão |
| **UXDEC-010** | Figura do líder | A) retrato ilustrado · B) silhueta heráldica · C) só nome | **B** no Alpha visual; A depende de DEC-011 |

# External Alpha V1.2 · RC4 — cubos de avanço (correção visual da Ressonância)

Patch de **representação**. Não mudou engine, schema nem regras: `registerAdvance`, `marks`, `slots`, `RESONANCE_SOCKETS = 5`, `classifyResonance`, `pickRepercussion`, `mitigatedBy`, `leveragedBy`, escolha pendente, `history` e telemetria são exatamente os do RC3.

## O que estava confundido
O RC2/RC3 usava um único componente (`ResonanceToken`) para três coisas: o marcador permanente do avanço, o domínio e o slot temporário da Ressonância. Resultado: a bandeja parecia cinco medalhões coloridos de categoria (livro azul, ondas verdes…) e a forma da ficha (quadrado/losango/hexágono) misturava a *origem* do avanço com o *tipo de peça*.

## Três peças, três semânticas (`resonance-parts.tsx`)
| Conceito | Componente | Onde |
|---|---|---|
| Marcador **permanente** do avanço | `PlacedCube` (um `AdvanceCube`) | assentado num `aoh-seat` (cavidade) do nó da Teia, Convergência ou Herança |
| Slot **temporário** da Ressonância | `ResonanceEcho` (o mesmo cubo, eco) | cavidade da bandeja de cinco encaixes |
| **Domínio** | `DomainGlyph` / glifo gravado | face de cima do cubo; secundário |
| Reserva | `ReservePile` | pequena pilha de cubos do jogador, sem números, "nunca um limite" |

- O cubo é **do jogador**: o corpo usa a cor do assento (`--seat`, faces clara/escura/sombra por `color-mix`). Todos os cubos de uma pessoa têm a mesma cor, qualquer que seja o domínio. Ana azul → cubos azuis; Beto vermelho → cubos vermelhos.
- O domínio é um glifo gravado na face de cima; dois domínios (Convergência) levam dois glifos menores numa diagonal gravada, nunca duas cores grandes. Funciona em escala de cinza e para daltônicos porque a cor só diz *de quem* é.
- **Todos os avanços têm a mesma família de cubo.** Teia, Convergência e Herança se distinguem pelo nó (nó comum, losango, placa de Herança), não pela peça. A Reserva por domínio com números saiu.
- Nó não pesquisado: cavidade vazia; disponível: borda/realce; pesquisado: cubo assentado à esquerda do nome (o texto nunca é coberto).
- Bandeja: cinco **cavidades** (não botões redondos), número discreto quando vazia, cubo quando cheia; tooltip com o nome do avanço e o domínio.

## Animação (≈ 0,8 s)
O cubo cai no nó (380 ms, ~0,4 s) e um **eco** voa do nó para o próximo encaixe (520 ms, atraso 380 ms); o eco aparece no encaixe aos ~0,86 s. O cubo permanente nunca sai do nó. No quinto, os cinco cubos ficam visíveis ("ciclo completo") enquanto a Repercussão está pendente; só depois de resolver, os cinco ecos temporários saem da bandeja. `prefers-reduced-motion` desliga tudo.

## Marks permanecem
Resolver a Ressonância esvazia `slots` (0/5) e nunca remove cubos da Teia: o e2e confirma 5 cubos permanentes antes e depois da resolução.

## Evidência (1280×720) — `docs/evidence/rc4/resonance/`
A zero avanços · B um cubo · C quatro cubos permanentes · D Ressonância 4/5 (+ detalhes da bandeja e da Teia) · E quinto cubo entrando · F 5/5 + Repercussão · G pós-resolução 0/5 · H os mesmos cinco cubos ainda na Teia · I Ana (azul) e Beto (vermelho) em capturas separadas. "Antes" (RC2/RC3): `docs/evidence/rc2/resonance/`.

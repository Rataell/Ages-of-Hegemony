# Investigação V5.1b — suspeitas de balanço e contato (2026-10-05)

> **CONTACT/PVP METRICS PRE-HOME-MAXIMIN** — contato, 1º combate, frequência de PvP e capturas deste relatório foram medidos com capitais a ~5 hexes (antes da distribuição maximin das Pátrias). Dados mantidos como histórico; NÃO usar para avaliar o mapa atual. Economia sem guerra segue válida como evidência histórica. Próximo dado: playtest humano real.


Nenhuma regra ou número foi alterado: nenhum bug provado contra o cânone. Dados em `TABLES.md`, `variants/`, `scout/`, `GRAUS-SITUACIONAL.md`; scripts `scripts/alpha-investigate-v51b.mjs`, `scripts/alpha-grade-situational.mjs`.
Causa: (1) bug · (2) cânone ambíguo · (3) emergente.

## A. Acampamentos / Bandos — causas 2 e 3
- "98% sem defensor" é fato dos bots: recrutam 1,3–3,3 peças por partida.
- O mesmo hex é atacado 26–52 vezes: o Bando nunca recua nem é substituído.
- Janela jogável quase inexistente: Acampamentos do Pulso nascem no passo 3 e partem no passo 4 do mesmo turno.
- 0 de 27 partidas mataram um Acampamento ainda acampado: recompensa quase inalcançável.
- Origem: I-5/I-20 (Acampamento vira o próprio Bando), que o cânone não diz claramente.
- Defesa estática (3 Infantaria + Paliçada por cidade): Bando vence 85–94%, população cai a 4–5.

## B. Ritmo urbano — causa 3
- Recursos ilimitados: N6 na rodada 23, N7 na 32 (ritmo canônico). Piso = crescimento de população (1 habitante por cidade por rodada).
- Bots competentes: N6 em r28–30 (Alimento, custos, pesquisa). Remover ameaças quase não muda.

## C. Primeiro assalto r7–11 vs sim r5–6 — causa 2
- Caminho de 5 hexes: motor dá assalto na rodada 11. Sem a espera até a Virada e com movimento todo turno seria r5 (suposição da sim).
- Cânone diz "rodada ímpar" e "1 hex por rodada"; a sim move todo turno. Acampamentos iniciais a 4–5 hexes.

## D. Soldados — causa 3
- Segurar Bando Ameaça II exige ~4 Infantaria + Muralha (~35% da população na r10). Cada baixa = habitante perdido.
- Não provado proibitivo para humano.

## E. Graus — causas 3 e 2
- Empate 3v3 de 50–60% é do cânone (57%).
- I-2 (Guarda do atacante) desloca vitória do atacante de 14% para 8%.
- Graus pesam na própria assinatura: Guarda defendendo em Colina 38%→91%; Cavalaria III em Colina 63%→82%.
- Pontos fracos: Infantaria II e Cavalaria II sem efeito de combate visível.

## F. Legado — causa 3
- 1–1,3 vezes por partida; só abre na Era IV e exige distrito. Quando abre é barato e forte (10–25% do Prestígio final). Situacional, não dominado.
- Distorção: Grande Projeto antigo no lugar das Obras de Legado do §11.

## Contato entre jogadores (45 partidas de bots + 6 com `scout`)
| Mesa | Contato | Fronteira | Diplomacia | Guerra | Combate PvP |
|---|---|---|---|---|---|
| 2p bots | nunca | nunca | nunca | nunca | nunca |
| 2p `scout` | r5 | nunca | r8 | r13 | nunca |
| 4p bots | r13–29 | 1/3 | r14–32 | 2/3 | nunca |
| 6p bots | r6–19 | r4–5 | r8–20 | 1/3 | nunca |
- Contato é viável: Explorador deliberado acha o rival em 4–5 rodadas. Fronteira compartilhada natural só em 6p. Combate PvP nunca natural (bots sem exército): lacuna de evidência, verificar primeiro em sessão humana.

## Decisões que precisam do PO
- D-1 Acampamento/Bando: manter; ou Acampamento persiste e envia Bandos; ou novo Acampamento não ativa no turno em que nasce.
- D-2 Guarda do atacante: cancela Impacto sempre (sim canônica) ou só em Manter/Linha III (atual).
- D-3 Grande Projeto do Alpha vs Obras de Legado do §11.
- D-4 Cadência do Bando: "rodada ímpar" ou "1 hex por rodada".

# Ciclo de rodada — v0.3

```text
MAINTENANCE → PLANNING → RESOLUTION → REACTION → END_ROUND
     ↑                                              │
     └──────────────────────────────────────────────┘
```

Somente a próxima fase é aceita. END_ROUND → MAINTENANCE aumenta a rodada e limpa filas, preservando o histórico. MAINTENANCE → PLANNING executa a manutenção, inclusive na rodada 1. Falha de validação/overflow cancela toda a transição, sem gravações parciais.

## Manutenção

```text
produção por trabalhadores
→ especialização → governo → estabilidade inicial
→ somar produção
→ consumo da população inicial
→ falta de alimento (se houver)
→ distribuir excedente novo e resolver crescimento
→ recalcular administração após crescimento
→ penalidade econômica na produção nova não alimentar
→ deltas de estabilidade de governo/falta/excesso, com clamp
→ atualizar administração derivada final
→ anexar eventos e avançar a fase em uma única revisão
```

O pipeline não depende de RNG, relógio ou infraestrutura. Novos habitantes são não alocados. Falta de alimento bloqueia crescimento e penaliza estabilidade, sem matar população. Veja políticas de excedente, arredondamento e caps em [cities-and-population.md](cities-and-population.md).

## Planejamento

Jogadores registram ordens genéricas e executam gestão da própria civilização. A gestão aplica efeitos imediatamente e somente em PLANNING. As antigas ordens EXPLORE, EXPAND, DEVELOP, BUILD, RECRUIT, RESEARCH, MOVE, NEGOTIATE e INFLUENCE continuam envelopes sem resolvedores. A ordem DEVELOP não equivale ao comando DEVELOP_CITY.

RESOLUTION e REACTION continuam pontos de extensão. Ainda não há readiness, prazos, arbitragem ou scheduler automático. Avanço é uma capacidade interna confiável.

Pontos de comando derivam de baseCommandPoints e do governo (Confederação padrão −1, piso zero). Não se inferiu custo de 1 por ordem nem consumo na gestão.

## Demo

`npm run demo` cria um cenário em memória com cidade explícita e reservas de 10 food/20 materials, entra em planejamento, adota Monarquia, atribui dois produtores e executa cinco ciclos com regras padrão: 4 de produção, 2 de consumo, progresso acumulado 10. Cresce para população 3, escolhe AGRARIAN e paga 5 materials para desenvolvimento 2. Serializa/restaura e compara o estado inteiro.

A saída contém somente a projeção do jogador e uma descrição dos passos. A página Next.js usa o mesmo cenário no servidor, para inspeção somente leitura. Nenhuma partida real é acessada.

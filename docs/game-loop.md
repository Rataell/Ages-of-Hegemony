# Ciclo de rodada — v0.4

```text
MAINTENANCE → PLANNING → RESOLUTION → REACTION → END_ROUND → MAINTENANCE
```

Somente a próxima fase é aceita. END_ROUND → MAINTENANCE aumenta rodada e limpa filas. MAINTENANCE → PLANNING executa manutenção, inclusive na rodada 1. Validação ou overflow cancela toda a transição, sem gravações parciais.

## Manutenção

1. Produzir por cidade: população não territorial, terrenos trabalhados, features, melhorias, distritos, edifícios, especialização/sinergia, governo e estabilidade inicial.
2. Somar produção bruta no estoque civilizacional compartilhado.
3. Consumir alimento da população inicial e determinar falta.
4. Distribuir excedente novo por IDs de cidades elegíveis e resolver crescimento com limiar local (incluindo GRANARY).
5. Recalcular administração após crescimento, incluindo território e infraestrutura.
6. Aplicar excesso administrativo somente à produção nova não alimentar.
7. Aplicar deltas de estabilidade por governo, falta e excesso, com clamp 0–100.
8. Recalcular administração final, registrar breakdown e eventos e avançar fase na mesma revisão.

Produtor territorial não recebe subsistência duplicada. Produtor não associado mantém produção v0.3. O pipeline não usa RNG, relógio ou infraestrutura. Novos habitantes são não alocados; falta bloqueia crescimento e penaliza estabilidade, sem matar população. Governo e estabilidade mantêm divisões inteiras separadas, com arredondamento para baixo. Veja [economia e território](economy-and-territory.md) para a reconciliação exata.

Eventos começam por RESOURCES_PRODUCED e FOOD_CONSUMED, seguidos por falta, crescimento, excesso administrativo e estabilidade quando aplicáveis, terminando em PHASE_ADVANCED. Múltiplos eventos compartilham a revisão; ordem de cidades é parte do snapshot. A distribuição do excedente é ordenada por ID.

## Planejamento

Os seis comandos territoriais e a gestão v0.3 têm efeito imediato somente em PLANNING. Claim exige hex livre; construção é instantânea. Não há disputa simultânea, fila de produção ou unidade Settler. Fundação atualiza administração imediatamente e participa do próximo ciclo econômico.

Envelopes EXPLORE, EXPAND, DEVELOP, BUILD, RECRUIT, RESEARCH, MOVE, NEGOTIATE e INFLUENCE continuam sem resolvedores. BUILD não equivale a BUILD_DISTRICT ou BUILD_BUILDING; EXPAND não equivale a CLAIM_HEX. RESOLUTION e REACTION ainda não executam esses sistemas.

Não há readiness, prazos, arbitragem ou scheduler automático. Avanço é capacidade interna confiável. CAS não resolve iniciativa estratégica. Pontos de comando continuam derivados de configuração/governo, sem inventar consumo na gestão.

## Demo e inspeção

`npm run demo` cria capital e mapa explícito, reclama território, atribui produtores, constrói FARM e executa manutenção. A produção territorial observada é 5 food e 2 materials. Depois constrói AGRARIAN e GRANARY, especializa a capital, desenvolve até nível 3, reclama expansão e funda segunda cidade a distância 2.

Outra manutenção inclui a nova cidade na produção, consumo e administração. Demo serializa v3, restaura estado idêntico e demonstra migração explícita de fixture v2 para v3. Uma comparação de JSON validado faz o processo falhar caso o round-trip altere o estado.

A saída contém projeção própria, mapa filtrado, breakdown e passos. A página Next.js usa esse cenário no servidor, somente para inspeção. `buildDebugInspection` preserva o cenário v0.3 para regressão. Nenhuma partida real é acessada.

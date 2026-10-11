# Lane A1 — conciliação dos dados (84 runs × 75 consolidadas)

Pedido: conciliar os identificadores, registrar as nove não incluídas, classificar execuções incompletas/inválidas, indicar o denominador e preservar as seeds. **Nenhuma simulação foi executada**: só se leu `docs/evidence/v12-audit/lane-a1/runs/*.json`, `runs-world/*.json`, `index.json`, `baseline.json`, `parity.json`.

## 1. Inventário

| Conjunto | Arquivos | Onde | Entra em `summary/tables.md`? |
|---|---|---|---|
| Matriz de políticas (**peace**) | **75** = 5 políticas × 3 perfis (21/35/49) × 5 células de jogadores/seed | `runs/` | **sim** (denominador de todas as tabelas) |
| Política auxiliar `metalculture` ("Cultura e Metal"), **peace** | **9** | `runs/` | **não** |
| Mesmas células, modo **world** (com Ameaças) | **7** | `runs-world/` | não (comparação à parte, §4) |
| **Total de `runs/`** | **84** | | 75 consolidadas + 9 fora |

Células da matriz: `p2-s1`, `p2-s2`, `p4-s1`, `p4-s2`, `p6-s1`. Todas as 75 existem (0 faltando da grade 5×3×5). As seeds são o sufixo do nome (`balanced-35-p4-s1` = seed 1) e estão em `meta.seed`; `meta.stateHash` guarda o hash final, e `parity.json` registra `identical: true` entre o motor intacto e o rastreado (`eca0e20902173539`).

## 2. As nove que não entram (identificadas)
`metalculture-{21,35,49}-p2-s1`, `metalculture-{21,35,49}-p2-s2`, `metalculture-{21,35,49}-p4-s1`.

Motivo: `scripts/alpha-economy-report.mjs` consolida só as políticas de `POLICIES = [growth, research, expansion, military, balanced]` e trata `metalculture` como `extraRuns`. Ela foi criada só para sondar Cultura e Metal (jogadores 2 e 4; sem `p4-s2` nem `p6`), então não completa a grade. `index.json` lista 3 dessas jobs (`metalculture-*-p4-s1`) porque é o lote da última retomada, não o inventário.

**Conclusão:** a diferença 84 − 75 = 9 é inteiramente a política auxiliar. Nenhuma execução da matriz foi perdida.

## 3. Validade de cada conjunto

| Conjunto | n | `status` | `finalRound` = `roundLimit` | `crashes` | Classificação |
|---|---|---|---|---|---|
| balanced / growth / expansion / military / research (peace) | 15 cada | `FINISHED` | sim (21/35/49) | 0 | **válidas** |
| metalculture (peace) | 9 | `FINISHED` | sim | 0 | **válidas, fora do denominador** |
| world | 7 | `FINISHED` | sim | 0 | **válidas, amostra separada** |

Comandos rejeitados: balanced 7 de 17 832; research 2 de 17 552; demais 0. Nenhuma execução incompleta ou inválida foi encontrada. A interrupção por carga de CPU que o usuário fez não deixou arquivos truncados: os processos que estavam em andamento no momento (lote `--resume`) terminaram antes de serem encerrados ou não gravaram arquivo.

## 4. Atenção ao denominador: as tabelas são em modo **peace**

`mode = peace`: **as Ameaças do Mundo (Acampamentos, Bandos, Piratas) são removidas entre as rodadas** (`scripts/lib/alpha-econ-policies.mjs:689`). Isso mede só a economia. Todos os números de Revolta, fome e espiral de `tables.md` (seções F, G, H) valem para **economia sem Ameaças**.

Para saber o efeito das Ameaças sobre os mesmos cenários existem 7 pares (mesma política, perfil, 4 jogadores, seed 1) em `runs-world/`. Resultado (arquivo `summary/peace-vs-world.json`, média dos 7 pares, **n = 7, uma seed, 4 jogadores: indicativo**):

| Métrica | peace | world |
|---|---|---|
| % de assento-rodadas com alguma cidade em Revolta | 3,8% | **25,5%** |
| % com fome ou peças sem manutenção | 4,9% | 11,2% |
| população final por assento | 20,1 | 15,7 |
| nível máximo médio ao fim | 4,1 | 3,8 |

Por par: Revolta `balanced-35` 20% → 36,4%; `expansion-35` 0,7% → 28,6%; `growth-21` 0% → 19%; `growth-35` 5% → 29,3%; `military-35` 0% → 32,1%; `research-21` 1,2% → 9,5%; `research-35` 0% → 23,6%.

Isto concorda com a lane E (assaltos repetidos → Ânimo → Revolta) e obriga a corrigir uma leitura do diagnóstico consolidado: "fome 3–15% e Revolta 1–13%" é o piso sem Ameaças; com Ameaças a Revolta é ≈ 7× maior neste recorte. A separação entre a economia (peace) e o efeito das Ameaças (world − peace) é o que deve guiar o rebalanceamento.

## 5. Como reproduzir
```
node scripts/alpha-economy-policies.mjs --single --policy=balanced --profile=35 --players=4 --seed=1 --out=docs/evidence/v12-audit/lane-a1          # peace (padrão)
node scripts/alpha-economy-policies.mjs --single --policy=balanced --profile=35 --players=4 --seed=1 --world --out=docs/evidence/v12-audit/lane-a1   # world
node scripts/alpha-economy-report.mjs                                                                                                              # regenera summary/
```
Os `runs/` brutos (≈ 35 MB) ficam fora do git por tamanho; o inventário acima e `summary/` bastam para auditar as tabelas.

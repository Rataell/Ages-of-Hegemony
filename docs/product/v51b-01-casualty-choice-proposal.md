# V51B-01 — Escolha de baixas: proposta (não implementada)

Hoje (`chooseLosses`, `alpha-shock.ts`): o motor tira primeiro peças sem força, depois o mais fraco por força, Cerco por último; desempate por id. O dono não escolhe.

## Opções

| | A. Motor escolhe (hoje) | B. Dono escolhe entre baixas válidas | C. Prioridade pré-definida pelo dono |
|---|---|---|---|
| Quando decide | nunca | no meio da resolução, após o choque | no Planejamento, antes do conflito |
| Fluxo simultâneo | intacto | **quebra**: resolução pausa esperando N jogadores; SSE/timeout/AFK | intacto: a prioridade viaja com a Ordem/Exército |
| Determinismo / replay | intacto | comando extra no meio da resolução; replay precisa registrar a escolha | prioridade é estado do plano; replay intacto |
| Agência tática | nenhuma | máxima | média (decide a política, não a peça) |
| Carga de UI | nenhuma | modal por combate, por lado | 1 lista ordenável por Exército; default = regra atual |
| Defensor ausente | n/a | precisa de default de qualquer jeito | usa a prioridade salva; default = regra atual |
| Risco p/ tempo de mesa | nenhum | alto | baixo |

## Recomendação: C

- Mantém "planejamento privado, resolução pública e simultânea"; B pausa a resolução.
- Default = ordem de hoje, então quem ignora o painel joga como antes e nada quebra.
- Escopo mínimo: lista de `kind` (Arqueiros → Infantaria → Guarda → Cavalaria → Cerco como exemplo), editável por Exército/pilha até o conflito. Dentro do mesmo `kind` vale a regra atual (id). Peças sem força (civis) continuam sempre primeiro; a escolha só vale entre peças de combate.
- Contrato: `SET_CASUALTY_PRIORITY {armyId|hexId, order: UnitKind[]}` (livre, sem Ordem); `chooseLosses` recebe a prioridade do dono.
- Impacto de UX a validar antes de implementar: 1 sessão humana com combate real (item 6 do slice) e perguntar se a lista é entendida sem tutorial.

Não implementar antes dessa sessão.

# Evidência da auditoria total (2026-09-21)

Relatório: `../../alpha-full-audit-2026-09-21.md`.

## Como reproduzir

Servidor de auditoria (não interfere no `next dev` da 3001; `AOH_E2E=1` só troca o `distDir`):

```bash
AOH_E2E=1 ALPHA_LOCAL_PORT=3002 npm run dev:alpha
```

Scripts (rodar da raiz do repositório; `AUDIT_URL` padrão `http://127.0.0.1:3002`):

| Script | O que verifica |
|---|---|
| `harness/s1-lobby-security.mjs` | sessões, assentos, lobby, convites, criação, endurecimento HTTP, identidade forjada |
| `harness/s2-match.mjs <jogadores> [seed]` | partida completa por HTTP com bots ruidosos (atomicidade, versão, conflitos) |
| `harness/s3-players-and-reload.mjs` | `alpha:players` (2/3/4/6, inválidos) e recarga/reconexão no navegador |
| `harness/s4-city-territory.mjs` | cidade, território, ordens, opções urbanas (prévia vs servidor), pontos de comando |
| `harness/s5-combat-montecarlo.mjs` | 1 200 batalhas em processo: prévia vs engine |
| `harness/s6-timers.mjs` | prazos com relógio falso |
| `harness/s7-ui-audit.mjs` | viewports, mapa, privacidade do DOM, acessibilidade, desempenho |
| `harness/s8-concurrency.mjs`, `s8b-burst.mjs` | corridas de versão e rajada em PLANEJAMENTO |
| `harness/s9-ui-forms.mjs` | formulários, criação, convites, área de transferência |
| `harness/s10-ratelimit.mjs` | limites anônimo, por sessão e de criar/entrar |
| `harness/s11-hmr.mjs` | Fast Refresh e recompilação, com edições temporárias sempre revertidas por `git checkout` |
| `harness/s12-rush.mjs <seed> [QUICK|STANDARD]` | marcha dirigida entre capitais: alcance de contato |
| `harness/s13-research.mjs` | pesquisa pelo caminho de ação urbana |
| `harness/restart-a.mjs`, `restart-b.mjs` | reiniciar o servidor apaga as partidas |

`results/` guarda a saída (`*.json`, `*.txt`) e os gates finais (`gate-*.txt`); `screens/` guarda as capturas. Os cookies de sessão vivem só na memória dos scripts e nunca são gravados. O harness só usa sessões emitidas pelo próprio servidor (sem identidade forjada).

`results/s2-6p-console-run1-nojson.txt` é a primeira execução 6p (o JSON falhou ao salvar por caminho relativo); `s2-match-6p-seed4.json` é a execução refeita.

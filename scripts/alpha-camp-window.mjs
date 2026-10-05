// D-1 measurement: does the RECÉM-SURGIDO window give players a real chance to destroy an Acampamento before it generates a Bando?
// Bots cannot answer that on their own (they field no army; see docs/evidence/v51b-d1-d3/D1-REPORT.md), so this run INJECTS one documented
// starting condition when asked: `--army=N` gives every seat a garrison of N Infantaria and `--reveal=yes` turns "Mapa revelado" on. Two variants
// play the same seeds: `window` (D-1 as implemented) and `legacy` (every camp is made not-fresh at once, the pre-D-1 behaviour).
// Usage: npm run compile && node scripts/alpha-camp-window.mjs [--players=2,4,6] [--seeds=1,2,3] [--army=0] [--reveal=no] [--out=docs/evidence/v51b-d1-d3/camp-window]
import { mkdirSync, writeFileSync } from 'node:fs';
import { playMatch } from './lib/alpha-bots.mjs';

const arg = (name, fallback) => (process.argv.find(a => a.startsWith(`--${name}=`)) ?? `--${name}=${fallback}`).split('=')[1];
const playerCounts = arg('players', '2,4,6').split(',').map(Number), seeds = arg('seeds', '1,2,3').split(',').map(Number), army = Number(arg('army', 0)), reveal = arg('reveal', 'no') === 'yes', rounds = Number(arg('rounds', 35));
const out = arg('out', 'docs/evidence/v51b-d1-d3/camp-window');
mkdirSync(out, { recursive: true });

function run(variant, players, seed) {
  const seen = new Map(), tally = { spawned: 0, launched: 0, killedCamped: 0, killedFresh: 0, killedAfterWindow: 0, firstKillRound: null, lateSpawned: 0, lateLaunched: 0, lateDelaySum: 0, lateSameRound: 0 };
  const scenario = (box, when) => {
    if (when !== 'round-start') return;
    const st = box.state, round = st.core.round;
    if (round === 1) {
      st.rules.revealMap = reveal;
      for (const owner of st.core.players) for (let i = 0; i < army; i++) st.units.push({ id: `garrison-${owner.id}-${i}`, ownerId: owner.id, kind: 'INFANTRY', hexId: owner.civilization.cities[0].hexId, recruitedRound: 1 });
    }
    if (variant === 'legacy') for (const t of st.threats) t.fresh = false;
    for (const [id, last] of seen) if (!st.threats.some(t => t.id === id) && last.status === 'CAMPED') { tally.killedCamped++; if (last.fresh) tally.killedFresh++; else tally.killedAfterWindow++; tally.firstKillRound ??= round; }
    for (const t of st.threats) { if (t.kind !== 'CAMP') continue; const before = seen.get(t.id); if (!before) { tally.spawned++; if (t.createdRound > 1) tally.lateSpawned++; if (t.createdRound > 1 && t.status === 'MARCHING') { tally.lateLaunched++; tally.lateSameRound++; } } else if (before.status === 'CAMPED' && t.status === 'MARCHING') { tally.launched++; if (t.createdRound > 1) { tally.lateLaunched++; tally.lateDelaySum += round - t.createdRound; } } }
    seen.clear(); for (const t of st.threats) if (t.kind === 'CAMP') seen.set(t.id, { status: t.status, fresh: t.fresh });
  };
  const result = playMatch({ seed, players, rounds, skill: 'competent', scenario });
  return { variant, players, seed, ...tally, rounds: result.state.core.round, crashes: result.ctx.crashes.length, violations: result.ctx.violations.length, kills: result.state.telemetry.threatKills, worldAttacks: result.state.telemetry.threatAttacks };
}
const rows = [];
for (const variant of ['legacy', 'window']) for (const players of playerCounts) for (const seed of seeds) { const row = run(variant, players, seed); rows.push(row); console.log(JSON.stringify(row)); }
const sum = (list, key) => list.reduce((n, r) => n + r[key], 0);
const lines = [`# D-1 · Acampamento RECÉM-SURGIDO — janela de contrajogo (injetado: ${army} Infantaria por assento, Mapa revelado: ${reveal ? 'sim' : 'não'})\n`, '| variante | jogadores | partidas | Acampamentos | lançados em Bando | surgidos depois da abertura | …partiram na mesma rodada em que surgiram | …atraso médio até partir (rodadas) | destruídos acampados | 1ª destruição |', '|---|---|---|---|---|---|---|---|---|---|'];
for (const variant of ['legacy', 'window']) for (const players of playerCounts) {
  const list = rows.filter(r => r.variant === variant && r.players === players), firsts = list.map(r => r.firstKillRound).filter(Boolean);
  lines.push(`| ${variant === 'legacy' ? 'antes (sem janela)' : 'D-1 (janela)'} | ${players}p | ${list.length} | ${sum(list, 'spawned')} | ${sum(list, 'launched') + sum(list, 'lateSameRound')} | ${sum(list, 'lateSpawned')} | ${sum(list, 'lateSameRound')} | ${sum(list, 'lateLaunched') - sum(list, 'lateSameRound') > 0 ? (sum(list, 'lateDelaySum') / (sum(list, 'lateLaunched') - sum(list, 'lateSameRound'))).toFixed(1) : '—'} | ${sum(list, 'killedCamped')} | ${firsts.length ? Math.min(...firsts) : '—'} |`);
}
lines.push('', `Falhas: ${sum(rows, 'crashes')} · violações de invariante: ${sum(rows, 'violations')}.`, '', 'Contagem de Acampamentos inclui os dois de abertura; "lançados" conta Acampamentos que viraram Bando; "antes" = todo Acampamento é tornado não-fresco na hora (comportamento anterior a D-1).');
writeFileSync(`${out}/CAMP-WINDOW.md`, lines.join('\n') + '\n'); writeFileSync(`${out}/camp-window.json`, JSON.stringify(rows, null, 1));
console.log(lines.join('\n'));

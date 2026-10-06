// Player-vs-player combat through the real engine pipeline (V51B-16 slice, item 6). The bots reach war but not battle on their own
// (their economy cannot feed a field army), so each case injects a documented starting condition (units, war, wall), then queues the
// ATTACK through applyAlphaCommand and lets the turn resolver do everything else. Never injects a result.
// Usage: npm run compile && node scripts/alpha-pvp-validate.mjs [--players=2,4,6] [--seeds=3] [--out=docs/evidence/v51b-pioneers]
import { mkdirSync, writeFileSync } from 'node:fs';
import * as E from '../packages/game-engine/dist/index.js';
import { playMatch } from './lib/alpha-bots.mjs';
const arg = (n, f) => (process.argv.find(a => a.startsWith(`--${n}=`)) ?? `--${n}=${f}`).split('=')[1];
const counts = arg('players', '2,4,6').split(',').map(Number), seeds = Number(arg('seeds', 3)), out = arg('out', 'docs/evidence/v51b-pioneers');
mkdirSync(out, { recursive: true });
const R = 6;
const CASES = [
  { name: 'campo: Infantaria+Guarda+Arqueiros vs Infantaria+Guarda (Assalto×Manter)', att: ['INFANTRY', 'INFANTRY', 'GUARD', 'RANGED', 'RANGED'], def: ['INFANTRY', 'INFANTRY', 'GUARD'], posture: 'ASSAULT', defPersona: 'builder', wall: 'NONE' },
  { name: 'manobra: Cavalaria+Arqueiros vs Infantaria (Manobra×Assalto)', att: ['CAVALRY', 'CAVALRY', 'RANGED', 'RANGED'], def: ['INFANTRY', 'INFANTRY', 'INFANTRY'], posture: 'MANEUVER', defPersona: 'warrior', wall: 'NONE' },
  { name: 'cerco: Infantaria+Cerco vs Arqueiros+Guarda atrás de Muralha', att: ['INFANTRY', 'INFANTRY', 'INFANTRY', 'INFANTRY', 'SIEGE', 'SIEGE'], def: ['GUARD', 'RANGED', 'RANGED'], posture: 'ASSAULT', defPersona: 'builder', wall: 'STONE_WALL' },
  { name: 'sem Cerco: Infantaria contra Muralha (Brecha ausente)', att: ['INFANTRY', 'INFANTRY', 'INFANTRY', 'INFANTRY', 'INFANTRY'], def: ['GUARD', 'INFANTRY'], posture: 'ASSAULT', defPersona: 'builder', wall: 'STONE_WALL' },
  { name: 'captura: cidade sem guarnição', att: ['INFANTRY', 'INFANTRY', 'INFANTRY'], def: [], posture: 'ASSAULT', defPersona: 'builder', wall: 'NONE' },
];
const MIL = ['INFANTRY', 'GUARD', 'RANGED', 'CAVALRY', 'SIEGE'];
const rows = [];
for (const players of counts) for (const c of CASES) for (let seed = 1; seed <= seeds; seed++) {
  let injected = null;
  const personas = Array.from({ length: players }, (_, i) => (i === 1 ? c.defPersona : 'builder'));
  const res = playMatch({ seed, players, rounds: R + 1, startingPioneers: 2, personas, skill: 'competent', scenario: (box, h) => {
    if (h !== 'round-start' || box.state.core.round !== R || injected) return;
    const st = box.state, [a, b] = st.core.players;
    st.wars.push([a.id, b.id]);
    st.units = st.units.filter(u => !(MIL.includes(u.kind) && (u.ownerId === a.id || u.ownerId === b.id)));
    const target = b.civilization.cities[0], meta = st.cities.find(m => m.cityId === target.id);
    meta.fortification = { level: c.wall, state: 'INTACT' };
    const centre = st.core.map.find(t => t.id === target.hexId);
    const spot = E.hexNeighbors(centre).map(p => st.core.map.find(t => t.id === E.hexId(p))).filter(t => t && !['SEA', 'MOUNTAINS', 'UNKNOWN'].includes(t.terrain) && !st.units.some(u => u.hexId === t.id))[0];
    if (!spot) return;
    let n = 0;
    for (const kind of c.att) st.units.push({ id: `pv-a-${kind}-${++n}`, ownerId: a.id, kind, hexId: spot.id, recruitedRound: R });
    for (const kind of c.def) st.units.push({ id: `pv-d-${kind}-${++n}`, ownerId: b.id, kind, hexId: target.hexId, recruitedRound: R });
    for (const id of [a.id, b.id]) { const p = st.players.find(x => x.playerId === id); p.knownHexIds = [...new Set([...p.knownHexIds, spot.id, target.hexId])]; E.alphaGain(st, id, { food: 8 }); }
    const order = { id: 'pv-attack', type: 'ATTACK', unitIds: c.att.map((k, i) => `pv-a-${k}-${i + 1}`), target: target.hexId, posture: c.posture };
    const r = E.applyAlphaCommand(st, a.id, { type: 'QUEUE_ORDER', order, expectedVersion: st.version });
    injected = { ok: r.ok, error: r.ok ? null : r.error.message };
    if (r.ok) box.state = r.value;
  } });
  const battle = res.state.battles.find(b => b.round === R) ?? null;
  const row = { players, case: c.name, seed, injected, battle: battle && {
    attackerPosture: battle.attackerPosture, defenderPosture: battle.defenderPosture, delta: battle.delta, outcome: battle.outcome, winner: battle.winnerId,
    attack: battle.attackBreakdown.map(m => `${m.source}${m.amount >= 0 ? '+' : ''}${m.amount}`), defense: battle.defenseBreakdown.map(m => `${m.source}${m.amount >= 0 ? '+' : ''}${m.amount}`),
    losses: battle.losses, retreat: battle.retreat, wall: battle.fortification && `${battle.fortification.before.level}/${battle.fortification.before.state}→${battle.fortification.after.level}/${battle.fortification.after.state}`,
    captured: res.state.telemetry.citiesCaptured, tacticalA: battle.attackerTactical.length, tacticalD: battle.defenderTactical.length } };
  rows.push(row);
  console.log(`${players}p ${c.name.slice(0, 22)} s${seed}: ${row.battle ? `${row.battle.outcome ?? '?'} Δ${row.battle.delta} win ${row.battle.winner} losses ${row.battle.losses.length} retreat ${row.battle.retreat ?? '-'} captured ${row.battle.captured}` : `NO BATTLE ${JSON.stringify(injected)}`}`);
}
writeFileSync(`${out}/pvp-validate.json`, JSON.stringify(rows, null, 1));
const summary = {};
for (const r of rows) { const k = r.case; (summary[k] ??= { n: 0, battles: 0, attackerWins: 0, captured: 0, outcomes: {}, avgLosses: 0 }); const s = summary[k]; s.n++; if (r.battle) { s.battles++; s.attackerWins += r.battle.winner === 'p1' ? 1 : 0; s.captured += r.battle.captured > 0 ? 1 : 0; s.outcomes[r.battle.outcome] = (s.outcomes[r.battle.outcome] ?? 0) + 1; s.avgLosses += r.battle.losses.length; } }
for (const s of Object.values(summary)) s.avgLosses = s.battles ? +(s.avgLosses / s.battles).toFixed(2) : null;
console.log(JSON.stringify(summary, null, 1));
writeFileSync(`${out}/pvp-validate-summary.json`, JSON.stringify(summary, null, 1));

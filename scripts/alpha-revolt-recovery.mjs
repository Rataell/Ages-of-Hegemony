/* global structuredClone */
// Revolta recovery probe (Alpha V1.2, decision A / E-1). Drives the REAL engine: a city in Revolta uses the emergency Governar (EMERGENCY_GOVERN) in the
// URBAN phase, the REAL maintenance of that round runs with the faults listed, and the NEXT round the city plans Produzir.
// Usage: npm run compile && node scripts/alpha-revolt-recovery.mjs        (reads the built packages, changes nothing)
// Threat victories take 1 Ânimo each (alpha-threats.ts:340) in the world's phase; the columns "−1 ameaça"/"−2 ameaças" subtract that from the real result.
import * as E from '../packages/game-engine/dist/index.js';
import * as D from '../packages/game-domain/dist/index.js';
import { botPlan, createBotMatch } from './lib/alpha-bots.mjs';

const seats = n => Array.from({ length: n }, (_, i) => `p${i + 1}`);
function roundTwo(players) {
  const box = createBotMatch({ seed: 1, players, startingPioneers: 2 });
  for (const id of seats(players)) botPlan(box, id);
  for (const id of seats(players)) { const r = E.applyAlphaCommand(box.state, id, { type: 'READY', expectedVersion: box.state.version }); if (!r.ok) throw new Error(r.error.message); box.state = r.value; }
  if (box.state.phase !== 'PLANNING' || box.state.core.round !== 2) throw new Error(`expected PLANNING of round 2, got ${box.state.phase} r${box.state.core.round}`);
  return box.state;
}
const base = roundTwo(2), base3 = roundTwo(3);
const landKind = Object.entries(base.rules.units).find(([, u]) => u.domain === 'LAND' && u.strength > 0)[0];
const band = mood => mood <= 1 ? 'Revolta' : mood <= 3 ? 'Abalada' : mood === 4 ? 'Estável' : 'Próspera';
const send = (state, id, command) => { const r = E.applyAlphaCommand(state, id, { ...command, expectedVersion: state.version }); if (!r.ok) throw new Error(`${command.type}${command.action ? ':' + command.action : ''}: ${r.error.message}`); return r.value; };
const ready = state => { for (const player of state.players) if (!state.players.find(p => p.playerId === player.playerId).ready && state.core.status === 'ACTIVE') state = send(state, player.playerId, { type: 'READY' }); return state; };

const scenarios = [
  { name: 'S0 sem faltas', food: 15, land: 0, pop: 6, over: false },
  { name: 'S1 fome', food: 0, land: 0, pop: 6, over: false },
  { name: 'S2 peças sem manutenção', food: 3, land: 4, pop: 6, over: false },
  { name: 'S3 fome + peças', food: 0, land: 4, pop: 6, over: false },
  { name: 'S4 fome + peças + sobre-extensão', food: 0, land: 4, pop: 6, over: true },
];
const rows = [];
for (const sc of scenarios) {
  let state = structuredClone(sc.over ? base3 : base);
  const p1 = state.players.find(p => p.playerId === 'p1'), meta = state.cities.find(c => c.cityId === 'capital-1');
  const core = state.core.players.find(p => p.id === 'p1'), city = core.civilization.cities[0];
  Object.assign(p1.resources, { food: sc.food, wealth: 0, culture: 0 });           // no Cultura, no Riqueza: normal Governar is out of reach
  meta.mood = 1;
  city.population = sc.pop; city.workers = { producers: 2, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned: sc.pop - 2 }; city.workedHexIds = [];
  state.units = state.units.filter(u => u.ownerId !== 'p1' || u.kind === 'PIONEER');
  for (let i = 0; i < sc.land; i++) state.units.push({ id: `t-land-${i}`, ownerId: 'p1', kind: landKind, hexId: city.hexId, recruitedRound: 1 });
  // Sobre-extensão: p1 holds the two rival capitals (load 1 + 2 + 2 = 5 against capacity 4); the capital in Revolta is the lowest-Ânimo city.
  if (sc.over) for (const rival of ['p2', 'p3']) { E.occupyCity(state, 'p1', state.core.players.find(p => p.id === rival).civilization.cities[0].id); }
  state.roundLedgers = state.roundLedgers.filter(l => !(l.playerId === 'p1' && l.round === state.core.round));
  const valid = D.AlphaStateSchema.safeParse(state); if (!valid.success) throw new Error(`${sc.name}: ${JSON.stringify(valid.error.issues.slice(0, 2))}`);
  const before = { ...p1.resources };
  state = send(state, 'p1', { type: 'URBAN_ACTION', cityId: meta.cityId, action: 'EMERGENCY_GOVERN' });
  state = ready(state);                                                           // round 2 resolves: URBAN phase, then the real maintenance
  const afterMeta = state.cities.find(c => c.cityId === meta.cityId), afterCity = state.core.players.find(p => p.id === 'p1').civilization.cities.find(c => c.id === meta.cityId);
  const moodAfter = afterMeta.mood, popAfter = afterCity.population;
  // Round 3: can the city plan Produzir, and does it feed the civilization?
  let producedFood = null, canProduce = false;
  if (state.core.round === 3 && state.phase === 'PLANNING') {
    const block = E.urbanBlock(state, 'p1', meta.cityId, 'PRODUCE');
    canProduce = block === null;
    if (canProduce) {
      const foodBefore = state.players.find(p => p.playerId === 'p1').resources.food;
      const expected = E.productionOutput(state, 'p1', meta.cityId).output.food;
      state = send(state, 'p1', { type: 'URBAN_ACTION', cityId: meta.cityId, action: 'PRODUCE' });
      state = ready(state);
      const ledger = state.roundReports.filter(r => r.playerId === 'p1').at(-1);
      producedFood = `${expected} (relatório: ${ledger.production.food})`; void foodBefore;
    }
  }
  rows.push({ cenário: sc.name, 'Ânimo após manutenção': `${moodAfter} ${band(moodAfter)}`, '−1 ameaça': band(Math.max(0, moodAfter - 1)), '−2 ameaças': band(Math.max(0, moodAfter - 2)), 'pop': `${sc.pop}→${popAfter}`, 'Produzir na rodada 3': canProduce ? 'sim' : 'não', 'Alimento produzido': producedFood ?? '–', 'marcador do episódio': afterMeta.revoltEmergencyRound, 'recursos (antes→depois do Governar)': before.wealth === 0 && before.culture === 0 ? 'Cultura 0, Riqueza 0 intactas' : 'verificar' });
}
console.table(rows);

// Trajectory: after the emergency, the city does the only sensible thing — Produzir every round it can (Governar normal when it can pay) — for 6 rounds.
const traj = [];
for (const sc of scenarios.slice(1, 4)) {
  let state = structuredClone(base);
  const p1 = state.players.find(p => p.playerId === 'p1'), meta = state.cities.find(c => c.cityId === 'capital-1'), city = state.core.players.find(p => p.id === 'p1').civilization.cities[0];
  Object.assign(p1.resources, { food: sc.food, wealth: 0, culture: 0 }); meta.mood = 1;
  city.population = sc.pop; city.workers = { producers: 2, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned: sc.pop - 2 }; city.workedHexIds = [];
  state.units = state.units.filter(u => u.ownerId !== 'p1' || u.kind === 'PIONEER');
  for (let i = 0; i < sc.land; i++) state.units.push({ id: `t-land-${i}`, ownerId: 'p1', kind: landKind, hexId: city.hexId, recruitedRound: 1 });
  state.roundLedgers = state.roundLedgers.filter(l => !(l.playerId === 'p1' && l.round === state.core.round));
  const line = [];
  for (let round = 2; round <= 7 && state.core.status === 'ACTIVE'; round++) {
    const m = state.cities.find(c => c.cityId === 'capital-1');
    const act = E.urbanBlock(state, 'p1', 'capital-1', 'EMERGENCY_GOVERN') === null ? 'EMERGENCY_GOVERN' : E.urbanBlock(state, 'p1', 'capital-1', 'PRODUCE') === null ? 'PRODUCE' : E.urbanBlock(state, 'p1', 'capital-1', 'PROMOTE_MOOD') === null ? 'PROMOTE_MOOD' : null;
    if (act) state = send(state, 'p1', { type: 'URBAN_ACTION', cityId: 'capital-1', action: act });
    const rn = state.core.round; state = ready(state);
    const a = state.cities.find(c => c.cityId === 'capital-1'), c = state.core.players.find(p => p.id === 'p1').civilization.cities[0];
    line.push(`r${rn} ${act ?? '—'} → Ânimo ${a.mood} pop ${c.population} Alimento ${state.players.find(p => p.playerId === 'p1').resources.food}`); void m;
  }
  traj.push({ cenário: sc.name, trajetória: line.join(' | ') });
}
console.log('\nTrajetória (uma cidade; Produzir sempre que possível):');
for (const t of traj) console.log(`${t.cenário}\n  ${t.trajetória.split(' | ').join('\n  ')}`);

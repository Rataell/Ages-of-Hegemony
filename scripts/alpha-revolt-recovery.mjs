// Revolta recovery probe (Alpha V1.2, decision A). Drives the REAL maintenance: set the city's Ânimo to the value an emergency
// Governar would leave (X), starve/underpay it as listed, close the round with no orders, read Ânimo and population afterwards.
// Usage: node scripts/alpha-revolt-recovery.mjs   (needs built packages; does not modify the engine)
import * as E from '../packages/game-engine/dist/index.js';
import * as D from '../packages/game-domain/dist/index.js';
import { botPlan, createBotMatch } from './lib/alpha-bots.mjs';
// Round 1 is played by the standard bots (ambitions, first plans) so the probe starts at the PLANNING of round 2.
const box = createBotMatch({ seed: 1, players: 2, startingPioneers: 2 });
for (const id of ['p1', 'p2']) botPlan(box, id);
for (const id of ['p1', 'p2']) { const r = E.applyAlphaCommand(box.state, id, { type: 'READY', expectedVersion: box.state.version }); if (!r.ok) throw new Error(r.error.message); box.state = r.value; }
if (box.state.phase !== 'PLANNING' || box.state.core.round !== 2) throw new Error(`esperava PLANNING da rodada 2, veio ${box.state.phase} r${box.state.core.round}`);
const base = box.state;
const landKind = Object.entries(base.rules.units).find(([, u]) => u.domain === 'LAND' && u.strength > 0)[0];
const shipKind = Object.entries(base.rules.units).find(([, u]) => u.domain === 'SEA')?.[0];
const scenarios = [
  { name: 'S0 sem faltas (comida e peças pagas)', food: 15, wealth: 10, land: 2, ships: 0, pop: 6 },
  { name: 'S1 fome (0 Alimento, sem peças)', food: 0, wealth: 10, land: 0, ships: 0, pop: 6 },
  { name: 'S2 só peças sem manutenção (Alimento cobre a cidade, não o exército)', food: 3, wealth: 10, land: 4, ships: 0, pop: 6 },
  { name: 'S3 fome + peças (0 Alimento, 4 peças)', food: 0, wealth: 10, land: 4, ships: 0, pop: 6 },
  { name: 'S4 fome + peças + navio sem Riqueza', food: 0, wealth: 0, land: 4, ships: 1, pop: 6 },
];
const rows = [];
for (const sc of scenarios) for (const X of [2, 3, 4, 5]) {
  let state = structuredClone(base);
  const p1 = state.players.find(p => p.playerId === 'p1'), meta = state.cities.find(c => c.currentOwnerId === 'p1');
  const core = state.core.players.find(p => p.id === 'p1'), city = core.civilization.cities[0];
  Object.assign(p1.resources, { food: sc.food, wealth: sc.wealth });
  meta.mood = X;
  city.population = sc.pop; city.workers = { producers: 1, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned: sc.pop - 1 };
  state.units = state.units.filter(u => u.ownerId !== 'p1' || u.kind === 'PIONEER');
  for (let i = 0; i < sc.land; i++) state.units.push({ id: `t-land-${i}`, ownerId: 'p1', kind: landKind, hexId: city.hexId, recruitedRound: 1 });
  for (let i = 0; i < sc.ships; i++) state.units.push({ id: `t-ship-${i}`, ownerId: 'p1', kind: shipKind, hexId: city.hexId, recruitedRound: 1 });
  state.roundLedgers = state.roundLedgers.filter(l => !(l.playerId === 'p1' && l.round === state.core.round)); // reopen p1's ledger at the edited balance
  const valid = D.AlphaStateSchema.safeParse(state); if (!valid.success) { console.error(sc.name, X, JSON.stringify(valid.error.issues.slice(0, 2))); continue; }
  const pre = { mood: meta.mood, pop: city.population };
  for (const id of ['p1', 'p2']) { const r = E.applyAlphaCommand(state, id, { type: 'READY', expectedVersion: state.version }); if (!r.ok) throw new Error(r.error.message); state = r.value; }
  const after = state.cities.find(c => c.cityId === meta.cityId), cityAfter = state.core.players.find(p => p.id === 'p1').civilization.cities.find(c => c.id === meta.cityId);
  rows.push({ cenario: sc.name, 'Ânimo após Governar': X, 'Ânimo após manutenção': after.mood, banda: after.mood <= 1 ? 'Revolta' : after.mood <= 3 ? 'Abalada' : after.mood === 4 ? 'Estável' : 'Próspera', 'pop antes→depois': `${pre.pop}→${cityAfter.population}`, 'pode Produzir na rodada seguinte': after.mood >= 2 ? 'sim' : 'não' });
}
console.table(rows);

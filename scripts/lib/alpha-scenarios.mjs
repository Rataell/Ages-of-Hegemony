// Targeted scenarios for the edge cases that naive bots rarely reach by themselves. Each one injects a documented starting
// condition through the state (never a result) and lets the bots play the command surface from there. Coverage reached this way
// is reported separately from coverage reached naturally.
import * as E from '../../packages/game-engine/dist/index.js';
import * as D from '../../packages/game-domain/dist/index.js';

/** Tops the stock up to the cap through the ledger (`other`), so the round-report arithmetic still balances. */
const maxOut = (state, id, keys) => { const p = state.players.find(x => x.playerId === id); const cap = E.alphaStorageCapacity(state, id); const gain = {}; for (const k of keys) gain[k] = Math.max(0, cap[k] - p.resources[k]); E.alphaGain(state, id, gain); };

/** Every prerequisite of the given nodes, so the injected research is legal (no skipped chain, no excluded side of an OU choice). */
function closure(ids) { const out = new Set(); const visit = id => { if (out.has(id)) return; const node = D.ADVANCEMENTS.find(a => a.id === id); if (!node) return; for (const pre of node.prerequisites) visit(pre); if (node.prerequisitesAny.length && !node.prerequisitesAny.some(x => out.has(x))) visit(node.prerequisitesAny[0]); out.add(id); }; ids.forEach(visit); return [...out]; }

export const SCENARIOS = [
  {
    name: 'confluence-and-heritage', flags: ['confluence', 'repercussion', 'ouChoice', 'heritage'], players: 2, rounds: 24, personas: ['scholar', 'scholar'],
    note: 'Knowledge refilled to the cap every round: the diversifying scholar researches five different domains in a row, then Heritage and OU choices.',
    hook(box, when) { if (when !== 'round-start') return; const r = box.state.core.round; if (r <= 22) for (const s of box.ctx.seats) maxOut(box.state, s.id, ['knowledge', 'wealth', 'food', 'wood', 'stone', 'metal', 'influence', 'culture']); if (r === 8) for (const p of box.state.players) p.era = 'CIVILIZATION'; if (r === 14) for (const p of box.state.players) p.era = 'EMPIRES'; },
  },
  {
    name: 'overextension-and-devastation', flags: ['devastatedCity'], players: 2, rounds: 14, personas: ['explorer', 'builder'],
    note: 'Administrative base 1 from round 4 and extra Pioneiros so the builder keeps founding cities, and a city is emptied of habitants by mobilizing it below its built level.',
    hook(box, when) { if (when !== 'round-start') return; const r = box.state.core.round; if (r === 4) box.state.rules.balance.administrationBase = 1; if ([4, 6, 8].includes(r)) { const first = box.state.core.players[1].civilization.cities[0]; const mine = box.state.core.players[1]; box.state.units.push({ id: `px-${r}`, ownerId: mine.id, kind: 'COLONIST', hexId: first.hexId, recruitedRound: r }); } if (r === 9) { const o = box.state.core.players[0]; const c = o.civilization.cities[0]; const meta = box.state.cities.find(m => m.cityId === c.id); meta.level = 'CITY'; E.replaceCity(box.state, c.id, { ...c, population: 2, workers: { producers: 1, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned: 1 } }); } },
  },
  {
    name: 'n7-era-vii', flags: ['n7', 'n6'], players: 2, rounds: 34, personas: ['builder', 'trader'], start: 31,
    note: 'Round 30: the capital is a Metrópole with 18 habitants, Saneamento and Metrópoles do Mundo researched, resources full. Elevar to N7 is Era VII only.',
    hook(box, when) { if (when !== 'round-start') return; const st = box.state, r = st.core.round; if (r === 31) { for (const p of st.players) { p.research.push(...closure(['web-sanitation', 'web-world-metropolises', 'web-engineering']).filter(id => !p.research.includes(id) && !(D.ADVANCEMENTS.find(a => a.id === id)?.excludes ?? []).some(x => p.research.includes(x)))); } const o = st.core.players[0]; const c = o.civilization.cities[0]; st.cities.find(m => m.cityId === c.id).level = 'METROPOLIS'; E.replaceCity(st, c.id, { ...c, population: 18, workers: { producers: 9, artisans: 3, merchants: 2, scholars: 3, soldiers: 1, unassigned: 0 } }); } if (r >= 31) for (const s of box.ctx.seats) maxOut(st, s.id, ['wood', 'stone', 'wealth', 'knowledge', 'food']); },
      },
  {
    name: 'hegemony-territorial', flags: ['hegemony'], players: 2, rounds: 34, personas: ['explorer', 'builder'],
    note: 'Test configuration: the territorial path asks for 2 hexes and administrative capacity in the match rules, so the Era VII declaration and the two-round hold run through the real command.',
    hook(box, when) { if (when !== 'round-start') return; const st = box.state; if (st.core.round === 1) st.rules.hegemonyRequirements.TERRITORIAL = [{ metric: 'territory', minimum: 1 }, { metric: 'territory', minimum: 2 }, { metric: 'withinCapacity', minimum: 1 }]; },
  },
  {
    name: 'siege-war', skill: 'naive', flags: ['battle', 'siege', 'noSupply', 'fortification', 'cityCaptured'], players: 2, rounds: 12, personas: ['warrior', 'builder'],
    note: 'Round 7: war is declared, the enemy capital has a stone wall, and the warrior\'s army (4 Infantaria, 2 Cerco) stands next to it, outside its own supply.',
    hook(box, when) { if (when !== 'round-start') return; const st = box.state, r = st.core.round; if (r === 7) { const [a, b] = st.core.players; if (!st.wars.some(w => w.includes(a.id) && w.includes(b.id))) st.wars.push([a.id, b.id]); const target = b.civilization.cities[0]; st.cities.find(m => m.cityId === target.id).fortification = { level: 'STONE_WALL', state: 'INTACT' }; const centre = st.core.map.find(t => t.id === target.hexId); const spot = E.hexNeighbors(centre).map(p => st.core.map.find(t => t.id === E.hexId(p))).filter(t => t && !['SEA', 'MOUNTAINS', 'UNKNOWN'].includes(t.terrain) && !st.units.some(u => u.hexId === t.id))[0]; if (spot) { let n = 0; for (const kind of ['INFANTRY', 'INFANTRY', 'INFANTRY', 'INFANTRY', 'SIEGE', 'SIEGE']) st.units.push({ id: `sc-${kind}-${++n}`, ownerId: a.id, kind, hexId: spot.id, recruitedRound: r }); p0(st, a.id, spot.id); } } },
  },
  {
    name: 'conquest', skill: 'naive', flags: ['cityCaptured', 'battle', 'overextension'], players: 2, rounds: 12, personas: ['warrior', 'builder'],
    note: 'Round 6: war, the enemy capital stands without garrison or walls, and the warrior\'s six Infantaria are next to it: a city taken by an unopposed assault (Δ > 0, no defender left).',
    hook(box, when) { if (when !== 'round-start') return; const st = box.state, r = st.core.round; if (r === 6) { const [a, b] = st.core.players; st.wars.push([a.id, b.id]); st.units = st.units.filter(u => !(u.ownerId === b.id && ['INFANTRY', 'GUARD', 'RANGED', 'CAVALRY', 'SIEGE'].includes(u.kind))); const target = b.civilization.cities[0]; st.cities.find(m => m.cityId === target.id).fortification = { level: 'NONE', state: 'INTACT' }; const centre = st.core.map.find(t => t.id === target.hexId); const spot = E.hexNeighbors(centre).map(p => st.core.map.find(t => t.id === E.hexId(p))).filter(t => t && !['SEA', 'MOUNTAINS', 'UNKNOWN'].includes(t.terrain) && !st.units.some(u => u.hexId === t.id))[0]; if (spot) { for (let n = 1; n <= 6; n++) st.units.push({ id: `cq-${n}`, ownerId: a.id, kind: 'INFANTRY', hexId: spot.id, recruitedRound: r }); p0(st, a.id, spot.id); } } },
  },
  {
    name: 'pirates-and-bands', flags: ['band', 'pirate'], players: 2, rounds: 14, personas: ['trader', 'explorer'],
    note: 'Round 3: a pirate threat is summoned through the event command, and a camp is reinforced; the Era turn activates them.',
    hook(box, when) { if (when !== 'round-start') return; const st = box.state, r = st.core.round; if (r === 3) { E.applyThreatCommand(st, null, { op: 'THREAT', command: 'SPAWN', kind: 'PIRATE' }); E.applyThreatCommand(st, null, { op: 'THREAT', command: 'REINFORCE', kind: 'LAND' }); } },
  },
];
function p0(st, owner, hex) { const p = st.players.find(x => x.playerId === owner); p.knownHexIds = [...new Set([...p.knownHexIds, hex])]; }

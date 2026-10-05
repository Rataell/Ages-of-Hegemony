/* global performance */
// Headless deterministic bot match driver for the Alpha (V5.1b). Plays through applyAlphaCommand only: the same command surface a
// player has. Requires the built packages (`npm run compile`). Used by scripts/alpha-bot-playtest.mjs and tests/alpha-bot-playtest.test.ts.
import * as E from '../../packages/game-engine/dist/index.js';
import * as D from '../../packages/game-domain/dist/index.js';
import { FileSink, PlaytestRecorder } from '../../apps/server/dist/playtest-log.js';

export const PERSONAS = {
  builder: { posture: 'HOLD', settle: 3, army: 2, districts: ['AGRARIAN', 'ADMINISTRATIVE', 'INDUSTRIAL', 'COMMERCIAL', 'CULTURAL', 'ACADEMIC', 'MILITARY'], war: 99, domains: ['LAND_AND_SEA', 'STONE_AND_METAL', 'GOVERNMENT', 'TRADE', 'KNOWLEDGE'], roles: { artisans: 3, merchants: 1, scholars: 1 }, weights: { elevate: 1.25, build: 1.3, recruit: 0.7, research: 0.9, fort: 1.2 }, govs: ['CONFEDERATION', 'MONARCHY'] },
  warrior: { posture: 'ASSAULT', settle: 2, army: 6, districts: ['AGRARIAN', 'MILITARY', 'INDUSTRIAL', 'ADMINISTRATIVE', 'COMMERCIAL'], war: 9, domains: ['STONE_AND_METAL', 'GOVERNMENT', 'LAND_AND_SEA', 'TRADE', 'KNOWLEDGE'], roles: { artisans: 2, merchants: 1, scholars: 1 }, weights: { elevate: 0.9, build: 0.9, recruit: 1.5, research: 0.9, fort: 0.8 }, govs: ['AUTOCRACY', 'MONARCHY'] },
  trader: { posture: 'MANEUVER', settle: 3, army: 2, districts: ['AGRARIAN', 'COMMERCIAL', 'ADMINISTRATIVE', 'ACADEMIC', 'CULTURAL', 'INDUSTRIAL'], war: 99, domains: ['TRADE', 'GOVERNMENT', 'LAND_AND_SEA', 'KNOWLEDGE', 'STONE_AND_METAL'], roles: { artisans: 1, merchants: 3, scholars: 1 }, weights: { elevate: 1.0, build: 1.1, recruit: 0.6, research: 1.0, fort: 0.6 }, govs: ['OLIGARCHY', 'REPUBLIC'] },
  explorer: { posture: 'MANEUVER', settle: 4, army: 2, districts: ['AGRARIAN', 'ADMINISTRATIVE', 'COMMERCIAL', 'INDUSTRIAL', 'CULTURAL'], war: 99, domains: ['LAND_AND_SEA', 'KNOWLEDGE', 'GOVERNMENT', 'TRADE', 'STONE_AND_METAL'], roles: { artisans: 1, merchants: 1, scholars: 2 }, weights: { elevate: 0.9, build: 0.9, recruit: 0.8, research: 1.0, fort: 0.6 }, explore: 1.6, govs: ['CONFEDERATION', 'REPUBLIC'] },
  scholar: { posture: 'HOLD', settle: 2, army: 2, districts: ['AGRARIAN', 'ACADEMIC', 'ADMINISTRATIVE', 'CULTURAL', 'COMMERCIAL'], war: 99, domains: ['KNOWLEDGE', 'GOVERNMENT', 'TRADE', 'LAND_AND_SEA', 'STONE_AND_METAL'], roles: { artisans: 1, merchants: 1, scholars: 3 }, weights: { elevate: 1.0, build: 1.0, recruit: 0.6, research: 1.7, fort: 0.7 }, diversify: true, govs: ['MERITOCRACY', 'REPUBLIC', 'THEOCRACY'] },
  balanced: { posture: 'HOLD', settle: 3, army: 3, districts: ['AGRARIAN', 'COMMERCIAL', 'ADMINISTRATIVE', 'ACADEMIC', 'MILITARY', 'CULTURAL', 'INDUSTRIAL'], war: 14, domains: ['GOVERNMENT', 'LAND_AND_SEA', 'STONE_AND_METAL', 'TRADE', 'KNOWLEDGE'], roles: { artisans: 1, merchants: 1, scholars: 1 }, weights: { elevate: 1.0, build: 1.0, recruit: 1.0, research: 1.0, fort: 1.0 }, govs: ['REPUBLIC', 'MONARCHY', 'THEOCRACY'] },
};
export const PERSONA_ORDER = ['balanced', 'warrior', 'builder', 'trader', 'explorer', 'scholar'];

/** Small seeded generator so bot choices are reproducible. */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const ZERO7 = () => ({ food: 0, wood: 0, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0 });
const ERAS = D.AlphaEraSchema.options;
const dist = (a, b) => E.hexDistance(a, b);

export const SKILLS = ['naive', 'competent', 'hardcore'];
export function createBotMatch({ seed = 1, players = 2, personas, rounds = 35, preset = 'STANDARD', worldPreset = 'MIXED', skill = 'competent', playtestLog = null } = {}) {
  const civs = D.CIVILIZATIONS.map(c => c.id);
  const seats = Array.from({ length: players }, (_, i) => ({ id: `p${i + 1}`, name: `Bot ${i + 1}`, civilization: civs[(i + seed) % civs.length], persona: (personas?.[i] ?? PERSONA_ORDER[(i + seed) % PERSONA_ORDER.length]) }));
  let state = E.createAlphaGame({ gameId: `bots-${seed}-${players}`, seed, preset, worldPreset, players: seats.map(({ id, name, civilization }) => ({ id, name, civilization })) });
  state = E.beginAlphaPlanning(state);
  // Optional local playtest log (same recorder as the dev server): pass playtestLog: <directory>. Reads states only.
  const recorder = playtestLog ? new PlaytestRecorder(new FileSink(playtestLog)) : null;
  recorder?.start(state);
  if (rounds !== state.rules.roundLimit) { /* custom length: keep Eras of 5 rounds, only truncate */ }
  const ctx = { recorder, skill, activations: new Map(), seed, seats, rand: Object.fromEntries(seats.map((s, i) => [s.id, rng(seed * 7919 + i * 104729)])), failed: new Map(), counters: { commands: 0, rejected: 0, byType: {}, rejectedReasons: {} }, orderSeq: 0, maxRound: rounds, timings: [], violations: [], crashes: [], flags: {} };
  return { state, ctx };
}

function send(box, id, command) {
  const { ctx } = box;
  let result;
  try { result = E.applyAlphaCommand(box.state, id, { ...command, expectedVersion: box.state.version }); }
  catch (error) { ctx.crashes.push({ round: box.state.core.round, phase: box.state.phase, actor: id, command, message: String(error?.stack ?? error).slice(0, 600) }); return false; }
  ctx.recorder?.observe(box.state, id, { ...command, expectedVersion: box.state.version }, result);
  ctx.counters.commands++;
  ctx.counters.byType[command.type] = (ctx.counters.byType[command.type] ?? 0) + 1;
  if (!result.ok) { ctx.counters.rejected++; const key = `${command.type}:${result.error.code}`; ctx.counters.rejectedReasons[key] = (ctx.counters.rejectedReasons[key] ?? 0) + 1; ctx.lastError = result.error.message; if (process.env.BOT_TRACE) console.error('REJ', box.state.core.round, id, command.type, command.action ?? command.command?.type ?? command.order?.type ?? '', '=>', result.error.message); return false; }
  if (process.env.BOT_TRACE === 'ok') console.error('OK', box.state.core.round, id, command.type, command.action ?? command.command?.type ?? command.order?.type ?? '', command.unit ?? command.build?.district ?? command.build?.building ?? command.advancementId ?? '');
  box.state = result.value;
  if (command.type === 'URBAN_ACTION' && command.cityId) { const k = `${box.state.core.round}:${command.cityId}`; ctx.activations.set(k, (ctx.activations.get(k) ?? 0) + 1); }
  return true;
}
const me = (state, id) => state.players.find(p => p.playerId === id);
const owner = (state, id) => state.core.players.find(p => p.id === id);
const tileOf = (state, hex) => state.core.map.find(t => t.id === hex);
const nextOrderId = (box, id) => `bot-${id}-${box.state.core.round}-${++box.ctx.orderSeq}`;
const failedKey = (box, id) => { const set = box.ctx.failed.get(`${id}:${box.state.core.round}`) ?? new Set(); box.ctx.failed.set(`${id}:${box.state.core.round}`, set); return set; };

/** What the civilization is short of: the next Elevar of each city and a working floor per resource, minus the stock. */
function deficits(state, id) {
  const stock = me(state, id).resources, target = { food: 9, wood: 8, stone: 6, metal: 2, wealth: 6, knowledge: 6, influence: 4, culture: 0 };
  for (const meta of state.cities.filter(c => c.currentOwnerId === id)) {
    const next = D.nextLevel(meta.level), req = next ? D.elevateRequirement(next) : null;
    if (req) for (const [k, v] of Object.entries(req.cost)) target[k] = Math.max(target[k] ?? 0, Math.min(14, v + 2));
  }
  return Object.fromEntries(Object.entries(target).map(([k, v]) => [k, Math.max(0, v - (stock[k] ?? 0))]));
}

/** Population roles from persona weights: producers carry food, the rest split by weight; soldiers stay as they are. */
function assignPopulation(box, id, persona) {
  const o = owner(box.state, id), state = box.state;
  const enemies = state.wars.filter(pair => pair.includes(id)).length > 0;
  const threatened = (E.threatView(state, id) ?? []).length > 0;
  const armyNow = state.units.filter(u => u.ownerId === id && ['INFANTRY', 'GUARD', 'RANGED', 'CAVALRY', 'SIEGE'].includes(u.kind)).length;
  const comp = box.ctx.skill !== 'naive';
  const wantArmy = (persona.army + (enemies ? 2 : 0) + (threatened ? 1 : 0) + (comp ? 1 : 0)) * o.civilization.cities.length;
  for (const city of o.civilization.cities) {
    const meta = state.cities.find(c => c.cityId === city.id);
    if (!meta || meta.status === 'OCCUPIED') continue;
    const w = city.workers, pop = city.population;
    // Soldados are the pool Recrutar draws from: ask for as many as the army is short, at most one third of the city.
    const soldiers = Math.max(0, Math.min(Math.floor(pop / 3), Math.max(w.soldiers, wantArmy - armyNow > 0 ? Math.min(2, wantArmy - armyNow) : 0)));
    const free = pop - soldiers;
    if (free <= 0) continue;
    const foodRich = me(state, id).resources.food >= 11;
    const producers = Math.max(1, Math.ceil(free * (foodRich ? 0.3 : 0.5))), rest = free - producers;
    const stock = me(state, id).resources;
    const woodShort = stock.wood < 6 || (stock.stone < 3 && stock.wood < 9);
    const miss = box.ctx.skill === 'naive' ? null : deficits(state, id);
    const roles = miss ? { artisans: 0.6 + miss.wood, merchants: 0.6 + miss.wealth, scholars: 0.6 + miss.knowledge } : woodShort ? { artisans: 4, merchants: persona.roles.merchants / 2, scholars: persona.roles.scholars / 2 } : persona.roles;
    const total = roles.artisans + roles.merchants + roles.scholars;
    let artisans = Math.floor(rest * roles.artisans / total), merchants = Math.floor(rest * roles.merchants / total);
    let scholars = Math.floor(rest * roles.scholars / total);
    const leftover = rest - artisans - merchants - scholars;
    if (woodShort) artisans += leftover; else scholars += leftover;
    const next = { producers: Math.min(producers, free), artisans, merchants, scholars, soldiers, unassigned: 0 };
    if (['producers', 'artisans', 'merchants', 'scholars', 'soldiers', 'unassigned'].every(k => next[k] === w[k])) continue;
    send(box, id, { type: 'MANAGE', command: { type: 'ASSIGN_POPULATION', playerId: id, cityId: city.id, workers: next, expectedVersion: box.state.core.version } });
  }
}

const IMPROVEMENT_FOR = tile => tile.improvement ? null : tile.terrain === 'PLAINS' ? 'FARM' : tile.terrain === 'FOREST' ? 'LUMBER_CAMP' : tile.terrain === 'HILLS' ? (tile.features.includes('METAL') ? 'MINE' : 'QUARRY') : tile.terrain === 'COAST' && tile.features.includes('FISH') ? 'FISHERY' : null;
/** Worked hexes are a free action: pick the claimed hexes that fit what the civilization lacks (food when low, materials otherwise). */
function assignWorkedHexes(box, id) {
  const { state } = box, o = owner(state, id), p = me(state, id), rules = state.core.config;
  for (const city of o.civilization.cities) {
    const claimed = state.core.map.filter(t => t.controllerCityId === city.id && t.id !== city.hexId);
    if (!claimed.length) continue;
    const needFood = p.resources.food < 9, needWood = p.resources.wood < 5, miss = box.ctx.skill === 'naive' ? null : deficits(state, id);
    const value = t => { const y = E.tileYieldBreakdown(t, rules).total; const stone = t.terrain === 'HILLS' || t.terrain === 'MOUNTAINS'; if (miss) return y.food * (1 + miss.food * 0.5) + y.materials * (1 + (stone ? miss.stone : miss.wood) * 0.35) + y.wealth * (1 + miss.wealth * 0.3); return (needFood ? y.food * 3 : y.food) + (needWood ? (stone ? y.materials : y.materials * 2) : y.materials * 1.5) + y.wealth; };
    const pick = [...claimed].sort((a, b) => value(b) - value(a) || a.id.localeCompare(b.id)).slice(0, Math.max(1, city.workers.producers)).map(t => t.id).sort();
    if (pick.join() === [...city.workedHexIds].sort().join()) continue;
    send(box, id, { type: 'MANAGE', command: { type: 'ASSIGN_WORKED_HEXES', playerId: id, cityId: city.id, hexIds: pick, expectedVersion: state.core.version } });
  }
}

/** Web advances still missing for the next Elevar of any own city (first missing link of each prerequisite chain). */
function elevateNeeds(state, id) {
  const p = me(state, id), need = new Set();
  const chase = nodeId => { const node = D.ADVANCEMENTS.find(a => a.id === nodeId); if (!node || p.research.includes(nodeId)) return; const missing = node.prerequisites.filter(q => !p.research.includes(q)); if (missing.length) missing.forEach(chase); else need.add(nodeId); };
  for (const meta of state.cities.filter(c => c.currentOwnerId === id)) { const next = D.nextLevel(meta.level), req = next ? D.elevateRequirement(next) : null; if (req) req.advances.forEach(chase); }
  return need;
}

function pickResearch(box, id, persona, options) {
  const p = me(box.state, id);
  const needs = box.ctx.skill === 'naive' ? new Set() : elevateNeeds(box.state, id);
  const slotDomains = new Set(p.resonance.slots.flatMap(s => s.domains));
  const scored = options.filter(o => !o.blocked).map(o => {
    const node = D.ADVANCEMENTS.find(a => a.id === o.advancementId);
    const heritage = !node;
    const domain = node?.domain ?? D.heritageAdvance(o.advancementId)?.domain ?? null;
    let score = 50 - (node ? ERAS.indexOf(node.era) : 3) * 0 + (heritage ? 8 : 0) + (node?.convergence ? 6 : 0);
    const rank = domain ? persona.domains.indexOf(domain) : 2; score += (4 - Math.max(0, rank)) * 5;
    if (persona.diversify && domain && !slotDomains.has(domain)) score += 40;
    if (node?.pair) score += persona.diversify ? 25 : 6;
    score -= Math.min(10, Object.values(o.cost).reduce((a, b) => a + b, 0));
    if (node && ['web-agriculture', 'web-masonry', 'web-exchange', 'web-writing'].includes(node.id)) score += 12;
    if (node && ['web-urbanism', 'web-sanitation', 'web-world-metropolises', 'web-engineering'].includes(node.id)) score += 8;
    if (needs.has(o.advancementId)) score += 45;
    return { o, score: score + box.ctx.rand[id]() * 6 };
  }).sort((a, b) => b.score - a.score);
  return scored.map(s => s.o);
}

/** Every command the bot would consider this moment, scored. The caller tries them best first. */
export function candidates(box, id, persona) {
  const { state, ctx } = box, round = state.core.round, p = me(state, id), o = owner(state, id);
  if (!o.civilization.cities.length) return [];
  const out = [], rand = ctx.rand[id];
  const add = (score, key, command) => out.push({ score: score + rand() * 4, key, command });
  const view = E.urbanOptions(state, id), unitOpts = E.alphaUnitOptions(state, id);
  const eraIndex = ERAS.indexOf(p.era);
  const cities = o.civilization.cities, nCities = cities.length;
  const w = persona.weights;
  const comp = ctx.skill !== 'naive', hard = ctx.skill === 'hardcore';
  const threatsSeen = E.threatView(state, id) ?? [], alerts = E.threatAlerts(state, id) ?? [];
  const myUnits = state.units.filter(u => u.ownerId === id);
  const army = myUnits.filter(u => ['INFANTRY', 'GUARD', 'RANGED', 'CAVALRY', 'SIEGE'].includes(u.kind));
  const enemies = state.wars.filter(pair => pair.includes(id)).map(pair => pair.find(x => x !== id));

  // Government reform (the Influência Order reserved in the last round of the Era).
  if (E.isReformRound(state)) {
    const opts = E.governmentOptions(state, id);
    if (!opts.planned) { const pick = persona.govs.map(g => opts.options.find(x => x.government === g && x.block === null)).find(Boolean) ?? opts.options.find(x => x.block === null && x.government !== o.civilization.government); if (pick) add(97, `gov:${pick.government}`, { type: 'MANAGE', command: { type: 'ADOPT_GOVERNMENT', playerId: id, government: pick.government, expectedVersion: state.core.version } }); }
  }
  // Hegemony in Era VII.
  if (p.era === 'ASCENSION' && !p.hegemony) {
    for (const entry of E.hegemonyProgress(state, id)) if (entry.requirements.every(r => r.met)) add(99, `heg:${entry.path}`, { type: 'DECLARE_HEGEMONY', path: entry.path });
  }
  // Pioneers: found cities.
  const wantCities = persona.settle + (eraIndex >= 3 ? 1 : 0);
  for (const unit of myUnits.filter(u => u.kind === 'COLONIST')) {
    const uo = unitOpts[unit.id];
    if (!uo) continue;
    if (uo.settleBlock === null && nCities < 7) add(96, `settle:${unit.id}`, { type: 'SETTLE', unitId: unit.id, name: `Colônia ${id}-${round}-${nCities + 1}` });
    else if (nCities < wantCities + 1) {
      const sites = Object.keys(uo.moves).map(hex => ({ hex, tile: tileOf(state, hex) })).filter(({ tile }) => tile && ['PLAINS', 'FOREST', 'COAST', 'HILLS'].includes(tile.terrain) && tile.ownerId === null)
        .map(s => ({ ...s, near: Math.min(...state.core.players.flatMap(pl => pl.civilization.cities).map(c => dist(tileOf(state, c.hexId), s.tile))) }))
        .filter(s => s.near >= 3).sort((a, b) => a.near - b.near || a.hex.localeCompare(b.hex));
      const far = Object.keys(uo.moves).map(hex => ({ hex, tile: tileOf(state, hex) })).filter(({ tile }) => tile && tile.ownerId === null && !['SEA', 'MOUNTAINS'].includes(tile.terrain)).map(s => ({ ...s, near: Math.min(...cities.map(c => dist(tileOf(state, c.hexId), s.tile))) })).sort((a, b) => b.near - a.near || a.hex.localeCompare(b.hex));
      const site = sites[0] ?? far[0];
      if (site) add(90, `pioneer:${unit.id}`, { type: 'QUEUE_ORDER', order: { id: nextOrderId(box, id), type: 'MOVE', unitIds: [unit.id], path: uo.moves[site.hex] } });
    }
  }
  // Explorers.
  for (const unit of myUnits.filter(u => u.kind === 'COLONIST')) {
    const uo = unitOpts[unit.id];
    if (!uo) continue;
    if (uo.explore.length) add(58 * (persona.explore ?? 1), `explore:${unit.id}`, { type: 'QUEUE_ORDER', order: { id: nextOrderId(box, id), type: 'EXPLORE', unitId: unit.id, target: uo.explore[0].target, rotation: 0 } });
    else {
      // D-1 measurement: competent players sweep the ring 3–5 hexes from their cities, where a new Acampamento can stand, so a fresh camp can be found and struck inside its window.
      const sweep = comp ? Object.keys(uo.moves).map(hex => ({ hex, tile: tileOf(state, hex) })).filter(s => s.tile && !['SEA', 'MOUNTAINS', 'UNKNOWN'].includes(s.tile.terrain) && s.tile.ownerId === null)
        .map(s => ({ ...s, near: Math.min(...cities.map(c => dist(tileOf(state, c.hexId), s.tile))), seen: ctx.swept?.get(`${id}:${s.hex}`) ?? 0 })).filter(s => s.near >= 3 && s.near <= 5)
        .sort((a, b) => a.seen - b.seen || a.hex.localeCompare(b.hex))[0] : null;
      if (sweep) { (ctx.swept ??= new Map()).set(`${id}:${sweep.hex}`, round); add(46 * (persona.explore ?? 1), `sweep:${unit.id}`, { type: 'QUEUE_ORDER', order: { id: nextOrderId(box, id), type: 'MOVE', unitIds: [unit.id], path: uo.moves[sweep.hex] } }); continue; }
      const frontier = Object.keys(uo.moves).map(hex => ({ hex, tile: tileOf(state, hex) })).filter(s => s.tile).sort((a, b) => dist(tileOf(state, o.civilization.cities[0].hexId), b.tile) - dist(tileOf(state, o.civilization.cities[0].hexId), a.tile) || a.hex.localeCompare(b.hex))[0];
      if (frontier) add(38 * (persona.explore ?? 1), `scout:${unit.id}`, { type: 'QUEUE_ORDER', order: { id: nextOrderId(box, id), type: 'MOVE', unitIds: [unit.id], path: uo.moves[frontier.hex] } });
    }
  }
  // Cities.
  const reformCost = E.governmentOptions(state, id).cost, reserveInfluence = comp && eraIndex >= 1 && (round % state.rules.roundsPerEra === state.rules.roundsPerEra - 1 || E.isReformRound(state));
  cities.forEach((city, index) => {
    const meta = state.cities.find(c => c.cityId === city.id);
    const list = view.cities[city.id] ?? [];
    // One activation per city per round; a second one costs Ânimo, so only Elevar or an urgent Recrutar may take it, and only when the city is calm.
    const used = ctx.activations.get(`${round}:${city.id}`) ?? 0;
    const free = list.filter(opt => !opt.blocked && (used === 0 || (used === 1 && meta.mood >= 4 && ['ELEVATE', 'RECRUIT'].includes(opt.action))) && (used < 2));
    const pick = (action, pred = () => true) => free.filter(opt => opt.action === action && pred(opt));
    const mood = meta.mood, here = army.filter(u => u.hexId === city.hexId && ['INFANTRY', 'GUARD'].includes(u.kind)).length;
    // Saving for Elevar: when only resources are missing, other spending waits.
    const saving = /Recursos/.test(E.elevateBlock(state, id, city.id) ?? '') ? 0.5 : 1;
    const nearThreat = threatsSeen.some(t => dist(tileOf(state, city.hexId), tileOf(state, t.hexId)) <= 6) || alerts.some(a => a.cityId === city.id);
    const needDef = hard ? (index === 0 ? Math.min(4, Math.max(0, eraIndex - 1)) : Math.min(2, (nearThreat ? 1 : 0) + (eraIndex >= 3 ? 1 : 0))) : comp ? Math.min(4, (nearThreat || enemies.length ? 2 : eraIndex >= 1 ? 2 : 1) + (nearThreat && eraIndex >= 2 ? 1 : 0)) : 0;
    const foodLow = p.resources.food < 8 + nCities, miss = comp ? deficits(state, id) : null;
    if (pick('PRODUCE').length) add(comp ? (foodLow ? 112 : 98) - index : (index === 0 ? 86 : 78), `produce:${city.id}`, { type: 'URBAN_ACTION', cityId: city.id, action: 'PRODUCE' });
    if (pick('ELEVATE').length) add((comp ? 140 : 90) * w.elevate, `elevate:${city.id}`, { type: 'URBAN_ACTION', cityId: city.id, action: 'ELEVATE' });
    const governNow = comp ? mood <= 3 : (mood <= 1 || (mood <= 2 && round % 3 === 0));
    if (governNow) if (pick('PROMOTE_MOOD').length) add(comp ? (mood <= 1 ? 100 : mood <= 2 ? 93 : 71) : (mood === 0 ? 95 : 70), `govern:${city.id}`, { type: 'URBAN_ACTION', cityId: city.id, action: 'PROMOTE_MOOD' });
    if (meta.status === 'OCCUPIED') if (pick('CIVIC_ACTION').length) add(80, `integrate:${city.id}`, { type: 'URBAN_ACTION', cityId: city.id, action: 'CIVIC_ACTION' });
    // Districts and buildings by persona priority; competent play puts food, storage and learning first.
    for (const opt of pick('BUILD', x => x.build.kind === 'DISTRICT')) { const rank = persona.districts.indexOf(opt.build.district); if (rank >= 0) add((72 - rank * 4 + (comp && opt.build.district === 'AGRARIAN' ? (foodLow ? 24 : 10) : comp && opt.build.district === 'INDUSTRIAL' ? Math.min(26, miss.stone * 5) : comp && opt.build.district === 'COMMERCIAL' ? Math.min(24, miss.wealth * 4) : comp && opt.build.district === 'ACADEMIC' ? Math.min(20, miss.knowledge * 3) : 0)) * w.build * saving, `district:${city.id}:${opt.build.district}`, { type: 'URBAN_ACTION', cityId: city.id, action: 'BUILD', build: opt.build }); }
    for (const opt of pick('BUILD', x => x.build.kind === 'BUILDING')) {
      const isStorage = ['GRANARY', 'WAREHOUSE', 'TREASURY', 'MARKET', 'LIBRARY', 'WORKSHOP', 'BARRACKS', 'TEMPLE'].includes(opt.build.building);
      const boost = comp ? ({ GRANARY: foodLow ? 26 : 12, MARKET: 10 + Math.min(14, miss.wealth * 3), LIBRARY: 12 + Math.min(12, miss.knowledge * 2), TEMPLE: mood <= 3 ? 14 : 4, WAREHOUSE: 6, WORKSHOP: Math.min(14, miss.wood * 2) }[opt.build.building] ?? 0) : 0;
      add(((isStorage ? 62 : 52) + boost) * w.build * saving, `building:${city.id}:${opt.build.building}`, { type: 'URBAN_ACTION', cityId: city.id, action: 'BUILD', build: opt.build });
    }
    const threatened = nearThreat || enemies.length > 0 || eraIndex >= 1;
    for (const opt of pick('BUILD', x => x.build.kind === 'FORTIFICATION')) add((comp ? (nearThreat || enemies.length ? (hard ? 140 : 92) : eraIndex >= 2 ? (hard ? 120 : 58) : 30) : (threatened ? 74 : eraIndex >= 2 ? 46 : 20)) * w.fort, `fort:${city.id}`, { type: 'URBAN_ACTION', cityId: city.id, action: 'BUILD', build: opt.build });
    // Recruitment: keep the garrison at the persona's size, more for a warrior or in war. Competent play first guarantees the defenders.
    const alert = alerts.some(a => a.cityId === city.id);
    const want = persona.army + (enemies.length ? 2 : 0) + eraIndex + (alert ? 3 : 0) + (threatsSeen.length ? 2 : 0);
    const kindsAll = ['CAVALRY', 'SIEGE', 'RANGED', 'GUARD', 'INFANTRY'].filter(k => pick('RECRUIT', x => x.unit === k).length);
    const smallCity = comp && city.population < (hard ? 10 : 12);
    if (comp && here < needDef && !smallCity) {
      const kind = kindsAll.includes('GUARD') ? 'GUARD' : kindsAll.includes('INFANTRY') ? 'INFANTRY' : null;
      if (kind) add(alert || nearThreat || round >= 8 || eraIndex >= 1 ? 131 : 84, `defend:${city.id}:${kind}`, { type: 'URBAN_ACTION', cityId: city.id, action: 'RECRUIT', unit: kind });
    }
    if (here < want && army.length < want * Math.max(1, nCities) && !smallCity) {
      const kinds = kindsAll;
      const kind = enemies.length || persona === PERSONAS.warrior ? (kinds.find(k => k === 'SIEGE' && army.filter(u => u.kind === 'SIEGE').length < 2) ?? kinds[Math.floor(rand() * kinds.length)]) : (kinds.includes('GUARD') && here < 2 ? 'GUARD' : kinds.includes('INFANTRY') ? 'INFANTRY' : kinds[0]);
      if (kind) add((alert ? 93 : here < 2 ? 80 : 56) * (comp ? Math.min(1.1, w.recruit) * (foodLow ? 0.6 : 1) : w.recruit) * (enemies.length || alert ? 1 : saving), `recruit:${city.id}:${kind}`, { type: 'URBAN_ACTION', cityId: city.id, action: 'RECRUIT', unit: kind });
    }
    if (nCities < wantCities && !myUnits.some(u => u.kind === 'COLONIST') && index === 0) if (pick('RECRUIT', x => x.unit === 'COLONIST').length) add(85, `recruit-pioneer`, { type: 'URBAN_ACTION', cityId: city.id, action: 'RECRUIT', unit: 'COLONIST' });
    if (eraIndex >= 1 && !myUnits.some(u => u.kind === 'COLONIST') && index === 0 && (persona.explore ?? 0) > 0) if (pick('RECRUIT', x => x.unit === 'COLONIST').length) add(60, 'recruit-explorer', { type: 'URBAN_ACTION', cityId: city.id, action: 'RECRUIT', unit: 'COLONIST' });
    if (state.routes.some(r => r.ownerId === id && r.fromCityId === city.id && !r.suspended)) if (pick('SUPPORT_TRADE').length) add(48, `trade:${city.id}`, { type: 'URBAN_ACTION', cityId: city.id, action: 'SUPPORT_TRADE' });
  });
  // Territory: claim hexes around each city (Influência 1) and improve them; both are Cidade Orders.
  const claimKey = `${id}:${round}:${p.resources.influence}:${state.core.map.filter(t => t.ownerId === id).length}`;
  if (ctx.claimKey !== claimKey) { ctx.claimKey = claimKey; ctx.claims = E.alphaClaimOptions(state, id); }
  const claims = ctx.claims;
  cities.forEach(city => {
    const cap = E.activationCapacity(state, city.id);
    const claimed = state.core.map.filter(t => t.controllerCityId === city.id && t.id !== city.hexId);
    const options = claims[city.id] ?? [];
    const keepInfluence = reserveInfluence && !E.governmentOptions(state, id).planned && p.resources.influence - 1 < reformCost;
    if (options.length && claimed.length < cap + 1 && p.resources.influence >= 1 && !keepInfluence) {
      const centre = tileOf(state, city.hexId);
      const best = options.map(hex => tileOf(state, hex)).sort((a, b) => (['PLAINS', 'FOREST', 'HILLS'].indexOf(a.terrain) < 0) - (['PLAINS', 'FOREST', 'HILLS'].indexOf(b.terrain) < 0) || dist(centre, a) - dist(centre, b) || a.id.localeCompare(b.id))[0];
      add(claimed.length < cap ? 82 : 52, `claim:${city.id}:${best.id}`, { type: 'MANAGE', command: { type: 'CLAIM_HEX', playerId: id, cityId: city.id, hexId: best.id, expectedVersion: state.core.version } });
    }
    for (const tile of claimed) { const improvement = IMPROVEMENT_FOR(tile); if (improvement) add(improvement === 'FARM' ? (p.resources.food > 12 ? 30 : comp ? 88 : 64) : comp && improvement === 'LUMBER_CAMP' && p.resources.wood > 12 ? 20 : 64, `improve:${tile.id}`, { type: 'MANAGE', command: { type: 'IMPROVE_HEX', playerId: id, hexId: tile.id, improvement, expectedVersion: state.core.version } }); }
  });
  // Research (Avanço Order).
  const researchRanked = pickResearch(box, id, persona, view.research);
  if (researchRanked.length) {
    const heritageFirst = comp ? researchRanked.find(o => !D.ADVANCEMENTS.some(a => a.id === o.advancementId)) : null;
    const opt = heritageFirst ?? researchRanked[0];
    // Avanço is its own Order (E-1): any own city carries it, so the one with the most scholars does.
    const labs = comp ? [...cities].filter(c => state.cities.find(x => x.cityId === c.id)?.status !== 'OCCUPIED').sort((a, b) => b.workers.scholars - a.workers.scholars || a.id.localeCompare(b.id)) : [cities[0]];
    const lab = labs[0];
    if (lab) add((opt.blocked ? 0 : 1) * (comp ? (round % 2 === 0 ? 99 : 82) : 88 + (w.research - 1) * 10), `research:${opt.advancementId}`, { type: 'URBAN_ACTION', cityId: lab.id, action: 'RESEARCH', advancementId: opt.advancementId });
    // Hardcore players with Conhecimento to spare run a second line of research from another city in the same round.
    if (hard && labs[1] && researchRanked[1] && p.resources.knowledge >= 7) add(89, `research2:${researchRanked[1].advancementId}`, { type: 'URBAN_ACTION', cityId: labs[1].id, action: 'RESEARCH', advancementId: researchRanked[1].advancementId });
  }
  // Military (competent): garrisons stay home, the surplus strikes Acampamentos early with a real stack and answers marching Bandos.
  if (comp) {
    const power = units => units.reduce((n, u) => n + state.rules.units[u.kind].strength, 0);
    const compPower = t => t.composition.reduce((n, c) => n + state.rules.units[c.kind].strength * c.count, 0);
    const cityHexes = new Set(cities.map(c => c.hexId));
    const keepAt = hex => cityHexes.has(hex) ? (hard ? (hex === cities[0].hexId ? 2 : 1) : Math.min(4, (threatsSeen.length || enemies.length) ? 2 : eraIndex >= 1 ? 2 : 1)) : 0;
    const strikeTargets = [];
    for (const t of threatsSeen) if (t.kind === 'CAMP') strikeTargets.push({ hex: t.hexId, kind: 'threat', power: compPower(t), camped: t.status === 'CAMPED' });
    for (const enemy of enemies) for (const c of owner(state, enemy)?.civilization.cities ?? []) strikeTargets.push({ hex: c.hexId, kind: 'enemy', power: 10 });
    const stacks = new Map();
    for (const u of army) if (!u.carrierId) { const g = stacks.get(u.hexId) ?? []; g.push(u); stacks.set(u.hexId, g); }
    for (const [hex, units] of stacks) {
      const keep = keepAt(hex), rank = u => (u.kind === 'GUARD' ? 0 : u.kind === 'INFANTRY' ? 1 : 2);
      const sorted = [...units].sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id));
      const usable = sorted.slice(keep).filter(u => unitOpts[u.id]?.moves !== undefined);
      if (!usable.length) continue;
      const here = tileOf(state, hex);
      const reachable = strikeTargets.map(t => ({ ...t, d: dist(here, tileOf(state, t.hex)) })).filter(t => t.d <= (t.kind === 'threat' ? 8 : 9) && (t.kind === 'threat' ? (t.camped || t.d <= 4) : (persona.war <= round || hard))).sort((a, b) => a.d - b.d)[0];
      if (!reachable) continue;
      const required = reachable.kind === 'threat' ? Math.max(4, Math.ceil(reachable.power * (hard ? 1.35 : 1.6))) : 14;
      if (reachable.d === 1) {
        const order = { id: nextOrderId(box, id), type: 'ATTACK', unitIds: usable.map(u => u.id).slice(0, 12), target: reachable.hex, posture: persona.posture };
        let preview = null; try { preview = E.combatPreview(state, id, order); } catch { /* ignore */ }
        if (preview?.ok) { const diff = preview.defender?.visible ? preview.attacker.total - preview.defender.total : 2; if (diff >= (hard ? 1 : 2)) add(reachable.kind === 'threat' ? 91 : 83, `attack:${hex}:${reachable.hex}`, { type: 'QUEUE_ORDER', order }); }
      } else if (power(usable) >= required) {
        const first = unitOpts[usable[0].id];
        const step = Object.keys(first.moves).filter(h => usable.every(u => unitOpts[u.id]?.moves[h])).map(h => ({ h, d: dist(tileOf(state, h), tileOf(state, reachable.hex)) })).filter(x => x.d < reachable.d).sort((a, b) => a.d - b.d || a.h.localeCompare(b.h))[0];
        if (step) add(reachable.kind === 'threat' ? 87 : 66, `march:${hex}`, { type: 'QUEUE_ORDER', order: { id: nextOrderId(box, id), type: 'MOVE', unitIds: usable.map(u => u.id), path: first.moves[step.h] } });
      }
    }
  } else {
  const groups = new Map();
  for (const u of army) if (!u.carrierId) { const g = groups.get(u.hexId) ?? []; g.push(u); groups.set(u.hexId, g); }
  const targets = [];
  for (const enemy of enemies) { const ec = owner(state, enemy)?.civilization.cities ?? []; for (const c of ec) targets.push({ hex: c.hexId, enemy: true }); }
  for (const t of E.threatView(state, id) ?? []) targets.push({ hex: t.hexId, enemy: false, threat: true });
  if (targets.length) for (const [hex, units] of groups) {
    const here = tileOf(state, hex), usable = units.filter(u => (unitOpts[u.id]?.moves !== undefined));
    if (!usable.length) continue;
    const near = targets.map(t => ({ ...t, d: dist(here, tileOf(state, t.hex)) })).sort((a, b) => a.d - b.d)[0];
    if (!near) continue;
    if (near.d === 1) {
      const order = { id: nextOrderId(box, id), type: 'ATTACK', unitIds: usable.map(u => u.id).slice(0, 12), target: near.hex, posture: persona.posture };
      let preview = null; try { preview = E.combatPreview(state, id, order); } catch { /* ignore */ }
      if (preview?.ok) { const ratio = preview.defender?.visible ? preview.attacker.total - preview.defender.total : 1; if (ratio >= (near.threat ? 0 : 1) || usable.length >= 6) add((near.threat ? 70 : persona === PERSONAS.warrior ? 82 : 62), `attack:${hex}:${near.hex}`, { type: 'QUEUE_ORDER', order }); }
    } else if ((persona === PERSONAS.warrior || enemies.length) && usable.length >= 3) {
      const reach = Object.keys(unitOpts[usable[0].id].moves).map(h => ({ h, d: dist(tileOf(state, h), tileOf(state, near.hex)) })).filter(x => x.d < near.d).sort((a, b) => a.d - b.d || a.h.localeCompare(b.h))[0];
      if (reach) add(persona === PERSONAS.warrior ? 66 : 40, `march:${hex}`, { type: 'QUEUE_ORDER', order: { id: nextOrderId(box, id), type: 'MOVE', unitIds: usable.map(u => u.id).filter(uid => unitOpts[uid]?.moves[reach.h]).slice(0, 12), path: unitOpts[usable[0].id].moves[reach.h] } });
    }
  }
  }
  // Diplomacy and war.
  const contacts = p.contacts.filter(c => c !== id && owner(state, c)?.civilization.cities.length > 0 && cities.length > 0);
  if (contacts.length) {
    const target = contacts.map(c => ({ c, d: dist(tileOf(state, cities[0].hexId), tileOf(state, owner(state, c).civilization.cities[0].hexId)) })).sort((a, b) => a.d - b.d)[0].c;
    const atWar = enemies.includes(target);
    if (!atWar && round >= persona.war && round % 5 === 2 && p.era !== 'FOUNDATION') add(75, `war:${target}`, { type: 'DECLARE_WAR', targetId: target });
    if (!atWar && round % 6 === 1) add(persona === PERSONAS.trader ? 64 : 34, `treaty:${target}`, { type: 'PROPOSE_TREATY', recipientId: target, treaty: round % 12 === 1 ? 'TRADE_AGREEMENT' : 'OPEN_BORDERS', deal: { give: ZERO7(), receive: ZERO7() } });
    if (persona === PERSONAS.trader && cities.length >= 1) {
      const foreign = owner(state, target).civilization.cities[0];
      add(54, `route:${target}`, { type: 'QUEUE_ORDER', order: { id: nextOrderId(box, id), type: 'TRADE', fromCityId: cities[0].id, toCityId: foreign.id } });
    }
  }
  // Independent peoples (Influência).
  for (const people of E.independentPeopleView(state, id) ?? []) { const act = (people.actions ?? []).find(a => !a.blocked); if (act) add(42, `people:${people.id}:${act.action}`, { type: 'INDEPENDENT_ACTION', peopleId: people.id, action: act.action }); }
  // Obras de Legado: advance an own Obra, or start the first one a city can afford (one step per Legado Order).
  if (eraIndex >= 3) for (const work of E.legacyWorkView(state, id)) { const city = work.cities.find(entry => entry.blocker === null); if (city && (!work.progress || work.progress.ownerId === id)) { add(50, `work:${work.id}`, { type: 'ADVANCE_LEGACY_WORK', workId: work.id, cityId: city.cityId }); break; } }
  if (comp) {
    // Never eat the seed corn: a Recrutar that would leave Alimento below what the cities and pieces eat this round waits (unless a Bando is at the gate).
    const sustain = cities.reduce((n, c) => n + Math.ceil(c.population / 2), 0) + Math.ceil(army.length / 2);
    const foodCostOf = command => { const row = (view.cities[command.cityId] ?? []).find(o => o.action === command.action && (o.unit ?? null) === (command.unit ?? null) && (!command.build || JSON.stringify(o.build) === JSON.stringify(command.build))); return row?.cost?.food ?? 0; };
    // Saving for Elevar: when a city lacks only resources, spending that would eat into them waits (defence against a Bando at the gate excepted).
    const saveFor = {};
    for (const city of cities) { const row = (view.cities[city.id] ?? []).find(o => o.action === 'ELEVATE'); if (row && /Recursos/.test(row.blocked ?? '')) for (const [k, v] of Object.entries(row.cost)) if (v > 0) saveFor[k] = Math.max(saveFor[k] ?? 0, v); }
    const costOf = command => (view.cities[command.cityId] ?? []).find(o => o.action === command.action && (o.unit ?? null) === (command.unit ?? null) && (!command.build || JSON.stringify(o.build) === JSON.stringify(command.build)))?.cost ?? {};
    return out.filter(c => {
      if (c.command.type !== 'URBAN_ACTION' || !['RECRUIT', 'BUILD'].includes(c.command.action)) return true;
      const urgent = (c.key.startsWith('defend') || c.key.startsWith('fort')) && (alerts.length > 0 || threatsSeen.some(t => t.status === 'MARCHING'));
      if (urgent) return true;
      if (p.resources.food - foodCostOf(c.command) + nCities * 2 < sustain + 1) return false;
      const cost = costOf(c.command);
      return !Object.entries(saveFor).some(([k, need]) => (cost[k] ?? 0) > 0 && p.resources[k] - cost[k] < need);
    }).sort((a, b) => b.score - a.score);
  }
  return out.sort((a, b) => b.score - a.score);
}

function freeActions(box, id, persona) {
  const { state } = box;
  let p = me(state, id);
  if (!p.ambitionsChosen && p.ambitions.length >= 2) send(box, id, { type: 'CHOOSE_AMBITIONS', cardIds: p.ambitions.slice(0, 2) });
  for (const choice of [...me(box.state, id).pendingChoices]) { const idx = (box.ctx.rand[id]() < 0.35 ? 1 : 0); send(box, id, { type: 'RESOLVE_CHOICE', choiceId: choice.id, optionId: choice.options[Math.min(idx, choice.options.length - 1)].id }); }
  if (box.state.cards.worldEvent && !box.state.cards.worldResponded.includes(id)) send(box, id, { type: 'WORLD_CHOICE', choice: box.ctx.rand[id]() < 0.5 ? 'RESOURCE' : 'PRESTIGE' });
  send(box, id, { type: 'SET_DEFENSE_POSTURE', posture: persona.posture });
}

export function botPlan(box, id) {
  const persona = PERSONAS[box.ctx.seats.find(s => s.id === id).persona];
  freeActions(box, id, persona);
  assignPopulation(box, id, persona);
  assignWorkedHexes(box, id);
  const p0 = me(box.state, id);
  if (p0.leader && !p0.leader.eraAbilityUsed && box.state.core.round % box.state.rules.roundsPerEra === 3) send(box, id, { type: 'LEADER_ABILITY' });
  const hand = me(box.state, id).hand.slice();
  if (hand.length && (box.state.core.round % 2 === 0 || box.ctx.skill === 'hardcore')) for (const card of hand) { if (send(box, id, { type: 'PLAY_CARD', cardId: card })) break; }
  for (const t of box.state.treaties.filter(t => t.status === 'PROPOSED' && t.recipientId === id)) send(box, id, { type: 'RESPOND_TREATY', treatyId: t.id, accept: true });
  for (const t of box.state.tradeOffers.filter(t => t.status === 'PROPOSED' && t.recipientId === id)) send(box, id, { type: 'RESPOND_TRADE', offerId: t.id, accept: true });
  const failed = failedKey(box, id);
  for (let guard = 0; guard < 30; guard++) {
    const usage = E.alphaActionUsage(box.state, id);
    if (usage.used >= usage.limit) break;
    const list = candidates(box, id, persona).filter(c => !failed.has(c.key));
    let done = false;
    // Try every candidate best-first (a rejected one is remembered for the round): the plan ends only when nothing valid is left.
    for (const c of list) { if (send(box, id, c.command)) { done = true; failed.add(c.key + '#' + usage.used); break; } failed.add(c.key); }
    if (!done) break;
  }
}

function eraTurnActions(box, id) {
  const persona = PERSONAS[box.ctx.seats.find(s => s.id === id).persona];
  for (const choice of [...me(box.state, id).pendingChoices]) send(box, id, { type: 'RESOLVE_CHOICE', choiceId: choice.id, optionId: choice.options[0].id });
  send(box, id, { type: 'SET_DEFENSE_POSTURE', posture: persona.posture });
}

function readyEveryone(box) {
  for (const s of box.ctx.seats) { if (box.state.core.status !== 'ACTIVE') return; const p = me(box.state, s.id); if (!p.ready) send(box, s.id, { type: 'READY' }); }
}

/** Flags a built level the population no longer supports (a devastated city) at any time of the match. */
function scanDevastation(box) { for (const meta of box.state.cities) { const c = box.state.core.players.flatMap(o => o.civilization.cities).find(x => x.id === meta.cityId); if (c && D.effectiveLevel(meta.level, c.population) !== meta.level) box.ctx.flags.devastatedCity = true; } }

/** Invariants that must hold after every round, whatever the bots did. */
export function checkInvariants(state, ctx) {
  const bad = (msg) => ctx.violations.push({ round: state.core.round, msg });
  for (const p of state.players) {
    for (const [k, v] of Object.entries(p.resources)) {
      if (v < 0) bad(`${p.playerId} ${k} negative (${v})`);
    }
    const storage = E.alphaStorageCapacity(state, p.playerId);
    for (const [k, v] of Object.entries(p.resources)) if (v > (storage[k] ?? Infinity) + 0 && state.phase === 'PLANNING' && state.core.round > 1) bad(`${p.playerId} ${k} ${v} above storage ${storage[k]} at planning`);
  }
  for (const o of state.core.players) for (const c of o.civilization.cities) if (c.population < 1) bad(`${o.id} city ${c.id} population ${c.population}`);
  for (const u of state.units) if (!state.core.map.some(t => t.id === u.hexId)) bad(`unit ${u.id} off map`);
}

/** Plays a whole match. `scenario(box, hook)` may inject conditions at named hooks ('round-start'). */
export function playMatch(options = {}) {
  const box = createBotMatch(options);
  const { ctx } = box;
  const t0 = performance.now();
  const coverage = new Set();
  let safety = 0;
  while (box.state.core.status === 'ACTIVE' && safety++ < (options.maxSteps ?? 4000) && ctx.crashes.length === 0) {
    const round = box.state.core.round, phase = box.state.phase;
    const tRound = performance.now(); if (process.env.BOT_DEBUG && safety % 50 === 0) console.error('round', round, phase, safety, ctx.lastError);
    try {
      if (phase === 'PLANNING') {
        options.scenario?.(box, 'round-start');
        scanDevastation(box);
        const order = [...box.state.initiative];
        for (const id of order) botPlan(box, id);
        checkInvariants(box.state, ctx);
        readyEveryone(box);
      } else if (phase === 'ERA_TURN') {
        for (const s of ctx.seats) eraTurnActions(box, s.id);
        readyEveryone(box);
      } else readyEveryone(box);
    } catch (error) { ctx.crashes.push({ round, phase, message: String(error?.stack ?? error).slice(0, 600) }); break; }
    ctx.timings.push({ round, phase, ms: performance.now() - tRound });
    if (box.state.core.round !== round || box.state.phase !== phase) { if (box.state.core.round !== round) checkInvariants(box.state, ctx); }
    if (box.state.core.round > ctx.maxRound) break;
    if (safety >= (options.maxSteps ?? 4000)) ctx.crashes.push({ round, phase, message: 'softlock: safety counter exhausted' });
  }
  ctx.totalMs = performance.now() - t0;
  detectCoverage(box, coverage);
  return { state: box.state, ctx, coverage };
}

export const COVERAGE_FLAGS = ['famine', 'devastatedCity', 'overextension', 'n7', 'ouChoice', 'heritage', 'repercussion', 'confluence', 'government', 'battle', 'fortification', 'siege', 'noSupply', 'band', 'pirate', 'hegemony', 'cityCaptured', 'n6'];
export function detectCoverage(box, set) {
  const { state } = box;
  const events = state.events.map(e => e.type);
  if (events.includes('FOOD_SHORTAGE')) set.add('famine');
  if (events.includes('ADMINISTRATIVE_OVEREXTENSION')) set.add('overextension');
  if (events.includes('GOVERNMENT')) set.add('government');
  if (state.telemetry.battles > 0 || state.battles.length) set.add('battle');
  if (state.cities.some(c => c.fortification.level !== 'NONE')) set.add('fortification');
  if (state.battles.some(b => [...b.attackerTactical, ...b.defenderTactical].length && b.attackBreakdown.concat(b.defenseBreakdown).some(m => /Brecha|cerco/i.test(m.source)))) set.add('siege');
  if (state.battles.some(b => b.attackBreakdown.concat(b.defenseBreakdown).some(m => /Sem suprimento/.test(m.source)))) set.add('noSupply');
  if (state.telemetry.threatsSpawned > 0 && (state.telemetry.threatAttacks > 0 || events.includes('THREAT_MARCHING'))) set.add('band');
  if (events.some(t => t === 'THREAT_PILLAGE' || t === 'THREAT_SPAWNED') && state.threats.some(t => t.kind === 'PIRATE') || state.telemetry.roundLog.some(r => (r.threatsAlive.pirate ?? 0) > 0)) set.add('pirate');
  if (state.players.some(p => p.hegemony) || state.telemetry.hegemonyDeclarations > 0) set.add('hegemony');
  if (state.telemetry.citiesCaptured > 0) set.add('cityCaptured');
  if (state.telemetry.roundLog.some(r => r.cityLevels.some(l => l >= 7))) set.add('n7');
  if (state.telemetry.roundLog.some(r => r.cityLevels.some(l => l >= 6))) set.add('n6');
  if (state.players.some(p => p.research.some(id => D.ADVANCEMENTS.find(a => a.id === id)?.pair))) set.add('ouChoice');
  if (state.players.some(p => p.research.some(id => D.heritageAdvance(id)))) set.add('heritage');
  if (state.telemetry.resonanceCycles > 0) set.add('repercussion');
  if ((state.telemetry.resonanceByKind.CONFLUENCE ?? 0) > 0) set.add('confluence');
  if (box.ctx.flags.devastatedCity) set.add('devastatedCity');
  return set;
}

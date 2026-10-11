/* global performance */
// Lane A1 (Alpha V1.2 audit): scripted ECONOMIC policies that drive the real engine through applyAlphaCommand (the command surface a player has).
// They are NOT the old bots: no persona/war logic, no randomness; each policy is a table of weights over the same Order menu.
// Every command is wrapped with a before/after snapshot of the 8-resource pool so flows can be reconciled against the engine's own tracer
// (scripts/lib/alpha-flow-trace.mjs) and the ledger (state.roundLedgers) independently.
import { flows, preMaint, resetTrace, RESOURCE_KEYS_8 as KEYS } from './alpha-flow-trace.mjs';

export const PROFILES = { 21: 'QUICK', 35: 'STANDARD', 49: 'EPIC' };
export const POLICY_NAMES = ['growth', 'research', 'expansion', 'military', 'balanced'];

const ZERO8 = () => Object.fromEntries(KEYS.map(k => [k, 0]));
const add8 = (a, b, s = 1) => { for (const k of KEYS) a[k] += (b?.[k] ?? 0) * s; return a; };
const sub8 = (a, b) => Object.fromEntries(KEYS.map(k => [k, (a?.[k] ?? 0) - (b?.[k] ?? 0)]));
const nonzero = v => KEYS.some(k => v[k] !== 0);
const LAND_KINDS = ['INFANTRY', 'GUARD', 'RANGED', 'CAVALRY', 'SIEGE'];

/**
 * Policy table. `w` are score multipliers/base scores for the Order menu; `roles` weights for artisans/merchants/scholars pairs;
 * `foodShare` is the share of free inhabitants working the land; `garrison(era,nCities)` pieces wanted per city; `build` lists
 * (district, building) pairs in priority order; `research` is a list of Web-node ids the policy chases first (after the Elevar chain).
 */
export const POLICIES = {
  growth: {
    researchPerRound: 1, wantCities: () => 2, reserve: 5, foodShare: 0.6, roles: { art: 1, mer: 0.5, sch: 0.5 }, garrison: () => 1, govs: ['CONFEDERATION', 'REPUBLIC', 'MONARCHY'],
    w: { produce: 70, elevate: 150, research: 75, build: 70, claim: 90, improve: 88, settle: 120, pioneer: 80, recruit: 40, govern: 120, civic: 15 },
    build: [['AGRARIAN', 'GRANARY'], ['INDUSTRIAL', 'WAREHOUSE'], ['COMMERCIAL', 'MARKET'], ['ADMINISTRATIVE', null], ['CULTURAL', 'TEMPLE'], ['ACADEMIC', 'LIBRARY']],
    research: ['web-agriculture', 'web-irrigation', 'web-masonry', 'web-writing', 'web-crop-rotation', 'web-sanitation'],
  },
  research: {
    researchPerRound: 3, wantCities: () => 2, reserve: 3, foodShare: 0.4, roles: { art: 1, mer: 0.7, sch: 3 }, garrison: () => 1, govs: ['MERITOCRACY', 'REPUBLIC', 'THEOCRACY'],
    w: { produce: 75, elevate: 110, research: 175, build: 75, claim: 80, improve: 70, settle: 110, pioneer: 70, recruit: 35, govern: 120, civic: 15 },
    build: [['ACADEMIC', 'LIBRARY'], ['AGRARIAN', 'GRANARY'], ['INDUSTRIAL', 'WAREHOUSE'], ['ADMINISTRATIVE', null], ['COMMERCIAL', 'MARKET'], ['CULTURAL', 'TEMPLE']],
    research: ['web-writing', 'web-agriculture', 'web-mathematics', 'web-natural-philosophy', 'web-masonry', 'web-experimental-method', 'web-laboratory', 'web-synthesis'],
  },
  expansion: {
    researchPerRound: 1, wantCities: era => Math.min(7, 3 + era), reserve: 4, foodShare: 0.55, roles: { art: 1.4, mer: 1, sch: 0.7 }, garrison: () => 1, govs: ['CONFEDERATION', 'REPUBLIC', 'MONARCHY'],
    w: { produce: 70, elevate: 100, research: 80, build: 60, claim: 100, improve: 80, settle: 190, pioneer: 150, recruit: 40, govern: 120, civic: 15 },
    build: [['ADMINISTRATIVE', null], ['AGRARIAN', 'GRANARY'], ['INDUSTRIAL', 'WAREHOUSE'], ['COMMERCIAL', 'MARKET'], ['CULTURAL', 'TEMPLE'], ['ACADEMIC', 'LIBRARY']],
    research: ['web-agriculture', 'web-writing', 'web-common-narratives', 'web-codes', 'web-masonry', 'web-urbanism', 'web-irrigation'],
  },
  military: {
    researchPerRound: 1, wantCities: () => 2, reserve: 5, foodShare: 0.5, roles: { art: 1.6, mer: 0.7, sch: 0.7 }, garrison: era => 2 + Math.floor(era / 2), govs: ['AUTOCRACY', 'MONARCHY'],
    w: { produce: 75, elevate: 100, research: 70, build: 75, claim: 75, improve: 70, settle: 100, pioneer: 60, recruit: 135, govern: 120, civic: 15 },
    build: [['MILITARY', 'BARRACKS'], ['AGRARIAN', 'GRANARY'], ['INDUSTRIAL', 'WORKSHOP'], ['COMMERCIAL', 'MARKET'], ['ADMINISTRATIVE', null], ['ACADEMIC', 'LIBRARY']],
    research: ['web-guard-formations', 'web-masonry', 'web-agriculture', 'web-metallurgy', 'web-maneuver-training', 'web-engineering', 'web-fortification', 'web-iron'],
  },
  // Extra policy (not in the default matrix): chases the two resources the others ignore, Cultura (CULTURAL district + Templo) and Metal (Mina on the deposit).
  metalculture: {
    researchPerRound: 1, wantMetal: true, wantCities: () => 2, reserve: 4, foodShare: 0.5, roles: { art: 1.5, mer: 1, sch: 1 }, garrison: era => 1 + (era >= 3 ? 1 : 0), govs: ['THEOCRACY', 'REPUBLIC', 'MONARCHY'],
    w: { produce: 70, elevate: 120, research: 90, build: 78, claim: 100, improve: 92, settle: 100, pioneer: 70, recruit: 60, govern: 120, civic: 15 },
    build: [['CULTURAL', 'TEMPLE'], ['AGRARIAN', 'GRANARY'], ['INDUSTRIAL', 'WORKSHOP'], ['ADMINISTRATIVE', null], ['COMMERCIAL', 'MARKET'], ['MILITARY', 'BARRACKS'], ['ACADEMIC', 'LIBRARY']],
    research: ['web-agriculture', 'web-common-narratives', 'web-masonry', 'web-metallurgy', 'web-writing', 'web-expression-schools', 'web-iron', 'web-engineering'],
  },
  balanced: {
    researchPerRound: 1, wantCities: era => Math.min(4, 2 + Math.floor(era / 2)), reserve: 4, foodShare: 0.5, roles: { art: 1, mer: 1, sch: 1 }, garrison: era => 1 + (era >= 3 ? 1 : 0), govs: ['REPUBLIC', 'MONARCHY', 'THEOCRACY'],
    w: { produce: 70, elevate: 130, research: 100, build: 70, claim: 90, improve: 80, settle: 140, pioneer: 100, recruit: 60, govern: 120, civic: 15 },
    build: [['AGRARIAN', 'GRANARY'], ['INDUSTRIAL', 'WAREHOUSE'], ['ACADEMIC', 'LIBRARY'], ['COMMERCIAL', 'MARKET'], ['ADMINISTRATIVE', null], ['CULTURAL', 'TEMPLE'], ['MILITARY', 'BARRACKS']],
    research: ['web-agriculture', 'web-writing', 'web-masonry', 'web-common-narratives', 'web-exchange', 'web-codes', 'web-metallurgy', 'web-engineering', 'web-urbanism'],
  },
};

/** The classification of one flow of the tracer into a human label (what the table calls it). */
const FRAME_LABELS = [
  ['drawWorldPulse', 'PULSE'], ['finishEraTurn', 'ERA_TURN'], ['enterEraTurn', 'ERA_TURN'], ['reforms', 'GOV_REFORM'],
  ['applyOps', 'CHOICE'], ['resolveChoice', 'CHOICE'], ['autoResolveChoices', 'CHOICE'], ['manageCard', 'CARD'], ['maintainCards', 'CARD'], ['playCard', 'CARD'], ['playCivilizationCard', 'CARD'],
  ['civilizationAbility', 'ABILITY'], ['useLeaderAbility', 'LEADER'], ['independentAction', 'INDEPENDENT'], ['advanceLegacyWork', 'LEGACY'],
  ['settleTradeOffers', 'TRADE'], ['proposeTrade', 'TRADE'], ['respondTrade', 'TRADE'], ['maintainTrade', 'TRADE'], ['settleTreaties', 'TRADE'], ['manageDiplomacy', 'DIPLOMACY'], ['kitRouteIncome', 'TRADE'],
  ['applyGovernmentRoundStart', 'GOV_ROUND_START'], ['exploreRegion', 'DISCOVERY'], ['resolveFrontierMove', 'DISCOVERY'], ['resolveThreatCommand', 'THREAT'], ['applyThreatCommand', 'THREAT'], ['resolveBattle', 'COMBAT'],
  ['foundCityAt', 'SETTLE'], ['settleWithPioneer', 'SETTLE'],
];
export function classifyFlow(f) {
  const frames = f.frames ?? [];
  const cur = f.cur;
  if (f.kind === 'enforceStorage') return 'DISCARD';
  if (f.kind === 'alphaLose') { const hit = FRAME_LABELS.find(([n]) => frames.includes(n)); return hit ? `LOSS:${hit[1]}` : 'LOSS:OTHER'; }
  if (cur?.action) {
    if (f.category === 'production' || f.category === 'mining') return 'PRODUCE';
    if (cur.action === 'PRODUCE' && f.category === 'institutions') return 'PRODUCE_BONUS';
    if (cur.action === 'BUILD') return 'BUILD';
    if (['ELEVATE', 'RESEARCH', 'PROMOTE_MOOD', 'CIVIC_ACTION', 'SUPPORT_TRADE'].includes(cur.action)) return cur.action;
    if (cur.action === 'RECRUIT') return 'RECRUIT';
  }
  if (frames.includes('maintainCivilizations')) {
    if (f.category === 'expenses') return 'GROWTH';
    if (f.category === 'upkeepPaid') return f.upkeepIndex === 'military' ? 'MILITARY_UPKEEP' : 'SUSTENANCE';
  }
  if (f.category === 'institutions') return f.phase === 'WORLD_PULSE' ? 'RECURRING_ROUND_START' : f.phase === 'INTEGRATION_MAINTENANCE' ? 'RECURRING_MAINTENANCE' : 'RECURRING_OTHER';
  if (frames.includes('applyTerritoryCommand')) return (f.delta.influence < 0 && KEYS.every(k => k === 'influence' || f.delta[k] === 0)) ? 'CLAIM_HEX' : 'IMPROVE_HEX';
  const hit = FRAME_LABELS.find(([n]) => frames.includes(n));
  if (hit) return hit[1];
  if (frames.includes('applyCommand') && f.delta.influence < 0 && KEYS.every(k => k === 'influence' || f.delta[k] === 0)) return 'CLAIM_HEX';
  if (frames.includes('applyCommand')) return 'IMPROVE_HEX';
  if (frames.includes('applyAlphaCommand') && f.category === 'expenses' && frames.includes('alphaPay')) return 'BUILD_ROAD';
  return `UNCLASSIFIED:${f.category}:${frames.slice(0, 6).join('<')}`;
}

// ---------------------------------------------------------------------------------------------------------------------------------
const me = (state, id) => state.players.find(p => p.playerId === id);
const owner = (state, id) => state.core.players.find(p => p.id === id);
const tileOf = (state, hex) => state.core.map.find(t => t.id === hex);

// COMPARATIVE MODELS (never applied to the engine): scenario edits of the initial state, used only to measure what a change would do.
export const VARIANTS = {
  base: 'RC4 rules as shipped',
  orders6: '6 Orders per round (actionsPerRound 6, already a legal 3-6 setting)',
  yield150: 'terrain and improvement yields x1.5 (rounded up)',
  cost60: 'district, building, improvement, claim, founding and unit costs x0.6 (rounded up)',
  starthamlet: 'capital starts as a Povoado (N2) with 4 inhabitants and web-agriculture researched',
  stock150: 'starting resources x1.5',
  startvillage: 'capital starts as a Vila (N3) with 6 inhabitants, web-agriculture and web-masonry researched',
  combo: 'orders6 + yield150 + starthamlet',
};
function applyVariant(state, variant) {
  const up = (v, k) => Math.ceil(v * k);
  const scalePool = (pool, k) => { for (const key of Object.keys(pool)) pool[key] = up(pool[key], k); };
  if (['yield150', 'combo'].includes(variant)) {
    const t = state.core.config.territory;
    for (const y of Object.values(t.terrainYields)) for (const k of ['food', 'materials', 'wealth']) y[k] = up(y[k], 1.5);
    for (const i of Object.values(t.improvementCatalog)) for (const k of ['food', 'materials', 'wealth']) i.yield[k] = up(i.yield[k], 1.5);
  }
  if (variant === 'cost60') {
    const t = state.core.config.territory;
    for (const d of Object.values(t.districts)) scalePool(d.cost, 0.6);
    for (const b of Object.values(t.buildings)) scalePool(b.cost, 0.6);
    for (const i of Object.values(t.improvementCatalog)) scalePool(i.cost, 0.6);
    scalePool(t.foundingCost, 0.6);
    for (const u of Object.values(state.rules.units)) scalePool(u.cost, 0.6);
  }
  if (variant === 'stock150') for (const p of state.players) for (const k of Object.keys(p.resources)) p.resources[k] = up(p.resources[k], 1.5);
  if (variant === 'startvillage') {
    for (const p of state.players) for (const id of ['web-agriculture', 'web-masonry']) if (!p.research.includes(id)) p.research.push(id);
    for (const o of state.core.players) {
      const city = o.civilization.cities[0];
      state.cities.find(c => c.cityId === city.id).level = 'VILLAGE';
      o.civilization = { ...o.civilization, cities: o.civilization.cities.map(c => c.id === city.id ? { ...c, population: 6, development: 3, workers: { producers: 3, artisans: 0, merchants: 0, scholars: 3, soldiers: 0, unassigned: 0 } } : c) };
    }
  }
  if (['starthamlet', 'combo'].includes(variant)) {
    for (const p of state.players) { if (!p.research.includes('web-agriculture')) p.research.push('web-agriculture'); }
    for (const o of state.core.players) {
      const city = o.civilization.cities[0];
      const meta = state.cities.find(c => c.cityId === city.id);
      meta.level = 'HAMLET';
      o.civilization = { ...o.civilization, cities: o.civilization.cities.map(c => c.id === city.id ? { ...c, population: 4, development: 1, workers: { producers: 2, artisans: 0, merchants: 0, scholars: 2, soldiers: 0, unassigned: 0 } } : c) };
    }
  }
  return state;
}

export function createBox({ E, D, policy, profile, players, seed, startingPioneers = 2, worldPreset = 'MIXED', mixed = null, variant = 'base', peace = true }) {
  const preset = PROFILES[profile];
  if (!preset) throw new Error(`profile ${profile}: use 21, 35 or 49`);
  const civs = D.CIVILIZATIONS.map(c => c.id);
  const seats = Array.from({ length: players }, (_, i) => ({ id: `p${i + 1}`, name: `${policy}-${i + 1}`, civilization: civs[(i + seed) % civs.length], policy: mixed ? mixed[i % mixed.length] : policy }));
  resetTrace();
  let state = E.createAlphaGame({ gameId: `a1-${policy}-${profile}-${players}-${seed}`, seed, preset, worldPreset, startingPioneers, ...(['orders6', 'combo'].includes(variant) ? { actionsPerRound: 6 } : {}), players: seats.map(({ id, name, civilization }) => ({ id, name, civilization })) });
  if (variant !== 'base') state = applyVariant(state, variant);
  state = E.beginAlphaPlanning(state);
  return {
    E, D, state, seats, policy, profile, seed, players, preset, variant, peace,
    counters: { commands: 0, rejected: 0, rejectedReasons: {}, byType: {} },
    rows: [], residuals: [], unclassified: [], failedKeys: new Map(), planSeq: 0, yieldSamples: [], displayed: new Map(), planned: new Map(), growthPredictions: [], flowCursor: 0, orderKinds: new Map(), blocked: new Map(),
    snapshots: [], mandCount: new Map(), speculative: { count: 0, by: {} }, committedEnd: flows().length, perf: { commandMs: 0, readyMs: 0 }, roundLog: [],
  };
}

/** Sends one command. Reconciles the actor's (and every civilization's) pool against the tracer flows produced by that command. */
export function send(box, id, command, tag = null) {
  const { E, state } = box;
  // Flows recorded between two commands come from read-only previews (alphaUnitOptions, urbanBlock...) that run the real payment code on a throw-away
  // clone of the state. They never reached the table, so they are dropped (and counted) before this command is measured.
  const fl = flows();
  if (fl.length > (box.committedEnd ?? 0)) { const spec = fl.splice(box.committedEnd ?? 0); box.speculative.count += spec.length; for (const f of spec) { const k = f.frames.filter(n => /Block$|Options$|Forecast$|Output$/.test(n))[0] ?? 'other'; box.speculative.by[k] = (box.speculative.by[k] ?? 0) + 1; } }
  const before = Object.fromEntries(state.players.map(p => [p.playerId, { ...p.resources }]));
  const mark = flows().length;
  const t0 = performance.now();
  let result;
  try { result = E.applyAlphaCommand(state, id, { ...command, expectedVersion: state.version }); } catch (error) { box.counters.rejected++; (box.crashes ??= []).push({ round: state.core.round, id, command: command.type, message: String(error?.stack ?? error).slice(0, 400) }); return { ok: false, error: { message: 'CRASH' } }; }
  box.perf[command.type === 'READY' ? 'readyMs' : 'commandMs'] += performance.now() - t0;
  box.counters.commands++;
  box.counters.byType[command.type] = (box.counters.byType[command.type] ?? 0) + 1;
  if (!result.ok) {
    flows().splice(mark);
    box.counters.rejected++;
    (box.rejectLog ??= []).push({ round: state.core.round, seat: id, type: command.type, action: command.action ?? command.command?.type ?? null, msg: result.error.message, kind: rejectKind(result.error.message) });
    const key = `${command.type}${command.action ? ':' + command.action : ''}:${rejectKind(result.error.message)}`;
    box.counters.rejectedReasons[key] = (box.counters.rejectedReasons[key] ?? 0) + 1;
    return result;
  }
  // Inside a command, the validators (urbanBlock, recruitCountBlock...) also run the payment on a throw-away clone: those flows are speculative too.
  {
    const SPEC = /^(urbanBlock|recruitCountBlock|recruitBlock|buildBlock|settleBlock|alphaUnitOptions|urbanOptions|elevateBlock|researchBlock|governBlock|planFrontierMove|diplomacyBlock|growthForecast|mobilizationBlock)$/;
    const fl2 = flows(), tail = fl2.splice(mark), keep = [];
    for (const f of tail) { const hit = f.frames.find(n => SPEC.test(n)); if (hit) { box.speculative.count++; box.speculative.by[hit] = (box.speculative.by[hit] ?? 0) + 1; } else keep.push(f); }
    fl2.push(...keep);
  }
  const after = Object.fromEntries(result.value.players.map(p => [p.playerId, { ...p.resources }]));
  const traced = Object.fromEntries(result.value.players.map(p => [p.playerId, ZERO8()]));
  const fresh = flows().slice(mark);
  labelFlows(box, fresh);
  for (const f of fresh) add8(traced[f.actor], f.delta);
  for (const pid of Object.keys(after)) {
    const actual = sub8(after[pid], before[pid]);
    const residual = sub8(actual, traced[pid]);
    if (nonzero(residual)) box.residuals.push({ round: state.core.round, phase: state.phase, command: command.type, action: command.action ?? null, player: pid, actual, traced: traced[pid], residual });
  }
  box.state = result.value;
  box.committedEnd = flows().length;
  if (tag) box.orderKinds.get(id)?.push(tag);
  return result;
}

const rejectKind = message => /Recursos insuficientes/.test(message) ? 'RESOURCES' : /Sem ações principais/.test(message) ? 'ORDERS' : /exige .* habitantes/.test(message) ? 'POP' : /Era posterior/.test(message) ? 'ERA' : /avanço/.test(message) ? 'ADVANCE' : /vagas de distrito/.test(message) ? 'SLOTS' : /Revolta/.test(message) ? 'REVOLT' : /ativações|ação planejada/.test(message) ? 'ACTIVATIONS' : 'OTHER';

/** Names the sustenance / military drains: sequence index inside the maintenance of one civilization. */
function labelFlows(box, fresh) {
  const seen = new Map();
  for (const f of fresh) {
    if (f.kind === 'alphaDrain' && f.category === 'upkeepPaid' && f.frames.includes('maintainCivilizations')) {
      const key = `${f.round}:${f.actor}`;
      const pre = preMaint()[key];
      const idx = seen.get(key) ?? (box.drainSeen?.get(key) ?? 0);
      seen.set(key, idx + 1);
      (box.drainSeen ??= new Map()).set(key, idx + 1);
      f.upkeepIndex = pre && idx < pre.cities.length ? 'sustenance' : 'military';
    }
    f.label = classifyFlow(f);
    if (f.label.startsWith('UNCLASSIFIED')) box.unclassified.push({ round: f.round, phase: f.phase, label: f.label, delta: f.delta });
  }
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Population roles and worked hexes (free actions).
function pairsSplit(rest, weights) {
  const pairsTotal = Math.floor(rest / 2);
  const total = weights.art + weights.mer + weights.sch;
  const raw = { artisans: pairsTotal * weights.art / total, merchants: pairsTotal * weights.mer / total, scholars: pairsTotal * weights.sch / total };
  const out = { artisans: Math.floor(raw.artisans), merchants: Math.floor(raw.merchants), scholars: Math.floor(raw.scholars) };
  let left = pairsTotal - out.artisans - out.merchants - out.scholars;
  for (const k of Object.keys(raw).sort((a, b) => (raw[b] - Math.floor(raw[b])) - (raw[a] - Math.floor(raw[a])) || a.localeCompare(b))) { if (left <= 0) break; out[k]++; left--; }
  return { artisans: out.artisans * 2, merchants: out.merchants * 2, scholars: out.scholars * 2, odd: rest - pairsTotal * 2 };
}

function assignPopulation(box, id, P, eraIndex) {
  const { E } = box;
  for (const city of owner(box.state, id).civilization.cities) {
    const state = box.state, stock = me(state, id).resources;
    const meta = state.cities.find(c => c.cityId === city.id);
    if (!meta || meta.status === 'OCCUPIED' || meta.allocationRound === state.core.round) continue;
    const pop = city.population;
    const heldUnits = state.units.filter(u => u.ownerId === id && LAND_KINDS.includes(u.kind) && u.hexId === city.hexId).length;
    // Soldados are the mobilization pool: keep as many as the garrison still to recruit (a Disponível also works).
    const garrisonGap = Math.max(0, P.garrison(eraIndex) - heldUnits);
    const soldiers = Math.min(Math.floor(pop / 3), Math.max(city.workers.soldiers, garrisonGap > 0 ? Math.min(1, garrisonGap) : 0));
    const free = pop - soldiers;
    // Producers work hexes: as many as the Capacity lets the city work (and as it has claimed); more producers only add 1 Alimento per pair.
    const claimed = state.core.map.filter(t => t.controllerCityId === city.id && t.id !== city.hexId).length;
    const capacity = Math.max(1, E.operatingCapacity(state, city.id));
    const hexWorkers = Math.min(free, Math.min(capacity, Math.max(claimed, 0)));
    const wantFood = stock.food < 5 ? 0.8 : stock.food >= 14 ? P.foodShare * 0.5 : P.foodShare;
    const idlePairs = Math.max(0, Math.floor((free * wantFood - hexWorkers) / 2));
    const producersBase = Math.min(free, hexWorkers + idlePairs * 2);
    const rest = free - producersBase;
    const need = k => Math.max(0, ({ wood: 8, wealth: 8, knowledge: 8 })[k] - stock[k]);
    const weights = { art: P.roles.art * (1 + need('wood') / 4), mer: P.roles.mer * (1 + need('wealth') / 6), sch: P.roles.sch * (1 + need('knowledge') / 4) };
    const split = pairsSplit(rest, weights);
    const next = { producers: producersBase + split.odd, artisans: split.artisans, merchants: split.merchants, scholars: split.scholars, soldiers, unassigned: 0 };
    const w = city.workers;
    if (['producers', 'artisans', 'merchants', 'scholars', 'soldiers', 'unassigned'].every(k => next[k] === w[k])) continue;
    if (next.producers < city.workedHexIds.length) {
      const keep = [...city.workedHexIds].sort().slice(0, next.producers);
      send(box, id, { type: 'MANAGE', command: { type: 'ASSIGN_WORKED_HEXES', playerId: id, cityId: city.id, hexIds: keep, expectedVersion: box.state.core.version } });
    }
    send(box, id, { type: 'MANAGE', command: { type: 'ASSIGN_POPULATION', playerId: id, cityId: city.id, workers: next, expectedVersion: box.state.core.version } });
  }
}

function assignWorkedHexes(box, id) {
  const { E, state } = box, o = owner(state, id), rules = state.core.config;
  for (const city of o.civilization.cities) {
    const claimed = state.core.map.filter(t => t.controllerCityId === city.id && t.id !== city.hexId);
    if (!claimed.length) continue;
    const food = me(state, id).resources.food;
    const value = t => { const y = E.tileYieldBreakdown(t, rules).total; return (food < 10 ? y.food * 3 : y.food * 1.5) + y.materials * 1.5 + y.wealth * 1.2 + (box.seats.find(x => x.id === id).policy === 'metalculture' && t.improvement === 'MINE' && t.features.includes('METAL') ? 4 : 0); };
    const pick = [...claimed].sort((a, b) => value(b) - value(a) || a.id.localeCompare(b.id)).slice(0, Math.max(0, city.workers.producers)).map(t => t.id).sort();
    if (pick.join() === [...city.workedHexIds].sort().join()) continue;
    send(box, id, { type: 'MANAGE', command: { type: 'ASSIGN_WORKED_HEXES', playerId: id, cityId: city.id, hexIds: pick, expectedVersion: state.core.version } });
  }
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Food plan: what the maintenance of this round will ask versus what is in the pool plus what is already planned.
export function foodPlan(box, id, extra = {}) {
  const { E, state } = box, o = owner(state, id), p = me(state, id);
  const planned = p.plannedActions.filter(a => a.type === 'URBAN_ACTION');
  const capFood = E.alphaStorageCapacity(state, id).food;
  let stock = p.resources.food - (extra.spendFood ?? 0);
  const producing = new Set();
  let lost = 0;
  if (planned.length) {
    const view = E.urbanOptions(state, id);
    // Resolution order: the Orders resolve slot by slot; spends first is the pessimistic reading, so spends are applied before credits.
    for (const a of planned) if (a.action !== 'PRODUCE') { const row = (view.cities[a.cityId] ?? []).find(r => r.action === a.action && (r.unit ?? null) === (a.unit ?? null) && (!a.build || JSON.stringify(r.build) === JSON.stringify(a.build))); stock -= row?.cost?.food ?? 0; }
    for (const a of planned) if (a.action === 'PRODUCE') { producing.add(a.cityId); const y = E.productionOutput(state, id, a.cityId).output.food; const next = Math.min(capFood, stock + y); lost += stock + y - next; stock = next; }
  }
  const sustenance = o.civilization.cities.reduce((n, c) => n + Math.ceil(c.population / 2), 0);
  const land = state.units.filter(u => u.ownerId === id && state.rules.units[u.kind].domain === 'LAND' && state.rules.units[u.kind].strength > 0).length + (extra.addLand ?? 0)
    + p.plannedActions.filter(a => a.type === 'URBAN_ACTION' && a.action === 'RECRUIT' && LAND_KINDS.includes(a.unit)).reduce((n, a) => n + (a.count ?? 1), 0);
  const military = Math.ceil(land / 2);
  return { stock, sustenance, military, need: sustenance + military, gap: sustenance + military - stock, producing, capFood, lost };
}

// ---------------------------------------------------------------------------------------------------------------------------------
const ERA_IDX = era => ['FOUNDATION', 'EXPANSION', 'CONSOLIDATION', 'CIVILIZATION', 'EMPIRES', 'POWERS', 'ASCENSION'].indexOf(era);

function elevateNeeds(box, id) {
  const { state, D } = box, p = me(state, id), need = new Set();
  const chase = nodeId => { const node = D.ADVANCEMENTS.find(a => a.id === nodeId); if (!node || p.research.includes(nodeId)) return; const missing = node.prerequisites.filter(q => !p.research.includes(q)); if (missing.length) missing.forEach(chase); else need.add(nodeId); };
  for (const meta of state.cities.filter(c => c.currentOwnerId === id)) { const next = D.nextLevel(meta.level), req = next ? D.elevateRequirement(next) : null; if (req) req.advances.forEach(chase); }
  return need;
}
function chaseList(box, id, ids) {
  const { state, D } = box, p = me(state, id), need = new Set();
  const chase = nodeId => { const node = D.ADVANCEMENTS.find(a => a.id === nodeId); if (!node || p.research.includes(nodeId)) return; const missing = node.prerequisites.filter(q => !p.research.includes(q)); if (missing.length) missing.forEach(chase); else need.add(nodeId); };
  ids.forEach(chase);
  return need;
}

function sitesFor(box, id, uo, minGap) {
  const { E, state } = box;
  const cityTiles = state.core.players.flatMap(pl => pl.civilization.cities).map(c => tileOf(state, c.hexId));
  const own = owner(state, id).civilization.cities.map(c => tileOf(state, c.hexId));
  const good = ['PLAINS', 'FOREST', 'COAST', 'HILLS'];
  const score = tile => {
    const near = Math.min(...cityTiles.map(c => E.hexDistance(c, tile)));
    if (tile.ownerId !== null || !good.includes(tile.terrain) || near < minGap) return null;
    return (near === 3 ? 4 : near === 4 ? 3 : 1) + (tile.terrain === 'PLAINS' ? 2 : tile.terrain === 'COAST' ? 1 : 0) - Math.min(...own.map(c => E.hexDistance(c, tile))) * 0.1;
  };
  return Object.keys(uo.moves).map(hex => ({ hex, score: score(tileOf(state, hex)) })).filter(x => x.score !== null).sort((a, b) => b.score - a.score || a.hex.localeCompare(b.hex));
}

/** Every Order the policy would consider right now, scored. Cheap pure checks only; the engine decides on send. */
function candidates(box, id, P) {
  const { E, D, state } = box;
  const p = me(state, id), o = owner(state, id), round = state.core.round;
  const era = ERA_IDX(p.era), cities = o.civilization.cities, nCities = cities.length;
  const out = [];
  const add = (score, key, command, kind, meta = {}) => out.push({ score, key, command, kind, ...meta });
  const view = E.urbanOptions(state, id);
  const plan = foodPlan(box, id);
  const stock = p.resources, cap = E.alphaStorageCapacity(state, id);
  const admin = E.administration(state, id);

  // Targets per resource (working floor); a need is how far the pool is from the floor.
  const target = { food: P.reserve + 6, wood: 6, stone: 4, metal: 1, wealth: 6, knowledge: 6, influence: 4, culture: 2 };
  for (const meta of state.cities.filter(c => c.currentOwnerId === id)) {
    const next = D.nextLevel(meta.level), req = next ? D.elevateRequirement(next) : null;
    if (req) for (const [k, v] of Object.entries(req.cost)) target[k] = Math.max(target[k] ?? 0, Math.min(14, v + 1));
  }
  const need = k => Math.max(0, target[k] - stock[k]);
  const usedBy = new Map();
  const plannedElevate = new Set(p.plannedActions.filter(a => a.type === 'URBAN_ACTION' && a.action === 'ELEVATE').map(a => a.cityId));
  const plannedResearch = new Set(p.plannedActions.filter(a => a.type === 'URBAN_ACTION' && a.action === 'RESEARCH').map(a => a.advancementId));
  for (const a of p.plannedActions) if (a.type === 'URBAN_ACTION' && a.action !== 'RESEARCH') usedBy.set(a.cityId, (usedBy.get(a.cityId) ?? 0) + 1);

  // Austerity: hunger or unpaid pieces last round, or a city in Revolta, freezes recruiting and non-food building until the pool is clean again.
  const lastEvents = state.events.filter(e => e.round === round - 1 && (e.audience === null || e.audience?.includes(id)));
  const austere = lastEvents.some(e => e.type === 'FOOD_SHORTAGE' || e.type === 'UPKEEP_SHORTAGE') || state.cities.some(c => c.currentOwnerId === id && c.mood <= 1);
  box.austerityRounds ??= new Set(); if (austere) box.austerityRounds.add(`${id}:${round}`);
  // Mandatory food. The engine's maintenance order is sustenance -> Crescer (automatic, biggest city first) -> military upkeep, so Crescer can eat
  // the food the pieces need. The policy replays that order on the projected pool and produces (richest food first) until the replay ends with a reserve.
  const fc = E.growthForecast(state, id);
  // `mobilized` = city whose inhabitant leaves to become a piece: its pop drops by one, so it may Crescer again (and eats less).
  // Planned Orders change the maintenance replay: an Elevar lifts the city's ceiling (it may Crescer again), a land Recrutar takes one inhabitant.
  const plannedMobilized = new Map();
  for (const a of p.plannedActions) if (a.type === 'URBAN_ACTION' && a.action === 'RECRUIT' && LAND_KINDS.includes(a.unit)) plannedMobilized.set(a.cityId, (plannedMobilized.get(a.cityId) ?? 0) + (a.count ?? 1));
  const baseCities = fc.cities.map(c => ({ ...c, population: c.population - (plannedMobilized.get(c.cityId) ?? 0), capped: c.capped && !plannedElevate.has(c.cityId) && !plannedMobilized.has(c.cityId) }));
  // `mobilized` = city whose inhabitant leaves to become a piece: its pop drops by one, so it may Crescer again (and eats less).
  const simulate = (S0, extraMil = 0, milOverride = null, mobilized = null) => {
    const list = baseCities.map(c => c.cityId === mobilized ? { ...c, population: c.population - 1, capped: false } : c);
    const sust = list.reduce((n, c) => n + Math.ceil(c.population / 2), 0);
    let st = S0 - sust;
    if (st < 0) return { bad: true, end: st };
    for (const c of [...list].sort((a, b) => b.population - a.population)) if (!c.capped && st >= c.growCost) st -= c.growCost;
    st -= (milOverride ?? plan.military) + extraMil;
    return { bad: st < 0, end: st };
  };
  const reserveEnd = Math.max(1, P.reserve - 2);
  const foodOf = cityId => E.productionOutput(state, id, cityId).output.food;
  const cityMeta = new Map(state.cities.filter(c => c.currentOwnerId === id).map(c => [c.cityId, c]));
  const produceRows = [];
  for (const city of cities) {
    const row = (view.cities[city.id] ?? []).find(r => r.action === 'PRODUCE');
    if (!row || row.blocked) continue;
    const yields = E.productionOutput(state, id, city.id);
    const useful = KEYS.reduce((n, k) => n + Math.min(yields.output[k] + (k === 'metal' ? yields.metal : 0), Math.max(0, cap[k] - stock[k])) * Math.min(1.5, 0.4 + need(k) / 4), 0);
    produceRows.push({ city, row, yields, useful, food: yields.output.food, planned: plan.producing.has(city.id), used: usedBy.get(city.id) ?? 0 });
  }
  produceRows.sort((a, b) => b.food - a.food || b.useful - a.useful || a.city.id.localeCompare(b.city.id));
  let S0 = plan.stock;
  for (const r of produceRows) {
    if (r.planned) continue;
    const bad = simulate(S0).end < reserveEnd;
    const room = Math.max(0, plan.capFood - S0);
    const mandatory = bad && r.food > 0 && r.used === 0 && room > 0;
    const emergency = bad && r.used === 1 && (cityMeta.get(r.city.id)?.mood ?? 0) >= 4 && room > 0 && simulate(S0).end < 0;
    if (mandatory) { add(900 + r.food, `produce:${r.city.id}`, { type: 'URBAN_ACTION', cityId: r.city.id, action: 'PRODUCE' }, 'PRODUCE', { mandatory: true }); S0 = Math.min(plan.capFood, S0 + r.food); }
    else if (emergency) { add(500, `produce2:${r.city.id}`, { type: 'URBAN_ACTION', cityId: r.city.id, action: 'PRODUCE' }, 'PRODUCE', { mandatory: true, second: true }); S0 = Math.min(plan.capFood, S0 + r.food); }
    else if (r.used === 0 && r.useful >= 2.5) add(P.w.produce + Math.min(40, r.useful * 4), `produce:${r.city.id}`, { type: 'URBAN_ACTION', cityId: r.city.id, action: 'PRODUCE' }, 'PRODUCE');
  }

  // Elevar.
  const savingFor = {};
  cities.forEach(city => {
    const list = view.cities[city.id] ?? [];
    const meta = cityMeta.get(city.id);
    const row = list.find(r => r.action === 'ELEVATE');
    if (row && !row.blocked && !plannedElevate.has(city.id) && ((usedBy.get(city.id) ?? 0) === 0 || (meta?.mood ?? 0) >= 5)) add(P.w.elevate, `elevate:${city.id}`, { type: 'URBAN_ACTION', cityId: city.id, action: 'ELEVATE' }, 'ELEVATE');
    else if (row && /Recursos/.test(row.blocked ?? '')) for (const [k, v] of Object.entries(row.cost)) if (v > 0) savingFor[k] = Math.max(savingFor[k] ?? 0, v);
    const capNow = E.operatingCapacity(state, city.id);
    const govUsed = usedBy.get(city.id) ?? 0;
    if (meta && meta.mood <= 3 && govUsed === 0 && (list.find(r => r.action === 'PROMOTE_MOOD') ?? {}).blocked === null && (meta.mood <= 1 || (meta.mood === 2 && capNow >= 2) || (meta.mood === 3 && capNow >= 3))) add(meta.mood <= 1 ? P.w.govern + 60 : P.w.govern - 15, `govern:${city.id}`, { type: 'URBAN_ACTION', cityId: city.id, action: 'PROMOTE_MOOD' }, 'PROMOTE_MOOD');
  });
  const respectSaving = cost => !Object.entries(savingFor).some(([k, v]) => (cost[k] ?? 0) > 0 && stock[k] - cost[k] < v);

  // Build by priority list; contextual boosts for what the pool lacks.
  cities.forEach(city => {
    const list = view.cities[city.id] ?? [];
    const meta = cityMeta.get(city.id);
    const used = usedBy.get(city.id) ?? 0;
    if (used >= 1 && (meta?.mood ?? 0) < 5) return; // a second activation costs 1 Ânimo: only a Próspera city takes it by choice
    if (austere) return;
    const plannedHere = p.plannedActions.filter(a => a.type === 'URBAN_ACTION' && a.action === 'BUILD' && a.cityId === city.id);
    const plannedKeys = new Set(plannedHere.map(a => a.build.kind === 'DISTRICT' ? 'D:' + a.build.district : a.build.kind === 'BUILDING' ? 'B:' + a.build.building : a.build.kind));
    const plannedDistricts = plannedHere.filter(a => a.build.kind === 'DISTRICT' || a.build.kind === 'MARITIME').length;
    // The core refuses a district beyond territory.districtSlots[development-1]; the alpha ladder may promise one more (N5, N7, Federalização). The policy
    // does not walk into it (that would only waste Orders); the mismatch is counted as evidence.
    const coreSlots = state.core.config.territory.districtSlots[(o.civilization.cities.find(c => c.id === city.id)?.development ?? 1) - 1] ?? 0;
    const have = (o.civilization.cities.find(c => c.id === city.id)?.districts.length ?? 0) + plannedDistricts;
    const districtOK = have < coreSlots;
    P.build.forEach(([district, building], rank) => {
      const dRow = list.find(r => r.action === 'BUILD' && r.build.kind === 'DISTRICT' && r.build.district === district);
      const bRow = building ? list.find(r => r.action === 'BUILD' && r.build.kind === 'BUILDING' && r.build.building === building) : null;
      const boost = { AGRARIAN: need('food') * 3, INDUSTRIAL: need('wood') * 3 + need('stone') * 2, COMMERCIAL: need('wealth') * 3, ACADEMIC: need('knowledge') * 3, CULTURAL: need('culture') * 4, ADMINISTRATIVE: admin.load + 1 >= admin.capacity ? 30 : 0, MILITARY: 0 }[district] ?? 0;
      if (bRow && !bRow.blocked && respectSaving(bRow.cost) && !plannedKeys.has('B:' + building)) add(P.w.build - rank * 4 + 6 + Math.min(20, boost), `building:${city.id}:${building}`, { type: 'URBAN_ACTION', cityId: city.id, action: 'BUILD', build: bRow.build }, 'BUILD', { cost: bRow.cost });
      else if (dRow && !dRow.blocked && respectSaving(dRow.cost) && !plannedKeys.has('D:' + district)) {
        if (districtOK) add(P.w.build - rank * 4 + Math.min(20, boost), `district:${city.id}:${district}`, { type: 'URBAN_ACTION', cityId: city.id, action: 'BUILD', build: dRow.build }, 'BUILD', { cost: dRow.cost });
        else (box.slotMismatchSkips ??= []).push({ round, seat: id, cityId: city.id, level: meta?.level, districts: have, coreSlots, alphaSlots: E.districtSlots(state, city.id) });
      }
    });
    // Fortification when the garrison policy asks for it (military) or a threat is near.
    if (P.garrison(era) >= 3 && !plannedKeys.has('FORTIFICATION')) { const f = list.find(r => r.action === 'BUILD' && r.build.kind === 'FORTIFICATION'); if (f && !f.blocked && respectSaving(f.cost)) add(P.w.build + 5, `fort:${city.id}`, { type: 'URBAN_ACTION', cityId: city.id, action: 'BUILD', build: f.build }, 'BUILD', { cost: f.cost }); }
  });

  // Territory: claim around each city up to Capacity+1 hexes; improve claimed hexes (farm when food is short).
  const claims = E.alphaClaimOptions(state, id);
  cities.forEach(city => {
    const capacity = E.activationCapacity(state, city.id);
    const claimed = state.core.map.filter(t => t.controllerCityId === city.id && t.id !== city.hexId);
    const options = claims[city.id] ?? [];
    if (options.length && claimed.length < capacity + 1 && stock.influence >= 1 && !(p.plannedActions.some(a => a.type === 'GOVERNMENT_REFORM') && stock.influence <= 4)) {
      const centre = tileOf(state, city.hexId);
      const rank = t => ['PLAINS', 'FOREST', 'HILLS', 'COAST'].indexOf(t.terrain);
      const metalFirst = t => P.wantMetal && p.research.includes('web-metallurgy') && t.features.includes('METAL') && ['HILLS', 'MOUNTAINS'].includes(t.terrain) ? 0 : 1;
      const best = options.map(h => tileOf(state, h)).sort((a, b) => metalFirst(a) - metalFirst(b) || (rank(a) < 0) - (rank(b) < 0) || rank(a) - rank(b) || E.hexDistance(centre, a) - E.hexDistance(centre, b) || a.id.localeCompare(b.id))[0];
      add(claimed.length < capacity ? P.w.claim : P.w.claim - 40, `claim:${city.id}:${best.id}`, { type: 'MANAGE', command: { type: 'CLAIM_HEX', playerId: id, cityId: city.id, hexId: best.id, expectedVersion: state.core.version } }, 'CLAIM_HEX');
    }
    const IMPROVE = t => t.improvement ? null : t.terrain === 'PLAINS' ? 'FARM' : t.terrain === 'FOREST' ? 'LUMBER_CAMP' : t.terrain === 'HILLS' ? (t.features.includes('METAL') ? 'MINE' : 'QUARRY') : t.terrain === 'COAST' && t.features.includes('FISH') ? 'FISHERY' : null;
    for (const tile of claimed.slice(0, Math.max(1, city.workers.producers))) {
      const imp = IMPROVE(tile);
      if (!imp) continue;
      const cost = state.core.config.territory.improvementCatalog[imp].cost;
      if ((stock.wood + stock.stone) < (cost.materials ?? 0) || stock.wealth < (cost.wealth ?? 0) || !respectSaving({ wood: cost.materials ?? 0 })) continue;
      add(imp === 'FARM' ? (stock.food > 14 ? P.w.improve - 40 : P.w.improve + 8) : imp === 'MINE' ? P.w.improve - (P.wantMetal ? -10 : 25) : P.w.improve - 12, `improve:${tile.id}`, { type: 'MANAGE', command: { type: 'IMPROVE_HEX', playerId: id, hexId: tile.id, improvement: imp, expectedVersion: state.core.version } }, 'IMPROVE_HEX');
    }
  });

  // Research (Avanço Order): Elevar chain first, then the policy's list, then any cheapest affordable node of the current Era.
  const chain = elevateNeeds(box, id), listed = chaseList(box, id, P.research);
  const labs = cities.filter(c => cityMeta.get(c.id)?.status !== 'OCCUPIED').sort((a, b) => b.workers.scholars - a.workers.scholars || a.id.localeCompare(b.id));
  if (labs.length) {
    const ranked = view.research.filter(r => !r.blocked && !plannedResearch.has(r.advancementId)).map(r => {
      const cost = Object.values(r.cost).reduce((a, b) => a + b, 0);
      const heritage = !D.ADVANCEMENTS.some(a => a.id === r.advancementId);
      return { r, s: (chain.has(r.advancementId) ? 60 : 0) + (listed.has(r.advancementId) ? 35 : 0) + (heritage ? 6 : 0) - cost };
    }).sort((a, b) => b.s - a.s || a.r.advancementId.localeCompare(b.r.advancementId));
    const pick = ranked[0];
    if (pick && plannedResearch.size < (P.researchPerRound ?? 1)) {
      // Research competes with building: weight by how much Conhecimento is idle (above cost) and whether it serves Elevar.
      const serves = chain.has(pick.r.advancementId) || listed.has(pick.r.advancementId);
      add(P.w.research + (serves ? 12 : -25) + (stock.knowledge >= 6 ? 6 : 0), `research:${pick.r.advancementId}`, { type: 'URBAN_ACTION', cityId: labs[0].id, action: 'RESEARCH', advancementId: pick.r.advancementId }, 'RESEARCH');
    }
  }

  // Pioneers: found where legal, otherwise walk to the best site; recruit one when the policy wants more cities.
  const unitOpts = E.alphaUnitOptions(state, id);
  const pioneers = state.units.filter(u => u.ownerId === id && u.kind === 'PIONEER').sort((a, b) => a.id.localeCompare(b.id));
  const wantCities = P.wantCities(era);
  const founding = D.legacyFoundingCost ?? state.core.config.territory.foundingCost;
  const ordered = new Set(p.orders.flatMap(o => 'unitIds' in o ? o.unitIds : 'unitId' in o ? [o.unitId] : []));
  const settlers = nCities < wantCities ? pioneers.filter(u => !ordered.has(u.id)).slice(0, 2) : [];
  const claimedBySettle = new Set();
  settlers.forEach((unit, idx) => {
    const uo = unitOpts[unit.id];
    if (!uo) return;
    const here = tileOf(state, unit.hexId);
    const foodAfter = foodPlan(box, id, { spendFood: founding.food });
    const withinAdmin = admin.load + 1 <= admin.capacity;
    const canPay = stock.wealth >= founding.wealth && stock.wood + stock.stone + stock.metal >= founding.materials && simulate(foodAfter.stock).end >= reserveEnd && withinAdmin;
    const hereNear = Math.min(...state.core.players.flatMap(pl => pl.civilization.cities).map(c => E.hexDistance(tileOf(state, c.hexId), here)));
    if (idx === 0 && uo.settleBlock === null && hereNear >= 3) {
      if (canPay) { add(P.w.settle, `settle:${unit.id}`, { type: 'SETTLE', unitId: unit.id, name: `Colonia ${id}-${round}-${nCities + 1}` }, 'SETTLE'); claimedBySettle.add(unit.id); }
      else { const why = !withinAdmin ? 'administration' : stock.wealth < founding.wealth ? 'wealth' : stock.wood + stock.stone + stock.metal < founding.materials ? 'materials' : 'food'; box.blocked.set(`${id}:${round}:settle`, why); }
      return;
    }
    const sites = sitesFor(box, id, uo, 3);
    if (idx === 0 && sites[0]) { add(P.w.settle - 30, `walk:${unit.id}`, { type: 'QUEUE_ORDER', order: { id: `a1-${id}-${round}-${++box.planSeq}`, type: 'MOVE', unitIds: [unit.id], path: uo.moves[sites[0].hex] } }, 'MOVE'); return; }
    // Discovery is a MOVE into a closed Region (entry path + orientation); it reveals the land a site can be found on.
    const entries = (uo.frontier ?? []).filter(e => e.block === null && e.entries.length > 0).map(e => ({ e, entry: [...e.entries].sort((a, b) => a.path.length - b.path.length || a.hexId.localeCompare(b.hexId))[0] })).sort((a, b) => a.entry.path.length - b.entry.path.length || a.e.regionId.localeCompare(b.e.regionId));
    if (entries.length && (idx === 1 || !sites[0])) add(P.w.settle - 45 - idx * 5, `explore:${unit.id}`, { type: 'QUEUE_ORDER', order: { id: `a1-${id}-${round}-${++box.planSeq}`, type: 'MOVE', unitIds: [unit.id], path: entries[0].entry.path, rotation: entries[0].entry.rotations[0] } }, 'EXPLORE');
  });
  if (nCities < wantCities && pioneers.length === 0 && cities[0] && !austere && simulate(plan.stock - 3).end >= reserveEnd + 3) {
    const row = (view.cities[cities[0].id] ?? []).find(r => r.action === 'RECRUIT' && r.unit === 'PIONEER');
    if (row && !row.blocked) add(P.w.pioneer, 'recruit-pioneer', { type: 'URBAN_ACTION', cityId: cities[0].id, action: 'RECRUIT', unit: 'PIONEER' }, 'RECRUIT_PIONEER');
  }

  // Garrison / army.
  const army = state.units.filter(u => u.ownerId === id && LAND_KINDS.includes(u.kind));
  // Steady-state food check for a new piece: all cities producing must still cover sustenance + upkeep of (pieces + 1) with a margin of 2.
  const allProduce = cities.reduce((n, c) => n + foodOf(c.id), 0);
  const upkeepAfter = Math.ceil((army.length + 1) / 2);
  const steady = Math.min(allProduce, plan.capFood) - plan.sustenance - upkeepAfter;
  cities.forEach(city => {
    const here = army.filter(u => u.hexId === city.hexId).length;
    const wantHere = P.garrison(era);
    if (here >= wantHere || round < 3 || austere || steady < 2) return;
    const list = view.cities[city.id] ?? [];
    const kind = ['GUARD', 'INFANTRY'].find(k => list.find(r => r.action === 'RECRUIT' && r.unit === k && !r.blocked));
    if (!kind) return;
    const row = list.find(r => r.action === 'RECRUIT' && r.unit === kind);
    const proj = foodPlan(box, id, { spendFood: row.cost.food ?? 0, addLand: 1 });
    if (simulate(proj.stock, 0, proj.military, city.id).end < reserveEnd) return;
    if (!respectSaving(row.cost)) return;
    add(here === 0 ? P.w.recruit + 25 : P.w.recruit, `garrison:${city.id}:${kind}`, { type: 'URBAN_ACTION', cityId: city.id, action: 'RECRUIT', unit: kind }, 'RECRUIT_MIL', { cost: row.cost });
  });

  // Government reform (Influência Order reserved in the last round of the Era).
  if (E.isReformRound(state)) {
    const opts = E.governmentOptions(state, id);
    if (!opts.planned && !opts.reformedThisEra) {
      const pick = P.govs.map(g => opts.options.find(x => x.government === g && x.block === null)).find(Boolean);
      if (pick) add(P.w.elevate - 20, `gov:${pick.government}`, { type: 'MANAGE', command: { type: 'ADOPT_GOVERNMENT', playerId: id, government: pick.government, expectedVersion: state.core.version } }, 'GOV_REFORM');
    }
  }
  // Civic action: only when Influência is the scarce input.
  if (stock.influence < 2) {
    const c = cities.find(city => (usedBy.get(city.id) ?? 0) === 0 && ((view.cities[city.id] ?? []).find(r => r.action === 'CIVIC_ACTION') ?? { blocked: 'x' }).blocked === null);
    if (c) add(P.w.civic + 30, `civic:${c.id}`, { type: 'URBAN_ACTION', cityId: c.id, action: 'CIVIC_ACTION' }, 'CIVIC_ACTION');
  }
  return out.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
}

// ---------------------------------------------------------------------------------------------------------------------------------
function freeActions(box, id) {
  const { E, state } = box, p = me(state, id);
  if (!p.ambitionsChosen && p.ambitions.length >= 2) send(box, id, { type: 'CHOOSE_AMBITIONS', cardIds: p.ambitions.slice(0, 2) });
  for (const choice of [...me(box.state, id).pendingChoices]) {
    const culture = choice.options.find(o => /culture/.test(o.id));
    send(box, id, { type: 'RESOLVE_CHOICE', choiceId: choice.id, optionId: (culture && me(box.state, id).resources.culture < 5 ? culture : choice.options[0]).id });
  }
  if (box.state.cards.worldEvent && !box.state.cards.worldResponded.includes(id)) send(box, id, { type: 'WORLD_CHOICE', choice: 'RESOURCE' });
  send(box, id, { type: 'SET_DEFENSE_POSTURE', posture: 'HOLD' });
  const p1 = me(box.state, id);
  if (p1.leader && !p1.leader.eraAbilityUsed && E.leaderAbilityBlock(box.state, id) === null && box.state.core.round % box.state.rules.roundsPerEra === 2) send(box, id, { type: 'LEADER_ABILITY' });
  const playable = me(box.state, id).hand.filter(c => box.D.ALPHA_CARDS.find(x => x.id === c)?.timing !== 'REACTION');
  for (const card of playable.slice(0, 2)) if (send(box, id, { type: 'PLAY_CARD', cardId: card }).ok) break;
  for (const t of box.state.treaties.filter(t => t.status === 'PROPOSED' && t.recipientId === id)) send(box, id, { type: 'RESPOND_TREATY', treatyId: t.id, accept: true });
  for (const t of box.state.tradeOffers.filter(t => t.status === 'PROPOSED' && t.recipientId === id)) send(box, id, { type: 'RESPOND_TRADE', offerId: t.id, accept: true });
}

export function planSeat(box, id) {
  const P = POLICIES[box.seats.find(s => s.id === id).policy];
  const { E } = box;
  freeActions(box, id);
  const era = ERA_IDX(me(box.state, id).era);
  assignPopulation(box, id, P, era);
  assignWorkedHexes(box, id);
  const failed = box.failedKeys.get(`${id}:${box.state.core.round}`) ?? new Set();
  box.failedKeys.set(`${id}:${box.state.core.round}`, failed);
  const kinds = [];
  box.orderKinds.set(id, kinds);
  // Sample what a PRODUCE would give per city (yield samples feed the Orders-to-sustain model) and what is displayed for planned costs.
  const o = owner(box.state, id);
  for (const city of o.civilization.cities) {
    const meta = box.state.cities.find(c => c.cityId === city.id);
    const y = E.productionOutput(box.state, id, city.id);
    box.yieldSamples.push({ round: box.state.core.round, seat: id, cityId: city.id, level: meta.level, pop: city.population, mood: meta.mood, capacity: y.capacity, workers: { ...city.workers }, claimed: box.state.core.map.filter(t => t.controllerCityId === city.id && t.id !== city.hexId).length, worked: city.workedHexIds.length, out: { ...y.output, metal: y.output.metal + y.metal }, eats: Math.ceil(city.population / 2) });
  }
  let exhausted = false, lastWanted = null;
  for (let guard = 0; guard < 30; guard++) {
    const usage = E.alphaActionUsage(box.state, id);
    if (usage.used >= usage.limit) { exhausted = true; break; }
    const list = candidates(box, id, P).filter(c => !failed.has(c.key + '#' + usage.used));
    if (!list.length) break;
    let done = false;
    for (const c of list.slice(0, 6)) {
      lastWanted = c;
      // Displayed cost / production BEFORE the Order is planned (what the player reads on the card).
      const displayed = displayedFor(box, id, c);
      const planId = `a1-${id}-${box.state.core.round}-${++box.planSeq}`;
      const command = c.command.type === 'URBAN_ACTION' ? { ...c.command, planId } : c.command;
      const result = send(box, id, command, c.kind);
      if (result.ok) {
        if (c.mandatory) { const mk = `${id}:${box.state.core.round}`; (box.mandCount ??= new Map()).set(mk, (box.mandCount.get(mk) ?? 0) + 1); }
        if (c.command.type === 'URBAN_ACTION') box.displayed.set(planId, { ...displayed, round: box.state.core.round, seat: id, action: c.command.action, kind: c.kind });
        done = true; failed.add(c.key + '#' + usage.used); break;
      }
      failed.add(c.key + '#' + usage.used);
      noteBlocked(box, id, c, result.error.message);
    }
    if (!done) break;
  }
  goalDiagnostics(box, id);
  // Wanted-but-unspent signal: after the loop, were there still positive candidates while the Orders were gone?
  if (exhausted) { const rest = candidates(box, id, P).filter(c => c.score >= 60); box.blocked.set(`${id}:${box.state.core.round}:ordersExhaustedWith`, rest.slice(0, 4).map(c => c.kind).join(',')); }
  return { exhausted, lastWanted: lastWanted?.kind ?? null };
}
/** What stops the civilization's own goals this round (the answer to "what is the bottleneck"): Elevar per city, the next Web node, the next city. */
function goalDiagnostics(box, id) {
  const { E, D, state } = box, p = me(state, id), o = owner(state, id);
  const diag = { elevate: [], research: null, settle: box.blocked.get(`${id}:${state.core.round}:settle`) ?? null };
  for (const city of o.civilization.cities) {
    const meta = state.cities.find(c => c.cityId === city.id);
    const msg = E.elevateBlock(state, id, city.id);
    if (msg === null) { diag.elevate.push('READY'); continue; }
    if (/Metrópole Imperial/.test(msg)) { diag.elevate.push('MAX'); continue; }
    if (/habitantes/.test(msg)) { diag.elevate.push('POP'); continue; }
    if (/Era posterior/.test(msg)) { diag.elevate.push('ERA'); continue; }
    if (/avanço/.test(msg)) { diag.elevate.push('ADVANCE'); continue; }
    const next = D.nextLevel(meta.level), cost = D.elevateRequirement(next).cost;
    const short = Object.keys(cost).filter(k => cost[k] > p.resources[k]);
    diag.elevate.push('RES:' + short.join('+'));
  }
  const view = E.urbanOptions(state, id);
  const open = view.research.filter(r => !r.blocked || /Recursos/.test(r.blocked));
  const afford = open.filter(r => !r.blocked);
  diag.research = open.length === 0 ? 'NONE_AVAILABLE' : afford.length === 0 ? 'KNOWLEDGE' : 'OK';
  (box.goalLog ??= new Map()).set(`${id}:${state.core.round}`, diag);
}
function noteBlocked(box, id, c, message) {
  const key = `${id}:${box.state.core.round}:reject`;
  const list = box.blocked.get(key) ?? [];
  list.push(`${c.kind}:${rejectKind(message)}`);
  box.blocked.set(key, list);
}
function displayedFor(box, id, c) {
  const { E, state } = box;
  const cmd = c.command;
  if (cmd.type !== 'URBAN_ACTION') return { cost: null, output: null };
  const params = { ...(cmd.build ? { build: cmd.build } : {}), ...(cmd.unit ? { unit: cmd.unit } : {}), ...(cmd.advancementId ? { advancementId: cmd.advancementId } : {}) };
  const cost = E.urbanCost(state, id, cmd.cityId, cmd.action, params);
  const out = cmd.action === 'PRODUCE' ? (() => { const y = E.productionOutput(state, id, cmd.cityId); const v = { ...y.output }; v.metal += y.metal; const on = y.onProduce; for (const k of KEYS) v[k] += on[k] ?? 0; return v; })() : null;
  return { cost: { ...cost }, output: out, stock: { ...me(state, id).resources } };
}

// ---------------------------------------------------------------------------------------------------------------------------------
function snapshotSeat(box, id) {
  const { E, state } = box, o = owner(state, id), p = me(state, id);
  const metas = state.cities.filter(c => c.currentOwnerId === id);
  const admin = E.administration(state, id);
  const levels = metas.map(m => ['OUTPOST', 'HAMLET', 'VILLAGE', 'CITY', 'GREAT_CITY', 'METROPOLIS', 'IMPERIAL_METROPOLIS'].indexOf(m.level) + 1);
  return {
    era: p.era, resources: { ...p.resources }, caps: E.alphaStorageCapacity(state, id), cities: o.civilization.cities.length, pop: o.civilization.cities.reduce((n, c) => n + c.population, 0),
    popByCity: o.civilization.cities.map(c => c.population), levels, mood: metas.map(m => m.mood), research: p.research.length, districts: metas.reduce((n, m) => n + m.districts.length, 0), buildings: metas.reduce((n, m) => n + m.buildings.length, 0),
    land: state.units.filter(u => u.ownerId === id && LAND_KINDS.includes(u.kind)).length, ships: state.units.filter(u => u.ownerId === id && state.rules.units[u.kind].domain === 'SEA').length,
    pioneers: state.units.filter(u => u.ownerId === id && u.kind === 'PIONEER').length, adminLoad: admin.load, adminCap: admin.capacity, territory: state.core.map.filter(t => t.ownerId === id).length,
    workers: o.civilization.cities.map(c => ({ ...c.workers })), prestige: p.prestige, government: o.civilization.government,
  };
}

/** Plays the whole match with the scripted policy. Returns rows (one per seat-round) plus reconciliation data. */
export function playPolicyMatch(box, { maxRounds = Infinity, onRound = null } = {}) {
  const { E } = box;
  const t0 = performance.now();
  let safety = 0;
  while (box.state.core.status === 'ACTIVE' && safety++ < 5000 && !(box.crashes?.length)) {
    const round = box.state.core.round, phase = box.state.phase;
    if (round > maxRounds) break;
    // PEACE mode (default): the World's Threats (camps, bands, pirates) are removed between rounds, so only the economy is measured.
    // `--world` keeps them: it is the second matrix that shows what the Threats add (Ânimo lost to assaults, pillage).
    if (box.peace && box.state.threats.length) box.state.threats = [];
    if (phase === 'PLANNING') {
      // Snapshot at the opening of PLANNING (after the previous round's resolution and this round's ROUND_START).
      const open = Object.fromEntries(box.seats.map(s => [s.id, snapshotSeat(box, s.id)]));
      const flowMark = flows().length;
      const eventsMark = box.state.events.length;
      const infos = {};
      for (const id of [...box.state.initiative]) infos[id] = planSeat(box, id);
      const preReady = Object.fromEntries(box.seats.map(s => [s.id, { resources: { ...me(box.state, s.id).resources }, usage: E.alphaActionUsage(box.state, s.id), kinds: [...(box.orderKinds.get(s.id) ?? [])], planned: me(box.state, s.id).plannedActions.map(a => ({ ...a })), growth: E.growthForecast(box.state, s.id) }]));
      const ledgersBefore = null;
      for (const s of box.seats) if (box.state.core.status === 'ACTIVE' && !me(box.state, s.id).ready) send(box, s.id, { type: 'READY' });
      box.roundLog.push({ round, open, preReady, infos, flowMark, eventsMark, stateBeforeReady: null, ledgersBefore });
      onRound?.(box, round);
    } else if (phase === 'ERA_TURN') {
      for (const s of box.seats) for (const choice of [...me(box.state, s.id).pendingChoices]) send(box, s.id, { type: 'RESOLVE_CHOICE', choiceId: choice.id, optionId: choice.options[0].id });
      for (const s of box.seats) if (box.state.core.status === 'ACTIVE' && !me(box.state, s.id).ready) send(box, s.id, { type: 'READY' });
    } else {
      for (const s of box.seats) if (box.state.core.status === 'ACTIVE' && !me(box.state, s.id).ready) send(box, s.id, { type: 'READY' });
    }
    if (safety >= 5000) (box.crashes ??= []).push({ message: 'softlock' });
  }
  flows().splice(box.committedEnd ?? 0);
  box.totalMs = performance.now() - t0;
  // Final snapshot (after the last READY the match is FINISHED; flows of the last resolution are in the tracer).
  box.finalOpen = Object.fromEntries(box.seats.map(s => [s.id, snapshotSeat(box, s.id)]));
  return box;
}

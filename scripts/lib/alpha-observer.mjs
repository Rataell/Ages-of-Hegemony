/* global structuredClone */
// Read-only observer for the headless bots: attaches to playMatch's `scenario` hook (called at every PLANNING start) and records
// what the investigation needs (threat timeline, contact milestones, Elevar bottlenecks, soldiers, Legado probes).
// It never changes behaviour unless a `mutate` variant is passed (economist variants), and says so in the output.
import * as E from '../../packages/game-engine/dist/index.js';
import * as D from '../../packages/game-domain/dist/index.js';

const ERAS = D.AlphaEraSchema.options;
const LEVELS = D.CityLevelSchema.options;
const tile = (state, id) => state.core.map.find(t => t.id === id);
const dist = (state, a, b) => E.hexDistance(tile(state, a), tile(state, b));

export function makeObserver({ variant = 'baseline' } = {}) {
  const data = {
    variant,
    threats: {}, contact: { firstContact: null, firstSharedBorder: null, firstDiplomacy: null, firstHostility: null, firstPvP: null, firstWorldAssault: null, capitalDistance: null },
    elevate: { cityRounds: 0, byFirstBlock: { pop: 0, era: 0, advance: 0, cost: 0, ready: 0 }, anyBlock: { pop: 0, era: 0, advance: 0, cost: 0 }, readyNotElevated: 0, readyElevated: 0, popBelowCeilingNoFood: 0, popBelowCeiling: 0, atCeiling: 0 },
    firstLevel: {}, soldiers: { samples: [] }, legacyProbe: { attempts: 0, reasons: {}, ok: 0 }, perRound: [],
  };
  const prevLevels = new Map(); // cityId -> {level, ready}
  const probed = new Set();

  function observe(box) {
    const st = box.state, r = st.core.round, c = data.contact;
    // ---- threats
    for (const t of st.threats) {
      const rec = data.threats[t.id] ??= { id: t.id, kind: t.kind, createdRound: t.createdRound, home: t.homeHexId, firstSeenRound: r, launchedRound: null, goneRound: null, levels: [], pathLenAtFirstSight: null, nearestCityAtSpawn: null };
      if (rec.nearestCityAtSpawn === null) rec.nearestCityAtSpawn = Math.min(...st.core.players.flatMap(o => o.civilization.cities.map(ci => dist(st, ci.hexId, t.homeHexId))));
      if (t.status === 'CAMPED' && rec.pathLenAtFirstSight === null && t.kind === 'CAMP') { try { rec.pathLenAtFirstSight = E.landTarget(st, t)?.path.length ?? null; } catch { /* ignore */ } }
      if (t.status === 'MARCHING' && rec.launchedRound === null) rec.launchedRound = r;
      if (!rec.levels.length || rec.levels.at(-1)[1] !== t.level) rec.levels.push([r, t.level]);
      rec.lastSeen = r;
    }
    for (const rec of Object.values(data.threats)) if (rec.goneRound === null && !st.threats.some(t => t.id === rec.id)) rec.goneRound = r;
    // ---- contact milestones (observed at planning start: they happened by the end of the previous round)
    const mark = (key, cond) => { if (c[key] === null && cond) c[key] = r; };
    mark('firstContact', st.players.some(p => p.contacts.length > 0));
    if (c.firstSharedBorder === null) {
      const owner = new Map(st.core.map.map(t => [t.id, t.ownerId]));
      outer: for (const t of st.core.map) if (t.ownerId) for (const n of E.hexNeighbors(t)) { const o = owner.get(E.hexId(n)); if (o && o !== t.ownerId) { c.firstSharedBorder = r; break outer; } }
    }
    mark('firstDiplomacy', st.treaties.length > 0 || st.tradeOffers.length > 0 || st.routes.some(rt => { const a = st.core.players.find(o => o.civilization.cities.some(ci => ci.id === rt.fromCityId))?.id, b = st.core.players.find(o => o.civilization.cities.some(ci => ci.id === rt.toCityId))?.id; return a !== b; }));
    mark('firstHostility', st.wars.length > 0);
    mark('firstPvP', st.battles.some(b => b.attackerId !== D.WORLD_ID && b.defenderId !== D.WORLD_ID));
    mark('firstWorldAssault', st.battles.some(b => b.attackerId === D.WORLD_ID));
    if (c.capitalDistance === null && st.core.players.length >= 2) {
      const caps = st.core.players.map(o => o.civilization.cities[0]?.hexId).filter(Boolean);
      const ds = []; for (let i = 0; i < caps.length; i++) for (let j = i + 1; j < caps.length; j++) ds.push(dist(st, caps[i], caps[j]));
      c.capitalDistance = { min: Math.min(...ds), mean: +(ds.reduce((a, b) => a + b, 0) / ds.length).toFixed(1) };
    }
    // ---- Elevar bottlenecks and first level reached
    for (const o of st.core.players) {
      const progress = st.players.find(p => p.playerId === o.id);
      for (const city of o.civilization.cities) {
        const meta = st.cities.find(m => m.cityId === city.id); if (!meta) continue;
        const lv = LEVELS.indexOf(meta.level) + 1;
        data.firstLevel[lv] ??= r;
        const prev = prevLevels.get(city.id);
        if (prev?.ready) { if (lv > prev.lv) data.elevate.readyElevated++; else data.elevate.readyNotElevated++; }
        const next = D.nextLevel(meta.level), req = next ? D.elevateRequirement(next) : null;
        let ready = false;
        if (req) {
          data.elevate.cityRounds++;
          const fails = [];
          if (city.population < req.minPopulation) fails.push('pop');
          if (ERAS.indexOf(progress.era) < ERAS.indexOf(req.era)) fails.push('era');
          if (req.advances.some(id => !progress.research.includes(id))) fails.push('advance');
          if (!E.alphaCanAfford(st, o.id, req.cost)) fails.push('cost');
          for (const f of fails) data.elevate.anyBlock[f]++;
          data.elevate.byFirstBlock[fails[0] ?? 'ready']++;
          ready = fails.length === 0;
          if (city.population < D.populationCeiling(meta.level)) { data.elevate.popBelowCeiling++; if (progress.resources.food < 3) data.elevate.popBelowCeilingNoFood++; } else data.elevate.atCeiling++;
        }
        prevLevels.set(city.id, { lv, ready });
      }
      // ---- soldiers
      const cities = o.civilization.cities, pop = cities.reduce((n, ci) => n + ci.population, 0);
      const soldiers = cities.reduce((n, ci) => n + ci.workers.soldiers, 0);
      const pieces = st.units.filter(u => u.ownerId === o.id && state_strength(st, u) > 0).length;
      const degraded = cities.filter(ci => { const m = st.cities.find(x => x.cityId === ci.id); return m && D.effectiveLevel(m.level, ci.population) !== m.level; }).length;
      data.soldiers.samples.push({ round: r, id: o.id, pop, soldiers, pieces, cities: cities.length, degraded, food: progress.resources.food });
    }
    // ---- Legado probe: why can't a human just build a Obra de Legado when Era IV+ opens?
    const eraIdx = ERAS.indexOf(st.players[0].era);
    if (eraIdx >= 3 && (r - 1) % 5 === 0) {
      for (const p of st.players) {
        for (const proj of D.LEGACY_WORKS) {
          if (st.legacyWorks.some(x => x.workId === proj.id && x.ownerId !== p.playerId)) continue;
          const cities = st.core.players.find(o => o.id === p.playerId).civilization.cities;
          let best = null;
          for (const ci of cities) {
            const res = E.applyAlphaCommand(structuredClone(st), p.playerId, { type: 'ADVANCE_LEGACY_WORK', expectedVersion: st.version, workId: proj.id, cityId: ci.id });
            if (res.ok) { best = 'OK'; break; } best ??= res.error.message;
          }
          if (best === null) continue;
          data.legacyProbe.attempts++;
          if (best === 'OK') data.legacyProbe.ok++; else data.legacyProbe.reasons[best] = (data.legacyProbe.reasons[best] ?? 0) + 1;
          void probed;
        }
      }
    }
  }
  const state_strength = (st, u) => st.rules.units[u.kind].strength;
  return { data, hook(box, when) { if (when !== 'round-start') return; observe(box); mutate(box); } };

  // What a deliberate human could do through the same command surface (never state surgery): `garrison` keeps 3 Infantaria and a wall in
  // every city from round 4; `scout` walks the Explorer toward the nearest rival capital every round; `nothreat` clears the world threats.
  function send(box, id, command) {
    const res = E.applyAlphaCommand(box.state, id, { ...command, expectedVersion: box.state.version });
    if (res.ok) box.state = res.value;
    return res.ok;
  }
  function humanLike(box) {
    const st = box.state, r = st.core.round;
    if (variant === 'garrison' && r >= 4) {
      for (const o of st.core.players) for (const city of o.civilization.cities) {
        const here = box.state.units.filter(u => u.ownerId === o.id && u.hexId === city.hexId && u.kind === 'INFANTRY').length;
        const meta = box.state.cities.find(m => m.cityId === city.id);
        if (meta && meta.fortification.level === 'NONE') send(box, o.id, { type: 'URBAN_ACTION', cityId: city.id, action: 'BUILD', build: { kind: 'FORTIFICATION' } });
        else if (here < 3) send(box, o.id, { type: 'URBAN_ACTION', cityId: city.id, action: 'RECRUIT', unit: 'INFANTRY' });
      }
    }
    if (variant === 'scout') {
      for (const o of st.core.players) {
        const explorer = box.state.units.find(u => u.ownerId === o.id && u.kind === 'PIONEER'); if (!explorer) continue;
        const rivals = box.state.core.players.filter(x => x.id !== o.id && x.civilization.cities[0]);
        const goal = rivals.map(x => x.civilization.cities[0].hexId).sort((a, b) => dist(box.state, explorer.hexId, a) - dist(box.state, explorer.hexId, b))[0];
        const opts = E.alphaUnitOptions(box.state, o.id)[explorer.id]; if (!goal || !opts?.moves) continue;
        const step = Object.keys(opts.moves).map(h => ({ h, d: dist(box.state, h, goal) })).sort((a, b) => a.d - b.d || a.h.localeCompare(b.h))[0];
        if (step && step.d > 0 && step.d < dist(box.state, explorer.hexId, goal)) send(box, o.id, { type: 'QUEUE_ORDER', order: { id: `scout-${o.id}-${r}`, type: 'MOVE', unitIds: [explorer.id], path: opts.moves[step.h] } });
      }
    }
  }

  function mutate(box) {
    if (variant === 'baseline') return;
    humanLike(box);
    const st = box.state;
    if (variant === 'nothreat') st.threats = [];
    if (variant.startsWith('economist')) {
      if (variant.includes('nothreat')) st.threats = [];
      for (const p of st.players) {
        const cap = E.alphaStorageCapacity(st, p.playerId);
        const gain = {}; for (const k of ['wood', 'stone', 'metal', 'wealth', 'knowledge', 'influence']) gain[k] = Math.max(0, (cap[k] ?? 0) - p.resources[k]);
        if (variant.includes('food')) gain.food = Math.max(0, (cap.food ?? 0) - p.resources.food);
        E.alphaGain(st, p.playerId, gain, { category: 'other', enforceStorage: false });
      }
    }
  }
}

/** Final-state summaries that do not need hooks. */
export function finalFacts(result) {
  const st = result.state, w = D.WORLD_ID;
  const worldBattles = st.battles.filter(b => b.attackerId === w).map(b => ({ round: b.round, hex: b.hexId, defender: b.defenderId, defenders: b.defenderUnits.length, city: b.fortification !== null, fort: b.fortification?.before.level ?? null, outcome: b.outcome, delta: b.delta }));
  const pvp = st.battles.filter(b => b.attackerId !== w && b.defenderId !== w).map(b => ({ round: b.round, attacker: b.attackerId, defender: b.defenderId, outcome: b.outcome, delta: b.delta }));
  const playerVsWorld = st.battles.filter(b => b.defenderId === w).map(b => ({ round: b.round, outcome: b.outcome }));
  const events = {}; for (const e of st.events) (events[e.type] ??= []).push(e.round);
  const log = st.telemetry.roundLog;
  const orders = {}; for (const row of log) for (const [k, v] of Object.entries(row.orders)) orders[k] = (orders[k] ?? 0) + v;
  const legacyRounds = log.filter(row => (row.orders.LEGACY ?? 0) > 0).map(row => row.round);
  return { worldBattles, pvp, playerVsWorld, events: Object.fromEntries(Object.entries(events).filter(([k]) => /THREAT|WAR|TREAT|CONTACT|HEGEMONY|PROJECT/.test(k))), orders, legacyRounds, counters: result.ctx.counters, prestigeBySource: st.telemetry.prestigeBySource, unitRecruitment: st.telemetry.unitRecruitment, winner: st.winner ?? null, finalPrestige: Object.fromEntries(st.players.map(p => [p.playerId, p.prestige])) };
}

// Alpha V1.2 audit (lane A2+D): effective requirements of city levels N1–N7 and the path to N3 / N5 / N7.
// Reads the REAL tables from the built packages (ELEVATE_TABLE, CITY_LADDER, WEB_ADVANCES) and, with --drive, plays a
// single-capital agent through applyAlphaCommand to validate the arithmetic. Read-only on source; needs `npm run compile` output (dist).
//
//   node scripts/alpha-city-path.mjs                    # analytic tables + minimum path
//   node scripts/alpha-city-path.mjs --drive            # + engine drive (3 policies, default civ meridia, seeds 1..3)
//   node scripts/alpha-city-path.mjs --drive --civ=saren --seeds=1,2 --pairs=0,1,2 --rounds=35 --quiet
import * as E from '../packages/game-engine/dist/index.js';
import * as D from '../packages/game-domain/dist/index.js';
/* global structuredClone */

const arg = (name, fallback) => { const hit = process.argv.find(a => a.startsWith(`--${name}=`)); return hit ? hit.split('=')[1] : fallback; };
const flag = name => process.argv.includes(`--${name}`);
const ERAS = D.AlphaEraSchema.options, ROUNDS_PER_ERA = 5;
const LEVELS = D.CityLevelSchema.options;
const NAME = ['N1 Posto', 'N2 Povoado', 'N3 Vila', 'N4 Cidade', 'N5 Grande Cidade', 'N6 Metrópole', 'N7 Metrópole Imperial'];
const byId = id => D.ADVANCEMENTS.find(a => a.id === id);
const eraStartRound = era => ERAS.indexOf(era) * ROUNDS_PER_ERA + 1;
const pad = (v, n) => String(v).padStart(n);
const ZERO = () => Object.fromEntries(D.ALPHA_RESOURCE_KEYS.map(k => [k, 0]));
const add = (a, b) => { const out = { ...a }; for (const k of Object.keys(b)) out[k] = (out[k] ?? 0) + b[k]; return out; };
const show = pool => Object.entries(pool).filter(([, v]) => v).map(([k, v]) => `${v} ${k}`).join(', ') || '—';

/** Every Web advance needed (prerequisites included; the first of an "any" list) for a set of advance ids. */
function closure(ids) {
  const set = new Set();
  const visit = id => {
    if (set.has(id)) return;
    const node = byId(id);
    for (const pre of node.prerequisites) visit(pre);
    if (node.prerequisitesAny.length && !node.prerequisitesAny.some(x => set.has(x))) visit(node.prerequisitesAny[0]);
    set.add(id);
  };
  ids.forEach(visit);
  return [...set];
}

/** Cumulative requirement to stand at level index `target` (0 = N1): Elevar table rows for N2..target. */
export function pathTo(target) {
  const rows = D.ELEVATE_TABLE.slice(0, target);
  const advances = closure(rows.flatMap(r => r.advances));
  const webKnowledge = advances.reduce((n, id) => n + byId(id).cost.knowledge, 0);
  const elevateCost = rows.reduce((acc, r) => add(acc, r.cost), ZERO());
  const last = rows.at(-1);
  const maxAdvEra = Math.max(0, ...advances.map(id => ERAS.indexOf(byId(id).era)));
  const eraGate = Math.max(0, ...rows.map(r => ERAS.indexOf(r.era)), maxAdvEra);
  const startPop = 2;                       // capital at founding (2 inhabitants: 1 Produtor + 1 Erudito)
  const growths = Math.max(0, (last?.minPopulation ?? startPop) - startPop);
  const growFood = growths * 3, growFoodGranary = growths * 2;
  return { rows, advances, webKnowledge, elevateCost, orders: { research: advances.length, elevate: rows.length }, eraGate, earliestRound: eraStartRound(ERAS[eraGate]), growths, growFood, growFoodGranary, minPop: last?.minPopulation ?? startPop };
}

/** Sustenance paid by a single capital that grows 1 inhabitant per round from 2 up to `pop` (ceil(pop/2) each round). */
function sustenanceUntil(pop) { let total = 0; for (let p = 2; p < pop; p++) total += Math.ceil(p / 2); return total; }

function analytic() {
  console.log('== Tabelas reais: escada de cidades (CITY_LADDER) e Elevar (ELEVATE_TABLE) ==');
  console.log('Nível                    | pop mín | Capac. | vagas | alcance | teto de pop. | Era mín (Elevar) | rodada mín | custo do Elevar            | avanço(s) da Teia');
  D.CITY_LADDER.forEach((step, i) => {
    const req = i === 0 ? null : D.ELEVATE_TABLE[i - 1];
    console.log(`${NAME[i].padEnd(24)} | ${pad(step.minPopulation, 7)} | ${pad(step.capacity, 6)} | ${pad(step.slots, 5)} | ${pad(step.supplyReach, 7)} | ${pad(D.populationCeiling(step.level), 12)} | ${(req ? req.era : 'FOUNDATION').padEnd(16)} | ${pad(eraStartRound(req ? req.era : 'FOUNDATION'), 10)} | ${(req ? show(req.cost) : '— (capital inicial)').padEnd(26)} | ${req ? req.advances.join('+') : '—'}`);
  });
  console.log('\n== Caminho mínimo cumulativo (todos os Elevar até o nível, avanços com pré-requisitos) ==');
  console.log('alvo                   | avanços | Conhecimento da Teia | Elevar (recursos acumulados)                      | Ordens mín (pesq+elevar) | rodada mín por Era | Crescer (alim.) 3/2 | sustento até lá');
  for (const target of [2, 4, 6]) {
    const p = pathTo(target);
    console.log(`${NAME[target].padEnd(22)} | ${pad(p.advances.length, 7)} | ${pad(p.webKnowledge + p.elevateCost.knowledge, 20)} | ${show(p.elevateCost).padEnd(49)} | ${pad(p.orders.research + p.orders.elevate, 24)} | ${pad(p.earliestRound, 18)} | ${pad(p.growFood, 8)}/${String(p.growFoodGranary).padEnd(9)} | ${sustenanceUntil(p.minPop)}`);
  }
  console.log('\nLeitura: a Era é o portão (N3 só na rodada 6, N5 na 16, N7 na 31). Crescimento é no máximo +1 hab./cidade/rodada (Crescer na manutenção).');
  for (const target of [2, 4, 6]) {
    const p = pathTo(target);
    console.log(`\n${NAME[target]} — avanços na ordem de pré-requisito:`);
    console.log('  ' + p.advances.map(id => `${id.replace('web-', '')}(${byId(id).era.slice(0, 3)}:${byId(id).cost.knowledge}K)`).join(' → '));
  }
  console.log('\n== Fontes de Conhecimento por Produzir (1 Ordem Cidade) com a regra do motor ==');
  console.log('  Eruditos: 1 Conhecimento por PAR; no máximo 2 pares (4 Eruditos) sem Biblioteca — a Biblioteca só libera o 3º par em diante (alpha-city.ts pairs()).');
  console.log('  Distrito Acadêmico: +1 fixo por Produzir. Biblioteca/Arquivo/Academia: nenhum +1 fixo (só liberam pares / limite de estoque).');
  console.log('  Passivo da civilização: +1 Conhecimento por rodada para meridia, thalos, orinth, solenne, dravik (5 das 10 jogáveis); as outras 5 não têm.');
}

/* ───────────────────────────── engine drive ───────────────────────────── */

/**
 * A single-capital agent. `pairs` = Eruditos in pairs it keeps (0..2). It never expands: the point is the arithmetic of one
 * city climbing the ladder, with the real Orders, costs, Ânimo, food and Era gates of the engine.
 */
function drive({ seed, civ, pairs, rounds, target, quiet, policyMood = 5, policyFoodReserve = 3, policyGovernAt = 3 }) {
  const rival = D.CIVILIZATIONS.map(c => c.id).find(id => id !== civ);
  let state = E.beginAlphaPlanning(E.createAlphaGame({ gameId: `path-${seed}`, seed, preset: 'STANDARD', worldPreset: 'MIXED', players: [{ id: 'p1', name: 'Foco', civilization: civ }, { id: 'p2', name: 'Parado', civilization: rival }] }));
  const me = () => state.players.find(p => p.playerId === 'p1');
  const send = (id, command) => {
    const r = E.applyAlphaCommand(state, id, { ...command, expectedVersion: state.version });
    if (r.ok) state = r.value;
    return r;
  };
  const targetRows = D.ELEVATE_TABLE.slice(0, target);
  const wanted = closure(targetRows.flatMap(r => r.advances));
  const log = [], blocked = {}, orders = { PRODUCE: 0, ELEVATE: 0, RESEARCH: 0, CLAIM: 0, IMPROVE: 0, BUILD: 0, GOVERN: 0, CIVIC: 0 };
  const milestone = {};
  const free = id => {
    const p = state.players.find(x => x.playerId === id);
    if (!p.ambitionsChosen && p.ambitions.length >= 2) send(id, { type: 'CHOOSE_AMBITIONS', cardIds: p.ambitions.slice(0, 2) });
    for (const c of [...state.players.find(x => x.playerId === id).pendingChoices]) send(id, { type: 'RESOLVE_CHOICE', choiceId: c.id, optionId: c.options[0].id });
    if (state.cards.worldEvent && !state.cards.worldResponded.includes(id)) send(id, { type: 'WORLD_CHOICE', choice: 'RESOURCE' });
  };
  const note = reason => { blocked[reason] = (blocked[reason] ?? 0) + 1; };
  let guard = 0;
  while (state.core.status === 'ACTIVE' && state.core.round <= rounds && guard++ < 400) {
    if (state.phase === 'ERA_TURN') { for (const id of ['p1', 'p2']) { free(id); } for (const id of ['p1', 'p2']) if (!state.players.find(p => p.playerId === id).ready) send(id, { type: 'READY' }); continue; }
    if (state.phase !== 'PLANNING') { for (const id of ['p1', 'p2']) if (!state.players.find(p => p.playerId === id).ready) send(id, { type: 'READY' }); continue; }
    free('p1'); free('p2');
    const round = state.core.round, meta = () => state.cities.find(c => c.currentOwnerId === 'p1'), cityOf = () => state.core.players[0].civilization.cities[0];
    const reserved = ZERO();
    const resources = () => { const r = { ...me().resources }; for (const k of Object.keys(reserved)) r[k] -= reserved[k]; return r; };
    const afford = cost => { const r = resources(); return Object.keys(cost).every(k => (cost[k] ?? 0) <= (r[k] ?? 0) || ['wood', 'stone', 'metal'].includes(k) && false); };
    const reserve = cost => { for (const k of Object.keys(cost)) reserved[k] = (reserved[k] ?? 0) + cost[k]; };
    const view = () => E.urbanOptions(state, 'p1');
    const row = (action, extra = {}) => (view().cities[cityOf().id] ?? []).find(o => o.action === action && Object.entries(extra).every(([k, v]) => JSON.stringify(o[k]) === JSON.stringify(v)));
    const plan = (action, extra, bucket) => {
      const option = action === 'RESEARCH' ? view().research.find(o => o.advancementId === extra.advancementId) : row(action, extra);
      if (!option) return false;
      if (option.blocked) { note(`${action}: ${option.blocked}`); return false; }
      if (!afford(option.cost)) { note(`${action}: recurso reservado por plano anterior`); return false; }
      const r = send('p1', { type: 'URBAN_ACTION', cityId: cityOf().id, action, ...extra });
      if (!r.ok) { note(`${action} rejeitado: ${r.error.message}`); return false; }
      reserve(option.cost); orders[bucket]++; return true;
    };
    // What the next Elevar still lacks, plus a working floor: it steers roles, hexes and districts.
    const lvl = LEVELS.indexOf(meta().level), nextRow = D.ELEVATE_TABLE[lvl] ?? null;
    const need = { food: 7, wood: 4, stone: 2, wealth: 2, knowledge: 0, influence: 1, ...(nextRow ? Object.fromEntries(Object.entries(nextRow.cost).map(([k, v]) => [k, v + 1])) : {}) };
    const deficit = Object.fromEntries(Object.keys(ZERO()).map(k => [k, Math.max(0, (need[k] ?? 0) - me().resources[k])]));
    const city = cityOf(), pop = city.population;
    const claimed = () => state.core.map.filter(t => t.controllerCityId === city.id && t.id !== city.hexId);
    const value = t => { const y = E.tileYieldBreakdown(t, state.core.config).total, stone = t.terrain === 'HILLS' || t.terrain === 'MOUNTAINS'; return y.food * (1 + deficit.food * 0.4) + y.materials * (1 + (stone ? deficit.stone : deficit.wood) * 0.4) + y.wealth * (1 + deficit.wealth * 0.4); };
    const capacity = E.activationCapacity(state, city.id);
    const workedN = Math.min(capacity, claimed().length);
    // Population: search the role split (Eruditos in pairs up to the policy, pairs of Artesãos / Mercadores) that the engine itself says
    // yields the most of what the next Elevar lacks while food income still covers sustenance + the next Crescer.
    const roleScore = (s_, a_, m_) => {
      const producers = pop - s_ - a_ - m_; if (producers < Math.max(1, workedN)) return -1e9;
      const trial = structuredClone(state), trialCity = trial.core.players[0].civilization.cities[0];
      trialCity.workers = { producers, artisans: a_, merchants: m_, scholars: s_, soldiers: 0, unassigned: 0 };
      const out = E.cityYield(trial, trialCity.id).output, eats = Math.ceil((pop + 1) / 2);
      const foodOk = me().resources.food + out.food - eats >= (policyFoodReserve);
      return (foodOk ? 0 : -1000) + out.food * (1 + deficit.food * 0.5) + out.wood * (1 + deficit.wood * 0.5) + out.stone * (1 + deficit.stone * 0.5) + out.wealth * (1 + deficit.wealth * 0.5) + out.knowledge * (1 + deficit.knowledge * 0.5 + (pairs ? 1 : 0)) + out.influence + out.culture;
    };
    let best = { s: 0, a: 0, m: 0, score: -1e12 };
    for (let s_ = 0; s_ <= pairs * 2; s_ += 2) for (let a_ = 0; a_ <= 4; a_ += 2) for (let m_ = 0; m_ <= 4; m_ += 2) { const score = roleScore(s_, a_, m_); if (score > best.score) best = { s: s_, a: a_, m: m_, score }; }
    const scholars = best.s, artisans = best.a, merchants = best.m;
    const next = { producers: pop - scholars - artisans - merchants, artisans, merchants, scholars, soldiers: 0, unassigned: 0 };
    if (Object.keys(next).some(k => next[k] !== city.workers[k])) send('p1', { type: 'MANAGE', command: { type: 'ASSIGN_POPULATION', playerId: 'p1', cityId: city.id, workers: next, expectedVersion: state.core.version } });
    const setHexes = () => { const pick = [...claimed()].sort((a, b) => value(b) - value(a) || a.id.localeCompare(b.id)).slice(0, E.activationCapacity(state, city.id)).map(t => t.id).sort(); if (pick.length && pick.join() !== [...cityOf().workedHexIds].sort().join()) send('p1', { type: 'MANAGE', command: { type: 'ASSIGN_WORKED_HEXES', playerId: 'p1', cityId: city.id, hexIds: pick, expectedVersion: state.core.version } }); };
    setHexes();
    const orderLeft = () => E.alphaActionUsage(state, 'p1').limit - E.alphaActionUsage(state, 'p1').used;
    let activations = 0;
    // 0) Território first: claim up to Capacidade (1 Influência + 1 Ordem Cidade each).
    if (orderLeft() > 0 && claimed().length < E.activationCapacity(state, city.id) && me().resources.influence >= 1) {
      const options = E.alphaClaimOptions(state, 'p1')[city.id] ?? [];
      const best = options.map(h => state.core.map.find(t => t.id === h)).sort((a, b) => value(b) - value(a) || a.id.localeCompare(b.id))[0];
      if (best) { const r = send('p1', { type: 'MANAGE', command: { type: 'CLAIM_HEX', playerId: 'p1', cityId: city.id, hexId: best.id, expectedVersion: state.core.version } }); if (r.ok) { orders.CLAIM++; setHexes(); } else note(`CLAIM: ${r.error.message}`); }
    }
    // Ânimo first: an Abalada city has ONE activation, so Governar (Cultura 1 / Riqueza 2 per level) takes it before the city falls into Revolta.
    const foodSafe = me().resources.food - Math.ceil(pop / 2) >= 3;
    const govern = meta().mood <= policyGovernAt && foodSafe && orderLeft() > 0 && plan('PROMOTE_MOOD', {}, 'GOVERN');
    if (govern) activations++;
    // Activation budget: 1 per round is free; a 2nd costs 1 Ânimo (so only from Próspera). Produzir is the food engine and comes first when the
    // stock cannot carry the round's sustenance; otherwise Elevar (when legal) takes the activation and Produzir the 2nd one if Ânimo allows.
    const canSecond = () => meta().mood >= policyMood && activations < 2;
    const tryProduce = () => orderLeft() > 0 && (activations === 0 || canSecond()) && plan('PRODUCE', {}, 'PRODUCE') && ++activations;
    // Elevar is worth the Ânimo of a second activation whenever the city is Estável (the drop is recoverable, the level is not lost).
    const tryElevate = () => lvl < target && orderLeft() > 0 && (activations === 0 || (meta().mood >= 4 && activations < 2)) && plan('ELEVATE', {}, 'ELEVATE') && ++activations;
    const tryDistrict = () => {
      const want = [['INDUSTRIAL', deficit.wood + deficit.stone > 0], ['AGRARIAN', deficit.food > 0], ['COMMERCIAL', deficit.wealth > 0], ['ACADEMIC', pairs > 0 || deficit.knowledge > 0]];
      for (const [district, wanted_] of want) {
        if (!wanted_ || meta().districts.includes(district) || orderLeft() <= 0 || !(activations === 0 || canSecond())) continue;
        if (plan('BUILD', { build: { kind: 'DISTRICT', district } }, 'BUILD')) { activations++; return true; }
      }
      return false;
    };
    if (!govern) {
      if (!foodSafe) { tryProduce(); tryElevate(); tryDistrict(); } else { tryElevate(); tryProduce(); tryDistrict(); }
    }
    // Avanços: the chain toward the target, cheapest Era-eligible first; keep Conhecimento for the next Elevar. (Avanço is its own Order, not an activation.)
    const owned = new Set(me().research);
    const holdK = nextRow ? nextRow.cost.knowledge : 0;
    for (const id of wanted.filter(x => !owned.has(x))) {
      if (orderLeft() <= 0) break;
      const node = byId(id), cost = E.advanceCost(state, 'p1', id).knowledge;
      if (!(node.prerequisites.every(p => owned.has(p)))) continue;
      if (resources().knowledge - cost < (nextRow && nextRow.advances.every(a => owned.has(a)) ? holdK : 0)) continue;
      if (plan('RESEARCH', { advancementId: id }, 'RESEARCH')) owned.add(id);
    }
    if (orderLeft() > 0) {
      const tile = claimed().find(t => t.terrain === 'PLAINS' && !t.improvement);
      if (tile && me().resources.wood >= 1) { const r = send('p1', { type: 'MANAGE', command: { type: 'IMPROVE_HEX', playerId: 'p1', hexId: tile.id, improvement: 'FARM', expectedVersion: state.core.version } }); if (r.ok) orders.IMPROVE++; }
    }
    // 5) Ânimo: Governar when the city is Abalada or worse and there is something to pay with (a city activation).
    send('p1', { type: 'READY' });
    send('p2', { type: 'READY' });
    const after = LEVELS.indexOf(state.cities.find(c => c.currentOwnerId === 'p1').level);
    if (flag('trace')) { const ev = state.events.filter(e => e.round === round && /SHORTAGE|OVEREXT|ACTION_FAILED|STORAGE|POPULATION_GROWN|URBAN_ACTION/.test(e.type) && (!e.audience || e.audience.includes('p1'))).map(e => e.type + ':' + e.message.slice(0, 60)); console.log(`   [r${round}] N${after + 1} pop${cityOf().population} ân${meta().mood} A${me().resources.food} W${me().resources.wood} S${me().resources.stone} $${me().resources.wealth} C${me().resources.knowledge} I${me().resources.influence} | roles ${JSON.stringify(cityOf().workers)} | ${ev.join(' ; ')}`); }
    log.push({ round, level: after + 1, pop: cityOf().population, mood: meta().mood, food: me().resources.food, knowledge: me().resources.knowledge, research: me().research.length });
  }
  const finalLevel = LEVELS.indexOf(state.cities.find(c => c.currentOwnerId === 'p1').level) + 1;
  for (const entry of log) if (!(entry.level in milestone)) milestone[entry.level] = entry.round - 0;
  // Round in which each level first showed up (log is written after the round resolved: the Elevar happened during that round).
  return { seed, civ, pairs, finalLevel, milestone, orders, blocked, log, quiet };
}

function report(result) {
  const m = result.milestone;
  const reached = Object.keys(m).map(Number).sort((a, b) => a - b).map(l => `N${l}@r${m[l]}`).join(' ');
  console.log(`seed ${result.seed} civ ${result.civ} Eruditos em pares=${result.pairs}: nível final N${result.finalLevel} | ${reached}`);
  console.log(`   Ordens gastas: ${Object.entries(result.orders).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  const top = Object.entries(result.blocked).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${v}× ${k}`);
  if (top.length) console.log(`   Bloqueios mais frequentes: ${top.join(' · ')}`);
  if (!result.quiet) {
    const last = result.log.filter((_, i) => i % 5 === 4 || i === result.log.length - 1).map(e => `r${e.round}:N${e.level} pop${e.pop} ân${e.mood} A${e.food} C${e.knowledge} av${e.research}`).join(' | ');
    console.log(`   ${last}`);
  }
}

analytic();
if (flag('drive')) {
  const civ = arg('civ', 'meridia'), seeds = arg('seeds', '1,2,3').split(',').map(Number), pairs = arg('pairs', '0,1,2').split(',').map(Number), rounds = Number(arg('rounds', 35)), quiet = flag('quiet');
  console.log(`\n== Engine drive: capital única, civilização ${civ}, alvo N7, ${rounds} rodadas ==`);
  for (const target of [6]) for (const seed of seeds) for (const p of pairs) {
    try { report(drive({ seed, civ, pairs: p, rounds, target, quiet })); } catch (error) { console.log(`seed ${seed} pairs ${p}: erro ${error.message}`); }
  }
}

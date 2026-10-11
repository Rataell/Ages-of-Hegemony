#!/usr/bin/env node
// Lane A1 (Alpha V1.2 audit): deterministic micro-repros, one per finding. Each probe edits a throw-away state (scenario set-up, the way the lab
// tools do), then uses ONLY the public command surface (applyAlphaCommand) and the real round pipeline. Nothing under packages/ or apps/ is touched.
//   node scripts/alpha-economy-probes.mjs [--only=P1,P2] [--out=docs/evidence/v12-audit/lane-a1/probes]
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine, flows, resetTrace } from './lib/alpha-flow-trace.mjs';
import { classifyFlow } from './lib/alpha-econ-policies.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (n, f) => { const hit = argv.find(a => a.startsWith(`--${n}=`)); return hit ? hit.slice(n.length + 3) : f; };
const OUT = resolve(ROOT, arg('out', 'docs/evidence/v12-audit/lane-a1/probes'));
const only = arg('only', '').split(',').filter(Boolean);
const { E, D } = await loadEngine({ traced: true });
const KEYS = ['food', 'wood', 'stone', 'metal', 'wealth', 'knowledge', 'influence', 'culture'];
const nz = v => Object.fromEntries(Object.entries(v).filter(([, x]) => x !== 0));

const me = (s, id) => s.players.find(p => p.playerId === id);
const city0 = (s, id) => s.core.players.find(p => p.id === id).civilization.cities[0];
const meta0 = (s, id) => s.cities.find(c => c.cityId === city0(s, id).id);
function newGame({ preset = 'STANDARD', civs = ['valgard', 'meridia'], seed = 1 } = {}) {
  resetTrace();
  let s = E.createAlphaGame({ gameId: 'probe', seed, preset, startingPioneers: 2, players: civs.map((c, i) => ({ id: `p${i + 1}`, name: `P${i + 1}`, civilization: c })) });
  s = E.beginAlphaPlanning(s);
  return s;
}
// Scenario edit. The state schema enforces the ledger arithmetic, so a pool edit is mirrored into the opening balance of the open ledger.
const edit = (s, fn) => {
  const c = structuredClone(s);
  const before = Object.fromEntries(c.players.map(p => [p.playerId, { ...p.resources }]));
  fn(c);
  for (const p of c.players) {
    const ledger = c.roundLedgers.find(l => l.playerId === p.playerId && l.round === c.core.round);
    if (!ledger) continue;
    const d = Object.fromEntries(KEYS.map(k => [k, p.resources[k] - before[p.playerId][k]]));
    ledger.opening.food += d.food; ledger.opening.materials += d.wood + d.stone + d.metal; ledger.opening.wealth += d.wealth; ledger.opening.knowledge += d.knowledge; ledger.opening.influence += d.influence;
    p.resources.culture = Math.max(0, p.resources.culture);
  }
  for (const o of c.core.players) o.resources = D.alphaToLegacyResources(c.players.find(p => p.playerId === o.id).resources);
  const check = D.AlphaStateSchema.safeParse(c);
  if (!check.success) throw new Error('scenario edit invalid: ' + check.error.issues.slice(0, 2).map(i => i.path.join('.') + ': ' + i.message).join(' | '));
  return c;
};
function cmd(s, id, command) { const r = E.applyAlphaCommand(s, id, { ...command, expectedVersion: s.version }); return r; }
function must(s, id, command) { const r = cmd(s, id, command); if (!r.ok) throw new Error(`${command.type} rejected: ${r.error.message}`); return r.value; }
function chooseAmbitions(s) { for (const p of s.players) if (!p.ambitionsChosen) s = must(s, p.playerId, { type: 'CHOOSE_AMBITIONS', cardIds: p.ambitions.slice(0, 2) }); return s; }
function readyAll(s) { for (const p of s.players) if (s.core.status === 'ACTIVE' && !me(s, p.playerId).ready && s.phase === 'PLANNING') s = must(s, p.playerId, { type: 'READY' }); return s; }
function finishRound(s) {
  s = chooseAmbitions(s);
  let guard = 0;
  while (guard++ < 8 && s.core.status === 'ACTIVE') {
    const phase = s.phase, round = s.core.round;
    for (const p of s.players) if (!me(s, p.playerId).ready) s = must(s, p.playerId, { type: 'READY' });
    if (s.phase !== phase || s.core.round !== round) break;
  }
  return s;
}
const eventsOf = (s, round, type) => s.events.filter(e => e.round === round && (!type || e.type === type)).map(e => `${e.type}: ${e.message}`);
const labelAll = list => {
  // sustenance drains come first (one per city), the military drain is the last upkeepPaid drain of the actor in that round
  const lastMil = new Map();
  list.forEach((f, i) => { if (f.kind === 'alphaDrain' && f.category === 'upkeepPaid' && f.frames.includes('maintainCivilizations')) lastMil.set(`${f.round}:${f.actor}`, i); });
  return list.map((f, i) => ({ round: f.round, phase: f.phase, label: classifyFlow({ ...f, upkeepIndex: lastMil.get(`${f.round}:${f.actor}`) === i ? 'military' : 'sustenance' }), delta: nz(f.delta) }));
};
const label = f => labelAll([f])[0];

const probes = {};

// ---------------------------------------------------------------------------------------------------------------------------------
function dupCase(kind) {
  let s = newGame();
  s = edit(s, st => { const c = city0(st, 'p1'); c.population = 8; c.workers = { producers: 4, artisans: 0, merchants: 0, scholars: 4, soldiers: 0, unassigned: 0 }; const p = me(st, 'p1'); p.research.push('web-agriculture', 'web-masonry'); Object.assign(p.resources, { wood: 20, stone: 20, wealth: 20, food: 15 }); });
  s = chooseAmbitions(s);
  const log = [];
  const cityId = city0(s, 'p1').id;
  const plan = (command, note) => { const r = cmd(s, 'p1', command); log.push({ note, accepted: r.ok, error: r.ok ? null : r.error.message, ordersReserved: E.alphaActionUsage(r.ok ? r.value : s, 'p1').used }); if (r.ok) s = r.value; };
  if (kind === 'ELEVATE') {
    plan({ type: 'URBAN_ACTION', cityId, action: 'ELEVATE' }, 'Elevar #1 (Posto -> Povoado, Era I)');
    plan({ type: 'URBAN_ACTION', cityId, action: 'ELEVATE' }, 'Elevar #2 na mesma rodada (Povoado -> Vila exige Era II)');
  } else {
    plan({ type: 'URBAN_ACTION', cityId, action: 'BUILD', build: { kind: 'DISTRICT', district: 'AGRARIAN' } }, 'Construir distrito Agrário');
    plan({ type: 'URBAN_ACTION', cityId, action: 'BUILD', build: { kind: 'DISTRICT', district: 'AGRARIAN' } }, 'Construir o MESMO distrito outra vez');
  }
  const round = s.core.round, mark = flows().length, reserved = E.alphaActionUsage(s, 'p1').used;
  s = finishRound(s);
  return { kind, plans: log, ordersReservedBeforeReady: reserved, failedAtResolution: eventsOf(s, round, 'ACTION_FAILED'), paidByAction: flows().slice(mark).filter(f => f.actor === 'p1' && f.cur?.action && ['ELEVATE', 'BUILD'].includes(f.cur.action)).map(f => ({ action: f.cur.action, build: f.cur.build, delta: nz(f.delta) })), cityLevelAfter: meta0(s, 'p1').level, districtsAfter: city0(s, 'p1').districts.map(d => d.type) };
}
probes.P1 = () => ({
  classification: 'BUG/UX (o planejador valida cada plano contra o estado atual, não contra o que já está reservado)',
  cases: [dupCase('ELEVATE'), dupCase('BUILD')],
  reading: 'O segundo Elevar (que exigiria a Era seguinte) e o segundo distrito igual são aceitos no planejamento, gastam uma Ordem cada e falham na resolução (ACTION_FAILED) sem devolver a Ordem; o jogador só descobre depois de confirmar.',
});

// ---------------------------------------------------------------------------------------------------------------------------------
function legalResearch(extra = []) {
  const have = new Set(extra);
  for (let pass = 0; pass < 12; pass++) for (const a of D.ADVANCEMENTS) {
    if (have.has(a.id) || a.excludes.some(x => have.has(x))) continue;
    if (a.prerequisites.every(x => have.has(x)) && (a.prerequisitesAny.length === 0 || a.prerequisitesAny.some(x => have.has(x)))) have.add(a.id);
  }
  return [...have];
}
function slotCase(level, population, districts, extraResearch = []) {
  let s = newGame();
  s = edit(s, st => {
    const c = city0(st, 'p1'), m = meta0(st, 'p1');
    m.level = level; c.population = population; c.workers = { producers: population, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned: 0 };
    const types = ['AGRARIAN', 'COMMERCIAL', 'ACADEMIC', 'ADMINISTRATIVE', 'MILITARY', 'INDUSTRIAL', 'CULTURAL'];
    c.districts = types.slice(0, districts).map(type => ({ type, builtRound: 1 }));
    m.districts = c.districts.map(d => d.type);
    c.development = ({ OUTPOST: 1, HAMLET: 1, VILLAGE: 3, CITY: 3, GREAT_CITY: 3, METROPOLIS: 5, IMPERIAL_METROPOLIS: 5 })[level];
    const p = me(st, 'p1'); p.era = 'ASCENSION'; p.research = legalResearch(extraResearch.length ? extraResearch : []);
    Object.assign(p.resources, { wood: 15, stone: 15, wealth: 15, food: 15, knowledge: 10, influence: 10 });
  });
  s = chooseAmbitions(s);
  const next = D.DistrictTypeSchema.options.find(d => !city0(s, 'p1').districts.some(x => x.type === d));
  const alphaSlots = E.districtSlots(s, city0(s, 'p1').id), coreSlots = s.core.config.territory.districtSlots[city0(s, 'p1').development - 1];
  const r = cmd(s, 'p1', { type: 'URBAN_ACTION', cityId: city0(s, 'p1').id, action: 'BUILD', build: { kind: 'DISTRICT', district: next } });
  const out = { level, districtsBuilt: districts, alphaSlots, coreSlots, planAccepted: r.ok, planError: r.ok ? null : r.error.message };
  if (!r.ok) return out;
  s = r.value;
  const round = s.core.round, mark = flows().length;
  s = finishRound(s);
  out.failedAtResolution = eventsOf(s, round, 'ACTION_FAILED');
  out.paid = flows().slice(mark).filter(f => f.actor === 'p1' && f.cur?.action === 'BUILD').map(f => nz(f.delta));
  out.districtsAfter = city0(s, 'p1').districts.length;
  return out;
}
probes.P2 = () => ({
  classification: 'BUG (duas fontes de verdade para vagas de distrito: escada alfa × tabela do núcleo)',
  cases: [slotCase('GREAT_CITY', 11, 3), slotCase('IMPERIAL_METROPOLIS', 18, 5), slotCase('CITY', 8, 3, ['web-federalization']), slotCase('VILLAGE', 6, 2)],
  reading: 'districtSlots(alfa)=1/1/2/3/4/5/6 (+1 com Federalização), mas o núcleo recusa acima de territory.districtSlots[development-1] com development espelhado 1/3/5. Grande Cidade (4ª vaga), Metrópole Imperial (6ª vaga) e a vaga da Federalização são prometidas na UI e na validação do plano e recusadas na resolução.',
});

// ---------------------------------------------------------------------------------------------------------------------------------
probes.P3 = () => {
  let s = newGame({ civs: ['kor', 'veyra'] });
  const cap = E.alphaStorageCapacity(s, 'p1').food;
  s = edit(s, st => { const c = city0(st, 'p1'); c.population = 6; c.workers = { producers: 1, artisans: 0, merchants: 0, scholars: 5, soldiers: 0, unassigned: 0 }; me(st, 'p1').resources.food = cap - 1; me(st, 'p2').resources.food = 5; });
  s = chooseAmbitions(s);
  const yieldFood = E.productionOutput(s, 'p1', city0(s, 'p1').id).output.food;
  s = must(s, 'p1', { type: 'URBAN_ACTION', cityId: city0(s, 'p1').id, action: 'PRODUCE' });
  const round = s.core.round, mark = flows().length;
  s = finishRound(s);
  const fl = labelAll(flows().slice(mark).filter(f => f.actor === 'p1'));
  const final = me(s, 'p1').resources.food;
  const sustenance = Math.ceil(6 / 2);
  return {
    classification: 'RULE/BALANCE (limite aplicado no crédito do Produzir, antes do sustento da mesma rodada)',
    cap, stockBefore: cap - 1, producedFood: yieldFood, sustenance, flows: fl,
    finalFood: final, finalIfDeferredToEndOfRound: Math.min(cap, cap - 1 + yieldFood - sustenance) , lostFood: Math.max(0, cap - 1 + yieldFood - cap),
    reading: 'O crédito do Produzir é cortado no limite na hora (alphaGain com enforceStorage). O sustento só roda depois, na Manutenção. A produção que passa do limite é destruída mesmo que a mesma rodada a consuma. Efeito: o teto de vazão de Alimento por rodada é limite - resto, não o limite + produção.',
  };
};

// ---------------------------------------------------------------------------------------------------------------------------------
probes.P4 = () => {
  // (a) Governar "custa 1 Cultura": the pool is not charged. (b) The ledger has no Culture. (c) Era-turn flows fall between two reports.
  let s = newGame({ preset: 'QUICK' });
  s = chooseAmbitions(s);
  s = edit(s, st => { me(st, 'p1').resources.culture = 3; meta0(st, 'p1').mood = 3; });
  const cityId = city0(s, 'p1').id;
  const displayed = E.urbanCost(s, 'p1', cityId, 'PROMOTE_MOOD');
  s = must(s, 'p1', { type: 'URBAN_ACTION', cityId, action: 'PROMOTE_MOOD' });
  const moodBefore = meta0(s, 'p1').mood, mark = flows().length;
  s = finishRound(s);
  const culture = { displayedCost: nz(displayed), cultureBefore: 3, cultureAfter: me(s, 'p1').resources.culture, moodBefore, moodAfter: meta0(s, 'p1').mood, tracerCultureFlows: labelAll(flows().slice(mark).filter(f => f.actor === 'p1' && f.delta.culture !== 0)) };
  while (s.core.round < 5 && s.core.status === 'ACTIVE') s = finishRound(s);
  const chain = [];
  for (let r = 1; r <= 4; r++) {
    const a = s.roundReports.find(x => x.playerId === 'p1' && x.round === r), b = s.roundReports.find(x => x.playerId === 'p1' && x.round === r + 1);
    if (a && b) chain.push({ from: r, to: r + 1, diffOpeningMinusClosing: nz(Object.fromEntries(Object.keys(a.closing).map(k => [k, b.opening[k] - a.closing[k]]))), eraTurnBetween: r % 3 === 0 });
  }
  const eraFlows = labelAll(flows().filter(f => f.actor === 'p1' && f.phase === 'ERA_TURN'));
  return {
    classification: 'BUG (Cultura nunca é cobrada; ledger omite Cultura; fluxos da Virada de Era ficam fora de qualquer relatório)',
    culture, reportKeys: Object.keys(s.roundReports[0].closing), chain, eraTurnFlowsOutsideReports: eraFlows,
    reading: 'alphaCanAfford/alphaPay só tratam Alimento, Conhecimento, Influência, Madeira/Pedra/Metal e Riqueza: o campo culture do custo é ignorado, então Governar (1 Cultura por nível) sai de graça e a Cultura só acumula. RoundLedger tem cinco chaves (materials = madeira+pedra+metal) e nenhuma é Cultura. A Virada de Era (Pulso, recompensas, reformas) roda depois do relatório da rodada ser copiado e antes do ledger seguinte abrir.',
  };
};

// ---------------------------------------------------------------------------------------------------------------------------------
function spiralCase({ name, food, wealth, culture, mood, level, population, rounds = 6, govern = true }) {
  let s = newGame({ civs: ['valgard', 'meridia'] });
  s = edit(s, st => { const c = city0(st, 'p1'), m = meta0(st, 'p1'); m.level = level; m.mood = mood; c.population = population; c.workers = { producers: population, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned: 0 }; Object.assign(me(st, 'p1').resources, { food, wealth, culture }); me(st, 'p2').resources.food = 15; });
  s = chooseAmbitions(s);
  const trace = [];
  for (let i = 0; i < rounds && s.core.status === 'ACTIVE'; i++) {
    while (s.phase !== 'PLANNING' && s.core.status === 'ACTIVE') s = finishRound(s);
    const options = E.urbanOptions(s, 'p1').cities[city0(s, 'p1').id];
    const produce = options.find(o => o.action === 'PRODUCE'), gov = options.find(o => o.action === 'PROMOTE_MOOD');
    const row = { round: s.core.round, mood: meta0(s, 'p1').mood, pop: city0(s, 'p1').population, food: me(s, 'p1').resources.food, wealth: me(s, 'p1').resources.wealth, produceBlocked: produce.blocked, governBlocked: gov.blocked };
    if (govern && !gov.blocked) { const r = cmd(s, 'p1', { type: 'URBAN_ACTION', cityId: city0(s, 'p1').id, action: 'PROMOTE_MOOD' }); if (r.ok) { s = r.value; row.did = 'Governar'; } }
    else if (!produce.blocked) { const r = cmd(s, 'p1', { type: 'URBAN_ACTION', cityId: city0(s, 'p1').id, action: 'PRODUCE' }); if (r.ok) { s = r.value; row.did = 'Produzir'; } }
    s = finishRound(s);
    trace.push(row);
  }
  trace.push({ end: true, mood: meta0(s, 'p1').mood, pop: city0(s, 'p1').population, food: me(s, 'p1').resources.food });
  return { name, trace };
}
probes.P5 = () => ({
  classification: 'RULE (Revolta + fome: Governar +1/nível por Ordem, fome -1 por cidade por rodada, Produzir bloqueado em Revolta)',
  cases: [
    spiralCase({ name: 'sem Cultura nem Riqueza, Ânimo 0, Alimento 0', food: 0, wealth: 0, culture: 0, mood: 0, level: 'HAMLET', population: 4, rounds: 4 }),
    spiralCase({ name: 'com Riqueza 20, Ânimo 0, Alimento 0, cidade de Capacidade 1 (Povoado)', food: 0, wealth: 20, culture: 0, mood: 0, level: 'HAMLET', population: 4, rounds: 6 }),
    spiralCase({ name: 'com Riqueza 20, Ânimo 0, Alimento 10 (a cidade ainda come)', food: 10, wealth: 20, culture: 0, mood: 0, level: 'HAMLET', population: 4, rounds: 5 }),
    spiralCase({ name: 'com Riqueza 20, Ânimo 0, Alimento 0, Capacidade 2 (Vila, pop. 6)', food: 0, wealth: 20, culture: 0, mood: 0, level: 'VILLAGE', population: 6, rounds: 5 }),
  ],
});

// ---------------------------------------------------------------------------------------------------------------------------------
probes.P6 = () => {
  const rows = [];
  for (const civ of D.CIVILIZATIONS.map(c => c.id)) {
    const s = newGame({ civs: [civ, civ === 'valgard' ? 'meridia' : 'valgard'] });
    const cap = E.alphaStorageCapacity(s, 'p1'), pool = me(s, 'p1').resources;
    rows.push({ civ, over: Object.fromEntries(KEYS.filter(k => pool[k] > cap[k]).map(k => [k, { pool: pool[k], cap: cap[k] }])), pool: nz(pool) });
  }
  return { classification: 'WORLD/BALANCE (informativo)', rows: rows.map(r => ({ civ: r.civ, overCap: r.over })), anyOverCap: rows.some(r => Object.keys(r.over).length > 0) };
};

// ---------------------------------------------------------------------------------------------------------------------------------
probes.P8 = () => {
  let s = newGame();
  s = edit(s, st => { const c = city0(st, 'p1'), m = meta0(st, 'p1'); m.level = 'HAMLET'; c.population = 6; c.workers = { producers: 3, artisans: 0, merchants: 0, scholars: 3, soldiers: 0, unassigned: 0 }; const p = me(st, 'p1'); p.era = 'EXPANSION'; p.research.push('web-agriculture', 'web-masonry'); Object.assign(p.resources, { wood: 1, stone: 10, wealth: 20, food: 15 }); });
  s = chooseAmbitions(s);
  const row = E.urbanOptions(s, 'p1').cities[city0(s, 'p1').id].find(o => o.action === 'ELEVATE');
  s = must(s, 'p1', { type: 'URBAN_ACTION', cityId: city0(s, 'p1').id, action: 'ELEVATE' });
  const mark = flows().length;
  s = finishRound(s);
  return {
    classification: 'UX (custo exibido ≠ custo pago quando falta material e a Riqueza cobre 2:1)',
    displayedCost: nz(row.cost), displayedBlocked: row.blocked,
    paid: flows().slice(mark).filter(f => f.actor === 'p1' && f.cur?.action === 'ELEVATE').map(f => nz(f.delta)),
    rule: 'wealthConversionRate=2, até 50% do custo de materiais',
  };
};

// ---------------------------------------------------------------------------------------------------------------------------------
probes.P9 = () => {
  // Aurélia: +1 Alimento per worked FARM is credited but the card preview does not include it.
  let s = newGame({ civs: ['aurelia', 'meridia'] });
  s = chooseAmbitions(s);
  s = edit(s, st => { me(st, 'p1').research.push('web-agriculture'); Object.assign(me(st, 'p1').resources, { influence: 8, wood: 8 }); });
  const claim = E.alphaClaimOptions(s, 'p1')[city0(s, 'p1').id].map(h => s.core.map.find(t => t.id === h)).find(t => t.terrain === 'PLAINS');
  s = must(s, 'p1', { type: 'MANAGE', command: { type: 'CLAIM_HEX', playerId: 'p1', cityId: city0(s, 'p1').id, hexId: claim.id, expectedVersion: s.core.version } });
  s = must(s, 'p1', { type: 'MANAGE', command: { type: 'IMPROVE_HEX', playerId: 'p1', hexId: claim.id, improvement: 'FARM', expectedVersion: s.core.version } });
  s = must(s, 'p1', { type: 'MANAGE', command: { type: 'ASSIGN_WORKED_HEXES', playerId: 'p1', cityId: city0(s, 'p1').id, hexIds: [claim.id], expectedVersion: s.core.version } });
  const displayed = E.productionOutput(s, 'p1', city0(s, 'p1').id);
  s = must(s, 'p1', { type: 'URBAN_ACTION', cityId: city0(s, 'p1').id, action: 'PRODUCE' });
  const mark = flows().length;
  s = finishRound(s);
  for (const f of flows().slice(mark)) f.label = classifyFlow(f);
  const fl = labelAll(flows().slice(mark).filter(f => f.actor === 'p1' && f.label !== 'DISCARD'));
  const credited = fl.filter(f => f.label === 'PRODUCE').reduce((n, f) => n + (f.delta.food ?? 0), 0);
  return { classification: 'UX (prévia do Produzir omite o bônus de civilização kitProduceBonus; growthForecast herda o erro)', displayedFood: displayed.output.food, creditedFoodByProduce: credited, produceFlows: fl.filter(f => f.label === 'PRODUCE'), civilization: 'aurelia (+1 Alimento por Fazenda trabalhada)' };
};

// ---------------------------------------------------------------------------------------------------------------------------------
probes.P10 = () => {
  let s = newGame();
  s = chooseAmbitions(s);
  const cityId = city0(s, 'p1').id;
  s = must(s, 'p1', { type: 'URBAN_ACTION', cityId, action: 'RESEARCH', advancementId: 'web-agriculture' });
  const row = E.urbanOptions(s, 'p1').research.find(o => o.advancementId === 'web-agriculture');
  const again = cmd(s, 'p1', { type: 'URBAN_ACTION', cityId, action: 'RESEARCH', advancementId: 'web-agriculture' });
  return { classification: 'UX (lista de avanços não marca como reservado o avanço já planejado)', listedBlocked: row.blocked, secondPlan: again.ok ? 'aceito' : again.error.message };
};

// ---------------------------------------------------------------------------------------------------------------------------------
probes.P11 = () => {
  // Crescer (automatic) runs before the military upkeep and can eat the food the pieces need.
  let s = newGame({ civs: ['valgard', 'meridia'] });
  s = edit(s, st => { const c = city0(st, 'p1'); c.population = 3; c.workers = { producers: 1, artisans: 0, merchants: 0, scholars: 2, soldiers: 0, unassigned: 0 }; me(st, 'p1').resources.food = 4; me(st, 'p2').resources.food = 15; });
  s = chooseAmbitions(s);
  // one land piece in the capital (Guarda) to pay for
  s = edit(s, st => { st.units.push({ id: 'probe-guard', ownerId: 'p1', kind: 'GUARD', hexId: city0(st, 'p1').hexId, recruitedRound: 1 }); });
  const moodBefore = meta0(s, 'p1').mood;
  const round = s.core.round, mark = flows().length;
  s = finishRound(s);
  const fl = labelAll(flows().slice(mark).filter(f => f.actor === 'p1'));
  return {
    classification: 'RULE (ordem de operações da Manutenção: sustento -> Crescer -> manutenção militar)',
    setup: 'Alimento 4 (+1 de efeito recorrente na Manutenção), pop. 3 (come 2), 1 Guarda (come 1), Posto abaixo do teto de pop. (pode Crescer por 3)',
    moodBefore, moodAfter: meta0(s, 'p1').mood, flows: fl, events: eventsOf(s, round).filter(e => /UPKEEP|SHORTAGE|GROWN/.test(e)),
    reading: 'Com 5 de Alimento dava para pagar sustento (2) e peça (1) e sobrar 2. O Crescer automático gasta 3 antes da manutenção militar; a peça fica sem pagamento e TODAS as cidades perdem 1 Ânimo. Crescer não é opcional para o jogador.',
  };
};

// ---------------------------------------------------------------------------------------------------------------------------------
probes.P12 = () => {
  // Metal: where is the nearest deposit, what claim radius reaches it, and how many Orders until the first Metal.
  const rows = [];
  for (const seed of [1, 2, 3]) for (const civ of D.CIVILIZATIONS.map(c => c.id)) {
    const s = newGame({ civs: [civ, civ === 'valgard' ? 'meridia' : 'valgard'], seed });
    const cap = s.core.map.find(t => t.id === city0(s, 'p1').hexId);
    const deposits = s.core.map.filter(t => t.features.includes('METAL') && ['HILLS', 'MOUNTAINS'].includes(t.terrain) && s.regions.find(r => r.hexIds.includes(t.id)) && s.players[0].knownHexIds.includes(t.id));
    const known = deposits.map(t => E.hexDistance(cap, t)).sort((a, b) => a - b);
    const all = s.core.map.filter(t => t.features.includes('METAL') && ['HILLS', 'MOUNTAINS'].includes(t.terrain)).map(t => E.hexDistance(cap, t)).sort((a, b) => a - b);
    rows.push({ seed, civ, nearestKnown: known[0] ?? null, nearestAnywhere: all[0] ?? null, depositsKnownAtStart: known.length });
  }
  const dist = rows.map(r => r.nearestAnywhere).filter(x => x !== null);
  const within = n => rows.filter(r => r.nearestAnywhere !== null && r.nearestAnywhere <= n).length;
  const radius = { 'Posto/Povoado (desenvolvimento 1)': 1, 'Vila a Grande Cidade (desenvolvimento 3)': 2, 'Metrópole+ (desenvolvimento 5)': 3 };
  const chain = ['web-masonry (Avançar, 2 Conhecimento)', 'web-metallurgy (Avançar, 3 Conhecimento)', 'Reivindicar cada hex até o depósito (Ordem Cidade + 1 Influência cada)', 'Melhorar o hex com Mina (Ordem Cidade; 2 Materiais + 1 Riqueza)', 'Designar um Produtor ao hex (livre)', 'Produzir (Ordem Cidade): +1 Metal por Mina (metalPerMine=1)'];
  return {
    classification: 'WORLD/BALANCE (Metal: depósito a 1 hex da capital em todas as amostras; 5 Ordens pela cadeia da Teia, 3 pelo atalho do P13)',
    samples: rows.length, nearestDepositDistance: { min: Math.min(...dist), median: dist.sort((a, b) => a - b)[Math.floor(dist.length / 2)], max: Math.max(...dist) },
    sharesWithin: { d1: within(1) / rows.length, d2: within(2) / rows.length, d3: within(3) / rows.length, d4: within(4) / rows.length },
    claimRadiusByLevel: radius, chainOfOrders: chain, minOrdersToFirstMetal: 'cadeia da Teia: 2 Avançar + 1 Reivindicar + 1 Melhorar + 1 Produzir = 5 Ordens; hoje o motor aceita Mina sem pesquisa (P13): 3 Ordens',
    metalSinks: 'Cavalaria 1, Engenho de cerco 2, Frota 1, Fortaleza 1 / Bastião 2 / Cidadela 3, Obras de Legado 2-4',
    rows,
  };
};

// ---------------------------------------------------------------------------------------------------------------------------------
probes.P13 = () => {
  // Web "unlocks" that the engine does not enforce: improvement:*, building:*, unit:*.
  let s = newGame();
  s = chooseAmbitions(s);
  const cityId = city0(s, 'p1').id;
  const out = { improvements: [], buildings: [], units: [] };
  // improvements without any research
  const claimable = E.alphaClaimOptions(s, 'p1')[cityId].map(h => s.core.map.find(t => t.id === h));
  const pick = (pred) => claimable.find(pred);
  const targets = [['FARM', pick(t => t.terrain === 'PLAINS')], ['MINE', pick(t => t.terrain === 'HILLS' && t.features.includes('METAL'))], ['LUMBER_CAMP', pick(t => t.terrain === 'FOREST')]].filter(([, t]) => t);
  const unlockOf = { FARM: 'web-agriculture', MINE: 'web-metallurgy', LUMBER_CAMP: '(sem nó)' };
  for (const [imp, tile] of targets) {
    let t = edit(s, st => { me(st, 'p1').resources.influence = 10; me(st, 'p1').resources.wood = 10; me(st, 'p1').resources.wealth = 10; });
    let r = cmd(t, 'p1', { type: 'MANAGE', command: { type: 'CLAIM_HEX', playerId: 'p1', cityId, hexId: tile.id, expectedVersion: t.core.version } });
    if (!r.ok) { out.improvements.push({ improvement: imp, claim: r.error.message }); continue; }
    t = r.value;
    r = cmd(t, 'p1', { type: 'MANAGE', command: { type: 'IMPROVE_HEX', playerId: 'p1', hexId: tile.id, improvement: imp, expectedVersion: t.core.version } });
    out.improvements.push({ improvement: imp, nodeThatUnlocksIt: unlockOf[imp], researched: false, result: r.ok ? 'ACEITO sem pesquisa' : r.error.message });
  }
  // buildings: the Web lists 25 building tags; the engine's BuildingTypeSchema has 7 types.
  const tags = [...new Set(D.ADVANCEMENTS.flatMap(a => a.unlocks.filter(u => u.startsWith('building:')).map(u => u.slice(9))))];
  out.buildingTagsInWeb = tags.length; out.buildableTypes = D.BuildingTypeSchema.options; out.tagsWithoutEngineEntry = tags.filter(b => !D.BuildingTypeSchema.options.includes(b));
  out.effectsLostWithoutEntry = ['TEMPLE (+1 Cultura por Produzir)', 'WAREHOUSE (+5 limite de Madeira e Pedra)', 'TREASURY/BANK (+5 limite de Riqueza)', 'ACADEMY (+5 Conhecimento)', 'FOUNDRY (+5 Metal)', 'CHANCELLERY (+1 Administração, +5 Influência)', 'THEATER (+5 Cultura)', 'IRRIGATION/MILL (fazenda)'];
  let b = edit(s, st => { const c = city0(st, 'p1'), m = meta0(st, 'p1'); me(st, 'p1').research.push('web-masonry'); c.districts = [{ type: 'INDUSTRIAL', builtRound: 1 }]; m.districts = ['INDUSTRIAL']; Object.assign(me(st, 'p1').resources, { wood: 15, stone: 15, wealth: 15 }); });
  out.buildings.push({ building: 'WORKSHOP', nodeThatUnlocksIt: 'web-metallurgy', researched: false, districtOpenedBy: 'web-masonry', planBlock: E.urbanBlock(b, 'p1', cityId, 'BUILD', { build: { kind: 'BUILDING', building: 'WORKSHOP' } }) });
  // units: CAVALRY (unit:CAVALRY <- web-maneuver-training; Era II) with Era II reached but not researched
  let u = edit(s, st => { const c = city0(st, 'p1'), m = meta0(st, 'p1'); me(st, 'p1').era = 'EXPANSION'; c.districts = [{ type: 'MILITARY', builtRound: 1 }]; m.districts = ['MILITARY']; c.workers = { producers: 1, artisans: 0, merchants: 0, scholars: 0, soldiers: 1, unassigned: 0 }; Object.assign(me(st, 'p1').resources, { food: 15, wood: 15, stone: 15, wealth: 15, metal: 5 }); });
  for (const unit of ['CAVALRY', 'RANGED']) {
    const block = E.urbanBlock(u, 'p1', cityId, 'RECRUIT', { unit });
    out.units.push({ unit, nodeThatUnlocksIt: unit === 'CAVALRY' ? 'web-maneuver-training' : 'web-metallurgy', researched: false, era: 'EXPANSION', planBlock: block });
  }
  return {
    classification: 'BUG/LEGACY (a Teia declara 25 edifícios e o motor só tem 7; improvement:*/building:*/unit:* não são impostos)',
    ...out,
    reading: 'Só district:* e government:* (e algumas rule:*) são verificados; melhorias e unidades ficam disponíveis sem o nó que a Teia diz que os abre (Mina na rodada 1, Oficina só com Alvenaria). 19 das 25 etiquetas de edifício (Templo, Armazém, Tesouraria, Academia, Fundição, Chancelaria, Teatro…) não existem no motor: seus efeitos de limite de armazenamento, Cultura e Administração são inalcançáveis.',
  };
};

// ---------------------------------------------------------------------------------------------------------------------------------
mkdirSync(OUT, { recursive: true });
const summary = {};
for (const [name, fn] of Object.entries(probes)) {
  if (only.length && !only.includes(name)) continue;
  try {
    const result = fn();
    summary[name] = result;
    writeFileSync(join(OUT, `${name}.json`), JSON.stringify(result, null, 1));
    console.log(`${name}: ${result.classification ?? ''}`);
  } catch (error) {
    summary[name] = { error: String(error?.stack ?? error).slice(0, 600) };
    console.log(`${name}: ERROR ${String(error?.message ?? error).slice(0, 200)}`);
  }
}
writeFileSync(join(OUT, 'probes.json'), JSON.stringify(summary, null, 1));

// Lane A1: turns a finished policy match (box) into per-round rows and runs the INDEPENDENT conservation checks.
// "Independent" = computed from the pool snapshots and the tracer (which watches player.resources itself), never from state.roundLedgers;
// the ledger/report is then compared against that independent figure.
import { flows, preMaint, RESOURCE_KEYS_8 as KEYS } from './alpha-flow-trace.mjs';

const ZERO8 = () => Object.fromEntries(KEYS.map(k => [k, 0]));
const add8 = (a, b, s = 1) => { for (const k of KEYS) a[k] += (b?.[k] ?? 0) * s; return a; };
const legacy = v => ({ food: v.food ?? 0, materials: (v.wood ?? 0) + (v.stone ?? 0) + (v.metal ?? 0), wealth: v.wealth ?? 0, knowledge: v.knowledge ?? 0, influence: v.influence ?? 0 });
const L5 = ['food', 'materials', 'wealth', 'knowledge', 'influence'];
const GAIN_LABELS_SPEND = new Set(['ELEVATE', 'BUILD', 'RECRUIT', 'RESEARCH', 'PROMOTE_MOOD', 'CIVIC_ACTION', 'SETTLE', 'CLAIM_HEX', 'IMPROVE_HEX', 'GOV_REFORM', 'BUILD_ROAD', 'LEGACY', 'INDEPENDENT', 'DIPLOMACY']);

export function runChecks(box) {
  const { state } = box;
  const all = flows();
  const pre = preMaint();
  const events = state.events;
  const reports = state.roundReports;
  const ids = box.seats.map(s => s.id);
  const rounds = box.roundLog.map(r => r.round);
  const checks = { identity: [], ledger: { mismatches: [], fieldsCompared: 0, roundsCompared: 0 }, orphan: { eraTurnFlows: [], total: ZERO8() }, formulas: { sustenance: { n: 0, mismatches: [] }, growth: { n: 0, mismatches: [] }, military: { n: 0, mismatches: [] }, storage: { n: 0, mismatches: [] } }, display: { cost: { n: 0, mismatches: [] }, produce: { n: 0, mismatches: [], exact: 0 } }, culture: { traced: ZERO8Obj(), ledgerSeen: 0 }, upkeepOrder: { events: 0, withGrowth: 0, avoidable: 0, samples: [] }, categoriesUnseenByLedger: {} };

  // Flows indexed by actor and by round/phase.
  const byActor = Object.fromEntries(ids.map(id => [id, all.filter(f => f.actor === id)]));

  // 1. Pool identity per seat and round:   open_r + Σ flows(r, not ROUND_START) + Σ flows(r+1, ROUND_START)  ==  open_{r+1}
  for (const id of ids) {
    for (let i = 0; i < box.roundLog.length; i++) {
      const cur = box.roundLog[i], next = box.roundLog[i + 1];
      const openNow = cur.open[id].resources;
      const target = next ? next.open[id].resources : box.finalOpen[id].resources;
      const sum = { ...openNow };
      for (const f of byActor[id]) {
        const inRound = f.round === cur.round && f.phase !== 'WORLD_PULSE';
        const nextStart = next && f.round === next.round && f.phase === 'WORLD_PULSE';
        const lastStart = !next && f.round === cur.round + 1 && f.phase === 'WORLD_PULSE';
        if (inRound || nextStart || lastStart) add8(sum, f.delta);
      }
      const diff = Object.fromEntries(KEYS.map(k => [k, target[k] - sum[k]]));
      if (KEYS.some(k => diff[k] !== 0)) checks.identity.push({ seat: id, round: cur.round, diff });
    }
  }

  // 2. Ledger vs tracer, per (seat, round). Window of ledger r: flows with round r, any phase except ERA_TURN (the report is built before the Era turn).
  const reportOf = (id, r) => reports.find(x => x.playerId === id && x.round === r);
  const catOf = f => f.kind === 'alphaGain' ? f.category : f.kind === 'alphaLose' ? 'losses' : f.kind === 'enforceStorage' ? 'discarded' : f.kind === 'alphaPay' ? 'expenses' : f.category;
  const FIELD = { production: 'production', mining: 'mining', trade: 'trade', institutions: 'institutions', other: 'other', losses: 'losses', expenses: 'expenses', upkeepPaid: 'upkeepPaid', discarded: 'discarded' };
  for (const id of ids) {
    for (const r of rounds) {
      const rep = reportOf(id, r);
      if (!rep) continue;
      checks.ledger.roundsCompared++;
      const exp = Object.fromEntries(Object.values(FIELD).map(f => [f, ZERO8()]));
      for (const f of byActor[id]) {
        if (f.round !== r || f.phase === 'ERA_TURN') continue;
        const cat = catOf(f);
        if (!FIELD[cat]) continue;
        const sign = (cat === 'production' || cat === 'mining' || cat === 'trade' || cat === 'institutions' || cat === 'other') ? 1 : -1;
        add8(exp[FIELD[cat]], f.delta, sign);
      }
      for (const field of Object.values(FIELD)) {
        const l = legacy(exp[field]);
        for (const k of L5) {
          checks.ledger.fieldsCompared++;
          const got = rep[field]?.[k] ?? 0;
          if (got !== l[k]) checks.ledger.mismatches.push({ seat: id, round: r, field, resource: k, ledger: got, independent: l[k] });
        }
        // The ledger vocabulary has no Culture: anything the tracer saw is invisible there.
        if (exp[field].culture !== 0) { checks.culture.traced.byField[field] = (checks.culture.traced.byField[field] ?? 0) + exp[field].culture; }
      }
      // closing balance of the report vs the independent pool at the end of the round (before the Era turn)
      const cur = box.roundLog.find(x => x.round === r);
      const closing = { ...cur.open[id].resources };
      for (const f of byActor[id]) if (f.round === r && f.phase !== 'ERA_TURN' && f.phase !== 'WORLD_PULSE') add8(closing, f.delta);
      const lc = legacy(closing);
      for (const k of L5) { checks.ledger.fieldsCompared++; if ((rep.closing?.[k] ?? 0) !== lc[k]) checks.ledger.mismatches.push({ seat: id, round: r, field: 'closing', resource: k, ledger: rep.closing?.[k] ?? 0, independent: lc[k] }); }
    }
  }
  // Chain: report(r).closing vs report(r+1).opening (breaks across the Era turn).
  checks.ledger.chainBreaks = [];
  for (const id of ids) for (const r of rounds) {
    const a = reportOf(id, r), b = reportOf(id, r + 1);
    if (!a || !b) continue;
    const diff = Object.fromEntries(L5.map(k => [k, (b.opening?.[k] ?? 0) - (a.closing?.[k] ?? 0)]));
    if (L5.some(k => diff[k] !== 0)) checks.ledger.chainBreaks.push({ seat: id, round: r, diff, eraTurn: r % box.state.rules.roundsPerEra === 0 });
  }
  // Flows that no report can contain: the Era turn (Pulse, rewards, reform costs) runs after the report is closed.
  for (const f of all) if (f.phase === 'ERA_TURN') { checks.orphan.eraTurnFlows.push({ round: f.round, seat: f.actor, label: f.label ?? '', delta: f.delta }); add8(checks.orphan.total, f.delta); }
  // Culture flows overall.
  for (const f of all) if (f.delta.culture !== 0) { const k = `${f.label ?? f.kind}`; checks.culture.traced.byLabel[k] = (checks.culture.traced.byLabel[k] ?? 0) + f.delta.culture; }

  // 3. Formulas.
  const eventsOf = (id, r, type) => events.filter(e => e.round === r && e.type === type && (e.audience === null || e.audience?.includes(id)));
  const unitShortEvents = (id, r) => eventsOf(id, r, 'UPKEEP_SHORTAGE').length > 0;
  for (const id of ids) for (const r of rounds) {
    const p = pre[`${r}:${id}`];
    if (!p) continue;
    const sus = byActor[id].filter(f => f.round === r && f.label === 'SUSTENANCE');
    const mil = byActor[id].filter(f => f.round === r && f.label === 'MILITARY_UPKEEP');
    const grow = byActor[id].filter(f => f.round === r && f.label === 'GROWTH');
    const spent = -grow.reduce((n, f) => n + f.delta.food, 0);
    const paidSus = -sus.reduce((n, f) => n + f.delta.food, 0);
    const shortfall = eventsOf(id, r, 'FOOD_SHORTAGE').reduce((n, e) => n + Number(/faltaram (\d+)/.exec(e.message)?.[1] ?? 0), 0);
    const required = p.cities.reduce((n, c) => n + Math.ceil(c.pop / 2), 0);
    checks.formulas.sustenance.n++;
    if (paidSus + shortfall !== required) checks.formulas.sustenance.mismatches.push({ seat: id, round: r, required, paid: paidSus, shortfall });
    // Ledger upkeepRequired.food must equal sustenance + military
    const rep = reportOf(id, r);
    const militaryRequired = Math.ceil(p.landPieces / 2);
    const paidMil = -mil.reduce((n, f) => n + f.delta.food, 0), paidShips = -mil.reduce((n, f) => n + f.delta.wealth, 0);
    checks.formulas.military.n++;
    if (unitShortEvents(id, r)) { const short = militaryRequired + Math.max(0, (rep?.upkeepRequired?.food ?? 0) - required - militaryRequired) - paidMil; const gs = spent; checks.upkeepOrder.events++; if (gs > 0) { checks.upkeepOrder.withGrowth++; if (gs >= short) checks.upkeepOrder.avoidable++; } checks.upkeepOrder.samples.push({ seat: id, round: r, short, growthSpent: gs }); }
    const unitShort = unitShortEvents(id, r);
    // kitFoodUpkeep (civilization kits) can add food upkeep: reported as `kitExtra` when the ledger asks for more than the formula.
    const ledgerFood = rep?.upkeepRequired?.food ?? null;
    const kitExtra = ledgerFood === null ? null : ledgerFood - required - militaryRequired;
    if ((!unitShort && (paidMil !== militaryRequired + Math.max(0, kitExtra ?? 0) || paidShips !== p.ships)) || (kitExtra !== null && kitExtra < 0)) checks.formulas.military.mismatches.push({ seat: id, round: r, militaryRequired, paidMil, ships: p.ships, paidShips, kitExtra, unitShort });
    // Growth: each POPULATION_GROWN costs 3 (2 with Celeiro)
    const grown = eventsOf(id, r, 'POPULATION_GROWN');
    const names = new Map(box.state.core.players.find(o => o.id === id).civilization.cities.map(c => [c.name, c.id]));
    let lo = 0, hi = 0;
    for (const e of grown) { const city = p.cities.find(c => names.get(e.message.split(' cresceu')[0]) === c.id); const cost = city?.granary ? 2 : 3; lo += cost; hi += cost; }
    checks.formulas.growth.n++;
    if (spent !== lo) checks.formulas.growth.mismatches.push({ seat: id, round: r, grown: grown.length, expectedFood: lo, spent });
  }
  // Storage: after maintenance each pool is ≤ capacity (checked on the openings of the next planning).
  for (const cur of box.roundLog) for (const id of ids) for (const k of KEYS) { checks.formulas.storage.n++; const v = cur.open[id].resources[k], cap = cur.open[id].caps[k]; if (v > cap) checks.formulas.storage.mismatches.push({ seat: id, round: cur.round, resource: k, value: v, cap }); }

  // 4. Displayed vs paid (cost) and displayed production vs credited.
  const byPlan = new Map();
  for (const f of all) if (f.cur?.planId) { const list = byPlan.get(f.cur.planId) ?? []; list.push(f); byPlan.set(f.cur.planId, list); }
  for (const [planId, d] of box.displayed) {
    const fl = byPlan.get(planId) ?? [];
    if (d.action === 'PRODUCE') {
      const got = ZERO8();
      for (const f of fl) if (['PRODUCE', 'PRODUCE_BONUS'].includes(f.label)) add8(got, f.delta);
      // discards inside the gain are separate flows: ignore them for the comparison
      checks.display.produce.n++;
      const executed = fl.length > 0;
      if (!executed) { (checks.display.produce.notExecuted ??= []).push({ planId, round: d.round, seat: d.seat }); continue; }
      const diff = Object.fromEntries(KEYS.map(k => [k, got[k] - (d.output?.[k] ?? 0)]));
      if (KEYS.some(k => diff[k] !== 0)) checks.display.produce.mismatches.push({ planId, round: d.round, seat: d.seat, displayed: d.output, credited: got, diff }); else checks.display.produce.exact++;
    } else if (d.cost && KEYS.some(k => d.cost[k] > 0)) {
      const paid = ZERO8();
      for (const f of fl) if (f.delta && GAIN_LABELS_SPEND.has(f.label)) add8(paid, f.delta, -1);
      checks.display.cost.n++;
      const executed = fl.length > 0;
      if (!executed) { (checks.display.cost.notExecuted ??= []).push({ planId, round: d.round, seat: d.seat, action: d.action, displayed: d.cost }); continue; }
      const diff = Object.fromEntries(KEYS.map(k => [k, paid[k] - d.cost[k]]));
      if (KEYS.some(k => diff[k] !== 0)) checks.display.cost.mismatches.push({ planId, round: d.round, seat: d.seat, action: d.action, displayed: d.cost, paid, diff, stockAtPlan: d.stock });
    }
  }
  return checks;
}
function ZERO8Obj() { return { byField: {}, byLabel: {} }; }

/** One row per seat-round with the numbers the audit tables need. */
export function buildRows(box) {
  const { state } = box;
  const all = flows();
  const rows = [];
  const rpe = state.rules.roundsPerEra;
  for (let i = 0; i < box.roundLog.length; i++) {
    const cur = box.roundLog[i], next = box.roundLog[i + 1];
    for (const seat of box.seats) {
      const id = seat.id;
      const mine = all.filter(f => f.actor === id);
      const inRound = mine.filter(f => f.round === cur.round && f.phase !== 'WORLD_PULSE');
      const roundStart = mine.filter(f => f.round === cur.round && f.phase === 'WORLD_PULSE');
      const byLabel = {};
      for (const f of inRound) { const l = f.label ?? f.kind; byLabel[l] ??= ZERO8(); add8(byLabel[l], f.delta); }
      const startLabels = {};
      for (const f of roundStart) { const l = f.label ?? f.kind; startLabels[l] ??= ZERO8(); add8(startLabels[l], f.delta); }
      const sum = (labels, sign = 1) => { const t = ZERO8(); for (const l of labels) if (byLabel[l]) add8(t, byLabel[l], sign); return t; };
      const gainLabels = Object.keys(byLabel).filter(l => ['PRODUCE', 'PRODUCE_BONUS', 'RECURRING_MAINTENANCE', 'RECURRING_OTHER', 'TRADE', 'CARD', 'CHOICE', 'PULSE', 'ERA_TURN', 'LEADER', 'ABILITY', 'DISCOVERY', 'THREAT', 'COMBAT', 'CIVIC_ACTION', 'SUPPORT_TRADE', 'INDEPENDENT', 'LEGACY'].includes(l));
      const kinds = cur.preReady[id].kinds;
      const kindCount = {};
      for (const k of kinds) kindCount[k] = (kindCount[k] ?? 0) + 1;
      const ev = type => state.events.filter(e => e.round === cur.round && e.type === type && (e.audience === null || e.audience?.includes(id))).length;
      const open = cur.open[id];
      const eraIdx = Math.min(6, Math.floor((cur.round - 1) / rpe));
      rows.push({
        seat: id, round: cur.round, eraIdx, era: open.era, openStock: open.resources, caps: open.caps,
        produced: sum(['PRODUCE', 'PRODUCE_BONUS']), roundStartGain: Object.values(startLabels).reduce((t, v) => add8(t, v), ZERO8()),
        sustenance: sum(['SUSTENANCE'], -1), growth: sum(['GROWTH'], -1), military: sum(['MILITARY_UPKEEP'], -1), discard: sum(['DISCARD'], -1),
        spend: Object.fromEntries([...GAIN_LABELS_SPEND].map(l => [l, sum([l], -1)]).filter(([, v]) => KEYS.some(k => v[k] !== 0))),
        other: Object.fromEntries(gainLabels.filter(l => !['PRODUCE', 'PRODUCE_BONUS'].includes(l)).map(l => [l, byLabel[l]])),
        losses: Object.fromEntries(Object.keys(byLabel).filter(l => l.startsWith('LOSS:')).map(l => [l, byLabel[l]])),
        ordersUsed: cur.preReady[id].usage.used, ordersLimit: cur.preReady[id].usage.limit, ordersByType: cur.preReady[id].usage.byOrder, kinds: kindCount,
        rejected: (box.rejectLog ?? []).filter(r => r.round === cur.round && r.seat === id).map(r => `${r.type}:${r.action ?? ''}:${r.kind}`),
        actionFailed: ev('ACTION_FAILED'), famine: ev('FOOD_SHORTAGE'), upkeepShortage: ev('UPKEEP_SHORTAGE'), grown: ev('POPULATION_GROWN'), discardEvents: ev('STORAGE_DISCARD'), overextension: ev('ADMINISTRATIVE_OVEREXTENSION'),
        ordersExhausted: cur.infos[id]?.exhausted ?? false, blockedNotes: [...box.blocked.entries()].filter(([k]) => k.startsWith(`${id}:${cur.round}:`)).map(([k, v]) => [k.split(':').slice(2).join(':'), v]),
        cities: open.cities, pop: open.pop, popByCity: open.popByCity, levels: open.levels, mood: open.mood, research: open.research, districts: open.districts, buildings: open.buildings,
        land: open.land, ships: open.ships, pioneers: open.pioneers, adminLoad: open.adminLoad, adminCap: open.adminCap, territory: open.territory, workers: open.workers, government: open.government, prestige: open.prestige,
        mandatoryProduce: box.mandCount ? (box.mandCount.get(`${id}:${cur.round}`) ?? 0) : null, goals: box.goalLog?.get(`${id}:${cur.round}`) ?? null, austere: box.austerityRounds?.has(`${id}:${cur.round}`) ?? false,
        hasNext: !!next,
      });
    }
  }
  return rows;
}

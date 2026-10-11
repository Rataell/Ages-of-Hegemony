#!/usr/bin/env node
// Lane A1: aggregates docs/evidence/v12-audit/lane-a1/runs/*.json (+ variants/*.json) into summary.json and tables.md.
//   node scripts/alpha-economy-report.mjs [--in=docs/evidence/v12-audit/lane-a1]
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const D = await import(new URL('../packages/game-domain/dist/index.js', import.meta.url).href);
const arg = (n, f) => { const hit = process.argv.slice(2).find(a => a.startsWith(`--${n}=`)); return hit ? hit.slice(n.length + 3) : f; };
const IN = resolve(ROOT, arg('in', 'docs/evidence/v12-audit/lane-a1'));
const KEYS = ['food', 'wood', 'stone', 'metal', 'wealth', 'knowledge', 'influence', 'culture'];
const NAMES = { food: 'Alimento', wood: 'Madeira', stone: 'Pedra', metal: 'Metal', wealth: 'Riqueza', knowledge: 'Conhecimento', influence: 'Influência', culture: 'Cultura' };
const POLICIES = ['growth', 'research', 'expansion', 'military', 'balanced'];
const PNAME_EXTRA = { metalculture: 'Cultura e Metal' };
const PNAME = { growth: 'Crescimento', research: 'Pesquisa', expansion: 'Expansão', military: 'Militarização', balanced: 'Equilibrada' };
const ERA_CAP = [2, 3, 4, 5, 6, 6, 7]; // highest city level (OUTPOST=1 ... IMPERIAL=7) the Era allows
const NODES_BY_ERA = [7, 7, 10, 9, 7, 9, 4]; // Web nodes released by Era
const NODES_CUM = NODES_BY_ERA.reduce((a, n) => [...a, (a.at(-1) ?? 0) + n], []);
const LEVEL_NAMES = ['', 'Posto', 'Povoado', 'Vila', 'Cidade', 'Grande Cidade', 'Metrópole', 'Metrópole Imperial'];

const load = dir => existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => JSON.parse(readFileSync(join(dir, f), 'utf8'))) : [];
const runs = load(join(IN, 'runs')).filter(r => POLICIES.includes(r.meta.policy)), extraRuns = load(join(IN, 'runs')).filter(r => !POLICIES.includes(r.meta.policy)), variants = load(join(IN, 'variants')), worldRuns = load(join(IN, 'runs-world'));
const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
const f1 = v => v === null || v === undefined || Number.isNaN(v) ? '–' : (Math.round(v * 10) / 10).toString();
const f2 = v => v === null || v === undefined || Number.isNaN(v) ? '–' : (Math.round(v * 100) / 100).toString();
const pct = (n, d) => d ? `${Math.round(100 * n / d)}%` : '–';
const sum = xs => xs.reduce((a, b) => a + b, 0);
const quant = (xs, q) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map(r => `| ${r.join(' | ')} |`).join('\n')}\n`;

const out = { runs: runs.length, variants: variants.length, generatedFrom: IN };
const md = [];
const push = (title, body) => { md.push(`\n### ${title}\n\n${body}`); };

// ---------------------------------------------------------------------------------------------------------------------------------
// A. Calendar geometry per profile.
{
  const rows = [];
  for (const profile of [21, 35, 49]) {
    const r = runs.find(x => x.meta.profile === profile); if (!r) continue;
    const rpe = r.meta.roundsPerEra, limit = r.meta.roundLimit;
    rows.push([`${profile} (${r.meta.preset})`, limit, rpe, limit * r.meta.actionsPerRound, Array.from({ length: 7 }, (_, e) => e * rpe + 1).join('/'), 6, 7, r.meta.actionsPerRound]);
  }
  out.calendar = rows;
  push('A. Geometria do calendário por perfil', table(['perfil', 'rodadas', 'rodadas/Era', 'Ordens totais (rodadas×5)', 'rodada inicial de cada Era', 'viradas de Era', 'Pulsos do Mundo', 'Ordens/rodada'], rows));
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Helper: per seat state at the end of each Era = open snapshot of the first round of the next Era (or the final state).
function eraEnds(run, seat) {
  const rows = run.rows.filter(r => r.seat === seat), rpe = run.meta.roundsPerEra, ends = [];
  for (let e = 0; e < 7; e++) {
    const nextStart = (e + 1) * rpe + 1;
    const next = rows.find(r => r.round === nextStart);
    const snap = next ?? (run.final?.[seat] ? { ...run.final[seat], round: run.meta.finalRound } : null);
    if (!snap) break;
    ends.push({ era: e, cities: snap.cities, maxLevel: Math.max(0, ...(snap.levels ?? [])), sumLevels: sum(snap.levels ?? []), pop: snap.pop, research: snap.research, built: (snap.districts ?? 0) + (snap.buildings ?? 0), territory: snap.territory });
  }
  return ends;
}
const seatsOf = run => [...new Set(run.rows.map(r => r.seat))];
const eraDev = (runsSel) => {
  // returns per era: arrays across seats
  const acc = Array.from({ length: 7 }, () => ({ cities: [], maxLevel: [], pop: [], research: [], built: [], events: [], evCity: 0, evLevel: 0, evResearch: 0, evBuilt: 0, n: 0, attain: [], resShare: [] }));
  for (const run of runsSel) for (const seat of seatsOf(run)) {
    const ends = eraEnds(run, seat);
    let prev = { cities: 1, sumLevels: 1, research: 0, built: 0 };
    ends.forEach((e, i) => {
      const a = acc[i];
      a.cities.push(e.cities); a.maxLevel.push(e.maxLevel); a.pop.push(e.pop); a.research.push(e.research); a.built.push(e.built); a.n++;
      const ev = { city: e.cities > prev.cities, level: e.sumLevels > prev.sumLevels, research: e.research > prev.research, built: e.built > prev.built };
      a.evCity += ev.city ? 1 : 0; a.evLevel += ev.level ? 1 : 0; a.evResearch += ev.research ? 1 : 0; a.evBuilt += ev.built ? 1 : 0;
      a.events.push(Object.values(ev).filter(Boolean).length);
      a.attain.push(e.maxLevel / ERA_CAP[i]); a.resShare.push(e.research / NODES_CUM[i]);
      prev = e;
    });
  }
  return acc;
};

// B. Development per Era, per profile and policy.
{
  const sec = [];
  out.eraDevelopment = {};
  for (const profile of [21, 35, 49]) {
    const rowsP = [];
    for (const policy of POLICIES) {
      const sel = runs.filter(r => r.meta.profile === profile && r.meta.policy === policy);
      if (!sel.length) continue;
      const acc = eraDev(sel);
      out.eraDevelopment[`${profile}:${policy}`] = acc.map(a => ({ n: a.n, cities: mean(a.cities), maxLevel: mean(a.maxLevel), pop: mean(a.pop), research: mean(a.research), built: mean(a.built), seatErasWithEvent: a.events.filter(x => x > 0).length, evCity: a.evCity, evLevel: a.evLevel, evResearch: a.evResearch, evBuilt: a.evBuilt, attain: mean(a.attain), resShare: mean(a.resShare) }));
      rowsP.push([PNAME[policy], ...acc.map(a => a.n ? `${f1(mean(a.cities))}c · N${f1(mean(a.maxLevel))} · ${f1(mean(a.research))}p · ${f1(mean(a.built))}e` : '–')]);
    }
    sec.push(`**${profile} rodadas** (célula = cidades · nível máx. · pesquisas · distritos+edifícios, ao fim da Era, média dos assentos)\n\n${table(['política', 'Era I', 'Era II', 'Era III', 'Era IV', 'Era V', 'Era VI', 'Era VII'], rowsP)}`);
  }
  push('B. Desenvolvimento no fim de cada Era', sec.join('\n'));

  // Ladder attainment & meaningful-development share, pooled over policies.
  const rows2 = [];
  for (const profile of [21, 35, 49]) {
    const sel = runs.filter(r => r.meta.profile === profile); if (!sel.length) continue;
    const acc = eraDev(sel);
    rows2.push(...[
      [`${profile}`, 'teto de nível da Era', ...ERA_CAP.map(n => `N${n}`)],
      [`${profile}`, 'nível máx. atingido (média)', ...acc.map(a => f1(mean(a.maxLevel)))],
      [`${profile}`, 'atingimento do teto', ...acc.map(a => a.attain.length ? pct(sum(a.attain), a.attain.length) : '–')],
      [`${profile}`, 'avanços / nós liberados', ...acc.map((a, i) => a.research.length ? `${f1(mean(a.research))}/${NODES_CUM[i]}` : '–')],
      [`${profile}`, 'assentos-Era com ≥1 ganho', ...acc.map(a => a.n ? pct(a.events.filter(x => x > 0).length, a.n) : '–')],
      [`${profile}`, 'ganhos por Era (cidade/nível/avanço/edif.)', ...acc.map(a => a.n ? `${f1(mean(a.events))}` : '–')],
    ]);
  }
  out.ladder = rows2;
  push('B2. Teto da escada por Era versus alcançado (todas as políticas)', table(['perfil', 'métrica', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'], rows2));
}

// ---------------------------------------------------------------------------------------------------------------------------------
// C. Resource flows (8 resources).
function flowSummary(runsSel) {
  const acc = Object.fromEntries(KEYS.map(k => [k, { open: [], produced: 0, roundStart: 0, other: 0, spend: 0, sust: 0, growth: 0, mil: 0, discard: 0, loss: 0, zero: 0, atCap: 0, n: 0 }]));
  const spendBy = Object.fromEntries(KEYS.map(k => [k, {}]));
  const otherBy = Object.fromEntries(KEYS.map(k => [k, {}]));
  for (const run of runsSel) for (const row of run.rows) for (const k of KEYS) {
    const a = acc[k]; a.n++;
    a.open.push(row.openStock[k]);
    a.produced += row.produced[k]; a.roundStart += row.roundStartGain[k];
    for (const [l, v] of Object.entries(row.other)) { a.other += v[k]; otherBy[k][l] = (otherBy[k][l] ?? 0) + v[k]; }
    for (const [l, v] of Object.entries(row.spend)) { a.spend += v[k]; spendBy[k][l] = (spendBy[k][l] ?? 0) + v[k]; }
    a.sust += row.sustenance[k]; a.growth += row.growth[k]; a.mil += row.military[k]; a.discard += row.discard[k];
    for (const v of Object.values(row.losses)) a.loss += -v[k];
    if (row.openStock[k] === 0) a.zero++;
    if (row.openStock[k] >= row.caps[k]) a.atCap++;
  }
  return { acc, spendBy, otherBy };
}
{
  const { acc, spendBy, otherBy } = flowSummary(runs);
  const rows = KEYS.map(k => { const a = acc[k]; const n = a.n; return [NAMES[k], f1(mean(a.open)), f2(a.produced / n), f2(a.roundStart / n), f2(a.other / n), f2(a.spend / n), f2((a.sust + a.growth + a.mil) / n), f2(a.discard / n), f2(a.loss / n), pct(a.zero, n), pct(a.atCap, n)]; });
  out.flows = Object.fromEntries(KEYS.map(k => [k, { meanOpen: mean(acc[k].open), perSeatRound: { produced: acc[k].produced / acc[k].n, roundStart: acc[k].roundStart / acc[k].n, other: acc[k].other / acc[k].n, spend: acc[k].spend / acc[k].n, upkeep: (acc[k].sust + acc[k].growth + acc[k].mil) / acc[k].n, discard: acc[k].discard / acc[k].n, loss: acc[k].loss / acc[k].n }, spendBy: spendBy[k], otherBy: otherBy[k], zero: acc[k].zero / acc[k].n, atCap: acc[k].atCap / acc[k].n }]));
  push('C. Fluxos por recurso (média por assento-rodada, todas as partidas)', table(['recurso', 'estoque na abertura', 'produção (Produzir)', 'início de rodada (instit.)', 'outros ganhos (Pulso, cartas, escolhas, rotas…)', 'gasto (Ordens)', 'sustento+Crescer+manutenção militar', 'descartado (limite)', 'perdas', '% rodadas em 0', '% rodadas no limite'], rows));
  const rowsByProfile = [];
  for (const profile of [21, 35, 49]) {
    const sel = runs.filter(r => r.meta.profile === profile); if (!sel.length) continue;
    const s = flowSummary(sel).acc;
    for (const k of KEYS) rowsByProfile.push([profile, NAMES[k], f1(mean(s[k].open)), f2(s[k].produced / s[k].n), f2((s[k].spend + s[k].sust + s[k].growth + s[k].mil) / s[k].n), f2(s[k].discard / s[k].n), pct(s[k].zero, s[k].n), pct(s[k].atCap, s[k].n)]);
  }
  push('C2. Fluxos por perfil', table(['perfil', 'recurso', 'estoque médio', 'produção/rodada', 'saída total/rodada (gasto+consumo)', 'descarte/rodada', '% em 0', '% no limite'], rowsByProfile));
  const spendRows = KEYS.map(k => [NAMES[k], Object.entries(spendBy[k]).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([l, v]) => `${l} ${f1(v / (acc[k].n))}`).join(' · '), Object.entries(otherBy[k]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 5).map(([l, v]) => `${l} ${f2(v / acc[k].n)}`).join(' · ')]);
  push('C3. Origem dos gastos e dos ganhos "outros" (por assento-rodada)', table(['recurso', 'onde é gasto', 'de onde vêm os ganhos não-Produzir'], spendRows));
  // Food waste
  const f = acc.food;
  out.foodWaste = { produced: f.produced, discarded: f.discard, ratio: f.discard / f.produced };
}

// ---------------------------------------------------------------------------------------------------------------------------------
// D. Orders.
{
  const kindsAll = new Set(); for (const r of runs) for (const row of r.rows) Object.keys(row.kinds).forEach(k => kindsAll.add(k));
  const rows = [];
  out.orders = {};
  for (const profile of [21, 35, 49]) for (const policy of POLICIES) {
    const sel = runs.filter(r => r.meta.profile === profile && r.meta.policy === policy); if (!sel.length) continue;
    const rr = sel.flatMap(r => r.rows);
    const used = sum(rr.map(r => r.ordersUsed)), lim = sum(rr.map(r => r.ordersLimit));
    const kinds = {}; rr.forEach(r => Object.entries(r.kinds).forEach(([k, v]) => kinds[k] = (kinds[k] ?? 0) + v));
    const share = k => pct(kinds[k] ?? 0, used);
    const maint = (kinds.PRODUCE ?? 0) + (kinds.PROMOTE_MOOD ?? 0);
    rows.push([profile, PNAME[policy], pct(used, lim), share('PRODUCE'), share('PROMOTE_MOOD'), pct(maint, used), share('RESEARCH'), share('ELEVATE'), share('BUILD'), pct((kinds.CLAIM_HEX ?? 0) + (kinds.IMPROVE_HEX ?? 0), used), pct((kinds.SETTLE ?? 0) + (kinds.MOVE ?? 0) + (kinds.EXPLORE ?? 0) + (kinds.RECRUIT_PIONEER ?? 0), used), pct((kinds.RECRUIT_MIL ?? 0), used)]);
    out.orders[`${profile}:${policy}`] = { used, limit: lim, kinds };
  }
  push('D. Ordens: uso e composição (do total de Ordens gastas)', table(['perfil', 'política', 'Ordens usadas/limite', 'Produzir', 'Governar', 'manutenção (Produzir+Governar)', 'Avançar (pesquisa)', 'Elevar', 'Construir', 'Reivindicar+Melhorar', 'Pioneiros (explorar+mover+fundar)', 'Recrutar militar'], rows));

  // by number of cities
  const byN = {};
  for (const r of runs) for (const row of r.rows) {
    const n = Math.min(5, row.cities); const b = (byN[n] ??= { rows: 0, used: 0, limit: 0, produce: 0, govern: 0, famine: 0, upk: 0, pop: 0, foodProd: 0, sust: 0, wasteFood: 0, idle: 0 });
    b.rows++; b.used += row.ordersUsed; b.limit += row.ordersLimit; b.produce += row.kinds.PRODUCE ?? 0; b.govern += row.kinds.PROMOTE_MOOD ?? 0; b.famine += row.famine ? 1 : 0; b.upk += row.upkeepShortage ? 1 : 0; b.pop += row.pop; b.foodProd += row.produced.food; b.sust += row.sustenance.food + row.military.food; b.wasteFood += row.discard.food; b.idle += row.ordersLimit - row.ordersUsed;
  }
  const rowsN = Object.entries(byN).sort((a, b) => a[0] - b[0]).map(([n, b]) => [n === '5' ? '5+' : n, b.rows, f1(b.pop / b.rows), f2(b.produce / b.rows), f2(b.govern / b.rows), f2((b.produce + b.govern) / b.rows), pct(b.produce + b.govern, b.limit), f2(b.used / b.rows), f1(b.foodProd / b.rows), f1(b.sust / b.rows), f1(b.wasteFood / b.rows), pct(b.famine, b.rows), pct(b.upk, b.rows)]);
  out.ordersByCities = byN;
  push('D2. Ordens de manutenção por número de cidades (medido, todas as políticas)', table(['cidades', 'assento-rodadas', 'pop. média', 'Produzir/rodada', 'Governar/rodada', 'manutenção/rodada', '% das 5 Ordens', 'Ordens usadas/rodada', 'Alimento produzido', 'Alimento consumido (sust.+mil.)', 'Alimento descartado', '% rodadas com fome', '% com peças sem manutenção'], rowsN));
}

// ---------------------------------------------------------------------------------------------------------------------------------
// E. Sustain model from yield samples.
{
  const byLevel = {};
  for (const r of runs) for (const s of r.yieldSamples ?? []) {
    const L = ['OUTPOST', 'HAMLET', 'VILLAGE', 'CITY', 'GREAT_CITY', 'METROPOLIS', 'IMPERIAL_METROPOLIS'].indexOf(s.level) + 1;
    const b = (byLevel[L] ??= { n: 0, food: [], full: [], pop: [], eats: [], cap: [], total: [], wood: [], stone: [], wealth: [], knowledge: [], culture: [], metal: [], influence: [] });
    b.n++; b.food.push(s.out.food); b.pop.push(s.pop); b.eats.push(s.eats); b.cap.push(s.capacity);
    if (s.worked >= s.capacity && s.mood >= 4) b.full.push(s.out.food);
    for (const k of ['wood', 'stone', 'wealth', 'knowledge', 'culture', 'metal', 'influence']) b[k].push(s.out[k]);
    b.total.push(KEYS.reduce((n, k) => n + s.out[k], 0));
  }
  const ceilings = { 1: 4, 2: 6, 3: 8, 4: 11, 5: 14, 6: 18, 7: 18 };
  const rows = Object.entries(byLevel).sort((a, b) => a[0] - b[0]).map(([L, b]) => {
    const yFull = mean(b.full) ?? mean(b.food), ceil = ceilings[L], eatsCeil = Math.ceil(ceil / 2);
    return [`N${L} ${LEVEL_NAMES[L]}`, b.n, f1(mean(b.cap)), f1(mean(b.pop)), f1(mean(b.food)), f1(yFull), f1(quant(b.food, 0.25)), f1(quant(b.food, 0.75)), f1(mean(b.eats)), eatsCeil, f2(eatsCeil / Math.max(0.5, yFull)), f2(mean(b.wood)), f2(mean(b.stone)), f2(mean(b.wealth)), f2(mean(b.knowledge)), f2(mean(b.culture)), f2(mean(b.metal))];
  });
  out.yieldByLevel = byLevel && Object.fromEntries(Object.entries(byLevel).map(([L, b]) => [L, { n: b.n, capacity: mean(b.cap), pop: mean(b.pop), foodPerProduce: mean(b.food), foodPerProduceFullyWorked: mean(b.full), eats: mean(b.eats), wood: mean(b.wood), stone: mean(b.stone), wealth: mean(b.wealth), knowledge: mean(b.knowledge), culture: mean(b.culture), metal: mean(b.metal), influence: mean(b.influence) }]));
  push('E. Rendimento de um Produzir por nível de cidade (amostras: cada cidade, cada rodada)', table(['nível', 'amostras', 'Capacidade', 'pop. média', 'Alimento/Produzir (média)', 'Alimento/Produzir (hexes cheios, Ânimo≥4)', 'p25', 'p75', 'come/rodada (pop. média)', 'come no teto de pop.', 'Produzir por rodada p/ sustentar o teto', 'Madeira', 'Pedra', 'Riqueza', 'Conhecimento', 'Cultura', 'Metal'], rows));

  // Sustain table: N cities of level L at population ceiling + garrison g per city.
  const rowsS = [];
  const best = L => mean(byLevel[L]?.full ?? []) ?? mean(byLevel[L]?.food ?? []) ?? null;
  for (const [L, g] of [[1, 1], [2, 1], [3, 1], [4, 2], [5, 2], [6, 2]]) {
    const y = best(L); if (y === null) continue;
    const eat = Math.ceil(ceilings[L] / 2), mil = g / 2;
    const row = [`N${L} ${LEVEL_NAMES[L]}`, g, f1(y), eat, f2(mil)];
    for (const N of [1, 2, 3]) row.push(f2(N * (eat + mil) / y));
    rowsS.push(row);
  }
  out.sustainModel = rowsS;
  push('E2. Ordens Produzir por rodada para sustentar N cidades (modelo: pop. no teto + guarnição, rendimento medido)', table(['nível', 'peças/cidade', 'Alimento por Produzir', 'sustento/cidade', 'manutenção militar/cidade', 'Produzir/rodada p/ 1 cidade', 'p/ 2 cidades', 'p/ 3 cidades'], rowsS));
}

// ---------------------------------------------------------------------------------------------------------------------------------
// F. Hunger / spiral rates.
{
  const rows = [];
  out.spiral = {};
  for (const profile of [21, 35, 49]) for (const players of [2, 4, 6]) {
    const sel = runs.filter(r => r.meta.profile === profile && r.meta.players === players); if (!sel.length) continue;
    let seats = 0, hungerSeats = 0, spiral = 0, hungerRounds = 0, seatRounds = 0, revolt = 0;
    for (const run of sel) for (const seat of seatsOf(run)) {
      const rows_ = run.rows.filter(r => r.seat === seat); seats++; seatRounds += rows_.length;
      const hung = rows_.filter(r => r.famine || r.upkeepShortage); hungerRounds += hung.length; if (hung.length) hungerSeats++;
      const peak = Math.max(...rows_.map(r => r.pop)), last = rows_.at(-1).pop;
      if (hung.length >= 5 && last <= peak * 0.6) spiral++;
      revolt += rows_.filter(r => r.mood.some(m => m <= 1)).length;
    }
    rows.push([profile, players, seats, pct(hungerSeats, seats), pct(spiral, seats), pct(hungerRounds, seatRounds), pct(revolt, seatRounds)]);
    out.spiral[`${profile}:${players}`] = { seats, hungerSeats, spiral, hungerRounds, seatRounds, revolt };
  }
  push('F. Fome e espiral de Revolta (política aplicada com disciplina de austeridade)', table(['perfil', 'jogadores', 'assentos', '% com ≥1 rodada de fome/peças sem manutenção', '% em espiral (≥5 rodadas e pop. final ≤60% do pico)', '% rodadas-assento com fome/peças', '% rodadas com cidade em Revolta'], rows));
}

// ---------------------------------------------------------------------------------------------------------------------------------
// G. Bottlenecks.
{
  const rows = [];
  out.bottlenecks = {};
  for (const profile of [21, 35, 49]) {
    const sel = runs.filter(r => r.meta.profile === profile); if (!sel.length) continue;
    const rr = sel.flatMap(r => r.rows);
    const cnt = {}; let n = 0, cityRounds = 0;
    for (const row of rr) {
      n++;
      const g = row.goals; if (!g) continue;
      for (const e of g.elevate) { cityRounds++; const k = e.startsWith('RES:') ? 'RES' : e; cnt[`ELEVAR:${k}`] = (cnt[`ELEVAR:${k}`] ?? 0) + 1; if (e.startsWith('RES:')) for (const res of e.slice(4).split('+')) cnt[`ELEVAR:RES:${res}`] = (cnt[`ELEVAR:RES:${res}`] ?? 0) + 1; }
      cnt[`PESQUISA:${g.research}`] = (cnt[`PESQUISA:${g.research}`] ?? 0) + 1;
      if (g.settle) cnt[`FUNDAR:${g.settle}`] = (cnt[`FUNDAR:${g.settle}`] ?? 0) + 1;
    }
    out.bottlenecks[profile] = { cityRounds, seatRounds: n, cnt };
    const e = k => pct(cnt[`ELEVAR:${k}`] ?? 0, cityRounds);
    rows.push([profile, n, e('READY'), e('POP'), e('ERA'), e('ADVANCE'), e('RES'), e('MAX'), pct(cnt['PESQUISA:KNOWLEDGE'] ?? 0, n), pct(cnt['PESQUISA:NONE_AVAILABLE'] ?? 0, n), pct(rr.filter(r => r.ordersExhausted).length, n), pct(rr.filter(r => r.ordersLimit - r.ordersUsed > 0).length, n), f2(mean(rr.map(r => r.ordersLimit - r.ordersUsed)))]);
  }
  push('G. Gargalos: o que bloqueia Elevar (por cidade-rodada) e pesquisa; Ordens esgotadas/ociosas', table(['perfil', 'assento-rodadas', 'Elevar pronto', 'bloqueio: população', 'bloqueio: Era', 'bloqueio: avanço na Teia', 'bloqueio: recursos', 'nível máximo', 'pesquisa sem Conhecimento', 'pesquisa sem nós', '% rodadas com Ordens esgotadas', '% rodadas com Ordem ociosa', 'Ordens ociosas/rodada'], rows));
  const resRows = [];
  for (const profile of [21, 35, 49]) { const b = out.bottlenecks[profile]; if (!b) continue; for (const k of KEYS) { const c = b.cnt[`ELEVAR:RES:${k}`]; if (c) resRows.push([profile, NAMES[k], c, pct(c, b.cityRounds)]); } }
  push('G2. Recurso que falta quando Elevar está bloqueado por recursos', table(['perfil', 'recurso', 'cidade-rodadas', '% das cidade-rodadas'], resRows));
}

// ---------------------------------------------------------------------------------------------------------------------------------
// H. Conservation summary.
{
  const total = { runs: runs.length, commands: 0, residuals: 0, identityViolations: 0, identityChecks: 0, ledgerFields: 0, ledgerMismatches: 0, chainBreaks: 0, eraTurnChainChecks: 0, orphanFlows: 0, orphanTotal: Object.fromEntries(KEYS.map(k => [k, 0])), cultureTraced: 0, cultureByLabel: {}, sus: [0, 0], growth: [0, 0], mil: [0, 0], storage: [0, 0], dispCost: [0, 0], dispCostNotExec: 0, dispProd: [0, 0], dispProdExact: 0, specDropped: 0, specBy: {}, unclassified: 0, slotMismatchSkips: 0, rejected: {}, actionFailed: {} };
  const ledgerBy = {}, costMismatch = [], prodMismatch = [], chain = [], chainMagnitude = Object.fromEntries(KEYS.map(k => [k, 0]));
  for (const r of runs) {
    const c = r.checks;
    total.commands += r.meta.commands; total.residuals += c.residualsAtCommand.length; total.identityViolations += c.identity.length; total.identityChecks += seatsOf(r).length * (new Set(r.rows.map(x => x.round)).size);
    total.ledgerFields += c.ledger.fieldsCompared; total.ledgerMismatches += c.ledger.mismatches.length;
    for (const m of c.ledger.mismatches) { const k = `${m.field}:${m.resource}`; ledgerBy[k] = (ledgerBy[k] ?? 0) + 1; }
    total.chainBreaks += c.ledger.chainBreaks.length; total.eraTurnChainChecks += Math.floor(r.meta.finalRound / r.meta.roundsPerEra) * seatsOf(r).length;
    for (const b of c.ledger.chainBreaks) chain.push({ profile: r.meta.profile, eraTurn: b.eraTurn, diff: b.diff });
    total.orphanFlows += c.orphan.eraTurnFlows.length; for (const k of KEYS) total.orphanTotal[k] += c.orphan.total[k];
    for (const [l, v] of Object.entries(c.culture.traced.byLabel)) { total.cultureByLabel[l] = (total.cultureByLabel[l] ?? 0) + v; total.cultureTraced += v; }
    total.sus[0] += c.formulas.sustenance.mismatches.length; total.sus[1] += c.formulas.sustenance.n;
    total.growth[0] += c.formulas.growth.mismatches.length; total.growth[1] += c.formulas.growth.n;
    total.mil[0] += c.formulas.military.mismatches.length; total.mil[1] += c.formulas.military.n;
    total.storage[0] += c.formulas.storage.mismatches.filter(m => m.round > 1).length; total.storage[1] += c.formulas.storage.n; total.storageRound1 = (total.storageRound1 ?? 0) + c.formulas.storage.mismatches.filter(m => m.round === 1).length;
    total.dispCost[0] += c.display.cost.mismatches.length; total.dispCost[1] += c.display.cost.n; total.dispCostNotExec += (c.display.cost.notExecuted ?? []).length; for (const ne of c.display.cost.notExecuted ?? []) { if (ne.action === 'PROMOTE_MOOD' && ne.displayed.culture > 0) total.governCultureFree = (total.governCultureFree ?? 0) + 1; }
    total.dispProd[0] += c.display.produce.mismatches.length; total.dispProd[1] += c.display.produce.n; total.dispProdExact += c.display.produce.exact;
    total.ordersUsed = (total.ordersUsed ?? 0) + sum(r.rows.map(x => x.ordersUsed));
    for (const m of c.display.cost.mismatches) {
      const mat = v => (v.wood ?? 0) + (v.stone ?? 0) + (v.metal ?? 0);
      const sameOther = ['food', 'knowledge', 'influence', 'culture'].every(k => (m.paid[k] ?? 0) === (m.displayed[k] ?? 0));
      const kind = sameOther && m.paid.wealth === m.displayed.wealth && mat(m.paid) === mat(m.displayed) ? 'split' : sameOther && m.paid.wealth > m.displayed.wealth && mat(m.paid) < mat(m.displayed) ? 'wealth' : 'other';
      (total.costKinds ??= { split: 0, wealth: 0, other: 0 })[kind]++;
      if (kind !== 'split') (total.costNonSplit ??= []).push({ profile: r.meta.profile, policy: r.meta.policy, seat: m.seat, round: m.round, action: m.action, displayed: m.displayed, paid: m.paid, kind });
    }
    for (const m of c.display.cost.mismatches) costMismatch.push({ profile: r.meta.profile, policy: r.meta.policy, seat: m.seat, round: m.round, action: m.action, displayed: m.displayed, paid: m.paid });
    for (const m of c.display.produce.mismatches) prodMismatch.push({ profile: r.meta.profile, policy: r.meta.policy, seat: m.seat, round: m.round, diff: m.diff, civ: r.meta.civs[Number(m.seat.slice(1)) - 1] });
    total.specDropped += r.speculativeFlowsDropped?.count ?? 0; for (const [k, v] of Object.entries(r.speculativeFlowsDropped?.by ?? {})) total.specBy[k] = (total.specBy[k] ?? 0) + v;
    total.unclassified += c.unclassified.length; total.slotMismatchSkips += r.slotMismatchSkips?.length ?? 0;
    for (const [k, v] of Object.entries(r.meta.rejectedReasons ?? {})) total.rejected[k] = (total.rejected[k] ?? 0) + v;
    for (const [k, v] of Object.entries(r.actionFailedReasons ?? {})) total.actionFailed[k] = (total.actionFailed[k] ?? 0) + v;
  }
  for (const b of chain) for (const k of Object.keys(b.diff)) chainMagnitude[k] += Math.abs(b.diff[k]);
  out.conservation = { ...total, ledgerByField: ledgerBy, costMismatchSample: costMismatch.slice(0, 12), prodMismatchSample: prodMismatch.slice(0, 12), chainBreakEraTurn: chain.filter(b => b.eraTurn).length, chainBreakOther: chain.filter(b => !b.eraTurn).length, chainMagnitude };
  const rows = [
    ['Comandos medidos (cada um reconcilia a piscina de todas as civilizações com o rastreador)', total.commands, `${total.residuals} resíduos`],
    ['Identidade da piscina por assento-rodada: abertura + Σ fluxos rastreados = abertura seguinte (8 recursos)', total.identityChecks, `${total.identityViolations} violações`],
    ['Ledger (state.roundReports) × rastreador, campo a campo (5 recursos do ledger)', total.ledgerFields, `${total.ledgerMismatches} divergências`],
    ['Cadeia fechamento(r) = abertura(r+1) nos relatórios', total.eraTurnChainChecks + ' viradas de Era', `${total.chainBreaks} quebras (${out.conservation.chainBreakEraTurn} em virada de Era, ${out.conservation.chainBreakOther} fora)`],
    ['Fluxos da Virada de Era fora de qualquer relatório', total.orphanFlows, Object.entries(total.orphanTotal).filter(([, v]) => v).map(([k, v]) => `${NAMES[k]} ${v > 0 ? '+' : ''}${v}`).join(', ') || '0'],
    ['Cultura rastreada (invisível no ledger)', Object.keys(total.cultureByLabel).length + ' origens', Object.entries(total.cultureByLabel).map(([l, v]) => `${l} ${v > 0 ? '+' : ''}${v}`).join(', ') || '0'],
    ['Sustento: pago + faltante = Σ ⌈pop/2⌉ por cidade', total.sus[1], `${total.sus[0]} divergências`],
    ['Crescer: custo gasto = 3 por habitante (2 com Celeiro)', total.growth[1], `${total.growth[0]} divergências`],
    ['Manutenção militar: ⌈peças terrestres/2⌉ Alimento + 1 Riqueza por navio', total.mil[1], `${total.mil[0]} divergências`],
    ['Limite de armazenamento respeitado na abertura do Planejamento (rodadas 2+)', total.storage[1], `${total.storage[0]} violações; na rodada 1: ${total.storageRound1} assentos abrem acima do limite (Alimento 16-19 > 15)`],
    ['Custo exibido × custo pago (Ordens com custo executadas)', total.dispCost[1], `${total.dispCost[0]} divergências: ${total.costKinds?.split ?? 0} só trocam Madeira/Pedra (benigno), ${total.costKinds?.wealth ?? 0} por Riqueza que cobre material faltante, ${total.costKinds?.other ?? 0} outras; ${total.dispCostNotExec} planos sem nenhum fluxo de pagamento: ${total.governCultureFree ?? 0} são Governar com custo exibido de 1 Cultura e Cultura jamais debitada, o resto é ACTION_FAILED`],
    ['Ordens consumidas por plano que falhou na resolução (ACTION_FAILED)', total.ordersUsed, `${Object.values(total.actionFailed).reduce((a, b) => a + b, 0)} (${pct(Object.values(total.actionFailed).reduce((a, b) => a + b, 0), total.ordersUsed)} das Ordens usadas)`],
    ['Produção exibida × creditada (Produzir)', total.dispProd[1], `${total.dispProd[0]} divergências, ${total.dispProdExact} exatas`],
    ['Fluxos especulativos descartados (prévias que pagam em clones)', total.specDropped, JSON.stringify(total.specBy)],
  ];
  push('H. Conservação: verificação independente', table(['verificação', 'amostras', 'resultado'], rows));
  if (Object.keys(ledgerBy).length) push('H2. Divergências ledger × rastreador por campo', table(['campo:recurso', 'ocorrências'], Object.entries(ledgerBy).map(([k, v]) => [k, v])));
  if (costMismatch.length) push('H3. Custo exibido ≠ pago (amostra)', table(['perfil', 'política', 'assento', 'rodada', 'ação', 'exibido', 'pago'], costMismatch.slice(0, 12).map(m => [m.profile, m.policy, m.seat, m.round, m.action, JSON.stringify(Object.fromEntries(Object.entries(m.displayed).filter(([, v]) => v))), JSON.stringify(Object.fromEntries(Object.entries(m.paid).filter(([, v]) => v)))])));
  if (prodMismatch.length) push('H4. Produção exibida ≠ creditada (amostra)', table(['perfil', 'política', 'civ', 'rodada', 'diferença creditada − exibida'], prodMismatch.slice(0, 12).map(m => [m.profile, m.policy, m.civ, m.round, JSON.stringify(Object.fromEntries(Object.entries(m.diff).filter(([, v]) => v)))])));
  push('H5. Comandos rejeitados e ações planejadas que falham na resolução', `Rejeitados na emissão:\n\n${table(['comando:motivo', 'n'], Object.entries(total.rejected).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]))}\nFalharam na resolução (ACTION_FAILED, Ordem consumida):\n\n${table(['motivo', 'n'], Object.entries(total.actionFailed).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]))}`);
}

// ---------------------------------------------------------------------------------------------------------------------------------
// I. Variants (comparative models).
if (variants.length) {
  const groups = {};
  for (const v of variants) { const k = `${v.meta.variant}`; (groups[k] ??= []).push(v); }
  const base21 = runs.filter(r => r.meta.profile === 21 && r.meta.players === 2), base35 = runs.filter(r => r.meta.profile === 35 && r.meta.players === 2);
  const snap = (sel, eraIdx) => { const acc = eraDev(sel)[eraIdx]; return { n: acc.n, cities: mean(acc.cities), maxLevel: mean(acc.maxLevel), pop: mean(acc.pop), research: mean(acc.research), built: mean(acc.built), attain: mean(acc.attain) }; };
  const rows = [];
  out.variants = {};
  const add = (label, sel, kind) => { for (const e of [1, 2, 3, 4, 5, 6]) { const s = snap(sel, e); if (!s.n) continue; out.variants[`${label}:E${e + 1}`] = s; } rows.push([label, kind, ...[1, 3, 6].map(e => { const s = snap(sel, e); return s.n ? `${f1(s.cities)}c · N${f1(s.maxLevel)} · ${f1(s.research)}p · ${f1(s.built)}e · pop ${f1(s.pop)}` : '–'; })]); };
  add('35 rodadas (referência RC4)', base35, 'base');
  add('21 rodadas (RC4)', base21, 'base');
  for (const [name, list_] of Object.entries(groups)) add(`21 rodadas · ${name}`, list_, 'modelo');
  push('I. Modelos comparativos para o perfil de 21 rodadas (cenários, não aplicados). Células: ao fim das Eras II, IV e VII', table(['cenário', 'tipo', 'fim da Era II', 'fim da Era IV', 'fim da Era VII'], rows));
}

// D4. Orders by canonical type (Cidade / Expedição / Avanço / Influência / Legado).
{
  const rows = [];
  out.ordersByType = {};
  for (const profile of [21, 35, 49]) for (const policy of POLICIES) {
    const sel = runs.filter(r => r.meta.profile === profile && r.meta.policy === policy); if (!sel.length) continue;
    const rr = sel.flatMap(r => r.rows);
    const t = { CITY: 0, EXPEDITION: 0, ADVANCE: 0, INFLUENCE: 0, LEGACY: 0 };
    for (const row of rr) for (const k of Object.keys(t)) t[k] += row.ordersByType[k] ?? 0;
    const used = sum(Object.values(t)), lim = sum(rr.map(x => x.ordersLimit));
    rows.push([profile, PNAME[policy], f2(lim / rr.length), f2(used / rr.length), ...Object.keys(t).map(k => `${f2(t[k] / rr.length)} (${pct(t[k], used)})`), pct(lim - used, lim)]);
    out.ordersByType[`${profile}:${policy}`] = t;
  }
  push('D4. Ordens por tipo canônico (média por assento-rodada; entre parênteses, parcela das Ordens usadas)', table(['perfil', 'política', 'Ordens/rodada', 'usadas', 'Cidade', 'Expedição', 'Avanço', 'Influência', 'Legado', '% de Ordens ociosas'], rows));
}

// ---------------------------------------------------------------------------------------------------------------------------------
// D3. Mandatory (food-driven) Produce per number of cities. Only runs recorded after the field existed carry it.
{
  const byN = {};
  for (const r of runs) for (const row of r.rows) {
    if (row.mandatoryProduce === null || row.mandatoryProduce === undefined) continue;
    const n = Math.min(4, row.cities); const b = (byN[n] ??= { rows: 0, mand: [], clean: 0, produce: 0, govern: 0 });
    b.rows++; b.mand.push(row.mandatoryProduce); b.produce += row.kinds.PRODUCE ?? 0; b.govern += row.kinds.PROMOTE_MOOD ?? 0;
    if (!row.famine && !row.upkeepShortage) b.clean++;
  }
  const rows = Object.entries(byN).sort((a, b) => a[0] - b[0]).map(([n, b]) => [n === '4' ? '4+' : n, b.rows, f2(mean(b.mand)), pct(b.mand.filter(x => x >= 1).length, b.rows), f2(quant(b.mand, 0.5)), f2(quant(b.mand, 0.9)), f2(b.produce / b.rows), f2(b.govern / b.rows), pct(b.clean, b.rows)]);
  out.mandatoryProduce = byN && Object.fromEntries(Object.entries(byN).map(([n, b]) => [n, { rows: b.rows, mean: mean(b.mand), p50: quant(b.mand, 0.5), p90: quant(b.mand, 0.9) }]));
  if (rows.length) push('D3. Produzir obrigatório por alimento (a política só produz por comida quando a simulação da Manutenção acaba sem reserva)', table(['cidades', 'assento-rodadas', 'Produzir por alimento (média)', '% rodadas com ≥1', 'mediana', 'p90', 'Produzir total (média)', 'Governar (média)', '% rodadas sem fome nem peças sem manutenção'], rows));
}

// ---------------------------------------------------------------------------------------------------------------------------------
// K. Threats on/off.
if (worldRuns.length) {
  const key = r => `${r.meta.policy}:${r.meta.profile}:${r.meta.players}:${r.meta.seed}`;
  const peaceBy = new Map(runs.map(r => [key(r), r]));
  const agg = (list) => { let seats = 0, hunger = 0, spiral = 0, hungerRounds = 0, seatRounds = 0, pop = [], cities = [], research = [], moodLow = 0, assaults = 0; for (const run of list) for (const seat of seatsOf(run)) { const rr = run.rows.filter(x => x.seat === seat); seats++; seatRounds += rr.length; const h = rr.filter(x => x.famine || x.upkeepShortage).length; hungerRounds += h; if (h) hunger++; const peak = Math.max(...rr.map(x => x.pop)); if (h >= 5 && rr.at(-1).pop <= peak * 0.6) spiral++; pop.push(rr.at(-1).pop); cities.push(rr.at(-1).cities); research.push(rr.at(-1).research); moodLow += rr.filter(x => x.mood.some(m => m <= 1)).length; } return { seats, hunger, spiral, hungerRounds, seatRounds, pop: mean(pop), cities: mean(cities), research: mean(research), moodLow }; };
  const rows = [];
  out.worldVsPeace = {};
  for (const profile of [21, 35]) for (const players of [2, 4]) {
    const w = worldRuns.filter(r => r.meta.profile === profile && r.meta.players === players); if (!w.length) continue;
    const pr = w.map(r => peaceBy.get(key(r))).filter(Boolean);
    const a = agg(w), b = agg(pr);
    rows.push([profile, players, w.length, pct(b.hunger, b.seats), pct(a.hunger, a.seats), pct(b.hungerRounds, b.seatRounds), pct(a.hungerRounds, a.seatRounds), pct(b.moodLow, b.seatRounds), pct(a.moodLow, a.seatRounds), f1(b.pop), f1(a.pop), f1(b.research), f1(a.research)]);
    out.worldVsPeace[`${profile}:${players}`] = { world: a, peace: b };
  }
  push('K. Ameaças do Mundo ligadas × desligadas (mesma política, perfil, jogadores e semente)', table(['perfil', 'jogadores', 'partidas', '% assentos com fome (sem ameaças)', '(com ameaças)', '% rodadas com fome (sem)', '(com)', '% rodadas com cidade em Revolta (sem)', '(com)', 'pop. final (sem)', '(com)', 'pesquisas finais (sem)', '(com)'], rows));
}

// ---------------------------------------------------------------------------------------------------------------------------------
// L. Culture and Metal.
{
  const sel = [...runs, ...extraRuns];
  const names = { ...PNAME, ...PNAME_EXTRA };
  const rows = [];
  out.cultureMetal = {};
  for (const policy of [...POLICIES, 'metalculture']) {
    const list = sel.filter(r => r.meta.policy === policy); if (!list.length) continue;
    const rr = list.flatMap(r => r.rows);
    const seats = list.reduce((n, r) => n + seatsOf(r).length, 0);
    const first = (res) => { const f = []; for (const r of list) for (const seat of seatsOf(r)) { const x = r.rows.filter(y => y.seat === seat); let cum = 0, hit = null; for (const y of x) { cum += y.produced[res]; if (cum > 0 && hit === null) hit = y.round; } if (hit !== null) f.push(hit); } return f; };
    const fc = first('culture'), fm = first('metal');
    const gov = sum(rr.map(x => x.kinds.PROMOTE_MOOD ?? 0));
    rows.push([names[policy], list.length, f2(sum(rr.map(x => x.produced.culture)) / rr.length), f1(mean(rr.map(x => x.openStock.culture))), pct(rr.filter(x => x.openStock.culture >= x.caps.culture).length, rr.length), f2(gov / seats), fc.length ? `${fc.length}/${seats} (r${f1(mean(fc))})` : `0/${seats}`, f2(sum(rr.map(x => x.produced.metal)) / rr.length), f1(mean(rr.map(x => x.openStock.metal))), fm.length ? `${fm.length}/${seats} (r${f1(mean(fm))})` : `0/${seats}`]);
    out.cultureMetal[policy] = { runs: list.length, seats, culturePerSeatRound: sum(rr.map(x => x.produced.culture)) / rr.length, cultureStock: mean(rr.map(x => x.openStock.culture)), metalPerSeatRound: sum(rr.map(x => x.produced.metal)) / rr.length, metalStock: mean(rr.map(x => x.openStock.metal)), seatsWithMetal: fm.length, seatsWithCulture: fc.length, governOrders: gov };
  }
  push('L. Cultura e Metal medidos (produção por Produzir; estoque; primeira rodada com produção)', table(['política', 'partidas', 'Cultura produzida/assento-rodada', 'Cultura em estoque (média)', '% rodadas com Cultura no limite', 'Governar por assento', 'assentos que produziram Cultura (1ª rodada)', 'Metal produzido/assento-rodada', 'Metal em estoque (média)', 'assentos que produziram Metal (1ª rodada)'], rows));
}

// ---------------------------------------------------------------------------------------------------------------------------------
// M. Knowledge budget: what the Web asks versus what the policies produced.
{
  const costByEra = Array.from({ length: 7 }, () => 0);
  const eraIdx = e => ['FOUNDATION', 'EXPANSION', 'CONSOLIDATION', 'CIVILIZATION', 'EMPIRES', 'POWERS', 'ASCENSION'].indexOf(e);
  for (const a of D.ADVANCEMENTS) costByEra[eraIdx(a.era)] += a.cost.knowledge;
  const cum = costByEra.reduce((a, n) => [...a, (a.at(-1) ?? 0) + n], []);
  const rows = [];
  out.knowledge = { costByEra, cum };
  for (const profile of [21, 35, 49]) {
    const sel = runs.filter(r => r.meta.profile === profile); if (!sel.length) continue;
    const rr = sel.flatMap(r => r.rows), seats = sel.reduce((n, r) => n + seatsOf(r).length, 0), rounds = sel[0].meta.finalRound;
    const prod = sum(rr.map(x => x.produced.knowledge)) / seats, other = sum(rr.map(x => Object.values(x.other).reduce((n, v) => n + v.knowledge, 0) + x.roundStartGain.knowledge)) / seats;
    const spent = sum(rr.map(x => (x.spend.RESEARCH?.knowledge ?? 0) + (x.spend.ELEVATE?.knowledge ?? 0))) / seats;
    rows.push([profile, f1(prod), f1(other), f1(prod + other), f1(spent), `${cum[6]} (Teia) + 9 (Elevar N5-N7)`, f2((prod + other) / rounds), f2(cum[6] / rounds)]);
    out.knowledge[profile] = { produced: prod, other, spent, perRound: (prod + other) / rounds };
  }
  push('M. Conhecimento: oferta medida × demanda da Teia (por assento, partida inteira)', table(['perfil', 'produzido por Produzir', 'outras fontes (instit., cartas, Pulso…)', 'oferta total', 'gasto (Avançar+Elevar)', 'custo da Teia inteira', 'oferta por rodada', 'custo da Teia por rodada (se tudo)'], rows) + `\nCusto de Conhecimento da Teia por Era (nós liberados): ${costByEra.join(' / ')}; acumulado ${cum.join(' / ')}.\n`);
}

// ---------------------------------------------------------------------------------------------------------------------------------
// N. Food cap as a population ceiling.
{
  const rowsA = [];
  const eatAtCeiling = { 1: 2, 2: 3, 3: 4, 4: 6, 5: 7, 6: 9, 7: 9 };
  for (const cap of [15, 20, 23, 25, 30]) {
    const maxPop = (mil) => 2 * (cap - 2 - mil);
    rowsA.push([cap, maxPop(0), maxPop(2), ...[2, 3, 4].map(n => [3, 4, 5, 6].filter(L => n * eatAtCeiling[L] <= cap - 2).map(L => `N${L}`).slice(-1)[0] ?? '–')]);
  }
  out.foodCapModel = rowsA;
  push('N. Limite de Alimento como teto de população (modelo: vazão ≤ limite − 2 de margem; Crescer é automático)', table(['limite de Alimento', 'pop. máx. sustentável (sem peças)', 'com 2 Alimento de peças', 'maior nível com 2 cidades no teto de pop.', 'com 3 cidades', 'com 4 cidades'], rowsA) + '\nLimites alcançáveis hoje: 15 base; +5 com Celeiro (um só conta); +3 com a primeira Metrópole; Armazém, Tesouraria, Banco, Academia, Fundição, Teatro e Chancelaria não existem no motor (P13).\n');
  const byCap = {};
  for (const r of runs) for (const row of r.rows) {
    if (row.cities < 2) continue;
    const cap = row.caps.food; const b = (byCap[cap] ??= { n: 0, pop: [], disc: 0, hunger: 0, prod: 0, discF: 0 });
    b.n++; b.pop.push(row.pop); b.disc += row.discard.food > 0 ? 1 : 0; b.hunger += (row.famine || row.upkeepShortage) ? 1 : 0; b.prod += row.produced.food; b.discF += row.discard.food;
  }
  const rowsB = Object.entries(byCap).sort((a, b) => a[0] - b[0]).filter(([, b]) => b.n >= 30).map(([cap, b]) => [cap, b.n, f1(mean(b.pop)), f1(quant(b.pop, 0.9)), pct(b.disc, b.n), pct(b.discF, b.prod), pct(b.hunger, b.n)]);
  out.foodCapMeasured = byCap;
  push('N2. Medido: população × limite de Alimento (assentos com ≥2 cidades)', table(['limite de Alimento', 'assento-rodadas', 'pop. média', 'pop. p90', '% rodadas com descarte de Alimento', 'Alimento descartado / produzido', '% rodadas com fome/peças'], rowsB));
}

// ---------------------------------------------------------------------------------------------------------------------------------
// J. Analytic ladder: earliest feasible round per level (population growth +1/round/city; Era gate) and the minimum Orders for one city.
{
  const LV = ['HAMLET', 'VILLAGE', 'CITY', 'GREAT_CITY', 'METROPOLIS', 'IMPERIAL_METROPOLIS'];
  const eraOf = { HAMLET: 0, VILLAGE: 1, CITY: 2, GREAT_CITY: 3, METROPOLIS: 4, IMPERIAL_METROPOLIS: 6 };
  const rows = [];
  out.ladderBound = {};
  for (const R of [3, 5, 7]) {
    for (const lv of LV) {
      const req = D.elevateRequirement(lv);
      const tPop = req.minPopulation - 1; // pop 2 at the start of round 1, +1 per round at most
      const tEra = eraOf[lv] * R + 1;
      const t = Math.max(tPop, tEra);
      rows.push([R * 7, `${LV.indexOf(lv) + 2}. ${LEVEL_NAMES[LV.indexOf(lv) + 2]}`, req.minPopulation, tPop, tEra, t, tPop >= tEra ? 'população' : 'Era', R * 7 - t + 1, f1((R * 7 - t + 1) / (R * 7) * 100) + '%']);
      out.ladderBound[`${R * 7}:${lv}`] = { tPop, tEra, t };
    }
  }
  push('J. Escada: rodada mais cedo possível para cada nível (1 habitante por rodada por cidade; Era como trava) — limite inferior, sem recursos nem pesquisa', table(['perfil', 'nível', 'pop. mínima', 'rodada pela população', 'rodada pela Era', 'rodada mais cedo', 'quem trava', 'rodadas restantes', '% da partida restante'], rows));
  // Minimum Orders for one city to climb: Elevar steps + Web nodes in the prerequisite closure.
  const nodes = new Map(D.ADVANCEMENTS.map(a => [a.id, a]));
  const closure = (ids, have = new Set()) => { const visit = id => { if (have.has(id)) return; const n = nodes.get(id); if (!n) return; n.prerequisites.forEach(visit); have.add(id); }; ids.forEach(visit); return have; };
  const rows2 = []; const have = new Set(); let accKnow = 0, accRes = { wood: 0, stone: 0, wealth: 0, knowledge: 0 };
  LV.forEach((lv, i) => {
    const req = D.elevateRequirement(lv); const before = have.size;
    closure(req.advances, have);
    const added = [...have].slice(before);
    const know = added.reduce((n, id) => n + (nodes.get(id)?.cost?.knowledge ?? 0), 0); accKnow += know;
    for (const k of Object.keys(accRes)) accRes[k] += req.cost[k] ?? 0;
    rows2.push([`${i + 2}. ${LEVEL_NAMES[i + 2]}`, added.length, i + 1, added.length + i + 1, accKnow, accKnow + accRes.knowledge, accRes.wood, accRes.stone, accRes.wealth]);
  });
  out.minOrdersOneCity = rows2;
  push('J2. Mínimo de Ordens para uma cidade subir (cumulativo): nós da Teia exigidos + Elevares, e o que isso custa', table(['até o nível', 'nós novos na Teia', 'Elevares acumulados', 'Ordens mínimas acumuladas (Avançar+Elevar)', 'Conhecimento da Teia (acum.)', 'Conhecimento total (Teia+Elevar)', 'Madeira (Elevar)', 'Pedra (Elevar)', 'Riqueza (Elevar)'], rows2));
}

// ---------------------------------------------------------------------------------------------------------------------------------
// CSV of every seat-round (the raw per-round record asked by the audit).
{
  const head = ['mode', 'policy', 'variant', 'profile', 'players', 'seed', 'seat', 'round', 'era', ...KEYS.map(k => `open_${k}`), ...KEYS.map(k => `produced_${k}`), ...KEYS.map(k => `roundstart_${k}`), ...KEYS.map(k => `spend_${k}`), ...KEYS.map(k => `other_gain_${k}`), 'sustenance_food', 'growth_food', 'military_food', 'military_wealth', ...KEYS.map(k => `discard_${k}`), 'orders_used', 'orders_limit', 'orders_CITY', 'orders_EXPEDITION', 'orders_ADVANCE', 'orders_INFLUENCE', 'orders_LEGACY', 'kinds', 'mandatory_produce', 'cities', 'pop', 'levels', 'mood_min', 'mood_avg', 'research', 'districts', 'buildings', 'land_pieces', 'territory', 'admin_load', 'admin_cap', 'famine', 'upkeep_shortage', 'action_failed', 'rejected', 'orders_exhausted', 'austere', 'elevate_blockers', 'research_blocker', 'settle_blocker'];
  const lines = [head.join(',')];
  const all = [...runs.map(r => ({ r, mode: 'peace' })), ...extraRuns.map(r => ({ r, mode: 'peace' })), ...worldRuns.map(r => ({ r, mode: 'world' })), ...variants.map(r => ({ r, mode: 'variant' }))];
  for (const { r, mode } of all) for (const row of r.rows) {
    const spendTotal = Object.fromEntries(KEYS.map(k => [k, Object.values(row.spend).reduce((n, v) => n + v[k], 0)]));
    const otherGain = Object.fromEntries(KEYS.map(k => [k, Object.values(row.other).reduce((n, v) => n + v[k], 0)]));
    const cells = [mode, r.meta.policy, r.meta.variant ?? 'base', r.meta.profile, r.meta.players, r.meta.seed, row.seat, row.round, row.era, ...KEYS.map(k => row.openStock[k]), ...KEYS.map(k => row.produced[k]), ...KEYS.map(k => row.roundStartGain[k]), ...KEYS.map(k => spendTotal[k]), ...KEYS.map(k => otherGain[k]), row.sustenance.food, row.growth.food, row.military.food, row.military.wealth, ...KEYS.map(k => row.discard[k]), row.ordersUsed, row.ordersLimit, row.ordersByType.CITY, row.ordersByType.EXPEDITION, row.ordersByType.ADVANCE, row.ordersByType.INFLUENCE, row.ordersByType.LEGACY, JSON.stringify(row.kinds).replace(/,/g, ';'), row.mandatoryProduce ?? '', row.cities, row.pop, row.levels.join('/'), Math.min(...row.mood), f2(mean(row.mood)), row.research, row.districts, row.buildings, row.land, row.territory, row.adminLoad, row.adminCap, row.famine, row.upkeepShortage, row.actionFailed, row.rejected.length, row.ordersExhausted ? 1 : 0, row.austere ? 1 : 0, (row.goals?.elevate ?? []).join('/'), row.goals?.research ?? '', row.goals?.settle ?? ''];
    lines.push(cells.map(c => /[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : c).join(','));
  }
  mkdirSync(join(IN, 'summary'), { recursive: true });
  writeFileSync(join(IN, 'summary', 'rounds.csv'), lines.join('\n'));
  out.csvRows = lines.length - 1;
}

mkdirSync(join(IN, 'summary'), { recursive: true });
writeFileSync(join(IN, 'summary', 'summary.json'), JSON.stringify(out, null, 1));
writeFileSync(join(IN, 'summary', 'tables.md'), `# Lane A1 — tabelas geradas por scripts/alpha-economy-report.mjs\n\nPartidas base: ${runs.length}; variantes: ${variants.length}.\n${md.join('\n')}\n`);
console.log(`runs ${runs.length}, variants ${variants.length} -> ${join(IN, 'summary')}`);

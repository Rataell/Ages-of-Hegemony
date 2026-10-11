// Threat audit (Alpha V1.2, lane E). Needs the built packages (does not compile). Usage:
//   node scripts/alpha-threat-audit.mjs run --seed=1 --players=2 --preset=STANDARD [--control] [--out=docs/evidence/v12-audit/lane-e/runs]
//   node scripts/alpha-threat-audit.mjs summary [--dir=docs/evidence/v12-audit/lane-e/runs]
// `run` plays one bot match and, at the start of every Planning round (the state PRODUCE sees), measures threat-driven loss: yield of every city
// with the real threats vs the same state with every Bando set back to CAMPED (hexBlockedByThreat only blocks MARCHING threats).
// --control clears all threats at every round start (no-threat baseline). `summary` aggregates the run files into Markdown tables.
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { playMatch } from './lib/alpha-bots.mjs';
import * as E from '../packages/game-engine/dist/index.js';

const mode = process.argv[2];
const arg = (n, f) => (process.argv.find(a => a.startsWith(`--${n}=`)) ?? `--${n}=${f}`).split('=')[1];
const flag = n => process.argv.includes(`--${n}`);
const dir = arg('out', arg('dir', 'docs/evidence/v12-audit/lane-e/runs'));
const KEYS = ['food', 'wood', 'stone', 'metal', 'wealth', 'knowledge', 'influence'];
const eraOf = (round, per) => Math.floor((round - 1) / per) + 1;

if (mode === 'run') {
  const seed = Number(arg('seed', 1)), players = Number(arg('players', 2)), preset = arg('preset', 'STANDARD'), control = flag('control');
  // --fix=retreat emulates the proposed minimal fix F-T1 without touching the engine: a Bando that assaulted goes back to its Acampamento (CAMPED at homeHexId) and only relaunches at the next Era turn.
  const fix = arg('fix', '');
  let battleCursor = 0;
  const per = { QUICK: 3, STANDARD: 5, EPIC: 7 }[preset], limit = per * 7;
  const rounds = [];
  let eventCursor = 0;
  const scenario = (box, hook) => {
    if (hook !== 'round-start') return;
    const st = box.state, round = st.core.round;
    if (control) { st.threats = []; }
    if (fix === 'retreat') { for (const b of st.battles.slice(battleCursor)) { if (b.attackerId !== 'world') continue; const t = st.threats.find(x => x.id === b.attackerUnits[0]?.split(':')[0]); if (t && t.status === 'MARCHING') { t.status = 'CAMPED'; t.hexId = t.homeHexId; t.fresh = false; } } battleCursor = st.battles.length; }
    const newEvents = st.events.slice(eventCursor).filter(e => /^THREAT/.test(e.type)); eventCursor = st.events.length;
    const evCount = {}; for (const e of newEvents) evCount[e.type] = (evCount[e.type] ?? 0) + 1;
    const marching = st.threats.filter(t => t.status === 'MARCHING');
    // counterfactual yield: Bandos back to CAMPED
    const loss = Object.fromEntries(KEYS.map(k => [k, 0])), real = Object.fromEntries(KEYS.map(k => [k, 0])); let blockedHexes = 0, citiesHit = 0;
    for (const o of st.core.players) for (const c of o.civilization.cities) {
      const a = E.cityYield(st, c.id);
      const saved = marching.map(t => t.status); marching.forEach(t => { t.status = 'CAMPED'; });
      const b = E.cityYield(st, c.id);
      marching.forEach((t, i) => { t.status = saved[i]; });
      let hit = false;
      for (const k of KEYS) { const ra = k === 'metal' ? a.metal : (a.output[k] ?? 0), rb = k === 'metal' ? b.metal : (b.output[k] ?? 0); real[k] += ra; loss[k] += rb - ra; if (rb - ra !== 0) hit = true; }
      blockedHexes += b.hexes.length - a.hexes.length; if (hit || b.hexes.length !== a.hexes.length) citiesHit++;
    }
    const hexSet = new Set(marching.map(t => t.hexId));
    const routesCrossing = st.routes.filter(r => r.path.some(h => hexSet.has(h) || st.threats.some(t => t.hexId === h))).length;
    rounds.push({
      round, era: eraOf(round, per), events: evCount,
      threats: st.threats.map(t => ({ id: t.id, kind: t.kind, status: t.status, level: t.level, fresh: t.fresh, age: round - t.createdRound, comp: t.composition.reduce((n, c) => n + c.count, 0), hex: t.hexId })),
      alive: { camp: st.threats.filter(t => t.kind === 'CAMP').length, pirate: st.threats.filter(t => t.kind === 'PIRATE').length, marching: marching.length },
      loss, real, blockedHexes, citiesHit, routes: st.routes.length, routesSuspended: st.routes.filter(r => r.suspended).length, routesCrossingThreat: routesCrossing,
      cities: st.core.players.map(o => o.civilization.cities.length), moodMin: Math.min(99, ...st.cities.map(c => c.mood)),
      moods: st.cities.reduce((m, c) => { const b = E.moodBand(c.mood); m[b] = (m[b] ?? 0) + 1; return m; }, {}), guards: st.units.filter(u => u.kind === 'GUARD').length, fighters: st.units.filter(u => u.kind !== 'PIONEER' && u.kind !== 'ENVOY' && u.kind !== 'EXPLORER').length,
    });
  };
  const t0 = Date.now();
  const { state, ctx } = playMatch({ seed, players, rounds: limit, preset, startingPioneers: 2, scenario });
  // post-run (after final scenario call there is no end-of-match snapshot; take the last events too)
  const finalEvents = state.events.slice(eventCursor).filter(e => /^THREAT/.test(e.type)); const tailEv = {}; for (const e of finalEvents) tailEv[e.type] = (tailEv[e.type] ?? 0) + 1;
  const worldBattles = state.battles.filter(b => b.attackerId === 'world').map(b => {
    const tid = b.attackerUnits[0]?.split(':')[0] ?? '?';
    const cityHere = state.core.players.flatMap(o => o.civilization.cities).find(c => c.hexId === b.hexId);
    return { round: b.round, era: eraOf(b.round, per), threat: tid, hex: b.hexId, defender: b.defenderId, onCity: !!cityHere, outcome: b.outcome, delta: b.delta, winner: b.winnerId, atk: b.attackTotal, def: b.defenseTotal, defUnits: b.defenderUnits.length, atkUnits: b.attackerUnits.length, losses: b.losses.length };
  });
  const reports = state.roundReports.map(r => ({ seat: r.playerId, round: r.round, era: eraOf(r.round, per), prod: Object.fromEntries(KEYS.map(k => [k, (r.production?.[k] ?? 0) + (r.mining?.[k] ?? 0)])), losses: r.losses, closing: r.closing, cities: r.cities.length, pop: r.cities.reduce((n, c) => n + c.populationAfter, 0) }));
  const evAll = {}; for (const e of state.events) if (/THREAT|FOOD_SHORTAGE|UPKEEP_SHORTAGE/.test(e.type)) { const k = `${eraOf(e.round, per)}|${e.type}`; evAll[k] = (evAll[k] ?? 0) + 1; }
  const pillageMsgs = state.events.filter(e => e.type === 'THREAT_PILLAGE').map(e => ({ round: e.round, msg: e.message }));
  const spawnEvents = state.events.filter(e => /^THREAT_(SPAWNED|REINFORCED|NONE|MARCHING|DESTROYED|GREW|S_GREW)/.test(e.type)).map(e => ({ round: e.round, era: eraOf(e.round, per), type: e.type }));
  const out = { seed, players, preset, control, fix, limit, per, wallMs: Date.now() - t0, finalRound: state.core.round, status: state.core.status, crashes: ctx.crashes.length,
    telemetry: { spawned: state.telemetry.threatsSpawned, attacks: state.telemetry.threatAttacks, kills: state.telemetry.threatKills, losses: state.telemetry.threatLosses },
    rounds, worldBattles, reports, evAll, tailEv, pillageMsgs, spawnEvents, finalThreats: state.threats.map(t => ({ id: t.id, kind: t.kind, status: t.status, level: t.level, hex: t.hexId, createdRound: t.createdRound })),
    winner: state.winner ?? null, prestige: state.players.map(p => ({ id: p.playerId, prestige: p.prestige })) };
  mkdirSync(dir, { recursive: true });
  const file = `${dir}/${control ? 'ctl' : fix ? `fix-${fix}` : 'thr'}-${preset}-${players}p-s${seed}.json`;
  writeFileSync(file, JSON.stringify(out));
  console.log(`${file} ${out.wallMs}ms round ${out.finalRound} spawned ${out.telemetry.spawned} attacks ${out.telemetry.attacks} kills ${out.telemetry.kills}`);
} else if (mode === 'summary') {
  const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort();
  const runs = files.map(f => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')));
  const sum = (a, f) => a.reduce((n, x) => n + f(x), 0);
  const avg = (a, f) => a.length ? sum(a, f) / a.length : 0;
  const fx = (n, d = 1) => Number(n).toFixed(d);
  const L = [];
  const fixRuns = runs.filter(r => r.fix), thr = runs.filter(r => !r.control && !r.fix), ctl = runs.filter(r => r.control);
  const cfgs = [...new Set(thr.map(r => `${r.preset}|${r.players}`))].sort();
  L.push('## A. Ameacas por configuracao (media das sementes; run com ameacas)\n');
  L.push('| preset | jogadores | sementes | spawned (telemetria) | marchas | assaltos | ameacas distintas que assaltaram | assaltos por ameaca | destruidas pelo jogador | ameacas vivas no fim |');
  L.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const c of cfgs) {
    const rs = thr.filter(r => `${r.preset}|${r.players}` === c);
    const march = avg(rs, r => sum(r.spawnEvents.filter(e => e.type === 'THREAT_MARCHING'), () => 1));
    const distinct = avg(rs, r => new Set(r.worldBattles.map(b => b.threat)).size);
    L.push(`| ${c.split('|')[0]} | ${c.split('|')[1]} | ${rs.length} | ${fx(avg(rs, r => r.telemetry.spawned))} | ${fx(march)} | ${fx(avg(rs, r => r.telemetry.attacks))} | ${fx(distinct)} | ${fx(avg(rs, r => r.telemetry.attacks) / Math.max(0.01, distinct))} | ${fx(avg(rs, r => r.telemetry.kills))} | ${fx(avg(rs, r => r.finalThreats.length))} |`);
  }
  L.push('\n## B. Por Era (STANDARD 35 rodadas; media de todas as runs de 2/4/6 jogadores)\n');
  for (const preset of ['QUICK', 'STANDARD', 'EPIC']) for (const players of [2, 4, 6]) {
    const rs = thr.filter(r => r.preset === preset && r.players === players); if (!rs.length) continue;
    L.push(`\n### ${preset} ${players}p (n=${rs.length})\n`);
    L.push('| Era | spawn/reforco ev | crescimentos | marchas | assaltos | assaltos em cidade | vitorias do mundo | derrotas do mundo | atk medio | def medio | hexes bloqueados/rodada | cidades atingidas/rodada | perda Alimento/rodada | perda Riqueza+Mat/rodada | rotas suspensas/rodada | rotas cruzando ameaca/rodada | ameacas vivas (camp/pirata/marchando) |');
    L.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (let era = 1; era <= 7; era++) {
      const rr = rs.map(r => r.rounds.filter(x => x.era === era)); const nr = sum(rr, a => a.length) || 1;
      const bb = rs.flatMap(r => r.worldBattles.filter(b => b.era === era));
      const ev = t => sum(rs, r => r.spawnEvents.filter(e => e.era === era && e.type === t).length) / rs.length;
      const grew = sum(rs, r => r.evAll[`${era}|THREATS_GREW`] ?? 0) / rs.length;
      L.push(`| ${era} | ${fx(ev('THREAT_SPAWNED') + ev('THREAT_REINFORCED'))} | ${fx(grew)} | ${fx(ev('THREAT_MARCHING'))} | ${fx(bb.length / rs.length)} | ${fx(bb.filter(b => b.onCity).length / rs.length)} | ${fx(bb.filter(b => b.winner === 'world').length / rs.length)} | ${fx(bb.filter(b => b.winner !== 'world').length / rs.length)} | ${fx(avg(bb, b => b.atk))} | ${fx(avg(bb, b => b.def))} | ${fx(sum(rr, a => sum(a, x => x.blockedHexes)) / nr, 2)} | ${fx(sum(rr, a => sum(a, x => x.citiesHit)) / nr, 2)} | ${fx(sum(rr, a => sum(a, x => x.loss.food)) / nr, 2)} | ${fx(sum(rr, a => sum(a, x => x.loss.wealth + x.loss.wood + x.loss.stone + x.loss.metal)) / nr, 2)} | ${fx(sum(rr, a => sum(a, x => x.routesSuspended)) / nr, 2)} | ${fx(sum(rr, a => sum(a, x => x.routesCrossingThreat)) / nr, 2)} | ${fx(sum(rr, a => sum(a, x => x.alive.camp)) / nr)}/${fx(sum(rr, a => sum(a, x => x.alive.pirate)) / nr)}/${fx(sum(rr, a => sum(a, x => x.alive.marching)) / nr)} |`);
    }
  }
  L.push('\n## C. Controle (sem ameacas) vs com ameacas: producao de Alimento acumulada ate o fim de cada Era I-II, populacao e cidades na rodada do fim da Era II\n');
  L.push('| preset | jogadores | sementes pareadas | Alimento prod Eras I-II (com) | (sem) | pop fim Era II (com) | (sem) | cidades fim Era II (com) | (sem) | FOOD_SHORTAGE Era I-II (com) | (sem) | prestigio final medio (com) | (sem) |');
  L.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const c of cfgs) {
    const [preset, pl] = c.split('|'); const players = Number(pl);
    const pairs = thr.filter(r => r.preset === preset && r.players === players).map(r => ({ a: r, b: ctl.find(x => x.preset === preset && x.players === players && x.seed === r.seed) })).filter(p => p.b);
    if (!pairs.length) continue;
    const per = pairs[0].a.per;
    const foodE12 = r => sum(r.reports.filter(x => x.round <= 2 * per), x => x.prod.food) / r.players;
    const popE2 = r => sum(r.reports.filter(x => x.round === 2 * per), x => x.pop) / r.players;
    const citE2 = r => sum(r.reports.filter(x => x.round === 2 * per), x => x.cities) / r.players;
    const sh = r => sum(Object.entries(r.evAll).filter(([k]) => /^[12]\|FOOD_SHORTAGE/.test(k)), ([, v]) => v);
    const pr = r => avg(r.prestige, p => p.prestige);
    L.push(`| ${preset} | ${players} | ${pairs.length} | ${fx(avg(pairs, p => foodE12(p.a)))} | ${fx(avg(pairs, p => foodE12(p.b)))} | ${fx(avg(pairs, p => popE2(p.a)))} | ${fx(avg(pairs, p => popE2(p.b)))} | ${fx(avg(pairs, p => citE2(p.a)))} | ${fx(avg(pairs, p => citE2(p.b)))} | ${fx(avg(pairs, p => sh(p.a)))} | ${fx(avg(pairs, p => sh(p.b)))} | ${fx(avg(pairs, p => pr(p.a)))} | ${fx(avg(pairs, p => pr(p.b)))} |`);
  }
  L.push('\n## D. Perda direta de producao por ameaca (soma na partida, por jogador)\n');
  L.push('| preset | jogadores | Alimento perdido/jogador (partida) | Alimento perdido Eras I-II | % da producao de Alimento Eras I-II | Riqueza+Mat perdida/jogador | primeira rodada com hex bloqueado (media) | rodadas com >=1 hex bloqueado (%) |');
  L.push('|---|---|---|---|---|---|---|---|');
  for (const c of cfgs) {
    const [preset, pl] = c.split('|'); const players = Number(pl); const rs = thr.filter(r => r.preset === preset && r.players === players); const per = rs[0].per;
    const foodLoss = r => sum(r.rounds, x => x.loss.food) / r.players, foodLoss12 = r => sum(r.rounds.filter(x => x.round <= 2 * per), x => x.loss.food) / r.players;
    const prod12 = r => sum(r.reports.filter(x => x.round <= 2 * per), x => x.prod.food) / r.players;
    const first = r => (r.rounds.find(x => x.blockedHexes > 0)?.round ?? 0);
    L.push(`| ${preset} | ${players} | ${fx(avg(rs, foodLoss))} | ${fx(avg(rs, foodLoss12))} | ${fx(100 * avg(rs, foodLoss12) / Math.max(1, avg(rs, prod12)))}% | ${fx(avg(rs, r => sum(r.rounds, x => x.loss.wealth + x.loss.wood + x.loss.stone + x.loss.metal) / r.players))} | ${fx(avg(rs, first))} | ${fx(100 * avg(rs, r => r.rounds.filter(x => x.blockedHexes > 0).length / r.rounds.length))}% |`);
  }
  L.push('\n## E. Resultado dos assaltos (todas as runs com ameacas)\n');
  const all = thr.flatMap(r => r.worldBattles.map(b => ({ ...b, preset: r.preset, players: r.players, seed: r.seed })));
  const bo = {}; for (const b of all) { const k = `${b.winner === 'world' ? 'mundo vence' : 'defesa vence'}/${b.outcome}`; bo[k] = (bo[k] ?? 0) + 1; }
  L.push('| resultado | n |\n|---|---|'); for (const [k, v] of Object.entries(bo).sort()) L.push(`| ${k} | ${v} |`);
  const byThreat = {}; for (const b of all) { const k = `${b.preset}-${b.players}p-s${b.seed}-${b.threat}`; (byThreat[k] ??= []).push(b); }
  const hist = {}; for (const v of Object.values(byThreat)) { const k = v.length >= 10 ? '10+' : String(v.length); hist[k] = (hist[k] ?? 0) + 1; }
  L.push('\nAssaltos por ameaca distinta (histograma: quantos assaltos uma mesma ameaca fez):\n');
  L.push('| assaltos | ameacas |\n|---|---|'); for (const k of Object.keys(hist).sort((a, b) => parseInt(a) - parseInt(b))) L.push(`| ${k} | ${hist[k]} |`);
  const same = Object.values(byThreat).map(v => ({ n: v.length, hexes: new Set(v.map(x => x.hex)).size, span: Math.max(...v.map(x => x.round)) - Math.min(...v.map(x => x.round)) + 1 }));
  L.push(`\nAmeacas que assaltaram: ${same.length}; media de assaltos por ameaca: ${fx(avg(same, s => s.n))}; ameacas que assaltaram sempre o mesmo hex: ${same.filter(s => s.hexes === 1).length}; mediana de duracao (rodadas): ${same.map(s => s.span).sort((a, b) => a - b)[Math.floor(same.length / 2)]}.`);
  L.push(`\nAssaltos em hex de cidade: ${all.filter(b => b.onCity).length}/${all.length}; em hex que nao e cidade (peca isolada): ${all.filter(b => !b.onCity).length}.`);
  L.push('\n## F. Animo das cidades: fracao de cidades em Revolta / Abalada por Era (media das rodadas), com ameacas vs controle\n');
  L.push('| preset | jogadores | Era | Revolta (com) | Revolta (sem) | Abalada (com) | Abalada (sem) | Estavel+Prospera (com) | (sem) |');
  L.push('|---|---|---|---|---|---|---|---|---|');
  for (const c of cfgs) {
    const [preset, pl] = c.split('|'); const players = Number(pl);
    const A = thr.filter(r => r.preset === preset && r.players === players), B = ctl.filter(r => r.preset === preset && r.players === players);
    const eras = preset === 'QUICK' ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5, 6, 7];
    const frac = (rs, era, band) => { let n = 0, d = 0; for (const r of rs) for (const x of r.rounds.filter(y => y.era === era)) { n += x.moods[band] ?? 0; d += Object.values(x.moods).reduce((a, b) => a + b, 0); } return d ? 100 * n / d : 0; };
    for (const era of eras) L.push(`| ${preset} | ${players} | ${era} | ${fx(frac(A, era, 'REVOLT'))}% | ${fx(frac(B, era, 'REVOLT'))}% | ${fx(frac(A, era, 'SHAKEN'))}% | ${fx(frac(B, era, 'SHAKEN'))}% | ${fx(frac(A, era, 'STABLE') + frac(A, era, 'PROSPEROUS'))}% | ${fx(frac(B, era, 'STABLE') + frac(B, era, 'PROSPEROUS'))}% |`);
  }
  if (fixRuns.length) {
    L.push('\n## G. Fix minimo F-T1 (Bando volta ao Acampamento depois de assaltar; emulado no harness): com ameacas atual x com fix x sem ameacas\n');
    L.push('| preset | jogadores | n | assaltos (atual / fix / sem) | % cidades em Revolta, media da partida (atual / fix / sem) | Alimento produzido por jogador na partida (atual / fix / sem) | populacao final por jogador (atual / fix / sem) | prestigio final medio (atual / fix / sem) |');
    L.push('|---|---|---|---|---|---|---|---|');
    for (const c of [...new Set(fixRuns.map(r => `${r.preset}|${r.players}`))].sort()) {
      const [preset, pl] = c.split('|'); const players = Number(pl);
      const F = fixRuns.filter(r => r.preset === preset && r.players === players); const seeds = F.map(r => r.seed);
      const T = thr.filter(r => r.preset === preset && r.players === players && seeds.includes(r.seed)), C = ctl.filter(r => r.preset === preset && r.players === players && seeds.includes(r.seed));
      const revolt = rs => 100 * avg(rs, r => { let n = 0, d = 0; for (const x of r.rounds) { n += x.moods.REVOLT ?? 0; d += Object.values(x.moods).reduce((a, b) => a + b, 0); } return d ? n / d : 0; });
      const food = rs => avg(rs, r => sum(r.reports, x => x.prod.food) / r.players);
      const popf = rs => avg(rs, r => sum(r.reports.filter(x => x.round === r.limit), x => x.pop) / r.players);
      const pres = rs => avg(rs, r => avg(r.prestige, p => p.prestige));
      const trio = (f, d = 1) => `${fx(f(T), d)} / ${fx(f(F), d)} / ${fx(f(C), d)}`;
      L.push(`| ${preset} | ${players} | ${F.length} | ${trio(rs => avg(rs, r => r.telemetry.attacks))} | ${trio(revolt)}% | ${trio(food)} | ${trio(popf)} | ${trio(pres)} |`);
    }
  }
  writeFileSync(`${dir}/../summary.md`, L.join('\n') + '\n');
  console.log(L.join('\n'));
} else console.log('usage: run|summary');

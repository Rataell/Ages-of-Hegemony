// Aggregation of bot matches into the figures the V5.1b playtest brief asks for.
import { COVERAGE_FLAGS } from './alpha-bots.mjs';
const ORDER_TYPES = ['CITY', 'EXPEDITION', 'ADVANCE', 'INFLUENCE', 'LEGACY'];
const RES = ['food', 'wood', 'stone', 'metal', 'wealth', 'knowledge', 'influence', 'culture'];
const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const round2 = x => Math.round(x * 100) / 100;
const entropy = counts => { const total = counts.reduce((a, b) => a + b, 0); return total ? -counts.filter(c => c > 0).reduce((h, c) => h + (c / total) * Math.log2(c / total), 0) : 0; };

export function summarize({ state, ctx, coverage }, { players, seed }) {
  const log = state.telemetry.roundLog;
  const personaOf = Object.fromEntries(ctx.seats.map(s => [s.id, s.persona]));
  // 1. Orders: entropy of the type mix, repeats, share of player-rounds that spent all five on <= 2 types.
  const typeTotals = Object.fromEntries(ORDER_TYPES.map(t => [t, 0]));
  let repeated = 0, concentrated = 0, orderRounds = 0, ordersTotal = 0;
  for (const row of log) {
    const total = ORDER_TYPES.reduce((n, t) => n + (row.orders[t] ?? 0), 0);
    if (!total) continue;
    orderRounds++; ordersTotal += total; repeated += row.repeatedOrders;
    for (const t of ORDER_TYPES) typeTotals[t] += row.orders[t] ?? 0;
    if (ORDER_TYPES.filter(t => (row.orders[t] ?? 0) > 0).length <= 2) concentrated++;
  }
  // 2. Urban levels.
  const firstLevel = level => { const hit = log.filter(r => r.cityLevels.some(l => l >= level)).map(r => r.round); return hit.length ? Math.min(...hit) : null; };
  const levelDistribution = [1, 2, 3, 4, 5, 6, 7].map(l => log.filter(r => r.round === Math.max(...log.map(x => x.round))).reduce((n, r) => n + r.cityLevels.filter(x => x === l).length, 0));
  // 3. Cofres: share of player-rounds at cap, per resource.
  const capShare = Object.fromEntries(RES.map(k => [k, round2(mean(log.map(r => Number(r.atCap.includes(k)))))]));
  const emptyShare = Object.fromEntries(RES.map(k => [k, round2(mean(log.map(r => Number((r.stock[k] ?? 0) === 0))))]));
  const discardedPerRound = Object.fromEntries(['food', 'materials', 'wealth', 'knowledge', 'influence'].map(k => [k, round2(mean(log.map(r => r.discarded[k] ?? 0)))]));
  // 4. Ânimo vs Governar.
  const moods = log.flatMap(r => r.moods);
  const withGovern = log.filter(r => r.governed > 0), without = log.filter(r => r.governed === 0);
  const avgMood = rows => round2(mean(rows.map(r => mean(r.moods))));
  // 5. Graus: win rate of the side with the higher average grade in tactical battles between players.
  const decided = state.battles.filter(b => b.attackerId !== 'world' && b.defenderId !== 'world' && b.attackerTactical.length && b.defenderTactical.length);
  const gradeOf = rolls => mean(rolls.map(x => x.grade ?? 1));
  let higherWins = 0, higherCount = 0, equalCount = 0;
  for (const b of decided) { const d = gradeOf(b.attackerTactical) - gradeOf(b.defenderTactical); if (Math.abs(d) < 0.01) { equalCount++; continue; } higherCount++; const attackerWon = b.winnerId === b.attackerId && (b.delta ?? 1) > 0; if ((d > 0) === attackerWon) higherWins++; }
  // 6. Threats.
  const worldBattles = state.battles.filter(b => b.attackerId === 'world' || b.defenderId === 'world');
  const lossesOf = (battles, pred) => battles.reduce((n, b) => n + b.losses.length * Number(pred(b)), 0);
  const casualtyShareWorld = (() => { const all = state.battles.reduce((n, b) => n + b.losses.length, 0); return all ? round2(lossesOf(worldBattles, () => true) / all) : 0; })();
  const threatRounds = log.filter(r => r.playerId === log[0]?.playerId);
  const alive = threatRounds.map(r => r.threatsAlive.camp + r.threatsAlive.pirate);
  // 7. Time.
  const ms = ctx.timings.map(t => t.ms);
  const commandsPerPlayerRound = round2(ctx.counters.commands / Math.max(1, state.core.round) / players);
  const winner = state.winner;
  const finals = state.players.map(p => { const o = state.core.players.find(x => x.id === p.playerId); return { playerId: p.playerId, persona: personaOf[p.playerId], prestige: p.prestige, cities: o.civilization.cities.length, population: o.civilization.cities.reduce((n, c) => n + c.population, 0), research: p.research.length, victories: p.victories, government: o.civilization.government, hegemony: p.hegemony?.path ?? null }; });
  return {
    players, seed, rounds: state.core.round, status: state.core.status, winner: winner ?? null, finals,
    crashes: ctx.crashes, violations: ctx.violations.slice(0, 20), commands: ctx.counters.commands, rejected: ctx.counters.rejected, rejectedReasons: ctx.counters.rejectedReasons,
    orders: { totals: typeTotals, entropyBits: round2(entropy(Object.values(typeTotals))), maxEntropyBits: round2(Math.log2(5)), repeatedPerPlayerRound: round2(repeated / Math.max(1, orderRounds)), meanOrdersCommitted: round2(ordersTotal / Math.max(1, orderRounds)), shareOfRoundsWithTwoTypesOrFewer: round2(concentrated / Math.max(1, orderRounds)) },
    urban: { firstN4: firstLevel(4), firstN5: firstLevel(5), firstN6: firstLevel(6), firstN7: firstLevel(7), finalLevelDistribution: levelDistribution },
    cofres: { capShare, emptyShare, discardedPerRound },
    animo: { meanMood: round2(mean(moods)), shareAtZero: round2(moods.filter(m => m <= 0).length / Math.max(1, moods.length)), shareShakenOrWorse: round2(moods.filter(m => m <= 2).length / Math.max(1, moods.length)), governPerPlayerRound: round2(mean(log.map(r => r.governed))), meanMoodWhenGoverned: avgMood(withGovern), meanMoodWhenNot: avgMood(without), roundsGoverned: withGovern.length },
    graus: { battlesBetweenPlayers: decided.length, higherGradeWinRate: higherCount ? round2(higherWins / higherCount) : null, comparableBattles: higherCount, equalGradeBattles: equalCount },
    threats: { spawned: state.telemetry.threatsSpawned, attacks: state.telemetry.threatAttacks, killedWhileCamped: state.telemetry.threatKills, destroyed: state.telemetry.threatLosses, worldBattles: worldBattles.length, shareOfAllCasualtiesInWorldBattles: casualtyShareWorld, meanAlive: round2(mean(alive)), maxAlive: Math.max(0, ...alive) },
    combat: { battles: state.battles.length, outcomes: state.battles.reduce((m, b) => { const k = b.outcome ?? 'LEGACY'; m[k] = (m[k] ?? 0) + 1; return m; }, {}), citiesCaptured: state.telemetry.citiesCaptured, casualties: state.telemetry.casualties },
    resonance: { cycles: state.telemetry.resonanceCycles, byKind: state.telemetry.resonanceByKind, repercussionsPerCivilization: round2(state.telemetry.resonanceCycles / players) },
    research: { perCivilization: round2(mean(finals.map(f => f.research))), heritagesPerCivilization: round2(mean(state.players.map(p => p.research.filter(id => /^her-|heritage/.test(id) || id.includes('heritage')).length))) },
    time: { engineMsTotal: Math.round(ctx.totalMs), engineMsPerRoundMean: round2(mean(ms)), engineMsPerRoundMax: Math.round(Math.max(0, ...ms)), commandsPerPlayerRound },
    coverage: Object.fromEntries(COVERAGE_FLAGS.map(f => [f, coverage.has(f)])),
  };
}

export function markdownReport(runs, { playerCounts, seeds, personas, scenarios = [], grades = [] }) {
  const L = [];
  const avg = (sel, filter = () => true) => round2(mean(runs.filter(filter).map(sel).filter(x => x !== null && x !== undefined && !Number.isNaN(x))));
  L.push('# V5.1b — headless bot playtest', '', `Matches: players ${playerCounts.join('/')} × seeds ${seeds.join('/')} = ${runs.length} full runs of up to 35 rounds, played only through the real command surface. Personalities: ${personas.join(', ')}.`, '', '> Bots are proxies. They play competently enough to reach every system, not optimally. Read each figure as "what the rules do when played by a reasonable but naive player". Human decision time is **not** measured here.', '');
  L.push('## Runs', '', '| players | seed | rounds | status | winner | reason | crashes | violations | engine ms | commands/player-round |', '|---|---|---|---|---|---|---|---|---|---|');
  for (const r of runs) L.push(`| ${r.players} | ${r.seed} | ${r.rounds} | ${r.status} | ${r.winner?.playerId ?? '-'} | ${r.winner?.reason ?? '-'} | ${r.crashes.length} | ${r.violations.length} | ${r.time.engineMsTotal} | ${r.time.commandsPerPlayerRound} |`);
  L.push('', '## Do the 5 Orders create decisions or filler?', '', '| players | order mix (Cidade/Expedição/Avanço/Influência/Legado) | entropy (max 2.32 bits) | repeats / player-round | rounds using ≤ 2 types |', '|---|---|---|---|---|');
  for (const n of playerCounts) { const rs = runs.filter(r => r.players === n); const t = ORDER_TYPES.map(k => rs.reduce((s, r) => s + r.orders.totals[k], 0)); const total = t.reduce((a, b) => a + b, 0) || 1; L.push(`| ${n} | ${t.map(x => `${Math.round(100 * x / total)}%`).join(' / ')} | ${avg(r => r.orders.entropyBits, r => r.players === n)} | ${avg(r => r.orders.repeatedPerPlayerRound, r => r.players === n)} | ${Math.round(100 * avg(r => r.orders.shareOfRoundsWithTwoTypesOrFewer, r => r.players === n))}% |`); }
  L.push('', '## When do N6 / N7 appear?', '', '| players | first N4 (round) | first N5 | first N6 | first N7 | final levels N1..N7 (all civilizations) |', '|---|---|---|---|---|---|');
  for (const n of playerCounts) { const rs = runs.filter(r => r.players === n); const first = k => { const xs = rs.map(r => r.urban[k]).filter(Boolean); return xs.length ? `${Math.min(...xs)} (${xs.length}/${rs.length} runs)` : `never (0/${rs.length})`; }; const dist = [0, 1, 2, 3, 4, 5, 6].map(i => rs.reduce((s, r) => s + r.urban.finalLevelDistribution[i], 0)); L.push(`| ${n} | ${first('firstN4')} | ${first('firstN5')} | ${first('firstN6')} | ${first('firstN7')} | ${dist.join(' / ')} |`); }
  L.push('', '## Are the Cofres permanently full?', '', '| resource | share of player-rounds at cap | share empty | discarded/round (ledger pools) |', '|---|---|---|---|');
  for (const k of ['food', 'wood', 'stone', 'metal', 'wealth', 'knowledge', 'influence', 'culture']) L.push(`| ${k} | ${Math.round(100 * avg(r => r.cofres.capShare[k]))}% | ${Math.round(100 * avg(r => r.cofres.emptyShare[k]))}% | ${k in runs[0].cofres.discardedPerRound ? avg(r => r.cofres.discardedPerRound[k]) : '-'} |`);
  L.push('', '## Does Governar trivialize Ânimo?', '', `- Mean Ânimo (0–6): ${avg(r => r.animo.meanMood)}; share of cities at Revolta (0): ${Math.round(100 * avg(r => r.animo.shareAtZero))}%; at Abalada or worse (≤ 2): ${Math.round(100 * avg(r => r.animo.shareShakenOrWorse))}%.`, `- Governar per player-round: ${avg(r => r.animo.governPerPlayerRound)}. Mean Ânimo in rounds with Governar: ${avg(r => r.animo.meanMoodWhenGoverned)} vs without: ${avg(r => r.animo.meanMoodWhenNot)}.`);
  L.push('', '## Do military Graus matter?', '', `- Battles between players: ${runs.reduce((s, r) => s + r.graus.battlesBetweenPlayers, 0)}; with a grade difference: ${runs.reduce((s, r) => s + r.graus.comparableBattles, 0)}; win rate of the higher-Grau side: ${avg(r => r.graus.higherGradeWinRate)} (0.5 = Graus irrelevant).`);
  if (grades.length) {
    L.push('', `Natural play produced no battle between players in this sample (contact and distance), so the question is answered by a micro-benchmark: ${grades[0].trials} seeded shocks per row, 3 pieces a side on open ground, attacker in Assalto against a defender in Manter, higher Grau on the attacking side.`, '', '| family | Grau I vs I: attacker wins / tie | Grau II vs I | Grau III vs I | Grau III defending vs attacker I |', '|---|---|---|---|---|');
    const pct = x => `${Math.round(x * 100)}%`, cell = c => `${pct(c.attackerWins)} / ${pct(c.tie)}`;
    for (const g of grades) L.push(`| ${g.family} | ${cell(g.gradeI)} | ${cell(g.gradeII)} | ${cell(g.gradeIII)} | defender holds ${pct(g.gradeIIIDefending.defenderWins)} (vs ${pct(g.gradeI.defenderWins)} at Grau I) |`);
  }
  L.push('', '## Do Bandos threaten without dominating?', '', '| players | spawned | attacks | camps killed while camped | destroyed (any way) | world battles | share of all casualties in world battles | mean threats alive | max |', '|---|---|---|---|---|---|---|---|---|');
  for (const n of playerCounts) { const rs = runs.filter(r => r.players === n); const s = f => round2(mean(rs.map(f))); L.push(`| ${n} | ${s(r => r.threats.spawned)} | ${s(r => r.threats.attacks)} | ${s(r => r.threats.killedWhileCamped)} | ${s(r => r.threats.destroyed)} | ${s(r => r.threats.worldBattles)} | ${s(r => r.threats.shareOfAllCasualtiesInWorldBattles)} | ${s(r => r.threats.meanAlive)} | ${Math.max(...rs.map(r => r.threats.maxAlive))} |`); }
  L.push('', '## Ressonância', '', '| players | Repercussões / civilization | composition mix |', '|---|---|---|');
  for (const n of playerCounts) { const rs = runs.filter(r => r.players === n); const kinds = {}; for (const r of rs) for (const [k, v] of Object.entries(r.resonance.byKind)) kinds[k] = (kinds[k] ?? 0) + v; L.push(`| ${n} | ${avg(r => r.resonance.repercussionsPerCivilization, r => r.players === n)} | ${JSON.stringify(kinds)} |`); }
  L.push('', '## Duration', '', `- Engine time per round (mean): ${avg(r => r.time.engineMsPerRoundMean)} ms; slowest round ${Math.max(...runs.map(r => r.time.engineMsPerRoundMax))} ms; whole 35-round match ${avg(r => r.time.engineMsTotal)} ms on average.`, `- Decisions per player-round (commands sent): ${avg(r => r.time.commandsPerPlayerRound)}. At roughly 8–15 s per decision plus reading time, a human round is about ${Math.round(avg(r => r.time.commandsPerPlayerRound) * 12 / 60 * 10) / 10}–${Math.round(avg(r => r.time.commandsPerPlayerRound) * 12 / 60 * 10 * 2) / 10} min of planning → 35 rounds ≈ ${Math.round(35 * avg(r => r.time.commandsPerPlayerRound) * 12 / 60)}–${Math.round(35 * avg(r => r.time.commandsPerPlayerRound) * 24 / 60)} min of pure planning (estimate; needs a human table to confirm).`);
  L.push('', '## Coverage of the edge cases', '', '| flag | ' + [...new Set(playerCounts)].map(n => `${n}p`).join(' | ') + ' |', '|---|' + playerCounts.map(() => '---|').join(''));
  for (const f of COVERAGE_FLAGS) L.push(`| ${f} | ${playerCounts.map(n => { const rs = runs.filter(r => r.players === n); return `${rs.filter(r => r.coverage[f]).length}/${rs.length}`; }).join(' | ')} |`);
  if (scenarios.length) {
    L.push('', '## Edge cases reached by injected scenarios', '', 'Each scenario injects a documented starting condition (never a result) and lets the bots play the command surface from there.', '', '| scenario | targets | reached | rounds | crashes | violations | note |', '|---|---|---|---|---|---|---|');
    for (const sc of scenarios) L.push(`| ${sc.name} | ${sc.flags.join(', ')} | ${sc.flags.map(f => `${f}:${sc.reached[f] ? 'yes' : 'NO'}`).join(' ')} | ${sc.rounds} ${sc.status} | ${sc.crashes.length} | ${sc.violations.length} | ${sc.note} |`);
    const natural = new Set(COVERAGE_FLAGS.filter(f => runs.some(r => r.coverage[f]))), injected = new Set(scenarios.flatMap(sc => sc.flags.filter(f => sc.reached[f])));
    L.push('', '| flag | natural play | injected scenario |', '|---|---|---|');
    for (const f of COVERAGE_FLAGS) L.push(`| ${f} | ${natural.has(f) ? 'yes' : 'no'} | ${injected.has(f) ? 'yes' : 'no'} |`);
    const missing = COVERAGE_FLAGS.filter(f => !natural.has(f) && !injected.has(f));
    L.push('', missing.length ? `Not reached by either: ${missing.join(', ')}.` : 'Every edge case was reached at least once.');
  }
  const crashes = runs.flatMap(r => r.crashes), violations = runs.flatMap(r => r.violations);
  L.push('', '## Defects', '', crashes.length ? crashes.slice(0, 5).map(c => `- crash r${c.round} ${c.phase}: ${c.message.split('\n')[0]}`).join('\n') : '- No crashes or softlocks.', violations.length ? violations.slice(0, 10).map(v => `- invariant r${v.round}: ${v.msg}`).join('\n') : '- No invariant violations (storage, negatives, population ≥ 1).');
  const rej = {}; for (const r of runs) for (const [k, v] of Object.entries(r.rejectedReasons)) rej[k] = (rej[k] ?? 0) + v;
  L.push('', 'Most frequent rejected commands (bots probe the options, so rejections are expected): ' + Object.entries(rej).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ×${v}`).join(', '));
  return L.join('\n') + '\n';
}

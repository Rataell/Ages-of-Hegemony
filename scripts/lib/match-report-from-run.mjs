// Converts a recorded simulation run (docs/evidence/v12-audit/**/<policy>-<profile>-p<N>-s<seed>.json, written by scripts/alpha-economy-policies.mjs) into a MatchReportV1.
// Nothing is re-simulated. The run rows have eight-resource flows the live engine does not record, but they lack research ids, building types, battles per seat and the
// like: those fields are left empty AND listed as UNAVAILABLE in `quality`, so the Meta aggregator skips them instead of counting zeros.
import { MATCH_REPORT_SCHEMA_VERSION, MatchReportV1Schema } from '../../packages/game-domain/dist/index.js';
import { shortHash } from '../../packages/game-engine/dist/index.js';

const RES = ['food', 'wood', 'stone', 'metal', 'wealth', 'knowledge', 'influence', 'culture'];
const ERA_COUNT = 7;
const stable = value => Array.isArray(value) ? `[${value.map(stable).join(',')}]` : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}` : JSON.stringify(value) ?? 'null';
const sum8 = (target, pool, by = 1) => { for (const key of RES) target[key] = (target[key] ?? 0) + (pool?.[key] ?? 0) * by; };
const mean = xs => xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length * 100) / 100 : 0;
const fold5 = pool => ({ food: pool.food ?? 0, materials: (pool.wood ?? 0) + (pool.stone ?? 0) + (pool.metal ?? 0), wealth: pool.wealth ?? 0, knowledge: pool.knowledge ?? 0, influence: pool.influence ?? 0 });

/** `tag` names what the harness did that the run file does not record (e.g. 'emergency' for AOH_POLICY_EMERGENCY=1): it joins the economy fingerprint so runs of different setups are never pooled. */
export function reportFromRun(run, { tag = '', engine = 'sim' } = {}) {
  const meta = run.meta, seats = [...new Set(run.rows.map(row => row.seat))].sort();
  const quality = [];
  const note = (field, status, text) => quality.push({ field, status, note: text });
  const rowsOf = seat => run.rows.filter(row => row.seat === seat).sort((a, b) => a.round - b.round);
  const rounds = [...new Set(run.rows.map(row => row.round))].sort((a, b) => a - b);
  const winner = meta.winner ?? null;
  if (!winner) throw new Error('run without a winner (unfinished match)');
  const endgame = new Map(run.endgame.map(entry => [entry.seat, entry]));
  const civs = meta.civs ?? [];
  const fingerprint = shortHash(stable({ run: true, variant: meta.variant, mode: meta.mode, preset: meta.preset, tag }));
  const configKey = shortHash(stable({ seed: meta.seed, players: meta.players, civs, policy: meta.policy, variant: meta.variant, mode: meta.mode, profile: meta.profile, tag }));

  const metricsOf = seat => { const last = rowsOf(seat).at(-1), end = endgame.get(seat); return [end?.prestige ?? last?.prestige ?? 0, last?.research ?? 0, last?.pop ?? 0, last?.openStock?.wealth ?? 0]; };
  const order = [...seats].sort((a, b) => { const x = metricsOf(a), y = metricsOf(b); for (let i = 0; i < 4; i++) if (x[i] !== y[i]) return y[i] - x[i]; return a.localeCompare(b); });
  const CRITERIA = ['prestige', 'research', 'population', 'wealth'];
  const ranking = order.map((seat, index) => {
    const [prestige, researched, population, wealth] = metricsOf(seat);
    let decidedBy = null;
    if (index > 0) { const above = metricsOf(order[index - 1]), own = metricsOf(seat), at = above.findIndex((v, i) => v !== own[i]); decidedBy = at === -1 ? 'initiative' : CRITERIA[at]; }
    return { seat, rank: index + 1, prestige, researched, population, wealth, decidedBy };
  });
  note('result.ranking', 'PARTIAL', 'Tie-breaks use the recorded research count, population and the OPENING wealth of the last round; the live initiative order is not in a run file.');

  const civilizations = seats.map(seat => {
    const rows = rowsOf(seat), last = rows.at(-1), first = rows[0], end = endgame.get(seat);
    const levelsLast = last?.levels ?? [];
    const byLevel = [1, 2, 3, 4, 5, 6, 7].map(level => levelsLast.filter(value => value === level).length);
    return {
      seat, government: last?.government ?? null, reformEra: null, leaderAbilityUses: 0,
      cities: {
        atStart: first?.cities ?? 0, founded: Math.max(0, (last?.cities ?? 0) - (first?.cities ?? 0)), captured: 0, lost: 0, final: last?.cities ?? 0, occupiedAtEnd: 0, elevations: null,
        maxLevel: Math.max(0, ...levelsLast), meanLevel: mean(levelsLast), byLevel,
        firstRoundAtLevel: [1, 2, 3, 4, 5, 6, 7].map(level => rows.find(row => (row.levels ?? []).some(value => value >= level))?.round ?? null),
      },
      population: { firstRound: first?.pop ?? null, final: last?.pop ?? 0, series: rows.map(row => row.pop) },
      districts: {}, buildings: {}, territory: last?.territory ?? 0, regionsDiscovered: end?.prestigeBy?.explored ?? 0,
      research: { total: last?.research ?? 0, byDomain: {}, order: [], heritages: 0, milestonesReached: [] },
      resonance: { cycles: 0, repercussions: null },
      legacyWorks: (run.obra?.works ?? []).filter(work => work.ownerId === seat).map(work => ({ workId: work.workId, cityId: work.cityId, startedRound: work.startedRound, completedRound: work.completedRound, stepsDone: work.stepsDone })),
    };
  });
  for (const field of ['civilizations.districts', 'civilizations.buildings', 'civilizations.research.order', 'civilizations.research.byDomain', 'civilizations.cities.elevations', 'civilizations.cities.captured', 'civilizations.leaderAbilityUses', 'civilizations.resonance'])
    note(field, 'UNAVAILABLE', 'A run file records counts per round, not ids/types/captures/uses.');
  note('civilizations.cities.founded', 'CALCULATED', 'Final cities minus cities in the first recorded round.');
  if (!run.obra) note('civilizations.legacyWorks', 'UNAVAILABLE', 'This run did not record Obras de Legado (only the Obra scenario does).');

  const perSeat = seats.map(seat => {
    const rows = rowsOf(seat), stock = Object.fromEntries(RES.map(r => [r, rows.map(row => row.openStock?.[r] ?? 0)]));
    const atCapRounds = {}, emptyRounds = {};
    for (const r of RES) { atCapRounds[r] = rows.filter(row => (row.caps?.[r] ?? Infinity) <= (row.openStock?.[r] ?? 0)).length; emptyRounds[r] = stock[r].filter(v => v === 0).length; }
    const produced = {}, consumed = {}, discarded = {}, spent = {};
    for (const row of rows) {
      sum8(produced, row.produced); sum8(produced, row.roundStartGain); sum8(consumed, row.sustenance); sum8(consumed, row.growth); sum8(consumed, row.military); sum8(discarded, row.discard);
      for (const group of Object.values(row.spend ?? {})) sum8(spent, group);
    }
    const lost = {};
    for (const row of rows) sum8(lost, row.losses);
    return {
      seat, stock, atCapRounds, emptyRounds,
      ledger: { produced: fold5(produced), spent: fold5(spent), lost: fold5(lost), discarded: fold5(discarded) },
      flows8: { produced, consumed, discarded, spent },
      shortage: { foodRounds: rows.filter(row => row.famine > 0).length, upkeepRounds: rows.filter(row => row.upkeepShortage > 0).length, overextensionRounds: rows.filter(row => (row.overextension ?? 0) > 0).length },
      mood: { mean: rows.map(row => mean(row.mood ?? [])), min: rows.map(row => (row.mood?.length ? Math.min(...row.mood) : 0)), revoltRounds: rows.filter(row => (row.mood ?? []).some(v => v <= 1)).length },
      populationSeries: rows.map(row => row.pop), cityCountSeries: rows.map(row => row.cities), maxLevelSeries: rows.map(row => Math.max(0, ...(row.levels ?? []))), prestigeSeries: rows.map(row => row.prestige),
    };
  });
  note('economy.stock', 'PARTIAL', 'A run records the OPENING stock of each round (after the previous round\'s resolution), not the closing stock.');
  note('economy.flows8', 'OBSERVED', 'Eight-resource flows from the instrumented harness (production, sustenance/growth/military, discards, spending by action).');
  note('economy.ledger', 'CALCULATED', 'The five-pool view folded from the eight-resource flows (materials = wood + stone + metal; Cultura is dropped).');

  const actions = seats.map(seat => {
    const rows = rowsOf(seat), byCategory = {}, executed = {};
    for (const row of rows) { for (const [k, n] of Object.entries(row.ordersByType ?? {})) byCategory[k] = (byCategory[k] ?? 0) + n; for (const [k, n] of Object.entries(row.kinds ?? {})) executed[k] = (executed[k] ?? 0) + n; }
    const committed = rows.reduce((n, row) => n + (row.ordersUsed ?? 0), 0), available = rows.reduce((n, row) => n + (row.ordersLimit ?? 0), 0);
    return { seat, ordersByCategory: byCategory, ordersCommitted: committed, ordersAvailable: available, ordersUnused: Math.max(0, available - committed), failedActions: rows.reduce((n, row) => n + (row.actionFailed ?? 0), 0), executed };
  });
  const t = run.threats ?? { assaults: 0, playerAttacksOnThreats: 0, telemetry: {}, events: {} };
  const conflicts = {
    battles: { pvp: 0, againstThreats: t.playerAttacksOnThreats ?? 0, byThreats: t.assaults ?? 0 },
    perSeat: seats.map(seat => ({ seat, attacks: 0, attackWins: 0, attackLosses: 0, defences: 0, defenceWins: 0, unitsLost: 0, unitsDestroyed: 0, assaultsSuffered: 0, threatAttacks: 0 })),
    warsDeclared: 0, warsActiveAtEnd: [],
    threats: { spawned: t.telemetry?.spawned ?? 0, attacks: t.telemetry?.attacks ?? 0, campsDestroyed: t.telemetry?.kills ?? 0, lossesOfThreats: t.telemetry?.losses ?? 0, assaultEvents: t.events?.THREAT_ASSAULT ?? 0, pirateEvents: 0 },
    diplomacy: { treaties: {}, tradeOffers: 0, tradeAccepted: 0, routesAtEnd: 0, contactsBySeat: Object.fromEntries(seats.map(seat => [seat, 0])) },
  };
  for (const field of ['conflicts.perSeat', 'conflicts.battles.pvp', 'conflicts.warsDeclared', 'conflicts.diplomacy']) note(field, 'UNAVAILABLE', 'Simulation runs are played without wars or trade: nothing is recorded.');

  const timeline = [];
  let lastEra = '';
  for (const row of rowsOf(seats[0])) if (row.era !== lastEra) { lastEra = row.era; timeline.push({ round: row.round, seat: null, kind: 'ERA', text: `Começa a Era ${Math.min(ERA_COUNT, row.eraIdx + 1)}.` }); }
  timeline.push({ round: winner.round, seat: winner.playerId, kind: 'FINISH', text: winner.reason === 'HEGEMONY' ? 'Consolidou a Hegemonia e venceu.' : 'Venceu por Prestígio no limite de rodadas.' });
  note('timeline', 'PARTIAL', 'Only Era changes and the result: a run file has no structured milestones.');

  const report = {
    schemaVersion: MATCH_REPORT_SCHEMA_VERSION, kind: 'MatchReportV1', reportId: `${meta.variant}:${meta.policy}:${meta.profile}:p${meta.players}:s${meta.seed}:${fingerprint.slice(0, 6)}`,
    origin: 'IMPORTED_RUN', generator: { id: 'match-report-1', source: 'RUN_ROWS' },
    match: {
      gameId: `sim-${meta.variant}-${meta.policy}-${meta.profile}-p${meta.players}-s${meta.seed}`, seed: meta.seed, worldPreset: 'MIXED', mapSize: null, preset: meta.preset, pace: ['starthamlet', 'candA'].includes(meta.variant) ? (meta.variant === 'candA' ? 'ACCELERATED' : 'M1_ONLY') : 'STANDARD',
      roundLimit: meta.roundLimit, roundsPerEra: meta.roundsPerEra, actionsPerRound: meta.actionsPerRound, players: seats.length, roundsPlayed: winner.round,
      endReason: winner.reason, finishedAt: null, version: { content: null, rules: 'v5.1b', engine, app: null }, economyFingerprint: fingerprint, configKey,
    },
    seats: seats.map((seat, index) => ({ seat, civilization: civs[index] ?? null, leader: null, kind: 'BOT', botPersona: null, policy: meta.policy })),
    result: {
      winner: winner.playerId, ranking,
      hegemony: seats.map(seat => ({ seat, declaredPath: endgame.get(seat)?.declared ?? null, declaredRound: null, qualifiedSince: null, paths: endgame.get(seat)?.hegemonyPath ? [{ path: endgame.get(seat).hegemonyPath, met: endgame.get(seat).hegemonyMet, of: 3 }] : [] })),
      prestige: seats.map(seat => { const end = endgame.get(seat), by = end?.prestigeBy ?? { milestones: 0, ambitions: 0, works: 0, explored: 0, other: 0 }; return { seat, total: end?.prestige ?? 0, milestones: by.milestones, ambitions: by.ambitions, works: by.works, explored: by.explored, other: by.other }; }),
    },
    civilizations, economy: { rounds, perSeat, globalProduction: run.telemetry?.productionByResource ?? null }, actions, conflicts, timeline,
    coverage: { roundsExpected: winner.round, roundsRecorded: rounds.length, truncated: rounds.length < winner.round }, quality,
  };
  note('match.version', 'UNAVAILABLE', 'Content version and app version are not in a run file; the fingerprint covers variant, mode, preset and the harness tag.');
  note('match.mapSize', 'UNAVAILABLE', 'Not recorded by the run file.');
  note('seats.leader', 'UNAVAILABLE', 'The harness does not assign Figuras to seats in the run file.');
  return MatchReportV1Schema.parse(report);
}

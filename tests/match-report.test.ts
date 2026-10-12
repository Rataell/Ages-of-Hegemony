import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CIVILIZATIONS, MatchReportV1Schema, matchReportToCsv, type AlphaState, type MatchReportV1 } from '@aoh/game-domain';
import { beginAlphaPlanning, buildMatchReport, createAlphaGame, economyFingerprint, prestigeRanking } from '@aoh/game-engine';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService, type AlphaRoomView } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository, lifecycleOf, type AlphaRoom } from '../apps/server/src/alpha-room.js';
import { ReportingAlphaRepository, reportOf } from '../apps/server/src/alpha-report.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { completeRound } from './alpha-rounds.js';
// @ts-expect-error the script module is plain JavaScript (no declaration file)
import { reportFromRun } from '../scripts/lib/match-report-from-run.mjs';

/**
 * MatchReportV1: generation from the authoritative final state, determinism and idempotency, privacy, the stored report across a reload, authorization,
 * exports, the converter for recorded simulation runs and the Meta aggregator.
 */
const started = (seed: number): AlphaState => {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: `report-${seed}`, seed, preset: 'STANDARD', players: [{ id: 'p1', name: 'Alice Secreta' }, { id: 'p2', name: 'Bruno Secreto' }] }));
  for (const player of state.players) player.contacts = state.players.filter(other => other !== player).map(other => other.playerId);
  return state;
};
const finish = (seed: number, rounds = 2, tweak?: (state: AlphaState) => void): AlphaState => {
  let state = started(seed); state.rules.roundLimit = rounds; tweak?.(state);
  for (let round = 0; round < rounds; round++) state = completeRound(state);
  return state;
};

describe('generation from the final state', () => {
  it('builds a schema-valid report for a match that ended at the round limit', () => {
    const state = finish(78);
    const report = buildMatchReport(state, { origin: 'SIMULATION', finishedAt: '2026-10-11T12:00:00.000Z' });
    expect(MatchReportV1Schema.parse(report)).toEqual(report);
    expect(report.schemaVersion).toBe(1); expect(report.kind).toBe('MatchReportV1');
    expect(report.match).toMatchObject({ gameId: state.gameId, seed: state.core.seed, endReason: 'ROUND_LIMIT', roundsPlayed: 2, players: state.players.length, finishedAt: '2026-10-11T12:00:00.000Z' });
    expect(report.result.winner).toBe(state.winner!.playerId);
    // The ranking is the engine's own ranking, with the criterion that separated each pair.
    expect(report.result.ranking.map(entry => entry.seat)).toEqual(prestigeRanking(state));
    expect(report.result.ranking[0]!.decidedBy).toBeNull();
    for (const entry of report.result.ranking) expect(entry.prestige).toBe(state.players.find(player => player.playerId === entry.seat)!.prestige);
  });

  it('prestige sources add up to the total (the remainder is reported as `other`)', () => {
    const report = buildMatchReport(finish(78));
    for (const row of report.result.prestige) expect(row.milestones + row.ambitions + row.works + row.explored + row.other).toBe(row.total);
  });

  it('is deterministic and idempotent: the same final state and context give the same bytes', () => {
    const state = finish(79);
    const context = { origin: 'LIVE' as const, finishedAt: '2026-10-11T12:00:00.000Z', seats: state.players.map(player => ({ playerId: player.playerId, kind: 'HUMAN' as const })) };
    const a = buildMatchReport(structuredClone(state), context), b = buildMatchReport(structuredClone(state), context);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.reportId).toBe(b.reportId);
  });

  it('refuses a match that has not finished', () => {
    const state = started(80);
    expect(() => buildMatchReport(state)).toThrow(/encerramento/);
  });

  it('never carries anything private: no RNG seed, no display names, no guest or invite data', () => {
    const state = finish(81);
    const json = JSON.stringify(buildMatchReport(state));
    expect(json).not.toContain(state.privateRng.seed);
    for (const owner of state.core.players) expect(json, `name ${owner.name}`).not.toContain(owner.name);
    expect(json).not.toMatch(/joinCode|guestId|cookie|token|@/i);
  });

  it('declares what it cannot know: unavailable and partial fields are listed, and unknown seats are UNKNOWN', () => {
    const report = buildMatchReport(finish(82));
    expect(report.seats.every(seat => seat.kind === 'UNKNOWN')).toBe(true);
    const status = (field: string) => report.quality.find(entry => entry.field === field)?.status;
    expect(status('civilizations.cities.elevations')).toBe('UNAVAILABLE');
    expect(status('economy.ledger')).toBe('PARTIAL');
    expect(status('economy.stock')).toBe('OBSERVED');
    expect(status('economy.flows8')).toBe('UNAVAILABLE');
    expect(status('match.finishedAt')).toBe('UNAVAILABLE');
    expect(report.economy.perSeat.every(seat => seat.flows8 === null)).toBe(true);
  });

  it('marks truncated coverage when the bounded round log lost rounds', () => {
    const state = finish(83, 3);
    state.telemetry.roundLog = state.telemetry.roundLog.filter(row => row.round >= 2);
    const report = buildMatchReport(state);
    expect(report.coverage).toEqual({ roundsExpected: 3, roundsRecorded: 2, truncated: true });
    expect(report.quality.some(entry => entry.field === 'coverage' && entry.status === 'PARTIAL')).toBe(true);
  });

  it('stays compact: a short match is a few KB', () => {
    expect(JSON.stringify(buildMatchReport(finish(78))).length).toBeLessThan(40_000);
  });

  it('the economy fingerprint changes with any balance change and not with the seed', () => {
    const a = started(84), b = started(85), c = started(84);
    expect(economyFingerprint(a)).toBe(economyFingerprint(b));
    c.rules.balance.cityActions += 1;
    expect(economyFingerprint(a)).not.toBe(economyFingerprint(c));
  });
});

describe('CSV export', () => {
  it('has a header and one row per seat, with escaped text', () => {
    const report = buildMatchReport(finish(78));
    const lines = matchReportToCsv(report).trim().split('\n');
    expect(lines).toHaveLength(1 + report.seats.length);
    expect(lines[0]).toContain('prestige');
    expect(lines[0]).toContain('economyFingerprint');
    expect(lines[1]!.split(',').length).toBe(lines[0]!.split(',').length);
  });
});

describe('stored with the room: once, across a reload, with authorization', () => {
  const origin = 'https://report.example.test';
  async function lobby() {
    const memory = new InMemoryAlphaRepository();
    const clock = { value: new Date('2026-10-11T12:00:00.000Z') };
    const repository = new ReportingAlphaRepository(memory, 'test-app', () => clock.value);
    const http = new AlphaHttp(new AlphaGameService(repository), new GuestSessions('report-secret-'.repeat(4)), origin, true);
    let now = 1_000;
    const post = async (body: unknown, cookie = '') => {
      now += 1_000;
      const response = await http.handle(new Request(`${origin}/api/alpha`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie }, body: JSON.stringify(body) }), now);
      const payload = await response.json() as { ok: boolean; value?: AlphaRoomView; error?: { code: string; message: string } };
      if (!payload.ok || !payload.value) throw new Error(`${response.status} ${payload.error?.code}: ${payload.error?.message}`);
      return { view: payload.value, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? cookie };
    };
    const getReport = async (gameId: string, cookie: string) => {
      now += 1_000;
      const response = await http.handle(new Request(`${origin}/api/alpha?gameId=${gameId}&report=1`, { headers: { Cookie: cookie } }), now);
      return { status: response.status, payload: await response.json() as { ok: boolean; value?: MatchReportV1; error?: { code: string } } };
    };
    const created = await post({ operation: 'create', payload: { name: 'Mesa de relatório', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 4242, planningSeconds: 0, actionsPerRound: 5 } });
    const guest = await post({ operation: 'join', code: created.view.joinCode, displayName: 'Bruno' });
    const cookies = [created.cookie, guest.cookie];
    let view = guest.view;
    for (let index = 0; index < 2; index++) {
      view = (await post({ operation: 'lobby', gameId: view.id, payload: { type: 'CHOOSE_CIVILIZATION', expectedVersion: view.version, civilization: CIVILIZATIONS[index]!.id } }, cookies[index])).view;
      view = (await post({ operation: 'lobby', gameId: view.id, payload: { type: 'LOBBY_READY', expectedVersion: view.version, ready: true } }, cookies[index])).view;
    }
    view = (await post({ operation: 'lobby', gameId: view.id, payload: { type: 'START', expectedVersion: view.version } }, cookies[0])).view;
    return { memory, repository, http, cookies, id: view.id, getReport, clock };
  }
  /** Plays the stored game to the round limit through the engine, and saves it through the reporting repository like any command would. */
  async function finishRoom(env: Awaited<ReturnType<typeof lobby>>): Promise<AlphaRoom> {
    const room = (await env.memory.find(env.id))!;
    let game = room.game!; game.rules.roundLimit = 2;
    game = completeRound(completeRound(game));
    expect(game.core.status).toBe('FINISHED');
    const next: AlphaRoom = { ...room, game, version: room.version + 1, deadline: null };
    expect(await env.repository.save(next, room.version)).toBe(true);
    return (await env.memory.find(env.id))!;
  }

  it('the report is created in the save that finishes the match, exactly once, and never rewritten', async () => {
    const env = await lobby();
    expect((await env.memory.find(env.id))!.report).toBeNull();
    const finished = await finishRoom(env);
    expect(lifecycleOf(finished)).toBe('FINISHED');
    expect(finished.report).not.toBeNull();
    expect(finished.report!.match.finishedAt).toBe('2026-10-11T12:00:00.000Z');
    expect(finished.report!.match.version).toMatchObject({ content: 'v1.2', app: 'test-app' });
    expect(finished.report!.seats.every(seat => seat.kind === 'HUMAN')).toBe(true);
    // A later save (another notice, a later patch of the generator) keeps the stored report byte for byte.
    env.clock.value = new Date('2027-01-01T00:00:00.000Z');
    const before = JSON.stringify(finished.report);
    expect(await env.repository.save({ ...finished, version: finished.version + 1 }, finished.version)).toBe(true);
    expect(JSON.stringify((await env.memory.find(env.id))!.report)).toBe(before);
  });

  it('a failing generator never blocks the end of the match: the room is saved without a report and the read path rebuilds it', async () => {
    const env = await lobby();
    const room = (await env.memory.find(env.id))!;
    let game = room.game!; game.rules.roundLimit = 2; game = completeRound(completeRound(game));
    // A corrupt round log makes the generator throw; the stub storage keeps whatever it is given (no schema parse).
    const corrupt = structuredClone(game); (corrupt.telemetry.roundLog as unknown[])[0] = { playerId: corrupt.players[0]!.playerId, round: 1 };
    let saved: AlphaRoom | null = null;
    const stub = { find: async () => null, findByCode: async () => null, create: async () => true, save: async (next: AlphaRoom) => { saved = next; return true; } };
    expect(() => buildMatchReport(corrupt)).toThrow();
    const guarded = new ReportingAlphaRepository(stub);
    await expect(guarded.save({ ...room, game: corrupt, version: room.version + 1, deadline: null }, room.version)).resolves.toBe(true);
    expect(saved).not.toBeNull();
    expect((saved as unknown as AlphaRoom).report).toBeNull();
    expect(lifecycleOf(saved as unknown as AlphaRoom)).toBe('FINISHED');
  });

  it('survives a reload (a brand-new service over the same storage) and equals the stored report', async () => {
    const env = await lobby();
    const finished = await finishRoom(env);
    const reloaded = new AlphaHttp(new AlphaGameService(new ReportingAlphaRepository(env.memory, 'test-app')), new GuestSessions('report-secret-'.repeat(4)), origin, true);
    const response = await reloaded.handle(new Request(`${origin}/api/alpha?gameId=${env.id}&report=1`, { headers: { Cookie: env.cookies[1]! } }), 99_000);
    const payload = await response.json() as { ok: boolean; value?: MatchReportV1 };
    expect(response.status).toBe(200);
    expect(payload.value).toEqual(finished.report);
  });

  it('is only readable by a seat of the match, and only once the match is finished', async () => {
    const env = await lobby();
    const early = await env.getReport(env.id, env.cookies[0]!);
    expect(early.status).toBe(409); expect(early.payload.error?.code).toBe('NOT_FINISHED');
    const finished = await finishRoom(env);
    const stranger = await env.getReport(env.id, '');
    expect([401, 403]).toContain(stranger.status);
    const seatA = await env.getReport(env.id, env.cookies[0]!), seatB = await env.getReport(env.id, env.cookies[1]!);
    expect(seatA.status).toBe(200); expect(seatB.status).toBe(200);
    expect(seatA.payload.value).toEqual(finished.report);
    expect(JSON.stringify(seatA.payload.value)).not.toContain(finished.joinCode);
    expect(JSON.stringify(seatA.payload.value)).not.toContain(finished.hostGuestId);
    for (const seat of finished.seats) expect(JSON.stringify(seatA.payload.value)).not.toContain(seat.name);
  });

  it('the live room view never carries the report (it is a separate, FINISHED-only read)', async () => {
    const env = await lobby();
    const finished = await finishRoom(env);
    const service = new AlphaGameService(new ReportingAlphaRepository(env.memory));
    const principal = { guestId: finished.hostGuestId } as never;
    const view = await service.read(principal, env.id, 5_000);
    expect(view.ok && 'report' in view.value).toBe(false);
  });

  it('a room that finished before reports existed gets one rebuilt in memory, marked RECONSTRUCTED, and nothing is written', async () => {
    const env = await lobby();
    const room = (await env.memory.find(env.id))!;
    let game = room.game!; game.rules.roundLimit = 2; game = completeRound(completeRound(game));
    const legacy: AlphaRoom = { ...room, game, version: room.version + 1, deadline: null, report: null };
    expect(await env.memory.save(legacy, room.version)).toBe(true);   // saved straight to storage, as an old build would have
    const rebuilt = reportOf((await env.memory.find(env.id))!);
    expect(rebuilt?.origin).toBe('RECONSTRUCTED');
    expect((await env.memory.find(env.id))!.report).toBeNull();
  });
});

describe('converter for recorded simulation runs', () => {
  const row = (seat: string, round: number, extra: Record<string, unknown> = {}) => ({
    seat, round, era: 'FOUNDATION', eraIdx: 0, openStock: { food: 5, wood: 4, stone: 3, metal: 0, wealth: 2, knowledge: 1, influence: 0, culture: 0 }, caps: { food: 15, wood: 15, stone: 15, metal: 10, wealth: 15, knowledge: 10, influence: 10, culture: 10 },
    produced: { food: 4, wood: 1, stone: 0, metal: 0, wealth: 0, knowledge: 1, influence: 0, culture: 0 }, roundStartGain: {}, sustenance: { food: 2 }, growth: {}, military: {}, discard: {}, spend: { BUILD: { wood: 2 } }, other: {}, losses: {},
    ordersUsed: 3, ordersLimit: 5, ordersByType: { CITY: 3, EXPEDITION: 0, ADVANCE: 0, INFLUENCE: 0, LEGACY: 0 }, kinds: { PRODUCE: 2, BUILD: 1 }, actionFailed: 0, famine: 0, upkeepShortage: 0, cities: 1, pop: 3 + round, levels: [2], mood: [4], research: round, districts: 1, buildings: 0, territory: 4, government: 'PROTO_GOVERNANCE', prestige: round + (seat === 'p1' ? 1 : 0), ...extra,
  });
  const run = (seed: number, variant = 'base') => ({
    meta: { policy: 'balanced', profile: 2, players: 2, seed, variant, mode: 'world', preset: 'QUICK', roundLimit: 2, roundsPerEra: 3, actionsPerRound: 5, finalRound: 2, winner: { playerId: 'p1', reason: 'ROUND_LIMIT', round: 2 }, civs: ['valgard', 'meridia'] },
    rows: [1, 2].flatMap(round => [row('p1', round), row('p2', round, { famine: round === 2 ? 1 : 0 })]),
    endgame: [{ seat: 'p1', works: 0, hegemonyMet: 1, hegemonyPath: 'TERRITORIAL', declared: null, prestige: 3, prestigeBy: { milestones: 0, ambitions: 0, works: 0, explored: 1, other: 2 } }, { seat: 'p2', works: 0, hegemonyMet: 0, hegemonyPath: null, declared: null, prestige: 2, prestigeBy: { milestones: 0, ambitions: 0, works: 0, explored: 0, other: 2 } }],
    threats: { assaults: 2, playerAttacksOnThreats: 0, telemetry: { spawned: 1, attacks: 2, kills: 0, losses: 0 }, events: { THREAT_ASSAULT: 2 } }, telemetry: { productionByResource: { food: 8, wood: 2, stone: 0, metal: 0, wealth: 0, knowledge: 2, influence: 0, culture: 0 } },
  });

  it('turns a run file into a valid MatchReportV1 and marks what a run cannot know', () => {
    const report = reportFromRun(run(1)) as MatchReportV1;
    expect(MatchReportV1Schema.parse(report)).toEqual(report);
    expect(report.origin).toBe('IMPORTED_RUN');
    expect(report.economy.perSeat[0]!.flows8?.produced.food).toBe(8);
    expect(report.economy.perSeat[1]!.shortage.foodRounds).toBe(1);
    const status = (field: string) => report.quality.find(entry => entry.field === field)?.status;
    expect(status('civilizations.research.order')).toBe('UNAVAILABLE');
    expect(status('civilizations.buildings')).toBe('UNAVAILABLE');
    expect(status('conflicts.perSeat')).toBe('UNAVAILABLE');
    expect(status('economy.stock')).toBe('PARTIAL');
  });

  it('different harness variants never share an economy fingerprint; the same seed and configuration share a config key', () => {
    const base = reportFromRun(run(1)) as MatchReportV1, m1 = reportFromRun(run(1, 'starthamlet')) as MatchReportV1, again = reportFromRun(run(1)) as MatchReportV1;
    expect(base.match.economyFingerprint).not.toBe(m1.match.economyFingerprint);
    expect(base.match.configKey).toBe(again.match.configKey);
    expect(base.match.configKey).not.toBe((reportFromRun(run(2)) as MatchReportV1).match.configKey);
  });
});

describe('Meta aggregator (scripts/alpha-meta-report.mjs)', () => {
  const aggregate = (reports: MatchReportV1[], ...flags: string[]) => {
    const dir = mkdtempSync(join(tmpdir(), 'aoh-meta-'));
    reports.forEach((report, index) => writeFileSync(join(dir, `r${index}.json`), JSON.stringify(report)));
    const out = join(dir, 'out.json'), md = join(dir, 'out.md');
    const result = spawnSync(process.execPath, ['scripts/alpha-meta-report.mjs', dir, `--json=${out}`, `--md=${md}`, ...flags], { encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    return { json: JSON.parse(spawnSyncRead(out)) as { fingerprint: string; games: number; replicates: number; warnings: string[]; winByCivilization: { label: string; n: number; flag: string | null }[] }[], md: spawnSyncRead(md) };
  };
  const spawnSyncRead = (file: string) => readFileSync(file, 'utf8');
  const sample = (seed: number, tweak?: (state: AlphaState) => void) => buildMatchReport(finish(seed, 2, tweak), { origin: 'SIMULATION' });

  it('prints the sample size, warns when it is too small and counts repeats of one seed once', () => {
    const a = sample(78), b = sample(79);
    const { json, md } = aggregate([a, b, a]);
    expect(json).toHaveLength(1);
    expect(json[0]!.games).toBe(2); expect(json[0]!.replicates).toBe(1);
    expect(json[0]!.warnings.join(' ')).toMatch(/Amostra pequena/);
    expect(md).toMatch(/Partidas independentes: \*\*2\*\*/);
    expect(json[0]!.winByCivilization.every(cell => cell.flag === 'dados insuficientes')).toBe(true);
  });

  it('never pools reports with different economy fingerprints: one section each', () => {
    const a = sample(78), b = sample(79, state => { state.rules.balance.cityActions += 1; });
    const { json } = aggregate([a, b]);
    expect(json.map(group => group.fingerprint).sort()).toEqual([a.match.economyFingerprint, b.match.economyFingerprint].sort());
    expect(json.every(group => group.games === 1)).toBe(true);
  });

  it('filters by player count, round limit, civilization and human/bot kind', () => {
    const a = sample(78);
    expect(aggregate([a], '--players=2').json).toHaveLength(1);
    expect(aggregate([a], '--players=4').json).toHaveLength(0);
    expect(aggregate([a], '--rounds=2').json).toHaveLength(1);
    expect(aggregate([a], '--rounds=35').json).toHaveLength(0);
    expect(aggregate([a], `--civ=${a.seats[0]!.civilization}`).json).toHaveLength(1);
    expect(aggregate([a], '--kind=humans').json).toHaveLength(0);      // seats are UNKNOWN: neither humans nor bots
  });

  it('skips fields a report lists as UNAVAILABLE instead of counting zeros', () => {
    const imported = reportFromRun(run2()) as MatchReportV1;
    const { md } = aggregate([imported]);
    expect(md).toMatch(/Ordem de pesquisa indisponível/);
  });
  const run2 = () => ({
    meta: { policy: 'balanced', profile: 2, players: 2, seed: 9, variant: 'base', mode: 'world', preset: 'QUICK', roundLimit: 2, roundsPerEra: 3, actionsPerRound: 5, finalRound: 2, winner: { playerId: 'p1', reason: 'ROUND_LIMIT', round: 2 }, civs: ['valgard', 'meridia'] },
    rows: [1, 2].flatMap(round => ['p1', 'p2'].map(seat => ({ seat, round, era: 'FOUNDATION', eraIdx: 0, openStock: { food: 5, wood: 0, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0, culture: 0 }, caps: {}, produced: {}, spend: {}, ordersUsed: 2, ordersLimit: 5, ordersByType: { CITY: 2 }, kinds: {}, cities: 1, pop: 3, levels: [2], mood: [4], research: 1, territory: 3, government: 'PROTO_GOVERNANCE', prestige: 1 }))),
    endgame: [{ seat: 'p1', prestige: 1, prestigeBy: { milestones: 0, ambitions: 0, works: 0, explored: 0, other: 1 } }, { seat: 'p2', prestige: 1, prestigeBy: { milestones: 0, ambitions: 0, works: 0, explored: 0, other: 1 } }],
  });
});

describe('Crônica da Partida (interface contract)', () => {
  const web = (file: string) => readFileSync(new URL(`../apps/web/app/alpha/${file}`, import.meta.url), 'utf8');
  it('opens from the final screen only, and the six sections of the brief exist', () => {
    const board = web('alpha-board.tsx'), chronicle = web('alpha-chronicle.tsx');
    expect(board).toMatch(/Crônica da Partida/);
    expect(board).toMatch(/game\.winner&&chronicleOpen&&<AlphaChronicle/);
    for (const title of ['Resumo', 'Civilizações', 'Economia', 'Desenvolvimento', 'Conflitos', 'Linha do tempo']) expect(chronicle, title).toContain(`'${title}'`);
  });
  it('reads the stored report from the dedicated FINISHED-only endpoint and offers JSON and CSV', () => {
    const chronicle = web('alpha-chronicle.tsx');
    expect(chronicle).toMatch(/gameId=\$\{encodeURIComponent\(roomId\)\}&report=1/);
    expect(chronicle).toContain('Exportar JSON'); expect(chronicle).toContain('Exportar CSV');
    expect(chronicle).toContain('matchReportToCsv');
    expect(chronicle).toContain('O que esta Crônica não sabe');
  });
  it('uses only tokens that already exist (no new colors) and no hard-coded brand colors', () => {
    const css = readFileSync(new URL('../apps/web/app/alpha/alpha.css', import.meta.url), 'utf8');
    const block = css.slice(css.indexOf('/* Crônica da Partida'));
    expect(block).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

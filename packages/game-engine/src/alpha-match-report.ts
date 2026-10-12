import {
  ADVANCEMENTS, ALPHA_CARDS, LEGACY_WORK_PRESTIGE, MATCH_REPORT_SCHEMA_VERSION, MatchReportV1Schema, REPORT_RESOURCES, eraNumeral, legacyWork,
  type AlphaState, type MatchReportV1, type PlayerId, type QualityEntrySchema,
} from '@aoh/game-domain';
import type { z } from 'zod';
import { hegemonyProgress } from './alpha-hegemony.js';
import { prestigeRanking } from './alpha-phases.js';

/**
 * Builds the MatchReportV1 of a FINISHED match. Pure: a function of the authoritative final state and of the caller's metadata. It reads, never writes, and it
 * never looks at `privateRng`. The same final state with the same context always produces the same report (idempotent), so a lost race or a retry is harmless.
 */
export interface MatchReportContext {
  /** Seat metadata from the room (the state does not know who is a bot). Missing seats are reported as UNKNOWN. */
  seats?: readonly { playerId: string; kind: 'HUMAN' | 'BOT'; botPersona?: string | null; policy?: string | null }[];
  origin?: 'LIVE' | 'RECONSTRUCTED' | 'SIMULATION';
  contentVersion?: string | null; appVersion?: string | null;
  /** ISO date of the conclusion; the state carries no clock. */
  finishedAt?: string | null;
}
type Quality = z.infer<typeof QualityEntrySchema>;
const RESOURCES = REPORT_RESOURCES;
const zero = (): Record<string, number> => ({});
const bump = (record: Record<string, number>, key: string, by = 1): void => { record[key] = (record[key] ?? 0) + by; };
const mean = (values: readonly number[]): number => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100 : 0;

/** Order-independent JSON for hashing. */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
/** Two 32-bit FNV-1a lanes, 16 hex chars. Not cryptographic: it only groups identical configurations. */
export function shortHash(text: string): string {
  let a = 0x811c9dc5, b = 0x01000193 ^ 0xdeadbeef;
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    a = Math.imul(a ^ code, 0x01000193) >>> 0;
    b = Math.imul(b ^ (code + index), 0x85ebca6b) >>> 0;
  }
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}
/** Everything that changes the economy or the balance of a match. Two reports with different fingerprints must never be pooled silently. */
export function economyFingerprint(state: AlphaState): string {
  const rules = state.rules;
  return shortHash(stable({ balance: rules.balance, units: rules.units, hegemony: rules.hegemonyRequirements, combat: rules.combat, move: rules.movementCosts, calendar: [rules.preset, rules.roundLimit, rules.roundsPerEra, rules.actionsPerRound, rules.handLimit, rules.unitLimit], integration: rules.integrationCost, rulesVersion: state.rulesVersion }));
}

export function buildMatchReport(state: AlphaState, context: MatchReportContext = {}): MatchReportV1 {
  if (state.core.status !== 'FINISHED' || !state.winner) throw new Error('O relatório só existe depois do encerramento definitivo da partida.');
  const winner = state.winner, telemetry = state.telemetry, log = telemetry.roundLog;
  const seatIds = state.players.map(player => player.playerId as string).sort();
  const quality: Quality[] = [];
  const note = (field: string, status: Quality['status'], text: string) => quality.push({ field, status, note: text });

  // ---- identification ------------------------------------------------------------------------------------------------------------------------------
  const rounds = [...new Set(log.map(row => row.round))].sort((a, b) => a - b);
  const roundsExpected = winner.round;
  const truncated = rounds.length < roundsExpected;
  const seatMeta = new Map((context.seats ?? []).map(seat => [seat.playerId, seat]));
  const seats = seatIds.map(id => {
    const player = state.players.find(candidate => candidate.playerId === id)!, meta = seatMeta.get(id);
    return { seat: id, civilization: player.civilization ?? null, leader: player.leader?.leaderId ?? null, kind: meta?.kind ?? 'UNKNOWN' as const, botPersona: meta?.botPersona ?? null, policy: meta?.policy ?? null };
  });
  const configKey = shortHash(stable({ seed: state.core.seed, world: state.rules.worldPreset, map: state.rules.mapSize, preset: state.rules.preset, seats: seats.map(seat => [seat.seat, seat.civilization, seat.kind, seat.botPersona ?? seat.policy]) }));
  const fingerprint = economyFingerprint(state);
  if (!context.seats) note('seats.kind', 'UNAVAILABLE', 'The room metadata was not given: human/bot is UNKNOWN (the game state does not record it).');
  if (!context.finishedAt) note('match.finishedAt', 'UNAVAILABLE', 'The final state carries no clock and the caller gave no date.');

  // ---- result --------------------------------------------------------------------------------------------------------------------------------------
  const order = prestigeRanking(state) as string[];
  const metrics = (id: string): [number, number, number, number] => {
    const player = state.players.find(candidate => candidate.playerId === id)!, owner = state.core.players.find(candidate => candidate.id === id)!;
    return [player.prestige, player.research.length, owner.civilization.cities.reduce((total, city) => total + city.population, 0), player.resources.wealth];
  };
  const CRITERIA = ['prestige', 'research', 'population', 'wealth'] as const;
  const ranking = order.map((id, index) => {
    const [prestige, researched, population, wealth] = metrics(id);
    let decidedBy: (typeof CRITERIA)[number] | 'initiative' | null = null;
    if (index > 0) { const above = metrics(order[index - 1]!); const at = above.findIndex((value, position) => value !== metrics(id)[position]); decidedBy = at === -1 ? 'initiative' : CRITERIA[at]!; }
    return { seat: id, rank: index + 1, prestige, researched, population, wealth, decidedBy };
  });
  const hegemony = seatIds.map(id => {
    const player = state.players.find(candidate => candidate.playerId === id)!;
    return {
      seat: id, declaredPath: player.hegemony?.path ?? null, declaredRound: player.hegemony?.declaredRound ?? null, qualifiedSince: player.hegemony?.qualifiedSince ?? null,
      paths: hegemonyProgress(state, id as PlayerId).map(entry => ({ path: entry.path as string, met: entry.requirements.filter(requirement => requirement.met).length, of: entry.requirements.length })),
    };
  });
  const prestige = seatIds.map(id => {
    const player = state.players.find(candidate => candidate.playerId === id)!;
    const milestones = player.research.filter(node => ADVANCEMENTS.find(advancement => advancement.id === node)?.milestone).length * 3;
    const ambitions = player.completedAmbitions.reduce((total, card) => total + (ALPHA_CARDS.find(item => item.id === card)?.objective?.prestige ?? 0), 0);
    const works = state.legacyWorks.filter(work => work.ownerId === id && work.completedRound !== null).length * LEGACY_WORK_PRESTIGE;
    const explored = player.exploredRegions;
    return { seat: id, total: player.prestige, milestones, ambitions, works, explored, other: player.prestige - milestones - ambitions - works - explored };
  });
  note('result.prestige', 'CALCULATED', 'milestones (3 each), Ambições, Obras (4 each, without civilization bonuses) and Regiões (1 each) are derived from the final state; `other` is the remainder (cards, Ressonância, Ameaças, treaty penalties) and can be negative.');

  // ---- per seat: civilization ----------------------------------------------------------------------------------------------------------------------
  const rowsOf = (id: string) => log.filter(row => row.playerId === id).sort((a, b) => a.round - b.round);
  const eventsFor = (id: string, type: string) => state.events.filter(event => event.type === type && (event.audience?.includes(id as PlayerId) ?? false));
  const distinctRounds = (events: readonly { round: number }[]) => new Set(events.map(event => event.round)).size;
  const foundedEvents = state.core.eventLog.filter(event => event.type === 'CITY_FOUNDED');
  const transfers = state.core.eventLog.filter(event => event.type === 'CITY_TRANSFERRED');
  const coreCities = new Map(state.core.players.flatMap(owner => owner.civilization.cities).map(city => [city.id as string, city]));
  const civilizations = seatIds.map(id => {
    const player = state.players.find(candidate => candidate.playerId === id)!, owner = state.core.players.find(candidate => candidate.id === id)!;
    const mine = state.cities.filter(city => city.currentOwnerId === id), rows = rowsOf(id);
    const levels = mine.map(city => ['OUTPOST', 'HAMLET', 'VILLAGE', 'CITY', 'GREAT_CITY', 'METROPOLIS', 'IMPERIAL_METROPOLIS'].indexOf(city.level) + 1);
    const byLevel = [1, 2, 3, 4, 5, 6, 7].map(level => levels.filter(value => value === level).length);
    const firstRoundAtLevel = [1, 2, 3, 4, 5, 6, 7].map(level => rows.find(row => row.cityLevels.some(value => value >= level))?.round ?? null);
    const founded = foundedEvents.filter(event => 'playerId' in event && event.playerId === id).length;
    const captured = transfers.filter(event => 'playerId' in event && event.playerId === id).length;
    const lost = transfers.filter(event => 'previousOwnerId' in event && (event as { previousOwnerId: string }).previousOwnerId === id).length;
    const districts = zero(), buildings = zero();
    for (const city of mine) { for (const district of city.districts) bump(districts, district); for (const building of city.buildings) bump(buildings, building); }
    const byDomain = zero();
    for (const node of player.research) bump(byDomain, ADVANCEMENTS.find(advancement => advancement.id === node)?.domain ?? 'OTHER');
    const heritages = player.research.filter(node => node.startsWith('her-')).length;
    return {
      seat: id,
      government: owner.civilization.government ?? null, reformEra: player.governmentReformEra,
      leaderAbilityUses: eventsFor(id, 'LEADER_ABILITY').length,
      cities: {
        atStart: state.cities.filter(city => city.originalOwnerId === id && (coreCities.get(city.cityId)?.foundedRound ?? 99) <= 1 && !foundedEvents.some(event => 'cityId' in event && event.cityId === city.cityId)).length,
        founded, captured, lost, final: mine.length, occupiedAtEnd: mine.filter(city => city.status === 'OCCUPIED').length,
        elevations: null, maxLevel: Math.max(0, ...levels), meanLevel: mean(levels), byLevel, firstRoundAtLevel,
      },
      population: { firstRound: rows[0]?.population ?? null, final: owner.civilization.cities.reduce((total, city) => total + city.population, 0), series: rows.map(row => row.population) },
      districts, buildings,
      territory: state.core.map.filter(tile => tile.ownerId === id).length, regionsDiscovered: player.exploredRegions,
      research: { total: player.research.length, byDomain, order: [...player.research], heritages, milestonesReached: player.research.filter(node => ADVANCEMENTS.find(advancement => advancement.id === node)?.milestone) },
      resonance: { cycles: player.resonance.cycles, repercussions: eventsFor(id, 'REPERCUSSION').length },
      legacyWorks: state.legacyWorks.filter(work => work.ownerId === id).map(work => ({ workId: work.workId, cityId: work.cityId as string, startedRound: work.startedRound, completedRound: work.completedRound, stepsDone: work.stepsDone })),
    };
  });
  note('civilizations.cities.elevations', 'UNAVAILABLE', 'No per-civilization counter of the Elevar action exists; see byLevel and firstRoundAtLevel.');
  note('civilizations.government', 'PARTIAL', 'Only the final government and the Era of the last reform are preserved (earlier governments are not).');
  note('civilizations.research.order', 'PARTIAL', 'The acquisition order is preserved; the round of each advancement is not (the cumulative count per round is in the round log).');
  note('civilizations.cities.atStart', 'CALCULATED', 'Cities the seat originally owned that were already founded in round 1 (initial cities), whoever holds them now.');
  note('civilizations.research.heritages', 'CALCULATED', 'Researched ids with the heritage prefix (her-).');

  // ---- economy -------------------------------------------------------------------------------------------------------------------------------------
  const economySeats = seatIds.map(id => {
    const rows = rowsOf(id);
    const stock: Record<string, number[]> = {};
    for (const resource of RESOURCES) stock[resource] = rows.map(row => row.stock[resource] ?? 0);
    const atCapRounds = zero(), emptyRounds = zero();
    for (const resource of RESOURCES) { atCapRounds[resource] = rows.filter(row => row.atCap.includes(resource)).length; emptyRounds[resource] = stock[resource]!.filter(value => value === 0).length; }
    const sum = (pick: (row: (typeof rows)[number]) => Record<string, number>) => { const total = zero(); for (const row of rows) for (const [key, value] of Object.entries(pick(row))) bump(total, key, value); return total; };
    const moods = rows.map(row => row.moods);
    return {
      seat: id, stock, atCapRounds, emptyRounds,
      ledger: { produced: sum(row => row.produced), spent: sum(row => row.spent), lost: sum(row => row.lost), discarded: sum(row => row.discarded) },
      flows8: null,
      shortage: { foodRounds: distinctRounds(eventsFor(id, 'FOOD_SHORTAGE')), upkeepRounds: distinctRounds(eventsFor(id, 'UPKEEP_SHORTAGE')), overextensionRounds: distinctRounds(eventsFor(id, 'ADMINISTRATIVE_OVEREXTENSION')) },
      mood: { mean: moods.map(values => mean(values)), min: moods.map(values => values.length ? Math.min(...values) : 0), revoltRounds: moods.filter(values => values.some(value => value <= 1)).length },
      populationSeries: rows.map(row => row.population), cityCountSeries: rows.map(row => row.cities), maxLevelSeries: rows.map(row => Math.max(0, ...row.cityLevels)), prestigeSeries: rows.map(row => row.prestige),
    };
  });
  note('economy.stock', 'OBSERVED', 'Closing stock of the eight resources per round (round log). The first value is the closing of the first recorded round, not the starting stock.');
  note('economy.ledger', 'PARTIAL', 'Flows come from the legacy five-pool ledger: wood, stone and metal are merged in `materials`, Cultura has no flows. Era-turn effects (Pulso, rewards) fall outside the round ledger.');
  note('economy.flows8', 'UNAVAILABLE', 'The engine does not record per-resource flows for wood, stone, metal and Cultura; only instrumented simulation runs carry them.');
  note('economy.globalProduction', 'PARTIAL', 'Eight keys but all civilizations summed and only the PRODUCE action output.');
  note('economy.shortage', 'CALCULATED', 'Rounds with FOOD_SHORTAGE / UPKEEP_SHORTAGE / ADMINISTRATIVE_OVEREXTENSION events addressed to the seat.');
  if (truncated) note('coverage', 'PARTIAL', `The round log kept ${rounds.length} of ${roundsExpected} rounds (it holds the last 260 rows); the first rounds are missing from every series.`);

  // ---- actions -------------------------------------------------------------------------------------------------------------------------------------
  const actions = seatIds.map(id => {
    const rows = rowsOf(id), byCategory = zero();
    for (const row of rows) for (const [category, count] of Object.entries(row.orders)) bump(byCategory, category, count);
    const committed = Object.values(byCategory).reduce((a, b) => a + b, 0), available = rows.length * (state.rules.actionsPerRound ?? 5);
    const executed = zero();
    for (const event of state.resolutionEvents) if (event.actorId === id) bump(executed, event.type);
    const failed = eventsFor(id, 'ACTION_FAILED').length + eventsFor(id, 'ORDER_FAILED').length;
    return { seat: id, ordersByCategory: byCategory, ordersCommitted: committed, ordersAvailable: available, ordersUnused: Math.max(0, available - committed), failedActions: failed, executed };
  });
  note('actions.ordersUnused', 'CALCULATED', 'available (rounds × Orders per round) minus committed; `committed` counts Orders committed, not Orders that succeeded.');
  note('actions.failedActions', 'PARTIAL', 'Counts only actions the engine rejected at resolution (ACTION_FAILED / ORDER_FAILED); commands refused when sent are not in the state.');

  // ---- conflicts -----------------------------------------------------------------------------------------------------------------------------------
  const WORLD = 'world';
  const pvp = state.battles.filter(battle => battle.attackerId !== WORLD && battle.defenderId !== WORLD);
  const perSeat = seatIds.map(id => {
    const asAttacker = pvp.filter(battle => battle.attackerId === id), asDefender = pvp.filter(battle => battle.defenderId === id);
    let unitsLost = 0, unitsDestroyed = 0;
    for (const battle of state.battles) {
      const attackerLoss = battle.losses.filter(unit => battle.attackerUnits.includes(unit)).length, defenderLoss = battle.losses.filter(unit => battle.defenderUnits.includes(unit)).length;
      if (battle.attackerId === id) { unitsLost += attackerLoss; if (battle.defenderId !== WORLD) unitsDestroyed += defenderLoss; }
      if (battle.defenderId === id) { unitsLost += defenderLoss; if (battle.attackerId !== WORLD) unitsDestroyed += attackerLoss; }
    }
    return {
      seat: id, attacks: asAttacker.length, attackWins: asAttacker.filter(battle => battle.winnerId === id).length, attackLosses: asAttacker.filter(battle => battle.winnerId !== id).length,
      defences: asDefender.length, defenceWins: asDefender.filter(battle => battle.winnerId === id).length, unitsLost, unitsDestroyed,
      assaultsSuffered: state.battles.filter(battle => battle.attackerId === WORLD && battle.defenderId === id).length,
      threatAttacks: state.battles.filter(battle => battle.attackerId === id && battle.defenderId === WORLD).length,
    };
  });
  const treaties = zero();
  for (const treaty of state.treaties) bump(treaties, `${treaty.type}/${treaty.status}`);
  const conflicts = {
    battles: { pvp: pvp.length, againstThreats: state.battles.filter(battle => battle.defenderId === WORLD).length, byThreats: state.battles.filter(battle => battle.attackerId === WORLD).length },
    perSeat,
    warsDeclared: state.events.filter(event => event.type === 'WAR_DECLARED').length,
    warsActiveAtEnd: state.wars.map(([a, b]) => [a as string, b as string] as [string, string]),
    threats: {
      spawned: telemetry.threatsSpawned, attacks: telemetry.threatAttacks, campsDestroyed: telemetry.threatKills, lossesOfThreats: telemetry.threatLosses,
      assaultEvents: state.events.filter(event => event.type === 'THREAT_ASSAULT').length,
      pirateEvents: state.events.filter(event => event.type === 'THREAT_PILLAGE' && /pirata/i.test(event.message)).length,
    },
    diplomacy: { treaties, tradeOffers: telemetry.tradeOffers, tradeAccepted: telemetry.acceptedTrades, routesAtEnd: state.routes.length, contactsBySeat: Object.fromEntries(state.players.map(player => [player.playerId as string, player.contacts.length])) },
  };
  note('conflicts.warsDeclared', 'PARTIAL', 'Only the number of declarations (public events). Who declared on whom is not recorded without the display names, and `state.wars` holds only the wars still active.');
  note('conflicts.threats', 'PARTIAL', 'Threat counters are global; destroyed Acampamentos leave no per-seat record except the world-battle list and THREAT events.');
  note('conflicts.perSeat.unitsLost', 'CALCULATED', 'Losses are assigned to a side by membership of the unit ids in the battle record.');

  // ---- timeline (curated milestones; never an event log) -----------------------------------------------------------------------------------------
  const timeline: MatchReportV1['timeline'] = [];
  const add = (round: number, seat: string | null, kind: string, text: string) => { timeline.push({ round, seat, kind, text }); };
  let lastEra = '';
  for (const row of [...log].sort((a, b) => a.round - b.round)) if (row.era !== lastEra && row.playerId === seatIds[0]) { lastEra = row.era; add(row.round, null, 'ERA', `Começa a Era ${eraNumeral(row.era as never)}.`); }
  for (const event of foundedEvents) if ('playerId' in event) add(event.round, event.playerId, 'CITY_FOUNDED', 'Fundou uma nova cidade.');
  for (const event of transfers) if ('playerId' in event) add(event.round, event.playerId, 'CITY_CAPTURED', 'Tomou uma cidade.');
  for (const civ of civilizations) civ.cities.firstRoundAtLevel.forEach((round, index) => { if (round !== null && index >= 3) add(round, civ.seat, 'CITY_LEVEL', `Primeira cidade de nível ${index + 1}.`); });
  for (const work of state.legacyWorks) {
    const name = legacyWork(work.workId)?.name ?? work.workId;
    add(work.startedRound, work.ownerId, 'LEGACY_START', `Iniciou a Obra ${name}.`);
    if (work.completedRound !== null) add(work.completedRound, work.ownerId, 'LEGACY_DONE', `Concluiu a Obra ${name}.`);
  }
  for (const resolution of state.resolutionEvents) {
    if (resolution.type !== 'RESEARCH' || !resolution.actorId) continue;
    const node = ADVANCEMENTS.find(advancement => advancement.milestone && resolution.message.includes(advancement.name));
    if (node) add(resolution.round, resolution.actorId, 'MILESTONE', `Alcançou o marco ${node.name}.`);
  }
  for (const player of state.players) if (player.hegemony) {
    add(player.hegemony.declaredRound, player.playerId, 'HEGEMONY_DECLARED', `Declarou a Hegemonia ${player.hegemony.path}.`);
    if (player.hegemony.qualifiedSince !== null) add(player.hegemony.qualifiedSince, player.playerId, 'HEGEMONY_QUALIFIED', 'Cumpriu todos os requisitos da Hegemonia.');
  }
  for (const event of state.events) {
    if (event.type === 'WAR_DECLARED') add(event.round, null, 'WAR', 'Uma guerra foi declarada.');
    else if (event.type === 'THREAT_DESTROYED' && event.audience?.length === 1) add(event.round, event.audience[0]!, 'THREAT_DESTROYED', 'Destruiu um Acampamento ou Ancoradouro.');
  }
  const decisive = pvp.filter(battle => battle.outcome === 'DECISIVE').slice(0, 12);
  for (const battle of decisive) add(battle.round, battle.winnerId, 'BATTLE', 'Venceu uma batalha decisiva.');
  add(winner.round, winner.playerId, 'FINISH', winner.reason === 'HEGEMONY' ? 'Consolidou a Hegemonia e venceu.' : 'Venceu por Prestígio no limite de rodadas.');
  const priority: Record<string, number> = { FINISH: 0, HEGEMONY_DECLARED: 1, HEGEMONY_QUALIFIED: 1, ERA: 2, LEGACY_DONE: 3, MILESTONE: 3, CITY_CAPTURED: 4, BATTLE: 5, CITY_LEVEL: 6, THREAT_DESTROYED: 7, WAR: 7, LEGACY_START: 8, CITY_FOUNDED: 9 };
  const kept = timeline.length > 160 ? [...timeline].sort((a, b) => (priority[a.kind] ?? 9) - (priority[b.kind] ?? 9) || a.round - b.round).slice(0, 160) : timeline;
  kept.sort((a, b) => a.round - b.round || (priority[a.kind] ?? 9) - (priority[b.kind] ?? 9) || (a.seat ?? '').localeCompare(b.seat ?? ''));
  note('timeline', 'CALCULATED', 'Curated milestones from structured records (Era changes, foundations, captures, levels, Obras, milestones, Hegemony, decisive battles); not a log of operations. Text is generated, never copied from private events.');

  const report: MatchReportV1 = {
    schemaVersion: MATCH_REPORT_SCHEMA_VERSION, kind: 'MatchReportV1', reportId: `${state.gameId}:${winner.round}:${fingerprint.slice(0, 8)}`,
    origin: context.origin ?? 'LIVE', generator: { id: 'match-report-1', source: 'FINAL_STATE' },
    match: {
      gameId: state.gameId, seed: state.core.seed, worldPreset: state.rules.worldPreset, mapSize: state.rules.mapSize ?? null, preset: state.rules.preset,
      roundLimit: state.rules.roundLimit, roundsPerEra: state.rules.roundsPerEra, actionsPerRound: state.rules.actionsPerRound ?? 5, players: seatIds.length,
      roundsPlayed: winner.round, endReason: winner.reason, finishedAt: context.finishedAt ?? null,
      version: { content: context.contentVersion ?? null, rules: state.rulesVersion, engine: state.alphaVersion, app: context.appVersion ?? null },
      economyFingerprint: fingerprint, configKey,
    },
    seats,
    result: { winner: winner.playerId, ranking, hegemony, prestige },
    civilizations, economy: { rounds, perSeat: economySeats, globalProduction: { ...telemetry.productionByResource } }, actions, conflicts, timeline: kept,
    coverage: { roundsExpected, roundsRecorded: rounds.length, truncated }, quality,
  };
  return MatchReportV1Schema.parse(report);
}

/** Strips nothing and adds nothing: the report is already free of private data. Kept as the single serialization point for exports. */
export const matchReportToJson = (report: MatchReportV1): string => JSON.stringify(report, null, 2) + '\n';

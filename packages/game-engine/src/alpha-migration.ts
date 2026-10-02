import { z } from 'zod';
import {
  AlphaStateSchema, GameStateSchema, WORLD_PULSE_CARDS, leaderStateFor, alphaBalance, alphaRules, alphaUnitCatalog, cityLevelForPopulation,
  emptyAlphaResourcePool, legacyToAlphaResources,
  type AlphaCity, type AlphaError, type AlphaState, type AlphaTelemetry, type GameState,
} from '@aoh/game-domain';
import { err, ok, type Result } from '@aoh/shared';
import { hexDistance } from './hex.js';
import { deterministicAlphaSeed } from './alpha-random.js';

function initialCities(core: GameState, civilizationByPlayer: Map<string, string | null>): AlphaCity[] {
  return core.players.flatMap(player => player.civilization.cities.map(city => ({
    cityId: city.id,
    originalOwnerId: player.id,
    currentOwnerId: player.id,
    nativeIdentity: civilizationByPlayer.get(player.id) ?? `native-${player.id}`,
    status: 'OWNED' as const,
    integration: 100,
    mood: 3,
    level: cityLevelForPopulation(city.population),
    capital: player.civilization.capitalCityId === city.id,
    districts: city.districts.map(district => district.type),
    buildings: [],
    fortification: { level: 'NONE' as const, state: 'INTACT' as const },
    foreignPresence: [],
    localCohesion: 50,
    culturalAnchor: null,
    urbanActionsUsed: 0,
  })));
}

function initialTelemetry(core: GameState, preset: AlphaState['rules']['worldPreset']): AlphaTelemetry {
  return {
    version: '0.1.0-alpha.1', preset, seed: core.seed, players: core.players.length, rounds: core.round, durationMs: 0,
    actionsByType: {}, productionByResource: emptyAlphaResourcePool(), tradeOffers: 0, acceptedTrades: 0,
    unitRecruitment: {}, battles: 0, battleResults: {}, casualties: 0, citiesFounded: 0, citiesCaptured: 0,
    cityIntegration: 0, moodSamples: [], researchByDomain: {}, worldPulseEvents: 0, eventMitigations: 0,
    culturalContests: 0, culturalContestResults: {}, prestigeBySource: {}, hegemonyDeclarations: 0,
    hegemonyInterruptions: 0, winner: null, victoryReason: null,
  };
}

/** Explicit opt-in conversion. Caller preserves original v3 snapshot for rollback. */
export function migrateSnapshotV3ToV5(input: unknown): Result<AlphaState, AlphaError> {
  const old = GameStateSchema.safeParse(input);
  if (!old.success) return err({ code: 'INVALID_STATE', message: 'Snapshot v3 inválido; o original não foi alterado.' });
  if (old.data.status !== 'ACTIVE' || old.data.phase !== 'MAINTENANCE' || Object.values(old.data.pendingOrders).some(orders => orders.length)) {
    return err({ code: 'MIGRATION_BOUNDARY', message: 'Converta uma partida ativa em Manutenção, sem ordens pendentes.' });
  }
  const core = old.data;
  const rules = alphaRules();
  const players = core.players.map(player => ({
    playerId: player.id, civilization: null, era: 'FOUNDATION' as const, resources: legacyToAlphaResources(player.resources), legacyCulturalTrack: 0,
    spentCommands: 0, ready: false, prestige: 0, research: [], hand: [], ambitions: [], completedAmbitions: [], advisors: [], orders: [],
    victories: 0, exploredRegions: 0, foreignInfluence: 0, contacts: [], abilityRound: 0, hegemony: null, influencedCities: [],
    ambitionsChosen: true, cardsPlayed: 0, temporaryEffects: [],
    knownHexIds: core.map.filter(tile => tile.ownerId === player.id || player.civilization.cities.some(city => {
      const center = core.map.find(candidate => candidate.id === city.hexId);
      return center && hexDistance(center, tile) <= 1;
    })).map(tile => tile.id),
  }));
  const civilizationByPlayer = new Map(players.map(player => [player.playerId, player.civilization]));
  const candidate = {
    schemaVersion: 5, alphaVersion: '0.1.0-alpha.1', gameId: core.gameId, version: 0, phase: 'WORLD_PULSE', core, rules,
    privateRng: { algorithm: 'hmac-sha256-counter-v1', seed: deterministicAlphaSeed(core.seed, core.gameId), counter: 0 },
    players, initiative: core.players.map(player => player.id), units: [], roads: [], regions: [], occupations: [], treaties: [], wars: [], routes: [], battles: [], winner: null,
    cards: { worldDeck: [], strategyDeck: [], ambitionDeck: [], advisorDeck: [], discarded: [], advisorMarket: [], worldEvent: null, worldEventRound: 0, worldResponded: [] },
    projects: [], cities: initialCities(core, civilizationByPlayer), tradeOffers: [], independents: [], raidBands: [],
    worldPulse: { deck: WORLD_PULSE_CARDS.map(card => card.id), discard: [], current: null, resolvedRound: 0 },
    telemetry: initialTelemetry(core, rules.worldPreset), roundReports: [],
    events: [{ id: 'migration-v5', round: core.round, type: 'MIGRATED', audience: null, message: 'Partida convertida explicitamente para o formato alpha v5.' }],
  };
  const result = AlphaStateSchema.safeParse(candidate);
  return result.success ? ok(result.data) : err({ code: 'INVALID_STATE', message: result.error.message });
}

const AlphaV4Shape = z.looseObject({ schemaVersion: z.literal(4), gameId: z.string(), version: z.number().int().nonnegative(), core: GameStateSchema, rules: z.looseObject({ preset: z.enum(['QUICK', 'STANDARD', 'EPIC']) }) });

/** Idempotent expand migration. Unknown or corrupt input remains untouched. */
export function migrateSnapshotV4ToV5(input: unknown): Result<AlphaState, AlphaError> {
  const already = AlphaStateSchema.safeParse(input);
  if (already.success) return ok(already.data);
  const old = AlphaV4Shape.safeParse(input);
  if (!old.success) return err({ code: 'INVALID_STATE', message: 'Snapshot alpha v4 inválido; o original não foi alterado.' });
  const raw = structuredClone(old.data) as Record<string, unknown> & { core: GameState; rules: Record<string, unknown>; players?: Array<Record<string, unknown>>; units?: Array<Record<string, unknown>>; occupations?: Array<Record<string, unknown>> };
  const timer = Number(raw.rules.planningSeconds ?? 0);
  const planningSeconds = [0, 180, 300, 480, 3600, 14400, 28800].includes(timer) ? timer : timer <= 900 ? 480 : 28800;
  const rules = { ...alphaRules(old.data.rules.preset), ...raw.rules, planningSeconds, worldPreset: 'MIXED', balance: alphaBalance(), units: alphaUnitCatalog(), milestones: alphaRules(old.data.rules.preset).milestones, combat: alphaRules(old.data.rules.preset).combat };
  const players: Array<Record<string, unknown>> = (raw.players ?? []).map(player => {
    const owner = raw.core.players.find(candidate => candidate.id === player.playerId);
    return { ...player, era: player.era === 'HEGEMONY' && !player.hegemony ? 'ASCENSION' : player.era, resources: owner ? legacyToAlphaResources(owner.resources) : emptyAlphaResourcePool(), legacyCulturalTrack: Number(player.foreignInfluence ?? 0), leader: leaderStateFor(typeof player.civilization === 'string' ? player.civilization : null) };
  });
  const civilizationByPlayer = new Map(players.map(player => [String(player.playerId), typeof player.civilization === 'string' ? player.civilization : null]));
  const cities = initialCities(raw.core, civilizationByPlayer);
  for (const occupation of raw.occupations ?? []) {
    const city = cities.find(candidate => candidate.cityId === occupation.cityId);
    if (city) { city.status = 'OCCUPIED'; city.integration = 0; city.originalOwnerId = String(occupation.previousOwnerId) as typeof city.originalOwnerId; city.currentOwnerId = String(occupation.occupierId) as typeof city.currentOwnerId; }
  }
  const phase = ({ MAINTENANCE: 'WORLD_PULSE', PLANNING: 'PLANNING', RESOLUTION: 'ORDERS_MOVEMENT', REACTION: 'CONFLICTS', END_ROUND: 'END_ROUND' } as const)[raw.core.phase];
  const candidate = {
    ...raw, schemaVersion: 5, alphaVersion: '0.1.0-alpha.1', phase, rules, players,
    units: (raw.units ?? []).map(unit => ({ ...unit, kind: unit.kind === 'SETTLER' ? 'PIONEER' : unit.kind })),
    cities, tradeOffers: [], independents: [], raidBands: [],
    worldPulse: { deck: WORLD_PULSE_CARDS.map(card => card.id), discard: [], current: null, resolvedRound: 0 },
    telemetry: initialTelemetry(raw.core, 'MIXED'),
  };
  const migrated = AlphaStateSchema.safeParse(candidate);
  return migrated.success ? ok(migrated.data) : err({ code: 'INVALID_STATE', message: migrated.error.message });
}

/** Compatibility name retained for existing callers; result now uses current v5 envelope. */
export const migrateSnapshotV3ToV4 = migrateSnapshotV3ToV5;

export function serializeAlphaState(state: AlphaState): string { return JSON.stringify(AlphaStateSchema.parse(state)); }
export function deserializeAlphaState(json: string): Result<AlphaState, AlphaError> {
  try {
    const input: unknown = JSON.parse(json);
    if (input && typeof input === 'object' && 'schemaVersion' in input && input.schemaVersion === 3) return err({ code: 'SNAPSHOT_MIGRATION_REQUIRED', message: 'Execute migrateSnapshotV3ToV5 explicitamente e preserve o original.' });
    if (input && typeof input === 'object' && 'schemaVersion' in input && input.schemaVersion === 4) return err({ code: 'SNAPSHOT_MIGRATION_REQUIRED', message: 'Execute migrateSnapshotV4ToV5 explicitamente e preserve o original.' });
    const parsed = AlphaStateSchema.safeParse(input);
    return parsed.success ? ok(parsed.data) : err({ code: 'INVALID_STATE', message: 'Snapshot alpha inválido ou versão não suportada.' });
  } catch { return err({ code: 'INVALID_STATE', message: 'Snapshot não contém JSON válido.' }); }
}

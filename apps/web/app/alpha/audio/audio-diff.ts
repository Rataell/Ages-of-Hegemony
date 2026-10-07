import type { AudioEvent } from './audio-events';

/** The slice of AlphaPlayerView the differ reads (structural, so tests need no server types). */
export type GameLike = {
  phase: string;
  view: { round: number };
  self: { era?: string; ready?: boolean; resonance?: { slots?: unknown[] }; pendingChoices?: unknown[]; orders?: unknown[]; plannedActions?: unknown[] };
  roundReports?: { resolution: { id: string; type: string }[] }[];
  events: { id: string; type: string }[];
  battles: { id: string; attackerId: string; defenderId: string; winnerId: string; losses: string[]; retreat: string | null; outcome?: string;
    attackerTactical: { face: string }[]; defenderTactical: { face: string }[]; fortification?: { before: { state: string }; after: { state: string } } | null }[];
  threats: { id: string; kind: string; status: string }[];
  worldPulse: { id: string } | null;
  worldEvent?: { id?: string } | null;
  players: { id: string }[];
  units: { id: string; ownerId: string; hexId: string }[];
  regions?: { id: string }[];
  cityStates?: { cityId: string }[];
};

export type AudioSnapshot = {
  eventIds: Set<string>; battleIds: Set<string>; threatIds: Set<string>; threatMarching: Set<string>; playerIds: Set<string>; cityIds: Set<string>;
  phase: string; era: string | undefined; round: number; resonance: number; worldPulseId: string | null; worldEventId: string | null;
  pending: number; planned: number; resolutionIds: Set<string>; ownUnitHex: Map<string, string>; regions: Set<string>; presence: Map<string, boolean>;
};
export type Presence = { id: string; connected: boolean }[];

export function snapshotOf(game: GameLike, selfId: string, presence: Presence = []): AudioSnapshot {
  return {
    eventIds: new Set(game.events.map(e => e.id)), battleIds: new Set(game.battles.map(b => b.id)),
    threatIds: new Set(game.threats.map(t => t.id)), threatMarching: new Set(game.threats.filter(t => t.status === 'MARCHING').map(t => t.id)),
    playerIds: new Set(game.players.map(p => p.id)), cityIds: new Set((game.cityStates ?? []).map(c => c.cityId)),
    phase: game.phase, era: game.self.era, round: game.view.round, resonance: game.self.resonance?.slots?.length ?? 0,
    worldPulseId: game.worldPulse?.id ?? null, worldEventId: game.worldEvent?.id ?? null, pending: game.self.pendingChoices?.length ?? 0, planned: (game.self.orders?.length ?? 0) + (game.self.plannedActions?.length ?? 0),
    resolutionIds: new Set((game.roundReports ?? []).flatMap(r => r.resolution.map(e => e.id))),
    ownUnitHex: new Map(game.units.filter(u => u.ownerId === selfId).map(u => [u.id, u.hexId])),
    regions: new Set((game.regions ?? []).map(r => r.id)), presence: new Map(presence.map(p => [p.id, p.connected])),
  };
}

/** Engine event type -> semantic sound. Types not listed stay silent. */
const EVENT_MAP: Record<string, AudioEvent> = {
  REGION_REVEALED: 'REGION_REVEALED', CITY_FOUNDED: 'CITY_FOUNDED', LEGACY_WORK_COMPLETED: 'BUILD_DONE', ROAD_BUILT: 'BUILD_DONE',
  REPERCUSSION: 'REPERCUSSION', ERA_ADVANCED: 'ERA_CHANGED', WORLD_PULSE: 'WORLD_PULSE', DISCOVERY: 'ENCOUNTER',
  THREAT_SPAWNED: 'CAMP_SPAWNED', THREAT_MARCHING: 'RAID_ACTIVE', THREAT_ASSAULT: 'RAID_ACTIVE', THREAT_PILLAGE: 'RAID_ACTIVE', THREAT_AMBUSH: 'RAID_ACTIVE',
  THREAT_BATTLE: 'BATTLE_START', THREAT_DESTROYED: 'BUILD_DONE', HEGEMONY_DECLARED: 'WORLD_EVENT', WAR_DECLARED: 'WORLD_EVENT', CULTURAL_CONTEST: 'WORLD_EVENT',
  FOOD_SHORTAGE: 'WORLD_EVENT', UPKEEP_SHORTAGE: 'WORLD_EVENT', PORT_BLOCKED: 'WORLD_EVENT', DEMOBILIZED: 'RETREAT', ORDER_FAILED: 'UI_SELECT',
};
/** Round-report resolution types (what the table resolved this round) -> sound, for what the engine's event feed does not carry. */
const RESOLUTION_MAP: Record<string, AudioEvent> = { CONSTRUCTION: 'BUILD_DONE', RECRUITMENT: 'BUILD_DONE', RESEARCH: 'RESEARCH_DONE', MOVEMENT: 'UNIT_MOVED', EXPLORATION: 'REGION_REVEALED', DISCOVERY: 'REGION_REVEALED', FOUNDATION: 'CITY_FOUNDED' };
const FACE_EVENT: Record<string, AudioEvent> = { IMPACT: 'DICE_RESULT_IMPACT', GUARD: 'DICE_RESULT_GUARD', MANEUVER: 'DICE_RESULT_MANEUVER', COMMAND: 'DICE_RESULT_COMMAND', EMPTY: 'DICE_RESULT_EMPTY' };

/**
 * Diffs the new authoritative projection against what was already seen.
 * With no previous snapshot (first render, or a new game) nothing is emitted: history is never replayed.
 * Output is de-duplicated and ordered; the AudioManager scheduler then applies cooldown/priority.
 */
export function diffGame(prev: AudioSnapshot | null, game: GameLike, selfId: string, presence: Presence = []): { next: AudioSnapshot; events: AudioEvent[] } {
  const next = snapshotOf(game, selfId, presence);
  if (!prev) return { next, events: [] };
  const out: AudioEvent[] = [];
  const add = (e: AudioEvent) => { if (!out.includes(e)) out.push(e); };

  for (const event of game.events) if (!prev.eventIds.has(event.id) && EVENT_MAP[event.type]) add(EVENT_MAP[event.type]!);

  for (const report of game.roundReports ?? []) for (const event of report.resolution) if (!prev.resolutionIds.has(event.id) && RESOLUTION_MAP[event.type]) add(RESOLUTION_MAP[event.type]!);
  if (next.planned > prev.planned) add('ORDER_PLANNED');

  const fresh = game.battles.filter(b => !prev.battleIds.has(b.id));
  for (const battle of fresh) {
    add('BATTLE_START');
    const faces = [...battle.attackerTactical, ...battle.defenderTactical].map(r => r.face);
    if (faces.length) add('DICE_ROLL');
    if (faces.includes('IMPACT')) add('HIT');
    if (faces.includes('GUARD')) add('GUARD_BLOCK');
    if (battle.losses.length) add('UNIT_LOST');
    if (battle.retreat) add('RETREAT');
    if (battle.fortification && battle.fortification.before.state !== battle.fortification.after.state) add('HIT');
  }

  for (const threat of game.threats) {
    if (!prev.threatIds.has(threat.id)) add(threat.kind === 'PIRATE' ? 'PIRATE_ACTIVE' : 'CAMP_SPAWNED');
    else if (threat.status === 'MARCHING' && !prev.threatMarching.has(threat.id)) add(threat.kind === 'PIRATE' ? 'PIRATE_ACTIVE' : 'RAID_ACTIVE');
  }

  let moved = false;
  for (const unit of game.units) if (unit.ownerId === selfId && prev.ownUnitHex.has(unit.id) && prev.ownUnitHex.get(unit.id) !== unit.hexId) moved = true;
  if (moved) add('UNIT_MOVED');

  if ((game.regions ?? []).some(r => !prev.regions.has(r.id))) add('REGION_REVEALED');
  if (next.resonance > prev.resonance) add('RESONANCE_FILLED');
  if (next.era && prev.era && next.era !== prev.era) add('ERA_CHANGED');
  if (next.worldPulseId && next.worldPulseId !== prev.worldPulseId) add('WORLD_PULSE');
  if (next.worldEventId && next.worldEventId !== prev.worldEventId) add('WORLD_EVENT');
  if (next.pending > prev.pending) add('ENCOUNTER');
  if (game.cityStates && prev.cityIds.size && game.cityStates.some(c => !prev.cityIds.has(c.cityId)) && !out.includes('CITY_FOUNDED')) add('CITY_CAPTURED');
  if (game.players.some(p => !prev.playerIds.has(p.id))) add('PLAYER_JOINED');
  for (const [id, connected] of next.presence) if (connected && prev.presence.get(id) === false) add('PLAYER_RECONNECTED');
  if (prev.phase === 'PLANNING' && next.phase !== 'PLANNING') add('PLAN_CONFIRMED');
  if (prev.phase !== 'PLANNING' && next.phase === 'PLANNING' && next.round > prev.round) add('ORDER_RESOLVED');
  return { next, events: out };
}

/** Faces of one battle in the order a viewer reads them (attacker first); used to chime per-face when a roll lands. */
export const faceEvent = (face: string): AudioEvent => FACE_EVENT[face] ?? 'DICE_RESULT_EMPTY';

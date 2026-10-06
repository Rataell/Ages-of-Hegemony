import type { AlphaState, PlayerId } from '@aoh/game-domain';
import { regionOpenFor, threatView, visibleHexIds } from '@aoh/game-engine';

/**
 * What a bot is allowed to know: exactly what a human in that seat could be sent. The real match state is NEVER handed to the bot policy; it gets this
 * seat-redacted copy (same shape, so the engine's own read helpers keep working), built from the same visibility rules as the player projection
 * (alpha-projection.ts): tiles, cities, pieces, threats and peoples outside the seat's sight are gone or masked; rivals' hand, Ambições, Orders,
 * plans, resources, research, posture, casualty list and pending choices are blank; decks and the future RNG are empty.
 * Commands the bot derives from it go back to the real engine, which validates them like any human command.
 */
const ZERO_POOL = (pool: Record<string, number>) => Object.fromEntries(Object.keys(pool).map(key => [key, 0]));

export function redactStateForSeat(real: AlphaState, seat: PlayerId): AlphaState {
  const state = structuredClone(real) as AlphaState;
  const visible = visibleHexIds(real, seat);

  // Map: what is not in sight is unknown terrain with no owner, as on the client.
  state.core.map = state.core.map.map(tile => visible.has(tile.id) ? tile : { ...tile, terrain: 'UNKNOWN', features: [], ownerId: null, controllerCityId: null, improvement: null });

  // Rival civilizations: only cities standing in sight survive; their purse and city interior are blank.
  const hiddenCityIds = new Set<string>();
  for (const owner of state.core.players) {
    if (owner.id === seat) continue;
    owner.civilization.cities = owner.civilization.cities.filter(city => { const seen = visible.has(city.hexId); if (!seen) hiddenCityIds.add(city.id); return seen; });
    for (const city of owner.civilization.cities) { city.population = 1; city.stability = 0; }
    if ('resources' in owner) (owner as unknown as { resources: Record<string, number> }).resources = ZERO_POOL((owner as unknown as { resources: Record<string, number> }).resources);
  }
  state.cities = state.cities.filter(meta => !hiddenCityIds.has(meta.cityId)).map(meta => meta.currentOwnerId === seat ? meta : { ...meta, mood: 3, integration: 0 });
  state.core.eventLog = state.core.eventLog.filter(entry => 'playerId' in entry && entry.playerId === seat) as never;

  // Rivals' private progress.
  for (const progress of state.players) {
    if (progress.playerId === seat) continue;
    progress.hand = []; progress.ambitions = []; progress.completedAmbitions = []; progress.advisors = [];
    progress.orders = []; progress.plannedActions = []; progress.pendingChoices = [];
    progress.research = []; progress.knownHexIds = []; progress.temporaryEffects = []; progress.civilizationCardsPlayed = [];
    progress.defensePosture = 'HOLD'; progress.casualtyPriority = { order: [], byHex: {} }; progress.leader = null;
    progress.resources = ZERO_POOL(progress.resources) as never;
  }

  // The table: only pieces in sight (own always), no cargo of rival fleets; threats and peoples in sight; battles the seat fought or saw.
  state.units = state.units.filter(unit => unit.ownerId === seat || (visible.has(unit.hexId) && !unit.carrierId));
  const seenThreats = new Set(threatView(real, seat).map(t => t.id));
  state.threats = state.threats.filter(threat => seenThreats.has(threat.id));
  state.independents = state.independents.filter(people => visible.has(people.hexId));
  state.roads = state.roads.filter(id => visible.has(id));
  state.battles = state.battles.filter(b => b.attackerId === seat || b.defenderId === seat || visible.has(b.hexId));
  state.treaties = state.treaties.filter(t => t.proposerId === seat || t.recipientId === seat);
  state.tradeOffers = state.tradeOffers.filter(o => o.proposerId === seat || o.recipientId === seat);
  state.routes = state.routes.filter(r => r.ownerId === seat);
  state.occupations = state.occupations.filter(o => o.occupierId === seat || o.previousOwnerId === seat);
  state.events = state.events.filter(e => e.audience === null || e.audience.includes(seat));
  state.roundReports = state.roundReports.filter(r => r.playerId === seat);
  state.resolutionEvents = state.resolutionEvents.filter(e => e.actorId === null || e.actorId === seat);
  state.roundLedgers = [];

  // Regions still closed for this seat keep their public footprint but nothing of what lies inside.
  state.regions = state.regions.map(region => regionOpenFor(real, region, seat) ? (region.discovery && !region.revealedBy.includes(seat) ? { ...region, discovery: undefined } : region) : { ...region, templateId: 'hidden', rotation: 0, discovery: undefined });

  // Decks and the future are not part of anyone's knowledge.
  state.cards = { ...state.cards, worldDeck: [], strategyDeck: [], ambitionDeck: [], advisorDeck: [], discarded: [] };
  state.worldPulse = { ...state.worldPulse, deck: [], discard: [] };
  state.privateRng = { ...state.privateRng, seed: '0'.repeat(64), counter: 0 };
  return state;
}

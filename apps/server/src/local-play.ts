import { randomUUID } from 'node:crypto';
import { GameIdSchema, PlayerIdSchema, type GameState, type GameCommand, type ResourcePool } from '@aoh/game-domain';
import { applyCommand, nextPhase, hexDistance, tileYieldBreakdown, deriveCityProductionBreakdown, stabilityCategory } from '@aoh/game-engine';
import { GameService, playerView } from './game-service.js';
import { InMemoryGameRepository } from './repository.js';
import { localScenario } from './local-maps.js';

export type LocalAction = { command: GameCommand; available: boolean; reason: string | null; cost: ResourcePool | null; yieldAfter: ReturnType<typeof tileYieldBreakdown>['total'] | null };
function preview(state: GameState, command: GameCommand): LocalAction {
  const result = applyCommand(state, command);
  const event = result.ok ? result.value.eventLog.at(-1) : null;
  let cost: ResourcePool | null = event && 'cost' in event ? event.cost : null;
  const rules = state.config;
  if (command.type === 'CLAIM_HEX') cost = rules.territory.claimCost;
  if (command.type === 'FOUND_CITY') cost = rules.territory.foundingCost;
  if (command.type === 'IMPROVE_HEX') cost = rules.territory.improvementCatalog[command.improvement].cost;
  if (command.type === 'BUILD_DISTRICT') cost = rules.territory.districts[command.district].cost;
  if (command.type === 'BUILD_BUILDING') cost = rules.territory.buildings[command.building].cost;
  if (command.type === 'DEVELOP_CITY') {
    const city = state.players.find(p => p.id === command.playerId)?.civilization.cities.find(c => c.id === command.cityId);
    cost = city ? rules.developmentCosts[city.development - 1] ?? null : null;
  }
  const tile = result.ok && command.type === 'IMPROVE_HEX' ? result.value.map.find(t => t.id === command.hexId) : null;
  return { command, available: result.ok, reason: result.ok ? null : `${result.error.code}: ${result.error.message}`, cost, yieldAfter: tile ? tileYieldBreakdown(tile, rules).total : null };
}

// Local Development Gameplay Session, not authentication or multiplayer transport.
export class LocalPlay {
  private readonly repository = new InMemoryGameRepository();
  private readonly service = new GameService(this.repository);
  private readonly sessions = new Map<string, { gameId: ReturnType<typeof GameIdSchema.parse>; playerId: ReturnType<typeof PlayerIdSchema.parse> }>();
  async start(count: number) {
    if (!Number.isInteger(count) || count < 2 || count > 6) throw new Error('Escolha entre 2 e 6 jogadores.');
    const token = randomUUID(); const gameId = GameIdSchema.parse(randomUUID());
    const result = await this.service.create(localScenario(gameId, count));
    if (!result.ok) throw new Error(result.error.message);
    this.sessions.set(token, { gameId, playerId: PlayerIdSchema.parse('player-1') });
    return token;
  }
  private session(token: string) {
    const session = this.sessions.get(token);
    if (!session) throw new Error('Sessão temporária encerrada. Inicie uma nova partida.');
    return session;
  }
  async perspective(token: string, playerId: string) {
    const session = this.session(token); const state = await this.repository.find(session.gameId);
    const player = state?.players.find(p => p.id === playerId);
    if (!player) throw new Error('Perspectiva inválida.');
    session.playerId = player.id;
  }
  async command(token: string, command: unknown) {
    const session = this.session(token);
    return this.service.submit(session.gameId, { playerId: session.playerId }, command);
  }
  async advance(token: string, expectedVersion: number) {
    const session = this.session(token); const state = await this.repository.find(session.gameId);
    if (!state) throw new Error('Partida indisponível.');
    const result = await this.service.advance(session.gameId, nextPhase(state.phase), expectedVersion);
    // Never return authoritative state from this development scheduler capability.
    return result.ok ? { ok: true as const } : result;
  }
  async view(token: string, cityId?: string, hexId?: string) {
    const session = this.session(token); const state = await this.repository.find(session.gameId);
    if (!state) throw new Error('Partida indisponível.');
    // Public map is intentionally revealed in this fixture. Opponent private data stays excluded.
    const view = playerView(state, session.playerId, { visibleHexIds: state.map.map(t => t.id), visibleCityIds: state.players.flatMap(p => p.civilization.cities.map(c => c.id)), knownGovernmentPlayerIds: [] });
    if (!view) throw new Error('Perspectiva indisponível.');
    const city = view.player.civilization.cities.find(c => c.id === cityId) ?? view.player.civilization.cities[0];
    const tile = state.map.find(t => t.id === hexId);
    const base = { playerId: session.playerId, expectedVersion: state.version };
    const actions: LocalAction[] = [];
    const add = (command: GameCommand) => actions.push(preview(state, command));
    for (const government of ['MONARCHY', 'REPUBLIC', 'OLIGARCHY', 'THEOCRACY', 'CONFEDERATION'] as const) add({ ...base, type: 'ADOPT_GOVERNMENT', government });
    if (city) {
      add({ ...base, type: 'DEVELOP_CITY', cityId: city.id });
      for (const district of ['AGRARIAN', 'COMMERCIAL', 'ACADEMIC', 'ADMINISTRATIVE', 'MILITARY', 'INDUSTRIAL', 'CULTURAL'] as const) {
        add({ ...base, type: 'BUILD_DISTRICT', cityId: city.id, district });
        add({ ...base, type: 'SPECIALIZE_CITY', cityId: city.id, specialization: district });
      }
      for (const building of ['GRANARY', 'MARKET', 'LIBRARY', 'ARCHIVE', 'BARRACKS', 'WORKSHOP', 'CULTURAL_CENTER'] as const) add({ ...base, type: 'BUILD_BUILDING', cityId: city.id, building });
      if (tile) add({ ...base, type: 'CLAIM_HEX', cityId: city.id, hexId: tile.id });
    }
    if (tile) {
      add({ ...base, type: 'FOUND_CITY', cityId: `city-${state.version}` as NonNullable<typeof city>['id'], hexId: tile.id, name: 'Fronteira' });
      for (const improvement of ['FARM', 'LUMBER_CAMP', 'QUARRY', 'MINE', 'FISHERY'] as const) add({ ...base, type: 'IMPROVE_HEX', hexId: tile.id, improvement });
    }
    const center = state.map.find(t => t.id === city?.hexId);
    const claimable: string[] = []; const workable: string[] = [];
    if (city && center) for (const hex of state.map) {
      if (hexDistance(center, hex) > (state.config.territory.cityRadii[city.development - 1] ?? 0)) continue;
      if (hex.ownerId === null && preview(state, { ...base, type: 'CLAIM_HEX', cityId: city.id, hexId: hex.id }).available) claimable.push(hex.id);
      if (hex.ownerId === session.playerId && preview(state, { ...base, type: 'ASSIGN_WORKED_HEXES', cityId: city.id, hexIds: [hex.id] }).available) workable.push(hex.id);
    }
    return { view, actions, claimable, workable, selectedCityId: city?.id ?? null,
      distance: tile && center ? hexDistance(center, tile) : null,
      players: state.players.map(p => ({ id: p.id, name: p.name })),
      cities: view.player.civilization.cities.map(c => ({ id: c.id,
        category: stabilityCategory(c.stability, state.config),
        production: deriveCityProductionBreakdown(c, view.player.civilization, state.config, state.map) })),
      events: state.eventLog.filter(e => 'playerId' in e && e.playerId === session.playerId).slice(-60),
    };
  }
}
export type LocalView = Awaited<ReturnType<LocalPlay['view']>>;

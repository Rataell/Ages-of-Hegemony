import type { AlphaCommand, AlphaState, PlayerId } from '@aoh/game-domain';
import { PlayerIdSchema } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';
import { completeRound } from './alpha-rounds.js';

/**
 * Shared helpers of the V1.2 lane A2+D urban audit (tests/v12-audit-urban-*.test.ts). READ-ONLY over the engine: every scenario edits a
 * COPY of a fresh state the way the existing suites do (tests/alpha-administration.test.ts) and only talks to the engine through
 * applyAlphaCommand, the same surface a player has.
 */
export const P1 = PlayerIdSchema.parse('p1');
export const P2 = PlayerIdSchema.parse('p2');
export type Plan = Record<string, unknown>;

/** A QUICK two-seat match at PLANNING of round 1, ambitions chosen. Seed 9 is the seed tests/alpha-administration.test.ts already uses. */
export function freshGame(civilization = 'valgard'): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'v12-urban', seed: 9, preset: 'QUICK', players: [{ id: 'p1', name: 'Ana', civilization }, { id: 'p2', name: 'Beto', civilization: civilization === 'thalos' ? 'kor' : 'thalos' }] }));
  for (const player of state.players) player.ambitionsChosen = true;
  return state;
}
export const meta = (state: AlphaState, actor: PlayerId = P1) => state.cities.find(city => city.currentOwnerId === actor)!;
export const coreCity = (state: AlphaState, actor: PlayerId = P1) => state.core.players.find(player => player.id === actor)!.civilization.cities[0]!;
export const seat = (state: AlphaState, actor: PlayerId = P1) => state.players.find(player => player.playerId === actor)!;

/** Sets the capital to a built level with matching population and roles (sum of roles must equal the population). */
export function shape(state: AlphaState, level: AlphaState['cities'][number]['level'], population: number, workers: Partial<ReturnType<typeof coreCity>['workers']>): void {
  const city = coreCity(state);
  meta(state).level = level;
  city.population = population;
  city.workers = { producers: 0, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned: 0, ...workers };
  if (Object.values(city.workers).reduce((a, b) => a + b, 0) !== population) throw new Error('roles must add up to the population');
}

export function apply(state: AlphaState, command: Plan, actor: PlayerId = P1) {
  return applyAlphaCommand(state, actor, { ...command, expectedVersion: state.version } as AlphaCommand);
}
export const urban = (cityId: string, action: string, extra: Plan = {}): Plan => ({ type: 'URBAN_ACTION', cityId, action, ...extra });

export interface Outcome {
  /** Plans the engine accepted while planning, in order. */
  accepted: Plan[];
  /** Plans (or free actions) it refused while planning, with the reason. */
  refused: { command: Plan; message: string }[];
  /** `ACTION_FAILED` events of the acting seat in the resolution of that round: plans accepted earlier that no longer held. */
  failures: string[];
  /** The state at the opening of the next round. */
  after: AlphaState;
}
/**
 * Plans `commands` in order (refusals are recorded, not thrown), confirms both seats (the other seat does nothing) and returns what
 * resolution did. `failures` is the proof of a planning acceptance that became invalid: the canon of the Orders says an accepted plan
 * is a reserved Order, so a correct planner either refuses it up front or the resolver honours it.
 */
export function plan(state: AlphaState, commands: Plan[]): Outcome {
  // Scenarios edit stocks by hand; the round ledger records opening balances at creation, so it is rebuilt lazily from the edited stocks.
  let current = { ...state, roundLedgers: [] } as AlphaState;
  const accepted: Plan[] = [], refused: Outcome['refused'] = [];
  for (const command of commands) {
    const result = apply(current, command);
    if (result.ok) { current = result.value; accepted.push(command); } else refused.push({ command, message: result.error.message });
  }
  const round = current.core.round;
  const after = completeRound(current);
  const failures = after.events.filter(event => event.round === round && event.type === 'ACTION_FAILED' && (event.audience ?? []).includes(P1)).map(event => event.message);
  return { accepted, refused, failures, after };
}

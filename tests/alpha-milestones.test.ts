import { describe, expect, it } from 'vitest';
import { ADVANCEMENTS, ALPHA_ERA_MILESTONES, AlphaEraSchema, alphaRules, type AlphaEra, type AlphaState } from '@aoh/game-domain';
import { advanceEra, beginAlphaPlanning, createAlphaGame, eraMilestones } from '@aoh/game-engine';

type Progress = { cities: number; population: number; territory: number; districts: number; research: number; development: number; contacts: number; government: boolean };
const none: Progress = { cities: 1, population: 0, territory: 0, districts: 0, research: 0, development: 0, contacts: 0, government: false };

function setup() { return beginAlphaPlanning(createAlphaGame({ gameId: 'milestones-alpha', seed: 31, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] })); }

/** Forces exact progress values on the first player without going through commands. */
function shape(state: AlphaState, era: AlphaEra, progress: Partial<Progress>): AlphaState {
  const target = { ...none, ...progress };
  const player = state.players[0]!, core = state.core.players[0]!;
  const template = core.civilization.cities[0]!;
  while (core.civilization.cities.length < target.cities) core.civilization.cities.push({ ...structuredClone(template), id: `extra-${core.civilization.cities.length}` as typeof template.id });
  core.civilization.cities.length = target.cities;
  const first = core.civilization.cities[0];
  for (const city of core.civilization.cities) { city.population = 0; city.development = 0; city.districts = []; }
  first!.population = target.population; first!.development = target.development;
  first!.districts = Array.from({ length: target.districts }, () => structuredClone(template.districts[0] ?? { type: 'AGRARIAN' })) as never;
  state.core.map.forEach(tile => { if (tile.ownerId === player.playerId) tile.ownerId = null; });
  state.core.map.slice(0, target.territory).forEach(tile => { tile.ownerId = player.playerId; });
  player.era = era;
  player.research = ADVANCEMENTS.slice(0, target.research).map(node => node.id);
  player.contacts = Array.from({ length: target.contacts }, () => state.players[1]!.playerId);
  core.civilization.government = target.government ? 'MONARCHY' : 'PROTO_GOVERNANCE';
  return state;
}
const meets = (row: number): Progress => {
  const m = ALPHA_ERA_MILESTONES[row]!;
  return { cities: m.cities, population: m.population, territory: m.territory, districts: m.districts, research: m.research, development: m.development, contacts: m.contacts, government: m.government };
};

describe('alpha era milestones', () => {
  it('keeps the thresholds in one central table used by the rules', () => {
    expect(ALPHA_ERA_MILESTONES).toHaveLength(5);
    expect(alphaRules('STANDARD').milestones).toEqual(ALPHA_ERA_MILESTONES);
    expect(alphaRules('QUICK').milestones).toEqual(alphaRules('EPIC').milestones);
    expect(ALPHA_ERA_MILESTONES.map(m => m.requiredCriteria)).toEqual([4, 4, 5, 5, 5]);
  });

  it('places Hegemony as the sixth and final era', () => {
    expect(AlphaEraSchema.options).toEqual(['FOUNDATION', 'EXPANSION', 'CIVILIZATION', 'EMPIRES', 'ASCENSION', 'HEGEMONY']);
    expect(AlphaEraSchema.options.indexOf('HEGEMONY')).toBe(5);
    const state = shape(setup(), 'ASCENSION', meets(4));
    advanceEra(state, state.players[0]!.playerId);
    expect(state.players[0]!.era).toBe('HEGEMONY');
    expect(eraMilestones(state, state.players[0]!.playerId).next).toBeNull();
    expect(() => advanceEra(state, state.players[0]!.playerId)).toThrow('Ascensão');
  });

  it('lets a specialised player advance without meeting every criterion', () => {
    // CIVILIZATION -> EMPIRES needs 5 of 8: meet cities, territory, districts, contacts and government (a builder/explorer path) and miss the rest.
    const state = shape(setup(), 'CIVILIZATION', { ...meets(2), population: 0, research: 0, development: 0 });
    const progress = eraMilestones(state, state.players[0]!.playerId);
    expect(progress.satisfied).toBeLessThan(progress.total);
    expect(progress.satisfied).toBe(5);
    expect(progress.canAdvance).toBe(true);
    advanceEra(state, state.players[0]!.playerId);
    expect(state.players[0]!.era).toBe('EMPIRES');
  });

  it('advances exactly at the threshold and refuses one criterion below it', () => {
    const at = shape(setup(), 'EMPIRES', { ...meets(3), population: 0, research: 0, development: 0 });
    expect(eraMilestones(at, at.players[0]!.playerId)).toMatchObject({ satisfied: 5, needed: 5, canAdvance: true });
    advanceEra(at, at.players[0]!.playerId);
    expect(at.players[0]!.era).toBe('ASCENSION');

    const below = shape(setup(), 'EMPIRES', { ...meets(3), population: 0, research: 0, development: 0, contacts: 0 });
    const result = eraMilestones(below, below.players[0]!.playerId);
    expect(result).toMatchObject({ satisfied: 4, needed: 5, canAdvance: false });
    expect(() => advanceEra(below, below.players[0]!.playerId)).toThrow('4 cumpridos');
    expect(below.players[0]!.era).toBe('EMPIRES');
  });

  it('does not require the government criterion for the first step', () => {
    const state = shape(setup(), 'FOUNDATION', { ...meets(0), government: false });
    const progress = eraMilestones(state, state.players[0]!.playerId);
    expect(progress.total).toBe(7);
    expect(progress.criteria.some(c => c.key === 'government')).toBe(false);
    expect(progress).toMatchObject({ needed: 4, canAdvance: true });
    advanceEra(state, state.players[0]!.playerId);
    expect(state.players[0]!.era).toBe('EXPANSION');
  });

  it('never skips an era, even with every later criterion met', () => {
    const state = shape(setup(), 'FOUNDATION', meets(4));
    advanceEra(state, state.players[0]!.playerId);
    expect(state.players[0]!.era).toBe('EXPANSION');
    expect(eraMilestones(state, state.players[0]!.playerId).next).toBe('CIVILIZATION');
  });

  it('reports met, missing and required criteria', () => {
    const state = shape(setup(), 'CIVILIZATION', { cities: 2, territory: 7, districts: 3, government: true, contacts: 1, population: 1, research: 1 });
    const progress = eraMilestones(state, state.players[0]!.playerId);
    expect(progress.total).toBe(8);
    expect(progress.needed).toBe(5);
    expect(progress.criteria.filter(c => c.met).map(c => c.key).sort()).toEqual(['cities', 'contacts', 'districts', 'government', 'territory'].sort());
    expect(progress.missing.sort()).toEqual(['development', 'population', 'research']);
    expect(progress.criteria.find(c => c.key === 'population')).toEqual({ key: 'population', current: 1, minimum: 7, met: false });
    expect(progress.canAdvance).toBe(true);
  });
});

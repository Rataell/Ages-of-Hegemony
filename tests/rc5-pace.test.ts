import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AlphaRulesSchema, AlphaStateSchema, CITY_LADDER, CIVILIZATIONS, ELEVATE_TABLE, STANDARD_CITY_THRESHOLDS, cityLevelForPopulation, cityThresholds, elevateRequirement, populationCeiling, type AlphaState, type CityPace } from '@aoh/game-domain';
import { beginAlphaPlanning, buildMatchReport, canGrow, createAlphaGame, districtSlots, economyFingerprint, elevateBlock } from '@aoh/game-engine';
import { AlphaRoomSchema, CreateAlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { encodeRoom } from '../apps/server/src/alpha-prisma-repository.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { completeRound } from './alpha-rounds.js';
import { grant } from './alpha-grant.js';

/**
 * RC5 · experimental pace for short matches (M1 + M4 15%): selectable at creation, persisted with the table, identified in the report; STANDARD stays exactly as before and 35/49-round
 * matches and matches already started are never affected.
 */
const game = (pace: CityPace, seed = 5, civilization = 'valgard'): AlphaState => beginAlphaPlanning(createAlphaGame({ gameId: `pace-${pace}-${seed}`, seed, preset: 'QUICK', pace, players: [{ id: 'p1', name: 'A', civilization }, { id: 'p2', name: 'B', civilization: civilization === 'aurelia' ? 'valgard' : 'aurelia' }] }));
const created = (pace: CityPace, seed = 5): AlphaState => createAlphaGame({ gameId: `pace-created-${pace}-${seed}`, seed, preset: 'QUICK', pace, players: [{ id: 'p1', name: 'A', civilization: 'valgard' }, { id: 'p2', name: 'B', civilization: 'aurelia' }] });
const capitalOf = (state: AlphaState, seat = 'p1') => { const owner = state.core.players.find(player => player.id === seat)!; return { core: owner.civilization.cities[0]!, meta: state.cities.find(city => city.cityId === owner.civilization.cities[0]!.id)! }; };

describe('the ladder of each pace', () => {
  it('STANDARD is the V5.1a ladder and the ladder table agrees; ACCELERATED asks about 15% fewer inhabitants (M4)', () => {
    expect([...cityThresholds('STANDARD')]).toEqual([2, 4, 6, 8, 11, 14, 18]);
    expect(CITY_LADDER.map(step => step.minPopulation)).toEqual([...STANDARD_CITY_THRESHOLDS]);
    expect([...cityThresholds('ACCELERATED')]).toEqual([2, 3, 5, 7, 9, 12, 15]);
    expect(cityThresholds()).toBe(cityThresholds('STANDARD'));
  });
  it('only the population minimum changes: cost, advances, Era, capacity and slots are the same', () => {
    for (const entry of ELEVATE_TABLE) {
      const fast = elevateRequirement(entry.to, 'ACCELERATED')!;
      expect({ ...fast, minPopulation: 0 }).toEqual({ ...entry, minPopulation: 0 });
      expect(fast.minPopulation).toBeLessThanOrEqual(entry.minPopulation);
      expect(elevateRequirement(entry.to)).toEqual(entry);                      // the default is untouched
    }
  });
  it('level by population, the growth ceiling and the default argument follow the pace', () => {
    expect(cityLevelForPopulation(5)).toBe('HAMLET'); expect(cityLevelForPopulation(5, 'ACCELERATED')).toBe('VILLAGE');
    expect(populationCeiling('HAMLET')).toBe(6); expect(populationCeiling('HAMLET', 'ACCELERATED')).toBe(5);
    expect(populationCeiling('IMPERIAL_METROPOLIS', 'ACCELERATED')).toBe(populationCeiling('IMPERIAL_METROPOLIS'));
  });
});

describe('the start of an ACCELERATED match (M1)', () => {
  it('every capital is a Povoado with 4 inhabitants (2 Produtores, 2 Eruditos), development 1 and Agricultura; stocks and pieces are unchanged', () => {
    const fast = game('ACCELERATED'), standard = game('STANDARD');
    expect(fast.rules.pace).toBe('ACCELERATED'); expect(standard.rules.pace).toBe('STANDARD');
    for (const seat of ['p1', 'p2']) {
      const { core, meta } = capitalOf(fast, seat), reference = capitalOf(standard, seat);
      expect(meta.level).toBe('HAMLET'); expect(core.population).toBe(4); expect(core.development).toBe(1);
      expect(core.workers).toEqual({ producers: 2, artisans: 0, merchants: 0, scholars: 2, soldiers: 0, unassigned: 0 });
      expect(fast.players.find(player => player.playerId === seat)!.research).toEqual(['web-agriculture']);
      expect(created('ACCELERATED').players.find(player => player.playerId === seat)!.resources).toEqual(created('STANDARD').players.find(player => player.playerId === seat)!.resources);   // starting stocks: the same
      expect(reference.meta.level).toBe('OUTPOST'); expect(reference.core.population).toBe(2);
      expect(standard.players.find(player => player.playerId === seat)!.research).toEqual([]);
    }
    expect(fast.units.map(unit => unit.kind).sort()).toEqual(standard.units.map(unit => unit.kind).sort());
    expect(AlphaStateSchema.safeParse(JSON.parse(JSON.stringify(fast))).success).toBe(true);
  });
  it('works for every playable civilization and plays on (a full round resolves)', () => {
    for (const civilization of CIVILIZATIONS.map(entry => entry.id)) {
      let state: AlphaState;
      try { state = game('ACCELERATED', 7, civilization); } catch { continue; }
      expect(capitalOf(state).meta.level).toBe('HAMLET');
      state = completeRound(state);
      expect(state.core.round).toBe(2);
    }
  });
  it('Elevar and Crescer use the pace of the match', () => {
    const fast = game('ACCELERATED'), standard = game('STANDARD');
    for (const state of [fast, standard]) { const { core } = capitalOf(state); core.population = 5; core.workers = { producers: 3, artisans: 0, merchants: 0, scholars: 2, soldiers: 0, unassigned: 0 }; grant(state, 'p1', 'web-masonry'); Object.assign(state.players[0]!.resources, { wood: 15, stone: 15 }); capitalOf(state).meta.level = 'HAMLET'; }
    expect(elevateBlock(fast, 'p1' as never, capitalOf(fast).core.id)).not.toMatch(/habitantes/);       // 5 inhabitants reach the accelerated Vila (5)
    expect(elevateBlock(standard, 'p1' as never, capitalOf(standard).core.id)).toBe('Elevar exige 6 habitantes (a cidade tem 5).');
    expect(canGrow(capitalOf(fast).meta, capitalOf(fast).core, 'ACCELERATED')).toBe(false);          // HAMLET ceiling 5 at 5 inhabitants
    expect(canGrow(capitalOf(standard).meta, capitalOf(standard).core)).toBe(true);
  });
  it('Federalização: the +1 slot from Vila up is by level, so it survives the lower accelerated minimum', () => {
    const fast = game('ACCELERATED'); grant(fast, 'p1', 'web-federalization');
    const { meta, core } = capitalOf(fast);
    meta.level = 'HAMLET'; core.population = 4;
    const hamlet = districtSlots(fast, core.id);
    meta.level = 'VILLAGE'; core.population = 5;                  // the accelerated Vila minimum (5) is below the standard one (6)
    expect(districtSlots(fast, core.id) - hamlet).toBe(2 - 1 + 1);    // one more slot from the ladder, plus the Federalização slot
  });
});

describe('saves and tables', () => {
  it('rules saved before RC5 read STANDARD (no migration), and the RC4 fixture still loads at the standard pace', () => {
    const state = AlphaStateSchema.parse(JSON.parse(readFileSync(new URL('./fixtures/rc4-midgame-state.json', import.meta.url), 'utf8')));
    expect(state.rules.pace).toBe('STANDARD');
    const raw = JSON.parse(JSON.stringify(game('STANDARD').rules)); delete raw.pace;
    expect(AlphaRulesSchema.parse(raw).pace).toBe('STANDARD');
  });
  it('a table asks for the accelerated pace only in short matches (never 35 or 49 rounds), and it is persisted', async () => {
    const base = { name: 'Mesa', displayName: 'Ana', seatLimit: 2, seed: 9, planningSeconds: 0 as const, worldPreset: 'MIXED', actionsPerRound: 5, revealMap: false };
    expect(CreateAlphaRoomSchema.safeParse({ ...base, preset: 'QUICK', pace: 'ACCELERATED' }).success).toBe(true);
    expect(CreateAlphaRoomSchema.safeParse({ ...base, preset: 'STANDARD', pace: 'ACCELERATED' }).success).toBe(false);
    expect(CreateAlphaRoomSchema.safeParse({ ...base, preset: 'EPIC', pace: 'ACCELERATED' }).success).toBe(false);
    expect(CreateAlphaRoomSchema.parse({ ...base, preset: 'QUICK' }).pace).toBe('STANDARD');         // the default keeps the previous pace
    const service = new AlphaGameService(new InMemoryAlphaRepository());
    const created = await service.create({ guestId: '11111111-1111-4111-8111-111111111111' } as never, { ...base, preset: 'QUICK', pace: 'ACCELERATED' });
    expect(created.ok && created.value.pace).toBe('ACCELERATED');
  });
  it('the stored room keeps the RC4 shape when nothing new is in use (reversible), and keeps `pace` only when it is accelerated', () => {
    const room = (pace: CityPace) => AlphaRoomSchema.parse({ id: pace === 'STANDARD' ? '00000000-0000-4000-8000-000000000001' : '00000000-0000-4000-8000-000000000002', version: 3, name: 'Mesa', joinCode: 'a'.repeat(22), hostGuestId: '11111111-1111-4111-8111-111111111111', preset: 'QUICK', worldPreset: 'MIXED', mapSize: 'STANDARD', seed: 4, seatLimit: 2, contentVersion: 'v1.2', actionsPerRound: 5, pace, planningSeconds: 0, deadline: null, game: null, seats: [{ guestId: '11111111-1111-4111-8111-111111111111', playerId: 'player-1', name: 'Ana', civilization: null, ready: false, figureId: null, bot: false, botPersona: null }] });
    const standard = encodeRoom(room('STANDARD')) as unknown as Record<string, unknown>, fast = encodeRoom(room('ACCELERATED')) as unknown as Record<string, unknown>;
    expect('pace' in standard).toBe(false); expect('report' in standard).toBe(false);
    expect(fast.pace).toBe('ACCELERATED'); expect('report' in fast).toBe(false);
    expect(AlphaRoomSchema.parse(standard).pace).toBe('STANDARD');        // the default restores it on read
  });
});

describe('the report identifies the pace and never mixes it with the standard economy', () => {
  const finished = (pace: CityPace) => { const state = game(pace, 11); state.rules.roundLimit = 2; return completeRound(completeRound(state)); };
  it('records the pace, and a different pace is a different fingerprint and configuration', () => {
    const fast = buildMatchReport(finished('ACCELERATED')), standard = buildMatchReport(finished('STANDARD'));
    expect(fast.match.pace).toBe('ACCELERATED'); expect(standard.match.pace).toBe('STANDARD');
    expect(fast.match.economyFingerprint).not.toBe(standard.match.economyFingerprint);
    expect(fast.match.configKey).not.toBe(standard.match.configKey);
    expect(economyFingerprint(game('STANDARD'))).toBe(economyFingerprint(game('STANDARD', 99)));   // the standard fingerprint does not depend on the seed
  });
});

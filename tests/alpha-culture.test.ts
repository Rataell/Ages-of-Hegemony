import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import {
  applyAlphaCommand, beginAlphaPlanning, contestPresence, createAlphaGame, culturalPresenceCount,
  establishCulturalPresence, hegemonyProgress, occupyCity,
} from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';

const ids = ['p1', 'p2', 'p3', 'p4', 'p5'].map(id => PlayerIdSchema.parse(id));

function setup(players = 3): AlphaState {
  return beginAlphaPlanning(createAlphaGame({
    gameId: `culture-${players}`, seed: 117, preset: 'STANDARD',
    players: ids.slice(0, players).map((id, index) => ({ id, name: `P${index + 1}` })),
  }));
}

const civilization = (state: AlphaState, index: number) => state.players[index]!.civilization!;
const city = (state: AlphaState, index: number) => state.cities.find(entry => entry.cityId === `capital-${index + 1}`)!;

describe('cultural presence', () => {
  it('establishes contact in one of exactly three foreign slots and derives compatibility counters', () => {
    const state = setup(5), target = city(state, 4);
    establishCulturalPresence(state, ids[0]!, target.cityId);
    establishCulturalPresence(state, ids[1]!, target.cityId);
    establishCulturalPresence(state, ids[2]!, target.cityId);
    expect(target.foreignPresence).toEqual([
      { civilizationId: civilization(state, 0), level: 'CONTACT' },
      { civilizationId: civilization(state, 1), level: 'CONTACT' },
      { civilizationId: civilization(state, 2), level: 'CONTACT' },
    ]);
    expect(state.players[0]!.influencedCities).toEqual([target.cityId]);
    expect(state.players[0]!.foreignInfluence).toBe(1);
    expect(() => establishCulturalPresence(state, ids[3]!, target.cityId)).toThrow('três espaços');
  });

  it('resolves two private dice per side deterministically and records every modifier and total', () => {
    const state = setup(), target = city(state, 2);
    establishCulturalPresence(state, ids[0]!, target.cityId);
    establishCulturalPresence(state, ids[1]!, target.cityId);
    target.foreignPresence.forEach(presence => { presence.level = 'ROOTED'; });
    const replay = structuredClone(state), counter = state.privateRng.counter;
    const command = { type: 'CONTEST_PRESENCE' as const, expectedVersion: state.version, cityId: target.cityId, defenderCivilizationId: civilization(state, 1) };
    const first = applyAlphaCommand(state, ids[0]!, command);
    const second = applyAlphaCommand(replay, ids[0]!, command);
    expect(first.ok).toBe(true); expect(second).toEqual(first);
    if (!first.ok) return;
    const record = first.value.cultureContests[0]!;
    expect(first.value.privateRng.counter - counter).toBe(4);
    expect(record.attackDice).toHaveLength(2); expect(record.defenseDice).toHaveLength(2);
    expect(record.attackTotal).toBe(record.attackDice[0] + record.attackDice[1] + record.attackModifier);
    expect(record.defenseTotal).toBe(record.defenseDice[0] + record.defenseDice[1] + record.defenseModifier);
    expect(first.value.telemetry.culturalContests).toBe(1);
    expect(first.value.players[0]!.spentCommands).toBe(1);
    expect(AlphaStateSchema.safeParse(first.value).success).toBe(true);
  });

  it('promotes the winner, bounds cohesion and keeps at most one predominant anchor', () => {
    const state = setup(), target = city(state, 2);
    establishCulturalPresence(state, ids[0]!, target.cityId);
    establishCulturalPresence(state, ids[1]!, target.cityId);
    target.foreignPresence.forEach(presence => { presence.level = 'ROOTED'; });
    target.localCohesion = 100;
    contestPresence(state, ids[0]!, { type: 'CONTEST_PRESENCE', expectedVersion: state.version, cityId: target.cityId, defenderCivilizationId: civilization(state, 1) });
    const winner = state.cultureContests[0]!.winnerCivilizationId;
    expect(target.culturalAnchor).toBe(winner);
    expect(target.foreignPresence.find(presence => presence.civilizationId === winner)!.level).toBe('PREDOMINANT');
    expect(target.foreignPresence.filter(presence => presence.level === 'PREDOMINANT')).toHaveLength(1);
    expect(target.localCohesion).toBeGreaterThanOrEqual(0); expect(target.localCohesion).toBeLessThanOrEqual(100);
  });

  it('keeps foreign presence on capture but removes the new owner from its own city', () => {
    const state = setup(), target = city(state, 2);
    establishCulturalPresence(state, ids[0]!, target.cityId);
    establishCulturalPresence(state, ids[1]!, target.cityId);
    target.foreignPresence[0]!.level = 'PREDOMINANT'; target.culturalAnchor = civilization(state, 0);
    occupyCity(state, ids[0]!, target.cityId as never);
    expect(target.foreignPresence).toEqual([{ civilizationId: civilization(state, 1), level: 'CONTACT' }]);
    expect(target.culturalAnchor).toBeNull();
    expect(state.players[0]!.foreignInfluence).toBe(0);
    expect(state.players[1]!.foreignInfluence).toBe(1);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('feeds Hegemony and the projection from the same presence records', () => {
    const state = setup(), actor = ids[0]!, target = city(state, 2);
    state.players[0]!.knownHexIds = state.core.map.map(tile => tile.id);
    establishCulturalPresence(state, actor, target.cityId);
    const view = alphaPlayerView(state, actor)!;
    const projected = view.culture.filter(entry => entry.foreignPresence.some(presence => presence.civilizationId === civilization(state, 0))).length;
    const metric = hegemonyProgress(state, actor).find(path => path.path === 'CULTURAL')!.requirements.find(requirement => requirement.metric === 'foreignInfluence')!.current;
    expect(projected).toBe(1);
    expect(metric).toBe(projected);
    expect(culturalPresenceCount(state, actor)).toBe(projected);
  });
});

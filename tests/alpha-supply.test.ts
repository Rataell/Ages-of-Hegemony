import { describe, expect, it } from 'vitest';
import { alphaUnitOptions, beginAlphaPlanning, createAlphaGame, hexDistance, resolveBattleWithFaces, unitSupply } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { amount, arena, entry, faces, p1, p2 } from './alpha-arena.js';
import { completeRound, must } from './alpha-rounds.js';

// Supply in real engine battles (V51B-16 readiness slice). Arena: ten plains in a row, p1 city at 0,0 and p2 city at 7,0, supplyRadius 3.
const fight = (setup: (state: ReturnType<typeof arena>['state']) => void = () => {}, options: Parameters<typeof arena>[0] = {}) => {
  const { state, order } = arena(options);
  setup(state);
  resolveBattleWithFaces(state, p1, order, faces('EMPTY', 'a1', 'd1'));
  return { state, battle: state.battles[0]! };
};
const own = (state: ReturnType<typeof arena>['state'], ids: string[]) => state.core.map.filter(t => ids.includes(t.id)).forEach(t => { t.ownerId = p1; });

describe('supply in combat', () => {
  it('a supplied attacker pays nothing, an unsupplied attacker pays the configured penalty', () => {
    const near = fight();
    expect(entry(near.battle.attackBreakdown, 'Sem suprimento')).toBeUndefined();
    const far = fight(() => {}, { far: true });
    expect(amount(far.battle.attackBreakdown, 'Sem suprimento')).toBe(-far.state.rules.combat.unsuppliedPenalty);
    expect(entry(far.battle.defenseBreakdown, 'Sem suprimento')).toBeUndefined();
  });

  it('a supplied defender pays nothing, an unsupplied defender pays the same penalty on the defense', () => {
    // Radius 2: attackers at 3,0 stay supplied through own territory 1,0–3,0; defenders at 4,0 are 3 hexes from their city with no own territory or road between.
    const setup = (state: ReturnType<typeof arena>['state']) => { state.rules.supplyRadius = 2; own(state, ['1,0', '2,0', '3,0']); };
    const { battle, state } = fight(setup);
    expect(entry(battle.attackBreakdown, 'Sem suprimento')).toBeUndefined();
    expect(amount(battle.defenseBreakdown, 'Sem suprimento')).toBe(-state.rules.combat.unsuppliedPenalty);
    const supplied = fight(s => { s.rules.supplyRadius = 3; own(s, ['1,0', '2,0', '3,0']); });
    expect(entry(supplied.battle.defenseBreakdown, 'Sem suprimento')).toBeUndefined();
  });

  it('own territory and roads extend the reach beyond the city radius; neither is the same as nothing', () => {
    const bare = fight(s => { s.rules.supplyRadius = 2; });
    expect(amount(bare.battle.attackBreakdown, 'Sem suprimento')).toBeLessThan(0);
    const territory = fight(s => { s.rules.supplyRadius = 2; own(s, ['1,0', '2,0', '3,0']); });
    expect(entry(territory.battle.attackBreakdown, 'Sem suprimento')).toBeUndefined();
    const road = fight(s => { s.rules.supplyRadius = 2; s.roads.push('1,0' as never, '2,0' as never, '3,0' as never); });
    expect(entry(road.battle.attackBreakdown, 'Sem suprimento')).toBeUndefined();
    // A gap in the chain breaks the connection.
    const gap = fight(s => { s.rules.supplyRadius = 2; own(s, ['1,0', '3,0']); });
    expect(amount(gap.battle.attackBreakdown, 'Sem suprimento')).toBeLessThan(0);
  });

  it('a stack that marches out of reach loses its supply after the movement resolves', () => {
    const state = beginAlphaPlanning(createAlphaGame({ gameId: 'supply-march', seed: 41, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }));
    const capital = state.core.players[0]!.civilization.cities[0]!, origin = state.core.map.find(t => t.id === capital.hexId)!;
    state.units = [{ id: 'u1', ownerId: p1, kind: 'INFANTRY', hexId: capital.hexId, recruitedRound: 1 }];
    state.players.forEach(p => { p.knownHexIds = state.core.map.map(t => t.id); });
    state.players[0]!.temporaryEffects = [{ source: 'test-march', effect: { kind: 'MOVEMENT', amount: 2 }, round: state.core.round }];
    expect(unitSupply(state, state.units[0]!).supplied).toBe(true);
    // Walk outward round after round (movement is short): each leg goes to the reachable hex farthest from the capital.
    let current = state;
    for (let leg = 0; leg < 4 && unitSupply(current, current.units[0]!).supplied; leg++) {
      current.players[0]!.temporaryEffects = [{ source: 'test-march', effect: { kind: 'MOVEMENT', amount: 2 }, round: current.core.round }];
      const here = current.units[0]!, moves = alphaUnitOptions(current, p1).u1!.moves;
      const next = Object.keys(moves).map(id => ({ id, d: hexDistance(origin, current.core.map.find(t => t.id === id)!) })).filter(x => !current.core.map.find(t => t.id === x.id)!.ownerId).sort((a, b) => b.d - a.d || a.id.localeCompare(b.id))[0];
      expect(next, `a hex to walk to from ${here.hexId}`).toBeDefined();
      current = completeRound(must(current, p1, { type: 'QUEUE_ORDER', order: { id: `m${leg}`, type: 'MOVE', unitIds: ['u1'], path: moves[next!.id] } }));
      current.players.forEach(p => { p.knownHexIds = current.core.map.map(t => t.id); });
    }
    const moved = current.units.find(u => u.id === 'u1')!;
    expect(hexDistance(origin, current.core.map.find(t => t.id === moved.hexId)!)).toBeGreaterThan(state.rules.supplyRadius);
    const supply = unitSupply(current, moved);
    expect(supply.supplied).toBe(false);
    expect(supply.reason).toMatch(/Sem cidade/);
  });

  it('is deterministic: the same inputs replay to the same battle record', () => {
    const a = fight(() => {}, { far: true }).battle, b = fight(() => {}, { far: true }).battle;
    expect(b).toEqual(a);
  });

  it('projection: an owner sees the supply state and reason of its pieces, a rival does not', () => {
    const { state } = arena({ far: true });
    const mine = alphaPlayerView(state, p1)!.units.find(u => u.id === 'a1')!;
    expect(mine.supply).toMatchObject({ supplied: false });
    const theirs = alphaPlayerView(state, p2)!.units.find(u => u.id === 'a1');
    if (theirs) expect(theirs.supply).toBeNull();
  });
});

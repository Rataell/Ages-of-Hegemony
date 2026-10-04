import { describe, expect, it } from 'vitest';
import { ADVANCEMENTS, AlphaStateSchema, CIVILIZATION_KITS, PlayerIdSchema, type AlphaState } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, hexId, hexNeighbors, isSignature, kitExplorationReach, resolveBattleWithFaces, kitProduceBonus, kitTradeBonus, kitWorksCost, kitAdvancementCost, kitExplorationKnowledge, kitFoodUpkeep, kitFortificationBlock, kitMovement, kitTreatyRounds, kitUnitCost } from '@aoh/game-engine';

const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
const game = (civ: string, other = 'aurelia'): AlphaState => beginAlphaPlanning(createAlphaGame({ gameId: `kit-${civ}`, seed: 21, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um', civilization: civ }, { id: 'p2', name: 'Dois', civilization: other === civ ? 'valgard' : other }] }));
const own = (state: AlphaState, kind: string) => state.units.filter(unit => unit.ownerId === p1 && unit.kind === kind).length;
const base = game('aurelia', 'valgard');
/** Before the first round opens: every civilization has the same pool, so the heritage is the only difference. */
const raw = (civ: string): AlphaState => createAlphaGame({ gameId: `kit-raw-${civ}`, seed: 21, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um', civilization: civ }, { id: 'p2', name: 'Dois', civilization: civ === 'valgard' ? 'aurelia' : 'valgard' }] });
const start = raw('aurelia').players[0]!.resources;

describe('civilization kits applied by the engine', () => {
  it('marks as active only kit items the engine applies', () => {
    const active = CIVILIZATION_KITS.flatMap(kit => [kit.trait, kit.heritage, kit.limitation, kit.signature.item].filter(item => item.status === 'ACTIVE').map(item => `${kit.id}:${item.text}`));
    expect(active.length).toBeGreaterThanOrEqual(25);
    expect(CIVILIZATION_KITS.filter(kit => kit.availability === 'AUTHORING').every(kit => [kit.trait, kit.heritage, kit.limitation].every(item => item.status === 'PLANNED'))).toBe(true);
  });

  it('gives each civilization its starting heritage', () => {
    expect(own(game('valgard'), 'GUARD')).toBe(1);
    expect(own(game('saren'), 'ENVOY')).toBe(1);
    expect(raw('saren').players[0]!.resources.influence).toBe(start.influence + 2);
    expect(own(game('veyra'), 'ENVOY')).toBe(2);
    expect(own(game('thalos'), 'EXPLORER')).toBe(2);
    expect(own(game('elyra'), 'EXPLORER')).toBe(2);
    expect(game('kor').cities.find(city => city.capital && city.currentOwnerId === p1)!.fortification.level).toBe('PALISADE');
    expect(raw('meridia').players[0]!.resources.wealth).toBe(start.wealth + 3);
    expect(raw('orinth').players[0]!.resources.knowledge).toBe(start.knowledge + 2);
    expect(raw('dravik').players[0]!.resources.stone).toBe(start.stone + 2);
    const nymara = raw('nymara'), plain = raw('aurelia');
    expect(nymara.cities.find(city => city.currentOwnerId === p1)!.mood).toBe(Math.min(6, plain.cities.find(city => city.currentOwnerId === p1)!.mood + 1));
    for (const civ of ['valgard', 'saren', 'veyra', 'thalos', 'kor']) expect(AlphaStateSchema.safeParse(game(civ)).success).toBe(true);
  });

  it('adjusts costs: Veyra and Valgard envoys, Elyra siege, Orinth and Solenne research', () => {
    expect(kitUnitCost(game('veyra'), p1, 'ENVOY').cost.wealth).toBe(base.rules.units.ENVOY.cost.wealth - 1);
    expect(kitUnitCost(game('valgard'), p1, 'ENVOY').cost.influence).toBe(base.rules.units.ENVOY.cost.influence + 1);
    expect(kitUnitCost(game('elyra'), p1, 'SIEGE').metal).toBe(base.rules.units.SIEGE.metal + 1);
    const first = ADVANCEMENTS.find(node => node.era === 'FOUNDATION' && node.domain === 'KNOWLEDGE')!;
    expect(kitAdvancementCost(game('orinth'), p1, first).knowledge).toBe(first.cost.knowledge - 1);
    expect(kitAdvancementCost(game('solenne'), p1, first).knowledge).toBe(first.cost.knowledge + 1);
    expect(kitAdvancementCost(base, p1, first).knowledge).toBe(first.cost.knowledge);
  });

  it('applies traits and limitations through existing rules', () => {
    expect(kitExplorationKnowledge(game('elyra'), p1, [])).toBe(1);
    expect(kitTreatyRounds(game('saren'), p1, p2)).toBe(1);
    expect(kitMovement(game('kor'), p1, 'FLEET')).toBe(-1);
    expect(kitFortificationBlock(game('meridia'), p1, 'FORTRESS')).toMatch(/Muralha de Pedra/);
    expect(kitFortificationBlock(game('meridia'), p1, 'STONE_WALL')).toBeNull();
    const aurelia = game('aurelia', 'valgard');
    for (const n of [1, 2, 3, 4]) aurelia.units.push({ id: `soldier-${n}`, ownerId: p1, kind: 'INFANTRY', hexId: aurelia.units[0]!.hexId, recruitedRound: 1, carrierId: null });
    expect(kitFoodUpkeep(aurelia, p1)).toBe(1);
  });

  it('adds Kor quarry stone and Aurélia farm food when a city produces, and trims Dravik works', () => {
    for (const [civ, improvement, terrain, key] of [['kor', 'QUARRY', 'HILLS', 'stone'], ['aurelia', 'FARM', 'PLAINS', 'food']] as const) {
      const state = game(civ), city = state.core.players[0]!.civilization.cities[0]!;
      const tile = state.core.map.find(t => t.id !== city.hexId && t.ownerId === null && t.terrain === terrain)!;
      tile.ownerId = p1; tile.controllerCityId = city.id; tile.improvement = improvement;
      city.workedHexIds = [...city.workedHexIds, tile.id];
      expect(kitProduceBonus(state, p1, city.id)[key]).toBe(1);
      expect(kitProduceBonus(game('valgard'), p1, game('valgard').core.players[0]!.civilization.cities[0]!.id)).toEqual({ food: 0, stone: 0 });
    }
    expect(kitWorksCost(game('dravik'), p1, { food: 0, materials: 2, wealth: 1, knowledge: 0, influence: 0 }).materials).toBe(1);
    expect(kitWorksCost(base, p1, { food: 0, materials: 2, wealth: 1, knowledge: 0, influence: 0 }).materials).toBe(2);
  });
  it('gives Merídia +1 Wealth for its first settled trade of the round only', () => {
    const state = game('meridia'), before = state.players[0]!.resources.wealth;
    kitTradeBonus(state, [p1, p2]); kitTradeBonus(state, [p1, p2]);
    expect(state.players[0]!.resources.wealth).toBe(before + 1);
    expect(state.players[1]!.resources.wealth).toBe(game('meridia').players[1]!.resources.wealth);
  });

  it('turns a whole family into the signature piece, and the Shield Guard holds fortified walls', () => {
    const state = game('aurelia', 'valgard');
    expect(isSignature(state, { ownerId: p2, kind: 'GUARD' })).toBe(true);
    expect(isSignature(state, { ownerId: p1, kind: 'GUARD' })).toBe(false);
    expect(kitExplorationReach(game('elyra'), { id: 'x', ownerId: p1, kind: 'EXPLORER', hexId: '0,0' as never, recruitedRound: 1, carrierId: null })).toBe(2);
    const capital = state.core.players[1]!.civilization.cities[0]!;
    state.cities.find(city => city.cityId === capital.id)!.fortification = { level: 'PALISADE', state: 'INTACT' };
    const near = hexNeighbors(state.core.map.find(t => t.id === capital.hexId)!).map(hexId).find(id => state.core.map.some(t => t.id === id && !['SEA', 'UNKNOWN'].includes(t.terrain)))!;
    state.units = state.units.filter(unit => unit.hexId !== near);
    state.units.push({ id: 'attacker', ownerId: p1, kind: 'INFANTRY', hexId: near as never, recruitedRound: 1, carrierId: null });
    state.players[0]!.knownHexIds = [...new Set([...state.players[0]!.knownHexIds, capital.hexId, near])].sort() as never;
    state.wars.push(['p1', 'p2'] as never);
    resolveBattleWithFaces(state, p1, { id: 'storm', type: 'ATTACK', unitIds: ['attacker'], target: capital.hexId, posture: 'ASSAULT' });
    expect(state.battles.at(-1)!.defenseBreakdown.find(entry => entry.source === 'Guarda de Escudos')?.amount).toBe(1);
  });
});


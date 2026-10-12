import { describe, expect, it } from 'vitest';
import { ADVANCEMENTS, threatComposition, type AlphaState, type AlphaUnit, type Threat } from '@aoh/game-domain';
import { blockadedBy, cityYield, courtWaives, explorationHints, hexDistance, kitUnitCost, militaryUpkeep, pillagePort, recruitBlock, recruitUnit, shipyardExemption, urbanCost } from '@aoh/game-engine';
import { grant } from './alpha-grant.js';
import { apply, coreCity, freshGame, meta, plan, seat, shape, urban, P1, P2 } from './v12-audit-urban-helpers.js';

/**
 * RC5: the six buildings of the Phase 3 specification, each proved at the engine reader it names: Moinho (cityYield), Observatório (explorationHints), Tribunal (second activation),
 * Arsenal and Estaleiro (recruiting price, naval upkeep), Farol (pillage and blockade). The gate/price/persistence of each is in tests/v12-fix-catalog.test.ts.
 */
const tileById = (state: AlphaState, id: string) => state.core.map.find(tile => tile.id === id)!;
const landTiles = (state: AlphaState) => state.core.map.filter(tile => ['PLAINS', 'FOREST'].includes(tile.terrain) && tile.id !== coreCity(state).hexId);

describe('Moinho · +1 Alimento per Fazenda worked, at most +2', () => {
  const city = (level: 'VILLAGE' | 'GREAT_CITY', population: number, farms: number[]) => {
    const state = freshGame();
    shape(state, level, population, { producers: population });
    const tiles = landTiles(state).slice(0, 4);
    tiles.forEach((tile, index) => { tile.improvement = farms.includes(index) ? 'FARM' : null; });
    coreCity(state).workedHexIds = tiles.map(tile => tile.id) as never;
    meta(state).mood = 5;
    return state;
  };
  const food = (state: AlphaState) => cityYield(state, meta(state).cityId).output.food;
  const withMill = (state: AlphaState) => { const copy = structuredClone(state); meta(copy).buildings.push('MILL'); return copy; };

  it('rewards the Fazendas the Produzir really works: 0, 1, 2 and (capped) 3 of them', () => {
    expect(food(withMill(city('GREAT_CITY', 10, []))) - food(city('GREAT_CITY', 10, []))).toBe(0);
    expect(food(withMill(city('GREAT_CITY', 10, [0]))) - food(city('GREAT_CITY', 10, [0]))).toBe(1);
    expect(food(withMill(city('GREAT_CITY', 10, [0, 1]))) - food(city('GREAT_CITY', 10, [0, 1]))).toBe(2);
    const three = city('GREAT_CITY', 10, [0, 1, 2]);
    expect(cityYield(three, meta(three).cityId).capacity).toBeGreaterThanOrEqual(3);
    expect(food(withMill(three)) - food(three)).toBe(2);                           // the ceiling
  });
  it('a Fazenda outside the Capacity slice does not count, and a Revolta city does not produce at all', () => {
    const outside = city('VILLAGE', 6, [3]);                                          // Capacity 2 works two hexes: the fourth is idle
    expect(food(withMill(outside)) - food(outside)).toBe(0);
    const revolt = withMill(city('GREAT_CITY', 10, [0, 1]));
    meta(revolt).mood = 0;
    expect(food(revolt)).toBe(0);
  });
  it('is shown on the card: the yield notes say so', () => {
    const state = withMill(city('GREAT_CITY', 10, [0, 1]));
    expect(cityYield(state, meta(state).cityId).notes.join(' ')).toMatch(/Moinho: \+2 Alimento/);
  });
});

describe('Observatório · exploration hints up to 6 hexes from the city, information only', () => {
  const closedRegions = (state: AlphaState) => state.regions.filter(region => !region.revealedBy.includes(P1) && !region.hexIds.some(id => tileById(state, id).ownerId === P1));
  const prepared = () => {
    const state = freshGame();
    state.units = state.units.filter(unit => unit.ownerId !== P1);                   // no piece: only the building can extend the range
    seat(state).research.push(...['web-mathematics', 'web-experimental-method']);
    return state;
  };
  const distanceTo = (state: AlphaState, region: AlphaState['regions'][number]) => Math.min(...region.hexIds.map(id => hexDistance(tileById(state, coreCity(state).hexId), tileById(state, id))));
  it('lists exactly the closed Regions within 6 hexes of the city, none without it, and reveals nothing', () => {
    const state = prepared();
    expect(explorationHints(state, P1)).toEqual([]);
    const built = structuredClone(state); meta(built).buildings.push('OBSERVATORY');
    const regionsBefore = JSON.stringify(built.regions), knownBefore = JSON.stringify(seat(built).knownHexIds);
    const hints = explorationHints(built, P1);
    const expected = closedRegions(built).filter(region => distanceTo(built, region) <= 6).map(region => region.id).sort();
    expect(hints.map(hint => hint.regionId).sort()).toEqual(expected);
    expect(expected.length).toBeGreaterThan(0);
    expect(JSON.stringify(built.regions)).toBe(regionsBefore); expect(JSON.stringify(seat(built).knownHexIds)).toBe(knownBefore);
    for (const hint of hints) expect(Object.keys(hint).sort()).toEqual(['biome', 'coast', 'danger', 'regionId']);   // no new field
  });
  it('each field still needs its own advance (no Método Experimental, no danger/coast)', () => {
    const state = prepared(); seat(state).research = seat(state).research.filter(id => id !== 'web-experimental-method');
    meta(state).buildings.push('OBSERVATORY');
    for (const hint of explorationHints(state, P1)) { expect(hint.danger).toBeNull(); expect(hint.biome).not.toBeNull(); }
  });
  it('is opened by Método Experimental, the advance that already gives the hints', () => {
    expect(ADVANCEMENTS.find(node => node.unlocks.includes('building:OBSERVATORY'))?.id).toBe('web-experimental-method');
  });
});

describe('Tribunal · the second activation costs no Ânimo, once per round in the civilization', () => {
  const twoActivations = (court: boolean) => {
    const state = freshGame(); shape(state, 'VILLAGE', 6, { producers: 3, scholars: 3 }); meta(state).mood = 5;
    Object.assign(seat(state).resources, { food: 15, wood: 10, stone: 8, wealth: 10, knowledge: 5, culture: 5 });
    if (court) meta(state).buildings.push('COURT');
    return plan(state, [urban(meta(state).cityId, 'PRODUCE'), urban(meta(state).cityId, 'PRODUCE')]);
  };
  it('the city with a Tribunal ends the round one Ânimo above the same city without it, and says so', () => {
    const without = twoActivations(false), withCourt = twoActivations(true);
    expect(without.failures).toEqual([]); expect(withCourt.failures).toEqual([]);
    expect(meta(withCourt.after).mood - meta(without.after).mood).toBe(1);
    expect(withCourt.after.events.some(event => event.type === 'COURT_WAIVER')).toBe(true);
  });
  it('is spent once per round in the whole civilization', () => {
    const state = freshGame();
    const first = meta(state), second = structuredClone(first); second.cityId = 'second-city' as never; second.capital = false; second.buildings = ['COURT']; first.buildings = ['COURT'];
    state.cities.push(second);
    first.urbanActionsUsed = 1; second.urbanActionsUsed = 1;
    expect(courtWaives(state, P1, second)).toBe(true);
    first.urbanActionsUsed = 2;                                                       // the first Tribunal city already took its second activation
    expect(courtWaives(state, P1, second)).toBe(false);
    first.buildings = []; expect(courtWaives(state, P1, second)).toBe(true);          // no Tribunal elsewhere: nothing was spent
    second.buildings = []; expect(courtWaives(state, P1, second)).toBe(false);        // no Tribunal here: no waiver
  });
  it('does not make Governar free: it still costs Cultura or Riqueza and an Order', () => {
    const state = freshGame(); shape(state, 'VILLAGE', 6, { producers: 3, scholars: 3 }); meta(state).mood = 2; meta(state).buildings.push('COURT');
    Object.assign(seat(state).resources, { wealth: 10, culture: 0 });
    state.core.players.find(player => player.id === P1)!.civilization.government = 'REPUBLIC';
    const cost = urbanCost(state, P1, meta(state).cityId, 'PROMOTE_MOOD');
    expect(cost.wealth + cost.culture).toBeGreaterThan(0);
    const done = apply(state, urban(meta(state).cityId, 'PROMOTE_MOOD'));
    expect(done.ok).toBe(true);
    if (done.ok) expect(seat(done.value).plannedActions.some(action => action.type === 'URBAN_ACTION' && action.action === 'PROMOTE_MOOD')).toBe(true);
  });
});

describe('Arsenal · Cavalaria and Cerco cost 1 Metal less, never more than the price', () => {
  const barracks = () => { const state = freshGame(); shape(state, 'GREAT_CITY', 10, { producers: 6, soldiers: 4 }); meta(state).districts.push('MILITARY'); coreCity(state).districts.push({ type: 'MILITARY', builtRound: 1 } as never); seat(state).era = 'ASCENSION'; grant(state, P1, 'web-engineering', 'web-maneuver-training', 'web-metallurgy', 'web-guard-formations'); Object.assign(seat(state).resources, { food: 15, wood: 15, stone: 15, metal: 10, wealth: 15 }); return state; };
  it('the price shown and the price charged drop by one Metal for Cavalaria and Cerco only', () => {
    const base = barracks(), arsenal = structuredClone(base); meta(arsenal).buildings.push('ARSENAL');
    for (const [kind, drop] of [['CAVALRY', 1], ['SIEGE', 1], ['INFANTRY', 0], ['GUARD', 0], ['RANGED', 0]] as const) {
      expect(kitUnitCost(base, P1, kind, meta(base).cityId).metal - kitUnitCost(arsenal, P1, kind, meta(arsenal).cityId).metal, kind).toBe(drop);
      expect(urbanCost(base, P1, meta(base).cityId, 'RECRUIT', { unit: kind }).metal - urbanCost(arsenal, P1, meta(arsenal).cityId, 'RECRUIT', { unit: kind }).metal, `${kind} shown`).toBe(drop);
    }
    const paid = (state: AlphaState, kind: AlphaUnit['kind']) => { const copy = structuredClone(state), before = { ...seat(copy).resources }; recruitUnit(copy, P1, meta(copy).cityId, kind); return before.metal + before.wood + before.stone - seat(copy).resources.metal - seat(copy).resources.wood - seat(copy).resources.stone; };
    expect(paid(base, 'CAVALRY') - paid(arsenal, 'CAVALRY')).toBe(1);
  });
  it('never replaces Era or distrito: those are checked before the price', () => {
    const early = structuredClone(barracks()); meta(early).buildings.push('ARSENAL'); seat(early).era = 'FOUNDATION';
    expect(recruitBlock(early, P1, meta(early).cityId, 'SIEGE')).toBe('Sua civilização ainda não alcançou a era exigida.');
    const noDistrict = freshGame(); meta(noDistrict).buildings.push('ARSENAL'); seat(noDistrict).era = 'ASCENSION'; grant(noDistrict, P1, 'web-maneuver-training');
    expect(recruitBlock(noDistrict, P1, meta(noDistrict).cityId, 'CAVALRY')).toBe('Esta peça requer distrito Militar.');
  });
  it('is opened by Ferro (Era IV), the advance of the Fundição and of the infantry upgrade', () => {
    const node = ADVANCEMENTS.find(candidate => candidate.unlocks.includes('building:ARSENAL'))!;
    expect(node.id).toBe('web-iron'); expect(node.unlocks).toContain('building:FOUNDRY');
  });
});

describe('Estaleiro · cheaper ships and two ships that cost no upkeep', () => {
  const harbour = () => { const state = freshGame(); meta(state).districts.push('MARITIME'); meta(state).buildings.push('SHIPYARD'); return state; };
  const ship = (state: AlphaState, hex: string, id: string) => state.units.push({ id, ownerId: P1, kind: 'FLEET', hexId: hex as never, recruitedRound: 1, carrierId: null } as AlphaUnit);
  it('Frota costs 1 Riqueza less and Barca de Patrulha 1 less, only in the city that has it', () => {
    const state = harbour(), plain = freshGame();
    expect(kitUnitCost(plain, P1, 'FLEET', meta(plain).cityId).cost.wealth - kitUnitCost(state, P1, 'FLEET', meta(state).cityId).cost.wealth).toBe(1);
    expect(kitUnitCost(plain, P1, 'COASTAL_VESSEL', meta(plain).cityId).cost.wealth - kitUnitCost(state, P1, 'COASTAL_VESSEL', meta(state).cityId).cost.wealth).toBe(1);
    expect(kitUnitCost(state, P1, 'INFANTRY', meta(state).cityId)).toEqual(kitUnitCost(plain, P1, 'INFANTRY', meta(plain).cityId));
  });
  it('up to 2 ships at the city (its hex or next to it) pay no Riqueza upkeep; the third and the distant ones do', () => {
    const state = harbour(); state.units = state.units.filter(unit => unit.ownerId !== P1);
    const home = coreCity(state).hexId, neighbour = state.core.map.find(tile => hexDistance(tileById(state, home), tile) === 1)!.id, far = state.core.map.find(tile => hexDistance(tileById(state, home), tile) === 4)!.id;
    ship(state, home, 'a'); ship(state, neighbour, 'b'); ship(state, home, 'c'); ship(state, far, 'd');
    expect(militaryUpkeep(state, P1).wealth).toBe(4 - 2);
    expect(shipyardExemption(state, P1)).toBe(2);
    const plain = freshGame(); plain.units = state.units; expect(militaryUpkeep(plain, P1).wealth).toBe(4);
  });
  it('an occupied Estaleiro grants nothing', () => {
    const state = harbour(); state.units = state.units.filter(unit => unit.ownerId !== P1); ship(state, coreCity(state).hexId, 'a');
    meta(state).status = 'OCCUPIED';
    expect(shipyardExemption(state, P1)).toBe(0);
  });
});

describe('Farol · pirates steal 1 instead of 2 and the blockade needs two armed ships', () => {
  const port = (lighthouse: boolean) => {
    const state = freshGame(); state.units = state.units.filter(unit => unit.ownerId === P2);
    const centre = tileById(state, coreCity(state).hexId); centre.terrain = 'COAST';
    const [a, b, c] = state.core.map.filter(tile => hexDistance(centre, tile) === 1);
    a!.terrain = 'SEA'; b!.terrain = 'SEA'; c!.terrain = 'SEA';
    if (lighthouse) meta(state).buildings.push('LIGHTHOUSE');
    seat(state).resources.wealth = 10;
    return { state, sea: [a!.id, b!.id], centre: centre.id };
  };
  const pirate = (hex: string): Threat => ({ id: 'pirate-1', kind: 'PIRATE', hexId: hex as never, homeHexId: hex as never, level: 1, status: 'MARCHING', composition: threatComposition('PIRATE', 1, 0), createdRound: 1, lastActedRound: 0, rewardPaid: false, fresh: false, withdrawing: false, readyRound: 0 });
  const armed = (state: AlphaState, hexes: string[]) => { state.wars = [[P1, P2]] as never; hexes.forEach((hex, index) => state.units.push({ id: `enemy-${index}-${state.units.length}`, ownerId: P2, kind: 'FLEET', hexId: hex as never, recruitedRound: 1, carrierId: null } as AlphaUnit)); };
  it('the pillage takes 2 Riqueza from a plain port and 1 from a port with a Farol', () => {
    for (const [lighthouse, loss] of [[false, 2], [true, 1]] as const) {
      const { state, sea } = port(lighthouse), before = seat(state).resources.wealth;
      pillagePort(state, pirate(sea[0]!));
      expect(before - seat(state).resources.wealth, lighthouse ? 'with Farol' : 'plain').toBe(loss);
    }
  });
  it('a single armed enemy ship blockades a plain port; with a Farol it takes two', () => {
    const plain = port(false); armed(plain.state, [plain.sea[0]!]);
    expect(blockadedBy(plain.state, plain.centre, P1)).toBe(P2);
    const light = port(true); armed(light.state, [light.sea[0]!]);
    expect(blockadedBy(light.state, light.centre, P1)).toBeNull();
    armed(light.state, [light.sea[1]!]);
    expect(blockadedBy(light.state, light.centre, P1)).toBe(P2);
  });
  it('a won boarding still shuts the port, Farol or not', () => {
    const { state, centre } = port(true); state.wars = [[P1, P2]] as never;
    meta(state).portBlockedUntil = state.core.round; meta(state).portBlockedBy = P2;
    expect(blockadedBy(state, centre, P1)).toBe(P2);
  });
  it('reveals no Region: the building carries no discovery effect', () => {
    const { state, sea } = port(true), before = JSON.stringify(state.regions);
    pillagePort(state, pirate(sea[0]!));
    expect(JSON.stringify(state.regions)).toBe(before);
  });
});

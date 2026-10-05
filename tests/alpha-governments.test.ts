import { describe, expect, it } from 'vitest';
import { GovernmentSchema, GovernmentTypeSchema, PlayerIdSchema, alphaToLegacyResources, type AlphaState, type Government } from '@aoh/game-domain';
import {
  alphaActionUsage, alphaCanAfford, applyAlphaCommand, applyGovernmentRoundStart, administration, advanceCost, beginAlphaPlanning, cityYield, createAlphaGame, governmentEffects,
  governmentOptions, governmentReformBlock, governmentTable, occupyCity, operatingCapacity, recruitLimit, refreshAlphaAdministration, renewManeuvers, replaceCity,
  researchAdvancement, scoreAmbitions, setAlphaPhase, settleWithPioneer, stackLimit, unitSupply,
} from '@aoh/game-engine';
import { must } from './alpha-rounds.js';

const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
const c1 = 'capital-1', c2 = 'capital-2';

/** A two-player match in PLANNING whose first civilization lives under `government`. */
function game(government: Government = 'PROTO_GOVERNANCE', seed = 71): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: `gov-${seed}`, seed, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um', civilization: 'saren' }, { id: 'p2', name: 'Dois', civilization: 'thalos' }] }));
  state.players.forEach(player => { player.ambitionsChosen = true; });
  state.core.players[0]!.civilization.government = government;
  refreshAlphaAdministration(state);
  return state;
}
/** The same match with the urban phase open, every city fresh. */
function urban(government: Government = 'PROTO_GOVERNANCE', seed = 71): AlphaState {
  const state = game(government, seed);
  setAlphaPhase(state, 'URBAN_ACTIONS'); state.cities.forEach(city => { city.urbanActionsUsed = 0; });
  return state;
}
const act = (state: AlphaState, extra: Record<string, unknown>, cityId = c1, actor = p1) => applyAlphaCommand(state, actor, { type: 'URBAN_ACTION', expectedVersion: state.version, cityId, ...extra });
const pool = (state: AlphaState) => state.players[0]!.resources;
const meta = (state: AlphaState, id = c1) => state.cities.find(city => city.cityId === id)!;
const city = (state: AlphaState, id = c1) => state.core.players.flatMap(player => player.civilization.cities).find(item => item.id === id)!;
/** Captures the rival capital and makes it a second, integrated city of the first civilization. */
function secondCity(state: AlphaState): string {
  occupyCity(state, p1, c2 as never);
  const second = meta(state, c2); second.status = 'OWNED'; second.mood = 4; second.integration = 100; second.capital = false;
  state.occupations = [];
  state.core.players[0]!.civilization.capitalCityId = c1 as never;
  refreshAlphaAdministration(state);
  return c2;
}
const sync = (state: AlphaState) => { state.players[0]!.resources = { ...pool(state) }; state.core.players[0]!.resources = alphaToLegacyResources(pool(state)); };

describe('governments (canon V5.1b §16): the table', () => {
  it('has eight forms, each with two advantages and one limitation, and seven are adoptable reforms', () => {
    expect(GovernmentSchema.options).toHaveLength(8);
    expect(GovernmentTypeSchema.options).toHaveLength(7);
    for (const government of GovernmentSchema.options) {
      const entry = governmentTable(government);
      expect(entry.advantages.every(text => text.length > 3), government).toBe(true);
      expect(entry.limitation.length, government).toBeGreaterThan(3);
    }
  });
  it('lists all seven reforms with their texts, and the current form, in the projection source', () => {
    const state = game('MONARCHY');
    const options = governmentOptions(state, p1);
    expect(options.options.map(option => option.government).sort()).toEqual([...GovernmentTypeSchema.options].sort());
    expect(options.current).toMatchObject({ government: 'MONARCHY', name: 'Monarquia', limitation: 'Mudar de capital custa 2 Ordens' });
    expect(options.options.every(option => option.advantages.length === 2 && option.limitation.length > 0)).toBe(true);
  });
});

describe('adoption gates', () => {
  it('Meritocracia needs Academias Cívicas; Autocracia needs Centralização and Fortificação; the cost is 4 then 6 Influência', () => {
    const state = game();
    pool(state).influence = 10; sync(state);
    expect(governmentReformBlock(state, p1, 'MERITOCRACY')).toMatch(/avanço da Teia/);
    state.players[0]!.research.push('web-civic-academies');
    expect(governmentReformBlock(state, p1, 'MERITOCRACY')).toBeNull();
    state.players[0]!.research.push('web-centralization');
    expect(governmentReformBlock(state, p1, 'AUTOCRACY')).toMatch(/Centralização e Fortificação/);
    state.players[0]!.research.push('web-fortification');
    expect(governmentReformBlock(state, p1, 'AUTOCRACY')).toBeNull();
    expect(governmentReformBlock(state, p1, 'MONARCHY')).toBeNull();
    pool(state).influence = 3; sync(state);
    expect(governmentReformBlock(state, p1, 'MONARCHY')).toMatch(/4 Influência/);
  });
  it('Monarquia and Autocracia come from Centralização; República and Confederação from Federalização; Oligarquia from Moeda; Teocracia from Escolas de Expressão', () => {
    const state = game();
    pool(state).influence = 10; sync(state);
    const open = (ids: string[]) => { state.players[0]!.research = ids; return GovernmentTypeSchema.options.filter(government => governmentReformBlock(state, p1, government) === null); };
    expect(open(['web-centralization'])).toEqual(['MONARCHY']);
    expect(open(['web-federalization']).sort()).toEqual(['CONFEDERATION', 'REPUBLIC']);
    expect(open(['web-currency'])).toEqual(['OLIGARCHY']);
    expect(open(['web-expression-schools'])).toEqual(['THEOCRACY']);
  });
});

describe('Conselho (initial form)', () => {
  it('advantage: Governar recovers its first Ânimo level for free', () => {
    const state = urban();
    meta(state).mood = 3; pool(state).wealth = 0; pool(state).culture = 0; sync(state);
    const done = act(state, { action: 'PROMOTE_MOOD' });
    expect(done.ok, done.ok ? '' : done.error.message).toBe(true);
    if (done.ok) { expect(meta(done.value).mood).toBe(4); expect(done.value.players[0]!.resources.wealth).toBe(0); }
    const other = urban('THEOCRACY'); meta(other).mood = 3; pool(other).wealth = 0; pool(other).culture = 0; sync(other);
    expect(act(other, { action: 'PROMOTE_MOOD' }).ok).toBe(false);
  });
  it('advantage: Capacidade Administrativa +1', () => {
    expect(administration(game(), p1).parts.government).toBe(1);
    expect(administration(game('MONARCHY'), p1).parts.government).toBe(0);
  });
  it('limitation: at most one second activation per round in the whole civilization', () => {
    const state = urban();
    const second = secondCity(state);
    expect(act(state, { action: 'PRODUCE' }).ok).toBe(true);
    let after = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'PRODUCE' });
    after = must(after, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'PRODUCE' });
    after = must(after, p1, { type: 'URBAN_ACTION', cityId: second, action: 'PRODUCE' });
    const refused = act(after, { action: 'PRODUCE' }, second);
    expect(refused).toMatchObject({ ok: false, error: { message: expect.stringContaining('Conselho') } });
    const free = urban('THEOCRACY'); const other = secondCity(free);
    let open = must(free, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'PRODUCE' });
    open = must(open, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'PRODUCE' });
    open = must(open, p1, { type: 'URBAN_ACTION', cityId: other, action: 'PRODUCE' });
    expect(act(open, { action: 'PRODUCE' }, other).ok).toBe(true);
  });
});

describe('Monarquia', () => {
  it('advantage: the capital has Capacidade +1', () => {
    expect(operatingCapacity(game('MONARCHY'), c1)).toBe(operatingCapacity(game(), c1) + 1);
  });
  it('advantage: Recrutar in the capital ignores Capacidade (still bounded by Soldados); other governments recruit up to the Capacidade', () => {
    const state = urban('MONARCHY');
    replaceCity(state, c1, { ...city(state), population: 6, workers: { ...city(state).workers, soldiers: 4, producers: 2, scholars: 0, unassigned: 0, artisans: 0, merchants: 0 } });
    Object.assign(pool(state), { food: 15, wood: 15, stone: 15, metal: 5, wealth: 10 }); sync(state);
    expect(recruitLimit(state, p1, c1)).toBe(6);
    const done = act(state, { action: 'RECRUIT', unit: 'INFANTRY', count: 3 });
    expect(done.ok, done.ok ? '' : done.error.message).toBe(true);
    if (done.ok) expect(done.value.units.filter(unit => unit.ownerId === p1 && unit.kind === 'INFANTRY')).toHaveLength(3);
    const council = urban();
    replaceCity(council, c1, { ...city(council), population: 6, workers: { ...city(council).workers, soldiers: 4, producers: 2, scholars: 0, unassigned: 0, artisans: 0, merchants: 0 } });
    Object.assign(pool(council), { food: 15, wood: 15, stone: 15, metal: 5, wealth: 10 }); sync(council);
    expect(recruitLimit(council, p1, c1)).toBe(operatingCapacity(council, c1));
    expect(act(council, { action: 'RECRUIT', unit: 'INFANTRY', count: 3 })).toMatchObject({ ok: false, error: { message: expect.stringContaining('no máximo') } });
    const bounded = urban('MONARCHY');
    replaceCity(bounded, c1, { ...city(bounded), population: 3, workers: { ...city(bounded).workers, soldiers: 1, unassigned: 0, producers: 2, scholars: 0, artisans: 0, merchants: 0 } });
    Object.assign(pool(bounded), { food: 15, wood: 15 }); sync(bounded);
    expect(act(bounded, { action: 'RECRUIT', unit: 'INFANTRY', count: 3 }).ok).toBe(false);
  });
  it('limitation: moving the capital occupies 2 Orders (1 under other governments) and actually moves it', () => {
    const cost = (government: Government) => {
      const state = game(government); const second = secondCity(state);
      const before = alphaActionUsage(state, p1).used;
      const planned = must(state, p1, { type: 'URBAN_ACTION', cityId: second, action: 'MOVE_CAPITAL' });
      return alphaActionUsage(planned, p1).used - before;
    };
    expect(cost('MONARCHY')).toBe(2);
    expect(cost('PROTO_GOVERNANCE')).toBe(1);
    const state = urban('MONARCHY'); const second = secondCity(state);
    expect(act(state, { action: 'MOVE_CAPITAL' }, c1).ok).toBe(false);
    const moved = must(state, p1, { type: 'URBAN_ACTION', cityId: second, action: 'MOVE_CAPITAL' });
    expect(moved.core.players[0]!.civilization.capitalCityId).toBe(second);
    expect(meta(moved, second).capital).toBe(true);
    expect(meta(moved, c1).capital).toBe(false);
  });
});

describe('República', () => {
  it('advantage: up to 2 Ambições are scored per Era (1 otherwise)', () => {
    const run = (government: Government) => {
      const state = game(government);
      const player = state.players[0]!;
      player.research = ['web-writing', 'web-agriculture', 'web-masonry', 'web-exchange', 'web-guard-formations'];
      player.ambitions = ['ambition-7', 'ambition-8', 'ambition-9']; player.completedAmbitions = [];
      scoreAmbitions(state);
      return player.completedAmbitions.length;
    };
    expect(run('REPUBLIC')).toBe(2);
    expect(run('PROTO_GOVERNANCE')).toBe(1);
  });
  it('advantage: one more Manobra kept in hand and drawn at the Era turn', () => {
    const grow = (government: Government) => {
      const state = game(government);
      const limit = state.rules.handLimit;
      state.players[0]!.hand = state.cards.strategyDeck.splice(0, limit - 1);
      renewManeuvers(state);
      renewManeuvers(state);
      return state.players[0]!.hand.length;
    };
    expect(grow('REPUBLIC')).toBe(6);
    expect(grow('PROTO_GOVERNANCE')).toBe(5);
  });
  it('limitation: declaring war costs 1 Influência more, on top of the Influência Order', () => {
    const declare = (government: Government, influence: number) => {
      const state = game(government); state.players[0]!.contacts = [p2]; pool(state).influence = influence; sync(state);
      return applyAlphaCommand(state, p1, { type: 'DECLARE_WAR', expectedVersion: state.version, targetId: p2 });
    };
    expect(declare('REPUBLIC', 0)).toMatchObject({ ok: false, error: { message: expect.stringContaining('Influência') } });
    expect(declare('PROTO_GOVERNANCE', 0).ok).toBe(true);
    const state = game('REPUBLIC'); state.players[0]!.contacts = [p2]; pool(state).influence = 3; sync(state);
    setAlphaPhase(state, 'DIPLOMACY_TRADE');
    const war = must(state, p1, { type: 'DECLARE_WAR', targetId: p2 });
    expect(war.wars).toHaveLength(1);
    expect(war.players[0]!.resources.influence).toBe(2);
  });
});

describe('Oligarquia', () => {
  it('advantage: a route supported by Produzir yields +1 Riqueza', () => {
    const income = (government: Government) => {
      const state = urban(government); const second = secondCity(state);
      state.routes.push({ id: 'route-1', ownerId: p1, fromCityId: c1 as never, toCityId: second as never, path: [city(state, c1).hexId], suspended: false });
      pool(state).wealth = 0; sync(state);
      const done = must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'SUPPORT_TRADE' });
      return done.players[0]!.resources.wealth;
    };
    expect(income('OLIGARCHY')).toBe(income('PROTO_GOVERNANCE') + 1);
  });
  it('advantage: Riqueza covers up to 60% of a material cost (50% otherwise)', () => {
    const state = game('OLIGARCHY'), council = game();
    for (const target of [state, council]) { Object.assign(pool(target), { wood: 4, stone: 0, metal: 0, wealth: 12 }); sync(target); }
    const cost = { food: 0, wood: 10, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0, culture: 0 };
    expect(alphaCanAfford(state, p1, cost)).toBe(true);
    expect(alphaCanAfford(council, p1, cost)).toBe(false);
  });
  it('limitation: a Abalada city generates no Riqueza', () => {
    const wealth = (government: Government, mood: number) => {
      const state = game(government); meta(state).districts.push('COMMERCIAL'); meta(state).mood = mood;
      return cityYield(state, c1).output.wealth;
    };
    expect(wealth('OLIGARCHY', 4)).toBeGreaterThan(0);
    expect(wealth('OLIGARCHY', 3)).toBe(0);
    expect(wealth('PROTO_GOVERNANCE', 3)).toBeGreaterThan(0);
  });
});

describe('Teocracia', () => {
  it('advantage: each Templo recovers 1 Ânimo per round without an Order', () => {
    const run = (government: Government) => {
      const state = game(government); meta(state).buildings.push('TEMPLE'); meta(state).mood = 3;
      applyGovernmentRoundStart(state);
      return meta(state).mood;
    };
    expect(run('THEOCRACY')).toBe(4);
    expect(run('PROTO_GOVERNANCE')).toBe(3);
  });
  it('advantage: +1 Cultura per city with Templo', () => {
    const culture = (government: Government) => { const state = game(government); meta(state).buildings.push('TEMPLE'); return cityYield(state, c1).output.culture; };
    expect(culture('THEOCRACY')).toBe(culture('PROTO_GOVERNANCE') + 1);
  });
  it('limitation: the first Saber advance of each Era costs +1 Conhecimento, the second does not', () => {
    const state = game('THEOCRACY'), council = game();
    expect(advanceCost(state, p1, 'web-writing').knowledge).toBe(advanceCost(council, p1, 'web-writing').knowledge + 1);
    pool(state).knowledge = 10; sync(state);
    researchAdvancement(state, p1, 'web-writing');
    expect(advanceCost(state, p1, 'web-mathematics').knowledge).toBe(advanceCost(council, p1, 'web-mathematics').knowledge);
    expect(advanceCost(state, p1, 'web-agriculture').knowledge).toBe(advanceCost(council, p1, 'web-agriculture').knowledge);
  });
});

describe('Confederação', () => {
  it('advantage: Capacidade Administrativa +2', () => {
    expect(administration(game('CONFEDERATION'), p1).parts.government).toBe(2);
  });
  it('advantage: founding costs 1 Madeira less', () => {
    const spent = (government: Government) => {
      const state = game(government);
      const pioneer = state.units.find(unit => unit.ownerId === p1 && unit.kind === 'PIONEER')!;
      const capital = state.core.map.find(tile => tile.id === city(state).hexId)!;
      const site = state.core.map.find(tile => tile.ownerId === null && ['PLAINS', 'FOREST', 'HILLS'].includes(tile.terrain) && Math.max(Math.abs(tile.q - capital.q), Math.abs(tile.r - capital.r), Math.abs(tile.q + tile.r - capital.q - capital.r)) === 3)!;
      pioneer.hexId = site.id;
      Object.assign(pool(state), { food: 15, wood: 15, stone: 15, wealth: 15 }); sync(state);
      const before = pool(state).wood + pool(state).stone;
      settleWithPioneer(state, p1, pioneer.id, 'Nova');
      return before - (state.players[0]!.resources.wood + state.players[0]!.resources.stone);
    };
    expect(spent('CONFEDERATION')).toBe(spent('PROTO_GOVERNANCE') - 1);
  });
  it('limitation: the capital never operates above Capacidade 3', () => {
    const run = (government: Government) => {
      const state = game(government); meta(state).level = 'IMPERIAL_METROPOLIS';
      replaceCity(state, c1, { ...city(state), population: 18 });
      return operatingCapacity(state, c1);
    };
    expect(run('CONFEDERATION')).toBe(3);
    expect(run('PROTO_GOVERNANCE')).toBe(4);
  });
});

describe('Meritocracia', () => {
  it('advantage: Erudito yields per 1', () => {
    const knowledge = (government: Government) => {
      const state = game(government);
      replaceCity(state, c1, { ...city(state), population: 4, workers: { ...city(state).workers, scholars: 4, producers: 0, artisans: 0, merchants: 0, soldiers: 0, unassigned: 0 } });
      return cityYield(state, c1).output.knowledge;
    };
    expect(knowledge('MERITOCRACY')).toBe(knowledge('PROTO_GOVERNANCE') + 2);
  });
  it('advantage: Governar yields +1 Conhecimento', () => {
    const run = (government: Government) => {
      const state = urban(government); meta(state).mood = 3; pool(state).knowledge = 0; pool(state).wealth = 6; sync(state);
      return must(state, p1, { type: 'URBAN_ACTION', cityId: c1, action: 'PROMOTE_MOOD' }).players[0]!.resources.knowledge;
    };
    expect(run('MERITOCRACY')).toBe(1);
    expect(run('THEOCRACY')).toBe(0);
  });
  it('limitation: Recrutar at most 1 piece per activation', () => {
    const state = urban('MERITOCRACY');
    replaceCity(state, c1, { ...city(state), population: 6, workers: { ...city(state).workers, soldiers: 4, producers: 2, scholars: 0, unassigned: 0, artisans: 0, merchants: 0 } });
    meta(state).districts.push('MILITARY');
    Object.assign(pool(state), { food: 15, wood: 15, stone: 15, metal: 5, wealth: 10 }); sync(state);
    expect(recruitLimit(state, p1, c1)).toBe(1);
    expect(act(state, { action: 'RECRUIT', unit: 'INFANTRY', count: 2 }).ok).toBe(false);
    expect(act(state, { action: 'RECRUIT', unit: 'INFANTRY' }).ok).toBe(true);
  });
});

describe('Autocracia', () => {
  it('advantage: Exército máximo +1', () => {
    const open = (state: AlphaState) => state.core.map.find(tile => tile.ownerId === null && tile.terrain === 'PLAINS')!.id;
    const autocracy = game('AUTOCRACY'), council = game();
    expect(stackLimit(autocracy, p1, open(autocracy), 'military')).toBe(stackLimit(council, p1, open(council), 'military') + 1);
  });
  it('advantage: own pieces within 1 hex of a road are always supplied', () => {
    const run = (government: Government) => {
      const state = game(government);
      const capital = state.core.map.find(tile => tile.id === city(state).hexId)!;
      const far = state.core.map.filter(tile => !['SEA', 'UNKNOWN'].includes(tile.terrain) && Math.max(Math.abs(tile.q - capital.q), Math.abs(tile.r - capital.r), Math.abs(tile.q + tile.r - capital.q - capital.r)) > state.rules.supplyRadius + 1 && tile.ownerId === null)[0]!;
      const unit = { id: 'scout', ownerId: p1, kind: 'INFANTRY' as const, hexId: far.id, recruitedRound: 1, carrierId: null };
      state.units.push(unit); state.roads.push(far.id);
      return unitSupply(state, unit).supplied;
    };
    expect(run('AUTOCRACY')).toBe(true);
    expect(run('PROTO_GOVERNANCE')).toBe(false);
  });
  it('limitation: a conquered city starts with Integração 0 and in Revolta', () => {
    const run = (government: Government) => {
      const state = game(government); occupyCity(state, p1, c2 as never);
      return { mood: meta(state, c2).mood, integration: meta(state, c2).integration };
    };
    expect(run('AUTOCRACY')).toEqual({ mood: 1, integration: 0 });
    expect(run('PROTO_GOVERNANCE').integration).toBe(0);
    expect(run('PROTO_GOVERNANCE').mood).toBeGreaterThan(1);
  });
});

describe('the single source', () => {
  it('governmentEffects reads the civilization government and an unknown actor reads the Conselho', () => {
    const state = game('OLIGARCHY');
    expect(governmentEffects(state, p1).name).toBe('Oligarquia');
    expect(governmentEffects(state, p2).government).toBe('PROTO_GOVERNANCE');
    expect(governmentEffects(state, 'nobody' as never).government).toBe('PROTO_GOVERNANCE');
  });
});

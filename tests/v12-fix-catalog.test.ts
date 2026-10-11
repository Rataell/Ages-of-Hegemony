import { describe, expect, it } from 'vitest';
import {
  ADVANCEMENTS, ALPHA_BUILDING_CATALOG, AlphaBuildingSchema, AlphaEraSchema, AlphaStateSchema, DISTRICT_CATALOG, OFFERED_BUILDINGS, alphaRules, buildingSpec,
  type AlphaResourcePool, type AlphaState, type BuildingId,
} from '@aoh/game-domain';
import { administration, alphaStorageCapacity, alphaStorageCeiling, cityYield, hegemonyProgress, urbanBlock, urbanCost, urbanOptions } from '@aoh/game-engine';
import { apply, coreCity, freshGame, meta, plan, seat, shape, urban, P1 } from './v12-audit-urban-helpers.js';

/**
 * Alpha V1.2 · B0 · the building catalog. 29 ids, 13 offered (5 core with a real effect + 8 catalog), each offered one with the cost, the requirement and the
 * effect its card promises; the rest stay in the schema (snapshots) but are not for sale. Reconciliation: docs/audit/alpha-v1.2-building-reconciliation.md.
 */
const buildOn = (state: AlphaState, id: BuildingId) => urban(meta(state).cityId, 'BUILD', { build: { kind: 'BUILDING', building: id } });
const POOLS = ['food', 'wood', 'stone', 'metal', 'wealth', 'knowledge', 'influence', 'culture'] as const;
const rich = { food: 15, wood: 15, stone: 15, metal: 10, wealth: 15, knowledge: 10, influence: 10, culture: 10 };

/** A city (N6, pop 14) with the district of `id`'s family and the advance that opens it, and a full treasury. */
function cityFor(id: BuildingId, options: { advance?: boolean; district?: boolean } = {}): AlphaState {
  const state = freshGame();
  shape(state, 'METROPOLIS', 14, { producers: 14 });
  const spec = buildingSpec(id);
  const unlockedBy = ADVANCEMENTS.find(node => node.unlocks.includes(`building:${id}`));
  if (options.advance !== false && unlockedBy) {
    // The Web only accepts a legal research set: the advance with its whole prerequisite chain, and an Era that reaches it.
    const chain: string[] = [], visit = (nodeId: string) => { if (chain.includes(nodeId)) return; const node = ADVANCEMENTS.find(item => item.id === nodeId)!; for (const pre of [...node.prerequisites, ...(node.prerequisitesAny.length ? [node.prerequisitesAny[0]!] : [])]) visit(pre); chain.push(nodeId); };
    visit(unlockedBy.id);
    seat(state).research.push(...chain.filter(nodeId => !seat(state).research.includes(nodeId)));
    const eras = AlphaEraSchema.options, needed = Math.max(...chain.map(nodeId => eras.indexOf(ADVANCEMENTS.find(node => node.id === nodeId)!.era)));
    if (eras.indexOf(seat(state).era) < needed) seat(state).era = eras[needed]!;
  }
  if (options.district !== false) { meta(state).districts.push(spec.district); coreCity(state).districts.push({ type: spec.district, builtRound: 1 } as never); }
  Object.assign(seat(state).resources, rich);
  state.core.players.find(player => player.id === P1)!.civilization.government = 'REPUBLIC';
  return state;
}
const CATALOG_EIGHT: BuildingId[] = ['WAREHOUSE', 'TREASURY', 'BANK', 'FOUNDRY', 'ACADEMY', 'CHANCELLERY', 'THEATER', 'TEMPLE'];

describe('catalog integrity', () => {
  it('has one entry per schema id, every id sits in exactly one district family, and the offered set is 13', () => {
    expect(ALPHA_BUILDING_CATALOG.map(entry => entry.id).sort()).toEqual([...AlphaBuildingSchema.options].sort());
    for (const entry of ALPHA_BUILDING_CATALOG) expect(DISTRICT_CATALOG.filter(family => family.buildings.includes(entry.id)).map(family => family.district), entry.id).toEqual([entry.district]);
    expect([...OFFERED_BUILDINGS].sort()).toEqual(['ACADEMY', 'ARCHIVE', 'BANK', 'CHANCELLERY', 'FOUNDRY', 'GRANARY', 'LIBRARY', 'MARKET', 'TEMPLE', 'THEATER', 'TREASURY', 'WAREHOUSE', 'WORKSHOP']);
  });

  it('nothing is offered unless it is implemented, and every non-offered id says why', () => {
    for (const entry of ALPHA_BUILDING_CATALOG) {
      if (OFFERED_BUILDINGS.includes(entry.id)) expect(entry.implemented, entry.id).toBe(true);
      else { expect(entry.path === 'CORE' || entry.path === 'CATALOG', entry.id).toBe(false); expect(entry.effect.length, entry.id).toBeGreaterThan(10); }
    }
    const groups = (path: string) => ALPHA_BUILDING_CATALOG.filter(entry => entry.path === path).map(entry => entry.id).sort();
    expect(groups('CATALOG')).toEqual([...CATALOG_EIGHT].sort());
    expect(groups('PENDING')).toEqual(['ARSENAL', 'BARRACKS', 'COURT', 'CULTURAL_CENTER', 'LIGHTHOUSE', 'MILL', 'OBSERVATORY', 'SHIPYARD']);
    expect(groups('UNDEFINED')).toEqual(['CIVIC_SQUARE', 'LABORATORY', 'SANCTUARY', 'SCRIBES_HOUSE', 'TRADITION_HOUSE', 'TRAINING_GROUND']);
    expect(groups('DISTRICT')).toEqual(['PORT']);
    expect(groups('IMPROVEMENT')).toEqual(['IRRIGATION']);
  });

  it('every catalog building is opened by a Web advance and priced with the canon V5.1a cost (or a documented decision)', () => {
    const canon: Record<string, Partial<AlphaResourcePool>> = {
      WAREHOUSE: { wood: 3, stone: 1 }, TREASURY: { stone: 2, wealth: 3 }, BANK: { stone: 3, wealth: 3, knowledge: 1 }, FOUNDRY: { stone: 3, metal: 2 },
      ACADEMY: { stone: 3, knowledge: 2 }, CHANCELLERY: { stone: 2, wealth: 2, influence: 2 }, THEATER: { stone: 3, culture: 2 }, TEMPLE: { stone: 2, culture: 1 },
    };
    for (const id of CATALOG_EIGHT) {
      const price = buildingSpec(id).cost!;
      for (const key of POOLS) expect(price[key], `${id} ${key}`).toBe(canon[id]![key] ?? 0);
      expect(ADVANCEMENTS.some(node => node.unlocks.includes(`building:${id}`)), `${id} has an opening advance`).toBe(true);
    }
  });
});

describe('the eight catalog buildings: gate, price, effect', () => {
  for (const id of CATALOG_EIGHT) {
    describe(`${id} (${buildingSpec(id).name})`, () => {
      it('is blocked without its district, without its advance, when it already exists and when the treasury is short', () => {
        expect(urbanBlock(cityFor(id, { district: false }), P1, meta(cityFor(id)).cityId, 'BUILD', { build: { kind: 'BUILDING', building: id } })).toBe('O edifício exige o distrito correspondente.');
        const noAdvance = cityFor(id, { advance: false });
        expect(urbanBlock(noAdvance, P1, meta(noAdvance).cityId, 'BUILD', { build: { kind: 'BUILDING', building: id } })).toBe('Este edifício exige um avanço da Teia.');
        const built = cityFor(id); meta(built).buildings.push(id);
        expect(urbanBlock(built, P1, meta(built).cityId, 'BUILD', { build: { kind: 'BUILDING', building: id } })).toBe('Este edifício já existe.');
        const poor = cityFor(id); Object.assign(seat(poor).resources, { food: 0, wood: 0, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0, culture: 0 });
        expect(urbanBlock(poor, P1, meta(poor).cityId, 'BUILD', { build: { kind: 'BUILDING', building: id } })).toBe('Recursos insuficientes para esta ação.');
        const ok = cityFor(id);
        expect(urbanBlock(ok, P1, meta(ok).cityId, 'BUILD', { build: { kind: 'BUILDING', building: id } })).toBeNull();
      });

      it('the cost shown is the cost paid (and Cultura is never covered by Riqueza)', () => {
        const state = cityFor(id);
        const shown = urbanCost(state, P1, meta(state).cityId, 'BUILD', { build: { kind: 'BUILDING', building: id } });
        expect(shown).toEqual(buildingSpec(id).cost);
        const before = { ...seat(state).resources };
        const done = plan(state, [buildOn(state, id)]).after;
        expect(done.events.some(event => event.type === 'ACTION_FAILED')).toBe(false);
        expect(meta(done).buildings).toContain(id);
        // What the Construir action charged is read from the round's ledger (the pools also receive the round's own income); Cultura is not in the five-resource ledger, so it is read from the pool.
        const spent = done.roundReports.find(report => report.playerId === P1 && report.round === 1)!.expenses;
        expect(spent.materials, `${id} materials`).toBe(shown.wood + shown.stone + shown.metal);
        expect([spent.wealth, spent.knowledge, spent.influence], `${id} wealth/knowledge/influence`).toEqual([shown.wealth, shown.knowledge, shown.influence]);
        expect(before.culture - seat(done).resources.culture, `${id} culture`).toBe(shown.culture);
        // Cultura is a hard cost: with the Cultura missing, Riqueza does not stand in for it.
        if (shown.culture > 0) { const short = cityFor(id); seat(short).resources.culture = shown.culture - 1; seat(short).resources.wealth = 15; expect(urbanBlock(short, P1, meta(short).cityId, 'BUILD', { build: { kind: 'BUILDING', building: id } })).toBe('Recursos insuficientes para esta ação.'); }
      });

      it('applies the effect it announces, and survives a save', () => {
        const state = cityFor(id);
        const capacityBefore = alphaStorageCapacity(state, P1), adminBefore = administration(state, P1).capacity, cultureBefore = cityYield(state, meta(state).cityId).output.culture;
        const done = plan(state, [buildOn(state, id)]).after;
        const capacity = alphaStorageCapacity(done, P1), delta = (key: keyof typeof capacity) => capacity[key] - capacityBefore[key];
        switch (id) {
          case 'WAREHOUSE': expect([delta('wood'), delta('stone')]).toEqual([5, 5]); break;
          case 'TREASURY': case 'BANK': expect(delta('wealth')).toBe(5); break;
          case 'FOUNDRY': expect(delta('metal')).toBe(5); break;
          case 'ACADEMY': expect(delta('knowledge')).toBe(5); break;
          case 'THEATER': expect(delta('culture')).toBe(5); break;
          case 'CHANCELLERY': expect(delta('influence')).toBe(5); expect(administration(done, P1).capacity - adminBefore).toBe(1); break;
          case 'TEMPLE': expect(cityYield(done, meta(done).cityId).output.culture - cultureBefore).toBe(1); break;
          default: throw new Error(`no effect test for ${id}`);
        }
        if (!['CHANCELLERY', 'TEMPLE'].includes(id)) expect(administration(done, P1).capacity).toBe(adminBefore);
        const reloaded = AlphaStateSchema.parse(JSON.parse(JSON.stringify(done)));
        expect(meta(reloaded).buildings).toContain(id);
      });
    });
  }

  it('a second copy in another city does not raise the limit again, and the option says so before the player pays', () => {
    const state = cityFor('TREASURY');
    const other = structuredClone(meta(state)); other.cityId = 'second-city' as never; other.buildings = ['TREASURY']; other.capital = false;
    state.cities.push(other);
    const option = urbanOptions(state, P1).cities[meta(state).cityId]!.find(entry => entry.build?.kind === 'BUILDING' && (entry.build as { building: string }).building === 'TREASURY')!;
    expect(option.effect).toContain('Já existe um na civilização');
  });

  it('the hard caps hold: Tesouro + Banco + Metrópole never push Riqueza past 30', () => {
    const state = cityFor('TREASURY'); meta(state).buildings.push('TREASURY', 'BANK');
    expect(alphaStorageCapacity(state, P1).wealth).toBeLessThanOrEqual(30);
    expect(alphaStorageCapacity(state, P1).wealth).toBe(15 + 5 + 5 + 3);
  });
});

describe('what is not for sale', () => {
  it.each(['MILL', 'OBSERVATORY', 'COURT', 'ARSENAL', 'SHIPYARD', 'LIGHTHOUSE', 'BARRACKS', 'CULTURAL_CENTER', 'SCRIBES_HOUSE', 'LABORATORY', 'CIVIC_SQUARE', 'SANCTUARY', 'TRADITION_HOUSE', 'TRAINING_GROUND'] as const)('%s is refused with a reason and never appears in the options', id => {
    const state = cityFor('TREASURY');
    expect(urbanBlock(state, P1, meta(state).cityId, 'BUILD', { build: { kind: 'BUILDING', building: id } })).toBe('Este edifício ainda não está disponível.');
    expect(apply(state, buildOn(state, id)).ok).toBe(false);
    expect(urbanOptions(state, P1).cities[meta(state).cityId]!.some(entry => entry.build?.kind === 'BUILDING' && (entry.build as { building: string }).building === id)).toBe(false);
  });
  it('Porto comes with the Distrito Marítimo (no second purchase) and Irrigação is a hex improvement', () => {
    const state = cityFor('TREASURY');
    expect(urbanBlock(state, P1, meta(state).cityId, 'BUILD', { build: { kind: 'BUILDING', building: 'PORT' } })).toBe('O Porto vem com o Distrito Marítimo.');
    expect(urbanBlock(state, P1, meta(state).cityId, 'BUILD', { build: { kind: 'BUILDING', building: 'IRRIGATION' } })).toBe('Irrigação é melhoria de hex, não edifício.');
  });
  it('a save that already holds a building that is no longer offered still loads', () => {
    const state = cityFor('TREASURY'); meta(state).buildings.push('BARRACKS', 'CULTURAL_CENTER', 'OBSERVATORY');
    expect(AlphaStateSchema.safeParse(JSON.parse(JSON.stringify(state))).success).toBe(true);
  });
});

describe('Hegemonia: no requirement depends on something that cannot be acquired', () => {
  const requirements = (state: AlphaState, path: string) => hegemonyProgress(state, P1).find(entry => entry.path === path)!.requirements;
  const stock = (state: AlphaState, path: string, metric: string) => requirements(state, path).find(r => r.metric === metric)!;
  it('the stock bar is the declared value capped at the rules\' static ceiling: Riqueza 28 (30 asked), Influência 18 (25 asked)', () => {
    const state = freshGame();
    expect([stock(state, 'ECONOMIC', 'wealth').declaredMinimum, stock(state, 'ECONOMIC', 'wealth').minimum]).toEqual([30, 28]);      // 15 base + Tesouro 5 + Banco 5 + Metrópole 3
    expect([stock(state, 'CULTURAL', 'influence').declaredMinimum, stock(state, 'CULTURAL', 'influence').minimum]).toEqual([25, 18]); // 10 base + Chancelaria 5 + Metrópole 3
  });
  it('building less storage never lowers the bar: it is the same with no storage building, with all of them, and with a Metrópole', () => {
    const bare = freshGame(), built = cityFor('TREASURY'); meta(built).buildings.push('TREASURY', 'BANK', 'CHANCELLERY');
    for (const state of [bare, built]) {
      expect(stock(state, 'ECONOMIC', 'wealth').minimum).toBe(28);
      expect(stock(state, 'CULTURAL', 'influence').minimum).toBe(18);
    }
  });
  it('a civilization at its base limit does not qualify; one that stores everything it can does, without any Figura', () => {
    const state = freshGame();
    seat(state).resources.wealth = 15; seat(state).resources.influence = 10;   // exactly the base limits: was enough under the first V1.2 rule
    expect(stock(state, 'ECONOMIC', 'wealth').met).toBe(false);
    expect(stock(state, 'CULTURAL', 'influence').met).toBe(false);
    const full = cityFor('TREASURY'); meta(full).buildings.push('TREASURY', 'BANK', 'CHANCELLERY');
    expect(alphaStorageCapacity(full, P1).wealth).toBe(28);
    expect(alphaStorageCapacity(full, P1).influence).toBe(18);
    seat(full).resources.wealth = 28; seat(full).resources.influence = 18;
    expect(stock(full, 'ECONOMIC', 'wealth').met).toBe(true);
    expect(stock(full, 'CULTURAL', 'influence').met).toBe(true);
  });
  it('the ceiling never exceeds what the player can hold: capacity without a Figura reaches it', () => {
    const full = cityFor('TREASURY'); meta(full).buildings.push('TREASURY', 'BANK', 'CHANCELLERY');
    const capacity = alphaStorageCapacity(full, P1), ceiling = alphaStorageCeiling(full);
    for (const key of ['wealth', 'influence'] as const) expect(capacity[key], key).toBe(ceiling[key]);
  });
  it('no stock requirement of any path exceeds a hard cap, and no path asks for a building', () => {
    const rules = alphaRules();
    const hardCap: Record<string, number> = { wealth: 30, influence: 20 };
    for (const [path, list] of Object.entries(rules.hegemonyRequirements)) for (const r of list) {
      const effective = requirements(freshGame(), path).find(item => item.metric === r.metric)!.minimum;
      if (hardCap[r.metric] !== undefined) expect(effective, `${path}.${r.metric}`).toBeLessThanOrEqual(hardCap[r.metric]!);
    }
    // The metrics read districts, routes, treaties, hexes, Obras and units; the Obras need a DISTRICT as prerequisite (alpha-legacy-works.ts), never a building.
    const metricsOnBuildings = Object.values(rules.hegemonyRequirements).flat().filter(r => /building|temple|treasury|bank|academy|theater/i.test(r.metric));
    expect(metricsOnBuildings).toEqual([]);
  });
});

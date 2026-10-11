import { describe, expect, it } from 'vitest';
import { ALPHA_BUILDING_CATALOG, AlphaBuildingSchema, ADVANCEMENTS, districtEntry, emptyAlphaResourcePool, type AlphaResourcePool } from '@aoh/game-domain';
import { cityYield, deriveCityProductionBreakdown, urbanCost, urbanOptions } from '@aoh/game-engine';
import { coreCity, freshGame, meta, seat, shape, P1 } from './v12-audit-urban-helpers.js';

/**
 * Alpha V1.2 · lane A2+D · AUDIT of what the interface DISPLAYS about urban actions against what the engine APPLIES.
 * Same conventions as tests/v12-audit-urban-planning.test.ts: `it.fails` + REPRO = a defect that exists today (green now, red when
 * fixed -> flip to `it`); plain `it` = GUARD or CHARACTERIZATION. IDs (D-nn) match docs/audit/alpha-v1.2-lane-a2d-sources-cities-urban.md.
 */
const total = (pool: Partial<AlphaResourcePool>) => Object.values(pool).reduce((a: number, b) => a + (b ?? 0), 0);
const FAMILY: Record<string, string> = { Alimentos: 'food', Alimento: 'food', 'Madeira/Pedra': 'materials', Madeira: 'materials', Pedra: 'materials', Metal: 'materials', Riqueza: 'wealth', Conhecimento: 'knowledge', Influência: 'influence', Cultura: 'culture' };
/** "Novo distrito · +1 Alimentos · +2 Cultura" -> { food: 1, culture: 2 }, by resource FAMILY (Madeira, Pedra and Metal are one family in the legacy text). */
function parseEffect(effect: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const match of effect.matchAll(/\+(\d+) ([^,·]+)/g)) { const family = FAMILY[match[2]!.trim()]; if (family) out[family] = (out[family] ?? 0) + Number(match[1]); }
  return out;
}
const families = (pool: AlphaResourcePool): Record<string, number> => {
  const out: Record<string, number> = { food: pool.food, materials: pool.wood + pool.stone + pool.metal, wealth: pool.wealth, knowledge: pool.knowledge, influence: pool.influence, culture: pool.culture };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== 0));
};
function unlockedGame() {
  const state = freshGame();
  shape(state, 'METROPOLIS', 14, { producers: 14 });                        // no Eruditos / Mercadores / Artesãos: any delta comes from the structure itself
  seat(state).research.push('web-writing', 'web-common-narratives', 'web-agriculture', 'web-masonry', 'web-exchange', 'web-guard-formations');
  Object.assign(seat(state).resources, { food: 12, wood: 12, stone: 12, wealth: 8 });
  return state;
}

describe('D-01 · Construir Marítimo shows no cost but charges 3 Madeira + 1 Pedra', () => {
  it('D-01 fixed: urbanCost for the Marítimo district is the price buildBlock/pay charge, districtEntry("MARITIME").cost', () => {
    const state = unlockedGame();
    const shown = urbanCost(state, P1, meta(state).cityId, 'BUILD', { build: { kind: 'MARITIME' } });
    expect(total(shown)).toBe(total(districtEntry('MARITIME').cost));
  });
});

describe('D-02 · the effect text of Construir (core catalog) against what Produzir really credits (cityYield)', () => {
  const rows = (kind: 'DISTRICT' | 'BUILDING') => {
    const state = unlockedGame();
    const id = meta(state).cityId;
    const options = urbanOptions(state, P1).cities[id]!.filter(option => option.action === 'BUILD' && option.build?.kind === kind);
    const base = cityYield(state, id).output;
    return options.map(option => {
      const trial = structuredClone(state);
      if (option.build?.kind === 'DISTRICT') meta(trial).districts.push(option.build.district); else if (option.build?.kind === 'BUILDING') meta(trial).buildings.push(option.build.building);
      const after = cityYield(trial, id).output;
      const delta = families({ ...emptyAlphaResourcePool(), ...Object.fromEntries(Object.keys(after).map(key => [key, (after as Record<string, number>)[key]! - (base as Record<string, number>)[key]!])) } as AlphaResourcePool);
      const name = option.build?.kind === 'DISTRICT' ? option.build.district : option.build?.kind === 'BUILDING' ? option.build.building : '?';
      return { name, shown: parseEffect(option.effect), applied: delta, effect: option.effect };
    });
  };
  it.fails('REPRO D-02a (UX/BUG): every district option announces exactly the yield cityYield credits', () => {
    const wrong = rows('DISTRICT').filter(row => JSON.stringify(row.shown) !== JSON.stringify(row.applied)).map(row => `${row.name}: texto ${JSON.stringify(row.shown)} x aplicado ${JSON.stringify(row.applied)}`);
    expect(wrong).toEqual([]);
  });
  it.fails('REPRO D-02b (UX/BUG): every building option announces exactly the yield cityYield credits (Mercado/Biblioteca/Oficina only unlock the 3rd pair of their role)', () => {
    const wrong = rows('BUILDING').filter(row => JSON.stringify(row.shown) !== JSON.stringify(row.applied)).map(row => `${row.name}: texto ${JSON.stringify(row.shown)} x aplicado ${JSON.stringify(row.applied)}`);
    expect(wrong).toEqual([]);
  });
  it('CHARACTERIZATION D-02: today the district rows that disagree are AGRARIAN (+1 vs +2 Alimento), INDUSTRIAL (+1 Madeira/Pedra vs +1 Madeira e +1 Pedra) and CULTURAL (+1 Influência vs +1 Cultura)', () => {
    const wrong = rows('DISTRICT').filter(row => JSON.stringify(row.shown) !== JSON.stringify(row.applied)).map(row => row.name).sort();
    expect(wrong).toEqual(['AGRARIAN', 'CULTURAL', 'INDUSTRIAL']);
  });
});

const buildingOf = (option: { build?: { kind: string } }): string => (option.build as { building?: string } | undefined)?.building ?? '';

describe('D-03 · buildings the Web unlocks but the Construir action never offers', () => {
  it('D-03 fixed (V1.2 B0): every building a Web advance unlocks is either offered by Construir or classified in ALPHA_BUILDING_CATALOG as not offered, with a reason (see tests/v12-fix-catalog.test.ts)', () => {
    const state = unlockedGame();
    const offered = new Set(urbanOptions(state, P1).cities[meta(state).cityId]!.filter(option => option.build?.kind === 'BUILDING').map(option => buildingOf(option)));
    const unlocked = new Set(ADVANCEMENTS.flatMap(node => node.unlocks.filter(tag => tag.startsWith('building:')).map(tag => tag.slice('building:'.length))));
    const silent = [...unlocked].filter(building => !offered.has(building) && !ALPHA_BUILDING_CATALOG.some(entry => entry.id === building && entry.path !== 'CORE' && entry.path !== 'CATALOG')).sort();
    // MANUFACTURE and MONUMENT are unlocked by the Web but exist neither in AlphaBuildingSchema nor in the canon building list of this phase.
    expect(silent).toEqual(['MANUFACTURE', 'MONUMENT']);
  });
  it('D-03 now: 13 buildings are offered: the 5 core buildings with a real effect and the 8 catalog buildings; the other 16 ids stay in the schema, not offered', () => {
    const state = unlockedGame();
    const offered = urbanOptions(state, P1).cities[meta(state).cityId]!.filter(option => option.build?.kind === 'BUILDING').map(option => buildingOf(option)).sort();
    expect(offered).toEqual(['ACADEMY', 'ARCHIVE', 'BANK', 'CHANCELLERY', 'FOUNDRY', 'GRANARY', 'LIBRARY', 'MARKET', 'TEMPLE', 'THEATER', 'TREASURY', 'WAREHOUSE', 'WORKSHOP']);
    expect(AlphaBuildingSchema.options.filter(building => !(offered as string[]).includes(building))).toHaveLength(16);
  });
});

describe('D-04 · the "Produção" page of the city card (cityDetails.production) is the legacy core estimate, not what Produzir credits', () => {
  it.fails('REPRO D-04 (UX/BUG): deriveCityProductionBreakdown (apps/server/src/alpha-projection.ts:56) and cityYield agree on a city with Eruditos and an Acadêmico district', () => {
    const state = freshGame();
    shape(state, 'VILLAGE', 6, { producers: 2, scholars: 4 });
    meta(state).districts.push('ACADEMIC'); coreCity(state).districts.push({ type: 'ACADEMIC', builtRound: 1 });
    const city = coreCity(state);
    const shown = deriveCityProductionBreakdown(city, state.core.players[0]!.civilization, state.core.config, state.core.map).total;
    const applied = cityYield(state, city.id).output;
    expect({ food: shown.food, knowledge: shown.knowledge, wealth: shown.wealth, materials: shown.materials }).toEqual({ food: applied.food, knowledge: applied.knowledge, wealth: applied.wealth, materials: applied.wood + applied.stone + applied.metal });
  });
});

import { describe, expect, it } from 'vitest';
import { AlphaBuildingSchema, ADVANCEMENTS, districtEntry, emptyAlphaResourcePool, type AlphaResourcePool } from '@aoh/game-domain';
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
  it.fails('REPRO D-01 (BUG/UX): urbanCost for the Marítimo district is empty while buildBlock/pay use districtEntry("MARITIME").cost (alpha-urban.ts:104-110,282)', () => {
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

describe('D-03 · buildings the Web unlocks but the Construir action never offers', () => {
  it.fails('REPRO D-03 (BUG): every building a Web advance unlocks ("building:X") is offered as a Construir option', () => {
    const state = unlockedGame();
    const offered = new Set(urbanOptions(state, P1).cities[meta(state).cityId]!.filter(option => option.build?.kind === 'BUILDING').map(option => option.build!.kind === 'BUILDING' ? option.build.building : ''));
    const unlocked = new Set(ADVANCEMENTS.flatMap(node => node.unlocks.filter(tag => tag.startsWith('building:')).map(tag => tag.slice('building:'.length))));
    // PORT arrives with the Marítimo district (alpha-urban.ts:285); the rest has no way in.
    const missing = [...unlocked].filter(building => !offered.has(building) && building !== 'PORT').sort();
    expect(missing).toEqual([]);
  });
  it('CHARACTERIZATION D-03: only the 7 buildings of the legacy core catalog are buildable (GRANARY MARKET LIBRARY ARCHIVE BARRACKS WORKSHOP CULTURAL_CENTER)', () => {
    const state = unlockedGame();
    const offered = urbanOptions(state, P1).cities[meta(state).cityId]!.filter(option => option.build?.kind === 'BUILDING').map(option => option.build!.kind === 'BUILDING' ? option.build.building : '').sort();
    expect(offered).toEqual(['ARCHIVE', 'BARRACKS', 'CULTURAL_CENTER', 'GRANARY', 'LIBRARY', 'MARKET', 'WORKSHOP']);
    expect(AlphaBuildingSchema.options.filter(building => !offered.includes(building))).toContain('TEMPLE');
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

import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, PlayerIdSchema, REGION_TEMPLATES, alphaRules, templateMetalDeposit, type AlphaState } from '@aoh/game-domain';
import {
  alphaGain, alphaGainLegacy, alphaStorageCapacity, beginAlphaPlanning, createAlphaGame, metalSites,
} from '@aoh/game-engine';
import { completeRound, must, readyAll, urban } from './alpha-rounds.js';

const p1 = PlayerIdSchema.parse('p1');
function created(): AlphaState { return createAlphaGame({ gameId: 'storage-alpha', seed: 51, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }); }
const pool = (state: AlphaState) => state.players[0]!.resources;

/** Gives p1 a worked, owned hex with the requested deposit and improvement. */
function mineSite(state: AlphaState, options: { deposit?: boolean; mine?: boolean; terrain?: 'HILLS' | 'MOUNTAINS' | 'PLAINS' } = {}) {
  const { deposit = true, mine = true, terrain = 'HILLS' } = options;
  const owner = state.core.players[0]!, city = owner.civilization.cities[0]!;
  const tile = state.core.map.find(t => t.terrain !== 'SEA' && t.terrain !== 'UNKNOWN' && !owner.civilization.cities.some(c => c.hexId === t.id) && t.id !== city.hexId)!;
  tile.terrain = terrain; tile.features = deposit ? ['METAL'] : []; tile.improvement = mine ? 'MINE' : null;
  tile.ownerId = p1; tile.controllerCityId = city.id;
  city.workedHexIds = [tile.id]; city.workers.producers = Math.max(1, city.workers.producers);
  return { tile, city };
}

describe('metal deposits', () => {
  it('places at most one deposit per region on its first mountain, else first hill', () => {
    for (const template of REGION_TEMPLATES) {
      const index = templateMetalDeposit(template);
      if (index === null) expect(template.terrain.some(t => t === 'HILLS' || t === 'MOUNTAINS')).toBe(false);
      else {
        expect(['HILLS', 'MOUNTAINS']).toContain(template.terrain[index]);
        if (template.terrain.includes('MOUNTAINS')) expect(template.terrain[index]).toBe('MOUNTAINS');
      }
    }
    expect(REGION_TEMPLATES.some(t => templateMetalDeposit(t) === null)).toBe(true);
  });

  it('marks deposits on generated maps, only on hills or mountains', () => {
    const state = created();
    const deposits = state.core.map.filter(t => t.features.includes('METAL'));
    expect(deposits.length).toBeGreaterThan(5);
    expect(deposits.every(t => t.terrain === 'HILLS' || t.terrain === 'MOUNTAINS')).toBe(true);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('is reproducible for the same seed', () => {
    const ids = (s: AlphaState) => s.core.map.filter(t => t.features.includes('METAL')).map(t => t.id);
    expect(ids(created())).toEqual(ids(created()));
  });
});

describe('metal production', () => {
  it('needs a producer, a deposit and a mine together, and is mined only by the PRODUCE action', () => {
    const state = created();
    const { tile, city } = mineSite(state);
    expect(metalSites(state, p1)).toEqual([{ cityId: city.id, hexId: tile.id }]);
    let round = beginAlphaPlanning(state);
    const before = round.players[0]!.resources.metal;
    round = readyAll(round);
    expect(round.phase).toBe('URBAN_ACTIONS');
    expect(round.players[0]!.resources.metal).toBe(before);
    round = must(round, p1, { type: 'URBAN_ACTION', cityId: city.id, action: 'PRODUCE' });
    expect(round.players[0]!.resources.metal).toBe(before + round.rules.balance.metalPerMine);
    expect(round.roundLedgers.find(l => l.playerId === p1)!.mining.materials).toBe(round.rules.balance.metalPerMine);
    expect(round.core.players[0]!.resources.materials).toBe(round.players[0]!.resources.wood + round.players[0]!.resources.stone + round.players[0]!.resources.metal);
  });

  it('gives a generic producer on a mountain no metal', () => {
    const state = created();
    mineSite(state, { deposit: false, mine: false, terrain: 'MOUNTAINS' });
    expect(metalSites(state, p1)).toEqual([]);
  });

  it('gives a deposit without a mine no metal', () => {
    const state = created();
    mineSite(state, { mine: false });
    expect(metalSites(state, p1)).toEqual([]);
  });

  it('gives a mine without a deposit no metal', () => {
    const state = created();
    mineSite(state, { deposit: false });
    expect(metalSites(state, p1)).toEqual([]);
  });

  it('gives an unworked deposit with a mine no metal', () => {
    const state = created();
    const { city } = mineSite(state);
    city.workedHexIds = [];
    expect(metalSites(state, p1)).toEqual([]);
  });

  it('gives an occupied city no metal until integrated', () => {
    const state = created();
    const { city } = mineSite(state);
    state.occupations.push({ cityId: city.id, occupierId: PlayerIdSchema.parse('p2'), previousOwnerId: p1, sinceRound: 1 });
    expect(metalSites(state, p1)).toEqual([]);
  });

  it('reports mining separately and keeps the report arithmetic valid', () => {
    const state = created();
    mineSite(state);
    const after = completeRound(beginAlphaPlanning(state), { produce: true });
    const report = after.roundReports.find(r => r.playerId === p1)!;
    expect(report.mining.materials).toBe(after.rules.balance.metalPerMine);
    expect(AlphaStateSchema.safeParse(after).success).toBe(true);
  });

  it('gives no metal when the city never takes PRODUCE', () => {
    const state = created();
    mineSite(state);
    const after = completeRound(beginAlphaPlanning(state));
    expect(after.roundReports.find(r => r.playerId === p1)!.mining.materials).toBe(0);
  });
});

describe('storage capacity', () => {
  it('scales base capacity with cities and building bonuses', () => {
    const state = created();
    const base = alphaStorageCapacity(state, p1);
    expect(base.foodCapacity).toBe(state.rules.balance.baseStorage.foodCapacity);
    state.cities.find(c => c.currentOwnerId === p1)!.buildings.push('GRANARY', 'WAREHOUSE');
    const after = alphaStorageCapacity(state, p1);
    expect(after.foodCapacity).toBe(base.foodCapacity + state.rules.balance.storagePerBuilding.GRANARY);
    expect(after.woodCapacity).toBe(base.woodCapacity + state.rules.balance.storagePerBuilding.WAREHOUSE);
  });

  it('discards overflow from an action-time gain and records it', () => {
    const state = created();
    const cap = alphaStorageCapacity(state, p1).foodCapacity;
    const events = state.events.length;
    alphaGain(state, p1, { food: 500 });
    expect(pool(state).food).toBe(cap);
    expect(state.core.players[0]!.resources.food).toBe(cap);
    expect(state.events.slice(events).some(e => e.type === 'STORAGE_DISCARD' && e.audience?.includes(p1))).toBe(true);
  });

  it('defers enforcement for maintenance producers when asked', () => {
    const state = created();
    alphaGain(state, p1, { food: 500 }, { enforceStorage: false });
    expect(pool(state).food).toBeGreaterThan(500);
  });

  it('applies to legacy-vocabulary gains such as material income', () => {
    const state = created();
    const cap = alphaStorageCapacity(state, p1);
    alphaGainLegacy(state, p1, { materials: 500 });
    expect(pool(state).wood).toBe(cap.woodCapacity);
    expect(pool(state).stone).toBe(cap.stoneCapacity);
  });

  it('never caps knowledge or influence', () => {
    const state = created();
    alphaGain(state, p1, { knowledge: 900, influence: 900 });
    expect(pool(state).knowledge).toBeGreaterThan(900);
    expect(pool(state).influence).toBeGreaterThan(900);
  });

  it('records maintenance discards in the round report and keeps its arithmetic', () => {
    const state = beginAlphaPlanning(created());
    alphaGain(state, p1, { food: 200, wood: 90, stone: 40, metal: 10 }, { enforceStorage: false });
    const after = completeRound(state);
    const cap = alphaStorageCapacity(after, p1);
    const report = after.roundReports.find(r => r.playerId === p1)!;
    expect(report.discarded.food).toBeGreaterThan(0);
    expect(report.discarded.materials).toBeGreaterThan(0);
    expect(report.closing.food).toBeLessThanOrEqual(cap.foodCapacity);
    expect(after.events.some(e => e.type === 'STORAGE_DISCARD' && e.audience?.includes(p1))).toBe(true);
    expect(AlphaStateSchema.safeParse(after).success).toBe(true);
  });

  it('keeps purchases working under the caps', () => {
    const state = readyAll(beginAlphaPlanning(created()));
    const result = urban(state, p1, 'RESEARCH', { advancementId: 'adv-1-1-1' });
    expect(result.ok).toBe(true);
  });

  it('uses one central balance for the cap and metal rate', () => {
    const balance = alphaRules('STANDARD').balance;
    expect(balance.metalPerMine).toBe(1);
    expect(balance.baseStorage.metalCapacity).toBeGreaterThan(0);
  });
});

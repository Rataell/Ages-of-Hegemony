import { describe, expect, it } from 'vitest';
import { LocalPlay } from '../apps/server/src/local-play.js';

describe('Local Development Gameplay Session', () => {
  it.each([2,3,4,5,6])('starts a fixed map for %i players and reveals no private opponent fields', async count => {
    const local = new LocalPlay(); const token = await local.start(count); const data = await local.view(token);
    expect(data.players).toHaveLength(count); expect(data.view.playerCount).toBe(count);
    expect(data.view.visibleTerritory.length).toBe(count === 2 ? 84 : count <= 4 ? 126 : 168);
    expect(data.view.visibleCities).toHaveLength(count - 1);
    expect(data.view.visibleCities[0]).not.toHaveProperty('workers');
    expect(data).not.toHaveProperty('seed'); expect(data).not.toHaveProperty('eventLog');
    expect(data.events.every(e => 'playerId' in e && e.playerId === data.view.player.id)).toBe(true);
  });
  it('executes the entire management loop and reconciles resource display', async () => {
    const local = new LocalPlay(); const token = await local.start(2);
    let data = await local.view(token, 'capital-1', '3,2');
    const command = async (input: Record<string, unknown>) => {
      const result = await local.command(token, { ...input, playerId: data.view.player.id, expectedVersion: data.view.version });
      expect(result.ok, JSON.stringify(result)).toBe(true);
      data = await local.view(token, 'capital-1', '3,2');
    };
    const advance = async () => {
      expect((await local.advance(token, data.view.version)).ok).toBe(true);
      data = await local.view(token, 'capital-1', '3,2');
    };
    expect(data.actions.find(a => a.command.type === 'CLAIM_HEX')?.reason).toContain('WRONG_PHASE');
    await advance();
    await command({ type: 'ADOPT_GOVERNMENT', government: 'MONARCHY' });
    await command({ type: 'ASSIGN_POPULATION', cityId: 'capital-1', workers: { producers: 2, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned: 0 } });
    expect(data.claimable).toContain('3,2');
    const influence = data.view.player.resources.influence;
    await command({ type: 'CLAIM_HEX', cityId: 'capital-1', hexId: '3,2' });
    expect(data.view.player.resources.influence).toBe(influence - data.view.config.territory.claimCost.influence);
    await command({ type: 'ASSIGN_WORKED_HEXES', cityId: 'capital-1', hexIds: ['3,2'] });
    const action = data.actions.find(a => a.command.type === 'IMPROVE_HEX' && a.command.improvement === 'FARM');
    expect(action?.available).toBe(true); expect(action?.yieldAfter?.food).toBe(4);
    await command({ type: 'IMPROVE_HEX', hexId: '3,2', improvement: 'FARM' });
    await command({ type: 'BUILD_DISTRICT', cityId: 'capital-1', district: 'AGRARIAN' });
    await command({ type: 'BUILD_BUILDING', cityId: 'capital-1', building: 'GRANARY' });
    await command({ type: 'SPECIALIZE_CITY', cityId: 'capital-1', specialization: 'AGRARIAN' });
    await command({ type: 'DEVELOP_CITY', cityId: 'capital-1' });
    await command({ type: 'DEVELOP_CITY', cityId: 'capital-1' });
    await command({ type: 'CLAIM_HEX', cityId: 'capital-1', hexId: '4,2' });
    await command({ type: 'FOUND_CITY', cityId: 'frontier', hexId: '4,2', name: 'Fronteira' });
    expect(data.view.player.civilization.cities).toHaveLength(2);
    const before = data.view.player.resources.food;
    for (let i=0;i<5;i++) await advance();
    expect(data.view.round).toBe(2); expect(data.view.phase).toBe('PLANNING');
    expect(data.view.player.resources.food).toBe(before + (data.view.lastEconomy?.breakdown?.netChange.food ?? NaN));
    expect(data.events.some(e => e.type === 'BUILDING_BUILT')).toBe(true);
    const selected = await local.view(token, 'frontier'); expect(selected.selectedCityId).toBe('frontier');
  });
  it('keeps ownership unchanged across perspectives and rejects spoofing, stale commands and scheduler injection', async () => {
    const local = new LocalPlay(); const token = await local.start(2); let data = await local.view(token);
    await local.advance(token, data.view.version); data = await local.view(token);
    const ownership = data.view.visibleTerritory.map(t => [t.id,t.ownerId,t.controllerCityId]);
    await local.perspective(token, 'player-2'); data = await local.view(token);
    expect(data.view.visibleTerritory.map(t => [t.id,t.ownerId,t.controllerCityId])).toEqual(ownership);
    const base = { expectedVersion: data.view.version, type: 'DEVELOP_CITY', cityId: 'capital-1' };
    expect(await local.command(token, { ...base, playerId: 'player-1' })).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect(await local.command(token, { ...base, playerId: 'player-2' })).toMatchObject({ ok: false, error: { code: 'CITY_NOT_OWNED' } });
    expect(await local.command(token, { ...base, cityId: 'capital-2', playerId: 'player-2', expectedVersion: 0 })).toMatchObject({ ok: false, error: { code: 'VERSION_CONFLICT' } });
    expect(await local.command(token, { type: 'ADVANCE_PHASE', expectedVersion: data.view.version, nextPhase: 'RESOLUTION' })).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect((await local.view(token)).view.version).toBe(data.view.version);
  });
  it('serializes competing writes through repository compare-and-swap', async () => {
    const local = new LocalPlay(); const token = await local.start(2); let data = await local.view(token);
    await local.advance(token, data.view.version); data = await local.view(token);
    const command = { type: 'DEVELOP_CITY', cityId: 'capital-1', playerId: 'player-1', expectedVersion: data.view.version };
    const results = await Promise.all([local.command(token, command), local.command(token, command)]);
    expect(results.filter(r => r.ok)).toHaveLength(1);
    expect(results.find(r => !r.ok)).toMatchObject({ error: { code: 'VERSION_CONFLICT' } });
  });
  it('rejects invalid sessions and player counts', async () => {
    const local = new LocalPlay();
    await expect(local.start(1)).rejects.toThrow(); await expect(local.start(7)).rejects.toThrow();
    await expect(local.view('unknown')).rejects.toThrow();
    const token = await local.start(2); await expect(local.perspective(token, 'player-6')).rejects.toThrow();
  });
});

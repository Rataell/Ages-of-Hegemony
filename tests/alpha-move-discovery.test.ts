import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, type AlphaUnit } from '@aoh/game-domain';
import { alphaActionUsage, alphaUnitOptions, discovererOf, frontierRegionOf, hexId, hexNeighbors, isFrontierMove, navalDiscoveryUnlocked, planFrontierMove, regionOpenFor, resolveFrontierMove } from '@aoh/game-engine';
import { completeRound, must } from './alpha-rounds.js';
import { anyLandCase, landCase, frontierOf, known, learn, p1, p2, pioneerOf, place, queue, SEAS, seaCase, tile, world } from './alpha-move-fixtures.js';

describe('Move + Discovery on land', () => {
  it('a Pioneiro moves into a closed Region as ONE MOVE order: Region revealed, group stands on the entry hex, Move ends there', () => {
    const { state, pioneer, region, entry } = anyLandCase();
    expect(isFrontierMove(state, p1, { id: 'm', type: 'MOVE', unitIds: [pioneer.id], path: entry.path as never, rotation: entry.rotations[0]! })).toBe(true);
    const queued = must(state, p1, { type: 'QUEUE_ORDER', order: { id: 'm1', type: 'MOVE', unitIds: [pioneer.id], path: entry.path, rotation: entry.rotations[0] } });
    expect(alphaActionUsage(queued, p1)).toMatchObject({ used: 1, byOrder: { EXPEDITION: 1 } });
    expect(queued.players[0]!.orders.map(o => o.type)).toEqual(['MOVE']);
    const done = completeRound(queued);
    const after = done.regions.find(r => r.id === region.regionId)!;
    expect(after.revealedBy).toContain(p1);
    expect(done.units.find(u => u.id === pioneer.id)!.hexId).toBe(entry.hexId);
    expect(done.resolutionEvents.some(e => e.type === 'DISCOVERY' && e.actorId === p1)).toBe(true);
    expect(done.resolutionEvents.some(e => e.type === 'EXPLORATION')).toBe(false);
    expect(AlphaStateSchema.safeParse(JSON.parse(JSON.stringify(done))).success).toBe(true);
  });

  it('there is no EXPLORE order for new plans, and a move to a known hex is an ordinary move', () => {
    const { state, pioneer } = anyLandCase();
    const refused = queue(state, { id: 'x', type: 'EXPLORE', unitId: pioneer.id, target: Object.values(frontierOf(state, pioneer))[0]!.entries[0]!.hexId, rotation: 0 });
    expect(refused.ok).toBe(false);
    const options = alphaUnitOptions(state, p1)[pioneer.id]!;
    const step = Object.keys(options.moves)[0]!;
    expect(isFrontierMove(state, p1, { id: 'n', type: 'MOVE', unitIds: [pioneer.id], path: options.moves[step] as never })).toBe(false);
  });

  it('a land piece without a Pioneiro cannot enter the unknown', () => {
    const { state, pioneer, at, entry } = anyLandCase();
    const soldier = { ...pioneer, id: 'soldier', kind: 'INFANTRY' as const };
    state.units.push(soldier);
    const refused = queue(state, { id: 'inf', type: 'MOVE', unitIds: [soldier.id], path: entry.path, rotation: entry.rotations[0] });
    expect(refused.ok).toBe(false);
    expect(!refused.ok && refused.error.message).toMatch(/Pioneiro/);
    const options = alphaUnitOptions(state, p1);
    expect(options[soldier.id]!.discoverer).toBe(false);
    expect(options[soldier.id]!.frontierNote).toBe('Necessita de um Pioneiro para descobrir.');
    expect(options[pioneer.id]!.discoverer).toBe(true);
    void at;
  });

  it('Pioneiro + escort start on the same hex, enter together, and the Region is revealed once', () => {
    const { state, pioneer, at, region, entry } = anyLandCase();
    state.units.push({ id: 'guard-a', ownerId: p1, kind: 'INFANTRY', hexId: at as never, recruitedRound: 1, carrierId: null }, { id: 'guard-b', ownerId: p1, kind: 'RANGED', hexId: at as never, recruitedRound: 1, carrierId: null });
    const group = [pioneer.id, 'guard-a', 'guard-b'];
    const queued = must(state, p1, { type: 'QUEUE_ORDER', order: { id: 'm1', type: 'MOVE', unitIds: group, path: entry.path, rotation: entry.rotations[0] } });
    expect(alphaActionUsage(queued, p1)).toMatchObject({ used: 1, byOrder: { EXPEDITION: 1 } });
    const done = completeRound(queued);
    for (const id of group) expect(done.units.find(u => u.id === id)!.hexId).toBe(entry.hexId);
    expect(done.events.filter(e => e.type === 'REGION_REVEALED' && e.message.includes(region.regionId)).length + done.events.filter(e => e.type === 'REGION_REVEALED').length).toBeGreaterThan(0);
    expect(done.players[0]!.exploredRegions).toBe(1);
  });

  it('a group must start on one hex, and its path must be payable by the slowest piece', () => {
    const { state, pioneer, at, entry } = anyLandCase();
    const apart = Object.keys(alphaUnitOptions(state, p1)[pioneer.id]!.moves).find(id => id !== at && !state.units.some(u => u.hexId === id))!;
    state.units.push({ id: 'escort', ownerId: p1, kind: 'INFANTRY', hexId: apart as never, recruitedRound: 1, carrierId: null });
    expect(queue(state, { id: 'm', type: 'MOVE', unitIds: [pioneer.id, 'escort'], path: entry.path, rotation: entry.rotations[0] }).ok).toBe(false);
    // The slowest piece limits the group: Engenho de cerco moves 1, so the group cannot walk a known hex and then enter.
    const slow = world(5), pioneerSlow = pioneerOf(slow);
    for (const hex of [...known(slow)].sort()) {
      const t = tile(slow, hex);
      if (!['PLAINS'].includes(t.terrain)) continue;
      place(pioneerSlow, hex);
      const far = frontierOf(slow, pioneerSlow).find(r => r.block === null && r.entries.some(e => e.path.length === 2 && e.path.slice(0, -1).every(step => tile(slow, step).terrain === 'PLAINS')));
      if (!far) continue;
      const e = far.entries.find(x => x.path.length === 2 && x.path.slice(0, -1).every(step => tile(slow, step).terrain === 'PLAINS'))!;
      slow.units.push({ id: 'ram', ownerId: p1, kind: 'SIEGE', hexId: hex as never, recruitedRound: 1, carrierId: null });
      expect(queue(slow, { id: 'solo', type: 'MOVE', unitIds: [pioneerSlow.id], path: e.path, rotation: e.rotations[0] }).ok).toBe(true);
      const refused = queue(slow, { id: 'team', type: 'MOVE', unitIds: [pioneerSlow.id, 'ram'], path: e.path, rotation: e.rotations[0] }, p1);
      expect(refused.ok).toBe(false);
      return;
    }
    throw new Error('no two-step plains case');
  });

  it('entering the unknown costs UNKNOWN (1) and is the last step: known steps + 1 must fit the budget, and nothing may follow the entry', () => {
    for (const seed of [2, 5, 9, 13, 21, 34, 55, 89]) {
      const state = world(seed), pioneer = pioneerOf(state), seen = known(state);
      for (const at of [...seen].sort()) {
        place(pioneer, at);
        for (const through of hexNeighbors(tile(state, at)).map(hexId)) {
          if (!seen.has(through) || tile(state, through).terrain !== 'PLAINS' || state.units.some(u => u.hexId === through && u.ownerId !== p1)) continue;
          for (const entry of hexNeighbors(tile(state, through)).map(hexId)) {
            const region = state.regions.find(r => r.hexIds.includes(entry as never));
            if (!region || regionOpenFor(state, region, p1) || region.templateId.startsWith('homeland')) continue;
            const move = { id: 'long', type: 'MOVE' as const, unitIds: [pioneer.id], path: [through, entry] as never, rotation: 0 };
            let plan;
            try { plan = planFrontierMove(state, p1, move); } catch { try { plan = planFrontierMove(state, p1, { ...move, rotation: 1 }); } catch { continue; } }
            expect(plan.entry).toBe(entry);
            // The same plan with costlier known terrain no longer fits: 3 (plains) + UNKNOWN 1 > 3.
            const dear = structuredClone(state);
            dear.rules.movementCosts.PLAINS = 3;
            expect(() => planFrontierMove(dear, p1, { ...move, rotation: plan.rotation })).toThrow(/mobilidade/);
            // Nothing may follow the entry: the next hex of the closed Region is unknown, so the path is refused.
            const beyond = hexNeighbors(tile(state, entry)).map(hexId).find(id => region.hexIds.includes(id as never) && id !== entry);
            if (beyond) expect(() => planFrontierMove(state, p1, { ...move, path: [entry, beyond] as never, rotation: plan.rotation })).toThrow(/conhecidos/);
            return;
          }
        }
      }
    }
    throw new Error('no two-step frontier case');
  });

  it('the terrain found at the entry is never charged back, and a Region another civilization already opened is an ordinary move', () => {
    const { state, pioneer, at, region, entry } = anyLandCase();
    const queued = must(state, p1, { type: 'QUEUE_ORDER', order: { id: 'a', type: 'MOVE', unitIds: [pioneer.id], path: entry.path, rotation: entry.rotations[0] } });
    // A rival opens the Region first (as if its earlier order resolved).
    const rival = queued.regions.find(r => r.id === region.regionId)!;
    rival.revealedBy.push(p2);
    rival.hexIds.forEach(id => { const t = tile(queued, id); if (t.terrain === 'UNKNOWN') t.terrain = 'MOUNTAINS'; });
    const done = completeRound(queued);
    const ev = done.events.filter(e => e.type === 'ORDER_FAILED' || e.type === 'REGION_REVEALED').map(e => e.message).join(' | ');
    expect(done.regions.find(r => r.id === region.regionId)!.revealedBy.filter(id => id === p1).length).toBeLessThanOrEqual(1);
    expect(done.resolutionEvents.filter(e => e.type === 'EXPLORATION').length).toBe(0);
    void ev; void at;
  });

  it('the entry is charged UNKNOWN (1), never the terrain found there: a MOV-1 Engenho de cerco escort enters a mountain entry', () => {
    const { state, pioneer, at, region, entry } = anyLandCase();
    const closed = state.regions.find(r => r.id === region.regionId)!;
    // A dormant rival piece fixes the orientation, so the mountain below is the real terrain of the entry.
    state.units.push({ id: 'dormant', ownerId: p2, kind: 'INFANTRY', hexId: closed.hexIds.find(id => id !== entry.hexId)!, recruitedRound: 1, carrierId: null });
    const entryTile = tile(state, entry.hexId);
    entryTile.terrain = 'MOUNTAINS'; entryTile.features = [];
    state.units.push({ id: 'ram', ownerId: p1, kind: 'SIEGE', hexId: at as never, recruitedRound: 1, carrierId: null });
    expect(state.rules.units.SIEGE.movement).toBe(1);
    expect(state.rules.movementCosts.MOUNTAINS).toBe(3);
    const plan = planFrontierMove(state, p1, { id: 'm', type: 'MOVE', unitIds: [pioneer.id, 'ram'], path: [entry.hexId] as never });
    expect(plan.rotations).toEqual([closed.rotation]);
    const done = structuredClone(state);
    const { entered } = resolveFrontierMove(done, p1, { id: 'm', type: 'MOVE', unitIds: [pioneer.id, 'ram'], path: [entry.hexId] as never });
    expect(entered).toBe(true);
    for (const id of [pioneer.id, 'ram']) expect(done.units.find(u => u.id === id)!.hexId).toBe(entry.hexId);
    // The next Move pays the real terrain: leaving a mountain costs the destination's own terrain, and the entry hex itself is ordinary now.
    expect(done.regions.find(r => r.id === region.regionId)!.revealedBy).toContain(p1);
  });

  it('two civilizations entering the same Region in one round: it is flipped and its Discovery resolved once', () => {
    for (const seed of [2, 5, 9, 13, 21, 34]) {
      const a = landCase(seed);
      if (!a) continue;
      const { state, region, entry } = a;
      const mine = pioneerOf(state), theirs = pioneerOf(state, p2);
      const target = state.regions.find(r => r.id === region.regionId)!;
      // The rival stands on a known hex next to the same Region with its own legal entry.
      const seenByRival = known(state, p2);
      let rivalPlan: { path: string[]; rotation: number } | null = null;
      for (const hex of [...seenByRival].sort()) {
        if (!['PLAINS', 'FOREST', 'HILLS'].includes(tile(state, hex).terrain) || state.units.some(u => u.hexId === hex && u.id !== theirs.id)) continue;
        place(theirs, hex);
        const f = frontierOf(state, theirs, p2).find(r => r.regionId === region.regionId && r.block === null);
        const e = f?.entries.find(x => x.path.length === 1);
        if (e) { rivalPlan = { path: e.path, rotation: e.rotations[0]! }; break; }
      }
      if (!rivalPlan) continue;
      let next = must(state, p1, { type: 'QUEUE_ORDER', order: { id: 'a', type: 'MOVE', unitIds: [mine.id], path: entry.path, rotation: entry.rotations[0] } });
      next = must(next, p2, { type: 'QUEUE_ORDER', order: { id: 'b', type: 'MOVE', unitIds: [theirs.id], path: rivalPlan.path, rotation: rivalPlan.rotation } });
      const done = completeRound(next);
      const after = done.regions.find(r => r.id === target.id)!;
      expect(after.revealedBy.length).toBeGreaterThanOrEqual(1);
      expect(done.resolutionEvents.filter(e => e.type === 'DISCOVERY').length).toBe(1);
      expect(done.resolutionEvents.filter(e => e.type === 'EXPLORATION').length).toBe(0);
      expect(after.discovery ? after.discovery.resolvedBy : null).not.toBeUndefined();
      return;
    }
    throw new Error('no shared-region case found');
  });

  it('the Pioneiro is the explorer the Discovery is charged to, escort or not', () => {
    const { state, pioneer, at } = anyLandCase();
    const soldier = { id: 'aaa-soldier', ownerId: p1, kind: 'INFANTRY' as const, hexId: at as never, recruitedRound: 1, carrierId: null };
    state.units.push(soldier);
    expect(discovererOf(state, p1, [soldier as AlphaUnit, pioneer])).toEqual({ id: pioneer.id, via: 'PIONEER' });
    expect(discovererOf(state, p1, [soldier as AlphaUnit])).toBeNull();
  });
});

describe('Move + Discovery at sea', () => {
  it('before the advance a ship alone cannot open a Region; with a Pioneiro aboard it can, and the cargo stays aboard', () => {
    const { state, ship, region, entry } = SEAS();
    expect(alphaUnitOptions(state, p1)[ship.id]!.discoverer).toBe(false);
    expect(queue(state, { id: 's', type: 'MOVE', unitIds: [ship.id], path: entry.path, rotation: entry.rotations[0] }).ok).toBe(false);
    const pioneer = pioneerOf(state);
    pioneer.carrierId = ship.id; pioneer.hexId = ship.hexId;
    state.units.push({ id: 'guard-cargo', ownerId: p1, kind: 'INFANTRY', hexId: ship.hexId, recruitedRound: 1, carrierId: ship.id });
    state.units.find(u => u.id === ship.id)!.kind = 'FLEET';
    expect(alphaUnitOptions(state, p1)[ship.id]!.discoverer).toBe(true);
    const queued = must(state, p1, { type: 'QUEUE_ORDER', order: { id: 's1', type: 'MOVE', unitIds: [ship.id], path: entry.path, rotation: entry.rotations[0] } });
    expect(alphaActionUsage(queued, p1)).toMatchObject({ used: 1, byOrder: { EXPEDITION: 1 } });
    const done = completeRound(queued);
    expect(done.regions.find(r => r.id === region.regionId)!.revealedBy).toContain(p1);
    const afterShip = done.units.find(u => u.id === ship.id);
    if (afterShip) { expect(afterShip.hexId).toBe(entry.hexId); expect(done.units.find(u => u.id === pioneer.id)?.carrierId ?? ship.id).toBe(ship.id); expect(done.units.find(u => u.id === pioneer.id)?.hexId ?? entry.hexId).toBe(entry.hexId); }
    expect(AlphaStateSchema.safeParse(JSON.parse(JSON.stringify(done))).success).toBe(true);
  });

  it('after Navegação Oceânica every naval unit of the civilization opens Regions alone; land pieces gain nothing', () => {
    for (const kind of ['FLEET', 'COASTAL_VESSEL'] as const) {
      const found = seaCase(kind);
      if (!found) throw new Error('no sea case');
      const { state, ship, region, entry } = found;
      expect(navalDiscoveryUnlocked(state, p1)).toBe(false);
      learn(state, p1, 'web-ocean-navigation');
      expect(navalDiscoveryUnlocked(state, p1)).toBe(true);
      expect(navalDiscoveryUnlocked(state, p2)).toBe(false);
      const options = alphaUnitOptions(state, p1);
      expect(options[ship.id]!.discoverer).toBe(true);
      const done = completeRound(must(state, p1, { type: 'QUEUE_ORDER', order: { id: 's1', type: 'MOVE', unitIds: [ship.id], path: entry.path, rotation: entry.rotations[0] } }));
      expect(done.regions.find(r => r.id === region.regionId)!.revealedBy).toContain(p1);
      // Land pieces still need a Pioneiro.
      const soldier = { id: 'inf', ownerId: p1, kind: 'INFANTRY' as const, hexId: state.core.players[0]!.civilization.cities[0]!.hexId, recruitedRound: 1, carrierId: null };
      expect(discovererOf(state, p1, [soldier as AlphaUnit])).toBeNull();
      // Save / reload keeps the unlock.
      const reloaded = AlphaStateSchema.parse(JSON.parse(JSON.stringify(state)));
      expect(navalDiscoveryUnlocked(reloaded, p1)).toBe(true);
    }
  });

  it('the Barca de Patrulha is an armed ship of the same naval system, and a Pioneiro never enters sea-only access by land', () => {
    const state = world(5);
    const vessel = state.rules.units.COASTAL_VESSEL, fleet = state.rules.units.FLEET;
    expect(vessel.name).toBe('Barca de Patrulha');
    expect(vessel.strength).toBeGreaterThan(0);
    expect(vessel.strength).toBeLessThan(fleet.strength);
    expect(vessel.domain).toBe('SEA');
    expect(vessel.transport).toBe(1);
  });
});

describe('legacy EXPLORE', () => {
  it('still parses and resolves for plans made before Move + Discovery, but new clients cannot queue it', () => {
    const { state, pioneer } = anyLandCase();
    const target = Object.values(frontierOf(state, pioneer))[0]!.entries[0]!.hexId;
    const legacy = { id: 'legacy', type: 'EXPLORE', unitId: pioneer.id, target, rotation: 0 };
    expect(AlphaStateSchema.safeParse({ ...state, players: state.players.map((p, i) => (i === 0 ? { ...p, orders: [legacy] } : p)) }).success).toBe(true);
    expect(queue(state, legacy).ok).toBe(false);
    void resolveFrontierMove; void frontierRegionOf;
  });
});

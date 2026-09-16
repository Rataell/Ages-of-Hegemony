import { describe, expect, it } from 'vitest';
import { addResource, canAfford, createSeededRandom, hexDistance, hexId, hexNeighbors, randomStep, spendResource } from '@aoh/game-engine';
import { emptyResourcePool, ResourceTypeSchema } from '@aoh/game-domain';
import { deepFreeze, unwrap } from './helpers.js';

describe('resource arithmetic', () => {
  it.each(ResourceTypeSchema.options)('adds and spends %s without mutating input', (type) => {
    const empty = deepFreeze(emptyResourcePool());
    const filled = unwrap(addResource(empty, type, 10));
    expect(unwrap(spendResource(deepFreeze(filled), type, 10))).toEqual(empty);
    expect(spendResource(filled, type, 11)).toMatchObject({ ok: false, error: { code: 'INSUFFICIENT_RESOURCES' } });
  });
  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid amount %s', (amount) => {
    expect(addResource(emptyResourcePool(), 'FOOD', amount).ok).toBe(false);
    expect(spendResource(emptyResourcePool(), 'FOOD', amount).ok).toBe(false);
  });
  it('rejects overflow and already-invalid pools', () => {
    expect(addResource({ ...emptyResourcePool(), food: Number.MAX_SAFE_INTEGER }, 'FOOD', 1).ok).toBe(false);
    expect(addResource({ ...emptyResourcePool(), food: -1 }, 'WEALTH', 1).ok).toBe(false);
  });
  it('checks every resource and permits exact or zero costs', () => {
    const pool = { food: 1, materials: 2, wealth: 3, knowledge: 4, influence: 5 };
    expect(canAfford(pool, pool)).toBe(true);
    expect(canAfford(pool, emptyResourcePool())).toBe(true);
    for (const key of Object.keys(pool) as (keyof typeof pool)[]) expect(canAfford(pool, { ...emptyResourcePool(), [key]: pool[key] + 1 })).toBe(false);
    expect(canAfford(pool, { ...emptyResourcePool(), food: -1 })).toBe(false);
  });
});

describe('axial hexagons', () => {
  it('provides canonical identities and six distinct adjacent neighbors', () => {
    expect(hexId({ q: -2, r: 3 })).toBe('-2,3');
    const center = { q: 3, r: -7 };
    const neighbors = hexNeighbors(center);
    expect(new Set(neighbors.map(hexId)).size).toBe(6);
    for (const neighbor of neighbors) {
      expect(hexDistance(center, neighbor)).toBe(1);
      expect(hexNeighbors(neighbor)).toContainEqual(center);
    }
  });
  it('measures signed-coordinate distance symmetrically', () => {
    const a = { q: -3, r: 2 };
    const b = { q: 4, r: -1 };
    expect(hexDistance(a, a)).toBe(0);
    expect(hexDistance(a, b)).toBe(7);
    expect(hexDistance(b, a)).toBe(7);
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: 3 })).toBe(5);
  });
});

describe('seeded random source', () => {
  it('has a locked sequence, supports seed zero and differs by seed', () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    const sequence = Array.from({ length: 1000 }, () => a.next());
    expect(sequence).toEqual(Array.from({ length: 1000 }, () => b.next()));
    expect(sequence[0]).toBe(0.6011037519201636);
    expect(sequence.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(createSeededRandom(0).next()).not.toBe(sequence[0]);
    expect(createSeededRandom(43).next()).not.toBe(sequence[0]);
  });
  it('resumes at an explicit state without hidden engine randomness', () => {
    const random = createSeededRandom(123);
    random.next(); random.next();
    const snapshot = random.snapshot();
    const resumed = createSeededRandom(snapshot);
    expect(resumed.next()).toBe(random.next());
    expect(randomStep(snapshot)).toEqual(randomStep(snapshot));
    expect(() => createSeededRandom(-1)).toThrow();
  });
});

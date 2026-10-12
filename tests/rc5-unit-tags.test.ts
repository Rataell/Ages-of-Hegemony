import { describe, expect, it } from 'vitest';
import { ADVANCEMENTS, AlphaEraSchema, AlphaUnitClassSchema, CIVILIZATIONS, type AlphaState } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame, recruitBlock, unitAdvance, urbanOptions } from '@aoh/game-engine';
import { grant } from './alpha-grant.js';
import { coreCity, freshGame, meta, seat, P1 } from './v12-audit-urban-helpers.js';

/**
 * RC5: the `unit:*` tags of the Teia are recruiting prerequisites (canon §11 "Peça × Avanço"). Guarda, Atiradores, Cavalaria, Cerco, Frota and Barca need the advance that opens them;
 * Infantaria, Pioneiro and Enviado need none, so every civilization can raise a basic army from the first round. Engine, options list and the interface share one check (`recruitBlock`).
 */
const OPENING: Record<string, string> = { GUARD: 'web-guard-formations', RANGED: 'web-metallurgy', CAVALRY: 'web-maneuver-training', SIEGE: 'web-engineering', FLEET: 'web-cartography', COASTAL_VESSEL: 'web-coastal-navigation' };
const eraIndex = (era: string) => AlphaEraSchema.options.indexOf(era as never);

describe('which advance opens which piece (single source: the Teia tags)', () => {
  it('matches the canon table for every recruitable class, and Infantaria, Pioneiro and Enviado have none', () => {
    for (const kind of AlphaUnitClassSchema.options) expect(unitAdvance(kind)?.id ?? null, kind).toBe(OPENING[kind] ?? null);
  });
  it('no piece is opened by an advance of a later Era than the piece itself (nothing is sold earlier than its advance)', () => {
    const freshRules = freshGame().rules.units;
    for (const [kind, advance] of Object.entries(OPENING)) {
      const node = ADVANCEMENTS.find(candidate => candidate.id === advance)!;
      expect(eraIndex(node.era), `${kind} advance ${advance} (${node.era}) vs piece Era ${freshRules[kind as keyof typeof freshRules].era}`).toBeLessThanOrEqual(eraIndex(freshRules[kind as keyof typeof freshRules].era));
    }
  });
});

describe('the engine, the options list and the reason shown agree', () => {
  const ready = (kind: keyof typeof OPENING) => {
    const state = freshGame(); seat(state).era = 'ASCENSION';
    meta(state).districts.push('MILITARY'); coreCity(state).districts.push({ type: 'MILITARY', builtRound: 1 } as never);
    return { state, kind };
  };
  it.each(Object.keys(OPENING))('%s is refused with the advance named, and accepted past that gate once researched', kind => {
    const { state } = ready(kind as keyof typeof OPENING);
    const name = ADVANCEMENTS.find(node => node.id === OPENING[kind])!.name;
    expect(recruitBlock(state, P1, meta(state).cityId, kind as never)).toBe(`Exige o avanço da Teia ${name}.`);
    const option = urbanOptions(state, P1).cities[meta(state).cityId]!.find(entry => entry.action === 'RECRUIT' && entry.unit === kind);
    expect(option?.blocked).toBe(`Exige o avanço da Teia ${name}.`);
    grant(state, P1, OPENING[kind]!);
    expect(String(recruitBlock(state, P1, meta(state).cityId, kind as never))).not.toMatch(/Exige o avanço/);
  });
});

describe('every civilization can raise a basic army from round 1 with no research', () => {
  const playable = CIVILIZATIONS.map(civilization => civilization.id).filter(id => { try { return createAlphaGame({ gameId: 'probe', seed: 1, preset: 'QUICK', players: [{ id: 'p1', name: 'A', civilization: id }, { id: 'p2', name: 'B', civilization: id === 'aurelia' ? 'valgard' : 'aurelia' }] }) !== undefined; } catch { return false; } });
  it.each(playable)('%s: Infantaria, Pioneiro and Enviado are never gated by an advance', civilization => {
    const state: AlphaState = beginAlphaPlanning(createAlphaGame({ gameId: `army-${civilization}`, seed: 3, preset: 'QUICK', players: [{ id: 'p1', name: 'A', civilization }, { id: 'p2', name: 'B', civilization: civilization === 'aurelia' ? 'valgard' : 'aurelia' }] }));
    expect(seat(state).research).toEqual([]);
    for (const kind of ['INFANTRY', 'PIONEER', 'ENVOY'] as const) expect(String(recruitBlock(state, P1, meta(state).cityId, kind)), `${civilization} ${kind}`).not.toMatch(/Exige o avanço/);
    const infantry = urbanOptions(state, P1).cities[meta(state).cityId]!.find(entry => entry.action === 'RECRUIT' && entry.unit === 'INFANTRY');
    expect(infantry?.blocked ?? null).not.toMatch(/avanço/);
  });
  it('the starting pieces (the free Guarda of Valgard, the Pioneiros) are placed units: enforcement is not retroactive', () => {
    const state = beginAlphaPlanning(createAlphaGame({ gameId: 'valgard-start', seed: 3, preset: 'QUICK', players: [{ id: 'p1', name: 'A', civilization: 'valgard' }, { id: 'p2', name: 'B', civilization: 'aurelia' }] }));
    expect(state.units.filter(unit => unit.ownerId === 'p1' && unit.kind === 'GUARD')).toHaveLength(1);
    expect(seat(state).research).toEqual([]);
  });
});

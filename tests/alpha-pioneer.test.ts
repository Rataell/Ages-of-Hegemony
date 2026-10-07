import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, AlphaUnitClassSchema, PlayerIdSchema, alphaUnitCatalog } from '@aoh/game-domain';
import { alphaUnitOptions, applyAlphaCommand, beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';

const p1 = PlayerIdSchema.parse('p1');
const game = () => beginAlphaPlanning(createAlphaGame({ gameId: 'pioneer', seed: 8, preset: 'STANDARD', players: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] }));

describe('Pioneiro: the one civil piece that explores and founds', () => {
  it('has no separate Explorador class anywhere in the domain', () => {
    expect(AlphaUnitClassSchema.options).not.toContain('EXPLORER');
    expect(Object.keys(alphaUnitCatalog())).not.toContain('EXPLORER');
    expect(alphaUnitCatalog().PIONEER.name).toBe('Pioneiro');
  });
  it('starts each civilization with startingPioneers Pioneiros and no Explorador', () => {
    const state = game();
    expect(state.units.filter(unit => unit.ownerId === p1).map(unit => unit.kind)).toEqual(Array.from({ length: state.rules.startingPioneers }, () => 'PIONEER'));
  });
  it('upgrades a save with Explorador and Settler pieces into Pioneiros (ids stay) and says so', () => {
    const raw = JSON.parse(JSON.stringify(game())) as { units: { kind: string; id: string }[]; rules: { units: Record<string, unknown> } };
    raw.units[0]!.kind = 'EXPLORER'; raw.units[1]!.kind = 'SETTLER'; raw.rules.units.EXPLORER = { name: 'Explorador' };
    const parsed = AlphaStateSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.units.slice(0, 2).every(unit => unit.kind === 'PIONEER')).toBe(true);
    expect(parsed.data.units[0]!.id).toBe(raw.units[0]!.id);
    expect(parsed.data.events.at(-1)).toMatchObject({ type: 'SAVE_UPGRADED' });
    expect(Object.keys(parsed.data.rules.units)).not.toContain('EXPLORER');
  });
  it('a Pioneiro that has an Order this round (moving into the unknown) cannot found in the same round', () => {
    const state = game(), pioneer = state.units.find(unit => unit.ownerId === p1)!;
    const options = alphaUnitOptions(state, p1)[pioneer.id]!;
    expect(options.settleBlock === null || typeof options.settleBlock === 'string').toBe(true);
    const target = options.frontier.find(region => region.block === null)?.entries.find(entry => entry.rotations.length > 0);
    // Not every homeland touches a closed Region the Pioneiro reaches; an ordinary move holds the same Order.
    const path = target?.path ?? Object.values(options.moves)[0]!;
    const queued = applyAlphaCommand(state, p1, { type: 'QUEUE_ORDER', expectedVersion: state.version, order: { id: 'x1', type: 'MOVE', unitIds: [pioneer.id], path, ...(target ? { rotation: target.rotations[0] } : {}) } });
    expect(queued.ok).toBe(true);
    if (!queued.ok) return;
    const settle = applyAlphaCommand(queued.value, p1, { type: 'SETTLE', expectedVersion: queued.value.version, unitId: pioneer.id, name: 'Nova' });
    expect(settle.ok).toBe(false);
    if (!settle.ok) expect(settle.error.message).toContain('mover (ou descobrir) e fundar são Ordens diferentes');
  });
});

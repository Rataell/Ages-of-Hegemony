import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, HERITAGE_ADVANCES, PlayerIdSchema, REPERCUSSION_CARDS, WebDomainSchema, advancementDomains, classifyResonance, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, autoResolveChoices, beginAlphaPlanning, createAlphaGame, registerAdvance } from '@aoh/game-engine';

const [p1, p2] = ['p1', 'p2'].map(id => PlayerIdSchema.parse(id)) as [ReturnType<typeof PlayerIdSchema.parse>, ReturnType<typeof PlayerIdSchema.parse>];
const fresh = (): AlphaState => beginAlphaPlanning(createAlphaGame({ gameId: 'resonance', seed: 7, preset: 'QUICK', players: [{ id: p1, name: 'A', civilization: 'valgard' }, { id: p2, name: 'B', civilization: 'meridia' }] }));
const me = (state: AlphaState) => state.players.find(player => player.playerId === p1)!;
type D = typeof WebDomainSchema.options[number];
const K = 'KNOWLEDGE' as D, L = 'LAND_AND_SEA' as D, S = 'STONE_AND_METAL' as D, G = 'GOVERNMENT' as D, T = 'TRADE' as D;
const slots = (...domains: D[][]) => domains.map(d => ({ domains: d.length === 1 ? [d[0]!] as [D] : [d[0]!, d[1]!] as [D, D] }));
const fill = (state: AlphaState, ids: string[]) => ids.forEach(id => registerAdvance(state, p1, id));

describe('Ressonância: composition (I-1)', () => {
  it.each([
    ['3 of one domain is dominant', slots([K], [K], [K], [L], [S]), 'DOMINANT', [K]],
    ['4 of one domain is dominant', slots([T], [T], [T], [T], [G]), 'DOMINANT', [T]],
    ['2+2+1 is hybrid', slots([K], [K], [L], [L], [S]), 'HYBRID', [K, L]],
    ['2+1+1+1 is the family of the pair', slots([G], [G], [K], [L], [S]), 'PAIR', [G]],
    ['five different domains is Confluência', slots([K], [L], [S], [G], [T]), 'CONFLUENCE', [K, L, S, G, T]],
    ['a Convergence counts for both of its domains', slots([K, G], [K], [G], [L], [S]), 'HYBRID', [K, G]],
    ['a Convergence can complete the Confluência', slots([K, L], [S], [G], [T], [T]), 'CONFLUENCE', [K, L, S, G, T]],
    ['dominant beats a hybrid reading', slots([S, K], [S], [S], [K], [L]), 'DOMINANT', [S]],
    ['ties are broken by catalogue order', slots([T], [T], [K], [K], [L]), 'HYBRID', [K, T]],
  ] as const)('%s', (_label, input, kind, domains) => {
    const composition = classifyResonance(input);
    expect(composition.kind).toBe(kind);
    expect(composition.domains).toEqual(domains);
  });
});

describe('Ressonância: cycle', () => {
  it('registers one socket per advance, keeps a permanent mark, and the fifth resolves and clears', () => {
    const state = fresh();
    fill(state, ['web-writing', 'web-mathematics', 'web-natural-philosophy', 'web-agriculture']);
    expect(me(state).resonance.slots).toHaveLength(4);
    expect(me(state).resonance.marks).toHaveLength(4);
    expect(me(state).pendingChoices).toHaveLength(0);
    fill(state, ['web-masonry']);
    const player = me(state);
    expect(player.resonance.slots).toEqual([]);
    expect(player.resonance.cycles).toBe(1);
    expect(player.resonance.marks).toHaveLength(5); // marks never clear
    expect(player.resonance.history[0]!.kind).toBe('DOMINANT');
    expect(player.pendingChoices).toHaveLength(1);
    expect(player.pendingChoices[0]!.source).toBe('REPERCUSSION');
    expect(state.telemetry.resonanceCycles).toBe(1);
    expect(state.telemetry.resonanceByKind.DOMINANT).toBe(1);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });

  it('a Convergence takes ONE socket and shows two domains; a Heritage takes the domain of its gate', () => {
    expect(advancementDomains('web-civic-academies')).toEqual([K, G]);
    const heritage = HERITAGE_ADVANCES.find(advance => advance.civilizationId === 'valgard')!;
    expect(advancementDomains(heritage.id)).toEqual(['STONE_AND_METAL']);
    const state = fresh();
    fill(state, ['web-civic-academies', heritage.id]);
    expect(me(state).resonance.slots.map(slot => slot.source)).toEqual(['CONVERGENCE', 'HERITAGE']);
    expect(me(state).resonance.slots[0]!.domains).toHaveLength(2);
  });

  it('is deterministic: the same state and advances draw the same card', () => {
    const run = () => { const state = fresh(); fill(state, ['web-writing', 'web-agriculture', 'web-masonry', 'web-common-narratives', 'web-exchange']); return me(state).resonance.history[0]; };
    expect(run()).toEqual(run());
    expect(run()!.kind).toBe('CONFLUENCE');
  });

  it('mitigation skips the price and leverage adds +1 to gains', () => {
    const plain = fresh(), mitigated = fresh();
    for (const state of [plain, mitigated]) for (const id of ['web-writing', 'web-mathematics', 'web-natural-philosophy']) me(state).research.push(id);
    me(mitigated).research.push('web-expression-schools'); // mitigates the Saber price
    const before = plain.cities.filter(meta => meta.currentOwnerId === p1).map(meta => meta.mood);
    const run = (state: AlphaState) => { fill(state, ['web-writing', 'web-mathematics', 'web-natural-philosophy', 'web-writing', 'web-mathematics']); };
    run(plain); run(mitigated);
    const card = REPERCUSSION_CARDS.find(item => item.id === me(plain).resonance.history[0]!.cardId)!;
    expect(card.domains).toEqual([K]);
    const capital = (state: AlphaState) => state.cities.find(meta => meta.currentOwnerId === p1)!.mood;
    expect(capital(plain)).toBe(Math.max(0, before[0]! - 1));
    expect(capital(mitigated)).toBe(before[0]!);
    expect(me(mitigated).pendingChoices[0]!.mitigated).toBe(true);
    // leverage: natural philosophy is in `research` so every gain of the chosen option is +1
    const option = me(plain).pendingChoices[0]!.options[0]!, base = card.options[0]!;
    option.ops.forEach((op, index) => { const original = base.ops[index]!; if (op.op === 'GAIN' && original.op === 'GAIN') expect(op.n).toBe(original.n + 1); });
  });
});

describe('Repercussão choices', () => {
  const cycle = () => { const state = fresh(); fill(state, ['web-writing', 'web-agriculture', 'web-masonry', 'web-common-narratives', 'web-exchange']); return state; };

  it('RESOLVE_CHOICE applies the option and removes the pending choice', () => {
    const state = cycle(), choice = me(state).pendingChoices[0]!;
    const option = choice.options[0]!;
    const result = applyAlphaCommand(state, p1, { type: 'RESOLVE_CHOICE', expectedVersion: state.version, choiceId: choice.id, optionId: option.id });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.players.find(player => player.playerId === p1)!.pendingChoices).toHaveLength(0);
  });

  it('rejects unknown choices and options, and other players cannot resolve it', () => {
    const state = cycle(), choice = me(state).pendingChoices[0]!;
    expect(applyAlphaCommand(state, p1, { type: 'RESOLVE_CHOICE', expectedVersion: state.version, choiceId: choice.id, optionId: 'zzz' }).ok).toBe(false);
    expect(applyAlphaCommand(state, p2, { type: 'RESOLVE_CHOICE', expectedVersion: state.version, choiceId: choice.id, optionId: choice.options[0]!.id }).ok).toBe(false);
  });

  it('unresolved choices auto-pick the first option', () => {
    const state = cycle();
    expect(autoResolveChoices(state)).toBe(1);
    expect(me(state).pendingChoices).toHaveLength(0);
  });

  it('the catalogue covers every kind: dominant ×2 per domain, a pair per domain, ten hybrids and the Confluências', () => {
    const count = (kind: string) => REPERCUSSION_CARDS.filter(card => card.kind === kind).length;
    expect([count('DOMINANT'), count('PAIR'), count('HYBRID'), count('CONFLUENCE')]).toEqual([10, 5, 10, 2]);
    expect(new Set(REPERCUSSION_CARDS.map(card => card.id)).size).toBe(REPERCUSSION_CARDS.length);
  });
});

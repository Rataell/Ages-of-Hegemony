import { MOOD_BAND_NAMES as MOOD_BANDS_MODEL } from '../apps/web/app/alpha/action-ficha-model.js';
import { MOOD_BAND_NAMES as MOOD_BANDS_SEAL } from '../apps/web/app/alpha/mood-seal.js';
import { describe, expect, it } from 'vitest';
import type { ActionEffect, AppliedResult } from '@aoh/game-domain';
import type { ActionPreviewData, ActionPreviewState } from '../apps/web/app/alpha/action-ficha-model.js';
import { appliedSummary, compareApplied, costOf, effectLine, fichaModel, governChoice, governLevelsParam, governPayment, memoryFor, planKeyOf, reconcile, recruitMinis, remember } from '../apps/web/app/alpha/action-ficha-model.js';

// The Ficha de Ação only LAYS OUT what the engine answered (previewAction / ResolutionEvent.applied). These tests pin the mapping, never a rule.
const preview = (patch: Partial<ActionPreviewData> = {}): ActionPreviewData => ({
  command: 'URBAN_ACTION', coverage: 'FULL', eligible: true, blockers: [], warnings: [], resolvesAt: 'RESOLUTION', effects: [],
  cost: { resources: {}, stockAfter: {}, order: { type: 'CITY', usedBefore: 3, usedAfter: 4, limit: 5 }, activation: { cityId: 'c1' as never, usedBefore: 1, usedAfter: 2, max: 2, moodCost: 1 } },
  current: { resources: { food: 12, wood: 8, stone: 4, metal: 2, wealth: 9, knowledge: 0, influence: 0, culture: 3 }, orders: { used: 3, limit: 5 }, city: { cityId: 'c1', level: 'CITY', mood: 4, band: 'STABLE', population: 8, capacity: 2, activations: { used: 1, max: 2 } } },
  ...patch,
});
const ready = (data: ActionPreviewData): ActionPreviewState => ({ status: 'ready', data });
const gain = (target: string, before: number, after: number): ActionEffect => ({ kind: 'RESOURCE', target, before, after, certainty: 'EXACT' });
const mood = (before: number, after: number): ActionEffect => ({ kind: 'MOOD', target: 'c1', label: 'Ânimo', before, after, certainty: 'EXACT' });

describe('Ficha de Ação · mapping of the engine answer', () => {
  it('Estado atual: city, level number, band with Ânimo, Ordens and ativações on one line', () => {
    const model = fichaModel(ready(preview({ effects: [gain('food', 12, 17)] })), { cityName: 'Cusco' })!;
    expect(model.state).toEqual({ name: 'Cusco', level: 'N4', band: 'Estável', mood: 4, orders: 'Ordens 3/5', activations: 'ativações 1/2' });
  });

  it('Elegibilidade: one line per blocker with the concrete cause, and the unlock when the message does not already say it', () => {
    const data = preview({ eligible: false, blockers: [
      { code: 'NO_RESOURCE', message: 'Faltam 2 Metal (tem 2, precisa de 4).' },
      { code: 'NO_ADVANCE', message: 'Recrutar Cavalaria exige o avanço da Teia Treino de Manobras.', unlock: 'Pesquise Treino de Manobras' },
      { code: 'NO_ACTIVATION', message: 'Cidade sem ativação: 2 de 2 usadas.', unlock: 'Cidade sem ativação: 2 de 2 usadas.' },
    ] });
    const model = fichaModel(ready(data))!;
    expect(model.eligibility.map(l => l.tone)).toEqual(['bad', 'bad', 'bad']);
    expect(model.eligibility[1]).toMatchObject({ text: expect.stringContaining('Treino de Manobras'), hint: 'Pesquise Treino de Manobras' });
    expect(model.eligibility[2]!.hint).toBeUndefined();
    expect(model.confirm).toMatchObject({ enabled: false, reason: 'Faltam 2 Metal (tem 2, precisa de 4).' });
  });

  it('Elegibilidade (ok): says what makes it possible, from the cost block', () => {
    const model = fichaModel(ready(preview({ effects: [gain('food', 12, 17)] })))!;
    expect(model.eligibility.map(l => l.text)).toEqual(['Pode agir', 'Ordem disponível (3/5)', 'Ativação disponível (1/2)']);
    expect(model.confirm).toEqual({ enabled: true, reason: null, loading: false });
  });

  it('Custo: balance have -> left per resource (the stock the action FINDS), Ordem, ativação and the Ânimo of the 2nd activation', () => {
    const cost = costOf(preview({ cost: { resources: { culture: 2 }, stockAfter: { culture: 0 }, order: { type: 'CITY', usedBefore: 3, usedAfter: 4, limit: 5 }, activation: { cityId: 'c1' as never, usedBefore: 1, usedAfter: 2, max: 2, moodCost: 1 } } }));
    // an earlier plan already reserved 1 Cultura: today there are 3, the resolution finds 2
    expect(cost.chips).toEqual([{ key: 'culture', label: 'Cultura', paid: 2, have: 2, after: 0, short: false, today: 3 }]);
    expect(cost.order).toBe('Ordem Cidade 3/5 → 4/5');
    expect(cost.activation).toBe('Ativação 1/2 → 2/2');
    expect(cost.moodCost).toBe('Ânimo −1 (2ª ativação)');
  });

  it('Custo: a negative stock after marks the chip as short, substitution and upkeep are named', () => {
    const cost = costOf(preview({ cost: { resources: { wealth: 4 }, stockAfter: { wealth: -1 }, order: null, activation: null, substitution: [{ resource: 'wood', units: 2, wealth: 4 }], upkeepDelta: { food: 0, wealth: 2 } } }));
    expect(cost.chips[0]).toMatchObject({ key: 'wealth', short: true });
    expect(cost.substitution).toEqual(['4 Riqueza cobre 2 Madeira']);
    expect(cost.upkeep).toBe('Manutenção futura: +2 Riqueza por rodada');
  });

  it('Previsto: gains with delta, losses in red, Ânimo as a seal pair; HIDDEN never prints a number', () => {
    expect(effectLine(gain('food', 12, 17))).toMatchObject({ label: 'Alimento', before: '12', after: '17', delta: '+5', loss: false });
    expect(effectLine(mood(4, 3))).toMatchObject({ loss: true, mood: { before: 4, after: 3 } });
    const hidden = effectLine({ kind: 'STATE', target: 'combat:1,1', label: 'Resultado do combate', before: 3, after: 9, certainty: 'HIDDEN', note: 'Dados na resolução.' });
    expect(hidden).toMatchObject({ before: '?', after: '?', certaintyLabel: 'oculto até resolver', delta: null });
    expect(effectLine({ kind: 'POSITION', target: 'unit:u1', before: '1,1', after: '2,1', certainty: 'RANGE' })).toMatchObject({ certaintyLabel: 'estimado' });
  });

  it('Confirmar: off with the first cause; no real effect is not confirmable; the second activation warning is not repeated', () => {
    expect(fichaModel(ready(preview()))!.confirm).toMatchObject({ enabled: false, reason: 'Sem efeito: nada mudaria com esta ação.' });
    expect(fichaModel(ready(preview({ effects: [gain('food', 1, 2)] })), { noEffect: 'Sem efeito: escolha ao menos 1 nível de Ânimo.' })!.confirm.reason).toBe('Sem efeito: escolha ao menos 1 nível de Ânimo.');
    expect(fichaModel(ready(preview({ effects: [gain('food', 1, 2)] })), { gate: 'Você já confirmou o planejamento.' })!.confirm.reason).toBe('Você já confirmou o planejamento.');
    const warned = fichaModel(ready(preview({ effects: [gain('food', 1, 2)], warnings: [{ code: 'SECOND_ACTIVATION', message: '2ª ativação' }, { code: 'FOOD_SHORT', message: 'Alimento previsto: faltam 2.' }] })))!;
    expect(warned.warnings).toEqual(['Alimento previsto: faltam 2.']);
    // PARTIAL coverage has no effect list and is still confirmable when eligible
    expect(fichaModel(ready(preview({ coverage: 'PARTIAL' })))!.confirm.enabled).toBe(true);
  });

  it('loading keeps the previous answer dimmed and turns Confirmar off; no answer yet means no model', () => {
    const previous = preview({ effects: [gain('food', 1, 2)] });
    const model = fichaModel({ status: 'loading', previous }, {})!;
    expect(model.confirm).toEqual({ enabled: false, reason: 'Conferindo a ação…', loading: true });
    expect(fichaModel({ status: 'loading' })).toBeNull();
    expect(fichaModel({ status: 'error', message: 'x' })).toBeNull();
  });
});

describe('Governar com escolha (D4)', () => {
  const govern = { maxLevels: 2, repairOnly: false, mood: 1, levels: [{ levels: 1, moodAfter: 2, costCulture: 1, costWealth: 0 }, { levels: 2, moodAfter: 3, costCulture: 1, costWealth: 2 }] };
  it('defaults to the most the quote allows, clamps the pick to 0..max and names the payment from the quote', () => {
    expect(governChoice(govern, null).levels).toBe(2);
    expect(governChoice(govern, 1).levels).toBe(1);
    expect(governChoice(govern, 9).levels).toBe(2);
    expect(governChoice(govern, 0).levels).toBe(0);
    expect(governPayment(governChoice(govern, 2))).toBe('1 Cultura + 2 Riqueza');
    expect(governPayment(governChoice(govern, 0))).toBe('nenhum');
  });
  it('sends `levels` only when a level can be chosen; 0 is previewed as 1 and blocked by the Ficha', () => {
    expect(governLevelsParam(governChoice(govern, 1))).toEqual({ levels: 1 });
    expect(governLevelsParam(governChoice(govern, 0))).toEqual({ levels: 1 });
    expect(governLevelsParam(governChoice({ ...govern, repairOnly: true, maxLevels: 0, levels: [] }, null))).toEqual({});
  });
});

describe('Resultado · applied against the remembered preview', () => {
  const command = { cityId: 'c1', action: 'PROMOTE_MOOD', levels: 2 };
  const cost = { resources: { culture: 1, wealth: 2 }, stockAfter: { culture: 2, wealth: 7 }, order: null, activation: null };
  const applied = (effects: ActionEffect[], over: Partial<AppliedResult['cost']> = {}): AppliedResult => ({ effects, cost: { ...cost, ...over } });
  const memory = remember('room', 3, command, preview({ effects: [mood(1, 3), gain('culture', 3, 2)], cost, warnings: [{ code: 'EARLIER_PLANS', message: 'Considera 1 plano anterior.' }] }));

  it('"igual ao previsto" when what changed matches, even if the stock started from another number', () => {
    expect(compareApplied(memory, applied([mood(1, 3), gain('culture', 5, 4)]))).toMatchObject({ same: true, deltas: [], reason: null });
  });
  it('Δ names what differs and gives the reason from the warnings the preview carried', () => {
    const result = compareApplied(memory, applied([mood(1, 2)], { resources: { culture: 1, wealth: 4 } }));
    expect(result.same).toBe(false);
    expect(result.deltas.map(d => d.label)).toEqual(expect.arrayContaining(['Ânimo', 'Custo de Riqueza']));
    expect(result.reason).toBe('Considera 1 plano anterior.');
  });
  it('an effect nobody predicted shows up as a delta', () => {
    expect(compareApplied(memory, applied([mood(1, 3), gain('culture', 3, 2), { kind: 'POPULATION', target: 'c1', label: 'Habitantes', before: 8, after: 7, certainty: 'EXACT' }])).deltas).toEqual([{ label: 'Habitantes', predicted: 'nada', applied: '8 → 7' }]);
  });
  it('reconcile drops the preview of a cancelled or swapped plan; memoryFor pairs the n-th event of a city', () => {
    const second = remember('room', 3, { cityId: 'c1', action: 'PRODUCE' }, preview());
    expect(reconcile([memory, second], [{ cityId: 'c1', action: 'PRODUCE' }])).toEqual([second]);
    expect(planKeyOf({ cityId: 'c1', action: 'RECRUIT', unit: 'GUARD' })).toBe(planKeyOf({ cityId: 'c1', action: 'RECRUIT', unit: 'GUARD', count: 1 }));
    const events = [{ id: 'e1', type: 'ROUND_EVENT', cityId: 'c1' }, { id: 'e2', type: 'PRODUCTION', cityId: 'c1' }, { id: 'e3', type: 'ROUND_EVENT', cityId: 'c1' }];
    const other = remember('room', 3, { cityId: 'c1', action: 'EMERGENCY_GOVERN' }, preview());
    expect(memoryFor([memory, second, other], 3, events[0]!, events, 'e1')).toBe(memory);
    expect(memoryFor([memory, second, other], 3, events[2]!, events, 'e3')).toBe(other);
    expect(memoryFor([memory], 4, events[0]!, events, 'e1')).toBeNull();
  });
  it('headline for the map mark: Ânimo and gains; a population loss is a loss', () => {
    expect(appliedSummary(applied([mood(1, 3)]))).toEqual({ text: 'Ânimo 1 → 3', loss: false });
    expect(appliedSummary(applied([gain('food', 12, 17), { kind: 'POPULATION', target: 'c1', before: 8, after: 7, certainty: 'EXACT' }]))).toMatchObject({ text: '+5 Alimento', loss: true });
  });
});

describe('Recrutar', () => {
  it('one miniature per piece of the quantity', () => {
    expect(recruitMinis('GUARD', 3)).toEqual(['GUARD', 'GUARD', 'GUARD']);
    expect(recruitMinis(null, 3)).toEqual([]);
  });
});

describe('Ânimo band names', () => {
  it('the model keeps the same names as the seal module', () => { expect(MOOD_BANDS_MODEL).toEqual(MOOD_BANDS_SEAL); });
});

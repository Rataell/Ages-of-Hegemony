import { ORDER_NAMES, type ActionEffect, type AppliedResult } from '@aoh/game-domain';
import { MOOD_BAND_NAMES } from './mood-seal';
import type { ActionPreviewData, ActionPreviewState } from './action-preview';

/**
 * Ficha de Ação · the PURE reading of what the engine answered (previewAction before confirming, `ResolutionEvent.applied` after). It only maps the engine's own fields into the
 * lines the Ficha shows (Estado atual, Elegibilidade, Custo, Previsto, Confirmar, Aplicado). It never computes a cost, a range or an eligibility; no DOM, no React, so it is testable.
 */
export const RES_PT: Record<string, string> = { food: 'Alimento', wood: 'Madeira', stone: 'Pedra', metal: 'Metal', wealth: 'Riqueza', knowledge: 'Conhecimento', influence: 'Influência', culture: 'Cultura' };
const RES_ORDER = ['food', 'wood', 'stone', 'metal', 'wealth', 'knowledge', 'influence', 'culture'];
export const CITY_LEVEL_ORDER = ['OUTPOST', 'HAMLET', 'VILLAGE', 'CITY', 'GREAT_CITY', 'METROPOLIS', 'IMPERIAL_METROPOLIS'];

export interface FichaLine { tone: 'ok' | 'bad' | 'warn' | 'mute'; text: string; /** How to unlock it ("Pesquise Alvenaria", "Riqueza cobriria: 4 de 9"), when the message does not already say so. */ hint?: string }
export interface FichaCostChip { key: string; label: string; paid: number; /** Stock the action finds (after the earlier plans of the round), and what is left. */ have: number; after: number; short: boolean; /** The stock today, when earlier plans reserve part of it. */ today?: number }
export interface FichaCost { chips: FichaCostChip[]; order: string | null; activation: string | null; moodCost: string | null; substitution: string[]; upkeep: string | null; free: boolean }
export interface FichaEffect {
  id: string; kind: ActionEffect['kind']; label: string; before: string; after: string; /** "+5" / "−1" for a number; null otherwise. */ delta: string | null;
  certainty: ActionEffect['certainty']; /** "estimado" / "oculto até resolver"; null when exact. */ certaintyLabel: string | null; note: string | null; loss: boolean; mood: { before: number; after: number } | null;
}
export interface FichaState { name: string | null; level: string | null; band: string | null; mood: number | null; orders: string; activations: string | null }
export interface FichaModel {
  state: FichaState; eligible: boolean; eligibility: FichaLine[]; cost: FichaCost; effects: FichaEffect[]; warnings: string[];
  /** Why Confirmar is off (first cause), or null when it can go. `loading` is the "Conferindo…" beat. */
  confirm: { enabled: boolean; reason: string | null; loading: boolean };
}

const minus = (n: number) => `${n < 0 ? '−' : '+'}${Math.abs(n)}`;
const isNumber = (v: unknown): v is number => typeof v === 'number';
const value = (v: ActionEffect['before'], certainty: ActionEffect['certainty']): string => {
  if (certainty === 'HIDDEN') return '?';
  if (v === null) return '—';
  return certainty === 'RANGE' && isNumber(v) ? `~${v}` : String(v);
};

/** One effect, as a row. A HIDDEN effect never prints its numbers (the hidden value is not for the client to show). */
export function effectLine(effect: ActionEffect): FichaEffect {
  const hidden = effect.certainty === 'HIDDEN', numeric = isNumber(effect.before) && isNumber(effect.after);
  const diff = numeric ? (effect.after as number) - (effect.before as number) : 0;
  const mood = effect.kind === 'MOOD' && numeric && !hidden ? { before: effect.before as number, after: effect.after as number } : null;
  const label = effect.label ?? (effect.kind === 'RESOURCE' ? RES_PT[effect.target] ?? effect.target : effect.target);
  const loss = !hidden && numeric && diff < 0 && (effect.kind === 'MOOD' || effect.kind === 'POPULATION' || effect.kind === 'RESOURCE' || effect.kind === 'UNITS');
  return {
    id: `${effect.kind}:${effect.target}`, kind: effect.kind, label, before: value(effect.before, effect.certainty), after: value(effect.after, effect.certainty),
    delta: numeric && !hidden && diff !== 0 && (effect.kind === 'RESOURCE' || effect.kind === 'UNITS' || effect.kind === 'POPULATION') ? minus(diff) : null,
    certainty: effect.certainty, certaintyLabel: effect.certainty === 'RANGE' ? 'estimado' : hidden ? 'oculto até resolver' : null, note: effect.note ?? null, loss, mood,
  };
}

/** Estado atual. The seat's Orders, and the city when the command names one (name comes from the client's projection, never recomputed). */
export function stateOf(current: ActionPreviewData['current'], cityName: string | null): FichaState {
  const city = current.city;
  const level = city ? CITY_LEVEL_ORDER.indexOf(city.level) + 1 : 0;
  return {
    name: cityName, level: level > 0 ? `N${level}` : null, band: city ? MOOD_BAND_NAMES[city.band] ?? city.band : null, mood: city ? city.mood : null,
    orders: `Ordens ${current.orders.used}/${current.orders.limit}`, activations: city?.activations ? `ativações ${city.activations.used}/${city.activations.max}` : null,
  };
}

/** Custo. `have` is the stock the action finds at resolution (stock after + paid), so a plan that reserves Cultura shows the balance the resolution will see. */
export const costOf = (preview: ActionPreviewData): FichaCost => costView(preview.cost, preview.current.resources);
/** The same reading for any ActionCost: the preview's, or the one a resolution applied (`ResolutionEvent.applied.cost`). */
export function costView(cost: AppliedResult['cost'], today_: Partial<Record<string, number>> = {}): FichaCost {
  const keys = RES_ORDER.filter(key => (cost.resources[key as keyof typeof cost.resources] ?? 0) > 0);
  const chips: FichaCostChip[] = keys.map(key => {
    const paid = cost.resources[key as keyof typeof cost.resources] ?? 0, after = cost.stockAfter[key as keyof typeof cost.stockAfter] ?? 0, today = today_[key];
    const have = after + paid;
    return { key, label: RES_PT[key] ?? key, paid, have, after, short: after < 0, ...(today !== undefined && today !== have ? { today } : {}) };
  });
  const order = cost.order ? `Ordem ${ORDER_NAMES[cost.order.type] ?? cost.order.type} ${cost.order.usedBefore}/${cost.order.limit} → ${cost.order.usedAfter}/${cost.order.limit}` : null;
  const activation = cost.activation ? `Ativação ${cost.activation.usedBefore}/${cost.activation.max} → ${cost.activation.usedAfter}/${cost.activation.max}` : null;
  const moodCost = cost.activation && cost.activation.moodCost > 0 ? `Ânimo −${cost.activation.moodCost} (2ª ativação)` : null;
  const substitution = (cost.substitution ?? []).map(s => `${s.wealth} Riqueza cobre ${s.units} ${RES_PT[s.resource] ?? s.resource}`);
  const up = cost.upkeepDelta;
  const upkeep = up && (up.food || up.wealth) ? `Manutenção futura: ${[up.food ? `${minus(up.food)} Alimento` : '', up.wealth ? `${minus(up.wealth)} Riqueza` : ''].filter(Boolean).join(' e ')} por rodada` : null;
  return { chips, order, activation, moodCost, substitution, upkeep, free: chips.length === 0 };
}

/** Elegibilidade. Every blocker is its own line with the concrete cause; when eligible, the facts that make it so (Ordem and ativação available). */
export function eligibilityOf(preview: ActionPreviewData): FichaLine[] {
  if (!preview.eligible) {
    return preview.blockers.map(blocker => ({ tone: 'bad' as const, text: blocker.message, ...(blocker.unlock && !blocker.message.includes(blocker.unlock) ? { hint: blocker.unlock } : {}) }));
  }
  const lines: FichaLine[] = [{ tone: 'ok', text: 'Pode agir' }];
  const { order, activation } = preview.cost;
  if (order) lines.push({ tone: 'ok', text: `Ordem disponível (${order.usedBefore}/${order.limit})` });
  if (activation) lines.push({ tone: 'ok', text: `Ativação disponível (${activation.usedBefore}/${activation.max})` });
  return lines;
}

/** Warnings the Custo band already says in its own line are not repeated. */
const COVERED_BY_COST = new Set(['SECOND_ACTIVATION', 'UPKEEP']);
export const warningsOf = (preview: ActionPreviewData): string[] => preview.warnings.filter(w => !COVERED_BY_COST.has(w.code)).map(w => w.message);

export interface FichaOptions {
  cityName?: string | null;
  /** A client-level gate that is not the engine's (e.g. the seat is waiting on others). Shown as the first cause. */
  gate?: string | null;
  /** The player's own choice makes the action pointless (Governar with 0 levels): off, with this sentence. */
  noEffect?: string | null;
}

/** The whole Ficha, from what the engine said. A `loading` state keeps the previous answer's numbers and turns Confirmar off. */
export function fichaModel(state: ActionPreviewState, options: FichaOptions = {}): FichaModel | null {
  const data = state.status === 'ready' ? state.data : state.status === 'loading' ? state.previous ?? null : null;
  if (!data) return null;
  const effects = data.effects.map(effectLine), loading = state.status !== 'ready';
  let reason: string | null = null;
  if (options.gate) reason = options.gate;
  else if (loading) reason = 'Conferindo a ação…';
  else if (!data.eligible) reason = data.blockers[0]?.message ?? 'O servidor recusou esta ação.';
  else if (options.noEffect) reason = options.noEffect;
  else if (data.coverage === 'FULL' && effects.length === 0) reason = 'Sem efeito: nada mudaria com esta ação.';
  return {
    state: stateOf(data.current, options.cityName ?? null), eligible: data.eligible, eligibility: eligibilityOf(data), cost: costOf(data), effects, warnings: warningsOf(data),
    confirm: { enabled: reason === null, reason, loading },
  };
}

// ---------- Resultado: the applied effects, and the comparison with the preview the client kept when the player confirmed ----------

/** What the client remembers about a confirmed plan, for this browser session only. */
export interface RememberedPreview { room: string; round: number; cityId: string; action: string; eventType: string; planKey: string; effects: ActionEffect[]; paid: Record<string, number>; warnings: string[] }
const stableKey = (value: unknown): string => JSON.stringify(value ?? null);
/** The same key for a command being planned and for the planned action the server lists: city, action and its parameters, never the id. */
export const planKeyOf = (plan: { cityId: string; action: string; build?: unknown; unit?: unknown; advancementId?: unknown; count?: unknown; levels?: unknown }): string =>
  stableKey([plan.cityId, plan.action, plan.build ?? null, plan.unit ?? null, plan.advancementId ?? null, plan.count ?? 1, plan.levels ?? null]);
/** The kind of resolution event each urban action produces (the same table the resolver uses). */
export const EVENT_OF_ACTION: Record<string, string> = { PRODUCE: 'PRODUCTION', BUILD: 'CONSTRUCTION', RECRUIT: 'RECRUITMENT', RESEARCH: 'RESEARCH', ELEVATE: 'CONSTRUCTION', PROMOTE_MOOD: 'ROUND_EVENT', EMERGENCY_GOVERN: 'ROUND_EVENT', SUPPORT_TRADE: 'TRADE', CIVIC_ACTION: 'ROUND_EVENT', MOVE_CAPITAL: 'ROUND_EVENT' };

export function remember(room: string, round: number, command: { cityId: string; action: string; build?: unknown; unit?: unknown; advancementId?: unknown; count?: unknown; levels?: unknown }, data: ActionPreviewData): RememberedPreview {
  return { room, round, cityId: command.cityId, action: command.action, eventType: EVENT_OF_ACTION[command.action] ?? 'ROUND_EVENT', planKey: planKeyOf(command), effects: data.effects, paid: Object.fromEntries(Object.entries(data.cost.resources).filter(([, n]) => (n ?? 0) > 0)) as Record<string, number>, warnings: data.warnings.map(w => w.message) };
}
/** Keeps only the remembered previews whose plan is still planned (a swapped or cancelled plan must not be compared with another one's result). */
export function reconcile(entries: readonly RememberedPreview[], plans: readonly { cityId: string; action: string; build?: unknown; unit?: unknown; advancementId?: unknown; count?: unknown; levels?: unknown }[]): RememberedPreview[] {
  const left = plans.map(planKeyOf), kept: RememberedPreview[] = [];
  for (const entry of entries) { const at = left.indexOf(entry.planKey); if (at >= 0) { left.splice(at, 1); kept.push(entry); } }
  return kept;
}
/** The remembered preview of the n-th event of one city and kind (two activations of one city in a round come back in the order they were confirmed). */
export function memoryFor(entries: readonly RememberedPreview[], round: number, event: { type: string; cityId?: string | undefined }, events: readonly { id: string; type: string; cityId?: string | undefined }[], eventId: string): RememberedPreview | null {
  const same = entries.filter(e => e.round === round && e.cityId === event.cityId && e.eventType === event.type);
  const index = events.filter(e => e.cityId === event.cityId && e.type === event.type).findIndex(e => e.id === eventId);
  return index >= 0 ? same[index] ?? null : null;
}

export interface FichaComparison { same: boolean; deltas: { label: string; predicted: string; applied: string }[]; /** Why they differ, from the warnings the preview carried. */ reason: string | null }
const effectKey = (e: ActionEffect) => `${e.kind}:${e.target}`;
/** Stocks and Ânimo may start from another number at resolution (other plans, trade); what the action CHANGED is what has to match. */
const sameChange = (a: ActionEffect, b: ActionEffect) => isNumber(a.before) && isNumber(a.after) && isNumber(b.before) && isNumber(b.after) ? a.after - a.before === b.after - b.before : a.after === b.after;
const show = (e: ActionEffect | undefined) => e ? (e.certainty === 'HIDDEN' ? '?' : `${value(e.before, e.certainty)} → ${value(e.after, e.certainty)}`) : 'nada';

/** Predicted vs applied, by effect. A HIDDEN or RANGE prediction is not a mismatch when the applied number lands inside what was promised (no number to compare). */
export function compareApplied(memory: Pick<RememberedPreview, 'effects' | 'paid' | 'warnings'>, applied: AppliedResult): FichaComparison {
  const deltas: FichaComparison['deltas'] = [];
  const got = new Map(applied.effects.map(e => [effectKey(e), e]));
  for (const predicted of memory.effects) {
    const real = got.get(effectKey(predicted));
    if (predicted.certainty !== 'EXACT') continue;
    if (!real || !sameChange(predicted, real)) deltas.push({ label: effectLine(predicted).label, predicted: show(predicted), applied: show(real) });
  }
  const predictedKeys = new Set(memory.effects.map(effectKey));
  for (const real of applied.effects) if (!predictedKeys.has(effectKey(real))) deltas.push({ label: effectLine(real).label, predicted: 'nada', applied: show(real) });
  for (const key of RES_ORDER) {
    const paid = applied.cost.resources[key as keyof typeof applied.cost.resources] ?? 0, expected = memory.paid[key] ?? 0;
    if (paid !== expected) deltas.push({ label: `Custo de ${RES_PT[key] ?? key}`, predicted: String(expected), applied: String(paid) });
  }
  return { same: deltas.length === 0, deltas, reason: deltas.length ? memory.warnings.length ? memory.warnings.join(' ') : 'A mesa mudou entre o planejamento e a resolução (outras ações, comércio ou saques).' : null };
}

/** The map mark of a resolved plan: the headline of what it really did ("+5 Alimento", "Ânimo 1 → 3", "+2 Guarda"), and whether it cost the player something (a loss is drawn in red). */
export function appliedSummary(applied: AppliedResult): { text: string; loss: boolean } {
  const lines = applied.effects.map(effectLine), pick = (kind: ActionEffect['kind']) => lines.filter(line => line.kind === kind);
  const parts: string[] = [];
  const mood = pick('MOOD')[0];
  if (mood) parts.push(`Ânimo ${mood.before} → ${mood.after}`);
  for (const line of pick('RESOURCE').slice(0, 2)) parts.push(`${line.delta ?? ''} ${line.label}`.trim());
  for (const line of pick('UNITS').slice(0, 1)) parts.push(`${line.delta ?? ''} ${line.label}`.trim());
  for (const line of [...pick('BUILDING'), ...pick('ADVANCE')].slice(0, 1)) parts.push(line.after);
  return { text: parts.join(' · '), loss: lines.some(line => line.loss && line.kind !== 'RESOURCE') };
}

// ---------- Governar (D4) and Recrutar ----------

export interface GovernLevel { levels: number; moodAfter: number; costCulture: number; costWealth: number; stoneRepair?: number }
export interface GovernChoice { max: number; repairOnly: boolean; /** 0 = no level chosen (nothing would change). */ levels: number; table: GovernLevel[]; mood: number | null }
/** The level the player picked, clamped to what the engine's quote offers (0..maxLevels); the default is the most the quote allows, as the engine does when no level is sent. */
export function governChoice(govern: { maxLevels: number; repairOnly: boolean; levels: readonly GovernLevel[]; mood: number } | undefined, picked: number | null): GovernChoice {
  if (!govern) return { max: 0, repairOnly: false, levels: 0, table: [], mood: null };
  const max = govern.maxLevels, levels = govern.repairOnly ? 0 : Math.max(0, Math.min(max, picked ?? max));
  return { max, repairOnly: govern.repairOnly, levels, table: [...govern.levels], mood: govern.mood };
}
/** The payment sentence of the chosen level ("2 Cultura", "2 Cultura + 4 Riqueza", "sem custo"), straight from the quote. */
export function governPayment(choice: GovernChoice): string {
  const row = choice.table.find(l => l.levels === choice.levels);
  if (!row) return 'nenhum';
  const parts = [row.costCulture ? `${row.costCulture} Cultura` : '', row.costWealth ? `${row.costWealth} Riqueza` : '', row.stoneRepair ? `${row.stoneRepair} Pedra (reparo)` : ''].filter(Boolean);
  return parts.length ? parts.join(' + ') : 'sem custo';
}
/** The command's `levels`: absent when no level can be chosen (repair only), otherwise the chosen number (the engine rejects 0, so the Ficha blocks it first). */
export const governLevelsParam = (choice: GovernChoice): { levels?: number } => (choice.repairOnly || choice.max === 0 ? {} : { levels: Math.max(1, choice.levels) });

/** Recrutar: the pieces that will appear in the city, as many as the quantity (one miniature each). */
export const recruitMinis = (kind: string | null, count: number): string[] => (kind ? Array.from({ length: Math.max(0, count) }, () => kind) : []);

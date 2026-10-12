import {
  ALPHA_RESOURCE_KEYS, BUILDING_NAMES_PT, ADVANCEMENTS, heritageAdvance, orderTypeForPlanned, emptyAlphaResourcePool,
  type ActionCost, type ActionEffect, type AlphaOrderType, type AlphaResourceKey, type AlphaResourcePool, type AlphaState, type AppliedResult, type PlayerId,
} from '@aoh/game-domain';
import { activationCapacity, governQuote, militaryUpkeep, moodBand } from './alpha-city.js';
import { cityActivations, courtWaives, produceBreakdown, type UrbanAction, type UrbanParams } from './alpha-urban.js';
import { governmentEffects } from './alpha-government.js';
import { DISTRICT_NAMES } from './alpha-messages.js';

type AlphaUrbanCityId = AlphaState['cities'][number]['cityId'];

/**
 * Ficha de Ação · what an urban action changes and costs, read from the state BEFORE it runs and the state AFTER it ran. `previewAction` runs the real `performUrbanAction`
 * on a clone and the resolver runs it on the match; both hand their two states to `urbanOutcome`, so the preview and the `applied` of the resolution come from one code
 * path and can only differ when the match itself changed in between (another plan, a rival's act).
 */
export const RESOURCE_PT: Record<AlphaResourceKey, string> = { food: 'Alimento', wood: 'Madeira', stone: 'Pedra', metal: 'Metal', wealth: 'Riqueza', knowledge: 'Conhecimento', influence: 'Influência', culture: 'Cultura' };
export const ERA_PT: Record<string, string> = { FOUNDATION: 'Fundação', EXPANSION: 'Expansão', CONSOLIDATION: 'Consolidação', CIVILIZATION: 'Civilização', EMPIRES: 'Impérios', POWERS: 'Potências', ASCENSION: 'Ascensão' };
export const LEVEL_PT: Record<string, string> = { OUTPOST: 'Posto', HAMLET: 'Povoado', VILLAGE: 'Vila', CITY: 'Cidade', GREAT_CITY: 'Grande Cidade', METROPOLIS: 'Metrópole', IMPERIAL_METROPOLIS: 'Metrópole Imperial' };
export const FORTIFICATION_STATE_PT: Record<string, string> = { INTACT: 'íntegra', DAMAGED: 'danificada', BREACHED: 'rompida' };
/** Era number I..VII, the way the rules book prints it. */
export const eraNumber = (era: string): number => ['FOUNDATION', 'EXPANSION', 'CONSOLIDATION', 'CIVILIZATION', 'EMPIRES', 'POWERS', 'ASCENSION'].indexOf(era) + 1;
export const advanceName = (id: string): string => ADVANCEMENTS.find(node => node.id === id)?.name ?? heritageAdvance(id)?.name ?? id;

export type UrbanPlan = { cityId: AlphaUrbanCityId; action: UrbanAction } & UrbanParams;

/** The resources each side of a pair of states, spent and gained, by key (a resource that both rose and fell nets out: the stock is what is exact). */
export function resourceDelta(before: AlphaState, after: AlphaState, actor: PlayerId): { spent: Partial<AlphaResourcePool>; gained: Partial<AlphaResourcePool>; stockAfter: AlphaResourcePool } {
  const a = before.players.find(player => player.playerId === actor)?.resources ?? emptyAlphaResourcePool(), b = after.players.find(player => player.playerId === actor)?.resources ?? emptyAlphaResourcePool();
  const spent: Partial<AlphaResourcePool> = {}, gained: Partial<AlphaResourcePool> = {};
  for (const key of ALPHA_RESOURCE_KEYS) { if (b[key] < a[key]) spent[key] = a[key] - b[key]; else if (b[key] > a[key]) gained[key] = b[key] - a[key]; }
  return { spent, gained, stockAfter: { ...b } };
}

/** Orders an action reserves: Mover a capital takes more than one under some governments. */
export const orderCharge = (state: AlphaState, actor: PlayerId, plan: UrbanPlan): number => plan.action === 'MOVE_CAPITAL' ? governmentEffects(state, actor).moveCapitalOrders : 1;
export const orderTypeOf = (plan: UrbanPlan): AlphaOrderType => orderTypeForPlanned({ id: 'x', type: 'URBAN_ACTION', cityId: plan.cityId, action: plan.action } as never);

/** The city's activation this action takes (null for an Avanço, which is its own Order) and the Ânimo its second activation costs. Read from the state the action runs on. */
export function activationOf(state: AlphaState, actor: PlayerId, plan: UrbanPlan): ActionCost['activation'] {
  if (plan.action === 'RESEARCH') return null;
  const meta = state.cities.find(candidate => candidate.cityId === plan.cityId), act = cityActivations(state, actor, plan.cityId);
  if (!meta || !act) return null;
  const usedAfter = act.count + 1;
  return { cityId: plan.cityId, usedBefore: act.count, usedAfter, max: act.allowed, moodCost: usedAfter === 2 && !courtWaives(state, actor, meta) ? 1 : 0 };
}

/** Capacity the city would Produzir with on a first activation: what Ânimo and level give it, without the "already used" term (so a PRODUCE does not look like it shrank the city). */
const capacityNow = (state: AlphaState, cityId: string): number => activationCapacity({ ...state, cities: state.cities.map(meta => meta.cityId === cityId ? { ...meta, urbanActionsUsed: 0 } : meta) }, cityId);

const eff = (kind: ActionEffect['kind'], target: string, label: string, before: ActionEffect['before'], after: ActionEffect['after'], note?: string): ActionEffect => ({ kind, target, label, before, after, certainty: 'EXACT', ...(note ? { note } : {}) });

/** Every observable change an urban action made to the actor's side, in a fixed order. EXACT: both states are the real engine's. */
export function urbanEffects(before: AlphaState, after: AlphaState, actor: PlayerId, plan: UrbanPlan): ActionEffect[] {
  const list: ActionEffect[] = [];
  const cityId = plan.cityId, metaA = before.cities.find(meta => meta.cityId === cityId), metaB = after.cities.find(meta => meta.cityId === cityId);
  const coreA = before.core.players.flatMap(owner => owner.civilization.cities).find(city => city.id === cityId), coreB = after.core.players.flatMap(owner => owner.civilization.cities).find(city => city.id === cityId);
  const delta = resourceDelta(before, after, actor);
  for (const key of ALPHA_RESOURCE_KEYS) if (delta.gained[key]) list.push(eff('RESOURCE', key, RESOURCE_PT[key], delta.stockAfter[key] - delta.gained[key]!, delta.stockAfter[key]));
  if (metaA && metaB) {
    if (plan.action === 'PRODUCE') {
      const lost = produceBreakdown(before, actor, cityId);
      if (lost.forgone.hexes.length) {
        const text = ALPHA_RESOURCE_KEYS.filter(key => lost.forgone.output[key] > 0).map(key => `${lost.forgone.output[key]} ${RESOURCE_PT[key]}`).join(', ');
        list.push(eff('STATE', `${cityId}:unworked-hexes`, 'Hexes sem trabalhador por Capacidade', lost.producers.working + lost.forgone.hexes.length, lost.producers.working, `Capacidade ${lost.capacity}: ${lost.forgone.hexes.join(', ')} fora desta ativação${text ? ` (deixam de render ${text})` : ''}.`));
      }
    }
    if (plan.action === 'PROMOTE_MOOD') {
      const quote = governQuote(before, actor, cityId), levels = quote.repairOnly ? 0 : plan.levels ?? quote.maxLevels;
      list.push(eff('STATE', `${cityId}:govern-levels`, 'Níveis de Ânimo recuperados', 0, levels, quote.repairOnly ? 'A cidade já é Próspera: só repara a fortificação.' : undefined));
    }
    if (metaA.mood !== metaB.mood) list.push(eff('MOOD', cityId, 'Ânimo', metaA.mood, metaB.mood, moodBand(metaA.mood) !== moodBand(metaB.mood) ? `${bandPt(metaA.mood)} → ${bandPt(metaB.mood)}` : undefined));
    if (coreA && coreB && coreA.population !== coreB.population) {
      const w = (city: typeof coreA) => `Soldados ${city.workers.soldiers}, Disponíveis ${city.workers.unassigned}`;
      list.push(eff('POPULATION', cityId, 'Habitantes', coreA.population, coreB.population, `${w(coreA)} → ${w(coreB)}`));
    }
    if (metaA.level !== metaB.level) list.push(eff('STATE', `${cityId}:level`, 'Nível da cidade', LEVEL_PT[metaA.level] ?? metaA.level, LEVEL_PT[metaB.level] ?? metaB.level));
    for (const district of metaB.districts.filter(item => !metaA.districts.includes(item))) list.push(eff('BUILDING', `${cityId}:district:${district}`, `Distrito ${DISTRICT_NAMES[district] ?? district}`, null, DISTRICT_NAMES[district] ?? district));
    for (const building of metaB.buildings.filter(item => !metaA.buildings.includes(item))) list.push(eff('BUILDING', `${cityId}:building:${building}`, BUILDING_NAMES_PT[building] ?? building, null, BUILDING_NAMES_PT[building] ?? building));
    const fort = (m: typeof metaA) => `${m.fortification.level} ${FORTIFICATION_STATE_PT[m.fortification.state] ?? m.fortification.state}`;
    if (fort(metaA) !== fort(metaB)) list.push(eff('BUILDING', `${cityId}:fortification`, 'Fortificação', fort(metaA), fort(metaB)));
    const capA = capacityNow(before, cityId), capB = capacityNow(after, cityId);
    if (capA !== capB) list.push(eff('STATE', `${cityId}:capacity`, 'Capacidade da ativação', capA, capB));
    if (metaA.integration !== metaB.integration) list.push(eff('STATE', `${cityId}:integration`, 'Integração', metaA.integration, metaB.integration));
    if (metaA.status !== metaB.status) list.push(eff('STATE', `${cityId}:status`, 'Situação da cidade', metaA.status, metaB.status));
    if (metaA.capital !== metaB.capital) list.push(eff('STATE', `${cityId}:capital`, 'Capital', metaA.capital ? 'sim' : 'não', metaB.capital ? 'sim' : 'não'));
  }
  const kinds = new Set([...before.units, ...after.units].filter(unit => unit.ownerId === actor).map(unit => unit.kind));
  for (const kind of [...kinds].sort()) {
    const a = before.units.filter(unit => unit.ownerId === actor && unit.kind === kind).length, b = after.units.filter(unit => unit.ownerId === actor && unit.kind === kind).length;
    if (a !== b) list.push(eff('UNITS', `unit:${kind}`, after.rules.units[kind].name, a, b));
  }
  const researchA = before.players.find(player => player.playerId === actor)!.research, researchB = after.players.find(player => player.playerId === actor)!.research;
  for (const id of researchB.filter(item => !researchA.includes(item))) list.push(eff('ADVANCE', id, advanceName(id), null, advanceName(id)));
  return list;
}
const bandPt = (mood: number): string => ({ REVOLT: 'Revolta', SHAKEN: 'Abalada', STABLE: 'Estável', PROSPEROUS: 'Próspera' } as const)[moodBand(mood)];

/**
 * The cost an urban action really had: Σ the stock fell by (Riqueza that stood in for a missing material included), the stock left, and the substitution described when
 * `nominal` (the price before any substitution) is given: per material, the units the pool lacked and the Riqueza paid for them. `order` and `activation` come from the caller.
 */
export function urbanCostOf(before: AlphaState, after: AlphaState, actor: PlayerId, nominal: AlphaResourcePool | null, order: ActionCost['order'], activation: ActionCost['activation']): ActionCost {
  const delta = resourceDelta(before, after, actor), rate = before.rules.balance.wealthConversionRate;
  const substitution: NonNullable<ActionCost['substitution']> = [];
  if (nominal) {
    // Riqueza stood in for the materials the pool lacked: the shortage is the nominal material cost minus what the stock really gave up (a legacy "materials" price is split by what the pool has).
    const materials = ['wood', 'stone', 'metal'] as const;
    let covered = Math.max(0, materials.reduce((total, key) => total + nominal[key], 0) - materials.reduce((total, key) => total + (delta.spent[key] ?? 0), 0));
    for (const key of materials) {
      const units = Math.min(covered, Math.max(0, nominal[key] - (delta.spent[key] ?? 0)));
      if (units > 0) { substitution.push({ resource: key, units, wealth: units * rate }); covered -= units; }
    }
    if (covered > 0) substitution.push({ resource: 'wood', units: covered, wealth: covered * rate });
  }
  const upkeepA = militaryUpkeep(before, actor), upkeepB = militaryUpkeep(after, actor);
  const upkeep = { food: upkeepB.food - upkeepA.food, wealth: upkeepB.wealth - upkeepA.wealth };
  return { resources: delta.spent, stockAfter: delta.stockAfter, ...(substitution.length ? { substitution } : {}), order, activation, ...(upkeep.food || upkeep.wealth ? { upkeepDelta: upkeep } : {}) };
}

/** The `applied` of a resolved urban plan: `before` is the match just before the plan ran, `after` the clone it produced (the plan's own Order already counted in `usedAfter`). */
export function appliedUrban(before: AlphaState, after: AlphaState, actor: PlayerId, plan: UrbanPlan, nominal: AlphaResourcePool | null, usage: { used: number; limit: number }): AppliedResult {
  const charge = orderCharge(before, actor, plan);
  return {
    effects: urbanEffects(before, after, actor, plan),
    cost: urbanCostOf(before, after, actor, nominal, { type: orderTypeOf(plan), usedBefore: Math.max(0, usage.used - charge), usedAfter: usage.used, limit: usage.limit }, activationOf(before, actor, plan)),
  };
}

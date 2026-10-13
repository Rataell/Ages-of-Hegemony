import {
  ADVANCEMENTS, OFFERED_BUILDINGS, buildingSpec, AlphaEraSchema, AlphaUnitClassSchema, districtEntry, BuildingTypeSchema, DistrictTypeSchema, FORTIFICATION_UPGRADES, ALPHA_RESOURCE_KEYS, elevateRequirement, emptyAlphaResourcePool, ladderStep, nextLevel,
  type AlphaCommand, type AlphaResourcePool, type AlphaState, type PlayerId,
} from '@aoh/game-domain';
import { applyCommand } from './engine.js';
import { alphaEvent } from './alpha-events.js';
import { leaderIntegrationBonus } from './alpha-leaders.js';
import { recruitBlock, recruitUnit } from './alpha-military.js';
import { governmentEffects } from './alpha-government.js';
import type { GovernBlocker, GovernLevelQuote } from './alpha-city.js';
import { REVOLT_EMERGENCY_MOOD, activationsAllowed, administration, emergencyGovern, emergencyGovernBlock, recruitLimit, cityYield, districtSlots, elevateBlock, elevateCity, governBlock, governCity, governCost, governCostText, governQuote, mirrorDevelopment, mobilizationBlock, mobilize, moodBand } from './alpha-city.js';
import { advanceCost, applyRecurringEffects, hasUnlock, heritageFor, recurringAmounts, researchAdvancement, researchBlock } from './alpha-institutions.js';
import { alphaCanAfford, alphaCostWithMetal, alphaGain, alphaGainLegacy, alphaPay, alphaResourcePayment } from './alpha-resources.js';
import { alphaActionUsage } from './alpha-actions.js';
import { isCoastalCity } from './alpha-water.js';
import { kitFortificationBlock, kitProduceBonus, kitRouteIncome, kitUnitCost } from './alpha-kits.js';

export type UrbanCommand = Extract<AlphaCommand, { type: 'URBAN_ACTION' }>;
/** The buildings the economic core builds with its own catalog and prices; the other offered ones come from ALPHA_BUILDING_CATALOG. */
type CoreBuilding = (typeof BuildingTypeSchema.options)[number];

/** Keeps the alpha city records aligned with the districts and buildings the economic core owns. */
export function syncCityMetadata(state: AlphaState): void {
  const coreDistricts = new Set<string>(DistrictTypeSchema.options), coreBuildings = new Set<string>(BuildingTypeSchema.options);
  for (const meta of state.cities) {
    const city = state.core.players.flatMap(player => player.civilization.cities).find(candidate => candidate.id === meta.cityId);
    if (!city) continue;
    meta.districts = [...meta.districts.filter(item => !coreDistricts.has(item)), ...city.districts.map(item => item.type)];
    meta.buildings = [...meta.buildings.filter(item => !coreBuildings.has(item)), ...city.buildings.map(item => item.type)];
    // The built level never follows the population (canon §4): it rises only through Elevar.
  }
}


export type UrbanAction = UrbanCommand['action'];
export type BuildTarget = NonNullable<UrbanCommand['build']>;
export interface UrbanParams { build?: BuildTarget; unit?: UrbanCommand['unit']; advancementId?: string; count?: number; levels?: number }

/**
 * Activations of one city this round (F-14): the single place that knows how many a city may still take. `count` is what the city already has
 * (planned non-Avanço actions while planning, activations used while resolving); `allowed` is two when Estável or Próspera, one when Abalada or in Revolta
 * (canon §10) and one in Sobre-extensão (canon §4); the Conselho lets only one city of the civilization take a second (canon §16). Avanço is its own Order
 * and is not an activation (E-1). `cityGate`, the options' `blocked` and the projection read this, so what the client shows is what the engine enforces.
 */
export interface CityActivations { allowed: number; count: number; left: number; councilBlocked: boolean }
export function cityActivations(state: AlphaState, actor: PlayerId, cityId: string): CityActivations | null {
  const meta = state.cities.find(candidate => candidate.cityId === cityId);
  if (!meta || meta.currentOwnerId !== actor) return null;
  const planning = state.phase === 'PLANNING';
  const plannedIn = (id: string) => state.players.find(player => player.playerId === actor)?.plannedActions.filter(candidate => candidate.type === 'URBAN_ACTION' && candidate.action !== 'RESEARCH' && candidate.cityId === id).length ?? 0;
  const count = planning ? plannedIn(cityId) : meta.urbanActionsUsed;
  const allowed = Math.min(state.rules.balance.cityActions, activationsAllowed(meta), administration(state, actor).overextended ? 1 : 2);
  const secondLimit = governmentEffects(state, actor).secondActivationsPerRound;
  let councilBlocked = false;
  if (secondLimit !== null && count >= 1) {
    const seconds = state.cities.filter(other => other.currentOwnerId === actor && other.cityId !== cityId).filter(other => (planning ? plannedIn(other.cityId) : other.urbanActionsUsed) >= 2).length;
    councilBlocked = seconds >= secondLimit;
  }
  return { allowed, count, left: councilBlocked ? 0 : Math.max(0, allowed - count), councilBlocked };
}

/**
 * Tribunal (RC5): the city's second activation of the round costs no Ânimo, once per round in the whole civilization. Stateless: the waiver is spent when another city that has a
 * Tribunal already reached its second activation this round (cities are resolved one at a time, so the first one takes it).
 */
export function courtWaives(state: AlphaState, actor: PlayerId, meta: AlphaState['cities'][number]): boolean {
  if (!meta.buildings.includes('COURT')) return false;
  return !state.cities.some(other => other.currentOwnerId === actor && other.cityId !== meta.cityId && other.buildings.includes('COURT') && other.urbanActionsUsed >= 2);
}

/** Gates every urban action shares: phase, readiness, ownership, occupation and remaining city actions. */
export function cityGate(state: AlphaState, actor: PlayerId, cityId: string, action: UrbanAction): string | null {
  if (state.phase !== 'PLANNING'&&state.phase !== 'URBAN_ACTIONS') return 'Disponível apenas no Planejamento.';
  if (state.players.find(player => player.playerId === actor)?.ready) return 'Suas decisões já estão confirmadas para esta fase.';
  const actions=alphaActionUsage(state,actor);
  if(actions.used>=actions.limit)return 'Sem ações principais disponíveis nesta rodada.';
  const meta = state.cities.find(candidate => candidate.cityId === cityId);
  const city = state.core.players.find(player => player.id === actor)?.civilization.cities.find(candidate => candidate.id === cityId);
  if (!meta || !city || meta.currentOwnerId !== actor) return 'Escolha uma cidade própria.';
  // Avanço is its own Order (canon §2: target "—"): the city only carries the research, so it is not one of the city's activations (E-1).
  if (action === 'RESEARCH') return null;
  const occupied = meta.status === 'OCCUPIED' || state.occupations.some(occupation => occupation.cityId === cityId);
  if (occupied && action !== 'CIVIC_ACTION') return 'Cidade ocupada: apenas a Ação Cívica de integração está disponível.';
  const activations = cityActivations(state, actor, cityId)!;
  if(moodBand(meta.mood)==='REVOLT'&&action!=='PROMOTE_MOOD'&&action!=='EMERGENCY_GOVERN'&&action!=='CIVIC_ACTION')return 'Cidade em Revolta: só Governar (Ânimo e integração) está disponível.';
  if(activations.councilBlocked)return 'Conselho: no máximo uma segunda ativação por rodada em toda a civilização.';
  if(state.phase==='PLANNING'&&activations.left===0)return activations.allowed===1?'Esta cidade já possui sua ação planejada para esta rodada.':'Esta cidade já tem as duas ativações planejadas nesta rodada.';
  if (state.phase==='URBAN_ACTIONS'&&activations.left===0) return 'Esta cidade já usou suas ativações nesta rodada.';
  return null;
}

/** Recrutar for `count` pieces: the Capacity rule of canon §4, then every piece must be recruitable in turn (resources, Soldados, stack). */
export function recruitCountBlock(state: AlphaState, actor: PlayerId, cityId: string, unit: NonNullable<UrbanCommand['unit']>, count: number): string | null {
  if (count > recruitLimit(state, actor, cityId)) return `Esta ativação recruta no máximo ${recruitLimit(state, actor, cityId)} peça(s).`;
  // E-1: while planning, nothing is mobilized yet, so pieces already reserved by earlier planned Recrutar in this city must be
  // counted against the Soldados/Disponíveis left, or the second plan would be accepted and lost at resolution.
  const reserved = state.phase === 'PLANNING'
    ? state.players.find(player => player.playerId === actor)!.plannedActions.flatMap(planned => planned.type === 'URBAN_ACTION' && planned.action === 'RECRUIT' && planned.cityId === cityId && planned.unit ? Array<NonNullable<UrbanCommand['unit']>>(planned.count ?? 1).fill(planned.unit) : [])
    : [];
  if (count === 1 && reserved.length === 0) return recruitBlock(state, actor, cityId, unit);
  const trial = structuredClone(state);
  for (const earlier of reserved) { if (mobilizationBlock(trial, cityId, earlier) === null) mobilize(trial, cityId, earlier); }
  for (let index = 0; index < count; index++) {
    const blocked = recruitBlock(trial, actor, cityId, unit);
    if (blocked) return count > 1 && index > 0 ? `Só ${index} das ${count} peças podem ser recrutadas: ${blocked}` : blocked;
    recruitUnit(trial, actor, cityId, unit); mobilize(trial, cityId, unit);
  }
  return null;
}

const ACTION_PT: Record<UrbanAction, string> = { PRODUCE: 'Produzir', BUILD: 'Construir', RECRUIT: 'Recrutar', RESEARCH: 'Pesquisar', ELEVATE: 'Elevar', PROMOTE_MOOD: 'Governar', EMERGENCY_GOVERN: 'Recuperação emergencial', SUPPORT_TRADE: 'Sustentar rota', CIVIC_ACTION: 'Ação cívica', MOVE_CAPITAL: 'Mover a capital' };
/** What the earlier plans of the round will have done by the time a later one resolves: the state after them and a line per plan that moved Cultura, Riqueza, Pedra or Ânimo. */
export interface PlanTrial { state: AlphaState; used: { label: string; cityId: string; spent: string; mood: number }[] }

/**
 * D4 (decision: simulation, not reservation). A plan only reads the stock at the moment it is queued, but the round resolves them one after another, so
 * Governar queued after a Construir that spends the last Cultura would die at resolution and the Ordem would be lost. While planning, the earlier plans of the
 * same player are run in order on a clone (`recruitCountBlock` does the same for Recrutar) and the later plan is judged against what is left. A plan that would
 * already fail is skipped, as the resolver drops it. Nothing is stored in the plan: the queue keeps its shape and old snapshots keep loading. Rivals' plans
 * cannot touch this player's stock, so only the player's own queue is replayed. Null when there is nothing earlier to replay or the round is not planning.
 */
export function plannedTrial(state: AlphaState, actor: PlayerId): PlanTrial | null {
  if (state.phase !== 'PLANNING') return null;
  const earlier = state.players.find(player => player.playerId === actor)?.plannedActions.filter((planned): planned is Extract<typeof planned, { type: 'URBAN_ACTION' }> => planned.type === 'URBAN_ACTION') ?? [];
  if (!earlier.length) return null;
  const trial = structuredClone(state);
  trial.phase = 'URBAN_ACTIONS';
  const progress = trial.players.find(player => player.playerId === actor)!;
  progress.ready = false;
  const used: PlanTrial['used'] = [];
  for (const plan of earlier) {
    const { id, ...payload } = plan;
    progress.plannedActions = progress.plannedActions.filter(item => item.id !== id);
    const stock = { ...progress.resources }, mood = trial.cities.find(candidate => candidate.cityId === plan.cityId)?.mood ?? 0;
    try { performUrbanAction(trial, actor, { ...payload, planId: id, expectedVersion: trial.version } as UrbanCommand); } catch { continue; }
    const cityName = trial.core.players.flatMap(player => player.civilization.cities).find(candidate => candidate.id === plan.cityId)?.name ?? plan.cityId;
    const spent = (['culture', 'wealth', 'stone'] as const).filter(key => stock[key] > progress.resources[key]).map(key => `${stock[key] - progress.resources[key]} ${key === 'culture' ? 'Cultura' : key === 'wealth' ? 'Riqueza' : 'Pedra'}`).join(' + ');
    const moodDelta = (trial.cities.find(candidate => candidate.cityId === plan.cityId)?.mood ?? 0) - mood;
    if (spent || moodDelta !== 0) used.push({ label: `${ACTION_PT[plan.action]} em ${cityName}`, cityId: plan.cityId, spent, mood: moodDelta });
  }
  return { state: trial, used };
}
/** At resolution: what the plans that already ran this round did, so a Governar that lost its resource names who took it. */
const earlierPlansNote = (state: AlphaState, actor: PlayerId): string => {
  const done = state.events.filter(event => event.round === state.core.round && event.type === 'URBAN_ACTION' && event.audience?.includes(actor)).map(event => event.message.replace(/\.$/, ''));
  return done.length ? ` Planos anteriores desta rodada já resolvidos: ${done.join('; ')}.` : '';
};
export const trialNote = (trial: PlanTrial): string => {
  const lines = trial.used.map(item => `${item.label}${item.spent ? ` (gasta ${item.spent})` : ''}${item.mood ? ` (Ânimo ${item.mood > 0 ? '+' : ''}${item.mood})` : ''}`);
  return lines.length ? `Planos anteriores desta rodada: ${lines.join('; ')}.` : 'Planos anteriores desta rodada mudam o cenário.';
};
/** Governar's gate while planning: judged on the stock now and on the stock the earlier plans leave, with the plan that took the resource named. */
function governPlanBlock(state: AlphaState, actor: PlayerId, cityId: string, levels: number | undefined, trial: PlanTrial | null): string | null {
  const now = governBlock(state, actor, cityId, levels);
  if (now || !trial) return now;
  const later = governBlock(trial.state, actor, cityId, levels);
  if (!later) return null;
  const missing = governQuote(trial.state, actor, cityId).blockers[0]?.missing?.resource;
  const lead = missing === 'stone' ? 'Pedra insuficiente na resolução. ' : /custa|faltam/.test(later) ? 'Cultura/Riqueza insuficiente na resolução. ' : 'Na resolução: ';
  return `${lead}${later} ${trialNote(trial)}`;
}

/** Route income from the Web: Moeda +1, Economia Comercial +2, Autossuficiência −1 (canon §12). */
export const webRouteIncome = (state: AlphaState, actor: PlayerId): number => (hasUnlock(state, actor, 'rule:route-plus-1') ? 1 : 0) + (hasUnlock(state, actor, 'rule:route-plus-2') ? 2 : 0) - (hasUnlock(state, actor, 'rule:route-minus-1') ? 1 : 0);
export function buildBlock(state: AlphaState, actor: PlayerId, cityId: string, build: BuildTarget): string | null {
  const owner = state.core.players.find(player => player.id === actor)!, progress = state.players.find(player => player.playerId === actor)!;
  const city = owner.civilization.cities.find(candidate => candidate.id === cityId)!, meta = state.cities.find(candidate => candidate.cityId === cityId)!;
  const rules = state.core.config.territory;
  if (build.kind === 'DISTRICT') {
    const entry = rules.districts[build.district];
    if (city.districts.some(item => item.type === build.district)) return 'Um distrito de cada tipo por cidade.';
    if (city.districts.length >= districtSlots(state, cityId)) return 'Sem vagas de distrito: Eleve a cidade.';
    if (!hasUnlock(state, actor, `district:${build.district}`)) return 'Este distrito exige um avanço da Teia.';
    return alphaCanAfford(state, actor, entry.cost, 'BUILD') ? null : 'Recursos insuficientes para esta ação.';
  }
  if (build.kind === 'BUILDING') {
    const spec = buildingSpec(build.building);
    // V1.2 B0: only a building whose effect the engine really applies can be bought.
    if (!OFFERED_BUILDINGS.includes(build.building)) return spec.path === 'DISTRICT' ? 'O Porto vem com o Distrito Marítimo.' : spec.path === 'IMPROVEMENT' ? 'Irrigação é melhoria de hex, não edifício.' : 'Este edifício ainda não está disponível.';
    if (spec.path === 'CATALOG') {
      if (!meta.districts.includes(spec.district)) return 'O edifício exige o distrito correspondente.';
      if (meta.buildings.includes(build.building)) return 'Este edifício já existe.';
      if (!hasUnlock(state, actor, `building:${build.building}`)) return 'Este edifício exige um avanço da Teia.';
      return alphaCanAfford(state, actor, spec.cost!, 'BUILD') ? null : 'Recursos insuficientes para esta ação.';
    }
    const entry = rules.buildings[build.building as CoreBuilding];
    if (!city.districts.some(item => item.type === entry.district)) return 'O edifício exige o distrito correspondente.';
    if (city.buildings.some(item => item.type === build.building)) return 'Este edifício já existe.';
    return alphaCanAfford(state, actor, entry.cost, 'BUILD') ? null : 'Recursos insuficientes para esta ação.';
  }
  if (build.kind === 'MARITIME') {
    if (meta.districts.includes('MARITIME')) return 'Um distrito de cada tipo por cidade.';
    if (!isCoastalCity(state, cityId)) return 'O Distrito Marítimo exige uma borda d’água navegável.';
    if (meta.districts.length >= districtSlots(state, cityId)) return 'Sem vagas de distrito: Eleve a cidade.';
    if (!hasUnlock(state, actor, 'district:MARITIME')) return 'Este distrito exige um avanço da Teia.';
    return alphaCanAfford(state, actor, districtEntry('MARITIME').cost, 'BUILD') ? null : 'Recursos insuficientes para esta ação.';
  }
  const next = FORTIFICATION_UPGRADES[FORTIFICATION_UPGRADES.indexOf(meta.fortification.level as never) + 1];
  if (!next) return 'A cidade já possui a fortificação máxima.';
  const spec = state.rules.balance.fortification[next];
  if (AlphaEraSchema.options.indexOf(progress.era) < AlphaEraSchema.options.indexOf(spec.era)) return 'Sua civilização ainda não alcançou a era exigida.';
  if (spec.militaryDistrict && !city.districts.some(item => item.type === 'MILITARY')) return 'Esta fortificação requer distrito Militar.';
  const capped = kitFortificationBlock(state, actor, next); if (capped) return capped;
  return alphaCanAfford(state, actor, alphaCostWithMetal(state, actor, spec.cost, spec.metal), 'BUILD') ? null : 'Recursos insuficientes para esta ação.';
}

/** Everything that can stop an urban action, in one pure function shared by the action and the client preview. */
export function urbanBlock(state: AlphaState, actor: PlayerId, cityId: string, action: UrbanAction, params: UrbanParams = {}, trial?: PlanTrial | null): string | null {
  const gate = cityGate(state, actor, cityId, action);
  if (gate) return gate;
  const meta = state.cities.find(candidate => candidate.cityId === cityId)!;
  // `levels` belongs to Governar alone; refused here so the Ordem is not queued and lost at resolution (the resolver's rejectExtras would fail it there).
  if (params.levels !== undefined && action !== 'PROMOTE_MOOD') return `A ação ${action} não aceita o parâmetro levels.`;
  switch (action) {
    case 'PRODUCE': return null;
    case 'ELEVATE': return elevateBlock(state, actor, cityId);
    case 'BUILD': return params.build ? buildBlock(state, actor, cityId, params.build) : 'Escolha o que construir.';
    case 'RECRUIT': return params.unit ? recruitCountBlock(state, actor, cityId, params.unit, params.count ?? 1) : 'Escolha a peça a recrutar.';
    case 'RESEARCH': {
      if (!params.advancementId) return 'Escolha o avanço a pesquisar.';
      // While planning, a second city cannot reserve an advancement another city already reserved: it would be a lost action.
      const reserved = state.phase === 'PLANNING' && state.players.find(player => player.playerId === actor)?.plannedActions.some(planned => planned.type === 'URBAN_ACTION' && planned.action === 'RESEARCH' && planned.advancementId === params.advancementId);
      return reserved ? 'Este avanço já está planejado em outra cidade nesta rodada.' : researchBlock(state, actor, params.advancementId);
    }
    case 'PROMOTE_MOOD': return governPlanBlock(state, actor, cityId, params.levels, trial === undefined ? plannedTrial(state, actor) : trial);
    case 'EMERGENCY_GOVERN': return emergencyGovernBlock(state, actor, cityId);
    case 'SUPPORT_TRADE':
      return state.routes.some(route => route.ownerId === actor && route.fromCityId === cityId && !route.suspended) ? null : 'A cidade não origina nenhuma rota comercial ativa.';
    case 'MOVE_CAPITAL':
      return state.core.players.find(player => player.id === actor)?.civilization.capitalCityId === cityId ? 'Esta cidade já é a capital.' : null;
    case 'CIVIC_ACTION': {
      if (meta.status !== 'OCCUPIED' && !state.occupations.some(occupation => occupation.cityId === cityId)) return null;
      const occupation = state.occupations.find(candidate => candidate.cityId === cityId && candidate.occupierId === actor);
      if (occupation && state.core.round <= occupation.sinceRound) return 'A integração fica disponível na rodada seguinte à captura.';
      return alphaCanAfford(state, actor, state.rules.integrationCost) ? null : 'Recursos insuficientes para esta ação.';
    }
  }
}

/** What an action costs the player, in the seven-resource vocabulary, for display before confirming. */
export function urbanCost(state: AlphaState, actor: PlayerId, cityId: string, action: UrbanAction, params: UrbanParams = {}): AlphaResourcePool {
  const zero = emptyAlphaResourcePool(), territory = state.core.config.territory, balance = state.rules.balance;
  const cityMeta = state.cities.find(candidate => candidate.cityId === cityId);
  if (action === 'BUILD' && params.build?.kind === 'DISTRICT') return alphaCostWithMetal(state, actor, territory.districts[params.build.district].cost, 0);
  if (action === 'BUILD' && params.build?.kind === 'MARITIME') return { ...districtEntry('MARITIME').cost };
  if (action === 'BUILD' && params.build?.kind === 'BUILDING') {
    const spec = buildingSpec(params.build.building);
    return spec.path === 'CATALOG' ? { ...spec.cost! } : spec.path === 'CORE' ? alphaCostWithMetal(state, actor, territory.buildings[params.build.building as CoreBuilding].cost, 0) : zero;
  }
  if (action === 'BUILD' && params.build?.kind === 'FORTIFICATION' && cityMeta) {
    const next = FORTIFICATION_UPGRADES[FORTIFICATION_UPGRADES.indexOf(cityMeta.fortification.level as never) + 1];
    return next ? alphaCostWithMetal(state, actor, balance.fortification[next].cost, balance.fortification[next].metal) : zero;
  }
  if (action === 'ELEVATE') { const next = nextLevel(cityMeta?.level ?? 'OUTPOST'); return next ? elevateRequirement(next, state.rules.pace)!.cost : zero; }
  if (action === 'RECRUIT' && params.unit) {
    const price = kitUnitCost(state, actor, params.unit, cityId), one = alphaCostWithMetal(state, actor, price.cost, price.metal), count = params.count ?? 1;
    return Object.fromEntries(ALPHA_RESOURCE_KEYS.map(key => [key, one[key] * count])) as AlphaResourcePool;
  }
  if (action === 'RESEARCH' && params.advancementId) return alphaCostWithMetal(state, actor, advanceCost(state, actor, params.advancementId), 0);
  if (action === 'PROMOTE_MOOD') {
    // The total of what the activation will charge (D4): the chosen levels, or as many as it reaches by default, plus the Pedra of the repair it also does. A blocked Governar shows one level, the price it is missing.
    const reach = governQuote(state, actor, cityId), quoted = params.levels ?? (reach.maxLevels || (reach.repairOnly ? 0 : 1));
    return governCost(state, actor, quoted, cityId);
  }
  if (action === 'CIVIC_ACTION' && cityMeta?.status === 'OCCUPIED') return { ...zero, influence: state.rules.integrationCost.influence };
  return zero;
}

/** What PRODUCE would credit this city now (canon §4–§6), shared by the option text and the growth forecast. */
export function productionOutput(state: AlphaState, actor: PlayerId, cityId: string) {
  const yields = cityYield(state, cityId);
  const output = yields.output;
  return { output, metal: yields.metal, capacity: yields.capacity, hexes: yields.hexes, notes: yields.notes, onProduce: recurringAmounts(state, actor, 'ON_PRODUCE', cityId) };
}
/**
 * Everything one PRODUCE activation credits, by origin, before the storage limit: the land and roles (`land`), the recurring ON_PRODUCE effects (`recurring`), the mine (`metal`)
 * and the civilization kit (`kit`). `gross` is their sum per resource. The activation itself, its message and the Ficha de Ação read this, so none of them recomputes it.
 */
export interface ProduceBreakdown {
  capacity: number; gross: AlphaResourcePool; land: AlphaResourcePool; recurring: AlphaResourcePool; kit: { food: number; stone: number }; metal: number;
  /** Prospera on its first activation of the round: +1 Capacity (already inside `capacity`). */
  prosperousBonus: boolean;
  producers: { total: number; working: number; idle: number }; workedHexes: string[];
  /** Worked hexes the Capacity leaves out and what they would have yielded; worked hexes held by a world threat. */
  forgone: { hexes: string[]; output: AlphaResourcePool; metal: number }; threatened: string[];
  notes: string[];
}
export function produceBreakdown(state: AlphaState, actor: PlayerId, cityId: string): ProduceBreakdown {
  const yields = cityYield(state, cityId), recurring = recurringAmounts(state, actor, 'ON_PRODUCE', cityId), kit = kitProduceBonus(state, actor, cityId);
  const gross = { ...yields.output, metal: yields.output.metal + yields.metal };
  for (const key of ALPHA_RESOURCE_KEYS) gross[key] += recurring[key];
  gross.food += kit.food; gross.stone += kit.stone;
  const meta = state.cities.find(candidate => candidate.cityId === cityId);
  const forgone = yields.forgone ?? { hexes: [], output: emptyAlphaResourcePool(), metal: 0 };
  return {
    capacity: yields.capacity, gross, land: { ...yields.output, metal: yields.output.metal + yields.metal }, recurring, kit, metal: yields.metal,
    prosperousBonus: !!meta && moodBand(meta.mood) === 'PROSPEROUS' && meta.urbanActionsUsed === 0,
    producers: yields.producers ?? { total: 0, working: 0, idle: 0 }, workedHexes: yields.hexes, forgone: { ...forgone, output: { ...forgone.output, metal: forgone.output.metal + forgone.metal } }, threatened: yields.threatened ?? [], notes: yields.notes,
  };
}
const GAIN_NAMES: Record<string, string> = { food: 'Alimento', wood: 'Madeira', stone: 'Pedra', metal: 'Metal', wealth: 'Riqueza', knowledge: 'Conhecimento', influence: 'Influência', culture: 'Cultura' };
const gainsText = (pool: Partial<Record<string, number>>): string => ALPHA_RESOURCE_KEYS.filter(key => (pool[key] ?? 0) > 0).map(key => `+${pool[key]} ${GAIN_NAMES[key]}`).join(', ');
/** The resolution message of PRODUCE: the real gain per resource, then what the Capacity left out and what the storage limit discarded. */
function produceMessage(cityName: string, gained: Partial<Record<string, number>>, plan: ProduceBreakdown, discarded: Partial<Record<string, number>>): string {
  const lost = gainsText(plan.forgone.output).replace(/\+/g, '−');
  const full = gainsText(discarded).replace(/\+/g, '−');
  const parts = [`${cityName} produziu${gainsText(gained) ? ` ${gainsText(gained)}` : ' nada'}.`];
  if (plan.forgone.hexes.length) parts.push(`Capacidade ${plan.capacity}: ${plan.forgone.hexes.length} hex(es) sem trabalhador nesta ativação${lost ? ` (${lost} deixados de render)` : ''}.`);
  if (plan.threatened.length) parts.push(`${plan.threatened.length} hex(es) ocupado(s) por ameaça não renderam.`);
  if (full) parts.push(`Armazenamento cheio: descartado ${full.replace(/−/g, '')}.`);
  return parts.join(' ');
}
// Legacy "materials" contributions are summed before the split into Madeira and Pedra, so alone they read as both.
const RESOURCE_LABEL: Record<string, string> = { food: 'Alimentos', materials: 'Madeira/Pedra', wood: 'Madeira', stone: 'Pedra', wealth: 'Riqueza', knowledge: 'Conhecimento', influence: 'Influência', culture: 'Cultura', metal: 'Metal' };
const listOf = (pool: Record<string, number>) => Object.entries(pool).filter(([, amount]) => amount > 0).map(([key, amount]) => `+${amount} ${RESOURCE_LABEL[key]}`).join(', ');

/**
 * What Governar offers a city, computed by the engine so the client never recalculates it (D4). `levels` has one entry per choosable number of levels
 * (the TOTAL cost of that choice, Pedra of the repair when it also happens); it is judged against the stock the earlier plans of the round leave.
 */
export interface GovernView {
  /** Ânimo the levels start from (after the earlier plans of the round) and, when different, the Ânimo today. */
  mood: number; moodNow?: number;
  maxLevels: number; moodRoom: number; capacityLevels: number; limitedBy: 'MOOD' | 'CAPACITY' | 'RESOURCES';
  repairOnly: boolean;
  levels: GovernLevelQuote[];
  blockers: (Omit<GovernBlocker, 'code'> & { code: GovernBlocker['code'] | 'GATE' | 'PLANNED' })[];
  /** The free recovery of a city in Revolta: available when the engine would accept it now; it takes the Ânimo to `moodAfter` and costs no Cultura or Riqueza. */
  emergency: { available: boolean; moodAfter: number; reason: string | null };
}
export interface UrbanOption {
  action: UrbanAction; build?: BuildTarget; unit?: UrbanCommand['unit']; advancementId?: string;
  actionClass:'MAIN'; cost: AlphaResourcePool; effect: string; blocked: string | null;
  /** Only on PROMOTE_MOOD. */
  govern?: GovernView;
}
function option(state: AlphaState, actor: PlayerId, cityId: string, action: UrbanAction, params: UrbanParams, effect: string, trial?: PlanTrial | null): UrbanOption {
  // Governar's price is the one the resolution will charge, so it is read from the state the earlier plans leave.
  const priced = action === 'PROMOTE_MOOD' && trial ? trial.state : state;
  return { action, ...params, actionClass:'MAIN', cost: urbanCost(priced, actor, cityId, action, params), effect, blocked: urbanBlock(state, actor, cityId, action, params, trial) };
}
function governView(state: AlphaState, actor: PlayerId, cityId: string, trial: PlanTrial | null): GovernView {
  const now = governQuote(state, actor, cityId), later = trial ? governQuote(trial.state, actor, cityId) : now;
  const blockers: GovernView['blockers'] = [];
  const gate = cityGate(state, actor, cityId, 'PROMOTE_MOOD');
  if (gate) blockers.push({ code: 'GATE', message: gate });
  if (now.blockers.length) blockers.push(...now.blockers);
  else if (later.blockers.length) blockers.push(...later.blockers.map(blocker => ({ ...blocker, code: 'PLANNED' as const, message: `${blocker.message} ${trial ? trialNote(trial) : ''}`.trim() })));
  const emergency = urbanBlock(state, actor, cityId, 'EMERGENCY_GOVERN');
  return {
    mood: later.mood, ...(later.mood !== now.mood ? { moodNow: now.mood } : {}), maxLevels: later.maxLevels, moodRoom: later.moodRoom, capacityLevels: later.capacityLevels, limitedBy: later.limitedBy, repairOnly: later.repairOnly,
    levels: later.levels, blockers, emergency: { available: emergency === null, moodAfter: REVOLT_EMERGENCY_MOOD, reason: emergency },
  };
}
function governEffect(view: GovernView): string {
  const ceiling = Math.min(view.moodRoom, view.capacityLevels);
  if (view.repairOnly) return 'Governar: a cidade já está Próspera; só repara 1 passo de fortificação por 1 Pedra.';
  const reach = view.maxLevels > 0 ? `até ${view.maxLevels} nível(is)${view.maxLevels < ceiling ? ` com seus recursos (a Capacidade e o Ânimo permitiriam ${ceiling})` : view.limitedBy === 'MOOD' ? ' (até Próspera)' : ' (limite da Capacidade)'}` : `nenhum nível pago agora (a Capacidade e o Ânimo permitiriam até ${ceiling})`;
  return `Governar: +1 Ânimo por nível pago (1 Cultura ou 2 Riqueza), ${reach}; repara 1 passo de fortificação por 1 Pedra`;
}

/** Every urban option for the player's cities (plus research, which is not city-specific), with cost, effect and the reason it is blocked. */
export function urbanOptions(state: AlphaState, actor: PlayerId): { cities: Record<string, UrbanOption[]>; research: UrbanOption[] } {
  const territory = state.core.config.territory, balance = state.rules.balance;
  const cities: Record<string, UrbanOption[]> = {};
  const owned = state.cities.filter(meta => meta.currentOwnerId === actor);
  // Governar is judged against what the earlier plans leave (one replay for all the cities).
  const trial = plannedTrial(state, actor);
  for (const meta of owned) {
    const id = meta.cityId, list: UrbanOption[] = [];
    const occupied = meta.status === 'OCCUPIED';
    const produced = productionOutput(state, actor, id);
    const yields = listOf({ ...produced.output, metal: produced.output.metal + produced.metal });
    const extra = listOf(produced.onProduce);
    list.push(option(state, actor, id, 'PRODUCE', {}, `${yields || 'Sem rendimento agora'}${extra ? ` · Bônus da produção: ${extra}` : ''} · Capacidade ${produced.capacity}. Sem esta escolha a cidade não produz.`));
    const higher = nextLevel(meta.level);
    list.push(option(state, actor, id, 'ELEVATE', {}, higher ? `Elevar a ${higher}: Capacidade ${ladderStep(higher).capacity}, ${ladderStep(higher).slots} vaga(s), suprimento ${ladderStep(higher).supplyReach}` : 'Nível máximo'));
    for (const district of DistrictTypeSchema.options) list.push(option(state, actor, id, 'BUILD', { build: { kind: 'DISTRICT', district } }, `Novo distrito${listOf(territory.districts[district].production) ? ` · ${listOf(territory.districts[district].production)}` : ''}`));
    for (const building of OFFERED_BUILDINGS) {
      const spec = buildingSpec(building);
      // One of each storage building counts per civilization: say so before the player pays for a second one.
      const duplicate = spec.path === 'CATALOG' && /limite/i.test(spec.effect) && state.cities.some(other => other.currentOwnerId === actor && other.cityId !== id && other.buildings.includes(building));
      list.push(option(state, actor, id, 'BUILD', { build: { kind: 'BUILDING', building } }, `${spec.name} · ${spec.effect}${duplicate ? ' Já existe um na civilização: o limite não soma de novo.' : ''}`));
    }
    list.push(option(state, actor, id, 'BUILD', { build: { kind: 'MARITIME' } }, `Distrito Marítimo · Porto incluído · +1 Alimento por Produzir`));
    const next = FORTIFICATION_UPGRADES[FORTIFICATION_UPGRADES.indexOf(meta.fortification.level as never) + 1];
    list.push(option(state, actor, id, 'BUILD', { build: { kind: 'FORTIFICATION' } }, next ? `Fortificação ${next}` : 'Fortificação máxima'));
    for (const unit of AlphaUnitClassSchema.options) list.push(option(state, actor, id, 'RECRUIT', { unit }, `Força ${state.rules.units[unit].strength} · Movimento ${state.rules.units[unit].movement} · até ${recruitLimit(state, actor, id)} peça(s) por ativação`));
    const govern = governView(state, actor, id, trial);
    list.push({ ...option(state, actor, id, 'PROMOTE_MOOD', {}, governEffect(govern), trial), govern });
    list.push(option(state, actor, id, 'EMERGENCY_GOVERN', {}, `Recuperação emergencial: só em Revolta, uma vez por episódio, sem Cultura nem Riqueza. Leva o Ânimo a ${REVOLT_EMERGENCY_MOOD}; não produz nem alimenta — Produza na rodada seguinte.`));
    list.push(option(state, actor, id, 'SUPPORT_TRADE', {}, `Renda de rota: +${state.rules.routeIncome + governmentEffects(state, actor).routeWealth + webRouteIncome(state, actor)} Riqueza por rota originada`));
    list.push(option(state, actor, id, 'MOVE_CAPITAL', {}, `Mover a capital para cá (${governmentEffects(state, actor).moveCapitalOrders} Ordem(ns)); a Administração, a Capacidade da capital e a guarnição acompanham`));
    list.push(option(state, actor, id, 'CIVIC_ACTION', {}, occupied ? `Integração +${balance.integrationPerAction + leaderIntegrationBonus(state, actor)}%` : `+${balance.civicInfluence} Influência e coesão local`));
    cities[id] = list;
  }
  const firstCity = owned[0]?.cityId;
  const progress = state.players.find(player => player.playerId === actor)!;
  const research: UrbanOption[] = firstCity === undefined ? [] : [...ADVANCEMENTS, ...heritageFor(state, actor)]
    .filter(node => !progress.research.includes(node.id) && AlphaEraSchema.options.indexOf(node.era) <= AlphaEraSchema.options.indexOf(progress.era))
    .map(node => ({
      ...option(state, actor, firstCity, 'RESEARCH', { advancementId: node.id }, 'description' in node ? node.description : `Herança · ${node.effect}`),
      // Research is not tied to one city: the client adds the selected city's own gate (actions left, occupation).
      blocked: (state.phase !== 'PLANNING' ? 'Disponível apenas no Planejamento.' : progress.ready ? 'Suas decisões já estão confirmadas para esta fase.' : alphaActionUsage(state,actor).used>=alphaActionUsage(state,actor).limit ? 'Sem ações principais disponíveis.' : null) ?? researchBlock(state, actor, node.id),
    }));
  return { cities, research };
}

function rejectExtras(command: UrbanCommand, allowed: readonly ('build' | 'unit' | 'advancementId' | 'count' | 'levels')[]): void {
  for (const key of ['build', 'unit', 'advancementId', 'count', 'levels'] as const) {
    if (command[key] !== undefined && !allowed.includes(key)) throw new Error(`A ação ${command.action} não aceita o parâmetro ${key}.`);
  }
}

/**
 * One urban action per city per round, server-authoritative. Production is not automatic: PRODUCE (with mining) is the
 * normal source of city output, so a city that does not act produces nothing.
 */
export function performUrbanAction(state: AlphaState, actor: PlayerId, command: UrbanCommand): void {
  const balance = state.rules.balance;
  const owner = state.core.players.find(player => player.id === actor)!;
  const progress = state.players.find(player => player.playerId === actor)!;
  const meta = state.cities.find(candidate => candidate.cityId === command.cityId);
  const city = owner.civilization.cities.find(candidate => candidate.id === command.cityId);
  const gate = cityGate(state, actor, command.cityId, command.action);
  if (gate) throw new Error(gate);
  if (!meta || !city) throw new Error('Escolha uma cidade própria.');
  const occupied = meta.status === 'OCCUPIED' || state.occupations.some(occupation => occupation.cityId === city.id);
  const blocked = urbanBlock(state, actor, command.cityId, command.action, { ...(command.build ? { build: command.build } : {}), ...(command.unit ? { unit: command.unit } : {}), ...(command.advancementId ? { advancementId: command.advancementId } : {}), ...(command.count ? { count: command.count } : {}), ...(command.levels ? { levels: command.levels } : {}) }, null);
  if (blocked) throw new Error(command.action === 'PROMOTE_MOOD' && state.phase === 'URBAN_ACTIONS' ? `${blocked}${earlierPlansNote(state, actor)}` : blocked);
  const telemetry = state.telemetry;
  let message = '';
  let governResult: ReturnType<typeof governCity> | null = null;

  switch (command.action) {
    case 'PRODUCE': {
      rejectExtras(command, []);
      const plan = produceBreakdown(state, actor, city.id), stock = { ...progress.resources };
      const { output, metal } = productionOutput(state, actor, city.id);
      alphaGain(state, actor, output, { category: 'production' });
      applyRecurringEffects(state, actor, 'ON_PRODUCE', { cityId: city.id });
      if (metal > 0) alphaGain(state, actor, { metal }, { category: 'mining' });
      const kitBonus = kitProduceBonus(state, actor, city.id);
      if (kitBonus.food || kitBonus.stone) alphaGain(state, actor, { food: kitBonus.food, stone: kitBonus.stone }, { category: 'production' });
      for (const key of ALPHA_RESOURCE_KEYS) telemetry.productionByResource[key] = (telemetry.productionByResource[key] ?? 0) + output[key];
      telemetry.productionByResource.metal += metal;
      // The credited amount is what the pool really gained: the storage limit discards the rest, and the message says so.
      const gained = Object.fromEntries(ALPHA_RESOURCE_KEYS.map(key => [key, Math.max(0, progress.resources[key] - stock[key])])), discarded = Object.fromEntries(ALPHA_RESOURCE_KEYS.map(key => [key, Math.max(0, plan.gross[key] - (progress.resources[key] - stock[key]))]));
      message = produceMessage(city.name, gained, plan, discarded);
      break;
    }
    case 'BUILD': {
      rejectExtras(command, ['build']);
      if (!command.build) throw new Error('Escolha o que construir.');
      if (command.build.kind === 'FORTIFICATION') {
        const next = FORTIFICATION_UPGRADES[FORTIFICATION_UPGRADES.indexOf(meta.fortification.level as never) + 1];
        if (!next) throw new Error('A cidade já possui a fortificação máxima.');
        const spec = balance.fortification[next];
        if (AlphaEraSchema.options.indexOf(progress.era) < AlphaEraSchema.options.indexOf(spec.era)) throw new Error('Sua civilização ainda não alcançou a era exigida.');
        if (spec.militaryDistrict && !city.districts.some(item => item.type === 'MILITARY')) throw new Error('Esta fortificação requer distrito Militar.');
        const capped = kitFortificationBlock(state, actor, next); if (capped) throw new Error(capped);
        alphaPay(state, actor, alphaCostWithMetal(state, actor, spec.cost, spec.metal), 'BUILD');
        meta.fortification = { level: next, state: 'INTACT' };
        message = `${city.name} recebeu a fortificação ${next}.`;
      } else if (command.build.kind === 'BUILDING' && buildingSpec(command.build.building).path === 'CATALOG') {
        // V1.2 B0: the eight buildings whose effect the engine already had. Priced and gated by ALPHA_BUILDING_CATALOG; the effect is read from the city's building list.
        const spec = buildingSpec(command.build.building);
        const blocked = buildBlock(state, actor, city.id, command.build);
        if (blocked) throw new Error(blocked);
        alphaPay(state, actor, spec.cost!, 'BUILD');
        meta.buildings = [...meta.buildings, spec.id];
        message = `${city.name} construiu ${spec.name}.`;
      } else if (command.build.kind === 'MARITIME') {
        const blocked = buildBlock(state, actor, city.id, command.build);
        if (blocked) throw new Error(blocked);
        alphaPay(state, actor, districtEntry('MARITIME').cost, 'BUILD');
        // The basic Porto comes with the district: it is not a separate purchase.
        meta.districts = [...meta.districts, 'MARITIME'];
        meta.buildings = [...meta.buildings.filter(item => item !== 'PORT'), 'PORT'];
        message = `${city.name} concluiu o Distrito Marítimo e seu Porto.`;
      } else {
        const built = command.build.kind === 'DISTRICT'
          ? { type: 'BUILD_DISTRICT' as const, playerId: actor, cityId: city.id, district: command.build.district, expectedVersion: state.core.version }
          : { type: 'BUILD_BUILDING' as const, playerId: actor, cityId: city.id, building: command.build.building, expectedVersion: state.core.version };
        const result = applyCommand(state.core, built, alphaResourcePayment(state, 'BUILD'));
        if (!result.ok) throw new Error(result.error.message);
        state.core = result.value;
        syncCityMetadata(state);
        message = `${city.name} concluiu uma construção.`;
      }
      break;
    }
    case 'ELEVATE': {
      rejectExtras(command, []);
      const level = elevateCity(state, actor, city.id);
      mirrorDevelopment(state);
      message = `${city.name} foi elevada a ${level}.`;
      break;
    }
    case 'RECRUIT': {
      rejectExtras(command, ['unit', 'count']);
      if (!command.unit) throw new Error('Escolha a peça a recrutar.');
      const count = command.count ?? 1;
      if (count > recruitLimit(state, actor, city.id)) throw new Error(`Esta ativação recruta no máximo ${recruitLimit(state, actor, city.id)} peça(s).`);
      for (let index = 0; index < count; index++) { recruitUnit(state, actor, city.id, command.unit); mobilize(state, city.id, command.unit); }
      telemetry.unitRecruitment[command.unit] = (telemetry.unitRecruitment[command.unit] ?? 0) + count;
      message = count === 1 ? `${city.name} recrutou uma peça.` : `${city.name} recrutou ${count} peças.`;
      break;
    }
    case 'RESEARCH': {
      rejectExtras(command, ['advancementId']);
      if (!command.advancementId) throw new Error('Escolha o avanço a pesquisar.');
      researchAdvancement(state, actor, command.advancementId);
      const domain = ADVANCEMENTS.find(node => node.id === command.advancementId)?.domain ?? 'HERITAGE';
      telemetry.researchByDomain[domain] = (telemetry.researchByDomain[domain] ?? 0) + 1;
      message = `${city.name} concluiu uma pesquisa.`;
      break;
    }
    case 'PROMOTE_MOOD': {
      rejectExtras(command, ['levels']);
      const governed = governCity(state, actor, city.id, command.levels);
      governResult = governed;
      break;
    }
    case 'EMERGENCY_GOVERN': {
      rejectExtras(command, []);
      const gained = emergencyGovern(state, actor, city.id);
      message = `${city.name} saiu da Revolta por recuperação emergencial: Ânimo +${gained}.`;
      break;
    }
    case 'SUPPORT_TRADE': {
      rejectExtras(command, []);
      const routes = state.routes.filter(route => route.ownerId === actor && route.fromCityId === city.id && !route.suspended);
      if (routes.length === 0) throw new Error('A cidade não origina nenhuma rota comercial ativa.');
      for (const route of routes) {
        alphaGainLegacy(state, actor, { wealth: governmentEffects(state, actor).shakenCitiesProduceNoWealth && moodBand(meta.mood) === 'SHAKEN' ? 0 : Math.max(0, state.rules.routeIncome + kitRouteIncome(state, actor) + governmentEffects(state, actor).routeWealth + webRouteIncome(state, actor)) }, { category: 'trade' });
        const receiver = state.core.players.find(player => player.civilization.cities.some(candidate => candidate.id === route.toCityId));
        if (receiver && receiver.id !== actor) alphaGainLegacy(state, receiver.id, { wealth: state.rules.foreignRouteIncome }, { category: 'trade' });
      }
      message = `${city.name} sustentou ${routes.length} rota(s) comercial(is).`;
      break;
    }
    case 'MOVE_CAPITAL': {
      rejectExtras(command, []);
      owner.civilization = { ...owner.civilization, capitalCityId: city.id };
      for (const other of state.cities) if (other.currentOwnerId === actor) other.capital = other.cityId === city.id;
      message = `${city.name} é a nova capital.`;
      break;
    }
    case 'CIVIC_ACTION': {
      rejectExtras(command, []);
      if (occupied) {
        const occupation = state.occupations.find(candidate => candidate.cityId === city.id && candidate.occupierId === actor);
        if (occupation && state.core.round <= occupation.sinceRound) throw new Error('A integração fica disponível na rodada seguinte à captura.');
        alphaPay(state, actor, state.rules.integrationCost);
        meta.integration = Math.min(100, meta.integration + balance.integrationPerAction + leaderIntegrationBonus(state, actor));
        telemetry.cityIntegration += 1;
        if (meta.integration >= 100) {
          meta.status = 'OWNED';
          state.occupations = state.occupations.filter(occupation => occupation.cityId !== city.id);
        }
        message = `${city.name} avançou na integração (${meta.integration}%).`;
      } else {
        alphaGain(state, actor, { influence: balance.civicInfluence });
        meta.localCohesion = Math.min(100, meta.localCohesion + balance.civicCohesion);
        message = `${city.name} realizou uma ação cívica.`;
      }
      break;
    }
  }
  if (command.action !== 'RESEARCH') {
    meta.urbanActionsUsed += 1;
    // The second activation of the round costs one Ânimo (canon §10), unless this city's Tribunal waives it (once per round in the whole civilization).
    if (meta.urbanActionsUsed === 2) {
      if (courtWaives(state, actor, meta)) alphaEvent(state, 'COURT_WAIVER', `Tribunal: a segunda ativação de ${city.name} não custou Ânimo.`, [actor]);
      else { const was = meta.mood; meta.mood = Math.max(0, meta.mood - 1); if (command.action === 'PRODUCE' && was > meta.mood) message = `${message} 2ª ativação da rodada: −1 Ânimo (fica ${meta.mood}).`; }
    }
  }
  if (governResult) {
    const penalty = meta.mood - governResult.moodAfter;
    message = `${city.name} governou: ${governResult.levels === 0 ? 'sem níveis de Ânimo' : `${governResult.levels} nível(is), Ânimo ${governResult.moodBefore}→${governResult.moodAfter}`}${penalty < 0 ? ` (a 2ª ativação custou ${-penalty} Ânimo: fica ${meta.mood})` : ''}; ${governCostText(governResult.paid) === 'nada' ? 'sem custo' : `pagou ${governCostText(governResult.paid)}`}${governResult.repaired ? '; fortificação reparada' : ''}.`;
  }
  telemetry.actionsByType[command.action] = (telemetry.actionsByType[command.action] ?? 0) + 1;
  alphaEvent(state, 'URBAN_ACTION', message, [actor]);
}

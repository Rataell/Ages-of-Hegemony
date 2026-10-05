import {
  ADVANCEMENTS, AlphaEraSchema, AlphaUnitClassSchema, BuildingTypeSchema, DistrictTypeSchema, FORTIFICATION_UPGRADES, ALPHA_RESOURCE_KEYS, elevateRequirement, emptyAlphaResourcePool, ladderStep, nextLevel,
  type AlphaCommand, type AlphaResourcePool, type AlphaState, type PlayerId,
} from '@aoh/game-domain';
import { applyCommand } from './engine.js';
import { alphaEvent } from './alpha-events.js';
import { leaderIntegrationBonus } from './alpha-leaders.js';
import { recruitBlock, recruitUnit } from './alpha-military.js';
import { governmentEffects } from './alpha-government.js';
import { activationsAllowed, administration, recruitLimit, cityYield, districtSlots, elevateBlock, elevateCity, governBlock, governCity, governCost, mirrorDevelopment, mobilize, moodBand } from './alpha-city.js';
import { advanceCost, applyRecurringEffects, hasUnlock, heritageFor, recurringAmounts, researchAdvancement, researchBlock } from './alpha-institutions.js';
import { alphaCanAfford, alphaCostWithMetal, alphaGain, alphaGainLegacy, alphaPay, alphaResourcePayment } from './alpha-resources.js';
import { alphaActionUsage } from './alpha-actions.js';
import { kitCivicInfluence, kitFortificationBlock, kitProduceBonus, kitRouteIncome, kitUnitCost } from './alpha-kits.js';

type UrbanCommand = Extract<AlphaCommand, { type: 'URBAN_ACTION' }>;

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


type UrbanAction = UrbanCommand['action'];
type BuildTarget = NonNullable<UrbanCommand['build']>;
interface UrbanParams { build?: BuildTarget; unit?: UrbanCommand['unit']; advancementId?: string; count?: number }

/** Gates every urban action shares: phase, readiness, ownership, occupation and remaining city actions. */
function cityGate(state: AlphaState, actor: PlayerId, cityId: string, action: UrbanAction): string | null {
  if (state.phase !== 'PLANNING'&&state.phase !== 'URBAN_ACTIONS') return 'Disponível apenas no Planejamento.';
  if (state.players.find(player => player.playerId === actor)?.ready) return 'Suas decisões já estão confirmadas para esta fase.';
  const actions=alphaActionUsage(state,actor);
  if(actions.used>=actions.limit)return 'Sem ações principais disponíveis nesta rodada.';
  const meta = state.cities.find(candidate => candidate.cityId === cityId);
  const city = state.core.players.find(player => player.id === actor)?.civilization.cities.find(candidate => candidate.id === cityId);
  if (!meta || !city || meta.currentOwnerId !== actor) return 'Escolha uma cidade própria.';
  const occupied = meta.status === 'OCCUPIED' || state.occupations.some(occupation => occupation.cityId === cityId);
  if (occupied && action !== 'CIVIC_ACTION') return 'Cidade ocupada: apenas a Ação Cívica de integração está disponível.';
  const planned=state.players.find(player=>player.playerId===actor)?.plannedActions.filter(candidate=>candidate.type==='URBAN_ACTION'&&candidate.cityId===cityId).length??0;
  // Two activations per round when Estável or Próspera, one when Abalada (canon §10); the second costs one Ânimo when it resolves.
  // Sobre-extensão (canon §4): no second activation anywhere.
  const allowed=Math.min(state.rules.balance.cityActions,activationsAllowed(meta),administration(state,actor).overextended?1:2);
  if(moodBand(meta.mood)==='REVOLT'&&action!=='PROMOTE_MOOD'&&action!=='CIVIC_ACTION')return 'Cidade em Revolta: só Governar (Ânimo e integração) está disponível.';
  // Conselho (canon §16): at most one second activation per round in the whole civilization.
  const secondLimit=governmentEffects(state,actor).secondActivationsPerRound;
  if(secondLimit!==null&&(state.phase==='PLANNING'?planned>=1:meta.urbanActionsUsed>=1)){
    const others=state.cities.filter(other=>other.currentOwnerId===actor&&other.cityId!==cityId);
    const seconds=others.filter(other=>(state.phase==='PLANNING'?state.players.find(player=>player.playerId===actor)!.plannedActions.filter(candidate=>candidate.type==='URBAN_ACTION'&&candidate.cityId===other.cityId).length:other.urbanActionsUsed)>=2).length;
    if(seconds>=secondLimit)return 'Conselho: no máximo uma segunda ativação por rodada em toda a civilização.';
  }
  if(state.phase==='PLANNING'&&planned>=allowed)return allowed===1?'Esta cidade já possui sua ação planejada para esta rodada.':'Esta cidade já tem as duas ativações planejadas nesta rodada.';
  if (state.phase==='URBAN_ACTIONS'&&meta.urbanActionsUsed >= allowed) return 'Esta cidade já usou suas ativações nesta rodada.';
  return null;
}

/** Recrutar for `count` pieces: the Capacity rule of canon §4, then every piece must be recruitable in turn (resources, Soldados, stack). */
function recruitCountBlock(state: AlphaState, actor: PlayerId, cityId: string, unit: NonNullable<UrbanCommand['unit']>, count: number): string | null {
  if (count > recruitLimit(state, actor, cityId)) return `Esta ativação recruta no máximo ${recruitLimit(state, actor, cityId)} peça(s).`;
  if (count === 1) return recruitBlock(state, actor, cityId, unit);
  const trial = structuredClone(state);
  for (let index = 0; index < count; index++) {
    const blocked = recruitBlock(trial, actor, cityId, unit);
    if (blocked) return count > 1 && index > 0 ? `Só ${index} das ${count} peças podem ser recrutadas: ${blocked}` : blocked;
    recruitUnit(trial, actor, cityId, unit); mobilize(trial, cityId, unit);
  }
  return null;
}

/** Route income from the Web: Moeda +1, Economia Comercial +2, Autossuficiência −1 (canon §12). */
export const webRouteIncome = (state: AlphaState, actor: PlayerId): number => (hasUnlock(state, actor, 'rule:route-plus-1') ? 1 : 0) + (hasUnlock(state, actor, 'rule:route-plus-2') ? 2 : 0) - (hasUnlock(state, actor, 'rule:route-minus-1') ? 1 : 0);
function buildBlock(state: AlphaState, actor: PlayerId, cityId: string, build: BuildTarget): string | null {
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
    const entry = rules.buildings[build.building];
    if (!city.districts.some(item => item.type === entry.district)) return 'O edifício exige o distrito correspondente.';
    if (city.buildings.some(item => item.type === build.building)) return 'Este edifício já existe.';
    return alphaCanAfford(state, actor, entry.cost, 'BUILD') ? null : 'Recursos insuficientes para esta ação.';
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
export function urbanBlock(state: AlphaState, actor: PlayerId, cityId: string, action: UrbanAction, params: UrbanParams = {}): string | null {
  const gate = cityGate(state, actor, cityId, action);
  if (gate) return gate;
  const meta = state.cities.find(candidate => candidate.cityId === cityId)!;
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
    case 'PROMOTE_MOOD': return governBlock(state, actor, cityId);
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
  if (action === 'BUILD' && params.build?.kind === 'BUILDING') return alphaCostWithMetal(state, actor, territory.buildings[params.build.building].cost, 0);
  if (action === 'BUILD' && params.build?.kind === 'FORTIFICATION' && cityMeta) {
    const next = FORTIFICATION_UPGRADES[FORTIFICATION_UPGRADES.indexOf(cityMeta.fortification.level as never) + 1];
    return next ? alphaCostWithMetal(state, actor, balance.fortification[next].cost, balance.fortification[next].metal) : zero;
  }
  if (action === 'ELEVATE') { const next = nextLevel(cityMeta?.level ?? 'OUTPOST'); return next ? elevateRequirement(next)!.cost : zero; }
  if (action === 'RECRUIT' && params.unit) {
    const price = kitUnitCost(state, actor, params.unit), one = alphaCostWithMetal(state, actor, price.cost, price.metal), count = params.count ?? 1;
    return Object.fromEntries(ALPHA_RESOURCE_KEYS.map(key => [key, one[key] * count])) as AlphaResourcePool;
  }
  if (action === 'RESEARCH' && params.advancementId) return alphaCostWithMetal(state, actor, advanceCost(state, actor, params.advancementId), 0);
  if (action === 'PROMOTE_MOOD') return governCost(state, actor);
  if (action === 'CIVIC_ACTION' && cityMeta?.status === 'OCCUPIED') return { ...zero, influence: state.rules.integrationCost.influence };
  return zero;
}

/** What PRODUCE would credit this city now (canon §4–§6), shared by the option text and the growth forecast. */
export function productionOutput(state: AlphaState, actor: PlayerId, cityId: string) {
  const yields = cityYield(state, cityId);
  const output = yields.output;
  return { output, metal: yields.metal, capacity: yields.capacity, hexes: yields.hexes, notes: yields.notes, onProduce: recurringAmounts(state, actor, 'ON_PRODUCE', cityId) };
}
// Legacy "materials" contributions are summed before the split into Madeira and Pedra, so alone they read as both.
const RESOURCE_LABEL: Record<string, string> = { food: 'Alimentos', materials: 'Madeira/Pedra', wood: 'Madeira', stone: 'Pedra', wealth: 'Riqueza', knowledge: 'Conhecimento', influence: 'Influência', culture: 'Cultura', metal: 'Metal' };
const listOf = (pool: Record<string, number>) => Object.entries(pool).filter(([, amount]) => amount > 0).map(([key, amount]) => `+${amount} ${RESOURCE_LABEL[key]}`).join(', ');

export interface UrbanOption {
  action: UrbanAction; build?: BuildTarget; unit?: UrbanCommand['unit']; advancementId?: string;
  actionClass:'MAIN'; cost: AlphaResourcePool; effect: string; blocked: string | null;
}
function option(state: AlphaState, actor: PlayerId, cityId: string, action: UrbanAction, params: UrbanParams, effect: string): UrbanOption {
  return { action, ...params, actionClass:'MAIN', cost: urbanCost(state, actor, cityId, action, params), effect, blocked: urbanBlock(state, actor, cityId, action, params) };
}

/** Every urban option for the player's cities (plus research, which is not city-specific), with cost, effect and the reason it is blocked. */
export function urbanOptions(state: AlphaState, actor: PlayerId): { cities: Record<string, UrbanOption[]>; research: UrbanOption[] } {
  const territory = state.core.config.territory, balance = state.rules.balance;
  const cities: Record<string, UrbanOption[]> = {};
  const owned = state.cities.filter(meta => meta.currentOwnerId === actor);
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
    for (const building of BuildingTypeSchema.options) list.push(option(state, actor, id, 'BUILD', { build: { kind: 'BUILDING', building } }, `Novo edifício${listOf(territory.buildings[building].production) ? ` · ${listOf(territory.buildings[building].production)}` : ''}`));
    const next = FORTIFICATION_UPGRADES[FORTIFICATION_UPGRADES.indexOf(meta.fortification.level as never) + 1];
    list.push(option(state, actor, id, 'BUILD', { build: { kind: 'FORTIFICATION' } }, next ? `Fortificação ${next}` : 'Fortificação máxima'));
    for (const unit of AlphaUnitClassSchema.options) list.push(option(state, actor, id, 'RECRUIT', { unit }, `Força ${state.rules.units[unit].strength} · Movimento ${state.rules.units[unit].movement} · até ${recruitLimit(state, actor, id)} peça(s) por ativação`));
    list.push(option(state, actor, id, 'PROMOTE_MOOD', {}, `Governar: +1 Ânimo por nível pago (1 Cultura ou 2 Riqueza), até ${produced.capacity} nível(is); repara 1 passo de fortificação por 1 Pedra`));
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

function rejectExtras(command: UrbanCommand, allowed: readonly ('build' | 'unit' | 'advancementId' | 'count')[]): void {
  for (const key of ['build', 'unit', 'advancementId', 'count'] as const) {
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
  const blocked = urbanBlock(state, actor, command.cityId, command.action, { ...(command.build ? { build: command.build } : {}), ...(command.unit ? { unit: command.unit } : {}), ...(command.advancementId ? { advancementId: command.advancementId } : {}), ...(command.count ? { count: command.count } : {}) });
  if (blocked) throw new Error(blocked);
  const telemetry = state.telemetry;
  let message = '';

  switch (command.action) {
    case 'PRODUCE': {
      rejectExtras(command, []);
      const { output, metal } = productionOutput(state, actor, city.id);
      alphaGain(state, actor, output, { category: 'production' });
      applyRecurringEffects(state, actor, 'ON_PRODUCE', { cityId: city.id });
      if (metal > 0) alphaGain(state, actor, { metal }, { category: 'mining' });
      const kitBonus = kitProduceBonus(state, actor, city.id);
      if (kitBonus.food || kitBonus.stone) alphaGain(state, actor, { food: kitBonus.food, stone: kitBonus.stone }, { category: 'production' });
      for (const key of ALPHA_RESOURCE_KEYS) telemetry.productionByResource[key] = (telemetry.productionByResource[key] ?? 0) + output[key];
      telemetry.productionByResource.metal += metal;
      message = `${city.name} produziu recursos${metal > 0 ? ` e ${metal} de Metal` : ''}.`;
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
      rejectExtras(command, []);
      const governed = governCity(state, actor, city.id);
      message = `${city.name} foi governada: Ânimo +${governed.moodGained}${governed.repaired ? ', fortificação reparada' : ''}.`;
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
        alphaGain(state, actor, { influence: balance.civicInfluence + kitCivicInfluence(state, actor) });
        meta.localCohesion = Math.min(100, meta.localCohesion + balance.civicCohesion);
        message = `${city.name} realizou uma ação cívica.`;
      }
      break;
    }
  }
  meta.urbanActionsUsed += 1;
  // The second activation of the round costs one Ânimo (canon §10).
  if (meta.urbanActionsUsed === 2) meta.mood = Math.max(0, meta.mood - 1);
  telemetry.actionsByType[command.action] = (telemetry.actionsByType[command.action] ?? 0) + 1;
  alphaEvent(state, 'URBAN_ACTION', message, [actor]);
}

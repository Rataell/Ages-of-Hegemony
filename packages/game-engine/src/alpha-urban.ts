import {
  ADVANCEMENTS, AlphaEraSchema, BuildingTypeSchema, DistrictTypeSchema, FORTIFICATION_UPGRADES, RESOURCE_KEYS, legacyToAlphaResources,
  type AlphaCommand, type AlphaState, type PlayerId, type ResourcePool,
} from '@aoh/game-domain';
import { applyCommand } from './engine.js';
import { percent } from './arithmetic.js';
import { deriveCityProductionBreakdown } from './economy.js';
import { alphaEvent } from './alpha-events.js';
import { recruitUnit } from './alpha-military.js';
import { produceInstitutions, researchAdvancement } from './alpha-institutions.js';
import { alphaCostWithMetal, alphaGain, alphaGainLegacy, alphaPay, commitLegacyReducer, ledgerOf, metalSites } from './alpha-resources.js';

type UrbanCommand = Extract<AlphaCommand, { type: 'URBAN_ACTION' }>;

/** Keeps the alpha city records aligned with the districts and buildings the economic core owns. */
export function syncCityMetadata(state: AlphaState): void {
  const coreDistricts = new Set<string>(DistrictTypeSchema.options), coreBuildings = new Set<string>(BuildingTypeSchema.options);
  for (const meta of state.cities) {
    const city = state.core.players.flatMap(player => player.civilization.cities).find(candidate => candidate.id === meta.cityId);
    if (!city) continue;
    meta.districts = [...meta.districts.filter(item => !coreDistricts.has(item)), ...city.districts.map(item => item.type)];
    meta.buildings = [...meta.buildings.filter(item => !coreBuildings.has(item)), ...city.buildings.map(item => item.type)];
  }
}

function rejectExtras(command: UrbanCommand, allowed: readonly ('build' | 'unit' | 'advancementId')[]): void {
  for (const key of ['build', 'unit', 'advancementId'] as const) {
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
  if (!meta || !city || meta.currentOwnerId !== actor) throw new Error('Escolha uma cidade própria.');
  const occupied = meta.status === 'OCCUPIED' || state.occupations.some(occupation => occupation.cityId === city.id);
  if (occupied && command.action !== 'CIVIC_ACTION') throw new Error('Cidade ocupada: apenas a Ação Cívica de integração está disponível.');
  if (meta.urbanActionsUsed >= balance.cityActions) throw new Error('Esta cidade já usou sua ação urbana nesta rodada.');
  const telemetry = state.telemetry;
  let message = '';

  switch (command.action) {
    case 'PRODUCE': {
      rejectExtras(command, []);
      const breakdown = deriveCityProductionBreakdown(city, owner.civilization, state.core.config, state.core.map);
      const moodRate = Math.max(0, 100 + balance.moodEffects[meta.mood]!.productionPercent);
      const overextended = owner.civilization.administrationStatus === 'OVEREXTENDED';
      const output = {} as ResourcePool;
      for (const key of RESOURCE_KEYS) {
        let value = percent(breakdown.total[key], moodRate);
        if (overextended && key !== 'food') value = percent(value, state.core.config.administrativeRules.overextensionEconomicPercent);
        output[key] = value;
      }
      alphaGainLegacy(state, actor, output, { category: 'production' });
      const ledger = ledgerOf(state, actor);
      if (!ledger.institutionsCollected) { ledger.institutionsCollected = true; produceInstitutions(state, actor); }
      const metal = metalSites(state, actor).filter(site => site.cityId === city.id).length * balance.metalPerMine;
      if (metal > 0) alphaGain(state, actor, { metal }, { category: 'mining' });
      const gained = legacyToAlphaResources(output);
      for (const key of Object.keys(gained) as (keyof typeof gained)[]) telemetry.productionByResource[key] += gained[key];
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
        alphaPay(state, actor, alphaCostWithMetal(state, actor, spec.cost, spec.metal));
        meta.fortification = { level: next, state: 'INTACT' };
        message = `${city.name} recebeu a fortificação ${next}.`;
      } else {
        const legacyBefore = { ...owner.resources };
        const built = command.build.kind === 'DISTRICT'
          ? { type: 'BUILD_DISTRICT' as const, playerId: actor, cityId: city.id, district: command.build.district, expectedVersion: state.core.version }
          : { type: 'BUILD_BUILDING' as const, playerId: actor, cityId: city.id, building: command.build.building, expectedVersion: state.core.version };
        const result = applyCommand(state.core, built);
        if (!result.ok) throw new Error(result.error.message);
        state.core = result.value;
        commitLegacyReducer(state, actor, legacyBefore);
        syncCityMetadata(state);
        message = `${city.name} concluiu uma construção.`;
      }
      break;
    }
    case 'RECRUIT': {
      rejectExtras(command, ['unit']);
      if (!command.unit) throw new Error('Escolha a peça a recrutar.');
      recruitUnit(state, actor, city.id, command.unit);
      telemetry.unitRecruitment[command.unit] = (telemetry.unitRecruitment[command.unit] ?? 0) + 1;
      message = `${city.name} recrutou uma peça.`;
      break;
    }
    case 'RESEARCH': {
      rejectExtras(command, ['advancementId']);
      if (!command.advancementId) throw new Error('Escolha o avanço a pesquisar.');
      researchAdvancement(state, actor, command.advancementId);
      const domain = ADVANCEMENTS.find(node => node.id === command.advancementId)!.domain;
      telemetry.researchByDomain[domain] = (telemetry.researchByDomain[domain] ?? 0) + 1;
      message = `${city.name} concluiu uma pesquisa.`;
      break;
    }
    case 'PROMOTE_MOOD': {
      rejectExtras(command, []);
      if (meta.mood >= balance.promoteMoodCeiling) throw new Error('O investimento público não eleva o ânimo além do limite; outras ações são necessárias.');
      alphaPay(state, actor, { food: 0, wood: 0, stone: 0, metal: 0, wealth: balance.publicInvestmentCost, knowledge: 0, influence: 0 });
      meta.mood += 1;
      message = `${city.name} recebeu investimento público; o ânimo melhorou.`;
      break;
    }
    case 'SUPPORT_TRADE': {
      rejectExtras(command, []);
      const routes = state.routes.filter(route => route.ownerId === actor && route.fromCityId === city.id && !route.suspended);
      if (routes.length === 0) throw new Error('A cidade não origina nenhuma rota comercial ativa.');
      for (const route of routes) {
        alphaGainLegacy(state, actor, { wealth: state.rules.routeIncome }, { category: 'trade' });
        const receiver = state.core.players.find(player => player.civilization.cities.some(candidate => candidate.id === route.toCityId));
        if (receiver && receiver.id !== actor) alphaGainLegacy(state, receiver.id, { wealth: state.rules.foreignRouteIncome }, { category: 'trade' });
      }
      message = `${city.name} sustentou ${routes.length} rota(s) comercial(is).`;
      break;
    }
    case 'CIVIC_ACTION': {
      rejectExtras(command, []);
      if (occupied) {
        meta.integration = Math.min(100, meta.integration + balance.integrationPerAction);
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
  meta.urbanActionsUsed += 1;
  telemetry.actionsByType[command.action] = (telemetry.actionsByType[command.action] ?? 0) + 1;
  alphaEvent(state, 'URBAN_ACTION', message, [actor]);
}

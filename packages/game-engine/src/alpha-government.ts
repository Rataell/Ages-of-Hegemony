import { ADVANCEMENTS, eraForRound, type AlphaState, type Government, type PlayerId } from '@aoh/game-domain';

/**
 * The eight governments of V5.1b (canon §16): the initial Conselho plus seven reforms. Each has two advantages and one
 * limitation written in Ânimo, Administração, economy, research, war, diplomacy, Orders or costs. This file is the single
 * source: the engine reads `governmentEffects`, the projection prints `advantages` and `limitation` from it. The legacy core
 * Estabilidade modifiers (`rules.governmentModifiers`) are never read by the Alpha.
 */
export const GOVERNMENT_NAMES: Record<Government, string> = {
  PROTO_GOVERNANCE: 'Conselho', MONARCHY: 'Monarquia', REPUBLIC: 'República', OLIGARCHY: 'Oligarquia', THEOCRACY: 'Teocracia',
  CONFEDERATION: 'Confederação', MERITOCRACY: 'Meritocracia', AUTOCRACY: 'Autocracia',
};

export interface GovernmentEffects {
  government: Government; name: string; advantages: [string, string]; limitation: string;
  /** Governar: levels of Ânimo recovered for free in each Governar action. */
  governFreeLevels: number;
  /** Capacidade Administrativa granted by the government. */
  administrationBonus: number;
  /** Civilization-wide maximum of second activations per round, or null for no extra limit. */
  secondActivationsPerRound: number | null;
  /** Capacity added to / capping the capital's operating Capacity. */
  capitalCapacityBonus: number; capitalCapacityCap: number | null;
  /** Recrutar in the capital is not limited by Capacidade (still limited by Soldados). */
  capitalRecruitIgnoresCapacity: boolean;
  /** Maximum pieces recruited by one activation, or null for the Capacidade rule. */
  recruitPerActivationMax: number | null;
  /** Orders occupied by moving the capital. */
  moveCapitalOrders: number;
  /** Ambições scored per Era, extra Manobra kept in hand, extra Influência to declare war. */
  ambitionsPerEra: number; handBonus: number; warExtraInfluence: number;
  /** Riqueza on each route supported, share of a material cost Riqueza may cover, and the Abalada limitation. */
  routeWealth: number; wealthCoverPercent: number; shakenCitiesProduceNoWealth: boolean;
  /** Templo: Ânimo recovered per round without an Order, extra Cultura per city with Templo, extra Conhecimento on the first Saber advance of an Era. */
  templeMoodRecovery: boolean; templeCulture: number; firstKnowledgeAdvanceExtraCost: number;
  /** Founding discount in Madeira. */
  foundingWoodDiscount: number;
  /** Erudito yields per 1 instead of per 2; extra Conhecimento from Governar. */
  scholarYieldsPerOne: boolean; governKnowledge: number;
  /** Autocracia: Exército limit, supply along roads, conquered cities. */
  armyMaxBonus: number; suppliedNearRoad: number; conqueredCityStartsInRevolt: boolean;
}

const base = (government: Government): GovernmentEffects => ({
  government, name: GOVERNMENT_NAMES[government], advantages: ['', ''], limitation: '',
  governFreeLevels: 0, administrationBonus: 0, secondActivationsPerRound: null, capitalCapacityBonus: 0, capitalCapacityCap: null,
  capitalRecruitIgnoresCapacity: false, recruitPerActivationMax: null, moveCapitalOrders: 1, ambitionsPerEra: 1, handBonus: 0, warExtraInfluence: 0,
  routeWealth: 0, wealthCoverPercent: 50, shakenCitiesProduceNoWealth: false, templeMoodRecovery: false, templeCulture: 0,
  firstKnowledgeAdvanceExtraCost: 0, foundingWoodDiscount: 0, scholarYieldsPerOne: false, governKnowledge: 0, armyMaxBonus: 0,
  suppliedNearRoad: 0, conqueredCityStartsInRevolt: false,
});

const TABLE: Record<Government, GovernmentEffects> = {
  PROTO_GOVERNANCE: { ...base('PROTO_GOVERNANCE'), advantages: ['Governar custa 1 nível de Ânimo a menos', 'Capacidade Administrativa +1'], limitation: 'No máximo 1 segunda ativação por rodada', governFreeLevels: 1, administrationBonus: 1, secondActivationsPerRound: 1 },
  MONARCHY: { ...base('MONARCHY'), advantages: ['Capital com Capacidade +1', 'Recrutar na capital ignora a Capacidade'], limitation: 'Mudar de capital custa 2 Ordens', capitalCapacityBonus: 1, capitalRecruitIgnoresCapacity: true, moveCapitalOrders: 2 },
  REPUBLIC: { ...base('REPUBLIC'), advantages: ['Até 2 Ambições pontuadas por Era', '+1 Manobra na mão'], limitation: 'Declarar guerra custa 1 Influência extra e 1 Ordem Influência', ambitionsPerEra: 2, handBonus: 1, warExtraInfluence: 1 },
  OLIGARCHY: { ...base('OLIGARCHY'), advantages: ['Rotas rendem +1 Riqueza', 'Riqueza cobre até 60% de qualquer custo material'], limitation: 'Cidades Abaladas não geram Riqueza', routeWealth: 1, wealthCoverPercent: 60, shakenCitiesProduceNoWealth: true },
  THEOCRACY: { ...base('THEOCRACY'), advantages: ['Cada Templo recupera 1 de Ânimo por rodada, sem Ordem', '+1 Cultura por cidade com Templo'], limitation: 'O primeiro avanço de Saber de cada Era custa +1 Conhecimento', templeMoodRecovery: true, templeCulture: 1, firstKnowledgeAdvanceExtraCost: 1 },
  CONFEDERATION: { ...base('CONFEDERATION'), advantages: ['Capacidade Administrativa +2', 'Fundar custa 1 Madeira a menos'], limitation: 'A Capacidade da capital nunca passa de 3', administrationBonus: 2, foundingWoodDiscount: 1, capitalCapacityCap: 3 },
  MERITOCRACY: { ...base('MERITOCRACY'), advantages: ['Erudito rende por 1', 'Governar rende +1 Conhecimento'], limitation: 'Recrutar no máximo 1 peça por ativação', scholarYieldsPerOne: true, governKnowledge: 1, recruitPerActivationMax: 1 },
  AUTOCRACY: { ...base('AUTOCRACY'), advantages: ['Exército máximo +1', 'Peças próprias sempre supridas a 1 hex de estrada'], limitation: 'Cidade conquistada começa com Integração 0 e Ânimo em Revolta', armyMaxBonus: 1, suppliedNearRoad: 1, conqueredCityStartsInRevolt: true },
};

/** What the civilization's government does now. Unknown actors read as the Conselho. */
export function governmentEffects(state: AlphaState, actor: PlayerId): GovernmentEffects {
  return TABLE[state.core.players.find(player => player.id === actor)?.civilization.government ?? 'PROTO_GOVERNANCE'];
}
export const governmentTable = (government: Government): GovernmentEffects => TABLE[government];

/** Saber advances (Web nodes of the KNOWLEDGE domain, Convergences aside) the civilization finished in its current Era. */
export function knowledgeAdvancesThisEra(state: AlphaState, actor: PlayerId): number {
  const player = state.players.find(candidate => candidate.playerId === actor);
  if (!player) return 0;
  return player.resonance.marks.filter(mark => {
    const node = ADVANCEMENTS.find(candidate => candidate.id === mark.advancementId);
    return node?.domain === 'KNOWLEDGE' && !node.convergence && eraForRound(Math.max(1, mark.round), state.rules.roundsPerEra) === player.era;
  }).length;
}

/**
 * Round start: Teocracia's Templo recovers 1 level of Ânimo in its city, once per round, without an Order (canon §16).
 * Returns how many cities recovered, for the log.
 */
export function applyGovernmentRoundStart(state: AlphaState): number {
  let recovered = 0;
  for (const owner of state.core.players) {
    if (!governmentEffects(state, owner.id).templeMoodRecovery) continue;
    for (const meta of state.cities) {
      if (meta.currentOwnerId !== owner.id || meta.status === 'OCCUPIED' || !meta.buildings.includes('TEMPLE') || meta.mood >= 6) continue;
      meta.mood += 1; recovered++;
    }
  }
  return recovered;
}

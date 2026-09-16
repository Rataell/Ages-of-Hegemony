import { z } from 'zod';
import { CitySpecializationSchema, DevelopmentSchema, GovernmentSchema, NonNegativeIntegerSchema as N, PositiveIntegerSchema as P, ResourcePoolSchema, StabilitySchema, emptyResourcePool } from './core.js';

const signed = z.number().int().min(-100).max(100);
export const GovernmentModifiersSchema = z.strictObject({
  capacityFlat: N, capacityPerCity: N,
  unstableBelow: StabilitySchema, unstableCityCapacityPenalty: N,
  capitalCrisisBelow: StabilitySchema, capitalCrisisPenalty: N,
  capitalStability: signed, developedCityStability: signed, developedMinLevel: DevelopmentSchema,
  globalStability: signed, multiCityStability: signed, multiCityMinimum: P,
  wealthBonusPercent: N, commercialWealthBonusPercent: N, commandPointsDelta: signed,
  futureKnowledgeBonusPercent: N, futureInfluenceBonusPercent: N,
  futureInequalityStabilityPenalty: N, futureReformFlexibilityPenalty: N,
});
export type GovernmentModifiers = z.infer<typeof GovernmentModifiersSchema>;
export const SpecializationModifiersSchema = z.strictObject({
  producerBonus: N, artisanBonus: N, merchantBonus: N, scholarBonus: N,
  administrativeCapacity: N, futureRecruitmentPreparation: N, futureInfluenceBonus: N,
});
export const GameRulesConfigSchema = z.strictObject({
  baseCommandPoints: N, foodPerPopulation: N, growthThreshold: P,
  maxGrowthPerMaintenance: P, initialPopulation: N, initialStability: StabilitySchema,
  maxDevelopment: DevelopmentSchema,
  developmentPopulationCaps: z.tuple([P, P, P, P, P]),
  developmentCosts: z.tuple([ResourcePoolSchema, ResourcePoolSchema, ResourcePoolSchema, ResourcePoolSchema]),
  specializationMinimumDevelopment: DevelopmentSchema,
  productionPerWorker: z.strictObject({ producers: N, artisans: N, merchants: N, scholars: N }),
  specializationModifiers: z.record(CitySpecializationSchema, SpecializationModifiersSchema),
  governmentModifiers: z.record(GovernmentSchema, GovernmentModifiersSchema),
  administrativeRules: z.strictObject({ baseCapacity: N, loadPerCity: N, developmentStep: P, populationStep: P, overextensionStabilityPenalty: N, overextensionEconomicPercent: z.number().int().min(0).max(100) }),
  stabilityThresholds: z.strictObject({ criticalMax: StabilitySchema, unstableMax: StabilitySchema, tenseMax: StabilitySchema, stableMax: StabilitySchema }),
  stabilityProductionPercent: z.strictObject({ CRITICAL: N, UNSTABLE: N, TENSE: N, STABLE: N, PROSPEROUS: N }),
  blockDevelopmentAtCritical: z.boolean(), shortageStabilityPenalty: N,
}).superRefine((rules, ctx) => {
  const { criticalMax, unstableMax, tenseMax, stableMax } = rules.stabilityThresholds;
  if (!(criticalMax < unstableMax && unstableMax < tenseMax && tenseMax < stableMax && stableMax < 100)) ctx.addIssue({ code: 'custom', message: 'Stability bands must be strictly increasing and leave five nonempty bands' });
  if (rules.initialPopulation > rules.developmentPopulationCaps[0]) ctx.addIssue({ code: 'custom', message: 'Initial population exceeds settlement capacity' });
  if (rules.specializationMinimumDevelopment > rules.maxDevelopment) ctx.addIssue({ code: 'custom', message: 'Specialization minimum exceeds max development' });
  rules.developmentPopulationCaps.forEach((cap, i, caps) => {
    if (i > 0 && cap < (caps[i - 1] ?? cap)) ctx.addIssue({ code: 'custom', message: 'Population caps must not decrease' });
  });
});
export type GameRulesConfig = z.infer<typeof GameRulesConfigSchema>;
export const GameConfigSchema = GameRulesConfigSchema;
export type GameConfig = GameRulesConfig;

const government: GovernmentModifiers = {
  capacityFlat: 0, capacityPerCity: 0, unstableBelow: 40, unstableCityCapacityPenalty: 0,
  capitalCrisisBelow: 20, capitalCrisisPenalty: 0, capitalStability: 0, developedCityStability: 0,
  developedMinLevel: 3, globalStability: 0, multiCityStability: 0, multiCityMinimum: 2,
  wealthBonusPercent: 0, commercialWealthBonusPercent: 0, commandPointsDelta: 0,
  futureKnowledgeBonusPercent: 0, futureInfluenceBonusPercent: 0,
  futureInequalityStabilityPenalty: 0, futureReformFlexibilityPenalty: 0,
};
const specialization = { producerBonus: 0, artisanBonus: 0, merchantBonus: 0, scholarBonus: 0, administrativeCapacity: 0, futureRecruitmentPreparation: 0, futureInfluenceBonus: 0 };
// Provisional balance values, cloned and validated for each match.
const defaults: GameRulesConfig = {
  baseCommandPoints: 4, foodPerPopulation: 1, growthThreshold: 10,
  maxGrowthPerMaintenance: 1, initialPopulation: 2, initialStability: 60, maxDevelopment: 5,
  developmentPopulationCaps: [3, 5, 8, 12, 16],
  developmentCosts: [{ ...emptyResourcePool(), materials: 5 }, { ...emptyResourcePool(), materials: 10 }, { ...emptyResourcePool(), materials: 15 }, { ...emptyResourcePool(), materials: 20 }],
  specializationMinimumDevelopment: 1,
  productionPerWorker: { producers: 2, artisans: 1, merchants: 1, scholars: 1 },
  specializationModifiers: {
    AGRARIAN: { ...specialization, producerBonus: 1 }, COMMERCIAL: { ...specialization, merchantBonus: 1 },
    ACADEMIC: { ...specialization, scholarBonus: 1 }, ADMINISTRATIVE: { ...specialization, administrativeCapacity: 2 },
    MILITARY: { ...specialization, futureRecruitmentPreparation: 1 }, INDUSTRIAL: { ...specialization, artisanBonus: 1 },
    CULTURAL: { ...specialization, futureInfluenceBonus: 1 },
  },
  governmentModifiers: {
    PROTO_GOVERNANCE: { ...government }, MONARCHY: { ...government, capacityFlat: 2, capitalStability: 3, capitalCrisisPenalty: 5 },
    REPUBLIC: { ...government, developedCityStability: 2, unstableCityCapacityPenalty: 1, futureKnowledgeBonusPercent: 10, futureInfluenceBonusPercent: 10 },
    OLIGARCHY: { ...government, wealthBonusPercent: 10, commercialWealthBonusPercent: 15, futureInequalityStabilityPenalty: 2 },
    THEOCRACY: { ...government, globalStability: 2, futureInfluenceBonusPercent: 10, futureReformFlexibilityPenalty: 1 },
    CONFEDERATION: { ...government, capacityPerCity: 1, multiCityStability: 2, commandPointsDelta: -1 },
  },
  administrativeRules: { baseCapacity: 3, loadPerCity: 1, developmentStep: 2, populationStep: 5, overextensionStabilityPenalty: 3, overextensionEconomicPercent: 90 },
  stabilityThresholds: { criticalMax: 19, unstableMax: 39, tenseMax: 59, stableMax: 79 },
  stabilityProductionPercent: { CRITICAL: 75, UNSTABLE: 90, TENSE: 100, STABLE: 100, PROSPEROUS: 110 },
  blockDevelopmentAtCritical: true, shortageStabilityPenalty: 5,
};
function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}
export const DEFAULT_GAME_CONFIG: Readonly<GameRulesConfig> = freeze(GameRulesConfigSchema.parse(defaults));
export const createDefaultRules = (): GameRulesConfig => GameRulesConfigSchema.parse(DEFAULT_GAME_CONFIG);

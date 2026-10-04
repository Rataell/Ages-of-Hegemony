import { z } from 'zod';
import { AlphaBuildingSchema, AlphaDistrictSchema, AlphaEraSchema, AlphaResourcePoolSchema, CityLevelSchema, emptyAlphaResourcePool, type AlphaResourcePool, type CityLevel } from './alpha-concept.js';

/**
 * The city ladder of V5.1a (canon §4). A city has a BUILT level, raised only by Elevar, and a population. Capacity is the power
 * of one activation: hexes worked by Produzir, pieces per Recrutar, the size Construir can handle, the reach of Governar.
 * Slots are how many districts the city can hold. Supply reach is `1 + ceil(level / 2)`.
 */
export interface CityLadderStep { level: CityLevel; minPopulation: number; capacity: number; slots: number; supplyReach: number; garrison: number }
export const CITY_LADDER: readonly CityLadderStep[] = [
  { level: 'OUTPOST', minPopulation: 2, capacity: 1, slots: 1, supplyReach: 2, garrison: 4 },
  { level: 'HAMLET', minPopulation: 4, capacity: 1, slots: 1, supplyReach: 2, garrison: 4 },
  { level: 'VILLAGE', minPopulation: 6, capacity: 2, slots: 2, supplyReach: 3, garrison: 5 },
  { level: 'CITY', minPopulation: 8, capacity: 2, slots: 3, supplyReach: 3, garrison: 6 },
  { level: 'GREAT_CITY', minPopulation: 11, capacity: 3, slots: 4, supplyReach: 4, garrison: 7 },
  { level: 'METROPOLIS', minPopulation: 14, capacity: 3, slots: 5, supplyReach: 4, garrison: 8 },
  { level: 'IMPERIAL_METROPOLIS', minPopulation: 18, capacity: 4, slots: 6, supplyReach: 5, garrison: 10 },
];
/** Population an Imperial Metropolis can hold; every other level stops one short of the next level's minimum. */
export const IMPERIAL_POPULATION_CEILING = 20;

export const levelIndex = (level: CityLevel): number => CityLevelSchema.options.indexOf(level);
export const ladderStep = (level: CityLevel): CityLadderStep => CITY_LADDER[levelIndex(level)]!;
export const nextLevel = (level: CityLevel): CityLevel | null => CityLevelSchema.options[levelIndex(level) + 1] ?? null;
/** Highest level whose minimum population the city still has (never below Posto). */
export function levelSupportedByPopulation(population: number): CityLevel {
  let supported: CityLevel = 'OUTPOST';
  for (const step of CITY_LADDER) if (population >= step.minPopulation) supported = step.level;
  return supported;
}
/** Habitants a city of this built level can hold before it must Elevar. */
export function populationCeiling(level: CityLevel): number {
  const next = nextLevel(level);
  return next ? ladderStep(next).minPopulation - 1 : IMPERIAL_POPULATION_CEILING;
}
/** Effective level = the lower of the built level and the level the population supports; the built level never drops by itself. */
export const effectiveLevel = (built: CityLevel, population: number): CityLevel =>
  levelIndex(built) <= levelIndex(levelSupportedByPopulation(population)) ? built : levelSupportedByPopulation(population);
export const effectiveCapacity = (built: CityLevel, population: number): number => ladderStep(effectiveLevel(built, population)).capacity;
/** `1 + ceil(N / 2)` written out so the table and the formula can never disagree. */
export const supplyReach = (level: CityLevel): number => 1 + Math.ceil((levelIndex(level) + 1) / 2);

/**
 * Elevar (canon §4): population minimum, development cost, Web advance, Era minimum. N7 needs Saneamento and the Convergence,
 * in Era VII.
 */
export const ElevateRequirementSchema = z.strictObject({
  to: CityLevelSchema, minPopulation: z.number().int().positive(), cost: AlphaResourcePoolSchema,
  advances: z.array(z.string().min(1)).min(1), era: AlphaEraSchema,
});
export type ElevateRequirement = z.infer<typeof ElevateRequirementSchema>;
const cost = (values: Partial<AlphaResourcePool>): AlphaResourcePool => ({ ...emptyAlphaResourcePool(), ...values });
export const ELEVATE_TABLE: readonly ElevateRequirement[] = [
  { to: 'HAMLET', minPopulation: 4, cost: cost({ wood: 3 }), advances: ['web-agriculture'], era: 'FOUNDATION' },
  { to: 'VILLAGE', minPopulation: 6, cost: cost({ wood: 4, stone: 2 }), advances: ['web-masonry'], era: 'EXPANSION' },
  { to: 'CITY', minPopulation: 8, cost: cost({ wood: 5, stone: 3, wealth: 2 }), advances: ['web-engineering'], era: 'CONSOLIDATION' },
  { to: 'GREAT_CITY', minPopulation: 11, cost: cost({ wood: 6, stone: 5, wealth: 3, knowledge: 2 }), advances: ['web-urbanism'], era: 'CIVILIZATION' },
  { to: 'METROPOLIS', minPopulation: 14, cost: cost({ wood: 8, stone: 6, wealth: 5, knowledge: 3 }), advances: ['web-sanitation'], era: 'EMPIRES' },
  { to: 'IMPERIAL_METROPOLIS', minPopulation: 18, cost: cost({ wood: 10, stone: 8, wealth: 8, knowledge: 4 }), advances: ['web-sanitation', 'web-world-metropolises'], era: 'ASCENSION' },
].map(entry => ElevateRequirementSchema.parse(entry));
export const elevateRequirement = (to: CityLevel): ElevateRequirement | null => ELEVATE_TABLE.find(entry => entry.to === to) ?? null;

/**
 * Districts (canon §5): one slot each, a family of buildings, the Web advance that opens it. Coastal only for the Marítimo.
 * The eight districts are the specialization; Capacity never is.
 */
export const AlphaDistrictCatalogSchema = z.strictObject({
  district: AlphaDistrictSchema, advance: z.string().min(1), coastal: z.boolean(), cost: AlphaResourcePoolSchema,
  buildings: z.array(AlphaBuildingSchema), effect: z.string().min(1),
});
export type AlphaDistrictCatalogEntry = z.infer<typeof AlphaDistrictCatalogSchema>;
const districtCost = cost({ wood: 3, stone: 1 });
export const DISTRICT_CATALOG: readonly AlphaDistrictCatalogEntry[] = [
  { district: 'AGRARIAN', advance: 'web-agriculture', coastal: false, cost: districtCost, buildings: ['GRANARY', 'MILL', 'IRRIGATION'], effect: '+2 Alimento por Produzir' },
  { district: 'COMMERCIAL', advance: 'web-exchange', coastal: false, cost: districtCost, buildings: ['MARKET', 'TREASURY', 'BANK'], effect: '+1 Riqueza por Produzir; rota a partir desta cidade' },
  { district: 'ACADEMIC', advance: 'web-writing', coastal: false, cost: districtCost, buildings: ['LIBRARY', 'ACADEMY', 'OBSERVATORY', 'ARCHIVE', 'LABORATORY', 'SCRIBES_HOUSE'], effect: '+1 Conhecimento por Produzir' },
  { district: 'ADMINISTRATIVE', advance: 'web-codes', coastal: false, cost: districtCost, buildings: ['CHANCELLERY', 'COURT', 'CIVIC_SQUARE'], effect: 'Capacidade Administrativa +1; Governar +1' },
  { district: 'MILITARY', advance: 'web-guard-formations', coastal: false, cost: districtCost, buildings: ['BARRACKS', 'ARSENAL', 'TRAINING_GROUND'], effect: 'Recrutar sem limite de Capacidade (ainda ≤ Soldados); guarnição +1' },
  { district: 'INDUSTRIAL', advance: 'web-metallurgy', coastal: false, cost: districtCost, buildings: ['WORKSHOP', 'FOUNDRY', 'WAREHOUSE'], effect: '+1 Madeira e +1 Pedra por Produzir' },
  { district: 'CULTURAL', advance: 'web-common-narratives', coastal: false, cost: districtCost, buildings: ['TEMPLE', 'THEATER', 'CULTURAL_CENTER', 'SANCTUARY', 'TRADITION_HOUSE'], effect: '+1 Cultura por Produzir' },
  { district: 'MARITIME', advance: 'web-coastal-navigation', coastal: true, cost: districtCost, buildings: ['PORT', 'SHIPYARD', 'LIGHTHOUSE'], effect: 'Porto incluído; navios; pesca +1 Alimento' },
].map(entry => AlphaDistrictCatalogSchema.parse(entry));
export const districtEntry = (district: z.infer<typeof AlphaDistrictSchema>): AlphaDistrictCatalogEntry => DISTRICT_CATALOG.find(entry => entry.district === district)!;
/** The district a building belongs to, or null for buildings outside every family. */
export const districtOfBuilding = (building: z.infer<typeof AlphaBuildingSchema>): z.infer<typeof AlphaDistrictSchema> | null =>
  DISTRICT_CATALOG.find(entry => entry.buildings.includes(building))?.district ?? null;

import { z } from 'zod';
import { CityIdSchema, GameIdSchema, HexIdSchema, IdentifierSchema, NonNegativeIntegerSchema as N, PlayerIdSchema, PositiveIntegerSchema as P, GovernmentTypeSchema, ResourcePoolSchema, emptyResourcePool } from './core.js';
import { GameCommandSchema, GameStateSchema } from './model.js';
import { AlphaUnitClassSchema, UnitCatalogEntrySchema, alphaUnitCatalog } from './alpha-catalog.js';
import { ADVANCEMENTS, CIVILIZATIONS, AlphaEffectSchema } from './alpha-institutions.js';
import { HERITAGE_ADVANCES, migrateResearch } from './alpha-web.js';
import { ALPHA_CARDS } from './alpha-cards.js';
import { LEGACY_WORKS, LEGACY_WORK_ID_ALIASES, LEGACY_WORK_STEPS, LegacyWorkProgressSchema } from './alpha-legacy-works.js';
import { LEADERS, LeaderStateSchema } from './alpha-leaders.js';
import { MapSizeSchema } from './alpha-topology.js';
import { civilizationKit } from './alpha-civilization-kits.js';
import { RegionDiscoverySchema, ThreatSchema, WORLD_ID, threatComposition } from './alpha-threats.js';
import { PendingChoiceSchema, ResonanceStateSchema, advancementDomains, advancementSource, emptyResonance } from './alpha-resonance.js';
import { DistrictTypeSchema, EconomyBreakdownSchema } from './territory.js';
import {
  ALPHA_ERA_MILESTONES, CityPaceSchema, FortificationLevelSchema, FortificationStateSchema, AlphaBalanceSchema, AlphaCitySchema, CombatConfigSchema, alphaCombatConfig, AlphaEraMilestoneSchema, AlphaEraSchema, LegacyAlphaEraSchema, AlphaResourcePoolSchema, AlphaRoundPhaseSchema, AlphaTelemetrySchema,
  BattleModifierSchema, BattlePostureSchema, IndependentPeopleSchema, MapPresetSchema, TacticalFaceSchema,
  AlphaBuildingSchema, TradeOfferSchema, UrbanActionTypeSchema, WorldPulseCardSchema, alphaBalance, emptyAlphaResourcePool, legacyToAlphaResources, type AlphaRoundPhase,
} from './alpha-concept.js';

export const AlphaPresetSchema = z.enum(['QUICK', 'STANDARD', 'EPIC']);
export const TreatyTypeSchema=z.enum(['TRADE_AGREEMENT','NON_AGGRESSION_PACT','OPEN_BORDERS','DEFENSIVE_PACT','ALLIANCE','EMBARGO']);
/** A treaty's resource exchange, in the seven resources. Deals saved before used the legacy pool; they are read with the same split as legacy gains. */
const DealPoolSchema = z.preprocess(value => value && typeof value === 'object' && 'materials' in value ? legacyToAlphaResources(ResourcePoolSchema.parse(value)) : value, AlphaResourcePoolSchema);
export const ResourceDealSchema = z.strictObject({ give: DealPoolSchema, receive: DealPoolSchema });
export const HegemonyPathSchema = z.enum(['MILITARY','ECONOMIC','SCIENTIFIC','CULTURAL','POLITICAL','TERRITORIAL']);
export const HegemonyMetricSchema = z.enum(['strength','victories','foreignPresence','wealth','internationalRoutes','tradePartners','eraFiveResearch','academicDistricts','scientificProjects','influence','culturalDistricts','foreignInfluence','treatyPartners','politicalProjects','territory','developedCities','withinCapacity']);
export type HegemonyMetric = z.infer<typeof HegemonyMetricSchema>;
export type HegemonyPath = z.infer<typeof HegemonyPathSchema>;
export const HegemonyDeclarationSchema = z.strictObject({path:HegemonyPathSchema,declaredRound:P,qualifiedSince:P.nullable()});
/** Canonical Alpha default (2026-10, playtest decision): two starting Pioneiros. Configurable per game for scenarios and tests only. */
export const STARTING_PIONEERS_DEFAULT = 2;
export const AlphaRulesSchema = z.strictObject({
  preset: AlphaPresetSchema, roundLimit: P, baseCommandPoints: P,
  /** Rounds in each of the seven Eras (canon §1: 5 by default, 3–7 configurable). Matches saved before V5.1a read 5. */
  roundsPerEra: P.default(5),
  /** Orders per round (canon §1: 5 by default, 3–6 configurable). Matches saved with the old 7-action economy read 6. */
  actionsPerRound: z.preprocess(value => typeof value === 'number' ? Math.min(6, Math.max(3, value)) : value, z.number().int().min(3).max(6).optional()),
  hegemonyHoldRounds: P, handLimit: P, advisorLimit: P, unitLimit: P,
  /** City-ladder pace of the match (RC5): STANDARD, or the experimental ACCELERATED pace of short matches. Chosen when the table is created and never changed. Saves without it read STANDARD. */
  pace: CityPaceSchema.default('STANDARD'),
  /** Pioneiros each civilization starts with (canon change 2026-10-05: one civil piece replaces Explorador + Pioneiro). Older saves read 2. */
  startingPioneers: z.number().int().min(1).max(3).default(STARTING_PIONEERS_DEFAULT),
  integrationCost:ResourcePoolSchema,occupationStabilityPenalty:N,
  hegemonyRequirements:z.record(HegemonyPathSchema,z.array(z.strictObject({metric:HegemonyMetricSchema,minimum:P})).min(3)),
  cardsPerRound:P,eventEvery:P,roadCost:ResourcePoolSchema,advisorCost:ResourcePoolSchema,treatyDuration:P,routeIncome:N,foreignRouteIncome:N,
  /** Classes added later (e.g. COASTAL_VESSEL) are filled from the catalogue, so older saved matches stay valid. */
  units:z.preprocess(value=>{if(!value||typeof value!=='object')return value;const {EXPLORER:_e,PIONEER:_p,...rest}=value as Record<string,unknown>;void _e;void _p;return {...alphaUnitCatalog(),...rest};},z.record(AlphaUnitClassSchema,UnitCatalogEntrySchema)),
  movementCosts:z.record(z.enum(['UNKNOWN','PLAINS','FOREST','HILLS','MOUNTAINS','COAST','SEA']),P), supplyRadius:P,
  milestones:z.array(AlphaEraMilestoneSchema).min(1),
  planningSeconds: z.union([z.literal(0), z.literal(180), z.literal(300), z.literal(480), z.literal(3600), z.literal(14400), z.literal(28800)]),
  worldPreset: MapPresetSchema,
  /** Footprint of the board (Regions of seven hexes). Older saves default to the original 30-Region Padrão. */
  mapSize: MapSizeSchema.default('STANDARD'),
  /** Playtest only: the whole map and every piece are visible to everyone. Never on for a real match. */
  revealMap: z.boolean().default(false),
  balance: AlphaBalanceSchema,
  combat: CombatConfigSchema,
});
export type AlphaRules = z.infer<typeof AlphaRulesSchema>;
export function alphaRules(preset: z.infer<typeof AlphaPresetSchema> = 'STANDARD', worldPreset: z.infer<typeof MapPresetSchema> = 'MIXED', actionsPerRound = 5, pace: z.infer<typeof CityPaceSchema> = 'STANDARD'): AlphaRules {
  const roundsPerEra = { QUICK: 3, STANDARD: 5, EPIC: 7 }[preset];
  return AlphaRulesSchema.parse({ preset, roundLimit: AlphaEraSchema.options.length * roundsPerEra, roundsPerEra, baseCommandPoints: 4, actionsPerRound,
    hegemonyHoldRounds: 2, pace, startingPioneers: STARTING_PIONEERS_DEFAULT, handLimit: 5, advisorLimit: 2, unitLimit: 24, planningSeconds: 0,
    integrationCost:{food:0,materials:0,wealth:0,knowledge:0,influence:3},occupationStabilityPenalty:15,
    hegemonyRequirements:{
      MILITARY:[{metric:'strength',minimum:12},{metric:'victories',minimum:2},{metric:'foreignPresence',minimum:2}],
      ECONOMIC:[{metric:'wealth',minimum:30},{metric:'internationalRoutes',minimum:2},{metric:'tradePartners',minimum:1}],
      SCIENTIFIC:[{metric:'eraFiveResearch',minimum:2},{metric:'academicDistricts',minimum:2},{metric:'scientificProjects',minimum:1}],
      CULTURAL:[{metric:'influence',minimum:25},{metric:'culturalDistricts',minimum:2},{metric:'foreignInfluence',minimum:3}],
      POLITICAL:[{metric:'treatyPartners',minimum:1},{metric:'foreignInfluence',minimum:3},{metric:'politicalProjects',minimum:1}],
      TERRITORIAL:[{metric:'territory',minimum:preset==='QUICK'?10:preset==='EPIC'?18:14},{metric:'developedCities',minimum:preset==='QUICK'?2:3},{metric:'withinCapacity',minimum:1}],
    },
    cardsPerRound:2,eventEvery:2,roadCost:{food:0,materials:1,wealth:0,knowledge:0,influence:0},advisorCost:{food:0,materials:0,wealth:3,knowledge:2,influence:0},treatyDuration:3,routeIncome:2,foreignRouteIncome:1,
    units:alphaUnitCatalog(), movementCosts:{UNKNOWN:1,PLAINS:1,FOREST:2,HILLS:2,MOUNTAINS:3,COAST:1,SEA:1}, supplyRadius:3,
    worldPreset,balance:alphaBalance(),milestones:structuredClone(ALPHA_ERA_MILESTONES),
    combat: alphaCombatConfig() });
}
export const UrbanBuildTargetSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('DISTRICT'), district: DistrictTypeSchema }),
  z.strictObject({ kind: z.literal('BUILDING'), building: AlphaBuildingSchema }),
  z.strictObject({ kind: z.literal('FORTIFICATION') }),
  /** Distrito Marítimo: needs a real navigable-water edge; the basic Porto is included in it (never bought apart). */
  z.strictObject({ kind: z.literal('MARITIME') }),
]);
/** Resources a player gained or lost during one round, by cause. Report arithmetic is verified against this. */
export const RoundLedgerSchema = z.strictObject({
  playerId: PlayerIdSchema, round: P, opening: ResourcePoolSchema,
  production: ResourcePoolSchema, mining: ResourcePoolSchema, trade: ResourcePoolSchema, institutions: ResourcePoolSchema, other: ResourcePoolSchema,
  losses: ResourcePoolSchema, expenses: ResourcePoolSchema, upkeepRequired: ResourcePoolSchema, upkeepPaid: ResourcePoolSchema, discarded: ResourcePoolSchema,
  cities: z.array(z.strictObject({ cityId: CityIdSchema, population: N, stability: N })),
});
export type RoundLedger = z.infer<typeof RoundLedgerSchema>;
export const TacticalRollSchema = z.strictObject({ unitId: IdentifierSchema, face: TacticalFaceSchema, effect: z.string().max(160).default(''), grade: z.number().int().min(1).max(3).default(1) });
export const ShockOutcomeSchema = z.enum(['TIE', 'VICTORY', 'DECISIVE']);
export type ShockOutcome = z.infer<typeof ShockOutcomeSchema>;
export const FortificationSnapshotSchema = z.strictObject({ level: FortificationLevelSchema, state: FortificationStateSchema });
export const UnitClassSchema = AlphaUnitClassSchema;
export const UnitSchema = z.strictObject({ id: IdentifierSchema, ownerId: PlayerIdSchema, kind: UnitClassSchema, hexId: HexIdSchema, recruitedRound: P,
  /** The own fleet carrying this land piece, or null. A carried piece shares its fleet's hex and moves with it. */
  carrierId: IdentifierSchema.nullable().optional() });
export type AlphaUnit = z.infer<typeof UnitSchema>;
export const StrategicOrderSchema = z.discriminatedUnion('type', [
  /** LEGACY (read-only since Move + Discovery): kept so V1.1 snapshots and plans made before the change still parse and resolve. New clients and bots never create it. */
  z.strictObject({ id: IdentifierSchema, type: z.literal('EXPLORE'), unitId: IdentifierSchema, target: HexIdSchema, rotation: z.number().int().min(0).max(5) }),
  /** `rotation` is the Discovery payload: when the last hex of `path` lies in a closed Region, the move enters the unknown, flips that Region under this orientation (ignored when only one orientation gives access) and ends there. */
  z.strictObject({ id: IdentifierSchema, type: z.literal('MOVE'), unitIds: z.array(IdentifierSchema).min(1).max(24), path: z.array(HexIdSchema).min(1).max(12), rotation: z.number().int().min(0).max(5).optional() }),
  z.strictObject({ id: IdentifierSchema, type: z.literal('ATTACK'), unitIds: z.array(IdentifierSchema).min(1).max(24), target: HexIdSchema, posture: BattlePostureSchema.default('ASSAULT') }),
  z.strictObject({ id: IdentifierSchema, type: z.literal('TRADE'), fromCityId: CityIdSchema, toCityId: CityIdSchema }),
  z.strictObject({ id: IdentifierSchema, type: z.literal('INFLUENCE'), unitId: IdentifierSchema, target: HexIdSchema }),
]);
export type StrategicOrder = z.infer<typeof StrategicOrderSchema>;
export const PlannedActionSchema = z.discriminatedUnion('type',[
  z.strictObject({id:IdentifierSchema,type:z.literal('URBAN_ACTION'),cityId:CityIdSchema,action:UrbanActionTypeSchema,build:UrbanBuildTargetSchema.optional(),unit:AlphaUnitClassSchema.optional(),count:z.number().int().min(1).max(6).optional(),advancementId:IdentifierSchema.optional(),/** Governar (PROMOTE_MOOD): the Ânimo levels the player chose to recover (1..6, within the city's real reach). Absent = as many as the Capacity and the stock allow. */levels:z.number().int().min(1).max(6).optional()}),
  z.strictObject({id:IdentifierSchema,type:z.literal('PROPOSE_TREATY'),recipientId:PlayerIdSchema,treaty:TreatyTypeSchema,deal:ResourceDealSchema}),
  z.strictObject({id:IdentifierSchema,type:z.literal('DECLARE_WAR'),targetId:PlayerIdSchema}),
  /** An Influência Order reserved in the last round of an Era; it executes at step 5 of the Era turn (canon §16, I-7). */
  z.strictObject({id:IdentifierSchema,type:z.literal('GOVERNMENT_REFORM'),government:GovernmentTypeSchema}),
]);
export type PlannedAction=z.infer<typeof PlannedActionSchema>;
const StrategicPlayerSchema = z.strictObject({
  playerId: PlayerIdSchema, civilization: IdentifierSchema.nullable(), era: LegacyAlphaEraSchema,
  resources:AlphaResourcePoolSchema.default(emptyAlphaResourcePool), legacyCulturalTrack:N.default(0),
  spentCommands: N,
  /** Orders already committed this round, by type (canon §2). Reserved orders are typed from the queue itself. */
  ordersSpent: z.record(z.enum(['CITY', 'EXPEDITION', 'ADVANCE', 'INFLUENCE', 'LEGACY']), N).default({ CITY: 0, EXPEDITION: 0, ADVANCE: 0, INFLUENCE: 0, LEGACY: 0 }),
  ready: z.boolean(), prestige: N,
  /** Era of the last government reform (at most one per Era, canon §16) and of the last Ambição swap (one per Era turn). */
  governmentReformEra: AlphaEraSchema.nullable().default(null), ambitionSwapEra: AlphaEraSchema.nullable().default(null),
  /** Researched Web and Heritage ids. Pre-V5.1a `adv-*` ids are read as their closest Web node. */
  research: z.preprocess(value => Array.isArray(value) && value.some(id => typeof id === 'string' && id.startsWith('adv-')) ? migrateResearch(value as string[]) : value, z.array(IdentifierSchema)),
  hand: z.array(IdentifierSchema), ambitions: z.array(IdentifierSchema), completedAmbitions: z.array(IdentifierSchema), advisors: z.array(IdentifierSchema),
  knownHexIds: z.array(HexIdSchema), orders: z.array(StrategicOrderSchema), plannedActions:z.array(PlannedActionSchema).default([]),
  victories: N, exploredRegions: N, foreignInfluence: N,
  contacts:z.array(PlayerIdSchema),abilityRound:N,
  /** Posture this civilization holds when attacked. Private until a battle reveals it. */
  defensePosture:BattlePostureSchema.default('HOLD'),
  /** V51B-01: owner-defined order in which combat kinds are lost (first listed dies first). `order` is the civilization default, `byHex` overrides it for the stack standing on a hex. Empty = the engine's own rule. */
  casualtyPriority:z.strictObject({order:z.array(AlphaUnitClassSchema).max(10).default([]),byHex:z.record(z.string(),z.array(AlphaUnitClassSchema).max(10)).default({})}).default({order:[],byHex:{}}),
  /** The civilization's permanent leader (assigned automatically) and whether this Era's ability was used. */
  leader:LeaderStateSchema.nullable().default(null),
  influencedCities:z.array(CityIdSchema),
  /** Ressonância: 5 sockets, permanent marks and the last cycles (canon §18). */
  resonance:ResonanceStateSchema.default(emptyResonance),
  /** Repercussão / Encontro / Pulso choices waiting for this player. Only the owner ever sees them. */
  pendingChoices:z.array(PendingChoiceSchema).default([]),
  hegemony:HegemonyDeclarationSchema.nullable(),
  ambitionsChosen:z.boolean(),cardsPlayed:N,
  /** Own civilization cards played, one entry per card and Era (each unlocked card is playable once per Era). */
  civilizationCardsPlayed:z.array(z.strictObject({cardId:IdentifierSchema,era:LegacyAlphaEraSchema})).default([]),temporaryEffects:z.array(z.strictObject({source:IdentifierSchema,effect:AlphaEffectSchema,round:P})),
});
export const AlphaEventSchema = z.strictObject({
  id: IdentifierSchema, round: P, type: IdentifierSchema,
  audience: z.array(PlayerIdSchema).nullable(), message: z.string().max(1000),
});
export const ResolutionEventTypeSchema = z.enum(['MOVEMENT','EXPLORATION','DISCOVERY','FOUNDATION','PRODUCTION','CONSTRUCTION','RECRUITMENT','RESEARCH','TRADE','INFLUENCE','COMBAT','LOSSES','RETREAT','ADVANCE','FAILURE','ROUND_EVENT']);
export const ResolutionEventSchema = z.strictObject({
  id: IdentifierSchema, round: P, type: ResolutionEventTypeSchema, actorId: PlayerIdSchema.nullable(),
  visibleTo: z.array(PlayerIdSchema).nullable(), message: z.string().max(1000),
  hexId: HexIdSchema.optional(), cityId: CityIdSchema.optional(), unitIds: z.array(IdentifierSchema).default([]),
});
export type ResolutionEvent = z.infer<typeof ResolutionEventSchema>;
const AlphaStateBase = z.strictObject({
  schemaVersion: z.literal(5), gameId: GameIdSchema, version: N,
  /** Rules generation the match runs on. Saves without it are V5.1a and are upgraded on read (`upgradeToV51b`). */
  rulesVersion: z.enum(['v5.1a', 'v5.1b']).default('v5.1b'),
  alphaVersion:z.literal('0.1.0-alpha.1').default('0.1.0-alpha.1'),
  phase:AlphaRoundPhaseSchema.default('WORLD_PULSE'),
  privateRng:z.strictObject({algorithm:z.literal('hmac-sha256-counter-v1'),seed:z.string().regex(/^[a-f0-9]{64}$/),counter:N}),
  core: GameStateSchema, rules: AlphaRulesSchema,
  players: z.array(StrategicPlayerSchema).min(2).max(6),
  initiative: z.array(PlayerIdSchema).min(2).max(6), units: z.array(UnitSchema),
  roads:z.array(HexIdSchema),
  regions:z.array(z.strictObject({id:IdentifierSchema,templateId:IdentifierSchema,hexIds:z.array(HexIdSchema).length(7),rotation:z.number().int().min(0).max(5),revealedBy:z.array(PlayerIdSchema),discovery:RegionDiscoverySchema.optional()})),
  occupations:z.array(z.strictObject({cityId:CityIdSchema,occupierId:PlayerIdSchema,previousOwnerId:PlayerIdSchema,sinceRound:P})),
  treaties:z.array(z.strictObject({id:IdentifierSchema,proposerId:PlayerIdSchema,recipientId:PlayerIdSchema,type:TreatyTypeSchema,status:z.enum(['PROPOSED','ACCEPTED','ACTIVE','DECLINED','ENDED']),deal:ResourceDealSchema,createdRound:P,expiresRound:P})),
  wars:z.array(z.tuple([PlayerIdSchema,PlayerIdSchema])),
  routes:z.array(z.strictObject({id:IdentifierSchema,ownerId:PlayerIdSchema,fromCityId:CityIdSchema,toCityId:CityIdSchema,path:z.array(HexIdSchema).min(1),suspended:z.boolean()})),
  cards:z.strictObject({worldDeck:z.array(IdentifierSchema),strategyDeck:z.array(IdentifierSchema),ambitionDeck:z.array(IdentifierSchema),advisorDeck:z.array(IdentifierSchema),discarded:z.array(IdentifierSchema),advisorMarket:z.array(IdentifierSchema),worldEvent:IdentifierSchema.nullable(),worldEventRound:N,worldResponded:z.array(PlayerIdSchema)}),
  legacyWorks:z.array(LegacyWorkProgressSchema),
  cities:z.array(AlphaCitySchema).default([]),
  cultureContests:z.array(z.strictObject({
    id:IdentifierSchema,round:P,cityId:CityIdSchema,attackerCivilizationId:IdentifierSchema,defenderCivilizationId:IdentifierSchema,
    attackDice:z.tuple([P.max(6),P.max(6)]),defenseDice:z.tuple([P.max(6),P.max(6)]),attackModifier:N,defenseModifier:N,
    attackTotal:P,defenseTotal:P,winnerCivilizationId:IdentifierSchema,loserCivilizationId:IdentifierSchema,
  })).default([]),
  tradeOffers:z.array(TradeOfferSchema).default([]),
  independents:z.array(IndependentPeopleSchema).default([]),
  worldPulse:z.strictObject({deck:z.array(IdentifierSchema),discard:z.array(IdentifierSchema),current:WorldPulseCardSchema.nullable(),resolvedRound:N}).default({deck:[],discard:[],current:null,resolvedRound:0}),
  /** World threats (V5.1b §21b): Acampamentos, Bandos and pirate Ancoradouros. */
  threats:z.array(ThreatSchema).default([]),
  /** Placeholder filled by the Era turn slice; read-only data until then. */
  /** The Era turn in progress (canon §22): which Era is closing, the step it waits at (7) and the public log of steps 1–6. */
  eraTurn:z.strictObject({era:AlphaEraSchema,step:z.number().int().min(1).max(9),log:z.array(z.strictObject({step:z.number().int().min(1).max(9),summary:z.string().max(400)}))}).nullable().default(null),
  roundLedgers:z.array(RoundLedgerSchema).default([]),
  resolutionEvents:z.array(ResolutionEventSchema).default([]),
  telemetry:AlphaTelemetrySchema,
  roundReports:z.array(z.strictObject({playerId:PlayerIdSchema,round:P,opening:ResourcePoolSchema,institutions:ResourcePoolSchema,trade:ResourcePoolSchema,mining:ResourcePoolSchema.default(emptyResourcePool),production:ResourcePoolSchema.default(emptyResourcePool),other:ResourcePoolSchema.default(emptyResourcePool),losses:ResourcePoolSchema.default(emptyResourcePool),expenses:ResourcePoolSchema.default(emptyResourcePool),discarded:ResourcePoolSchema.default(emptyResourcePool),economy:EconomyBreakdownSchema.nullable(),upkeepRequired:ResourcePoolSchema,upkeepPaid:ResourcePoolSchema,closing:ResourcePoolSchema,
    cities:z.array(z.strictObject({cityId:CityIdSchema,populationBefore:N,populationAfter:N,stabilityBefore:N,stabilityAfter:N})),administrativeLoad:N,administrativeCapacity:N,resolution:z.array(ResolutionEventSchema).default([])})),
  battles:z.array(z.strictObject({id:IdentifierSchema,round:P,hexId:HexIdSchema,attackerId:PlayerIdSchema,defenderId:PlayerIdSchema,
    attackerUnits:z.array(IdentifierSchema),defenderUnits:z.array(IdentifierSchema),
    attackerPosture:BattlePostureSchema.default('ASSAULT'),defenderPosture:BattlePostureSchema.default('HOLD'),
    attackBreakdown:z.array(BattleModifierSchema).default([]),defenseBreakdown:z.array(BattleModifierSchema).default([]),
    attackerTactical:z.array(TacticalRollSchema).default([]),
    defenderTactical:z.array(TacticalRollSchema).default([]),
    /** Fortification of the defended city before and after the battle (a siege can damage or breach it). */
    fortification:z.strictObject({cityId:CityIdSchema,before:FortificationSnapshotSchema,after:FortificationSnapshotSchema}).nullable().default(null),
    attackStrength:N,defenseStrength:N,attackModifiers:z.number().int(),defenseModifiers:z.number().int(),
    /** Legacy two-dice rolls of matches resolved before tactical combat; absent on tactical battles. */
    /** V5.1b: Δ = attack − defense and its reading; absent on battles resolved before the single shock. */
    delta:z.number().int().optional(),outcome:ShockOutcomeSchema.optional(),
    attackDice:z.tuple([P.max(6),P.max(6)]).optional(),defenseDice:z.tuple([P.max(6),P.max(6)]).optional(),
    attackTotal:z.number().int(),defenseTotal:z.number().int(),winnerId:PlayerIdSchema,losses:z.array(IdentifierSchema),retreat:HexIdSchema.nullable()})),
  winner: z.strictObject({ playerId: PlayerIdSchema, reason: z.enum(['HEGEMONY', 'ROUND_LIMIT']), round: P }).nullable(),
  events: z.array(AlphaEventSchema),
}).superRefine((state, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  const owners = new Set(state.core.players.map(p => p.id));
  const civilizations = new Map(state.players.map(player => [player.playerId, player.civilization ?? state.cities.find(city => city.originalOwnerId === player.playerId)?.nativeIdentity]));
  for(const city of state.cities){
    const presenceIds=city.foreignPresence.map(presence=>presence.civilizationId);
    if(new Set(presenceIds).size!==presenceIds.length)fail('Duplicate cultural presence');
    const ownerCivilization=civilizations.get(city.currentOwnerId);
    if(ownerCivilization!==null&&ownerCivilization!==undefined&&presenceIds.includes(ownerCivilization))fail('Owner cannot have foreign presence');
    if(city.culturalAnchor!==null&&!city.foreignPresence.some(presence=>presence.civilizationId===city.culturalAnchor&&presence.level==='PREDOMINANT'))fail('Invalid cultural anchor');
  }
  if(new Set(state.roundReports.map(r=>`${r.playerId}:${r.round}`)).size!==state.roundReports.length)fail('Duplicate round report');
  for(const report of state.roundReports){
    if(!owners.has(report.playerId)||report.round>state.core.round)fail('Invalid round report');
    for(const key of ['food','materials','wealth','knowledge','influence'] as const){
      const expected=report.opening[key]+report.institutions[key]+report.trade[key]+report.mining[key]+report.production[key]+report.other[key]+(report.economy?.netChange[key]??0)-report.losses[key]-report.expenses[key]-report.upkeepPaid[key]-report.discarded[key];
      if(expected!==report.closing[key]||report.upkeepPaid[key]>report.upkeepRequired[key])fail(`Round report arithmetic mismatch (${report.playerId} ${key}: expected ${expected}, closing ${report.closing[key]}, upkeep ${report.upkeepPaid[key]}/${report.upkeepRequired[key]})`);
    }
  }
  const cardZones=[...state.cards.worldDeck,...state.cards.strategyDeck,...state.cards.ambitionDeck,...state.cards.advisorDeck,...state.cards.discarded,...state.cards.advisorMarket,...(state.cards.worldEvent?[state.cards.worldEvent]:[]),...state.players.flatMap(p=>[...p.hand,...p.ambitions,...p.advisors])];
  if(new Set(cardZones).size!==cardZones.length||cardZones.some(id=>!ALPHA_CARDS.some(c=>c.id===id)))fail('Invalid or multiply owned card');
  if(state.players.some(p=>p.hand.some(id=>ALPHA_CARDS.find(c=>c.id===id)?.family!=='STRATEGY')||p.advisors.some(id=>ALPHA_CARDS.find(c=>c.id===id)?.family!=='ADVISOR')||p.ambitions.some(id=>ALPHA_CARDS.find(c=>c.id===id)?.family!=='AMBITION')||p.completedAmbitions.some(id=>!p.ambitions.includes(id))))fail('Invalid private card family');
  if(state.cards.worldResponded.some(id=>!owners.has(id))||new Set(state.cards.worldResponded).size!==state.cards.worldResponded.length||state.cards.worldEventRound>state.core.round)fail('Invalid world-event response');
  const identities=state.players.map(p=>p.civilization).filter(id=>id!==null);if(new Set(identities).size!==identities.length)fail('Civilizations must be exclusive');
  if (state.gameId !== state.core.gameId) fail('Aggregate game identity mismatch');
  if (state.players.length !== owners.size || new Set(state.players.map(p => p.playerId)).size !== owners.size || state.players.some(p => !owners.has(p.playerId))) fail('Strategic players must match economic players');
  if (state.initiative.length !== owners.size || new Set(state.initiative).size !== owners.size || state.initiative.some(p => !owners.has(p))) fail('Initiative must contain each player exactly once');
  if ((state.core.status === 'FINISHED') !== (state.winner !== null)) fail('Finished state requires exactly one valid outcome');
  if (state.winner && (!owners.has(state.winner.playerId) || state.winner.round > state.core.round)) fail('Invalid winner');
  if(state.winner?.reason==='ROUND_LIMIT'&&state.winner.round<state.rules.roundLimit)fail('Premature round-limit outcome');
  if(state.winner?.reason==='HEGEMONY'){
    const declaration=state.players.find(p=>p.playerId===state.winner!.playerId)?.hegemony;
    if(declaration?.qualifiedSince==null||state.winner.round-declaration.qualifiedSince<state.rules.hegemonyHoldRounds)fail('Hegemony outcome lacks consolidation');
  }
  const hexes = new Map(state.core.map.map(t => [t.id,t]));
  const regionHexes=state.regions.flatMap(r=>r.hexIds);
  if(new Set(state.regions.map(r=>r.id)).size!==state.regions.length||new Set(regionHexes).size!==regionHexes.length||regionHexes.some(id=>!hexes.has(id))||state.regions.some(r=>r.revealedBy.some(id=>!owners.has(id))))fail('Invalid region ownership or geometry');
  if(new Set(state.roads).size!==state.roads.length||state.roads.some(id=>!hexes.has(id)||['SEA','UNKNOWN'].includes(hexes.get(id)!.terrain)))fail('Invalid roads');
  const cities=state.core.players.flatMap(p=>p.civilization.cities);
  if(state.cities.length!==cities.length||state.cities.some(meta=>!cities.some(city=>city.id===meta.cityId&&city.ownerId===meta.currentOwnerId)))fail('Alpha city metadata must match economic cities');
  if(new Set(state.cities.map(city=>city.cityId)).size!==state.cities.length)fail('Duplicate alpha city metadata');
  if(new Set(state.legacyWorks.map(w=>w.workId)).size!==state.legacyWorks.length||new Set(state.legacyWorks.map(w=>w.cityId)).size!==state.legacyWorks.length||state.legacyWorks.some(w=>!LEGACY_WORKS.some(g=>g.id===w.workId)||!cities.some(c=>c.id===w.cityId&&c.ownerId===w.ownerId)||w.startedRound>state.core.round||(w.completedRound===null)===(w.stepsDone>=LEGACY_WORK_STEPS)||(w.completedRound!==null&&w.completedRound>state.core.round)))fail('Invalid or duplicate Obra de Legado');
  if(new Set(state.treaties.map(t=>t.id)).size!==state.treaties.length||state.treaties.some(t=>!owners.has(t.proposerId)||!owners.has(t.recipientId)||t.proposerId===t.recipientId||t.expiresRound<t.createdRound||t.createdRound>state.core.round))fail('Invalid treaty');
  if(state.wars.some(([a,b])=>!owners.has(a)||!owners.has(b)||a>=b)||new Set(state.wars.map(p=>p.join(':'))).size!==state.wars.length)fail('Invalid war relation');
  if(new Set(state.routes.map(r=>r.id)).size!==state.routes.length||state.routes.some(r=>!owners.has(r.ownerId)||!cities.some(c=>c.id===r.fromCityId&&c.ownerId===r.ownerId)||!cities.some(c=>c.id===r.toCityId)||r.fromCityId===r.toCityId||r.path.some(id=>!hexes.has(id))))fail('Invalid trade route');
  if(new Set(state.occupations.map(o=>o.cityId)).size!==state.occupations.length||state.occupations.some(o=>!owners.has(o.previousOwnerId)||o.previousOwnerId===o.occupierId||!cities.some(c=>c.id===o.cityId&&c.ownerId===o.occupierId)||o.sinceRound>state.core.round))fail('Invalid city occupation');
  if (new Set(state.units.map(u => u.id)).size !== state.units.length) fail('Duplicate unit');
  for (const unit of state.units) {
    const tile = hexes.get(unit.hexId);
    if (!owners.has(unit.ownerId) || !tile || unit.recruitedRound > state.core.round) fail('Invalid unit owner, position or round');
    const carrier = unit.carrierId ? state.units.find(candidate => candidate.id === unit.carrierId) : null;
    const sea = (kind: AlphaUnit['kind']) => state.rules.units[kind].domain === 'SEA';
    if (unit.carrierId && (sea(unit.kind) || !carrier || !sea(carrier.kind) || carrier.ownerId !== unit.ownerId || carrier.hexId !== unit.hexId)) fail('Invalid carrier');
    if (tile && (sea(unit.kind) ? !['COAST','SEA'].includes(tile.terrain) : tile.terrain === 'UNKNOWN' || (tile.terrain === 'SEA' && !carrier))) fail('Unit on illegal terrain');
  }
  for (const fleet of state.units.filter(unit => state.rules.units[unit.kind].domain === 'SEA')) {
    const load = state.units.filter(unit => unit.carrierId === fleet.id).reduce((total, unit) => total + (state.rules.units[unit.kind].cargo ?? 1), 0);
    if (load > (state.rules.units[fleet.kind].transport ?? 0) + (fleet.kind === 'FLEET' ? 1 : 0)) fail('Fleet over its transport capacity');
  }
  for (const player of state.players) {
    if(new Set(player.influencedCities).size!==player.influencedCities.length||player.influencedCities.some(id=>!cities.some(c=>c.id===id))||player.foreignInfluence!==player.influencedCities.length)fail('Invalid foreign influence');
    if(player.hegemony&&(player.era!=='ASCENSION'||player.hegemony.declaredRound>state.core.round||(player.hegemony.qualifiedSince!==null&&(player.hegemony.qualifiedSince<player.hegemony.declaredRound||player.hegemony.qualifiedSince>state.core.round))))fail('Invalid hegemony declaration');
    if(player.civilization!==null&&!CIVILIZATIONS.some(c=>c.id===player.civilization))fail('Unknown civilization');
    if(player.leader!==null&&LEADERS.find(l=>l.id===player.leader!.leaderId)?.civilizationId!==player.civilization)fail('Leader must belong to the player civilization');
    if(player.research.some(id=>!ADVANCEMENTS.some(a=>a.id===id)&&!HERITAGE_ADVANCES.some(a=>a.id===id)))fail('Unknown advancement');
    for(const id of player.research){const heritage=HERITAGE_ADVANCES.find(a=>a.id===id);if(heritage&&(heritage.civilizationId!==player.civilization||!player.research.includes(heritage.prerequisite)))fail('Illegal heritage research');const node=ADVANCEMENTS.find(a=>a.id===id);if(!node)continue;if(node.prerequisites.some(p=>!player.research.includes(p))||(node.prerequisitesAny.length>0&&!node.prerequisitesAny.some(p=>player.research.includes(p)))||node.excludes.some(p=>player.research.includes(p))||AlphaEraSchema.options.indexOf(node.era)>AlphaEraSchema.options.indexOf(player.era))fail('Illegal research prerequisites, exclusion or era');}
    const kitCards=new Set(civilizationKit(player.civilization)?.cards.map(card=>card.id)??[]);
    if(player.civilizationCardsPlayed.some(entry=>!kitCards.has(entry.cardId))||new Set(player.civilizationCardsPlayed.map(entry=>`${entry.cardId}:${entry.era}`)).size!==player.civilizationCardsPlayed.length)fail('Invalid civilization card play');
    if(player.contacts.some(id=>!owners.has(id)||id===player.playerId)||new Set(player.contacts).size!==player.contacts.length||player.abilityRound>state.core.round)fail('Invalid contact or ability timing');
    for (const ids of [player.research, player.hand, player.ambitions, player.completedAmbitions, player.advisors, player.knownHexIds, [...player.orders.map(o => o.id),...player.plannedActions.map(action=>action.id)]]) if (new Set(ids).size !== ids.length) fail('Duplicate exclusive player item');
    if (player.knownHexIds.some(id => !hexes.has(id))) fail('Unknown knowledge coordinate');
    if (player.hand.length > state.rules.handLimit || player.advisors.length > state.rules.advisorLimit || state.units.filter(u => u.ownerId === player.playerId).length > state.rules.unitLimit) fail('Player component limit exceeded');
  }
  for (const event of state.events) if (event.round > state.core.round || event.audience?.some(id => !owners.has(id))) fail('Invalid event audience or round');
  if(new Set(state.resolutionEvents.map(event=>event.id)).size!==state.resolutionEvents.length)fail('Duplicate resolution event');
  for(const event of state.resolutionEvents)if(event.round>state.core.round||(event.actorId!==null&&!owners.has(event.actorId))||event.visibleTo?.some(id=>!owners.has(id)))fail('Invalid resolution event');
  if(new Set(state.threats.map(t=>t.id)).size!==state.threats.length||state.threats.some(t=>!hexes.has(t.hexId)||!hexes.has(t.homeHexId)||t.composition.length===0))fail('Invalid threat');
  for(const battle of state.battles) {
    if(!hexes.has(battle.hexId)||(!owners.has(battle.attackerId)&&battle.attackerId!==WORLD_ID)||(!owners.has(battle.defenderId)&&battle.defenderId!==WORLD_ID)||battle.attackerId===battle.defenderId||battle.round>state.core.round)fail('Invalid battle participants');
    const legacyAttack=battle.attackDice?battle.attackDice[0]+battle.attackDice[1]:0,legacyDefense=battle.defenseDice?battle.defenseDice[0]+battle.defenseDice[1]:0;
    if(battle.attackTotal!==battle.attackStrength+battle.attackModifiers+legacyAttack||battle.defenseTotal!==battle.defenseStrength+battle.defenseModifiers+legacyDefense)fail('Battle arithmetic mismatch');
    if(!battle.attackDice&&(battle.attackBreakdown.reduce((n,m)=>n+m.amount,0)!==battle.attackModifiers||battle.defenseBreakdown.reduce((n,m)=>n+m.amount,0)!==battle.defenseModifiers))fail('Battle breakdown mismatch');
    if(battle.outcome!==undefined&&(battle.delta!==battle.attackTotal-battle.defenseTotal||battle.outcome!==(Math.abs(battle.delta)<state.rules.combat.mediumMargin?'TIE':Math.abs(battle.delta)>=state.rules.combat.largeMargin?'DECISIVE':'VICTORY')))fail('Battle delta mismatch');
    if(battle.winnerId!==(battle.outcome==='TIE'?battle.defenderId:battle.attackTotal>battle.defenseTotal?battle.attackerId:battle.defenderId))fail('Battle winner mismatch');
  }
});
/** V5.1a → V5.1b upgrade (never silent: a public SAVE_UPGRADED event is appended). Catalog refresh for combat arrives with the combat slice. */
export function upgradeToV51b(raw: unknown): unknown { return migrateColonists(migrateGreatProjects(fillGovernments(upgradeBody(raw)))); }
/** Canon change: the Explorador was merged into the Pioneiro. Old Explorador/Settler pieces become Pioneiros in place (ids stay) and the save says so. */
function migrateColonists(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const input = value as Record<string, unknown>, units = Array.isArray(input.units) ? input.units as { kind?: string }[] : [];
  if (!units.some(unit => ['EXPLORER', 'SETTLER'].includes(unit.kind ?? ''))) return value;
  const events = Array.isArray(input.events) ? input.events as unknown[] : [];
  const round = typeof (input.core as { round?: unknown } | undefined)?.round === 'number' ? (input.core as { round: number }).round : 1;
  return { ...input, units: units.map(unit => ['EXPLORER', 'SETTLER'].includes(unit.kind ?? '') ? { ...unit, kind: 'PIONEER' } : unit), events: [...events, { id: `event-${events.length + 1}`, round, type: 'SAVE_UPGRADED', audience: null, message: 'O Explorador foi unido ao Pioneiro: uma só peça civil que explora e funda.' }] };
}
/** D-3: saved Grandes Projetos (one completed step each) become completed Obras de Legado; the old ids are mapped and nothing is dropped silently. */
function migrateGreatProjects(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const input = value as Record<string, unknown>;
  if (!('projects' in input) && 'legacyWorks' in input) return value;
  const { projects, ...rest } = input;
  const old = Array.isArray(projects) ? projects as { projectId?: string; ownerId?: string; cityId?: string; completedRound?: number }[] : [];
  const legacyWorks = old.map(project => ({ workId: LEGACY_WORK_ID_ALIASES[project.projectId ?? ''] ?? project.projectId, ownerId: project.ownerId, cityId: project.cityId, stepsDone: LEGACY_WORK_STEPS, startedRound: project.completedRound, completedRound: project.completedRound }));
  const events = Array.isArray(rest.events) ? rest.events as unknown[] : [];
  const round = typeof (rest.core as { round?: unknown } | undefined)?.round === 'number' ? (rest.core as { round: number }).round : 1;
  return { ...rest, legacyWorks, events: legacyWorks.length ? [...events, { id: `event-${events.length + 1}`, round, type: 'SAVE_UPGRADED', audience: null, message: 'Os Grandes Projetos agora são Obras de Legado (regras V5.1b).' }] : events };
}
/** Matches saved before Meritocracia and Autocracia exist carry no legacy modifier row for them; they read as the neutral Conselho row (the Alpha never uses these rows). */
function fillGovernments(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const input = value as Record<string, unknown>, core = input.core as { config?: { governmentModifiers?: Record<string, unknown> } } | undefined;
  const table = core?.config?.governmentModifiers;
  if (!table || !table.PROTO_GOVERNANCE || (table.MERITOCRACY && table.AUTOCRACY)) return value;
  return { ...input, core: { ...core, config: { ...core.config, governmentModifiers: { ...table, MERITOCRACY: table.MERITOCRACY ?? table.PROTO_GOVERNANCE, AUTOCRACY: table.AUTOCRACY ?? table.PROTO_GOVERNANCE } } } };
}
function upgradeBody(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const input = raw as Record<string, unknown>;
  if (input.schemaVersion !== 5) return raw;
  if (input.rulesVersion === 'v5.1b') return refreshCombatCatalog(migrateRaidBands(input));
  const { pressure: _dropped, ...rest } = input;
  void _dropped;
  const players = Array.isArray(rest.players) ? (rest.players as Record<string, unknown>[]).map(player => {
    if (!player || typeof player !== 'object' || player.resonance !== undefined) return player;
    const research = Array.isArray(player.research) ? (player.research as string[]) : [];
    const marks = research.flatMap(id => { const domains = advancementDomains(id); return domains && advancementSource(id) ? [{ advancementId: id, domains, round: 0 }] : []; });
    return { ...player, resonance: { ...emptyResonance(), marks } };
  }) : rest.players;
  const events = Array.isArray(rest.events) ? rest.events as unknown[] : [];
  const round = typeof (rest.core as { round?: unknown } | undefined)?.round === 'number' ? (rest.core as { round: number }).round : 1;
  return refreshCombatCatalog(migrateRaidBands({ ...rest, rulesVersion: 'v5.1b', players, events: [...events, { id: `event-${events.length + 1}`, round, type: 'SAVE_UPGRADED', audience: null, message: 'Partida atualizada para as regras V5.1b: a Pressão do Mundo foi substituída pela Ressonância.' }] }));
}
/** I-5/I-21: the pre-V5.1b raid bands become level-I/II Acampamentos (a band of strength 3+ is level II). Saves without `raidBands` are untouched. */
function migrateRaidBands(input: Record<string, unknown>): Record<string, unknown> {
  if (!('raidBands' in input)) return input;
  const { raidBands, ...rest } = input;
  const round = typeof (rest.core as { round?: unknown } | undefined)?.round === 'number' ? (rest.core as { round: number }).round : 1;
  const bands = Array.isArray(raidBands) ? raidBands as { id?: string; hexId?: string; strength?: number }[] : [];
  const existing = Array.isArray(rest.threats) ? rest.threats as unknown[] : [];
  const threats = bands.filter(band => typeof band.hexId === 'string').map((band, index) => {
    const level = (band.strength ?? 2) >= 3 ? 2 : 1;
    return { id: `camp-${band.id ?? index + 1}`, kind: 'CAMP', hexId: band.hexId, homeHexId: band.hexId, level, status: 'CAMPED', composition: threatComposition('CAMP', level, 0), createdRound: 0, lastActedRound: round, rewardPaid: false, fresh: false };
  });
  const events = Array.isArray(rest.events) ? rest.events as unknown[] : [];
  return { ...rest, threats: [...existing, ...threats], events: threats.length ? [...events, { id: `event-${events.length + 1}`, round, type: 'SAVE_UPGRADED', audience: null, message: 'Os bandos de saqueadores de fronteira agora são Acampamentos de Saqueadores com Ameaça I–III (regras V5.1b).' }] : events };
}
/** I-13: saves whose combat config lacks the V5.1b `shock` marker get the V5.1b unit and combat catalogs, with a public event. */
function refreshCombatCatalog(input: Record<string, unknown>): Record<string, unknown> {
  const rules = input.rules as Record<string, unknown> | undefined;
  const combat = rules?.combat as Record<string, unknown> | undefined;
  if (!rules || !combat || combat.shock === true) return input;
  const events = Array.isArray(input.events) ? input.events as unknown[] : [];
  const round = typeof (input.core as { round?: unknown } | undefined)?.round === 'number' ? (input.core as { round: number }).round : 1;
  return { ...input, rules: { ...rules, units: alphaUnitCatalog(), combat: alphaCombatConfig() }, events: [...events, { id: `event-${events.length + 1}`, round, type: 'SAVE_UPGRADED', audience: null, message: 'Combate atualizado para as regras V5.1b: um choque tático, Δ, Graus I–III e assinaturas por família.' }] };
}
export const AlphaStateSchema = z.preprocess(upgradeToV51b, AlphaStateBase);
export type AlphaState = z.infer<typeof AlphaStateBase>;
export const AlphaCommandSchema = z.discriminatedUnion('type', [
  z.strictObject({type:z.literal('URBAN_ACTION'),expectedVersion:N,planId:IdentifierSchema.optional(),cityId:CityIdSchema,action:UrbanActionTypeSchema,build:UrbanBuildTargetSchema.optional(),unit:AlphaUnitClassSchema.optional(),count:z.number().int().min(1).max(6).optional(),advancementId:IdentifierSchema.optional(),/** Governar (PROMOTE_MOOD): the Ânimo levels the player chose to recover (1..6, within the city's real reach). Absent = as many as the Capacity and the stock allow. */levels:z.number().int().min(1).max(6).optional()}),
  z.strictObject({type:z.literal('PROPOSE_TRADE'),expectedVersion:N,recipientId:PlayerIdSchema,offerType:z.enum(['TRADE_INSTANT','GIFT','FUTURE_PROMISE','LOAN']),offer:AlphaResourcePoolSchema,request:AlphaResourcePoolSchema,treatyTerms:z.array(IdentifierSchema).max(4),dueRound:P.nullable()}),
  z.strictObject({type:z.literal('RESPOND_TRADE'),expectedVersion:N,offerId:IdentifierSchema,accept:z.boolean()}),
  z.strictObject({type:z.literal('CONTEST_PRESENCE'),expectedVersion:N,cityId:CityIdSchema,defenderCivilizationId:IdentifierSchema}),
  z.strictObject({type:z.literal('INDEPENDENT_ACTION'),expectedVersion:N,peopleId:IdentifierSchema,action:z.enum(['TRADE','NEGOTIATE','INFLUENCE','PROTECT','INTEGRATE','CONQUER'])}),
  z.strictObject({type:z.literal('SETTLE'),expectedVersion:N,unitId:IdentifierSchema,name:z.string().trim().min(1).max(80)}),
  z.strictObject({type:z.literal('DECLARE_HEGEMONY'),expectedVersion:N,path:HegemonyPathSchema}),
  z.strictObject({type:z.literal('CHOOSE_AMBITIONS'),expectedVersion:N,cardIds:z.array(IdentifierSchema).length(2)}),
  z.strictObject({type:z.literal('PLAY_CARD'),expectedVersion:N,cardId:IdentifierSchema}),
  /** Plays a card from the civilization board (DEC-011 kit), not from the hand. */
  z.strictObject({type:z.literal('PLAY_CIVILIZATION_CARD'),expectedVersion:N,cardId:IdentifierSchema}),
  z.strictObject({type:z.literal('HIRE_ADVISOR'),expectedVersion:N,cardId:IdentifierSchema}),
  z.strictObject({type:z.literal('WORLD_CHOICE'),expectedVersion:N,choice:z.enum(['RESOURCE','PRESTIGE'])}),
  z.strictObject({type:z.literal('ADVANCE_LEGACY_WORK'),expectedVersion:N,workId:IdentifierSchema,cityId:CityIdSchema}),
  z.strictObject({type:z.literal('PROPOSE_TREATY'),expectedVersion:N,planId:IdentifierSchema.optional(),recipientId:PlayerIdSchema,treaty:TreatyTypeSchema,deal:ResourceDealSchema}),
  z.strictObject({type:z.literal('RESPOND_TREATY'),expectedVersion:N,treatyId:IdentifierSchema,accept:z.boolean()}),
  z.strictObject({type:z.literal('END_TREATY'),expectedVersion:N,treatyId:IdentifierSchema}),
  z.strictObject({type:z.literal('DECLARE_WAR'),expectedVersion:N,planId:IdentifierSchema.optional(),targetId:PlayerIdSchema}),
  z.strictObject({type:z.literal('LEADER_ABILITY'),expectedVersion:N}),
  z.strictObject({type:z.literal('SET_DEFENSE_POSTURE'),expectedVersion:N,posture:BattlePostureSchema}),
  z.strictObject({type:z.literal('SET_CASUALTY_PRIORITY'),expectedVersion:N,order:z.array(AlphaUnitClassSchema).max(10),hexId:HexIdSchema.nullable().default(null)}),
  z.strictObject({type:z.literal('BUILD_ROAD'),expectedVersion:N,hexId:HexIdSchema}),
  /** Naval vertical slice (DEC-014): land pieces board an adjacent own fleet, or step from it to an adjacent land hex. */
  /** Demobilization (canon §6): a land piece inside an own city returns as one Disponível. */
  z.strictObject({type:z.literal('DEMOBILIZE'),expectedVersion:N,unitId:IdentifierSchema}),
  z.strictObject({type:z.literal('EMBARK'),expectedVersion:N,unitIds:z.array(IdentifierSchema).min(1).max(6),fleetId:IdentifierSchema}),
  z.strictObject({type:z.literal('DISEMBARK'),expectedVersion:N,unitIds:z.array(IdentifierSchema).min(1).max(6),hexId:HexIdSchema}),
  z.strictObject({ type: z.literal('MANAGE'), expectedVersion: N, command: GameCommandSchema }),
  z.strictObject({ type: z.literal('QUEUE_ORDER'), expectedVersion: N, order: StrategicOrderSchema }),
  z.strictObject({ type: z.literal('CANCEL_ORDER'), expectedVersion: N, orderId: IdentifierSchema }),
  z.strictObject({type:z.literal('RESOLVE_CHOICE'),expectedVersion:N,choiceId:IdentifierSchema,optionId:IdentifierSchema}),
  /** Era turn step 7: replaces one unfinished Ambição with the next from the deck. */
  z.strictObject({type:z.literal('SWAP_AMBITION'),expectedVersion:N,cardId:IdentifierSchema}),
  z.strictObject({ type: z.literal('READY'), expectedVersion: N }),
  /** Withdraws a READY while others are still deciding, so a misclick does not forfeit the phase. */
  z.strictObject({ type: z.literal('UNREADY'), expectedVersion: N }),
]);
export type AlphaCommand = z.infer<typeof AlphaCommandSchema>;
/** The five Orders of V5.1a (canon §2). An Order authorizes an action; it never pays its cost. Types may repeat. */
export const AlphaOrderTypeSchema = z.enum(['CITY', 'EXPEDITION', 'ADVANCE', 'INFLUENCE', 'LEGACY']);
export type AlphaOrderType = z.infer<typeof AlphaOrderTypeSchema>;
export const ORDER_NAMES: Record<AlphaOrderType, string> = { CITY: 'Cidade', EXPEDITION: 'Expedição', ADVANCE: 'Avanço', INFLUENCE: 'Influência', LEGACY: 'Legado' };
export const emptyOrderCount = (): Record<AlphaOrderType, number> => ({ CITY: 0, EXPEDITION: 0, ADVANCE: 0, INFLUENCE: 0, LEGACY: 0 });
/** Which Order a strategic order in the private queue occupies. */
export const orderTypeForOrder = (order: StrategicOrder): AlphaOrderType => order.type === 'TRADE' || order.type === 'INFLUENCE' ? 'INFLUENCE' : 'EXPEDITION';
/** Which Order a planned action occupies (research is an Avanço Order even though it travels as an urban action). */
export const orderTypeForPlanned = (action: PlannedAction): AlphaOrderType => action.type === 'URBAN_ACTION' ? (action.action === 'RESEARCH' ? 'ADVANCE' : 'CITY') : 'INFLUENCE';
export const ActionClassSchema = z.enum(['MAIN', 'FREE', 'REACTION']);
export type ActionClass = z.infer<typeof ActionClassSchema>;
/** Exhaustive command classification shared by engine, projection and UI. Contextual exceptions stay in actionClassForCommand. */
export const ACTION_CLASS = {
  URBAN_ACTION:'MAIN', PROPOSE_TRADE:'MAIN', RESPOND_TRADE:'FREE', CONTEST_PRESENCE:'MAIN', INDEPENDENT_ACTION:'MAIN',
  SETTLE:'MAIN', DECLARE_HEGEMONY:'MAIN', CHOOSE_AMBITIONS:'FREE', PLAY_CARD:'FREE', PLAY_CIVILIZATION_CARD:'FREE', HIRE_ADVISOR:'MAIN', WORLD_CHOICE:'FREE',
  ADVANCE_LEGACY_WORK:'MAIN', PROPOSE_TREATY:'MAIN', RESPOND_TREATY:'FREE', END_TREATY:'FREE', DECLARE_WAR:'MAIN',
  LEADER_ABILITY:'FREE', SET_DEFENSE_POSTURE:'FREE', SET_CASUALTY_PRIORITY:'FREE', BUILD_ROAD:'MAIN', DEMOBILIZE:'MAIN', EMBARK:'MAIN', DISEMBARK:'MAIN', MANAGE:'MAIN', QUEUE_ORDER:'MAIN',
  CANCEL_ORDER:'FREE', READY:'FREE', UNREADY:'FREE', RESOLVE_CHOICE:'FREE', SWAP_AMBITION:'FREE',
} as const satisfies Record<AlphaCommand['type'], ActionClass>;

/** The Order a MAIN command consumes, or null for free actions. Government adoption travels through MANAGE and is an Influência Order (canon §16). */
export function orderTypeForCommand(command:AlphaCommand,phase?:AlphaRoundPhase):AlphaOrderType|null {
  if(actionClassForCommand(command,phase)!=='MAIN')return null;
  switch(command.type){
    case 'URBAN_ACTION':return command.action==='RESEARCH'?'ADVANCE':'CITY';
    case 'QUEUE_ORDER':return orderTypeForOrder(command.order);
    case 'SETTLE':case 'EMBARK':case 'DISEMBARK':case 'DEMOBILIZE':return 'EXPEDITION';
    case 'MANAGE':return command.command.type==='ADOPT_GOVERNMENT'?'INFLUENCE':'CITY';
    case 'BUILD_ROAD':return 'CITY';
    case 'ADVANCE_LEGACY_WORK':case 'DECLARE_HEGEMONY':return 'LEGACY';
    default:return 'INFLUENCE';
  }
}
export function actionClassForCommand(command:AlphaCommand,phase?:AlphaRoundPhase):ActionClass {
  if(command.type==='PLAY_CARD'&&phase==='CONFLICTS')return 'REACTION';
  if(command.type==='MANAGE'&&['ASSIGN_POPULATION','ASSIGN_WORKED_HEXES'].includes(command.command.type))return 'FREE';
  return ACTION_CLASS[command.type];
}
export type AlphaError = { code: string; message: string };

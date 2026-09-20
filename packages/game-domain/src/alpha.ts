import { z } from 'zod';
import { CityIdSchema, GameIdSchema, HexIdSchema, IdentifierSchema, NonNegativeIntegerSchema as N, PlayerIdSchema, PositiveIntegerSchema as P, ResourcePoolSchema, emptyResourcePool } from './core.js';
import { GameCommandSchema, GameStateSchema } from './model.js';
import { AlphaUnitClassSchema, UnitCatalogEntrySchema, alphaUnitCatalog } from './alpha-catalog.js';
import { ADVANCEMENTS, CIVILIZATIONS, AlphaEffectSchema } from './alpha-institutions.js';
import { ALPHA_CARDS, GREAT_PROJECTS } from './alpha-cards.js';
import { BuildingTypeSchema, DistrictTypeSchema, EconomyBreakdownSchema } from './territory.js';
import {
  ALPHA_ERA_MILESTONES, AlphaBalanceSchema, AlphaCitySchema, AlphaEraMilestoneSchema, AlphaEraSchema, AlphaResourcePoolSchema, AlphaRoundPhaseSchema, AlphaTelemetrySchema,
  BattleModifierSchema, BattlePostureSchema, IndependentPeopleSchema, MapPresetSchema, RaidBandSchema, TacticalFaceSchema,
  TradeOfferSchema, UrbanActionTypeSchema, WorldPulseCardSchema, alphaBalance, emptyAlphaResourcePool,
} from './alpha-concept.js';

export const AlphaPresetSchema = z.enum(['QUICK', 'STANDARD', 'EPIC']);
export const TreatyTypeSchema=z.enum(['TRADE_AGREEMENT','NON_AGGRESSION_PACT','OPEN_BORDERS','DEFENSIVE_PACT','ALLIANCE','EMBARGO']);
export const ResourceDealSchema = z.strictObject({ give: ResourcePoolSchema, receive: ResourcePoolSchema });
export const HegemonyPathSchema = z.enum(['MILITARY','ECONOMIC','SCIENTIFIC','CULTURAL','POLITICAL','TERRITORIAL']);
export const HegemonyMetricSchema = z.enum(['strength','victories','foreignPresence','wealth','internationalRoutes','tradePartners','eraFiveResearch','academicDistricts','scientificProjects','influence','culturalDistricts','foreignInfluence','treatyPartners','politicalProjects','territory','developedCities','withinCapacity']);
export type HegemonyMetric = z.infer<typeof HegemonyMetricSchema>;
export type HegemonyPath = z.infer<typeof HegemonyPathSchema>;
export const HegemonyDeclarationSchema = z.strictObject({path:HegemonyPathSchema,declaredRound:P,qualifiedSince:P.nullable()});
export const AlphaRulesSchema = z.strictObject({
  preset: AlphaPresetSchema, roundLimit: P, baseCommandPoints: P,
  hegemonyHoldRounds: P, handLimit: P, advisorLimit: P, unitLimit: P,
  integrationCost:ResourcePoolSchema,occupationStabilityPenalty:N,
  hegemonyRequirements:z.record(HegemonyPathSchema,z.array(z.strictObject({metric:HegemonyMetricSchema,minimum:P})).min(3)),
  cardsPerRound:P,eventEvery:P,roadCost:ResourcePoolSchema,advisorCost:ResourcePoolSchema,treatyDuration:P,routeIncome:N,foreignRouteIncome:N,
  units:z.record(AlphaUnitClassSchema,UnitCatalogEntrySchema),
  movementCosts:z.record(z.enum(['UNKNOWN','PLAINS','FOREST','HILLS','MOUNTAINS','COAST','SEA']),P), supplyRadius:P,
  milestones:z.array(AlphaEraMilestoneSchema).length(5),
  planningSeconds: z.union([z.literal(0), z.literal(180), z.literal(300), z.literal(480), z.literal(3600), z.literal(14400), z.literal(28800)]),
  worldPreset: MapPresetSchema,
  balance: AlphaBalanceSchema,
  combat: z.strictObject({ dice: z.literal(2), sides: z.literal(6), mediumMargin: P, largeMargin: P, unsuppliedPenalty: N, hillDefense: N, mountainDefense: N, postureAdvantage: z.literal(1) }),
});
export type AlphaRules = z.infer<typeof AlphaRulesSchema>;
export function alphaRules(preset: z.infer<typeof AlphaPresetSchema> = 'STANDARD', worldPreset: z.infer<typeof MapPresetSchema> = 'MIXED'): AlphaRules {
  return AlphaRulesSchema.parse({ preset, roundLimit: { QUICK: 9, STANDARD: 15, EPIC: 20 }[preset], baseCommandPoints: 4,
    hegemonyHoldRounds: 2, handLimit: 5, advisorLimit: 2, unitLimit: 24, planningSeconds: 0,
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
    combat: { dice: 2, sides: 6, mediumMargin: 3, largeMargin: 6, unsuppliedPenalty: 2, hillDefense: 1, mountainDefense: 2, postureAdvantage:1 } });
}
export const UrbanBuildTargetSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('DISTRICT'), district: DistrictTypeSchema }),
  z.strictObject({ kind: z.literal('BUILDING'), building: BuildingTypeSchema }),
  z.strictObject({ kind: z.literal('FORTIFICATION') }),
]);
/** Resources a player gained or lost during one round, by cause. Report arithmetic is verified against this. */
export const RoundLedgerSchema = z.strictObject({
  playerId: PlayerIdSchema, round: P, opening: ResourcePoolSchema,
  production: ResourcePoolSchema, mining: ResourcePoolSchema, trade: ResourcePoolSchema, institutions: ResourcePoolSchema, other: ResourcePoolSchema,
  losses: ResourcePoolSchema, expenses: ResourcePoolSchema, upkeepRequired: ResourcePoolSchema, upkeepPaid: ResourcePoolSchema, discarded: ResourcePoolSchema,
  /** Persistent institutional production (civilization passives, advancements, projects, advisors) is credited once per round, on the player's first PRODUCE. */
  institutionsCollected: z.boolean().default(false),
  cities: z.array(z.strictObject({ cityId: CityIdSchema, population: N, stability: N })),
});
export type RoundLedger = z.infer<typeof RoundLedgerSchema>;
export const UnitClassSchema = AlphaUnitClassSchema;
export const UnitSchema = z.strictObject({ id: IdentifierSchema, ownerId: PlayerIdSchema, kind: UnitClassSchema, hexId: HexIdSchema, recruitedRound: P });
export type AlphaUnit = z.infer<typeof UnitSchema>;
export const StrategicOrderSchema = z.discriminatedUnion('type', [
  z.strictObject({ id: IdentifierSchema, type: z.literal('EXPLORE'), unitId: IdentifierSchema, target: HexIdSchema, rotation: z.number().int().min(0).max(5) }),
  z.strictObject({ id: IdentifierSchema, type: z.literal('MOVE'), unitIds: z.array(IdentifierSchema).min(1).max(24), path: z.array(HexIdSchema).min(1).max(12) }),
  z.strictObject({ id: IdentifierSchema, type: z.literal('ATTACK'), unitIds: z.array(IdentifierSchema).min(1).max(24), target: HexIdSchema, posture: BattlePostureSchema.default('ASSAULT') }),
  z.strictObject({ id: IdentifierSchema, type: z.literal('TRADE'), fromCityId: CityIdSchema, toCityId: CityIdSchema }),
  z.strictObject({ id: IdentifierSchema, type: z.literal('INFLUENCE'), unitId: IdentifierSchema, target: HexIdSchema }),
]);
export type StrategicOrder = z.infer<typeof StrategicOrderSchema>;
const StrategicPlayerSchema = z.strictObject({
  playerId: PlayerIdSchema, civilization: IdentifierSchema.nullable(), era: AlphaEraSchema,
  resources:AlphaResourcePoolSchema.default(emptyAlphaResourcePool), legacyCulturalTrack:N.default(0),
  spentCommands: N, ready: z.boolean(), prestige: N, research: z.array(IdentifierSchema),
  hand: z.array(IdentifierSchema), ambitions: z.array(IdentifierSchema), completedAmbitions: z.array(IdentifierSchema), advisors: z.array(IdentifierSchema),
  knownHexIds: z.array(HexIdSchema), orders: z.array(StrategicOrderSchema),
  victories: N, exploredRegions: N, foreignInfluence: N,
  contacts:z.array(PlayerIdSchema),abilityRound:N,
  influencedCities:z.array(CityIdSchema),
  hegemony:HegemonyDeclarationSchema.nullable(),
  ambitionsChosen:z.boolean(),cardsPlayed:N,temporaryEffects:z.array(z.strictObject({source:IdentifierSchema,effect:AlphaEffectSchema,round:P})),
});
export const AlphaEventSchema = z.strictObject({
  id: IdentifierSchema, round: P, type: IdentifierSchema,
  audience: z.array(PlayerIdSchema).nullable(), message: z.string().max(1000),
});
export const AlphaStateSchema = z.strictObject({
  schemaVersion: z.literal(5), gameId: GameIdSchema, version: N,
  alphaVersion:z.literal('0.1.0-alpha.1').default('0.1.0-alpha.1'),
  phase:AlphaRoundPhaseSchema.default('WORLD_PULSE'),
  privateRng:z.strictObject({algorithm:z.literal('hmac-sha256-counter-v1'),seed:z.string().regex(/^[a-f0-9]{64}$/),counter:N}),
  core: GameStateSchema, rules: AlphaRulesSchema,
  players: z.array(StrategicPlayerSchema).min(2).max(6),
  initiative: z.array(PlayerIdSchema).min(2).max(6), units: z.array(UnitSchema),
  roads:z.array(HexIdSchema),
  regions:z.array(z.strictObject({id:IdentifierSchema,templateId:IdentifierSchema,hexIds:z.array(HexIdSchema).length(7),rotation:z.number().int().min(0).max(5),revealedBy:z.array(PlayerIdSchema)})),
  occupations:z.array(z.strictObject({cityId:CityIdSchema,occupierId:PlayerIdSchema,previousOwnerId:PlayerIdSchema,sinceRound:P})),
  treaties:z.array(z.strictObject({id:IdentifierSchema,proposerId:PlayerIdSchema,recipientId:PlayerIdSchema,type:TreatyTypeSchema,status:z.enum(['PROPOSED','ACCEPTED','ACTIVE','DECLINED','ENDED']),deal:ResourceDealSchema,createdRound:P,expiresRound:P})),
  wars:z.array(z.tuple([PlayerIdSchema,PlayerIdSchema])),
  routes:z.array(z.strictObject({id:IdentifierSchema,ownerId:PlayerIdSchema,fromCityId:CityIdSchema,toCityId:CityIdSchema,path:z.array(HexIdSchema).min(1),suspended:z.boolean()})),
  cards:z.strictObject({worldDeck:z.array(IdentifierSchema),strategyDeck:z.array(IdentifierSchema),ambitionDeck:z.array(IdentifierSchema),advisorDeck:z.array(IdentifierSchema),discarded:z.array(IdentifierSchema),advisorMarket:z.array(IdentifierSchema),worldEvent:IdentifierSchema.nullable(),worldEventRound:N,worldResponded:z.array(PlayerIdSchema)}),
  projects:z.array(z.strictObject({projectId:IdentifierSchema,ownerId:PlayerIdSchema,cityId:CityIdSchema,completedRound:P})),
  cities:z.array(AlphaCitySchema).default([]),
  tradeOffers:z.array(TradeOfferSchema).default([]),
  independents:z.array(IndependentPeopleSchema).default([]),
  raidBands:z.array(RaidBandSchema).default([]),
  worldPulse:z.strictObject({deck:z.array(IdentifierSchema),discard:z.array(IdentifierSchema),current:WorldPulseCardSchema.nullable(),resolvedRound:N}).default({deck:[],discard:[],current:null,resolvedRound:0}),
  roundLedgers:z.array(RoundLedgerSchema).default([]),
  telemetry:AlphaTelemetrySchema,
  roundReports:z.array(z.strictObject({playerId:PlayerIdSchema,round:P,opening:ResourcePoolSchema,institutions:ResourcePoolSchema,trade:ResourcePoolSchema,mining:ResourcePoolSchema.default(emptyResourcePool),production:ResourcePoolSchema.default(emptyResourcePool),other:ResourcePoolSchema.default(emptyResourcePool),losses:ResourcePoolSchema.default(emptyResourcePool),expenses:ResourcePoolSchema.default(emptyResourcePool),discarded:ResourcePoolSchema.default(emptyResourcePool),economy:EconomyBreakdownSchema.nullable(),upkeepRequired:ResourcePoolSchema,upkeepPaid:ResourcePoolSchema,closing:ResourcePoolSchema,
    cities:z.array(z.strictObject({cityId:CityIdSchema,populationBefore:N,populationAfter:N,stabilityBefore:N,stabilityAfter:N})),administrativeLoad:N,administrativeCapacity:N})),
  battles:z.array(z.strictObject({id:IdentifierSchema,round:P,hexId:HexIdSchema,attackerId:PlayerIdSchema,defenderId:PlayerIdSchema,
    attackerUnits:z.array(IdentifierSchema),defenderUnits:z.array(IdentifierSchema),
    attackerPosture:BattlePostureSchema.default('ASSAULT'),defenderPosture:BattlePostureSchema.default('HOLD'),
    attackBreakdown:z.array(BattleModifierSchema).default([]),defenseBreakdown:z.array(BattleModifierSchema).default([]),
    attackerTactical:z.array(z.strictObject({unitId:IdentifierSchema,face:TacticalFaceSchema})).default([]),
    defenderTactical:z.array(z.strictObject({unitId:IdentifierSchema,face:TacticalFaceSchema})).default([]),
    attackStrength:N,defenseStrength:N,attackModifiers:z.number().int(),defenseModifiers:z.number().int(),
    attackDice:z.tuple([P.max(6),P.max(6)]),defenseDice:z.tuple([P.max(6),P.max(6)]),
    attackTotal:z.number().int(),defenseTotal:z.number().int(),winnerId:PlayerIdSchema,losses:z.array(IdentifierSchema),retreat:HexIdSchema.nullable()})),
  winner: z.strictObject({ playerId: PlayerIdSchema, reason: z.enum(['HEGEMONY', 'ROUND_LIMIT']), round: P }).nullable(),
  events: z.array(AlphaEventSchema),
}).superRefine((state, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  const owners = new Set(state.core.players.map(p => p.id));
  if(new Set(state.roundReports.map(r=>`${r.playerId}:${r.round}`)).size!==state.roundReports.length)fail('Duplicate round report');
  for(const report of state.roundReports){
    if(!owners.has(report.playerId)||report.round>state.core.round)fail('Invalid round report');
    for(const key of ['food','materials','wealth','knowledge','influence'] as const){
      const expected=report.opening[key]+report.institutions[key]+report.trade[key]+report.mining[key]+report.production[key]+report.other[key]+(report.economy?.netChange[key]??0)-report.losses[key]-report.expenses[key]-report.upkeepPaid[key]-report.discarded[key];
      if(expected!==report.closing[key]||report.upkeepPaid[key]>report.upkeepRequired[key])fail('Round report arithmetic mismatch');
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
  if(new Set(state.projects.map(p=>p.projectId)).size!==state.projects.length||state.projects.some(p=>!GREAT_PROJECTS.some(g=>g.id===p.projectId)||!cities.some(c=>c.id===p.cityId&&c.ownerId===p.ownerId)||p.completedRound>state.core.round))fail('Invalid or duplicate unique project');
  if(new Set(state.treaties.map(t=>t.id)).size!==state.treaties.length||state.treaties.some(t=>!owners.has(t.proposerId)||!owners.has(t.recipientId)||t.proposerId===t.recipientId||t.expiresRound<t.createdRound||t.createdRound>state.core.round))fail('Invalid treaty');
  if(state.wars.some(([a,b])=>!owners.has(a)||!owners.has(b)||a>=b)||new Set(state.wars.map(p=>p.join(':'))).size!==state.wars.length)fail('Invalid war relation');
  if(new Set(state.routes.map(r=>r.id)).size!==state.routes.length||state.routes.some(r=>!owners.has(r.ownerId)||!cities.some(c=>c.id===r.fromCityId&&c.ownerId===r.ownerId)||!cities.some(c=>c.id===r.toCityId)||r.fromCityId===r.toCityId||r.path.some(id=>!hexes.has(id))))fail('Invalid trade route');
  if(new Set(state.occupations.map(o=>o.cityId)).size!==state.occupations.length||state.occupations.some(o=>!owners.has(o.previousOwnerId)||o.previousOwnerId===o.occupierId||!cities.some(c=>c.id===o.cityId&&c.ownerId===o.occupierId)||o.sinceRound>state.core.round))fail('Invalid city occupation');
  if (new Set(state.units.map(u => u.id)).size !== state.units.length) fail('Duplicate unit');
  for (const unit of state.units) {
    const tile = hexes.get(unit.hexId);
    if (!owners.has(unit.ownerId) || !tile || unit.recruitedRound > state.core.round) fail('Invalid unit owner, position or round');
    if (tile && (unit.kind === 'FLEET' ? !['COAST','SEA'].includes(tile.terrain) : ['SEA','UNKNOWN'].includes(tile.terrain))) fail('Unit on illegal terrain');
  }
  for (const player of state.players) {
    if(new Set(player.influencedCities).size!==player.influencedCities.length||player.influencedCities.some(id=>!cities.some(c=>c.id===id))||player.foreignInfluence!==player.influencedCities.length)fail('Invalid foreign influence');
    if(player.hegemony&&(player.era!=='HEGEMONY'||player.hegemony.declaredRound>state.core.round||(player.hegemony.qualifiedSince!==null&&(player.hegemony.qualifiedSince<player.hegemony.declaredRound||player.hegemony.qualifiedSince>state.core.round))))fail('Invalid hegemony declaration');
    if(player.civilization!==null&&!CIVILIZATIONS.some(c=>c.id===player.civilization))fail('Unknown civilization');
    if(player.research.some(id=>!ADVANCEMENTS.some(a=>a.id===id)))fail('Unknown advancement');
    for(const id of player.research){const node=ADVANCEMENTS.find(a=>a.id===id);if(!node)continue;if(node.prerequisites.some(p=>!player.research.includes(p))||node.excludes.some(p=>player.research.includes(p))||AlphaEraSchema.options.indexOf(node.era)>AlphaEraSchema.options.indexOf(player.era))fail('Illegal research prerequisites, exclusion or era');}
    if(player.contacts.some(id=>!owners.has(id)||id===player.playerId)||new Set(player.contacts).size!==player.contacts.length||player.abilityRound>state.core.round)fail('Invalid contact or ability timing');
    for (const ids of [player.research, player.hand, player.ambitions, player.completedAmbitions, player.advisors, player.knownHexIds, player.orders.map(o => o.id)]) if (new Set(ids).size !== ids.length) fail('Duplicate exclusive player item');
    if (player.knownHexIds.some(id => !hexes.has(id))) fail('Unknown knowledge coordinate');
    if (player.hand.length > state.rules.handLimit || player.advisors.length > state.rules.advisorLimit || state.units.filter(u => u.ownerId === player.playerId).length > state.rules.unitLimit) fail('Player component limit exceeded');
  }
  for (const event of state.events) if (event.round > state.core.round || event.audience?.some(id => !owners.has(id))) fail('Invalid event audience or round');
  for(const battle of state.battles) {
    if(!hexes.has(battle.hexId)||!owners.has(battle.attackerId)||!owners.has(battle.defenderId)||battle.attackerId===battle.defenderId||battle.round>state.core.round)fail('Invalid battle participants');
    if(battle.attackTotal!==battle.attackStrength+battle.attackModifiers+battle.attackDice[0]+battle.attackDice[1]||battle.defenseTotal!==battle.defenseStrength+battle.defenseModifiers+battle.defenseDice[0]+battle.defenseDice[1])fail('Battle arithmetic mismatch');
    if(battle.winnerId!==(battle.attackTotal>battle.defenseTotal?battle.attackerId:battle.defenderId))fail('Battle winner mismatch');
  }
});
export type AlphaState = z.infer<typeof AlphaStateSchema>;
export const AlphaCommandSchema = z.discriminatedUnion('type', [
  z.strictObject({type:z.literal('URBAN_ACTION'),expectedVersion:N,cityId:CityIdSchema,action:UrbanActionTypeSchema,build:UrbanBuildTargetSchema.optional(),unit:AlphaUnitClassSchema.optional(),advancementId:IdentifierSchema.optional()}),
  z.strictObject({type:z.literal('PROPOSE_TRADE'),expectedVersion:N,recipientId:PlayerIdSchema,offerType:z.enum(['TRADE_INSTANT','GIFT','FUTURE_PROMISE','LOAN']),offer:AlphaResourcePoolSchema,request:AlphaResourcePoolSchema,treatyTerms:z.array(IdentifierSchema).max(4),dueRound:P.nullable()}),
  z.strictObject({type:z.literal('RESPOND_TRADE'),expectedVersion:N,offerId:IdentifierSchema,accept:z.boolean()}),
  z.strictObject({type:z.literal('CONTEST_PRESENCE'),expectedVersion:N,cityId:CityIdSchema,defenderCivilizationId:IdentifierSchema}),
  z.strictObject({type:z.literal('INDEPENDENT_ACTION'),expectedVersion:N,peopleId:IdentifierSchema,action:z.enum(['TRADE','NEGOTIATE','INFLUENCE','PROTECT','INTEGRATE','CONQUER'])}),
  z.strictObject({type:z.literal('SETTLE'),expectedVersion:N,unitId:IdentifierSchema,name:z.string().trim().min(1).max(80)}),
  z.strictObject({type:z.literal('INTEGRATE_CITY'),expectedVersion:N,cityId:CityIdSchema}),
  z.strictObject({type:z.literal('DECLARE_HEGEMONY'),expectedVersion:N,path:HegemonyPathSchema}),
  z.strictObject({type:z.literal('CHOOSE_AMBITIONS'),expectedVersion:N,cardIds:z.array(IdentifierSchema).length(2)}),
  z.strictObject({type:z.literal('PLAY_CARD'),expectedVersion:N,cardId:IdentifierSchema}),
  z.strictObject({type:z.literal('HIRE_ADVISOR'),expectedVersion:N,cardId:IdentifierSchema}),
  z.strictObject({type:z.literal('WORLD_CHOICE'),expectedVersion:N,choice:z.enum(['RESOURCE','PRESTIGE'])}),
  z.strictObject({type:z.literal('BUILD_PROJECT'),expectedVersion:N,projectId:IdentifierSchema,cityId:CityIdSchema}),
  z.strictObject({type:z.literal('PROPOSE_TREATY'),expectedVersion:N,recipientId:PlayerIdSchema,treaty:TreatyTypeSchema,deal:ResourceDealSchema}),
  z.strictObject({type:z.literal('RESPOND_TREATY'),expectedVersion:N,treatyId:IdentifierSchema,accept:z.boolean()}),
  z.strictObject({type:z.literal('END_TREATY'),expectedVersion:N,treatyId:IdentifierSchema}),
  z.strictObject({type:z.literal('DECLARE_WAR'),expectedVersion:N,targetId:PlayerIdSchema}),
  z.strictObject({type:z.literal('RESEARCH'),expectedVersion:N,advancementId:IdentifierSchema}),
  z.strictObject({type:z.literal('ADVANCE_ERA'),expectedVersion:N}),
  z.strictObject({type:z.literal('CIVILIZATION_ABILITY'),expectedVersion:N}),
  z.strictObject({type:z.literal('RECRUIT'),expectedVersion:N,cityId:CityIdSchema,kind:UnitClassSchema}),
  z.strictObject({type:z.literal('BUILD_ROAD'),expectedVersion:N,hexId:HexIdSchema}),
  z.strictObject({ type: z.literal('MANAGE'), expectedVersion: N, command: GameCommandSchema }),
  z.strictObject({ type: z.literal('QUEUE_ORDER'), expectedVersion: N, order: StrategicOrderSchema }),
  z.strictObject({ type: z.literal('CANCEL_ORDER'), expectedVersion: N, orderId: IdentifierSchema }),
  z.strictObject({ type: z.literal('READY'), expectedVersion: N }),
]);
export type AlphaCommand = z.infer<typeof AlphaCommandSchema>;
export type AlphaError = { code: string; message: string };

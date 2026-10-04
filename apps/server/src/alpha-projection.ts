import { ACTION_CLASS, ADVANCEMENTS, CityLevelSchema, GREAT_PROJECTS, type AlphaState, type PlayerId } from '@aoh/game-domain';
import { kitAdvancementCost, growthForecast, alphaActionUsage, alphaCommandCapacity, alphaCost, alphaStorageCapacity, alphaUnitOptions, tradeOfferView, alphaClaimOptions, pendingAttacks, prestigeRanking, combatPreview, culturalPresenceView, independentPeopleView, raidBandView, stackView, leaderAbilityBlock, urbanOptions, infrastructureStats, deriveCityProductionBreakdown, eraMilestones, hegemonyProgress, hexDistance, stabilityCategory, unitSupply, visibleHexIds } from '@aoh/game-engine';
import { playerView } from './game-service.js';

/** Explicit public allowlist. Never serialize the alpha aggregate to a player. */
export function alphaPlayerView(state:AlphaState,actor:PlayerId) {
  const progress=state.players.find(p=>p.playerId===actor);
  if(!progress)return null;
  const visible=visibleHexIds(state,actor);
  const growth=growthForecast(state,actor);
  const economic=playerView(state.core,actor,{visibleHexIds:state.core.map.filter(t=>visible.has(t.id)).map(t=>t.id),visibleCityIds:state.core.players.flatMap(p=>p.civilization.cities.filter(c=>visible.has(c.hexId)).map(c=>c.id)),knownGovernmentPlayerIds:[]});
  if(!economic)return null;
  const known=state.core.map.filter(t=>progress.knownHexIds.includes(t.id)&&!visible.has(t.id));
  const explored=state.core.map.filter(t=>progress.knownHexIds.includes(t.id)||visible.has(t.id));
  const territory=state.core.config.territory;
  const displayCost=(cost:Parameters<typeof alphaCost>[0])=>alphaCost(cost,progress.resources);
  return structuredClone({
    gameId:state.gameId,version:state.version,schemaVersion:state.schemaVersion,view:economic,
    phase:state.phase,urban:urbanOptions(state,actor),
    worldPulse:state.worldPulse.current?{id:state.worldPulse.current.id,name:state.worldPulse.current.name,type:state.worldPulse.current.type}:null,
    cityStates:state.cities.filter(c=>c.currentOwnerId===actor).map(c=>({cityId:c.cityId,status:c.status,integration:c.integration,mood:c.mood,level:c.level,localCohesion:c.localCohesion,urbanActionsUsed:c.urbanActionsUsed,plannedUrbanActions:progress.plannedActions.filter(action=>action.type==='URBAN_ACTION'&&action.cityId===c.cityId).length,fortification:c.fortification.level})),
    /** What anyone sees of a visible city from outside: its size and its walls (UXDEC-016/017). Never population details. */
    cityMarks:state.cities.flatMap(meta=>{const city=state.core.players.flatMap(p=>p.civilization.cities).find(c=>c.id===meta.cityId);if(!city||(meta.currentOwnerId!==actor&&!visible.has(city.hexId)))return [];return [{cityId:meta.cityId,hexId:city.hexId,ownerId:meta.currentOwnerId,level:CityLevelSchema.options.indexOf(meta.level)+1,capital:meta.capital,fortification:meta.fortification}];}),
    culture:culturalPresenceView(state,actor),
    independents:independentPeopleView(state,actor),
    raidBands:raidBandView(state,actor),
    leaderBlock:leaderAbilityBlock(state,actor),
    stacks:stackView(state,actor),unitOptions:alphaUnitOptions(state,actor),claimOptions:alphaClaimOptions(state,actor),
    /** While reactions are open, the defender learns who attacks which of its hexes (never the force or posture). */
    incomingAttacks:state.phase==='CONFLICTS'?pendingAttacks(state).filter(attack=>attack.defenderId===actor).map(({attackerId,target})=>({attackerId,target})):[],
    orderPreviews:Object.fromEntries(progress.orders.flatMap(order=>order.type==='ATTACK'?[[order.id,combatPreview(state,actor,order)] as const]:[])),
    self:progress,storage:alphaStorageCapacity(state,actor),actions:alphaActionUsage(state,actor),actionClasses:ACTION_CLASS,commandCapacity:alphaCommandCapacity(state,actor),rules:state.rules,
    costs:{
      claim:displayCost(territory.claimCost),founding:displayCost(territory.foundingCost),road:displayCost(state.rules.roadCost),advisor:displayCost(state.rules.advisorCost),
      development:state.core.config.developmentCosts.map(displayCost),
      improvements:Object.fromEntries(Object.entries(territory.improvementCatalog).map(([kind,entry])=>[kind,displayCost(entry.cost)])),
      advancements:Object.fromEntries(ADVANCEMENTS.map(advancement=>[advancement.id,displayCost(kitAdvancementCost(state,actor,advancement))])),
      projects:Object.fromEntries(GREAT_PROJECTS.map(project=>[project.id,displayCost(project.cost)])),
    },
    milestones:eraMilestones(state,actor),
    cityDetails:economic.player.civilization.cities.map(c=>({id:c.id,category:stabilityCategory(c.stability,state.core.config),growthThreshold:infrastructureStats(c,state.core.config).growthThreshold,growth:(g=>({producedFood:g.producedFood,share:g.share,growthProgress:g.growthProgress,threshold:g.threshold,capped:g.capped,roundsToGrow:g.roundsToGrow,civilization:{foodProduced:growth.foodProduced,foodEaten:growth.foodEaten,shortage:growth.shortage,surplus:growth.surplus}}))(growth.cities.find(g=>g.cityId===c.id)!),production:deriveCityProductionBreakdown(c,economic.player.civilization,state.core.config,state.core.map)})),
    roundReports:state.roundReports.filter(r=>r.playerId===actor),
    hegemony:hegemonyProgress(state,actor),
    declarations:state.players.filter(p=>p.hegemony!==null).map(p=>({playerId:p.playerId,...p.hegemony})),
    worldEvent:state.cards.worldEvent,worldDecisionPending:!state.cards.worldResponded.includes(actor),advisorMarket:state.cards.advisorMarket,projects:state.projects,
    players:state.core.players.map(p=>({id:p.id,name:p.name,civilization:state.players.find(s=>s.playerId===p.id)!.civilization,ready:state.players.find(s=>s.playerId===p.id)!.ready,prestige:state.players.find(s=>s.playerId===p.id)!.prestige,era:state.players.find(s=>s.playerId===p.id)!.era})),
    initiative:state.initiative,winner:state.winner,
    /** Only once the match is over: the ranking and the tie-break figures behind it, for everyone. */
    finalStandings:state.winner?prestigeRanking(state).map(id=>{const progress=state.players.find(p=>p.playerId===id)!,owner=state.core.players.find(p=>p.id===id)!;return {playerId:id,name:owner.name,civilization:progress.civilization,prestige:progress.prestige,research:progress.research.length,population:owner.civilization.cities.reduce((total,city)=>total+city.population,0),wealth:progress.resources.wealth,cities:owner.civilization.cities.length,hegemony:progress.hegemony?.path??null};}):[],
    knownTerritory:known.map(t=>({id:t.id,q:t.q,r:t.r,terrain:t.terrain,features:t.features,visibility:'KNOWN' as const})),
    frontier:state.core.map.filter(t=>!progress.knownHexIds.includes(t.id)&&!visible.has(t.id)&&explored.some(k=>hexDistance(k,t)===1)).map(t=>({id:t.id,q:t.q,r:t.r,visibility:'UNKNOWN' as const})),
    /** Rivals see a fleet, never its cargo. */
    units:state.units.filter(u=>u.ownerId===actor||(visible.has(u.hexId)&&!u.carrierId)).map(u=>({...u,supply:u.ownerId===actor?unitSupply(state,u):null})),
    regions:state.regions.filter(r=>r.revealedBy.includes(actor)).map(r=>({id:r.id,templateId:r.templateId,hexIds:r.hexIds,rotation:r.rotation})),
    roads:state.roads.filter(id=>visible.has(id)),occupations:state.occupations.filter(o=>o.occupierId===actor||o.previousOwnerId===actor),
    treaties:state.treaties.filter(t=>t.proposerId===actor||t.recipientId===actor),tradeOffers:tradeOfferView(state,actor),wars:state.wars.filter(pair=>pair.includes(actor)),
    routes:state.routes.filter(r=>r.ownerId===actor||economic.player.civilization.cities.some(c=>c.id===r.toCityId)),
    battles:state.battles.filter(b=>b.attackerId===actor||b.defenderId===actor),
    events:state.events.filter(e=>e.audience===null||e.audience.includes(actor)),
    economicEvents:state.core.eventLog.filter(e=>'playerId' in e&&e.playerId===actor).slice(-60),
  });
}
export type AlphaPlayerView=NonNullable<ReturnType<typeof alphaPlayerView>>;

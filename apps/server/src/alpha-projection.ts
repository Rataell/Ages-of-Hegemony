import type { AlphaState, PlayerId } from '@aoh/game-domain';
import { alphaCommandCapacity, deriveCityProductionBreakdown, eraMilestones, hegemonyProgress, hexDistance, stabilityCategory, unitSupply, visibleHexIds } from '@aoh/game-engine';
import { playerView } from './game-service.js';

/** Explicit public allowlist. Never serialize the alpha aggregate to a player. */
export function alphaPlayerView(state:AlphaState,actor:PlayerId) {
  const progress=state.players.find(p=>p.playerId===actor);
  if(!progress)return null;
  const visible=visibleHexIds(state,actor);
  const economic=playerView(state.core,actor,{visibleHexIds:state.core.map.filter(t=>visible.has(t.id)).map(t=>t.id),visibleCityIds:state.core.players.flatMap(p=>p.civilization.cities.filter(c=>visible.has(c.hexId)).map(c=>c.id)),knownGovernmentPlayerIds:[]});
  if(!economic)return null;
  const known=state.core.map.filter(t=>progress.knownHexIds.includes(t.id)&&!visible.has(t.id));
  const explored=state.core.map.filter(t=>progress.knownHexIds.includes(t.id)||visible.has(t.id));
  return structuredClone({
    gameId:state.gameId,version:state.version,schemaVersion:state.schemaVersion,view:economic,
    phase:state.phase,
    worldPulse:state.worldPulse.current?{id:state.worldPulse.current.id,name:state.worldPulse.current.name,type:state.worldPulse.current.type}:null,
    cityStates:state.cities.filter(c=>c.currentOwnerId===actor).map(c=>({cityId:c.cityId,status:c.status,integration:c.integration,mood:c.mood,level:c.level,localCohesion:c.localCohesion,urbanActionsUsed:c.urbanActionsUsed,fortification:c.fortification.level})),
    self:progress,commandCapacity:alphaCommandCapacity(state,actor),rules:state.rules,
    milestones:eraMilestones(state,actor),
    cityDetails:economic.player.civilization.cities.map(c=>({id:c.id,category:stabilityCategory(c.stability,state.core.config),production:deriveCityProductionBreakdown(c,economic.player.civilization,state.core.config,state.core.map)})),
    roundReports:state.roundReports.filter(r=>r.playerId===actor),
    hegemony:hegemonyProgress(state,actor),
    declarations:state.players.filter(p=>p.hegemony!==null).map(p=>({playerId:p.playerId,...p.hegemony})),
    worldEvent:state.cards.worldEvent,worldDecisionPending:!state.cards.worldResponded.includes(actor),advisorMarket:state.cards.advisorMarket,projects:state.projects,
    players:state.core.players.map(p=>({id:p.id,name:p.name,ready:state.players.find(s=>s.playerId===p.id)!.ready,prestige:state.players.find(s=>s.playerId===p.id)!.prestige,era:state.players.find(s=>s.playerId===p.id)!.era})),
    initiative:state.initiative,winner:state.winner,
    knownTerritory:known.map(t=>({id:t.id,q:t.q,r:t.r,terrain:t.terrain,features:t.features,visibility:'KNOWN' as const})),
    frontier:state.core.map.filter(t=>!progress.knownHexIds.includes(t.id)&&!visible.has(t.id)&&explored.some(k=>hexDistance(k,t)===1)).map(t=>({id:t.id,q:t.q,r:t.r,visibility:'UNKNOWN' as const})),
    units:state.units.filter(u=>u.ownerId===actor||visible.has(u.hexId)).map(u=>({...u,supply:u.ownerId===actor?unitSupply(state,u):null})),
    regions:state.regions.filter(r=>r.revealedBy.includes(actor)).map(r=>({id:r.id,templateId:r.templateId,hexIds:r.hexIds,rotation:r.rotation})),
    roads:state.roads.filter(id=>visible.has(id)),occupations:state.occupations.filter(o=>o.occupierId===actor||o.previousOwnerId===actor),
    treaties:state.treaties.filter(t=>t.proposerId===actor||t.recipientId===actor),wars:state.wars.filter(pair=>pair.includes(actor)),
    routes:state.routes.filter(r=>r.ownerId===actor||economic.player.civilization.cities.some(c=>c.id===r.toCityId)),
    battles:state.battles.filter(b=>b.attackerId===actor||b.defenderId===actor),
    events:state.events.filter(e=>e.audience===null||e.audience.includes(actor)),
    economicEvents:state.core.eventLog.filter(e=>'playerId' in e&&e.playerId===actor).slice(-60),
  });
}
export type AlphaPlayerView=NonNullable<ReturnType<typeof alphaPlayerView>>;

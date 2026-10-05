import { ADVANCEMENTS, legacyWork, HegemonyPathSchema, type AlphaState, type HegemonyMetric, type HegemonyPath, type PlayerId } from '@aoh/game-domain';
import { tradePath } from './alpha-diplomacy.js';
import { culturalPresenceCount } from './alpha-culture.js';

/** All requirements are evaluated against authority, including current access to trade routes. */
export function hegemonyProgress(state:AlphaState,actor:PlayerId) {
  const player=state.players.find(p=>p.playerId===actor)!;
  const core=state.core.players.find(p=>p.id===actor)!;
  const cities=core.civilization.cities.filter(c=>!state.occupations.some(o=>o.cityId===c.id));
  const districts=cities.flatMap(c=>c.districts);
  const works=state.legacyWorks.filter(w=>w.ownerId===actor&&w.completedRound!==null&&cities.some(c=>c.id===w.cityId));
  const foreignRoutes=state.routes.filter(r=>r.ownerId===actor&&!core.civilization.cities.some(c=>c.id===r.toCityId)).filter(r=>{
    try { tradePath(state,actor,r.fromCityId,r.toCityId);return true; } catch { return false; }
  });
  const partners=new Set(foreignRoutes.map(r=>state.core.players.find(p=>p.civilization.cities.some(c=>c.id===r.toCityId))!.id));
  const treaties=state.treaties.filter(t=>t.status==='ACTIVE'&&t.expiresRound>=state.core.round&&t.type!=='EMBARGO'&&[t.proposerId,t.recipientId].includes(actor));
  const units=state.units.filter(u=>u.ownerId===actor&&state.rules.units[u.kind].strength>0);
  const metrics:Record<HegemonyMetric,number>={
    strength:units.reduce((n,u)=>n+state.rules.units[u.kind].strength,0),victories:player.victories,
    foreignPresence:units.filter(u=>{const tile=state.core.map.find(t=>t.id===u.hexId)!;return tile.ownerId!==null&&tile.ownerId!==actor;}).length,
    wealth:player.resources.wealth,internationalRoutes:foreignRoutes.length,tradePartners:partners.size,
    eraFiveResearch:player.research.filter(id=>ADVANCEMENTS.find(a=>a.id===id)?.era==='ASCENSION').length,
    academicDistricts:districts.filter(d=>d.type==='ACADEMIC').length,
    scientificProjects:works.filter(w=>legacyWork(w.workId)?.path==='SCIENTIFIC').length,
    influence:player.resources.influence,culturalDistricts:districts.filter(d=>d.type==='CULTURAL').length,foreignInfluence:culturalPresenceCount(state,actor),
    treatyPartners:new Set(treaties.map(t=>t.proposerId===actor?t.recipientId:t.proposerId)).size,
    politicalProjects:works.filter(w=>legacyWork(w.workId)?.path==='POLITICAL').length,
    territory:state.core.map.filter(t=>t.ownerId===actor&&!state.occupations.some(o=>o.cityId===t.controllerCityId)).length,
    developedCities:state.cities.filter(m=>m.currentOwnerId===actor&&['GREAT_CITY','METROPOLIS','IMPERIAL_METROPOLIS'].includes(m.level)).length,
    withinCapacity:Number(core.civilization.administrativeLoad<=core.civilization.administrativeCapacity),
  };
  return HegemonyPathSchema.options.map(path=>({path,requirements:state.rules.hegemonyRequirements[path].map(r=>({...r,current:metrics[r.metric],met:metrics[r.metric]>=r.minimum}))}));
}

export function declareHegemony(state:AlphaState,actor:PlayerId,path:HegemonyPath):void {
  const player=state.players.find(p=>p.playerId===actor)!;
  if(player.era!=='ASCENSION')throw new Error('A declaração de Hegemonia requer a Era VII, Ascensão.');
  if(player.hegemony)throw new Error('Sua civilização já escolheu um caminho hegemônico.');
  player.hegemony={path,declaredRound:state.core.round,qualifiedSince:null};
}

/** Called after each authoritative change. Losing a condition breaks uninterrupted consolidation. */
export function refreshHegemony(state:AlphaState):void {
  for(const player of state.players)if(player.hegemony){
    const eligible=hegemonyProgress(state,player.playerId).find(p=>p.path===player.hegemony!.path)!.requirements.every(r=>r.met);
    if(!eligible)player.hegemony.qualifiedSince=null;
    else if(player.hegemony.qualifiedSince===null)player.hegemony.qualifiedSince=state.core.round;
  }
}

/** Declaration/qualification round is excluded; ties follow the public initiative track. */
export function hegemonyWinner(state:AlphaState):PlayerId|null {
  refreshHegemony(state);
  return state.initiative.find(id=>{
    const declaration=state.players.find(p=>p.playerId===id)!.hegemony;
    return declaration?.qualifiedSince!=null&&state.core.round-declaration.qualifiedSince>=state.rules.hegemonyHoldRounds;
  })??null;
}

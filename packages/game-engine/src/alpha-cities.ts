import { CityIdSchema, cityLevelForPopulation, connectedTo, type AlphaState, type CityId, type PlayerId } from '@aoh/game-domain';
import { refreshAdministration } from './civilization.js';
import { alphaResourcePayment } from './alpha-resources.js';
import { governmentEffects } from './alpha-government.js';
import { foundCityAt } from './founding.js';
import { culturalIdentityOf, refreshCulturalMetrics } from './alpha-culture.js';

/** The shared territory rules answer in codes; players read these sentences. */
const FOUNDING_REFUSALS:Record<string,(distance:number)=>string>={
  INVALID_CITY_SITE:()=>'Funde em terra firme, fora de uma cidade e de um território já trabalhado.',
  CITY_TOO_CLOSE:distance=>`Uma nova cidade precisa ficar a pelo menos ${distance} hexes de qualquer cidade.`,
  INSUFFICIENT_RESOURCES:()=>'Recursos insuficientes para fundar a cidade.',
  UNKNOWN_HEX:()=>'Hex desconhecido.',
};
/** Fundar custa 1 Madeira a menos sob a Confederação (canon §16); the discount comes off the material cost. */
function foundingPayment(state:AlphaState,actor:PlayerId){
  const pay=alphaResourcePayment(state),discount=governmentEffects(state,actor).foundingWoodDiscount;
  return discount===0?pay:(corePlayer:Parameters<typeof pay>[0],cost:Parameters<typeof pay>[1])=>pay(corePlayer,{...cost,materials:Math.max(0,cost.materials-discount)});
}
export function settleWithPioneer(state:AlphaState,actor:PlayerId,unitId:string,name:string):void {
  const pioneer=state.units.find(u=>u.id===unitId&&u.ownerId===actor&&u.kind==='PIONEER');
  if(!pioneer)throw new Error('Escolha um Pioneiro próprio para fundar uma cidade.');
  if(state.players.find(p=>p.playerId===actor)!.orders.some(o=>('unitIds' in o&&o.unitIds.includes(unitId))||('unitId' in o&&o.unitId===unitId)))throw new Error('Cancele a ordem do Pioneiro antes de fundar a cidade: explorar e fundar são Ordens diferentes.');
  const tile=state.core.map.find(t=>t.id===pioneer.hexId)!;
  if(tile.ownerId!==null&&tile.ownerId!==actor||state.units.some(u=>u.hexId===tile.id&&u.ownerId!==actor))throw new Error('Não é possível fundar em território ou presença estrangeira.');
  const player=state.core.players.find(p=>p.id===actor)!;
  const founded=foundCityAt(state.core,player,state.core.map,{type:'FOUND_CITY',playerId:actor,cityId:CityIdSchema.parse(`city-${actor}-${state.version}`),hexId:tile.id,name,expectedVersion:state.core.version},state.core.version+1,foundingPayment(state,actor));
  if(!founded.ok)throw new Error(FOUNDING_REFUSALS[founded.error.code]?.(state.core.config.territory.minimumCityDistance)??founded.error.message);
  state.units=state.units.filter(u=>u.id!==unitId);
  const newCity=player.civilization.cities.find(c=>c.hexId===tile.id)!;
  state.cities.push({cityId:newCity.id,originalOwnerId:actor,currentOwnerId:actor,nativeIdentity:state.players.find(p=>p.playerId===actor)!.civilization??`native-${actor}`,status:'OWNED',integration:100,mood:4,level:cityLevelForPopulation(newCity.population),capital:player.civilization.capitalCityId===newCity.id,districts:newCity.districts.map(d=>d.type),buildings:[],fortification:{level:'NONE',state:'INTACT'},foreignPresence:[],localCohesion:50,culturalAnchor:null,urbanActionsUsed:0,allocationRound:0,portBlockedUntil:0,portBlockedBy:null});
  state.core.version++;state.core.eventLog.push(founded.value);state.telemetry.citiesFounded++;
  player.civilization=refreshAdministration(player.civilization,state.core.config,state.core.map);
}

/** Transfer one city and its controlled territory while retaining the complete economic history. */
export function occupyCity(state:AlphaState,actor:PlayerId,cityId:CityId):void {
  const previous=state.core.players.find(p=>p.civilization.cities.some(c=>c.id===cityId))!;
  const recipient=state.core.players.find(p=>p.id===actor)!;
  if(previous.id===actor)throw new Error('A cidade já pertence à sua civilização.');
  const city=previous.civilization.cities.find(c=>c.id===cityId)!;
  const liberated=state.occupations.some(o=>o.cityId===cityId&&o.previousOwnerId===actor);
  previous.civilization.cities=previous.civilization.cities.filter(c=>c.id!==cityId);
  if(previous.civilization.capitalCityId===cityId)previous.civilization.capitalCityId=[...previous.civilization.cities].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)[0]?.id??null;
  city.ownerId=actor;city.stability=Math.max(0,city.stability-state.rules.occupationStabilityPenalty);
  recipient.civilization.cities.push(city);
  if(recipient.civilization.capitalCityId===null)recipient.civilization.capitalCityId=cityId;
  for(const tile of state.core.map)if(tile.controllerCityId===cityId)tile.ownerId=actor;
  // A capture may sever a path that previously crossed another city's controlled hexes.
  const centers=new Map(state.core.players.flatMap(p=>p.civilization.cities.map(c=>[c.id,state.core.map.find(t=>t.id===c.hexId)!] as const)));
  const disconnected=state.core.map.filter(t=>t.controllerCityId!==null&&!connectedTo(state.core.map,t,centers.get(t.controllerCityId)!));
  for(const tile of disconnected){tile.ownerId=null;tile.controllerCityId=null;tile.improvement=null;}
  for(const player of state.core.players)for(const ownCity of player.civilization.cities)ownCity.workedHexIds=ownCity.workedHexIds.filter(id=>!disconnected.some(t=>t.id===id));
  // Dependencies cannot silently retain permissions granted by a former owner.
  state.routes=state.routes.filter(r=>r.fromCityId!==cityId&&r.toCityId!==cityId);
  for(const work of state.legacyWorks)if(work.cityId===cityId)work.ownerId=actor;
  state.occupations=state.occupations.filter(o=>o.cityId!==cityId);
  if(!liberated){state.occupations.push({cityId,occupierId:actor,previousOwnerId:previous.id,sinceRound:state.core.round});state.telemetry.citiesCaptured++;}
  const meta=state.cities.find(c=>c.cityId===cityId);
  if(meta){
    const civilization=culturalIdentityOf(state,actor);
    meta.currentOwnerId=actor;meta.status=liberated?'OWNED':'OCCUPIED';meta.integration=liberated?100:0;
    // Autocracia (canon §16): a conquered city begins in Revolta (Integração already starts at 0).
    if(!liberated&&governmentEffects(state,actor).conqueredCityStartsInRevolt)meta.mood=Math.min(meta.mood,1);meta.capital=recipient.civilization.capitalCityId===cityId;
    meta.foreignPresence=meta.foreignPresence.filter(presence=>presence.civilizationId!==civilization);if(meta.culturalAnchor===civilization)meta.culturalAnchor=null;
  }
  refreshCulturalMetrics(state);
  state.core.version++;
  state.core.eventLog.push({type:'CITY_TRANSFERRED',version:state.core.version,round:state.core.round,cityId,playerId:actor,previousOwnerId:previous.id});
  for(const player of state.core.players)player.civilization=refreshAdministration(player.civilization,state.core.config,state.core.map);
}

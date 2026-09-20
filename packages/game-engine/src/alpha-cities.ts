import { CityIdSchema, connectedTo, type AlphaState, type CityId, type PlayerId } from '@aoh/game-domain';
import { refreshAdministration } from './civilization.js';
import { alphaPay, commitLegacyReducer } from './alpha-resources.js';
import { foundCityAt } from './founding.js';

export function settleWithPioneer(state:AlphaState,actor:PlayerId,unitId:string,name:string):void {
  const pioneer=state.units.find(u=>u.id===unitId&&u.ownerId===actor&&u.kind==='PIONEER');
  if(!pioneer)throw new Error('Escolha um Pioneiro próprio para fundar uma cidade.');
  if(state.players.find(p=>p.playerId===actor)!.orders.some(o=>('unitIds' in o&&o.unitIds.includes(unitId))||('unitId' in o&&o.unitId===unitId)))throw new Error('Cancele a ordem do Pioneiro antes de fundar a cidade.');
  const tile=state.core.map.find(t=>t.id===pioneer.hexId)!;
  if(tile.ownerId!==null&&tile.ownerId!==actor||state.units.some(u=>u.hexId===tile.id&&u.ownerId!==actor))throw new Error('Não é possível fundar em território ou presença estrangeira.');
  const player=state.core.players.find(p=>p.id===actor)!;
  const legacyBefore={...player.resources};
  const founded=foundCityAt(state.core,player,state.core.map,{type:'FOUND_CITY',playerId:actor,cityId:CityIdSchema.parse(`city-${actor}-${state.version}`),hexId:tile.id,name,expectedVersion:state.core.version},state.core.version+1);
  if(!founded.ok)throw new Error(founded.error.message);
  commitLegacyReducer(state,actor,legacyBefore);
  state.units=state.units.filter(u=>u.id!==unitId);
  const newCity=player.civilization.cities.find(c=>c.hexId===tile.id)!;
  state.cities.push({cityId:newCity.id,originalOwnerId:actor,currentOwnerId:actor,nativeIdentity:state.players.find(p=>p.playerId===actor)!.civilization??`native-${actor}`,status:'OWNED',integration:100,mood:3,level:'OUTPOST',capital:player.civilization.capitalCityId===newCity.id,districts:newCity.districts.map(d=>d.type),buildings:[],fortification:{level:'NONE',state:'INTACT'},foreignPresence:[],localCohesion:50,culturalAnchor:null,urbanActionsUsed:0});
  state.core.version++;state.core.eventLog.push(founded.value);
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
  for(const project of state.projects)if(project.cityId===cityId)project.ownerId=actor;
  const progress=state.players.find(p=>p.playerId===actor)!;
  progress.influencedCities=progress.influencedCities.filter(id=>id!==cityId);progress.foreignInfluence=progress.influencedCities.length;
  state.occupations=state.occupations.filter(o=>o.cityId!==cityId);
  if(!liberated)state.occupations.push({cityId,occupierId:actor,previousOwnerId:previous.id,sinceRound:state.core.round});
  const meta=state.cities.find(c=>c.cityId===cityId);
  if(meta){meta.currentOwnerId=actor;meta.status=liberated?'OWNED':'OCCUPIED';meta.integration=liberated?100:0;meta.capital=recipient.civilization.capitalCityId===cityId;}
  state.core.version++;
  state.core.eventLog.push({type:'CITY_TRANSFERRED',version:state.core.version,round:state.core.round,cityId,playerId:actor,previousOwnerId:previous.id});
  for(const player of state.core.players)player.civilization=refreshAdministration(player.civilization,state.core.config,state.core.map);
}

export function integrateCity(state:AlphaState,actor:PlayerId,cityId:CityId):void {
  const occupation=state.occupations.find(o=>o.cityId===cityId&&o.occupierId===actor);
  if(!occupation)throw new Error('Escolha uma cidade sob sua ocupação.');
  if(state.core.round<=occupation.sinceRound)throw new Error('A integração fica disponível na rodada seguinte à captura.');
  alphaPay(state,actor,state.rules.integrationCost);
  state.occupations=state.occupations.filter(o=>o.cityId!==cityId);
  const meta=state.cities.find(c=>c.cityId===cityId);
  if(meta){meta.status='OWNED';meta.integration=100;}
}

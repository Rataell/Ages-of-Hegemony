import { type AlphaCommand, type AlphaState, type PlayerId, type StrategicOrder } from '@aoh/game-domain';
import { alphaCanAfford, alphaGainLegacy, alphaPay } from './alpha-resources.js';
import { hexDistance, hexId, hexNeighbors } from './hex.js';
function enterWar(state:AlphaState,actor:PlayerId,target:PlayerId):void {
  if(atWar(state,actor,target))return;
  state.wars.push([actor,target].sort() as [PlayerId,PlayerId]);
  const player=state.players.find(p=>p.playerId===actor)!;
  for(const treaty of state.treaties)if(['ACTIVE','ACCEPTED'].includes(treaty.status)&&[treaty.proposerId,treaty.recipientId].includes(actor)&&[treaty.proposerId,treaty.recipientId].includes(target)){
    treaty.status='ENDED';player.prestige=Math.max(0,player.prestige-2);
  }
}
export function atWar(state:AlphaState,a:PlayerId,b:PlayerId):boolean {return state.wars.some(pair=>pair.includes(a)&&pair.includes(b));}
export function hasTreaty(state:AlphaState,a:PlayerId,b:PlayerId,type:AlphaState['treaties'][number]['type']):boolean {
  return state.treaties.some(t=>t.status==='ACTIVE'&&t.type===type&&[t.proposerId,t.recipientId].includes(a)&&[t.proposerId,t.recipientId].includes(b)&&t.expiresRound>=state.core.round);
}
export function bordersOpen(state:AlphaState,actor:PlayerId,owner:PlayerId|null):boolean {
  return owner===null||owner===actor||!atWar(state,actor,owner)&&(hasTreaty(state,actor,owner,'OPEN_BORDERS')||hasTreaty(state,actor,owner,'ALLIANCE'));
}
export function manageDiplomacy(state:AlphaState,actor:PlayerId,command:Extract<AlphaCommand,{type:'PROPOSE_TREATY'|'RESPOND_TREATY'|'END_TREATY'|'DECLARE_WAR'}>):void {
  const player=state.players.find(p=>p.playerId===actor)!;
  if(command.type==='PROPOSE_TREATY'||command.type==='DECLARE_WAR') {
    const target=command.type==='DECLARE_WAR'?command.targetId:command.recipientId;
    if(!player.contacts.includes(target)||target===actor)throw new Error('Estabeleça contato antes de negociar ou declarar guerra.');
    if(command.type==='DECLARE_WAR') {
      if(atWar(state,actor,target))throw new Error('As civilizações já estão em guerra.');
      // Only the original defender calls partners; no recursive alliance chain.
      const defenders=state.initiative.filter(id=>id!==actor&&id!==target&&(hasTreaty(state,target,id,'DEFENSIVE_PACT')||hasTreaty(state,target,id,'ALLIANCE')));
      enterWar(state,actor,target);
      for(const defender of defenders)enterWar(state,defender,actor);
      return;
    }
    if(state.treaties.some(t=>['PROPOSED','ACCEPTED','ACTIVE'].includes(t.status)&&t.type===command.treaty&&[t.proposerId,t.recipientId].includes(actor)&&[t.proposerId,t.recipientId].includes(target)))throw new Error('Já existe um acordo deste tipo em análise ou ativo.');
    state.treaties.push({id:`treaty-${actor}-${state.version}`,proposerId:actor,recipientId:target,type:command.treaty,status:'PROPOSED',deal:command.deal,createdRound:state.core.round,expiresRound:state.core.round+state.rules.treatyDuration});return;
  }
  const treaty=state.treaties.find(t=>t.id===command.treatyId);
  if(!treaty)throw new Error('Acordo desconhecido.');
  if(command.type==='RESPOND_TREATY') {
    if(treaty.recipientId!==actor||treaty.status!=='PROPOSED')throw new Error('Somente o destinatário pode responder a esta proposta.');
    treaty.status=command.accept?'ACCEPTED':'DECLINED';
  }else {
    if(![treaty.proposerId,treaty.recipientId].includes(actor))throw new Error('Você não participa deste acordo.');
    if(treaty.status==='ACTIVE')player.prestige=Math.max(0,player.prestige-2);treaty.status='ENDED';
  }
}
export function settleTreaties(state:AlphaState):void {
  const pending=state.treaties.filter(t=>t.status==='ACCEPTED').sort((a,b)=>state.initiative.indexOf(a.proposerId)-state.initiative.indexOf(b.proposerId)||(a.id<b.id?-1:1));
  for(const treaty of pending) {
    const a=state.core.players.find(p=>p.id===treaty.proposerId)!,b=state.core.players.find(p=>p.id===treaty.recipientId)!;
    if(!alphaCanAfford(state,a.id,treaty.deal.give)||!alphaCanAfford(state,b.id,treaty.deal.receive)){treaty.status='DECLINED';continue;}
    alphaPay(state,a.id,treaty.deal.give);alphaPay(state,b.id,treaty.deal.receive);
    alphaGainLegacy(state,a.id,treaty.deal.receive,{category:'trade'});alphaGainLegacy(state,b.id,treaty.deal.give,{category:'trade'});
    treaty.status='ACTIVE';
    if(['NON_AGGRESSION_PACT','ALLIANCE'].includes(treaty.type))state.wars=state.wars.filter(pair=>!pair.includes(a.id)||!pair.includes(b.id));
  }
}
export function tradePath(state:AlphaState,actor:PlayerId,fromCityId:string,toCityId:string) {
  const cities=state.core.players.flatMap(p=>p.civilization.cities);const from=cities.find(c=>c.id===fromCityId&&c.ownerId===actor),to=cities.find(c=>c.id===toCityId);
  if(!from||!to||from.id===to.id)throw new Error('Escolha duas cidades distintas e uma origem própria.');
  if(to.ownerId!==actor&&(!hasTreaty(state,actor,to.ownerId,'TRADE_AGREEMENT')||atWar(state,actor,to.ownerId)||hasTreaty(state,actor,to.ownerId,'EMBARGO')))throw new Error('Comércio internacional requer acordo ativo, paz e ausência de embargo.');
  const known=new Set(state.players.find(p=>p.playerId===actor)!.knownHexIds);const byId=new Map(state.core.map.map(t=>[t.id,t]));
  const queue=[[from.hexId]],seen=new Set([from.hexId]);
  for(let i=0;i<queue.length;i++) {
    const path=queue[i]!;const id=path.at(-1)!;if(id===to.hexId)return path;
    for(const point of hexNeighbors(byId.get(id)!)){const next=byId.get(hexId(point));if(next&&known.has(next.id)&&!seen.has(next.id)&&bordersOpen(state,actor,next.ownerId)){seen.add(next.id);queue.push([...path,next.id]);}}
  }
  throw new Error('Não há caminho conhecido com acesso permitido entre essas cidades.');
}
export function establishRoute(state:AlphaState,actor:PlayerId,order:Extract<StrategicOrder,{type:'TRADE'}>):void {
  if(state.routes.some(r=>r.ownerId===actor&&r.fromCityId===order.fromCityId&&r.toCityId===order.toCityId))throw new Error('Esta rota já existe.');
  state.routes.push({id:`route-${actor}-${state.version}-${state.routes.length}`,ownerId:actor,fromCityId:order.fromCityId,toCityId:order.toCityId,path:tradePath(state,actor,order.fromCityId,order.toCityId),suspended:false});
}
export function maintainTrade(state:AlphaState):void {
  state.treaties.forEach(t=>{if(t.expiresRound<state.core.round&&['ACTIVE','PROPOSED','ACCEPTED'].includes(t.status))t.status='ENDED';});
  for(const route of state.routes) {
    try{route.path=tradePath(state,route.ownerId,route.fromCityId,route.toCityId);route.suspended=false;}catch{route.suspended=true;continue;}

  }
}

export function validateInfluence(state:AlphaState,actor:PlayerId,order:Extract<StrategicOrder,{type:'INFLUENCE'}>):void {
  const player=state.players.find(p=>p.playerId===actor)!;
  const envoy=state.units.find(u=>u.id===order.unitId&&u.ownerId===actor&&u.kind==='ENVOY');
  const city=state.core.players.flatMap(p=>p.civilization.cities).find(c=>c.hexId===order.target&&c.ownerId!==actor);
  if(!envoy||!city||!player.knownHexIds.includes(order.target))throw new Error('Escolha um Emissário próprio junto a uma cidade estrangeira conhecida.');
  if(hexDistance(state.core.map.find(t=>t.id===envoy.hexId)!,state.core.map.find(t=>t.id===city.hexId)!)>1)throw new Error('O Emissário precisa estar na cidade ou em um hex adjacente.');
  if(atWar(state,actor,city.ownerId))throw new Error('Uma missão de influência requer paz.');
  if(player.influencedCities.includes(city.id))throw new Error('Sua civilização já mantém influência nesta cidade.');
}
export function resolveInfluence(state:AlphaState,actor:PlayerId,order:Extract<StrategicOrder,{type:'INFLUENCE'}>):void {
  validateInfluence(state,actor,order);
  const player=state.players.find(p=>p.playerId===actor)!;
  const city=state.core.players.flatMap(p=>p.civilization.cities).find(c=>c.hexId===order.target)!;
  player.influencedCities.push(city.id);player.foreignInfluence=player.influencedCities.length;
  if(!player.contacts.includes(city.ownerId))player.contacts.push(city.ownerId);
  const other=state.players.find(p=>p.playerId===city.ownerId)!;
  if(!other.contacts.includes(actor))other.contacts.push(actor);
}

import { AlphaEraSchema, type AlphaState, type AlphaUnit, type HexId, type PlayerId, type StrategicOrder } from '@aoh/game-domain';
import { hexDistance, hexNeighbors, hexId } from './hex.js';
import { alphaCanAfford, alphaCostWithMetal, alphaPay } from './alpha-resources.js';
import { institutionBonus } from './alpha-institutions.js';
import { atWar, enemyCityAt, movementOpen } from './alpha-diplomacy.js';
import { leaderSupplyBonus } from './alpha-leaders.js';
import { pendingArrivals, stackBlock } from './alpha-stack.js';
import { blockadedBy, isCarried, isPort, launchHex } from './alpha-naval.js';
import { kitMovement, kitSupplyBonus, kitUnitCost } from './alpha-kits.js';
import { mobilizationBlock } from './alpha-city.js';

/** Why a piece cannot be recruited in a city now, or null. Pure: used by the action and by the client preview. */
export function recruitBlock(state:AlphaState,actor:PlayerId,cityId:string,kind:AlphaUnit['kind']):string|null {
  const player=state.core.players.find(p=>p.id===actor)!;const progress=state.players.find(p=>p.playerId===actor)!;
  const city=player.civilization.cities.find(c=>c.id===cityId);
  if(!city||state.occupations.some(o=>o.cityId===cityId))return 'Recrute em uma cidade própria não ocupada.';
  const entry=state.rules.units[kind];const tile=state.core.map.find(t=>t.id===city.hexId)!;
  if(AlphaEraSchema.options.indexOf(progress.era)<AlphaEraSchema.options.indexOf(entry.era))return 'Sua civilização ainda não alcançou a era exigida.';
  if(entry.militaryInfrastructure&&!city.districts.some(d=>d.type==='MILITARY'))return 'Esta peça requer distrito Militar.';
  const naval=entry.domain==='SEA';
  if(naval&&!isPort(state,tile.id))return 'Navios precisam de uma cidade portuária: na Costa ou vizinha ao mar.';
  if(naval&&blockadedBy(state,tile.id,actor))return 'Porto bloqueado por uma frota inimiga.';
  // A full coastal port still answers with its stack count, so the player sees why.
  const spawn=naval?launchHex(state,actor,tile.id,kind)??(tile.terrain==='COAST'?city.hexId:null):city.hexId;
  if(!spawn)return 'Não há água livre junto ao porto para lançar a Frota.';
  if(state.units.filter(u=>u.ownerId===actor).length>=state.rules.unitLimit)return 'Reserva de unidades esgotada.';
  const arriving:AlphaUnit={id:`recruit-${cityId}`,ownerId:actor,kind,hexId:spawn,recruitedRound:state.core.round,carrierId:null};
  const crowded=stackBlock(state,actor,[arriving],spawn,pendingArrivals(state,actor,spawn,''));if(crowded)return crowded;
  const price=kitUnitCost(state,actor,kind);
  if(!alphaCanAfford(state,actor,alphaCostWithMetal(state,actor,price.cost,price.metal)))return 'Recursos insuficientes para esta ação.';
  return mobilizationBlock(state,cityId,kind);
}
export function recruitUnit(state:AlphaState,actor:PlayerId,cityId:string,kind:AlphaUnit['kind']):void {
  const blocked=recruitBlock(state,actor,cityId,kind);if(blocked)throw new Error(blocked);
  const city=state.core.players.find(p=>p.id===actor)!.civilization.cities.find(c=>c.id===cityId)!;const entry=state.rules.units[kind];
  const price=kitUnitCost(state,actor,kind);
  alphaPay(state,actor,alphaCostWithMetal(state,actor,price.cost,price.metal));
  const hexId=entry.domain==='SEA'?launchHex(state,actor,city.hexId,kind)!:city.hexId;
  state.units.push({id:`unit-${actor}-${state.version}-${state.units.length}`,ownerId:actor,kind,hexId,recruitedRound:state.core.round,carrierId:null});
}
export function canEnter(state:AlphaState,unit:AlphaUnit,target:HexId):boolean {
  const tile=state.core.map.find(t=>t.id===target);if(!tile)return false;
  return state.rules.units[unit.kind].domain==='SEA'?['COAST','SEA'].includes(tile.terrain):!['SEA','UNKNOWN'].includes(tile.terrain);
}
export function unitSupply(state:AlphaState,unit:AlphaUnit):{supplied:boolean;reason:string} {
  const player=state.core.players.find(p=>p.id===unit.ownerId)!;
  const tile=state.core.map.find(t=>t.id===unit.hexId)!;
  const cities=player.civilization.cities.filter(c=>!state.occupations.some(o=>o.cityId===c.id));
  if(cities.some(c=>hexDistance(state.core.map.find(t=>t.id===c.hexId)!,tile)<=state.rules.supplyRadius+leaderSupplyBonus(state,unit.ownerId)+kitSupplyBonus(state,unit)))return {supplied:true,reason:'Dentro do alcance de uma cidade própria.'};
  const byId=new Map(state.core.map.map(t=>[t.id,t]));const seen=new Set<HexId>();const queue=cities.map(c=>c.hexId);
  for(let i=0;i<queue.length;i++) {
    const id=queue[i]!;if(seen.has(id))continue;seen.add(id);if(id===unit.hexId)return {supplied:true,reason:'Conexão por território controlado e estradas.'};
    const current=byId.get(id)!;
    for(const point of hexNeighbors(current)){const next=byId.get(hexId(point));if(next&&!seen.has(next.id)&&(next.ownerId===unit.ownerId||(next.ownerId===null&&state.roads.includes(next.id))))queue.push(next.id);}
  }
  return {supplied:false,reason:'Sem cidade ao alcance ou conexão territorial de suprimento.'};
}
export function validateMilitaryOrder(state:AlphaState,actor:PlayerId,order:StrategicOrder):void {
  if(order.type!=='MOVE'&&order.type!=='ATTACK')throw new Error('Este resolvedor aceita movimento e ataque.');
  if(new Set(order.unitIds).size!==order.unitIds.length)throw new Error('Não repita peças na mesma ordem.');
  const units=order.unitIds.map(id=>state.units.find(u=>u.id===id&&u.ownerId===actor));
  if(units.some(u=>!u))throw new Error('A ordem contém uma peça que não pertence a você.');
  if(order.type==='MOVE'&&order.path.length>0&&units.some(unit=>unit!.hexId===order.path.at(-1)))throw new Error('O movimento deve terminar em outro hex.');
  if(order.type==='MOVE'&&units.some(unit=>isCarried(unit!)))throw new Error('Peça embarcada: desembarque ou ataque a partir da frota.');
  if(order.type==='ATTACK'&&units.some(unit=>isCarried(unit!))&&units.some(unit=>!isCarried(unit!)))throw new Error('Um ataque anfíbio parte só das peças embarcadas na mesma frota.');
  const progress=state.players.find(p=>p.playerId===actor)!;
  for(const piece of units) {
    const unit=piece!;let current=state.core.map.find(t=>t.id===unit.hexId)!;let cost=0;
    const path=order.type==='MOVE'?order.path:[order.target];
    for(const id of path) {
      const target=state.core.map.find(t=>t.id===id);
      if(!target||!progress.knownHexIds.includes(id)||hexDistance(current,target)!==1||!canEnter(state,unit,id))throw new Error('Caminho deve cruzar hexes conhecidos, adjacentes e compatíveis com a peça.');
      if(order.type==='MOVE'&&(!movementOpen(state,actor,target.ownerId)||enemyCityAt(state,actor,id)||state.units.some(u=>u.hexId===id&&u.ownerId!==actor)))throw new Error('Fronteira fechada, cidade inimiga ou presença de outra civilização: use uma ordem de conflito.');
      cost+=state.roads.includes(id)&&state.rules.units[unit.kind].domain==='LAND'?1:state.rules.movementCosts[target.terrain];current=target;
    }
    if(cost>state.rules.units[unit.kind].movement+institutionBonus(state,actor,'MOVEMENT')+kitMovement(state,actor,unit.kind))throw new Error('Caminho excede a mobilidade da peça.');
    if(order.type==='ATTACK'&&state.rules.units[unit.kind].strength===0)throw new Error('Esta peça não participa de ataques.');
  }
  if(order.type==='MOVE'&&order.path.length){const crowded=stackBlock(state,actor,units as AlphaUnit[],order.path.at(-1)!);if(crowded)throw new Error(crowded);}
  if(order.type==='ATTACK') {
    const enemies=state.units.filter(u=>u.hexId===order.target&&u.ownerId!==actor);
    const city=state.core.players.flatMap(p=>p.civilization.cities).find(c=>c.hexId===order.target&&c.ownerId!==actor);
    if(!enemies.length&&!city)throw new Error('Não há adversário conhecido nesse destino.');
    const defender=enemies[0]?.ownerId??city!.ownerId;
    // A declaration planned this round resolves in Diplomacy, before Conflicts, so the attack may be reserved with it.
    const declared=state.phase==='PLANNING'&&progress.plannedActions.some(action=>action.type==='DECLARE_WAR'&&action.targetId===defender);
    if(!atWar(state,actor,defender)&&!declared)throw new Error('Declare guerra antes de ordenar um ataque a outra civilização.');
    if(new Set(units.map(u=>u?.hexId)).size!==1)throw new Error('Uma força de ataque deve partir do mesmo hex.');
  }
}

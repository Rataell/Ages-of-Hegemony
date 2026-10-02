import { unassignedPopulation, type GameEvent, type GameRuleError, type GameState, type HexTile, type PlayerState, type TerritoryCommand } from '@aoh/game-domain';
import { err, ok, type Result } from '@aoh/shared';
import { hexDistance } from './hex.js';
import { payLegacyResources, type ResourcePayment } from './resources.js';

/** Shared founding rules. Callers authorize the site and own the mutable transaction copies. */
export function foundCityAt(state:GameState,player:PlayerState,map:HexTile[],command:Extract<TerritoryCommand,{type:'FOUND_CITY'}>,version:number,pay:ResourcePayment=payLegacyResources):Result<GameEvent,GameRuleError> {
  const tile=map.find(t=>t.id===command.hexId),rules=state.config.territory;
  if(!tile)return err({code:'UNKNOWN_HEX',message:'Unknown hex'});
  const cities=state.players.flatMap(p=>p.civilization.cities);
  if(cities.some(c=>c.id===command.cityId))return err({code:'DUPLICATE_CITY',message:'City ID already exists'});
  if(!rules.foundingTerrains.includes(tile.terrain)||cities.some(c=>c.hexId===tile.id||c.workedHexIds.includes(tile.id)))return err({code:'INVALID_CITY_SITE',message:'Site must be valid land, unoccupied and not currently worked'});
  if(cities.some(c=>{const center=map.find(t=>t.id===c.hexId);return center!==undefined&&hexDistance(center,tile)<rules.minimumCityDistance;}))return err({code:'CITY_TOO_CLOSE',message:'City is closer than minimumCityDistance'});
  if(!pay(player,rules.foundingCost))return err({code:'INSUFFICIENT_RESOURCES',message:'Cannot afford configured cost'});
  player.civilization.cities.push({id:command.cityId,ownerId:player.id,hexId:tile.id,name:command.name,population:rules.foundingPopulation,workers:unassignedPopulation(rules.foundingPopulation),stability:rules.foundingStability,development:1,specialization:null,growthProgress:0,foundedRound:state.round,workedHexIds:[],districts:[],buildings:[]});
  tile.ownerId=player.id;tile.controllerCityId=command.cityId;
  if(player.civilization.capitalCityId===null)player.civilization.capitalCityId=command.cityId;
  return ok({type:'CITY_FOUNDED',playerId:player.id,cityId:command.cityId,hexId:tile.id,name:command.name,cost:rules.foundingCost,round:state.round,version});
}

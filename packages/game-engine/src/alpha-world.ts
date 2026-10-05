import { liftLegacyCityCaps } from './alpha-turn.js';
import { layoutBoard, featureFits, REGION_TEMPLATES, leaderStateFor, rotatedRegionContent, CIVILIZATIONS, HexIdSchema, PlayerIdSchema, AlphaStateSchema, alphaRules, type AlphaState, type AlphaRules, type MapPreset, type PlayerId, type StrategicOrder, type TerrainFeature, type TerrainType } from '@aoh/game-domain';
import { createGame } from './engine.js';
import { migrateSnapshotV3ToV4 } from './alpha-migration.js';
import { hexDistance, hexNeighbors, hexId } from './hex.js';
import { initializeAlphaCards } from './alpha-cards.js';
import { alphaRandomInteger, combineAlphaSeed, deterministicAlphaSeed } from './alpha-random.js';
import { applyCivilizationHeritage, kitExplorationKnowledge, kitExplorationReach } from './alpha-kits.js';
import { alphaGainLegacy } from './alpha-resources.js';
import { applyDiscovery, generateDiscoveries } from './alpha-discoveries.js';
import { spawnThreat, threatIntent } from './alpha-threats.js';

export function createAlphaGame(input:{gameId:string;seed:number;privateSeed?:string;players:{id:string;name:string;civilization?:string}[];preset:AlphaRules['preset'];worldPreset?:MapPreset;actionsPerRound?:number;revealMap?:boolean}):AlphaState {
  if(input.privateSeed!==undefined&&!/^[a-f0-9]{64}$/.test(input.privateSeed))throw new Error('Invalid private alpha seed');
  const random:Pick<AlphaState,'privateRng'>={privateRng:{algorithm:'hmac-sha256-counter-v1',seed:input.privateSeed?combineAlphaSeed(input.seed,input.privateSeed):deterministicAlphaSeed(input.seed,input.gameId),counter:0}};
  const frontier=REGION_TEMPLATES.filter(r=>r.kind==='FRONTIER');
  for(let i=frontier.length-1;i>0;i--){const j=alphaRandomInteger(random,i+1);[frontier[i],frontier[j]]=[frontier[j]!,frontier[i]!];}
  // The footprint is generated first as a contiguous lattice of seven-hex Regions (domain alpha-topology): every hex of the board belongs
  // to exactly one Region and nothing inside the outer edge is empty. Six homeland Regions always exist; active seats take their slots first.
  const board=layoutBoard(input.players.length);
  const slotOf=new Map(board.homeSlots.map((id,slot)=>[id,slot]));
  const regions:AlphaState['regions']=[];const map:{id:string;q:number;r:number;terrain:TerrainType;features:string[]}[]=[];let index=0;
  for(const cell of board.cells){
    const slot=slotOf.get(cell.id);
    const template=slot!==undefined?REGION_TEMPLATES[slot]!:frontier[index++]!;
    const activeHome=slot!==undefined&&slot<input.players.length;
    regions.push({id:cell.id,templateId:template.id,hexIds:cell.hexes.map(hexId),rotation:0,revealedBy:activeHome?[PlayerIdSchema.parse(input.players[slot!]!.id)]:[]});
    const content=rotatedRegionContent(template,0);
    cell.hexes.forEach((p,i)=>{
      let terrain=content[i]!.terrain;const preset=input.worldPreset??'MIXED';
      if(preset==='CONTINENTAL'&&terrain==='SEA')terrain=(p.q+p.r+input.seed)%2===0?'PLAINS':'COAST';
      if(preset==='ARCHIPELAGO'&&!activeHome&&terrain!=='MOUNTAINS'&&(Math.abs(p.q*17+p.r*31+input.seed)%5)<2)terrain='SEA';
      if(preset==='INLAND_SEA'&&!activeHome&&cell.neighbors.length===6)terrain=i===0?'SEA':'COAST';
      const feature=content[i]!.feature;
      map.push({...p,id:hexId(p),terrain,features:[...(content[i]!.deposit&&holdsMetal(terrain)?['METAL']:[]),...(feature&&featureFits(feature,terrain)?[feature]:[])]});
    });
  }
  // Active homelands must be joined by land: open the cheapest chain of SEA hexes (0-1 search over the whole board) into COAST.
  const tiles=new Map(map.map(t=>[t.id as string,t]));
  const homeCentres=board.homeSlots.slice(0,input.players.length).map(id=>board.cells.find(cell=>cell.id===id)!.center);
  for(let k=1;k<homeCentres.length;k++){
    const goal=homeCentres[k]!, start=hexId(homeCentres[0]!) as string, target=hexId(goal) as string;
    const cost=new Map<string,number>([[start,0]]), from=new Map<string,string>(), deque=[start];
    while(deque.length){
      const at=deque.shift()!, here=tiles.get(at)!;
      for(const next of hexNeighbors(here).map(hexId)){
        const tile=tiles.get(next);if(!tile)continue;
        const step=tile.terrain==='SEA'?1:0,total=(cost.get(at)??0)+step;
        if(total<(cost.get(next)??Infinity)){cost.set(next,total);from.set(next,at);if(step===0)deque.unshift(next);else deque.push(next);}
      }
    }
    for(let at:string|undefined=target;at&&at!==start;at=from.get(at)){const tile=tiles.get(at)!;if(tile.terrain==='SEA')tile.terrain='COAST';}
  }
  // The capital stands on one of the six outer hexes of its Pátria (never the geometric centre), so the Region alone does not reveal it.
  const capitalHex=(slot:number):string=>{
    const cell=board.cells.find(c=>c.id===board.homeSlots[slot])!;
    const options=cell.hexes.slice(1).map(p=>tiles.get(hexId(p) as string)!).filter(t=>['PLAINS','FOREST','HILLS','COAST'].includes(t.terrain));
    const plains=options.filter(t=>t.terrain==='PLAINS'),pool=plains.length?plains:options;
    return pool[alphaRandomInteger(random,pool.length)]!.id;
  };
  const capitalSites=input.players.map((_,i)=>capitalHex(i));
  const created=createGame({gameId:input.gameId,seed:input.seed,map,
    players:input.players.map(p=>({id:p.id,name:p.name,resources:{food:16,materials:14,wealth:10,knowledge:8,influence:8}})),
    initialCities:input.players.map((p,i)=>({id:`capital-${i+1}`,ownerId:p.id,name:(CIVILIZATIONS.find(civ=>civ.id===p.civilization)??CIVILIZATIONS[i]!).capital,hexId:capitalSites[i]!,workers:{producers:1,artisans:0,merchants:0,scholars:1,soldiers:0,unassigned:0}}))});
  if(!created.ok)throw new Error(created.error.message);
  const migrated=migrateSnapshotV3ToV4(created.value);if(!migrated.ok)throw new Error(migrated.error.message);
  const state=migrated.value;state.rules=alphaRules(input.preset,input.worldPreset??'MIXED',input.actionsPerRound??5);state.rules.revealMap=input.revealMap??false;state.rulesVersion='v5.1b';liftLegacyCityCaps(state);state.regions=regions;state.privateRng=random.privateRng;state.telemetry.preset=state.rules.worldPreset;
  // Every civilization starts with `startingPioneers` Pioneiros: one can scout while another founds, so first contact does not wait on recruitment.
  state.players.forEach((p,i)=>{p.civilization=input.players[i]!.civilization??CIVILIZATIONS[i]!.id;p.leader=leaderStateFor(p.civilization);const center=state.core.players[i]!.civilization.cities[0]!.hexId;for(let k=0;k<state.rules.startingPioneers;k++)state.units.push({id:`pioneer-${i+1}-${k+1}`,ownerId:p.playerId,kind:'PIONEER',hexId:center,recruitedRound:1});const city=state.cities.find(city=>city.currentOwnerId===p.playerId)!;city.nativeIdentity=p.civilization;});
  const occupied=new Set(state.core.players.flatMap(player=>player.civilization.cities.map(city=>city.hexId)));
  const neutral=state.core.map.filter(tile=>!occupied.has(tile.id)&&!['SEA','UNKNOWN'].includes(tile.terrain)).sort((a,b)=>a.id.localeCompare(b.id));
  // Independent peoples sit in contested ground: about as far from a seat's capital as from its nearest rival's, at least
  // 3 hexes from any capital and 4 from each other. 
  const capitals=state.core.players.map(player=>state.core.map.find(tile=>tile.id===player.civilization.cities[0]!.hexId)!);
  const reach=(tile:{q:number;r:number})=>{const distances=capitals.map(capital=>hexDistance(capital,tile)).sort((a,b)=>a-b);return {near:distances[0]!,contest:(distances[1]??distances[0]!)-distances[0]!};};
  const land=neutral.filter(tile=>reach(tile).near>=3);
  const pick=(candidates:typeof land,count:number,taken:typeof land)=>{const chosen:typeof land=[];for(const tile of candidates){if(chosen.length===count)break;if([...taken,...chosen].every(other=>hexDistance(other,tile)>=4))chosen.push(tile);}return chosen;};
  const peoples=pick([...land].sort((a,b)=>reach(a).contest-reach(b).contest||reach(a).near-reach(b).near||a.id.localeCompare(b.id)),3,[]);
  state.independents=peoples.map((tile,index)=>({id:`independent-${index+1}`,hexId:tile.id,type:(['VILLAGE','TOWN','CITY_STATE'] as const)[index]!,attitude:'NEUTRAL',influenceByPlayer:{},protectorId:null,integratedBy:null}));
  // The two opening Acampamentos obey the same site rule as every later one (canon §21b: unclaimed, 3–5 hexes from a city, out of sight), not "as far as possible" (E-2).
  state.threats=[];for(let index=0;index<2;index++)spawnThreat(state,'CAMP');state.threats.forEach(threat=>{threat.fresh=false;});state.telemetry.threatsSpawned=0;
  applyCivilizationHeritage(state);initializeAlphaCards(state);generateDiscoveries(state);return AlphaStateSchema.parse(state);
}
export function visibleHexIds(state:AlphaState,actor:PlayerId):Set<string> {
  const player=state.core.players.find(p=>p.id===actor)!;
  const sources=[...player.civilization.cities.map(c=>c.hexId),...state.units.filter(u=>u.ownerId===actor).map(u=>u.hexId)];
  const byId=new Map(state.core.map.map(t=>[t.id,t]));
  return new Set(state.core.map.filter(t=>t.ownerId===actor||sources.some(id=>{const source=byId.get(id);return source&&hexDistance(source,t)<=1;})).map(t=>t.id));
}
export function refreshKnowledge(state:AlphaState):void {
  for(const player of state.players){
    const visible=visibleHexIds(state,player.playerId);
    player.knownHexIds=[...new Set([...player.knownHexIds,...visible])].map(id=>HexIdSchema.parse(id)).sort();
    for(const other of state.core.players)if(other.id!==player.playerId&&(other.civilization.cities.some(c=>visible.has(c.hexId))||state.units.some(u=>u.ownerId===other.id&&visible.has(u.hexId)))) {
      if(!player.contacts.includes(other.id))player.contacts.push(other.id);
      const opposite=state.players.find(p=>p.playerId===other.id)!;if(!opposite.contacts.includes(player.playerId))opposite.contacts.push(player.playerId);
    }
  }
}
/**
 * Only the first explorer of an untouched region chooses its orientation. Once anyone has revealed, claimed or entered it
 * the orientation is fixed and later explorers simply use it, so two explorers in the same round never conflict.
 */
export function regionOrientationFixed(state:AlphaState,region:AlphaState['regions'][number]):boolean {
  return region.revealedBy.length>0||region.hexIds.some(id=>state.core.map.find(t=>t.id===id)?.ownerId!==null||state.units.some(u=>u.hexId===id));
}
export function validateExploration(state:AlphaState,actor:PlayerId,order:Extract<StrategicOrder,{type:'EXPLORE'}>):void {
  const unit=state.units.find(u=>u.id===order.unitId&&u.ownerId===actor);const region=state.regions.find(r=>r.hexIds.includes(order.target));
  if(!unit||!region||region.revealedBy.includes(actor))throw new Error('Escolha uma peça própria junto a uma região ainda não explorada.');
  const origin=state.core.map.find(t=>t.id===unit.hexId)!;
  const reach=kitExplorationReach(state,unit);
  if(!region.hexIds.some(id=>{const tile=state.core.map.find(t=>t.id===id)!;return hexDistance(origin,tile)<=reach;}))throw new Error('A região não está na fronteira desta peça.');
  if(!regionOrientationFixed(state,region)&&order.rotation!==region.rotation){
    const observed=new Set(state.players.flatMap(p=>[...p.knownHexIds,...visibleHexIds(state,p.playerId)]));
    const rotated=rotatedRegionTiles(state,region,order.rotation);
    const changesKnownTerrain=region.hexIds.some((id,i)=>{const tile=state.core.map.find(t=>t.id===id)!;return observed.has(id)&&(tile.terrain!==rotated[i]!.terrain||tile.features.join()!==rotated[i]!.features.join());});
    if(changesKnownTerrain)throw new Error('A orientação não pode alterar terrenos já conhecidos.');
  }
}
const holdsMetal=(terrain:TerrainType)=>terrain==='HILLS'||terrain==='MOUNTAINS';
/**
 * The region's tiles after turning it from its current rotation to `rotation`. Terrain and the metal deposit come from the
 * same rotated template position. World-preset and contact-corridor overrides were generated before fog reveal and stay
 * where they are; the deposit follows the creation rule (only on hills or mountains).
 */
export function rotatedRegionTiles(state:AlphaState,region:AlphaState['regions'][number],rotation:number):{terrain:TerrainType;features:TerrainFeature[]}[] {
  const template=REGION_TEMPLATES.find(r=>r.id===region.templateId)!;
  const before=rotatedRegionContent(template,region.rotation),after=rotatedRegionContent(template,rotation);
  return region.hexIds.map((id,i)=>{
    const tile=state.core.map.find(t=>t.id===id)!;
    const terrain=tile.terrain===before[i]!.terrain?after[i]!.terrain:tile.terrain;
    const authored=new Set<string>(['METAL','FISH','TIMBER','FERTILE','STONE']),feature=after[i]!.feature;
    return {terrain,features:[...tile.features.filter(item=>!authored.has(item)),...(after[i]!.deposit&&holdsMetal(terrain)?['METAL' as const]:[]),...(feature&&featureFits(feature,terrain)?[feature]:[])]};
  });
}
export function exploreRegion(state:AlphaState,actor:PlayerId,order:Extract<StrategicOrder,{type:'EXPLORE'}>):void {
  validateExploration(state,actor,order);const region=state.regions.find(r=>r.hexIds.includes(order.target))!;
  const fixed=regionOrientationFixed(state,region),rotation=fixed?region.rotation:order.rotation;
  if(!fixed){
    const rotated=rotatedRegionTiles(state,region,rotation);
    region.hexIds.forEach((id,i)=>{const tile=state.core.map.find(t=>t.id===id)!;tile.terrain=rotated[i]!.terrain;tile.features=rotated[i]!.features;});
  }
  region.rotation=rotation;region.revealedBy.push(actor);
  const player=state.players.find(p=>p.playerId===actor)!;player.knownHexIds=[...new Set([...player.knownHexIds,...region.hexIds])].sort();player.exploredRegions++;player.prestige++;
  const knowledge=kitExplorationKnowledge(state,actor,region.hexIds);if(knowledge)alphaGainLegacy(state,actor,{knowledge});
  applyDiscovery(state,actor,region,order.unitId);
}

/**
 * Threats move every round, so only those inside current vision are shown; a remembered hex would leak a live position.
 * The intention (target, next hex, distance) is public information decided by the engine, but never reaches past the fog:
 * the target and its distance only when the target hex is in the viewer's vision, the next hex only when it is.
 */
export function threatView(state:AlphaState,actor:PlayerId){
  const visible=visibleHexIds(state,actor),all=state.rules.revealMap;
  return state.threats.filter(threat=>visible.has(threat.hexId)||all).map(threat=>{
    const intent=threatIntent(state,threat),known=intent.targetHexId!==null&&(all||visible.has(intent.targetHexId));
    return {id:threat.id,kind:threat.kind,hexId:threat.hexId,level:threat.level,status:threat.status,composition:threat.composition,fresh:threat.fresh,
      intent:{state:intent.state,targetKind:intent.targetKind,targetKnown:known,targetId:known?intent.targetId:null,targetHexId:known?intent.targetHexId:null,distance:known?intent.distance:null,nextHexId:intent.nextHexId!==null&&(all||visible.has(intent.nextHexId))?intent.nextHexId:null}};
  });
}

/** The seat whose homeland (Pátria) a Region is, from its template: seat k always holds `homeland-(k+1)`. Public: it only says who sits where. */
export function homeOfRegion(state:AlphaState,region:AlphaState['regions'][number]):PlayerId|null {
  const match=/^homeland-(\d+)$/.exec(region.templateId);
  return match?state.players[Number(match[1])-1]?.playerId??null:null;
}
/**
 * Layer A of the fog (public board topology): the whole footprint, its Regions and their adjacency, which Regions are still face down FOR THIS
 * VIEWER, and whose Pátria each one is. It never carries terrain, features, deposits, discoveries, units or the capital's hex: those are
 * layers B (memory: knownTerritory) and C (current vision), both decided by `visibleHexIds` and what the viewer explored.
 */
export function boardView(state:AlphaState,actor:PlayerId){
  const owner=new Map<string,string>();for(const region of state.regions)for(const id of region.hexIds)owner.set(id,region.id);
  return state.regions.map(region=>{
    const next=new Set<string>();
    for(const id of region.hexIds){const [q,r]=id.split(',').map(Number) as [number,number];for(const point of hexNeighbors({q,r})){const other=owner.get(hexId(point));if(other&&other!==region.id)next.add(other);}}
    return {id:region.id,hexIds:region.hexIds,neighbors:[...next].sort(),closed:!region.revealedBy.includes(actor),homeOf:homeOfRegion(state,region)};
  });
}

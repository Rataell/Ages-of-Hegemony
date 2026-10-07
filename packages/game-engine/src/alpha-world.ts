import { liftLegacyCityCaps } from './alpha-turn.js';
import { layoutBoard, HOME_SLOTS, MAP_FOOTPRINT, featureFits, REGION_TEMPLATES, leaderStateFor, rotatedRegionContent, CIVILIZATIONS, HexIdSchema, PlayerIdSchema, AlphaStateSchema, alphaRules, type AlphaState, type AlphaUnit, type AlphaRules, type MapPreset, type MapSize, type PlayerId, type StrategicOrder, type TerrainFeature, type TerrainType } from '@aoh/game-domain';
import { createGame } from './engine.js';
import { presetTerrain, worldShape } from './alpha-presets.js';
import { isLandTerrain, isNavigableTerrain } from './alpha-water.js';
import { alphaEvent } from './alpha-events.js';
import { migrateSnapshotV3ToV4 } from './alpha-migration.js';
import { hexDistance, hexNeighbors, hexId } from './hex.js';
import { initializeAlphaCards } from './alpha-cards.js';
import { alphaRandomInteger, combineAlphaSeed, deterministicAlphaSeed } from './alpha-random.js';
import { applyCivilizationHeritage, kitExplorationKnowledge } from './alpha-kits.js';
import { alphaGainLegacy } from './alpha-resources.js';
import { applyDiscovery, generateDiscoveries } from './alpha-discoveries.js';
import { spawnThreat, threatIntent } from './alpha-threats.js';

export function createAlphaGame(input:{gameId:string;seed:number;privateSeed?:string;players:{id:string;name:string;civilization?:string;figureId?:string|null|undefined}[];preset:AlphaRules['preset'];worldPreset?:MapPreset;mapSize?:MapSize;actionsPerRound?:number;revealMap?:boolean;startingPioneers?:number}):AlphaState {
  if(input.privateSeed!==undefined&&!/^[a-f0-9]{64}$/.test(input.privateSeed))throw new Error('Invalid private alpha seed');
  const random:Pick<AlphaState,'privateRng'>={privateRng:{algorithm:'hmac-sha256-counter-v1',seed:input.privateSeed?combineAlphaSeed(input.seed,input.privateSeed):deterministicAlphaSeed(input.seed,input.gameId),counter:0}};
  const mapSizeIn:MapSize=input.mapSize??'STANDARD';
  const allFrontier=REGION_TEMPLATES.filter(r=>r.kind==='FRONTIER');
  // Padrão and Compacto keep the original 24-template shuffle (same RNG draws, same seeded maps); only Amplo needs the extra 13.
  const frontier=MAP_FOOTPRINT[mapSizeIn].regions-HOME_SLOTS<=24?allFrontier.slice(0,24):allFrontier;
  for(let i=frontier.length-1;i>0;i--){const j=alphaRandomInteger(random,i+1);[frontier[i],frontier[j]]=[frontier[j]!,frontier[i]!];}
  // The footprint is generated first as a contiguous lattice of seven-hex Regions (domain alpha-topology): every hex of the board belongs
  // to exactly one Region and nothing inside the outer edge is empty. Six homeland Regions always exist; active seats take their slots first.
  const mapSize:MapSize=input.mapSize??'STANDARD';
  const board=layoutBoard(input.players.length,input.seed,mapSize);
  if(frontier.length<board.cells.length-HOME_SLOTS)throw new Error('Not enough frontier Region templates for this footprint');
  const slotOf=new Map(board.homeSlots.map((id,slot)=>[id,slot]));
  const regions:AlphaState['regions']=[];const map:{id:string;q:number;r:number;terrain:TerrainType;features:string[]}[]=[];let index=0;
  const picked=board.cells.map(cell=>{const slot=slotOf.get(cell.id);return {cell,slot,template:slot!==undefined?REGION_TEMPLATES[slot]!:frontier[index++]!};});
  const shape=worldShape(input.worldPreset??'MIXED',input.seed,picked.map(({cell,template})=>({id:cell.id,templateId:template.id,hexIds:cell.hexes.map(hexId)})),input.players.length);
  for(const {cell,slot,template} of picked){
    const activeHome=slot!==undefined&&slot<input.players.length;
    regions.push({id:cell.id,templateId:template.id,hexIds:cell.hexes.map(hexId),rotation:0,revealedBy:activeHome?[PlayerIdSchema.parse(input.players[slot!]!.id)]:[]});
    const content=rotatedRegionContent(template,0);
    cell.hexes.forEach((p,i)=>{
      const terrain=presetTerrain(shape,cell.id,hexId(p),content[i]!);
      const feature=content[i]!.feature;
      map.push({...p,id:hexId(p),terrain,features:[...(content[i]!.deposit&&holdsMetal(terrain)?['METAL']:[]),...(feature&&featureFits(feature,terrain)?[feature]:[])]});
    });
  }
  const tiles=new Map(map.map(t=>[t.id as string,t]));
  // The capital is a real hex of its Pátria. The Pátria is public, so nothing about its position is hidden or bent for privacy: the centre when its terrain
  // can hold a city (it always does in the authored homelands), otherwise a seeded pick among the outer hexes that can, plains first.
  const capitalHex=(slot:number):string=>{
    const cell=board.cells.find(c=>c.id===board.homeSlots[slot])!;
    const eligible=(t:{terrain:TerrainType})=>['PLAINS','FOREST','HILLS','COAST'].includes(t.terrain);
    const centre=tiles.get(hexId(cell.hexes[0]!) as string)!;
    if(eligible(centre))return centre.id;
    const options=cell.hexes.slice(1).map(p=>tiles.get(hexId(p) as string)!).filter(eligible);
    const plains=options.filter(t=>t.terrain==='PLAINS'),pool=plains.length?plains:options;
    return pool[alphaRandomInteger(random,pool.length)]!.id;
  };
  const capitalSites=input.players.map((_,i)=>capitalHex(i));
  const created=createGame({gameId:input.gameId,seed:input.seed,map,
    players:input.players.map(p=>({id:p.id,name:p.name,resources:{food:16,materials:14,wealth:10,knowledge:8,influence:8}})),
    initialCities:input.players.map((p,i)=>({id:`capital-${i+1}`,ownerId:p.id,name:(CIVILIZATIONS.find(civ=>civ.id===p.civilization)??CIVILIZATIONS[i]!).capital,hexId:capitalSites[i]!,workers:{producers:1,artisans:0,merchants:0,scholars:1,soldiers:0,unassigned:0}}))});
  if(!created.ok)throw new Error(created.error.message);
  const migrated=migrateSnapshotV3ToV4(created.value);if(!migrated.ok)throw new Error(migrated.error.message);
  const state=migrated.value;state.rules=alphaRules(input.preset,input.worldPreset??'MIXED',input.actionsPerRound??5);state.rules.revealMap=input.revealMap??false;state.rules.mapSize=mapSize;if(input.startingPioneers!==undefined)state.rules.startingPioneers=input.startingPioneers;state.rulesVersion='v5.1b';liftLegacyCityCaps(state);state.regions=regions;state.privateRng=random.privateRng;state.telemetry.preset=state.rules.worldPreset;
  // Every civilization starts with `startingPioneers` Pioneiros: one can scout while another founds, so first contact does not wait on recruitment.
  state.players.forEach((p,i)=>{p.civilization=input.players[i]!.civilization??CIVILIZATIONS[i]!.id;p.leader=leaderStateFor(p.civilization,input.players[i]!.figureId);if(p.leader===null)throw new Error('Figura inválida para esta civilização.');const center=state.core.players[i]!.civilization.cities[0]!.hexId;for(let k=0;k<state.rules.startingPioneers;k++)state.units.push({id:`pioneer-${i+1}-${k+1}`,ownerId:p.playerId,kind:'PIONEER',hexId:center,recruitedRound:1});const city=state.cities.find(city=>city.currentOwnerId===p.playerId)!;city.nativeIdentity=p.civilization;});
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
  applyCivilizationHeritage(state);initializeAlphaCards(state);generateDiscoveries(state);refreshKnowledge(state);return AlphaStateSchema.parse(state);
}
/**
 * SHARED TABLE (canon 2026-10-05): the board is public, planning is private. A Region is "open" once anyone other than its own seat has
 * revealed it (or, for a frontier Region, once anyone has): its terrain, cities, roads, walls and pieces then belong to the whole table.
 * Every Pátria is open and public from the first snapshot; only the frontier Regions start face down.
 */
export const HOMELANDS_PUBLIC=true;
export function regionIsPublic(state:AlphaState,region:AlphaState['regions'][number]):boolean {
  const home=homeOfRegion(state,region);
  return region.revealedBy.some(id=>id!==home)||(HOMELANDS_PUBLIC&&region.revealedBy.length>0);
}
export const regionOpenFor=(state:AlphaState,region:AlphaState['regions'][number],actor:PlayerId):boolean=>regionIsPublic(state,region)||homeOfRegion(state,region)===actor||region.revealedBy.includes(actor);
/** Every hex the actor sees: the whole open Regions (shared with the table), hexes outside any Region (old saves), and the actor's own territory and pieces. No radius of vision. */
export function visibleHexIds(state:AlphaState,actor:PlayerId):Set<string> {
  const out=new Set<string>(),inRegion=new Set<string>();
  for(const region of state.regions){for(const id of region.hexIds)inRegion.add(id);if(regionOpenFor(state,region,actor))for(const id of region.hexIds)out.add(id);}
  for(const tile of state.core.map)if(!inRegion.has(tile.id)||tile.ownerId===actor)out.add(tile.id);
  for(const unit of state.units)if(unit.ownerId===actor)out.add(unit.hexId);
  for(const owner of state.core.players)if(owner.id===actor)for(const city of owner.civilization.cities)out.add(city.hexId);
  return out;
}
/**
 * Table visibility is NOT civilization contact. Seeing a Pátria, a capital or a piece creates no diplomatic Contato: contact needs proximity (a city or piece
 * of one civilization within one hex of a city, piece or owned hex of the other) or an influence mission (alpha-diplomacy). Terrain knowledge is the open Regions.
 */
export function refreshKnowledge(state:AlphaState):void {
  const tiles=new Map(state.core.map.map(t=>[t.id as string,t]));
  const piecesOf=(id:PlayerId)=>[...state.core.players.find(p=>p.id===id)!.civilization.cities.map(c=>c.hexId as string),...state.units.filter(u=>u.ownerId===id&&!u.carrierId).map(u=>u.hexId as string)];
  for(const player of state.players){
    player.knownHexIds=[...visibleHexIds(state,player.playerId)].map(id=>HexIdSchema.parse(id)).sort();
    const mine=piecesOf(player.playerId).map(id=>tiles.get(id)!).filter(Boolean);
    for(const other of state.core.players){
      if(other.id===player.playerId)continue;
      const theirs=piecesOf(other.id).map(id=>tiles.get(id)!).filter(Boolean);
      const close=theirs.some(t=>t.ownerId===player.playerId||mine.some(m=>hexDistance(m,t)<=1))||mine.some(m=>m.ownerId===other.id);
      if(!close)continue;
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
/** Who may explore: Pioneiros on land, Frotas (and the coastal vessel) on water. Military land pieces never explore. */
export type ExplorerRole='LAND'|'NAVAL';
export function explorerRole(state:AlphaState,unit:AlphaUnit):ExplorerRole|null {
  if(unit.carrierId)return null;
  if(unit.kind==='PIONEER')return 'LAND';
  const domain=state.rules.units[unit.kind].domain;
  return (unit.kind==='FLEET'||unit.kind==='COASTAL_VESSEL')&&domain!=='LAND'?'NAVAL':null;
}
export const EXPLORE_NEEDS_NAVAL='Requer acesso naval.';
export const EXPLORE_NEEDS_LAND='Requer acesso por terra.';
export interface ExplorationAccess {
  /** Orientations (sixth-turns) under which the piece can enter the Region; the single one when the orientation is already fixed. */
  rotations:number[];
  /** Why the Region cannot be explored by this piece at all (no orientation gives it a way in); null when it can. */
  block:string|null;
}
/**
 * Entry rule. A Pioneiro walks in, so at least one Region hex within its reach must be LAND (plains, forest, hills, mountains or coast) once the
 * Region is turned; a Frota sails in, so one must be navigable water (coast or sea) by the same canonical truth the naval rules use. Orientations that
 * would change terrain somebody already knows are excluded. With one orientation left it is applied automatically; with several the explorer chooses;
 * with none the piece cannot do it ("Requer acesso naval." for land, the mirror for fleets).
 */
export function explorationAccess(state:AlphaState,unit:AlphaUnit,region:AlphaState['regions'][number]):ExplorationAccess {
  const role=explorerRole(state,unit),blocked=role==='NAVAL'?EXPLORE_NEEDS_LAND:EXPLORE_NEEDS_NAVAL;
  if(role===null)return {rotations:[],block:'Esta peça não explora.'};
  // A seat-redacted copy (bots) hides the Region template: the caller reads the real match for this answer, here nothing can be computed.
  if(!REGION_TEMPLATES.some(t=>t.id===region.templateId))return {rotations:[0],block:null};
  const origin=state.core.map.find(t=>t.id===unit.hexId)!,reach=1,enters=role==='LAND'?isLandTerrain:isNavigableTerrain;
  const entry=region.hexIds.map((id,i)=>({id,i,tile:state.core.map.find(t=>t.id===id)!})).filter(x=>hexDistance(origin,x.tile)<=reach);
  if(!entry.length)return {rotations:[],block:'A região não está na fronteira desta peça.'};
  if(regionOrientationFixed(state,region)){
    const ok=entry.some(x=>enters(x.tile.terrain));
    return {rotations:ok?[region.rotation]:[],block:ok?null:blocked};
  }
  const observed=new Set(state.players.flatMap(p=>[...p.knownHexIds,...visibleHexIds(state,p.playerId)]));
  const rotations=[0,1,2,3,4,5].filter(rotation=>{
    const tiles=rotatedRegionTiles(state,region,rotation);
    const keepsKnown=region.hexIds.every((id,i)=>{if(!observed.has(id))return true;const tile=state.core.map.find(t=>t.id===id)!;return tile.terrain===tiles[i]!.terrain&&tile.features.join()===tiles[i]!.features.join();});
    return keepsKnown&&entry.some(x=>enters(tiles[x.i]!.terrain));
  });
  return {rotations,block:rotations.length?null:blocked};
}
export function validateExploration(state:AlphaState,actor:PlayerId,order:Extract<StrategicOrder,{type:'EXPLORE'}>):void {
  const unit=state.units.find(u=>u.id===order.unitId&&u.ownerId===actor);const region=state.regions.find(r=>r.hexIds.includes(order.target));
  if(!unit||!region||regionOpenFor(state,region,actor))throw new Error('Escolha uma peça própria junto a uma região ainda não explorada.');
  if(explorerRole(state,unit)===null)throw new Error('Somente Pioneiros e Frotas exploram.');
  const access=explorationAccess(state,unit,region);
  if(access.block!==null)throw new Error(access.block);
  if(!regionOrientationFixed(state,region)&&access.rotations.length>1&&!access.rotations.includes(order.rotation))throw new Error('Essa orientação não dá acesso à região.');
}
const holdsMetal=(terrain:TerrainType)=>terrain==='HILLS'||terrain==='MOUNTAINS';
/**
 * The region's tiles after turning it from its current rotation to `rotation`. Terrain and the metal deposit come from the
 * same rotated template position, then the world preset (alpha-presets) is applied to that hex again, so turning a Region
 * never undoes the shape of the world; the deposit follows the creation rule (only on hills or mountains).
 */
export function rotatedRegionTiles(state:AlphaState,region:AlphaState['regions'][number],rotation:number):{terrain:TerrainType;features:TerrainFeature[]}[] {
  const template=REGION_TEMPLATES.find(r=>r.id===region.templateId)!;
  const after=rotatedRegionContent(template,rotation);
  const shape=worldShape(state.rules.worldPreset,state.telemetry.seed,state.regions,state.players.length);
  return region.hexIds.map((id,i)=>{
    const tile=state.core.map.find(t=>t.id===id)!;
    const terrain=presetTerrain(shape,region.id,id,after[i]!);
    const authored=new Set<string>(['METAL','FISH','TIMBER','FERTILE','STONE']),feature=after[i]!.feature;
    return {terrain,features:[...tile.features.filter(item=>!authored.has(item)),...(after[i]!.deposit&&holdsMetal(terrain)?['METAL' as const]:[]),...(feature&&featureFits(feature,terrain)?[feature]:[])]};
  });
}
/**
 * Flips a Region face up under `rotation` for `actor`: terrain and deposits are written, the Region is marked revealed, knowledge and the reveal reward
 * are credited. The Discovery (applyDiscovery) is a separate step because only the first revealer resolves it. Shared by the legacy EXPLORE resolver
 * and by a MOVE that enters the unknown (alpha-frontier).
 */
export function revealRegion(state:AlphaState,actor:PlayerId,region:AlphaState['regions'][number],rotation:number):void {
  const fixed=regionOrientationFixed(state,region);
  if(!fixed){
    const rotated=rotatedRegionTiles(state,region,rotation);
    region.hexIds.forEach((id,i)=>{const tile=state.core.map.find(t=>t.id===id)!;tile.terrain=rotated[i]!.terrain;tile.features=rotated[i]!.features;});
  }
  if(!fixed)region.rotation=rotation;
  if(!region.revealedBy.includes(actor))region.revealedBy.push(actor);
  const player=state.players.find(p=>p.playerId===actor)!;player.knownHexIds=[...new Set([...player.knownHexIds,...region.hexIds])].sort();player.exploredRegions++;player.prestige++;
  const knowledge=kitExplorationKnowledge(state,actor,region.hexIds);if(knowledge)alphaGainLegacy(state,actor,{knowledge});
  refreshKnowledge(state);
  const template=REGION_TEMPLATES.find(t=>t.id===region.templateId);
  alphaEvent(state,'REGION_REVEALED',`${state.core.players.find(p=>p.id===actor)?.name??'Uma civilização'} revelou ${template?.name??'uma Região'}.`,null);
}
/** LEGACY (V1.1 and rooms planned before the Move+Discovery rule): a separate EXPLORE order. New clients and bots never create one; the resolver stays so old plans still resolve. */
export function exploreRegion(state:AlphaState,actor:PlayerId,order:Extract<StrategicOrder,{type:'EXPLORE'}>):void {
  // Orders are planned in secret and resolved in turn: if an earlier order already flipped this Region, the table has it and this one only notes that.
  const already=state.regions.find(r=>r.hexIds.includes(order.target));
  if(already&&state.units.some(u=>u.id===order.unitId&&u.ownerId===actor)&&regionOpenFor(state,already,actor)){alphaEvent(state,'REGION_ALREADY_OPEN','A Região já tinha sido revelada por outra civilização.',[actor]);return;}
  validateExploration(state,actor,order);const region=state.regions.find(r=>r.hexIds.includes(order.target))!;
  const fixed=regionOrientationFixed(state,region),access=explorationAccess(state,state.units.find(u=>u.id===order.unitId)!,region),rotation=fixed?region.rotation:access.rotations.length===1?access.rotations[0]!:order.rotation;
  revealRegion(state,actor,region,rotation);
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
    return {id:region.id,hexIds:region.hexIds,neighbors:[...next].sort(),closed:!regionOpenFor(state,region,actor),homeOf:homeOfRegion(state,region)};
  });
}

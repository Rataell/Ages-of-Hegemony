import { featureFits, REGION_TEMPLATES, leaderStateFor, rotatedRegionContent, CIVILIZATIONS, HexIdSchema, PlayerIdSchema, AlphaStateSchema, alphaRules, type AlphaState, type AlphaRules, type MapPreset, type PlayerId, type StrategicOrder, type TerrainFeature, type TerrainType } from '@aoh/game-domain';
import { createGame } from './engine.js';
import { migrateSnapshotV3ToV4 } from './alpha-migration.js';
import { hexDistance, hexNeighbors, hexId } from './hex.js';
import { initializeAlphaCards } from './alpha-cards.js';
import { alphaRandomInteger, combineAlphaSeed, deterministicAlphaSeed } from './alpha-random.js';
import { alphaEvent } from './alpha-events.js';
import { applyCivilizationHeritage, kitExplorationKnowledge, kitExplorationReach } from './alpha-kits.js';
import { alphaGainLegacy } from './alpha-resources.js';

export function createAlphaGame(input:{gameId:string;seed:number;privateSeed?:string;players:{id:string;name:string;civilization?:string}[];preset:AlphaRules['preset'];worldPreset?:MapPreset;actionsPerRound?:number}):AlphaState {
  if(input.privateSeed!==undefined&&!/^[a-f0-9]{64}$/.test(input.privateSeed))throw new Error('Invalid private alpha seed');
  const random:Pick<AlphaState,'privateRng'>={privateRng:{algorithm:'hmac-sha256-counter-v1',seed:input.privateSeed?combineAlphaSeed(input.seed,input.privateSeed):deterministicAlphaSeed(input.seed,input.gameId),counter:0}};
  const frontier=REGION_TEMPLATES.filter(r=>r.kind==='FRONTIER');
  for(let i=frontier.length-1;i>0;i--){const j=alphaRandomInteger(random,i+1);[frontier[i],frontier[j]]=[frontier[j]!,frontier[i]!];}
  // Six authored homeland regions always remain on the board. Active seats take the compact positions first so
  // diplomacy and conflict become reachable during QUICK games; unused homelands stay dormant map variety.
  const homeLayouts={
    2:[[1,2],[4,2],[0,0],[5,0],[0,4],[5,4]],
    3:[[1,1],[4,1],[2,3],[0,0],[5,4],[0,4]],
    4:[[1,1],[4,1],[1,3],[4,3],[0,0],[5,4]],
    5:[[1,1],[3,1],[5,1],[1,3],[4,3],[0,0]],
    6:[[1,1],[3,1],[5,1],[1,3],[3,3],[5,3]],
  } as const;
  const homes=homeLayouts[input.players.length as keyof typeof homeLayouts];
  const regions:AlphaState['regions']=[];const map:{id:string;q:number;r:number;terrain:TerrainType;features:string[]}[]=[];let index=0;
  for(let r=0;r<5;r++)for(let q=0;q<6;q++) {
    const home=homes.findIndex(([hq,hr])=>hq===q&&hr===r);
    const template=home>=0?REGION_TEMPLATES[home]!:frontier[index++]!;
    const activeHome=home>=0&&home<input.players.length;
    const center={q:q*3,r:r*3};const points=[center,...hexNeighbors(center)];
    regions.push({id:`region-${q}-${r}`,templateId:template.id,hexIds:points.map(hexId),rotation:0,revealedBy:home>=0&&home<input.players.length?[PlayerIdSchema.parse(input.players[home]!.id)]:[]});
    const content=rotatedRegionContent(template,0);
    points.forEach((p,i)=>{
      let terrain=content[i]!.terrain;const preset=input.worldPreset??'MIXED';
      if(preset==='CONTINENTAL'&&terrain==='SEA')terrain=(p.q+p.r+input.seed)%2===0?'PLAINS':'COAST';
      if(preset==='ARCHIPELAGO'&&!activeHome&&terrain!=='MOUNTAINS'&&(Math.abs(p.q*17+p.r*31+input.seed)%5)<2)terrain='SEA';
      if(preset==='INLAND_SEA'&&!activeHome&&q>=2&&q<=3&&r>=1&&r<=3)terrain=i===0?'SEA':'COAST';
      const feature=content[i]!.feature;
      map.push({...p,id:hexId(p),terrain,features:[...(content[i]!.deposit&&holdsMetal(terrain)?['METAL']:[]),...(feature&&featureFits(feature,terrain)?[feature]:[])]});
    });
  }
  // Region centres are three hexes apart and touch through a two-hex neck. One SEA neck can otherwise split the
  // whole land graph. Open only the shortest tree that joins active homelands; the rest of the authored seas remain.
  const activeHomes:{q:number;r:number}[]=homes.slice(0,input.players.length).map(([q,r])=>({q,r}));
  for(let i=1;i<activeHomes.length;i++){
    let current=activeHomes[i]!;
    const target=activeHomes.slice(0,i).sort((a,b)=>hexDistance(current,a)-hexDistance(current,b)||a.q-b.q||a.r-b.r)[0]!;
    while(current.q!==target.q||current.r!==target.r){
      const next=hexNeighbors(current).filter(point=>point.q>=0&&point.q<6&&point.r>=0&&point.r<5&&hexDistance(point,target)<hexDistance(current,target)).sort((a,b)=>a.q-b.q||a.r-b.r)[0]!;
      const dq=next.q-current.q,dr=next.r-current.r;
      const bridge=[hexId({q:current.q*3,r:current.r*3}),hexId({q:current.q*3+dq,r:current.r*3+dr}),hexId({q:next.q*3-dq,r:next.r*3-dr}),hexId({q:next.q*3,r:next.r*3})];
      for(const id of bridge){const tile=map.find(candidate=>candidate.id===id);if(tile?.terrain==='SEA')tile.terrain='COAST';}
      current=next;
    }
  }
  const created=createGame({gameId:input.gameId,seed:input.seed,map,
    players:input.players.map(p=>({id:p.id,name:p.name,resources:{food:16,materials:14,wealth:10,knowledge:8,influence:8}})),
    initialCities:input.players.map((p,i)=>({id:`capital-${i+1}`,ownerId:p.id,name:(CIVILIZATIONS.find(civ=>civ.id===p.civilization)??CIVILIZATIONS[i]!).capital,hexId:`${homes[i]![0]*3},${homes[i]![1]*3}`,workers:{producers:1,artisans:0,merchants:0,scholars:1,soldiers:0,unassigned:0}}))});
  if(!created.ok)throw new Error(created.error.message);
  const migrated=migrateSnapshotV3ToV4(created.value);if(!migrated.ok)throw new Error(migrated.error.message);
  const state=migrated.value;state.rules=alphaRules(input.preset,input.worldPreset??'MIXED',input.actionsPerRound??5);state.regions=regions;state.privateRng=random.privateRng;state.telemetry.preset=state.rules.worldPreset;
  // Every civilization starts with a Pioneer to found and an Explorer to scout, so first contact does not wait on recruitment.
  state.players.forEach((p,i)=>{p.civilization=input.players[i]!.civilization??CIVILIZATIONS[i]!.id;p.leader=leaderStateFor(p.civilization);const center=state.core.players[i]!.civilization.cities[0]!.hexId;state.units.push({id:`pioneer-${i+1}`,ownerId:p.playerId,kind:'PIONEER',hexId:center,recruitedRound:1});state.units.push({id:`explorer-${i+1}`,ownerId:p.playerId,kind:'EXPLORER',hexId:center,recruitedRound:1});const city=state.cities.find(city=>city.currentOwnerId===p.playerId)!;city.nativeIdentity=p.civilization;});
  const occupied=new Set(state.core.players.flatMap(player=>player.civilization.cities.map(city=>city.hexId)));
  const neutral=state.core.map.filter(tile=>!occupied.has(tile.id)&&!['SEA','UNKNOWN'].includes(tile.terrain)).sort((a,b)=>a.id.localeCompare(b.id));
  // Independent peoples sit in contested ground: about as far from a seat's capital as from its nearest rival's, at least
  // 3 hexes from any capital and 4 from each other. Raid bands start in the wilderness, as far from every capital as possible.
  const capitals=state.core.players.map(player=>state.core.map.find(tile=>tile.id===player.civilization.cities[0]!.hexId)!);
  const reach=(tile:{q:number;r:number})=>{const distances=capitals.map(capital=>hexDistance(capital,tile)).sort((a,b)=>a-b);return {near:distances[0]!,contest:(distances[1]??distances[0]!)-distances[0]!};};
  const land=neutral.filter(tile=>reach(tile).near>=3);
  const pick=(candidates:typeof land,count:number,taken:typeof land)=>{const chosen:typeof land=[];for(const tile of candidates){if(chosen.length===count)break;if([...taken,...chosen].every(other=>hexDistance(other,tile)>=4))chosen.push(tile);}return chosen;};
  const peoples=pick([...land].sort((a,b)=>reach(a).contest-reach(b).contest||reach(a).near-reach(b).near||a.id.localeCompare(b.id)),3,[]);
  const wild=pick([...land].sort((a,b)=>reach(b).near-reach(a).near||a.id.localeCompare(b.id)),2,peoples);
  state.independents=peoples.map((tile,index)=>({id:`independent-${index+1}`,hexId:tile.id,type:(['VILLAGE','TOWN','CITY_STATE'] as const)[index]!,attitude:'NEUTRAL',influenceByPlayer:{},protectorId:null,integratedBy:null}));
  state.raidBands=wild.map((tile,index)=>({id:`raid-${index+1}`,hexId:tile.id,strength:2+index,lastMovedRound:0}));
  applyCivilizationHeritage(state);initializeAlphaCards(state);return AlphaStateSchema.parse(state);
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
}

function raidDefense(state:AlphaState,hexIdValue:string):number {
  const units=state.units.filter(unit=>unit.hexId===hexIdValue);
  const pieces=units.reduce((total,unit)=>total+state.rules.units[unit.kind].strength,0);
  const city=state.core.players.flatMap(player=>player.civilization.cities).find(candidate=>candidate.hexId===hexIdValue);
  return pieces+(city?.development??0);
}

/** One deterministic step per band at round end. Weak occupied targets are preferred and attacked on contact. */
export function resolveRaidBands(state:AlphaState):void {
  const byId=new Map(state.core.map.map(tile=>[tile.id,tile]));
  const assets=[...new Set([
    ...state.units.map(unit=>unit.hexId),
    ...state.core.players.flatMap(player=>player.civilization.cities.map(city=>city.hexId)),
  ])].filter(id=>byId.has(id));
  for(const band of [...state.raidBands].sort((a,b)=>a.id.localeCompare(b.id))){
    if(band.lastMovedRound>=state.core.round)continue;
    const current=byId.get(band.hexId);if(!current){band.lastMovedRound=state.core.round;continue;}
    const targets=[...assets].sort((a,b)=>{
      const weakA=Number(raidDefense(state,a)>=band.strength),weakB=Number(raidDefense(state,b)>=band.strength);
      return weakA-weakB||hexDistance(current,byId.get(a)!)-hexDistance(current,byId.get(b)!)||a.localeCompare(b);
    });
    const target=targets[0];
    if(target&&target!==band.hexId){
      const step=hexNeighbors(current).map(point=>byId.get(hexId(point))).filter(tile=>tile&&!['SEA','UNKNOWN'].includes(tile.terrain))
        .sort((a,b)=>hexDistance(a!,byId.get(target)!)-hexDistance(b!,byId.get(target)!)||a!.id.localeCompare(b!.id))[0];
      if(step)band.hexId=step.id;
    }
    band.lastMovedRound=state.core.round;
    if(!target||band.hexId!==target||raidDefense(state,target)>=band.strength)continue;
    const victims=state.units.filter(unit=>unit.hexId===target).sort((a,b)=>state.rules.units[a.kind].strength-state.rules.units[b.kind].strength||a.id.localeCompare(b.id));
    const lost=victims[0];if(lost)state.units=state.units.filter(unit=>unit.id!==lost.id);
    const city=state.core.players.flatMap(player=>player.civilization.cities).find(candidate=>candidate.hexId===target);
    if(city)city.stability=Math.max(0,city.stability-band.strength);
    const owner=city?.ownerId??lost?.ownerId;
    alphaEvent(state,'RAID_ATTACK',`${band.id} atacou ${target}${lost?` e eliminou ${lost.id}`:''}.`,owner?[owner]:null);
  }
}

/** Bands move every round, so only those inside current vision are shown; a remembered hex would leak a live position. */
export function raidBandView(state:AlphaState,actor:PlayerId){
  const visible=visibleHexIds(state,actor);
  return state.raidBands.filter(band=>visible.has(band.hexId)).map(band=>({id:band.id,hexId:band.hexId,strength:band.strength,lastMovedRound:band.lastMovedRound}));
}

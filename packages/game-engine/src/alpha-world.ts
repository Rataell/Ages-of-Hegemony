import { REGION_TEMPLATES, leaderStateFor, templateMetalDeposit, CIVILIZATIONS, HexIdSchema, PlayerIdSchema, AlphaStateSchema, alphaRules, type AlphaState, type AlphaRules, type MapPreset, type PlayerId, type StrategicOrder, type TerrainType } from '@aoh/game-domain';
import { createGame } from './engine.js';
import { migrateSnapshotV3ToV4 } from './alpha-migration.js';
import { hexDistance, hexNeighbors, hexId } from './hex.js';
import { initializeAlphaCards } from './alpha-cards.js';
import { alphaRandomInteger, combineAlphaSeed, deterministicAlphaSeed } from './alpha-random.js';

export function createAlphaGame(input:{gameId:string;seed:number;privateSeed?:string;players:{id:string;name:string;civilization?:string}[];preset:AlphaRules['preset'];worldPreset?:MapPreset}):AlphaState {
  if(input.privateSeed!==undefined&&!/^[a-f0-9]{64}$/.test(input.privateSeed))throw new Error('Invalid private alpha seed');
  const random:Pick<AlphaState,'privateRng'>={privateRng:{algorithm:'hmac-sha256-counter-v1',seed:input.privateSeed?combineAlphaSeed(input.seed,input.privateSeed):deterministicAlphaSeed(input.seed,input.gameId),counter:0}};
  const frontier=REGION_TEMPLATES.filter(r=>r.kind==='FRONTIER');
  for(let i=frontier.length-1;i>0;i--){const j=alphaRandomInteger(random,i+1);[frontier[i],frontier[j]]=[frontier[j]!,frontier[i]!];}
  const homes=[[0,0],[5,4],[0,4],[5,0],[2,0],[3,4]] as const;
  const regions:AlphaState['regions']=[];const map:{id:string;q:number;r:number;terrain:TerrainType;features:string[]}[]=[];let index=0;
  for(let r=0;r<5;r++)for(let q=0;q<6;q++) {
    const home=homes.findIndex(([hq,hr])=>hq===q&&hr===r);
    const template=home>=0?REGION_TEMPLATES[home]!:frontier[index++]!;
    const center={q:q*3,r:r*3};const points=[center,...hexNeighbors(center)];
    regions.push({id:`region-${q}-${r}`,templateId:template.id,hexIds:points.map(hexId),rotation:0,revealedBy:home>=0&&home<input.players.length?[PlayerIdSchema.parse(input.players[home]!.id)]:[]});
    const deposit=templateMetalDeposit(template);
    points.forEach((p,i)=>{
      let terrain=template.terrain[i]!;const preset=input.worldPreset??'MIXED';
      if(preset==='CONTINENTAL'&&terrain==='SEA')terrain=(p.q+p.r+input.seed)%2===0?'PLAINS':'COAST';
      if(preset==='ARCHIPELAGO'&&!(home>=0&&i===0)&&terrain!=='MOUNTAINS'&&(Math.abs(p.q*17+p.r*31+input.seed)%5)<2)terrain='SEA';
      if(preset==='INLAND_SEA'&&q>=2&&q<=3&&r>=1&&r<=3)terrain=i===0?'SEA':'COAST';
      map.push({...p,id:hexId(p),terrain,features:i===deposit&&(terrain==='HILLS'||terrain==='MOUNTAINS')?['METAL']:[]});
    });
  }
  const created=createGame({gameId:input.gameId,seed:input.seed,map,
    players:input.players.map(p=>({id:p.id,name:p.name,resources:{food:16,materials:14,wealth:10,knowledge:8,influence:8}})),
    initialCities:input.players.map((p,i)=>({id:`capital-${i+1}`,ownerId:p.id,name:p.name,hexId:`${homes[i]![0]*3},${homes[i]![1]*3}`,workers:{producers:1,artisans:0,merchants:0,scholars:1,soldiers:0,unassigned:0}}))});
  if(!created.ok)throw new Error(created.error.message);
  const migrated=migrateSnapshotV3ToV4(created.value);if(!migrated.ok)throw new Error(migrated.error.message);
  const state=migrated.value;state.rules=alphaRules(input.preset,input.worldPreset??'MIXED');state.regions=regions;state.privateRng=random.privateRng;state.telemetry.preset=state.rules.worldPreset;
  state.players.forEach((p,i)=>{p.civilization=input.players[i]!.civilization??CIVILIZATIONS[i]!.id;p.leader=leaderStateFor(p.civilization);const center=state.core.players[i]!.civilization.cities[0]!.hexId;state.units.push({id:`pioneer-${i+1}`,ownerId:p.playerId,kind:'PIONEER',hexId:center,recruitedRound:1});const city=state.cities.find(city=>city.currentOwnerId===p.playerId)!;city.nativeIdentity=p.civilization;});
  const occupied=new Set(state.core.players.flatMap(player=>player.civilization.cities.map(city=>city.hexId)));
  const neutral=state.core.map.filter(tile=>!occupied.has(tile.id)&&!['SEA','UNKNOWN'].includes(tile.terrain)).sort((a,b)=>a.id.localeCompare(b.id));
  state.independents=neutral.slice(0,3).map((tile,index)=>({id:`independent-${index+1}`,hexId:tile.id,type:(['VILLAGE','TOWN','CITY_STATE'] as const)[index]!,attitude:'NEUTRAL',influenceByPlayer:{},protectorId:null,integratedBy:null}));
  state.raidBands=neutral.slice(3,5).map((tile,index)=>({id:`raid-${index+1}`,hexId:tile.id,strength:2+index,lastMovedRound:0}));
  initializeAlphaCards(state);return AlphaStateSchema.parse(state);
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
export function validateExploration(state:AlphaState,actor:PlayerId,order:Extract<StrategicOrder,{type:'EXPLORE'}>):void {
  const unit=state.units.find(u=>u.id===order.unitId&&u.ownerId===actor);const region=state.regions.find(r=>r.hexIds.includes(order.target));
  if(!unit||!region||region.revealedBy.includes(actor))throw new Error('Escolha uma peça própria junto a uma região ainda não explorada.');
  const origin=state.core.map.find(t=>t.id===unit.hexId)!;
  if(!region.hexIds.some(id=>{const tile=state.core.map.find(t=>t.id===id)!;return hexDistance(origin,tile)<=1;}))throw new Error('A região não está na fronteira desta peça.');
  if(order.rotation!==region.rotation&&(region.revealedBy.length>0||region.hexIds.some(id=>state.core.map.find(t=>t.id===id)?.ownerId!==null||state.units.some(u=>u.hexId===id))))throw new Error('Uma região ocupada ou já revelada não pode ser girada.');
  if(order.rotation!==region.rotation){
    const template=REGION_TEMPLATES.find(r=>r.id===region.templateId)!;
    const observed=new Set(state.players.flatMap(p=>[...p.knownHexIds,...visibleHexIds(state,p.playerId)]));
    const changesKnownTerrain=region.hexIds.some((id,i)=>observed.has(id)&&state.core.map.find(t=>t.id===id)!.terrain!==template.terrain[i===0?0:1+(i-1+order.rotation)%6]);
    if(changesKnownTerrain)throw new Error('A orientação não pode alterar terrenos já conhecidos.');
  }
}
export function exploreRegion(state:AlphaState,actor:PlayerId,order:Extract<StrategicOrder,{type:'EXPLORE'}>):void {
  validateExploration(state,actor,order);const region=state.regions.find(r=>r.hexIds.includes(order.target))!;
  const template=REGION_TEMPLATES.find(r=>r.id===region.templateId)!;
  region.hexIds.forEach((id,i)=>{const tile=state.core.map.find(t=>t.id===id)!;tile.terrain=template.terrain[i===0?0:1+(i-1+order.rotation)%6]!;});
  region.rotation=order.rotation;region.revealedBy.push(actor);
  const player=state.players.find(p=>p.playerId===actor)!;player.knownHexIds=[...new Set([...player.knownHexIds,...region.hexIds])].sort();player.exploredRegions++;player.prestige++;
}

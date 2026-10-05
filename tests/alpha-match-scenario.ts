import { ADVANCEMENTS, ALPHA_CARDS, AlphaStateSchema, CityIdSchema, HexIdSchema, PlayerIdSchema, alphaRules, alphaToLegacyResources, emptyResourcePool, type AlphaState, type PlayerId } from '@aoh/game-domain';
import { alphaCommandCapacity, applyAlphaCommand, beginAlphaPlanning, createGame, initializeAlphaCards, migrateSnapshotV3ToV4, refreshKnowledge } from '@aoh/game-engine';

/** Authored integration scenario with ample reserves and five settlements per side.
 * This proves rule composition, not normal-start balance or match duration.
 * After setup every change goes through applyAlphaCommand.
 */
export function scriptedMatchSetup():AlphaState {
  const centers=[[[0,0],[0,3],[3,3],[6,0],[6,3]],[[10,0],[10,3],[13,0],[13,3],[10,6]]] as const;
  const initial=createGame({gameId:'6f1b5c9a-3d2e-4f8a-9b7c-1a2b3c4d5e61',seed:61,
    players:[{id:'p1',name:'Aurélia',resources:{food:500,materials:500,wealth:500,knowledge:500,influence:500}},{id:'p2',name:'Valgard',resources:{food:500,materials:500,wealth:500,knowledge:500,influence:500}}],
    map:Array.from({length:16*9},(_,i)=>({id:`${i%16-1},${Math.floor(i/16)-1}`,q:i%16-1,r:Math.floor(i/16)-1,terrain:'PLAINS'})),
    initialCities:centers.flatMap((cities,p)=>cities.map(([q,r],i)=>({id:`c${p+1}-${i}`,ownerId:`p${p+1}`,hexId:`${q},${r}`,name:`Centro ${p+1}.${i}`,population:2,workers:{producers:1,artisans:1,merchants:0,scholars:0,soldiers:0,unassigned:0}}))),
  });
  if(!initial.ok)throw new Error(initial.error.message);const migrated=migrateSnapshotV3ToV4(initial.value);if(!migrated.ok)throw new Error(migrated.error.message);
  const state=migrated.value,p1=PlayerIdSchema.parse('p1'),p2=PlayerIdSchema.parse('p2');state.rules=alphaRules('EPIC');state.core.config.administrativeRules.baseCapacity=50;state.rules.balance.administrationBase=50;
  state.rules.roundLimit=100;state.rules.roundsPerEra=1;
  for(const key of Object.keys(state.rules.balance.limits.base)){Object.assign(state.rules.balance.limits.base,{[key]:1000});Object.assign(state.rules.balance.limits.hardCap,{[key]:1000});}
  state.players[0]!.civilization='aurelia';state.players[1]!.civilization='valgard';
  // The script never Produces: sustenance and Crescer (canon §7) would starve eleven cities over 30 rounds without a granary of their own.
  for(const player of state.players){player.resources.food=1000;const owner=state.core.players.find(p=>p.id===player.playerId)!;owner.resources={...owner.resources,food:1000};}
  state.players.forEach(p=>p.knownHexIds=state.core.map.map(t=>t.id));
  state.regions=[{id:'demonstration-region',templateId:'homeland-1',hexIds:['0,0','1,0','1,-1','0,-1','-1,0','-1,1','0,1'].map(id=>HexIdSchema.parse(id)),rotation:0,revealedBy:[]}];
  state.units=[{id:'pioneer',ownerId:p1,kind:'PIONEER',hexId:HexIdSchema.parse('2,0'),recruitedRound:1},
    ...Array.from({length:10},(_,i)=>({id:`army-${i}`,ownerId:p1,kind:'INFANTRY' as const,hexId:HexIdSchema.parse('8,0'),recruitedRound:1})),
    ...Array.from({length:4},(_,i)=>({id:`defender-${i}`,ownerId:p2,kind:'INFANTRY' as const,hexId:HexIdSchema.parse('9,0'),recruitedRound:1}))];
  // The script builds two districts per city and recruits once: give the built levels room (canon §5) and a Soldado (canon §6).
  for(const meta of state.cities)meta.level='GREAT_CITY';
  const first=state.core.players[0]!.civilization.cities[0]!;first.workers={...first.workers,artisans:0,soldiers:1};
  initializeAlphaCards(state);refreshKnowledge(state);return beginAlphaPlanning(AlphaStateSchema.parse(state));
}

export function runScriptedMatch(checkpoint?:(name:'beforeAttack'|'beforeEndRound',state:AlphaState)=>void){
  let state=scriptedMatchSetup();const p1=state.players[0]!.playerId,p2=state.players[1]!.playerId;
  const trace:{round:number;actor:PlayerId;command:string;phase:string}[]=[];
  function submit(actor:PlayerId,command:Record<string,unknown>){
    const result=applyAlphaCommand(state,actor,{...command,expectedVersion:state.version});
    if(!result.ok)throw new Error(`Round ${state.core.round} ${String(command.type)}: ${result.error.code} ${result.error.message}`);
    trace.push({round:state.core.round,actor,command:String(command.type),phase:state.core.phase});state=result.value;
    state.players.forEach((p,i)=>{if(JSON.stringify(alphaToLegacyResources(p.resources))!==JSON.stringify(state.core.players[i]!.resources))throw new Error(`Resource pools diverged after round ${state.core.round} ${String(command.type)}`);});
  }
  function round(){
    const initialRound=state.core.round;
    for(let guard=0;guard<40&&state.core.status==='ACTIVE'&&state.core.round===initialRound;guard++){
      const player=state.players.find(p=>!p.ready);if(!player)throw new Error('No pending player at decision boundary');
      submit(player.playerId,{type:'READY'});
    }
    if(state.core.status==='ACTIVE'&&state.core.round===initialRound)throw new Error('Round failed to progress');
  }
  /** Queues one canonical urban action by p1, advancing first when the city or global action budget is occupied. */
  function urbanAct(action:string,extra:Record<string,unknown>={},cityId?:string){
    for(let attempt=0;attempt<4;attempt++){
      const progress=state.players[0]!;
      const used=progress.spentCommands+progress.orders.length+progress.plannedActions.length;
      if(state.phase!=='PLANNING'||used>=alphaCommandCapacity(state,p1))round();
      const planned=new Set(state.players[0]!.plannedActions.filter(item=>item.type==='URBAN_ACTION').map(item=>item.cityId));
      const free=state.cities.filter(c=>c.currentOwnerId===p1&&c.status==='OWNED'&&!planned.has(c.cityId)&&(!cityId||c.cityId===cityId));
      if(free.length){submit(p1,{type:'URBAN_ACTION',cityId:free[0]!.cityId,action,...extra});return;}
      round();
    }
    throw new Error(`No city could take ${action}`);
  }
  function perform(command:Record<string,unknown>){
    const player=state.players[0]!;
    if(state.phase!=='PLANNING'||player.spentCommands+player.orders.length+player.plannedActions.length>=alphaCommandCapacity(state,p1))round();
    submit(p1,command);
  }
  function manage(command:Record<string,unknown>){perform({type:'MANAGE',command:{...command,playerId:p1,expectedVersion:state.core.version}});}
  for(const player of [...state.players])submit(player.playerId,{type:'CHOOSE_AMBITIONS',cardIds:player.ambitions.slice(0,2)});
  const strategy=state.players[0]!.hand.find(id=>ALPHA_CARDS.find(card=>card.id===id)?.timing==='PLANNING');
  if(!strategy)throw new Error('The authored scenario requires a planning card in its seeded hand');
  perform({type:'PLAY_CARD',cardId:strategy});
  for(const treaty of ['TRADE_AGREEMENT','OPEN_BORDERS'])
    perform({type:'PROPOSE_TREATY',recipientId:p2,treaty,deal:{give:emptyResourcePool(),receive:emptyResourcePool()}});
  round();
  for(const treaty of [...state.treaties])submit(p2,{type:'RESPOND_TREATY',treatyId:treaty.id,accept:true});
  round();
  perform({type:'QUEUE_ORDER',order:{id:'explore',type:'EXPLORE',unitId:'pioneer',target:'1,0',rotation:0}});
  perform({type:'QUEUE_ORDER',order:{id:'route',type:'TRADE',fromCityId:'c1-0',toCityId:'c2-0'}});
  urbanAct('RESEARCH',{advancementId:'web-writing'});round();
  perform({type:'QUEUE_ORDER',order:{id:'settler-move',type:'MOVE',unitIds:['pioneer'],path:['3,0']}});
  urbanAct('SUPPORT_TRADE',{},'c1-0');
  urbanAct('PRODUCE',{},'c1-1');
  urbanAct('RECRUIT',{unit:'INFANTRY'},'c1-0');round();
  perform({type:'SETTLE',unitId:'pioneer',name:'Travessia'});
  perform({type:'DECLARE_WAR',targetId:p2});
  round();
  checkpoint?.('beforeAttack',structuredClone(state));
  perform({type:'QUEUE_ORDER',order:{id:'battle',type:'ATTACK',unitIds:Array.from({length:10},(_,i)=>`army-${i}`),target:'9,0'}});round();
  const foundation=ADVANCEMENTS.filter(a=>a.era==='FOUNDATION'&&a.id!=='web-writing');
  for(const node of [...foundation].sort((a,b)=>a.prerequisites.length-b.prerequisites.length)){urbanAct('RESEARCH',{advancementId:node.id});round();}
  urbanAct('RESEARCH',{advancementId:'web-codes'});round();
  for(const [cityId,district] of [['c1-0','ACADEMIC'],['c1-1','AGRARIAN'],['c1-2','COMMERCIAL'],['c1-3','CULTURAL']])urbanAct('BUILD',{build:{kind:'DISTRICT',district}},cityId);
  for(const cityId of ['c1-0','c1-1','c1-2','c1-4']){
    urbanAct('BUILD',{build:{kind:'DISTRICT',district:'ADMINISTRATIVE'}},cityId);urbanAct('BUILD',{build:{kind:'BUILDING',building:'ARCHIVE'}},cityId);
  }
  const claims:Record<string,string[]>={'c1-0':['1,0','0,1'],'c1-1':['1,3','0,4','0,2'],'c1-2':['4,3','3,4','3,2'],'c1-3':['7,0','6,1'],'c1-4':['7,3','6,4']};
  for(const [cityId,hexIds] of Object.entries(claims))for(const hexId of hexIds)manage({type:'CLAIM_HEX',cityId,hexId});
  manage({type:'IMPROVE_HEX',hexId:'1,0',improvement:'FARM'});
  submit(p1,{type:'MANAGE',command:{type:'ASSIGN_WORKED_HEXES',playerId:p1,cityId:CityIdSchema.parse('c1-0'),hexIds:['1,0'],expectedVersion:state.core.version}});
  for(let step=0;step<3;step++)perform({type:'ADVANCE_LEGACY_WORK',workId:'inquiry-campus',cityId:'c1-0'});
  perform({type:'DECLARE_HEGEMONY',path:'TERRITORIAL'});
  while(state.core.status==='ACTIVE'){checkpoint?.('beforeEndRound',structuredClone(state));round();}
  return {state,trace};
}

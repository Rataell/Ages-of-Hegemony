'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ALPHA_CARDS, ALPHA_ERA_NUMERALS, AlphaEraSchema, ORDER_NAMES, AlphaOrderTypeSchema, DISCOVERY_INFO, civilizationDisplayName, core10OfChassis, WORLD_PULSE_CARDS, civilizationKit, moveLegs, orderUnitIds } from '@aoh/game-domain';
import { emblemArt, sealArt, seatColor, seatSealSvg } from './table-art';
import type { AlphaRoomView } from '@aoh/server/alpha';
import { HexMap } from '../play/hex-map';
import { ResourceDisplay } from '../play/resource-display';
import { label as resourceLabel } from '../play/presentation';
import { alphaLabel as text } from './alpha-copy';
import { ArmyList, compositionText } from './alpha-army';
import { CasualtyPriority } from './alpha-casualties';
import { trackUi } from './telemetry';
import { useTable } from './alpha-table';
import { AppliedResultBlock } from './action-ficha';
import { appliedSummary, memoryFor } from './action-ficha-model';
import { loadMemory } from './action-ficha-memory';
import { LeaveGame } from './alpha-leave';
import { AlphaGuide } from './alpha-guide';
import { POSTURES } from './alpha-combat';
import { AlphaHand } from './alpha-hand';
import { AlphaTour } from './alpha-tour';
import { tipsSuspended } from './tour-gate';
import { AlphaEraTurn } from './alpha-era-turn';
import { AlphaCivBoard, ChoiceParchment, type CivView } from './alpha-civ-board';
import { StrategicSurface } from './strategic-surface';
import { NoticeToast, ReactionCloud, RoomBanners, RoomPanel, reactionOf, type RoomSend, type TableEvent } from './alpha-social';
import { useAlphaAudio } from './audio/use-alpha-audio';
import { AudioControls } from './audio/audio-controls';
import './audio/audio.css';
import { CityDetails, MilitaryDetails, TerritoryDetails, Pages, Segments, type CityPage, type MilitaryPage, type TerritoryPage } from './alpha-details';
import { AmbitionChooser, AlphaCards, AlphaDiplomacy, AlphaInstitutions, AlphaReports } from './alpha-panels';
import { RegionRevealed, useRevealedRegions } from './alpha-discovery';
import { AlphaCompendium } from './alpha-compendium';
import { AlphaChronicle } from './alpha-chronicle';

export type AlphaSend=(command:Record<string,unknown>)=>Promise<boolean>;
type Inspector='city'|'territory'|'military';
/** The Livro (book) opens over the map with the civilization's areas; 'world' means the book is closed and the map leads. */
const LIVRO=[['council','Conselho'],['civilization','Civilização'],['research','Teia Civilizacional'],['cards','Cartas & Projetos'],['diplomacy','Diplomacia'],['era','Eras & Hegemonia'],['reports','Crônicas']] as const;
/** Desktop only: the council and the inspector can fold away so the atlas gets the room. The choice is a per-browser convenience. */
const PANELS_KEY='aoh-alpha-panels-v2';
function loadPanels():{council:boolean;inspector:boolean}{
  // Without a saved choice, narrow desktops (e.g. 1366×768) start with the Council folded so the atlas leads; pieces can be
  // picked on the map itself.
  // On phones the context card starts closed (it would cover half the map); touching the map opens it.
  const narrow=typeof window!=='undefined'&&window.innerWidth<1400;
  try{const stored=localStorage.getItem(PANELS_KEY);if(stored===null)return {council:!narrow,inspector:false};const raw=JSON.parse(stored) as Record<string,unknown>;return {council:raw.council!==false,inspector:raw.inspector===true};}catch{return {council:!narrow,inspector:false};}
}
const NO_HEXES:readonly string[]=[];
const NO_EVENTS:readonly never[]=[];
const PRESENCE_LEVEL:Record<string,string>={CONTACT:'contato',ROOTED:'enraizada',PREDOMINANT:'predominante'};
const INSPECTORS:[Inspector,string][]=[['city','Cidade'],['territory','Território'],['military','Militar']];

/** Same shell as the local slice: top bar, area navigation, council | atlas | inspector, bottom action bar. */
const feedbackUrl=process.env.NEXT_PUBLIC_ALPHA_FEEDBACK_URL||'';
export default function AlphaBoard({room,busy,send,theme,onTheme,onLeave,roomSend,social,feed,connection}:{room:AlphaRoomView;busy:boolean;send:AlphaSend;theme:string;onTheme:(theme:string)=>void;onLeave:()=>void;roomSend:RoomSend;social:(payload:Record<string,unknown>)=>void;feed:TableEvent[];connection:'online'|'reconnecting'}){
  const game=room.game!,player=game.view.player,civ=player.civilization;
  const hostRef=useRef<HTMLDivElement|null>(null),[cityPage,setCityPage]=useState<CityPage>('summary'),[milPage,setMilPage]=useState<MilitaryPage>('summary'),[terPage,setTerPage]=useState<TerritoryPage>('hex'),[civView,setCivView]=useState<CivView>('web');
  const [tab,setTab]=useState('world'),[inspector,setInspector]=useState<Inspector>('city'),[selected,setSelected]=useState<string|null>(civ.cities[0]?.hexId??null),[selectedCity,setSelectedCity]=useState(civ.cities[0]?.id??''),[focus,setFocus]=useState<string|null>(civ.cities[0]?.hexId??null);
  const [units,setUnits]=useState<string[]>([]),[working,setWorking]=useState(false),[worked,setWorked]=useState<string[]>([]);
  const [tour,setTour]=useState<'tour'|'tips'|null>(null),[cardFocus,setCardFocus]=useState(false),[cofreOpen,setCofreOpen]=useState(false),[cofrePage,setCofrePage]=useState<'resources'|'limits'>('resources'),[civOpen,setCivOpen]=useState(false),[panels,setPanels]=useState(loadPanels),[dismissedResolution,setDismissedResolutionState]=useState(()=>{try{return Number(sessionStorage.getItem(`aoh-resolution-seen-${room.id}`)??0);}catch{return 0;}}),[finaleClosed,setFinaleClosed]=useState(false),[chronicleOpen,setChronicleOpen]=useState(false),[checkOpen,setCheckOpen]=useState(false),[guideOpen,setGuideOpen]=useState(false),[ambitionsLater,setAmbitionsLaterState]=useState(()=>{try{return sessionStorage.getItem(`aoh-ambitions-later-${room.id}`)==='1';}catch{return false;}});
  /** A round's results are shown once per browser session, not again on every reload. */
  const setDismissedResolution=(round:number)=>{setDismissedResolutionState(round);try{sessionStorage.setItem(`aoh-resolution-seen-${room.id}`,String(round));}catch{/* storage blocked: shown again after reload */}};
  const setAmbitionsLater=(later:boolean)=>{setAmbitionsLaterState(later);try{sessionStorage.setItem(`aoh-ambitions-later-${room.id}`,later?'1':'0');}catch{/* storage blocked: the choice lasts until reload */}};
  const togglePanel=(key:'council'|'inspector')=>setPanels(old=>{const next={...old,[key]:!old[key]};try{localStorage.setItem(PANELS_KEY,JSON.stringify(next));}catch{/* private mode: keep the choice for this session only */}return next;});
  const audio=useAlphaAudio(game,room.selfPlayerId);
  // RC 1.2 · cards lane: REGIÃO REVELADA panel (once per reveal, explorer only) and the Compêndio layer.
  const reveal=useRevealedRegions(game,room.id),[compendiumOpen,setCompendiumOpen]=useState(false);
  // Physical reveal: every Region that opens while the table is watched is lifted, turned and flipped (first view of a table plays nothing).
  const [revealQueue,setRevealQueue]=useState<{regionId:string;rotation:number}[]>([]),openSeen=useRef<Set<string>|null>(null);
  useEffect(()=>{
    const open=new Set(game.board.filter(r=>!r.closed).map(r=>r.id));
    if(openSeen.current===null){openSeen.current=open;return;}
    const fresh=[...open].filter(id=>!openSeen.current!.has(id));
    openSeen.current=open;
    if(fresh.length)setRevealQueue(q=>[...q,...fresh.map(id=>({regionId:id,rotation:game.regions.find(r=>r.id===id)?.rotation??0}))].slice(-4));
  },[game.board,game.regions]);
  const [cloud,setCloud]=useState<HTMLElement|null>(null),[clock,setClock]=useState(0);
  // Table reactions: a bubble above the sender's plate for ~2.2 s; a ping marks the hex on the map for ~4 s. Nothing here is saved.
  const lastKey=feed.at(-1)?.key??0;
  useEffect(()=>{const last=feed.at(-1);if(!last)return;if(last.type==='REACTION'&&last.playerId!==room.selfPlayerId)audio.playReaction();const t=setTimeout(()=>setClock(c=>c+1),4100);return()=>clearTimeout(t);},[lastKey]);
  const nowMs=Date.now(),bubbles=Object.fromEntries(feed.filter(e=>e.type==='REACTION'&&nowMs-e.at<2300).map(e=>{const [,glyph,label]=reactionOf(e.reaction);return [e.playerId,{glyph,label,key:e.key}];}));
  const pingMarks=feed.filter(e=>e.type==='PING'&&e.hexId&&nowMs-e.at<4000).map(e=>({hexId:e.hexId!,label:`${room.seats.find(s=>s.playerId===e.playerId)?.name??'Alguém'} marcou`,tone:'event' as const}));
  const plateTone=Object.fromEntries(room.seats.map(s=>[s.playerId,s.onGuard?'guard':s.presence==='ABSENT'?'absent':s.presence==='RECONNECTING'?'reconnecting':'']).filter(([,v])=>v));
  void clock;
  const locked=busy||game.self.ready||game.view.status==='FINISHED'||room.lifecycle!=='ACTIVE'||room.selfOnGuard;
  /** The server refuses the first READY until two ambitions are kept, so the board asks for them up front. */
  const ambitionsPending=!game.self.ambitionsChosen&&game.view.round===1&&game.phase==='PLANNING'&&!game.winner;
  const over=civ.administrationStatus==='OVEREXTENDED';
  const city=civ.cities.find(c=>c.id===selectedCity)??civ.cities[0];
  const tile=game.view.visibleTerritory.find(t=>t.id===selected);
  const ownUnits=game.units.filter(u=>u.ownerId===room.selfPlayerId);
  // A piece that no longer exists (Pioneiro that founded a city, a casualty) must not stay in the selection: its id would be sent with the next order and the server would refuse the whole order.
  const liveKey=ownUnits.map(u=>u.id).join();
  // Playtest-only human telemetry (the server turns it on): which panel is open, when a decision appears and when it is answered.
  const watched=room.playtest===true,firstChoice=game.self.pendingChoices[0]?.id??null;
  useEffect(()=>{trackUi(watched,room.id,'panel_open',civOpen?'civ':tab);},[watched,room.id,tab,civOpen]);
  useEffect(()=>{trackUi(watched,room.id,'panel_open',`inspector-${inspector}`);},[watched,room.id,inspector]);
  useEffect(()=>{if(firstChoice)trackUi(watched,room.id,'decision_shown',firstChoice.slice(0,32));return()=>{if(firstChoice)trackUi(watched,room.id,'decision_done',firstChoice.slice(0,32));};},[watched,room.id,firstChoice]);
  useEffect(()=>{if(game.phase==='ERA_TURN')trackUi(watched,room.id,'era_turn_shown',String(game.view.round));},[watched,room.id,game.phase,game.view.round]);
  useEffect(()=>{setTerPage('threat');},[selected]);
  useEffect(()=>{setUnits(current=>{const live=current.filter(id=>ownUnits.some(u=>u.id===id));return live.length===current.length?current:live;});},[liveKey]);
  /** "Movimento · Pioneiro → 4,6": what moves, and where, instead of the bare order type. A coordinated Move reads as ONE set: "Mover coordenado · Infantaria ×2 → 4,6 + Cavalaria → 5,2". */
  const orderLabel=(order:typeof game.self.orders[number])=>{
    const piecesOf=(ids:readonly string[])=>ids.length?compositionText(game.units.filter(u=>ids.includes(u.id))):'';
    if(order.type==='MOVE'){
      const legs=moveLegs(order),to=(leg:typeof legs[number])=>leg.rotation!==undefined?'desconhecido':(leg.path.at(-1)??'');
      // Discovery is part of the Move: a leg that carries an orientation enters a closed Region, so the plan reads as one Move to the unknown.
      if(legs.length>1)return `${text(order.type)} coordenado · ${legs.map(leg=>`${piecesOf(leg.unitIds)} → ${to(leg)}`).join(' + ')}`;
      const only=legs[0]!,who=piecesOf(only.unitIds);
      return `${text(order.type)}${who?` · ${who}`:''} → ${to(only)}`;
    }
    const ids=orderUnitIds(order),who=piecesOf(ids);
    const where=order.type==='TRADE'?civ.cities.find(c=>c.id===order.fromCityId)?.name:order.target;
    return `${text(order.type)}${who?` · ${who}`:''}${where?` → ${where}`:''}`;
  };
  const manage=(command:Record<string,unknown>)=>send({type:'MANAGE',command:{...command,playerId:room.selfPlayerId,expectedVersion:game.view.version}});
  const queue=(order:Record<string,unknown>)=>send({type:'QUEUE_ORDER',order:{...order,id:`order-${game.version}-${game.self.orders.length}`}});
  const known=game.knownTerritory.map(t=>({...t,ownerId:null,controllerCityId:null,improvement:null,yield:null,yieldError:null}));
  // Layer A → tiles: every hex of a face-down Region that the player has no memory or vision of is an UNKNOWN tile (the map draws the Region as one piece).
  const seenIds=new Set([...game.view.visibleTerritory,...known].map(t=>t.id as string));
  const unknown=game.board.filter(region=>region.closed).flatMap(region=>region.hexIds.filter(id=>!seenIds.has(id)).map(id=>{const [q,r]=id.split(',').map(Number) as [number,number];return {id:id as never,q,r,terrain:'UNKNOWN' as const,features:[] as never[],visibility:'UNKNOWN' as const,ownerId:null,controllerCityId:null,improvement:null,yield:null,yieldError:null};}));
  /** Table-edge plates: where each seat is in the round, from public readiness only. */
  const seatStatus=Object.fromEntries(game.players.map(p=>{
    const seat=room.seats.find(s=>s.playerId===p.id),base=game.phase==='PLANNING'?(p.ready?'✓ Pronto':'Planejando…'):game.phase==='ERA_TURN'?(p.ready?'✓ Pronto':'Virada de Era'):'Resolvendo…';
    return [p.id,seat?.bot?`BOT · ${room.lifecycle==='SUSPENDED'?'Suspensa':base}`:room.lifecycle==='SUSPENDED'?'Suspensa':seat?.onGuard?'EM GUARDA':seat?.presence==='ABSENT'?'Ausente':seat?.presence==='RECONNECTING'?'Reconectando…':base];
  }));
  const planned=[...game.self.orders.map(order=>({id:order.id,label:orderLabel(order)})),...game.self.plannedActions.map(action=>({id:action.id,label:action.type==='URBAN_ACTION'?`${text(action.action)} · ${civ.cities.find(candidate=>candidate.id===action.cityId)?.name??'Cidade'}`:text(action.type)}))];
  /** Decisions waiting in other areas, flagged on their tab so the player does not have to go looking. */
  const incomingProposals=game.treaties.filter(t=>t.status==='PROPOSED'&&t.recipientId===room.selfPlayerId).length;
  const worldChoice=!!game.worldEvent&&game.worldDecisionPending&&game.phase==='PLANNING';
  const tabAlerts:Record<string,string|undefined>={
    cards:worldChoice?'Evento mundial aguarda sua escolha':undefined,
    diplomacy:incomingProposals?`${incomingProposals} proposta(s) aguardam resposta`:undefined,
    era:game.milestones.roundsUntilNext===1&&game.phase==='PLANNING'?'Última rodada da Era':undefined,
  };
  /** What a confirmation would leave undone: a city without its action produces nothing; idle pieces and spare actions are just reminders. */
  const orderedNow=new Set(game.self.orders.flatMap(orderUnitIds));
  const planningWarnings=game.phase!=='PLANNING'?[]:[
    ...game.cityStates.filter(c=>c.status!=='OCCUPIED'&&c.plannedUrbanActions===0).map(c=>`${civ.cities.find(x=>x.id===c.cityId)?.name??'Uma cidade'} não tem ação planejada: não produz nesta rodada.`),
    ...game.threatAlerts.map(alert=>`${alert.kind==='PIRATE'?'Piratas':'Um bando de saqueadores'} a ${alert.distance} hex(es) de ${civ.cities.find(x=>x.id===alert.cityId)?.name??'uma cidade'}: reforce a defesa ou ataque-o.`),
    ...(worldChoice?['O evento mundial oferece um recurso ou 1 Prestígio: escolha em Cartas & Projetos.']:[]),
    ...(incomingProposals?[`${incomingProposals} proposta(s) diplomática(s) sem resposta em Diplomacia.`]:[]),
    ...(()=>{const idle=ownUnits.filter(u=>!orderedNow.has(u.id)&&Object.keys(game.unitOptions[u.id]?.moves??{}).length>0);return idle.length?[`${idle.length} peça(s) sem ordem: ${compositionText(idle)}.`]:[];})(),
  ];
  const people=game.independents.find(p=>p.hexId===selected&&p.integratedBy===null),raidHere=game.threats.find(r=>r.hexId===selected);
  const cityAtSelected=[...civ.cities,...game.view.visibleCities].find(c=>c.hexId===selected);
  const cultureHere=cityAtSelected?game.culture.find(entry=>entry.cityId===cityAtSelected.id):undefined,cultureCityName=cityAtSelected?.name??'';
  const myCulture=game.self.civilization,mineHere=!!cultureHere&&cultureHere.currentOwnerId!==room.selfPlayerId&&cultureHere.foreignPresence.some(p=>p.civilizationId===myCulture);
  const reactions=game.self.hand.map(id=>ALPHA_CARDS.find(card=>card.id===id)).filter(card=>card?.timing==='REACTION').map(card=>card!);
  const conflictCall=game.phase==='CONFLICTS'&&!game.self.ready&&!game.winner&&(game.incomingAttacks.length>0||game.self.orders.some(o=>o.type==='ATTACK'));
  const latestReport=game.roundReports.at(-1),replay=!conflictCall&&!game.winner&&game.phase!=='ERA_TURN'&&latestReport&&latestReport.resolution.length>0&&latestReport.round>dismissedResolution?latestReport:null;
  const resolution=latestReport?.resolution.slice(-8)??[];
  /** Resultado: the applied effects of each planned urban action, compared with the preview this browser kept when the player confirmed it (never invented: without it, the applied alone). */
  const kept=useMemo(()=>latestReport?loadMemory(room.id):[],[room.id,latestReport?.round,game.version]);
  const appliedOf=(event:NonNullable<typeof latestReport>['resolution'][number],compact:boolean)=>event.applied?<AppliedResultBlock applied={event.applied} compact={compact} memory={memoryFor(kept,event.round,event,latestReport!.resolution,event.id)}/>:null;
  /** Results on their targets: during the round's resolution, a halo and tag on each event's hex; while a card's round bonus
   * lasts, a seal on the pieces it strengthens or speeds (not only a toast). */
  const EVENT_TAG:Record<string,string>={MOVEMENT:'Movimento',EXPLORATION:'Exploração',DISCOVERY:'Região revelada',FOUNDATION:'Fundação',PRODUCTION:'Produção',CONSTRUCTION:'Obra',RECRUITMENT:'Recrutamento',RESEARCH:'Pesquisa',TRADE:'Comércio',INFLUENCE:'Influência',COMBAT:'Combate',LOSSES:'Perdas',RETREAT:'Recuo',ADVANCE:'Avanço',FAILURE:'Não ocorreu',ROUND_EVENT:'Evento'};
  const bonuses=game.self.temporaryEffects.filter(entry=>entry.round===game.view.round&&(entry.effect.kind==='STRENGTH'||entry.effect.kind==='MOVEMENT'));
  const bonusTotal=(kind:string)=>bonuses.filter(entry=>entry.effect.kind===kind).reduce((total,entry)=>total+('amount' in entry.effect?entry.effect.amount:0),0);
  /** Resolved plans, on the table: what the player has already decided this round is visible where it will happen. */
  const planMarks=game.phase==='PLANNING'?[
    ...game.self.plannedActions.flatMap(action=>action.type==='URBAN_ACTION'?[{hexId:civ.cities.find(c=>c.id===action.cityId)?.hexId??'',label:`✓ ${text(action.action)}`,tone:'plan' as const}]:[]),
    // A MOVE puts one mark at the destination of EACH leg (a coordinated Order of 2 legs reads "✓ Mover 1/2" and "✓ Mover 2/2").
    ...game.self.orders.flatMap(order=>order.type==='MOVE'?moveLegs(order).map((leg,index,all)=>({hexId:leg.path.at(-1)??'',label:`${leg.rotation!==undefined?'✓ Mover · descobrir':'✓ Mover'}${all.length>1?` ${index+1}/${all.length}`:''}`,tone:'plan' as const})):[{hexId:'target' in order?String(order.target):'',label:order.type==='EXPLORE'?'✓ Explorar':order.type==='ATTACK'?'✓ Ataque':`✓ ${text(order.type)}`,tone:'plan' as const}]),
  ].filter(mark=>mark.hexId!==''):[];
  const mapMarks=[
    ...planMarks,
    ...pingMarks,
    ...game.cityMarks.filter(mark=>mark.blockaded).map(mark=>({hexId:mark.hexId,label:'Porto bloqueado',tone:'loss' as const})),
    ...(replay?replay.resolution.filter(event=>event.hexId).map(event=>{const sum=event.applied?appliedSummary(event.applied):null;return {hexId:event.hexId!,label:`${EVENT_TAG[event.type]??text(event.type)}${sum?.text?` · ${sum.text}`:''}`,tone:(event.type==='LOSSES'||event.type==='FAILURE'||sum?.loss?'loss':'event') as 'loss'|'event'};}):[]),
    ...[...new Set(ownUnits.map(u=>u.hexId))].flatMap(hexId=>{const here=ownUnits.filter(u=>u.hexId===hexId),fights=here.some(u=>(game.rules.units[u.kind]?.strength??0)>0);return [
      ...(fights&&bonusTotal('STRENGTH')?[{hexId,label:`+${bonusTotal('STRENGTH')} Força`,tone:'card' as const}]:[]),
      ...(bonusTotal('MOVEMENT')?[{hexId,label:`+${bonusTotal('MOVEMENT')} mov.`,tone:'card' as const}]:[])];}),
  ];
  const mapData={view:{...game.view,era:game.self.era,visibleTerritory:[...game.view.visibleTerritory,...known,...unknown]},players:game.players,claimable:panels.inspector&&inspector==='territory'&&city?(game.claimOptions[city.id]??[]):[],workable:city?game.view.visibleTerritory.filter(t=>t.controllerCityId===city.id).map(t=>t.id):[]};
  /** Details follow the touch without opening: the Inspector is "Ver detalhes", never the way to act on a piece. */
  const follow=(hexId:string|null,pieces:boolean)=>{
    if(working)return;
    setInspector(pieces?'military':civ.cities.some(c=>c.hexId===hexId)?'city':'territory');
  };
  const openDetails=(next:Inspector,wantCatalog=false)=>{setInspector(next);if(next==='city')setCityPage(wantCatalog?'actions':'summary');setPanels(old=>({...old,inspector:true}));};
  const workCity=civ.cities.find(c=>c.id===selectedCity);
  const startWork=(cityId:string)=>{const target=civ.cities.find(c=>c.id===cityId);if(!target)return;setSelectedCity(cityId);setWorked(target.workedHexIds);setWorking(true);};
  const table=useTable({game,roomId:room.id,selfId:room.selfPlayerId,color:seatColor(Math.max(0,game.players.findIndex(p=>p.id===room.selfPlayerId))),startWork,work:working&&workCity?{cityName:workCity.name,origin:workCity.hexId,count:worked.length,limit:workCity.workers.producers,onConfirm:()=>{void manage({type:'ASSIGN_WORKED_HEXES',cityId:workCity.id,hexIds:worked}).then(ok=>{if(ok)setWorking(false);});},onCancel:()=>setWorking(false)}:null,locked,send,queue,manage,host:hostRef,describeOrder:orderLabel,hold:tab!=='world'||civOpen,safe:{top:78,right:panels.inspector?400:16,bottom:98,left:16},openDetails,openBook:next=>{setTab(next);}});
  useEffect(()=>{if(tab!=='world'||civOpen)table.close();},[tab,civOpen]);
  /** Closed hexes a piece can enter whose Region carries `frontierRisk.danger === 'POSSIBLE'`: the amber warning shows while the map is answering a Move (never the fact of a Perigo). */
  const dangerHexes=useMemo(()=>{
    const lit=new Set<string>(table.targets?.kind==='move'?table.targets.hexIds:[]);
    if(!lit.size)return NO_HEXES;
    return [...new Set(Object.values(game.unitOptions).flatMap(o=>o.frontier.filter(f=>f.frontierRisk?.danger==='POSSIBLE').flatMap(f=>f.entries.map(e=>e.hexId))))].filter(id=>lit.has(id));
  },[game.unitOptions,table.targets]);
  function select(id:string){
    // While the map is answering a spatial decision (target mode) a click is the answer, not a new selection.
    if(table.targets){table.select(id);return;}
    setSelected(id);const target=civ.cities.find(c=>c.hexId===id);if(target)setSelectedCity(target.id);
    if(working){if((mapData.workable as string[]).includes(id))setWorked(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);return;}
    follow(id,!civ.cities.some(c=>c.hexId===id)&&ownUnits.some(u=>u.hexId===id));
    table.select(id);
  }
  /** A click on the player's own pieces drawn on a hex selects the stack, even when the hex is also a city. */
  function selectPieces(id:string){setSelected(id);follow(id,true);table.select(id,true);}
  function pick(_ids:string[],_on:boolean,hexId:string){setTab('world');setCivOpen(false);setSelected(hexId);follow(hexId,true);table.select(hexId,true);}
  const eraNumeral=ALPHA_ERA_NUMERALS[AlphaEraSchema.options.indexOf(game.self.era)]??'';
  const seatOf=(id:string)=>{const index=Math.max(0,game.players.findIndex(p=>p.id===id)),kit=civilizationKit(game.players[index]?.civilization);return {index,color:seatColor(index),mark:kit?.mark??null};};
  const self=seatOf(room.selfPlayerId),livroAlert=Object.values(tabAlerts).some(Boolean);
  const shortage=game.cityDetails.some(c=>c.growth.civilization.shortage);
  return <>
    <header className="alpha-strip alpha-player-board aoh-strip aoh-glass">
      <div className="alpha-strip-civ" role="button" tabIndex={0} title="Abrir o Tabuleiro da Civilização" onClick={()=>{setTab('world');setCivOpen(true);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setTab('world');setCivOpen(true);}}}>{self.mark&&<svg width="34" height="34" viewBox="-17 -17 34 34" aria-hidden="true" dangerouslySetInnerHTML={{__html:sealArt(self.mark,self.color,13)}}/>}<div><h1>{game.self.civilization?civilizationDisplayName(game.self.civilization):player.name}</h1><small>{player.name}</small></div></div>
      <div className="alpha-strip-when"><span>Era <b className="aoh-numeral">{eraNumeral}<span className="era-name"> · {text(game.self.era)}</span></b> · <span className="rl">Rodada </span><b className="aoh-numeral">{game.view.round} / {game.rules.roundLimit}</b> · <button type="button" className="alpha-resonance" onClick={()=>{setTab('world');setCivView('web');setCivOpen(true);}} title={`Ressonância: ${game.self.resonance.slots.length} de 5 encaixes. No quinto, uma Repercussão.`} aria-label={`Ressonância ${game.self.resonance.slots.length} de 5`}>{Array.from({length:5},(_,i)=>{const slot=game.self.resonance.slots[i];return <i key={i} className={`alpha-socket${slot?` is-full d-${slot.domains[0]}${slot.domains[1]?` d2-${slot.domains[1]}`:''}`:''}`}/>})}<b className="alpha-res-count" aria-hidden="true">{game.self.resonance.slots.length===0&&game.self.pendingChoices.some(choice=>choice.source==='REPERCUSSION')?5:game.self.resonance.slots.length}/5</b>{game.self.pendingChoices.some(choice=>choice.source==='REPERCUSSION')&&<b className="aoh-numeral alpha-socket-pending" title="Decisão pendente de Repercussão">!</b>}</button></span><span className={`aoh-tag${replay?' is-warn':''}`}>{replay?'Resolvendo a rodada':text(game.phase)}{room.deadline&&` · até ${new Date(room.deadline).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`}</span></div>
      <ol className="alpha-strip-seals" aria-label="Iniciativa">{game.initiative.map(id=>{const seat=seatOf(id),who=game.players.find(p=>p.id===id);return <li key={id} className={`aoh-seal${id===room.selfPlayerId?' is-self':''}`} style={{['--seat' as string]:seat.color}} title={`${who?.name??''} · ${civilizationDisplayName(who?.civilization)}${who?.ready?' · pronto':''}`}>{seat.mark&&<svg width="22" height="22" viewBox="-12 -12 24 24" aria-hidden="true" dangerouslySetInnerHTML={{__html:emblemArt(seat.mark.emblem,0,0,.75,seat.color,2)}}/>}<span className="seat-strip-seal" aria-hidden="true" dangerouslySetInnerHTML={{__html:seatSealSvg(seat.index,seat.color,11)}}/><span className="alpha-sr-only">{who?.name}</span>{game.phase==='PLANNING'&&<span className="st">{who?.ready?'✓':'…'}</span>}</li>;})}</ol>
      {(over||shortage)&&<span className="aoh-chip alpha-strip-alert" title={over?'Sobre-extensão: mais cidades do que a administração comporta':'Alimento curto: a produção não cobre o consumo'}>{over?'Sobre-extensão':'Alimento curto'}</span>}
      <div className="alpha-strip-tools">
        <AudioControls className="alpha-strip-audio"/><button type="button" className="aoh-btn is-sm" aria-label="Reagir" title="Reagir aos outros jogadores" onClick={e=>setCloud(e.currentTarget)}>Reagir</button>
        <button type="button" className="aoh-btn is-sm alpha-livro-button" aria-expanded={tab!=='world'} onClick={()=>{setCivOpen(false);setTab(tab==='world'?'council':'world');}}>Livro{livroAlert&&<span className="alpha-tab-alert" aria-hidden="true"/>}</button>
        <button type="button" className="aoh-btn is-sm is-ghost alpha-guide-button alpha-tips-button" onClick={()=>setTour('tips')}>Dicas</button><button type="button" className="aoh-btn is-sm is-ghost alpha-guide-button alpha-howto-button" onClick={()=>setGuideOpen(true)}>Como jogar</button><button type="button" className="aoh-btn is-sm is-ghost alpha-guide-button alpha-compendium-button" aria-expanded={compendiumOpen} onClick={()=>setCompendiumOpen(!compendiumOpen)}>Compêndio</button>
        <LeaveGame joinCode={room.joinCode} onLeave={onLeave}/>
        <label className="alpha-theme">Tema <select value={theme} onChange={e=>onTheme(e.target.value)}><option value="SYSTEM">Sistema</option><option value="DARK">Escuro</option><option value="LIGHT">Claro</option></select></label>
      </div>
    </header>
    <RoomBanners room={room} send={roomSend} connection={connection}/><NoticeToast notices={room.notices}/>
    {cloud&&<ReactionCloud anchor={cloud} onClose={()=>setCloud(null)} onPick={code=>{social({type:'REACT',reaction:code});}}/>}
    {replay&&<section className="alpha-resolution-phase" role="status" aria-label="Resolvendo a rodada"><p className="eyebrow">RESOLVENDO A RODADA {replay.round}</p><h2>Resultados autorizados</h2><ol>{replay.resolution.map(event=><li key={event.id}><b>{text(event.type)}</b><span>{event.message}</span>{appliedOf(event,false)}</li>)}</ol><button className="primary" onClick={()=>setDismissedResolution(replay.round)}>Continuar</button></section>}
    {ambitionsPending&&!ambitionsLater&&!replay&&<div className="alpha-modal-backdrop"><section className="alpha-modal" role="dialog" aria-modal="true" aria-labelledby="alpha-ambitions-title"><p className="eyebrow">ANTES DO PRIMEIRO PLANEJAMENTO</p><AmbitionChooser game={game} locked={locked} send={send}/><button type="button" onClick={()=>setAmbitionsLater(true)}>Ver o mapa primeiro</button><button type="button" onClick={()=>{setAmbitionsLater(true);setGuideOpen(true);}}>Como jogar</button></section></div>}
    {guideOpen&&<AlphaGuide game={game} onClose={()=>setGuideOpen(false)}/>}
    {!game.winner&&!(ambitionsPending&&!ambitionsLater)&&<AlphaTour game={game} roomId={room.id} open={tour} onOpenChange={setTour} suspended={tipsSuspended({phase:game.phase,conflictCall,replay:!!replay,winner:!!game.winner})}/>}
    {conflictCall&&<section className="alpha-conflict-call" role="alert" aria-label="Conflitos da rodada"><p className="eyebrow">CONFLITOS DA RODADA {game.view.round}</p><h2>{game.incomingAttacks.length?'Sua civilização está sendo atacada':'Seu ataque aguarda reações'}</h2>
      {game.incomingAttacks.map(a=><p key={`${a.attackerId}-${a.target}`}><b>{game.players.find(p=>p.id===a.attackerId)?.name}</b> ataca suas posições em <b>{a.target}</b>.</p>)}
      {game.self.orders.filter(o=>o.type==='ATTACK').map(o=><p key={o.id}>Seu ataque em <b>{o.type==='ATTACK'?o.target:''}</b> é resolvido depois das reações.</p>)}
      {reactions.length>0?<><p>Uma carta de reação soma Força aos seus conflitos desta rodada, antes dos dados. Restam {Math.max(0,game.rules.cardsPerRound-game.self.cardsPlayed)} carta(s) nesta rodada.</p><div className="alpha-card-row">{reactions.map(card=><article className="alpha-card" key={card.id}><h4>{card.name}</h4><p>+{card.effect?.amount??0} Força nesta rodada</p><button disabled={busy} onClick={()=>void send({type:'PLAY_CARD',cardId:card.id})}>Jogar reação</button></article>)}</div></>:<p>Você não tem cartas de reação.</p>}
      <button className="primary" disabled={busy} onClick={()=>void send({type:'READY'})}>Seguir para os dados</button></section>}
    {game.phase==='ERA_TURN'&&!game.winner&&<AlphaEraTurn game={game} locked={locked} send={send}/>}
    {game.winner&&!finaleClosed&&<div className="alpha-modal-backdrop"><section className="alpha-modal alpha-finale-panel" role="dialog" aria-modal="true" aria-labelledby="alpha-finale-title"><p className="eyebrow">FIM DA PARTIDA · RODADA {game.winner.round}</p>
      <h2 id="alpha-finale-title">{game.winner.playerId===room.selfPlayerId?'Sua civilização venceu':`${game.players.find(p=>p.id===game.winner!.playerId)?.name} venceu`}</h2>
      <p>{game.winner.reason==='HEGEMONY'?`Hegemonia ${text(game.finalStandings.find(s=>s.playerId===game.winner!.playerId)?.hegemony??'')} consolidada.`:`Maior Prestígio ao fim das ${game.rules.roundLimit} rodadas.`}</p>
      <div className="table-scroll"><table className="alpha-standings"><thead><tr><th>#</th><th>Civilização</th><th>Prestígio</th><th>Pesquisas</th><th>População</th><th>Riqueza</th><th>Cidades</th></tr></thead><tbody>{game.finalStandings.map((s,i)=><tr key={s.playerId} className={s.playerId===room.selfPlayerId?'is-self':''}><td>{i+1}</td><th>{s.name}<small>{civilizationDisplayName(s.civilization)}</small></th><td>{s.prestige}</td><td>{s.research}</td><td>{s.population}</td><td>{s.wealth}</td><td>{s.cities}</td></tr>)}</tbody></table></div>
      <p className="alpha-hint">Ordem: Prestígio; empates por pesquisas, população, riqueza e, por fim, ordem de iniciativa.</p>
      <div className="alpha-finale-actions"><button className="primary" onClick={onLeave}>Nova partida</button><button onClick={()=>setChronicleOpen(true)}>Crônica da Partida</button><button onClick={()=>{setFinaleClosed(true);setTab('reports');}}>Ver crônicas</button><button onClick={()=>setFinaleClosed(true)}>Ver o mapa final</button></div></section></div>}
    {game.winner&&finaleClosed&&<section className="alpha-finale" role="status"><p className="eyebrow">FIM DA PARTIDA</p><h2>{game.players.find(p=>p.id===game.winner!.playerId)?.name} venceu</h2><button onClick={()=>setFinaleClosed(false)}>Ver resultado</button> <button onClick={()=>setChronicleOpen(true)}>Crônica da Partida</button></section>}
    {game.winner&&chronicleOpen&&<AlphaChronicle roomId={room.id} names={Object.fromEntries(game.players.map(p=>[p.id,p.name]))} selfSeat={room.selfPlayerId} onClose={()=>setChronicleOpen(false)}/>}
    {cofreOpen&&<section className="alpha-cofre aoh-popover aoh-glass" aria-label="Cofre">
      <div className="section-head"><p className="aoh-eyebrow">Cofre</p><Segments label="Cofre" value={cofrePage} onChange={setCofrePage} items={[['resources','Recursos'],['limits','Limites']]}/><button type="button" className="aoh-btn is-sm is-ghost" onClick={()=>setCofreOpen(false)}>Fechar</button></div>
      <div className="alpha-cofre-body" key={cofrePage}>{cofrePage==='resources'
        ?<><ResourceDisplay values={game.self.resources} caps={game.storage}/><p className="alpha-line is-muted">Prestígio <b>{game.self.prestige}</b> · Governo {text(civ.government)}</p></>
        :<><ul className="alpha-caps" aria-label="Armazém">{Object.entries(game.self.resources).map(([key,n])=>{const cap=(game.storage as Record<string,number|undefined>)[key];return <li key={key} className={cap!==undefined&&n>=cap?'is-full':''}><span>{key==='materials'?'Madeira/Pedra':resourceLabel(key)}</span><b>{n}{cap!==undefined?` / ${cap}`:''}</b></li>;})}</ul>
          <dl className="alpha-cofre-facts"><div><dt>Administração</dt><dd className={over?'warning':''}>{civ.administrativeLoad} / {civ.administrativeCapacity}{over&&' · sobre-extensão'}</dd></div><div><dt>Ordens</dt><dd>{game.actions.used} / {game.actions.limit} · {game.actions.reserved} planejadas</dd></div></dl></>}</div>
    </section>}
    <div className="alpha-table" data-inspector={panels.inspector?'open':'folded'}>
      <div className="world-column" ref={hostRef}>{game.worldPulse&&(()=>{const card=WORLD_PULSE_CARDS.find(c=>c.id===game.worldPulse!.id),module=card?.modules[0],RES:Record<string,string>={FOOD:'Alimento',WOOD:'Madeira',STONE:'Pedra',METAL:'Metal',WEALTH:'Riqueza',KNOWLEDGE:'Conhecimento',INFLUENCE:'Influência',CULTURE:'Cultura'};const effect=module?.resource?`${module.amount>0?'+':''}${module.amount} ${RES[module.resource]??module.resource} para todos`:'sem efeito nos recursos';return <small className={`alpha-pulse-chip tone-${game.worldPulse!.type}`} title="Pulso do mundo desta rodada: automático, vale para todas as civilizações">Pulso: {game.worldPulse!.name} · {effect}</small>;})()}<ol className="alpha-table-log" aria-label="Crônica da mesa">{game.events.filter(e=>['REGION_REVEALED','CITY_FOUNDED','ROAD_BUILT','WAR_DECLARED','EXPLORE','MOVE','ATTACK','LEGACY_WORK_COMPLETED','THREAT_ASSAULT'].includes(e.type)).slice(-4).map(e=><li key={e.id}><small>R{e.round}</small> {e.message}</li>)}</ol><HexMap data={mapData} board={game.board} seatStatus={seatStatus} plateBubble={bubbles} plateTone={plateTone} onSelfPlate={setCloud} art={{seats:Object.fromEntries(game.players.map((p,i)=>{const kit=civilizationKit(p.civilization);return [p.id,{color:seatColor(i),mark:kit?.mark??null,signature:kit?.signature.item.status==='ACTIVE'?kit.signature.family:null,seat:i}];})),cityMarks:game.cityMarks,discoveries:game.regions.flatMap(r=>r.discovery&&DISCOVERY_INFO[r.discovery.kind]?.marker?[{regionId:r.id,hexIds:r.hexIds,kind:r.discovery.kind,resolved:r.discovery.resolved}]:[]),marks:mapMarks,roads:game.roads,routes:game.routes}} units={game.units} peoples={game.independents} threats={game.threats} resolution={latestReport?.resolution??NO_EVENTS} dangerHexes={dangerHexes} movementCosts={game.rules.movementCosts} draftLegs={table.draftLegs} selected={selected} focus={focus} working={working} worked={worked} onSelect={select} targets={table.targets} orientation={table.orientation} reveal={revealQueue[0]??null} onRevealDone={()=>setRevealQueue(q=>q.slice(1))} onBackground={table.background} onSelectPieces={selectPieces}/>{table.element}<AlphaHand game={game} locked={locked} send={send} seatColor={seatColor(Math.max(0,game.players.findIndex(p=>p.id===room.selfPlayerId)))} onFocus={setCardFocus}/></div>
      {panels.inspector?<aside className="alpha-context alpha-inspector aoh-card aoh-glass" aria-label="Cartão do contexto">
        <div className="alpha-context-head"><div className="inspector-tabs" role="group" aria-label="Contexto">{INSPECTORS.map(([key,title])=><button key={key} aria-pressed={inspector===key} onClick={()=>setInspector(key)}>{title}{key==='military'&&game.self.orders.length>0?` · ${game.self.orders.length}`:''}</button>)}</div><button type="button" className="aoh-btn is-sm is-ghost" aria-label="Fechar cartão" onClick={()=>togglePanel('inspector')}>×</button></div>
        <div className="alpha-panel-body">
        {inspector==='territory'&&<div className="alpha-inspector-body">
          <TerritoryDetails onPing={selected?()=>social({type:'PING',hexId:selected,reaction:'MARK'}):undefined} title={tile?text(tile.terrain):selected?'Fronteira por explorar':'Selecione o mapa'} selected={selected} page={terPage} onPage={setTerPage} yields={tile?.yield??null} tile={tile?{owner:tile.ownerId?game.players.find(p=>p.id===tile.ownerId)?.name??null:null,improvement:tile.improvement?text(tile.improvement):null}:null} sections={[
            ...(raidHere?[{key:'threat' as const,title:raidHere.kind==='PIRATE'?'Piratas':'Ameaça',node:<section className="alpha-people-panel is-raid" aria-label={raidHere.kind==='PIRATE'?'Piratas':raidHere.status==='CAMPED'?'Acampamento de Saqueadores':'Saqueadores em marcha'}><p className="eyebrow">{raidHere.kind==='PIRATE'?(raidHere.status==='CAMPED'?'ANCORADOURO PIRATA':'PIRATAS'):(raidHere.status==='CAMPED'?'ACAMPAMENTO DE SAQUEADORES':'SAQUEADORES EM MARCHA')} · AMEAÇA {['I','II','III'][raidHere.level-1]}</p><p>{raidHere.composition.map(entry=>`${game.rules.units[entry.kind]?.name??entry.kind}${entry.count>1?` ×${entry.count}`:''}`).join(', ')}.</p><p className="alpha-line is-muted">{raidHere.status==='CAMPED'?(raidHere.fresh?'Recém-surgido: ainda não pode partir. Destruído no acampamento, paga recompensa uma vez. Ataque com a Ordem Expedição.':'Destruído no acampamento, paga recompensa uma vez; em marcha, derrotá-lo não rende nada. Ataque com a Ordem Expedição.'):'Avança rumo ao alvo, pilha o que encontra e ataca quem estiver no caminho. Sem recompensa em campo.'}</p>{raidHere.status==='MARCHING'&&<p className="alpha-threat-target">{raidHere.intent.targetKnown?`Alvo: ${raidHere.intent.targetKind==='CITY'?'cidade':raidHere.intent.targetKind==='PORT'?'porto':'rota'} ${raidHere.intent.targetId} · ${raidHere.intent.distance} hex(es).`:raidHere.intent.state==='IDLE'?'Sem alvo alcançável.':'Alvo além da névoa.'}</p>}</section>}]:[]),
            ...(people?[{key:'people' as const,title:'Povo',node:<section className="alpha-people-panel" aria-label="Povo independente"><p className="eyebrow">POVO INDEPENDENTE · {text(people.type).toUpperCase()}</p><p>Atitude: <b>{text(people.attitude)}</b> · Sua influência: <b>{people.yourInfluence}</b>{people.protectorId?` · Protegido por ${game.players.find(p=>p.id===people.protectorId)?.name??'outra civilização'}`:''}</p><p className="alpha-line is-muted">Clique no povo no mapa: Comerciar, Negociar, Influenciar… nascem ao redor dele.</p></section>}]:[]),
            ...(cultureHere?[{key:'culture' as const,title:'Cultura',node:<section className="alpha-people-panel is-culture" aria-label="Presença cultural"><p className="eyebrow">PRESENÇA CULTURAL · {cultureCityName}</p>{cultureHere.foreignPresence.length?<ul className="alpha-relation-list">{cultureHere.foreignPresence.map(presence=><li key={presence.civilizationId}><b>{core10OfChassis(presence.civilizationId)?.name??'Povo local'}</b> · {PRESENCE_LEVEL[presence.level]}{cultureHere.culturalAnchor===presence.civilizationId?' · âncora cultural':''}</li>)}</ul>:<p>Nenhuma civilização estrangeira tem presença aqui.</p>}<p className="alpha-line is-muted">{mineHere?'Disputa: dois dados de cada lado mais o nível de presença, distritos Culturais e a âncora.':cultureHere.currentOwnerId===room.selfPlayerId?'Presenças estrangeiras contam para a Hegemonia cultural e política de quem as mantém.':'Para criar presença, leve um Enviado à cidade ou a um hex vizinho e envie uma missão de influência (em paz).'}</p></section>}]:[]),
            {key:'hex' as const,title:'Hex',node:null}]}/>
        </div>}
        {inspector==='city'&&<div className="alpha-inspector-body">{city?<CityDetails game={game} city={city} locked={locked} send={send} manage={manage} page={cityPage} onPage={setCityPage}/>:<p className="empty-inspector">Selecione uma cidade no atlas ou no Conselho.</p>}</div>}
        {inspector==='military'&&<div className="alpha-inspector-body"><MilitaryDetails game={game} hexId={ownUnits.some(u=>u.hexId===selected)?selected:null} selected={units} onSelect={pick} page={milPage} onPage={setMilPage} orderLabel={orderLabel} locked={locked} send={send}/></div>}
        </div>
      </aside>:<button type="button" className="aoh-btn is-sm alpha-context-open" onClick={()=>togglePanel('inspector')}>Detalhes</button>}
    </div>
    {civOpen&&tab==='world'&&<AlphaCivBoard initialView={civView} game={game} roomId={room.id} selfName={player.name} seatColor={seatOf(room.selfPlayerId).color} cityId={city?.id??null} locked={locked} send={send} manage={manage} onClose={()=>setCivOpen(false)}/>}
    {!civOpen&&game.phase!=='ERA_TURN'&&!replay&&tab==='world'&&!compendiumOpen&&<RegionRevealed reveal={reveal} game={game} locked={locked} send={send}/>}
    {compendiumOpen&&<AlphaCompendium onClose={()=>setCompendiumOpen(false)}/>}
    {!civOpen&&game.phase!=='ERA_TURN'&&!replay&&!(reveal.current&&reveal.current.kind!=='NONE'&&tab==='world'&&!compendiumOpen)&&game.self.pendingChoices[0]&&tab==='world'&&<div className="alpha-parchment-pop"><ChoiceParchment choice={game.self.pendingChoices[0]} locked={locked} send={send}/></div>}
    {tab!=='world'&&<StrategicSurface className="alpha-livro" label="Livro" onClose={()=>setTab('world')}>
      <nav className="alpha-livro-tabs" aria-label="Áreas do Livro">{LIVRO.map(([key,title])=><button key={key} type="button" aria-current={tab===key?'page':undefined} onClick={()=>{if(key==='civilization'||key==='research'){setTab('world');setCivView('web');setCivOpen(true);}else setTab(key);}}>{title}{tabAlerts[key]&&<span className="alpha-tab-alert" aria-hidden="true" title={tabAlerts[key]}/>}</button>)}<button type="button" className="aoh-btn is-sm alpha-livro-close" onClick={()=>setTab('world')}>Voltar ao mapa</button></nav>
      <div className="alpha-tab-body">{tab==='council'?<Pages label="Conselho" pages={[
        {key:'cities',title:`Cidades · ${civ.cities.length}`,node:<div className="alpha-city-grid">{civ.cities.map(c=><button className={`city-link ${city?.id===c.id?'active':''}`} key={c.id} aria-pressed={city?.id===c.id} onClick={()=>{setSelectedCity(c.id);setSelected(c.hexId);setFocus(c.hexId);setInspector('city');}}><b>{c.id===civ.capitalCityId?'★ ':''}{c.name}</b><small>{c.population} habitantes · Desenvolvimento {c.development}</small></button>)}</div>,scroll:true},
        {key:'room',title:'Mesa',alert:!!room.vote||room.selfOnGuard,node:<RoomPanel room={room} send={roomSend}/>,scroll:true},
        {key:'pieces',title:`Peças · ${ownUnits.length}`,node:<ArmyList units={ownUnits} selected={units} onSelect={pick} stacks={game.stacks} rules={game.rules.units} grades={game.grades}/>,scroll:true},
        {key:'posture',title:'Postura defensiva',node:<section><label>Se for atacado, sua civilização adota<select value={game.self.defensePosture} disabled={locked} onChange={e=>void send({type:'SET_DEFENSE_POSTURE',posture:e.target.value})}>{POSTURES.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><small>Escolha privada; só é revelada quando houver batalha.</small></section>},
        {key:'casualties',title:'Prioridade de baixas',node:<CasualtyPriority defaults={game.casualtyDefault} saved={game.self.casualtyPriority} units={ownUnits} locked={locked||game.phase!=='PLANNING'||game.self.ready} send={send}/>,scroll:true},
        {key:'about',title:'Sobre o teste',node:<div className="developer alpha-about"><p>Alpha V1.2 · RC5 de estabilização · Partida {room.id} · Versão {game.version}</p><p>Código para voltar: <code>{room.joinCode}</code></p><button onClick={()=>void navigator.clipboard.writeText(`Ages of Hegemony Alpha V1.2 RC5\nPartida: ${room.id}\nRodada: ${game.view.round}\nTela: ${tab}\nNavegador: ${navigator.userAgent}`).catch(()=>undefined)}>Copiar diagnóstico para feedback</button><p>Diagnóstico contém identificação da partida e navegador; não contém sessão, cartas ou ordens.</p>{feedbackUrl&&<a href={feedbackUrl} target="_blank" rel="noreferrer">Enviar feedback</a>}<p>Ambiente de teste: a partida pode ser reiniciada ou apagada.</p></div>},
      ]}/>
      :tab==='cards'?<AlphaCards game={game} locked={locked} send={send} cityId={city?.id??null}/>
      :tab==='diplomacy'?<AlphaDiplomacy game={game} locked={locked} send={send}/>
      :tab==='reports'?<AlphaReports game={game}/>
      :<AlphaInstitutions game={game} locked={locked} send={send} section={tab==='research'?'research':'era'} cityId={city?.id??null}/>}</div>
    </StrategicSurface>}
    <footer className="alpha-round-bar alpha-tray aoh-tray aoh-glass">
      {checkOpen&&!locked&&planningWarnings.length>0&&<div className="alpha-ready-check" role="dialog" aria-label="Antes de confirmar"><h3>Antes de confirmar</h3><ul>{planningWarnings.map(w=><li key={w}>{w}</li>)}</ul><button className="primary" onClick={()=>{setCheckOpen(false);void send({type:'READY'});}}>Confirmar mesmo assim</button><button onClick={()=>setCheckOpen(false)}>Voltar ao planejamento</button></div>}
      <button type="button" className="alpha-tray-cofre" aria-label="Cofre" title="Cofre: os oito recursos e o limite do armazém. Toque para ver os limites." aria-expanded={cofreOpen} onClick={()=>setCofreOpen(!cofreOpen)}><ResourceDisplay values={game.self.resources} caps={game.storage}/></button>
      <span className="bud">Ordens<b>{game.actions.used} / {game.actions.limit}</b></span>
      <span className="alpha-orders" aria-label="Ordens usadas por tipo">{AlphaOrderTypeSchema.options.filter(type=>game.actions.byOrder[type]>0).map(type=>{const n=game.actions.byOrder[type];return <span key={type} className="alpha-order-chip is-used" title={`${ORDER_NAMES[type]}: ${n}${type==='EXPEDITION'?' · Mover (inclui descobrir), Atacar e Fundar':''}`}>{ORDER_NAMES[type]}<b>{n}</b></span>;})}</span>
      <span className="alpha-tray-ready" role="status">{game.players.filter(p=>p.ready).length} / {game.players.length} prontos</span>
      <details className="alpha-action-queue"><summary>Ordens planejadas {game.actions.reserved} / {game.actions.limit}</summary><div>{planned.map(action=><p key={action.id}><span>{action.label}</span><button disabled={locked} onClick={()=>void send({type:'CANCEL_ORDER',orderId:action.id})}>Cancelar</button></p>)}{planned.length===0&&<small>Nenhuma ação reservada.</small>}</div></details>
      {resolution.length>0&&<details className="alpha-resolution-log"><summary>Última resolução</summary><ol>{resolution.map(event=><li key={event.id}>{event.message}{appliedOf(event,true)}</li>)}</ol></details>}
      {ambitionsPending?<button className="primary advance-phase-btn" disabled={locked} onClick={()=>setAmbitionsLater(false)}>Escolher ambições</button>:<>{game.self.ready&&!game.winner&&<button className="alpha-unready" disabled={busy} title="Retira sua confirmação enquanto outras pessoas decidem" onClick={()=>void send({type:'UNREADY'})}>Voltar a planejar</button>}<button className={`${cardFocus||replay||tab!=='world'||conflictCall||game.phase==='ERA_TURN'||game.winner||(ambitionsPending&&!ambitionsLater)?"":"primary "}advance-phase-btn`} disabled={locked} onClick={()=>{if(game.phase==='PLANNING'&&planningWarnings.length&&!checkOpen){setCheckOpen(true);return;}setCheckOpen(false);void send({type:'READY'});}}>{game.self.ready?'Aguardando outras pessoas':game.phase==='CONFLICTS'?'Passar / pronto':game.phase==='PLANNING'?'Confirmar planejamento':game.phase==='ERA_TURN'?'Confirmar Virada':'Concluir fase'}</button></>}
    </footer>
  </>;
}

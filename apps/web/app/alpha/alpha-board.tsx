'use client';
import { useState } from 'react';
import { ALPHA_CARDS, ALPHA_ERA_NUMERALS, AlphaEraSchema, CIVILIZATIONS, ORDER_NAMES, AlphaOrderTypeSchema, WORLD_PULSE_CARDS, civilizationKit, stackCategory, stackViewVerdict } from '@aoh/game-domain';
import { emblemArt, sealArt, seatColor } from './table-art';
import type { AlphaRoomView } from '@aoh/server/alpha';
import { HexMap } from '../play/hex-map';
import { ResourceDisplay } from '../play/resource-display';
import { alphaLabel as text } from './alpha-copy';
import { ArmyList, compositionText } from './alpha-army';
import { LeaveGame } from './alpha-leave';
import { AlphaGuide } from './alpha-guide';
import { AttackPreview, POSTURES, postureText } from './alpha-combat';
import { AlphaHand } from './alpha-hand';
import { AlphaTour } from './alpha-tour';
import { AlphaEraTurn } from './alpha-era-turn';
import { AmbitionChooser, AlphaCards, AlphaCity, AlphaDiplomacy, AlphaInstitutions, AlphaReports, AlphaUrban } from './alpha-panels';

export type AlphaSend=(command:Record<string,unknown>)=>Promise<boolean>;
type Inspector='city'|'territory'|'military';
/** The Livro (book) opens over the map with the civilization's areas; 'world' means the book is closed and the map leads. */
const LIVRO=[['council','Conselho'],['research','Teia Civilizacional'],['cards','Cartas & Projetos'],['diplomacy','Diplomacia'],['era','Eras & Hegemonia'],['reports','Crônicas']] as const;
/** Desktop only: the council and the inspector can fold away so the atlas gets the room. The choice is a per-browser convenience. */
const PANELS_KEY='aoh-alpha-panels';
function loadPanels():{council:boolean;inspector:boolean}{
  // Without a saved choice, narrow desktops (e.g. 1366×768) start with the Council folded so the atlas leads; pieces can be
  // picked on the map itself.
  // On phones the context card starts closed (it would cover half the map); touching the map opens it.
  const narrow=typeof window!=='undefined'&&window.innerWidth<1400,phone=typeof window!=='undefined'&&window.innerWidth<760;
  try{const stored=localStorage.getItem(PANELS_KEY);if(stored===null)return {council:!narrow,inspector:!phone};const raw=JSON.parse(stored) as Record<string,unknown>;return {council:raw.council!==false,inspector:raw.inspector!==false};}catch{return {council:!narrow,inspector:!phone};}
}
const PRESENCE_LEVEL:Record<string,string>={CONTACT:'contato',ROOTED:'enraizada',PREDOMINANT:'predominante'};
const PEOPLE_ACTIONS:Record<string,string>={TRADE:'Comerciar',NEGOTIATE:'Negociar',INFLUENCE:'Influenciar',PROTECT:'Proteger',INTEGRATE:'Integrar',CONQUER:'Conquistar'};
const INSPECTORS:[Inspector,string][]=[['city','Cidade'],['territory','Território'],['military','Militar']];

/** Same shell as the local slice: top bar, area navigation, council | atlas | inspector, bottom action bar. */
const feedbackUrl=process.env.NEXT_PUBLIC_ALPHA_FEEDBACK_URL||'';
export default function AlphaBoard({room,busy,send,theme,onTheme,onLeave}:{room:AlphaRoomView;busy:boolean;send:AlphaSend;theme:string;onTheme:(theme:string)=>void;onLeave:()=>void}){
  const game=room.game!,player=game.view.player,civ=player.civilization,identity=CIVILIZATIONS.find(c=>c.id===game.self.civilization);
  const [tab,setTab]=useState('world'),[inspector,setInspector]=useState<Inspector>('city'),[selected,setSelected]=useState<string|null>(civ.cities[0]?.hexId??null),[selectedCity,setSelectedCity]=useState(civ.cities[0]?.id??''),[focus,setFocus]=useState<string|null>(civ.cities[0]?.hexId??null);
  const [units,setUnits]=useState<string[]>([]),[path,setPath]=useState<string[]>([]),[pathMode,setPathMode]=useState(false),[rotation,setRotation]=useState(0),[working,setWorking]=useState(false),[worked,setWorked]=useState<string[]>([]),[name,setName]=useState('Novo Horizonte'),[posture,setPosture]=useState('ASSAULT');
  const [tour,setTour]=useState<'tour'|'tips'|null>(null),[cardFocus,setCardFocus]=useState(false),[cofreOpen,setCofreOpen]=useState(false),[panels,setPanels]=useState(loadPanels),[dismissedResolution,setDismissedResolutionState]=useState(()=>{try{return Number(sessionStorage.getItem(`aoh-resolution-seen-${room.id}`)??0);}catch{return 0;}}),[finaleClosed,setFinaleClosed]=useState(false),[checkOpen,setCheckOpen]=useState(false),[guideOpen,setGuideOpen]=useState(false),[ambitionsLater,setAmbitionsLaterState]=useState(()=>{try{return sessionStorage.getItem(`aoh-ambitions-later-${room.id}`)==='1';}catch{return false;}});
  /** A round's results are shown once per browser session, not again on every reload. */
  const setDismissedResolution=(round:number)=>{setDismissedResolutionState(round);try{sessionStorage.setItem(`aoh-resolution-seen-${room.id}`,String(round));}catch{/* storage blocked: shown again after reload */}};
  const setAmbitionsLater=(later:boolean)=>{setAmbitionsLaterState(later);try{sessionStorage.setItem(`aoh-ambitions-later-${room.id}`,later?'1':'0');}catch{/* storage blocked: the choice lasts until reload */}};
  const togglePanel=(key:'council'|'inspector')=>setPanels(old=>{const next={...old,[key]:!old[key]};try{localStorage.setItem(PANELS_KEY,JSON.stringify(next));}catch{/* private mode: keep the choice for this session only */}return next;});
  const locked=busy||game.self.ready||game.view.status==='FINISHED';
  /** The server refuses the first READY until two ambitions are kept, so the board asks for them up front. */
  const ambitionsPending=!game.self.ambitionsChosen&&game.view.round===1&&game.phase==='PLANNING'&&!game.winner;
  const over=civ.administrationStatus==='OVEREXTENDED';
  const city=civ.cities.find(c=>c.id===selectedCity)??civ.cities[0];
  const tile=game.view.visibleTerritory.find(t=>t.id===selected);
  const ownUnits=game.units.filter(u=>u.ownerId===room.selfPlayerId);
  const chosen=ownUnits.filter(u=>units.includes(u.id));
  /** Same arithmetic as the server, computed from the projected stack view before any command is sent. */
  const moveEnd=path.at(-1)??null,moveBlock=moveEnd?stackViewVerdict(game.stacks,chosen.map(u=>stackCategory(game.rules.units[u.kind]!)),moveEnd):null;
  /** Order targets come from the server's per-piece options, so every highlighted hex is one the validators accept. */
  const options=chosen.map(u=>game.unitOptions[u.id]).filter(o=>o!==undefined);
  const origin=chosen[0]?.hexId??null,sameHex=chosen.every(u=>u.hexId===origin);
  const orderedIds=new Set(game.self.orders.flatMap(o=>'unitIds' in o?o.unitIds:'unitId' in o?[o.unitId]:[])),ordered=chosen.filter(u=>orderedIds.has(u.id));
  const targetHexes=chosen.length&&sameHex?[...new Set(options.flatMap(o=>[...Object.keys(o.moves),...(chosen.length===1?o.explore.flatMap(r=>r.hexIds):[])]))]:[];
  const movePath=selected&&chosen.length>0&&sameHex&&options.length===chosen.length&&options.every(o=>o.moves[selected])?options[0]!.moves[selected]!:null;
  const groupBlock=movePath?stackViewVerdict(game.stacks,chosen.map(u=>stackCategory(game.rules.units[u.kind]!)),selected!):null;
  const exploreChoice=chosen.length===1&&selected?options[0]?.explore.find(r=>r.hexIds.includes(selected))??null:null;
  const settle=chosen.length===1&&chosen[0]!.kind==='PIONEER'&&selected===origin?options[0]?.settleBlock??null:undefined;
  const foreignCity=game.view.visibleCities.find(c=>c.hexId===selected);
  const foreignHere=!!selected&&(!!foreignCity||game.units.some(u=>u.hexId===selected&&u.ownerId!==room.selfPlayerId));
  const fighters=chosen.every(u=>(game.rules.units[u.kind]?.strength??0)>0);
  const coords=(id:string|null)=>{const [q,r]=(id??'').split(',').map(Number);return {q:q??0,r:r??0};};
  const adjacent=!!selected&&!!origin&&(()=>{const a=coords(origin),b=coords(selected);return (Math.abs(a.q-b.q)+Math.abs(a.q+a.r-b.q-b.r)+Math.abs(a.r-b.r))/2===1;})();
  const defenderId=foreignCity?.ownerId??game.units.find(u=>u.hexId===selected&&u.ownerId!==room.selfPlayerId)?.ownerId;
  const hostile=!!defenderId&&(game.wars.some(pair=>pair.includes(defenderId))||game.self.plannedActions.some(a=>a.type==='DECLARE_WAR'&&a.targetId===defenderId));
  const defenderName=game.players.find(p=>p.id===defenderId)?.name??'esta civilização';
  const envoyMission=chosen.length===1&&chosen[0]!.kind==='ENVOY'&&!!foreignCity&&adjacent;
  const targetName=!selected?'nenhum':foreignCity?`${foreignCity.name} (${game.players.find(p=>p.id===foreignCity.ownerId)?.name??'estrangeira'})`:tile?`${text(tile.terrain)} · ${selected}${defenderId?` · peças de ${defenderName}`:''}`:`Região desconhecida · ${selected}`;
  /** "Movimento · Pioneiro → 4,6": what moves, and where, instead of the bare order type. */
  const orderLabel=(order:typeof game.self.orders[number])=>{
    const ids='unitIds' in order?order.unitIds:'unitId' in order?[order.unitId]:[];
    const who=ids.length?compositionText(game.units.filter(u=>ids.includes(u.id))):'';
    const where=order.type==='MOVE'?order.path.at(-1):order.type==='TRADE'?civ.cities.find(c=>c.id===order.fromCityId)?.name:order.target;
    return `${text(order.type)}${who?` · ${who}`:''}${where?` → ${where}`:''}`;
  };
  const manage=(command:Record<string,unknown>)=>send({type:'MANAGE',command:{...command,playerId:room.selfPlayerId,expectedVersion:game.view.version}});
  const queue=(order:Record<string,unknown>)=>send({type:'QUEUE_ORDER',order:{...order,id:`order-${game.version}-${game.self.orders.length}`}});
  const known=game.knownTerritory.map(t=>({...t,ownerId:null,controllerCityId:null,improvement:null,yield:null,yieldError:null}));
  const unknown=game.frontier.map(t=>({...t,terrain:'UNKNOWN' as const,features:[],ownerId:null,controllerCityId:null,improvement:null,yield:null,yieldError:null}));
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
  const orderedNow=new Set(game.self.orders.flatMap(o=>'unitIds' in o?o.unitIds:'unitId' in o?[o.unitId]:[]));
  const planningWarnings=game.phase!=='PLANNING'?[]:[
    ...game.cityStates.filter(c=>c.status!=='OCCUPIED'&&c.plannedUrbanActions===0).map(c=>`${civ.cities.find(x=>x.id===c.cityId)?.name??'Uma cidade'} não tem ação planejada: não produz nesta rodada.`),
    ...game.threatAlerts.map(alert=>`${alert.kind==='PIRATE'?'Piratas':'Um bando'} a ${alert.distance} hex(es) de ${civ.cities.find(x=>x.id===alert.cityId)?.name??'uma cidade'}: reforce a defesa ou ataque-o.`),
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
  const latestReport=game.roundReports.at(-1),replay=!conflictCall&&!game.winner&&latestReport&&latestReport.resolution.length>0&&latestReport.round>dismissedResolution?latestReport:null;
  const resolution=latestReport?.resolution.slice(-8)??[];
  /** Results on their targets: during the round's resolution, a halo and tag on each event's hex; while a card's round bonus
   * lasts, a seal on the pieces it strengthens or speeds (not only a toast). */
  const EVENT_TAG:Record<string,string>={MOVEMENT:'Movimento',EXPLORATION:'Exploração',FOUNDATION:'Fundação',PRODUCTION:'Produção',CONSTRUCTION:'Obra',RECRUITMENT:'Recrutamento',RESEARCH:'Pesquisa',TRADE:'Comércio',INFLUENCE:'Influência',COMBAT:'Combate',LOSSES:'Perdas',RETREAT:'Recuo',ADVANCE:'Avanço',FAILURE:'Não ocorreu',ROUND_EVENT:'Evento'};
  const bonuses=game.self.temporaryEffects.filter(entry=>entry.round===game.view.round&&(entry.effect.kind==='STRENGTH'||entry.effect.kind==='MOVEMENT'));
  const bonusTotal=(kind:string)=>bonuses.filter(entry=>entry.effect.kind===kind).reduce((total,entry)=>total+('amount' in entry.effect?entry.effect.amount:0),0);
  const mapMarks=[
    ...game.cityMarks.filter(mark=>mark.blockaded).map(mark=>({hexId:mark.hexId,label:'Porto bloqueado',tone:'loss' as const})),
    ...(replay?replay.resolution.filter(event=>event.hexId).map(event=>({hexId:event.hexId!,label:EVENT_TAG[event.type]??text(event.type),tone:(event.type==='LOSSES'||event.type==='FAILURE'?'loss':'event') as 'loss'|'event'})):[]),
    ...[...new Set(ownUnits.map(u=>u.hexId))].flatMap(hexId=>{const here=ownUnits.filter(u=>u.hexId===hexId),fights=here.some(u=>(game.rules.units[u.kind]?.strength??0)>0);return [
      ...(fights&&bonusTotal('STRENGTH')?[{hexId,label:`+${bonusTotal('STRENGTH')} Força`,tone:'card' as const}]:[]),
      ...(bonusTotal('MOVEMENT')?[{hexId,label:`+${bonusTotal('MOVEMENT')} mov.`,tone:'card' as const}]:[])];}),
  ];
  const mapData={view:{...game.view,era:game.self.era,visibleTerritory:[...game.view.visibleTerritory,...known,...unknown]},players:game.players,claimable:chosen.length?targetHexes:inspector==='territory'&&city?(game.claimOptions[city.id]??[]):[],workable:city?game.view.visibleTerritory.filter(t=>t.controllerCityId===city.id).map(t=>t.id):[]};
  /** The inspector follows what the player just touched, except while a map interaction is in progress. */
  const follow=(hexId:string|null,pieces:number)=>{
    if(working||pathMode)return;
    setInspector(pieces>0?'military':civ.cities.some(c=>c.hexId===hexId)?'city':'territory');
  };
  function select(id:string){
    setSelected(id);const target=civ.cities.find(c=>c.hexId===id);if(target)setSelectedCity(target.id);
    // Touching the map brings its card back if it was closed.
    if(!panels.inspector)setPanels(old=>({...old,inspector:true}));
    if(pathMode)setPath(old=>[...old,id]);if(working&&(mapData.workable as string[]).includes(id))setWorked(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);
    // A hex holding own pieces (outside a city) opens the military inspector with that stack ready to select.
    follow(id,units.length>0||(!civ.cities.some(c=>c.hexId===id)&&ownUnits.some(u=>u.hexId===id))?1:0);
  }
  function pick(ids:string[],on:boolean,hexId:string){
    const next=on?[...new Set([...units,...ids])]:units.filter(id=>!ids.includes(id));
    setUnits(next);setFocus(hexId);setSelected(hexId);follow(hexId,next.length);
  }
  const eraNumeral=ALPHA_ERA_NUMERALS[AlphaEraSchema.options.indexOf(game.self.era)]??'';
  const seatOf=(id:string)=>{const index=Math.max(0,game.players.findIndex(p=>p.id===id)),kit=civilizationKit(game.players[index]?.civilization);return {color:seatColor(index),mark:kit?.mark??null};};
  const self=seatOf(room.selfPlayerId),livroAlert=Object.values(tabAlerts).some(Boolean);
  const shortage=game.cityDetails.some(c=>c.growth.civilization.shortage);
  return <>
    <header className="alpha-strip alpha-player-board aoh-strip aoh-glass">
      <div className="alpha-strip-civ">{self.mark&&<svg width="34" height="34" viewBox="-17 -17 34 34" aria-hidden="true" dangerouslySetInnerHTML={{__html:sealArt(self.mark,self.color,13)}}/>}<div><h1>{identity?.name??player.name}</h1><small>{player.name}</small></div></div>
      <div className="alpha-strip-when"><span>Era <b className="aoh-numeral">{eraNumeral}<span className="era-name"> · {text(game.self.era)}</span></b> · Rodada <b className="aoh-numeral">{game.view.round} / {game.rules.roundLimit}</b> · <span className="alpha-resonance" title={`Ressonância: ${game.self.resonance.slots.length} de 5 encaixes. No quinto, uma Repercussão.`} aria-label={`Ressonância ${game.self.resonance.slots.length} de 5`}>{Array.from({length:5},(_,i)=>{const slot=game.self.resonance.slots[i];return <i key={i} className={`alpha-socket${slot?` is-full d-${slot.domains[0]}${slot.domains[1]?` d2-${slot.domains[1]}`:''}`:''}`}/>})}{game.self.pendingChoices.length>0&&<b className="aoh-numeral alpha-socket-pending" title="Decisão pendente de Repercussão">!</b>}</span></span><span className={`aoh-tag${replay?' is-warn':''}`}>{replay?'Resolvendo a rodada':text(game.phase)}{room.deadline&&` · até ${new Date(room.deadline).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`}</span></div>
      <ol className="alpha-strip-seals" aria-label="Iniciativa">{game.initiative.map(id=>{const seat=seatOf(id),who=game.players.find(p=>p.id===id);return <li key={id} className={`aoh-seal${id===room.selfPlayerId?' is-self':''}`} style={{['--seat' as string]:seat.color}} title={`${who?.name??''} · ${CIVILIZATIONS.find(c=>c.id===who?.civilization)?.name??''}${who?.ready?' · pronto':''}`}>{seat.mark&&<svg width="22" height="22" viewBox="-12 -12 24 24" aria-hidden="true" dangerouslySetInnerHTML={{__html:emblemArt(seat.mark.emblem,0,0,.75,seat.color,2)}}/>}<span className="alpha-sr-only">{who?.name}</span>{game.phase==='PLANNING'&&<span className="st">{who?.ready?'✓':'…'}</span>}</li>;})}</ol>
      {(over||shortage)&&<span className="aoh-chip alpha-strip-alert">{over?'Sobre-extensão':'Alimento curto'}</span>}
      <div className="alpha-strip-tools">
        <button type="button" className="aoh-btn is-sm" aria-expanded={cofreOpen} onClick={()=>setCofreOpen(!cofreOpen)}>Cofre</button>
        <button type="button" className="aoh-btn is-sm alpha-livro-button" aria-expanded={tab!=='world'} onClick={()=>setTab(tab==='world'?'council':'world')}>Livro{livroAlert&&<span className="alpha-tab-alert" aria-hidden="true"/>}</button>
        <button type="button" className="aoh-btn is-sm is-ghost alpha-guide-button" onClick={()=>setTour('tips')}>Dicas</button><button type="button" className="aoh-btn is-sm is-ghost alpha-guide-button" onClick={()=>setGuideOpen(true)}>Como jogar</button>
        <LeaveGame joinCode={room.joinCode} onLeave={onLeave}/>
        <label className="alpha-theme">Tema <select value={theme} onChange={e=>onTheme(e.target.value)}><option value="SYSTEM">Sistema</option><option value="DARK">Escuro</option><option value="LIGHT">Claro</option></select></label>
      </div>
    </header>
    {replay&&<section className="alpha-resolution-phase" role="status" aria-label="Resolvendo a rodada"><p className="eyebrow">RESOLVENDO A RODADA {replay.round}</p><h2>Resultados autorizados</h2><ol>{replay.resolution.map(event=><li key={event.id}><b>{text(event.type)}</b><span>{event.message}</span></li>)}</ol><button className="primary" onClick={()=>setDismissedResolution(replay.round)}>Continuar</button></section>}
    {ambitionsPending&&!ambitionsLater&&!replay&&<div className="alpha-modal-backdrop"><section className="alpha-modal" role="dialog" aria-modal="true" aria-labelledby="alpha-ambitions-title"><p className="eyebrow">ANTES DO PRIMEIRO PLANEJAMENTO</p><AmbitionChooser game={game} locked={locked} send={send}/><button type="button" onClick={()=>setAmbitionsLater(true)}>Ver o mapa primeiro</button><button type="button" onClick={()=>{setAmbitionsLater(true);setGuideOpen(true);}}>Como jogar</button></section></div>}
    {guideOpen&&<AlphaGuide game={game} onClose={()=>setGuideOpen(false)}/>}
    {!game.winner&&!(ambitionsPending&&!ambitionsLater)&&<AlphaTour game={game} roomId={room.id} open={tour} onOpenChange={setTour}/>}
    {conflictCall&&<section className="alpha-conflict-call" role="alert" aria-label="Conflitos da rodada"><p className="eyebrow">CONFLITOS DA RODADA {game.view.round}</p><h2>{game.incomingAttacks.length?'Sua civilização está sendo atacada':'Seu ataque aguarda reações'}</h2>
      {game.incomingAttacks.map(a=><p key={`${a.attackerId}-${a.target}`}><b>{game.players.find(p=>p.id===a.attackerId)?.name}</b> ataca suas posições em <b>{a.target}</b>.</p>)}
      {game.self.orders.filter(o=>o.type==='ATTACK').map(o=><p key={o.id}>Seu ataque em <b>{o.type==='ATTACK'?o.target:''}</b> é resolvido depois das reações.</p>)}
      {reactions.length>0?<><p>Uma carta de reação soma Força aos seus conflitos desta rodada, antes dos dados. Restam {Math.max(0,game.rules.cardsPerRound-game.self.cardsPlayed)} carta(s) nesta rodada.</p><div className="alpha-card-row">{reactions.map(card=><article className="alpha-card" key={card.id}><h4>{card.name}</h4><p>+{card.effect?.amount??0} Força nesta rodada</p><button disabled={busy} onClick={()=>void send({type:'PLAY_CARD',cardId:card.id})}>Jogar reação</button></article>)}</div></>:<p>Você não tem cartas de reação.</p>}
      <button className="primary" disabled={busy} onClick={()=>void send({type:'READY'})}>Seguir para os dados</button></section>}
    {game.phase==='ERA_TURN'&&!game.winner&&<AlphaEraTurn game={game} locked={locked} busy={busy} send={send}/>}
    {game.winner&&!finaleClosed&&<div className="alpha-modal-backdrop"><section className="alpha-modal alpha-finale-panel" role="dialog" aria-modal="true" aria-labelledby="alpha-finale-title"><p className="eyebrow">FIM DA PARTIDA · RODADA {game.winner.round}</p>
      <h2 id="alpha-finale-title">{game.winner.playerId===room.selfPlayerId?'Sua civilização venceu':`${game.players.find(p=>p.id===game.winner!.playerId)?.name} venceu`}</h2>
      <p>{game.winner.reason==='HEGEMONY'?`Hegemonia ${text(game.finalStandings.find(s=>s.playerId===game.winner!.playerId)?.hegemony??'')} consolidada.`:`Maior Prestígio ao fim das ${game.rules.roundLimit} rodadas.`}</p>
      <div className="table-scroll"><table className="alpha-standings"><thead><tr><th>#</th><th>Civilização</th><th>Prestígio</th><th>Pesquisas</th><th>População</th><th>Riqueza</th><th>Cidades</th></tr></thead><tbody>{game.finalStandings.map((s,i)=><tr key={s.playerId} className={s.playerId===room.selfPlayerId?'is-self':''}><td>{i+1}</td><th>{s.name}<small>{CIVILIZATIONS.find(c=>c.id===s.civilization)?.name}</small></th><td>{s.prestige}</td><td>{s.research}</td><td>{s.population}</td><td>{s.wealth}</td><td>{s.cities}</td></tr>)}</tbody></table></div>
      <p className="alpha-hint">Ordem: Prestígio; empates por pesquisas, população, riqueza e, por fim, ordem de iniciativa.</p>
      <div className="alpha-finale-actions"><button className="primary" onClick={onLeave}>Nova partida</button><button onClick={()=>{setFinaleClosed(true);setTab('reports');}}>Ver crônicas</button><button onClick={()=>setFinaleClosed(true)}>Ver o mapa final</button></div></section></div>}
    {game.winner&&finaleClosed&&<section className="alpha-finale" role="status"><p className="eyebrow">FIM DA PARTIDA</p><h2>{game.players.find(p=>p.id===game.winner!.playerId)?.name} venceu</h2><button onClick={()=>setFinaleClosed(false)}>Ver resultado</button></section>}
    {cofreOpen&&<section className="alpha-cofre aoh-popover aoh-glass" aria-label="Cofre">
      <div className="section-head"><p className="aoh-eyebrow">Cofre</p><button type="button" className="aoh-btn is-sm is-ghost" onClick={()=>setCofreOpen(false)}>Fechar</button></div>
      <ResourceDisplay values={game.self.resources} caps={game.storage}/>
      <dl className="alpha-cofre-facts"><div><dt>Administração</dt><dd className={over?'warning':''}>{civ.administrativeLoad} / {civ.administrativeCapacity}{over&&' · sobre-extensão'}</dd></div><div><dt>Ordens</dt><dd>{game.actions.used} / {game.actions.limit} · {game.actions.reserved} planejadas</dd></div><div><dt>Prestígio</dt><dd>{game.self.prestige}</dd></div><div><dt>Governo</dt><dd>{text(civ.government)}</dd></div></dl>
    </section>}
    <div className="alpha-table">
      <div className="world-column">{game.worldPulse&&(()=>{const card=WORLD_PULSE_CARDS.find(c=>c.id===game.worldPulse!.id),module=card?.modules[0],RES:Record<string,string>={FOOD:'Alimento',WOOD:'Madeira',STONE:'Pedra',METAL:'Metal',WEALTH:'Riqueza',KNOWLEDGE:'Conhecimento',INFLUENCE:'Influência',CULTURE:'Cultura'};const effect=module?.resource?`${module.amount>0?'+':''}${module.amount} ${RES[module.resource]??module.resource} para todos`:'sem efeito nos recursos';return <small className={`alpha-pulse-chip tone-${game.worldPulse!.type}`} title="Pulso do mundo desta rodada: automático, vale para todas as civilizações">Pulso: {game.worldPulse!.name} · {effect}</small>;})()}<HexMap data={mapData} art={{seats:Object.fromEntries(game.players.map((p,i)=>{const kit=civilizationKit(p.civilization);return [p.id,{color:seatColor(i),mark:kit?.mark??null,signature:kit?.signature.item.status==='ACTIVE'?kit.signature.family:null}];})),cityMarks:game.cityMarks,marks:mapMarks,roads:game.roads,routes:game.routes}} units={game.units} peoples={game.independents} threats={game.threats} selected={selected} focus={focus} working={working} worked={worked} onSelect={select}/><AlphaHand game={game} locked={locked} send={send} seatColor={seatColor(Math.max(0,game.players.findIndex(p=>p.id===room.selfPlayerId)))} onFocus={setCardFocus}/></div>
      {panels.inspector?<aside className="alpha-context alpha-inspector aoh-card aoh-glass" aria-label="Cartão do contexto">
        <div className="alpha-context-head"><div className="inspector-tabs" role="group" aria-label="Contexto">{INSPECTORS.map(([key,title])=><button key={key} aria-pressed={inspector===key} onClick={()=>setInspector(key)}>{title}{key==='military'&&game.self.orders.length>0?` · ${game.self.orders.length}`:''}</button>)}</div><button type="button" className="aoh-btn is-sm is-ghost" aria-label="Fechar cartão" onClick={()=>togglePanel('inspector')}>×</button></div>
        <div className="alpha-panel-body">
        {inspector==='territory'&&<div className="alpha-inspector-body">
          {people&&<section className="alpha-people-panel" aria-label="Povo independente"><p className="eyebrow">POVO INDEPENDENTE · {text(people.type).toUpperCase()}</p><p>Atitude: <b>{text(people.attitude)}</b> · Sua influência: <b>{people.yourInfluence}</b>{people.protectorId?` · Protegido por ${game.players.find(p=>p.id===people.protectorId)?.name??'outra civilização'}`:''}</p>
            {people.actions.map(option=><div className="alpha-people-option" key={option.action}><button disabled={locked||option.blocked!==null} onClick={()=>void send({type:'INDEPENDENT_ACTION',peopleId:people.id,action:option.action})}>{PEOPLE_ACTIONS[option.action]}</button>{option.cost&&<ResourceDisplay values={option.cost} compact/>}<small>{option.effect}{option.blocked&&<em> {option.blocked}</em>}</small></div>)}
            <p className="alpha-hint">Cada ação com um povo usa 1 ação principal e vale na hora.</p></section>}
          {cultureHere&&<section className="alpha-people-panel is-culture" aria-label="Presença cultural"><p className="eyebrow">PRESENÇA CULTURAL · {cultureCityName}</p>
            {cultureHere.foreignPresence.length?<ul className="alpha-relation-list">{cultureHere.foreignPresence.map(presence=><li key={presence.civilizationId}><b>{CIVILIZATIONS.find(c=>c.id===presence.civilizationId)?.name??'Povo local'}</b> · {PRESENCE_LEVEL[presence.level]}{cultureHere.culturalAnchor===presence.civilizationId?' · âncora cultural':''}{mineHere&&presence.civilizationId!==myCulture&&<button disabled={locked||game.phase!=='PLANNING'} onClick={()=>void send({type:'CONTEST_PRESENCE',cityId:cultureHere.cityId,defenderCivilizationId:presence.civilizationId})}>Disputar · 1 ação</button>}</li>)}</ul>:<p>Nenhuma civilização estrangeira tem presença aqui.</p>}
            <p className="alpha-hint">{mineHere?'Disputa: dois dados de cada lado mais o nível de presença, distritos Culturais (até 3) e a âncora. Quem vence sobe um nível; quem perde desce ou sai.':cultureHere.currentOwnerId===room.selfPlayerId?'Presenças estrangeiras contam para a Hegemonia cultural e política de quem as mantém.':'Para criar presença, leve um Enviado até a cidade ou a um hex vizinho e envie uma missão de influência (em paz).'}</p></section>}
          {raidHere&&<section className="alpha-people-panel is-raid" aria-label={raidHere.kind==='PIRATE'?'Piratas':raidHere.status==='CAMPED'?'Acampamento':'Bando em marcha'}><p className="eyebrow">{raidHere.kind==='PIRATE'?(raidHere.status==='CAMPED'?'ANCORADOURO PIRATA':'PIRATAS'):(raidHere.status==='CAMPED'?'ACAMPAMENTO':'BANDO EM MARCHA')} · AMEAÇA {['I','II','III'][raidHere.level-1]}</p><p>{raidHere.composition.map(entry=>`${game.rules.units[entry.kind]?.name??entry.kind}${entry.count>1?` ×${entry.count}`:''}`).join(', ')}.</p><p>{raidHere.status==='CAMPED'?'Destruído ainda no acampamento, paga recompensa uma única vez; se partir em marcha, derrotá-lo em campo não rende nada. Ataque com a Ordem Expedição.':'Avança um hex por rodada rumo à cidade mais próxima, pilha o que encontra e ataca quem estiver no caminho. Derrotá-lo em campo não rende recompensa.'}</p></section>}
          <h2>{tile?text(tile.terrain):selected?'Fronteira por explorar':'Selecione o mapa'}</h2><p>{selected}</p>{tile?.yield&&<ResourceDisplay values={tile.yield} compact labels={{materials:'Madeira/Pedra'}}/>}{tile&&<p>{tile.ownerId?`Território de ${game.players.find(p=>p.id===tile.ownerId)?.name}`:'Território livre'} · {tile.improvement?text(tile.improvement):'Sem melhoria'}</p>}
          {city&&<>{!working&&<><p className="alpha-hint">Hexes destacados podem ser reivindicados por {city.name} (troque a cidade no Conselho).</p>{tile&&!tile.ownerId&&selected&&!(game.claimOptions[city.id]??[]).includes(selected)&&<p className="alpha-warning">Fora do alcance de {city.name}, sem ligação com o território dela ou sem Influência suficiente.</p>}<button disabled={locked||!selected||!(game.claimOptions[city.id]??[]).includes(selected)} onClick={()=>void manage({type:'CLAIM_HEX',cityId:city.id,hexId:selected})}>Reivindicar para {city.name}</button><ResourceDisplay values={game.costs.claim} compact/></>}
            <button disabled={locked} onClick={()=>{setWorking(!working);setWorked(city.workedHexIds);}}> {working?'Cancelar atribuição':'Escolher territórios trabalhados'}</button>{working&&<div><p className="alpha-hint">Clique nos hexes destacados do território de {city.name}. Cada Produtor trabalha um hex; reivindique hexes para ter mais opções.</p><p>{worked.length} territórios selecionados · {city.workers.producers} Produtores</p><button disabled={locked} onClick={()=>void manage({type:'ASSIGN_WORKED_HEXES',cityId:city.id,hexIds:worked}).then(ok=>{if(ok)setWorking(false);})}>Confirmar trabalho</button></div>}</>}
          {tile?.ownerId===room.selfPlayerId&&<details><summary>Melhorias e estradas</summary>{Object.entries(game.view.config.territory.improvementCatalog).map(([kind])=><div className="alpha-option" key={kind}><button disabled={locked} onClick={()=>void manage({type:'IMPROVE_HEX',hexId:selected,improvement:kind})}>{text(kind)}</button><ResourceDisplay values={game.costs.improvements[kind]!} compact/></div>)}<button disabled={locked} onClick={()=>void send({type:'BUILD_ROAD',hexId:selected})}>Construir estrada</button><ResourceDisplay values={game.costs.road} compact/></details>}
        </div>}
        {inspector==='city'&&<div className="alpha-inspector-body">{city?<>
          <AlphaUrban key={city.id} game={game} locked={locked} send={send} cityId={city.id}/>
          <AlphaCity key={`${city.id}-${city.population}-${JSON.stringify(city.workers)}`} game={game} city={city} locked={locked} send={send} manage={manage}/></>:<p className="empty-inspector">Selecione uma cidade no atlas ou no Conselho.</p>}</div>}
        {inspector==='military'&&<div className="alpha-inspector-body">
          {chosen.length>0?<section className="alpha-order-builder">
            <div className="section-head"><h3>{chosen.length===1?text(chosen[0]!.kind):`Planejar com ${chosen.length} peça(s)`}</h3><button type="button" onClick={()=>{setUnits([]);follow(selected,0);}}>Limpar seleção</button></div>
            <p className="alpha-army-summary">{compositionText(chosen)}</p>
            {ordered.length>0&&<p className="alpha-warning" role="alert">{ordered.length===chosen.length?'Esta seleção já tem ordem nesta rodada.':'Parte da seleção já tem ordem nesta rodada.'} Cada peça recebe uma ordem por rodada; cancele a reservada para trocar.</p>}
            <p className="alpha-target">Alvo: <b>{selected===origin?'posição atual':targetName}</b></p>
            {settle!==undefined&&<div className="alpha-order-choice"><h4>Fundar cidade aqui</h4>{settle?<p className="alpha-warning">{settle}</p>:<><label>Nome da nova cidade<input value={name} maxLength={80} onChange={e=>setName(e.target.value)}/></label><button className="alpha-recommended" disabled={locked||!name.trim()} onClick={()=>void send({type:'SETTLE',unitId:units[0],name})}>Fundar cidade</button><ResourceDisplay values={game.costs.founding} compact/></>}</div>}
            {exploreChoice&&<div className="alpha-order-choice"><h4>Explorar esta região</h4><p>Revela os 7 hexes da região na resolução. A peça não se move.</p><button className="alpha-recommended" disabled={locked||ordered.length>0} onClick={()=>void queue({type:'EXPLORE',unitId:units[0],target:exploreChoice.target,rotation})}>Explorar região</button>
              <details><summary>Orientação da região</summary><label>Se ninguém explorou a região, você escolhe como ela é girada<select value={rotation} onChange={e=>setRotation(Number(e.target.value))}>{[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n*60}°</option>)}</select></label></details></div>}
            {movePath&&<div className="alpha-order-choice"><h4>Mover para cá</h4><p>{movePath.length} {movePath.length===1?'passo':'passos'} pelo caminho mais curto conhecido.</p>{groupBlock&&<p className="alpha-warning" role="alert">{groupBlock}</p>}<button className="alpha-recommended" disabled={locked||ordered.length>0||groupBlock!==null} onClick={()=>void queue({type:'MOVE',unitIds:units,path:movePath})}>Reservar movimento</button></div>}
            {(()=>{
              // Naval slice (DEC-014): board an adjacent own fleet, or step from it onto the selected land hex.
              const carried=chosen.length>0&&chosen.every(u=>!!u.carrierId),fleets=chosen.length&&!carried?options.reduce<string[]|null>((common,o)=>common===null?[...o.embark]:common.filter(id=>o.embark.includes(id)),null)??[]:[];
              const landing=carried&&!!selected&&options.length===chosen.length&&options.every(o=>o.disembark.includes(selected));
              if(carried)return <div className="alpha-order-choice"><h4>Desembarque</h4><p>{landing?`As peças deixam a frota e ocupam ${selected}. Para tomar um hex ocupado, ordene um ataque anfíbio (−1 de Força).`:'Selecione no mapa um hex de terra vizinho à frota.'}</p><button className="alpha-recommended" disabled={locked||!landing} onClick={()=>void send({type:'DISEMBARK',unitIds:units,hexId:selected})}>Desembarcar · 1 ação</button></div>;
              const home=chosen.length===1&&!carried&&game.cityMarks.some(mark=>mark.ownerId===room.selfPlayerId&&mark.hexId===chosen[0]!.hexId)&&game.rules.units[chosen[0]!.kind]?.domain==='LAND'&&(game.rules.units[chosen[0]!.kind]?.strength??0)>0;
              if(home)return <div className="alpha-order-choice"><h4>Desmobilizar</h4><p>A peça volta à cidade como um habitante Disponível (Ordem Expedição). Fora de uma cidade própria, uma peça perdida não volta.</p><button disabled={locked} onClick={()=>void send({type:'DEMOBILIZE',unitId:units[0]})}>Desmobilizar · 1 Ordem</button>{fleets.length>0&&fleets.map(id=><button key={id} disabled={locked} onClick={()=>void send({type:'EMBARK',unitIds:units,fleetId:id})}>Embarcar em {text(game.units.find(u=>u.id===id)?.kind??'FLEET')} · 1 Ordem</button>)}</div>;
              if(!fleets.length)return null;
              return <div className="alpha-order-choice"><h4>Embarque</h4><p>As peças sobem na frota e passam a navegar com ela. Infantaria, Guarda, Arqueiros e civis ocupam 1 vaga; Cavalaria e Cerco, 2.</p>{fleets.map(id=><button key={id} disabled={locked} onClick={()=>void send({type:'EMBARK',unitIds:units,fleetId:id})}>Embarcar em {text(game.units.find(u=>u.id===id)?.kind??'FLEET')} ({game.units.find(u=>u.id===id)?.hexId}) · 1 ação</button>)}</div>;
            })()}
            {envoyMission&&<div className="alpha-order-choice"><h4>Missão de influência</h4><p>O Enviado estabelece presença cultural da sua civilização em {foreignCity!.name} na resolução. Exige paz; até 3 civilizações podem ter presença numa cidade.</p><button className="alpha-recommended" disabled={locked||ordered.length>0} onClick={()=>void queue({type:'INFLUENCE',unitId:units[0],target:selected})}>Enviar missão</button></div>}
            {foreignHere&&<div className="alpha-order-choice"><h4>Atacar</h4>{!fighters?<p>Peças civis não participam de ataques.</p>:!adjacent?<p>O alvo precisa estar a 1 hex das peças selecionadas.</p>:!hostile?<p>Você está em paz com {defenderName}. Planeje uma declaração de guerra em Diplomacia; ela é resolvida antes dos conflitos, então o ataque pode ser na mesma rodada. <button type="button" onClick={()=>setTab('diplomacy')}>Abrir Diplomacia</button></p>:<div className="alpha-form-row">
              <label>Postura do ataque<select value={posture} onChange={e=>setPosture(e.target.value)}>{POSTURES.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
              <button className="alpha-recommended" disabled={locked||ordered.length>0} onClick={()=>void queue({type:'ATTACK',unitIds:units,target:selected,posture})}>Ordenar ataque</button></div>}</div>}
            {!movePath&&!exploreChoice&&!foreignHere&&settle===undefined&&<p className="alpha-hint">{!sameHex?'Peças em hexes diferentes: selecione um grupo de cada vez.':selected===origin?'Clique num hex destacado no mapa: destinos alcançáveis nesta rodada e regiões que esta peça pode explorar.':'Fora do alcance nesta rodada. Os hexes destacados no mapa são alcançáveis ou exploráveis.'}</p>}
            <details><summary>Ordens avançadas · influência, caminho manual</summary>
              <button disabled={locked||units.length!==1||!selected} onClick={()=>void queue({type:'INFLUENCE',unitId:units[0],target:selected})}>Missão de influência no alvo</button>
              <button aria-pressed={pathMode} disabled={locked} onClick={()=>{setPathMode(!pathMode);setPath([]);}}>{pathMode?'Sair da seleção de caminho':'Traçar caminho hex a hex'}</button>
              {pathMode&&<><p>{path.length?path.join(' · '):'Clique em cada hex do caminho, em ordem.'}</p>{moveBlock&&<p className="alpha-warning" role="alert">{moveBlock}</p>}<button disabled={locked||!path.length||moveBlock!==null} onClick={()=>void queue({type:'MOVE',unitIds:units,path}).then(ok=>{if(ok){setPathMode(false);setPath([]);}})}>Reservar movimento</button></>}
            </details>
          </section>:ownUnits.some(u=>u.hexId===selected)?<section className="alpha-order-builder"><p className="alpha-hint">Peças suas neste hex: selecione-as para planejar.</p><ArmyList units={ownUnits.filter(u=>u.hexId===selected)} selected={units} onSelect={pick} stacks={game.stacks} rules={game.rules.units} grades={game.grades}/></section>:<p className="alpha-hint">Clique num hex com peças suas, ou selecione-as no Conselho, para planejar movimento, exploração, fundação ou ataque.</p>}
          <h3>Ordens reservadas</h3>{game.self.orders.map(o=><div className="alpha-order" key={o.id}><span>{orderLabel(o)}{o.type==='ATTACK'?` · ${postureText(o.posture)}`:''}</span><button disabled={locked} onClick={()=>void send({type:'CANCEL_ORDER',orderId:o.id})}>Cancelar</button>{o.type==='ATTACK'&&game.orderPreviews[o.id]&&<AttackPreview preview={game.orderPreviews[o.id]!}/>}</div>)}{game.self.orders.length===0&&<p>Nenhuma ordem reservada.</p>}
        </div>}
        </div>
      </aside>:<button type="button" className="aoh-btn is-sm alpha-context-open" onClick={()=>togglePanel('inspector')}>Abrir cartão</button>}
    </div>
    {tab!=='world'&&<section className="alpha-livro aoh-sheet aoh-glass" role="dialog" aria-label="Livro" onKeyDown={e=>{if(e.key==='Escape')setTab('world');}}>
      <nav className="alpha-livro-tabs" aria-label="Áreas do Livro">{LIVRO.map(([key,title])=><button key={key} type="button" aria-current={tab===key?'page':undefined} onClick={()=>setTab(key)}>{title}{tabAlerts[key]&&<span className="alpha-tab-alert" aria-hidden="true" title={tabAlerts[key]}/>}</button>)}<button type="button" className="aoh-btn is-sm alpha-livro-close" onClick={()=>setTab('world')}>Voltar ao mapa</button></nav>
      <div className="alpha-tab-body">{tab==='council'?<div className="alpha-council-book">
        <section><div className="section-head"><h3>Cidades</h3><span className="count-pill">{civ.cities.length}</span></div>
          {civ.cities.map(c=><button className={`city-link ${city?.id===c.id?'active':''}`} key={c.id} aria-pressed={city?.id===c.id} onClick={()=>{setSelectedCity(c.id);setSelected(c.hexId);setFocus(c.hexId);setInspector('city');}}><b>{c.id===civ.capitalCityId?'★ ':''}{c.name}</b><small>{c.population} habitantes · Desenvolvimento {c.development}</small></button>)}</section>
        <section><h3>Postura defensiva</h3>
          <label>Se for atacado, sua civilização adota<select value={game.self.defensePosture} disabled={locked} onChange={e=>void send({type:'SET_DEFENSE_POSTURE',posture:e.target.value})}>{POSTURES.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
          <small>Escolha privada; só é revelada quando houver batalha.</small></section>
        <section><div className="section-head"><h3>Peças</h3><span className="count-pill">{ownUnits.length}</span></div>
          <ArmyList units={ownUnits} selected={units} onSelect={pick} stacks={game.stacks} rules={game.rules.units} grades={game.grades}/></section>
        <details className="developer alpha-about"><summary>Sobre o teste · Feedback</summary><p>Alpha v0.1 em desenvolvimento · Partida {room.id} · Versão {game.version}</p><p>Código para voltar: <code>{room.joinCode}</code></p><button onClick={()=>void navigator.clipboard.writeText(`Ages of Hegemony Alpha v0.1\nPartida: ${room.id}\nRodada: ${game.view.round}\nTela: ${tab}\nNavegador: ${navigator.userAgent}`).catch(()=>undefined)}>Copiar diagnóstico para feedback</button><p>Diagnóstico contém identificação da partida e navegador; não contém sessão, cartas ou ordens.</p>{feedbackUrl&&<a href={feedbackUrl} target="_blank" rel="noreferrer">Enviar feedback</a>}<p>Ambiente de teste: a partida pode ser reiniciada ou apagada.</p></details>
      </div>:tab==='cards'?<AlphaCards game={game} locked={locked} send={send} cityId={city?.id??null}/>
      :tab==='diplomacy'?<AlphaDiplomacy game={game} locked={locked} send={send}/>
      :tab==='reports'?<AlphaReports game={game}/>
      :<AlphaInstitutions game={game} locked={locked} send={send} section={tab==='research'?'research':'era'} cityId={city?.id??null}/>}</div>
    </section>}
    <footer className="alpha-round-bar alpha-tray aoh-tray aoh-glass">
      {checkOpen&&!locked&&planningWarnings.length>0&&<div className="alpha-ready-check" role="dialog" aria-label="Antes de confirmar"><h3>Antes de confirmar</h3><ul>{planningWarnings.map(w=><li key={w}>{w}</li>)}</ul><button className="primary" onClick={()=>{setCheckOpen(false);void send({type:'READY'});}}>Confirmar mesmo assim</button><button onClick={()=>setCheckOpen(false)}>Voltar ao planejamento</button></div>}
      <span className="bud">Ordens<b>{game.actions.used} / {game.actions.limit}</b></span>
      <span className="alpha-orders" aria-label="Ordens por tipo">{AlphaOrderTypeSchema.options.map(type=>{const n=game.actions.byOrder[type];return <span key={type} className={`alpha-order-chip${n>0?' is-used':''}`} title={`${ORDER_NAMES[type]}: ${n}`}>{ORDER_NAMES[type]}{n>0&&<b>{n}</b>}</span>;})}</span>
      <span className="alpha-tray-ready" role="status">{game.players.filter(p=>p.ready).length} / {game.players.length} prontos</span>
      <details className="alpha-action-queue"><summary>Ordens planejadas {game.actions.reserved} / {game.actions.limit}</summary><div>{planned.map(action=><p key={action.id}><span>{action.label}</span><button disabled={locked} onClick={()=>void send({type:'CANCEL_ORDER',orderId:action.id})}>Cancelar</button></p>)}{planned.length===0&&<small>Nenhuma ação reservada.</small>}</div></details>
      {resolution.length>0&&<details className="alpha-resolution-log"><summary>Última resolução</summary><ol>{resolution.map(event=><li key={event.id}>{event.message}</li>)}</ol></details>}
      {ambitionsPending?<button className="primary advance-phase-btn" disabled={locked} onClick={()=>setAmbitionsLater(false)}>Escolher ambições</button>:<>{game.self.ready&&!game.winner&&<button className="alpha-unready" disabled={busy} title="Retira sua confirmação enquanto outras pessoas decidem" onClick={()=>void send({type:'UNREADY'})}>Voltar a planejar</button>}<button className={`${cardFocus||replay||tab!=='world'||conflictCall||game.phase==='ERA_TURN'||game.winner||(ambitionsPending&&!ambitionsLater)?"":"primary "}advance-phase-btn`} disabled={locked} onClick={()=>{if(game.phase==='PLANNING'&&planningWarnings.length&&!checkOpen){setCheckOpen(true);return;}setCheckOpen(false);void send({type:'READY'});}}>{game.self.ready?'Aguardando outras pessoas':game.phase==='CONFLICTS'?'Passar / pronto':game.phase==='PLANNING'?'Confirmar planejamento':game.phase==='ERA_TURN'?'Confirmar Virada':'Concluir fase'}</button></>}
    </footer>
  </>;
}

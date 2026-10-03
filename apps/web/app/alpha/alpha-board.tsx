'use client';
import { useState } from 'react';
import { ALPHA_CARDS, CIVILIZATIONS, stackCategory, stackViewVerdict } from '@aoh/game-domain';
import type { AlphaRoomView } from '@aoh/server/alpha';
import { HexMap } from '../play/hex-map';
import { ResourceDisplay } from '../play/resource-display';
import { alphaLabel as text } from './alpha-copy';
import { ArmyList, compositionText } from './alpha-army';
import { LeaveGame } from './alpha-leave';
import { AttackPreview, POSTURES, postureText } from './alpha-combat';
import { AmbitionChooser, AlphaCards, AlphaCity, AlphaDiplomacy, AlphaInstitutions, AlphaReports, AlphaUrban } from './alpha-panels';

export type AlphaSend=(command:Record<string,unknown>)=>Promise<boolean>;
type Inspector='city'|'territory'|'military';
const TABS=[['world','Mundo'],['research','Teia Civilizacional'],['cards','Cartas & Projetos'],['diplomacy','Diplomacia'],['era','Eras & Hegemonia'],['reports','Crônicas']] as const;
/** Desktop only: the council and the inspector can fold away so the atlas gets the room. The choice is a per-browser convenience. */
const PANELS_KEY='aoh-alpha-panels';
function loadPanels():{council:boolean;inspector:boolean}{
  try{const raw=JSON.parse(localStorage.getItem(PANELS_KEY)??'{}') as Record<string,unknown>;return {council:raw.council!==false,inspector:raw.inspector!==false};}catch{return {council:true,inspector:true};}
}
const INSPECTORS:[Inspector,string][]=[['city','Cidade'],['territory','Território'],['military','Militar']];

/** Same shell as the local slice: top bar, area navigation, council | atlas | inspector, bottom action bar. */
const feedbackUrl=process.env.NEXT_PUBLIC_ALPHA_FEEDBACK_URL||'';
export default function AlphaBoard({room,busy,send,theme,onTheme,onLeave}:{room:AlphaRoomView;busy:boolean;send:AlphaSend;theme:string;onTheme:(theme:string)=>void;onLeave:()=>void}){
  const game=room.game!,player=game.view.player,civ=player.civilization,identity=CIVILIZATIONS.find(c=>c.id===game.self.civilization);
  const [tab,setTab]=useState('world'),[inspector,setInspector]=useState<Inspector>('city'),[selected,setSelected]=useState<string|null>(civ.cities[0]?.hexId??null),[selectedCity,setSelectedCity]=useState(civ.cities[0]?.id??''),[focus,setFocus]=useState<string|null>(civ.cities[0]?.hexId??null);
  const [units,setUnits]=useState<string[]>([]),[path,setPath]=useState<string[]>([]),[pathMode,setPathMode]=useState(false),[rotation,setRotation]=useState(0),[working,setWorking]=useState(false),[worked,setWorked]=useState<string[]>([]),[name,setName]=useState('Novo Horizonte'),[posture,setPosture]=useState('ASSAULT');
  const [panels,setPanels]=useState(loadPanels),[dismissedResolution,setDismissedResolutionState]=useState(()=>{try{return Number(sessionStorage.getItem(`aoh-resolution-seen-${room.id}`)??0);}catch{return 0;}}),[finaleClosed,setFinaleClosed]=useState(false),[ambitionsLater,setAmbitionsLaterState]=useState(()=>{try{return sessionStorage.getItem(`aoh-ambitions-later-${room.id}`)==='1';}catch{return false;}});
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
  const reactions=game.self.hand.map(id=>ALPHA_CARDS.find(card=>card.id===id)).filter(card=>card?.timing==='REACTION').map(card=>card!);
  const conflictCall=game.phase==='CONFLICTS'&&!game.self.ready&&!game.winner&&(game.incomingAttacks.length>0||game.self.orders.some(o=>o.type==='ATTACK'));
  const latestReport=game.roundReports.at(-1),replay=!conflictCall&&!game.winner&&latestReport&&latestReport.resolution.length>0&&latestReport.round>dismissedResolution?latestReport:null;
  const resolution=latestReport?.resolution.slice(-8)??[];
  const mapData={view:{...game.view,era:game.self.era,visibleTerritory:[...game.view.visibleTerritory,...known,...unknown]},players:game.players,claimable:targetHexes,workable:city?game.view.visibleTerritory.filter(t=>t.controllerCityId===city.id).map(t=>t.id):[]};
  /** The inspector follows what the player just touched, except while a map interaction is in progress. */
  const follow=(hexId:string|null,pieces:number)=>{
    if(working||pathMode)return;
    setInspector(pieces>0?'military':civ.cities.some(c=>c.hexId===hexId)?'city':'territory');
  };
  function select(id:string){
    setSelected(id);const target=civ.cities.find(c=>c.hexId===id);if(target)setSelectedCity(target.id);
    if(pathMode)setPath(old=>[...old,id]);if(working)setWorked(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);
    follow(id,units.length);
  }
  function pick(ids:string[],on:boolean,hexId:string){
    const next=on?[...new Set([...units,...ids])]:units.filter(id=>!ids.includes(id));
    setUnits(next);setFocus(hexId);setSelected(hexId);follow(hexId,next.length);
  }
  const tools=<span className="alpha-nav-tools"><LeaveGame joinCode={room.joinCode} onLeave={onLeave}/><span className="future-system-tag">TEST BUILD · Alpha v0.1</span><label className="alpha-theme">Tema <select value={theme} onChange={e=>onTheme(e.target.value)}><option value="SYSTEM">Sistema</option><option value="DARK">Escuro</option><option value="LIGHT">Claro</option></select></label></span>;
  return <>
    <header className="top-bar alpha-player-board">
      <div className="civ-brand"><span className="seal" aria-hidden="true">AH</span><div><span className="eyebrow">{text(game.self.era)} · {text(civ.government)}</span><h1>{identity?.name??player.name}</h1><small>{player.name}</small></div></div>
      <ResourceDisplay values={game.self.resources} caps={{food:game.storage.foodCapacity,wood:game.storage.woodCapacity,stone:game.storage.stoneCapacity,metal:game.storage.metalCapacity,wealth:game.storage.wealthCapacity}}/>
      <div className={`admin ${over?'warning':''}`}><small>Administração</small><b>{civ.administrativeLoad} / {civ.administrativeCapacity}{over&&<strong className="alpha-admin-flag">Sobre-extensão</strong>}</b><meter min={0} max={Math.max(civ.administrativeCapacity,civ.administrativeLoad,1)} value={civ.administrativeLoad}/></div>
      <div className="admin"><small>Ações principais</small><b>{game.actions.used} / {game.actions.limit}</b><small>{game.actions.reserved} planejadas · {game.self.prestige} Prestígio</small></div>
      <div className="round-label"><small>{text(game.self.era)}</small><b>Rodada {game.view.round} / {game.rules.roundLimit}</b><span>{replay?'RESOLVENDO A RODADA':text(game.phase)}</span></div>
    </header>
    <nav className="main-nav" aria-label="Áreas da civilização">{TABS.map(([key,title])=><button key={key} aria-current={tab===key?'page':undefined} onClick={()=>setTab(key)}>{title}</button>)}{tools}</nav>
    {replay&&<section className="alpha-resolution-phase" role="status" aria-label="Resolvendo a rodada"><p className="eyebrow">RESOLVENDO A RODADA {replay.round}</p><h2>Resultados autorizados</h2><ol>{replay.resolution.map(event=><li key={event.id}><b>{text(event.type)}</b><span>{event.message}</span></li>)}</ol><button className="primary" onClick={()=>setDismissedResolution(replay.round)}>Continuar</button></section>}
    {ambitionsPending&&!ambitionsLater&&!replay&&<div className="alpha-modal-backdrop"><section className="alpha-modal" role="dialog" aria-modal="true" aria-labelledby="alpha-ambitions-title"><p className="eyebrow">ANTES DO PRIMEIRO PLANEJAMENTO</p><AmbitionChooser game={game} locked={locked} send={send}/><button type="button" onClick={()=>setAmbitionsLater(true)}>Ver o mapa primeiro</button></section></div>}
    {conflictCall&&<section className="alpha-conflict-call" role="alert" aria-label="Conflitos da rodada"><p className="eyebrow">CONFLITOS DA RODADA {game.view.round}</p><h2>{game.incomingAttacks.length?'Sua civilização está sendo atacada':'Seu ataque aguarda reações'}</h2>
      {game.incomingAttacks.map(a=><p key={`${a.attackerId}-${a.target}`}><b>{game.players.find(p=>p.id===a.attackerId)?.name}</b> ataca suas posições em <b>{a.target}</b>.</p>)}
      {game.self.orders.filter(o=>o.type==='ATTACK').map(o=><p key={o.id}>Seu ataque em <b>{o.type==='ATTACK'?o.target:''}</b> é resolvido depois das reações.</p>)}
      {reactions.length>0?<><p>Uma carta de reação soma Força aos seus conflitos desta rodada, antes dos dados. Restam {Math.max(0,game.rules.cardsPerRound-game.self.cardsPlayed)} carta(s) nesta rodada.</p><div className="alpha-card-row">{reactions.map(card=><article className="alpha-card" key={card.id}><h4>{card.name}</h4><p>+{card.effect?.amount??0} Força nesta rodada</p><button disabled={busy} onClick={()=>void send({type:'PLAY_CARD',cardId:card.id})}>Jogar reação</button></article>)}</div></>:<p>Você não tem cartas de reação.</p>}
      <button className="primary" disabled={busy} onClick={()=>void send({type:'READY'})}>Seguir para os dados</button></section>}
    {game.winner&&!finaleClosed&&<div className="alpha-modal-backdrop"><section className="alpha-modal alpha-finale-panel" role="dialog" aria-modal="true" aria-labelledby="alpha-finale-title"><p className="eyebrow">FIM DA PARTIDA · RODADA {game.winner.round}</p>
      <h2 id="alpha-finale-title">{game.winner.playerId===room.selfPlayerId?'Sua civilização venceu':`${game.players.find(p=>p.id===game.winner!.playerId)?.name} venceu`}</h2>
      <p>{game.winner.reason==='HEGEMONY'?`Hegemonia ${text(game.finalStandings.find(s=>s.playerId===game.winner!.playerId)?.hegemony??'')} consolidada.`:`Maior Prestígio ao fim das ${game.rules.roundLimit} rodadas.`}</p>
      <div className="table-scroll"><table className="alpha-standings"><thead><tr><th>#</th><th>Civilização</th><th>Prestígio</th><th>Pesquisas</th><th>População</th><th>Riqueza</th><th>Cidades</th></tr></thead><tbody>{game.finalStandings.map((s,i)=><tr key={s.playerId} className={s.playerId===room.selfPlayerId?'is-self':''}><td>{i+1}</td><th>{s.name}<small>{CIVILIZATIONS.find(c=>c.id===s.civilization)?.name}</small></th><td>{s.prestige}</td><td>{s.research}</td><td>{s.population}</td><td>{s.wealth}</td><td>{s.cities}</td></tr>)}</tbody></table></div>
      <p className="alpha-hint">Ordem: Prestígio; empates por pesquisas, população e riqueza.</p>
      <div className="alpha-finale-actions"><button className="primary" onClick={onLeave}>Nova partida</button><button onClick={()=>{setFinaleClosed(true);setTab('reports');}}>Ver crônicas</button><button onClick={()=>setFinaleClosed(true)}>Ver o mapa final</button></div></section></div>}
    {game.winner&&finaleClosed&&<section className="alpha-finale" role="status"><p className="eyebrow">FIM DA PARTIDA</p><h2>{game.players.find(p=>p.id===game.winner!.playerId)?.name} venceu</h2><button onClick={()=>setFinaleClosed(false)}>Ver resultado</button></section>}
    {tab==='world'?<div className="play-layout alpha-layout" data-council={panels.council?'open':'closed'} data-inspector={panels.inspector?'open':'closed'}>
      <aside className="civilization-panel alpha-council" data-collapsed={!panels.council}>
        <div className="alpha-panel-toggle"><button type="button" aria-expanded={panels.council} aria-label={panels.council?'Recolher Conselho':'Expandir Conselho'} title={panels.council?'Recolher Conselho':'Expandir Conselho'} onClick={()=>togglePanel('council')}>{panels.council?'‹':'›'}</button></div>
      <div className="alpha-panel-body">
        <span className="eyebrow">CONSELHO CIVILIZACIONAL</span><h2>Conselho</h2>
        <section><div className="section-head"><h3>Cidades</h3><span className="count-pill">{civ.cities.length}</span></div>
          {civ.cities.map(c=><button className={`city-link ${city?.id===c.id?'active':''}`} key={c.id} aria-pressed={city?.id===c.id} onClick={()=>{setSelectedCity(c.id);setSelected(c.hexId);setFocus(c.hexId);setInspector('city');}}><b>{c.id===civ.capitalCityId?'★ ':''}{c.name}</b><small>{c.population} habitantes · Nível {c.development}</small></button>)}</section>
        <section><h3>Postura defensiva</h3>
          <label>Se for atacado, sua civilização adota<select value={game.self.defensePosture} disabled={locked} onChange={e=>void send({type:'SET_DEFENSE_POSTURE',posture:e.target.value})}>{POSTURES.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
          <small>Escolha privada; só é revelada quando houver batalha.</small></section>
        <section><div className="section-head"><h3>Peças</h3><span className="count-pill">{ownUnits.length}</span></div>
          <ArmyList units={ownUnits} selected={units} onSelect={pick} stacks={game.stacks} rules={game.rules.units}/></section>
        <details className="developer alpha-about"><summary>Sobre o teste · Feedback</summary><p>Alpha v0.1 em desenvolvimento · Partida {room.id} · Versão {game.version}</p><p>Código para voltar: <code>{room.joinCode}</code></p><button onClick={()=>void navigator.clipboard.writeText(`Ages of Hegemony Alpha v0.1\nPartida: ${room.id}\nRodada: ${game.view.round}\nTela: ${tab}\nNavegador: ${navigator.userAgent}`).catch(()=>undefined)}>Copiar diagnóstico para feedback</button><p>Diagnóstico contém identificação da partida e navegador; não contém sessão, cartas ou ordens.</p>{feedbackUrl&&<a href={feedbackUrl} target="_blank" rel="noreferrer">Enviar feedback</a>}<p>Ambiente de teste: a partida pode ser reiniciada ou apagada.</p></details>
      </div>
      </aside>
      <div className="world-column"><HexMap data={mapData} units={game.units} selected={selected} focus={focus} working={working} worked={worked} onSelect={select}/></div>
      <aside className="context-inspector alpha-inspector" data-collapsed={!panels.inspector}>
        <div className="alpha-panel-toggle"><button type="button" aria-expanded={panels.inspector} aria-label={panels.inspector?'Recolher Inspector':'Expandir Inspector'} title={panels.inspector?'Recolher Inspector':'Expandir Inspector'} onClick={()=>togglePanel('inspector')}>{panels.inspector?'›':'‹'}</button></div>
        <div className="inspector-tabs" role="group" aria-label="Contexto">{INSPECTORS.map(([key,title])=><button key={key} aria-pressed={inspector===key} onClick={()=>setInspector(key)}>{title}{key==='military'&&game.self.orders.length>0?` · ${game.self.orders.length}`:''}</button>)}</div>
      <div className="alpha-panel-body">
        {inspector==='territory'&&<div className="alpha-inspector-body">
          <h2>{tile?text(tile.terrain):selected?'Fronteira por explorar':'Selecione o mapa'}</h2><p>{selected}</p>{tile?.yield&&<ResourceDisplay values={tile.yield} compact/>}{tile&&<p>{tile.ownerId?`Território de ${game.players.find(p=>p.id===tile.ownerId)?.name}`:'Território livre'} · {tile.improvement?text(tile.improvement):'Sem melhoria'}</p>}
          {city&&<><button disabled={locked||!tile} onClick={()=>void manage({type:'CLAIM_HEX',cityId:city.id,hexId:selected})}>Reivindicar para {city.name}</button><ResourceDisplay values={game.costs.claim} compact/>
            <button disabled={locked} onClick={()=>{setWorking(!working);setWorked(city.workedHexIds);}}> {working?'Cancelar atribuição':'Escolher territórios trabalhados'}</button>{working&&<div><p>{worked.length} territórios selecionados · {city.workers.producers} Produtores</p><button disabled={locked} onClick={()=>void manage({type:'ASSIGN_WORKED_HEXES',cityId:city.id,hexIds:worked}).then(ok=>{if(ok)setWorking(false);})}>Confirmar trabalho</button></div>}</>}
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
            {settle!==undefined&&<div className="alpha-order-choice"><h4>Fundar cidade aqui</h4>{settle?<p className="alpha-warning">{settle}</p>:<><label>Nome da nova cidade<input value={name} maxLength={80} onChange={e=>setName(e.target.value)}/></label><button className="primary" disabled={locked||!name.trim()} onClick={()=>void send({type:'SETTLE',unitId:units[0],name})}>Fundar cidade</button><ResourceDisplay values={game.costs.founding} compact/></>}</div>}
            {exploreChoice&&<div className="alpha-order-choice"><h4>Explorar esta região</h4><p>Revela os 7 hexes da região na resolução. A peça não se move.</p><button className="primary" disabled={locked||ordered.length>0} onClick={()=>void queue({type:'EXPLORE',unitId:units[0],target:exploreChoice.target,rotation})}>Explorar região</button>
              <details><summary>Orientação da região</summary><label>Se ninguém explorou a região, você escolhe como ela é girada<select value={rotation} onChange={e=>setRotation(Number(e.target.value))}>{[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n*60}°</option>)}</select></label></details></div>}
            {movePath&&<div className="alpha-order-choice"><h4>Mover para cá</h4><p>{movePath.length} {movePath.length===1?'passo':'passos'} pelo caminho mais curto conhecido.</p>{groupBlock&&<p className="alpha-warning" role="alert">{groupBlock}</p>}<button className="primary" disabled={locked||ordered.length>0||groupBlock!==null} onClick={()=>void queue({type:'MOVE',unitIds:units,path:movePath})}>Reservar movimento</button></div>}
            {foreignHere&&<div className="alpha-order-choice"><h4>Atacar</h4>{!fighters?<p>Peças civis não participam de ataques.</p>:!adjacent?<p>O alvo precisa estar a 1 hex das peças selecionadas.</p>:!hostile?<p>Você está em paz com {defenderName}. Planeje uma declaração de guerra em Diplomacia; ela é resolvida antes dos conflitos, então o ataque pode ser na mesma rodada. <button type="button" onClick={()=>setTab('diplomacy')}>Abrir Diplomacia</button></p>:<div className="alpha-form-row">
              <label>Postura do ataque<select value={posture} onChange={e=>setPosture(e.target.value)}>{POSTURES.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
              <button className="primary" disabled={locked||ordered.length>0} onClick={()=>void queue({type:'ATTACK',unitIds:units,target:selected,posture})}>Ordenar ataque</button></div>}</div>}
            {!movePath&&!exploreChoice&&!foreignHere&&settle===undefined&&<p className="alpha-hint">{!sameHex?'Peças em hexes diferentes: selecione um grupo de cada vez.':selected===origin?'Clique num hex destacado no mapa: destinos alcançáveis nesta rodada e regiões que esta peça pode explorar.':'Fora do alcance nesta rodada. Os hexes destacados no mapa são alcançáveis ou exploráveis.'}</p>}
            <details><summary>Ordens avançadas · influência, caminho manual</summary>
              <button disabled={locked||units.length!==1||!selected} onClick={()=>void queue({type:'INFLUENCE',unitId:units[0],target:selected})}>Missão de influência no alvo</button>
              <button aria-pressed={pathMode} disabled={locked} onClick={()=>{setPathMode(!pathMode);setPath([]);}}>{pathMode?'Sair da seleção de caminho':'Traçar caminho hex a hex'}</button>
              {pathMode&&<><p>{path.length?path.join(' · '):'Clique em cada hex do caminho, em ordem.'}</p>{moveBlock&&<p className="alpha-warning" role="alert">{moveBlock}</p>}<button disabled={locked||!path.length||moveBlock!==null} onClick={()=>void queue({type:'MOVE',unitIds:units,path}).then(ok=>{if(ok){setPathMode(false);setPath([]);}})}>Reservar movimento</button></>}
            </details>
          </section>:<p className="alpha-hint">Selecione peças no Conselho para planejar movimento, exploração, fundação ou ataque.</p>}
          <h3>Ordens reservadas</h3>{game.self.orders.map(o=><div className="alpha-order" key={o.id}><span>{orderLabel(o)}{o.type==='ATTACK'?` · ${postureText(o.posture)}`:''}</span><button disabled={locked} onClick={()=>void send({type:'CANCEL_ORDER',orderId:o.id})}>Cancelar</button>{o.type==='ATTACK'&&game.orderPreviews[o.id]&&<AttackPreview preview={game.orderPreviews[o.id]!}/>}</div>)}{game.self.orders.length===0&&<p>Nenhuma ordem reservada.</p>}
        </div>}
      </div>
      </aside>
    </div>
      :<div className="alpha-tab-body">{tab==='cards'?<AlphaCards game={game} locked={locked} send={send} cityId={city?.id??null}/>
      :tab==='diplomacy'?<AlphaDiplomacy game={game} locked={locked} send={send}/>
      :tab==='reports'?<AlphaReports game={game}/>
      :<AlphaInstitutions game={game} locked={locked} send={send} section={tab==='research'?'research':'era'} cityId={city?.id??null}/>}</div>}
    <footer className="action-bar alpha-round-bar">
      <div className="feedback" role="status"><small>RODADA MUNDIAL</small> <b>{game.view.round} / {game.rules.roundLimit}</b> · <span>{replay?'RESOLVENDO A RODADA':text(game.phase)}</span><br/><small>{game.players.filter(p=>p.ready).length} / {game.players.length} prontos{room.deadline&&` · Prazo: ${new Date(room.deadline).toLocaleTimeString('pt-BR')}`}</small></div>
      <details className="alpha-action-queue"><summary>Ações planejadas {game.actions.reserved} / {game.actions.limit}</summary><div>{planned.map(action=><p key={action.id}><span>{action.label}</span><button disabled={locked} onClick={()=>void send({type:'CANCEL_ORDER',orderId:action.id})}>Cancelar</button></p>)}{planned.length===0&&<small>Nenhuma ação reservada.</small>}</div></details>
      {resolution.length>0&&<details className="alpha-resolution-log"><summary>Última resolução</summary><ol>{resolution.map(event=><li key={event.id}>{event.message}</li>)}</ol></details>}
      <ol aria-label="Iniciativa">{game.initiative.map(id=><li key={id}>{game.players.find(p=>p.id===id)?.name}</li>)}</ol>
      {ambitionsPending?<button className="primary advance-phase-btn" disabled={locked} onClick={()=>setAmbitionsLater(false)}>Escolher ambições</button>:<>{game.self.ready&&!game.winner&&<button className="alpha-unready" disabled={busy} title="Retira sua confirmação enquanto outras pessoas decidem" onClick={()=>void send({type:'UNREADY'})}>Voltar a planejar</button>}<button className="primary advance-phase-btn" disabled={locked} onClick={()=>void send({type:'READY'})}>{game.self.ready?'Aguardando outras pessoas':game.phase==='CONFLICTS'?'Passar / pronto':game.phase==='PLANNING'?'Confirmar planejamento':'Concluir fase'}</button></>}
    </footer>
  </>;
}

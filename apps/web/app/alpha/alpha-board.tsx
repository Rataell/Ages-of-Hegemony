'use client';
import { useState } from 'react';
import { CIVILIZATIONS, stackCategory, stackViewVerdict } from '@aoh/game-domain';
import type { AlphaRoomView } from '@aoh/server/alpha';
import { HexMap } from '../play/hex-map';
import { ResourceDisplay } from '../play/resource-display';
import { alphaLabel as text } from './alpha-copy';
import { ArmyList, compositionText } from './alpha-army';
import { AttackPreview, POSTURES, postureText } from './alpha-combat';
import { AlphaCards, AlphaCity, AlphaDiplomacy, AlphaInstitutions, AlphaReports, AlphaUrban } from './alpha-panels';

export type AlphaSend=(command:Record<string,unknown>)=>Promise<boolean>;
type Inspector='city'|'territory'|'military';
const TABS=[['world','Mundo'],['research','Teia Civilizacional'],['cards','Cartas & Projetos'],['diplomacy','Diplomacia'],['era','Eras & Hegemonia'],['reports','Crônicas']] as const;
const INSPECTORS:[Inspector,string][]=[['city','Cidade'],['territory','Território'],['military','Militar']];

/** Same shell as the local slice: top bar, area navigation, council | atlas | inspector, bottom action bar. */
export default function AlphaBoard({room,busy,send,theme,onTheme}:{room:AlphaRoomView;busy:boolean;send:AlphaSend;theme:string;onTheme:(theme:string)=>void}){
  const game=room.game!,player=game.view.player,civ=player.civilization,identity=CIVILIZATIONS.find(c=>c.id===game.self.civilization);
  const [tab,setTab]=useState('world'),[inspector,setInspector]=useState<Inspector>('city'),[selected,setSelected]=useState<string|null>(civ.cities[0]?.hexId??null),[selectedCity,setSelectedCity]=useState(civ.cities[0]?.id??''),[focus,setFocus]=useState<string|null>(civ.cities[0]?.hexId??null);
  const [units,setUnits]=useState<string[]>([]),[path,setPath]=useState<string[]>([]),[pathMode,setPathMode]=useState(false),[rotation,setRotation]=useState(0),[working,setWorking]=useState(false),[worked,setWorked]=useState<string[]>([]),[name,setName]=useState('Novo Horizonte'),[posture,setPosture]=useState('ASSAULT');
  const locked=busy||game.self.ready||game.view.status==='FINISHED';
  const over=civ.administrationStatus==='OVEREXTENDED';
  const city=civ.cities.find(c=>c.id===selectedCity)??civ.cities[0];
  const tile=game.view.visibleTerritory.find(t=>t.id===selected);
  const ownUnits=game.units.filter(u=>u.ownerId===room.selfPlayerId);
  const chosen=ownUnits.filter(u=>units.includes(u.id));
  /** Same arithmetic as the server, computed from the projected stack view before any command is sent. */
  const moveEnd=path.at(-1)??null,moveBlock=moveEnd?stackViewVerdict(game.stacks,chosen.map(u=>stackCategory(game.rules.units[u.kind]!)),moveEnd):null;
  const manage=(command:Record<string,unknown>)=>send({type:'MANAGE',command:{...command,playerId:room.selfPlayerId,expectedVersion:game.view.version}});
  const queue=(order:Record<string,unknown>)=>send({type:'QUEUE_ORDER',order:{...order,id:`order-${game.version}-${game.self.orders.length}`}});
  const known=game.knownTerritory.map(t=>({...t,ownerId:null,controllerCityId:null,improvement:null,yield:null,yieldError:null}));
  const unknown=game.frontier.map(t=>({...t,terrain:'UNKNOWN' as const,features:[],ownerId:null,controllerCityId:null,improvement:null,yield:null,yieldError:null}));
  const mapData={view:{...game.view,era:game.self.era,visibleTerritory:[...game.view.visibleTerritory,...known,...unknown]},players:game.players,claimable:[],workable:city?game.view.visibleTerritory.filter(t=>t.controllerCityId===city.id).map(t=>t.id):[]};
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
  const tools=<span className="alpha-nav-tools"><span className="future-system-tag">TEST BUILD · Alpha v0.1</span><label className="alpha-theme">Tema <select value={theme} onChange={e=>onTheme(e.target.value)}><option value="SYSTEM">Sistema</option><option value="DARK">Escuro</option><option value="LIGHT">Claro</option></select></label></span>;
  return <>
    <header className="top-bar alpha-player-board">
      <div className="civ-brand"><span className="seal" aria-hidden="true">AH</span><div><span className="eyebrow">{text(game.self.era)} · {text(civ.government)}</span><h1>{identity?.name??player.name}</h1><small>{player.name}</small></div></div>
      <ResourceDisplay values={player.resources}/>
      <div className={`admin ${over?'warning':''}`}><small>Administração</small><b>{civ.administrativeLoad} / {civ.administrativeCapacity}</b><meter min={0} max={Math.max(civ.administrativeCapacity,civ.administrativeLoad,1)} value={civ.administrativeLoad}/>{over&&<strong>Sobre-extensão</strong>}</div>
      <div className="admin"><small>Comandos</small><b>{game.self.spentCommands+game.self.orders.length} / {game.commandCapacity}</b><small>{game.self.prestige} Prestígio</small></div>
      <div className="round-label"><small>{text(game.self.era)}</small><b>Rodada {game.view.round} / {game.rules.roundLimit}</b><span>{text(game.phase)}</span></div>
    </header>
    <nav className="main-nav" aria-label="Áreas da civilização">{TABS.map(([key,title])=><button key={key} aria-current={tab===key?'page':undefined} onClick={()=>setTab(key)}>{title}</button>)}{tools}</nav>
    {game.winner&&<section className="alpha-finale" role="status"><p className="eyebrow">FIM DA PARTIDA</p><h2>{game.players.find(p=>p.id===game.winner!.playerId)?.name} venceu</h2><p>{game.winner.reason==='HEGEMONY'?'Hegemonia consolidada':'Maior pontuação ao fim do limite de rodadas'} · Rodada {game.winner.round}</p></section>}
    {tab==='world'?<div className="play-layout alpha-layout">
      <aside className="civilization-panel alpha-council">
        <span className="eyebrow">CONSELHO CIVILIZACIONAL</span><h2>Conselho</h2>
        <section><div className="section-head"><h3>Cidades</h3><span className="count-pill">{civ.cities.length}</span></div>
          {civ.cities.map(c=><button className={`city-link ${city?.id===c.id?'active':''}`} key={c.id} aria-pressed={city?.id===c.id} onClick={()=>{setSelectedCity(c.id);setSelected(c.hexId);setFocus(c.hexId);setInspector('city');}}><b>{c.id===civ.capitalCityId?'★ ':''}{c.name}</b><small>{c.population} habitantes · Nível {c.development}</small></button>)}</section>
        <section><h3>Postura defensiva</h3>
          <label>Se for atacado, sua civilização adota<select value={game.self.defensePosture} disabled={locked} onChange={e=>void send({type:'SET_DEFENSE_POSTURE',posture:e.target.value})}>{POSTURES.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
          <small>Escolha privada; só é revelada quando houver batalha.</small></section>
        <section><div className="section-head"><h3>Peças</h3><span className="count-pill">{ownUnits.length}</span></div>
          <ArmyList units={ownUnits} selected={units} onSelect={pick} stacks={game.stacks} rules={game.rules.units}/></section>
        <details className="developer alpha-about"><summary>Sobre o teste · Feedback</summary><p>Alpha v0.1 em desenvolvimento · Partida {room.id} · Versão {game.version}</p><button onClick={()=>void navigator.clipboard.writeText(`Ages of Hegemony Alpha v0.1\nPartida: ${room.id}\nRodada: ${game.view.round}\nTela: ${tab}\nNavegador: ${navigator.userAgent}`).catch(()=>undefined)}>Copiar diagnóstico para feedback</button><p>Diagnóstico contém identificação da partida e navegador; não contém sessão, cartas ou ordens.</p></details>
      </aside>
      <div className="world-column"><HexMap data={mapData} units={game.units} selected={selected} focus={focus} working={working} worked={worked} onSelect={select}/></div>
      <aside className="context-inspector alpha-inspector">
        <div className="inspector-tabs" role="group" aria-label="Contexto">{INSPECTORS.map(([key,title])=><button key={key} aria-pressed={inspector===key} onClick={()=>setInspector(key)}>{title}{key==='military'&&game.self.orders.length>0?` · ${game.self.orders.length}`:''}</button>)}</div>
        {inspector==='territory'&&<div className="alpha-inspector-body">
          <h2>{tile?text(tile.terrain):selected?'Fronteira por explorar':'Selecione o mapa'}</h2><p>{selected}</p>{tile?.yield&&<ResourceDisplay values={tile.yield} compact/>}{tile&&<p>{tile.ownerId?`Território de ${game.players.find(p=>p.id===tile.ownerId)?.name}`:'Território livre'} · {tile.improvement?text(tile.improvement):'Sem melhoria'}</p>}
          {city&&<><button disabled={locked||!tile} onClick={()=>void manage({type:'CLAIM_HEX',cityId:city.id,hexId:selected})}>Reivindicar para {city.name}</button><ResourceDisplay values={game.view.config.territory.claimCost} compact/>
            <button disabled={locked} onClick={()=>{setWorking(!working);setWorked(city.workedHexIds);}}> {working?'Cancelar atribuição':'Escolher territórios trabalhados'}</button>{working&&<div><p>{worked.length} territórios selecionados · {city.workers.producers} Produtores</p><button disabled={locked} onClick={()=>void manage({type:'ASSIGN_WORKED_HEXES',cityId:city.id,hexIds:worked}).then(ok=>{if(ok)setWorking(false);})}>Confirmar trabalho</button></div>}</>}
          {tile?.ownerId===room.selfPlayerId&&<details><summary>Melhorias e estradas</summary>{Object.entries(game.view.config.territory.improvementCatalog).map(([kind,entry])=><div className="alpha-option" key={kind}><button disabled={locked} onClick={()=>void manage({type:'IMPROVE_HEX',hexId:selected,improvement:kind})}>{text(kind)}</button><ResourceDisplay values={entry.cost} compact/></div>)}<button disabled={locked} onClick={()=>void send({type:'BUILD_ROAD',hexId:selected})}>Construir estrada</button><ResourceDisplay values={game.rules.roadCost} compact/></details>}
        </div>}
        {inspector==='city'&&<div className="alpha-inspector-body">{city?<>
          <AlphaUrban key={city.id} game={game} locked={locked} send={send} cityId={city.id}/>
          <AlphaCity key={`${city.id}-${city.population}-${JSON.stringify(city.workers)}`} game={game} city={city} locked={locked} send={send} manage={manage}/></>:<p className="empty-inspector">Selecione uma cidade no atlas ou no Conselho.</p>}</div>}
        {inspector==='military'&&<div className="alpha-inspector-body">
          {chosen.length>0?<section className="alpha-order-builder">
            <div className="section-head"><h3>{chosen.length===1?text(chosen[0]!.kind):`Planejar com ${chosen.length} peça(s)`}</h3><button type="button" onClick={()=>{setUnits([]);follow(selected,0);}}>Limpar seleção</button></div>
            <p className="alpha-army-summary">{compositionText(chosen)}</p>
            <p className="alpha-target">Alvo no mapa: <b>{selected??'nenhum'}</b>{tile&&` · ${text(tile.terrain)}`}</p>
            <div className="alpha-form-row">
              <label>Postura do ataque<select value={posture} onChange={e=>setPosture(e.target.value)}>{POSTURES.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
              <button className="primary" disabled={locked||!selected} onClick={()=>void queue({type:'ATTACK',unitIds:units,target:selected,posture})}>Ordenar ataque</button>
            </div>
            <button aria-pressed={pathMode} disabled={locked} onClick={()=>{setPathMode(!pathMode);setPath([]);}}>{pathMode?'Sair da seleção de caminho':'Selecionar caminho no mapa'}</button>
            {pathMode&&<><p>{path.length?path.join(' · '):'Clique em cada hex do caminho, em ordem.'}</p>{moveBlock&&<p className="alpha-warning" role="alert">{moveBlock}</p>}<button disabled={locked||!path.length||moveBlock!==null} onClick={()=>void queue({type:'MOVE',unitIds:units,path}).then(ok=>{if(ok){setPathMode(false);setPath([]);}})}>Reservar movimento</button></>}
            <details><summary>Outras ordens · missão, exploração, fundação</summary>
              <button disabled={locked||units.length!==1||!selected} onClick={()=>void queue({type:'INFLUENCE',unitId:units[0],target:selected})}>Missão de influência</button>
              <label>Orientação da região<select value={rotation} onChange={e=>setRotation(Number(e.target.value))}>{[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n*60}°</option>)}</select></label>
              <button disabled={locked||units.length!==1||!selected} onClick={()=>void queue({type:'EXPLORE',unitId:units[0],target:selected,rotation})}>Explorar região selecionada</button>
              <label>Nome da nova cidade<input value={name} maxLength={80} onChange={e=>setName(e.target.value)}/></label><button disabled={locked||units.length!==1||!name.trim()} onClick={()=>void send({type:'SETTLE',unitId:units[0],name})}>Fundar com Pioneiro</button><ResourceDisplay values={game.view.config.territory.foundingCost} compact/>
            </details>
          </section>:<p className="alpha-hint">Selecione peças no Conselho para planejar movimento ou ataque.</p>}
          <h3>Ordens reservadas</h3>{game.self.orders.map(o=><div className="alpha-order" key={o.id}><span>{text(o.type)}{o.type==='ATTACK'?` · ${postureText(o.posture)}`:''}</span><button disabled={locked} onClick={()=>void send({type:'CANCEL_ORDER',orderId:o.id})}>Cancelar</button>{o.type==='ATTACK'&&game.orderPreviews[o.id]&&<AttackPreview preview={game.orderPreviews[o.id]!}/>}</div>)}{game.self.orders.length===0&&<p>Nenhuma ordem reservada.</p>}
        </div>}
      </aside>
    </div>
      :<div className="alpha-tab-body">{tab==='cards'?<AlphaCards game={game} locked={locked} send={send} cityId={city?.id??null}/>
      :tab==='diplomacy'?<AlphaDiplomacy game={game} locked={locked} send={send}/>
      :tab==='reports'?<AlphaReports game={game}/>
      :<AlphaInstitutions game={game} locked={locked} send={send} section={tab==='research'?'research':'era'} cityId={city?.id??null}/>}</div>}
    <footer className="action-bar alpha-round-bar">
      <div className="feedback" role="status"><small>RODADA MUNDIAL</small> <b>{game.view.round} / {game.rules.roundLimit}</b> · <span>{text(game.phase)}</span><br/><small>{game.players.filter(p=>p.ready).length} / {game.players.length} prontos{room.deadline&&` · Prazo: ${new Date(room.deadline).toLocaleTimeString('pt-BR')}`}</small></div>
      <ol aria-label="Iniciativa">{game.initiative.map(id=><li key={id}>{game.players.find(p=>p.id===id)?.name}</li>)}</ol>
      <button className="primary advance-phase-btn" disabled={locked} onClick={()=>void send({type:'READY'})}>{game.self.ready?'Aguardando outras pessoas':game.phase==='CONFLICTS'?'Passar / pronto':game.phase==='PLANNING'?'Confirmar planejamento':'Concluir fase'}</button>
    </footer>
  </>;
}

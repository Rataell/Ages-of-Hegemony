'use client';
import { useEffect, useRef, useState } from 'react';
import { MAP_SIZE_NAMES, mapSizeAllows, recommendedMapSize, type MapSize } from '@aoh/game-domain';
import { AlphaLobby, LegacyRoom } from './alpha-roster';
import type { AlphaRoomView } from '@aoh/server/alpha';
import AlphaBoard from './alpha-board';
import { ruleMessage } from '../play/presentation';
import { sendWithRecovery, type Reply } from './send-command';
import { MAP_SIZES, ORDER_OPTIONS, PLANNING_OPTIONS, PRESET_OPTIONS, WORLD_OPTIONS } from './alpha-options';
import type { TableEvent } from './alpha-social';

const feedbackUrl=process.env.NEXT_PUBLIC_ALPHA_FEEDBACK_URL||'';
/** Device memory (never an account): the name used last time, the Alpha access code once accepted, the room this browser sits at. */
const NAME_KEY='aoh-alpha-name',ACCESS_KEY='aoh-alpha-access',ROOM_KEY='aoh-alpha-room',LEFT_KEY='aoh-alpha-left';
const store={
  get:(key:string)=>{try{return localStorage.getItem(key)??'';}catch{return '';}},
  set:(key:string,value:string)=>{try{localStorage.setItem(key,value);}catch{/* storage blocked: the invite link still works */}},
  drop:(key:string)=>{try{localStorage.removeItem(key);}catch{/* storage blocked */}},
};
type ErrorInfo={code:string;message:string};
type Phase='boot'|'entry'|'invite'|'joining';
/** A pasted invite may be the bare code or the whole link. */
const inviteCodeOf=(text:string)=>{const value=text.trim();const match=/(?:\/alpha\/join\/|[?&]join=)([A-Za-z0-9_-]{6,40})/.exec(value);return (match?.[1]??value).slice(0,22);};
const INVITE_ERRORS:Record<string,string>={NOT_FOUND:'Convite não encontrado',LOBBY_CLOSED:'Esta mesa não aceita mais pessoas',LEGACY_ROOM:'Partida de uma versão anterior',INVALID_INPUT:'Convite inválido'};
const inviteErrorText=(error:ErrorInfo)=>error.code==='NOT_FOUND'?'Este link não corresponde a nenhuma mesa ativa. Peça um novo convite a quem organizou a partida.'
  :error.code==='INVALID_INPUT'?'Confira se o link foi copiado inteiro.':error.message;
const Mark=({className}:{className:string})=><svg className={className} viewBox="-40 -46 80 92" aria-hidden="true"><polygon points="0,-44 38,-22 38,22 0,44 -38,22 -38,-22" fill="none" stroke="currentColor" strokeWidth="2"/><polygon points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15" fill="none" stroke="currentColor" strokeWidth="1" opacity=".55"/><path d="M0 -14V14M-12 -4L0 -14L12 -4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;

export default function AlphaShell(){
  const [room,setRoom]=useState<AlphaRoomView|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [name,setName]=useState(''),[title,setTitle]=useState('Mesa dos Horizontes'),[code,setCode]=useState(''),[preset,setPreset]=useState('QUICK'),[count,setCount]=useState(2),[timer,setTimer]=useState(0),[seed,setSeed]=useState(42),[world,setWorld]=useState('MIXED'),[mapSize,setMapSize]=useState<MapSize|''>(''),[actionsPerRound,setActionsPerRound]=useState(5),[revealMap,setRevealMap]=useState(false),[copied,setCopied]=useState<'code'|'link'|null>(null);
  const [theme,setTheme]=useState<string|null>(null),[options,setOptions]=useState(false);
  const [info,setInfo]=useState<{accessRequired:boolean;maxSeats:number}>({accessRequired:false,maxSeats:6}),[access,setAccess]=useState(''),[accessKnown,setAccessKnown]=useState(false);
  const [phase,setPhase]=useState<Phase>('boot'),[invite,setInvite]=useState(''),[knownName,setKnownName]=useState(''),[inviteError,setInviteError]=useState<ErrorInfo|null>(null);
  const [resume,setResume]=useState<string|null>(null),[feed,setFeed]=useState<TableEvent[]>([]),[connection,setConnection]=useState<'online'|'reconnecting'>('online'),feedKey=useRef(0),booted=useRef(false);
  useEffect(()=>{
    if(booted.current)return;booted.current=true; // React dev double-invokes effects: an invite must be posted once
    const preference=localStorage.getItem('aoh-alpha-theme')??'DARK';setTheme(preference);
    const savedAccess=store.get(ACCESS_KEY),remembered=store.get(NAME_KEY).trim().slice(0,80);
    setAccess(savedAccess);setAccessKnown(Boolean(savedAccess));setKnownName(remembered);setName(remembered);
    void fetch('/api/alpha?info=1',{cache:'no-store'}).then(r=>r.json()).then((reply:{ok:boolean;value?:{accessRequired:boolean;maxSeats:number}})=>{if(reply.ok&&reply.value){setInfo(reply.value);setCount(c=>Math.min(c,reply.value!.maxSeats));}}).catch(()=>undefined);
    const params=new URLSearchParams(location.search),invited=inviteCodeOf(params.get('join')??'');
    const left=store.get(LEFT_KEY)==='1',id=params.get('game')??store.get(ROOM_KEY);
    const readRoom=async(gameId:string)=>{try{return (await(await fetch(`/api/alpha?gameId=${encodeURIComponent(gameId)}`,{cache:'no-store'})).json()) as Reply;}catch{return null;}};
    const enter=(view:AlphaRoomView)=>{setRoom(view);store.set(ROOM_KEY,view.id);store.drop(LEFT_KEY);history.replaceState(null,'',`/alpha?game=${view.id}`);};
    if(invited){
      // Invite link: already seated at that table → resume; a name remembered on this device → join at once (a client POST, never the GET/redirect,
      // so a link preview cannot take a seat); otherwise the minimal name card.
      setInvite(invited);setPhase('joining');
      void (async()=>{
        if(id){const reply=await readRoom(id);if(reply?.ok&&reply.value.joinCode===invited){enter(reply.value);return;}}
        if(remembered)await joinInvite(invited,remembered);else setPhase('invite');
      })();
      return;
    }
    if(id&&left&&!params.get('game')){setResume(id);setPhase('entry');return;}
    if(!id){setPhase('entry');return;}
    void readRoom(id).then(reply=>{
      if(reply?.ok){enter(reply.value);return;}
      setPhase('entry');
      // A room this browser no longer sits at (or that a restart erased) is forgotten quietly; anything else is said.
      if(!reply)setError('Não foi possível reconectar. Verifique sua conexão.');
      else if(['NOT_FOUND','FORBIDDEN','UNAUTHENTICATED'].includes(reply.error.code)){store.drop(ROOM_KEY);if(params.get('game'))history.replaceState(null,'','/alpha');}
      else setError(reply.error.message);
    });
  },[]);
  useEffect(()=>{
    if(theme===null)return;
    localStorage.setItem('aoh-alpha-theme',theme);const media=matchMedia('(prefers-color-scheme: light)');
    const apply=()=>{document.documentElement.dataset.alphaTheme=theme==='SYSTEM'?(media.matches?'LIGHT':'DARK'):theme;};
    apply();media.addEventListener('change',apply);return()=>media.removeEventListener('change',apply);
  },[theme]);
  useEffect(()=>{
    if(!room)return;const id=room.id;let active=true,inflight=false,again=false;
    // Shared table: the server pushes "version N is saved" over SSE; the client then reads ITS authoritative projection at once. Nothing is applied locally
    // before the server confirms. The slow poll is only a safety net (a lost push, a proxy that buffers, several server instances).
    const log=(kind:string,extra:Record<string,unknown>={})=>{try{const sink=window as unknown as {__aohSync?:Record<string,unknown>[]};(sink.__aohSync??=[]).push({kind,t:Date.now(),...extra});}catch{/* instrumentation only */}};
    const pull=async(cause:string,serverAt?:number)=>{
      if(inflight){again=true;return;}
      inflight=true;
      try{
        do{
          again=false;
          const reply=(await(await fetch(`/api/alpha?gameId=${encodeURIComponent(id)}`,{cache:'no-store'})).json()) as Reply;
          if(active&&reply.ok){setRoom(old=>!old||old.id!==id||reply.value.version>=old.version?reply.value:old);log('applied',{cause,version:reply.value.version,serverAt});}
          await new Promise(resolve=>setTimeout(resolve,200)); // a burst of pushes from a busy table collapses into one read per 200 ms
        }while(again&&active);
      }catch{if(active)setError('Conexão interrompida. Tentando reconectar…');}
      finally{inflight=false;}
    };
    let source:EventSource|null=null;
    if(typeof EventSource!=='undefined'){
      source=new EventSource(`/api/alpha?gameId=${encodeURIComponent(id)}&stream=1`);
      source.onopen=()=>{setConnection('online');void pull('open');}; // reconnected: ask for the authoritative projection, never replay what was missed
      source.onerror=()=>setConnection('reconnecting');
      source.onmessage=event=>{try{
        const push=JSON.parse(event.data) as {version:number;at:number;event?:{type:string;playerId?:string;reaction?:string;hexId?:string}};log('push',{version:push.version,serverAt:push.at});
        const social=push.event;
        // Reactions and pings are ephemeral table events: shown, never fetched or saved.
        if(social&&(social.type==='REACTION'||social.type==='PING')&&social.playerId){setFeed(old=>[...old.slice(-19),{key:++feedKey.current,type:social.type as 'REACTION'|'PING',playerId:social.playerId!,reaction:social.reaction??'',...(social.hexId?{hexId:social.hexId}:{}),at:Date.now()}]);return;}
        void pull('push',push.at);}catch{/* ignore a malformed frame */}};
    }
    // Safety net only: 5 s while the push channel is open, 2.5 s while it is not.
    let tick=0;
    const interval=setInterval(()=>{if(document.visibilityState==='hidden')return;tick++;if(source?.readyState===1&&tick%2===1)return;void pull('poll');},2500);
    return()=>{active=false;source?.close();clearInterval(interval);};
  },[room?.id]);
  /** `handled` may take over an error (the invite card shows its own); otherwise it becomes the banner. */
  async function request(payload:Record<string,unknown>,handled?:(error:ErrorInfo)=>boolean){
    if(busy)return false;setBusy(true);setError('');
    try{
      // Shared-room CAS means another seat can advance the version between polls. Refresh immediately before a mutation so
      // ordinary sequential play does not manufacture a predictable 409; sendWithRecovery still covers a true race.
      let prepared=payload as {operation:string;gameId?:string;payload?:Record<string,unknown>};
      if((prepared.operation==='command'||prepared.operation==='lobby')&&prepared.gameId&&prepared.payload){
        const fresh=(await(await fetch(`/api/alpha?gameId=${encodeURIComponent(prepared.gameId)}`,{cache:'no-store'})).json()) as Reply;
        if(fresh.ok){
          setRoom(old=>!old||old.id!==fresh.value.id||fresh.value.version>=old.version?fresh.value:old);
          const expectedVersion=prepared.operation==='lobby'?fresh.value.version:fresh.value.game?.version;
          if(expectedVersion!==undefined)prepared={...prepared,payload:{...prepared.payload,expectedVersion}};
        }
      }
      // A VERSION_CONFLICT (another player acted first) refreshes the projection and repeats the same command once, never more.
      const outcome=await sendWithRecovery({
        post:async body=>(await(await fetch('/api/alpha',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})).json()) as Reply,
        fetchRoom:async id=>(await(await fetch(`/api/alpha?gameId=${encodeURIComponent(id)}`,{cache:'no-store'})).json()) as Reply,
      },prepared);
      const reply=outcome.reply;
      if(outcome.latest){const latest=outcome.latest;setRoom(old=>!old||old.id!==latest.id||latest.version>=old.version?latest:old);}
      if(!reply.ok){
        if(handled?.(reply.error))return false;
        const raw=`${reply.error.code}: ${reply.error.message}`,translated=ruleMessage(raw);setError(translated===raw?reply.error.message:translated);
        return false;
      }
      setRoom(old=>!old||old.id!==reply.value.id||reply.value.version>=old.version?reply.value:old);
      store.set(ROOM_KEY,reply.value.id);store.drop(LEFT_KEY);history.replaceState(null,'',`/alpha?game=${reply.value.id}`);
      return true;
    }catch{setError('Não foi possível confirmar a ação. Aguarde a reconexão antes de tentar novamente.');return false;}finally{setBusy(false);}
  }
  const remember=(value:string)=>{const clean=value.trim().slice(0,80);if(clean){store.set(NAME_KEY,clean);setKnownName(clean);}};
  async function joinInvite(inviteCode:string,displayName:string){
    setInviteError(null);setPhase('joining');
    const ok=await request({operation:'join',code:inviteCode,displayName:displayName.trim()},failure=>{if(INVITE_ERRORS[failure.code]){setInviteError(failure);return true;}return false;});
    if(ok)remember(displayName);else setPhase('invite');
  }
  function create(){
    const size=mapSize&&mapSizeAllows(mapSize,count)?mapSize:undefined;
    void request({operation:'create',...(info.accessRequired?{accessCode:access}:{}),payload:{name:title,displayName:name,preset,worldPreset:world,...(size?{mapSize:size}:{}),seatLimit:count,seed,planningSeconds:timer,actionsPerRound,revealMap}},failure=>{
      // A remembered access code that stopped working is forgotten and the field comes back.
      if(failure.code==='ACCESS_CODE'){store.drop(ACCESS_KEY);setAccessKnown(false);setAccess('');}
      return false;
    }).then(ok=>{if(ok){remember(name);if(info.accessRequired&&access){store.set(ACCESS_KEY,access);setAccessKnown(true);}}});
  }
  /** "Não sou eu": the remembered name belongs to someone else on this device. */
  function forget(){store.drop(NAME_KEY);setKnownName('');setName('');}
  /** Back to the entry screen (a new room), leaving any invite or read-only room behind. */
  function fresh(){
    history.replaceState(null,'','/alpha');setInvite('');setInviteError(null);setPhase('entry');
    if(room?.legacy)store.drop(ROOM_KEY);
    setRoom(null);setError('');
  }
  /** Forgets the match in this browser only: nothing is sent, so the saved match and every seat stay exactly as they were. */
  function leave(){
    // "Sair e poder voltar": tell the server this person left on purpose (presence + host role), never touching the seat.
    if(room)void fetch('/api/alpha',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'room',gameId:room.id,payload:{type:'LEAVE'}})}).catch(()=>undefined);
    store.set(LEFT_KEY,'1');
    history.replaceState(null,'','/alpha');setRoom(null);setError('');setCode('');setInvite('');setPhase('entry');
  }
  function copy(kind:'code'|'link',value:string){
    navigator.clipboard.writeText(value).then(()=>{setCopied(kind);setTimeout(()=>setCopied(null),2500);}).catch(()=>setError('Não foi possível copiar. Selecione e copie o código manualmente.'));
  }
  /** Reactions and pings never block the UI and never show an error. */
  const social=(payload:Record<string,unknown>)=>{if(room)void fetch('/api/alpha',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'room',gameId:room.id,payload})}).catch(()=>undefined);};
  const roomSend=(payload:Record<string,unknown>)=>request({operation:'room',gameId:room!.id,payload});
  const lobby=(payload:Record<string,unknown>)=>request({operation:'lobby',gameId:room!.id,payload:{...payload,expectedVersion:room!.version}});
  const playing=Boolean(room?.game);
  const recommended=recommendedMapSize(count);
  const showAccess=info.accessRequired&&!accessKnown;
  const nameHead=<div className="alpha-field-head"><label htmlFor="alpha-name">Seu nome</label>{knownName&&name===knownName&&<button type="button" className="alpha-link" onClick={forget}>Não sou eu</button>}</div>;
  const nameInput=<input id="alpha-name" value={name} onChange={e=>setName(e.target.value)} maxLength={80} autoComplete="nickname" placeholder="Como os outros vão te ver"/>;
  const resumeCard=resume&&<div className="alpha-resume" role="group" aria-label="Voltar à partida"><p>Você saiu de uma partida em andamento. Sua civilização continua no lugar.</p><button type="button" className="primary" onClick={()=>{const id=resume;setResume(null);store.drop(LEFT_KEY);void fetch(`/api/alpha?gameId=${encodeURIComponent(id)}`,{cache:'no-store'}).then(r=>r.json()).then((reply:Reply)=>{if(reply.ok){setRoom(reply.value);history.replaceState(null,'',`/alpha?game=${reply.value.id}`);}else setError(reply.error.message);}).catch(()=>setError('Não foi possível reconectar.'));}}>Voltar à minha partida</button></div>;
  return <main className={`alpha-shell${playing?' alpha-game alpha-mesa':' alpha-front'}`} aria-busy={busy}>
    {!playing&&<header className="alpha-masthead"><a href="/alpha" className="alpha-wordmark"><span aria-hidden="true">AH</span> AGES OF HEGEMONY</a><small>TEST BUILD · Alpha em desenvolvimento</small><label>Tema <select value={theme??'SYSTEM'} onChange={e=>setTheme(e.target.value)}><option value="SYSTEM">Sistema</option><option value="DARK">Escuro</option><option value="LIGHT">Claro</option></select></label></header>}
    {error&&<div role="alert" className="alpha-error">{error}<button onClick={()=>setError('')} aria-label="Fechar mensagem">×</button></div>}
    {!room?<section className={`alpha-entry${options&&phase==='entry'?' has-options':''}`} data-phase={phase}>
      <div className="alpha-entry-hero"><Mark className="alpha-entry-mark"/>
        <p className="aoh-eyebrow">UMA CIVILIZAÇÃO COMEÇA COM UMA MESA</p><h1>Ages of Hegemony</h1><p className="alpha-entry-tagline">Escolha uma civilização e uma Figura, convide até {info.maxSeats-1} pessoas e transforme decisões em história.</p></div>
      {phase==='boot'?<div className="alpha-entry-card alpha-entry-wait aoh-glass" role="status"><p>Abrindo a mesa…</p></div>
      :phase==='joining'?<div className="alpha-entry-card alpha-entry-wait aoh-glass" role="status"><p className="aoh-eyebrow">CONVITE</p><p>{knownName?<>Entrando na mesa como <b>{knownName}</b>…</>:'Abrindo o convite…'}</p></div>
      :phase==='invite'?<form className="alpha-entry-card alpha-invite-card aoh-glass" onSubmit={e=>{e.preventDefault();if(!inviteError&&name.trim())void joinInvite(invite,name);}}>
        <p className="aoh-eyebrow">CONVITE PARA UMA MESA</p>
        <h2>{inviteError?INVITE_ERRORS[inviteError.code]:'Você foi convidado'}</h2>
        <span className="aoh-chip alpha-invite-chip" data-code={invite} title={`Código de convite: ${invite}`}><b>Convite</b> <code>{invite.slice(0,8)}{invite.length>8?'…':''}</code></span>
        {inviteError?<div className="alpha-invite-error" role="alert"><p>{inviteErrorText(inviteError)}</p><button type="button" className="primary" onClick={fresh}>Criar nova sala</button></div>
        :<>{knownName&&name===knownName?<div className="alpha-invite-known"><p>Você vai entrar como <b>{knownName}</b>.</p><button type="button" className="alpha-link" onClick={forget}>Não sou eu</button></div>:<div className="alpha-field">{nameHead}{nameInput}</div>}
          <button className="primary" disabled={busy||!name.trim()}>Entrar na partida</button>
          <button type="button" className="alpha-link" onClick={fresh}>Prefiro criar minha própria mesa</button></>}
      </form>
      :<div className="alpha-entry-card aoh-glass">{resumeCard}
        <form className="alpha-entry-create" onSubmit={e=>{e.preventDefault();create();}}>
          <div className="alpha-entry-main"><h2>Nova mesa</h2>
            <div className="alpha-field">{nameHead}{nameInput}</div>
            <div className="alpha-form-row"><label>Lugares<select value={count} onChange={e=>setCount(Number(e.target.value))}>{[2,3,4,5,6].filter(n=>n<=info.maxSeats).map(n=><option key={n} value={n}>{n}</option>)}</select></label><label>Duração<select value={preset} onChange={e=>setPreset(e.target.value)}>{PRESET_OPTIONS.map(([value,text,rhythm])=><option key={value} value={value}>{text} · {rhythm}</option>)}</select></label></div>
            {showAccess&&<label className="alpha-access">Código de acesso do Alpha<input value={access} onChange={e=>setAccess(e.target.value)} autoComplete="off" type="password" placeholder="Fornecido pela equipe do Alpha"/></label>}
          </div>
          {options&&<div className="alpha-entry-options" id="alpha-entry-options"><h2>Opções da mesa</h2>
            <label>Nome da partida<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={80}/></label>
            <div className="alpha-form-row"><label>Mundo<select value={world} onChange={e=>setWorld(e.target.value)}>{WORLD_OPTIONS.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></label>
              <label>Tamanho do mapa<select value={mapSize} onChange={e=>setMapSize(e.target.value as MapSize|'')}><option value="">Automático · {MAP_SIZE_NAMES[recommended]}</option>{MAP_SIZES.map(size=><option key={size} value={size} disabled={!mapSizeAllows(size,count)}>{MAP_SIZE_NAMES[size]}{mapSizeAllows(size,count)?'':' · até 4 jogadores'}</option>)}</select></label></div>
            <small className="alpha-entry-hint">{WORLD_OPTIONS.find(([value])=>value===world)?.[2]}</small>
            <div className="alpha-form-row"><label>Ordens por rodada<select value={actionsPerRound} onChange={e=>setActionsPerRound(Number(e.target.value))}>{ORDER_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}</select></label><label>Prazo por fase<select value={timer} onChange={e=>setTimer(Number(e.target.value))}>{PLANNING_OPTIONS.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></label></div>
            <div className="alpha-form-row"><label>Semente<input type="number" min={0} max={4294967295} value={seed} onChange={e=>setSeed(Number(e.target.value))}/></label><label className="alpha-check"><input type="checkbox" checked={revealMap} onChange={e=>setRevealMap(e.target.checked)}/> Mapa revelado (teste)</label></div>
          </div>}
          <div className="alpha-entry-actions"><button type="button" className="alpha-options-toggle" aria-expanded={options} aria-controls="alpha-entry-options" onClick={()=>setOptions(o=>!o)}>Opções da mesa</button><button className="primary" disabled={busy||!name.trim()||!title.trim()||(showAccess&&!access.trim())}>Criar partida</button></div>
        </form>
        <form className="alpha-entry-join" onSubmit={e=>{e.preventDefault();void request({operation:'join',code:inviteCodeOf(code),displayName:name.trim()}).then(ok=>{if(ok)remember(name);});}}><div className="alpha-entry-join-row"><label>Código de convite<input value={code} onChange={e=>setCode(e.target.value)} autoComplete="off" spellCheck={false} placeholder="Cole o código ou o link"/></label><button disabled={busy||!name.trim()||!code.trim()}>Entrar na partida</button></div></form>
      </div>}
      <p role="note" className="alpha-test-notice"><b>Ambiente de teste · Alpha.</b> Partidas podem ser reiniciadas ou apagadas. Use apenas um apelido; não informe dados pessoais.{feedbackUrl&&<> <a href={feedbackUrl} target="_blank" rel="noreferrer">Enviar feedback</a></>}{process.env.NODE_ENV!=='production'&&<> · <a href="/">experiência local</a></>}</p></section>
      :room.game?<>{room.legacy&&<div className="alpha-legacy-toast" role="status"><span>{room.legacyMessage}</span><button type="button" className="primary" onClick={fresh}>Criar nova sala</button></div>}<AlphaBoard room={room} busy={busy} theme={theme??'DARK'} onTheme={setTheme} onLeave={leave} roomSend={roomSend} social={social} feed={feed} connection={connection} send={payload=>request({operation:'command',gameId:room.id,payload:{...payload,expectedVersion:room.game!.version}})}/></>
      :room.legacy?<LegacyRoom room={room} onNew={fresh}/>
      :room.lifecycle==='CLOSED'?<section className="alpha-lobby alpha-lobby-closed"><div className="alpha-entry-card aoh-glass"><p className="aoh-eyebrow">MESA ENCERRADA</p><h1>Sala encerrada</h1><p>O anfitrião encerrou esta sala antes do início.</p><button className="primary" onClick={leave}>Voltar ao início</button></div></section>
      :<AlphaLobby room={room} busy={busy} lobby={lobby} copy={copy} copied={copied} onLeave={leave}/>}
  </main>;
}

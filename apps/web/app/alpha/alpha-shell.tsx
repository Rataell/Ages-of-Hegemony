'use client';
import { useEffect, useRef, useState } from 'react';
import { CIVILIZATIONS } from '@aoh/game-domain';
import { CivilizationRoster } from './alpha-roster';
import type { AlphaRoomView } from '@aoh/server/alpha';
import AlphaBoard from './alpha-board';
import { ruleMessage } from '../play/presentation';
import { sendWithRecovery, type Reply } from './send-command';
import { LeaveGame } from './alpha-leave';
import { PLANNING_OPTIONS, WORLD_OPTIONS } from './alpha-options';
import type { TableEvent } from './alpha-social';

const feedbackUrl=process.env.NEXT_PUBLIC_ALPHA_FEEDBACK_URL||'';
export default function AlphaShell(){
  const [room,setRoom]=useState<AlphaRoomView|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [name,setName]=useState(''),[title,setTitle]=useState('Mesa dos Horizontes'),[code,setCode]=useState(''),[preset,setPreset]=useState('QUICK'),[count,setCount]=useState(2),[timer,setTimer]=useState(0),[seed,setSeed]=useState(42),[world,setWorld]=useState('MIXED'),[actionsPerRound,setActionsPerRound]=useState(5),[revealMap,setRevealMap]=useState(false),[copied,setCopied]=useState<'code'|'link'|null>(null);
  const [theme,setTheme]=useState<string|null>(null);
  const [info,setInfo]=useState<{accessRequired:boolean;maxSeats:number}>({accessRequired:false,maxSeats:6}),[access,setAccess]=useState('');
  const [resume,setResume]=useState<string|null>(null),[feed,setFeed]=useState<TableEvent[]>([]),[connection,setConnection]=useState<'online'|'reconnecting'>('online'),feedKey=useRef(0);
  useEffect(()=>{
    const preference=localStorage.getItem('aoh-alpha-theme')??'DARK';setTheme(preference);
    try{setAccess(localStorage.getItem('aoh-alpha-access')??'');}catch{/* storage blocked */}
    void fetch('/api/alpha?info=1',{cache:'no-store'}).then(r=>r.json()).then((reply:{ok:boolean;value?:{accessRequired:boolean;maxSeats:number}})=>{if(reply.ok&&reply.value){setInfo(reply.value);setCount(c=>Math.min(c,reply.value!.maxSeats));}}).catch(()=>undefined);
    const params=new URLSearchParams(location.search);setCode(params.get('join')??'');
    const left=localStorage.getItem('aoh-alpha-left')==='1',id=params.get('game')??localStorage.getItem('aoh-alpha-room');
    if(id&&left&&!params.get('game')){setResume(id);return;}
    if(id)void fetch(`/api/alpha?gameId=${encodeURIComponent(id)}`,{cache:'no-store'}).then(r=>r.json()).then((reply:Reply)=>{if(reply.ok){setRoom(reply.value);localStorage.setItem('aoh-alpha-room',reply.value.id);localStorage.removeItem('aoh-alpha-left');}else setError(reply.error.message);}).catch(()=>setError('Não foi possível reconectar. Verifique sua conexão.'));
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
  async function request(payload:Record<string,unknown>){
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
        const raw=`${reply.error.code}: ${reply.error.message}`,translated=ruleMessage(raw);setError(translated===raw?reply.error.message:translated);
        return false;
      }
      setRoom(old=>!old||old.id!==reply.value.id||reply.value.version>=old.version?reply.value:old);
      localStorage.setItem('aoh-alpha-room',reply.value.id);localStorage.removeItem('aoh-alpha-left');history.replaceState(null,'',`/alpha?game=${reply.value.id}`);
      return true;
    }catch{setError('Não foi possível confirmar a ação. Aguarde a reconexão antes de tentar novamente.');return false;}finally{setBusy(false);}
  }
  /** Forgets the match in this browser only: nothing is sent, so the saved match and every seat stay exactly as they were. */
  function leave(){
    // "Sair e poder voltar": tell the server this person left on purpose (presence + host role), never touching the seat.
    if(room)void fetch('/api/alpha',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'room',gameId:room.id,payload:{type:'LEAVE'}})}).catch(()=>undefined);
    try{localStorage.setItem('aoh-alpha-left','1');}catch{/* storage may be blocked; the invite link is enough */}
    history.replaceState(null,'','/alpha');setRoom(null);setError('');setCode('');
  }
  function copy(kind:'code'|'link',value:string){
    navigator.clipboard.writeText(value).then(()=>{setCopied(kind);setTimeout(()=>setCopied(null),2500);}).catch(()=>setError('Não foi possível copiar. Selecione e copie o código manualmente.'));
  }
  /** Reactions and pings never block the UI and never show an error. */
  const social=(payload:Record<string,unknown>)=>{if(room)void fetch('/api/alpha',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'room',gameId:room.id,payload})}).catch(()=>undefined);};
  const roomSend=(payload:Record<string,unknown>)=>request({operation:'room',gameId:room!.id,payload});
  const lobby=(payload:Record<string,unknown>)=>request({operation:'lobby',gameId:room!.id,payload:{...payload,expectedVersion:room!.version}});
  const playing=Boolean(room?.game);
  return <main className={`alpha-shell${playing?' alpha-game alpha-mesa':''}`} aria-busy={busy}>
    {!playing&&<header className="alpha-masthead"><a href="/alpha" className="alpha-wordmark"><span aria-hidden="true">AH</span> AGES OF HEGEMONY</a><small>TEST BUILD · Alpha v0.1 em desenvolvimento</small><label>Tema <select value={theme??'SYSTEM'} onChange={e=>setTheme(e.target.value)}><option value="SYSTEM">Sistema</option><option value="DARK">Escuro</option><option value="LIGHT">Claro</option></select></label></header>}
    {error&&<div role="alert" className="alpha-error">{error}<button onClick={()=>setError('')} aria-label="Fechar mensagem">×</button></div>}
    {!room?<section className="alpha-entry">
      <div className="alpha-entry-hero"><svg className="alpha-entry-mark" viewBox="-40 -46 80 92" aria-hidden="true"><polygon points="0,-44 38,-22 38,22 0,44 -38,22 -38,-22" fill="none" stroke="currentColor" strokeWidth="2"/><polygon points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15" fill="none" stroke="currentColor" strokeWidth="1" opacity=".55"/><path d="M0 -14V14M-12 -4L0 -14L12 -4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <p className="aoh-eyebrow">UMA CIVILIZAÇÃO COMEÇA COM UMA MESA</p><h1>Ages of Hegemony</h1><p className="alpha-entry-tagline">Escolha uma civilização, convide até três pessoas e transforme decisões em história.</p></div>
      <div className="alpha-entry-card aoh-glass">{resume&&<div className="alpha-resume" role="group" aria-label="Voltar à partida"><p>Você saiu de uma partida em andamento. Sua civilização continua no lugar.</p><button type="button" className="primary" onClick={()=>{const id=resume;setResume(null);try{localStorage.removeItem('aoh-alpha-left');}catch{/* storage blocked */}void fetch(`/api/alpha?gameId=${encodeURIComponent(id)}`,{cache:'no-store'}).then(r=>r.json()).then((reply:Reply)=>{if(reply.ok){setRoom(reply.value);history.replaceState(null,'',`/alpha?game=${reply.value.id}`);}else setError(reply.error.message);}).catch(()=>setError('Não foi possível reconectar.'));}}>Voltar à minha partida</button></div>}
        <div className="alpha-entry-who"><label>Seu nome<input value={name} onChange={e=>setName(e.target.value)} maxLength={80} autoComplete="nickname" placeholder="Como os outros vão te ver" /></label>{info.accessRequired&&<label>Código de acesso do Alpha<input value={access} onChange={e=>{setAccess(e.target.value);try{localStorage.setItem('aoh-alpha-access',e.target.value);}catch{/* storage blocked */}}} autoComplete="off" type="password"/></label>}</div>
        <form className="alpha-entry-create" onSubmit={e=>{e.preventDefault();void request({operation:'create',accessCode:access,payload:{name:title,displayName:name,preset,worldPreset:world,seatLimit:count,seed,planningSeconds:timer,actionsPerRound,revealMap}});}}><h2>Preparar uma mesa</h2>
          <div className="alpha-form-row"><label>Lugares<select value={count} onChange={e=>setCount(Number(e.target.value))}>{[2,3,4,5,6].filter(n=>n<=info.maxSeats).map(n=><option key={n}>{n}</option>)}</select></label><label>Duração<select value={preset} onChange={e=>setPreset(e.target.value)}><option value="QUICK">Rápida · 7 Eras × 3 rodadas</option><option value="STANDARD">Padrão · 7 Eras × 5 rodadas</option><option value="EPIC">Épica · 7 Eras × 7 rodadas</option></select></label></div>
          <details className="alpha-advanced"><summary>Opções da mesa</summary><div className="alpha-advanced-body"><label>Nome da partida<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={80}/></label><div className="alpha-form-row"><label>Ordens por rodada<select value={actionsPerRound} onChange={e=>setActionsPerRound(Number(e.target.value))}>{[3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}</select></label><label>Mundo<select value={world} onChange={e=>setWorld(e.target.value)}>{WORLD_OPTIONS.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></label></div><div className="alpha-form-row"><label>Prazo por fase<select value={timer} onChange={e=>setTimer(Number(e.target.value))}>{PLANNING_OPTIONS.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></label><label>Semente<input type="number" min={0} max={4294967295} value={seed} onChange={e=>setSeed(Number(e.target.value))}/></label></div><label className="alpha-check"><input type="checkbox" checked={revealMap} onChange={e=>setRevealMap(e.target.checked)}/> Mapa revelado (teste)</label></div></details>
          <button className="primary" disabled={busy||!name.trim()||!title.trim()}>Criar partida</button></form>
        <div className="alpha-entry-or" role="separator"><span>ou</span></div>
        <form className="alpha-entry-join" onSubmit={e=>{e.preventDefault();void request({operation:'join',code:code.trim(),displayName:name,accessCode:access});}}><h2>Recebeu um convite?</h2><div className="alpha-entry-join-row"><label>Código de convite<input value={code} onChange={e=>setCode(e.target.value)} autoComplete="off" spellCheck={false} placeholder="Cole o código ou abra o link"/></label><button disabled={busy||!name.trim()||!code.trim()}>Entrar na partida</button></div></form>
      </div>
      <p role="note" className="alpha-test-notice"><b>Ambiente de teste · Alpha.</b> Partidas podem ser reiniciadas ou apagadas. Use apenas um apelido; não informe dados pessoais.{feedbackUrl&&<> <a href={feedbackUrl} target="_blank" rel="noreferrer">Enviar feedback</a></>}{process.env.NODE_ENV!=='production'&&<> · <a href="/">experiência local</a></>}</p></section>
      :room.game?<AlphaBoard room={room} busy={busy} theme={theme??'DARK'} onTheme={setTheme} onLeave={leave} roomSend={roomSend} social={social} feed={feed} connection={connection} send={payload=>request({operation:'command',gameId:room.id,payload:{...payload,expectedVersion:room.game!.version}})}/>
      :room.lifecycle==='CLOSED'?<section className="alpha-lobby"><h1>Sala encerrada</h1><p>O anfitrião encerrou esta sala antes do início.</p><button onClick={leave}>Voltar ao início</button></section>
      :<section className="alpha-lobby"><div className="alpha-lobby-heading"><div><p className="eyebrow">PREPARAÇÃO DA MESA</p><h1>{room.name}</h1><p>{room.seats.length} / {room.seatLimit} pessoas · {room.actionsPerRound} ações por rodada · Semente {room.seed}</p></div><div><p>Convide outra pessoa</p><code>{room.joinCode}</code><div className="alpha-invite-actions"><button onClick={()=>copy('code',room.joinCode)}>Copiar código</button><button onClick={()=>copy('link',`${location.origin}/alpha/join/${room.joinCode}`)}>Copiar link</button><span role="status" className="alpha-copied">{copied==='code'?'Código copiado':copied==='link'?'Link copiado':''}</span></div></div></div>
        <div className="alpha-seats">{room.seats.map(seat=><article className="alpha-card" key={seat.playerId}><small>{seat.bot?'BOT':seat.isHost?'ANFITRIÃO':'CONVIDADO'}{seat.playerId===room.selfPlayerId?' · VOCÊ':''}</small><h2>{seat.name}</h2><p>{CIVILIZATIONS.find(c=>c.id===seat.civilization)?.name??'Escolhendo civilização'}</p><strong>{seat.ready?'Pronto':'Preparando'}</strong>{seat.bot?<><small className="aoh-chip">BOT</small>{room.isHost&&<button type="button" className="aoh-btn is-sm is-ghost" disabled={busy} onClick={()=>void lobby({type:'REMOVE_BOT',playerId:seat.playerId})}>Remover bot</button>}</>:<><small><i className={`presence-dot is-${seat.presence.toLowerCase()}`} aria-hidden="true"/> {seat.presence==='ONLINE'?'Online':seat.presence==='RECONNECTING'?'Reconectando…':'Ausente'}</small>{room.isHost&&seat.playerId!==room.selfPlayerId&&<button type="button" className="aoh-btn is-sm is-ghost" disabled={busy} onClick={()=>void lobby({type:'KICK',playerId:seat.playerId})}>Remover da sala</button>}</>}</article>)}</div>
        {room.isHost&&room.seats.length<room.seatLimit&&<div className="alpha-add-bot"><button type="button" className="aoh-btn" disabled={busy} onClick={()=>void lobby({type:'ADD_BOT'})}>Adicionar bot</button><small>Ocupa um lugar vazio com um jogador artificial (experimental). Pelo menos uma pessoa precisa jogar.</small></div>}
        <h2>Seu tabuleiro de civilização</h2><CivilizationRoster selfChoice={room.seats.find(s=>s.playerId===room.selfPlayerId)?.civilization??null} locked={busy||Boolean(room.seats.find(s=>s.playerId===room.selfPlayerId)?.ready)} chosenBy={id=>{const seat=room.seats.find(s=>s.civilization===id&&s.playerId!==room.selfPlayerId);return seat?seat.name:null;}} onChoose={id=>void lobby({type:'CHOOSE_CIVILIZATION',civilization:id})}/>
        <footer className="alpha-lobby-controls"><button className="primary" disabled={busy||!room.seats.find(s=>s.playerId===room.selfPlayerId)?.civilization} onClick={()=>void lobby({type:'LOBBY_READY',ready:!room.seats.find(s=>s.playerId===room.selfPlayerId)!.ready})}>{room.seats.find(s=>s.playerId===room.selfPlayerId)!.ready?'Voltar à preparação':'Estou pronto'}</button>{room.isHost&&<><label>Lugares <select value={room.seatLimit} disabled={busy} onChange={e=>void lobby({type:'SET_SEATS',seatLimit:Number(e.target.value)})}>{[2,3,4,5,6].filter(n=>n<=room.maxSeats&&n>=room.seats.length).map(n=><option key={n} value={n}>{n}</option>)}</select></label><button disabled={busy||room.seats.length<2||room.seats.some(s=>!s.ready)} onClick={()=>void lobby({type:'START'})}>Iniciar partida</button><button type="button" className="alpha-leave" disabled={busy} onClick={()=>{if(confirm('Encerrar esta sala? Ninguém mais poderá entrar.'))void lobby({type:'CLOSE_ROOM'});}}>Encerrar sala</button></>}<small>O anfitrião inicia após todos confirmarem.</small><LeaveGame joinCode={room.joinCode} onLeave={leave}/></footer>
      </section>}
  </main>;
}

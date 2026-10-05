'use client';
import { useEffect, useState } from 'react';
import { CIVILIZATIONS } from '@aoh/game-domain';
import { CivilizationRoster } from './alpha-roster';
import type { AlphaRoomView } from '@aoh/server/alpha';
import AlphaBoard from './alpha-board';
import { ruleMessage } from '../play/presentation';
import { sendWithRecovery, type Reply } from './send-command';
import { LeaveGame } from './alpha-leave';
import { PLANNING_OPTIONS, WORLD_OPTIONS } from './alpha-options';

const feedbackUrl=process.env.NEXT_PUBLIC_ALPHA_FEEDBACK_URL||'';
export default function AlphaShell(){
  const [room,setRoom]=useState<AlphaRoomView|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [name,setName]=useState(''),[title,setTitle]=useState('Mesa dos Horizontes'),[code,setCode]=useState(''),[preset,setPreset]=useState('QUICK'),[count,setCount]=useState(2),[timer,setTimer]=useState(0),[seed,setSeed]=useState(42),[world,setWorld]=useState('MIXED'),[actionsPerRound,setActionsPerRound]=useState(5),[revealMap,setRevealMap]=useState(false),[copied,setCopied]=useState<'code'|'link'|null>(null);
  const [theme,setTheme]=useState<string|null>(null);
  useEffect(()=>{
    const preference=localStorage.getItem('aoh-alpha-theme')??'DARK';setTheme(preference);
    const params=new URLSearchParams(location.search);setCode(params.get('join')??'');
    const id=params.get('game')??localStorage.getItem('aoh-alpha-room');
    if(id)void fetch(`/api/alpha?gameId=${encodeURIComponent(id)}`,{cache:'no-store'}).then(r=>r.json()).then((reply:Reply)=>{if(reply.ok){setRoom(reply.value);localStorage.setItem('aoh-alpha-room',reply.value.id);}else setError(reply.error.message);}).catch(()=>setError('Não foi possível reconectar. Verifique sua conexão.'));
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
        }while(again&&active);
      }catch{if(active)setError('Conexão interrompida. Tentando reconectar…');}
      finally{inflight=false;}
    };
    let source:EventSource|null=null;
    if(typeof EventSource!=='undefined'){
      source=new EventSource(`/api/alpha?gameId=${encodeURIComponent(id)}&stream=1`);
      source.onmessage=event=>{try{const push=JSON.parse(event.data) as {version:number;at:number};log('push',{version:push.version,serverAt:push.at});void pull('push',push.at);}catch{/* ignore a malformed frame */}};
    }
    const interval=setInterval(()=>{if(document.visibilityState==='hidden')return;void pull('poll');},source?10000:2500);
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
      localStorage.setItem('aoh-alpha-room',reply.value.id);history.replaceState(null,'',`/alpha?game=${reply.value.id}`);
      return true;
    }catch{setError('Não foi possível confirmar a ação. Aguarde a reconexão antes de tentar novamente.');return false;}finally{setBusy(false);}
  }
  /** Forgets the match in this browser only: nothing is sent, so the saved match and every seat stay exactly as they were. */
  function leave(){
    try{localStorage.removeItem('aoh-alpha-room');}catch{/* storage may be blocked; the URL below is enough */}
    history.replaceState(null,'','/alpha');setRoom(null);setError('');setCode('');
  }
  function copy(kind:'code'|'link',value:string){
    navigator.clipboard.writeText(value).then(()=>{setCopied(kind);setTimeout(()=>setCopied(null),2500);}).catch(()=>setError('Não foi possível copiar. Selecione e copie o código manualmente.'));
  }
  const lobby=(payload:Record<string,unknown>)=>request({operation:'lobby',gameId:room!.id,payload:{...payload,expectedVersion:room!.version}});
  const playing=Boolean(room?.game);
  return <main className={`alpha-shell${playing?' alpha-game alpha-mesa':''}`} aria-busy={busy}>
    {!playing&&<header className="alpha-masthead"><a href="/alpha" className="alpha-wordmark"><span aria-hidden="true">AH</span> AGES OF HEGEMONY</a><small>TEST BUILD · Alpha v0.1 em desenvolvimento</small><label>Tema <select value={theme??'SYSTEM'} onChange={e=>setTheme(e.target.value)}><option value="SYSTEM">Sistema</option><option value="DARK">Escuro</option><option value="LIGHT">Claro</option></select></label></header>}
    {error&&<div role="alert" className="alpha-error">{error}<button onClick={()=>setError('')} aria-label="Fechar mensagem">×</button></div>}
    {!room?<section className="alpha-entry"><div className="alpha-intro"><p className="eyebrow">UMA CIVILIZAÇÃO COMEÇA COM UMA MESA</p><h1>Horizontes por<br/>construir.</h1><p>Escolha uma civilização. Compartilhe um convite. Transforme decisões em história.</p><p>Teste online para 2 a 6 pessoas. Sem inteligência artificial. Esta versão ainda está em integração.</p><p role="note" className="alpha-test-notice"><b>Ambiente de teste · Alpha v0.1.</b> Partidas podem ser reiniciadas ou apagadas durante o teste. Use apenas um apelido; não informe dados pessoais.{feedbackUrl&&<> <a href={feedbackUrl} target="_blank" rel="noreferrer">Enviar feedback</a></>}</p>{process.env.NODE_ENV!=='production'&&<a href="/">Abrir experiência local existente</a>}</div>
      <div className="alpha-entry-forms"><label>Seu nome<input value={name} onChange={e=>setName(e.target.value)} maxLength={80} autoComplete="nickname" /></label>
        <form onSubmit={e=>{e.preventDefault();void request({operation:'create',payload:{name:title,displayName:name,preset,worldPreset:world,seatLimit:count,seed,planningSeconds:timer,actionsPerRound,revealMap}});}}><h2>Preparar uma mesa</h2><label>Nome da partida<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={80}/></label><div className="alpha-form-row"><label>Lugares<select value={count} onChange={e=>setCount(Number(e.target.value))}>{[2,3,4,5,6].map(n=><option key={n}>{n}</option>)}</select></label><label>Duração<select value={preset} onChange={e=>setPreset(e.target.value)}><option value="QUICK">Rápida · 7 Eras × 3 rodadas</option><option value="STANDARD">Padrão · 7 Eras × 5 rodadas</option><option value="EPIC">Épica · 7 Eras × 7 rodadas</option></select></label><label>Ordens por rodada<select value={actionsPerRound} onChange={e=>setActionsPerRound(Number(e.target.value))}>{[3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}</select></label><label className="alpha-check"><input type="checkbox" checked={revealMap} onChange={e=>setRevealMap(e.target.checked)}/> Mapa revelado (teste)</label></div><div className="alpha-form-row"><label>Mundo<select value={world} onChange={e=>setWorld(e.target.value)}>{WORLD_OPTIONS.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></label><label>Semente<input type="number" min={0} max={4294967295} value={seed} onChange={e=>setSeed(Number(e.target.value))}/></label><label>Prazo por fase<select value={timer} onChange={e=>setTimer(Number(e.target.value))}>{PLANNING_OPTIONS.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></label></div><button className="primary" disabled={busy||!name.trim()||!title.trim()}>Criar partida</button></form>
        <form onSubmit={e=>{e.preventDefault();void request({operation:'join',code:code.trim(),displayName:name});}}><h2>Recebeu um convite?</h2><label>Código de convite<input value={code} onChange={e=>setCode(e.target.value)} autoComplete="off" spellCheck={false}/></label><button disabled={busy||!name.trim()||!code.trim()}>Entrar na partida</button></form></div></section>
      :room.game?<AlphaBoard room={room} busy={busy} theme={theme??'DARK'} onTheme={setTheme} onLeave={leave} send={payload=>request({operation:'command',gameId:room.id,payload:{...payload,expectedVersion:room.game!.version}})}/>
      :<section className="alpha-lobby"><div className="alpha-lobby-heading"><div><p className="eyebrow">PREPARAÇÃO DA MESA</p><h1>{room.name}</h1><p>{room.seats.length} / {room.seatLimit} pessoas · {room.actionsPerRound} ações por rodada · Semente {room.seed}</p></div><div><p>Convide outra pessoa</p><code>{room.joinCode}</code><div className="alpha-invite-actions"><button onClick={()=>copy('code',room.joinCode)}>Copiar código</button><button onClick={()=>copy('link',`${location.origin}/alpha?join=${room.joinCode}`)}>Copiar link</button><span role="status" className="alpha-copied">{copied==='code'?'Código copiado':copied==='link'?'Link copiado':''}</span></div></div></div>
        <div className="alpha-seats">{room.seats.map(seat=><article className="alpha-card" key={seat.playerId}><small>{seat.isHost?'ANFITRIÃO':'CONVIDADO'}{seat.playerId===room.selfPlayerId?' · VOCÊ':''}</small><h2>{seat.name}</h2><p>{CIVILIZATIONS.find(c=>c.id===seat.civilization)?.name??'Escolhendo civilização'}</p><strong>{seat.ready?'Pronto':'Preparando'}</strong></article>)}</div>
        <h2>Seu tabuleiro de civilização</h2><CivilizationRoster selfChoice={room.seats.find(s=>s.playerId===room.selfPlayerId)?.civilization??null} locked={busy||Boolean(room.seats.find(s=>s.playerId===room.selfPlayerId)?.ready)} chosenBy={id=>{const seat=room.seats.find(s=>s.civilization===id&&s.playerId!==room.selfPlayerId);return seat?seat.name:null;}} onChoose={id=>void lobby({type:'CHOOSE_CIVILIZATION',civilization:id})}/>
        <footer className="alpha-lobby-controls"><button className="primary" disabled={busy||!room.seats.find(s=>s.playerId===room.selfPlayerId)?.civilization} onClick={()=>void lobby({type:'LOBBY_READY',ready:!room.seats.find(s=>s.playerId===room.selfPlayerId)!.ready})}>{room.seats.find(s=>s.playerId===room.selfPlayerId)!.ready?'Voltar à preparação':'Estou pronto'}</button>{room.isHost&&<button disabled={busy||room.seats.length<2||room.seats.some(s=>!s.ready)} onClick={()=>void lobby({type:'START'})}>Iniciar partida</button>}<small>O anfitrião inicia após todos confirmarem.</small><LeaveGame joinCode={room.joinCode} onLeave={leave}/></footer>
      </section>}
  </main>;
}

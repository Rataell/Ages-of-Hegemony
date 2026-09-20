'use client';
import { useEffect, useState } from 'react';
import { CIVILIZATIONS } from '@aoh/game-domain';
import type { AlphaRoomView } from '@aoh/server/alpha';
import AlphaBoard from './alpha-board';
import { ruleMessage } from '../play/presentation';

type Reply={ok:true;value:AlphaRoomView}|{ok:false;error:{code:string;message:string}};
export default function AlphaShell(){
  const [room,setRoom]=useState<AlphaRoomView|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [name,setName]=useState(''),[title,setTitle]=useState('Mesa dos Horizontes'),[code,setCode]=useState(''),[preset,setPreset]=useState('QUICK'),[count,setCount]=useState(2),[timer,setTimer]=useState(0),[seed,setSeed]=useState(42);
  const [theme,setTheme]=useState<string|null>(null);
  useEffect(()=>{
    const preference=localStorage.getItem('aoh-alpha-theme')??'SYSTEM';setTheme(preference);
    const params=new URLSearchParams(location.search);setCode(params.get('join')??'');
    const id=params.get('game')??localStorage.getItem('aoh-alpha-room');
    if(id)void fetch(`/api/alpha?gameId=${encodeURIComponent(id)}`,{cache:'no-store'}).then(r=>r.json()).then((reply:Reply)=>{if(reply.ok)setRoom(reply.value);else setError(reply.error.message);}).catch(()=>setError('Não foi possível reconectar. Verifique sua conexão.'));
  },[]);
  useEffect(()=>{
    if(theme===null)return;
    localStorage.setItem('aoh-alpha-theme',theme);const media=matchMedia('(prefers-color-scheme: light)');
    const apply=()=>{document.documentElement.dataset.alphaTheme=theme==='SYSTEM'?(media.matches?'LIGHT':'DARK'):theme;};
    apply();media.addEventListener('change',apply);return()=>media.removeEventListener('change',apply);
  },[theme]);
  useEffect(()=>{
    if(!room)return;const id=room.id;let active=true;
    const interval=setInterval(()=>{if(document.visibilityState==='hidden')return;void fetch(`/api/alpha?gameId=${encodeURIComponent(id)}`,{cache:'no-store'}).then(r=>r.json()).then((reply:Reply)=>{
      if(active&&reply.ok)setRoom(old=>!old||old.id!==id||reply.value.version>=old.version?reply.value:old);
    }).catch(()=>{if(active)setError('Conexão interrompida. Tentando reconectar…');});},2500);
    return()=>{active=false;clearInterval(interval);};
  },[room?.id]);
  async function request(payload:Record<string,unknown>){
    if(busy)return false;setBusy(true);setError('');
    try{
      const response=await fetch('/api/alpha',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),reply=await response.json() as Reply;
      if(!reply.ok){
        const raw=`${reply.error.code}: ${reply.error.message}`,translated=ruleMessage(raw);setError(translated===raw?reply.error.message:translated);
        if(reply.error.code==='VERSION_CONFLICT'&&room){const refresh=await fetch(`/api/alpha?gameId=${room.id}`,{cache:'no-store'});const latest=await refresh.json() as Reply;if(latest.ok)setRoom(old=>!old||latest.value.version>=old.version?latest.value:old);}
        return false;
      }
      setRoom(old=>!old||old.id!==reply.value.id||reply.value.version>=old.version?reply.value:old);
      localStorage.setItem('aoh-alpha-room',reply.value.id);history.replaceState(null,'',`/alpha?game=${reply.value.id}`);
      return true;
    }catch{setError('Não foi possível confirmar a ação. Aguarde a reconexão antes de tentar novamente.');return false;}finally{setBusy(false);}
  }
  const lobby=(payload:Record<string,unknown>)=>request({operation:'lobby',gameId:room!.id,payload:{...payload,expectedVersion:room!.version}});
  return <main className="alpha-shell">
    <header className="alpha-masthead"><a href="/alpha" className="alpha-wordmark"><span aria-hidden="true">AH</span> AGES OF HEGEMONY</a><small>TEST BUILD · Alpha v0.1 em desenvolvimento</small><label>Tema <select value={theme??'SYSTEM'} onChange={e=>setTheme(e.target.value)}><option value="SYSTEM">Sistema</option><option value="DARK">Escuro</option><option value="LIGHT">Claro</option></select></label></header>
    {error&&<div role="alert" className="alpha-error">{error}<button onClick={()=>setError('')} aria-label="Fechar mensagem">×</button></div>}
    {!room?<section className="alpha-entry"><div className="alpha-intro"><p className="eyebrow">UMA CIVILIZAÇÃO COMEÇA COM UMA MESA</p><h1>Horizontes por<br/>construir.</h1><p>Escolha uma civilização. Compartilhe um convite. Transforme decisões em história.</p><p>Teste online para 2 a 6 pessoas. Sem inteligência artificial. Esta versão ainda está em integração.</p><a href="/">Abrir experiência local existente</a></div>
      <div className="alpha-entry-forms"><label>Seu nome<input value={name} onChange={e=>setName(e.target.value)} maxLength={80} autoComplete="nickname" /></label>
        <form onSubmit={e=>{e.preventDefault();void request({operation:'create',payload:{name:title,displayName:name,preset,seatLimit:count,seed,planningSeconds:timer}});}}><h2>Preparar uma mesa</h2><label>Nome da partida<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={80}/></label><div className="alpha-form-row"><label>Lugares<select value={count} onChange={e=>setCount(Number(e.target.value))}>{[2,3,4,5,6].map(n=><option key={n}>{n}</option>)}</select></label><label>Duração<select value={preset} onChange={e=>setPreset(e.target.value)}><option value="QUICK">Rápida · 9 rodadas</option><option value="STANDARD">Padrão · 15 rodadas</option><option value="EPIC">Épica · 20 rodadas</option></select></label></div><div className="alpha-form-row"><label>Semente<input type="number" min={0} max={4294967295} value={seed} onChange={e=>setSeed(Number(e.target.value))}/></label><label>Prazo por fase<select value={timer} onChange={e=>setTimer(Number(e.target.value))}>{[[0,'Sem prazo'],[300,'5 minutos'],[900,'15 minutos'],[3600,'1 hora'],[43200,'12 horas'],[86400,'24 horas']].map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></label></div><button className="primary" disabled={busy||!name.trim()||!title.trim()}>Criar partida</button></form>
        <form onSubmit={e=>{e.preventDefault();void request({operation:'join',code:code.trim(),displayName:name});}}><h2>Recebeu um convite?</h2><label>Código de convite<input value={code} onChange={e=>setCode(e.target.value)} autoComplete="off" spellCheck={false}/></label><button disabled={busy||!name.trim()||!code.trim()}>Entrar na partida</button></form></div></section>
      :room.game?<AlphaBoard room={room} busy={busy} send={payload=>request({operation:'command',gameId:room.id,payload:{...payload,expectedVersion:room.game!.version}})}/>
      :<section className="alpha-lobby"><div className="alpha-lobby-heading"><div><p className="eyebrow">PREPARAÇÃO DA MESA</p><h1>{room.name}</h1><p>{room.seats.length} / {room.seatLimit} pessoas · Semente {room.seed}</p></div><div><p>Convide outra pessoa</p><code>{room.joinCode}</code><button onClick={()=>void navigator.clipboard.writeText(`${location.origin}/alpha?join=${room.joinCode}`).catch(()=>setError('Não foi possível copiar. Selecione o código de convite.'))}>Copiar convite</button></div></div>
        <div className="alpha-seats">{room.seats.map(seat=><article className="alpha-card" key={seat.playerId}><small>{seat.isHost?'ANFITRIÃO':'CONVIDADO'}{seat.playerId===room.selfPlayerId?' · VOCÊ':''}</small><h2>{seat.name}</h2><p>{CIVILIZATIONS.find(c=>c.id===seat.civilization)?.name??'Escolhendo civilização'}</p><strong>{seat.ready?'Pronto':'Preparando'}</strong></article>)}</div>
        <h2>Seu tabuleiro de civilização</h2><div className="alpha-civilizations">{CIVILIZATIONS.map(c=>{const chosen=room.seats.find(s=>s.civilization===c.id),self=room.seats.find(s=>s.playerId===room.selfPlayerId)!;return <button key={c.id} className={`alpha-card ${self.civilization===c.id?'is-selected':''}`} aria-pressed={self.civilization===c.id} disabled={busy||self.ready||Boolean(chosen&&chosen.playerId!==room.selfPlayerId)} onClick={()=>void lobby({type:'CHOOSE_CIVILIZATION',civilization:c.id})}><small aria-hidden="true">{c.name.slice(0,2).toUpperCase()}</small><h3>{c.name}</h3><p>{c.identity}</p><span>{chosen?`Escolhida por ${chosen.name}`:'Disponível'}</span></button>;})}</div>
        <footer className="alpha-lobby-controls"><button className="primary" disabled={busy||!room.seats.find(s=>s.playerId===room.selfPlayerId)?.civilization} onClick={()=>void lobby({type:'LOBBY_READY',ready:!room.seats.find(s=>s.playerId===room.selfPlayerId)!.ready})}>{room.seats.find(s=>s.playerId===room.selfPlayerId)!.ready?'Voltar à preparação':'Estou pronto'}</button>{room.isHost&&<button disabled={busy||room.seats.length<2||room.seats.some(s=>!s.ready)} onClick={()=>void lobby({type:'START'})}>Iniciar partida</button>}<small>O anfitrião inicia após todos confirmarem.</small></footer>
      </section>}
  </main>;
}

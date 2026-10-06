'use client';
import { useEffect, useState } from 'react';
import type { AlphaRoomView } from '@aoh/server/alpha';
import { ALPHA_ERA_NUMERALS, AlphaEraSchema } from '@aoh/game-domain';
import { alphaLabel as text } from './alpha-copy';

/** Social reactions: no mechanical effect. Codes are fixed on the server; the glyph/label are presentation only. */
export const REACTIONS = [
  ['APPLAUSE', '👏', 'Boa jogada'], ['SURPRISE', '😮', 'Surpresa'], ['THINKING', '🤔', 'Pensando'],
  ['ATTENTION', '⚠', 'Atenção'], ['CHEER', '😄', 'Gostei'], ['WATCHING', '👀', 'Estou vendo'],
] as const;
export const reactionOf = (code: string) => REACTIONS.find(([key]) => key === code) ?? REACTIONS[0];
export type TableEvent = { key: number; type: 'REACTION' | 'PING'; playerId: string; reaction: string; hexId?: string; at: number };
export type RoomSend = (payload: Record<string, unknown>) => Promise<boolean>;

/** The small cloud born on the viewer's own plate. */
export function ReactionCloud({ anchor, onPick, onClose }: { anchor: HTMLElement; onPick: (code: string) => void; onClose: () => void }) {
  const box = anchor.getBoundingClientRect();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return <div className="alpha-reaction-scrim" onClick={onClose}><div className="alpha-reaction-cloud aoh-glass" role="menu" aria-label="Reagir" style={{ left: Math.max(8, Math.min(box.left + box.width / 2 - 130, window.innerWidth - 268)), ...(box.top < window.innerHeight / 2 ? { top: box.bottom + 8 } : { bottom: Math.max(8, window.innerHeight - box.top + 8) }) }} onClick={e => e.stopPropagation()}>
    {REACTIONS.map(([code, glyph, label]) => <button key={code} type="button" role="menuitem" title={label} aria-label={label} onClick={() => { onPick(code); onClose(); }}><span aria-hidden="true">{glyph}</span><small>{label}</small></button>)}
  </div></div>;
}

/** Banners that must be seen at once: suspension, vote, EM GUARDA, closed table, connection. Everything else lives in the Livro → Mesa page. */
export function RoomBanners({ room, send, connection }: { room: AlphaRoomView; send: RoomSend; connection: 'online' | 'reconnecting' }) {
  const game = room.game, vote = room.vote;
  const era = game ? ALPHA_ERA_NUMERALS[AlphaEraSchema.options.indexOf(game.self.era)] ?? '' : '';
  const nameOf = (id: string | null) => room.seats.find(s => s.playerId === id)?.name ?? 'alguém';
  return <>
    {connection === 'reconnecting' && <div className="alpha-conn-badge" role="status">Reconectando…</div>}
    {room.selfOnGuard && room.lifecycle !== 'CLOSED' && <div className="alpha-room-banner is-guard" role="alert"><b>Sua civilização está EM GUARDA.</b> Ela mantém cidades, território e peças, mas não recebe Ordens enquanto você não reassumir. <button type="button" className="primary" onClick={() => void send({ type: 'RESUME_SEAT' })}>Reassumir</button></div>}
    {vote && room.lifecycle === 'ACTIVE' && <div className="alpha-room-banner is-vote" role="alert">
      <b>{vote.kind === 'END' ? 'Encerrar a partida?' : `Colocar ${nameOf(vote.target)} EM GUARDA?`}</b> Proposto por {nameOf(vote.proposer)} · {vote.yes} sim · {vote.no} não · precisa de {vote.needed}.
      {vote.canVote && <><button type="button" className="primary" onClick={() => void send({ type: 'VOTE', yes: true })}>Sim</button><button type="button" onClick={() => void send({ type: 'VOTE', yes: false })}>Não</button></>}
      {vote.mine && <small> Seu voto: {vote.mine === 'YES' ? 'sim' : 'não'}.</small>}
    </div>}
    {room.lifecycle === 'SUSPENDED' && <div className="alpha-suspended" role="dialog" aria-label="Partida suspensa"><div className="aoh-glass">
      <p className="eyebrow">PARTIDA SUSPENSA</p><h2>Última rodada: {game?.view.round ?? '—'}</h2><p>Era {era} · {game ? text(game.self.era) : ''}</p>
      {room.isHost ? <button type="button" className="primary" onClick={() => void send({ type: 'RESUME' })}>Retomar</button> : <p className="alpha-hint">Aguardando o anfitrião retomar. Você pode fechar esta aba e voltar com o mesmo link.</p>}
    </div></div>}
    {room.lifecycle === 'CLOSED' && <div className="alpha-room-banner is-closed" role="status"><b>Partida encerrada.</b> A mesa e a crônica continuam disponíveis para leitura; ninguém dá mais Ordens.</div>}
  </>;
}

/** Short toasts for room events (joined, host moved, vote…). Newest notice only, 6 s. */
export function NoticeToast({ notices }: { notices: AlphaRoomView['notices'] }) {
  const [shown, setShown] = useState<{ id: number; text: string } | null>(null);
  const [seen, setSeen] = useState<number | null>(null);
  const last = notices.at(-1);
  useEffect(() => {
    if (!last) return;
    if (seen === null) { setSeen(last.id); return; }
    if (last.id > seen) { setSeen(last.id); setShown({ id: last.id, text: last.text }); const t = setTimeout(() => setShown(null), 6000); return () => clearTimeout(t); }
    return undefined;
  }, [last?.id]);
  return shown ? <div className="alpha-toast" role="status">{shown.text}</div> : null;
}

const PRESENCE: Record<string, string> = { ONLINE: 'Online', RECONNECTING: 'Reconectando…', ABSENT: 'Ausente' };
/** Livro → Mesa: who is here, host, suspend, EM GUARDA proposals, ending the match. Every destructive step is a vote of the active players. */
export function RoomPanel({ room, send }: { room: AlphaRoomView; send: RoomSend }) {
  const [confirm, setConfirm] = useState<null | 'end' | string>(null);
  const active = room.lifecycle === 'ACTIVE';
  return <section className="alpha-room-panel" aria-label="Mesa e jogadores">
    <ul className="alpha-room-seats">{room.seats.map(s => <li key={s.playerId} className={s.playerId === room.selfPlayerId ? 'is-self' : ''}>
      <i className={`presence-dot is-${s.presence.toLowerCase()}`} aria-hidden="true" /><b>{s.name}</b>{s.isHost && <small className="aoh-chip">anfitrião</small>}{s.onGuard && <small className="aoh-chip">EM GUARDA</small>}
      <small>{s.presence === 'ONLINE' ? PRESENCE.ONLINE : PRESENCE[s.presence]}</small>
      {active && s.playerId !== room.selfPlayerId && !s.onGuard && !room.vote && <button type="button" className="aoh-btn is-sm is-ghost" onClick={() => setConfirm(s.playerId)}>Propor EM GUARDA…</button>}
    </li>)}</ul>
    {confirm && confirm !== 'end' && <div className="alpha-confirm" role="alert"><p>Colocar <b>{room.seats.find(s => s.playerId === confirm)?.name}</b> EM GUARDA? A civilização é mantida (cidades, território, peças) mas passa a confirmar sem Ordens até a pessoa reassumir. Os jogadores ativos votam; ninguém é removido sozinho.</p>
      <button type="button" className="primary" onClick={() => { void send({ type: 'PROPOSE_REMOVE', target: confirm }); setConfirm(null); }}>Abrir votação</button><button type="button" onClick={() => setConfirm(null)}>Cancelar</button></div>}
    <div className="alpha-room-actions">
      {room.isHost && active && <button type="button" disabled={!room.canSuspend} title={room.suspendBlock ?? 'Guarda a mesa para continuar depois'} onClick={() => void send({ type: 'SUSPEND' })}>Suspender partida</button>}
      {room.isHost && active && room.suspendBlock && <small className="alpha-hint">{room.suspendBlock}</small>}
      {active && !room.vote && <button type="button" onClick={() => setConfirm('end')}>Solicitar encerramento…</button>}
    </div>
    {confirm === 'end' && <div className="alpha-confirm" role="alert"><p>Encerrar a partida? Os jogadores ativos votam (maioria simples). Se aprovado, a mesa fica só para leitura. Para continuar outro dia, use <b>Suspender</b>.</p>
      <button type="button" className="primary" onClick={() => { void send({ type: 'PROPOSE_END' }); setConfirm(null); }}>Abrir votação</button><button type="button" onClick={() => setConfirm(null)}>Cancelar</button></div>}
    {room.vote && room.vote.proposer === room.selfPlayerId && <button type="button" onClick={() => void send({ type: 'CANCEL_VOTE' })}>Cancelar minha votação</button>}
    <p className="alpha-hint">O anfitrião é um papel administrativo: ao sair, passa automaticamente ao jogador ativo de menor lugar. Sair da partida nunca apaga a civilização.</p>
  </section>;
}

'use client';
import { useState, type CSSProperties } from 'react';
import { CORE10, civilizationDisplayName, civilizationKit, core10OfChassis, figureById, type MapSize } from '@aoh/game-domain';
import type { AlphaRoomView } from '@aoh/server/alpha';
import { CivilizationCard, FigureCard } from './alpha-card';
import { sealArt, seatColor } from './table-art';
import { LeaveGame } from './alpha-leave';
import { MAP_SIZES, WORLD_OPTIONS, mapSizeChoice, planningName, presetName } from './alpha-options';

/**
 * The lobby (RC 1.2): one fixed-viewport table — seats strip on top, Core 10 civilizations, the three Figuras of the chosen one and the
 * host's table settings side by side; on a phone the three areas become tabs. The page itself never scrolls.
 */
type Seat = AlphaRoomView['seats'][number];
type LobbySend = (payload: Record<string, unknown>) => Promise<boolean>;
type Tab = 'civ' | 'figure' | 'table';
const AFFINITY: Record<string, string> = { POLITICAL: 'Política', TERRITORIAL: 'Territorial', ECONOMIC: 'Econômica', MARITIME: 'Marítima', SCIENTIFIC: 'Científica', CULTURAL: 'Cultural', MILITARY: 'Militar', AGRARIAN: 'Agrária' };
const NEUTRAL = '#9fb0ad';

/** Civilization seal from the shared table art; a drawing that has not landed yet simply renders as an empty seal. */
export function CivSeal({ chassis, color, size = 34 }: { chassis: string | null; color: string; size?: number }) {
  const kit = civilizationKit(chassis);
  let html = '';
  try { html = kit ? sealArt(kit.mark, color, 15) : ''; } catch { html = ''; }
  if (!html) return <svg className="alpha-seal is-empty" width={size} height={size} viewBox="-20 -20 40 40" aria-hidden="true"><circle r="15" fill="none" stroke={color} strokeWidth="2" strokeDasharray="3 3" /></svg>;
  return <svg className="alpha-seal" width={size} height={size} viewBox="-20 -20 40 40" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}

function figureLine(seat: Seat) {
  if (!seat.civilization) return 'Escolhendo civilização';
  const figure = seat.figureId ? figureById(seat.figureId) : null;
  return `${civilizationDisplayName(seat.civilization)} · ${figure ? figure.name : seat.figureChosen ? 'Figura escolhida' : 'sem Figura'}`;
}

function SeatCard({ room, seat, index, busy, lobby }: { room: AlphaRoomView; seat: Seat; index: number; busy: boolean; lobby: LobbySend }) {
  const self = seat.playerId === room.selfPlayerId, color = seatColor(index);
  const role = seat.bot ? 'BOT' : seat.isHost ? 'Anfitrião' : 'Convidado';
  const presence = seat.bot ? null : seat.presence === 'ONLINE' ? 'Online' : seat.presence === 'RECONNECTING' ? 'Reconectando…' : 'Ausente';
  return <article className={`alpha-seat${self ? ' is-self' : ''}${seat.ready ? ' is-ready' : ''}`} style={{ '--seat': color } as CSSProperties}>
    <CivSeal chassis={seat.civilization} color={color} size={38} />
    <div className="alpha-seat-text">
      <h3>{seat.name}{self && <small className="alpha-seat-you"> · você</small>}</h3>
      <p>{figureLine(seat)}</p>
      <small className="alpha-seat-meta">{presence ? <i className={`presence-dot is-${seat.presence.toLowerCase()}`} title={presence} aria-label={presence} /> : <i className="presence-dot is-bot" aria-hidden="true" />}{role} · <b className="alpha-seat-state">{seat.ready ? 'Pronto' : 'Preparando'}</b></small>
    </div>
    {room.isHost && seat.bot && <button type="button" className="alpha-seat-remove" disabled={busy} aria-label="Remover bot" title="Remover bot" onClick={() => void lobby({ type: 'REMOVE_BOT', playerId: seat.playerId })}>×</button>}
    {room.isHost && !seat.bot && !self && <button type="button" className="alpha-seat-remove" disabled={busy} aria-label="Remover da sala" title="Remover da sala" onClick={() => { if (confirm(`Remover ${seat.name} da sala?`)) void lobby({ type: 'KICK', playerId: seat.playerId }); }}>×</button>}
  </article>;
}

function SeatStrip({ room, busy, lobby }: { room: AlphaRoomView; busy: boolean; lobby: LobbySend }) {
  const empty = Math.max(0, room.seatLimit - room.seats.length);
  return <div className="alpha-seats" role="group" aria-label="Lugares da mesa" style={{ '--seat-count': room.seatLimit } as CSSProperties}>
    {room.seats.map((seat, i) => <SeatCard key={seat.playerId} room={room} seat={seat} index={i} busy={busy} lobby={lobby} />)}
    {Array.from({ length: empty }, (_, i) => <div key={`free-${i}`} className="alpha-seat-free" style={{ '--seat': seatColor(room.seats.length + i) } as CSSProperties}>
      {i === 0 && room.isHost
        ? <><button type="button" className="aoh-btn is-sm" disabled={busy} title="Ocupa um lugar vazio com um jogador artificial (experimental). Pelo menos uma pessoa precisa jogar." onClick={() => void lobby({ type: 'ADD_BOT' })}>Adicionar bot</button><small>ou envie o convite</small></>
        : <small>Lugar livre</small>}
    </div>)}
  </div>;
}

function CivilizationList({ room, mine, locked, onPreview, onChoose }: { room: AlphaRoomView; mine: Seat; locked: boolean; onPreview: (chassis: string | null) => void; onChoose: (chassis: string) => void }) {
  const myIndex = room.seats.indexOf(mine);
  return <div className="alpha-civilizations" role="group" aria-label="Civilizações" onMouseLeave={() => onPreview(null)}>
    {CORE10.map(core => {
      const ownerIndex = room.seats.findIndex(s => s.civilization === core.chassis && s.playerId !== mine.playerId), owner = ownerIndex >= 0 ? room.seats[ownerIndex]! : null;
      const chosen = mine.civilization === core.chassis, kit = civilizationKit(core.chassis);
      const color = chosen ? seatColor(myIndex) : owner ? seatColor(ownerIndex) : NEUTRAL;
      return <button key={core.chassis} type="button" className={`alpha-civ-pick${chosen ? ' is-selected' : ''}${owner ? ' is-taken' : ''}`} aria-pressed={chosen}
        disabled={locked || Boolean(owner)} onMouseEnter={() => onPreview(core.chassis)} onFocus={() => onPreview(core.chassis)} onClick={() => onChoose(core.chassis)}>
        <CivSeal chassis={core.chassis} color={color} size={30} />
        <h3>{core.name}</h3>
        <small>{owner ? `Escolhida por ${owner.name}` : chosen ? 'Sua escolha' : kit ? AFFINITY[kit.affinity] : core.adjective}</small>
      </button>;
    })}
  </div>;
}

function FigurePicker({ room, mine, shown, locked, onFigure }: { room: AlphaRoomView; mine: Seat; shown: string; locked: boolean; onFigure: (figureId: string) => void }) {
  const core = core10OfChassis(shown), myIndex = room.seats.indexOf(mine);
  const taken = room.seats.some(s => s.civilization === shown && s.playerId !== mine.playerId), isMine = mine.civilization === shown;
  if (!core) return null;
  return <section className="alpha-lobby-detail" aria-label={`Detalhes: ${core.name}`} aria-live="polite">
    <div className="alpha-lobby-civcard"><CivilizationCard chassis={shown} compact selected={isMine} color={isMine ? seatColor(myIndex) : '#d8b46a'} /></div>
    <div className="alpha-figures-head">
      <h2>Figura</h2>
      <p>{taken ? 'Outra pessoa já conduz esta civilização.' : isMine ? (mine.ready ? 'Escolha confirmada. Desmarque “Estou pronto” para trocar.' : 'Escolha quem conduz sua civilização. Fica em segredo até todos confirmarem.') : `Toque em uma Figura para jogar com ${core.name}.`}</p>
    </div>
    <div className="alpha-figures" role="group" aria-label="Figuras">
      {core.figures.map(figure => <FigureCard key={figure.id} figureId={figure.id} compact selected={isMine && mine.figureId === figure.id} disabled={locked || taken} onClick={() => onFigure(figure.id)}>
        {figure.recommended && <small className="alpha-figure-star">★ recomendada para iniciantes</small>}
      </FigureCard>)}
    </div>
  </section>;
}

function Segments<T extends string | number>({ label, value, options, disabled, onPick }: { label: string; value: T; options: readonly { value: T; title: string; detail?: string; tip?: string; tag?: string | null; reason?: string | null }[]; disabled: boolean; onPick: (value: T) => void }) {
  return <div className="alpha-segment-field">
    <span className="alpha-segment-label" id={`seg-${label}`}>{label}</span>
    <div className="alpha-segments" role="radiogroup" aria-labelledby={`seg-${label}`}>
      {options.map(option => <button key={String(option.value)} type="button" role="radio" aria-checked={option.value === value} className={option.value === value ? 'is-on' : ''}
        disabled={disabled || Boolean(option.reason)} title={option.reason ?? option.tip ?? option.detail ?? undefined} onClick={() => { if (option.value !== value) onPick(option.value); }}>
        <b>{option.title}</b>{option.detail && <small>{option.detail}</small>}{option.tag && <em>{option.tag}</em>}
      </button>)}
    </div>
  </div>;
}

function TablePanel({ room, busy, lobby }: { room: AlphaRoomView; busy: boolean; lobby: LobbySend }) {
  const host = room.isHost, locked = !host || busy;
  const seats = [2, 3, 4, 5, 6].filter(n => n <= room.maxSeats);
  const sizes = MAP_SIZES.map(size => mapSizeChoice(size, room.seatLimit));
  const current = sizes.find(s => s.size === room.mapSize), blocked = sizes.find(s => !s.allowed);
  const world = WORLD_OPTIONS.find(([value]) => value === room.worldPreset);
  return <section className="alpha-lobby-table" aria-labelledby="alpha-table-title">
    <h2 id="alpha-table-title">Mesa</h2>
    <Segments label="Lugares" value={room.seatLimit} disabled={locked} onPick={n => void lobby({ type: 'SET_SEATS', seatLimit: n })}
      options={seats.map(n => ({ value: n, title: String(n), reason: n < room.seats.length ? 'Já há mais pessoas sentadas' : null }))} />
    <Segments<MapSize> label="Tamanho do mapa" value={room.mapSize as MapSize} disabled={locked} onPick={size => void lobby({ type: 'SET_WORLD', mapSize: size })}
      options={sizes.map(s => ({ value: s.size, title: s.name, detail: `${s.regions} Regiões`, tag: s.recommended ? 'recomendado' : null, reason: s.reason }))} />
    <p className="alpha-segment-note">{blocked ? `${blocked.name}: só de ${blocked.reason!.replace('Comporta ', '')}.` : current?.recommended ? 'Tamanho recomendado para esta mesa.' : `Recomendado: ${sizes.find(s => s.recommended)?.name}.`}</p>
    <Segments label="Mundo" value={room.worldPreset} disabled={locked} onPick={preset => void lobby({ type: 'SET_WORLD', worldPreset: preset })}
      options={WORLD_OPTIONS.map(([value, title, tip]) => ({ value, title, tip }))} />
    <p className="alpha-segment-note">{world?.[2]}</p>
    <dl className="alpha-lobby-rules">
      <div><dt>Duração</dt><dd>{presetName(room.preset)}</dd></div>
      <div><dt>Ordens por rodada</dt><dd>{room.actionsPerRound}</dd></div>
      <div><dt>Prazo por fase</dt><dd>{planningName(room.planningSeconds)}</dd></div>
      <div><dt>Semente</dt><dd>{room.seed}</dd></div>
      {room.revealMap && <div><dt>Mapa</dt><dd>revelado (teste)</dd></div>}
    </dl>
    {!host && <small className="alpha-segment-note">Só o anfitrião altera a mesa.</small>}
  </section>;
}

export function AlphaLobby({ room, busy, lobby, copy, copied, onLeave }: { room: AlphaRoomView; busy: boolean; lobby: LobbySend; copy: (kind: 'code' | 'link', value: string) => void; copied: 'code' | 'link' | null; onLeave: () => void }) {
  const mine = room.seats.find(s => s.playerId === room.selfPlayerId)!;
  const [tab, setTab] = useState<Tab>(mine.civilization ? 'figure' : 'civ'), [preview, setPreview] = useState<string | null>(null);
  const locked = busy || mine.ready;
  const shown = preview ?? mine.civilization ?? CORE10[0]!.chassis;
  const chooseCivilization = async (chassis: string) => { setPreview(null); if (mine.civilization !== chassis && await lobby({ type: 'CHOOSE_CIVILIZATION', civilization: chassis })) setTab('figure'); };
  const chooseFigure = async (figureId: string) => {
    if (mine.civilization !== shown && !await lobby({ type: 'CHOOSE_CIVILIZATION', civilization: shown })) return;
    setPreview(null);
    if (mine.figureId !== figureId || mine.civilization !== shown) await lobby({ type: 'CHOOSE_FIGURE', figureId });
  };
  const waiting = room.seats.filter(s => !s.ready).length, startable = room.seats.length >= 2 && waiting === 0;
  const hint = !mine.civilization ? 'Escolha uma civilização e a Figura que vai conduzi-la.'
    : !mine.ready ? 'Confira sua Figura e confirme com “Estou pronto”.'
    : room.isHost ? (startable ? 'Todos prontos: você pode iniciar a partida.' : room.seats.length < 2 ? 'Convide alguém ou adicione um bot para começar.' : `Aguardando ${waiting} ${waiting === 1 ? 'lugar confirmar' : 'lugares confirmarem'}.`)
    : 'Pronto. O anfitrião inicia quando todos confirmarem.';
  return <section className="alpha-lobby" data-tab={tab}>
    <header className="alpha-lobby-heading">
      <div className="alpha-lobby-title">
        <p className="aoh-eyebrow">PREPARAÇÃO DA MESA</p>
        <h1>{room.name}</h1>
        <small>{room.seats.length}/{room.seatLimit} pessoas · {presetName(room.preset)} · {room.actionsPerRound} ordens por rodada · {planningName(room.planningSeconds)}</small>
      </div>
      <div className="alpha-invite" role="group" aria-label="Convite">
        <span className="alpha-invite-label">Convite</span>
        <code title={room.joinCode}>{room.joinCode}</code>
        <button type="button" className="aoh-btn is-sm" onClick={() => copy('code', room.joinCode)}>Copiar código</button>
        <button type="button" className="aoh-btn is-sm is-primary" onClick={() => copy('link', `${location.origin}/alpha/join/${room.joinCode}`)}>Copiar link</button>
        <span role="status" className="alpha-copied">{copied === 'code' ? 'Código copiado' : copied === 'link' ? 'Link copiado' : ''}</span>
      </div>
    </header>
    <SeatStrip room={room} busy={busy} lobby={lobby} />
    <nav className="alpha-lobby-tabs" role="tablist" aria-label="Preparação">
      {([['civ', 'Civilização'], ['figure', 'Figura'], ['table', 'Mesa']] as const).map(([id, text]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{text}</button>)}
    </nav>
    <div className="alpha-lobby-body">
      <section className="alpha-lobby-civs" aria-labelledby="alpha-civs-title">
        <h2 id="alpha-civs-title">Seu tabuleiro de civilização</h2>
        <CivilizationList room={room} mine={mine} locked={locked} onPreview={setPreview} onChoose={chassis => void chooseCivilization(chassis)} />
      </section>
      <FigurePicker room={room} mine={mine} shown={shown} locked={locked} onFigure={id => void chooseFigure(id)} />
      <TablePanel room={room} busy={busy} lobby={lobby} />
    </div>
    <footer className="alpha-lobby-controls">
      <p className="alpha-lobby-hint" role="status">{hint}</p>
      <LeaveGame joinCode={room.joinCode} onLeave={onLeave} />
      {room.isHost && <button type="button" className="alpha-leave" disabled={busy} onClick={() => { if (confirm('Encerrar esta sala? Ninguém mais poderá entrar.')) void lobby({ type: 'CLOSE_ROOM' }); }}>Encerrar sala</button>}
      <button type="button" className={mine.ready ? 'alpha-ready is-ready' : 'primary alpha-ready'} disabled={busy || !mine.civilization} onClick={() => void lobby({ type: 'LOBBY_READY', ready: !mine.ready })}>{mine.ready ? 'Voltar à preparação' : 'Estou pronto'}</button>
      {room.isHost && <button type="button" className="primary alpha-start" disabled={busy || !startable} onClick={() => void lobby({ type: 'START' })}>Iniciar partida</button>}
    </footer>
  </section>;
}

/** A V1.1 room: shown read-only, with the way forward. */
export function LegacyRoom({ room, onNew }: { room: AlphaRoomView; onNew: () => void }) {
  return <section className="alpha-lobby alpha-lobby-legacy">
    <div className="alpha-entry-card alpha-legacy-card aoh-glass" role="alert">
      <p className="aoh-eyebrow">SOMENTE LEITURA</p>
      <h1>{room.name}</h1>
      <p>{room.legacyMessage ?? 'Esta partida foi criada em uma versão anterior do Alpha e agora é somente leitura.'}</p>
      <ul className="alpha-legacy-seats">{room.seats.map((seat, i) => <li key={seat.playerId} style={{ '--seat': seatColor(i) } as CSSProperties}><b>{seat.name}</b> <small>{seat.civilization ? (core10OfChassis(seat.civilization) ? civilizationDisplayName(seat.civilization) : 'Civilização da versão 1.1') : 'sem civilização'}</small></li>)}</ul>
      <button type="button" className="primary" onClick={onNew}>Criar nova sala</button>
    </div>
  </section>;
}

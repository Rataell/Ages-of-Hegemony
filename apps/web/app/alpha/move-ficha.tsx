'use client';
import { useEffect, type RefObject } from 'react';
import { Icon } from './table-icons';
import { layoutCloud, DEFAULT_SAFE, type Safe } from './cloud-layout';
import { useLitBoxes } from './cloud-boxes';
import { useHexAnchor, useHostSize } from './table-cloud';
import { pieceArt } from './table-art';
import { LEG_COLORS } from './move-draft';

/**
 * Mover coordenado: the Ficha de Ação of one Move Order (Cena B of the Mesa Viva). It is born on the pieces, while the MAP stays the interface:
 * chips choose the pieces, a lit destination on the map makes a leg, and ONE button confirms the whole Order. The numbers come from the server's preview.
 */
export interface FichaChip { id: string; kind: string; label: string; sub: string; /** Index of the leg that already carries this piece, or null. */ leg: number | null; picked: boolean }
export interface FichaLeg { index: number; pieces: string; dest: string; /** "custo 3/4 · resta 1", or null while the preview has not answered. */ numbers: string | null; blockers: string[]; risk: string | null; turn: { count: number; index: number } | null }
const svgFragment = (html: string) => ({ __html: html });

export function MoveFicha({ host, hexId, safe = DEFAULT_SAFE, color, chips, legs, counter, note, block, onToggle, onRemove, onTurn, onConfirm, onCancel }: {
  host: RefObject<HTMLElement | null>; hexId: string; safe?: Safe; color: string; chips: FichaChip[]; legs: FichaLeg[];
  counter: { used: number; max: number | null; over: boolean }; note: string | null; block: string | null;
  onToggle: (id: string) => void; onRemove: (index: number) => void; onTurn: (index: number, step: 1 | -1) => void; onConfirm: () => void; onCancel: () => void;
}) {
  const anchor = useHexAnchor(hexId, host), size = useHostSize(host), lit = useLitBoxes(host, true, true);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onCancel(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onCancel]);
  if (!anchor || !size) return null;
  const plate = { w: 316, h: 118 + legs.length * 50 + (note ? 30 : 0) + (block ? 30 : 0) + Math.ceil(chips.length / 2) * 4 };
  // The Ficha stands clear of the lit destinations AND of every piece, city and warrior (6 px margin).
  const place = layoutCloud(anchor, size, safe, 0, plate, lit.map(b => ({ ...b, w: b.w + 12, h: b.h + 12 })));
  return <div className="table-cloud is-target" data-phase="in" role="group" aria-label="Ordem de Mover">
    <svg className="ctx-stems" width={size.w} height={size.h} aria-hidden="true"><line x1={anchor.x} y1={anchor.y} x2={place.plate.x} y2={place.plate.y} className="is-plate" /></svg>
    <i className="ctx-halo" style={{ left: anchor.x, top: anchor.y, width: anchor.r * 2 + 8, height: anchor.r * 2 + 8 }} aria-hidden="true" />
    <div className="ctx-ficha" style={{ left: place.plate.x, top: place.plate.y, width: plate.w }} data-legs={legs.length}>
      <div className="ctx-ficha-head">
        <b>Mover · Ordem</b>
        <span className={`ctx-ficha-count${counter.over ? ' is-over' : ''}`} aria-label={counter.max === null ? `Peças ${counter.used}` : `Peças ${counter.used} de ${counter.max}`}>Peças <b>{counter.max === null ? counter.used : `${counter.used}/${counter.max}`}</b></span>
        <button type="button" onClick={onCancel} aria-label="Cancelar"><Icon name="cancel" size={14} /> Esc</button>
      </div>
      <div className="ctx-pieces" role="group" aria-label="Peças da Ordem">
        {chips.map(chip => <button key={chip.id} type="button" className={`ctx-piece${chip.picked ? ' is-picked' : ''}`} aria-pressed={chip.picked} data-unit={chip.id} title={chip.leg === null ? 'Escolher esta peça para o próximo trajeto' : `Já está no trajeto ${chip.leg + 1}: escolha um destino para levá-la a outro`} onClick={() => onToggle(chip.id)}>
          <svg viewBox="-16 -16 32 32" width="26" height="26" aria-hidden="true" dangerouslySetInnerHTML={svgFragment(pieceArt(chip.kind, color, 26))} />
          <span>{chip.label}<small>{chip.sub}</small></span>
          {chip.leg !== null && <i className="ctx-piece-ring" style={{ ['--leg' as string]: LEG_COLORS[chip.leg % LEG_COLORS.length] }} aria-label={`Trajeto ${chip.leg + 1}`}>{chip.leg + 1}</i>}
        </button>)}
      </div>
      {legs.length > 0
        ? <ol className="ctx-legs" aria-label="Trajetos da Ordem">{legs.map(leg => <li key={leg.index} data-leg={leg.index} className={leg.blockers.length ? 'is-blocked' : ''} style={{ ['--leg' as string]: LEG_COLORS[leg.index % LEG_COLORS.length] }}>
          <i className="ctx-leg-no" aria-hidden="true">{leg.index + 1}</i>
          <span className="ctx-leg-body"><b>{leg.pieces}</b><small>{leg.turn ? `→ Região fechada ${leg.dest}` : `→ ${leg.dest}`}{leg.numbers ? ` · ${leg.numbers}` : ' · conferindo…'}</small>
            {leg.risk && <small className="ctx-leg-risk">{leg.risk}</small>}
            {leg.blockers.map(message => <small key={message} className="ctx-leg-block" role="alert">{message}</small>)}</span>
          {leg.turn && <span className="ctx-leg-turn"><button type="button" aria-label="Orientação anterior" onClick={() => onTurn(leg.index, -1)}>‹</button><small role="status">Orientação {leg.turn.index + 1} de {leg.turn.count}</small><button type="button" aria-label="Próxima orientação" onClick={() => onTurn(leg.index, 1)}>›</button></span>}
          <button type="button" className="ctx-leg-x" aria-label={`Remover trajeto ${leg.index + 1}`} onClick={() => onRemove(leg.index)}>✕</button>
        </li>)}</ol>
        : null}
      {note && <p className="ctx-note" role="status">{note}</p>}
      <div className="ctx-ficha-foot"><button type="button" className="ctx-go" disabled={block !== null} onClick={onConfirm}>Confirmar Ordem</button>{block && <small className="ctx-why" role="status">{block}</small>}</div>
    </div>
  </div>;
}

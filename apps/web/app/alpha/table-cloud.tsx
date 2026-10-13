'use client';
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from 'react';
import { Icon, type IconName } from './table-icons';
import { layoutCloud, phoneSafe, type Anchor, type Safe, type Size } from './cloud-layout';
import { useLitBoxes } from './cloud-boxes';
import { useCompactFicha } from './action-ficha';

/**
 * Interaction Model V2: the Table cloud. A piece or hex is touched, and its possibilities appear around IT, anchored to the hex on screen.
 * One surface that MORPHS (city → build → district → confirm) instead of a stack of panels; the camera never moves to make room.
 */
export type NodeTone = 'dominant' | 'alt' | 'quiet' | 'warn';
export interface CloudNode { id: string; label: string; icon: IconName; tone?: NodeTone | undefined; badge?: string | null | undefined; hint?: string | undefined; /** Why it cannot be done now: the node stays visible and says so. */ disabled?: string | null | undefined; active?: boolean | undefined; onSelect: () => void }
export interface CloudLevel { id: string; title: string; subtitle?: string | undefined; nodes: CloudNode[]; note?: string | null | undefined; card?: ReactNode;
  /** The card is a Ficha de Ação: a taller plate (it scrolls inside), kept clear of the pieces on the table, and a sheet on phones. `h` is the height the layout reserves. */
  ficha?: { h: number } | undefined; tabs?: { id: string; label: string; active: boolean; onSelect: () => void }[] | undefined }
export { DEFAULT_SAFE, type Safe } from './cloud-layout';
import { DEFAULT_SAFE } from './cloud-layout';

/** Screen position of a hex relative to the host, followed every frame while the cloud is open (pan, zoom and resize never detach it). */
export function useHexAnchor(hexId: string | null, host: RefObject<HTMLElement | null>): Anchor | null {
  const [point, setPoint] = useState<Anchor | null>(null);
  useEffect(() => {
    if (!hexId) { setPoint(null); return; }
    let frame = 0;
    const read = () => {
      const root = host.current, el = root?.querySelector(`[data-hex="${hexId}"] .hex-base`) as SVGGraphicsElement | null;
      if (el && root) {
        const box = el.getBoundingClientRect(), base = root.getBoundingClientRect();
        const x = box.left + box.width / 2 - base.left, y = box.top + box.height / 2 - base.top, r = Math.max(box.width, box.height) / 2;
        setPoint(old => old && Math.abs(old.x - x) < 0.5 && Math.abs(old.y - y) < 0.5 && Math.abs(old.r - r) < 0.5 ? old : { x, y, r });
      }
      frame = requestAnimationFrame(read);
    };
    read();
    return () => cancelAnimationFrame(frame);
  }, [hexId, host]);
  return point;
}
export function useHostSize(host: RefObject<HTMLElement | null>): Size | null {
  const [size, setSize] = useState<Size | null>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const read = () => { const box = el.getBoundingClientRect(); setSize(old => old && old.w === box.width && old.h === box.height ? old : { w: box.width, h: box.height }); };
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(read); observer.observe(el);
    return () => observer.disconnect();
  }, [host]);
  return size;
}
/** Keeps the previous level on screen for a beat while it folds away, then shows the next one: one surface, not a pile. */
function useMorph<T extends { id: string }>(target: T): { shown: T; phase: 'in' | 'out' } {
  const [shown, setShown] = useState(target), [phase, setPhase] = useState<'in' | 'out'>('in');
  useEffect(() => {
    if (target.id === shown.id) { setShown(target); return; }
    setPhase('out');
    const timer = setTimeout(() => { setShown(target); setPhase('in'); }, 90);
    return () => clearTimeout(timer);
  }, [target]);
  return { shown, phase };
}

/** Dominant node in the middle of the arc, the rest outward, the ••• last at the end. */
function arrange(nodes: CloudNode[]): CloudNode[] {
  const more = nodes.find(n => n.id === 'more'), rest = nodes.filter(n => n.id !== 'more');
  rest.sort((a, b) => Number(b.tone === 'dominant') - Number(a.tone === 'dominant'));
  const slots = rest.length, mid = Math.floor((slots - 1) / 2), order: number[] = [mid];
  for (let k = 1; order.length < slots; k++) { if (mid + k < slots) order.push(mid + k); if (order.length < slots && mid - k >= 0) order.push(mid - k); }
  const placed: CloudNode[] = new Array(slots);
  rest.forEach((node, i) => { placed[order[i]!] = node; });
  return more ? [...placed, more] : placed;
}


export function ContextActionNode({ node, x, y, dx, dy, index }: { node: CloudNode; x: number; y: number; dx: number; dy: number; index: number }) {
  return <button type="button" className={`ctx-node tone-${node.tone ?? 'alt'}${node.disabled ? ' is-disabled' : ''}${node.active ? ' is-active' : ''}`} data-node={node.id}
    style={{ left: x, top: y, ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px`, animationDelay: `${index * 14}ms` }}
    aria-disabled={node.disabled ? true : undefined} title={node.disabled ?? node.hint ?? node.label} onClick={node.onSelect}>
    <Icon name={node.icon} /><span>{node.label}</span>{node.badge ? <b>{node.badge}</b> : null}
  </button>;
}

export function TableContextCloud({ host, hexId, level, canBack, onBack, onClose, safe: safeProp = DEFAULT_SAFE }: { host: RefObject<HTMLElement | null>; hexId: string; level: CloudLevel; canBack: boolean; onBack: () => void; onClose: () => void; safe?: Safe }) {
  const anchor = useHexAnchor(hexId, host), size = useHostSize(host), { shown, phase } = useMorph(level);
  const root = useRef<HTMLDivElement | null>(null), compact = useCompactFicha(), avoid = useLitBoxes(host, !!shown.ficha, true);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); if (canBack) onBack(); else onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [canBack, onBack, onClose]);
  useEffect(() => { if (phase === 'in') root.current?.querySelector<HTMLButtonElement>('button.ctx-node, .ctx-plate button')?.focus({ preventScroll: true }); }, [shown.id, phase]);
  if (!anchor || !size) return null;
  const safe = phoneSafe(safeProp, size.w);
  const nodes = arrange(shown.nodes), room = Math.max(160, size.h - safe.top - safe.bottom);
  const plateSize = shown.ficha ? { w: 324, h: Math.min(shown.ficha.h, room) } : shown.card ? { w: 252, h: 168 } : { w: 184, h: shown.tabs?.length ? 76 : 54 };
  // Every priority illustration keeps a 6 px margin around it: the plate looks for a spot clear of those padded boxes.
  const padded = avoid.map(b => ({ ...b, w: b.w + 12, h: b.h + 12 }));
  const place = layoutCloud(anchor, size, safe, nodes.length, plateSize, padded);
  // On a phone the Ficha is a sheet on the side of the table AWAY from the piece (top when the piece is low, bottom otherwise), so it never covers it.
  const above = anchor.y - anchor.r - 12 - safe.top, below = size.h - safe.bottom - (anchor.y + anchor.r + 12);
  // The sheet also keeps clear of every other piece, city and warrior on its side of the table (not only the one the cloud was born on).
  const sheetTop = above > below, clearOf = avoid.length ? (sheetTop ? Math.min(...avoid.map(b => b.y - b.h / 2 - 6 - safe.top)) : Math.min(...avoid.map(b => size.h - safe.bottom - (b.y + b.h / 2 + 6)))) : Infinity;
  const sheet = shown.ficha && compact ? { top: sheetTop, width: Math.min(420, size.w - 20), room: Math.max(150, Math.min(sheetTop ? above : below, clearOf, Math.round(size.h * 0.66))) } : null;
  // A Ficha is placed by its TOP edge (its real height is only known once drawn): it grows downward and scrolls inside, so it never slides under the top bar.
  const topEdge = Math.max(safe.top, Math.min(place.plate.y - plateSize.h / 2, size.h - safe.bottom - plateSize.h));
  const plateStyle = sheet ? { left: size.w / 2, width: sheet.width, maxHeight: sheet.room, ...(sheet.top ? { top: safe.top } : { bottom: safe.bottom }) }
    : shown.ficha ? { left: place.plate.x, top: topEdge, width: plateSize.w, maxHeight: Math.max(160, size.h - safe.bottom - topEdge) }
    : { left: place.plate.x, top: place.plate.y, width: plateSize.w };
  const stem = sheet ? { x: size.w / 2, y: sheet.top ? safe.top : size.h - safe.bottom } : shown.ficha ? { x: place.plate.x, y: topEdge + plateSize.h / 2 } : place.plate;
  const move = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys)) return;
    const list = [...(root.current?.querySelectorAll<HTMLButtonElement>('button.ctx-node') ?? [])], at = list.indexOf(document.activeElement as HTMLButtonElement);
    if (!list.length) return;
    e.preventDefault(); list[(at + keys[e.key]! + list.length) % list.length]!.focus();
  };
  return <div ref={root} className="table-cloud" data-phase={phase} role="group" aria-label={`${shown.title}: ações`} onKeyDown={move}>
    <svg className="ctx-stems" width={size.w} height={size.h} aria-hidden="true">
      {place.nodes.map((p, i) => <line key={nodes[i]!.id} x1={anchor.x} y1={anchor.y} x2={p.x} y2={p.y} />)}
      <line x1={anchor.x} y1={anchor.y} x2={stem.x} y2={stem.y} className="is-plate" />
    </svg>
    <i className="ctx-halo" style={{ left: anchor.x, top: anchor.y, width: anchor.r * 2 + 8, height: anchor.r * 2 + 8 }} aria-hidden="true" />
    <div className={`ctx-plate${shown.card ? ' has-card' : ''}${shown.ficha ? ' has-ficha is-top' : ''}${sheet ? ' is-sheet' : ''}`} style={plateStyle}>
      <div className="ctx-plate-head">{canBack && <button type="button" className="ctx-back" onClick={onBack} aria-label="Voltar"><Icon name="back" size={14} /> Voltar</button>}<b>{shown.title}</b>{shown.subtitle && <small>{shown.subtitle}</small>}</div>
      {shown.tabs && shown.tabs.length > 1 && <div className="ctx-tabs" role="tablist">{shown.tabs.map(tab => <button key={tab.id} type="button" role="tab" aria-selected={tab.active} onClick={tab.onSelect}>{tab.label}</button>)}</div>}
      {shown.card}
      {shown.note && <p className="ctx-note" role="status">{shown.note}</p>}
    </div>
    {nodes.map((node, i) => <ContextActionNode key={`${shown.id}:${node.id}`} node={node} index={i} x={place.nodes[i]!.x} y={place.nodes[i]!.y} dx={anchor.x - place.nodes[i]!.x} dy={anchor.y - place.nodes[i]!.y} />)}
  </div>;
}

/** While the MAP is the interface (choose a destination, a Region, a target) the cloud folds into one small instruction pill beside the piece. */
export function TargetChip({ host, hexId, text, tone = 'move', onCancel, children, safe: safeProp = DEFAULT_SAFE }: { host: RefObject<HTMLElement | null>; hexId: string; text: string; tone?: string; onCancel: () => void; children?: ReactNode; safe?: Safe }) {
  const anchor = useHexAnchor(hexId, host), size = useHostSize(host);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onCancel(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onCancel]);
  if (!anchor || !size) return null;
  const place = layoutCloud(anchor, size, phoneSafe(safeProp, size.w), 0, { w: 268, h: 40 });
  return <div className="table-cloud is-target" data-phase="in" role="status">
    <svg className="ctx-stems" width={size.w} height={size.h} aria-hidden="true"><line x1={anchor.x} y1={anchor.y} x2={place.plate.x} y2={place.plate.y} className="is-plate" /></svg>
    <i className="ctx-halo" style={{ left: anchor.x, top: anchor.y, width: anchor.r * 2 + 8, height: anchor.r * 2 + 8 }} aria-hidden="true" />
    <div className={`ctx-chip tone-${tone}`} style={{ left: place.plate.x, top: place.plate.y }}><span>{text}</span>{children}<button type="button" onClick={onCancel} aria-label="Cancelar"><Icon name="cancel" size={14} /> Esc</button></div>
  </div>;
}

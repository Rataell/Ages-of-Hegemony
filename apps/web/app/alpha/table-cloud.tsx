'use client';
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from 'react';
import { Icon, type IconName } from './table-icons';
import { layoutCloud, type Anchor, type Safe, type Size } from './cloud-layout';

/**
 * Interaction Model V2: the Table cloud. A piece or hex is touched, and its possibilities appear around IT, anchored to the hex on screen.
 * One surface that MORPHS (city → build → district → confirm) instead of a stack of panels; the camera never moves to make room.
 */
export type NodeTone = 'dominant' | 'alt' | 'quiet' | 'warn';
export interface CloudNode { id: string; label: string; icon: IconName; tone?: NodeTone | undefined; badge?: string | null | undefined; hint?: string | undefined; /** Why it cannot be done now: the node stays visible and says so. */ disabled?: string | null | undefined; active?: boolean | undefined; onSelect: () => void }
export interface CloudLevel { id: string; title: string; subtitle?: string | undefined; nodes: CloudNode[]; note?: string | null | undefined; card?: ReactNode; tabs?: { id: string; label: string; active: boolean; onSelect: () => void }[] | undefined }
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

export function TableContextCloud({ host, hexId, level, canBack, onBack, onClose, safe = DEFAULT_SAFE }: { host: RefObject<HTMLElement | null>; hexId: string; level: CloudLevel; canBack: boolean; onBack: () => void; onClose: () => void; safe?: Safe }) {
  const anchor = useHexAnchor(hexId, host), size = useHostSize(host), { shown, phase } = useMorph(level);
  const root = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); if (canBack) onBack(); else onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [canBack, onBack, onClose]);
  useEffect(() => { if (phase === 'in') root.current?.querySelector<HTMLButtonElement>('button.ctx-node, .ctx-plate button')?.focus({ preventScroll: true }); }, [shown.id, phase]);
  if (!anchor || !size) return null;
  const nodes = arrange(shown.nodes), plateSize = shown.card ? { w: 252, h: 168 } : { w: 184, h: shown.tabs?.length ? 76 : 54 };
  const place = layoutCloud(anchor, size, safe, nodes.length, plateSize);
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
      <line x1={anchor.x} y1={anchor.y} x2={place.plate.x} y2={place.plate.y} className="is-plate" />
    </svg>
    <i className="ctx-halo" style={{ left: anchor.x, top: anchor.y, width: anchor.r * 2 + 8, height: anchor.r * 2 + 8 }} aria-hidden="true" />
    <div className={`ctx-plate${shown.card ? ' has-card' : ''}`} style={{ left: place.plate.x, top: place.plate.y, width: plateSize.w }}>
      <div className="ctx-plate-head">{canBack && <button type="button" className="ctx-back" onClick={onBack} aria-label="Voltar"><Icon name="back" size={14} /> Voltar</button>}<b>{shown.title}</b>{shown.subtitle && <small>{shown.subtitle}</small>}</div>
      {shown.tabs && shown.tabs.length > 1 && <div className="ctx-tabs" role="tablist">{shown.tabs.map(tab => <button key={tab.id} type="button" role="tab" aria-selected={tab.active} onClick={tab.onSelect}>{tab.label}</button>)}</div>}
      {shown.card}
      {shown.note && <p className="ctx-note" role="status">{shown.note}</p>}
    </div>
    {nodes.map((node, i) => <ContextActionNode key={`${shown.id}:${node.id}`} node={node} index={i} x={place.nodes[i]!.x} y={place.nodes[i]!.y} dx={anchor.x - place.nodes[i]!.x} dy={anchor.y - place.nodes[i]!.y} />)}
  </div>;
}

/** While the MAP is the interface (choose a destination, a Region, a target) the cloud folds into one small instruction pill beside the piece. */
export function TargetChip({ host, hexId, text, tone = 'move', onCancel, children, safe = DEFAULT_SAFE }: { host: RefObject<HTMLElement | null>; hexId: string; text: string; tone?: string; onCancel: () => void; children?: ReactNode; safe?: Safe }) {
  const anchor = useHexAnchor(hexId, host), size = useHostSize(host);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onCancel(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onCancel]);
  if (!anchor || !size) return null;
  const place = layoutCloud(anchor, size, safe, 0, { w: 268, h: 40 });
  return <div className="table-cloud is-target" data-phase="in" role="status">
    <svg className="ctx-stems" width={size.w} height={size.h} aria-hidden="true"><line x1={anchor.x} y1={anchor.y} x2={place.plate.x} y2={place.plate.y} className="is-plate" /></svg>
    <i className="ctx-halo" style={{ left: anchor.x, top: anchor.y, width: anchor.r * 2 + 8, height: anchor.r * 2 + 8 }} aria-hidden="true" />
    <div className={`ctx-chip tone-${tone}`} style={{ left: place.plate.x, top: place.plate.y }}><span>{text}</span>{children}<button type="button" onClick={onCancel} aria-label="Cancelar"><Icon name="cancel" size={14} /> Esc</button></div>
  </div>;
}

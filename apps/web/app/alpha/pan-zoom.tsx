'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/** A viewport with its own pan (drag, arrows) and zoom (wheel, + / −, Ajustar): a spatial surface, never a tall page to scroll. */
export function PanZoom({ children, onBackground, label }: { children: ReactNode; onBackground?: () => void; label: string }) {
  const view = useRef<HTMLDivElement | null>(null), layer = useRef<HTMLDivElement | null>(null);
  const [t, setT] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null);
  /** 'width' lets the layer fill the viewport's width and starts at its top (readable text, pan down); 'all' shows the whole layer. */
  const fit = useCallback((how: 'width' | 'all' = 'width') => {
    const v = view.current, l = layer.current;
    if (!v || !l || !l.offsetWidth || !l.offsetHeight) return;
    const byWidth = v.clientWidth / l.offsetWidth, byAll = Math.min(byWidth, v.clientHeight / l.offsetHeight);
    const k = Math.min(1.4, Math.max(0.3, how === 'all' ? byAll : Math.max(0.6, byWidth)));
    setT({ k, x: Math.max(4, (v.clientWidth - l.offsetWidth * k) / 2), y: how === 'all' ? Math.max(4, (v.clientHeight - l.offsetHeight * k) / 2) : 6 });
  }, []);
  useLayoutEffect(() => { fit(); }, [fit]);
  const zoomAt = useCallback((cx: number, cy: number, factor: number) => setT(old => { const k = Math.min(2.4, Math.max(0.35, old.k * factor)), r = k / old.k; return { k, x: cx - (cx - old.x) * r, y: cy - (cy - old.y) * r }; }), []);
  useEffect(() => {
    const v = view.current;
    if (!v) return;
    // RC5: a trackpad swipe / a mouse wheel pans (Shift + wheel pans sideways); a pinch, Ctrl/Cmd + wheel zooms around the cursor.
    const wheel = (e: WheelEvent) => {
      e.preventDefault(); const box = v.getBoundingClientRect(), unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? box.height : 1;
      if (e.ctrlKey || e.metaKey) { zoomAt(e.clientX - box.left, e.clientY - box.top, Math.exp(-Math.max(-60, Math.min(60, e.deltaY * unit)) * 0.012)); return; }
      let dx = e.deltaX * unit, dy = e.deltaY * unit; if (e.shiftKey && dx === 0) { dx = dy; dy = 0; }
      setT(old => ({ ...old, x: old.x - dx, y: old.y - dy }));
    };
    v.addEventListener('wheel', wheel, { passive: false });
    return () => v.removeEventListener('wheel', wheel);
  }, [zoomAt]);
  const centre = () => { const v = view.current; return { x: (v?.clientWidth ?? 0) / 2, y: (v?.clientHeight ?? 0) / 2 }; };
  return <div className="pan-zoom" role="group" aria-label={label}>
    <div ref={view} className="pan-zoom-view" tabIndex={0}
      onPointerDown={e => { if (e.button === 0) drag.current = { x: e.clientX, y: e.clientY, ox: t.x, oy: t.y, moved: false }; }}
      onPointerMove={e => { const d = drag.current; if (!d || !(e.buttons & 1)) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (!d.moved && Math.abs(dx) + Math.abs(dy) < 5) return; d.moved = true; setT(old => ({ ...old, x: d.ox + dx, y: d.oy + dy })); }}
      onPointerUp={() => { setTimeout(() => { drag.current = null; }, 0); }} onPointerLeave={() => { if (drag.current?.moved) setTimeout(() => { drag.current = null; }, 0); }}
      onClickCapture={e => { if (drag.current?.moved) { e.stopPropagation(); e.preventDefault(); return; } if (onBackground && !(e.target as Element).closest('button')) onBackground(); }}
      onKeyDown={e => {
        const step = 48, keys: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
        if (e.key in keys && e.target === e.currentTarget) { e.preventDefault(); const [dx, dy] = keys[e.key]!; setT(old => ({ ...old, x: old.x + dx, y: old.y + dy })); }
        if (e.key === '+' || e.key === '=') { const c = centre(); zoomAt(c.x, c.y, 1.2); }
        if (e.key === '-') { const c = centre(); zoomAt(c.x, c.y, 1 / 1.2); }
        if (e.key === '0') fit();
        if (e.key === '9') fit('all');
      }}>
      <div ref={layer} className="pan-zoom-layer" style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.k})` }}>{children}</div>
    </div>
    <div className="pan-zoom-tools"><button type="button" aria-label="Diminuir zoom" onClick={() => { const c = centre(); zoomAt(c.x, c.y, 1 / 1.2); }}>−</button><button type="button" onClick={() => fit()}>Ajustar</button><button type="button" onClick={() => fit('all')}>Ver tudo</button><button type="button" aria-label="Aumentar zoom" onClick={() => { const c = centre(); zoomAt(c.x, c.y, 1.2); }}>+</button></div>
  </div>;
}

'use client';
import { useEffect, useState, type RefObject } from 'react';
import type { Box } from './cloud-layout';

/** Where the lit hexes (and, with `pieces`, the pieces and cities) are on screen, relative to the host, so a Ficha stands clear of them: it never hides the destination the player has to touch nor a piece. */
export function useLitBoxes(host: RefObject<HTMLElement | null>, enabled = true, pieces = false): Box[] {
  const [boxes, setBoxes] = useState<Box[]>([]);
  useEffect(() => {
    if (!enabled) { setBoxes(old => (old.length ? [] : old)); return undefined; }
    let frame = 0, last = '';
    const selector = `.world-map .hex.target .hex-base, .world-map .region-back.is-target .region-back-edge${pieces ? ', .world-map .art-stack, .world-map .art-city' : ''}`;
    const read = () => {
      const root = host.current;
      if (root) {
        const base = root.getBoundingClientRect(), found: Box[] = [];
        root.querySelectorAll<SVGGraphicsElement>(selector).forEach(el => {
          const b = el.getBoundingClientRect();
          if (b.width > 0 && b.width < base.width * 0.6) found.push({ x: Math.round(b.left + b.width / 2 - base.left), y: Math.round(b.top + b.height / 2 - base.top), w: Math.round(b.width), h: Math.round(b.height) });
        });
        const signature = found.map(b => `${b.x},${b.y},${b.w}`).join('|');
        if (signature !== last) { last = signature; setBoxes(found); }
      }
      frame = requestAnimationFrame(read);
    };
    read();
    return () => cancelAnimationFrame(frame);
  }, [host, enabled, pieces]);
  return boxes;
}

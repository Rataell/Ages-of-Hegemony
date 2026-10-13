import type { Page } from '@playwright/test';

// Shared by the layout specs (docs/product/ux-board-layering.md): DOM boxes of the priority illustrations and markers, and of the overlays that must never cover them.
/** Every priority illustration and marker on the map, as screen boxes; returns the pairs that overlap by more than `tol` px in both axes. */
export async function collisions(page: Page, tol = 1.5) {
  return page.evaluate(tolerance => {
    const sel = ['.art-city', '.art-piece', '.threat-art [data-class]', '.threat-tent', '.alpha-people', '.art-level-seal', '.art-mood', '.worked-seal', '.hex-seal', '.art-label', '.art-draft-ghost', '.art-draft-tag', '.art-draft-ring'];
    const nodes = [...document.querySelectorAll<SVGGraphicsElement>(sel.map(s => `.world-map ${s}`).join(','))];
    const items = nodes.map(el => { const b = el.getBoundingClientRect(); return { fig: el.matches('.art-piece, [data-class]'), group: el.closest('.art-stack') ?? el.closest('.threat-art'), name: el.getAttribute('class')?.split(' ')[0] ?? el.getAttribute('data-class') ?? el.tagName, hex: el.closest('[data-hex]')?.getAttribute('data-hex') ?? '-', x: b.left, y: b.top, w: b.width, h: b.height }; }).filter(i => i.w > 0 && i.h > 0);
    const bad: string[] = [];
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const a = items[i]!, b = items[j]!; if (a.fig && b.fig && a.group && a.group === b.group) continue;   // figures of one stack overlap by design (0.8 step)
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox > tolerance && oy > tolerance) bad.push(`${a.name}@${a.hex} x ${b.name}@${b.hex} (${ox.toFixed(1)}x${oy.toFixed(1)})`);
    }
    return { count: items.length, bad };
  }, tol);
}

/** Overlays (the Ficha, its title plate, warnings, the bottom tray and the hand) against the boxes of every priority illustration: during an action nothing important may be hidden. */
export async function overlaysOver(page: Page, tol = 2) {
  return page.evaluate(tolerance => {
    // The map is larger than the screen: pieces of a far region may sit under the permanent bars at the edge. The bars are judged against the pieces around the city being acted on (260 px); the Ficha and its plate against every piece.
    const home = document.querySelector('.world-map g.hex.owner-1 .art-city')?.getBoundingClientRect();
    const near = (e: { x: number; y: number; w: number; h: number }) => !home || Math.hypot(e.x + e.w / 2 - (home.left + home.width / 2), e.y + e.h / 2 - (home.top + home.height / 2)) < 260;
    const ents = [...document.querySelectorAll<SVGGraphicsElement>('.world-map .art-city, .world-map .art-piece, .world-map .threat-art [data-class], .world-map .threat-tent')].map(el => { const b = el.getBoundingClientRect(); return { n: el.getAttribute('class')?.split(' ')[0] ?? 'ent', x: b.left, y: b.top, w: b.width, h: b.height }; }).filter(b => b.w > 0 && b.h > 0);
    const overlays = [...document.querySelectorAll<HTMLElement>('.table-cloud .ctx-plate, .table-cloud .ctx-ficha, .alpha-tray, .alpha-round-bar, .alpha-ready-check, .alpha-resolution-phase')].map(el => { const b = el.getBoundingClientRect(); return { n: el.className.toString().split(' ')[0] ?? '', x: b.left, y: b.top, w: b.width, h: b.height }; }).filter(b => b.w > 0 && b.h > 0);
    const bad: string[] = [];
    for (const o of overlays) for (const e of ents) { if (/tray|round-bar|ready-check|resolution/.test(o.n) && !near(e)) continue; const ox = Math.min(o.x + o.w, e.x + e.w) - Math.max(o.x, e.x), oy = Math.min(o.y + o.h, e.y + e.h) - Math.max(o.y, e.y); if (ox > tolerance && oy > tolerance) bad.push(`${o.n} covers ${e.n} (${ox.toFixed(0)}x${oy.toFixed(0)})`); }
    return { overlays: overlays.length, bad };
  }, tol);
}


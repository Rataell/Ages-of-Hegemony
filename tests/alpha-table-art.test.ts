import { describe, expect, it } from 'vitest';
import { CIVILIZATION_KITS } from '@aoh/game-domain';
import { SEAT_COLORS, bannerArt, borderStrokes, cityArt, fortificationArt, pieceArt, sealArt } from '../apps/web/app/alpha/table-art.js';

const count = (svg: string, tag: string) => (svg.match(new RegExp(`<${tag}\\b`, 'g')) ?? []).length;

describe('table art (Experience V2.2)', () => {
  it('grows the city through its plan: more buildings and streets per level, a citadel at level 7', () => {
    const buildings = [1, 2, 3, 4, 5, 6, 7].map(level => count(cityArt(level, 50, { color: SEAT_COLORS[0], seed: 3 }), 'rect'));
    for (let i = 1; i < buildings.length; i++) expect(buildings[i]!).toBeGreaterThan(buildings[i - 1]!);
    expect(cityArt(7, 50, { color: SEAT_COLORS[0], seed: 3 })).toContain('<circle');
  });
  it('draws fortification as its own layer, and damage as gaps in it', () => {
    expect(fortificationArt('NONE', 'INTACT', 50)).toBe('');
    const intact = fortificationArt('STONE_WALL', 'INTACT', 50), breached = fortificationArt('STONE_WALL', 'BREACHED', 50);
    expect(count(breached, 'line')).toBeGreaterThan(count(intact, 'line'));
    expect(breached).toContain('<circle');
  });
  it('gives Pioneiro and Envoy their own silhouettes, not a shared disc (UXDEC-018)', () => {
    const shapes = ['PIONEER', 'ENVOY'].map(kind => pieceArt(kind, SEAT_COLORS[0]));
    expect(new Set(shapes).size).toBe(2);
    for (const svg of shapes) expect(svg).not.toMatch(/<circle r="14\.5"/);
  });
  it('keeps gold out of the seat palette (UXDEC-020)', () => {
    for (const color of SEAT_COLORS) { const [r, g, b] = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16)); expect(r! > 190 && g! > 150 && b! < 130).toBe(false); }
  });
  it('renders every civilization mark: seal, banner and a border pattern', () => {
    for (const kit of CIVILIZATION_KITS) {
      expect(sealArt(kit.mark, SEAT_COLORS[1])).toContain('<path');
      expect(bannerArt(kit.mark, SEAT_COLORS[1])).toContain(SEAT_COLORS[1]);
      for (const stroke of borderStrokes(kit.mark.border, SEAT_COLORS[1])) expect(stroke.match(/stroke-width/g)).toHaveLength(1);
    }
  });
});

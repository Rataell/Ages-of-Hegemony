import { describe, expect, it } from 'vitest';
import { FIGURES } from '@aoh/game-domain';
import { FIGURE_PORTRAIT_NAMES, figurePortraitSvg } from '../apps/web/app/alpha/figure-portraits.js';

/**
 * RC5: the Figura portraits of the approved illustration language (concept "Core 10 · Addendum final") are applied wherever a Figura card shows its art. Every one of the 30 Figuras
 * of the game has a portrait, the markup is deterministic (same on the server and the client) and nothing external is referenced.
 */
describe('Figura portraits', () => {
  it('every Figura of the game has a portrait (after the two naming aliases)', () => {
    expect(FIGURES).toHaveLength(30);
    for (const figure of FIGURES) expect(figurePortraitSvg(figure.name), figure.name).not.toBeNull();
  });
  it('is a self-contained SVG: no external reference, no script, ids scoped to the Figura, same markup every call', () => {
    for (const figure of FIGURES) {
      const svg = figurePortraitSvg(figure.name)!;
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.replace('xmlns="http://www.w3.org/2000/svg"', '')).not.toMatch(/https?:|<script|href=|xlink|<image/i);   // the SVG namespace is the only URL
      expect(figurePortraitSvg(figure.name)).toBe(svg);
    }
    const ids = new Set(FIGURES.map(figure => /id="(s[^"]+)"/.exec(figurePortraitSvg(figure.name)!)![1]));
    expect(ids.size).toBe(FIGURES.length);                 // two Figuras on one screen never share a gradient id
  });
  it('a Figura the concept has no portrait for falls back (null) instead of breaking the card', () => {
    expect(figurePortraitSvg('Figura Inventada')).toBeNull();
    expect(FIGURE_PORTRAIT_NAMES.length).toBeGreaterThanOrEqual(30);
  });
});

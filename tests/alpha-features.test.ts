import { describe, expect, it } from 'vitest';
import { REGION_TEMPLATES, featureFits, templateFeatures } from '@aoh/game-domain';
import { createAlphaGame } from '@aoh/game-engine';

describe('authored terrain features (GR-22)', () => {
  it('places at most one of each feature per region, always on a terrain that can hold it', () => {
    for (const template of REGION_TEMPLATES) {
      const features = templateFeatures(template).filter(f => f !== null);
      expect(new Set(features).size).toBe(features.length);
      templateFeatures(template).forEach((feature, i) => { if (feature) expect(featureFits(feature, template.terrain[i]!)).toBe(true); });
    }
  });
  it('generates fish, timber, fertile soil and stone on the map, so every improvement can be built somewhere', () => {
    const state = createAlphaGame({ gameId: 'features', seed: 5, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] });
    const seen = new Set(state.core.map.flatMap(tile => tile.features));
    for (const feature of ['FISH', 'TIMBER', 'FERTILE', 'STONE', 'METAL']) expect(seen.has(feature as never)).toBe(true);
    expect(state.core.map.some(tile => tile.terrain === 'COAST' && tile.features.includes('FISH'))).toBe(true);
  });
});

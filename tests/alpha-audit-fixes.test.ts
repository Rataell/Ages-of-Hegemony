import { describe, expect, it } from 'vitest';
import { tileSummary } from '../apps/web/app/play/map-frame.js';

describe('tile tooltip (audit fix)', () => {
  it('says nothing about owner or control for an unexplored tile', () => {
    const text = tileSummary({ terrain: 'UNKNOWN', id: '2,0', ownerName: undefined, controllerCityId: null }, 'Desconhecido');
    expect(text).toBe('Desconhecido · 2,0');
    expect(text).not.toMatch(/Livre|Controle|nenhum/);
  });

  it('keeps owner and control for a known tile', () => {
    expect(tileSummary({ terrain: 'PLAINS', id: '1,0', ownerName: undefined, controllerCityId: null }, 'Planície')).toBe('Planície · 1,0 · Livre · Controle: nenhum');
    expect(tileSummary({ terrain: 'PLAINS', id: '1,0', ownerName: 'Ana', controllerCityId: 'city-1' }, 'Planície')).toBe('Planície · 1,0 · Ana · Controle: city-1');
  });
});

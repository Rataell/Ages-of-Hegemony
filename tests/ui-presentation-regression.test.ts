import { describe, expect, it } from 'vitest';
import { label, roman, ruleMessage } from '../apps/web/app/play/presentation.js';

describe('UI Presentation & Invariant Regression Suite', () => {
  it('translates all core domain error codes into user-facing strategic messages', () => {
    const criticalCodes = [
      'WRONG_PHASE',
      'HEX_NOT_FREE',
      'HEX_NOT_OWNED',
      'OUT_OF_RANGE',
      'DISCONNECTED_TERRITORY',
      'INVALID_TERRITORY',
      'INSUFFICIENT_RESOURCES',
      'CITY_TOO_CLOSE',
      'INVALID_CITY_SITE',
      'CITY_NOT_OWNED',
      'INVALID_ALLOCATION',
      'INVALID_WORKED_HEXES',
      'INVALID_IMPROVEMENT',
      'ALREADY_IMPROVED',
      'DISTRICT_LIMIT',
      'DUPLICATE_DISTRICT',
      'MISSING_DISTRICT',
      'DUPLICATE_BUILDING',
      'ALREADY_SPECIALIZED',
      'GOVERNMENT_ALREADY_ADOPTED',
      'MAX_DEVELOPMENT',
      'DEVELOPMENT_REQUIRED',
      'CRITICAL_STABILITY',
      'VERSION_CONFLICT',
      'FORBIDDEN',
    ];

    for (const code of criticalCodes) {
      const msg = ruleMessage(code);
      expect(msg).toBeDefined();
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(5);
      expect(msg).not.toBe(code);
    }
  });

  it('handles composite reason strings with suffixes correctly', () => {
    expect(ruleMessage('CITY_NOT_OWNED:city-1')).toBe('Esta cidade pertence a outra civilização.');
    expect(ruleMessage('INSUFFICIENT_RESOURCES:food')).toBe('Recursos insuficientes para o custo indicado.');
    expect(ruleMessage('UNKNOWN_CODE_FALLBACK')).toBe('UNKNOWN_CODE_FALLBACK');
  });

  it('formats Roman numerals up to tier V', () => {
    expect(roman[1]).toBe('I');
    expect(roman[2]).toBe('II');
    expect(roman[3]).toBe('III');
    expect(roman[4]).toBe('IV');
    expect(roman[5]).toBe('V');
  });

  it('translates terrain, improvements, districts, and government types', () => {
    expect(label('PLAINS')).toBe('Planície');
    expect(label('FOREST')).toBe('Floresta');
    expect(label('HILLS')).toBe('Colinas');
    expect(label('MOUNTAINS')).toBe('Montanhas');
    expect(label('COAST')).toBe('Costa');
    expect(label('SEA')).toBe('Mar');

    expect(label('FARM')).toBe('Fazenda');
    expect(label('MINE')).toBe('Mina');
    expect(label('AGRARIAN')).toBe('Agrário');
    expect(label('COMMERCIAL')).toBe('Comercial');
    expect(label('MONARCHY')).toBe('Monarquia');
    expect(label('REPUBLIC')).toBe('República');
  });

  it('calculates map axial positioning deterministically without NaN or null errors', () => {
    const position = (q: number, r: number) => ({
      x: 80 + 56 * Math.sqrt(3) * (q + r / 2),
      y: 80 + 84 * r,
    });

    const p0 = position(0, 0);
    expect(p0.x).toBe(80);
    expect(p0.y).toBe(80);

    const p1 = position(3, 2);
    expect(Number.isFinite(p1.x)).toBe(true);
    expect(Number.isFinite(p1.y)).toBe(true);
    expect(p1.x).toBeGreaterThan(80);
    expect(p1.y).toBeGreaterThan(80);
  });

  it('safely handles pan calculation with zero or null element dimensions', () => {
    const calculatePanDelta = (
      dx: number,
      dy: number,
      width: number,
      height: number,
      clientWidth: number | null | undefined,
      clientHeight: number | null | undefined,
      zoom: number
    ) => {
      const safeW = (clientWidth && clientWidth > 0) ? clientWidth : 800;
      const safeH = (clientHeight && clientHeight > 0) ? clientHeight : 600;
      return {
        deltaX: (dx * width) / (safeW * zoom),
        deltaY: (dy * height) / (safeH * zoom),
      };
    };

    // Standard client bounds
    const normal = calculatePanDelta(10, 20, 1000, 800, 1000, 800, 1);
    expect(normal.deltaX).toBe(10);
    expect(normal.deltaY).toBe(20);

    // Null/undefined dimensions (regression case for clientWidth crash)
    const fallback = calculatePanDelta(10, 20, 1000, 800, null, undefined, 1);
    expect(Number.isFinite(fallback.deltaX)).toBe(true);
    expect(Number.isFinite(fallback.deltaY)).toBe(true);
    expect(fallback.deltaX).toBeCloseTo(12.5);
    expect(fallback.deltaY).toBeCloseTo(26.66, 1);

    // Zero dimension edge cases
    const zeroCase = calculatePanDelta(5, 5, 1000, 800, 0, 0, 1.5);
    expect(Number.isFinite(zeroCase.deltaX)).toBe(true);
    expect(Number.isFinite(zeroCase.deltaY)).toBe(true);
  });
});

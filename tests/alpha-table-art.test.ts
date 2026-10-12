import { describe, expect, it } from 'vitest';
import { CIVILIZATION_KITS, CORE10_CHASSIS, DISCOVERY_INFO, LEGACY_WORKS, type DiscoveryKind } from '@aoh/game-domain';
import {
  CULTURE_IDS, DISCOVERY_MARKERS, LEGACY_WORK_IDS, SEAT_COLORS, bannerArt, borderStrokes, cityArt, cityDetailArt, cityPieceArt, cultureOf, discoveryArt,
  campArt, dangerMarkArt, emblemArt, fortificationArt, harborArt, mix, orientationArt, pieceArt, sealArt, seatColor, seatSeal, threatFigureArt, threatMarkArt, workArt,
} from '../apps/web/app/alpha/table-art.js';
import { moodLabel, moodSealArt, moodSealSvg } from '../apps/web/app/alpha/mood-seal.js';
import { FEATURE_KEYS, IMPROVEMENT_KEYS, TERRAIN_KEYS, TERRAIN_VARIANTS, terrainDefs, terrainSummary, terrainVariant } from '../apps/web/app/alpha/terrain-art.js';

const count = (svg: string, tag: string) => (svg.match(new RegExp(`<${tag}\\b`, 'g')) ?? []).length;
const volumes = (svg: string) => Number(/data-volumes="(\d+)"/.exec(svg)?.[1] ?? 0);
const gaps = (svg: string) => Number(/data-gaps="(\d+)"/.exec(svg)?.[1] ?? -1);
const core = CIVILIZATION_KITS.filter(kit => CORE10_CHASSIS.includes(kit.id));

describe('table art (Experience V2.2 · RC 1.2 material culture)', () => {
  it('grows the city by mass and density: more volumes per level, at the Mesa and in Focar', () => {
    for (const lod of ['mesa', 'focus'] as const) {
      const sizes = [1, 2, 3, 4, 5, 6, 7].map(level => volumes(cityPieceArt({ level, color: SEAT_COLORS[0], seed: 3, civilization: 'valgard', lod })));
      for (let i = 1; i < sizes.length; i++) expect(sizes[i]!, `${lod} N${i + 1}`).toBeGreaterThanOrEqual(sizes[i - 1]!);
      expect(sizes[6]!).toBeGreaterThan(sizes[0]! * 3);
    }
    expect(volumes(cityPieceArt({ level: 5, color: SEAT_COLORS[0], seed: 3, lod: 'focus' }))).toBeGreaterThan(volumes(cityPieceArt({ level: 5, color: SEAT_COLORS[0], seed: 3, lod: 'mesa' })));
    expect(cityArt(4, 50, { color: SEAT_COLORS[0], seed: 3 })).toContain('culture-neutral');
  });
  it('gives each of the ten civilizations its own architecture, never a hue swap of the seat color', () => {
    expect(CORE10_CHASSIS.map(cultureOf).sort()).toEqual([...CULTURE_IDS].sort());
    expect(cultureOf(null)).toBe('neutral');
    expect(cultureOf('not-a-civ')).toBe('neutral');
    const art = CORE10_CHASSIS.map(civ => cityPieceArt({ level: 5, color: SEAT_COLORS[2], seed: 9, civilization: civ, lod: 'focus' }));
    expect(new Set(art).size).toBe(10);
    // The seat color only touches the rim and the standard: the same civilization in another seat color is the same miniature.
    for (const civ of CORE10_CHASSIS) {
      const a = cityPieceArt({ level: 5, color: SEAT_COLORS[0], seed: 4, civilization: civ }), b = cityPieceArt({ level: 5, color: SEAT_COLORS[3], seed: 4, civilization: civ });
      const neutral = (svg: string, color: string) => svg.split(mix(color, '#000000', 0.35)).join('#rim').split(color).join('#seat');
      expect(neutral(a, SEAT_COLORS[0]) === neutral(b, SEAT_COLORS[3]), civ).toBe(true);
    }
  });
  it('draws fortification as its own layer around the base, damage as gaps with rubble', () => {
    expect(fortificationArt('NONE', 'INTACT', 50)).toBe('');
    const intact = fortificationArt('STONE_WALL', 'INTACT', 50), damaged = fortificationArt('STONE_WALL', 'DAMAGED', 50), breached = fortificationArt('STONE_WALL', 'BREACHED', 50);
    expect([gaps(intact), gaps(damaged), gaps(breached)]).toEqual([0, 1, 2]);
    expect(count(breached, 'circle')).toBeGreaterThan(count(intact, 'circle'));
    const walls = CORE10_CHASSIS.map(civ => fortificationArt('FORTRESS', 'INTACT', 50, { civilization: civ }));
    expect(new Set(walls).size).toBe(10);
    for (const level of ['PALISADE', 'STONE_WALL', 'FORTRESS', 'BASTION', 'CITADEL']) expect(fortificationArt(level, 'INTACT', 50).length).toBeGreaterThan(100);
  });
  it('sends the Porto across the shared edge, opens the wall on the water and keeps the culture', () => {
    const closed = fortificationArt('STONE_WALL', 'INTACT', 50, { civilization: 'kor' }), open = fortificationArt('STONE_WALL', 'INTACT', 50, { civilization: 'kor', harbor: 0 });
    expect(count(open, 'path')).toBeLessThan(count(closed, 'path'));
    const ports = CORE10_CHASSIS.map(civ => harborArt(civ, Math.PI / 3, 50, 'focus'));
    expect(new Set(ports).size).toBe(10);
    expect(ports[0]).toContain('rotate(60)');
    expect(cityDetailArt({ level: 4, color: SEAT_COLORS[1], seed: 2, civilization: 'thalos', harbor: true })).toMatch(/^<svg[^>]*class="city-detail-art"[\s\S]*harbor culture-norse/);
  });
  it('has twelve distinct Obras, the same piece on the card and on the city, with scaffold steps', () => {
    expect([...LEGACY_WORK_IDS].sort()).toEqual(LEGACY_WORKS.map(work => work.id).sort());
    const pieces = LEGACY_WORK_IDS.map(id => workArt(id, 48, 3));
    expect(new Set(pieces).size).toBe(12);
    const steps = [0, 1, 2, 3].map(step => workArt('sky-instrument', 48, step));
    expect(new Set(steps).size).toBe(4);
    expect(steps[1]).toContain('clip-path');
    const city = cityPieceArt({ level: 4, color: SEAT_COLORS[0], seed: 1, civilization: 'saren', work: { workId: 'world-council', steps: 2, complete: false } });
    expect(city).toContain('data-work="world-council"');
    expect(city).toContain('data-steps="2"');
  });
  it('keeps a permanent discovery marker only for the kinds DISCOVERY_INFO marks', () => {
    const marked = (Object.keys(DISCOVERY_INFO) as DiscoveryKind[]).filter(kind => DISCOVERY_INFO[kind].marker);
    expect([...DISCOVERY_MARKERS].sort()).toEqual(marked.sort());
    expect(new Set(marked.map(kind => discoveryArt(kind, 40))).size).toBe(marked.length);
  });
  it('marks a face-down Region with an abstract orientation only (no terrain)', () => {
    const marks = [0, 1, 2, 3, 4, 5].map(r => orientationArt(r));
    expect(new Set(marks).size).toBe(6);
    for (const svg of marks) expect(svg).not.toMatch(/PLAINS|FOREST|HILLS|MOUNTAINS|COAST|SEA|terrain/i);
    expect(orientationArt(7)).toBe(orientationArt(1));
  });
  it('gives Pioneiro and Envoy their own silhouettes, and every piece can carry the seat seal', () => {
    const shapes = ['PIONEER', 'ENVOY'].map(kind => pieceArt(kind, SEAT_COLORS[0]));
    expect(new Set(shapes).size).toBe(2);
    for (const svg of shapes) expect(svg).not.toMatch(/<circle r="14\.5"/);
    expect(pieceArt('INFANTRY', SEAT_COLORS[4], 34, 2, false, 4)).toContain('data-seat="5"');
  });
  it('has six distinct seat colors, none of them gold (UXDEC-020), and six distinct seat seals', () => {
    expect(new Set(SEAT_COLORS).size).toBe(6);
    for (const color of SEAT_COLORS) { const [r, g, b] = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16)); expect(r! > 190 && g! > 150 && b! < 130).toBe(false); }
    expect(seatColor(6)).toBe(seatColor(0));
    const glyphs = [0, 1, 2, 3, 4, 5].map(i => seatSeal(i, '#888888', 16).replace(/data-seat="\d"/, ''));
    expect(new Set(glyphs).size).toBe(6);
  });
  it('renders every civilization mark (seal, standard, border), with ten different Core 10 standards and emblems', () => {
    for (const kit of CIVILIZATION_KITS) {
      expect(sealArt(kit.mark, SEAT_COLORS[1])).toContain('<path');
      expect(bannerArt(kit.mark, SEAT_COLORS[1])).toContain(SEAT_COLORS[1]);
      for (const stroke of borderStrokes(kit.mark.border, SEAT_COLORS[1])) expect(stroke.match(/stroke-width/g)).toHaveLength(1);
    }
    expect(core).toHaveLength(10);
    expect(new Set(core.map(kit => kit.mark.banner)).size).toBe(10);
    expect(new Set(core.map(kit => bannerArt(kit.mark, SEAT_COLORS[0], 22))).size).toBe(10);
    expect(new Set(core.map(kit => emblemArt(kit.mark.emblem, 0, 0, 1, '#fff'))).size).toBe(10);
  });
});

describe('Mesa Viva B1 art: threats, Ânimo and terrain', () => {
  it('draws a threat from its real composition on the angular iron base, up to 3 classes and a +N', () => {
    const fig = threatFigureArt('CAVALRY', 26);
    expect(fig).toContain('#b4533c');
    expect(/points="([^"]+)"/.exec(fig)![1]!.split(' ')).toHaveLength(8);
    const band = threatMarkArt({ kind: 'CAMP', status: 'MARCHING', level: 2, composition: [{ kind: 'INFANTRY', count: 2 }, { kind: 'CAVALRY', count: 1 }, { kind: 'RANGED', count: 1 }, { kind: 'SIEGE', count: 1 }] });
    expect((band.match(/data-class=/g) ?? []).length).toBe(3);
    expect(band).toContain('+1');
    expect(band).toContain('Bando II');
    expect(threatMarkArt({ kind: 'CAMP', status: 'CAMPED', level: 1, composition: [{ kind: 'INFANTRY', count: 1 }], fresh: true })).toContain('data-wait="1"');
    expect(threatMarkArt({ kind: 'CAMP', status: 'MARCHING', level: 1, composition: [{ kind: 'INFANTRY', count: 1 }], state: 'WITHDRAWING' })).toContain('data-retreat="1"');
    expect(threatMarkArt({ kind: 'PIRATE', status: 'MARCHING', level: 1, composition: [{ kind: 'COASTAL_VESSEL', count: 1 }] })).toContain('Piratas I');
    expect(campArt('rest')).toContain('is-wait');
    expect(campArt('active')).not.toContain('is-wait');
    expect(dangerMarkArt()).toContain('#e6a03c');
  });
  it('gives the four Ânimo bands four different seals with the number and an accessible label', () => {
    expect(new Set([0, 2, 4, 5].map(n => moodSealArt(n))).size).toBe(4);
    expect(moodSealArt(1)).toContain('data-band="Revolta"');
    expect(moodSealArt(3)).toContain('stroke-dasharray');
    expect(moodLabel(4)).toBe('Ânimo 4 de 6, Estável');
    expect(moodSealSvg(6)).toContain('aria-label="Ânimo 6 de 6, Próspera"');
    expect(moodSealArt(9)).toContain('data-mood="6"');
  });
  it('draws relief, every resource and every improvement as art, built once; COAST and SEA differ', () => {
    const defs = terrainDefs();
    expect(terrainDefs()).toBe(defs);
    for (const t of TERRAIN_KEYS) for (let v = 0; v < TERRAIN_VARIANTS; v++) expect(defs).toContain(`id="aoh-t-${t}-${v}"`);
    for (const f of FEATURE_KEYS) expect(defs).toContain(`id="aoh-f-${f}"`);
    for (const i of IMPROVEMENT_KEYS) expect(defs).toContain(`id="aoh-i-${i}"`);
    expect(defs).toContain('#46a6ad');
    expect(defs).toContain('#264f68');
    expect([terrainVariant(0, 0), terrainVariant(-5, 9), terrainVariant(20, 3)].every(v => v >= 0 && v < TERRAIN_VARIANTS)).toBe(true);
    const text = terrainSummary({ terrain: 'HILLS', features: ['METAL'], improvement: 'MINE', owner: 'Leontia', moveCosts: { HILLS: 2 } });
    expect(text.short).toBe('Colinas · Jazida de Metal · Mina · Leontia');
    expect(text.lines).toContain('Custo de movimento 2');
    expect(terrainSummary({ terrain: 'SEA' }).lines[1]).toContain('só navios');
  });
});

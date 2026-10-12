'use client';
import type { MouseEvent as ReactMouseEvent, KeyboardEvent as ReactKeyEvent } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LocalView } from '@aoh/server/local-play';
import type { AlphaUnit, HexTile } from '@aoh/game-domain';
import { label, roman } from './presentation';
import { DEFAULT_SAFE, cameraBox, clampCentre, clampZoom, fitScale, mapFrame, position, regionOutline, tileSummary, viewBoxOf, type SafeInsets } from './map-frame';
import { type CivilizationMark } from '@aoh/game-domain';
import { CIVIL_PIECES, DISCOVERY_MARKERS, bannerArt, borderStrokes, cityPieceArt, dangerMarkArt, discoveryArt, harborArt, orientationArt, pieceArt, seatSealSvg, seedOf, threatFigureArt, threatMarkArt, threatName, THREAT_ROMAN } from '../alpha/table-art';
import { moodLabel, moodSealArt } from '../alpha/mood-seal';
import { roadCanStand, roadTileArt } from '../alpha/road-art';
import { featureId, improvementId, isFeatureKey, isImprovementKey, isTerrainKey, terrainDefs, terrainId, terrainSummary, terrainVariant } from '../alpha/terrain-art';

/** Experience V2.2 table art (Alpha only): seat color says whose, the civilization mark says which civilization. */
export type MapArt = {
  /** `seat`: the seat index 0–5 (seat color and seat seal; the seal tells players apart without hue). */
  seats: Record<string, { color: string; mark: CivilizationMark | null; signature?: string | null; seat?: number }>;
  /** Roads (visible) and own trade routes, drawn under the pieces. */
  roads?: readonly string[];
  routes?: readonly { id: string; path: readonly string[]; suspended: boolean }[];
  /** Results shown on their target: a neutral halo and a short tag (resolution events, card effects on pieces). */
  marks?: readonly { hexId: string; label: string; tone: 'event' | 'card' | 'loss' | 'plan' }[];
  /** Material culture (RC 1.2): `civilization` = the owner's hidden chassis (architecture), `harbor` = the navigable hex the Porto reaches across a shared edge, `work` = the Obra de Legado on the city. */
  cityMarks: readonly { cityId: string; hexId: string; ownerId: string; level: number; capacity?: number; capital: boolean; fortification: { level: string; state: string }; blockaded?: boolean | null; civilization?: string | null; harbor?: string | null; work?: { workId: string; steps: number; complete: boolean } | null; /** Ânimo 0–6 and its band: only the viewer's own cities (private). */ mood?: number; moodBand?: string }[];
  /** Descobertas the viewer revealed: a small permanent 3D marker at the Region's centre for the kinds that keep one. */
  discoveries?: readonly { regionId: string; hexIds: readonly string[]; kind: string; resolved?: boolean }[];
};
/** Reveal choreography (board-game feel, ≈ 1.15 s): highlight → (orientation) small turn of the back → flip → terrain lands. */
const REVEAL_STEPS: readonly [number, 'lift' | 'turn' | 'flip' | 'land'][] = [[0, 'lift'], [220, 'turn'], [520, 'flip'], [760, 'land']];
const REVEAL_TOTAL = 1150;
const svgFragment = (html: string) => ({ __html: html });
const NONE: readonly never[] = [];
/** Overlay duration of a step (MOVEMENT with fromHexId) and of the arrival pop. */
const TRAIL_MS = 1200;
const rankKind = (kind: string, count: number) => (kind === 'FLEET' ? 3e6 : kind === 'COASTAL_VESSEL' ? 2e6 : CIVIL_PIECES.has(kind) ? 0 : 1e6) + count;
const centreOf = (hexId: string) => { const [q, r] = hexId.split(',').map(Number); return position(q ?? 0, r ?? 0); };
/** The two corners a tile shares with a neighbour centred at (nx, ny): the tile corners nearest to it. */
function sharedEdge(x: number, y: number, nx: number, ny: number, r: number): [number, number, number, number] {
  const corners = Array.from({ length: 6 }, (_, i) => { const a = ((60 * i - 30) * Math.PI) / 180; return [x + r * Math.cos(a), y + r * Math.sin(a)] as const; })
    .sort((a, b) => Math.hypot(a[0] - nx, a[1] - ny) - Math.hypot(b[0] - nx, b[1] - ny));
  return [corners[0]![0], corners[0]![1], corners[1]![0], corners[1]![1]];
}
const NEIGHBOURS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]] as const;
/** Direction (radians) from a city hex to its harbor hex: the Porto crosses the edge they share. */
function harborAngle(cityHexId: string, harborHexId: string) {
  const [q, r] = cityHexId.split(',').map(Number), [hq, hr] = harborHexId.split(',').map(Number);
  const a = position(q ?? 0, r ?? 0), b = position(hq ?? 0, hr ?? 0);
  return Math.atan2(b.y - a.y, b.x - a.x);
}

type Props = {
  data: Pick<LocalView,'players'|'claimable'|'workable'> & {view:Pick<LocalView['view'],'player'|'visibleCities'> & {era:string;visibleTerritory:HexTile[]}};
  units?: readonly AlphaUnit[];
  /** Independent peoples and raid bands the player knows of (Alpha). */
  peoples?: readonly { hexId: string; type: string; attitude: string; integratedBy: string | null }[];
  /** Threats with the intention the engine decided (V51B-05): the map only draws what it receives. */
  threats?: readonly { id: string; hexId: string; kind: 'CAMP' | 'PIRATE'; level: 1 | 2 | 3; status: 'CAMPED' | 'MARCHING'; fresh?: boolean; reorganizing?: boolean; composition?: readonly { kind: string; count: number }[]; intent?: { state: string; targetKind: string | null; targetKnown: boolean; targetId: string | null; targetHexId: string | null; distance: number | null; nextHexId: string | null; /** Planned path, already cut at the fog by the projection. */ pathHexIds?: readonly string[] } }[];
  /** Resolution events of the last resolved round (roundReports[].resolution), already filtered by the projection: MOVEMENT with `fromHexId` draws the step, LOSSES the halo and the ghost pieces. */
  resolution?: readonly { id: string; round: number; type: string; hexId?: string | undefined; fromHexId?: string | undefined; cityId?: string | undefined; unitIds?: readonly string[] | undefined; message: string }[];
  /** Closed hexes a piece can enter whose `frontierRisk.danger` is POSSIBLE (alphaUnitOptions().frontier): an amber warning, never the fact of a Perigo. */
  dangerHexes?: readonly string[];
  /** The engine's `rules.movementCosts`, for the hex inspector. */
  movementCosts?: Readonly<Record<string, number>>;
  art?: MapArt;
  /** Public board topology (Mesa): every Region of the footprint, face down or open for this viewer, and whose Pátria it is. Enables the table camera. */
  board?: readonly { id: string; hexIds: readonly string[]; closed: boolean; homeOf: string | null }[];
  /** Status line per seat shown on the table edge ("Planejando…", "✓ Pronto"). */
  seatStatus?: Readonly<Record<string, string>>;
  /** Social layer on the seat plates: a short reaction bubble above a plate, a presence tone, and a click on the viewer's own plate. */
  plateBubble?: Readonly<Record<string, { glyph: string; label: string; key: number }>>;
  plateTone?: Readonly<Record<string, string>>;
  onSelfPlate?: (anchor: HTMLElement) => void;
  safe?: SafeInsets;
  /** Interaction V2 target mode: the hexes a pending decision may land on, by kind (move, explore, attack, claim, mission). The map answers the decision. */
  targets?: { kind: string; hexIds: readonly string[]; /** Terrain cost of each lit hex, written on it ("3", or "4 · +2" when only a card bonus of this round reaches it). */ labels?: Readonly<Record<string, string>>; tones?: Readonly<Record<string, 'base' | 'bonus'>> } | null;
  /** Mover coordenado: the legs of the Order being drafted, one coloured trajectory each with an arrow, ghost miniatures and a tag at the destination, and a numbered ring on the origin. */
  draftLegs?: readonly { index: number; color: string; origin: string; path: readonly string[]; kinds: readonly string[]; tag: string }[] | null;
  /** A click on the table that hit no hex (closes the contextual cloud). */
  onBackground?: () => void;
  /** A click on the player's own pieces drawn on a hex (selects the stack, not the hex). */
  onSelectPieces?: (hexId: string) => void;
  /** Exploration selector: an ABSTRACT orientation mark on a face-down Region (never terrain), rotated rotation × 60°. */
  orientation?: { regionId: string; rotation: number } | null;
  /** Plays the physical reveal of that Region (highlight → turn → flip → terrain) and then calls `onRevealDone`. */
  reveal?: { regionId: string; rotation: number } | null;
  onRevealDone?: () => void;
  selected: string | null;
  focus: string | null;
  working: boolean;
  worked: string[];
  onSelect: (id: string) => void;
};

export const points = Array.from({ length: 6 }, (_, i) => {
  const angle = ((60 * i - 30) * Math.PI) / 180;
  return `${(52 * Math.cos(angle)).toFixed(1)},${(52 * Math.sin(angle)).toFixed(1)}`;
}).join(' ');

const innerPoints = Array.from({ length: 6 }, (_, i) => {
  const angle = ((60 * i - 30) * Math.PI) / 180;
  return `${(47 * Math.cos(angle)).toFixed(1)},${(47 * Math.sin(angle)).toFixed(1)}`;
}).join(' ');

const terrainGlyphs: Record<string, string> = {
  PLAINS: '⌁',
  FOREST: '♠',
  HILLS: '⌃⌃',
  MOUNTAINS: '▲',
  COAST: '∿',
  SEA: '≈',
  UNKNOWN: '?',
};

const featureGlyphs: Record<string, string> = {
  RIVER: '≈',
  FERTILE: '✦',
  TIMBER: '⋈',
  STONE: '◇',
  METAL: '◆',
  FISH: '⋊',
};

const improvementIcons: Record<string, string> = {
  FARM: '🌾',
  LUMBER_CAMP: '🪵',
  QUARRY: '🪨',
  MINE: '⛏',
  FISHERY: '🐟',
};

export const HexMap = memo(function HexMap({
  data,
  selected,
  focus,
  working,
  worked,
  onSelect,
  units = [],
  peoples = [],
  threats = [],
  resolution = NONE,
  dangerHexes = NONE,
  movementCosts,
  draftLegs = null,
  art,
  board,
  seatStatus = {},
  plateBubble = {},
  plateTone = {},
  onSelfPlate,
  safe = DEFAULT_SAFE,
  targets = null,
  onBackground,
  onSelectPieces,
  orientation = null,
  reveal = null,
  onRevealDone,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  // null = fitted to the projected tiles; otherwise an explicit centre and zoom (1 shows the whole fitted frame).
  const [view, setView] = useState<{ cx: number; cy: number; zoom: number } | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [moved, setMoved] = useState(false);

  const tiles = data.view.visibleTerritory;
  const targetSet = useMemo(() => new Set(targets?.hexIds ?? []), [targets]);
  const mesa = board !== undefined;
  const [size, setSize] = useState({ w: 1280, h: 720 });
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === 'undefined') return;
    const read = () => { const box = svg.getBoundingClientRect(); if (box.width > 0 && box.height > 0) setSize({ w: box.width, h: box.height }); };
    read();
    const observer = new ResizeObserver(read); observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  // MESA: the frame is the WHOLE board (public topology), never just what the player has explored. Without a board (old atlas) it fits the known tiles.
  const boardHexes = useMemo(() => (board ?? []).flatMap(region => region.hexIds.map(id => { const [q, r] = id.split(',').map(Number); return { id, q: q ?? 0, r: r ?? 0, regionId: region.id }; })), [board]);
  const frame = useMemo(() => {
    // The whole board; tiles outside any Region (old saves, test maps) are included so nothing is ever clipped out of the frame.
    if (mesa) return mapFrame([...boardHexes, ...tiles], { padding: 24 });
    const known = tiles.filter(tile => tile.terrain !== 'UNKNOWN');
    return known.length >= 3 ? mapFrame(known, { padding: 70 }) : mapFrame(tiles);
  }, [tiles, mesa, boardHexes]);
  // null = MESA (fit); otherwise an explicit centre and a zoom relative to the fit. Nothing re-centres the camera by itself: only MESA and FOCAR do.
  const current = view ?? { cx: frame.cx, cy: frame.cy, zoom: 1 };
  const camera = mesa ? cameraBox(frame, size, safe, view) : { viewBox: viewBoxOf(frame, view), scale: 1 };
  const focusTile = tiles.find(t => t.id === focus);
  const zoomed = mesa && camera.scale / fitScale(frame, size, safe) > 1.8;
  // Level of detail of the table art: Mesa (mass, level, rim, walls, one dominant silhouette) or Focar (districts, roofs, ornament).
  const lod = zoomed || !mesa ? 'focus' : 'mesa';
  const focusHere = () => {
    const target = tiles.find(t => t.id === selected) ?? focusTile ?? tiles.find(t => t.id === data.view.player.civilization.cities[0]?.hexId);
    if (!target) return;
    const at = position(target.q, target.r);
    setView({ ...clampCentre(frame, at.x, at.y), zoom: 2.4 });
  };
  // A Region that just turned face up flips for a moment.
  const closedBefore = useRef<Set<string>>(new Set());
  const [flipping, setFlipping] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!board) return;
    const nowClosed = new Set(board.filter(region => region.closed).map(region => region.id));
    const opened = board.filter(region => !region.closed && closedBefore.current.has(region.id)).flatMap(region => region.hexIds as string[]);
    closedBefore.current = nowClosed;
    if (opened.length) { setFlipping(new Set(opened)); const timer = setTimeout(() => setFlipping(new Set()), 900); return () => clearTimeout(timer); }
  }, [board]);
  // Physical reveal driven by the exploration UI: the back is lifted, turned (if an orientation was chosen), flipped, and the terrain lands.
  const [revealing, setRevealing] = useState<{ id: string; rotation: number; phase: 'lift' | 'turn' | 'flip' | 'land' } | null>(null);
  const revealDone = useRef(onRevealDone);
  revealDone.current = onRevealDone;
  useEffect(() => {
    if (!reveal) { setRevealing(null); return; }
    const calm = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const steps = calm ? [[0, 'land'] as const] : REVEAL_STEPS;
    const timers = steps.map(([at, phase]) => setTimeout(() => setRevealing({ id: reveal.regionId, rotation: reveal.rotation, phase }), at));
    timers.push(setTimeout(() => { setRevealing(null); revealDone.current?.(); }, calm ? 200 : REVEAL_TOTAL));
    return () => timers.forEach(clearTimeout);
  }, [reveal?.regionId, reveal?.rotation]);
  const revealRegion = revealing ? board?.find(region => region.id === revealing.id) : undefined;
  const revealHexes = useMemo(() => new Set(revealRegion?.hexIds ?? []), [revealRegion]);

  const cities = [...data.view.player.civilization.cities, ...data.view.visibleCities];
  // Shared table: a piece or city that appears (or lands) because of anyone's resolved action pops in for a moment, so every window reads the change.
  const seenPieces = useRef<Set<string> | null>(null);
  const [arriving, setArriving] = useState<Set<string>>(new Set());
  useEffect(() => {
    const now = new Map<string, string>();
    for (const unit of units) now.set(`${unit.id}@${unit.hexId}`, unit.hexId);
    for (const city of cities) now.set(`city:${city.id}`, city.hexId);
    // A Bando or camp that appears (or lands) pops in like any piece: derived from the diff by id, never from a timer of its own.
    for (const threat of threats) now.set(`threat:${threat.id}@${threat.hexId}`, threat.hexId);
    const before = seenPieces.current;
    seenPieces.current = new Set(now.keys());
    if (!before) return;
    const added = [...now].filter(([key]) => !before.has(key)).map(([, hex]) => hex);
    if (!added.length) return;
    setArriving(new Set(added));
    const timer = setTimeout(() => setArriving(new Set()), 800);
    return () => clearTimeout(timer);
  }, [units, threats, cities.length]);
  // Steps of the last resolution (MOVEMENT with fromHexId): origin → destination for about a second; ids already seen never replay.
  const seenResolution = useRef<Set<string> | null>(null);
  const [trails, setTrails] = useState<readonly { id: string; from: string; to: string; kind: string | null }[]>([]);
  useEffect(() => {
    const ids = new Set(resolution.map(event => event.id)), before = seenResolution.current;
    seenResolution.current = ids;
    if (!before) return;
    const fresh = resolution.filter(event => event.type === 'MOVEMENT' && event.fromHexId && event.hexId && !before.has(event.id));
    if (!fresh.length) return;
    setTrails(fresh.map(event => ({ id: event.id, from: event.fromHexId!, to: event.hexId!, kind: threats.find(t => event.unitIds?.includes(t.id))?.composition?.[0]?.kind ?? null })));
    const timer = setTimeout(() => setTrails([]), TRAIL_MS);
    return () => clearTimeout(timer);
  }, [resolution]);
  // Pieces the table has seen, so a LOSSES event can draw what was lost as a ghost (the unit is gone from `units` by then).
  const knownPieces = useRef(new Map<string, { kind: string; ownerId: string }>());
  for (const unit of units) knownPieces.current.set(unit.id, { kind: unit.kind, ownerId: unit.ownerId });
  /** Roads and own routes, per tile: where each link crosses the shared edge (half of the vector to the linked neighbour). A road hex links to ALL neighbours that have a road or a city (six directions); drawn inside the tile, under its pieces (road-art.ts). */
  const ways = useMemo(() => {
    const out = new Map<string, { road: [number, number][]; route: { d: [number, number]; suspended: boolean }[] }>();
    if (!art) return out;
    const get = (id: string) => { let entry = out.get(id); if (!entry) { entry = { road: [], route: [] }; out.set(id, entry); } return entry; };
    const coords = (id: string) => { const [q, r] = id.split(',').map(Number); return position(q ?? 0, r ?? 0); };
    const half = (from: string, to: string): [number, number] => { const a = coords(from), b = coords(to); return [(b.x - a.x) / 2, (b.y - a.y) / 2]; };
    const roads = new Set<string>(art.roads ?? []), cityHexes = new Set<string>(cities.map(c => c.hexId));
    for (const id of roads) {
      get(id);
      const [q, r] = id.split(',').map(Number);
      for (const [dq, dr] of NEIGHBOURS) { const n = `${(q ?? 0) + dq},${(r ?? 0) + dr}`; if (roads.has(n) || cityHexes.has(n)) { get(id).road.push(half(id, n)); if (cityHexes.has(n)) get(n).road.push(half(n, id)); } }
    }
    for (const route of art.routes ?? []) route.path.forEach((id, k) => {
      for (const other of [route.path[k - 1], route.path[k + 1]]) if (other) get(id).route.push({ d: half(id, other), suspended: route.suspended });
    });
    return out;
  }, [art?.roads, art?.routes, cities.length]);
  const capitalId = data.view.player.civilization.capitalCityId;

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    setDrag({ x: e.clientX, y: e.clientY });
    setMoved(false);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag || !(e.buttons & 1)) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) {
      setMoved(true);
      // The svg scales the frame uniformly to fit, so one pixel is 1 / scale units. Sample the size with non-zero fallbacks.
      const svg = svgRef.current;
      const clientW = svg?.clientWidth || svg?.getBoundingClientRect().width || 800;
      const clientH = svg?.clientHeight || svg?.getBoundingClientRect().height || 600;
      const w = clientW > 0 ? clientW : 800, h = clientH > 0 ? clientH : 600;
      const unitsPerPixel = mesa ? 1 / camera.scale : 1 / Math.min(w / (frame.width / current.zoom), h / (frame.height / current.zoom));
      setView({ ...current, ...clampCentre(frame, current.cx - dx * unitsPerPixel, current.cy - dy * unitsPerPixel) });
      setDrag({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerEnd = useCallback(() => {
    setDrag(null);
  }, []);

  // Scrolling the map (RC5): a Mac trackpad two-finger swipe and a traditional mouse wheel PAN the map (Shift + wheel pans sideways); a trackpad pinch, Ctrl/Cmd + wheel, and the
  // Safari pinch gesture ZOOM around the cursor. The page itself never scrolls under the Mesa. The handler reads the latest camera through a ref, so it is attached once.
  const wheelState = useRef({ current, camera, frame, mesa, safe, size });
  wheelState.current = { current, camera, frame, mesa, safe, size };
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const zoomTo = (zoom: number, at: { x: number; y: number } | null) => {
      const { current: now, camera: cam, frame: fr, mesa: isMesa, safe: insets, size: dims } = wheelState.current;
      const next = clampZoom(zoom);
      if (next === now.zoom) return;
      if (!isMesa || !at) { setView({ ...now, zoom: next }); return; }
      const sx = (insets.left + (dims.w - insets.right)) / 2, sy = (insets.top + (dims.h - insets.bottom)) / 2, scale2 = cam.scale * next / now.zoom;
      const wx = now.cx + (at.x - sx) / cam.scale, wy = now.cy + (at.y - sy) / cam.scale;   // the world point under the cursor stays under it
      setView({ zoom: next, ...clampCentre(fr, wx - (at.x - sx) / scale2, wy - (at.y - sy) / scale2) });
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const { current: now, camera: cam, frame: fr, mesa: isMesa } = wheelState.current, box = svg.getBoundingClientRect();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? box.height : 1;   // a wheel that reports lines or pages
      let dx = event.deltaX * unit, dy = event.deltaY * unit;
      if (event.ctrlKey || event.metaKey) { zoomTo(now.zoom * Math.exp(-Math.max(-60, Math.min(60, dy)) * 0.012), { x: event.clientX - box.left, y: event.clientY - box.top }); return; }
      if (event.shiftKey && dx === 0) { dx = dy; dy = 0; }                                   // a traditional mouse: Shift + wheel pans sideways
      const scale = isMesa ? cam.scale : Math.min(box.width / (fr.width / now.zoom), box.height / (fr.height / now.zoom));
      setView({ ...now, ...clampCentre(fr, now.cx + dx / scale, now.cy + dy / scale) });
    };
    let base = 1;
    const onGestureStart = (event: Event) => { event.preventDefault(); base = wheelState.current.current.zoom; };
    const onGestureChange = (event: Event) => { event.preventDefault(); zoomTo(base * ((event as unknown as { scale: number }).scale || 1), null); };
    svg.addEventListener('wheel', onWheel, { passive: false });
    svg.addEventListener('gesturestart', onGestureStart);
    svg.addEventListener('gesturechange', onGestureChange);
    return () => { svg.removeEventListener('wheel', onWheel); svg.removeEventListener('gesturestart', onGestureStart); svg.removeEventListener('gesturechange', onGestureChange); };
  }, []);

  return (
    <section className="map-stage" aria-label="Mapa do mundo">
      <div className="map-heading">
        <span className="eyebrow">ATLAS DE {label(data.view.era).toUpperCase()}</span>
        <span>{tiles.length} territórios cartografados · projeção estratégica</span>
      </div>

      <svg
        ref={svgRef}
        className={`world-map${art ? ' art-mode' : ''}${mesa ? ' has-board' : ''}${zoomed ? ' zoom-near' : ''}${targetSet.size ? ' has-targets' : ''}`}
        viewBox={camera.viewBox}
        aria-label="Mapa hexagonal interativo"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={handlePointerEnd}
        onClick={e => { if (!moved && onBackground && !(e.target as Element).closest('.hex')) onBackground(); }}
      >
        <defs>
          <pattern id="sea-waves" width="24" height="16" patternUnits="userSpaceOnUse">
            <path d="M0 8 Q6 3 12 8 T24 8" fill="none" stroke="#7fb0c8" strokeOpacity=".5" strokeWidth="1.3" />
          </pattern>
          <pattern id="forest-dots" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="7" r="1.5" fill="currentColor" fillOpacity=".15" />
          </pattern>
          <pattern id="hills-hatching" width="18" height="18" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="18" stroke="currentColor" strokeOpacity=".12" strokeWidth="1" />
          </pattern>
          {art && <g dangerouslySetInnerHTML={svgFragment(terrainDefs())} />}
          <marker id="threat-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10Z" fill="#e59a86" /></marker>
          <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Face-down Regions: ONE board piece each (dark back, light edge, no terrain, no icons). Their hexes only show faint seams when zoomed in. */}
        {mesa && <g className="region-backs" aria-hidden="true">{board!.filter(region => region.closed && region.id !== revealing?.id).map(region => {
          const centres = region.hexIds.map(id => { const [q, r] = id.split(',').map(Number); return position(q ?? 0, r ?? 0); });
          const cx = centres.reduce((n, c) => n + c.x, 0) / (centres.length || 1), cy = centres.reduce((n, c) => n + c.y, 0) / (centres.length || 1);
          const oriented = orientation?.regionId === region.id;
          return <g key={region.id} className={`region-back${region.homeOf ? ' is-homeland' : ''}${targetSet.size && region.hexIds.some(id => targetSet.has(id)) ? ' is-target' : ''}${oriented ? ' is-oriented' : ''}`} data-region={region.id} style={region.homeOf && art?.seats[region.homeOf] ? { ['--seat' as string]: art.seats[region.homeOf]!.color } : undefined}>
            {centres.map((c, k) => <polygon key={k} className="region-back-hex" points={points} transform={`translate(${c.x} ${c.y}) scale(1.08)`} />)}
            {centres.map((c, k) => <polygon key={`i${k}`} className="region-back-inset" points={innerPoints} transform={`translate(${c.x} ${c.y}) scale(.62)`} />)}
            <path className="region-back-edge" d={regionOutline(centres, 56)} />
            {!region.homeOf && <g className="region-back-mark" transform={`translate(${cx} ${cy})`}><circle r="15" /><path d="M0 -11L3 0L0 11L-3 0Z M-11 0L0 -3L11 0L0 3Z" /></g>}
            {oriented && <g className="region-orientation" transform={`translate(${cx} ${cy}) scale(${Math.max(1.4, 0.7 / camera.scale).toFixed(2)})`} dangerouslySetInnerHTML={svgFragment(orientationArt(orientation!.rotation, 40))} />}
          </g>;
        })}</g>}
        {/* The Region being revealed: the same face-down piece, lifted, turned and flipped above the table (no terrain until it lands). */}
        {mesa && revealRegion && revealing && revealing.phase !== 'land' && (() => {
          const centres = revealRegion.hexIds.map(id => { const [q, r] = id.split(',').map(Number); return position(q ?? 0, r ?? 0); });
          const cx = centres.reduce((n, c) => n + c.x, 0) / (centres.length || 1), cy = centres.reduce((n, c) => n + c.y, 0) / (centres.length || 1);
          const norm = ((((revealing.rotation % 6) + 6) % 6) * 60 + 180) % 360 - 180, turn = Math.max(-40, Math.min(40, norm * 0.35));
          return <g className={`region-reveal phase-${revealing.phase}`} aria-hidden="true" style={{ ['--turn' as string]: `${turn}deg` }}>
            <g className="region-reveal-shadow">{centres.map((c, k) => <polygon key={k} points={points} transform={`translate(${c.x + 6} ${c.y + 12}) scale(1.08)`} />)}</g>
            <g className="region-reveal-piece">
              {centres.map((c, k) => <polygon key={k} className="region-back-hex" points={points} transform={`translate(${c.x} ${c.y}) scale(1.08)`} />)}
              {centres.map((c, k) => <polygon key={`i${k}`} className="region-back-inset" points={innerPoints} transform={`translate(${c.x} ${c.y}) scale(.62)`} />)}
              <path className="region-back-edge" d={regionOutline(centres, 56)} />
              {revealing.rotation % 6 !== 0 && <g transform={`translate(${cx} ${cy}) scale(${Math.max(1.4, 0.7 / camera.scale).toFixed(2)})`} dangerouslySetInnerHTML={svgFragment(orientationArt(revealing.rotation, 40))} />}
            </g>
          </g>;
        })()}
        {tiles.map(tile => {
          const p = position(tile.q, tile.r);
          const city = cities.find(c => c.hexId === tile.id);
          const ownerIndex = data.players.findIndex(player => player.id === tile.ownerId);
          const owner = ownerIndex >= 0 ? ownerIndex + 1 : 0;
          const isPlayerOwned = tile.ownerId === data.view.player.id;
          const isForeign = tile.ownerId && !isPlayerOwned;
          const isWorked = data.view.player.civilization.cities.some(c => c.workedHexIds.includes(tile.id));
          const eligible = working ? data.workable.includes(tile.id) : data.claimable.includes(tile.id);
          const isSelected = selected === tile.id;
          const isCapital = city?.id === capitalId;

          const stateClasses = [
            `hex`,
            `terrain-${tile.terrain}`,
            `owner-${owner}`,
            isSelected ? 'selected' : '',
            targetSet.has(tile.id) ? `target target-${targets!.kind}${targets!.tones?.[tile.id] ? ` tone-${targets!.tones[tile.id]}` : ''}` : '',
            eligible ? 'eligible' : '',
            working && !eligible ? 'unavailable' : '',
            isForeign ? 'foreign' : '',
            isWorked ? 'is-worked' : '',
            flipping.has(tile.id) && !revealHexes.has(tile.id) ? 'flip-in' : '',
            revealHexes.has(tile.id) ? (revealing?.phase === 'land' ? 'reveal-land' : 'reveal-hidden') : '',
            arriving.has(tile.id) ? 'arrive' : '',
          ].filter(Boolean).join(' ');

          const cityOwner = city && city.ownerId !== data.view.player.id ? data.players.find(player => player.id === city.ownerId)?.name : undefined;
          // Relief, resource, improvement and owner in text ("Colinas · Mina · Leontia"): the art never carries information alone. The aria label keeps "name … id[, trabalhado]".
          const ownerName = tile.ownerId ? data.players.find(pl => pl.id === tile.ownerId)?.name : undefined;
          const relief = art && isTerrainKey(tile.terrain);
          const summary = relief ? terrainSummary({ terrain: tile.terrain, features: tile.features, improvement: tile.improvement, owner: ownerName, moveCosts: movementCosts }) : null;
          const ariaTitle = summary ? `${city ? `${city.name} · ` : ''}${summary.short} ${tile.id}${isWorked ? ', trabalhado' : ''}` : `${city?.name ?? label(tile.terrain)}${cityOwner ? ` (${cityOwner})` : ''} ${tile.id}${isWorked ? ', trabalhado' : ''}`;
          const reliefFeatures = relief ? tile.features.filter(isFeatureKey) : [];

          return (
            <g
              key={tile.id}
              data-hex={tile.id}
              transform={`translate(${p.x} ${p.y})`}
              style={{ ['--hx' as string]: `${p.x}px`, ['--hy' as string]: `${p.y}px` }}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={ariaTitle}
              className={stateClasses}
              onClick={() => {
                if (!moved) onSelect(tile.id);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(tile.id);
                }
              }}
            >
              <title>
                {summary ? `${summary.lines.join('\n')}\n${tile.id} · Controle: ${tile.controllerCityId ?? 'nenhum'}` : tileSummary({ terrain: tile.terrain, id: tile.id, ownerName, controllerCityId: tile.controllerCityId ?? null }, label(tile.terrain))}
                {eligible ? (working ? ' · Elegível para trabalho' : ' · Reivindicável') : ''}
                {isWorked ? ' · Trabalhado' : ''}
              </title>

              {/* Base terrain polygon */}
              <polygon className="hex-base" points={points} />

              {/* Relief, resource and improvement as art (symbols built once; each hex only references them). Under a city only the relief stays. */}
              {relief && <use href={`#${terrainId(tile.terrain as Parameters<typeof terrainId>[0], terrainVariant(tile.q, tile.r))}`} className="hex-relief" pointerEvents="none" />}
              {relief && !city && (tile.improvement && isImprovementKey(tile.improvement)
                ? <use href={`#${improvementId(tile.improvement)}`} className="hex-improvement" data-improvement={tile.improvement} pointerEvents="none" />
                : reliefFeatures.map(feature => <use key={feature} href={`#${featureId(feature)}`} className="hex-resource" data-feature={feature} pointerEvents="none" />))}

              {/* Terrain texture/hatching layer */}
              <polygon className="hex-texture" points={innerPoints} />

              {/* Subtle ownership wash/fill */}
              {owner > 0 && <polygon className="hex-owner-tint" points={innerPoints} />}
              {art && tile.ownerId && art.seats[tile.ownerId] && <polygon className="owner-contour" points={points} transform="scale(.92)" style={{ stroke: art.seats[tile.ownerId]!.color }} pointerEvents="none" />}

              {art && ways.get(tile.id) && <g className="art-ways" aria-hidden="true">
                {roadCanStand(tile.terrain) && (ways.get(tile.id)!.road.length > 0 || art.roads?.includes(tile.id)) && <g className="art-road-net" data-links={ways.get(tile.id)!.road.length} dangerouslySetInnerHTML={svgFragment(roadTileArt({ mids: ways.get(tile.id)!.road, coast: tile.terrain === 'COAST', river: tile.features.includes('RIVER'), city: Boolean(city) }, 52))} />}
                {ways.get(tile.id)!.route.map((part, k) => <line key={`t${k}`} x1="0" y1="0" x2={part.d[0]} y2={part.d[1]} className={`art-route${part.suspended ? ' is-suspended' : ''}`} />)}
              </g>}
              {/* Territorial border outline */}
              <polygon className="hex-border" points={points} />

              {/* Content: City Monument or Rural Terrain */}
              {city && art ? (() => {
                const mark = art.cityMarks.find(m => m.cityId === city.id), seat = art.seats[city.ownerId];
                const level = mark?.level ?? 1, color = seat?.color ?? '#9aa4a2', harbor = mark?.harbor ? harborAngle(tile.id, mark.harbor) : null;
                return <g className="city-anchor art-city" data-level={level} data-fortification={mark?.fortification.level ?? 'NONE'} data-culture={mark?.civilization ?? 'neutral'} data-work={mark?.work?.workId}>
                  <g dangerouslySetInnerHTML={svgFragment(cityPieceArt({ level, color, seed: seedOf(city.id), civilization: mark?.civilization ?? null, lod, fortification: mark?.fortification ?? null, harbor, work: mark?.work ?? null, mark: seat?.mark ?? null, seat: seat?.seat ?? null }, 50))} />
                  {/* The seal reads N·Capacidade (canon §4): level built and the power of one activation. */}
                  <g transform="translate(-21 -23)"><rect x={mark?.capacity ? -15 : -9} y="-9" width={mark?.capacity ? 30 : 18} height="18" rx="9" className="art-level-seal" style={{ stroke: color }} /><text className="art-level" y="4">{mark?.capacity ? `${level}·${mark.capacity}` : level}</text></g>
                  {/* Ânimo of the viewer's own city (the projection sends it only for them): ring + expression + number, 4 states. */}
                  {mark?.mood !== undefined && <g className="art-mood" transform="translate(23 -23)" role="img" aria-label={moodLabel(mark.mood)} data-mood={mark.mood}><title>{moodLabel(mark.mood)}</title><g transform="scale(.56)" dangerouslySetInnerHTML={svgFragment(moodSealArt(mark.mood))} /></g>}
                </g>;
              })() : city ? (
                <g className={`city-anchor ${isCapital ? 'is-capital' : ''}`}>
                  {/* City bastion/monument foundation */}
                  <rect x="-24" y="-22" width="48" height="42" rx="4" className="city-plate" />
                  
                  {/* City architectural emblem */}
                  {isCapital ? (
                    <g className="capital-crest">
                      <path
                        d="M-14 -4 L-14 -16 L-7 -10 L0 -19 L7 -10 L14 -16 L14 -4 Z M-16 -4 L16 -4 L16 -1 L-16 -1 Z"
                        className="citadel-crest capital-citadel"
                      />
                      <circle cx="0" cy="-21" r="2.5" className="capital-crown-gem" />
                    </g>
                  ) : (
                    <path
                      d="M-12 -3 L-12 -14 L-6 -14 L-6 -9 L6 -9 L6 -14 L12 -14 L12 -3 Z M-14 -3 L14 -3 L14 0 L-14 0 Z"
                      className="citadel-crest municipal-citadel"
                    />
                  )}

                  {/* City Name Banner */}
                  {/* Long names are condensed into the banner instead of spilling over neighbouring hexes. */}
                  {(() => {
                    const name = `${isCapital ? '★ ' : ''}${city.name}`, natural = name.length * 6.8, fitted = Math.min(natural, 92);
                    return <g transform="translate(0, 10)">
                      <rect x={-Math.max(30, fitted / 2 + 6)} y="-8" width={Math.max(60, fitted + 12)} height="15" rx="3" className="city-banner-bg" />
                      <text className="city-name" y="3" {...(natural > fitted ? { textLength: fitted, lengthAdjust: 'spacingAndGlyphs' } : {})}>{name}</text>
                    </g>;
                  })()}

                  {/* Population & Development Pill */}
                  <g transform="translate(0, 24)">
                    <rect x="-26" y="-6" width="52" height="12" rx="6" className="city-pill-bg" />
                    <text className="city-stat" y="3">
                      {city.population} hab · {roman[city.development]}
                    </text>
                  </g>
                </g>
              ) : (
                <g className="rural-tile">
                  {!art && !(mesa && tile.terrain === 'UNKNOWN') && <text className="terrain-glyph" y="4">
                    {terrainGlyphs[tile.terrain]}
                  </text>}
                  {!art && tile.features.length > 0 && (
                    <text className="features" y="22">
                      {tile.features.map(f => featureGlyphs[f] ?? '').join(' ')}
                    </text>
                  )}
                </g>
              )}

              {/* Improvement Badge (Top Left) */}
              {tile.improvement && !relief && (
                <g transform="translate(-25, -23)" className="improvement-badge">
                  <title>{label(tile.improvement)}</title>
                  <circle cx="0" cy="0" r="9" className="badge-bg" />
                  <text className="improvement-symbol" x="0" y="3.5">
                    {improvementIcons[tile.improvement] ?? '▤'}
                  </text>
                </g>
              )}

              {/* Worked Territory Seal (Top Right) */}
              {(working ? worked.includes(tile.id) : isWorked) && (
                <g transform="translate(25, -23)" className="worked-seal">
                  <title>Território trabalhado</title>
                  <circle cx="0" cy="0" r="8.5" className="worked-bg" />
                  <circle cx="0" cy="0" r="5" className="worked-inner" />
                </g>
              )}

              {targetSet.has(tile.id) && <polygon className="target-pulse" points={innerPoints} />}
              {targetSet.has(tile.id) && targets?.labels?.[tile.id] !== undefined && <text className={`target-cost tone-${targets.tones?.[tile.id] ?? 'base'}`} y="33" textAnchor="middle" pointerEvents="none">{targets.labels[tile.id]}</text>}
              {/* Claimable frontier indicator */}
              {eligible && !working && (
                <polygon className="frontier-pulse" points={innerPoints} />
              )}
              {/* Neutral powers: an independent people (house) or a raid band (crossed blades, with its strength). */}
              {(() => {
                const people = peoples.find(p => p.hexId === tile.id && p.integratedBy === null), threat = threats.find(r => r.hexId === tile.id), hasPieces = units.some(u => u.hexId === tile.id);
                return <>
                  {people && <g transform={city && art ? 'translate(0 -40)' : 'translate(0 -28)'} className={`alpha-people attitude-${people.attitude}`}><rect x="-13" y="-10" width="26" height="20" rx="4" className="people-badge" /><path d="M-7 5V-1L0 -6L7 -1V5Z M-2 5V1H2V5" className="people-glyph" /><title>Povo independente ({label(people.type)} · {label(people.attitude)})</title></g>}
                  {threat && art && threat.composition?.length ? (() => {
                    // Mesa Viva D3: the real classes of the composition on the iron base (never a generic badge); fog is decided by the projection.
                    const compact = Boolean(city) || hasPieces, retreat = threat.intent?.state === 'WITHDRAWING';
                    const parts = threat.composition!.map(entry => `${label(entry.kind)}${entry.count > 1 ? ` ×${entry.count}` : ''}`).join(', ');
                    const mood = retreat ? 'em recuo ao Acampamento' : threat.status === 'CAMPED' ? (threat.fresh ? 'recém-surgido, ainda não parte' : threat.reorganizing ? 'reorganizando, ainda não parte' : 'à espera') : threat.intent?.targetKnown ? `rumo a ${threat.intent.targetKind === 'CITY' ? 'cidade' : threat.intent.targetKind === 'PORT' ? 'porto' : 'rota'} ${threat.intent.targetId}, a ${threat.intent.distance} hex(es)` : 'em marcha';
                    return <g transform={`translate(0 ${city ? -40 : hasPieces ? -30 : 0})`} className={`alpha-threat kind-${threat.kind} status-${threat.status}${threat.fresh ? ' is-fresh' : ''}${retreat ? ' is-retreat' : ''}`} data-level={threat.level} data-threat={threat.id}>
                      <title>{threatName(threat.kind, threat.status)} {THREAT_ROMAN[threat.level - 1]}: {parts} · {mood}</title>
                      <g dangerouslySetInnerHTML={svgFragment(threatMarkArt({ kind: threat.kind, status: threat.status, level: threat.level, composition: threat.composition!, state: threat.intent?.state, fresh: threat.fresh, reorganizing: threat.reorganizing, compact }))} />
                    </g>;
                  })() : threat && <g transform={city && art ? 'translate(0 -40)' : 'translate(0 -28)'} className={`alpha-raid alpha-threat kind-${threat.kind} status-${threat.status}${threat.fresh ? ' is-fresh' : ''}`} data-level={threat.level}><rect x="-19" y="-10" width="38" height="20" rx="4" className="raid-badge" />{threat.kind === 'PIRATE' ? <path d="M-14 6L-3 6L-9 -6Z M-9 -6V7" className="raid-glyph" /> : threat.status === 'CAMPED' ? <path d="M-14 6L-8 -6L-2 6Z M-8 -6V6" className="raid-glyph" /> : <path d="M-13 6L-3 -5M-13 -5L-3 6" className="raid-glyph" />}<text x="9" y="4" className="raid-count" textAnchor="middle">{['I', 'II', 'III'][threat.level - 1]}</text><title>{threat.kind === 'PIRATE' ? (threat.status === 'CAMPED' ? 'Ancoradouro pirata' : 'Piratas') : (threat.status === 'CAMPED' ? 'Acampamento de Saqueadores' : 'Saqueadores em marcha')} · Ameaça {['I', 'II', 'III'][threat.level - 1]}</title></g>}
                </>;
              })()}
              {/* One badge per owner: the owner's colour, a soldier or a flag for civil pieces, and the count. Foreign pieces are outlined. */}
              {art && (() => {
                const here = units.filter(u => u.hexId === tile.id);
                if (!here.length) return null;
                const owners = [...new Set(here.map(u => u.ownerId))].sort((a, b) => Number(b === data.view.player.id) - Number(a === data.view.player.id));
                // On a city the pieces stand at its lower corners, so the plan stays readable; in the field they take the centre.
                return owners.slice(0, 2).map((ownerId, slot) => {
                  const all = here.filter(u => u.ownerId === ownerId), color = art.seats[ownerId]?.color ?? '#9aa4a2', own = ownerId === data.view.player.id;
                  // Cargo rides inside its fleet: the fleet is drawn, the cargo is a count on it.
                  const cargo = all.filter(u => u.carrierId), mine = all.filter(u => !u.carrierId);
                  if (!mine.length) return null;
                  // Mesa Viva: one miniature per CLASS of the stack (ships first, then by number), up to 3 and a "+N" for the rest; ids are stable (data-unit-ids).
                  const byKind = [...mine.reduce((m, u) => m.set(u.kind, [...(m.get(u.kind) ?? []), u.id]), new Map<string, string[]>())].map(([kind, ids]) => ({ kind, ids })).sort((a, b) => rankKind(b.kind, b.ids.length) - rankKind(a.kind, a.ids.length));
                  const crowded = owners.length > 1, maxFigs = city && crowded ? 2 : crowded ? 2 : 3, shown = byKind.slice(0, maxFigs), more = byKind.slice(maxFigs).reduce((n, c) => n + c.ids.length, 0);
                  const px = city ? (crowded ? 20 : 24) : crowded ? 22 : 30, gap = px * 0.8, half = ((shown.length - 1) / 2) * gap + px / 2;
                  // Inside the hex: the lower corners of a city hex are narrow (apothem 45, circumradius 52), so pieces sit higher and smaller there.
                  const x = city ? (slot === 0 ? -23 : 23) : crowded ? (slot === 0 ? -21 : 19) : -2, y = city ? 17 : 0;
                  const kinds = byKind.map(c => `${label(c.kind)} ×${c.ids.length}`).join(', ') + (cargo.length ? ` · carga ${cargo.length}` : '');
                  return <g key={ownerId} transform={`translate(${x} ${y})`} className={`art-stack ${own ? 'own' : 'foreign'}`} data-lead={shown[0]!.kind} data-pieces={mine.length} style={own && onSelectPieces ? { cursor: 'pointer' } : undefined} onClick={own && onSelectPieces ? (e => { if (!moved) { e.stopPropagation(); onSelectPieces(tile.id); } }) : undefined}>
                    <title>{own ? 'Suas peças' : `Peças de ${data.players.find(p => p.id === ownerId)?.name ?? 'outra civilização'}`}: {kinds}</title>
                    {shown.map((entry, i) => <g key={entry.kind} className="art-piece" data-kind={entry.kind} data-unit-ids={entry.ids.join(',')} transform={`translate(${Math.round((i - (shown.length - 1) / 2) * gap * 10) / 10} 0)`} dangerouslySetInnerHTML={svgFragment(pieceArt(entry.kind, color, px, entry.ids.length, art.seats[ownerId]?.signature === entry.kind, art.seats[ownerId]?.seat ?? null))} />)}
                    {more > 0 && <g className="art-more" transform={`translate(${half + 8} ${px * 0.3})`}><rect x="-9" y="-7" width="18" height="14" rx="7" /><text y="3.4">+{more}</text></g>}
                    {cargo.length > 0 && <g transform="translate(0 -24)" className="art-cargo"><rect x="-22" y="-8" width="44" height="15" rx="7" /><text y="3">carga {cargo.length}</text></g>}
                  </g>;
                });
              })()}
              {!art && (() => {
                const here = units.filter(u => u.hexId === tile.id);
                if (!here.length) return null;
                const owners = [...new Set(here.map(u => u.ownerId))].sort((a, b) => Number(b === data.view.player.id) - Number(a === data.view.player.id));
                return <g transform="translate(0 40)">{owners.slice(0, 2).map((ownerId, slot) => {
                  const mine = here.filter(u => u.ownerId === ownerId), index = data.players.findIndex(p => p.id === ownerId), own = ownerId === data.view.player.id;
                  const military = mine.some(u => !['PIONEER', 'PIONEER', 'ENVOY'].includes(u.kind));
                  const kinds = [...mine.reduce((m, u) => m.set(u.kind, (m.get(u.kind) ?? 0) + 1), new Map<string, number>())].map(([k, n]) => `${label(k)} ×${n}`).join(', ');
                  const x = owners.length > 1 ? (slot === 0 ? -26 : 26) : 0;
                  return <g key={ownerId} transform={`translate(${x} 0)`} className={`alpha-unit-stack owner-${index + 1} ${own ? 'own' : 'foreign'}`}>
                    <rect x="-24" y="-9" width="48" height="18" rx="4" className="unit-badge" />
                    {military ? <path d="M-17 5L-9 -5M-9 -5L-7 -7M-15 -1L-11 3" className="unit-glyph" /> : <path d="M-16 6V-7M-16 -7H-8L-10 -4L-8 -1H-16" className="unit-glyph" />}
                    <text x="7" y="4" className="unit-count" textAnchor="middle">{mine.length}</text>
                    <title>{own ? 'Suas peças' : `Peças de ${data.players[index]?.name ?? 'outra civilização'}`}: {kinds}</title>
                  </g>;
                })}</g>;
              })()}
            </g>
          );
        })}
        {/* Porto: the only urban piece that leaves the city hex — quay on the shared edge, pier into the navigable water. */}
        {art && <g className="art-harbors" aria-hidden="true">{art.cityMarks.filter(m => m.harbor && tiles.some(t => t.id === m.hexId)).map(m => {
          const [q, r] = m.hexId.split(',').map(Number), p = position(q ?? 0, r ?? 0);
          return <g key={m.cityId} transform={`translate(${p.x} ${p.y})`} dangerouslySetInnerHTML={svgFragment(harborArt(m.civilization ?? null, harborAngle(m.hexId, m.harbor!), 50, lod))} />;
        })}</g>}
        {/* Descobertas: a small permanent marker near the Region's centre (Vestígio, Jazida, Passagem, Ancoradouro, Acampamento). */}
        {art?.discoveries && <g className="art-discoveries" aria-hidden="true">{art.discoveries.filter(d => DISCOVERY_MARKERS.has(d.kind)).map(d => {
          const here = d.hexIds.filter(id => tiles.some(t => t.id === id && t.terrain !== 'UNKNOWN'));
          if (!here.length) return null;
          const at = here.map(id => { const [q, r] = id.split(',').map(Number); return { id, ...position(q ?? 0, r ?? 0) }; });
          const cx = at.reduce((n, c) => n + c.x, 0) / at.length, cy = at.reduce((n, c) => n + c.y, 0) / at.length;
          const free = at.filter(c => !cities.some(city => city.hexId === c.id)), spot = (free.length ? free : at).sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy))[0]!;
          return <g key={d.regionId} className={`discovery-marker kind-${d.kind}${d.resolved === false ? ' is-open' : ''}`} transform={`translate(${spot.x + 17} ${spot.y - 19})`} dangerouslySetInnerHTML={svgFragment(discoveryArt(d.kind, zoomed ? 14 : 12))} />;
        })}</g>}
        {art && <g className="art-borders" aria-hidden="true">{(() => {
          // Territorial edges: seat color with the owner's civilization pattern, drawn once per edge between different owners.
          const byCoord = new Map(tiles.map(t => [`${t.q},${t.r}`, t]));
          return tiles.flatMap(tile => {
            if (!tile.ownerId) return [];
            const seat = art.seats[tile.ownerId], p = position(tile.q, tile.r);
            if (!seat) return [];
            return NEIGHBOURS.flatMap(([dq, dr]) => {
              const n = byCoord.get(`${tile.q + dq},${tile.r + dr}`);
              if (n?.ownerId === tile.ownerId) return [];
              const np = position(tile.q + dq, tile.r + dr), [x1, y1, x2, y2] = sharedEdge(p.x, p.y, np.x, np.y, 52);
              const pattern = seat.mark?.border ?? 'SOLID';
              return [<g key={`${tile.id}>${dq},${dr}`} dangerouslySetInnerHTML={svgFragment(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0b1114" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/>` + borderStrokes(pattern, seat.color, 3).map(st => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${st}/>`).join(''))} />];
            });
          });
        })()}</g>}
        {art?.marks && <g className="art-marks" aria-hidden="true">{art.marks.map((mark, i) => {
          const tile = tiles.find(t => t.id === mark.hexId);
          if (!tile) return null;
          const p = position(tile.q, tile.r), same = art.marks!.slice(0, i).filter(m => m.hexId === mark.hexId).length, w = Math.max(44, mark.label.length * 6.4 + 14);
          return <g key={`${mark.hexId}-${i}`} transform={`translate(${p.x} ${p.y})${mark.tone === 'plan' ? ` scale(${Math.max(1, 0.55 / camera.scale).toFixed(2)})` : ''}`} className={`art-mark tone-${mark.tone}`}>
            {same === 0 && <circle r="47" className="art-mark-halo" />}
            <g transform={`translate(0 ${-44 - same * 17})`}><rect x={-w / 2} y="-8" width={w} height="16" rx="8" className="art-mark-tag" /><text y="4" className="art-mark-text">{mark.label}</text></g>
          </g>;
        })}</g>}
        {art && <g className="art-labels" aria-hidden="true">{cities.flatMap(city => {
          // City names sit above every tile, so the next row never covers them.
          const tile = tiles.find(t => t.id === city.hexId);
          if (!tile) return [];
          const p = position(tile.q, tile.r), name = `${city.id === capitalId ? '★ ' : ''}${city.name}`, natural = name.length * 6.2, fitted = Math.min(natural, 88);
          return [<g key={city.id} transform={`translate(${p.x} ${p.y + 50})`} className="art-label">
            <rect x={-Math.max(26, fitted / 2 + 5)} y="-7" width={Math.max(52, fitted + 10)} height="13" rx="3" className="city-banner-bg" />
            <text className="city-name art-city-name" y="3" {...(natural > fitted ? { textLength: fitted, lengthAdjust: 'spacingAndGlyphs' } : {})}>{name}</text>
          </g>];
        })}</g>}
        {/* Pátrias: a banner on each face-down homeland says who sits where, nothing about what is inside. */}
        {mesa && <g className="home-banners">{board!.filter(region => region.closed && region.homeOf && region.homeOf !== data.view.player.id).map(region => {
          const seat = art?.seats[region.homeOf!], who = data.players.find(player => player.id === region.homeOf);
          const spots = region.hexIds.map(id => { const [q, r] = id.split(',').map(Number); return position(q ?? 0, r ?? 0); });
          const cx = spots.reduce((n, c) => n + c.x, 0) / spots.length, cy = spots.reduce((n, c) => n + c.y, 0) / spots.length;
          return <g key={region.id} className="home-banner" transform={`translate(${cx} ${cy}) scale(${Math.max(1, 0.5 / camera.scale).toFixed(2)})`}>
            <g dangerouslySetInnerHTML={svgFragment(seat?.mark ? `<g transform="translate(0 -26)">${bannerArt(seat.mark, seat.color, 76)}</g>` : `<rect x="-14" y="-52" width="28" height="44" fill="${seat?.color ?? '#9aa4a2'}"/>`)} />
            <text className="home-banner-name" y="34" textAnchor="middle">{who?.name ?? 'Pátria'}</text>
            <text className="home-banner-sub" y="52" textAnchor="middle">Região Pátria · conteúdo oculto</text>
          </g>;
        })}</g>}
        {threats.some(t => t.intent?.pathHexIds?.length || t.intent?.nextHexId || t.intent?.targetHexId) && <g className="threat-heading" aria-hidden="true">{threats.flatMap(threat => {
          // Authoritative intention from the engine, cut at the fog by the projection: the planned path hex by hex (dashed polyline with an arrow); without it, the old line to the target or the next step. Nothing is estimated here.
          const exact = threat.intent?.targetKnown === true;
          const what = threat.intent?.targetKind === 'CITY' ? 'cidade' : threat.intent?.targetKind === 'PORT' ? 'porto' : 'rota';
          const note = exact ? `Alvo de ${threat.id}: ${what} ${threat.intent!.targetId}, a ${threat.intent!.distance} hex(es).` : `Caminho de ${threat.id}; o alvo está além da névoa.`;
          const path = threat.intent?.pathHexIds ?? [];
          if (path.length) {
            const points = [threat.hexId, ...path].map(id => { const c = centreOf(id); return `${Math.round(c.x * 10) / 10},${Math.round(c.y * 10) / 10}`; }).join(' ');
            const end = centreOf(path[path.length - 1]!);
            return [<g key={threat.id} className={`alpha-threat-intent has-path${exact ? ' is-target' : ' is-step'}`}><polyline points={points} className="alpha-threat-path" markerEnd="url(#threat-arrow)" />{exact && <circle cx={end.x} cy={end.y} r={15} className="alpha-threat-aim" />}<title>{note}</title></g>];
          }
          const aim = exact && threat.intent!.targetHexId ? threat.intent!.targetHexId : threat.intent?.nextHexId;
          if (!aim || aim === threat.hexId) return [];
          const from = centreOf(threat.hexId), to = centreOf(aim);
          return [<g key={threat.id} className={`alpha-threat-intent${exact ? ' is-target' : ' is-step'}`}><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="alpha-threat-heading" /><circle cx={to.x} cy={to.y} r={exact ? 15 : 6} className="alpha-threat-aim" /><title>{exact ? note : `Próximo passo de ${threat.id}; o alvo está além da névoa.`}</title></g>];
        })}</g>}
        {/* Perigo e perdas (D2): a red halo for one round on the hex where a LOSSES event happened, with the lost pieces as dashed ghosts. */}
        {resolution.some(event => event.type === 'LOSSES') && <g className="art-losses" aria-hidden="true">{resolution.filter(event => event.type === 'LOSSES').map(event => {
          const hexId = event.hexId ?? cities.find(c => c.id === event.cityId)?.hexId;
          if (!hexId || !tiles.some(t => t.id === hexId)) return null;
          const at = centreOf(hexId), gone = (event.unitIds ?? []).filter(id => !units.some(u => u.id === id)).map(id => knownPieces.current.get(id)).filter((v): v is { kind: string; ownerId: string } => Boolean(v)).slice(0, 3);
          return <g key={event.id} transform={`translate(${at.x} ${at.y})`} className="art-loss">
            <title>{event.message}</title>
            <polygon points={points} className="art-loss-halo" />
            {gone.map((piece, i) => <g key={i} transform={`translate(${Math.round((i - (gone.length - 1) / 2) * 22)} 6)`} opacity=".5"><g dangerouslySetInnerHTML={svgFragment(pieceArt(piece.kind, art?.seats[piece.ownerId]?.color ?? '#9aa4a2', 24) + '<circle r="15" fill="none" stroke="#e0583f" stroke-dasharray="3 3" stroke-width="1.4"/>')} /></g>)}
          </g>;
        })}</g>}
        {/* A step of a Bando or camp (MOVEMENT with fromHexId): origin ghost and an arrow to where it arrived, for about a second. */}
        {trails.length > 0 && <g className="art-trails" aria-hidden="true">{trails.map(trail => {
          const a = centreOf(trail.from), b = centreOf(trail.to), len = Math.hypot(b.x - a.x, b.y - a.y) || 1, ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
          return <g key={trail.id} className="art-trail">
            {trail.kind && <g transform={`translate(${a.x} ${a.y})`} opacity=".5" dangerouslySetInnerHTML={svgFragment(threatFigureArt(trail.kind, 22, 0, true))} />}
            <line x1={a.x + ux * 20} y1={a.y + uy * 20} x2={b.x - ux * 20} y2={b.y - uy * 20} className="art-trail-line" markerEnd="url(#threat-arrow)" />
          </g>;
        })}</g>}
        {/* Mover coordenado (Cena B): each leg of the draft Order, in its own colour, with an arrow, ghost pieces and a tag (n · custo/orçamento) at the destination. */}
        {draftLegs && draftLegs.length > 0 && <g className="art-draft" aria-hidden="true" pointerEvents="none">{draftLegs.map(leg => {
          const chain = [leg.origin, ...leg.path], pts = chain.map(id => { const c = centreOf(id); return `${Math.round(c.x * 10) / 10},${Math.round(c.y * 10) / 10}`; }).join(' ');
          const end = centreOf(leg.path.at(-1) ?? leg.origin), start = centreOf(leg.origin), seat = art?.seats[data.view.player.id]?.color ?? '#60a3e9', ghosts = leg.kinds.slice(0, 3);
          const sameOrigin = draftLegs.filter(other => other.origin === leg.origin && other.index < leg.index).length, sameDest = draftLegs.filter(other => other.index < leg.index && (other.path.at(-1) ?? other.origin) === (leg.path.at(-1) ?? leg.origin)).length;
          const unit = Math.max(1, 0.55 / camera.scale);
          return <g key={leg.index} className="art-draft-leg" data-leg={leg.index} style={{ ['--leg' as string]: leg.color }}>
            <defs><marker id={`draft-arrow-${leg.index}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10Z" fill={leg.color} /></marker></defs>
            <polyline points={pts} className="art-draft-under" /><polyline points={pts} className="art-draft-line" stroke={leg.color} markerEnd={`url(#draft-arrow-${leg.index})`} />
            {chain.slice(1, -1).map(id => { const c = centreOf(id); return <circle key={id} cx={c.x} cy={c.y} r={3.2} fill={leg.color} className="art-draft-dot" />; })}
            <g transform={`translate(${end.x} ${end.y + 4})`}>{ghosts.map((kind, i) => <g key={i} transform={`translate(${Math.round((i - (ghosts.length - 1) / 2) * 20)} 0)`} opacity=".62" dangerouslySetInnerHTML={svgFragment(pieceArt(kind, seat, 24) + `<circle r="15" fill="none" stroke="${leg.color}" stroke-dasharray="3 3" stroke-width="1.6"/>`)} />)}</g>
            <g transform={`translate(${end.x + 8 + sameDest * 6} ${end.y - 40 - sameDest * 14}) scale(${unit.toFixed(2)})`} className="art-draft-tag"><rect x="-28" y="-8.5" width="56" height="17" rx="8.5" stroke={leg.color} /><text y="4" textAnchor="middle">{leg.tag}</text></g>
            <g transform={`translate(${start.x - 28 + sameOrigin * 17} ${start.y - 26}) scale(${unit.toFixed(2)})`} className="art-draft-ring"><circle r="8.5" fill={leg.color} /><text y="3.7" textAnchor="middle">{leg.index + 1}</text></g>
          </g>;
        })}</g>}
        {/* Exploring a closed Region may meet a Perigo (frontierRisk POSSIBLE): the amber warning of the concept, never whether one exists. */}
        {dangerHexes.length > 0 && <g className="art-danger" aria-label="Perigo possível" >{dangerHexes.map(id => {
          const at = centreOf(id);
          return <g key={id} transform={`translate(${at.x} ${at.y})`} className="art-danger-mark" pointerEvents="none"><title>Região fechada: Perigo possível ao explorar</title><g dangerouslySetInnerHTML={svgFragment(dangerMarkArt(14))} /></g>;
        })}</g>}
      </svg>

      {/* Seat plates on the table edge, on the side of the board where each Pátria sits. */}
      {mesa && <ul className="seat-plates" aria-label="Quem está na mesa">{(() => {
        const homes = board!.filter(region => region.homeOf);
        const centre = { x: frame.cx, y: frame.cy };
        return homes.map(region => {
          const spots = region.hexIds.map(id => { const [q, r] = id.split(',').map(Number); return position(q ?? 0, r ?? 0); });
          const at = { x: spots.reduce((n, c) => n + c.x, 0) / spots.length, y: spots.reduce((n, c) => n + c.y, 0) / spots.length };
          const dx = at.x - centre.x, dy = at.y - centre.y;
          // Project the direction onto the safe rectangle: the plate sits where that ray leaves it.
          const halfW = (size.w - safe.left - safe.right) / 2, halfH = (size.h - safe.top - safe.bottom) / 2, k = Math.max(Math.abs(dx) / halfW, Math.abs(dy) / halfH) || 1;
          const rawLeft = safe.left + halfW + (dx / k) * 1.0, rawTop = safe.top + halfH + (dy / k) * 1.0;
          // A plate is ~180 px wide and centred on its point: keep it fully on the table even for a Pátria on the far left/right.
          const left = Math.min(Math.max(rawLeft, 100), Math.max(100, size.w - 100)), top = Math.min(Math.max(rawTop, 18), Math.max(18, size.h - 18));
          const who = data.players.find(player => player.id === region.homeOf), seat = art?.seats[region.homeOf!];
          const mine = region.homeOf === data.view.player.id;
          const bubble = plateBubble[region.homeOf!];
          return <li key={region.id} className={`seat-plate${mine ? ' is-mine' : ''}${plateTone[region.homeOf!] ? ` is-${plateTone[region.homeOf!]}` : ''}`} style={{ left, top, ['--seat' as string]: seat?.color ?? '#9aa4a2' }}
            {...(mine && onSelfPlate ? { role: 'button', tabIndex: 0, 'aria-label': 'Reagir', title: 'Reagir aos outros jogadores', onClick: (e: ReactMouseEvent<HTMLElement>) => onSelfPlate(e.currentTarget), onKeyDown: (e: ReactKeyEvent<HTMLElement>) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelfPlate(e.currentTarget); } } } : {})}>
            <i aria-hidden="true" className="seat-plate-seal" dangerouslySetInnerHTML={svgFragment(seatSealSvg(seat?.seat ?? Math.max(0, data.players.findIndex(player => player.id === region.homeOf)), seat?.color ?? '#9aa4a2', 18))} /><b>{who?.name ?? 'Pátria'}</b><small>{seatStatus[region.homeOf!] ?? ''}</small>
            {bubble && <span key={bubble.key} className="seat-bubble" role="status" aria-label={bubble.label}><span aria-hidden="true">{bubble.glyph}</span><em>{bubble.label}</em></span>}
          </li>;
        });
      })()}</ul>}

      <div className="map-tools">
        <button aria-label="Diminuir zoom" onClick={() => setView({ ...current, zoom: clampZoom(current.zoom / 1.25) })}>−</button>
        {mesa
          ? <>
            <button title="Ver a mesa inteira" aria-pressed={view === null} onClick={() => setView(null)}>Mesa</button>
            <button title="Voltar para a minha área ou seleção" onClick={focusHere}>Focar</button>
          </>
          : <button title="Enquadrar todo o território conhecido" onClick={() => setView(null)}>Centralizar</button>}
        <button aria-label="Aumentar zoom" onClick={() => setView({ ...current, zoom: clampZoom(current.zoom * 1.25) })}>+</button>
      </div>

      <div className="map-legend">
        <span className="legend-hint">Arraste para mover o atlas · Clique para inspecionar</span>
        <div className="legend-items">
          <span><i className="legend-swatch border-claimable" /> Reivindicável</span>
          <span><i className="legend-swatch seal-worked" /> Trabalhado</span>
          <span><i className="legend-swatch icon-improved" /> Melhoria</span>
          <span><i className="legend-swatch mark-capital" /> ★ Capital</span>
        </div>
        {working && <strong className="working-prompt">Modo Atribuição: Selecione os territórios para os produtores trabalharem</strong>}
      </div>
    </section>
  );
});

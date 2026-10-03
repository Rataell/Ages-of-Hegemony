'use client';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LocalView } from '@aoh/server/local-play';
import type { AlphaUnit, HexTile } from '@aoh/game-domain';
import { label, roman } from './presentation';
import { clampCentre, clampZoom, mapFrame, position, tileSummary, viewBoxOf } from './map-frame';

type Props = {
  data: Pick<LocalView,'players'|'claimable'|'workable'> & {view:Pick<LocalView['view'],'player'|'visibleCities'> & {era:string;visibleTerritory:HexTile[]}};
  units?: readonly AlphaUnit[];
  /** Independent peoples and raid bands the player knows of (Alpha). */
  peoples?: readonly { hexId: string; type: string; attitude: string; integratedBy: string | null }[];
  raids?: readonly { hexId: string; strength: number }[];
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
  COAST: '≈',
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
  raids = [],
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  // null = fitted to the projected tiles; otherwise an explicit centre and zoom (1 shows the whole fitted frame).
  const [view, setView] = useState<{ cx: number; cy: number; zoom: number } | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [moved, setMoved] = useState(false);

  const tiles = data.view.visibleTerritory;
  const frame = useMemo(() => mapFrame(tiles), [tiles]);
  const current = view ?? { cx: frame.cx, cy: frame.cy, zoom: 1 };
  const focusTile = tiles.find(t => t.id === focus);
  // Once the player has zoomed in, selecting a piece or city brings it to the centre; a fitted atlas already shows everything.
  useEffect(() => {
    if (!focusTile) return;
    const at = position(focusTile.q, focusTile.r);
    setView(old => (old ? { ...old, ...clampCentre(frame, at.x, at.y) } : old));
  }, [focus]);

  const cities = [...data.view.player.civilization.cities, ...data.view.visibleCities];
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
      const unitsPerPixel = 1 / Math.min(w / (frame.width / current.zoom), h / (frame.height / current.zoom));
      setView({ ...current, ...clampCentre(frame, current.cx - dx * unitsPerPixel, current.cy - dy * unitsPerPixel) });
      setDrag({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerEnd = useCallback(() => {
    setDrag(null);
  }, []);

  return (
    <section className="map-stage" aria-label="Mapa do mundo">
      <div className="map-heading">
        <span className="eyebrow">ATLAS DE {label(data.view.era).toUpperCase()}</span>
        <span>{tiles.length} territórios cartografados · projeção estratégica</span>
      </div>

      <svg
        ref={svgRef}
        className="world-map"
        viewBox={viewBoxOf(frame, view)}
        aria-label="Mapa hexagonal interativo"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={handlePointerEnd}
      >
        <defs>
          <pattern id="sea-waves" width="24" height="16" patternUnits="userSpaceOnUse">
            <path d="M0 8 Q6 3 12 8 T24 8" fill="none" stroke="currentColor" strokeOpacity=".18" strokeWidth="1.2" />
          </pattern>
          <pattern id="forest-dots" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="7" r="1.5" fill="currentColor" fillOpacity=".15" />
          </pattern>
          <pattern id="hills-hatching" width="18" height="18" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="18" stroke="currentColor" strokeOpacity=".12" strokeWidth="1" />
          </pattern>
          <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

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
            eligible ? 'eligible' : '',
            working && !eligible ? 'unavailable' : '',
            isForeign ? 'foreign' : '',
            isWorked ? 'is-worked' : '',
          ].filter(Boolean).join(' ');

          const cityOwner = city && city.ownerId !== data.view.player.id ? data.players.find(player => player.id === city.ownerId)?.name : undefined;
          const ariaTitle = `${city?.name ?? label(tile.terrain)}${cityOwner ? ` (${cityOwner})` : ''} ${tile.id}${isWorked ? ', trabalhado' : ''}`;

          return (
            <g
              key={tile.id}
              transform={`translate(${p.x} ${p.y})`}
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
                {tileSummary({ terrain: tile.terrain, id: tile.id, ownerName: tile.ownerId ? data.players.find(pl => pl.id === tile.ownerId)?.name : undefined, controllerCityId: tile.controllerCityId ?? null }, label(tile.terrain))}
                {eligible ? (working ? ' · Elegível para trabalho' : ' · Reivindicável') : ''}
                {isWorked ? ' · Trabalhado' : ''}
              </title>

              {/* Base terrain polygon */}
              <polygon className="hex-base" points={points} />

              {/* Terrain texture/hatching layer */}
              <polygon className="hex-texture" points={innerPoints} />

              {/* Subtle ownership wash/fill */}
              {owner > 0 && <polygon className="hex-owner-tint" points={innerPoints} />}

              {/* Territorial border outline */}
              <polygon className="hex-border" points={points} />

              {/* Content: City Monument or Rural Terrain */}
              {city ? (
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
                  <text className="terrain-glyph" y="4">
                    {terrainGlyphs[tile.terrain]}
                  </text>
                  {tile.features.length > 0 && (
                    <text className="features" y="22">
                      {tile.features.map(f => featureGlyphs[f] ?? '').join(' ')}
                    </text>
                  )}
                </g>
              )}

              {/* Improvement Badge (Top Left) */}
              {tile.improvement && (
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

              {/* Claimable frontier indicator */}
              {eligible && !working && (
                <polygon className="frontier-pulse" points={innerPoints} />
              )}
              {/* Neutral powers: an independent people (house) or a raid band (crossed blades, with its strength). */}
              {(() => {
                const people = peoples.find(p => p.hexId === tile.id && p.integratedBy === null), raid = raids.find(r => r.hexId === tile.id);
                return <>
                  {people && <g transform="translate(0 -30)" className={`alpha-people attitude-${people.attitude}`}><rect x="-13" y="-10" width="26" height="20" rx="4" className="people-badge" /><path d="M-7 5V-1L0 -6L7 -1V5Z M-2 5V1H2V5" className="people-glyph" /><title>Povo independente ({label(people.type)} · {label(people.attitude)})</title></g>}
                  {raid && <g transform="translate(0 -30)" className="alpha-raid"><rect x="-17" y="-10" width="34" height="20" rx="4" className="raid-badge" /><path d="M-11 6L-1 -5M-11 -5L-1 6" className="raid-glyph" /><text x="8" y="4" className="raid-count" textAnchor="middle">{raid.strength}</text><title>Bando saqueador · Força {raid.strength}</title></g>}
                </>;
              })()}
              {/* One badge per owner: the owner's colour, a soldier or a flag for civil pieces, and the count. Foreign pieces are outlined. */}
              {(() => {
                const here = units.filter(u => u.hexId === tile.id);
                if (!here.length) return null;
                const owners = [...new Set(here.map(u => u.ownerId))].sort((a, b) => Number(b === data.view.player.id) - Number(a === data.view.player.id));
                return <g transform="translate(0 40)">{owners.slice(0, 2).map((ownerId, slot) => {
                  const mine = here.filter(u => u.ownerId === ownerId), index = data.players.findIndex(p => p.id === ownerId), own = ownerId === data.view.player.id;
                  const military = mine.some(u => !['PIONEER', 'EXPLORER', 'ENVOY', 'SETTLER'].includes(u.kind));
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
      </svg>

      <div className="map-tools">
        <button aria-label="Diminuir zoom" onClick={() => setView({ ...current, zoom: clampZoom(current.zoom / 1.25) })}>−</button>
        <button title="Enquadrar todo o território conhecido" onClick={() => setView(null)}>Centralizar</button>
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

'use client';
import { memo, useState } from 'react';
import type { LocalView } from '@aoh/server/local-play';
import { label, roman } from './presentation';
type Props = { data: LocalView; selected: string | null; focus: string | null; working: boolean; worked: string[]; onSelect: (id: string) => void };
const position = (q: number, r: number) => ({ x: 70 + 52 * Math.sqrt(3) * (q + r / 2), y: 70 + 78 * r });
const points = Array.from({ length: 6 }, (_, i) => `${50 * Math.cos((60 * i - 30) * Math.PI / 180)},${50 * Math.sin((60 * i - 30) * Math.PI / 180)}`).join(' ');
const glyphs: Record<string, string> = { PLAINS: '⌁', FOREST: '♠', HILLS: '⌃⌃', MOUNTAINS: '△', COAST: '≈', SEA: '≈', UNKNOWN: '?' };
const featureGlyphs: Record<string, string> = { RIVER: '∿', FERTILE: '✧', TIMBER: '⋈', STONE: '◇', METAL: '◆', FISH: '⋊' };
export const HexMap = memo(function HexMap({ data, selected, focus, working, worked, onSelect }: Props) {
  const [zoom, setZoom] = useState(1.15); const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null); const [moved, setMoved] = useState(false);
  const tiles = data.view.visibleTerritory;
  const width = Math.max(...tiles.map(t => position(t.q, t.r).x)) + 80; const height = Math.max(...tiles.map(t => position(t.q, t.r).y)) + 80;
  const center = tiles.find(t => t.id === focus); const at = center ? position(center.q, center.r) : { x: width / 2, y: height / 2 };
  const cities = [...data.view.player.civilization.cities, ...data.view.visibleCities];
  return <section className="map-stage" aria-label="Mapa do mundo">
    <div className="map-heading"><span className="eyebrow">ATLAS DE {label(data.view.era).toUpperCase()}</span><span>{tiles.length} territórios · mapa revelado</span></div>
    <svg className="world-map" viewBox={`${at.x - width / (2 * zoom) - pan.x} ${at.y - height / (2 * zoom) - pan.y} ${width / zoom} ${height / zoom}`} aria-label="Mapa hexagonal interativo"
      onPointerDown={e => { setDrag({ x: e.clientX, y: e.clientY }); setMoved(false); }}
      onPointerMove={e => { if (drag && e.buttons) { const dx = e.clientX - drag.x; const dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) { setMoved(true); setPan(p => ({ x: p.x + dx * width / e.currentTarget.clientWidth / zoom, y: p.y + dy * height / e.currentTarget.clientHeight / zoom })); setDrag({ x: e.clientX, y: e.clientY }); } } }}
      onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)}>
      <defs><pattern id="sea-lines" width="18" height="14" patternUnits="userSpaceOnUse"><path d="M0 7Q4 3 9 7T18 7" fill="none" stroke="currentColor" strokeOpacity=".12" /></pattern></defs>
      {tiles.map(tile => {
        const p = position(tile.q, tile.r); const city = cities.find(c => c.hexId === tile.id);
        const owner = data.players.findIndex(player => player.id === tile.ownerId) + 1;
        const isWorked = data.view.player.civilization.cities.some(c => c.workedHexIds.includes(tile.id));
        const eligible = working ? data.workable.includes(tile.id) : data.claimable.includes(tile.id);
        return <g key={tile.id} transform={`translate(${p.x} ${p.y})`} role="button" tabIndex={0} aria-pressed={selected === tile.id} aria-label={`${city?.name ?? label(tile.terrain)} ${tile.id}${isWorked ? ', trabalhado' : ''}`} className={`hex terrain-${tile.terrain} owner-${owner} ${selected === tile.id ? 'selected' : ''} ${eligible ? 'eligible' : ''} ${working && !eligible ? 'unavailable' : ''}`} onClick={() => { if (!moved) onSelect(tile.id); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(tile.id); } }}>
          <title>{label(tile.terrain)} · {tile.id} · {tile.ownerId ? data.players.find(p => p.id === tile.ownerId)?.name : 'Livre'} · Controle: {tile.controllerCityId ?? 'nenhum'}{eligible ? ' · Elegível' : ''}</title>
          <polygon points={points} /><polygon className="water-lines" points={points} />
          {city ? <><path className="city-icon" d="M-13 0V-18H-5V-10H4V-23H12V0ZM-18 0H18" /><text className="city-name" y="17">{city.id === data.view.player.civilization.capitalCityId ? '★ ' : ''}{city.name}</text><text className="city-stat" y="32">{city.population} hab. · {roman[city.development]}</text></> : <><text className="terrain-glyph" y="5">{glyphs[tile.terrain]}</text><text className="features" y="24">{tile.features.map(f => featureGlyphs[f]).join(' ')}</text></>}
          {tile.improvement && <text className="improved" x="-27" y="-24">▤</text>}
          {(working ? worked.includes(tile.id) : isWorked) && <circle className="worked" cx="28" cy="-25" r="6" />}
        </g>;
      })}
    </svg>
    <div className="map-tools"><button aria-label="Diminuir zoom" onClick={() => setZoom(z => Math.max(.6, z - .25))}>−</button><button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Centralizar</button><button aria-label="Aumentar zoom" onClick={() => setZoom(z => Math.min(3, z + .25))}>+</button></div>
    <div className="map-legend">Arraste para mover · Enter para selecionar<br /><span>◌ Reivindicável</span> <span>● Trabalhado</span> <span>▤ Melhoria</span>{working && <strong>Selecione territórios para trabalhar</strong>}</div>
  </section>;
});

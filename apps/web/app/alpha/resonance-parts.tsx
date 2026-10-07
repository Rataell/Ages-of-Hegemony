'use client';
import { useId } from 'react';
import { ADVANCEMENTS, WEB_DOMAIN_NAMES, type WebDomain } from '@aoh/game-domain';

/**
 * Physical pieces of the Ressonância. A mark is a TOKEN, never just a colour: the shape says where the advance came from
 * (square cube = Teia, diamond = Convergência, hexagon = Herança) and a glyph says which domain it belongs to, so it reads in
 * grayscale and for colour-blind players. Two domains (a Convergência) show two glyphs on a split token.
 */
export type TokenSource = 'WEB' | 'CONVERGENCE' | 'HERITAGE';

/** 12×12 line glyphs, one per domain. Stroke only, drawn twice (dark halo + light line) so they read on every domain colour. */
const GLYPH: Record<WebDomain, string> = {
  KNOWLEDGE: 'M1.5 2.8 Q4 2 6 3.4 Q8 2 10.5 2.8 V9.4 Q8 8.6 6 10 Q4 8.6 1.5 9.4Z M6 3.4V10',
  LAND_AND_SEA: 'M1 4.6 q1.25-1.9 2.5 0 t2.5 0 t2.5 0 t2.5 0 M1 8.4 q1.25-1.9 2.5 0 t2.5 0 t2.5 0 t2.5 0',
  STONE_AND_METAL: 'M1 10 L4.8 3.2 L7 7 L8.4 5 L11 10Z',
  GOVERNMENT: 'M1.2 4.6 L6 1.8 L10.8 4.6Z M2.8 5.8V9.2 M6 5.8V9.2 M9.2 5.8V9.2 M1.2 10.4H10.8',
  TRADE: 'M1.5 4H10 M8 2L10 4L8 6 M10.5 8H2 M4 6L2 8L4 10',
};
/** One letter per domain for the accessible name and the plain-text fallbacks. */
export const DOMAIN_SHORT: Record<WebDomain, string> = { KNOWLEDGE: 'Sa', LAND_AND_SEA: 'TM', STONE_AND_METAL: 'PM', GOVERNMENT: 'Go', TRADE: 'Tr' };
const SHAPE: Record<TokenSource, string> = {
  WEB: 'M5 2.5H19A2.5 2.5 0 0 1 21.5 5V19A2.5 2.5 0 0 1 19 21.5H5A2.5 2.5 0 0 1 2.5 19V5A2.5 2.5 0 0 1 5 2.5Z',
  CONVERGENCE: 'M12 1 L23 12 L12 23 L1 12Z',
  HERITAGE: 'M12 1.5 L21.5 7 V17 L12 22.5 L2.5 17 V7Z',
};
export const sourceName = (source: TokenSource) => source === 'WEB' ? 'Teia' : source === 'CONVERGENCE' ? 'Convergência' : 'Herança';
export const tokenLabel = (domains: readonly WebDomain[], source: TokenSource) => `${sourceName(source)} · ${domains.map(d => WEB_DOMAIN_NAMES[d]).join(' + ')}`;

function Glyph({ domain, x, y, scale }: { domain: WebDomain; x: number; y: number; scale: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={GLYPH[domain]} className="aoh-glyph-halo" /><path d={GLYPH[domain]} className="aoh-glyph-line" />
  </g>;
}

export function ResonanceToken({ domains, source = 'WEB', size = 18, className = '' }: { domains: readonly WebDomain[]; source?: TokenSource; size?: number; className?: string }) {
  const gradient = useId(), [first, second] = domains, dual = second !== undefined && second !== first;
  return <span className={`aoh-token src-${source} d-${first}${dual ? ` d2-${second}` : ''}${className ? ` ${className}` : ''}`} style={{ width: size, height: size }} aria-hidden="true" data-glyph={domains.map(d => DOMAIN_SHORT[d]).join('+')}>
    <svg viewBox="0 0 24 24" width={size} height={size} focusable="false">
      {dual && <defs><linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1"><stop offset="0.5" style={{ stopColor: 'var(--c1)' }} /><stop offset="0.5" style={{ stopColor: 'var(--c2)' }} /></linearGradient></defs>}
      <path d={SHAPE[source]} className="aoh-token-body" style={dual ? { fill: `url(#${gradient})` } : undefined} />
      <path d={SHAPE[source]} className="aoh-token-bevel" />
      {dual ? <><Glyph domain={first!} x={3.2} y={3.2} scale={0.62} /><Glyph domain={second} x={13.2} y={13.2} scale={0.62} /></> : <Glyph domain={first!} x={6} y={6} scale={1} />}
    </svg>
  </span>;
}

/** The advance's name for tooltips and the screen reader. */
export const advanceName = (id: string) => ADVANCEMENTS.find(n => n.id === id)?.name ?? id;

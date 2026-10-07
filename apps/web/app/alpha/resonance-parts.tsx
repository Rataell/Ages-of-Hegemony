'use client';
import { ADVANCEMENTS, WEB_DOMAIN_NAMES, type WebDomain } from '@aoh/game-domain';

/**
 * Physical language of the Teia and the Ressonância (RC4). Three different things, three different pieces:
 *
 *  - AdvanceCube      the PERMANENT marker of an acquired advance: a small cube of the PLAYER's colour set on its node. Every advance
 *                     (Teia, Convergência, Herança) gets the same cube; the node says where it came from, never the cube.
 *  - ResonanceEcho    the TEMPORARY copy of that cube resting in one of the five cavities of the Ressonância tray. Same cube, same
 *                     owner colour, same glyph; it is only an echo, the permanent cube never leaves its node.
 *  - DomainGlyph      the domain (Saber, Terra e Mar, …) as a small engraved line glyph. Domain is secondary information: it is
 *                     engraved on the top face of the cube and never the body colour.
 *
 * The owner colour is the seat colour (`--seat`); the glyph carries the domain, so it reads in grayscale and for colour-blind players.
 * Two domains (a Convergência) engrave two small glyphs on a diagonal, not two big colours.
 */

/** 12×12 line glyphs, one per domain (drawn twice: dark halo + light line, so they read on any owner colour). */
const GLYPH: Record<WebDomain, string> = {
  KNOWLEDGE: 'M1.5 2.8 Q4 2 6 3.4 Q8 2 10.5 2.8 V9.4 Q8 8.6 6 10 Q4 8.6 1.5 9.4Z M6 3.4V10',
  LAND_AND_SEA: 'M1 4.6 q1.25-1.9 2.5 0 t2.5 0 t2.5 0 t2.5 0 M1 8.4 q1.25-1.9 2.5 0 t2.5 0 t2.5 0 t2.5 0',
  STONE_AND_METAL: 'M1 10 L4.8 3.2 L7 7 L8.4 5 L11 10Z',
  GOVERNMENT: 'M1.2 4.6 L6 1.8 L10.8 4.6Z M2.8 5.8V9.2 M6 5.8V9.2 M9.2 5.8V9.2 M1.2 10.4H10.8',
  TRADE: 'M1.5 4H10 M8 2L10 4L8 6 M10.5 8H2 M4 6L2 8L4 10',
};
/** Short names for the accessible text and plain fallbacks. */
export const DOMAIN_SHORT: Record<WebDomain, string> = { KNOWLEDGE: 'Sa', LAND_AND_SEA: 'TM', STONE_AND_METAL: 'PM', GOVERNMENT: 'Go', TRADE: 'Tr' };
export type TokenSource = 'WEB' | 'CONVERGENCE' | 'HERITAGE';
export const sourceName = (source: TokenSource) => source === 'WEB' ? 'Teia' : source === 'CONVERGENCE' ? 'Convergência' : 'Herança';
export const tokenLabel = (domains: readonly WebDomain[], source: TokenSource) => `${sourceName(source)} · ${domains.map(d => WEB_DOMAIN_NAMES[d]).join(' + ')}`;
/** The advance's name for tooltips and the screen reader. */
export const advanceName = (id: string) => ADVANCEMENTS.find(n => n.id === id)?.name ?? id;

/** A line glyph on its own (heritage links, legends). */
export function DomainGlyph({ domain, size = 14 }: { domain: WebDomain; size?: number }) {
  return <svg className="aoh-domain-glyph" viewBox="0 0 12 12" width={size} height={size} aria-hidden="true" focusable="false" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={GLYPH[domain]} className="aoh-glyph-halo" /><path d={GLYPH[domain]} className="aoh-glyph-line" />
  </svg>;
}

/* Isometric cube, viewBox 24×26: top face, left face (lit), right face (shadow). The glyph is laid on the top face by an affine map of the 12×12 glyph square. */
const TOP = 'M12 2.5 L21.5 7.5 L12 12.5 L2.5 7.5Z', LEFT = 'M2.5 7.5 L12 12.5 V23.5 L2.5 18.5Z', RIGHT = 'M12 12.5 L21.5 7.5 V18.5 L12 23.5Z';
const ON_TOP = 'matrix(0.7917 -0.4167 0.7917 0.4167 2.5 7.5)';

/** The cube itself: owner colour on the body, domain engraved on top. `plain` leaves the face blank (the Reserva). */
export function AdvanceCube({ domains, color, size = 22, plain = false, className = '' }: { domains: readonly WebDomain[]; color: string; size?: number; plain?: boolean; className?: string }) {
  const [first, second] = domains, dual = second !== undefined && second !== first;
  return <span className={`aoh-cube${dual ? ' is-dual' : ''}${className ? ` ${className}` : ''}`} style={{ width: size, height: Math.round(size * 26 / 24), ['--seat' as string]: color }} aria-hidden="true" data-glyph={domains.map(d => DOMAIN_SHORT[d]).join('+')}>
    <svg viewBox="0 0 24 26" width={size} height={Math.round(size * 26 / 24)} focusable="false" overflow="visible">
      <path d={LEFT} className="aoh-cube-left" /><path d={RIGHT} className="aoh-cube-right" /><path d={TOP} className="aoh-cube-top" />
      <path d={TOP} className="aoh-cube-bevel" />
      {!plain && first !== undefined && (dual
        ? <g transform={ON_TOP} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.6 1.4 L1.4 10.6" className="aoh-glyph-halo" /><path d="M10.6 1.4 L1.4 10.6" className="aoh-glyph-line" />
            <g transform="translate(-0.4 -0.4) scale(0.58)"><path d={GLYPH[first]} className="aoh-glyph-halo" /><path d={GLYPH[first]} className="aoh-glyph-line" /></g>
            <g transform="translate(6.2 6.2) scale(0.58)"><path d={GLYPH[second]} className="aoh-glyph-halo" /><path d={GLYPH[second]} className="aoh-glyph-line" /></g>
          </g>
        : <g transform={ON_TOP} fill="none" strokeLinecap="round" strokeLinejoin="round"><g transform="translate(0.6 0.6) scale(0.9)"><path d={GLYPH[first]} className="aoh-glyph-halo" /><path d={GLYPH[first]} className="aoh-glyph-line" /></g></g>)}
    </svg>
  </span>;
}

/** The permanent marker set on a Teia / Convergência / Herança node. Same cube for all three. */
export function PlacedCube(props: { domains: readonly WebDomain[]; color: string; size?: number }) {
  return <AdvanceCube {...props} className="is-placed" />;
}

/** The temporary echo of that cube in a Ressonância cavity. */
export function ResonanceEcho(props: { domains: readonly WebDomain[]; color: string; size?: number }) {
  return <AdvanceCube {...props} className="is-echo" />;
}

/** A small pile of the player's cubes: the Reserva. Visual only, never a limit. */
export function ReservePile({ color }: { color: string }) {
  return <span className="aoh-pile" aria-hidden="true">{[0, 1, 2].map(i => <AdvanceCube key={i} domains={[]} color={color} size={16} plain className="is-pile" />)}</span>;
}

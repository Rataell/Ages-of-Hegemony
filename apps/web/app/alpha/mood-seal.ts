/**
 * Selo de Ânimo (Mesa Viva, moodSeal of docs/product/mesa-viva/02-lib.js): four original states drawn as ring + expression + number, so shape, colour
 * and label say the same thing (grayscale and colour-blind safe). Próspera 5-6: golden ring with rays and a smile. Estável 4: plain green ring.
 * Abalada 2-3: broken amber ring with brows. Revolta 0-1: split red ring with sparks. Pure string builders, no DOM (same contract as table-art.ts).
 */
const INK = '#0b1114', LIGHT = '#f4ecd8', PLATE = '#0f181c';
export type MoodBandName = 'Próspera' | 'Estável' | 'Abalada' | 'Revolta';
const BANDS: Record<number, [MoodBandName, string]> = {
  0: ['Revolta', '#e0583f'], 1: ['Revolta', '#e0583f'], 2: ['Abalada', '#e6a03c'], 3: ['Abalada', '#e6a03c'], 4: ['Estável', '#9fcf86'], 5: ['Próspera', '#e8c46e'], 6: ['Próspera', '#e8c46e'],
};
/** The engine's moodBand names (REVOLT | SHAKEN | STABLE | PROSPEROUS) in Portuguese. */
export const MOOD_BAND_NAMES: Record<string, MoodBandName> = { REVOLT: 'Revolta', SHAKEN: 'Abalada', STABLE: 'Estável', PROSPEROUS: 'Próspera' };
const clampMood = (n: number) => Math.max(0, Math.min(6, Math.round(Number.isFinite(n) ? n : 0)));
export const moodName = (n: number): MoodBandName => BANDS[clampMood(n)]![0];
export const moodLabel = (n: number) => `Ânimo ${clampMood(n)} de 6, ${moodName(n)}`;

/** The seal as an SVG fragment in a ±24 box centred on (0,0). */
export function moodSealArt(n: number, showNum = true): string {
  const m = clampMood(n), [band, c] = BANDS[m]!;
  let ring = `<circle r="15" fill="${PLATE}" stroke="${c}" stroke-width="3"/>`, face = '';
  const eyes = `<circle cx="-5.2" cy="-3" r="1.9" fill="${c}"/><circle cx="5.2" cy="-3" r="1.9" fill="${c}"/>`;
  if (band === 'Próspera') {
    ring += [-40, -20, 0, 20, 40].map(a => `<path d="M0 -17.5 L0 -21.5" stroke="${c}" stroke-width="2" stroke-linecap="round" transform="rotate(${a})"/>`).join('');
    face = eyes + `<path d="M-6.5 3 Q0 10 6.5 3" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`;
  } else if (band === 'Estável') {
    face = eyes + `<path d="M-5 5.5 H5" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`;
  } else if (band === 'Abalada') {
    ring = `<circle r="15" fill="${PLATE}" stroke="${c}" stroke-width="3" stroke-dasharray="11 3 7 3 9 3"/>`;
    face = eyes + `<path d="M-8.5 -5.5 L-3 -8.5 M8.5 -5.5 L3 -8.5" stroke="${c}" stroke-width="1.7" stroke-linecap="round"/><path d="M-6.5 6.5 Q-3.2 3 0 6.5 T6.5 6.5" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`;
  } else {
    ring = `<path d="M-13 -8 A15 15 0 0 1 3 -14.7 M9 -12 A15 15 0 0 1 14.6 -3 M14.5 4 A15 15 0 0 1 4 14.5 M-3 14.7 A15 15 0 0 1 -14.5 3" fill="none" stroke="${c}" stroke-width="3.2"/><circle r="12.5" fill="${PLATE}"/>`
      + `<path d="M-3 -15 L-1 -21 L1.5 -16 L4 -22 L5.5 -15 M-10 -12 L-12 -17 L-7 -14" fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/>`;
    face = `<circle cx="-5" cy="-2" r="1.8" fill="${c}"/><circle cx="5" cy="-2" r="1.8" fill="${c}"/><path d="M-9 -7 L-3 -4.5 M9 -7 L3 -4.5" stroke="${c}" stroke-width="2" stroke-linecap="round"/><path d="M-5.5 9 Q0 3 5.5 9" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`;
  }
  const num = showNum ? `<circle cx="12" cy="12" r="6.3" fill="${INK}" stroke="${c}" stroke-width="1.3"/><text x="12" y="15.2" text-anchor="middle" font-family="'Source Sans 3',sans-serif" font-weight="700" font-size="9.5" fill="${LIGHT}">${m}</text>` : '';
  return `<g class="mood-seal" data-mood="${m}" data-band="${band}">${ring}${face}${num}</g>`;
}

/** A standalone <svg> of the seal (panels, tooltips). `px` is its width and height. */
export function moodSealSvg(n: number, px = 34, showNum = true): string {
  return `<svg viewBox="-24 -24 48 48" width="${px}" height="${px}" role="img" aria-label="${moodLabel(n)}">${moodSealArt(n, showNum)}</svg>`;
}

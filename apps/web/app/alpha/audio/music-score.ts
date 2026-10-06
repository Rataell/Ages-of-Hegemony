/**
 * ORIGINAL generative score (project-owned). Deterministic from a seed: a slow pad over a modal (D minor pentatonic)
 * harmony plus sparse soft notes. One full cycle lasts ~3m44s before it repeats; chord tails overlap the next cycle,
 * so the loop has no audible seam.
 */
export type ScoreChord = { t: number; dur: number; freqs: number[] };
export type ScoreNote = { t: number; dur: number; freq: number; vel: number };
export type Score = { cycleSec: number; chords: ScoreChord[]; notes: ScoreNote[] };

export const SCALE = [0, 3, 5, 7, 10]; // D F G A C (minor pentatonic) relative to D
export const ROOT_MIDI = 38; // D2
export const CHORD_SEC = 16;
export const CHORD_COUNT = 14;

export const midiToHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
/** mulberry32: tiny seeded PRNG, so the same seed always yields the same piece. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const degree = (index: number, octave: number) => ROOT_MIDI + 12 * octave + SCALE[index % 5]! + 12 * Math.floor(index / 5);

export function buildScore(seed = 1913): Score {
  const rand = seeded(seed);
  const chords: ScoreChord[] = [], notes: ScoreNote[] = [];
  let previous = -1, previousNote = 7;
  for (let i = 0; i < CHORD_COUNT; i++) {
    let root = Math.floor(rand() * 5);
    if (root === previous) root = (root + 2) % 5;
    previous = root;
    const t = i * CHORD_SEC;
    // low root, a fifth-ish and an upper pentatonic color tone: open, never a dense triad.
    chords.push({ t, dur: CHORD_SEC, freqs: [midiToHz(degree(root, 0)), midiToHz(degree(root + 3, 0)), midiToHz(degree(root + 1 + Math.floor(rand() * 3), 1))] });
    const count = 2 + Math.floor(rand() * 3);
    for (let n = 0; n < count; n++) {
      const step = Math.floor(rand() * 5) - 2; // stepwise motion keeps it unobtrusive
      previousNote = Math.max(4, Math.min(11, previousNote + (step === 0 ? 1 : step)));
      notes.push({ t: t + 1.5 + (n + rand() * 0.8) * (CHORD_SEC - 3) / count, dur: 3.5 + rand() * 2, freq: midiToHz(degree(previousNote, 1)), vel: 0.05 + rand() * 0.04 });
    }
  }
  return { cycleSec: CHORD_COUNT * CHORD_SEC, chords, notes: notes.sort((a, b) => a.t - b.t) };
}

import { SeedSchema } from '@aoh/game-domain';

export interface RandomSource { next(): number; snapshot(): number }
// Versioned algorithm: the state is JSON-safe and can resume an interrupted replay.
export function randomStep(state: number): { readonly value: number; readonly state: number } {
  const next = (SeedSchema.parse(state) + 0x6d2b79f5) >>> 0;
  let value = next;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return { value: ((value ^ (value >>> 14)) >>> 0) / 4294967296, state: next };
}
// Stateful convenience wrapper for callers; reducers use randomStep with explicit state.
export function createSeededRandom(seed: number): RandomSource {
  let state = SeedSchema.parse(seed);
  return {
    next() { const step = randomStep(state); state = step.state; return step.value; },
    snapshot() { return state; },
  };
}

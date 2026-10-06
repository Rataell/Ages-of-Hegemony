import type { AudioEvent } from './audio-events';

/** What the manager needs from a sound engine. The WebAudio implementation lives in webaudio-backend.ts; tests inject a fake. */
export interface AudioBackend {
  /** Create/resume the context. Must run from a user gesture the first time. */
  resume(): void;
  play(event: AudioEvent): void;
  startMusic(): void;
  stopMusic(): void;
  /** Effective gains, 0..1 (already zero when disabled or muted). */
  setMusicGain(value: number): void;
  setSfxGain(value: number): void;
}

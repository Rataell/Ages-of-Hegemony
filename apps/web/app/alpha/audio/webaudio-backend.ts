import type { AudioBackend } from './audio-backend';
import type { AudioEvent } from './audio-events';
import { buildScore, type Score } from './music-score';

type Tone = { t: number; f: number; to?: number; dur: number; type?: OscillatorType; g?: number; attack?: number };
type Noise = { t: number; dur: number; f: number; q?: number; g?: number; kind?: BiquadFilterType };

/** ORIGINAL procedural sounds (project-owned). No files, no network: every SFX is oscillators and filtered noise. */
class Synth {
  constructor(readonly ctx: AudioContext, readonly out: AudioNode, readonly noiseBuffer: AudioBuffer) {}
  tone({ t, f, to, dur, type = 'sine', g = 0.2, attack = 0.004 }: Tone) {
    const o = this.ctx.createOscillator(), a = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    a.gain.setValueAtTime(0.0001, t); a.gain.linearRampToValueAtTime(g, t + attack); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(a).connect(this.out); o.start(t); o.stop(t + dur + 0.05);
  }
  noise({ t, dur, f, q = 1, g = 0.15, kind = 'bandpass' }: Noise) {
    const s = this.ctx.createBufferSource(), fl = this.ctx.createBiquadFilter(), a = this.ctx.createGain();
    s.buffer = this.noiseBuffer; fl.type = kind; fl.frequency.value = f; fl.Q.value = q;
    a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl).connect(a).connect(this.out); s.start(t, 0, dur + 0.02);
  }
  /** Soft chime: sine with a quiet inharmonic partial. */
  chime(t: number, f: number, dur = 0.7, g = 0.16) { this.tone({ t, f, dur, g, attack: 0.006 }); this.tone({ t, f: f * 2.01, dur: dur * 0.5, g: g * 0.3 }); }
  wood(t: number, f = 220, g = 0.3, dur = 0.09) { this.tone({ t, f, to: f * 0.7, dur, type: 'triangle', g }); this.noise({ t, dur: 0.025, f: f * 6, q: 2, g: g * 0.5 }); }
  tick(t: number, g = 0.12) { this.noise({ t, dur: 0.02, f: 4200, kind: 'highpass', g }); }
}

const D = 293.66, F = 349.23, G = 392, A = 440, C = 523.25;
const RECIPES: Record<AudioEvent, (s: Synth, t: number) => void> = {
  UI_SELECT: (s, t) => s.wood(t, 760, 0.16, 0.05),
  ORDER_PLANNED: (s, t) => { s.wood(t, 520, 0.22, 0.07); s.wood(t + 0.07, 780, 0.12, 0.06); },
  ORDER_RESOLVED: (s, t) => { s.noise({ t, dur: 0.18, f: 1200, g: 0.1 }); s.tone({ t, f: A, dur: 0.16, g: 0.06 }); },
  PLAN_CONFIRMED: (s, t) => { s.chime(t, D * 2, 0.5); s.chime(t + 0.12, A * 2, 0.6); },
  UNIT_MOVED: (s, t) => { s.noise({ t, dur: 0.2, f: 900, q: 0.7, g: 0.1 }); s.wood(t + 0.17, 330, 0.18, 0.07); },
  REGION_REVEALED: (s, t) => { s.noise({ t, dur: 0.09, f: 3000, kind: 'highpass', g: 0.1 }); s.chime(t + 0.05, A * 1.5, 0.9); s.chime(t + 0.2, A * 2.25, 0.9, 0.1); },
  CITY_FOUNDED: (s, t) => { s.wood(t, 200, 0.3); [D, A, D * 2].forEach((f, i) => s.tone({ t: t + 0.08 + i * 0.07, f, dur: 1.2, type: 'triangle', g: 0.1, attack: 0.03 })); },
  BUILD_DONE: (s, t) => { s.wood(t, 180, 0.28); s.wood(t + 0.12, 200, 0.24); s.chime(t + 0.25, A * 2, 0.5, 0.1); },
  RESEARCH_DONE: (s, t) => [D * 2, F * 2, A * 2].forEach((f, i) => s.chime(t + i * 0.13, f, 0.9, 0.11)),
  RESONANCE_FILLED: (s, t) => { s.tone({ t, f: 660, dur: 1.3, g: 0.12 }); s.tone({ t, f: 996, dur: 1.1, g: 0.07 }); s.tone({ t, f: 1475, dur: 0.8, g: 0.04 }); },
  REPERCUSSION: (s, t) => { s.tone({ t, f: 110, dur: 1.5, g: 0.2, attack: 0.02 }); s.tone({ t, f: 165, dur: 1.2, g: 0.1, attack: 0.02 }); s.chime(t + 0.2, D * 2, 0.9, 0.08); },
  BATTLE_START: (s, t) => { s.tone({ t, f: 150, to: 85, dur: 0.3, type: 'triangle', g: 0.3 }); s.tone({ t: t + 0.18, f: 150, to: 85, dur: 0.3, type: 'triangle', g: 0.25 }); s.tick(t + 0.4, 0.1); },
  DICE_ROLL: (s, t) => { for (let i = 0; i < 8; i++) s.noise({ t: t + i * 0.06 + (i % 3) * 0.008, dur: 0.035, f: 2400 + (i % 4) * 500, q: 3, g: 0.12 }); s.wood(t + 0.5, 300, 0.12, 0.06); },
  DICE_RESULT_IMPACT: (s, t) => { s.wood(t, G / 2, 0.26, 0.1); s.tone({ t, f: G, dur: 0.18, g: 0.07 }); },
  DICE_RESULT_GUARD: (s, t) => { s.tone({ t, f: 1318, dur: 0.14, g: 0.1 }); s.tone({ t, f: 330, dur: 0.2, type: 'triangle', g: 0.14 }); },
  DICE_RESULT_MANEUVER: (s, t) => s.tone({ t, f: A, to: A * 1.25, dur: 0.18, g: 0.12 }),
  DICE_RESULT_COMMAND: (s, t) => s.chime(t, 587, 0.45, 0.14),
  DICE_RESULT_EMPTY: (s, t) => s.tone({ t, f: 150, to: 120, dur: 0.12, type: 'triangle', g: 0.07 }),
  HIT: (s, t) => { s.tone({ t, f: 170, to: 100, dur: 0.14, type: 'triangle', g: 0.3 }); s.noise({ t, dur: 0.05, f: 900, g: 0.12 }); },
  GUARD_BLOCK: (s, t) => { s.tone({ t, f: 1400, dur: 0.18, g: 0.12 }); s.tone({ t: t + 0.01, f: 2100, dur: 0.1, g: 0.06 }); },
  UNIT_LOST: (s, t) => { s.tone({ t, f: 120, to: 70, dur: 0.3, type: 'triangle', g: 0.32 }); s.tick(t + 0.14, 0.14); },
  RETREAT: (s, t) => { s.wood(t, 400, 0.18, 0.07); s.wood(t + 0.14, 300, 0.16, 0.08); },
  CITY_CAPTURED: (s, t) => { s.tone({ t, f: 98, dur: 1.1, type: 'triangle', g: 0.25, attack: 0.02 }); s.tone({ t: t + 0.1, f: 147, dur: 0.9, type: 'triangle', g: 0.12 }); s.wood(t, 150, 0.25); },
  CAMP_SPAWNED: (s, t) => { s.tone({ t, f: 120, to: 90, dur: 0.4, type: 'triangle', g: 0.2 }); s.tone({ t: t + 0.25, f: 100, to: 80, dur: 0.4, type: 'triangle', g: 0.14 }); },
  RAID_ACTIVE: (s, t) => { s.wood(t, 130, 0.25, 0.1); s.wood(t + 0.2, 130, 0.25, 0.1); s.wood(t + 0.4, 160, 0.22, 0.1); },
  PIRATE_ACTIVE: (s, t) => { s.tone({ t, f: 220, to: 175, dur: 0.6, type: 'triangle', g: 0.14, attack: 0.08 }); s.noise({ t, dur: 0.5, f: 500, q: 0.6, g: 0.07 }); },
  WORLD_PULSE: (s, t) => { s.tone({ t, f: D, dur: 1.5, g: 0.12, attack: 0.25 }); s.tone({ t, f: A, dur: 1.4, g: 0.08, attack: 0.3 }); },
  ENCOUNTER: (s, t) => { s.chime(t, A * 1.5, 0.6, 0.12); s.chime(t + 0.14, G * 2, 0.7, 0.1); },
  WORLD_EVENT: (s, t) => { s.chime(t, A, 0.9, 0.13); s.chime(t + 0.2, A * 1.5, 1.0, 0.09); },
  ERA_CHANGED: (s, t) => [D, A, D * 2, F * 2, A * 2].forEach((f, i) => { s.tone({ t: t + i * 0.2, f, dur: 2.0, type: 'triangle', g: 0.1, attack: 0.04 }); s.chime(t + i * 0.2, f * 2, 1.4, 0.05); }),
  REACTION_RECEIVED: (s, t) => s.tone({ t, f: 880, dur: 0.1, g: 0.1 }),
  PLAYER_JOINED: (s, t) => { s.chime(t, G * 1.5, 0.4, 0.1); s.chime(t + 0.1, C * 2, 0.5, 0.1); },
  PLAYER_RECONNECTED: (s, t) => { s.chime(t, C * 1.5, 0.4, 0.08); s.chime(t + 0.1, G * 1.5, 0.5, 0.08); },
};

const LOOKAHEAD = 2.5, TICK_MS = 500;

export class WebAudioBackend implements AudioBackend {
  private ctx: AudioContext | null = null;
  private sfx!: GainNode; private music!: GainNode; private musicFade!: GainNode; private synth!: Synth;
  private pad!: BiquadFilterNode; private notesBus!: GainNode;
  private sfxGain = 0.6; private musicGain = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private score: Score = buildScore();
  private cycleStart = 0; private chordIx = 0; private noteIx = 0; private wantMusic = false;

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = typeof window === 'undefined' ? undefined : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (!Ctor) return null;
    const ctx = new Ctor();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4; comp.connect(ctx.destination);
    this.sfx = ctx.createGain(); this.sfx.gain.value = this.sfxGain; this.sfx.connect(comp);
    this.music = ctx.createGain(); this.music.gain.value = this.musicGain; this.music.connect(comp);
    this.musicFade = ctx.createGain(); this.musicFade.gain.value = 0; this.musicFade.connect(this.music);
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), data = buffer.getChannelData(0);
    let seed = 7; for (let i = 0; i < data.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; data[i] = seed / 2147483648 - 1; }
    this.synth = new Synth(ctx, this.sfx, buffer);
    // pad chain: lowpass breathing slowly (LFO), then a long feedback delay shared by the sparse notes.
    this.pad = ctx.createBiquadFilter(); this.pad.type = 'lowpass'; this.pad.frequency.value = 800; this.pad.Q.value = 0.5; this.pad.connect(this.musicFade);
    const lfo = ctx.createOscillator(), depth = ctx.createGain(); lfo.frequency.value = 0.045; depth.gain.value = 320; lfo.connect(depth).connect(this.pad.frequency); lfo.start();
    this.notesBus = ctx.createGain(); this.notesBus.connect(this.musicFade);
    const delay = ctx.createDelay(2), fb = ctx.createGain(), tone = ctx.createBiquadFilter();
    delay.delayTime.value = 0.62; fb.gain.value = 0.42; tone.type = 'lowpass'; tone.frequency.value = 1800;
    this.notesBus.connect(delay); delay.connect(tone).connect(fb).connect(delay); tone.connect(this.musicFade);
    this.ctx = ctx;
    return ctx;
  }

  resume() {
    const ctx = this.ensure(); if (!ctx) return;
    if (ctx.state === 'running') { if (this.wantMusic) this.startMusic(); return; }
    void ctx.resume().then(() => { if (this.wantMusic) this.startMusic(); }).catch(() => {});
  }
  play(event: AudioEvent) {
    const ctx = this.ctx; if (!ctx || ctx.state !== 'running' || this.sfxGain <= 0) return;
    RECIPES[event](this.synth, ctx.currentTime + 0.01);
  }
  setSfxGain(value: number) { this.sfxGain = value; if (this.ctx) this.sfx.gain.setTargetAtTime(value, this.ctx.currentTime, 0.03); }
  setMusicGain(value: number) { this.musicGain = value; if (this.ctx) this.music.gain.setTargetAtTime(value, this.ctx.currentTime, 0.05); }

  startMusic() {
    this.wantMusic = true;
    const ctx = this.ctx; if (!ctx || ctx.state !== 'running' || this.timer) return;
    this.cycleStart = ctx.currentTime + 0.2; this.chordIx = 0; this.noteIx = 0;
    this.musicFade.gain.cancelScheduledValues(ctx.currentTime); this.musicFade.gain.setValueAtTime(this.musicFade.gain.value, ctx.currentTime); this.musicFade.gain.linearRampToValueAtTime(1, ctx.currentTime + 4);
    this.timer = setInterval(() => this.pump(), TICK_MS); this.pump();
  }
  stopMusic() {
    this.wantMusic = false;
    if (!this.ctx || !this.timer) return;
    clearInterval(this.timer); this.timer = null;
    const t = this.ctx.currentTime;
    this.musicFade.gain.cancelScheduledValues(t); this.musicFade.gain.setValueAtTime(this.musicFade.gain.value, t); this.musicFade.gain.linearRampToValueAtTime(0, t + 1.2);
  }

  /** Schedules the next window of the score; at the end of the cycle it wraps with the old tails still ringing (no seam). */
  private pump() {
    const ctx = this.ctx; if (!ctx) return;
    const horizon = ctx.currentTime + LOOKAHEAD;
    for (;;) {
      const chord = this.score.chords[this.chordIx], note = this.score.notes[this.noteIx];
      const chordAt = chord ? this.cycleStart + chord.t : Infinity, noteAt = note ? this.cycleStart + note.t : Infinity;
      if (chord && chordAt < horizon && chordAt <= noteAt) { this.padChord(chord.freqs, chordAt, chord.dur); this.chordIx++; continue; }
      if (note && noteAt < horizon) { this.softNote(note.freq, noteAt, note.dur, note.vel); this.noteIx++; continue; }
      if (!chord && !note) { this.cycleStart += this.score.cycleSec; this.chordIx = 0; this.noteIx = 0; continue; }
      break;
    }
  }
  private padChord(freqs: number[], t: number, dur: number) {
    const ctx = this.ctx!, attack = 5, release = 6, end = t + dur + release;
    for (const f of freqs) for (const detune of [-5, 5]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f; o.detune.value = detune;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.045, t + attack); g.gain.setValueAtTime(0.045, t + dur); g.gain.linearRampToValueAtTime(0.0001, end);
      o.connect(g).connect(this.pad); o.start(t); o.stop(end + 0.1);
    }
  }
  private softNote(f: number, t: number, dur: number, vel: number) {
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.notesBus); o.start(t); o.stop(t + dur + 0.1);
  }
}

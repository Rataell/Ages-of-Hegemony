import type { AudioBackend } from './audio-backend';
import type { AudioEvent } from './audio-events';
import { createScheduler, type Scheduler } from './audio-scheduler';
import { WebAudioBackend } from './webaudio-backend';

export type AudioSettings = { musicEnabled: boolean; musicVolume: number; sfxEnabled: boolean; sfxVolume: number; muted: boolean };
/** Default: music OFF until the player asks for it (never forced); effects ON at 0.6. */
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = { musicEnabled: false, musicVolume: 0.5, sfxEnabled: true, sfxVolume: 0.6, muted: false };
export const AUDIO_STORAGE_KEY = 'aoh-alpha-audio-v1';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
export type AudioManagerDeps = { backend?: AudioBackend; scheduler?: Scheduler; storage?: StorageLike | null; now?: () => number };
const clamp = (value: unknown, fallback: number) => (typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback);

export function parseSettings(raw: string | null): AudioSettings {
  try {
    const data = raw ? JSON.parse(raw) as Partial<AudioSettings> : {};
    const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
    const d = DEFAULT_AUDIO_SETTINGS;
    return { musicEnabled: bool(data.musicEnabled, d.musicEnabled), musicVolume: clamp(data.musicVolume, d.musicVolume), sfxEnabled: bool(data.sfxEnabled, d.sfxEnabled), sfxVolume: clamp(data.sfxVolume, d.sfxVolume), muted: bool(data.muted, d.muted) };
  } catch { return { ...DEFAULT_AUDIO_SETTINGS }; }
}

/** Single audio entry point. UI code only calls semantic events; sound parameters live behind the backend. */
export class AudioManager {
  private settings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
  private listeners = new Set<() => void>();
  private backend: AudioBackend | null;
  private scheduler: Scheduler;
  private storage: StorageLike | null;
  private unlocked = false;
  private loaded = false;

  constructor(deps: AudioManagerDeps = {}) {
    this.backend = deps.backend ?? null;
    this.scheduler = deps.scheduler ?? createScheduler({ now: deps.now ?? (() => Date.now()) });
    this.storage = deps.storage === undefined ? null : deps.storage;
    if (deps.storage !== undefined) this.load();
  }

  private be(): AudioBackend | null {
    if (!this.backend && typeof window !== 'undefined') this.backend = new WebAudioBackend();
    return this.backend;
  }
  /** Reads persisted settings once, in the browser (kept out of the constructor so SSR renders the defaults). */
  hydrate() {
    if (this.loaded) return; this.loaded = true;
    if (this.storage === null && typeof window !== 'undefined') { try { this.storage = window.localStorage; } catch { this.storage = null; } }
    this.load();
  }
  private load() {
    this.loaded = true;
    try { this.settings = parseSettings(this.storage?.getItem(AUDIO_STORAGE_KEY) ?? null); } catch { /* keep defaults */ }
    this.applyGains(); this.emit();
  }
  private save() { try { this.storage?.setItem(AUDIO_STORAGE_KEY, JSON.stringify(this.settings)); } catch { /* private mode */ } }
  private applyGains() {
    const be = this.be(); if (!be) return;
    const s = this.settings;
    be.setMusicGain(s.muted || !s.musicEnabled ? 0 : s.musicVolume * 0.8);
    be.setSfxGain(s.muted || !s.sfxEnabled ? 0 : s.sfxVolume);
    if (this.unlocked) { if (s.musicEnabled && !s.muted) be.startMusic(); else be.stopMusic(); }
  }
  private update(patch: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...patch };
    this.save(); this.applyGains(); this.emit();
  }
  private emit() { for (const l of this.listeners) l(); }

  getSettings = (): AudioSettings => this.settings;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };

  /** Creates/resumes the AudioContext. Call from a user gesture (armOnFirstGesture does it). */
  resume() { this.unlocked = true; this.be()?.resume(); this.applyGains(); }
  /** Arms a one-shot listener that unlocks audio on the first click/key/touch. Returns a cleanup. */
  armOnFirstGesture(target: Pick<Window, 'addEventListener' | 'removeEventListener'> | null = typeof window === 'undefined' ? null : window): () => void {
    if (!target) return () => {};
    this.hydrate();
    const names = ['pointerdown', 'keydown', 'touchstart'] as const;
    const off = () => names.forEach(n => target.removeEventListener(n, handler, true));
    const handler = () => { off(); this.resume(); };
    names.forEach(n => target.addEventListener(n, handler, true));
    return off;
  }

  playSfx(event: AudioEvent) {
    const s = this.settings;
    if (s.muted || !s.sfxEnabled || s.sfxVolume <= 0 || !this.unlocked) return;
    if (!this.scheduler.accept(event)) return;
    this.be()?.play(event);
  }
  /** Playback is always gated by the setting: it only starts when the player enabled music. */
  playMusic() { if (!this.settings.musicEnabled) this.update({ musicEnabled: true }); else this.applyGains(); }
  stopMusic() { this.update({ musicEnabled: false }); }
  setMusicEnabled(enabled: boolean) { if (enabled) this.resume(); this.update({ musicEnabled: enabled }); }
  setSfxEnabled(enabled: boolean) { if (enabled) this.resume(); this.update({ sfxEnabled: enabled }); }
  setMusicVolume(volume: number) { this.update({ musicVolume: clamp(volume, this.settings.musicVolume) }); }
  setSfxVolume(volume: number) { this.update({ sfxVolume: clamp(volume, this.settings.sfxVolume) }); }
  muteAll() { this.update({ muted: true }); }
  unmuteAll() { this.resume(); this.update({ muted: false }); }

  /** Rival nudges and table presence (the board calls these when a reaction or a join arrives). */
  playReaction() { this.playSfx('REACTION_RECEIVED'); }
  playPresence(kind: 'joined' | 'reconnected' = 'joined') { this.playSfx(kind === 'joined' ? 'PLAYER_JOINED' : 'PLAYER_RECONNECTED'); }
}

export const audioManager = new AudioManager();

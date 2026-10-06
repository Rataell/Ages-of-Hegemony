'use client';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { AlphaPlayerView } from '@aoh/server/alpha';
import { audioManager, type AudioSettings } from './audio-manager';
import { diffGame, type AudioSnapshot, type GameLike, type Presence } from './audio-diff';
import type { AudioEvent } from './audio-events';

/** Combat consequences wait for the dice animation (<=700ms) so the sound follows what the eye sees. */
const AFTER_ROLL = new Set<AudioEvent>(['HIT', 'GUARD_BLOCK', 'UNIT_LOST', 'RETREAT']);
const ROLL_MS = 700;

/**
 * Watches the authoritative projection and plays semantic sounds for what is NEW. The first render and a change of
 * game replay nothing. Optional `presence` ({id, connected}[]) lets the caller announce reconnections.
 */
export function useAlphaAudio(game: AlphaPlayerView | null | undefined, selfPlayerId: string, presence: Presence = []) {
  const prev = useRef<{ gameId: string; snapshot: AudioSnapshot } | null>(null);
  useEffect(() => audioManager.armOnFirstGesture(), []);
  useEffect(() => {
    if (!game) return;
    const before = prev.current?.gameId === game.gameId ? prev.current.snapshot : null;
    const { next, events } = diffGame(before, game as unknown as GameLike, selfPlayerId, presence);
    prev.current = { gameId: game.gameId, snapshot: next };
    const timers = events.map(event => AFTER_ROLL.has(event) ? setTimeout(() => audioManager.playSfx(event), ROLL_MS) : (audioManager.playSfx(event), null));
    return () => { for (const t of timers) if (t) clearTimeout(t); };
    // presence is intentionally read only when the game projection changes
  }, [game, selfPlayerId]);
  const settings = useAudioSettings();
  return { settings, manager: audioManager, playReaction: () => audioManager.playReaction(), playPresence: (kind?: 'joined' | 'reconnected') => audioManager.playPresence(kind) };
}

const SERVER_SETTINGS = audioManager.getSettings();
export function useAudioSettings(): AudioSettings {
  const settings = useSyncExternalStore(audioManager.subscribe, audioManager.getSettings, () => SERVER_SETTINGS);
  useEffect(() => { audioManager.hydrate(); }, []);
  return settings;
}

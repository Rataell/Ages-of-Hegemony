'use client';
import { useEffect, useState } from 'react';
import { audioManager } from './audio-manager';
import type { AudioEvent } from './audio-events';

export type DieFace = 'EMPTY' | 'IMPACT' | 'GUARD' | 'MANEUVER' | 'COMMAND';
const CYCLE: DieFace[] = ['IMPACT', 'GUARD', 'MANEUVER', 'COMMAND', 'EMPTY'];
export const FACE_LABEL: Record<DieFace, string> = { EMPTY: 'Vazio', IMPACT: 'Impacto', GUARD: 'Guarda', MANEUVER: 'Manobra', COMMAND: 'Comando' };
export const FACE_GLYPH: Record<DieFace, string> = { EMPTY: '○', IMPACT: '✦', GUARD: '⛨', MANEUVER: '➶', COMMAND: '♛' };
export const ROLL_TOTAL_MS = 600;
export const ROLL_STEP_MS = 60;

/**
 * Pure and deterministic: the frames a die shows while "rolling". It cycles the faces in a fixed order starting at a
 * die-specific offset and ALWAYS ends on the authoritative face. No randomness: the client never decides an outcome.
 */
export function rollFrames(finalFace: DieFace, dieIndex = 0, totalMs = ROLL_TOTAL_MS, stepMs = ROLL_STEP_MS): DieFace[] {
  const count = Math.max(1, Math.min(Math.floor(totalMs / stepMs), Math.floor(700 / stepMs)));
  const frames: DieFace[] = [];
  for (let k = 0; k < count - 1; k++) frames.push(CYCLE[(dieIndex * 2 + k) % CYCLE.length]!);
  frames.push(finalFace);
  return frames;
}

const asFace = (face: string): DieFace => (CYCLE.includes(face as DieFace) ? (face as DieFace) : 'EMPTY');

/**
 * Opt-in animated dice for a server battle record. `rolls` is attackerTactical or defenderTactical, untouched.
 * Wire: <DiceRoll rolls={battle.attackerTactical} animate={isNewBattle} />. Reduced motion shows the result at once.
 */
export function DiceRoll({ rolls, animate = true, label, ariaLabel, className = 'alpha-dice' }: { rolls: { unitId: string; face: string; grade?: number; effect?: string }[]; animate?: boolean; label?: string; ariaLabel?: string; className?: string }) {
  const finals = rolls.map(r => asFace(r.face));
  const key = finals.join('|');
  const [frame, setFrame] = useState(0);
  const [moving, setMoving] = useState(false);
  useEffect(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const total = rollFrames('EMPTY', 0).length;
    if (!animate || reduced || finals.length === 0) { setFrame(total); setMoving(false); return; }
    let k = 0; setFrame(0); setMoving(true);
    const timer = setInterval(() => {
      k++; setFrame(k);
      if (k >= total - 1) {
        clearInterval(timer); setMoving(false);
        for (const face of new Set(finals)) audioManager.playSfx(`DICE_RESULT_${face}` as AudioEvent);
      }
    }, ROLL_STEP_MS);
    return () => clearInterval(timer);
    // key encodes the authoritative faces
  }, [key, animate]);
  const plain = `${label ? `${label}: ` : ''}${finals.map(f => FACE_LABEL[f]).join(' e ') || 'nenhuma'}`;
  return <div className={`${className} dice-roll${moving ? ' is-rolling' : ''}`} role="img" aria-label={ariaLabel ?? plain}>
    {rolls.map((roll, i) => {
      const frames = rollFrames(finals[i]!, i), shown = moving ? frames[Math.min(frame, frames.length - 1)]! : finals[i]!;
      const grade = roll.grade ?? 1, roman = ['I', 'II', 'III'][grade - 1];
      return <span key={roll.unitId} className={`dice-face dice-${shown.toLowerCase()}`} title={`${roll.unitId} · Grau ${roman}: ${roll.effect ?? FACE_LABEL[finals[i]!]}`} aria-hidden="true">{moving ? `${FACE_GLYPH[shown]} ` : ''}{FACE_LABEL[shown]}{!moving && grade > 1 && <sup className="alpha-grade"> {roman}</sup>}</span>;
    })}
  </div>;
}

import type { GameRulesConfig, StabilityCategory } from '@aoh/game-domain';
export function clampStability(value: number): number {
  if (!Number.isFinite(value)) throw new RangeError('Stability must be finite');
  return Math.max(0, Math.min(100, Math.trunc(value)));
}
export function stabilityCategory(value: number, rules: GameRulesConfig): StabilityCategory {
  const stability = clampStability(value); const bands = rules.stabilityThresholds;
  if (stability <= bands.criticalMax) return 'CRITICAL';
  if (stability <= bands.unstableMax) return 'UNSTABLE';
  if (stability <= bands.tenseMax) return 'TENSE';
  if (stability <= bands.stableMax) return 'STABLE';
  return 'PROSPEROUS';
}

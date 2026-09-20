import { z } from 'zod';
import { NonNegativeIntegerSchema as N, PositiveIntegerSchema as P } from './core.js';

/** Three independent stacks per civilization and hex. In a city the military stack is the garrison. */
export const StackCategorySchema = z.enum(['military', 'civilians', 'fleets']);
export type StackCategory = z.infer<typeof StackCategorySchema>;
export const StackUsageSchema = z.strictObject({ used: N, limit: P });
export type StackUsage = z.infer<typeof StackUsageSchema>;
export const StackHexSchema = z.strictObject({ hexId: z.string().min(1), city: z.boolean(), military: StackUsageSchema, civilians: StackUsageSchema, fleets: StackUsageSchema });
export type StackHex = z.infer<typeof StackHexSchema>;
export const StackViewSchema = z.strictObject({
  /** Limits on a hex that is not a city. */
  defaults: z.strictObject({ military: P, civilians: P, fleets: P }),
  hexes: z.record(z.string(), StackHexSchema),
});
export type StackView = z.infer<typeof StackViewSchema>;

/** Pieces that never fight and are not ships are civilians. */
export const stackCategory = (entry: { domain: 'LAND' | 'SEA'; strength: number }): StackCategory => (entry.domain === 'SEA' ? 'fleets' : entry.strength === 0 ? 'civilians' : 'military');
export const STACK_LABEL: Record<StackCategory, string> = { military: 'Exército', civilians: 'Civis', fleets: 'Frota' };
export const stackLabel = (category: StackCategory, city: boolean) => (category === 'military' && city ? 'Guarnição' : STACK_LABEL[category]);
export const stackTag = (category: StackCategory, city: boolean, usage: StackUsage) => `${stackLabel(category, city)} ${usage.used}/${usage.limit}`;

/**
 * The one rule: `moving` pieces of one category would join `usage`. Returns the block reason or null.
 * The engine validates with it and the projection ships the same numbers, so preview and server cannot disagree.
 */
export function stackVerdict(category: StackCategory, city: boolean, usage: StackUsage, moving: number, hexId: string): string | null {
  if (moving <= 0 || usage.used + moving <= usage.limit) return null;
  return `Limite de pilha atingido em ${hexId}: ${stackTag(category, city, usage)}, ${moving === 1 ? 'a peça não cabe' : `as ${moving} peças não cabem`}.`;
}

/** The same verdict computed from the projected view, so the client can warn before the command exists. */
export function stackViewVerdict(view: StackView, moving: readonly StackCategory[], hexId: string): string | null {
  const hex = view.hexes[hexId];
  for (const category of StackCategorySchema.options) {
    const usage = hex ? hex[category] : { used: 0, limit: view.defaults[category] };
    const verdict = stackVerdict(category, hex?.city ?? false, usage, moving.filter(candidate => candidate === category).length, hexId);
    if (verdict) return verdict;
  }
  return null;
}

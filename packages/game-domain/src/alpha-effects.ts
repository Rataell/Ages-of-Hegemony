import { z } from 'zod';
/**
 * When a recurring resource effect is credited. ON_PRODUCE: with the PRODUCE action of the city it belongs to. ROUND_START:
 * when the round opens. MAINTENANCE: in integration and maintenance (the default for institutional income). ONCE: at the moment
 * the effect is earned or played (cards, abilities, world choices); it never recurs.
 */
export const EffectTimingSchema=z.enum(['ON_PRODUCE','ROUND_START','MAINTENANCE','ONCE']);
export type EffectTiming=z.infer<typeof EffectTimingSchema>;
export const AlphaEffectSchema=z.discriminatedUnion('kind',[
  z.strictObject({kind:z.literal('PRODUCTION'),resource:z.enum(['food','materials','wealth','knowledge','influence']),amount:z.number().int().min(1).max(5),timing:EffectTimingSchema.optional()}),
  z.strictObject({kind:z.enum(['STRENGTH','MOVEMENT','COMMAND']),amount:z.number().int().min(1).max(2)}),
]);
export type AlphaEffect=z.infer<typeof AlphaEffectSchema>;

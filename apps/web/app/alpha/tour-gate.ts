/**
 * F-01: situational tips (and the Callout they open) share the page with blocking surfaces — the Era turn, the round replay, the conflict call, the final
 * screen. The tip sits above them (z-index 60 over 40), so a tip fired by the very Era that just began covered the choices of the Era turn. While any of
 * these surfaces is up the tip neither fires nor shows; it stays pending (`progress.done` only changes when the player closes it) and appears afterwards.
 */
export interface TourSurfaces { phase: string; conflictCall: boolean; replay: boolean; winner: boolean }
export const tipsSuspended = ({ phase, conflictCall, replay, winner }: TourSurfaces): boolean => phase === 'ERA_TURN' || conflictCall || replay || winner;

/**
 * "At war" is a relation between TWO civilizations. The projection ships the table's whole war list to every seat (a declaration is public),
 * so a seat is at war with another one only when a pair holds both of them. Reading "some pair contains the other" is wrong from three
 * players on: when B fights C, A would see B as an enemy.
 */
export type WarPair = readonly [string, string];
export const atWarWith = (wars: readonly WarPair[], self: string, other: string): boolean =>
  self !== other && wars.some(pair => pair.includes(self) && pair.includes(other));

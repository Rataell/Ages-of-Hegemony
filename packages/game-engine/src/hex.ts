import { axialDistance, HexIdSchema, type AxialCoordinates, type HexId } from '@aoh/game-domain';

export function hexId({ q, r }: AxialCoordinates): HexId {
  if (!Number.isSafeInteger(q) || !Number.isSafeInteger(r)) throw new RangeError('Hex coordinates must be safe integers');
  return HexIdSchema.parse(`${q},${r}`);
}
export function hexNeighbors({ q, r }: AxialCoordinates): AxialCoordinates[] {
  return [{ q: q + 1, r }, { q: q + 1, r: r - 1 }, { q, r: r - 1 }, { q: q - 1, r }, { q: q - 1, r: r + 1 }, { q, r: r + 1 }];
}
export function hexDistance(a: AxialCoordinates, b: AxialCoordinates): number {
  return axialDistance(a, b);
}

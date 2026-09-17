export function safeInteger(value: number | bigint): number {
  const result = typeof value === 'bigint' ? Number(value) : value;
  if (!Number.isSafeInteger(result)) throw new RangeError('Game arithmetic exceeds safe integer range');
  return result;
}
export const sum = (values: readonly number[]): number => safeInteger(values.reduce((total, value) => total + BigInt(value), 0n));
export const multiply = (a: number, b: number): number => safeInteger(BigInt(a) * BigInt(b));
export const percent = (value: number, rate: number): number => safeInteger(BigInt(value) * BigInt(rate) / 100n);

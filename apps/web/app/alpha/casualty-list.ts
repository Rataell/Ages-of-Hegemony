/** Casualty list shown to the owner: the saved order (stack override, else civilization list, else the engine default), restricted to the kinds the owner fields. */
export function effectiveCasualtyList(defaults: string[], saved: { order: string[]; byHex: Record<string, string[]> }, scope: string | null, fielded: Set<string>): string[] {
  const base = (scope ? saved.byHex[scope] : undefined) ?? (saved.order.length ? saved.order : undefined) ?? defaults;
  const known = [...base, ...defaults.filter(kind => !base.includes(kind))];
  return known.filter(kind => fielded.has(kind));
}


/** What the government-reform surface should show in the last round of an Era: a decision only when one exists. */
export interface ReformInfo { window: boolean; planned: string | null; current: { government: string }; options: { government: string; unlocked: boolean; block: string | null }[] }
export type ReformState = 'closed' | 'planned' | 'none' | 'choose';

export function reformState(info: ReformInfo): ReformState {
  if (!info.window) return 'closed';
  if (info.planned) return 'planned';
  const eligible = info.options.some(option => option.government !== info.current.government && option.unlocked && option.block === null);
  return eligible ? 'choose' : 'none';
}

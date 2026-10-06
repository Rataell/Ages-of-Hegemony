import { EVENT_POLICY, PRIORITY, type AudioEvent } from './audio-events';

export type SchedulerOptions = { now: () => number; maxVoices?: number; priorityWindowMs?: number };
type Voice = { until: number; priority: number };

/**
 * Pure overlap control: per-event cooldown (identical events collapse), a global polyphony cap and priority.
 * A lower-priority event is dropped if a higher-priority one was accepted in the last priorityWindowMs.
 */
export function createScheduler({ now, maxVoices = 6, priorityWindowMs = 250 }: SchedulerOptions) {
  const lastByEvent = new Map<AudioEvent, number>();
  let recent: { at: number; priority: number }[] = [];
  let voices: Voice[] = [];
  return {
    /** True when the event should sound; the call itself registers it. */
    accept(event: AudioEvent): boolean {
      const t = now(), policy = EVENT_POLICY[event], priority = PRIORITY[policy.priority];
      voices = voices.filter(v => v.until > t);
      recent = recent.filter(r => t - r.at < priorityWindowMs);
      const last = lastByEvent.get(event);
      if (last !== undefined && t - last < policy.cooldownMs) return false;
      if (recent.some(r => r.priority > priority)) return false;
      if (voices.length >= maxVoices) {
        const lowest = Math.min(...voices.map(v => v.priority));
        if (priority <= lowest) return false;
        const index = voices.findIndex(v => v.priority === lowest);
        voices.splice(index, 1);
      }
      lastByEvent.set(event, t);
      recent.push({ at: t, priority });
      voices.push({ until: t + policy.durationMs, priority });
      return true;
    },
    reset() { lastByEvent.clear(); recent = []; voices = []; },
  };
}
export type Scheduler = ReturnType<typeof createScheduler>;

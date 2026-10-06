import { applyAlphaCommand } from '@aoh/game-engine';
import type { AlphaState, PlayerId } from '@aoh/game-domain';
import { redactStateForSeat } from './alpha-bot-view.js';
import { PERSONAS, PERSONA_ORDER, botPlan, eraTurnActions, recordFood, rng } from './alpha-bot-policy.js';
import { alphaLog, short } from './alpha-log.js';

/**
 * Bot seats of the external alpha (V1.1). A bot is a normal seat; its decisions come from the EXISTING playtest policy (alpha-bot-policy.ts), which only ever
 * sees `redactStateForSeat` (what a human in that seat could be sent) and acts through the canonical commands of the engine, one by one, validated like a
 * human's. Nothing here mutates the match except `applyAlphaCommand`.
 */
export type BotOutcome = { game: AlphaState; commands: number; rejected: number; fallback: boolean };
type Memory = { skill: string; seats: { id: string; persona: string }[]; rand: Record<string, () => number>; activations: Map<string, number>; failed: Map<string, Set<string>>; counters: { commands: number; rejected: number }; rejectedCodes: Set<string>; crashes: unknown[]; orderSeq: number; foodLog: unknown[]; seed: number };
const memories = new Map<string, Memory>();
const memoryOf = (roomId: string, seat: PlayerId, persona: string, seed: number): Memory => {
  const key = `${roomId}:${seat}`;
  let memory = memories.get(key);
  if (!memory) { memory = { skill: 'competent', seats: [{ id: seat, persona }], rand: { [seat]: rng(seed * 7919 + Number(seat.replace(/\D/g, '')) * 104729) }, activations: new Map(), failed: new Map(), counters: { commands: 0, rejected: 0 }, rejectedCodes: new Set(), crashes: [], orderSeq: 0, foodLog: [], seed }; memories.set(key, memory); if (memories.size > 512) memories.delete(memories.keys().next().value as string); }
  return memory;
};
export const botPersonaFor = (seed: number, index: number): string => PERSONA_ORDER[(index + seed) % PERSONA_ORDER.length]!;
export const isKnownPersona = (name: string | null): boolean => name !== null && name in PERSONAS;
/** Pause between "the round opened" and "Pronto", so a bot reads as a player and not as a broken script (never in tests: ALPHA_BOT_DELAY_MS=0). */
export const botDelayMs = (): number => { const configured = process.env.ALPHA_BOT_DELAY_MS; return configured !== undefined && configured !== '' ? Math.max(0, Number(configured)) : 500 + Math.floor(Math.random() * 1000); };

const player = (game: AlphaState, id: PlayerId) => game.players.find(p => p.playerId === id)!;

/** Everything a bot decides during one phase, short of confirming. Planning: Ambições, population, plan of Orders; Era turn: choices and posture. */
export function planBotSeat(roomId: string, game: AlphaState, seat: PlayerId, personaName: string, roomSeed: number): BotOutcome {
  const persona = isKnownPersona(personaName) ? personaName : 'balanced';
  const memory = memoryOf(roomId, seat, persona, roomSeed);
  let live = game;
  const box = {
    state: redactStateForSeat(live, seat), ctx: memory,
    apply: (id: PlayerId, command: Record<string, unknown>) => { const result = applyAlphaCommand(live, id, command); if (result.ok) live = result.value; return result; },
    refresh: () => redactStateForSeat(live, seat),
  };
  let fallback = false;
  try {
    if (live.phase === 'PLANNING') { recordFood(box); botPlan(box, seat); }
    else if (live.phase === 'ERA_TURN') eraTurnActions(box, seat);
  } catch (cause) {
    fallback = true;
    alphaLog('BOT_DECISION_FALLBACK', { room: short(roomId), seat, reason: 'policy_error', name: cause instanceof Error ? cause.name : 'Error' });
  }
  for (const code of memory.rejectedCodes) alphaLog('BOT_COMMAND_REJECTED', { room: short(roomId), seat, code });
  memory.rejectedCodes.clear();
  const commands = memory.counters.commands, rejected = memory.counters.rejected;
  memory.counters.commands = 0; memory.counters.rejected = 0;
  return { game: live, commands, rejected, fallback };
}

/**
 * Confirms the seat. If the engine refuses because a mandatory decision is still open (Ambições, a pending choice, the world event), the minimum legal
 * answer is given and the confirmation is retried: a match with a bot can never wait on a modal only a human could click. Nothing is invented.
 */
export function confirmBotSeat(roomId: string, game: AlphaState, seat: PlayerId): { game: AlphaState; ok: boolean; fallback: boolean } {
  let live = game, fallback = false;
  for (let attempt = 0; attempt < 8; attempt++) {
    const ready = applyAlphaCommand(live, seat, { type: 'READY', expectedVersion: live.version });
    if (ready.ok) { if (fallback) alphaLog('BOT_DECISION_FALLBACK', { room: short(roomId), seat, reason: 'minimal_answers' }); return { game: ready.value, ok: true, fallback }; }
    const me = player(live, seat);
    let next: ReturnType<typeof applyAlphaCommand> | null = null;
    if (!me.ambitionsChosen && me.ambitions.length >= 2) next = applyAlphaCommand(live, seat, { type: 'CHOOSE_AMBITIONS', expectedVersion: live.version, cardIds: me.ambitions.slice(0, 2) });
    else if (me.pendingChoices.length) { const choice = me.pendingChoices[0]!; next = applyAlphaCommand(live, seat, { type: 'RESOLVE_CHOICE', expectedVersion: live.version, choiceId: choice.id, optionId: choice.options[0]!.id }); }
    else if (live.cards.worldEvent && !live.cards.worldResponded.includes(seat)) next = applyAlphaCommand(live, seat, { type: 'WORLD_CHOICE', expectedVersion: live.version, choice: 'PRESTIGE' });
    if (!next || !next.ok) { alphaLog('BOT_DECISION_FALLBACK', { room: short(roomId), seat, reason: 'cannot_confirm', code: ready.error.code }); return { game: live, ok: false, fallback: true }; }
    live = next.value; fallback = true;
  }
  return { game: live, ok: false, fallback: true };
}
export const forgetBots = (roomId: string): void => { for (const key of [...memories.keys()]) if (key.startsWith(`${roomId}:`)) memories.delete(key); };

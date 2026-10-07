import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { alphaActionUsage, alphaClaimOptions, alphaUnitOptions, threatAlerts, threatView, urbanOptions } from '@aoh/game-engine';
import type { AlphaState, PlayerId } from '@aoh/game-domain';

/**
 * DEVELOPMENT-ONLY playtest log. One JSON object per line under docs/evidence/playtests/<date>-<gameId>/events.jsonl.
 * It only reads states (before/after a command) and writes local files: no network, no state mutation, so determinism,
 * replay and CAS are untouched. It is off unless ALPHA_PLAYTEST_LOG=1 and never runs when NODE_ENV=production.
 * Personal data never enters: seats are `player-N` labels and civilization ids; names, guest ids and addresses are not read.
 */
export const playtestEnabled = (env: Record<string, string | undefined> = process.env): boolean => env.ALPHA_PLAYTEST_LOG === '1' && env.NODE_ENV !== 'production';

export type PlaytestEvent = { seq: number; t: number; type: string; round: number; phase: string } & Record<string, unknown>;
export interface PlaytestSink { write(event: PlaytestEvent): void }

export class FileSink implements PlaytestSink {
  readonly file: string;
  constructor(readonly dir: string) { mkdirSync(dir, { recursive: true }); this.file = join(dir, 'events.jsonl'); }
  write(event: PlaytestEvent): void { appendFileSync(this.file, `${JSON.stringify(event)}\n`); }
}
export class MemorySink implements PlaytestSink {
  readonly events: PlaytestEvent[] = [];
  write(event: PlaytestEvent): void { this.events.push(event); }
}

const RESOURCE_KEYS = ['food', 'wood', 'stone', 'metal', 'wealth', 'knowledge', 'influence', 'culture'] as const;
const stockOf = (state: AlphaState, seat: PlayerId) => Object.fromEntries(RESOURCE_KEYS.map(key => [key, (state.players.find(p => p.playerId === seat)?.resources as Record<string, number> | undefined)?.[key] ?? 0]));
const seatOf = (state: AlphaState, seat: PlayerId) => state.core.players.find(p => p.id === seat)!;
const populationOf = (state: AlphaState, seat: PlayerId) => seatOf(state, seat).civilization.cities.reduce((n, c) => n + c.population, 0);
const levelsOf = (state: AlphaState, seat: PlayerId) => Object.fromEntries(state.cities.filter(c => c.currentOwnerId === seat).map(c => [c.cityId, c.level]));
const pairKey = (a: string, b: string) => [a, b].sort().join('~');

/** Key parameters of a command, never free text (names, notes) that could carry personal data. */
export function summarizeCommand(raw: unknown): Record<string, unknown> {
  const command = (raw ?? {}) as Record<string, unknown>;
  const pick: Record<string, unknown> = { type: command.type };
  for (const key of ['action', 'unit', 'advancementId', 'cityId', 'cardId', 'path', 'posture', 'choice', 'choiceId', 'optionId', 'treaty', 'targetId', 'recipientId', 'peopleId', 'unitId', 'fleetId', 'hexId', 'government', 'ambitionId']) if (command[key] !== undefined) pick[key] = command[key];
  if (command.count !== undefined) pick.count = command.count;
  if (command.type === 'SET_CASUALTY_PRIORITY') { pick.casualtyOrder = Array.isArray(command.order) ? command.order.filter(kind => typeof kind === 'string').slice(0, 10) : undefined; pick.hexId = command.hexId ?? null; }
  if (command.build && typeof command.build === 'object') pick.build = command.build;
  if (command.type === 'QUEUE_ORDER') {
    const order = (command.order ?? {}) as Record<string, unknown>;
    pick.order = { type: order.type, target: order.target, posture: order.posture, units: Array.isArray(order.unitIds) ? order.unitIds.length : undefined };
  }
  if (command.type === 'MANAGE') pick.manage = (command.command as Record<string, unknown> | undefined)?.type;
  return pick;
}

/** How many things a seat can choose from at the start of planning. Counts only; the options themselves are not stored. */
export function availableActions(state: AlphaState, seat: PlayerId) {
  const urban = urbanOptions(state, seat);
  const open = (list: { blocked?: unknown }[]) => list.filter(option => !option.blocked).length;
  const cityActions = Object.values(urban.cities).reduce((n, list) => n + open(list as { blocked?: unknown }[]), 0);
  const units = Object.values(alphaUnitOptions(state, seat));
  const claims = Object.values(alphaClaimOptions(state, seat)).reduce((n, list) => n + list.length, 0);
  const usage = alphaActionUsage(state, seat);
  return {
    cityActions, research: open(urban.research as { blocked?: unknown }[]), moves: units.reduce((n, u) => n + Object.keys(u.moves).length, 0), frontier: units.reduce((n, u) => n + u.frontier.length, 0),
    settle: units.filter(u => u.settleBlock === null).length, claims, orders: { limit: usage.limit, used: usage.used },
  };
}

/** Client-side moments a person causes, as short enums (never free text). Timing is measured against the server clock of the open round. */
export const UI_KINDS = ['panel_open', 'panel_close', 'decision_shown', 'decision_done', 'era_turn_shown', 'planning_idle', 'casualty_panel', 'diplomacy_panel'] as const;
export type UiKind = (typeof UI_KINDS)[number];

export class PlaytestRecorder {
  private seq = 0;
  private readonly openedAt = new Map<number, number>();
  private readonly stockAtOpen = new Map<string, Record<string, number>>();
  private readonly seenWars = new Set<string>();
  private readonly seenContacts = new Set<string>();
  private readonly seenTreaties = new Map<string, string>();
  private roundLogSeen = 0;
  private battlesSeen = 0;
  private eventsSeen = 0;
  private started = false;
  constructor(private readonly sink: PlaytestSink, private readonly clock: () => number = Date.now) {}

  private emit(state: AlphaState, type: string, fields: Record<string, unknown>): void {
    this.sink.write({ seq: ++this.seq, t: this.clock(), type, round: state.core.round, phase: state.phase, ...fields });
  }

  /** Call once with the opening state (round 1, PLANNING). */
  start(state: AlphaState): void {
    if (this.started) return;
    this.started = true;
    this.roundLogSeen = state.telemetry.roundLog.length; this.battlesSeen = state.battles.length; this.eventsSeen = state.events.length;
    this.emit(state, 'session_start', { preset: state.rules.preset, worldPreset: state.rules.worldPreset, mapSize: state.rules.mapSize, seed: state.telemetry.seed, rulesVersion: state.rulesVersion, seats: state.players.map(p => ({ seat: p.playerId, civilization: p.civilization, figure: p.leader?.leaderId ?? null })) });
    for (const t of state.treaties) this.seenTreaties.set(t.id, t.status);
    for (const w of state.wars) this.seenWars.add(pairKey(w[0], w[1]));
    this.openRound(state);
  }

  private openRound(state: AlphaState): void {
    this.openedAt.set(state.core.round, this.clock());
    for (const p of state.players) {
      const stock = stockOf(state, p.playerId); this.stockAtOpen.set(`${state.core.round}:${p.playerId}`, stock);
      const view = threatView(state, p.playerId) as unknown;
      this.emit(state, 'planning_open', { seat: p.playerId, available: availableActions(state, p.playerId), stock, population: populationOf(state, p.playerId), levels: levelsOf(state, p.playerId), threatsVisible: Array.isArray(view) ? view.length : 0, threatAlerts: threatAlerts(state, p.playerId).length });
    }
  }

  /** Observe one command result. `before` is the state the command was applied to; `result` is what applyAlphaCommand returned. */
  observe(before: AlphaState, seat: PlayerId, raw: unknown, result: { ok: true; value: AlphaState } | { ok: false; error: { code: string; message: string } }): void {
    if (!this.started) this.start(before);
    if (!result.ok) { this.emit(before, 'rejected', { seat, command: summarizeCommand(raw), code: result.error.code, message: result.error.message }); return; }
    const after = result.value, summary = summarizeCommand(raw);
    this.emit(before, 'command', { seat, command: summary });
    if (summary.type === 'READY') this.emit(before, 'ready', { seat, planningMs: this.clock() - (this.openedAt.get(before.core.round) ?? this.clock()), orders: alphaActionUsage(before, seat).byOrder });
    this.diff(before, after);
  }

  /** A human-side moment (panel opened, decision shown/answered). Detail is a short token like a panel name, never player text. */
  clientEvent(state: AlphaState, seat: PlayerId, kind: UiKind, detail: string): void {
    if (!this.started) this.start(state);
    this.emit(state, 'ui', { seat, kind, detail: detail.replace(/[^a-z0-9:_-]/gi, '').slice(0, 40), sinceOpenMs: this.clock() - (this.openedAt.get(state.core.round) ?? this.clock()) });
  }

  /** Observe automatic transitions that did not come from a command (timeouts). */
  observeTransition(before: AlphaState, after: AlphaState): void { if (!this.started) this.start(before); this.diff(before, after); }

  private diff(before: AlphaState, after: AlphaState): void {
    for (const p of after.players) {
      const prev = before.players.find(q => q.playerId === p.playerId);
      for (const id of p.research) if (!prev?.research.includes(id)) this.emit(after, 'research', { seat: p.playerId, advancementId: id, researched: p.research.length });
      for (const c of p.contacts) { const key = pairKey(p.playerId, c); if (!this.seenContacts.has(key)) { this.seenContacts.add(key); this.emit(after, 'contact', { seats: [p.playerId, c].sort() }); } }
    }
    for (const t of after.treaties) { if (this.seenTreaties.get(t.id) !== t.status) { this.seenTreaties.set(t.id, t.status); this.emit(after, 'treaty', { treaty: t.type, from: t.proposerId, to: t.recipientId, status: t.status }); } }
    for (const w of after.wars) { const key = pairKey(w[0], w[1]); if (!this.seenWars.has(key)) { this.seenWars.add(key); this.emit(after, 'war', { seats: [w[0], w[1]] }); } }
    for (const battle of after.battles.slice(this.battlesSeen)) {
      const grades = (tactical: { effect?: string }[]) => tactical.map(r => r.effect ?? '').filter(Boolean).length;
      this.emit(after, 'combat', {
        attacker: battle.attackerId, defender: battle.defenderId, world: battle.attackerId === 'world' || battle.defenderId === 'world', hex: battle.hexId,
        delta: battle.delta ?? battle.attackTotal - battle.defenseTotal, outcome: battle.outcome ?? null, winner: battle.winnerId, attackerPosture: battle.attackerPosture, defenderPosture: battle.defenderPosture,
        attackerPieces: battle.attackerUnits.length, defenderPieces: battle.defenderUnits.length, losses: battle.losses.length, retreat: battle.retreat !== null, signatureEffects: grades(battle.attackerTactical) + grades(battle.defenderTactical),
        fortified: battle.fortification !== null,
      });
    }
    this.battlesSeen = after.battles.length;
    for (const event of after.events.slice(this.eventsSeen)) {
      if (event.type.startsWith('THREAT') || event.type === 'RAID_ATTACK') this.emit(after, 'threat', { event: event.type, audience: event.audience });
      if (event.type === 'SAVE_UPGRADED') this.emit(after, 'save_upgraded', {});
    }
    this.eventsSeen = after.events.length;
    if (after.phase === 'ERA_TURN' && before.phase !== 'ERA_TURN') this.emit(after, 'era_turn', { era: after.eraTurn && typeof after.eraTurn === 'object' ? (after.eraTurn as { era?: unknown }).era : null });
    for (const entry of after.telemetry.roundLog.slice(this.roundLogSeen)) {
      this.emit(after, 'round_close', { seat: entry.playerId, closedRound: entry.round, era: entry.era, before: this.stockAtOpen.get(`${entry.round}:${entry.playerId}`) ?? null, after: entry.stock, population: entry.population, cities: entry.cities, cityLevels: entry.cityLevels, moods: entry.moods, orders: entry.orders, repeatedOrders: entry.repeatedOrders, researched: entry.researched, heritages: entry.heritages, resonance: { slots: entry.resonanceSlots, cycles: entry.resonanceCycles }, combats: entry.combats, casualties: entry.casualties, threatsAlive: entry.threatsAlive, prestige: entry.prestige, hegemonyPaths: entry.hegemonyPaths, produced: entry.produced, spent: entry.spent, lost: entry.lost, discarded: entry.discarded });
    }
    this.roundLogSeen = after.telemetry.roundLog.length;
    const roundChanged = after.core.round !== before.core.round || (after.phase === 'PLANNING' && before.phase !== 'PLANNING');
    if (after.phase === 'PLANNING' && roundChanged) {
      this.openRound(after);
    }
    if (after.core.status === 'FINISHED' && before.core.status !== 'FINISHED') this.emit(after, 'end', { winner: after.winner?.playerId ?? null, reason: after.winner?.reason ?? null, finalRound: after.core.round, prestige: after.players.map(p => ({ seat: p.playerId, prestige: p.prestige })) });
  }
}

/** One recorder per match, kept on globalThis so a hot reload keeps appending to the same file. Returns null when logging is off. */
type Registry = Map<string, PlaytestRecorder>;
const holder = globalThis as typeof globalThis & { aohPlaytestRecorders?: Registry };
export function playtestRecorderFor(gameId: string, env: Record<string, string | undefined> = process.env, root: string = process.cwd()): PlaytestRecorder | null {
  if (!playtestEnabled(env)) return null;
  const registry = holder.aohPlaytestRecorders ??= new Map();
  let recorder = registry.get(gameId);
  if (!recorder) {
    const day = new Date().toISOString().slice(0, 10);
    recorder = new PlaytestRecorder(new FileSink(join(env.ALPHA_PLAYTEST_DIR ?? join(root, 'docs', 'evidence', 'playtests'), `${day}-${gameId}`)));
    registry.set(gameId, recorder);
  }
  return recorder;
}

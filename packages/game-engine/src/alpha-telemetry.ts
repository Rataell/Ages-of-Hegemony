import { AlphaOrderTypeSchema, CityLevelSchema, heritageAdvance, type AlphaState, type RoundTelemetry } from '@aoh/game-domain';
import { hegemonyProgress } from './alpha-hegemony.js';
import { alphaStorageCapacity, ledgerOf } from './alpha-resources.js';
import { alphaActionUsage } from './alpha-actions.js';

const LEDGER_KEYS = ['food', 'materials', 'wealth', 'knowledge', 'influence'] as const;
const sumPools = (pools: readonly Record<string, number>[]): Record<string, number> => Object.fromEntries(LEDGER_KEYS.map(key => [key, pools.reduce((total, pool) => total + (pool[key] ?? 0), 0)]));
const MAX_LOG = 260;

/** Called when planning closes, before the reserved orders resolve: what each civilization committed, by Order type. */
export function snapshotOrders(state: AlphaState): void {
  state.telemetry.pendingOrders = Object.fromEntries(state.players.map(player => [player.playerId, { ...alphaActionUsage(state, player.playerId).byOrder }]));
}

/**
 * Writes one RoundTelemetry per civilization for the round that is closing (V5.1b playtest telemetry). Pure data from the
 * authoritative state: no clock, so replays stay byte-identical. Never projected to players.
 */
export function recordRoundTelemetry(state: AlphaState): void {
  const round = state.core.round;
  const battles = state.battles.filter(battle => battle.round === round);
  // Aggregate counters the engine never maintained: battles, outcomes and casualties are counted once per closing round.
  state.telemetry.battles += battles.length;
  for (const battle of battles) { const key = battle.outcome ?? 'LEGACY'; state.telemetry.battleResults[key] = (state.telemetry.battleResults[key] ?? 0) + 1; state.telemetry.casualties += battle.losses.length; }
  const camps = state.threats.filter(threat => threat.kind === 'CAMP'), pirates = state.threats.filter(threat => threat.kind === 'PIRATE');
  const threatsAlive: Record<string, number> = { camp: camps.length, pirate: pirates.length, marching: state.threats.filter(threat => threat.status === 'MARCHING').length };
  for (const level of [1, 2, 3] as const) threatsAlive[`level${level}`] = state.threats.filter(threat => threat.level === level).length;
  const entries: RoundTelemetry[] = state.players.map(progress => {
    const owner = state.core.players.find(player => player.id === progress.playerId)!;
    const ledger = ledgerOf(state, progress.playerId);
    const metas = state.cities.filter(meta => meta.currentOwnerId === progress.playerId);
    const orders: Record<string, number> = {};
    const committed = state.telemetry.pendingOrders[progress.playerId] ?? {};
    for (const type of AlphaOrderTypeSchema.options) orders[type] = Math.max(committed[type] ?? 0, progress.ordersSpent[type] ?? 0);
    const repeated = Object.values(orders).reduce((total, count) => total + Math.max(0, count - 1), 0);
    const storage = alphaStorageCapacity(state, progress.playerId);
    const stock = progress.resources as unknown as Record<string, number>;
    const mine = battles.filter(battle => battle.attackerId === progress.playerId || battle.defenderId === progress.playerId);
    const combats: Record<string, number> = {};
    for (const battle of mine) { const key = battle.outcome ?? 'LEGACY'; combats[key] = (combats[key] ?? 0) + 1; }
    const lostUnits = new Set(mine.flatMap(battle => battle.losses));
    const casualties = [...lostUnits].length;
    const hegemony = Object.fromEntries(hegemonyProgress(state, progress.playerId).map(entry => [entry.path, entry.requirements.filter(requirement => requirement.met).length]));
    return {
      round, era: progress.era, playerId: progress.playerId, orders, repeatedOrders: repeated,
      produced: sumPools([ledger.production, ledger.mining, ledger.trade, ledger.institutions, ledger.other]),
      spent: sumPools([ledger.expenses, ledger.upkeepPaid]), lost: sumPools([ledger.losses]), discarded: sumPools([ledger.discarded]),
      stock: { ...stock }, atCap: (Object.keys(storage) as (keyof typeof storage)[]).filter(key => (stock[key] ?? 0) >= storage[key]),
      population: owner.civilization.cities.reduce((total, city) => total + city.population, 0), cities: owner.civilization.cities.length,
      cityLevels: metas.map(meta => CityLevelSchema.options.indexOf(meta.level) + 1), moods: metas.map(meta => meta.mood),
      governed: state.events.filter(event => event.round === round && event.type === 'PROMOTE_MOOD' && event.audience?.includes(progress.playerId)).length,
      researched: progress.research.length, heritages: progress.research.filter(id => heritageAdvance(id)).length,
      resonanceSlots: progress.resonance.slots.length, resonanceCycles: progress.resonance.cycles,
      pulse: state.worldPulse.current && state.worldPulse.resolvedRound === round ? state.worldPulse.current.name : null,
      combats, casualties, victories: progress.victories, threatsAlive, prestige: progress.prestige, hegemonyPaths: hegemony,
    };
  });
  state.telemetry.pendingOrders = {};
  state.telemetry.roundLog = [...state.telemetry.roundLog.filter(entry => entry.round !== round), ...entries].slice(-MAX_LOG);
}

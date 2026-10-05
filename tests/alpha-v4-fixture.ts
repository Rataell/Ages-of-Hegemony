import type { AlphaState } from '@aoh/game-domain';

type Loose = Record<string, unknown>;

/**
 * Builds a faithful v4-shaped snapshot by removing exactly what v5 added or renamed: seven-resource pools, city metadata,
 * trade offers, independents, raiders, world pulse, telemetry, the phase indicator, balance/world rules, battle posture
 * fields, report mining/discard fields, the Ascension era and the Pioneer piece (called Settler in v4).
 */
export function toV4Snapshot(state: AlphaState): Loose {
  const raw = structuredClone(state) as unknown as Loose;
  raw.schemaVersion = 4;
  for (const key of ['phase', 'cities', 'tradeOffers', 'independents', 'raidBands', 'worldPulse', 'telemetry', 'roundLedgers']) delete raw[key];
  const rules = raw.rules as Loose;
  delete rules.balance; delete rules.worldPreset;
  rules.milestones = [1, 2, 3, 4, 5].map(n => ({ cities: n, population: n, territory: n, districts: n, research: n, development: 1, government: true, contacts: 0 }));
  for (const player of raw.players as Loose[]) {
    delete player.resources; delete player.legacyCulturalTrack;
    if (player.era === 'ASCENSION') player.era = 'EMPIRES';
  }
  for (const unit of raw.units as Loose[]) if (unit.kind === 'COLONIST') unit.kind = 'SETTLER';
  for (const battle of raw.battles as Loose[]) for (const key of ['attackerPosture', 'defenderPosture', 'attackBreakdown', 'defenseBreakdown', 'attackerTactical', 'defenderTactical', 'fortification']) delete battle[key];
  for (const report of raw.roundReports as Loose[]) { for (const key of ['mining', 'discarded', 'production', 'other', 'losses', 'expenses']) delete report[key]; }
  return raw;
}

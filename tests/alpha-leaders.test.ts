import { describe, expect, it } from 'vitest';
import {
  ALPHA_LEADER_BUDGET, AlphaStateSchema, CIVILIZATIONS, LEADERS, PlayerIdSchema, figuresOfCivilization, isCore10Chassis, leaderOfCivilization, leaderStateFor, recommendedFigure, type AlphaLeader, type AlphaState,
} from '@aoh/game-domain';
import {
  alphaCommandCapacity, alphaStorageCapacity, applyAlphaCommand, beginAlphaPlanning, createAlphaGame, deserializeAlphaState, hexDistance, institutionBonus,
  leaderAbilityBlock, leaderOf, migrateSnapshotV4ToV5, occupyCity, serializeAlphaState, setAlphaPhase, unitSupply,
} from '@aoh/game-engine';
import { completeRound, must } from './alpha-rounds.js';
import { toV4Snapshot } from './alpha-v4-fixture.js';

const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
/** p1 plays `civilization`; p2 plays another one so the pair is always legal. */
const match = (civilization: string, seed = 121, figureId?: string): AlphaState => beginAlphaPlanning(createAlphaGame({
  gameId: `leaders-${civilization}-${seed}`, seed, preset: 'STANDARD',
  players: [{ id: 'p1', name: 'Um', civilization, figureId }, { id: 'p2', name: 'Dois', civilization: civilization === 'aurelia' ? 'valgard' : 'aurelia' }],
}));
/** Every Figura a player can pick: the 30 of the Core 10 plus the two unselectable chassis (pre-1.2 leaders stay readable but are not offered). */
const FIGURES = LEADERS.filter(l => !l.legacy);
const matchOf = (leader: AlphaLeader, seed = 121) => match(leader.civilizationId, seed, leader.id);
const leaderOfP1 = (leader: AlphaLeader) => leader.civilizationId;
const ability = (state: AlphaState, actor = p1) => applyAlphaCommand(state, actor, { type: 'LEADER_ABILITY', expectedVersion: state.version });
const activeTreaty = (state: AlphaState) => state.treaties.push({ id: 't1', proposerId: p1, recipientId: p2, type: 'TRADE_AGREEMENT', status: 'ACTIVE', deal: { give: { food: 0, wood: 0, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0, culture: 0 }, receive: { food: 0, wood: 0, stone: 0, metal: 0, wealth: 0, knowledge: 0, influence: 0, culture: 0 } }, createdRound: 1, expiresRound: 4 });
const names = ['Incas (Tawantinsuyu)', 'Helênicos', 'Mesopotâmicos', 'Nórdicos', 'Índia Antiga', 'Romanos', 'Chineses', 'Egípcios', 'Veyra', 'Israel e Judá', 'Persas', 'Elyra'];

describe('leader catalog', () => {
  it('offers three Figuras to each Core 10 civilization and keeps the old leaders only readable', () => {
    expect(CIVILIZATIONS.map(c => c.name)).toEqual(names);
    for (const civilization of CIVILIZATIONS) {
      const offered = figuresOfCivilization(civilization.id);
      expect(offered, civilization.id).toHaveLength(isCore10Chassis(civilization.id) ? 3 : 1);
      expect(leaderOfCivilization(civilization.id)!.civilizationId).toBe(civilization.id);
      expect(offered.every(l => !l.legacy)).toBe(true);
      if (isCore10Chassis(civilization.id)) expect(offered.map(l => l.id)).toContain(recommendedFigure(civilization.id)!.id);
    }
    expect(FIGURES.filter(l => isCore10Chassis(l.civilizationId))).toHaveLength(30);
    expect(new Set(LEADERS.map(l => l.id)).size).toBe(LEADERS.length);
    expect(new Set(FIGURES.map(l => l.name)).size).toBe(FIGURES.length);
    for (const leader of LEADERS) { expect(leader.title.length).toBeGreaterThan(3); expect(leader.symbol).toMatch(/^[A-Z]{2}$/); expect(leader.passiveAbility.description.length).toBeGreaterThan(10); expect(leader.eraAbility.description).toContain('Uma vez por Era'); }
    for (const id of ['leader-odisseu', 'leader-alexandre-magno', 'leader-agamenon']) expect(figuresOfCivilization('valgard').map(l => l.id)).toContain(id);
  });

  it('keeps every number inside one central budget and never produces, recruits or wins', () => {
    for (const leader of LEADERS) {
      const passive = leader.passiveAbility.effect, era = leader.eraAbility.effect;
      expect(['STORAGE', 'SUPPLY', 'INTEGRATION']).toContain(passive.kind);
      if (passive.kind === 'STORAGE') expect(passive.amount).toBe(passive.resource === 'metal' ? ALPHA_LEADER_BUDGET.passive.storageMetal : ALPHA_LEADER_BUDGET.passive.storageBase);
      if (passive.kind === 'SUPPLY') expect(passive.amount).toBe(ALPHA_LEADER_BUDGET.passive.supplyRadius);
      if (passive.kind === 'INTEGRATION') expect(passive.amount).toBe(ALPHA_LEADER_BUDGET.passive.integrationPerCivic);
      expect(['ROUND_BONUS', 'MOOD_ALL', 'COHESION_ALL', 'TREATY_EXTEND']).toContain(era.kind);
      if (era.kind === 'ROUND_BONUS') expect(era.amount).toBe(ALPHA_LEADER_BUDGET.ability[era.bonus === 'STRENGTH' ? 'strength' : era.bonus === 'MOVEMENT' ? 'movement' : 'command']);
      if (era.kind === 'MOOD_ALL') expect(era.amount).toBe(ALPHA_LEADER_BUDGET.ability.moodAll);
      if (era.kind === 'COHESION_ALL') expect(era.amount).toBe(ALPHA_LEADER_BUDGET.ability.cohesionAll);
      if (era.kind === 'TREATY_EXTEND') expect(era.rounds).toBe(ALPHA_LEADER_BUDGET.ability.treatyRounds);
    }
  });

  it('gives the three Figuras of a civilization different strategic directions and never produces resources', () => {
    for (const leader of LEADERS) expect(leader.passiveAbility.effect.kind).not.toBe('PRODUCTION');
    for (const civ of CIVILIZATIONS.filter(c => isCore10Chassis(c.id))) {
      const three = figuresOfCivilization(civ.id);
      expect(new Set(three.map(l => JSON.stringify([l.passiveAbility.effect, l.eraAbility.effect]))).size, civ.id).toBe(3);
    }
  });
});

describe('automatic assignment', () => {
  it('gives every civilization its own leader when the match starts', () => {
    for (const leader of FIGURES) {
      const state = matchOf(leader);
      expect(state.players[0]!.civilization).toBe(leaderOfP1(leader));
      expect(state.players[0]!.leader).toEqual({ leaderId: leader.id, eraAbilityUsed: false });
      expect(leaderOf(state, p1)!.id).toBe(leader.id);
      expect(state.players[1]!.leader!.leaderId).toBe(leaderOfCivilization(state.players[1]!.civilization)!.id);
    }
    // Without a choice the recommended Figura (★) is assigned.
    expect(match('valgard').players[0]!.leader!.leaderId).toBe('leader-alexandre-magno');
  });

  it('never accepts a leader that belongs to another civilization', () => {
    const state = match('aurelia');
    state.players[0]!.leader = leaderStateFor('valgard');
    expect(AlphaStateSchema.safeParse(state).success).toBe(false);
    expect(leaderStateFor('aurelia', 'leader-odisseu')).toBeNull();
    expect(() => match('aurelia', 121, 'leader-odisseu')).toThrow('Figura inválida');
    const nobody = match('aurelia');
    nobody.players[0]!.civilization = null;
    expect(AlphaStateSchema.safeParse(nobody).success).toBe(false);
  });

  it('fills the leader for states created before leaders existed', () => {
    const state = match('kor');
    state.players.forEach(p => { p.leader = null; });
    const result = applyAlphaCommand(state, p1, { type: 'CHOOSE_AMBITIONS', expectedVersion: state.version, cardIds: state.players[0]!.ambitions.slice(0, 2) });
    expect(result.ok && result.value.players.every(p => p.leader !== null)).toBe(true);
    const old = toV4Snapshot(match('orinth'));
    const migrated = migrateSnapshotV4ToV5(old);
    expect(migrated.ok && migrated.value.players[0]!.leader).toEqual({ leaderId: 'leader-sun-tzu', eraAbilityUsed: false });
  });
});

describe('passives apply once, for the right civilization', () => {
  it('adds a storage bonus exactly once to exactly one resource', () => {
    for (const leader of FIGURES) {
      const effect = leader.passiveAbility.effect;
      if (effect.kind !== 'STORAGE') continue;
      const state = matchOf(leader);
      const neutral = leader.civilizationId === 'saren' ? match('valgard', 121, 'leader-alexandre-magno') : match('saren', 121, 'leader-ashoka');
      const withLeader = alphaStorageCapacity(state, p1), without = alphaStorageCapacity(neutral, p1);
      const key = effect.resource as keyof typeof withLeader;
      for (const capacity of Object.keys(withLeader) as (keyof typeof withLeader)[]) expect(withLeader[capacity] - without[capacity], `${leader.name} ${capacity}`).toBe(capacity === key ? effect.amount : 0);
      expect(alphaStorageCapacity(state, p2)).toEqual(alphaStorageCapacity(matchOf(leader), p2));
    }
  });

  it('extends supply by exactly one hex for supply leaders only', () => {
    for (const leader of FIGURES) {
      const state = matchOf(leader);
      const city = state.core.map.find(t => t.id === state.core.players[0]!.civilization.cities[0]!.hexId)!;
      const tile = state.core.map.find(t => !['SEA', 'UNKNOWN'].includes(t.terrain) && hexDistance(city, t) === state.rules.supplyRadius + 1)!;
      const unit = { id: 'u', ownerId: p1, kind: 'PIONEER' as const, hexId: tile.id, recruitedRound: 1 };
      expect(unitSupply(state, unit).supplied, leader.name).toBe(leader.passiveAbility.effect.kind === 'SUPPLY');
      const far = state.core.map.find(t => !['SEA', 'UNKNOWN'].includes(t.terrain) && hexDistance(city, t) === state.rules.supplyRadius + 2)!;
      expect(unitSupply(state, { ...unit, hexId: far.id }).supplied).toBe(false);
    }
  });

  it('adds integration to the civic action exactly once for integration leaders', () => {
    for (const leader of FIGURES) {
      let state = matchOf(leader, 122);
      occupyCity(state, p1, 'capital-2' as never);
      state = completeRound(state);setAlphaPhase(state,'URBAN_ACTIONS');
      const before = state.cities.find(c => c.cityId === 'capital-2')!.integration;
      const done = must(state, p1, { type: 'URBAN_ACTION', cityId: 'capital-2', action: 'CIVIC_ACTION' });
      const gained = done.cities.find(c => c.cityId === 'capital-2')!.integration - before;
      const bonus = leader.passiveAbility.effect.kind === 'INTEGRATION' ? leader.passiveAbility.effect.amount : 0;
      expect(gained, leader.name).toBe(state.rules.balance.integrationPerAction + bonus);
    }
  });
});

describe('era abilities', () => {
  it('works once per Era for every leader, in its own way, without spending commands or producing anything', () => {
    for (const leader of FIGURES) {
      const state = matchOf(leader);
      activeTreaty(state);
      const effect = leader.eraAbility.effect;
      const commands = alphaCommandCapacity(state, p1), strength = institutionBonus(state, p1, 'STRENGTH'), movement = institutionBonus(state, p1, 'MOVEMENT');
      const moods = state.cities.filter(c => c.currentOwnerId === p1).map(c => c.mood), cohesions = state.cities.filter(c => c.currentOwnerId === p1).map(c => c.localCohesion);
      const resources = JSON.stringify(state.players[0]!.resources), spent = state.players[0]!.spentCommands;
      const result = ability(state);
      expect(result.ok, leader.name).toBe(true);
      if (!result.ok) continue;
      const after = result.value;
      expect(after.players[0]!.leader).toEqual({ leaderId: leader.id, eraAbilityUsed: true });
      expect(JSON.stringify(after.players[0]!.resources)).toBe(resources);
      expect(after.players[0]!.spentCommands).toBe(spent);
      if (effect.kind === 'ROUND_BONUS') {
        expect(alphaCommandCapacity(after, p1)).toBe(commands + (effect.bonus === 'COMMAND' ? effect.amount : 0));
        expect(institutionBonus(after, p1, 'STRENGTH')).toBe(strength + (effect.bonus === 'STRENGTH' ? effect.amount : 0));
        expect(institutionBonus(after, p1, 'MOVEMENT')).toBe(movement + (effect.bonus === 'MOVEMENT' ? effect.amount : 0));
      }
      if (effect.kind === 'MOOD_ALL') expect(after.cities.filter(c => c.currentOwnerId === p1).map(c => c.mood)).toEqual(moods.map(m => Math.min(after.rules.balance.promoteMoodCeiling, m + effect.amount)));
      if (effect.kind === 'COHESION_ALL') expect(after.cities.filter(c => c.currentOwnerId === p1).map(c => c.localCohesion)).toEqual(cohesions.map(c => Math.min(100, c + effect.amount)));
      if (effect.kind === 'TREATY_EXTEND') expect(after.treaties[0]!.expiresRound).toBe(4 + effect.rounds);
      const again = ability(after);
      expect(again, `${leader.name} second use`).toMatchObject({ ok: false, error: { code: 'RULE_FAILURE', message: expect.stringContaining('já foi usada nesta Era') } });
      expect(AlphaStateSchema.safeParse(after).success).toBe(true);
    }
  });

  it('never touches the other civilization', () => {
    for (const leader of FIGURES) {
      const state = matchOf(leader);
      activeTreaty(state);
      const otherBefore = JSON.stringify({ cities: state.cities.filter(c => c.currentOwnerId === p2), effects: state.players[1]!.temporaryEffects, leader: state.players[1]!.leader });
      const result = ability(state);
      if (!result.ok) throw new Error(result.error.message);
      expect(JSON.stringify({ cities: result.value.cities.filter(c => c.currentOwnerId === p2), effects: result.value.players[1]!.temporaryEffects, leader: result.value.players[1]!.leader })).toBe(otherBefore);
    }
  });

  it('is unusable by a player without a leader, by outsiders and outside planning', () => {
    const state = match('thalos');
    state.players[1]!.leader = null;
    state.players[1]!.civilization = null;
    expect(leaderAbilityBlock(state, p2)).toBe('Sua civilização ainda não tem um líder.');
    expect(ability(state, PlayerIdSchema.parse('stranger'))).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    const urban = match('thalos');setAlphaPhase(urban,'URBAN_ACTIONS');
    expect(ability(urban)).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } });
  });

  it('refuses an ability that would change nothing and keeps it available', () => {
    const state = match('dravik', 121, 'leader-ciro-o-grande');
    expect(ability(state)).toMatchObject({ ok: false, error: { message: 'Nenhum tratado ativo para prorrogar.' } });
    expect(state.players[0]!.leader!.eraAbilityUsed).toBe(false);
    const mood = match('aurelia');
    mood.cities.filter(c => c.currentOwnerId === p1).forEach(c => { c.mood = mood.rules.balance.promoteMoodCeiling; });
    expect(ability(mood)).toMatchObject({ ok: false });
  });

  it('lasts only for the round it was used in', () => {
    const state = match('nymara', 121, 'leader-ramses-ii');
    const used = ability(state);
    if (!used.ok) throw new Error(used.error.message);
    expect(institutionBonus(used.value, p1, 'STRENGTH')).toBe(institutionBonus(state, p1, 'STRENGTH') + 2);
    const next = completeRound(used.value);
    expect(institutionBonus(next, p1, 'STRENGTH')).toBe(institutionBonus(state, p1, 'STRENGTH'));
    expect(next.players[0]!.leader!.eraAbilityUsed).toBe(true);
  });
});

describe('Era reset', () => {
  it('makes the ability available again exactly when the Era advances, and only then', () => {
    const state = match('dravik');
    state.rules.milestones[0] = { cities: 0, population: 0, territory: 0, districts: 0, research: 0, development: 0, contacts: 0, government: false, requiredCriteria: 1 };
    const used = ability(state);
    if (!used.ok) throw new Error(used.error.message);
    const sameEra = completeRound(used.value);
    expect(sameEra.players[0]!.era).toBe('FOUNDATION');
    expect(sameEra.players[0]!.leader!.eraAbilityUsed).toBe(true);
    expect(ability(sameEra)).toMatchObject({ ok: false });
    sameEra.rules.roundsPerEra = 2;
    const advanced = completeRound(sameEra);
    expect(advanced.players[0]!.era).toBe('EXPANSION');
    expect(advanced.players[0]!.leader).toEqual({ leaderId: 'leader-dario-i', eraAbilityUsed: false });
    expect(ability(advanced).ok).toBe(true);
    expect(advanced.players[1]!.leader!.eraAbilityUsed).toBe(false);
  });
});

describe('determinism and persistence', () => {
  it('replays to identical states and survives serialization', () => {
    const play = () => {
      let state = match('meridia', 123);
      state = must(state, p1, { type: 'LEADER_ABILITY' });
      state = completeRound(state);
      return state;
    };
    expect(serializeAlphaState(play())).toBe(serializeAlphaState(play()));
    const state = play();
    const restored = deserializeAlphaState(serializeAlphaState(state));
    expect(restored.ok && restored.value).toEqual(state);
    expect(restored.ok && restored.value.players[0]!.leader).toEqual({ leaderId: 'leader-hamurabi', eraAbilityUsed: true });
  });

  it('shows the viewer their own leader state and the reason the ability is blocked', async () => {
    const { alphaPlayerView } = await import('../apps/server/src/alpha-projection.js');
    const state = match('dravik', 121, 'leader-ciro-o-grande');
    const view = alphaPlayerView(state, p1)!;
    expect(view.self.leader).toEqual({ leaderId: 'leader-ciro-o-grande', eraAbilityUsed: false });
    expect(view.leaderBlock).toBe('Nenhum tratado ativo para prorrogar.');
    activeTreaty(state);
    expect(alphaPlayerView(state, p1)!.leaderBlock).toBeNull();
    expect(alphaPlayerView(state, p2)!.self.leader!.leaderId).toBe('leader-mama-ocllo');
  });
});

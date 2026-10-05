import { describe, expect, it } from 'vitest';
import { ADVANCEMENTS, AlphaStateSchema, PlayerIdSchema, StackViewSchema, alphaRules, stackCategory, stackViewVerdict, type AlphaState, type AlphaUnit, type StackCategory } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, combatPreview, createAlphaGame, createGame, migrateSnapshotV3ToV4, recruitBlock, resolveBattleWithFaces, stackBlock, stackLimit, stackView } from '@aoh/game-engine';
import { resolveOrders } from '../packages/game-engine/src/alpha-phases.js';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';
import { readyAll } from './alpha-rounds.js';

const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
type Kind = AlphaUnit['kind'];
const config = () => alphaRules().balance.stack;
const { commandOne, commandTwo, naval, doctrine } = config().upgrades;

/** Ten hexes in a row: p1's city at 0,0 (coast), p2's at 7,0, open sea at 8,0 and 9,0. Nobody is at war. */
function arena(seed = 5) {
  const core = createGame({ gameId: `stack-${seed}`, seed, players: [{ id: p1, name: 'Um', resources: { food: 30, materials: 30, wealth: 30, knowledge: 0, influence: 10 } }, { id: p2, name: 'Dois' }],
    map: Array.from({ length: 10 }, (_, q) => ({ id: `${q},0`, q, r: 0, terrain: q === 0 ? 'COAST' : q >= 8 ? 'SEA' : 'PLAINS' })),
    initialCities: [{ id: 'c1', ownerId: p1, hexId: '0,0', name: 'Aurora' }, { id: 'c2', ownerId: p2, hexId: '7,0', name: 'Fronteira' }] });
  if (!core.ok) throw new Error(core.error.message);
  const migrated = migrateSnapshotV3ToV4(core.value); if (!migrated.ok) throw new Error(migrated.error.message);
  const state = beginAlphaPlanning(migrated.value);
  state.players.forEach(player => { player.knownHexIds = state.core.map.map(tile => tile.id); });
  state.units = []; state.threats = [];
  return state;
}
let serial = 0;
const put = (state: AlphaState, owner: typeof p1, kind: Kind, hexId: string, count = 1) => {
  const made: AlphaUnit[] = [];
  for (let i = 0; i < count; i++) { const unit = { id: `u${String(++serial).padStart(4, '0')}`, ownerId: owner, kind, hexId: hexId as never, recruitedRound: 1 }; state.units.push(unit); made.push(unit); }
  return made;
};
/** Grants the advancements together with every prerequisite, so the state stays valid. */
const research = (state: AlphaState, ...ids: string[]) => {
  const byId = new Map(ADVANCEMENTS.map(node => [node.id, node])), owned = new Set<string>(), visit = (id: string): void => { if (owned.has(id)) return; owned.add(id); byId.get(id)!.prerequisites.forEach(visit); };
  ids.forEach(visit); if (owned.size) state.players[0]!.era = 'ASCENSION'; state.players[0]!.research = ADVANCEMENTS.filter(node => owned.has(node.id)).map(node => node.id);
};
const cityMeta = (state: AlphaState, id = 'c1') => state.cities.find(city => city.cityId === id)!;
const move = (state: AlphaState, units: AlphaUnit[], to: string, id = 'mv') => applyAlphaCommand(state, p1, { type: 'QUEUE_ORDER', expectedVersion: state.version, order: { id, type: 'MOVE', unitIds: units.map(unit => unit.id), path: [to] } });
const accepted = (result: ReturnType<typeof move>) => { if (!result.ok) throw new Error(result.error.message); return true; };
const blocked = (result: ReturnType<typeof move>) => !result.ok && result.error.message.includes('Limite de pilha atingido');

describe('land military limit 6 / 7 / 8', () => {
  for (const [name, owned, limit] of [['base', [], 6], ['Command I', [commandOne], 7], ['Command II', [commandTwo], 8]] as const) {
    it(`${name}: ${limit} fit, the next one does not`, () => {
      const state = arena(); research(state, ...owned);
      expect(stackLimit(state, p1, '3,0', 'military')).toBe(limit);
      put(state, p1, 'INFANTRY', '3,0', limit - 1);
      const [walker] = put(state, p1, 'INFANTRY', '2,0');
      expect(accepted(move(state, [walker!], '3,0'))).toBe(true);
      put(state, p1, 'INFANTRY', '3,0');
      const refused = move(state, [walker!], '3,0');
      expect(blocked(refused)).toBe(true);
      expect(!refused.ok && refused.error.message).toContain(`Exército ${limit}/${limit}`);
    });
  }

  it('refuses a group that does not fully fit and says how many', () => {
    const state = arena(); put(state, p1, 'INFANTRY', '3,0', 5);
    const group = put(state, p1, 'INFANTRY', '2,0', 2);
    const refused = move(state, group, '3,0');
    expect(blocked(refused)).toBe(true);
    expect(!refused.ok && refused.error.message).toContain('as 2 peças não cabem');
    expect(move(state, group.slice(0, 1), '3,0').ok).toBe(true);
  });

  it('never touches a stack that is already above the limit, and lets it leave', () => {
    const state = arena(); const crowd = put(state, p1, 'INFANTRY', '2,0', 9);
    expect(stackLimit(state, p1, '2,0', 'military')).toBe(6);
    expect(move(state, crowd.slice(0, 3), '3,0').ok).toBe(true);
    expect(state.units.filter(unit => unit.hexId === '2,0')).toHaveLength(9);
  });

  it('counts each civilization separately', () => {
    const state = arena(); put(state, p2, 'INFANTRY', '3,0', 6);
    const [walker] = put(state, p1, 'INFANTRY', '2,0');
    // Foreign presence is a diplomatic matter and is refused by the existing rule, never by the stack limit.
    const refused = move(state, [walker!], '3,0');
    expect(!refused.ok && refused.error.message).toContain('presença de outra civilização');
    expect(blocked(refused)).toBe(false);
  });

  it('the upgrade advancements exist, are military ones and Command II requires Command I', () => {
    const byId = new Map(ADVANCEMENTS.map(node => [node.id, node]));
    for (const id of [commandOne, commandTwo, naval, doctrine]) expect(byId.has(id), id).toBe(true);
    expect([commandOne, commandTwo, naval, doctrine].map(id => byId.get(id)!.name)).toEqual(['Treino de Manobras', 'Guerra de Movimento', 'Arquitetura Naval', 'Defesa Profunda']);
    expect(byId.get(commandTwo)!.convergence).toBe(true);
    expect(byId.get(commandTwo)!.pair).toBe('war-iv');
  });
});

describe('civilians', () => {
  it('have their own stack of 2, separate from the army', () => {
    const state = arena(); put(state, p1, 'INFANTRY', '3,0', 6); put(state, p1, 'PIONEER', '3,0');
    expect(stackCategory(state.rules.units.PIONEER)).toBe('civilians');
    expect(stackCategory(state.rules.units.ENVOY)).toBe('civilians');
    const [second, third] = put(state, p1, 'PIONEER', '2,0', 2);
    expect(accepted(move(state, [second!], '3,0'))).toBe(true);
    put(state, p1, 'ENVOY', '3,0');
    expect(blocked(move(state, [third!], '3,0'))).toBe(true);
    expect(stackView(state, p1).hexes['3,0']).toMatchObject({ military: { used: 6, limit: 6 }, civilians: { used: 2, limit: 2 } });
  });

  it('do not use military room and military pieces do not use civilian room', () => {
    const state = arena(); put(state, p1, 'PIONEER', '3,0', 2);
    const [soldier] = put(state, p1, 'INFANTRY', '2,0');
    expect(accepted(move(state, [soldier!], '3,0'))).toBe(true);
    const full = arena(); put(full, p1, 'INFANTRY', '3,0', 6);
    const [scout] = put(full, p1, 'PIONEER', '2,0');
    expect(accepted(move(full, [scout!], '3,0'))).toBe(true);
  });

  it('are not upgraded by Command advancements', () => {
    const state = arena(); research(state, commandOne, commandTwo);
    expect(stackLimit(state, p1, '3,0', 'civilians')).toBe(2);
  });
});

describe('city garrison 6 → 10', () => {
  const levels = ['NONE', 'PALISADE', 'STONE_WALL', 'FORTRESS', 'BASTION', 'CITADEL'] as const;

  it('follows base + military district + fortification + doctrine, capped at 10', () => {
    const cfg = config();
    for (const level of levels) for (const district of [false, true]) for (const withDoctrine of [false, true]) {
      const state = arena();
      if (district) state.core.players[0]!.civilization.cities[0]!.districts.push({ type: 'MILITARY', builtRound: 1 });
      cityMeta(state).fortification = { level, state: 'INTACT' };
      research(state, ...(withDoctrine ? [doctrine] : []));
      const expected = Math.min(cfg.cityMax, cfg.cityBase + (district ? cfg.cityBonus.militaryDistrict : 0) + cfg.cityBonus.fortification[level] + (withDoctrine ? cfg.cityBonus.doctrine : 0));
      expect(stackLimit(state, p1, '0,0', 'military'), `${level}/${district}/${withDoctrine}`).toBe(expected);
      expect(expected).toBeLessThanOrEqual(10);
    }
    expect([cfg.cityBase, cfg.cityMax]).toEqual([6, 10]);
  });

  it('reaches 10 only with everything and never goes past it', () => {
    const state = arena(); state.core.players[0]!.civilization.cities[0]!.districts.push({ type: 'MILITARY', builtRound: 1 });
    cityMeta(state).fortification = { level: 'CITADEL', state: 'INTACT' }; research(state, doctrine);
    expect(stackLimit(state, p1, '0,0', 'military')).toBe(10);
  });

  it('blocks the seventh unit in a plain city and the eleventh in a full one', () => {
    const plain = arena(); put(plain, p1, 'INFANTRY', '0,0', 6);
    const [walker] = put(plain, p1, 'INFANTRY', '1,0');
    const refused = move(plain, [walker!], '0,0');
    expect(blocked(refused)).toBe(true);
    expect(!refused.ok && refused.error.message).toContain('Guarnição 6/6');
    const full = arena(); full.core.players[0]!.civilization.cities[0]!.districts.push({ type: 'MILITARY', builtRound: 1 });
    cityMeta(full).fortification = { level: 'CITADEL', state: 'INTACT' }; research(full, doctrine);
    put(full, p1, 'INFANTRY', '0,0', 9);
    const [ninth] = put(full, p1, 'INFANTRY', '1,0'), [tenth] = put(full, p1, 'INFANTRY', '1,0');
    expect(accepted(move(full, [ninth!], '0,0'))).toBe(true);
    put(full, p1, 'INFANTRY', '0,0');
    expect(blocked(move(full, [tenth!], '0,0'))).toBe(true);
  });

  it('a city uses its own limit, not the field limit, and Command upgrades do not raise it', () => {
    const state = arena(); research(state, commandOne, commandTwo);
    expect(stackLimit(state, p1, '0,0', 'military')).toBe(6);
    expect(stackLimit(state, p1, '2,0', 'military')).toBe(8);
  });
});

describe('sea: fleets 4 → 5', () => {
  it('holds 4 fleets per civilization and hex, and 5 with the naval upgrade', () => {
    for (const [owned, limit] of [[[], 4], [[naval], 5]] as const) {
      const state = arena(); research(state, ...owned);
      put(state, p1, 'FLEET', '9,0', limit - 1);
      const [ship] = put(state, p1, 'FLEET', '8,0');
      expect(accepted(move(state, [ship!], '9,0'))).toBe(true);
      put(state, p1, 'FLEET', '9,0');
      const refused = move(state, [ship!], '9,0');
      expect(blocked(refused)).toBe(true);
      expect(!refused.ok && refused.error.message).toContain(`Frota ${limit}/${limit}`);
    }
  });

  it('counts fleets apart from the garrison of a coastal city', () => {
    const state = arena(); put(state, p1, 'INFANTRY', '0,0', 6); put(state, p1, 'FLEET', '0,0', 3);
    const [ship] = put(state, p1, 'FLEET', '1,0');
    state.core.map.find(tile => tile.id === '1,0')!.terrain = 'COAST';
    expect(accepted(move(state, [ship!], '0,0'))).toBe(true);
    expect(stackView(state, p1).hexes['0,0']).toMatchObject({ city: true, military: { used: 6, limit: 6 }, fleets: { used: 3, limit: 4 } });
  });
});

describe('RECRUIT', () => {
  const recruitable = () => { const state = arena(); state.players[0]!.era = 'EXPANSION'; return state; };

  it('is blocked when the city garrison is full and allowed one below', () => {
    const state = recruitable(); put(state, p1, 'INFANTRY', '0,0', 5);
    expect(recruitBlock(state, p1, 'c1', 'INFANTRY')).toBeNull();
    put(state, p1, 'INFANTRY', '0,0');
    expect(recruitBlock(state, p1, 'c1', 'INFANTRY')).toContain('Limite de pilha atingido');
    const urban = readyAll(state);
    const result = applyAlphaCommand(urban, p1, { type: 'URBAN_ACTION', expectedVersion: urban.version, cityId: 'c1', action: 'RECRUIT', unit: 'INFANTRY' });
    expect(result).toMatchObject({ ok: false, error: { message: expect.stringContaining('Limite de pilha atingido') } });
    expect(urban.units).toHaveLength(6);
  });

  it('uses the garrison limit raised by fortification', () => {
    const state = recruitable(); put(state, p1, 'INFANTRY', '0,0', 6);
    expect(recruitBlock(state, p1, 'c1', 'INFANTRY')).not.toBeNull();
    cityMeta(state).fortification = { level: 'FORTRESS', state: 'INTACT' };
    expect(recruitBlock(state, p1, 'c1', 'INFANTRY')).toBeNull();
  });

  it('checks civilians and fleets against their own stacks', () => {
    const state = recruitable(); put(state, p1, 'PIONEER', '0,0', 2);
    expect(recruitBlock(state, p1, 'c1', 'PIONEER')).toContain('Civis 2/2');
    expect(recruitBlock(state, p1, 'c1', 'INFANTRY')).toBeNull();
    put(state, p1, 'FLEET', '0,0', 4);
    expect(recruitBlock(state, p1, 'c1', 'FLEET')).toContain('Frota 4/4');
  });

  it('counts pieces already ordered into the city this round', () => {
    const state = recruitable(); put(state, p1, 'INFANTRY', '0,0', 5);
    const [walker] = put(state, p1, 'INFANTRY', '1,0');
    expect(recruitBlock(state, p1, 'c1', 'INFANTRY')).toBeNull();
    const queued = move(state, [walker!], '0,0'); if (!queued.ok) throw new Error(queued.error.message);
    expect(recruitBlock(queued.value, p1, 'c1', 'INFANTRY')).toContain('Limite de pilha atingido');
  });
});

describe('MOVE: queueing and resolution', () => {
  it('counts other queued orders that end on the same hex', () => {
    const state = arena(); put(state, p1, 'INFANTRY', '3,0', 5);
    const [a] = put(state, p1, 'INFANTRY', '2,0'), [b] = put(state, p1, 'INFANTRY', '2,0');
    const first = move(state, [a!], '3,0', 'first'); if (!first.ok) throw new Error(first.error.message);
    expect(blocked(move(first.value, [b!], '3,0', 'second'))).toBe(true);
    const cancelled = applyAlphaCommand(first.value, p1, { type: 'CANCEL_ORDER', expectedVersion: first.value.version, orderId: 'first' });
    if (!cancelled.ok) throw new Error(cancelled.error.message);
    expect(accepted(move(cancelled.value, [b!], '3,0', 'second'))).toBe(true);
  });

  it('validates again when the order resolves: a hex that filled up meanwhile refuses the move and nothing moves twice', () => {
    const state = arena(); put(state, p1, 'INFANTRY', '3,0', 5);
    const [walker] = put(state, p1, 'INFANTRY', '2,0');
    const queued = move(state, [walker!], '3,0'); if (!queued.ok) throw new Error(queued.error.message);
    const later = structuredClone(queued.value); put(later, p1, 'INFANTRY', '3,0');
    resolveOrders(later, ['MOVE']);
    expect(later.units.find(unit => unit.id === walker!.id)!.hexId).toBe('2,0');
    expect(later.events.some(event => event.type === 'ORDER_FAILED' && event.message.includes('Limite de pilha atingido'))).toBe(true);
    resolveOrders(later, ['MOVE']);
    expect(later.units.filter(unit => unit.hexId === '3,0')).toHaveLength(6);
    const open = structuredClone(queued.value);
    resolveOrders(open, ['MOVE']);
    expect(open.units.find(unit => unit.id === walker!.id)!.hexId).toBe('3,0');
    expect(AlphaStateSchema.safeParse(open).success).toBe(true);
  });
});

describe('battle: retreat and advance', () => {
  function battle(options: { attackers?: number; defenders?: number; refuge?: number; refugeOwner?: typeof p2 } = {}) {
    const state = arena(); state.wars = [[p1, p2]];
    const attackers = put(state, p1, 'INFANTRY', '3,0', options.attackers ?? 8), defenders = put(state, p2, 'INFANTRY', '4,0', options.defenders ?? 4);
    if (options.refuge) put(state, options.refugeOwner ?? p2, 'INFANTRY', '5,0', options.refuge);
    const order = { id: 'atk', type: 'ATTACK' as const, unitIds: attackers.map(unit => unit.id), target: '4,0' as never, posture: 'ASSAULT' as const };
    return { state, order, attackers, defenders };
  }
  const win = (attackers: AlphaUnit[], defenders: AlphaUnit[]) => ({ ...Object.fromEntries(attackers.map(unit => [unit.id, 'IMPACT' as const])), ...Object.fromEntries(defenders.map(unit => [unit.id, 'EMPTY' as const])) });

  it('sends the beaten defender to a hex with room', () => {
    const { state, order, attackers, defenders } = battle({ attackers: 6, defenders: 4, refuge: 2 });
    resolveBattleWithFaces(state, p1, order, win(attackers, defenders));
    const record = state.battles[0]!;
    expect(record.winnerId).toBe(p1);
    expect(record.retreat).toBe('5,0');
    const survivors = defenders.filter(unit => !record.losses.includes(unit.id));
    expect(survivors.length).toBeGreaterThan(0);
    expect(state.units.filter(unit => unit.ownerId === p2 && unit.hexId === '5,0')).toHaveLength(2 + survivors.length);
  });

  it('applies the existing loss rule when no hex can take the survivors', () => {
    const { state, order, attackers, defenders } = battle({ attackers: 6, defenders: 4, refuge: 6 });
    resolveBattleWithFaces(state, p1, order, win(attackers, defenders));
    const record = state.battles[0]!;
    expect(record.winnerId).toBe(p1);
    expect(record.retreat).toBeNull();
    expect(record.losses).toEqual(expect.arrayContaining(defenders.map(unit => unit.id)));
    expect(state.units.filter(unit => unit.ownerId === p2 && unit.hexId === '5,0')).toHaveLength(6);
    expect(state.units.some(unit => unit.id === defenders[0]!.id)).toBe(false);
  });

  it('refuses a refuge whose room is smaller than the survivors, even if it has some', () => {
    const { state, order, attackers, defenders } = battle({ attackers: 6, defenders: 6, refuge: 5 });
    resolveBattleWithFaces(state, p1, order, win(attackers, defenders));
    const record = state.battles[0]!;
    // Combat kills at most three; the survivors need more than the one free slot, so the existing loss rule removes them too.
    expect(record.winnerId).toBe(p1);
    expect(record.retreat).toBeNull();
    expect(state.units.filter(unit => unit.ownerId === p2 && unit.hexId === '5,0')).toHaveLength(5);
    expect(defenders.every(unit => record.losses.includes(unit.id))).toBe(true);
  });

  it('a victorious force advances only as far as the target stack limit allows, in id order', () => {
    const { state, order, attackers, defenders } = battle({ attackers: 8, defenders: 1 });
    const preview = combatPreview(state, p1, order);
    expect(preview.advance).toMatchObject({ total: 8, stays: 2 });
    expect(preview.advance.note).toContain('Limite de pilha atingido');
    resolveBattleWithFaces(state, p1, order, win(attackers, defenders));
    expect(state.battles[0]!.winnerId).toBe(p1);
    expect(state.units.filter(unit => unit.ownerId === p1 && unit.hexId === '4,0').map(unit => unit.id)).toEqual(attackers.slice(0, 6).map(unit => unit.id));
    expect(state.units.filter(unit => unit.ownerId === p1 && unit.hexId === '3,0').map(unit => unit.id)).toEqual(attackers.slice(6).map(unit => unit.id));
    expect(state.events.some(event => event.type === 'STACK_LIMIT')).toBe(true);
  });

  it('with Command II eight pieces advance', () => {
    const { state, order, attackers, defenders } = battle({ attackers: 8, defenders: 1 }); research(state, commandTwo);
    expect(combatPreview(state, p1, order).advance).toMatchObject({ stays: 0, note: null });
    resolveBattleWithFaces(state, p1, order, win(attackers, defenders));
    expect(state.units.filter(unit => unit.ownerId === p1 && unit.hexId === '4,0')).toHaveLength(8);
    expect(state.events.some(event => event.type === 'STACK_LIMIT')).toBe(false);
  });

  it('a losing attacker stays where it was and the stack does not change', () => {
    const { state, order, attackers, defenders } = battle({ attackers: 2, defenders: 6 });
    resolveBattleWithFaces(state, p1, order, { ...Object.fromEntries(attackers.map(unit => [unit.id, 'EMPTY' as const])), ...Object.fromEntries(defenders.map(unit => [unit.id, 'IMPACT' as const])) });
    expect(state.battles[0]!.winnerId).toBe(p2);
    expect(state.units.filter(unit => unit.ownerId === p2 && unit.hexId === '4,0')).toHaveLength(6);
    expect(state.units.filter(unit => unit.ownerId === p1).every(unit => unit.hexId === '3,0')).toBe(true);
  });

  it('is deterministic: the same seed gives the same stacks after the same battle', () => {
    const run = () => { const { state, order } = battle({ attackers: 8, defenders: 3, refuge: 4 }); resolveBattleWithFaces(state, p1, order); return { units: state.units.map(unit => `${unit.id}@${unit.hexId}`), battle: state.battles[0]! }; };
    serial = 0; const first = run(); serial = 0; const second = run();
    expect(second).toEqual(first);
  });
});

describe('preview and server parity', () => {
  const categories = (state: AlphaState, movers: AlphaUnit[]): StackCategory[] => movers.map(unit => stackCategory(state.rules.units[unit.kind]));

  it('the projected view gives the same verdict as the engine for every occupancy and mover mix', () => {
    const targets = ['0,0', '2,0', '9,0'];
    let compared = 0;
    for (const target of targets) for (const kind of ['INFANTRY', 'PIONEER', 'FLEET'] as const) for (const upgrade of [[], [commandOne, commandTwo, naval, doctrine]] as const) {
      const state = arena(); research(state, ...upgrade);
      if (upgrade.length) cityMeta(state).fortification = { level: 'FORTRESS', state: 'INTACT' };
      const from = target === '9,0' ? '8,0' : '1,0';
      for (let present = 0; present <= 10; present++) for (const moving of [1, 2, 3]) {
        state.units = [];
        put(state, p1, kind, target, present);
        const movers = put(state, p1, kind, from, moving);
        const engine = stackBlock(state, p1, movers, target), view = stackViewVerdict(stackView(state, p1), categories(state, movers), target);
        expect(view, `${target} ${kind} present=${present} moving=${moving} upgrades=${upgrade.length}`).toEqual(engine);
        compared++;
      }
    }
    expect(compared).toBe(3 * 3 * 11 * 3 * 2);
  });

  it('the queue command agrees with the preview', () => {
    for (let present = 0; present <= 8; present++) for (const moving of [1, 2]) {
      const state = arena(); put(state, p1, 'INFANTRY', '3,0', present);
      const movers = put(state, p1, 'INFANTRY', '2,0', moving);
      const preview = stackViewVerdict(stackView(state, p1), categories(state, movers), '3,0');
      expect(move(state, movers, '3,0').ok, `present=${present} moving=${moving}`).toBe(preview === null);
    }
  });

  it('includes queued arrivals as used and matches the server check for the next order', () => {
    const state = arena(); put(state, p1, 'INFANTRY', '3,0', 5);
    const [a] = put(state, p1, 'INFANTRY', '2,0'), [b] = put(state, p1, 'INFANTRY', '2,0');
    const queued = move(state, [a!], '3,0', 'first'); if (!queued.ok) throw new Error(queued.error.message);
    const view = stackView(queued.value, p1);
    expect(view.hexes['3,0']!.military).toEqual({ used: 6, limit: 6 });
    expect(stackViewVerdict(view, ['military'], '3,0')).not.toBeNull();
    expect(blocked(move(queued.value, [b!], '3,0', 'second'))).toBe(true);
  });

  it('is exposed only to its owner, validates against its schema and leaves the state alone', () => {
    const state = arena(); put(state, p1, 'INFANTRY', '2,0', 3); put(state, p2, 'INFANTRY', '5,0', 4);
    const before = JSON.stringify(state);
    const own = alphaPlayerView(state, p1)!, other = alphaPlayerView(state, p2)!;
    expect(JSON.stringify(state)).toBe(before);
    expect(StackViewSchema.safeParse(own.stacks).success).toBe(true);
    expect(own.stacks).toEqual(stackView(state, p1));
    expect(own.stacks.hexes['2,0']!.military).toEqual({ used: 3, limit: 6 });
    expect(Object.keys(own.stacks.hexes)).not.toContain('5,0');
    expect(Object.keys(other.stacks.hexes)).not.toContain('2,0');
    expect(own.stacks.defaults).toEqual({ military: 6, civilians: 2, fleets: 4 });
  });

  it('the attack preview explains the limit before any command', () => {
    const state = arena(); state.wars = [[p1, p2]];
    const attackers = put(state, p1, 'INFANTRY', '3,0', 7); put(state, p2, 'INFANTRY', '4,0', 1);
    const order = { id: 'atk', type: 'ATTACK' as const, unitIds: attackers.map(unit => unit.id), target: '4,0' as never, posture: 'ASSAULT' as const };
    const preview = combatPreview(state, p1, order);
    expect(preview.ok).toBe(true);
    expect(preview.advance.note).toBe('Limite de pilha atingido em 4,0: se vencer, 6 de 7 peças avançam e 1 permanecem em 3,0.');
  });
});

describe('configuration', () => {
  it('keeps every number in the central balance', () => {
    expect(config()).toMatchObject({ military: 6, militaryCommandOne: 7, militaryCommandTwo: 8, civilians: 2, cityBase: 6, cityMax: 10, fleets: 4, fleetsUpgraded: 5 });
    expect(alphaRules().balance.stack).toEqual(createAlphaGame({ gameId: 'stack-cfg', seed: 1, preset: 'STANDARD', players: [{ id: 'p1', name: 'Um' }, { id: 'p2', name: 'Dois' }] }).rules.balance.stack);
  });
});

import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, BattlePostureSchema, threatComposition, type Threat } from '@aoh/game-domain';
import { applyAlphaCommand, resolveBattle, resolveBattleWithFaces, validateMilitaryOrder } from '@aoh/game-engine';
import { completeRound, must } from './alpha-rounds.js';
import { P1, P2, P3, attackOrder, line, put, tryValidate, type Kind } from './v12-audit-combat-helpers.js';

/**
 * Lane B · Alpha V1.2 combat audit. Every `it.fails` below is a REPRO of a bug/rule gap found by reading the code: the body states the
 * EXPECTED behaviour and currently throws, so vitest reports it as passing. When the bug is fixed the test starts to "fail" and must be
 * flipped to a plain `it`. Plain `it` tests are guards (behaviour that is correct today) or CHARACTERIZATIONS (current behaviour that the
 * report flags as a rule/balance/UX decision). IDs (B-nn) match docs/audit/alpha-v1.2-lane-b-combat.md.
 */
const win = (attackers: string[], defenders: string[]) => ({ ...Object.fromEntries(attackers.map(id => [id, 'IMPACT' as const])), ...Object.fromEntries(defenders.map(id => [id, 'EMPTY' as const])) });
const ids = (units: { id: string }[]) => units.map(unit => unit.id);

describe('B-01 · attack cost uses the terrain movement cost of the TARGET hex', () => {
  // The shared arena (tests/alpha-arena.ts) gives p1 a free +5 movement effect, which hides this rule; `line()` does not.
  it.fails('REPRO: Engenho de cerco (movimento 1) can attack a city on Colinas', () => {
    const state = line({ terrain: { 7: 'HILLS' } }); state.wars = [[P1, P2]];
    const siege = put(state, P1, 'SIEGE', 6);
    expect(tryValidate(() => validateMilitaryOrder(state, P1, attackOrder([siege], 7)))).toBeNull();
  });
  it.fails('REPRO: Engenho de cerco can attack a unit in a Floresta', () => {
    const state = line({ terrain: { 5: 'FOREST' } }); state.wars = [[P1, P2]];
    const siege = put(state, P1, 'SIEGE', 4); put(state, P2, 'INFANTRY', 5);
    expect(tryValidate(() => validateMilitaryOrder(state, P1, attackOrder([siege], 5)))).toBeNull();
  });
  it.fails('REPRO: a mixed stack (Infantaria + Cerco) is blocked as a whole by its slowest piece', () => {
    const state = line({ terrain: { 5: 'FOREST' } }); state.wars = [[P1, P2]];
    const stack = [put(state, P1, 'INFANTRY', 4), put(state, P1, 'SIEGE', 4)]; put(state, P2, 'INFANTRY', 5);
    expect(tryValidate(() => validateMilitaryOrder(state, P1, attackOrder(stack, 5)))).toBeNull();
  });
  it.fails('REPRO: Infantaria (movimento 2) can attack a unit on Montanhas (cost 3), where the defender gets +2', () => {
    const state = line({ terrain: { 5: 'MOUNTAINS' } }); state.wars = [[P1, P2]];
    const inf = put(state, P1, 'INFANTRY', 4); put(state, P2, 'INFANTRY', 5);
    expect(tryValidate(() => validateMilitaryOrder(state, P1, attackOrder([inf], 5)))).toBeNull();
  });
  it('CHARACTERIZATION: the same targets on Planície are fine (the block is only the terrain cost)', () => {
    const state = line(); state.wars = [[P1, P2]];
    const siege = put(state, P1, 'SIEGE', 6);
    expect(tryValidate(() => validateMilitaryOrder(state, P1, attackOrder([siege], 7)))).toBeNull();
  });
});

describe('authorization guards (correct today)', () => {
  it('refuses an attack without war, with a treaty, on own pieces and on an empty hex', () => {
    const state = line({ players: 3, cities: [['c1', P1, 0], ['c2', P2, 4], ['c3', P3, 8]] });
    const a = put(state, P1, 'INFANTRY', 3), own = put(state, P1, 'INFANTRY', 2); put(state, P2, 'INFANTRY', 4);
    expect(tryValidate(() => validateMilitaryOrder(state, P1, attackOrder([a], 4)))).toBe('Declare guerra antes de ordenar um ataque a outra civilização.');
    state.treaties.push({ id: 't', proposerId: P1, recipientId: P2, type: 'ALLIANCE', status: 'ACTIVE', deal: { give: {}, receive: {} } as never, createdRound: 1, expiresRound: 9 } as never);
    expect(tryValidate(() => validateMilitaryOrder(state, P1, attackOrder([a], 4)))).toBe('Declare guerra antes de ordenar um ataque a outra civilização.');
    expect(tryValidate(() => validateMilitaryOrder(state, P1, attackOrder([a], 2)))).toBe('Não há adversário conhecido nesse destino.');
    void own;
    const rival = put(state, P2, 'INFANTRY', 5, 'rival');
    expect(tryValidate(() => validateMilitaryOrder(state, P1, attackOrder([rival], 4)))).toBe('A ordem contém uma peça que não pertence a você.');
  });
  it('a piece can sit in only one order per round and strengthless pieces never attack', () => {
    let state = line(); state.wars = [[P1, P2]];
    const a = put(state, P1, 'INFANTRY', 3, 'a1'); put(state, P1, 'PIONEER', 3, 'pio'); put(state, P2, 'INFANTRY', 4, 'd1');
    state = must(state, P1, { type: 'QUEUE_ORDER', order: attackOrder([a], 4) });
    const second = applyAlphaCommand(state, P1, { type: 'QUEUE_ORDER', order: { id: 'm', type: 'MOVE', unitIds: ['a1'], path: ['2,0'] }, expectedVersion: state.version });
    expect(second).toMatchObject({ ok: false, error: { message: 'Cada peça pode participar de apenas uma ordem por rodada.' } });
    const civil = applyAlphaCommand(state, P1, { type: 'QUEUE_ORDER', order: { ...attackOrder([state.units.find(u => u.id === 'pio')!], 4), id: 'civil' }, expectedVersion: state.version });
    expect(civil).toMatchObject({ ok: false, error: { message: 'Esta peça não participa de ataques.' } });
  });
  it('a war declared in the same round is accepted at queue time and the attack resolves after it (DIPLOMACY before CONFLICTS)', () => {
    let state = line(); state.wars = [];
    const a = put(state, P1, 'INFANTRY', 3, 'a1'), b = put(state, P1, 'INFANTRY', 3, 'a2'), c = put(state, P1, 'INFANTRY', 3, 'a3'); put(state, P2, 'INFANTRY', 4, 'd1');
    state = must(state, P1, { type: 'DECLARE_WAR', targetId: P2 });
    state = must(state, P1, { type: 'QUEUE_ORDER', order: attackOrder([a, b, c], 4) });
    state = completeRound(state);
    expect(state.wars).toEqual([[P1, P2]]);
    expect(state.battles).toHaveLength(1);
  });
});

describe('B-02 · attack on a hex shared by an enemy and a third party', () => {
  it.fails('REPRO: p1 (at war with p2 only) captures p3\'s city because p2\'s garrison stands inside it', () => {
    // p2 is allied/open-border with p3 and stationed in p3's city. p1 is at war with p2 only. p1 needs no war with p3 to take p3's city.
    const state = line({ players: 3, cities: [['c1', P1, 0], ['c2', P2, 4], ['c3', P3, 8]] }); state.wars = [[P1, P2]];
    const atk = [1, 2, 3, 4].map(i => put(state, P1, 'INFANTRY', 7, `a${i}`)); put(state, P2, 'INFANTRY', 8, 'd1');
    resolveBattleWithFaces(state, P1, attackOrder(atk, 8), win(ids(atk), ['d1']));
    expect(state.cities.find(c => c.cityId === 'c3')!.currentOwnerId).toBe(P3); // expected: p3 keeps its city (no war with p3)
    expect(state.wars).toEqual([[P1, P2]]);
  });
});

describe('B-03 · retreat destination', () => {
  const threat = (hex: string): Threat => ({ id: 'camp-x', kind: 'CAMP', hexId: hex as never, homeHexId: hex as never, level: 1, status: 'CAMPED', composition: threatComposition('CAMP', 1, 0), createdRound: 1, lastActedRound: 0, rewardPaid: false, fresh: false });
  it.fails('REPRO: a beaten defender never retreats onto a hex that holds a world threat', () => {
    const state = line(); state.wars = [[P1, P2]];
    const atk = Array.from({ length: 6 }, (_, i) => put(state, P1, 'INFANTRY', 3, `a${i + 1}`)), def = Array.from({ length: 5 }, (_, i) => put(state, P2, 'INFANTRY', 4, `d${i + 1}`));
    state.threats.push(threat('5,0'));
    resolveBattleWithFaces(state, P1, attackOrder(atk, 4), win(ids(atk), ids(def)));
    expect(state.battles[0]!.retreat).not.toBe('5,0');
    expect(state.units.some(u => u.ownerId === P2 && u.hexId === '5,0')).toBe(false);
  });
  it('CHARACTERIZATION (balance): a VICTORY (loser loses 1) destroys the WHOLE defending stack when no neighbour is free or own/unowned', () => {
    // Canon §11b: "|Δ| 2–4: vitória, o perdedor perde 1 e recua". Engine: survivors with no refuge are also destroyed (alpha-combat.ts:156).
    const state = line(); state.wars = [[P1, P2]];
    const atk = Array.from({ length: 4 }, (_, i) => put(state, P1, 'INFANTRY', 3, `a${i + 1}`)), def = Array.from({ length: 3 }, (_, i) => put(state, P2, 'INFANTRY', 4, `d${i + 1}`));
    state.core.map.find(t => t.id === '5,0')!.ownerId = P1; // the only other neighbour belongs to the attacker
    state.players[1]!.defensePosture = 'HOLD';
    resolveBattleWithFaces(state, P1, attackOrder(atk, 4, 'HOLD'), Object.fromEntries([...ids(atk), ...ids(def)].map(id => [id, 'EMPTY' as const])));
    const battle = state.battles[0]!;
    expect(battle.outcome).toBe('VICTORY');
    expect(battle.losses).toHaveLength(3); // a VICTORY should cost 1 piece; blocked retreat costs the whole stack
    expect(battle.retreat).toBeNull();
    expect(state.units.filter(u => u.ownerId === P2)).toHaveLength(0);
  });
  it('CHARACTERIZATION (balance): a neighbour owned by an ALLY or by a third party also blocks the retreat', () => {
    const state = line({ players: 3, cities: [['c1', P1, 0], ['c2', P2, 9], ['c3', P3, 11]] }); state.wars = [[P1, P2]];
    const atk = Array.from({ length: 6 }, (_, i) => put(state, P1, 'INFANTRY', 3, `a${i + 1}`)), def = Array.from({ length: 3 }, (_, i) => put(state, P2, 'INFANTRY', 4, `d${i + 1}`));
    state.core.map.find(t => t.id === '5,0')!.ownerId = P3; // p3 allied with p2 would still refuse the refuge
    resolveBattleWithFaces(state, P1, attackOrder(atk, 4), win(ids(atk), ids(def)));
    expect(state.battles[0]!.retreat).toBeNull();
    expect(state.units.filter(u => u.ownerId === P2)).toHaveLength(0);
  });
});

describe('B-04 · captured capital', () => {
  it.fails('REPRO: after a capital falls, the previous owner\'s new capital carries the capital flag (and only it)', () => {
    const state = line({ players: 3, cities: [['c1', P1, 0], ['c2', P2, 4], ['c3', P3, 8], ['c4', P3, 11]] }); state.wars = [[P1, P3]];
    const atk = [1, 2, 3, 4].map(i => put(state, P1, 'INFANTRY', 7, `a${i}`));
    resolveBattleWithFaces(state, P1, attackOrder(atk, 8), win(ids(atk), []));
    expect(state.cities.find(c => c.cityId === 'c3')!.status).toBe('OCCUPIED');
    for (const owner of state.core.players) {
      for (const meta of state.cities.filter(c => c.currentOwnerId === owner.id)) expect(meta.capital, `${owner.id}/${meta.cityId}`).toBe(owner.civilization.capitalCityId === meta.cityId);
    }
  });
  it('CHARACTERIZATION (rule gap): losing the last city leaves a civilization alive and the match keeps going', () => {
    let state = line(); state.wars = [[P1, P2]];
    const atk = [1, 2, 3, 4].map(i => put(state, P1, 'INFANTRY', 6, `a${i}`));
    resolveBattleWithFaces(state, P1, attackOrder(atk, 7), win(ids(atk), []));
    expect(state.core.players.find(p => p.id === P2)!.civilization.cities).toHaveLength(0);
    expect(state.core.players.find(p => p.id === P2)!.civilization.capitalCityId).toBeNull();
    state = completeRound(AlphaStateSchema.parse(state));
    expect(state.core.status).toBe('ACTIVE');
    expect(state.winner).toBeNull(); // no conquest victory and no elimination: p2 must still READY every phase with nothing to do
    expect(state.players.some(p => p.playerId === P2)).toBe(true);
  });
});

describe('B-05 · free commands that change pieces already reserved in an order', () => {
  it.fails('REPRO: DEMOBILIZE of a piece that is in a queued ATTACK is refused (otherwise the whole order dies at resolution)', () => {
    const state0 = line({ cities: [['c1', P1, 0], ['c2', P2, 1]] }); state0.wars = [[P1, P2]];
    const group = [put(state0, P1, 'INFANTRY', 0, 'a1'), put(state0, P1, 'INFANTRY', 0, 'a2'), put(state0, P1, 'INFANTRY', 0, 'a3')]; put(state0, P2, 'INFANTRY', 1, 'd1');
    const state = must(state0, P1, { type: 'QUEUE_ORDER', order: attackOrder(group, 1) });
    const result = applyAlphaCommand(state, P1, { type: 'DEMOBILIZE', unitId: 'a3', expectedVersion: state.version });
    expect(result.ok).toBe(false);
  });
  it('CHARACTERIZATION: if it is allowed, the whole ATTACK fails at resolution with an unhelpful message and no battle', () => {
    const state0 = line({ cities: [['c1', P1, 0], ['c2', P2, 1]] }); state0.wars = [[P1, P2]];
    const group = [put(state0, P1, 'INFANTRY', 0, 'a1'), put(state0, P1, 'INFANTRY', 0, 'a2'), put(state0, P1, 'INFANTRY', 0, 'a3')]; put(state0, P2, 'INFANTRY', 1, 'd1');
    let state = must(state0, P1, { type: 'QUEUE_ORDER', order: attackOrder(group, 1) });
    state = must(state, P1, { type: 'DEMOBILIZE', unitId: 'a3' });
    state = completeRound(state);
    expect(state.battles).toHaveLength(0);
    expect(state.events.find(e => e.type === 'ORDER_FAILED')?.message).toBe('A ordem contém uma peça que não pertence a você.');
  });
});

describe('B-06/B-07 · naval corner cases', () => {
  it.fails('REPRO (rule decision): ships alone cannot occupy a coastal city (no land piece, no garrison)', () => {
    const state = line({ cities: [['c1', P1, 0], ['c2', P2, 5]], terrain: { 3: 'SEA', 4: 'SEA', 5: 'COAST' } }); state.wars = [[P1, P2]];
    const fleet = [1, 2].map(i => put(state, P1, 'FLEET', 4, `f${i}`));
    resolveBattleWithFaces(state, P1, attackOrder(fleet, 5), win(ids(fleet), []));
    expect(state.cities.find(c => c.cityId === 'c2')!.status).not.toBe('OCCUPIED');
  });
  it.fails('REPRO: cargo of a sunk fleet is never "rescued" into an enemy city', () => {
    const state = line({ cities: [['c1', P1, 0], ['c2', P2, 5]], terrain: { 2: 'SEA', 3: 'SEA', 4: 'SEA', 5: 'COAST' } }); state.wars = [[P1, P2]];
    put(state, P1, 'FLEET', 4, 'pf1'); const a = put(state, P1, 'INFANTRY', 4, 'pi1'), b = put(state, P1, 'INFANTRY', 4, 'pi2'); a.carrierId = 'pf1'; b.carrierId = 'pf1';
    const raiders = [1, 2, 3, 4].map(i => put(state, P2, 'FLEET', 3, `ef${i}`));
    resolveBattleWithFaces(state, P2, attackOrder(raiders, 4), win(ids(raiders), ['pf1']));
    const enemyCity = state.core.players.find(p => p.id === P2)!.civilization.cities[0]!.hexId;
    expect(state.units.some(u => u.ownerId === P1 && u.hexId === enemyCity)).toBe(false);
  });
});

describe('B-08/B-09/B-10 · the resolution log the clients read', () => {
  it.fails('REPRO: a failed ATTACK (target moved away) appears in the round report resolution of the attacker', () => {
    let state = line(); state.wars = [[P1, P2]];
    const a = put(state, P1, 'INFANTRY', 3, 'a1'); put(state, P2, 'INFANTRY', 4, 'd1');
    state = must(state, P1, { type: 'QUEUE_ORDER', order: attackOrder([a], 4) });
    state = must(state, P2, { type: 'QUEUE_ORDER', order: { id: 'flee', type: 'MOVE', unitIds: ['d1'], path: ['5,0'] } });
    state = completeRound(state);
    expect(state.events.some(e => e.type === 'ORDER_FAILED' && e.message === 'Não há adversário conhecido nesse destino.')).toBe(true); // it IS in the chronicle...
    const report = state.roundReports.find(r => r.playerId === P1 && r.round === 1)!;
    expect(report.resolution.some(e => e.type === 'FAILURE' && e.actorId === P1)).toBe(true); // ...but not in the "Resultados" overlay the player sees
  });
  it.fails('REPRO: entering a war through a defensive pact is announced (p3 is dragged into war with p1 silently today)', () => {
    let state = line({ players: 3, cities: [['c1', P1, 0], ['c2', P2, 4], ['c3', P3, 8]] });
    state.treaties.push({ id: 'pact', proposerId: P2, recipientId: P3, type: 'DEFENSIVE_PACT', status: 'ACTIVE', deal: { give: {}, receive: {} } as never, createdRound: 1, expiresRound: 9 } as never);
    state = must(state, P1, { type: 'DECLARE_WAR', targetId: P2 });
    state = completeRound(state);
    expect(state.wars).toEqual(expect.arrayContaining([[P1, P2], [P1, P3]])); // the mechanics work
    const names = state.core.players.map(p => p.name);
    const mentionsP3 = (message: string) => message.includes(names[2]!) && /pacto|aliad|defesa|entrou/i.test(message);
    expect(state.events.some(e => mentionsP3(e.message))).toBe(true);
  });
  it.fails('REPRO: a captured city is announced (event or resolution) to the victim, the captor and the table', () => {
    let state = line(); state.wars = [[P1, P2]];
    const atk = Array.from({ length: 6 }, (_, i) => put(state, P1, 'INFANTRY', 6, `a${i + 1}`));
    state = must(state, P1, { type: 'QUEUE_ORDER', order: attackOrder(atk, 7) });
    state = completeRound(state);
    expect(state.cities.find(c => c.cityId === 'c2')!.status).toBe('OCCUPIED'); // precondition: the city did fall
    const text = [...state.events.map(e => e.message), ...state.roundReports.flatMap(r => r.resolution.map(e => e.message))];
    expect(text.some(message => /captur|ocupad|conquist|tomou|perdeu a cidade/i.test(message))).toBe(true);
  });
});

describe('resolution order (characterization)', () => {
  it('RULE: attacks resolve one after another in initiative order, so the first seat can wipe the stack that would have hit back', () => {
    let state = line(); state.wars = [[P1, P2]];
    const mine = Array.from({ length: 6 }, (_, i) => put(state, P1, 'INFANTRY', 3, `a${i + 1}`)), theirs = [put(state, P2, 'INFANTRY', 4, 'd1'), put(state, P2, 'INFANTRY', 4, 'd2')];
    state = must(state, P1, { type: 'QUEUE_ORDER', order: attackOrder(mine, 4) });
    state = must(state, P2, { type: 'QUEUE_ORDER', order: { ...attackOrder(theirs, 3), id: 'riposte' } });
    expect(state.initiative[0]).toBe(P1);
    state = completeRound(state);
    expect(state.battles).toHaveLength(1); // p2's order never fought
    expect(state.battles[0]!.attackerId).toBe(P1);
    expect(state.events.some(e => e.type === 'ORDER_FAILED' && /não pertence a você/.test(e.message))).toBe(true);
  });
  it('RULE: a second attacker on the same target fails once the first one took the hex (no war with the new occupant)', () => {
    let state = line({ players: 3, cities: [['c1', P1, 0], ['c2', P2, 4], ['c3', P3, 9]] }); state.wars = [[P1, P2], [P2, P3]];
    const a = Array.from({ length: 6 }, (_, i) => put(state, P1, 'INFANTRY', 3, `a${i + 1}`)), c = Array.from({ length: 6 }, (_, i) => put(state, P3, 'INFANTRY', 5, `c${i + 1}`));
    put(state, P2, 'INFANTRY', 4, 'd1');
    state = must(state, P1, { type: 'QUEUE_ORDER', order: attackOrder(a, 4) });
    state = must(state, P3, { type: 'QUEUE_ORDER', order: { ...attackOrder(c, 4), id: 'p3atk' } });
    state = completeRound(state);
    expect(state.battles.filter(b => b.hexId === '4,0')).toHaveLength(1);
    expect(state.events.some(e => e.type === 'ORDER_FAILED')).toBe(true);
  });
});

describe('state integrity under many battles (property check, 300 seeded battles)', () => {
  const KINDS: Kind[] = ['INFANTRY', 'GUARD', 'RANGED', 'CAVALRY', 'SIEGE', 'PIONEER', 'ENVOY'];
  it('every resolved battle leaves a schema-valid state, no hex shared by two owners, and an exact JSON round trip', () => {
    let resolved = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const r = (k: number) => (seed * 2654435761 + k * 40503) % 997;
      const city = seed % 3 === 0, target = city ? 7 : 5;
      const state = line({ seed, terrain: { [target]: (['PLAINS', 'FOREST', 'HILLS'] as const)[r(1) % 3]! } });
      state.wars = [[P1, P2]];
      const attackers = Array.from({ length: 1 + (r(2) % 6) }, (_, i) => put(state, P1, KINDS[r(10 + i) % 5]!, target - 1));
      Array.from({ length: Math.max(r(3) % 7, city ? 0 : 1) }, (_, i) => put(state, P2, KINDS[r(20 + i) % 7]!, target));
      if (city) state.cities.find(c => c.cityId === 'c2')!.fortification = { level: (['NONE', 'PALISADE', 'STONE_WALL'] as const)[r(4) % 3]!, state: (['INTACT', 'DAMAGED', 'BREACHED'] as const)[r(5) % 3]! } as never;
      state.players[0]!.temporaryEffects = [{ source: 'm', effect: { kind: 'MOVEMENT', amount: 2 }, round: 1 }];
      state.players[1]!.defensePosture = BattlePostureSchema.options[r(6) % 3]!;
      const order = attackOrder(attackers, target, BattlePostureSchema.options[r(7) % 3]!);
      expect(tryValidate(() => validateMilitaryOrder(state, P1, order)), `seed ${seed}`).toBeNull();
      resolveBattle(state, P1, order); resolved++;
      const parsed = AlphaStateSchema.safeParse(state);
      expect(parsed.success, `seed ${seed}`).toBe(true);
      const owners = new Map<string, Set<string>>();
      for (const unit of state.units) owners.set(unit.hexId, (owners.get(unit.hexId) ?? new Set()).add(unit.ownerId));
      expect([...owners.values()].every(set => set.size === 1), `seed ${seed} shared hex`).toBe(true);
      const again = AlphaStateSchema.parse(JSON.parse(JSON.stringify(state)));
      expect(again.battles).toEqual(state.battles);
      expect(again.units).toEqual(state.units);
    }
    expect(resolved).toBe(300);
  });
});

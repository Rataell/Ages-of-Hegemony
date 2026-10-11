import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, ALPHA_CARDS, threatComposition, threatPieceIds, type Threat } from '@aoh/game-domain';
import { applyAlphaCommand, governCity, resolveBattleWithFaces, unitSupply, validateMilitaryOrder } from '@aoh/game-engine';
import { must } from './alpha-rounds.js';
import { P1, P2, attackOrder, line, put, tryValidate } from './v12-audit-combat-helpers.js';

/**
 * Lane B · siege, fortification, supply, amphibious, naval and world-threat combat. IDs (B-nn) match docs/audit/alpha-v1.2-lane-b-combat.md.
 * `it.fails` = REPRO (expected behaviour stated, currently throws). Everything else is a guard or a CHARACTERIZATION.
 */
const every = (face: 'EMPTY' | 'IMPACT' | 'COMMAND', ...ids: string[]) => Object.fromEntries(ids.map(id => [id, face])) as Record<string, 'EMPTY' | 'IMPACT' | 'COMMAND'>;
const entry = (list: { source: string; amount: number }[], source: string | RegExp) => list.find(item => typeof source === 'string' ? item.source === source : source.test(item.source));

describe('fortification: level × state, breach and repair', () => {
  const walled = (fort: { level: string; state: string }) => {
    const state = line({ march: true }); state.wars = [[P1, P2]];
    state.cities.find(c => c.cityId === 'c2')!.fortification = fort as never;
    return state;
  };
  it('the bonus follows state: INTACT full, DAMAGED half (floor), BREACHED zero', () => {
    const bonus = (stateName: string) => {
      const state = walled({ level: 'STONE_WALL', state: stateName });
      put(state, P2, 'INFANTRY', 7, 'd1'); const a = put(state, P1, 'INFANTRY', 6, 'a1');
      resolveBattleWithFaces(state, P1, attackOrder([a], 7, 'HOLD'), every('EMPTY', 'a1', 'd1'));
      return entry(state.battles[0]!.defenseBreakdown, 'Fortificação')?.amount ?? 0;
    };
    const full = bonus('INTACT');
    expect(full).toBeGreaterThan(0);
    expect(bonus('DAMAGED')).toBe(Math.floor(full * line().rules.combat.fortification.damagedPercent / 100));
    expect(bonus('BREACHED')).toBe(0);
  });
  it('a Comando on a Cerco opens Integridade in the same battle, win or lose, and the record keeps before/after', () => {
    const state = walled({ level: 'STONE_WALL', state: 'INTACT' });
    const siege = put(state, P1, 'SIEGE', 6, 'a1'); put(state, P2, 'INFANTRY', 7, 'd1'); put(state, P2, 'INFANTRY', 7, 'd2');
    resolveBattleWithFaces(state, P1, attackOrder([siege], 7), every('COMMAND', 'a1', 'd1', 'd2'));
    const battle = state.battles[0]!;
    expect(battle.fortification).toMatchObject({ cityId: 'c2', before: { state: 'INTACT' } });
    expect(state.cities.find(c => c.cityId === 'c2')!.fortification.state).not.toBe('INTACT');
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });
  it('CHARACTERIZATION (balance): a captured city keeps its wall level and state — the conqueror inherits a BREACHED city', () => {
    const state = walled({ level: 'STONE_WALL', state: 'BREACHED' });
    const group = Array.from({ length: 6 }, (_, i) => put(state, P1, 'INFANTRY', 6, `a${i + 1}`));
    resolveBattleWithFaces(state, P1, attackOrder(group, 7), every('IMPACT', ...group.map(g => g.id)));
    expect(state.cities.find(c => c.cityId === 'c2')!.status).toBe('OCCUPIED');
    expect(state.cities.find(c => c.cityId === 'c2')!.fortification).toEqual({ level: 'STONE_WALL', state: 'BREACHED' });
  });
  it('Governar repairs exactly one step (BREACHED → DAMAGED → INTACT) for 1 Pedra, so a full siege costs two city activations to undo', () => {
    const state = line(); const meta = state.cities.find(c => c.cityId === 'c1')!;
    meta.fortification = { level: 'STONE_WALL', state: 'BREACHED' } as never; meta.mood = 6;
    state.players[0]!.resources = { ...state.players[0]!.resources, stone: 5 };
    governCity(state, P1, 'c1'); expect(meta.fortification.state).toBe('DAMAGED');
    governCity(state, P1, 'c1'); expect(meta.fortification.state).toBe('INTACT');
    expect(state.players[0]!.resources.stone).toBe(3);
  });
  it.fails('REPRO: under a government without free Governar levels (anything but the Conselho), a BREACHED wall can still be repaired with Pedra when the player has no Cultura and under 2 Riqueza', () => {
    const state = line(); const meta = state.cities.find(c => c.cityId === 'c1')!;
    state.core.players[0]!.civilization.government = 'MONARCHY' as never;
    meta.fortification = { level: 'STONE_WALL', state: 'BREACHED' } as never; meta.mood = 3;
    state.players[0]!.resources = { ...state.players[0]!.resources, stone: 5, culture: 0, wealth: 1 };
    governCity(state, P1, 'c1'); // today: throws "Governar custa 1 Cultura ou 2 Riqueza por nível de Ânimo." — the repair is coupled to paying for mood
    expect(meta.fortification.state).toBe('DAMAGED');
  });
});

describe('supply (characterization)', () => {
  it('RULE: the −2 "Sem suprimento" is ONE flat penalty per side, not per unsupplied piece', () => {
    const one = line({ march: true }), many = line({ march: true });
    for (const state of [one, many]) state.wars = [[P1, P2]];
    const lone = [put(one, P1, 'INFANTRY', 5, 'a1')], six = Array.from({ length: 6 }, (_, i) => put(many, P1, 'INFANTRY', 5, `a${i + 1}`));
    put(one, P2, 'INFANTRY', 6, 'd1'); put(many, P2, 'INFANTRY', 6, 'd1');
    for (const [state, group] of [[one, lone], [many, six]] as const) {
      expect(unitSupply(state, group[0]!).supplied).toBe(false);
      resolveBattleWithFaces(state, P1, attackOrder(group, 6), every('EMPTY', ...group.map(g => g.id), 'd1'));
    }
    expect(entry(one.battles[0]!.attackBreakdown, 'Sem suprimento')?.amount).toBe(-2);
    expect(entry(many.battles[0]!.attackBreakdown, 'Sem suprimento')?.amount).toBe(-2);
  });
  it('RULE: an army that takes a far city stands unsupplied inside it (occupied cities supply nobody), so the recapture faces a −2 garrison', () => {
    const state = line({ cities: [['c1', P1, 0], ['c2', P2, 10]], length: 12, march: true }); state.wars = [[P1, P2]];
    const group = Array.from({ length: 6 }, (_, i) => put(state, P1, 'INFANTRY', 9, `a${i + 1}`));
    resolveBattleWithFaces(state, P1, attackOrder(group, 10), every('IMPACT', ...group.map(g => g.id)));
    expect(state.cities.find(c => c.cityId === 'c2')!.status).toBe('OCCUPIED');
    const garrison = state.units.find(u => u.ownerId === P1 && u.hexId === '10,0')!;
    expect(unitSupply(state, garrison)).toMatchObject({ supplied: false });
  });
});

describe('amphibious attack and naval combat', () => {
  const coast = () => {
    const state = line({ cities: [['c1', P1, 0], ['c2', P2, 9]], terrain: { 3: 'SEA', 4: 'SEA' }, march: true }); state.wars = [[P1, P2]];
    const fleet = put(state, P1, 'FLEET', 4, 'f1'), cargo = [put(state, P1, 'INFANTRY', 4, 'i1'), put(state, P1, 'INFANTRY', 4, 'i2')];
    cargo.forEach(unit => { unit.carrierId = 'f1'; });
    return { state, fleet, cargo };
  };
  it('a landing from the ship pays −1 "Desembarque anfíbio", and the winners step onto the beach while the fleet stays at sea', () => {
    const { state, cargo } = coast(); put(state, P2, 'INFANTRY', 5, 'd1');
    expect(tryValidate(() => validateMilitaryOrder(state, P1, attackOrder(cargo, 5)))).toBeNull();
    resolveBattleWithFaces(state, P1, attackOrder(cargo, 5), every('IMPACT', 'i1', 'i2', 'd1'));
    const battle = state.battles[0]!;
    expect(entry(battle.attackBreakdown, 'Desembarque anfíbio')?.amount).toBe(-1);
    expect(battle.winnerId).toBe(P1);
    expect(state.units.filter(u => u.id.startsWith('i')).every(u => u.hexId === '5,0' && u.carrierId === null)).toBe(true);
    expect(state.units.find(u => u.id === 'f1')!.hexId).toBe('4,0');
  });
  it('guard: cargo and fleet cannot be mixed in one order, and a ship cannot attack a land hex', () => {
    const { state, fleet, cargo } = coast(); put(state, P2, 'INFANTRY', 5, 'd1');
    expect(tryValidate(() => validateMilitaryOrder(state, P1, attackOrder([fleet, ...cargo], 5)))).toBe('Um ataque anfíbio parte só das peças embarcadas na mesma frota.');
    expect(tryValidate(() => validateMilitaryOrder(state, P1, attackOrder([fleet], 5)))).toBe('Caminho deve cruzar hexes conhecidos, adjacentes e compatíveis com a peça.');
  });
  it('a beaten amphibious force stays aboard and the cargo shares the fleet\'s fate', () => {
    const { state, cargo } = coast(); const defenders = Array.from({ length: 4 }, (_, i) => put(state, P2, 'INFANTRY', 5, `d${i + 1}`));
    resolveBattleWithFaces(state, P1, attackOrder(cargo, 5), { ...every('EMPTY', 'i1', 'i2'), ...every('IMPACT', ...defenders.map(d => d.id)) });
    const battle = state.battles[0]!;
    expect(battle.winnerId).toBe(P2);
    expect(battle.retreat).toBe('4,0');
    expect(state.units.find(u => u.id === 'f1')).toBeDefined();
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });
});

describe('world threats as the other side of the shock', () => {
  const camp = (hex: string): Threat => ({ id: 'camp-1', kind: 'CAMP', hexId: hex as never, homeHexId: hex as never, level: 1, status: 'CAMPED', composition: threatComposition('CAMP', 1, 0), createdRound: 1, lastActedRound: 0, rewardPaid: false, fresh: false });
  it('guard: a camp can be attacked with no war, from an adjacent hex only; a farther hex gets the generic path error', () => {
    const state = line({ march: true }); state.threats.push(camp('5,0'));
    const near = put(state, P1, 'INFANTRY', 4, 'near'), far = put(state, P1, 'INFANTRY', 3, 'far');
    expect(tryValidate(() => validateMilitaryOrder(state, P1, attackOrder([near], 5)))).toBeNull();
    expect(tryValidate(() => validateMilitaryOrder(state, P1, attackOrder([far], 5)))).toBe('Caminho deve cruzar hexes conhecidos, adjacentes e compatíveis com a peça.');
  });
  it('guard: land pieces cannot attack pirates at sea', () => {
    const state = line({ terrain: { 5: 'SEA' } }); const pirate = { ...camp('5,0'), id: 'pirate-1', kind: 'PIRATE' as const, composition: threatComposition('PIRATE', 1, 0) };
    state.threats.push(pirate); const inf = put(state, P1, 'INFANTRY', 4, 'i1');
    expect(tryValidate(() => validateMilitaryOrder(state, P1, attackOrder([inf], 5)))).not.toBeNull();
  });
  it('a camp wiped by the first attacker pays its reward once and the hex is empty for the next order', () => {
    const state = line({ march: true }); const threat = camp('5,0'); state.threats.push(threat);
    const first = Array.from({ length: 6 }, (_, i) => put(state, P1, 'INFANTRY', 4, `a${i + 1}`));
    resolveBattleWithFaces(state, P1, attackOrder(first, 5), Object.fromEntries(threatPieceIds(threat).map(piece => [piece.id, 'EMPTY' as const])));
    expect(state.threats).toHaveLength(0);
    expect(threat.rewardPaid).toBe(true);
    expect(state.telemetry.threatKills).toBe(1);
    const empty = line({ march: true });
    expect(tryValidate(() => validateMilitaryOrder(empty, P2, attackOrder([put(empty, P2, 'INFANTRY', 4, 'x')], 5)))).toBe('Não há adversário conhecido nesse destino.');
  });
  it('RULE (cards): a Reação is a free +STRENGTH for the whole round for the party that played it; engine charges no resource (canon §10: Reações 0–1 recurso)', () => {
    const reaction = ALPHA_CARDS.find(card => card.timing === 'REACTION')!;
    let state = line({ march: true }); state.wars = [[P1, P2]];
    for (const player of state.players) { state.cards.discarded.push(...player.hand); player.hand = []; }
    state.players[1]!.hand = [reaction.id]; state.cards.strategyDeck = state.cards.strategyDeck.filter(id => id !== reaction.id); state.cards.discarded = state.cards.discarded.filter(id => id !== reaction.id);
    const group = Array.from({ length: 3 }, (_, i) => put(state, P1, 'INFANTRY', 3, `a${i + 1}`)); put(state, P2, 'INFANTRY', 4, 'd1');
    const before = { ...state.players[1]!.resources };
    state = must(state, P1, { type: 'QUEUE_ORDER', order: attackOrder(group, 4) });
    for (const seat of [P1, P2]) state = must(state, seat, { type: 'READY' });
    expect(state.phase).toBe('CONFLICTS');
    state = must(state, P2, { type: 'PLAY_CARD', cardId: reaction.id });
    expect(state.players[1]!.resources).toEqual(before);
    const refusedSecond = applyAlphaCommand(state, P2, { type: 'PLAY_CARD', cardId: reaction.id, expectedVersion: state.version });
    expect(refusedSecond.ok).toBe(false);
    state = must(state, P2, { type: 'READY' });
    state = must(state, P1, { type: 'READY' });
    expect(entry(state.battles[0]!.defenseBreakdown, 'Cartas e efeitos')?.amount).toBeGreaterThan(0);
  });
});

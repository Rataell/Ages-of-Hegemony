import {
  type AlphaCity, type AlphaState, type AlphaUnit, type BattlePosture, type CombatConfig, type HexId, type PlayerId, type StrategicOrder, type TacticalFace,
} from '@aoh/game-domain';
import { hexNeighbors, hexId } from './hex.js';
import { occupyCity } from './alpha-cities.js';
import { strengthSources } from './alpha-institutions.js';
import { canEnter, unitSupply, validateMilitaryOrder } from './alpha-military.js';
import { visibleHexIds } from './alpha-world.js';
import { stackBlock, stackRoom } from './alpha-stack.js';
import { isPort, settleCargo } from './alpha-naval.js';
import { isSignature } from './alpha-kits.js';
import { alphaEvent } from './alpha-events.js';
import { GRADE_NUMERALS, unitGrade } from './alpha-grades.js';
import { casualtyCount, chooseLosses, fortificationBonus, isFortified, resolveShock, signaturePassives, sumOf, type Fort, type Modifier, type ShockPiece } from './alpha-shock.js';

type Order = Extract<StrategicOrder, { type: 'ATTACK' }>;
export type { Modifier } from './alpha-shock.js';
export { fortificationBonus } from './alpha-shock.js';
const push = (list: Modifier[], source: string, amount: number) => { if (amount !== 0) list.push({ source, amount }); };
const byId = <T extends { id: string }>(a: T, b: T) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const hasPower = (state: AlphaState, unit: AlphaUnit) => state.rules.units[unit.kind].strength > 0;

interface Sides {
  attackerId: PlayerId; defenderId: PlayerId; attackers: AlphaUnit[]; defenders: AlphaUnit[];
  city: ReturnType<typeof cityAt>; meta: AlphaCity | undefined; terrain: string; hexId: HexId;
}
function cityAt(state: AlphaState, target: HexId) { return state.core.players.flatMap(player => player.civilization.cities).find(city => city.hexId === target); }
function sidesOf(state: AlphaState, actor: PlayerId, order: Order): Sides {
  const attackers = state.units.filter(unit => order.unitIds.includes(unit.id)).sort(byId);
  const city = cityAt(state, order.target);
  const defenderId = state.units.find(unit => unit.hexId === order.target && unit.ownerId !== actor)?.ownerId ?? city!.ownerId;
  // Cargo does not fight at sea; it shares its fleet's fate (see settleCargo).
  const defenders = state.units.filter(unit => unit.hexId === order.target && unit.ownerId === defenderId && !unit.carrierId).sort(byId);
  const tile = state.core.map.find(candidate => candidate.id === order.target)!;
  return { attackerId: actor, defenderId, attackers, defenders, city, meta: city ? state.cities.find(candidate => candidate.cityId === city.id) : undefined, terrain: tile.terrain, hexId: order.target };
}

/** Every static (pre-dice) contribution of one side that is not a signature: terrain, amphibious landing, supply, technology, Leader and cards. */
function staticSide(state: AlphaState, sides: Sides, attacking: boolean) {
  const config = state.rules.combat;
  const owner = attacking ? sides.attackerId : sides.defenderId, units = attacking ? sides.attackers : sides.defenders;
  const fighters = units.filter(unit => hasPower(state, unit));
  const modifiers: Modifier[] = [];
  const terrain = fighters.reduce((total, unit) => total + state.rules.units[unit.kind].terrainModifiers[sides.terrain as keyof typeof state.rules.units.INFANTRY.terrainModifiers], 0);
  const landform = attacking ? 0 : sides.terrain === 'HILLS' ? config.hillDefense : sides.terrain === 'MOUNTAINS' ? config.mountainDefense : 0;
  push(modifiers, 'Terreno', terrain + landform);
  if (attacking && units.some(unit => unit.carrierId && !isSignature(state, unit))) push(modifiers, 'Desembarque anfíbio', -1);
  if (fighters.some(unit => !unitSupply(state, unit).supplied)) push(modifiers, 'Sem suprimento', -config.unsuppliedPenalty);
  const sources = strengthSources(state, owner);
  push(modifiers, 'Tecnologia', sources.technology);
  push(modifiers, 'Líder', sources.leader);
  push(modifiers, 'Cartas e efeitos', sources.other);
  return { owner, units, fighters, modifiers };
}
const piecesOf = (state: AlphaState, fighters: readonly AlphaUnit[]): ShockPiece[] => fighters.map(unit => ({ id: unit.id, kind: unit.kind, grade: unitGrade(state, unit.ownerId, unit.kind), signature: isSignature(state, unit) }));

export interface CombatPreview {
  ok: boolean; blocked: string | null; target: string; terrain: string; dieFaces: readonly TacticalFace[];
  attacker: { strength: number; posture: BattlePosture; units: { id: string; kind: string; strength: number; grade: number; grau: string }[]; breakdown: Modifier[]; total: number };
  defender: { visible: boolean; strength: number; units: { kind: string; strength: number; grade: number; grau: string }[]; breakdown: Modifier[]; fortification: Fort | null; posture: 'UNKNOWN' } | null;
  /** What happens to the attacking pieces after a victory: only as many as the target hex's stack limits allow advance. */
  advance: { total: number; stays: number; note: string | null };
  /** Δ readings (canon §11b): |Δ| below `tie` is a tactical tie, from `decisive` on the victory is decisive. */
  thresholds: { tie: number; decisive: number };
  note: string;
}

/**
 * What an attack order looks like before the dice: every static contribution by origin for both sides (Grau and passive
 * signatures included), the die faces (public), and no random result. The defender's posture and anything on hexes the
 * attacker cannot see stay hidden.
 */
export function combatPreview(state: AlphaState, actor: PlayerId, order: Order): CombatPreview {
  const config = state.rules.combat;
  let blocked: string | null = null;
  try { validateMilitaryOrder(state, actor, order); } catch (error: unknown) { blocked = error instanceof Error ? error.message : 'Ordem inválida.'; }
  const thresholds = { tie: config.mediumMargin - 1, decisive: config.largeMargin };
  const base = { dieFaces: config.dieFaces, thresholds, note: 'Cada peça de combate rola 1 dado tático na resolução; o resultado só existe depois da batalha. Δ = ataque − defesa.' };
  const terrain = state.core.map.find(tile => tile.id === order.target)?.terrain ?? 'UNKNOWN';
  if (blocked !== null) return { ok: false, blocked, target: order.target, terrain, ...base, attacker: { strength: 0, posture: order.posture, units: [], breakdown: [], total: 0 }, defender: null, advance: { total: 0, stays: 0, note: null } };
  const sides = sidesOf(state, actor, order);
  const attack = staticSide(state, sides, true), defend = staticSide(state, sides, false);
  const fortification: Fort | null = sides.meta ? { ...sides.meta.fortification } : null;
  const input = { terrain: sides.terrain, city: sides.city !== undefined, fortification } as const;
  const attackPieces = piecesOf(state, attack.fighters), defendPieces = piecesOf(state, defend.fighters);
  const attackSide = { pieces: attackPieces, posture: order.posture, flat: attack.modifiers }, defendSide = { pieces: defendPieces, posture: 'HOLD' as const, flat: defend.modifiers };
  const attackBreakdown = [...attack.modifiers, ...signaturePassives(state, attackSide, true, { ...input, attacker: attackSide, defender: defendSide })];
  const defenseBreakdown = [...defend.modifiers, ...signaturePassives(state, defendSide, false, { ...input, attacker: attackSide, defender: defendSide })];
  if (fortification) push(defenseBreakdown, 'Fortificação', isFortified(fortification) ? fortificationBonus(config, fortification) : 0);
  const seen = visibleHexIds(state, actor).has(order.target);
  const room = stackRoom(state, actor, sides.attackers, order.target);
  const advance = { total: sides.attackers.length, stays: room.stays.length, note: room.stays.length ? `Limite de pilha atingido em ${order.target}: se vencer, ${room.fits.length} de ${sides.attackers.length} peças avançam e ${room.stays.length} permanecem em ${sides.attackers[0]!.hexId}.` : null };
  const power = (unit: AlphaUnit) => state.rules.units[unit.kind].strength;
  const strength = (fighters: readonly AlphaUnit[]) => fighters.reduce((total, unit) => total + power(unit), 0);
  const label = (unit: AlphaUnit) => { const grade = unitGrade(state, unit.ownerId, unit.kind); return { grade, grau: GRADE_NUMERALS[grade - 1]! }; };
  return {
    ok: true, blocked: null, target: order.target, terrain, ...base, advance,
    attacker: { strength: strength(attack.fighters), posture: order.posture, units: sides.attackers.map(unit => ({ id: unit.id, kind: unit.kind, strength: power(unit), ...label(unit) })), breakdown: attackBreakdown, total: strength(attack.fighters) + sumOf(attackBreakdown) },
    defender: seen
      ? { visible: true, strength: strength(defend.fighters), units: sides.defenders.map(unit => ({ kind: unit.kind, strength: power(unit), ...label(unit) })), breakdown: defenseBreakdown, fortification, posture: 'UNKNOWN' }
      : { visible: false, strength: 0, units: [], breakdown: [], fortification: null, posture: 'UNKNOWN' },
  };
}

/**
 * One tactical shock (canon §11b). Steps: validate, static contributions, postures, one die per fighting piece, signatures,
 * fortification and breach, Δ = attack − defense, losses by outcome, retreat or hold, capture, advance, report. All randomness comes
 * from the private RNG, attackers first and then defenders, each in unit-id order, so a battle replays identically.
 */
export function resolveBattle(state: AlphaState, actor: PlayerId, order: Order): void { resolveBattleWithFaces(state, actor, order); }
/** The same resolution with some dice fixed. Used by tests to exercise each face and COMMAND without depending on a seed. */
export function resolveBattleWithFaces(state: AlphaState, actor: PlayerId, order: Order, forced?: Record<string, TacticalFace>): void {
  validateMilitaryOrder(state, actor, order);
  const sides = sidesOf(state, actor, order);
  const { attackers, defenders, defenderId, city } = sides;
  const tile = state.core.map.find(candidate => candidate.id === order.target)!;
  const attackerPosture = order.posture, defenderPosture = state.players.find(player => player.playerId === defenderId)!.defensePosture;
  const attack = staticSide(state, sides, true), defend = staticSide(state, sides, false);
  const before: Fort | null = sides.meta ? { ...sides.meta.fortification } : null;

  const shock = resolveShock(state, {
    attacker: { pieces: piecesOf(state, attack.fighters), posture: attackerPosture, flat: attack.modifiers },
    defender: { pieces: piecesOf(state, defend.fighters), posture: defenderPosture, flat: defend.modifiers },
    terrain: sides.terrain, city: city !== undefined, fortification: before, ...(forced ? { forced } : {}),
  });
  let fortification: { cityId: AlphaCity['cityId']; before: Fort; after: Fort } | null = null;
  if (sides.meta && city && before && shock.fortificationAfter) {
    if (shock.fortificationAfter.state !== before.state) sides.meta.fortification = { ...shock.fortificationAfter };
    fortification = { cityId: city.id, before, after: shock.fortificationAfter };
  }

  const { delta, outcome } = shock;
  const attackerAdvances = outcome !== 'TIE' && delta > 0;
  const winnerId = attackerAdvances ? actor : defenderId;
  const pool = (units: AlphaUnit[]) => units;
  const fightersOf = (units: AlphaUnit[]) => units.filter(unit => hasPower(state, unit));
  const losses: string[] = [];
  if (outcome === 'TIE') {
    if (fightersOf(attackers).length >= 2) losses.push(...chooseLosses(state, pool(fightersOf(attackers)), 1));
    if (fightersOf(defenders).length >= 2) losses.push(...chooseLosses(state, pool(fightersOf(defenders)), 1));
  } else {
    const losers = delta > 0 ? defenders : attackers;
    const fighters = fightersOf(losers);
    losses.push(...chooseLosses(state, fighters.length ? fighters : losers, casualtyCount(outcome)));
  }
  const survivors = (delta > 0 && outcome !== 'TIE' ? defenders : []).filter(unit => !losses.includes(unit.id));
  // I-3: defenders inside a city hold it; it falls when nobody is left, or on a decisive victory with no Guarda alive.
  const captured = attackerAdvances && city !== undefined && city.ownerId !== actor && (survivors.length === 0 || (outcome === 'DECISIVE' && !survivors.some(unit => unit.kind === 'GUARD')));
  const defendersLeave = attackerAdvances && (city === undefined || captured);
  let retreat: HexId | null = attackerAdvances ? null : attackers[0]!.hexId;
  if (defendersLeave && survivors.length) {
    retreat = hexNeighbors(tile).map(hexId).sort().find(id => survivors.every(unit => canEnter(state, unit, id)) && stackBlock(state, defenderId, survivors, id) === null && !state.units.some(unit => unit.hexId === id && unit.ownerId !== defenderId) && state.core.map.some(candidate => candidate.id === id && (candidate.ownerId === null || candidate.ownerId === defenderId))) ?? null;
    if (retreat) survivors.forEach(unit => { unit.hexId = retreat!; }); else losses.push(...survivors.map(unit => unit.id));
  }
  state.units = state.units.filter(unit => !losses.includes(unit.id));
  const attackerSurvivors = attackers.filter(unit => !losses.includes(unit.id));
  if (attackerAdvances) {
    state.players.find(player => player.playerId === actor)!.victories++;
    if (defendersLeave) {
      // Stack limits: only as many pieces as fit advance, in id order; the rest keep their hex.
      const { fits, stays } = stackRoom(state, actor, attackerSurvivors, order.target);
      fits.forEach(unit => { unit.hexId = order.target; unit.carrierId = null; });
      if (stays.length) alphaEvent(state, 'STACK_LIMIT', `Limite de pilha em ${order.target}: ${fits.length} peças avançaram e ${stays.length} permaneceram em ${stays[0]!.hexId}.`, [actor]);
      if (captured && city) occupyCity(state, actor, city.id);
    }
    if (shock.boarding) blockPort(state, actor, defenderId, order.target);
  }
  state.battles.push({
    id: `battle-${state.battles.length + 1}`, round: state.core.round, hexId: order.target, attackerId: actor, defenderId,
    attackerUnits: attackers.map(unit => unit.id), defenderUnits: defenders.map(unit => unit.id), attackerPosture, defenderPosture,
    attackBreakdown: shock.attackBreakdown, defenseBreakdown: shock.defenseBreakdown, attackerTactical: shock.attackerRolls, defenderTactical: shock.defenderRolls, fortification,
    attackStrength: shock.attackStrength, defenseStrength: shock.defenseStrength, attackModifiers: shock.attackModifiers, defenseModifiers: shock.defenseModifiers, attackTotal: shock.attackTotal, defenseTotal: shock.defenseTotal,
    delta, outcome, winnerId, losses, retreat,
  });
  settleCargo(state);
}
export const combatConfigOf = (state: AlphaState): CombatConfig => state.rules.combat;

/** Frota Abordagem: the defender's nearest port within one hex of the battle stays shut through the next round. */
function blockPort(state: AlphaState, attacker: PlayerId, defender: PlayerId, target: HexId): void {
  const tile = state.core.map.find(candidate => candidate.id === target)!;
  const near = new Set<string>([target, ...hexNeighbors(tile).map(hexId)]);
  const city = state.core.players.find(player => player.id === defender)!.civilization.cities.filter(candidate => near.has(candidate.hexId) && isPort(state, candidate.hexId)).sort((a, b) => a.id.localeCompare(b.id))[0];
  const meta = city ? state.cities.find(candidate => candidate.cityId === city.id) : undefined;
  if (!city || !meta) return;
  meta.portBlockedUntil = state.core.round + 1; meta.portBlockedBy = attacker;
  alphaEvent(state, 'PORT_BLOCKED', `Abordagem: o porto de ${city.name} está bloqueado até o fim da próxima rodada.`, [attacker, defender]);
}

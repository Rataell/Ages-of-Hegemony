import {
  cityModifierSide, type AlphaCity, type CityId, type AlphaState, type AlphaUnit, type BattlePosture, type CombatConfig, type HexId, type PlayerId, type StrategicOrder, type TacticalFace,
} from '@aoh/game-domain';
import { hexNeighbors, hexId } from './hex.js';
import { alphaRandomInteger } from './alpha-random.js';
import { occupyCity } from './alpha-cities.js';
import { infrastructureStats } from './urban.js';
import { strengthSources } from './alpha-institutions.js';
import { canEnter, unitSupply, validateMilitaryOrder } from './alpha-military.js';
import { visibleHexIds } from './alpha-world.js';
import { stackBlock, stackRoom } from './alpha-stack.js';
import { settleCargo } from './alpha-naval.js';
import { isSignature } from './alpha-kits.js';
import { alphaEvent } from './alpha-events.js';

type Order = Extract<StrategicOrder, { type: 'ATTACK' }>;
export interface Modifier { source: string; amount: number }
type Tactical = { unitId: string; face: TacticalFace; effect: string };
type Fort = { level: AlphaCity['fortification']['level']; state: AlphaCity['fortification']['state'] };

const POSTURE_TEXT: Record<BattlePosture, string> = { ASSAULT: 'Assalto', HOLD: 'Defesa', MANEUVER: 'Manobra' };
const push = (list: Modifier[], source: string, amount: number) => { if (amount !== 0) list.push({ source, amount }); };
const byId = <T extends { id: string }>(a: T, b: T) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const sumOf = (list: Modifier[]) => list.reduce((total, item) => total + item.amount, 0);

/** Fortification strength: the level's bonus, scaled by how intact the walls are. */
export function fortificationBonus(config: CombatConfig, fort: Fort): number {
  const base = config.fortification.levelBonus[fort.level];
  return fort.state === 'INTACT' ? base : fort.state === 'DAMAGED' ? Math.floor(base * config.fortification.damagedPercent / 100) : 0;
}
const fortified = (fort: Fort) => fort.level !== 'NONE' && fort.state !== 'BREACHED';
const nextBreach = (state: Fort['state'], steps: number): Fort['state'] => (['INTACT', 'DAMAGED', 'BREACHED'] as const)[Math.min(2, (['INTACT', 'DAMAGED', 'BREACHED'] as const).indexOf(state) + steps)]!;

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

/**
 * Every static (pre-dice) contribution of one side, by origin: terrain, supply, fortification, technology, leader and cards.
 * The unit strength itself is reported separately as `strength`.
 */
function staticSide(state: AlphaState, sides: Sides, attacking: boolean) {
  const config = state.rules.combat;
  const owner = attacking ? sides.attackerId : sides.defenderId, units = attacking ? sides.attackers : sides.defenders;
  const fighters = units.filter(unit => state.rules.units[unit.kind].strength > 0);
  const modifiers: Modifier[] = [];
  const terrain = units.reduce((total, unit) => total + state.rules.units[unit.kind].terrainModifiers[sides.terrain as keyof typeof state.rules.units.INFANTRY.terrainModifiers], 0);
  const landform = attacking ? 0 : sides.terrain === 'HILLS' ? config.hillDefense : sides.terrain === 'MOUNTAINS' ? config.mountainDefense : 0;
  push(modifiers, 'Terreno', terrain + landform);
  if (attacking && units.some(unit => unit.carrierId && !isSignature(state, unit))) push(modifiers, 'Desembarque anfíbio', -1);
  if (sides.city) {
    const side = attacking ? 'ATTACK' : 'DEFENSE';
    const cityBonus = units.reduce((total, unit) => total + (cityModifierSide(unit.kind, state.rules.units[unit.kind]) === side ? state.rules.units[unit.kind].cityModifier : 0), 0);
    push(modifiers, attacking ? 'Equipamento contra cidade' : 'Guarda da cidade', cityBonus);
  }
  if (fighters.some(unit => !unitSupply(state, unit).supplied)) push(modifiers, 'Sem suprimento', -config.unsuppliedPenalty);
  let fortification: Fort | null = null;
  if (!attacking && sides.meta) {
    fortification = { ...sides.meta.fortification };
    push(modifiers, 'Fortificação', fortificationBonus(config, fortification));
    if (fortified(fortification)) push(modifiers, 'Defensores abrigados', fighters.filter(unit => unit.kind === 'GUARD' || unit.kind === 'INFANTRY').length * config.fortification.fortifiedDefenderBonus);
    if (fortified(fortification)) push(modifiers, 'Guarda de Escudos', fighters.filter(unit => unit.kind === 'GUARD' && isSignature(state, unit)).length);
  }
  const sources = strengthSources(state, owner);
  push(modifiers, 'Tecnologia', sources.technology);
  push(modifiers, 'Líder', sources.leader);
  push(modifiers, 'Cartas e efeitos', sources.other);
  const strength = units.reduce((total, unit) => total + state.rules.units[unit.kind].strength, 0)
    + (!attacking && sides.city ? ['OUTPOST', 'HAMLET', 'VILLAGE', 'CITY', 'GREAT_CITY', 'METROPOLIS', 'IMPERIAL_METROPOLIS'].indexOf(state.cities.find(meta => meta.cityId === sides.city!.id)?.level ?? 'OUTPOST') + 1 + infrastructureStats(sides.city, state.core.config).garrisonCapacity : 0);
  return { owner, units, fighters, modifiers, strength, fortification };
}

/** The circular posture advantage, awarded to exactly the side whose posture beats the other's (equal postures give nothing). */
function postureModifiers(config: CombatConfig, attackerPosture: BattlePosture, defenderPosture: BattlePosture) {
  const attack: Modifier[] = [], defense: Modifier[] = [];
  if (config.posture[attackerPosture].beats === defenderPosture) push(attack, `Postura ${POSTURE_TEXT[attackerPosture]} vence ${POSTURE_TEXT[defenderPosture]}`, config.postureAdvantage);
  else if (config.posture[defenderPosture].beats === attackerPosture) push(defense, `Postura ${POSTURE_TEXT[defenderPosture]} vence ${POSTURE_TEXT[attackerPosture]}`, config.postureAdvantage);
  return { attack, defense };
}

interface Tally { impacts: number; guards: number; maneuvers: number; flat: Modifier[]; breach: number }
/** Turns one side's rolled faces into tactical counts: the COMMAND face acts by unit class, and archers turn empty allies into impacts. */
function tally(state: AlphaState, sides: Sides, attacking: boolean, posture: BattlePosture, fighters: AlphaUnit[], rolls: Tactical[]): Tally {
  const config = state.rules.combat, tally: Tally = { impacts: 0, guards: 0, maneuvers: 0, flat: [], breach: 0 };
  const fortifiedTarget = attacking && sides.meta !== undefined && fortified(sides.meta.fortification);
  const kindOf = new Map(fighters.map(unit => [unit.id, unit.kind]));
  // 1. Archers convert empty allied dice into impacts, in unit-id order, up to their configured number.
  for (const roll of rolls) {
    if (roll.face !== 'COMMAND' || kindOf.get(roll.unitId) !== 'RANGED') continue;
    let budget = config.command.rangedConversions;
    for (const ally of rolls) {
      if (budget === 0) break;
      if (ally.face === 'EMPTY') { ally.face = 'IMPACT'; ally.effect = 'Apoio dos arqueiros: vazio virou impacto'; budget--; }
    }
    roll.effect = budget === config.command.rangedConversions ? 'Comando de apoio sem dado vazio para converter' : 'Comando de apoio';
  }
  for (const roll of rolls) {
    const kind = kindOf.get(roll.unitId)!;
    if (roll.face === 'IMPACT') { tally.impacts++; roll.effect ||= 'Impacto'; }
    else if (roll.face === 'GUARD') { tally.guards++; roll.effect ||= 'Guarda'; }
    else if (roll.face === 'MANEUVER') { tally.maneuvers++; roll.effect ||= 'Manobra'; }
    else if (roll.face === 'EMPTY') roll.effect ||= 'Sem efeito';
    else if (roll.face === 'COMMAND') {
      if (kind === 'INFANTRY') { if (posture === 'HOLD') { tally.guards++; roll.effect = 'Comando: guarda (postura de defesa)'; } else { tally.impacts++; roll.effect = 'Comando: impacto'; } }
      else if (kind === 'GUARD') { tally.guards++; roll.effect = 'Comando: guarda extra'; if (!attacking && sides.city) { tally.flat.push({ source: 'Proteção da cidade', amount: config.command.cityGuardProtection }); roll.effect += ' e proteção da cidade'; } }
      else if (kind === 'CAVALRY') { if ((config.command.cavalryFlankTerrains as string[]).includes(sides.terrain)) { tally.flat.push({ source: 'Flanco da cavalaria', amount: config.command.cavalryFlank }); roll.effect = 'Comando: flanco'; } else roll.effect = 'Comando: terreno não permite flanco'; }
      else if (kind === 'SIEGE') { if (fortifiedTarget) { tally.breach += config.command.siegeBreachSteps + (isSignature(state, { ownerId: attacking ? sides.attackerId : sides.defenderId, kind }) && sides.meta && !['NONE', 'PALISADE'].includes(sides.meta.fortification.level) ? 1 : 0); roll.effect = 'Comando: brecha na fortificação'; } else { tally.impacts++; roll.effect = 'Comando: impacto (sem fortificação)'; } }
      else if (kind === 'FLEET') { if ((config.command.navalTerrains as string[]).includes(sides.terrain)) { tally.flat.push({ source: 'Superioridade naval', amount: config.command.navalBonus }); roll.effect = 'Comando: efeito naval'; } else roll.effect = 'Comando: frota sem efeito em terra'; }
      else if (kind !== 'RANGED') roll.effect = 'Comando';
    }
  }
  return tally;
}

function points(state: AlphaState, posture: BattlePosture, own: Tally, foe: Tally) {
  const config = state.rules.combat, empowers = config.posture[posture].empowers;
  const impactValue = config.impactValue + (empowers === 'IMPACT' ? config.empoweredBonus : 0);
  const maneuverValue = config.maneuverValue + (empowers === 'MANEUVER' ? config.empoweredBonus : 0);
  const cancels = own.guards * (empowers === 'GUARD' ? config.holdGuardCancels : config.guardCancels);
  const cancelled = Math.min(cancels, foe.impacts);
  return { impactValue, maneuverValue, cancels, cancelled };
}

function dieSummary(state: AlphaState, own: Tally, foe: Tally, ownPosture: BattlePosture, foePosture: BattlePosture): Modifier[] {
  const mine = points(state, ownPosture, own, foe), theirs = points(state, foePosture, foe, own);
  const list: Modifier[] = [];
  push(list, 'Dados: impactos', own.impacts * mine.impactValue);
  push(list, 'Dados: manobra', own.maneuvers * mine.maneuverValue);
  for (const item of own.flat) push(list, item.source, item.amount);
  push(list, `Guardas inimigas anularam ${theirs.cancelled} impacto(s)`, -theirs.cancelled * mine.impactValue);
  return list;
}

/** One die per fighting unit from the private RNG. `forced` (tests only) fixes chosen faces without consuming randomness. */
function rollFaces(state: AlphaState, fighters: AlphaUnit[], forced?: Record<string, TacticalFace>): Tactical[] {
  const faces = state.rules.combat.dieFaces;
  return fighters.map(unit => ({ unitId: unit.id, face: forced?.[unit.id] ?? faces[alphaRandomInteger(state, faces.length)]!, effect: '' }));
}

export interface CombatPreview {
  ok: boolean; blocked: string | null; target: string; terrain: string; dieFaces: readonly TacticalFace[];
  attacker: { strength: number; posture: BattlePosture; units: { id: string; kind: string; strength: number }[]; breakdown: Modifier[]; total: number };
  defender: { visible: boolean; strength: number; units: { kind: string; strength: number }[]; breakdown: Modifier[]; fortification: Fort | null; posture: 'UNKNOWN' } | null;
  /** What happens to the attacking pieces after a victory: only as many as the target hex's stack limits allow advance. */
  advance: { total: number; stays: number; note: string | null };
  note: string;
}

/**
 * What an attack order looks like before the dice: every static contribution by origin for both sides, the die faces
 * (public), and no random result. The defender's posture and anything on hexes the attacker cannot see stay hidden.
 */
export function combatPreview(state: AlphaState, actor: PlayerId, order: Order): CombatPreview {
  const config = state.rules.combat;
  let blocked: string | null = null;
  try { validateMilitaryOrder(state, actor, order); } catch (error: unknown) { blocked = error instanceof Error ? error.message : 'Ordem inválida.'; }
  const base = { dieFaces: config.dieFaces, note: 'Cada peça de combate rola 1 dado tático na resolução; o resultado só existe depois da batalha.' };
  const terrain = state.core.map.find(tile => tile.id === order.target)?.terrain ?? 'UNKNOWN';
  if (blocked !== null) return { ok: false, blocked, target: order.target, terrain, ...base, attacker: { strength: 0, posture: order.posture, units: [], breakdown: [], total: 0 }, defender: null, advance: { total: 0, stays: 0, note: null } };
  const sides = sidesOf(state, actor, order);
  const attack = staticSide(state, sides, true);
  const seen = visibleHexIds(state, actor).has(order.target);
  const room = stackRoom(state, actor, sides.attackers, order.target);
  const advance = { total: sides.attackers.length, stays: room.stays.length, note: room.stays.length ? `Limite de pilha atingido em ${order.target}: se vencer, ${room.fits.length} de ${sides.attackers.length} peças avançam e ${room.stays.length} permanecem em ${sides.attackers[0]!.hexId}.` : null };
  const defend = staticSide(state, sides, false);
  return {
    ok: true, blocked: null, target: order.target, terrain, ...base, advance,
    attacker: { strength: attack.strength, posture: order.posture, units: sides.attackers.map(unit => ({ id: unit.id, kind: unit.kind, strength: state.rules.units[unit.kind].strength })), breakdown: attack.modifiers, total: attack.strength + sumOf(attack.modifiers) },
    defender: seen
      ? { visible: true, strength: defend.strength, units: sides.defenders.map(unit => ({ kind: unit.kind, strength: state.rules.units[unit.kind].strength })), breakdown: defend.modifiers, fortification: defend.fortification, posture: 'UNKNOWN' }
      : { visible: false, strength: 0, units: [], breakdown: [], fortification: null, posture: 'UNKNOWN' },
  };
}

/**
 * Tactical battle. Steps: validate, supply, terrain, fortification, postures, one die per fighting unit, COMMAND by class,
 * guards cancel impacts, breach, totals (the defender wins ties), losses, retreat, report. All randomness comes from the private RNG,
 * attackers first and then defenders, each in unit-id order, so a battle replays identically.
 */
export function resolveBattle(state: AlphaState, actor: PlayerId, order: Order): void { resolveBattleWithFaces(state, actor, order); }
/** The same resolution with some dice fixed. Used by tests to exercise each face and COMMAND without depending on a seed. */
export function resolveBattleWithFaces(state: AlphaState, actor: PlayerId, order: Order, forced?: Record<string, TacticalFace>): void {
  validateMilitaryOrder(state, actor, order);
  const config = state.rules.combat;
  const sides = sidesOf(state, actor, order);
  const { attackers, defenders, defenderId, city } = sides;
  const tile = state.core.map.find(candidate => candidate.id === order.target)!;
  const attackerPosture = order.posture, defenderPosture = state.players.find(player => player.playerId === defenderId)!.defensePosture;
  const attack = staticSide(state, sides, true), defend = staticSide(state, sides, false);

  const attackerRolls = rollFaces(state, attack.fighters, forced), defenderRolls = rollFaces(state, defend.fighters, forced);
  const attackTally = tally(state, sides, true, attackerPosture, attack.fighters, attackerRolls);
  const defendTally = tally(state, sides, false, defenderPosture, defend.fighters, defenderRolls);

  const posture = postureModifiers(config, attackerPosture, defenderPosture);
  const attackBreakdown = [...attack.modifiers, ...posture.attack, ...dieSummary(state, attackTally, defendTally, attackerPosture, defenderPosture)];
  const defenseBreakdown = [...defend.modifiers, ...posture.defense, ...dieSummary(state, defendTally, attackTally, defenderPosture, attackerPosture)];

  // Breach: sieges chip the walls after the dice, which weakens the defence by the fortification they take away.
  let fortification: { cityId: CityId; before: Fort; after: Fort } | null = null;
  if (sides.meta && city) {
    const before: Fort = { ...sides.meta.fortification };
    const after: Fort = { ...before, state: attackTally.breach > 0 && fortified(before) ? nextBreach(before.state, attackTally.breach) : before.state };
    if (after.state !== before.state) {
      const lost = fortificationBonus(config, before) - fortificationBonus(config, after);
      const shelter = fortified(before) && !fortified(after) ? defend.fighters.filter(unit => unit.kind === 'GUARD' || unit.kind === 'INFANTRY').length * config.fortification.fortifiedDefenderBonus : 0;
      push(defenseBreakdown, 'Brecha aberta pelo cerco', -(lost + shelter));
      sides.meta.fortification = { ...after };
    }
    fortification = { cityId: city.id, before, after };
  }

  const attackModifiers = sumOf(attackBreakdown), defenseModifiers = sumOf(defenseBreakdown);
  const attackTotal = attack.strength + attackModifiers, defenseTotal = defend.strength + defenseModifiers;
  const attackerWins = attackTotal > defenseTotal;
  const losers = attackerWins ? defenders : attackers, margin = Math.abs(attackTotal - defenseTotal);
  const casualties = margin >= config.largeMargin ? 3 : margin >= config.mediumMargin ? 2 : 1;
  const losses = [...losers].sort((a, b) => state.rules.units[a.kind].strength - state.rules.units[b.kind].strength || byId(a, b)).slice(0, casualties).map(unit => unit.id);
  const survivors = losers.filter(unit => !losses.includes(unit.id));
  let retreat: HexId | null = attackerWins ? null : attackers[0]!.hexId;
  if (attackerWins && survivors.length) {
    retreat = hexNeighbors(tile).map(hexId).sort().find(id => survivors.every(unit => canEnter(state, unit, id)) && stackBlock(state, defenderId, survivors, id) === null && !state.units.some(unit => unit.hexId === id && unit.ownerId !== defenderId) && state.core.map.some(candidate => candidate.id === id && (candidate.ownerId === null || candidate.ownerId === defenderId))) ?? null;
    if (retreat) survivors.forEach(unit => { unit.hexId = retreat!; }); else losses.push(...survivors.map(unit => unit.id));
  }
  state.units = state.units.filter(unit => !losses.includes(unit.id));
  if (attackerWins) {
    // Stack limits: only as many pieces as fit advance, in id order; the rest keep their hex.
    const { fits, stays } = stackRoom(state, actor, attackers, order.target);
    fits.forEach(unit => { unit.hexId = order.target; unit.carrierId = null; });
    if (stays.length) alphaEvent(state, 'STACK_LIMIT', `Limite de pilha em ${order.target}: ${fits.length} peças avançaram e ${stays.length} permaneceram em ${stays[0]!.hexId}.`, [actor]);
    state.players.find(player => player.playerId === actor)!.victories++;
    if (city && city.ownerId !== actor) occupyCity(state, actor, city.id);
  }
  state.battles.push({
    id: `battle-${state.battles.length + 1}`, round: state.core.round, hexId: order.target, attackerId: actor, defenderId,
    attackerUnits: attackers.map(unit => unit.id), defenderUnits: defenders.map(unit => unit.id), attackerPosture, defenderPosture,
    attackBreakdown, defenseBreakdown, attackerTactical: attackerRolls, defenderTactical: defenderRolls, fortification,
    attackStrength: attack.strength, defenseStrength: defend.strength, attackModifiers, defenseModifiers, attackTotal, defenseTotal,
    winnerId: attackerWins ? actor : defenderId, losses, retreat,
  });
  settleCargo(state);
}

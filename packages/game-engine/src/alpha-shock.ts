import type { AlphaState, AlphaUnit, BattlePosture, CombatConfig, FortificationLevel, FortificationState, ShockOutcome, TacticalFace } from '@aoh/game-domain';
import { alphaRandomInteger } from './alpha-random.js';
import { GRADE_NUMERALS, type Grade } from './alpha-grades.js';

/**
 * The V5.1b tactical shock (canon §11b), as a pure core over descriptors of pieces so that player battles and world threats
 * (Bandos, Piratas) share one engine. One die per fighting piece from the private RNG, attackers first then defenders, each in id
 * order. Nothing here moves a piece or removes a loss: the caller applies Δ.
 */
export interface Modifier { source: string; amount: number }
export type Fort = { level: FortificationLevel; state: FortificationState };
export interface ShockPiece { id: string; kind: AlphaUnit['kind']; grade: Grade; /** Civilization signature variant (kit): Guarda de Escudos, Engenheiros de Cerco. */ signature?: boolean }
export interface ShockSide { pieces: readonly ShockPiece[]; posture: BattlePosture; /** Terrain, supply, technology, Leader, cards: everything that is not dice, signature or fortification. */ flat: readonly Modifier[] }
export interface ShockInput { attacker: ShockSide; defender: ShockSide; terrain: string; city: boolean; fortification: Fort | null; forced?: Record<string, TacticalFace> }
export interface ShockRoll { unitId: string; face: TacticalFace; effect: string; grade: Grade }
export interface ShockResult {
  attackerRolls: ShockRoll[]; defenderRolls: ShockRoll[]; attackBreakdown: Modifier[]; defenseBreakdown: Modifier[];
  attackStrength: number; defenseStrength: number; attackTotal: number; defenseTotal: number; attackModifiers: number; defenseModifiers: number;
  delta: number; outcome: ShockOutcome; breachSteps: number; fortificationAfter: Fort | null;
  /** Frota Abordagem: an attacking Frota rolled Comando. */
  boarding: boolean;
}

const LEVELS = ['INTACT', 'DAMAGED', 'BREACHED'] as const;
export const POSTURE_TEXT: Record<BattlePosture, string> = { ASSAULT: 'Assalto', HOLD: 'Manter', MANEUVER: 'Manobra' };
const push = (list: Modifier[], source: string, amount: number) => { if (amount !== 0) list.push({ source, amount }); };
export const sumOf = (list: readonly Modifier[]) => list.reduce((total, item) => total + item.amount, 0);
export const isFortified = (fort: Fort | null): fort is Fort => fort !== null && fort.level !== 'NONE' && fort.state !== 'BREACHED';
export const nextBreach = (state: FortificationState, steps: number): FortificationState => LEVELS[Math.min(2, LEVELS.indexOf(state) + steps)]!;
/** Fortification strength: the level's bonus, scaled by how intact the walls are. */
export function fortificationBonus(config: CombatConfig, fort: Fort): number {
  const base = config.fortification.levelBonus[fort.level];
  return fort.state === 'INTACT' ? base : fort.state === 'DAMAGED' ? Math.floor(base * config.fortification.damagedPercent / 100) : 0;
}
/** Δ reading (canon §11b): |Δ| below the medium margin is a tactical tie, from the large margin on it is decisive. */
export const classifyDelta = (config: CombatConfig, delta: number): ShockOutcome => Math.abs(delta) < config.mediumMargin ? 'TIE' : Math.abs(delta) >= config.largeMargin ? 'DECISIVE' : 'VICTORY';
/** Pieces the loser loses: tie 1 per side (only with 2+ pieces, checked by the caller), victory 1, decisive 2. */
export const casualtyCount = (outcome: ShockOutcome): number => outcome === 'DECISIVE' ? 2 : 1;

function rollFaces(state: AlphaState, fighters: readonly ShockPiece[], forced?: Record<string, TacticalFace>): ShockRoll[] {
  const faces = state.rules.combat.dieFaces;
  return [...fighters].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).map(piece => ({ unitId: piece.id, face: forced?.[piece.id] ?? faces[alphaRandomInteger(state, faces.length)]!, effect: '', grade: piece.grade }));
}

interface Tally { impacts: number; maneuvers: number; cancels: number; flat: Modifier[]; breach: number; boarding: boolean; salvaIII: boolean }
function tally(state: AlphaState, side: ShockSide, rolls: ShockRoll[], attacking: boolean, input: ShockInput): Tally {
  const config = state.rules.combat, sig = config.signatures, result: Tally = { impacts: 0, maneuvers: 0, cancels: 0, flat: [], breach: 0, boarding: false, salvaIII: false };
  const kinds = new Map(side.pieces.map(piece => [piece.id, piece]));
  const fortifiedTarget = attacking && input.city && isFortified(input.fortification);
  const empowers = config.posture[side.posture].empowers;
  for (const roll of rolls) {
    const piece = kinds.get(roll.unitId)!, g = piece.grade - 1, name = `${state.rules.units[piece.kind].name} ${GRADE_NUMERALS[g]}`;
    if (roll.face === 'IMPACT') { result.impacts++; roll.effect = 'Impacto'; }
    else if (roll.face === 'MANEUVER') { result.maneuvers++; roll.effect = 'Manobra'; }
    else if (roll.face === 'EMPTY') roll.effect = 'Sem efeito';
    else if (roll.face === 'GUARD') {
      const counts = !attacking || side.posture === 'HOLD' || (piece.kind === 'INFANTRY' && sig.linhaAttacks[g]);
      const base = empowers === 'GUARD' ? config.holdGuardCancels : config.guardCancels;
      const value = piece.kind === 'INFANTRY' ? Math.max(base, sig.linhaCancels[g]!) : base;
      if (counts) { result.cancels += value; roll.effect = piece.kind === 'INFANTRY' ? `Linha: Guarda cancela ${value} Impacto(s)` : `Guarda cancela ${value} Impacto(s)`; }
      else roll.effect = 'Guarda sem efeito ao atacar fora da postura Manter';
    } else if (piece.kind === 'RANGED') { push(result.flat, `Salva (${name})`, sig.salva[g]!); if (piece.grade === 3) result.salvaIII = true; roll.effect = `Comando: Salva +${sig.salva[g]} Poder`; }
    else if (piece.kind === 'CAVALRY') {
      const open = input.terrain === 'PLAINS' || (input.terrain === 'HILLS' && sig.flankHills[g]);
      if (open) { push(result.flat, `Flanco (${name})`, sig.flank[g]!); roll.effect = `Comando: Flanco +${sig.flank[g]} Poder`; } else roll.effect = 'Comando: terreno não permite Flanco';
    } else if (piece.kind === 'SIEGE') {
      if (fortifiedTarget) { const extra = piece.signature && input.fortification && !['NONE', 'PALISADE'].includes(input.fortification.level) ? 1 : 0; result.breach += sig.breachSteps[g]! + extra; roll.effect = `Comando: Brecha abre ${sig.breachSteps[g]! + extra} passo(s) de Integridade`; }
      else roll.effect = 'Comando: sem fortificação para abrir';
    } else if (piece.kind === 'FLEET') { if (attacking) { result.boarding = true; roll.effect = 'Comando: Abordagem'; } else roll.effect = 'Comando: Abordagem só vale ao atacar'; }
    else roll.effect = 'Comando sem assinatura nesta família';
  }
  return result;
}

/** Passive signatures that do not wait for a Comando face: Cerco Brecha vs city, Guarda Muro, kit Guarda de Escudos. */
export function signaturePassives(state: AlphaState, side: ShockSide, attacking: boolean, input: ShockInput): Modifier[] {
  const sig = state.rules.combat.signatures, list: Modifier[] = [];
  for (const piece of side.pieces) {
    const g = piece.grade - 1, name = `${state.rules.units[piece.kind].name} ${GRADE_NUMERALS[g]}`;
    if (piece.kind === 'SIEGE' && attacking && input.city && isFortified(input.fortification)) push(list, `Brecha (${name})`, sig.siegeVsFortified);
    if (piece.kind === 'GUARD' && !attacking) {
      if (input.city) push(list, `Muro (${name})`, sig.muroCity[g]!);
      if (input.terrain === 'HILLS' || input.terrain === 'MOUNTAINS') push(list, `Muro em terreno alto (${name})`, sig.muroRough[g]!);
      if (piece.signature && isFortified(input.fortification)) push(list, 'Guarda de Escudos', 1);
    }
  }
  return list;
}

function postureModifiers(config: CombatConfig, attackerPosture: BattlePosture, defenderPosture: BattlePosture) {
  const attack: Modifier[] = [], defense: Modifier[] = [];
  if (config.posture[attackerPosture].beats === defenderPosture) push(attack, `Postura ${POSTURE_TEXT[attackerPosture]} vence ${POSTURE_TEXT[defenderPosture]}`, config.postureAdvantage);
  else if (config.posture[defenderPosture].beats === attackerPosture) push(defense, `Postura ${POSTURE_TEXT[defenderPosture]} vence ${POSTURE_TEXT[attackerPosture]}`, config.postureAdvantage);
  return { attack, defense };
}

function diceLines(state: AlphaState, own: Tally, foe: Tally, ownPosture: BattlePosture): Modifier[] {
  const config = state.rules.combat, empowers = config.posture[ownPosture].empowers, list: Modifier[] = [];
  const impactValue = config.impactValue + (empowers === 'IMPACT' ? config.empoweredBonus : 0);
  const maneuverValue = config.maneuverValue + (empowers === 'MANEUVER' ? config.empoweredBonus : 0);
  const cancelled = Math.min(foe.cancels, own.impacts);
  push(list, 'Dados: impactos', own.impacts * impactValue);
  push(list, 'Dados: manobra', own.maneuvers * maneuverValue);
  for (const item of own.flat) push(list, item.source, item.amount);
  push(list, `Guardas inimigas anularam ${cancelled} impacto(s)`, -cancelled * impactValue);
  return list;
}

export function resolveShock(state: AlphaState, input: ShockInput): ShockResult {
  const config = state.rules.combat, power = (piece: ShockPiece) => state.rules.units[piece.kind].strength;
  const attackFighters = input.attacker.pieces.filter(piece => power(piece) > 0), defendFighters = input.defender.pieces.filter(piece => power(piece) > 0);
  const attackerRolls = rollFaces(state, attackFighters, input.forced), defenderRolls = rollFaces(state, defendFighters, input.forced);
  const attackTally = tally(state, { ...input.attacker, pieces: attackFighters }, attackerRolls, true, input);
  const defendTally = tally(state, { ...input.defender, pieces: defendFighters }, defenderRolls, false, input);
  const posture = postureModifiers(config, input.attacker.posture, input.defender.posture);
  const attackBreakdown: Modifier[] = [...input.attacker.flat, ...signaturePassives(state, { ...input.attacker, pieces: attackFighters }, true, input), ...posture.attack, ...diceLines(state, attackTally, defendTally, input.attacker.posture)];
  const defenseBreakdown: Modifier[] = [...input.defender.flat, ...signaturePassives(state, { ...input.defender, pieces: defendFighters }, false, input), ...posture.defense, ...diceLines(state, defendTally, attackTally, input.defender.posture)];

  // Fortification (defender in a city): level bonus, then what the attackers ignore (Cerco III vs light walls, Salva III), then the breach the dice open.
  let fortificationAfter: Fort | null = null, breachSteps = 0;
  if (input.city && input.fortification) {
    const before = input.fortification;
    const ignored = (fort: Fort, bonus: number) => {
      const light = attackFighters.some(piece => piece.kind === 'SIEGE' && piece.grade === 3) && (fort.level === 'PALISADE' || fort.level === 'STONE_WALL');
      return light ? bonus : attackTally.salvaIII ? Math.min(1, bonus) : 0;
    };
    const bonusBefore = isFortified(before) ? fortificationBonus(config, before) : 0;
    push(defenseBreakdown, 'Fortificação', bonusBefore);
    const skipped = ignored(before, bonusBefore);
    push(defenseBreakdown, 'Fortificação ignorada (Cerco/Salva Grau III)', -skipped);
    breachSteps = isFortified(before) ? attackTally.breach : 0;
    const after: Fort = { ...before, state: breachSteps > 0 ? nextBreach(before.state, breachSteps) : before.state };
    const bonusAfter = isFortified(after) ? fortificationBonus(config, after) : 0;
    const lost = Math.max(0, (bonusBefore - skipped) - Math.max(0, bonusAfter - ignored(after, bonusAfter)));
    push(defenseBreakdown, 'Brecha aberta pelo cerco', -lost);
    fortificationAfter = after;
  }
  const attackStrength = attackFighters.reduce((total, piece) => total + power(piece), 0), defenseStrength = defendFighters.reduce((total, piece) => total + power(piece), 0);
  const attackModifiers = sumOf(attackBreakdown), defenseModifiers = sumOf(defenseBreakdown);
  const attackTotal = attackStrength + attackModifiers, defenseTotal = defenseStrength + defenseModifiers, delta = attackTotal - defenseTotal;
  return { attackerRolls, defenderRolls, attackBreakdown, defenseBreakdown, attackStrength, defenseStrength, attackTotal, defenseTotal, attackModifiers, defenseModifiers, delta, outcome: classifyDelta(config, delta), breachSteps, fortificationAfter, boarding: attackTally.boarding };
}

/** Casualty order (I-4/I-17): fighting pieces first, weakest Power first, Cerco last, then id. Pieces without Power only die when no fighter is left. */
/** The engine's own casualty order (V5.1b I-4/I-17): pieces with strength before those without, weakest first, Cerco last, id as the tie-break. */
const engineOrder = <T extends { id: string; kind: AlphaUnit['kind'] }>(state: AlphaState, pieces: readonly T[]): T[] => {
  const power = (piece: T) => state.rules.units[piece.kind].strength;
  return [...pieces].sort((a, b) => Number(power(a) === 0) - Number(power(b) === 0) || Number(a.kind === 'SIEGE') - Number(b.kind === 'SIEGE') || power(a) - power(b) || (a.id < b.id ? -1 : 1));
};

/** The order a player would see untouched: every combat kind in the sequence the engine uses when the owner never sets a priority (ties keep catalog order). */
export function defaultCasualtyPriority(state: AlphaState): AlphaUnit['kind'][] {
  const kinds = (Object.keys(state.rules.units) as AlphaUnit['kind'][]).filter(kind => state.rules.units[kind].strength > 0);
  return kinds.sort((a, b) => Number(a === 'SIEGE') - Number(b === 'SIEGE') || state.rules.units[a].strength - state.rules.units[b].strength);
}

/**
 * Which pieces fall. Without an owner priority this is exactly the engine order. With one, strengthless pieces still come last (civil
 * pieces are never chosen ahead of fighters), then the owner's list decides (kinds not listed follow, in engine order); each piece uses the priority of the
 * stack it stands in (hex override, else the civilization default). No prompt, no randomness: the list is read at resolution.
 */
export function chooseLosses<T extends { id: string; kind: AlphaUnit['kind'] }>(state: AlphaState, pieces: readonly T[], count: number): string[] {
  const power = (piece: T) => state.rules.units[piece.kind].strength;
  const rank = new Map<string, number>();
  for (const piece of pieces) {
    const unit = state.units.find(candidate => candidate.id === piece.id);
    const owner = unit && state.players.find(player => player.playerId === unit.ownerId);
    const list = owner ? (owner.casualtyPriority.byHex[unit!.hexId] ?? owner.casualtyPriority.order) : [];
    const index = list.indexOf(piece.kind);
    rank.set(piece.id, index < 0 ? list.length : index);
  }
  const ranked = engineOrder(state, pieces).sort((a, b) => (Number(power(a) === 0) - Number(power(b) === 0)) || (rank.get(a.id)! - rank.get(b.id)!));
  return ranked.slice(0, count).map(piece => piece.id);
}

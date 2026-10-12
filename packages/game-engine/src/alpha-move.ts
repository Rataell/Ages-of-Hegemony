import { COORDINATED_MOVE_MAX_PIECES, moveLegs, orderUnitIds, type AlphaState, type AlphaUnit, type HexId, type MoveLeg, type MoveOrder, type PlayerId } from '@aoh/game-domain';
import { hexDistance } from './hex.js';
import { alphaActionCapacity, alphaActionUsage } from './alpha-actions.js';
import { enemyCityAt, movementOpen } from './alpha-diplomacy.js';
import { frontierRegionOf, planFrontierMove, stepCost } from './alpha-frontier.js';
import { canEnter, moveBudget, validateMoveLeg } from './alpha-military.js';
import { isCarried } from './alpha-naval.js';
import { pendingArrivals, stackBlock } from './alpha-stack.js';
import { frontierRiskFor, type FrontierRisk } from './alpha-unit-options.js';
import { kitFrontierCost } from './alpha-kits.js';

/**
 * Mover coordenado (V12-UX-04, owner decision D1). One MOVE Order may carry `legs`: 2..COORDINATED_MOVE_MAX_PIECES pieces in total, each leg with its own path, destination and
 * (when it enters the unknown) rotation. It costs ONE Order, charged when it is queued; each leg is then validated and resolved on its own, so a leg that is no longer legal
 * fails alone and the others still move. The legacy `{unitIds, path}` Order (one path, a whole stack) is untouched.
 *
 * `previewMoveOrder` is the read-only twin of QUEUE_ORDER: the same rules, answered per leg with cost, budget, remaining and concrete blockers, for the Ficha de Ação.
 */
export type MoveBlockerCode =
  | 'PHASE' | 'NOT_ENABLED' | 'PIECE_LIMIT' | 'NO_ORDERS' | 'NOT_OWNED' | 'DUPLICATE_PIECE' | 'PIECE_IN_ORDER' | 'CARRIED' | 'SAME_HEX'
  | 'UNKNOWN_HEX' | 'NOT_ADJACENT' | 'DOMAIN' | 'BORDER' | 'ENEMY_CITY' | 'FOREIGN_PRESENCE' | 'THREAT' | 'RANGE' | 'STACK' | 'FRONTIER' | 'RULE';
export interface MoveBlocker { code: MoveBlockerCode; message: string; unitId?: string; hexId?: string }
export interface MovePiecePreview { unitId: string; kind: AlphaUnit['kind']; from: HexId; /** Terrain points the path costs this piece. */ cost: number; /** Movement the piece has this round (grade, cards, institutions, kit). */ budget: number; remaining: number }
export interface MoveLegPreview {
  index: number; ok: boolean; unitIds: string[]; path: HexId[]; from: HexId | null; destination: HexId | null;
  /** Worst piece of the leg: the leg walks at the pace of its slowest piece. cost = most terrain points spent, budget = lowest budget, remaining = least left. */
  cost: number; budget: number; remaining: number;
  /** True when the last hex enters a closed Region (Move + Discovery). */
  frontier: boolean; frontierRisk?: FrontierRisk;
  pieces: MovePiecePreview[]; blockers: MoveBlocker[];
}
export interface MoveOrderPreview {
  ok: boolean; coordinated: boolean; legs: MoveLegPreview[];
  /** Pieces the Order moves in total, and the cap of a coordinated Order. */
  pieces: number; maxPieces: number;
  ordersBefore: number; ordersAfter: number; ordersLimit: number;
  /** Order-level blockers (phase, rule off, piece cap, Orders left, duplicated piece). Leg blockers live in `legs[i].blockers`. */
  blockers: MoveBlocker[];
}

const tileOf = (state: AlphaState, id: string) => state.core.map.find(tile => tile.id === id);
const nameOf = (state: AlphaState, unit: AlphaUnit) => state.rules.units[unit.kind].name;

/** Terrain points and the first refusal along the KNOWN steps of a path for one piece. */
function walk(state: AlphaState, actor: PlayerId, unit: AlphaUnit, steps: readonly string[], known: ReadonlySet<string>): { cost: number; blocker: MoveBlocker | null } {
  let current = tileOf(state, unit.hexId)!, cost = 0;
  const who = nameOf(state, unit), domain = state.rules.units[unit.kind].domain;
  for (const id of steps) {
    const tile = tileOf(state, id);
    if (!tile || !known.has(id) || tile.terrain === 'UNKNOWN') return { cost, blocker: { code: 'UNKNOWN_HEX', unitId: unit.id, hexId: id as HexId, message: `Hex ${id} desconhecido: só o último passo de um trajeto pode entrar numa Região fechada.` } };
    if (hexDistance(current, tile) !== 1) return { cost, blocker: { code: 'NOT_ADJACENT', unitId: unit.id, hexId: id as HexId, message: `O passo ${id} não é vizinho do anterior.` } };
    if (!canEnter(state, unit, id as HexId)) {
      return { cost, blocker: { code: 'DOMAIN', unitId: unit.id, hexId: id as HexId, message: domain === 'SEA' ? `Terra em ${id}: ${who} não entra em terra firme.` : `Mar em ${id}: ${who} (peça terrestre) não entra em água.` } };
    }
    if (!movementOpen(state, actor, tile.ownerId)) return { cost, blocker: { code: 'BORDER', unitId: unit.id, hexId: id as HexId, message: `Fronteira fechada em ${id}: sem acordo de passagem com quem a controla.` } };
    if (enemyCityAt(state, actor, id)) return { cost, blocker: { code: 'ENEMY_CITY', unitId: unit.id, hexId: id as HexId, message: `Cidade inimiga em ${id}: use uma ordem de conflito.` } };
    if (state.units.some(other => other.hexId === id && other.ownerId !== actor)) return { cost, blocker: { code: 'FOREIGN_PRESENCE', unitId: unit.id, hexId: id as HexId, message: `Presença de outra civilização em ${id}: use uma ordem de conflito.` } };
    if (state.threats.some(threat => threat.hexId === id)) return { cost, blocker: { code: 'THREAT', unitId: unit.id, hexId: id as HexId, message: `Ameaça do mundo em ${id}: use uma ordem de conflito.` } };
    cost += stepCost(state, unit, tile);
    current = tile;
  }
  return { cost, blocker: null };
}

interface Context { orderId: string; busy: ReadonlySet<string>; legs: readonly MoveLeg[]; known: ReadonlySet<string>; coordinated: boolean }

function previewLeg(state: AlphaState, actor: PlayerId, leg: MoveLeg, index: number, ctx: Context): MoveLegPreview {
  const blockers: MoveBlocker[] = [];
  const destination = (leg.path.at(-1) ?? null) as HexId | null;
  const found = leg.unitIds.map(id => state.units.find(unit => unit.id === id && unit.ownerId === actor));
  const base = { index, unitIds: [...leg.unitIds], path: [...leg.path], destination };
  if (found.some(unit => !unit)) {
    return { ...base, ok: false, from: null, cost: 0, budget: 0, remaining: 0, frontier: false, pieces: [], blockers: [{ code: 'NOT_OWNED', message: 'A ordem contém uma peça que não pertence a você.' }] };
  }
  const units = found as AlphaUnit[];
  for (const unit of units) if (ctx.busy.has(unit.id)) blockers.push({ code: 'PIECE_IN_ORDER', unitId: unit.id, message: `${nameOf(state, unit)} já está em outra Ordem nesta rodada: cancele-a antes de reordenar a peça.` });
  for (const unit of units) if (isCarried(unit)) blockers.push({ code: 'CARRIED', unitId: unit.id, message: `${nameOf(state, unit)} está embarcada: desembarque ou ataque a partir da frota.` });
  for (const unit of units) if (destination && unit.hexId === destination) blockers.push({ code: 'SAME_HEX', unitId: unit.id, hexId: destination, message: `${nameOf(state, unit)} já está em ${destination}: o movimento deve terminar em outro hex.` });
  const region = frontierRegionOf(state, actor, leg), frontier = region !== null;
  const steps = frontier ? leg.path.slice(0, -1) : leg.path;
  const pieces: MovePiecePreview[] = [];
  const unknownCost = state.rules.movementCosts.UNKNOWN;
  for (const unit of units) {
    const walked = walk(state, actor, unit, steps, ctx.known);
    if (walked.blocker && !blockers.some(item => item.code === walked.blocker!.code && item.message === walked.blocker!.message)) blockers.push(walked.blocker);
    const cost = walked.cost + (frontier && !walked.blocker ? kitFrontierCost(state, unit, unknownCost) : 0), budget = moveBudget(state, actor, unit);
    pieces.push({ unitId: unit.id, kind: unit.kind, from: unit.hexId, cost, budget, remaining: budget - cost });
  }
  const clean = blockers.length === 0;
  if (clean) for (const piece of pieces) if (piece.cost > piece.budget) {
    const unit = units.find(candidate => candidate.id === piece.unitId)!;
    blockers.push({ code: 'RANGE', unitId: unit.id, message: `Alcance insuficiente: o trajeto custa ${piece.cost} e ${nameOf(state, unit)} tem ${piece.budget} de movimento${frontier ? ' (entrar no desconhecido custa ' + unknownCost + ' e é o último passo)' : ''}.` });
  }
  if (blockers.length === 0 && destination) {
    // Arrivals on the same hex add up: pieces other Orders already send there, plus the other legs of this very Order.
    const siblings = ctx.legs.filter((other, at) => at !== index && other.path.at(-1) === destination).flatMap(other => other.unitIds);
    const pending = [...pendingArrivals(state, actor, destination, ctx.orderId), ...state.units.filter(unit => unit.ownerId === actor && siblings.includes(unit.id))];
    const crowded = stackBlock(state, actor, units, destination, pending);
    if (crowded) blockers.push({ code: 'STACK', hexId: destination, message: crowded });
  }
  if (blockers.length === 0) {
    // The shared validators stay the authority: whatever the explanations above did not foresee still refuses here, with the engine's own text.
    try { if (frontier) planFrontierMove(state, actor, leg); else validateMoveLeg(state, actor, leg); }
    catch (error: unknown) { blockers.push({ code: frontier ? 'FRONTIER' : 'RULE', message: error instanceof Error ? error.message : 'Movimento recusado.' }); }
  }
  const cost = Math.max(0, ...pieces.map(piece => piece.cost)), budget = pieces.length ? Math.min(...pieces.map(piece => piece.budget)) : 0, remaining = pieces.length ? Math.min(...pieces.map(piece => piece.remaining)) : 0;
  return { ...base, ok: blockers.length === 0, from: units[0]?.hexId ?? null, cost, budget, remaining, frontier, ...(frontier ? { frontierRisk: frontierRiskFor(state, actor) } : {}), pieces, blockers };
}

/**
 * Read-only: validates the whole set of paths as ONE Move Order, exactly as QUEUE_ORDER would, and explains it. One path is the legacy Order (any stack size); two or
 * three are a coordinated Order (needs `rules.coordinatedMove`, at most COORDINATED_MOVE_MAX_PIECES pieces in total). `orderId` names an Order being replaced.
 */
export function previewMoveOrder(state: AlphaState, actor: PlayerId, legs: readonly MoveLeg[], options: { orderId?: string } = {}): MoveOrderPreview {
  const orderId = options.orderId ?? '', progress = state.players.find(player => player.playerId === actor);
  const coordinated = legs.length > 1, blockers: MoveBlocker[] = [];
  const pieces = legs.flatMap(leg => leg.unitIds);
  if (!progress) return { ok: false, coordinated, legs: [], pieces: pieces.length, maxPieces: COORDINATED_MOVE_MAX_PIECES, ordersBefore: 0, ordersAfter: 0, ordersLimit: 0, blockers: [{ code: 'NOT_OWNED', message: 'Jogador não encontrado.' }] };
  if (state.phase !== 'PLANNING') blockers.push({ code: 'PHASE', message: 'Ordens de movimento só são reservadas no Planejamento.' });
  if (coordinated && !state.rules.coordinatedMove) blockers.push({ code: 'NOT_ENABLED', message: 'Mover coordenado não está ativo nesta partida.' });
  if (new Set(pieces).size !== pieces.length) blockers.push({ code: 'DUPLICATE_PIECE', message: 'Não repita peças entre os trajetos da ordem.' });
  if (coordinated && pieces.length > COORDINATED_MOVE_MAX_PIECES) blockers.push({ code: 'PIECE_LIMIT', message: `Um movimento coordenado leva no máximo ${COORDINATED_MOVE_MAX_PIECES} peças; esta ordem tem ${pieces.length}.` });
  const usage = alphaActionUsage(state, actor), replacing = orderId !== '' && progress.orders.some(order => order.id === orderId);
  const ordersAfter = usage.used + (replacing ? 0 : 1), ordersLimit = alphaActionCapacity(state, actor);
  if (ordersAfter > ordersLimit) blockers.push({ code: 'NO_ORDERS', message: 'Sem Ordens disponíveis nesta rodada para este movimento.' });
  const ctx: Context = { orderId, busy: new Set(progress.orders.filter(order => order.id !== orderId).flatMap(orderUnitIds)), legs, known: new Set(progress.knownHexIds), coordinated };
  const previews = legs.map((leg, index) => previewLeg(state, actor, leg, index, ctx));
  return { ok: blockers.length === 0 && previews.every(leg => leg.ok), coordinated, legs: previews, pieces: pieces.length, maxPieces: COORDINATED_MOVE_MAX_PIECES, ordersBefore: usage.used, ordersAfter, ordersLimit, blockers };
}

/**
 * QUEUE_ORDER validation of a MOVE (both shapes). Throws the player-facing refusal. Phase and Orders left are enforced by the command machinery itself.
 * A legacy Order keeps its original checks and messages; a coordinated Order is judged by the preview, so the Ficha de Ação and the command can never disagree.
 */
export function validateMoveOrder(state: AlphaState, actor: PlayerId, order: MoveOrder): void {
  if (order.legs !== undefined && !state.rules.coordinatedMove) throw new Error('Mover coordenado não está ativo nesta partida.');
  if (order.legs !== undefined) {
    const preview = previewMoveOrder(state, actor, moveLegs(order), { orderId: order.id });
    const own = preview.blockers.find(blocker => blocker.code !== 'NO_ORDERS' && blocker.code !== 'PHASE');
    if (own) throw new Error(own.message);
    const leg = preview.legs.find(candidate => !candidate.ok);
    if (leg) throw new Error(`Trajeto ${leg.index + 1} de ${preview.legs.length}: ${leg.blockers[0]!.message}`);
    return;
  }
  const [leg] = moveLegs(order);
  if (frontierRegionOf(state, actor, leg!)) planFrontierMove(state, actor, leg!); else validateMoveLeg(state, actor, leg!);
  const units = state.units.filter(unit => unit.ownerId === actor && leg!.unitIds.includes(unit.id));
  const target = leg!.path.at(-1)!;
  const crowded = stackBlock(state, actor, units, target, pendingArrivals(state, actor, target, order.id));
  if (crowded) throw new Error(crowded);
}

/** Projection: the coordinated-move rule for this seat, and which of its pieces are already in an Order. Additive; the Mesa never recomputes budgets. */
export interface CoordinatedMoveView {
  enabled: boolean; maxPieces: number;
  /** Pieces already committed to an Order of any kind this round. */
  usedPieces: number;
  /** Coordinated Orders already queued, with the pieces each carries (the cap is per Order). */
  queued: { orderId: string; pieces: number; legs: number }[];
  pieces: { unitId: string; inOrder: boolean; orderId?: string; orderType?: string; legIndex?: number }[];
}
export function coordinatedMoveView(state: AlphaState, actor: PlayerId): CoordinatedMoveView {
  const progress = state.players.find(player => player.playerId === actor);
  const orders = progress?.orders ?? [];
  const pieces = state.units.filter(unit => unit.ownerId === actor).map(unit => {
    for (const order of orders) {
      if (order.type === 'MOVE') { const index = moveLegs(order).findIndex(leg => leg.unitIds.includes(unit.id)); if (index >= 0) return { unitId: unit.id, inOrder: true, orderId: order.id, orderType: order.type, legIndex: index }; }
      else if (orderUnitIds(order).includes(unit.id)) return { unitId: unit.id, inOrder: true, orderId: order.id, orderType: order.type };
    }
    return { unitId: unit.id, inOrder: false };
  });
  return {
    enabled: state.rules.coordinatedMove === true, maxPieces: COORDINATED_MOVE_MAX_PIECES, usedPieces: pieces.filter(piece => piece.inOrder).length,
    queued: orders.flatMap(order => order.type === 'MOVE' && order.legs !== undefined ? [{ orderId: order.id, pieces: orderUnitIds(order).length, legs: order.legs.length }] : []), pieces,
  };
}

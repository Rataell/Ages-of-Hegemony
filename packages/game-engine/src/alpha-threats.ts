import {
  AlphaEraSchema, ENCOUNTER_CARDS, WORLD_ID, eraForRound, threatComposition, threatPieceIds,
  type AlphaState, type AlphaUnit, type HexId, type HexTile, type PlayerId, type RepercussionOp, type Threat, type ThreatKind, type ThreatLevel,
} from '@aoh/game-domain';
import { alphaEvent, resolutionEvent } from './alpha-events.js';
import { alphaGain, alphaLose } from './alpha-resources.js';
import { hexDistance, hexId, hexNeighbors } from './hex.js';
import { isPort, settleCargo } from './alpha-naval.js';
import { visibleHexIds } from './alpha-world.js';
import { strengthSources } from './alpha-institutions.js';
import { unitGrade } from './alpha-grades.js';
import { isSignature } from './alpha-kits.js';
import { addPendingChoice } from './alpha-resonance.js';
import { casualtyCount, chooseLosses, resolveShock, type Fort, type Modifier, type ShockPiece } from './alpha-shock.js';

/**
 * World threats (canon §21b, design I-5, I-20 … I-24): Acampamentos that grow, march as Bandos, pillage and die; pirate
 * Ancoradouros with their own cap. A threat is not an `AlphaUnit`: its pieces are descriptors for the shock core, so the
 * world fights with exactly the engine players use.
 */
const CIVILIANS = new Set<AlphaUnit['kind']>(['EXPLORER', 'PIONEER', 'ENVOY']);
const IMPASSABLE_LAND = new Set(['SEA', 'UNKNOWN']);
const tileMap = (state: AlphaState) => new Map(state.core.map.map(tile => [tile.id as string, tile]));
export const eraIndexOf = (state: AlphaState): number => AlphaEraSchema.options.indexOf(eraForRound(state.core.round, state.rules.roundsPerEra));
export const threatCap = (state: AlphaState, kind: ThreatKind): number => kind === 'CAMP' ? state.players.length + 2 : Math.ceil(state.players.length / 2) + 1;
export const threatAt = (state: AlphaState, hex: string): Threat | undefined => state.threats.find(threat => threat.hexId === hex);
export const threatName = (threat: Pick<Threat, 'kind' | 'status'>): string => threat.kind === 'PIRATE' ? (threat.status === 'CAMPED' ? 'Ancoradouro pirata' : 'Piratas') : (threat.status === 'CAMPED' ? 'Acampamento' : 'Bando');
const byId = <T extends { id: string }>(a: T, b: T) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const levelOf = (value: number): ThreatLevel => (Math.max(1, Math.min(3, value)) as ThreatLevel);
const allCities = (state: AlphaState) => state.core.players.flatMap(player => player.civilization.cities);

/** Hexes any player piece or city occupies. */
function playerSites(state: AlphaState): string[] {
  return [...state.units.filter(unit => !unit.carrierId).map(unit => unit.hexId as string), ...allCities(state).map(city => city.hexId as string)];
}
const nearestPlayer = (state: AlphaState, tile: HexTile, sites = playerSites(state), map = tileMap(state)): number =>
  sites.reduce((best, id) => { const other = map.get(id); return other ? Math.min(best, hexDistance(tile, other)) : best; }, 99);

/** Players who see `hex` now, plus anyone in `always`. */
export function threatViewers(state: AlphaState, hex: string, always: readonly PlayerId[] = []): PlayerId[] {
  return state.players.map(player => player.playerId).filter(id => always.includes(id) || visibleHexIds(state, id).has(hex));
}

function describe(threat: Pick<Threat, 'composition'>, state: AlphaState): string {
  return threat.composition.map(entry => `${state.rules.units[entry.kind].name}${entry.count > 1 ? ` ×${entry.count}` : ''}`).join(', ');
}

/** Candidate hexes for a new threat (design: Spawn eligibility). `within` restricts to a region. */
function sitesFor(state: AlphaState, kind: ThreatKind, within?: readonly string[]): HexTile[] {
  const map = tileMap(state), cities = allCities(state), occupied = new Set([...state.units.map(unit => unit.hexId as string), ...state.threats.map(threat => threat.hexId as string), ...state.independents.map(people => people.hexId as string)]);
  const seen = new Set<string>(); for (const player of state.players) for (const id of visibleHexIds(state, player.playerId)) seen.add(id);
  const cityTiles = cities.map(city => map.get(city.hexId)).filter((tile): tile is HexTile => tile !== undefined);
  const scope = within ? within.map(id => map.get(id)).filter((tile): tile is HexTile => tile !== undefined) : state.core.map;
  if (kind === 'CAMP') {
    const land = scope.filter(tile => !IMPASSABLE_LAND.has(tile.terrain) && tile.terrain !== 'MOUNTAINS' && tile.ownerId === null && !occupied.has(tile.id) && !seen.has(tile.id) && !cities.some(city => city.hexId === tile.id));
    const dist = (tile: HexTile) => cityTiles.reduce((best, city) => Math.min(best, hexDistance(city, tile)), 99);
    for (const [low, high] of [[3, 5], [3, 8], [3, 99]] as const) { const found = land.filter(tile => dist(tile) >= low && dist(tile) <= high); if (found.length) return found; }
    return [];
  }
  const ports = cities.filter(city => isPort(state, city.hexId)).map(city => map.get(city.hexId)).filter((tile): tile is HexTile => tile !== undefined);
  if (ports.length === 0) return [];
  const routeHexes = new Set(state.routes.flatMap(route => route.path as string[]));
  const sea = scope.filter(tile => tile.terrain === 'SEA' && !occupied.has(tile.id) && !seen.has(tile.id));
  const near = sea.filter(tile => { const d = ports.reduce((best, port) => Math.min(best, hexDistance(port, tile)), 99); return (d >= 2 && d <= 5) || routeHexes.has(tile.id); });
  return near.length ? near : sea.filter(tile => ports.some(port => hexDistance(port, tile) <= 8));
}

function newThreat(state: AlphaState, kind: ThreatKind, tile: HexTile): Threat {
  const threat: Threat = {
    id: `${kind === 'CAMP' ? 'camp' : 'pirate'}-r${state.core.round}-e${state.events.length}-n${state.threats.length + 1}`, kind, hexId: tile.id, homeHexId: tile.id, level: 1, status: 'CAMPED',
    composition: threatComposition(kind, 1, eraIndexOf(state)), createdRound: state.core.round, lastActedRound: state.core.round, rewardPaid: false, fresh: true,
  };
  state.threats.push(threat); state.telemetry.threatsSpawned++;
  return threat;
}

/** Spawns one threat at the eligible hex farthest from every player piece (ties by hex id). Null when nothing is eligible. */
export function spawnThreat(state: AlphaState, kind: ThreatKind, within?: readonly string[]): Threat | null {
  const map = tileMap(state), sites = playerSites(state);
  const ranked = sitesFor(state, kind, within).map(tile => ({ tile, score: nearestPlayer(state, tile, sites, map) })).sort((a, b) => b.score - a.score || (a.tile.id < b.tile.id ? -1 : 1));
  const best = ranked[0];
  return best ? newThreat(state, kind, best.tile) : null;
}

/** +1 Ameaça on the eligible threat farthest from player pieces. Returns it, or null when none can grow. */
export function reinforceThreat(state: AlphaState, kind: ThreatKind): Threat | null {
  const map = tileMap(state), sites = playerSites(state);
  const pool = state.threats.filter(threat => threat.kind === kind && threat.level < 3)
    .map(threat => ({ threat, score: nearestPlayer(state, map.get(threat.hexId)!, sites, map) })).sort((a, b) => b.score - a.score || byId(a.threat, b.threat));
  const chosen = pool[0]?.threat;
  if (!chosen) return null;
  chosen.level = levelOf(chosen.level + 1);
  chosen.composition = threatComposition(chosen.kind, chosen.level, eraIndexOf(state));
  return chosen;
}

/**
 * Event command (canon §21b): SPAWN a new threat (over the cap it REINFORCES an eligible one instead), REINFORCE, or ACTIVATE.
 * Public events never carry a position; only the Ameaça numeral changes hands.
 */
export function applyThreatCommand(state: AlphaState, source: PlayerId | null, op: Extract<RepercussionOp, { op: 'THREAT' }>, within?: readonly string[]): void {
  const kind: ThreatKind = op.kind === 'PIRATE' ? 'PIRATE' : 'CAMP';
  const label = kind === 'PIRATE' ? 'pirata' : 'de fronteira';
  if (op.command === 'ACTIVATE') { activateThreats(state, { launch: true }); return; }
  if (op.command === 'SPAWN') {
    const count = state.threats.filter(threat => threat.kind === kind).length;
    const created = count < threatCap(state, kind) ? spawnThreat(state, kind, within) : null;
    if (created) { alphaEvent(state, 'THREAT_SPAWNED', `Uma ameaça ${label} surgiu além das fronteiras conhecidas.`, null); return; }
  }
  const grown = reinforceThreat(state, kind);
  alphaEvent(state, grown ? 'THREAT_REINFORCED' : 'THREAT_NONE', grown ? `Uma ameaça ${label} se reforçou além das fronteiras conhecidas.` : `Nenhuma ameaça ${label} pôde surgir ou se reforçar.`, null);
  void source;
}

/** Era turn growth: every camped threat with no player piece or city within 2 hexes gains an Ameaça level (up to III). */
export function growThreats(state: AlphaState): number {
  const map = tileMap(state), sites = playerSites(state); let grown = 0;
  for (const threat of [...state.threats].sort(byId)) {
    if (threat.status !== 'CAMPED' || threat.level >= 3 || nearestPlayer(state, map.get(threat.hexId)!, sites, map) <= 2) continue;
    threat.level = levelOf(threat.level + 1); threat.composition = threatComposition(threat.kind, threat.level, eraIndexOf(state)); grown++;
  }
  if (grown) alphaEvent(state, 'THREATS_GREW', `${grown === 1 ? 'Uma ameaça cresceu' : `${grown} ameaças cresceram`} nas fronteiras do mundo.`, null);
  return grown;
}

/** D-1: a fresh camp becomes ACTIVE once a Planning round that began after its creation has completed. */
export function matureThreats(state: AlphaState): void {
  for (const threat of state.threats) if (threat.fresh && threat.createdRound < state.core.round) threat.fresh = false;
}

// ---- targeting and movement -------------------------------------------------

const passable = (tile: HexTile | undefined, kind: ThreatKind): boolean => !!tile && (kind === 'PIRATE' ? tile.terrain === 'SEA' : !IMPASSABLE_LAND.has(tile.terrain));
/** BFS over passable hexes; `goal` may be impassable (a city or a port-adjacent hex). Returns the path (excluding the start), or null. */
function pathTo(state: AlphaState, threat: Threat, goals: ReadonlySet<string>, map = tileMap(state)): string[] | null {
  const start = map.get(threat.hexId)!, prev = new Map<string, string | null>([[start.id, null]]), queue = [start.id];
  const blocked = new Set(state.threats.filter(other => other.id !== threat.id).map(other => other.hexId as string));
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]!;
    if (goals.has(current) && current !== start.id) { const path: string[] = []; for (let at: string | null | undefined = current; at && at !== start.id; at = prev.get(at)) path.unshift(at); return path; }
    const tile = map.get(current)!;
    for (const next of hexNeighbors(tile).map(hexId).sort()) {
      const target = map.get(next);
      if (prev.has(next) || !target) continue;
      if (!(passable(target, threat.kind) && !blocked.has(next)) && !goals.has(next)) continue;
      prev.set(next, current); queue.push(next);
    }
  }
  return null;
}
const guardsAt = (state: AlphaState, hex: string) => state.units.filter(unit => unit.hexId === hex && unit.kind === 'GUARD').length;
function cityDefense(state: AlphaState, hex: string): number {
  const city = allCities(state).find(candidate => candidate.hexId === hex), meta = city && state.cities.find(candidate => candidate.cityId === city.id);
  return guardsAt(state, hex) + (meta ? state.rules.combat.fortification.levelBonus[meta.fortification.level] : 0);
}
function cityValue(state: AlphaState, hex: string): number {
  const city = allCities(state).find(candidate => candidate.hexId === hex), meta = city && state.cities.find(candidate => candidate.cityId === city.id);
  return meta ? ['OUTPOST', 'HAMLET', 'VILLAGE', 'CITY', 'GREAT_CITY', 'METROPOLIS', 'IMPERIAL_METROPOLIS'].indexOf(meta.level) + 1 + meta.districts.length : 0;
}

/** Land target (canon §21b): reachable by land, nearest city, lowest defence, highest value, then id. */
export function landTarget(state: AlphaState, threat: Threat): { hex: string; path: string[] } | null {
  const map = tileMap(state), options = allCities(state).map(city => ({ hex: city.hexId as string, path: pathTo(state, threat, new Set([city.hexId]), map) })).filter((option): option is { hex: string; path: string[] } => option.path !== null);
  options.sort((a, b) => a.path.length - b.path.length || cityDefense(state, a.hex) - cityDefense(state, b.hex) || cityValue(state, b.hex) - cityValue(state, a.hex) || (a.hex < b.hex ? -1 : 1));
  return options[0] ?? null;
}

/** Pirate target: the richest maritime route (longest sea path, then nearest), else the nearest port with the fewest Frotas. */
export function seaTarget(state: AlphaState, threat: Threat): { hex: string; path: string[]; kind: 'ROUTE' | 'PORT' } | null {
  const map = tileMap(state), from = map.get(threat.hexId)!;
  const routes = state.routes.map(route => ({ route, sea: (route.path as string[]).filter(id => map.get(id)?.terrain === 'SEA') })).filter(item => item.sea.length > 0)
    .sort((a, b) => b.sea.length - a.sea.length || byId(a.route, b.route));
  for (const { sea } of routes) {
    const nearest = [...sea].sort((a, b) => hexDistance(from, map.get(a)!) - hexDistance(from, map.get(b)!) || (a < b ? -1 : 1))[0]!;
    if (nearest === threat.hexId) return { hex: nearest, path: [], kind: 'ROUTE' };
    const path = pathTo(state, threat, new Set([nearest]), map);
    if (path) return { hex: nearest, path, kind: 'ROUTE' };
  }
  const ports = allCities(state).filter(city => isPort(state, city.hexId)).map(city => ({ city, fleets: state.units.filter(unit => unit.ownerId === city.ownerId && unit.kind === 'FLEET' && hexDistance(map.get(unit.hexId)!, map.get(city.hexId)!) <= 1).length }));
  const options = ports.flatMap(({ city, fleets }) => {
    const sea = hexNeighbors(map.get(city.hexId)!).map(hexId).filter(id => map.get(id)?.terrain === 'SEA').sort();
    const reached = sea.flatMap(id => { const path = id === threat.hexId ? [] : pathTo(state, threat, new Set([id]), map); return path ? [{ id: id as string, path }] : []; }).sort((a, b) => a.path.length - b.path.length || (a.id < b.id ? -1 : 1))[0];
    return reached ? [{ hex: reached.id, path: reached.path, fleets, city }] : [];
  }).sort((a, b) => a.path.length - b.path.length || a.fleets - b.fleets || (a.city.id < b.city.id ? -1 : 1));
  const best = options[0];
  return best ? { hex: best.hex, path: best.path, kind: 'PORT' } : null;
}

const speedOf = (threat: Threat): number => threat.kind === 'CAMP' && threat.level >= 2 && threat.composition.some(entry => entry.kind === 'CAVALRY') ? 2 : 1;

/**
 * Moves threats. `launch: true` (event command ACTIVATE, Era turn) turns CAMPED threats with a target into MARCHING Bandos (I-20);
 * without it only the already MARCHING threats move (every odd round). A threat acts once per round.
 */
export function activateThreats(state: AlphaState, options: { launch: boolean }): void {
  for (const id of state.threats.map(threat => threat.id).sort()) {
    const threat = state.threats.find(candidate => candidate.id === id);
    if (!threat) continue;
    if (threat.status === 'CAMPED') { if (!options.launch || threat.fresh) continue; } else if (threat.lastActedRound >= state.core.round) continue;
    actThreat(state, threat);
  }
}

function actThreat(state: AlphaState, threat: Threat): void {
  const target = threat.kind === 'PIRATE' ? seaTarget(state, threat) : landTarget(state, threat);
  if (!target) return;
  threat.lastActedRound = state.core.round;
  if (threat.status === 'CAMPED') { threat.status = 'MARCHING'; alphaEvent(state, 'THREAT_MARCHING', `${threat.kind === 'PIRATE' ? 'Piratas partiram' : 'Um bando partiu'} de seu ${threat.kind === 'PIRATE' ? 'ancoradouro' : 'acampamento'}.`, null); }
  const map = tileMap(state);
  for (let step = 0, remaining = [...target.path]; step < speedOf(threat) && remaining.length > 0 && state.threats.includes(threat); step++) {
    const next = remaining.shift()!, tile = map.get(next)!;
    const occupants = state.units.filter(unit => unit.hexId === next && !unit.carrierId);
    const city = allCities(state).find(candidate => candidate.hexId === next);
    if (city || occupants.length) {
      const fighters = occupants.filter(unit => !CIVILIANS.has(unit.kind) && state.rules.units[unit.kind].strength > 0);
      if (!city && fighters.length === 0 && threat.kind === 'CAMP') { killExposed(state, threat, occupants, next); moveThreat(state, threat, tile); continue; }
      if (threat.kind === 'PIRATE' && !fighters.length && !city) { moveThreat(state, threat, tile); continue; }
      assault(state, threat, next); break;
    }
    moveThreat(state, threat, tile);
  }
  if (threat.kind === 'PIRATE' && state.threats.includes(threat)) pillagePort(state, threat);
  suspendThreatenedRoutes(state);
}

function moveThreat(state: AlphaState, threat: Threat, tile: HexTile): void {
  threat.hexId = tile.id;
  if (threat.kind === 'CAMP' && tile.improvement && tile.ownerId) {
    const owner = tile.ownerId; tile.improvement = null;
    alphaEvent(state, 'THREAT_PILLAGE', `Um bando pilhou uma melhoria em ${tile.id}.`, [owner]);
  }
  for (const route of state.routes) if ((route.path as string[]).includes(tile.id)) route.suspended = true;
}

function killExposed(state: AlphaState, threat: Threat, victims: readonly AlphaUnit[], hex: string): void {
  const owners = [...new Set(victims.map(unit => unit.ownerId))];
  state.units = state.units.filter(unit => !victims.some(victim => victim.id === unit.id));
  alphaEvent(state, 'THREAT_AMBUSH', `Um bando surpreendeu peças desprotegidas em ${hex}.`, threatViewers(state, hex, owners));
  resolutionEvent(state, { type: 'LOSSES', actorId: null, visibleTo: threatViewers(state, hex, owners), message: `${threatName(threat)} eliminou peças desprotegidas em ${hex}.`, hexId: hex as HexId, unitIds: victims.map(unit => unit.id) });
}

/** Piratas: from a hex next to a port they pillage 2 Riqueza from its owner, once per activation (I-24). */
function pillagePort(state: AlphaState, threat: Threat): void {
  const map = tileMap(state), here = map.get(threat.hexId)!, near = new Set(hexNeighbors(here).map(hexId));
  const city = allCities(state).filter(candidate => near.has(candidate.hexId) && isPort(state, candidate.hexId)).sort((a, b) => (a.id < b.id ? -1 : 1))[0];
  if (!city) return;
  const owner = state.players.find(player => player.playerId === city.ownerId);
  if (!owner) return;
  const loss = Math.min(2, owner.resources.wealth);
  if (loss > 0) alphaLose(state, city.ownerId, { wealth: loss });
  alphaEvent(state, 'THREAT_PILLAGE', `Piratas pilharam o porto de ${city.name}${loss ? ` (−${loss} Riqueza)` : ''}.`, [city.ownerId]);
}

/** Routes whose path crosses a threat stay suspended; the maintenance re-evaluates every route first, so they resume when the sea or road clears. */
export function suspendThreatenedRoutes(state: AlphaState): void {
  const occupied = new Set(state.threats.map(threat => threat.hexId as string));
  for (const route of state.routes) if (!route.suspended && (route.path as string[]).some(id => occupied.has(id))) route.suspended = true;
}
/** A hex a Bando stands on is not worked: Produzir skips it (I-23). */
export const hexBlockedByThreat = (state: AlphaState, hex: string): boolean => state.threats.some(threat => threat.hexId === hex && threat.status === 'MARCHING');

// ---- shock plumbing ---------------------------------------------------------

export const threatPieces = (threat: Threat): ShockPiece[] => threatPieceIds(threat).map(piece => ({ id: piece.id, kind: piece.kind, grade: 1 }));
export function unitPieces(state: AlphaState, units: readonly AlphaUnit[]): ShockPiece[] {
  return units.map(unit => ({ id: unit.id, kind: unit.kind, grade: unitGrade(state, unit.ownerId, unit.kind), signature: isSignature(state, unit) }));
}
/** Removes pieces of the composition by id (`<threat>:<KIND>:<n>`). Returns true when the threat is gone. */
export function removeThreatPieces(state: AlphaState, threat: Threat, lost: readonly string[]): boolean {
  const remaining = new Map<string, number>();
  for (const piece of threatPieceIds(threat)) if (!lost.includes(piece.id)) remaining.set(piece.kind, (remaining.get(piece.kind) ?? 0) + 1);
  threat.composition = [...remaining].map(([kind, count]) => ({ kind: kind as AlphaUnit['kind'], count }));
  if (threat.composition.length === 0) { state.threats = state.threats.filter(candidate => candidate.id !== threat.id); return true; }
  return false;
}
export function landform(state: AlphaState, terrain: string): number {
  const config = state.rules.combat;
  return terrain === 'HILLS' ? config.hillDefense : terrain === 'MOUNTAINS' ? config.mountainDefense : 0;
}

/** Pays the destroyer once, only when a camp dies still CAMPED (no farming of Bandos in the field, I-22). */
export function payThreatReward(state: AlphaState, actor: PlayerId, threat: Threat): void {
  if (threat.status !== 'CAMPED' || threat.rewardPaid) return;
  threat.rewardPaid = true; state.telemetry.threatKills++;
  const player = state.players.find(candidate => candidate.playerId === actor)!;
  if (threat.kind === 'PIRATE') { alphaGain(state, actor, { wealth: 3 }); player.prestige += 1; }
  else {
    alphaGain(state, actor, { wealth: threat.level + 1 }); player.prestige += threat.level - 1;
    if (threat.level === 3) { const card = ENCOUNTER_CARDS.find(item => item.id === 'enc-camp-spoils')!; addPendingChoice(state, actor, { source: 'ENCOUNTER', cardId: card.id, title: card.title, text: card.text, mitigated: false, options: card.options }); }
  }
  alphaEvent(state, 'THREAT_DESTROYED', `${threatName(threat)} destruído${threat.kind === 'PIRATE' ? ': +3 Riqueza e +1 Prestígio' : `: +${threat.level + 1} Riqueza${threat.level > 1 ? ` e +${threat.level - 1} Prestígio` : ''}`}.`, [actor]);
}

/** A threat attacks the player's pieces or city on `hex` with the shock core (always Assalto). */
function assault(state: AlphaState, threat: Threat, hex: string): void {
  const map = tileMap(state), tile = map.get(hex)!;
  const city = allCities(state).find(candidate => candidate.hexId === hex), meta = city && state.cities.find(candidate => candidate.cityId === city.id);
  const defenderUnits = state.units.filter(unit => unit.hexId === hex && !unit.carrierId);
  const defenderId = defenderUnits[0]?.ownerId ?? city!.ownerId;
  const mine = defenderUnits.filter(unit => unit.ownerId === defenderId);
  const fighters = mine.filter(unit => state.rules.units[unit.kind].strength > 0);
  const defender = state.players.find(player => player.playerId === defenderId)!;
  const sources = strengthSources(state, defenderId);
  const flat: Modifier[] = [];
  const add = (source: string, amount: number) => { if (amount !== 0) flat.push({ source, amount }); };
  add('Terreno', landform(state, tile.terrain)); add('Tecnologia', sources.technology); add('Líder', sources.leader); add('Cartas e efeitos', sources.other);
  const before: Fort | null = meta ? { ...meta.fortification } : null;
  const attackerPieces = threatPieces(threat);
  const shock = resolveShock(state, {
    attacker: { pieces: attackerPieces, posture: 'ASSAULT', flat: [] }, defender: { pieces: unitPieces(state, fighters), posture: defender.defensePosture, flat },
    terrain: tile.terrain, city: city !== undefined, fortification: before,
  });
  const { delta, outcome } = shock;
  const losses: string[] = [];
  const threatLosses: string[] = [];
  if (outcome === 'TIE') {
    if (attackerPieces.length >= 2) threatLosses.push(...chooseLosses(state, attackerPieces, 1));
    if (fighters.length >= 2) losses.push(...chooseLosses(state, fighters, 1));
  } else if (delta > 0) losses.push(...chooseLosses(state, fighters.length ? fighters : mine, casualtyCount(outcome)));
  else threatLosses.push(...chooseLosses(state, attackerPieces, casualtyCount(outcome)));
  let fortification: AlphaState['battles'][number]['fortification'] = null;
  if (meta && city && before && shock.fortificationAfter) {
    if (shock.fortificationAfter.state !== before.state) meta.fortification = { ...shock.fortificationAfter };
    fortification = { cityId: city.id, before, after: shock.fortificationAfter };
  }
  if (delta > 0 && outcome !== 'TIE' && meta) meta.mood = Math.max(0, meta.mood - 1);
  state.units = state.units.filter(unit => !losses.includes(unit.id));
  const attackerIds = attackerPieces.map(piece => piece.id);
  const gone = removeThreatPieces(state, threat, threatLosses);
  if (gone) state.telemetry.threatLosses++;
  if (delta > 0 && outcome !== 'TIE' && !city && !state.units.some(unit => unit.hexId === hex)) moveThreat(state, threat, tile);
  state.telemetry.threatAttacks++;
  state.battles.push({
    id: `battle-${state.battles.length + 1}`, round: state.core.round, hexId: hex as HexId, attackerId: WORLD_ID, defenderId,
    attackerUnits: attackerIds, defenderUnits: mine.map(unit => unit.id), attackerPosture: 'ASSAULT', defenderPosture: defender.defensePosture,
    attackBreakdown: shock.attackBreakdown, defenseBreakdown: shock.defenseBreakdown, attackerTactical: shock.attackerRolls, defenderTactical: shock.defenderRolls, fortification,
    attackStrength: shock.attackStrength, defenseStrength: shock.defenseStrength, attackModifiers: shock.attackModifiers, defenseModifiers: shock.defenseModifiers, attackTotal: shock.attackTotal, defenseTotal: shock.defenseTotal,
    delta, outcome, winnerId: outcome !== 'TIE' && delta > 0 ? WORLD_ID : defenderId, losses: [...losses, ...threatLosses], retreat: null,
  });
  settleCargo(state);
  const names = state.core.players.find(player => player.id === defenderId)?.name ?? 'Uma civilização';
  const reading = outcome === 'TIE' ? 'e a batalha terminou em empate tático' : delta > 0 ? (outcome === 'DECISIVE' ? 'e venceu de forma decisiva' : 'e venceu') : (outcome === 'DECISIVE' ? 'e foi repelido de forma decisiva' : 'e foi repelido');
  const message = `${threatName(threat)} (${describe(threat, state) || 'dizimado'}) atacou ${names} em ${hex} ${reading} (Ataque ${shock.attackTotal} × Defesa ${shock.defenseTotal}, Δ ${delta > 0 ? '+' : ''}${delta}).`;
  const viewers = threatViewers(state, hex, [defenderId]);
  alphaEvent(state, 'THREAT_ASSAULT', message, viewers);
  resolutionEvent(state, { type: 'COMBAT', actorId: null, visibleTo: viewers, message, hexId: hex as HexId, unitIds: [...losses] });
}

/** Warning drums: a threat within 3 hexes of an own city is heard even beyond the vision ring, but only as a distance (never a position). */
export function threatAlerts(state: AlphaState, actor: PlayerId): { cityId: string; distance: number; kind: ThreatKind }[] {
  const map = tileMap(state), owner = state.core.players.find(player => player.id === actor);
  if (!owner) return [];
  return owner.civilization.cities.flatMap(city => {
    const from = map.get(city.hexId)!;
    const near = state.threats.filter(threat => threat.status === 'MARCHING').map(threat => ({ threat, d: hexDistance(from, map.get(threat.hexId)!) })).filter(item => item.d <= 3).sort((a, b) => a.d - b.d || byId(a.threat, b.threat))[0];
    return near ? [{ cityId: city.id as string, distance: near.d, kind: near.threat.kind }] : [];
  });
}

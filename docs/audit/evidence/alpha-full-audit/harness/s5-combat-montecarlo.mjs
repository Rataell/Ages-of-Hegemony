// Combat audit, in process (compiled engine): preview vs resolution over many random setups, arithmetic, ties, losses, retreat, stack limits, determinism.
import { PlayerIdSchema, alphaRules } from '@aoh/game-domain';
import { beginAlphaPlanning, combatPreview, createGame, migrateSnapshotV3ToV4, resolveBattle, stackLimit, stackUsed } from '@aoh/game-engine';
import { writeFileSync } from 'node:fs';

const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
const mul = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const KINDS = ['INFANTRY', 'GUARD', 'RANGED', 'CAVALRY', 'SIEGE'];
const TERR = ['PLAINS', 'FOREST', 'HILLS', 'MOUNTAINS', 'COAST'];
const LEVELS = ['NONE', 'PALISADE', 'STONE_WALL', 'FORTRESS', 'BASTION', 'CITADEL'];
const STATES = ['INTACT', 'DAMAGED', 'BREACHED'];

function arena(seed, rnd) {
  const core = createGame({ gameId: `mc-${seed}`, seed, players: [{ id: p1, name: 'Um', resources: { food: 30, materials: 30, wealth: 30, knowledge: 0, influence: 10 } }, { id: p2, name: 'Dois' }],
    map: Array.from({ length: 10 }, (_, q) => ({ id: `${q},0`, q, r: 0, terrain: 'PLAINS' })),
    initialCities: [{ id: 'c1', ownerId: p1, hexId: '0,0', name: 'Aurora' }, { id: 'c2', ownerId: p2, hexId: '7,0', name: 'Fronteira' }] });
  if (!core.ok) throw new Error(core.error.message);
  const migrated = migrateSnapshotV3ToV4(core.value); if (!migrated.ok) throw new Error(migrated.error.message);
  const state = beginAlphaPlanning(migrated.value);
  state.players.forEach(p => { p.knownHexIds = state.core.map.map(t => t.id); });
  state.players[0].temporaryEffects = [{ source: 'audit-march', effect: { kind: 'MOVEMENT', amount: 5 }, round: state.core.round }];
  state.wars = [[p1, p2]];
  const city = rnd() < 0.45, far = !city && rnd() < 0.3;
  const target = city ? '7,0' : far ? '6,0' : '4,0', from = city ? '6,0' : far ? '5,0' : '3,0';
  if (!city) state.core.map.find(t => t.id === target).terrain = TERR[Math.floor(rnd() * TERR.length)];
  const nA = 1 + Math.floor(rnd() * 8), nD = Math.floor(rnd() * 8) + (city ? 0 : 1);
  state.units = [];
  let id = 0;
  for (let i = 0; i < nA; i++) state.units.push({ id: `a${String(++id).padStart(3, '0')}`, ownerId: p1, kind: KINDS[Math.floor(rnd() * KINDS.length)], hexId: from, recruitedRound: 1 });
  for (let i = 0; i < nD; i++) state.units.push({ id: `d${String(++id).padStart(3, '0')}`, ownerId: p2, kind: KINDS[Math.floor(rnd() * KINDS.length)], hexId: target, recruitedRound: 1 });
  if (city) { state.core.map.filter(t => ['1,0', '2,0', '3,0', '4,0', '5,0', '6,0'].includes(t.id)).forEach(t => { t.ownerId = p1; }); state.cities.find(c => c.cityId === 'c2').fortification = { level: LEVELS[Math.floor(rnd() * LEVELS.length)], state: STATES[Math.floor(rnd() * 3)] }; }
  if (rnd() < 0.3) { const owned = ['adv-2-4-1', 'adv-4-4-1']; state.players[0].research = owned.slice(0, 1 + Math.floor(rnd() * 2)); }
  state.players[1].defensePosture = ['HOLD', 'ASSAULT', 'MANEUVER'][Math.floor(rnd() * 3)];
  const order = { id: 'atk', type: 'ATTACK', unitIds: state.units.filter(u => u.ownerId === p1).map(u => u.id), target, posture: ['ASSAULT', 'HOLD', 'MANEUVER'][Math.floor(rnd() * 3)] };
  return { state, order, city, nA, nD };
}
const bag = list => { const m = new Map(); for (const x of list) m.set(x.source, (m.get(x.source) ?? 0) + x.amount); return m; };

const N = Number(process.argv[2] ?? 1500);
const stats = { runs: 0, resolved: 0, blockedPreview: 0, attackerWins: 0, defenderWins: 0, ties: 0, cityBattles: 0, retreats: 0, retreatLost: 0, partialAdvance: 0 };
const problems = [];
const note = (kind, seed, detail) => { if (problems.length < 60) problems.push({ kind, seed, detail }); };
for (let seed = 1; seed <= N; seed++) {
  stats.runs++;
  const rnd = mul(seed * 7919);
  let { state, order, city } = arena(seed, rnd);
  const preview = combatPreview(state, p1, order);
  const before = JSON.stringify(state);
  const again = combatPreview(state, p1, order);
  if (JSON.stringify(state) !== before) note('PREVIEW_MUTATES_STATE', seed, '');
  if (JSON.stringify(again) !== JSON.stringify(preview)) note('PREVIEW_NOT_DETERMINISTIC', seed, '');
  if (!preview.ok) { stats.blockedPreview++; let threw = false; try { resolveBattle(structuredClone(state), p1, order); } catch { threw = true; } if (!threw) note('PREVIEW_BLOCKED_BUT_RESOLVES', seed, preview.blocked); continue; }
  const counter = state.privateRng.counter;
  const twin = structuredClone(state);
  try { resolveBattle(state, p1, order); } catch (error) { note('RESOLVE_THROWS_AFTER_OK_PREVIEW', seed, String(error.message)); continue; }
  stats.resolved++; if (city) stats.cityBattles++;
  const battle = state.battles.at(-1);
  // determinism: same state, same result
  resolveBattle(twin, p1, order);
  if (JSON.stringify(twin.battles.at(-1)) !== JSON.stringify(battle) || JSON.stringify(twin.units) !== JSON.stringify(state.units)) note('NOT_DETERMINISTIC', seed, '');
  // preview static contribution must be part of the resolution
  if (preview.attacker.strength !== battle.attackStrength) note('PREVIEW_ATTACK_STRENGTH_DIFFERS', seed, `${preview.attacker.strength} vs ${battle.attackStrength}`);
  const bAtk = bag(battle.attackBreakdown), bDef = bag(battle.defenseBreakdown);
  for (const [source, amount] of bag(preview.attacker.breakdown)) if (bAtk.get(source) !== amount) note('PREVIEW_ATTACK_MODIFIER_DIFFERS', seed, `${source}: preview ${amount} battle ${bAtk.get(source)}`);
  if (preview.defender?.visible) {
    if (preview.defender.strength !== battle.defenseStrength) note('PREVIEW_DEFENSE_STRENGTH_DIFFERS', seed, `${preview.defender.strength} vs ${battle.defenseStrength}`);
    for (const [source, amount] of bag(preview.defender.breakdown)) if (bDef.get(source) !== amount) note('PREVIEW_DEFENSE_MODIFIER_DIFFERS', seed, `${source}: preview ${amount} battle ${bDef.get(source)}`);
  }
  // arithmetic and winner
  const sum = list => list.reduce((n, m) => n + m.amount, 0);
  if (battle.attackModifiers !== sum(battle.attackBreakdown) || battle.defenseModifiers !== sum(battle.defenseBreakdown)) note('BREAKDOWN_SUM', seed, '');
  if (battle.attackTotal !== battle.attackStrength + battle.attackModifiers || battle.defenseTotal !== battle.defenseStrength + battle.defenseModifiers) note('TOTAL_ARITHMETIC', seed, '');
  const attackerWon = battle.attackTotal > battle.defenseTotal;
  if (battle.winnerId !== (attackerWon ? p1 : p2)) note('WINNER_RULE', seed, '');
  if (battle.attackTotal === battle.defenseTotal) { stats.ties++; if (battle.winnerId !== p2) note('TIE_NOT_TO_DEFENDER', seed, ''); }
  attackerWon ? stats.attackerWins++ : stats.defenderWins++;
  // one die per fighting unit, none for civilians
  const fighting = ids => ids.filter(uid => alphaRules().units[[...state.units, ...twin.units].find(u => u.id === uid)?.kind ?? 'INFANTRY'].strength > 0).length;
  if (battle.attackerTactical.length !== fighting(battle.attackerUnits)) note('DICE_PER_UNIT_ATTACK', seed, `${battle.attackerTactical.length}`);
  // losses
  const casualtiesMax = 3;
  const lostFromLoser = battle.losses.filter(id => (attackerWon ? battle.defenderUnits : battle.attackerUnits).includes(id));
  if (lostFromLoser.length !== battle.losses.length) note('LOSSES_FROM_WINNER', seed, JSON.stringify(battle.losses));
  const directCasualties = Math.min(casualtiesMax, (attackerWon ? battle.defenderUnits : battle.attackerUnits).length);
  if (battle.losses.length < 1 && (attackerWon ? battle.defenderUnits.length : battle.attackerUnits.length) > 0) note('NO_LOSSES_FOR_LOSER', seed, '');
  if (battle.losses.some(id => state.units.some(u => u.id === id))) note('LOSS_STILL_ON_BOARD', seed, '');
  // retreat and stack limits
  if (battle.retreat) { stats.retreats++; const surv = state.units.filter(u => u.ownerId === (attackerWon ? p2 : p1) && (attackerWon ? battle.defenderUnits : battle.attackerUnits).includes(u.id)); if (surv.some(u => u.hexId !== battle.retreat)) note('RETREAT_NOT_APPLIED', seed, battle.retreat); }
  else if (attackerWon) { stats.retreatLost++; const surv = state.units.filter(u => battle.defenderUnits.includes(u.id)); if (surv.length) note('DEFENDER_SURVIVES_WITHOUT_RETREAT', seed, ''); }
  for (const owner of [p1, p2]) for (const hex of new Set(state.units.filter(u => u.ownerId === owner).map(u => u.hexId))) for (const category of ['military', 'civilians', 'fleets']) {
    const used = stackUsed(state, owner, hex, category), limit = stackLimit(state, owner, hex, category);
    const initial = twin.units.filter(u => u.ownerId === owner && u.hexId === hex).length;
    if (used > limit && used > (before.includes('') ? 0 : 0) && !(initial >= used)) { const start = JSON.parse(before).units.filter(u => u.ownerId === owner && u.hexId === hex).length; if (start < used) note('STACK_LIMIT_EXCEEDED_BY_BATTLE', seed, `${owner}@${hex} ${category} ${used}/${limit}`); }
  }
  if (attackerWon) { const total = order.unitIds.length, moved = state.units.filter(u => order.unitIds.includes(u.id) && u.hexId === order.target).length, stayed = state.units.filter(u => order.unitIds.includes(u.id) && u.hexId !== order.target).length; if (stayed) stats.partialAdvance++; if (preview.advance.stays !== stayed && !battle.losses.some(id => order.unitIds.includes(id))) note('PREVIEW_ADVANCE_DIFFERS', seed, `preview stays ${preview.advance.stays} actual ${stayed} (moved ${moved}/${total})`); }
  if (state.privateRng.counter - counter !== battle.attackerTactical.length + battle.defenderTactical.length) note('RNG_DRAW_COUNT', seed, `${state.privateRng.counter - counter}`);
}
console.log(JSON.stringify(stats));
const byKind = {}; for (const p of problems) byKind[p.kind] = (byKind[p.kind] ?? 0) + 1;
console.log('problems', JSON.stringify(byKind));
console.log(JSON.stringify(problems.slice(0, 12), null, 1));
writeFileSync('docs/audit/evidence/alpha-full-audit/results/s5-combat.json', JSON.stringify({ N, stats, byKind, problems }, null, 1));

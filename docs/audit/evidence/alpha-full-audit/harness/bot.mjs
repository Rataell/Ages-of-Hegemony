// A deliberately noisy player: it tries every command family the interface exposes, valid and invalid, and checks after each
// attempt that a refusal changed nothing of its own and that an accepted command moved the version. Everything goes through the
// real HTTP boundary with the player's own session.
import { ALPHA_CARDS, GREAT_PROJECTS } from '@aoh/game-domain';
import { sleep } from './lib.mjs';

const NEI = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const neighbors = id => { const [q, r] = id.split(',').map(Number); return NEI.map(([a, b]) => `${q + a},${r + b}`); };
const mulberry = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const URBAN_CYCLE = ['PRODUCE', 'BUILD', 'RECRUIT', 'RESEARCH', 'PROMOTE_MOOD', 'SUPPORT_TRADE', 'CIVIC_ACTION'];
const INTERACTIVE = new Set(['PLANNING', 'URBAN_ACTIONS', 'DIPLOMACY_TRADE', 'CONFLICTS']);

export class Bot {
  constructor(player, roomId, index, count, sink, seed = 1) { this.p = player; this.roomId = roomId; this.index = index; this.count = count; this.sink = sink; this.rand = mulberry(seed * 977 + index); this.done = new Set(); this.orderSeq = 0; this.deadHexes = new Set(); }
  pick(list) { return list.length ? list[Math.floor(this.rand() * list.length)] : undefined; }
  async view() { const r = await this.p.get(this.roomId); if (!r.ok) throw new Error(`read ${r.status} ${JSON.stringify(r.error)}`); return r.value.game; }
  snapshot(v) { return JSON.stringify({ res: v.self.resources, orders: v.self.orders.length, hand: v.self.hand.length, units: v.units.filter(u => u.ownerId === v.self.playerId).length, spent: v.self.spentCommands, cities: v.view.player.civilization.cities.length, worked: v.view.player.civilization.cities.map(c => c.workedHexIds.length), research: v.self.research.length, prestige: v.self.prestige, ambitions: v.self.ambitions.length }); }
  /** Sends one command. Refusal must be atomic for this player; success must move the version. */
  async send(payload, label, { mustFail = false } = {}) {
    let before = await this.view();
    const shoot = async (v) => this.p.command(this.roomId, { ...payload, expectedVersion: v.version }, { expect: [200, 400, 403, 409] });
    let reply = await shoot(before), retried = false, conflicts = 0;
    // The real client retries once. This bot keeps going (up to 10) so the depth needed under concurrency is measured, not guessed.
    while (reply.status === 409 && conflicts < 10) { conflicts++; retried = true; await new Promise(r => setTimeout(r, 120 + Math.floor(this.rand() * 500))); before = await this.view(); reply = await shoot(before); }
    const after = reply.ok ? reply.value.game : await this.view();
    const entry = { round: before.view.round, phase: before.phase, player: this.index, type: payload.type, sub: label, ok: reply.ok, status: reply.status, code: reply.error?.code ?? null, message: reply.error?.message ?? null, retried, conflicts };
    if (!reply.ok && !INTERACTIVE.has('x')) { const same = this.snapshot(before) === this.snapshot(after) || after.phase !== before.phase || after.view.round !== before.view.round; if (!same) this.sink.anomalies.push({ ...entry, kind: 'REFUSAL_CHANGED_STATE', before: this.snapshot(before), after: this.snapshot(after) }); }
    if (reply.ok && !(reply.value.game.version > before.version)) this.sink.anomalies.push({ ...entry, kind: 'ACCEPTED_WITHOUT_VERSION_BUMP' });
    if (mustFail && reply.ok) this.sink.anomalies.push({ ...entry, kind: 'SHOULD_HAVE_BEEN_REFUSED' });
    if (reply.status >= 500) this.sink.anomalies.push({ ...entry, kind: 'SERVER_ERROR' });
    this.sink.attempts.push(entry);
    return { reply, before, after, entry };
  }
  own(v) { return v.units.filter(u => u.ownerId === v.self.playerId); }
  tileMap(v) { const m = new Map(); for (const t of [...v.knownTerritory, ...v.view.visibleTerritory]) m.set(t.id, t); return m; }

  async planning(v) {
    const round = v.view.round, self = v.self, cities = v.view.player.civilization.cities;
    if (v.worldDecisionPending) await this.send({ type: 'WORLD_CHOICE', choice: this.rand() < .5 ? 'RESOURCE' : 'PRESTIGE' }, 'world');
    if (!self.ambitionsChosen) await this.send({ type: 'CHOOSE_AMBITIONS', cardIds: self.ambitions.slice(0, 2) }, 'ambitions');
    if (round === 1) await this.send({ type: 'CHOOSE_AMBITIONS', cardIds: self.ambitions.slice(0, 2) }, 'ambitions-twice', { mustFail: true });
    await this.send({ type: 'SET_DEFENSE_POSTURE', posture: ['HOLD', 'ASSAULT', 'MANEUVER'][round % 3] }, 'posture');
    v = await this.view();
    const tiles = this.tileMap(v), ownTiles = v.view.visibleTerritory.filter(t => t.ownerId === self.playerId);
    const city = cities[0];
    // territory
    const claimable = []; for (const t of ownTiles) for (const n of neighbors(t.id)) { const x = tiles.get(n); if (x && x.terrain !== 'SEA' && x.terrain !== 'UNKNOWN' && (!('ownerId' in x) || x.ownerId === null)) claimable.push(n); }
    for (const hexId of [...new Set(claimable)].slice(0, 2)) await this.send({ type: 'MANAGE', command: { type: 'CLAIM_HEX', playerId: self.playerId, cityId: city.id, hexId, expectedVersion: v.view.version } }, 'claim');
    await this.send({ type: 'MANAGE', command: { type: 'CLAIM_HEX', playerId: self.playerId, cityId: city.id, hexId: '999,999', expectedVersion: v.view.version } }, 'claim-nonexistent', { mustFail: true });
    v = await this.view();
    const mine = v.view.visibleTerritory.filter(t => t.ownerId === self.playerId);
    const ids = mine.filter(t => t.controllerCityId === city.id).map(t => t.id);
    await this.send({ type: 'MANAGE', command: { type: 'ASSIGN_WORKED_HEXES', playerId: self.playerId, cityId: city.id, hexIds: ids.slice(0, 3), expectedVersion: v.view.version } }, 'work');
    await this.send({ type: 'MANAGE', command: { type: 'ASSIGN_WORKED_HEXES', playerId: self.playerId, cityId: city.id, hexIds: ids.concat(ids).slice(0, 40), expectedVersion: v.view.version } }, 'work-too-many-or-duplicate', { mustFail: true });
    const kinds = Object.keys(v.view.config.territory.improvementCatalog);
    const target = mine.find(t => !t.improvement);
    if (target) await this.send({ type: 'MANAGE', command: { type: 'IMPROVE_HEX', playerId: self.playerId, hexId: target.id, improvement: this.pick(kinds), expectedVersion: v.view.version } }, 'improve');
    await this.send({ type: 'MANAGE', command: { type: 'IMPROVE_HEX', playerId: self.playerId, hexId: (this.pick(v.view.visibleTerritory.filter(t => t.ownerId && t.ownerId !== self.playerId)) ?? { id: '500,500' }).id, improvement: 'FARM', expectedVersion: v.view.version } }, 'improve-foreign', { mustFail: true });
    if (mine[1]) await this.send({ type: 'BUILD_ROAD', hexId: mine[1].id }, 'road');
    if (round === 2) await this.send({ type: 'MANAGE', command: { type: 'ADOPT_GOVERNMENT', playerId: self.playerId, government: ['MONARCHY', 'REPUBLIC', 'OLIGARCHY', 'THEOCRACY', 'CONFEDERATION'][this.index % 5], expectedVersion: v.view.version } }, 'government');
    if (round >= 2) await this.send({ type: 'MANAGE', command: { type: 'DEVELOP_CITY', playerId: self.playerId, cityId: city.id, expectedVersion: v.view.version } }, 'develop');
    if (round >= 3) await this.send({ type: 'MANAGE', command: { type: 'SPECIALIZE_CITY', playerId: self.playerId, cityId: city.id, specialization: this.pick(['AGRARIAN', 'COMMERCIAL', 'ACADEMIC', 'MILITARY']), expectedVersion: v.view.version } }, 'specialize');
    // cards, advisors, projects, abilities
    v = await this.view();
    for (const cardId of v.self.hand.slice(0, 2)) await this.send({ type: 'PLAY_CARD', cardId }, `card:${ALPHA_CARDS.find(c => c.id === cardId)?.family ?? '?'}`);
    if (round === 3 && v.advisorMarket[0]) await this.send({ type: 'HIRE_ADVISOR', cardId: v.advisorMarket[0] }, 'advisor');
    if (round === 4 && GREAT_PROJECTS[0]) await this.send({ type: 'BUILD_PROJECT', projectId: GREAT_PROJECTS[0].id, cityId: city.id }, 'project');
    if (round >= 2) await this.send({ type: 'CIVILIZATION_ABILITY' }, 'civ-ability');
    if (round >= 2) await this.send({ type: 'LEADER_ABILITY' }, 'leader-ability');
    // orders
    v = await this.view();
    const t2 = this.tileMap(v), units = this.own(v);
    for (const u of units.slice(0, 3)) {
      const entry = v.rules.units[u.kind], known = new Set(v.self.knownHexIds);
      if (u.kind === 'PIONEER' && round === 2) { await this.send({ type: 'SETTLE', unitId: u.id, name: `Colônia ${this.index}` }, 'settle'); continue; }
      if (u.kind === 'EXPLORER') { const f = this.pick(v.frontier); if (f) await this.send({ type: 'QUEUE_ORDER', order: { id: `o-${this.index}-${++this.orderSeq}`, type: 'EXPLORE', unitId: u.id, target: f.id, rotation: Math.floor(this.rand() * 6) } }, 'explore'); continue; }
      const options = neighbors(u.hexId).filter(n => known.has(n) && (t2.get(n) ? (entry.domain === 'SEA' ? ['SEA', 'COAST'].includes(t2.get(n).terrain) : !['SEA', 'UNKNOWN'].includes(t2.get(n).terrain)) : false));
      const dest = this.pick(options);
      if (dest) await this.send({ type: 'QUEUE_ORDER', order: { id: `o-${this.index}-${++this.orderSeq}`, type: 'MOVE', unitIds: [u.id], path: [dest] } }, `move:${u.kind}`);
      const far = this.pick([...known].filter(h => !neighbors(u.hexId).includes(h) && h !== u.hexId));
      if (far && round % 3 === 0) await this.send({ type: 'QUEUE_ORDER', order: { id: `o-${this.index}-${++this.orderSeq}`, type: 'MOVE', unitIds: [u.id], path: [far] } }, 'move-too-far-or-not-adjacent', { mustFail: true });
    }
    v = await this.view();
    if (v.self.orders.length) await this.send({ type: 'CANCEL_ORDER', orderId: v.self.orders[0].id }, 'cancel-order');
    await this.send({ type: 'CANCEL_ORDER', orderId: 'does-not-exist' }, 'cancel-unknown', { mustFail: false });
    // diplomacy and war are scheduled so every pair eventually meets
    if (this.count >= 2 && round === 3 && this.index === 0) await this.send({ type: 'DECLARE_WAR', targetId: v.players.find(p => p.id !== v.self.playerId).id }, 'war');
    v = await this.view();
    if (v.milestones.canAdvance) await this.send({ type: 'ADVANCE_ERA' }, 'era');
    const ready = v.hegemony.find(h => h.requirements.every(r => r.met ?? r.current >= r.minimum));
    if (ready) await this.send({ type: 'DECLARE_HEGEMONY', path: ready.path }, 'hegemony');
    else if (round === 5) await this.send({ type: 'DECLARE_HEGEMONY', path: 'MILITARY' }, 'hegemony-unmet', { mustFail: true });
  }

  async urban(v) {
    const round = v.view.round, cities = v.view.player.civilization.cities;
    for (const [i, c] of cities.entries()) {
      const options = v.urban.cities[c.id] ?? [], want = URBAN_CYCLE[(round + i + this.index) % URBAN_CYCLE.length];
      const legal = options.filter(o => o.action === want && o.blocked === null), any = options.filter(o => o.blocked === null);
      const option = this.pick(legal) ?? options.find(o => o.action === 'PRODUCE' && o.blocked === null) ?? this.pick(any);
      const shape = o => ({ type: 'URBAN_ACTION', cityId: c.id, action: o.action, ...(o.build ? { build: o.build } : {}), ...(o.unit ? { unit: o.unit } : {}), ...(o.advancementId ? { advancementId: o.advancementId } : {}) });
      if (option) { await this.send(shape(option), `urban:${option.action}`); await this.send(shape(option), 'urban-second-in-same-city', { mustFail: true }); }
      const blocked = options.find(o => o.blocked && !/já usou|ação urbana|fase/i.test(o.blocked) && o.action !== 'PRODUCE');
      if (blocked && round % 2 === 0 && !option) await this.send(shape(blocked), `urban-blocked:${blocked.action}`, { mustFail: true });
    }
  }
  async diplomacy(v) {
    const other = v.players.find(p => p.id !== v.self.playerId);
    for (const t of v.treaties ?? []) if (t.status === 'PROPOSED' && (t.recipientId === v.self.playerId || t.toId === v.self.playerId)) await this.send({ type: 'RESPOND_TREATY', treatyId: t.id, accept: this.rand() < .8 }, 'respond-treaty');
    if (other && v.view.round % 2 === 0 && this.index === 0) await this.send({ type: 'PROPOSE_TREATY', recipientId: other.id, treaty: ['TRADE_AGREEMENT', 'NON_AGGRESSION_PACT', 'OPEN_BORDERS'][(v.view.round / 2 - 1) % 3], deal: { give: { food: 0, materials: 0, wealth: 0, knowledge: 0, influence: 0 }, receive: { food: 0, materials: 0, wealth: 0, knowledge: 0, influence: 0 } } }, 'propose-treaty');
    if (v.treaties?.[0] && v.view.round === 6 && this.index === 0) await this.send({ type: 'END_TREATY', treatyId: v.treaties[0].id }, 'end-treaty');
  }

  /** One step: act in the current phase if it is interactive and this player has not confirmed it. Returns the view. */
  async step() {
    let v = await this.view();
    if (v.winner || v.view.status === 'FINISHED') return v;
    if (!INTERACTIVE.has(v.phase) || v.self.ready) return v;
    const key = `${v.view.round}:${v.phase}`;
    if (this.done.has(key)) return v;
    try {
      if (v.phase === 'PLANNING') await this.planning(v);
      else if (v.phase === 'URBAN_ACTIONS') await this.urban(v);
      else if (v.phase === 'DIPLOMACY_TRADE') await this.diplomacy(v);
      else if (v.phase === 'CONFLICTS' && v.self.hand[0] && v.view.round % 3 === 0) await this.send({ type: 'PLAY_CARD', cardId: v.self.hand[0] }, 'card-in-conflicts');
    } catch (error) { this.sink.anomalies.push({ kind: 'BOT_EXCEPTION', player: this.index, round: v.view.round, phase: v.phase, message: String(error.message).slice(0, 200) }); }
    for (let attempt = 0; attempt < 4; attempt++) {
      v = await this.view();
      if (v.self.ready || !INTERACTIVE.has(v.phase) || `${v.view.round}:${v.phase}` !== key) break;
      await this.send({ type: 'READY' }, `ready:${v.phase}`);
    }
    this.done.add(key);
    return this.view();
  }
}

/** Plays one full match with every bot in parallel until a winner or a stall. */
export async function playMatch({ players, roomId, sink, seed = 1, maxSeconds = 1500, onRound = () => {}, BotClass = Bot, setup = () => {} }) {
  const bots = players.map((p, i) => { const b = new BotClass(p, roomId, i, players.length, sink, seed); setup(b, i); return b; });
  const started = Date.now(); let lastVersion = -1, lastMove = Date.now(), lastKey = '', rounds = new Set();
  for (;;) {
    const views = await Promise.all(bots.map(b => b.step()));
    const v = views[0];
    const key = `${v.view.round}:${v.phase}`;
    if (key !== lastKey) { sink.phases.push({ t: Math.round((Date.now() - started) / 1000), round: v.view.round, phase: v.phase, version: v.version }); lastKey = key; }
    if (!rounds.has(v.view.round)) { rounds.add(v.view.round); onRound(v, views); }
    if (v.winner || v.view.status === 'FINISHED') return { finished: true, winner: v.winner, round: v.view.round, seconds: (Date.now() - started) / 1000, views };
    if (v.version !== lastVersion) { lastVersion = v.version; lastMove = Date.now(); }
    if (Date.now() - lastMove > 150000) { sink.anomalies.push({ kind: 'STALL', round: v.view.round, phase: v.phase, version: v.version, ready: views.map(x => x.self.ready) }); return { finished: false, stalled: true, round: v.view.round, phase: v.phase, seconds: (Date.now() - started) / 1000, views }; }
    if ((Date.now() - started) / 1000 > maxSeconds) return { finished: false, timeout: true, round: v.view.round, phase: v.phase, seconds: maxSeconds, views };
    await sleep(700);
  }
}

// Directed rush: two players march straight at each other's capital to find out whether contact, diplomacy, war and combat are
// reachable inside a QUICK (9-round) match over the real HTTP boundary. The harness knows both capitals (it controls both
// seats); the players themselves only use what their own projection shows.
import { startMatch, save, summarizeLog, check, finding } from './lib.mjs';
import { Bot, playMatch } from './bot.mjs';

const seed = Number(process.argv[2] ?? 1), preset = process.argv[3] ?? 'QUICK', count = 2;
const NEI = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const neighbors = id => { const [q, r] = id.split(',').map(Number); return NEI.map(([a, b]) => `${q + a},${r + b}`); };
const dist = (a, b) => { const [q1, r1] = a.split(',').map(Number), [q2, r2] = b.split(',').map(Number); const dq = q1 - q2, dr = r1 - r2; return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)); };

class Rusher extends Bot {
  constructor(...args) { super(...args); this.visited = new Map(); this.timeline = []; }
  path(v, unit, tiles) {
    const known = new Set(v.self.knownHexIds), mov = v.rules.units[unit.kind].movement, costs = v.rules.movementCosts;
    const seen = this.visited.get(unit.id) ?? new Set(); let cur = unit.hexId, cost = 0; const path = [];
    for (let i = 0; i < 8; i++) {
      const options = neighbors(cur).filter(n => known.has(n) && tiles.get(n) && !['SEA', 'UNKNOWN'].includes(tiles.get(n).terrain) && !path.includes(n) && !seen.has(n) && (!tiles.get(n).ownerId || tiles.get(n).ownerId === v.self.playerId))
        .map(n => ({ n, d: dist(n, this.target), c: costs[tiles.get(n).terrain] ?? 1 })).sort((a, b) => a.d - b.d || a.c - b.c);
      const step = options[0]; if (!step || step.d > dist(cur, this.target) + 1 || cost + step.c > mov) break;
      path.push(step.n); cost += step.c; cur = step.n;
    }
    path.forEach(n => seen.add(n)); seen.add(unit.hexId); this.visited.set(unit.id, seen);
    return path;
  }
  async planning(v) {
    const self = v.self, round = v.view.round;
    if (v.worldDecisionPending) await this.send({ type: 'WORLD_CHOICE', choice: 'RESOURCE' }, 'world');
    if (!self.ambitionsChosen) await this.send({ type: 'CHOOSE_AMBITIONS', cardIds: self.ambitions.slice(0, 2) }, 'ambitions');
    await this.send({ type: 'SET_DEFENSE_POSTURE', posture: 'ASSAULT' }, 'posture');
    v = await this.view();
    const tiles = this.tileMap(v), enemyId = v.players.find(p => p.id !== self.playerId)?.id;
    const atWar = (v.wars ?? []).length > 0;
    const enemies = v.units.filter(u => u.ownerId && u.ownerId !== self.playerId);
    const enemyCities = v.view.visibleTerritory.filter(t => t.cityId && t.ownerId && t.ownerId !== self.playerId);
    for (const u of this.own(v).filter(u => v.rules.units[u.kind].movement > 0)) {
      const strength = v.rules.units[u.kind].strength;
      // 1) war: attack anything adjacent
      const targets = [...enemies.map(e => e.hexId), ...enemyCities.map(t => t.id)].filter(h => dist(h, u.hexId) === 1);
      if (atWar && strength > 0 && targets[0]) { await this.send({ type: 'QUEUE_ORDER', order: { id: `o-${this.index}-${++this.orderSeq}`, type: 'ATTACK', unitIds: [u.id], target: targets[0], posture: 'ASSAULT' } }, `attack:${u.kind}`); continue; }
      // 2) explorers uncover the frontier nearest to the enemy
      if (u.kind === 'EXPLORER') {
        const frontier = [...v.frontier].sort((a, b) => dist(a.id, this.target) - dist(b.id, this.target)).slice(0, 6);
        let done = false;
        for (const f of frontier) { const r = await this.send({ type: 'QUEUE_ORDER', order: { id: `o-${this.index}-${++this.orderSeq}`, type: 'EXPLORE', unitId: u.id, target: f.id, rotation: 0 } }, 'explore'); if (r.reply.ok) { done = true; break; } }
        if (done) continue;
      }
      const path = this.path(v, u, tiles);
      if (path.length) await this.send({ type: 'QUEUE_ORDER', order: { id: `o-${this.index}-${++this.orderSeq}`, type: 'MOVE', unitIds: [u.id], path } }, `rush:${u.kind}`);
    }
  }
  async urban(v) {
    const round = v.view.round, city = v.view.player.civilization.cities[0]; if (!city) return;
    const options = v.urban.cities[city.id] ?? [];
    const want = round === 1 ? ['EXPLORER', 'INFANTRY'] : round <= 4 ? ['INFANTRY', 'GUARD', 'EXPLORER'] : [];
    let option = null; for (const kind of want) option ??= options.find(o => o.action === 'RECRUIT' && o.unit === kind && o.blocked === null);
    option ??= options.find(o => o.action === 'PRODUCE' && o.blocked === null);
    if (option) await this.send({ type: 'URBAN_ACTION', cityId: city.id, action: option.action, ...(option.unit ? { unit: option.unit } : {}) }, `urban:${option.action}${option.unit ? ':' + option.unit : ''}`);
  }
  async diplomacy(v) {
    const other = v.players.find(p => p.id !== v.self.playerId);
    for (const t of v.treaties ?? []) if (t.status === 'PROPOSED' && (t.recipientId === v.self.playerId || t.toId === v.self.playerId)) await this.send({ type: 'RESPOND_TREATY', treatyId: t.id, accept: true }, 'respond-treaty');
    if (other && v.self.contacts.includes(other.id) && (v.wars ?? []).length === 0 && this.index === 0) await this.send({ type: 'DECLARE_WAR', targetId: other.id }, 'war');
  }
}

const sink = { attempts: [], anomalies: [], phases: [] };
const { players, roomId } = await startMatch(count, { seed: 40 + seed, preset });
const setup = {};
const first = await Promise.all(players.map(async p => (await p.get(roomId)).value.game));
const capital = i => first[i].view.player.civilization.cities[0].hexId;
console.log('capitals', capital(0), capital(1), 'distance', dist(capital(0), capital(1)));
const timeline = [];
const result = await playMatch({ players, roomId, sink, seed, maxSeconds: 1500, BotClass: Rusher, setup: (b, i) => { b.target = capital(1 - i); }, onRound: (v, views) => {
  const mine = views.map(x => x.units.filter(u => u.ownerId === x.self.playerId).map(u => u.hexId));
  let nearest = Infinity; for (const a of mine[0]) for (const b of mine[1]) nearest = Math.min(nearest, dist(a, b));
  const toCapital = views.map((x, i) => Math.min(...mine[i].map(h => dist(h, capital(1 - i)))));
  timeline.push({ round: v.view.round, nearestUnitPair: nearest, nearestToEnemyCapital: toCapital, contacts: views.map(x => x.self.contacts.length), wars: (views[0].wars ?? []).length, battles: views[0].battles.length, known: views.map(x => x.self.knownHexIds.length), units: views.map(x => x.units.filter(u => u.ownerId === x.self.playerId).map(u => u.kind).join('/')) });
  console.log('  round', v.view.round, JSON.stringify(timeline.at(-1)));
} });
const table = {}; for (const a of sink.attempts) { const k = `${a.type}:${a.sub}`; const t = (table[k] ??= { ok: 0, refused: 0, codes: {}, sample: {} }); if (a.ok) t.ok++; else { t.refused++; t.codes[a.code ?? a.status] = (t.codes[a.code ?? a.status] ?? 0) + 1; t.sample[a.code ?? a.status] ??= a.message; } }
const fin = result.views.map(v => ({ contacts: v.self.contacts.length, battles: v.battles.length, wars: (v.wars ?? []).length, treaties: (v.treaties ?? []).length, prestige: v.self.prestige, known: v.self.knownHexIds.length, explored: v.self.exploredRegions, units: v.units.filter(u => u.ownerId === v.self.playerId).map(u => u.kind).join(',') }));
console.log('result', JSON.stringify({ finished: result.finished, round: result.round, seconds: Math.round(result.seconds), anomalies: sink.anomalies.length }));
console.log('final', JSON.stringify(fin));
for (const [k, v] of Object.entries(table)) console.log(' ', k, v.ok, v.refused, JSON.stringify(v.codes), JSON.stringify(v.sample).slice(0, 160));
console.log('anomalies', JSON.stringify(sink.anomalies.slice(0, 6)).slice(0, 800));
save(`s12-rush-${preset.toLowerCase()}-seed${seed}`, { seed, preset, capitals: [capital(0), capital(1)], distance: dist(capital(0), capital(1)), timeline, table, final: fin, anomalies: sink.anomalies, summary: summarizeLog() });

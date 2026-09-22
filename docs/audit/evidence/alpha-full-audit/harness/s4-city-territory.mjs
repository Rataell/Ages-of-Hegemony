// Deterministic checks of territory, roads, orders, command points and every urban option: preview (`blocked`) vs server, cost vs resources, atomic refusals.
import { startMatch, save, check, finding, FINDINGS, LOG } from './lib.mjs';

const RES = ['food', 'wood', 'stone', 'metal', 'wealth', 'knowledge', 'influence'];
const out = { territory: [], orders: [], urban: [], parity: [] };
const { players, roomId } = await startMatch(2);
const [A, B] = players;
const game = async p => (await p.get(roomId)).value.game;
const diff = (a, b) => Object.fromEntries(RES.map(k => [k, b[k] - a[k]]).filter(([, v]) => v !== 0));
async function act(p, payload) {
  const before = await game(p);
  const r = await p.command(roomId, { ...payload, expectedVersion: before.version }, { expect: [200, 400, 403, 409] });
  const after = r.ok ? r.value.game : await game(p);
  return { r, before, after, spent: diff(before.self.resources, after.self.resources), same: JSON.stringify(before.self.resources) === JSON.stringify(after.self.resources) };
}
const ready = async () => { for (const p of players) { const v = await game(p); if (!v.self.ready) await p.command(roomId, { type: 'READY', expectedVersion: v.version }); } };
const bothPrep = async () => { for (const p of players) { const v = await game(p); if (v.worldDecisionPending) await act(p, { type: 'WORLD_CHOICE', choice: 'RESOURCE' }); const w = await game(p); if (!w.self.ambitionsChosen) await act(p, { type: 'CHOOSE_AMBITIONS', cardIds: w.self.ambitions.slice(0, 2) }); } };
const mg = (v, command) => ({ type: 'MANAGE', command: { playerId: v.self.playerId, expectedVersion: v.view.version, ...command } });

console.log('## territory (round 1, planning)');
await bothPrep();
{
  let v = await game(A);
  const city = v.view.player.civilization.cities[0];
  const catalog = v.view.config.territory.improvementCatalog;
  console.log('  city', JSON.stringify({ id: city.id, pop: city.population, workers: city.workers, worked: city.workedHexIds.length, dev: city.development }));
  const own = v.view.visibleTerritory.filter(t => t.ownerId === v.self.playerId);
  console.log('  own tiles', own.length, own.map(t => `${t.id}:${t.terrain}:${t.improvement ?? '-'}:ctrl=${t.controllerCityId ?? '-'}`).join(' '));
  const producers = city.workers.producers;
  // work assignment: 0..N hexes vs producers
  const controlled = own.filter(t => t.controllerCityId === city.id).map(t => t.id);
  for (const n of [0, 1, producers, producers + 1, controlled.length]) {
    if (n > controlled.length) continue;
    const t = await act(A, mg(await game(A), { type: 'ASSIGN_WORKED_HEXES', cityId: city.id, hexIds: controlled.slice(0, n) }));
    out.territory.push({ what: `assign ${n} hexes (producers ${producers})`, ok: t.r.ok, code: t.r.error?.code, msg: t.r.error?.message, spent: t.spent });
    console.log(`  assign ${n} (producers ${producers}) → ${t.r.ok ? 'ok' : t.r.error?.code + ' ' + t.r.error?.message}`);
  }
  const dup = await act(A, mg(await game(A), { type: 'ASSIGN_WORKED_HEXES', cityId: city.id, hexIds: [controlled[0], controlled[0]] }));
  check('assigning the same hex twice is refused', !dup.r.ok, dup.r.error?.message);
  const foreignHex = (await game(B)).view.player.civilization.cities[0].hexId;
  const steal = await act(A, mg(await game(A), { type: 'ASSIGN_WORKED_HEXES', cityId: city.id, hexIds: [foreignHex] }));
  check("working another civilization's hex is refused", !steal.r.ok && steal.same, steal.r.error?.message);
  // claim
  const cfg = v.view.config.territory;
  const claimable = own.flatMap(t => []).concat([]);
  const tilesById = new Map([...v.view.visibleTerritory, ...v.knownTerritory].map(t => [t.id, t]));
  const neighborsOf = id => { const [q, r] = id.split(',').map(Number); return [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]].map(([a, b]) => `${q + a},${r + b}`); };
  const free = [...new Set(own.flatMap(t => neighborsOf(t.id)))].filter(id => tilesById.has(id) && !tilesById.get(id).ownerId && !['SEA'].includes(tilesById.get(id).terrain));
  console.log('  claim cost', JSON.stringify(cfg.claimCost), 'free neighbours', free.length);
  if (free[0]) {
    const c1 = await act(A, mg(await game(A), { type: 'CLAIM_HEX', cityId: city.id, hexId: free[0] }));
    out.territory.push({ what: 'claim neighbour', ok: c1.r.ok, spent: c1.spent, expectedCost: cfg.claimCost, msg: c1.r.error?.message });
    const legacy = Object.fromEntries(Object.entries(cfg.claimCost).filter(([, x]) => x));
    console.log('  claim →', c1.r.ok ? 'ok spent ' + JSON.stringify(c1.spent) : c1.r.error?.code + ' ' + c1.r.error?.message);
    const c2 = await act(A, mg(await game(A), { type: 'CLAIM_HEX', cityId: city.id, hexId: free[0] }));
    check('claiming a hex already owned is refused and free of cost', !c2.r.ok && c2.same, c2.r.error?.message);
  }
  const far = [...tilesById.keys()].find(id => !own.some(t => neighborsOf(t.id).includes(id)) && !tilesById.get(id).ownerId && id !== city.hexId);
  const c3 = await act(A, mg(await game(A), { type: 'CLAIM_HEX', cityId: city.id, hexId: far ?? '900,900' }));
  check('claiming a non-adjacent / unknown hex is refused and free of cost', !c3.r.ok && c3.same, `${c3.r.error?.code} ${c3.r.error?.message}`);
  // improvements
  v = await game(A);
  const mine = v.view.visibleTerritory.filter(t => t.ownerId === v.self.playerId && !t.improvement);
  for (const [kind, entry] of Object.entries(catalog)) {
    v = await game(A);
    const compat = v.view.visibleTerritory.filter(t => t.ownerId === v.self.playerId && !t.improvement && (entry.terrains ?? []).includes(t.terrain));
    const t = compat[0] ?? mine.find(x => !x.improvement) ?? mine[0];
    if (!t) continue;
    const r = await act(A, mg(await game(A), { type: 'IMPROVE_HEX', hexId: t.id, improvement: kind }));
    const cost = entry.cost;
    out.territory.push({ what: `improve ${kind} on ${t.terrain}`, ok: r.r.ok, code: r.r.error?.code, msg: r.r.error?.message, spent: r.spent, catalogCost: cost });
    const expectSpent = Object.fromEntries(Object.entries(cost).filter(([, x]) => x).map(([k, x]) => [k, -x]));
    console.log(`  improve ${kind} on ${t.id}(${t.terrain}) → ${r.r.ok ? 'ok spent ' + JSON.stringify(r.spent) + ' catalog ' + JSON.stringify(expectSpent) : r.r.error?.code + ': ' + r.r.error?.message + (r.same ? ' [no resources moved]' : ' [RESOURCES MOVED ' + JSON.stringify(r.spent) + ']')}`);
    if (!r.r.ok && !r.same) finding('T-ATOM', 'P1', 'Território', `IMPROVE_HEX ${kind} refused but resources moved ${JSON.stringify(r.spent)}`);
  }
  const road = await act(A, { type: 'BUILD_ROAD', hexId: own.find(t => t.id !== city.hexId)?.id ?? city.hexId });
  out.territory.push({ what: 'road', ok: road.r.ok, msg: road.r.error?.message, spent: road.spent });
  console.log('  road →', road.r.ok ? 'ok ' + JSON.stringify(road.spent) : road.r.error?.code + ' ' + road.r.error?.message);
}

console.log('\n## orders and command points');
{
  let v = await game(A);
  console.log('  commandCapacity', v.commandCapacity, 'spent', v.self.spentCommands, 'orders', v.self.orders.length, 'units', v.units.filter(u => u.ownerId === v.self.playerId).map(u => `${u.kind}@${u.hexId}`).join(','));
  const pioneer = v.units.find(u => u.ownerId === v.self.playerId && u.kind === 'PIONEER');
  const movement = v.rules.units.PIONEER.movement, costs = v.rules.movementCosts;
  const known = new Map([...v.view.visibleTerritory, ...v.knownTerritory].map(t => [t.id, t]));
  const nb = id => { const [q, r] = id.split(',').map(Number); return [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]].map(([a, b]) => `${q + a},${r + b}`); };
  const walk = (from, n) => { const path = []; let cur = from; const seen = new Set([from]); for (let i = 0; i < n; i++) { const next = nb(cur).find(h => known.has(h) && !['SEA', 'UNKNOWN'].includes(known.get(h).terrain) && !seen.has(h) && v.self.knownHexIds.includes(h)); if (!next) break; path.push(next); seen.add(next); cur = next; } return path; };
  let seq = 0; const oid = () => `audit-${++seq}`;
  const tryMove = async (path, label, want) => {
    const r = await act(A, { type: 'QUEUE_ORDER', order: { id: oid(), type: 'MOVE', unitIds: [pioneer.id], path } });
    const cost = path.reduce((n, h) => n + costs[known.get(h)?.terrain ?? 'UNKNOWN'], 0);
    out.orders.push({ what: label, ok: r.r.ok, expectedByRule: want, cost, movement, code: r.r.error?.code, msg: r.r.error?.message });
    console.log(`  ${label}: path ${path.join('>')} cost ${cost}/${movement} → ${r.r.ok ? 'accepted' : r.r.error?.message}${want !== undefined && want !== r.r.ok ? '   <-- DIVERGES from cost rule' : ''}`);
    if (r.r.ok) { const v2 = await game(A); await act(A, { type: 'CANCEL_ORDER', orderId: v2.self.orders.at(-1).id }); }
    return r;
  };
  const p1 = walk(pioneer.hexId, 1), p2 = walk(pioneer.hexId, 2), p3 = walk(pioneer.hexId, 3);
  if (p1.length) await tryMove(p1, 'one hex', costOf(p1) <= movement);
  if (p2.length === 2) await tryMove(p2, 'two hexes', costOf(p2) <= movement);
  if (p3.length === 3) await tryMove(p3, 'three hexes', costOf(p3) <= movement);
  if (p2.length === 2) await tryMove([p2[0], pioneer.hexId], 'there and back (repeated hex)', undefined);
  await tryMove(['900,900'], 'unknown hex', false);
  function costOf(path) { return path.reduce((n, h) => n + costs[known.get(h)?.terrain ?? 'UNKNOWN'], 0); }
  // command points
  v = await game(A);
  const ids = []; let accepted = 0, refusedAt = null;
  for (let i = 1; i <= 7; i++) {
    const r = await act(A, { type: 'QUEUE_ORDER', order: { id: `cap-${i}`, type: 'MOVE', unitIds: [pioneer.id], path: p1.length ? p1 : ['900,900'] } });
    // the same unit can be in one order only: replacing by id keeps count. Use distinct ids and distinct units is impossible with one unit, so record the rule text.
    out.orders.push({ what: `queue ${i} order on same unit`, ok: r.r.ok, msg: r.r.error?.message });
    if (r.r.ok) accepted++; else { refusedAt = refusedAt ?? i; }
  }
  const after = await game(A);
  out.commandPoints = { capacity: v.commandCapacity, accepted, firstRefusal: refusedAt, ordersHeld: after.self.orders.length, spentCommands: after.self.spentCommands };
  console.log('  command points', JSON.stringify(out.commandPoints));
}

console.log('\n## phases: planning → urban actions');
await ready();
{
  let v = await game(A);
  console.log('  phase now', v.phase, 'round', v.view.round);
}
console.log('\n## urban options: preview vs server, every option');
for (let round = 1; round <= 3; round++) {
  for (const p of [A, B]) {
    const v = await game(p);
    if (v.phase !== 'URBAN_ACTIONS') { console.log(`  (${p.name} not in urban phase: ${v.phase})`); continue; }
    for (const [cityId, options] of Object.entries(v.urban.cities)) {
      // 1) blocked options must be refused with the preview's reason and free of side effects
      let blockedTested = 0, mismatches = 0;
      for (const o of options.filter(o => o.blocked)) {
        const payload = { type: 'URBAN_ACTION', cityId, action: o.action, ...(o.build ? { build: o.build } : {}), ...(o.unit ? { unit: o.unit } : {}), ...(o.advancementId ? { advancementId: o.advancementId } : {}) };
        const r = await act(p, payload); blockedTested++;
        const good = !r.r.ok && r.same;
        if (!good) { mismatches++; finding('U-PARITY', 'P1', 'Cidades', `Opção bloqueada aceita/alterou recursos: ${o.action} ${JSON.stringify(o.build ?? o.unit ?? o.advancementId ?? '')} — preview: ${o.blocked} — server: ${r.r.ok ? 'ACEITOU' : r.r.error?.message}`); }
        else if (r.r.error?.message !== o.blocked) out.parity.push({ action: o.action, target: o.build ?? o.unit ?? o.advancementId ?? null, preview: o.blocked, server: r.r.error?.message });
      }
      // 2) one unblocked option: must succeed and spend exactly its previewed cost
      const okOpts = options.filter(o => !o.blocked);
      const want = okOpts[(round + (p === A ? 0 : 1)) % Math.max(okOpts.length, 1)];
      let result = 'none available';
      if (want) {
        const payload = { type: 'URBAN_ACTION', cityId, action: want.action, ...(want.build ? { build: want.build } : {}), ...(want.unit ? { unit: want.unit } : {}), ...(want.advancementId ? { advancementId: want.advancementId } : {}) };
        const r = await act(p, payload);
        const expectSpent = Object.fromEntries(Object.entries(want.cost).filter(([, x]) => x).map(([k, x]) => [k, -x]));
        // production adds resources on PRODUCE; only compare spending for costed actions
        const costOk = want.action === 'PRODUCE' || Object.entries(expectSpent).every(([k, x]) => r.spent[k] <= x + 0 || (r.spent[k] ?? 0) === x || true);
        result = r.r.ok ? `accepted, spent ${JSON.stringify(r.spent)} previewed ${JSON.stringify(expectSpent)}` : `REFUSED ${r.r.error?.message}`;
        if (!r.r.ok) finding('U-PARITY', 'P1', 'Cidades', `Opção liberada pelo preview foi recusada: ${want.action} ${JSON.stringify(want.build ?? want.unit ?? want.advancementId ?? '')} → ${r.r.error?.message}`);
        else if (want.action !== 'PRODUCE') { for (const [k, x] of Object.entries(expectSpent)) if (r.spent[k] !== x) finding('U-COST', 'P1', 'Cidades', `Custo cobrado difere do preview em ${k}: previsto ${x}, cobrado ${r.spent[k]} (${want.action})`); }
        const again = await act(p, payload); check(`${p.name} ${cityId} second action in the same city is refused`, !again.r.ok && again.same, again.r.error?.message);
      }
      out.urban.push({ round, player: p.name, cityId, options: options.length, blocked: options.length - okOpts.length, blockedTested, mismatches, result });
      console.log(`  r${round} ${p.name} ${cityId}: ${options.length} options, ${blockedTested} blocked tested (mismatches ${mismatches}); ${result}`);
    }
  }
  await ready();
  // walk through to the next planning round
  let guard = 0;
  for (;;) { const v = await game(A); if (v.view.round > round || v.view.status === 'FINISHED' || guard++ > 20) break; await bothPrep(); await ready(); if (v.phase === 'PLANNING' && v.view.round > round) break; }
  // planning of the next round must be confirmed for urban phase to open again
  const v = await game(A); if (v.phase === 'PLANNING') { await bothPrep(); await ready(); }
}
console.log('\nparity notes (same refusal, different wording):', out.parity.length);
save('s4-city-territory', { out, wordingDiffs: out.parity.slice(0, 20) });
console.log('findings', JSON.stringify(FINDINGS.map(f => f.id + ':' + f.text.slice(0, 80))));

// Research (Teia de avanços) through the real urban-action path, preview vs result, atomic refusals.
import { startMatch, save, check, finding, summarizeLog } from './lib.mjs';
const { players, roomId } = await startMatch(2, { seed: 12 });
const [A] = players; const game = async p => (await p.get(roomId)).value.game;
for (const q of players) for (let i = 0; i < 8; i++) { const v = await game(q); if (v.phase !== 'PLANNING') break; if (v.worldDecisionPending) { await q.command(roomId, { type: 'WORLD_CHOICE', choice: 'RESOURCE', expectedVersion: v.version }, { expect: [200, 409] }); continue; } if (!v.self.ambitionsChosen) { await q.command(roomId, { type: 'CHOOSE_AMBITIONS', cardIds: v.self.ambitions.slice(0, 2), expectedVersion: v.version }, { expect: [200, 409] }); continue; } if (!v.self.ready) await q.command(roomId, { type: 'READY', expectedVersion: v.version }, { expect: [200, 409] }); await new Promise(r => setTimeout(r, 250)); }
let v = await game(A); console.log('phase', v.phase, 'round', v.view.round);
const city = v.view.player.civilization.cities[0], options = v.urban.research;
console.log('research options', options.length, 'available', options.filter(o => !o.blocked).length);
const pick = options.find(o => !o.blocked); check('at least one advancement is researchable in round 1', Boolean(pick));
if (pick) {
  const before = v.self.resources, cost = pick.cost;
  console.log('choosing', pick.advancementId, 'cost', JSON.stringify(cost));
  const r = await A.command(roomId, { type: 'URBAN_ACTION', cityId: city.id, action: 'RESEARCH', advancementId: pick.advancementId, expectedVersion: v.version }, { expect: [200, 400, 409] });
  check('research accepted', r.ok, r.error?.message);
  const after = await game(A);
  check('the advancement is recorded', after.self.research.includes(pick.advancementId));
  const spent = Object.fromEntries(Object.keys(before).map(k => [k, before[k] - after.self.resources[k]]));
  console.log('spent', JSON.stringify(spent), 'preview', JSON.stringify(cost));
  const mismatch = Object.keys(cost).filter(k => (cost[k] ?? 0) !== (spent[k] ?? 0) && !(k === 'materials'));
  check('resources charged match the preview (excluding legacy materials→wood mapping)', mismatch.length === 0, mismatch.map(k => `${k}:${cost[k]} vs ${spent[k]}`).join(' '));
  const again = await A.command(roomId, { type: 'URBAN_ACTION', cityId: city.id, action: 'RESEARCH', advancementId: pick.advancementId, expectedVersion: after.version }, { expect: [400, 409] });
  check('a second urban action in the same city is refused', !again.ok, again.error?.message);
  const dup = after.urban.research.find(o => o.advancementId === pick.advancementId);
  check('the researched advancement disappears from the list', !dup);
  const scoreBefore = v.self.prestige, scoreAfter = after.self.prestige;
  console.log('prestige', scoreBefore, '→', scoreAfter, 'milestones', v.milestones.satisfied, '→', after.milestones.satisfied);
  console.log('teia ui data: nodes', options.length, 'sample', JSON.stringify({ id: pick.advancementId, effect: pick.effect ?? pick.description ?? pick.detail }).slice(0, 200));
}
save('s13-research', { summary: summarizeLog() });

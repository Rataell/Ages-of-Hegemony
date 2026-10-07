// DEV-ONLY balance probe: in-process matches where every civilization sends its scouts (pieces that do not fight)
// toward the nearest rival capital, exploring when that gets closer and moving otherwise. Reports the round of first
// contact per seat count. Usage: node scripts/alpha-contact-sim.mjs [--seeds=20] [--rounds=9]
import { alphaUnitOptions, applyAlphaCommand, beginAlphaPlanning, createAlphaGame, hexDistance } from '@aoh/game-engine';

const args = new Map(process.argv.slice(2).map(value => { const [key, entry] = value.replace(/^--/, '').split('='); return [key, entry ?? true]; }));
const seeds = Number(args.get('seeds') ?? 20), rounds = Number(args.get('rounds') ?? 9);
const at = id => { const [q, r] = id.split(',').map(Number); return { q, r }; };
const must = (state, actor, command) => { const result = applyAlphaCommand(state, actor, { ...command, expectedVersion: state.version }); return result.ok ? result.value : state; };

function play(count, seed) {
  let state = beginAlphaPlanning(createAlphaGame({ gameId: `contact-${count}-${seed}`, seed, preset: 'QUICK', players: Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` })) }));
  const capitals = new Map(state.core.players.map(player => [player.id, player.civilization.cities[0].hexId]));
  const firstContact = new Map();
  for (let round = 1; round <= rounds && state.core.status === 'ACTIVE'; round++) {
    for (const progress of state.players) {
      const actor = progress.playerId;
      if (!progress.ambitionsChosen) state = must(state, actor, { type: 'CHOOSE_AMBITIONS', cardIds: progress.ambitions.slice(0, 2) });
      const city = state.cities.find(meta => meta.currentOwnerId === actor);
      if (city) state = must(state, actor, { type: 'URBAN_ACTION', cityId: city.cityId, action: 'PRODUCE' });
      const home = at(capitals.get(actor));
      const target = at([...capitals].filter(([id]) => id !== actor).map(([, hex]) => hex).sort((a, b) => hexDistance(home, at(a)) - hexDistance(home, at(b)))[0]);
      const options = alphaUnitOptions(state, actor);
      for (const unit of state.units.filter(piece => piece.ownerId === actor && state.rules.units[piece.kind].strength === 0)) {
        const option = options[unit.id]; if (!option) continue;
        const here = hexDistance(at(unit.hexId), target);
        const explore = option.frontier.filter(region => region.block === null && region.entries.length).map(region => ({ ...region, d: Math.min(...region.hexIds.map(id => hexDistance(at(id), target))) })).sort((a, b) => a.d - b.d)[0];
        const move = Object.entries(option.moves).map(([id, path]) => ({ path, d: hexDistance(at(id), target) })).sort((a, b) => a.d - b.d)[0];
        if (explore && explore.d < here) { const entry = [...explore.entries].sort((a, b) => a.path.length - b.path.length)[0]; state = must(state, actor, { type: 'QUEUE_ORDER', order: { id: `x-${state.version}`, type: 'MOVE', unitIds: [unit.id], path: entry.path, rotation: entry.rotations[0] } }); }
        else if (move && move.d < here) state = must(state, actor, { type: 'QUEUE_ORDER', order: { id: `m-${state.version}`, type: 'MOVE', unitIds: [unit.id], path: move.path } });
      }
    }
    for (const progress of state.players) state = must(state, progress.playerId, { type: 'READY' });
    while (state.phase === 'CONFLICTS') for (const progress of state.players.filter(player => !player.ready)) state = must(state, progress.playerId, { type: 'READY' });
    for (const progress of state.players) if (progress.contacts.length && !firstContact.has(progress.playerId)) firstContact.set(progress.playerId, round);
  }
  return state.players.map(progress => firstContact.get(progress.playerId) ?? null);
}

for (const count of [2, 4, 6]) {
  const results = Array.from({ length: seeds }, (_, i) => play(count, i + 1)).flat();
  const reached = results.filter(round => round !== null).sort((a, b) => a - b);
  const median = reached.length ? reached[Math.floor(reached.length / 2)] : null;
  console.log(`${count}p: contato ${reached.length}/${results.length} civilizações · mediana rodada ${median} · pior ${reached.at(-1) ?? '-'}`);
}

// Per-round observer for the Pioneiro comparison (V51B-16 playability slice). Reads states only.
// Use: const obs = observe(); playMatch({ ..., scenario: obs.hook }); obs.result(finalState, ctx).
const ERA_LEN = 5;

export function observe() {
  const snaps = [];
  let base = null;
  const hook = (box, name) => {
    if (name !== 'round-start') return;
    const s = box.state, round = s.core.round;
    if (snaps.length && snaps.at(-1).round === round) return;
    base ??= new Map(s.players.map(p => [p.playerId, new Set(s.regions.filter(r => r.revealedBy.includes(p.playerId)).map(r => r.id))]));
    snaps.push({
      round,
      players: s.players.map(p => {
        const o = s.core.players.find(x => x.id === p.playerId);
        // Regions this player opened beyond its own Pátria (Pátrias are open from the first snapshot).
        const explored = s.regions.filter(r => r.revealedBy.includes(p.playerId) && !base.get(p.playerId).has(r.id)).length;
        return {
          id: p.playerId, cities: o.civilization.cities.length, contacts: p.contacts.filter(c => c !== p.playerId).length,
          pioneers: s.units.filter(u => u.ownerId === p.playerId && u.kind === 'PIONEER').length,
          recruitedPioneers: s.units.filter(u => u.ownerId === p.playerId && u.kind === 'PIONEER' && !u.id.startsWith('pioneer-')).length,
          explored,
          open: s.regions.filter(r => r.revealedBy.length > 0).length,
          army: s.units.filter(u => u.ownerId === p.playerId && ['INFANTRY', 'GUARD', 'RANGED', 'CAVALRY', 'SIEGE'].includes(u.kind)).length,
        };
      }),
    });
  };
  const result = (state, ctx) => {
    const ids = snaps[0]?.players.map(p => p.id) ?? [];
    const at = (round, id) => (snaps.find(sn => sn.round === round) ?? snaps.at(-1)).players.find(p => p.id === id);
    const perPlayer = ids.map(id => {
      const series = snaps.map(sn => ({ round: sn.round, ...sn.players.find(p => p.id === id) }));
      const hitRound = pred => series.find(pred)?.round ?? null;
      const foundedAt = hitRound(x => x.cities >= 2);
      const orphaned = foundedAt !== null && series.some(x => x.round > foundedAt && x.pioneers === 0 && x.round <= 3 * ERA_LEN);
      const afterFound = series.filter(x => foundedAt !== null && x.round >= foundedAt && x.round <= 3 * ERA_LEN);
      const stopped = afterFound.length > 3 && afterFound.at(-1).explored === afterFound[0].explored;
      return {
        id, firstRegion: hitRound(x => x.explored >= 1), secondRegion: hitRound(x => x.explored >= 2),
        firstCity: foundedAt, secondCity: hitRound(x => x.cities >= 3), firstContact: hitRound(x => x.contacts >= 1),
        firstRecruitedPioneer: hitRound(x => x.recruitedPioneers >= 1),
        pioneersByEra: [1, 2, 3, 4].map(e => at(e * ERA_LEN + 1, id)?.pioneers ?? null),
        exploredAtEra: [1, 2, 3, 4].map(e => at(e * ERA_LEN + 1, id)?.explored ?? null),
        citiesEraII: at(2 * ERA_LEN + 1, id)?.cities ?? null, citiesEraIII: at(3 * ERA_LEN + 1, id)?.cities ?? null,
        orphaned, stoppedExploring: stopped, armyEraIII: at(3 * ERA_LEN + 1, id)?.army ?? null,
      };
    });
    return { perPlayer, orders: ctx.counters.orders ?? {}, battles: state.telemetry?.battles ?? 0, citiesCaptured: state.telemetry?.citiesCaptured ?? 0, snaps };
  };
  return { hook, result, snaps };
}

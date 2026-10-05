// Summary of a local playtest log (DEVELOPMENT ONLY, local files only).
// Usage:
//   node scripts/alpha-playtest-summary.mjs <session-dir|events.jsonl>            → summary.json + SUMMARY.md next to the log
//   node scripts/alpha-playtest-summary.mjs --compare <sessionA> <sessionB>       → Markdown comparison on stdout (and COMPARE.md in sessionA's parent when --write)
// The log comes from ALPHA_PLAYTEST_LOG=1 on `npm run dev:alpha` or `--playtest-log=<dir>` on the bot driver.
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function readEvents(target) {
  const file = existsSync(target) && statSync(target).isDirectory() ? join(target, 'events.jsonl') : target;
  return readFileSync(file, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line));
}
const sum = list => list.reduce((a, b) => a + b, 0);
const mean = list => (list.length ? sum(list) / list.length : 0);
const median = list => { const s = [...list].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : 0; };
const round1 = n => Math.round(n * 10) / 10;
const first = (events, pred) => events.find(pred)?.round ?? null;
const count = (list, key) => list.reduce((m, item) => { const k = key(item); m[k] = (m[k] ?? 0) + 1; return m; }, {});

export function summarize(events) {
  const start = events.find(e => e.type === 'session_start');
  const seats = start?.seats?.map(s => s.seat) ?? [...new Set(events.filter(e => e.seat).map(e => e.seat))].sort();
  const last = events.at(-1);
  const end = events.find(e => e.type === 'end') ?? null;
  const closes = events.filter(e => e.type === 'round_close');
  const combats = events.filter(e => e.type === 'combat');
  const playerCombats = combats.filter(c => !c.world);
  const threats = events.filter(e => e.type === 'threat');
  const perSeat = Object.fromEntries(seats.map(seat => {
    const ready = events.filter(e => e.type === 'ready' && e.seat === seat), mine = closes.filter(e => e.seat === seat);
    const opens = events.filter(e => e.type === 'planning_open' && e.seat === seat);
    const commands = events.filter(e => e.type === 'command' && e.seat === seat), rejected = events.filter(e => e.type === 'rejected' && e.seat === seat);
    const orders = {}; for (const c of mine) for (const [k, v] of Object.entries(c.orders ?? {})) orders[k] = (orders[k] ?? 0) + v;
    const maxLevel = c => Math.max(0, ...(c.cityLevels ?? []));
    const levelRound = n => mine.find(c => maxLevel(c) >= n)?.closedRound ?? null;
    const planning = ready.map(r => r.planningMs);
    return [seat, {
      civilization: start?.seats?.find(s => s.seat === seat)?.civilization ?? null,
      roundsClosed: mine.length,
      planningMs: { mean: Math.round(mean(planning)), median: Math.round(median(planning)), max: Math.max(0, ...planning), total: sum(planning) },
      availableActionsMean: round1(mean(opens.map(o => (o.available?.cityActions ?? 0) + (o.available?.research ?? 0) + (o.available?.moves ?? 0) + (o.available?.explore ?? 0)))),
      commands: commands.length, commandsByType: count(commands, c => c.command.type),
      rejected: rejected.length, rejectedByCode: count(rejected, r => r.code),
      orders, repeatedOrders: sum(mine.map(c => c.repeatedOrders ?? 0)),
      researched: mine.at(-1)?.researched ?? 0, heritages: mine.at(-1)?.heritages ?? 0, resonanceCycles: mine.at(-1)?.resonance?.cycles ?? 0,
      finalPopulation: mine.at(-1)?.population ?? null, finalCities: mine.at(-1)?.cities ?? null, maxLevel: Math.max(0, ...mine.map(maxLevel)),
      firstLevelRound: { N4: levelRound(4), N5: levelRound(5), N6: levelRound(6), N7: levelRound(7) },
      prestige: mine.at(-1)?.prestige ?? 0,
      meanMood: round1(mean(mine.flatMap(c => c.moods ?? []))),
      attacksSuffered: threats.filter(t => t.event === 'THREAT_ASSAULT' && (t.audience ?? []).includes(seat)).length,
    }];
  }));
  const pair = e => (e.seats ?? []).join('~');
  return {
    session: { seats: seats.length, preset: start?.preset ?? null, worldPreset: start?.worldPreset ?? null, seed: start?.seed ?? null, rulesVersion: start?.rulesVersion ?? null, events: events.length, finalRound: last?.round ?? null, wallMs: last && events[0] ? last.t - events[0].t : null },
    end: end ? { winner: end.winner, reason: end.reason, finalRound: end.finalRound } : null,
    contact: {
      firstContactRound: first(events, e => e.type === 'contact'),
      contacts: events.filter(e => e.type === 'contact').map(e => ({ seats: pair(e), round: e.round })),
      firstTreatyRound: first(events, e => e.type === 'treaty'), firstWarRound: first(events, e => e.type === 'war'),
      treaties: count(events.filter(e => e.type === 'treaty'), e => `${e.treaty}:${e.status}`),
      firstPlayerCombatRound: playerCombats[0]?.round ?? null,
    },
    combats: {
      total: combats.length, player: playerCombats.length, world: combats.length - playerCombats.length,
      outcomes: count(combats, c => c.outcome ?? 'LEGACY'), deltaMean: round1(mean(combats.map(c => c.delta))), losses: sum(combats.map(c => c.losses)),
      signatureEffects: sum(combats.map(c => c.signatureEffects ?? 0)),
    },
    threats: { events: count(threats, t => t.event), firstAssaultRound: first(events, e => e.type === 'threat' && e.event === 'THREAT_ASSAULT'), firstSpawnRound: first(events, e => e.type === 'threat' && e.event === 'THREAT_SPAWNED') },
    eraTurns: events.filter(e => e.type === 'era_turn').length,
    research: { total: events.filter(e => e.type === 'research').length, firstRound: first(events, e => e.type === 'research') },
    rejectedTotal: events.filter(e => e.type === 'rejected').length,
    perSeat,
  };
}

export function markdown(summary, title = 'Playtest session') {
  const s = summary, lines = [`# ${title}`, ''];
  lines.push(`${s.session.seats} jogadores · preset ${s.session.preset} · mundo ${s.session.worldPreset} · seed ${s.session.seed} · regras ${s.session.rulesVersion} · ${s.session.events} eventos · rodada final ${s.session.finalRound}`);
  lines.push(s.end ? `Fim: **${s.end.reason}**, vencedor ${s.end.winner}, rodada ${s.end.finalRound}.` : 'Partida não terminou no log.', '');
  lines.push('## Contato', '', `| Marco | Rodada |`, '|---|---|', `| primeiro contato | ${s.contact.firstContactRound ?? '—'} |`, `| primeiro tratado | ${s.contact.firstTreatyRound ?? '—'} |`, `| primeira guerra | ${s.contact.firstWarRound ?? '—'} |`, `| primeiro combate entre jogadores | ${s.contact.firstPlayerCombatRound ?? '—'} |`, '');
  lines.push('## Por assento', '', '| Assento | Civ | Planejamento (mediana/máx ms) | Comandos | Rejeitados | Ordens | Repetidas | Pesquisas | Nível máx | N4/N5/N6/N7 | Pop. final | Ânimo médio | Prestígio | Ataques sofridos |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const [seat, p] of Object.entries(s.perSeat)) lines.push(`| ${seat} | ${p.civilization} | ${p.planningMs.median}/${p.planningMs.max} | ${p.commands} | ${p.rejected} | ${Object.entries(p.orders).map(([k, v]) => `${k} ${v}`).join(', ')} | ${p.repeatedOrders} | ${p.researched} | N${p.maxLevel} | ${Object.values(p.firstLevelRound).map(v => v ?? '—').join('/')} | ${p.finalPopulation} | ${p.meanMood} | ${p.prestige} | ${p.attacksSuffered} |`);
  lines.push('', '## Combates', '', `Total ${s.combats.total} (jogadores ${s.combats.player}, mundo ${s.combats.world}) · Δ médio ${s.combats.deltaMean} · baixas ${s.combats.losses} · resultados ${JSON.stringify(s.combats.outcomes)}`);
  lines.push('', '## Ameaças', '', `Primeiro surgimento r${s.threats.firstSpawnRound ?? '—'} · primeiro assalto r${s.threats.firstAssaultRound ?? '—'} · eventos ${JSON.stringify(s.threats.events)}`);
  lines.push('', `Viradas de Era: ${s.eraTurns} · pesquisas: ${s.research.total} · comandos rejeitados: ${s.rejectedTotal}`);
  return `${lines.join('\n')}\n`;
}

const flat = summary => ({
  'jogadores': summary.session.seats, 'rodada final': summary.session.finalRound, 'primeiro contato': summary.contact.firstContactRound, 'primeiro tratado': summary.contact.firstTreatyRound,
  'primeira guerra': summary.contact.firstWarRound, 'primeiro combate PvP': summary.contact.firstPlayerCombatRound, 'combates PvP': summary.combats.player, 'combates contra o mundo': summary.combats.world,
  'baixas': summary.combats.losses, 'primeiro assalto de ameaça': summary.threats.firstAssaultRound, 'Viradas de Era': summary.eraTurns, 'pesquisas': summary.research.total, 'rejeitados': summary.rejectedTotal,
  'planejamento mediano (ms)': Math.round(median(Object.values(summary.perSeat).map(p => p.planningMs.median))), 'nível máximo': Math.max(0, ...Object.values(summary.perSeat).map(p => p.maxLevel)),
  'prestígio máximo': Math.max(0, ...Object.values(summary.perSeat).map(p => p.prestige)),
});
export function compare(a, b, labels = ['A', 'B']) {
  const fa = flat(a), fb = flat(b);
  return `| Métrica | ${labels[0]} | ${labels[1]} |\n|---|---|---|\n${Object.keys(fa).map(k => `| ${k} | ${fa[k] ?? '—'} | ${fb[k] ?? '—'} |`).join('\n')}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args[0] === '--compare') {
    const [, a, b] = args, table = compare(summarize(readEvents(a)), summarize(readEvents(b)), [a.split('/').pop(), b.split('/').pop()]);
    console.log(table);
  } else if (args[0]) {
    const target = args[0], dir = existsSync(target) && statSync(target).isDirectory() ? target : target.replace(/[^/]*$/, '');
    const summary = summarize(readEvents(target));
    writeFileSync(join(dir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
    writeFileSync(join(dir, 'SUMMARY.md'), markdown(summary, `Playtest ${dir.split('/').filter(Boolean).pop()}`));
    console.log(`wrote ${join(dir, 'summary.json')} and SUMMARY.md`);
  } else console.error('usage: alpha-playtest-summary.mjs <dir|events.jsonl> | --compare <a> <b>');
}

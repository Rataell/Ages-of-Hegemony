#!/usr/bin/env node
// Aggregate Meta analysis over many MatchReportV1 files (live matches, headless simulations, converted runs).
//
//   node scripts/alpha-meta-report.mjs <dir|file>... [filters] [--json=<out.json>] [--md=<out.md>]
//
// Filters (all optional, all combine):
//   --rules=v5.1b --content=v1.2 --fingerprint=<hash>     versions. Without --fingerprint, reports with DIFFERENT economy fingerprints are never pooled: one section per fingerprint.
//   --players=4  --rounds=21 (round limit)  --world=MIXED  --map=STANDARD  --civ=valgard  --kind=humans|bots|mixed  --policy=balanced  --origin=LIVE|SIMULATION|IMPORTED_RUN
//
// Honesty rules: the sample size is always printed; the same seed + configuration (`match.configKey`) counts once, replicates are only counted; a metric is skipped for a
// report that lists the field as UNAVAILABLE; conclusions need at least MIN_GAMES independent games and MIN_CELL observations in a cell, otherwise the cell says "dados insuficientes".
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const MIN_GAMES = 30, MIN_CELL = 20;
const argv = process.argv.slice(2);
const flag = name => { const hit = argv.find(a => a.startsWith(`--${name}=`)); return hit ? hit.slice(name.length + 3) : null; };
const inputs = argv.filter(a => !a.startsWith('--'));
if (!inputs.length) { console.error('usage: alpha-meta-report.mjs <dir|file>... [--players=4] [--rounds=21] [--civ=..] [--kind=humans|bots|mixed] [--policy=..] [--fingerprint=..] [--json=out] [--md=out]'); process.exit(2); }

// ---- load ---------------------------------------------------------------------------------------------------------------------------------------------
const files = [];
const walk = path => { const full = resolve(path); if (!existsSync(full)) return; if (statSync(full).isDirectory()) for (const name of readdirSync(full).sort()) walk(join(full, name)); else if (full.endsWith('.json')) files.push(full); };
inputs.forEach(walk);
const loaded = [], rejected = [];
for (const file of files) {
  try { const data = JSON.parse(readFileSync(file, 'utf8')); if (data?.kind === 'MatchReportV1' && data.schemaVersion === 1) loaded.push(data); else rejected.push(file); } catch { rejected.push(file); }
}
const unavailable = (report, field) => report.quality.some(entry => entry.status === 'UNAVAILABLE' && (entry.field === field || field.startsWith(entry.field + '.')));

// ---- filters ------------------------------------------------------------------------------------------------------------------------------------------
const kindOf = report => { const kinds = new Set(report.seats.map(seat => seat.kind)); return kinds.size === 1 && kinds.has('BOT') ? 'bots' : kinds.size === 1 && kinds.has('HUMAN') ? 'humans' : kinds.has('UNKNOWN') ? 'unknown' : 'mixed'; };
const matches = report => {
  const m = report.match;
  return (!flag('rules') || m.version.rules === flag('rules')) && (!flag('content') || m.version.content === flag('content')) && (!flag('fingerprint') || m.economyFingerprint.startsWith(flag('fingerprint')))
    && (!flag('players') || m.players === Number(flag('players'))) && (!flag('rounds') || m.roundLimit === Number(flag('rounds'))) && (!flag('world') || m.worldPreset === flag('world')) && (!flag('map') || m.mapSize === flag('map'))
    && (!flag('civ') || report.seats.some(seat => seat.civilization === flag('civ'))) && (!flag('kind') || kindOf(report) === flag('kind'))
    && (!flag('policy') || report.seats.some(seat => (seat.policy ?? seat.botPersona) === flag('policy'))) && (!flag('origin') || report.origin === flag('origin'));
};
const selected = loaded.filter(matches);

// ---- grouping by economy: never mix fingerprints --------------------------------------------------------------------------------------------------------
const groups = new Map();
for (const report of selected) { const key = report.match.economyFingerprint; (groups.get(key) ?? groups.set(key, []).get(key)).push(report); }

// ---- statistics helpers -------------------------------------------------------------------------------------------------------------------------------
const pct = (a, b) => b ? Math.round(1000 * a / b) / 10 : null;
const fmt = v => v === null || v === undefined || Number.isNaN(v) ? '–' : String(Math.round(v * 100) / 100);
/** Wilson 95% interval for a proportion. */
const wilson = (k, n) => { if (!n) return [null, null]; const z = 1.96, p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), s = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [Math.max(0, (c - s) / d), Math.min(1, (c + s) / d)]; };
const rate = (k, n, expected = null) => {
  const [lo, hi] = wilson(k, n);
  const enough = n >= MIN_CELL;
  const dominant = enough && expected !== null && lo > expected;
  return { k, n, pct: pct(k, n), ci: lo === null ? null : [Math.round(lo * 1000) / 10, Math.round(hi * 1000) / 10], enough, flag: !enough ? 'dados insuficientes' : dominant ? 'acima do esperado (IC não inclui o esperado)' : null };
};
const median = xs => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const count = (map, key, by = 1) => map.set(key, (map.get(key) ?? 0) + by);
const top = (map, n = 10, ascending = false) => [...map].sort((a, b) => (ascending ? a[1] - b[1] : b[1] - a[1]) || String(a[0]).localeCompare(String(b[0]))).slice(0, n);

// ---- one group -------------------------------------------------------------------------------------------------------------------------------------------
function analyse(reports) {
  // Independent samples: one per configKey. Replicates are counted and reported, never added to n.
  const byConfig = new Map();
  for (const report of reports) (byConfig.get(report.match.configKey) ?? byConfig.set(report.match.configKey, []).get(report.match.configKey)).push(report);
  const independent = [...byConfig.values()].map(list => list[0]);
  const replicates = reports.length - independent.length;
  const seatRows = independent.flatMap(report => report.seats.map(seat => ({ report, seat, civ: report.civilizations.find(c => c.seat === seat.seat), eco: report.economy.perSeat.find(e => e.seat === seat.seat), act: report.actions.find(a => a.seat === seat.seat), fight: report.conflicts.perSeat.find(f => f.seat === seat.seat), won: report.result.winner === seat.seat })));
  const games = independent.length;
  const out = { games, replicates, seatSamples: seatRows.length, sufficient: games >= MIN_GAMES, warnings: [] };
  if (games < MIN_GAMES) out.warnings.push(`Amostra pequena: ${games} partidas independentes (< ${MIN_GAMES}). Nenhuma estratégia pode ser declarada dominante com estes dados.`);
  if (replicates) out.warnings.push(`${replicates} relatório(s) repetem uma seed e configuração já contadas; não entram como amostras.`);

  const winTable = labelOf => {
    const cells = new Map();
    for (const row of seatRows) { const label = labelOf(row); if (label === null || label === undefined) continue; const cell = cells.get(label) ?? { k: 0, n: 0, expected: [] }; cell.n++; cell.k += row.won ? 1 : 0; cell.expected.push(1 / row.report.match.players); cells.set(label, cell); }
    return [...cells].map(([label, c]) => ({ label, ...rate(c.k, c.n, c.expected.reduce((a, b) => a + b, 0) / c.expected.length) })).sort((a, b) => b.n - a.n || String(a.label).localeCompare(String(b.label)));
  };
  out.winByCivilization = winTable(row => row.seat.civilization);
  out.winByGovernment = winTable(row => row.civ?.government ?? null);
  out.winByFigure = winTable(row => row.seat.leader);
  out.winByKind = winTable(row => row.seat.kind);

  const advances = new Map(), positions = new Map();
  let seatsWithResearch = 0;
  for (const row of seatRows) { if (!row.civ || unavailable(row.report, 'civilizations.research.order') || !row.civ.research.order.length) continue; seatsWithResearch++; row.civ.research.order.forEach((id, index) => { count(advances, id); (positions.get(id) ?? positions.set(id, []).get(id)).push(index + 1); }); }
  out.advances = { seats: seatsWithResearch, most: top(advances, 12).map(([id, n]) => ({ id, n, pct: pct(n, seatsWithResearch), medianPosition: median(positions.get(id)) })), least: top(advances, 12, true).map(([id, n]) => ({ id, n, pct: pct(n, seatsWithResearch) })) };
  out.acquisitionOrder = top(advances, 15).map(([id]) => ({ id, medianPosition: median(positions.get(id)) })).sort((a, b) => a.medianPosition - b.medianPosition);

  const buildings = new Map(), districts = new Map();
  for (const row of seatRows) { if (!row.civ) continue; if (!unavailable(row.report, 'civilizations.buildings')) for (const [id, n] of Object.entries(row.civ.buildings)) count(buildings, id, n); if (!unavailable(row.report, 'civilizations.districts')) for (const [id, n] of Object.entries(row.civ.districts)) count(districts, id, n); }
  out.buildings = top(buildings, 15); out.districts = top(districts, 10);

  // Urban level reached by Era: share of seats whose first city of level L appeared in Era E or earlier.
  const levelByEra = {};
  for (let level = 4; level <= 7; level++) {
    const byEra = {};
    for (const row of seatRows) { if (!row.civ || unavailable(row.report, 'civilizations.cities.firstRoundAtLevel')) continue; const round = row.civ.cities.firstRoundAtLevel[level - 1]; const era = round === null ? null : Math.ceil(round / row.report.match.roundsPerEra); for (let e = 1; e <= 7; e++) { byEra[e] ??= { k: 0, n: 0 }; byEra[e].n++; if (era !== null && era <= e) byEra[e].k++; } }
    levelByEra[`N${level}`] = Object.fromEntries(Object.entries(byEra).map(([era, c]) => [era, pct(c.k, c.n)]));
  }
  out.levelByEra = levelByEra;

  const scarcity = {};
  for (const resource of ['food', 'wood', 'stone', 'metal', 'wealth', 'knowledge', 'influence', 'culture']) {
    let empty = 0, capped = 0, rounds = 0;
    for (const row of seatRows) { if (!row.eco || unavailable(row.report, 'economy.stock')) continue; const n = row.eco.stock[resource]?.length ?? 0; rounds += n; empty += row.eco.emptyRounds[resource] ?? 0; capped += row.eco.atCapRounds[resource] ?? 0; }
    scarcity[resource] = { seatRounds: rounds, emptyPct: pct(empty, rounds), atCapPct: pct(capped, rounds) };
  }
  out.scarcity = scarcity;
  const withEco = seatRows.filter(row => row.eco);
  out.hunger = rate(withEco.filter(row => row.eco.shortage.foodRounds > 0).length, withEco.length);
  out.revolt = rate(withEco.filter(row => row.eco.mood.revoltRounds > 0).length, withEco.length);
  out.revoltRoundsShare = pct(withEco.reduce((n, row) => n + row.eco.mood.revoltRounds, 0), withEco.reduce((n, row) => n + row.eco.mood.min.length, 0));

  const orders = new Map();
  let committed = 0, available = 0;
  for (const row of seatRows) { if (!row.act || unavailable(row.report, 'actions')) continue; committed += row.act.ordersCommitted; available += row.act.ordersAvailable; for (const [category, n] of Object.entries(row.act.ordersByCategory)) count(orders, category, n); }
  out.orders = { committed, available, unusedPct: available ? pct(Math.max(0, available - committed), available) : null, byCategory: top(orders, 10).map(([category, n]) => ({ category, n, pct: pct(n, committed) })) };

  const fights = seatRows.filter(row => row.fight);
  const attacks = fights.reduce((n, row) => n + row.fight.attacks, 0), attackWins = fights.reduce((n, row) => n + row.fight.attackWins, 0);
  out.conflicts = {
    pvpBattlesPerGame: games ? Math.round(10 * independent.reduce((n, r) => n + r.conflicts.battles.pvp, 0) / games) / 10 : null,
    threatAssaultsPerGame: games ? Math.round(10 * independent.reduce((n, r) => n + r.conflicts.battles.byThreats, 0) / games) / 10 : null,
    playerAttacksOnThreatsPerGame: games ? Math.round(10 * independent.reduce((n, r) => n + r.conflicts.battles.againstThreats, 0) / games) / 10 : null,
    attackWin: rate(attackWins, attacks), warsDeclaredPerGame: games ? Math.round(10 * independent.reduce((n, r) => n + r.conflicts.warsDeclared, 0) / games) / 10 : null,
  };

  const reasons = new Map(), paths = new Map();
  for (const report of independent) { count(reasons, report.match.endReason); for (const entry of report.result.hegemony) if (entry.declaredPath) count(paths, entry.declaredPath); }
  out.victory = { endReasons: top(reasons).map(([reason, n]) => ({ reason, n, pct: pct(n, games) })), hegemonyPathsDeclared: top(paths) };

  const works = seatRows.filter(row => row.civ && !unavailable(row.report, 'civilizations.legacyWorks'));
  const started = works.filter(row => row.civ.legacyWorks.length > 0), done = works.filter(row => row.civ.legacyWorks.some(w => w.completedRound !== null));
  out.legacyWorks = { seats: works.length, startedPct: pct(started.length, works.length), completedPct: pct(done.length, works.length), medianStartRound: median(started.flatMap(row => row.civ.legacyWorks.map(w => w.startedRound))), note: works.length < MIN_CELL ? 'dados insuficientes' : null };
  return out;
}

// ---- markdown ----------------------------------------------------------------------------------------------------------------------------------------
const cell = v => typeof v === 'number' ? fmt(v) : v === null || v === undefined ? '–' : String(v);
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.map(cell).join(' | ')} |`)].join('\n');
const rateRows = list => list.map(r => [r.label, r.n, r.k, r.pct === null ? '–' : `${r.pct}%`, r.ci ? `${r.ci[0]}–${r.ci[1]}%` : '–', r.flag ?? '']);
function markdown(result) {
  const lines = ['# Meta do Ages of Hegemony — análise agregada', '', `Relatórios lidos: ${loaded.length}${rejected.length ? ` (${rejected.length} arquivo(s) ignorado(s): não são MatchReportV1)` : ''}; após filtros: ${selected.length}; grupos de economia distintos: ${result.length}.`];
  const active = ['rules', 'content', 'fingerprint', 'players', 'rounds', 'world', 'map', 'civ', 'kind', 'policy', 'origin'].filter(flag).map(name => `${name}=${flag(name)}`);
  lines.push(`Filtros: ${active.length ? active.join(', ') : 'nenhum'}.`, '', `Regra de leitura: relatórios com **fingerprints de economia diferentes nunca são somados**; cada grupo abaixo é uma economia. Partidas com a mesma seed e configuração contam uma vez. Uma célula precisa de pelo menos ${MIN_CELL} observações e o grupo de ${MIN_GAMES} partidas independentes para sustentar conclusões.`, '');
  for (const { fingerprint, sample, analysis: a } of result) {
    lines.push(`## Economia ${fingerprint}`, '', `Partidas independentes: **${a.games}** (${a.replicates} repetição(ões) ignorada(s)); assentos analisados: ${a.seatSamples}. Origem(ns): ${[...new Set(sample.map(r => r.origin))].join(', ')}. Versões: ${[...new Set(sample.map(r => `${r.match.version.content ?? '?'}/${r.match.version.rules}`))].join(', ')}.`);
    for (const w of a.warnings) lines.push('', `> ⚠ ${w}`);
    lines.push('', '### Vitórias', '', 'Por civilização:', table(['civilização', 'n', 'vitórias', 'taxa', 'IC 95%', 'nota'], rateRows(a.winByCivilization)), '', 'Por Governo (final):', table(['governo', 'n', 'vitórias', 'taxa', 'IC 95%', 'nota'], rateRows(a.winByGovernment)), '', 'Por Figura:', table(['Figura', 'n', 'vitórias', 'taxa', 'IC 95%', 'nota'], rateRows(a.winByFigure)), '', 'Humanos × bots:', table(['tipo', 'n', 'vitórias', 'taxa', 'IC 95%', 'nota'], rateRows(a.winByKind)));
    lines.push('', '### Condições de vitória', '', table(['encerramento', 'n', '%'], a.victory.endReasons.map(r => [r.reason, r.n, `${r.pct}%`])), '', `Hegemonias declaradas: ${a.victory.hegemonyPathsDeclared.map(([p, n]) => `${p} ${n}`).join(', ') || 'nenhuma'}.`);
    lines.push('', '### Avanços', '', a.advances.seats ? `Assentos com ordem de pesquisa: ${a.advances.seats}.` : 'Ordem de pesquisa indisponível nesta amostra.');
    if (a.advances.seats) lines.push('', 'Mais pesquisados:', table(['avanço', 'assentos', '%', 'posição mediana'], a.advances.most.map(r => [r.id, r.n, `${r.pct}%`, r.medianPosition])), '', 'Menos pesquisados (entre os que apareceram):', table(['avanço', 'assentos', '%'], a.advances.least.map(r => [r.id, r.n, `${r.pct}%`])), '', 'Ordem típica de aquisição (mediana):', table(['avanço', 'posição'], a.acquisitionOrder.map(r => [r.id, r.medianPosition])));
    lines.push('', '### Cidades e construção', '', 'Edifícios mais construídos:', a.buildings.length ? table(['edifício', 'total'], a.buildings) : '_indisponível_', '', 'Distritos:', a.districts.length ? table(['distrito', 'total'], a.districts) : '_indisponível_', '', 'Assentos que alcançaram cada nível até a Era indicada (%):', table(['nível', ...[1, 2, 3, 4, 5, 6, 7].map(e => `Era ${e}`)], Object.entries(a.levelByEra).map(([level, byEra]) => [level, ...[1, 2, 3, 4, 5, 6, 7].map(e => byEra[e] ?? null)])));
    lines.push('', '### Economia', '', table(['recurso', 'rodadas-assento', 'vazio %', 'no limite %'], Object.entries(a.scarcity).map(([r, s]) => [r, s.seatRounds, s.emptyPct, s.atCapPct])), '', `Assentos com ao menos uma rodada de fome: ${a.hunger.k}/${a.hunger.n} (${a.hunger.pct ?? '–'}%). Com ao menos uma rodada de Revolta: ${a.revolt.k}/${a.revolt.n} (${a.revolt.pct ?? '–'}%); rodadas-assento em Revolta: ${a.revoltRoundsShare ?? '–'}%.`);
    lines.push('', '### Ordens', '', `Comprometidas ${a.orders.committed} de ${a.orders.available} disponíveis; não usadas ${a.orders.unusedPct ?? '–'}%.`, '', a.orders.byCategory.length ? table(['categoria', 'n', '%'], a.orders.byCategory.map(r => [r.category, r.n, `${r.pct}%`])) : '_indisponível_');
    lines.push('', '### Conflitos', '', `Batalhas entre jogadores por partida: ${fmt(a.conflicts.pvpBattlesPerGame)}; assaltos de Ameaças por partida: ${fmt(a.conflicts.threatAssaultsPerGame)}; ataques de jogadores a Ameaças por partida: ${fmt(a.conflicts.playerAttacksOnThreatsPerGame)}; guerras declaradas por partida: ${fmt(a.conflicts.warsDeclaredPerGame)}. Taxa de vitória de quem ataca: ${a.conflicts.attackWin.k}/${a.conflicts.attackWin.n} (${a.conflicts.attackWin.pct ?? '–'}%${a.conflicts.attackWin.flag ? `, ${a.conflicts.attackWin.flag}` : ''}).`);
    lines.push('', '### Obras de Legado', '', a.legacyWorks.seats ? `Assentos: ${a.legacyWorks.seats}; iniciaram ao menos uma: ${a.legacyWorks.startedPct}%; concluíram: ${a.legacyWorks.completedPct}%; rodada mediana do início: ${fmt(a.legacyWorks.medianStartRound)}.${a.legacyWorks.note ? ` (${a.legacyWorks.note})` : ''}` : '_indisponível nesta amostra_', '');
  }
  return lines.join('\n') + '\n';
}

const result = [...groups].map(([fingerprint, sample]) => ({ fingerprint, sample, analysis: analyse(sample) }));
const md = markdown(result);
if (flag('md')) writeFileSync(resolve(flag('md')), md); else console.log(md);
if (flag('json')) writeFileSync(resolve(flag('json')), JSON.stringify(result.map(({ fingerprint, analysis }) => ({ fingerprint, ...analysis })), null, 1));

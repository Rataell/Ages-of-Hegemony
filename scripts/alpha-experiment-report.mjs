// Aggregates experiment runs written by alpha-experiment-runner.mjs into markdown tables.
//   node scripts/alpha-experiment-report.mjs r1                 -> A-peace vs B-world-current vs C-r1-world, per profile (21/35/49)
//   node scripts/alpha-experiment-report.mjs e2 [profile]       -> Control 0 / Control 1 (M1) / Candidate A / Candidate B, 4 and 6 players
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'docs/evidence/v12-audit');
const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
const f1 = v => Number.isNaN(v) ? '–' : (Math.round(v * 10) / 10).toString();
const f2 = v => Number.isNaN(v) ? '–' : (Math.round(v * 100) / 100).toString();
const load = dir => existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'summary.json').sort().map(f => ({ f, x: JSON.parse(readFileSync(join(dir, f), 'utf8')) })) : [];

const lvl = (final, n) => mean(final.map(r => (r.levels ?? []).filter(l => l === n).length));
/** One match -> the figures of the study. `rows` are per seat and round. */
function figures(run) {
  const { rows, threats: t, meta } = run, last = meta.roundLimit, final = rows.filter(r => r.round === last);
  const seatRounds = rows.length, seats = new Set(rows.map(r => r.seat)).size;
  const revoltRounds = rows.filter(r => (r.mood ?? []).some(m => m <= 1));
  // Recovery: length of each run of consecutive rounds a seat had a city in Revolta (shorter = the civilization recovers faster).
  const episodes = []; for (const seat of new Set(rows.map(r => r.seat))) { let len = 0; for (const r of rows.filter(x => x.seat === seat).sort((a, b) => a.round - b.round)) { if ((r.mood ?? []).some(m => m <= 1)) len++; else if (len) { episodes.push(len); len = 0; } } if (len) episodes.push(len); }
  const cities = mean(final.map(r => r.cities));
  const moods = rows.flatMap(r => r.mood ?? []);
  return {
    seats, assaults: t?.assaults ?? NaN, assaultsPerCity: t ? t.assaults / Math.max(1, cities * seats) : NaN, worldWinsOnCities: t?.worldWinsOnCities ?? NaN,
    revoltPct: 100 * revoltRounds.length / seatRounds, meanMood: mean(moods), lowMoodPct: 100 * moods.filter(m => m <= 1).length / Math.max(1, moods.length), recovery: mean(episodes), episodes: episodes.length,
    hungerPct: 100 * rows.filter(r => r.famine > 0 || r.upkeepShortage > 0).length / seatRounds,
    pop: mean(final.map(r => r.pop)), cities, level: mean(final.map(r => Math.max(0, ...(r.levels ?? [0])))), research: mean(final.map(r => Array.isArray(r.research) ? r.research.length : r.research ?? 0)),
    built: mean(final.map(r => (r.districts ?? 0) + (r.buildings ?? 0))), pieces: mean(final.map(r => r.land ?? 0)),
    food: mean(rows.map(r => r.openStock?.food ?? 0)), wood: mean(rows.map(r => r.openStock?.wood ?? 0)), wealth: mean(rows.map(r => r.openStock?.wealth ?? 0)), knowledge: mean(rows.map(r => r.openStock?.knowledge ?? 0)),
    consumption: mean(rows.map(r => (r.sustenance?.food ?? 0) + (r.military?.food ?? 0))), works: mean((run.endgame ?? []).map(e => e.works)), hegemonyMet: mean((run.endgame ?? []).map(e => e.hegemonyMet)), prestige: mean((run.endgame ?? []).map(e => e.prestige)),
    // phase 3: city levels, culture, Ordens, armies, buildings and where the Prestígio came from
    n1: lvl(final, 1), n2: lvl(final, 2), n3: lvl(final, 3), n4: lvl(final, 4), n5: lvl(final, 5), n6: lvl(final, 6), n7: lvl(final, 7),
    culture: mean(rows.map(r => r.openStock?.culture ?? 0)), ordersLimit: mean(rows.map(r => r.ordersLimit ?? 0)), ordersUsed: mean(rows.map(r => r.ordersUsed ?? 0)),
    ordersWastedPct: 100 * (1 - rows.reduce((n, r) => n + (r.ordersUsed ?? 0), 0) / Math.max(1, rows.reduce((n, r) => n + (r.ordersLimit ?? 0), 0))),
    districts: mean(final.map(r => r.districts ?? 0)), buildings: mean(final.map(r => r.buildings ?? 0)), ships: mean(final.map(r => r.ships ?? 0)), territory: mean(final.map(r => r.territory ?? 0)),
    pMilestones: mean((run.endgame ?? []).map(e => e.prestigeBy?.milestones ?? NaN)), pAmbitions: mean((run.endgame ?? []).map(e => e.prestigeBy?.ambitions ?? NaN)), pWorks: mean((run.endgame ?? []).map(e => e.prestigeBy?.works ?? NaN)),
    pExplored: mean((run.endgame ?? []).map(e => e.prestigeBy?.explored ?? NaN)), pOther: mean((run.endgame ?? []).map(e => e.prestigeBy?.other ?? NaN)), ambitionsDone: mean((run.endgame ?? []).map(e => e.ambitionsDone ?? NaN)),
    killed: t?.telemetry?.kills ?? NaN, playerAttacks: t?.playerAttacksOnThreats ?? NaN, campsAlive: t?.campsAliveAtEnd ?? NaN, confrontations: (t?.assaults ?? 0) + (t?.playerAttacksOnThreats ?? 0),
  };
}
const avg = (list, key) => mean(list.map(l => l[key]));

const which = process.argv[2];
if (which === 'r1') {
  const conditions = [['A', 'A-peace', 'sem Ameaças'], ['B', 'B-world-current', 'Ameaças atuais'], ['C', 'C-r1-world', 'com R1']];
  const out = ['| perfil | condição | n | assaltos/partida | assaltos/cidade | vitórias do mundo em cidades | Revolta % | Ânimo baixo % | recuperação (rodadas) | fome/peças % | população | cidades | nível máx. | Alimento (abertura) | Acampamentos mortos | ataques do jogador | confrontos/partida |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
  const table = {};
  for (const profile of [21, 35, 49]) for (const [id, dir, label] of conditions) {
    const runs = load(join(BASE, 'r1', dir)).filter(r => r.x.meta.profile === profile).map(r => figures(r.x));
    table[`${profile}-${id}`] = runs.length ? Object.fromEntries(Object.keys(runs[0]).map(k => [k, avg(runs, k)])) : null;
    if (!runs.length) continue;
    out.push(`| ${profile} | ${id} · ${label} | ${runs.length} | ${f1(avg(runs, 'assaults'))} | ${f2(avg(runs, 'assaultsPerCity'))} | ${f1(avg(runs, 'worldWinsOnCities'))} | ${f1(avg(runs, 'revoltPct'))} | ${f1(avg(runs, 'lowMoodPct'))} | ${f1(avg(runs, 'recovery'))} | ${f1(avg(runs, 'hungerPct'))} | ${f1(avg(runs, 'pop'))} | ${f1(avg(runs, 'cities'))} | ${f1(avg(runs, 'level'))} | ${f1(avg(runs, 'food'))} | ${f1(avg(runs, 'killed'))} | ${f1(avg(runs, 'playerAttacks'))} | ${f1(avg(runs, 'confrontations'))} |`);
  }
  writeFileSync(join(BASE, 'r1/summary.md'), out.join('\n') + '\n'); writeFileSync(join(BASE, 'r1/summary.json'), JSON.stringify(table, null, 1));
  console.log(out.join('\n'));
}
if (which === 'e2' || which === 'e2em') {
  const suite = which, profile = Number(process.argv[3] ?? 21);   // e2: policies as in the audit; e2em: the same policies using the emergency recovery (AOH_POLICY_EMERGENCY=1)
  const names = [['base', 'Controle 0 · baseline atual (RC4 + correções + R1)'], ['starthamlet', 'Controle 1 · M1'], ['candA', 'Candidato A · M1+M4(15%)'], ['candB', 'Candidato B · M1+M2b']];
  const cols = ['pop', 'cities', 'level', 'built', 'research', 'pieces', 'hungerPct', 'revoltPct', 'meanMood', 'consumption', 'food', 'wood', 'wealth', 'knowledge', 'works', 'hegemonyMet', 'prestige', 'assaults', 'confrontations'];
  const out = [`| perfil | jogadores | modelo | n | ${['população', 'cidades', 'nível máx.', 'distritos+edif.', 'avanços', 'peças', 'fome/peças %', 'Revolta %', 'Ânimo médio', 'consumo Alimento/rodada', 'Alimento', 'Madeira', 'Riqueza', 'Conhecimento', 'Obras de Legado', 'Hegemonia (req. cumpridos)', 'Prestígio', 'assaltos', 'confrontos'].join(' | ')} |`, `|---|---|---|---|${cols.map(() => '---').join('|')}|`];
  const table = {};
  for (const players of [4, 6]) for (const [variant, label] of names) {
    const runs = load(join(BASE, suite, `${profile}-${variant}`)).filter(r => r.x.meta.players === players).map(r => figures(r.x));
    if (!runs.length) continue;
    table[`${players}-${variant}`] = Object.fromEntries(cols.map(k => [k, avg(runs, k)]));
    out.push(`| ${profile} | ${players} | ${label} | ${runs.length} | ${cols.map(k => f1(avg(runs, k))).join(' | ')} |`);
  }
  // Paired deltas: the same policy, players and seed under each variant against Controle 0 (the seeds are shared, so a delta is a pair, not two unrelated means).
  const pairedKeys = ['pop', 'level', 'built', 'research', 'hungerPct', 'revoltPct', 'meanMood', 'consumption', 'works', 'hegemonyMet', 'prestige', 'assaults'];
  const keyOf = r => `${r.x.meta.policy}|${r.x.meta.players}|${r.x.meta.seed}`;
  const baseRuns = new Map(load(join(BASE, suite, `${profile}-base`)).map(r => [keyOf(r), figures(r.x)]));
  out.push('', `Δ pareado contra o Controle 0 (média da diferença; entre parênteses, em quantos pares a variante ficou acima): ${pairedKeys.join(' · ')}`, '', `| jogadores | modelo | pares | ${pairedKeys.join(' | ')} |`, `|---|---|---|${pairedKeys.map(() => '---').join('|')}|`);
  for (const players of [4, 6]) for (const [variant, label] of names.slice(1)) {
    const pairs = load(join(BASE, suite, `${profile}-${variant}`)).filter(r => r.x.meta.players === players && baseRuns.has(keyOf(r))).map(r => ({ v: figures(r.x), b: baseRuns.get(keyOf(r)) }));
    if (!pairs.length) continue;
    out.push(`| ${players} | ${label} | ${pairs.length} | ${pairedKeys.map(k => { const d = pairs.map(p => p.v[k] - p.b[k]).filter(x => !Number.isNaN(x)); return d.length ? `${d.reduce((a, c) => a + c, 0) / d.length >= 0 ? '+' : ''}${f2(mean(d))} (${d.filter(x => x > 0).length}/${d.length})` : '–'; }).join(' | ')} |`);
  }
  writeFileSync(join(BASE, `${suite}/summary-${profile}.md`), out.join('\n') + '\n'); writeFileSync(join(BASE, `${suite}/summary-${profile}.json`), JSON.stringify(table, null, 1));
  console.log(out.join('\n'));
}

if (which === 'digest') {
  // Compact per-run figures of every suite, small enough to commit (the raw runs are 60+ MB and are regenerated by alpha-experiment-runner.mjs).
  for (const suite of ['r1', 'e2', 'e2em']) {
    const rows = [];
    for (const dir of existsSync(join(BASE, suite)) ? readdirSync(join(BASE, suite), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name) : []) {
      for (const r of load(join(BASE, suite, dir))) rows.push({ label: dir, file: r.f.replace('.json', ''), policy: r.x.meta.policy, profile: r.x.meta.profile, players: r.x.meta.players, seed: r.x.meta.seed, mode: r.x.meta.mode, variant: r.x.meta.variant, finalRound: r.x.meta.finalRound, status: r.x.meta.status, ...figures(r.x), threats: r.x.threats ?? null });
    }
    if (rows.length) { writeFileSync(join(BASE, suite, 'digest.json'), JSON.stringify(rows)); console.log(suite, rows.length, 'runs'); }
  }
}

if (which === 'e3') {
  // Phase 3 comparison: Controle 0 (base), Controle 1 (M1 = starthamlet) and Candidato A (candA), threats on (R1), emergency recovery in the policies.
  const profile = Number(process.argv[3] ?? 21), players = Number(process.argv[4] ?? 4), suite = process.argv[5] ?? 'e3';
  const names = [['base', 'Controle 0 · baseline'], ['starthamlet', 'Controle 1 · M1'], ['candA', 'Candidato A · M1+M4 15%']];
  const dirOf = v => join(BASE, suite, `${profile}p${players}-${v}`);
  const cols = [['pop', 'população'], ['cities', 'cidades'], ['level', 'nível máx.'], ['n3', 'N3'], ['n4', 'N4'], ['n5', 'N5'], ['n6', 'N6'], ['n7', 'N7'], ['districts', 'distritos'], ['buildings', 'edifícios'], ['research', 'avanços'],
    ['knowledge', 'Conhecimento'], ['culture', 'Cultura'], ['prestige', 'Prestígio'], ['hungerPct', 'fome %'], ['revoltPct', 'Revolta %'], ['meanMood', 'Ânimo'], ['pieces', 'exércitos'], ['ships', 'navios'], ['works', 'Obras'], ['hegemonyMet', 'Hegemonia (req.)'], ['ordersLimit', 'Ordens disp.'], ['ordersWastedPct', 'Ordens não usadas %'], ['assaults', 'assaltos']];
  const out = [`| modelo | n | ${cols.map(c => c[1]).join(' | ')} |`, `|---|---|${cols.map(() => '---').join('|')}|`];
  const table = {}, runsBy = {};
  for (const [variant, label] of names) {
    const loaded = load(dirOf(variant)); if (!loaded.length) continue;
    runsBy[variant] = new Map(loaded.map(r => [`${r.x.meta.policy}|${r.x.meta.seed}`, figures(r.x)]));
    const runs = [...runsBy[variant].values()];
    table[variant] = Object.fromEntries(cols.map(([k]) => [k, avg(runs, k)]));
    out.push(`| ${label} | ${runs.length} | ${cols.map(([k]) => f1(avg(runs, k))).join(' | ')} |`);
  }
  const deltaRow = (variant, label, keys) => {
    const base = runsBy.base, cur = runsBy[variant]; if (!base || !cur) return null;
    const pairs = [...cur.keys()].filter(k => base.has(k)).map(k => ({ v: cur.get(k), b: base.get(k) }));
    return `| ${label} | ${pairs.length} | ${keys.map(([k]) => { const d = pairs.map(p => p.v[k] - p.b[k]).filter(x => !Number.isNaN(x)); return d.length ? `${mean(d) >= 0 ? '+' : ''}${f2(mean(d))} (${d.filter(x => x > 0).length}↑ ${d.filter(x => x < 0).length}↓/${d.length})` : '–'; }).join(' | ')} |`;
  };
  out.push('', 'Δ pareado contra o Controle 0 (mesma política e mesma seed; entre parênteses, pares acima ↑ e abaixo ↓):', '', `| modelo | pares | ${cols.map(c => c[1]).join(' | ')} |`, `|---|---|${cols.map(() => '---').join('|')}|`);
  for (const [variant, label] of names.slice(1)) { const row = deltaRow(variant, label, cols); if (row) out.push(row); }
  // Where the Prestígio comes from (per seat, mean).
  const pcols = [['prestige', 'Prestígio'], ['pMilestones', 'Marcos ★'], ['pAmbitions', 'Ambições'], ['pWorks', 'Obras'], ['pExplored', 'Regiões'], ['pOther', 'outras (cartas, Ressonância, Ameaças)'], ['ambitionsDone', 'Ambições concluídas']];
  out.push('', 'Origem do Prestígio por civilização (média) e diferença pareada:', '', `| modelo | n | ${pcols.map(c => c[1]).join(' | ')} |`, `|---|---|${pcols.map(() => '---').join('|')}|`);
  for (const [variant, label] of names) if (runsBy[variant]) out.push(`| ${label} | ${runsBy[variant].size} | ${pcols.map(([k]) => f2(avg([...runsBy[variant].values()], k))).join(' | ')} |`);
  for (const [variant, label] of names.slice(1)) { const row = deltaRow(variant, `Δ ${label}`, pcols); if (row) out.push(row); }
  const file = join(BASE, suite, `summary-${profile}p${players}.md`);
  writeFileSync(file, out.join('\n') + '\n'); writeFileSync(file.replace('.md', '.json'), JSON.stringify(table, null, 1));
  console.log(out.join('\n'));
}

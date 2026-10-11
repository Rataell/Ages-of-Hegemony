// Comparative models for the 21-round profile (Alpha V1.2, decision E-2). MEASUREMENT ONLY: scenario edits of the initial state, never applied to the engine.
// Usage: node scripts/alpha-economy-models.mjs run     (sequential single matches; resumable)   |   node scripts/alpha-economy-models.mjs report
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs/evidence/v12-audit/models');
const BASE = join(ROOT, 'docs/evidence/v12-audit/lane-a1/runs');
const POLICIES = ['balanced', 'growth', 'research'];
const MODELS = { starthamlet: 'M1 condições iniciais (capital Povoado N2, 4 hab., Agricultura)', sprint: 'M4 sprint (25% menos habitantes para Elevar)' };
// Cells: the 21-round profile gets p2 s1/s2 and p4 s1; 35 and 49 get p2 s1/s2 (the heavier matches).
const cells = profile => profile === 21 ? [[2, 1], [2, 2], [4, 1]] : [[2, 1], [2, 2]];
const jobs = [];
for (const profile of [21, 35, 49]) for (const variant of Object.keys(MODELS)) for (const policy of POLICIES) for (const [players, seed] of cells(profile)) jobs.push({ profile, variant, policy, players, seed });
const fileOf = j => join(OUT, 'runs', `${j.variant}-${j.policy}-${j.profile}-p${j.players}-s${j.seed}.json`);

if (process.argv[2] === 'run') {
  mkdirSync(join(OUT, 'runs'), { recursive: true });
  let n = 0;
  for (const j of jobs) {
    n++;
    if (existsSync(fileOf(j))) continue;
    const r = spawnSync(process.execPath, [join(ROOT, 'scripts/alpha-economy-policies.mjs'), '--single', `--policy=${j.policy}`, `--profile=${j.profile}`, `--players=${j.players}`, `--seed=${j.seed}`, `--variant=${j.variant}`, `--out=${OUT}`, `--out-file=${fileOf(j)}`], { cwd: ROOT, encoding: 'utf8' });
    console.log(`[${n}/${jobs.length}] ${j.variant} ${j.policy} ${j.profile}r p${j.players} s${j.seed}: ${(r.stdout || r.stderr).trim().split('\n').slice(-1)[0].slice(0, 120)}`);
  }
}

if (process.argv[2] === 'report') {
  const read = f => existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
  const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
  const f1 = v => Number.isNaN(v) ? '–' : (Math.round(v * 10) / 10).toString();
  // One run → per-seat figures at the end of the match.
  const summarize = run => {
    const last = run.meta.roundLimit, rows = run.rows.filter(r => r.round === last);
    const all = run.rows;
    return {
      level: mean(rows.map(r => Math.max(0, ...(r.levels ?? [0])))), cities: mean(rows.map(r => r.cities)), pop: mean(rows.map(r => r.pop)), research: mean(rows.map(r => Array.isArray(r.research) ? r.research.length : r.research ?? 0)),
      built: mean(rows.map(r => (r.districts ?? 0) + (r.buildings ?? 0))), pieces: mean(rows.map(r => r.land ?? 0)),
      hunger: 100 * all.filter(r => r.famine > 0 || r.upkeepShortage > 0).length / all.length, revolt: 100 * all.filter(r => (r.mood ?? []).some(m => m <= 1)).length / all.length,
      discardFood: mean(all.map(r => r.discard?.food ?? 0)),
    };
  };
  const group = (profile, variant) => {
    const runs = [];
    for (const policy of POLICIES) for (const [players, seed] of cells(profile).filter(([p, s]) => profile === 21 ? true : p === 2 && s <= 2)) {
      const f = variant === 'base' ? join(BASE, `${policy}-${profile}-p${players}-s${seed}.json`) : fileOf({ profile, variant, policy, players, seed });
      const run = read(f); if (run) runs.push(summarize(run));
    }
    const keys = ['level', 'cities', 'pop', 'research', 'built', 'pieces', 'hunger', 'revolt', 'discardFood'];
    return { n: runs.length, ...Object.fromEntries(keys.map(k => [k, mean(runs.map(r => r[k]))])) };
  };
  const lines = ['| perfil | modelo | n | nível máx. | cidades | pop. | avanços | distritos+edif. | peças | fome/peças % | Revolta % | Alimento descartado/rodada |', '|---|---|---|---|---|---|---|---|---|---|---|---|'];
  const out = {};
  for (const profile of [21, 35, 49]) for (const variant of ['base', ...Object.keys(MODELS)]) {
    const g = group(profile, variant); out[`${profile}-${variant}`] = g;
    lines.push(`| ${profile} | ${variant === 'base' ? 'RC4 (base)' : MODELS[variant]} | ${g.n} | ${f1(g.level)} | ${f1(g.cities)} | ${f1(g.pop)} | ${f1(g.research)} | ${f1(g.built)} | ${f1(g.pieces)} | ${f1(g.hunger)} | ${f1(g.revolt)} | ${f1(g.discardFood)} |`);
  }
  writeFileSync(join(OUT, 'summary.json'), JSON.stringify(out, null, 1));
  writeFileSync(join(OUT, 'summary.md'), lines.join('\n') + '\n');
  console.log(lines.join('\n'));
}

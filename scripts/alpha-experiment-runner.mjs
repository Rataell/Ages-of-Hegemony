// Sequential experiment runner for the V1.2 comparisons (R1 Saqueadores, E-2 candidates). One match at a time, `nice`d by the caller, resumable.
//   node scripts/alpha-experiment-runner.mjs run --root=<repo with built dist> --label=pre-world --mode=world|peace [--variant=base] [--policies=balanced,military]
//        [--profiles=21,35,49] [--players=4] [--seeds=1,2]        -> docs/evidence/v12-audit/<suite>/<label>/*.json
//   node scripts/alpha-experiment-runner.mjs list <suite>        (shows the runs written)
// The runner of the matches is <root>/scripts/alpha-economy-policies.mjs, so a frozen copy of an older build can be measured while the working tree changes.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, fallback) => { const hit = process.argv.slice(3).find(a => a.startsWith(`--${name}=`)); return hit ? hit.slice(name.length + 3) : fallback; };
const list = (name, fallback) => arg(name, fallback).split(',').filter(Boolean);
if (process.argv[2] === 'run') {
  const root = resolve(arg('root', HERE)), label = arg('label', 'run'), suite = arg('suite', 'r1'), mode = arg('mode', 'world'), variant = arg('variant', 'base');
  const out = join(HERE, 'docs/evidence/v12-audit', suite, label);
  mkdirSync(out, { recursive: true });
  const jobs = [];
  for (const profile of list('profiles', '21,35,49').map(Number)) for (const policy of list('policies', 'balanced,military')) for (const players of list('players', '4').map(Number)) for (const seed of list('seeds', '1,2').map(Number)) jobs.push({ profile, policy, players, seed });
  let n = 0;
  for (const job of jobs) {
    n++;
    const file = join(out, `${job.policy}-${job.profile}-p${job.players}-s${job.seed}.json`);
    if (existsSync(file)) continue;
    const args = [join(root, 'scripts/alpha-economy-policies.mjs'), '--single', `--policy=${job.policy}`, `--profile=${job.profile}`, `--players=${job.players}`, `--seed=${job.seed}`, `--variant=${variant}`, `--out=${out}`, `--out-file=${file}`, ...(mode === 'world' ? ['--world'] : [])];
    const r = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
    console.log(`[${n}/${jobs.length}] ${label} ${job.policy} ${job.profile}r p${job.players} s${job.seed}: ${(r.stdout || r.stderr).trim().split('\n').slice(-1)[0].slice(0, 110)}`);
  }
  console.log('DONE', label);
}

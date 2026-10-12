#!/usr/bin/env node
// Converts recorded simulation runs (no re-simulation) into MatchReportV1 files.
//   node scripts/alpha-reports-from-runs.mjs <run-dir|file>... --out=<dir> [--tag=emergency] [--engine=post-p3]
// Runs that did not finish, or lack a winner, are skipped and counted. `--tag` names a harness setting the run file does not record; it joins the economy fingerprint.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { reportFromRun } from './lib/match-report-from-run.mjs';

const argv = process.argv.slice(2);
const flag = name => { const hit = argv.find(a => a.startsWith(`--${name}=`)); return hit ? hit.slice(name.length + 3) : null; };
const inputs = argv.filter(a => !a.startsWith('--')), out = flag('out');
if (!inputs.length || !out) { console.error('usage: alpha-reports-from-runs.mjs <run-dir|file>... --out=<dir> [--tag=..] [--engine=..]'); process.exit(2); }
const files = [];
const walk = path => { const full = resolve(path); if (!existsSync(full)) return; if (statSync(full).isDirectory()) for (const name of readdirSync(full).sort()) walk(join(full, name)); else if (full.endsWith('.json') && !/summary|digest|index/.test(full)) files.push(full); };
inputs.forEach(walk);
mkdirSync(resolve(out), { recursive: true });
let written = 0, skipped = 0;
for (const file of files) {
  try {
    const run = JSON.parse(readFileSync(file, 'utf8'));
    if (!run.meta || !run.rows) { skipped++; continue; }
    const report = reportFromRun(run, { tag: flag('tag') ?? '', engine: flag('engine') ?? 'sim' });
    writeFileSync(join(resolve(out), `${basename(resolve(file, '..'))}__${basename(file)}`), JSON.stringify(report));
    written++;
  } catch (error) { skipped++; console.error(`skip ${basename(file)}: ${error instanceof Error ? error.message.slice(0, 100) : error}`); }
}
console.log(`reports written: ${written}, skipped: ${skipped}`);

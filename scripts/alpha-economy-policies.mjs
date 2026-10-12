#!/usr/bin/env node
// Lane A1 (Alpha V1.2 audit) — scripted economic policies on the real engine, with an independent conservation check.
//
//   node scripts/alpha-economy-policies.mjs                                  # default matrix (5 policies x 21/35/49 rounds x 2/4/6 players x seeds 1,2)
//   node scripts/alpha-economy-policies.mjs --policies=balanced --profiles=21 --players=2 --seeds=1
//   node scripts/alpha-economy-policies.mjs --single --policy=growth --profile=35 --players=4 --seed=1 --out=/tmp/run.json
//   node scripts/alpha-economy-policies.mjs --verify-parity                  # traced engine vs untouched dist: identical final state
//
// Reads packages/*/dist (the RC4 baseline); never compiles and never writes under packages/ or apps/. Raw data goes to
// docs/evidence/v12-audit/lane-a1/runs/*.json (one file per match), plus index.json.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpus } from 'node:os';
import { loadEngine, flows } from './lib/alpha-flow-trace.mjs';
import { createBox, playPolicyMatch, POLICY_NAMES, PROFILES } from './lib/alpha-econ-policies.mjs';
import { buildRows, runChecks } from './lib/alpha-econ-analysis.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (n, f) => { const hit = argv.find(a => a.startsWith(`--${n}=`)); return hit ? hit.slice(n.length + 3) : f; };
const flag = n => argv.includes(`--${n}`);
const list = (n, f) => String(arg(n, f)).split(',').filter(Boolean);
const OUT = resolve(ROOT, arg('out', 'docs/evidence/v12-audit/lane-a1'));

export async function runOne({ policy, profile, players, seed, traced = true, maxRounds = Infinity, mixed = null, variant = 'base', peace = true }) {
  const { E, D } = await loadEngine({ traced });
  const box = createBox({ E, D, policy, profile, players, seed, mixed, variant, peace });
  playPolicyMatch(box, { maxRounds });
  return { box, E, D };
}

const hash = state => createHash('sha256').update(JSON.stringify(state)).digest('hex').slice(0, 16);

/** Per seat at the end: Obras de Legado completed and the best Hegemonia path (how many of its 3 requirements are met). Used by the phase-2 comparisons. */
function endgameSummary(s, E, D) {
  return s.players.map(p => {
    const works = s.legacyWorks.filter(w => w.ownerId === p.playerId && w.completedRound !== null).length;
    let best = 0, bestPath = null;
    try { for (const path of E.hegemonyProgress(s, p.playerId)) { const met = path.requirements.filter(r => r.met).length; if (met > best) { best = met; bestPath = path.path; } } } catch { /* seat without cities */ }
    // Where the Prestígio came from (phase 3): Marcos ★ (+3 each), Ambições concluídas, Obras de Legado (+4 each), Regiões exploradas (+1 each); the rest is Ameaças destruídas and Ressonância.
    const milestones = D ? p.research.filter(id => D.ADVANCEMENTS.find(a => a.id === id)?.milestone).length * 3 : 0;
    const ambitions = D ? p.completedAmbitions.reduce((n, id) => n + (D.ALPHA_CARDS.find(c => c.id === id)?.objective?.prestige ?? 0), 0) : 0;
    const explored = p.exploredRegions ?? 0, workPrestige = works * 4;
    return { seat: p.playerId, works, hegemonyMet: best, hegemonyPath: bestPath, declared: p.hegemony?.path ?? null, prestige: p.prestige,
      prestigeBy: { milestones, ambitions, works: workPrestige, explored, other: p.prestige - milestones - ambitions - workPrestige - explored }, ambitionsDone: p.completedAmbitions.length, victories: p.victories };
  });
}

/** The Obra experiment: what was started/finished and when, and why no Obra could start in the rounds it was not feasible (first block reason per seat). */
function obraSummary(s, box) {
  const blocks = {};
  for (const r of box.obraLog ?? []) { const k = `${r.seat}:${(r.block ?? 'FEASIBLE').replace(/\d+/g, 'N').slice(0, 70)}`; blocks[k] = (blocks[k] ?? 0) + 1; }
  return { works: s.legacyWorks.map(w => ({ ...w })), blocks, ordersByType: s.telemetry.actionsByType };
}
/** What the World's Threats did in this match (read from the final state): assaults, who won, on which cities, camps killed. Used by the R1 measurement. */
function threatSummary(s) {
  const WORLD = 'world', cities = s.core.players.flatMap(p => p.civilization.cities.map(c => ({ id: c.id, hexId: c.hexId, owner: p.id })));
  const against = s.battles.filter(b => b.attackerId === WORLD), byPlayer = s.battles.filter(b => b.defenderId === WORLD);
  const wins = against.filter(b => b.winnerId === WORLD && b.outcome !== 'TIE');
  const perCity = {}; for (const b of against) { const city = cities.find(c => c.hexId === b.hexId); const k = city ? city.id : `field:${b.hexId}`; perCity[k] = (perCity[k] ?? 0) + 1; }
  const events = {}; for (const e of s.events) if (/^THREAT/.test(e.type) || e.type === 'THREATS_GREW') events[e.type] = (events[e.type] ?? 0) + 1;
  return {
    assaults: against.length, worldWins: wins.length, worldWinsOnCities: wins.filter(b => cities.some(c => c.hexId === b.hexId)).length, assaultsByCity: perCity,
    assaultRounds: against.map(b => b.round), playerAttacksOnThreats: byPlayer.length, events,
    telemetry: { attacks: s.telemetry.threatAttacks, kills: s.telemetry.threatKills, losses: s.telemetry.threatLosses, spawned: s.telemetry.threatsSpawned },
    campsAliveAtEnd: s.threats.filter(t => t.kind === 'CAMP' && t.status === 'CAMPED').length, bandsMarchingAtEnd: s.threats.filter(t => t.status === 'MARCHING').length, piratesAtEnd: s.threats.filter(t => t.kind === 'PIRATE').length,
    citiesAtEnd: cities.length,
  };
}

async function single() {
  const policy = arg('policy', 'balanced'), profile = Number(arg('profile', 21)), players = Number(arg('players', 2)), seed = Number(arg('seed', 1));
  const variant = arg('variant', 'base'), peace = !flag('world');
  const { box } = await runOne({ policy, profile, players, seed, variant, peace, maxRounds: Number(arg('max-rounds', Infinity)) });
  const rows = buildRows(box);
  const checks = runChecks(box);
  const s = box.state;
  const result = {
    meta: { policy, profile, players, seed, variant, mode: peace ? 'peace' : 'world', preset: box.preset, roundLimit: s.rules.roundLimit, roundsPerEra: s.rules.roundsPerEra, actionsPerRound: s.rules.actionsPerRound ?? 5, finalRound: s.core.round, status: s.core.status, winner: s.winner ?? null, ms: Math.round(box.totalMs), perf: { commandMs: Math.round(box.perf.commandMs), readyMs: Math.round(box.perf.readyMs) }, civs: box.seats.map(x => x.civilization), commands: box.counters.commands, rejected: box.counters.rejected, rejectedReasons: box.counters.rejectedReasons, crashes: box.crashes ?? [], stateHash: hash(s) },
    rows, checks: { ...checks, residualsAtCommand: box.residuals, unclassified: box.unclassified },
    actionFailedReasons: s.events.filter(e => e.type === 'ACTION_FAILED').reduce((m, e) => { const k = e.message.replace(/\d+/g, 'N').slice(0, 130); m[k] = (m[k] ?? 0) + 1; return m; }, {}), rejectMessages: (box.rejectLog ?? []).reduce((m, r) => { const k = `${r.type}:${r.action ?? ''}: ${r.msg.slice(0, 110)}`; m[k] = (m[k] ?? 0) + 1; return m; }, {}), speculativeFlowsDropped: box.speculative, slotMismatchSkips: box.slotMismatchSkips ?? [], yieldSamples: box.yieldSamples, final: box.finalOpen, reports: s.roundReports.length,
    telemetry: { actionsByType: s.telemetry.actionsByType, productionByResource: s.telemetry.productionByResource },
    threats: threatSummary(s),
    endgame: endgameSummary(s, box.E, box.D),
    prestigeLog: box.prestigeLog ?? {},
    obra: process.env.AOH_POLICY_OBRA === '1' ? obraSummary(s, box) : null,
  };
  const file = arg('out-file', join(OUT, variant !== 'base' ? 'variants' : peace ? 'runs' : 'runs-world', `${policy}-${profile}-p${players}-s${seed}${variant === 'base' ? '' : '-' + variant}.json`));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(result));
  console.log(`${policy} ${profile}r ${players}p s${seed}: ${result.meta.ms}ms round ${s.core.round} ${s.core.status} cmds ${box.counters.commands} rej ${box.counters.rejected} residuals ${box.residuals.length} identity ${checks.identity.length} ledgerMismatch ${checks.ledger.mismatches.length} crashes ${(box.crashes ?? []).length}`);
}

async function parity() {
  const a = await runOne({ policy: 'balanced', profile: 21, players: 2, seed: 1, traced: false });
  const b = await runOne({ policy: 'balanced', profile: 21, players: 2, seed: 1, traced: true });
  const ha = hash(a.box.state), hb = hash(b.box.state);
  console.log(`untouched dist: ${ha}  traced copy: ${hb}  ->  ${ha === hb ? 'IDENTICAL' : 'DIFFERENT'}  (rounds ${a.box.state.core.round}/${b.box.state.core.round}, flows traced ${flows().length})`);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'parity.json'), JSON.stringify({ untouched: ha, traced: hb, identical: ha === hb, command: 'node scripts/alpha-economy-policies.mjs --verify-parity' }, null, 1));
  process.exit(ha === hb ? 0 : 1);
}

async function matrix() {
  const policies = list('policies', POLICY_NAMES.join(',')), profiles = list('profiles', '21,35,49').map(Number), players = list('players', '2,4,6').map(Number), seeds = list('seeds', '1,2').map(Number);
  const jobs = [];
  for (const profile of profiles) for (const p of players) for (const policy of policies) for (const seed of seeds) jobs.push({ policy, profile, players: p, seed });
  // Heaviest first so the pool stays busy.
  jobs.sort((x, y) => y.profile * y.players - x.profile * x.players);
  const workers = Number(arg('workers', Math.max(1, Math.min(cpus().length - 1, 7))));
  console.log(`${jobs.length} matches, ${workers} workers, out ${OUT}`);
  const runsDir = flag('world') ? 'runs-world' : 'runs';
  mkdirSync(join(OUT, runsDir), { recursive: true });
  const queue = [...jobs]; let running = 0, done = 0; const failed = [];
  await new Promise(resolveAll => {
    const next = () => {
      while (running < workers && queue.length) {
        const j = queue.shift(); running++;
        const file = join(OUT, runsDir, `${j.policy}-${j.profile}-p${j.players}-s${j.seed}.json`);
        if (flag('resume') && existsSync(file)) { running--; done++; continue; }
        const child = spawn(process.execPath, [fileURLToPath(import.meta.url), '--single', `--policy=${j.policy}`, `--profile=${j.profile}`, `--players=${j.players}`, `--seed=${j.seed}`, `--out=${OUT}`, ...(flag('world') ? ['--world'] : [])], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
        let out = '';
        child.stdout.on('data', d => { out += d; }); child.stderr.on('data', d => { out += d; });
        child.on('close', code => { running--; done++; process.stdout.write(`[${done}/${jobs.length}] ${out.trim().split('\n').slice(-1)[0]}\n`); if (code !== 0) failed.push({ ...j, code, tail: out.slice(-600) }); next(); if (!queue.length && running === 0) resolveAll(); });
      }
      if (!queue.length && running === 0) resolveAll();
    };
    next();
  });
  writeFileSync(join(OUT, 'index.json'), JSON.stringify({ jobs, failed, generatedWith: 'node scripts/alpha-economy-policies.mjs', profiles: PROFILES }, null, 1));
  if (failed.length) { console.error('FAILED', JSON.stringify(failed, null, 1)); process.exit(1); }
}

if (flag('verify-parity')) await parity();
else if (flag('single')) await single();
else await matrix();
void readFileSync;

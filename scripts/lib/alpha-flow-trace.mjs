// Lane A1 (Alpha V1.2 audit): flow tracer for the engine, built WITHOUT touching packages/ or apps/.
// It copies packages/game-engine/dist to node_modules/.cache/aoh-lane-a1/engine (gitignored), wraps the five functions that mutate
// player.resources (alphaPay, alphaGain, enforceStorage, alphaDrain, alphaLose) and performUrbanAction, and records every real change of
// the 8-resource pool in globalThis.__AOH_FLOWS. The ledger (state.roundLedgers) is NOT consulted: the trace is measured on the pool itself.
// Behaviour is unchanged (wrappers only observe); scripts/alpha-economy-policies.mjs --verify-parity proves it by comparing state hashes.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'packages', 'game-engine', 'dist');
const DST = join(ROOT, 'node_modules', '.cache', 'aoh-lane-a1', 'engine');

const KEYS = ['food', 'wood', 'stone', 'metal', 'wealth', 'knowledge', 'influence', 'culture'];

const PRELUDE = `
const __KEYS = ${JSON.stringify(KEYS)};
globalThis.__AOH_FLOWS ??= [];
globalThis.__AOH_PRE_MAINT ??= {};
const __stack = [];
const __zero = () => Object.fromEntries(__KEYS.map(k => [k, 0]));
function __snap(state, actor) { const p = state.players.find(x => x.playerId === actor); return p ? { ...p.resources } : null; }
function __frames() { return (new Error().stack ?? '').split('\\n').slice(2).map(l => (/at (?:async )?([\\w$.<>]+) /.exec(l) ?? [])[1]).filter(Boolean).filter(n => !n.startsWith('__') && n !== 'Object.<anonymous>').slice(0, 14); }
function __trace(kind, args, fn) {
  const state = args[0], actor = args[1];
  const pre = __snap(state, actor);
  if (!pre) return fn();
  if (kind === 'alphaDrain' && state.phase === 'INTEGRATION_MAINTENANCE') {
    const key = state.core.round + ':' + actor;
    if (!globalThis.__AOH_PRE_MAINT[key]) {
      const owner = state.core.players.find(p => p.id === actor);
      globalThis.__AOH_PRE_MAINT[key] = {
        cities: owner.civilization.cities.map(c => ({ id: c.id, pop: c.population, granary: (state.cities.find(m => m.cityId === c.id)?.buildings ?? []).includes('GRANARY') })),
        landPieces: state.units.filter(u => u.ownerId === actor && state.rules.units[u.kind].domain === 'LAND' && state.rules.units[u.kind].strength > 0).length,
        ships: state.units.filter(u => u.ownerId === actor && state.rules.units[u.kind].domain === 'SEA').length,
        capital: owner.civilization.capitalCityId,
      };
    }
  }
  const frame = { kids: __zero() };
  __stack.push(frame);
  let out;
  try { out = fn(); } finally { __stack.pop(); }
  const post = __snap(state, actor);
  const delta = __zero(), own = __zero();
  for (const k of __KEYS) { delta[k] = post[k] - pre[k]; own[k] = delta[k] - frame.kids[k]; }
  if (__stack.length) { const parent = __stack.at(-1); for (const k of __KEYS) parent.kids[k] += delta[k]; }
  if (kind === 'alphaDrain' || __KEYS.some(k => own[k] !== 0)) {
    const category = kind === 'alphaGain' ? (args[3]?.category ?? 'other') : kind === 'alphaDrain' ? (args[3] ?? 'expenses') : kind === 'alphaPay' ? 'expenses' : kind === 'alphaLose' ? 'losses' : 'discarded';
    globalThis.__AOH_FLOWS.push({ n: globalThis.__AOH_FLOWS.length, round: state.core.round, phase: state.phase, actor, kind, category, delta: own, cur: globalThis.__AOH_CUR ?? null, frames: __frames() });
  }
  return out;
}
`;

const WRAP = ['alphaPay', 'alphaGain', 'enforceStorage', 'alphaDrain', 'alphaLose'];

export function buildTracedEngine({ force = false } = {}) {
  if (!existsSync(SRC)) throw new Error('packages/game-engine/dist missing: run the baseline build first (this script never compiles).');
  if (force && existsSync(DST)) rmSync(DST, { recursive: true, force: true });
  if (!existsSync(join(DST, 'index.js'))) {
    mkdirSync(DST, { recursive: true });
    for (const f of readdirSync(SRC)) if (f.endsWith('.js')) cpSync(join(SRC, f), join(DST, f));
    writeFileSync(join(DST, 'package.json'), JSON.stringify({ type: 'module' }));
    // alpha-resources.js: wrap the five mutators.
    let res = readFileSync(join(DST, 'alpha-resources.js'), 'utf8');
    for (const name of WRAP) {
      const needle = `export function ${name}(`;
      if (res.split(needle).length !== 2) throw new Error(`patch failed: ${name} not found exactly once`);
      res = res.replace(needle, `function __orig_${name}(`);
      res += `\nexport function ${name}(...args) { return __trace(${JSON.stringify(name)}, args, () => __orig_${name}(...args)); }\n`;
    }
    res += PRELUDE;
    writeFileSync(join(DST, 'alpha-resources.js'), res);
    // alpha-urban.js: expose which urban action is resolving (so flows can be tied to a planned action).
    let urb = readFileSync(join(DST, 'alpha-urban.js'), 'utf8');
    const needle = 'export function performUrbanAction(';
    if (urb.split(needle).length !== 2) throw new Error('patch failed: performUrbanAction');
    urb = urb.replace(needle, 'function __orig_performUrbanAction(');
    urb += `\nexport function performUrbanAction(state, actor, command) {
  const prev = globalThis.__AOH_CUR ?? null;
  globalThis.__AOH_CUR = { actor, cityId: command.cityId, action: command.action, unit: command.unit ?? null, build: command.build ? (command.build.building ?? command.build.district ?? command.build.kind) : null, advancementId: command.advancementId ?? null, planId: command.planId ?? null };
  try { return __orig_performUrbanAction(state, actor, command); } finally { globalThis.__AOH_CUR = prev; }
}\n`;
    writeFileSync(join(DST, 'alpha-urban.js'), urb);
  }
  return DST;
}

/** Loads the engine. traced=false -> the untouched RC4 dist. */
export async function loadEngine({ traced = false } = {}) {
  const dir = traced ? buildTracedEngine() : SRC;
  const E = await import(pathToFileURL(join(dir, 'index.js')).href);
  const D = await import(pathToFileURL(join(ROOT, 'packages', 'game-domain', 'dist', 'index.js')).href);
  return { E, D, traced, dir };
}
export const flows = () => (globalThis.__AOH_FLOWS ??= []);
export const preMaint = () => (globalThis.__AOH_PRE_MAINT ??= {});
export const resetTrace = () => { globalThis.__AOH_FLOWS = []; globalThis.__AOH_PRE_MAINT = {}; globalThis.__AOH_CUR = null; };
export const RESOURCE_KEYS_8 = KEYS;

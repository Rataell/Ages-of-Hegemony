// RC 1.2 / RC2 structural gate: typecheck + the world/exploration/Core 10/room/legacy/bot tests, in one command. Not the full suite (npm test is for that).
//   node scripts/rc-gate.mjs
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const bin = (...parts) => join(ROOT, 'node_modules', ...parts);
const run = (label, entry, args, cwd = ROOT) => {
  process.stdout.write(`\n== ${label}\n`);
  const result = spawnSync(process.execPath, [entry, ...args], { cwd, stdio: 'inherit', windowsHide: true });
  if (result.status !== 0) { console.error(`\nGATE FAILED at: ${label}`); process.exit(result.status ?? 1); }
};
const TESTS = [
  'tests/alpha-footprints.test.ts', 'tests/alpha-world-presets.test.ts', 'tests/alpha-world.test.ts', 'tests/alpha-exploration.test.ts', 'tests/alpha-discoveries.test.ts',
  'tests/alpha-maritime.test.ts', 'tests/alpha-kit-effects.test.ts', 'tests/alpha-civilization-kits.test.ts', 'tests/alpha-leaders.test.ts', 'tests/alpha-content.test.ts',
  'tests/alpha-figures-lobby.test.ts', 'tests/alpha-legacy-room.test.ts', 'tests/alpha-http.test.ts', 'tests/alpha-http-invite.test.ts', 'tests/alpha-service.test.ts',
  'tests/alpha-bots.test.ts', 'tests/alpha-bots-worlds.test.ts', 'tests/alpha-privacy.test.ts', 'tests/alpha-table-art.test.ts', 'tests/alpha-ux-round-1.test.ts', 'tests/alpha-ui-coverage.test.ts',
  // RC2: Move + Discovery, naval progression, Ressonância, bots, legacy rooms.
  'tests/alpha-move-discovery.test.ts', 'tests/alpha-bots-discovery.test.ts', 'tests/alpha-naval.test.ts', 'tests/alpha-unit-options.test.ts', 'tests/alpha-pioneer.test.ts', 'tests/alpha-resonance.test.ts', 'tests/alpha-bot-pvp.test.ts',
];
run('compile (packages + server)', bin('typescript', 'bin', 'tsc'), ['-b']);
run('typecheck tests', bin('typescript', 'bin', 'tsc'), ['-p', 'tests/tsconfig.json']);
run('typecheck web', bin('typescript', 'bin', 'tsc'), ['--noEmit'], join(ROOT, 'apps', 'web'));
run('lint', bin('eslint', 'bin', 'eslint.js'), ['.', '--max-warnings', '0']);
run('structural tests', bin('vitest', 'vitest.mjs'), ['run', ...TESTS]);
console.log('\nRC GATE OK');

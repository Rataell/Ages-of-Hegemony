import { Player } from './lib.mjs';
import { readFileSync } from 'node:fs';
const probe = JSON.parse(readFileSync(process.argv[2], 'utf8')), P = new Player('R-B');
const join = await P.join(probe.code);
console.log('join with the code created before the restart ->', join.status, join.error?.code, '|', join.error?.message);
const read = await P.get(probe.id, { expect: [401, 404] }); console.log('read old room id ->', read.status, read.error?.code);

import { Player, defaultCreate, okOrThrow } from './lib.mjs';
import { writeFileSync } from 'node:fs';
const A = new Player('R-A'); const room = okOrThrow(await A.create(defaultCreate({ seatLimit: 2 })), 'create');
const health = await (await fetch(`${process.env.AUDIT_URL ?? 'http://127.0.0.1:3002'}/api/alpha/health`)).json();
writeFileSync(process.argv[2], JSON.stringify({ id: room.id, code: room.joinCode }));
console.log('room created; health before restart', JSON.stringify(health));

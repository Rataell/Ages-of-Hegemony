import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { expect, it } from 'vitest';
import { PrismaClient } from '../apps/server/src/generated/prisma/client.js';
import { PrismaAlphaRepository } from '../apps/server/src/alpha-prisma-repository.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';

it('suspends, survives a new connection (server restart) and resumes, with the status column following the lifecycle', async () => {
  const connectionString = process.env.ALPHA_TEST_DATABASE_URL;
  if (!connectionString) throw new Error('Set ALPHA_TEST_DATABASE_URL (npm run test:db:docker).');
  const first = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const second = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const a = { guestId: randomUUID() }, b = { guestId: randomUUID() };
  try {
    const service = new AlphaGameService(new PrismaAlphaRepository(first));
    const created = await service.create(a, { name: 'Lifecycle', displayName: 'Ana', preset: 'QUICK', seatLimit: 2, seed: 62, planningSeconds: 0 });
    if (!created.ok) throw new Error(created.error.message);
    const id = created.value.id;
    const joined = await service.join(b, created.value.joinCode, 'Beto'); if (!joined.ok) throw new Error(joined.error.message);
    let version = joined.value.version;
    for (const [actor, civilization] of [[a, 'aurelia'], [b, 'valgard']] as const) {
      const c = await service.lobby(actor, id, { type: 'CHOOSE_CIVILIZATION', expectedVersion: version, civilization }, 0); if (!c.ok) throw new Error(c.error.message);
      const r = await service.lobby(actor, id, { type: 'LOBBY_READY', expectedVersion: c.value.version, ready: true }, 0); if (!r.ok) throw new Error(r.error.message); version = r.value.version;
    }
    const s = await service.lobby(a, id, { type: 'START', expectedVersion: version }, 0); if (!s.ok) throw new Error(s.error.message);
    for (const actor of [a, b]) {
      const v = await service.read(actor, id, 0); if (!v.ok) throw new Error('read');
      const r = await service.command(actor, id, { type: 'CHOOSE_AMBITIONS', expectedVersion: v.value.game!.version, cardIds: v.value.game!.self.ambitions.slice(0, 2) }, 0); if (!r.ok) throw new Error(r.error.message);
      for (let n = 0; n < 4; n++) {
        const w = await service.read(actor, id, 0); if (!w.ok) break; const choice = w.value.game!.self.pendingChoices[0]; if (!choice) break;
        const x = await service.command(actor, id, { type: 'RESOLVE_CHOICE', expectedVersion: w.value.game!.version, choiceId: choice.id, optionId: choice.options[0]!.id }, 0); if (!x.ok) break;
      }
    }
    const suspended = await service.roomAction(a, id, { type: 'SUSPEND' }, 5);
    expect(suspended.ok && suspended.value.lifecycle).toBe('SUSPENDED');
    const status = await first.alphaMatch.findUnique({ where: { id } });
    expect(status?.status).toBe('SUSPENDED');
    await first.$disconnect();

    const restored = new AlphaGameService(new PrismaAlphaRepository(second));
    const seen = await restored.read(b, id, 10);
    expect(seen.ok && seen.value.lifecycle).toBe('SUSPENDED');
    expect(seen.ok && seen.value.selfPlayerId).toBe('player-2');
    const refused = await restored.command(b, id, { type: 'READY', expectedVersion: seen.ok ? seen.value.game!.version : 0 }, 10);
    expect(!refused.ok && refused.error.code).toBe('SUSPENDED');
    const resumed = await restored.roomAction(a, id, { type: 'RESUME' }, 20);
    expect(resumed.ok && resumed.value.lifecycle).toBe('ACTIVE');
    expect((await second.alphaMatch.findUnique({ where: { id } }))?.status).not.toBe('SUSPENDED');
  } finally { await first.$disconnect().catch(() => undefined); await second.$disconnect().catch(() => undefined); }
});

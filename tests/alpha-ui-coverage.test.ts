import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AlphaCommandSchema } from '@aoh/game-domain';
import { ALPHA_UNSUPPORTED_COMMANDS } from '@aoh/game-engine';

const dir = join(process.cwd(), 'apps/web/app/alpha');
const sources = readdirSync(dir).filter(name => /\.(tsx|ts)$/.test(name)).map(name => ({ name, text: readFileSync(join(dir, name), 'utf8') }));
const alphaTypes = new Set(AlphaCommandSchema.options.map(option => option.shape.type.value as string));

describe('alpha interface coverage (closed alpha)', () => {
  it('no visible control can send a command that ends in NOT_IMPLEMENTED', () => {
    for (const command of ALPHA_UNSUPPORTED_COMMANDS) {
      expect(alphaTypes.has(command), `${command} must exist in the schema`).toBe(true);
      const users = sources.filter(source => source.text.includes(command)).map(source => source.name);
      expect(users, `${command} is not implemented but the interface references it`).toEqual([]);
    }
  });

  it('every top-level command the interface sends is a real schema command', () => {
    const sent = new Set<string>();
    for (const source of sources) for (const match of source.text.matchAll(/\bsend\(\{type:'([A-Z_]+)'/g)) sent.add(match[1]!);
    expect(sent.size).toBeGreaterThan(10);
    for (const type of sent) expect(alphaTypes.has(type), `${type} is not a schema command`).toBe(true);
  });

  it('does not advertise unfinished systems as playable', () => {
    const copy = sources.map(source => source.text).join('\n');
    expect(copy).not.toMatch(/Contestar presença|Propor oferta comercial|Ação de povo independente/i);
  });
});

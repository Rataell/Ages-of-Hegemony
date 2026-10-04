import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain ESM script without types
import { CSS_PATH, TOKENS_PATH, compileTokensCss } from '../scripts/design-system.mjs';

const root = process.cwd();
const tokens = JSON.parse(readFileSync(TOKENS_PATH, 'utf8')) as { color: { tokens: { name: string }[] }; shadow: { tokens: { name: string }[] }; spacing: { tokens: { name: string }[] }; radius: { tokens: { name: string }[] }; size: { tokens: { name: string }[] }; type: { families: Record<string, string> } };
const defined = new Set([
  ...[...tokens.color.tokens, ...tokens.shadow.tokens, ...tokens.spacing.tokens, ...tokens.radius.tokens, ...tokens.size.tokens].map(token => token.name),
  ...Object.keys(tokens.type.families).map(key => `font-${key}`),
  'serif', 'sans', 'seat-1', 'seat-2', 'seat-3', 'seat-4', 'seat-5', 'seat-6',
]);

describe('design system tokens (alpha-mesa-design-system A1/A2)', () => {
  it('defines every global variable the stylesheets use', () => {
    for (const file of ['apps/web/app/style.css', 'apps/web/app/alpha/alpha.css', 'apps/web/app/design/aoh.css']) {
      const css = readFileSync(join(root, file), 'utf8');
      // Variables a rule declares for itself (--owner, --terrain, --i, --a…) are local, not tokens.
      // --i and --a (card fan) and --seat (seals) are set inline through the style prop.
      const local = new Set([...css.matchAll(/(?:^|[;{\s])--([a-z0-9-]+)\s*:/g)].map(match => match[1]!).concat(['i', 'a', 'seat']));
      const used = [...new Set([...css.matchAll(/var\(--([a-z0-9-]+)/g)].map(match => match[1]!))];
      expect(used.filter(name => !defined.has(name) && !local.has(name)), file).toEqual([]);
    }
  });
  it('keeps the compiled tokens.css in step with tokens.json', () => {
    expect(readFileSync(CSS_PATH, 'utf8')).toBe(compileTokensCss(tokens));
  });
  it('reserves gold for the dominant action: no seat color is gold', () => {
    const seats = tokens.color.tokens.filter(token => /^civ-\d$/.test(token.name)) as unknown as { value: { dark: string } }[];
    for (const seat of seats) { const [r, g, b] = [1, 3, 5].map(i => parseInt(seat.value.dark.slice(i, i + 2), 16)); expect(r! > 190 && g! > 150 && b! < 130).toBe(false); }
  });
});

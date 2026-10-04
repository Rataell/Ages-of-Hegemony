// AoH design system as code. One source, apps/web/app/design/tokens.json (Design System artifact format), feeds:
//   node scripts/design-system.mjs css               -> apps/web/app/design/tokens.css (imported by the product)
//   node scripts/design-system.mjs artifact <dir>    -> <dir>/project/... files of the AoH Design System artifact
// The product and the artifact cannot drift because both are generated from the same files.
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DESIGN = join(ROOT, 'apps', 'web', 'app', 'design');
export const TOKENS_PATH = join(DESIGN, 'tokens.json');
export const CSS_PATH = join(DESIGN, 'tokens.css');

const themeValue = (token, theme, first) => (typeof token.value === 'string' ? (theme === first ? token.value : undefined) : token.value[theme]);

/** tokens.json -> CSS custom properties. Dark (the Mesa) is the first theme and the default; light follows the product's theme switch. */
export function compileTokensCss(tokens) {
  const [first, ...others] = tokens.color.themes.map(theme => theme.id);
  const lines = ['/* GENERATED from tokens.json by scripts/design-system.mjs. Edit tokens.json, then run: node scripts/design-system.mjs css */'];
  const block = (selector, scheme, theme) => {
    const decls = [];
    for (const token of [...tokens.color.tokens, ...(tokens.shadow?.tokens ?? [])]) {
      const value = themeValue(token, theme, first);
      if (value !== undefined) decls.push(`  --${token.name}: ${value};`);
    }
    return [`${selector} {`, `  color-scheme: ${scheme};`, ...decls, '}'].join('\n');
  };
  lines.push(block(':root', first === 'light' ? 'light' : 'dark', first));
  for (const theme of others) lines.push(block(`:root[data-alpha-theme='${theme.toUpperCase()}']`, theme === 'light' ? 'light' : 'dark', theme));
  const flat = [];
  for (const family of ['spacing', 'radius', 'size']) for (const token of tokens[family]?.tokens ?? []) flat.push(`  --${token.name}: ${token.value};`);
  for (const [key, stack] of Object.entries(tokens.type.families)) flat.push(`  --font-${key}: ${stack};`);
  // Names the existing stylesheets already use.
  flat.push('  --serif: var(--font-display);', '  --sans: var(--font-body);', '  --seat-1: var(--civ-1);', '  --seat-2: var(--civ-2);', '  --seat-3: var(--civ-3);', '  --seat-4: var(--civ-4);', '  --seat-5: var(--civ-5);', '  --seat-6: var(--civ-6);');
  lines.push([':root {', ...flat, '}'].join('\n'));
  for (const group of tokens.type.groups) for (const style of group.styles) {
    const decls = [`font-family: var(--font-${style.family ?? group.family})`, `font-size: ${style.fontSize}`, `line-height: ${style.lineHeight}`, `font-weight: ${style.fontWeight}`];
    if (style.letterSpacing) decls.push(`letter-spacing: ${style.letterSpacing}`);
    if (style.fontStyle) decls.push(`font-style: ${style.fontStyle}`);
    if (style.name === 'eyebrow') decls.push('text-transform: uppercase');
    lines.push(`.t-${style.name} { ${decls.join('; ')}; }`);
  }
  return lines.join('\n\n') + '\n';
}

/** table-art.ts -> one classic script assigning window.AOH (the artifact's live component bundle). */
async function artBundle() {
  const ts = (await import('typescript')).default;
  const source = readFileSync(join(ROOT, 'apps', 'web', 'app', 'alpha', 'table-art.ts'), 'utf8');
  let js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } }).outputText;
  const names = [...js.matchAll(/^export (?:const|function) ([A-Za-z0-9_]+)/gm)].map(match => match[1]);
  js = js.replace(/^export /gm, '').replace(/^import .*$/gm, '');
  const header = `/* @ds-bundle: ${JSON.stringify({ format: 4, namespace: 'AOH', components: [] })} */`;
  return `${header}\n(function () {\n${js}\nwindow.AOH = { ${names.join(', ')} };\n})();\n`;
}

function copyTree(from, to, files) {
  if (!existsSync(from)) return;
  for (const name of readdirSync(from)) {
    const source = join(from, name), target = join(to, name);
    if (statSync(source).isDirectory()) copyTree(source, target, files);
    else { mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, readFileSync(source)); files.push(target); }
  }
}

async function main() {
  const [command, out] = process.argv.slice(2);
  const tokens = JSON.parse(readFileSync(TOKENS_PATH, 'utf8'));
  if (command === 'css') { writeFileSync(CSS_PATH, compileTokensCss(tokens)); console.log(`wrote ${CSS_PATH}`); return; }
  if (command === 'artifact' && out) {
    const project = join(out, 'project'), files = [];
    mkdirSync(join(project, 'components'), { recursive: true });
    writeFileSync(join(project, 'tokens.json'), JSON.stringify(tokens, null, 1)); files.push(join(project, 'tokens.json'));
    copyTree(join(DESIGN, 'system'), project, files); // README.md and components/<Comp>/{README.md,preview.html}
    writeFileSync(join(project, 'components', 'bundle.css'), readFileSync(join(DESIGN, 'aoh.css'), 'utf8')); files.push(join(project, 'components', 'bundle.css'));
    writeFileSync(join(project, 'components', 'bundle.js'), await artBundle()); files.push(join(project, 'components', 'bundle.js'));
    console.log(files.map(file => file.slice(out.length + 1)).join('\n'));
    return;
  }
  console.error('Uso: node scripts/design-system.mjs css | artifact <pasta>');
  process.exit(2);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();

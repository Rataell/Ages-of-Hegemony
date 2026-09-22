// DEV-ONLY harness: open 2-6 independent Chromium windows on the local Closed Alpha so one person can play several seats.
//
//   npm run alpha:players -- --players=2
//   npm run alpha:players -- --players=3 --auto-join     create the table in window A and enter the others through the real invite link
//   npm run alpha:players -- --players=4 --start         also pick civilizations, confirm, and start the match
//
// Each window is its own browser process with its own cookies, so each one gets its own signed guest session from the normal
// server flow. Nothing here impersonates anyone, forges a guest id or calls a private endpoint: it only drives the same forms
// a person would. It refuses any address that is not local, and it lives in scripts/, never in the app or the server.
//
// Options: --players=N (2-6, default 2)  --auto-join  --start  --no-names  --layout=tile|none  --screen=WxH (default 1920x1080)
//          --once (prepare, then close: for tests)   ALPHA_PLAYERS_HEADLESS=1 (no visible windows: for tests)
// ALPHA_LOCAL_PORT (default 3001) must match `npm run dev:alpha`.
const PORT = Number(process.env.ALPHA_LOCAL_PORT ?? 3001);
const BASE = `http://127.0.0.1:${PORT}`;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const stop = (message, code = 1) => { console.error(`\n${message}\n`); process.exit(code); };

const options = new Map(process.argv.slice(2).map(argument => { const [key, value] = argument.replace(/^--/, '').split('='); return [key, value ?? true]; }));
const known = new Set(['players', 'auto-join', 'start', 'no-names', 'layout', 'screen', 'once']);
for (const key of options.keys()) if (!known.has(key)) stop(`Opção desconhecida: --${key}\nUso: npm run alpha:players -- --players=2 [--auto-join] [--start] [--no-names] [--layout=tile|none] [--screen=WxH] [--once]`, 2);
const count = options.has('players') ? Number(options.get('players')) : 2;
if (!Number.isInteger(count) || count < 2 || count > 6) stop('--players precisa ser um número inteiro de 2 a 6. Exemplo: npm run alpha:players -- --players=3', 2);
const layout = options.get('layout') ?? 'tile';
if (!['tile', 'none'].includes(layout)) stop('--layout precisa ser tile ou none.', 2);
const screenMatch = String(options.get('screen') ?? '1920x1080').match(/^(\d{3,5})x(\d{3,5})$/);
if (!screenMatch) stop('--screen precisa ter o formato LARGURAxALTURA, por exemplo 1920x1080.', 2);
const [screenWidth, screenHeight] = [Number(screenMatch[1]), Number(screenMatch[2])];
const start = options.has('start'), autoJoin = options.has('auto-join') || start, names = !options.has('no-names');

// The server must already be running from `npm run dev:alpha`. Fail early and plainly if it is not.
try {
  const response = await fetch(`${BASE}/api/alpha/health`, { signal: AbortSignal.timeout(4000) });
  if (!response.ok) throw new Error(`health ${response.status}`);
} catch {
  stop(`O servidor local não respondeu em ${BASE}.\nInicie-o em outro terminal com: npm run dev:alpha\n(e confira o banco com: npm run alpha:env:check)`);
}

let chromium;
try { ({ chromium } = await import('@playwright/test')); } catch { stop('Playwright não está instalado. Rode: npm install'); }

const columns = count <= 2 ? count : count <= 4 ? 2 : 3, rows = Math.ceil(count / columns);
const width = Math.floor(screenWidth / columns), height = Math.floor((screenHeight - 40) / rows);
const players = [];
try {
  for (let index = 0; index < count; index++) {
    const args = layout === 'tile' ? [`--window-position=${(index % columns) * width},${Math.floor(index / columns) * height}`, `--window-size=${width},${height}`] : [];
    const browser = await chromium.launch({ headless: process.env.ALPHA_PLAYERS_HEADLESS === '1', args });
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    players.push({ browser, page, label: `Jogador ${LETTERS[index]}` });
  }
} catch (error) {
  await Promise.allSettled(players.map(player => player.browser.close()));
  stop(`Não consegui abrir o Chromium (${error instanceof Error ? error.message.split('\n')[0] : 'erro'}).\nSe faltar o navegador do Playwright, rode: npx playwright install chromium`);
}
console.log(`${count} janelas abertas em ${BASE}/alpha, cada uma com sessão própria. Feche todas ou pressione Ctrl+C para encerrar.`);

/** Same forms a person uses: name, create a table, enter through the invite link, pick a civilization, confirm, start. */
async function drive() {
  const [host, ...guests] = players;
  await Promise.all(players.map(async ({ page, label }) => { await page.goto(`${BASE}/alpha`); if (names) await page.getByLabel('Seu nome', { exact: true }).fill(label); }));
  if (!autoJoin) { console.log('Nomes preenchidos. Crie a mesa em uma janela e entre nas outras pelo código ou link, como no fluxo real.'); return; }
  await host.page.getByLabel('Lugares', { exact: false }).selectOption(String(count));
  await host.page.getByRole('button', { name: 'Criar partida', exact: true }).click();
  await host.page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
  const code = (await host.page.locator('.alpha-lobby-heading code').innerText()).trim();
  for (const guest of guests) {
    await guest.page.goto(`${BASE}/alpha?join=${code}`);
    if (names) await guest.page.getByLabel('Seu nome', { exact: true }).fill(guest.label);
    await guest.page.getByRole('button', { name: 'Entrar na partida', exact: true }).click();
    await guest.page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
  }
  console.log(`Mesa criada; ${guests.length} entraram pelo link de convite (código ${code}).`);
  if (!start) return;
  // Each window takes a different card (by position), so the choices never collide while the other windows are still polling.
  for (const [index, { page }] of players.entries()) {
    await page.locator('.alpha-civilizations button').nth(index).click();
    await page.getByRole('button', { name: 'Estou pronto', exact: true }).click();
  }
  // click() waits until the button is enabled, which happens once every seat is ready.
  await host.page.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
  console.log('Partida iniciada.');
}
try { await drive(); } catch (error) { console.error(`\nNão consegui concluir a preparação automática: ${error instanceof Error ? error.message.split('\n')[0] : error}\nAs janelas continuam abertas; siga manualmente.`); }

if (options.has('once')) { await Promise.allSettled(players.map(player => player.browser.close())); process.exit(0); }
const closeAll = async () => { await Promise.allSettled(players.map(player => player.browser.close())); process.exit(0); };
process.on('SIGINT', closeAll); process.on('SIGTERM', closeAll);
await Promise.all(players.map(player => new Promise(resolve => player.browser.on('disconnected', resolve))));
console.log('Todas as janelas foram fechadas.');

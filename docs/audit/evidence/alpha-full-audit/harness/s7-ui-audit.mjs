// Browser audit against the running local alpha: viewports, map behaviour, DOM privacy, accessibility, console, performance.
// Sessions are the ones the server issued to harness players through create/join; nothing is forged.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { BASE, startMatch } from './lib.mjs';

const SHOTS = 'docs/audit/evidence/alpha-full-audit/screens';
mkdirSync(SHOTS, { recursive: true });
const out = { viewports: [], map: {}, privacy: {}, a11y: {}, perf: {}, console: [], pageErrors: [], requests4xx: [] };
const log = (...a) => console.log(...a);
const cookieOf = p => ({ name: p.cookie.split('=')[0], value: p.cookie.split('=')[1], url: BASE, httpOnly: true, sameSite: 'Strict' });

async function open(browser, player, roomId, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport });
  await context.addCookies([cookieOf(player)]);
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) out.console.push({ who: player.name, type: m.type(), text: m.text().slice(0, 240) }); });
  page.on('pageerror', e => out.pageErrors.push({ who: player.name, message: String(e.message).slice(0, 240) }));
  page.on('response', r => { if (r.status() >= 400 && r.url().includes('/api/')) out.requests4xx.push({ who: player.name, status: r.status(), url: r.url().replace(BASE, '') }); });
  const t0 = Date.now();
  await page.goto(`${BASE}/alpha?game=${roomId}`);
  await page.locator('.alpha-player-board h1').waitFor();
  out.perf.firstOpenMs = Math.max(out.perf.firstOpenMs ?? 0, Date.now() - t0);
  return { context, page };
}
const metrics = page => page.evaluate(() => {
  const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), w: Math.round(b.width), h: Math.round(b.height) }; };
  const root = document.scrollingElement, nav = document.querySelector('.main-nav');
  return { vw: innerWidth, vh: innerHeight, docH: root.scrollHeight, docW: root.scrollWidth, scrollTop: root.scrollTop, top: r('.top-bar'), nav: r('.main-nav'), navOverflowX: nav ? nav.scrollWidth > nav.clientWidth + 1 : null, bar: r('.alpha-round-bar'), map: r('.map-stage'), council: r('.alpha-council'), inspector: r('.alpha-inspector'), phaseBtn: r('.alpha-round-bar button') };
});

const browser = await chromium.launch({ headless: true });
log('## matches');
const two = await startMatch(2), six = await startMatch(6);
const [A, B] = two.players;

log('## viewports');
{
  const { context, page } = await open(browser, A, two.roomId);
  for (const [w, h, label] of [[1366, 768, 'desktop'], [1440, 900, 'desktop'], [1920, 1080, 'desktop'], [1152, 720, 'zoom125%-of-1440x900'], [960, 600, 'zoom150%-of-1440x900'], [1024, 768, 'tablet-landscape'], [768, 1024, 'tablet-portrait'], [390, 844, 'phone']]) {
    await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(300);
    const m = await metrics(page);
    const verdict = { size: `${w}x${h}`, label, ...m, globalScroll: m.docH > m.vh + 1, horizontalOverflow: m.docW > m.vw + 1 };
    out.viewports.push(verdict);
    await page.screenshot({ path: `${SHOTS}/vp-${w}x${h}.png` });
    log(`  ${w}x${h} ${label}: docH ${m.docH}/${m.vh} docW ${m.docW}/${m.vw} navOverflowX ${m.navOverflowX} phaseBtn ${JSON.stringify(m.phaseBtn)}`);
  }
  await context.close();
}

log('## map behaviour');
{
  const { context, page } = await open(browser, A, two.roomId);
  const vb = () => page.locator('svg.world-map').getAttribute('viewBox');
  const valid = s => !!s && s.split(' ').length === 4 && s.split(' ').every(n => Number.isFinite(Number(n))) && Number(s.split(' ')[2]) > 0 && Number(s.split(' ')[3]) > 0;
  const samples = [{ step: 'initial', viewBox: await vb() }];
  const zin = page.getByRole('button', { name: 'Aumentar zoom' }), zout = page.getByRole('button', { name: 'Diminuir zoom' }), fit = page.getByRole('button', { name: 'Centralizar', exact: true });
  for (let i = 0; i < 12; i++) await zin.click(); samples.push({ step: '12x zoom in (max)', viewBox: await vb() });
  await zin.click(); samples.push({ step: '13th zoom in (must not change)', viewBox: await vb() });
  for (let i = 0; i < 25; i++) await zout.click(); samples.push({ step: '25x zoom out (min)', viewBox: await vb() });
  await zout.click(); samples.push({ step: 'extra zoom out (must not change)', viewBox: await vb() });
  await fit.click(); samples.push({ step: 'Centralizar', viewBox: await vb() });
  await zin.click(); await zin.click();
  const box = await page.locator('svg.world-map').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 180, box.y + box.height / 2 + 90, { steps: 8 }); await page.mouse.up();
  samples.push({ step: 'pan after zoom', viewBox: await vb() });
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x - 5000, box.y - 5000, { steps: 4 }); await page.mouse.up();
  samples.push({ step: 'extreme pan (clamped?)', viewBox: await vb() });
  await fit.click(); samples.push({ step: 'Centralizar again', viewBox: await vb() });
  out.map.samples = samples; out.map.allValid = samples.every(s => valid(s.viewBox));
  out.map.zoomLimitsHold = samples[1].viewBox === samples[2].viewBox && samples[3].viewBox === samples[4].viewBox;
  out.map.fitRestores = samples[6].viewBox === samples[0].viewBox || samples.at(-1).viewBox === samples[0].viewBox;
  log('  viewBox valid everywhere:', out.map.allValid, '| limits hold:', out.map.zoomLimitsHold, '| fit restores:', out.map.fitRestores);
  // selection: pointer, keyboard Enter and Space, change selection
  const hexes = page.locator('svg.world-map g.hex[role=button]');
  const count = await hexes.count();
  await hexes.nth(0).click(); const first = await page.locator('.alpha-inspector').innerText();
  await hexes.nth(Math.min(3, count - 1)).focus(); await page.keyboard.press('Enter'); const viaEnter = await page.locator('g.hex.selected').count();
  await hexes.nth(Math.min(2, count - 1)).focus(); await page.keyboard.press('Space'); const viaSpace = await page.locator('g.hex.selected').count();
  out.map.selection = { hexCount: count, oneSelectedAfterEnter: viaEnter === 1, oneSelectedAfterSpace: viaSpace === 1, inspectorChanged: first.length > 0 };
  log('  selection', JSON.stringify(out.map.selection));
  // reduced motion + zoom cost
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const t0 = Date.now(); for (let i = 0; i < 20; i++) await zin.click(); await fit.click(); out.perf.mapZoom21ClicksMs = Date.now() - t0;
  await page.screenshot({ path: `${SHOTS}/map-after-interaction.png` });
  await context.close();
}

log('## privacy of the DOM: A must not learn anything about B');
{
  const bView = (await B.get(two.roomId)).value.game, aView = (await A.get(two.roomId)).value.game;
  const aTiles = new Set([...aView.view.visibleTerritory, ...aView.knownTerritory, ...aView.frontier].map(t => t.id));
  const secrets = new Set();
  for (const t of bView.view.visibleTerritory) if (!aTiles.has(t.id)) secrets.add(`hex:${t.id}`);
  const roster = new Set(aView.players.map(p => p.name));
  for (const c of bView.view.player.civilization.cities) { secrets.add(`cityId:${c.id}`); if (!roster.has(c.name)) secrets.add(`cityName:${c.name}`); }
  for (const u of bView.units.filter(u => u.ownerId === bView.self.playerId)) secrets.add(`unit:${u.id}`);
  for (const id of bView.self.hand) secrets.add(`hand:${id}`); for (const id of bView.self.ambitions) secrets.add(`ambition:${id}`);
  secrets.add(`civ:${bView.self.civilization}`);
  const { context, page } = await open(browser, A, two.roomId);
  const html = await page.content();
  const apiJson = JSON.stringify(aView);
  const hits = [];
  for (const s of secrets) { const needle = s.split(':').slice(1).join(':'); if (!needle) continue; const quoted = `"${needle}"`; if (apiJson.includes(quoted)) hits.push({ where: 'api', s }); if (html.includes(`>${needle}<`) || html.includes(`"${needle}"`) || (s.startsWith('hex:') && (html.includes(`aria-label="`) && new RegExp(`aria-label="[^"]*\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(html)))) hits.push({ where: 'dom', s }); }
  // unknown hexes: no terrain word, owner or city in title/aria/class for tiles A cannot see
  const leakyUnknown = await page.evaluate(() => Array.from(document.querySelectorAll('svg.world-map g.hex')).filter(g => /terrain-UNKNOWN|terrain-\?/.test(g.getAttribute('class') ?? '') || (g.querySelector('title')?.textContent ?? '').includes('Desconhecido')).map(g => ({ cls: g.getAttribute('class'), aria: g.getAttribute('aria-label'), title: g.querySelector('title')?.textContent })).slice(0, 4));
  const unknownTiles = await page.evaluate(() => Array.from(document.querySelectorAll('svg.world-map g.hex.terrain-UNKNOWN')).map(g => ({ cls: g.getAttribute('class'), aria: g.getAttribute('aria-label'), title: g.querySelector('title')?.textContent, text: g.textContent.trim() })));
  out.privacy = { secretsChecked: secrets.size, hits, unknownTilesSample: unknownTiles.slice(0, 4), unknownTilesCount: unknownTiles.length, unknownWithOwnerOrControl: unknownTiles.filter(t => /owner-[1-9]/.test(t.cls) || /Controle: (?!nenhum)/.test(t.title ?? '')).length };
  log('  secrets checked', secrets.size, 'hits', JSON.stringify(hits), '| unknown tiles', unknownTiles.length, JSON.stringify(unknownTiles[0] ?? null));
  await context.close();
}

log('## accessibility');
{
  const { context, page } = await open(browser, A, two.roomId);
  const a11y = await page.evaluate(() => {
    const name = e => (e.getAttribute('aria-label') || e.getAttribute('title') || e.textContent || '').trim();
    const buttonsNoName = Array.from(document.querySelectorAll('button')).filter(b => !name(b)).length;
    const inputs = Array.from(document.querySelectorAll('input,select,textarea')).filter(i => !(i.labels?.length || i.getAttribute('aria-label') || i.getAttribute('aria-labelledby'))).map(i => i.outerHTML.slice(0, 90));
    const hexNoLabel = Array.from(document.querySelectorAll('svg.world-map g[role=button]')).filter(g => !g.getAttribute('aria-label')).length;
    const hexNoTab = Array.from(document.querySelectorAll('svg.world-map g[role=button]')).filter(g => g.getAttribute('tabindex') !== '0').length;
    const svgNoLabel = Array.from(document.querySelectorAll('svg[role=img]')).filter(s => !s.getAttribute('aria-label')).length;
    const headings = Array.from(document.querySelectorAll('h1,h2,h3')).map(h => h.tagName).join('');
    const h1 = document.querySelectorAll('h1').length;
    const lang = document.documentElement.lang;
    const nav = !!document.querySelector('nav[aria-label]'), main = !!document.querySelector('main');
    const ratio = (fg, bg) => { const p = c => { const m = c.match(/\d+(\.\d+)?/g).map(Number); return m.slice(0, 3).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); }; const L = c => { const [r, g, b] = p(c); return .2126 * r + .7152 * g + .0722 * b; }; const a = L(fg), b = L(bg); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); };
    const bgOf = e => { let n = e; while (n) { const c = getComputedStyle(n).backgroundColor; if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c; n = n.parentElement; } return 'rgb(16,25,29)'; };
    const contrast = Array.from(document.querySelectorAll('.top-bar small, .main-nav button, .alpha-council small, .alpha-council h3, .eyebrow, .muted, .alpha-army small, .tabs button, .alpha-round-bar small, label')).slice(0, 80).map(e => ({ cls: (e.className || e.tagName).toString().slice(0, 40), text: e.textContent.trim().slice(0, 24), ratio: Number(ratio(getComputedStyle(e).color, bgOf(e)).toFixed(2)), size: parseFloat(getComputedStyle(e).fontSize) })).filter(x => x.text);
    return { buttonsNoName, inputsWithoutLabel: inputs, hexNoLabel, hexNoTab, svgNoLabel, headings, h1, lang, nav, main, lowContrast: contrast.filter(c => c.ratio < 4.5).slice(0, 12), contrastSampled: contrast.length };
  });
  // tab order and focus visibility
  const order = []; await page.locator('body').click({ position: { x: 5, y: 5 } });
  for (let i = 0; i < 26; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); return { tag: e.tagName.toLowerCase(), label: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 28), outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0, shadow: cs.boxShadow !== 'none' }; })); }
  a11y.tabOrder = order.map(o => `${o.tag}:${o.label}${o.outline || o.shadow ? '' : ' [NO FOCUS RING]'}`);
  a11y.noFocusRing = order.filter(o => !o.outline && !o.shadow).length;
  out.a11y = a11y;
  log('  ', JSON.stringify({ ...a11y, tabOrder: undefined, lowContrast: a11y.lowContrast.length }));
  await context.close();
}

log('## performance: 2 vs 6 players');
{
  for (const [label, match] of [['2p', two], ['6p', six]]) {
    const { context, page } = await open(browser, match.players[0], match.roomId);
    const client = await context.newCDPSession(page); await client.send('Performance.enable');
    let requests = 0; page.on('request', r => { if (r.url().includes('/api/alpha')) requests++; });
    const t0 = Date.now(); await page.waitForTimeout(15000);
    const perf = await client.send('Performance.getMetrics'); const m = Object.fromEntries(perf.metrics.map(x => [x.name, x.value]));
    const domNodes = await page.evaluate(() => document.querySelectorAll('*').length);
    out.perf[label] = { pollingRequestsPer15s: requests, polls: `${(requests / 15 * 60).toFixed(1)}/min`, jsHeapMB: Number((m.JSHeapUsedSize / 1048576).toFixed(1)), domNodes, layoutCount: m.LayoutCount, recalcStyleCount: m.RecalcStyleCount, taskDurationS: Number(m.TaskDuration.toFixed(2)) };
    log(' ', label, JSON.stringify(out.perf[label]));
    await context.close();
  }
}
await browser.close();
writeFileSync('docs/audit/evidence/alpha-full-audit/results/s7-ui.json', JSON.stringify(out, null, 1));
log('console errors/warnings:', out.console.length, 'page errors:', out.pageErrors.length, '4xx on /api:', out.requests4xx.length);

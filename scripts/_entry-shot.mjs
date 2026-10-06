import { chromium } from '@playwright/test';
const b = await chromium.launch();
for (const [w, h, n] of [[1366, 768, 'desk'], [390, 844, 'mob']]) { const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); await p.goto(process.env.URL ?? 'http://127.0.0.1:3001/alpha'); await p.waitForTimeout(900); await p.screenshot({ path: `/tmp/entry-${process.env.TAG ?? 'old'}-${n}.png`, fullPage: true }); }
await b.close();

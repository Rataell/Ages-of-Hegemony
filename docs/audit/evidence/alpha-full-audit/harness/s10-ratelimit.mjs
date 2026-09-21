// Rate limits (Part Y): anonymous, guest, global create/join. Small bursts only (≤ 40 requests), no destructive load; every bucket recovers.
import { Player, BASE, sleep, defaultCreate, okOrThrow, save, check, finding } from './lib.mjs';

const out = {};
const hit = async (method, path, { cookie = '', body, headers = {} } = {}) => {
  const started = Date.now();
  const response = await fetch(`${BASE}${path}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json', Origin: BASE } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const text = await response.text(); let json = null; try { json = JSON.parse(text); } catch { /* text */ }
  return { status: response.status, retryAfter: response.headers.get('retry-after'), cacheControl: response.headers.get('cache-control'), code: json?.error?.code ?? null, message: json?.error?.message ?? null, text, setCookie: response.headers.getSetCookie?.()[0]?.split(';')[0], ms: Date.now() - started };
};
const unknownRoom = '/api/alpha?gameId=00000000-0000-0000-0000-000000000000';

// a legitimate guest first (its session must survive an anonymous flood)
const A = new Player('Guest A'), B = new Player('Guest B');
const roomA = okOrThrow(await A.create(defaultCreate({ seatLimit: 2 })), 'create A');
okOrThrow(await B.join(roomA.joinCode), 'join B');

console.log('## 1 · anonymous flood (no cookie), 40 GETs back to back');
{
  const statuses = []; let first429 = null, sample = null;
  for (let i = 0; i < 40; i++) { const r = await hit('GET', unknownRoom); statuses.push(r.status); if (r.status === 429 && !first429) { first429 = i + 1; sample = r; } }
  const counts = statuses.reduce((m, s) => { m[s] = (m[s] ?? 0) + 1; return m; }, {});
  console.log('  statuses', JSON.stringify(counts), 'first 429 at request', first429);
  out.anonymous = { counts, first429, retryAfter: sample?.retryAfter, code: sample?.code, message: sample?.message, cacheControl: sample?.cacheControl, body: sample?.text.slice(0, 200) };
  check('anonymous requests are limited (429 appears)', first429 !== null, `first 429 at #${first429}`);
  check('429 carries Retry-After', Boolean(sample?.retryAfter), `Retry-After ${sample?.retryAfter}`);
  check('429 is a coded, readable JSON error', Boolean(sample?.code) && Boolean(sample?.message), `${sample?.code}: ${sample?.message}`);
  check('429 is not cacheable', /no-store/.test(sample?.cacheControl ?? ''), sample?.cacheControl ?? 'no header');
  check('429 body leaks no internals', !/stack|at \/|node_modules|Prisma|postgres/i.test(sample?.text ?? ''));

  console.log('\n## 2 · while the anonymous bucket is exhausted');
  const guest = await hit('GET', `/api/alpha?gameId=${roomA.id}`, { cookie: A.cookie });
  check('a guest with a valid session is NOT blocked by the anonymous flood', guest.status === 200, String(guest.status));
  const create = await hit('POST', '/api/alpha', { body: { operation: 'create', payload: defaultCreate() } });
  out.createWhileFlooded = create.status;
  check('a brand-new visitor cannot create a table while the shared anonymous bucket is exhausted (documents the shared-bucket risk)', create.status === 429, String(create.status));
  if (create.status === 429) finding('RL-1', 'P2', 'Segurança/Disponibilidade', 'O balde anônimo (30/min) e o balde global de criar/entrar (20/min) são compartilhados por TODOS os visitantes: um único cliente sem cookie pode impedir que qualquer pessoa nova crie ou entre em uma mesa por até 60 s. Aceitável para uma Alpha fechada; risco real se o link for público.', { anonymousFirst429: first429 });

  console.log('\n## 3 · recovery timing (poll every 5 s)');
  const t0 = Date.now(); let recoveredAfter = null;
  for (let s = 0; s < 14; s++) { await sleep(5000); const r = await hit('GET', unknownRoom); if (r.status !== 429) { recoveredAfter = Math.round((Date.now() - t0) / 1000); break; } }
  out.anonymousRecoverySeconds = recoveredAfter;
  console.log('  recovered after ~', recoveredAfter, 's (Retry-After said', sample?.retryAfter, ')');
  check('the anonymous bucket recovers on its own', recoveredAfter !== null, `${recoveredAfter}s`);
  if (recoveredAfter !== null && Number(sample?.retryAfter) - recoveredAfter > 15) finding('RL-2', 'P3', 'Segurança', `Retry-After é fixo em ${sample.retryAfter}s, mas a janela deslizante liberou em ~${recoveredAfter}s: o cliente espera mais que o necessário.`, { retryAfter: sample.retryAfter, recoveredAfter });
}

console.log('\n## 4 · guest burst: 130 polls from one session');
{
  await sleep(1500);
  const statuses = []; let first429 = null, sample = null;
  for (let i = 0; i < 130; i++) { const r = await hit('GET', `/api/alpha?gameId=${roomA.id}`, { cookie: A.cookie }); statuses.push(r.status); if (r.status === 429 && !first429) { first429 = i + 1; sample = r; } }
  const counts = statuses.reduce((m, s) => { m[s] = (m[s] ?? 0) + 1; return m; }, {});
  console.log('  statuses', JSON.stringify(counts), 'first 429 at', first429);
  out.guestBurst = { counts, first429, retryAfter: sample?.retryAfter, code: sample?.code };
  check('one guest is limited near 120/min', first429 !== null && first429 >= 100 && first429 <= 125, `#${first429}`);
  const other = await hit('GET', `/api/alpha?gameId=${roomA.id}`, { cookie: B.cookie });
  check("another guest is unaffected by A's burst (per-session bucket)", other.status === 200, String(other.status));
  const write = await hit('POST', '/api/alpha', { cookie: A.cookie, body: { operation: 'lobby', gameId: roomA.id, payload: { type: 'LOBBY_READY', ready: true, expectedVersion: 1 } } });
  out.writeWhileLimited = write.status;
  check('the limited guest is also refused for writes (one bucket for the session)', write.status === 429, String(write.status));
}

console.log('\n## 5 · burst of table creations from distinct visitors (global create/join bucket)');
{
  await sleep(62000);
  const results = [];
  for (let i = 0; i < 26; i++) results.push((await hit('POST', '/api/alpha', { body: { operation: 'create', payload: defaultCreate({ displayName: `Burst ${i}`, name: `Burst ${i}` }) } })).status);
  const counts = results.reduce((m, s) => { m[s] = (m[s] ?? 0) + 1; return m; }, {});
  const accepted = results.filter(s => s === 200).length;
  console.log('  statuses', JSON.stringify(counts));
  out.createBurst = { counts, accepted };
  check('table creation is capped near 20/min', accepted >= 15 && accepted <= 21 && results.includes(429), `${accepted} accepted`);
  check('nothing but 200 and 429 came back (no 5xx)', results.every(s => s === 200 || s === 429));
}
save('s10-ratelimit', { out });

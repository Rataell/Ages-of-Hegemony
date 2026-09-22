// Audit harness: talks to a running local alpha over real HTTP, one cookie jar per player. No forged identities:
// every session is issued by the server through create/join. Every request is logged so 4xx/5xx can be classified.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const BASE = (process.env.AUDIT_URL ?? 'http://127.0.0.1:3002').replace(/\/$/, '');
export const RESULTS = join(process.env.AUDIT_OUT ?? 'docs/audit/evidence/alpha-full-audit/results');
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Sliding window that waits instead of tripping the server's own limits (create/join 20/min global, anonymous 30/min, guest 120/min). */
class Bucket {
  constructor(max, windowMs = 60000) { this.max = max; this.windowMs = windowMs; this.hits = []; }
  async take() {
    for (;;) {
      const now = Date.now(); this.hits = this.hits.filter(t => now - t < this.windowMs);
      if (this.hits.length < this.max) { this.hits.push(now); return; }
      await sleep(this.hits[0] + this.windowMs - now + 50);
    }
  }
}
const newOrJoin = new Bucket(17), anonymous = new Bucket(26);
export const LOG = [];
export const FINDINGS = [];
export const finding = (id, severity, area, text, extra = {}) => { FINDINGS.push({ id, severity, area, text, ...extra }); console.log(`  !! ${id} [${severity}] ${area}: ${text}`); };
export const check = (label, condition, detail = '') => { console.log(`  ${condition ? 'ok  ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`); if (!condition) FINDINGS.push({ id: `CHECK`, severity: '?', area: 'check', text: `${label} ${detail}` }); return condition; };

export class Player {
  constructor(name) { this.name = name; this.cookie = ''; this.guest = new Bucket(105); this.seat = null; }
  /** expect: array of acceptable HTTP statuses; anything else is logged UNEXPECTED. */
  async post(body, { origin = BASE, headers = {}, expect = [200], cookie = this.cookie, raw = null, type = 'application/json', tag = '' } = {}) {
    const op = body?.operation ?? 'raw';
    if (op === 'create' || op === 'join') await newOrJoin.take();
    if (cookie) await this.guest.take(); else await anonymous.take();
    const response = await fetch(`${BASE}/api/alpha`, { method: 'POST', headers: { 'Content-Type': type, ...(origin ? { Origin: origin } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers }, body: raw ?? JSON.stringify(body) });
    return this.finish('POST', op, tag, response, expect);
  }
  async get(gameId, { expect = [200], cookie = this.cookie, headers = {}, tag = '' } = {}) {
    if (cookie) await this.guest.take(); else await anonymous.take();
    const response = await fetch(`${BASE}/api/alpha?gameId=${gameId}`, { headers: { ...(cookie ? { Cookie: cookie } : {}), ...headers } });
    return this.finish('GET', 'read', tag, response, expect);
  }
  async finish(method, op, tag, response, expect) {
    let json = null, text = '';
    try { text = await response.text(); json = JSON.parse(text); } catch { /* not json */ }
    const setCookie = response.headers.getSetCookie?.()[0]?.split(';')[0];
    if (setCookie && !this.cookie) this.cookie = setCookie;
    const code = json?.error?.code ?? null, entry = { who: this.name, method, op, tag, status: response.status, code, expected: expect.includes(response.status), retryAfter: response.headers.get('retry-after') };
    LOG.push(entry);
    return { status: response.status, json, ok: json?.ok === true, value: json?.value, error: json?.error, headers: response.headers, text };
  }
  async create(payload) { return this.post({ operation: 'create', payload }); }
  async join(code, displayName = this.name, opts = {}) { return this.post({ operation: 'join', code, displayName }, opts); }
  lobby(gameId, payload, opts = {}) { return this.post({ operation: 'lobby', gameId, payload }, opts); }
  command(gameId, payload, opts = {}) { return this.post({ operation: 'command', gameId, payload }, opts); }
}
export const okOrThrow = (reply, label) => { if (!reply.ok) throw new Error(`${label}: ${reply.status} ${JSON.stringify(reply.error)}`); return reply.value; };
export const defaultCreate = (over = {}) => ({ name: 'Auditoria', displayName: 'Jogador A', preset: 'QUICK', worldPreset: 'MIXED', seatLimit: 2, seed: 7, planningSeconds: 0, ...over });

/** Creates a table with `count` players, every player through the real create/join flow. */
export async function seat(count, over = {}) {
  const players = Array.from({ length: count }, (_, i) => new Player(`Jogador ${'ABCDEF'[i]}`));
  const created = okOrThrow(await players[0].create(defaultCreate({ seatLimit: count, ...over })), 'create');
  let view = created;
  for (const p of players.slice(1)) view = okOrThrow(await p.join(created.joinCode), `join ${p.name}`);
  return { players, roomId: created.id, code: created.joinCode, view };
}
const CIV = ['aurelia', 'valgard', 'meridia', 'thalos', 'saren', 'kor', 'orinth', 'nymara', 'veyra', 'solenne', 'dravik', 'elyra'];
export async function startMatch(count, over = {}) {
  const { players, roomId, code } = await seat(count, over);
  let version = (await players[0].get(roomId)).value.version;
  for (const [i, p] of players.entries()) {
    const chosen = okOrThrow(await p.lobby(roomId, { type: 'CHOOSE_CIVILIZATION', expectedVersion: version, civilization: CIV[i] }), 'choose'); version = chosen.version;
    const ready = okOrThrow(await p.lobby(roomId, { type: 'LOBBY_READY', expectedVersion: version, ready: true }), 'ready'); version = ready.version;
  }
  const started = okOrThrow(await players[0].lobby(roomId, { type: 'START', expectedVersion: version }), 'start');
  return { players, roomId, code, view: started };
}
export function save(name, extra = {}) {
  writeFileSync(join(RESULTS, `${name}.json`), JSON.stringify({ generatedAt: new Date().toISOString(), base: BASE, findings: FINDINGS, requests: LOG.length, ...extra, log: LOG }, null, 1));
}
export function summarizeLog() {
  const by = {}; for (const e of LOG) { const k = `${e.status}${e.code ? ' ' + e.code : ''}`; by[k] = by[k] ?? { total: 0, unexpected: 0 }; by[k].total++; if (!e.expected) by[k].unexpected++; }
  return by;
}

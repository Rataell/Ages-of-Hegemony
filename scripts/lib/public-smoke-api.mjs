// Tiny HTTP client for the public smoke of a deployed Alpha: guest cookies in memory, the access code only from the environment, nothing secret is ever printed.
export const BASE = (process.env.ALPHA_BASE_URL ?? '').replace(/\/$/, '');
export const CODE = process.env.ALPHA_ACCESS_CODE ?? '';
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export const checks = [];
export const check = (name, ok, extra = '') => { checks.push({ name, ok: !!ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' · ' + extra : ''}`); if (!ok) process.exitCode = 1; };
export class Seat {
  constructor(label, cookie = '') { this.label = label; this.cookie = cookie; }
  async call(body, tries = 5) {
    for (let attempt = 0; attempt < tries; attempt++) {
      const response = await fetch(`${BASE}/api/alpha`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: BASE, Cookie: this.cookie }, body: JSON.stringify(body) });
      const set = response.headers.get('set-cookie'); if (set) this.cookie = set.split(';')[0];
      const payload = await response.json().catch(() => ({ ok: false, error: { code: 'BAD_JSON', message: String(response.status) } }));
      if (response.status === 429) { await sleep(11_000); continue; }
      return payload;
    }
    return { ok: false, error: { code: 'RATE', message: 'rate limited' } };
  }
  async get(gameId, extra = '') {
    const response = await fetch(`${BASE}/api/alpha?gameId=${gameId}${extra}`, { headers: { Cookie: this.cookie }, cache: 'no-store' });
    return response.json();
  }
}
export const lobby = async (seat, id, payload) => { const v = (await seat.get(id)).value; return seat.call({ operation: 'lobby', gameId: id, payload: { expectedVersion: v.version, ...payload } }); };
/** One planning step of a human seat: ambitions, pending choices, one Produzir (or Governar in Revolta) in the seat's capital, then READY. */
export async function playStep(seat, id, index) {
  const view = (await seat.get(id)).value, g = view.game; if (!g || view.lifecycle === 'FINISHED') return null;
  if (!g.self.ambitionsChosen) { await seat.call({ operation: 'command', gameId: id, payload: { type: 'CHOOSE_AMBITIONS', expectedVersion: g.version, cardIds: g.self.ambitions.slice(0, 2) } }); return 'ambitions'; }
  const choice = g.self.pendingChoices[0];
  if (choice) { await seat.call({ operation: 'command', gameId: id, payload: { type: 'RESOLVE_CHOICE', expectedVersion: g.version, choiceId: choice.id, optionId: choice.options[0].id } }); return 'choice'; }
  if (g.self.ready) return 'waiting';
  if (g.actions.used === 0 && g.actions.reserved === 0) {
    const revolt = g.cityStates?.find(city => city.cityId === `capital-${index + 1}`)?.moodBand === 'REVOLT';
    await seat.call({ operation: 'command', gameId: id, payload: { type: 'URBAN_ACTION', expectedVersion: g.version, cityId: `capital-${index + 1}`, action: revolt ? 'CIVIC_ACTION' : 'PRODUCE' } });
  }
  const fresh = (await seat.get(id)).value.game;
  await seat.call({ operation: 'command', gameId: id, payload: { type: 'READY', expectedVersion: fresh.version } });
  return 'ready';
}

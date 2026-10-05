/* global setTimeout, setInterval, clearInterval, localStorage, document, innerWidth, innerHeight */
// DEV-ONLY human-like UI playtest. Plays real Closed Alpha sessions (2/4/6 seats) against `npm run dev:alpha` through the
// browser only: every action is a click on the real screen. The driver READS what the screen already shows (the projection
// the UI itself polls, captured from the page's own network responses, so it adds no requests) and decides like a person:
// inspect the options, pick by the seat's strategy, act, confirm. It never POSTs a command and never calls engine code.
//
//   node scripts/alpha-ui-playtest.mjs --players=2 --preset=QUICK --rounds=12 --out=docs/evidence/v51b-ui-playtest/run-2p
//   options: --players=2|4|6  --preset=QUICK|STANDARD  --rounds=N (stop after N rounds)  --out=DIR  --headed  --reveal
//            --personas=scholar,diplomat,...  (strategy per seat; default cycles expansionist,warrior,scholar,trader,diplomat,builder)
//            --viewport=1366x768  --shots=natural (screenshot the first time each milestone appears)
// Output (in --out): session.json (per-round client-observed telemetry, contact metrics, friction log), shots/*.png.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { ADVANCEMENTS, HERITAGE_ADVANCES } from '@aoh/game-domain';
const KIND_LABEL = { EXPLORER: 'Explorador', PIONEER: 'Pioneiro', ENVOY: 'Enviado', INFANTRY: 'Infantaria', GUARD: 'Guarda', RANGED: 'Arqueiros', CAVALRY: 'Cavalaria', SIEGE: 'Cerco', FLEET: 'Frota', COASTAL_VESSEL: 'Embarcação' };

const arg = new Map(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const PORT = Number(process.env.ALPHA_LOCAL_PORT ?? 3001), BASE = `http://127.0.0.1:${PORT}`;
const N = Number(arg.get('players') ?? 2), PRESET = String(arg.get('preset') ?? 'QUICK'), MAX_ROUNDS = Number(arg.get('rounds') ?? 9999);
const OUT = String(arg.get('out') ?? `docs/evidence/v51b-ui-playtest/run-${N}p`), SHOTS = `${OUT}/shots`;
const MAP_DIR = arg.get('map-shots') ? String(arg.get('map-shots')) : null;
const [VW, VH] = String(arg.get('viewport') ?? '1366x768').split('x').map(Number);
mkdirSync(SHOTS, { recursive: true });
const nap = ms => new Promise(r => setTimeout(r, ms));
const LETTERS = 'ABCDEF';
const PERSONAS = arg.get('personas') ? String(arg.get('personas')).split(',') : ['expansionist', 'warrior', 'scholar', 'trader', 'diplomat', 'builder'];
// What each seat tries first, in order. A person would not do everything every round; neither does the driver.
const PRIORITY = {
  expansionist: ['settle', 'move-pioneer', 'explore', 'move-explorer', 'elevate', 'recruit-pioneer', 'produce', 'research', 'govern', 'build'],
  warrior: ['attack', 'recruit-army', 'fortify', 'move-army', 'explore', 'move-explorer', 'produce', 'research', 'elevate', 'govern'],
  scholar: ['research', 'build-academic', 'produce', 'explore', 'move-explorer', 'settle', 'move-pioneer', 'elevate', 'govern', 'settle'],
  trader: ['trade-route', 'build-commercial', 'research', 'produce', 'explore', 'move-explorer', 'move-pioneer', 'elevate', 'settle', 'govern'],
  diplomat: ['explore', 'move-explorer', 'move-pioneer', 'research', 'produce', 'elevate', 'govern', 'settle', 'build'],
  builder: ['elevate', 'build', 'produce', 'research', 'govern', 'explore', 'move-explorer', 'move-pioneer', 'settle'],
};
const RESEARCH_PREF = {
  expansionist: ['web-agriculture', 'web-coastal-navigation', 'web-irrigation', 'web-cartography', 'web-masonry'],
  warrior: ['web-guard-formations', 'web-masonry', 'web-metallurgy', 'web-maneuver-training', 'web-engineering', 'web-fortification'],
  scholar: ['web-writing', 'web-common-narratives', 'web-codes', 'web-centralization', 'web-mathematics', 'web-natural-philosophy', 'web-experimental-method'],
  trader: ['web-exchange', 'web-currency', 'web-regional-market', 'web-logistics', 'web-bank'],
  diplomat: ['web-common-narratives', 'web-codes', 'web-urbanism', 'web-exchange'],
  builder: ['web-masonry', 'web-agriculture', 'web-engineering', 'web-codes', 'web-urbanism'],
};

const closeLivro = async seat => {
  // 'Voltar ao mapa' is inside the Livro; the strip's Livro toggle can sit under an error banner
  if (await seat.page.getByRole('dialog', { name: 'Livro' }).isVisible().catch(() => false)) await seat.click(seat.page.getByRole('dialog', { name: 'Livro' }).getByRole('button', { name: 'Voltar ao mapa' }), 'close Livro', { optional: true, timeout: 1500 });
};
class Seat {
  constructor(index, browser) { this.index = index; this.label = `Jogador ${LETTERS[index]}`; this.persona = PERSONAS[index % PERSONAS.length]; this.browser = browser; this.room = null; this.friction = []; this.actions = 0; this.rounds = new Map(); this.shots = new Set(); }
  get game() { return this.room?.game ?? null; }
  async open() {
    this.context = await this.browser.newContext({ viewport: { width: VW, height: VH } });
    await this.context.addInitScript(() => { try { localStorage.setItem('aoh-tour-off', '1'); } catch { /* storage blocked */ } });
    this.page = await this.context.newPage(); this.page.setDefaultTimeout(8000);
    this.page.on('response', async response => {
      if (!response.url().includes('/api/alpha') || response.url().includes('/health')) return;
      try { const json = await response.json(); if (json?.ok && json.value?.game) this.room = json.value; else if (json?.ok && json.value?.id) this.room = json.value; } catch { /* body not json */ }
    });
    this.page.on('pageerror', error => this.note('pageerror', error.message));
  }
  note(kind, text) {
    const entry = { round: this.game?.view?.round ?? 0, phase: this.game?.phase ?? '-', kind, text };
    this.friction.push(entry);
    if (kind !== 'ready-check' && (this.frictionShots = (this.frictionShots ?? 0) + 1) <= 14) { entry.shot = `friction-${this.label.slice(-1)}-${this.frictionShots}.png`; this.page.screenshot({ path: `${SHOTS}/${entry.shot}` }).catch(() => {}); }
  }
  /** One real click. Records the friction when the control is missing, covered or disabled instead of working around it. */
  async click(locator, what, { timeout = 4000, optional = false } = {}) {
    const target = locator.first();
    try {
      await target.waitFor({ state: 'visible', timeout });
      await target.click({ timeout });
      this.actions++; await nap(180); return true;
    } catch (error) {
      if (!optional) this.note('click-failed', `${what}: ${String(error.message).split('\n')[0].slice(0, 160)}`);
      return false;
    }
  }
  hex(id) { return this.page.getByRole('button', { name: new RegExp(` ${id.replace(/[-.]/g, '\\$&')}(,|$)`) }); }
  /** Clicks a map hex; a hex hidden under a panel is real friction a person would feel (they would fold the panel). */
  async clickHex(id, what) {
    const target = this.hex(id).first();
    try { await target.waitFor({ state: 'attached', timeout: 3000 }); await target.click({ timeout: 2500 }); this.actions++; await nap(200); return true; }
    catch (error) {
      const text = String(error.message);
      if (/intercepts pointer events|outside of the viewport/.test(text)) {
        this.note('hex-covered', `${what}: hex ${id} is covered by an overlay; folding the inspector like a person would`);
        if (await this.click(this.page.getByRole('button', { name: 'Fechar cartão' }), 'fold inspector', { optional: true })) {
          try { await target.click({ timeout: 2500 }); this.actions++; await nap(200); return true; } catch { /* still blocked */ }
        }
      }
      this.note('hex-click-failed', `${what}: ${id}: ${text.split('\n')[0].slice(0, 120)}`);
      return false;
    }
  }
  /** The banner the UI shows when two seats acted at once and the retry also lost the race (compare-and-swap). A person just tries again. */
  async conflictBanner() {
    const banner = this.page.getByText('Estado atualizado por outra ação', { exact: false }).first();
    if (!await banner.isVisible().catch(() => false)) return false;
    this.conflicts = (this.conflicts ?? 0) + 1;
    this.note('version-conflict', 'banner "Estado atualizado por outra ação" after an action; retrying like a person would');
    await this.page.getByRole('button', { name: 'Fechar mensagem' }).click({ timeout: 800 }).catch(() => {});
    await nap(400);
    return true;
  }
  async shot(name) { if (this.shots.has(name)) return; this.shots.add(name); try { await this.page.screenshot({ path: `${SHOTS}/${this.label.replace(' ', '-')}-${name}.png` }); } catch { /* page closing */ } }
  async waitState(predicate, timeout = 6000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) { const g = this.game; if (g && predicate(g)) return true; await nap(150); }
    return false;
  }
}

// ---- helpers over the projection the screen already shows ----
const mine = seat => seat.game.view.player.civilization.cities;
const levelNo = level => ['OUTPOST', 'HAMLET', 'VILLAGE', 'CITY', 'GREAT_CITY', 'METROPOLIS', 'IMPERIAL_METROPOLIS'].indexOf(level) + 1;
const ordersLeft = seat => seat.game.actions.limit - seat.game.actions.reserved;
const hexDist = (a, b) => { const [aq, ar] = a.split(',').map(Number), [bq, br] = b.split(',').map(Number), dq = aq - bq, dr = ar - br; return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)); };

async function dismissOverlays(seat) {
  // the resolution replay of the previous round sits over the map and the tray until 'Continuar'
  await seat.click(seat.page.locator('.alpha-resolution-phase').getByRole('button', { name: /Continuar/ }), 'close resolution replay', { optional: true, timeout: 500 });
  const g = seat.game;
  // Ambitions (first planning). With several seats choosing at the same moment the confirm can lose the version race: try again, like a person.
  for (let attempt = 0; attempt < 6 && g && !seat.game.self.ambitionsChosen && seat.game.self.ambitions.length >= 2; attempt++) {
    const boxes = seat.page.locator('.alpha-modal input[type=checkbox]');
    if (await boxes.count() >= 2) {
      // a person reads the three cards, then picks the two that suit the plan
      await boxes.nth(0).check().catch(() => {}); await boxes.nth(1).check().catch(() => {});
      await seat.click(seat.page.getByRole('button', { name: 'Confirmar duas ambições' }), 'confirm ambitions');
      if (await seat.waitState(x => x.self.ambitionsChosen, 3500)) break;
      await seat.conflictBanner();
    } else {
      await seat.click(seat.page.getByRole('button', { name: 'Escolher ambições' }), 'open ambitions');
    }
  }
  // World event decision lives in Livro > Cartas & Projetos (the ready check points there)
  if (g?.worldEvent && g.worldDecisionPending) {
    await seat.click(seat.page.getByRole('button', { name: 'Livro', exact: true }), 'open Livro');
    await seat.click(seat.page.locator('.alpha-livro-tabs').getByRole('button', { name: 'Cartas & Projetos' }), 'cards tab');
    await seat.click(seat.page.getByRole('button', { name: seat.persona === 'scholar' || seat.persona === 'builder' ? 'Receber 1 Prestígio' : 'Receber recurso' }), 'world choice');
    await seat.waitState(x => !x.worldDecisionPending, 3000);
    await closeLivro(seat);
  }
  // Pending parchments (Pulso response, Repercussão, Encontro)
  for (let guard = 0; guard < 6; guard++) {
    const choices = seat.game?.self.pendingChoices ?? [];
    if (!choices.length) break;
    const options = seat.page.locator('.alpha-parchment-options button, .alpha-choices .alpha-choice button');
    if (!await options.count()) { seat.note('dead-end', `pending choice ${choices[0].id} has no visible parchment buttons`); break; }
    const pick = seat.persona === 'scholar' || seat.persona === 'builder' ? 0 : Math.min(1, (await options.count()) - 1);
    const before = choices.length;
    await seat.click(options.nth(pick), 'resolve choice');
    await seat.waitState(x => x.self.pendingChoices.length < before, 3000);
  }
}

async function selectCity(seat, city) {
  await seat.clickHex(city.hexId, `select city ${city.name}`);
  await seat.click(seat.page.locator('.inspector-tabs').getByRole('button', { name: 'Cidade' }), 'city tab', { optional: true });
}

/** Plans one urban action by opening the same lists a person opens. Returns true when it consumed an Order. */
async function planUrban(seat, city, want) {
  const g = seat.game;
  const groupDefs = [['BUILD'], ['ELEVATE'], ['RECRUIT'], ['RESEARCH'], ['PROMOTE_MOOD', 'SUPPORT_TRADE', 'CIVIC_ACTION', 'MOVE_CAPITAL']];
  const all = g.urban.cities[city.id] ?? [];
  const researchable = g.urban.research;
  const groups = [all.filter(o => o.action === 'BUILD'), all.filter(o => o.action === 'ELEVATE'), all.filter(o => o.action === 'RECRUIT'), researchable, all.filter(o => ['PROMOTE_MOOD', 'SUPPORT_TRADE', 'CIVIC_ACTION', 'MOVE_CAPITAL'].includes(o.action))];
  void groupDefs;
  await selectCity(seat, city);
  const before = g.actions.reserved;
  let ok;
  if (want.kind === 'produce') {
    ok = await seat.click(seat.page.getByRole('button', { name: 'Escolher produzir' }), 'pick produce');
  } else {
    const gi = groups.findIndex(list => list.includes(want.option) || list.some(o => JSON.stringify([o.action, o.build, o.unit, o.advancementId]) === JSON.stringify([want.option.action, want.option.build, want.option.unit, want.option.advancementId])));
    if (gi < 0) { seat.note('option-not-listed', `${want.kind}: option exists in projection but in no UI group`); return false; }
    const index = groups[gi].findIndex(o => JSON.stringify([o.action, o.build, o.unit, o.advancementId]) === JSON.stringify([want.option.action, want.option.build, want.option.unit, want.option.advancementId]));
    const details = seat.page.locator('.alpha-urban details').nth(gi);
    if (!await details.evaluate(d => d.open).catch(() => false)) await seat.click(details.locator('summary'), `open group ${gi}`);
    ok = await seat.click(details.locator('.alpha-urban-pick').nth(index), `pick ${want.kind}`);
  }
  if (!ok) return false;
  const confirm = seat.page.locator('.alpha-urban-detail button.alpha-recommended');
  if (!await seat.click(confirm, 'plan urban action')) return false;
  const done = await seat.waitState(x => x.actions.reserved > before, 4000);
  if (!done) seat.note('plan-no-effect', `${want.kind} in ${city.name}: clicked Planejar but no Order was reserved`);
  return done;
}

async function planResearch(seat) {
  const g = seat.game, open = g.urban.research.filter(o => o.blocked === null);
  if (!open.length || !mine(seat).length) return false;
  const prefs = RESEARCH_PREF[seat.persona];
  const choice = open.find(o => prefs.includes(o.advancementId)) ?? open[0];
  const before = g.actions.reserved;
  await selectCity(seat, mine(seat)[0]);
  // Tabuleiro da Civilização: the same overlay a person opens from the civilization seal
  await seat.click(seat.page.locator('.alpha-strip-civ'), 'open Tabuleiro');
  const dialog = seat.page.getByRole('dialog', { name: 'Tabuleiro da Civilização' });
  if (!await dialog.isVisible().catch(() => false)) return false;
  await seat.shot('tabuleiro-open');
  const advName = ADVANCEMENTS.find(a => a.id === choice.advancementId)?.name ?? HERITAGE_ADVANCES.find(h => h.id === choice.advancementId)?.name ?? '';
  const node = dialog.locator('button.alpha-node, button.alpha-diamond').filter({ hasText: advName });
  let ok = await seat.click(node, `select node ${advName}`);
  if (ok) {
    const why = await dialog.locator('.alpha-node-act small[role=note]').first().innerText().catch(() => '');
    ok = await seat.click(dialog.getByRole('button', { name: /Pesquisar · Ordem Avanço/ }), `research ${advName}`, { timeout: 2000 });
    if (!ok && why) seat.note('disabled-reason', `research ${advName} disabled; the screen says: ${why}`);
  }
  await nap(500);
  await seat.shot('after-research');
  await seat.click(dialog.getByRole('button', { name: 'Voltar ao mapa' }), 'close Tabuleiro', { optional: true });
  if (!ok) return false;
  const done = await seat.waitState(x => x.actions.reserved > before || x.self.research.includes(choice.advancementId), 4000);
  if (!done) seat.note('research-no-effect', `${advName}: button clicked, no Order reserved`);
  return done;
}

/** Clicking a destination hex moves the inspector to the hex; a person goes back to the Militar tab to confirm the order. */
const militaryTab = seat => seat.click(seat.page.locator('.inspector-tabs').getByRole('button', { name: /^Militar/ }), 'military tab', { optional: true, timeout: 800 }).then(() => true);
async function pieceOrder(seat, unit, kind) {
  const g = seat.game, opt = g.unitOptions[unit.id];
  if (!opt) return false;
  const before = g.actions.reserved;
  // the previous order leaves its pieces selected; a person presses 'Limpar seleção' before picking other pieces
  await seat.click(seat.page.getByRole('button', { name: 'Limpar seleção' }).first(), 'clear selection', { optional: true, timeout: 500 });
  for (let attempt = 0; attempt < 3; attempt++) {
    await seat.clickHex(unit.hexId, `select ${unit.kind} stack`);
    await seat.click(seat.page.locator('.inspector-tabs').getByRole('button', { name: /^Militar/ }), 'military tab', { optional: true });
    if (await seat.page.locator('.alpha-inspector .alpha-armies, .alpha-inspector .alpha-order-builder').first().isVisible().catch(() => false)) break;
    if (attempt === 2) seat.note('select-stack-failed', `clicking ${unit.hexId} did not open the army list for ${unit.kind}`);
    await nap(300);
  }
  // clicking a stack may auto-select a different piece of it; clear, then choose exactly this class with its chip
  if (await seat.page.locator('.alpha-inspector .alpha-order-builder').count()) {
    await seat.click(seat.page.locator('.alpha-inspector').getByRole('button', { name: 'Limpar seleção' }).first(), 'clear selection', { optional: true, timeout: 800 });
    await militaryTab(seat); // clearing flips the inspector to Território; a person clicks Militar again
    await nap(250);
  }
  // choose exactly this class of the stack, as a person does with the class chip
  const kindChip = seat.page.locator('.alpha-inspector .alpha-army-classes button').filter({ hasText: new RegExp(`^${KIND_LABEL[unit.kind] ?? unit.kind}`) });
  const needsOne = kind === 'explore' || kind === 'settle';
  const chipText = await kindChip.first().innerText().catch(() => '');
  if (needsOne && /×\s*[2-9]/.test(chipText)) {
    // two pieces of the same class: ordering ONE of them means opening 'ver composição' and ticking it (a real discoverability cost)
    seat.note('single-piece-needs-composition', `${unit.kind} stack of ${chipText.trim()}: one piece can only be picked in 'ver composição'`);
    await seat.click(seat.page.locator('.alpha-inspector .alpha-army summary').filter({ hasText: 'ver composição' }).first(), 'open composition', { optional: true, timeout: 800 });
    await seat.click(seat.page.locator('.alpha-inspector .alpha-piece-row input[type=checkbox]').first(), 'tick one piece', { optional: true, timeout: 800 });
  } else if (await kindChip.count()) await seat.click(kindChip, `select class ${unit.kind}`, { optional: true });
  else await seat.click(seat.page.getByRole('button', { name: /Selecionar( todas)?$/ }), 'select stack', { optional: true });
  const traceSelect = (await seat.page.locator('.alpha-inspector').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 120);
  let ok = false;
  if (kind === 'explore' && opt.explore.length) {
    const target = opt.explore.sort((a, b) => hexDist(a.target, unit.hexId) - hexDist(b.target, unit.hexId))[0];
    ok = await seat.clickHex(target.target, 'explore target') && await militaryTab(seat) && await seat.click(seat.page.getByRole('button', { name: 'Explorar região' }), 'explore region');
  } else if (kind === 'settle' && opt.settleBlock === null) {
    ok = await seat.click(seat.page.getByRole('button', { name: 'Fundar cidade' }), 'found city');
    if (!ok) { const input = seat.page.getByLabel('Nome da nova cidade'); if (await input.count()) { await input.fill(`Nova ${seat.label.slice(-1)}${g.view.round}`); ok = await seat.click(seat.page.getByRole('button', { name: 'Fundar cidade' }), 'found city'); } }
  } else if (kind === 'move') {
    const dest = unit.dest;
    if (dest && !opt.moves[dest]) seat.note('move-unreachable', `${unit.kind}: ${dest} not in highlighted moves`);
    if (dest && opt.moves[dest]) ok = await seat.clickHex(dest, 'move target') && await militaryTab(seat) && await seat.click(seat.page.getByRole('button', { name: 'Reservar movimento' }), 'reserve move');
  } else if (kind === 'attack') {
    ok = await seat.clickHex(unit.target, 'attack target') && await militaryTab(seat) && await seat.click(seat.page.getByRole('button', { name: 'Ordenar ataque' }), 'order attack');
  }
  if (!ok) { const panel = (await seat.page.locator('.alpha-inspector').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 260); seat.note('piece-order-failed', `${kind} with ${unit.kind}@${unit.hexId}${unit.dest ? ' -> ' + unit.dest : ''}${unit.target ? ' -> ' + unit.target : ''} | after-select: ${traceSelect} | now: ${panel}`); return false; }
  return seat.waitState(x => x.actions.reserved > before || x.self.orders.length > 0, 4000);
}

/** Decide the next Order for this seat from the screen's own options. */
function towardFrontier(g, unit, away = []) {
  const regionTargets = new Set((g.unitOptions[unit.id]?.explore ?? []).flatMap(e => [e.target]));
  const reach = Object.keys(g.unitOptions[unit.id]?.moves ?? {}).filter(id => !regionTargets.has(id)); if (!reach.length) return null;
  const front = (g.frontier ?? []).map(f => f.id);
  const score = id => (front.length ? Math.min(...front.map(f => hexDist(f, id))) : 0) - (away.length ? 0.01 * Math.min(...away.map(c => hexDist(c.hexId, id))) : 0);
  return reach.sort((a, b) => score(a) - score(b) || a.localeCompare(b))[0];
}
function nextIntent(seat, tried) {
  const g = seat.game, cities = mine(seat), me = seat.game.view.player.id ?? seat.room.selfPlayerId;
  const states = g.cityStates ?? [];
  const options = id => (g.urban.cities[id] ?? []).filter(o => o.blocked === null);
  const usedCity = id => g.self.plannedActions.filter(a => a.type === 'URBAN_ACTION' && a.cityId === id).length;
  const cap = g.rules.balance.cityActions;
  const myUnits = (g.units ?? []).filter(u => u.ownerId === me);
  const hasOrder = u => g.self.orders.some(o => ('unitId' in o && o.unitId === u.id) || ('unitIds' in o && o.unitIds.includes(u.id)));
  const wars = new Set((g.wars ?? []).flatMap(w => w).filter(id => id !== me));
  for (const intent of PRIORITY[seat.persona]) {
    const key = intent; if (tried.has(key)) continue;
    switch (intent) {
      case 'settle': { const p = myUnits.find(u => u.kind === 'PIONEER' && !hasOrder(u) && g.unitOptions[u.id]?.settleBlock === null); if (p) return { intent, unit: p, pieceKind: 'settle' }; break; }
      case 'move-explorer': { const u = myUnits.find(x => x.kind === 'EXPLORER' && !hasOrder(x) && !g.unitOptions[x.id]?.explore.length); const dest = u && towardFrontier(g, u); if (u && dest) return { intent, unit: { ...u, dest }, pieceKind: 'move' }; break; }
      case 'move-pioneer': { const u = myUnits.find(x => x.kind === 'PIONEER' && !hasOrder(x) && g.unitOptions[x.id]?.settleBlock !== null); const dest = u && towardFrontier(g, u, cities); if (u && dest) return { intent, unit: { ...u, dest }, pieceKind: 'move' }; break; }
      case 'explore': { const u = myUnits.find(x => ['EXPLORER', 'COASTAL_VESSEL'].includes(x.kind) && !hasOrder(x) && g.unitOptions[x.id]?.explore.length); if (u) return { intent, unit: u, pieceKind: 'explore' }; break; }
      case 'elevate': for (const c of cities) { const o = options(c.id).find(x => x.action === 'ELEVATE'); if (o && usedCity(c.id) < cap) return { intent, city: c, kind: 'elevate', option: o }; } break;
      case 'research': if (g.urban.research.some(o => o.blocked === null) && g.actions.byOrder.ADVANCE < 1) return { intent, research: true }; break;
      case 'produce': for (const c of cities) { const o = options(c.id).find(x => x.action === 'PRODUCE'); if (o && usedCity(c.id) < cap && !g.self.plannedActions.some(a => a.type === 'URBAN_ACTION' && a.cityId === c.id && a.action === 'PRODUCE')) return { intent, city: c, kind: 'produce' }; } break;
      case 'govern': for (const c of cities) { const st = states.find(s => s.cityId === c.id); const o = options(c.id).find(x => x.action === 'PROMOTE_MOOD'); if (o && st && ['REVOLT', 'SHAKEN'].includes(st.moodBand) && usedCity(c.id) < cap) return { intent, city: c, kind: 'govern', option: o }; } break;
      case 'build': case 'build-academic': case 'build-commercial': case 'fortify': for (const c of cities) {
        const list = options(c.id).filter(x => x.action === 'BUILD');
        const want = intent === 'fortify' ? list.find(x => x.build?.kind === 'FORTIFICATION') : intent === 'build-academic' ? list.find(x => x.build?.district === 'ACADEMIC' || x.build?.building === 'LIBRARY') : intent === 'build-commercial' ? list.find(x => x.build?.district === 'COMMERCIAL' || x.build?.building === 'MARKET') : list.find(x => x.build?.kind === 'DISTRICT') ?? list[0];
        if (want && usedCity(c.id) < cap) return { intent, city: c, kind: 'build', option: want };
      } break;
      case 'recruit-army': case 'recruit-pioneer': for (const c of cities) {
        const list = options(c.id).filter(x => x.action === 'RECRUIT');
        const want = intent === 'recruit-pioneer' ? list.find(x => x.unit === 'PIONEER') : list.find(x => x.unit === 'INFANTRY' || x.unit === 'GUARD');
        if (want && usedCity(c.id) < cap && (intent === 'recruit-pioneer' ? myUnits.filter(u => u.kind === 'PIONEER').length < 1 : myUnits.filter(u => !['EXPLORER', 'PIONEER', 'ENVOY'].includes(u.kind)).length < 4)) return { intent, city: c, kind: 'recruit', option: want };
      } break;
      case 'attack': { // war first: only at war and with an enemy piece next to my army
        if (!wars.size) break;
        const army = myUnits.filter(u => !['EXPLORER', 'PIONEER', 'ENVOY'].includes(u.kind) && !hasOrder(u));
        const foes = (g.units ?? []).filter(u => wars.has(u.ownerId));
        for (const a of army) { const f = foes.find(x => hexDist(x.hexId, a.hexId) === 1); if (f) return { intent, unit: { ...a, target: f.hexId }, pieceKind: 'attack' }; }
        break; }
      case 'move-army': { const a = myUnits.find(u => !['EXPLORER', 'PIONEER', 'ENVOY'].includes(u.kind) && !hasOrder(u)); const dest = a && Object.keys(g.unitOptions[a.id]?.moves ?? {}).sort((x, y) => hexDist(y, cities[0]?.hexId ?? a.hexId) - hexDist(x, cities[0]?.hexId ?? a.hexId))[0]; if (a && dest && g.view.round % 3 === 0) return { intent, unit: { ...a, dest }, pieceKind: 'move' }; break; }
      case 'trade-route': break; // routes live in the Diplomacia tab; handled by diplomacyTurn
      default: break;
    }
  }
  return null;
}

async function diplomacyTurn(seat) {
  const g = seat.game, me = seat.room.selfPlayerId;
  const others = g.players.filter(p => p.id !== me && g.self.contacts.includes(p.id));
  if (!others.length) return;
  // answer what is on the table first (incoming proposals)
  const incoming = g.treaties.filter(t => t.status === 'PROPOSED' && t.recipientId === me);
  if (!incoming.length && !(['diplomat', 'trader', 'expansionist'].includes(seat.persona) || seat.persona === 'warrior' && g.view.round > 6)) return;
  await seat.click(seat.page.getByRole('button', { name: 'Livro', exact: true }), 'open Livro');
  await seat.click(seat.page.locator('.alpha-livro-tabs').getByRole('button', { name: 'Diplomacia' }), 'Diplomacia tab');
  for (let i = 0; i < incoming.length; i++) {
    const card = seat.page.getByRole('group', { name: /^Proposta de / }).first();
    const accept = card.getByRole('button', { name: /Aceitar/ });
    if (await accept.count()) await seat.click(accept, 'accept treaty'); else seat.note('dead-end', 'incoming treaty has no Aceitar button');
  }
  const target = others[0];
  const relation = seat.page.getByRole('article', { name: new RegExp(`Relação com ${target.name}`) });
  const war = g.wars.some(w => w.includes(me) && w.includes(target.id));
  const active = g.treaties.some(t => ['PROPOSED', 'ACTIVE', 'ACCEPTED'].includes(t.status) && [t.proposerId, t.recipientId].includes(target.id) && [t.proposerId, t.recipientId].includes(me));
  const canPlanMain = ordersLeft(seat) > 0;
  if (!war && !active && canPlanMain && await relation.count()) {
    if (seat.persona === 'warrior' && g.view.round >= 6) {
      if (await seat.click(relation.getByRole('button', { name: /Declarar guerra/ }), 'declare war')) await seat.click(seat.page.locator('.alpha-war-confirm button').filter({ hasText: /Confirmar|Declarar|Sim/ }), 'confirm war');
    } else {
      const select = relation.locator('select').first();
      if (await select.count()) { const opts = await select.locator('option').allTextContents(); const idx = opts.findIndex(x => /Abertas|Fronteiras|Comerc|Não agress/i.test(x)); if (idx >= 0) await select.selectOption({ index: idx }); }
      await seat.click(relation.getByRole('button', { name: /Enviar proposta/ }), 'send treaty proposal');
    }
  }
  await closeLivro(seat);
  await seat.click(seat.page.keyboard ? seat.page.locator('body') : seat.page.locator('body'), 'noop', { optional: true });
}

/** Last round of the Era: reserve a government reform through the same Livro panel a person uses (Influência Order). */
async function reformTurn(seat) {
  const info = seat.game.government;
  if (!info?.window || info.planned || ordersLeft(seat) < 1) return;
  const option = info.options.find(o => o.government !== info.current.government && o.unlocked && o.block === null);
  if (!option) { seat.note('reform-unavailable', `last round of the Era: no government open for me (${info.options.filter(o => o.unlocked).length} unlocked)`); return; }
  // the picker lives in the city card of the inspector (Cidade tab), not in the Livro: a person has to know to look there
  await selectCity(seat, mine(seat)[0]);
  await seat.click(seat.page.locator('.alpha-inspector .alpha-government summary'), 'open reform list');
  await seat.shot('government-reform-list');
  const before = seat.game.government.planned;
  await seat.click(seat.page.locator('.alpha-inspector .alpha-government li').filter({ hasText: option.name }).getByRole('button'), `reserve reform ${option.name}`);
  await seat.waitState(x => x.government.planned !== before, 3000);
  await seat.shot('government-reform-reserved');
}

async function confirmPlanning(seat) {
  const confirmBtn = seat.page.locator('.alpha-tray .primary, .alpha-tray button.advance-phase-btn').filter({ hasText: /Confirmar planejamento/ });
  if (!await seat.click(confirmBtn, 'Confirmar planejamento', { timeout: 5000 })) return false;
  const warn = seat.page.getByRole('dialog', { name: 'Antes de confirmar' });
  if (await warn.isVisible().catch(() => false)) {
    seat.note('ready-check', (await warn.locator('li').allTextContents()).join(' | '));
    await seat.click(warn.getByRole('button', { name: 'Confirmar mesmo assim' }), 'confirm anyway');
  }
  return seat.waitState(x => x.self.ready || x.phase !== 'PLANNING', 6000);
}

/** Map experience metrics + screenshots at laptop viewports (item 6): share of the screen the known territory uses, hexes hidden under panels. */
async function mapShots(seat, dir) {
  mkdirSync(dir, { recursive: true });
  const out = [];
  for (const [w, h] of [[1366, 768], [1440, 900], [1280, 720]]) {
    await seat.page.setViewportSize({ width: w, height: h }); await nap(700);
    for (const inspector of ['open', 'folded']) {
      const isOpen = await seat.page.locator('.alpha-inspector').isVisible().catch(() => false);
      if (inspector === 'folded' && isOpen) await seat.click(seat.page.getByRole('button', { name: 'Fechar cartão' }), 'fold inspector', { optional: true });
      if (inspector === 'open' && !isOpen) await seat.click(seat.page.getByRole('button', { name: 'Abrir cartão' }), 'open inspector', { optional: true });
      await nap(500);
      const m = await seat.page.evaluate(() => {
        const vw = innerWidth, vh = innerHeight, r = e => e.getBoundingClientRect();
        const hexes = [...document.querySelectorAll('.world-map g[role=button]')].map(e => ({ rect: r(e), known: !e.classList.contains('unknown') }));
        const overlays = ['.alpha-context', '.alpha-strip', '.alpha-tray', '.alpha-hand-fan', '.alpha-resolution-phase', '.alpha-pulse-chip', '.map-tools'].flatMap(sel => [...document.querySelectorAll(sel)].map(r)).filter(x => x.width > 0);
        const inside = (x, y, b) => x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
        const visibleHexes = hexes.filter(hx => hx.rect.width > 0 && hx.rect.right > 0 && hx.rect.left < vw && hx.rect.bottom > 0 && hx.rect.top < vh);
        const covered = visibleHexes.filter(hx => overlays.some(b => inside(hx.rect.left + hx.rect.width / 2, hx.rect.top + hx.rect.height / 2, b)));
        const offscreen = hexes.length - visibleHexes.length;
        const left = Math.min(...visibleHexes.map(x => x.rect.left)), right = Math.max(...visibleHexes.map(x => x.rect.right)), top = Math.min(...visibleHexes.map(x => x.rect.top)), bottom = Math.max(...visibleHexes.map(x => x.rect.bottom));
        const stage = document.querySelector('.map-stage')?.getBoundingClientRect();
        return { viewport: [vw, vh], hexes: hexes.length, offscreen, covered: covered.length, hexWidthPx: Math.round(visibleHexes[0]?.rect.width ?? 0), territoryBBoxShare: +(((right - left) * (bottom - top)) / (vw * vh)).toFixed(3), territoryWidthShare: +((right - left) / vw).toFixed(3), territoryHeightShare: +((bottom - top) / vh).toFixed(3), stage: stage && [Math.round(stage.left), Math.round(stage.top), Math.round(stage.width), Math.round(stage.height)], scrollsGlobally: document.documentElement.scrollHeight > vh + 1 || document.documentElement.scrollWidth > vw + 1 };
      });
      out.push({ viewport: `${w}x${h}`, inspector, ...m });
      await seat.page.screenshot({ path: `${dir}/${seat.label.replace(' ', '-')}-${w}x${h}-inspector-${inspector}.png` });
    }
  }
  await seat.page.setViewportSize({ width: VW, height: VH });
  writeFileSync(`${dir}/metrics-${seat.label.replace(' ', '-')}.json`, JSON.stringify(out, null, 2));
  return out;
}

const ROLE_LABEL = { producers: 'Produtores', artisans: 'Artesãos', merchants: 'Mercadores', scholars: 'Eruditos', soldiers: 'Soldados' };
const ROLE_WEIGHT = { // how each strategy spreads the non-farming citizens
  expansionist: { artisans: 2, merchants: 1, scholars: 1, soldiers: 0 }, warrior: { artisans: 2, merchants: 0, scholars: 1, soldiers: 3 }, scholar: { artisans: 1, merchants: 1, scholars: 3, soldiers: 0 },
  trader: { artisans: 1, merchants: 3, scholars: 1, soldiers: 0 }, diplomat: { artisans: 1, merchants: 1, scholars: 2, soldiers: 0 }, builder: { artisans: 3, merchants: 1, scholars: 1, soldiers: 0 },
};
/** Redistribute citizens in the inspector (Planejamento only, once per city): half farm, the rest follow the strategy. Typed into the real number fields. */
async function redistribute(seat, city) {
  const w = city.workers, total = city.population;
  if (!(w.unassigned > 0)) return false;
  await selectCity(seat, city);
  const weights = ROLE_WEIGHT[seat.persona], target = { producers: Math.ceil(total / 2), artisans: 0, merchants: 0, scholars: 0, soldiers: Math.min(w.soldiers + (weights.soldiers > 0 ? 1 : 0), Math.floor(total / 3)) };
  let rest = total - target.producers - target.soldiers;
  const order = Object.entries(weights).filter(([role, weight]) => role !== 'soldiers' && weight > 0).sort((a, b) => b[1] - a[1]);
  for (let i = 0; rest > 0; i = (i + 1) % order.length) { target[order[i][0]]++; rest--; }
  const panel = seat.page.locator('.alpha-inspector');
  for (const [role, n] of Object.entries(target)) {
    const input = panel.getByLabel(ROLE_LABEL[role], { exact: true });
    try { await input.scrollIntoViewIfNeeded({ timeout: 1500 }); await input.fill(String(n), { timeout: 1500 }); } catch (error) { seat.note('population-field', `${ROLE_LABEL[role]}: ${String(error.message).split('\n')[0].slice(0, 100)}`); return false; }
  }
  const unassigned = panel.getByLabel('Disponível', { exact: true });
  await unassigned.fill('0').catch(() => {});
  const apply = panel.getByRole('button', { name: 'Aplicar distribuição' });
  if (await apply.isDisabled().catch(() => false)) { seat.note('population-invalid', `Aplicar distribuição disabled for ${city.name}: target ${JSON.stringify(target)} of ${total}`); return false; }
  const before = seat.game.version;
  const ok = await seat.click(apply, 'apply population');
  if (ok) await seat.waitState(x => x.version > before, 3000);
  return ok;
}

async function planRound(seat) {
  const round = seat.game.view.round, started = Date.now();
  await dismissOverlays(seat);
  for (const city of mine(seat)) { try { await redistribute(seat, city); } catch (error) { seat.note('exception', `redistribute: ${String(error.message).split('\n')[0]}`); } }
  seat.retries = new Map();
  const tried = new Set(); let guard = 0;
  while (ordersLeft(seat) > 0 && guard++ < 12) {
    const intent = nextIntent(seat, tried);
    if (!intent) break;
    let ok = false;
    try {
      if (intent.research) ok = await planResearch(seat);
      else if (intent.pieceKind) ok = await pieceOrder(seat, intent.unit, intent.pieceKind);
      else ok = await planUrban(seat, intent.city, intent);
    } catch (error) { seat.note('exception', `${intent.intent}: ${String(error.message).split('\n')[0]}`); }
    if (!ok) {
      const lost = await seat.conflictBanner();
      seat.retries = seat.retries ?? new Map();
      const n = (seat.retries.get(intent.intent) ?? 0) + 1; seat.retries.set(intent.intent, n);
      if (!(lost && n <= 3)) tried.add(intent.intent);
    }
    await dismissOverlays(seat);
    if (!seat.game) break;
  }
  try { await reformTurn(seat); } catch (error) { seat.note('exception', `reform: ${String(error.message).split('\n')[0]}`); }
  try { await diplomacyTurn(seat); } catch (error) { seat.note('exception', `diplomacy: ${String(error.message).split('\n')[0]}`); }
  const planningMs = Date.now() - started;
  const ordersUsed = seat.game.actions.reserved;
  const ok = await confirmPlanning(seat);
  const rec = seat.rounds.get(round) ?? {}; rec.planningMs = planningMs; rec.ordersUsed = ordersUsed; rec.confirmed = ok; seat.rounds.set(round, rec);
}

/** Per-round client-observed telemetry from the screen's projection. */
function observe(seat) {
  const g = seat.game; if (!g) return;
  const round = g.view.round, cities = mine(seat);
  // shared border: two adjacent claimed hexes with different owners, as far as this seat can see
  const owned = new Map(g.view.visibleTerritory.filter(t => t.ownerId).map(t => [t.id, t.ownerId]));
  let sharedBorder = false;
  for (const [id, owner] of owned) { const [q, r] = id.split(',').map(Number); for (const [dq, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]) { const other = owned.get(`${q + dq},${r + dr}`); if (other && other !== owner) sharedBorder = true; } }
  const rec = seat.rounds.get(round) ?? {};
  Object.assign(rec, {
    round, era: g.self.era, resources: g.view.player.resources ?? g.self.resources, cities: cities.map(c => ({ n: levelNo(g.cityStates?.find(s => s.cityId === c.id)?.level ?? 'OUTPOST'), pop: c.population })),
    sharedBorder, research: g.self.research.length, contacts: g.self.contacts.length, wars: g.wars.length, battles: g.battles.filter(b => b.attackerId !== 'world' && b.defenderId !== 'world').length, worldBattles: g.battles.filter(b => b.attackerId === 'world' || b.defenderId === 'world').length, prestige: g.self.prestige,
    resonanceSlots: g.self.resonance?.slots?.length ?? 0, threatsVisible: (g.threats ?? []).length, orders: g.actions.byOrder, treaties: g.treaties.filter(t => t.status === 'ACTIVE').length,
  });
  seat.rounds.set(round, rec);
}

/** Result card of the first player-vs-player battle: Livro > Crônicas, as a person reads it after the round. */
async function battleReportShot(seat) {
  const g = seat.game;
  if (!g || g.phase !== 'PLANNING' || seat.shots.has('combat-report-pvp')) return;
  const pvp = g.battles.filter(b => b.attackerId !== 'world' && b.defenderId !== 'world' && (b.attackerId === seat.room.selfPlayerId || b.defenderId === seat.room.selfPlayerId));
  if (!pvp.length) return;
  await seat.click(seat.page.getByRole('button', { name: 'Livro', exact: true }), 'open Livro');
  await seat.click(seat.page.locator('.alpha-livro-tabs').getByRole('button', { name: 'Crônicas' }), 'Crônicas tab');
  const battle = seat.page.locator('.alpha-battle').first();
  await battle.evaluate(el => { el.closest('details')?.setAttribute('open', ''); el.scrollIntoView({ block: 'start' }); }).catch(() => {});
  await nap(400);
  await seat.shot('combat-report-pvp');
  await closeLivro(seat);
}

async function milestoneShots(seat) {
  const g = seat.game; if (!g) return;
  const cs = g.cityStates ?? [];
  if (g.battles.some(b => b.attackerId !== 'world' && b.defenderId !== 'world')) await seat.shot('combat-first-pvp');
  if (g.battles.some(b => b.attackerId === 'world' || b.defenderId === 'world')) await seat.shot('combat-first-world');
  if (cs.some(c => c.degraded || (c.effectiveLevel && c.effectiveLevel !== c.level))) await seat.shot('city-degraded');
  if ((g.threats ?? []).length) await seat.shot('threat-visible');
  if (cs.some(c => levelNo(c.level) >= 6)) await seat.shot('city-n6');
  if (cs.some(c => levelNo(c.level) >= 7)) await seat.shot('city-n7');
  if (g.phase === 'ERA_TURN') await seat.shot('era-turn');
  if (g.winner) await seat.shot('finale');
  if (g.government?.current?.government && !['COUNCIL', 'PROTO_GOVERNANCE'].includes(g.government.current.government)) await seat.shot('government-adopted');
}

async function seatLoop(seat, state) {
  let lastKey = '';
  const idle = { since: Date.now() };
  while (!state.stop) {
    if (seat.page.isClosed()) { seat.note('browser-closed', 'the page was closed under the driver; stopping the session'); state.stop = true; return; }
    const g = seat.game;
    if (!g) { await nap(300); continue; }
    if (g.winner) { await milestoneShots(seat); await nap(500); state.finished.add(seat.index); return; }
    observe(seat); await milestoneShots(seat);
    await seat.conflictBanner();
    if (g.view.round > MAX_ROUNDS) { state.finished.add(seat.index); return; }
    const key = `${g.view.round}:${g.phase}:${g.self.ready}:${g.version}`;
    if (key !== lastKey) { lastKey = key; idle.since = Date.now(); }
    if (MAP_DIR && g.phase === 'PLANNING' && g.view.round >= 5 && !seat.mapShotsDone && !g.self.ready) { seat.mapShotsDone = true; await dismissOverlays(seat); await mapShots(seat, MAP_DIR); }
    if (g.phase === 'PLANNING' && !g.self.ready) { await battleReportShot(seat); await planRound(seat); }
    else if (g.phase === 'CONFLICTS' && !g.self.ready) {
      await seat.shot('conflict-call');
      await seat.click(seat.page.getByRole('button', { name: /Seguir para os dados/ }), 'conflict ready', { optional: true });
    } else if (g.phase === 'ERA_TURN' && !g.self.ready) {
      await dismissOverlays(seat);
      await seat.click(seat.page.getByRole('button', { name: /Confirmar Virada|Seguir para a nova Era/ }), 'confirm Era turn');
    }
    // resolution replay panel / modals that block the map: close like a person
    for (const name of [/Continuar/, /Fechar/, /Ver o mapa primeiro/]) await seat.click(seat.page.locator('.alpha-resolution-phase, .alpha-modal, .alpha-ready-check').getByRole('button', { name }), 'dismiss panel', { optional: true, timeout: 400 });
    if (Date.now() - idle.since > 90000) { seat.note('stuck', `no state change for 90s at ${key}`); state.stop = true; return; }
    await nap(500);
  }
}

// ---- lobby (the same forms a person uses) ----
const browser = await chromium.launch({ headless: !arg.has('headed') });
const seats = Array.from({ length: N }, (_, i) => new Seat(i, browser));
for (const seat of seats) await seat.open();
const [host, ...guests] = seats;
for (const seat of seats) { await seat.page.goto(`${BASE}/alpha`); await seat.page.getByLabel('Seu nome', { exact: true }).fill(seat.label); }
await host.page.getByLabel('Lugares', { exact: false }).selectOption(String(N)).catch(() => {});
await host.page.getByLabel('Duração').selectOption(PRESET).catch(() => {});
const reveal = arg.has('reveal'); if (reveal) await host.page.getByLabel(/Mapa revelado/).check();
await host.page.getByRole('button', { name: 'Criar partida', exact: true }).click();
await host.page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
const code = (await host.page.locator('.alpha-lobby-heading code').innerText()).trim();
for (const guest of guests) {
  await guest.page.goto(`${BASE}/alpha?join=${code}`);
  await guest.page.getByLabel('Seu nome', { exact: true }).fill(guest.label);
  await guest.page.getByRole('button', { name: 'Entrar na partida', exact: true }).click();
  await guest.page.getByRole('heading', { name: 'Seu tabuleiro de civilização' }).waitFor();
}
for (const [i, seat] of seats.entries()) { await seat.page.locator('.alpha-civilizations button').nth(i).click(); await seat.page.getByRole('button', { name: 'Estou pronto', exact: true }).click(); }
await host.page.getByRole('button', { name: 'Iniciar partida', exact: true }).click();
await Promise.all(seats.map(s => s.page.waitForSelector('.world-map')));
console.log(`sessão ${N}p ${PRESET} começou (código ${code}); personas: ${seats.map(s => `${s.label}=${s.persona}`).join(', ')}`);
const t0 = Date.now(), state = { stop: false, finished: new Set() };
const ticker = setInterval(() => { const g = seats[0].game; if (g) console.log(`  [${Math.round((Date.now() - t0) / 1000)}s] rodada ${g.view.round} ${g.phase} | atrito ${seats.reduce((n, s) => n + s.friction.length, 0)} | ações ${seats.reduce((n, s) => n + s.actions, 0)}`); }, 30000);
await Promise.all(seats.map(seat => seatLoop(seat, state).catch(error => { seat.note('exception', String(error.message).split('\n')[0]); })));
clearInterval(ticker);

// ---- contact metrics + report ----
const g0 = seats[0].game;
const firstRound = pred => { for (let r = 1; r <= (g0?.view.round ?? 0); r++) if (seats.some(s => pred(s.rounds.get(r)))) return r; return null; };
const session = {
  players: N, preset: PRESET, personas: seats.map(s => s.persona), startedAt: new Date(t0).toISOString(), wallSeconds: Math.round((Date.now() - t0) / 1000), reachedRound: g0?.view.round ?? 0, winner: g0?.winner ?? null,
  contact: { firstContactRound: firstRound(r => r && r.contacts > 0), firstSharedBorderRound: firstRound(r => r && r.sharedBorder), firstTreatyRound: firstRound(r => r && r.treaties > 0), firstWarRound: firstRound(r => r && r.wars > 0), firstPlayerCombatRound: firstRound(r => r && r.battles > 0) },
  perSeat: seats.map(s => ({ label: s.label, persona: s.persona, uiActions: s.actions, frictionCount: s.friction.length, friction: s.friction, planningMsAvg: Math.round([...s.rounds.values()].map(r => r.planningMs ?? 0).filter(Boolean).reduce((a, b, _, l) => a + b / l.length, 0)), rounds: [...s.rounds.values()].sort((a, b) => (a.round ?? 0) - (b.round ?? 0)) })),
};
writeFileSync(`${OUT}/session.json`, JSON.stringify(session, null, 2));
console.log(`fim: rodada ${session.reachedRound}, ${session.wallSeconds}s, atrito ${seats.reduce((n, s) => n + s.friction.length, 0)}, contato ${JSON.stringify(session.contact)}`);
await browser.close();
process.exit(0);

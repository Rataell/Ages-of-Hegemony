import { describe, expect, it } from 'vitest';
import { ADVANCEMENTS, AlphaEraSchema, AlphaStateSchema, LEGACY_WORKS, LEGACY_WORK_STEPS, PlayerIdSchema, legacyStepCost, type AlphaState } from '@aoh/game-domain';
import { activationCapacity, applyAlphaCommand, beginAlphaPlanning, createAlphaGame, hegemonyProgress, legacyWorkView, occupyCity } from '@aoh/game-engine';

const p1 = PlayerIdSchema.parse('p1'), p2 = PlayerIdSchema.parse('p2');
const total = (pool: Record<string, number>) => Object.values(pool).reduce((a, b) => a + b, 0);
function setup(): AlphaState {
  const state = beginAlphaPlanning(createAlphaGame({ gameId: 'legacy-works', seed: 21, preset: 'STANDARD', players: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] }));
  state.players.forEach(player => { player.ambitionsChosen = true; });
  return state;
}
const capital = (state: AlphaState, owner = p1) => state.core.players.find(player => player.id === owner)!.civilization.cities[0]!;
function setPopulation(city: ReturnType<typeof capital>, population: number) {
  const workers = city.workers;
  workers.unassigned = Math.max(0, population - (workers.producers + workers.artisans + workers.merchants + workers.scholars + workers.soldiers));
  city.population = workers.producers + workers.artisans + workers.merchants + workers.scholars + workers.soldiers + workers.unassigned;
}
/** A city with the district prerequisite, Capacity 2 and a full Cofre. */
function ready(state: AlphaState, district = 'ACADEMIC', owner = p1) {
  const city = capital(state, owner), meta = state.cities.find(entry => entry.cityId === city.id)!;
  city.districts = [{ type: district as never, builtRound: 1 }];
  meta.level = 'VILLAGE'; setPopulation(city, 6); meta.mood = 4;
  const player = state.players.find(entry => entry.playerId === owner)!;
  for (const key of Object.keys(player.resources) as (keyof typeof player.resources)[]) player.resources[key] = 20;
  return { city, meta, player };
}
function learn(player: AlphaState['players'][number], id: string) {
  const node = ADVANCEMENTS.find(item => item.id === id)!;
  for (const pre of [...node.prerequisites, ...node.prerequisitesAny.slice(0, 1)]) learn(player, pre);
  if (!player.research.includes(id)) player.research.push(id);
  if (AlphaEraSchema.options.indexOf(node.era) > AlphaEraSchema.options.indexOf(player.era)) player.era = node.era as typeof player.era;
}
const must = (result: ReturnType<typeof advance>): AlphaState => { if (!result.ok) throw new Error(result.error.message); return result.value; };
const advance = (state: AlphaState, workId: string, cityId: string, owner = p1) => applyAlphaCommand(state, owner, { type: 'ADVANCE_LEGACY_WORK', expectedVersion: state.version, workId, cityId });

describe('Obras de Legado (D-3): the only monument system', () => {
  it('has the six canon Obras with canon costs (10–16) and converted old Grandes Projetos in the same schema', () => {
    const canon = LEGACY_WORKS.filter(work => work.source === 'CANON');
    expect(canon.map(work => work.id).sort()).toEqual(['archive-of-horizons', 'house-of-accord', 'monument-of-voices', 'road-of-communities', 'tidal-exchange', 'watch-citadel']);
    expect(canon.find(work => work.id === 'archive-of-horizons')!.cost).toMatchObject({ stone: 6, wood: 4, knowledge: 3 });
    for (const work of LEGACY_WORKS) { expect(total(work.cost)).toBeGreaterThanOrEqual(10); expect(total(work.cost)).toBeLessThanOrEqual(16); }
    for (const work of LEGACY_WORKS) { const steps = Array.from({ length: LEGACY_WORK_STEPS }, (_, step) => legacyStepCost(work, step)); expect(steps.reduce((sum, part) => sum + total(part), 0)).toBe(total(work.cost)); }
  });

  it('starts and advances one step per Legado Order, then completes with +4 Prestígio and a permanent effect', () => {
    const state = setup(), { city, player } = ready(state);
    expect(activationCapacity(state, city.id)).toBeGreaterThanOrEqual(2);
    const prestige = player.prestige;
    let current = state;
    for (let step = 1; step <= LEGACY_WORK_STEPS; step++) {
      const result = advance(current, 'inquiry-campus', city.id);
      expect(result.ok, result.ok ? '' : result.error.message).toBe(true);
      if (!result.ok) return;
      current = result.value;
      const progress = current.legacyWorks.find(work => work.workId === 'inquiry-campus')!;
      expect(progress.stepsDone).toBe(step); expect(progress.completedRound === null).toBe(step < LEGACY_WORK_STEPS);
    }
    expect(current.players[0]!.prestige).toBe(prestige + 4);
    expect(current.players[0]!.ordersSpent.LEGACY).toBe(LEGACY_WORK_STEPS);
    expect(AlphaStateSchema.safeParse(current).success).toBe(true);
  });

  it('refuses a missing prerequisite district, a missing Web gate, Capacity 1 and an unaffordable step', () => {
    const state = setup(), { city, meta } = ready(state, 'COMMERCIAL');
    expect(advance(state, 'inquiry-campus', city.id)).toMatchObject({ ok: false, error: { message: expect.stringContaining('distrito') } });
    city.districts = [{ type: 'ACADEMIC', builtRound: 1 }];
    expect(advance(state, 'archive-of-horizons', city.id)).toMatchObject({ ok: false, error: { message: expect.stringContaining('Síntese') } });
    meta.level = 'OUTPOST'; setPopulation(city, 2);
    expect(advance(state, 'inquiry-campus', city.id)).toMatchObject({ ok: false, error: { message: expect.stringContaining('Capacidade') } });
    meta.level = 'VILLAGE'; setPopulation(city, 6);
    state.players[0]!.resources.stone = 0; state.players[0]!.resources.wealth = 0;
    expect(advance(state, 'inquiry-campus', city.id).ok).toBe(false);
  });

  it('the Web advance opens the Obra it names', () => {
    const state = setup(), { city, player } = ready(state);
    learn(player, 'web-synthesis');
    const done = advance(state, 'archive-of-horizons', city.id);
    expect(done.ok, done.ok ? '' : JSON.stringify(AlphaStateSchema.safeParse(state).error?.issues.slice(0, 2)) + done.error.message).toBe(true);
    expect(legacyWorkView(state, p1).find(work => work.id === 'monument-of-voices')!.gate).toMatchObject({ id: 'web-renaissance' });
  });

  it('is unique in the world and one per city', () => {
    const state = setup(), { city } = ready(state);
    const started = must(advance(state, 'inquiry-campus', city.id));
    const other = ready(started, 'ACADEMIC', p2);
    expect(advance(started, 'inquiry-campus', other.city.id, p2)).toMatchObject({ ok: false, error: { message: expect.stringContaining('única no mundo') } });
    expect(advance(started, 'sky-instrument', city.id)).toMatchObject({ ok: false, error: { message: expect.stringContaining('outra Obra') } });
  });

  it('the Cidadela needs a Fortaleza and the Estrada needs three cities joined by routes', () => {
    const state = setup(), { city, meta } = ready(state, 'MILITARY');
    expect(advance(state, 'watch-citadel', city.id)).toMatchObject({ ok: false, error: { message: expect.stringContaining('fortificação') } });
    meta.fortification = { ...meta.fortification, level: 'FORTRESS', state: 'INTACT' };
    expect(advance(state, 'watch-citadel', city.id).ok).toBe(true);
    city.districts = [{ type: 'INDUSTRIAL', builtRound: 1 }];
    expect(advance(state, 'road-of-communities', city.id)).toMatchObject({ ok: false, error: { message: expect.stringContaining('cidades ligadas') } });
  });

  it('a completed Obra feeds the Hegemonia metrics of its path and changes hands with the city', () => {
    const state = setup(), { city } = ready(state);
    state.legacyWorks.push({ workId: 'inquiry-campus', ownerId: p1, cityId: city.id, stepsDone: LEGACY_WORK_STEPS, startedRound: 1, completedRound: 1 });
    const scientific = hegemonyProgress(state, p1).find(entry => entry.path === 'SCIENTIFIC')!.requirements.find(entry => entry.metric === 'scientificProjects')!;
    expect(scientific.current).toBe(1);
    occupyCity(state, p2, city.id);
    expect(state.legacyWorks[0]!.ownerId).toBe(p2);
  });

  it('projects every Obra publicly but only the viewer\'s own blockers', () => {
    const state = setup(), { city } = ready(state);
    const started = must(advance(state, 'inquiry-campus', city.id));
    const mine = legacyWorkView(started, p1).find(work => work.id === 'inquiry-campus')!, theirs = legacyWorkView(started, p2).find(work => work.id === 'inquiry-campus')!;
    expect(mine.progress).toMatchObject({ ownerId: p1, stepsDone: 1, complete: false });
    expect(theirs.progress).toMatchObject({ ownerId: p1 }); expect(theirs.cities).toEqual([]);
  });
});

describe('save upgrade: Grandes Projetos → Obras de Legado', () => {
  it('turns an old `projects` list into completed Obras (old ids mapped) and says so publicly', () => {
    const state = setup(), city = capital(state);
    const raw = JSON.parse(JSON.stringify(state)) as Record<string, unknown>;
    delete raw.legacyWorks;
    raw.projects = [{ projectId: 'voices-monument', ownerId: 'p1', cityId: city.id, completedRound: 1 }];
    const parsed = AlphaStateSchema.safeParse(raw);
    expect(parsed.success, parsed.success ? '' : JSON.stringify(parsed.error.issues[0])).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).not.toHaveProperty('projects');
    expect(parsed.data.legacyWorks).toEqual([{ workId: 'monument-of-voices', ownerId: 'p1', cityId: city.id, stepsDone: LEGACY_WORK_STEPS, startedRound: 1, completedRound: 1 }]);
    expect(parsed.data.events.at(-1)).toMatchObject({ type: 'SAVE_UPGRADED' });
  });
});

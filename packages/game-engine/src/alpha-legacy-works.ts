import { ADVANCEMENTS, FortificationLevelSchema, LEGACY_WORKS, LEGACY_WORK_PRESTIGE, LEGACY_WORK_STEPS, legacyStepCost, legacyWork, type AlphaState, type LegacyWork, type PlayerId } from '@aoh/game-domain';
import { alphaEvent } from './alpha-events.js';
import { alphaCanAfford, alphaPay } from './alpha-resources.js';
import { activationCapacity } from './alpha-city.js';

/** Obras de Legado (canon §11, D-3): start and advance, one step per Legado Order. */

/** The Web advance that opens an Obra (`work:<id>` unlock tag), if the canon gates it behind one. */
export const legacyWorkGate = (workId: string): { id: string; name: string } | null => {
  const node = ADVANCEMENTS.find(advancement => advancement.unlocks.includes(`work:${workId}`));
  return node ? { id: node.id, name: node.name } : null;
};

/** Own cities joined to `cityId` through active internal trade routes (the city itself counts). */
function connectedCount(state: AlphaState, actor: PlayerId, cityId: string): number {
  const own = new Set(state.core.players.find(player => player.id === actor)?.civilization.cities.map(city => city.id as string) ?? []);
  const seen = new Set([cityId]), queue = [cityId];
  for (let i = 0; i < queue.length; i++) {
    for (const route of state.routes) {
      if (route.ownerId !== actor || route.suspended) continue;
      const from = route.fromCityId as string, to = route.toCityId as string;
      const next = from === queue[i] ? to : to === queue[i] ? from : null;
      if (next && own.has(next) && !seen.has(next)) { seen.add(next); queue.push(next); }
    }
  }
  return seen.size;
}

/** Why `cityId` cannot start (or advance) `work` right now, or null when it can. Ownership and uniqueness are checked by the caller. */
export function legacyWorkBlock(state: AlphaState, actor: PlayerId, work: LegacyWork, cityId: string): string | null {
  const player = state.players.find(candidate => candidate.playerId === actor), core = state.core.players.find(owner => owner.id === actor);
  const city = core?.civilization.cities.find(candidate => candidate.id === cityId);
  if (!player || !city || state.occupations.some(occupation => occupation.cityId === cityId)) return 'Escolha uma cidade própria que não esteja ocupada.';
  const progress = state.legacyWorks.find(entry => entry.cityId === cityId);
  if (progress && progress.workId !== work.id) return 'A cidade já tem outra Obra de Legado.';
  if (progress?.completedRound != null) return 'Esta Obra já está concluída nesta cidade.';
  const taken = state.legacyWorks.find(entry => entry.workId === work.id && entry.cityId !== cityId);
  if (taken) return 'Esta Obra é única no mundo e já foi iniciada.';
  if (!progress) {
    const gate = legacyWorkGate(work.id);
    if (gate && !player.research.includes(gate.id)) return `Exige o avanço ${gate.name}.`;
    if (!city.districts.some(district => district.type === work.requires.district)) return 'A cidade precisa do distrito que serve de pré-requisito.';
    const fortification = state.cities.find(meta => meta.cityId === cityId)?.fortification.level ?? 'NONE';
    if (work.requires.fortification && FortificationLevelSchema.options.indexOf(fortification) < FortificationLevelSchema.options.indexOf(work.requires.fortification)) return 'A cidade precisa de uma fortificação mais forte.';
    if (work.requires.connectedCities && connectedCount(state, actor, cityId) < work.requires.connectedCities) return `Exige ${work.requires.connectedCities} cidades ligadas por rotas.`;
  }
  if (activationCapacity(state, cityId) < 2) return 'Um passo de Obra exige Capacidade 2 na cidade.';
  const stepCost = legacyStepCost(work, progress?.stepsDone ?? 0);
  if (!alphaCanAfford(state, actor, stepCost)) return 'Recursos insuficientes para este passo.';
  return null;
}

export function advanceLegacyWork(state: AlphaState, actor: PlayerId, command: { workId: string; cityId: string }): void {
  const work = legacyWork(command.workId);
  if (!work) throw new Error('Obra de Legado desconhecida.');
  const blocked = legacyWorkBlock(state, actor, work, command.cityId);
  if (blocked) throw new Error(blocked);
  let progress = state.legacyWorks.find(entry => entry.cityId === command.cityId);
  alphaPay(state, actor, legacyStepCost(work, progress?.stepsDone ?? 0));
  if (!progress) { progress = { workId: work.id, ownerId: actor, cityId: command.cityId as never, stepsDone: 0, startedRound: state.core.round, completedRound: null }; state.legacyWorks.push(progress); }
  progress.stepsDone++;
  const player = state.players.find(candidate => candidate.playerId === actor)!;
  if (progress.stepsDone >= LEGACY_WORK_STEPS) {
    progress.completedRound = state.core.round; player.prestige += LEGACY_WORK_PRESTIGE;
    alphaEvent(state, 'LEGACY_WORK_COMPLETED', `${work.name} foi concluída: +${LEGACY_WORK_PRESTIGE} Prestígio.`, null);
  } else alphaEvent(state, 'LEGACY_WORK_STEP', `${work.name}: passo ${progress.stepsDone} de ${LEGACY_WORK_STEPS}.`, null);
}

/** Public view of every Obra (a monument under construction is visible to all) plus what the viewer's cities can do about it. */
export function legacyWorkView(state: AlphaState, actor: PlayerId) {
  const cities = state.core.players.find(owner => owner.id === actor)?.civilization.cities ?? [];
  return LEGACY_WORKS.map(work => {
    const progress = state.legacyWorks.find(entry => entry.workId === work.id) ?? null;
    const gate = legacyWorkGate(work.id);
    return {
      id: work.id, name: work.name, path: work.path, source: work.source, steps: LEGACY_WORK_STEPS, cost: work.cost, requires: work.requires, gate,
      progress: progress ? { ownerId: progress.ownerId, cityId: progress.cityId, stepsDone: progress.stepsDone, complete: progress.completedRound !== null } : null,
      nextStepCost: progress && progress.completedRound === null ? legacyStepCost(work, progress.stepsDone) : legacyStepCost(work, 0),
      cities: progress && progress.ownerId !== actor ? [] : cities.map(city => ({ cityId: city.id, blocker: legacyWorkBlock(state, actor, work, city.id) })),
    };
  });
}

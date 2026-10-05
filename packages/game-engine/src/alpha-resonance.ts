import {
  REPERCUSSION_CARDS, advancementDomains, advancementSource, classifyResonance, repercussionCard, RESONANCE_SOCKETS,
  type AlphaState, type ChoiceOption, type PendingChoice, type PlayerId, type RepercussionCard, type RepercussionOp,
} from '@aoh/game-domain';
import { alphaEvent } from './alpha-events.js';
import { alphaRandomInteger } from './alpha-random.js';
import { alphaGain, alphaLose } from './alpha-resources.js';
import { canGrow, replaceCity } from './alpha-city.js';
import { applyThreatCommand } from './alpha-threats.js';

const playerOf = (state: AlphaState, actor: PlayerId) => state.players.find(player => player.playerId === actor)!;

/** Permanent mark (cube on the Teia) plus one temporary socket. The fifth socket resolves a Repercussão and clears all five. */
export function registerAdvance(state: AlphaState, actor: PlayerId, advancementId: string): void {
  const domains = advancementDomains(advancementId), source = advancementSource(advancementId);
  if (!domains || !source) return;
  const player = playerOf(state, actor), resonance = player.resonance;
  if (!resonance.marks.some(mark => mark.advancementId === advancementId)) resonance.marks.push({ advancementId, domains, round: state.core.round });
  const slots = [...resonance.slots, { advancementId, source, domains }];
  if (slots.length < RESONANCE_SOCKETS) { resonance.slots = slots; return; }
  resonance.slots = [];
  resolveRepercussion(state, actor, slots);
}

/** Deterministic pick among the cards that match the composition. */
export function pickRepercussion(state: AlphaState, kind: RepercussionCard['kind'], domains: readonly string[]): RepercussionCard {
  let pool = REPERCUSSION_CARDS.filter(card => card.kind === kind && (kind === 'CONFLUENCE' || card.domains.join() === domains.join()));
  if (pool.length === 0) pool = REPERCUSSION_CARDS.filter(card => card.kind === kind);
  return pool[alphaRandomInteger(state, pool.length)]!;
}

function resolveRepercussion(state: AlphaState, actor: PlayerId, slots: ReturnType<typeof playerOf>['resonance']['slots']): void {
  const player = playerOf(state, actor), composition = classifyResonance(slots), card = pickRepercussion(state, composition.kind, composition.domains);
  const owned = new Set(player.research);
  const mitigated = card.mitigatedBy.some(id => owned.has(id)), leveraged = card.leveragedBy.some(id => owned.has(id));
  if (!mitigated) applyOps(state, actor, card.price);
  const options: ChoiceOption[] = card.options.map(option => ({ ...option, ops: option.ops.map(op => (leveraged && op.op === 'GAIN' ? { ...op, n: op.n + 1 } : op)) }));
  player.resonance.cycles++;
  player.resonance.history = [...player.resonance.history, { round: state.core.round, kind: composition.kind, domains: composition.domains, cardId: card.id, slots: slots as never }].slice(-10);
  state.telemetry.resonanceCycles++;
  state.telemetry.resonanceByKind[composition.kind] = (state.telemetry.resonanceByKind[composition.kind] ?? 0) + 1;
  addPendingChoice(state, actor, { source: 'REPERCUSSION', cardId: card.id, title: card.name, text: `${card.text}${mitigated ? ' Preço mitigado.' : ''}${leveraged ? ' Ganho aproveitado.' : ''}`, mitigated, options });
  alphaEvent(state, 'REPERCUSSION', `Ressonância completa: ${card.name}. ${mitigated ? 'O preço foi mitigado. ' : ''}Escolha como aproveitar.`, [actor]);
}

export function addPendingChoice(state: AlphaState, actor: PlayerId, input: Omit<PendingChoice, 'id' | 'createdRound'>): PendingChoice {
  const player = playerOf(state, actor);
  const choice: PendingChoice = { ...input, id: `choice-${state.core.round}-${actor}-${player.resonance.cycles}-${player.pendingChoices.length}-${state.events.length}`, createdRound: state.core.round };
  player.pendingChoices.push(choice);
  return choice;
}

/** Applies card ops to one civilization. Scarce resources are lost down to zero, never below. */
export function applyOps(state: AlphaState, actor: PlayerId, ops: readonly RepercussionOp[]): void {
  const metas = state.cities.filter(meta => meta.currentOwnerId === actor);
  const owner = state.core.players.find(item => item.id === actor)!;
  for (const op of ops) {
    if (op.op === 'GAIN') alphaGain(state, actor, { [op.resource]: op.n });
    else if (op.op === 'LOSE') alphaLose(state, actor, { [op.resource]: Math.min(op.n, playerOf(state, actor).resources[op.resource]) });
    else if (op.op === 'PRESTIGE') playerOf(state, actor).prestige += op.n;
    else if (op.op === 'MOOD') {
      const targets = op.scope === 'ALL' ? metas : op.scope === 'CAPITAL' ? metas.filter(meta => meta.cityId === owner.civilization.capitalCityId) : [[...metas].sort((a, b) => a.mood - b.mood || a.cityId.localeCompare(b.cityId))[0]].filter((meta): meta is NonNullable<typeof meta> => meta !== undefined);
      for (const meta of targets) meta.mood = Math.max(0, Math.min(6, meta.mood + op.delta));
    } else if (op.op === 'POPULATION') {
      for (let i = 0; i < op.n; i++) {
        const city = owner.civilization.cities.find(item => item.id === owner.civilization.capitalCityId) ?? owner.civilization.cities[0];
        const meta = city && state.cities.find(item => item.cityId === city.id);
        if (city && meta && canGrow(meta, city)) replaceCity(state, city.id, { ...city, population: city.population + 1, workers: { ...city.workers, unassigned: city.workers.unassigned + 1 } });
        else alphaGain(state, actor, { food: 2 });
      }
    } else applyThreatCommand(state, actor, op);
  }
}

export function resolveChoice(state: AlphaState, actor: PlayerId, choiceId: string, optionId: string): void {
  const player = playerOf(state, actor), choice = player.pendingChoices.find(item => item.id === choiceId);
  if (!choice) throw new Error('Não há essa decisão pendente.');
  const option = choice.options.find(item => item.id === optionId);
  if (!option) throw new Error('Opção inexistente.');
  applyOps(state, actor, option.ops);
  player.pendingChoices = player.pendingChoices.filter(item => item.id !== choiceId);
  alphaEvent(state, 'CHOICE_RESOLVED', `${choice.title}: ${option.label}.`, [actor]);
}

/** Unresolved choices pick their first option when an Era turn starts (S5). Returns how many were auto-resolved. */
export function autoResolveChoices(state: AlphaState): number {
  let count = 0;
  for (const player of state.players) for (const choice of [...player.pendingChoices]) {
    resolveChoice(state, player.playerId, choice.id, choice.options[0]!.id); count++;
    alphaEvent(state, 'CHOICE_AUTO', `A decisão "${choice.title}" foi resolvida automaticamente pela primeira opção.`, [player.playerId]);
  }
  return count;
}
export { repercussionCard };

import { AlphaEraSchema, ERA_TURN_STEPS, GovernmentTypeSchema, eraForRound, eraNumeral, emptyAlphaResourcePool, type AlphaState, type GovernmentType, type PlayerId } from '@aoh/game-domain';
import { alphaEvent } from './alpha-events.js';
import { GOVERNMENT_NAMES, governmentEffects, governmentTable } from './alpha-government.js';
import { alphaCanAfford, alphaPay } from './alpha-resources.js';
import { citySustenance, refreshAlphaAdministration } from './alpha-city.js';
import { hasUnlock } from './alpha-institutions.js';
import { renewManeuvers, scoreAmbitions } from './alpha-cards.js';
import { autoResolveChoices } from './alpha-resonance.js';
import { activateThreats, growThreats } from './alpha-threats.js';
import { drawWorldPulse, openRound, setAlphaPhase } from './alpha-phases.js';

/**
 * The Era turn (canon §22). It sits between the last round of an Era and the first of the next, in nine steps. Steps 1–6 run
 * the moment the turn opens (their results are the public log); the turn then waits at step 7 for the players (pending
 * choices, one Ambição swap, defensive posture) and READY from everyone runs steps 7–9.
 */

/** The Era turn comes after the last round of every Era but the match's last. */
export const isEraTurnDue = (state: AlphaState): boolean => state.core.round % state.rules.roundsPerEra === 0 && state.core.round < state.rules.roundLimit;
/** The round whose planning may reserve the Influência Order for a government reform. */
export const isReformRound = isEraTurnDue;

/** Influência paid for a reform: 4 up to Era III, 6 afterwards (canon §16). */
export const reformCost = (era: string): number => ['FOUNDATION', 'EXPANSION', 'CONSOLIDATION'].includes(era) ? 4 : 6;

/** Why `government` cannot be reformed into now (reservation and execution share this), or null. */
export function governmentReformBlock(state: AlphaState, actor: PlayerId, government: GovernmentType): string | null {
  const player = state.players.find(candidate => candidate.playerId === actor)!;
  const owner = state.core.players.find(candidate => candidate.id === actor)!;
  if (owner.civilization.government === government) return 'Sua civilização já vive sob este governo.';
  if (!hasUnlock(state, actor, `government:${government}`)) return 'Este governo exige o avanço da Teia que o abre.';
  if (government === 'AUTOCRACY' && !player.research.includes('web-fortification')) return 'A Autocracia exige Centralização e Fortificação.';
  if (player.governmentReformEra === player.era) return 'Cada civilização reforma o governo no máximo uma vez por Era.';
  if (!alphaCanAfford(state, actor, { ...emptyAlphaResourcePool(), influence: reformCost(player.era) })) return `A reforma custa ${reformCost(player.era)} Influência.`;
  return null;
}

/** What the reform picker shows: only the adoptable governments, each with its cost and, when blocked, why. */
export function governmentOptions(state: AlphaState, actor: PlayerId) {
  const player = state.players.find(candidate => candidate.playerId === actor)!;
  const planned = player.plannedActions.find(action => action.type === 'GOVERNMENT_REFORM');
  return {
    /** The government in force: its name, two advantages and one limitation (canon §16), straight from `governmentEffects`. */
    current: (({ government, name, advantages, limitation }) => ({ government, name, advantages, limitation }))(governmentEffects(state, actor)),
    window: isEraTurnDue(state), cost: reformCost(player.era), reformedThisEra: player.governmentReformEra === player.era,
    planned: planned?.type === 'GOVERNMENT_REFORM' ? planned.government : null,
    options: GovernmentTypeSchema.options.map(government => ({ government, name: GOVERNMENT_NAMES[government], advantages: governmentTable(government).advantages, limitation: governmentTable(government).limitation, unlocked: hasUnlock(state, actor, `government:${government}`), block: governmentReformBlock(state, actor, government) })),
  };
}

function log(state: AlphaState, step: number, summary: string): void {
  state.eraTurn!.log.push({ step, summary });
  alphaEvent(state, 'ERA_TURN_STEP', `Virada de Era ${eraNumeral(state.eraTurn!.era)} · ${step}. ${ERA_TURN_STEPS[step - 1]}: ${summary}`);
}

/** Step 1: end-of-Era effects. A civilization whose Alimento stays above what its cities eat sees every integrated city gain 1 Ânimo. */
function sustenance(state: AlphaState): string {
  let cities = 0;
  for (const owner of state.core.players) {
    const progress = state.players.find(player => player.playerId === owner.id)!;
    const eats = owner.civilization.cities.reduce((total, city) => total + citySustenance(city.population), 0);
    if (progress.resources.food <= eats) continue;
    for (const meta of state.cities.filter(candidate => candidate.currentOwnerId === owner.id && candidate.status !== 'OCCUPIED')) if (meta.mood < 6) { meta.mood += 1; cities++; }
  }
  return cities ? `Alimento acima do consumo: ${cities} cidade(s) ganharam 1 de Ânimo.` : 'Nenhuma cidade com Alimento acima do consumo.';
}

/** Step 5 (I-7): reserved reforms run in initiative order; each is re-validated and a failed one costs nothing but its Order. */
function reforms(state: AlphaState): string {
  const done: string[] = [];
  for (const actor of state.initiative) {
    const player = state.players.find(candidate => candidate.playerId === actor)!;
    const planned = player.plannedActions.find(action => action.type === 'GOVERNMENT_REFORM');
    if (!planned || planned.type !== 'GOVERNMENT_REFORM') continue;
    player.plannedActions = player.plannedActions.filter(action => action.id !== planned.id);
    const blocked = governmentReformBlock(state, actor, planned.government);
    if (blocked) { alphaEvent(state, 'ACTION_FAILED', `A reforma de governo não pôde ser realizada: ${blocked}`, [actor]); continue; }
    alphaPay(state, actor, { ...emptyAlphaResourcePool(), influence: reformCost(player.era) });
    const owner = state.core.players.find(candidate => candidate.id === actor)!;
    owner.civilization = { ...owner.civilization, government: planned.government };
    player.governmentReformEra = player.era;
    const capital = state.cities.find(city => city.cityId === owner.civilization.capitalCityId);
    if (capital) capital.mood = Math.min(capital.mood, 3);
    refreshAlphaAdministration(state);
    alphaEvent(state, 'GOVERNMENT', `Governo reformado: ${GOVERNMENT_NAMES[planned.government]}. A capital fica Abalada na primeira rodada da nova Era.`);
    done.push(`${owner.name}: ${GOVERNMENT_NAMES[planned.government]}`);
  }
  return done.length ? `Reformas: ${done.join('; ')}.` : 'Nenhuma reforma de governo.';
}

/** Opens the Era turn: public steps 1–6 now, then wait for the players at step 7. */
export function enterEraTurn(state: AlphaState): void {
  const era = eraForRound(state.core.round, state.rules.roundsPerEra);
  state.eraTurn = { era, step: 1, log: [] };
  setAlphaPhase(state, 'ERA_TURN');
  state.players.forEach(player => { player.ready = false; });
  const auto = autoResolveChoices(state);
  if (auto) alphaEvent(state, 'CHOICE_AUTO_SUMMARY', `${auto} decisão(ões) pendente(s) foram resolvidas pela primeira opção.`);
  log(state, 1, sustenance(state));
  state.eraTurn.step = 2; const scored = scoreAmbitions(state);
  log(state, 2, scored ? `${scored} Ambição(ões) pontuada(s).` : 'Nenhuma Ambição concluída.');
  state.eraTurn.step = 3; drawWorldPulse(state);
  log(state, 3, state.worldPulse.current ? `${state.worldPulse.current.name}.` : 'Sem Pulso.');
  state.eraTurn.step = 4; const grown = growThreats(state); activateThreats(state, { launch: true });
  log(state, 4, `${grown} Acampamento(s) cresceram; as Ameaças agiram.`);
  state.eraTurn.step = 5; log(state, 5, reforms(state));
  state.eraTurn.step = 6;
  for (const player of state.players) if (player.leader) player.leader.eraAbilityUsed = false;
  log(state, 6, 'O poder de cada Líder foi recuperado.');
  state.eraTurn.step = 7;
}

/** Everyone confirmed step 7: renew Manobras (7), release the next tier of the Web (8), advance the Era together (9). */
export function finishEraTurn(state: AlphaState): void {
  if (state.phase !== 'ERA_TURN' || !state.eraTurn) throw new Error('Não há Virada de Era em andamento.');
  const era = state.eraTurn.era, next = AlphaEraSchema.options[AlphaEraSchema.options.indexOf(era) + 1] ?? era;
  state.eraTurn.step = 7; renewManeuvers(state); log(state, 7, 'Manobras +1 (até 5); as Reações voltaram ao baralho.');
  state.eraTurn.step = 8; log(state, 8, `O patamar da Era ${eraNumeral(next)} da Teia está liberado.`);
  state.eraTurn.step = 9; log(state, 9, `Começa a Era ${eraNumeral(next)}.`);
  const first = state.initiative.shift(); if (first) state.initiative.push(first);
  state.core.round += 1;
  state.core.pendingOrders = Object.fromEntries(state.core.players.map(player => [player.id, []]));
  state.telemetry.rounds = state.core.round;
  state.eraTurn = null;
  setAlphaPhase(state, 'WORLD_PULSE');
  openRound(state);
}

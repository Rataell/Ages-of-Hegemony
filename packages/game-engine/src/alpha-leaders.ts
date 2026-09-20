import { LEADERS, leaderStateFor, type AlphaLeader, type AlphaState, type LeaderPassive, type PlayerId } from '@aoh/game-domain';
import { alphaEvent } from './alpha-events.js';

/** The leader of a player's civilization, or null before a civilization is chosen. */
export function leaderOf(state: AlphaState, actor: PlayerId): AlphaLeader | null {
  const leaderId = state.players.find(player => player.playerId === actor)?.leader?.leaderId;
  return LEADERS.find(leader => leader.id === leaderId) ?? null;
}
/** Every civilization receives its leader automatically; this fills it for states that predate leaders. */
export function ensureLeaders(state: AlphaState): void {
  for (const player of state.players) if (player.leader === null && player.civilization !== null) player.leader = leaderStateFor(player.civilization);
}

function passive<K extends LeaderPassive['kind']>(state: AlphaState, actor: PlayerId, kind: K): Extract<LeaderPassive, { kind: K }> | null {
  const effect = leaderOf(state, actor)?.passiveAbility.effect;
  return effect && effect.kind === kind ? effect as Extract<LeaderPassive, { kind: K }> : null;
}
/** Extra storage capacity from the leader's passive, for one stored resource. */
export function leaderStorageBonus(state: AlphaState, actor: PlayerId, resource: 'food' | 'wood' | 'stone' | 'metal' | 'wealth'): number {
  const effect = passive(state, actor, 'STORAGE');
  return effect && effect.resource === resource ? effect.amount : 0;
}
export const leaderSupplyBonus = (state: AlphaState, actor: PlayerId): number => passive(state, actor, 'SUPPLY')?.amount ?? 0;
export const leaderIntegrationBonus = (state: AlphaState, actor: PlayerId): number => passive(state, actor, 'INTEGRATION')?.amount ?? 0;

/** Why the leader's era ability cannot be used now, or null. Pure: shared by the action and by the interface. */
export function leaderAbilityBlock(state: AlphaState, actor: PlayerId): string | null {
  const player = state.players.find(candidate => candidate.playerId === actor);
  const leader = leaderOf(state, actor);
  if (!player || !player.leader || !leader) return 'Sua civilização ainda não tem um líder.';
  if (player.leader.eraAbilityUsed) return 'A habilidade do líder já foi usada nesta Era.';
  const effect = leader.eraAbility.effect;
  const ceiling = state.rules.balance.promoteMoodCeiling;
  const own = state.cities.filter(city => city.currentOwnerId === actor);
  if (effect.kind === 'MOOD_ALL' && !own.some(city => city.mood < ceiling)) return 'Nenhuma cidade pode melhorar o ânimo agora.';
  if (effect.kind === 'COHESION_ALL' && !own.some(city => city.localCohesion < 100)) return 'A coesão de todas as cidades já está no máximo.';
  if (effect.kind === 'TREATY_EXTEND' && !state.treaties.some(treaty => treaty.status === 'ACTIVE' && [treaty.proposerId, treaty.recipientId].includes(actor))) return 'Nenhum tratado ativo para prorrogar.';
  return null;
}

/** Uses the leader's ability once for the current Era. Only ever affects the acting player's own civilization. */
export function useLeaderAbility(state: AlphaState, actor: PlayerId): void {
  const blocked = leaderAbilityBlock(state, actor);
  if (blocked) throw new Error(blocked);
  const player = state.players.find(candidate => candidate.playerId === actor)!;
  const leader = leaderOf(state, actor)!;
  const effect = leader.eraAbility.effect;
  switch (effect.kind) {
    case 'ROUND_BONUS':
      player.temporaryEffects.push({ source: leader.id, effect: { kind: effect.bonus, amount: effect.amount }, round: state.core.round });
      break;
    case 'MOOD_ALL':
      for (const city of state.cities) if (city.currentOwnerId === actor && city.mood < state.rules.balance.promoteMoodCeiling) city.mood = Math.min(state.rules.balance.promoteMoodCeiling, city.mood + effect.amount);
      break;
    case 'COHESION_ALL':
      for (const city of state.cities) if (city.currentOwnerId === actor) city.localCohesion = Math.min(100, city.localCohesion + effect.amount);
      break;
    case 'TREATY_EXTEND':
      for (const treaty of state.treaties) if (treaty.status === 'ACTIVE' && [treaty.proposerId, treaty.recipientId].includes(actor)) treaty.expiresRound += effect.rounds;
      break;
  }
  player.leader!.eraAbilityUsed = true;
  alphaEvent(state, 'LEADER_ABILITY', `${leader.name} usou ${leader.eraAbility.name}.`, [actor]);
}

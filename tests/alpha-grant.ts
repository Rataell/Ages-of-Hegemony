import { ADVANCEMENTS, AlphaEraSchema, type AlphaState, type PlayerId } from '@aoh/game-domain';

/**
 * Gives a civilization advances with their whole prerequisite chain. Its Era is raised only as far as the advances need (a state with a researched node of a later Era is not legal), never lowered (RC5: the `unit:*` tags are recruiting prerequisites, so tests that recruit
 * Guarda, Atiradores, Cavalaria, Cerco, Frota or Barca must research what opens them, as a real match would).
 */
export function grant(state: AlphaState, who: PlayerId | string, ...ids: string[]): void {
  const player = state.players.find(candidate => candidate.playerId === who)!;
  const visit = (id: string): void => {
    const node = ADVANCEMENTS.find(candidate => candidate.id === id)!;
    for (const prerequisite of [...node.prerequisites, ...node.prerequisitesAny.slice(0, 1)]) visit(prerequisite);
    if (!player.research.includes(id)) player.research.push(id);
    if (AlphaEraSchema.options.indexOf(player.era as never) < AlphaEraSchema.options.indexOf(node.era)) player.era = node.era as never;
  };
  ids.forEach(visit);
}

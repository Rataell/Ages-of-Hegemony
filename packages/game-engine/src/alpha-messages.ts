import { ADVANCEMENTS, ALPHA_RESOURCE_KEYS, type AlphaState, type PlannedAction, type PlayerId, type StrategicOrder } from '@aoh/game-domain';

/** Player-facing names for resolution messages. Events are read as written, so they never carry enum identifiers. */
const RESOURCE_NAMES: Record<string, string> = { food: 'Alimento', wood: 'Madeira', stone: 'Pedra', metal: 'Metal', wealth: 'Riqueza', knowledge: 'Conhecimento', influence: 'Influência' };
const DISTRICT_NAMES: Record<string, string> = { AGRARIAN: 'Agrário', COMMERCIAL: 'Comercial', ACADEMIC: 'Acadêmico', ADMINISTRATIVE: 'Administrativo', MILITARY: 'Militar', INDUSTRIAL: 'Industrial', CULTURAL: 'Cultural', MARITIME: 'Marítimo' };
const BUILDING_NAMES: Record<string, string> = { GRANARY: 'Celeiro', MARKET: 'Mercado', LIBRARY: 'Biblioteca', ARCHIVE: 'Arquivo', BARRACKS: 'Quartel', WORKSHOP: 'Oficina', CULTURAL_CENTER: 'Centro cultural' };

const playerName = (state: AlphaState, id: PlayerId) => state.core.players.find(player => player.id === id)?.name ?? 'Uma civilização';
const unitNames = (state: AlphaState, ids: readonly string[]) => {
  const counts = new Map<string, number>();
  for (const unit of state.units.filter(candidate => ids.includes(candidate.id))) {
    const name = state.rules.units[unit.kind].name;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts].map(([name, count]) => count > 1 ? `${name} ×${count}` : name).join(', ') || 'Peças';
};

/** "+2 Alimento, +1 Conhecimento": what the actor's pool gained between two states (losses are not listed). */
export function resourceGainText(before: AlphaState, after: AlphaState, actor: PlayerId): string {
  const a = before.players.find(player => player.playerId === actor)?.resources, b = after.players.find(player => player.playerId === actor)?.resources;
  if (!a || !b) return '';
  return ALPHA_RESOURCE_KEYS.filter(key => b[key] > a[key]).map(key => `+${b[key] - a[key]} ${RESOURCE_NAMES[key]}`).join(', ');
}

export function urbanActionMessage(before: AlphaState, after: AlphaState, actor: PlayerId, action: Extract<PlannedAction, { type: 'URBAN_ACTION' }>, cityName: string): string {
  switch (action.action) {
    case 'PRODUCE': { const gained = resourceGainText(before, after, actor); return `${cityName} produziu${gained ? ` ${gained}` : ''}.`; }
    case 'BUILD': {
      const build = action.build;
      const what = !build ? 'uma obra' : build.kind === 'DISTRICT' ? `o distrito ${DISTRICT_NAMES[build.district] ?? build.district}` : build.kind === 'BUILDING' ? `${BUILDING_NAMES[build.building] ?? build.building}` : 'fortificações';
      return `${cityName} construiu ${what}.`;
    }
    case 'RECRUIT': return `${cityName} recrutou ${action.unit ? before.rules.units[action.unit].name : 'uma peça'}.`;
    case 'RESEARCH': return `${cityName} concluiu a pesquisa ${ADVANCEMENTS.find(advancement => advancement.id === action.advancementId)?.name ?? ''}.`.replace(' .', '.');
    case 'PROMOTE_MOOD': return `${cityName} investiu no ânimo da população.`;
    case 'SUPPORT_TRADE': return `${cityName} sustentou o comércio.`;
    case 'CIVIC_ACTION': return `${cityName} realizou uma ação cívica.`;
  }
}

/** Written for everyone who can see the result, so it names the acting civilization. `before` still holds the moving pieces. */
export function orderMessage(before: AlphaState, actor: PlayerId, order: StrategicOrder, cityName?: string): string {
  const who = playerName(before, actor);
  switch (order.type) {
    case 'MOVE': return `${who}: ${unitNames(before, order.unitIds)} moveu-se para ${order.path.at(-1)}.`;
    case 'EXPLORE': return `${who}: ${unitNames(before, [order.unitId])} explorou a região de ${order.target}.`;
    case 'ATTACK': return `${who}: ataque em ${order.target} resolvido; consulte dados e perdas.`;
    case 'INFLUENCE': return `${who}: missão de influência em ${order.target}.`;
    case 'TRADE': return `${who}: rota de comércio estabelecida${cityName ? ` até ${cityName}` : ''}.`;
  }
}

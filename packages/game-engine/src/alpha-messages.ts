import { ADVANCEMENTS, ALPHA_RESOURCE_KEYS, BUILDING_NAMES_PT, REGION_TEMPLATES, heritageAdvance, type AlphaState, type PlannedAction, type PlayerId, type StrategicOrder } from '@aoh/game-domain';

/** Player-facing names for resolution messages. Events are read as written, so they never carry enum identifiers. */
const RESOURCE_NAMES: Record<string, string> = { food: 'Alimento', wood: 'Madeira', stone: 'Pedra', metal: 'Metal', wealth: 'Riqueza', knowledge: 'Conhecimento', influence: 'Influência', culture: 'Cultura' };
const DISTRICT_NAMES: Record<string, string> = { AGRARIAN: 'Agrário', COMMERCIAL: 'Comercial', ACADEMIC: 'Acadêmico', ADMINISTRATIVE: 'Administrativo', MILITARY: 'Militar', INDUSTRIAL: 'Industrial', CULTURAL: 'Cultural', MARITIME: 'Marítimo' };
const BUILDING_NAMES: Record<string, string> = BUILDING_NAMES_PT;

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
    case 'RESEARCH': return `${cityName} concluiu a pesquisa ${(ADVANCEMENTS.find(advancement => advancement.id === action.advancementId) ?? heritageAdvance(action.advancementId ?? ''))?.name ?? ''}.`.replace(' .', '.');
    case 'PROMOTE_MOOD': return `${cityName} investiu no ânimo da população.`;
    case 'EMERGENCY_GOVERN': return `${cityName} saiu da Revolta por recuperação emergencial.`;
    case 'SUPPORT_TRADE': return `${cityName} sustentou o comércio.`;
    case 'CIVIC_ACTION': return `${cityName} realizou uma ação cívica.`;
    case 'MOVE_CAPITAL': return `${cityName} tornou-se a capital.`;
    case 'ELEVATE': return `${cityName} foi elevada de nível.`;
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

/** A Move that opened a Region: written for everyone who sees that hex. The Region's name is public once it is face up. */
export function discoveryMessage(before: AlphaState, actor: PlayerId, order: Extract<StrategicOrder, { type: 'MOVE' }>, templateId: string, entered: boolean): string {
  const region = REGION_TEMPLATES.find(template => template.id === templateId)?.name ?? 'uma Região';
  return `${playerName(before, actor)}: ${unitNames(before, order.unitIds)} ${entered ? 'entrou em' : 'chegou à fronteira de'} ${region} — Região revelada.`;
}

export const TREATY_NAMES: Record<string, string> = { TRADE_AGREEMENT: 'um acordo comercial', NON_AGGRESSION_PACT: 'um pacto de não agressão', OPEN_BORDERS: 'fronteiras abertas', DEFENSIVE_PACT: 'um pacto defensivo', ALLIANCE: 'uma aliança', EMBARGO: 'um embargo' };

type Battle = AlphaState['battles'][number];
/** "Beto atacou Ana em 7,6 e foi repelido (Ataque 3 × Defesa 5)." Totals are public once the dice are rolled. */
export function battleMessage(names: Map<string, string>, battle: Battle): string {
  const attacker = names.get(battle.attackerId) ?? 'O atacante', defender = names.get(battle.defenderId) ?? 'o defensor';
  const delta = battle.delta ?? battle.attackTotal - battle.defenseTotal;
  const reading = battle.outcome === 'TIE' ? 'e a batalha terminou em empate tático'
    : battle.winnerId === battle.attackerId ? (battle.outcome === 'DECISIVE' ? 'e venceu de forma decisiva' : 'e venceu') : (battle.outcome === 'DECISIVE' ? 'e foi repelido de forma decisiva' : 'e foi repelido');
  return `${attacker} atacou ${defender} em ${battle.hexId} ${reading} (Ataque ${battle.attackTotal} × Defesa ${battle.defenseTotal}, Δ ${delta > 0 ? '+' : ''}${delta}).`;
}

/** "Beto perdeu Infantaria. Ana perdeu Pioneiro." Uses the pieces as they were before the battle removed them. */
export function lossesMessage(before: { units: Map<string, { kind: string; ownerId: string }>; rules: AlphaState['rules']; names: Map<string, string> }, losses: readonly string[]): string {
  const byOwner = new Map<string, string[]>();
  for (const id of losses) { const unit = before.units.get(id); if (!unit) continue; byOwner.set(unit.ownerId, [...(byOwner.get(unit.ownerId) ?? []), before.rules.units[unit.kind as keyof AlphaState['rules']['units']].name]); }
  return [...byOwner].map(([owner, kinds]) => `${before.names.get(owner) ?? 'Uma civilização'} perdeu ${kinds.join(', ')}.`).join(' ') || `${losses.length} peça(s) perdida(s) no conflito.`;
}

import { z } from 'zod';
import { CIVILIZATIONS } from './alpha-institutions.js';
import { FIGURES, isCore10Chassis, recommendedFigure } from './alpha-core10.js';

/**
 * Every Alpha number a leader may use. One table, so power stays comparable: passives are small standing conveniences, era
 * abilities are one-round or one-shot nudges. Nothing here produces resources, recruits pieces, skips research or wins the game.
 */
export const ALPHA_LEADER_BUDGET = {
  passive: { storageBase: 6, storageMetal: 4, supplyRadius: 1, integrationPerCivic: 10 },
  ability: { strength: 2, movement: 1, command: 1, moodAll: 1, cohesionAll: 15, treatyRounds: 2 },
} as const;

const StoredResourceSchema = z.enum(['food', 'wood', 'stone', 'metal', 'wealth']);
export const LeaderPassiveSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('STORAGE'), resource: StoredResourceSchema, amount: z.number().int().min(1).max(6) }),
  z.strictObject({ kind: z.literal('SUPPLY'), amount: z.number().int().min(1).max(1) }),
  z.strictObject({ kind: z.literal('INTEGRATION'), amount: z.number().int().min(1).max(10) }),
]);
export type LeaderPassive = z.infer<typeof LeaderPassiveSchema>;

export const LeaderAbilityEffectSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('ROUND_BONUS'), bonus: z.enum(['STRENGTH', 'MOVEMENT', 'COMMAND']), amount: z.number().int().min(1).max(2) }),
  z.strictObject({ kind: z.literal('MOOD_ALL'), amount: z.number().int().min(1).max(1) }),
  z.strictObject({ kind: z.literal('COHESION_ALL'), amount: z.number().int().min(1).max(15) }),
  z.strictObject({ kind: z.literal('TREATY_EXTEND'), rounds: z.number().int().min(1).max(2) }),
]);
export type LeaderAbilityEffect = z.infer<typeof LeaderAbilityEffectSchema>;

export interface AlphaLeader {
  id: string; name: string; title: string; civilizationId: string; symbol: string;
  /** Pre-1.2 leaders: kept so a saved V1.1 match still reads; never offered in a new match. */
  legacy?: boolean;
  passiveAbility: { name: string; description: string; effect: LeaderPassive };
  eraAbility: { name: string; description: string; effect: LeaderAbilityEffect };
}
/** What a match stores about a leader: which one, and whether this Era's ability was already used. */
export const LeaderStateSchema = z.strictObject({ leaderId: z.string().min(1).max(64), eraAbilityUsed: z.boolean() });
export type LeaderState = z.infer<typeof LeaderStateSchema>;

const B = ALPHA_LEADER_BUDGET;
const storage = (resource: z.infer<typeof StoredResourceSchema>): LeaderPassive => ({ kind: 'STORAGE', resource, amount: resource === 'metal' ? B.passive.storageMetal : B.passive.storageBase });
const supply: LeaderPassive = { kind: 'SUPPLY', amount: B.passive.supplyRadius };
const integration: LeaderPassive = { kind: 'INTEGRATION', amount: B.passive.integrationPerCivic };
const bonus = (kind: 'STRENGTH' | 'MOVEMENT' | 'COMMAND'): LeaderAbilityEffect => ({ kind: 'ROUND_BONUS', bonus: kind, amount: B.ability[kind === 'STRENGTH' ? 'strength' : kind === 'MOVEMENT' ? 'movement' : 'command'] });
const mood: LeaderAbilityEffect = { kind: 'MOOD_ALL', amount: B.ability.moodAll };
const cohesion: LeaderAbilityEffect = { kind: 'COHESION_ALL', amount: B.ability.cohesionAll };
const treaty: LeaderAbilityEffect = { kind: 'TREATY_EXTEND', rounds: B.ability.treatyRounds };

type Row = [civilizationId: string, id: string, name: string, title: string, symbol: string, passive: [string, string, LeaderPassive], ability: [string, string, LeaderAbilityEffect]];
const rows: Row[] = [
  ['aurelia', 'leader-maera-vaelun', 'Maera Vaelun', 'Guardiã dos Celeiros', 'AV', ['Celeiros de cortesia', 'Os celeiros comuns guardam mais Alimentos.', storage('food')], ['Festa da Colheita', 'Uma vez por Era, o ânimo de todas as suas cidades sobe 1 (até o limite do investimento público).', mood]],
  ['valgard', 'leader-toren-hjalvar', 'Toren Hjalvar', 'Senhor das Passagens', 'TH', ['Refúgios abastecidos', 'Suas peças ficam abastecidas 1 hex mais longe das cidades.', supply], ['Muralha Viva', 'Uma vez por Era, suas peças ganham +2 de Força nos conflitos desta rodada.', bonus('STRENGTH')]],
  ['meridia', 'leader-isaure-mekhan', 'Isaure Mekhan', 'Voz das Margens', 'IM', ['Casas de câmbio', 'Suas casas de troca guardam mais Riqueza.', storage('wealth')], ['Rede de Correspondentes', 'Uma vez por Era, +1 ponto de comando nesta rodada.', bonus('COMMAND')]],
  ['thalos', 'leader-kaelis-orran', 'Kaelis Orran', 'Cartógrafa das Costas', 'KO', ['Cartas de abastecimento', 'Suas peças ficam abastecidas 1 hex mais longe das cidades.', supply], ['Carta Nova', 'Uma vez por Era, suas peças ganham +1 de movimento nesta rodada.', bonus('MOVEMENT')]],
  ['saren', 'leader-oduan-saretha', 'Oduan Saretha', 'Presidente do Concílio dos Vales', 'OS', ['Acordos de vizinhança', 'A Ação cívica integra 10 pontos a mais em cidades ocupadas.', integration], ['Selo do Concílio', 'Uma vez por Era, seus tratados ativos duram mais 2 rodadas.', treaty]],
  ['kor', 'leader-brakka-kordun', 'Brakka Kordun', 'Mestre da Transformação', 'BK', ['Depósito de ferragens', 'Suas oficinas guardam mais Metal.', storage('metal')], ['Rotina de Manutenção', 'Uma vez por Era, a coesão local de todas as suas cidades sobe 15.', cohesion]],
  ['orinth', 'leader-ilaen-orivane', 'Ilaen Orivane', 'Observadora-Chefe', 'IO', ['Arquivo de medidas', 'Seus arquivos guardam mais Pedra de referência.', storage('stone')], ['Padrão de Métodos', 'Uma vez por Era, +1 ponto de comando nesta rodada.', bonus('COMMAND')]],
  ['nymara', 'leader-suvi-nymeru', 'Suvi Nymeru', 'Memória Viva', 'SN', ['Bosques de memória', 'Seus bosques comuns guardam mais Madeira.', storage('wood')], ['Ritual das Sementes', 'Uma vez por Era, o ânimo de todas as suas cidades sobe 1 (até o limite do investimento público).', mood]],
  ['veyra', 'leader-delphar-veyn', 'Delphar Veyn', 'Árbitro das Rotas', 'DV', ['Pontos de confiança', 'A Ação cívica integra 10 pontos a mais em cidades ocupadas.', integration], ['Caravana Expressa', 'Uma vez por Era, suas peças ganham +1 de movimento nesta rodada.', bonus('MOVEMENT')]],
  ['solenne', 'leader-amaris-solenth', 'Amaris Solenth', 'Anfitriã das Vozes', 'AS', ['Casa aberta', 'A Ação cívica integra 10 pontos a mais em cidades ocupadas.', integration], ['Assembleia Prorrogada', 'Uma vez por Era, seus tratados ativos duram mais 2 rodadas.', treaty]],
  ['dravik', 'leader-hartvig-drell', 'Hartvig Drell', 'Arquiteto das Obras', 'HD', ['Redes de abastecimento', 'Suas peças ficam abastecidas 1 hex mais longe das cidades.', supply], ['Obra Defensiva', 'Uma vez por Era, suas peças ganham +2 de Força nos conflitos desta rodada.', bonus('STRENGTH')]],
  ['elyra', 'leader-lirien-elyrae', 'Lirien Elyrae', 'Curadora Itinerante', 'LE', ['Vínculos de aprendizado', 'A Ação cívica integra 10 pontos a mais em cidades ocupadas.', integration], ['Escola de Convivência', 'Uma vez por Era, a coesão local de todas as suas cidades sobe 15.', cohesion]],
];

const legacyLeaders: AlphaLeader[] = rows.map(([civilizationId, id, name, title, symbol, passive, ability]) => ({
  id, name, title, civilizationId, symbol, legacy: isCore10Chassis(civilizationId),
  passiveAbility: { name: passive[0], description: passive[1], effect: LeaderPassiveSchema.parse(passive[2]) },
  eraAbility: { name: ability[0], description: ability[1], effect: LeaderAbilityEffectSchema.parse(ability[2]) },
}));
const RESOURCE_NAMES = { food: 'Alimento', wood: 'Madeira', stone: 'Pedra', metal: 'Metal', wealth: 'Riqueza' } as const;
const passiveText = (effect: LeaderPassive): string => effect.kind === 'STORAGE' ? `Seu limite de ${RESOURCE_NAMES[effect.resource]} aumenta em ${effect.amount}.`
  : effect.kind === 'SUPPLY' ? 'Suas peças ficam abastecidas 1 hex mais longe das cidades.' : `A Ação cívica integra ${effect.amount} pontos a mais em cidades ocupadas.`;
const powerText = (effect: LeaderAbilityEffect): string => effect.kind === 'ROUND_BONUS'
  ? (effect.bonus === 'STRENGTH' ? `Uma vez por Era, suas peças ganham +${effect.amount} de Força nos conflitos desta rodada.` : effect.bonus === 'MOVEMENT' ? `Uma vez por Era, suas peças ganham +${effect.amount} de movimento nesta rodada.` : `Uma vez por Era, +${effect.amount} ponto de comando nesta rodada.`)
  : effect.kind === 'MOOD_ALL' ? `Uma vez por Era, o ânimo de todas as suas cidades sobe ${effect.amount}.`
  : effect.kind === 'COHESION_ALL' ? `Uma vez por Era, a coesão local de todas as suas cidades sobe ${effect.amount}.` : `Uma vez por Era, seus tratados ativos duram mais ${effect.rounds} rodadas.`;
const plain = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const initials = (name: string) => { const words = plain(name).split(/[\s,]+/).filter(word => /^[A-Z]/.test(word)); return (words.length > 1 ? words.slice(0, 2).map(word => word[0]).join('') : (words[0] ?? plain(name)).slice(0, 2)).toUpperCase(); };
/** The 30 playable Figuras of the Core 10 (3 per civilization), validated against the same budget as every leader. */
const figureLeaders: AlphaLeader[] = FIGURES.map(figure => ({
  id: figure.id, name: figure.name, title: figure.archetype, civilizationId: figure.civilizationId, symbol: initials(figure.name),
  passiveAbility: { name: figure.passive.name, description: passiveText(figure.passive.effect), effect: LeaderPassiveSchema.parse(figure.passive.effect) },
  eraAbility: { name: figure.power.name, description: powerText(figure.power.effect), effect: LeaderAbilityEffectSchema.parse(figure.power.effect) },
}));
export const LEADERS: readonly AlphaLeader[] = [...legacyLeaders, ...figureLeaders];

/** The Figuras a player may pick for a civilization (three for the Core 10; the single legacy leader otherwise). */
export const figuresOfCivilization = (civilizationId: string | null): AlphaLeader[] => {
  const figures = figureLeaders.filter(leader => leader.civilizationId === civilizationId);
  return figures.length ? figures : legacyLeaders.filter(leader => leader.civilizationId === civilizationId);
};
/** The default Figura of a civilization: the one marked recommended for beginners (★). */
export const leaderOfCivilization = (civilizationId: string | null): AlphaLeader | null => {
  const star = recommendedFigure(civilizationId);
  return (star ? LEADERS.find(leader => leader.id === star.id) : null) ?? figuresOfCivilization(civilizationId)[0] ?? null;
};
/** A match's leader state for a chosen Figura (or the recommended one); a Figura of another civilization is refused with null. */
export const leaderStateFor = (civilizationId: string | null, figureId?: string | null): LeaderState | null => {
  const leader = figureId ? figuresOfCivilization(civilizationId).find(candidate => candidate.id === figureId) ?? null : leaderOfCivilization(civilizationId);
  return leader ? { leaderId: leader.id, eraAbilityUsed: false } : null;
};
/** Consistency guard used by the catalog tests and the state schema. */
export const LEADER_CIVILIZATION_IDS = CIVILIZATIONS.map(civilization => civilization.id);

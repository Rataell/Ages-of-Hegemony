import { z } from 'zod';
import { CityIdSchema, IdentifierSchema, PlayerIdSchema, PositiveIntegerSchema as P } from './core.js';
import { emptyAlphaResourcePool, type AlphaResourcePool, type FortificationLevelSchema } from './alpha-concept.js';
import type { AlphaEffect } from './alpha-institutions.js';
import type { DistrictTypeSchema } from './territory.js';

/**
 * Obras de Legado (canon §11 / D-3): the only monument system. Each Obra is unique in the world and unique per city, costs 10–16
 * resources paid over {@link LEGACY_WORK_STEPS} steps (one Legado Order each), needs a prerequisite in the city, gives +4 Prestígio and one
 * permanent effect when complete. The pre-V5.1b Grandes Projetos survive only as the six `CONVERTED` rows below.
 */
export const LEGACY_WORK_STEPS = 3;
export const LEGACY_WORK_PRESTIGE = 4;
export type LegacyWorkPath = 'SCIENTIFIC' | 'POLITICAL' | 'ECONOMIC' | 'CULTURAL' | 'MILITARY' | 'TERRITORIAL';
export interface LegacyWorkRequirement {
  /** The district stands in for the canon prerequisite building until the 29-building catalog lands (GR-23): Academia, Chancelaria, Entreposto, Teatro. */
  district: z.infer<typeof DistrictTypeSchema>;
  fortification?: Exclude<z.infer<typeof FortificationLevelSchema>, 'NONE'>;
  /** Cities of the civilization joined by internal trade routes (Estrada das Comunidades: 3). */
  connectedCities?: number;
}
export interface LegacyWork {
  id: string; name: string; path: LegacyWorkPath; cost: AlphaResourcePool; requires: LegacyWorkRequirement; effect: AlphaEffect;
  /** `CANON` rows are the §11 examples; `CONVERTED` rows are old Grandes Projetos rewritten into this schema (costs authored, not in the canon text). */
  source: 'CANON' | 'CONVERTED';
}
const cost = (part: Partial<AlphaResourcePool>): AlphaResourcePool => ({ ...emptyAlphaResourcePool(), ...part });
const produce = (resource: 'food' | 'materials' | 'wealth' | 'knowledge' | 'influence', timing: 'MAINTENANCE' | 'ON_PRODUCE' = 'MAINTENANCE'): AlphaEffect => ({ kind: 'PRODUCTION', resource, amount: 1, timing });
export const LEGACY_WORKS: readonly LegacyWork[] = [
  { id: 'archive-of-horizons', name: 'Arquivo dos Horizontes', path: 'SCIENTIFIC', source: 'CANON', cost: cost({ stone: 6, wood: 4, knowledge: 3 }), requires: { district: 'ACADEMIC' }, effect: produce('knowledge') },
  { id: 'house-of-accord', name: 'Casa dos Acordos', path: 'POLITICAL', source: 'CANON', cost: cost({ stone: 5, wealth: 3, influence: 3 }), requires: { district: 'ADMINISTRATIVE' }, effect: produce('influence') },
  { id: 'tidal-exchange', name: 'Entreposto das Marés', path: 'ECONOMIC', source: 'CANON', cost: cost({ wood: 5, stone: 4, wealth: 4 }), requires: { district: 'COMMERCIAL' }, effect: produce('wealth') },
  { id: 'monument-of-voices', name: 'Monumento das Vozes', path: 'CULTURAL', source: 'CANON', cost: cost({ stone: 6, wood: 2, culture: 4 }), requires: { district: 'CULTURAL' }, effect: produce('influence') },
  { id: 'watch-citadel', name: 'Cidadela da Vigília', path: 'MILITARY', source: 'CANON', cost: cost({ stone: 8, metal: 4, wealth: 2 }), requires: { district: 'MILITARY', fortification: 'FORTRESS' }, effect: produce('materials') },
  { id: 'road-of-communities', name: 'Estrada das Comunidades', path: 'TERRITORIAL', source: 'CANON', cost: cost({ wood: 6, stone: 6, wealth: 2 }), requires: { district: 'INDUSTRIAL', connectedCities: 3 }, effect: produce('materials', 'ON_PRODUCE') },
  { id: 'sky-instrument', name: 'Instrumento do Firmamento', path: 'SCIENTIFIC', source: 'CONVERTED', cost: cost({ stone: 5, knowledge: 5, metal: 2 }), requires: { district: 'ACADEMIC' }, effect: produce('knowledge') },
  { id: 'inquiry-campus', name: 'Pátio da Investigação', path: 'SCIENTIFIC', source: 'CONVERTED', cost: cost({ stone: 4, wood: 4, knowledge: 4 }), requires: { district: 'ACADEMIC' }, effect: produce('knowledge') },
  { id: 'world-council', name: 'Conselho dos Horizontes', path: 'POLITICAL', source: 'CONVERTED', cost: cost({ stone: 4, wealth: 3, influence: 5 }), requires: { district: 'ADMINISTRATIVE' }, effect: produce('influence') },
  { id: 'common-mint', name: 'Casa da Medida Comum', path: 'ECONOMIC', source: 'CONVERTED', cost: cost({ stone: 4, wood: 2, wealth: 6 }), requires: { district: 'COMMERCIAL' }, effect: produce('wealth') },
  { id: 'terraced-reserves', name: 'Reservas dos Terraços', path: 'TERRITORIAL', source: 'CONVERTED', cost: cost({ wood: 4, stone: 5, food: 3 }), requires: { district: 'AGRARIAN' }, effect: produce('food', 'ON_PRODUCE') },
  { id: 'shared-foundry', name: 'Fundição Compartilhada', path: 'ECONOMIC', source: 'CONVERTED', cost: cost({ stone: 5, metal: 4, wood: 3 }), requires: { district: 'INDUSTRIAL' }, effect: produce('materials', 'ON_PRODUCE') },
];
/** IDENTIDADE line of each Obra card (common card grammar) and the silhouette the 3D piece follows. Names are AoH's own; they remit to a kind of monument, never to a real one. */
export const LEGACY_WORK_IDENTITY: Readonly<Record<string, { identity: string; silhouette: string }>> = {
  'archive-of-horizons': { identity: 'Uma biblioteca-farol onde cada rolo aponta para um horizonte ainda por visitar.', silhouette: 'torre baixa com lanterna e galerias de rolos' },
  'house-of-accord': { identity: 'Salão de pedra onde adversários sentam-se à mesma mesa para ratificar acordos.', silhouette: 'salão largo de colunas curtas e frontão' },
  'tidal-exchange': { identity: 'Um entreposto que sobe e desce com a maré: o comércio vem com a água.', silhouette: 'cais coberto sobre arcos, com guindastes' },
  'monument-of-voices': { identity: 'Um anel de colunas cantantes que guarda a memória das comunidades.', silhouette: 'anel de colunas ao redor de um monólito' },
  'watch-citadel': { identity: 'Cidadela de vigília: quem a vê sabe que a fronteira tem olhos.', silhouette: 'torre-mestra com quatro torres de canto' },
  'road-of-communities': { identity: 'A estrada que costura cidades distantes numa só gente.', silhouette: 'marco de estrada com arco e pavimento em fuga' },
  'sky-instrument': { identity: 'Um grande círculo de bronze que mede o céu e ensina o calendário.', silhouette: 'anel armilar de bronze sobre pedestal' },
  'inquiry-campus': { identity: 'Pátio de pedra onde mestres e aprendizes discutem em círculos.', silhouette: 'pátio quadrado de claustro com fonte' },
  'world-council': { identity: 'Uma sala de assembleia aberta ao mundo, com um assento para cada povo.', silhouette: 'rotunda com cúpula rasa e degraus em anel' },
  'common-mint': { identity: 'A casa onde pesos e medidas são fixados para todos.', silhouette: 'prédio compacto com balança sobre a porta' },
  'terraced-reserves': { identity: 'Terraços de pedra que guardam a colheita contra os anos magros.', silhouette: 'terraços escalonados com depósitos' },
  'shared-foundry': { identity: 'Um forno comum onde todas as oficinas fundem juntas.', silhouette: 'forja de chaminé alta com telhado de duas águas' },
};
export const legacyWork = (id: string): LegacyWork | undefined => LEGACY_WORKS.find(work => work.id === id);
export const totalOf = (pool: AlphaResourcePool): number => Object.values(pool).reduce((sum, value) => sum + value, 0);
/** What one step costs: each resource splits across the steps, the remainder going to the first ones (6 → 2/2/2, 4 → 2/1/1, 3 → 1/1/1, 2 → 1/1/0). */
export function legacyStepCost(work: LegacyWork, step: number): AlphaResourcePool {
  const part = emptyAlphaResourcePool();
  for (const key of Object.keys(part) as (keyof AlphaResourcePool)[]) { const total = work.cost[key]; part[key] = Math.floor(total / LEGACY_WORK_STEPS) + (step < total % LEGACY_WORK_STEPS ? 1 : 0); }
  return part;
}
/** Ids the old saves used, mapped to the canon ids (`voices-monument` → `monument-of-voices`). */
export const LEGACY_WORK_ID_ALIASES: Readonly<Record<string, string>> = { 'voices-monument': 'monument-of-voices' };

export const LegacyWorkProgressSchema = z.strictObject({
  workId: IdentifierSchema, ownerId: PlayerIdSchema, cityId: CityIdSchema,
  stepsDone: z.number().int().min(1).max(LEGACY_WORK_STEPS), startedRound: P, completedRound: P.nullable(),
});
export type LegacyWorkProgress = z.infer<typeof LegacyWorkProgressSchema>;

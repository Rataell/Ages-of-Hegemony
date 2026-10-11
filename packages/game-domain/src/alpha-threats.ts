import { z } from 'zod';
import { HexIdSchema, IdentifierSchema, NonNegativeIntegerSchema as N, PlayerIdSchema } from './core.js';
import { AlphaUnitClassSchema } from './alpha-catalog.js';
import type { ChoiceOption } from './alpha-resonance.js';

/** World threats (V5.1b canon §21b): Acampamentos that march as Bandos, and pirate Ancoradouros. The shock engine treats the world as a side. */
export const WORLD_ID = PlayerIdSchema.parse('world');
export const isWorld = (id: string): boolean => id === WORLD_ID;
export const ThreatKindSchema = z.enum(['CAMP', 'PIRATE']);
export type ThreatKind = z.infer<typeof ThreatKindSchema>;
export const ThreatStatusSchema = z.enum(['CAMPED', 'MARCHING']);
export const ThreatLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type ThreatLevel = z.infer<typeof ThreatLevelSchema>;
export const ThreatCompositionSchema = z.array(z.strictObject({ kind: AlphaUnitClassSchema, count: z.number().int().min(1).max(12) })).max(6);
export type ThreatComposition = z.infer<typeof ThreatCompositionSchema>;
export const ThreatSchema = z.strictObject({
  id: IdentifierSchema, kind: ThreatKindSchema, hexId: HexIdSchema, homeHexId: HexIdSchema, level: ThreatLevelSchema,
  status: ThreatStatusSchema, composition: ThreatCompositionSchema, createdRound: N, lastActedRound: N,
  /** The reward of destroying a camp is paid once. */
  rewardPaid: z.boolean().default(false),
  /** RECÉM-SURGIDO (D-1): a camp stays vulnerable until one full Planning round has passed; it cannot launch a Bando while fresh. */
  fresh: z.boolean().default(false),
  /** R1 (V1.2): after an assault on a city a Bando walks back to its Acampamento (`homeHexId`) instead of besieging the city; it is in the field, visible and attackable, and does not assault while it walks. */
  withdrawing: z.boolean().default(false),
  /** R1: a Bando that came home reorganizes; it cannot be launched again before this round (one full round after arrival). */
  readyRound: N.default(0),
});
export type Threat = z.infer<typeof ThreatSchema>;

/**
 * Composition by level and Era index (0 = Era I). Camps (canon §21b): I = 2 Infantaria; II = 3 Infantaria + 1 Arqueiros (Cavalaria from Era III);
 * III = 4 Infantaria + 1 Cavalaria (+ 1 Cerco from Era V). Pirates (I-6): N Frotas for level N.
 */
export function threatComposition(kind: ThreatKind, level: ThreatLevel, eraIndex: number): ThreatComposition {
  if (kind === 'PIRATE') return [{ kind: 'FLEET', count: level }];
  if (level === 1) return [{ kind: 'INFANTRY', count: 2 }];
  if (level === 2) return [{ kind: 'INFANTRY', count: 3 }, { kind: eraIndex >= 2 ? 'CAVALRY' : 'RANGED', count: 1 }];
  return [{ kind: 'INFANTRY', count: 4 }, { kind: 'CAVALRY', count: 1 }, ...(eraIndex >= 4 ? [{ kind: 'SIEGE' as const, count: 1 }] : [])];
}
export const threatPieceIds = (threat: Pick<Threat, 'id' | 'composition'>): { id: string; kind: z.infer<typeof AlphaUnitClassSchema> }[] =>
  threat.composition.flatMap(entry => Array.from({ length: entry.count }, (_, index) => ({ id: `${threat.id}:${entry.kind}:${index + 1}`, kind: entry.kind })));
/** Visible names (V1.2: "Bárbaros" is gone; internal ids CAMP/BAND/camp-r… stay). The single source of every label of a threat. */
export const THREAT_NAMES: Record<ThreatKind, { camp: string; band: string; short: string }> = { CAMP: { camp: 'Acampamento de Saqueadores', band: 'Bando de Saqueadores', short: 'Saqueadores' }, PIRATE: { camp: 'Ancoradouro pirata', band: 'Piratas', short: 'Piratas' } };

/** Hidden region content, decided at match creation (canon §21). */
export const DiscoveryKindSchema = z.enum(['RUIN', 'DEPOSIT', 'PASSAGE', 'ANCHORAGE', 'DANGER', 'CAMP', 'NONE']);
export type DiscoveryKind = z.infer<typeof DiscoveryKindSchema>;
export const RegionDiscoverySchema = z.strictObject({ kind: DiscoveryKindSchema, resolved: z.boolean(), resolvedBy: PlayerIdSchema.nullable().default(null) });
export type RegionDiscovery = z.infer<typeof RegionDiscoverySchema>;
export const DISCOVERY_WEIGHTS: readonly (readonly [DiscoveryKind, number])[] = [['NONE', 25], ['RUIN', 20], ['DEPOSIT', 15], ['PASSAGE', 10], ['ANCHORAGE', 10], ['DANGER', 10], ['CAMP', 10]];
/**
 * What the REGIÃO REVELADA panel and the Compêndio say about each Descoberta (card grammar: name, identity, effect). `marker` says whether the map keeps
 * a permanent 3D marker on the Region (Perigo is a one-off effect; Terra comum has nothing to mark).
 */
export const DISCOVERY_INFO: Record<DiscoveryKind, { name: string; identity: string; effect: string; marker: boolean }> = {
  RUIN: { name: 'Vestígio', identity: 'Restos de pedra lavrada de um povo que passou por aqui antes de todos.', effect: 'Os exploradores encontram algo que pede uma escolha.', marker: true },
  DEPOSIT: { name: 'Jazida', identity: 'Um afloramento de rocha rara aparece entre as colinas.', effect: '+2 Pedra e +1 Metal; a rocha passa a ter Metal.', marker: true },
  PASSAGE: { name: 'Passagem', identity: 'Um caminho natural já aberto liga a região ao resto do mapa.', effect: 'Abre até 3 hexes de Estrada na região.', marker: true },
  ANCHORAGE: { name: 'Ancoradouro', identity: 'Uma enseada protegida, boa para fundear e pescar.', effect: '+1 Riqueza; a primeira costa da região ganha boa pesca.', marker: true },
  DANGER: { name: 'Perigo', identity: 'O terreno esconde armadilhas que só se percebem tarde.', effect: 'Metade das expedições perde a peça que explorava; o Método Experimental evita o pior.', marker: false },
  CAMP: { name: 'Acampamento de Saqueadores', identity: 'Fogueiras e tendas: alguém já ocupou esta região.', effect: 'Surge um acampamento de saqueadores na região.', marker: true },
  NONE: { name: 'Terra comum', identity: 'Nada de extraordinário: boa terra para quem chegar.', effect: 'Sem efeito.', marker: false },
};
export const DISCOVERY_NAMES: Record<DiscoveryKind, string> = { RUIN: 'Vestígio', DEPOSIT: 'Jazida', PASSAGE: 'Passagem', ANCHORAGE: 'Ancoradouro', DANGER: 'Perigo', CAMP: 'Acampamento de Saqueadores', NONE: 'Terra comum' };

/** Encounter cards: a scroll with two choices. Delivered as a PendingChoice of source ENCOUNTER (I-25). */
export interface EncounterCard { id: string; title: string; text: string; options: [ChoiceOption, ChoiceOption] }
const gain = (resource: 'food' | 'wood' | 'stone' | 'metal' | 'wealth' | 'knowledge' | 'influence' | 'culture', n: number) => ({ op: 'GAIN' as const, resource, n });
export const ENCOUNTER_CARDS: readonly EncounterCard[] = [
  { id: 'enc-ruin-archive', title: 'Arquivo soterrado', text: 'Entre as pedras há tabuletas legíveis e uma galeria de estátuas.', options: [{ id: 'read', label: 'Copiar as tabuletas: +2 Conhecimento', ops: [gain('knowledge', 2)] }, { id: 'honour', label: 'Honrar as estátuas: +2 Cultura', ops: [gain('culture', 2)] }] },
  { id: 'enc-ruin-shrine', title: 'Santuário esquecido', text: 'Um santuário de caminhantes guarda oferendas antigas.', options: [{ id: 'offer', label: 'Levar as oferendas: +2 Riqueza', ops: [gain('wealth', 2)] }, { id: 'rite', label: 'Cumprir o rito: +1 Cultura e +1 Influência', ops: [gain('culture', 1), gain('influence', 1)] }] },
  { id: 'enc-ruin-map', title: 'Mapa nas paredes', text: 'Uma parede inteira mostra rotas que ninguém lembrava.', options: [{ id: 'chart', label: 'Copiar o mapa: +1 Conhecimento e +1 Madeira', ops: [gain('knowledge', 1), gain('wood', 1)] }, { id: 'trade', label: 'Vender a cópia: +2 Riqueza', ops: [gain('wealth', 2)] }] },
  { id: 'enc-camp-spoils', title: 'Despojos do acampamento de saqueadores', text: 'O acampamento de saqueadores caído deixou provisões e um prisioneiro que fala.', options: [{ id: 'loot', label: 'Dividir os despojos: +2 Alimento e +1 Metal', ops: [gain('food', 2), gain('metal', 1)] }, { id: 'ransom', label: 'Negociar o prisioneiro: +2 Influência', ops: [gain('influence', 2)] }] },
];
export const encounterCard = (id: string): EncounterCard | undefined => ENCOUNTER_CARDS.find(card => card.id === id);

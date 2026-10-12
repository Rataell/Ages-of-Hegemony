import { emptyAlphaResourcePool, type AlphaResourcePool } from './alpha-concept.js';
import type { AlphaBuildingSchema, AlphaDistrictSchema } from './alpha-concept.js';
import type { z } from 'zod';

/**
 * The building catalog of the Alpha (V1.2 B0). One table answers, for each of the 29 ids of `AlphaBuildingSchema`: which district family it belongs to, what it
 * costs, which Web advance opens it, what it does and whether the engine really does it. Only an `OFFERED` building can be built: nothing is sold whose effect is
 * not implemented. The reconciliation of the four sources that disagreed (V5.1a canon, `DISTRICT_CATALOG`, the core `territory.buildings`, `storagePerBuilding`)
 * is documented in docs/audit/alpha-v1.2-building-reconciliation.md, with the value chosen for every divergence.
 *
 * How a building is built (`path`):
 *  - CORE      the five buildings the economic core already built AND whose effect the Alpha really applies (cost and district come from `GameRulesConfig.territory`, unchanged);
 *  - CATALOG   the buildings built from this table (the eight whose effect already existed in the engine, plus the six of RC5: Moinho, Observatório, Tribunal, Arsenal, Estaleiro, Farol): cost, requirement and effect come from here and from the engine readers named in the effect text;
 *  - DISTRICT  the Porto, included in the Distrito Marítimo (there is no separate purchase);
 *  - PENDING   canon names them but gives no effect (or the engine has no reader): not offered until the effect is approved and implemented. Quartel and Centro cultural were buildable before V1.2 but have no effect in the Alpha, so they join this group (the ones already built stay valid);
 *  - UNDEFINED the canon does not define them: not offered; ids stay in the schema so saves that mention them keep loading;
 *  - IMPROVEMENT Irrigação is a hex improvement in the canon, not an urban building.
 */
export type BuildingPath = 'CORE' | 'CATALOG' | 'DISTRICT' | 'PENDING' | 'UNDEFINED' | 'IMPROVEMENT';
export type BuildingId = z.infer<typeof AlphaBuildingSchema>;
export type BuildingDistrict = z.infer<typeof AlphaDistrictSchema>;
export interface BuildingSpec {
  id: BuildingId;
  name: string;
  /** The district family that holds it (DISTRICT_CATALOG). For CORE buildings the economic core keeps its own district (see the reconciliation for Arquivo). */
  district: BuildingDistrict;
  path: BuildingPath;
  /** CATALOG buildings only: what the build costs. CORE buildings are priced by the core config. */
  cost: AlphaResourcePool | null;
  /** What the building does, as shown to the player. Must be true: `implemented` is checked by tests against the engine readers. */
  effect: string;
  implemented: boolean;
}
const cost = (part: Partial<AlphaResourcePool>): AlphaResourcePool => ({ ...emptyAlphaResourcePool(), ...part });
const spec = (id: BuildingId, name: string, district: BuildingDistrict, path: BuildingPath, price: AlphaResourcePool | null, effect: string, implemented: boolean): BuildingSpec => ({ id, name, district, path, cost: price, effect, implemented });

export const ALPHA_BUILDING_CATALOG: readonly BuildingSpec[] = [
  // Agrário
  spec('GRANARY', 'Celeiro', 'AGRARIAN', 'CORE', null, 'Crescer custa 2 Alimento na cidade; limite de Alimento +5.', true),
  spec('MILL', 'Moinho', 'AGRARIAN', 'CATALOG', cost({ wood: 2, stone: 1 }), 'Ao Produzir: +1 Alimento por Fazenda efetivamente trabalhada nesta ativação, no máximo +2.', true),
  spec('IRRIGATION', 'Irrigação', 'AGRARIAN', 'IMPROVEMENT', null, 'Melhoria de hex (Fazenda +1 Alimento), não edifício urbano.', false),
  // Comercial
  spec('MARKET', 'Mercado', 'COMMERCIAL', 'CORE', null, 'Libera o 3º par de Mercadores (+1 Riqueza por par).', true),
  spec('TREASURY', 'Tesouro', 'COMMERCIAL', 'CATALOG', cost({ stone: 2, wealth: 3 }), 'Limite de Riqueza +5 (um por civilização conta).', true),
  spec('BANK', 'Banco', 'COMMERCIAL', 'CATALOG', cost({ stone: 3, wealth: 3, knowledge: 1 }), 'Limite de Riqueza +5 (um por civilização conta).', true),
  // Acadêmico
  spec('SCRIBES_HOUSE', 'Casa dos Escribas', 'ACADEMIC', 'UNDEFINED', null, 'Sem definição no canon.', false),
  spec('LIBRARY', 'Biblioteca', 'ACADEMIC', 'CORE', null, 'Libera o 3º par de Eruditos (+1 Conhecimento por par).', true),
  spec('ACADEMY', 'Academia', 'ACADEMIC', 'CATALOG', cost({ stone: 3, knowledge: 2 }), 'Limite de Conhecimento +5 (um por civilização conta).', true),
  spec('OBSERVATORY', 'Observatório', 'ACADEMIC', 'CATALOG', cost({ stone: 3, knowledge: 3 }), 'Dicas de exploração (as da sua Teia) de Regiões fechadas a até 6 hexes desta cidade. Não revela nada nem substitui o Pioneiro.', true),
  spec('LABORATORY', 'Laboratório', 'ACADEMIC', 'UNDEFINED', null, 'No canon é um avanço da Teia, não um edifício.', false),
  spec('ARCHIVE', 'Arquivo', 'ACADEMIC', 'CORE', null, 'Limite de Conhecimento +5 (um por civilização conta).', true),
  // Administrativo
  spec('COURT', 'Tribunal', 'ADMINISTRATIVE', 'CATALOG', cost({ stone: 3, wealth: 1, influence: 2 }), 'A segunda ativação da cidade não custa Ânimo (uma vez por rodada em toda a civilização). Governar continua pago.', true),
  spec('CHANCELLERY', 'Chancelaria', 'ADMINISTRATIVE', 'CATALOG', cost({ stone: 2, wealth: 2, influence: 2 }), 'Capacidade Administrativa +1 (uma por civilização) e limite de Influência +5.', true),
  spec('CIVIC_SQUARE', 'Praça Cívica', 'ADMINISTRATIVE', 'UNDEFINED', null, 'Sem definição no canon.', false),
  // Militar
  spec('BARRACKS', 'Quartel', 'MILITARY', 'PENDING', null, 'Sem efeito no Alpha: o núcleo só calculava capacidade de guarnição, que a pilha de cidade não lê. Canon: só custo.', false),
  spec('ARSENAL', 'Arsenal', 'MILITARY', 'CATALOG', cost({ stone: 2, metal: 3 }), 'Cavalaria e Engenho de Cerco recrutados na cidade custam 1 Metal a menos. Não dispensa Era, distrito Militar nem avanços.', true),
  spec('TRAINING_GROUND', 'Campo de Treino', 'MILITARY', 'UNDEFINED', null, 'Sem definição no canon.', false),
  // Industrial
  spec('WORKSHOP', 'Oficina', 'INDUSTRIAL', 'CORE', null, 'Libera o 3º par de Artesãos (+1 Madeira por par).', true),
  spec('FOUNDRY', 'Fundição', 'INDUSTRIAL', 'CATALOG', cost({ stone: 3, metal: 2 }), 'Limite de Metal +5 (um por civilização conta).', true),
  spec('WAREHOUSE', 'Armazém', 'INDUSTRIAL', 'CATALOG', cost({ wood: 3, stone: 1 }), 'Limite de Madeira e de Pedra +5 (um por civilização conta).', true),
  // Cultural
  spec('TEMPLE', 'Templo', 'CULTURAL', 'CATALOG', cost({ stone: 2, culture: 1 }), '+1 Cultura por Produzir na cidade; com Teocracia, recupera 1 de Ânimo por rodada.', true),
  spec('THEATER', 'Teatro', 'CULTURAL', 'CATALOG', cost({ stone: 3, culture: 2 }), 'Limite de Cultura +5 (um por civilização conta).', true),
  spec('CULTURAL_CENTER', 'Centro cultural', 'CULTURAL', 'PENDING', null, 'Sem efeito no Alpha (o +1 Influência do núcleo não é creditado) e fora do canon V5.1a.', false),
  spec('SANCTUARY', 'Santuário', 'CULTURAL', 'UNDEFINED', null, 'Sem definição no canon.', false),
  spec('TRADITION_HOUSE', 'Casa da Tradição', 'CULTURAL', 'UNDEFINED', null, 'Sem definição no canon.', false),
  // Marítimo
  spec('PORT', 'Porto', 'MARITIME', 'DISTRICT', null, 'Incluído no Distrito Marítimo: liga a cidade à água e lança navios.', true),
  spec('SHIPYARD', 'Estaleiro', 'MARITIME', 'CATALOG', cost({ wood: 4, metal: 2 }), 'Frota e Barca de Patrulha recrutadas aqui custam 1 Riqueza a menos; até 2 navios ancorados na cidade não pagam manutenção de Riqueza.', true),
  spec('LIGHTHOUSE', 'Farol', 'MARITIME', 'CATALOG', cost({ stone: 3, wood: 1, wealth: 1 }), 'A pilhagem pirata neste porto rouba 1 Riqueza (em vez de 2) e o bloqueio exige 2 navios armados do mesmo inimigo. Não revela Regiões.', true),
];
export const buildingSpec = (id: BuildingId): BuildingSpec => ALPHA_BUILDING_CATALOG.find(entry => entry.id === id)!;
export const BUILDING_NAMES_PT: Readonly<Record<BuildingId, string>> = Object.fromEntries(ALPHA_BUILDING_CATALOG.map(entry => [entry.id, entry.name])) as Record<BuildingId, string>;
/** Buildings a player can actually ask for with Construir: the five core buildings with a real effect and the eight catalog buildings. */
export const OFFERED_BUILDINGS: readonly BuildingId[] = ALPHA_BUILDING_CATALOG.filter(entry => (entry.path === 'CORE' || entry.path === 'CATALOG') && entry.implemented).map(entry => entry.id);
export const isCatalogBuilding = (id: BuildingId): boolean => buildingSpec(id).path === 'CATALOG';

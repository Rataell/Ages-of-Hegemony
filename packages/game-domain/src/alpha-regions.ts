import type { TerrainType } from './core.js';
/** Terrain features a region template places (METAL is the deposit, handled apart). */
export type TemplateFeature = 'FISH' | 'TIMBER' | 'FERTILE' | 'STONE';
const FEATURE_TERRAINS: Record<TemplateFeature, readonly TerrainType[]> = { FISH: ['COAST', 'SEA'], TIMBER: ['FOREST'], FERTILE: ['PLAINS', 'FOREST', 'HILLS'], STONE: ['HILLS', 'MOUNTAINS'] };
export const featureFits = (feature: TemplateFeature, terrain: TerrainType) => FEATURE_TERRAINS[feature].includes(terrain);
export interface RegionTemplate { id:string;name:string;kind:'HOMELAND'|'FRONTIER';terrain:readonly TerrainType[] }
// Positions: center, E, NE, NW, W, SW, SE. Every template is authored content.
const patterns:readonly (readonly TerrainType[])[]=[
  ['PLAINS','PLAINS','FOREST','HILLS','PLAINS','COAST','COAST'],
  ['PLAINS','HILLS','MOUNTAINS','HILLS','FOREST','PLAINS','PLAINS'],
  ['PLAINS','FOREST','FOREST','HILLS','PLAINS','FOREST','PLAINS'],
  ['PLAINS','COAST','SEA','COAST','FOREST','PLAINS','HILLS'],
  ['PLAINS','HILLS','PLAINS','FOREST','HILLS','MOUNTAINS','PLAINS'],
  ['PLAINS','PLAINS','COAST','SEA','COAST','PLAINS','FOREST'],
];
const homeNames=['Bacia de Alvor','Altos da Vigia','Estuário das Garças','Costa de Tal','Vale dos Cedros','Terraços do Cobre'];
const frontierNames=['Várzeas de Vidro','Espinha do Norte','Bosque Silente','Enseada das Agulhas','Escarpa de Cobre','Delta dos Ventos',
  'Campos da Aurora','Pedras da Vigília','Mata das Fontes','Baía do Retorno','Colinas de Âmbar','Praias da Bruma',
  'Planície das Linhas','Maciço do Eco','Floresta das Pontes','Costa das Marés','Serras da Travessia','Ilhas do Horizonte',
  'Campinas do Arco','Altiplano da Cinza','Bosque das Veredas','Porto das Conchas','Cordilheira do Sol','Litoral das Dunas',
  // Thirteen more frontier Regions for the Amplo footprint (43 Regions = 6 Pátrias + 37 frontier).
  'Campos do Meio','Garganta Rubra','Mata do Cedro','Angra das Gaivotas','Cordão de Pedra','Estreito das Aves','Clareiras Longas',
  'Terraços do Vento','Ilhotas do Norte','Planalto de Ouro','Encosta da Neblina','Foz das Salinas','Mirante do Delta'];
const frontierPatterns=['PPPFHHF','PHMMHFP','PFFFHHP','PCCSCPF','PHHMFPP','PPCSSCP',
  'PPPPFHC','PMHMHFP','PFFPFHF','PCSSCCP','PHFHMHP','PCPCCSP',
  'PPHPPFF','PHMMMPF','PFFFFPH','PCSCCFP','PHMFMHP','PSSCCCP',
  'PPFPFHH','PMMHHFP','PFPFFHH','PCCCSSP','PHMMFHP','PPCSCCP',
  'PPFHPPC','PHMHHPF','PFHFFPP','PCCSPCP','PMMHPFH','PPCCPSC','PFPPHFF',
  'PHPHPHM','PSCSCPP','PPHHFFC','PFFHMPP','PCPPFHC','PHFPPCS'];
const terrainCode:Record<string,TerrainType>={P:'PLAINS',F:'FOREST',H:'HILLS',M:'MOUNTAINS',C:'COAST',S:'SEA'};
export const REGION_TEMPLATES:readonly RegionTemplate[]=[
  ...homeNames.map((name,i)=>({id:`homeland-${i+1}`,name,kind:'HOMELAND' as const,terrain:patterns[i]!})),
  ...frontierNames.map((name,i)=>({id:`frontier-${i+1}`,name,kind:'FRONTIER' as const,terrain:[...frontierPatterns[i]!].map(c=>terrainCode[c]!)})),
];

/**
 * Every region holds at most one metal deposit: its first mountain, otherwise its first hill. Regions with neither
 * (for example the sixth homeland) have none, so those players must find metal elsewhere.
 */
export function templateMetalDeposit(template: RegionTemplate): number | null {
  const mountain = template.terrain.indexOf('MOUNTAINS');
  if (mountain >= 0) return mountain;
  const hill = template.terrain.indexOf('HILLS');
  return hill >= 0 ? hill : null;
}

/**
 * Authored resources of a region, at most one of each: fish on its first coast, timber in its first forest, fertile soil on its
 * first plain outside the centre, stone on its first hill or mountain that does not hold the metal deposit. This is what makes
 * fisheries, farms on fertile soil, lumber camps and quarries meaningful choices instead of empty catalogue entries.
 */
export function templateFeatures(template: RegionTemplate): (TemplateFeature | null)[] {
  const deposit = templateMetalDeposit(template), out: (TemplateFeature | null)[] = template.terrain.map(() => null);
  const first = (test: (terrain: TerrainType, index: number) => boolean) => template.terrain.findIndex((terrain, index) => out[index] === null && test(terrain, index));
  const place = (feature: TemplateFeature, index: number) => { if (index >= 0) out[index] = feature; };
  place('FISH', first(terrain => terrain === 'COAST'));
  place('TIMBER', first(terrain => terrain === 'FOREST'));
  place('FERTILE', first((terrain, index) => terrain === 'PLAINS' && index > 0));
  place('STONE', first((terrain, index) => (terrain === 'HILLS' || terrain === 'MOUNTAINS') && index !== deposit));
  return out;
}

/** The authored position that lands on region position `index` under `rotation` sixth-turns (the center never moves). */
export function rotatedTemplateIndex(index: number, rotation: number): number {
  return index === 0 ? 0 : 1 + (index - 1 + rotation) % 6;
}

/** The template at each region position under a rotation. Terrain and the metal deposit move together, by the same index. */
export function rotatedRegionContent(template: RegionTemplate, rotation: number): { terrain: TerrainType; deposit: boolean; feature: TemplateFeature | null }[] {
  const deposit = templateMetalDeposit(template), features = templateFeatures(template);
  return template.terrain.map((_, index) => {
    const source = rotatedTemplateIndex(index, rotation);
    return { terrain: template.terrain[source]!, deposit: source === deposit, feature: features[source] ?? null };
  });
}

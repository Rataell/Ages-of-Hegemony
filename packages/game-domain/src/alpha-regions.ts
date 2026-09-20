import type { TerrainType } from './core.js';
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
const homeNames=['Bacia de Alvor','Altos de Vard','Estuário de Méria','Costa de Tal','Vale de Saren','Terraços de Kor'];
const frontierNames=['Várzeas de Vidro','Espinha do Norte','Bosque Silente','Enseada das Agulhas','Escarpa de Cobre','Delta dos Ventos',
  'Campos da Aurora','Pedras da Vigília','Mata das Fontes','Baía do Retorno','Colinas de Âmbar','Praias da Bruma',
  'Planície das Linhas','Maciço do Eco','Floresta das Pontes','Costa das Marés','Serras da Travessia','Ilhas do Horizonte',
  'Campinas do Arco','Altiplano da Cinza','Bosque das Veredas','Porto das Conchas','Cordilheira do Sol','Litoral das Dunas'];
const frontierPatterns=['PPPFHHF','PHMMHFP','PFFFHHP','PCCSCPF','PHHMFPP','PPCSSCP',
  'PPPPFHC','PMHMHFP','PFFPFHF','PCSSCCP','PHFHMHP','PCPCCSP',
  'PPHPPFF','PHMMMPF','PFFFFPH','PCSCCFP','PHMFMHP','PSSCCCP',
  'PPFPFHH','PMMHHFP','PFPFFHH','PCCCSSP','PHMMFHP','PPCSCCP'];
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

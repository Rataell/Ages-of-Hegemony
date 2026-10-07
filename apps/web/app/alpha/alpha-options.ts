import { MAP_FOOTPRINT, MAP_SIZE_NAMES, mapSizeAllows, recommendedMapSize, type MapSize } from '@aoh/game-domain';

/** Options offered when creating a match. Values must be exactly what the domain schemas accept; a test compares them. */
/** World presets: value, name, one-line description. Misto first: it is the default of a new table. */
export const WORLD_OPTIONS: readonly (readonly [string, string, string])[] = [
  ['MIXED', 'Misto', 'Massas de terra, costas e baías.'],
  ['CONTINENTAL', 'Continental', 'Grande massa de terra cercada por oceano.'],
  ['ARCHIPELAGO', 'Arquipélago', 'Ilhas separadas por estreitos: a navegação decide.'],
  ['INLAND_SEA', 'Mar Interior', 'Um mar central cercado por terras.'],
];
export const PLANNING_OPTIONS: readonly (readonly [number, string])[] = [[0, 'Sem prazo'], [180, '3 minutos'], [300, '5 minutos'], [480, '8 minutos'], [3600, '1 hora'], [14400, '4 horas'], [28800, '8 horas']];
/** Match length: value, name, rhythm. */
export const PRESET_OPTIONS: readonly (readonly [string, string, string])[] = [['QUICK', 'Rápida', '7 Eras × 3 rodadas'], ['STANDARD', 'Padrão', '7 Eras × 5 rodadas'], ['EPIC', 'Épica', '7 Eras × 7 rodadas']];
export const ORDER_OPTIONS: readonly number[] = [3, 4, 5, 6];
export const MAP_SIZES: readonly MapSize[] = ['COMPACT', 'STANDARD', 'WIDE'];

/** One map size as the lobby shows it: name, Regions, whether it is recommended for the table and, when it does not fit, why. */
export function mapSizeChoice(size: MapSize, seatLimit: number) {
  const footprint = MAP_FOOTPRINT[size], allowed = mapSizeAllows(size, seatLimit);
  return {
    size, name: MAP_SIZE_NAMES[size], regions: footprint.regions, allowed, recommended: recommendedMapSize(seatLimit) === size,
    reason: allowed ? null : `Comporta ${footprint.minPlayers} a ${footprint.maxPlayers} jogadores`,
  };
}
export const worldName = (value: string) => WORLD_OPTIONS.find(([v]) => v === value)?.[1] ?? value;
export const presetName = (value: string) => PRESET_OPTIONS.find(([v]) => v === value)?.[1] ?? value;
export const planningName = (value: number) => PLANNING_OPTIONS.find(([v]) => v === value)?.[1] ?? `${value} s`;

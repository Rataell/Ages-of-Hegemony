/** Options offered when creating a match. Values must be exactly what the domain schemas accept; a test compares them. */
export const WORLD_OPTIONS: readonly (readonly [string, string])[] = [['CONTINENTAL', 'Continental'], ['ARCHIPELAGO', 'Arquipélago'], ['INLAND_SEA', 'Mar Interior'], ['MIXED', 'Misto']];
export const PLANNING_OPTIONS: readonly (readonly [number, string])[] = [[0, 'Sem prazo'], [180, '3 minutos'], [300, '5 minutos'], [480, '8 minutos'], [3600, '1 hora'], [14400, '4 horas'], [28800, '8 horas']];

import { z } from 'zod';
import { NonNegativeIntegerSchema as N, ResourcePoolSchema, TerrainTypeSchema, emptyResourcePool } from './core.js';
import { AlphaEraSchema } from './alpha-concept.js';

export const AlphaUnitClassSchema = z.enum(['INFANTRY', 'GUARD', 'RANGED', 'CAVALRY', 'SIEGE', 'FLEET', 'EXPLORER', 'PIONEER', 'ENVOY', 'COASTAL_VESSEL']);
export const UnitCatalogEntrySchema = z.strictObject({
  name: z.string(), cost: ResourcePoolSchema, metal: N.default(0), upkeep: ResourcePoolSchema, movement: N.min(1), strength: N,
  domain: z.enum(['LAND', 'SEA']), terrainModifiers: z.record(TerrainTypeSchema, z.number().int().min(-10).max(10)), cityModifier: N,
  /** Which side of a city battle the city modifier serves. Older snapshots omit it; see `cityModifierSide`. */
  cityModifierSide: z.enum(['ATTACK', 'DEFENSE']).optional(),
  era: AlphaEraSchema, militaryInfrastructure: z.boolean(), role: z.string().min(1).max(160),
  /** Fleets: cargo slots offered to land pieces (DEC-014 vertical slice). Land pieces: slots they take when carried. */
  transport: N.default(0), cargo: N.min(1).default(1),
});
export type UnitCatalogEntry = z.infer<typeof UnitCatalogEntrySchema>;
const pool = (values: Partial<ReturnType<typeof emptyResourcePool>>) => ({ ...emptyResourcePool(), ...values });
const terrain = { UNKNOWN: 0, PLAINS: 0, FOREST: 0, HILLS: 0, MOUNTAINS: 0, COAST: 0, SEA: 0 };

/** Guards defend cities (their role); every other class's city modifier is equipment for attacking one. */
export function cityModifierSide(kind: z.infer<typeof AlphaUnitClassSchema>, entry: UnitCatalogEntry): 'ATTACK' | 'DEFENSE' {
  return entry.cityModifierSide ?? (kind === 'GUARD' ? 'DEFENSE' : 'ATTACK');
}

export function alphaUnitCatalog(): Record<z.infer<typeof AlphaUnitClassSchema>, UnitCatalogEntry> {
  const make = (name: string, cost: ReturnType<typeof pool>, movement: number, strength: number, role: string): UnitCatalogEntry => ({
    name, cost, metal: 0, movement, strength, role, upkeep: pool({ food: 1 }), domain: 'LAND', terrainModifiers: { ...terrain },
    cityModifier: 0, era: 'FOUNDATION', militaryInfrastructure: false, transport: 0, cargo: 1,
  });
  return {
    INFANTRY: make('Infantaria', pool({ food: 1, materials: 2 }), 2, 2, 'Linha: cada Guarda do dado cancela Impacto inimigo.'),
    GUARD: { ...make('Guarda', pool({ food: 1, materials: 3 }), 2, 2, 'Muro: defende a cidade e as fortificações.'), cityModifierSide: 'DEFENSE', militaryInfrastructure: true },
    RANGED: { ...make('Arqueiros', pool({ food: 1, materials: 2 }), 2, 2, 'Salva: um Comando do dado vira Poder.'), era: 'EXPANSION', militaryInfrastructure: true },
    CAVALRY: { ...make('Cavalaria', pool({ food: 2, materials: 2, wealth: 1 }), 2, 3, 'Flanco: Comando vale Poder na planície. Move 2 (3 no Grau II).'), metal: 1, era: 'EXPANSION', militaryInfrastructure: true, cargo: 2 },
    SIEGE: { ...make('Engenho de cerco', pool({ materials: 4, wealth: 1 }), 1, 1, 'Brecha: +2 contra cidade fortificada e abre Integridade.'), metal: 2, era: 'CIVILIZATION', militaryInfrastructure: true, cargo: 2 },
    FLEET: { ...make('Frota', pool({ materials: 3, wealth: 2 }), 3, 3, 'Abordagem: bloqueia o porto inimigo. Carrega 2 peças (3 no Grau II).'), metal: 1, domain: 'SEA', era: 'EXPANSION', transport: 2 },
    EXPLORER: { ...make('Explorador', pool({ food: 1, wealth: 1 }), 3, 0, 'Exploração terrestre.'), upkeep: pool({}) },
    PIONEER: make('Pioneiro', pool({ food: 3, materials: 2 }), 2, 0, 'Fundação de cidades.'),
    ENVOY: { ...make('Enviado', pool({ wealth: 2, influence: 1 }), 3, 0, 'Diplomacia e presença cultural.'), upkeep: pool({ wealth: 1 }) },
    /** First naval class (naval audit): Era I, explores and crosses the coast, carries one piece, never fights. */
    COASTAL_VESSEL: { ...make('Embarcação Costeira', pool({ materials: 2, wealth: 1 }), 3, 0, 'Explora a costa e leva uma peça. Não combate.'), upkeep: pool({ wealth: 1 }), domain: 'SEA', transport: 1 },
  };
}

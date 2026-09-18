// Hand-authored cartography. Rows are literal fixtures, never procedural terrain.
const rows = [
  'MMHHFFPPPPCCSS', 'MHHFFPPPPFCCSS', 'HHFFPPPPFFPCSS',
  'HFFPPPPPHHPCSS', 'FPPPPFFPHHPCSS', 'PPPPFFFPPPCCSS',
  'PPPHHHFPPPFCCS', 'FPPHHPPPPPFFCC', 'FFPPPPFFPPPHHC',
  'HFFPPPPFFPPHHC', 'HHFPPPPPPPPFCC', 'MHHFFPPPPFFCCS',
];
const terrain = { M: 'MOUNTAINS', H: 'HILLS', F: 'FOREST', P: 'PLAINS', C: 'COAST', S: 'SEA' } as const;
const capitals = [[2, 2], [8, 2], [2, 7], [8, 7], [5, 4], [5, 10]] as const;
const names = ['Aurélia', 'Valgard', 'Merídia', 'Thalos', 'Saren', 'Kor'];
export function localScenario(gameId: string, count: number) {
  const height = count === 2 ? 6 : count <= 4 ? 9 : 12;
  const map = rows.slice(0, height).flatMap((row, r) => [...row].map((symbol, q) => ({
    id: `${q},${r}`, q, r, terrain: terrain[symbol as keyof typeof terrain],
    features: q === 3 && r < 6 ? ['RIVER'] : [],
  })));
  // Explicit river strip has suitable land at every coordinate.
  for (const tile of map) if (tile.features.length) tile.terrain = 'PLAINS';
  const features: Record<string, string[]> = { '4,0': ['TIMBER'], '2,0': ['STONE'], '1,1': ['METAL'], '6,1': ['FERTILE'], '10,0': ['FISH'] };
  for (const tile of map) if (features[tile.id]) tile.features = features[tile.id]!;
  return { gameId, seed: 42, map,
    players: names.slice(0, count).map((name, i) => ({ id: `player-${i + 1}`, name,
      resources: { food: 30, materials: 50, wealth: 20, knowledge: 0, influence: 20 } })),
    initialCities: capitals.slice(0, count).map(([q, r], i) => ({ id: `capital-${i + 1}`, ownerId: `player-${i + 1}`, hexId: `${q},${r}`, name: names[i],
      workers: { producers: 2, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned: 0 } })),
  };
}

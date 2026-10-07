# World generator audit (concept, 2026-10)

Read-only measurements of the real generator (`packages/*/dist`). **Nothing in the engine was changed.** Run from the repo root after `npm run build`:

- `node docs/evidence/world-generator-audit-2026-10/audit1.mjs` – presets × 2/4/6 players × 40 seeds: sea hexes/components, "fake coasts", land components, land-entry validity per approach hex.
- `audit4.mjs` – metal deposits per map and per Pátria.
- `hist.mjs` – distribution of valid orientations (0–6) per approach.
- `audit2.mjs` – Pátria distances for alternative footprint sizes (N regions). Each N loads `alpha-topology.js` with a cache-busting query because `chooseHomelands` caches by player count only.
- `footprints-*.json` – raw output of `audit2` for N = 14–54.

Land entry used: an approach hex adjacent to a region hex whose rotated terrain (`rotatedRegionTiles`) is PLAINS, FOREST, HILLS, MOUNTAINS or COAST.

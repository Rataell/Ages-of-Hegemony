import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { AlphaBuildingSchema, CIVILIZATIONS, CIVILIZATION_KITS, HERITAGE_ADVANCES, alphaRules, type AlphaResourcePool } from '@aoh/game-domain';
import { alphaStorageCapacity, cityYield, productionOutput, urbanOptions } from '@aoh/game-engine';
import { apply, coreCity, freshGame, meta, plan, seat, shape, urban, P1 } from './v12-audit-urban-helpers.js';

/**
 * Alpha V1.2 · lane A2+D · AUDIT of the SOURCES of Conhecimento, Influência and Cultura and of how population becomes roles.
 * Same conventions as tests/v12-audit-urban-planning.test.ts (`it.fails` + REPRO = defect today; plain `it` = GUARD / CHARACTERIZATION).
 * IDs (S-nn) match docs/audit/alpha-v1.2-lane-a2d-sources-cities-urban.md.
 */
const repo = (...parts: string[]) => join(fileURLToPath(new URL('..', import.meta.url)), ...parts);
const safeList = (dir: string): string[] => { try { return readdirSync(dir); } catch { return []; } };
const knowledgeOf = (state: ReturnType<typeof freshGame>) => cityYield(state, meta(state).cityId).output.knowledge;

describe('S-01 · Influência is NOT unproduced: Ação Cívica is its on-demand source (1 per Ordem Cidade)', () => {
  it('GUARD S-01: CIVIC_ACTION in an own city credits +1 Influência and uses a city activation (alpha-urban.ts:364, balance.civicInfluence)', () => {
    const state = freshGame();
    const control = plan(state, []);
    const civic = plan(state, [urban(meta(state).cityId, 'CIVIC_ACTION')]);
    const influence = (o: { after: ReturnType<typeof freshGame> }) => o.after.roundReports.find(r => r.playerId === P1 && r.round === 1)!.other.influence;
    expect(influence(civic) - influence(control)).toBe(alphaRules().balance.civicInfluence);
    expect(alphaRules().balance.civicInfluence).toBe(1);
  });
  it('CHARACTERIZATION S-01 (BALANCE): the passive +1/round exists for only 2 of the 10 playable civilizations (saren, solenne)', () => {
    const playable = new Set(CIVILIZATION_KITS.filter(kit => kit.availability === 'PLAYABLE').map(kit => kit.id));
    const withPassive = (resource: string) => CIVILIZATIONS.filter(civ => playable.has(civ.id) && civ.passives.some(effect => effect.kind === 'PRODUCTION' && effect.resource === resource)).map(civ => civ.id).sort();
    // The kit roster lists 12 Alpha civilizations; veyra and elyra are not selectable (alpha-kits.ts header).
    const selectable = (ids: string[]) => ids.filter(id => !['veyra', 'elyra'].includes(id));
    expect(selectable(withPassive('influence'))).toEqual(['saren', 'solenne']);
    expect(selectable(withPassive('knowledge'))).toEqual(['dravik', 'meridia', 'orinth', 'solenne', 'thalos']);
  });
});

describe('S-02 · Conhecimento from Eruditos: 1 per PAIR, two pairs without Biblioteca', () => {
  const withScholars = (scholars: number, library = false) => {
    const state = freshGame();
    shape(state, 'METROPOLIS', 14, { producers: 14 - scholars, scholars });
    if (library) meta(state).buildings.push('LIBRARY');
    return state;
  };
  it('GUARD S-02: yields 0 / 0 / 1 / 2 / 2 / 3 for 1 / 2... Eruditos exactly as alpha-city.ts pairs() reads', () => {
    expect([1, 2, 4, 6, 8].map(n => knowledgeOf(withScholars(n)))).toEqual([0, 1, 2, 2, 2]);
    expect(knowledgeOf(withScholars(6, true))).toBe(3);
    expect(knowledgeOf(withScholars(1, false))).toBe(0);   // an odd Erudito yields nothing: the bots' floor() allocation wastes it
  });
  it('CHARACTERIZATION S-02 (BALANCE): the whole Web costs 261 Conhecimento (50 rows) and the path to N7 alone 72; one Produzir with 4 Eruditos yields 2', async () => {
    const { ADVANCEMENTS } = await import('@aoh/game-domain');
    const seen = new Set<string>();
    let sum = 0;
    for (const node of ADVANCEMENTS) { if (node.pair) { if (seen.has(node.pair)) continue; seen.add(node.pair); } sum += node.cost.knowledge; }
    expect(sum).toBe(261);
    expect(knowledgeOf(withScholars(4))).toBe(2);
  });
});

describe('S-03 · population enters the city as Disponível and produces nothing until the player redistributes', () => {
  it('GUARD S-03: the capital starts with 1 Produtor + 1 Erudito; Crescer adds an UNASSIGNED inhabitant (alpha-phases.ts:258); redistribution is once per city per round', () => {
    const state = freshGame();
    expect(coreCity(state).workers).toMatchObject({ producers: 1, scholars: 1, unassigned: 0 });
    shape(state, 'OUTPOST', 3, { producers: 2, scholars: 1 }); Object.assign(seat(state).resources, { food: 15 });
    const outcome = plan(state, [urban(meta(state).cityId, 'PRODUCE')]);
    const grown = coreCity(outcome.after);
    expect(grown.population).toBe(4);
    expect(grown.workers.unassigned).toBe(1);
    // …and the yield of that round never counts the newcomer
    expect(productionOutput(outcome.after, P1, meta(outcome.after).cityId).output.food).toBeGreaterThanOrEqual(0);
    const first = apply(freshGame(), { type: 'MANAGE', command: { type: 'ASSIGN_POPULATION', playerId: P1, cityId: meta(freshGame()).cityId, workers: { producers: 2, artisans: 0, merchants: 0, scholars: 0, soldiers: 0, unassigned: 0 }, expectedVersion: freshGame().core.version } });
    expect(first.ok).toBe(true);
    if (first.ok) {
      const again = apply(first.value, { type: 'MANAGE', command: { type: 'ASSIGN_POPULATION', playerId: P1, cityId: meta(first.value).cityId, workers: { producers: 1, artisans: 0, merchants: 0, scholars: 1, soldiers: 0, unassigned: 0 }, expectedVersion: first.value.core.version } });
      expect(again).toMatchObject({ ok: false });
    }
  });
});

describe('S-04 · Heranças cost Conhecimento (+ a thematic resource) and change nothing yet', () => {
  it('CHARACTERIZATION S-04 (LEGACY): all 54 heritage rows are PLANNED (effect is text only) and researching one leaves the yield untouched', () => {
    expect(HERITAGE_ADVANCES).toHaveLength(54);
    expect([...new Set(HERITAGE_ADVANCES.map(h => h.status))]).toEqual(['PLANNED']);
    const state = freshGame();
    const before = JSON.stringify(cityYield(state, meta(state).cityId).output);
    seat(state).research.push('web-exchange', 'her-meridia-1');
    expect(JSON.stringify(cityYield(state, meta(state).cityId).output)).toBe(before);
  });
});

describe('S-05 · Web unlocks that PROMISE Conhecimento / Influência / Cultura but have no reader in the engine', () => {
  // Every other "rule:" tag was checked by hand in the report; these are the ones that would be a source or a sink of the three resources.
  const PROMISES = [
    'rule:scholar-influence-once-per-era',   // Academias Cívicas: "Eruditos rendem Influência 1× por Era"
    'rule:rooted-presence-yields-culture',   // Patrimônio Compartilhado: "Presença Enraizada rende 1 Cultura por Era"
    'rule:scholar-no-library',               // Educação Pública: "Eruditos rendem sem exigir Biblioteca"
    'rule:first-advance-discount',           // Filosofia Natural: "o primeiro avanço de cada domínio por Era custa −1 Conhecimento"
    'rule:knowledge-limit-plus-3',           // Síntese: "Limite de Conhecimento +3"
    'rule:govern-culture-recovers-2',        // Escolas de Expressão: "Governar com Cultura recupera 2 níveis"
    'rule:theater-culture-limit-plus-5',     // Renascimento: "Teatro +5 de limite de Cultura"
    'rule:culture-plus-1-per-temple',        // Narrativas Comuns: "Cultura +1 por Templo" (the +1 is hard-coded in cityYield, the tag is unread)
  ];
  const sources = ['packages/game-engine/src', 'packages/game-domain/src', 'apps/server/src', 'apps/web/app'];
  const readers = (tag: string): string[] => {
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const entry of safeList(dir)) {
        const path = join(dir, entry);
        if (/node_modules|dist|\.next/.test(path)) continue;
        if (/\.(ts|tsx)$/.test(entry)) { if (!/alpha-web\.ts$/.test(entry) && readFileSync(path, 'utf8').includes(tag)) hits.push(path); } else if (statSync(path).isDirectory()) walk(path);
      }
    };
    sources.forEach(dir => walk(repo(dir)));
    return hits;
  };
  it.fails('REPRO S-05 (BUG/LEGACY): every Conhecimento/Influência/Cultura promise in the Web has a reader outside alpha-web.ts', () => {
    const unread = PROMISES.filter(tag => readers(tag).length === 0);
    expect(unread).toEqual([]);
  });
  // Economy and city promises of the same kind (lane A2+D, Task 2): the Web text announces them, no engine file reads the tag.
  const ECONOMY_PROMISES = [
    'rule:elevate-village-stone-discount',   // Matemática: "Elevar a Vila custa −1 Pedra"
    'rule:academy-minus-1-stone',            // Academias Cívicas: "Academia custa −1 Pedra"
    'rule:productive-district-plus-1',       // Autossuficiência: "Produzir +1 em cada distrito produtivo"
    'rule:merchant-yields-per-1',            // Economia Comercial: "Mercador rende por 1"
    'rule:artisan-yields-per-1-with-workshop', // Manufaturas Técnicas: "Artesão rende por 1 com Oficina"
    'rule:surplus-conversion',               // Troca: "conversão de excedente"
    'rule:famine-grace-round',               // Saneamento: "a fome não tira habitante na primeira rodada"
    'rule:mood-floor-shaken-in-war',         // Pacto de Continuidade: "Ânimo nunca cai abaixo de Abalada por guerra"
    'rule:supply-plus-1',                    // Logística: "suprimento +1"
  ];
  it.fails('REPRO S-05b (BUG/LEGACY): every economy / city promise in the Web has a reader outside alpha-web.ts', () => {
    const unread = ECONOMY_PROMISES.filter(tag => readers(tag).length === 0);
    expect(unread).toEqual([]);
  });
});

describe('S-06 · hegemony thresholds on STOCKS above what the storage rules allow', () => {
  const ceiling = (resource: keyof AlphaResourcePool, everyBuilding: boolean) => {
    let best = 0;
    for (const civ of CIVILIZATIONS.map(c => c.id).filter(id => !['veyra', 'elyra'].includes(id))) {
      const state = freshGame(civ);
      const m = meta(state);
      m.level = 'METROPOLIS';
      const buildable = urbanOptions(state, P1).cities[m.cityId]!.filter(o => o.build?.kind === 'BUILDING').map(o => (o.build as { building: string }).building);
      m.buildings = (everyBuilding ? AlphaBuildingSchema.options : buildable) as never;
      best = Math.max(best, alphaStorageCapacity(state, P1)[resource]);
    }
    return best;
  };
  it.fails('REPRO S-06a (RULE/BUG): Hegemonia Cultural asks 25 Influência, but even with EVERY building and a Metrópole the limit is 18 (hard cap 20)', () => {
    expect(ceiling('influence', true)).toBeGreaterThanOrEqual(alphaRules().hegemonyRequirements.CULTURAL.find(r => r.metric === 'influence')!.minimum);
  });
  it.fails('REPRO S-06b (RULE/BUG): Hegemonia Econômica asks 30 Riqueza, but with the buildings the game lets you build the best limit is 24', () => {
    expect(ceiling('wealth', false)).toBeGreaterThanOrEqual(alphaRules().hegemonyRequirements.ECONOMIC.find(r => r.metric === 'wealth')!.minimum);
  });
  it('CHARACTERIZATION S-06: 30 Riqueza is reachable only if Tesouro and Banco (not buildable, D-03) existed and the Figura adds +6 (meridia)', () => {
    expect(ceiling('wealth', true)).toBeGreaterThanOrEqual(30);
  });
});

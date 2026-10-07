(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/packages/game-domain/dist/alpha-cards.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ALPHA_CARDS",
    ()=>ALPHA_CARDS
]);
const worldNames = [
    'Sementes de Resistência',
    'Chuvas de Retorno',
    'Ventos de Travessia',
    'Solo em Descanso',
    'Encontro de Feiras',
    'Novas Medidas',
    'Mercados de Passagem',
    'Correntes Favoráveis',
    'Famílias em Jornada',
    'Ofícios em Migração',
    'Abrigos Compartilhados',
    'Caminhos de Retorno',
    'Achados de Fronteira',
    'Perguntas do Céu',
    'Instrumentos Recuperados',
    'Mensageiros Distantes',
    'Vozes nas Praças',
    'Conselhos em Debate',
    'Trégua de Trabalho',
    'Acordos de Colheita',
    'Safra Abundante',
    'Reservas em Cooperação',
    'Escassez de Madeira',
    'Pressão nas Rotas'
];
const strategyNames = [
    'Reservas Coordenadas',
    'Distribuição de Emergência',
    'Pacto de Abastecimento',
    'Oficinas Integradas',
    'Reparo Coletivo',
    'Jornada de Construção',
    'Crédito de Confiança',
    'Feira Extraordinária',
    'Tesouro de Reserva',
    'Debate de Métodos',
    'Cópias Compartilhadas',
    'Bolsa de Investigação',
    'Audiência Aberta',
    'Embaixada Itinerante',
    'Convocação de Conselhos',
    'Linha de Escudos',
    'Defesa Escalonada',
    'Terreno Preparado',
    'Guarda de Retaguarda',
    'Sinais de Resistência',
    'Marcha Orientada',
    'Guias de Travessia',
    'Pontos de Encontro',
    'Passagens Reconhecidas',
    'Rota Alternativa',
    'Delegação de Tarefas',
    'Conselho Ampliado',
    'Escrivães em Serviço',
    'Mandato de Coordenação',
    'Agenda Comum'
];
const advisorNames = [
    'Curador de Sementes',
    'Mestre de Reservas',
    'Supervisor de Obras',
    'Guardião das Ferramentas',
    'Tesoureiro das Rotas',
    'Mediador de Feiras',
    'Observador do Céu',
    'Curador de Registros',
    'Jurista das Praças',
    'Intérprete de Acordos',
    'Coordenador de Guardas',
    'Instrutor de Manobras',
    'Cartógrafo das Passagens',
    'Guia dos Estuários',
    'Organizador de Conselhos',
    'Escrivão de Mandatos',
    'Arquiteta das Comunidades',
    'Diplomata das Margens'
];
const ambitionNames = [
    'Rede de Cidades',
    'Constelação Urbana',
    'Civilização de Centros',
    'Marcas na Fronteira',
    'Horizonte Ampliado',
    'Domínio Conectado',
    'Métodos Compartilhados',
    'Tradição de Estudo',
    'Síntese de Saberes',
    'Cidade de Ofícios',
    'Rede de Distritos',
    'Tecido Institucional',
    'Primeiras Rotas',
    'Rede de Intercâmbio',
    'Horizonte Mercantil',
    'Acordos Duradouros',
    'Mesa de Negociações',
    'Ordem Cooperativa',
    'Guarda da Fronteira',
    'Vitórias de Proteção',
    'Projeção Estratégica',
    'Casas de Expressão',
    'Memória Compartilhada',
    'Cultura de Encontro'
];
const resources = [
    'food',
    'materials',
    'wealth',
    'knowledge',
    'influence'
];
const metrics = [
    'cities',
    'territory',
    'research',
    'districts',
    'routes',
    'treaties',
    'victories',
    'culture'
];
const world = worldNames.map((name, i)=>({
        id: `world-${i + 1}`,
        family: 'WORLD_EVENT',
        name,
        era: 'FOUNDATION',
        timing: 'MAINTENANCE',
        effect: {
            kind: 'PRODUCTION',
            resource: resources[i % 5],
            amount: 2,
            timing: 'ONCE'
        },
        reminder: 'Escolha receber o recurso indicado ou 1 Prestígio. Uma decisão por civilização enquanto este evento estiver ativo.'
    }));
const strategy = strategyNames.map((name, i)=>({
        id: `strategy-${i + 1}`,
        family: 'STRATEGY',
        name,
        era: 'FOUNDATION',
        timing: i >= 15 && i < 20 ? 'REACTION' : 'PLANNING',
        effect: i < 15 ? {
            kind: 'PRODUCTION',
            resource: resources[Math.floor(i / 3)],
            amount: 2 + i % 3,
            timing: 'ONCE'
        } : {
            kind: i < 20 ? 'STRENGTH' : i < 25 ? 'MOVEMENT' : 'COMMAND',
            amount: 1 + i % 2
        },
        reminder: i < 15 ? 'Receba o recurso imediatamente.' : i < 20 ? 'Modificador de conflito válido nesta rodada, antes dos dados.' : 'Modificador válido até o fim desta rodada.'
    }));
const advisors = advisorNames.map((name, i)=>({
        id: `advisor-${i + 1}`,
        family: 'ADVISOR',
        name,
        era: 'FOUNDATION',
        timing: 'MAINTENANCE',
        effect: i < 10 || i > 15 ? {
            kind: 'PRODUCTION',
            resource: resources[Math.floor(i / 2) % 5],
            amount: 1,
            timing: 'ROUND_START'
        } : {
            kind: i < 12 ? 'STRENGTH' : i < 14 ? 'MOVEMENT' : 'COMMAND',
            amount: 1
        },
        reminder: 'Benefício persistente, creditado no início de cada rodada enquanto este conselheiro ocupar um espaço ativo.'
    }));
const ambitions = ambitionNames.map((name, i)=>({
        id: `ambition-${i + 1}`,
        family: 'AMBITION',
        name,
        era: 'FOUNDATION',
        timing: 'END_ROUND',
        effect: null,
        objective: {
            metric: metrics[Math.floor(i / 3)],
            threshold: [
                2,
                3,
                4
            ][i % 3],
            prestige: [
                2,
                3,
                4
            ][i % 3]
        },
        reminder: 'Objetivo secreto. Receba Prestígio uma única vez ao atender o requisito no fim de uma rodada. Não concede Hegemonia.'
    }));
const ALPHA_CARDS = [
    ...world,
    ...strategy,
    ...ambitions,
    ...advisors
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/alpha-catalog.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AlphaUnitClassSchema",
    ()=>AlphaUnitClassSchema,
    "UnitCatalogEntrySchema",
    ()=>UnitCatalogEntrySchema,
    "alphaUnitCatalog",
    ()=>alphaUnitCatalog,
    "cityModifierSide",
    ()=>cityModifierSide
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-client] (ecmascript)");
;
;
;
const AlphaUnitClassSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'INFANTRY',
    'GUARD',
    'RANGED',
    'CAVALRY',
    'SIEGE',
    'FLEET',
    'PIONEER',
    'ENVOY',
    'COASTAL_VESSEL'
]);
const UnitCatalogEntrySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    cost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    metal: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].default(0),
    upkeep: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    movement: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].min(1),
    strength: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    domain: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'LAND',
        'SEA'
    ]),
    terrainModifiers: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TerrainTypeSchema"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(-10).max(10)),
    cityModifier: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    /** Which side of a city battle the city modifier serves. Older snapshots omit it; see `cityModifierSide`. */ cityModifierSide: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'ATTACK',
        'DEFENSE'
    ]).optional(),
    era: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaEraSchema"],
    militaryInfrastructure: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    role: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(160),
    /** Fleets: cargo slots offered to land pieces (DEC-014 vertical slice). Land pieces: slots they take when carried. */ transport: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].default(0),
    cargo: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].min(1).default(1)
});
const pool = (values)=>({
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"])(),
        ...values
    });
const terrain = {
    UNKNOWN: 0,
    PLAINS: 0,
    FOREST: 0,
    HILLS: 0,
    MOUNTAINS: 0,
    COAST: 0,
    SEA: 0
};
function cityModifierSide(kind, entry) {
    return entry.cityModifierSide ?? (kind === 'GUARD' ? 'DEFENSE' : 'ATTACK');
}
function alphaUnitCatalog() {
    const make = (name, cost, movement, strength, role)=>({
            name,
            cost,
            metal: 0,
            movement,
            strength,
            role,
            upkeep: pool({
                food: 1
            }),
            domain: 'LAND',
            terrainModifiers: {
                ...terrain
            },
            cityModifier: 0,
            era: 'FOUNDATION',
            militaryInfrastructure: false,
            transport: 0,
            cargo: 1
        });
    return {
        INFANTRY: make('Infantaria', pool({
            food: 1,
            materials: 2
        }), 2, 2, 'Linha: cada Guarda do dado cancela Impacto inimigo.'),
        GUARD: {
            ...make('Guarda', pool({
                food: 1,
                materials: 3
            }), 2, 2, 'Muro: defende a cidade e as fortificações.'),
            cityModifierSide: 'DEFENSE',
            militaryInfrastructure: true
        },
        RANGED: {
            ...make('Arqueiros', pool({
                food: 1,
                materials: 2
            }), 2, 2, 'Salva: um Comando do dado vira Poder.'),
            era: 'EXPANSION',
            militaryInfrastructure: true
        },
        CAVALRY: {
            ...make('Cavalaria', pool({
                food: 2,
                materials: 2,
                wealth: 1
            }), 2, 3, 'Flanco: Comando vale Poder na planície. Move 2 (3 no Grau II).'),
            metal: 1,
            era: 'EXPANSION',
            militaryInfrastructure: true,
            cargo: 2
        },
        SIEGE: {
            ...make('Engenho de cerco', pool({
                materials: 4,
                wealth: 1
            }), 1, 1, 'Brecha: +2 contra cidade fortificada e abre Integridade.'),
            metal: 2,
            era: 'CIVILIZATION',
            militaryInfrastructure: true,
            cargo: 2
        },
        FLEET: {
            ...make('Frota', pool({
                materials: 3,
                wealth: 2
            }), 3, 3, 'Abordagem: bloqueia o porto inimigo. Carrega 2 peças (3 no Grau II).'),
            metal: 1,
            domain: 'SEA',
            era: 'EXPANSION',
            transport: 2
        },
        /** Canon change (2026-10-05): Explorador and Pioneiro are one civil piece. It explores or founds, never both in the same Order; without combat. */ PIONEER: make('Pioneiro', pool({
            food: 3,
            materials: 2
        }), 3, 0, 'Explora regiões e funda cidades. Civil, sem combate.'),
        ENVOY: {
            ...make('Enviado', pool({
                wealth: 2,
                influence: 1
            }), 3, 0, 'Diplomacia e presença cultural.'),
            upkeep: pool({
                wealth: 1
            })
        },
        /** First naval class (naval audit): Era I, explores and crosses the coast, carries one piece, never fights. */ COASTAL_VESSEL: {
            ...make('Embarcação Costeira', pool({
                materials: 2,
                wealth: 1
            }), 3, 0, 'Explora a costa e leva uma peça. Não combate.'),
            upkeep: pool({
                wealth: 1
            }),
            domain: 'SEA',
            transport: 1
        }
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/alpha-city-ladder.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AlphaDistrictCatalogSchema",
    ()=>AlphaDistrictCatalogSchema,
    "CITY_LADDER",
    ()=>CITY_LADDER,
    "DISTRICT_CATALOG",
    ()=>DISTRICT_CATALOG,
    "ELEVATE_TABLE",
    ()=>ELEVATE_TABLE,
    "ElevateRequirementSchema",
    ()=>ElevateRequirementSchema,
    "IMPERIAL_POPULATION_CEILING",
    ()=>IMPERIAL_POPULATION_CEILING,
    "districtEntry",
    ()=>districtEntry,
    "districtOfBuilding",
    ()=>districtOfBuilding,
    "effectiveCapacity",
    ()=>effectiveCapacity,
    "effectiveLevel",
    ()=>effectiveLevel,
    "elevateRequirement",
    ()=>elevateRequirement,
    "ladderStep",
    ()=>ladderStep,
    "levelIndex",
    ()=>levelIndex,
    "levelSupportedByPopulation",
    ()=>levelSupportedByPopulation,
    "nextLevel",
    ()=>nextLevel,
    "populationCeiling",
    ()=>populationCeiling,
    "supplyReach",
    ()=>supplyReach
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-client] (ecmascript)");
;
;
const CITY_LADDER = [
    {
        level: 'OUTPOST',
        minPopulation: 2,
        capacity: 1,
        slots: 1,
        supplyReach: 2,
        garrison: 4
    },
    {
        level: 'HAMLET',
        minPopulation: 4,
        capacity: 1,
        slots: 1,
        supplyReach: 2,
        garrison: 4
    },
    {
        level: 'VILLAGE',
        minPopulation: 6,
        capacity: 2,
        slots: 2,
        supplyReach: 3,
        garrison: 5
    },
    {
        level: 'CITY',
        minPopulation: 8,
        capacity: 2,
        slots: 3,
        supplyReach: 3,
        garrison: 6
    },
    {
        level: 'GREAT_CITY',
        minPopulation: 11,
        capacity: 3,
        slots: 4,
        supplyReach: 4,
        garrison: 7
    },
    {
        level: 'METROPOLIS',
        minPopulation: 14,
        capacity: 3,
        slots: 5,
        supplyReach: 4,
        garrison: 8
    },
    {
        level: 'IMPERIAL_METROPOLIS',
        minPopulation: 18,
        capacity: 4,
        slots: 6,
        supplyReach: 5,
        garrison: 10
    }
];
const IMPERIAL_POPULATION_CEILING = 20;
const levelIndex = (level)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityLevelSchema"].options.indexOf(level);
const ladderStep = (level)=>CITY_LADDER[levelIndex(level)];
const nextLevel = (level)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityLevelSchema"].options[levelIndex(level) + 1] ?? null;
function levelSupportedByPopulation(population) {
    let supported = 'OUTPOST';
    for (const step of CITY_LADDER)if (population >= step.minPopulation) supported = step.level;
    return supported;
}
function populationCeiling(level) {
    const next = nextLevel(level);
    return next ? ladderStep(next).minPopulation : IMPERIAL_POPULATION_CEILING;
}
const effectiveLevel = (built, population)=>levelIndex(built) <= levelIndex(levelSupportedByPopulation(population)) ? built : levelSupportedByPopulation(population);
const effectiveCapacity = (built, population)=>ladderStep(effectiveLevel(built, population)).capacity;
const supplyReach = (level)=>1 + Math.ceil((levelIndex(level) + 1) / 2);
const ElevateRequirementSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    to: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityLevelSchema"],
    minPopulation: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().positive(),
    cost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaResourcePoolSchema"],
    advances: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1)).min(1),
    era: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaEraSchema"]
});
const cost = (values)=>({
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])(),
        ...values
    });
const ELEVATE_TABLE = [
    {
        to: 'HAMLET',
        minPopulation: 4,
        cost: cost({
            wood: 3
        }),
        advances: [
            'web-agriculture'
        ],
        era: 'FOUNDATION'
    },
    {
        to: 'VILLAGE',
        minPopulation: 6,
        cost: cost({
            wood: 4,
            stone: 2
        }),
        advances: [
            'web-masonry'
        ],
        era: 'EXPANSION'
    },
    {
        to: 'CITY',
        minPopulation: 8,
        cost: cost({
            wood: 5,
            stone: 3,
            wealth: 2
        }),
        advances: [
            'web-engineering'
        ],
        era: 'CONSOLIDATION'
    },
    {
        to: 'GREAT_CITY',
        minPopulation: 11,
        cost: cost({
            wood: 6,
            stone: 5,
            wealth: 3,
            knowledge: 2
        }),
        advances: [
            'web-urbanism'
        ],
        era: 'CIVILIZATION'
    },
    {
        to: 'METROPOLIS',
        minPopulation: 14,
        cost: cost({
            wood: 8,
            stone: 6,
            wealth: 5,
            knowledge: 3
        }),
        advances: [
            'web-sanitation'
        ],
        era: 'EMPIRES'
    },
    {
        to: 'IMPERIAL_METROPOLIS',
        minPopulation: 18,
        cost: cost({
            wood: 10,
            stone: 8,
            wealth: 8,
            knowledge: 4
        }),
        advances: [
            'web-sanitation',
            'web-world-metropolises'
        ],
        era: 'ASCENSION'
    }
].map(_c = (entry)=>ElevateRequirementSchema.parse(entry));
_c1 = ELEVATE_TABLE;
const elevateRequirement = (to)=>ELEVATE_TABLE.find((entry)=>entry.to === to) ?? null;
const AlphaDistrictCatalogSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    district: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaDistrictSchema"],
    advance: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    coastal: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    cost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaResourcePoolSchema"],
    buildings: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaBuildingSchema"]),
    effect: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1)
});
const districtCost = cost({
    wood: 3,
    stone: 1
});
const DISTRICT_CATALOG = [
    {
        district: 'AGRARIAN',
        advance: 'web-agriculture',
        coastal: false,
        cost: districtCost,
        buildings: [
            'GRANARY',
            'MILL',
            'IRRIGATION'
        ],
        effect: '+2 Alimento por Produzir'
    },
    {
        district: 'COMMERCIAL',
        advance: 'web-exchange',
        coastal: false,
        cost: districtCost,
        buildings: [
            'MARKET',
            'TREASURY',
            'BANK'
        ],
        effect: '+1 Riqueza por Produzir; rota a partir desta cidade'
    },
    {
        district: 'ACADEMIC',
        advance: 'web-writing',
        coastal: false,
        cost: districtCost,
        buildings: [
            'LIBRARY',
            'ACADEMY',
            'OBSERVATORY',
            'ARCHIVE',
            'LABORATORY',
            'SCRIBES_HOUSE'
        ],
        effect: '+1 Conhecimento por Produzir'
    },
    {
        district: 'ADMINISTRATIVE',
        advance: 'web-codes',
        coastal: false,
        cost: districtCost,
        buildings: [
            'CHANCELLERY',
            'COURT',
            'CIVIC_SQUARE'
        ],
        effect: 'Capacidade Administrativa +1; Governar +1'
    },
    {
        district: 'MILITARY',
        advance: 'web-guard-formations',
        coastal: false,
        cost: districtCost,
        buildings: [
            'BARRACKS',
            'ARSENAL',
            'TRAINING_GROUND'
        ],
        effect: 'Recrutar sem limite de Capacidade (ainda ≤ Soldados); guarnição +1'
    },
    {
        district: 'INDUSTRIAL',
        advance: 'web-metallurgy',
        coastal: false,
        cost: districtCost,
        buildings: [
            'WORKSHOP',
            'FOUNDRY',
            'WAREHOUSE'
        ],
        effect: '+1 Madeira e +1 Pedra por Produzir'
    },
    {
        district: 'CULTURAL',
        advance: 'web-common-narratives',
        coastal: false,
        cost: districtCost,
        buildings: [
            'TEMPLE',
            'THEATER',
            'CULTURAL_CENTER',
            'SANCTUARY',
            'TRADITION_HOUSE'
        ],
        effect: '+1 Cultura por Produzir'
    },
    {
        district: 'MARITIME',
        advance: 'web-coastal-navigation',
        coastal: true,
        cost: districtCost,
        buildings: [
            'PORT',
            'SHIPYARD',
            'LIGHTHOUSE'
        ],
        effect: 'Porto básico incluído; pesca +1 Alimento; exige uma borda d’água navegável. Estaleiro e Farol são opcionais, ainda sem efeito.'
    }
].map(_c2 = (entry)=>AlphaDistrictCatalogSchema.parse(entry));
_c3 = DISTRICT_CATALOG;
const districtEntry = (district)=>DISTRICT_CATALOG.find((entry)=>entry.district === district);
const districtOfBuilding = (building)=>DISTRICT_CATALOG.find((entry)=>entry.buildings.includes(building))?.district ?? null;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "ELEVATE_TABLE$[\n    { to: 'HAMLET', minPopulation: 4, cost: cost({ wood: 3 }), advances: ['web-agriculture'], era: 'FOUNDATION' },\n    { to: 'VILLAGE', minPopulation: 6, cost: cost({ wood: 4, stone: 2 }), advances: ['web-masonry'], era: 'EXPANSION' },\n    { to: 'CITY', minPopulation: 8, cost: cost({ wood: 5, stone: 3, wealth: 2 }), advances: ['web-engineering'], era: 'CONSOLIDATION' },\n    { to: 'GREAT_CITY', minPopulation: 11, cost: cost({ wood: 6, stone: 5, wealth: 3, knowledge: 2 }), advances: ['web-urbanism'], era: 'CIVILIZATION' },\n    { to: 'METROPOLIS', minPopulation: 14, cost: cost({ wood: 8, stone: 6, wealth: 5, knowledge: 3 }), advances: ['web-sanitation'], era: 'EMPIRES' },\n    { to: 'IMPERIAL_METROPOLIS', minPopulation: 18, cost: cost({ wood: 10, stone: 8, wealth: 8, knowledge: 4 }), advances: ['web-sanitation', 'web-world-metropolises'], era: 'ASCENSION' },\n].map");
__turbopack_context__.k.register(_c1, "ELEVATE_TABLE");
__turbopack_context__.k.register(_c2, "DISTRICT_CATALOG$[\n    { district: 'AGRARIAN', advance: 'web-agriculture', coastal: false, cost: districtCost, buildings: ['GRANARY', 'MILL', 'IRRIGATION'], effect: '+2 Alimento por Produzir' },\n    { district: 'COMMERCIAL', advance: 'web-exchange', coastal: false, cost: districtCost, buildings: ['MARKET', 'TREASURY', 'BANK'], effect: '+1 Riqueza por Produzir; rota a partir desta cidade' },\n    { district: 'ACADEMIC', advance: 'web-writing', coastal: false, cost: districtCost, buildings: ['LIBRARY', 'ACADEMY', 'OBSERVATORY', 'ARCHIVE', 'LABORATORY', 'SCRIBES_HOUSE'], effect: '+1 Conhecimento por Produzir' },\n    { district: 'ADMINISTRATIVE', advance: 'web-codes', coastal: false, cost: districtCost, buildings: ['CHANCELLERY', 'COURT', 'CIVIC_SQUARE'], effect: 'Capacidade Administrativa +1; Governar +1' },\n    { district: 'MILITARY', advance: 'web-guard-formations', coastal: false, cost: districtCost, buildings: ['BARRACKS', 'ARSENAL', 'TRAINING_GROUND'], effect: 'Recrutar sem limite de Capacidade (ainda ≤ Soldados); guarnição +1' },\n    { district: 'INDUSTRIAL', advance: 'web-metallurgy', coastal: false, cost: districtCost, buildings: ['WORKSHOP', 'FOUNDRY', 'WAREHOUSE'], effect: '+1 Madeira e +1 Pedra por Produzir' },\n    { district: 'CULTURAL', advance: 'web-common-narratives', coastal: false, cost: districtCost, buildings: ['TEMPLE', 'THEATER', 'CULTURAL_CENTER', 'SANCTUARY', 'TRADITION_HOUSE'], effect: '+1 Cultura por Produzir' },\n    { district: 'MARITIME', advance: 'web-coastal-navigation', coastal: true, cost: districtCost, buildings: ['PORT', 'SHIPYARD', 'LIGHTHOUSE'], effect: 'Porto básico incluído; pesca +1 Alimento; exige uma borda d’água navegável. Estaleiro e Farol são opcionais, ainda sem efeito.' },\n].map");
__turbopack_context__.k.register(_c3, "DISTRICT_CATALOG");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/alpha-civilization-kits.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BannerShapeSchema",
    ()=>BannerShapeSchema,
    "BorderPatternSchema",
    ()=>BorderPatternSchema,
    "CIVILIZATION_CARDS",
    ()=>CIVILIZATION_CARDS,
    "CIVILIZATION_CARD_UNLOCK_ERAS",
    ()=>CIVILIZATION_CARD_UNLOCK_ERAS,
    "CIVILIZATION_KITS",
    ()=>CIVILIZATION_KITS,
    "CivilizationAffinitySchema",
    ()=>CivilizationAffinitySchema,
    "CivilizationCardSchema",
    ()=>CivilizationCardSchema,
    "CivilizationKitSchema",
    ()=>CivilizationKitSchema,
    "CivilizationMarkSchema",
    ()=>CivilizationMarkSchema,
    "EmblemSchema",
    ()=>EmblemSchema,
    "KitItemSchema",
    ()=>KitItemSchema,
    "KitSourceSchema",
    ()=>KitSourceSchema,
    "KitStatusSchema",
    ()=>KitStatusSchema,
    "SealShapeSchema",
    ()=>SealShapeSchema,
    "civilizationKit",
    ()=>civilizationKit
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-institutions.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$effects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-effects.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-leaders.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-catalog.js [app-client] (ecmascript)");
;
;
;
;
;
const CivilizationAffinitySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'POLITICAL',
    'TERRITORIAL',
    'ECONOMIC',
    'MARITIME',
    'SCIENTIFIC',
    'CULTURAL',
    'MILITARY',
    'AGRARIAN'
]);
const KitSourceSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'ALPHA',
    'BIBLE',
    'PROPOSAL'
]);
const KitStatusSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'ACTIVE',
    'PLANNED'
]);
const KitItemSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    text: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(240),
    source: KitSourceSchema,
    status: KitStatusSchema
});
const SealShapeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'CIRCLE',
    'HEXAGON',
    'DIAMOND'
]);
const BannerShapeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'STRAIGHT',
    'SWALLOWTAIL',
    'PENNANT',
    'GONFALON',
    'SHIELD',
    'ROUNDED',
    'POLE',
    'PANEL',
    'EAGLE',
    'DEGEL',
    'VEXILLUM',
    'RAVEN',
    'STREAMER',
    'LONG',
    'SQUARE'
]);
const BorderPatternSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'SOLID',
    'DASHED',
    'DOTTED',
    'DOUBLE',
    'DASH_DOT',
    'BAND'
]);
const EmblemSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'espiga',
    'passo',
    'ondas',
    'farol',
    'tresvozes',
    'bigorna',
    'olho',
    'folha',
    'encruzilhada',
    'sol',
    'arcos',
    'chama',
    'moeda',
    'prisma',
    'presa',
    'espiral',
    'elos',
    'floco',
    // Core 10 emblems (historical, no modern national symbol): aspis, sema-tauy, eight-pointed star, royal eagle, lion of Judah, aquila, raven, ding cauldron, peacock on hill, mascaipacha.
    'aspis',
    'semtauy',
    'estrela8',
    'aguia',
    'leao',
    'aquila',
    'corvo',
    'ding',
    'pavao',
    'mascaipacha'
]);
const CivilizationMarkSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    emblem: EmblemSchema,
    seal: SealShapeSchema,
    banner: BannerShapeSchema,
    border: BorderPatternSchema
});
const CIVILIZATION_CARD_UNLOCK_ERAS = [
    'FOUNDATION',
    'CIVILIZATION',
    'ASCENSION'
];
const CivilizationCardSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^civ-[a-z]+-[1-3]$/),
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(60),
    unlockEra: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum(CIVILIZATION_CARD_UNLOCK_ERAS),
    effect: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$effects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaEffectSchema"],
    text: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(160),
    source: KitSourceSchema
});
const CivilizationKitSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    availability: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'PLAYABLE',
        'AUTHORING'
    ]),
    affinity: CivilizationAffinitySchema,
    identity: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    capital: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable(),
    leaderId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable(),
    trait: KitItemSchema,
    heritage: KitItemSchema,
    /** UNIT signatures name the family they replace for this civilization (every piece of that family is the signature). */ signature: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'UNIT',
            'STRUCTURE'
        ]),
        name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        family: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaUnitClassSchema"].nullable().default(null),
        item: KitItemSchema
    }),
    limitation: KitItemSchema,
    cards: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(CivilizationCardSchema).max(3),
    mark: CivilizationMarkSchema,
    /** What still has to be authored before the civilization can be played. Empty for every playable civilization. */ authoringGaps: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string())
}).superRefine(_c = (kit, ctx)=>{
    if (kit.availability === 'PLAYABLE' && (kit.authoringGaps.length || kit.capital === null || kit.leaderId === null || kit.cards.length !== 3)) ctx.addIssue({
        code: 'custom',
        message: `${kit.id}: a playable kit cannot have authoring gaps`
    });
    if (kit.cards.some((card, i)=>card.unlockEra !== CIVILIZATION_CARD_UNLOCK_ERAS[i])) ctx.addIssue({
        code: 'custom',
        message: `${kit.id}: cards unlock in order`
    });
});
_c1 = CivilizationKitSchema;
const item = (text, source, status = 'PLANNED')=>({
        text,
        source,
        status
    });
const produce = (resource, amount)=>({
        kind: 'PRODUCTION',
        resource,
        amount,
        timing: 'ONCE'
    });
const round = (kind, amount = 1)=>({
        kind,
        amount
    });
const cards = (id, rows)=>rows.map(([name, effect, text], i)=>({
            id: `civ-${id}-${i + 1}`,
            name,
            unlockEra: CIVILIZATION_CARD_UNLOCK_ERAS[i],
            effect,
            text,
            source: 'PROPOSAL'
        }));
const mark = (emblem, seal, banner, border)=>({
        emblem,
        seal,
        banner,
        border
    });
const alpha = (id)=>{
    const civ = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CIVILIZATIONS"].find((c)=>c.id === id);
    return {
        id,
        name: civ.name,
        availability: 'PLAYABLE',
        identity: civ.identity,
        capital: civ.capital,
        leaderId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LEADERS"].find((l)=>l.civilizationId === id)?.id ?? null,
        authoringGaps: []
    };
};
const bibleOnly = (id, name, identity)=>({
        id,
        name,
        availability: 'AUTHORING',
        identity,
        capital: null,
        leaderId: null,
        cards: [],
        authoringGaps: [
            'líder e habilidade do líder',
            'nome da capital',
            '3 cartas próprias'
        ]
    });
const KITS = [
    {
        ...alpha('aurelia'),
        affinity: 'AGRARIAN',
        trait: item('Andenes e Qhapaq Ñan: fazendas trabalhadas rendem +1 Alimento quando a cidade Produz, e Estradas em Colina ou Montanha custam 1 Madeira/Pedra a menos.', 'PROPOSAL', 'ACTIVE'),
        heritage: item('Começa com +2 Alimento, +1 Madeira e +1 Pedra (qollqa cheia, terraços prontos).', 'PROPOSAL', 'ACTIVE'),
        signature: {
            kind: 'STRUCTURE',
            name: 'Qollqa Comum',
            family: null,
            item: item('Celeiro que também amortece uma queda de Ânimo por Era.', 'PROPOSAL')
        },
        limitation: item('Exército do Inca come: manutenção militar +1 Alimento a cada 4 peças.', 'BIBLE', 'ACTIVE'),
        cards: cards('aurelia', [
            [
                'Qollqa Aberta',
                produce('food', 3),
                '+3 Alimento.'
            ],
            [
                'Mit’a de Obras',
                produce('materials', 3),
                '+3 Madeira/Pedra.'
            ],
            [
                'Chasqui Veloz',
                round('COMMAND'),
                '+1 ação principal nesta rodada.'
            ]
        ]),
        mark: mark('mascaipacha', 'CIRCLE', 'SQUARE', 'BAND')
    },
    {
        ...alpha('valgard'),
        affinity: 'TERRITORIAL',
        trait: item('Defesa do território: +1 alcance de suprimento para peças em território próprio.', 'BIBLE', 'ACTIVE'),
        heritage: item('Começa com 1 Guarda e uma Pedreira numa Colina ou Montanha do território inicial, quando houver.', 'BIBLE', 'ACTIVE'),
        signature: {
            kind: 'UNIT',
            name: 'Falange de Escudos',
            family: 'GUARD',
            item: item('Suas Guardas dão +1 na defesa de uma cidade fortificada.', 'BIBLE', 'ACTIVE')
        },
        limitation: item('Pólis rivais: Enviados custam +1 Influência.', 'BIBLE', 'ACTIVE'),
        cards: cards('valgard', [
            [
                'Falange Cerrada',
                round('STRENGTH'),
                '+1 Força nos conflitos desta rodada.'
            ],
            [
                'Pedreira de Pentélico',
                produce('materials', 3),
                '+3 Madeira/Pedra.'
            ],
            [
                'Acrópole de Refúgio',
                round('STRENGTH', 2),
                '+2 Força nos conflitos desta rodada.'
            ]
        ]),
        mark: mark('aspis', 'HEXAGON', 'SHIELD', 'DOUBLE')
    },
    {
        ...alpha('meridia'),
        affinity: 'ECONOMIC',
        trait: item('Karum: a primeira oferta comercial concluída em cada rodada rende +1 Riqueza.', 'PROPOSAL', 'ACTIVE'),
        heritage: item('Começa com +3 Riqueza.', 'BIBLE', 'ACTIVE'),
        signature: {
            kind: 'STRUCTURE',
            name: 'Karum',
            family: null,
            item: item('Entreposto: rotas terrestres passam sem custo de manutenção.', 'BIBLE')
        },
        limitation: item('Cidades de tijolo: Fortificação não passa de Muralha de Pedra até a Era IV.', 'BIBLE', 'ACTIVE'),
        cards: cards('meridia', [
            [
                'Feira do Karum',
                produce('wealth', 3),
                '+3 Riqueza.'
            ],
            [
                'Tábuas de Argila',
                produce('knowledge', 2),
                '+2 Conhecimento.'
            ],
            [
                'Escribas do Templo',
                round('COMMAND'),
                '+1 ação principal nesta rodada.'
            ]
        ]),
        mark: mark('estrela8', 'CIRCLE', 'PANEL', 'BAND')
    },
    {
        ...alpha('thalos'),
        affinity: 'MARITIME',
        trait: item('Costas do Norte: revelar uma região costeira rende +1 Conhecimento.', 'PROPOSAL', 'ACTIVE'),
        heritage: item('Começa com 1 Pioneiro extra.', 'PROPOSAL', 'ACTIVE'),
        signature: {
            kind: 'UNIT',
            name: 'Incursores de Drakkar',
            family: 'INFANTRY',
            item: item('Sua Infantaria ataca a partir de navios sem a penalidade anfíbia.', 'BIBLE', 'ACTIVE')
        },
        limitation: item('Longe do fiorde: exércitos terrestres têm −1 de suprimento fora do território próprio.', 'BIBLE', 'ACTIVE'),
        cards: cards('thalos', [
            [
                'Vento de Popa',
                round('MOVEMENT'),
                '+1 movimento nesta rodada.'
            ],
            [
                'Thing da Costa',
                produce('influence', 2),
                '+2 Influência.'
            ],
            [
                'Sagas do Mar',
                produce('knowledge', 3),
                '+3 Conhecimento.'
            ]
        ]),
        mark: mark('corvo', 'CIRCLE', 'RAVEN', 'DASH_DOT')
    },
    {
        ...alpha('saren'),
        affinity: 'POLITICAL',
        trait: item('Editos e diplomacia: tratados duram +1 rodada.', 'BIBLE', 'ACTIVE'),
        heritage: item('Começa com 1 Enviado e +2 Influência.', 'BIBLE', 'ACTIVE'),
        signature: {
            kind: 'UNIT',
            name: 'Dūta Imperial',
            family: 'ENVOY',
            item: item('Enviado que soma +1 de integração por Ação cívica na cidade onde está.', 'BIBLE')
        },
        limitation: item('Elefantes e carros, não cavalos: Cavalaria custa +1 Alimento de manutenção.', 'BIBLE', 'ACTIVE'),
        cards: cards('saren', [
            [
                'Édito de Pilar',
                produce('influence', 3),
                '+3 Influência.'
            ],
            [
                'Conselho do Mandala',
                round('COMMAND'),
                '+1 ação principal nesta rodada.'
            ],
            [
                'Celeiros de Pataliputra',
                produce('food', 3),
                '+3 Alimento.'
            ]
        ]),
        mark: mark('pavao', 'DIAMOND', 'LONG', 'DOTTED')
    },
    {
        ...alpha('kor'),
        affinity: 'TERRITORIAL',
        trait: item('Infraestrutura: pedreiras em Colinas rendem +1 Pedra quando a cidade Produz, e peças sobre uma Estrada (ou em hex próprio ao lado dela) ficam abastecidas.', 'BIBLE', 'ACTIVE'),
        heritage: item('Começa com Paliçada na capital.', 'BIBLE', 'ACTIVE'),
        signature: {
            kind: 'UNIT',
            name: 'Legionários-Engenheiros',
            family: 'SIEGE',
            item: item('Seus Cercos abrem +1 Brecha contra fortificações de pedra ou melhores.', 'BIBLE', 'ACTIVE')
        },
        limitation: item('Terra primeiro: Frotas têm −1 movimento.', 'BIBLE', 'ACTIVE'),
        cards: cards('kor', [
            [
                'Fábrica das Legiões',
                produce('materials', 3),
                '+3 Madeira/Pedra.'
            ],
            [
                'Testudo',
                round('STRENGTH'),
                '+1 Força nos conflitos desta rodada.'
            ],
            [
                'Castrum em Uma Noite',
                produce('materials', 4),
                '+4 Madeira/Pedra.'
            ]
        ]),
        mark: mark('aquila', 'DIAMOND', 'VEXILLUM', 'SOLID')
    },
    {
        ...alpha('orinth'),
        affinity: 'SCIENTIFIC',
        trait: item('Método e administração: o primeiro avanço de cada domínio custa 1 Conhecimento a menos.', 'BIBLE', 'ACTIVE'),
        heritage: item('Começa com +2 Conhecimento.', 'BIBLE', 'ACTIVE'),
        signature: {
            kind: 'UNIT',
            name: 'Astrônomo Imperial',
            family: 'PIONEER',
            item: item('Pioneiro que revela também as regiões vizinhas à revelada.', 'BIBLE')
        },
        limitation: item('Poucos cavalos: Cavalaria custa +1 Alimento de manutenção.', 'BIBLE', 'ACTIVE'),
        cards: cards('orinth', [
            [
                'Exame Imperial',
                produce('knowledge', 2),
                '+2 Conhecimento.'
            ],
            [
                'Correio Imperial',
                round('MOVEMENT'),
                '+1 movimento nesta rodada.'
            ],
            [
                'Cem Escolas',
                produce('knowledge', 4),
                '+4 Conhecimento.'
            ]
        ]),
        mark: mark('ding', 'HEXAGON', 'STREAMER', 'DOUBLE')
    },
    {
        ...alpha('nymara'),
        affinity: 'AGRARIAN',
        trait: item('Cheia do Nilo: a Seca custa 1 Alimento a menos; se a Irrigação a impedir, a cidade ainda recupera 1 Alimento.', 'PROPOSAL', 'ACTIVE'),
        heritage: item('Começa com +3 Alimento (a primeira cheia).', 'PROPOSAL', 'ACTIVE'),
        signature: {
            kind: 'STRUCTURE',
            name: 'Casa da Eternidade',
            family: null,
            item: item('Cada Obra de Legado concluída rende +2 Prestígio.', 'BIBLE', 'ACTIVE')
        },
        limitation: item('Rio acima, mar adentro não: Frotas têm −1 movimento.', 'PROPOSAL', 'ACTIVE'),
        cards: cards('nymara', [
            [
                'Cheia Generosa',
                produce('food', 3),
                '+3 Alimento.'
            ],
            [
                'Titulatura Real',
                produce('influence', 3),
                '+3 Influência.'
            ],
            [
                'Pedreira de Assuã',
                produce('materials', 3),
                '+3 Madeira/Pedra.'
            ]
        ]),
        mark: mark('semtauy', 'DIAMOND', 'POLE', 'DOTTED')
    },
    {
        ...alpha('veyra'),
        affinity: 'POLITICAL',
        trait: item('Enviados custam 1 Riqueza a menos.', 'BIBLE', 'ACTIVE'),
        heritage: item('Começa com 2 Enviados.', 'BIBLE', 'ACTIVE'),
        signature: {
            kind: 'UNIT',
            name: 'Embaixador Errante',
            family: 'ENVOY',
            item: item('Enviado com alcance ilimitado para propor tratados.', 'BIBLE')
        },
        limitation: item('Infantaria só avança para Profissional na Era III.', 'BIBLE'),
        cards: cards('veyra', [
            [
                'Encruzilhada',
                produce('wealth', 3),
                '+3 Riqueza.'
            ],
            [
                'Caravana Veloz',
                round('MOVEMENT'),
                '+1 movimento nesta rodada.'
            ],
            [
                'Palavra Empenhada',
                produce('influence', 3),
                '+3 Influência.'
            ]
        ]),
        mark: mark('encruzilhada', 'HEXAGON', 'SWALLOWTAIL', 'DASH_DOT')
    },
    {
        ...alpha('solenne'),
        affinity: 'CULTURAL',
        trait: item('Identidade e resistência: disputas culturais de Israel e Judá ganham +1 na defesa.', 'PROPOSAL', 'ACTIVE'),
        heritage: item('Capital começa com +1 Ânimo (o povo reunido).', 'PROPOSAL', 'ACTIVE'),
        signature: {
            kind: 'STRUCTURE',
            name: 'Casa do Templo',
            family: null,
            item: item('Santuário exclusivo: +1 Legado por Era.', 'BIBLE')
        },
        limitation: item('Povo do Livro, não das oficinas: avanços de Conhecimento da Era I custam +1.', 'BIBLE', 'ACTIVE'),
        cards: cards('solenne', [
            [
                'Anciãos do Portão',
                produce('influence', 2),
                '+2 Influência.'
            ],
            [
                'Escribas e Rolos',
                produce('knowledge', 3),
                '+3 Conhecimento.'
            ],
            [
                'Convocação das Tribos',
                round('COMMAND'),
                '+1 ação principal nesta rodada.'
            ]
        ]),
        mark: mark('leao', 'HEXAGON', 'DEGEL', 'SOLID')
    },
    {
        ...alpha('dravik'),
        affinity: 'TERRITORIAL',
        trait: item('Estrada Real: Estradas e melhorias custam 1 Madeira/Pedra a menos, e peças sobre uma Estrada ganham +1 de suprimento.', 'PROPOSAL', 'ACTIVE'),
        heritage: item('Começa com +2 Pedra.', 'PROPOSAL', 'ACTIVE'),
        signature: {
            kind: 'STRUCTURE',
            name: 'Qanat',
            family: null,
            item: item('A cidade precisa de 1 Alimento a menos para crescer.', 'PROPOSAL')
        },
        limitation: item('Tributo antes do lucro: rotas comerciais rendem −1 Riqueza.', 'BIBLE', 'ACTIVE'),
        cards: cards('dravik', [
            [
                'Obra de Persépolis',
                produce('materials', 3),
                '+3 Madeira/Pedra.'
            ],
            [
                'Correio Real',
                round('MOVEMENT'),
                '+1 movimento nesta rodada.'
            ],
            [
                'Qanat Provisório',
                produce('food', 3),
                '+3 Alimento.'
            ]
        ]),
        mark: mark('aguia', 'HEXAGON', 'EAGLE', 'DASHED')
    },
    {
        ...alpha('elyra'),
        affinity: 'SCIENTIFIC',
        trait: item('Revelar uma região rende +1 Conhecimento.', 'BIBLE', 'ACTIVE'),
        heritage: item('Começa com 1 Pioneiro extra.', 'BIBLE', 'ACTIVE'),
        signature: {
            kind: 'UNIT',
            name: 'Cartógrafa',
            family: 'PIONEER',
            item: item('Seus Pioneiros revelam regiões a até 2 hexes (versão terrestre; a Cartógrafa naval da Bíblia espera as classes navais).', 'PROPOSAL', 'ACTIVE')
        },
        limitation: item('Cerco custa +1 Metal.', 'BIBLE', 'ACTIVE'),
        cards: cards('elyra', [
            [
                'Aula ao Ar Livre',
                produce('knowledge', 2),
                '+2 Conhecimento.'
            ],
            [
                'Mapa Noturno',
                round('MOVEMENT'),
                '+1 movimento nesta rodada.'
            ],
            [
                'Vínculo de Saber',
                produce('knowledge', 4),
                '+4 Conhecimento.'
            ]
        ]),
        mark: mark('chama', 'CIRCLE', 'PENNANT', 'DASHED')
    },
    {
        ...bibleOnly('kaedor', 'Kaedor', 'Cada moeda, um alicerce.'),
        affinity: 'ECONOMIC',
        trait: item('Tesouros dão +2 de capacidade.', 'BIBLE'),
        heritage: item('Começa com +2 Metal.', 'BIBLE'),
        signature: {
            kind: 'STRUCTURE',
            name: 'Casa de Câmbio',
            family: null,
            item: item('Mercado exclusivo que melhora a conversão do Banco.', 'BIBLE')
        },
        limitation: item('Armazéns dão apenas +2.', 'BIBLE'),
        mark: mark('moeda', 'DIAMOND', 'STRAIGHT', 'DASHED')
    },
    {
        ...bibleOnly('lumaris', 'Lumaris', 'Do brilho, o método.'),
        affinity: 'SCIENTIFIC',
        trait: item('Bibliotecas rendem +1 Conhecimento.', 'BIBLE'),
        heritage: item('Começa com Biblioteca.', 'BIBLE'),
        signature: {
            kind: 'STRUCTURE',
            name: 'Laboratório Real',
            family: null,
            item: item('Laboratório exclusivo: barateia a primeira convergência.', 'BIBLE')
        },
        limitation: item('Guarnição máxima de cidade −1.', 'BIBLE'),
        mark: mark('prisma', 'HEXAGON', 'PENNANT', 'BAND')
    },
    {
        ...bibleOnly('targan', 'Targan', 'Ferro vale mais que ouro.'),
        affinity: 'MILITARY',
        trait: item('Oficinas ao lado de Minas rendem +1 Metal.', 'BIBLE'),
        heritage: item('Começa com Oficina e Arsenal.', 'BIBLE'),
        signature: {
            kind: 'UNIT',
            name: 'Elefantes de Guerra',
            family: 'CAVALRY',
            item: item('Assusta Cavalaria; manutenção alta.', 'BIBLE')
        },
        limitation: item('Celeiros dão apenas +2 e Elefantes exigem Alimento extra.', 'BIBLE'),
        mark: mark('presa', 'DIAMOND', 'SWALLOWTAIL', 'SOLID')
    },
    {
        ...bibleOnly('iskara', 'Iskara', 'Nossos mortos ainda comandam.'),
        affinity: 'CULTURAL',
        trait: item('Cada Obra de Legado concluída rende +2 Prestígio.', 'BIBLE'),
        heritage: item('Começa com Casa Ancestral.', 'BIBLE'),
        signature: {
            kind: 'UNIT',
            name: 'Guardião dos Ancestrais',
            family: 'GUARD',
            item: item('Guarda que dá +1 Resistência cultural à cidade em que está.', 'BIBLE')
        },
        limitation: item('Perde 1 Legado ao abandonar uma cidade cultural.', 'BIBLE'),
        mark: mark('espiral', 'DIAMOND', 'GONFALON', 'DOTTED')
    },
    {
        ...bibleOnly('veloria', 'Veloria', 'Tudo o que se divide, sustenta.'),
        affinity: 'POLITICAL',
        trait: item('Pactos de Não Agressão custam metade da Influência.', 'BIBLE'),
        heritage: item('Começa com um Pacto de Não Agressão.', 'BIBLE'),
        signature: {
            kind: 'UNIT',
            name: 'Voz Federada',
            family: 'ENVOY',
            item: item('Enviado que reforça Pactos Defensivos com +1 peça de apoio.', 'BIBLE')
        },
        limitation: item('Exércitos combinados têm no máximo 4 peças por hex.', 'BIBLE'),
        mark: mark('elos', 'HEXAGON', 'ROUNDED', 'SOLID')
    },
    {
        ...bibleOnly('norvak', 'Norvak', 'O inverno é nosso aliado.'),
        affinity: 'MARITIME',
        trait: item('Unidades ignoram penalidades de terreno frio.', 'BIBLE'),
        heritage: item('Começa com Farol.', 'BIBLE'),
        signature: {
            kind: 'UNIT',
            name: 'Rompe-Gelo',
            family: 'FLEET',
            item: item('Galera de Guerra com +1 Casco em costas frias.', 'BIBLE')
        },
        limitation: item('Fazendas em planície rendem −1 Alimento.', 'BIBLE'),
        mark: mark('floco', 'CIRCLE', 'SHIELD', 'DOUBLE')
    }
];
const CIVILIZATION_KITS = KITS.map(_c2 = (kit)=>CivilizationKitSchema.parse(kit));
_c3 = CIVILIZATION_KITS;
const civilizationKit = (id)=>CIVILIZATION_KITS.find((kit)=>kit.id === id) ?? null;
const CIVILIZATION_CARDS = CIVILIZATION_KITS.flatMap(_c4 = (kit)=>kit.cards);
_c5 = CIVILIZATION_CARDS;
var _c, _c1, _c2, _c3, _c4, _c5;
__turbopack_context__.k.register(_c, "CivilizationKitSchema$z.strictObject({\n    id: z.string(), name: z.string(), availability: z.enum(['PLAYABLE', 'AUTHORING']), affinity: CivilizationAffinitySchema,\n    identity: z.string().min(1), capital: z.string().nullable(), leaderId: z.string().nullable(),\n    trait: KitItemSchema, heritage: KitItemSchema,\n    /** UNIT signatures name the family they replace for this civilization (every piece of that family is the signature). */\n    signature: z.strictObject({ kind: z.enum(['UNIT', 'STRUCTURE']), name: z.string(), family: AlphaUnitClassSchema.nullable().default(null), item: KitItemSchema }),\n    limitation: KitItemSchema,\n    cards: z.array(CivilizationCardSchema).max(3),\n    mark: CivilizationMarkSchema,\n    /** What still has to be authored before the civilization can be played. Empty for every playable civilization. */\n    authoringGaps: z.array(z.string()),\n}).superRefine");
__turbopack_context__.k.register(_c1, "CivilizationKitSchema");
__turbopack_context__.k.register(_c2, "CIVILIZATION_KITS$KITS.map");
__turbopack_context__.k.register(_c3, "CIVILIZATION_KITS");
__turbopack_context__.k.register(_c4, "CIVILIZATION_CARDS$CIVILIZATION_KITS.flatMap");
__turbopack_context__.k.register(_c5, "CIVILIZATION_CARDS");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/alpha-concept.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ALPHA_ERA_MILESTONES",
    ()=>ALPHA_ERA_MILESTONES,
    "ALPHA_ERA_MILESTONE_CRITERIA",
    ()=>ALPHA_ERA_MILESTONE_CRITERIA,
    "ALPHA_ERA_NUMERALS",
    ()=>ALPHA_ERA_NUMERALS,
    "ALPHA_RESOURCE_KEYS",
    ()=>ALPHA_RESOURCE_KEYS,
    "AlphaBalanceSchema",
    ()=>AlphaBalanceSchema,
    "AlphaBuildingSchema",
    ()=>AlphaBuildingSchema,
    "AlphaCitySchema",
    ()=>AlphaCitySchema,
    "AlphaDistrictSchema",
    ()=>AlphaDistrictSchema,
    "AlphaEraMilestoneSchema",
    ()=>AlphaEraMilestoneSchema,
    "AlphaEraSchema",
    ()=>AlphaEraSchema,
    "AlphaResourcePoolSchema",
    ()=>AlphaResourcePoolSchema,
    "AlphaResourceTypeSchema",
    ()=>AlphaResourceTypeSchema,
    "AlphaRoundPhaseSchema",
    ()=>AlphaRoundPhaseSchema,
    "AlphaTelemetrySchema",
    ()=>AlphaTelemetrySchema,
    "BattleModifierSchema",
    ()=>BattleModifierSchema,
    "BattlePostureSchema",
    ()=>BattlePostureSchema,
    "CityLevelSchema",
    ()=>CityLevelSchema,
    "CombatConfigSchema",
    ()=>CombatConfigSchema,
    "CulturalPresenceLevelSchema",
    ()=>CulturalPresenceLevelSchema,
    "CulturalPresenceSchema",
    ()=>CulturalPresenceSchema,
    "ERA_TURN_STEPS",
    ()=>ERA_TURN_STEPS,
    "FORTIFICATION_UPGRADES",
    ()=>FORTIFICATION_UPGRADES,
    "FeedbackSchema",
    ()=>FeedbackSchema,
    "FortificationLevelSchema",
    ()=>FortificationLevelSchema,
    "FortificationStateSchema",
    ()=>FortificationStateSchema,
    "FortificationUpgradeSchema",
    ()=>FortificationUpgradeSchema,
    "GovernmentCatalogSchema",
    ()=>GovernmentCatalogSchema,
    "IndependentActionSchema",
    ()=>IndependentActionSchema,
    "IndependentAttitudeSchema",
    ()=>IndependentAttitudeSchema,
    "IndependentPeopleSchema",
    ()=>IndependentPeopleSchema,
    "IndependentTypeSchema",
    ()=>IndependentTypeSchema,
    "LegacyAlphaEraSchema",
    ()=>LegacyAlphaEraSchema,
    "MapPresetSchema",
    ()=>MapPresetSchema,
    "MoodStateSchema",
    ()=>MoodStateSchema,
    "PulseThreatCommandSchema",
    ()=>PulseThreatCommandSchema,
    "RaidBandSchema",
    ()=>RaidBandSchema,
    "RoundTelemetrySchema",
    ()=>RoundTelemetrySchema,
    "TacticalFaceSchema",
    ()=>TacticalFaceSchema,
    "TradeOfferSchema",
    ()=>TradeOfferSchema,
    "TradeOfferTypeSchema",
    ()=>TradeOfferTypeSchema,
    "UrbanActionTypeSchema",
    ()=>UrbanActionTypeSchema,
    "WORLD_PULSE_CARDS",
    ()=>WORLD_PULSE_CARDS,
    "WorldPulseCardSchema",
    ()=>WorldPulseCardSchema,
    "WorldPulseModuleSchema",
    ()=>WorldPulseModuleSchema,
    "WorldPulseTypeSchema",
    ()=>WorldPulseTypeSchema,
    "alphaBalance",
    ()=>alphaBalance,
    "alphaCombatConfig",
    ()=>alphaCombatConfig,
    "alphaGainOf",
    ()=>alphaGainOf,
    "alphaToLegacyResources",
    ()=>alphaToLegacyResources,
    "cityLevelForPopulation",
    ()=>cityLevelForPopulation,
    "emptyAlphaResourcePool",
    ()=>emptyAlphaResourcePool,
    "eraForRound",
    ()=>eraForRound,
    "eraIndex",
    ()=>eraIndex,
    "eraNumeral",
    ()=>eraNumeral,
    "legacyToAlphaResources",
    ()=>legacyToAlphaResources
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-client] (ecmascript)");
;
;
const AlphaEraSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'FOUNDATION',
    'EXPANSION',
    'CONSOLIDATION',
    'CIVILIZATION',
    'EMPIRES',
    'POWERS',
    'ASCENSION'
]);
const ALPHA_ERA_NUMERALS = [
    'I',
    'II',
    'III',
    'IV',
    'V',
    'VI',
    'VII'
];
const eraNumeral = (era)=>ALPHA_ERA_NUMERALS[AlphaEraSchema.options.indexOf(era)];
const eraIndex = (era)=>AlphaEraSchema.options.indexOf(era);
const eraForRound = (round, roundsPerEra)=>AlphaEraSchema.options[Math.min(AlphaEraSchema.options.length - 1, Math.floor((Math.max(1, round) - 1) / Math.max(1, roundsPerEra)))];
const LegacyAlphaEraSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(_c = (value)=>value === 'HEGEMONY' ? 'ASCENSION' : value, AlphaEraSchema);
_c1 = LegacyAlphaEraSchema;
const AlphaRoundPhaseSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'WORLD_PULSE',
    'PLANNING',
    'URBAN_ACTIONS',
    'ORDERS_MOVEMENT',
    'DIPLOMACY_TRADE',
    'CONFLICTS',
    'INTEGRATION_MAINTENANCE',
    'END_ROUND',
    /** The Era turn (canon §22): nine steps between the last round of an Era and the first of the next. */ 'ERA_TURN'
]);
const ERA_TURN_STEPS = [
    'Sustento e efeitos de fim de Era',
    'Pontuar Ambição',
    'Pulso do Mundo',
    'Ameaças do Mundo',
    'Reforma de Governo',
    'Poder do Líder',
    'Manobras e Ambições',
    'Próximo patamar da Teia',
    'Nova Era'
];
const ALPHA_RESOURCE_KEYS = [
    'food',
    'wood',
    'stone',
    'metal',
    'wealth',
    'knowledge',
    'influence',
    'culture'
];
const AlphaResourceTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'FOOD',
    'WOOD',
    'STONE',
    'METAL',
    'WEALTH',
    'KNOWLEDGE',
    'INFLUENCE',
    'CULTURE'
]);
const AlphaResourcePoolSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    food: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    wood: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    stone: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    metal: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    wealth: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    knowledge: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    influence: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    /** Cultura is a resource since V5.1a; matches saved before it read as 0. */ culture: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].default(0)
});
const emptyAlphaResourcePool = ()=>({
        food: 0,
        wood: 0,
        stone: 0,
        metal: 0,
        wealth: 0,
        knowledge: 0,
        influence: 0,
        culture: 0
    });
const legacyToAlphaResources = (pool)=>({
        food: pool.food,
        wood: Math.ceil(pool.materials / 2),
        stone: Math.floor(pool.materials / 2),
        metal: 0,
        wealth: pool.wealth,
        knowledge: pool.knowledge,
        influence: pool.influence,
        culture: 0
    });
const alphaGainOf = (resource, amount)=>legacyToAlphaResources({
        food: 0,
        materials: 0,
        wealth: 0,
        knowledge: 0,
        influence: 0,
        [resource]: amount
    });
const alphaToLegacyResources = (pool)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"].parse({
        food: pool.food,
        materials: pool.wood + pool.stone + pool.metal,
        wealth: pool.wealth,
        knowledge: pool.knowledge,
        influence: pool.influence
    });
const UrbanActionTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'PRODUCE',
    'BUILD',
    'RECRUIT',
    'RESEARCH',
    'ELEVATE',
    'PROMOTE_MOOD',
    'SUPPORT_TRADE',
    'CIVIC_ACTION',
    'MOVE_CAPITAL'
]);
const MoodStateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'REVOLTING',
    'DESPONDENT',
    'RESTLESS',
    'SERENE',
    'SATISFIED',
    'PROSPEROUS',
    'EXULTANT'
]);
const CityLevelSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'OUTPOST',
    'HAMLET',
    'VILLAGE',
    'CITY',
    'GREAT_CITY',
    'METROPOLIS',
    'IMPERIAL_METROPOLIS'
]);
function cityLevelForPopulation(population) {
    const thresholds = [
        2,
        4,
        6,
        8,
        11,
        14,
        18
    ];
    let index = 0;
    for(let step = 0; step < thresholds.length; step++)if (population >= thresholds[step]) index = step;
    return CityLevelSchema.options[index];
}
const AlphaDistrictSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'AGRARIAN',
    'COMMERCIAL',
    'ACADEMIC',
    'ADMINISTRATIVE',
    'MILITARY',
    'INDUSTRIAL',
    'CULTURAL',
    'MARITIME'
]);
const AlphaBuildingSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'GRANARY',
    'MILL',
    'IRRIGATION',
    'WAREHOUSE',
    'MARKET',
    'TREASURY',
    'BANK',
    'SCRIBES_HOUSE',
    'LIBRARY',
    'ACADEMY',
    'OBSERVATORY',
    'LABORATORY',
    'ARCHIVE',
    'COURT',
    'CHANCELLERY',
    'BARRACKS',
    'ARSENAL',
    'TRAINING_GROUND',
    'WORKSHOP',
    'FOUNDRY',
    'CIVIC_SQUARE',
    'THEATER',
    'CULTURAL_CENTER',
    'SANCTUARY',
    'TEMPLE',
    'TRADITION_HOUSE',
    'PORT',
    'SHIPYARD',
    'LIGHTHOUSE'
]);
const FortificationLevelSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'NONE',
    'PALISADE',
    'STONE_WALL',
    'FORTRESS',
    'BASTION',
    'CITADEL'
]);
const FORTIFICATION_UPGRADES = [
    'PALISADE',
    'STONE_WALL',
    'FORTRESS',
    'BASTION',
    'CITADEL'
];
const FortificationUpgradeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum(FORTIFICATION_UPGRADES);
_c2 = FortificationUpgradeSchema;
const FortificationStateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'INTACT',
    'DAMAGED',
    'BREACHED'
]);
const CulturalPresenceLevelSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'CONTACT',
    'ROOTED',
    'PREDOMINANT'
]);
const CulturalPresenceSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    civilizationId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    level: CulturalPresenceLevelSchema
});
const AlphaCitySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
    originalOwnerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    currentOwnerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    nativeIdentity: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'OWNED',
        'OCCUPIED'
    ]),
    integration: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].max(100),
    mood: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].max(6),
    level: CityLevelSchema,
    capital: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    districts: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(AlphaDistrictSchema),
    buildings: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(AlphaBuildingSchema),
    fortification: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        level: FortificationLevelSchema,
        state: FortificationStateSchema
    }),
    foreignPresence: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(CulturalPresenceSchema).max(3),
    localCohesion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].max(100),
    culturalAnchor: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"].nullable(),
    urbanActionsUsed: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    /** Round in which the population was last redistributed: once per city per round, during Planning (canon §6). */ allocationRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].default(0),
    /** Frota Abordagem (V5.1b): the port stays blockaded through this round. */ portBlockedUntil: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].default(0),
    portBlockedBy: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"].nullable().default(null)
});
const MapPresetSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'CONTINENTAL',
    'ARCHIPELAGO',
    'INLAND_SEA',
    'MIXED'
]);
const GovernmentCatalogSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'MONARCHY',
    'REPUBLIC',
    'OLIGARCHY',
    'THEOCRACY',
    'CONFEDERATION',
    'MERITOCRACY',
    'AUTOCRACY'
]);
const TradeOfferTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'TRADE_INSTANT',
    'GIFT',
    'FUTURE_PROMISE',
    'LOAN'
]);
const TradeOfferSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    type: TradeOfferTypeSchema,
    proposerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    recipientId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    offer: AlphaResourcePoolSchema,
    request: AlphaResourcePoolSchema,
    treatyTerms: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]).max(4),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'PROPOSED',
        'ACCEPTED',
        'DECLINED',
        'SETTLED',
        'DEFAULTED'
    ]),
    createdRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    dueRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"].nullable()
});
const BattlePostureSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'ASSAULT',
    'HOLD',
    'MANEUVER'
]);
const TacticalFaceSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'EMPTY',
    'IMPACT',
    'GUARD',
    'MANEUVER',
    'COMMAND'
]);
const BattleModifierSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    source: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(120),
    amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(-100).max(100)
});
/**
 * Tactical combat configuration: every threshold and modifier in one place (ALPHA). Each unit that fights rolls one die whose
 * faces are listed here. Postures are circular (each beats one and loses to one) and each empowers one face.
 */ const PostureRuleSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    beats: BattlePostureSchema,
    empowers: TacticalFaceSchema
});
const CombatConfigSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    /** V5.1b marker: one tactical shock. |Δ| < mediumMargin is a tactical tie, |Δ| >= largeMargin is decisive. */ shock: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(true).default(true),
    mediumMargin: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    largeMargin: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    unsuppliedPenalty: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    hillDefense: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    mountainDefense: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    postureAdvantage: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    dieFaces: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(TacticalFaceSchema).length(6),
    impactValue: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    empoweredBonus: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    maneuverValue: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    posture: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ASSAULT: PostureRuleSchema,
        HOLD: PostureRuleSchema,
        MANEUVER: PostureRuleSchema
    }),
    guardCancels: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    holdGuardCancels: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    command: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        cavalryFlank: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        cavalryFlankTerrains: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'UNKNOWN',
            'PLAINS',
            'FOREST',
            'HILLS',
            'MOUNTAINS',
            'COAST',
            'SEA'
        ])),
        cityGuardProtection: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        navalTerrains: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'UNKNOWN',
            'PLAINS',
            'FOREST',
            'HILLS',
            'MOUNTAINS',
            'COAST',
            'SEA'
        ])),
        navalBonus: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        siegeBreachSteps: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        rangedConversions: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
    }),
    /** Family signatures (V5.1b §11) by Grau; one entry per Grau I, II, III. */ signatures: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        muroCity: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
        ]),
        muroRough: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
        ]),
        salva: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
        ]),
        flank: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
        ]),
        flankHills: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
        ]),
        breachSteps: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
        ]),
        siegeVsFortified: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        linhaCancels: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
        ]),
        linhaAttacks: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
        ])
    }).default({
        muroCity: [
            1,
            1,
            2
        ],
        muroRough: [
            0,
            1,
            1
        ],
        salva: [
            1,
            2,
            2
        ],
        flank: [
            1,
            1,
            2
        ],
        flankHills: [
            false,
            false,
            true
        ],
        breachSteps: [
            1,
            2,
            2
        ],
        siegeVsFortified: 2,
        linhaCancels: [
            1,
            2,
            2
        ],
        linhaAttacks: [
            false,
            false,
            true
        ]
    }),
    gradeNames: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('I'),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('II'),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('III')
    ]).default([
        'I',
        'II',
        'III'
    ]),
    fortification: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        levelBonus: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
            NONE: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            PALISADE: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            STONE_WALL: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            FORTRESS: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            BASTION: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            CITADEL: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
        }),
        damagedPercent: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(0).max(100),
        fortifiedDefenderBonus: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    })
});
function alphaCombatConfig() {
    return CombatConfigSchema.parse({
        mediumMargin: 2,
        largeMargin: 5,
        unsuppliedPenalty: 2,
        hillDefense: 1,
        mountainDefense: 2,
        postureAdvantage: 1,
        dieFaces: [
            'EMPTY',
            'IMPACT',
            'IMPACT',
            'GUARD',
            'MANEUVER',
            'COMMAND'
        ],
        impactValue: 1,
        empoweredBonus: 1,
        maneuverValue: 1,
        posture: {
            ASSAULT: {
                beats: 'MANEUVER',
                empowers: 'IMPACT'
            },
            HOLD: {
                beats: 'ASSAULT',
                empowers: 'GUARD'
            },
            MANEUVER: {
                beats: 'HOLD',
                empowers: 'MANEUVER'
            }
        },
        guardCancels: 1,
        holdGuardCancels: 2,
        command: {
            cavalryFlank: 1,
            cavalryFlankTerrains: [
                'PLAINS'
            ],
            cityGuardProtection: 0,
            navalTerrains: [
                'COAST',
                'SEA'
            ],
            navalBonus: 0,
            siegeBreachSteps: 1,
            rangedConversions: 1
        },
        fortification: {
            levelBonus: {
                NONE: 0,
                PALISADE: 1,
                STONE_WALL: 2,
                FORTRESS: 3,
                BASTION: 4,
                CITADEL: 5
            },
            damagedPercent: 50,
            fortifiedDefenderBonus: 0
        }
    });
}
const IndependentTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'VILLAGE',
    'TOWN',
    'CITY_STATE'
]);
const IndependentAttitudeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'FRIENDLY',
    'NEUTRAL',
    'WARY',
    'HOSTILE'
]);
const IndependentActionSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'TRADE',
    'NEGOTIATE',
    'INFLUENCE',
    'PROTECT',
    'INTEGRATE',
    'CONQUER'
]);
const IndependentPeopleSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"],
    type: IndependentTypeSchema,
    attitude: IndependentAttitudeSchema,
    influenceByPlayer: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"], __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]),
    protectorId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"].nullable(),
    integratedBy: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"].nullable()
});
const RaidBandSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"],
    strength: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    lastMovedRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
});
const WorldPulseTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'POSITIVE',
    'NEGATIVE',
    'MIXED'
]);
const WorldPulseModuleSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    text: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(240),
    resource: AlphaResourceTypeSchema.nullable(),
    amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(-10).max(10)
});
const PulseThreatCommandSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    command: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'SPAWN',
        'REINFORCE',
        'ACTIVATE'
    ]),
    kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'LAND',
        'PIRATE'
    ]).optional()
});
const WorldPulseCardSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(120),
    type: WorldPulseTypeSchema,
    modules: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(WorldPulseModuleSchema).min(1).max(3),
    /** A civilization that has researched one of these advances ignores the resource loss ("mitigado por"). */ mitigatedBy: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]).default([]),
    command: PulseThreatCommandSchema.nullable().default(null)
});
const pulse = (id, name, type, resource, amount, extra = {})=>({
        id,
        name,
        type,
        modules: [
            {
                id: `${id}-global`,
                text: `${name}: efeito global Alpha.`,
                resource,
                amount
            }
        ],
        mitigatedBy: extra.mitigatedBy ?? [],
        command: extra.command ?? null
    });
const WORLD_PULSE_CARDS = [
    pulse('wp-abundant-harvest', 'Colheita abundante', 'POSITIVE', 'FOOD', 2),
    pulse('wp-open-roads', 'Estradas abertas', 'POSITIVE', 'WEALTH', 2),
    pulse('wp-scholars', 'Círculo de sábios', 'POSITIVE', 'KNOWLEDGE', 2),
    pulse('wp-festival', 'Festival dos povos', 'POSITIVE', 'INFLUENCE', 2),
    pulse('wp-timber', 'Bosques férteis', 'POSITIVE', 'WOOD', 2),
    pulse('wp-quarry', 'Nova pedreira', 'POSITIVE', 'STONE', 2),
    pulse('wp-vein', 'Veio metálico', 'POSITIVE', 'METAL', 1),
    pulse('wp-calm-seas', 'Mares tranquilos', 'POSITIVE', 'WEALTH', 1),
    pulse('wp-drought', 'Seca prolongada', 'NEGATIVE', 'FOOD', -2, {
        mitigatedBy: [
            'web-irrigation'
        ]
    }),
    pulse('wp-fire', 'Incêndios florestais', 'NEGATIVE', 'WOOD', -2),
    pulse('wp-collapse', 'Desabamento de minas', 'NEGATIVE', 'STONE', -2),
    pulse('wp-rust', 'Escassez de metal', 'NEGATIVE', 'METAL', -1),
    pulse('wp-panic', 'Pânico mercantil', 'NEGATIVE', 'WEALTH', -2),
    pulse('wp-dogma', 'Reação ao saber', 'NEGATIVE', 'KNOWLEDGE', -1),
    pulse('wp-scandal', 'Crise diplomática', 'NEGATIVE', 'INFLUENCE', -1),
    pulse('wp-raiders', 'Bandos em marcha', 'NEGATIVE', null, 0, {
        command: {
            command: 'ACTIVATE'
        }
    }),
    pulse('wp-migration', 'Migrações', 'MIXED', 'FOOD', -1),
    pulse('wp-caravans', 'Caravanas errantes', 'MIXED', 'WEALTH', 1),
    pulse('wp-debate', 'Grande debate', 'MIXED', 'KNOWLEDGE', 1),
    pulse('wp-pilgrimage', 'Peregrinação', 'MIXED', 'INFLUENCE', 1),
    pulse('wp-flood', 'Cheias dos rios', 'MIXED', 'FOOD', 1),
    pulse('wp-refugees', 'Refugiados da fronteira', 'MIXED', null, 0),
    pulse('wp-storm', 'Tempestades costeiras', 'MIXED', 'WOOD', -1),
    pulse('wp-discovery', 'Descoberta inesperada', 'MIXED', 'METAL', 1),
    // The six conditional Pulses of canon §18, each with its "mitigado por".
    pulse('wp-regional-drought', 'Seca Regional', 'NEGATIVE', 'FOOD', -2, {
        mitigatedBy: [
            'web-irrigation'
        ]
    }),
    pulse('wp-bountiful-harvest', 'Colheita Farta', 'POSITIVE', 'FOOD', 3),
    pulse('wp-epidemic', 'Epidemia', 'NEGATIVE', 'FOOD', -1, {
        mitigatedBy: [
            'web-sanitation'
        ]
    }),
    pulse('wp-migration-wave', 'Migração', 'MIXED', 'FOOD', 1, {
        command: {
            command: 'SPAWN',
            kind: 'LAND'
        },
        mitigatedBy: [
            'web-guard-formations'
        ]
    }),
    pulse('wp-unstable-routes', 'Rotas Instáveis', 'NEGATIVE', 'WEALTH', -1, {
        command: {
            command: 'SPAWN',
            kind: 'PIRATE'
        },
        mitigatedBy: [
            'web-coastal-routes'
        ]
    }),
    pulse('wp-shared-discovery', 'Descoberta Partilhada', 'POSITIVE', 'KNOWLEDGE', 2)
];
const AlphaBalanceSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    label: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('ALPHA'),
    cityActions: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    wealthConversionRate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(2),
    wealthMaterialCostPercentMax: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(50),
    /** Storage limits per civilization (canon §3, §9): base per resource, the hard cap infrastructure can never exceed, and the bonus a Metrópole (N6+) adds to every limit. */ limits: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        base: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(AlphaResourceTypeSchema, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]),
        hardCap: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(AlphaResourceTypeSchema, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]),
        metropolisBonus: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    /** Limit raised by each infrastructure (one of each counts per civilization), by resource. */ storagePerBuilding: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(AlphaBuildingSchema, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        resource: AlphaResourceTypeSchema,
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
    }).nullable()),
    overflowRule: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('DISCARD_AFTER_ACTION'),
    publicInvestmentCost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    moodEffects: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        productionPercent: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(-100).max(100),
        stabilityDelta: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(-10).max(10)
    })).length(7),
    stack: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        military: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        militaryCommandOne: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        militaryCommandTwo: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        civilians: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        cityBase: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        cityMax: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        fleets: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        fleetsUpgraded: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        /** Advancements that raise a limit. Ids are checked against the advancement catalogue by tests. */ upgrades: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
            commandOne: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
            commandTwo: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
            naval: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
            doctrine: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1)
        }),
        /** City garrison: base plus these bonuses, never above cityMax. */ cityBonus: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
            militaryDistrict: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            doctrine: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            fortification: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(FortificationLevelSchema, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"])
        })
    }),
    cultureSlots: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(3),
    cultureDice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(2),
    integrationPerAction: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    /** Metal produced by each PRODUCE action for every worked hex that has both a metal deposit and a Mine. */ metalPerMine: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    /** Base of the Capacidade Administrativa (canon §4: 2; §26 lists it for playtest). Everything else is capital, districts, Chancelaria, government and Web. */ administrationBase: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    /** CIVIC_ACTION in an owned city: influence gained and local cohesion added. */ civicInfluence: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    civicCohesion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    /** PROMOTE_MOOD (public investment) raises mood by one and can never carry a city above this mood on its own. */ promoteMoodCeiling: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(6),
    /** Maximum hex distance from a starting city within which a metal deposit must exist on generated maps. */ metalAccessDistance: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    /** Fortification upgrades a BUILD action can add, in order. Advanced levels demand metal. */ fortification: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(FortificationUpgradeSchema, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        cost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
        metal: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        era: AlphaEraSchema,
        militaryDistrict: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
    }))
});
function alphaBalance() {
    const storage = Object.fromEntries(AlphaBuildingSchema.options.map((building)=>[
            building,
            null
        ]));
    storage.GRANARY = {
        resource: 'FOOD',
        amount: 5
    };
    storage.WAREHOUSE = {
        resource: 'WOOD',
        amount: 5
    }; // the Armazém also raises Pedra: see alphaStorageCapacity
    storage.TREASURY = {
        resource: 'WEALTH',
        amount: 5
    };
    storage.BANK = {
        resource: 'WEALTH',
        amount: 5
    };
    storage.FOUNDRY = {
        resource: 'METAL',
        amount: 5
    };
    storage.ARCHIVE = {
        resource: 'KNOWLEDGE',
        amount: 5
    };
    storage.ACADEMY = {
        resource: 'KNOWLEDGE',
        amount: 5
    };
    storage.CHANCELLERY = {
        resource: 'INFLUENCE',
        amount: 5
    };
    storage.THEATER = {
        resource: 'CULTURE',
        amount: 5
    };
    return AlphaBalanceSchema.parse({
        label: 'ALPHA',
        cityActions: 2,
        wealthConversionRate: 2,
        wealthMaterialCostPercentMax: 50,
        limits: {
            base: {
                FOOD: 15,
                WOOD: 15,
                STONE: 15,
                WEALTH: 15,
                METAL: 10,
                KNOWLEDGE: 10,
                INFLUENCE: 10,
                CULTURE: 10
            },
            hardCap: {
                FOOD: 30,
                WOOD: 30,
                STONE: 30,
                WEALTH: 30,
                METAL: 20,
                KNOWLEDGE: 20,
                INFLUENCE: 20,
                CULTURE: 20
            },
            metropolisBonus: 3
        },
        storagePerBuilding: storage,
        overflowRule: 'DISCARD_AFTER_ACTION',
        publicInvestmentCost: 2,
        moodEffects: [
            {
                productionPercent: -100,
                stabilityDelta: -2
            },
            {
                productionPercent: -50,
                stabilityDelta: -1
            },
            {
                productionPercent: -25,
                stabilityDelta: -1
            },
            {
                productionPercent: 0,
                stabilityDelta: 0
            },
            {
                productionPercent: 10,
                stabilityDelta: 0
            },
            {
                productionPercent: 20,
                stabilityDelta: 1
            },
            {
                productionPercent: 30,
                stabilityDelta: 1
            }
        ],
        stack: {
            military: 6,
            militaryCommandOne: 7,
            militaryCommandTwo: 8,
            civilians: 2,
            cityBase: 6,
            cityMax: 10,
            fleets: 4,
            fleetsUpgraded: 5,
            upgrades: {
                commandOne: 'web-maneuver-training',
                commandTwo: 'web-war-of-movement',
                naval: 'web-naval-architecture',
                doctrine: 'web-deep-defense'
            },
            cityBonus: {
                militaryDistrict: 1,
                doctrine: 1,
                fortification: {
                    NONE: 0,
                    PALISADE: 1,
                    STONE_WALL: 1,
                    FORTRESS: 2,
                    BASTION: 2,
                    CITADEL: 3
                }
            }
        },
        cultureSlots: 3,
        cultureDice: 2,
        integrationPerAction: 25,
        metalPerMine: 1,
        administrationBase: 2,
        civicInfluence: 1,
        civicCohesion: 10,
        promoteMoodCeiling: 6,
        metalAccessDistance: 6,
        fortification: {
            PALISADE: {
                cost: {
                    food: 0,
                    materials: 2,
                    wealth: 0,
                    knowledge: 0,
                    influence: 0
                },
                metal: 0,
                era: 'FOUNDATION',
                militaryDistrict: false
            },
            STONE_WALL: {
                cost: {
                    food: 0,
                    materials: 4,
                    wealth: 0,
                    knowledge: 0,
                    influence: 0
                },
                metal: 0,
                era: 'EXPANSION',
                militaryDistrict: false
            },
            FORTRESS: {
                cost: {
                    food: 0,
                    materials: 5,
                    wealth: 1,
                    knowledge: 0,
                    influence: 0
                },
                metal: 1,
                era: 'CIVILIZATION',
                militaryDistrict: true
            },
            BASTION: {
                cost: {
                    food: 0,
                    materials: 6,
                    wealth: 2,
                    knowledge: 0,
                    influence: 0
                },
                metal: 2,
                era: 'EMPIRES',
                militaryDistrict: true
            },
            CITADEL: {
                cost: {
                    food: 0,
                    materials: 8,
                    wealth: 3,
                    knowledge: 0,
                    influence: 0
                },
                metal: 3,
                era: 'ASCENSION',
                militaryDistrict: true
            }
        }
    });
}
const AlphaEraMilestoneSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    cities: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    population: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    territory: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    districts: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    research: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    development: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    contacts: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    government: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    requiredCriteria: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"].max(8)
});
const ALPHA_ERA_MILESTONE_CRITERIA = [
    'cities',
    'population',
    'territory',
    'districts',
    'research',
    'development',
    'government',
    'contacts'
];
const ALPHA_ERA_MILESTONES = [
    {
        cities: 1,
        population: 3,
        territory: 3,
        districts: 1,
        research: 2,
        development: 1,
        contacts: 0,
        government: false,
        requiredCriteria: 4
    },
    {
        cities: 2,
        population: 5,
        territory: 5,
        districts: 2,
        research: 4,
        development: 2,
        contacts: 0,
        government: true,
        requiredCriteria: 4
    },
    {
        cities: 2,
        population: 7,
        territory: 7,
        districts: 3,
        research: 6,
        development: 2,
        contacts: 1,
        government: true,
        requiredCriteria: 5
    },
    {
        cities: 3,
        population: 9,
        territory: 9,
        districts: 4,
        research: 8,
        development: 3,
        contacts: 1,
        government: true,
        requiredCriteria: 5
    },
    {
        cities: 3,
        population: 10,
        territory: 11,
        districts: 5,
        research: 10,
        development: 3,
        contacts: 2,
        government: true,
        requiredCriteria: 5
    }
];
const RoundTelemetrySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    round: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    era: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    /** Orders committed this round by type, and how many were repeats of a type already used (sum of count - 1). */ orders: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]),
    repeatedOrders: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    /** Resources this round in the five ledger pools: produced (production + mining + trade + institutions + other), spent, lost, discarded over the cap. */ produced: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]),
    spent: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]),
    lost: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]),
    discarded: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]),
    /** Closing stock in the eight resources and how many sit at their limit. */ stock: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]),
    atCap: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    population: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    cities: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    cityLevels: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].max(7)),
    moods: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].max(6)),
    governed: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    researched: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    heritages: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    resonanceSlots: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    resonanceCycles: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    pulse: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable(),
    combats: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]),
    casualties: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    victories: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    threatsAlive: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]),
    prestige: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    hegemonyPaths: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"])
});
const AlphaTelemetrySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    version: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    preset: MapPresetSchema,
    seed: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    players: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    rounds: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    durationMs: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    actionsByType: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]),
    productionByResource: AlphaResourcePoolSchema,
    tradeOffers: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    acceptedTrades: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    unitRecruitment: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]),
    battles: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    battleResults: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]),
    casualties: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    citiesFounded: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    citiesCaptured: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    cityIntegration: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    moodSamples: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].max(6)),
    researchByDomain: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]),
    worldPulseEvents: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    eventMitigations: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    culturalContests: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    culturalContestResults: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]),
    prestigeBySource: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]),
    hegemonyDeclarations: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    hegemonyInterruptions: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    winner: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"].nullable(),
    victoryReason: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'HEGEMONY',
        'ROUND_LIMIT'
    ]).nullable(),
    /** Ressonância (V5.1b): completed cycles and how many of each composition kind. */ resonanceCycles: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].default(0),
    resonanceByKind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]).default({}),
    /** World threats (V5.1b): spawned, attacks they made, camps destroyed while camped, and threats wiped out. */ threatsSpawned: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].default(0),
    threatAttacks: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].default(0),
    threatKills: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].default(0),
    threatLosses: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].default(0),
    /** Per-round, per-civilization log, bounded to the last 260 entries (6 players × 35 rounds plus slack). */ roundLog: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(RoundTelemetrySchema).max(260).default([]),
    /** Orders each civilization committed when planning closed this round; consumed by the round log. */ pendingOrders: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"])).default({})
});
const FeedbackSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    matchId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    round: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    version: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    text: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1).max(4000),
    createdAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().nonnegative()
});
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "LegacyAlphaEraSchema$z.preprocess");
__turbopack_context__.k.register(_c1, "LegacyAlphaEraSchema");
__turbopack_context__.k.register(_c2, "FortificationUpgradeSchema");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/alpha-core10.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CORE10",
    ()=>CORE10,
    "CORE10_CHASSIS",
    ()=>CORE10_CHASSIS,
    "FIGURES",
    ()=>FIGURES,
    "FIGURE_CLASS_LABELS",
    ()=>FIGURE_CLASS_LABELS,
    "civilizationDisplayName",
    ()=>civilizationDisplayName,
    "core10OfChassis",
    ()=>core10OfChassis,
    "figureById",
    ()=>figureById,
    "isCore10Chassis",
    ()=>isCore10Chassis,
    "recommendedFigure",
    ()=>recommendedFigure
]);
const FIGURE_CLASS_LABELS = {
    HISTORICAL: 'Histórico',
    SEMI_LEGENDARY: 'Semi-lendário',
    LEGENDARY: 'Lendário',
    MYTHOLOGICAL: 'Figura de mito',
    TRADITIONAL: 'Segundo a tradição'
};
const CORE10 = [
    {
        "id": "hellenes",
        "chassis": "valgard",
        "name": "Helênicos",
        "adjective": "Helênico",
        "scope": "Mundo helênico: tradição micênica, Grécia clássica e helenismo",
        "period": "c. 1200 – 30 a.C. (Odisseu é tradição da Idade do Bronze)",
        "architecture": [
            "- N1–N2: cabanas de pedra e barro, lareira central",
            "N3–N4: casas de pátio, ágora, estoa de colunas, telhado baixo de terracota",
            "N5: acrópole com templo e muralha de blocos",
            "N6–N7: peristilos, teatro, acrópole monumental"
        ],
        "port": "Mole de pedra clara com trirreme",
        "fortification": "Muralha poligonal com torres redondas e portão",
        "materials": "Mármore, calcário, terracota, bronze",
        "pattern": "Friso de meandro",
        "palette": [
            "#e4ddc8",
            "#b9825e",
            "#7f8a8f",
            "#b8914d"
        ],
        "banner": {
            "name": "Aspis",
            "text": "Escudo redondo de bronze com cercadura de meandro",
            "enum": "SHIELD"
        },
        "emblem": {
            "name": "Aspis de bronze",
            "text": "Escudo redondo com anel de meandro"
        },
        "cityLook": "Acrópole, estoa e muralha de blocos claros",
        "patrons": "Zeus, Atena, Poseidon",
        "reserves": "Agamenon (L); Perseu (L); Héracles (M); Aquiles (L); Péricles (H); Artemísia I (H); Temístocles (H); Arquimedes (H)",
        "figures": [
            {
                "id": "leader-odisseu",
                "name": "Odisseu",
                "recommended": false,
                "cls": "LEGENDARY",
                "archetype": "Explorador-Estrategista",
                "passive": {
                    "name": "Naus de Ítaca",
                    "text": "Limite de Madeira +6",
                    "effect": {
                        "kind": "STORAGE",
                        "resource": "wood",
                        "amount": 6
                    }
                },
                "power": {
                    "name": "Rota do Retorno",
                    "text": "+1 movimento da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "MOVEMENT",
                        "amount": 1
                    }
                },
                "style": "Mobilidade, exploração, retirada, navegação",
                "source": "Odisseia e Ilíada: tradição oral fixada por escrito entre os séc. VIII e VII a.C.",
                "portrait": "Perfil, barba curta, pilos (gorro cônico), remo na mão, mar à noite; luz de estrelas e lamparina; ~45 anos."
            },
            {
                "id": "leader-alexandre-magno",
                "name": "Alexandre Magno",
                "recommended": true,
                "cls": "HISTORICAL",
                "archetype": "Conquistador-Comandante",
                "passive": {
                    "name": "Cidades de Alexandre",
                    "text": "Ação cívica integra +10 em cidades ocupadas",
                    "effect": {
                        "kind": "INTEGRATION",
                        "amount": 10
                    }
                },
                "power": {
                    "name": "Campanha Relâmpago",
                    "text": "+1 ponto de comando da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "COMMAND",
                        "amount": 1
                    }
                },
                "style": "Ofensiva, comando, expansão",
                "source": "Arriano, Plutarco, Diodoro e Quinto Cúrcio (séc. I a.C. – II d.C.), a partir de testemunhas perdidas.",
                "portrait": "Três-quartos, cabelo em anástole (franja erguida), diadema, couraça; plano largo de campo de batalha; luz de aurora."
            },
            {
                "id": "leader-agamenon",
                "name": "Agamenon",
                "recommended": false,
                "cls": "LEGENDARY",
                "archetype": "Rei-Comandante",
                "passive": {
                    "name": "Ouro de Micenas",
                    "text": "Limite de Riqueza +6",
                    "effect": {
                        "kind": "STORAGE",
                        "resource": "wealth",
                        "amount": 6
                    }
                },
                "power": {
                    "name": "Assembleia dos Reis",
                    "text": "+1 ponto de comando da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "COMMAND",
                        "amount": 1
                    }
                },
                "style": "Coalizão, comando, Riqueza guardada",
                "source": "Ilíada (tradição oral fixada por escrito entre os séc. VIII e VII a.C.); ciclo épico.",
                "portrait": "Frontal-perfil, barba grisalha, diadema e cetro, portão de Micenas ao fundo; luz de tocha; ~50 anos."
            }
        ],
        "reserveFigures": [
            {
                "id": "leader-leonidas",
                "name": "Leônidas",
                "cls": "HISTORICAL",
                "archetype": "Comandante-Defensor",
                "style": "Defesa, território, resistência.",
                "source": "Heródoto (livro VII, c. 430 a.C.)."
            },
            {
                "id": "leader-heracles",
                "name": "Héracles",
                "cls": "MYTHOLOGICAL",
                "archetype": "Herói-Campeão",
                "style": "Força e resistência.",
                "source": "Ciclo heróico: Hesíodo, Apolodoro, Píndaro; culto em toda a Grécia."
            },
            {
                "id": "leader-artemisia-i",
                "name": "Artemísia I",
                "cls": "HISTORICAL",
                "archetype": "Comandante Naval",
                "style": "Frota, manobra, coesão.",
                "source": "Heródoto (livros VII e VIII), Polieno."
            }
        ]
    },
    {
        "id": "egyptians",
        "chassis": "nymara",
        "name": "Egípcios",
        "adjective": "Egípcio",
        "scope": "Egito faraônico: do Reino Antigo ao Novo",
        "period": "c. 2700 – 1070 a.C.",
        "architecture": [
            "- N1–N2: casas de tijolo cru e telhado plano, cerca de junco",
            "N3–N4: pátios, capela, colunata papiriforme",
            "N5: pilone com obelisco, templo de arenito",
            "N6–N7: complexo de pilones, avenida de esfinges, pirâmide"
        ],
        "port": "Cais de pedra com cabeços em obelisco e barco de papiro",
        "fortification": "Muralha de tijolo cru com ameias e portão de pilone",
        "materials": "Calcário, arenito, tijolo cru, ouro, azul-egípcio",
        "pattern": "Friso de papiro e lótus",
        "palette": [
            "#e0d5b8",
            "#3f8f9a",
            "#c9a54e",
            "#7a4a3a"
        ],
        "banner": {
            "name": "Insígnia de Nomo",
            "text": "Haste com disco e flâmula, à maneira dos padrões de divisão do exército",
            "enum": "POLE"
        },
        "emblem": {
            "name": "Sema-tauy",
            "text": "Lótus e papiro atados: união das Duas Terras"
        },
        "cityLook": "Pilone, obelisco, colunata papiriforme e tijolo cru",
        "patrons": "Ptah, Tot, Ísis (estudo separado)",
        "reserves": "Tutemés III (H); Akhenaton (H); Cleópatra VII (H); Khufu (H); Amenhotep III (H)",
        "figures": [
            {
                "id": "leader-ramses-ii",
                "name": "Ramsés II",
                "recommended": true,
                "cls": "HISTORICAL",
                "archetype": "Governante-Comandante",
                "passive": {
                    "name": "Estradas de Canaã",
                    "text": "Suprimento +1 hex",
                    "effect": {
                        "kind": "SUPPLY",
                        "amount": 1
                    }
                },
                "power": {
                    "name": "Carros de Kadesh",
                    "text": "+2 Força nos conflitos da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "STRENGTH",
                        "amount": 2
                    }
                },
                "style": "Governo e comando: obra e campanha",
                "source": "Inscrições (Poema e Boletim de Kadesh), templos (Abu Simbel, Ramesseu), tratado egípcio-hitita.",
                "portrait": "Frontal, coroa azul (khepresh) com uraeus, colar largo; pilone de Abu Simbel; luz dourada; ~40 anos."
            },
            {
                "id": "leader-hatshepsut",
                "name": "Hatshepsut",
                "recommended": false,
                "cls": "HISTORICAL",
                "archetype": "Governante-Construtora",
                "passive": {
                    "name": "Mirra de Punt",
                    "text": "Limite de Riqueza +6",
                    "effect": {
                        "kind": "STORAGE",
                        "resource": "wealth",
                        "amount": 6
                    }
                },
                "power": {
                    "name": "Festa do Vale",
                    "text": "+1 Ânimo em todas as cidades",
                    "effect": {
                        "kind": "MOOD_ALL",
                        "amount": 1
                    }
                },
                "style": "Obra pública e comércio",
                "source": "Templo de Deir el-Bahari, inscrições da expedição a Punt, estátuas.",
                "portrait": "Perfil, nemes listrado, barba postiça, colar; terraços de Deir el-Bahari; luz suave de tarde; ~35 anos."
            },
            {
                "id": "leader-imhotep",
                "name": "Imhotep",
                "recommended": false,
                "cls": "HISTORICAL",
                "archetype": "Sábio-Arquiteto",
                "passive": {
                    "name": "Pedra Lavrada",
                    "text": "Limite de Pedra +6",
                    "effect": {
                        "kind": "STORAGE",
                        "resource": "stone",
                        "amount": 6
                    }
                },
                "power": {
                    "name": "Ordem da Obra",
                    "text": "+15 coesão local em todas as cidades",
                    "effect": {
                        "kind": "COHESION_ALL",
                        "amount": 15
                    }
                },
                "style": "Obra monumental e ordem",
                "source": "Base de estátua de Djoser (Saqqara) com títulos; pirâmide escalonada.",
                "portrait": "Três-quartos, cabeça raspada, cabelo curto, rolo de papiro e régua; pirâmide em degraus; luz de lâmpada; ~50 anos."
            }
        ]
    },
    {
        "id": "mesopotamians",
        "chassis": "meridia",
        "name": "Mesopotâmicos",
        "adjective": "Mesopotâmico",
        "scope": "Mesopotâmia da Idade do Bronze: Suméria, Acádia e Babilônia antiga",
        "period": "c. 2700 – 1600 a.C.",
        "architecture": [
            "- N1–N2: casas de tijolo cru e telhado plano, cerca de junco",
            "N3–N4: pátios internos, templo sobre plataforma, canais",
            "N5: zigurate baixo e muralha de tijolo com contrafortes",
            "N6–N7: zigurate monumental, portal de tijolo vidrado azul"
        ],
        "port": "Cais de tijolo com canais e barcas redondas de junco",
        "fortification": "Muralha maciça de tijolo com contrafortes e ameias",
        "materials": "Tijolo de barro, betume, cerâmica vidrada azul, cobre",
        "pattern": "Friso de tijolo em relevo e cunhas",
        "palette": [
            "#b98f62",
            "#8a6a4a",
            "#2f6f8f",
            "#c9a54e"
        ],
        "banner": {
            "name": "Estandarte de Ur",
            "text": "Painel retangular com faixas de mosaico, sobre haste",
            "enum": "PANEL"
        },
        "emblem": {
            "name": "Estrela de oito pontas",
            "text": "Rosácea de oito pontas sobre cunha"
        },
        "cityLook": "Zigurate, tijolo cru e muralha com contrafortes",
        "patrons": "Enki, Inanna, Shamash",
        "reserves": "Enheduanna (H); Nabucodonosor II (H); Assurbanípal (H); Gudea (H); Semíramis / Shammuramat (S)",
        "figures": [
            {
                "id": "leader-hamurabi",
                "name": "Hamurabi",
                "recommended": true,
                "cls": "HISTORICAL",
                "archetype": "Governante-Legislador",
                "passive": {
                    "name": "Casas de câmbio",
                    "text": "Limite de Riqueza +6",
                    "effect": {
                        "kind": "STORAGE",
                        "resource": "wealth",
                        "amount": 6
                    }
                },
                "power": {
                    "name": "Rede de Correspondentes",
                    "text": "+1 ponto de comando da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "COMMAND",
                        "amount": 1
                    }
                },
                "style": "Leis, contratos e Riqueza",
                "source": "Estela de diorito (Louvre, c. 1754 a.C.), cartas reais.",
                "portrait": "Perfil, barba longa em cachos, gorro redondo com aba, estela ao fundo; luz de lamparina; ~50 anos."
            },
            {
                "id": "leader-sargao-de-akkad",
                "name": "Sargão de Akkad",
                "recommended": false,
                "cls": "HISTORICAL",
                "archetype": "Conquistador-Fundador",
                "passive": {
                    "name": "Estradas do Império",
                    "text": "Suprimento +1 hex",
                    "effect": {
                        "kind": "SUPPLY",
                        "amount": 1
                    }
                },
                "power": {
                    "name": "Marcha de Akkad",
                    "text": "+1 movimento da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "MOVEMENT",
                        "amount": 1
                    }
                },
                "style": "Expansão e rotas",
                "source": "Inscrições reais, crônicas posteriores, Lenda de Sargão (cópias neoassírias).",
                "portrait": "Três-quartos, barba trançada e coque, estandarte de lança; poeira dourada; ~45 anos."
            },
            {
                "id": "leader-gilgamesh",
                "name": "Gilgamesh",
                "recommended": false,
                "cls": "SEMI_LEGENDARY",
                "archetype": "Herói-Rei",
                "passive": {
                    "name": "Muralhas de Uruk",
                    "text": "Limite de Pedra +6",
                    "effect": {
                        "kind": "STORAGE",
                        "resource": "stone",
                        "amount": 6
                    }
                },
                "power": {
                    "name": "Força do Touro",
                    "text": "+2 Força nos conflitos da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "STRENGTH",
                        "amount": 2
                    }
                },
                "style": "Muralha, força, resistência",
                "source": "Lista Real Suméria, poemas sumérios (c. 2100 a.C.), Epopeia de Gilgamesh (versão padrão).",
                "portrait": "Corpo de três-quartos, torso largo, cachos e barba, leão sob o braço; alvorada; ~35 anos."
            }
        ]
    },
    {
        "id": "persians",
        "chassis": "dravik",
        "name": "Persas",
        "adjective": "Persa",
        "scope": "Pérsia aquemênida",
        "period": "c. 550 – 330 a.C.",
        "architecture": [
            "- N1–N2: casas de tijolo cru, pátio, torre de vigia",
            "N3–N4: salão de colunas de madeira, jardim fechado (pairidaeza)",
            "N5: terraço palacial de pedra, portão com touros",
            "N6–N7: salas hipostilas de capitéis de touro, relevos de delegações"
        ],
        "port": "Mole de calcário cinza com galera",
        "fortification": "Muralha de tijolo e pedra com torres de portão",
        "materials": "Calcário cinza, tijolo vidrado azul, cedro, ouro",
        "pattern": "Friso de rosetas e procissão de povos",
        "palette": [
            "#b7ad98",
            "#2f5f8f",
            "#c9a54e",
            "#8a5a4a"
        ],
        "banner": {
            "name": "Águia Real",
            "text": "Águia dourada de asas abertas sobre escudo, em haste",
            "enum": "EAGLE"
        },
        "emblem": {
            "name": "Águia dourada",
            "text": "Águia de asas abertas sobre escudo"
        },
        "cityLook": "Terraço palacial, salas de colunas e portão de nações",
        "patrons": "Luz abstrata (sem Ahura Mazda)",
        "reserves": "Cambises II (H); Artaxerxes I (H); Ciro, o Jovem (H); Artemísia I (H, aliada persa)",
        "figures": [
            {
                "id": "leader-ciro-o-grande",
                "name": "Ciro, o Grande",
                "recommended": false,
                "cls": "HISTORICAL",
                "archetype": "Governante-Integrador",
                "passive": {
                    "name": "Povos do Império",
                    "text": "Ação cívica integra +10 em cidades ocupadas",
                    "effect": {
                        "kind": "INTEGRATION",
                        "amount": 10
                    }
                },
                "power": {
                    "name": "Selo de Ciro",
                    "text": "tratados ativos duram +2 rodadas",
                    "effect": {
                        "kind": "TREATY_EXTEND",
                        "rounds": 2
                    }
                },
                "style": "Integração e governo",
                "source": "Cilindro de Ciro (539 a.C.), Crônica de Nabonido, Heródoto, Xenofonte (a Ciropédia é romance moral).",
                "portrait": "Perfil, tiara e barba encaracolada, cilindro de argila nas mãos; Pasárgada; luz suave; ~55 anos."
            },
            {
                "id": "leader-dario-i",
                "name": "Dario I",
                "recommended": true,
                "cls": "HISTORICAL",
                "archetype": "Administrador-Construtor",
                "passive": {
                    "name": "Estrada Real",
                    "text": "Suprimento +1 hex",
                    "effect": {
                        "kind": "SUPPLY",
                        "amount": 1
                    }
                },
                "power": {
                    "name": "Satrapias",
                    "text": "+1 ponto de comando da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "COMMAND",
                        "amount": 1
                    }
                },
                "style": "Administração, estradas e economia",
                "source": "Inscrição de Behistun (c. 520 a.C.), tabuinhas de Persépolis, Estrada Real (Heródoto V), dáricos.",
                "portrait": "Frontal, cidaris alta, barba em camadas, mapa de rotas e moeda; Persépolis; luz de tarde; ~45 anos."
            },
            {
                "id": "leader-xerxes-i",
                "name": "Xerxes I",
                "recommended": false,
                "cls": "HISTORICAL",
                "archetype": "Comandante-Mobilizador",
                "passive": {
                    "name": "Magazines do Exército",
                    "text": "Limite de Alimento +6",
                    "effect": {
                        "kind": "STORAGE",
                        "resource": "food",
                        "amount": 6
                    }
                },
                "power": {
                    "name": "Exército das Nações",
                    "text": "+2 Força nos conflitos da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "STRENGTH",
                        "amount": 2
                    }
                },
                "style": "Mobilização e comando",
                "source": "Heródoto (hostil), inscrição dos Daivas, Ponte do Helesponto, canal do Atos.",
                "portrait": "Perfil, cidaris, barba trançada, guarda-sol real; ponte de barcos; luz de tempestade; ~35 anos."
            }
        ]
    },
    {
        "id": "israel",
        "chassis": "solenne",
        "name": "Israel e Judá",
        "adjective": "de Israel e Judá",
        "scope": "Israel antigo e Judá (Idade do Ferro)",
        "period": "c. 1200 – 586 a.C.",
        "architecture": [
            "- N1–N2: casas de quatro cômodos, cerca de pedra",
            "N3–N4: cidade murada em colina, portão de seis câmaras",
            "N5: muralha casamata, palácio de pedra lavrada, cisterna",
            "N6–N7: cidade-capital em colina, templo de cedro e pedra, palácio"
        ],
        "port": "Cais de pedra com barcos de madeira (porto fenício aliado)",
        "fortification": "Muralha casamata (parede dupla) com portão de câmaras",
        "materials": "Calcário de Jerusalém, cedro, bronze, tijolo cru, tendas",
        "pattern": "Romãs e palmeiras",
        "palette": [
            "#d8cba8",
            "#7a6a4a",
            "#a8603f",
            "#5f7f8a"
        ],
        "banner": {
            "name": "Degel",
            "text": "Estandarte tribal: pano retangular em haste, com o leão",
            "enum": "DEGEL"
        },
        "emblem": {
            "name": "Leão de Judá",
            "text": "Leão de pé (tradição); alternativa arqueológica: selo lmlk de escaravelho alado"
        },
        "cityLook": "Cidade murada em colina com portão de câmaras",
        "patrons": "Nenhum (Deus de Israel não é representado)",
        "reserves": "Salomão (T); Débora (T); Ezequias (H); Josias (H); Gideão (T); Samuel (T)",
        "figures": [
            {
                "id": "leader-davi",
                "name": "Davi",
                "recommended": true,
                "cls": "TRADITIONAL",
                "archetype": "Rei-Guerreiro",
                "passive": {
                    "name": "Tributo de Jerusalém",
                    "text": "Limite de Riqueza +6",
                    "effect": {
                        "kind": "STORAGE",
                        "resource": "wealth",
                        "amount": 6
                    }
                },
                "power": {
                    "name": "Campeões do Rei",
                    "text": "+1 ponto de comando da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "COMMAND",
                        "amount": 1
                    }
                },
                "style": "Governo, tributo e comando",
                "source": "Livros de Samuel, Reis, Crônicas e Salmos (autoria tradicional).",
                "portrait": "Três-quartos, cabelo cacheado, harpa (kinnor), muros de colina; luz de manhã; ~35 anos."
            },
            {
                "id": "leader-elias",
                "name": "Elias",
                "recommended": false,
                "cls": "TRADITIONAL",
                "archetype": "Profeta",
                "passive": {
                    "name": "Voz do Profeta",
                    "text": "Ação cívica integra +10 em cidades ocupadas",
                    "effect": {
                        "kind": "INTEGRATION",
                        "amount": 10
                    }
                },
                "power": {
                    "name": "Renovação do Povo",
                    "text": "+1 Ânimo em todas as cidades",
                    "effect": {
                        "kind": "MOOD_ALL",
                        "amount": 1
                    }
                },
                "style": "Coesão, influência e Ânimo em crise",
                "source": "1 Reis 17 – 2 Reis 2 (Reino do Norte, séc. IX a.C.).",
                "portrait": "Perfil magro, barba longa, manto de pelo e cinto de couro, cajado, vale seco; luz de fim de tarde; ~55 anos."
            },
            {
                "id": "leader-sansao",
                "name": "Sansão",
                "recommended": false,
                "cls": "TRADITIONAL",
                "archetype": "Herói-Campeão",
                "passive": {
                    "name": "Pilares do Templo",
                    "text": "Limite de Pedra +6",
                    "effect": {
                        "kind": "STORAGE",
                        "resource": "stone",
                        "amount": 6
                    }
                },
                "power": {
                    "name": "Força de Sansão",
                    "text": "+2 Força nos conflitos da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "STRENGTH",
                        "amount": 2
                    }
                },
                "style": "Força e resistência",
                "source": "Juízes 13–16 (era dos Juízes).",
                "portrait": "Perfil, sete tranças, barba curta, torso forte, pilares enormes; luz de fogueira; ~30 anos."
            }
        ]
    },
    {
        "id": "romans",
        "chassis": "kor",
        "name": "Romanos",
        "adjective": "Romano",
        "scope": "Roma: República tardia e Principado",
        "period": "c. 100 a.C. – 117 d.C.",
        "architecture": [
            "- N1–N2: casas de tijolo e telha, cerca de estacas (castrum)",
            "N3–N4: fórum, basílica, aqueduto, telha vermelha",
            "N5: termas, arco, muralha de tijolo e concreto",
            "N6–N7: anfiteatro, templos de mármore, avenidas"
        ],
        "port": "Mole de pedra com arcada e liburna",
        "fortification": "Muralha de tijolo e concreto com torres quadradas",
        "materials": "Tijolo, concreto, mármore, telha, bronze",
        "pattern": "Ovolo e louros",
        "palette": [
            "#bdb29a",
            "#a65f40",
            "#8f8a82",
            "#b8914d"
        ],
        "banner": {
            "name": "Vexillum",
            "text": "Pano retangular pendurado de um travessão, com franja",
            "enum": "VEXILLUM"
        },
        "emblem": {
            "name": "Aquila",
            "text": "Águia de legião com asas abertas"
        },
        "cityLook": "Fórum, aqueduto, termas e muralha de tijolo",
        "patrons": "Júpiter, Marte, Vesta",
        "reserves": "Cipião Africano (H); Marco Aurélio (H); Constantino (H); Agripina, a Jovem (H); Adriano (H)",
        "figures": [
            {
                "id": "leader-julio-cesar",
                "name": "Júlio César",
                "recommended": true,
                "cls": "HISTORICAL",
                "archetype": "Comandante de Campanha",
                "passive": {
                    "name": "Campanhas Abastecidas",
                    "text": "Suprimento +1 hex",
                    "effect": {
                        "kind": "SUPPLY",
                        "amount": 1
                    }
                },
                "power": {
                    "name": "Veni, Vidi, Vici",
                    "text": "+1 ponto de comando da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "COMMAND",
                        "amount": 1
                    }
                },
                "style": "Campanha e comando",
                "source": "Comentários (Guerra das Gálias, propaganda), Cícero, Suetônio, Plutarco.",
                "portrait": "Perfil, rosto magro, coroa de louros, toga; fortificação de Alésia; luz de campanha; ~55 anos."
            },
            {
                "id": "leader-augusto",
                "name": "Augusto",
                "recommended": false,
                "cls": "HISTORICAL",
                "archetype": "Governante-Administrador",
                "passive": {
                    "name": "Pax Augusta",
                    "text": "Ação cívica integra +10 em cidades ocupadas",
                    "effect": {
                        "kind": "INTEGRATION",
                        "amount": 10
                    }
                },
                "power": {
                    "name": "Jogos Seculares",
                    "text": "+1 Ânimo em todas as cidades",
                    "effect": {
                        "kind": "MOOD_ALL",
                        "amount": 1
                    }
                },
                "style": "Governo e administração",
                "source": "Res Gestae, Suetônio, Tácito, Dião Cássio.",
                "portrait": "Frontal idealizado (tipo Prima Porta), couraça lavrada; fórum de mármore; luz limpa; jovem ideal."
            },
            {
                "id": "leader-trajano",
                "name": "Trajano",
                "recommended": false,
                "cls": "HISTORICAL",
                "archetype": "Imperador-Construtor",
                "passive": {
                    "name": "Obras Públicas",
                    "text": "Limite de Pedra +6",
                    "effect": {
                        "kind": "STORAGE",
                        "resource": "stone",
                        "amount": 6
                    }
                },
                "power": {
                    "name": "Via Trajana",
                    "text": "+1 movimento da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "MOVEMENT",
                        "amount": 1
                    }
                },
                "style": "Expansão e infraestrutura",
                "source": "Coluna de Trajano, Plínio, Dião Cássio.",
                "portrait": "Perfil, corte de cabelo reto, paludamento; Coluna de Trajano em espiral; luz de meio-dia; ~50 anos."
            }
        ]
    },
    {
        "id": "norse",
        "chassis": "thalos",
        "name": "Nórdicos",
        "adjective": "Nórdico",
        "scope": "Mundo nórdico da Era Viking",
        "period": "c. 793 – 1066 d.C.",
        "architecture": [
            "- N1–N2: casa longa de madeira e turfa, cerca de estacas",
            "N3–N4: salão longo, estaleiro de drakkar, círculo de pedras",
            "N5: fortaleza circular de madeira e terra, cais",
            "N6–N7: salão real, mercado costeiro (tipo Birka e Hedeby), pedra rúnica"
        ],
        "port": "Cais de madeira com drakkar de vela listrada",
        "fortification": "Palissada e muralha circular de terra",
        "materials": "Carvalho e pinho escuro, turfa, ferro, pedra rúnica",
        "pattern": "Entrelaçado de animais",
        "palette": [
            "#4a3a2c",
            "#7a8a8f",
            "#c9d2d4",
            "#8a3f3a"
        ],
        "banner": {
            "name": "Estandarte do Corvo",
            "text": "Pano triangular com corvo, em haste",
            "enum": "RAVEN"
        },
        "emblem": {
            "name": "Corvo",
            "text": "Corvo de asas abertas sobre entrelaçado"
        },
        "cityLook": "Salão longo, cais de drakkar e palissada circular",
        "patrons": "Odin, Thor, Freyja",
        "reserves": "Lagertha (T); Harald Hardrada (H); Erik, o Vermelho (S); Freydís Eiríksdóttir (S)",
        "figures": [
            {
                "id": "leader-harald-cabelo-belo",
                "name": "Harald Cabelo Belo",
                "recommended": false,
                "cls": "SEMI_LEGENDARY",
                "archetype": "Rei-Unificador",
                "passive": {
                    "name": "Reino Unido",
                    "text": "Ação cívica integra +10 em cidades ocupadas",
                    "effect": {
                        "kind": "INTEGRATION",
                        "amount": 10
                    }
                },
                "power": {
                    "name": "Juramento de Hafrsfjord",
                    "text": "+15 coesão local em todas as cidades",
                    "effect": {
                        "kind": "COHESION_ALL",
                        "amount": 15
                    }
                },
                "style": "Unificação e governo",
                "source": "Heimskringla (Snorri, c. 1230), poesia escáldica.",
                "portrait": "Perfil, cabelo longo louro e barba, anel de braço, fiorde; luz clara de inverno; ~45 anos."
            },
            {
                "id": "leader-leif-erikson",
                "name": "Leif Erikson",
                "recommended": true,
                "cls": "HISTORICAL",
                "archetype": "Explorador",
                "passive": {
                    "name": "Rotas de Vinland",
                    "text": "Suprimento +1 hex",
                    "effect": {
                        "kind": "SUPPLY",
                        "amount": 1
                    }
                },
                "power": {
                    "name": "Travessia",
                    "text": "+1 movimento da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "MOVEMENT",
                        "amount": 1
                    }
                },
                "style": "Exploração",
                "source": "Grænlendinga saga e Eiríks saga rauða (séc. XIII); L'Anse aux Meadows (c. 1000 d.C.).",
                "portrait": "Três-quartos, capuz, barba curta, proa de navio, costa desconhecida; luz de aurora; ~30 anos."
            },
            {
                "id": "leader-ragnar-lodbrok",
                "name": "Ragnar Lodbrok",
                "recommended": false,
                "cls": "TRADITIONAL",
                "archetype": "Guerreiro-Incursor",
                "passive": {
                    "name": "Tributo de Incursão",
                    "text": "Limite de Riqueza +6",
                    "effect": {
                        "kind": "STORAGE",
                        "resource": "wealth",
                        "amount": 6
                    }
                },
                "power": {
                    "name": "Fúria da Incursão",
                    "text": "+2 Força nos conflitos da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "STRENGTH",
                        "amount": 2
                    }
                },
                "style": "Guerra e incursão",
                "source": "Ragnars saga loðbrókar, Gesta Danorum (Saxo), Krákumál.",
                "portrait": "Perfil, tranças e barba, elmo cônico de nasal, escudo, vela listrada; luz de tocha; ~45 anos."
            }
        ]
    },
    {
        "id": "chinese",
        "chassis": "orinth",
        "name": "Chineses",
        "adjective": "Chinês",
        "scope": "China antiga e imperial inicial",
        "period": "c. 500 a.C. – 705 d.C.",
        "architecture": [
            "- N1–N2: casas de taipa, colmo, cerca de estacas",
            "N3–N4: pátios, salão de beirais curvos, torre de tambor",
            "N5: muralha de taipa com portão de torre",
            "N6–N7: pagode, palácio em plataforma"
        ],
        "port": "Píer de madeira laqueada com junco de velas ripadas",
        "fortification": "Muralha de taipa com torre de portão de telhado curvo",
        "materials": "Taipa, madeira laqueada, telha cinza, bronze, seda",
        "pattern": "Meandro de raios (leiwen)",
        "palette": [
            "#6e5a48",
            "#8e4a3c",
            "#3f4448",
            "#b8914d"
        ],
        "banner": {
            "name": "Estandarte de Caldeirão",
            "text": "Faixa vertical com caudas, ornada com o caldeirão",
            "enum": "STREAMER"
        },
        "emblem": {
            "name": "Caldeirão ding",
            "text": "Tripé de bronze ritual: autoridade"
        },
        "cityLook": "Muralha de taipa, torre de portão e telhado curvo",
        "patrons": "Heróis culturais (sem religião popular viva)",
        "reserves": "Fu Hao (H); Han Wudi (H); Zhang Qian (H); Yu, o Grande (S); Confúcio (H); Mulan (L)",
        "figures": [
            {
                "id": "leader-qin-shi-huang",
                "name": "Qin Shi Huang",
                "recommended": false,
                "cls": "HISTORICAL",
                "archetype": "Imperador-Centralizador",
                "passive": {
                    "name": "Muralhas Unidas",
                    "text": "Limite de Pedra +6",
                    "effect": {
                        "kind": "STORAGE",
                        "resource": "stone",
                        "amount": 6
                    }
                },
                "power": {
                    "name": "Padronização",
                    "text": "+15 coesão local em todas as cidades",
                    "effect": {
                        "kind": "COHESION_ALL",
                        "amount": 15
                    }
                },
                "style": "Centralização e obra",
                "source": "Shiji (Sima Qian, c. 100 a.C.), tabuinhas de Liye e Yunmeng, Exército de Terracota.",
                "portrait": "Frontal, coroa mian com contas, bigode e cavanhaque, robe negro; exército de terracota; luz fria; ~45 anos."
            },
            {
                "id": "leader-wu-zetian",
                "name": "Wu Zetian",
                "recommended": false,
                "cls": "HISTORICAL",
                "archetype": "Imperatriz-Administradora",
                "passive": {
                    "name": "Exames Imperiais",
                    "text": "Ação cívica integra +10 em cidades ocupadas",
                    "effect": {
                        "kind": "INTEGRATION",
                        "amount": 10
                    }
                },
                "power": {
                    "name": "Reinado de Zhou",
                    "text": "+1 Ânimo em todas as cidades",
                    "effect": {
                        "kind": "MOOD_ALL",
                        "amount": 1
                    }
                },
                "style": "Governo e administração",
                "source": "Livros Velho e Novo de Tang, Zizhi Tongjian.",
                "portrait": "Três-quartos, penteado alto com grampos, robe de gola de nuvens; salão de corte; luz suave; ~50 anos."
            },
            {
                "id": "leader-sun-tzu",
                "name": "Sun Tzu",
                "recommended": true,
                "cls": "SEMI_LEGENDARY",
                "archetype": "Estrategista",
                "passive": {
                    "name": "Estrada do General",
                    "text": "Suprimento +1 hex",
                    "effect": {
                        "kind": "SUPPLY",
                        "amount": 1
                    }
                },
                "power": {
                    "name": "Cálculo Prévio",
                    "text": "+1 ponto de comando da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "COMMAND",
                        "amount": 1
                    }
                },
                "style": "Estratégia e logística",
                "source": "Shiji (biografia de Sun Wu), A Arte da Guerra (manuscritos de Yinqueshan).",
                "portrait": "Perfil, gorro e barba rala, tiras de bambu; mapa de colinas; luz de lamparina; ~50 anos."
            }
        ]
    },
    {
        "id": "india",
        "chassis": "saren",
        "name": "Índia Antiga",
        "adjective": "Indiano",
        "scope": "Índia antiga: Maurya e Gupta",
        "period": "c. 321 a.C. – 550 d.C.",
        "architecture": [
            "- N1–N2: casas de adobe com varanda, poço",
            "N3–N4: palissada de madeira (Pataliputra), mandapa, poço escalonado",
            "N5: palácio de madeira, pilar de edito, muralha de arenito",
            "N6–N7: complexo de templo-torre, observatório de pedra"
        ],
        "port": "Cais de arenito em degraus (ghat) com dhow de vela latina",
        "fortification": "Palissada de madeira com torres, depois muralha de arenito",
        "materials": "Arenito polido, madeira, estuque, cobre",
        "pattern": "Treliça geométrica (jali)",
        "palette": [
            "#c28a5a",
            "#9a6a4a",
            "#3d5f7a",
            "#b8914d"
        ],
        "banner": {
            "name": "Dhvaja Maurya",
            "text": "Pano estreito e longo, com pavão sobre colina",
            "enum": "LONG"
        },
        "emblem": {
            "name": "Pavão sobre colina",
            "text": "Pavão sobre colina em arco (símbolo de moedas maurya)"
        },
        "cityLook": "Palissada de madeira, pilar de edito e palácio",
        "patrons": "Nenhum (divindades de religiões vivas)",
        "reserves": "Chanakya (S); Samudragupta (H); Rajaraja Chola I (H); Kalidasa (H); Prabhavatigupta (H)",
        "figures": [
            {
                "id": "leader-ashoka",
                "name": "Ashoka",
                "recommended": false,
                "cls": "HISTORICAL",
                "archetype": "Governante-Reformador",
                "passive": {
                    "name": "Editos em Pilar",
                    "text": "Ação cívica integra +10 em cidades ocupadas",
                    "effect": {
                        "kind": "INTEGRATION",
                        "amount": 10
                    }
                },
                "power": {
                    "name": "Dhamma",
                    "text": "+15 coesão local em todas as cidades",
                    "effect": {
                        "kind": "COHESION_ALL",
                        "amount": 15
                    }
                },
                "style": "Governo e coesão",
                "source": "Editos em rocha e pilar (Brahmi, prácrito), Mahavamsa.",
                "portrait": "Frontal, turbante de dobras planas, joias, pilar de edito; luz de tarde; ~50 anos."
            },
            {
                "id": "leader-chandragupta-maurya",
                "name": "Chandragupta Maurya",
                "recommended": true,
                "cls": "HISTORICAL",
                "archetype": "Fundador-Comandante",
                "passive": {
                    "name": "Exércitos Abastecidos",
                    "text": "Suprimento +1 hex",
                    "effect": {
                        "kind": "SUPPLY",
                        "amount": 1
                    }
                },
                "power": {
                    "name": "Falange Maurya",
                    "text": "+2 Força nos conflitos da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "STRENGTH",
                        "amount": 2
                    }
                },
                "style": "Fundação e comando",
                "source": "Megástenes (Indica, fragmentos), Justino, tradições jainista e brâmane; Arthashastra atribuído a Kautilya.",
                "portrait": "Três-quartos, turbante, arco, elefantes ao fundo; luz de campanha; ~40 anos."
            },
            {
                "id": "leader-aryabhata",
                "name": "Aryabhata",
                "recommended": false,
                "cls": "HISTORICAL",
                "archetype": "Sábio",
                "passive": {
                    "name": "Arquivo de Medidas",
                    "text": "Limite de Pedra +6",
                    "effect": {
                        "kind": "STORAGE",
                        "resource": "stone",
                        "amount": 6
                    }
                },
                "power": {
                    "name": "Padrão de Métodos",
                    "text": "+1 ponto de comando da rodada",
                    "effect": {
                        "kind": "ROUND_BONUS",
                        "bonus": "COMMAND",
                        "amount": 1
                    }
                },
                "style": "Conhecimento",
                "source": "Aryabhatiya (499 d.C.), comentaristas.",
                "portrait": "Perfil, cabeça raspada com mecha, esfera armilar, folhas de palmeira; céu noturno; ~35 anos."
            }
        ]
    },
    {
        "id": "incas",
        "chassis": "aurelia",
        "name": "Incas (Tawantinsuyu)",
        "adjective": "Inca",
        "scope": "Tawantinsuyu e a tradição de origem inca",
        "period": "c. 1438 – 1533 d.C. (origem em tradição)",
        "architecture": [
            "- N1–N2: casas de pedra e palha, depósito pequeno",
            "N3–N4: andenes (terraços), portas trapezoidais, qollqas",
            "N5: plataforma escalonada, praça, muralha encaixada",
            "N6–N7: cidadela de terraços, muralha em zigue-zague"
        ],
        "port": "Embarcadouro de pedra encaixada com barcos de junco (caballito de totora)",
        "fortification": "Muralha em zigue-zague de pedra poligonal encaixada",
        "materials": "Granito e andesito, palha ichu, adobe, lã de alpaca, ouro",
        "pattern": "Tocapu (quadros xadrez)",
        "palette": [
            "#a9a493",
            "#7d7967",
            "#b79c62",
            "#a54a3a"
        ],
        "banner": {
            "name": "Unancha",
            "text": "Pano quadrado com tocapu, em haste",
            "enum": "SQUARE"
        },
        "emblem": {
            "name": "Mascaipacha",
            "text": "Borla real vermelha sobre faixa (llautu)"
        },
        "cityLook": "Andenes, qollqas e muralha de pedra encaixada",
        "patrons": "Inti, Viracocha, Pachamama (tradição viva: só visual)",
        "reserves": "Túpac Inca Yupanqui (H); Mama Huaco (T); Huayna Cápac (H); Túpac Amaru I (H)",
        "figures": [
            {
                "id": "leader-pachacutec",
                "name": "Pachacútec",
                "recommended": false,
                "cls": "HISTORICAL",
                "archetype": "Reformador-Construtor",
                "passive": {
                    "name": "Cantaria Encaixada",
                    "text": "Limite de Pedra +6",
                    "effect": {
                        "kind": "STORAGE",
                        "resource": "stone",
                        "amount": 6
                    }
                },
                "power": {
                    "name": "Mit’a",
                    "text": "+15 coesão local em todas as cidades",
                    "effect": {
                        "kind": "COHESION_ALL",
                        "amount": 15
                    }
                },
                "style": "Reforma e construção",
                "source": "Betanzos (1551), Cieza e Sarmiento (cronistas coloniais) com base em tradição oral e quipus; arqueologia.",
                "portrait": "Perfil, llautu e orelheiras, túnica de tocapu, muralha de Cuzco; luz de pedra; ~50 anos."
            },
            {
                "id": "leader-manco-capac",
                "name": "Manco Cápac",
                "recommended": false,
                "cls": "TRADITIONAL",
                "archetype": "Fundador tradicional",
                "passive": {
                    "name": "Cuzco, Umbigo do Mundo",
                    "text": "Ação cívica integra +10 em cidades ocupadas",
                    "effect": {
                        "kind": "INTEGRATION",
                        "amount": 10
                    }
                },
                "power": {
                    "name": "Aliança de Ayllus",
                    "text": "tratados ativos duram +2 rodadas",
                    "effect": {
                        "kind": "TREATY_EXTEND",
                        "rounds": 2
                    }
                },
                "style": "Fundação e alianças",
                "source": "Mito de origem registrado por Garcilaso e Sarmiento (variantes).",
                "portrait": "Frontal, bastão de ouro, montanhas e lago; luz de alvorada; sem idade definida."
            },
            {
                "id": "leader-mama-ocllo",
                "name": "Mama Ocllo",
                "recommended": true,
                "cls": "TRADITIONAL",
                "archetype": "Fundadora (cultura e produção)",
                "passive": {
                    "name": "Celeiros de cortesia",
                    "text": "Limite de Alimento +6",
                    "effect": {
                        "kind": "STORAGE",
                        "resource": "food",
                        "amount": 6
                    }
                },
                "power": {
                    "name": "Festa da Colheita",
                    "text": "+1 Ânimo em todas as cidades",
                    "effect": {
                        "kind": "MOOD_ALL",
                        "amount": 1
                    }
                },
                "style": "Produção e cultura",
                "source": "Garcilaso (1609) e outros (variantes).",
                "portrait": "Frontal, manta (lliclla) e alfinete (tupu), fuso, terraços; luz de manhã; ~35 anos."
            }
        ]
    }
];
const CORE10_CHASSIS = CORE10.map(_c = (civ)=>civ.chassis);
_c1 = CORE10_CHASSIS;
const core10OfChassis = (chassis)=>CORE10.find((civ)=>civ.chassis === chassis) ?? null;
const civilizationDisplayName = (chassis)=>core10OfChassis(chassis)?.name ?? 'Civilização';
const isCore10Chassis = (chassis)=>core10OfChassis(chassis) !== null;
const FIGURES = CORE10.flatMap(_c2 = (civ)=>civ.figures.map((figure)=>({
            ...figure,
            civilizationId: civ.chassis
        })));
_c3 = FIGURES;
const figureById = (id)=>FIGURES.find((figure)=>figure.id === id) ?? null;
const recommendedFigure = (chassis)=>core10OfChassis(chassis)?.figures.find((figure)=>figure.recommended) ?? core10OfChassis(chassis)?.figures[0] ?? null;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "CORE10_CHASSIS$CORE10.map");
__turbopack_context__.k.register(_c1, "CORE10_CHASSIS");
__turbopack_context__.k.register(_c2, "FIGURES$CORE10.flatMap");
__turbopack_context__.k.register(_c3, "FIGURES");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/alpha-effects.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AlphaEffectSchema",
    ()=>AlphaEffectSchema,
    "EffectTimingSchema",
    ()=>EffectTimingSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
;
const EffectTimingSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'ON_PRODUCE',
    'ROUND_START',
    'MAINTENANCE',
    'ONCE'
]);
const AlphaEffectSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].discriminatedUnion('kind', [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('PRODUCTION'),
        resource: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'food',
            'materials',
            'wealth',
            'knowledge',
            'influence'
        ]),
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(5),
        timing: EffectTimingSchema.optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'STRENGTH',
            'MOVEMENT',
            'COMMAND'
        ]),
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(2)
    })
]);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/alpha-institutions.js [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CIVILIZATIONS",
    ()=>CIVILIZATIONS
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$effects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-effects.js [app-client] (ecmascript)");
// The Teia Civilizacional lives in alpha-web.ts (V5.1a: 40 + 10 Convergences); ADVANCEMENTS is kept as the name every consumer uses.
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-client] (ecmascript)");
;
;
const civilizations = [
    [
        'aurelia',
        'Incas (Tawantinsuyu)',
        'Cusco',
        'Terraços, qollqas e estradas através dos Andes',
        'food',
        'materials',
        'Colheita do Inca'
    ],
    [
        'valgard',
        'Helênicos',
        'Atenas',
        'Pólis armadas, estratégia e defesa do território',
        'materials',
        'food',
        'Convocação da Pólis'
    ],
    [
        'meridia',
        'Mesopotâmicos',
        'Babilônia',
        'Cidades de tijolo, canais de irrigação e rotas de comércio',
        'wealth',
        'knowledge',
        'Feira do Karum'
    ],
    [
        'thalos',
        'Nórdicos',
        'Hedeby',
        'Navegadores, incursores e exploradores das costas do Norte',
        'knowledge',
        'wealth',
        'Travessia do Mar do Norte'
    ],
    [
        'saren',
        'Índia Antiga',
        'Pataliputra',
        'Editos, diplomacia e cidades planejadas do vale do Ganges',
        'influence',
        'food',
        'Pilares de Edito'
    ],
    [
        'kor',
        'Romanos',
        'Roma',
        'Legiões, estradas e engenharia de cerco e muralha',
        'materials',
        'wealth',
        'Mutirão das Legiões'
    ],
    [
        'orinth',
        'Chineses',
        'Chang’an',
        'Burocracia, astronomia e muralhas de um império de estudiosos',
        'knowledge',
        'materials',
        'Exames Imperiais'
    ],
    [
        'nymara',
        'Egípcios',
        'Tebas',
        'Cheias do Nilo, obras monumentais e a estabilidade das colheitas',
        'food',
        'wealth',
        'Cheia do Nilo'
    ],
    [
        'veyra',
        'Veyra',
        'Encruzilhada de Veyra',
        'Articuladores de rotas e padrões de confiança',
        'wealth',
        'influence',
        'Câmara de trocas'
    ],
    [
        'solenne',
        'Israel e Judá',
        'Jerusalém',
        'Tribos reunidas em torno da Lei, do Templo e da memória',
        'influence',
        'knowledge',
        'Assembleia do Portão'
    ],
    [
        'dravik',
        'Persas',
        'Persépolis',
        'Estradas reais, satrapias e administração de muitos povos',
        'materials',
        'knowledge',
        'Tributo das Satrapias'
    ],
    [
        'elyra',
        'Elyra',
        'Escola de Elyra',
        'Curadores de saberes e vínculos comunitários',
        'knowledge',
        'food',
        'Escola itinerante'
    ]
];
const colors = [
    '#c8a45c',
    '#7ca6b8',
    '#b6798c',
    '#69a69a',
    '#aab875',
    '#bd8f66',
    '#9b92bf',
    '#80af82',
    '#c294b1',
    '#d1b77d',
    '#91a7ba',
    '#c59a78'
];
// Legacy "materials" effects credit Madeira and Pedra (alphaGainOf); there is no Materiais resource.
const resourceNames = {
    food: 'Alimento',
    materials: 'Madeira e Pedra',
    wealth: 'Riqueza',
    knowledge: 'Conhecimento',
    influence: 'Influência'
};
const CIVILIZATIONS = civilizations.map(_c = ([id, name, capital, identity, first, second, ability], i)=>({
        id,
        name,
        capital,
        identity,
        color: colors[i],
        symbol: `civilization-${i + 1}`,
        bias: `Ênfase em ${resourceNames[first]} e ${resourceNames[second]}; não restringe escolhas.`,
        passives: [
            {
                kind: 'PRODUCTION',
                resource: first,
                amount: 1
            },
            {
                kind: 'PRODUCTION',
                resource: second,
                amount: 1
            }
        ],
        ability: {
            name: ability,
            effects: [
                {
                    kind: 'PRODUCTION',
                    resource: first,
                    amount: 2,
                    timing: 'ONCE'
                },
                {
                    kind: 'PRODUCTION',
                    resource: second,
                    amount: 1,
                    timing: 'ONCE'
                }
            ]
        }
    }));
_c1 = CIVILIZATIONS;
var _c, _c1;
__turbopack_context__.k.register(_c, "CIVILIZATIONS$civilizations.map");
__turbopack_context__.k.register(_c1, "CIVILIZATIONS");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/alpha-leaders.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ALPHA_LEADER_BUDGET",
    ()=>ALPHA_LEADER_BUDGET,
    "LEADERS",
    ()=>LEADERS,
    "LEADER_CIVILIZATION_IDS",
    ()=>LEADER_CIVILIZATION_IDS,
    "LeaderAbilityEffectSchema",
    ()=>LeaderAbilityEffectSchema,
    "LeaderPassiveSchema",
    ()=>LeaderPassiveSchema,
    "LeaderStateSchema",
    ()=>LeaderStateSchema,
    "figuresOfCivilization",
    ()=>figuresOfCivilization,
    "leaderOfCivilization",
    ()=>leaderOfCivilization,
    "leaderStateFor",
    ()=>leaderStateFor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-institutions.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$core10$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-core10.js [app-client] (ecmascript)");
;
;
;
const ALPHA_LEADER_BUDGET = {
    passive: {
        storageBase: 6,
        storageMetal: 4,
        supplyRadius: 1,
        integrationPerCivic: 10
    },
    ability: {
        strength: 2,
        movement: 1,
        command: 1,
        moodAll: 1,
        cohesionAll: 15,
        treatyRounds: 2
    }
};
const StoredResourceSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'food',
    'wood',
    'stone',
    'metal',
    'wealth'
]);
const LeaderPassiveSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].discriminatedUnion('kind', [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('STORAGE'),
        resource: StoredResourceSchema,
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(6)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('SUPPLY'),
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(1)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('INTEGRATION'),
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(10)
    })
]);
const LeaderAbilityEffectSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].discriminatedUnion('kind', [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('ROUND_BONUS'),
        bonus: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'STRENGTH',
            'MOVEMENT',
            'COMMAND'
        ]),
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(2)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('MOOD_ALL'),
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(1)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('COHESION_ALL'),
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(15)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('TREATY_EXTEND'),
        rounds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(2)
    })
]);
const LeaderStateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    leaderId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(64),
    eraAbilityUsed: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
});
const B = ALPHA_LEADER_BUDGET;
const storage = (resource)=>({
        kind: 'STORAGE',
        resource,
        amount: resource === 'metal' ? B.passive.storageMetal : B.passive.storageBase
    });
const supply = {
    kind: 'SUPPLY',
    amount: B.passive.supplyRadius
};
const integration = {
    kind: 'INTEGRATION',
    amount: B.passive.integrationPerCivic
};
const bonus = (kind)=>({
        kind: 'ROUND_BONUS',
        bonus: kind,
        amount: B.ability[kind === 'STRENGTH' ? 'strength' : kind === 'MOVEMENT' ? 'movement' : 'command']
    });
const mood = {
    kind: 'MOOD_ALL',
    amount: B.ability.moodAll
};
const cohesion = {
    kind: 'COHESION_ALL',
    amount: B.ability.cohesionAll
};
const treaty = {
    kind: 'TREATY_EXTEND',
    rounds: B.ability.treatyRounds
};
const rows = [
    [
        'aurelia',
        'leader-maera-vaelun',
        'Maera Vaelun',
        'Guardiã dos Celeiros',
        'AV',
        [
            'Celeiros de cortesia',
            'Os celeiros comuns guardam mais Alimentos.',
            storage('food')
        ],
        [
            'Festa da Colheita',
            'Uma vez por Era, o ânimo de todas as suas cidades sobe 1 (até o limite do investimento público).',
            mood
        ]
    ],
    [
        'valgard',
        'leader-toren-hjalvar',
        'Toren Hjalvar',
        'Senhor das Passagens',
        'TH',
        [
            'Refúgios abastecidos',
            'Suas peças ficam abastecidas 1 hex mais longe das cidades.',
            supply
        ],
        [
            'Muralha Viva',
            'Uma vez por Era, suas peças ganham +2 de Força nos conflitos desta rodada.',
            bonus('STRENGTH')
        ]
    ],
    [
        'meridia',
        'leader-isaure-mekhan',
        'Isaure Mekhan',
        'Voz das Margens',
        'IM',
        [
            'Casas de câmbio',
            'Suas casas de troca guardam mais Riqueza.',
            storage('wealth')
        ],
        [
            'Rede de Correspondentes',
            'Uma vez por Era, +1 ponto de comando nesta rodada.',
            bonus('COMMAND')
        ]
    ],
    [
        'thalos',
        'leader-kaelis-orran',
        'Kaelis Orran',
        'Cartógrafa das Costas',
        'KO',
        [
            'Cartas de abastecimento',
            'Suas peças ficam abastecidas 1 hex mais longe das cidades.',
            supply
        ],
        [
            'Carta Nova',
            'Uma vez por Era, suas peças ganham +1 de movimento nesta rodada.',
            bonus('MOVEMENT')
        ]
    ],
    [
        'saren',
        'leader-oduan-saretha',
        'Oduan Saretha',
        'Presidente do Concílio dos Vales',
        'OS',
        [
            'Acordos de vizinhança',
            'A Ação cívica integra 10 pontos a mais em cidades ocupadas.',
            integration
        ],
        [
            'Selo do Concílio',
            'Uma vez por Era, seus tratados ativos duram mais 2 rodadas.',
            treaty
        ]
    ],
    [
        'kor',
        'leader-brakka-kordun',
        'Brakka Kordun',
        'Mestre da Transformação',
        'BK',
        [
            'Depósito de ferragens',
            'Suas oficinas guardam mais Metal.',
            storage('metal')
        ],
        [
            'Rotina de Manutenção',
            'Uma vez por Era, a coesão local de todas as suas cidades sobe 15.',
            cohesion
        ]
    ],
    [
        'orinth',
        'leader-ilaen-orivane',
        'Ilaen Orivane',
        'Observadora-Chefe',
        'IO',
        [
            'Arquivo de medidas',
            'Seus arquivos guardam mais Pedra de referência.',
            storage('stone')
        ],
        [
            'Padrão de Métodos',
            'Uma vez por Era, +1 ponto de comando nesta rodada.',
            bonus('COMMAND')
        ]
    ],
    [
        'nymara',
        'leader-suvi-nymeru',
        'Suvi Nymeru',
        'Memória Viva',
        'SN',
        [
            'Bosques de memória',
            'Seus bosques comuns guardam mais Madeira.',
            storage('wood')
        ],
        [
            'Ritual das Sementes',
            'Uma vez por Era, o ânimo de todas as suas cidades sobe 1 (até o limite do investimento público).',
            mood
        ]
    ],
    [
        'veyra',
        'leader-delphar-veyn',
        'Delphar Veyn',
        'Árbitro das Rotas',
        'DV',
        [
            'Pontos de confiança',
            'A Ação cívica integra 10 pontos a mais em cidades ocupadas.',
            integration
        ],
        [
            'Caravana Expressa',
            'Uma vez por Era, suas peças ganham +1 de movimento nesta rodada.',
            bonus('MOVEMENT')
        ]
    ],
    [
        'solenne',
        'leader-amaris-solenth',
        'Amaris Solenth',
        'Anfitriã das Vozes',
        'AS',
        [
            'Casa aberta',
            'A Ação cívica integra 10 pontos a mais em cidades ocupadas.',
            integration
        ],
        [
            'Assembleia Prorrogada',
            'Uma vez por Era, seus tratados ativos duram mais 2 rodadas.',
            treaty
        ]
    ],
    [
        'dravik',
        'leader-hartvig-drell',
        'Hartvig Drell',
        'Arquiteto das Obras',
        'HD',
        [
            'Redes de abastecimento',
            'Suas peças ficam abastecidas 1 hex mais longe das cidades.',
            supply
        ],
        [
            'Obra Defensiva',
            'Uma vez por Era, suas peças ganham +2 de Força nos conflitos desta rodada.',
            bonus('STRENGTH')
        ]
    ],
    [
        'elyra',
        'leader-lirien-elyrae',
        'Lirien Elyrae',
        'Curadora Itinerante',
        'LE',
        [
            'Vínculos de aprendizado',
            'A Ação cívica integra 10 pontos a mais em cidades ocupadas.',
            integration
        ],
        [
            'Escola de Convivência',
            'Uma vez por Era, a coesão local de todas as suas cidades sobe 15.',
            cohesion
        ]
    ]
];
const legacyLeaders = rows.map(([civilizationId, id, name, title, symbol, passive, ability])=>({
        id,
        name,
        title,
        civilizationId,
        symbol,
        legacy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$core10$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isCore10Chassis"])(civilizationId),
        passiveAbility: {
            name: passive[0],
            description: passive[1],
            effect: LeaderPassiveSchema.parse(passive[2])
        },
        eraAbility: {
            name: ability[0],
            description: ability[1],
            effect: LeaderAbilityEffectSchema.parse(ability[2])
        }
    }));
const RESOURCE_NAMES = {
    food: 'Alimento',
    wood: 'Madeira',
    stone: 'Pedra',
    metal: 'Metal',
    wealth: 'Riqueza'
};
const passiveText = (effect)=>effect.kind === 'STORAGE' ? `Seu limite de ${RESOURCE_NAMES[effect.resource]} aumenta em ${effect.amount}.` : effect.kind === 'SUPPLY' ? 'Suas peças ficam abastecidas 1 hex mais longe das cidades.' : `A Ação cívica integra ${effect.amount} pontos a mais em cidades ocupadas.`;
const powerText = (effect)=>effect.kind === 'ROUND_BONUS' ? effect.bonus === 'STRENGTH' ? `Uma vez por Era, suas peças ganham +${effect.amount} de Força nos conflitos desta rodada.` : effect.bonus === 'MOVEMENT' ? `Uma vez por Era, suas peças ganham +${effect.amount} de movimento nesta rodada.` : `Uma vez por Era, +${effect.amount} ponto de comando nesta rodada.` : effect.kind === 'MOOD_ALL' ? `Uma vez por Era, o ânimo de todas as suas cidades sobe ${effect.amount}.` : effect.kind === 'COHESION_ALL' ? `Uma vez por Era, a coesão local de todas as suas cidades sobe ${effect.amount}.` : `Uma vez por Era, seus tratados ativos duram mais ${effect.rounds} rodadas.`;
const plain = (text)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const initials = (name)=>{
    const words = plain(name).split(/[\s,]+/).filter((word)=>/^[A-Z]/.test(word));
    return (words.length > 1 ? words.slice(0, 2).map((word)=>word[0]).join('') : (words[0] ?? plain(name)).slice(0, 2)).toUpperCase();
};
/** The 30 playable Figuras of the Core 10 (3 per civilization), validated against the same budget as every leader. */ const figureLeaders = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$core10$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FIGURES"].map((figure)=>({
        id: figure.id,
        name: figure.name,
        title: figure.archetype,
        civilizationId: figure.civilizationId,
        symbol: initials(figure.name),
        passiveAbility: {
            name: figure.passive.name,
            description: passiveText(figure.passive.effect),
            effect: LeaderPassiveSchema.parse(figure.passive.effect)
        },
        eraAbility: {
            name: figure.power.name,
            description: powerText(figure.power.effect),
            effect: LeaderAbilityEffectSchema.parse(figure.power.effect)
        }
    }));
const LEADERS = [
    ...legacyLeaders,
    ...figureLeaders
];
const figuresOfCivilization = (civilizationId)=>{
    const figures = figureLeaders.filter((leader)=>leader.civilizationId === civilizationId);
    return figures.length ? figures : legacyLeaders.filter((leader)=>leader.civilizationId === civilizationId);
};
const leaderOfCivilization = (civilizationId)=>{
    const star = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$core10$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["recommendedFigure"])(civilizationId);
    return (star ? LEADERS.find((leader)=>leader.id === star.id) : null) ?? figuresOfCivilization(civilizationId)[0] ?? null;
};
const leaderStateFor = (civilizationId, figureId)=>{
    const leader = figureId ? figuresOfCivilization(civilizationId).find((candidate)=>candidate.id === figureId) ?? null : leaderOfCivilization(civilizationId);
    return leader ? {
        leaderId: leader.id,
        eraAbilityUsed: false
    } : null;
};
const LEADER_CIVILIZATION_IDS = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CIVILIZATIONS"].map(_c = (civilization)=>civilization.id);
_c1 = LEADER_CIVILIZATION_IDS;
var _c, _c1;
__turbopack_context__.k.register(_c, "LEADER_CIVILIZATION_IDS$CIVILIZATIONS.map");
__turbopack_context__.k.register(_c1, "LEADER_CIVILIZATION_IDS");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/alpha-legacy-works.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LEGACY_WORKS",
    ()=>LEGACY_WORKS,
    "LEGACY_WORK_IDENTITY",
    ()=>LEGACY_WORK_IDENTITY,
    "LEGACY_WORK_ID_ALIASES",
    ()=>LEGACY_WORK_ID_ALIASES,
    "LEGACY_WORK_PRESTIGE",
    ()=>LEGACY_WORK_PRESTIGE,
    "LEGACY_WORK_STEPS",
    ()=>LEGACY_WORK_STEPS,
    "LegacyWorkProgressSchema",
    ()=>LegacyWorkProgressSchema,
    "legacyStepCost",
    ()=>legacyStepCost,
    "legacyWork",
    ()=>legacyWork,
    "totalOf",
    ()=>totalOf
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-client] (ecmascript)");
;
;
;
const LEGACY_WORK_STEPS = 3;
const LEGACY_WORK_PRESTIGE = 4;
const cost = (part)=>({
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])(),
        ...part
    });
const produce = (resource, timing = 'MAINTENANCE')=>({
        kind: 'PRODUCTION',
        resource,
        amount: 1,
        timing
    });
const LEGACY_WORKS = [
    {
        id: 'archive-of-horizons',
        name: 'Arquivo dos Horizontes',
        path: 'SCIENTIFIC',
        source: 'CANON',
        cost: cost({
            stone: 6,
            wood: 4,
            knowledge: 3
        }),
        requires: {
            district: 'ACADEMIC'
        },
        effect: produce('knowledge')
    },
    {
        id: 'house-of-accord',
        name: 'Casa dos Acordos',
        path: 'POLITICAL',
        source: 'CANON',
        cost: cost({
            stone: 5,
            wealth: 3,
            influence: 3
        }),
        requires: {
            district: 'ADMINISTRATIVE'
        },
        effect: produce('influence')
    },
    {
        id: 'tidal-exchange',
        name: 'Entreposto das Marés',
        path: 'ECONOMIC',
        source: 'CANON',
        cost: cost({
            wood: 5,
            stone: 4,
            wealth: 4
        }),
        requires: {
            district: 'COMMERCIAL'
        },
        effect: produce('wealth')
    },
    {
        id: 'monument-of-voices',
        name: 'Monumento das Vozes',
        path: 'CULTURAL',
        source: 'CANON',
        cost: cost({
            stone: 6,
            wood: 2,
            culture: 4
        }),
        requires: {
            district: 'CULTURAL'
        },
        effect: produce('influence')
    },
    {
        id: 'watch-citadel',
        name: 'Cidadela da Vigília',
        path: 'MILITARY',
        source: 'CANON',
        cost: cost({
            stone: 8,
            metal: 4,
            wealth: 2
        }),
        requires: {
            district: 'MILITARY',
            fortification: 'FORTRESS'
        },
        effect: produce('materials')
    },
    {
        id: 'road-of-communities',
        name: 'Estrada das Comunidades',
        path: 'TERRITORIAL',
        source: 'CANON',
        cost: cost({
            wood: 6,
            stone: 6,
            wealth: 2
        }),
        requires: {
            district: 'INDUSTRIAL',
            connectedCities: 3
        },
        effect: produce('materials', 'ON_PRODUCE')
    },
    {
        id: 'sky-instrument',
        name: 'Instrumento do Firmamento',
        path: 'SCIENTIFIC',
        source: 'CONVERTED',
        cost: cost({
            stone: 5,
            knowledge: 5,
            metal: 2
        }),
        requires: {
            district: 'ACADEMIC'
        },
        effect: produce('knowledge')
    },
    {
        id: 'inquiry-campus',
        name: 'Pátio da Investigação',
        path: 'SCIENTIFIC',
        source: 'CONVERTED',
        cost: cost({
            stone: 4,
            wood: 4,
            knowledge: 4
        }),
        requires: {
            district: 'ACADEMIC'
        },
        effect: produce('knowledge')
    },
    {
        id: 'world-council',
        name: 'Conselho dos Horizontes',
        path: 'POLITICAL',
        source: 'CONVERTED',
        cost: cost({
            stone: 4,
            wealth: 3,
            influence: 5
        }),
        requires: {
            district: 'ADMINISTRATIVE'
        },
        effect: produce('influence')
    },
    {
        id: 'common-mint',
        name: 'Casa da Medida Comum',
        path: 'ECONOMIC',
        source: 'CONVERTED',
        cost: cost({
            stone: 4,
            wood: 2,
            wealth: 6
        }),
        requires: {
            district: 'COMMERCIAL'
        },
        effect: produce('wealth')
    },
    {
        id: 'terraced-reserves',
        name: 'Reservas dos Terraços',
        path: 'TERRITORIAL',
        source: 'CONVERTED',
        cost: cost({
            wood: 4,
            stone: 5,
            food: 3
        }),
        requires: {
            district: 'AGRARIAN'
        },
        effect: produce('food', 'ON_PRODUCE')
    },
    {
        id: 'shared-foundry',
        name: 'Fundição Compartilhada',
        path: 'ECONOMIC',
        source: 'CONVERTED',
        cost: cost({
            stone: 5,
            metal: 4,
            wood: 3
        }),
        requires: {
            district: 'INDUSTRIAL'
        },
        effect: produce('materials', 'ON_PRODUCE')
    }
];
const LEGACY_WORK_IDENTITY = {
    'archive-of-horizons': {
        identity: 'Uma biblioteca-farol onde cada rolo aponta para um horizonte ainda por visitar.',
        silhouette: 'torre baixa com lanterna e galerias de rolos'
    },
    'house-of-accord': {
        identity: 'Salão de pedra onde adversários sentam-se à mesma mesa para ratificar acordos.',
        silhouette: 'salão largo de colunas curtas e frontão'
    },
    'tidal-exchange': {
        identity: 'Um entreposto que sobe e desce com a maré: o comércio vem com a água.',
        silhouette: 'cais coberto sobre arcos, com guindastes'
    },
    'monument-of-voices': {
        identity: 'Um anel de colunas cantantes que guarda a memória das comunidades.',
        silhouette: 'anel de colunas ao redor de um monólito'
    },
    'watch-citadel': {
        identity: 'Cidadela de vigília: quem a vê sabe que a fronteira tem olhos.',
        silhouette: 'torre-mestra com quatro torres de canto'
    },
    'road-of-communities': {
        identity: 'A estrada que costura cidades distantes numa só gente.',
        silhouette: 'marco de estrada com arco e pavimento em fuga'
    },
    'sky-instrument': {
        identity: 'Um grande círculo de bronze que mede o céu e ensina o calendário.',
        silhouette: 'anel armilar de bronze sobre pedestal'
    },
    'inquiry-campus': {
        identity: 'Pátio de pedra onde mestres e aprendizes discutem em círculos.',
        silhouette: 'pátio quadrado de claustro com fonte'
    },
    'world-council': {
        identity: 'Uma sala de assembleia aberta ao mundo, com um assento para cada povo.',
        silhouette: 'rotunda com cúpula rasa e degraus em anel'
    },
    'common-mint': {
        identity: 'A casa onde pesos e medidas são fixados para todos.',
        silhouette: 'prédio compacto com balança sobre a porta'
    },
    'terraced-reserves': {
        identity: 'Terraços de pedra que guardam a colheita contra os anos magros.',
        silhouette: 'terraços escalonados com depósitos'
    },
    'shared-foundry': {
        identity: 'Um forno comum onde todas as oficinas fundem juntas.',
        silhouette: 'forja de chaminé alta com telhado de duas águas'
    }
};
const legacyWork = (id)=>LEGACY_WORKS.find((work)=>work.id === id);
const totalOf = (pool)=>Object.values(pool).reduce((sum, value)=>sum + value, 0);
function legacyStepCost(work, step) {
    const part = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])();
    for (const key of Object.keys(part)){
        const total = work.cost[key];
        part[key] = Math.floor(total / LEGACY_WORK_STEPS) + (step < total % LEGACY_WORK_STEPS ? 1 : 0);
    }
    return part;
}
const LEGACY_WORK_ID_ALIASES = {
    'voices-monument': 'monument-of-voices'
};
const LegacyWorkProgressSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    workId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    ownerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
    stepsDone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(LEGACY_WORK_STEPS),
    startedRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    completedRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"].nullable()
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/alpha-regions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "REGION_TEMPLATES",
    ()=>REGION_TEMPLATES,
    "featureFits",
    ()=>featureFits,
    "rotatedRegionContent",
    ()=>rotatedRegionContent,
    "rotatedTemplateIndex",
    ()=>rotatedTemplateIndex,
    "templateFeatures",
    ()=>templateFeatures,
    "templateMetalDeposit",
    ()=>templateMetalDeposit
]);
const FEATURE_TERRAINS = {
    FISH: [
        'COAST',
        'SEA'
    ],
    TIMBER: [
        'FOREST'
    ],
    FERTILE: [
        'PLAINS',
        'FOREST',
        'HILLS'
    ],
    STONE: [
        'HILLS',
        'MOUNTAINS'
    ]
};
const featureFits = (feature, terrain)=>FEATURE_TERRAINS[feature].includes(terrain);
// Positions: center, E, NE, NW, W, SW, SE. Every template is authored content.
const patterns = [
    [
        'PLAINS',
        'PLAINS',
        'FOREST',
        'HILLS',
        'PLAINS',
        'COAST',
        'COAST'
    ],
    [
        'PLAINS',
        'HILLS',
        'MOUNTAINS',
        'HILLS',
        'FOREST',
        'PLAINS',
        'PLAINS'
    ],
    [
        'PLAINS',
        'FOREST',
        'FOREST',
        'HILLS',
        'PLAINS',
        'FOREST',
        'PLAINS'
    ],
    [
        'PLAINS',
        'COAST',
        'SEA',
        'COAST',
        'FOREST',
        'PLAINS',
        'HILLS'
    ],
    [
        'PLAINS',
        'HILLS',
        'PLAINS',
        'FOREST',
        'HILLS',
        'MOUNTAINS',
        'PLAINS'
    ],
    [
        'PLAINS',
        'PLAINS',
        'COAST',
        'SEA',
        'COAST',
        'PLAINS',
        'FOREST'
    ]
];
const homeNames = [
    'Bacia de Alvor',
    'Altos da Vigia',
    'Estuário das Garças',
    'Costa de Tal',
    'Vale dos Cedros',
    'Terraços do Cobre'
];
const frontierNames = [
    'Várzeas de Vidro',
    'Espinha do Norte',
    'Bosque Silente',
    'Enseada das Agulhas',
    'Escarpa de Cobre',
    'Delta dos Ventos',
    'Campos da Aurora',
    'Pedras da Vigília',
    'Mata das Fontes',
    'Baía do Retorno',
    'Colinas de Âmbar',
    'Praias da Bruma',
    'Planície das Linhas',
    'Maciço do Eco',
    'Floresta das Pontes',
    'Costa das Marés',
    'Serras da Travessia',
    'Ilhas do Horizonte',
    'Campinas do Arco',
    'Altiplano da Cinza',
    'Bosque das Veredas',
    'Porto das Conchas',
    'Cordilheira do Sol',
    'Litoral das Dunas',
    // Thirteen more frontier Regions for the Amplo footprint (43 Regions = 6 Pátrias + 37 frontier).
    'Campos do Meio',
    'Garganta Rubra',
    'Mata do Cedro',
    'Angra das Gaivotas',
    'Cordão de Pedra',
    'Estreito das Aves',
    'Clareiras Longas',
    'Terraços do Vento',
    'Ilhotas do Norte',
    'Planalto de Ouro',
    'Encosta da Neblina',
    'Foz das Salinas',
    'Mirante do Delta'
];
const frontierPatterns = [
    'PPPFHHF',
    'PHMMHFP',
    'PFFFHHP',
    'PCCSCPF',
    'PHHMFPP',
    'PPCSSCP',
    'PPPPFHC',
    'PMHMHFP',
    'PFFPFHF',
    'PCSSCCP',
    'PHFHMHP',
    'PCPCCSP',
    'PPHPPFF',
    'PHMMMPF',
    'PFFFFPH',
    'PCSCCFP',
    'PHMFMHP',
    'PSSCCCP',
    'PPFPFHH',
    'PMMHHFP',
    'PFPFFHH',
    'PCCCSSP',
    'PHMMFHP',
    'PPCSCCP',
    'PPFHPPC',
    'PHMHHPF',
    'PFHFFPP',
    'PCCSPCP',
    'PMMHPFH',
    'PPCCPSC',
    'PFPPHFF',
    'PHPHPHM',
    'PSCSCPP',
    'PPHHFFC',
    'PFFHMPP',
    'PCPPFHC',
    'PHFPPCS'
];
const terrainCode = {
    P: 'PLAINS',
    F: 'FOREST',
    H: 'HILLS',
    M: 'MOUNTAINS',
    C: 'COAST',
    S: 'SEA'
};
const REGION_TEMPLATES = [
    ...homeNames.map((name, i)=>({
            id: `homeland-${i + 1}`,
            name,
            kind: 'HOMELAND',
            terrain: patterns[i]
        })),
    ...frontierNames.map((name, i)=>({
            id: `frontier-${i + 1}`,
            name,
            kind: 'FRONTIER',
            terrain: [
                ...frontierPatterns[i]
            ].map((c)=>terrainCode[c])
        }))
];
function templateMetalDeposit(template) {
    const mountain = template.terrain.indexOf('MOUNTAINS');
    if (mountain >= 0) return mountain;
    const hill = template.terrain.indexOf('HILLS');
    return hill >= 0 ? hill : null;
}
function templateFeatures(template) {
    const deposit = templateMetalDeposit(template), out = template.terrain.map(()=>null);
    const first = (test)=>template.terrain.findIndex((terrain, index)=>out[index] === null && test(terrain, index));
    const place = (feature, index)=>{
        if (index >= 0) out[index] = feature;
    };
    place('FISH', first((terrain)=>terrain === 'COAST'));
    place('TIMBER', first((terrain)=>terrain === 'FOREST'));
    place('FERTILE', first((terrain, index)=>terrain === 'PLAINS' && index > 0));
    place('STONE', first((terrain, index)=>(terrain === 'HILLS' || terrain === 'MOUNTAINS') && index !== deposit));
    return out;
}
function rotatedTemplateIndex(index, rotation) {
    return index === 0 ? 0 : 1 + (index - 1 + rotation) % 6;
}
function rotatedRegionContent(template, rotation) {
    const deposit = templateMetalDeposit(template), features = templateFeatures(template);
    return template.terrain.map((_, index)=>{
        const source = rotatedTemplateIndex(index, rotation);
        return {
            terrain: template.terrain[source],
            deposit: source === deposit,
            feature: features[source] ?? null
        };
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/alpha-resonance.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ChoiceOptionSchema",
    ()=>ChoiceOptionSchema,
    "CompositionKindSchema",
    ()=>CompositionKindSchema,
    "PendingChoiceSchema",
    ()=>PendingChoiceSchema,
    "REPERCUSSION_CARDS",
    ()=>REPERCUSSION_CARDS,
    "RESONANCE_SOCKETS",
    ()=>RESONANCE_SOCKETS,
    "RepercussionCardSchema",
    ()=>RepercussionCardSchema,
    "RepercussionOpSchema",
    ()=>RepercussionOpSchema,
    "ResonanceCycleSchema",
    ()=>ResonanceCycleSchema,
    "ResonanceMarkSchema",
    ()=>ResonanceMarkSchema,
    "ResonanceSlotSchema",
    ()=>ResonanceSlotSchema,
    "ResonanceSourceSchema",
    ()=>ResonanceSourceSchema,
    "ResonanceStateSchema",
    ()=>ResonanceStateSchema,
    "advancementDomains",
    ()=>advancementDomains,
    "advancementSource",
    ()=>advancementSource,
    "classifyResonance",
    ()=>classifyResonance,
    "emptyResonance",
    ()=>emptyResonance,
    "repercussionCard",
    ()=>repercussionCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-client] (ecmascript)");
;
;
;
;
const RESONANCE_SOCKETS = 5;
const ResonanceSourceSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'WEB',
    'CONVERGENCE',
    'HERITAGE'
]);
const ResonanceSlotSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    advancementId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    source: ResonanceSourceSchema,
    domains: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebDomainSchema"]
        ]),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebDomainSchema"],
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebDomainSchema"]
        ])
    ])
});
const ResonanceMarkSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    advancementId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    domains: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebDomainSchema"]
        ]),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebDomainSchema"],
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebDomainSchema"]
        ])
    ]),
    round: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
});
const CompositionKindSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'DOMINANT',
    'HYBRID',
    'PAIR',
    'CONFLUENCE'
]);
const ResonanceCycleSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    round: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    kind: CompositionKindSchema,
    domains: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebDomainSchema"]).min(1).max(5),
    cardId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    slots: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(ResonanceSlotSchema).length(RESONANCE_SOCKETS)
});
const ResonanceStateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    slots: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(ResonanceSlotSchema).max(RESONANCE_SOCKETS - 1).default([]),
    cycles: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].default(0),
    marks: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(ResonanceMarkSchema).default([]),
    history: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(ResonanceCycleSchema).max(10).default([])
});
const emptyResonance = ()=>({
        slots: [],
        cycles: 0,
        marks: [],
        history: []
    });
const DOMAIN_ORDER = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebDomainSchema"].options;
const orderOf = (domain)=>DOMAIN_ORDER.indexOf(domain);
function advancementDomains(id) {
    const node = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WEB_ADVANCES"].find((item)=>item.id === id);
    if (node) {
        if (!node.convergence) return [
            node.domain
        ];
        const domains = [
            ...new Set([
                ...node.prerequisites,
                ...node.prerequisitesAny
            ].map((pre)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WEB_ADVANCES"].find((item)=>item.id === pre)?.domain).filter((d)=>d !== undefined))
        ].sort((a, b)=>orderOf(a) - orderOf(b));
        return domains.length >= 2 ? [
            domains[0],
            domains[1]
        ] : [
            domains[0] ?? node.domain
        ];
    }
    const heritage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["heritageAdvance"])(id);
    const gate = heritage ? __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WEB_ADVANCES"].find((item)=>item.id === heritage.prerequisite) : undefined;
    return gate ? [
        gate.domain
    ] : null;
}
const advancementSource = (id)=>{
    const node = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WEB_ADVANCES"].find((item)=>item.id === id);
    return node ? node.convergence ? 'CONVERGENCE' : 'WEB' : (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["heritageAdvance"])(id) ? 'HERITAGE' : null;
};
function classifyResonance(slots) {
    const counts = Object.fromEntries(DOMAIN_ORDER.map((domain)=>[
            domain,
            0
        ]));
    for (const slot of slots)for (const domain of new Set(slot.domains))counts[domain]++;
    const ranked = [
        ...DOMAIN_ORDER
    ].sort((a, b)=>counts[b] - counts[a] || orderOf(a) - orderOf(b));
    if (counts[ranked[0]] >= 3) return {
        kind: 'DOMINANT',
        domains: [
            ranked[0]
        ],
        counts
    };
    if (DOMAIN_ORDER.every((domain)=>counts[domain] > 0)) return {
        kind: 'CONFLUENCE',
        domains: [
            ...DOMAIN_ORDER
        ],
        counts
    };
    if (counts[ranked[1]] >= 2) return {
        kind: 'HYBRID',
        domains: [
            ranked[0],
            ranked[1]
        ].sort((a, b)=>orderOf(a) - orderOf(b)),
        counts
    };
    return {
        kind: 'PAIR',
        domains: [
            ranked[0]
        ],
        counts
    };
}
/** Repercussão card ops. Resource keys are the eight resources. */ const ResourceKeySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"]);
_c = ResourceKeySchema;
const RepercussionOpSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].discriminatedUnion('op', [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        op: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('GAIN'),
        resource: ResourceKeySchema,
        n: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(9)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        op: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('LOSE'),
        resource: ResourceKeySchema,
        n: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(9)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        op: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('MOOD'),
        scope: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'CAPITAL',
            'LOWEST',
            'ALL'
        ]),
        delta: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(-2).max(2)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        op: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('PRESTIGE'),
        n: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(5)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        op: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('POPULATION'),
        n: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(3)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        op: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('THREAT'),
        command: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'SPAWN',
            'REINFORCE',
            'ACTIVATE'
        ]),
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'LAND',
            'PIRATE'
        ]).optional()
    })
]);
const ChoiceOptionSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    label: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(120),
    ops: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(RepercussionOpSchema).max(6)
});
const RepercussionCardSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(80),
    kind: CompositionKindSchema,
    domains: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebDomainSchema"]).min(1).max(5),
    /** 'SELF' touches only the owner; 'WORLD' also moves a threat. */ applies: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'SELF',
        'WORLD'
    ]),
    text: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(240),
    price: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(RepercussionOpSchema).max(4),
    options: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
        ChoiceOptionSchema,
        ChoiceOptionSchema
    ]),
    mitigatedBy: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]),
    leveragedBy: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"])
});
const PendingChoiceSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    source: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'REPERCUSSION',
        'ENCOUNTER',
        'PULSE'
    ]),
    cardId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(120),
    text: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(240),
    createdRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    mitigated: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(false),
    options: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(ChoiceOptionSchema).min(2).max(3)
});
const gain = (resource, n)=>({
        op: 'GAIN',
        resource,
        n
    });
const FLAVORS = {
    KNOWLEDGE: {
        boonA: [
            gain('knowledge', 2)
        ],
        boonB: [
            gain('influence', 1),
            gain('culture', 1)
        ],
        price: [
            {
                op: 'MOOD',
                scope: 'CAPITAL',
                delta: -1
            }
        ],
        mitigatedBy: [
            'web-expression-schools'
        ],
        leveragedBy: [
            'web-natural-philosophy'
        ],
        a: 'Revelação',
        b: 'Debate público',
        priceText: 'a capital perde 1 de Ânimo'
    },
    LAND_AND_SEA: {
        boonA: [
            gain('food', 3)
        ],
        boonB: [
            gain('wood', 2),
            gain('wealth', 1)
        ],
        price: [
            {
                op: 'LOSE',
                resource: 'wood',
                n: 1
            }
        ],
        mitigatedBy: [
            'web-irrigation'
        ],
        leveragedBy: [
            'web-crop-rotation'
        ],
        a: 'Colheita',
        b: 'Descoberta de caminhos',
        priceText: 'perde 1 Madeira'
    },
    STONE_AND_METAL: {
        boonA: [
            gain('stone', 2),
            gain('metal', 1)
        ],
        boonB: [
            gain('metal', 2)
        ],
        price: [
            {
                op: 'THREAT',
                command: 'SPAWN',
                kind: 'LAND'
            }
        ],
        mitigatedBy: [
            'web-fortification'
        ],
        leveragedBy: [
            'web-metallurgy'
        ],
        a: 'Filão',
        b: 'Forja acesa',
        priceText: 'o barulho atrai um Acampamento'
    },
    GOVERNMENT: {
        boonA: [
            gain('influence', 2)
        ],
        boonB: [
            gain('culture', 2)
        ],
        price: [
            {
                op: 'MOOD',
                scope: 'LOWEST',
                delta: -1
            }
        ],
        mitigatedBy: [
            'web-continuity-pact'
        ],
        leveragedBy: [
            'web-codes'
        ],
        a: 'Concórdia',
        b: 'Voz do povo',
        priceText: 'a cidade mais abalada perde 1 de Ânimo'
    },
    TRADE: {
        boonA: [
            gain('wealth', 3)
        ],
        boonB: [
            gain('influence', 1),
            gain('wealth', 1)
        ],
        price: [
            {
                op: 'THREAT',
                command: 'SPAWN',
                kind: 'PIRATE'
            }
        ],
        mitigatedBy: [
            'web-logistics'
        ],
        leveragedBy: [
            'web-currency'
        ],
        a: 'Boom mercantil',
        b: 'Rede de contatos',
        priceText: 'cobiça de piratas nas rotas'
    }
};
const lighter = (ops)=>ops.map((op)=>op.op === 'GAIN' ? {
            ...op,
            n: Math.max(1, op.n - 1)
        } : op);
const worldOf = (price)=>price.some((op)=>op.op === 'THREAT') ? 'WORLD' : 'SELF';
const card = (id, name, kind, domains, text, price, a, b, mitigatedBy, leveragedBy)=>RepercussionCardSchema.parse({
        id,
        name,
        kind,
        domains,
        applies: worldOf(price),
        text,
        price,
        options: [
            a,
            b
        ],
        mitigatedBy,
        leveragedBy
    });
function buildCards() {
    const cards = [];
    for (const domain of DOMAIN_ORDER){
        const f = FLAVORS[domain], tag = domain.toLowerCase().replace(/_/g, '-'), name = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WEB_DOMAIN_NAMES"][domain];
        cards.push(card(`rep-dom-${tag}-1`, `${f.a}: maré de ${name}`, 'DOMINANT', [
            domain
        ], `O foco em ${name} volta para você. Preço: ${f.priceText}.`, f.price, {
            id: 'a',
            label: f.a,
            ops: f.boonA
        }, {
            id: 'b',
            label: f.b,
            ops: f.boonB
        }, f.mitigatedBy, f.leveragedBy));
        cards.push(card(`rep-dom-${tag}-2`, `Consagração de ${name}`, 'DOMINANT', [
            domain
        ], `A especialização em ${name} rende reconhecimento. Preço: ${f.priceText}.`, f.price, {
            id: 'a',
            label: 'Prestígio',
            ops: [
                {
                    op: 'PRESTIGE',
                    n: 1
                },
                ...lighter(f.boonA)
            ]
        }, {
            id: 'b',
            label: 'Gente nova',
            ops: [
                {
                    op: 'POPULATION',
                    n: 1
                },
                ...lighter(f.boonB)
            ]
        }, f.mitigatedBy, f.leveragedBy));
        cards.push(card(`rep-pair-${tag}`, `Eco de ${name}`, 'PAIR', [
            domain
        ], 'Um eco leve, sem preço.', [], {
            id: 'a',
            label: f.a,
            ops: lighter(f.boonA)
        }, {
            id: 'b',
            label: f.b,
            ops: lighter(f.boonB)
        }, [], f.leveragedBy));
    }
    for(let i = 0; i < DOMAIN_ORDER.length; i++)for(let j = i + 1; j < DOMAIN_ORDER.length; j++){
        const x = DOMAIN_ORDER[i], y = DOMAIN_ORDER[j], fx = FLAVORS[x], fy = FLAVORS[y];
        cards.push(card(`rep-hybrid-${x.toLowerCase().replace(/_/g, '-')}-${y.toLowerCase().replace(/_/g, '-')}`, `${fx.a} e ${fy.a}`, 'HYBRID', [
            x,
            y
        ], `${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WEB_DOMAIN_NAMES"][x]} e ${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WEB_DOMAIN_NAMES"][y]} se cruzam. Preço: ${fx.priceText}.`, fx.price, {
            id: 'a',
            label: `${fx.a} + ${fy.a}`,
            ops: [
                ...fx.boonA,
                ...lighter(fy.boonA)
            ]
        }, {
            id: 'b',
            label: `${fy.b} + ${fx.b}`,
            ops: [
                ...fy.boonB,
                ...lighter(fx.boonB)
            ]
        }, [
            ...new Set([
                ...fx.mitigatedBy,
                ...fy.mitigatedBy
            ])
        ], [
            ...new Set([
                ...fx.leveragedBy,
                ...fy.leveragedBy
            ])
        ]));
    }
    cards.push(card('rep-confluence-1', 'Confluência: a mesa do mundo', 'CONFLUENCE', [
        ...DOMAIN_ORDER
    ], 'Cinco cores em um ciclo. Grande oportunidade, grande preço.', [
        {
            op: 'MOOD',
            scope: 'ALL',
            delta: -1
        },
        {
            op: 'THREAT',
            command: 'ACTIVATE'
        }
    ], {
        id: 'a',
        label: 'Era de ouro',
        ops: [
            gain('food', 2),
            gain('wealth', 2),
            gain('knowledge', 2),
            {
                op: 'PRESTIGE',
                n: 2
            }
        ]
    }, {
        id: 'b',
        label: 'Geração nova',
        ops: [
            {
                op: 'POPULATION',
                n: 2
            },
            gain('culture', 2),
            gain('influence', 2)
        ]
    }, [], []));
    cards.push(card('rep-confluence-2', 'Confluência: o grande encontro', 'CONFLUENCE', [
        ...DOMAIN_ORDER
    ], 'Todas as trilhas se encontram. O mundo repara.', [
        {
            op: 'LOSE',
            resource: 'wealth',
            n: 2
        },
        {
            op: 'THREAT',
            command: 'REINFORCE',
            kind: 'LAND'
        }
    ], {
        id: 'a',
        label: 'Obra monumental',
        ops: [
            {
                op: 'PRESTIGE',
                n: 3
            },
            gain('stone', 2)
        ]
    }, {
        id: 'b',
        label: 'Escola de gerações',
        ops: [
            gain('knowledge', 3),
            gain('culture', 2),
            {
                op: 'POPULATION',
                n: 1
            }
        ]
    }, [], []));
    return cards;
}
const REPERCUSSION_CARDS = buildCards();
const repercussionCard = (id)=>REPERCUSSION_CARDS.find((item)=>item.id === id);
var _c;
__turbopack_context__.k.register(_c, "ResourceKeySchema");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/alpha-stack.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "STACK_LABEL",
    ()=>STACK_LABEL,
    "StackCategorySchema",
    ()=>StackCategorySchema,
    "StackHexSchema",
    ()=>StackHexSchema,
    "StackUsageSchema",
    ()=>StackUsageSchema,
    "StackViewSchema",
    ()=>StackViewSchema,
    "stackCategory",
    ()=>stackCategory,
    "stackLabel",
    ()=>stackLabel,
    "stackTag",
    ()=>stackTag,
    "stackVerdict",
    ()=>stackVerdict,
    "stackViewVerdict",
    ()=>stackViewVerdict
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-client] (ecmascript)");
;
;
const StackCategorySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'military',
    'civilians',
    'fleets'
]);
const StackUsageSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    used: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    limit: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
});
const StackHexSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    hexId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    city: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    military: StackUsageSchema,
    civilians: StackUsageSchema,
    fleets: StackUsageSchema
});
const StackViewSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    /** Limits on a hex that is not a city. */ defaults: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        military: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        civilians: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        fleets: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
    }),
    hexes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), StackHexSchema)
});
const stackCategory = (entry)=>entry.domain === 'SEA' ? 'fleets' : entry.strength === 0 ? 'civilians' : 'military';
const STACK_LABEL = {
    military: 'Exército',
    civilians: 'Civis',
    fleets: 'Frota'
};
const stackLabel = (category, city)=>category === 'military' && city ? 'Guarnição' : STACK_LABEL[category];
const stackTag = (category, city, usage)=>`${stackLabel(category, city)} ${usage.used}/${usage.limit}`;
function stackVerdict(category, city, usage, moving, hexId) {
    if (moving <= 0 || usage.used + moving <= usage.limit) return null;
    return `Limite de pilha atingido em ${hexId}: ${stackTag(category, city, usage)}, ${moving === 1 ? 'a peça não cabe' : `as ${moving} peças não cabem`}.`;
}
function stackViewVerdict(view, moving, hexId) {
    const hex = view.hexes[hexId];
    for (const category of StackCategorySchema.options){
        const usage = hex ? hex[category] : {
            used: 0,
            limit: view.defaults[category]
        };
        const verdict = stackVerdict(category, hex?.city ?? false, usage, moving.filter((candidate)=>candidate === category).length, hexId);
        if (verdict) return verdict;
    }
    return null;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/alpha-threats.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DISCOVERY_INFO",
    ()=>DISCOVERY_INFO,
    "DISCOVERY_NAMES",
    ()=>DISCOVERY_NAMES,
    "DISCOVERY_WEIGHTS",
    ()=>DISCOVERY_WEIGHTS,
    "DiscoveryKindSchema",
    ()=>DiscoveryKindSchema,
    "ENCOUNTER_CARDS",
    ()=>ENCOUNTER_CARDS,
    "RegionDiscoverySchema",
    ()=>RegionDiscoverySchema,
    "THREAT_NAMES",
    ()=>THREAT_NAMES,
    "ThreatCompositionSchema",
    ()=>ThreatCompositionSchema,
    "ThreatKindSchema",
    ()=>ThreatKindSchema,
    "ThreatLevelSchema",
    ()=>ThreatLevelSchema,
    "ThreatSchema",
    ()=>ThreatSchema,
    "ThreatStatusSchema",
    ()=>ThreatStatusSchema,
    "WORLD_ID",
    ()=>WORLD_ID,
    "encounterCard",
    ()=>encounterCard,
    "isWorld",
    ()=>isWorld,
    "threatComposition",
    ()=>threatComposition,
    "threatPieceIds",
    ()=>threatPieceIds
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-catalog.js [app-client] (ecmascript)");
;
;
;
const WORLD_ID = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"].parse('world');
const isWorld = (id)=>id === WORLD_ID;
const ThreatKindSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'CAMP',
    'PIRATE'
]);
const ThreatStatusSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'CAMPED',
    'MARCHING'
]);
const ThreatLevelSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(1),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(2),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(3)
]);
const ThreatCompositionSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    kind: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaUnitClassSchema"],
    count: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(12)
})).max(6);
const ThreatSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    kind: ThreatKindSchema,
    hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"],
    homeHexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"],
    level: ThreatLevelSchema,
    status: ThreatStatusSchema,
    composition: ThreatCompositionSchema,
    createdRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    lastActedRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    /** The reward of destroying a camp is paid once. */ rewardPaid: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(false),
    /** RECÉM-SURGIDO (D-1): a camp stays vulnerable until one full Planning round has passed; it cannot launch a Bando while fresh. */ fresh: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(false)
});
function threatComposition(kind, level, eraIndex) {
    if (kind === 'PIRATE') return [
        {
            kind: 'FLEET',
            count: level
        }
    ];
    if (level === 1) return [
        {
            kind: 'INFANTRY',
            count: 2
        }
    ];
    if (level === 2) return [
        {
            kind: 'INFANTRY',
            count: 3
        },
        {
            kind: eraIndex >= 2 ? 'CAVALRY' : 'RANGED',
            count: 1
        }
    ];
    return [
        {
            kind: 'INFANTRY',
            count: 4
        },
        {
            kind: 'CAVALRY',
            count: 1
        },
        ...eraIndex >= 4 ? [
            {
                kind: 'SIEGE',
                count: 1
            }
        ] : []
    ];
}
const threatPieceIds = (threat)=>threat.composition.flatMap((entry)=>Array.from({
            length: entry.count
        }, (_, index)=>({
                id: `${threat.id}:${entry.kind}:${index + 1}`,
                kind: entry.kind
            })));
const THREAT_NAMES = {
    CAMP: {
        camp: 'Acampamento',
        band: 'Bando'
    },
    PIRATE: {
        camp: 'Ancoradouro pirata',
        band: 'Piratas'
    }
};
const DiscoveryKindSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'RUIN',
    'DEPOSIT',
    'PASSAGE',
    'ANCHORAGE',
    'DANGER',
    'CAMP',
    'NONE'
]);
const RegionDiscoverySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    kind: DiscoveryKindSchema,
    resolved: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    resolvedBy: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"].nullable().default(null)
});
const DISCOVERY_WEIGHTS = [
    [
        'NONE',
        25
    ],
    [
        'RUIN',
        20
    ],
    [
        'DEPOSIT',
        15
    ],
    [
        'PASSAGE',
        10
    ],
    [
        'ANCHORAGE',
        10
    ],
    [
        'DANGER',
        10
    ],
    [
        'CAMP',
        10
    ]
];
const DISCOVERY_INFO = {
    RUIN: {
        name: 'Vestígio',
        identity: 'Restos de pedra lavrada de um povo que passou por aqui antes de todos.',
        effect: 'Os exploradores encontram algo que pede uma escolha.',
        marker: true
    },
    DEPOSIT: {
        name: 'Jazida',
        identity: 'Um afloramento de rocha rara aparece entre as colinas.',
        effect: '+2 Pedra e +1 Metal; a rocha passa a ter Metal.',
        marker: true
    },
    PASSAGE: {
        name: 'Passagem',
        identity: 'Um caminho natural já aberto liga a região ao resto do mapa.',
        effect: 'Abre até 3 hexes de Estrada na região.',
        marker: true
    },
    ANCHORAGE: {
        name: 'Ancoradouro',
        identity: 'Uma enseada protegida, boa para fundear e pescar.',
        effect: '+1 Riqueza; a primeira costa da região ganha boa pesca.',
        marker: true
    },
    DANGER: {
        name: 'Perigo',
        identity: 'O terreno esconde armadilhas que só se percebem tarde.',
        effect: 'Metade das expedições perde a peça que explorava; o Método Experimental evita o pior.',
        marker: false
    },
    CAMP: {
        name: 'Acampamento',
        identity: 'Fogueiras e tendas: alguém já ocupou esta região.',
        effect: 'Surge um acampamento bárbaro na região.',
        marker: true
    },
    NONE: {
        name: 'Terra comum',
        identity: 'Nada de extraordinário: boa terra para quem chegar.',
        effect: 'Sem efeito.',
        marker: false
    }
};
const DISCOVERY_NAMES = {
    RUIN: 'Vestígio',
    DEPOSIT: 'Jazida',
    PASSAGE: 'Passagem',
    ANCHORAGE: 'Ancoradouro',
    DANGER: 'Perigo',
    CAMP: 'Acampamento Bárbaro',
    NONE: 'Terra comum'
};
const gain = (resource, n)=>({
        op: 'GAIN',
        resource,
        n
    });
const ENCOUNTER_CARDS = [
    {
        id: 'enc-ruin-archive',
        title: 'Arquivo soterrado',
        text: 'Entre as pedras há tabuletas legíveis e uma galeria de estátuas.',
        options: [
            {
                id: 'read',
                label: 'Copiar as tabuletas: +2 Conhecimento',
                ops: [
                    gain('knowledge', 2)
                ]
            },
            {
                id: 'honour',
                label: 'Honrar as estátuas: +2 Cultura',
                ops: [
                    gain('culture', 2)
                ]
            }
        ]
    },
    {
        id: 'enc-ruin-shrine',
        title: 'Santuário esquecido',
        text: 'Um santuário de caminhantes guarda oferendas antigas.',
        options: [
            {
                id: 'offer',
                label: 'Levar as oferendas: +2 Riqueza',
                ops: [
                    gain('wealth', 2)
                ]
            },
            {
                id: 'rite',
                label: 'Cumprir o rito: +1 Cultura e +1 Influência',
                ops: [
                    gain('culture', 1),
                    gain('influence', 1)
                ]
            }
        ]
    },
    {
        id: 'enc-ruin-map',
        title: 'Mapa nas paredes',
        text: 'Uma parede inteira mostra rotas que ninguém lembrava.',
        options: [
            {
                id: 'chart',
                label: 'Copiar o mapa: +1 Conhecimento e +1 Madeira',
                ops: [
                    gain('knowledge', 1),
                    gain('wood', 1)
                ]
            },
            {
                id: 'trade',
                label: 'Vender a cópia: +2 Riqueza',
                ops: [
                    gain('wealth', 2)
                ]
            }
        ]
    },
    {
        id: 'enc-camp-spoils',
        title: 'Despojos do acampamento',
        text: 'O acampamento caído deixou provisões e um prisioneiro que fala.',
        options: [
            {
                id: 'loot',
                label: 'Dividir os despojos: +2 Alimento e +1 Metal',
                ops: [
                    gain('food', 2),
                    gain('metal', 1)
                ]
            },
            {
                id: 'ransom',
                label: 'Negociar o prisioneiro: +2 Influência',
                ops: [
                    gain('influence', 2)
                ]
            }
        ]
    }
];
const encounterCard = (id)=>ENCOUNTER_CARDS.find((card)=>card.id === id);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/alpha-topology.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FLOWER",
    ()=>FLOWER,
    "HOME_SLOTS",
    ()=>HOME_SLOTS,
    "MAP_FOOTPRINT",
    ()=>MAP_FOOTPRINT,
    "MAP_SIZE_NAMES",
    ()=>MAP_SIZE_NAMES,
    "MapSizeSchema",
    ()=>MapSizeSchema,
    "REGION_COUNT",
    ()=>REGION_COUNT,
    "chooseHomelands",
    ()=>chooseHomelands,
    "layoutBoard",
    ()=>layoutBoard,
    "mapSizeAllows",
    ()=>mapSizeAllows,
    "recommendedMapSize",
    ()=>recommendedMapSize,
    "regionDistances",
    ()=>regionDistances
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
;
const REGION_COUNT = 30;
const HOME_SLOTS = 6;
const MapSizeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'COMPACT',
    'STANDARD',
    'WIDE'
]);
const MAP_FOOTPRINT = {
    COMPACT: {
        regions: 24,
        hexes: 168,
        minPlayers: 2,
        maxPlayers: 4
    },
    STANDARD: {
        regions: REGION_COUNT,
        hexes: REGION_COUNT * 7,
        minPlayers: 2,
        maxPlayers: 6
    },
    WIDE: {
        regions: 43,
        hexes: 301,
        minPlayers: 2,
        maxPlayers: 6
    }
};
const MAP_SIZE_NAMES = {
    COMPACT: 'Compacto',
    STANDARD: 'Padrão',
    WIDE: 'Amplo'
};
const mapSizeAllows = (size, players)=>players >= MAP_FOOTPRINT[size].minPlayers && players <= MAP_FOOTPRINT[size].maxPlayers;
const recommendedMapSize = (players)=>players <= 2 ? 'COMPACT' : players <= 4 ? 'STANDARD' : 'WIDE';
/** Region centre offsets of the six neighbouring cells: (i,j) ± (1,0), (0,1), (-1,1). */ const CELL_STEP = [
    [
        1,
        0
    ],
    [
        0,
        1
    ],
    [
        -1,
        1
    ],
    [
        -1,
        0
    ],
    [
        0,
        -1
    ],
    [
        1,
        -1
    ]
];
const FLOWER = [
    [
        0,
        0
    ],
    [
        1,
        0
    ],
    [
        1,
        -1
    ],
    [
        0,
        -1
    ],
    [
        -1,
        0
    ],
    [
        -1,
        1
    ],
    [
        0,
        1
    ]
];
const centerOf = (i, j)=>({
        q: 2 * i - j,
        r: i + 3 * j
    });
const pixel = ({ q, r })=>({
        x: Math.sqrt(3) * (q + r / 2),
        y: 1.5 * r
    });
const cellKey = (i, j)=>`${i}_${j}`;
function layoutBoard(playerCount, seed = 0, size = 'STANDARD') {
    const regionCount = MAP_FOOTPRINT[size].regions;
    const candidates = [];
    for(let i = -7; i <= 7; i++)for(let j = -7; j <= 7; j++){
        const p = pixel(centerOf(i, j));
        candidates.push({
            i,
            j,
            d: Math.hypot(p.x, p.y)
        });
    }
    const chosen = candidates.sort((a, b)=>a.d - b.d || a.i - b.i || a.j - b.j).slice(0, regionCount).sort((a, b)=>a.i - b.i || a.j - b.j);
    // Ids are the reading order of the lattice: region-1 … region-30.
    const ids = new Map(chosen.map((c, index)=>[
            cellKey(c.i, c.j),
            `region-${index + 1}`
        ]));
    const cells = chosen.map(({ i, j })=>{
        const center = centerOf(i, j);
        return {
            id: ids.get(cellKey(i, j)),
            i,
            j,
            center,
            hexes: FLOWER.map(([dq, dr])=>({
                    q: center.q + dq,
                    r: center.r + dr
                })),
            neighbors: CELL_STEP.map(([di, dj])=>ids.get(cellKey(i + di, j + dj))).filter((id)=>id !== undefined)
        };
    });
    const homeSlots = chooseHomelands(cells, playerCount, seed);
    return {
        cells,
        homeSlots
    };
}
function regionDistances(cells, from) {
    const adjacency = new Map(cells.map((cell)=>[
            cell.id,
            cell.neighbors
        ]));
    const dist = new Map([
        [
            from,
            0
        ]
    ]), queue = [
        from
    ];
    for (const id of queue)for (const next of adjacency.get(id) ?? [])if (!dist.has(next)) {
        dist.set(next, dist.get(id) + 1);
        queue.push(next);
    }
    return dist;
}
const hashOf = (text)=>{
    let h = 2166136261;
    for(let k = 0; k < text.length; k++){
        h ^= text.charCodeAt(k);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
};
/**
 * Where the Pátrias go (canon 2026-10): the seats' homeland Regions MAXIMISE the smallest Region-graph distance between any two of them;
 * then the total pairwise distance; then the fairness of the split (each seat's share of the board by nearest Pátria, the most even wins),
 * and last the seed picks among what is still tied. Eligible Regions are those with room to grow (at least five neighbours) and not the
 * middle of the table. No fixed distance anywhere: it is whatever the footprint allows.
 * The six slots: the first `count` are the active seats (in a seed-rotated angular order); the rest are dormant homelands, spread greedily.
 */ /** Optimal layouts depend on the footprint, not only on the seat count: the cache key carries both. */ const tiesCache = new Map();
function chooseHomelands(cells, playerCount, seed) {
    const count = Math.max(2, Math.min(HOME_SLOTS, playerCount));
    const distance = new Map(cells.map((cell)=>[
            cell.id,
            regionDistances(cells, cell.id)
        ]));
    const d = (a, b)=>distance.get(a).get(b);
    const centre = [
        ...cells
    ].sort((a, b)=>Math.hypot(pixel(a.center).x, pixel(a.center).y) - Math.hypot(pixel(b.center).x, pixel(b.center).y) || (a.id < b.id ? -1 : 1))[0];
    const eligible = cells.filter((cell)=>cell.neighbors.length >= 5 && cell.id !== centre.id).map((cell)=>cell.id).sort();
    const scoreOf = (set)=>{
        let min = Infinity, total = 0;
        for(let a = 0; a < set.length; a++)for(let b = a + 1; b < set.length; b++){
            const x = d(set[a], set[b]);
            min = Math.min(min, x);
            total += x;
        }
        // Share of the board by nearest Pátria (ties split): the fairest split has the smallest gap between the biggest and smallest share.
        const share = new Map(set.map((id)=>[
                id,
                0
            ]));
        for (const cell of cells){
            const near = Math.min(...set.map((id)=>d(id, cell.id))), tied = set.filter((id)=>d(id, cell.id) === near);
            for (const id of tied)share.set(id, share.get(id) + 1 / tied.length);
        }
        const shares = [
            ...share.values()
        ];
        return [
            min,
            total,
            -(Math.max(...shares) - Math.min(...shares))
        ];
    };
    // The footprint is fixed, so the optimal layouts per table size are computed once; the seed only picks among them.
    const cacheKey = `${cells.length}:${cells.map((cell)=>cell.id).join(',')}:${count}`;
    let best = null, ties = tiesCache.get(cacheKey) ?? [];
    if (!ties.length) {
        // Depth-first over the same lexicographic combinations, pruned as soon as the smallest pairwise distance can no longer reach the best one.
        const pick = [];
        const walk = (start, runningMin)=>{
            if (best !== null && runningMin < best[0]) return;
            if (pick.length === count) {
                const score = scoreOf(pick);
                const cmp = best === null ? 1 : score[0] - best[0] || score[1] - best[1] || score[2] - best[2] || 0;
                if (cmp > 0) {
                    best = score;
                    ties = [
                        [
                            ...pick
                        ]
                    ];
                } else if (cmp === 0) ties.push([
                    ...pick
                ]);
                return;
            }
            for(let k = start; k <= eligible.length - (count - pick.length); k++){
                const next = eligible[k];
                let min = runningMin;
                for (const other of pick)min = Math.min(min, d(other, next));
                pick.push(next);
                walk(k + 1, min);
                pick.pop();
            }
        };
        walk(0, Infinity);
    }
    tiesCache.set(cacheKey, ties);
    const chosen = ties[hashOf(`${seed}:${count}`) % ties.length];
    // Seats in angular order around the table, rotated by the seed so seat 1 is not always on the same side.
    const angle = (id)=>{
        const cell = cells.find((c)=>c.id === id), p = pixel(cell.center);
        return Math.atan2(p.y, p.x);
    };
    const ring = [
        ...chosen
    ].sort((a, b)=>angle(a) - angle(b));
    const turn = hashOf(`${seed}:turn`) % ring.length;
    const active = [
        ...ring.slice(turn),
        ...ring.slice(0, turn)
    ];
    // Dormant homelands: each next one as far as possible from everything already placed.
    const placed = [
        ...active
    ], rest = eligible.filter((id)=>!placed.includes(id));
    while(placed.length < HOME_SLOTS && rest.length){
        rest.sort((a, b)=>Math.min(...placed.map((id)=>d(id, b))) - Math.min(...placed.map((id)=>d(id, a))) || (a < b ? -1 : 1));
        placed.push(rest.shift());
    }
    return placed;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/alpha-web.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AdvancementSchema",
    ()=>AdvancementSchema,
    "HERITAGE_ADVANCES",
    ()=>HERITAGE_ADVANCES,
    "HeritageAdvanceSchema",
    ()=>HeritageAdvanceSchema,
    "WEB_ADVANCES",
    ()=>WEB_ADVANCES,
    "WEB_DOMAIN_NAMES",
    ()=>WEB_DOMAIN_NAMES,
    "WEB_ROW_COUNT",
    ()=>WEB_ROW_COUNT,
    "WebDomainSchema",
    ()=>WebDomainSchema,
    "advancesUnlocking",
    ()=>advancesUnlocking,
    "heritageAdvance",
    ()=>heritageAdvance,
    "heritageOf",
    ()=>heritageOf,
    "migrateAdvancementId",
    ()=>migrateAdvancementId,
    "migrateResearch",
    ()=>migrateResearch,
    "webAdvance",
    ()=>webAdvance
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$effects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-effects.js [app-client] (ecmascript)");
;
;
;
;
const WebDomainSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'KNOWLEDGE',
    'LAND_AND_SEA',
    'STONE_AND_METAL',
    'GOVERNMENT',
    'TRADE'
]);
const WEB_DOMAIN_NAMES = {
    KNOWLEDGE: 'Saber',
    LAND_AND_SEA: 'Terra e Mar',
    STONE_AND_METAL: 'Pedra e Metal',
    GOVERNMENT: 'Governo',
    TRADE: 'Troca'
};
const AdvancementSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^web-[a-z-]+$/),
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    domain: WebDomainSchema,
    era: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaEraSchema"],
    cost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    /** All of these must be researched. */ prerequisites: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    /** At least one of these must be researched (empty = no such requirement). */ prerequisitesAny: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).default([]),
    /** Researching this closes these for the match (the other side of an OU choice). */ excludes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    /** The OU row this node belongs to, when it is one side of an exclusive choice. */ pair: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().default(null),
    convergence: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    /** ★: the domain's milestone; +3 Prestígio and a Hegemony path becomes eligible. */ milestone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(false),
    effect: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$effects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaEffectSchema"].nullable().default(null),
    unlocks: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()),
    description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1)
});
const knowledge = (amount)=>({
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"])(),
        knowledge: amount
    });
const eraCost = (era)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(era) + 2;
const node = (row)=>AdvancementSchema.parse({
        id: row.id,
        name: row.name,
        domain: row.domain,
        era: row.era,
        cost: knowledge(eraCost(row.era) + (row.convergence ? 2 : 0)),
        prerequisites: row.pre ?? [],
        prerequisitesAny: row.any ?? [],
        excludes: row.excludes ?? [],
        pair: row.pair ?? null,
        convergence: row.convergence ?? false,
        milestone: row.milestone ?? false,
        effect: row.effect ?? null,
        unlocks: row.unlocks,
        description: row.description
    });
const WEB_ADVANCES = [
    // Saber (Conhecimento) — 8
    node({
        id: 'web-writing',
        name: 'Escrita',
        domain: 'KNOWLEDGE',
        era: 'FOUNDATION',
        unlocks: [
            'district:ACADEMIC',
            'building:LIBRARY',
            'building:ARCHIVE',
            'building:SCRIBES_HOUSE'
        ],
        description: 'Abre o distrito Acadêmico, a Biblioteca e o Arquivo.'
    }),
    node({
        id: 'web-mathematics',
        name: 'Matemática',
        domain: 'KNOWLEDGE',
        era: 'EXPANSION',
        pre: [
            'web-writing'
        ],
        unlocks: [
            'rule:elevate-village-stone-discount',
            'rule:explorer-reach-2'
        ],
        description: 'Elevar a Vila custa −1 Pedra; Pioneiro alcança 2.'
    }),
    node({
        id: 'web-natural-philosophy',
        name: 'Filosofia Natural',
        domain: 'KNOWLEDGE',
        era: 'CONSOLIDATION',
        pre: [
            'web-mathematics'
        ],
        unlocks: [
            'building:ACADEMY',
            'rule:first-advance-discount'
        ],
        description: 'Academia; o primeiro avanço de cada domínio por Era custa −1 Conhecimento.'
    }),
    node({
        id: 'web-experimental-method',
        name: 'Método Experimental',
        domain: 'KNOWLEDGE',
        era: 'CIVILIZATION',
        pre: [
            'web-natural-philosophy'
        ],
        unlocks: [
            'building:OBSERVATORY',
            'rule:exploration-preview-danger'
        ],
        description: 'Observatório; prévia de perigo e costa antes de explorar.'
    }),
    node({
        id: 'web-laboratory',
        name: 'Laboratório',
        domain: 'KNOWLEDGE',
        era: 'EMPIRES',
        pre: [
            'web-experimental-method'
        ],
        unlocks: [
            'building:LABORATORY',
            'rule:siege-breach-plus-1'
        ],
        description: 'Laboratório; Cerco +1 Brecha; abre Balística e Agronomia.'
    }),
    node({
        id: 'web-synthesis',
        name: 'Síntese',
        domain: 'KNOWLEDGE',
        era: 'POWERS',
        pre: [
            'web-laboratory'
        ],
        unlocks: [
            'rule:knowledge-limit-plus-3',
            'work:archive-of-horizons'
        ],
        description: 'Limite de Conhecimento +3; Obra Arquivo dos Horizontes.'
    }),
    node({
        id: 'web-public-education',
        name: 'Educação Pública',
        domain: 'KNOWLEDGE',
        era: 'POWERS',
        pre: [
            'web-synthesis',
            'web-codes'
        ],
        unlocks: [
            'rule:scholar-no-library'
        ],
        description: 'Eruditos rendem sem exigir Biblioteca.'
    }),
    node({
        id: 'web-community-of-discovery',
        name: 'Comunidade de Descoberta',
        domain: 'KNOWLEDGE',
        era: 'ASCENSION',
        pre: [
            'web-public-education'
        ],
        milestone: true,
        unlocks: [
            'hegemony:SCIENTIFIC'
        ],
        description: '+3 Prestígio; Hegemonia Científica elegível.'
    }),
    // Terra e Mar (Alimento, exploração) — 8
    node({
        id: 'web-agriculture',
        name: 'Agricultura',
        domain: 'LAND_AND_SEA',
        era: 'FOUNDATION',
        unlocks: [
            'improvement:FARM',
            'district:AGRARIAN',
            'building:GRANARY',
            'elevate:HAMLET'
        ],
        description: 'Fazenda, distrito Agrário, Celeiro; Elevar a Aldeia.'
    }),
    node({
        id: 'web-coastal-navigation',
        name: 'Navegação Costeira',
        domain: 'LAND_AND_SEA',
        era: 'FOUNDATION',
        unlocks: [
            'district:MARITIME',
            'building:PORT',
            'unit:COASTAL_VESSEL',
            'improvement:FISHERY'
        ],
        description: 'Distrito Marítimo, Embarcação Costeira, Pesqueiro.'
    }),
    node({
        id: 'web-irrigation',
        name: 'Irrigação',
        domain: 'LAND_AND_SEA',
        era: 'EXPANSION',
        pre: [
            'web-agriculture'
        ],
        unlocks: [
            'building:IRRIGATION',
            'rule:farm-plus-1',
            'mitigates:drought'
        ],
        description: 'Irrigação: +1 Alimento por Fazenda; mitiga a Seca.'
    }),
    node({
        id: 'web-cartography',
        name: 'Cartografia',
        domain: 'LAND_AND_SEA',
        era: 'EXPANSION',
        pre: [
            'web-coastal-navigation'
        ],
        unlocks: [
            'unit:MERCHANT_SHIP',
            'unit:GALLEY',
            'rule:explorer-ship-reveals-coast-2'
        ],
        description: 'Mercante e Galera; Pioneiro em navio revela costa a 2.'
    }),
    node({
        id: 'web-naval-architecture',
        name: 'Arquitetura Naval',
        domain: 'LAND_AND_SEA',
        era: 'CONSOLIDATION',
        pre: [
            'web-cartography'
        ],
        unlocks: [
            'unit:FLEET',
            'unit:TRANSPORT',
            'building:SHIPYARD'
        ],
        description: 'Galera de Guerra, Nau de Transporte, Estaleiro.'
    }),
    node({
        id: 'web-crop-rotation',
        name: 'Rotação de Culturas',
        domain: 'LAND_AND_SEA',
        era: 'CIVILIZATION',
        pre: [
            'web-irrigation'
        ],
        unlocks: [
            'rule:farm-plus-1',
            'building:MILL'
        ],
        description: '+1 Alimento por Fazenda; Moinho dobra.'
    }),
    node({
        id: 'web-ocean-navigation',
        name: 'Navegação Oceânica',
        domain: 'LAND_AND_SEA',
        era: 'CIVILIZATION',
        pre: [
            'web-naval-architecture',
            'web-mathematics'
        ],
        unlocks: [
            'unit:CARRACK',
            'rule:ocean-crossing',
            'building:LIGHTHOUSE'
        ],
        description: 'Carraca; travessia de oceano; Farol.'
    }),
    node({
        id: 'web-agronomy',
        name: 'Agronomia',
        domain: 'LAND_AND_SEA',
        era: 'POWERS',
        pre: [
            'web-crop-rotation',
            'web-laboratory'
        ],
        unlocks: [
            'rule:farm-plus-1',
            'rule:grow-cost-2-with-granary'
        ],
        description: '+1 Alimento por Fazenda; Crescer custa 2 em cidades com Celeiro.'
    }),
    // Pedra e Metal (construção, guerra) — 9
    node({
        id: 'web-masonry',
        name: 'Alvenaria',
        domain: 'STONE_AND_METAL',
        era: 'FOUNDATION',
        unlocks: [
            'district:INDUSTRIAL',
            'fortification:STONE_WALL',
            'building:WAREHOUSE',
            'elevate:VILLAGE'
        ],
        description: 'Distrito Industrial, Muralha de Pedra, Armazém; Elevar a Vila.'
    }),
    node({
        id: 'web-guard-formations',
        name: 'Formações de Guarda',
        domain: 'STONE_AND_METAL',
        era: 'FOUNDATION',
        unlocks: [
            'district:MILITARY',
            'building:BARRACKS',
            'unit:GUARD'
        ],
        description: 'Distrito Militar, Quartel, Guarda.'
    }),
    node({
        id: 'web-metallurgy',
        name: 'Metalurgia',
        domain: 'STONE_AND_METAL',
        era: 'EXPANSION',
        pre: [
            'web-masonry'
        ],
        unlocks: [
            'improvement:MINE',
            'building:WORKSHOP',
            'unit:RANGED'
        ],
        description: 'Mina, Oficina, Atiradores.'
    }),
    node({
        id: 'web-maneuver-training',
        name: 'Treino de Manobras',
        domain: 'STONE_AND_METAL',
        era: 'EXPANSION',
        pre: [
            'web-guard-formations'
        ],
        unlocks: [
            'unit:CAVALRY',
            'rule:army-7'
        ],
        description: 'Cavalaria; Exército 7.'
    }),
    node({
        id: 'web-engineering',
        name: 'Engenharia',
        domain: 'STONE_AND_METAL',
        era: 'CONSOLIDATION',
        pre: [
            'web-metallurgy'
        ],
        unlocks: [
            'unit:SIEGE',
            'rule:double-road',
            'elevate:CITY'
        ],
        description: 'Cerco, Estrada dupla; Elevar a Cidade.'
    }),
    node({
        id: 'web-fortification',
        name: 'Fortificação',
        domain: 'STONE_AND_METAL',
        era: 'CONSOLIDATION',
        pre: [
            'web-engineering',
            'web-guard-formations'
        ],
        unlocks: [
            'fortification:FORTRESS',
            'rule:free-repair'
        ],
        description: 'Fortaleza; reparo via Governar custa 0.'
    }),
    node({
        id: 'web-iron',
        name: 'Ferro',
        domain: 'STONE_AND_METAL',
        era: 'CIVILIZATION',
        pre: [
            'web-metallurgy'
        ],
        effect: {
            kind: 'STRENGTH',
            amount: 1
        },
        unlocks: [
            'building:FOUNDRY',
            'rule:infantry-plus-1'
        ],
        description: 'Fundição; Infantaria +1 Força (modernização).'
    }),
    node({
        id: 'web-gunpowder',
        name: 'Pólvora',
        domain: 'STONE_AND_METAL',
        era: 'EMPIRES',
        pre: [
            'web-iron',
            'web-laboratory'
        ],
        unlocks: [
            'unit:ARQUEBUSIERS',
            'fortification:BASTION'
        ],
        description: 'Arcabuzeiros; Baluarte.'
    }),
    node({
        id: 'web-artillery',
        name: 'Artilharia',
        domain: 'STONE_AND_METAL',
        era: 'POWERS',
        pre: [
            'web-gunpowder'
        ],
        unlocks: [
            'unit:ARTILLERY',
            'rule:siege-ignores-palisade'
        ],
        description: 'Artilharia; cerco ignora Paliçada.'
    }),
    // Governo (Influência, Cultura) — 8 rows
    node({
        id: 'web-common-narratives',
        name: 'Narrativas Comuns',
        domain: 'GOVERNMENT',
        era: 'FOUNDATION',
        unlocks: [
            'district:CULTURAL',
            'building:TEMPLE',
            'rule:culture-plus-1-per-temple'
        ],
        description: 'Distrito Cultural, Templo; Cultura +1 por Templo.'
    }),
    node({
        id: 'web-codes',
        name: 'Códigos',
        domain: 'GOVERNMENT',
        era: 'EXPANSION',
        pre: [
            'web-common-narratives',
            'web-writing'
        ],
        unlocks: [
            'district:ADMINISTRATIVE',
            'building:CHANCELLERY',
            'rule:envoy-integrates-plus-10',
            'rule:admin-capacity-plus-1'
        ],
        description: 'Distrito Administrativo, Chancelaria; Enviado integra +10; Capacidade Administrativa +1.'
    }),
    node({
        id: 'web-urbanism',
        name: 'Urbanismo',
        domain: 'GOVERNMENT',
        era: 'CONSOLIDATION',
        pre: [
            'web-codes',
            'web-masonry'
        ],
        unlocks: [
            'elevate:GREAT_CITY',
            'building:COURT',
            'rule:admin-capacity-plus-1'
        ],
        description: 'Elevar a Grande Cidade; Tribunal; Capacidade Administrativa +1.'
    }),
    node({
        id: 'web-centralization',
        name: 'Centralização',
        domain: 'GOVERNMENT',
        era: 'CONSOLIDATION',
        pre: [
            'web-codes'
        ],
        excludes: [
            'web-federalization'
        ],
        pair: 'government-iii',
        unlocks: [
            'government:MONARCHY',
            'government:AUTOCRACY',
            'rule:capital-capacity-plus-1'
        ],
        description: 'OU Federalização. Monarquia e Autocracia; capital +1 Capacidade.'
    }),
    node({
        id: 'web-federalization',
        name: 'Federalização',
        domain: 'GOVERNMENT',
        era: 'CONSOLIDATION',
        pre: [
            'web-codes'
        ],
        excludes: [
            'web-centralization'
        ],
        pair: 'government-iii',
        unlocks: [
            'government:CONFEDERATION',
            'government:REPUBLIC',
            'rule:slots-plus-1-village-up'
        ],
        description: 'OU Centralização. Confederação e República; vagas +1 em cidades Vila ou maiores.'
    }),
    node({
        id: 'web-expression-schools',
        name: 'Escolas de Expressão',
        domain: 'GOVERNMENT',
        era: 'CIVILIZATION',
        pre: [
            'web-common-narratives',
            'web-codes'
        ],
        unlocks: [
            'building:THEATER',
            'government:THEOCRACY',
            'rule:govern-culture-recovers-2'
        ],
        description: 'Teatro; Teocracia; Governar com Cultura recupera 2 níveis.'
    }),
    node({
        id: 'web-sanitation',
        name: 'Saneamento',
        domain: 'GOVERNMENT',
        era: 'EMPIRES',
        pre: [
            'web-urbanism',
            'web-natural-philosophy'
        ],
        unlocks: [
            'elevate:METROPOLIS',
            'mitigates:epidemic',
            'rule:famine-grace-round'
        ],
        description: 'Elevar a Metrópole; a fome não tira habitante na primeira rodada.'
    }),
    node({
        id: 'web-continuity-pact',
        name: 'Pacto de Continuidade',
        domain: 'GOVERNMENT',
        era: 'POWERS',
        pre: [
            'web-sanitation'
        ],
        unlocks: [
            'rule:mood-floor-shaken-in-war'
        ],
        description: 'Ânimo nunca cai abaixo de Abalada por guerra.'
    }),
    node({
        id: 'web-council-of-civilizations',
        name: 'Conselho de Civilizações',
        domain: 'GOVERNMENT',
        era: 'ASCENSION',
        pre: [
            'web-continuity-pact'
        ],
        milestone: true,
        unlocks: [
            'hegemony:POLITICAL'
        ],
        description: '+3 Prestígio; Hegemonia Política elegível.'
    }),
    // Troca (Riqueza) — 7 rows
    node({
        id: 'web-exchange',
        name: 'Troca',
        domain: 'TRADE',
        era: 'FOUNDATION',
        unlocks: [
            'district:COMMERCIAL',
            'building:MARKET',
            'rule:surplus-conversion'
        ],
        description: 'Distrito Comercial, Mercado; conversão de excedente.'
    }),
    node({
        id: 'web-currency',
        name: 'Moeda',
        domain: 'TRADE',
        era: 'EXPANSION',
        pre: [
            'web-exchange'
        ],
        unlocks: [
            'building:TREASURY',
            'government:OLIGARCHY',
            'rule:route-plus-1'
        ],
        description: 'Tesouro; Oligarquia; rotas +1 Riqueza.'
    }),
    node({
        id: 'web-regional-market',
        name: 'Mercado Regional',
        domain: 'TRADE',
        era: 'CONSOLIDATION',
        pre: [
            'web-currency'
        ],
        unlocks: [
            'rule:contracts',
            'rule:wealth-covers-60-build'
        ],
        description: 'Contratos Promessa/Empréstimo; Riqueza cobre 60% em Construir.'
    }),
    node({
        id: 'web-logistics',
        name: 'Logística',
        domain: 'TRADE',
        era: 'CIVILIZATION',
        pre: [
            'web-regional-market',
            'web-engineering'
        ],
        unlocks: [
            'improvement:DEPOT',
            'rule:supply-plus-1',
            'rule:transport-cargo-3'
        ],
        description: 'Depósito; suprimento +1; Nau de Transporte carrega 3.'
    }),
    node({
        id: 'web-bank',
        name: 'Banco',
        domain: 'TRADE',
        era: 'EMPIRES',
        pre: [
            'web-regional-market'
        ],
        unlocks: [
            'building:BANK',
            'rule:credit-once-per-era'
        ],
        description: 'Banco; crédito 1× por Era (adianta 5 Riqueza, devolve 6).'
    }),
    node({
        id: 'web-self-sufficiency',
        name: 'Autossuficiência',
        domain: 'TRADE',
        era: 'POWERS',
        pre: [
            'web-bank'
        ],
        excludes: [
            'web-commercial-economy'
        ],
        pair: 'trade-vi',
        unlocks: [
            'rule:productive-district-plus-1',
            'rule:route-minus-1'
        ],
        description: 'OU Economia Comercial. Produzir +1 em cada distrito produtivo; rotas −1.'
    }),
    node({
        id: 'web-commercial-economy',
        name: 'Economia Comercial',
        domain: 'TRADE',
        era: 'POWERS',
        pre: [
            'web-bank'
        ],
        excludes: [
            'web-self-sufficiency'
        ],
        pair: 'trade-vi',
        unlocks: [
            'rule:route-plus-2',
            'rule:merchant-yields-per-1'
        ],
        description: 'OU Autossuficiência. Rotas +2 Riqueza; Mercador rende por 1.'
    }),
    node({
        id: 'web-interdependent-economy',
        name: 'Economia Interdependente',
        domain: 'TRADE',
        era: 'ASCENSION',
        any: [
            'web-self-sufficiency',
            'web-commercial-economy'
        ],
        milestone: true,
        unlocks: [
            'hegemony:ECONOMIC'
        ],
        description: '+3 Prestígio; Hegemonia Econômica elegível.'
    }),
    // Convergências — 10 rows
    node({
        id: 'web-civic-academies',
        name: 'Academias Cívicas',
        domain: 'KNOWLEDGE',
        era: 'CONSOLIDATION',
        pre: [
            'web-natural-philosophy',
            'web-codes'
        ],
        convergence: true,
        unlocks: [
            'government:MERITOCRACY',
            'rule:academy-minus-1-stone',
            'rule:scholar-influence-once-per-era'
        ],
        description: 'Convergência. Meritocracia; Academia custa −1 Pedra; Eruditos rendem Influência 1× por Era.'
    }),
    node({
        id: 'web-coastal-routes',
        name: 'Rotas Costeiras',
        domain: 'LAND_AND_SEA',
        era: 'CONSOLIDATION',
        pre: [
            'web-cartography',
            'web-currency'
        ],
        convergence: true,
        unlocks: [
            'rule:sea-route-plus-2'
        ],
        description: 'Convergência. Rota marítima (porto a porto) rende +2.'
    }),
    node({
        id: 'web-technical-manufactures',
        name: 'Manufaturas Técnicas',
        domain: 'STONE_AND_METAL',
        era: 'CIVILIZATION',
        pre: [
            'web-iron',
            'web-regional-market'
        ],
        convergence: true,
        unlocks: [
            'building:MANUFACTURE',
            'rule:artisan-yields-per-1-with-workshop'
        ],
        description: 'Convergência. Manufatura; Artesão rende por 1 com Oficina.'
    }),
    node({
        id: 'web-deep-defense',
        name: 'Defesa Profunda',
        domain: 'STONE_AND_METAL',
        era: 'CIVILIZATION',
        pre: [
            'web-fortification',
            'web-logistics'
        ],
        excludes: [
            'web-war-of-movement'
        ],
        pair: 'war-iv',
        convergence: true,
        unlocks: [
            'fortification:CITADEL',
            'rule:garrison-plus-2'
        ],
        description: 'Convergência, OU Guerra de Movimento. Cidadela; guarnição +2.'
    }),
    node({
        id: 'web-war-of-movement',
        name: 'Guerra de Movimento',
        domain: 'STONE_AND_METAL',
        era: 'CIVILIZATION',
        pre: [
            'web-fortification',
            'web-logistics'
        ],
        excludes: [
            'web-deep-defense'
        ],
        pair: 'war-iv',
        convergence: true,
        unlocks: [
            'rule:army-8',
            'rule:cavalry-moves-3'
        ],
        description: 'Convergência, OU Defesa Profunda. Exército 8; Cavalaria move 3.'
    }),
    node({
        id: 'web-world-metropolises',
        name: 'Metrópoles do Mundo',
        domain: 'GOVERNMENT',
        era: 'EMPIRES',
        pre: [
            'web-urbanism',
            'web-logistics',
            'web-bank'
        ],
        convergence: true,
        unlocks: [
            'elevate:IMPERIAL_METROPOLIS'
        ],
        description: 'Convergência. Elevar a Metrópole Imperial (Era VII).'
    }),
    node({
        id: 'web-ballistics',
        name: 'Balística',
        domain: 'STONE_AND_METAL',
        era: 'EMPIRES',
        pre: [
            'web-gunpowder',
            'web-experimental-method'
        ],
        convergence: true,
        unlocks: [
            'unit:FRIGATE',
            'rule:artillery-breach-plus-1'
        ],
        description: 'Convergência. Fragata; Artilharia +1 Brecha.'
    }),
    node({
        id: 'web-shared-heritage',
        name: 'Patrimônio Compartilhado',
        domain: 'GOVERNMENT',
        era: 'EMPIRES',
        pre: [
            'web-expression-schools',
            'web-currency'
        ],
        convergence: true,
        unlocks: [
            'building:MONUMENT',
            'rule:rooted-presence-yields-culture'
        ],
        description: 'Convergência. Presença Enraizada rende 1 Cultura por Era; Monumento.'
    }),
    node({
        id: 'web-renaissance',
        name: 'Renascimento',
        domain: 'KNOWLEDGE',
        era: 'POWERS',
        pre: [
            'web-synthesis',
            'web-expression-schools',
            'web-bank'
        ],
        convergence: true,
        unlocks: [
            'work:monument-of-voices',
            'rule:theater-culture-limit-plus-5'
        ],
        description: 'Convergência. Obra Monumento das Vozes; Teatro +5 de limite de Cultura.'
    }),
    node({
        id: 'web-naval-doctrine',
        name: 'Doutrina Naval',
        domain: 'LAND_AND_SEA',
        era: 'POWERS',
        pre: [
            'web-ocean-navigation',
            'web-artillery'
        ],
        convergence: true,
        unlocks: [
            'rule:frigate-plus-1',
            'rule:blockade-with-1-ship'
        ],
        description: 'Convergência. Fragata +1 Força; bloqueio com 1 navio.'
    }),
    node({
        id: 'web-containment-strategy',
        name: 'Estratégia de Contenção',
        domain: 'STONE_AND_METAL',
        era: 'ASCENSION',
        pre: [
            'web-artillery'
        ],
        any: [
            'web-deep-defense',
            'web-war-of-movement'
        ],
        convergence: true,
        milestone: true,
        unlocks: [
            'hegemony:MILITARY'
        ],
        description: 'Convergência ★. +3 Prestígio; Hegemonia Militar elegível.'
    })
];
const WEB_ROW_COUNT = WEB_ADVANCES.length - new Set(WEB_ADVANCES.filter((advance)=>advance.pair).map((advance)=>advance.pair)).size;
const webAdvance = (id)=>WEB_ADVANCES.find((advance)=>advance.id === id);
const advancesUnlocking = (tag)=>WEB_ADVANCES.filter((advance)=>advance.unlocks.includes(tag));
const HeritageAdvanceSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^her-[a-z]+-[1-3]$/),
    civilizationId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    prerequisite: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^web-/),
    era: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaEraSchema"],
    cost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    effect: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'ACTIVE',
        'PLANNED'
    ]).default('PLANNED')
});
const heritageCost = (era, extra)=>{
    const index = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(era);
    return {
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"])(),
        knowledge: index <= 1 ? 3 : index <= 3 ? 5 : 7,
        ...extra
    };
};
const heritage = (civilizationId, rows)=>rows.map(([name, prerequisite, era, extra, effect], index)=>HeritageAdvanceSchema.parse({
            id: `her-${civilizationId}-${index + 1}`,
            civilizationId,
            name,
            prerequisite,
            era,
            cost: heritageCost(era, extra),
            effect
        }));
const HERITAGE_ADVANCES = [
    ...heritage('aurelia', [
        [
            'Reserva em Rede',
            'web-agriculture',
            'FOUNDATION',
            {
                materials: 1
            },
            'Limite de Alimento +4 em cidades conectadas por Estrada.'
        ],
        [
            'Andenes',
            'web-crop-rotation',
            'CIVILIZATION',
            {
                food: 1
            },
            'Fazendas em Colina rendem como em Planície e +1 Alimento.'
        ],
        [
            'Reserva do Inca',
            'web-agronomy',
            'POWERS',
            {
                food: 2
            },
            'Limite de Alimento +5; a Seca custa 1 Alimento a menos em cidades com Celeiro.'
        ]
    ]),
    ...heritage('valgard', [
        [
            'Falange Cerrada',
            'web-guard-formations',
            'EXPANSION',
            {
                materials: 1
            },
            'Infantaria e Guardas custam −1 Madeira/Pedra para recrutar.'
        ],
        [
            'Acrópoles de Refúgio',
            'web-fortification',
            'CONSOLIDATION',
            {
                materials: 1
            },
            'Fortaleza em Colina/Montanha custa −2 Pedra; Paliçada grátis ao fundar em Colina.'
        ],
        [
            'Muralhas Longas',
            'web-deep-defense',
            'POWERS',
            {
                materials: 2
            },
            'Cidades sitiadas não perdem Ânimo; reparo custa 0.'
        ]
    ]),
    ...heritage('meridia', [
        [
            'Tábuas do Karum',
            'web-exchange',
            'FOUNDATION',
            {
                wealth: 1
            },
            'A primeira oferta comercial de cada rodada também rende +1 Influência.'
        ],
        [
            'Canais de Irrigação',
            'web-regional-market',
            'CONSOLIDATION',
            {
                wealth: 1
            },
            'Distrito Agrário custa −1 Pedra para construir.'
        ],
        [
            'Crédito do Templo',
            'web-bank',
            'EMPIRES',
            {
                wealth: 2
            },
            'Crédito 2× por Era; Riqueza cobre 75% em Construir.'
        ]
    ]),
    ...heritage('thalos', [
        [
            'Rotas do Mar do Norte',
            'web-coastal-navigation',
            'FOUNDATION',
            {
                wealth: 1
            },
            'Pioneiro em Embarcação Costeira revela Região costeira a distância 2.'
        ],
        [
            'Quilha e Remo',
            'web-naval-architecture',
            'CONSOLIDATION',
            {
                materials: 1
            },
            'Frotas custam −1 Madeira/Pedra para recrutar.'
        ],
        [
            'Fogos de Sinal',
            'web-ocean-navigation',
            'CIVILIZATION',
            {
                materials: 1
            },
            'Farol custa −2; portos dão visão 2 no mar; bloqueio contra você exige 2 navios.'
        ]
    ]),
    ...heritage('saren', [
        [
            'Pilares de Edito',
            'web-common-narratives',
            'FOUNDATION',
            {
                influence: 1
            },
            'Cada tratado novo que você assina rende +1 Influência.'
        ],
        [
            'Cidades Planejadas',
            'web-codes',
            'EXPANSION',
            {
                influence: 1
            },
            'Elevar uma cidade a Vila ou Cidade custa −1 Pedra.'
        ],
        [
            'Teoria do Mandala',
            'web-continuity-pact',
            'POWERS',
            {
                influence: 2
            },
            'Aliança ativa conta em dobro para a Hegemonia Política.'
        ]
    ]),
    ...heritage('kor', [
        [
            'Fábricas das Legiões',
            'web-metallurgy',
            'EXPANSION',
            {
                materials: 1
            },
            'Oficina custa −1 Madeira; Artesãos rendem Pedra sem escolha.'
        ],
        [
            'Forjas Legionárias',
            'web-iron',
            'CIVILIZATION',
            {
                materials: 1
            },
            'Fundição +5 Metal de limite extra; Mina rende +1 Metal.'
        ],
        [
            'Balistas e Escorpiões',
            'web-artillery',
            'POWERS',
            {
                materials: 2
            },
            'Artilharia e Arcabuzeiros custam −1 Metal.'
        ]
    ]),
    ...heritage('orinth', [
        [
            'Academia de Jixia',
            'web-writing',
            'FOUNDATION',
            {
                knowledge: 1
            },
            'Biblioteca +3 Conhecimento de limite extra.'
        ],
        [
            'Observatório Imperial',
            'web-experimental-method',
            'CIVILIZATION',
            {
                materials: 1
            },
            'Observatório custa −2; prévia de recurso antes de explorar.'
        ],
        [
            'Síntese das Cem Escolas',
            'web-synthesis',
            'POWERS',
            {
                knowledge: 2
            },
            'Convergências custam −1 Conhecimento.'
        ]
    ]),
    ...heritage('nymara', [
        [
            'Canais da Cheia',
            'web-agriculture',
            'FOUNDATION',
            {
                food: 1
            },
            'Fazendas irrigadas: o Distrito Agrário rende +1 Alimento a mais quando a cidade Produz.'
        ],
        [
            'Celeiros do Faraó',
            'web-expression-schools',
            'CIVILIZATION',
            {
                influence: 1
            },
            'Limite de Alimento +4; a Fome não reduz o Ânimo das cidades com Celeiro.'
        ],
        [
            'Obras da Eternidade',
            'web-shared-heritage',
            'EMPIRES',
            {
                influence: 2
            },
            'Cada passo de uma Obra de Legado custa 1 Pedra a menos.'
        ]
    ]),
    ...heritage('veyra', [
        [
            'Câmara de Trocas',
            'web-exchange',
            'FOUNDATION',
            {
                wealth: 1
            },
            'Enviados custam −1 Riqueza.'
        ],
        [
            'Padrões de Confiança',
            'web-regional-market',
            'CONSOLIDATION',
            {
                influence: 1
            },
            'Contratos com Veyra nunca entram em mora na primeira rodada.'
        ],
        [
            'Encruzilhada do Mundo',
            'web-commercial-economy',
            'POWERS',
            {
                wealth: 2
            },
            'Rotas internacionais contam em dobro para a Hegemonia Econômica.'
        ]
    ]),
    ...heritage('solenne', [
        [
            'Anciãos do Portão',
            'web-common-narratives',
            'FOUNDATION',
            {
                influence: 1
            },
            'Governar na capital recupera +1 Ânimo.'
        ],
        [
            'Aliança e Lei',
            'web-civic-academies',
            'CONSOLIDATION',
            {
                influence: 1
            },
            'Trocar de Governo não abala a capital.'
        ],
        [
            'Tribos Reunidas',
            'web-council-of-civilizations',
            'ASCENSION',
            {
                influence: 2
            },
            'Um povo integrado conta como dois para a Hegemonia Política.'
        ]
    ]),
    ...heritage('dravik', [
        [
            'Postas Reais',
            'web-masonry',
            'FOUNDATION',
            {
                materials: 1
            },
            'Peças sobre uma Estrada movem +1 por rodada.'
        ],
        [
            'Satrapias',
            'web-urbanism',
            'CONSOLIDATION',
            {
                materials: 1
            },
            'Capacidade administrativa +1 em cidades conectadas por Estrada.'
        ],
        [
            'Depósitos Reais',
            'web-logistics',
            'CIVILIZATION',
            {
                materials: 2
            },
            'Depósitos alcançam 2 hexes.'
        ]
    ]),
    ...heritage('elyra', [
        [
            'Escola Itinerante',
            'web-writing',
            'FOUNDATION',
            {
                knowledge: 1
            },
            'Revelar uma Região rende +1 Conhecimento.'
        ],
        [
            'Curadoria de Saberes',
            'web-natural-philosophy',
            'CONSOLIDATION',
            {
                knowledge: 1
            },
            'Biblioteca +3 Conhecimento de limite extra.'
        ],
        [
            'Vínculos Comunitários',
            'web-public-education',
            'POWERS',
            {
                influence: 2
            },
            'Eruditos rendem +1 Cultura a cada 2.'
        ]
    ]),
    ...heritage('kaedor', [
        [
            'Caravanas do Deserto',
            'web-exchange',
            'FOUNDATION',
            {
                wealth: 1
            },
            'Rota terrestre atravessa Deserto sem Estrada.'
        ],
        [
            'Entrepostos de Oásis',
            'web-regional-market',
            'CONSOLIDATION',
            {
                wealth: 1
            },
            'Comercial em Deserto rende +1 Riqueza e +1 Alimento.'
        ],
        [
            'Casa das Balanças',
            'web-bank',
            'EMPIRES',
            {
                wealth: 2
            },
            'Crédito 2× por Era.'
        ]
    ]),
    ...heritage('lumaris', [
        [
            'Luz dos Arquivos',
            'web-writing',
            'FOUNDATION',
            {
                knowledge: 1
            },
            'Arquivo custa −1 Madeira.'
        ],
        [
            'Observadores da Costa',
            'web-cartography',
            'EXPANSION',
            {
                knowledge: 1
            },
            'Farol dá prévia de perigo no mar.'
        ],
        [
            'Academia do Horizonte',
            'web-renaissance',
            'POWERS',
            {
                knowledge: 2
            },
            'Obra Arquivo dos Horizontes custa −3.'
        ]
    ]),
    ...heritage('targan', [
        [
            'Marcha das Estepes',
            'web-maneuver-training',
            'EXPANSION',
            {
                food: 1
            },
            'Cavalaria custa −1 Alimento de manutenção.'
        ],
        [
            'Arqueiros Montados',
            'web-iron',
            'CIVILIZATION',
            {
                materials: 1
            },
            'Atiradores movem 2.'
        ],
        [
            'Horda Disciplinada',
            'web-war-of-movement',
            'CIVILIZATION',
            {
                materials: 2
            },
            'Exército 9.'
        ]
    ]),
    ...heritage('iskara', [
        [
            'Fogo Sagrado',
            'web-common-narratives',
            'FOUNDATION',
            {
                influence: 1
            },
            'Templo recupera 1 Ânimo por Era sem Ordem.'
        ],
        [
            'Guardiões do Templo',
            'web-fortification',
            'CONSOLIDATION',
            {
                materials: 1
            },
            'Cidade com Templo e Fortaleza nunca entra em Revolta por cerco.'
        ],
        [
            'Chama Perene',
            'web-continuity-pact',
            'POWERS',
            {
                influence: 2
            },
            'Teocracia não paga o custo extra de Saber.'
        ]
    ]),
    ...heritage('veloria', [
        [
            'Rota das Moedas',
            'web-currency',
            'EXPANSION',
            {
                wealth: 1
            },
            'Tesouro +5 Riqueza de limite extra.'
        ],
        [
            'Prismas de Veloria',
            'web-coastal-routes',
            'CONSOLIDATION',
            {
                wealth: 1
            },
            'Rota marítima rende +1 Cultura.'
        ],
        [
            'Bolsa das Marés',
            'web-interdependent-economy',
            'ASCENSION',
            {
                wealth: 2
            },
            'Riqueza no limite conta como atendida com 80% do limite.'
        ]
    ]),
    ...heritage('norvak', [
        [
            'Presas do Norte',
            'web-guard-formations',
            'FOUNDATION',
            {
                food: 1
            },
            'Guardas em Floresta +1 Força.'
        ],
        [
            'Inverno Longo',
            'web-irrigation',
            'EXPANSION',
            {
                food: 1
            },
            'Fome não reduz Ânimo em cidades com Celeiro.'
        ],
        [
            'Flocos de Norvak',
            'web-naval-doctrine',
            'POWERS',
            {
                materials: 2
            },
            'Fragata move +1 em mar frio.'
        ]
    ])
];
const heritageOf = (civilizationId)=>HERITAGE_ADVANCES.filter((advance)=>advance.civilizationId === civilizationId);
const heritageAdvance = (id)=>HERITAGE_ADVANCES.find((advance)=>advance.id === id);
function migrateAdvancementId(id) {
    const match = /^adv-(\d)-(\d)-(\d)$/.exec(id);
    if (!match) return id;
    const era = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options[Math.min(6, Number(match[1]) - 1)];
    const domain = [
        'KNOWLEDGE',
        'GOVERNMENT',
        'TRADE',
        'STONE_AND_METAL',
        'LAND_AND_SEA'
    ][Number(match[2]) - 1] ?? 'KNOWLEDGE';
    const branch = Number(match[3]) - 1;
    const inEra = WEB_ADVANCES.filter((advance)=>advance.domain === domain && advance.era === era && !advance.convergence);
    const candidates = inEra.length ? inEra : WEB_ADVANCES.filter((advance)=>advance.domain === domain);
    return candidates[Math.min(branch, candidates.length - 1)].id;
}
function migrateResearch(ids) {
    const owned = new Set();
    const visit = (id)=>{
        if (owned.has(id)) return;
        const advance = webAdvance(id);
        if (!advance) {
            if (heritageAdvance(id)) owned.add(id);
            return;
        }
        for (const prerequisite of advance.prerequisites)visit(prerequisite);
        if (advance.prerequisitesAny.length && !advance.prerequisitesAny.some((candidate)=>owned.has(candidate))) visit(advance.prerequisitesAny[0]);
        owned.add(id);
    };
    for (const id of ids)visit(migrateAdvancementId(id));
    return WEB_ADVANCES.filter((advance)=>owned.has(advance.id)).map((advance)=>advance.id).concat([
        ...owned
    ].filter((id)=>id.startsWith('her-')));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/alpha-web.js [app-client] (ecmascript) <export WEB_ADVANCES as ADVANCEMENTS>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ADVANCEMENTS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WEB_ADVANCES"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-client] (ecmascript)");
}),
"[project]/packages/game-domain/dist/alpha.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ACTION_CLASS",
    ()=>ACTION_CLASS,
    "ActionClassSchema",
    ()=>ActionClassSchema,
    "AlphaCommandSchema",
    ()=>AlphaCommandSchema,
    "AlphaEventSchema",
    ()=>AlphaEventSchema,
    "AlphaOrderTypeSchema",
    ()=>AlphaOrderTypeSchema,
    "AlphaPresetSchema",
    ()=>AlphaPresetSchema,
    "AlphaRulesSchema",
    ()=>AlphaRulesSchema,
    "AlphaStateSchema",
    ()=>AlphaStateSchema,
    "FortificationSnapshotSchema",
    ()=>FortificationSnapshotSchema,
    "HegemonyDeclarationSchema",
    ()=>HegemonyDeclarationSchema,
    "HegemonyMetricSchema",
    ()=>HegemonyMetricSchema,
    "HegemonyPathSchema",
    ()=>HegemonyPathSchema,
    "ORDER_NAMES",
    ()=>ORDER_NAMES,
    "PlannedActionSchema",
    ()=>PlannedActionSchema,
    "ResolutionEventSchema",
    ()=>ResolutionEventSchema,
    "ResolutionEventTypeSchema",
    ()=>ResolutionEventTypeSchema,
    "ResourceDealSchema",
    ()=>ResourceDealSchema,
    "RoundLedgerSchema",
    ()=>RoundLedgerSchema,
    "STARTING_PIONEERS_DEFAULT",
    ()=>STARTING_PIONEERS_DEFAULT,
    "ShockOutcomeSchema",
    ()=>ShockOutcomeSchema,
    "StrategicOrderSchema",
    ()=>StrategicOrderSchema,
    "TacticalRollSchema",
    ()=>TacticalRollSchema,
    "TreatyTypeSchema",
    ()=>TreatyTypeSchema,
    "UnitClassSchema",
    ()=>UnitClassSchema,
    "UnitSchema",
    ()=>UnitSchema,
    "UrbanBuildTargetSchema",
    ()=>UrbanBuildTargetSchema,
    "actionClassForCommand",
    ()=>actionClassForCommand,
    "alphaRules",
    ()=>alphaRules,
    "emptyOrderCount",
    ()=>emptyOrderCount,
    "orderTypeForCommand",
    ()=>orderTypeForCommand,
    "orderTypeForOrder",
    ()=>orderTypeForOrder,
    "orderTypeForPlanned",
    ()=>orderTypeForPlanned,
    "upgradeToV51b",
    ()=>upgradeToV51b
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/model.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-catalog.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-institutions.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-client] (ecmascript) <export WEB_ADVANCES as ADVANCEMENTS>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$effects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-effects.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-cards.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-legacy-works.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-leaders.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-topology.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$civilization$2d$kits$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-civilization-kits.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-threats.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-resonance.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/territory.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
const AlphaPresetSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'QUICK',
    'STANDARD',
    'EPIC'
]);
const TreatyTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'TRADE_AGREEMENT',
    'NON_AGGRESSION_PACT',
    'OPEN_BORDERS',
    'DEFENSIVE_PACT',
    'ALLIANCE',
    'EMBARGO'
]);
/** A treaty's resource exchange, in the seven resources. Deals saved before used the legacy pool; they are read with the same split as legacy gains. */ const DealPoolSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(_c = (value)=>value && typeof value === 'object' && 'materials' in value ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["legacyToAlphaResources"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"].parse(value)) : value, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaResourcePoolSchema"]);
_c1 = DealPoolSchema;
const ResourceDealSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    give: DealPoolSchema,
    receive: DealPoolSchema
});
const HegemonyPathSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'MILITARY',
    'ECONOMIC',
    'SCIENTIFIC',
    'CULTURAL',
    'POLITICAL',
    'TERRITORIAL'
]);
const HegemonyMetricSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'strength',
    'victories',
    'foreignPresence',
    'wealth',
    'internationalRoutes',
    'tradePartners',
    'eraFiveResearch',
    'academicDistricts',
    'scientificProjects',
    'influence',
    'culturalDistricts',
    'foreignInfluence',
    'treatyPartners',
    'politicalProjects',
    'territory',
    'developedCities',
    'withinCapacity'
]);
const HegemonyDeclarationSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    path: HegemonyPathSchema,
    declaredRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    qualifiedSince: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"].nullable()
});
const STARTING_PIONEERS_DEFAULT = 2;
const AlphaRulesSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    preset: AlphaPresetSchema,
    roundLimit: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    baseCommandPoints: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    /** Rounds in each of the seven Eras (canon §1: 5 by default, 3–7 configurable). Matches saved before V5.1a read 5. */ roundsPerEra: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"].default(5),
    /** Orders per round (canon §1: 5 by default, 3–6 configurable). Matches saved with the old 7-action economy read 6. */ actionsPerRound: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess((value)=>typeof value === 'number' ? Math.min(6, Math.max(3, value)) : value, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(3).max(6).optional()),
    hegemonyHoldRounds: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    handLimit: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    advisorLimit: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    unitLimit: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    /** Pioneiros each civilization starts with (canon change 2026-10-05: one civil piece replaces Explorador + Pioneiro). Older saves read 2. */ startingPioneers: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(3).default(STARTING_PIONEERS_DEFAULT),
    integrationCost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    occupationStabilityPenalty: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    hegemonyRequirements: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(HegemonyPathSchema, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        metric: HegemonyMetricSchema,
        minimum: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
    })).min(3)),
    cardsPerRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    eventEvery: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    roadCost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    advisorCost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    treatyDuration: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    routeIncome: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    foreignRouteIncome: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    /** Classes added later (e.g. COASTAL_VESSEL) are filled from the catalogue, so older saved matches stay valid. */ units: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess((value)=>{
        if (!value || typeof value !== 'object') return value;
        const { EXPLORER: _e, PIONEER: _p, ...rest } = value;
        void _e;
        void _p;
        return {
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["alphaUnitCatalog"])(),
            ...rest
        };
    }, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaUnitClassSchema"], __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UnitCatalogEntrySchema"])),
    movementCosts: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'UNKNOWN',
        'PLAINS',
        'FOREST',
        'HILLS',
        'MOUNTAINS',
        'COAST',
        'SEA'
    ]), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]),
    supplyRadius: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    milestones: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaEraMilestoneSchema"]).min(1),
    planningSeconds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(0),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(180),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(300),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(480),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(3600),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(14400),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(28800)
    ]),
    worldPreset: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MapPresetSchema"],
    /** Footprint of the board (Regions of seven hexes). Older saves default to the original 30-Region Padrão. */ mapSize: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MapSizeSchema"].default('STANDARD'),
    /** Playtest only: the whole map and every piece are visible to everyone. Never on for a real match. */ revealMap: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(false),
    balance: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaBalanceSchema"],
    combat: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CombatConfigSchema"]
});
function alphaRules(preset = 'STANDARD', worldPreset = 'MIXED', actionsPerRound = 5) {
    const roundsPerEra = {
        QUICK: 3,
        STANDARD: 5,
        EPIC: 7
    }[preset];
    return AlphaRulesSchema.parse({
        preset,
        roundLimit: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.length * roundsPerEra,
        roundsPerEra,
        baseCommandPoints: 4,
        actionsPerRound,
        hegemonyHoldRounds: 2,
        startingPioneers: STARTING_PIONEERS_DEFAULT,
        handLimit: 5,
        advisorLimit: 2,
        unitLimit: 24,
        planningSeconds: 0,
        integrationCost: {
            food: 0,
            materials: 0,
            wealth: 0,
            knowledge: 0,
            influence: 3
        },
        occupationStabilityPenalty: 15,
        hegemonyRequirements: {
            MILITARY: [
                {
                    metric: 'strength',
                    minimum: 12
                },
                {
                    metric: 'victories',
                    minimum: 2
                },
                {
                    metric: 'foreignPresence',
                    minimum: 2
                }
            ],
            ECONOMIC: [
                {
                    metric: 'wealth',
                    minimum: 30
                },
                {
                    metric: 'internationalRoutes',
                    minimum: 2
                },
                {
                    metric: 'tradePartners',
                    minimum: 1
                }
            ],
            SCIENTIFIC: [
                {
                    metric: 'eraFiveResearch',
                    minimum: 2
                },
                {
                    metric: 'academicDistricts',
                    minimum: 2
                },
                {
                    metric: 'scientificProjects',
                    minimum: 1
                }
            ],
            CULTURAL: [
                {
                    metric: 'influence',
                    minimum: 25
                },
                {
                    metric: 'culturalDistricts',
                    minimum: 2
                },
                {
                    metric: 'foreignInfluence',
                    minimum: 3
                }
            ],
            POLITICAL: [
                {
                    metric: 'treatyPartners',
                    minimum: 1
                },
                {
                    metric: 'foreignInfluence',
                    minimum: 3
                },
                {
                    metric: 'politicalProjects',
                    minimum: 1
                }
            ],
            TERRITORIAL: [
                {
                    metric: 'territory',
                    minimum: preset === 'QUICK' ? 10 : preset === 'EPIC' ? 18 : 14
                },
                {
                    metric: 'developedCities',
                    minimum: preset === 'QUICK' ? 2 : 3
                },
                {
                    metric: 'withinCapacity',
                    minimum: 1
                }
            ]
        },
        cardsPerRound: 2,
        eventEvery: 2,
        roadCost: {
            food: 0,
            materials: 1,
            wealth: 0,
            knowledge: 0,
            influence: 0
        },
        advisorCost: {
            food: 0,
            materials: 0,
            wealth: 3,
            knowledge: 2,
            influence: 0
        },
        treatyDuration: 3,
        routeIncome: 2,
        foreignRouteIncome: 1,
        units: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["alphaUnitCatalog"])(),
        movementCosts: {
            UNKNOWN: 1,
            PLAINS: 1,
            FOREST: 2,
            HILLS: 2,
            MOUNTAINS: 3,
            COAST: 1,
            SEA: 1
        },
        supplyRadius: 3,
        worldPreset,
        balance: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["alphaBalance"])(),
        milestones: structuredClone(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ALPHA_ERA_MILESTONES"]),
        combat: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["alphaCombatConfig"])()
    });
}
const UrbanBuildTargetSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].discriminatedUnion('kind', [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('DISTRICT'),
        district: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DistrictTypeSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('BUILDING'),
        building: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BuildingTypeSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('FORTIFICATION')
    }),
    /** Distrito Marítimo: needs a real navigable-water edge; the basic Porto is included in it (never bought apart). */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('MARITIME')
    })
]);
const RoundLedgerSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    round: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    opening: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    production: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    mining: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    trade: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    institutions: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    other: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    losses: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    expenses: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    upkeepRequired: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    upkeepPaid: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    discarded: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    cities: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        population: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        stability: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }))
});
const TacticalRollSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    unitId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    face: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TacticalFaceSchema"],
    effect: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(160).default(''),
    grade: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(3).default(1)
});
const ShockOutcomeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'TIE',
    'VICTORY',
    'DECISIVE'
]);
const FortificationSnapshotSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    level: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FortificationLevelSchema"],
    state: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FortificationStateSchema"]
});
const UnitClassSchema = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaUnitClassSchema"];
const UnitSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    ownerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    kind: UnitClassSchema,
    hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"],
    recruitedRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    /** The own fleet carrying this land piece, or null. A carried piece shares its fleet's hex and moves with it. */ carrierId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"].nullable().optional()
});
const StrategicOrderSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].discriminatedUnion('type', [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('EXPLORE'),
        unitId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        target: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"],
        rotation: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(0).max(5)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('MOVE'),
        unitIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]).min(1).max(24),
        path: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"]).min(1).max(12)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('ATTACK'),
        unitIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]).min(1).max(24),
        target: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"],
        posture: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BattlePostureSchema"].default('ASSAULT')
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('TRADE'),
        fromCityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        toCityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('INFLUENCE'),
        unitId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        target: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"]
    })
]);
const PlannedActionSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].discriminatedUnion('type', [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('URBAN_ACTION'),
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        action: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UrbanActionTypeSchema"],
        build: UrbanBuildTargetSchema.optional(),
        unit: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaUnitClassSchema"].optional(),
        count: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(6).optional(),
        advancementId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"].optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('PROPOSE_TREATY'),
        recipientId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        treaty: TreatyTypeSchema,
        deal: ResourceDealSchema
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('DECLARE_WAR'),
        targetId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"]
    }),
    /** An Influência Order reserved in the last round of an Era; it executes at step 5 of the Era turn (canon §16, I-7). */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('GOVERNMENT_REFORM'),
        government: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GovernmentTypeSchema"]
    })
]);
const StrategicPlayerSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    civilization: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"].nullable(),
    era: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LegacyAlphaEraSchema"],
    resources: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaResourcePoolSchema"].default(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"]),
    legacyCulturalTrack: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].default(0),
    spentCommands: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    /** Orders already committed this round, by type (canon §2). Reserved orders are typed from the queue itself. */ ordersSpent: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'CITY',
        'EXPEDITION',
        'ADVANCE',
        'INFLUENCE',
        'LEGACY'
    ]), __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]).default({
        CITY: 0,
        EXPEDITION: 0,
        ADVANCE: 0,
        INFLUENCE: 0,
        LEGACY: 0
    }),
    ready: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    prestige: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    /** Era of the last government reform (at most one per Era, canon §16) and of the last Ambição swap (one per Era turn). */ governmentReformEra: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaEraSchema"].nullable().default(null),
    ambitionSwapEra: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaEraSchema"].nullable().default(null),
    /** Researched Web and Heritage ids. Pre-V5.1a `adv-*` ids are read as their closest Web node. */ research: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess((value)=>Array.isArray(value) && value.some((id)=>typeof id === 'string' && id.startsWith('adv-')) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["migrateResearch"])(value) : value, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"])),
    hand: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]),
    ambitions: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]),
    completedAmbitions: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]),
    advisors: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]),
    knownHexIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"]),
    orders: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(StrategicOrderSchema),
    plannedActions: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(PlannedActionSchema).default([]),
    victories: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    exploredRegions: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    foreignInfluence: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    contacts: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"]),
    abilityRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    /** Posture this civilization holds when attacked. Private until a battle reveals it. */ defensePosture: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BattlePostureSchema"].default('HOLD'),
    /** V51B-01: owner-defined order in which combat kinds are lost (first listed dies first). `order` is the civilization default, `byHex` overrides it for the stack standing on a hex. Empty = the engine's own rule. */ casualtyPriority: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        order: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaUnitClassSchema"]).max(10).default([]),
        byHex: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaUnitClassSchema"]).max(10)).default({})
    }).default({
        order: [],
        byHex: {}
    }),
    /** The civilization's permanent leader (assigned automatically) and whether this Era's ability was used. */ leader: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LeaderStateSchema"].nullable().default(null),
    influencedCities: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"]),
    /** Ressonância: 5 sockets, permanent marks and the last cycles (canon §18). */ resonance: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResonanceStateSchema"].default(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResonance"]),
    /** Repercussão / Encontro / Pulso choices waiting for this player. Only the owner ever sees them. */ pendingChoices: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PendingChoiceSchema"]).default([]),
    hegemony: HegemonyDeclarationSchema.nullable(),
    ambitionsChosen: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    cardsPlayed: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    /** Own civilization cards played, one entry per card and Era (each unlocked card is playable once per Era). */ civilizationCardsPlayed: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        cardId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        era: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LegacyAlphaEraSchema"]
    })).default([]),
    temporaryEffects: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        source: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        effect: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$effects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaEffectSchema"],
        round: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
    }))
});
const AlphaEventSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    round: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    type: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    audience: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"]).nullable(),
    message: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(1000)
});
const ResolutionEventTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'MOVEMENT',
    'EXPLORATION',
    'FOUNDATION',
    'PRODUCTION',
    'CONSTRUCTION',
    'RECRUITMENT',
    'RESEARCH',
    'TRADE',
    'INFLUENCE',
    'COMBAT',
    'LOSSES',
    'RETREAT',
    'ADVANCE',
    'FAILURE',
    'ROUND_EVENT'
]);
const ResolutionEventSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    round: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    type: ResolutionEventTypeSchema,
    actorId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"].nullable(),
    visibleTo: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"]).nullable(),
    message: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(1000),
    hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"].optional(),
    cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"].optional(),
    unitIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]).default([])
});
const AlphaStateBase = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    schemaVersion: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(5),
    gameId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GameIdSchema"],
    version: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    /** Rules generation the match runs on. Saves without it are V5.1a and are upgraded on read (`upgradeToV51b`). */ rulesVersion: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'v5.1a',
        'v5.1b'
    ]).default('v5.1b'),
    alphaVersion: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('0.1.0-alpha.1').default('0.1.0-alpha.1'),
    phase: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaRoundPhaseSchema"].default('WORLD_PULSE'),
    privateRng: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        algorithm: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('hmac-sha256-counter-v1'),
        seed: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^[a-f0-9]{64}$/),
        counter: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    core: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GameStateSchema"],
    rules: AlphaRulesSchema,
    players: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(StrategicPlayerSchema).min(2).max(6),
    initiative: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"]).min(2).max(6),
    units: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(UnitSchema),
    roads: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"]),
    regions: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        templateId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        hexIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"]).length(7),
        rotation: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(0).max(5),
        revealedBy: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"]),
        discovery: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RegionDiscoverySchema"].optional()
    })),
    occupations: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        occupierId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        previousOwnerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        sinceRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
    })),
    treaties: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        proposerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        recipientId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        type: TreatyTypeSchema,
        status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'PROPOSED',
            'ACCEPTED',
            'ACTIVE',
            'DECLINED',
            'ENDED'
        ]),
        deal: ResourceDealSchema,
        createdRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        expiresRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
    })),
    wars: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"]
    ])),
    routes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        ownerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        fromCityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        toCityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        path: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"]).min(1),
        suspended: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
    })),
    cards: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        worldDeck: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]),
        strategyDeck: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]),
        ambitionDeck: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]),
        advisorDeck: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]),
        discarded: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]),
        advisorMarket: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]),
        worldEvent: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"].nullable(),
        worldEventRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        worldResponded: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"])
    }),
    legacyWorks: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LegacyWorkProgressSchema"]),
    cities: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaCitySchema"]).default([]),
    cultureContests: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        round: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        attackerCivilizationId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        defenderCivilizationId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        attackDice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"].max(6),
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"].max(6)
        ]),
        defenseDice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"].max(6),
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"].max(6)
        ]),
        attackModifier: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        defenseModifier: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        attackTotal: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        defenseTotal: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        winnerCivilizationId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        loserCivilizationId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]
    })).default([]),
    tradeOffers: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TradeOfferSchema"]).default([]),
    independents: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IndependentPeopleSchema"]).default([]),
    worldPulse: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        deck: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]),
        discard: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]),
        current: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WorldPulseCardSchema"].nullable(),
        resolvedRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }).default({
        deck: [],
        discard: [],
        current: null,
        resolvedRound: 0
    }),
    /** World threats (V5.1b §21b): Acampamentos, Bandos and pirate Ancoradouros. */ threats: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ThreatSchema"]).default([]),
    /** Placeholder filled by the Era turn slice; read-only data until then. */ /** The Era turn in progress (canon §22): which Era is closing, the step it waits at (7) and the public log of steps 1–6. */ eraTurn: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        era: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaEraSchema"],
        step: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(9),
        log: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
            step: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(9),
            summary: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(400)
        }))
    }).nullable().default(null),
    roundLedgers: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(RoundLedgerSchema).default([]),
    resolutionEvents: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(ResolutionEventSchema).default([]),
    telemetry: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaTelemetrySchema"],
    roundReports: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        round: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        opening: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
        institutions: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
        trade: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
        mining: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"].default(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"]),
        production: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"].default(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"]),
        other: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"].default(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"]),
        losses: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"].default(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"]),
        expenses: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"].default(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"]),
        discarded: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"].default(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"]),
        economy: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EconomyBreakdownSchema"].nullable(),
        upkeepRequired: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
        upkeepPaid: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
        closing: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
        cities: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
            cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
            populationBefore: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            populationAfter: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            stabilityBefore: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
            stabilityAfter: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
        })),
        administrativeLoad: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        administrativeCapacity: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        resolution: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(ResolutionEventSchema).default([])
    })),
    battles: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        round: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"],
        attackerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        defenderId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        attackerUnits: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]),
        defenderUnits: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]),
        attackerPosture: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BattlePostureSchema"].default('ASSAULT'),
        defenderPosture: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BattlePostureSchema"].default('HOLD'),
        attackBreakdown: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BattleModifierSchema"]).default([]),
        defenseBreakdown: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BattleModifierSchema"]).default([]),
        attackerTactical: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(TacticalRollSchema).default([]),
        defenderTactical: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(TacticalRollSchema).default([]),
        /** Fortification of the defended city before and after the battle (a siege can damage or breach it). */ fortification: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
            cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
            before: FortificationSnapshotSchema,
            after: FortificationSnapshotSchema
        }).nullable().default(null),
        attackStrength: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        defenseStrength: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        attackModifiers: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int(),
        defenseModifiers: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int(),
        /** Legacy two-dice rolls of matches resolved before tactical combat; absent on tactical battles. */ /** V5.1b: Δ = attack − defense and its reading; absent on battles resolved before the single shock. */ delta: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().optional(),
        outcome: ShockOutcomeSchema.optional(),
        attackDice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"].max(6),
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"].max(6)
        ]).optional(),
        defenseDice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"].max(6),
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"].max(6)
        ]).optional(),
        attackTotal: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int(),
        defenseTotal: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int(),
        winnerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        losses: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]),
        retreat: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"].nullable()
    })),
    winner: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        reason: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'HEGEMONY',
            'ROUND_LIMIT'
        ]),
        round: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
    }).nullable(),
    events: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(AlphaEventSchema)
}).superRefine(_c2 = (state, ctx)=>{
    const fail = (message)=>ctx.addIssue({
            code: 'custom',
            message
        });
    const owners = new Set(state.core.players.map((p)=>p.id));
    const civilizations = new Map(state.players.map((player)=>[
            player.playerId,
            player.civilization ?? state.cities.find((city)=>city.originalOwnerId === player.playerId)?.nativeIdentity
        ]));
    for (const city of state.cities){
        const presenceIds = city.foreignPresence.map((presence)=>presence.civilizationId);
        if (new Set(presenceIds).size !== presenceIds.length) fail('Duplicate cultural presence');
        const ownerCivilization = civilizations.get(city.currentOwnerId);
        if (ownerCivilization !== null && ownerCivilization !== undefined && presenceIds.includes(ownerCivilization)) fail('Owner cannot have foreign presence');
        if (city.culturalAnchor !== null && !city.foreignPresence.some((presence)=>presence.civilizationId === city.culturalAnchor && presence.level === 'PREDOMINANT')) fail('Invalid cultural anchor');
    }
    if (new Set(state.roundReports.map((r)=>`${r.playerId}:${r.round}`)).size !== state.roundReports.length) fail('Duplicate round report');
    for (const report of state.roundReports){
        if (!owners.has(report.playerId) || report.round > state.core.round) fail('Invalid round report');
        for (const key of [
            'food',
            'materials',
            'wealth',
            'knowledge',
            'influence'
        ]){
            const expected = report.opening[key] + report.institutions[key] + report.trade[key] + report.mining[key] + report.production[key] + report.other[key] + (report.economy?.netChange[key] ?? 0) - report.losses[key] - report.expenses[key] - report.upkeepPaid[key] - report.discarded[key];
            if (expected !== report.closing[key] || report.upkeepPaid[key] > report.upkeepRequired[key]) fail(`Round report arithmetic mismatch (${report.playerId} ${key}: expected ${expected}, closing ${report.closing[key]}, upkeep ${report.upkeepPaid[key]}/${report.upkeepRequired[key]})`);
        }
    }
    const cardZones = [
        ...state.cards.worldDeck,
        ...state.cards.strategyDeck,
        ...state.cards.ambitionDeck,
        ...state.cards.advisorDeck,
        ...state.cards.discarded,
        ...state.cards.advisorMarket,
        ...state.cards.worldEvent ? [
            state.cards.worldEvent
        ] : [],
        ...state.players.flatMap((p)=>[
                ...p.hand,
                ...p.ambitions,
                ...p.advisors
            ])
    ];
    if (new Set(cardZones).size !== cardZones.length || cardZones.some((id)=>!__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ALPHA_CARDS"].some((c)=>c.id === id))) fail('Invalid or multiply owned card');
    if (state.players.some((p)=>p.hand.some((id)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ALPHA_CARDS"].find((c)=>c.id === id)?.family !== 'STRATEGY') || p.advisors.some((id)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ALPHA_CARDS"].find((c)=>c.id === id)?.family !== 'ADVISOR') || p.ambitions.some((id)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ALPHA_CARDS"].find((c)=>c.id === id)?.family !== 'AMBITION') || p.completedAmbitions.some((id)=>!p.ambitions.includes(id)))) fail('Invalid private card family');
    if (state.cards.worldResponded.some((id)=>!owners.has(id)) || new Set(state.cards.worldResponded).size !== state.cards.worldResponded.length || state.cards.worldEventRound > state.core.round) fail('Invalid world-event response');
    const identities = state.players.map((p)=>p.civilization).filter((id)=>id !== null);
    if (new Set(identities).size !== identities.length) fail('Civilizations must be exclusive');
    if (state.gameId !== state.core.gameId) fail('Aggregate game identity mismatch');
    if (state.players.length !== owners.size || new Set(state.players.map((p)=>p.playerId)).size !== owners.size || state.players.some((p)=>!owners.has(p.playerId))) fail('Strategic players must match economic players');
    if (state.initiative.length !== owners.size || new Set(state.initiative).size !== owners.size || state.initiative.some((p)=>!owners.has(p))) fail('Initiative must contain each player exactly once');
    if (state.core.status === 'FINISHED' !== (state.winner !== null)) fail('Finished state requires exactly one valid outcome');
    if (state.winner && (!owners.has(state.winner.playerId) || state.winner.round > state.core.round)) fail('Invalid winner');
    if (state.winner?.reason === 'ROUND_LIMIT' && state.winner.round < state.rules.roundLimit) fail('Premature round-limit outcome');
    if (state.winner?.reason === 'HEGEMONY') {
        const declaration = state.players.find((p)=>p.playerId === state.winner.playerId)?.hegemony;
        if (declaration?.qualifiedSince == null || state.winner.round - declaration.qualifiedSince < state.rules.hegemonyHoldRounds) fail('Hegemony outcome lacks consolidation');
    }
    const hexes = new Map(state.core.map.map((t)=>[
            t.id,
            t
        ]));
    const regionHexes = state.regions.flatMap((r)=>r.hexIds);
    if (new Set(state.regions.map((r)=>r.id)).size !== state.regions.length || new Set(regionHexes).size !== regionHexes.length || regionHexes.some((id)=>!hexes.has(id)) || state.regions.some((r)=>r.revealedBy.some((id)=>!owners.has(id)))) fail('Invalid region ownership or geometry');
    if (new Set(state.roads).size !== state.roads.length || state.roads.some((id)=>!hexes.has(id) || [
            'SEA',
            'UNKNOWN'
        ].includes(hexes.get(id).terrain))) fail('Invalid roads');
    const cities = state.core.players.flatMap((p)=>p.civilization.cities);
    if (state.cities.length !== cities.length || state.cities.some((meta)=>!cities.some((city)=>city.id === meta.cityId && city.ownerId === meta.currentOwnerId))) fail('Alpha city metadata must match economic cities');
    if (new Set(state.cities.map((city)=>city.cityId)).size !== state.cities.length) fail('Duplicate alpha city metadata');
    if (new Set(state.legacyWorks.map((w)=>w.workId)).size !== state.legacyWorks.length || new Set(state.legacyWorks.map((w)=>w.cityId)).size !== state.legacyWorks.length || state.legacyWorks.some((w)=>!__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LEGACY_WORKS"].some((g)=>g.id === w.workId) || !cities.some((c)=>c.id === w.cityId && c.ownerId === w.ownerId) || w.startedRound > state.core.round || w.completedRound === null === w.stepsDone >= __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LEGACY_WORK_STEPS"] || w.completedRound !== null && w.completedRound > state.core.round)) fail('Invalid or duplicate Obra de Legado');
    if (new Set(state.treaties.map((t)=>t.id)).size !== state.treaties.length || state.treaties.some((t)=>!owners.has(t.proposerId) || !owners.has(t.recipientId) || t.proposerId === t.recipientId || t.expiresRound < t.createdRound || t.createdRound > state.core.round)) fail('Invalid treaty');
    if (state.wars.some(([a, b])=>!owners.has(a) || !owners.has(b) || a >= b) || new Set(state.wars.map((p)=>p.join(':'))).size !== state.wars.length) fail('Invalid war relation');
    if (new Set(state.routes.map((r)=>r.id)).size !== state.routes.length || state.routes.some((r)=>!owners.has(r.ownerId) || !cities.some((c)=>c.id === r.fromCityId && c.ownerId === r.ownerId) || !cities.some((c)=>c.id === r.toCityId) || r.fromCityId === r.toCityId || r.path.some((id)=>!hexes.has(id)))) fail('Invalid trade route');
    if (new Set(state.occupations.map((o)=>o.cityId)).size !== state.occupations.length || state.occupations.some((o)=>!owners.has(o.previousOwnerId) || o.previousOwnerId === o.occupierId || !cities.some((c)=>c.id === o.cityId && c.ownerId === o.occupierId) || o.sinceRound > state.core.round)) fail('Invalid city occupation');
    if (new Set(state.units.map((u)=>u.id)).size !== state.units.length) fail('Duplicate unit');
    for (const unit of state.units){
        const tile = hexes.get(unit.hexId);
        if (!owners.has(unit.ownerId) || !tile || unit.recruitedRound > state.core.round) fail('Invalid unit owner, position or round');
        const carrier = unit.carrierId ? state.units.find((candidate)=>candidate.id === unit.carrierId) : null;
        const sea = (kind)=>state.rules.units[kind].domain === 'SEA';
        if (unit.carrierId && (sea(unit.kind) || !carrier || !sea(carrier.kind) || carrier.ownerId !== unit.ownerId || carrier.hexId !== unit.hexId)) fail('Invalid carrier');
        if (tile && (sea(unit.kind) ? ![
            'COAST',
            'SEA'
        ].includes(tile.terrain) : tile.terrain === 'UNKNOWN' || tile.terrain === 'SEA' && !carrier)) fail('Unit on illegal terrain');
    }
    for (const fleet of state.units.filter((unit)=>state.rules.units[unit.kind].domain === 'SEA')){
        const load = state.units.filter((unit)=>unit.carrierId === fleet.id).reduce((total, unit)=>total + (state.rules.units[unit.kind].cargo ?? 1), 0);
        if (load > (state.rules.units[fleet.kind].transport ?? 0) + (fleet.kind === 'FLEET' ? 1 : 0)) fail('Fleet over its transport capacity');
    }
    for (const player of state.players){
        if (new Set(player.influencedCities).size !== player.influencedCities.length || player.influencedCities.some((id)=>!cities.some((c)=>c.id === id)) || player.foreignInfluence !== player.influencedCities.length) fail('Invalid foreign influence');
        if (player.hegemony && (player.era !== 'ASCENSION' || player.hegemony.declaredRound > state.core.round || player.hegemony.qualifiedSince !== null && (player.hegemony.qualifiedSince < player.hegemony.declaredRound || player.hegemony.qualifiedSince > state.core.round))) fail('Invalid hegemony declaration');
        if (player.civilization !== null && !__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CIVILIZATIONS"].some((c)=>c.id === player.civilization)) fail('Unknown civilization');
        if (player.leader !== null && __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LEADERS"].find((l)=>l.id === player.leader.leaderId)?.civilizationId !== player.civilization) fail('Leader must belong to the player civilization');
        if (player.research.some((id)=>!__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].some((a)=>a.id === id) && !__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HERITAGE_ADVANCES"].some((a)=>a.id === id))) fail('Unknown advancement');
        for (const id of player.research){
            const heritage = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HERITAGE_ADVANCES"].find((a)=>a.id === id);
            if (heritage && (heritage.civilizationId !== player.civilization || !player.research.includes(heritage.prerequisite))) fail('Illegal heritage research');
            const node = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].find((a)=>a.id === id);
            if (!node) continue;
            if (node.prerequisites.some((p)=>!player.research.includes(p)) || node.prerequisitesAny.length > 0 && !node.prerequisitesAny.some((p)=>player.research.includes(p)) || node.excludes.some((p)=>player.research.includes(p)) || __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(node.era) > __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(player.era)) fail('Illegal research prerequisites, exclusion or era');
        }
        const kitCards = new Set((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$civilization$2d$kits$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["civilizationKit"])(player.civilization)?.cards.map((card)=>card.id) ?? []);
        if (player.civilizationCardsPlayed.some((entry)=>!kitCards.has(entry.cardId)) || new Set(player.civilizationCardsPlayed.map((entry)=>`${entry.cardId}:${entry.era}`)).size !== player.civilizationCardsPlayed.length) fail('Invalid civilization card play');
        if (player.contacts.some((id)=>!owners.has(id) || id === player.playerId) || new Set(player.contacts).size !== player.contacts.length || player.abilityRound > state.core.round) fail('Invalid contact or ability timing');
        for (const ids of [
            player.research,
            player.hand,
            player.ambitions,
            player.completedAmbitions,
            player.advisors,
            player.knownHexIds,
            [
                ...player.orders.map((o)=>o.id),
                ...player.plannedActions.map((action)=>action.id)
            ]
        ])if (new Set(ids).size !== ids.length) fail('Duplicate exclusive player item');
        if (player.knownHexIds.some((id)=>!hexes.has(id))) fail('Unknown knowledge coordinate');
        if (player.hand.length > state.rules.handLimit || player.advisors.length > state.rules.advisorLimit || state.units.filter((u)=>u.ownerId === player.playerId).length > state.rules.unitLimit) fail('Player component limit exceeded');
    }
    for (const event of state.events)if (event.round > state.core.round || event.audience?.some((id)=>!owners.has(id))) fail('Invalid event audience or round');
    if (new Set(state.resolutionEvents.map((event)=>event.id)).size !== state.resolutionEvents.length) fail('Duplicate resolution event');
    for (const event of state.resolutionEvents)if (event.round > state.core.round || event.actorId !== null && !owners.has(event.actorId) || event.visibleTo?.some((id)=>!owners.has(id))) fail('Invalid resolution event');
    if (new Set(state.threats.map((t)=>t.id)).size !== state.threats.length || state.threats.some((t)=>!hexes.has(t.hexId) || !hexes.has(t.homeHexId) || t.composition.length === 0)) fail('Invalid threat');
    for (const battle of state.battles){
        if (!hexes.has(battle.hexId) || !owners.has(battle.attackerId) && battle.attackerId !== __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WORLD_ID"] || !owners.has(battle.defenderId) && battle.defenderId !== __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WORLD_ID"] || battle.attackerId === battle.defenderId || battle.round > state.core.round) fail('Invalid battle participants');
        const legacyAttack = battle.attackDice ? battle.attackDice[0] + battle.attackDice[1] : 0, legacyDefense = battle.defenseDice ? battle.defenseDice[0] + battle.defenseDice[1] : 0;
        if (battle.attackTotal !== battle.attackStrength + battle.attackModifiers + legacyAttack || battle.defenseTotal !== battle.defenseStrength + battle.defenseModifiers + legacyDefense) fail('Battle arithmetic mismatch');
        if (!battle.attackDice && (battle.attackBreakdown.reduce((n, m)=>n + m.amount, 0) !== battle.attackModifiers || battle.defenseBreakdown.reduce((n, m)=>n + m.amount, 0) !== battle.defenseModifiers)) fail('Battle breakdown mismatch');
        if (battle.outcome !== undefined && (battle.delta !== battle.attackTotal - battle.defenseTotal || battle.outcome !== (Math.abs(battle.delta) < state.rules.combat.mediumMargin ? 'TIE' : Math.abs(battle.delta) >= state.rules.combat.largeMargin ? 'DECISIVE' : 'VICTORY'))) fail('Battle delta mismatch');
        if (battle.winnerId !== (battle.outcome === 'TIE' ? battle.defenderId : battle.attackTotal > battle.defenseTotal ? battle.attackerId : battle.defenderId)) fail('Battle winner mismatch');
    }
});
_c3 = AlphaStateBase;
function upgradeToV51b(raw) {
    return migrateColonists(migrateGreatProjects(fillGovernments(upgradeBody(raw))));
}
/** Canon change: the Explorador was merged into the Pioneiro. Old Explorador/Settler pieces become Pioneiros in place (ids stay) and the save says so. */ function migrateColonists(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
    const input = value, units = Array.isArray(input.units) ? input.units : [];
    if (!units.some((unit)=>[
            'EXPLORER',
            'SETTLER'
        ].includes(unit.kind ?? ''))) return value;
    const events = Array.isArray(input.events) ? input.events : [];
    const round = typeof input.core?.round === 'number' ? input.core.round : 1;
    return {
        ...input,
        units: units.map((unit)=>[
                'EXPLORER',
                'SETTLER'
            ].includes(unit.kind ?? '') ? {
                ...unit,
                kind: 'PIONEER'
            } : unit),
        events: [
            ...events,
            {
                id: `event-${events.length + 1}`,
                round,
                type: 'SAVE_UPGRADED',
                audience: null,
                message: 'O Explorador foi unido ao Pioneiro: uma só peça civil que explora e funda.'
            }
        ]
    };
}
/** D-3: saved Grandes Projetos (one completed step each) become completed Obras de Legado; the old ids are mapped and nothing is dropped silently. */ function migrateGreatProjects(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
    const input = value;
    if (!('projects' in input) && 'legacyWorks' in input) return value;
    const { projects, ...rest } = input;
    const old = Array.isArray(projects) ? projects : [];
    const legacyWorks = old.map((project)=>({
            workId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LEGACY_WORK_ID_ALIASES"][project.projectId ?? ''] ?? project.projectId,
            ownerId: project.ownerId,
            cityId: project.cityId,
            stepsDone: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LEGACY_WORK_STEPS"],
            startedRound: project.completedRound,
            completedRound: project.completedRound
        }));
    const events = Array.isArray(rest.events) ? rest.events : [];
    const round = typeof rest.core?.round === 'number' ? rest.core.round : 1;
    return {
        ...rest,
        legacyWorks,
        events: legacyWorks.length ? [
            ...events,
            {
                id: `event-${events.length + 1}`,
                round,
                type: 'SAVE_UPGRADED',
                audience: null,
                message: 'Os Grandes Projetos agora são Obras de Legado (regras V5.1b).'
            }
        ] : events
    };
}
/** Matches saved before Meritocracia and Autocracia exist carry no legacy modifier row for them; they read as the neutral Conselho row (the Alpha never uses these rows). */ function fillGovernments(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
    const input = value, core = input.core;
    const table = core?.config?.governmentModifiers;
    if (!table || !table.PROTO_GOVERNANCE || table.MERITOCRACY && table.AUTOCRACY) return value;
    return {
        ...input,
        core: {
            ...core,
            config: {
                ...core.config,
                governmentModifiers: {
                    ...table,
                    MERITOCRACY: table.MERITOCRACY ?? table.PROTO_GOVERNANCE,
                    AUTOCRACY: table.AUTOCRACY ?? table.PROTO_GOVERNANCE
                }
            }
        }
    };
}
function upgradeBody(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
    const input = raw;
    if (input.schemaVersion !== 5) return raw;
    if (input.rulesVersion === 'v5.1b') return refreshCombatCatalog(migrateRaidBands(input));
    const { pressure: _dropped, ...rest } = input;
    void _dropped;
    const players = Array.isArray(rest.players) ? rest.players.map((player)=>{
        if (!player || typeof player !== 'object' || player.resonance !== undefined) return player;
        const research = Array.isArray(player.research) ? player.research : [];
        const marks = research.flatMap((id)=>{
            const domains = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["advancementDomains"])(id);
            return domains && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["advancementSource"])(id) ? [
                {
                    advancementId: id,
                    domains,
                    round: 0
                }
            ] : [];
        });
        return {
            ...player,
            resonance: {
                ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResonance"])(),
                marks
            }
        };
    }) : rest.players;
    const events = Array.isArray(rest.events) ? rest.events : [];
    const round = typeof rest.core?.round === 'number' ? rest.core.round : 1;
    return refreshCombatCatalog(migrateRaidBands({
        ...rest,
        rulesVersion: 'v5.1b',
        players,
        events: [
            ...events,
            {
                id: `event-${events.length + 1}`,
                round,
                type: 'SAVE_UPGRADED',
                audience: null,
                message: 'Partida atualizada para as regras V5.1b: a Pressão do Mundo foi substituída pela Ressonância.'
            }
        ]
    }));
}
/** I-5/I-21: the pre-V5.1b raid bands become level-I/II Acampamentos (a band of strength 3+ is level II). Saves without `raidBands` are untouched. */ function migrateRaidBands(input) {
    if (!('raidBands' in input)) return input;
    const { raidBands, ...rest } = input;
    const round = typeof rest.core?.round === 'number' ? rest.core.round : 1;
    const bands = Array.isArray(raidBands) ? raidBands : [];
    const existing = Array.isArray(rest.threats) ? rest.threats : [];
    const threats = bands.filter((band)=>typeof band.hexId === 'string').map((band, index)=>{
        const level = (band.strength ?? 2) >= 3 ? 2 : 1;
        return {
            id: `camp-${band.id ?? index + 1}`,
            kind: 'CAMP',
            hexId: band.hexId,
            homeHexId: band.hexId,
            level,
            status: 'CAMPED',
            composition: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["threatComposition"])('CAMP', level, 0),
            createdRound: 0,
            lastActedRound: round,
            rewardPaid: false,
            fresh: false
        };
    });
    const events = Array.isArray(rest.events) ? rest.events : [];
    return {
        ...rest,
        threats: [
            ...existing,
            ...threats
        ],
        events: threats.length ? [
            ...events,
            {
                id: `event-${events.length + 1}`,
                round,
                type: 'SAVE_UPGRADED',
                audience: null,
                message: 'Os bandos de fronteira agora são Acampamentos com Ameaça I–III (regras V5.1b).'
            }
        ] : events
    };
}
/** I-13: saves whose combat config lacks the V5.1b `shock` marker get the V5.1b unit and combat catalogs, with a public event. */ function refreshCombatCatalog(input) {
    const rules = input.rules;
    const combat = rules?.combat;
    if (!rules || !combat || combat.shock === true) return input;
    const events = Array.isArray(input.events) ? input.events : [];
    const round = typeof input.core?.round === 'number' ? input.core.round : 1;
    return {
        ...input,
        rules: {
            ...rules,
            units: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["alphaUnitCatalog"])(),
            combat: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["alphaCombatConfig"])()
        },
        events: [
            ...events,
            {
                id: `event-${events.length + 1}`,
                round,
                type: 'SAVE_UPGRADED',
                audience: null,
                message: 'Combate atualizado para as regras V5.1b: um choque tático, Δ, Graus I–III e assinaturas por família.'
            }
        ]
    };
}
const AlphaStateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(upgradeToV51b, AlphaStateBase);
const AlphaCommandSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].discriminatedUnion('type', [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('URBAN_ACTION'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        planId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"].optional(),
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        action: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UrbanActionTypeSchema"],
        build: UrbanBuildTargetSchema.optional(),
        unit: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaUnitClassSchema"].optional(),
        count: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(6).optional(),
        advancementId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"].optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('PROPOSE_TRADE'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        recipientId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        offerType: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'TRADE_INSTANT',
            'GIFT',
            'FUTURE_PROMISE',
            'LOAN'
        ]),
        offer: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaResourcePoolSchema"],
        request: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaResourcePoolSchema"],
        treatyTerms: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]).max(4),
        dueRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"].nullable()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('RESPOND_TRADE'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        offerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        accept: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('CONTEST_PRESENCE'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        defenderCivilizationId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('INDEPENDENT_ACTION'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        peopleId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        action: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'TRADE',
            'NEGOTIATE',
            'INFLUENCE',
            'PROTECT',
            'INTEGRATE',
            'CONQUER'
        ])
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('SETTLE'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        unitId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1).max(80)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('DECLARE_HEGEMONY'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        path: HegemonyPathSchema
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('CHOOSE_AMBITIONS'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        cardIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]).length(2)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('PLAY_CARD'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        cardId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]
    }),
    /** Plays a card from the civilization board (DEC-011 kit), not from the hand. */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('PLAY_CIVILIZATION_CARD'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        cardId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('HIRE_ADVISOR'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        cardId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('WORLD_CHOICE'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        choice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'RESOURCE',
            'PRESTIGE'
        ])
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('ADVANCE_LEGACY_WORK'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        workId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('PROPOSE_TREATY'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        planId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"].optional(),
        recipientId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        treaty: TreatyTypeSchema,
        deal: ResourceDealSchema
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('RESPOND_TREATY'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        treatyId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        accept: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('END_TREATY'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        treatyId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('DECLARE_WAR'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        planId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"].optional(),
        targetId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('LEADER_ABILITY'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('SET_DEFENSE_POSTURE'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        posture: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BattlePostureSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('SET_CASUALTY_PRIORITY'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        order: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlphaUnitClassSchema"]).max(10),
        hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"].nullable().default(null)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('BUILD_ROAD'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"]
    }),
    /** Naval vertical slice (DEC-014): land pieces board an adjacent own fleet, or step from it to an adjacent land hex. */ /** Demobilization (canon §6): a land piece inside an own city returns as one Disponível. */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('DEMOBILIZE'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        unitId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('EMBARK'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        unitIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]).min(1).max(6),
        fleetId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('DISEMBARK'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        unitIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]).min(1).max(6),
        hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('MANAGE'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        command: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GameCommandSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('QUEUE_ORDER'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        order: StrategicOrderSchema
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('CANCEL_ORDER'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        orderId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('RESOLVE_CHOICE'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        choiceId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
        optionId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]
    }),
    /** Era turn step 7: replaces one unfinished Ambição with the next from the deck. */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('SWAP_AMBITION'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        cardId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('READY'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    /** Withdraws a READY while others are still deciding, so a misclick does not forfeit the phase. */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('UNREADY'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    })
]);
const AlphaOrderTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'CITY',
    'EXPEDITION',
    'ADVANCE',
    'INFLUENCE',
    'LEGACY'
]);
const ORDER_NAMES = {
    CITY: 'Cidade',
    EXPEDITION: 'Expedição',
    ADVANCE: 'Avanço',
    INFLUENCE: 'Influência',
    LEGACY: 'Legado'
};
const emptyOrderCount = ()=>({
        CITY: 0,
        EXPEDITION: 0,
        ADVANCE: 0,
        INFLUENCE: 0,
        LEGACY: 0
    });
const orderTypeForOrder = (order)=>order.type === 'TRADE' || order.type === 'INFLUENCE' ? 'INFLUENCE' : 'EXPEDITION';
const orderTypeForPlanned = (action)=>action.type === 'URBAN_ACTION' ? action.action === 'RESEARCH' ? 'ADVANCE' : 'CITY' : 'INFLUENCE';
const ActionClassSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'MAIN',
    'FREE',
    'REACTION'
]);
const ACTION_CLASS = {
    URBAN_ACTION: 'MAIN',
    PROPOSE_TRADE: 'MAIN',
    RESPOND_TRADE: 'FREE',
    CONTEST_PRESENCE: 'MAIN',
    INDEPENDENT_ACTION: 'MAIN',
    SETTLE: 'MAIN',
    DECLARE_HEGEMONY: 'MAIN',
    CHOOSE_AMBITIONS: 'FREE',
    PLAY_CARD: 'FREE',
    PLAY_CIVILIZATION_CARD: 'FREE',
    HIRE_ADVISOR: 'MAIN',
    WORLD_CHOICE: 'FREE',
    ADVANCE_LEGACY_WORK: 'MAIN',
    PROPOSE_TREATY: 'MAIN',
    RESPOND_TREATY: 'FREE',
    END_TREATY: 'FREE',
    DECLARE_WAR: 'MAIN',
    LEADER_ABILITY: 'FREE',
    SET_DEFENSE_POSTURE: 'FREE',
    SET_CASUALTY_PRIORITY: 'FREE',
    BUILD_ROAD: 'MAIN',
    DEMOBILIZE: 'MAIN',
    EMBARK: 'MAIN',
    DISEMBARK: 'MAIN',
    MANAGE: 'MAIN',
    QUEUE_ORDER: 'MAIN',
    CANCEL_ORDER: 'FREE',
    READY: 'FREE',
    UNREADY: 'FREE',
    RESOLVE_CHOICE: 'FREE',
    SWAP_AMBITION: 'FREE'
};
function orderTypeForCommand(command, phase) {
    if (actionClassForCommand(command, phase) !== 'MAIN') return null;
    switch(command.type){
        case 'URBAN_ACTION':
            return command.action === 'RESEARCH' ? 'ADVANCE' : 'CITY';
        case 'QUEUE_ORDER':
            return orderTypeForOrder(command.order);
        case 'SETTLE':
        case 'EMBARK':
        case 'DISEMBARK':
        case 'DEMOBILIZE':
            return 'EXPEDITION';
        case 'MANAGE':
            return command.command.type === 'ADOPT_GOVERNMENT' ? 'INFLUENCE' : 'CITY';
        case 'BUILD_ROAD':
            return 'CITY';
        case 'ADVANCE_LEGACY_WORK':
        case 'DECLARE_HEGEMONY':
            return 'LEGACY';
        default:
            return 'INFLUENCE';
    }
}
function actionClassForCommand(command, phase) {
    if (command.type === 'PLAY_CARD' && phase === 'CONFLICTS') return 'REACTION';
    if (command.type === 'MANAGE' && [
        'ASSIGN_POPULATION',
        'ASSIGN_WORKED_HEXES'
    ].includes(command.command.type)) return 'FREE';
    return ACTION_CLASS[command.type];
}
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "DealPoolSchema$z.preprocess");
__turbopack_context__.k.register(_c1, "DealPoolSchema");
__turbopack_context__.k.register(_c2, "AlphaStateBase$z.strictObject({\n    schemaVersion: z.literal(5), gameId: GameIdSchema, version: N,\n    /** Rules generation the match runs on. Saves without it are V5.1a and are upgraded on read (`upgradeToV51b`). */\n    rulesVersion: z.enum(['v5.1a', 'v5.1b']).default('v5.1b'),\n    alphaVersion: z.literal('0.1.0-alpha.1').default('0.1.0-alpha.1'),\n    phase: AlphaRoundPhaseSchema.default('WORLD_PULSE'),\n    privateRng: z.strictObject({ algorithm: z.literal('hmac-sha256-counter-v1'), seed: z.string().regex(/^[a-f0-9]{64}$/), counter: N }),\n    core: GameStateSchema, rules: AlphaRulesSchema,\n    players: z.array(StrategicPlayerSchema).min(2).max(6),\n    initiative: z.array(PlayerIdSchema).min(2).max(6), units: z.array(UnitSchema),\n    roads: z.array(HexIdSchema),\n    regions: z.array(z.strictObject({ id: IdentifierSchema, templateId: IdentifierSchema, hexIds: z.array(HexIdSchema).length(7), rotation: z.number().int().min(0).max(5), revealedBy: z.array(PlayerIdSchema), discovery: RegionDiscoverySchema.optional() })),\n    occupations: z.array(z.strictObject({ cityId: CityIdSchema, occupierId: PlayerIdSchema, previousOwnerId: PlayerIdSchema, sinceRound: P })),\n    treaties: z.array(z.strictObject({ id: IdentifierSchema, proposerId: PlayerIdSchema, recipientId: PlayerIdSchema, type: TreatyTypeSchema, status: z.enum(['PROPOSED', 'ACCEPTED', 'ACTIVE', 'DECLINED', 'ENDED']), deal: ResourceDealSchema, createdRound: P, expiresRound: P })),\n    wars: z.array(z.tuple([PlayerIdSchema, PlayerIdSchema])),\n    routes: z.array(z.strictObject({ id: IdentifierSchema, ownerId: PlayerIdSchema, fromCityId: CityIdSchema, toCityId: CityIdSchema, path: z.array(HexIdSchema).min(1), suspended: z.boolean() })),\n    cards: z.strictObject({ worldDeck: z.array(IdentifierSchema), strategyDeck: z.array(IdentifierSchema), ambitionDeck: z.array(IdentifierSchema), advisorDeck: z.array(IdentifierSchema), discarded: z.array(IdentifierSchema), advisorMarket: z.array(IdentifierSchema), worldEvent: IdentifierSchema.nullable(), worldEventRound: N, worldResponded: z.array(PlayerIdSchema) }),\n    legacyWorks: z.array(LegacyWorkProgressSchema),\n    cities: z.array(AlphaCitySchema).default([]),\n    cultureContests: z.array(z.strictObject({\n        id: IdentifierSchema, round: P, cityId: CityIdSchema, attackerCivilizationId: IdentifierSchema, defenderCivilizationId: IdentifierSchema,\n        attackDice: z.tuple([P.max(6), P.max(6)]), defenseDice: z.tuple([P.max(6), P.max(6)]), attackModifier: N, defenseModifier: N,\n        attackTotal: P, defenseTotal: P, winnerCivilizationId: IdentifierSchema, loserCivilizationId: IdentifierSchema,\n    })).default([]),\n    tradeOffers: z.array(TradeOfferSchema).default([]),\n    independents: z.array(IndependentPeopleSchema).default([]),\n    worldPulse: z.strictObject({ deck: z.array(IdentifierSchema), discard: z.array(IdentifierSchema), current: WorldPulseCardSchema.nullable(), resolvedRound: N }).default({ deck: [], discard: [], current: null, resolvedRound: 0 }),\n    /** World threats (V5.1b §21b): Acampamentos, Bandos and pirate Ancoradouros. */\n    threats: z.array(ThreatSchema).default([]),\n    /** Placeholder filled by the Era turn slice; read-only data until then. */\n    /** The Era turn in progress (canon §22): which Era is closing, the step it waits at (7) and the public log of steps 1–6. */\n    eraTurn: z.strictObject({ era: AlphaEraSchema, step: z.number().int().min(1).max(9), log: z.array(z.strictObject({ step: z.number().int().min(1).max(9), summary: z.string().max(400) })) }).nullable().default(null),\n    roundLedgers: z.array(RoundLedgerSchema).default([]),\n    resolutionEvents: z.array(ResolutionEventSchema).default([]),\n    telemetry: AlphaTelemetrySchema,\n    roundReports: z.array(z.strictObject({ playerId: PlayerIdSchema, round: P, opening: ResourcePoolSchema, institutions: ResourcePoolSchema, trade: ResourcePoolSchema, mining: ResourcePoolSchema.default(emptyResourcePool), production: ResourcePoolSchema.default(emptyResourcePool), other: ResourcePoolSchema.default(emptyResourcePool), losses: ResourcePoolSchema.default(emptyResourcePool), expenses: ResourcePoolSchema.default(emptyResourcePool), discarded: ResourcePoolSchema.default(emptyResourcePool), economy: EconomyBreakdownSchema.nullable(), upkeepRequired: ResourcePoolSchema, upkeepPaid: ResourcePoolSchema, closing: ResourcePoolSchema,\n        cities: z.array(z.strictObject({ cityId: CityIdSchema, populationBefore: N, populationAfter: N, stabilityBefore: N, stabilityAfter: N })), administrativeLoad: N, administrativeCapacity: N, resolution: z.array(ResolutionEventSchema).default([]) })),\n    battles: z.array(z.strictObject({ id: IdentifierSchema, round: P, hexId: HexIdSchema, attackerId: PlayerIdSchema, defenderId: PlayerIdSchema,\n        attackerUnits: z.array(IdentifierSchema), defenderUnits: z.array(IdentifierSchema),\n        attackerPosture: BattlePostureSchema.default('ASSAULT'), defenderPosture: BattlePostureSchema.default('HOLD'),\n        attackBreakdown: z.array(BattleModifierSchema).default([]), defenseBreakdown: z.array(BattleModifierSchema).default([]),\n        attackerTactical: z.array(TacticalRollSchema).default([]),\n        defenderTactical: z.array(TacticalRollSchema).default([]),\n        /** Fortification of the defended city before and after the battle (a siege can damage or breach it). */\n        fortification: z.strictObject({ cityId: CityIdSchema, before: FortificationSnapshotSchema, after: FortificationSnapshotSchema }).nullable().default(null),\n        attackStrength: N, defenseStrength: N, attackModifiers: z.number().int(), defenseModifiers: z.number().int(),\n        /** Legacy two-dice rolls of matches resolved before tactical combat; absent on tactical battles. */\n        /** V5.1b: Δ = attack − defense and its reading; absent on battles resolved before the single shock. */\n        delta: z.number().int().optional(), outcome: ShockOutcomeSchema.optional(),\n        attackDice: z.tuple([P.max(6), P.max(6)]).optional(), defenseDice: z.tuple([P.max(6), P.max(6)]).optional(),\n        attackTotal: z.number().int(), defenseTotal: z.number().int(), winnerId: PlayerIdSchema, losses: z.array(IdentifierSchema), retreat: HexIdSchema.nullable() })),\n    winner: z.strictObject({ playerId: PlayerIdSchema, reason: z.enum(['HEGEMONY', 'ROUND_LIMIT']), round: P }).nullable(),\n    events: z.array(AlphaEventSchema),\n}).superRefine");
__turbopack_context__.k.register(_c3, "AlphaStateBase");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/core.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AxialCoordinatesSchema",
    ()=>AxialCoordinatesSchema,
    "CityIdSchema",
    ()=>CityIdSchema,
    "CitySpecializationSchema",
    ()=>CitySpecializationSchema,
    "CivilizationDomainSchema",
    ()=>CivilizationDomainSchema,
    "CivilizationIdSchema",
    ()=>CivilizationIdSchema,
    "DevelopmentSchema",
    ()=>DevelopmentSchema,
    "EraSchema",
    ()=>EraSchema,
    "GameIdSchema",
    ()=>GameIdSchema,
    "GovernmentSchema",
    ()=>GovernmentSchema,
    "GovernmentTypeSchema",
    ()=>GovernmentTypeSchema,
    "HegemonyTypeSchema",
    ()=>HegemonyTypeSchema,
    "HexIdSchema",
    ()=>HexIdSchema,
    "HexTileSchema",
    ()=>HexTileSchema,
    "IdentifierSchema",
    ()=>IdentifierSchema,
    "ImprovementTypeSchema",
    ()=>ImprovementTypeSchema,
    "InitialHexTileSchema",
    ()=>InitialHexTileSchema,
    "NonNegativeIntegerSchema",
    ()=>NonNegativeIntegerSchema,
    "OrderTypeSchema",
    ()=>OrderTypeSchema,
    "PlayerIdSchema",
    ()=>PlayerIdSchema,
    "PopulationAllocationSchema",
    ()=>PopulationAllocationSchema,
    "PopulationRoleSchema",
    ()=>PopulationRoleSchema,
    "PositiveIntegerSchema",
    ()=>PositiveIntegerSchema,
    "RESOURCE_KEYS",
    ()=>RESOURCE_KEYS,
    "ResourcePoolSchema",
    ()=>ResourcePoolSchema,
    "ResourceTypeSchema",
    ()=>ResourceTypeSchema,
    "RoundPhaseSchema",
    ()=>RoundPhaseSchema,
    "SeedSchema",
    ()=>SeedSchema,
    "StabilityCategorySchema",
    ()=>StabilityCategorySchema,
    "StabilitySchema",
    ()=>StabilitySchema,
    "TerrainFeatureSchema",
    ()=>TerrainFeatureSchema,
    "TerrainTypeSchema",
    ()=>TerrainTypeSchema,
    "TileYieldSchema",
    ()=>TileYieldSchema,
    "emptyResourcePool",
    ()=>emptyResourcePool,
    "unassignedPopulation",
    ()=>unassignedPopulation
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
;
const IdentifierSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(100).regex(/^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/).refine(_c = (id)=>![
        '__proto__',
        'constructor',
        'prototype'
    ].includes(id), 'Reserved identifier');
_c1 = IdentifierSchema;
const GameIdSchema = IdentifierSchema.brand();
const PlayerIdSchema = IdentifierSchema.brand();
const CivilizationIdSchema = IdentifierSchema.brand();
const CityIdSchema = IdentifierSchema.brand();
const HexIdSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^-?\d+,-?\d+$/).brand();
const EraSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'FOUNDATION',
    'EXPANSION',
    'CIVILIZATION',
    'EMPIRES',
    'HEGEMONY'
]);
const CivilizationDomainSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'KNOWLEDGE',
    'SOCIETY',
    'ECONOMY',
    'WARFARE',
    'CULTURE'
]);
const HegemonyTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'MILITARY',
    'ECONOMIC',
    'SCIENTIFIC',
    'CULTURAL',
    'POLITICAL',
    'TERRITORIAL'
]);
const RoundPhaseSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'MAINTENANCE',
    'PLANNING',
    'RESOLUTION',
    'REACTION',
    'END_ROUND'
]);
const OrderTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'EXPLORE',
    'EXPAND',
    'DEVELOP',
    'BUILD',
    'RECRUIT',
    'RESEARCH',
    'MOVE',
    'NEGOTIATE',
    'INFLUENCE'
]);
const ResourceTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'FOOD',
    'MATERIALS',
    'WEALTH',
    'KNOWLEDGE',
    'INFLUENCE'
]);
const NonNegativeIntegerSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const SeedSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(0).max(0xffffffff);
const ResourcePoolSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    food: NonNegativeIntegerSchema,
    materials: NonNegativeIntegerSchema,
    wealth: NonNegativeIntegerSchema,
    knowledge: NonNegativeIntegerSchema,
    influence: NonNegativeIntegerSchema
});
const emptyResourcePool = ()=>({
        food: 0,
        materials: 0,
        wealth: 0,
        knowledge: 0,
        influence: 0
    });
const AxialCoordinatesSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    q: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(-1_000_000).max(1_000_000),
    r: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(-1_000_000).max(1_000_000)
});
const TerrainTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'UNKNOWN',
    'PLAINS',
    'FOREST',
    'HILLS',
    'MOUNTAINS',
    'COAST',
    'SEA'
]);
const TerrainFeatureSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'RIVER',
    'FERTILE',
    'TIMBER',
    'STONE',
    'METAL',
    'FISH'
]);
const ImprovementTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'FARM',
    'LUMBER_CAMP',
    'QUARRY',
    'MINE',
    'FISHERY'
]);
const TileYieldSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    food: NonNegativeIntegerSchema,
    materials: NonNegativeIntegerSchema,
    wealth: NonNegativeIntegerSchema
});
const HexTileSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: HexIdSchema,
    q: AxialCoordinatesSchema.shape.q,
    r: AxialCoordinatesSchema.shape.r,
    terrain: TerrainTypeSchema,
    features: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(TerrainFeatureSchema),
    ownerId: PlayerIdSchema.nullable(),
    controllerCityId: CityIdSchema.nullable(),
    improvement: ImprovementTypeSchema.nullable()
});
const InitialHexTileSchema = HexTileSchema.extend({
    terrain: TerrainTypeSchema.default('UNKNOWN'),
    features: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(TerrainFeatureSchema).default([]),
    ownerId: PlayerIdSchema.nullable().default(null),
    controllerCityId: CityIdSchema.nullable().default(null),
    improvement: ImprovementTypeSchema.nullable().default(null)
});
const PositiveIntegerSchema = NonNegativeIntegerSchema.min(1);
const RESOURCE_KEYS = [
    'food',
    'materials',
    'wealth',
    'knowledge',
    'influence'
];
const PopulationRoleSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'PRODUCER',
    'ARTISAN',
    'MERCHANT',
    'SCHOLAR',
    'SOLDIER',
    'UNASSIGNED'
]);
const PopulationAllocationSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    producers: NonNegativeIntegerSchema,
    artisans: NonNegativeIntegerSchema,
    merchants: NonNegativeIntegerSchema,
    scholars: NonNegativeIntegerSchema,
    soldiers: NonNegativeIntegerSchema,
    unassigned: NonNegativeIntegerSchema
});
const unassignedPopulation = (population)=>({
        producers: 0,
        artisans: 0,
        merchants: 0,
        scholars: 0,
        soldiers: 0,
        unassigned: population
    });
const CitySpecializationSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'AGRARIAN',
    'COMMERCIAL',
    'ACADEMIC',
    'ADMINISTRATIVE',
    'MILITARY',
    'INDUSTRIAL',
    'CULTURAL'
]);
const GovernmentTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'MONARCHY',
    'REPUBLIC',
    'OLIGARCHY',
    'THEOCRACY',
    'CONFEDERATION',
    'MERITOCRACY',
    'AUTOCRACY'
]);
const GovernmentSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'PROTO_GOVERNANCE',
    ...GovernmentTypeSchema.options
]);
const StabilitySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(0).max(100);
const DevelopmentSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(5);
const StabilityCategorySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'CRITICAL',
    'UNSTABLE',
    'TENSE',
    'STABLE',
    'PROSPEROUS'
]);
var _c, _c1;
__turbopack_context__.k.register(_c, "IdentifierSchema$z.string().min(1).max(100).regex(/^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/)\n    .refine");
__turbopack_context__.k.register(_c1, "IdentifierSchema");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/index.js [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/model.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$rules$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/rules.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/territory.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2d$invariants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/territory-invariants.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$model$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/snapshots/v2/model.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$serialization$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/serialization.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-city-ladder.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-catalog.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$regions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-regions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-institutions.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-cards.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$core10$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-core10.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-leaders.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-stack.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$civilization$2d$kits$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-civilization-kits.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-resonance.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-threats.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-legacy-works.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-topology.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/model.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CityStateSchema",
    ()=>CityStateSchema,
    "CivilizationStateSchema",
    ()=>CivilizationStateSchema,
    "CreateGameInputSchema",
    ()=>CreateGameInputSchema,
    "GameCommandSchema",
    ()=>GameCommandSchema,
    "GameEventSchema",
    ()=>GameEventSchema,
    "GameStateSchema",
    ()=>GameStateSchema,
    "InitialCitySchema",
    ()=>InitialCitySchema,
    "PlayerOrderSchema",
    ()=>PlayerOrderSchema,
    "PlayerStateSchema",
    ()=>PlayerStateSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$rules$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/rules.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/territory.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2d$invariants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/territory-invariants.js [app-client] (ecmascript)");
;
;
;
;
;
const CityStateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
    ownerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"],
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1).max(80),
    population: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    stability: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"],
    development: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DevelopmentSchema"],
    specialization: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CitySpecializationSchema"].nullable(),
    workers: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PopulationAllocationSchema"],
    foundedRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    growthProgress: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    workedHexIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"]),
    districts: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DistrictStateSchema"]),
    buildings: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BuildingStateSchema"])
}).superRefine(_c = (city, ctx)=>{
    if (Object.values(city.workers).reduce((sum, value)=>sum + BigInt(value), 0n) !== BigInt(city.population)) ctx.addIssue({
        code: 'custom',
        message: 'Allocated population must equal city population'
    });
});
_c1 = CityStateSchema;
const CivilizationStateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CivilizationIdSchema"],
    ownerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    cities: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(CityStateSchema),
    capitalCityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"].nullable(),
    government: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GovernmentSchema"],
    administrativeCapacity: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    administrativeLoad: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    administrationStatus: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'WITHIN_CAPACITY',
        'OVEREXTENDED'
    ])
});
const PlayerStateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1).max(80),
    civilization: CivilizationStateSchema,
    resources: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"]
});
const PlayerOrderSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    type: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OrderTypeSchema"],
    targetHexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"].optional()
});
const playerCommand = {
    expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"]
};
const GameCommandSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].discriminatedUnion('type', [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('SUBMIT_ORDER'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        order: PlayerOrderSchema
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('ADVANCE_PHASE'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        nextPhase: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RoundPhaseSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...playerCommand,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('ASSIGN_POPULATION'),
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        workers: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PopulationAllocationSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...playerCommand,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('DEVELOP_CITY'),
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...playerCommand,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('SPECIALIZE_CITY'),
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        specialization: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CitySpecializationSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...playerCommand,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('ADOPT_GOVERNMENT'),
        government: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GovernmentTypeSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...playerCommand,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('CLAIM_HEX'),
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...playerCommand,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('ASSIGN_WORKED_HEXES'),
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        hexIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"])
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...playerCommand,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('IMPROVE_HEX'),
        hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"],
        improvement: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ImprovementTypeSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...playerCommand,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('FOUND_CITY'),
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"],
        name: CityStateSchema.shape.name
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...playerCommand,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('BUILD_DISTRICT'),
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        district: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DistrictTypeSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...playerCommand,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('BUILD_BUILDING'),
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        building: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BuildingTypeSchema"]
    })
]);
const eventBase = {
    version: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    round: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
};
const cityEvent = {
    ...eventBase,
    playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"]
};
const GameEventSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].discriminatedUnion('type', [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...eventBase,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('GAME_CREATED')
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...eventBase,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('ORDER_SUBMITTED'),
        order: PlayerOrderSchema
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...eventBase,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('PHASE_ADVANCED'),
        from: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RoundPhaseSchema"],
        to: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RoundPhaseSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('CITY_DEVELOPED'),
        development: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DevelopmentSchema"],
        cost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('CITY_SPECIALIZED'),
        specialization: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CitySpecializationSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('POPULATION_ASSIGNED'),
        workers: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PopulationAllocationSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('POPULATION_GROWN'),
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        population: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('GROWTH_PROGRESS_CHANGED'),
        from: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        to: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...eventBase,
        playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('FOOD_SHORTAGE'),
        required: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        paid: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        deficit: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('STABILITY_CHANGED'),
        from: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"],
        to: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...eventBase,
        playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('GOVERNMENT_ADOPTED'),
        government: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GovernmentTypeSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...eventBase,
        playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('ADMINISTRATIVE_OVEREXTENSION'),
        load: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        capacity: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...eventBase,
        playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('RESOURCES_PRODUCED'),
        resources: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
        breakdown: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EconomyBreakdownSchema"].optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...eventBase,
        playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('FOOD_CONSUMED'),
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('HEX_CLAIMED'),
        hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"],
        cost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('WORKED_HEXES_ASSIGNED'),
        hexIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"])
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...eventBase,
        playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('HEX_IMPROVED'),
        hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"],
        improvement: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ImprovementTypeSchema"],
        cost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('CITY_FOUNDED'),
        hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"],
        name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        cost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('CITY_TRANSFERRED'),
        previousOwnerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('DISTRICT_BUILT'),
        district: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DistrictTypeSchema"],
        cost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('BUILDING_BUILT'),
        building: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BuildingTypeSchema"],
        cost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"]
    })
]);
const InitialCitySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
    ownerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"],
    name: CityStateSchema.shape.name,
    population: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].optional(),
    workers: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PopulationAllocationSchema"].optional()
});
const CreateGameInputSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    gameId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GameIdSchema"],
    seed: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SeedSchema"],
    players: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        name: PlayerStateSchema.shape.name,
        resources: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"].optional()
    })).min(2).max(6),
    config: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$rules$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GameRulesConfigSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
            baseCommandPoints: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
        }).transform((old)=>({
                ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$rules$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDefaultRules"])(),
                ...old
            }))
    ]).optional(),
    map: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InitialHexTileSchema"]).optional(),
    initialCities: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(InitialCitySchema).optional()
});
const GameStateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    schemaVersion: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(3),
    gameId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GameIdSchema"],
    version: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    seed: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SeedSchema"],
    rng: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        algorithm: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('mulberry32-v1'),
        state: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SeedSchema"]
    }),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'ACTIVE',
        'FINISHED'
    ]),
    playerCount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(2).max(6),
    players: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(PlayerStateSchema).min(2).max(6),
    map: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexTileSchema"]),
    round: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    era: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EraSchema"],
    phase: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RoundPhaseSchema"],
    config: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$rules$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GameRulesConfigSchema"],
    pendingOrders: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(PlayerOrderSchema)),
    eventLog: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(GameEventSchema)
}).superRefine(_c2 = (state, ctx)=>{
    const fail = (message)=>ctx.addIssue({
            code: 'custom',
            message
        });
    for (const message of (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2d$invariants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["territorialInvariantErrors"])(state))fail(message);
    const players = new Set(state.players.map((player)=>player.id));
    if (players.size !== state.playerCount || state.players.length !== state.playerCount) fail('Player count or unique IDs mismatch');
    if (new Set(state.players.map((p)=>p.civilization.id)).size !== state.playerCount) fail('Duplicate civilization');
    const hexes = new Set(state.map.map((hex)=>hex.id));
    if (hexes.size !== state.map.length || state.map.some((hex)=>hex.id !== `${hex.q},${hex.r}`)) fail('Invalid or duplicate hex identity');
    const cityIds = new Set();
    const occupiedHexes = new Set();
    for (const player of state.players){
        const civ = player.civilization;
        if (civ.ownerId !== player.id) fail('Civilization owner mismatch');
        if (civ.cities.length === 0 ? civ.capitalCityId !== null : !civ.cities.some((city)=>city.id === civ.capitalCityId)) fail('Capital must belong to civilization');
        if (civ.administrativeLoad > civ.administrativeCapacity !== (civ.administrationStatus === 'OVEREXTENDED')) fail('Administration status mismatch');
        for (const city of civ.cities){
            if (city.ownerId !== player.id || !hexes.has(city.hexId) || cityIds.has(city.id) || occupiedHexes.has(city.hexId)) fail('Invalid city ownership, hex or duplicate city');
            cityIds.add(city.id);
            occupiedHexes.add(city.hexId);
            if (city.development > state.config.maxDevelopment || city.population > (state.config.developmentPopulationCaps[city.development - 1] ?? 0)) fail('City exceeds development or population cap');
            if (city.growthProgress > state.config.growthThreshold || city.foundedRound > state.round) fail('Invalid growth progress or founding round');
            if (city.specialization !== null && city.development < state.config.specializationMinimumDevelopment) fail('Specialization requires development');
        }
    }
    const keys = Object.keys(state.pendingOrders);
    if (keys.length !== players.size || keys.some((key)=>!players.has(key))) fail('Pending-order players mismatch');
    const orderIds = new Set();
    for (const [playerId, orders] of Object.entries(state.pendingOrders))for (const order of orders){
        if (order.playerId !== playerId || orderIds.has(order.id) || order.targetHexId !== undefined && !hexes.has(order.targetHexId)) fail('Invalid order owner, target or duplicate ID');
        orderIds.add(order.id);
    }
    if (state.eventLog[0]?.type !== 'GAME_CREATED' || state.eventLog[0]?.version !== 0 || state.eventLog.at(-1)?.version !== state.version) fail('Event log/version mismatch');
    let revision = 0;
    let round = 1;
    for (const [index, event] of state.eventLog.entries()){
        if (event.version < revision || event.version > revision + 1 || event.round < round || event.round > state.round || index > 0 && (event.type === 'GAME_CREATED' || event.version === 0)) fail('Invalid event sequence');
        revision = event.version;
        round = event.round;
        if (event.type === 'ORDER_SUBMITTED' && !players.has(event.order.playerId)) fail('Unknown event player');
        if ('playerId' in event && !players.has(event.playerId)) fail('Unknown event player');
    }
    // Walk backwards from current ownership; transfers preserve historical attribution.
    const historicalOwners = new Map(state.players.flatMap((p)=>p.civilization.cities.map((c)=>[
                c.id,
                p.id
            ])));
    for (const event of [
        ...state.eventLog
    ].reverse())if ('cityId' in event) {
        if (historicalOwners.get(event.cityId) !== event.playerId) fail('Unknown event city or owner');
        if (event.type === 'CITY_TRANSFERRED') {
            if (!players.has(event.previousOwnerId) || event.previousOwnerId === event.playerId) fail('Invalid city ownership transfer');
            historicalOwners.set(event.cityId, event.previousOwnerId);
        }
    }
});
_c3 = GameStateSchema;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "CityStateSchema$z.strictObject({\n    id: CityIdSchema, ownerId: PlayerIdSchema, hexId: HexIdSchema, name: z.string().trim().min(1).max(80),\n    population: N, stability: StabilitySchema, development: DevelopmentSchema,\n    specialization: CitySpecializationSchema.nullable(), workers: PopulationAllocationSchema,\n    foundedRound: P, growthProgress: N,\n    workedHexIds: z.array(HexIdSchema), districts: z.array(DistrictStateSchema), buildings: z.array(BuildingStateSchema),\n}).superRefine");
__turbopack_context__.k.register(_c1, "CityStateSchema");
__turbopack_context__.k.register(_c2, "GameStateSchema$z.strictObject({\n    schemaVersion: z.literal(3), gameId: GameIdSchema, version: N,\n    seed: SeedSchema, rng: z.strictObject({ algorithm: z.literal('mulberry32-v1'), state: SeedSchema }),\n    status: z.enum(['ACTIVE', 'FINISHED']), playerCount: z.number().int().min(2).max(6),\n    players: z.array(PlayerStateSchema).min(2).max(6), map: z.array(HexTileSchema),\n    round: P, era: EraSchema, phase: RoundPhaseSchema, config: GameRulesConfigSchema,\n    pendingOrders: z.record(PlayerIdSchema, z.array(PlayerOrderSchema)), eventLog: z.array(GameEventSchema),\n}).superRefine");
__turbopack_context__.k.register(_c3, "GameStateSchema");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/rules.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_GAME_CONFIG",
    ()=>DEFAULT_GAME_CONFIG,
    "GameConfigSchema",
    ()=>GameConfigSchema,
    "GameRulesConfigSchema",
    ()=>GameRulesConfigSchema,
    "GovernmentModifiersSchema",
    ()=>GovernmentModifiersSchema,
    "SpecializationModifiersSchema",
    ()=>SpecializationModifiersSchema,
    "createDefaultRules",
    ()=>createDefaultRules
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/territory.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-client] (ecmascript)");
;
;
;
const signed = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(-100).max(100);
const GovernmentModifiersSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    capacityFlat: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    capacityPerCity: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    unstableBelow: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"],
    unstableCityCapacityPenalty: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    capitalCrisisBelow: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"],
    capitalCrisisPenalty: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    capitalStability: signed,
    developedCityStability: signed,
    developedMinLevel: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DevelopmentSchema"],
    globalStability: signed,
    multiCityStability: signed,
    multiCityMinimum: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    wealthBonusPercent: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    commercialWealthBonusPercent: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    commandPointsDelta: signed,
    futureKnowledgeBonusPercent: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    futureInfluenceBonusPercent: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    futureInequalityStabilityPenalty: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    futureReformFlexibilityPenalty: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
});
const SpecializationModifiersSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    producerBonus: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    artisanBonus: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    merchantBonus: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    scholarBonus: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    administrativeCapacity: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    futureRecruitmentPreparation: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    futureInfluenceBonus: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
});
const GameRulesConfigSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    territory: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TerritoryRulesSchema"],
    baseCommandPoints: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    foodPerPopulation: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    growthThreshold: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    maxGrowthPerMaintenance: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    initialPopulation: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    initialStability: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"],
    maxDevelopment: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DevelopmentSchema"],
    developmentPopulationCaps: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
    ]),
    developmentCosts: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"]
    ]),
    specializationMinimumDevelopment: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DevelopmentSchema"],
    productionPerWorker: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        producers: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        artisans: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        merchants: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        scholars: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    specializationModifiers: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CitySpecializationSchema"], SpecializationModifiersSchema),
    governmentModifiers: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GovernmentSchema"], GovernmentModifiersSchema),
    administrativeRules: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        baseCapacity: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        loadPerCity: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        developmentStep: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        populationStep: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        overextensionStabilityPenalty: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        overextensionEconomicPercent: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(0).max(100)
    }),
    stabilityThresholds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        criticalMax: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"],
        unstableMax: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"],
        tenseMax: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"],
        stableMax: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"]
    }),
    stabilityProductionPercent: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        CRITICAL: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        UNSTABLE: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        TENSE: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        STABLE: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        PROSPEROUS: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    blockDevelopmentAtCritical: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    shortageStabilityPenalty: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
}).superRefine(_c = (rules, ctx)=>{
    const { criticalMax, unstableMax, tenseMax, stableMax } = rules.stabilityThresholds;
    if (!(criticalMax < unstableMax && unstableMax < tenseMax && tenseMax < stableMax && stableMax < 100)) ctx.addIssue({
        code: 'custom',
        message: 'Stability bands must be strictly increasing and leave five nonempty bands'
    });
    if (rules.initialPopulation > rules.developmentPopulationCaps[0]) ctx.addIssue({
        code: 'custom',
        message: 'Initial population exceeds settlement capacity'
    });
    if (rules.territory.foundingPopulation > rules.developmentPopulationCaps[0]) ctx.addIssue({
        code: 'custom',
        message: 'Founding population exceeds capacity'
    });
    if (rules.specializationMinimumDevelopment > rules.maxDevelopment) ctx.addIssue({
        code: 'custom',
        message: 'Specialization minimum exceeds max development'
    });
    rules.developmentPopulationCaps.forEach((cap, i, caps)=>{
        if (i > 0 && cap < (caps[i - 1] ?? cap)) ctx.addIssue({
            code: 'custom',
            message: 'Population caps must not decrease'
        });
    });
});
_c1 = GameRulesConfigSchema;
const GameConfigSchema = GameRulesConfigSchema;
const government = {
    capacityFlat: 0,
    capacityPerCity: 0,
    unstableBelow: 40,
    unstableCityCapacityPenalty: 0,
    capitalCrisisBelow: 20,
    capitalCrisisPenalty: 0,
    capitalStability: 0,
    developedCityStability: 0,
    developedMinLevel: 3,
    globalStability: 0,
    multiCityStability: 0,
    multiCityMinimum: 2,
    wealthBonusPercent: 0,
    commercialWealthBonusPercent: 0,
    commandPointsDelta: 0,
    futureKnowledgeBonusPercent: 0,
    futureInfluenceBonusPercent: 0,
    futureInequalityStabilityPenalty: 0,
    futureReformFlexibilityPenalty: 0
};
const specialization = {
    producerBonus: 0,
    artisanBonus: 0,
    merchantBonus: 0,
    scholarBonus: 0,
    administrativeCapacity: 0,
    futureRecruitmentPreparation: 0,
    futureInfluenceBonus: 0
};
// Provisional balance values, cloned and validated for each match.
const defaults = {
    territory: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDefaultTerritoryRules"])(),
    baseCommandPoints: 4,
    foodPerPopulation: 1,
    growthThreshold: 10,
    maxGrowthPerMaintenance: 1,
    initialPopulation: 2,
    initialStability: 60,
    maxDevelopment: 5,
    developmentPopulationCaps: [
        3,
        5,
        8,
        12,
        16
    ],
    developmentCosts: [
        {
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"])(),
            materials: 5
        },
        {
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"])(),
            materials: 10
        },
        {
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"])(),
            materials: 15
        },
        {
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"])(),
            materials: 20
        }
    ],
    specializationMinimumDevelopment: 1,
    productionPerWorker: {
        producers: 2,
        artisans: 1,
        merchants: 1,
        scholars: 1
    },
    specializationModifiers: {
        AGRARIAN: {
            ...specialization,
            producerBonus: 1
        },
        COMMERCIAL: {
            ...specialization,
            merchantBonus: 1
        },
        ACADEMIC: {
            ...specialization,
            scholarBonus: 1
        },
        ADMINISTRATIVE: {
            ...specialization,
            administrativeCapacity: 2
        },
        MILITARY: {
            ...specialization,
            futureRecruitmentPreparation: 1
        },
        INDUSTRIAL: {
            ...specialization,
            artisanBonus: 1
        },
        CULTURAL: {
            ...specialization,
            futureInfluenceBonus: 1
        }
    },
    governmentModifiers: {
        PROTO_GOVERNANCE: {
            ...government
        },
        MONARCHY: {
            ...government,
            capacityFlat: 2,
            capitalStability: 3,
            capitalCrisisPenalty: 5
        },
        REPUBLIC: {
            ...government,
            developedCityStability: 2,
            unstableCityCapacityPenalty: 1,
            futureKnowledgeBonusPercent: 10,
            futureInfluenceBonusPercent: 10
        },
        OLIGARCHY: {
            ...government,
            wealthBonusPercent: 10,
            commercialWealthBonusPercent: 15,
            futureInequalityStabilityPenalty: 2
        },
        THEOCRACY: {
            ...government,
            globalStability: 2,
            futureInfluenceBonusPercent: 10,
            futureReformFlexibilityPenalty: 1
        },
        CONFEDERATION: {
            ...government,
            capacityPerCity: 1,
            multiCityStability: 2,
            commandPointsDelta: -1
        },
        /** V5.1b governments live in the Alpha engine (`governmentEffects`), never in these legacy Estabilidade modifiers. */ MERITOCRACY: {
            ...government
        },
        AUTOCRACY: {
            ...government
        }
    },
    administrativeRules: {
        baseCapacity: 3,
        loadPerCity: 1,
        developmentStep: 2,
        populationStep: 5,
        overextensionStabilityPenalty: 3,
        overextensionEconomicPercent: 90
    },
    stabilityThresholds: {
        criticalMax: 19,
        unstableMax: 39,
        tenseMax: 59,
        stableMax: 79
    },
    stabilityProductionPercent: {
        CRITICAL: 75,
        UNSTABLE: 90,
        TENSE: 100,
        STABLE: 100,
        PROSPEROUS: 110
    },
    blockDevelopmentAtCritical: true,
    shortageStabilityPenalty: 5
};
function freeze(value) {
    if (value !== null && typeof value === 'object') {
        Object.freeze(value);
        Object.values(value).forEach(freeze);
    }
    return value;
}
const DEFAULT_GAME_CONFIG = freeze(GameRulesConfigSchema.parse(defaults));
const createDefaultRules = ()=>GameRulesConfigSchema.parse(DEFAULT_GAME_CONFIG);
var _c, _c1;
__turbopack_context__.k.register(_c, "GameRulesConfigSchema$z.strictObject({\n    territory: TerritoryRulesSchema,\n    baseCommandPoints: N, foodPerPopulation: N, growthThreshold: P,\n    maxGrowthPerMaintenance: P, initialPopulation: N, initialStability: StabilitySchema,\n    maxDevelopment: DevelopmentSchema,\n    developmentPopulationCaps: z.tuple([P, P, P, P, P]),\n    developmentCosts: z.tuple([ResourcePoolSchema, ResourcePoolSchema, ResourcePoolSchema, ResourcePoolSchema]),\n    specializationMinimumDevelopment: DevelopmentSchema,\n    productionPerWorker: z.strictObject({ producers: N, artisans: N, merchants: N, scholars: N }),\n    specializationModifiers: z.record(CitySpecializationSchema, SpecializationModifiersSchema),\n    governmentModifiers: z.record(GovernmentSchema, GovernmentModifiersSchema),\n    administrativeRules: z.strictObject({ baseCapacity: N, loadPerCity: N, developmentStep: P, populationStep: P, overextensionStabilityPenalty: N, overextensionEconomicPercent: z.number().int().min(0).max(100) }),\n    stabilityThresholds: z.strictObject({ criticalMax: StabilitySchema, unstableMax: StabilitySchema, tenseMax: StabilitySchema, stableMax: StabilitySchema }),\n    stabilityProductionPercent: z.strictObject({ CRITICAL: N, UNSTABLE: N, TENSE: N, STABLE: N, PROSPEROUS: N }),\n    blockDevelopmentAtCritical: z.boolean(), shortageStabilityPenalty: N,\n}).superRefine");
__turbopack_context__.k.register(_c1, "GameRulesConfigSchema");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/serialization.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deserializeGameState",
    ()=>deserializeGameState,
    "serializeGameState",
    ()=>serializeGameState
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/model.js [app-client] (ecmascript)");
;
;
function serializeGameState(state) {
    return JSON.stringify(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GameStateSchema"].parse(state));
}
function deserializeGameState(json) {
    try {
        const value = JSON.parse(json);
        if (typeof value === 'object' && value !== null && 'schemaVersion' in value) {
            if (value.schemaVersion === 1) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["err"])({
                code: 'SNAPSHOT_MIGRATION_REQUIRED',
                message: 'Snapshot v1 belongs to Round 1. Keep the original and load it with commit 9d63e69; v0.3 requires explicit scenario conversion (workers, stability, development, government and rules). No automatic lossy migration is performed.'
            });
            if (value.schemaVersion === 2) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["err"])({
                code: 'SNAPSHOT_MIGRATION_REQUIRED',
                message: 'Run migrateSnapshotV2ToV3 explicitly and save the converted snapshot; the original remains unchanged.'
            });
            if (value.schemaVersion !== 3) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["err"])({
                code: 'UNSUPPORTED_SCHEMA',
                message: 'Unsupported snapshot schema; expected schemaVersion 3'
            });
        }
        const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GameStateSchema"].safeParse(value);
        return parsed.success ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ok"])(parsed.data) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["err"])({
            code: 'INVALID_STATE',
            message: parsed.error.message
        });
    } catch  {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["err"])({
            code: 'INVALID_STATE',
            message: 'Invalid JSON snapshot'
        });
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/snapshots/v2/core.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AxialCoordinatesSchema",
    ()=>AxialCoordinatesSchema,
    "CityIdSchema",
    ()=>CityIdSchema,
    "CitySpecializationSchema",
    ()=>CitySpecializationSchema,
    "CivilizationDomainSchema",
    ()=>CivilizationDomainSchema,
    "CivilizationIdSchema",
    ()=>CivilizationIdSchema,
    "DevelopmentSchema",
    ()=>DevelopmentSchema,
    "EraSchema",
    ()=>EraSchema,
    "GameIdSchema",
    ()=>GameIdSchema,
    "GovernmentSchema",
    ()=>GovernmentSchema,
    "GovernmentTypeSchema",
    ()=>GovernmentTypeSchema,
    "HegemonyTypeSchema",
    ()=>HegemonyTypeSchema,
    "HexIdSchema",
    ()=>HexIdSchema,
    "HexTileSchema",
    ()=>HexTileSchema,
    "IdentifierSchema",
    ()=>IdentifierSchema,
    "NonNegativeIntegerSchema",
    ()=>NonNegativeIntegerSchema,
    "OrderTypeSchema",
    ()=>OrderTypeSchema,
    "PlayerIdSchema",
    ()=>PlayerIdSchema,
    "PopulationAllocationSchema",
    ()=>PopulationAllocationSchema,
    "PopulationRoleSchema",
    ()=>PopulationRoleSchema,
    "PositiveIntegerSchema",
    ()=>PositiveIntegerSchema,
    "RESOURCE_KEYS",
    ()=>RESOURCE_KEYS,
    "ResourcePoolSchema",
    ()=>ResourcePoolSchema,
    "ResourceTypeSchema",
    ()=>ResourceTypeSchema,
    "RoundPhaseSchema",
    ()=>RoundPhaseSchema,
    "SeedSchema",
    ()=>SeedSchema,
    "StabilityCategorySchema",
    ()=>StabilityCategorySchema,
    "StabilitySchema",
    ()=>StabilitySchema,
    "emptyResourcePool",
    ()=>emptyResourcePool,
    "unassignedPopulation",
    ()=>unassignedPopulation
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
;
const IdentifierSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(100).regex(/^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/).refine(_c = (id)=>![
        '__proto__',
        'constructor',
        'prototype'
    ].includes(id), 'Reserved identifier');
_c1 = IdentifierSchema;
const GameIdSchema = IdentifierSchema.brand();
const PlayerIdSchema = IdentifierSchema.brand();
const CivilizationIdSchema = IdentifierSchema.brand();
const CityIdSchema = IdentifierSchema.brand();
const HexIdSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^-?\d+,-?\d+$/).brand();
const EraSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'FOUNDATION',
    'EXPANSION',
    'CIVILIZATION',
    'EMPIRES',
    'HEGEMONY'
]);
const CivilizationDomainSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'KNOWLEDGE',
    'SOCIETY',
    'ECONOMY',
    'WARFARE',
    'CULTURE'
]);
const HegemonyTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'MILITARY',
    'ECONOMIC',
    'SCIENTIFIC',
    'CULTURAL',
    'POLITICAL',
    'TERRITORIAL'
]);
const RoundPhaseSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'MAINTENANCE',
    'PLANNING',
    'RESOLUTION',
    'REACTION',
    'END_ROUND'
]);
const OrderTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'EXPLORE',
    'EXPAND',
    'DEVELOP',
    'BUILD',
    'RECRUIT',
    'RESEARCH',
    'MOVE',
    'NEGOTIATE',
    'INFLUENCE'
]);
const ResourceTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'FOOD',
    'MATERIALS',
    'WEALTH',
    'KNOWLEDGE',
    'INFLUENCE'
]);
const NonNegativeIntegerSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const SeedSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(0).max(0xffffffff);
const ResourcePoolSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    food: NonNegativeIntegerSchema,
    materials: NonNegativeIntegerSchema,
    wealth: NonNegativeIntegerSchema,
    knowledge: NonNegativeIntegerSchema,
    influence: NonNegativeIntegerSchema
});
const emptyResourcePool = ()=>({
        food: 0,
        materials: 0,
        wealth: 0,
        knowledge: 0,
        influence: 0
    });
const AxialCoordinatesSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    q: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(-1_000_000).max(1_000_000),
    r: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(-1_000_000).max(1_000_000)
});
const HexTileSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: HexIdSchema,
    q: AxialCoordinatesSchema.shape.q,
    r: AxialCoordinatesSchema.shape.r
});
const PositiveIntegerSchema = NonNegativeIntegerSchema.min(1);
const RESOURCE_KEYS = [
    'food',
    'materials',
    'wealth',
    'knowledge',
    'influence'
];
const PopulationRoleSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'PRODUCER',
    'ARTISAN',
    'MERCHANT',
    'SCHOLAR',
    'SOLDIER',
    'UNASSIGNED'
]);
const PopulationAllocationSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    producers: NonNegativeIntegerSchema,
    artisans: NonNegativeIntegerSchema,
    merchants: NonNegativeIntegerSchema,
    scholars: NonNegativeIntegerSchema,
    soldiers: NonNegativeIntegerSchema,
    unassigned: NonNegativeIntegerSchema
});
const unassignedPopulation = (population)=>({
        producers: 0,
        artisans: 0,
        merchants: 0,
        scholars: 0,
        soldiers: 0,
        unassigned: population
    });
const CitySpecializationSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'AGRARIAN',
    'COMMERCIAL',
    'ACADEMIC',
    'ADMINISTRATIVE',
    'MILITARY',
    'INDUSTRIAL',
    'CULTURAL'
]);
const GovernmentTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'MONARCHY',
    'REPUBLIC',
    'OLIGARCHY',
    'THEOCRACY',
    'CONFEDERATION'
]);
const GovernmentSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'PROTO_GOVERNANCE',
    ...GovernmentTypeSchema.options
]);
const StabilitySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(0).max(100);
const DevelopmentSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(5);
const StabilityCategorySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'CRITICAL',
    'UNSTABLE',
    'TENSE',
    'STABLE',
    'PROSPEROUS'
]);
var _c, _c1;
__turbopack_context__.k.register(_c, "IdentifierSchema$z.string().min(1).max(100).regex(/^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/)\n    .refine");
__turbopack_context__.k.register(_c1, "IdentifierSchema");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/snapshots/v2/model.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CityStateSchema",
    ()=>CityStateSchema,
    "CivilizationStateSchema",
    ()=>CivilizationStateSchema,
    "CreateGameInputSchema",
    ()=>CreateGameInputSchema,
    "GameCommandSchema",
    ()=>GameCommandSchema,
    "GameEventSchema",
    ()=>GameEventSchema,
    "GameStateSchema",
    ()=>GameStateSchema,
    "InitialCitySchema",
    ()=>InitialCitySchema,
    "PlayerOrderSchema",
    ()=>PlayerOrderSchema,
    "PlayerStateSchema",
    ()=>PlayerStateSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/snapshots/v2/core.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$rules$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/snapshots/v2/rules.js [app-client] (ecmascript)");
;
;
;
const CityStateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
    ownerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"],
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1).max(80),
    population: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    stability: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"],
    development: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DevelopmentSchema"],
    specialization: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CitySpecializationSchema"].nullable(),
    workers: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PopulationAllocationSchema"],
    foundedRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    growthProgress: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
}).superRefine(_c = (city, ctx)=>{
    if (Object.values(city.workers).reduce((sum, value)=>sum + BigInt(value), 0n) !== BigInt(city.population)) ctx.addIssue({
        code: 'custom',
        message: 'Allocated population must equal city population'
    });
});
_c1 = CityStateSchema;
const CivilizationStateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CivilizationIdSchema"],
    ownerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    cities: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(CityStateSchema),
    capitalCityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"].nullable(),
    government: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GovernmentSchema"],
    administrativeCapacity: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    administrativeLoad: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    administrationStatus: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'WITHIN_CAPACITY',
        'OVEREXTENDED'
    ])
});
const PlayerStateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1).max(80),
    civilization: CivilizationStateSchema,
    resources: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"]
});
const PlayerOrderSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IdentifierSchema"],
    playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    type: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OrderTypeSchema"],
    targetHexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"].optional()
});
const playerCommand = {
    expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"]
};
const GameCommandSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].discriminatedUnion('type', [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('SUBMIT_ORDER'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        order: PlayerOrderSchema
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('ADVANCE_PHASE'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        nextPhase: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RoundPhaseSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...playerCommand,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('ASSIGN_POPULATION'),
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        workers: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PopulationAllocationSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...playerCommand,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('DEVELOP_CITY'),
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...playerCommand,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('SPECIALIZE_CITY'),
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
        specialization: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CitySpecializationSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...playerCommand,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('ADOPT_GOVERNMENT'),
        government: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GovernmentTypeSchema"]
    })
]);
const eventBase = {
    version: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    round: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
};
const cityEvent = {
    ...eventBase,
    playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"]
};
const GameEventSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].discriminatedUnion('type', [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...eventBase,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('GAME_CREATED')
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...eventBase,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('ORDER_SUBMITTED'),
        order: PlayerOrderSchema
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...eventBase,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('PHASE_ADVANCED'),
        from: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RoundPhaseSchema"],
        to: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RoundPhaseSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('CITY_DEVELOPED'),
        development: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DevelopmentSchema"],
        cost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('CITY_SPECIALIZED'),
        specialization: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CitySpecializationSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('POPULATION_ASSIGNED'),
        workers: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PopulationAllocationSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('POPULATION_GROWN'),
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        population: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('GROWTH_PROGRESS_CHANGED'),
        from: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        to: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...eventBase,
        playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('FOOD_SHORTAGE'),
        required: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        paid: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        deficit: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...cityEvent,
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('STABILITY_CHANGED'),
        from: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"],
        to: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...eventBase,
        playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('GOVERNMENT_ADOPTED'),
        government: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GovernmentTypeSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...eventBase,
        playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('ADMINISTRATIVE_OVEREXTENSION'),
        load: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        capacity: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...eventBase,
        playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('RESOURCES_PRODUCED'),
        resources: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        ...eventBase,
        playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('FOOD_CONSUMED'),
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    })
]);
const InitialCitySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
    ownerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
    hexId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"],
    name: CityStateSchema.shape.name,
    population: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].optional(),
    workers: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PopulationAllocationSchema"].optional()
});
const CreateGameInputSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    gameId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GameIdSchema"],
    seed: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SeedSchema"],
    players: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        name: PlayerStateSchema.shape.name,
        resources: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"].optional()
    })).min(2).max(6),
    config: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$rules$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GameRulesConfigSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
            baseCommandPoints: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
        }).transform((old)=>({
                ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$rules$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDefaultRules"])(),
                ...old
            }))
    ]).optional(),
    map: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexTileSchema"]).optional(),
    initialCities: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(InitialCitySchema).optional()
});
const GameStateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    schemaVersion: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(2),
    gameId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GameIdSchema"],
    version: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    seed: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SeedSchema"],
    rng: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        algorithm: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('mulberry32-v1'),
        state: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SeedSchema"]
    }),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'ACTIVE',
        'FINISHED'
    ]),
    playerCount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(2).max(6),
    players: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(PlayerStateSchema).min(2).max(6),
    map: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexTileSchema"]),
    round: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    era: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EraSchema"],
    phase: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RoundPhaseSchema"],
    config: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$rules$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GameRulesConfigSchema"],
    pendingOrders: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerIdSchema"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(PlayerOrderSchema)),
    eventLog: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(GameEventSchema)
}).superRefine(_c2 = (state, ctx)=>{
    const fail = (message)=>ctx.addIssue({
            code: 'custom',
            message
        });
    const players = new Set(state.players.map((player)=>player.id));
    if (players.size !== state.playerCount || state.players.length !== state.playerCount) fail('Player count or unique IDs mismatch');
    if (new Set(state.players.map((p)=>p.civilization.id)).size !== state.playerCount) fail('Duplicate civilization');
    const hexes = new Set(state.map.map((hex)=>hex.id));
    if (hexes.size !== state.map.length || state.map.some((hex)=>hex.id !== `${hex.q},${hex.r}`)) fail('Invalid or duplicate hex identity');
    const cityIds = new Set();
    const occupiedHexes = new Set();
    for (const player of state.players){
        const civ = player.civilization;
        if (civ.ownerId !== player.id) fail('Civilization owner mismatch');
        if (civ.cities.length === 0 ? civ.capitalCityId !== null : !civ.cities.some((city)=>city.id === civ.capitalCityId)) fail('Capital must belong to civilization');
        if (civ.administrativeLoad > civ.administrativeCapacity !== (civ.administrationStatus === 'OVEREXTENDED')) fail('Administration status mismatch');
        for (const city of civ.cities){
            if (city.ownerId !== player.id || !hexes.has(city.hexId) || cityIds.has(city.id) || occupiedHexes.has(city.hexId)) fail('Invalid city ownership, hex or duplicate city');
            cityIds.add(city.id);
            occupiedHexes.add(city.hexId);
            if (city.development > state.config.maxDevelopment || city.population > (state.config.developmentPopulationCaps[city.development - 1] ?? 0)) fail('City exceeds development or population cap');
            if (city.growthProgress > state.config.growthThreshold || city.foundedRound > state.round) fail('Invalid growth progress or founding round');
            if (city.specialization !== null && city.development < state.config.specializationMinimumDevelopment) fail('Specialization requires development');
        }
    }
    const keys = Object.keys(state.pendingOrders);
    if (keys.length !== players.size || keys.some((key)=>!players.has(key))) fail('Pending-order players mismatch');
    const orderIds = new Set();
    for (const [playerId, orders] of Object.entries(state.pendingOrders))for (const order of orders){
        if (order.playerId !== playerId || orderIds.has(order.id) || order.targetHexId !== undefined && !hexes.has(order.targetHexId)) fail('Invalid order owner, target or duplicate ID');
        orderIds.add(order.id);
    }
    if (state.eventLog[0]?.type !== 'GAME_CREATED' || state.eventLog[0]?.version !== 0 || state.eventLog.at(-1)?.version !== state.version) fail('Event log/version mismatch');
    let revision = 0;
    let round = 1;
    for (const [index, event] of state.eventLog.entries()){
        if (event.version < revision || event.version > revision + 1 || event.round < round || event.round > state.round || index > 0 && (event.type === 'GAME_CREATED' || event.version === 0)) fail('Invalid event sequence');
        revision = event.version;
        round = event.round;
        if (event.type === 'ORDER_SUBMITTED' && !players.has(event.order.playerId)) fail('Unknown event player');
        if ('playerId' in event && !players.has(event.playerId)) fail('Unknown event player');
        if ('cityId' in event && !state.players.find((player)=>player.id === event.playerId)?.civilization.cities.some((city)=>city.id === event.cityId)) fail('Unknown event city or owner');
    }
});
_c3 = GameStateSchema;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "CityStateSchema$z.strictObject({\n    id: CityIdSchema, ownerId: PlayerIdSchema, hexId: HexIdSchema, name: z.string().trim().min(1).max(80),\n    population: N, stability: StabilitySchema, development: DevelopmentSchema,\n    specialization: CitySpecializationSchema.nullable(), workers: PopulationAllocationSchema,\n    foundedRound: P, growthProgress: N,\n}).superRefine");
__turbopack_context__.k.register(_c1, "CityStateSchema");
__turbopack_context__.k.register(_c2, "GameStateSchema$z.strictObject({\n    schemaVersion: z.literal(2), gameId: GameIdSchema, version: N,\n    seed: SeedSchema, rng: z.strictObject({ algorithm: z.literal('mulberry32-v1'), state: SeedSchema }),\n    status: z.enum(['ACTIVE', 'FINISHED']), playerCount: z.number().int().min(2).max(6),\n    players: z.array(PlayerStateSchema).min(2).max(6), map: z.array(HexTileSchema),\n    round: P, era: EraSchema, phase: RoundPhaseSchema, config: GameRulesConfigSchema,\n    pendingOrders: z.record(PlayerIdSchema, z.array(PlayerOrderSchema)), eventLog: z.array(GameEventSchema),\n}).superRefine");
__turbopack_context__.k.register(_c3, "GameStateSchema");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/snapshots/v2/rules.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_GAME_CONFIG",
    ()=>DEFAULT_GAME_CONFIG,
    "GameConfigSchema",
    ()=>GameConfigSchema,
    "GameRulesConfigSchema",
    ()=>GameRulesConfigSchema,
    "GovernmentModifiersSchema",
    ()=>GovernmentModifiersSchema,
    "SpecializationModifiersSchema",
    ()=>SpecializationModifiersSchema,
    "createDefaultRules",
    ()=>createDefaultRules
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/snapshots/v2/core.js [app-client] (ecmascript)");
;
;
const signed = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(-100).max(100);
const GovernmentModifiersSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    capacityFlat: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    capacityPerCity: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    unstableBelow: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"],
    unstableCityCapacityPenalty: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    capitalCrisisBelow: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"],
    capitalCrisisPenalty: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    capitalStability: signed,
    developedCityStability: signed,
    developedMinLevel: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DevelopmentSchema"],
    globalStability: signed,
    multiCityStability: signed,
    multiCityMinimum: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    wealthBonusPercent: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    commercialWealthBonusPercent: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    commandPointsDelta: signed,
    futureKnowledgeBonusPercent: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    futureInfluenceBonusPercent: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    futureInequalityStabilityPenalty: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    futureReformFlexibilityPenalty: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
});
const SpecializationModifiersSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    producerBonus: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    artisanBonus: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    merchantBonus: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    scholarBonus: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    administrativeCapacity: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    futureRecruitmentPreparation: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    futureInfluenceBonus: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
});
const GameRulesConfigSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    baseCommandPoints: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    foodPerPopulation: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    growthThreshold: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    maxGrowthPerMaintenance: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    initialPopulation: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    initialStability: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"],
    maxDevelopment: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DevelopmentSchema"],
    developmentPopulationCaps: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
    ]),
    developmentCosts: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"]
    ]),
    specializationMinimumDevelopment: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DevelopmentSchema"],
    productionPerWorker: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        producers: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        artisans: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        merchants: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        scholars: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    specializationModifiers: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CitySpecializationSchema"], SpecializationModifiersSchema),
    governmentModifiers: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GovernmentSchema"], GovernmentModifiersSchema),
    administrativeRules: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        baseCapacity: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        loadPerCity: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        developmentStep: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        populationStep: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        overextensionStabilityPenalty: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        overextensionEconomicPercent: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(0).max(100)
    }),
    stabilityThresholds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        criticalMax: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"],
        unstableMax: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"],
        tenseMax: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"],
        stableMax: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"]
    }),
    stabilityProductionPercent: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        CRITICAL: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        UNSTABLE: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        TENSE: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        STABLE: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        PROSPEROUS: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    blockDevelopmentAtCritical: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    shortageStabilityPenalty: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
}).superRefine(_c = (rules, ctx)=>{
    const { criticalMax, unstableMax, tenseMax, stableMax } = rules.stabilityThresholds;
    if (!(criticalMax < unstableMax && unstableMax < tenseMax && tenseMax < stableMax && stableMax < 100)) ctx.addIssue({
        code: 'custom',
        message: 'Stability bands must be strictly increasing and leave five nonempty bands'
    });
    if (rules.initialPopulation > rules.developmentPopulationCaps[0]) ctx.addIssue({
        code: 'custom',
        message: 'Initial population exceeds settlement capacity'
    });
    if (rules.specializationMinimumDevelopment > rules.maxDevelopment) ctx.addIssue({
        code: 'custom',
        message: 'Specialization minimum exceeds max development'
    });
    rules.developmentPopulationCaps.forEach((cap, i, caps)=>{
        if (i > 0 && cap < (caps[i - 1] ?? cap)) ctx.addIssue({
            code: 'custom',
            message: 'Population caps must not decrease'
        });
    });
});
_c1 = GameRulesConfigSchema;
const GameConfigSchema = GameRulesConfigSchema;
const government = {
    capacityFlat: 0,
    capacityPerCity: 0,
    unstableBelow: 40,
    unstableCityCapacityPenalty: 0,
    capitalCrisisBelow: 20,
    capitalCrisisPenalty: 0,
    capitalStability: 0,
    developedCityStability: 0,
    developedMinLevel: 3,
    globalStability: 0,
    multiCityStability: 0,
    multiCityMinimum: 2,
    wealthBonusPercent: 0,
    commercialWealthBonusPercent: 0,
    commandPointsDelta: 0,
    futureKnowledgeBonusPercent: 0,
    futureInfluenceBonusPercent: 0,
    futureInequalityStabilityPenalty: 0,
    futureReformFlexibilityPenalty: 0
};
const specialization = {
    producerBonus: 0,
    artisanBonus: 0,
    merchantBonus: 0,
    scholarBonus: 0,
    administrativeCapacity: 0,
    futureRecruitmentPreparation: 0,
    futureInfluenceBonus: 0
};
// Provisional balance values, cloned and validated for each match.
const defaults = {
    baseCommandPoints: 4,
    foodPerPopulation: 1,
    growthThreshold: 10,
    maxGrowthPerMaintenance: 1,
    initialPopulation: 2,
    initialStability: 60,
    maxDevelopment: 5,
    developmentPopulationCaps: [
        3,
        5,
        8,
        12,
        16
    ],
    developmentCosts: [
        {
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"])(),
            materials: 5
        },
        {
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"])(),
            materials: 10
        },
        {
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"])(),
            materials: 15
        },
        {
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"])(),
            materials: 20
        }
    ],
    specializationMinimumDevelopment: 1,
    productionPerWorker: {
        producers: 2,
        artisans: 1,
        merchants: 1,
        scholars: 1
    },
    specializationModifiers: {
        AGRARIAN: {
            ...specialization,
            producerBonus: 1
        },
        COMMERCIAL: {
            ...specialization,
            merchantBonus: 1
        },
        ACADEMIC: {
            ...specialization,
            scholarBonus: 1
        },
        ADMINISTRATIVE: {
            ...specialization,
            administrativeCapacity: 2
        },
        MILITARY: {
            ...specialization,
            futureRecruitmentPreparation: 1
        },
        INDUSTRIAL: {
            ...specialization,
            artisanBonus: 1
        },
        CULTURAL: {
            ...specialization,
            futureInfluenceBonus: 1
        }
    },
    governmentModifiers: {
        PROTO_GOVERNANCE: {
            ...government
        },
        MONARCHY: {
            ...government,
            capacityFlat: 2,
            capitalStability: 3,
            capitalCrisisPenalty: 5
        },
        REPUBLIC: {
            ...government,
            developedCityStability: 2,
            unstableCityCapacityPenalty: 1,
            futureKnowledgeBonusPercent: 10,
            futureInfluenceBonusPercent: 10
        },
        OLIGARCHY: {
            ...government,
            wealthBonusPercent: 10,
            commercialWealthBonusPercent: 15,
            futureInequalityStabilityPenalty: 2
        },
        THEOCRACY: {
            ...government,
            globalStability: 2,
            futureInfluenceBonusPercent: 10,
            futureReformFlexibilityPenalty: 1
        },
        CONFEDERATION: {
            ...government,
            capacityPerCity: 1,
            multiCityStability: 2,
            commandPointsDelta: -1
        }
    },
    administrativeRules: {
        baseCapacity: 3,
        loadPerCity: 1,
        developmentStep: 2,
        populationStep: 5,
        overextensionStabilityPenalty: 3,
        overextensionEconomicPercent: 90
    },
    stabilityThresholds: {
        criticalMax: 19,
        unstableMax: 39,
        tenseMax: 59,
        stableMax: 79
    },
    stabilityProductionPercent: {
        CRITICAL: 75,
        UNSTABLE: 90,
        TENSE: 100,
        STABLE: 100,
        PROSPEROUS: 110
    },
    blockDevelopmentAtCritical: true,
    shortageStabilityPenalty: 5
};
function freeze(value) {
    if (value !== null && typeof value === 'object') {
        Object.freeze(value);
        Object.values(value).forEach(freeze);
    }
    return value;
}
const DEFAULT_GAME_CONFIG = freeze(GameRulesConfigSchema.parse(defaults));
const createDefaultRules = ()=>GameRulesConfigSchema.parse(DEFAULT_GAME_CONFIG);
var _c, _c1;
__turbopack_context__.k.register(_c, "GameRulesConfigSchema$z.strictObject({\n    baseCommandPoints: N, foodPerPopulation: N, growthThreshold: P,\n    maxGrowthPerMaintenance: P, initialPopulation: N, initialStability: StabilitySchema,\n    maxDevelopment: DevelopmentSchema,\n    developmentPopulationCaps: z.tuple([P, P, P, P, P]),\n    developmentCosts: z.tuple([ResourcePoolSchema, ResourcePoolSchema, ResourcePoolSchema, ResourcePoolSchema]),\n    specializationMinimumDevelopment: DevelopmentSchema,\n    productionPerWorker: z.strictObject({ producers: N, artisans: N, merchants: N, scholars: N }),\n    specializationModifiers: z.record(CitySpecializationSchema, SpecializationModifiersSchema),\n    governmentModifiers: z.record(GovernmentSchema, GovernmentModifiersSchema),\n    administrativeRules: z.strictObject({ baseCapacity: N, loadPerCity: N, developmentStep: P, populationStep: P, overextensionStabilityPenalty: N, overextensionEconomicPercent: z.number().int().min(0).max(100) }),\n    stabilityThresholds: z.strictObject({ criticalMax: StabilitySchema, unstableMax: StabilitySchema, tenseMax: StabilitySchema, stableMax: StabilitySchema }),\n    stabilityProductionPercent: z.strictObject({ CRITICAL: N, UNSTABLE: N, TENSE: N, STABLE: N, PROSPEROUS: N }),\n    blockDevelopmentAtCritical: z.boolean(), shortageStabilityPenalty: N,\n}).superRefine");
__turbopack_context__.k.register(_c1, "GameRulesConfigSchema");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/territory-invariants.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Relational snapshot integrity. The engine owns command transitions and production.
__turbopack_context__.s([
    "axialDistance",
    ()=>axialDistance,
    "connectedTo",
    ()=>connectedTo,
    "improvementCompatible",
    ()=>improvementCompatible,
    "productiveTile",
    ()=>productiveTile,
    "territorialInvariantErrors",
    ()=>territorialInvariantErrors
]);
function axialDistance(a, b) {
    const q = a.q - b.q;
    const r = a.r - b.r;
    return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
}
function improvementCompatible(tile, improvement, rules) {
    if (tile.terrain === 'UNKNOWN' || tile.terrain === 'SEA') return false;
    const entry = rules.improvementCatalog[improvement];
    return (entry.terrains.includes(tile.terrain) || entry.alternateFeature !== null && tile.features.includes(entry.alternateFeature)) && (entry.requiredFeature === null || tile.features.includes(entry.requiredFeature));
}
function connectedTo(map, tile, center) {
    const seen = new Set([
        center.id
    ]);
    const queue = [
        center
    ];
    for(let index = 0; index < queue.length; index += 1){
        const current = queue[index];
        if (!current) continue;
        if (current.id === tile.id) return true;
        for (const next of map)if (next.ownerId === center.ownerId && !seen.has(next.id) && axialDistance(current, next) === 1) {
            seen.add(next.id);
            queue.push(next);
        }
    }
    return false;
}
function productiveTile(tile, rules) {
    if (tile.terrain === 'UNKNOWN' || tile.terrain === 'SEA') return false;
    return [
        rules.terrainYields[tile.terrain],
        ...tile.features.map((feature)=>rules.featureCatalog[feature].yield),
        ...tile.improvement === null ? [] : [
            rules.improvementCatalog[tile.improvement].yield
        ]
    ].some((yieldValue)=>Object.values(yieldValue).some((amount)=>amount > 0));
}
function territorialInvariantErrors(state) {
    const errors = [];
    const rules = state.config.territory;
    const cities = state.players.flatMap((player)=>player.civilization.cities);
    const worked = new Set();
    for (const tile of state.map){
        if (new Set(tile.features).size !== tile.features.length || tile.features.some((feature)=>!rules.featureCatalog[feature].terrains.includes(tile.terrain))) errors.push('Incompatible or duplicate terrain features');
        if (tile.terrain === 'UNKNOWN' && (tile.features.length > 0 || tile.improvement !== null)) errors.push('UNKNOWN tile cannot have features or improvements');
        if (tile.ownerId === null !== (tile.controllerCityId === null)) errors.push('Territory owner/controller must be paired');
        if (tile.terrain === 'SEA' && (tile.ownerId !== null || tile.improvement !== null)) errors.push('SEA economy is disabled');
        if (tile.improvement !== null && (tile.ownerId === null || !improvementCompatible(tile, tile.improvement, rules))) errors.push('Invalid tile improvement');
        if (tile.controllerCityId !== null) {
            const city = cities.find((entry)=>entry.id === tile.controllerCityId);
            const center = state.map.find((entry)=>entry.id === city?.hexId);
            if (!city || !center || city.ownerId !== tile.ownerId) errors.push('Unknown or foreign territorial controller');
            else if (axialDistance(center, tile) > (rules.cityRadii[city.development - 1] ?? 0) || !connectedTo(state.map, tile, center)) errors.push('Territory outside range or disconnected from controller');
        }
    }
    for (const city of cities){
        const center = state.map.find((tile)=>tile.id === city.hexId);
        if (!center || center.ownerId !== city.ownerId || center.controllerCityId !== city.id || center.terrain === 'SEA') errors.push('City center must belong to its city');
        if (new Set(city.workedHexIds).size !== city.workedHexIds.length || city.workedHexIds.length > city.workers.producers) errors.push('Worked hexes exceed producers or contain duplicates');
        for (const id of city.workedHexIds){
            const tile = state.map.find((entry)=>entry.id === id);
            if (!tile || tile.ownerId !== city.ownerId || tile.controllerCityId !== city.id || worked.has(id) || !productiveTile(tile, rules)) errors.push('Invalid worked hex');
            worked.add(id);
        }
        if (city.districts.length > (rules.districtSlots[city.development - 1] ?? 0) || new Set(city.districts.map((district)=>district.type)).size !== city.districts.length) errors.push('District slots or uniqueness violated');
        for (const district of city.districts)if (district.builtRound < city.foundedRound || district.builtRound > state.round || city.development < rules.districts[district.type].minimumDevelopment) errors.push('Invalid district requirements');
        if (new Set(city.buildings.map((building)=>building.type)).size !== city.buildings.length) errors.push('Duplicate building');
        for (const building of city.buildings){
            const entry = rules.buildings[building.type];
            const district = city.districts.find((district)=>district.type === entry.district);
            if (!district || building.builtRound < district.builtRound || building.builtRound > state.round || city.development < entry.minimumDevelopment) errors.push('Missing building district or invalid requirements');
        }
    }
    return errors;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/game-domain/dist/territory.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BuildingCatalogEntrySchema",
    ()=>BuildingCatalogEntrySchema,
    "BuildingStateSchema",
    ()=>BuildingStateSchema,
    "BuildingTypeSchema",
    ()=>BuildingTypeSchema,
    "CityProductionBreakdownSchema",
    ()=>CityProductionBreakdownSchema,
    "DistrictCatalogEntrySchema",
    ()=>DistrictCatalogEntrySchema,
    "DistrictStateSchema",
    ()=>DistrictStateSchema,
    "DistrictTypeSchema",
    ()=>DistrictTypeSchema,
    "EconomyBreakdownSchema",
    ()=>EconomyBreakdownSchema,
    "ResourceDeltaSchema",
    ()=>ResourceDeltaSchema,
    "TerritoryRulesSchema",
    ()=>TerritoryRulesSchema,
    "createDefaultTerritoryRules",
    ()=>createDefaultTerritoryRules
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-client] (ecmascript)");
;
;
const DistrictTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CitySpecializationSchema"].options);
const BuildingTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'GRANARY',
    'MARKET',
    'LIBRARY',
    'ARCHIVE',
    'BARRACKS',
    'WORKSHOP',
    'CULTURAL_CENTER'
]);
const DistrictStateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    type: DistrictTypeSchema,
    builtRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
});
const BuildingStateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    type: BuildingTypeSchema,
    builtRound: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
});
const effect = {
    production: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    workerRequirement: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PopulationRoleSchema"].nullable(),
    administrativeCapacity: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    garrisonCapacity: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
};
const DistrictCatalogEntrySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    cost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    minimumDevelopment: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DevelopmentSchema"],
    ...effect,
    specializationBonus: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    specializationCapacityBonus: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    specializationGarrisonBonus: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
});
const BuildingCatalogEntrySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    district: DistrictTypeSchema,
    cost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    minimumDevelopment: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DevelopmentSchema"],
    ...effect,
    growthThresholdReduction: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
});
const terrainList = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TerrainTypeSchema"]).min(1).refine((items)=>new Set(items).size === items.length, 'Duplicate terrain');
const TerritoryRulesSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    terrainYields: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TerrainTypeSchema"], __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TileYieldSchema"]),
    featureCatalog: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TerrainFeatureSchema"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        terrains: terrainList,
        yield: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TileYieldSchema"]
    })),
    improvementCatalog: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ImprovementTypeSchema"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        terrains: terrainList,
        alternateFeature: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TerrainFeatureSchema"].nullable(),
        requiredFeature: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TerrainFeatureSchema"].nullable(),
        yield: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TileYieldSchema"],
        cost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"]
    })),
    cityRadii: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"]
    ]),
    districtSlots: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].tuple([
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    ]),
    claimCost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    foundingCost: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    minimumCityDistance: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    foundingTerrains: terrainList,
    foundingPopulation: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    foundingStability: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StabilitySchema"],
    controlledHexesPerLoad: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PositiveIntegerSchema"],
    districts: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(DistrictTypeSchema, DistrictCatalogEntrySchema),
    buildings: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(BuildingTypeSchema, BuildingCatalogEntrySchema)
}).superRefine(_c = (rules, ctx)=>{
    if (Object.values(rules.terrainYields.UNKNOWN).some((value)=>value !== 0)) ctx.addIssue({
        code: 'custom',
        message: 'UNKNOWN terrain must yield zero'
    });
    if (rules.foundingTerrains.some((terrain)=>terrain === 'UNKNOWN' || terrain === 'SEA')) ctx.addIssue({
        code: 'custom',
        message: 'UNKNOWN and SEA cannot support founding'
    });
    for (const values of [
        rules.cityRadii,
        rules.districtSlots
    ])values.forEach((value, index)=>{
        if (index > 0 && value < (values[index - 1] ?? value)) ctx.addIssue({
            code: 'custom',
            message: 'Development capacities must not decrease'
        });
    });
});
_c1 = TerritoryRulesSchema;
const pool = (values = {})=>({
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["emptyResourcePool"])(),
        ...values
    });
const yieldOf = (food = 0, materials = 0, wealth = 0)=>({
        food,
        materials,
        wealth
    });
const district = (cost, production, workerRequirement = null)=>({
        cost,
        production,
        workerRequirement,
        minimumDevelopment: 1,
        administrativeCapacity: 0,
        garrisonCapacity: 0,
        specializationBonus: production,
        specializationCapacityBonus: 0,
        specializationGarrisonBonus: 0
    });
const building = (district, cost, production = pool(), workerRequirement = null)=>({
        district,
        cost,
        production,
        workerRequirement,
        minimumDevelopment: 1,
        administrativeCapacity: 0,
        garrisonCapacity: 0,
        growthThresholdReduction: 0
    });
function createDefaultTerritoryRules() {
    return TerritoryRulesSchema.parse({
        terrainYields: {
            UNKNOWN: yieldOf(),
            PLAINS: yieldOf(2),
            FOREST: yieldOf(1, 1),
            HILLS: yieldOf(0, 2),
            MOUNTAINS: yieldOf(0, 2),
            COAST: yieldOf(1, 0, 1),
            SEA: yieldOf(1)
        },
        featureCatalog: {
            RIVER: {
                terrains: [
                    'PLAINS',
                    'FOREST',
                    'HILLS',
                    'COAST'
                ],
                yield: yieldOf(1)
            },
            FERTILE: {
                terrains: [
                    'PLAINS',
                    'FOREST',
                    'HILLS'
                ],
                yield: yieldOf(1)
            },
            TIMBER: {
                terrains: [
                    'FOREST'
                ],
                yield: yieldOf(0, 1)
            },
            STONE: {
                terrains: [
                    'HILLS',
                    'MOUNTAINS'
                ],
                yield: yieldOf(0, 1)
            },
            METAL: {
                terrains: [
                    'HILLS',
                    'MOUNTAINS'
                ],
                yield: yieldOf(0, 1)
            },
            FISH: {
                terrains: [
                    'COAST',
                    'SEA'
                ],
                yield: yieldOf(1)
            }
        },
        improvementCatalog: {
            FARM: {
                terrains: [
                    'PLAINS'
                ],
                alternateFeature: 'FERTILE',
                requiredFeature: null,
                yield: yieldOf(1),
                cost: pool({
                    materials: 1
                })
            },
            LUMBER_CAMP: {
                terrains: [
                    'FOREST'
                ],
                alternateFeature: null,
                requiredFeature: null,
                yield: yieldOf(0, 1),
                cost: pool({
                    materials: 1
                })
            },
            QUARRY: {
                terrains: [
                    'HILLS',
                    'MOUNTAINS'
                ],
                alternateFeature: null,
                requiredFeature: null,
                yield: yieldOf(0, 1),
                cost: pool({
                    materials: 2
                })
            },
            MINE: {
                terrains: [
                    'HILLS',
                    'MOUNTAINS'
                ],
                alternateFeature: null,
                requiredFeature: null,
                yield: yieldOf(0, 2),
                cost: pool({
                    materials: 2,
                    wealth: 1
                })
            },
            FISHERY: {
                terrains: [
                    'COAST'
                ],
                alternateFeature: null,
                requiredFeature: 'FISH',
                yield: yieldOf(1),
                cost: pool({
                    materials: 1
                })
            }
        },
        cityRadii: [
            1,
            1,
            2,
            2,
            3
        ],
        districtSlots: [
            1,
            2,
            3,
            4,
            5
        ],
        claimCost: pool({
            influence: 1
        }),
        foundingCost: pool({
            food: 5,
            materials: 3,
            wealth: 2
        }),
        minimumCityDistance: 2,
        foundingTerrains: [
            'PLAINS',
            'FOREST',
            'HILLS',
            'COAST'
        ],
        foundingPopulation: 1,
        foundingStability: 60,
        controlledHexesPerLoad: 5,
        districts: {
            AGRARIAN: district(pool({
                materials: 2
            }), pool({
                food: 1
            }), 'PRODUCER'),
            COMMERCIAL: district(pool({
                materials: 2,
                wealth: 1
            }), pool({
                wealth: 1
            }), 'MERCHANT'),
            ACADEMIC: district(pool({
                materials: 3,
                wealth: 1
            }), pool({
                knowledge: 1
            }), 'SCHOLAR'),
            ADMINISTRATIVE: {
                ...district(pool({
                    materials: 3
                }), pool()),
                administrativeCapacity: 1,
                specializationCapacityBonus: 1
            },
            MILITARY: {
                ...district(pool({
                    materials: 3
                }), pool()),
                garrisonCapacity: 1,
                specializationGarrisonBonus: 1
            },
            INDUSTRIAL: district(pool({
                materials: 3
            }), pool({
                materials: 1
            }), 'ARTISAN'),
            CULTURAL: district(pool({
                materials: 2,
                wealth: 1
            }), pool({
                influence: 1
            }))
        },
        buildings: {
            GRANARY: {
                ...building('AGRARIAN', pool({
                    materials: 2
                })),
                growthThresholdReduction: 2
            },
            MARKET: building('COMMERCIAL', pool({
                materials: 2,
                wealth: 1
            }), pool({
                wealth: 1
            }), 'MERCHANT'),
            LIBRARY: building('ACADEMIC', pool({
                materials: 3,
                wealth: 1
            }), pool({
                knowledge: 1
            }), 'SCHOLAR'),
            ARCHIVE: {
                ...building('ADMINISTRATIVE', pool({
                    materials: 2
                })),
                administrativeCapacity: 1
            },
            BARRACKS: {
                ...building('MILITARY', pool({
                    materials: 3
                })),
                garrisonCapacity: 2
            },
            WORKSHOP: building('INDUSTRIAL', pool({
                materials: 3
            }), pool({
                materials: 1
            }), 'ARTISAN'),
            CULTURAL_CENTER: building('CULTURAL', pool({
                materials: 2,
                wealth: 1
            }), pool({
                influence: 1
            }))
        }
    });
}
const signed = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER);
const ResourceDeltaSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    food: signed,
    materials: signed,
    wealth: signed,
    knowledge: signed,
    influence: signed
});
const CityProductionBreakdownSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CityIdSchema"],
    workedHexIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HexIdSchema"]),
    sources: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        source: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'population',
            'terrain',
            'feature',
            'improvement',
            'district',
            'building',
            'specialization',
            'government',
            'stability'
        ]),
        delta: ResourceDeltaSchema
    })),
    total: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"]
});
const EconomyBreakdownSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    cities: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(CityProductionBreakdownSchema),
    gross: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    administrativeAdjustment: ResourceDeltaSchema,
    credited: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    foodRequired: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    foodPaid: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    opening: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    closing: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResourcePoolSchema"],
    netChange: ResourceDeltaSchema
});
var _c, _c1;
__turbopack_context__.k.register(_c, "TerritoryRulesSchema$z.strictObject({\n    terrainYields: z.record(TerrainTypeSchema, TileYieldSchema),\n    featureCatalog: z.record(TerrainFeatureSchema, z.strictObject({ terrains: terrainList, yield: TileYieldSchema })),\n    improvementCatalog: z.record(ImprovementTypeSchema, z.strictObject({ terrains: terrainList, alternateFeature: TerrainFeatureSchema.nullable(), requiredFeature: TerrainFeatureSchema.nullable(), yield: TileYieldSchema, cost: ResourcePoolSchema })),\n    cityRadii: z.tuple([P, P, P, P, P]), districtSlots: z.tuple([N, N, N, N, N]),\n    claimCost: ResourcePoolSchema, foundingCost: ResourcePoolSchema, minimumCityDistance: P,\n    foundingTerrains: terrainList, foundingPopulation: N, foundingStability: StabilitySchema,\n    controlledHexesPerLoad: P,\n    districts: z.record(DistrictTypeSchema, DistrictCatalogEntrySchema),\n    buildings: z.record(BuildingTypeSchema, BuildingCatalogEntrySchema),\n}).superRefine");
__turbopack_context__.k.register(_c1, "TerritoryRulesSchema");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/shared/dist/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "err",
    ()=>err,
    "ok",
    ()=>ok
]);
const ok = (value)=>({
        ok: true,
        value
    });
const err = (error)=>({
        ok: false,
        error
    });
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=packages_18ktcbx._.js.map
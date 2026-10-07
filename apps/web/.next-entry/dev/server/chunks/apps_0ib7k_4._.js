module.exports = [
"[project]/apps/server/dist/alpha-bot-policy.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PERSONAS",
    ()=>PERSONAS,
    "PERSONA_ORDER",
    ()=>PERSONA_ORDER,
    "SKILLS",
    ()=>SKILLS,
    "botPlan",
    ()=>botPlan,
    "candidates",
    ()=>candidates,
    "eraTurnActions",
    ()=>eraTurnActions,
    "foodProjection",
    ()=>foodProjection,
    "recordFood",
    ()=>recordFood,
    "rng",
    ()=>rng
]);
/* eslint-disable @typescript-eslint/ban-ts-comment, prefer-const -- ported unchanged from scripts/lib/alpha-bots.mjs (the existing playtest policy) */ // @ts-nocheck
/**
 * Bot policy for the external alpha: the EXISTING deterministic policy of scripts/lib/alpha-bots.mjs (V5.1b playtest bots), ported unchanged in behaviour.
 * It reads a seat-redacted state (alpha-bot-view.ts) and talks to the engine only through `box.apply(seatId, command)`, i.e. the canonical commands.
 * The match harness (createBotMatch, playMatch, invariants, coverage) stays in scripts/lib and is not part of the server.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$growth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-growth.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-urban.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-world.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$economy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/economy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$unit$2d$options$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-unit-options.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-threats.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$era$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-era-turn.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$hegemony$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-hegemony.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-city.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$combat$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-combat.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$independents$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-independents.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-legacy-works.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-leaders.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-actions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-city-ladder.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-route] (ecmascript) <export WEB_ADVANCES as ADVANCEMENTS>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-route] (ecmascript)");
;
;
const PERSONAS = {
    builder: {
        posture: 'HOLD',
        settle: 3,
        army: 2,
        districts: [
            'AGRARIAN',
            'ADMINISTRATIVE',
            'INDUSTRIAL',
            'COMMERCIAL',
            'CULTURAL',
            'ACADEMIC',
            'MILITARY'
        ],
        war: 99,
        domains: [
            'LAND_AND_SEA',
            'STONE_AND_METAL',
            'GOVERNMENT',
            'TRADE',
            'KNOWLEDGE'
        ],
        roles: {
            artisans: 3,
            merchants: 1,
            scholars: 1
        },
        weights: {
            elevate: 1.25,
            build: 1.3,
            recruit: 0.7,
            research: 0.9,
            fort: 1.2
        },
        govs: [
            'CONFEDERATION',
            'MONARCHY'
        ]
    },
    warrior: {
        posture: 'ASSAULT',
        settle: 2,
        army: 6,
        districts: [
            'AGRARIAN',
            'MILITARY',
            'INDUSTRIAL',
            'ADMINISTRATIVE',
            'COMMERCIAL'
        ],
        war: 9,
        domains: [
            'STONE_AND_METAL',
            'GOVERNMENT',
            'LAND_AND_SEA',
            'TRADE',
            'KNOWLEDGE'
        ],
        roles: {
            artisans: 2,
            merchants: 1,
            scholars: 1
        },
        weights: {
            elevate: 0.9,
            build: 0.9,
            recruit: 1.5,
            research: 0.9,
            fort: 0.8
        },
        govs: [
            'AUTOCRACY',
            'MONARCHY'
        ]
    },
    trader: {
        posture: 'MANEUVER',
        settle: 3,
        army: 2,
        districts: [
            'AGRARIAN',
            'COMMERCIAL',
            'ADMINISTRATIVE',
            'ACADEMIC',
            'CULTURAL',
            'INDUSTRIAL'
        ],
        war: 99,
        domains: [
            'TRADE',
            'GOVERNMENT',
            'LAND_AND_SEA',
            'KNOWLEDGE',
            'STONE_AND_METAL'
        ],
        roles: {
            artisans: 1,
            merchants: 3,
            scholars: 1
        },
        weights: {
            elevate: 1.0,
            build: 1.1,
            recruit: 0.6,
            research: 1.0,
            fort: 0.6
        },
        govs: [
            'OLIGARCHY',
            'REPUBLIC'
        ]
    },
    explorer: {
        posture: 'MANEUVER',
        settle: 4,
        army: 2,
        districts: [
            'AGRARIAN',
            'ADMINISTRATIVE',
            'COMMERCIAL',
            'INDUSTRIAL',
            'CULTURAL'
        ],
        war: 99,
        domains: [
            'LAND_AND_SEA',
            'KNOWLEDGE',
            'GOVERNMENT',
            'TRADE',
            'STONE_AND_METAL'
        ],
        roles: {
            artisans: 1,
            merchants: 1,
            scholars: 2
        },
        weights: {
            elevate: 0.9,
            build: 0.9,
            recruit: 0.8,
            research: 1.0,
            fort: 0.6
        },
        explore: 1.6,
        govs: [
            'CONFEDERATION',
            'REPUBLIC'
        ]
    },
    scholar: {
        posture: 'HOLD',
        settle: 2,
        army: 2,
        districts: [
            'AGRARIAN',
            'ACADEMIC',
            'ADMINISTRATIVE',
            'CULTURAL',
            'COMMERCIAL'
        ],
        war: 99,
        domains: [
            'KNOWLEDGE',
            'GOVERNMENT',
            'TRADE',
            'LAND_AND_SEA',
            'STONE_AND_METAL'
        ],
        roles: {
            artisans: 1,
            merchants: 1,
            scholars: 3
        },
        weights: {
            elevate: 1.0,
            build: 1.0,
            recruit: 0.6,
            research: 1.7,
            fort: 0.7
        },
        diversify: true,
        govs: [
            'MERITOCRACY',
            'REPUBLIC',
            'THEOCRACY'
        ]
    },
    balanced: {
        posture: 'HOLD',
        settle: 3,
        army: 3,
        districts: [
            'AGRARIAN',
            'COMMERCIAL',
            'ADMINISTRATIVE',
            'ACADEMIC',
            'MILITARY',
            'CULTURAL',
            'INDUSTRIAL'
        ],
        war: 14,
        domains: [
            'GOVERNMENT',
            'LAND_AND_SEA',
            'STONE_AND_METAL',
            'TRADE',
            'KNOWLEDGE'
        ],
        roles: {
            artisans: 1,
            merchants: 1,
            scholars: 1
        },
        weights: {
            elevate: 1.0,
            build: 1.0,
            recruit: 1.0,
            research: 1.0,
            fort: 1.0
        },
        govs: [
            'REPUBLIC',
            'MONARCHY',
            'THEOCRACY'
        ]
    }
};
const PERSONA_ORDER = [
    'balanced',
    'warrior',
    'builder',
    'trader',
    'explorer',
    'scholar'
];
function rng(seed) {
    let a = seed >>> 0;
    return ()=>{
        a = a + 0x6d2b79f5 >>> 0;
        let t = a;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
const ZERO7 = ()=>({
        food: 0,
        wood: 0,
        stone: 0,
        metal: 0,
        wealth: 0,
        knowledge: 0,
        influence: 0
    });
const ERAS = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options;
const dist = (a, b)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"](a, b);
const SKILLS = [
    'naive',
    'competent',
    'hardcore'
];
function send(box, id, command) {
    const { ctx } = box;
    const full = {
        ...command,
        expectedVersion: box.state.version
    };
    let result;
    try {
        result = box.apply(id, full);
    } catch (error) {
        ctx.crashes.push({
            round: box.state.core.round,
            phase: box.state.phase,
            actor: id,
            type: command.type,
            message: String(error?.message ?? error).slice(0, 200)
        });
        return false;
    }
    ctx.counters.commands++;
    if (!result.ok) {
        ctx.counters.rejected++;
        ctx.rejectedCodes.add(`${command.type}:${result.error.code}`);
        return false;
    }
    box.state = box.refresh();
    if (command.type === 'URBAN_ACTION' && command.cityId) {
        const k = `${box.state.core.round}:${command.cityId}`;
        ctx.activations.set(k, (ctx.activations.get(k) ?? 0) + 1);
    }
    return true;
}
const me = (state, id)=>state.players.find((p)=>p.playerId === id);
const owner = (state, id)=>state.core.players.find((p)=>p.id === id);
const tileOf = (state, hex)=>state.core.map.find((t)=>t.id === hex);
const nextOrderId = (box, id)=>`bot-${id}-${box.state.core.round}-${++box.ctx.orderSeq}`;
const failedKey = (box, id)=>{
    const set = box.ctx.failed.get(`${id}:${box.state.core.round}`) ?? new Set();
    box.ctx.failed.set(`${id}:${box.state.core.round}`, set);
    return set;
};
function foodProjection(state, id, { spendFood = 0, addLand = 0, addPop = 0 } = {}) {
    const forecast = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$growth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["growthForecast"](state, id), seat = me(state, id);
    // Planned Orders pay and act at resolution, so what is already queued this round counts too (food costs and new land pieces).
    const planned = seat.plannedActions.filter((a)=>a.type === 'URBAN_ACTION');
    if (planned.length) {
        const view = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["urbanOptions"](state, id);
        for (const a of planned){
            const row = (view.cities[a.cityId] ?? []).find((o)=>o.action === a.action && (o.unit ?? null) === (a.unit ?? null) && (!a.build || JSON.stringify(o.build) === JSON.stringify(a.build)));
            spendFood += row?.cost?.food ?? 0;
            if (a.action === 'RECRUIT' && [
                'INFANTRY',
                'GUARD',
                'RANGED',
                'CAVALRY',
                'SIEGE'
            ].includes(a.unit)) addLand += a.count ?? 1;
        }
    }
    const sustenance = forecast.cities.reduce((n, c)=>n + c.eats, 0) + Math.ceil(addPop / 2);
    const land = state.units.filter((u)=>u.ownerId === id && state.rules.units[u.kind].domain === 'LAND' && state.rules.units[u.kind].strength > 0).length;
    const kitExtra = Math.max(0, forecast.foodEaten - sustenance - Math.ceil(land / 2));
    const military = Math.ceil((land + addLand) / 2) + kitExtra;
    let stock = seat.resources.food - spendFood + forecast.foodProduced;
    const famine = stock < sustenance;
    stock -= sustenance;
    let grown = 0;
    if (!famine) {
        for (const c of forecast.cities)if (!c.capped && stock >= c.growCost) {
            stock -= c.growCost;
            grown++;
        }
    }
    const unitShortage = stock < military;
    stock -= military;
    const nextSustenance = forecast.cities.reduce((n, c)=>n + Math.ceil((c.population + (!c.capped && !famine ? 1 : 0)) / 2), 0);
    // Crescer is automatic, so each city will fill its level's ceiling: that is the sustenance the income must cover in the long run.
    // Without PRODUCE the income is zero: the same maintenance replay with no production tells when a city's activation must go to Produzir.
    let dry = seat.resources.food - spendFood - sustenance;
    if (dry >= 0) {
        for (const c of forecast.cities)if (!c.capped && dry >= c.growCost) dry -= c.growCost;
    }
    const dryEnd = dry - military;
    // The smallest set of cities (richest food first) whose Produzir keeps the maintenance paid with a reserve: only those activations are mandatory.
    const replay = (income)=>{
        let st = seat.resources.food - spendFood + income - sustenance;
        if (st >= 0) {
            for (const c of forecast.cities)if (!c.capped && st >= c.growCost) st -= c.growCost;
        }
        return st - military;
    };
    const byFood = [
        ...forecast.cities
    ].sort((a, b)=>b.producedFood - a.producedFood || a.cityId.localeCompare(b.cityId));
    const mustProduce = new Set();
    let gained = 0;
    for (const c of byFood){
        if (replay(gained) >= 1) break;
        mustProduce.add(c.cityId);
        gained += c.producedFood;
    }
    const ceilingSustenance = forecast.cities.reduce((n, c)=>n + Math.ceil(Math.max(c.population, c.ceiling) / 2), 0);
    return {
        mustProduce,
        dryEnd,
        ceilingGap: ceilingSustenance + military - forecast.foodProduced,
        foodNow: seat.resources.food,
        income: forecast.foodProduced,
        sustenance,
        military,
        endStock: stock,
        famine,
        unitShortage,
        grown,
        nextGap: nextSustenance + military - forecast.foodProduced
    };
}
/** What the civilization is short of: the next Elevar of each city and a working floor per resource, minus the stock. */ function deficits(state, id) {
    const stock = me(state, id).resources, target = {
        food: 9,
        wood: 8,
        stone: 6,
        metal: 2,
        wealth: 6,
        knowledge: 6,
        influence: 4,
        culture: 0
    };
    for (const meta of state.cities.filter((c)=>c.currentOwnerId === id)){
        const next = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nextLevel"](meta.level), req = next ? __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["elevateRequirement"](next) : null;
        if (req) for (const [k, v] of Object.entries(req.cost))target[k] = Math.max(target[k] ?? 0, Math.min(14, v + 2));
    }
    return Object.fromEntries(Object.entries(target).map(([k, v])=>[
            k,
            Math.max(0, v - (stock[k] ?? 0))
        ]));
}
/** Population roles from persona weights: producers carry food, the rest split by weight; soldiers stay as they are. */ function assignPopulation(box, id, persona) {
    const o = owner(box.state, id), state = box.state;
    const enemies = state.wars.filter((pair)=>pair.includes(id)).length > 0;
    const threatened = (__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatView"](state, id) ?? []).length > 0;
    const armyNow = state.units.filter((u)=>u.ownerId === id && [
            'INFANTRY',
            'GUARD',
            'RANGED',
            'CAVALRY',
            'SIEGE'
        ].includes(u.kind)).length;
    const comp = box.ctx.skill !== 'naive';
    const wantArmy = (persona.army + (enemies ? 2 : 0) + (threatened ? 1 : 0) + (comp ? 1 : 0)) * o.civilization.cities.length;
    for (const city of o.civilization.cities){
        const meta = state.cities.find((c)=>c.cityId === city.id);
        if (!meta || meta.status === 'OCCUPIED') continue;
        const w = city.workers, pop = city.population;
        // Soldados are the pool Recrutar draws from: ask for as many as the army is short, at most one third of the city.
        const soldiers = Math.max(0, Math.min(Math.floor(pop / 3), Math.max(w.soldiers, wantArmy - armyNow > 0 ? Math.min(2, wantArmy - armyNow) : 0)));
        const free = pop - soldiers;
        if (free <= 0) continue;
        const foodRich = me(state, id).resources.food >= 11;
        const producers = Math.max(1, Math.ceil(free * (foodRich ? 0.3 : me(state, id).resources.food < 5 ? 0.7 : 0.5))), rest = free - producers;
        const stock = me(state, id).resources;
        const woodShort = stock.wood < 6 || stock.stone < 3 && stock.wood < 9;
        const miss = box.ctx.skill === 'naive' ? null : deficits(state, id);
        const roles = miss ? {
            artisans: 0.6 + miss.wood,
            merchants: 0.6 + miss.wealth,
            scholars: 0.6 + miss.knowledge
        } : woodShort ? {
            artisans: 4,
            merchants: persona.roles.merchants / 2,
            scholars: persona.roles.scholars / 2
        } : persona.roles;
        const total = roles.artisans + roles.merchants + roles.scholars;
        let artisans = Math.floor(rest * roles.artisans / total), merchants = Math.floor(rest * roles.merchants / total);
        let scholars = Math.floor(rest * roles.scholars / total);
        const leftover = rest - artisans - merchants - scholars;
        if (woodShort) artisans += leftover;
        else scholars += leftover;
        const next = {
            producers: Math.min(producers, free),
            artisans,
            merchants,
            scholars,
            soldiers,
            unassigned: 0
        };
        if ([
            'producers',
            'artisans',
            'merchants',
            'scholars',
            'soldiers',
            'unassigned'
        ].every((k)=>next[k] === w[k])) continue;
        send(box, id, {
            type: 'MANAGE',
            command: {
                type: 'ASSIGN_POPULATION',
                playerId: id,
                cityId: city.id,
                workers: next,
                expectedVersion: box.state.core.version
            }
        });
    }
}
const IMPROVEMENT_FOR = (tile)=>tile.improvement ? null : tile.terrain === 'PLAINS' ? 'FARM' : tile.terrain === 'FOREST' ? 'LUMBER_CAMP' : tile.terrain === 'HILLS' ? tile.features.includes('METAL') ? 'MINE' : 'QUARRY' : tile.terrain === 'COAST' && tile.features.includes('FISH') ? 'FISHERY' : null;
/** Worked hexes are a free action: pick the claimed hexes that fit what the civilization lacks (food when low, materials otherwise). */ function assignWorkedHexes(box, id) {
    const { state } = box, o = owner(state, id), p = me(state, id), rules = state.core.config;
    for (const city of o.civilization.cities){
        const claimed = state.core.map.filter((t)=>t.controllerCityId === city.id && t.id !== city.hexId);
        if (!claimed.length) continue;
        const needFood = p.resources.food < 9, needWood = p.resources.wood < 5, miss = box.ctx.skill === 'naive' ? null : deficits(state, id);
        const value = (t)=>{
            const y = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$economy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["tileYieldBreakdown"](t, rules).total;
            const stone = t.terrain === 'HILLS' || t.terrain === 'MOUNTAINS';
            if (miss) return y.food * (1 + miss.food * 0.5) + y.materials * (1 + (stone ? miss.stone : miss.wood) * 0.35) + y.wealth * (1 + miss.wealth * 0.3);
            return (needFood ? y.food * 3 : y.food) + (needWood ? stone ? y.materials : y.materials * 2 : y.materials * 1.5) + y.wealth;
        };
        const pick = [
            ...claimed
        ].sort((a, b)=>value(b) - value(a) || a.id.localeCompare(b.id)).slice(0, Math.max(1, city.workers.producers)).map((t)=>t.id).sort();
        if (pick.join() === [
            ...city.workedHexIds
        ].sort().join()) continue;
        send(box, id, {
            type: 'MANAGE',
            command: {
                type: 'ASSIGN_WORKED_HEXES',
                playerId: id,
                cityId: city.id,
                hexIds: pick,
                expectedVersion: state.core.version
            }
        });
    }
}
/** Web advances still missing for the next Elevar of any own city (first missing link of each prerequisite chain). */ function elevateNeeds(state, id) {
    const p = me(state, id), need = new Set();
    const chase = (nodeId)=>{
        const node = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].find((a)=>a.id === nodeId);
        if (!node || p.research.includes(nodeId)) return;
        const missing = node.prerequisites.filter((q)=>!p.research.includes(q));
        if (missing.length) missing.forEach(chase);
        else need.add(nodeId);
    };
    for (const meta of state.cities.filter((c)=>c.currentOwnerId === id)){
        const next = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nextLevel"](meta.level), req = next ? __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["elevateRequirement"](next) : null;
        if (req) req.advances.forEach(chase);
    }
    return need;
}
function pickResearch(box, id, persona, options) {
    const p = me(box.state, id);
    const needs = box.ctx.skill === 'naive' ? new Set() : elevateNeeds(box.state, id);
    const slotDomains = new Set(p.resonance.slots.flatMap((s)=>s.domains));
    const scored = options.filter((o)=>!o.blocked).map((o)=>{
        const node = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].find((a)=>a.id === o.advancementId);
        const heritage = !node;
        const domain = node?.domain ?? __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["heritageAdvance"](o.advancementId)?.domain ?? null;
        let score = 50 - (node ? ERAS.indexOf(node.era) : 3) * 0 + (heritage ? 8 : 0) + (node?.convergence ? 6 : 0);
        const rank = domain ? persona.domains.indexOf(domain) : 2;
        score += (4 - Math.max(0, rank)) * 5;
        if (persona.diversify && domain && !slotDomains.has(domain)) score += 40;
        if (node?.pair) score += persona.diversify ? 25 : 6;
        score -= Math.min(10, Object.values(o.cost).reduce((a, b)=>a + b, 0));
        if (node && [
            'web-agriculture',
            'web-masonry',
            'web-exchange',
            'web-writing'
        ].includes(node.id)) score += 12;
        if (node && [
            'web-urbanism',
            'web-sanitation',
            'web-world-metropolises',
            'web-engineering'
        ].includes(node.id)) score += 8;
        if (needs.has(o.advancementId)) score += 45;
        return {
            o,
            score: score + box.ctx.rand[id]() * 6
        };
    }).sort((a, b)=>b.score - a.score);
    return scored.map((s)=>s.o);
}
function candidates(box, id, persona) {
    const { state, ctx } = box, round = state.core.round, p = me(state, id), o = owner(state, id);
    if (!o.civilization.cities.length) return [];
    const out = [], rand = ctx.rand[id];
    const add = (score, key, command)=>out.push({
            score: score + rand() * 4,
            key,
            command
        });
    const view = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["urbanOptions"](state, id), unitOpts = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$unit$2d$options$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaUnitOptions"](state, id);
    // Same exploration options a human receives (orientations, "Requer acesso naval."): computed on the real match because the redacted copy has hidden Regions.
    if (box.real) {
        const realOpts = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$unit$2d$options$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaUnitOptions"](box.real(), id);
        for (const unitId of Object.keys(unitOpts))if (realOpts[unitId]) unitOpts[unitId].explore = realOpts[unitId].explore;
    }
    const eraIndex = ERAS.indexOf(p.era);
    const cities = o.civilization.cities, nCities = cities.length;
    const w = persona.weights;
    const comp = ctx.skill !== 'naive', hard = ctx.skill === 'hardcore';
    const threatsSeen = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatView"](state, id) ?? [], alerts = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatAlerts"](state, id) ?? [];
    // Austerity (V51B-16): hunger or unpaid pieces last round, or a city near revolt (Ânimo ≤ 2, and ≤ 1 stops production), freezes expansion and recruiting
    // until the economy has been clean for a round. Ânimo is the real bottleneck: every unpaid round costs 1 in every city.
    const lastFood = (ctx.foodLog ?? []).filter((e)=>e.seat === id).at(-1);
    const baseFood = comp ? foodProjection(state, id) : null;
    const austere = comp && ((lastFood?.prevFamine ?? 0) > 0 || (lastFood?.prevUnitShortage ?? 0) > 0 || (lastFood?.minMood ?? 5) <= 1);
    const myUnits = state.units.filter((u)=>u.ownerId === id);
    const army = myUnits.filter((u)=>[
            'INFANTRY',
            'GUARD',
            'RANGED',
            'CAVALRY',
            'SIEGE'
        ].includes(u.kind));
    const enemies = state.wars.filter((pair)=>pair.includes(id)).map((pair)=>pair.find((x)=>x !== id));
    // Government reform (the Influência Order reserved in the last round of the Era).
    if (__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$era$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isReformRound"](state)) {
        const opts = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$era$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentOptions"](state, id);
        if (!opts.planned) {
            const pick = persona.govs.map((g)=>opts.options.find((x)=>x.government === g && x.block === null)).find(Boolean) ?? opts.options.find((x)=>x.block === null && x.government !== o.civilization.government);
            if (pick) add(97, `gov:${pick.government}`, {
                type: 'MANAGE',
                command: {
                    type: 'ADOPT_GOVERNMENT',
                    playerId: id,
                    government: pick.government,
                    expectedVersion: state.core.version
                }
            });
        }
    }
    // Hegemony in Era VII.
    if (p.era === 'ASCENSION' && !p.hegemony) {
        for (const entry of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$hegemony$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hegemonyProgress"](state, id))if (entry.requirements.every((r)=>r.met)) add(99, `heg:${entry.path}`, {
            type: 'DECLARE_HEGEMONY',
            path: entry.path
        });
    }
    // Pioneers (V51B-16): the one civil piece explores OR founds per Order. Roles: with two, the first founds and the second explores; with one,
    // it founds as soon as a legal site is in reach and explores toward the nearest closed Region until then. Pieces keep clear of visible threats.
    const wantCities = persona.settle + (eraIndex >= 3 ? 1 : 0);
    const pioneers = myUnits.filter((u)=>u.kind === 'PIONEER').sort((a, b)=>a.id.localeCompare(b.id));
    const cityTiles = state.core.players.flatMap((pl)=>pl.civilization.cities).map((c)=>tileOf(state, c.hexId));
    const ownCityTiles = cities.map((c)=>tileOf(state, c.hexId));
    const dangers = threatsSeen.map((t)=>tileOf(state, t.hexId)).filter(Boolean);
    const safeHex = (hex)=>!dangers.some((d)=>dist(tileOf(state, hex), d) <= 2);
    const closedRegions = state.regions.filter((r)=>r.revealedBy.length === 0);
    const nearestClosed = (tile, skip = new Set())=>closedRegions.filter((r)=>!r.hexIds.some((h)=>skip.has(h))).map((r)=>({
                r,
                d: Math.min(...r.hexIds.map((h)=>dist(tile, tileOf(state, h))))
            })).sort((a, b)=>a.d - b.d || a.r.id.localeCompare(b.r.id))[0];
    const goodTerrain = [
        'PLAINS',
        'FOREST',
        'COAST',
        'HILLS'
    ];
    const siteScore = (tile, minGap)=>{
        const near = Math.min(...cityTiles.map((c)=>dist(c, tile)));
        if (tile.ownerId !== null || !goodTerrain.includes(tile.terrain) || near < minGap) return null;
        return (near === 3 ? 4 : near === 4 ? 3 : 1) + (tile.terrain === 'PLAINS' ? 2 : tile.terrain === 'COAST' ? 1 : 0) - Math.min(...ownCityTiles.map((c)=>dist(c, tile))) * 0.1;
    };
    pioneers.forEach((unit, idx)=>{
        const uo = unitOpts[unit.id];
        if (!uo) return;
        const here = tileOf(state, unit.hexId), hereNear = Math.min(...cityTiles.map((c)=>dist(c, here)));
        const wantFound = nCities < Math.min(7, wantCities + 1);
        const founderRole = pioneers.length === 1 || idx === 0;
        const waited = (ctx.siteWait ??= new Map()).get(unit.id) ?? 0;
        // Found on the spot: a legal site that keeps a gap of 3 (2 once the piece has waited long).
        const foundProj = foodProjection(state, id, {
            spendFood: 5
        });
        const admin = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["administration"](state, id), withinAdmin = admin.load + 1 <= admin.capacity;
        const canPay = !austere && withinAdmin && p.resources.wealth >= 2 && p.resources.wood + p.resources.stone >= 3 && !foundProj.famine && !foundProj.unitShortage && foundProj.endStock >= (eraIndex === 0 ? 2 : 1) && foundProj.nextGap <= 1 && foundProj.ceilingGap <= 0;
        if (wantFound && founderRole && uo.settleBlock === null && hereNear >= 3 && !canPay) {
            const why = austere ? 'austerity' : !withinAdmin ? 'administration' : p.resources.wealth < 2 ? 'wealth' : p.resources.wood + p.resources.stone < 3 ? 'materials' : foundProj.famine || foundProj.unitShortage ? 'unpaid' : foundProj.endStock < (eraIndex === 0 ? 2 : 1) ? 'food-reserve' : foundProj.ceilingGap > 0 ? 'ceiling' : 'next-gap';
            const diag = ctx.diag ??= {};
            diag[`found-blocked:${why}`] = (diag[`found-blocked:${why}`] ?? 0) + 1;
        }
        if (wantFound && founderRole && canPay && uo.settleBlock === null && hereNear >= (waited >= 3 ? 2 : 3) && safeHex(unit.hexId)) {
            add(96, `settle:${unit.id}`, {
                type: 'SETTLE',
                unitId: unit.id,
                name: `Colônia ${id}-${round}-${nCities + 1}`
            });
            return;
        }
        // Walk to the best known site (needs a Cidade-sized gap and unowned good land), then found it next round.
        let walk = null;
        if (wantFound && founderRole) {
            const sites = Object.keys(uo.moves).map((hex)=>({
                    hex,
                    score: siteScore(tileOf(state, hex), 3),
                    safe: safeHex(hex)
                })).filter((x)=>x.score !== null && x.safe).sort((a, b)=>b.score - a.score || a.hex.localeCompare(b.hex));
            if (sites[0]) walk = {
                hex: sites[0].hex,
                score: 92,
                key: 'site'
            };
        }
        // Explore: a closed Region within reach; otherwise walk toward the nearest closed Region (edge of the Pátria first). Single Pioneiros do it only without a site.
        const explorer = !wantFound || !founderRole || !walk;
        const openExplore = uo.explore.filter((e)=>e.block === null && e.rotations.length > 0);
        if (explorer && (persona.explore ?? 1) > 0 && comp) {
            if (openExplore.length) {
                add(95 * Math.min(1.1, persona.explore ?? 1), `explore:${unit.id}`, {
                    type: 'QUEUE_ORDER',
                    order: {
                        id: nextOrderId(box, id),
                        type: 'EXPLORE',
                        unitId: unit.id,
                        target: openExplore[0].target,
                        rotation: openExplore[0].rotations[0]
                    }
                });
                return;
            }
            // A Region this Pioneiro cannot enter ("Requer acesso naval.") is not a goal: walking at it would stall the bot.
            const goal = nearestClosed(here, new Set(uo.explore.filter((e)=>e.block !== null).flatMap((e)=>e.hexIds)));
            if (goal) {
                const goalTiles = goal.r.hexIds.map((h)=>tileOf(state, h));
                const step = Object.keys(uo.moves).filter(safeHex).map((hex)=>({
                        hex,
                        d: Math.min(...goalTiles.map((g)=>dist(tileOf(state, hex), g)))
                    })).filter((x)=>x.d < goal.d).sort((a, b)=>a.d - b.d || a.hex.localeCompare(b.hex))[0];
                if (step) {
                    add(94, `scout:${unit.id}`, {
                        type: 'QUEUE_ORDER',
                        order: {
                            id: nextOrderId(box, id),
                            type: 'MOVE',
                            unitIds: [
                                unit.id
                            ],
                            path: uo.moves[step.hex]
                        }
                    });
                    return;
                }
            }
        } else if (!comp && openExplore.length) add(58 * (persona.explore ?? 1), `explore:${unit.id}`, {
            type: 'QUEUE_ORDER',
            order: {
                id: nextOrderId(box, id),
                type: 'EXPLORE',
                unitId: unit.id,
                target: openExplore[0].target,
                rotation: openExplore[0].rotations[0]
            }
        });
        if (walk) {
            ctx.siteWait.set(unit.id, waited + 1);
            add(walk.score, `pioneer:${unit.id}`, {
                type: 'QUEUE_ORDER',
                order: {
                    id: nextOrderId(box, id),
                    type: 'MOVE',
                    unitIds: [
                        unit.id
                    ],
                    path: uo.moves[walk.hex]
                }
            });
            return;
        }
        if (comp) {
            // D-1 measurement: with nothing left to open, competent players sweep the ring 3–5 hexes from their cities so a fresh Acampamento is seen.
            const sweep = Object.keys(uo.moves).map((hex)=>({
                    hex,
                    tile: tileOf(state, hex)
                })).filter((s)=>s.tile && ![
                    'SEA',
                    'MOUNTAINS',
                    'UNKNOWN'
                ].includes(s.tile.terrain) && s.tile.ownerId === null && safeHex(s.hex)).map((s)=>({
                    ...s,
                    near: Math.min(...ownCityTiles.map((c)=>dist(c, s.tile))),
                    seen: ctx.swept?.get(`${id}:${s.hex}`) ?? 0
                })).filter((s)=>s.near >= 3 && s.near <= 5).sort((a, b)=>a.seen - b.seen || a.hex.localeCompare(b.hex))[0];
            if (sweep) {
                (ctx.swept ??= new Map()).set(`${id}:${sweep.hex}`, round);
                add(46 * (persona.explore ?? 1), `sweep:${unit.id}`, {
                    type: 'QUEUE_ORDER',
                    order: {
                        id: nextOrderId(box, id),
                        type: 'MOVE',
                        unitIds: [
                            unit.id
                        ],
                        path: uo.moves[sweep.hex]
                    }
                });
            }
        } else if (nCities < wantCities + 1) {
            const far = Object.keys(uo.moves).map((hex)=>({
                    hex,
                    tile: tileOf(state, hex)
                })).filter(({ tile })=>tile && tile.ownerId === null && ![
                    'SEA',
                    'MOUNTAINS'
                ].includes(tile.terrain)).map((s)=>({
                    ...s,
                    near: Math.min(...ownCityTiles.map((c)=>dist(c, s.tile)))
                })).sort((a, b)=>b.near - a.near || a.hex.localeCompare(b.hex))[0];
            if (far) add(60, `scout:${unit.id}`, {
                type: 'QUEUE_ORDER',
                order: {
                    id: nextOrderId(box, id),
                    type: 'MOVE',
                    unitIds: [
                        unit.id
                    ],
                    path: uo.moves[far.hex]
                }
            });
        }
    });
    // Naval explorers (Frota / Embarcação Costeira): explore through a navigable entry; otherwise sail toward the nearest closed Region over water. Military land pieces never explore.
    myUnits.filter((u)=>(u.kind === 'FLEET' || u.kind === 'COASTAL_VESSEL') && !u.carrierId).sort((a, b)=>a.id.localeCompare(b.id)).forEach((unit)=>{
        const uo = unitOpts[unit.id];
        if (!uo || (persona.explore ?? 1) <= 0) return;
        const openNaval = uo.explore.filter((e)=>e.block === null && e.rotations.length > 0);
        if (openNaval.length) {
            add(94 * Math.min(1.1, persona.explore ?? 1), `explore:${unit.id}`, {
                type: 'QUEUE_ORDER',
                order: {
                    id: nextOrderId(box, id),
                    type: 'EXPLORE',
                    unitId: unit.id,
                    target: openNaval[0].target,
                    rotation: openNaval[0].rotations[0]
                }
            });
            return;
        }
        const goal = nearestClosed(tileOf(state, unit.hexId), new Set(uo.explore.filter((e)=>e.block !== null).flatMap((e)=>e.hexIds)));
        if (!goal) return;
        const goalTiles = goal.r.hexIds.map((h)=>tileOf(state, h));
        const step = Object.keys(uo.moves).filter((hex)=>{
            const t = tileOf(state, hex);
            return t && [
                'COAST',
                'SEA'
            ].includes(t.terrain) && safeHex(hex);
        }).map((hex)=>({
                hex,
                d: Math.min(...goalTiles.map((g)=>dist(tileOf(state, hex), g)))
            })).filter((x)=>x.d < goal.d).sort((a, b)=>a.d - b.d || a.hex.localeCompare(b.hex))[0];
        if (step) add(90, `sail:${unit.id}`, {
            type: 'QUEUE_ORDER',
            order: {
                id: nextOrderId(box, id),
                type: 'MOVE',
                unitIds: [
                    unit.id
                ],
                path: uo.moves[step.hex]
            }
        });
    });
    // Cities.
    const reformCost = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$era$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentOptions"](state, id).cost, reserveInfluence = comp && eraIndex >= 1 && (round % state.rules.roundsPerEra === state.rules.roundsPerEra - 1 || __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$era$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isReformRound"](state));
    cities.forEach((city, index)=>{
        const meta = state.cities.find((c)=>c.cityId === city.id);
        const list = view.cities[city.id] ?? [];
        // One activation per city per round; a second one costs Ânimo, so only Elevar or an urgent Recrutar may take it, and only when the city is calm.
        const used = ctx.activations.get(`${round}:${city.id}`) ?? 0;
        const free = list.filter((opt)=>!opt.blocked && (used === 0 || used === 1 && meta.mood >= 4 && [
                'ELEVATE',
                'RECRUIT'
            ].includes(opt.action)) && used < 2);
        const pick = (action, pred = ()=>true)=>free.filter((opt)=>opt.action === action && pred(opt));
        const mood = meta.mood, here = army.filter((u)=>u.hexId === city.hexId && [
                'INFANTRY',
                'GUARD'
            ].includes(u.kind)).length;
        // Saving for Elevar: when only resources are missing, other spending waits.
        const saving = /Recursos/.test(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["elevateBlock"](state, id, city.id) ?? '') ? 0.5 : 1;
        const nearThreat = threatsSeen.some((t)=>dist(tileOf(state, city.hexId), tileOf(state, t.hexId)) <= 6) || alerts.some((a)=>a.cityId === city.id);
        const needDef = hard ? index === 0 ? Math.min(4, Math.max(0, eraIndex - 1)) : Math.min(2, (nearThreat ? 1 : 0) + (eraIndex >= 3 ? 1 : 0)) : comp ? Math.min(4, (nearThreat || enemies.length ? 2 : eraIndex >= 1 ? 2 : 1) + (nearThreat && eraIndex >= 2 ? 1 : 0)) : 0;
        const foodLow = p.resources.food < 8 + nCities, miss = comp ? deficits(state, id) : null;
        if (pick('PRODUCE').length) add(comp ? (baseFood && baseFood.mustProduce.has(city.id) ? 200 : foodLow && !baseFood ? 112 : 98) - index : index === 0 ? 86 : 78, `produce:${city.id}`, {
            type: 'URBAN_ACTION',
            cityId: city.id,
            action: 'PRODUCE'
        });
        if (pick('ELEVATE').length) add((comp ? 140 : 90) * w.elevate, `elevate:${city.id}`, {
            type: 'URBAN_ACTION',
            cityId: city.id,
            action: 'ELEVATE'
        });
        const governNow = comp ? mood <= 3 : mood <= 1 || mood <= 2 && round % 3 === 0;
        if (governNow) {
            if (pick('PROMOTE_MOOD').length) add(comp ? mood <= 1 ? 121 : mood <= 2 ? 108 : 71 : mood === 0 ? 95 : 70, `govern:${city.id}`, {
                type: 'URBAN_ACTION',
                cityId: city.id,
                action: 'PROMOTE_MOOD'
            });
        }
        if (meta.status === 'OCCUPIED') {
            if (pick('CIVIC_ACTION').length) add(80, `integrate:${city.id}`, {
                type: 'URBAN_ACTION',
                cityId: city.id,
                action: 'CIVIC_ACTION'
            });
        }
        // Districts and buildings by persona priority; competent play puts food, storage and learning first.
        for (const opt of pick('BUILD', (x)=>x.build.kind === 'DISTRICT')){
            const rank = persona.districts.indexOf(opt.build.district);
            if (rank >= 0) add((72 - rank * 4 + (comp && opt.build.district === 'AGRARIAN' ? foodLow ? 24 : 10 : comp && opt.build.district === 'INDUSTRIAL' ? Math.min(26, miss.stone * 5) : comp && opt.build.district === 'COMMERCIAL' ? Math.min(24, miss.wealth * 4) : comp && opt.build.district === 'ACADEMIC' ? Math.min(20, miss.knowledge * 3) : 0)) * w.build * saving, `district:${city.id}:${opt.build.district}`, {
                type: 'URBAN_ACTION',
                cityId: city.id,
                action: 'BUILD',
                build: opt.build
            });
        }
        for (const opt of pick('BUILD', (x)=>x.build.kind === 'BUILDING')){
            const isStorage = [
                'GRANARY',
                'WAREHOUSE',
                'TREASURY',
                'MARKET',
                'LIBRARY',
                'WORKSHOP',
                'BARRACKS',
                'TEMPLE'
            ].includes(opt.build.building);
            const boost = comp ? ({
                GRANARY: foodLow ? 26 : 12,
                MARKET: 10 + Math.min(14, miss.wealth * 3),
                LIBRARY: 12 + Math.min(12, miss.knowledge * 2),
                TEMPLE: mood <= 3 ? 14 : 4,
                WAREHOUSE: 6,
                WORKSHOP: Math.min(14, miss.wood * 2)
            })[opt.build.building] ?? 0 : 0;
            add(((isStorage ? 62 : 52) + boost) * w.build * saving, `building:${city.id}:${opt.build.building}`, {
                type: 'URBAN_ACTION',
                cityId: city.id,
                action: 'BUILD',
                build: opt.build
            });
        }
        const threatened = nearThreat || enemies.length > 0 || eraIndex >= 1;
        for (const opt of pick('BUILD', (x)=>x.build.kind === 'FORTIFICATION'))add((comp ? nearThreat || enemies.length ? hard ? 140 : 92 : eraIndex >= 2 ? hard ? 120 : 58 : 30 : threatened ? 74 : eraIndex >= 2 ? 46 : 20) * w.fort, `fort:${city.id}`, {
            type: 'URBAN_ACTION',
            cityId: city.id,
            action: 'BUILD',
            build: opt.build
        });
        // Recruitment: keep the garrison at the persona's size, more for a warrior or in war. Competent play first guarantees the defenders.
        const alert = alerts.some((a)=>a.cityId === city.id);
        const want = persona.army + (enemies.length ? 2 : 0) + eraIndex + (alert ? 3 : 0) + (threatsSeen.length ? 2 : 0);
        const kindsAll = [
            'CAVALRY',
            'SIEGE',
            'RANGED',
            'GUARD',
            'INFANTRY'
        ].filter((k)=>pick('RECRUIT', (x)=>x.unit === k).length);
        const smallCity = comp && (round < 6 ? city.population < (hard ? 10 : 12) : city.population < 3);
        // V51B-16: every competent civilization keeps a minimum army (garrison first, then a field stack) even while its cities are small.
        const minArmy = (round < 4 ? 1 : eraIndex < 2 ? 2 : eraIndex < 4 ? 3 + nCities : 4 + 2 * nCities) + (enemies.length ? 4 : 0);
        const famine = state.events.some((e)=>e.round === round - 1 && /SHORTAGE/.test(e.type));
        if (comp && army.length < minArmy && city.population >= 3 && !(round < 4) && !famine && p.resources.food >= 7 + Math.ceil(army.length / 2)) {
            const kind = here < 1 ? kindsAll.includes('GUARD') ? 'GUARD' : kindsAll.includes('INFANTRY') ? 'INFANTRY' : null : kindsAll.includes('INFANTRY') && army.filter((u)=>u.kind === 'INFANTRY').length < 3 ? 'INFANTRY' : kindsAll.includes('RANGED') ? 'RANGED' : kindsAll.includes('INFANTRY') ? 'INFANTRY' : kindsAll[0] ?? null;
            if (kind) add(90, `armymin:${city.id}:${kind}`, {
                type: 'URBAN_ACTION',
                cityId: city.id,
                action: 'RECRUIT',
                unit: kind
            });
        }
        if (comp && here < needDef && !smallCity) {
            const kind = kindsAll.includes('GUARD') ? 'GUARD' : kindsAll.includes('INFANTRY') ? 'INFANTRY' : null;
            if (kind) add(alert || nearThreat || round >= 8 || eraIndex >= 1 ? 131 : 84, `defend:${city.id}:${kind}`, {
                type: 'URBAN_ACTION',
                cityId: city.id,
                action: 'RECRUIT',
                unit: kind
            });
        }
        if (here < want && army.length < want * Math.max(1, nCities) && !smallCity) {
            const kinds = kindsAll;
            const kind = enemies.length || persona === PERSONAS.warrior ? kinds.find((k)=>k === 'SIEGE' && army.filter((u)=>u.kind === 'SIEGE').length < 2) ?? kinds[Math.floor(rand() * kinds.length)] : kinds.includes('GUARD') && here < 2 ? 'GUARD' : kinds.includes('INFANTRY') ? 'INFANTRY' : kinds[0];
            if (kind) add((alert ? 93 : here < 2 ? 80 : 56) * (comp ? Math.min(1.1, w.recruit) * (foodLow ? 0.6 : 1) : w.recruit) * (enemies.length || alert ? 1 : saving), `recruit:${city.id}:${kind}`, {
                type: 'URBAN_ACTION',
                cityId: city.id,
                action: 'RECRUIT',
                unit: kind
            });
        }
        if (nCities < wantCities && !myUnits.some((u)=>u.kind === 'PIONEER') && index === 0) {
            if (pick('RECRUIT', (x)=>x.unit === 'PIONEER').length) add(85, `recruit-pioneer`, {
                type: 'URBAN_ACTION',
                cityId: city.id,
                action: 'RECRUIT',
                unit: 'PIONEER'
            });
        }
        if (eraIndex >= 1 && !myUnits.some((u)=>u.kind === 'PIONEER') && index === 0 && (persona.explore ?? 0) > 0) {
            if (pick('RECRUIT', (x)=>x.unit === 'PIONEER').length) add(60, 'recruit-explorer', {
                type: 'URBAN_ACTION',
                cityId: city.id,
                action: 'RECRUIT',
                unit: 'PIONEER'
            });
        }
        // Water worlds (Arquipélago, Mar Interior) and Regions only reachable by sea: a coastal city builds one vessel to keep exploring; it is cheap and the only piece that can.
        const landExplore = pioneers.some((u)=>unitOpts[u.id]?.explore.some((e)=>e.block === null));
        const waterWorld = [
            'ARCHIPELAGO',
            'INLAND_SEA'
        ].includes(state.rules.worldPreset);
        if ((persona.explore ?? 0) > 0 && round >= 3 && closedRegions.length > 0 && (waterWorld || !landExplore) && !myUnits.some((u)=>u.kind === 'FLEET' || u.kind === 'COASTAL_VESSEL')) {
            const vessel = [
                'COASTAL_VESSEL',
                'FLEET'
            ].find((kind)=>pick('RECRUIT', (x)=>x.unit === kind).length);
            if (vessel) add(waterWorld ? 88 : 62, `recruit-vessel:${city.id}`, {
                type: 'URBAN_ACTION',
                cityId: city.id,
                action: 'RECRUIT',
                unit: vessel
            });
        }
        // The Distrito Marítimo (Porto included) for coastal cities of water worlds.
        for (const opt of pick('BUILD', (x)=>x.build.kind === 'MARITIME'))add((waterWorld ? 66 : 48) * w.build * saving, `maritime:${city.id}`, {
            type: 'URBAN_ACTION',
            cityId: city.id,
            action: 'BUILD',
            build: opt.build
        });
        if (state.routes.some((r)=>r.ownerId === id && r.fromCityId === city.id && !r.suspended)) {
            if (pick('SUPPORT_TRADE').length) add(48, `trade:${city.id}`, {
                type: 'URBAN_ACTION',
                cityId: city.id,
                action: 'SUPPORT_TRADE'
            });
        }
    });
    // Territory: claim hexes around each city (Influência 1) and improve them; both are Cidade Orders.
    const claimKey = `${id}:${round}:${p.resources.influence}:${state.core.map.filter((t)=>t.ownerId === id).length}`;
    if (ctx.claimKey !== claimKey) {
        ctx.claimKey = claimKey;
        ctx.claims = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$unit$2d$options$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaClaimOptions"](state, id);
    }
    const claims = ctx.claims;
    cities.forEach((city)=>{
        const cap = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["activationCapacity"](state, city.id);
        const claimed = state.core.map.filter((t)=>t.controllerCityId === city.id && t.id !== city.hexId);
        const options = claims[city.id] ?? [];
        const keepInfluence = reserveInfluence && !__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$era$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentOptions"](state, id).planned && p.resources.influence - 1 < reformCost;
        if (options.length && claimed.length < cap + 1 && p.resources.influence >= 1 && !keepInfluence) {
            const centre = tileOf(state, city.hexId);
            const best = options.map((hex)=>tileOf(state, hex)).sort((a, b)=>([
                    'PLAINS',
                    'FOREST',
                    'HILLS'
                ].indexOf(a.terrain) < 0) - ([
                    'PLAINS',
                    'FOREST',
                    'HILLS'
                ].indexOf(b.terrain) < 0) || dist(centre, a) - dist(centre, b) || a.id.localeCompare(b.id))[0];
            add(claimed.length < cap ? 82 : 52, `claim:${city.id}:${best.id}`, {
                type: 'MANAGE',
                command: {
                    type: 'CLAIM_HEX',
                    playerId: id,
                    cityId: city.id,
                    hexId: best.id,
                    expectedVersion: state.core.version
                }
            });
        }
        for (const tile of claimed){
            const improvement = IMPROVEMENT_FOR(tile);
            if (improvement) add(improvement === 'FARM' ? p.resources.food > 12 ? 30 : comp ? 88 : 64 : comp && improvement === 'LUMBER_CAMP' && p.resources.wood > 12 ? 20 : 64, `improve:${tile.id}`, {
                type: 'MANAGE',
                command: {
                    type: 'IMPROVE_HEX',
                    playerId: id,
                    hexId: tile.id,
                    improvement,
                    expectedVersion: state.core.version
                }
            });
        }
    });
    // Research (Avanço Order).
    const researchRanked = pickResearch(box, id, persona, view.research);
    if (researchRanked.length) {
        const heritageFirst = comp ? researchRanked.find((o)=>!__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].some((a)=>a.id === o.advancementId)) : null;
        const opt = heritageFirst ?? researchRanked[0];
        // Avanço is its own Order (E-1): any own city carries it, so the one with the most scholars does.
        const labs = comp ? [
            ...cities
        ].filter((c)=>state.cities.find((x)=>x.cityId === c.id)?.status !== 'OCCUPIED').sort((a, b)=>b.workers.scholars - a.workers.scholars || a.id.localeCompare(b.id)) : [
            cities[0]
        ];
        const lab = labs[0];
        if (lab) add((opt.blocked ? 0 : 1) * (comp ? round % 2 === 0 ? 99 : 82 : 88 + (w.research - 1) * 10), `research:${opt.advancementId}`, {
            type: 'URBAN_ACTION',
            cityId: lab.id,
            action: 'RESEARCH',
            advancementId: opt.advancementId
        });
        // Hardcore players with Conhecimento to spare run a second line of research from another city in the same round.
        if (hard && labs[1] && researchRanked[1] && p.resources.knowledge >= 7) add(89, `research2:${researchRanked[1].advancementId}`, {
            type: 'URBAN_ACTION',
            cityId: labs[1].id,
            action: 'RESEARCH',
            advancementId: researchRanked[1].advancementId
        });
    }
    // Military (competent): garrisons stay home, the surplus strikes Acampamentos early with a real stack and answers marching Bandos.
    if (comp) {
        const power = (units)=>units.reduce((n, u)=>n + state.rules.units[u.kind].strength, 0);
        const compPower = (t)=>t.composition.reduce((n, c)=>n + state.rules.units[c.kind].strength * c.count, 0);
        const cityHexes = new Set(cities.map((c)=>c.hexId));
        const keepAt = (hex)=>cityHexes.has(hex) ? enemies.length ? 1 : hard ? hex === cities[0].hexId ? 2 : 1 : Math.min(4, threatsSeen.length || enemies.length ? 2 : eraIndex >= 1 ? 2 : 1) : 0;
        const strikeTargets = [];
        for (const t of threatsSeen)if (t.kind === 'CAMP') strikeTargets.push({
            hex: t.hexId,
            kind: 'threat',
            power: compPower(t),
            camped: t.status === 'CAMPED'
        });
        for (const enemy of enemies)for (const c of owner(state, enemy)?.civilization.cities ?? [])strikeTargets.push({
            hex: c.hexId,
            kind: 'enemy',
            power: power(state.units.filter((u)=>u.hexId === c.hexId && u.ownerId === enemy && state.rules.units[u.kind].strength > 0)) + 1
        });
        const stacks = new Map();
        for (const u of army)if (!u.carrierId) {
            const g = stacks.get(u.hexId) ?? [];
            g.push(u);
            stacks.set(u.hexId, g);
        }
        for (const [hex, units] of stacks){
            const keep = keepAt(hex), rank = (u)=>u.kind === 'GUARD' ? 0 : u.kind === 'INFANTRY' ? 1 : 2;
            const sorted = [
                ...units
            ].sort((a, b)=>rank(a) - rank(b) || a.id.localeCompare(b.id));
            const usable = sorted.slice(keep).filter((u)=>unitOpts[u.id]?.moves !== undefined);
            if (!usable.length) continue;
            const here = tileOf(state, hex);
            // Targets in reach, each with the force it asks for. A target the stack can answer wins over a nearer one it cannot; an enemy city beats a camp at equal footing.
            const requiredFor = (t)=>t.kind === 'threat' ? Math.max(4, Math.ceil(t.power * (hard ? 1.35 : 1.6))) : Math.max(2, Math.ceil(t.power * 1.5));
            const inReach = strikeTargets.map((t)=>({
                    ...t,
                    d: dist(here, tileOf(state, t.hex))
                })).filter((t)=>t.d <= (t.kind === 'threat' ? 8 : 9) && (t.kind === 'threat' ? t.camped || t.d <= 4 : persona.war <= round || hard));
            const reachable = inReach.sort((a, b)=>Number(power(usable) < requiredFor(a)) - Number(power(usable) < requiredFor(b)) || Number(a.kind !== 'enemy') - Number(b.kind !== 'enemy') || a.d - b.d)[0];
            if (!reachable) continue;
            const required = requiredFor(reachable);
            if (reachable.d === 1) {
                const order = {
                    id: nextOrderId(box, id),
                    type: 'ATTACK',
                    unitIds: usable.map((u)=>u.id).slice(0, 12),
                    target: reachable.hex,
                    posture: persona.posture
                };
                let preview = null;
                try {
                    preview = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$combat$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["combatPreview"](state, id, order);
                } catch  {}
                if (preview?.ok) {
                    const diff = preview.defender?.visible ? preview.attacker.total - (preview.defender.strength + preview.defender.breakdown.reduce((n, m)=>n + m.amount, 0)) : 2;
                    if (diff >= (hard ? 1 : 2)) add(reachable.kind === 'threat' ? 91 : 83, `attack:${hex}:${reachable.hex}`, {
                        type: 'QUEUE_ORDER',
                        order
                    });
                }
            } else if (power(usable) >= required) {
                const first = unitOpts[usable[0].id];
                const step = Object.keys(first.moves).filter((h)=>usable.every((u)=>unitOpts[u.id]?.moves[h])).map((h)=>({
                        h,
                        d: dist(tileOf(state, h), tileOf(state, reachable.hex))
                    })).filter((x)=>x.d < reachable.d).sort((a, b)=>a.d - b.d || a.h.localeCompare(b.h))[0];
                if (step) add(reachable.kind === 'threat' ? 87 : 66, `march:${hex}`, {
                    type: 'QUEUE_ORDER',
                    order: {
                        id: nextOrderId(box, id),
                        type: 'MOVE',
                        unitIds: usable.map((u)=>u.id),
                        path: first.moves[step.h]
                    }
                });
            }
        }
    } else {
        const groups = new Map();
        for (const u of army)if (!u.carrierId) {
            const g = groups.get(u.hexId) ?? [];
            g.push(u);
            groups.set(u.hexId, g);
        }
        const targets = [];
        for (const enemy of enemies){
            const ec = owner(state, enemy)?.civilization.cities ?? [];
            for (const c of ec)targets.push({
                hex: c.hexId,
                enemy: true
            });
        }
        for (const t of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatView"](state, id) ?? [])targets.push({
            hex: t.hexId,
            enemy: false,
            threat: true
        });
        if (targets.length) for (const [hex, units] of groups){
            const here = tileOf(state, hex), usable = units.filter((u)=>unitOpts[u.id]?.moves !== undefined);
            if (!usable.length) continue;
            const near = targets.map((t)=>({
                    ...t,
                    d: dist(here, tileOf(state, t.hex))
                })).sort((a, b)=>a.d - b.d)[0];
            if (!near) continue;
            if (near.d === 1) {
                const order = {
                    id: nextOrderId(box, id),
                    type: 'ATTACK',
                    unitIds: usable.map((u)=>u.id).slice(0, 12),
                    target: near.hex,
                    posture: persona.posture
                };
                let preview = null;
                try {
                    preview = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$combat$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["combatPreview"](state, id, order);
                } catch  {}
                if (preview?.ok) {
                    const ratio = preview.defender?.visible ? preview.attacker.total - (preview.defender.strength + preview.defender.breakdown.reduce((n, m)=>n + m.amount, 0)) : 1;
                    if (ratio >= (near.threat ? 0 : 1) || usable.length >= 6) add(near.threat ? 70 : persona === PERSONAS.warrior ? 82 : 62, `attack:${hex}:${near.hex}`, {
                        type: 'QUEUE_ORDER',
                        order
                    });
                }
            } else if ((persona === PERSONAS.warrior || enemies.length) && usable.length >= 3) {
                const reach = Object.keys(unitOpts[usable[0].id].moves).map((h)=>({
                        h,
                        d: dist(tileOf(state, h), tileOf(state, near.hex))
                    })).filter((x)=>x.d < near.d).sort((a, b)=>a.d - b.d || a.h.localeCompare(b.h))[0];
                if (reach) add(persona === PERSONAS.warrior ? 66 : 40, `march:${hex}`, {
                    type: 'QUEUE_ORDER',
                    order: {
                        id: nextOrderId(box, id),
                        type: 'MOVE',
                        unitIds: usable.map((u)=>u.id).filter((uid)=>unitOpts[uid]?.moves[reach.h]).slice(0, 12),
                        path: unitOpts[usable[0].id].moves[reach.h]
                    }
                });
            }
        }
    }
    // Diplomacy and war.
    const contacts = p.contacts.filter((c)=>c !== id && owner(state, c)?.civilization.cities.length > 0 && cities.length > 0);
    if (contacts.length) {
        const target = contacts.map((c)=>({
                c,
                d: dist(tileOf(state, cities[0].hexId), tileOf(state, owner(state, c).civilization.cities[0].hexId))
            })).sort((a, b)=>a.d - b.d)[0].c;
        const atWar = enemies.includes(target);
        if (!atWar && round >= persona.war && round % 5 === 2 && p.era !== 'FOUNDATION') add(75, `war:${target}`, {
            type: 'DECLARE_WAR',
            targetId: target
        });
        if (!atWar && round % 6 === 1) add(persona === PERSONAS.trader ? 64 : 34, `treaty:${target}`, {
            type: 'PROPOSE_TREATY',
            recipientId: target,
            treaty: round % 12 === 1 ? 'TRADE_AGREEMENT' : 'OPEN_BORDERS',
            deal: {
                give: ZERO7(),
                receive: ZERO7()
            }
        });
        if (persona === PERSONAS.trader && cities.length >= 1) {
            const foreign = owner(state, target).civilization.cities[0];
            add(54, `route:${target}`, {
                type: 'QUEUE_ORDER',
                order: {
                    id: nextOrderId(box, id),
                    type: 'TRADE',
                    fromCityId: cities[0].id,
                    toCityId: foreign.id
                }
            });
        }
    }
    // Independent peoples (Influência).
    // Relief (V51B-16): when the projection says this round's maintenance cannot be paid (famine, or pieces unpaid after the automatic Crescer),
    // an immediate Troca with an independent people is the first answer. Unpaid pieces cost Ânimo in every city and Ânimo ≤ 1 stops production.
    const relief = baseFood !== null && (baseFood.famine || baseFood.unitShortage);
    for (const people of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$independents$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["independentPeopleView"](state, id) ?? []){
        const trade = (people.actions ?? []).find((a)=>a.action === 'TRADE' && !a.blocked);
        if (relief && trade) {
            add(125, `people:${people.id}:TRADE`, {
                type: 'INDEPENDENT_ACTION',
                peopleId: people.id,
                action: 'TRADE'
            });
            continue;
        }
        const act = (people.actions ?? []).find((a)=>!a.blocked);
        if (act) add(42, `people:${people.id}:${act.action}`, {
            type: 'INDEPENDENT_ACTION',
            peopleId: people.id,
            action: act.action
        });
    }
    // Obras de Legado: advance an own Obra, or start the first one a city can afford (one step per Legado Order).
    if (eraIndex >= 3) for (const work of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["legacyWorkView"](state, id)){
        const city = work.cities.find((entry)=>entry.blocker === null);
        if (city && (!work.progress || work.progress.ownerId === id)) {
            add(50, `work:${work.id}`, {
                type: 'ADVANCE_LEGACY_WORK',
                workId: work.id,
                cityId: city.cityId
            });
            break;
        }
    }
    if (comp) {
        // Never eat the seed corn: a Recrutar that would leave Alimento below what the cities and pieces eat this round waits (unless a Bando is at the gate).
        const foodCostOf = (command)=>{
            const row = (view.cities[command.cityId] ?? []).find((o)=>o.action === command.action && (o.unit ?? null) === (command.unit ?? null) && (!command.build || JSON.stringify(o.build) === JSON.stringify(command.build)));
            return row?.cost?.food ?? 0;
        };
        // Saving for Elevar: when a city lacks only resources, spending that would eat into them waits (defence against a Bando at the gate excepted).
        const saveFor = {};
        // A Pioneiro standing ready to found keeps the founding cost (Alimento 5, Materiais 3, Riqueza 2) out of reach of other spending.
        const foundReserve = pioneers.length && nCities < Math.min(7, wantCities + 1) && round >= 2 ? {
            food: 6,
            wood: 3,
            stone: 0,
            wealth: 2
        } : null;
        for (const city of cities){
            const row = (view.cities[city.id] ?? []).find((o)=>o.action === 'ELEVATE');
            if (row && /Recursos/.test(row.blocked ?? '')) {
                for (const [k, v] of Object.entries(row.cost))if (v > 0) saveFor[k] = Math.max(saveFor[k] ?? 0, v);
            }
        }
        const costOf = (command)=>(view.cities[command.cityId] ?? []).find((o)=>o.action === command.action && (o.unit ?? null) === (command.unit ?? null) && (!command.build || JSON.stringify(o.build) === JSON.stringify(command.build)))?.cost ?? {};
        const reserveMin = eraIndex === 0 ? 2 : 1;
        return out.filter((c)=>{
            if (c.command.type !== 'URBAN_ACTION' || ![
                'RECRUIT',
                'BUILD',
                'ELEVATE'
            ].includes(c.command.action)) return true;
            const military = c.command.action === 'RECRUIT' && [
                'INFANTRY',
                'GUARD',
                'RANGED',
                'CAVALRY',
                'SIEGE'
            ].includes(c.command.unit);
            const pj = foodProjection(state, id, {
                spendFood: foodCostOf(c.command),
                addLand: military ? 1 : 0
            });
            const urgent = (c.key.startsWith('defend') || c.key.startsWith('fort')) && (alerts.length > 0 || threatsSeen.some((t)=>t.status === 'MARCHING'));
            if (urgent) return !pj.famine && !pj.unitShortage && (!military || pj.ceilingGap <= 1);
            if (austere && !(military && enemies.length) && (military || c.command.action === 'BUILD' && !(c.command.build?.district === 'AGRARIAN' || [
                'GRANARY',
                'TEMPLE',
                'MARKET'
            ].includes(c.command.build?.building)))) return false;
            // Never spend into a predictable deficit: no famine, no unpaid pieces, a reserve left after the action, and an army that the income can keep.
            if (pj.famine || pj.unitShortage) return false;
            if (c.command.action !== 'ELEVATE' && pj.endStock < reserveMin) return false;
            // Elevar raises the ceiling and Crescer is automatic: only when the income already covers the grown population with a margin.
            if (c.command.action === 'ELEVATE' && pj.ceilingGap > 2) return false;
            // At war the army is the point: the sustainability margin loosens (never the famine / unpaid-pieces checks above).
            if (military && (enemies.length ? pj.ceilingGap > 3 : pj.nextGap > 0 || pj.ceilingGap > 0)) return false;
            const foundingReserve = foundReserve && !(c.command.action === 'RECRUIT' && c.command.unit === 'PIONEER') ? foundReserve : null;
            if (foundingReserve) {
                const cost = costOf(c.command);
                if (Object.entries(foundingReserve).some(([k, need])=>(cost[k] ?? 0) > 0 && p.resources[k] - cost[k] < need)) return false;
            }
            const cost = costOf(c.command);
            return !Object.entries(saveFor).some(([k, need])=>(cost[k] ?? 0) > 0 && p.resources[k] - cost[k] < need);
        }).sort((a, b)=>b.score - a.score);
    }
    return out.sort((a, b)=>b.score - a.score);
}
function freeActions(box, id, persona) {
    const { state } = box;
    let p = me(state, id);
    if (!p.ambitionsChosen && p.ambitions.length >= 2) send(box, id, {
        type: 'CHOOSE_AMBITIONS',
        cardIds: p.ambitions.slice(0, 2)
    });
    for (const choice of [
        ...me(box.state, id).pendingChoices
    ]){
        const idx = box.ctx.rand[id]() < 0.35 ? 1 : 0;
        send(box, id, {
            type: 'RESOLVE_CHOICE',
            choiceId: choice.id,
            optionId: choice.options[Math.min(idx, choice.options.length - 1)].id
        });
    }
    if (box.state.cards.worldEvent && !box.state.cards.worldResponded.includes(id)) send(box, id, {
        type: 'WORLD_CHOICE',
        choice: box.ctx.rand[id]() < 0.5 ? 'RESOURCE' : 'PRESTIGE'
    });
    send(box, id, {
        type: 'SET_DEFENSE_POSTURE',
        posture: persona.posture
    });
}
function botPlan(box, id) {
    const persona = PERSONAS[box.ctx.seats.find((s)=>s.id === id).persona];
    freeActions(box, id, persona);
    assignPopulation(box, id, persona);
    assignWorkedHexes(box, id);
    const p0 = me(box.state, id);
    // The Figura's Poder (once per Era): used from the third round of the Era on, and only when the engine says it would change something (never a rejected command).
    if (p0.leader && !p0.leader.eraAbilityUsed && box.state.core.round % box.state.rules.roundsPerEra >= 2 && !__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["leaderAbilityBlock"](box.state, id)) send(box, id, {
        type: 'LEADER_ABILITY'
    });
    const hand = me(box.state, id).hand.slice();
    if (hand.length && (box.state.core.round % 2 === 0 || box.ctx.skill === 'hardcore')) for (const card of hand){
        if (send(box, id, {
            type: 'PLAY_CARD',
            cardId: card
        })) break;
    }
    for (const t of box.state.treaties.filter((t)=>t.status === 'PROPOSED' && t.recipientId === id))send(box, id, {
        type: 'RESPOND_TREATY',
        treatyId: t.id,
        accept: true
    });
    for (const t of box.state.tradeOffers.filter((t)=>t.status === 'PROPOSED' && t.recipientId === id))send(box, id, {
        type: 'RESPOND_TRADE',
        offerId: t.id,
        accept: true
    });
    const failed = failedKey(box, id);
    for(let guard = 0; guard < 30; guard++){
        const usage = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaActionUsage"](box.state, id);
        if (usage.used >= usage.limit) break;
        const list = candidates(box, id, persona).filter((c)=>!failed.has(c.key));
        let done = false;
        // Try every candidate best-first (a rejected one is remembered for the round): the plan ends only when nothing valid is left.
        for (const c of list){
            if (send(box, id, c.command)) {
                done = true;
                failed.add(c.key + '#' + usage.used);
                break;
            }
            failed.add(c.key);
        }
        if (!done) break;
    }
}
function eraTurnActions(box, id) {
    const persona = PERSONAS[box.ctx.seats.find((s)=>s.id === id).persona];
    for (const choice of [
        ...me(box.state, id).pendingChoices
    ])send(box, id, {
        type: 'RESOLVE_CHOICE',
        choiceId: choice.id,
        optionId: choice.options[0].id
    });
    send(box, id, {
        type: 'SET_DEFENSE_POSTURE',
        posture: persona.posture
    });
}
function recordFood(box) {
    const { state, ctx } = box, round = state.core.round;
    ctx.foodLog ??= [];
    for (const seat of ctx.seats){
        const pj = foodProjection(state, seat.id), owner = state.core.players.find((o)=>o.id === seat.id);
        const last = state.events.filter((e)=>e.round === round - 1 && e.audience?.includes(seat.id));
        ctx.foodLog.push({
            round,
            seat: seat.id,
            foodNow: pj.foodNow,
            income: pj.income,
            sustenance: pj.sustenance,
            military: pj.military,
            endStock: pj.endStock,
            cities: owner.civilization.cities.length,
            pop: owner.civilization.cities.reduce((n, c)=>n + c.population, 0),
            pieces: state.units.filter((u)=>u.ownerId === seat.id).length,
            adminLoad: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["administration"](state, seat.id).load,
            adminCap: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["administration"](state, seat.id).capacity,
            minMood: Math.min(...state.cities.filter((c)=>c.currentOwnerId === seat.id).map((c)=>c.mood)),
            prevFamine: last.filter((e)=>e.type === 'FOOD_SHORTAGE').length,
            prevUnitShortage: last.some((e)=>e.type === 'UPKEEP_SHORTAGE') ? 1 : 0
        });
    }
}
}),
"[project]/apps/server/dist/alpha-bot-view.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "redactStateForSeat",
    ()=>redactStateForSeat
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-world.js [app-route] (ecmascript)");
;
/**
 * What a bot is allowed to know: exactly what a human in that seat could be sent. The real match state is NEVER handed to the bot policy; it gets this
 * seat-redacted copy (same shape, so the engine's own read helpers keep working), built from the same visibility rules as the player projection
 * (alpha-projection.ts): tiles, cities, pieces, threats and peoples outside the seat's sight are gone or masked; rivals' hand, Ambições, Orders,
 * plans, resources, research, posture, casualty list and pending choices are blank; decks and the future RNG are empty.
 * Commands the bot derives from it go back to the real engine, which validates them like any human command.
 */ const ZERO_POOL = (pool)=>Object.fromEntries(Object.keys(pool).map((key)=>[
            key,
            0
        ]));
function redactStateForSeat(real, seat) {
    const state = structuredClone(real);
    const visible = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["visibleHexIds"])(real, seat);
    // Map: what is not in sight is unknown terrain with no owner, as on the client.
    state.core.map = state.core.map.map((tile)=>visible.has(tile.id) ? tile : {
            ...tile,
            terrain: 'UNKNOWN',
            features: [],
            ownerId: null,
            controllerCityId: null,
            improvement: null
        });
    // Rival civilizations: only cities standing in sight survive; their purse and city interior are blank.
    const hiddenCityIds = new Set();
    for (const owner of state.core.players){
        if (owner.id === seat) continue;
        owner.civilization.cities = owner.civilization.cities.filter((city)=>{
            const seen = visible.has(city.hexId);
            if (!seen) hiddenCityIds.add(city.id);
            return seen;
        });
        for (const city of owner.civilization.cities){
            city.population = 1;
            city.stability = 0;
        }
        if ('resources' in owner) owner.resources = ZERO_POOL(owner.resources);
    }
    state.cities = state.cities.filter((meta)=>!hiddenCityIds.has(meta.cityId)).map((meta)=>meta.currentOwnerId === seat ? meta : {
            ...meta,
            mood: 3,
            integration: 0
        });
    state.core.eventLog = state.core.eventLog.filter((entry)=>'playerId' in entry && entry.playerId === seat);
    // Rivals' private progress.
    for (const progress of state.players){
        if (progress.playerId === seat) continue;
        progress.hand = [];
        progress.ambitions = [];
        progress.completedAmbitions = [];
        progress.advisors = [];
        progress.orders = [];
        progress.plannedActions = [];
        progress.pendingChoices = [];
        progress.research = [];
        progress.knownHexIds = [];
        progress.temporaryEffects = [];
        progress.civilizationCardsPlayed = [];
        progress.defensePosture = 'HOLD';
        progress.casualtyPriority = {
            order: [],
            byHex: {}
        };
        progress.leader = null;
        progress.resources = ZERO_POOL(progress.resources);
    }
    // The table: only pieces in sight (own always), no cargo of rival fleets; threats and peoples in sight; battles the seat fought or saw.
    state.units = state.units.filter((unit)=>unit.ownerId === seat || visible.has(unit.hexId) && !unit.carrierId);
    const seenThreats = new Set((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatView"])(real, seat).map((t)=>t.id));
    state.threats = state.threats.filter((threat)=>seenThreats.has(threat.id));
    state.independents = state.independents.filter((people)=>visible.has(people.hexId));
    state.roads = state.roads.filter((id)=>visible.has(id));
    state.battles = state.battles.filter((b)=>b.attackerId === seat || b.defenderId === seat || visible.has(b.hexId));
    state.treaties = state.treaties.filter((t)=>t.proposerId === seat || t.recipientId === seat);
    state.tradeOffers = state.tradeOffers.filter((o)=>o.proposerId === seat || o.recipientId === seat);
    state.routes = state.routes.filter((r)=>r.ownerId === seat);
    state.occupations = state.occupations.filter((o)=>o.occupierId === seat || o.previousOwnerId === seat);
    state.events = state.events.filter((e)=>e.audience === null || e.audience.includes(seat));
    state.roundReports = state.roundReports.filter((r)=>r.playerId === seat);
    state.resolutionEvents = state.resolutionEvents.filter((e)=>e.actorId === null || e.actorId === seat);
    state.roundLedgers = [];
    // Regions still closed for this seat keep their public footprint but nothing of what lies inside.
    state.regions = state.regions.map((region)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["regionOpenFor"])(real, region, seat) ? region.discovery && !region.revealedBy.includes(seat) ? {
            ...region,
            discovery: undefined
        } : region : {
            ...region,
            templateId: 'hidden',
            rotation: 0,
            discovery: undefined
        });
    // Decks and the future are not part of anyone's knowledge.
    state.cards = {
        ...state.cards,
        worldDeck: [],
        strategyDeck: [],
        ambitionDeck: [],
        advisorDeck: [],
        discarded: []
    };
    state.worldPulse = {
        ...state.worldPulse,
        deck: [],
        discard: []
    };
    state.privateRng = {
        ...state.privateRng,
        seed: '0'.repeat(64),
        counter: 0
    };
    return state;
}
}),
"[project]/apps/server/dist/alpha-bot.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "botDelayMs",
    ()=>botDelayMs,
    "botPersonaFor",
    ()=>botPersonaFor,
    "confirmBotSeat",
    ()=>confirmBotSeat,
    "forgetBots",
    ()=>forgetBots,
    "isKnownPersona",
    ()=>isKnownPersona,
    "planBotSeat",
    ()=>planBotSeat
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-turn.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bot$2d$view$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-bot-view.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bot$2d$policy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-bot-policy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-log.js [app-route] (ecmascript)");
;
;
;
;
const memories = new Map();
const memoryOf = (roomId, seat, persona, seed)=>{
    const key = `${roomId}:${seat}`;
    let memory = memories.get(key);
    if (!memory) {
        memory = {
            skill: 'competent',
            seats: [
                {
                    id: seat,
                    persona
                }
            ],
            rand: {
                [seat]: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bot$2d$policy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rng"])(seed * 7919 + Number(seat.replace(/\D/g, '')) * 104729)
            },
            activations: new Map(),
            failed: new Map(),
            counters: {
                commands: 0,
                rejected: 0
            },
            rejectedCodes: new Set(),
            crashes: [],
            orderSeq: 0,
            foodLog: [],
            seed
        };
        memories.set(key, memory);
        if (memories.size > 512) memories.delete(memories.keys().next().value);
    }
    return memory;
};
const botPersonaFor = (seed, index)=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bot$2d$policy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PERSONA_ORDER"][(index + seed) % __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bot$2d$policy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PERSONA_ORDER"].length];
const isKnownPersona = (name)=>name !== null && name in __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bot$2d$policy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PERSONAS"];
const botDelayMs = ()=>{
    const configured = process.env.ALPHA_BOT_DELAY_MS;
    return configured !== undefined && configured !== '' ? Math.max(0, Number(configured)) : 500 + Math.floor(Math.random() * 1000);
};
const player = (game, id)=>game.players.find((p)=>p.playerId === id);
function planBotSeat(roomId, game, seat, personaName, roomSeed) {
    const persona = isKnownPersona(personaName) ? personaName : 'balanced';
    const memory = memoryOf(roomId, seat, persona, roomSeed);
    let live = game;
    const box = {
        state: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bot$2d$view$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["redactStateForSeat"])(live, seat),
        ctx: memory,
        apply: (id, command)=>{
            const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["applyAlphaCommand"])(live, id, command);
            if (result.ok) live = result.value;
            return result;
        },
        refresh: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bot$2d$view$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["redactStateForSeat"])(live, seat),
        /** Exploration access (which orientations give a piece a way in) is what a human's unit options carry; it needs the hidden Region content, so it is read from the real state, exactly as the player projection does. */ real: ()=>live
    };
    let fallback = false;
    try {
        if (live.phase === 'PLANNING') {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bot$2d$policy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recordFood"])(box);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bot$2d$policy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["botPlan"])(box, seat);
        } else if (live.phase === 'ERA_TURN') (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bot$2d$policy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eraTurnActions"])(box, seat);
    } catch (cause) {
        fallback = true;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('BOT_DECISION_FALLBACK', {
            room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(roomId),
            seat,
            reason: 'policy_error',
            name: cause instanceof Error ? cause.name : 'Error'
        });
    }
    for (const code of memory.rejectedCodes)(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('BOT_COMMAND_REJECTED', {
        room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(roomId),
        seat,
        code
    });
    memory.rejectedCodes.clear();
    const commands = memory.counters.commands, rejected = memory.counters.rejected;
    memory.counters.commands = 0;
    memory.counters.rejected = 0;
    return {
        game: live,
        commands,
        rejected,
        fallback
    };
}
function confirmBotSeat(roomId, game, seat) {
    let live = game, fallback = false;
    for(let attempt = 0; attempt < 8; attempt++){
        const ready = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["applyAlphaCommand"])(live, seat, {
            type: 'READY',
            expectedVersion: live.version
        });
        if (ready.ok) {
            if (fallback) (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('BOT_DECISION_FALLBACK', {
                room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(roomId),
                seat,
                reason: 'minimal_answers'
            });
            return {
                game: ready.value,
                ok: true,
                fallback
            };
        }
        const me = player(live, seat);
        let next = null;
        if (!me.ambitionsChosen && me.ambitions.length >= 2) next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["applyAlphaCommand"])(live, seat, {
            type: 'CHOOSE_AMBITIONS',
            expectedVersion: live.version,
            cardIds: me.ambitions.slice(0, 2)
        });
        else if (me.pendingChoices.length) {
            const choice = me.pendingChoices[0];
            next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["applyAlphaCommand"])(live, seat, {
                type: 'RESOLVE_CHOICE',
                expectedVersion: live.version,
                choiceId: choice.id,
                optionId: choice.options[0].id
            });
        } else if (live.cards.worldEvent && !live.cards.worldResponded.includes(seat)) next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["applyAlphaCommand"])(live, seat, {
            type: 'WORLD_CHOICE',
            expectedVersion: live.version,
            choice: 'PRESTIGE'
        });
        if (!next || !next.ok) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('BOT_DECISION_FALLBACK', {
                room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(roomId),
                seat,
                reason: 'cannot_confirm',
                code: ready.error.code
            });
            return {
                game: live,
                ok: false,
                fallback: true
            };
        }
        live = next.value;
        fallback = true;
    }
    return {
        game: live,
        ok: false,
        fallback: true
    };
}
const forgetBots = (roomId)=>{
    for (const key of [
        ...memories.keys()
    ])if (key.startsWith(`${roomId}:`)) memories.delete(key);
};
}),
"[project]/apps/server/dist/alpha-bus.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PublishingAlphaRepository",
    ()=>PublishingAlphaRepository,
    "publishAlpha",
    ()=>publishAlpha,
    "publishAlphaEvent",
    ()=>publishAlphaEvent,
    "subscribeAlpha",
    ()=>subscribeAlpha
]);
const shared = globalThis;
const channels = ()=>shared.aohAlphaBus ??= new Map();
function subscribeAlpha(gameId, listener) {
    const map = channels(), set = map.get(gameId) ?? new Set();
    set.add(listener);
    map.set(gameId, set);
    return ()=>{
        set.delete(listener);
        if (set.size === 0) map.delete(gameId);
    };
}
function publishAlpha(gameId, version, at = Date.now(), event) {
    for (const listener of [
        ...channels().get(gameId) ?? []
    ]){
        try {
            listener(event ? {
                gameId,
                version,
                at,
                event
            } : {
                gameId,
                version,
                at
            });
        } catch  {}
    }
}
function publishAlphaEvent(gameId, event, at = Date.now()) {
    publishAlpha(gameId, -2, at, event);
}
class PublishingAlphaRepository {
    inner;
    constructor(inner){
        this.inner = inner;
    }
    find(id) {
        return this.inner.find(id);
    }
    findByCode(code) {
        return this.inner.findByCode(code);
    }
    create(room) {
        return this.inner.create(room);
    }
    async save(room, expectedVersion) {
        const saved = await this.inner.save(room, expectedVersion);
        if (saved) publishAlpha(room.id, room.version);
        return saved;
    }
}
}),
"[project]/apps/server/dist/alpha-http.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AlphaHttp",
    ()=>AlphaHttp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$service$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-service.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$guest$2d$session$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/guest-session.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bus$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-bus.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$presence$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-presence.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-log.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-lifecycle.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
;
;
;
;
;
;
;
;
const envelope = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].discriminatedUnion('operation', [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        operation: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('create'),
        payload: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].unknown(),
        accessCode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(80).optional()
    }),
    // The invite code is the credential of a join: no Alpha access code is asked of someone who was invited.
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        operation: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('join'),
        code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(22),
        displayName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(80),
        accessCode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(80).optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        operation: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('room'),
        gameId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid(),
        payload: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].unknown()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        operation: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('lobby'),
        gameId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid(),
        payload: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].unknown()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        operation: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('command'),
        gameId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid(),
        payload: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].unknown()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        operation: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('telemetry'),
        gameId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid(),
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(32),
        detail: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(40)
    })
]);
class AlphaRateLimit {
    windows = new Map();
    allow(key, maximum, now) {
        for (const [id, value] of this.windows)if (value.until <= now) this.windows.delete(id);
        const value = this.windows.get(key);
        if (value) {
            if (value.count >= maximum) return false;
            value.count++;
            return true;
        }
        if (this.windows.size >= 4096) return false;
        this.windows.set(key, {
            until: now + 60000,
            count: 1
        });
        return true;
    }
}
async function readBody(request) {
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('JSON_REQUIRED');
    const reader = request.body?.getReader();
    if (!reader) throw new Error('BODY_REQUIRED');
    const parts = [];
    let size = 0;
    try {
        for(;;){
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 16384) {
                await reader.cancel();
                throw new Error('BODY_TOO_LARGE');
            }
            parts.push(value);
        }
    } finally{
        reader.releaseLock();
    }
    return JSON.parse(Buffer.concat(parts).toString('utf8'));
}
class AlphaHttp {
    service;
    sessions;
    production;
    rate = new AlphaRateLimit();
    origin;
    cookieName;
    constructor(service, sessions, origin, production){
        this.service = service;
        this.sessions = sessions;
        this.production = production;
        const url = new URL(origin);
        if (production && url.protocol !== 'https:') throw new Error('Public alpha requires HTTPS');
        this.origin = url.origin;
        this.cookieName = production || url.protocol === 'https:' ? '__Host-aoh_alpha_session' : 'aoh_alpha_session';
    }
    stream(request, gameId, guestId) {
        const encoder = new TextEncoder();
        let cleanup = ()=>{};
        const body = new ReadableStream({
            start: (controller)=>{
                const send = (text)=>{
                    try {
                        controller.enqueue(encoder.encode(text));
                    } catch  {
                        cleanup();
                    }
                };
                const push = (message)=>send(`data: ${JSON.stringify(message)}\n\n`);
                send('retry: 1000\n\n');
                const unsubscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bus$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["subscribeAlpha"])(gameId, push);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$presence$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["connect"])(gameId, guestId, Date.now());
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('SSE_CONNECTED', {
                    room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(gameId)
                });
                const keepalive = setInterval(()=>send(': ping\n\n'), 15000);
                let closed = false;
                cleanup = ()=>{
                    if (closed) return;
                    closed = true;
                    clearInterval(keepalive);
                    unsubscribe();
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$presence$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["disconnect"])(gameId, guestId, Date.now());
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('SSE_DISCONNECTED', {
                        room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(gameId)
                    });
                    try {
                        controller.close();
                    } catch  {}
                };
                request.signal.addEventListener('abort', cleanup, {
                    once: true
                });
                push({
                    gameId,
                    version: -1,
                    at: Date.now()
                });
            },
            cancel: ()=>cleanup()
        });
        return new Response(body, {
            headers: {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-store, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
                'X-Content-Type-Options': 'nosniff'
            }
        });
    }
    accessOk(given) {
        const required = process.env.ALPHA_ACCESS_CODE;
        if (!required) return true;
        // Pasted codes often carry a trailing space or the wrong case: both are forgiven.
        const a = Buffer.from((given ?? '').trim().toUpperCase()), b = Buffer.from(required.trim().toUpperCase());
        return a.length === b.length && (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["timingSafeEqual"])(a, b);
    }
    /** Who is asking, for rate limits that must not let one noisy client block everyone: the first hop of X-Forwarded-For (behind the platform proxy), else a shared bucket. */ clientKey(request) {
        const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
        return forwarded && /^[0-9a-fA-F:.]{3,45}$/.test(forwarded) ? forwarded : 'local';
    }
    async handle(request, now = Date.now()) {
        const respond = (body, status = 200, cookie)=>{
            const headers = new Headers({
                'Cache-Control': 'no-store',
                'Vary': 'Cookie',
                'X-Content-Type-Options': 'nosniff'
            });
            if (cookie) headers.set('Set-Cookie', cookie);
            if (status === 429) headers.set('Retry-After', '60');
            return Response.json(body, {
                status,
                headers
            });
        };
        const error = (code, message, status)=>respond({
                ok: false,
                error: {
                    code,
                    message
                }
            }, status);
        if (![
            'GET',
            'POST'
        ].includes(request.method)) return error('METHOD_NOT_ALLOWED', 'Método não disponível.', 405);
        const fetchSite = request.headers.get('sec-fetch-site');
        if (fetchSite === 'cross-site' || request.method === 'POST' && request.headers.get('origin') !== this.origin) return error('FORBIDDEN', 'A solicitação precisa partir do endereço oficial desta partida.', 403);
        const cookie = request.headers.get('cookie')?.split(';').map((v)=>v.trim()).find((v)=>v.startsWith(`${this.cookieName}=`))?.slice(this.cookieName.length + 1);
        let principal = this.sessions.resolve(cookie, now);
        // Reads (the push-driven refreshes of a busy table) have their own, larger allowance; writes keep the tight one.
        const reads = request.method === 'GET' || request.headers.get('x-aoh-telemetry') === '1';
        if (!this.rate.allow(principal ? `guest:${principal.guestId}${reads ? ':read' : ''}` : `anonymous:${this.clientKey(request)}`, principal ? reads ? 600 : 120 : 30, now)) return error('RATE_LIMIT', 'Muitas solicitações. Aguarde um minuto.', 429);
        try {
            if (request.method === 'GET') {
                // Public: what the entry screen needs before anyone has a session.
                if (new URL(request.url).searchParams.get('info') === '1') return respond({
                    ok: true,
                    value: {
                        accessRequired: Boolean(process.env.ALPHA_ACCESS_CODE),
                        maxSeats: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["maxSeats"])()
                    }
                });
                if (!principal) return error('UNAUTHENTICATED', 'Entre com seu convite ou crie uma partida.', 401);
                const gameId = new URL(request.url).searchParams.get('gameId');
                if (!gameId || !__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid().safeParse(gameId).success) return error('INVALID_INPUT', 'Identificador de partida inválido.', 400);
                if (new URL(request.url).searchParams.get('stream') === '1') {
                    // Shared-table push (SSE): membership is checked like a read; the stream carries only room versions, never state.
                    const allowed = await this.service.read(principal, gameId, now);
                    if (!allowed.ok) return respond(allowed, allowed.error.code === 'FORBIDDEN' ? 403 : 404);
                    return this.stream(request, gameId, principal.guestId);
                }
                const result = await this.service.read(principal, gameId, now);
                return respond(result, result.ok ? 200 : result.error.code === 'FORBIDDEN' ? 403 : result.error.code === 'VERSION_CONFLICT' ? 409 : 404);
            }
            let raw;
            try {
                raw = await readBody(request);
            } catch  {
                return error('INVALID_INPUT', 'Envie JSON válido com até 16 KiB.', 400);
            }
            const parsed = envelope.safeParse(raw);
            if (!parsed.success) return error('INVALID_INPUT', 'Solicitação inválida.', 400);
            const action = parsed.data;
            // Per client, never global: creating rooms is the scarce one; joining with an invite is cheap but still bounded per client and per invite.
            if (action.operation === 'create' && !this.rate.allow(`create:${this.clientKey(request)}`, 6, now)) return error('RATE_LIMIT', 'Muitas salas criadas. Aguarde um minuto.', 429);
            if (action.operation === 'join' && (!this.rate.allow(`join:${this.clientKey(request)}`, 20, now) || !this.rate.allow(`invite:${action.code}`, 40, now))) return error('RATE_LIMIT', 'Muitas entradas. Aguarde um minuto.', 429);
            if (action.operation === 'telemetry') {
                if (!principal) return error('UNAUTHENTICATED', 'Sua sessão expirou. Entre novamente.', 401);
                if (!this.rate.allow(`guest:${principal.guestId}:telemetry`, 600, now)) return error('RATE_LIMIT', 'Muitas solicitações. Aguarde um minuto.', 429);
                return respond(await this.service.telemetry(principal, action.gameId, action.kind, action.detail));
            }
            if (action.operation === 'create' && !this.accessOk(action.accessCode)) return error('ACCESS_CODE', 'Código de acesso do Alpha incorreto.', 403);
            let setCookie;
            if (!principal) {
                if (action.operation !== 'create' && action.operation !== 'join') return error('UNAUTHENTICATED', 'Sua sessão expirou. Entre novamente.', 401);
                const issued = this.sessions.issue(now);
                principal = issued.principal;
                setCookie = `${this.cookieName}=${issued.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${issued.maxAge}${this.production || this.origin.startsWith('https:') ? '; Secure' : ''}`;
            }
            const result = action.operation === 'create' ? await this.service.create(principal, action.payload) : action.operation === 'join' ? await this.service.join(principal, action.code, action.displayName, now) : action.operation === 'room' ? await this.service.roomAction(principal, action.gameId, action.payload, now) : action.operation === 'lobby' ? await this.service.lobby(principal, action.gameId, action.payload, now) : await this.service.command(principal, action.gameId, action.payload, now);
            const status = result.ok ? 200 : result.error.code === 'FORBIDDEN' ? 403 : result.error.code === 'NOT_FOUND' ? 404 : result.error.code === 'VERSION_CONFLICT' || result.error.code === 'LEGACY_ROOM' ? 409 : 400;
            return respond(result, status, result.ok ? setCookie : undefined);
        } catch (cause) {
            console.error('Alpha request failed', {
                name: cause instanceof Error ? cause.name : 'UnknownError'
            });
            return error('UNAVAILABLE', 'O servidor não conseguiu concluir a solicitação. Seu comando não foi confirmado; atualize a partida.', 503);
        }
    }
}
}),
"[project]/apps/server/dist/alpha-lifecycle.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EXTERNAL_MAX_SEATS",
    ()=>EXTERNAL_MAX_SEATS,
    "VOTE_TTL_MS",
    ()=>VOTE_TTL_MS,
    "addNotice",
    ()=>addNotice,
    "eligibleVoters",
    ()=>eligibleVoters,
    "humanSeats",
    ()=>humanSeats,
    "maxSeats",
    ()=>maxSeats,
    "maybeTransferHost",
    ()=>maybeTransferHost,
    "nextPlayerId",
    ()=>nextPlayerId,
    "presenceOf",
    ()=>presenceOf,
    "runGuards",
    ()=>runGuards,
    "safePoint",
    ()=>safePoint,
    "seatOfGuest",
    ()=>seatOfGuest,
    "tallyVote",
    ()=>tallyVote,
    "voteView",
    ()=>voteView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-turn.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$presence$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-presence.js [app-route] (ecmascript)");
;
;
const EXTERNAL_MAX_SEATS = 4;
const maxSeats = ()=>{
    const configured = Number(process.env.ALPHA_MAX_SEATS);
    return Number.isInteger(configured) && configured >= 2 && configured <= 6 ? configured : ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 6;
};
const VOTE_TTL_MS = 5 * 60 * 1000;
function addNotice(room, type, text, now) {
    const id = (room.notices.at(-1)?.id ?? 0) + 1;
    room.notices.push({
        id,
        at: now,
        type,
        text
    });
    if (room.notices.length > 30) room.notices.splice(0, room.notices.length - 30);
}
const seatOfGuest = (room, guestId)=>room.seats.find((s)=>s.guestId === guestId);
const presenceOf = (room, guestId, now)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$presence$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stateOf"])(room.id, guestId, now);
const humanSeats = (room)=>room.seats.filter((s)=>!s.bot);
const nextPlayerNumber = (room)=>{
    const used = new Set(room.seats.map((s)=>s.playerId));
    for(let n = 1; n <= 6; n++)if (!used.has(`player-${n}`)) return n;
    return room.seats.length + 1;
};
const nextPlayerId = (room)=>`player-${nextPlayerNumber(room)}`;
function safePoint(room) {
    const game = room.game;
    if (!game) return {
        ok: false,
        reason: 'A partida ainda não começou.'
    };
    if (game.core.status === 'FINISHED') return {
        ok: false,
        reason: 'A partida já terminou.'
    };
    if (game.phase !== 'PLANNING') return {
        ok: false,
        reason: 'Só é possível suspender no Planejamento (não durante conflitos ou a Virada de Era).'
    };
    if (game.players.some((p)=>p.pendingChoices.length > 0)) return {
        ok: false,
        reason: 'Há uma decisão obrigatória pendente (Repercussão, Encontro ou Pulso). Resolva-a antes de suspender.'
    };
    if (game.players.some((p)=>!p.ambitionsChosen)) return {
        ok: false,
        reason: 'Alguém ainda precisa escolher as ambições.'
    };
    return {
        ok: true
    };
}
function maybeTransferHost(room, now) {
    if (room.closedReason !== null) return false;
    const host = room.seats.find((s)=>s.guestId === room.hostGuestId);
    if (!host) return false;
    const state = presenceOf(room, host.guestId, now);
    if (state === 'ONLINE') return false;
    const explicit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$presence$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasLeft"])(room.id, host.guestId), silentLong = state === 'ABSENT' && (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$presence$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["absentForMs"])(room.id, host.guestId, now) >= (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$presence$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hostGraceMs"])();
    if (!explicit && !silentLong) return false;
    const next = room.seats.find((s)=>!s.bot && s.guestId !== host.guestId && !room.onGuard.includes(s.playerId) && presenceOf(room, s.guestId, now) === 'ONLINE') ?? room.seats.find((s)=>!s.bot && s.guestId !== host.guestId && !room.onGuard.includes(s.playerId) && presenceOf(room, s.guestId, now) === 'RECONNECTING');
    if (!next) return false;
    room.hostGuestId = next.guestId;
    addNotice(room, 'HOST_TRANSFERRED', `${next.name} agora é o anfitrião.`, now);
    return true;
}
function runGuards(room) {
    const game = room.game;
    if (!game || room.onGuard.length === 0 || game.core.status === 'FINISHED') return false;
    let changed = false;
    for(let pass = 0; pass < 8; pass++){
        const current = room.game;
        if (current.core.status === 'FINISHED') break;
        const humans = current.players.filter((p)=>!room.onGuard.includes(p.playerId));
        if (humans.length === 0 || humans.some((p)=>!p.ready)) break;
        const waiting = current.players.find((p)=>room.onGuard.includes(p.playerId) && !p.ready);
        if (!waiting) break;
        let next = current;
        if (!waiting.ambitionsChosen) {
            const chosen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["applyAlphaCommand"])(next, waiting.playerId, {
                type: 'CHOOSE_AMBITIONS',
                expectedVersion: next.version,
                cardIds: waiting.ambitions.slice(0, 2)
            });
            if (!chosen.ok) break;
            next = chosen.value;
        }
        const ready = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["applyAlphaCommand"])(next, waiting.playerId, {
            type: 'READY',
            expectedVersion: next.version
        });
        if (!ready.ok) break;
        room.game = ready.value;
        changed = true;
    }
    return changed;
}
function eligibleVoters(room, now) {
    const vote = room.vote;
    return room.seats.filter((s)=>!s.bot && !room.onGuard.includes(s.playerId) && presenceOf(room, s.guestId, now) !== 'ABSENT' && !(vote?.kind === 'REMOVE' && vote.target === s.playerId)).map((s)=>s.playerId);
}
function tallyVote(room, now) {
    const vote = room.vote;
    if (!vote) return 'OPEN';
    if (now - vote.createdAt >= VOTE_TTL_MS) return 'EXPIRED';
    const voters = new Set([
        ...eligibleVoters(room, now),
        ...vote.yes
    ]);
    const eligible = voters.size, needed = Math.floor(eligible / 2) + 1;
    const yes = vote.yes.filter((id)=>voters.has(id)).length, no = vote.no.filter((id)=>voters.has(id)).length;
    if (yes >= needed) {
        if (vote.kind === 'REMOVE') {
            const target = room.seats.find((s)=>s.playerId === vote.target);
            if (eligible < 2 && target && (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$presence$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["absentForMs"])(room.id, target.guestId, now) < (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$presence$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["removeAbsentMs"])()) return 'OPEN';
        }
        return 'APPROVED';
    }
    if (no > eligible - needed) return 'REJECTED';
    return 'OPEN';
}
const voteView = (room, selfPlayerId, now)=>{
    const vote = room.vote;
    if (!vote) return null;
    const eligible = new Set([
        ...eligibleVoters(room, now),
        ...vote.yes
    ]);
    return {
        id: vote.id,
        kind: vote.kind,
        target: vote.target,
        proposer: vote.proposer,
        yes: vote.yes.length,
        no: vote.no.length,
        needed: Math.floor(eligible.size / 2) + 1,
        eligible: eligible.size,
        expiresAt: vote.createdAt + VOTE_TTL_MS,
        mine: vote.yes.includes(selfPlayerId) ? 'YES' : vote.no.includes(selfPlayerId) ? 'NO' : null,
        canVote: eligible.has(selfPlayerId) && !vote.yes.includes(selfPlayerId) && !vote.no.includes(selfPlayerId)
    };
};
}),
"[project]/apps/server/dist/alpha-log.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "alphaLog",
    ()=>alphaLog,
    "short",
    ()=>short
]);
const short = (id)=>id ? id.slice(0, 8) : '-';
function alphaLog(evt, fields = {}) {
    if (process.env.ALPHA_LOG === '0') return;
    try {
        console.log(JSON.stringify({
            t: new Date().toISOString(),
            svc: 'aoh-alpha',
            evt,
            ...fields
        }));
    } catch  {}
}
}),
"[project]/apps/server/dist/alpha-presence.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "absentForMs",
    ()=>absentForMs,
    "connect",
    ()=>connect,
    "disconnect",
    ()=>disconnect,
    "graceMs",
    ()=>graceMs,
    "hasLeft",
    ()=>hasLeft,
    "hostGraceMs",
    ()=>hostGraceMs,
    "leave",
    ()=>leave,
    "removeAbsentMs",
    ()=>removeAbsentMs,
    "resetPresenceForTests",
    ()=>resetPresenceForTests,
    "stateOf",
    ()=>stateOf,
    "touch",
    ()=>touch
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bus$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-bus.js [app-route] (ecmascript)");
;
const shared = globalThis;
const rooms = ()=>shared.aohAlphaPresence ??= new Map();
const boot = ()=>shared.aohAlphaBoot ??= Date.now();
const graceMs = ()=>Number(process.env.ALPHA_PRESENCE_GRACE_MS ?? 20000);
const hostGraceMs = ()=>Number(process.env.ALPHA_HOST_GRACE_MS ?? 60000);
const removeAbsentMs = ()=>Number(process.env.ALPHA_REMOVE_ABSENT_MS ?? 600000);
function entry(gameId, guestId) {
    return rooms().get(gameId)?.get(guestId);
}
function ensure(gameId, guestId, now) {
    const map = rooms().get(gameId) ?? new Map();
    rooms().set(gameId, map);
    let value = map.get(guestId);
    if (!value) {
        value = {
            streams: 0,
            lastSeen: now,
            left: false
        };
        map.set(guestId, value);
    }
    return value;
}
function touch(gameId, guestId, now) {
    const was = stateOf(gameId, guestId, now);
    const value = ensure(gameId, guestId, now);
    value.lastSeen = now;
    value.left = false;
    return {
        returned: was === 'ABSENT'
    };
}
function connect(gameId, guestId, now) {
    const value = ensure(gameId, guestId, now);
    value.streams++;
    value.lastSeen = now;
    value.left = false;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bus$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["publishAlphaEvent"])(gameId, {
        type: 'PRESENCE'
    });
}
function disconnect(gameId, guestId, now) {
    const value = entry(gameId, guestId);
    if (!value) return;
    value.streams = Math.max(0, value.streams - 1);
    value.lastSeen = now;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bus$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["publishAlphaEvent"])(gameId, {
        type: 'PRESENCE'
    });
    // When the grace runs out the others must hear about it without anyone touching the room.
    const timer = setTimeout(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bus$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["publishAlphaEvent"])(gameId, {
            type: 'PRESENCE'
        }), graceMs() + 250);
    timer.unref?.();
}
function leave(gameId, guestId, now) {
    const value = ensure(gameId, guestId, now);
    value.left = true;
    value.streams = 0;
    value.lastSeen = now;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bus$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["publishAlphaEvent"])(gameId, {
        type: 'PRESENCE'
    });
}
function stateOf(gameId, guestId, now) {
    const value = entry(gameId, guestId), seen = value?.lastSeen ?? boot();
    if (value?.left) return 'ABSENT';
    if ((value?.streams ?? 0) > 0) return 'ONLINE';
    return now - seen < graceMs() ? 'RECONNECTING' : 'ABSENT';
}
function absentForMs(gameId, guestId, now) {
    const value = entry(gameId, guestId);
    if (value && value.streams > 0) return 0;
    return Math.max(0, now - (value?.lastSeen ?? boot()));
}
function resetPresenceForTests() {
    rooms().clear();
    delete shared.aohAlphaBoot;
}
function hasLeft(gameId, guestId) {
    return entry(gameId, guestId)?.left === true;
}
}),
"[project]/apps/server/dist/alpha-prisma-repository.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ARCHIVE_REASON_MIGRATED_TO_V5",
    ()=>ARCHIVE_REASON_MIGRATED_TO_V5,
    "PrismaAlphaRepository",
    ()=>PrismaAlphaRepository,
    "decode",
    ()=>decode,
    "encodeRoom",
    ()=>encodeRoom
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$generated$2f$prisma$2f$client$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/server/dist/generated/prisma/client.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$generated$2f$prisma$2f$internal$2f$prismaNamespace$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Prisma$3e$__ = __turbopack_context__.i("[project]/apps/server/dist/generated/prisma/internal/prismaNamespace.js [app-route] (ecmascript) <export * as Prisma>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-room.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$migration$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-migration.js [app-route] (ecmascript)");
;
;
;
const status = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["roomStatus"];
function decode(row) {
    if (!row) return null;
    let parsed = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaRoomSchema"].safeParse(row.snapshot);
    if (!parsed.success && row.snapshot && typeof row.snapshot === 'object') {
        const raw = structuredClone(row.snapshot);
        const game = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$migration$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["migrateSnapshotV4ToV5"])(raw.game);
        if (game.ok) {
            const oldTimer = Number(raw.planningSeconds ?? 0);
            raw.planningSeconds = [
                0,
                180,
                300,
                480,
                3600,
                14400,
                28800
            ].includes(oldTimer) ? oldTimer : oldTimer <= 900 ? 480 : 28800;
            raw.worldPreset = 'MIXED';
            raw.game = game.value;
            parsed = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaRoomSchema"].safeParse(raw);
        }
    }
    // A V1.1 match whose content no longer parses against the current catalogs is NOT an error: it is shown as a legacy table without its game (controlled message,
    // read-only, never deleted or rewritten). Only snapshots that do not look like a V1.1 room at all fail like before.
    if (!parsed.success && row.snapshot && typeof row.snapshot === 'object' && row.snapshot.contentVersion === undefined) {
        const stub = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaRoomSchema"].safeParse({
            ...structuredClone(row.snapshot),
            game: null
        });
        if (stub.success && stub.data.id === row.id && stub.data.joinCode === row.joinCode && BigInt(stub.data.version) === row.version) return stub.data;
    }
    if (!parsed.success) throw new Error('Invalid alpha match snapshot');
    const room = parsed.data;
    if (room.id !== row.id || room.joinCode !== row.joinCode || BigInt(room.version) !== row.version || status(room) !== row.status) throw new Error('Corrupt alpha match metadata');
    return room;
}
function encodeRoom(room) {
    const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaRoomSchema"].parse(room);
    const legacy = parsed.contentVersion !== 'v1.2';
    // A room of the V1.1 generation keeps exactly the V1 shape on disk: no content version, no Figura, no map size (it is always the original Padrão).
    const withoutFigure = (seat)=>{
        const copy = {
            ...seat
        };
        delete copy.figureId;
        return copy;
    };
    const seats = parsed.seats.map((seat)=>legacy ? seat.bot ? withoutFigure(seat) : {
            guestId: seat.guestId,
            playerId: seat.playerId,
            name: seat.name,
            civilization: seat.civilization,
            ready: seat.ready
        } : seat);
    if (legacy) {
        const copy = {
            ...parsed,
            seats
        };
        delete copy.contentVersion;
        delete copy.mapSize;
        return copy;
    }
    return {
        ...parsed,
        seats
    };
}
class StaleWrite extends Error {
}
/** A stored payload that no longer parses as the current room is a legacy snapshot that this save is about to migrate. */ const needsMigration = (snapshot)=>!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaRoomSchema"].safeParse(snapshot).success;
const ARCHIVE_REASON_MIGRATED_TO_V5 = 'MIGRATED_TO_V5';
class PrismaAlphaRepository {
    client;
    constructor(client){
        this.client = client;
    }
    async find(id) {
        return decode(await this.client.alphaMatch.findUnique({
            where: {
                id
            }
        }));
    }
    async findByCode(joinCode) {
        return decode(await this.client.alphaMatch.findUnique({
            where: {
                joinCode
            }
        }));
    }
    async create(room) {
        const snapshot = encodeRoom(room);
        try {
            await this.client.alphaMatch.create({
                data: {
                    id: room.id,
                    joinCode: room.joinCode,
                    version: BigInt(room.version),
                    status: status(room),
                    snapshot
                }
            });
            return true;
        } catch (error) {
            if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$generated$2f$prisma$2f$internal$2f$prismaNamespace$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Prisma$3e$__["Prisma"].PrismaClientKnownRequestError && error.code === 'P2002') return false;
            throw error;
        }
    }
    /**
     * Compare-and-swap save. When the stored row is a legacy snapshot, its original JSON is copied to AlphaMatchArchive in the
     * same transaction, so the v5 rewrite can never destroy the only copy. Reads never write.
     */ async save(room, expectedVersion) {
        const snapshot = encodeRoom(room);
        if (room.version !== expectedVersion + 1) return false;
        try {
            return await this.client.$transaction(async (tx)=>{
                const current = await tx.alphaMatch.findUnique({
                    where: {
                        id: room.id
                    }
                });
                if (!current || current.version !== BigInt(expectedVersion)) return false;
                if (needsMigration(current.snapshot)) await tx.alphaMatchArchive.create({
                    data: {
                        matchId: room.id,
                        version: current.version,
                        reason: ARCHIVE_REASON_MIGRATED_TO_V5,
                        snapshot: current.snapshot
                    }
                });
                const updated = await tx.alphaMatch.updateMany({
                    where: {
                        id: room.id,
                        version: BigInt(expectedVersion)
                    },
                    data: {
                        version: BigInt(room.version),
                        status: status(room),
                        snapshot
                    }
                });
                if (updated.count !== 1) throw new StaleWrite();
                return true;
            });
        } catch (error) {
            if (error instanceof StaleWrite) return false;
            // A competing writer archived the same legacy version first: this write lost the race.
            if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$generated$2f$prisma$2f$internal$2f$prismaNamespace$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Prisma$3e$__["Prisma"].PrismaClientKnownRequestError && error.code === 'P2002') return false;
            throw error;
        }
    }
    /** Original snapshots kept for a match, oldest first. */ async archived(matchId) {
        const rows = await this.client.alphaMatchArchive.findMany({
            where: {
                matchId
            },
            orderBy: {
                version: 'asc'
            }
        });
        return rows.map((row)=>({
                version: Number(row.version),
                reason: row.reason,
                snapshot: row.snapshot
            }));
    }
}
}),
"[project]/apps/server/dist/alpha-projection.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "alphaPlayerView",
    ()=>alphaPlayerView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-route] (ecmascript) <export WEB_ADVANCES as ADVANCEMENTS>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-city-ladder.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-water.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-shock.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$era$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-era-turn.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-city.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-grades.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-institutions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-naval.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-kits.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$growth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-growth.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-actions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-turn.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$unit$2d$options$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-unit-options.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$trade$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-trade.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$phases$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-phases.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$combat$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-combat.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$culture$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-culture.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$independents$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-independents.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-world.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-legacy-works.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-threats.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$discoveries$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-discoveries.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-stack.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-leaders.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-urban.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/urban.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$economy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/economy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$hegemony$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-hegemony.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$stability$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/stability.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-military.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$game$2d$service$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/game-service.js [app-route] (ecmascript)");
;
;
;
function alphaPlayerView(state, actor) {
    const progress = state.players.find((p)=>p.playerId === actor);
    if (!progress) return null;
    const visible = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["visibleHexIds"])(state, actor);
    const growth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$growth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["growthForecast"])(state, actor);
    const economic = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$game$2d$service$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["playerView"])(state.core, actor, {
        visibleHexIds: state.core.map.filter((t)=>visible.has(t.id)).map((t)=>t.id),
        visibleCityIds: state.core.players.flatMap((p)=>p.civilization.cities.filter((c)=>visible.has(c.hexId)).map((c)=>c.id)),
        knownGovernmentPlayerIds: [],
        hidePopulation: true
    });
    if (!economic) return null;
    // Playtest "Mapa revelado": the whole map is cartographed (known terrain and every city) but only the own surroundings are visible.
    const knownIds = state.rules.revealMap ? new Set(state.core.map.map((t)=>t.id)) : new Set(progress.knownHexIds);
    /* Memory of closed Regions no longer exists: the open Regions are the shared table (visible). Only the playtest reveal-map adds cartographed hexes. */ const known = state.rules.revealMap ? state.core.map.filter((t)=>knownIds.has(t.id) && !visible.has(t.id)) : [];
    const territory = state.core.config.territory;
    const displayCost = (cost)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCost"])(cost, progress.resources);
    return structuredClone({
        gameId: state.gameId,
        version: state.version,
        schemaVersion: state.schemaVersion,
        view: economic,
        phase: state.phase,
        urban: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["urbanOptions"])(state, actor),
        worldPulse: state.worldPulse.current ? {
            id: state.worldPulse.current.id,
            name: state.worldPulse.current.name,
            type: state.worldPulse.current.type
        } : null,
        /** Own cities with the canon ladder facts (V5.1a §4): built level, effective level and Capacity, ceiling, slots, Ânimo band and what Elevar needs. */ cityStates: state.cities.filter((c)=>c.currentOwnerId === actor).map((c)=>{
            const pair = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cityPair"])(state, c.cityId);
            const levels = pair ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cityLevels"])(c, pair.city) : null;
            const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nextLevel"])(c.level);
            const requirement = next ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["elevateRequirement"])(next) : null;
            return {
                cityId: c.cityId,
                status: c.status,
                integration: c.integration,
                mood: c.mood,
                moodBand: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["moodBand"])(c.mood),
                level: c.level,
                effectiveLevel: levels?.effective ?? c.level,
                degraded: levels?.degraded ?? false,
                capacity: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["activationCapacity"])(state, c.cityId),
                baseCapacity: levels?.capacity ?? 0,
                ceiling: levels?.ceiling ?? 0,
                slots: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["districtSlots"])(state, c.cityId),
                activationsAllowed: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["activationsAllowed"])(c),
                localCohesion: c.localCohesion,
                urbanActionsUsed: c.urbanActionsUsed,
                plannedUrbanActions: progress.plannedActions.filter((action)=>action.type === 'URBAN_ACTION' && action.cityId === c.cityId).length,
                fortification: c.fortification.level,
                elevate: requirement ? {
                    next: requirement.to,
                    minPopulation: requirement.minPopulation,
                    cost: displayCost(requirement.cost),
                    advances: requirement.advances.map((id)=>({
                            id,
                            name: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].find((a)=>a.id === id)?.name ?? id,
                            done: progress.research.includes(id)
                        })),
                    era: requirement.era,
                    block: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["elevateBlock"])(state, actor, c.cityId)
                } : null
            };
        }),
        administration: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["administration"])(state, actor),
        /** Own Recrutar limit per city (Capacidade, Militar district, government), so a client can offer a count. */ recruitLimits: Object.fromEntries(state.cities.filter((c)=>c.currentOwnerId === actor).map((c)=>[
                c.cityId,
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recruitLimit"])(state, actor, c.cityId)
            ])),
        operatingCapacity: Object.fromEntries(state.cities.filter((c)=>c.currentOwnerId === actor).map((c)=>[
                c.cityId,
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["operatingCapacity"])(state, c.cityId)
            ])),
        /** Own military Graus I–III by family (canon §12b); rivals' Graus stay private with their research. */ grades: Object.fromEntries(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GRADE_FAMILIES"].map((kind)=>[
                kind,
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unitGrade"])(state, actor, kind)
            ])),
        /** What anyone sees of a visible city from outside: its size and its walls (UXDEC-016/017). Never population details. */ cityMarks: state.cities.flatMap((meta)=>{
            const city = state.core.players.flatMap((p)=>p.civilization.cities).find((c)=>c.id === meta.cityId);
            if (!city || meta.currentOwnerId !== actor && !visible.has(city.hexId) && !state.rules.revealMap) return []; /* A blockade of a rival's port would reveal a war between others: only the owner learns it. */ 
            const own = meta.currentOwnerId === actor;
            return [
                {
                    cityId: meta.cityId,
                    hexId: city.hexId,
                    ownerId: meta.currentOwnerId,
                    level: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CityLevelSchema"].options.indexOf(meta.level) + 1,
                    capacity: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ladderStep"])(meta.level).capacity,
                    capital: meta.capital,
                    fortification: meta.fortification,
                    blockaded: own ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["blockadedBy"])(state, city.hexId, actor) !== null : null,
                    /** Material culture: the civilization's hidden chassis (the client maps it to an architecture), the quay (only with a Distrito Marítimo) and the Obra de Legado on the city. */ civilization: state.players.find((p)=>p.playerId === meta.currentOwnerId)?.civilization ?? null,
                    harbor: meta.districts.includes('MARITIME') ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["harborHex"])(state, city.hexId) : null,
                    work: (()=>{
                        const progress = state.legacyWorks.find((w)=>w.cityId === meta.cityId);
                        return progress ? {
                            workId: progress.workId,
                            steps: progress.stepsDone,
                            complete: progress.completedRound !== null
                        } : null;
                    })()
                }
            ];
        }),
        culture: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$culture$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["culturalPresenceView"])(state, actor),
        independents: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$independents$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["independentPeopleView"])(state, actor),
        threats: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatView"])(state, actor),
        threatAlerts: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatAlerts"])(state, actor),
        explorationHints: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$discoveries$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["explorationHints"])(state, actor),
        leaderBlock: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["leaderAbilityBlock"])(state, actor),
        /** The Era turn is public: the step it waits at, the log of steps already run and who has not confirmed. Reform options are the viewer's own. */ eraTurn: state.eraTurn ? {
            era: state.eraTurn.era,
            step: state.eraTurn.step,
            log: state.eraTurn.log,
            awaiting: state.players.filter((p)=>!p.ready).map((p)=>p.playerId)
        } : null,
        government: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$era$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentOptions"])(state, actor),
        stacks: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackView"])(state, actor),
        unitOptions: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$unit$2d$options$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaUnitOptions"])(state, actor),
        claimOptions: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$unit$2d$options$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaClaimOptions"])(state, actor),
        /** While reactions are open, the defender learns who attacks which of its hexes (never the force or posture). */ incomingAttacks: state.phase === 'CONFLICTS' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$phases$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["pendingAttacks"])(state).filter((attack)=>attack.defenderId === actor).map(({ attackerId, target })=>({
                attackerId,
                target
            })) : [],
        orderPreviews: Object.fromEntries(progress.orders.flatMap((order)=>order.type === 'ATTACK' ? [
                [
                    order.id,
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$combat$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["combatPreview"])(state, actor, order)
                ]
            ] : [])),
        self: progress,
        casualtyDefault: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["defaultCasualtyPriority"])(state),
        storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaStorageCapacity"])(state, actor),
        actions: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaActionUsage"])(state, actor),
        actionClasses: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ACTION_CLASS"],
        commandCapacity: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["alphaCommandCapacity"])(state, actor),
        rules: state.rules,
        costs: {
            claim: displayCost(territory.claimCost),
            founding: displayCost(territory.foundingCost),
            road: displayCost((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitWorksCost"])(state, actor, state.rules.roadCost)),
            advisor: displayCost(state.rules.advisorCost),
            development: state.core.config.developmentCosts.map(displayCost),
            improvements: Object.fromEntries(Object.entries(territory.improvementCatalog).map(([kind, entry])=>[
                    kind,
                    displayCost((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitWorksCost"])(state, actor, entry.cost))
                ])),
            advancements: Object.fromEntries([
                ...__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"],
                ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["heritageFor"])(state, actor)
            ].map((advancement)=>[
                    advancement.id,
                    displayCost((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["advanceCost"])(state, actor, advancement.id))
                ]))
        },
        milestones: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eraMilestones"])(state, actor),
        cityDetails: economic.player.civilization.cities.map((c)=>({
                id: c.id,
                category: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$stability$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stabilityCategory"])(c.stability, state.core.config),
                growthThreshold: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["infrastructureStats"])(c, state.core.config).growthThreshold,
                growth: ((g)=>({
                        producedFood: g.producedFood,
                        eats: g.eats,
                        growCost: g.growCost,
                        ceiling: g.ceiling,
                        capped: g.capped,
                        willGrow: g.willGrow,
                        civilization: {
                            foodProduced: growth.foodProduced,
                            foodEaten: growth.foodEaten,
                            shortage: growth.shortage,
                            surplus: growth.surplus
                        }
                    }))(growth.cities.find((g)=>g.cityId === c.id)),
                production: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$economy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["deriveCityProductionBreakdown"])(c, economic.player.civilization, state.core.config, state.core.map)
            })),
        roundReports: state.roundReports.filter((r)=>r.playerId === actor),
        hegemony: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$hegemony$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hegemonyProgress"])(state, actor),
        declarations: state.players.filter((p)=>p.hegemony !== null).map((p)=>({
                playerId: p.playerId,
                ...p.hegemony
            })),
        worldEvent: state.cards.worldEvent,
        worldDecisionPending: !state.cards.worldResponded.includes(actor),
        advisorMarket: state.cards.advisorMarket,
        legacyWorks: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["legacyWorkView"])(state, actor),
        players: state.core.players.map((p)=>({
                id: p.id,
                name: p.name,
                civilization: state.players.find((s)=>s.playerId === p.id).civilization,
                /** The Figura is public once the match runs (the lobby already revealed everyone's at once). */ figureId: state.players.find((s)=>s.playerId === p.id).leader?.leaderId ?? null,
                ready: state.players.find((s)=>s.playerId === p.id).ready,
                prestige: state.players.find((s)=>s.playerId === p.id).prestige,
                era: state.players.find((s)=>s.playerId === p.id).era,
                /** Public summary only: how many sockets are filled, never which advances or the cards behind them. */ resonanceFilled: state.players.find((s)=>s.playerId === p.id).resonance.slots.length,
                resonanceCycles: state.players.find((s)=>s.playerId === p.id).resonance.cycles
            })),
        initiative: state.initiative,
        winner: state.winner,
        /** Only once the match is over: the ranking and the tie-break figures behind it, for everyone. */ finalStandings: state.winner ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$phases$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prestigeRanking"])(state).map((id)=>{
            const progress = state.players.find((p)=>p.playerId === id), owner = state.core.players.find((p)=>p.id === id);
            return {
                playerId: id,
                name: owner.name,
                civilization: progress.civilization,
                prestige: progress.prestige,
                research: progress.research.length,
                population: owner.civilization.cities.reduce((total, city)=>total + city.population, 0),
                wealth: progress.resources.wealth,
                cities: owner.civilization.cities.length,
                hegemony: progress.hegemony?.path ?? null
            };
        }) : [],
        knownTerritory: known.map((t)=>({
                id: t.id,
                q: t.q,
                r: t.r,
                terrain: t.terrain,
                features: t.features,
                visibility: 'KNOWN'
            })),
        /** Layer A (public topology): the whole board, face-down Regions for this viewer and whose Pátria is whose. No content. */ board: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["boardView"])(state, actor),
        /** Rivals see a fleet, never its cargo. */ units: state.units.filter((u)=>u.ownerId === actor || visible.has(u.hexId) && !u.carrierId).map((u)=>({
                ...u,
                supply: u.ownerId === actor ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unitSupply"])(state, u) : null
            })),
        /** Open Regions are shared by the whole table (terrain is public); what a discovery held was resolved by its discoverer, so only the discoverer reads it. */ regions: state.regions.filter((r)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["regionOpenFor"])(state, r, actor)).map((r)=>({
                id: r.id,
                templateId: r.templateId,
                hexIds: r.hexIds,
                rotation: r.rotation,
                discovery: r.discovery && r.revealedBy.includes(actor) ? {
                    kind: r.discovery.kind,
                    resolved: r.discovery.resolved
                } : null
            })),
        roads: state.roads.filter((id)=>visible.has(id)),
        occupations: state.occupations.filter((o)=>o.occupierId === actor || o.previousOwnerId === actor),
        treaties: state.treaties.filter((t)=>t.proposerId === actor || t.recipientId === actor),
        tradeOffers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$trade$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["tradeOfferView"])(state, actor),
        wars: state.wars,
        routes: state.routes.filter((r)=>r.ownerId === actor || economic.player.civilization.cities.some((c)=>c.id === r.toCityId)),
        battles: state.battles.filter((b)=>b.attackerId === actor || b.defenderId === actor || visible.has(b.hexId)),
        events: state.events.filter((e)=>e.audience === null || e.audience.includes(actor)),
        economicEvents: state.core.eventLog.filter((e)=>'playerId' in e && e.playerId === actor).slice(-60)
    });
}
}),
"[project]/apps/server/dist/alpha-room.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AlphaRoomSchema",
    ()=>AlphaRoomSchema,
    "CreateAlphaRoomSchema",
    ()=>CreateAlphaRoomSchema,
    "InMemoryAlphaRepository",
    ()=>InMemoryAlphaRepository,
    "LEGACY_ROOM_MESSAGE",
    ()=>LEGACY_ROOM_MESSAGE,
    "LobbyActionSchema",
    ()=>LobbyActionSchema,
    "PINGS",
    ()=>PINGS,
    "REACTIONS",
    ()=>REACTIONS,
    "RoomActionSchema",
    ()=>RoomActionSchema,
    "isLegacyRoom",
    ()=>isLegacyRoom,
    "lifecycleOf",
    ()=>lifecycleOf,
    "roomStatus",
    ()=>roomStatus
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-institutions.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-leaders.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$core10$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-core10.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-topology.js [app-route] (ecmascript)");
;
;
const AlphaRoomSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GameIdSchema"],
    version: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1).max(80),
    joinCode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^[A-Za-z0-9_-]{22}$/),
    hostGuestId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid(),
    preset: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaPresetSchema"],
    worldPreset: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MapPresetSchema"].default('MIXED'),
    mapSize: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MapSizeSchema"].default('STANDARD'),
    seed: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SeedSchema"],
    seatLimit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(2).max(6),
    /** Content generation of the table. A room saved before RC 1.2 has none: it stays readable but read-only (see `isLegacyRoom`). */ contentVersion: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'v1.1',
        'v1.2'
    ]).default('v1.1'),
    actionsPerRound: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(3).max(6).default(5),
    revealMap: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(false),
    planningSeconds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(0),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(180),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(300),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(480),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(3600),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(14400),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(28800)
    ]),
    deadline: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().nonnegative().nullable(),
    seats: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        guestId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid(),
        playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1).max(80),
        civilization: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable(),
        ready: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
        figureId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(64).nullable().default(null),
        bot: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(false),
        botPersona: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(20).nullable().default(null)
    })).min(1).max(6),
    game: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaStateSchema"].nullable(),
    /** External-alpha lifecycle (all optional on old snapshots). LOBBY / ACTIVE / SUSPENDED / FINISHED / CLOSED are derived by `lifecycleOf`. */ suspended: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(false),
    closedReason: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'HOST',
        'VOTE'
    ]).nullable().default(null),
    /** Civilizations EM GUARDA: kept on the table (cities, territory, pieces), confirm every phase without Orders until their person resumes. */ onGuard: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PlayerIdSchema"]).max(6).default([]),
    vote: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(40),
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'REMOVE',
            'END'
        ]),
        target: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PlayerIdSchema"].nullable(),
        proposer: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PlayerIdSchema"],
        yes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PlayerIdSchema"]).max(6),
        no: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PlayerIdSchema"]).max(6),
        createdAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().nonnegative()
    }).nullable().default(null),
    /** Short public log of room-level events (host transfer, joins, votes…), newest last. */ notices: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().nonnegative(),
        at: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().nonnegative(),
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(40),
        text: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(160)
    })).max(30).default([])
}).superRefine((room, ctx)=>{
    const fail = (message)=>ctx.addIssue({
            code: 'custom',
            message
        });
    if (room.seats.length > room.seatLimit || !room.seats.some((s)=>s.guestId === room.hostGuestId)) fail('Invalid lobby host or seat count');
    for (const key of [
        'guestId',
        'playerId'
    ])if (new Set(room.seats.map((s)=>s[key])).size !== room.seats.length) fail('Duplicate seat identity');
    const civilizations = room.seats.map((s)=>s.civilization).filter((c)=>c !== null);
    if (new Set(civilizations).size !== civilizations.length || civilizations.some((c)=>!__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CIVILIZATIONS"].some((def)=>def.id === c) || room.contentVersion === 'v1.2' && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$core10$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isCore10Chassis"])(c))) fail('Invalid civilization choice');
    if (room.seats.some((s)=>s.figureId !== null && (s.civilization === null || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["figuresOfCivilization"])(s.civilization).some((figure)=>figure.id === s.figureId)))) fail('Invalid Figura choice');
    if (room.contentVersion === 'v1.2' && room.seats.some((s)=>s.civilization !== null && s.figureId === null)) fail('A civilization needs its Figura');
    if (room.seats.some((s)=>s.ready && s.civilization === null)) fail('Ready seat requires civilization');
    if (room.game === null && room.seatLimit > __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MAP_FOOTPRINT"][room.mapSize].maxPlayers) fail('Map size does not fit the table');
    if (room.game && (room.game.gameId !== room.id || room.game.players.length !== room.seats.length || room.seats.some((s)=>!room.game.players.some((p)=>p.playerId === s.playerId && p.civilization === s.civilization)))) fail('Lobby and match identity mismatch');
    if ((!room.game || room.game.core.status === 'FINISHED' || room.planningSeconds === 0) && room.deadline !== null) fail('Unexpected phase deadline');
});
const isLegacyRoom = (room)=>room.contentVersion !== 'v1.2';
const LEGACY_ROOM_MESSAGE = 'Esta partida foi criada em uma versão anterior do Alpha (1.1) e agora é somente leitura. Crie uma nova sala para jogar com a versão atual.';
const lifecycleOf = (room)=>room.closedReason !== null ? 'CLOSED' : !room.game ? 'LOBBY' : room.game.core.status === 'FINISHED' ? 'FINISHED' : room.suspended ? 'SUSPENDED' : 'ACTIVE';
const roomStatus = (room)=>room.closedReason !== null ? 'CLOSED' : room.suspended && room.game?.core.status !== 'FINISHED' ? 'SUSPENDED' : room.game?.core.status ?? 'LOBBY';
const CreateAlphaRoomSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1).max(80),
    displayName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1).max(80),
    preset: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaPresetSchema"],
    worldPreset: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MapPresetSchema"].default('MIXED'),
    mapSize: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MapSizeSchema"].optional(),
    seatLimit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(2).max(6),
    seed: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SeedSchema"],
    planningSeconds: AlphaRoomSchema.shape.planningSeconds,
    actionsPerRound: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(3).max(6).default(5),
    revealMap: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(false)
});
const LobbyActionSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].discriminatedUnion('type', [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('CHOOSE_CIVILIZATION'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        civilization: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('CHOOSE_FIGURE'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        figureId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(64)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('LOBBY_READY'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        ready: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('START'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    // Host-only, LOBBY only.
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('KICK'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PlayerIdSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('SET_SEATS'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        seatLimit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(2).max(6)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('SET_WORLD'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        worldPreset: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MapPresetSchema"].optional(),
        mapSize: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MapSizeSchema"].optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('CLOSE_ROOM'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('ADD_BOT'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('REMOVE_BOT'),
        expectedVersion: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"],
        playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PlayerIdSchema"]
    })
]);
const REACTIONS = [
    'APPLAUSE',
    'SURPRISE',
    'THINKING',
    'ATTENTION',
    'CHEER',
    'WATCHING'
];
const PINGS = [
    'MARK',
    'ATTENTION'
];
const RoomActionSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].discriminatedUnion('type', [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('LEAVE')
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('SUSPEND')
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('RESUME')
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('PROPOSE_REMOVE'),
        target: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PlayerIdSchema"]
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('PROPOSE_END')
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('VOTE'),
        yes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('CANCEL_VOTE')
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('RESUME_SEAT')
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('REACT'),
        reaction: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum(REACTIONS)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].strictObject({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('PING'),
        hexId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^-?\d{1,3},-?\d{1,3}$/),
        reaction: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum(PINGS).default('MARK')
    })
]);
class InMemoryAlphaRepository {
    rooms;
    constructor(rooms = new Map()){
        this.rooms = rooms;
    }
    async find(id) {
        const room = this.rooms.get(id);
        return room ? AlphaRoomSchema.parse(room) : null;
    }
    async findByCode(code) {
        const room = [
            ...this.rooms.values()
        ].find((r)=>r.joinCode === code);
        return room ? AlphaRoomSchema.parse(room) : null;
    }
    async create(room) {
        const parsed = AlphaRoomSchema.parse(room);
        if (this.rooms.has(room.id) || [
            ...this.rooms.values()
        ].some((r)=>r.joinCode === room.joinCode)) return false;
        this.rooms.set(room.id, parsed);
        return true;
    }
    async save(room, expectedVersion) {
        const parsed = AlphaRoomSchema.parse(room);
        if (room.version !== expectedVersion + 1 || this.rooms.get(room.id)?.version !== expectedVersion) return false;
        this.rooms.set(room.id, parsed);
        return true;
    }
}
}),
"[project]/apps/server/dist/alpha-runtime.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s([
    "alphaHealth",
    ()=>alphaHealth,
    "handleAlphaRequest",
    ()=>handleAlphaRequest
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@prisma/adapter-pg/dist/index.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$generated$2f$prisma$2f$client$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/server/dist/generated/prisma/client.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$prisma$2d$repository$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-prisma-repository.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$service$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-service.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$guest$2d$session$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/guest-session.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$http$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-http.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bus$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-bus.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-room.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-lifecycle.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$storage$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-storage.js [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
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
const expectedMigrations = [
    '20260919000100_alpha_match',
    '20260920000100_alpha_match_archive'
];
const release = 'alpha-external-0.2';
const posture = ()=>({
        maxSeats: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["maxSeats"])(),
        accessProtected: Boolean(process.env.ALPHA_ACCESS_CODE),
        singleInstance: true
    });
/** Identifies this evaluation of the module. In development a hot reload evaluates it again, which rebuilds the HTTP layer over the same database client. */ const moduleToken = Symbol('alpha-runtime');
const processState = globalThis;
const memory = ()=>processState.aohAlphaMemory ??= {
        rooms: new Map(),
        secret: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomBytes"])(48).toString('base64url')
    };
function runtime() {
    const storage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$storage$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaStorageMode"])(process.env), cached = processState.aohAlphaRuntime;
    // Production keeps one runtime for the life of the process. In development it is rebuilt when this module is reloaded, so recompiled engine and server code takes effect without restarting.
    if (cached && cached.storage === storage && (("TURBOPACK compile-time value", "development") === 'production' || cached.module === moduleToken)) return cached;
    if (storage === 'memory') {
        // Zero-config development: real guest sessions (signed cookies, one per browser) over an in-process repository. Never reachable in production.
        const local = memory(), secret = (process.env.ALPHA_SESSION_SECRET ?? '').length >= 32 ? process.env.ALPHA_SESSION_SECRET : local.secret;
        const http = new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$http$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaHttp"](new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$service$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaGameService"](new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bus$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PublishingAlphaRepository"](new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["InMemoryAlphaRepository"](local.rooms))), new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$guest$2d$session$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GuestSessions"](secret), process.env.ALPHA_PUBLIC_ORIGIN || 'http://127.0.0.1:3001', false);
        return processState.aohAlphaRuntime = {
            client: null,
            http,
            storage,
            module: moduleToken
        };
    }
    const connectionString = process.env.DATABASE_URL, secret = process.env.ALPHA_SESSION_SECRET, origin = process.env.ALPHA_PUBLIC_ORIGIN;
    if (!connectionString || !secret || !origin) throw new Error('Alpha environment is not configured');
    const sessions = new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$guest$2d$session$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GuestSessions"](secret), client = cached?.client ?? new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$generated$2f$prisma$2f$client$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["PrismaClient"]({
        adapter: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PrismaPg"]({
            connectionString
        })
    });
    const http = new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$http$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaHttp"](new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$service$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaGameService"](new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bus$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PublishingAlphaRepository"](new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$prisma$2d$repository$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PrismaAlphaRepository"](client))), sessions, origin, ("TURBOPACK compile-time value", "development") === 'production');
    return processState.aohAlphaRuntime = {
        client,
        http,
        storage,
        module: moduleToken
    };
}
async function handleAlphaRequest(request) {
    try {
        return await runtime().http.handle(request);
    } catch  {
        return Response.json({
            ok: false,
            error: {
                code: 'UNAVAILABLE',
                message: 'Teste online indisponível: banco e sessão de alpha precisam estar configurados no servidor.'
            }
        }, {
            status: 503,
            headers: {
                'Cache-Control': 'no-store'
            }
        });
    }
}
async function alphaHealth() {
    try {
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$storage$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaStorageMode"])(process.env) === 'memory') {
            runtime();
            return Response.json({
                ok: true,
                service: 'ages-of-hegemony-alpha',
                release,
                storage: 'memory',
                ...posture()
            }, {
                headers: {
                    'Cache-Control': 'no-store'
                }
            });
        }
        const client = runtime().client;
        await client.$queryRaw`SELECT 1`;
        const rows = await client.$queryRaw`SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations`;
        const migration = expectedMigrations.every((name)=>rows.some((r)=>r.migration_name === name && r.finished_at !== null && r.rolled_back_at === null));
        const failed = rows.some((r)=>r.finished_at === null && r.rolled_back_at === null);
        const ready = migration && !failed;
        return Response.json({
            ok: ready,
            service: 'ages-of-hegemony-alpha',
            release,
            database: true,
            migration: ready,
            ...posture()
        }, {
            status: ready ? 200 : 503,
            headers: {
                'Cache-Control': 'no-store'
            }
        });
    } catch  {
        return Response.json({
            ok: false,
            service: 'ages-of-hegemony-alpha',
            release,
            database: false,
            migration: false
        }, {
            status: 503,
            headers: {
                'Cache-Control': 'no-store'
            }
        });
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/server/dist/alpha-service.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AlphaGameService",
    ()=>AlphaGameService,
    "roomView",
    ()=>roomView
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$core10$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-core10.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-leaders.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-topology.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-turn.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-world.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$scenario$2d$contact$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-scenario-contact.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared/dist/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-room.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-lifecycle.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$presence$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-presence.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bus$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-bus.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-log.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bot$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-bot.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$projection$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-projection.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$playtest$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/playtest-log.js [app-route] (ecmascript)");
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
function roomView(room, principal, now = Date.now()) {
    const seat = room.seats.find((s)=>s.guestId === principal.guestId);
    if (!seat) return null;
    const lifecycle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["lifecycleOf"])(room), safe = room.game ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["safePoint"])(room) : null;
    return {
        playtest: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$playtest$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["playtestEnabled"])(),
        id: room.id,
        version: room.version,
        name: room.name,
        joinCode: room.joinCode,
        preset: room.preset,
        worldPreset: room.worldPreset,
        mapSize: room.mapSize,
        seed: room.seed,
        seatLimit: room.seatLimit,
        maxSeats: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["maxSeats"])(),
        actionsPerRound: room.actionsPerRound,
        revealMap: room.revealMap,
        planningSeconds: room.planningSeconds,
        deadline: room.deadline,
        contentVersion: room.contentVersion,
        legacy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isLegacyRoom"])(room),
        legacyMessage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isLegacyRoom"])(room) ? __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LEGACY_ROOM_MESSAGE"] : null,
        selfPlayerId: seat.playerId,
        isHost: room.hostGuestId === principal.guestId,
        lifecycle,
        suspended: room.suspended,
        closedReason: room.closedReason,
        selfOnGuard: room.onGuard.includes(seat.playerId),
        canSuspend: lifecycle === 'ACTIVE' && room.hostGuestId === principal.guestId && safe?.ok === true,
        suspendBlock: safe && !safe.ok ? safe.reason : null,
        vote: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["voteView"])(room, seat.playerId, now),
        notices: room.notices.slice(-8),
        seats: room.seats.map((s)=>({
                playerId: s.playerId,
                name: s.name,
                civilization: s.civilization,
                // A Figura stays private until everyone confirmed (or the match began): the table reveals all choices at once.
                figureId: s.playerId === seat.playerId || room.game !== null || room.seats.every((other)=>other.ready) ? s.figureId : null,
                figureChosen: s.figureId !== null,
                ready: s.ready,
                isHost: s.guestId === room.hostGuestId,
                bot: s.bot,
                presence: s.bot ? 'BOT' : (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["presenceOf"])(room, s.guestId, now),
                onGuard: room.onGuard.includes(s.playerId)
            })),
        game: room.game ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$projection$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPlayerView"])(room.game, seat.playerId) : null
    };
}
const forbidden = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'FORBIDDEN',
        message: 'Esta sessão não ocupa um lugar na partida.'
    });
const conflict = ()=>{
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('SAVE_CONFLICT');
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'VERSION_CONFLICT',
        message: 'A partida mudou. Atualize antes de confirmar novamente.'
    });
};
class AlphaGameService {
    repository;
    constructor(repository){
        this.repository = repository;
    }
    /** In-process memory of what each bot already planned this phase and which confirmation timers are armed (single instance, like the SSE bus). A restart just replans. */ botPlanned = new Set();
    botScheduled = new Set();
    /**
     * Bots act on the server, from their own seat-redacted view, through canonical commands. Per bot and phase: plan (instant), then confirm after a short
     * presentation delay (none when ALPHA_BOT_DELAY_MS=0). Only while the table is ACTIVE: suspended, closed or finished tables never move.
     */ settleBots(room, now, readyNow = new Set()) {
        const out = {
            timers: [],
            changed: false,
            planned: []
        };
        const first = room.game;
        if (!first || (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["lifecycleOf"])(room) !== 'ACTIVE') return out;
        const bots = room.seats.filter((s)=>s.bot);
        if (!bots.length) return out;
        const prevPhase = first.phase, prevRound = first.core.round, delay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bot$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["botDelayMs"])();
        for(let pass = 0; pass < 16; pass++){
            let progressed = false;
            for (const seat of bots){
                const game = room.game;
                if (game.core.status === 'FINISHED' || ![
                    'PLANNING',
                    'ERA_TURN',
                    'CONFLICTS'
                ].includes(game.phase)) break;
                const me = game.players.find((p)=>p.playerId === seat.playerId);
                if (!me || me.ready) continue;
                const key = `${room.id}:${seat.playerId}:${game.core.round}:${game.phase}`;
                if (!this.botPlanned.has(key)) {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('BOT_PLAN_STARTED', {
                        room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(room.id),
                        seat: seat.playerId,
                        round: game.core.round,
                        phase: game.phase
                    });
                    room.game = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bot$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["planBotSeat"])(room.id, game, seat.playerId, seat.botPersona ?? 'balanced', room.seed).game;
                    this.botPlanned.add(key);
                    out.planned.push(key);
                    if (this.botPlanned.size > 4096) this.botPlanned.clear();
                    progressed = true;
                    out.changed = true;
                }
                if (delay === 0 || readyNow.has(key)) {
                    const done = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bot$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["confirmBotSeat"])(room.id, room.game, seat.playerId);
                    if (done.ok) {
                        room.game = done.game;
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('BOT_PLAN_CONFIRMED', {
                            room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(room.id),
                            seat: seat.playerId,
                            round: game.core.round
                        });
                        progressed = true;
                        out.changed = true;
                    }
                } else if (!this.botScheduled.has(key)) {
                    this.botScheduled.add(key);
                    out.timers.push({
                        key,
                        delay
                    });
                }
            }
            if (!progressed) break;
        }
        if (out.changed) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["runGuards"])(room);
            const now2 = room.game;
            if (now2.core.status === 'FINISHED') room.deadline = null;
            else if (room.planningSeconds && (prevPhase !== now2.phase || prevRound !== now2.core.round)) room.deadline = now + room.planningSeconds * 1000;
        }
        return out;
    }
    /** A save that lost the race discards the in-memory plans of that attempt, so the next look replans from the stored room. */ unplan(settled) {
        for (const key of settled.planned)this.botPlanned.delete(key);
        for (const t of settled.timers)this.botScheduled.delete(t.key);
    }
    armBotTimers(roomId, timers) {
        for (const timer of timers){
            const handle = setTimeout(()=>{
                this.botScheduled.delete(timer.key);
                void this.botReady(roomId, timer.key).catch(()=>undefined);
            }, timer.delay);
            handle.unref?.();
        }
    }
    /** A bot's delayed confirmation: re-read the room (it may have been suspended, closed or advanced) and confirm only if that exact phase is still open. */ async botReady(roomId, key) {
        for(let attempt = 0; attempt < 3; attempt++){
            const room = await this.repository.find(roomId);
            if (!room || (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["lifecycleOf"])(room) !== 'ACTIVE') return;
            const expected = room.version, settled = this.settleBots(room, Date.now(), new Set([
                key
            ]));
            if (!settled.changed) {
                this.armBotTimers(roomId, settled.timers);
                return;
            }
            room.version = expected + 1;
            if (await this.repository.save(room, expected)) {
                this.armBotTimers(roomId, settled.timers);
                return;
            }
            this.unplan(settled);
        }
    }
    /** Server clock drives deadlines; CAS makes concurrent polling safe. No client time is accepted. */ async expire(room, now) {
        if (!room.game || room.deadline === null || now < room.deadline || room.suspended || room.closedReason !== null) return room;
        const expected = room.version, gameBefore = room.game;
        for (const actor of [
            ...room.game.initiative
        ]){
            const player = room.game.players.find((p)=>p.playerId === actor);
            if (player.ready) continue;
            if (!player.ambitionsChosen) {
                const chosen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["applyAlphaCommand"])(room.game, actor, {
                    type: 'CHOOSE_AMBITIONS',
                    expectedVersion: room.game.version,
                    cardIds: player.ambitions.slice(0, 2)
                });
                if (!chosen.ok) throw new Error(`Alpha timeout failed: ${chosen.error.code}`);
                room.game = chosen.value;
            }
            const ready = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["applyAlphaCommand"])(room.game, actor, {
                type: 'READY',
                expectedVersion: room.game.version
            });
            if (!ready.ok) throw new Error(`Alpha timeout failed: ${ready.error.code}`);
            room.game = ready.value;
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["runGuards"])(room);
        const bots = this.settleBots(room, now);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$playtest$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["playtestRecorderFor"])(room.id)?.observeTransition(gameBefore, room.game);
        room.version++;
        room.deadline = room.game.core.status === 'FINISHED' ? null : now + room.planningSeconds * 1000;
        if (await this.repository.save(room, expected)) {
            this.armBotTimers(room.id, bots.timers);
            return room;
        }
        this.unplan(bots);
        return null;
    }
    async create(principal, raw) {
        const input = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CreateAlphaRoomSchema"].safeParse(raw);
        if (!input.success) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'INVALID_INPUT',
            message: 'Revise nome, jogadores, duração e semente da partida.'
        });
        if (input.data.seatLimit > (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["maxSeats"])()) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'INVALID_INPUT',
            message: `Neste Alpha a partida comporta de 2 a ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["maxSeats"])()} jogadores.`
        });
        const { displayName, mapSize: askedSize, ...options } = input.data;
        const mapSize = askedSize ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recommendedMapSize"])(options.seatLimit);
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mapSizeAllows"])(mapSize, options.seatLimit)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'INVALID_INPUT',
            message: 'Este tamanho de mapa não comporta esse número de jogadores.'
        });
        const room = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaRoomSchema"].parse({
            ...options,
            mapSize,
            contentVersion: 'v1.2',
            id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GameIdSchema"].parse((0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomUUID"])()),
            joinCode: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomBytes"])(16).toString('base64url'),
            version: 0,
            hostGuestId: principal.guestId,
            deadline: null,
            game: null,
            seats: [
                {
                    guestId: principal.guestId,
                    playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PlayerIdSchema"].parse('player-1'),
                    name: displayName,
                    civilization: null,
                    figureId: null,
                    ready: false,
                    bot: false,
                    botPersona: null
                }
            ]
        });
        if (!await this.repository.create(room)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'ALREADY_EXISTS',
            message: 'Não foi possível criar a partida. Tente novamente.'
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$presence$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["touch"])(room.id, principal.guestId, Date.now());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('ROOM_CREATED', {
            room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(room.id),
            seats: room.seatLimit,
            preset: room.preset,
            world: room.worldPreset,
            size: room.mapSize
        });
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(roomView(room, principal));
    }
    async join(principal, code, displayName, now = Date.now()) {
        if (!/^[A-Za-z0-9_-]{22}$/.test(code) || !displayName.trim() || displayName.trim().length > 80) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'INVALID_INPUT',
            message: 'Informe um código de convite válido e seu nome.'
        });
        const room = await this.repository.findByCode(code);
        if (!room) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'NOT_FOUND',
            message: 'Convite não encontrado.'
        });
        const existing = roomView(room, principal, now);
        if (existing) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$presence$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["touch"])(room.id, principal.guestId, now);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(existing);
        }
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isLegacyRoom"])(room)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'LEGACY_ROOM',
            message: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LEGACY_ROOM_MESSAGE"]
        });
        if (room.closedReason !== null) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'LOBBY_CLOSED',
            message: 'Esta sala foi encerrada.'
        });
        if (room.game || room.seats.length >= Math.min(room.seatLimit, (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["maxSeats"])())) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'LOBBY_CLOSED',
            message: 'A partida já começou ou não possui vagas.'
        });
        const expected = room.version;
        room.seats.push({
            guestId: principal.guestId,
            playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PlayerIdSchema"].parse((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nextPlayerId"])(room)),
            name: displayName.trim(),
            civilization: null,
            figureId: null,
            ready: false,
            bot: false,
            botPersona: null
        });
        room.version++;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addNotice"])(room, 'PLAYER_JOINED', `${displayName.trim()} entrou na sala.`, now);
        if (!await this.repository.save(room, expected)) return conflict();
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$presence$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["touch"])(room.id, principal.guestId, now);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('PLAYER_JOINED', {
            room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(room.id),
            seats: room.seats.length
        });
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(roomView(room, principal, now));
    }
    /** Saves the room after a rule changed it; the CAS decides, nothing is applied twice. */ async commit(room, expected, principal, now) {
        const bots = this.settleBots(room, now);
        room.version = expected + 1;
        const valid = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaRoomSchema"].safeParse(room);
        if (!valid.success) {
            this.unplan(bots);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'INVALID_CHOICE',
                message: 'Estado de sala inválido.'
            });
        }
        if (await this.repository.save(valid.data, expected)) {
            this.armBotTimers(room.id, bots.timers);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(roomView(valid.data, principal, now));
        }
        this.unplan(bots);
        return conflict();
    }
    /** What happens on every look at the room: the host role follows presence, a decided vote is applied, a deadline that passed is resolved. */ async housekeeping(room, now) {
        let changed = false;
        const expected = room.version;
        if (room.closedReason === null && (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["maybeTransferHost"])(room, now)) {
            changed = true;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('HOST_TRANSFERRED', {
                room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(room.id)
            });
        }
        if (room.vote) {
            const outcome = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["tallyVote"])(room, now);
            if (outcome !== 'OPEN') {
                const vote = room.vote;
                room.vote = null;
                changed = true;
                if (outcome === 'APPROVED') this.applyVote(room, vote, now);
                else (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addNotice"])(room, 'VOTE_CLOSED', outcome === 'EXPIRED' ? 'A votação expirou sem decisão.' : 'A votação foi recusada.', now);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('VOTE_RESOLVED', {
                    room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(room.id),
                    kind: vote.kind,
                    outcome
                });
            }
        }
        const bots = this.settleBots(room, now);
        if (bots.changed) changed = true;
        if (!changed) {
            this.armBotTimers(room.id, bots.timers);
            return room;
        }
        room.version = expected + 1;
        if (await this.repository.save(room, expected)) {
            this.armBotTimers(room.id, bots.timers);
            return room;
        }
        this.unplan(bots);
        return null;
    }
    applyVote(room, vote, now) {
        if (vote.kind === 'REMOVE' && vote.target) {
            if (!room.onGuard.includes(vote.target)) room.onGuard.push(vote.target);
            const name = room.seats.find((s)=>s.playerId === vote.target)?.name ?? 'Uma civilização';
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addNotice"])(room, 'SEAT_ON_GUARD', `${name} ficou EM GUARDA por votação.`, now);
            if (room.game) (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["runGuards"])(room);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('SEAT_ON_GUARD', {
                room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(room.id)
            });
        } else if (vote.kind === 'END') {
            room.closedReason = 'VOTE';
            room.deadline = null;
            room.suspended = false;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addNotice"])(room, 'GAME_CLOSED', 'A partida foi encerrada por votação.', now);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('GAME_CLOSED', {
                room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(room.id),
                by: 'vote'
            });
        }
    }
    async read(principal, id, now) {
        const loaded = await this.repository.find(id);
        if (!loaded) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'NOT_FOUND',
            message: 'Partida não encontrada.'
        });
        const seat = loaded.seats.find((s)=>s.guestId === principal.guestId);
        if (!seat) return forbidden();
        const touched = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$presence$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["touch"])(id, principal.guestId, now);
        if (touched.returned) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('PLAYER_RECONNECTED', {
                room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(id)
            });
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bus$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["publishAlphaEvent"])(id, {
                type: 'PRESENCE'
            });
        }
        // A V1.1 room is only displayed: no housekeeping, no expiry, no bot timers, nothing is written.
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isLegacyRoom"])(loaded)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(roomView(loaded, principal, now));
        const settled = await this.housekeeping(loaded, now);
        if (!settled) return conflict();
        const room = await this.expire(settled, now);
        return room ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(roomView(room, principal, now)) : conflict();
    }
    /** Dev playtest only: a person's UI moment goes to the local log. Never changes the game; answers ok either way so the client can tell whether it was recorded. */ async telemetry(principal, id, kind, detail) {
        const room = await this.repository.find(id);
        if (!room) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'NOT_FOUND',
            message: 'Partida não encontrada.'
        });
        const seat = room.seats.find((s)=>s.guestId === principal.guestId);
        if (!seat) return forbidden();
        const recorder = room.game && __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$playtest$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UI_KINDS"].includes(kind) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$playtest$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["playtestRecorderFor"])(room.id) : null;
        if (room.game && recorder) recorder.clientEvent(room.game, seat.playerId, kind, detail);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])({
            recorded: recorder !== null && room.game !== null && room.game !== undefined
        });
    }
    async lobby(principal, id, raw, now) {
        const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LobbyActionSchema"].safeParse(raw);
        if (!parsed.success) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'INVALID_INPUT',
            message: 'Decisão de lobby inválida.'
        });
        const room = await this.repository.find(id);
        if (!room) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'NOT_FOUND',
            message: 'Partida não encontrada.'
        });
        const seat = room.seats.find((s)=>s.guestId === principal.guestId);
        if (!seat) return forbidden();
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isLegacyRoom"])(room)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'LEGACY_ROOM',
            message: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LEGACY_ROOM_MESSAGE"]
        });
        if (room.closedReason !== null) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'LOBBY_CLOSED',
            message: 'Esta sala foi encerrada.'
        });
        if (room.game) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'LOBBY_CLOSED',
            message: 'A partida já começou.'
        });
        const command = parsed.data;
        if (room.version !== command.expectedVersion) return conflict();
        const isHost = room.hostGuestId === principal.guestId;
        let lobbyBots = {
            timers: [],
            changed: false,
            planned: []
        };
        if (command.type === 'CHOOSE_CIVILIZATION') {
            if (seat.ready) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'ALREADY_READY',
                message: 'Desmarque Pronto antes de trocar de civilização.'
            });
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$core10$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isCore10Chassis"])(command.civilization)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'INVALID_CHOICE',
                message: 'Escolha uma das dez civilizações disponíveis.'
            });
            if (room.seats.some((other)=>other !== seat && other.civilization === command.civilization)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'INVALID_CHOICE',
                message: 'Essa civilização já foi escolhida por outro lugar da mesa.'
            });
            // Picking a civilization offers its three Figuras; the one marked ★ (recommended for beginners) is selected until the player changes it.
            if (seat.civilization !== command.civilization) {
                seat.civilization = command.civilization;
                seat.figureId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$core10$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recommendedFigure"])(command.civilization)?.id ?? null;
            }
        } else if (command.type === 'CHOOSE_FIGURE') {
            if (seat.ready) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'ALREADY_READY',
                message: 'Desmarque Pronto antes de trocar de Figura.'
            });
            if (seat.civilization === null) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'INVALID_CHOICE',
                message: 'Escolha a civilização antes da Figura.'
            });
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["figuresOfCivilization"])(seat.civilization).some((figure)=>figure.id === command.figureId)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'INVALID_CHOICE',
                message: 'Essa Figura não pertence à sua civilização.'
            });
            seat.figureId = command.figureId;
        } else if (command.type === 'LOBBY_READY') seat.ready = command.ready;
        else if (command.type === 'KICK') {
            if (!isHost) return forbidden();
            const target = room.seats.find((s)=>s.playerId === command.playerId);
            if (!target || target.guestId === room.hostGuestId) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'INVALID_INPUT',
                message: 'Escolha outra pessoa para remover da sala.'
            });
            room.seats = room.seats.filter((s)=>s !== target);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addNotice"])(room, 'PLAYER_REMOVED', `${target.name} foi removido(a) da sala.`, now);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('PLAYER_REMOVED', {
                room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(room.id)
            });
        } else if (command.type === 'SET_SEATS') {
            if (!isHost) return forbidden();
            if (command.seatLimit > (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["maxSeats"])() || command.seatLimit < Math.max(2, room.seats.length)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'INVALID_INPUT',
                message: `Escolha entre ${Math.max(2, room.seats.length)} e ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["maxSeats"])()} lugares.`
            });
            room.seatLimit = command.seatLimit;
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mapSizeAllows"])(room.mapSize, room.seatLimit)) room.mapSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recommendedMapSize"])(room.seatLimit);
        } else if (command.type === 'SET_WORLD') {
            if (!isHost) return forbidden();
            const size = command.mapSize ?? room.mapSize;
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mapSizeAllows"])(size, room.seatLimit)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'INVALID_INPUT',
                message: 'Este tamanho de mapa não comporta esse número de lugares.'
            });
            room.mapSize = size;
            if (command.worldPreset) room.worldPreset = command.worldPreset;
        } else if (command.type === 'ADD_BOT') {
            if (!isHost) return forbidden();
            if (room.seats.length >= Math.min(room.seatLimit, (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["maxSeats"])())) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'LOBBY_FULL',
                message: 'Não há lugar vazio para um bot.'
            });
            const taken = new Set(room.seats.map((s)=>s.civilization)), playable = [
                ...__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$core10$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CORE10_CHASSIS"]
            ];
            const start = room.seed % playable.length, civilization = [
                ...playable.slice(start),
                ...playable.slice(0, start)
            ].find((id)=>!taken.has(id));
            if (!civilization) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'NO_CIVILIZATION',
                message: 'Nenhuma civilização livre para o bot.'
            });
            const botNumber = room.seats.filter((s)=>s.bot).length + 1;
            // Bots pick their Figura deterministically from the seed, so a replay of the same room draws the same table.
            const offered = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["figuresOfCivilization"])(civilization);
            room.seats.push({
                guestId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomUUID"])(),
                playerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PlayerIdSchema"].parse((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nextPlayerId"])(room)),
                name: `Bot ${botNumber}`,
                civilization,
                figureId: offered[(room.seed + room.seats.length) % offered.length]?.id ?? null,
                ready: true,
                bot: true,
                botPersona: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bot$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["botPersonaFor"])(room.seed, room.seats.length)
            });
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addNotice"])(room, 'BOT_ADDED', `Bot ${botNumber} entrou na sala.`, now);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('BOT_ADDED', {
                room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(room.id),
                seats: room.seats.length
            });
        } else if (command.type === 'REMOVE_BOT') {
            if (!isHost) return forbidden();
            const target = room.seats.find((s)=>s.playerId === command.playerId);
            if (!target || !target.bot) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'INVALID_INPUT',
                message: 'Só é possível remover bots por aqui.'
            });
            room.seats = room.seats.filter((s)=>s !== target);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addNotice"])(room, 'BOT_REMOVED', `${target.name} saiu da sala.`, now);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('BOT_REMOVED', {
                room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(room.id),
                seats: room.seats.length
            });
        } else if (command.type === 'CLOSE_ROOM') {
            if (!isHost) return forbidden();
            room.closedReason = 'HOST';
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addNotice"])(room, 'GAME_CLOSED', 'O anfitrião encerrou a sala.', now);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('GAME_CLOSED', {
                room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(room.id),
                by: 'host'
            });
        } else {
            if (!isHost) return forbidden();
            if (room.seats.length < 2 || room.seats.length > (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["maxSeats"])() || room.seats.every((s)=>s.bot) || room.seats.some((s)=>!s.ready || !s.civilization)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'NOT_READY',
                message: 'Pelo menos duas pessoas precisam escolher civilização e confirmar Pronto.'
            });
            const created = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createAlphaGame"])({
                gameId: room.id,
                seed: room.seed,
                privateSeed: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomBytes"])(32).toString('hex'),
                preset: room.preset,
                worldPreset: room.worldPreset,
                mapSize: room.mapSize,
                actionsPerRound: room.actionsPerRound,
                revealMap: room.revealMap,
                players: room.seats.map((s)=>({
                        id: s.playerId,
                        name: s.name,
                        civilization: s.civilization,
                        figureId: s.figureId
                    }))
            });
            // Dev-only test scenario (never in production): a legal Contact between the two nearest Pátrias, from the real proximity rule.
            if (process.env.ALPHA_FORCE_CONTACT === '1' && ("TURBOPACK compile-time value", "development") !== 'production') (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$scenario$2d$contact$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["forceContactSetup"])(created);
            room.game = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["beginAlphaPlanning"])(created);
            room.game.rules.planningSeconds = room.planningSeconds;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$playtest$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["playtestRecorderFor"])(room.id)?.start(room.game);
            room.deadline = room.planningSeconds ? now + room.planningSeconds * 1000 : null;
            lobbyBots = this.settleBots(room, now);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('GAME_STARTED', {
                room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(room.id),
                seats: room.seats.length,
                bots: room.seats.filter((s)=>s.bot).length
            });
        }
        room.version++;
        const valid = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaRoomSchema"].safeParse(room);
        if (!valid.success) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'INVALID_CHOICE',
            message: 'Escolha uma civilização disponível antes de confirmar Pronto.'
        });
        if (await this.repository.save(valid.data, command.expectedVersion)) {
            this.armBotTimers(room.id, lobbyBots.timers);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(roomView(valid.data, principal, now));
        }
        this.unplan(lobbyBots);
        return conflict();
    }
    async command(principal, id, raw, now) {
        const room = await this.repository.find(id);
        if (!room) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'NOT_FOUND',
            message: 'Partida não encontrada.'
        });
        const seat = room.seats.find((s)=>s.guestId === principal.guestId);
        if (!seat) return forbidden();
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isLegacyRoom"])(room)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'LEGACY_ROOM',
            message: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LEGACY_ROOM_MESSAGE"]
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$presence$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["touch"])(id, principal.guestId, now);
        if (!room.game) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'NOT_STARTED',
            message: 'Aguarde o início da partida.'
        });
        if (room.closedReason !== null) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'ROOM_CLOSED',
            message: 'A partida foi encerrada. A mesa fica disponível só para leitura.'
        });
        if (room.suspended) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'SUSPENDED',
            message: 'A partida está suspensa. O anfitrião precisa retomá-la.'
        });
        if (room.onGuard.includes(seat.playerId)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'ON_GUARD',
            message: 'Sua civilização está EM GUARDA. Reassuma o lugar para voltar a dar Ordens.'
        });
        if (room.deadline !== null && now >= room.deadline) {
            await this.expire(room, now);
            return conflict();
        }
        const previousPhase = room.game.phase, previousRound = room.game.core.round;
        let result;
        try {
            result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["applyAlphaCommand"])(room.game, seat.playerId, raw);
        } catch (cause) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('ENGINE_ERROR', {
                room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(room.id),
                name: cause instanceof Error ? cause.name : 'Error'
            });
            throw cause;
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$playtest$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["playtestRecorderFor"])(room.id)?.observe(room.game, seat.playerId, raw, result);
        if (!result.ok) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('COMMAND_REJECTED', {
                room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(room.id),
                code: result.error.code
            });
            return result;
        }
        const expected = room.version;
        room.game = result.value;
        room.version++;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["runGuards"])(room);
        const bots = this.settleBots(room, now);
        if (room.game.core.status === 'FINISHED') room.deadline = null;
        else if (room.planningSeconds && (previousPhase !== room.game.phase || previousRound !== room.game.core.round)) room.deadline = now + room.planningSeconds * 1000;
        if (await this.repository.save(room, expected)) {
            this.armBotTimers(room.id, bots.timers);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(roomView(room, principal, now));
        }
        this.unplan(bots);
        return conflict();
    }
    /** Room-level actions: leaving, suspending, voting, EM GUARDA, and the social reactions (which are never saved). */ cooldown = new Map();
    async roomAction(principal, id, raw, now) {
        const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RoomActionSchema"].safeParse(raw);
        if (!parsed.success) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'INVALID_INPUT',
            message: 'Ação de sala inválida.'
        });
        const room = await this.repository.find(id);
        if (!room) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'NOT_FOUND',
            message: 'Partida não encontrada.'
        });
        const seat = room.seats.find((s)=>s.guestId === principal.guestId);
        if (!seat) return forbidden();
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isLegacyRoom"])(room)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'LEGACY_ROOM',
            message: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LEGACY_ROOM_MESSAGE"]
        });
        const action = parsed.data, expected = room.version, isHost = room.hostGuestId === principal.guestId, life = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$room$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["lifecycleOf"])(room);
        if (action.type === 'LEAVE') {
            // "Sair e poder voltar": nothing about the seat or the civilization changes; only presence (and the host role, if this was the host).
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$presence$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["leave"])(id, principal.guestId, now);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('PLAYER_LEFT', {
                room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(id)
            });
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["maybeTransferHost"])(room, now)) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('HOST_TRANSFERRED', {
                    room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(id)
                });
                return this.commit(room, expected, principal, now);
            }
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(roomView(room, principal, now));
        }
        if (action.type === 'REACT' || action.type === 'PING') {
            if (life !== 'ACTIVE' && life !== 'SUSPENDED' && life !== 'LOBBY') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(roomView(room, principal, now));
            const last = this.cooldown.get(principal.guestId) ?? {
                reaction: 0,
                ping: 0
            }, kind = action.type === 'REACT' ? 'reaction' : 'ping', gap = kind === 'reaction' ? 1500 : 3000;
            if (now - last[kind] < gap) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(roomView(room, principal, now));
            this.cooldown.set(principal.guestId, {
                ...last,
                [kind]: now
            });
            if (this.cooldown.size > 2048) this.cooldown.clear();
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$bus$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["publishAlphaEvent"])(id, action.type === 'REACT' ? {
                type: 'REACTION',
                playerId: seat.playerId,
                reaction: action.reaction
            } : {
                type: 'PING',
                playerId: seat.playerId,
                hexId: action.hexId,
                reaction: action.reaction
            }, now);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(roomView(room, principal, now));
        }
        if (life === 'CLOSED' || life === 'FINISHED' || life === 'LOBBY') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'NOT_ACTIVE',
            message: 'Esta ação só existe numa partida em andamento.'
        });
        if (action.type === 'SUSPEND') {
            if (!isHost) return forbidden();
            if (room.suspended) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(roomView(room, principal, now));
            const safe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["safePoint"])(room);
            if (!safe.ok) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'NOT_SAFE_POINT',
                message: safe.reason
            });
            room.suspended = true;
            room.deadline = null;
            room.vote = null;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addNotice"])(room, 'GAME_SUSPENDED', 'Partida suspensa pelo anfitrião.', now);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('GAME_SUSPENDED', {
                room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(id),
                round: room.game?.core.round ?? 0
            });
        } else if (action.type === 'RESUME') {
            if (!room.suspended) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(roomView(room, principal, now));
            if (!isHost) return forbidden();
            room.suspended = false;
            room.deadline = room.planningSeconds ? now + room.planningSeconds * 1000 : null;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addNotice"])(room, 'GAME_RESUMED', 'Partida retomada.', now);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('GAME_RESUMED', {
                room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(id)
            });
        } else if (action.type === 'RESUME_SEAT') {
            if (!room.onGuard.includes(seat.playerId)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(roomView(room, principal, now));
            room.onGuard = room.onGuard.filter((p)=>p !== seat.playerId);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addNotice"])(room, 'SEAT_RESUMED', `${seat.name} reassumiu a civilização.`, now);
        } else if (room.suspended) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'SUSPENDED',
                message: 'A partida está suspensa.'
            });
        } else if (action.type === 'PROPOSE_REMOVE' || action.type === 'PROPOSE_END') {
            if (room.vote) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'VOTE_OPEN',
                message: 'Já existe uma votação em andamento.'
            });
            if (room.onGuard.includes(seat.playerId)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'ON_GUARD',
                message: 'Reassuma sua civilização para votar.'
            });
            let target = null;
            if (action.type === 'PROPOSE_REMOVE') {
                const found = room.seats.find((s)=>s.playerId === action.target);
                if (!found || found.playerId === seat.playerId || found.bot) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                    code: 'INVALID_INPUT',
                    message: 'Escolha outra civilização (bots não são removidos por votação).'
                });
                if (room.onGuard.includes(found.playerId)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                    code: 'ALREADY_ON_GUARD',
                    message: 'Essa civilização já está EM GUARDA.'
                });
                target = found.playerId;
            }
            room.vote = {
                id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomBytes"])(6).toString('hex'),
                kind: action.type === 'PROPOSE_REMOVE' ? 'REMOVE' : 'END',
                target,
                proposer: seat.playerId,
                yes: [
                    seat.playerId
                ],
                no: [],
                createdAt: now
            };
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addNotice"])(room, 'VOTE_OPENED', action.type === 'PROPOSE_REMOVE' ? `${seat.name} propôs colocar ${room.seats.find((s)=>s.playerId === target)?.name ?? 'uma civilização'} EM GUARDA.` : `${seat.name} propôs encerrar a partida.`, now);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('VOTE_OPENED', {
                room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(id),
                kind: room.vote.kind
            });
            const outcome = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["tallyVote"])(room, now);
            if (outcome === 'APPROVED') {
                const vote = room.vote;
                room.vote = null;
                this.applyVote(room, vote, now);
            }
        } else if (action.type === 'VOTE') {
            const vote = room.vote;
            if (!vote) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'NO_VOTE',
                message: 'Não há votação aberta.'
            });
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eligibleVoters"])(room, now).includes(seat.playerId)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'FORBIDDEN',
                message: 'Você não pode votar nesta votação.'
            });
            if (vote.yes.includes(seat.playerId) || vote.no.includes(seat.playerId)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(roomView(room, principal, now));
            (action.yes ? vote.yes : vote.no).push(seat.playerId);
            const outcome = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["tallyVote"])(room, now);
            if (outcome !== 'OPEN') {
                room.vote = null;
                if (outcome === 'APPROVED') this.applyVote(room, vote, now);
                else (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addNotice"])(room, 'VOTE_CLOSED', 'A votação foi recusada.', now);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLog"])('VOTE_RESOLVED', {
                    room: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$log$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["short"])(id),
                    kind: vote.kind,
                    outcome
                });
            }
        } else if (action.type === 'CANCEL_VOTE') {
            if (!room.vote || room.vote.proposer !== seat.playerId) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'FORBIDDEN',
                message: 'Só quem propôs pode cancelar.'
            });
            room.vote = null;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$lifecycle$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addNotice"])(room, 'VOTE_CLOSED', 'A votação foi cancelada.', now);
        }
        return this.commit(room, expected, principal, now);
    }
}
}),
"[project]/apps/server/dist/alpha-storage.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Where the alpha keeps its matches. Production is always PostgreSQL and can never be told otherwise: asking for memory there is an
 * error, not a fallback. Outside production the default is memory (zero configuration) and PostgreSQL is opt-in with
 * ALPHA_STORAGE=postgres.
 */ __turbopack_context__.s([
    "alphaStorageMode",
    ()=>alphaStorageMode
]);
function alphaStorageMode(env) {
    if (env.NODE_ENV === 'production') {
        if (env.ALPHA_STORAGE === 'memory') throw new Error('In-memory storage is not allowed in production.');
        return 'postgres';
    }
    return env.ALPHA_STORAGE === 'postgres' ? 'postgres' : 'memory';
}
}),
"[project]/apps/server/dist/game-service.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GameService",
    ()=>GameService,
    "playerView",
    ()=>playerView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/model.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$engine$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/engine.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/civilization.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/urban.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$maintenance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/maintenance.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$economy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/economy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared/dist/index.js [app-route] (ecmascript)");
;
;
;
function inspectYield(tile, state) {
    try {
        return {
            yield: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$economy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["tileYieldBreakdown"])(tile, state.config).total,
            yieldError: null
        };
    } catch (error) {
        if (error instanceof RangeError) return {
            yield: null,
            yieldError: error.message
        };
        throw error;
    }
}
function playerView(state, playerId, visibility = {
    visibleCityIds: [],
    knownGovernmentPlayerIds: []
}) {
    const player = state.players.find((entry)=>entry.id === playerId);
    if (!player) return null;
    let economy = null;
    let economyError = null;
    try {
        economy = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$maintenance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["maintainPlayer"])(player, state.config, state.round, state.version, state.map).economy;
    } catch (error) {
        if (error instanceof RangeError) economyError = error.message;
        else throw error;
    }
    const lastEconomicEvent = [
        ...state.eventLog
    ].reverse().find((event)=>event.type === 'RESOURCES_PRODUCED' && event.playerId === player.id && event.breakdown !== undefined);
    return structuredClone({
        gameId: state.gameId,
        version: state.version,
        round: state.round,
        era: state.era,
        phase: state.phase,
        status: state.status,
        playerCount: state.playerCount,
        player,
        pendingOrders: state.pendingOrders[playerId] ?? [],
        config: state.config,
        commandPoints: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["commandPoints"])(player.civilization, state.config),
        economyPreview: economy,
        economyError,
        lastEconomy: lastEconomicEvent?.type === 'RESOURCES_PRODUCED' ? {
            round: lastEconomicEvent.round,
            version: lastEconomicEvent.version,
            breakdown: lastEconomicEvent.breakdown
        } : null,
        cityInfrastructure: player.civilization.cities.map((city)=>({
                cityId: city.id,
                ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["infrastructureStats"])(city, state.config)
            })),
        visibleTerritory: state.map.filter((tile)=>tile.ownerId === playerId || visibility.visibleHexIds?.includes(tile.id)).map((tile)=>({
                id: tile.id,
                q: tile.q,
                r: tile.r,
                terrain: tile.terrain,
                features: tile.features,
                ownerId: tile.ownerId,
                controllerCityId: tile.controllerCityId,
                improvement: tile.improvement,
                ...inspectYield(tile, state)
            })),
        visibleCities: state.players.filter((owner)=>owner.id !== playerId).flatMap((owner)=>owner.civilization.cities.filter((city)=>visibility.visibleCityIds.includes(city.id)).map((city)=>({
                    id: city.id,
                    ownerId: city.ownerId,
                    hexId: city.hexId,
                    name: city.name,
                    population: visibility.hidePopulation ? null : city.population,
                    development: city.development,
                    specialization: city.specialization
                }))),
        knownGovernments: state.players.filter((owner)=>owner.id !== playerId && visibility.knownGovernmentPlayerIds.includes(owner.id)).map((owner)=>({
                playerId: owner.id,
                government: owner.civilization.government
            }))
    });
}
class GameService {
    repository;
    constructor(repository){
        this.repository = repository;
    }
    // Internal lobby entry point, not exposed as an unauthenticated HTTP handler.
    async create(input) {
        const created = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$engine$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createGame"])(input);
        if (!created.ok) return created;
        return await this.repository.create(created.value) ? created : (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'ALREADY_EXISTS',
            message: 'Game already exists'
        });
    }
    async submit(gameId, principal, input) {
        const command = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GameCommandSchema"].safeParse(input);
        if (!command.success) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'INVALID_INPUT',
            message: 'Invalid player command'
        });
        if (command.data.type === 'ADVANCE_PHASE') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'FORBIDDEN',
            message: 'Only the scheduler may advance phases'
        });
        const actor = command.data.type === 'SUBMIT_ORDER' ? command.data.order.playerId : command.data.playerId;
        if (actor !== principal.playerId) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'FORBIDDEN',
            message: 'Players may submit only their own commands'
        });
        const state = await this.repository.find(gameId);
        if (!state) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'NOT_FOUND',
            message: 'Unknown game'
        });
        const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$engine$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyCommand"])(state, command.data);
        if (!result.ok) return result;
        if (!await this.repository.save(result.value, state.version)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'VERSION_CONFLICT',
            message: 'Concurrent update; reload before retrying'
        });
        const view = playerView(result.value, principal.playerId);
        return view ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(view) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'FORBIDDEN',
            message: 'Player is not in game'
        });
    }
    // Scheduler/admin capability. A future HTTP/WS adapter MUST NOT expose this to players.
    async advance(gameId, phase, expectedVersion) {
        const state = await this.repository.find(gameId);
        if (!state) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'NOT_FOUND',
            message: 'Unknown game'
        });
        const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$engine$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyCommand"])(state, {
            type: 'ADVANCE_PHASE',
            nextPhase: phase,
            expectedVersion
        });
        if (!result.ok) return result;
        return await this.repository.save(result.value, state.version) ? result : (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'VERSION_CONFLICT',
            message: 'Concurrent update; reload before retrying'
        });
    }
}
}),
"[project]/apps/server/dist/generated/prisma/client.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PrismaClient",
    ()=>PrismaClient
]);
/* !!! This is code generated by Prisma. Do not edit directly. !!! */ /* eslint-disable */ // biome-ignore-all lint: generated file
// @ts-nocheck 
/*
 * This file should be your main import to use Prisma. Through it you get access to all the models, enums, and input types.
 * If you're looking for something you can import in the client-side of your application, please refer to the `browser.ts` file instead.
 *
 * 🟢 You can import this file directly.
 */ var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$process__$5b$external$5d$__$28$node$3a$process$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:process [external] (node:process, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$url__$5b$external$5d$__$28$node$3a$url$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:url [external] (node:url, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client/runtime/client [external] (@prisma/client/runtime/client, cjs, [project]/node_modules/@prisma/client)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$generated$2f$prisma$2f$internal$2f$class$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/generated/prisma/internal/class.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$generated$2f$prisma$2f$internal$2f$prismaNamespace$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/generated/prisma/internal/prismaNamespace.js [app-route] (ecmascript)");
var __TURBOPACK__import$2e$meta__ = {
    get url () {
        return __turbopack_context__.F("apps/server/dist/generated/prisma/client.js");
    },
    env: {
        DEV: true,
        PROD: false,
        MODE: "development",
        BASE_URL: "/",
        SSR: true
    },
    get turbopackHot () {
        return __turbopack_context__.m.hot;
    }
};
;
;
;
globalThis['__dirname'] = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["dirname"]((0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$url__$5b$external$5d$__$28$node$3a$url$2c$__cjs$29$__["fileURLToPath"])(__TURBOPACK__import$2e$meta__.url));
;
;
;
;
;
;
const PrismaClient = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$generated$2f$prisma$2f$internal$2f$class$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getPrismaClientClass"]();
;
}),
"[project]/apps/server/dist/generated/prisma/internal/class.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getPrismaClientClass",
    ()=>getPrismaClientClass
]);
/* !!! This is code generated by Prisma. Do not edit directly. !!! */ /* eslint-disable */ // biome-ignore-all lint: generated file
// @ts-nocheck 
/*
 * WARNING: This is an internal file that is subject to change!
 *
 * 🛑 Under no circumstances should you import this file directly! 🛑
 *
 * Please import the `PrismaClient` class from the `client.ts` file instead.
 */ var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client/runtime/client [external] (@prisma/client/runtime/client, cjs, [project]/node_modules/@prisma/client)");
;
const config = {
    "previewFeatures": [],
    "clientVersion": "7.10.0",
    "engineVersion": "0edf323efd1d98336f3f0a68684b56f689b900d3",
    "activeProvider": "postgresql",
    "inlineSchema": "generator client {\n  provider     = \"prisma-client\"\n  output       = \"../apps/server/src/generated/prisma\"\n  moduleFormat = \"esm\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n}\n\nmodel Game {\n  id       String @id\n  version  BigInt\n  snapshot Json\n}\n\nmodel AlphaMatch {\n  id        String   @id\n  joinCode  String   @unique\n  version   BigInt\n  status    String\n  snapshot  Json\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n\n/// Original snapshots preserved before an in-place migration rewrites a match. Additive; never updated or deleted by the app.\nmodel AlphaMatchArchive {\n  id         String   @id @default(uuid())\n  matchId    String\n  version    BigInt\n  reason     String\n  snapshot   Json\n  archivedAt DateTime @default(now())\n\n  @@unique([matchId, version])\n  @@index([matchId])\n}\n",
    "runtimeDataModel": {
        "models": {},
        "enums": {},
        "types": {}
    },
    "parameterizationSchema": {
        "strings": [],
        "graph": ""
    }
};
config.runtimeDataModel = JSON.parse("{\"models\":{\"Game\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"version\",\"kind\":\"scalar\",\"type\":\"BigInt\"},{\"name\":\"snapshot\",\"kind\":\"scalar\",\"type\":\"Json\"}],\"dbName\":null,\"schema\":null},\"AlphaMatch\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"joinCode\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"version\",\"kind\":\"scalar\",\"type\":\"BigInt\"},{\"name\":\"status\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"snapshot\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null,\"schema\":null},\"AlphaMatchArchive\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"matchId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"version\",\"kind\":\"scalar\",\"type\":\"BigInt\"},{\"name\":\"reason\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"snapshot\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"archivedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null,\"schema\":null}},\"enums\":{},\"types\":{}}");
config.parameterizationSchema = {
    strings: JSON.parse("[\"where\",\"Game.findUnique\",\"Game.findUniqueOrThrow\",\"orderBy\",\"cursor\",\"Game.findFirst\",\"Game.findFirstOrThrow\",\"Game.findMany\",\"data\",\"Game.createOne\",\"Game.createMany\",\"Game.createManyAndReturn\",\"Game.updateOne\",\"Game.updateMany\",\"Game.updateManyAndReturn\",\"create\",\"update\",\"Game.upsertOne\",\"Game.deleteOne\",\"Game.deleteMany\",\"having\",\"_count\",\"_avg\",\"_sum\",\"_min\",\"_max\",\"Game.groupBy\",\"Game.aggregate\",\"AlphaMatch.findUnique\",\"AlphaMatch.findUniqueOrThrow\",\"AlphaMatch.findFirst\",\"AlphaMatch.findFirstOrThrow\",\"AlphaMatch.findMany\",\"AlphaMatch.createOne\",\"AlphaMatch.createMany\",\"AlphaMatch.createManyAndReturn\",\"AlphaMatch.updateOne\",\"AlphaMatch.updateMany\",\"AlphaMatch.updateManyAndReturn\",\"AlphaMatch.upsertOne\",\"AlphaMatch.deleteOne\",\"AlphaMatch.deleteMany\",\"AlphaMatch.groupBy\",\"AlphaMatch.aggregate\",\"AlphaMatchArchive.findUnique\",\"AlphaMatchArchive.findUniqueOrThrow\",\"AlphaMatchArchive.findFirst\",\"AlphaMatchArchive.findFirstOrThrow\",\"AlphaMatchArchive.findMany\",\"AlphaMatchArchive.createOne\",\"AlphaMatchArchive.createMany\",\"AlphaMatchArchive.createManyAndReturn\",\"AlphaMatchArchive.updateOne\",\"AlphaMatchArchive.updateMany\",\"AlphaMatchArchive.updateManyAndReturn\",\"AlphaMatchArchive.upsertOne\",\"AlphaMatchArchive.deleteOne\",\"AlphaMatchArchive.deleteMany\",\"AlphaMatchArchive.groupBy\",\"AlphaMatchArchive.aggregate\",\"AND\",\"OR\",\"NOT\",\"id\",\"matchId\",\"version\",\"reason\",\"snapshot\",\"archivedAt\",\"equals\",\"in\",\"notIn\",\"lt\",\"lte\",\"gt\",\"gte\",\"not\",\"string_contains\",\"string_starts_with\",\"string_ends_with\",\"array_starts_with\",\"array_ends_with\",\"array_contains\",\"contains\",\"startsWith\",\"endsWith\",\"matchId_version\",\"joinCode\",\"status\",\"createdAt\",\"updatedAt\",\"set\",\"increment\",\"decrement\",\"multiply\",\"divide\"]"),
    graph: "dR8wBjwAAGMAMD0AAAQAED4AAGMAMD8BAAAAAUEEAFwAIUMAAF0AIAEAAAABACABAAAAAQAgBjwAAGMAMD0AAAQAED4AAGMAMD8BAFsAIUEEAFwAIUMAAF0AIAADAAAABAAgAwAABQAwBAAAAQAgAwAAAAQAIAMAAAUAMAQAAAEAIAMAAAAEACADAAAFADAEAAABACADPwEAAAABQQQAAAABQ4AAAAABAQgAAAkAIAM_AQAAAAFBBAAAAAFDgAAAAAEBCAAACwAwAQgAAAsAMAM_AQBpACFBBABqACFDgAAAAAECAAAAAQAgCAAADgAgAz8BAGkAIUEEAGoAIUOAAAAAAQIAAAAEACAIAAAQACACAAAABAAgCAAAEAAgAwAAAAEAIA8AAAkAIBAAAA4AIAEAAAABACABAAAABAAgBRUAAHEAIBYAAHIAIBcAAHUAIBgAAHQAIBkAAHMAIAY8AABiADA9AAAXABA-AABiADA_AQBNACFBBABOACFDAABPACADAAAABAAgAwAAFgAwFAAAFwAgAwAAAAQAIAMAAAUAMAQAAAEAIAo8AABhADA9AAAdABA-AABhADA_AQAAAAFBBABcACFDAABdACBXAQAAAAFYAQBbACFZQABeACFaQABeACEBAAAAGgAgAQAAABoAIAo8AABhADA9AAAdABA-AABhADA_AQBbACFBBABcACFDAABdACBXAQBbACFYAQBbACFZQABeACFaQABeACEAAwAAAB0AIAMAAB4AMAQAABoAIAMAAAAdACADAAAeADAEAAAaACADAAAAHQAgAwAAHgAwBAAAGgAgBz8BAAAAAUEEAAAAAUOAAAAAAVcBAAAAAVgBAAAAAVlAAAAAAVpAAAAAAQEIAAAiACAHPwEAAAABQQQAAAABQ4AAAAABVwEAAAABWAEAAAABWUAAAAABWkAAAAABAQgAACQAMAEIAAAkADAHPwEAaQAhQQQAagAhQ4AAAAABVwEAaQAhWAEAaQAhWUAAawAhWkAAawAhAgAAABoAIAgAACcAIAc_AQBpACFBBABqACFDgAAAAAFXAQBpACFYAQBpACFZQABrACFaQABrACECAAAAHQAgCAAAKQAgAgAAAB0AIAgAACkAIAMAAAAaACAPAAAiACAQAAAnACABAAAAGgAgAQAAAB0AIAUVAABsACAWAABtACAXAABwACAYAABvACAZAABuACAKPAAAYAAwPQAAMAAQPgAAYAAwPwEATQAhQQQATgAhQwAATwAgVwEATQAhWAEATQAhWUAAUAAhWkAAUAAhAwAAAB0AIAMAAC8AMBQAADAAIAMAAAAdACADAAAeADAEAAAaACAKPAAAWgAwPQAANgAQPgAAWgAwPwEAAAABQAEAWwAhQQQAXAAhQgEAWwAhQwAAXQAgREAAXgAhVgAAXwAgAQAAADMAIAEAAAAzACAJPAAAWgAwPQAANgAQPgAAWgAwPwEAWwAhQAEAWwAhQQQAXAAhQgEAWwAhQwAAXQAgREAAXgAhAAMAAAA2ACADAAA3ADAEAAAzACADAAAANgAgAwAANwAwBAAAMwAgAwAAADYAIAMAADcAMAQAADMAIAY_AQAAAAFAAQAAAAFBBAAAAAFCAQAAAAFDgAAAAAFEQAAAAAEBCAAAOwAgBj8BAAAAAUABAAAAAUEEAAAAAUIBAAAAAUOAAAAAAURAAAAAAQEIAAA9ADABCAAAPQAwBj8BAGkAIUABAGkAIUEEAGoAIUIBAGkAIUOAAAAAAURAAGsAIQIAAAAzACAIAABAACAGPwEAaQAhQAEAaQAhQQQAagAhQgEAaQAhQ4AAAAABREAAawAhAgAAADYAIAgAAEIAIAIAAAA2ACAIAABCACADAAAAMwAgDwAAOwAgEAAAQAAgAQAAADMAIAEAAAA2ACAFFQAAZAAgFgAAZQAgFwAAaAAgGAAAZwAgGQAAZgAgCTwAAEwAMD0AAEkAED4AAEwAMD8BAE0AIUABAE0AIUEEAE4AIUIBAE0AIUMAAE8AIERAAFAAIQMAAAA2ACADAABIADAUAABJACADAAAANgAgAwAANwAwBAAAMwAgCTwAAEwAMD0AAEkAED4AAEwAMD8BAE0AIUABAE0AIUEEAE4AIUIBAE0AIUMAAE8AIERAAFAAIQ4VAABSACAYAABZACAZAABZACBFAQAAAAFGAQAAAARHAQAAAARIAQAAAAFJAQAAAAFKAQAAAAFLAQAAAAFMAQBYACFTAQAAAAFUAQAAAAFVAQAAAAENFQAAUgAgFgAAVgAgFwAAVwAgGAAAVwAgGQAAVwAgRQQAAAABRgQAAAAERwQAAAAESAQAAAABSQQAAAABSgQAAAABSwQAAAABTAQAVQAhDxUAAFIAIBgAAFQAIBkAAFQAIEWAAAAAAUiAAAAAAUmAAAAAAUqAAAAAAUuAAAAAAUyAAAAAAU0BAAAAAU4BAAAAAU8BAAAAAVCAAAAAAVGAAAAAAVKAAAAAAQsVAABSACAYAABTACAZAABTACBFQAAAAAFGQAAAAARHQAAAAARIQAAAAAFJQAAAAAFKQAAAAAFLQAAAAAFMQABRACELFQAAUgAgGAAAUwAgGQAAUwAgRUAAAAABRkAAAAAER0AAAAAESEAAAAABSUAAAAABSkAAAAABS0AAAAABTEAAUQAhCEUCAAAAAUYCAAAABEcCAAAABEgCAAAAAUkCAAAAAUoCAAAAAUsCAAAAAUwCAFIAIQhFQAAAAAFGQAAAAARHQAAAAARIQAAAAAFJQAAAAAFKQAAAAAFLQAAAAAFMQABTACEMRYAAAAABSIAAAAABSYAAAAABSoAAAAABS4AAAAABTIAAAAABTQEAAAABTgEAAAABTwEAAAABUIAAAAABUYAAAAABUoAAAAABDRUAAFIAIBYAAFYAIBcAAFcAIBgAAFcAIBkAAFcAIEUEAAAAAUYEAAAABEcEAAAABEgEAAAAAUkEAAAAAUoEAAAAAUsEAAAAAUwEAFUAIQhFCAAAAAFGCAAAAARHCAAAAARICAAAAAFJCAAAAAFKCAAAAAFLCAAAAAFMCABWACEIRQQAAAABRgQAAAAERwQAAAAESAQAAAABSQQAAAABSgQAAAABSwQAAAABTAQAVwAhDhUAAFIAIBgAAFkAIBkAAFkAIEUBAAAAAUYBAAAABEcBAAAABEgBAAAAAUkBAAAAAUoBAAAAAUsBAAAAAUwBAFgAIVMBAAAAAVQBAAAAAVUBAAAAAQtFAQAAAAFGAQAAAARHAQAAAARIAQAAAAFJAQAAAAFKAQAAAAFLAQAAAAFMAQBZACFTAQAAAAFUAQAAAAFVAQAAAAEJPAAAWgAwPQAANgAQPgAAWgAwPwEAWwAhQAEAWwAhQQQAXAAhQgEAWwAhQwAAXQAgREAAXgAhC0UBAAAAAUYBAAAABEcBAAAABEgBAAAAAUkBAAAAAUoBAAAAAUsBAAAAAUwBAFkAIVMBAAAAAVQBAAAAAVUBAAAAAQhFBAAAAAFGBAAAAARHBAAAAARIBAAAAAFJBAAAAAFKBAAAAAFLBAAAAAFMBABXACEMRYAAAAABSIAAAAABSYAAAAABSoAAAAABS4AAAAABTIAAAAABTQEAAAABTgEAAAABTwEAAAABUIAAAAABUYAAAAABUoAAAAABCEVAAAAAAUZAAAAABEdAAAAABEhAAAAAAUlAAAAAAUpAAAAAAUtAAAAAAUxAAFMAIQJAAQAAAAFBBAAAAAEKPAAAYAAwPQAAMAAQPgAAYAAwPwEATQAhQQQATgAhQwAATwAgVwEATQAhWAEATQAhWUAAUAAhWkAAUAAhCjwAAGEAMD0AAB0AED4AAGEAMD8BAFsAIUEEAFwAIUMAAF0AIFcBAFsAIVgBAFsAIVlAAF4AIVpAAF4AIQY8AABiADA9AAAXABA-AABiADA_AQBNACFBBABOACFDAABPACAGPAAAYwAwPQAABAAQPgAAYwAwPwEAWwAhQQQAXAAhQwAAXQAgAAAAAAABWwEAAAABBVsEAAAAAVwEAAAAAV0EAAAAAV4EAAAAAV8EAAAAAQFbQAAAAAEAAAAAAAAAAAAAAAAAAAUVAAYWAAcXAAgYAAkZAAoAAAAAAAUVAAYWAAcXAAgYAAkZAAoAAAAFFQAQFgARFwASGAATGQAUAAAAAAAFFQAQFgARFwASGAATGQAUAAAABRUAGhYAGxcAHBgAHRkAHgAAAAAABRUAGhYAGxcAHBgAHRkAHgECAQIDAQUGAQYHAQcIAQkKAQoMAgsNAwwPAQ0RAg4SBBETARIUARMVAhoYBRsZCxwbDB0cDB4fDB8gDCAhDCEjDCIlAiMmDSQoDCUqAiYrDicsDCgtDCkuAioxDysyFSw0Fi01Fi44Fi85FjA6FjE8FjI-AjM_FzRBFjVDAjZEGDdFFjhGFjlHAjpKGTtLHw"
};
async function decodeBase64AsWasm(wasmBase64) {
    const { Buffer } = await __turbopack_context__.A("[externals]/node:buffer [external] (node:buffer, cjs, async loader)");
    const wasmArray = Buffer.from(wasmBase64, 'base64');
    return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
    getRuntime: async ()=>await __turbopack_context__.A("[externals]/@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs [external] (@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs, esm_import, [project]/node_modules/@prisma/client, async loader)"),
    getQueryCompilerWasmModule: async ()=>{
        const { wasm } = await __turbopack_context__.A("[externals]/@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs [external] (@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs, esm_import, [project]/node_modules/@prisma/client, async loader)");
        return await decodeBase64AsWasm(wasm);
    },
    importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
    return __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["getPrismaClient"](config);
}
}),
"[project]/apps/server/dist/generated/prisma/internal/prismaNamespace.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AlphaMatchArchiveScalarFieldEnum",
    ()=>AlphaMatchArchiveScalarFieldEnum,
    "AlphaMatchScalarFieldEnum",
    ()=>AlphaMatchScalarFieldEnum,
    "AnyNull",
    ()=>AnyNull,
    "DbNull",
    ()=>DbNull,
    "Decimal",
    ()=>Decimal,
    "GameScalarFieldEnum",
    ()=>GameScalarFieldEnum,
    "JsonNull",
    ()=>JsonNull,
    "JsonNullValueFilter",
    ()=>JsonNullValueFilter,
    "JsonNullValueInput",
    ()=>JsonNullValueInput,
    "ModelName",
    ()=>ModelName,
    "NullTypes",
    ()=>NullTypes,
    "PrismaClientInitializationError",
    ()=>PrismaClientInitializationError,
    "PrismaClientKnownRequestError",
    ()=>PrismaClientKnownRequestError,
    "PrismaClientRustPanicError",
    ()=>PrismaClientRustPanicError,
    "PrismaClientUnknownRequestError",
    ()=>PrismaClientUnknownRequestError,
    "PrismaClientValidationError",
    ()=>PrismaClientValidationError,
    "QueryMode",
    ()=>QueryMode,
    "SortOrder",
    ()=>SortOrder,
    "Sql",
    ()=>Sql,
    "TransactionIsolationLevel",
    ()=>TransactionIsolationLevel,
    "defineExtension",
    ()=>defineExtension,
    "empty",
    ()=>empty,
    "getExtensionContext",
    ()=>getExtensionContext,
    "join",
    ()=>join,
    "prismaVersion",
    ()=>prismaVersion,
    "raw",
    ()=>raw,
    "sql",
    ()=>sql
]);
/* !!! This is code generated by Prisma. Do not edit directly. !!! */ /* eslint-disable */ // biome-ignore-all lint: generated file
// @ts-nocheck 
/*
 * WARNING: This is an internal file that is subject to change!
 *
 * 🛑 Under no circumstances should you import this file directly! 🛑
 *
 * All exports from this file are wrapped under a `Prisma` namespace object in the client.ts file.
 * While this enables partial backward compatibility, it is not part of the stable public API.
 *
 * If you are looking for your Models, Enums, and Input Types, please import them from the respective
 * model files in the `model` directory!
 */ var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client/runtime/client [external] (@prisma/client/runtime/client, cjs, [project]/node_modules/@prisma/client)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$generated$2f$prisma$2f$internal$2f$class$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/generated/prisma/internal/class.js [app-route] (ecmascript)");
;
;
const PrismaClientKnownRequestError = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClientKnownRequestError"];
const PrismaClientUnknownRequestError = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClientUnknownRequestError"];
const PrismaClientRustPanicError = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClientRustPanicError"];
const PrismaClientInitializationError = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClientInitializationError"];
const PrismaClientValidationError = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClientValidationError"];
const sql = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["sqltag"];
const empty = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["empty"];
const join = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["join"];
const raw = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["raw"];
const Sql = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["Sql"];
const Decimal = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["Decimal"];
const getExtensionContext = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["Extensions"].getExtensionContext;
const prismaVersion = {
    client: "7.10.0",
    engine: "0edf323efd1d98336f3f0a68684b56f689b900d3"
};
const NullTypes = {
    DbNull: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["NullTypes"].DbNull,
    JsonNull: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["NullTypes"].JsonNull,
    AnyNull: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["NullTypes"].AnyNull
};
const DbNull = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["DbNull"];
const JsonNull = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["JsonNull"];
const AnyNull = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["AnyNull"];
const ModelName = {
    Game: 'Game',
    AlphaMatch: 'AlphaMatch',
    AlphaMatchArchive: 'AlphaMatchArchive'
};
const TransactionIsolationLevel = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["makeStrictEnum"]({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
const GameScalarFieldEnum = {
    id: 'id',
    version: 'version',
    snapshot: 'snapshot'
};
const AlphaMatchScalarFieldEnum = {
    id: 'id',
    joinCode: 'joinCode',
    version: 'version',
    status: 'status',
    snapshot: 'snapshot',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
const AlphaMatchArchiveScalarFieldEnum = {
    id: 'id',
    matchId: 'matchId',
    version: 'version',
    reason: 'reason',
    snapshot: 'snapshot',
    archivedAt: 'archivedAt'
};
const SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
const JsonNullValueInput = {
    JsonNull: JsonNull
};
const QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
const JsonNullValueFilter = {
    DbNull: DbNull,
    JsonNull: JsonNull,
    AnyNull: AnyNull
};
const defineExtension = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client$2f$runtime$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2f$runtime$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["Extensions"].defineExtension;
}),
"[project]/apps/server/dist/generated/prisma/internal/prismaNamespace.js [app-route] (ecmascript) <export * as Prisma>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Prisma",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$generated$2f$prisma$2f$internal$2f$prismaNamespace$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$generated$2f$prisma$2f$internal$2f$prismaNamespace$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/generated/prisma/internal/prismaNamespace.js [app-route] (ecmascript)");
}),
"[project]/apps/server/dist/guest-session.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GuestSessions",
    ()=>GuestSessions
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
;
const lifetimeSeconds = 90 * 24 * 60 * 60;
class GuestSessions {
    secret;
    constructor(secret){
        this.secret = secret;
        if (Buffer.byteLength(secret) < 32) throw new Error('ALPHA_SESSION_SECRET must contain at least 32 bytes.');
    }
    signature(payload) {
        return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["createHmac"])('sha256', this.secret).update(payload).digest('base64url');
    }
    issue(now) {
        const guestId = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomUUID"])(), payload = `${guestId}.${Math.floor(now / 1000) + lifetimeSeconds}`;
        return {
            token: `${payload}.${this.signature(payload)}`,
            principal: {
                guestId
            },
            maxAge: lifetimeSeconds
        };
    }
    resolve(token, now) {
        if (!token || token.length > 180) return null;
        const match = /^([a-f0-9-]{36})\.(\d{1,12})\.([A-Za-z0-9_-]{43})$/.exec(token);
        if (!match) return null;
        const [, guestId, expires, signature] = match;
        if (!guestId || !expires || !signature || Number(expires) <= Math.floor(now / 1000)) return null;
        const expected = Buffer.from(this.signature(`${guestId}.${expires}`)), actual = Buffer.from(signature);
        if (actual.length !== expected.length || !(0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["timingSafeEqual"])(actual, expected)) return null;
        return {
            guestId
        };
    }
}
}),
"[project]/apps/server/dist/playtest-log.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FileSink",
    ()=>FileSink,
    "MemorySink",
    ()=>MemorySink,
    "PlaytestRecorder",
    ()=>PlaytestRecorder,
    "UI_KINDS",
    ()=>UI_KINDS,
    "availableActions",
    ()=>availableActions,
    "playtestEnabled",
    ()=>playtestEnabled,
    "playtestRecorderFor",
    ()=>playtestRecorderFor,
    "summarizeCommand",
    ()=>summarizeCommand
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-actions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$unit$2d$options$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-unit-options.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-threats.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-world.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-urban.js [app-route] (ecmascript)");
;
;
;
const playtestEnabled = (env = process.env)=>env.ALPHA_PLAYTEST_LOG === '1' && env.NODE_ENV !== 'production';
class FileSink {
    dir;
    file;
    constructor(dir){
        this.dir = dir;
        (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["mkdirSync"])(dir, {
            recursive: true
        });
        this.file = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["join"])(dir, 'events.jsonl');
    }
    write(event) {
        (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["appendFileSync"])(this.file, `${JSON.stringify(event)}\n`);
    }
}
class MemorySink {
    events = [];
    write(event) {
        this.events.push(event);
    }
}
const RESOURCE_KEYS = [
    'food',
    'wood',
    'stone',
    'metal',
    'wealth',
    'knowledge',
    'influence',
    'culture'
];
const stockOf = (state, seat)=>Object.fromEntries(RESOURCE_KEYS.map((key)=>[
            key,
            state.players.find((p)=>p.playerId === seat)?.resources?.[key] ?? 0
        ]));
const seatOf = (state, seat)=>state.core.players.find((p)=>p.id === seat);
const populationOf = (state, seat)=>seatOf(state, seat).civilization.cities.reduce((n, c)=>n + c.population, 0);
const levelsOf = (state, seat)=>Object.fromEntries(state.cities.filter((c)=>c.currentOwnerId === seat).map((c)=>[
            c.cityId,
            c.level
        ]));
const pairKey = (a, b)=>[
        a,
        b
    ].sort().join('~');
function summarizeCommand(raw) {
    const command = raw ?? {};
    const pick = {
        type: command.type
    };
    for (const key of [
        'action',
        'unit',
        'advancementId',
        'cityId',
        'cardId',
        'path',
        'posture',
        'choice',
        'choiceId',
        'optionId',
        'treaty',
        'targetId',
        'recipientId',
        'peopleId',
        'unitId',
        'fleetId',
        'hexId',
        'government',
        'ambitionId'
    ])if (command[key] !== undefined) pick[key] = command[key];
    if (command.count !== undefined) pick.count = command.count;
    if (command.type === 'SET_CASUALTY_PRIORITY') {
        pick.casualtyOrder = Array.isArray(command.order) ? command.order.filter((kind)=>typeof kind === 'string').slice(0, 10) : undefined;
        pick.hexId = command.hexId ?? null;
    }
    if (command.build && typeof command.build === 'object') pick.build = command.build;
    if (command.type === 'QUEUE_ORDER') {
        const order = command.order ?? {};
        pick.order = {
            type: order.type,
            target: order.target,
            posture: order.posture,
            units: Array.isArray(order.unitIds) ? order.unitIds.length : undefined
        };
    }
    if (command.type === 'MANAGE') pick.manage = command.command?.type;
    return pick;
}
function availableActions(state, seat) {
    const urban = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["urbanOptions"])(state, seat);
    const open = (list)=>list.filter((option)=>!option.blocked).length;
    const cityActions = Object.values(urban.cities).reduce((n, list)=>n + open(list), 0);
    const units = Object.values((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$unit$2d$options$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaUnitOptions"])(state, seat));
    const claims = Object.values((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$unit$2d$options$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaClaimOptions"])(state, seat)).reduce((n, list)=>n + list.length, 0);
    const usage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaActionUsage"])(state, seat);
    return {
        cityActions,
        research: open(urban.research),
        moves: units.reduce((n, u)=>n + Object.keys(u.moves).length, 0),
        explore: units.reduce((n, u)=>n + u.explore.length, 0),
        settle: units.filter((u)=>u.settleBlock === null).length,
        claims,
        orders: {
            limit: usage.limit,
            used: usage.used
        }
    };
}
const UI_KINDS = [
    'panel_open',
    'panel_close',
    'decision_shown',
    'decision_done',
    'era_turn_shown',
    'planning_idle',
    'casualty_panel',
    'diplomacy_panel'
];
class PlaytestRecorder {
    sink;
    clock;
    seq = 0;
    openedAt = new Map();
    stockAtOpen = new Map();
    seenWars = new Set();
    seenContacts = new Set();
    seenTreaties = new Map();
    roundLogSeen = 0;
    battlesSeen = 0;
    eventsSeen = 0;
    started = false;
    constructor(sink, clock = Date.now){
        this.sink = sink;
        this.clock = clock;
    }
    emit(state, type, fields) {
        this.sink.write({
            seq: ++this.seq,
            t: this.clock(),
            type,
            round: state.core.round,
            phase: state.phase,
            ...fields
        });
    }
    /** Call once with the opening state (round 1, PLANNING). */ start(state) {
        if (this.started) return;
        this.started = true;
        this.roundLogSeen = state.telemetry.roundLog.length;
        this.battlesSeen = state.battles.length;
        this.eventsSeen = state.events.length;
        this.emit(state, 'session_start', {
            preset: state.rules.preset,
            worldPreset: state.rules.worldPreset,
            mapSize: state.rules.mapSize,
            seed: state.telemetry.seed,
            rulesVersion: state.rulesVersion,
            seats: state.players.map((p)=>({
                    seat: p.playerId,
                    civilization: p.civilization,
                    figure: p.leader?.leaderId ?? null
                }))
        });
        for (const t of state.treaties)this.seenTreaties.set(t.id, t.status);
        for (const w of state.wars)this.seenWars.add(pairKey(w[0], w[1]));
        this.openRound(state);
    }
    openRound(state) {
        this.openedAt.set(state.core.round, this.clock());
        for (const p of state.players){
            const stock = stockOf(state, p.playerId);
            this.stockAtOpen.set(`${state.core.round}:${p.playerId}`, stock);
            const view = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatView"])(state, p.playerId);
            this.emit(state, 'planning_open', {
                seat: p.playerId,
                available: availableActions(state, p.playerId),
                stock,
                population: populationOf(state, p.playerId),
                levels: levelsOf(state, p.playerId),
                threatsVisible: Array.isArray(view) ? view.length : 0,
                threatAlerts: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatAlerts"])(state, p.playerId).length
            });
        }
    }
    /** Observe one command result. `before` is the state the command was applied to; `result` is what applyAlphaCommand returned. */ observe(before, seat, raw, result) {
        if (!this.started) this.start(before);
        if (!result.ok) {
            this.emit(before, 'rejected', {
                seat,
                command: summarizeCommand(raw),
                code: result.error.code,
                message: result.error.message
            });
            return;
        }
        const after = result.value, summary = summarizeCommand(raw);
        this.emit(before, 'command', {
            seat,
            command: summary
        });
        if (summary.type === 'READY') this.emit(before, 'ready', {
            seat,
            planningMs: this.clock() - (this.openedAt.get(before.core.round) ?? this.clock()),
            orders: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaActionUsage"])(before, seat).byOrder
        });
        this.diff(before, after);
    }
    /** A human-side moment (panel opened, decision shown/answered). Detail is a short token like a panel name, never player text. */ clientEvent(state, seat, kind, detail) {
        if (!this.started) this.start(state);
        this.emit(state, 'ui', {
            seat,
            kind,
            detail: detail.replace(/[^a-z0-9:_-]/gi, '').slice(0, 40),
            sinceOpenMs: this.clock() - (this.openedAt.get(state.core.round) ?? this.clock())
        });
    }
    /** Observe automatic transitions that did not come from a command (timeouts). */ observeTransition(before, after) {
        if (!this.started) this.start(before);
        this.diff(before, after);
    }
    diff(before, after) {
        for (const p of after.players){
            const prev = before.players.find((q)=>q.playerId === p.playerId);
            for (const id of p.research)if (!prev?.research.includes(id)) this.emit(after, 'research', {
                seat: p.playerId,
                advancementId: id,
                researched: p.research.length
            });
            for (const c of p.contacts){
                const key = pairKey(p.playerId, c);
                if (!this.seenContacts.has(key)) {
                    this.seenContacts.add(key);
                    this.emit(after, 'contact', {
                        seats: [
                            p.playerId,
                            c
                        ].sort()
                    });
                }
            }
        }
        for (const t of after.treaties){
            if (this.seenTreaties.get(t.id) !== t.status) {
                this.seenTreaties.set(t.id, t.status);
                this.emit(after, 'treaty', {
                    treaty: t.type,
                    from: t.proposerId,
                    to: t.recipientId,
                    status: t.status
                });
            }
        }
        for (const w of after.wars){
            const key = pairKey(w[0], w[1]);
            if (!this.seenWars.has(key)) {
                this.seenWars.add(key);
                this.emit(after, 'war', {
                    seats: [
                        w[0],
                        w[1]
                    ]
                });
            }
        }
        for (const battle of after.battles.slice(this.battlesSeen)){
            const grades = (tactical)=>tactical.map((r)=>r.effect ?? '').filter(Boolean).length;
            this.emit(after, 'combat', {
                attacker: battle.attackerId,
                defender: battle.defenderId,
                world: battle.attackerId === 'world' || battle.defenderId === 'world',
                hex: battle.hexId,
                delta: battle.delta ?? battle.attackTotal - battle.defenseTotal,
                outcome: battle.outcome ?? null,
                winner: battle.winnerId,
                attackerPosture: battle.attackerPosture,
                defenderPosture: battle.defenderPosture,
                attackerPieces: battle.attackerUnits.length,
                defenderPieces: battle.defenderUnits.length,
                losses: battle.losses.length,
                retreat: battle.retreat !== null,
                signatureEffects: grades(battle.attackerTactical) + grades(battle.defenderTactical),
                fortified: battle.fortification !== null
            });
        }
        this.battlesSeen = after.battles.length;
        for (const event of after.events.slice(this.eventsSeen)){
            if (event.type.startsWith('THREAT') || event.type === 'RAID_ATTACK') this.emit(after, 'threat', {
                event: event.type,
                audience: event.audience
            });
            if (event.type === 'SAVE_UPGRADED') this.emit(after, 'save_upgraded', {});
        }
        this.eventsSeen = after.events.length;
        if (after.phase === 'ERA_TURN' && before.phase !== 'ERA_TURN') this.emit(after, 'era_turn', {
            era: after.eraTurn && typeof after.eraTurn === 'object' ? after.eraTurn.era : null
        });
        for (const entry of after.telemetry.roundLog.slice(this.roundLogSeen)){
            this.emit(after, 'round_close', {
                seat: entry.playerId,
                closedRound: entry.round,
                era: entry.era,
                before: this.stockAtOpen.get(`${entry.round}:${entry.playerId}`) ?? null,
                after: entry.stock,
                population: entry.population,
                cities: entry.cities,
                cityLevels: entry.cityLevels,
                moods: entry.moods,
                orders: entry.orders,
                repeatedOrders: entry.repeatedOrders,
                researched: entry.researched,
                heritages: entry.heritages,
                resonance: {
                    slots: entry.resonanceSlots,
                    cycles: entry.resonanceCycles
                },
                combats: entry.combats,
                casualties: entry.casualties,
                threatsAlive: entry.threatsAlive,
                prestige: entry.prestige,
                hegemonyPaths: entry.hegemonyPaths,
                produced: entry.produced,
                spent: entry.spent,
                lost: entry.lost,
                discarded: entry.discarded
            });
        }
        this.roundLogSeen = after.telemetry.roundLog.length;
        const roundChanged = after.core.round !== before.core.round || after.phase === 'PLANNING' && before.phase !== 'PLANNING';
        if (after.phase === 'PLANNING' && roundChanged) {
            this.openRound(after);
        }
        if (after.core.status === 'FINISHED' && before.core.status !== 'FINISHED') this.emit(after, 'end', {
            winner: after.winner?.playerId ?? null,
            reason: after.winner?.reason ?? null,
            finalRound: after.core.round,
            prestige: after.players.map((p)=>({
                    seat: p.playerId,
                    prestige: p.prestige
                }))
        });
    }
}
const holder = globalThis;
function playtestRecorderFor(gameId, env = process.env, root = process.cwd()) {
    if (!playtestEnabled(env)) return null;
    const registry = holder.aohPlaytestRecorders ??= new Map();
    let recorder = registry.get(gameId);
    if (!recorder) {
        const day = new Date().toISOString().slice(0, 10);
        recorder = new PlaytestRecorder(new FileSink((0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["join"])(env.ALPHA_PLAYTEST_DIR ?? (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["join"])(root, 'docs', 'evidence', 'playtests'), `${day}-${gameId}`)));
        registry.set(gameId, recorder);
    }
    return recorder;
}
}),
"[project]/apps/web/app/api/alpha/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/server/dist/alpha-runtime.js [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const runtime = 'nodejs';
const dynamic = 'force-dynamic';
const GET = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["handleAlphaRequest"];
const POST = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$server$2f$dist$2f$alpha$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["handleAlphaRequest"];
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=apps_0ib7k_4._.js.map
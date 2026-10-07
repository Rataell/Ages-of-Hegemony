module.exports = [
"[project]/packages/game-engine/dist/alpha-actions.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "alphaActionCapacity",
    ()=>alphaActionCapacity,
    "alphaActionUsage",
    ()=>alphaActionUsage,
    "chargeMainAction",
    ()=>chargeMainAction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-institutions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-government.js [app-route] (ecmascript)");
;
;
;
function alphaActionCapacity(state, playerId) {
    const player = state.core.players.find((candidate)=>candidate.id === playerId);
    if (!player) return 0;
    const base = state.rules.actionsPerRound ?? 5;
    return Math.max(0, base + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["institutionBonus"])(state, playerId, 'COMMAND'));
}
function alphaActionUsage(state, playerId) {
    const player = state.players.find((candidate)=>candidate.playerId === playerId);
    // Moving the capital occupies more than one Order under some governments (Monarquia: 2).
    const heavy = (player?.plannedActions.filter((action)=>action.type === 'URBAN_ACTION' && action.action === 'MOVE_CAPITAL').length ?? 0) * ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, playerId).moveCapitalOrders - 1);
    const reserved = (player?.orders.length ?? 0) + (player?.plannedActions.length ?? 0) + heavy;
    const byOrder = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyOrderCount"])();
    if (player) {
        for (const type of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaOrderTypeSchema"].options)byOrder[type] += player.ordersSpent[type] ?? 0;
        for (const order of player.orders)byOrder[(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["orderTypeForOrder"])(order)] += 1;
        for (const action of player.plannedActions)byOrder[(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["orderTypeForPlanned"])(action)] += action.type === 'URBAN_ACTION' && action.action === 'MOVE_CAPITAL' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, playerId).moveCapitalOrders : 1;
    }
    return {
        used: (player?.spentCommands ?? 0) + reserved,
        reserved,
        limit: alphaActionCapacity(state, playerId),
        byOrder
    };
}
function chargeMainAction(state, playerId, mode = 'COMMIT', orderType = null) {
    const player = state.players.find((candidate)=>candidate.playerId === playerId);
    if (!player) throw new Error('Jogador não encontrado.');
    if (mode === 'COMMIT') {
        player.spentCommands += 1;
        if (orderType) player.ordersSpent[orderType] = (player.ordersSpent[orderType] ?? 0) + 1;
    }
    if (alphaActionUsage(state, playerId).used > alphaActionCapacity(state, playerId)) throw new Error('Sem ações principais disponíveis nesta rodada.');
}
}),
"[project]/packages/game-engine/dist/alpha-cards.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cardEffects",
    ()=>cardEffects,
    "civilizationCardStatus",
    ()=>civilizationCardStatus,
    "initializeAlphaCards",
    ()=>initializeAlphaCards,
    "maintainCards",
    ()=>maintainCards,
    "manageCard",
    ()=>manageCard,
    "playCivilizationCard",
    ()=>playCivilizationCard,
    "renewManeuvers",
    ()=>renewManeuvers,
    "scoreAmbitions",
    ()=>scoreAmbitions,
    "swapAmbition",
    ()=>swapAmbition
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-cards.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$civilization$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-civilization-kits.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-government.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-random.js [app-route] (ecmascript)");
;
;
;
;
function shuffled(state, ids) {
    const deck = [
        ...ids
    ];
    for(let i = deck.length - 1; i > 0; i--){
        const j = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRandomInteger"])(state, i + 1);
        [deck[i], deck[j]] = [
            deck[j],
            deck[i]
        ];
    }
    return deck;
}
function initializeAlphaCards(state) {
    const deck = (family)=>shuffled(state, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_CARDS"].filter((c)=>c.family === family).map((c)=>c.id));
    state.cards.worldDeck = deck('WORLD_EVENT');
    state.cards.strategyDeck = deck('STRATEGY');
    state.cards.ambitionDeck = deck('AMBITION');
    state.cards.advisorDeck = deck('ADVISOR');
    state.cards.advisorMarket = state.cards.advisorDeck.splice(0, 3);
    for (const player of state.players){
        player.hand = state.cards.strategyDeck.splice(0, 3);
        player.ambitions = state.cards.ambitionDeck.splice(0, 3);
        player.ambitionsChosen = false;
    }
}
function cardEffects(state, actor) {
    const player = state.players.find((p)=>p.playerId === actor);
    return [
        ...player.advisors.map((id)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_CARDS"].find((c)=>c.id === id).effect).filter(Boolean),
        ...player.temporaryEffects.filter((e)=>e.round === state.core.round).map((e)=>e.effect)
    ];
}
/**
 * Hands refill by one card each round for the whole match, so an empty strategy deck takes back the played strategy cards
 * (seeded shuffle). Only cards already discarded return; cards in hands stay there.
 */ function reshuffleStrategy(state) {
    const strategy = new Set(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_CARDS"].filter((c)=>c.family === 'STRATEGY').map((c)=>c.id));
    const returning = state.cards.discarded.filter((id)=>strategy.has(id));
    if (!returning.length) return;
    state.cards.discarded = state.cards.discarded.filter((id)=>!strategy.has(id));
    state.cards.strategyDeck = shuffled(state, returning);
}
function maintainCards(state) {
    for (const player of state.players){
        player.cardsPlayed = 0;
        player.temporaryEffects = player.temporaryEffects.filter((e)=>e.round >= state.core.round);
    }
    if (state.cards.worldDeck.length && (state.cards.worldEvent === null || state.core.round % state.rules.eventEvery === 0 && state.cards.worldEventRound !== state.core.round)) {
        if (state.cards.worldEvent) state.cards.discarded.push(state.cards.worldEvent);
        state.cards.worldEvent = state.cards.worldDeck.shift();
        state.cards.worldResponded = [];
        state.cards.worldEventRound = state.core.round;
    }
}
function manageCard(state, actor, command) {
    const player = state.players.find((p)=>p.playerId === actor);
    if (command.type === 'CHOOSE_AMBITIONS') {
        if (player.ambitionsChosen || new Set(command.cardIds).size !== 2 || command.cardIds.some((id)=>!player.ambitions.includes(id))) throw new Error('Escolha exatamente duas das três ambições recebidas.');
        state.cards.discarded.push(...player.ambitions.filter((id)=>!command.cardIds.includes(id)));
        player.ambitions = [
            ...command.cardIds
        ];
        player.ambitionsChosen = true;
        return;
    }
    if (command.type === 'WORLD_CHOICE') {
        if (!state.cards.worldEvent || state.cards.worldResponded.includes(actor)) throw new Error('Não há decisão de evento pendente.');
        const card = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_CARDS"].find((c)=>c.id === state.cards.worldEvent);
        if (command.choice === 'PRESTIGE') player.prestige++;
        else if (card.effect?.kind === 'PRODUCTION') (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGainLegacy"])(state, actor, {
            [card.effect.resource]: card.effect.amount
        });
        state.cards.worldResponded.push(actor);
        return;
    }
    const card = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_CARDS"].find((c)=>c.id === command.cardId);
    if (!card) throw new Error('Carta desconhecida.');
    if (command.type === 'HIRE_ADVISOR') {
        if (!state.cards.advisorMarket.includes(card.id) || player.advisors.length >= state.rules.advisorLimit) throw new Error('Conselheiro indisponível ou espaços ocupados.');
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, actor, state.rules.advisorCost);
        player.advisors.push(card.id);
        state.cards.advisorMarket = state.cards.advisorMarket.filter((id)=>id !== card.id);
        const next = state.cards.advisorDeck.shift();
        if (next) state.cards.advisorMarket.push(next);
        return;
    }
    if (!player.hand.includes(card.id) || card.timing !== state.core.phase || player.cardsPlayed >= state.rules.cardsPerRound) throw new Error('Carta fora da mão, do momento permitido ou do limite por rodada.');
    // I-16: one Reaction per side; two Reactions in a round would stack on the same battle.
    if (card.timing === 'REACTION' && player.temporaryEffects.some((e)=>e.round === state.core.round && __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_CARDS"].find((c)=>c.id === e.source)?.timing === 'REACTION')) throw new Error('Cada lado joga no máximo uma Reação por rodada.');
    player.hand = player.hand.filter((id)=>id !== card.id);
    state.cards.discarded.push(card.id);
    player.cardsPlayed++;
    if (card.effect?.kind === 'PRODUCTION') (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGainLegacy"])(state, actor, {
        [card.effect.resource]: card.effect.amount
    });
    else if (card.effect) player.temporaryEffects.push({
        source: card.id,
        effect: card.effect,
        round: state.core.round
    });
}
function civilizationCardStatus(state, actor, cardId) {
    const player = state.players.find((p)=>p.playerId === actor);
    const card = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$civilization$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["civilizationKit"])(player?.civilization)?.cards.find((c)=>c.id === cardId);
    if (!player || !card) return 'UNKNOWN';
    if (__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(player.era) < __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(card.unlockEra)) return 'LOCKED';
    return player.civilizationCardsPlayed.some((entry)=>entry.cardId === card.id && entry.era === player.era) ? 'USED' : 'AVAILABLE';
}
function playCivilizationCard(state, actor, cardId) {
    const player = state.players.find((p)=>p.playerId === actor);
    const card = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$civilization$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["civilizationKit"])(player.civilization)?.cards.find((c)=>c.id === cardId);
    const status = civilizationCardStatus(state, actor, cardId);
    if (!card || status === 'UNKNOWN') throw new Error('Esta carta não pertence ao tabuleiro da sua civilização.');
    if (status === 'LOCKED') throw new Error('Esta carta da civilização só libera numa era posterior.');
    if (status === 'USED') throw new Error('Esta carta da civilização já foi usada nesta era.');
    if (player.cardsPlayed >= state.rules.cardsPerRound) throw new Error('Você já jogou o limite de cartas desta rodada.');
    player.cardsPlayed++;
    player.civilizationCardsPlayed.push({
        cardId: card.id,
        era: player.era
    });
    if (card.effect.kind === 'PRODUCTION') (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGainLegacy"])(state, actor, {
        [card.effect.resource]: card.effect.amount
    });
    else player.temporaryEffects.push({
        source: card.id,
        effect: card.effect,
        round: state.core.round
    });
}
function renewManeuvers(state) {
    const reactions = new Set(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_CARDS"].filter((c)=>c.family === 'STRATEGY' && c.timing === 'REACTION').map((c)=>c.id));
    const back = state.cards.discarded.filter((id)=>reactions.has(id));
    if (back.length) {
        state.cards.discarded = state.cards.discarded.filter((id)=>!reactions.has(id));
        state.cards.strategyDeck = shuffled(state, [
            ...state.cards.strategyDeck,
            ...back
        ]);
    }
    for (const player of state.players){
        // República (canon §16): one more Manobra kept in hand and drawn at each Era turn.
        const bonus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, player.playerId).handBonus;
        for(let draw = 0; draw < 1 + bonus && player.hand.length < state.rules.handLimit + bonus; draw++){
            if (!state.cards.strategyDeck.length) reshuffleStrategy(state);
            const next = state.cards.strategyDeck.shift();
            if (next) player.hand.push(next);
        }
    }
}
function swapAmbition(state, actor, cardId) {
    const player = state.players.find((p)=>p.playerId === actor);
    if (!state.eraTurn) throw new Error('A troca de Ambição só acontece na Virada de Era.');
    if (player.ambitionSwapEra === state.eraTurn.era) throw new Error('Você já trocou uma Ambição nesta Virada de Era.');
    if (!player.ambitions.includes(cardId) || player.completedAmbitions.includes(cardId)) throw new Error('Escolha uma das suas Ambições ainda não concluídas.');
    const next = state.cards.ambitionDeck.shift();
    if (!next) throw new Error('Não há outra Ambição no baralho.');
    state.cards.discarded.push(cardId);
    player.ambitions = player.ambitions.map((id)=>id === cardId ? next : id);
    player.ambitionSwapEra = state.eraTurn.era;
}
function scoreAmbitions(state) {
    let scored = 0;
    for (const player of state.players){
        if (!player.ambitionsChosen) continue;
        const core = state.core.players.find((p)=>p.id === player.playerId);
        const metrics = {
            cities: core.civilization.cities.length,
            territory: state.core.map.filter((t)=>t.ownerId === player.playerId).length,
            research: player.research.length,
            districts: core.civilization.cities.reduce((n, c)=>n + c.districts.length, 0),
            routes: state.routes.filter((r)=>r.ownerId === player.playerId && !r.suspended).length,
            treaties: state.treaties.filter((t)=>t.status === 'ACTIVE' && [
                    t.proposerId,
                    t.recipientId
                ].includes(player.playerId)).length,
            victories: player.victories,
            culture: core.civilization.cities.filter((c)=>c.districts.some((d)=>d.type === 'CULTURAL')).length
        };
        const limit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, player.playerId).ambitionsPerEra;
        const met = player.ambitions.filter((id)=>{
            const objective = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_CARDS"].find((c)=>c.id === id).objective;
            return !player.completedAmbitions.includes(id) && metrics[objective.metric] >= objective.threshold;
        }).sort((a, b)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_CARDS"].find((c)=>c.id === b).objective.prestige - __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_CARDS"].find((c)=>c.id === a).objective.prestige || a.localeCompare(b));
        for (const id of met.slice(0, limit)){
            player.completedAmbitions.push(id);
            player.prestige += __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_CARDS"].find((c)=>c.id === id).objective.prestige;
            scored++;
        }
    }
    return scored;
}
}),
"[project]/packages/game-engine/dist/alpha-casualties.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Why a casualty priority cannot be set now, or null. Legal while planning and before the seat confirms; only combat kinds are listed. */ __turbopack_context__.s([
    "casualtyPriorityBlock",
    ()=>casualtyPriorityBlock
]);
function casualtyPriorityBlock(state, actor, order, hexId) {
    const seat = state.players.find((player)=>player.playerId === actor);
    if (!seat) return 'Jogador desconhecido.';
    if (state.phase !== 'PLANNING') return 'A prioridade de baixas só muda no Planejamento, antes do conflito.';
    if (seat.ready) return 'Reabra o Planejamento (desconfirme) para mudar a prioridade de baixas.';
    const civil = order.find((kind)=>state.rules.units[kind].strength <= 0);
    if (civil) return 'Só peças de combate entram na prioridade de baixas.';
    if (hexId !== null && !state.units.some((unit)=>unit.ownerId === actor && unit.hexId === hexId)) return 'Nenhuma peça sua nesse hex.';
    return null;
}
}),
"[project]/packages/game-engine/dist/alpha-cities.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "occupyCity",
    ()=>occupyCity,
    "settleWithPioneer",
    ()=>settleWithPioneer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2d$invariants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/territory-invariants.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/civilization.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-government.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$founding$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/founding.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$culture$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-culture.js [app-route] (ecmascript)");
;
;
;
;
;
;
/** The shared territory rules answer in codes; players read these sentences. */ const FOUNDING_REFUSALS = {
    INVALID_CITY_SITE: ()=>'Funde em terra firme, fora de uma cidade e de um território já trabalhado.',
    CITY_TOO_CLOSE: (distance)=>`Uma nova cidade precisa ficar a pelo menos ${distance} hexes de qualquer cidade.`,
    INSUFFICIENT_RESOURCES: ()=>'Recursos insuficientes para fundar a cidade.',
    UNKNOWN_HEX: ()=>'Hex desconhecido.'
};
/** Fundar custa 1 Madeira a menos sob a Confederação (canon §16); the discount comes off the material cost. */ function foundingPayment(state, actor) {
    const pay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaResourcePayment"])(state), discount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, actor).foundingWoodDiscount;
    return discount === 0 ? pay : (corePlayer, cost)=>pay(corePlayer, {
            ...cost,
            materials: Math.max(0, cost.materials - discount)
        });
}
function settleWithPioneer(state, actor, unitId, name) {
    const pioneer = state.units.find((u)=>u.id === unitId && u.ownerId === actor && u.kind === 'PIONEER');
    if (!pioneer) throw new Error('Escolha um Pioneiro próprio para fundar uma cidade.');
    if (state.players.find((p)=>p.playerId === actor).orders.some((o)=>'unitIds' in o && o.unitIds.includes(unitId) || 'unitId' in o && o.unitId === unitId)) throw new Error('Cancele a ordem do Pioneiro antes de fundar a cidade: explorar e fundar são Ordens diferentes.');
    const tile = state.core.map.find((t)=>t.id === pioneer.hexId);
    if (tile.ownerId !== null && tile.ownerId !== actor || state.units.some((u)=>u.hexId === tile.id && u.ownerId !== actor)) throw new Error('Não é possível fundar em território ou presença estrangeira.');
    const player = state.core.players.find((p)=>p.id === actor);
    const founded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$founding$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["foundCityAt"])(state.core, player, state.core.map, {
        type: 'FOUND_CITY',
        playerId: actor,
        cityId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CityIdSchema"].parse(`city-${actor}-${state.version}`),
        hexId: tile.id,
        name,
        expectedVersion: state.core.version
    }, state.core.version + 1, foundingPayment(state, actor));
    if (!founded.ok) throw new Error(FOUNDING_REFUSALS[founded.error.code]?.(state.core.config.territory.minimumCityDistance) ?? founded.error.message);
    state.units = state.units.filter((u)=>u.id !== unitId);
    const newCity = player.civilization.cities.find((c)=>c.hexId === tile.id);
    state.cities.push({
        cityId: newCity.id,
        originalOwnerId: actor,
        currentOwnerId: actor,
        nativeIdentity: state.players.find((p)=>p.playerId === actor).civilization ?? `native-${actor}`,
        status: 'OWNED',
        integration: 100,
        mood: 4,
        level: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cityLevelForPopulation"])(newCity.population),
        capital: player.civilization.capitalCityId === newCity.id,
        districts: newCity.districts.map((d)=>d.type),
        buildings: [],
        fortification: {
            level: 'NONE',
            state: 'INTACT'
        },
        foreignPresence: [],
        localCohesion: 50,
        culturalAnchor: null,
        urbanActionsUsed: 0,
        allocationRound: 0,
        portBlockedUntil: 0,
        portBlockedBy: null
    });
    state.core.version++;
    state.core.eventLog.push(founded.value);
    state.telemetry.citiesFounded++;
    player.civilization = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["refreshAdministration"])(player.civilization, state.core.config, state.core.map);
}
function occupyCity(state, actor, cityId) {
    const previous = state.core.players.find((p)=>p.civilization.cities.some((c)=>c.id === cityId));
    const recipient = state.core.players.find((p)=>p.id === actor);
    if (previous.id === actor) throw new Error('A cidade já pertence à sua civilização.');
    const city = previous.civilization.cities.find((c)=>c.id === cityId);
    const liberated = state.occupations.some((o)=>o.cityId === cityId && o.previousOwnerId === actor);
    previous.civilization.cities = previous.civilization.cities.filter((c)=>c.id !== cityId);
    if (previous.civilization.capitalCityId === cityId) previous.civilization.capitalCityId = [
        ...previous.civilization.cities
    ].sort((a, b)=>a.id < b.id ? -1 : a.id > b.id ? 1 : 0)[0]?.id ?? null;
    city.ownerId = actor;
    city.stability = Math.max(0, city.stability - state.rules.occupationStabilityPenalty);
    recipient.civilization.cities.push(city);
    if (recipient.civilization.capitalCityId === null) recipient.civilization.capitalCityId = cityId;
    for (const tile of state.core.map)if (tile.controllerCityId === cityId) tile.ownerId = actor;
    // A capture may sever a path that previously crossed another city's controlled hexes.
    const centers = new Map(state.core.players.flatMap((p)=>p.civilization.cities.map((c)=>[
                c.id,
                state.core.map.find((t)=>t.id === c.hexId)
            ])));
    const disconnected = state.core.map.filter((t)=>t.controllerCityId !== null && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2d$invariants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["connectedTo"])(state.core.map, t, centers.get(t.controllerCityId)));
    for (const tile of disconnected){
        tile.ownerId = null;
        tile.controllerCityId = null;
        tile.improvement = null;
    }
    for (const player of state.core.players)for (const ownCity of player.civilization.cities)ownCity.workedHexIds = ownCity.workedHexIds.filter((id)=>!disconnected.some((t)=>t.id === id));
    // Dependencies cannot silently retain permissions granted by a former owner.
    state.routes = state.routes.filter((r)=>r.fromCityId !== cityId && r.toCityId !== cityId);
    for (const work of state.legacyWorks)if (work.cityId === cityId) work.ownerId = actor;
    state.occupations = state.occupations.filter((o)=>o.cityId !== cityId);
    if (!liberated) {
        state.occupations.push({
            cityId,
            occupierId: actor,
            previousOwnerId: previous.id,
            sinceRound: state.core.round
        });
        state.telemetry.citiesCaptured++;
    }
    const meta = state.cities.find((c)=>c.cityId === cityId);
    if (meta) {
        const civilization = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$culture$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["culturalIdentityOf"])(state, actor);
        meta.currentOwnerId = actor;
        meta.status = liberated ? 'OWNED' : 'OCCUPIED';
        meta.integration = liberated ? 100 : 0;
        // Autocracia (canon §16): a conquered city begins in Revolta (Integração already starts at 0).
        if (!liberated && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, actor).conqueredCityStartsInRevolt) meta.mood = Math.min(meta.mood, 1);
        meta.capital = recipient.civilization.capitalCityId === cityId;
        meta.foreignPresence = meta.foreignPresence.filter((presence)=>presence.civilizationId !== civilization);
        if (meta.culturalAnchor === civilization) meta.culturalAnchor = null;
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$culture$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["refreshCulturalMetrics"])(state);
    state.core.version++;
    state.core.eventLog.push({
        type: 'CITY_TRANSFERRED',
        version: state.core.version,
        round: state.core.round,
        cityId,
        playerId: actor,
        previousOwnerId: previous.id
    });
    for (const player of state.core.players)player.civilization = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["refreshAdministration"])(player.civilization, state.core.config, state.core.map);
}
}),
"[project]/packages/game-engine/dist/alpha-city.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MOOD_BAND_NAMES",
    ()=>MOOD_BAND_NAMES,
    "activationCapacity",
    ()=>activationCapacity,
    "activationsAllowed",
    ()=>activationsAllowed,
    "administration",
    ()=>administration,
    "canGrow",
    ()=>canGrow,
    "cityLevels",
    ()=>cityLevels,
    "cityPair",
    ()=>cityPair,
    "citySustenance",
    ()=>citySustenance,
    "cityYield",
    ()=>cityYield,
    "demobilize",
    ()=>demobilize,
    "districtSlots",
    ()=>districtSlots,
    "elevateBlock",
    ()=>elevateBlock,
    "elevateCity",
    ()=>elevateCity,
    "governBlock",
    ()=>governBlock,
    "governCity",
    ()=>governCity,
    "governCost",
    ()=>governCost,
    "growCost",
    ()=>growCost,
    "militaryUpkeep",
    ()=>militaryUpkeep,
    "mirrorDevelopment",
    ()=>mirrorDevelopment,
    "mobilizationBlock",
    ()=>mobilizationBlock,
    "mobilize",
    ()=>mobilize,
    "moodBand",
    ()=>moodBand,
    "operatingCapacity",
    ()=>operatingCapacity,
    "poolTotal",
    ()=>poolTotal,
    "recruitLimit",
    ()=>recruitLimit,
    "refreshAlphaAdministration",
    ()=>refreshAlphaAdministration,
    "replaceCity",
    ()=>replaceCity
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-city-ladder.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$economy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/economy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-institutions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-threats.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-government.js [app-route] (ecmascript)");
;
;
;
;
;
;
const moodBand = (mood)=>mood <= 1 ? 'REVOLT' : mood <= 3 ? 'SHAKEN' : mood === 4 ? 'STABLE' : 'PROSPEROUS';
const MOOD_BAND_NAMES = {
    REVOLT: 'Revolta',
    SHAKEN: 'Abalada',
    STABLE: 'Estável',
    PROSPEROUS: 'Próspera'
};
function cityPair(state, cityId) {
    const meta = state.cities.find((candidate)=>candidate.cityId === cityId);
    if (!meta) return null;
    const owner = state.core.players.find((player)=>player.id === meta.currentOwnerId);
    const city = owner?.civilization.cities.find((candidate)=>candidate.id === cityId);
    return owner && city ? {
        meta,
        city,
        ownerId: owner.id
    } : null;
}
function cityLevels(meta, city) {
    const effective = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["effectiveLevel"])(meta.level, city.population);
    return {
        built: meta.level,
        effective,
        capacity: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["effectiveCapacity"])(meta.level, city.population),
        ceiling: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["populationCeiling"])(meta.level),
        degraded: effective !== meta.level
    };
}
function operatingCapacity(state, cityId) {
    const pair = cityPair(state, cityId);
    if (!pair) return 0;
    let capacity = cityLevels(pair.meta, pair.city).capacity;
    const owner = state.core.players.find((player)=>player.id === pair.ownerId);
    if (owner && owner.civilization.capitalCityId === cityId) {
        const effects = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, pair.ownerId);
        capacity += effects.capitalCapacityBonus + ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasUnlock"])(state, pair.ownerId, 'rule:capital-capacity-plus-1') ? 1 : 0);
        if (effects.capitalCapacityCap !== null) capacity = Math.min(capacity, effects.capitalCapacityCap);
    }
    return capacity;
}
function activationCapacity(state, cityId) {
    const pair = cityPair(state, cityId);
    if (!pair) return 0;
    const band = moodBand(pair.meta.mood);
    if (band === 'REVOLT') return 0;
    const base = operatingCapacity(state, cityId);
    if (band === 'SHAKEN') return Math.max(1, base - 1);
    if (band === 'PROSPEROUS' && pair.meta.urbanActionsUsed === 0) return base + 1;
    return base;
}
const activationsAllowed = (meta)=>moodBand(meta.mood) === 'REVOLT' ? 1 : moodBand(meta.mood) === 'SHAKEN' ? 1 : 2;
/** Buildings that let the third and later pairs of a role yield (canon §6). */ const ROLE_BUILDING = {
    artisans: 'WORKSHOP',
    merchants: 'MARKET',
    scholars: 'LIBRARY'
};
const pairs = (count, building, meta, perOne = false)=>{
    const all = perOne ? count : Math.floor(count / 2);
    return meta.buildings.includes(building) ? all : Math.min(all, perOne ? 4 : 2);
};
function cityYield(state, cityId) {
    const pair = cityPair(state, cityId);
    const output = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])();
    if (!pair) return {
        output,
        metal: 0,
        hexes: [],
        capacity: 0,
        notes: []
    };
    const { meta, city, ownerId } = pair;
    const capacity = activationCapacity(state, cityId);
    const notes = [];
    if (capacity === 0) return {
        output,
        metal: 0,
        hexes: [],
        capacity,
        notes: [
            'Revolta: a cidade não produz.'
        ]
    };
    const rules = state.core.config;
    const centre = state.core.map.find((tile)=>tile.id === city.hexId);
    const worked = city.workedHexIds.slice(0, Math.min(capacity, city.workers.producers)).map((id)=>state.core.map.find((tile)=>tile.id === id)).filter((tile)=>tile !== undefined && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexBlockedByThreat"])(state, tile.id));
    const farmBonus = state.players.find((player)=>player.playerId === ownerId)?.research.filter((id)=>[
            'web-irrigation',
            'web-crop-rotation',
            'web-agronomy'
        ].includes(id)).length ?? 0;
    const tiles = centre ? [
        centre,
        ...worked
    ] : worked;
    let metal = 0;
    for (const tile of tiles){
        const yields = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$economy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["tileYieldBreakdown"])(tile, rules).total;
        output.food += yields.food + (tile.improvement === 'FARM' ? farmBonus : 0);
        output.wealth += yields.wealth;
        // Materials from the land split by what the hex is: stone from hills and mountains, wood elsewhere; a mine gives metal.
        if (tile.improvement === 'MINE' && tile.features.includes('METAL') && tile !== centre) metal += state.rules.balance.metalPerMine;
        else if (tile.terrain === 'HILLS' || tile.terrain === 'MOUNTAINS' || tile.improvement === 'MINE') output.stone += yields.materials;
        else output.wood += yields.materials;
    }
    const idleProducers = Math.max(0, city.workers.producers - worked.length);
    output.food += Math.floor(idleProducers / 2);
    output.wood += pairs(city.workers.artisans, ROLE_BUILDING.artisans, meta);
    output.wealth += pairs(city.workers.merchants, ROLE_BUILDING.merchants, meta);
    const effects = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, ownerId);
    output.knowledge += pairs(city.workers.scholars, ROLE_BUILDING.scholars, meta, effects.scholarYieldsPerOne);
    for (const district of meta.districts){
        if (district === 'AGRARIAN') output.food += 2;
        else if (district === 'COMMERCIAL') output.wealth += 1;
        else if (district === 'ACADEMIC') output.knowledge += 1;
        else if (district === 'INDUSTRIAL') {
            output.wood += 1;
            output.stone += 1;
        } else if (district === 'CULTURAL') output.culture += 1;
        else if (district === 'MARITIME') output.food += 1;
    }
    if (meta.buildings.includes('TEMPLE')) output.culture += 1 + effects.templeCulture;
    if (effects.shakenCitiesProduceNoWealth && moodBand(meta.mood) === 'SHAKEN' && output.wealth > 0) {
        output.wealth = 0;
        notes.push('Oligarquia: cidade Abalada não gera Riqueza.');
    }
    if (worked.length < city.workedHexIds.length) notes.push(`Capacidade ${capacity}: ${city.workedHexIds.length - worked.length} hex(es) trabalhado(s) ficam fora desta ativação.`);
    return {
        output,
        metal,
        hexes: tiles.map((tile)=>tile.id),
        capacity,
        notes
    };
}
function elevateBlock(state, actor, cityId) {
    const pair = cityPair(state, cityId);
    if (!pair || pair.ownerId !== actor) return 'Escolha uma cidade própria.';
    const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nextLevel"])(pair.meta.level);
    if (!next) return 'A cidade já é uma Metrópole Imperial.';
    const requirement = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["elevateRequirement"])(next);
    const progress = state.players.find((player)=>player.playerId === actor);
    const eras = [
        'FOUNDATION',
        'EXPANSION',
        'CONSOLIDATION',
        'CIVILIZATION',
        'EMPIRES',
        'POWERS',
        'ASCENSION'
    ];
    if (pair.city.population < requirement.minPopulation) return `Elevar exige ${requirement.minPopulation} habitantes (a cidade tem ${pair.city.population}).`;
    if (eras.indexOf(progress.era) < eras.indexOf(requirement.era)) return 'Elevar a este nível exige uma Era posterior.';
    const missing = requirement.advances.filter((id)=>!progress.research.includes(id));
    if (missing.length) return `Elevar exige o avanço ${missing.join(', ')} na Teia.`;
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, actor, requirement.cost)) return 'Recursos insuficientes para esta ação.';
    return null;
}
function elevateCity(state, actor, cityId) {
    const blocked = elevateBlock(state, actor, cityId);
    if (blocked) throw new Error(blocked);
    const pair = cityPair(state, cityId);
    const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nextLevel"])(pair.meta.level);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, actor, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["elevateRequirement"])(next).cost);
    pair.meta.level = next;
    return next;
}
function districtSlots(state, cityId) {
    const pair = cityPair(state, cityId);
    if (!pair) return 0;
    const bonus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasUnlock"])(state, pair.ownerId, 'rule:slots-plus-1-village-up') && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ladderStep"])(pair.meta.level).minPopulation >= 6 ? 1 : 0;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ladderStep"])(pair.meta.level).slots + bonus;
}
const citySustenance = (population)=>Math.ceil(population / 2);
function militaryUpkeep(state, actor) {
    const own = state.units.filter((unit)=>unit.ownerId === actor);
    const land = own.filter((unit)=>state.rules.units[unit.kind].domain === 'LAND' && state.rules.units[unit.kind].strength > 0).length;
    const ships = own.filter((unit)=>state.rules.units[unit.kind].domain === 'SEA').length;
    return {
        food: Math.ceil(land / 2),
        wealth: ships
    };
}
function growCost(state, cityId) {
    const pair = cityPair(state, cityId);
    if (!pair) return 3;
    return pair.meta.buildings.includes('GRANARY') ? 2 : 3;
}
function canGrow(meta, city) {
    return city.population < (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["populationCeiling"])(meta.level);
}
function recruitLimit(state, actor, cityId) {
    const pair = cityPair(state, cityId);
    if (!pair) return 0;
    const effects = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, actor);
    const isCapital = state.core.players.find((player)=>player.id === actor)?.civilization.capitalCityId === cityId;
    const unlimited = pair.city.districts.some((district)=>district.type === 'MILITARY') || isCapital && effects.capitalRecruitIgnoresCapacity;
    let limit = unlimited ? 6 : Math.max(1, activationCapacity(state, cityId));
    if (effects.recruitPerActivationMax !== null) limit = Math.min(limit, effects.recruitPerActivationMax);
    return limit;
}
function mobilizationBlock(state, cityId, kind) {
    const pair = cityPair(state, cityId);
    if (!pair) return 'Escolha uma cidade própria.';
    const entry = state.rules.units[kind];
    if (!entry || entry.domain !== 'LAND' || entry.strength === 0) return null;
    if (pair.city.workers.soldiers + pair.city.workers.unassigned < 1) return 'Sem Soldado nem habitante Disponível para mobilizar.';
    // I-38: mobilization never empties a city. Found by the bot playtest: a one-habitant colony recruited itself down to 0.
    if (pair.city.population <= 1) return 'A cidade precisa manter ao menos 1 habitante: não pode mobilizar o último.';
    return null;
}
function mobilize(state, cityId, kind) {
    const blocked = mobilizationBlock(state, cityId, kind);
    if (blocked) throw new Error(blocked);
    const pair = cityPair(state, cityId);
    const entry = state.rules.units[kind];
    if (entry.domain !== 'LAND' || entry.strength === 0) return;
    const workers = {
        ...pair.city.workers
    };
    if (workers.soldiers > 0) workers.soldiers -= 1;
    else workers.unassigned -= 1;
    replaceCity(state, cityId, {
        ...pair.city,
        population: pair.city.population - 1,
        workers
    });
}
function demobilize(state, actor, unitId) {
    const unit = state.units.find((candidate)=>candidate.id === unitId && candidate.ownerId === actor);
    if (!unit) throw new Error('Escolha uma peça própria.');
    const entry = state.rules.units[unit.kind];
    if (entry.domain !== 'LAND' || entry.strength === 0) throw new Error('Só peças militares terrestres são desmobilizadas.');
    const pair = state.cities.map((meta)=>cityPair(state, meta.cityId)).find((candidate)=>candidate && candidate.ownerId === actor && candidate.meta.status === 'OWNED' && candidate.city.hexId === unit.hexId);
    if (!pair) throw new Error('Desmobilize dentro de uma cidade própria.');
    state.units = state.units.filter((candidate)=>candidate.id !== unitId);
    replaceCity(state, pair.city.id, {
        ...pair.city,
        population: pair.city.population + 1,
        workers: {
            ...pair.city.workers,
            unassigned: pair.city.workers.unassigned + 1
        }
    });
    return pair.city.id;
}
function mirrorDevelopment(state) {
    for (const meta of state.cities){
        const pair = cityPair(state, meta.cityId);
        if (!pair) continue;
        const index = [
            'OUTPOST',
            'HAMLET',
            'VILLAGE',
            'CITY',
            'GREAT_CITY',
            'METROPOLIS',
            'IMPERIAL_METROPOLIS'
        ].indexOf(meta.level);
        const development = index <= 1 ? 1 : index <= 4 ? 3 : 5;
        if (pair.city.development !== development) replaceCity(state, meta.cityId, {
            ...pair.city,
            development
        });
    }
}
function replaceCity(state, cityId, original) {
    // I-39: a city never works more hexes than it has Produtores. Famine, mobilization or capture can remove a Produtor; the last worked hexes are released.
    const next = original.workedHexIds.length > original.workers.producers ? {
        ...original,
        workedHexIds: original.workedHexIds.slice(0, original.workers.producers)
    } : original;
    for (const player of state.core.players){
        const index = player.civilization.cities.findIndex((candidate)=>candidate.id === cityId);
        if (index >= 0) {
            player.civilization = {
                ...player.civilization,
                cities: player.civilization.cities.map((candidate, i)=>i === index ? next : candidate)
            };
            return;
        }
    }
}
const poolTotal = (pool)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"].reduce((total, key)=>total + pool[key], 0);
function administration(state, actor) {
    const owner = state.core.players.find((player)=>player.id === actor);
    const progress = state.players.find((player)=>player.playerId === actor);
    if (!owner || !progress) return {
        load: 0,
        capacity: 0,
        overextended: false,
        parts: {
            base: 0,
            capital: 0,
            districts: 0,
            chancellery: 0,
            government: 0,
            web: 0
        }
    };
    const metas = state.cities.filter((meta)=>meta.currentOwnerId === actor);
    const load = metas.reduce((total, meta)=>total + (meta.status === 'OCCUPIED' || state.occupations.some((occupation)=>occupation.cityId === meta.cityId) ? 2 : 1), 0);
    const parts = {
        base: state.rules.balance.administrationBase,
        capital: owner.civilization.capitalCityId && metas.some((meta)=>meta.cityId === owner.civilization.capitalCityId) ? 1 : 0,
        districts: metas.filter((meta)=>meta.districts.includes('ADMINISTRATIVE')).length,
        chancellery: metas.some((meta)=>meta.buildings.includes('CHANCELLERY')) ? 1 : 0,
        government: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, actor).administrationBonus,
        web: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasUnlock"])(state, actor, 'rule:admin-capacity-plus-1') ? progress.research.filter((id)=>[
                'web-codes',
                'web-urbanism'
            ].includes(id)).length : 0
    };
    const capacity = parts.base + parts.capital + parts.districts + parts.chancellery + parts.government + parts.web;
    return {
        load,
        capacity,
        overextended: load > capacity,
        parts
    };
}
function refreshAlphaAdministration(state) {
    for (const owner of state.core.players){
        const result = administration(state, owner.id);
        owner.civilization = {
            ...owner.civilization,
            administrativeLoad: result.load,
            administrativeCapacity: result.capacity,
            administrationStatus: result.overextended ? 'OVEREXTENDED' : 'WITHIN_CAPACITY'
        };
    }
}
function governCost(state, actor) {
    const progress = state.players.find((player)=>player.playerId === actor);
    return progress && progress.resources.culture >= 1 ? {
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])(),
        culture: 1
    } : {
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])(),
        wealth: 2
    };
}
function governBlock(state, actor, cityId) {
    const pair = cityPair(state, cityId);
    if (!pair || pair.ownerId !== actor) return 'Escolha uma cidade própria.';
    if (pair.meta.mood >= 6 && pair.meta.fortification.state === 'INTACT') return 'A cidade já está Próspera e íntegra: Governar não tem o que recuperar.';
    if (pair.meta.mood < 6 && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, actor).governFreeLevels === 0 && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, actor, governCost(state, actor))) return 'Governar custa 1 Cultura ou 2 Riqueza por nível de Ânimo.';
    return null;
}
function governCity(state, actor, cityId) {
    const blocked = governBlock(state, actor, cityId);
    if (blocked) throw new Error(blocked);
    const pair = cityPair(state, cityId);
    const reach = Math.max(1, operatingCapacity(state, cityId));
    const effects = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, actor);
    let moodGained = 0;
    while(moodGained < reach && pair.meta.mood < 6){
        // Conselho: the first level of each Governar is free (canon §16 "Governar custa 1 a menos").
        const free = moodGained < effects.governFreeLevels;
        if (!free && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, actor, governCost(state, actor))) break;
        if (!free) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, actor, governCost(state, actor));
        pair.meta.mood += 1;
        moodGained += 1;
    }
    if (effects.governKnowledge > 0) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, actor, {
        knowledge: effects.governKnowledge
    }, {
        category: 'other'
    });
    let repaired = false;
    if (pair.meta.fortification.state !== 'INTACT') {
        const free = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasUnlock"])(state, actor, 'rule:free-repair');
        const cost = {
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])(),
            stone: free ? 0 : 1
        };
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, actor, cost)) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, actor, cost);
            pair.meta.fortification = {
                ...pair.meta.fortification,
                state: pair.meta.fortification.state === 'BREACHED' ? 'DAMAGED' : 'INTACT'
            };
            repaired = true;
        }
    }
    return {
        moodGained,
        repaired
    };
}
}),
"[project]/packages/game-engine/dist/alpha-combat.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "combatConfigOf",
    ()=>combatConfigOf,
    "combatPreview",
    ()=>combatPreview,
    "isThreatTarget",
    ()=>isThreatTarget,
    "resolveBattle",
    ()=>resolveBattle,
    "resolveBattleWithFaces",
    ()=>resolveBattleWithFaces
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-threats.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cities$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-cities.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-institutions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-military.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-world.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-stack.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-naval.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-kits.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-threats.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-grades.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-shock.js [app-route] (ecmascript)");
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
const push = (list, source, amount)=>{
    if (amount !== 0) list.push({
        source,
        amount
    });
};
const byId = (a, b)=>a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const hasPower = (state, unit)=>state.rules.units[unit.kind].strength > 0;
function cityAt(state, target) {
    return state.core.players.flatMap((player)=>player.civilization.cities).find((city)=>city.hexId === target);
}
function sidesOf(state, actor, order) {
    const attackers = state.units.filter((unit)=>order.unitIds.includes(unit.id)).sort(byId);
    const city = cityAt(state, order.target);
    const defenderId = state.units.find((unit)=>unit.hexId === order.target && unit.ownerId !== actor)?.ownerId ?? city.ownerId;
    // Cargo does not fight at sea; it shares its fleet's fate (see settleCargo).
    const defenders = state.units.filter((unit)=>unit.hexId === order.target && unit.ownerId === defenderId && !unit.carrierId).sort(byId);
    const tile = state.core.map.find((candidate)=>candidate.id === order.target);
    return {
        attackerId: actor,
        defenderId,
        attackers,
        defenders,
        city,
        meta: city ? state.cities.find((candidate)=>candidate.cityId === city.id) : undefined,
        terrain: tile.terrain,
        hexId: order.target
    };
}
/** Every static (pre-dice) contribution of one side that is not a signature: terrain, amphibious landing, supply, technology, Leader and cards. */ function staticSide(state, sides, attacking) {
    const config = state.rules.combat;
    const owner = attacking ? sides.attackerId : sides.defenderId, units = attacking ? sides.attackers : sides.defenders;
    const fighters = units.filter((unit)=>hasPower(state, unit));
    const modifiers = [];
    const terrain = fighters.reduce((total, unit)=>total + state.rules.units[unit.kind].terrainModifiers[sides.terrain], 0);
    const landform = attacking ? 0 : sides.terrain === 'HILLS' ? config.hillDefense : sides.terrain === 'MOUNTAINS' ? config.mountainDefense : 0;
    push(modifiers, 'Terreno', terrain + landform);
    if (attacking && units.some((unit)=>unit.carrierId && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSignature"])(state, unit))) push(modifiers, 'Desembarque anfíbio', -1);
    if (fighters.some((unit)=>!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unitSupply"])(state, unit).supplied)) push(modifiers, 'Sem suprimento', -config.unsuppliedPenalty);
    const sources = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["strengthSources"])(state, owner);
    push(modifiers, 'Tecnologia', sources.technology);
    push(modifiers, 'Líder', sources.leader);
    push(modifiers, 'Cartas e efeitos', sources.other);
    return {
        owner,
        units,
        fighters,
        modifiers
    };
}
const piecesOf = (state, fighters)=>fighters.map((unit)=>({
            id: unit.id,
            kind: unit.kind,
            grade: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unitGrade"])(state, unit.ownerId, unit.kind),
            signature: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSignature"])(state, unit)
        }));
function combatPreview(state, actor, order) {
    const config = state.rules.combat;
    let blocked = null;
    try {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateMilitaryOrder"])(state, actor, order);
    } catch (error) {
        blocked = error instanceof Error ? error.message : 'Ordem inválida.';
    }
    const thresholds = {
        tie: config.mediumMargin - 1,
        decisive: config.largeMargin
    };
    const base = {
        dieFaces: config.dieFaces,
        thresholds,
        note: 'Cada peça de combate rola 1 dado tático na resolução; o resultado só existe depois da batalha. Δ = ataque − defesa.'
    };
    const terrain = state.core.map.find((tile)=>tile.id === order.target)?.terrain ?? 'UNKNOWN';
    if (blocked !== null) return {
        ok: false,
        blocked,
        target: order.target,
        terrain,
        ...base,
        attacker: {
            strength: 0,
            posture: order.posture,
            units: [],
            breakdown: [],
            total: 0
        },
        defender: null,
        advance: {
            total: 0,
            stays: 0,
            note: null
        }
    };
    if (isThreatTarget(state, actor, order)) return threatPreview(state, actor, order, base, thresholds);
    const sides = sidesOf(state, actor, order);
    const attack = staticSide(state, sides, true), defend = staticSide(state, sides, false);
    const fortification = sides.meta ? {
        ...sides.meta.fortification
    } : null;
    const input = {
        terrain: sides.terrain,
        city: sides.city !== undefined,
        fortification
    };
    const attackPieces = piecesOf(state, attack.fighters), defendPieces = piecesOf(state, defend.fighters);
    const attackSide = {
        pieces: attackPieces,
        posture: order.posture,
        flat: attack.modifiers
    }, defendSide = {
        pieces: defendPieces,
        posture: 'HOLD',
        flat: defend.modifiers
    };
    const attackBreakdown = [
        ...attack.modifiers,
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["signaturePassives"])(state, attackSide, true, {
            ...input,
            attacker: attackSide,
            defender: defendSide
        })
    ];
    const defenseBreakdown = [
        ...defend.modifiers,
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["signaturePassives"])(state, defendSide, false, {
            ...input,
            attacker: attackSide,
            defender: defendSide
        })
    ];
    if (fortification) push(defenseBreakdown, 'Fortificação', (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isFortified"])(fortification) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fortificationBonus"])(config, fortification) : 0);
    const seen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["visibleHexIds"])(state, actor).has(order.target);
    const room = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackRoom"])(state, actor, sides.attackers, order.target);
    const advance = {
        total: sides.attackers.length,
        stays: room.stays.length,
        note: room.stays.length ? `Limite de pilha atingido em ${order.target}: se vencer, ${room.fits.length} de ${sides.attackers.length} peças avançam e ${room.stays.length} permanecem em ${sides.attackers[0].hexId}.` : null
    };
    const power = (unit)=>state.rules.units[unit.kind].strength;
    const strength = (fighters)=>fighters.reduce((total, unit)=>total + power(unit), 0);
    const label = (unit)=>{
        const grade = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unitGrade"])(state, unit.ownerId, unit.kind);
        return {
            grade,
            grau: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GRADE_NUMERALS"][grade - 1]
        };
    };
    return {
        ok: true,
        blocked: null,
        target: order.target,
        terrain,
        ...base,
        advance,
        attacker: {
            strength: strength(attack.fighters),
            posture: order.posture,
            units: sides.attackers.map((unit)=>({
                    id: unit.id,
                    kind: unit.kind,
                    strength: power(unit),
                    ...label(unit)
                })),
            breakdown: attackBreakdown,
            total: strength(attack.fighters) + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sumOf"])(attackBreakdown)
        },
        defender: seen ? {
            visible: true,
            strength: strength(defend.fighters),
            units: sides.defenders.map((unit)=>({
                    kind: unit.kind,
                    strength: power(unit),
                    ...label(unit)
                })),
            breakdown: defenseBreakdown,
            fortification,
            posture: 'UNKNOWN'
        } : {
            visible: false,
            strength: 0,
            units: [],
            breakdown: [],
            fortification: null,
            posture: 'UNKNOWN'
        }
    };
}
function resolveBattle(state, actor, order) {
    resolveBattleWithFaces(state, actor, order);
}
function resolveBattleWithFaces(state, actor, order, forced) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateMilitaryOrder"])(state, actor, order);
    if (isThreatTarget(state, actor, order)) {
        resolveThreatAttack(state, actor, order, forced);
        return;
    }
    const sides = sidesOf(state, actor, order);
    const { attackers, defenders, defenderId, city } = sides;
    const tile = state.core.map.find((candidate)=>candidate.id === order.target);
    const attackerPosture = order.posture, defenderPosture = state.players.find((player)=>player.playerId === defenderId).defensePosture;
    const attack = staticSide(state, sides, true), defend = staticSide(state, sides, false);
    const before = sides.meta ? {
        ...sides.meta.fortification
    } : null;
    const shock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveShock"])(state, {
        attacker: {
            pieces: piecesOf(state, attack.fighters),
            posture: attackerPosture,
            flat: attack.modifiers
        },
        defender: {
            pieces: piecesOf(state, defend.fighters),
            posture: defenderPosture,
            flat: defend.modifiers
        },
        terrain: sides.terrain,
        city: city !== undefined,
        fortification: before,
        ...forced ? {
            forced
        } : {}
    });
    let fortification = null;
    if (sides.meta && city && before && shock.fortificationAfter) {
        if (shock.fortificationAfter.state !== before.state) sides.meta.fortification = {
            ...shock.fortificationAfter
        };
        fortification = {
            cityId: city.id,
            before,
            after: shock.fortificationAfter
        };
    }
    const { delta, outcome } = shock;
    const attackerAdvances = outcome !== 'TIE' && delta > 0;
    const winnerId = attackerAdvances ? actor : defenderId;
    const pool = (units)=>units;
    const fightersOf = (units)=>units.filter((unit)=>hasPower(state, unit));
    const losses = [];
    if (outcome === 'TIE') {
        if (fightersOf(attackers).length >= 2) losses.push(...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chooseLosses"])(state, pool(fightersOf(attackers)), 1));
        if (fightersOf(defenders).length >= 2) losses.push(...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chooseLosses"])(state, pool(fightersOf(defenders)), 1));
    } else {
        const losers = delta > 0 ? defenders : attackers;
        const fighters = fightersOf(losers);
        losses.push(...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chooseLosses"])(state, fighters.length ? fighters : losers, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["casualtyCount"])(outcome)));
    }
    const survivors = (delta > 0 && outcome !== 'TIE' ? defenders : []).filter((unit)=>!losses.includes(unit.id));
    // I-3: defenders inside a city hold it; it falls when nobody is left, or on a decisive victory with no Guarda alive.
    const captured = attackerAdvances && city !== undefined && city.ownerId !== actor && (survivors.length === 0 || outcome === 'DECISIVE' && !survivors.some((unit)=>unit.kind === 'GUARD'));
    const defendersLeave = attackerAdvances && (city === undefined || captured);
    let retreat = attackerAdvances ? null : attackers[0].hexId;
    if (defendersLeave && survivors.length) {
        retreat = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])(tile).map(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"]).sort().find((id)=>survivors.every((unit)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["canEnter"])(state, unit, id)) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackBlock"])(state, defenderId, survivors, id) === null && !state.units.some((unit)=>unit.hexId === id && unit.ownerId !== defenderId) && state.core.map.some((candidate)=>candidate.id === id && (candidate.ownerId === null || candidate.ownerId === defenderId))) ?? null;
        if (retreat) survivors.forEach((unit)=>{
            unit.hexId = retreat;
        });
        else losses.push(...survivors.map((unit)=>unit.id));
    }
    state.units = state.units.filter((unit)=>!losses.includes(unit.id));
    const attackerSurvivors = attackers.filter((unit)=>!losses.includes(unit.id));
    if (attackerAdvances) {
        state.players.find((player)=>player.playerId === actor).victories++;
        if (defendersLeave) {
            // Stack limits: only as many pieces as fit advance, in id order; the rest keep their hex.
            const { fits, stays } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackRoom"])(state, actor, attackerSurvivors, order.target);
            fits.forEach((unit)=>{
                unit.hexId = order.target;
                unit.carrierId = null;
            });
            if (stays.length) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'STACK_LIMIT', `Limite de pilha em ${order.target}: ${fits.length} peças avançaram e ${stays.length} permaneceram em ${stays[0].hexId}.`, [
                actor
            ]);
            if (captured && city) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cities$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["occupyCity"])(state, actor, city.id);
        }
        if (shock.boarding) blockPort(state, actor, defenderId, order.target);
    }
    state.battles.push({
        id: `battle-${state.battles.length + 1}`,
        round: state.core.round,
        hexId: order.target,
        attackerId: actor,
        defenderId,
        attackerUnits: attackers.map((unit)=>unit.id),
        defenderUnits: defenders.map((unit)=>unit.id),
        attackerPosture,
        defenderPosture,
        attackBreakdown: shock.attackBreakdown,
        defenseBreakdown: shock.defenseBreakdown,
        attackerTactical: shock.attackerRolls,
        defenderTactical: shock.defenderRolls,
        fortification,
        attackStrength: shock.attackStrength,
        defenseStrength: shock.defenseStrength,
        attackModifiers: shock.attackModifiers,
        defenseModifiers: shock.defenseModifiers,
        attackTotal: shock.attackTotal,
        defenseTotal: shock.defenseTotal,
        delta,
        outcome,
        winnerId,
        losses,
        retreat
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["settleCargo"])(state);
}
const combatConfigOf = (state)=>state.rules.combat;
/** Frota Abordagem: the defender's nearest port within one hex of the battle stays shut through the next round. */ function blockPort(state, attacker, defender, target) {
    const tile = state.core.map.find((candidate)=>candidate.id === target);
    const near = new Set([
        target,
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])(tile).map(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"])
    ]);
    const city = state.core.players.find((player)=>player.id === defender).civilization.cities.filter((candidate)=>near.has(candidate.hexId) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isPort"])(state, candidate.hexId)).sort((a, b)=>a.id.localeCompare(b.id))[0];
    const meta = city ? state.cities.find((candidate)=>candidate.cityId === city.id) : undefined;
    if (!city || !meta) return;
    meta.portBlockedUntil = state.core.round + 1;
    meta.portBlockedBy = attacker;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'PORT_BLOCKED', `Abordagem: o porto de ${city.name} está bloqueado até o fim da próxima rodada.`, [
        attacker,
        defender
    ]);
}
function isThreatTarget(state, actor, order) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatAt"])(state, order.target) !== undefined && !state.units.some((unit)=>unit.hexId === order.target && unit.ownerId !== actor) && cityAt(state, order.target) === undefined;
}
function threatPreview(state, actor, order, base, _thresholds) {
    void _thresholds;
    const threat = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatAt"])(state, order.target), tile = state.core.map.find((candidate)=>candidate.id === order.target);
    const sides = {
        attackerId: actor,
        defenderId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["WORLD_ID"],
        attackers: state.units.filter((unit)=>order.unitIds.includes(unit.id)).sort(byId),
        defenders: [],
        city: undefined,
        meta: undefined,
        terrain: tile.terrain,
        hexId: order.target
    };
    const attack = staticSide(state, sides, true), flat = [];
    push(flat, 'Terreno', (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["landform"])(state, tile.terrain));
    const seen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["visibleHexIds"])(state, actor).has(order.target);
    const room = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackRoom"])(state, actor, sides.attackers, order.target);
    const power = (kind)=>state.rules.units[kind].strength;
    const pieces = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatPieces"])(threat);
    const label = (unit)=>{
        const grade = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unitGrade"])(state, unit.ownerId, unit.kind);
        return {
            grade,
            grau: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GRADE_NUMERALS"][grade - 1]
        };
    };
    const attackPieces = piecesOf(state, attack.fighters);
    const attackBreakdown = [
        ...attack.modifiers,
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["signaturePassives"])(state, {
            pieces: attackPieces,
            posture: order.posture,
            flat: attack.modifiers
        }, true, {
            attacker: {
                pieces: attackPieces,
                posture: order.posture,
                flat: attack.modifiers
            },
            defender: {
                pieces,
                posture: 'HOLD',
                flat
            },
            terrain: tile.terrain,
            city: false,
            fortification: null
        })
    ];
    return {
        ok: true,
        blocked: null,
        target: order.target,
        terrain: tile.terrain,
        ...base,
        advance: {
            total: sides.attackers.length,
            stays: room.stays.length,
            note: null
        },
        attacker: {
            strength: attack.fighters.reduce((total, unit)=>total + power(unit.kind), 0),
            posture: order.posture,
            units: sides.attackers.map((unit)=>({
                    id: unit.id,
                    kind: unit.kind,
                    strength: power(unit.kind),
                    ...label(unit)
                })),
            breakdown: attackBreakdown,
            total: attack.fighters.reduce((total, unit)=>total + power(unit.kind), 0) + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sumOf"])(attackBreakdown)
        },
        defender: seen ? {
            visible: true,
            strength: pieces.reduce((total, piece)=>total + power(piece.kind), 0),
            units: pieces.map((piece)=>({
                    kind: piece.kind,
                    strength: power(piece.kind),
                    grade: 1,
                    grau: 'I'
                })),
            breakdown: flat,
            fortification: null,
            posture: 'UNKNOWN'
        } : {
            visible: false,
            strength: 0,
            units: [],
            breakdown: [],
            fortification: null,
            posture: 'UNKNOWN'
        }
    };
}
/** A player attacks a camp, a Bando or a pirate hold with the same shock core (design I-21, I-22). */ function resolveThreatAttack(state, actor, order, forced) {
    const threat = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatAt"])(state, order.target), tile = state.core.map.find((candidate)=>candidate.id === order.target);
    const attackers = state.units.filter((unit)=>order.unitIds.includes(unit.id)).sort(byId);
    const sides = {
        attackerId: actor,
        defenderId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["WORLD_ID"],
        attackers,
        defenders: [],
        city: undefined,
        meta: undefined,
        terrain: tile.terrain,
        hexId: order.target
    };
    const attack = staticSide(state, sides, true), flat = [];
    push(flat, 'Terreno', (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["landform"])(state, tile.terrain));
    const defenders = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatPieces"])(threat);
    const shock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveShock"])(state, {
        attacker: {
            pieces: piecesOf(state, attack.fighters),
            posture: order.posture,
            flat: attack.modifiers
        },
        defender: {
            pieces: defenders,
            posture: 'HOLD',
            flat
        },
        terrain: tile.terrain,
        city: false,
        fortification: null,
        ...forced ? {
            forced
        } : {}
    });
    const { delta, outcome } = shock;
    const attackerLosses = [], threatLosses = [];
    if (outcome === 'TIE') {
        if (attack.fighters.length >= 2) attackerLosses.push(...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chooseLosses"])(state, attack.fighters, 1));
        if (defenders.length >= 2) threatLosses.push(...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chooseLosses"])(state, defenders, 1));
    } else if (delta > 0) threatLosses.push(...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chooseLosses"])(state, defenders, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["casualtyCount"])(outcome)));
    else attackerLosses.push(...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chooseLosses"])(state, attack.fighters.length ? attack.fighters : attackers, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["casualtyCount"])(outcome)));
    const destroyed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["removeThreatPieces"])(state, threat, threatLosses);
    state.units = state.units.filter((unit)=>!attackerLosses.includes(unit.id));
    if (destroyed) {
        state.telemetry.threatLosses++;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["payThreatReward"])(state, actor, threat);
    }
    const survivors = attackers.filter((unit)=>!attackerLosses.includes(unit.id));
    const advances = destroyed && outcome !== 'TIE' && delta > 0;
    if (advances) {
        const { fits } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackRoom"])(state, actor, survivors, order.target);
        fits.forEach((unit)=>{
            unit.hexId = order.target;
            unit.carrierId = null;
        });
    }
    state.telemetry.threatAttacks++;
    state.battles.push({
        id: `battle-${state.battles.length + 1}`,
        round: state.core.round,
        hexId: order.target,
        attackerId: actor,
        defenderId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["WORLD_ID"],
        attackerUnits: attackers.map((unit)=>unit.id),
        defenderUnits: defenders.map((piece)=>piece.id),
        attackerPosture: order.posture,
        defenderPosture: 'HOLD',
        attackBreakdown: shock.attackBreakdown,
        defenseBreakdown: shock.defenseBreakdown,
        attackerTactical: shock.attackerRolls,
        defenderTactical: shock.defenderRolls,
        fortification: null,
        attackStrength: shock.attackStrength,
        defenseStrength: shock.defenseStrength,
        attackModifiers: shock.attackModifiers,
        defenseModifiers: shock.defenseModifiers,
        attackTotal: shock.attackTotal,
        defenseTotal: shock.defenseTotal,
        delta,
        outcome,
        winnerId: outcome !== 'TIE' && delta > 0 ? actor : __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["WORLD_ID"],
        losses: [
            ...attackerLosses,
            ...threatLosses
        ],
        retreat: advances ? null : attackers[0].hexId
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'THREAT_BATTLE', `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatName"])(threat)} em ${order.target}: Δ ${delta > 0 ? '+' : ''}${delta}${destroyed ? ', destruído' : ''}.`, [
        actor
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["settleCargo"])(state);
}
}),
"[project]/packages/game-engine/dist/alpha-culture.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "contestPresence",
    ()=>contestPresence,
    "culturalIdentityOf",
    ()=>culturalIdentityOf,
    "culturalPresenceCount",
    ()=>culturalPresenceCount,
    "culturalPresenceView",
    ()=>culturalPresenceView,
    "establishCulturalPresence",
    ()=>establishCulturalPresence,
    "refreshCulturalMetrics",
    ()=>refreshCulturalMetrics
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-random.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-kits.js [app-route] (ecmascript)");
;
;
;
;
const levels = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CulturalPresenceLevelSchema"].options;
const rank = (presence)=>levels.indexOf(presence.level);
const promoted = (presence)=>({
        ...presence,
        level: levels[Math.min(levels.length - 1, rank(presence) + 1)]
    });
function culturalIdentityOf(state, playerId) {
    const civilization = state.players.find((player)=>player.playerId === playerId)?.civilization;
    return civilization ?? state.cities.find((city)=>city.originalOwnerId === playerId)?.nativeIdentity ?? `native-${playerId}`;
}
function playerForCivilization(state, civilizationId) {
    return state.players.find((player)=>culturalIdentityOf(state, player.playerId) === civilizationId);
}
function refreshCulturalMetrics(state) {
    for (const player of state.players){
        const civilization = culturalIdentityOf(state, player.playerId);
        player.influencedCities = state.cities.filter((city)=>city.currentOwnerId !== player.playerId && city.foreignPresence.some((presence)=>presence.civilizationId === civilization)).map((city)=>city.cityId).sort();
        player.foreignInfluence = player.influencedCities.length;
    }
}
function culturalPresenceCount(state, actor) {
    const civilization = culturalIdentityOf(state, actor);
    return state.cities.filter((city)=>city.currentOwnerId !== actor && city.foreignPresence.some((presence)=>presence.civilizationId === civilization)).length;
}
function establishCulturalPresence(state, actor, cityId) {
    const city = state.cities.find((candidate)=>candidate.cityId === cityId);
    if (!city || city.currentOwnerId === actor) throw new Error('A presença cultural exige uma cidade estrangeira.');
    const civilizationId = culturalIdentityOf(state, actor);
    if (city.foreignPresence.some((presence)=>presence.civilizationId === civilizationId)) throw new Error('Sua civilização já mantém presença nesta cidade.');
    if (city.foreignPresence.length >= state.rules.balance.cultureSlots) throw new Error('A cidade já ocupa os três espaços de presença cultural.');
    city.foreignPresence.push({
        civilizationId,
        level: 'CONTACT'
    });
    refreshCulturalMetrics(state);
}
function modifier(state, civilizationId, presence, anchor) {
    const player = playerForCivilization(state, civilizationId);
    if (!player) return rank(presence);
    const culturalDistricts = state.core.players.find((owner)=>owner.id === player.playerId)?.civilization.cities.reduce((total, city)=>total + city.districts.filter((district)=>district.type === 'CULTURAL').length, 0) ?? 0;
    return rank(presence) + Math.min(state.rules.balance.cultureSlots, culturalDistricts) + Number(anchor === civilizationId);
}
function removeOrDemote(list, civilizationId) {
    const presence = list.find((candidate)=>candidate.civilizationId === civilizationId);
    if (presence.level === 'CONTACT') return list.filter((candidate)=>candidate.civilizationId !== civilizationId);
    const next = levels[Math.max(0, rank(presence) - 1)];
    return list.map((candidate)=>candidate.civilizationId === civilizationId ? {
            ...candidate,
            level: next
        } : candidate);
}
function contestPresence(state, actor, command) {
    const city = state.cities.find((candidate)=>candidate.cityId === command.cityId);
    if (!city) throw new Error('Cidade desconhecida.');
    const attackerCivilizationId = culturalIdentityOf(state, actor);
    if (city.currentOwnerId === actor) throw new Error('Não dispute presença estrangeira em uma cidade própria.');
    if (attackerCivilizationId === command.defenderCivilizationId) throw new Error('Escolha outra presença para disputar.');
    const attacker = city.foreignPresence.find((presence)=>presence.civilizationId === attackerCivilizationId);
    const defender = city.foreignPresence.find((presence)=>presence.civilizationId === command.defenderCivilizationId);
    if (!attacker || !defender) throw new Error('As duas civilizações precisam manter presença nesta cidade.');
    const attackDice = [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRandomInteger"])(state, 6) + 1,
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRandomInteger"])(state, 6) + 1
    ];
    const defenseDice = [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRandomInteger"])(state, 6) + 1,
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRandomInteger"])(state, 6) + 1
    ];
    const attackModifier = modifier(state, attackerCivilizationId, attacker, city.culturalAnchor);
    const defenseModifier = modifier(state, command.defenderCivilizationId, defender, city.culturalAnchor) + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitCultureDefense"])(state, command.defenderCivilizationId);
    const attackTotal = attackDice[0] + attackDice[1] + attackModifier;
    const defenseTotal = defenseDice[0] + defenseDice[1] + defenseModifier;
    const attackerWins = attackTotal > defenseTotal;
    const winnerCivilizationId = attackerWins ? attackerCivilizationId : command.defenderCivilizationId;
    const loserCivilizationId = attackerWins ? command.defenderCivilizationId : attackerCivilizationId;
    city.foreignPresence = removeOrDemote(city.foreignPresence, loserCivilizationId).map((presence)=>presence.civilizationId === winnerCivilizationId ? promoted(presence) : presence);
    const winner = city.foreignPresence.find((presence)=>presence.civilizationId === winnerCivilizationId);
    const loser = city.foreignPresence.find((presence)=>presence.civilizationId === loserCivilizationId);
    if (loser && rank(loser) > rank(winner)) loser.level = winner.level;
    if (city.culturalAnchor === loserCivilizationId) city.culturalAnchor = null;
    if (winner.level === 'PREDOMINANT') city.culturalAnchor = winnerCivilizationId;
    city.localCohesion = Math.max(0, Math.min(100, city.localCohesion + (attackerWins ? -5 : 5)));
    state.cultureContests.push({
        id: `culture-${state.cultureContests.length + 1}`,
        round: state.core.round,
        cityId: city.cityId,
        attackerCivilizationId,
        defenderCivilizationId: command.defenderCivilizationId,
        attackDice,
        defenseDice,
        attackModifier,
        defenseModifier,
        attackTotal,
        defenseTotal,
        winnerCivilizationId,
        loserCivilizationId
    });
    state.telemetry.culturalContests += 1;
    state.telemetry.culturalContestResults[winnerCivilizationId] = (state.telemetry.culturalContestResults[winnerCivilizationId] ?? 0) + 1;
    refreshCulturalMetrics(state);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'CULTURAL_CONTEST', `Disputa cultural resolvida em ${city.cityId}.`);
}
function culturalPresenceView(state, actor) {
    const known = new Set(state.players.find((player)=>player.playerId === actor)?.knownHexIds ?? []);
    const hexByCity = new Map(state.core.players.flatMap((owner)=>owner.civilization.cities.map((city)=>[
                city.id,
                city.hexId
            ])));
    return state.cities.filter((city)=>known.has(hexByCity.get(city.cityId))).map((city)=>({
            cityId: city.cityId,
            currentOwnerId: city.currentOwnerId,
            foreignPresence: city.foreignPresence.map((presence)=>({
                    ...presence
                })),
            localCohesion: city.currentOwnerId === actor ? city.localCohesion : null,
            culturalAnchor: city.culturalAnchor
        }));
}
}),
"[project]/packages/game-engine/dist/alpha-diplomacy.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "atWar",
    ()=>atWar,
    "bordersOpen",
    ()=>bordersOpen,
    "diplomacyBlock",
    ()=>diplomacyBlock,
    "enemyCityAt",
    ()=>enemyCityAt,
    "establishRoute",
    ()=>establishRoute,
    "hasTreaty",
    ()=>hasTreaty,
    "maintainTrade",
    ()=>maintainTrade,
    "manageDiplomacy",
    ()=>manageDiplomacy,
    "movementOpen",
    ()=>movementOpen,
    "resolveInfluence",
    ()=>resolveInfluence,
    "settleTreaties",
    ()=>settleTreaties,
    "tradePath",
    ()=>tradePath,
    "validateInfluence",
    ()=>validateInfluence
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$culture$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-culture.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-kits.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-government.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
;
;
;
;
;
;
;
function enterWar(state, actor, target) {
    if (atWar(state, actor, target)) return;
    state.wars.push([
        actor,
        target
    ].sort());
    const player = state.players.find((p)=>p.playerId === actor);
    for (const treaty of state.treaties)if ([
        'ACTIVE',
        'ACCEPTED'
    ].includes(treaty.status) && [
        treaty.proposerId,
        treaty.recipientId
    ].includes(actor) && [
        treaty.proposerId,
        treaty.recipientId
    ].includes(target)) {
        treaty.status = 'ENDED';
        player.prestige = Math.max(0, player.prestige - 2);
    }
}
function atWar(state, a, b) {
    return state.wars.some((pair)=>pair.includes(a) && pair.includes(b));
}
function hasTreaty(state, a, b, type) {
    return state.treaties.some((t)=>t.status === 'ACTIVE' && t.type === type && [
            t.proposerId,
            t.recipientId
        ].includes(a) && [
            t.proposerId,
            t.recipientId
        ].includes(b) && t.expiresRound >= state.core.round);
}
function bordersOpen(state, actor, owner) {
    return owner === null || owner === actor || !atWar(state, actor, owner) && (hasTreaty(state, actor, owner, 'OPEN_BORDERS') || hasTreaty(state, actor, owner, 'ALLIANCE'));
}
function movementOpen(state, actor, owner) {
    return bordersOpen(state, actor, owner) || owner !== null && atWar(state, actor, owner);
}
const foreignCityAt = (state, actor, hex)=>state.core.players.some((p)=>p.id !== actor && p.civilization.cities.some((c)=>c.hexId === hex));
const enemyCityAt = (state, actor, hex)=>foreignCityAt(state, actor, hex) && state.core.players.some((p)=>p.id !== actor && atWar(state, actor, p.id) && p.civilization.cities.some((c)=>c.hexId === hex));
function diplomacyBlock(state, actor, command) {
    const player = state.players.find((candidate)=>candidate.playerId === actor);
    if (!player) return 'Jogador não encontrado.';
    const target = command.type === 'DECLARE_WAR' ? command.targetId : command.recipientId;
    if (!player.contacts.includes(target) || target === actor) return 'Estabeleça contato antes de negociar ou declarar guerra.';
    if (command.type === 'DECLARE_WAR') {
        if (atWar(state, actor, target)) return 'As civilizações já estão em guerra.';
        if (player.plannedActions.some((action)=>action.type === 'DECLARE_WAR' && action.targetId === target)) return 'Uma declaração de guerra contra esta civilização já está planejada.';
        // República (canon §16): declaring war costs 1 Influência extra (the Influência Order is the declaration's own).
        const extra = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, actor).warExtraInfluence;
        if (extra > 0 && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, actor, {
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])(),
            influence: extra
        })) return `Sob a República, declarar guerra custa ${extra} Influência.`;
        return null;
    }
    const sameTreaty = (proposerId, recipientId, type)=>[
            proposerId,
            recipientId
        ].includes(actor) && [
            proposerId,
            recipientId
        ].includes(target) && type === command.treaty;
    if (state.treaties.some((treaty)=>[
            'PROPOSED',
            'ACCEPTED',
            'ACTIVE'
        ].includes(treaty.status) && sameTreaty(treaty.proposerId, treaty.recipientId, treaty.type))) return 'Já existe um acordo deste tipo em análise ou ativo.';
    if (state.players.some((owner)=>owner.plannedActions.some((action)=>action.type === 'PROPOSE_TREATY' && sameTreaty(owner.playerId, action.recipientId, action.treaty)))) return 'Um acordo deste tipo já está planejado entre estas civilizações.';
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, actor, command.deal.give)) return 'Recursos insuficientes para oferecer este acordo.';
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, target, command.deal.receive)) return 'A outra civilização não possui agora os recursos solicitados.';
    return null;
}
function manageDiplomacy(state, actor, command) {
    const player = state.players.find((p)=>p.playerId === actor);
    if (command.type === 'PROPOSE_TREATY' || command.type === 'DECLARE_WAR') {
        const blocked = diplomacyBlock(state, actor, command);
        if (blocked) throw new Error(blocked);
        const target = command.type === 'DECLARE_WAR' ? command.targetId : command.recipientId;
        if (command.type === 'DECLARE_WAR') {
            // Only the original defender calls partners; no recursive alliance chain.
            const defenders = state.initiative.filter((id)=>id !== actor && id !== target && (hasTreaty(state, target, id, 'DEFENSIVE_PACT') || hasTreaty(state, target, id, 'ALLIANCE')));
            const extra = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, actor).warExtraInfluence;
            if (extra > 0) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, actor, {
                ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])(),
                influence: extra
            });
            enterWar(state, actor, target);
            for (const defender of defenders)enterWar(state, defender, actor);
            return;
        }
        const source = command.planId ?? String(state.version);
        state.treaties.push({
            id: `treaty-${actor}-${source}`,
            proposerId: actor,
            recipientId: target,
            type: command.treaty,
            status: 'PROPOSED',
            deal: command.deal,
            createdRound: state.core.round,
            expiresRound: state.core.round + state.rules.treatyDuration
        });
        return;
    }
    const treaty = state.treaties.find((t)=>t.id === command.treatyId);
    if (!treaty) throw new Error('Acordo desconhecido.');
    if (command.type === 'RESPOND_TREATY') {
        if (treaty.recipientId !== actor || treaty.status !== 'PROPOSED') throw new Error('Somente o destinatário pode responder a esta proposta.');
        treaty.status = command.accept ? 'ACCEPTED' : 'DECLINED';
    } else {
        if (![
            treaty.proposerId,
            treaty.recipientId
        ].includes(actor)) throw new Error('Você não participa deste acordo.');
        if (treaty.status === 'ACTIVE') player.prestige = Math.max(0, player.prestige - 2);
        treaty.status = 'ENDED';
    }
}
function settleTreaties(state) {
    const pending = state.treaties.filter((t)=>t.status === 'ACCEPTED').sort((a, b)=>state.initiative.indexOf(a.proposerId) - state.initiative.indexOf(b.proposerId) || (a.id < b.id ? -1 : 1));
    for (const treaty of pending){
        const a = state.core.players.find((p)=>p.id === treaty.proposerId), b = state.core.players.find((p)=>p.id === treaty.recipientId);
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, a.id, treaty.deal.give) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, b.id, treaty.deal.receive)) {
            treaty.status = 'DECLINED';
            continue;
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, a.id, treaty.deal.give);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, b.id, treaty.deal.receive);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, a.id, treaty.deal.receive, {
            category: 'trade'
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, b.id, treaty.deal.give, {
            category: 'trade'
        });
        treaty.status = 'ACTIVE';
        treaty.expiresRound += (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitTreatyRounds"])(state, a.id, b.id);
        if ([
            'NON_AGGRESSION_PACT',
            'ALLIANCE'
        ].includes(treaty.type)) state.wars = state.wars.filter((pair)=>!pair.includes(a.id) || !pair.includes(b.id));
    }
}
function tradePath(state, actor, fromCityId, toCityId) {
    const cities = state.core.players.flatMap((p)=>p.civilization.cities);
    const from = cities.find((c)=>c.id === fromCityId && c.ownerId === actor), to = cities.find((c)=>c.id === toCityId);
    if (!from || !to || from.id === to.id) throw new Error('Escolha duas cidades distintas e uma origem própria.');
    if (to.ownerId !== actor && (!hasTreaty(state, actor, to.ownerId, 'TRADE_AGREEMENT') || atWar(state, actor, to.ownerId) || hasTreaty(state, actor, to.ownerId, 'EMBARGO'))) throw new Error('Comércio internacional requer acordo ativo, paz e ausência de embargo.');
    // The trade agreement itself opens the partner's territory to the route (caravans, not armies).
    const partner = to.ownerId !== actor ? to.ownerId : null;
    const known = new Set(state.players.find((p)=>p.playerId === actor).knownHexIds);
    const byId = new Map(state.core.map.map((t)=>[
            t.id,
            t
        ]));
    const queue = [
        [
            from.hexId
        ]
    ], seen = new Set([
        from.hexId
    ]);
    for(let i = 0; i < queue.length; i++){
        const path = queue[i];
        const id = path.at(-1);
        if (id === to.hexId) return path;
        for (const point of (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])(byId.get(id))){
            const next = byId.get((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"])(point));
            if (next && known.has(next.id) && !seen.has(next.id) && (bordersOpen(state, actor, next.ownerId) || next.ownerId === partner)) {
                seen.add(next.id);
                queue.push([
                    ...path,
                    next.id
                ]);
            }
        }
    }
    throw new Error('Não há caminho conhecido com acesso permitido entre essas cidades.');
}
function establishRoute(state, actor, order) {
    if (state.routes.some((r)=>r.ownerId === actor && r.fromCityId === order.fromCityId && r.toCityId === order.toCityId)) throw new Error('Esta rota já existe.');
    state.routes.push({
        id: `route-${actor}-${state.version}-${state.routes.length}`,
        ownerId: actor,
        fromCityId: order.fromCityId,
        toCityId: order.toCityId,
        path: tradePath(state, actor, order.fromCityId, order.toCityId),
        suspended: false
    });
}
function maintainTrade(state) {
    state.treaties.forEach((t)=>{
        if (t.expiresRound < state.core.round && [
            'ACTIVE',
            'PROPOSED',
            'ACCEPTED'
        ].includes(t.status)) t.status = 'ENDED';
    });
    for (const route of state.routes){
        try {
            route.path = tradePath(state, route.ownerId, route.fromCityId, route.toCityId);
            route.suspended = false;
        } catch  {
            route.suspended = true;
            continue;
        }
    }
}
function validateInfluence(state, actor, order) {
    const player = state.players.find((p)=>p.playerId === actor);
    const envoy = state.units.find((u)=>u.id === order.unitId && u.ownerId === actor && u.kind === 'ENVOY');
    const city = state.core.players.flatMap((p)=>p.civilization.cities).find((c)=>c.hexId === order.target && c.ownerId !== actor);
    if (!envoy || !city || !player.knownHexIds.includes(order.target)) throw new Error('Escolha um Enviado próprio junto a uma cidade estrangeira conhecida.');
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(state.core.map.find((t)=>t.id === envoy.hexId), state.core.map.find((t)=>t.id === city.hexId)) > 1) throw new Error('O Enviado precisa estar na cidade ou em um hex adjacente.');
    if (atWar(state, actor, city.ownerId)) throw new Error('Uma missão de influência requer paz.');
    const meta = state.cities.find((candidate)=>candidate.cityId === city.id);
    const civilization = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$culture$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["culturalIdentityOf"])(state, actor);
    if (meta.foreignPresence.some((presence)=>presence.civilizationId === civilization)) throw new Error('Sua civilização já mantém influência nesta cidade.');
    if (meta.foreignPresence.length >= state.rules.balance.cultureSlots) throw new Error('A cidade já ocupa os três espaços de presença cultural.');
}
function resolveInfluence(state, actor, order) {
    validateInfluence(state, actor, order);
    const player = state.players.find((p)=>p.playerId === actor);
    const city = state.core.players.flatMap((p)=>p.civilization.cities).find((c)=>c.hexId === order.target);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$culture$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["establishCulturalPresence"])(state, actor, city.id);
    if (!player.contacts.includes(city.ownerId)) player.contacts.push(city.ownerId);
    const other = state.players.find((p)=>p.playerId === city.ownerId);
    if (!other.contacts.includes(actor)) other.contacts.push(actor);
}
}),
"[project]/packages/game-engine/dist/alpha-discoveries.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "applyDiscovery",
    ()=>applyDiscovery,
    "explorationHints",
    ()=>explorationHints,
    "generateDiscoveries",
    ()=>generateDiscoveries
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-threats.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$regions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-regions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-world.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-random.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-water.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resonance.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-threats.js [app-route] (ecmascript)");
;
;
;
;
;
;
;
;
;
const tileOf = (state, id)=>state.core.map.find((tile)=>tile.id === id);
const hasWater = (state, region)=>region.hexIds.some((id)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isNavigableWater"])(tileOf(state, id)));
function generateDiscoveries(state) {
    const total = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DISCOVERY_WEIGHTS"].reduce((sum, [, weight])=>sum + weight, 0);
    for (const region of [
        ...state.regions
    ].sort((a, b)=>a.id < b.id ? -1 : 1)){
        const template = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$regions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REGION_TEMPLATES"].find((candidate)=>candidate.id === region.templateId);
        if (template?.kind !== 'FRONTIER') {
            region.discovery = {
                kind: 'NONE',
                resolved: true,
                resolvedBy: null
            };
            continue;
        }
        let roll = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRandomInteger"])(state, total), kind = 'NONE';
        for (const [candidate, weight] of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DISCOVERY_WEIGHTS"]){
            if (roll < weight) {
                kind = candidate;
                break;
            }
            roll -= weight;
        }
        if (kind === 'ANCHORAGE' && !hasWater(state, region)) kind = 'NONE';
        region.discovery = {
            kind,
            resolved: kind === 'NONE',
            resolvedBy: null
        };
    }
}
function applyDiscovery(state, actor, region, unitId) {
    const discovery = region.discovery;
    if (!discovery || discovery.resolved) return;
    discovery.resolved = true;
    discovery.resolvedBy = actor;
    const player = state.players.find((candidate)=>candidate.playerId === actor);
    const land = region.hexIds.map((id)=>tileOf(state, id)).filter((tile)=>tile && ![
            'SEA',
            'UNKNOWN'
        ].includes(tile.terrain));
    const say = (message)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'DISCOVERY', `${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DISCOVERY_NAMES"][discovery.kind]}: ${message}`, [
            actor
        ]);
    switch(discovery.kind){
        case 'RUIN':
            {
                const ruins = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ENCOUNTER_CARDS"].filter((card)=>card.id.startsWith('enc-ruin-')), card = ruins[(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRandomInteger"])(state, ruins.length)];
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addPendingChoice"])(state, actor, {
                    source: 'ENCOUNTER',
                    cardId: card.id,
                    title: card.title,
                    text: card.text,
                    mitigated: false,
                    options: card.options
                });
                say('os exploradores encontraram algo que pede uma escolha.');
                break;
            }
        case 'DEPOSIT':
            {
                const rock = land.find((tile)=>[
                        'HILLS',
                        'MOUNTAINS'
                    ].includes(tile.terrain));
                if (rock && !rock.features.includes('METAL')) rock.features = [
                    ...rock.features,
                    'METAL'
                ];
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, actor, {
                    stone: 2,
                    metal: 1
                });
                say('uma jazida rara rendeu +2 Pedra e +1 Metal.');
                break;
            }
        case 'PASSAGE':
            {
                const centre = tileOf(state, region.hexIds[0]);
                const path = [
                    centre,
                    ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])(centre).map((point)=>tileOf(state, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"])(point))).filter((tile)=>tile && region.hexIds.includes(tile.id) && ![
                            'SEA',
                            'MOUNTAINS'
                        ].includes(tile.terrain))
                ].slice(0, 3);
                for (const tile of path)if (tile && ![
                    'SEA',
                    'MOUNTAINS'
                ].includes(tile.terrain) && !state.roads.includes(tile.id)) state.roads.push(tile.id);
                say('uma passagem natural abriu estradas na região.');
                break;
            }
        case 'ANCHORAGE':
            {
                const coast = land.find((tile)=>tile.terrain === 'COAST');
                if (coast && !coast.features.includes('FISH')) coast.features = [
                    ...coast.features,
                    'FISH'
                ];
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, actor, {
                    wealth: 1
                });
                say('um ancoradouro natural: +1 Riqueza e boa pesca na costa.');
                break;
            }
        case 'DANGER':
            {
                const protectedBy = player.research.includes('web-experimental-method');
                const unit = state.units.find((candidate)=>candidate.id === unitId && candidate.ownerId === actor);
                if (!protectedBy && unit && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRandomInteger"])(state, 2) === 0) {
                    state.units = state.units.filter((candidate)=>candidate.id !== unit.id);
                    say('o perigo custou a peça que explorava.');
                } else say(protectedBy ? 'o Método Experimental evitou o pior.' : 'a expedição escapou por pouco.');
                break;
            }
        case 'CAMP':
            {
                say('um acampamento bárbaro se esconde na região.');
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyThreatCommand"])(state, actor, {
                    op: 'THREAT',
                    command: 'SPAWN',
                    kind: 'LAND'
                }, region.hexIds);
                break;
            }
        case 'NONE':
            break;
    }
}
const BIOME_NAMES = {
    PLAINS: 'planície',
    FOREST: 'floresta',
    HILLS: 'colinas',
    MOUNTAINS: 'montanhas',
    COAST: 'costa',
    SEA: 'mar'
};
function explorationHints(state, actor) {
    const player = state.players.find((candidate)=>candidate.playerId === actor);
    if (!player) return [];
    const math = player.research.includes('web-mathematics'), method = player.research.includes('web-experimental-method'), cartography = player.research.includes('web-cartography');
    if (!math && !method && !cartography) return [];
    const mine = state.units.filter((unit)=>unit.ownerId === actor).map((unit)=>tileOf(state, unit.hexId)).filter(Boolean);
    return state.regions.filter((region)=>!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["regionOpenFor"])(state, region, actor) && region.hexIds.some((id)=>mine.some((tile)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(tile, tileOf(state, id)) <= 4))).map((region)=>{
        const counts = new Map();
        for (const id of region.hexIds){
            const terrain = tileOf(state, id)?.terrain ?? 'UNKNOWN';
            counts.set(terrain, (counts.get(terrain) ?? 0) + 1);
        }
        const dominant = [
            ...counts
        ].sort((a, b)=>b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] ?? 'UNKNOWN';
        return {
            regionId: region.id,
            biome: math ? BIOME_NAMES[dominant] ?? null : null,
            danger: method ? region.discovery?.kind === 'DANGER' || region.discovery?.kind === 'CAMP' : null,
            coast: method || cartography ? hasWater(state, region) : null
        };
    });
}
}),
"[project]/packages/game-engine/dist/alpha-era-turn.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "enterEraTurn",
    ()=>enterEraTurn,
    "finishEraTurn",
    ()=>finishEraTurn,
    "governmentOptions",
    ()=>governmentOptions,
    "governmentReformBlock",
    ()=>governmentReformBlock,
    "isEraTurnDue",
    ()=>isEraTurnDue,
    "isReformRound",
    ()=>isReformRound,
    "reformCost",
    ()=>reformCost
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-government.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-city.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-institutions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-cards.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resonance.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-threats.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$phases$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-phases.js [app-route] (ecmascript)");
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
const isEraTurnDue = (state)=>state.core.round % state.rules.roundsPerEra === 0 && state.core.round < state.rules.roundLimit;
const isReformRound = isEraTurnDue;
const reformCost = (era)=>[
        'FOUNDATION',
        'EXPANSION',
        'CONSOLIDATION'
    ].includes(era) ? 4 : 6;
function governmentReformBlock(state, actor, government) {
    const player = state.players.find((candidate)=>candidate.playerId === actor);
    const owner = state.core.players.find((candidate)=>candidate.id === actor);
    if (owner.civilization.government === government) return 'Sua civilização já vive sob este governo.';
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasUnlock"])(state, actor, `government:${government}`)) return 'Este governo exige o avanço da Teia que o abre.';
    if (government === 'AUTOCRACY' && !player.research.includes('web-fortification')) return 'A Autocracia exige Centralização e Fortificação.';
    if (player.governmentReformEra === player.era) return 'Cada civilização reforma o governo no máximo uma vez por Era.';
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, actor, {
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])(),
        influence: reformCost(player.era)
    })) return `A reforma custa ${reformCost(player.era)} Influência.`;
    return null;
}
function governmentOptions(state, actor) {
    const player = state.players.find((candidate)=>candidate.playerId === actor);
    const planned = player.plannedActions.find((action)=>action.type === 'GOVERNMENT_REFORM');
    return {
        /** The government in force: its name, two advantages and one limitation (canon §16), straight from `governmentEffects`. */ current: (({ government, name, advantages, limitation })=>({
                government,
                name,
                advantages,
                limitation
            }))((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, actor)),
        window: isEraTurnDue(state),
        cost: reformCost(player.era),
        reformedThisEra: player.governmentReformEra === player.era,
        planned: planned?.type === 'GOVERNMENT_REFORM' ? planned.government : null,
        options: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GovernmentTypeSchema"].options.map((government)=>({
                government,
                name: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GOVERNMENT_NAMES"][government],
                advantages: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentTable"])(government).advantages,
                limitation: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentTable"])(government).limitation,
                unlocked: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasUnlock"])(state, actor, `government:${government}`),
                block: governmentReformBlock(state, actor, government)
            }))
    };
}
function log(state, step, summary) {
    state.eraTurn.log.push({
        step,
        summary
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'ERA_TURN_STEP', `Virada de Era ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eraNumeral"])(state.eraTurn.era)} · ${step}. ${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ERA_TURN_STEPS"][step - 1]}: ${summary}`);
}
/** Step 1: end-of-Era effects. A civilization whose Alimento stays above what its cities eat sees every integrated city gain 1 Ânimo. */ function sustenance(state) {
    let cities = 0;
    for (const owner of state.core.players){
        const progress = state.players.find((player)=>player.playerId === owner.id);
        const eats = owner.civilization.cities.reduce((total, city)=>total + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["citySustenance"])(city.population), 0);
        if (progress.resources.food <= eats) continue;
        for (const meta of state.cities.filter((candidate)=>candidate.currentOwnerId === owner.id && candidate.status !== 'OCCUPIED'))if (meta.mood < 6) {
            meta.mood += 1;
            cities++;
        }
    }
    return cities ? `Alimento acima do consumo: ${cities} cidade(s) ganharam 1 de Ânimo.` : 'Nenhuma cidade com Alimento acima do consumo.';
}
/** Step 5 (I-7): reserved reforms run in initiative order; each is re-validated and a failed one costs nothing but its Order. */ function reforms(state) {
    const done = [];
    for (const actor of state.initiative){
        const player = state.players.find((candidate)=>candidate.playerId === actor);
        const planned = player.plannedActions.find((action)=>action.type === 'GOVERNMENT_REFORM');
        if (!planned || planned.type !== 'GOVERNMENT_REFORM') continue;
        player.plannedActions = player.plannedActions.filter((action)=>action.id !== planned.id);
        const blocked = governmentReformBlock(state, actor, planned.government);
        if (blocked) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'ACTION_FAILED', `A reforma de governo não pôde ser realizada: ${blocked}`, [
                actor
            ]);
            continue;
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, actor, {
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])(),
            influence: reformCost(player.era)
        });
        const owner = state.core.players.find((candidate)=>candidate.id === actor);
        owner.civilization = {
            ...owner.civilization,
            government: planned.government
        };
        player.governmentReformEra = player.era;
        const capital = state.cities.find((city)=>city.cityId === owner.civilization.capitalCityId);
        if (capital) capital.mood = Math.min(capital.mood, 3);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["refreshAlphaAdministration"])(state);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'GOVERNMENT', `Governo reformado: ${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GOVERNMENT_NAMES"][planned.government]}. A capital fica Abalada na primeira rodada da nova Era.`);
        done.push(`${owner.name}: ${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GOVERNMENT_NAMES"][planned.government]}`);
    }
    return done.length ? `Reformas: ${done.join('; ')}.` : 'Nenhuma reforma de governo.';
}
function enterEraTurn(state) {
    const era = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eraForRound"])(state.core.round, state.rules.roundsPerEra);
    state.eraTurn = {
        era,
        step: 1,
        log: []
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$phases$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setAlphaPhase"])(state, 'ERA_TURN');
    state.players.forEach((player)=>{
        player.ready = false;
    });
    // Each owner is told privately (CHOICE_AUTO); a public summary would reveal that someone completed a Ressonância cycle.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["autoResolveChoices"])(state);
    log(state, 1, sustenance(state));
    state.eraTurn.step = 2;
    const scored = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["scoreAmbitions"])(state);
    log(state, 2, scored ? `${scored} Ambição(ões) pontuada(s).` : 'Nenhuma Ambição concluída.');
    state.eraTurn.step = 3;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$phases$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["drawWorldPulse"])(state);
    log(state, 3, state.worldPulse.current ? `${state.worldPulse.current.name}.` : 'Sem Pulso.');
    state.eraTurn.step = 4;
    const grown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["growThreats"])(state);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["activateThreats"])(state, {
        launch: true
    });
    log(state, 4, `${grown} Acampamento(s) cresceram; as Ameaças agiram.`);
    state.eraTurn.step = 5;
    log(state, 5, reforms(state));
    state.eraTurn.step = 6;
    for (const player of state.players)if (player.leader) player.leader.eraAbilityUsed = false;
    log(state, 6, 'O poder de cada Líder foi recuperado.');
    state.eraTurn.step = 7;
}
function finishEraTurn(state) {
    if (state.phase !== 'ERA_TURN' || !state.eraTurn) throw new Error('Não há Virada de Era em andamento.');
    const era = state.eraTurn.era, next = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options[__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(era) + 1] ?? era;
    state.eraTurn.step = 7;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["renewManeuvers"])(state);
    log(state, 7, 'Manobras +1 (até 5); as Reações voltaram ao baralho.');
    state.eraTurn.step = 8;
    log(state, 8, `O patamar da Era ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eraNumeral"])(next)} da Teia está liberado.`);
    state.eraTurn.step = 9;
    log(state, 9, `Começa a Era ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eraNumeral"])(next)}.`);
    const first = state.initiative.shift();
    if (first) state.initiative.push(first);
    state.core.round += 1;
    state.core.pendingOrders = Object.fromEntries(state.core.players.map((player)=>[
            player.id,
            []
        ]));
    state.telemetry.rounds = state.core.round;
    state.eraTurn = null;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$phases$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setAlphaPhase"])(state, 'WORLD_PULSE');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$phases$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["openRound"])(state);
}
}),
"[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "alphaEvent",
    ()=>alphaEvent,
    "resolutionEvent",
    ()=>resolutionEvent
]);
function alphaEvent(state, type, message, audience = null) {
    state.events.push({
        id: `event-${state.events.length + 1}`,
        round: state.core.round,
        type,
        message,
        audience
    });
}
function resolutionEvent(state, event) {
    state.resolutionEvents.push({
        id: `resolution-${state.resolutionEvents.length + 1}`,
        round: state.core.round,
        ...event,
        visibleTo: event.visibleTo === null ? null : [
            ...new Set(event.visibleTo)
        ]
    });
}
}),
"[project]/packages/game-engine/dist/alpha-government.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GOVERNMENT_NAMES",
    ()=>GOVERNMENT_NAMES,
    "applyGovernmentRoundStart",
    ()=>applyGovernmentRoundStart,
    "governmentEffects",
    ()=>governmentEffects,
    "governmentTable",
    ()=>governmentTable,
    "knowledgeAdvancesThisEra",
    ()=>knowledgeAdvancesThisEra
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-route] (ecmascript) <export WEB_ADVANCES as ADVANCEMENTS>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
;
const GOVERNMENT_NAMES = {
    PROTO_GOVERNANCE: 'Conselho',
    MONARCHY: 'Monarquia',
    REPUBLIC: 'República',
    OLIGARCHY: 'Oligarquia',
    THEOCRACY: 'Teocracia',
    CONFEDERATION: 'Confederação',
    MERITOCRACY: 'Meritocracia',
    AUTOCRACY: 'Autocracia'
};
const base = (government)=>({
        government,
        name: GOVERNMENT_NAMES[government],
        advantages: [
            '',
            ''
        ],
        limitation: '',
        governFreeLevels: 0,
        administrationBonus: 0,
        secondActivationsPerRound: null,
        capitalCapacityBonus: 0,
        capitalCapacityCap: null,
        capitalRecruitIgnoresCapacity: false,
        recruitPerActivationMax: null,
        moveCapitalOrders: 1,
        ambitionsPerEra: 1,
        handBonus: 0,
        warExtraInfluence: 0,
        routeWealth: 0,
        wealthCoverPercent: 50,
        shakenCitiesProduceNoWealth: false,
        templeMoodRecovery: false,
        templeCulture: 0,
        firstKnowledgeAdvanceExtraCost: 0,
        foundingWoodDiscount: 0,
        scholarYieldsPerOne: false,
        governKnowledge: 0,
        armyMaxBonus: 0,
        suppliedNearRoad: 0,
        conqueredCityStartsInRevolt: false
    });
const TABLE = {
    PROTO_GOVERNANCE: {
        ...base('PROTO_GOVERNANCE'),
        advantages: [
            'Governar custa 1 nível de Ânimo a menos',
            'Capacidade Administrativa +1'
        ],
        limitation: 'No máximo 1 segunda ativação por rodada',
        governFreeLevels: 1,
        administrationBonus: 1,
        secondActivationsPerRound: 1
    },
    MONARCHY: {
        ...base('MONARCHY'),
        advantages: [
            'Capital com Capacidade +1',
            'Recrutar na capital ignora a Capacidade'
        ],
        limitation: 'Mudar de capital custa 2 Ordens',
        capitalCapacityBonus: 1,
        capitalRecruitIgnoresCapacity: true,
        moveCapitalOrders: 2
    },
    REPUBLIC: {
        ...base('REPUBLIC'),
        advantages: [
            'Até 2 Ambições pontuadas por Era',
            '+1 Manobra na mão'
        ],
        limitation: 'Declarar guerra custa 1 Influência extra e 1 Ordem Influência',
        ambitionsPerEra: 2,
        handBonus: 1,
        warExtraInfluence: 1
    },
    OLIGARCHY: {
        ...base('OLIGARCHY'),
        advantages: [
            'Rotas rendem +1 Riqueza',
            'Riqueza cobre até 60% de qualquer custo material'
        ],
        limitation: 'Cidades Abaladas não geram Riqueza',
        routeWealth: 1,
        wealthCoverPercent: 60,
        shakenCitiesProduceNoWealth: true
    },
    THEOCRACY: {
        ...base('THEOCRACY'),
        advantages: [
            'Cada Templo recupera 1 de Ânimo por rodada, sem Ordem',
            '+1 Cultura por cidade com Templo'
        ],
        limitation: 'O primeiro avanço de Saber de cada Era custa +1 Conhecimento',
        templeMoodRecovery: true,
        templeCulture: 1,
        firstKnowledgeAdvanceExtraCost: 1
    },
    CONFEDERATION: {
        ...base('CONFEDERATION'),
        advantages: [
            'Capacidade Administrativa +2',
            'Fundar custa 1 Madeira a menos'
        ],
        limitation: 'A Capacidade da capital nunca passa de 3',
        administrationBonus: 2,
        foundingWoodDiscount: 1,
        capitalCapacityCap: 3
    },
    MERITOCRACY: {
        ...base('MERITOCRACY'),
        advantages: [
            'Erudito rende por 1',
            'Governar rende +1 Conhecimento'
        ],
        limitation: 'Recrutar no máximo 1 peça por ativação',
        scholarYieldsPerOne: true,
        governKnowledge: 1,
        recruitPerActivationMax: 1
    },
    AUTOCRACY: {
        ...base('AUTOCRACY'),
        advantages: [
            'Exército máximo +1',
            'Peças próprias sempre supridas a 1 hex de estrada'
        ],
        limitation: 'Cidade conquistada começa com Integração 0 e Ânimo em Revolta',
        armyMaxBonus: 1,
        suppliedNearRoad: 1,
        conqueredCityStartsInRevolt: true
    }
};
function governmentEffects(state, actor) {
    return TABLE[state.core.players.find((player)=>player.id === actor)?.civilization.government ?? 'PROTO_GOVERNANCE'];
}
const governmentTable = (government)=>TABLE[government];
function knowledgeAdvancesThisEra(state, actor) {
    const player = state.players.find((candidate)=>candidate.playerId === actor);
    if (!player) return 0;
    return player.resonance.marks.filter((mark)=>{
        const node = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].find((candidate)=>candidate.id === mark.advancementId);
        return node?.domain === 'KNOWLEDGE' && !node.convergence && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eraForRound"])(Math.max(1, mark.round), state.rules.roundsPerEra) === player.era;
    }).length;
}
function applyGovernmentRoundStart(state) {
    let recovered = 0;
    for (const owner of state.core.players){
        if (!governmentEffects(state, owner.id).templeMoodRecovery) continue;
        for (const meta of state.cities){
            if (meta.currentOwnerId !== owner.id || meta.status === 'OCCUPIED' || !meta.buildings.includes('TEMPLE') || meta.mood >= 6) continue;
            meta.mood += 1;
            recovered++;
        }
    }
    return recovered;
}
}),
"[project]/packages/game-engine/dist/alpha-grades.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GRADE_FAMILIES",
    ()=>GRADE_FAMILIES,
    "GRADE_NUMERALS",
    ()=>GRADE_NUMERALS,
    "GRADE_REQUIREMENTS",
    ()=>GRADE_REQUIREMENTS,
    "gradeFor",
    ()=>gradeFor,
    "isGradedKind",
    ()=>isGradedKind,
    "unitGrade",
    ()=>unitGrade,
    "unitMovement",
    ()=>unitMovement,
    "unitTransport",
    ()=>unitTransport
]);
const GRADE_REQUIREMENTS = {
    INFANTRY: {
        II: [
            'web-maneuver-training'
        ],
        III: [
            'web-iron'
        ]
    },
    GUARD: {
        II: [
            'web-fortification'
        ],
        III: [
            'web-deep-defense'
        ]
    },
    RANGED: {
        II: [
            'web-metallurgy'
        ],
        III: [
            'web-gunpowder'
        ]
    },
    CAVALRY: {
        II: [
            'web-war-of-movement'
        ],
        III: [
            'web-naval-doctrine',
            'web-war-of-movement'
        ]
    },
    SIEGE: {
        II: [
            'web-engineering'
        ],
        III: [
            'web-artillery'
        ]
    },
    FLEET: {
        II: [
            'web-naval-architecture'
        ],
        III: [
            'web-ballistics'
        ]
    }
};
const GRADE_FAMILIES = Object.keys(GRADE_REQUIREMENTS);
const GRADE_NUMERALS = [
    'I',
    'II',
    'III'
];
const isGradedKind = (kind)=>kind in GRADE_REQUIREMENTS;
function gradeFor(research, kind) {
    if (!isGradedKind(kind)) return 1;
    const rule = GRADE_REQUIREMENTS[kind];
    if (rule.III.every((id)=>research.includes(id))) return 3;
    if (rule.II.every((id)=>research.includes(id))) return 2;
    return 1;
}
const unitGrade = (state, owner, kind)=>gradeFor(state.players.find((player)=>player.playerId === owner)?.research ?? [], kind);
const unitMovement = (state, unit)=>state.rules.units[unit.kind].movement + (unit.kind === 'CAVALRY' && unitGrade(state, unit.ownerId, 'CAVALRY') >= 2 ? 1 : 0);
const unitTransport = (state, unit)=>state.rules.units[unit.kind].transport + (unit.kind === 'FLEET' && unitGrade(state, unit.ownerId, 'FLEET') >= 2 ? 1 : 0);
}),
"[project]/packages/game-engine/dist/alpha-growth.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "growthForecast",
    ()=>growthForecast
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-city.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-urban.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-kits.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-city-ladder.js [app-route] (ecmascript)");
;
;
;
function growthForecast(state, actor) {
    const owner = state.core.players.find((player)=>player.id === actor);
    const progress = state.players.find((player)=>player.playerId === actor);
    if (!owner || !progress) return {
        foodProduced: 0,
        foodEaten: 0,
        shortage: false,
        surplus: 0,
        cities: []
    };
    const producing = new Set(state.cities.filter((meta)=>meta.currentOwnerId === actor && meta.status !== 'OCCUPIED').map((meta)=>meta.cityId));
    const produced = new Map(owner.civilization.cities.map((city)=>[
            city.id,
            producing.has(city.id) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["productionOutput"])(state, actor, city.id).output.food : 0
        ]));
    const foodProduced = [
        ...produced.values()
    ].reduce((total, value)=>total + value, 0);
    const sustenance = owner.civilization.cities.reduce((total, city)=>total + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["citySustenance"])(city.population), 0);
    const foodEaten = sustenance + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["militaryUpkeep"])(state, actor).food + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitFoodUpkeep"])(state, actor);
    const stock = progress.resources.food + foodProduced;
    const shortage = stock < foodEaten;
    let surplus = shortage ? 0 : stock - foodEaten;
    const cities = [
        ...owner.civilization.cities
    ].sort((a, b)=>b.population - a.population).map((city)=>{
        const pair = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cityPair"])(state, city.id);
        const capped = !pair || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["canGrow"])(pair.meta, city);
        const cost = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["growCost"])(state, city.id);
        const willGrow = !shortage && !capped && producing.has(city.id) && surplus >= cost;
        if (willGrow) surplus -= cost;
        return {
            cityId: city.id,
            population: city.population,
            ceiling: pair ? pair.meta && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["canGrow"])(pair.meta, city) ? cityCeiling(state, city.id) : city.population : city.population,
            producedFood: produced.get(city.id) ?? 0,
            eats: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["citySustenance"])(city.population),
            growCost: cost,
            capped,
            willGrow
        };
    });
    return {
        foodProduced,
        foodEaten,
        shortage,
        surplus: shortage ? 0 : stock - foodEaten,
        cities
    };
}
function cityCeiling(state, cityId) {
    const pair = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cityPair"])(state, cityId);
    if (!pair) return 0;
    // Imported lazily to keep the forecast's dependencies on the ladder in one place.
    return ceilingOf(pair.meta.level);
}
;
const ceilingOf = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["populationCeiling"];
}),
"[project]/packages/game-engine/dist/alpha-hegemony.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "declareHegemony",
    ()=>declareHegemony,
    "hegemonyProgress",
    ()=>hegemonyProgress,
    "hegemonyWinner",
    ()=>hegemonyWinner,
    "refreshHegemony",
    ()=>refreshHegemony
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-route] (ecmascript) <export WEB_ADVANCES as ADVANCEMENTS>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-legacy-works.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-diplomacy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$culture$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-culture.js [app-route] (ecmascript)");
;
;
;
function hegemonyProgress(state, actor) {
    const player = state.players.find((p)=>p.playerId === actor);
    const core = state.core.players.find((p)=>p.id === actor);
    const cities = core.civilization.cities.filter((c)=>!state.occupations.some((o)=>o.cityId === c.id));
    const districts = cities.flatMap((c)=>c.districts);
    const works = state.legacyWorks.filter((w)=>w.ownerId === actor && w.completedRound !== null && cities.some((c)=>c.id === w.cityId));
    const foreignRoutes = state.routes.filter((r)=>r.ownerId === actor && !core.civilization.cities.some((c)=>c.id === r.toCityId)).filter((r)=>{
        try {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["tradePath"])(state, actor, r.fromCityId, r.toCityId);
            return true;
        } catch  {
            return false;
        }
    });
    const partners = new Set(foreignRoutes.map((r)=>state.core.players.find((p)=>p.civilization.cities.some((c)=>c.id === r.toCityId)).id));
    const treaties = state.treaties.filter((t)=>t.status === 'ACTIVE' && t.expiresRound >= state.core.round && t.type !== 'EMBARGO' && [
            t.proposerId,
            t.recipientId
        ].includes(actor));
    const units = state.units.filter((u)=>u.ownerId === actor && state.rules.units[u.kind].strength > 0);
    const metrics = {
        strength: units.reduce((n, u)=>n + state.rules.units[u.kind].strength, 0),
        victories: player.victories,
        foreignPresence: units.filter((u)=>{
            const tile = state.core.map.find((t)=>t.id === u.hexId);
            return tile.ownerId !== null && tile.ownerId !== actor;
        }).length,
        wealth: player.resources.wealth,
        internationalRoutes: foreignRoutes.length,
        tradePartners: partners.size,
        eraFiveResearch: player.research.filter((id)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].find((a)=>a.id === id)?.era === 'ASCENSION').length,
        academicDistricts: districts.filter((d)=>d.type === 'ACADEMIC').length,
        scientificProjects: works.filter((w)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["legacyWork"])(w.workId)?.path === 'SCIENTIFIC').length,
        influence: player.resources.influence,
        culturalDistricts: districts.filter((d)=>d.type === 'CULTURAL').length,
        foreignInfluence: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$culture$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["culturalPresenceCount"])(state, actor),
        treatyPartners: new Set(treaties.map((t)=>t.proposerId === actor ? t.recipientId : t.proposerId)).size,
        politicalProjects: works.filter((w)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["legacyWork"])(w.workId)?.path === 'POLITICAL').length,
        territory: state.core.map.filter((t)=>t.ownerId === actor && !state.occupations.some((o)=>o.cityId === t.controllerCityId)).length,
        developedCities: state.cities.filter((m)=>m.currentOwnerId === actor && [
                'GREAT_CITY',
                'METROPOLIS',
                'IMPERIAL_METROPOLIS'
            ].includes(m.level)).length,
        withinCapacity: Number(core.civilization.administrativeLoad <= core.civilization.administrativeCapacity)
    };
    return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HegemonyPathSchema"].options.map((path)=>({
            path,
            requirements: state.rules.hegemonyRequirements[path].map((r)=>({
                    ...r,
                    current: metrics[r.metric],
                    met: metrics[r.metric] >= r.minimum
                }))
        }));
}
function declareHegemony(state, actor, path) {
    const player = state.players.find((p)=>p.playerId === actor);
    if (player.era !== 'ASCENSION') throw new Error('A declaração de Hegemonia requer a Era VII, Ascensão.');
    if (player.hegemony) throw new Error('Sua civilização já escolheu um caminho hegemônico.');
    player.hegemony = {
        path,
        declaredRound: state.core.round,
        qualifiedSince: null
    };
}
function refreshHegemony(state) {
    for (const player of state.players)if (player.hegemony) {
        const eligible = hegemonyProgress(state, player.playerId).find((p)=>p.path === player.hegemony.path).requirements.every((r)=>r.met);
        if (!eligible) player.hegemony.qualifiedSince = null;
        else if (player.hegemony.qualifiedSince === null) player.hegemony.qualifiedSince = state.core.round;
    }
}
function hegemonyWinner(state) {
    refreshHegemony(state);
    return state.initiative.find((id)=>{
        const declaration = state.players.find((p)=>p.playerId === id).hegemony;
        return declaration?.qualifiedSince != null && state.core.round - declaration.qualifiedSince >= state.rules.hegemonyHoldRounds;
    }) ?? null;
}
}),
"[project]/packages/game-engine/dist/alpha-independents.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "INDEPENDENT_RULES",
    ()=>INDEPENDENT_RULES,
    "independentAction",
    ()=>independentAction,
    "independentPeopleView",
    ()=>independentPeopleView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/civilization.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)");
;
;
;
;
const INDEPENDENT_RULES = {
    tradeCost: {
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])(),
        wealth: 1
    },
    tradeGain: {
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])(),
        food: 2
    },
    negotiateCost: {
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])(),
        wealth: 1
    },
    influenceCost: {
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])(),
        influence: 1
    },
    protectInfluence: 2,
    integrateInfluence: 3,
    conquerStrength: {
        VILLAGE: 2,
        TOWN: 3,
        CITY_STATE: 4
    }
};
const attitudes = [
    'HOSTILE',
    'WARY',
    'NEUTRAL',
    'FRIENDLY'
];
const cost = (value)=>value;
const ATTITUDE_NAMES = {
    HOSTILE: 'Hostil',
    WARY: 'Desconfiado',
    NEUTRAL: 'Neutro',
    FRIENDLY: 'Amistoso'
};
/** "atitude Amistosa (agora Neutro), influência 1 de 3": only the conditions still unmet. */ const missing = (people, influence, required)=>[
        people.attitude !== 'FRIENDLY' ? `atitude Amistosa (agora ${ATTITUDE_NAMES[people.attitude]})` : null,
        influence < required ? `influência ${influence} de ${required}` : null
    ].filter(Boolean).join(', ');
function requireKnown(state, actor, peopleId) {
    const people = state.independents.find((candidate)=>candidate.id === peopleId);
    if (!people || !state.players.find((player)=>player.playerId === actor)?.knownHexIds.includes(people.hexId)) throw new Error('Povo independente desconhecido.');
    if (people.integratedBy !== null) throw new Error('Este povo independente já foi integrado.');
    return people;
}
function createIndependentCity(state, actor, people, peaceful) {
    const owner = state.core.players.find((player)=>player.id === actor);
    const tile = state.core.map.find((candidate)=>candidate.id === people.hexId);
    if (tile.ownerId !== null && tile.ownerId !== actor) throw new Error('O território independente está sob controle estrangeiro.');
    const cityId = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CityIdSchema"].parse(`city-${people.id}`);
    if (state.core.players.some((player)=>player.civilization.cities.some((city)=>city.id === cityId))) throw new Error('Este povo já originou uma cidade.');
    const population = {
        VILLAGE: 1,
        TOWN: 2,
        CITY_STATE: 3
    }[people.type];
    owner.civilization.cities.push({
        id: cityId,
        ownerId: actor,
        hexId: people.hexId,
        name: people.id.replace('independent-', 'Povo '),
        population,
        workers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unassignedPopulation"])(population),
        stability: peaceful ? 60 : 40,
        development: 1,
        specialization: null,
        growthProgress: 0,
        foundedRound: state.core.round,
        workedHexIds: [],
        districts: [],
        buildings: []
    });
    if (owner.civilization.capitalCityId === null) owner.civilization.capitalCityId = cityId;
    tile.ownerId = actor;
    tile.controllerCityId = cityId;
    owner.civilization = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["refreshAdministration"])(owner.civilization, state.core.config, state.core.map);
    const identity = state.players.find((player)=>player.playerId === actor)?.civilization ?? `native-${actor}`;
    state.cities.push({
        cityId,
        originalOwnerId: actor,
        currentOwnerId: actor,
        nativeIdentity: people.id,
        status: 'OWNED',
        integration: 100,
        mood: peaceful ? 3 : 1,
        level: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cityLevelForPopulation"])(population),
        capital: owner.civilization.capitalCityId === cityId,
        districts: [],
        buildings: [],
        fortification: {
            level: 'NONE',
            state: 'INTACT'
        },
        foreignPresence: [],
        localCohesion: peaceful ? 60 : 30,
        culturalAnchor: identity,
        urbanActionsUsed: 0,
        allocationRound: 0,
        portBlockedUntil: 0,
        portBlockedBy: null
    });
    // The owner's identity is not foreign presence; no cultural anchor exists without predominant presence.
    state.cities.at(-1).culturalAnchor = null;
    people.integratedBy = actor;
    people.protectorId = peaceful ? actor : null;
    state.telemetry.cityIntegration += 1;
}
function independentAction(state, actor, command) {
    const people = requireKnown(state, actor, command.peopleId);
    const influence = people.influenceByPlayer[actor] ?? 0;
    switch(command.action){
        case 'TRADE':
            if (people.attitude === 'HOSTILE') throw new Error('Povos hostis não comerciam.');
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, actor, cost(INDEPENDENT_RULES.tradeCost));
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, actor, INDEPENDENT_RULES.tradeGain, {
                category: 'trade'
            });
            break;
        case 'NEGOTIATE':
            {
                if (people.attitude === 'FRIENDLY') throw new Error('Este povo já está amistoso.');
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, actor, cost(INDEPENDENT_RULES.negotiateCost));
                const index = attitudes.indexOf(people.attitude);
                people.attitude = attitudes[Math.min(attitudes.length - 1, index + 1)];
                break;
            }
        case 'INFLUENCE':
            if (people.attitude === 'HOSTILE') throw new Error('Negocie antes de influenciar um povo hostil.');
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, actor, cost(INDEPENDENT_RULES.influenceCost));
            people.influenceByPlayer[actor] = influence + 1;
            break;
        case 'PROTECT':
            if (people.attitude !== 'FRIENDLY' || influence < INDEPENDENT_RULES.protectInfluence) throw new Error(`Falta: ${missing(people, influence, INDEPENDENT_RULES.protectInfluence)}.`);
            if (people.protectorId !== null && people.protectorId !== actor) throw new Error('Este povo já possui outro protetor.');
            people.protectorId = actor;
            break;
        case 'INTEGRATE':
            if (people.attitude !== 'FRIENDLY' || influence < INDEPENDENT_RULES.integrateInfluence) throw new Error(`Falta: ${missing(people, influence, INDEPENDENT_RULES.integrateInfluence)}.`);
            createIndependentCity(state, actor, people, true);
            break;
        case 'CONQUER':
            {
                const strength = state.units.filter((unit)=>unit.ownerId === actor && unit.hexId === people.hexId).reduce((total, unit)=>total + state.rules.units[unit.kind].strength, 0);
                if (strength < INDEPENDENT_RULES.conquerStrength[people.type]) throw new Error(`Força militar neste hex: ${strength} de ${INDEPENDENT_RULES.conquerStrength[people.type]}.`);
                createIndependentCity(state, actor, people, false);
                break;
            }
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'INDEPENDENT_ACTION', `Ação ${command.action} resolvida com ${people.id}.`, [
        actor
    ]);
}
function independentPeopleView(state, actor) {
    const known = new Set(state.players.find((player)=>player.playerId === actor)?.knownHexIds ?? []);
    return state.independents.filter((people)=>known.has(people.hexId)).map((people)=>({
            id: people.id,
            hexId: people.hexId,
            type: people.type,
            attitude: people.attitude,
            yourInfluence: people.influenceByPlayer[actor] ?? 0,
            protectorId: people.protectorId,
            integratedBy: people.integratedBy,
            canAffordTrade: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, actor, INDEPENDENT_RULES.tradeCost),
            actions: INDEPENDENT_ACTIONS.map((action)=>({
                    action,
                    effect: INDEPENDENT_EFFECTS[action](people.type),
                    cost: INDEPENDENT_COSTS[action] ?? null,
                    blocked: independentBlock(state, actor, people.id, action)
                }))
        }));
}
const INDEPENDENT_ACTIONS = [
    'TRADE',
    'NEGOTIATE',
    'INFLUENCE',
    'PROTECT',
    'INTEGRATE',
    'CONQUER'
];
const INDEPENDENT_COSTS = {
    TRADE: INDEPENDENT_RULES.tradeCost,
    NEGOTIATE: INDEPENDENT_RULES.negotiateCost,
    INFLUENCE: INDEPENDENT_RULES.influenceCost
};
const INDEPENDENT_EFFECTS = {
    TRADE: ()=>`Troca imediata: +${INDEPENDENT_RULES.tradeGain.food} Alimento. Povos hostis não comerciam.`,
    NEGOTIATE: ()=>'A atitude do povo melhora um passo (Hostil, Desconfiado, Neutro, Amistoso).',
    INFLUENCE: ()=>'+1 da sua influência sobre este povo. Exige que não seja hostil.',
    PROTECT: ()=>`Torna-se protetor. Exige atitude Amistosa e influência ${INDEPENDENT_RULES.protectInfluence}.`,
    INTEGRATE: ()=>`O povo se une a você como cidade, em paz. Exige atitude Amistosa e influência ${INDEPENDENT_RULES.integrateInfluence}.`,
    CONQUER: (type)=>`Toma o povo como cidade à força. Exige Força ${INDEPENDENT_RULES.conquerStrength[type]} das suas peças militares neste hex.`
};
/** The refusal the action would give now (dry run on a copy), or null. Every option is one main action in planning. */ function independentBlock(state, actor, peopleId, action) {
    if (state.phase !== 'PLANNING') return 'Disponível no Planejamento.';
    try {
        independentAction(structuredClone(state), actor, {
            type: 'INDEPENDENT_ACTION',
            expectedVersion: state.version,
            peopleId,
            action
        });
        return null;
    } catch (error) {
        return error instanceof Error ? error.message : 'Ação indisponível.';
    }
}
}),
"[project]/packages/game-engine/dist/alpha-institutions.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "advanceCost",
    ()=>advanceCost,
    "applyRecurringEffects",
    ()=>applyRecurringEffects,
    "civilizationAbility",
    ()=>civilizationAbility,
    "effectTiming",
    ()=>effectTiming,
    "eraMilestones",
    ()=>eraMilestones,
    "hasUnlock",
    ()=>hasUnlock,
    "heritageFor",
    ()=>heritageFor,
    "institutionBonus",
    ()=>institutionBonus,
    "institutionEffects",
    ()=>institutionEffects,
    "passEraByCalendar",
    ()=>passEraByCalendar,
    "recurringAmounts",
    ()=>recurringAmounts,
    "researchAdvancement",
    ()=>researchAdvancement,
    "researchBlock",
    ()=>researchBlock,
    "strengthSources",
    ()=>strengthSources
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-route] (ecmascript) <export WEB_ADVANCES as ADVANCEMENTS>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-cards.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-institutions.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-legacy-works.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/arithmetic.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-cards.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-kits.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-government.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resonance.js [app-route] (ecmascript) <locals>");
;
;
;
;
;
;
;
;
function institutionEffects(state, actor) {
    const player = state.players.find((p)=>p.playerId === actor);
    return [
        ...__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CIVILIZATIONS"].find((c)=>c.id === player.civilization)?.passives ?? [],
        ...researchedEffects(player.research),
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cardEffects"])(state, actor)
    ];
}
/** PRODUCTION/STRENGTH effects of researched Web nodes (most nodes unlock things instead and carry no effect). */ const researchedEffects = (research)=>research.map((id)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].find((a)=>a.id === id)?.effect ?? null).filter((effect)=>effect !== null);
function institutionBonus(state, actor, kind) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])(institutionEffects(state, actor).filter((e)=>e.kind === kind).map((e)=>e.amount));
}
const effectTiming = (effect)=>effect.kind === 'PRODUCTION' ? effect.timing ?? 'MAINTENANCE' : 'ONCE';
/** Sources of recurring resource effects: civilization passives, researched advancements, advisors and completed Obras de Legado (bound to their city). */ function recurringSources(state, actor) {
    const player = state.players.find((p)=>p.playerId === actor);
    return [
        ...(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CIVILIZATIONS"].find((c)=>c.id === player.civilization)?.passives ?? []).map((effect)=>({
                effect,
                cityId: null
            })),
        ...researchedEffects(player.research).map((effect)=>({
                effect,
                cityId: null
            })),
        ...player.advisors.map((id)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_CARDS"].find((c)=>c.id === id).effect).filter((effect)=>effect !== null).map((effect)=>({
                effect,
                cityId: null
            })),
        ...state.legacyWorks.filter((w)=>w.ownerId === actor && w.completedRound !== null).map((w)=>({
                effect: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["legacyWork"])(w.workId).effect,
                cityId: w.cityId
            }))
    ];
}
function strengthSources(state, actor) {
    const player = state.players.find((p)=>p.playerId === actor);
    const technology = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])(researchedEffects(player.research).filter((e)=>e.kind === 'STRENGTH').map((e)=>e.amount));
    const leader = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])(player.temporaryEffects.filter((e)=>e.round === state.core.round && e.effect.kind === 'STRENGTH' && e.source.startsWith('leader-')).map((e)=>e.effect.amount));
    const total = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cardEffects"])(state, actor).filter((e)=>e.kind === 'STRENGTH').map((e)=>e.amount));
    return {
        technology,
        leader,
        other: total - leader
    };
}
function recurringAmounts(state, actor, timing, cityId) {
    const total = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])();
    for (const source of recurringSources(state, actor)){
        const effect = source.effect;
        if (effect.kind !== 'PRODUCTION' || effectTiming(effect) !== timing) continue;
        if (timing === 'ON_PRODUCE' && source.cityId !== null && source.cityId !== cityId) continue;
        const gain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGainOf"])(effect.resource, effect.amount);
        for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"])total[key] += gain[key];
    }
    return total;
}
function applyRecurringEffects(state, actor, timing, options = {}) {
    for (const source of recurringSources(state, actor)){
        const effect = source.effect;
        if (effect.kind !== 'PRODUCTION' || effectTiming(effect) !== timing) continue;
        if (timing === 'ON_PRODUCE' && source.cityId !== null && source.cityId !== options.cityId) continue;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGainLegacy"])(state, actor, {
            [effect.resource]: effect.amount
        }, {
            category: 'institutions',
            ...options.enforceStorage === undefined ? {} : {
                enforceStorage: options.enforceStorage
            }
        });
    }
}
function advanceCost(state, actor, id) {
    const node = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].find((a)=>a.id === id);
    if (node) {
        const cost = {
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitAdvancementCost"])(state, actor, node)
        };
        // Teocracia (canon §16): the first Saber advance of each Era costs 1 more Conhecimento.
        const extra = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, actor).firstKnowledgeAdvanceExtraCost;
        if (extra > 0 && node.domain === 'KNOWLEDGE' && !node.convergence && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["knowledgeAdvancesThisEra"])(state, actor) === 0) cost.knowledge += extra;
        return cost;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["heritageAdvance"])(id)?.cost ?? {
        food: 0,
        materials: 0,
        wealth: 0,
        knowledge: 0,
        influence: 0
    };
}
function researchBlock(state, actor, id) {
    const player = state.players.find((p)=>p.playerId === actor);
    const node = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].find((a)=>a.id === id);
    const heritage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["heritageAdvance"])(id);
    if (!node && !heritage) return 'Avanço desconhecido.';
    if (player.research.includes(id)) return 'Este avanço já foi pesquisado.';
    const era = (node ?? heritage).era;
    if (__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(player.era) < __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(era)) return 'Este avanço requer uma Era posterior.';
    if (heritage) {
        if (heritage.civilizationId !== player.civilization) return 'Esta Herança pertence a outra civilização.';
        if (!player.research.includes(heritage.prerequisite)) return 'Pesquise primeiro o avanço universal que abre esta Herança.';
    }
    if (node) {
        if (node.prerequisites.some((prerequisite)=>!player.research.includes(prerequisite))) return 'Complete os pré-requisitos indicados na Teia Civilizacional.';
        if (node.prerequisitesAny.length > 0 && !node.prerequisitesAny.some((prerequisite)=>player.research.includes(prerequisite))) return 'Complete um dos pré-requisitos indicados na Teia Civilizacional.';
        if (node.excludes.some((excluded)=>player.research.includes(excluded))) return 'Esta escolha OU exclui um caminho já tomado.';
    }
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, actor, advanceCost(state, actor, id))) return 'Recursos insuficientes para esta ação.';
    return null;
}
function researchAdvancement(state, actor, id) {
    const blocked = researchBlock(state, actor, id);
    if (blocked) throw new Error(blocked);
    const player = state.players.find((p)=>p.playerId === actor);
    const node = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].find((a)=>a.id === id);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, actor, advanceCost(state, actor, id));
    player.research.push(id);
    if (node?.milestone) player.prestige += 3;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["registerAdvance"])(state, actor, id);
}
function hasUnlock(state, actor, tag) {
    const player = state.players.find((p)=>p.playerId === actor);
    return !!player && player.research.some((id)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].find((a)=>a.id === id)?.unlocks.includes(tag));
}
const heritageFor = (state, actor)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HERITAGE_ADVANCES"].filter((a)=>a.civilizationId === state.players.find((p)=>p.playerId === actor)?.civilization);
function eraMilestones(state, actor) {
    const player = state.players.find((p)=>p.playerId === actor);
    const core = state.core.players.find((p)=>p.id === actor);
    const stage = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(player.era);
    const required = state.rules.milestones[stage] ?? null;
    const cities = core.civilization.cities;
    const current = {
        cities: cities.length,
        population: cities.reduce((n, c)=>n + c.population, 0),
        territory: state.core.map.filter((t)=>t.ownerId === actor).length,
        districts: cities.reduce((n, c)=>n + c.districts.length, 0),
        research: player.research.length,
        development: Math.max(0, ...cities.map((c)=>c.development)),
        government: Number(core.civilization.government !== 'PROTO_GOVERNANCE'),
        contacts: player.contacts.length
    };
    const criteria = required ? __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_ERA_MILESTONE_CRITERIA"].filter((key)=>key !== 'government' || required.government).map((key)=>{
        const minimum = key === 'government' ? 1 : required[key];
        return {
            key,
            current: current[key],
            minimum,
            met: current[key] >= minimum
        };
    }) : [];
    const satisfied = criteria.filter((c)=>c.met).length;
    const needed = required ? Math.min(required.requiredCriteria, criteria.length) : 0;
    const next = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options[stage + 1] ?? null;
    const roundsPerEra = state.rules.roundsPerEra;
    const roundsUntilNext = next === null ? null : Math.max(0, (stage + 1) * roundsPerEra - state.core.round + 1);
    return {
        current,
        required,
        criteria,
        satisfied,
        needed,
        total: criteria.length,
        missing: criteria.filter((c)=>!c.met).map((c)=>c.key),
        canAdvance: false,
        next,
        roundsPerEra,
        roundsUntilNext
    };
}
function passEraByCalendar(state) {
    const era = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eraForRound"])(state.core.round, state.rules.roundsPerEra);
    for (const player of state.players){
        if (player.era === era || __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(player.era) > __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(era)) continue;
        player.era = era;
        if (player.leader) player.leader.eraAbilityUsed = false;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'ERA_ADVANCED', `Era ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eraNumeral"])(era)} começou.`, [
            player.playerId
        ]);
    }
}
function civilizationAbility(state, actor) {
    const player = state.players.find((p)=>p.playerId === actor);
    const civ = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CIVILIZATIONS"].find((c)=>c.id === player.civilization);
    if (!civ) throw new Error('Escolha uma civilização no lobby.');
    if (player.abilityRound === state.core.round) throw new Error('Habilidade já utilizada nesta rodada.');
    for (const effect of civ.ability.effects)(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGainLegacy"])(state, actor, {
        [effect.resource]: effect.amount
    });
    player.abilityRound = state.core.round;
}
}),
"[project]/packages/game-engine/dist/alpha-kits.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "applyCivilizationHeritage",
    ()=>applyCivilizationHeritage,
    "civilizationOf",
    ()=>civilizationOf,
    "isDroughtPulse",
    ()=>isDroughtPulse,
    "isSignature",
    ()=>isSignature,
    "kitAdvancementCost",
    ()=>kitAdvancementCost,
    "kitCultureDefense",
    ()=>kitCultureDefense,
    "kitDroughtRecovery",
    ()=>kitDroughtRecovery,
    "kitDroughtRelief",
    ()=>kitDroughtRelief,
    "kitExplorationKnowledge",
    ()=>kitExplorationKnowledge,
    "kitExplorationReach",
    ()=>kitExplorationReach,
    "kitFoodUpkeep",
    ()=>kitFoodUpkeep,
    "kitFortificationBlock",
    ()=>kitFortificationBlock,
    "kitLegacyPrestige",
    ()=>kitLegacyPrestige,
    "kitMovement",
    ()=>kitMovement,
    "kitProduceBonus",
    ()=>kitProduceBonus,
    "kitRoadSupply",
    ()=>kitRoadSupply,
    "kitRouteIncome",
    ()=>kitRouteIncome,
    "kitSupplyBonus",
    ()=>kitSupplyBonus,
    "kitTradeBonus",
    ()=>kitTradeBonus,
    "kitTreatyRounds",
    ()=>kitTreatyRounds,
    "kitUnitCost",
    ()=>kitUnitCost,
    "kitWorksCost",
    ()=>kitWorksCost
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-route] (ecmascript) <export WEB_ADVANCES as ADVANCEMENTS>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$civilization$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-civilization-kits.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-stack.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
;
;
;
;
const civilizationOf = (state, actor)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$civilization$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["civilizationKit"])(state.players.find((p)=>p.playerId === actor)?.civilization)?.id ?? null;
const eraIndex = (era)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(era);
function kitUnitCost(state, actor, kind) {
    const entry = state.rules.units[kind], civ = civilizationOf(state, actor), cost = {
        ...entry.cost
    };
    let metal = entry.metal;
    if (civ === 'veyra' && kind === 'ENVOY') cost.wealth = Math.max(0, cost.wealth - 1);
    if (civ === 'valgard' && kind === 'ENVOY') cost.influence += 1;
    if (civ === 'elyra' && kind === 'SIEGE') metal += 1;
    return {
        cost,
        metal
    };
}
function kitAdvancementCost(state, actor, node) {
    const civ = civilizationOf(state, actor), cost = {
        ...node.cost
    }, research = state.players.find((p)=>p.playerId === actor)?.research ?? [];
    if (civ === 'orinth' && !research.some((id)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].find((a)=>a.id === id)?.domain === node.domain)) cost.knowledge = Math.max(1, cost.knowledge - 1);
    if (civ === 'solenne' && node.domain === 'KNOWLEDGE' && node.era === 'FOUNDATION') cost.knowledge += 1;
    return cost;
}
function kitExplorationKnowledge(state, actor, hexIds) {
    const civ = civilizationOf(state, actor);
    if (civ === 'elyra') return 1;
    if (civ === 'thalos' && hexIds.some((id)=>[
            'COAST',
            'SEA'
        ].includes(state.core.map.find((t)=>t.id === id)?.terrain ?? ''))) return 1;
    return 0;
}
const kitTreatyRounds = (state, a, b)=>[
        a,
        b
    ].some((id)=>civilizationOf(state, id) === 'saren') ? 1 : 0;
const kitCultureDefense = (_state, civilizationId)=>civilizationId === 'solenne' ? 1 : 0;
const kitRouteIncome = (state, actor)=>civilizationOf(state, actor) === 'dravik' ? -1 : 0;
const kitMovement = (state, actor, kind)=>civilizationOf(state, actor) === 'kor' && kind === 'FLEET' ? -1 : 0;
function kitSupplyBonus(state, unit) {
    const civ = civilizationOf(state, unit.ownerId), tile = state.core.map.find((t)=>t.id === unit.hexId);
    if (civ === 'valgard' && tile?.ownerId === unit.ownerId) return 1;
    if (civ === 'dravik' && state.roads.includes(unit.hexId)) return 1;
    if (civ === 'thalos' && state.rules.units[unit.kind].domain === 'LAND' && state.rules.units[unit.kind].strength > 0 && tile?.ownerId !== unit.ownerId) return -1;
    return 0;
}
function kitRoadSupply(state, unit) {
    if (civilizationOf(state, unit.ownerId) !== 'kor') return false;
    const tile = state.core.map.find((t)=>t.id === unit.hexId);
    if (!tile) return false;
    return state.roads.includes(tile.id) || tile.ownerId === unit.ownerId && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])(tile).some((point)=>state.roads.includes((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"])(point)));
}
const isDroughtPulse = (card)=>card.mitigatedBy.includes('web-irrigation');
const kitDroughtRelief = (state, actor, card, loss)=>civilizationOf(state, actor) === 'nymara' && isDroughtPulse(card) ? Math.max(0, loss - 1) : loss;
const kitDroughtRecovery = (state, actor, card)=>civilizationOf(state, actor) === 'nymara' && isDroughtPulse(card) ? 1 : 0;
const kitLegacyPrestige = (state, actor)=>civilizationOf(state, actor) === 'nymara' ? 2 : 0;
function kitFortificationBlock(state, actor, next) {
    const player = state.players.find((p)=>p.playerId === actor);
    if (civilizationOf(state, actor) === 'meridia' && player && eraIndex(player.era) < eraIndex('EMPIRES') && ![
        'PALISADE',
        'STONE_WALL'
    ].includes(next)) return 'Os Mesopotâmicos não passam da Muralha de Pedra antes da Era IV.';
    return null;
}
function kitFoodUpkeep(state, actor) {
    const civ = civilizationOf(state, actor), own = state.units.filter((unit)=>unit.ownerId === actor);
    if (civ === 'saren' || civ === 'orinth') return own.filter((unit)=>unit.kind === 'CAVALRY').length;
    if (civ === 'aurelia') return Math.floor(own.filter((unit)=>state.rules.units[unit.kind].strength > 0).length / 4);
    return 0;
}
function kitProduceBonus(state, actor, cityId) {
    const civ = civilizationOf(state, actor), city = state.core.players.find((p)=>p.id === actor)?.civilization.cities.find((c)=>c.id === cityId);
    if (!city || civ !== 'kor' && civ !== 'aurelia') return {
        food: 0,
        stone: 0
    };
    const worked = city.workedHexIds.map((id)=>state.core.map.find((t)=>t.id === id)).filter((t)=>t !== undefined);
    return {
        food: civ === 'aurelia' ? worked.filter((t)=>t.improvement === 'FARM').length : 0,
        stone: civ === 'kor' ? worked.filter((t)=>t.improvement === 'QUARRY' && t.terrain === 'HILLS').length : 0
    };
}
function kitWorksCost(state, actor, cost, road) {
    const civ = civilizationOf(state, actor);
    if (civ === 'dravik' || civ === 'aurelia' && road && (road.terrain === 'HILLS' || road.terrain === 'MOUNTAINS')) return {
        ...cost,
        materials: Math.max(0, cost.materials - 1)
    };
    return cost;
}
function kitTradeBonus(state, parties) {
    for (const id of parties){
        if (civilizationOf(state, id) !== 'meridia') continue;
        if (state.events.some((event)=>event.type === 'KIT_FIRST_TRADE' && event.round === state.core.round && event.audience?.includes(id))) continue;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, id, {
            wealth: 1
        }, {
            category: 'trade'
        });
        state.events.push({
            id: `event-${state.events.length + 1}`,
            round: state.core.round,
            type: 'KIT_FIRST_TRADE',
            message: 'Feira das margens: +1 Riqueza pela primeira troca da rodada.',
            audience: [
                id
            ]
        });
    }
}
const isSignature = (state, unit)=>{
    const kit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$civilization$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["civilizationKit"])(state.players.find((p)=>p.playerId === unit.ownerId)?.civilization);
    return !!kit && kit.signature.item.status === 'ACTIVE' && kit.signature.family === unit.kind;
};
const kitExplorationReach = (state, unit)=>civilizationOf(state, unit.ownerId) === 'elyra' && unit.kind === 'PIONEER' ? 2 : 1;
function applyCivilizationHeritage(state) {
    for (const player of state.players){
        const civ = civilizationOf(state, player.playerId), core = state.core.players.find((p)=>p.id === player.playerId);
        const capital = core.civilization.cities[0];
        if (!civ || !capital) continue;
        const place = (kind, n)=>{
            const center = state.core.map.find((t)=>t.id === capital.hexId);
            const spots = [
                center,
                ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])(center).map(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"]).map((id)=>state.core.map.find((t)=>t.id === id)).filter((t)=>t !== undefined)
            ].filter((t)=>(t.id === capital.hexId || t.ownerId === player.playerId || t.ownerId === null) && ![
                    'SEA',
                    'UNKNOWN'
                ].includes(t.terrain) && !state.units.some((other)=>other.hexId === t.id && other.ownerId !== player.playerId));
            const unit = {
                id: `heritage-${player.playerId}-${kind.toLowerCase()}-${n}`,
                ownerId: player.playerId,
                kind,
                hexId: capital.hexId,
                recruitedRound: 1,
                carrierId: null
            };
            const spot = spots.find((t)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackBlock"])(state, player.playerId, [
                    {
                        ...unit,
                        hexId: t.id
                    }
                ], t.id) === null);
            if (spot) state.units.push({
                ...unit,
                hexId: spot.id
            });
        };
        const meta = state.cities.find((entry)=>entry.cityId === capital.id);
        if (civ === 'valgard') {
            place('GUARD', 1);
            const quarry = state.core.map.filter((t)=>t.ownerId === player.playerId && [
                    'HILLS',
                    'MOUNTAINS'
                ].includes(t.terrain) && t.improvement === null && t.id !== capital.hexId).sort((a, b)=>a.id.localeCompare(b.id))[0];
            if (quarry) quarry.improvement = 'QUARRY';
        }
        if (civ === 'meridia') player.resources.wealth += 3;
        if (civ === 'thalos' || civ === 'elyra') place('PIONEER', 2);
        if (civ === 'saren') {
            place('ENVOY', 1);
            player.resources.influence += 2;
        }
        if (civ === 'veyra') {
            place('ENVOY', 1);
            place('ENVOY', 2);
        }
        if (civ === 'kor' && meta && meta.fortification.level === 'NONE') meta.fortification = {
            level: 'PALISADE',
            state: 'INTACT'
        };
        if (civ === 'orinth') player.resources.knowledge += 2;
        if (civ === 'solenne' && meta) meta.mood = Math.min(6, meta.mood + 1);
        if (civ === 'nymara') player.resources.food += 3;
        if (civ === 'aurelia') {
            player.resources.food += 2;
            player.resources.wood += 1;
            player.resources.stone += 1;
        }
        if (civ === 'dravik') player.resources.stone += 2;
    }
}
}),
"[project]/packages/game-engine/dist/alpha-leaders.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ensureLeaders",
    ()=>ensureLeaders,
    "leaderAbilityBlock",
    ()=>leaderAbilityBlock,
    "leaderIntegrationBonus",
    ()=>leaderIntegrationBonus,
    "leaderOf",
    ()=>leaderOf,
    "leaderStorageBonus",
    ()=>leaderStorageBonus,
    "leaderSupplyBonus",
    ()=>leaderSupplyBonus,
    "useLeaderAbility",
    ()=>useLeaderAbility
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-leaders.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)");
;
;
function leaderOf(state, actor) {
    const leaderId = state.players.find((player)=>player.playerId === actor)?.leader?.leaderId;
    return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LEADERS"].find((leader)=>leader.id === leaderId) ?? null;
}
function ensureLeaders(state) {
    for (const player of state.players)if (player.leader === null && player.civilization !== null) player.leader = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["leaderStateFor"])(player.civilization);
}
function passive(state, actor, kind) {
    const effect = leaderOf(state, actor)?.passiveAbility.effect;
    return effect && effect.kind === kind ? effect : null;
}
function leaderStorageBonus(state, actor, resource) {
    const effect = passive(state, actor, 'STORAGE');
    return effect && effect.resource === resource ? effect.amount : 0;
}
const leaderSupplyBonus = (state, actor)=>passive(state, actor, 'SUPPLY')?.amount ?? 0;
const leaderIntegrationBonus = (state, actor)=>passive(state, actor, 'INTEGRATION')?.amount ?? 0;
function leaderAbilityBlock(state, actor) {
    const player = state.players.find((candidate)=>candidate.playerId === actor);
    const leader = leaderOf(state, actor);
    if (!player || !player.leader || !leader) return 'Sua civilização ainda não tem um líder.';
    if (player.leader.eraAbilityUsed) return 'A habilidade do líder já foi usada nesta Era.';
    const effect = leader.eraAbility.effect;
    const ceiling = state.rules.balance.promoteMoodCeiling;
    const own = state.cities.filter((city)=>city.currentOwnerId === actor);
    if (effect.kind === 'MOOD_ALL' && !own.some((city)=>city.mood < ceiling)) return 'Nenhuma cidade pode melhorar o ânimo agora.';
    if (effect.kind === 'COHESION_ALL' && !own.some((city)=>city.localCohesion < 100)) return 'A coesão de todas as cidades já está no máximo.';
    if (effect.kind === 'TREATY_EXTEND' && !state.treaties.some((treaty)=>treaty.status === 'ACTIVE' && [
            treaty.proposerId,
            treaty.recipientId
        ].includes(actor))) return 'Nenhum tratado ativo para prorrogar.';
    return null;
}
function useLeaderAbility(state, actor) {
    const blocked = leaderAbilityBlock(state, actor);
    if (blocked) throw new Error(blocked);
    const player = state.players.find((candidate)=>candidate.playerId === actor);
    const leader = leaderOf(state, actor);
    const effect = leader.eraAbility.effect;
    switch(effect.kind){
        case 'ROUND_BONUS':
            player.temporaryEffects.push({
                source: leader.id,
                effect: {
                    kind: effect.bonus,
                    amount: effect.amount
                },
                round: state.core.round
            });
            break;
        case 'MOOD_ALL':
            for (const city of state.cities)if (city.currentOwnerId === actor && city.mood < state.rules.balance.promoteMoodCeiling) city.mood = Math.min(state.rules.balance.promoteMoodCeiling, city.mood + effect.amount);
            break;
        case 'COHESION_ALL':
            for (const city of state.cities)if (city.currentOwnerId === actor) city.localCohesion = Math.min(100, city.localCohesion + effect.amount);
            break;
        case 'TREATY_EXTEND':
            for (const treaty of state.treaties)if (treaty.status === 'ACTIVE' && [
                treaty.proposerId,
                treaty.recipientId
            ].includes(actor)) treaty.expiresRound += effect.rounds;
            break;
    }
    player.leader.eraAbilityUsed = true;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'LEADER_ABILITY', `${leader.name} usou ${leader.eraAbility.name}.`, [
        actor
    ]);
}
}),
"[project]/packages/game-engine/dist/alpha-legacy-works.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "advanceLegacyWork",
    ()=>advanceLegacyWork,
    "legacyWorkBlock",
    ()=>legacyWorkBlock,
    "legacyWorkGate",
    ()=>legacyWorkGate,
    "legacyWorkView",
    ()=>legacyWorkView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-route] (ecmascript) <export WEB_ADVANCES as ADVANCEMENTS>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-legacy-works.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-city.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-kits.js [app-route] (ecmascript)");
;
;
;
;
;
const legacyWorkGate = (workId)=>{
    const node = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].find((advancement)=>advancement.unlocks.includes(`work:${workId}`));
    return node ? {
        id: node.id,
        name: node.name
    } : null;
};
/** Own cities joined to `cityId` through active internal trade routes (the city itself counts). */ function connectedCount(state, actor, cityId) {
    const own = new Set(state.core.players.find((player)=>player.id === actor)?.civilization.cities.map((city)=>city.id) ?? []);
    const seen = new Set([
        cityId
    ]), queue = [
        cityId
    ];
    for(let i = 0; i < queue.length; i++){
        for (const route of state.routes){
            if (route.ownerId !== actor || route.suspended) continue;
            const from = route.fromCityId, to = route.toCityId;
            const next = from === queue[i] ? to : to === queue[i] ? from : null;
            if (next && own.has(next) && !seen.has(next)) {
                seen.add(next);
                queue.push(next);
            }
        }
    }
    return seen.size;
}
function legacyWorkBlock(state, actor, work, cityId) {
    const player = state.players.find((candidate)=>candidate.playerId === actor), core = state.core.players.find((owner)=>owner.id === actor);
    const city = core?.civilization.cities.find((candidate)=>candidate.id === cityId);
    if (!player || !city || state.occupations.some((occupation)=>occupation.cityId === cityId)) return 'Escolha uma cidade própria que não esteja ocupada.';
    const progress = state.legacyWorks.find((entry)=>entry.cityId === cityId);
    if (progress && progress.workId !== work.id) return 'A cidade já tem outra Obra de Legado.';
    if (progress?.completedRound != null) return 'Esta Obra já está concluída nesta cidade.';
    const taken = state.legacyWorks.find((entry)=>entry.workId === work.id && entry.cityId !== cityId);
    if (taken) return 'Esta Obra é única no mundo e já foi iniciada.';
    if (!progress) {
        const gate = legacyWorkGate(work.id);
        if (gate && !player.research.includes(gate.id)) return `Exige o avanço ${gate.name}.`;
        if (!city.districts.some((district)=>district.type === work.requires.district)) return 'A cidade precisa do distrito que serve de pré-requisito.';
        const fortification = state.cities.find((meta)=>meta.cityId === cityId)?.fortification.level ?? 'NONE';
        if (work.requires.fortification && __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["FortificationLevelSchema"].options.indexOf(fortification) < __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["FortificationLevelSchema"].options.indexOf(work.requires.fortification)) return 'A cidade precisa de uma fortificação mais forte.';
        if (work.requires.connectedCities && connectedCount(state, actor, cityId) < work.requires.connectedCities) return `Exige ${work.requires.connectedCities} cidades ligadas por rotas.`;
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["activationCapacity"])(state, cityId) < 2) return 'Um passo de Obra exige Capacidade 2 na cidade.';
    const stepCost = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["legacyStepCost"])(work, progress?.stepsDone ?? 0);
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, actor, stepCost)) return 'Recursos insuficientes para este passo.';
    return null;
}
function advanceLegacyWork(state, actor, command) {
    const work = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["legacyWork"])(command.workId);
    if (!work) throw new Error('Obra de Legado desconhecida.');
    const blocked = legacyWorkBlock(state, actor, work, command.cityId);
    if (blocked) throw new Error(blocked);
    let progress = state.legacyWorks.find((entry)=>entry.cityId === command.cityId);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, actor, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["legacyStepCost"])(work, progress?.stepsDone ?? 0));
    if (!progress) {
        progress = {
            workId: work.id,
            ownerId: actor,
            cityId: command.cityId,
            stepsDone: 0,
            startedRound: state.core.round,
            completedRound: null
        };
        state.legacyWorks.push(progress);
    }
    progress.stepsDone++;
    const player = state.players.find((candidate)=>candidate.playerId === actor);
    if (progress.stepsDone >= __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LEGACY_WORK_STEPS"]) {
        progress.completedRound = state.core.round;
        player.prestige += __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LEGACY_WORK_PRESTIGE"] + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitLegacyPrestige"])(state, actor);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'LEGACY_WORK_COMPLETED', `${work.name} foi concluída: +${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LEGACY_WORK_PRESTIGE"]} Prestígio.`, null);
    } else (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'LEGACY_WORK_STEP', `${work.name}: passo ${progress.stepsDone} de ${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LEGACY_WORK_STEPS"]}.`, null);
}
function legacyWorkView(state, actor) {
    const cities = state.core.players.find((owner)=>owner.id === actor)?.civilization.cities ?? [];
    return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LEGACY_WORKS"].map((work)=>{
        const progress = state.legacyWorks.find((entry)=>entry.workId === work.id) ?? null;
        const gate = legacyWorkGate(work.id);
        return {
            id: work.id,
            name: work.name,
            path: work.path,
            source: work.source,
            steps: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LEGACY_WORK_STEPS"],
            cost: work.cost,
            requires: work.requires,
            gate,
            progress: progress ? {
                ownerId: progress.ownerId,
                cityId: progress.cityId,
                stepsDone: progress.stepsDone,
                complete: progress.completedRound !== null
            } : null,
            nextStepCost: progress && progress.completedRound === null ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["legacyStepCost"])(work, progress.stepsDone) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["legacyStepCost"])(work, 0),
            cities: progress && progress.ownerId !== actor ? [] : cities.map((city)=>({
                    cityId: city.id,
                    blocker: legacyWorkBlock(state, actor, work, city.id)
                }))
        };
    });
}
}),
"[project]/packages/game-engine/dist/alpha-messages.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TREATY_NAMES",
    ()=>TREATY_NAMES,
    "battleMessage",
    ()=>battleMessage,
    "lossesMessage",
    ()=>lossesMessage,
    "orderMessage",
    ()=>orderMessage,
    "resourceGainText",
    ()=>resourceGainText,
    "urbanActionMessage",
    ()=>urbanActionMessage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-route] (ecmascript) <export WEB_ADVANCES as ADVANCEMENTS>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-route] (ecmascript)");
;
/** Player-facing names for resolution messages. Events are read as written, so they never carry enum identifiers. */ const RESOURCE_NAMES = {
    food: 'Alimento',
    wood: 'Madeira',
    stone: 'Pedra',
    metal: 'Metal',
    wealth: 'Riqueza',
    knowledge: 'Conhecimento',
    influence: 'Influência',
    culture: 'Cultura'
};
const DISTRICT_NAMES = {
    AGRARIAN: 'Agrário',
    COMMERCIAL: 'Comercial',
    ACADEMIC: 'Acadêmico',
    ADMINISTRATIVE: 'Administrativo',
    MILITARY: 'Militar',
    INDUSTRIAL: 'Industrial',
    CULTURAL: 'Cultural',
    MARITIME: 'Marítimo'
};
const BUILDING_NAMES = {
    GRANARY: 'Celeiro',
    MARKET: 'Mercado',
    LIBRARY: 'Biblioteca',
    ARCHIVE: 'Arquivo',
    BARRACKS: 'Quartel',
    WORKSHOP: 'Oficina',
    CULTURAL_CENTER: 'Centro cultural'
};
const playerName = (state, id)=>state.core.players.find((player)=>player.id === id)?.name ?? 'Uma civilização';
const unitNames = (state, ids)=>{
    const counts = new Map();
    for (const unit of state.units.filter((candidate)=>ids.includes(candidate.id))){
        const name = state.rules.units[unit.kind].name;
        counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [
        ...counts
    ].map(([name, count])=>count > 1 ? `${name} ×${count}` : name).join(', ') || 'Peças';
};
function resourceGainText(before, after, actor) {
    const a = before.players.find((player)=>player.playerId === actor)?.resources, b = after.players.find((player)=>player.playerId === actor)?.resources;
    if (!a || !b) return '';
    return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"].filter((key)=>b[key] > a[key]).map((key)=>`+${b[key] - a[key]} ${RESOURCE_NAMES[key]}`).join(', ');
}
function urbanActionMessage(before, after, actor, action, cityName) {
    switch(action.action){
        case 'PRODUCE':
            {
                const gained = resourceGainText(before, after, actor);
                return `${cityName} produziu${gained ? ` ${gained}` : ''}.`;
            }
        case 'BUILD':
            {
                const build = action.build;
                const what = !build ? 'uma obra' : build.kind === 'DISTRICT' ? `o distrito ${DISTRICT_NAMES[build.district] ?? build.district}` : build.kind === 'BUILDING' ? `${BUILDING_NAMES[build.building] ?? build.building}` : 'fortificações';
                return `${cityName} construiu ${what}.`;
            }
        case 'RECRUIT':
            return `${cityName} recrutou ${action.unit ? before.rules.units[action.unit].name : 'uma peça'}.`;
        case 'RESEARCH':
            return `${cityName} concluiu a pesquisa ${(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].find((advancement)=>advancement.id === action.advancementId) ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["heritageAdvance"])(action.advancementId ?? ''))?.name ?? ''}.`.replace(' .', '.');
        case 'PROMOTE_MOOD':
            return `${cityName} investiu no ânimo da população.`;
        case 'SUPPORT_TRADE':
            return `${cityName} sustentou o comércio.`;
        case 'CIVIC_ACTION':
            return `${cityName} realizou uma ação cívica.`;
        case 'MOVE_CAPITAL':
            return `${cityName} tornou-se a capital.`;
        case 'ELEVATE':
            return `${cityName} foi elevada de nível.`;
    }
}
function orderMessage(before, actor, order, cityName) {
    const who = playerName(before, actor);
    switch(order.type){
        case 'MOVE':
            return `${who}: ${unitNames(before, order.unitIds)} moveu-se para ${order.path.at(-1)}.`;
        case 'EXPLORE':
            return `${who}: ${unitNames(before, [
                order.unitId
            ])} explorou a região de ${order.target}.`;
        case 'ATTACK':
            return `${who}: ataque em ${order.target} resolvido; consulte dados e perdas.`;
        case 'INFLUENCE':
            return `${who}: missão de influência em ${order.target}.`;
        case 'TRADE':
            return `${who}: rota de comércio estabelecida${cityName ? ` até ${cityName}` : ''}.`;
    }
}
const TREATY_NAMES = {
    TRADE_AGREEMENT: 'um acordo comercial',
    NON_AGGRESSION_PACT: 'um pacto de não agressão',
    OPEN_BORDERS: 'fronteiras abertas',
    DEFENSIVE_PACT: 'um pacto defensivo',
    ALLIANCE: 'uma aliança',
    EMBARGO: 'um embargo'
};
function battleMessage(names, battle) {
    const attacker = names.get(battle.attackerId) ?? 'O atacante', defender = names.get(battle.defenderId) ?? 'o defensor';
    const delta = battle.delta ?? battle.attackTotal - battle.defenseTotal;
    const reading = battle.outcome === 'TIE' ? 'e a batalha terminou em empate tático' : battle.winnerId === battle.attackerId ? battle.outcome === 'DECISIVE' ? 'e venceu de forma decisiva' : 'e venceu' : battle.outcome === 'DECISIVE' ? 'e foi repelido de forma decisiva' : 'e foi repelido';
    return `${attacker} atacou ${defender} em ${battle.hexId} ${reading} (Ataque ${battle.attackTotal} × Defesa ${battle.defenseTotal}, Δ ${delta > 0 ? '+' : ''}${delta}).`;
}
function lossesMessage(before, losses) {
    const byOwner = new Map();
    for (const id of losses){
        const unit = before.units.get(id);
        if (!unit) continue;
        byOwner.set(unit.ownerId, [
            ...byOwner.get(unit.ownerId) ?? [],
            before.rules.units[unit.kind].name
        ]);
    }
    return [
        ...byOwner
    ].map(([owner, kinds])=>`${before.names.get(owner) ?? 'Uma civilização'} perdeu ${kinds.join(', ')}.`).join(' ') || `${losses.length} peça(s) perdida(s) no conflito.`;
}
}),
"[project]/packages/game-engine/dist/alpha-migration.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deserializeAlphaState",
    ()=>deserializeAlphaState,
    "migrateSnapshotV3ToV4",
    ()=>migrateSnapshotV3ToV4,
    "migrateSnapshotV3ToV5",
    ()=>migrateSnapshotV3ToV5,
    "migrateSnapshotV4ToV5",
    ()=>migrateSnapshotV4ToV5,
    "serializeAlphaState",
    ()=>serializeAlphaState
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/model.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-leaders.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-catalog.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared/dist/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-random.js [app-route] (ecmascript)");
;
;
;
;
;
function initialCities(core, civilizationByPlayer) {
    return core.players.flatMap((player)=>player.civilization.cities.map((city)=>({
                cityId: city.id,
                originalOwnerId: player.id,
                currentOwnerId: player.id,
                nativeIdentity: civilizationByPlayer.get(player.id) ?? `native-${player.id}`,
                status: 'OWNED',
                integration: 100,
                mood: 4,
                level: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cityLevelForPopulation"])(city.population),
                capital: player.civilization.capitalCityId === city.id,
                districts: city.districts.map((district)=>district.type),
                buildings: [],
                fortification: {
                    level: 'NONE',
                    state: 'INTACT'
                },
                foreignPresence: [],
                localCohesion: 50,
                culturalAnchor: null,
                urbanActionsUsed: 0,
                allocationRound: 0,
                portBlockedUntil: 0,
                portBlockedBy: null
            })));
}
function initialTelemetry(core, preset) {
    return {
        version: '0.1.0-alpha.1',
        preset,
        seed: core.seed,
        players: core.players.length,
        rounds: core.round,
        durationMs: 0,
        actionsByType: {},
        productionByResource: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])(),
        tradeOffers: 0,
        acceptedTrades: 0,
        unitRecruitment: {},
        battles: 0,
        battleResults: {},
        casualties: 0,
        citiesFounded: 0,
        citiesCaptured: 0,
        cityIntegration: 0,
        moodSamples: [],
        researchByDomain: {},
        worldPulseEvents: 0,
        eventMitigations: 0,
        culturalContests: 0,
        culturalContestResults: {},
        prestigeBySource: {},
        hegemonyDeclarations: 0,
        hegemonyInterruptions: 0,
        winner: null,
        victoryReason: null,
        roundLog: [],
        pendingOrders: {},
        resonanceCycles: 0,
        resonanceByKind: {},
        threatsSpawned: 0,
        threatAttacks: 0,
        threatKills: 0,
        threatLosses: 0
    };
}
function migrateSnapshotV3ToV5(input) {
    const old = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GameStateSchema"].safeParse(input);
    if (!old.success) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'INVALID_STATE',
        message: 'Snapshot v3 inválido; o original não foi alterado.'
    });
    if (old.data.status !== 'ACTIVE' || old.data.phase !== 'MAINTENANCE' || Object.values(old.data.pendingOrders).some((orders)=>orders.length)) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'MIGRATION_BOUNDARY',
            message: 'Converta uma partida ativa em Manutenção, sem ordens pendentes.'
        });
    }
    const core = old.data;
    const rules = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRules"])();
    const players = core.players.map((player)=>({
            playerId: player.id,
            civilization: null,
            era: 'FOUNDATION',
            resources: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["legacyToAlphaResources"])(player.resources),
            legacyCulturalTrack: 0,
            spentCommands: 0,
            ready: false,
            prestige: 0,
            research: [],
            hand: [],
            ambitions: [],
            completedAmbitions: [],
            advisors: [],
            orders: [],
            victories: 0,
            exploredRegions: 0,
            foreignInfluence: 0,
            contacts: [],
            abilityRound: 0,
            hegemony: null,
            influencedCities: [],
            ambitionsChosen: true,
            cardsPlayed: 0,
            temporaryEffects: [],
            knownHexIds: core.map.filter((tile)=>tile.ownerId === player.id || player.civilization.cities.some((city)=>{
                    const center = core.map.find((candidate)=>candidate.id === city.hexId);
                    return center && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(center, tile) <= 1;
                })).map((tile)=>tile.id)
        }));
    const civilizationByPlayer = new Map(players.map((player)=>[
            player.playerId,
            player.civilization
        ]));
    const candidate = {
        schemaVersion: 5,
        rulesVersion: 'v5.1b',
        alphaVersion: '0.1.0-alpha.1',
        gameId: core.gameId,
        version: 0,
        phase: 'WORLD_PULSE',
        core,
        rules,
        privateRng: {
            algorithm: 'hmac-sha256-counter-v1',
            seed: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["deterministicAlphaSeed"])(core.seed, core.gameId),
            counter: 0
        },
        players,
        initiative: core.players.map((player)=>player.id),
        units: [],
        roads: [],
        regions: [],
        occupations: [],
        treaties: [],
        wars: [],
        routes: [],
        battles: [],
        winner: null,
        cards: {
            worldDeck: [],
            strategyDeck: [],
            ambitionDeck: [],
            advisorDeck: [],
            discarded: [],
            advisorMarket: [],
            worldEvent: null,
            worldEventRound: 0,
            worldResponded: []
        },
        legacyWorks: [],
        cities: initialCities(core, civilizationByPlayer),
        tradeOffers: [],
        independents: [],
        threats: [],
        worldPulse: {
            deck: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["WORLD_PULSE_CARDS"].map((card)=>card.id),
            discard: [],
            current: null,
            resolvedRound: 0
        },
        telemetry: initialTelemetry(core, rules.worldPreset),
        roundReports: [],
        events: [
            {
                id: 'migration-v5',
                round: core.round,
                type: 'MIGRATED',
                audience: null,
                message: 'Partida convertida explicitamente para o formato alpha v5.'
            }
        ]
    };
    const result = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaStateSchema"].safeParse(candidate);
    return result.success ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(result.data) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'INVALID_STATE',
        message: result.error.message
    });
}
const AlphaV4Shape = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].looseObject({
    schemaVersion: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(4),
    gameId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    version: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().nonnegative(),
    core: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GameStateSchema"],
    rules: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].looseObject({
        preset: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'QUICK',
            'STANDARD',
            'EPIC'
        ])
    })
});
function migrateSnapshotV4ToV5(input) {
    const already = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaStateSchema"].safeParse(input);
    if (already.success) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(already.data);
    const old = AlphaV4Shape.safeParse(input);
    if (!old.success) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'INVALID_STATE',
        message: 'Snapshot alpha v4 inválido; o original não foi alterado.'
    });
    const raw = structuredClone(old.data);
    const timer = Number(raw.rules.planningSeconds ?? 0);
    const planningSeconds = [
        0,
        180,
        300,
        480,
        3600,
        14400,
        28800
    ].includes(timer) ? timer : timer <= 900 ? 480 : 28800;
    const rules = {
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRules"])(old.data.rules.preset),
        ...raw.rules,
        planningSeconds,
        worldPreset: 'MIXED',
        balance: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaBalance"])(),
        units: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaUnitCatalog"])(),
        milestones: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRules"])(old.data.rules.preset).milestones,
        combat: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRules"])(old.data.rules.preset).combat
    };
    const players = (raw.players ?? []).map((player)=>{
        const owner = raw.core.players.find((candidate)=>candidate.id === player.playerId);
        return {
            ...player,
            era: player.era === 'HEGEMONY' && !player.hegemony ? 'ASCENSION' : player.era,
            resources: owner ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["legacyToAlphaResources"])(owner.resources) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])(),
            legacyCulturalTrack: Number(player.foreignInfluence ?? 0),
            leader: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["leaderStateFor"])(typeof player.civilization === 'string' ? player.civilization : null)
        };
    });
    const civilizationByPlayer = new Map(players.map((player)=>[
            String(player.playerId),
            typeof player.civilization === 'string' ? player.civilization : null
        ]));
    const cities = initialCities(raw.core, civilizationByPlayer);
    for (const occupation of raw.occupations ?? []){
        const city = cities.find((candidate)=>candidate.cityId === occupation.cityId);
        if (city) {
            city.status = 'OCCUPIED';
            city.integration = 0;
            city.originalOwnerId = String(occupation.previousOwnerId);
            city.currentOwnerId = String(occupation.occupierId);
        }
    }
    const phase = {
        MAINTENANCE: 'WORLD_PULSE',
        PLANNING: 'PLANNING',
        RESOLUTION: 'ORDERS_MOVEMENT',
        REACTION: 'CONFLICTS',
        END_ROUND: 'END_ROUND'
    }[raw.core.phase];
    const candidate = {
        ...raw,
        schemaVersion: 5,
        rulesVersion: 'v5.1b',
        alphaVersion: '0.1.0-alpha.1',
        phase,
        rules,
        players,
        units: (raw.units ?? []).map((unit)=>({
                ...unit,
                kind: [
                    'SETTLER',
                    'EXPLORER'
                ].includes(String(unit.kind)) ? 'PIONEER' : unit.kind
            })),
        cities,
        tradeOffers: [],
        independents: [],
        threats: [],
        worldPulse: {
            deck: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["WORLD_PULSE_CARDS"].map((card)=>card.id),
            discard: [],
            current: null,
            resolvedRound: 0
        },
        telemetry: initialTelemetry(raw.core, 'MIXED')
    };
    const migrated = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaStateSchema"].safeParse(candidate);
    return migrated.success ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(migrated.data) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'INVALID_STATE',
        message: migrated.error.message
    });
}
const migrateSnapshotV3ToV4 = migrateSnapshotV3ToV5;
function serializeAlphaState(state) {
    return JSON.stringify(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaStateSchema"].parse(state));
}
function deserializeAlphaState(json) {
    try {
        const input = JSON.parse(json);
        if (input && typeof input === 'object' && 'schemaVersion' in input && input.schemaVersion === 3) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'SNAPSHOT_MIGRATION_REQUIRED',
            message: 'Execute migrateSnapshotV3ToV5 explicitamente e preserve o original.'
        });
        if (input && typeof input === 'object' && 'schemaVersion' in input && input.schemaVersion === 4) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'SNAPSHOT_MIGRATION_REQUIRED',
            message: 'Execute migrateSnapshotV4ToV5 explicitamente e preserve o original.'
        });
        const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaStateSchema"].safeParse(input);
        return parsed.success ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(parsed.data) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'INVALID_STATE',
            message: 'Snapshot alpha inválido ou versão não suportada.'
        });
    } catch  {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'INVALID_STATE',
            message: 'Snapshot não contém JSON válido.'
        });
    }
}
}),
"[project]/packages/game-engine/dist/alpha-military.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "canEnter",
    ()=>canEnter,
    "recruitBlock",
    ()=>recruitBlock,
    "recruitUnit",
    ()=>recruitUnit,
    "unitSupply",
    ()=>unitSupply,
    "validateMilitaryOrder",
    ()=>validateMilitaryOrder
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-institutions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-diplomacy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-leaders.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-stack.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-naval.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-water.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-kits.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-city.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-grades.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-government.js [app-route] (ecmascript)");
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
function recruitBlock(state, actor, cityId, kind) {
    const player = state.core.players.find((p)=>p.id === actor);
    const progress = state.players.find((p)=>p.playerId === actor);
    const city = player.civilization.cities.find((c)=>c.id === cityId);
    if (!city || state.occupations.some((o)=>o.cityId === cityId)) return 'Recrute em uma cidade própria não ocupada.';
    const entry = state.rules.units[kind];
    const tile = state.core.map.find((t)=>t.id === city.hexId);
    if (__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(progress.era) < __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(entry.era)) return 'Sua civilização ainda não alcançou a era exigida.';
    if (entry.militaryInfrastructure && !city.districts.some((d)=>d.type === 'MILITARY')) return 'Esta peça requer distrito Militar.';
    const naval = entry.domain === 'SEA';
    if (naval && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isPort"])(state, tile.id)) return 'Navios precisam de uma cidade portuária: na Costa ou vizinha ao mar.';
    if (naval && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["blockadedBy"])(state, tile.id, actor)) return 'Porto bloqueado por uma frota inimiga.';
    // A full coastal port still answers with its stack count, so the player sees why.
    const spawn = naval ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["launchHex"])(state, actor, tile.id, kind) ?? (tile.terrain === 'COAST' ? city.hexId : null) : city.hexId;
    if (!spawn) return 'Não há água livre junto ao porto para lançar a Frota.';
    if (state.units.filter((u)=>u.ownerId === actor).length >= state.rules.unitLimit) return 'Reserva de unidades esgotada.';
    const arriving = {
        id: `recruit-${cityId}`,
        ownerId: actor,
        kind,
        hexId: spawn,
        recruitedRound: state.core.round,
        carrierId: null
    };
    const crowded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackBlock"])(state, actor, [
        arriving
    ], spawn, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["pendingArrivals"])(state, actor, spawn, ''));
    if (crowded) return crowded;
    const price = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitUnitCost"])(state, actor, kind);
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, actor, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCostWithMetal"])(state, actor, price.cost, price.metal))) return 'Recursos insuficientes para esta ação.';
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mobilizationBlock"])(state, cityId, kind);
}
function recruitUnit(state, actor, cityId, kind) {
    const blocked = recruitBlock(state, actor, cityId, kind);
    if (blocked) throw new Error(blocked);
    const city = state.core.players.find((p)=>p.id === actor).civilization.cities.find((c)=>c.id === cityId);
    const entry = state.rules.units[kind];
    const price = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitUnitCost"])(state, actor, kind);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, actor, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCostWithMetal"])(state, actor, price.cost, price.metal));
    const hexId = entry.domain === 'SEA' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["launchHex"])(state, actor, city.hexId, kind) : city.hexId;
    state.units.push({
        id: `unit-${actor}-${state.version}-${state.units.length}`,
        ownerId: actor,
        kind,
        hexId,
        recruitedRound: state.core.round,
        carrierId: null
    });
}
function canEnter(state, unit, target) {
    const tile = state.core.map.find((t)=>t.id === target);
    if (!tile) return false;
    return state.rules.units[unit.kind].domain === 'SEA' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isNavigableTerrain"])(tile.terrain) : ![
        'SEA',
        'UNKNOWN'
    ].includes(tile.terrain);
}
function unitSupply(state, unit) {
    const player = state.core.players.find((p)=>p.id === unit.ownerId);
    const tile = state.core.map.find((t)=>t.id === unit.hexId);
    // Autocracia (canon §16): own pieces within 1 hex of a road are always supplied.
    const near = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, unit.ownerId).suppliedNearRoad;
    if (near > 0 && state.roads.some((id)=>{
        const road = state.core.map.find((t)=>t.id === id);
        return road !== undefined && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(road, tile) <= near;
    })) return {
        supplied: true,
        reason: 'Autocracia: a 1 hex de uma estrada.'
    };
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitRoadSupply"])(state, unit)) return {
        supplied: true,
        reason: 'Via Militar: sobre ou ao lado de uma estrada.'
    };
    const cities = player.civilization.cities.filter((c)=>!state.occupations.some((o)=>o.cityId === c.id));
    if (cities.some((c)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(state.core.map.find((t)=>t.id === c.hexId), tile) <= state.rules.supplyRadius + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["leaderSupplyBonus"])(state, unit.ownerId) + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitSupplyBonus"])(state, unit))) return {
        supplied: true,
        reason: 'Dentro do alcance de uma cidade própria.'
    };
    const byId = new Map(state.core.map.map((t)=>[
            t.id,
            t
        ]));
    const seen = new Set();
    const queue = cities.map((c)=>c.hexId);
    for(let i = 0; i < queue.length; i++){
        const id = queue[i];
        if (seen.has(id)) continue;
        seen.add(id);
        if (id === unit.hexId) return {
            supplied: true,
            reason: 'Conexão por território controlado e estradas.'
        };
        const current = byId.get(id);
        for (const point of (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])(current)){
            const next = byId.get((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"])(point));
            if (next && !seen.has(next.id) && (next.ownerId === unit.ownerId || next.ownerId === null && state.roads.includes(next.id))) queue.push(next.id);
        }
    }
    return {
        supplied: false,
        reason: 'Sem cidade ao alcance ou conexão territorial de suprimento.'
    };
}
function validateMilitaryOrder(state, actor, order) {
    if (order.type !== 'MOVE' && order.type !== 'ATTACK') throw new Error('Este resolvedor aceita movimento e ataque.');
    if (new Set(order.unitIds).size !== order.unitIds.length) throw new Error('Não repita peças na mesma ordem.');
    const units = order.unitIds.map((id)=>state.units.find((u)=>u.id === id && u.ownerId === actor));
    if (units.some((u)=>!u)) throw new Error('A ordem contém uma peça que não pertence a você.');
    if (order.type === 'MOVE' && order.path.length > 0 && units.some((unit)=>unit.hexId === order.path.at(-1))) throw new Error('O movimento deve terminar em outro hex.');
    if (order.type === 'MOVE' && units.some((unit)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isCarried"])(unit))) throw new Error('Peça embarcada: desembarque ou ataque a partir da frota.');
    if (order.type === 'ATTACK' && units.some((unit)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isCarried"])(unit)) && units.some((unit)=>!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isCarried"])(unit))) throw new Error('Um ataque anfíbio parte só das peças embarcadas na mesma frota.');
    const progress = state.players.find((p)=>p.playerId === actor);
    for (const piece of units){
        const unit = piece;
        let current = state.core.map.find((t)=>t.id === unit.hexId);
        let cost = 0;
        const path = order.type === 'MOVE' ? order.path : [
            order.target
        ];
        for (const id of path){
            const target = state.core.map.find((t)=>t.id === id);
            if (!target || !progress.knownHexIds.includes(id) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(current, target) !== 1 || !canEnter(state, unit, id)) throw new Error('Caminho deve cruzar hexes conhecidos, adjacentes e compatíveis com a peça.');
            if (order.type === 'MOVE' && (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["movementOpen"])(state, actor, target.ownerId) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["enemyCityAt"])(state, actor, id) || state.units.some((u)=>u.hexId === id && u.ownerId !== actor) || state.threats.some((t)=>t.hexId === id))) throw new Error('Fronteira fechada, cidade inimiga, ameaça do mundo ou presença de outra civilização: use uma ordem de conflito.');
            cost += state.roads.includes(id) && state.rules.units[unit.kind].domain === 'LAND' ? 1 : state.rules.movementCosts[target.terrain];
            current = target;
        }
        if (cost > (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unitMovement"])(state, unit) + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["institutionBonus"])(state, actor, 'MOVEMENT') + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitMovement"])(state, actor, unit.kind)) throw new Error('Caminho excede a mobilidade da peça.');
        if (order.type === 'ATTACK' && state.rules.units[unit.kind].strength === 0) throw new Error('Esta peça não participa de ataques.');
    }
    if (order.type === 'MOVE' && order.path.length) {
        const crowded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackBlock"])(state, actor, units, order.path.at(-1));
        if (crowded) throw new Error(crowded);
    }
    if (order.type === 'ATTACK') {
        const enemies = state.units.filter((u)=>u.hexId === order.target && u.ownerId !== actor);
        const city = state.core.players.flatMap((p)=>p.civilization.cities).find((c)=>c.hexId === order.target && c.ownerId !== actor);
        const threat = state.threats.some((t)=>t.hexId === order.target);
        if (!enemies.length && !city && !threat) throw new Error('Não há adversário conhecido nesse destino.');
        if (enemies.length || city) {
            const defender = enemies[0]?.ownerId ?? city.ownerId;
            // A declaration planned this round resolves in Diplomacy, before Conflicts, so the attack may be reserved with it.
            const declared = state.phase === 'PLANNING' && progress.plannedActions.some((action)=>action.type === 'DECLARE_WAR' && action.targetId === defender);
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["atWar"])(state, actor, defender) && !declared) throw new Error('Declare guerra antes de ordenar um ataque a outra civilização.');
        }
        if (new Set(units.map((u)=>u?.hexId)).size !== 1) throw new Error('Uma força de ataque deve partir do mesmo hex.');
    }
}
}),
"[project]/packages/game-engine/dist/alpha-naval.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "blockadedBy",
    ()=>blockadedBy,
    "cargoLoad",
    ()=>cargoLoad,
    "cargoOf",
    ()=>cargoOf,
    "cargoRoom",
    ()=>cargoRoom,
    "disembark",
    ()=>disembark,
    "disembarkBlock",
    ()=>disembarkBlock,
    "embark",
    ()=>embark,
    "embarkBlock",
    ()=>embarkBlock,
    "isCarried",
    ()=>isCarried,
    "isCarrierKind",
    ()=>isCarrierKind,
    "isPort",
    ()=>isPort,
    "launchHex",
    ()=>launchHex,
    "settleCargo",
    ()=>settleCargo,
    "suspendBlockadedRoutes",
    ()=>suspendBlockadedRoutes
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-water.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-diplomacy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-stack.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-grades.js [app-route] (ecmascript)");
;
;
;
;
;
;
/**
 * Naval vertical slice (DEC-014: naval is core for the Alpha). One generic Fleet class carries the slice:
 * - a city is a port when it stands on Coast or next to Coast/Sea; its fleets launch on an adjacent water hex;
 * - land pieces board an adjacent own fleet (EMBARK) and ride with it; they step off onto an adjacent land hex (DISEMBARK)
 *   or attack from the fleet with an amphibious penalty;
 * - a fleet sunk with cargo saves what the rescue conditions allow (another own fleet with room here, a free coast next to
 *   it), the rest is lost;
 * - an enemy fleet at war next to a port blockades it: no fleets launch there and its trade routes are suspended;
 * - rivals see the fleet, never its cargo.
 * The seven classes of the Bible atlas build on this once audited against the canon.
 */ const tileOf = (state, id)=>state.core.map.find((tile)=>tile.id === id);
const neighbours = (state, id)=>{
    const tile = tileOf(state, id);
    return tile ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])(tile).map(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"]).map((n)=>tileOf(state, n)).filter((t)=>t !== undefined) : [];
};
const isCarried = (unit)=>unit.carrierId !== null && unit.carrierId !== undefined;
const cargoOf = (state, fleetId)=>state.units.filter((unit)=>unit.carrierId === fleetId);
const cargoLoad = (state, fleetId)=>cargoOf(state, fleetId).reduce((total, unit)=>total + state.rules.units[unit.kind].cargo, 0);
const isCarrierKind = (state, kind)=>state.rules.units[kind].domain === 'SEA' && state.rules.units[kind].transport > 0;
const cargoRoom = (state, fleetId)=>{
    const ship = state.units.find((unit)=>unit.id === fleetId);
    return ship ? Math.max(0, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unitTransport"])(state, ship) - cargoLoad(state, fleetId)) : 0;
};
function isPort(state, cityHexId) {
    const tile = tileOf(state, cityHexId);
    return !!tile && (tile.terrain === 'COAST' || neighbours(state, cityHexId).some((n)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isNavigableWater"])(n)));
}
function blockadedBy(state, cityHexId, ownerId) {
    // Frota Abordagem (V5.1b): a won boarding keeps the port shut through the next round, even with no ship beside it.
    const city = state.core.players.flatMap((player)=>player.civilization.cities).find((candidate)=>candidate.hexId === cityHexId);
    const meta = city ? state.cities.find((candidate)=>candidate.cityId === city.id) : undefined;
    if (meta && meta.portBlockedUntil >= state.core.round && meta.portBlockedBy && meta.portBlockedBy !== ownerId && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["atWar"])(state, meta.portBlockedBy, ownerId)) return meta.portBlockedBy;
    const near = new Set([
        cityHexId,
        ...neighbours(state, cityHexId).filter((n)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isNavigableTerrain"])(n.terrain)).map((n)=>n.id)
    ]);
    // Only warships blockade; a coastal vessel does not.
    return state.units.find((unit)=>state.rules.units[unit.kind].domain === 'SEA' && state.rules.units[unit.kind].strength > 0 && unit.ownerId !== ownerId && near.has(unit.hexId) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["atWar"])(state, unit.ownerId, ownerId))?.ownerId ?? null;
}
function launchHex(state, actor, cityHexId, kind = 'FLEET') {
    const fleet = {
        id: 'launch-preview',
        ownerId: actor,
        kind,
        hexId: cityHexId,
        recruitedRound: Math.max(1, state.core.round),
        carrierId: null
    };
    const candidates = [
        tileOf(state, cityHexId),
        ...neighbours(state, cityHexId).sort((a, b)=>Number(a.terrain !== 'COAST') - Number(b.terrain !== 'COAST') || a.id.localeCompare(b.id))
    ].filter((tile)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isNavigableTerrain"])(tile.terrain) && !state.units.some((unit)=>unit.hexId === tile.id && unit.ownerId !== actor));
    return candidates.find((tile)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackBlock"])(state, actor, [
            {
                ...fleet,
                hexId: tile.id
            }
        ], tile.id) === null)?.id ?? null;
}
const ordered = (state, actor)=>new Set(state.players.find((p)=>p.playerId === actor).orders.flatMap((order)=>'unitIds' in order ? order.unitIds : 'unitId' in order ? [
            order.unitId
        ] : []));
function embarkBlock(state, actor, unitIds, fleetId) {
    const fleet = state.units.find((unit)=>unit.id === fleetId && unit.ownerId === actor && isCarrierKind(state, unit.kind));
    if (!fleet) return 'Escolha um navio seu que transporte peças.';
    const units = unitIds.map((id)=>state.units.find((unit)=>unit.id === id && unit.ownerId === actor));
    if (units.some((unit)=>!unit) || new Set(unitIds).size !== unitIds.length) return 'Escolha peças suas, sem repetir.';
    const pieces = units, busy = ordered(state, actor);
    if (pieces.some((unit)=>state.rules.units[unit.kind].domain !== 'LAND')) return 'Só peças terrestres embarcam.';
    if (pieces.some(isCarried)) return 'Uma das peças já está embarcada.';
    if (pieces.some((unit)=>busy.has(unit.id)) || busy.has(fleet.id) && pieces.length === 0) return 'Cancele as ordens dessas peças antes de embarcar.';
    if (pieces.some((unit)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(tileOf(state, unit.hexId), tileOf(state, fleet.hexId)) > 1)) return 'As peças precisam estar no hex da frota ou ao lado dele.';
    const load = pieces.reduce((total, unit)=>total + state.rules.units[unit.kind].cargo, 0);
    if (load > cargoRoom(state, fleet.id)) return `A frota tem ${cargoRoom(state, fleet.id)} vaga(s); estas peças ocupam ${load}.`;
    return null;
}
function embark(state, actor, unitIds, fleetId) {
    const blocked = embarkBlock(state, actor, unitIds, fleetId);
    if (blocked) throw new Error(blocked);
    const fleet = state.units.find((unit)=>unit.id === fleetId);
    for (const unit of state.units.filter((candidate)=>unitIds.includes(candidate.id))){
        unit.carrierId = fleet.id;
        unit.hexId = fleet.hexId;
    }
}
function disembarkBlock(state, actor, unitIds, target) {
    const units = unitIds.map((id)=>state.units.find((unit)=>unit.id === id && unit.ownerId === actor));
    if (units.some((unit)=>!unit) || new Set(unitIds).size !== unitIds.length) return 'Escolha peças suas, sem repetir.';
    const pieces = units;
    if (pieces.some((unit)=>!isCarried(unit))) return 'Só peças embarcadas desembarcam.';
    if (new Set(pieces.map((unit)=>unit.hexId)).size !== 1) return 'Desembarque peças de uma frota por vez.';
    const tile = tileOf(state, target), from = tileOf(state, pieces[0].hexId);
    if (!tile || tile.terrain === 'SEA' || tile.terrain === 'UNKNOWN') return 'Desembarque em terra (Costa ou interior).';
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(from, tile) > 1) return 'O desembarque é no hex da frota ou ao lado dele.';
    if (!state.players.find((p)=>p.playerId === actor).knownHexIds.includes(tile.id)) return 'Desembarque num hex conhecido.';
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["movementOpen"])(state, actor, tile.ownerId) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["enemyCityAt"])(state, actor, tile.id) || state.units.some((unit)=>unit.hexId === tile.id && unit.ownerId !== actor)) return 'Fronteira fechada, cidade inimiga ou presença de outra civilização: ataque a partir da frota.';
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackBlock"])(state, actor, pieces.map((unit)=>({
            ...unit,
            carrierId: null
        })), tile.id);
}
function disembark(state, actor, unitIds, target) {
    const blocked = disembarkBlock(state, actor, unitIds, target);
    if (blocked) throw new Error(blocked);
    for (const unit of state.units.filter((candidate)=>unitIds.includes(candidate.id))){
        unit.carrierId = null;
        unit.hexId = target;
    }
}
function settleCargo(state) {
    for (const unit of state.units.filter(isCarried)){
        const carrier = state.units.find((candidate)=>candidate.id === unit.carrierId);
        if (carrier) unit.hexId = carrier.hexId;
    }
    const orphans = state.units.filter((unit)=>isCarried(unit) && !state.units.some((candidate)=>candidate.id === unit.carrierId));
    const byHex = new Map();
    for (const unit of orphans)byHex.set(unit.hexId, [
        ...byHex.get(unit.hexId) ?? [],
        unit
    ]);
    const lost = [];
    for (const [hex, group] of byHex){
        let shoreUsed = false;
        for (const unit of [
            ...group
        ].sort((a, b)=>state.rules.units[b.kind].strength - state.rules.units[a.kind].strength || a.id.localeCompare(b.id))){
            const rescue = state.units.find((f)=>isCarrierKind(state, f.kind) && f.ownerId === unit.ownerId && f.hexId === hex && cargoRoom(state, f.id) >= state.rules.units[unit.kind].cargo);
            if (rescue) {
                unit.carrierId = rescue.id;
                continue;
            }
            const shore = shoreUsed ? undefined : neighbours(state, hex).sort((a, b)=>a.id.localeCompare(b.id)).find((tile)=>tile.terrain !== 'SEA' && tile.terrain !== 'UNKNOWN' && !state.units.some((other)=>other.hexId === tile.id && other.ownerId !== unit.ownerId) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackBlock"])(state, unit.ownerId, [
                    {
                        ...unit,
                        carrierId: null
                    }
                ], tile.id) === null);
            if (shore) {
                unit.carrierId = null;
                unit.hexId = shore.id;
                shoreUsed = true;
                continue;
            }
            lost.push(unit.id);
        }
        if (group.length) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(state, {
            type: 'LOSSES',
            actorId: group[0].ownerId,
            visibleTo: [
                group[0].ownerId
            ],
            message: `Naufrágio em ${hex}: ${group.length - group.filter((u)=>lost.includes(u.id)).length} de ${group.length} peça(s) embarcada(s) salva(s).`,
            hexId: hex,
            unitIds: group.map((u)=>u.id)
        });
    }
    if (lost.length) state.units = state.units.filter((unit)=>!lost.includes(unit.id));
}
function suspendBlockadedRoutes(state) {
    const cities = state.core.players.flatMap((player)=>player.civilization.cities);
    for (const route of state.routes){
        if (route.suspended) continue;
        const ends = [
            cities.find((city)=>city.id === route.fromCityId),
            cities.find((city)=>city.id === route.toCityId)
        ];
        if (ends.some((city)=>city && isPort(state, city.hexId) && blockadedBy(state, city.hexId, city.ownerId) !== null)) route.suspended = true;
    }
}
}),
"[project]/packages/game-engine/dist/alpha-phases.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CORE_PHASE_MIRROR",
    ()=>CORE_PHASE_MIRROR,
    "INTERACTIVE_PHASES",
    ()=>INTERACTIVE_PHASES,
    "LEGAL_COMMANDS",
    ()=>LEGAL_COMMANDS,
    "advanceAfterReady",
    ()=>advanceAfterReady,
    "drawWorldPulse",
    ()=>drawWorldPulse,
    "openRound",
    ()=>openRound,
    "pendingAttacks",
    ()=>pendingAttacks,
    "prestigeRanking",
    ()=>prestigeRanking,
    "resolveOrders",
    ()=>resolveOrders,
    "setAlphaPhase",
    ()=>setAlphaPhase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$trade$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-trade.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-city.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$messages$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-messages.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-cards.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-random.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-cards.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-naval.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-diplomacy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-world.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-threats.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resonance.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-military.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$combat$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-combat.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$hegemony$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-hegemony.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-institutions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-urban.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-kits.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$telemetry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-telemetry.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-government.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$era$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-era-turn.js [app-route] (ecmascript)");
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
const CORE_PHASE_MIRROR = {
    WORLD_PULSE: 'MAINTENANCE',
    PLANNING: 'PLANNING',
    URBAN_ACTIONS: 'PLANNING',
    ORDERS_MOVEMENT: 'RESOLUTION',
    DIPLOMACY_TRADE: 'RESOLUTION',
    CONFLICTS: 'REACTION',
    INTEGRATION_MAINTENANCE: 'MAINTENANCE',
    END_ROUND: 'END_ROUND',
    ERA_TURN: 'END_ROUND'
};
function setAlphaPhase(state, phase) {
    state.phase = phase;
    state.core.phase = CORE_PHASE_MIRROR[phase];
}
const INTERACTIVE_PHASES = [
    'PLANNING',
    'CONFLICTS',
    'ERA_TURN'
];
const planning = [
    'MANAGE',
    'QUEUE_ORDER',
    'CANCEL_ORDER',
    'SETTLE',
    'DECLARE_HEGEMONY',
    'CHOOSE_AMBITIONS',
    'PLAY_CARD',
    'PLAY_CIVILIZATION_CARD',
    'HIRE_ADVISOR',
    'WORLD_CHOICE',
    'ADVANCE_LEGACY_WORK',
    'PROPOSE_TREATY',
    'RESPOND_TREATY',
    'END_TREATY',
    'DECLARE_WAR',
    'BUILD_ROAD',
    'LEADER_ABILITY',
    'SET_DEFENSE_POSTURE',
    'SET_CASUALTY_PRIORITY',
    'URBAN_ACTION',
    'READY',
    'UNREADY',
    'EMBARK',
    'DISEMBARK',
    'DEMOBILIZE',
    'CONTEST_PRESENCE',
    'RESOLVE_CHOICE',
    'INDEPENDENT_ACTION',
    'PROPOSE_TRADE',
    'RESPOND_TRADE'
];
const LEGAL_COMMANDS = {
    WORLD_PULSE: new Set(),
    PLANNING: new Set(planning),
    URBAN_ACTIONS: new Set([
        'URBAN_ACTION',
        'READY',
        'UNREADY'
    ]),
    ORDERS_MOVEMENT: new Set(),
    DIPLOMACY_TRADE: new Set([
        'PROPOSE_TREATY',
        'RESPOND_TREATY',
        'END_TREATY',
        'DECLARE_WAR',
        'READY',
        'UNREADY'
    ]),
    CONFLICTS: new Set([
        'PLAY_CARD',
        'READY',
        'UNREADY'
    ]),
    INTEGRATION_MAINTENANCE: new Set(),
    END_ROUND: new Set(),
    /** Step 7 of the Era turn: choices, one Ambição swap, the defensive posture, and READY. Reforms were reserved in the last round. */ ERA_TURN: new Set([
        'RESOLVE_CHOICE',
        'SWAP_AMBITION',
        'SET_DEFENSE_POSTURE',
        'READY',
        'UNREADY'
    ])
};
const PULSE_RESOURCE_NAMES = {
    FOOD: 'Alimento',
    WOOD: 'Madeira',
    STONE: 'Pedra',
    METAL: 'Metal',
    WEALTH: 'Riqueza',
    KNOWLEDGE: 'Conhecimento',
    INFLUENCE: 'Influência',
    CULTURE: 'Cultura'
};
const RESOURCE_OF_MODULE = {
    FOOD: 'food',
    WOOD: 'wood',
    STONE: 'stone',
    METAL: 'metal',
    WEALTH: 'wealth',
    KNOWLEDGE: 'knowledge',
    INFLUENCE: 'influence',
    CULTURE: 'culture'
};
function viewersAt(state, hexId, always = []) {
    return state.players.map((player)=>player.playerId).filter((playerId)=>always.includes(playerId) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["visibleHexIds"])(state, playerId).has(hexId));
}
function drawWorldPulse(state) {
    const pulse = state.worldPulse;
    if (pulse.current) {
        pulse.discard.push(pulse.current.id);
        pulse.current = null;
    }
    if (pulse.deck.length === 0) {
        pulse.deck = pulse.discard;
        pulse.discard = [];
    }
    if (pulse.deck.length === 0) return;
    const id = pulse.deck.splice((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRandomInteger"])(state, pulse.deck.length), 1)[0];
    const card = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["WORLD_PULSE_CARDS"].find((candidate)=>candidate.id === id);
    if (!card) return;
    pulse.current = card;
    pulse.resolvedRound = state.core.round;
    for (const module of card.modules){
        if (module.resource === null || module.amount === 0) continue;
        const key = RESOURCE_OF_MODULE[module.resource];
        for (const player of state.players){
            if (module.amount > 0) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, player.playerId, {
                [key]: module.amount
            });
            else if (card.mitigatedBy.some((id)=>player.research.includes(id))) {
                state.telemetry.eventMitigations++;
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'PULSE_MITIGATED', `${card.name}: sua civilização mitigou a perda.`, [
                    player.playerId
                ]);
                const recovery = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitDroughtRecovery"])(state, player.playerId, card);
                if (recovery > 0 && key === 'food') {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, player.playerId, {
                        food: recovery
                    });
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'PULSE_RECOVERY', 'Cheia do Nilo: a Irrigação devolve +1 Alimento.', [
                        player.playerId
                    ]);
                }
            } else {
                const loss = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitDroughtRelief"])(state, player.playerId, card, -module.amount);
                if (loss > 0) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLose"])(state, player.playerId, {
                    [key]: loss
                });
            }
        }
    }
    // Each civilization may answer the Pulse: Prestígio or Cultura (canon §24 "Pulso (escolha) +1 Prestígio").
    for (const player of state.players)(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addPendingChoice"])(state, player.playerId, {
        source: 'PULSE',
        cardId: card.id,
        title: card.name,
        text: 'Como sua civilização responde ao Pulso do mundo?',
        mitigated: false,
        options: [
            {
                id: 'prestige',
                label: 'Aproveitar a ocasião: +1 Prestígio',
                ops: [
                    {
                        op: 'PRESTIGE',
                        n: 1
                    }
                ]
            },
            {
                id: 'culture',
                label: 'Registrar nas crônicas: +2 Cultura',
                ops: [
                    {
                        op: 'GAIN',
                        resource: 'culture',
                        n: 2
                    }
                ]
            }
        ]
    });
    if (card.command) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyThreatCommand"])(state, null, {
        op: 'THREAT',
        command: card.command.command,
        ...card.command.kind ? {
            kind: card.command.kind
        } : {}
    });
    state.telemetry.worldPulseEvents += 1;
    const effects = card.modules.filter((module)=>module.resource !== null && module.amount !== 0).map((module)=>`${module.amount > 0 ? '+' : '−'}${Math.abs(module.amount)} ${PULSE_RESOURCE_NAMES[module.resource]}`);
    const message = `Pulso do mundo: ${card.name} — ${effects.length ? `${effects.join(', ')} para todas as civilizações` : 'sem efeito nos recursos'}.`;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'WORLD_PULSE', message);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(state, {
        type: 'ROUND_EVENT',
        actorId: null,
        visibleTo: null,
        message,
        unitIds: []
    });
}
function openRound(state) {
    if (state.phase !== 'WORLD_PULSE') throw new Error('Uma rodada só abre a partir do Pulso do mundo.');
    state.roundLedgers = state.roundLedgers.filter((ledger)=>ledger.round >= state.core.round);
    for (const player of state.players){
        player.ready = false;
        player.spentCommands = 0;
        player.ordersSpent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyOrderCount"])();
        player.orders = [];
        player.plannedActions = [];
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ledgerOf"])(state, player.playerId);
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["passEraByCalendar"])(state);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["maintainCards"])(state);
    // The first Pulse opens the match (Era I); every later Pulse is drawn at step 3 of the Era turn (canon §18, §22).
    if (state.core.round === 1) drawWorldPulse(state);
    for (const player of state.players)(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyRecurringEffects"])(state, player.playerId, 'ROUND_START');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyGovernmentRoundStart"])(state);
    setAlphaPhase(state, 'PLANNING');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'ROUND_STARTED', `Rodada ${state.core.round}: Planejamento.`);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(state, {
        type: 'ROUND_EVENT',
        actorId: null,
        visibleTo: null,
        message: `Rodada ${state.core.round} iniciada.`,
        unitIds: []
    });
}
function resolveOrders(state, types) {
    for (const type of types)for (const id of state.initiative){
        const orders = state.players.find((player)=>player.playerId === id).orders.filter((order)=>order.type === type);
        for (const order of orders){
            const candidate = structuredClone(state);
            try {
                if (order.type === 'EXPLORE') (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["exploreRegion"])(candidate, id, order);
                else if (order.type === 'TRADE') (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["establishRoute"])(candidate, id, order);
                else if (order.type === 'INFLUENCE') (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveInfluence"])(candidate, id, order);
                else (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateMilitaryOrder"])(candidate, id, order);
                if (order.type === 'MOVE') {
                    candidate.units.filter((unit)=>order.unitIds.includes(unit.id)).forEach((unit)=>{
                        unit.hexId = order.path.at(-1);
                    });
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["settleCargo"])(candidate);
                }
                if (order.type === 'ATTACK') (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$combat$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["resolveBattle"])(candidate, id, order);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["refreshAlphaAdministration"])(candidate);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["refreshKnowledge"])(candidate);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$hegemony$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["refreshHegemony"])(candidate);
                const before = {
                    units: new Map(state.units.map((unit)=>[
                            unit.id,
                            unit
                        ])),
                    rules: state.rules,
                    names: new Map([
                        ...state.core.players.map((player)=>[
                                player.id,
                                player.name
                            ]),
                        [
                            'world',
                            'As Ameaças do Mundo'
                        ]
                    ])
                };
                const message = order.type === 'ATTACK' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$messages$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["battleMessage"])(before.names, candidate.battles.at(-1)) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$messages$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["orderMessage"])(state, id, order, order.type === 'TRADE' ? state.core.players.flatMap((player)=>player.civilization.cities).find((city)=>city.id === order.toCityId)?.name : undefined);
                Object.assign(state, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaStateSchema"].parse(candidate));
                const target0 = order.type === 'MOVE' ? order.path.at(-1) : order.type === 'EXPLORE' || order.type === 'INFLUENCE' || order.type === 'ATTACK' ? order.target : undefined;
                // Moves, exploration and attacks change the shared table: everyone who can see that hex (the whole table in an open Region) reads them. Trade and influence stay with their owner.
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, type, message, target0 && (order.type === 'MOVE' || order.type === 'EXPLORE' || order.type === 'ATTACK') ? viewersAt(state, target0, [
                    id
                ]) : [
                    id
                ]);
                const target = order.type === 'MOVE' ? order.path.at(-1) : order.type === 'EXPLORE' || order.type === 'INFLUENCE' || order.type === 'ATTACK' ? order.target : state.core.players.flatMap((player)=>player.civilization.cities).find((city)=>city.id === order.toCityId)?.hexId;
                const unitIds = 'unitIds' in order ? order.unitIds : 'unitId' in order ? [
                    order.unitId
                ] : [];
                const eventType = {
                    EXPLORE: 'EXPLORATION',
                    MOVE: 'MOVEMENT',
                    TRADE: 'TRADE',
                    ATTACK: 'COMBAT',
                    INFLUENCE: 'INFLUENCE'
                }[order.type];
                const visibleTo = target ? viewersAt(state, target, [
                    id
                ]) : [
                    id
                ];
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(state, {
                    type: eventType,
                    actorId: id,
                    visibleTo,
                    message,
                    ...target ? {
                        hexId: target
                    } : {},
                    unitIds
                });
                if (order.type === 'ATTACK') {
                    const battle = state.battles.at(-1);
                    if (battle?.losses.length) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(state, {
                        type: 'LOSSES',
                        actorId: id,
                        visibleTo,
                        message: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$messages$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["lossesMessage"])(before, battle.losses),
                        hexId: order.target,
                        unitIds: battle.losses
                    });
                    if (battle?.retreat) {
                        const retreating = battle.winnerId === id ? battle.defenderId : id;
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(state, {
                            type: 'RETREAT',
                            actorId: retreating,
                            visibleTo,
                            message: `${before.names.get(retreating) ?? 'O derrotado'} recuou para ${battle.retreat}.`,
                            hexId: battle.retreat,
                            unitIds: []
                        });
                    }
                    const advanced = order.unitIds.filter((unitId)=>state.units.some((unit)=>unit.id === unitId && unit.hexId === order.target));
                    if (advanced.length) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(state, {
                        type: 'ADVANCE',
                        actorId: id,
                        visibleTo,
                        message: `${before.names.get(id) ?? 'O vencedor'} avançou para ${order.target}.`,
                        hexId: order.target,
                        unitIds: advanced
                    });
                }
            } catch (error) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'ORDER_FAILED', error instanceof Error ? error.message : 'Ordem não pôde ser executada.', [
                    id
                ]);
            }
        }
    }
}
function plannedOf(state, actor, types) {
    return state.players.find((player)=>player.playerId === actor).plannedActions.filter((action)=>action.type !== 'GOVERNMENT_REFORM' && types.includes(action.type));
}
/** Resolves private urban/diplomatic reservations by slot, then initiative. Failed actions are atomic and become visible events. */ function resolvePlannedActions(state, types) {
    const queued = new Map(state.initiative.map((actor)=>[
            actor,
            plannedOf(state, actor, types)
        ]));
    const maximum = Math.max(0, ...state.initiative.map((actor)=>queued.get(actor).length));
    for(let slot = 0; slot < maximum; slot++)for (const actor of state.initiative){
        const action = queued.get(actor)[slot];
        if (!action) continue;
        const candidate = structuredClone(state), progress = candidate.players.find((player)=>player.playerId === actor);
        progress.plannedActions = progress.plannedActions.filter((item)=>item.id !== action.id);
        try {
            if (action.type === 'URBAN_ACTION') {
                const { id, ...payload } = action;
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["performUrbanAction"])(candidate, actor, {
                    ...payload,
                    planId: id,
                    expectedVersion: candidate.version
                });
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(candidate, action.action, `Ação planejada executada: ${action.action}.`, [
                    actor
                ]);
                const city = candidate.core.players.flatMap((player)=>player.civilization.cities).find((item)=>item.id === action.cityId);
                const type = {
                    PRODUCE: 'PRODUCTION',
                    BUILD: 'CONSTRUCTION',
                    RECRUIT: 'RECRUITMENT',
                    RESEARCH: 'RESEARCH',
                    ELEVATE: 'CONSTRUCTION',
                    PROMOTE_MOOD: 'ROUND_EVENT',
                    SUPPORT_TRADE: 'TRADE',
                    CIVIC_ACTION: 'ROUND_EVENT',
                    MOVE_CAPITAL: 'ROUND_EVENT'
                }[action.action];
                const visibleTo = action.action === 'BUILD' ? viewersAt(candidate, city.hexId, [
                    actor
                ]) : [
                    actor
                ];
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(candidate, {
                    type,
                    actorId: actor,
                    visibleTo,
                    message: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$messages$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["urbanActionMessage"])(state, candidate, actor, action, city.name),
                    hexId: city.hexId,
                    cityId: city.id,
                    unitIds: []
                });
            } else {
                const { id, ...payload } = action;
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["manageDiplomacy"])(candidate, actor, {
                    ...payload,
                    planId: id,
                    expectedVersion: candidate.version
                });
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(candidate, action.type, `Ação diplomática planejada executada: ${action.type}.`, [
                    actor
                ]);
                if (action.type === 'DECLARE_WAR') (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(candidate, 'WAR_DECLARED', `${candidate.core.players.find((player)=>player.id === actor)?.name ?? 'Uma civilização'} declarou guerra a ${candidate.core.players.find((player)=>player.id === action.targetId)?.name ?? 'outra civilização'}.`, null);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(candidate, {
                    type: 'ROUND_EVENT',
                    actorId: actor,
                    visibleTo: action.type === 'DECLARE_WAR' ? null : [
                        actor,
                        action.recipientId
                    ],
                    message: action.type === 'DECLARE_WAR' ? `${candidate.core.players.find((player)=>player.id === actor)?.name ?? 'Uma civilização'} declarou guerra a ${candidate.core.players.find((player)=>player.id === action.targetId)?.name ?? 'outra civilização'}.` : `${candidate.core.players.find((player)=>player.id === actor)?.name ?? 'Uma civilização'} propôs ${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$messages$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TREATY_NAMES"][action.treaty] ?? 'um acordo'} a ${candidate.core.players.find((player)=>player.id === action.recipientId)?.name ?? 'outra civilização'}.`,
                    unitIds: []
                });
            }
            Object.assign(state, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaStateSchema"].parse(candidate));
        } catch (error) {
            state.players.find((player)=>player.playerId === actor).plannedActions = state.players.find((player)=>player.playerId === actor).plannedActions.filter((item)=>item.id !== action.id);
            const message = error instanceof Error ? `A ação não pôde ser realizada: ${error.message}` : 'A ação não pôde ser realizada.';
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'ACTION_FAILED', message, [
                actor
            ]);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(state, {
                type: 'FAILURE',
                actorId: actor,
                visibleTo: [
                    actor
                ],
                message,
                ...action.type === 'URBAN_ACTION' ? {
                    cityId: action.cityId
                } : {},
                unitIds: []
            });
        }
    }
}
/**
 * Upkeep, population food and growth, stability and storage. Growth is fed only by food produced this round by PRODUCE, so a
 * civilization that never produces never grows. Nothing is credited to a city here.
 */ /**
 * Sustenance, growth, military upkeep and Ânimo (canon §7, §10). Each city eats 1 Alimento per 2 inhabitants; a city that
 * cannot be fed loses one inhabitant (Disponível first, Soldado last) and one Ânimo. Then each city below its level's
 * ceiling may Crescer for 3 Alimento (2 with Celeiro), biggest first, once per round. Pieces cost 1 Alimento per 2 land
 * pieces and 1 Riqueza per ship. Estabilidade is no longer touched: Ânimo is the social state.
 */ function maintainCivilizations(state) {
    for (const owner of state.core.players){
        const ledger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ledgerOf"])(state, owner.id);
        const zero = {
            food: 0,
            materials: 0,
            wealth: 0,
            knowledge: 0,
            influence: 0
        };
        const progress = state.players.find((player)=>player.playerId === owner.id);
        const metas = state.cities.filter((meta)=>meta.currentOwnerId === owner.id);
        // Sustenance, city by city, the capital first; the capital is the last to go hungry.
        const order = [
            ...owner.civilization.cities
        ].sort((a, b)=>Number(b.id === owner.civilization.capitalCityId) - Number(a.id === owner.civilization.capitalCityId));
        let shortage = false;
        for (const city of order){
            const required = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["citySustenance"])(city.population);
            ledger.upkeepRequired.food += required;
            const eaten = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaDrain"])(state, owner.id, {
                ...zero,
                food: required
            }, 'upkeepPaid').food;
            if (eaten >= required) continue;
            shortage = true;
            const meta = metas.find((candidate)=>candidate.cityId === city.id);
            const current = owner.civilization.cities.find((candidate)=>candidate.id === city.id);
            if (current.population > 1) {
                const workers = {
                    ...current.workers
                };
                const victim = [
                    'unassigned',
                    'producers',
                    'artisans',
                    'merchants',
                    'scholars',
                    'soldiers'
                ].find((role)=>workers[role] > 0);
                workers[victim] -= 1;
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["replaceCity"])(state, city.id, {
                    ...current,
                    population: current.population - 1,
                    workers
                });
            }
            if (meta) meta.mood = Math.max(0, meta.mood - 1);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'FOOD_SHORTAGE', `${city.name} passou fome: faltaram ${required - eaten} Alimento. A cidade perde um habitante e Ânimo.`, [
                owner.id
            ]);
        }
        // Crescer: only cities fed this round, biggest first, one habitant each.
        if (!shortage) {
            const fed = [
                ...owner.civilization.cities
            ].sort((a, b)=>b.population - a.population);
            for (const city of fed){
                const meta = metas.find((candidate)=>candidate.cityId === city.id);
                if (!meta || meta.status === 'OCCUPIED' || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["canGrow"])(meta, city)) continue;
                const cost = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["growCost"])(state, city.id);
                if (progress.resources.food < cost) continue;
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaDrain"])(state, owner.id, {
                    ...zero,
                    food: cost
                }, 'expenses');
                const current = owner.civilization.cities.find((candidate)=>candidate.id === city.id);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["replaceCity"])(state, city.id, {
                    ...current,
                    population: current.population + 1,
                    workers: {
                        ...current.workers,
                        unassigned: current.workers.unassigned + 1
                    }
                });
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'POPULATION_GROWN', `${city.name} cresceu para ${current.population + 1} habitantes.`, [
                    owner.id
                ]);
            }
        }
        // Military upkeep: 1 Alimento per 2 land pieces (plus kit extras), 1 Riqueza per ship.
        const military = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["militaryUpkeep"])(state, owner.id);
        const upkeep = {
            ...zero,
            food: military.food + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitFoodUpkeep"])(state, owner.id),
            wealth: military.wealth
        };
        for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RESOURCE_KEYS"])ledger.upkeepRequired[key] += upkeep[key];
        const paid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaDrain"])(state, owner.id, upkeep, 'upkeepPaid');
        const unitShortage = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RESOURCE_KEYS"].some((key)=>paid[key] < upkeep[key]);
        if (unitShortage) {
            for (const meta of metas)meta.mood = Math.max(0, meta.mood - 1);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'UPKEEP_SHORTAGE', 'Faltaram recursos para manter as peças. Ânimo das cidades −1.', [
                owner.id
            ]);
        }
        // Sobre-extensão (canon §4): the city with the lowest Ânimo loses one level each round over the capacity.
        const admin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["administration"])(state, owner.id);
        if (admin.overextended) {
            const lowest = [
                ...metas
            ].sort((a, b)=>a.mood - b.mood)[0];
            if (lowest) lowest.mood = Math.max(0, lowest.mood - 1);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'ADMINISTRATIVE_OVEREXTENSION', `Sobre-extensão: carga ${admin.load} para capacidade ${admin.capacity}. Ânimo cai na cidade mais abalada.`, [
                owner.id
            ]);
        }
        for (const meta of metas)state.telemetry.moodSamples.push(meta.mood);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["refreshAlphaAdministration"])(state);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'UPKEEP', `Manutenção: ${ledger.upkeepRequired.food} Alimento e ${upkeep.wealth} Riqueza.`, [
            owner.id
        ]);
    }
}
function runMaintenance(state) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["maintainTrade"])(state);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["suspendBlockadedRoutes"])(state);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$trade$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["settleTradeOffers"])(state);
    if (state.core.round % 2 === 1) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["activateThreats"])(state, {
        launch: false
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["suspendThreatenedRoutes"])(state);
    for (const player of state.players)(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyRecurringEffects"])(state, player.playerId, 'MAINTENANCE', {
        enforceStorage: false
    });
    maintainCivilizations(state);
    for (const player of state.players)(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["enforceStorageRecorded"])(state, player.playerId);
    state.players.forEach((player)=>{
        player.ready = false;
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["refreshKnowledge"])(state);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$hegemony$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["refreshHegemony"])(state);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'MAINTENANCE', `Manutenção da rodada ${state.core.round} concluída.`);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(state, {
        type: 'ROUND_EVENT',
        actorId: null,
        visibleTo: null,
        message: `Manutenção da rodada ${state.core.round} concluída.`,
        unitIds: []
    });
}
function buildRoundReports(state) {
    for (const owner of state.core.players){
        // A copy: the Era turn that follows the last round of an Era still moves resources (Pulso, rewards, reforms) after the report closes.
        const ledger = structuredClone((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ledgerOf"])(state, owner.id));
        const closing = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaToLegacyResources"])(state.players.find((player)=>player.playerId === owner.id).resources);
        state.roundReports.push({
            playerId: owner.id,
            round: state.core.round,
            opening: ledger.opening,
            institutions: ledger.institutions,
            trade: ledger.trade,
            mining: ledger.mining,
            production: ledger.production,
            other: ledger.other,
            losses: ledger.losses,
            expenses: ledger.expenses,
            discarded: ledger.discarded,
            economy: null,
            upkeepRequired: ledger.upkeepRequired,
            upkeepPaid: ledger.upkeepPaid,
            closing,
            administrativeLoad: owner.civilization.administrativeLoad,
            administrativeCapacity: owner.civilization.administrativeCapacity,
            cities: owner.civilization.cities.map((city)=>{
                const before = ledger.cities.find((entry)=>entry.cityId === city.id);
                return {
                    cityId: city.id,
                    populationBefore: before?.population ?? city.population,
                    populationAfter: city.population,
                    stabilityBefore: before?.stability ?? city.stability,
                    stabilityAfter: city.stability
                };
            }),
            resolution: state.resolutionEvents.filter((event)=>event.round === state.core.round && (event.visibleTo === null || event.visibleTo.includes(owner.id)))
        });
    }
}
function prestigeRanking(state) {
    const metrics = (id)=>{
        const progress = state.players.find((player)=>player.playerId === id);
        const owner = state.core.players.find((player)=>player.id === id);
        return [
            progress.prestige,
            progress.research.length,
            owner.civilization.cities.reduce((total, city)=>total + city.population, 0),
            progress.resources.wealth
        ];
    };
    return [
        ...state.initiative
    ].sort((a, b)=>{
        const x = metrics(a), y = metrics(b);
        for(let index = 0; index < x.length; index++)if (x[index] !== y[index]) return (y[index] ?? 0) - (x[index] ?? 0);
        return state.initiative.indexOf(a) - state.initiative.indexOf(b);
    });
}
/** END_ROUND: score, close reports, check victory, rotate initiative, increment the round and open the next WORLD_PULSE. */ function endRound(state) {
    buildRoundReports(state);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$telemetry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recordRoundTelemetry"])(state);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$hegemony$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["refreshHegemony"])(state);
    const hegemon = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$hegemony$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hegemonyWinner"])(state);
    if (hegemon) {
        state.winner = {
            playerId: hegemon,
            reason: 'HEGEMONY',
            round: state.core.round
        };
        state.core.status = 'FINISHED';
        state.telemetry.winner = hegemon;
        state.telemetry.victoryReason = 'HEGEMONY';
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'GAME_FINISHED', 'Uma civilização consolidou sua Hegemonia.');
        return;
    }
    if (state.core.round >= state.rules.roundLimit) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["scoreAmbitions"])(state);
        const playerId = prestigeRanking(state)[0];
        state.winner = {
            playerId,
            reason: 'ROUND_LIMIT',
            round: state.core.round
        };
        state.core.status = 'FINISHED';
        state.telemetry.winner = playerId;
        state.telemetry.victoryReason = 'ROUND_LIMIT';
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'GAME_FINISHED', 'Partida encerrada pelo limite de rodadas.');
        return;
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$era$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isEraTurnDue"])(state)) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$era$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["enterEraTurn"])(state);
        return;
    }
    const first = state.initiative.shift();
    if (first) state.initiative.push(first);
    state.core.round += 1;
    state.core.pendingOrders = Object.fromEntries(state.core.players.map((player)=>[
            player.id,
            []
        ]));
    state.telemetry.rounds = state.core.round;
    setAlphaPhase(state, 'WORLD_PULSE');
    openRound(state);
}
function pendingAttacks(state) {
    return state.initiative.flatMap((attackerId)=>state.players.find((player)=>player.playerId === attackerId).orders.flatMap((order)=>{
            if (order.type !== 'ATTACK') return [];
            const defenderId = state.units.find((unit)=>unit.hexId === order.target && unit.ownerId !== attackerId)?.ownerId ?? state.core.players.find((player)=>player.id !== attackerId && player.civilization.cities.some((city)=>city.hexId === order.target))?.id;
            return defenderId ? [
                {
                    attackerId,
                    defenderId,
                    target: order.target,
                    orderId: order.id
                }
            ] : [];
        }));
}
const REACTION_CARD = (id)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_CARDS"].find((card)=>card.id === id)?.timing === 'REACTION';
function advanceAfterReady(state) {
    for(let guard = 0; guard < 16; guard++){
        switch(state.phase){
            case 'PLANNING':
                {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["matureThreats"])(state);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$telemetry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["snapshotOrders"])(state);
                    state.players.forEach((player)=>{
                        player.ready = false;
                    });
                    state.cities.forEach((city)=>{
                        city.urbanActionsUsed = 0;
                    });
                    setAlphaPhase(state, 'URBAN_ACTIONS');
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'RESOLUTION', 'Todos prontos. Resolvendo a rodada por iniciativa.');
                    resolvePlannedActions(state, [
                        'URBAN_ACTION'
                    ]);
                    setAlphaPhase(state, 'ORDERS_MOVEMENT');
                    resolveOrders(state, [
                        'EXPLORE',
                        'MOVE',
                        'TRADE'
                    ]);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'RESOLUTION', 'Ordens de exploração, movimento e comércio resolvidas por iniciativa explícita.');
                    setAlphaPhase(state, 'DIPLOMACY_TRADE');
                    resolvePlannedActions(state, [
                        'PROPOSE_TREATY',
                        'DECLARE_WAR'
                    ]);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["settleTreaties"])(state);
                    setAlphaPhase(state, 'CONFLICTS');
                    // Only the sides of a reserved attack may react; everyone else is not asked to wait.
                    const parties = new Set(pendingAttacks(state).flatMap((attack)=>[
                            attack.attackerId,
                            attack.defenderId
                        ]));
                    state.players.forEach((player)=>{
                        player.ready = !(parties.has(player.playerId) && player.cardsPlayed < state.rules.cardsPerRound && player.hand.some(REACTION_CARD));
                    });
                    if (state.players.some((player)=>!player.ready)) return;
                    break;
                }
            case 'ERA_TURN':
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$era$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["finishEraTurn"])(state);
                return;
            case 'URBAN_ACTIONS':
            case 'DIPLOMACY_TRADE':
                throw new Error(`A fase interna ${state.phase} não aguarda jogadores.`);
            case 'CONFLICTS':
                resolveOrders(state, [
                    'ATTACK',
                    'INFLUENCE'
                ]);
                setAlphaPhase(state, 'INTEGRATION_MAINTENANCE');
                runMaintenance(state);
                setAlphaPhase(state, 'END_ROUND');
                endRound(state);
                if (state.core.status !== 'ACTIVE') return;
                return;
            default:
                throw new Error(`A fase ${state.phase} não aguarda jogadores.`);
        }
    }
    throw new Error('O ciclo de fases não convergiu.');
}
}),
"[project]/packages/game-engine/dist/alpha-presets.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "presetTerrain",
    ()=>presetTerrain,
    "worldShape",
    ()=>worldShape
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
;
const parse = (id)=>{
    const [q, r] = id.split(',').map(Number);
    return {
        q,
        r
    };
};
const hashOf = (text)=>{
    let h = 2166136261;
    for(let k = 0; k < text.length; k++){
        h ^= text.charCodeAt(k);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
};
const shapes = new WeakMap();
function worldShape(preset, seed, regions, playerCount) {
    const key = `${preset}:${seed}:${playerCount}`, bucket = shapes.get(regions) ?? new Map();
    shapes.set(regions, bucket);
    const known = bucket.get(key);
    if (known) return known;
    const built = buildShape(preset, seed, regions, playerCount);
    bucket.set(key, built);
    return built;
}
function buildShape(preset, seed, regions, playerCount) {
    const active = new Set(regions.filter((region)=>{
        const match = /^homeland-(\d+)$/.exec(region.templateId);
        return match !== null && Number(match[1]) <= playerCount;
    }).map((region)=>region.id));
    const empty = new Set();
    const shape = {
        preset,
        seed,
        active,
        inlandSea: empty,
        rim: empty,
        nearRim: empty,
        straits: empty
    };
    if (!regions.length || preset === 'MIXED') return shape;
    const board = new Set(regions.flatMap((region)=>region.hexIds));
    const neighboursOf = (id)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])(parse(id)).map((p)=>`${p.q},${p.r}`);
    if (preset === 'INLAND_SEA') {
        const origin = {
            q: 0,
            r: 0
        };
        const middle = [
            ...regions
        ].sort((a, b)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(origin, parse(a.hexIds[0])) - (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(origin, parse(b.hexIds[0])) || (a.id < b.id ? -1 : 1))[0];
        const centre = parse(middle.hexIds[0]), sea = new Set();
        for (const id of board)if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(centre, parse(id)) <= 2) sea.add(id);
        return {
            ...shape,
            inlandSea: sea
        };
    }
    if (preset === 'CONTINENTAL') {
        const rim = new Set([
            ...board
        ].filter((id)=>neighboursOf(id).some((n)=>!board.has(n))));
        const nearRim = new Set([
            ...board
        ].filter((id)=>!rim.has(id) && neighboursOf(id).some((n)=>rim.has(n))));
        return {
            ...shape,
            rim,
            nearRim
        };
    }
    // ARCHIPELAGO: islands are the cells of a multi-source flood over the Region graph; every active Pátria seeds one.
    const regionOf = new Map();
    for (const region of regions)for (const id of region.hexIds)regionOf.set(id, region.id);
    const adjacent = new Map(regions.map((region)=>[
            region.id,
            new Set()
        ]));
    for (const region of regions)for (const id of region.hexIds)for (const n of neighboursOf(id)){
        const other = regionOf.get(n);
        if (other && other !== region.id) adjacent.get(region.id).add(other);
    }
    const homes = regions.filter((region)=>active.has(region.id)).map((region)=>region.id).sort();
    const seeds = [
        ...homes
    ], target = Math.max(homes.length + 2, Math.round(regions.length / 4));
    const order = regions.map((region)=>region.id).filter((id)=>!active.has(id)).sort((a, b)=>hashOf(`${seed}:isle:${a}`) - hashOf(`${seed}:isle:${b}`));
    for (const id of order){
        if (seeds.length >= target) break;
        if (seeds.every((other)=>other !== id && !adjacent.get(other).has(id))) seeds.push(id);
    }
    const island = new Map(seeds.map((id, rank)=>[
            id,
            rank
        ])), queue = [
        ...seeds
    ];
    for(let i = 0; i < queue.length; i++)for (const next of [
        ...adjacent.get(queue[i])
    ].sort((a, b)=>hashOf(`${seed}:flood:${a}`) - hashOf(`${seed}:flood:${b}`)))if (!island.has(next)) {
        island.set(next, island.get(queue[i]));
        queue.push(next);
    }
    // The strait is one hex wide and lies on one side of every boundary: against an active Pátria it is always the other side (the Pátria is never carved),
    // between two islands it is the higher-ranked island's side.
    const straits = new Set();
    for (const id of board){
        const region = regionOf.get(id), mine = island.get(region);
        if (active.has(region)) continue;
        if (neighboursOf(id).some((n)=>{
            if (!board.has(n)) return false;
            const other = regionOf.get(n), theirs = island.get(other);
            return theirs !== mine && (active.has(other) || mine > theirs);
        })) straits.add(id);
    }
    return {
        ...shape,
        straits
    };
}
const holdsMetal = (terrain)=>terrain === 'HILLS' || terrain === 'MOUNTAINS';
function presetTerrain(shape, regionId, hexId, content) {
    const { terrain } = content;
    if (shape.preset === 'MIXED' || shape.active.has(regionId)) return terrain;
    if (content.deposit && holdsMetal(terrain)) return terrain;
    const { q, r } = parse(hexId);
    switch(shape.preset){
        case 'CONTINENTAL':
            if (shape.rim.has(hexId)) return terrain !== 'MOUNTAINS' ? 'SEA' : terrain;
            if (terrain === 'SEA') return shape.nearRim.has(hexId) ? 'SEA' : (q + r + shape.seed) % 2 === 0 ? 'PLAINS' : 'FOREST';
            return terrain === 'COAST' && !shape.nearRim.has(hexId) ? 'PLAINS' : terrain;
        case 'ARCHIPELAGO':
            return shape.straits.has(hexId) ? 'SEA' : terrain;
        case 'INLAND_SEA':
            return shape.inlandSea.has(hexId) ? 'SEA' : terrain;
        default:
            return terrain;
    }
}
}),
"[project]/packages/game-engine/dist/alpha-random.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "alphaRandomInteger",
    ()=>alphaRandomInteger,
    "combineAlphaSeed",
    ()=>combineAlphaSeed,
    "deterministicAlphaSeed",
    ()=>deterministicAlphaSeed
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$noble$2f$hashes$2f$sha2$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@noble/hashes/sha2.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$noble$2f$hashes$2f$hmac$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@noble/hashes/hmac.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$noble$2f$hashes$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@noble/hashes/utils.js [app-route] (ecmascript)");
;
;
;
function alphaRandomInteger(state, exclusiveMaximum) {
    if (!Number.isSafeInteger(exclusiveMaximum) || exclusiveMaximum < 1 || exclusiveMaximum > 0x100000000) throw new RangeError('Invalid random range');
    const limit = 0x100000000 - 0x100000000 % exclusiveMaximum;
    for(;;){
        if (state.privateRng.counter === Number.MAX_SAFE_INTEGER) throw new RangeError('Alpha RNG exhausted');
        const digest = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$noble$2f$hashes$2f$hmac$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hmac"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$noble$2f$hashes$2f$sha2$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sha256"], (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$noble$2f$hashes$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexToBytes"])(state.privateRng.seed), (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$noble$2f$hashes$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["utf8ToBytes"])(`aoh-alpha-v1:${state.privateRng.counter++}`));
        const value = new DataView(digest.buffer, digest.byteOffset, digest.byteLength).getUint32(0);
        if (value < limit) return value % exclusiveMaximum;
    }
}
function deterministicAlphaSeed(seed, gameId) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$noble$2f$hashes$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bytesToHex"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$noble$2f$hashes$2f$sha2$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sha256"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$noble$2f$hashes$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["utf8ToBytes"])(`local-aoh-alpha:${seed}:${gameId}`)));
}
function combineAlphaSeed(publicSeed, privateSeed) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$noble$2f$hashes$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bytesToHex"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$noble$2f$hashes$2f$hmac$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hmac"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$noble$2f$hashes$2f$sha2$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sha256"], (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$noble$2f$hashes$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexToBytes"])(privateSeed), (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$noble$2f$hashes$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["utf8ToBytes"])(`aoh-alpha-world:${publicSeed}`)));
}
}),
"[project]/packages/game-engine/dist/alpha-resonance.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addPendingChoice",
    ()=>addPendingChoice,
    "applyOps",
    ()=>applyOps,
    "autoResolveChoices",
    ()=>autoResolveChoices,
    "pickRepercussion",
    ()=>pickRepercussion,
    "registerAdvance",
    ()=>registerAdvance,
    "resolveChoice",
    ()=>resolveChoice
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-resonance.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-random.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-city.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-threats.js [app-route] (ecmascript)");
;
;
;
;
;
;
const playerOf = (state, actor)=>state.players.find((player)=>player.playerId === actor);
function registerAdvance(state, actor, advancementId) {
    const domains = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["advancementDomains"])(advancementId), source = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["advancementSource"])(advancementId);
    if (!domains || !source) return;
    const player = playerOf(state, actor), resonance = player.resonance;
    if (!resonance.marks.some((mark)=>mark.advancementId === advancementId)) resonance.marks.push({
        advancementId,
        domains,
        round: state.core.round
    });
    const slots = [
        ...resonance.slots,
        {
            advancementId,
            source,
            domains
        }
    ];
    if (slots.length < __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RESONANCE_SOCKETS"]) {
        resonance.slots = slots;
        return;
    }
    resonance.slots = [];
    resolveRepercussion(state, actor, slots);
}
function pickRepercussion(state, kind, domains) {
    let pool = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REPERCUSSION_CARDS"].filter((card)=>card.kind === kind && (kind === 'CONFLUENCE' || card.domains.join() === domains.join()));
    if (pool.length === 0) pool = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REPERCUSSION_CARDS"].filter((card)=>card.kind === kind);
    return pool[(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRandomInteger"])(state, pool.length)];
}
function resolveRepercussion(state, actor, slots) {
    const player = playerOf(state, actor), composition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["classifyResonance"])(slots), card = pickRepercussion(state, composition.kind, composition.domains);
    const owned = new Set(player.research);
    const mitigated = card.mitigatedBy.some((id)=>owned.has(id)), leveraged = card.leveragedBy.some((id)=>owned.has(id));
    if (!mitigated) applyOps(state, actor, card.price);
    const options = card.options.map((option)=>({
            ...option,
            ops: option.ops.map((op)=>leveraged && op.op === 'GAIN' ? {
                    ...op,
                    n: op.n + 1
                } : op)
        }));
    player.resonance.cycles++;
    player.resonance.history = [
        ...player.resonance.history,
        {
            round: state.core.round,
            kind: composition.kind,
            domains: composition.domains,
            cardId: card.id,
            slots: slots
        }
    ].slice(-10);
    state.telemetry.resonanceCycles++;
    state.telemetry.resonanceByKind[composition.kind] = (state.telemetry.resonanceByKind[composition.kind] ?? 0) + 1;
    addPendingChoice(state, actor, {
        source: 'REPERCUSSION',
        cardId: card.id,
        title: card.name,
        text: `${card.text}${mitigated ? ' Preço mitigado.' : ''}${leveraged ? ' Ganho aproveitado.' : ''}`,
        mitigated,
        options
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'REPERCUSSION', `Ressonância completa: ${card.name}. ${mitigated ? 'O preço foi mitigado. ' : ''}Escolha como aproveitar.`, [
        actor
    ]);
}
function addPendingChoice(state, actor, input) {
    const player = playerOf(state, actor);
    const choice = {
        ...input,
        id: `choice-${state.core.round}-${actor}-${player.resonance.cycles}-${player.pendingChoices.length}-${state.events.length}`,
        createdRound: state.core.round
    };
    player.pendingChoices.push(choice);
    return choice;
}
function applyOps(state, actor, ops) {
    const metas = state.cities.filter((meta)=>meta.currentOwnerId === actor);
    const owner = state.core.players.find((item)=>item.id === actor);
    for (const op of ops){
        if (op.op === 'GAIN') (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, actor, {
            [op.resource]: op.n
        });
        else if (op.op === 'LOSE') (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLose"])(state, actor, {
            [op.resource]: Math.min(op.n, playerOf(state, actor).resources[op.resource])
        });
        else if (op.op === 'PRESTIGE') playerOf(state, actor).prestige += op.n;
        else if (op.op === 'MOOD') {
            const targets = op.scope === 'ALL' ? metas : op.scope === 'CAPITAL' ? metas.filter((meta)=>meta.cityId === owner.civilization.capitalCityId) : [
                [
                    ...metas
                ].sort((a, b)=>a.mood - b.mood || a.cityId.localeCompare(b.cityId))[0]
            ].filter((meta)=>meta !== undefined);
            for (const meta of targets)meta.mood = Math.max(0, Math.min(6, meta.mood + op.delta));
        } else if (op.op === 'POPULATION') {
            for(let i = 0; i < op.n; i++){
                const city = owner.civilization.cities.find((item)=>item.id === owner.civilization.capitalCityId) ?? owner.civilization.cities[0];
                const meta = city && state.cities.find((item)=>item.cityId === city.id);
                if (city && meta && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["canGrow"])(meta, city)) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["replaceCity"])(state, city.id, {
                    ...city,
                    population: city.population + 1,
                    workers: {
                        ...city.workers,
                        unassigned: city.workers.unassigned + 1
                    }
                });
                else (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, actor, {
                    food: 2
                });
            }
        } else (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyThreatCommand"])(state, actor, op);
    }
}
function resolveChoice(state, actor, choiceId, optionId) {
    const player = playerOf(state, actor), choice = player.pendingChoices.find((item)=>item.id === choiceId);
    if (!choice) throw new Error('Não há essa decisão pendente.');
    const option = choice.options.find((item)=>item.id === optionId);
    if (!option) throw new Error('Opção inexistente.');
    applyOps(state, actor, option.ops);
    player.pendingChoices = player.pendingChoices.filter((item)=>item.id !== choiceId);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'CHOICE_RESOLVED', `${choice.title}: ${option.label}.`, [
        actor
    ]);
}
function autoResolveChoices(state) {
    let count = 0;
    for (const player of state.players)for (const choice of [
        ...player.pendingChoices
    ]){
        resolveChoice(state, player.playerId, choice.id, choice.options[0].id);
        count++;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'CHOICE_AUTO', `A decisão "${choice.title}" foi resolvida automaticamente pela primeira opção.`, [
            player.playerId
        ]);
    }
    return count;
}
;
}),
"[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "alphaCanAfford",
    ()=>alphaCanAfford,
    "alphaCost",
    ()=>alphaCost,
    "alphaCostWithMetal",
    ()=>alphaCostWithMetal,
    "alphaDrain",
    ()=>alphaDrain,
    "alphaGain",
    ()=>alphaGain,
    "alphaGainLegacy",
    ()=>alphaGainLegacy,
    "alphaLose",
    ()=>alphaLose,
    "alphaPay",
    ()=>alphaPay,
    "alphaResourcePayment",
    ()=>alphaResourcePayment,
    "alphaStorageCapacity",
    ()=>alphaStorageCapacity,
    "discardedToLegacy",
    ()=>discardedToLegacy,
    "enforceStorage",
    ()=>enforceStorage,
    "enforceStorageRecorded",
    ()=>enforceStorageRecorded,
    "initializeAlphaResources",
    ()=>initializeAlphaResources,
    "ledgerOf",
    ()=>ledgerOf,
    "metalSites",
    ()=>metalSites,
    "syncLegacyResources",
    ()=>syncLegacyResources
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-route] (ecmascript) <export WEB_ADVANCES as ADVANCEMENTS>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/arithmetic.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-leaders.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-government.js [app-route] (ecmascript)");
;
;
;
;
function alphaCost(cost, available) {
    if (!('materials' in cost)) return {
        ...cost
    };
    let wood = Math.ceil(cost.materials / 2), stone = Math.floor(cost.materials / 2), metal = 0;
    if (available) {
        wood = Math.min(cost.materials, available.wood);
        stone = Math.min(cost.materials - wood, available.stone);
        metal = Math.min(cost.materials - wood - stone, available.metal);
        wood += cost.materials - wood - stone - metal;
    }
    return {
        food: cost.food,
        wood,
        stone,
        metal,
        wealth: cost.wealth,
        knowledge: cost.knowledge,
        influence: cost.influence,
        culture: 0
    };
}
const zeroPool = ()=>({
        food: 0,
        materials: 0,
        wealth: 0,
        knowledge: 0,
        influence: 0
    });
const toLegacy = (pool)=>({
        food: pool.food ?? 0,
        materials: (pool.wood ?? 0) + (pool.stone ?? 0) + (pool.metal ?? 0),
        wealth: pool.wealth ?? 0,
        knowledge: pool.knowledge ?? 0,
        influence: pool.influence ?? 0
    });
function ledgerOf(state, actor) {
    const round = state.core.round;
    const existing = state.roundLedgers.find((entry)=>entry.playerId === actor && entry.round === round);
    if (existing) return existing;
    const pool = state.players.find((player)=>player.playerId === actor)?.resources ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])();
    const ledger = {
        playerId: actor,
        round,
        opening: toLegacy(pool),
        production: zeroPool(),
        mining: zeroPool(),
        trade: zeroPool(),
        institutions: zeroPool(),
        other: zeroPool(),
        losses: zeroPool(),
        expenses: zeroPool(),
        upkeepRequired: zeroPool(),
        upkeepPaid: zeroPool(),
        discarded: zeroPool(),
        cities: (state.core.players.find((player)=>player.id === actor)?.civilization.cities ?? []).map((city)=>({
                cityId: city.id,
                population: city.population,
                stability: city.stability
            }))
    };
    state.roundLedgers.push(ledger);
    return ledger;
}
function addLedger(target, amount) {
    for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RESOURCE_KEYS"])target[key] += amount[key];
}
function syncLegacyResources(state, actor) {
    const strategic = state.players.find((player)=>player.playerId === actor);
    const legacy = state.core.players.find((player)=>player.id === actor);
    if (strategic && legacy) legacy.resources = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaToLegacyResources"])(strategic.resources);
}
const buildCoverPercent = (state, actor)=>state.players.find((player)=>player.playerId === actor)?.research.some((id)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].find((node)=>node.id === id)?.unlocks.includes('rule:wealth-covers-60-build')) ? 60 : 0;
function alphaCanAfford(state, actor, rawCost, scope) {
    const pool = state.players.find((player)=>player.playerId === actor)?.resources;
    if (!pool) return false;
    const cost = alphaCost(rawCost, pool);
    if (pool.food < cost.food || pool.knowledge < cost.knowledge || pool.influence < cost.influence) return false;
    const shortages = [
        'wood',
        'stone',
        'metal'
    ].reduce((total, key)=>total + Math.max(0, cost[key] - pool[key]), 0);
    const materialCost = cost.wood + cost.stone + cost.metal;
    if (shortages > Math.floor(materialCost * Math.max(state.rules.balance.wealthMaterialCostPercentMax, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, actor).wealthCoverPercent, scope === 'BUILD' ? buildCoverPercent(state, actor) : 0) / 100)) return false;
    return pool.wealth >= cost.wealth + shortages * state.rules.balance.wealthConversionRate;
}
function alphaPay(state, actor, rawCost, scope) {
    const player = state.players.find((candidate)=>candidate.playerId === actor);
    if (!player || !alphaCanAfford(state, actor, rawCost, scope)) throw new Error('Recursos insuficientes para esta ação.');
    const ledger = ledgerOf(state, actor);
    const before = toLegacy(player.resources);
    const cost = alphaCost(rawCost, player.resources);
    player.resources.food -= cost.food;
    player.resources.knowledge -= cost.knowledge;
    player.resources.influence -= cost.influence;
    let wealth = cost.wealth;
    for (const key of [
        'wood',
        'stone',
        'metal'
    ]){
        const paid = Math.min(player.resources[key], cost[key]);
        player.resources[key] -= paid;
        wealth += (cost[key] - paid) * state.rules.balance.wealthConversionRate;
    }
    player.resources.wealth -= wealth;
    const after = toLegacy(player.resources);
    addLedger(ledger.expenses, {
        food: before.food - after.food,
        materials: before.materials - after.materials,
        wealth: before.wealth - after.wealth,
        knowledge: before.knowledge - after.knowledge,
        influence: before.influence - after.influence
    });
    syncLegacyResources(state, actor);
}
function alphaResourcePayment(state, scope) {
    return (corePlayer, cost)=>{
        if (!alphaCanAfford(state, corePlayer.id, cost, scope)) return false;
        alphaPay(state, corePlayer.id, cost, scope);
        const strategic = state.players.find((player)=>player.playerId === corePlayer.id);
        corePlayer.resources = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaToLegacyResources"])(strategic.resources);
        return true;
    };
}
function alphaGain(state, actor, gain, options = {}) {
    const player = state.players.find((candidate)=>candidate.playerId === actor);
    if (!player) throw new Error('Civilização desconhecida.');
    addLedger(ledgerOf(state, actor)[options.category ?? 'other'], toLegacy(gain));
    for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"])player.resources[key] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
        player.resources[key],
        gain[key] ?? 0
    ]);
    syncLegacyResources(state, actor);
    if (options.enforceStorage ?? true) enforceStorageRecorded(state, actor);
}
/** Resource key → the balance's resource type. */ const TYPE_OF = {
    food: 'FOOD',
    wood: 'WOOD',
    stone: 'STONE',
    metal: 'METAL',
    wealth: 'WEALTH',
    knowledge: 'KNOWLEDGE',
    influence: 'INFLUENCE',
    culture: 'CULTURE'
};
function alphaStorageCapacity(state, actor) {
    const cities = state.cities.filter((city)=>city.currentOwnerId === actor);
    const { base, hardCap, metropolisBonus } = state.rules.balance.limits;
    const capacity = Object.fromEntries(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"].map((key)=>[
            key,
            base[TYPE_OF[key]]
        ]));
    const counted = new Set();
    for (const city of cities)for (const building of city.buildings){
        if (counted.has(building)) continue;
        const bonus = state.rules.balance.storagePerBuilding[building];
        if (!bonus) continue;
        counted.add(building);
        const key = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"].find((candidate)=>TYPE_OF[candidate] === bonus.resource);
        capacity[key] += bonus.amount;
        if (building === 'WAREHOUSE') capacity.stone += bonus.amount;
    }
    if (cities.some((city)=>[
            'METROPOLIS',
            'IMPERIAL_METROPOLIS'
        ].includes(city.level))) for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"])capacity[key] += metropolisBonus;
    for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"])capacity[key] = Math.min(hardCap[TYPE_OF[key]], capacity[key] + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["leaderStorageBonus"])(state, actor, key));
    return capacity;
}
function enforceStorage(state, actor) {
    const player = state.players.find((candidate)=>candidate.playerId === actor);
    if (!player) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])();
    const capacity = alphaStorageCapacity(state, actor);
    const discarded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])();
    for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"]){
        discarded[key] = Math.max(0, player.resources[key] - capacity[key]);
        player.resources[key] -= discarded[key];
    }
    return discarded;
}
function discardedToLegacy(discarded) {
    return {
        food: discarded.food,
        materials: discarded.wood + discarded.stone + discarded.metal,
        wealth: discarded.wealth,
        knowledge: discarded.knowledge,
        influence: discarded.influence
    };
}
function enforceStorageRecorded(state, actor) {
    const discarded = enforceStorage(state, actor);
    const lost = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"].filter((key)=>discarded[key] > 0);
    if (lost.length === 0) return discarded;
    addLedger(ledgerOf(state, actor).discarded, discardedToLegacy(discarded));
    syncLegacyResources(state, actor);
    const labels = {
        food: 'Alimentos',
        wood: 'Madeira',
        stone: 'Pedra',
        metal: 'Metal',
        wealth: 'Riqueza',
        knowledge: 'Conhecimento',
        influence: 'Influência'
    };
    state.events.push({
        id: `event-${state.events.length + 1}`,
        round: state.core.round,
        type: 'STORAGE_DISCARD',
        audience: [
            actor
        ],
        message: `Armazenamento cheio; descartado: ${lost.map((key)=>`${discarded[key]} ${labels[key]}`).join(', ')}.`
    });
    return discarded;
}
function metalSites(state, actor) {
    const owner = state.core.players.find((player)=>player.id === actor);
    if (!owner) return [];
    const sites = [];
    for (const city of owner.civilization.cities){
        if (state.occupations.some((occupation)=>occupation.cityId === city.id)) continue;
        let producers = city.workers.producers;
        for (const hexId of city.workedHexIds){
            const tile = state.core.map.find((candidate)=>candidate.id === hexId);
            if (producers <= 0 || !tile || tile.ownerId !== actor || tile.controllerCityId !== city.id) continue;
            if (tile.features.includes('METAL') && tile.improvement === 'MINE') {
                sites.push({
                    cityId: city.id,
                    hexId
                });
                producers--;
            }
        }
    }
    return sites;
}
function initializeAlphaResources(state) {
    for (const player of state.players){
        if (__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"].every((key)=>player.resources[key] === 0)) {
            const core = state.core.players.find((candidate)=>candidate.id === player.playerId);
            if (core) player.resources = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["legacyToAlphaResources"])(core.resources);
        }
        syncLegacyResources(state, player.playerId);
    }
}
const legacyPool = (pool)=>({
        food: 0,
        materials: 0,
        wealth: 0,
        knowledge: 0,
        influence: 0,
        ...pool
    });
function alphaGainLegacy(state, actor, gain, options = {}) {
    alphaGain(state, actor, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["legacyToAlphaResources"])(legacyPool(gain)), options);
}
function alphaDrain(state, actor, charge, category = 'expenses') {
    const player = state.players.find((candidate)=>candidate.playerId === actor);
    if (!player) throw new Error('Civilização desconhecida.');
    const ledger = ledgerOf(state, actor);
    const paid = {
        food: 0,
        materials: 0,
        wealth: 0,
        knowledge: 0,
        influence: 0
    };
    for (const key of [
        'food',
        'wealth',
        'knowledge',
        'influence'
    ]){
        paid[key] = Math.min(player.resources[key], charge[key]);
        player.resources[key] -= paid[key];
    }
    let materials = charge.materials;
    for (const key of [
        'wood',
        'stone',
        'metal'
    ]){
        const taken = Math.min(player.resources[key], materials);
        player.resources[key] -= taken;
        materials -= taken;
        paid.materials += taken;
    }
    addLedger(ledger[category], paid);
    syncLegacyResources(state, actor);
    return paid;
}
function alphaLose(state, actor, loss) {
    const player = state.players.find((candidate)=>candidate.playerId === actor);
    if (!player) throw new Error('Civilização desconhecida.');
    const ledger = ledgerOf(state, actor);
    const taken = {};
    for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"]){
        const amount = Math.min(player.resources[key], loss[key] ?? 0);
        player.resources[key] -= amount;
        taken[key] = amount;
    }
    addLedger(ledger.losses, toLegacy(taken));
    syncLegacyResources(state, actor);
}
function alphaCostWithMetal(state, actor, cost, metal) {
    const pool = state.players.find((candidate)=>candidate.playerId === actor)?.resources ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])();
    const base = alphaCost(cost, pool);
    return {
        ...base,
        metal: base.metal + metal
    };
}
}),
"[project]/packages/game-engine/dist/alpha-scenario-contact.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "forceContactSetup",
    ()=>forceContactSetup
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-world.js [app-route] (ecmascript)");
;
;
;
function forceContactSetup(state) {
    const tiles = new Map(state.core.map.map((tile)=>[
            tile.id,
            tile
        ]));
    const homes = state.regions.filter((region)=>region.revealedBy.length > 0);
    const land = (id)=>{
        const tile = tiles.get(id);
        return tile !== undefined && ![
            'SEA',
            'UNKNOWN',
            'MOUNTAINS'
        ].includes(tile.terrain);
    };
    let best = null;
    for(let i = 0; i < homes.length; i++)for(let j = i + 1; j < homes.length; j++){
        for (const ha of homes[i].hexIds)for (const hb of homes[j].hexIds){
            if (!land(ha) || !land(hb)) continue;
            const d = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(tiles.get(ha), tiles.get(hb));
            if (!best || d < best.d || d === best.d && ha + hb < best.ha + best.hb) best = {
                d,
                a: homes[i].revealedBy[0],
                b: homes[j].revealedBy[0],
                ha,
                hb
            };
        }
    }
    if (!best) throw new Error('forceContactSetup: no pair of Pátrias with land hexes.');
    const stand = (owner)=>state.units.filter((unit)=>unit.ownerId === owner && unit.kind === 'PIONEER').sort((x, y)=>x.id.localeCompare(y.id)).at(-1);
    const scoutA = stand(best.a), scoutB = stand(best.b);
    if (!scoutA || !scoutB) throw new Error('forceContactSetup: each seat needs a Pioneiro.');
    // Seat B's scout stands on the neighbour of A's hex that is closest to B's Pátria.
    const free = (id)=>land(id) && !state.units.some((unit)=>unit.hexId === id && unit.ownerId !== best.b && unit.id !== scoutB.id) && (tiles.get(id).ownerId === null || tiles.get(id).ownerId === best.b || tiles.get(id).ownerId === best.a);
    const meet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])(tiles.get(best.ha)).map(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"]).filter((id)=>tiles.has(id) && free(id)).sort((x, y)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(tiles.get(x), tiles.get(best.hb)) - (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(tiles.get(y), tiles.get(best.hb)) || x.localeCompare(y))[0];
    if (!meet) throw new Error('forceContactSetup: no free hex next to the meeting point.');
    const region = state.regions.find((candidate)=>candidate.hexIds.includes(meet)) ?? null;
    let opened = null;
    if (region && region.revealedBy.length === 0) {
        region.revealedBy.push(best.a);
        opened = region.id;
    }
    scoutA.hexId = best.ha;
    scoutB.hexId = meet;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["refreshKnowledge"])(state);
    const seatA = state.players.find((player)=>player.playerId === best.a), seatB = state.players.find((player)=>player.playerId === best.b);
    if (!seatA.contacts.includes(best.b) || !seatB.contacts.includes(best.a)) throw new Error('forceContactSetup: the real Contact rule did not fire for the placed pieces.');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'SCENARIO', 'Cenário de teste: contato forçado. Dois Pioneiros estão frente a frente; o Contato veio da regra normal de proximidade.', null);
    return {
        seats: [
            best.a,
            best.b
        ],
        scouts: [
            scoutA.id,
            scoutB.id
        ],
        hexes: [
            best.ha,
            meet
        ],
        openedRegion: opened
    };
}
}),
"[project]/packages/game-engine/dist/alpha-shock.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POSTURE_TEXT",
    ()=>POSTURE_TEXT,
    "casualtyCount",
    ()=>casualtyCount,
    "chooseLosses",
    ()=>chooseLosses,
    "classifyDelta",
    ()=>classifyDelta,
    "defaultCasualtyPriority",
    ()=>defaultCasualtyPriority,
    "fortificationBonus",
    ()=>fortificationBonus,
    "isFortified",
    ()=>isFortified,
    "nextBreach",
    ()=>nextBreach,
    "resolveShock",
    ()=>resolveShock,
    "signaturePassives",
    ()=>signaturePassives,
    "sumOf",
    ()=>sumOf
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-random.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-grades.js [app-route] (ecmascript)");
;
;
const LEVELS = [
    'INTACT',
    'DAMAGED',
    'BREACHED'
];
const POSTURE_TEXT = {
    ASSAULT: 'Assalto',
    HOLD: 'Manter',
    MANEUVER: 'Manobra'
};
const push = (list, source, amount)=>{
    if (amount !== 0) list.push({
        source,
        amount
    });
};
const sumOf = (list)=>list.reduce((total, item)=>total + item.amount, 0);
const isFortified = (fort)=>fort !== null && fort.level !== 'NONE' && fort.state !== 'BREACHED';
const nextBreach = (state, steps)=>LEVELS[Math.min(2, LEVELS.indexOf(state) + steps)];
function fortificationBonus(config, fort) {
    const base = config.fortification.levelBonus[fort.level];
    return fort.state === 'INTACT' ? base : fort.state === 'DAMAGED' ? Math.floor(base * config.fortification.damagedPercent / 100) : 0;
}
const classifyDelta = (config, delta)=>Math.abs(delta) < config.mediumMargin ? 'TIE' : Math.abs(delta) >= config.largeMargin ? 'DECISIVE' : 'VICTORY';
const casualtyCount = (outcome)=>outcome === 'DECISIVE' ? 2 : 1;
function rollFaces(state, fighters, forced) {
    const faces = state.rules.combat.dieFaces;
    return [
        ...fighters
    ].sort((a, b)=>a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map((piece)=>({
            unitId: piece.id,
            face: forced?.[piece.id] ?? faces[(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRandomInteger"])(state, faces.length)],
            effect: '',
            grade: piece.grade
        }));
}
function tally(state, side, rolls, attacking, input) {
    const config = state.rules.combat, sig = config.signatures, result = {
        impacts: 0,
        maneuvers: 0,
        cancels: 0,
        flat: [],
        breach: 0,
        boarding: false,
        salvaIII: false
    };
    const kinds = new Map(side.pieces.map((piece)=>[
            piece.id,
            piece
        ]));
    const fortifiedTarget = attacking && input.city && isFortified(input.fortification);
    const empowers = config.posture[side.posture].empowers;
    for (const roll of rolls){
        const piece = kinds.get(roll.unitId), g = piece.grade - 1, name = `${state.rules.units[piece.kind].name} ${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GRADE_NUMERALS"][g]}`;
        if (roll.face === 'IMPACT') {
            result.impacts++;
            roll.effect = 'Impacto';
        } else if (roll.face === 'MANEUVER') {
            result.maneuvers++;
            roll.effect = 'Manobra';
        } else if (roll.face === 'EMPTY') roll.effect = 'Sem efeito';
        else if (roll.face === 'GUARD') {
            const counts = !attacking || side.posture === 'HOLD' || piece.kind === 'INFANTRY' && sig.linhaAttacks[g];
            const base = empowers === 'GUARD' ? config.holdGuardCancels : config.guardCancels;
            const value = piece.kind === 'INFANTRY' ? Math.max(base, sig.linhaCancels[g]) : base;
            if (counts) {
                result.cancels += value;
                roll.effect = piece.kind === 'INFANTRY' ? `Linha: Guarda cancela ${value} Impacto(s)` : `Guarda cancela ${value} Impacto(s)`;
            } else roll.effect = 'Guarda sem efeito ao atacar fora da postura Manter';
        } else if (piece.kind === 'RANGED') {
            push(result.flat, `Salva (${name})`, sig.salva[g]);
            if (piece.grade === 3) result.salvaIII = true;
            roll.effect = `Comando: Salva +${sig.salva[g]} Poder`;
        } else if (piece.kind === 'CAVALRY') {
            const open = input.terrain === 'PLAINS' || input.terrain === 'HILLS' && sig.flankHills[g];
            if (open) {
                push(result.flat, `Flanco (${name})`, sig.flank[g]);
                roll.effect = `Comando: Flanco +${sig.flank[g]} Poder`;
            } else roll.effect = 'Comando: terreno não permite Flanco';
        } else if (piece.kind === 'SIEGE') {
            if (fortifiedTarget) {
                const extra = piece.signature && input.fortification && ![
                    'NONE',
                    'PALISADE'
                ].includes(input.fortification.level) ? 1 : 0;
                result.breach += sig.breachSteps[g] + extra;
                roll.effect = `Comando: Brecha abre ${sig.breachSteps[g] + extra} passo(s) de Integridade`;
            } else roll.effect = 'Comando: sem fortificação para abrir';
        } else if (piece.kind === 'FLEET') {
            if (attacking) {
                result.boarding = true;
                roll.effect = 'Comando: Abordagem';
            } else roll.effect = 'Comando: Abordagem só vale ao atacar';
        } else roll.effect = 'Comando sem assinatura nesta família';
    }
    return result;
}
function signaturePassives(state, side, attacking, input) {
    const sig = state.rules.combat.signatures, list = [];
    for (const piece of side.pieces){
        const g = piece.grade - 1, name = `${state.rules.units[piece.kind].name} ${__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GRADE_NUMERALS"][g]}`;
        if (piece.kind === 'SIEGE' && attacking && input.city && isFortified(input.fortification)) push(list, `Brecha (${name})`, sig.siegeVsFortified);
        if (piece.kind === 'GUARD' && !attacking) {
            if (input.city) push(list, `Muro (${name})`, sig.muroCity[g]);
            if (input.terrain === 'HILLS' || input.terrain === 'MOUNTAINS') push(list, `Muro em terreno alto (${name})`, sig.muroRough[g]);
            if (piece.signature && isFortified(input.fortification)) push(list, 'Falange de Escudos', 1);
        }
    }
    return list;
}
function postureModifiers(config, attackerPosture, defenderPosture) {
    const attack = [], defense = [];
    if (config.posture[attackerPosture].beats === defenderPosture) push(attack, `Postura ${POSTURE_TEXT[attackerPosture]} vence ${POSTURE_TEXT[defenderPosture]}`, config.postureAdvantage);
    else if (config.posture[defenderPosture].beats === attackerPosture) push(defense, `Postura ${POSTURE_TEXT[defenderPosture]} vence ${POSTURE_TEXT[attackerPosture]}`, config.postureAdvantage);
    return {
        attack,
        defense
    };
}
function diceLines(state, own, foe, ownPosture) {
    const config = state.rules.combat, empowers = config.posture[ownPosture].empowers, list = [];
    const impactValue = config.impactValue + (empowers === 'IMPACT' ? config.empoweredBonus : 0);
    const maneuverValue = config.maneuverValue + (empowers === 'MANEUVER' ? config.empoweredBonus : 0);
    const cancelled = Math.min(foe.cancels, own.impacts);
    push(list, 'Dados: impactos', own.impacts * impactValue);
    push(list, 'Dados: manobra', own.maneuvers * maneuverValue);
    for (const item of own.flat)push(list, item.source, item.amount);
    push(list, `Guardas inimigas anularam ${cancelled} impacto(s)`, -cancelled * impactValue);
    return list;
}
function resolveShock(state, input) {
    const config = state.rules.combat, power = (piece)=>state.rules.units[piece.kind].strength;
    const attackFighters = input.attacker.pieces.filter((piece)=>power(piece) > 0), defendFighters = input.defender.pieces.filter((piece)=>power(piece) > 0);
    const attackerRolls = rollFaces(state, attackFighters, input.forced), defenderRolls = rollFaces(state, defendFighters, input.forced);
    const attackTally = tally(state, {
        ...input.attacker,
        pieces: attackFighters
    }, attackerRolls, true, input);
    const defendTally = tally(state, {
        ...input.defender,
        pieces: defendFighters
    }, defenderRolls, false, input);
    const posture = postureModifiers(config, input.attacker.posture, input.defender.posture);
    const attackBreakdown = [
        ...input.attacker.flat,
        ...signaturePassives(state, {
            ...input.attacker,
            pieces: attackFighters
        }, true, input),
        ...posture.attack,
        ...diceLines(state, attackTally, defendTally, input.attacker.posture)
    ];
    const defenseBreakdown = [
        ...input.defender.flat,
        ...signaturePassives(state, {
            ...input.defender,
            pieces: defendFighters
        }, false, input),
        ...posture.defense,
        ...diceLines(state, defendTally, attackTally, input.defender.posture)
    ];
    // Fortification (defender in a city): level bonus, then what the attackers ignore (Cerco III vs light walls, Salva III), then the breach the dice open.
    let fortificationAfter = null, breachSteps = 0;
    if (input.city && input.fortification) {
        const before = input.fortification;
        const ignored = (fort, bonus)=>{
            const light = attackFighters.some((piece)=>piece.kind === 'SIEGE' && piece.grade === 3) && (fort.level === 'PALISADE' || fort.level === 'STONE_WALL');
            return light ? bonus : attackTally.salvaIII ? Math.min(1, bonus) : 0;
        };
        const bonusBefore = isFortified(before) ? fortificationBonus(config, before) : 0;
        push(defenseBreakdown, 'Fortificação', bonusBefore);
        const skipped = ignored(before, bonusBefore);
        push(defenseBreakdown, 'Fortificação ignorada (Cerco/Salva Grau III)', -skipped);
        breachSteps = isFortified(before) ? attackTally.breach : 0;
        const after = {
            ...before,
            state: breachSteps > 0 ? nextBreach(before.state, breachSteps) : before.state
        };
        const bonusAfter = isFortified(after) ? fortificationBonus(config, after) : 0;
        const lost = Math.max(0, bonusBefore - skipped - Math.max(0, bonusAfter - ignored(after, bonusAfter)));
        push(defenseBreakdown, 'Brecha aberta pelo cerco', -lost);
        fortificationAfter = after;
    }
    const attackStrength = attackFighters.reduce((total, piece)=>total + power(piece), 0), defenseStrength = defendFighters.reduce((total, piece)=>total + power(piece), 0);
    const attackModifiers = sumOf(attackBreakdown), defenseModifiers = sumOf(defenseBreakdown);
    const attackTotal = attackStrength + attackModifiers, defenseTotal = defenseStrength + defenseModifiers, delta = attackTotal - defenseTotal;
    return {
        attackerRolls,
        defenderRolls,
        attackBreakdown,
        defenseBreakdown,
        attackStrength,
        defenseStrength,
        attackTotal,
        defenseTotal,
        attackModifiers,
        defenseModifiers,
        delta,
        outcome: classifyDelta(config, delta),
        breachSteps,
        fortificationAfter,
        boarding: attackTally.boarding
    };
}
/** Casualty order (I-4/I-17): fighting pieces first, weakest Power first, Cerco last, then id. Pieces without Power only die when no fighter is left. */ /** The engine's own casualty order (V5.1b I-4/I-17): pieces with strength before those without, weakest first, Cerco last, id as the tie-break. */ const engineOrder = (state, pieces)=>{
    const power = (piece)=>state.rules.units[piece.kind].strength;
    return [
        ...pieces
    ].sort((a, b)=>Number(power(a) === 0) - Number(power(b) === 0) || Number(a.kind === 'SIEGE') - Number(b.kind === 'SIEGE') || power(a) - power(b) || (a.id < b.id ? -1 : 1));
};
function defaultCasualtyPriority(state) {
    const kinds = Object.keys(state.rules.units).filter((kind)=>state.rules.units[kind].strength > 0);
    return kinds.sort((a, b)=>Number(a === 'SIEGE') - Number(b === 'SIEGE') || state.rules.units[a].strength - state.rules.units[b].strength);
}
function chooseLosses(state, pieces, count) {
    const power = (piece)=>state.rules.units[piece.kind].strength;
    const rank = new Map();
    for (const piece of pieces){
        const unit = state.units.find((candidate)=>candidate.id === piece.id);
        const owner = unit && state.players.find((player)=>player.playerId === unit.ownerId);
        const list = owner ? owner.casualtyPriority.byHex[unit.hexId] ?? owner.casualtyPriority.order : [];
        const index = list.indexOf(piece.kind);
        rank.set(piece.id, index < 0 ? list.length : index);
    }
    const ranked = engineOrder(state, pieces).sort((a, b)=>Number(power(a) === 0) - Number(power(b) === 0) || rank.get(a.id) - rank.get(b.id));
    return ranked.slice(0, count).map((piece)=>piece.id);
}
}),
"[project]/packages/game-engine/dist/alpha-stack.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "pendingArrivals",
    ()=>pendingArrivals,
    "stackBlock",
    ()=>stackBlock,
    "stackHex",
    ()=>stackHex,
    "stackLimit",
    ()=>stackLimit,
    "stackRoom",
    ()=>stackRoom,
    "stackUsed",
    ()=>stackUsed,
    "stackView",
    ()=>stackView,
    "unitCategory",
    ()=>unitCategory
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-stack.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-government.js [app-route] (ecmascript)");
;
;
const CATEGORIES = [
    'military',
    'civilians',
    'fleets'
];
const unitCategory = (state, unit)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackCategory"])(state.rules.units[unit.kind]);
const cityAt = (state, hexId)=>state.core.players.flatMap((player)=>player.civilization.cities).find((city)=>city.hexId === hexId);
const researched = (state, owner, id)=>state.players.find((player)=>player.playerId === owner).research.includes(id);
/** Command II implies Command I: the second advancement requires the first in the catalogue. */ function landLimit(state, owner) {
    const config = state.rules.balance.stack;
    const base = researched(state, owner, config.upgrades.commandTwo) ? config.militaryCommandTwo : researched(state, owner, config.upgrades.commandOne) ? config.militaryCommandOne : config.military;
    // Autocracia (canon §16): Exército máximo +1.
    return base + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, owner).armyMaxBonus;
}
/** Base garrison plus military district, fortification level and protection doctrine, capped. */ function garrisonLimit(state, owner, cityId) {
    const config = state.rules.balance.stack, city = state.core.players.flatMap((player)=>player.civilization.cities).find((candidate)=>candidate.id === cityId);
    const level = state.cities.find((entry)=>entry.cityId === cityId)?.fortification.level ?? 'NONE';
    const bonus = (city.districts.some((district)=>district.type === 'MILITARY') ? config.cityBonus.militaryDistrict : 0) + config.cityBonus.fortification[level] + (researched(state, owner, config.upgrades.doctrine) ? config.cityBonus.doctrine : 0);
    return Math.min(config.cityMax, config.cityBase + bonus);
}
function stackLimit(state, owner, hexId, category) {
    const config = state.rules.balance.stack;
    if (category === 'civilians') return config.civilians;
    if (category === 'fleets') return researched(state, owner, config.upgrades.naval) ? config.fleetsUpgraded : config.fleets;
    const city = cityAt(state, hexId);
    return city ? garrisonLimit(state, owner, city.id) : landLimit(state, owner);
}
function stackUsed(state, owner, hexId, category, ignore = new Set()) {
    // Cargo rides in its fleet's slots, not in the hex's land stacks.
    return state.units.filter((unit)=>unit.ownerId === owner && unit.hexId === hexId && !ignore.has(unit.id) && !unit.carrierId && unitCategory(state, unit) === category).length;
}
const usage = (state, owner, hexId, category, ignore)=>({
        used: stackUsed(state, owner, hexId, category, ignore),
        limit: stackLimit(state, owner, hexId, category)
    });
const stackHex = (state, owner, hexId)=>({
        hexId,
        city: cityAt(state, hexId) !== undefined,
        military: usage(state, owner, hexId, 'military'),
        civilians: usage(state, owner, hexId, 'civilians'),
        fleets: usage(state, owner, hexId, 'fleets')
    });
function stackRoom(state, owner, movers, hexId) {
    const ignore = new Set(movers.map((unit)=>unit.id)), fits = [], stays = [];
    for (const category of CATEGORIES){
        const room = Math.max(0, stackLimit(state, owner, hexId, category) - stackUsed(state, owner, hexId, category, ignore));
        const group = movers.filter((unit)=>unit.ownerId === owner && unitCategory(state, unit) === category).sort((a, b)=>a.id < b.id ? -1 : 1);
        fits.push(...group.slice(0, room));
        stays.push(...group.slice(room));
    }
    return {
        fits,
        stays
    };
}
function stackBlock(state, owner, movers, hexId, pending = []) {
    const ignore = new Set(movers.map((unit)=>unit.id));
    for (const category of CATEGORIES){
        const arriving = [
            ...movers,
            ...pending.filter((unit)=>!ignore.has(unit.id))
        ].filter((unit)=>unitCategory(state, unit) === category).length;
        const verdict = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackVerdict"])(category, cityAt(state, hexId) !== undefined, usage(state, owner, hexId, category, ignore), arriving, hexId);
        if (verdict) return verdict;
    }
    return null;
}
function pendingArrivals(state, owner, hexId, exceptOrderId) {
    const orders = state.players.find((player)=>player.playerId === owner).orders;
    const ids = orders.flatMap((order)=>order.type === 'MOVE' && order.id !== exceptOrderId && order.path.at(-1) === hexId ? order.unitIds : []);
    return state.units.filter((unit)=>unit.ownerId === owner && ids.includes(unit.id));
}
function stackView(state, actor) {
    const config = state.rules.balance.stack, ids = new Set();
    for (const unit of state.units)if (unit.ownerId === actor) ids.add(unit.hexId);
    for (const city of state.core.players.find((player)=>player.id === actor).civilization.cities)ids.add(city.hexId);
    const orders = state.players.find((player)=>player.playerId === actor).orders;
    for (const order of orders)if (order.type === 'MOVE') ids.add(order.path.at(-1));
    const hexes = {};
    for (const id of [
        ...ids
    ].sort()){
        const base = stackHex(state, actor, id);
        for (const category of CATEGORIES){
            const queued = orders.flatMap((order)=>order.type === 'MOVE' && order.path.at(-1) === id ? order.unitIds : []).filter((unitId)=>{
                const unit = state.units.find((candidate)=>candidate.id === unitId);
                return unit && unit.hexId !== id && unitCategory(state, unit) === category;
            }).length;
            base[category] = {
                used: base[category].used + queued,
                limit: base[category].limit
            };
        }
        hexes[id] = base;
    }
    const defaults = {
        military: landLimit(state, actor),
        civilians: config.civilians,
        fleets: researched(state, actor, config.upgrades.naval) ? config.fleetsUpgraded : config.fleets
    };
    return {
        defaults,
        hexes
    };
}
}),
"[project]/packages/game-engine/dist/alpha-telemetry.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "recordRoundTelemetry",
    ()=>recordRoundTelemetry,
    "snapshotOrders",
    ()=>snapshotOrders
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$hegemony$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-hegemony.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-actions.js [app-route] (ecmascript)");
;
;
;
;
const LEDGER_KEYS = [
    'food',
    'materials',
    'wealth',
    'knowledge',
    'influence'
];
const sumPools = (pools)=>Object.fromEntries(LEDGER_KEYS.map((key)=>[
            key,
            pools.reduce((total, pool)=>total + (pool[key] ?? 0), 0)
        ]));
const MAX_LOG = 260;
function snapshotOrders(state) {
    state.telemetry.pendingOrders = Object.fromEntries(state.players.map((player)=>[
            player.playerId,
            {
                ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaActionUsage"])(state, player.playerId).byOrder
            }
        ]));
}
function recordRoundTelemetry(state) {
    const round = state.core.round;
    const battles = state.battles.filter((battle)=>battle.round === round);
    // Aggregate counters the engine never maintained: battles, outcomes and casualties are counted once per closing round.
    state.telemetry.battles += battles.length;
    for (const battle of battles){
        const key = battle.outcome ?? 'LEGACY';
        state.telemetry.battleResults[key] = (state.telemetry.battleResults[key] ?? 0) + 1;
        state.telemetry.casualties += battle.losses.length;
    }
    const camps = state.threats.filter((threat)=>threat.kind === 'CAMP'), pirates = state.threats.filter((threat)=>threat.kind === 'PIRATE');
    const threatsAlive = {
        camp: camps.length,
        pirate: pirates.length,
        marching: state.threats.filter((threat)=>threat.status === 'MARCHING').length
    };
    for (const level of [
        1,
        2,
        3
    ])threatsAlive[`level${level}`] = state.threats.filter((threat)=>threat.level === level).length;
    const entries = state.players.map((progress)=>{
        const owner = state.core.players.find((player)=>player.id === progress.playerId);
        const ledger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ledgerOf"])(state, progress.playerId);
        const metas = state.cities.filter((meta)=>meta.currentOwnerId === progress.playerId);
        const orders = {};
        const committed = state.telemetry.pendingOrders[progress.playerId] ?? {};
        for (const type of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaOrderTypeSchema"].options)orders[type] = Math.max(committed[type] ?? 0, progress.ordersSpent[type] ?? 0);
        const repeated = Object.values(orders).reduce((total, count)=>total + Math.max(0, count - 1), 0);
        const storage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaStorageCapacity"])(state, progress.playerId);
        const stock = progress.resources;
        const mine = battles.filter((battle)=>battle.attackerId === progress.playerId || battle.defenderId === progress.playerId);
        const combats = {};
        for (const battle of mine){
            const key = battle.outcome ?? 'LEGACY';
            combats[key] = (combats[key] ?? 0) + 1;
        }
        const lostUnits = new Set(mine.flatMap((battle)=>battle.losses));
        const casualties = [
            ...lostUnits
        ].length;
        const hegemony = Object.fromEntries((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$hegemony$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hegemonyProgress"])(state, progress.playerId).map((entry)=>[
                entry.path,
                entry.requirements.filter((requirement)=>requirement.met).length
            ]));
        return {
            round,
            era: progress.era,
            playerId: progress.playerId,
            orders,
            repeatedOrders: repeated,
            produced: sumPools([
                ledger.production,
                ledger.mining,
                ledger.trade,
                ledger.institutions,
                ledger.other
            ]),
            spent: sumPools([
                ledger.expenses,
                ledger.upkeepPaid
            ]),
            lost: sumPools([
                ledger.losses
            ]),
            discarded: sumPools([
                ledger.discarded
            ]),
            stock: {
                ...stock
            },
            atCap: Object.keys(storage).filter((key)=>(stock[key] ?? 0) >= storage[key]),
            population: owner.civilization.cities.reduce((total, city)=>total + city.population, 0),
            cities: owner.civilization.cities.length,
            cityLevels: metas.map((meta)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CityLevelSchema"].options.indexOf(meta.level) + 1),
            moods: metas.map((meta)=>meta.mood),
            governed: state.events.filter((event)=>event.round === round && event.type === 'PROMOTE_MOOD' && event.audience?.includes(progress.playerId)).length,
            researched: progress.research.length,
            heritages: progress.research.filter((id)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["heritageAdvance"])(id)).length,
            resonanceSlots: progress.resonance.slots.length,
            resonanceCycles: progress.resonance.cycles,
            pulse: state.worldPulse.current && state.worldPulse.resolvedRound === round ? state.worldPulse.current.name : null,
            combats,
            casualties,
            victories: progress.victories,
            threatsAlive,
            prestige: progress.prestige,
            hegemonyPaths: hegemony
        };
    });
    state.telemetry.pendingOrders = {};
    state.telemetry.roundLog = [
        ...state.telemetry.roundLog.filter((entry)=>entry.round !== round),
        ...entries
    ].slice(-MAX_LOG);
}
}),
"[project]/packages/game-engine/dist/alpha-threats.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "activateThreats",
    ()=>activateThreats,
    "applyThreatCommand",
    ()=>applyThreatCommand,
    "eraIndexOf",
    ()=>eraIndexOf,
    "growThreats",
    ()=>growThreats,
    "hexBlockedByThreat",
    ()=>hexBlockedByThreat,
    "landTarget",
    ()=>landTarget,
    "landform",
    ()=>landform,
    "matureThreats",
    ()=>matureThreats,
    "payThreatReward",
    ()=>payThreatReward,
    "reinforceThreat",
    ()=>reinforceThreat,
    "removeThreatPieces",
    ()=>removeThreatPieces,
    "seaTarget",
    ()=>seaTarget,
    "spawnThreat",
    ()=>spawnThreat,
    "suspendThreatenedRoutes",
    ()=>suspendThreatenedRoutes,
    "threatAlerts",
    ()=>threatAlerts,
    "threatAt",
    ()=>threatAt,
    "threatCap",
    ()=>threatCap,
    "threatIntent",
    ()=>threatIntent,
    "threatName",
    ()=>threatName,
    "threatPieces",
    ()=>threatPieces,
    "threatViewers",
    ()=>threatViewers,
    "unitPieces",
    ()=>unitPieces
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-threats.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-naval.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-world.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-institutions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-grades.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-kits.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resonance.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-shock.js [app-route] (ecmascript)");
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
/**
 * World threats (canon §21b, design I-5, I-20 … I-24): Acampamentos that grow, march as Bandos, pillage and die; pirate
 * Ancoradouros with their own cap. A threat is not an `AlphaUnit`: its pieces are descriptors for the shock core, so the
 * world fights with exactly the engine players use.
 */ const CIVILIANS = new Set([
    'PIONEER',
    'ENVOY'
]);
const IMPASSABLE_LAND = new Set([
    'SEA',
    'UNKNOWN'
]);
const tileMap = (state)=>new Map(state.core.map.map((tile)=>[
            tile.id,
            tile
        ]));
const eraIndexOf = (state)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eraForRound"])(state.core.round, state.rules.roundsPerEra));
const threatCap = (state, kind)=>kind === 'CAMP' ? state.players.length + 2 : Math.ceil(state.players.length / 2) + 1;
const threatAt = (state, hex)=>state.threats.find((threat)=>threat.hexId === hex);
const threatName = (threat)=>threat.kind === 'PIRATE' ? threat.status === 'CAMPED' ? 'Ancoradouro pirata' : 'Piratas' : threat.status === 'CAMPED' ? 'Acampamento' : 'Bando';
const byId = (a, b)=>a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const levelOf = (value)=>Math.max(1, Math.min(3, value));
const allCities = (state)=>state.core.players.flatMap((player)=>player.civilization.cities);
/** Hexes any player piece or city occupies. */ function playerSites(state) {
    return [
        ...state.units.filter((unit)=>!unit.carrierId).map((unit)=>unit.hexId),
        ...allCities(state).map((city)=>city.hexId)
    ];
}
const nearestPlayer = (state, tile, sites = playerSites(state), map = tileMap(state))=>sites.reduce((best, id)=>{
        const other = map.get(id);
        return other ? Math.min(best, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(tile, other)) : best;
    }, 99);
function threatViewers(state, hex, always = []) {
    return state.players.map((player)=>player.playerId).filter((id)=>always.includes(id) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["visibleHexIds"])(state, id).has(hex));
}
function describe(threat, state) {
    return threat.composition.map((entry)=>`${state.rules.units[entry.kind].name}${entry.count > 1 ? ` ×${entry.count}` : ''}`).join(', ');
}
/** Candidate hexes for a new threat (design: Spawn eligibility). `within` restricts to a region. */ function sitesFor(state, kind, within) {
    const map = tileMap(state), cities = allCities(state), occupied = new Set([
        ...state.units.map((unit)=>unit.hexId),
        ...state.threats.map((threat)=>threat.hexId),
        ...state.independents.map((people)=>people.hexId)
    ]);
    const seen = new Set();
    for (const player of state.players)for (const id of (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["visibleHexIds"])(state, player.playerId))seen.add(id);
    const cityTiles = cities.map((city)=>map.get(city.hexId)).filter((tile)=>tile !== undefined);
    const scope = within ? within.map((id)=>map.get(id)).filter((tile)=>tile !== undefined) : state.core.map;
    if (kind === 'CAMP') {
        const land = scope.filter((tile)=>!IMPASSABLE_LAND.has(tile.terrain) && tile.terrain !== 'MOUNTAINS' && tile.ownerId === null && !occupied.has(tile.id) && (within !== undefined || !seen.has(tile.id)) && !cities.some((city)=>city.hexId === tile.id));
        const dist = (tile)=>cityTiles.reduce((best, city)=>Math.min(best, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(city, tile)), 99);
        for (const [low, high] of [
            [
                3,
                5
            ],
            [
                3,
                8
            ],
            [
                3,
                99
            ]
        ]){
            const found = land.filter((tile)=>dist(tile) >= low && dist(tile) <= high);
            if (found.length) return found;
        }
        return [];
    }
    const ports = cities.filter((city)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isPort"])(state, city.hexId)).map((city)=>map.get(city.hexId)).filter((tile)=>tile !== undefined);
    if (ports.length === 0) return [];
    const routeHexes = new Set(state.routes.flatMap((route)=>route.path));
    const sea = scope.filter((tile)=>tile.terrain === 'SEA' && !occupied.has(tile.id) && !seen.has(tile.id));
    const near = sea.filter((tile)=>{
        const d = ports.reduce((best, port)=>Math.min(best, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(port, tile)), 99);
        return d >= 2 && d <= 5 || routeHexes.has(tile.id);
    });
    return near.length ? near : sea.filter((tile)=>ports.some((port)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(port, tile) <= 8));
}
function newThreat(state, kind, tile) {
    const threat = {
        id: `${kind === 'CAMP' ? 'camp' : 'pirate'}-r${state.core.round}-e${state.events.length}-n${state.threats.length + 1}`,
        kind,
        hexId: tile.id,
        homeHexId: tile.id,
        level: 1,
        status: 'CAMPED',
        composition: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatComposition"])(kind, 1, eraIndexOf(state)),
        createdRound: state.core.round,
        lastActedRound: state.core.round,
        rewardPaid: false,
        fresh: true
    };
    state.threats.push(threat);
    state.telemetry.threatsSpawned++;
    return threat;
}
function spawnThreat(state, kind, within) {
    const map = tileMap(state), sites = playerSites(state);
    const ranked = sitesFor(state, kind, within).map((tile)=>({
            tile,
            score: nearestPlayer(state, tile, sites, map)
        })).sort((a, b)=>b.score - a.score || (a.tile.id < b.tile.id ? -1 : 1));
    const best = ranked[0];
    return best ? newThreat(state, kind, best.tile) : null;
}
function reinforceThreat(state, kind) {
    const map = tileMap(state), sites = playerSites(state);
    const pool = state.threats.filter((threat)=>threat.kind === kind && threat.level < 3).map((threat)=>({
            threat,
            score: nearestPlayer(state, map.get(threat.hexId), sites, map)
        })).sort((a, b)=>b.score - a.score || byId(a.threat, b.threat));
    const chosen = pool[0]?.threat;
    if (!chosen) return null;
    chosen.level = levelOf(chosen.level + 1);
    chosen.composition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatComposition"])(chosen.kind, chosen.level, eraIndexOf(state));
    return chosen;
}
function applyThreatCommand(state, source, op, within) {
    const kind = op.kind === 'PIRATE' ? 'PIRATE' : 'CAMP';
    const label = kind === 'PIRATE' ? 'pirata' : 'de fronteira';
    if (op.command === 'ACTIVATE') {
        activateThreats(state, {
            launch: true
        });
        return;
    }
    if (op.command === 'SPAWN') {
        const count = state.threats.filter((threat)=>threat.kind === kind).length;
        const created = count < threatCap(state, kind) ? spawnThreat(state, kind, within) : null;
        if (created) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'THREAT_SPAWNED', `Uma ameaça ${label} surgiu além das fronteiras conhecidas.`, null);
            return;
        }
    }
    const grown = reinforceThreat(state, kind);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, grown ? 'THREAT_REINFORCED' : 'THREAT_NONE', grown ? `Uma ameaça ${label} se reforçou além das fronteiras conhecidas.` : `Nenhuma ameaça ${label} pôde surgir ou se reforçar.`, null);
    void source;
}
function growThreats(state) {
    const map = tileMap(state), sites = playerSites(state);
    let grown = 0;
    for (const threat of [
        ...state.threats
    ].sort(byId)){
        if (threat.status !== 'CAMPED' || threat.level >= 3 || nearestPlayer(state, map.get(threat.hexId), sites, map) <= 2) continue;
        threat.level = levelOf(threat.level + 1);
        threat.composition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatComposition"])(threat.kind, threat.level, eraIndexOf(state));
        grown++;
    }
    if (grown) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'THREATS_GREW', `${grown === 1 ? 'Uma ameaça cresceu' : `${grown} ameaças cresceram`} nas fronteiras do mundo.`, null);
    return grown;
}
function matureThreats(state) {
    for (const threat of state.threats)if (threat.fresh && threat.createdRound < state.core.round) threat.fresh = false;
}
// ---- targeting and movement -------------------------------------------------
const passable = (tile, kind)=>!!tile && (kind === 'PIRATE' ? tile.terrain === 'SEA' : !IMPASSABLE_LAND.has(tile.terrain));
/** BFS over passable hexes; `goal` may be impassable (a city or a port-adjacent hex). Returns the path (excluding the start), or null. */ function pathTo(state, threat, goals, map = tileMap(state)) {
    const start = map.get(threat.hexId), prev = new Map([
        [
            start.id,
            null
        ]
    ]), queue = [
        start.id
    ];
    const blocked = new Set(state.threats.filter((other)=>other.id !== threat.id).map((other)=>other.hexId));
    for(let i = 0; i < queue.length; i++){
        const current = queue[i];
        if (goals.has(current) && current !== start.id) {
            const path = [];
            for(let at = current; at && at !== start.id; at = prev.get(at))path.unshift(at);
            return path;
        }
        const tile = map.get(current);
        for (const next of (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])(tile).map(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"]).sort()){
            const target = map.get(next);
            if (prev.has(next) || !target) continue;
            if (!(passable(target, threat.kind) && !blocked.has(next)) && !goals.has(next)) continue;
            prev.set(next, current);
            queue.push(next);
        }
    }
    return null;
}
const guardsAt = (state, hex)=>state.units.filter((unit)=>unit.hexId === hex && unit.kind === 'GUARD').length;
function cityDefense(state, hex) {
    const city = allCities(state).find((candidate)=>candidate.hexId === hex), meta = city && state.cities.find((candidate)=>candidate.cityId === city.id);
    return guardsAt(state, hex) + (meta ? state.rules.combat.fortification.levelBonus[meta.fortification.level] : 0);
}
function cityValue(state, hex) {
    const city = allCities(state).find((candidate)=>candidate.hexId === hex), meta = city && state.cities.find((candidate)=>candidate.cityId === city.id);
    return meta ? [
        'OUTPOST',
        'HAMLET',
        'VILLAGE',
        'CITY',
        'GREAT_CITY',
        'METROPOLIS',
        'IMPERIAL_METROPOLIS'
    ].indexOf(meta.level) + 1 + meta.districts.length : 0;
}
function landTarget(state, threat) {
    const map = tileMap(state), options = allCities(state).map((city)=>({
            hex: city.hexId,
            id: city.id,
            path: pathTo(state, threat, new Set([
                city.hexId
            ]), map)
        })).filter((option)=>option.path !== null);
    options.sort((a, b)=>a.path.length - b.path.length || cityDefense(state, a.hex) - cityDefense(state, b.hex) || cityValue(state, b.hex) - cityValue(state, a.hex) || (a.hex < b.hex ? -1 : 1));
    return options[0] ?? null;
}
function seaTarget(state, threat) {
    const map = tileMap(state), from = map.get(threat.hexId);
    const routes = state.routes.map((route)=>({
            route,
            sea: route.path.filter((id)=>map.get(id)?.terrain === 'SEA')
        })).filter((item)=>item.sea.length > 0).sort((a, b)=>b.sea.length - a.sea.length || byId(a.route, b.route));
    for (const { route, sea } of routes){
        const nearest = [
            ...sea
        ].sort((a, b)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(from, map.get(a)) - (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(from, map.get(b)) || (a < b ? -1 : 1))[0];
        if (nearest === threat.hexId) return {
            hex: nearest,
            path: [],
            kind: 'ROUTE',
            id: route.id
        };
        const path = pathTo(state, threat, new Set([
            nearest
        ]), map);
        if (path) return {
            hex: nearest,
            path,
            kind: 'ROUTE',
            id: route.id
        };
    }
    const ports = allCities(state).filter((city)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isPort"])(state, city.hexId)).map((city)=>({
            city,
            fleets: state.units.filter((unit)=>unit.ownerId === city.ownerId && unit.kind === 'FLEET' && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(map.get(unit.hexId), map.get(city.hexId)) <= 1).length
        }));
    const options = ports.flatMap(({ city, fleets })=>{
        const sea = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])(map.get(city.hexId)).map(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"]).filter((id)=>map.get(id)?.terrain === 'SEA').sort();
        const reached = sea.flatMap((id)=>{
            const path = id === threat.hexId ? [] : pathTo(state, threat, new Set([
                id
            ]), map);
            return path ? [
                {
                    id: id,
                    path
                }
            ] : [];
        }).sort((a, b)=>a.path.length - b.path.length || (a.id < b.id ? -1 : 1))[0];
        return reached ? [
            {
                hex: reached.id,
                path: reached.path,
                fleets,
                city
            }
        ] : [];
    }).sort((a, b)=>a.path.length - b.path.length || a.fleets - b.fleets || (a.city.id < b.city.id ? -1 : 1));
    const best = options[0];
    return best ? {
        hex: best.hex,
        path: best.path,
        kind: 'PORT',
        id: best.city.id
    } : null;
}
function threatIntent(state, threat) {
    const none = {
        targetKind: null,
        targetId: null,
        targetHexId: null,
        nextHexId: null,
        distance: null
    };
    if (threat.status === 'CAMPED') return {
        state: threat.fresh ? 'FRESH' : 'WAITING',
        ...none
    };
    const sea = threat.kind === 'PIRATE' ? seaTarget(state, threat) : null, land = threat.kind === 'PIRATE' ? null : landTarget(state, threat);
    const target = sea ?? land;
    if (!target) return {
        state: 'IDLE',
        ...none
    };
    return {
        state: 'MARCHING',
        targetKind: sea ? sea.kind : 'CITY',
        targetId: target.id,
        targetHexId: target.hex,
        nextHexId: target.path[0] ?? null,
        distance: target.path.length
    };
}
const speedOf = (threat)=>threat.kind === 'CAMP' && threat.level >= 2 && threat.composition.some((entry)=>entry.kind === 'CAVALRY') ? 2 : 1;
function activateThreats(state, options) {
    for (const id of state.threats.map((threat)=>threat.id).sort()){
        const threat = state.threats.find((candidate)=>candidate.id === id);
        if (!threat) continue;
        if (threat.status === 'CAMPED') {
            if (!options.launch || threat.fresh) continue;
        } else if (threat.lastActedRound >= state.core.round) continue;
        actThreat(state, threat);
    }
}
function actThreat(state, threat) {
    const target = threat.kind === 'PIRATE' ? seaTarget(state, threat) : landTarget(state, threat);
    if (!target) return;
    threat.lastActedRound = state.core.round;
    if (threat.status === 'CAMPED') {
        threat.status = 'MARCHING';
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'THREAT_MARCHING', `${threat.kind === 'PIRATE' ? 'Piratas partiram' : 'Um bando partiu'} de seu ${threat.kind === 'PIRATE' ? 'ancoradouro' : 'acampamento'}.`, null);
    }
    const map = tileMap(state);
    for(let step = 0, remaining = [
        ...target.path
    ]; step < speedOf(threat) && remaining.length > 0 && state.threats.includes(threat); step++){
        const next = remaining.shift(), tile = map.get(next);
        const occupants = state.units.filter((unit)=>unit.hexId === next && !unit.carrierId);
        const city = allCities(state).find((candidate)=>candidate.hexId === next);
        if (city || occupants.length) {
            const fighters = occupants.filter((unit)=>!CIVILIANS.has(unit.kind) && state.rules.units[unit.kind].strength > 0);
            if (!city && fighters.length === 0 && threat.kind === 'CAMP') {
                killExposed(state, threat, occupants, next);
                moveThreat(state, threat, tile);
                continue;
            }
            if (threat.kind === 'PIRATE' && !fighters.length && !city) {
                moveThreat(state, threat, tile);
                continue;
            }
            assault(state, threat, next);
            break;
        }
        moveThreat(state, threat, tile);
    }
    if (threat.kind === 'PIRATE' && state.threats.includes(threat)) pillagePort(state, threat);
    suspendThreatenedRoutes(state);
}
function moveThreat(state, threat, tile) {
    threat.hexId = tile.id;
    if (threat.kind === 'CAMP' && tile.improvement && tile.ownerId) {
        const owner = tile.ownerId;
        tile.improvement = null;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'THREAT_PILLAGE', `Um bando pilhou uma melhoria em ${tile.id}.`, [
            owner
        ]);
    }
    for (const route of state.routes)if (route.path.includes(tile.id)) route.suspended = true;
}
function killExposed(state, threat, victims, hex) {
    const owners = [
        ...new Set(victims.map((unit)=>unit.ownerId))
    ];
    state.units = state.units.filter((unit)=>!victims.some((victim)=>victim.id === unit.id));
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'THREAT_AMBUSH', `Um bando surpreendeu peças desprotegidas em ${hex}.`, threatViewers(state, hex, owners));
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(state, {
        type: 'LOSSES',
        actorId: null,
        visibleTo: threatViewers(state, hex, owners),
        message: `${threatName(threat)} eliminou peças desprotegidas em ${hex}.`,
        hexId: hex,
        unitIds: victims.map((unit)=>unit.id)
    });
}
/** Piratas: from a hex next to a port they pillage 2 Riqueza from its owner, once per activation (I-24). */ function pillagePort(state, threat) {
    const map = tileMap(state), here = map.get(threat.hexId), near = new Set((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])(here).map(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"]));
    const city = allCities(state).filter((candidate)=>near.has(candidate.hexId) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isPort"])(state, candidate.hexId)).sort((a, b)=>a.id < b.id ? -1 : 1)[0];
    if (!city) return;
    const owner = state.players.find((player)=>player.playerId === city.ownerId);
    if (!owner) return;
    const loss = Math.min(2, owner.resources.wealth);
    if (loss > 0) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaLose"])(state, city.ownerId, {
        wealth: loss
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'THREAT_PILLAGE', `Piratas pilharam o porto de ${city.name}${loss ? ` (−${loss} Riqueza)` : ''}.`, [
        city.ownerId
    ]);
}
function suspendThreatenedRoutes(state) {
    const occupied = new Set(state.threats.map((threat)=>threat.hexId));
    for (const route of state.routes)if (!route.suspended && route.path.some((id)=>occupied.has(id))) route.suspended = true;
}
const hexBlockedByThreat = (state, hex)=>state.threats.some((threat)=>threat.hexId === hex && threat.status === 'MARCHING');
const threatPieces = (threat)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatPieceIds"])(threat).map((piece)=>({
            id: piece.id,
            kind: piece.kind,
            grade: 1
        }));
function unitPieces(state, units) {
    return units.map((unit)=>({
            id: unit.id,
            kind: unit.kind,
            grade: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unitGrade"])(state, unit.ownerId, unit.kind),
            signature: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSignature"])(state, unit)
        }));
}
function removeThreatPieces(state, threat, lost) {
    const remaining = new Map();
    for (const piece of (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatPieceIds"])(threat))if (!lost.includes(piece.id)) remaining.set(piece.kind, (remaining.get(piece.kind) ?? 0) + 1);
    threat.composition = [
        ...remaining
    ].map(([kind, count])=>({
            kind: kind,
            count
        }));
    if (threat.composition.length === 0) {
        state.threats = state.threats.filter((candidate)=>candidate.id !== threat.id);
        return true;
    }
    return false;
}
function landform(state, terrain) {
    const config = state.rules.combat;
    return terrain === 'HILLS' ? config.hillDefense : terrain === 'MOUNTAINS' ? config.mountainDefense : 0;
}
function payThreatReward(state, actor, threat) {
    if (threat.status !== 'CAMPED' || threat.rewardPaid) return;
    threat.rewardPaid = true;
    state.telemetry.threatKills++;
    const player = state.players.find((candidate)=>candidate.playerId === actor);
    if (threat.kind === 'PIRATE') {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, actor, {
            wealth: 3
        });
        player.prestige += 1;
    } else {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, actor, {
            wealth: threat.level + 1
        });
        player.prestige += threat.level - 1;
        if (threat.level === 3) {
            const card = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ENCOUNTER_CARDS"].find((item)=>item.id === 'enc-camp-spoils');
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addPendingChoice"])(state, actor, {
                source: 'ENCOUNTER',
                cardId: card.id,
                title: card.title,
                text: card.text,
                mitigated: false,
                options: card.options
            });
        }
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'THREAT_DESTROYED', `${threatName(threat)} destruído${threat.kind === 'PIRATE' ? ': +3 Riqueza e +1 Prestígio' : `: +${threat.level + 1} Riqueza${threat.level > 1 ? ` e +${threat.level - 1} Prestígio` : ''}`}.`, [
        actor
    ]);
}
/** A threat attacks the player's pieces or city on `hex` with the shock core (always Assalto). */ function assault(state, threat, hex) {
    const map = tileMap(state), tile = map.get(hex);
    const city = allCities(state).find((candidate)=>candidate.hexId === hex), meta = city && state.cities.find((candidate)=>candidate.cityId === city.id);
    const defenderUnits = state.units.filter((unit)=>unit.hexId === hex && !unit.carrierId);
    const defenderId = defenderUnits[0]?.ownerId ?? city.ownerId;
    const mine = defenderUnits.filter((unit)=>unit.ownerId === defenderId);
    const fighters = mine.filter((unit)=>state.rules.units[unit.kind].strength > 0);
    const defender = state.players.find((player)=>player.playerId === defenderId);
    const sources = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["strengthSources"])(state, defenderId);
    const flat = [];
    const add = (source, amount)=>{
        if (amount !== 0) flat.push({
            source,
            amount
        });
    };
    add('Terreno', landform(state, tile.terrain));
    add('Tecnologia', sources.technology);
    add('Líder', sources.leader);
    add('Cartas e efeitos', sources.other);
    const before = meta ? {
        ...meta.fortification
    } : null;
    const attackerPieces = threatPieces(threat);
    const shock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveShock"])(state, {
        attacker: {
            pieces: attackerPieces,
            posture: 'ASSAULT',
            flat: []
        },
        defender: {
            pieces: unitPieces(state, fighters),
            posture: defender.defensePosture,
            flat
        },
        terrain: tile.terrain,
        city: city !== undefined,
        fortification: before
    });
    const { delta, outcome } = shock;
    const losses = [];
    const threatLosses = [];
    if (outcome === 'TIE') {
        if (attackerPieces.length >= 2) threatLosses.push(...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chooseLosses"])(state, attackerPieces, 1));
        if (fighters.length >= 2) losses.push(...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chooseLosses"])(state, fighters, 1));
    } else if (delta > 0) losses.push(...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chooseLosses"])(state, fighters.length ? fighters : mine, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["casualtyCount"])(outcome)));
    else threatLosses.push(...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chooseLosses"])(state, attackerPieces, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["casualtyCount"])(outcome)));
    let fortification = null;
    if (meta && city && before && shock.fortificationAfter) {
        if (shock.fortificationAfter.state !== before.state) meta.fortification = {
            ...shock.fortificationAfter
        };
        fortification = {
            cityId: city.id,
            before,
            after: shock.fortificationAfter
        };
    }
    if (delta > 0 && outcome !== 'TIE' && meta) meta.mood = Math.max(0, meta.mood - 1);
    state.units = state.units.filter((unit)=>!losses.includes(unit.id));
    const attackerIds = attackerPieces.map((piece)=>piece.id);
    const gone = removeThreatPieces(state, threat, threatLosses);
    if (gone) state.telemetry.threatLosses++;
    if (delta > 0 && outcome !== 'TIE' && !city && !state.units.some((unit)=>unit.hexId === hex)) moveThreat(state, threat, tile);
    state.telemetry.threatAttacks++;
    state.battles.push({
        id: `battle-${state.battles.length + 1}`,
        round: state.core.round,
        hexId: hex,
        attackerId: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["WORLD_ID"],
        defenderId,
        attackerUnits: attackerIds,
        defenderUnits: mine.map((unit)=>unit.id),
        attackerPosture: 'ASSAULT',
        defenderPosture: defender.defensePosture,
        attackBreakdown: shock.attackBreakdown,
        defenseBreakdown: shock.defenseBreakdown,
        attackerTactical: shock.attackerRolls,
        defenderTactical: shock.defenderRolls,
        fortification,
        attackStrength: shock.attackStrength,
        defenseStrength: shock.defenseStrength,
        attackModifiers: shock.attackModifiers,
        defenseModifiers: shock.defenseModifiers,
        attackTotal: shock.attackTotal,
        defenseTotal: shock.defenseTotal,
        delta,
        outcome,
        winnerId: outcome !== 'TIE' && delta > 0 ? __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["WORLD_ID"] : defenderId,
        losses: [
            ...losses,
            ...threatLosses
        ],
        retreat: null
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["settleCargo"])(state);
    const names = state.core.players.find((player)=>player.id === defenderId)?.name ?? 'Uma civilização';
    const reading = outcome === 'TIE' ? 'e a batalha terminou em empate tático' : delta > 0 ? outcome === 'DECISIVE' ? 'e venceu de forma decisiva' : 'e venceu' : outcome === 'DECISIVE' ? 'e foi repelido de forma decisiva' : 'e foi repelido';
    const message = `${threatName(threat)} (${describe(threat, state) || 'dizimado'}) atacou ${names} em ${hex} ${reading} (Ataque ${shock.attackTotal} × Defesa ${shock.defenseTotal}, Δ ${delta > 0 ? '+' : ''}${delta}).`;
    const viewers = threatViewers(state, hex, [
        defenderId
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'THREAT_ASSAULT', message, viewers);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(state, {
        type: 'COMBAT',
        actorId: null,
        visibleTo: viewers,
        message,
        hexId: hex,
        unitIds: [
            ...losses
        ]
    });
}
function threatAlerts(state, actor) {
    const map = tileMap(state), owner = state.core.players.find((player)=>player.id === actor);
    if (!owner) return [];
    return owner.civilization.cities.flatMap((city)=>{
        const from = map.get(city.hexId);
        const near = state.threats.filter((threat)=>threat.status === 'MARCHING').map((threat)=>({
                threat,
                d: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(from, map.get(threat.hexId))
            })).filter((item)=>item.d <= 3).sort((a, b)=>a.d - b.d || byId(a.threat, b.threat))[0];
        return near ? [
            {
                cityId: city.id,
                distance: near.d,
                kind: near.threat.kind
            }
        ] : [];
    });
}
}),
"[project]/packages/game-engine/dist/alpha-trade.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TRADE_DEFAULT_PRESTIGE",
    ()=>TRADE_DEFAULT_PRESTIGE,
    "proposeTrade",
    ()=>proposeTrade,
    "respondTrade",
    ()=>respondTrade,
    "settleTradeOffers",
    ()=>settleTradeOffers,
    "tradeBlock",
    ()=>tradeBlock,
    "tradeOfferView",
    ()=>tradeOfferView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-diplomacy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-kits.js [app-route] (ecmascript)");
;
;
;
;
;
const TRADE_DEFAULT_PRESTIGE = 2;
const empty = (pool)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"].every((key)=>pool[key] === 0);
/** Trades move the named goods, so nothing may be substituted by wealth as action costs allow. */ function holds(state, actor, pool) {
    const resources = state.players.find((player)=>player.playerId === actor)?.resources;
    return !!resources && __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"].every((key)=>resources[key] >= pool[key]);
}
function transfer(state, from, to, pool) {
    if (empty(pool)) return;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, from, pool);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, to, pool, {
        category: 'trade'
    });
}
const name = (state, id)=>state.core.players.find((player)=>player.id === id)?.name ?? 'Uma civilização';
const goods = (pool)=>{
    const names = {
        food: 'Alimento',
        wood: 'Madeira',
        stone: 'Pedra',
        metal: 'Metal',
        wealth: 'Riqueza',
        knowledge: 'Conhecimento',
        influence: 'Influência'
    };
    return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"].filter((key)=>pool[key] > 0).map((key)=>`${pool[key]} ${names[key]}`).join(', ') || 'nada';
};
function tradeBlock(state, actor, command) {
    const player = state.players.find((candidate)=>candidate.playerId === actor);
    if (!player || command.recipientId === actor || !player.contacts.includes(command.recipientId)) return 'Estabeleça contato antes de negociar.';
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["atWar"])(state, actor, command.recipientId)) return 'Não há comércio entre civilizações em guerra.';
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasTreaty"])(state, actor, command.recipientId, 'EMBARGO')) return 'Um embargo impede o comércio entre vocês.';
    if (empty(command.offer) && empty(command.request)) return 'Inclua algum recurso na oferta.';
    const deferred = command.offerType === 'FUTURE_PROMISE' || command.offerType === 'LOAN';
    if (command.offerType === 'GIFT' && !empty(command.request)) return 'Um presente não pede nada em troca.';
    if (command.offerType === 'GIFT' && empty(command.offer)) return 'Escolha o que oferecer.';
    if (deferred && (command.dueRound === null || command.dueRound <= state.core.round || command.dueRound > state.rules.roundLimit)) return `Escolha um prazo entre a rodada ${state.core.round + 1} e a ${state.rules.roundLimit}.`;
    if (!deferred && command.dueRound !== null) return 'Só promessas e empréstimos têm prazo.';
    if (command.offerType === 'FUTURE_PROMISE' && (empty(command.offer) || empty(command.request))) return 'Uma promessa troca algo agora por algo no prazo.';
    if (command.offerType === 'LOAN' && (empty(command.offer) || empty(command.request))) return 'Um empréstimo entrega agora e pede a devolução no prazo.';
    // What the proposer hands over at acceptance must exist now.
    const now = command.offerType === 'FUTURE_PROMISE' ? null : command.offer;
    if (now && !holds(state, actor, now)) return 'Você não tem agora os recursos oferecidos.';
    if (state.tradeOffers.filter((offer)=>offer.proposerId === actor && offer.status === 'PROPOSED').length >= 4) return 'Limite de 4 ofertas abertas ao mesmo tempo.';
    return null;
}
function proposeTrade(state, actor, command) {
    const blocked = tradeBlock(state, actor, command);
    if (blocked) throw new Error(blocked);
    state.tradeOffers.push({
        id: `offer-${actor}-${state.version}`,
        type: command.offerType,
        proposerId: actor,
        recipientId: command.recipientId,
        offer: command.offer,
        request: command.request,
        treatyTerms: command.treatyTerms,
        status: 'PROPOSED',
        createdRound: state.core.round,
        dueRound: command.dueRound
    });
    state.telemetry.tradeOffers += 1;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'TRADE_OFFER', `${name(state, actor)} enviou uma oferta comercial a ${name(state, command.recipientId)}.`, [
        actor,
        command.recipientId
    ]);
}
function respondTrade(state, actor, command) {
    const offer = state.tradeOffers.find((candidate)=>candidate.id === command.offerId);
    if (!offer || offer.status !== 'PROPOSED') throw new Error('Esta oferta não está mais aberta.');
    if (actor === offer.proposerId && !command.accept) {
        offer.status = 'DECLINED';
        return;
    }
    if (actor !== offer.recipientId) throw new Error('Somente o destinatário pode responder a esta oferta.');
    if (!command.accept) {
        offer.status = 'DECLINED';
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'TRADE_DECLINED', `${name(state, actor)} recusou a oferta comercial.`, [
            offer.proposerId,
            offer.recipientId
        ]);
        return;
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["atWar"])(state, offer.proposerId, offer.recipientId)) throw new Error('Não há comércio entre civilizações em guerra.');
    const proposerNow = offer.type === 'FUTURE_PROMISE' ? null : offer.offer;
    const recipientNow = offer.type === 'TRADE_INSTANT' || offer.type === 'FUTURE_PROMISE' ? offer.request : null;
    if (proposerNow && !holds(state, offer.proposerId, proposerNow)) throw new Error(`${name(state, offer.proposerId)} não tem mais os recursos oferecidos.`);
    if (recipientNow && !holds(state, offer.recipientId, recipientNow)) throw new Error('Você não tem os recursos pedidos.');
    if (proposerNow) transfer(state, offer.proposerId, offer.recipientId, proposerNow);
    if (recipientNow) transfer(state, offer.recipientId, offer.proposerId, recipientNow);
    offer.status = offer.type === 'FUTURE_PROMISE' || offer.type === 'LOAN' ? 'ACCEPTED' : 'SETTLED';
    state.telemetry.acceptedTrades += 1;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitTradeBonus"])(state, [
        offer.proposerId,
        offer.recipientId
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(state, {
        type: 'TRADE',
        actorId: actor,
        visibleTo: [
            offer.proposerId,
            offer.recipientId
        ],
        message: `${name(state, offer.recipientId)} aceitou a oferta de ${name(state, offer.proposerId)}.`,
        unitIds: []
    });
}
function settleTradeOffers(state) {
    for (const offer of state.tradeOffers){
        if (offer.status === 'PROPOSED' && offer.createdRound <= state.core.round) {
            offer.status = 'DECLINED';
            continue;
        }
        if (offer.status !== 'ACCEPTED' || offer.dueRound === null || offer.dueRound > state.core.round) continue;
        const [debtor, creditor, due] = offer.type === 'FUTURE_PROMISE' ? [
            offer.proposerId,
            offer.recipientId,
            offer.offer
        ] : [
            offer.recipientId,
            offer.proposerId,
            offer.request
        ];
        const audience = [
            offer.proposerId,
            offer.recipientId
        ];
        if (holds(state, debtor, due)) {
            transfer(state, debtor, creditor, due);
            offer.status = 'SETTLED';
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(state, {
                type: 'TRADE',
                actorId: debtor,
                visibleTo: audience,
                message: `${name(state, debtor)} pagou ${goods(due)} a ${name(state, creditor)} no prazo.`,
                unitIds: []
            });
        } else {
            offer.status = 'DEFAULTED';
            const player = state.players.find((candidate)=>candidate.playerId === debtor);
            player.prestige = Math.max(0, player.prestige - TRADE_DEFAULT_PRESTIGE);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(state, {
                type: 'TRADE',
                actorId: debtor,
                visibleTo: audience,
                message: `${name(state, debtor)} não pagou ${goods(due)} a ${name(state, creditor)}: calote, −${TRADE_DEFAULT_PRESTIGE} Prestígio.`,
                unitIds: []
            });
        }
    }
}
const tradeOfferView = (state, actor)=>state.tradeOffers.filter((offer)=>offer.proposerId === actor || offer.recipientId === actor);
}),
"[project]/packages/game-engine/dist/alpha-turn.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ALPHA_UNSUPPORTED_COMMANDS",
    ()=>ALPHA_UNSUPPORTED_COMMANDS,
    "alphaCommandCapacity",
    ()=>alphaCommandCapacity,
    "applyAlphaCommand",
    ()=>applyAlphaCommand,
    "beginAlphaPlanning",
    ()=>beginAlphaPlanning,
    "liftLegacyCityCaps",
    ()=>liftLegacyCityCaps
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$trade$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-trade.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared/dist/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$engine$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/engine.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-military.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-stack.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-city.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-diplomacy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-world.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-cards.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$era$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-era-turn.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-naval.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$hegemony$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-hegemony.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cities$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-cities.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resonance.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$phases$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-phases.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-urban.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-leaders.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-actions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$culture$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-culture.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$independents$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-independents.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-kits.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-legacy-works.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$casualties$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-casualties.js [app-route] (ecmascript)");
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
;
;
;
;
function alphaCommandCapacity(state, playerId) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaActionCapacity"])(state, playerId);
}
function beginAlphaPlanning(input) {
    const state = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaStateSchema"].parse(input);
    liftLegacyCityCaps(state);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["refreshAlphaAdministration"])(state);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ensureLeaders"])(state);
    if (state.phase !== 'WORLD_PULSE') throw new Error('Início requer o Pulso do mundo.');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$phases$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["openRound"])(state);
    return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaStateSchema"].parse(state);
}
const ALPHA_UNSUPPORTED_COMMANDS = [];
const UNSUPPORTED = new Set(ALPHA_UNSUPPORTED_COMMANDS);
const PHASE_LABEL = {
    WORLD_PULSE: 'Pulso do mundo',
    PLANNING: 'Planejamento',
    URBAN_ACTIONS: 'Ações urbanas',
    ORDERS_MOVEMENT: 'Ordens e movimento',
    DIPLOMACY_TRADE: 'Diplomacia e comércio',
    CONFLICTS: 'Conflitos',
    INTEGRATION_MAINTENANCE: 'Integração e manutenção',
    END_ROUND: 'Fim da rodada',
    ERA_TURN: 'Virada de Era'
};
function liftLegacyCityCaps(state) {
    state.core.config.developmentPopulationCaps = [
        20,
        20,
        20,
        20,
        20
    ];
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mirrorDevelopment"])(state);
}
function applyAlphaCommand(input, actor, raw) {
    const validated = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaStateSchema"].safeParse(input);
    if (!validated.success) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'INVALID_STATE',
        message: 'Estado alpha inválido.'
    });
    const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaCommandSchema"].safeParse(raw);
    if (!parsed.success) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'INVALID_INPUT',
        message: 'Comando inválido.'
    });
    const state = validated.data;
    const command = parsed.data;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ensureLeaders"])(state);
    liftLegacyCityCaps(state);
    if (command.expectedVersion !== state.version) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'VERSION_CONFLICT',
        message: 'A partida mudou. Atualize antes de confirmar novamente.'
    });
    if (state.version === Number.MAX_SAFE_INTEGER) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'NUMERIC_OVERFLOW',
        message: 'Limite de versões atingido.'
    });
    if (state.core.status !== 'ACTIVE') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'NOT_ACTIVE',
        message: 'Esta partida já terminou.'
    });
    const player = state.players.find((p)=>p.playerId === actor);
    if (!player) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'FORBIDDEN',
        message: 'Você não ocupa um lugar nesta partida.'
    });
    if (UNSUPPORTED.has(command.type)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'NOT_IMPLEMENTED',
        message: 'Esta ação ainda não está disponível na alpha.'
    });
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$phases$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LEGAL_COMMANDS"][state.phase].has(command.type)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'WRONG_PHASE',
        message: `Esta decisão não é permitida na fase ${PHASE_LABEL[state.phase]}.`
    });
    if (command.type === 'UNREADY' && !player.ready) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'NOT_READY',
        message: 'Você ainda não confirmou esta fase.'
    });
    if (player.ready && command.type !== 'UNREADY') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'ALREADY_READY',
        message: 'Suas decisões já estão confirmadas para esta fase.'
    });
    try {
        const actionClass = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["actionClassForCommand"])(command, state.phase);
        let reservedMainAction = false;
        if (command.type === 'MANAGE') {
            if (command.command.type === 'ADVANCE_PHASE' || command.command.type === 'SUBMIT_ORDER') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'FORBIDDEN',
                message: 'Use os controles de planejamento da alpha.'
            });
            if (command.command.playerId !== actor) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'FORBIDDEN',
                message: 'Você só pode comandar sua própria civilização.'
            });
            if (command.command.type === 'BUILD_DISTRICT' || command.command.type === 'BUILD_BUILDING') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'USE_URBAN_ACTION',
                message: 'Construa pela ação urbana Construir.'
            });
            if (command.command.type === 'DEVELOP_CITY' || command.command.type === 'SPECIALIZE_CITY') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'RULE_REMOVED',
                message: 'Desenvolvimento e especialização saíram das regras: a cidade sobe de nível por Elevar e se especializa pelos distritos.'
            });
            if (command.command.type === 'ADOPT_GOVERNMENT') {
                // Canon §16, I-7: a government changes only at the Era turn. Here the Influência Order is reserved in the last round of the Era.
                const government = command.command.government;
                if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$era$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isReformRound"])(state)) throw new Error('O governo só muda na Virada de Era: reserve a Ordem Influência na última rodada da Era.');
                if (player.plannedActions.some((action)=>action.type === 'GOVERNMENT_REFORM')) throw new Error('Já existe uma reforma de governo reservada.');
                const blocked = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$era$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentReformBlock"])(state, actor, government);
                if (blocked) throw new Error(blocked);
                player.plannedActions.push({
                    id: `reform-${state.version}`,
                    type: 'GOVERNMENT_REFORM',
                    government
                });
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'GOVERNMENT_PLANNED', 'Reforma de governo reservada para a Virada de Era.', [
                    actor
                ]);
                if (actionClass === 'MAIN') (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chargeMainAction"])(state, actor, 'RESERVE', 'INFLUENCE');
                state.version++;
                const planned = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaStateSchema"].safeParse(state);
                if (planned.success) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(planned.data);
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                    code: 'INVALID_STATE',
                    message: 'A decisão violaria uma regra de integridade.'
                });
            }
            const management = command.command;
            if (management.type === 'ASSIGN_POPULATION') {
                const meta = state.cities.find((c)=>c.cityId === management.cityId);
                if (meta && meta.allocationRound === state.core.round) throw new Error('A população desta cidade já foi redistribuída nesta rodada.');
                if (meta) meta.allocationRound = state.core.round;
            }
            const occupied = state.occupations.some((o)=>'cityId' in management && management.type !== 'FOUND_CITY' && management.cityId === o.cityId || 'hexId' in management && state.core.map.find((t)=>t.id === management.hexId)?.controllerCityId === o.cityId);
            if (occupied) throw new Error('Integre a cidade ocupada antes de administrar seus territórios e construções.');
            const pay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaResourcePayment"])(state);
            const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$engine$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyCommand"])(state.core, {
                ...command.command,
                expectedVersion: state.core.version
            }, management.type === 'IMPROVE_HEX' ? (player, cost)=>pay(player, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitWorksCost"])(state, actor, cost)) : pay);
            if (!result.ok) return result;
            state.core = result.value;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["syncCityMetadata"])(state);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'MANAGEMENT', 'Decisão de gestão aplicada.', [
                actor
            ]);
        } else if (command.type === 'SET_CASUALTY_PRIORITY') {
            const blocked = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$casualties$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["casualtyPriorityBlock"])(state, actor, command.order, command.hexId);
            if (blocked) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'RULE_FAILURE',
                message: blocked
            });
            const unique = [
                ...new Set(command.order)
            ];
            if (command.hexId === null) player.casualtyPriority.order = unique;
            else if (unique.length) player.casualtyPriority.byHex[command.hexId] = unique;
            else delete player.casualtyPriority.byHex[command.hexId];
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'CASUALTY_PRIORITY', 'Prioridade de baixas definida.', [
                actor
            ]);
        } else if (command.type === 'SET_DEFENSE_POSTURE') {
            player.defensePosture = command.posture;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'DEFENSE_POSTURE', 'Postura defensiva definida.', [
                actor
            ]);
        } else if (command.type === 'SWAP_AMBITION') {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["swapAmbition"])(state, actor, command.cardId);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'CARD_ACTION', 'Ambição trocada.', [
                actor
            ]);
        } else if (command.type === 'RESOLVE_CHOICE') {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["resolveChoice"])(state, actor, command.choiceId, command.optionId);
        } else if (command.type === 'LEADER_ABILITY') {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["useLeaderAbility"])(state, actor);
        } else if (command.type === 'CONTEST_PRESENCE') {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$culture$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["contestPresence"])(state, actor, command);
        } else if (command.type === 'PROPOSE_TRADE') {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$trade$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["proposeTrade"])(state, actor, command);
        } else if (command.type === 'RESPOND_TRADE') {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$trade$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["respondTrade"])(state, actor, command);
        } else if (command.type === 'INDEPENDENT_ACTION') {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$independents$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["independentAction"])(state, actor, command);
        } else if (command.type === 'URBAN_ACTION') {
            if (state.phase === 'PLANNING') {
                const params = {
                    ...command.build ? {
                        build: command.build
                    } : {},
                    ...command.unit ? {
                        unit: command.unit
                    } : {},
                    ...command.advancementId ? {
                        advancementId: command.advancementId
                    } : {},
                    ...command.count ? {
                        count: command.count
                    } : {}
                };
                const blocked = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["urbanBlock"])(state, actor, command.cityId, command.action, params);
                if (blocked) throw new Error(blocked);
                player.plannedActions.push({
                    id: command.planId ?? `action-${state.version}`,
                    type: 'URBAN_ACTION',
                    cityId: command.cityId,
                    action: command.action,
                    ...params
                });
                reservedMainAction = true;
            } else (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["performUrbanAction"])(state, actor, command);
        } else if (command.type === 'UNREADY') {
            // Everyone ready advances the phase inside the same command, so a withdrawable READY always has someone still deciding.
            player.ready = false;
        } else if (command.type === 'READY') {
            if (!player.ambitionsChosen) throw new Error('Escolha duas ambições antes de confirmar seu primeiro planejamento.');
            player.ready = true;
            if (state.players.every((p)=>p.ready)) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$phases$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["advanceAfterReady"])(state);
        } else if (command.type === 'QUEUE_ORDER' || command.type === 'CANCEL_ORDER') {
            if (command.type === 'CANCEL_ORDER') {
                player.orders = player.orders.filter((o)=>o.id !== command.orderId);
                player.plannedActions = player.plannedActions.filter((action)=>action.id !== command.orderId);
            } else {
                if (command.order.type === 'EXPLORE') (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateExploration"])(state, actor, command.order);
                else if (command.order.type === 'TRADE') (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["tradePath"])(state, actor, command.order.fromCityId, command.order.toCityId);
                else if (command.order.type === 'INFLUENCE') (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateInfluence"])(state, actor, command.order);
                else (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateMilitaryOrder"])(state, actor, command.order);
                if (command.order.type === 'MOVE' && command.order.path.length) {
                    const target = command.order.path.at(-1), moving = state.units.filter((u)=>u.ownerId === actor && command.order.unitIds.includes(u.id));
                    const crowded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackBlock"])(state, actor, moving, target, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["pendingArrivals"])(state, actor, target, command.order.id));
                    if (crowded) throw new Error(crowded);
                }
                const remaining = player.orders.filter((o)=>o.id !== command.order.id);
                const units = 'unitIds' in command.order ? command.order.unitIds : 'unitId' in command.order ? [
                    command.order.unitId
                ] : [];
                if (remaining.some((o)=>('unitIds' in o ? o.unitIds : 'unitId' in o ? [
                        o.unitId
                    ] : []).some((id)=>units.includes(id)))) throw new Error('Cada peça pode participar de apenas uma ordem por rodada.');
                player.orders = [
                    ...remaining,
                    command.order
                ];
                reservedMainAction = true;
            }
        } else if (command.type === 'SETTLE') {
            const hexId = state.units.find((unit)=>unit.id === command.unitId && unit.ownerId === actor)?.hexId;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cities$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["settleWithPioneer"])(state, actor, command.unitId, command.name);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["refreshKnowledge"])(state);
            if (hexId) {
                const city = state.core.players.find((owner)=>owner.id === actor).civilization.cities.find((item)=>item.hexId === hexId);
                const visibleTo = state.players.map((owner)=>owner.playerId).filter((playerId)=>playerId === actor || (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["visibleHexIds"])(state, playerId).has(hexId));
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'CITY_FOUNDED', `${state.core.players.find((owner)=>owner.id === actor)?.name ?? 'Uma civilização'} fundou ${city.name}.`, null);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(state, {
                    type: 'FOUNDATION',
                    actorId: actor,
                    visibleTo,
                    message: `${city.name} foi fundada.`,
                    hexId,
                    cityId: city.id,
                    unitIds: [
                        command.unitId
                    ]
                });
            }
        } else if (command.type === 'DECLARE_HEGEMONY') {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$hegemony$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["declareHegemony"])(state, actor, command.path);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'HEGEMONY_DECLARED', 'Uma civilização declarou seu caminho hegemônico.');
        } else if (command.type === 'PLAY_CIVILIZATION_CARD') {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["playCivilizationCard"])(state, actor, command.cardId);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'CARD_ACTION', 'Carta da civilização aplicada.', [
                actor
            ]);
        } else if (command.type === 'ADVANCE_LEGACY_WORK') {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["advanceLegacyWork"])(state, actor, command);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'CARD_ACTION', 'Passo de Obra de Legado aplicado.', [
                actor
            ]);
        } else if (command.type === 'PLAY_CARD' || command.type === 'CHOOSE_AMBITIONS' || command.type === 'HIRE_ADVISOR' || command.type === 'WORLD_CHOICE') {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["manageCard"])(state, actor, command);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'CARD_ACTION', 'Decisão de carta ou projeto aplicada.', [
                actor
            ]);
        } else if (command.type === 'PROPOSE_TREATY' || command.type === 'RESPOND_TREATY' || command.type === 'END_TREATY' || command.type === 'DECLARE_WAR') {
            if (state.phase === 'PLANNING' && (command.type === 'PROPOSE_TREATY' || command.type === 'DECLARE_WAR')) {
                const blocked = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["diplomacyBlock"])(state, actor, command);
                if (blocked) throw new Error(blocked);
                if (command.type === 'PROPOSE_TREATY') player.plannedActions.push({
                    id: command.planId ?? `action-${state.version}`,
                    type: command.type,
                    recipientId: command.recipientId,
                    treaty: command.treaty,
                    deal: command.deal
                });
                else player.plannedActions.push({
                    id: command.planId ?? `action-${state.version}`,
                    type: command.type,
                    targetId: command.targetId
                });
                reservedMainAction = true;
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'DIPLOMACY_PLANNED', 'Decisão diplomática reservada.', [
                    actor
                ]);
            } else {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["manageDiplomacy"])(state, actor, command);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'DIPLOMACY', 'Decisão diplomática registrada.', [
                    actor
                ]);
            }
        } else if (command.type === 'DEMOBILIZE') {
            const cityId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["demobilize"])(state, actor, command.unitId);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'DEMOBILIZED', `Peça desmobilizada em ${cityId}: um habitante Disponível voltou à cidade.`, [
                actor
            ]);
        } else if (command.type === 'EMBARK' || command.type === 'DISEMBARK') {
            if (command.type === 'EMBARK') (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["embark"])(state, actor, command.unitIds, command.fleetId);
            else (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["disembark"])(state, actor, command.unitIds, command.hexId);
            const where = state.units.find((unit)=>unit.id === command.unitIds[0]).hexId;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolutionEvent"])(state, {
                type: 'MOVEMENT',
                actorId: actor,
                visibleTo: [
                    actor
                ],
                message: command.type === 'EMBARK' ? `${command.unitIds.length} peça(s) embarcada(s) em ${where}.` : `${command.unitIds.length} peça(s) desembarcada(s) em ${where}.`,
                hexId: where,
                unitIds: [
                    ...command.unitIds
                ]
            });
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'ACTION_COMPLETED', command.type === 'EMBARK' ? 'Peças embarcadas.' : 'Peças desembarcadas.', [
                actor
            ]);
        } else if (command.type === 'BUILD_ROAD') {
            const tile = state.core.map.find((t)=>t.id === command.hexId && t.ownerId === actor);
            if (!tile || state.roads.includes(tile.id)) throw new Error('Construa estrada em território próprio sem estrada.');
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, actor, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitWorksCost"])(state, actor, state.rules.roadCost, tile));
            state.roads.push(tile.id);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'ROAD_BUILT', `${state.core.players.find((p)=>p.id === actor)?.name ?? 'Uma civilização'} construiu uma estrada.`, null);
        }
        if (actionClass === 'MAIN') (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chargeMainAction"])(state, actor, reservedMainAction ? 'RESERVE' : 'COMMIT', (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["orderTypeForCommand"])(command, state.phase));
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["refreshAlphaAdministration"])(state);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$hegemony$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["refreshHegemony"])(state);
        state.version++;
        const output = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaStateSchema"].safeParse(state);
        if (output.success) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(output.data);
        const issue = output.error.issues[0];
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'INVALID_STATE',
            message: `A decisão violaria uma regra de integridade${issue ? ` (${issue.path.join('.')}: ${issue.message})` : ''}.`
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'A decisão não pôde ser concluída.';
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: message === 'Sem ações principais disponíveis nesta rodada.' ? 'ACTION_LIMIT' : 'RULE_FAILURE',
            message
        });
    }
}
}),
"[project]/packages/game-engine/dist/alpha-unit-options.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "alphaClaimOptions",
    ()=>alphaClaimOptions,
    "alphaUnitOptions",
    ()=>alphaUnitOptions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-grades.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-world.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-military.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-diplomacy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-institutions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-stack.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cities$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-cities.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$engine$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/engine.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-naval.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-kits.js [app-route] (ecmascript)");
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
function alphaUnitOptions(state, actor) {
    const progress = state.players.find((player)=>player.playerId === actor);
    if (!progress) return {};
    const byId = new Map(state.core.map.map((tile)=>[
            tile.id,
            tile
        ]));
    const known = new Set(progress.knownHexIds);
    const options = {};
    for (const unit of state.units.filter((candidate)=>candidate.ownerId === actor)){
        const carried = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isCarried"])(unit);
        const embark = carried || state.rules.units[unit.kind].domain !== 'LAND' ? [] : state.units.filter((fleet)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isCarrierKind"])(state, fleet.kind) && fleet.ownerId === actor && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["embarkBlock"])(state, actor, [
                unit.id
            ], fleet.id) === null).map((fleet)=>fleet.id).sort();
        const disembark = carried ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])(byId.get(unit.hexId)).map(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"]).filter((id)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["disembarkBlock"])(state, actor, [
                unit.id
            ], id) === null).sort() : [];
        options[unit.id] = {
            moves: carried ? {} : reachable(state, actor, unit, byId, known),
            explore: carried ? [] : explorable(state, actor, unit, byId),
            settleBlock: unit.kind === 'PIONEER' ? settleBlock(state, actor, unit) : 'Somente Pioneiros fundam cidades.',
            embark,
            disembark
        };
    }
    return options;
}
function reachable(state, actor, unit, byId, known) {
    const budget = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$grades$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unitMovement"])(state, unit) + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["institutionBonus"])(state, actor, 'MOVEMENT') + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitMovement"])(state, actor, unit.kind);
    const land = state.rules.units[unit.kind].domain === 'LAND';
    const best = new Map([
        [
            unit.hexId,
            {
                cost: 0,
                path: []
            }
        ]
    ]);
    const queue = [
        unit.hexId
    ];
    while(queue.length){
        queue.sort((a, b)=>best.get(a).cost - best.get(b).cost || a.localeCompare(b));
        const id = queue.shift(), node = best.get(id), current = byId.get(id);
        for (const point of (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])(current)){
            const nextId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"])(point), tile = byId.get(nextId);
            if (!tile || !known.has(nextId) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["canEnter"])(state, unit, tile.id)) continue;
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["movementOpen"])(state, actor, tile.ownerId) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["enemyCityAt"])(state, actor, nextId) || state.units.some((other)=>other.hexId === nextId && other.ownerId !== actor)) continue;
            const cost = node.cost + (state.roads.includes(tile.id) && land ? 1 : state.rules.movementCosts[tile.terrain]);
            if (cost > budget || cost >= (best.get(nextId)?.cost ?? Infinity)) continue;
            best.set(nextId, {
                cost,
                path: [
                    ...node.path,
                    nextId
                ]
            });
            queue.push(nextId);
        }
    }
    const moves = {};
    for (const [id, node] of [
        ...best.entries()
    ].sort(([a], [b])=>a.localeCompare(b))){
        if (id !== unit.hexId && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackBlock"])(state, actor, [
            unit
        ], id) === null) moves[id] = node.path;
    }
    return moves;
}
function explorable(state, actor, unit, byId) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["explorerRole"])(state, unit) === null) return [];
    const origin = byId.get(unit.hexId);
    return state.regions.filter((region)=>!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["regionOpenFor"])(state, region, actor)).flatMap((region)=>{
        const near = region.hexIds.map((id)=>byId.get(id)).filter((tile)=>tile && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(origin, tile) <= (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitExplorationReach"])(state, unit)).sort((a, b)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(origin, a) - (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(origin, b) || a.id.localeCompare(b.id));
        if (!near[0]) return [];
        const access = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["explorationAccess"])(state, unit, region);
        return [
            {
                target: near[0].id,
                hexIds: [
                    ...region.hexIds
                ],
                rotations: access.rotations,
                block: access.block
            }
        ];
    }).sort((a, b)=>a.target.localeCompare(b.target));
}
/** Dry run on a copy: founding has several rules (spacing, terrain, cost) and only the real action knows all of them. */ function settleBlock(state, actor, unit) {
    try {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cities$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["settleWithPioneer"])(structuredClone(state), actor, unit.id, 'Prévia');
        return null;
    } catch (error) {
        return error instanceof Error ? error.message : 'Fundação indisponível.';
    }
}
function alphaClaimOptions(state, actor) {
    const player = state.core.players.find((candidate)=>candidate.id === actor);
    if (!player) return {};
    const options = {};
    const free = state.core.map.filter((tile)=>tile.ownerId === null && tile.terrain !== 'SEA' && tile.terrain !== 'UNKNOWN');
    for (const city of player.civilization.cities){
        if (state.occupations.some((occupation)=>occupation.cityId === city.id)) continue;
        const center = state.core.map.find((tile)=>tile.id === city.hexId), radius = state.core.config.territory.cityRadii[city.development - 1] ?? 0;
        options[city.id] = free.filter((tile)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(center, tile) <= radius).filter((tile)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$engine$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyCommand"])(state.core, {
                type: 'CLAIM_HEX',
                playerId: actor,
                cityId: city.id,
                hexId: tile.id,
                expectedVersion: state.core.version
            }, (_, cost)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, actor, cost)).ok).map((tile)=>tile.id).sort();
    }
    return options;
}
}),
"[project]/packages/game-engine/dist/alpha-urban.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "performUrbanAction",
    ()=>performUrbanAction,
    "productionOutput",
    ()=>productionOutput,
    "syncCityMetadata",
    ()=>syncCityMetadata,
    "urbanBlock",
    ()=>urbanBlock,
    "urbanCost",
    ()=>urbanCost,
    "urbanOptions",
    ()=>urbanOptions,
    "webRouteIncome",
    ()=>webRouteIncome
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-web.js [app-route] (ecmascript) <export WEB_ADVANCES as ADVANCEMENTS>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-concept.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-catalog.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-city-ladder.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/territory.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$engine$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/engine.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-leaders.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-military.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-government.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-city.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-institutions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-actions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-water.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-kits.js [app-route] (ecmascript)");
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
function syncCityMetadata(state) {
    const coreDistricts = new Set(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DistrictTypeSchema"].options), coreBuildings = new Set(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["BuildingTypeSchema"].options);
    for (const meta of state.cities){
        const city = state.core.players.flatMap((player)=>player.civilization.cities).find((candidate)=>candidate.id === meta.cityId);
        if (!city) continue;
        meta.districts = [
            ...meta.districts.filter((item)=>!coreDistricts.has(item)),
            ...city.districts.map((item)=>item.type)
        ];
        meta.buildings = [
            ...meta.buildings.filter((item)=>!coreBuildings.has(item)),
            ...city.buildings.map((item)=>item.type)
        ];
    // The built level never follows the population (canon §4): it rises only through Elevar.
    }
}
/** Gates every urban action shares: phase, readiness, ownership, occupation and remaining city actions. */ function cityGate(state, actor, cityId, action) {
    if (state.phase !== 'PLANNING' && state.phase !== 'URBAN_ACTIONS') return 'Disponível apenas no Planejamento.';
    if (state.players.find((player)=>player.playerId === actor)?.ready) return 'Suas decisões já estão confirmadas para esta fase.';
    const actions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaActionUsage"])(state, actor);
    if (actions.used >= actions.limit) return 'Sem ações principais disponíveis nesta rodada.';
    const meta = state.cities.find((candidate)=>candidate.cityId === cityId);
    const city = state.core.players.find((player)=>player.id === actor)?.civilization.cities.find((candidate)=>candidate.id === cityId);
    if (!meta || !city || meta.currentOwnerId !== actor) return 'Escolha uma cidade própria.';
    // Avanço is its own Order (canon §2: target "—"): the city only carries the research, so it is not one of the city's activations (E-1).
    if (action === 'RESEARCH') return null;
    const occupied = meta.status === 'OCCUPIED' || state.occupations.some((occupation)=>occupation.cityId === cityId);
    if (occupied && action !== 'CIVIC_ACTION') return 'Cidade ocupada: apenas a Ação Cívica de integração está disponível.';
    const planned = state.players.find((player)=>player.playerId === actor)?.plannedActions.filter((candidate)=>candidate.type === 'URBAN_ACTION' && candidate.action !== 'RESEARCH' && candidate.cityId === cityId).length ?? 0;
    // Two activations per round when Estável or Próspera, one when Abalada (canon §10); the second costs one Ânimo when it resolves.
    // Sobre-extensão (canon §4): no second activation anywhere.
    const allowed = Math.min(state.rules.balance.cityActions, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["activationsAllowed"])(meta), (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["administration"])(state, actor).overextended ? 1 : 2);
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["moodBand"])(meta.mood) === 'REVOLT' && action !== 'PROMOTE_MOOD' && action !== 'CIVIC_ACTION') return 'Cidade em Revolta: só Governar (Ânimo e integração) está disponível.';
    // Conselho (canon §16): at most one second activation per round in the whole civilization.
    const secondLimit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, actor).secondActivationsPerRound;
    if (secondLimit !== null && (state.phase === 'PLANNING' ? planned >= 1 : meta.urbanActionsUsed >= 1)) {
        const others = state.cities.filter((other)=>other.currentOwnerId === actor && other.cityId !== cityId);
        const seconds = others.filter((other)=>(state.phase === 'PLANNING' ? state.players.find((player)=>player.playerId === actor).plannedActions.filter((candidate)=>candidate.type === 'URBAN_ACTION' && candidate.action !== 'RESEARCH' && candidate.cityId === other.cityId).length : other.urbanActionsUsed) >= 2).length;
        if (seconds >= secondLimit) return 'Conselho: no máximo uma segunda ativação por rodada em toda a civilização.';
    }
    if (state.phase === 'PLANNING' && planned >= allowed) return allowed === 1 ? 'Esta cidade já possui sua ação planejada para esta rodada.' : 'Esta cidade já tem as duas ativações planejadas nesta rodada.';
    if (state.phase === 'URBAN_ACTIONS' && meta.urbanActionsUsed >= allowed) return 'Esta cidade já usou suas ativações nesta rodada.';
    return null;
}
/** Recrutar for `count` pieces: the Capacity rule of canon §4, then every piece must be recruitable in turn (resources, Soldados, stack). */ function recruitCountBlock(state, actor, cityId, unit, count) {
    if (count > (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recruitLimit"])(state, actor, cityId)) return `Esta ativação recruta no máximo ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recruitLimit"])(state, actor, cityId)} peça(s).`;
    // E-1: while planning, nothing is mobilized yet, so pieces already reserved by earlier planned Recrutar in this city must be
    // counted against the Soldados/Disponíveis left, or the second plan would be accepted and lost at resolution.
    const reserved = state.phase === 'PLANNING' ? state.players.find((player)=>player.playerId === actor).plannedActions.flatMap((planned)=>planned.type === 'URBAN_ACTION' && planned.action === 'RECRUIT' && planned.cityId === cityId && planned.unit ? Array(planned.count ?? 1).fill(planned.unit) : []) : [];
    if (count === 1 && reserved.length === 0) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recruitBlock"])(state, actor, cityId, unit);
    const trial = structuredClone(state);
    for (const earlier of reserved){
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mobilizationBlock"])(trial, cityId, earlier) === null) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mobilize"])(trial, cityId, earlier);
    }
    for(let index = 0; index < count; index++){
        const blocked = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recruitBlock"])(trial, actor, cityId, unit);
        if (blocked) return count > 1 && index > 0 ? `Só ${index} das ${count} peças podem ser recrutadas: ${blocked}` : blocked;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recruitUnit"])(trial, actor, cityId, unit);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mobilize"])(trial, cityId, unit);
    }
    return null;
}
const webRouteIncome = (state, actor)=>((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasUnlock"])(state, actor, 'rule:route-plus-1') ? 1 : 0) + ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasUnlock"])(state, actor, 'rule:route-plus-2') ? 2 : 0) - ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasUnlock"])(state, actor, 'rule:route-minus-1') ? 1 : 0);
function buildBlock(state, actor, cityId, build) {
    const owner = state.core.players.find((player)=>player.id === actor), progress = state.players.find((player)=>player.playerId === actor);
    const city = owner.civilization.cities.find((candidate)=>candidate.id === cityId), meta = state.cities.find((candidate)=>candidate.cityId === cityId);
    const rules = state.core.config.territory;
    if (build.kind === 'DISTRICT') {
        const entry = rules.districts[build.district];
        if (city.districts.some((item)=>item.type === build.district)) return 'Um distrito de cada tipo por cidade.';
        if (city.districts.length >= (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["districtSlots"])(state, cityId)) return 'Sem vagas de distrito: Eleve a cidade.';
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasUnlock"])(state, actor, `district:${build.district}`)) return 'Este distrito exige um avanço da Teia.';
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, actor, entry.cost, 'BUILD') ? null : 'Recursos insuficientes para esta ação.';
    }
    if (build.kind === 'BUILDING') {
        const entry = rules.buildings[build.building];
        if (!city.districts.some((item)=>item.type === entry.district)) return 'O edifício exige o distrito correspondente.';
        if (city.buildings.some((item)=>item.type === build.building)) return 'Este edifício já existe.';
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, actor, entry.cost, 'BUILD') ? null : 'Recursos insuficientes para esta ação.';
    }
    if (build.kind === 'MARITIME') {
        if (meta.districts.includes('MARITIME')) return 'Um distrito de cada tipo por cidade.';
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isCoastalCity"])(state, cityId)) return 'O Distrito Marítimo exige uma borda d’água navegável.';
        if (meta.districts.length >= (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["districtSlots"])(state, cityId)) return 'Sem vagas de distrito: Eleve a cidade.';
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasUnlock"])(state, actor, 'district:MARITIME')) return 'Este distrito exige um avanço da Teia.';
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, actor, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["districtEntry"])('MARITIME').cost, 'BUILD') ? null : 'Recursos insuficientes para esta ação.';
    }
    const next = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["FORTIFICATION_UPGRADES"][__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["FORTIFICATION_UPGRADES"].indexOf(meta.fortification.level) + 1];
    if (!next) return 'A cidade já possui a fortificação máxima.';
    const spec = state.rules.balance.fortification[next];
    if (__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(progress.era) < __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(spec.era)) return 'Sua civilização ainda não alcançou a era exigida.';
    if (spec.militaryDistrict && !city.districts.some((item)=>item.type === 'MILITARY')) return 'Esta fortificação requer distrito Militar.';
    const capped = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitFortificationBlock"])(state, actor, next);
    if (capped) return capped;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, actor, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCostWithMetal"])(state, actor, spec.cost, spec.metal), 'BUILD') ? null : 'Recursos insuficientes para esta ação.';
}
function urbanBlock(state, actor, cityId, action, params = {}) {
    const gate = cityGate(state, actor, cityId, action);
    if (gate) return gate;
    const meta = state.cities.find((candidate)=>candidate.cityId === cityId);
    switch(action){
        case 'PRODUCE':
            return null;
        case 'ELEVATE':
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["elevateBlock"])(state, actor, cityId);
        case 'BUILD':
            return params.build ? buildBlock(state, actor, cityId, params.build) : 'Escolha o que construir.';
        case 'RECRUIT':
            return params.unit ? recruitCountBlock(state, actor, cityId, params.unit, params.count ?? 1) : 'Escolha a peça a recrutar.';
        case 'RESEARCH':
            {
                if (!params.advancementId) return 'Escolha o avanço a pesquisar.';
                // While planning, a second city cannot reserve an advancement another city already reserved: it would be a lost action.
                const reserved = state.phase === 'PLANNING' && state.players.find((player)=>player.playerId === actor)?.plannedActions.some((planned)=>planned.type === 'URBAN_ACTION' && planned.action === 'RESEARCH' && planned.advancementId === params.advancementId);
                return reserved ? 'Este avanço já está planejado em outra cidade nesta rodada.' : (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["researchBlock"])(state, actor, params.advancementId);
            }
        case 'PROMOTE_MOOD':
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governBlock"])(state, actor, cityId);
        case 'SUPPORT_TRADE':
            return state.routes.some((route)=>route.ownerId === actor && route.fromCityId === cityId && !route.suspended) ? null : 'A cidade não origina nenhuma rota comercial ativa.';
        case 'MOVE_CAPITAL':
            return state.core.players.find((player)=>player.id === actor)?.civilization.capitalCityId === cityId ? 'Esta cidade já é a capital.' : null;
        case 'CIVIC_ACTION':
            {
                if (meta.status !== 'OCCUPIED' && !state.occupations.some((occupation)=>occupation.cityId === cityId)) return null;
                const occupation = state.occupations.find((candidate)=>candidate.cityId === cityId && candidate.occupierId === actor);
                if (occupation && state.core.round <= occupation.sinceRound) return 'A integração fica disponível na rodada seguinte à captura.';
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCanAfford"])(state, actor, state.rules.integrationCost) ? null : 'Recursos insuficientes para esta ação.';
            }
    }
}
function urbanCost(state, actor, cityId, action, params = {}) {
    const zero = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyAlphaResourcePool"])(), territory = state.core.config.territory, balance = state.rules.balance;
    const cityMeta = state.cities.find((candidate)=>candidate.cityId === cityId);
    if (action === 'BUILD' && params.build?.kind === 'DISTRICT') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCostWithMetal"])(state, actor, territory.districts[params.build.district].cost, 0);
    if (action === 'BUILD' && params.build?.kind === 'BUILDING') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCostWithMetal"])(state, actor, territory.buildings[params.build.building].cost, 0);
    if (action === 'BUILD' && params.build?.kind === 'FORTIFICATION' && cityMeta) {
        const next = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["FORTIFICATION_UPGRADES"][__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["FORTIFICATION_UPGRADES"].indexOf(cityMeta.fortification.level) + 1];
        return next ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCostWithMetal"])(state, actor, balance.fortification[next].cost, balance.fortification[next].metal) : zero;
    }
    if (action === 'ELEVATE') {
        const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nextLevel"])(cityMeta?.level ?? 'OUTPOST');
        return next ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["elevateRequirement"])(next).cost : zero;
    }
    if (action === 'RECRUIT' && params.unit) {
        const price = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitUnitCost"])(state, actor, params.unit), one = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCostWithMetal"])(state, actor, price.cost, price.metal), count = params.count ?? 1;
        return Object.fromEntries(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"].map((key)=>[
                key,
                one[key] * count
            ]));
    }
    if (action === 'RESEARCH' && params.advancementId) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCostWithMetal"])(state, actor, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["advanceCost"])(state, actor, params.advancementId), 0);
    if (action === 'PROMOTE_MOOD') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governCost"])(state, actor);
    if (action === 'CIVIC_ACTION' && cityMeta?.status === 'OCCUPIED') return {
        ...zero,
        influence: state.rules.integrationCost.influence
    };
    return zero;
}
function productionOutput(state, actor, cityId) {
    const yields = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cityYield"])(state, cityId);
    const output = yields.output;
    return {
        output,
        metal: yields.metal,
        capacity: yields.capacity,
        hexes: yields.hexes,
        notes: yields.notes,
        onProduce: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recurringAmounts"])(state, actor, 'ON_PRODUCE', cityId)
    };
}
// Legacy "materials" contributions are summed before the split into Madeira and Pedra, so alone they read as both.
const RESOURCE_LABEL = {
    food: 'Alimentos',
    materials: 'Madeira/Pedra',
    wood: 'Madeira',
    stone: 'Pedra',
    wealth: 'Riqueza',
    knowledge: 'Conhecimento',
    influence: 'Influência',
    culture: 'Cultura',
    metal: 'Metal'
};
const listOf = (pool)=>Object.entries(pool).filter(([, amount])=>amount > 0).map(([key, amount])=>`+${amount} ${RESOURCE_LABEL[key]}`).join(', ');
function option(state, actor, cityId, action, params, effect) {
    return {
        action,
        ...params,
        actionClass: 'MAIN',
        cost: urbanCost(state, actor, cityId, action, params),
        effect,
        blocked: urbanBlock(state, actor, cityId, action, params)
    };
}
function urbanOptions(state, actor) {
    const territory = state.core.config.territory, balance = state.rules.balance;
    const cities = {};
    const owned = state.cities.filter((meta)=>meta.currentOwnerId === actor);
    for (const meta of owned){
        const id = meta.cityId, list = [];
        const occupied = meta.status === 'OCCUPIED';
        const produced = productionOutput(state, actor, id);
        const yields = listOf({
            ...produced.output,
            metal: produced.output.metal + produced.metal
        });
        const extra = listOf(produced.onProduce);
        list.push(option(state, actor, id, 'PRODUCE', {}, `${yields || 'Sem rendimento agora'}${extra ? ` · Bônus da produção: ${extra}` : ''} · Capacidade ${produced.capacity}. Sem esta escolha a cidade não produz.`));
        const higher = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nextLevel"])(meta.level);
        list.push(option(state, actor, id, 'ELEVATE', {}, higher ? `Elevar a ${higher}: Capacidade ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ladderStep"])(higher).capacity}, ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ladderStep"])(higher).slots} vaga(s), suprimento ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ladderStep"])(higher).supplyReach}` : 'Nível máximo'));
        for (const district of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DistrictTypeSchema"].options)list.push(option(state, actor, id, 'BUILD', {
            build: {
                kind: 'DISTRICT',
                district
            }
        }, `Novo distrito${listOf(territory.districts[district].production) ? ` · ${listOf(territory.districts[district].production)}` : ''}`));
        for (const building of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["BuildingTypeSchema"].options)list.push(option(state, actor, id, 'BUILD', {
            build: {
                kind: 'BUILDING',
                building
            }
        }, `Novo edifício${listOf(territory.buildings[building].production) ? ` · ${listOf(territory.buildings[building].production)}` : ''}`));
        list.push(option(state, actor, id, 'BUILD', {
            build: {
                kind: 'MARITIME'
            }
        }, `Distrito Marítimo · Porto incluído · +1 Alimento por Produzir`));
        const next = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["FORTIFICATION_UPGRADES"][__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["FORTIFICATION_UPGRADES"].indexOf(meta.fortification.level) + 1];
        list.push(option(state, actor, id, 'BUILD', {
            build: {
                kind: 'FORTIFICATION'
            }
        }, next ? `Fortificação ${next}` : 'Fortificação máxima'));
        for (const unit of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$catalog$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaUnitClassSchema"].options)list.push(option(state, actor, id, 'RECRUIT', {
            unit
        }, `Força ${state.rules.units[unit].strength} · Movimento ${state.rules.units[unit].movement} · até ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recruitLimit"])(state, actor, id)} peça(s) por ativação`));
        list.push(option(state, actor, id, 'PROMOTE_MOOD', {}, `Governar: +1 Ânimo por nível pago (1 Cultura ou 2 Riqueza), até ${produced.capacity} nível(is); repara 1 passo de fortificação por 1 Pedra`));
        list.push(option(state, actor, id, 'SUPPORT_TRADE', {}, `Renda de rota: +${state.rules.routeIncome + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, actor).routeWealth + webRouteIncome(state, actor)} Riqueza por rota originada`));
        list.push(option(state, actor, id, 'MOVE_CAPITAL', {}, `Mover a capital para cá (${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, actor).moveCapitalOrders} Ordem(ns)); a Administração, a Capacidade da capital e a guarnição acompanham`));
        list.push(option(state, actor, id, 'CIVIC_ACTION', {}, occupied ? `Integração +${balance.integrationPerAction + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["leaderIntegrationBonus"])(state, actor)}%` : `+${balance.civicInfluence} Influência e coesão local`));
        cities[id] = list;
    }
    const firstCity = owned[0]?.cityId;
    const progress = state.players.find((player)=>player.playerId === actor);
    const research = firstCity === undefined ? [] : [
        ...__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"],
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["heritageFor"])(state, actor)
    ].filter((node)=>!progress.research.includes(node.id) && __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(node.era) <= __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(progress.era)).map((node)=>({
            ...option(state, actor, firstCity, 'RESEARCH', {
                advancementId: node.id
            }, 'description' in node ? node.description : `Herança · ${node.effect}`),
            // Research is not tied to one city: the client adds the selected city's own gate (actions left, occupation).
            blocked: (state.phase !== 'PLANNING' ? 'Disponível apenas no Planejamento.' : progress.ready ? 'Suas decisões já estão confirmadas para esta fase.' : (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaActionUsage"])(state, actor).used >= (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaActionUsage"])(state, actor).limit ? 'Sem ações principais disponíveis.' : null) ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["researchBlock"])(state, actor, node.id)
        }));
    return {
        cities,
        research
    };
}
function rejectExtras(command, allowed) {
    for (const key of [
        'build',
        'unit',
        'advancementId',
        'count'
    ]){
        if (command[key] !== undefined && !allowed.includes(key)) throw new Error(`A ação ${command.action} não aceita o parâmetro ${key}.`);
    }
}
function performUrbanAction(state, actor, command) {
    const balance = state.rules.balance;
    const owner = state.core.players.find((player)=>player.id === actor);
    const progress = state.players.find((player)=>player.playerId === actor);
    const meta = state.cities.find((candidate)=>candidate.cityId === command.cityId);
    const city = owner.civilization.cities.find((candidate)=>candidate.id === command.cityId);
    const gate = cityGate(state, actor, command.cityId, command.action);
    if (gate) throw new Error(gate);
    if (!meta || !city) throw new Error('Escolha uma cidade própria.');
    const occupied = meta.status === 'OCCUPIED' || state.occupations.some((occupation)=>occupation.cityId === city.id);
    const blocked = urbanBlock(state, actor, command.cityId, command.action, {
        ...command.build ? {
            build: command.build
        } : {},
        ...command.unit ? {
            unit: command.unit
        } : {},
        ...command.advancementId ? {
            advancementId: command.advancementId
        } : {},
        ...command.count ? {
            count: command.count
        } : {}
    });
    if (blocked) throw new Error(blocked);
    const telemetry = state.telemetry;
    let message = '';
    switch(command.action){
        case 'PRODUCE':
            {
                rejectExtras(command, []);
                const { output, metal } = productionOutput(state, actor, city.id);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, actor, output, {
                    category: 'production'
                });
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyRecurringEffects"])(state, actor, 'ON_PRODUCE', {
                    cityId: city.id
                });
                if (metal > 0) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, actor, {
                    metal
                }, {
                    category: 'mining'
                });
                const kitBonus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitProduceBonus"])(state, actor, city.id);
                if (kitBonus.food || kitBonus.stone) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, actor, {
                    food: kitBonus.food,
                    stone: kitBonus.stone
                }, {
                    category: 'production'
                });
                for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALPHA_RESOURCE_KEYS"])telemetry.productionByResource[key] = (telemetry.productionByResource[key] ?? 0) + output[key];
                telemetry.productionByResource.metal += metal;
                message = `${city.name} produziu recursos${metal > 0 ? ` e ${metal} de Metal` : ''}.`;
                break;
            }
        case 'BUILD':
            {
                rejectExtras(command, [
                    'build'
                ]);
                if (!command.build) throw new Error('Escolha o que construir.');
                if (command.build.kind === 'FORTIFICATION') {
                    const next = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["FORTIFICATION_UPGRADES"][__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["FORTIFICATION_UPGRADES"].indexOf(meta.fortification.level) + 1];
                    if (!next) throw new Error('A cidade já possui a fortificação máxima.');
                    const spec = balance.fortification[next];
                    if (__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(progress.era) < __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$concept$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaEraSchema"].options.indexOf(spec.era)) throw new Error('Sua civilização ainda não alcançou a era exigida.');
                    if (spec.militaryDistrict && !city.districts.some((item)=>item.type === 'MILITARY')) throw new Error('Esta fortificação requer distrito Militar.');
                    const capped = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitFortificationBlock"])(state, actor, next);
                    if (capped) throw new Error(capped);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, actor, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaCostWithMetal"])(state, actor, spec.cost, spec.metal), 'BUILD');
                    meta.fortification = {
                        level: next,
                        state: 'INTACT'
                    };
                    message = `${city.name} recebeu a fortificação ${next}.`;
                } else if (command.build.kind === 'MARITIME') {
                    const blocked = buildBlock(state, actor, city.id, command.build);
                    if (blocked) throw new Error(blocked);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, actor, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$city$2d$ladder$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["districtEntry"])('MARITIME').cost, 'BUILD');
                    // The basic Porto comes with the district: it is not a separate purchase.
                    meta.districts = [
                        ...meta.districts,
                        'MARITIME'
                    ];
                    meta.buildings = [
                        ...meta.buildings.filter((item)=>item !== 'PORT'),
                        'PORT'
                    ];
                    message = `${city.name} concluiu o Distrito Marítimo e seu Porto.`;
                } else {
                    const built = command.build.kind === 'DISTRICT' ? {
                        type: 'BUILD_DISTRICT',
                        playerId: actor,
                        cityId: city.id,
                        district: command.build.district,
                        expectedVersion: state.core.version
                    } : {
                        type: 'BUILD_BUILDING',
                        playerId: actor,
                        cityId: city.id,
                        building: command.build.building,
                        expectedVersion: state.core.version
                    };
                    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$engine$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyCommand"])(state.core, built, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaResourcePayment"])(state, 'BUILD'));
                    if (!result.ok) throw new Error(result.error.message);
                    state.core = result.value;
                    syncCityMetadata(state);
                    message = `${city.name} concluiu uma construção.`;
                }
                break;
            }
        case 'ELEVATE':
            {
                rejectExtras(command, []);
                const level = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["elevateCity"])(state, actor, city.id);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mirrorDevelopment"])(state);
                message = `${city.name} foi elevada a ${level}.`;
                break;
            }
        case 'RECRUIT':
            {
                rejectExtras(command, [
                    'unit',
                    'count'
                ]);
                if (!command.unit) throw new Error('Escolha a peça a recrutar.');
                const count = command.count ?? 1;
                if (count > (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recruitLimit"])(state, actor, city.id)) throw new Error(`Esta ativação recruta no máximo ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recruitLimit"])(state, actor, city.id)} peça(s).`);
                for(let index = 0; index < count; index++){
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recruitUnit"])(state, actor, city.id, command.unit);
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mobilize"])(state, city.id, command.unit);
                }
                telemetry.unitRecruitment[command.unit] = (telemetry.unitRecruitment[command.unit] ?? 0) + count;
                message = count === 1 ? `${city.name} recrutou uma peça.` : `${city.name} recrutou ${count} peças.`;
                break;
            }
        case 'RESEARCH':
            {
                rejectExtras(command, [
                    'advancementId'
                ]);
                if (!command.advancementId) throw new Error('Escolha o avanço a pesquisar.');
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["researchAdvancement"])(state, actor, command.advancementId);
                const domain = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$web$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__WEB_ADVANCES__as__ADVANCEMENTS$3e$__["ADVANCEMENTS"].find((node)=>node.id === command.advancementId)?.domain ?? 'HERITAGE';
                telemetry.researchByDomain[domain] = (telemetry.researchByDomain[domain] ?? 0) + 1;
                message = `${city.name} concluiu uma pesquisa.`;
                break;
            }
        case 'PROMOTE_MOOD':
            {
                rejectExtras(command, []);
                const governed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governCity"])(state, actor, city.id);
                message = `${city.name} foi governada: Ânimo +${governed.moodGained}${governed.repaired ? ', fortificação reparada' : ''}.`;
                break;
            }
        case 'SUPPORT_TRADE':
            {
                rejectExtras(command, []);
                const routes = state.routes.filter((route)=>route.ownerId === actor && route.fromCityId === city.id && !route.suspended);
                if (routes.length === 0) throw new Error('A cidade não origina nenhuma rota comercial ativa.');
                for (const route of routes){
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGainLegacy"])(state, actor, {
                        wealth: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, actor).shakenCitiesProduceNoWealth && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["moodBand"])(meta.mood) === 'SHAKEN' ? 0 : Math.max(0, state.rules.routeIncome + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitRouteIncome"])(state, actor) + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["governmentEffects"])(state, actor).routeWealth + webRouteIncome(state, actor))
                    }, {
                        category: 'trade'
                    });
                    const receiver = state.core.players.find((player)=>player.civilization.cities.some((candidate)=>candidate.id === route.toCityId));
                    if (receiver && receiver.id !== actor) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGainLegacy"])(state, receiver.id, {
                        wealth: state.rules.foreignRouteIncome
                    }, {
                        category: 'trade'
                    });
                }
                message = `${city.name} sustentou ${routes.length} rota(s) comercial(is).`;
                break;
            }
        case 'MOVE_CAPITAL':
            {
                rejectExtras(command, []);
                owner.civilization = {
                    ...owner.civilization,
                    capitalCityId: city.id
                };
                for (const other of state.cities)if (other.currentOwnerId === actor) other.capital = other.cityId === city.id;
                message = `${city.name} é a nova capital.`;
                break;
            }
        case 'CIVIC_ACTION':
            {
                rejectExtras(command, []);
                if (occupied) {
                    const occupation = state.occupations.find((candidate)=>candidate.cityId === city.id && candidate.occupierId === actor);
                    if (occupation && state.core.round <= occupation.sinceRound) throw new Error('A integração fica disponível na rodada seguinte à captura.');
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaPay"])(state, actor, state.rules.integrationCost);
                    meta.integration = Math.min(100, meta.integration + balance.integrationPerAction + (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["leaderIntegrationBonus"])(state, actor));
                    telemetry.cityIntegration += 1;
                    if (meta.integration >= 100) {
                        meta.status = 'OWNED';
                        state.occupations = state.occupations.filter((occupation)=>occupation.cityId !== city.id);
                    }
                    message = `${city.name} avançou na integração (${meta.integration}%).`;
                } else {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGain"])(state, actor, {
                        influence: balance.civicInfluence
                    });
                    meta.localCohesion = Math.min(100, meta.localCohesion + balance.civicCohesion);
                    message = `${city.name} realizou uma ação cívica.`;
                }
                break;
            }
    }
    if (command.action !== 'RESEARCH') {
        meta.urbanActionsUsed += 1;
        // The second activation of the round costs one Ânimo (canon §10).
        if (meta.urbanActionsUsed === 2) meta.mood = Math.max(0, meta.mood - 1);
    }
    telemetry.actionsByType[command.action] = (telemetry.actionsByType[command.action] ?? 0) + 1;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'URBAN_ACTION', message, [
        actor
    ]);
}
}),
"[project]/packages/game-engine/dist/alpha-water.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "harborHex",
    ()=>harborHex,
    "isCoastalCity",
    ()=>isCoastalCity,
    "isLandTerrain",
    ()=>isLandTerrain,
    "isNavigableTerrain",
    ()=>isNavigableTerrain,
    "isNavigableWater",
    ()=>isNavigableWater,
    "waterEdges",
    ()=>waterEdges
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
;
const isNavigableTerrain = (terrain)=>terrain === 'COAST' || terrain === 'SEA';
const isNavigableWater = (tile)=>!!tile && isNavigableTerrain(tile.terrain);
const isLandTerrain = (terrain)=>terrain === 'PLAINS' || terrain === 'FOREST' || terrain === 'HILLS' || terrain === 'MOUNTAINS' || terrain === 'COAST';
const tileOf = (state, id)=>state.core.map.find((tile)=>tile.id === id);
function waterEdges(state, atHexId) {
    const tile = tileOf(state, atHexId);
    if (!tile) return [];
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])(tile).map(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"]).map((id)=>tileOf(state, id)).filter((t)=>isNavigableWater(t)).sort((a, b)=>Number(a.terrain !== 'SEA') - Number(b.terrain !== 'SEA') || a.id.localeCompare(b.id)).map((t)=>t.id);
}
const harborHex = (state, cityHexId)=>waterEdges(state, cityHexId)[0] ?? null;
function isCoastalCity(state, cityId) {
    const city = state.core.players.flatMap((player)=>player.civilization.cities).find((candidate)=>candidate.id === cityId);
    return !!city && harborHex(state, city.hexId) !== null;
}
}),
"[project]/packages/game-engine/dist/alpha-world-audit.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "auditWorld",
    ()=>auditWorld
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-water.js [app-route] (ecmascript)");
;
;
;
/** Region-graph distance from `from` to every region over true hex adjacency. */ function regionDistances(state, from) {
    const owner = new Map();
    for (const region of state.regions)for (const id of region.hexIds)owner.set(id, region.id);
    const next = new Map(state.regions.map((region)=>[
            region.id,
            new Set()
        ]));
    for (const region of state.regions)for (const id of region.hexIds){
        const [q, r] = id.split(',').map(Number);
        for (const point of (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])({
            q,
            r
        })){
            const other = owner.get((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"])(point));
            if (other && other !== region.id) next.get(region.id).add(other);
        }
    }
    const dist = new Map([
        [
            from,
            0
        ]
    ]), queue = [
        from
    ];
    for (const id of queue)for (const n of next.get(id) ?? [])if (!dist.has(n)) {
        dist.set(n, dist.get(id) + 1);
        queue.push(n);
    }
    return dist;
}
function auditWorld(state) {
    const tiles = new Map(state.core.map.map((t)=>[
            t.id,
            t
        ]));
    const issues = [];
    const neighbours = (id)=>{
        const t = tiles.get(id);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])(t).map(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"]).filter((n)=>tiles.has(n));
    };
    const component = (start, test, seen)=>{
        const out = [
            start
        ];
        seen.add(start);
        for(let i = 0; i < out.length; i++)for (const n of neighbours(out[i]))if (!seen.has(n) && test(tiles.get(n).terrain)) {
            seen.add(n);
            out.push(n);
        }
        return out;
    };
    const seaSeen = new Set(), seaBodies = [];
    for (const t of state.core.map)if (t.terrain === 'SEA' && !seaSeen.has(t.id)) seaBodies.push(component(t.id, (x)=>x === 'SEA', seaSeen).length);
    const landSeen = new Set(), landBodies = [];
    for (const t of state.core.map)if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isLandTerrain"])(t.terrain) && !landSeen.has(t.id)) {
        const ids = component(t.id, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isLandTerrain"], landSeen);
        landBodies.push({
            size: ids.length,
            ids: new Set(ids)
        });
    }
    const seaHexes = state.core.map.filter((t)=>t.terrain === 'SEA').length;
    const metalRegions = new Set(state.regions.filter((region)=>region.hexIds.some((id)=>tiles.get(id).features.includes('METAL'))).map((region)=>region.id));
    const patrias = state.players.map((player, slot)=>{
        const home = state.regions.find((region)=>region.templateId === `homeland-${slot + 1}`);
        const capital = state.core.players[slot].civilization.cities[0].hexId;
        const distances = regionDistances(state, home.id);
        const metal = [
            ...metalRegions
        ].map((id)=>distances.get(id)).filter((d)=>d !== undefined);
        const body = landBodies.find((b)=>b.ids.has(capital));
        // The Pátria can reach water when its land mass touches navigable water anywhere (a city there can take the Porto).
        const waterEdge = [
            ...body.ids
        ].some((id)=>tiles.get(id).terrain === 'COAST' || neighbours(id).some((n)=>tiles.get(n).terrain === 'SEA'));
        const others = state.core.players.filter((_, i)=>i !== slot).map((p)=>p.civilization.cities[0].hexId);
        return {
            playerId: player.playerId,
            metalRegionDistance: metal.length ? Math.min(...metal) : null,
            landReach: body.size,
            waterEdge,
            landLinked: others.some((id)=>body.ids.has(id))
        };
    });
    for (const p of patrias){
        if (p.metalRegionDistance === null || p.metalRegionDistance > 2) issues.push(`${p.playerId}: sem metal em até 2 Regiões`);
        if (!p.waterEdge && !p.landLinked) issues.push(`${p.playerId}: isolado (sem borda d'água nem terra até outra Pátria)`);
        if (p.landReach < 12 && !p.waterEdge) issues.push(`${p.playerId}: terra insuficiente`);
    }
    return {
        regions: state.regions.length,
        hexes: state.core.map.length,
        seaHexes,
        seaShare: seaHexes / state.core.map.length,
        largestSea: Math.max(0, ...seaBodies),
        landComponents: landBodies.map((b)=>b.size).sort((a, b)=>b - a),
        patrias,
        issues
    };
}
}),
"[project]/packages/game-engine/dist/alpha-world.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EXPLORE_NEEDS_LAND",
    ()=>EXPLORE_NEEDS_LAND,
    "EXPLORE_NEEDS_NAVAL",
    ()=>EXPLORE_NEEDS_NAVAL,
    "HOMELANDS_PUBLIC",
    ()=>HOMELANDS_PUBLIC,
    "boardView",
    ()=>boardView,
    "createAlphaGame",
    ()=>createAlphaGame,
    "explorationAccess",
    ()=>explorationAccess,
    "exploreRegion",
    ()=>exploreRegion,
    "explorerRole",
    ()=>explorerRole,
    "homeOfRegion",
    ()=>homeOfRegion,
    "refreshKnowledge",
    ()=>refreshKnowledge,
    "regionIsPublic",
    ()=>regionIsPublic,
    "regionOpenFor",
    ()=>regionOpenFor,
    "regionOrientationFixed",
    ()=>regionOrientationFixed,
    "rotatedRegionTiles",
    ()=>rotatedRegionTiles,
    "threatView",
    ()=>threatView,
    "validateExploration",
    ()=>validateExploration,
    "visibleHexIds",
    ()=>visibleHexIds
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-turn.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-topology.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$regions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-regions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-leaders.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha-institutions.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/alpha.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$engine$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/engine.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$presets$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-presets.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-water.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-events.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$migration$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-migration.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-cards.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-random.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-kits.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$discoveries$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-discoveries.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-threats.js [app-route] (ecmascript)");
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
function createAlphaGame(input) {
    if (input.privateSeed !== undefined && !/^[a-f0-9]{64}$/.test(input.privateSeed)) throw new Error('Invalid private alpha seed');
    const random = {
        privateRng: {
            algorithm: 'hmac-sha256-counter-v1',
            seed: input.privateSeed ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["combineAlphaSeed"])(input.seed, input.privateSeed) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["deterministicAlphaSeed"])(input.seed, input.gameId),
            counter: 0
        }
    };
    const mapSizeIn = input.mapSize ?? 'STANDARD';
    const allFrontier = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$regions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REGION_TEMPLATES"].filter((r)=>r.kind === 'FRONTIER');
    // Padrão and Compacto keep the original 24-template shuffle (same RNG draws, same seeded maps); only Amplo needs the extra 13.
    const frontier = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MAP_FOOTPRINT"][mapSizeIn].regions - __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HOME_SLOTS"] <= 24 ? allFrontier.slice(0, 24) : allFrontier;
    for(let i = frontier.length - 1; i > 0; i--){
        const j = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRandomInteger"])(random, i + 1);
        [frontier[i], frontier[j]] = [
            frontier[j],
            frontier[i]
        ];
    }
    // The footprint is generated first as a contiguous lattice of seven-hex Regions (domain alpha-topology): every hex of the board belongs
    // to exactly one Region and nothing inside the outer edge is empty. Six homeland Regions always exist; active seats take their slots first.
    const mapSize = input.mapSize ?? 'STANDARD';
    const board = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["layoutBoard"])(input.players.length, input.seed, mapSize);
    if (frontier.length < board.cells.length - __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$topology$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HOME_SLOTS"]) throw new Error('Not enough frontier Region templates for this footprint');
    const slotOf = new Map(board.homeSlots.map((id, slot)=>[
            id,
            slot
        ]));
    const regions = [];
    const map = [];
    let index = 0;
    const picked = board.cells.map((cell)=>{
        const slot = slotOf.get(cell.id);
        return {
            cell,
            slot,
            template: slot !== undefined ? __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$regions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REGION_TEMPLATES"][slot] : frontier[index++]
        };
    });
    const shape = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$presets$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["worldShape"])(input.worldPreset ?? 'MIXED', input.seed, picked.map(({ cell, template })=>({
            id: cell.id,
            templateId: template.id,
            hexIds: cell.hexes.map(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"])
        })), input.players.length);
    for (const { cell, slot, template } of picked){
        const activeHome = slot !== undefined && slot < input.players.length;
        regions.push({
            id: cell.id,
            templateId: template.id,
            hexIds: cell.hexes.map(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"]),
            rotation: 0,
            revealedBy: activeHome ? [
                __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PlayerIdSchema"].parse(input.players[slot].id)
            ] : []
        });
        const content = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$regions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rotatedRegionContent"])(template, 0);
        cell.hexes.forEach((p, i)=>{
            const terrain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$presets$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["presetTerrain"])(shape, cell.id, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"])(p), content[i]);
            const feature = content[i].feature;
            map.push({
                ...p,
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"])(p),
                terrain,
                features: [
                    ...content[i].deposit && holdsMetal(terrain) ? [
                        'METAL'
                    ] : [],
                    ...feature && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$regions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["featureFits"])(feature, terrain) ? [
                        feature
                    ] : []
                ]
            });
        });
    }
    const tiles = new Map(map.map((t)=>[
            t.id,
            t
        ]));
    // The capital is a real hex of its Pátria. The Pátria is public, so nothing about its position is hidden or bent for privacy: the centre when its terrain
    // can hold a city (it always does in the authored homelands), otherwise a seeded pick among the outer hexes that can, plains first.
    const capitalHex = (slot)=>{
        const cell = board.cells.find((c)=>c.id === board.homeSlots[slot]);
        const eligible = (t)=>[
                'PLAINS',
                'FOREST',
                'HILLS',
                'COAST'
            ].includes(t.terrain);
        const centre = tiles.get((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"])(cell.hexes[0]));
        if (eligible(centre)) return centre.id;
        const options = cell.hexes.slice(1).map((p)=>tiles.get((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"])(p))).filter(eligible);
        const plains = options.filter((t)=>t.terrain === 'PLAINS'), pool = plains.length ? plains : options;
        return pool[(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRandomInteger"])(random, pool.length)].id;
    };
    const capitalSites = input.players.map((_, i)=>capitalHex(i));
    const created = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$engine$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createGame"])({
        gameId: input.gameId,
        seed: input.seed,
        map,
        players: input.players.map((p)=>({
                id: p.id,
                name: p.name,
                resources: {
                    food: 16,
                    materials: 14,
                    wealth: 10,
                    knowledge: 8,
                    influence: 8
                }
            })),
        initialCities: input.players.map((p, i)=>({
                id: `capital-${i + 1}`,
                ownerId: p.id,
                name: (__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CIVILIZATIONS"].find((civ)=>civ.id === p.civilization) ?? __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CIVILIZATIONS"][i]).capital,
                hexId: capitalSites[i],
                workers: {
                    producers: 1,
                    artisans: 0,
                    merchants: 0,
                    scholars: 1,
                    soldiers: 0,
                    unassigned: 0
                }
            }))
    });
    if (!created.ok) throw new Error(created.error.message);
    const migrated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$migration$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["migrateSnapshotV3ToV4"])(created.value);
    if (!migrated.ok) throw new Error(migrated.error.message);
    const state = migrated.value;
    state.rules = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaRules"])(input.preset, input.worldPreset ?? 'MIXED', input.actionsPerRound ?? 5);
    state.rules.revealMap = input.revealMap ?? false;
    state.rules.mapSize = mapSize;
    if (input.startingPioneers !== undefined) state.rules.startingPioneers = input.startingPioneers;
    state.rulesVersion = 'v5.1b';
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["liftLegacyCityCaps"])(state);
    state.regions = regions;
    state.privateRng = random.privateRng;
    state.telemetry.preset = state.rules.worldPreset;
    // Every civilization starts with `startingPioneers` Pioneiros: one can scout while another founds, so first contact does not wait on recruitment.
    state.players.forEach((p, i)=>{
        p.civilization = input.players[i].civilization ?? __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CIVILIZATIONS"][i].id;
        p.leader = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["leaderStateFor"])(p.civilization, input.players[i].figureId);
        if (p.leader === null) throw new Error('Figura inválida para esta civilização.');
        const center = state.core.players[i].civilization.cities[0].hexId;
        for(let k = 0; k < state.rules.startingPioneers; k++)state.units.push({
            id: `pioneer-${i + 1}-${k + 1}`,
            ownerId: p.playerId,
            kind: 'PIONEER',
            hexId: center,
            recruitedRound: 1
        });
        const city = state.cities.find((city)=>city.currentOwnerId === p.playerId);
        city.nativeIdentity = p.civilization;
    });
    const occupied = new Set(state.core.players.flatMap((player)=>player.civilization.cities.map((city)=>city.hexId)));
    const neutral = state.core.map.filter((tile)=>!occupied.has(tile.id) && ![
            'SEA',
            'UNKNOWN'
        ].includes(tile.terrain)).sort((a, b)=>a.id.localeCompare(b.id));
    // Independent peoples sit in contested ground: about as far from a seat's capital as from its nearest rival's, at least
    // 3 hexes from any capital and 4 from each other. 
    const capitals = state.core.players.map((player)=>state.core.map.find((tile)=>tile.id === player.civilization.cities[0].hexId));
    const reach = (tile)=>{
        const distances = capitals.map((capital)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(capital, tile)).sort((a, b)=>a - b);
        return {
            near: distances[0],
            contest: (distances[1] ?? distances[0]) - distances[0]
        };
    };
    const land = neutral.filter((tile)=>reach(tile).near >= 3);
    const pick = (candidates, count, taken)=>{
        const chosen = [];
        for (const tile of candidates){
            if (chosen.length === count) break;
            if ([
                ...taken,
                ...chosen
            ].every((other)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(other, tile) >= 4)) chosen.push(tile);
        }
        return chosen;
    };
    const peoples = pick([
        ...land
    ].sort((a, b)=>reach(a).contest - reach(b).contest || reach(a).near - reach(b).near || a.id.localeCompare(b.id)), 3, []);
    state.independents = peoples.map((tile, index)=>({
            id: `independent-${index + 1}`,
            hexId: tile.id,
            type: [
                'VILLAGE',
                'TOWN',
                'CITY_STATE'
            ][index],
            attitude: 'NEUTRAL',
            influenceByPlayer: {},
            protectorId: null,
            integratedBy: null
        }));
    // The two opening Acampamentos obey the same site rule as every later one (canon §21b: unclaimed, 3–5 hexes from a city, out of sight), not "as far as possible" (E-2).
    state.threats = [];
    for(let index = 0; index < 2; index++)(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["spawnThreat"])(state, 'CAMP');
    state.threats.forEach((threat)=>{
        threat.fresh = false;
    });
    state.telemetry.threatsSpawned = 0;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyCivilizationHeritage"])(state);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["initializeAlphaCards"])(state);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$discoveries$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["generateDiscoveries"])(state);
    refreshKnowledge(state);
    return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlphaStateSchema"].parse(state);
}
const HOMELANDS_PUBLIC = true;
function regionIsPublic(state, region) {
    const home = homeOfRegion(state, region);
    return region.revealedBy.some((id)=>id !== home) || HOMELANDS_PUBLIC && region.revealedBy.length > 0;
}
const regionOpenFor = (state, region, actor)=>regionIsPublic(state, region) || homeOfRegion(state, region) === actor || region.revealedBy.includes(actor);
function visibleHexIds(state, actor) {
    const out = new Set(), inRegion = new Set();
    for (const region of state.regions){
        for (const id of region.hexIds)inRegion.add(id);
        if (regionOpenFor(state, region, actor)) for (const id of region.hexIds)out.add(id);
    }
    for (const tile of state.core.map)if (!inRegion.has(tile.id) || tile.ownerId === actor) out.add(tile.id);
    for (const unit of state.units)if (unit.ownerId === actor) out.add(unit.hexId);
    for (const owner of state.core.players)if (owner.id === actor) for (const city of owner.civilization.cities)out.add(city.hexId);
    return out;
}
function refreshKnowledge(state) {
    const tiles = new Map(state.core.map.map((t)=>[
            t.id,
            t
        ]));
    const piecesOf = (id)=>[
            ...state.core.players.find((p)=>p.id === id).civilization.cities.map((c)=>c.hexId),
            ...state.units.filter((u)=>u.ownerId === id && !u.carrierId).map((u)=>u.hexId)
        ];
    for (const player of state.players){
        player.knownHexIds = [
            ...visibleHexIds(state, player.playerId)
        ].map((id)=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HexIdSchema"].parse(id)).sort();
        const mine = piecesOf(player.playerId).map((id)=>tiles.get(id)).filter(Boolean);
        for (const other of state.core.players){
            if (other.id === player.playerId) continue;
            const theirs = piecesOf(other.id).map((id)=>tiles.get(id)).filter(Boolean);
            const close = theirs.some((t)=>t.ownerId === player.playerId || mine.some((m)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(m, t) <= 1)) || mine.some((m)=>m.ownerId === other.id);
            if (!close) continue;
            if (!player.contacts.includes(other.id)) player.contacts.push(other.id);
            const opposite = state.players.find((p)=>p.playerId === other.id);
            if (!opposite.contacts.includes(player.playerId)) opposite.contacts.push(player.playerId);
        }
    }
}
function regionOrientationFixed(state, region) {
    return region.revealedBy.length > 0 || region.hexIds.some((id)=>state.core.map.find((t)=>t.id === id)?.ownerId !== null || state.units.some((u)=>u.hexId === id));
}
function explorerRole(state, unit) {
    if (unit.carrierId) return null;
    if (unit.kind === 'PIONEER') return 'LAND';
    const domain = state.rules.units[unit.kind].domain;
    return (unit.kind === 'FLEET' || unit.kind === 'COASTAL_VESSEL') && domain !== 'LAND' ? 'NAVAL' : null;
}
const EXPLORE_NEEDS_NAVAL = 'Requer acesso naval.';
const EXPLORE_NEEDS_LAND = 'Requer acesso por terra.';
function explorationAccess(state, unit, region) {
    const role = explorerRole(state, unit), blocked = role === 'NAVAL' ? EXPLORE_NEEDS_LAND : EXPLORE_NEEDS_NAVAL;
    if (role === null) return {
        rotations: [],
        block: 'Esta peça não explora.'
    };
    // A seat-redacted copy (bots) hides the Region template: the caller reads the real match for this answer, here nothing can be computed.
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$regions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REGION_TEMPLATES"].some((t)=>t.id === region.templateId)) return {
        rotations: [
            0
        ],
        block: null
    };
    const origin = state.core.map.find((t)=>t.id === unit.hexId), reach = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitExplorationReach"])(state, unit), enters = role === 'LAND' ? __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isLandTerrain"] : __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isNavigableTerrain"];
    const entry = region.hexIds.map((id, i)=>({
            id,
            i,
            tile: state.core.map.find((t)=>t.id === id)
        })).filter((x)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(origin, x.tile) <= reach);
    if (!entry.length) return {
        rotations: [],
        block: 'A região não está na fronteira desta peça.'
    };
    if (regionOrientationFixed(state, region)) {
        const ok = entry.some((x)=>enters(x.tile.terrain));
        return {
            rotations: ok ? [
                region.rotation
            ] : [],
            block: ok ? null : blocked
        };
    }
    const observed = new Set(state.players.flatMap((p)=>[
            ...p.knownHexIds,
            ...visibleHexIds(state, p.playerId)
        ]));
    const rotations = [
        0,
        1,
        2,
        3,
        4,
        5
    ].filter((rotation)=>{
        const tiles = rotatedRegionTiles(state, region, rotation);
        const keepsKnown = region.hexIds.every((id, i)=>{
            if (!observed.has(id)) return true;
            const tile = state.core.map.find((t)=>t.id === id);
            return tile.terrain === tiles[i].terrain && tile.features.join() === tiles[i].features.join();
        });
        return keepsKnown && entry.some((x)=>enters(tiles[x.i].terrain));
    });
    return {
        rotations,
        block: rotations.length ? null : blocked
    };
}
function validateExploration(state, actor, order) {
    const unit = state.units.find((u)=>u.id === order.unitId && u.ownerId === actor);
    const region = state.regions.find((r)=>r.hexIds.includes(order.target));
    if (!unit || !region || regionOpenFor(state, region, actor)) throw new Error('Escolha uma peça própria junto a uma região ainda não explorada.');
    if (explorerRole(state, unit) === null) throw new Error('Somente Pioneiros e Frotas exploram.');
    const access = explorationAccess(state, unit, region);
    if (access.block !== null) throw new Error(access.block);
    if (!regionOrientationFixed(state, region) && access.rotations.length > 1 && !access.rotations.includes(order.rotation)) throw new Error('Essa orientação não dá acesso à região.');
}
const holdsMetal = (terrain)=>terrain === 'HILLS' || terrain === 'MOUNTAINS';
function rotatedRegionTiles(state, region, rotation) {
    const template = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$regions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REGION_TEMPLATES"].find((r)=>r.id === region.templateId);
    const after = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$regions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rotatedRegionContent"])(template, rotation);
    const shape = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$presets$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["worldShape"])(state.rules.worldPreset, state.telemetry.seed, state.regions, state.players.length);
    return region.hexIds.map((id, i)=>{
        const tile = state.core.map.find((t)=>t.id === id);
        const terrain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$presets$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["presetTerrain"])(shape, region.id, id, after[i]);
        const authored = new Set([
            'METAL',
            'FISH',
            'TIMBER',
            'FERTILE',
            'STONE'
        ]), feature = after[i].feature;
        return {
            terrain,
            features: [
                ...tile.features.filter((item)=>!authored.has(item)),
                ...after[i].deposit && holdsMetal(terrain) ? [
                    'METAL'
                ] : [],
                ...feature && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$regions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["featureFits"])(feature, terrain) ? [
                    feature
                ] : []
            ]
        };
    });
}
function exploreRegion(state, actor, order) {
    // Orders are planned in secret and resolved in turn: if an earlier order already flipped this Region, the table has it and this one only notes that.
    const already = state.regions.find((r)=>r.hexIds.includes(order.target));
    if (already && state.units.some((u)=>u.id === order.unitId && u.ownerId === actor) && regionOpenFor(state, already, actor)) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'REGION_ALREADY_OPEN', 'A Região já tinha sido revelada por outra civilização.', [
            actor
        ]);
        return;
    }
    validateExploration(state, actor, order);
    const region = state.regions.find((r)=>r.hexIds.includes(order.target));
    const fixed = regionOrientationFixed(state, region), access = explorationAccess(state, state.units.find((u)=>u.id === order.unitId), region), rotation = fixed ? region.rotation : access.rotations.length === 1 ? access.rotations[0] : order.rotation;
    if (!fixed) {
        const rotated = rotatedRegionTiles(state, region, rotation);
        region.hexIds.forEach((id, i)=>{
            const tile = state.core.map.find((t)=>t.id === id);
            tile.terrain = rotated[i].terrain;
            tile.features = rotated[i].features;
        });
    }
    region.rotation = rotation;
    if (!region.revealedBy.includes(actor)) region.revealedBy.push(actor);
    const player = state.players.find((p)=>p.playerId === actor);
    player.knownHexIds = [
        ...new Set([
            ...player.knownHexIds,
            ...region.hexIds
        ])
    ].sort();
    player.exploredRegions++;
    player.prestige++;
    const knowledge = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["kitExplorationKnowledge"])(state, actor, region.hexIds);
    if (knowledge) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaGainLegacy"])(state, actor, {
        knowledge
    });
    refreshKnowledge(state);
    const template = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$alpha$2d$regions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REGION_TEMPLATES"].find((t)=>t.id === region.templateId);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$events$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["alphaEvent"])(state, 'REGION_REVEALED', `${state.core.players.find((p)=>p.id === actor)?.name ?? 'Uma civilização'} revelou ${template?.name ?? 'uma Região'}.`, null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$discoveries$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyDiscovery"])(state, actor, region, order.unitId);
}
function threatView(state, actor) {
    const visible = visibleHexIds(state, actor), all = state.rules.revealMap;
    return state.threats.filter((threat)=>visible.has(threat.hexId) || all).map((threat)=>{
        const intent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["threatIntent"])(state, threat), known = intent.targetHexId !== null && (all || visible.has(intent.targetHexId));
        return {
            id: threat.id,
            kind: threat.kind,
            hexId: threat.hexId,
            level: threat.level,
            status: threat.status,
            composition: threat.composition,
            fresh: threat.fresh,
            intent: {
                state: intent.state,
                targetKind: intent.targetKind,
                targetKnown: known,
                targetId: known ? intent.targetId : null,
                targetHexId: known ? intent.targetHexId : null,
                distance: known ? intent.distance : null,
                nextHexId: intent.nextHexId !== null && (all || visible.has(intent.nextHexId)) ? intent.nextHexId : null
            }
        };
    });
}
function homeOfRegion(state, region) {
    const match = /^homeland-(\d+)$/.exec(region.templateId);
    return match ? state.players[Number(match[1]) - 1]?.playerId ?? null : null;
}
function boardView(state, actor) {
    const owner = new Map();
    for (const region of state.regions)for (const id of region.hexIds)owner.set(id, region.id);
    return state.regions.map((region)=>{
        const next = new Set();
        for (const id of region.hexIds){
            const [q, r] = id.split(',').map(Number);
            for (const point of (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexNeighbors"])({
                q,
                r
            })){
                const other = owner.get((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexId"])(point));
                if (other && other !== region.id) next.add(other);
            }
        }
        return {
            id: region.id,
            hexIds: region.hexIds,
            neighbors: [
                ...next
            ].sort(),
            closed: !regionOpenFor(state, region, actor),
            homeOf: homeOfRegion(state, region)
        };
    });
}
}),
"[project]/packages/game-engine/dist/arithmetic.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "multiply",
    ()=>multiply,
    "percent",
    ()=>percent,
    "safeInteger",
    ()=>safeInteger,
    "sum",
    ()=>sum
]);
function safeInteger(value) {
    const result = typeof value === 'bigint' ? Number(value) : value;
    if (!Number.isSafeInteger(result)) throw new RangeError('Game arithmetic exceeds safe integer range');
    return result;
}
const sum = (values)=>safeInteger(values.reduce((total, value)=>total + BigInt(value), 0n));
const multiply = (a, b)=>safeInteger(BigInt(a) * BigInt(b));
const percent = (value, rate)=>safeInteger(BigInt(value) * BigInt(rate) / 100n);
}),
"[project]/packages/game-engine/dist/civilization.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "commandPoints",
    ()=>commandPoints,
    "deriveAdministration",
    ()=>deriveAdministration,
    "deriveCityProduction",
    ()=>deriveCityProduction,
    "governmentModifiers",
    ()=>governmentModifiers,
    "governmentStabilityDelta",
    ()=>governmentStabilityDelta,
    "populationCap",
    ()=>populationCap,
    "refreshAdministration",
    ()=>refreshAdministration,
    "totalProduction",
    ()=>totalProduction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/arithmetic.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/urban.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$economy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/economy.js [app-route] (ecmascript)");
;
;
;
;
;
;
function populationCap(city, rules) {
    const cap = rules.developmentPopulationCaps[city.development - 1];
    if (cap === undefined) throw new RangeError('Unknown development level');
    return cap;
}
const governmentModifiers = (civilization, rules)=>rules.governmentModifiers[civilization.government];
const commandPoints = (civilization, rules)=>Math.max(0, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
        rules.baseCommandPoints,
        governmentModifiers(civilization, rules).commandPointsDelta
    ]));
function deriveAdministration(civilization, rules, map = []) {
    const policy = rules.administrativeRules;
    const government = governmentModifiers(civilization, rules);
    const capacity = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
        policy.baseCapacity,
        government.capacityFlat,
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["multiply"])(civilization.cities.length, government.capacityPerCity),
        ...civilization.cities.map((city)=>city.specialization === null ? 0 : rules.specializationModifiers[city.specialization].administrativeCapacity),
        ...civilization.cities.map((city)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["infrastructureStats"])(city, rules).administrativeCapacity),
        -(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["multiply"])(civilization.cities.filter((city)=>city.stability < government.unstableBelow).length, government.unstableCityCapacityPenalty)
    ]);
    const administrativeCapacity = Math.max(0, capacity);
    const administrativeLoad = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
        Math.floor(map.filter((tile)=>tile.ownerId === civilization.ownerId).length / rules.territory.controlledHexesPerLoad),
        ...civilization.cities.map((city)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
                policy.loadPerCity,
                Math.floor((city.development - 1) / policy.developmentStep),
                Math.floor(city.population / policy.populationStep)
            ]))
    ]);
    return {
        administrativeCapacity,
        administrativeLoad,
        administrationStatus: administrativeLoad > administrativeCapacity ? 'OVEREXTENDED' : 'WITHIN_CAPACITY'
    };
}
const refreshAdministration = (civilization, rules, map = [])=>({
        ...civilization,
        ...deriveAdministration(civilization, rules, map)
    });
function governmentStabilityDelta(city, civilization, rules) {
    const government = governmentModifiers(civilization, rules);
    const capital = civilization.cities.find((candidate)=>candidate.id === civilization.capitalCityId);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
        government.globalStability,
        city.id === civilization.capitalCityId ? government.capitalStability : 0,
        city.development >= government.developedMinLevel ? government.developedCityStability : 0,
        civilization.cities.length >= government.multiCityMinimum ? government.multiCityStability : 0,
        capital !== undefined && capital.stability < government.capitalCrisisBelow ? -government.capitalCrisisPenalty : 0
    ]);
}
function deriveCityProduction(city, civilization, rules, map = []) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$economy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["deriveCityProductionBreakdown"])(city, civilization, rules, map).total;
}
function totalProduction(civilization, rules, map = []) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$economy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sumProduction"])(civilization.cities.map((city)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$economy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["deriveCityProductionBreakdown"])(city, civilization, rules, map)));
}
}),
"[project]/packages/game-engine/dist/economy.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deriveCityProductionBreakdown",
    ()=>deriveCityProductionBreakdown,
    "sumProduction",
    ()=>sumProduction,
    "tileYieldBreakdown",
    ()=>tileYieldBreakdown
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/arithmetic.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$stability$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/stability.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/urban.js [app-route] (ecmascript)");
;
;
;
;
function tileYieldBreakdown(tile, rules) {
    const terrain = {
        ...rules.territory.terrainYields[tile.terrain]
    };
    const feature = {
        food: 0,
        materials: 0,
        wealth: 0
    };
    const improvement = tile.improvement === null ? {
        ...feature
    } : {
        ...rules.territory.improvementCatalog[tile.improvement].yield
    };
    for (const entry of tile.features)for (const key of [
        'food',
        'materials',
        'wealth'
    ])feature[key] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
        feature[key],
        rules.territory.featureCatalog[entry].yield[key]
    ]);
    return {
        terrain,
        feature,
        improvement,
        total: {
            food: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
                terrain.food,
                feature.food,
                improvement.food
            ]),
            materials: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
                terrain.materials,
                feature.materials,
                improvement.materials
            ]),
            wealth: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
                terrain.wealth,
                feature.wealth,
                improvement.wealth
            ])
        }
    };
}
function deriveCityProductionBreakdown(city, civilization, rules, map = []) {
    const sources = [];
    const total = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyResourcePool"])();
    const add = (source, delta)=>{
        for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RESOURCE_KEYS"])total[key] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
            total[key],
            delta[key]
        ]);
        sources.push({
            source,
            delta
        });
    };
    add('population', {
        food: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["multiply"])(city.workers.producers - city.workedHexIds.length, rules.productionPerWorker.producers),
        materials: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["multiply"])(city.workers.artisans, rules.productionPerWorker.artisans),
        wealth: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["multiply"])(city.workers.merchants, rules.productionPerWorker.merchants),
        knowledge: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["multiply"])(city.workers.scholars, rules.productionPerWorker.scholars),
        influence: 0
    });
    const tiles = city.workedHexIds.map((id)=>{
        const tile = map.find((tile)=>tile.id === id);
        if (!tile) throw new RangeError('Worked tile missing from production map');
        return tileYieldBreakdown(tile, rules);
    });
    for (const source of [
        'terrain',
        'feature',
        'improvement'
    ]){
        const delta = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyResourcePool"])();
        for (const tile of tiles)for (const key of [
            'food',
            'materials',
            'wealth'
        ])delta[key] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
            delta[key],
            tile[source][key]
        ]);
        add(source, delta);
    }
    const districts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyResourcePool"])();
    const buildings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyResourcePool"])();
    const specialization = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyResourcePool"])();
    for (const district of city.districts){
        const entry = rules.territory.districts[district.type];
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["workerActive"])(city, entry.workerRequirement)) for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RESOURCE_KEYS"]){
            districts[key] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
                districts[key],
                entry.production[key]
            ]);
            if (city.specialization === district.type) specialization[key] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
                specialization[key],
                entry.specializationBonus[key]
            ]);
        }
    }
    for (const building of city.buildings){
        const entry = rules.territory.buildings[building.type];
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["workerActive"])(city, entry.workerRequirement)) for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RESOURCE_KEYS"])buildings[key] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
            buildings[key],
            entry.production[key]
        ]);
    }
    add('district', districts);
    add('building', buildings);
    if (city.specialization !== null) {
        const spec = rules.specializationModifiers[city.specialization];
        specialization.food = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
            specialization.food,
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["multiply"])(city.workers.producers, spec.producerBonus)
        ]);
        specialization.materials = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
            specialization.materials,
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["multiply"])(city.workers.artisans, spec.artisanBonus)
        ]);
        specialization.wealth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
            specialization.wealth,
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["multiply"])(city.workers.merchants, spec.merchantBonus)
        ]);
        specialization.knowledge = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
            specialization.knowledge,
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["multiply"])(city.workers.scholars, spec.scholarBonus)
        ]);
    }
    add('specialization', specialization);
    const government = rules.governmentModifiers[civilization.government];
    add('government', {
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyResourcePool"])(),
        wealth: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["percent"])(total.wealth, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
            100,
            government.wealthBonusPercent,
            city.specialization === 'COMMERCIAL' ? government.commercialWealthBonusPercent : 0
        ])) - total.wealth
    });
    const stability = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyResourcePool"])();
    const rate = rules.stabilityProductionPercent[(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$stability$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stabilityCategory"])(city.stability, rules)];
    for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RESOURCE_KEYS"])stability[key] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["percent"])(total[key], rate) - total[key];
    add('stability', stability);
    return {
        cityId: city.id,
        workedHexIds: [
            ...city.workedHexIds
        ],
        sources,
        total
    };
}
function sumProduction(cities) {
    const total = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyResourcePool"])();
    for (const city of cities)for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RESOURCE_KEYS"])total[key] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
        total[key],
        city.total[key]
    ]);
    return total;
}
}),
"[project]/packages/game-engine/dist/engine.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "advancePhase",
    ()=>advancePhase,
    "applyCommand",
    ()=>applyCommand,
    "createGame",
    ()=>createGame,
    "nextPhase",
    ()=>nextPhase,
    "submitOrder",
    ()=>submitOrder
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/model.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$rules$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/rules.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared/dist/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/civilization.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$maintenance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/maintenance.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$management$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/management.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$territory$2d$commands$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/territory-commands.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/resources.js [app-route] (ecmascript)");
;
;
;
;
;
;
;
const nextPhases = {
    MAINTENANCE: 'PLANNING',
    PLANNING: 'RESOLUTION',
    RESOLUTION: 'REACTION',
    REACTION: 'END_ROUND',
    END_ROUND: 'MAINTENANCE'
};
const nextPhase = (phase)=>nextPhases[phase];
function createGame(input) {
    const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CreateGameInputSchema"].safeParse(input);
    if (!parsed.success) {
        const countError = parsed.error.issues.some((issue)=>issue.path[0] === 'players' && issue.path.length === 1 && (issue.code === 'too_small' || issue.code === 'too_big'));
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: countError ? 'INVALID_PLAYER_COUNT' : 'INVALID_INPUT',
            message: parsed.error.message
        });
    }
    const data = parsed.data;
    const config = data.config ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$rules$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createDefaultRules"])();
    if (data.initialCities?.some((city)=>!data.players.some((player)=>player.id === city.ownerId))) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'INVALID_INPUT',
        message: 'Initial city owner is not in game'
    });
    try {
        const state = {
            schemaVersion: 3,
            gameId: data.gameId,
            version: 0,
            seed: data.seed,
            rng: {
                algorithm: 'mulberry32-v1',
                state: data.seed
            },
            status: 'ACTIVE',
            playerCount: data.players.length,
            players: data.players.map((player, index)=>{
                const cities = (data.initialCities ?? []).filter((city)=>city.ownerId === player.id).map((city)=>({
                        ...city,
                        population: city.population ?? config.initialPopulation,
                        workers: city.workers ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unassignedPopulation"])(city.population ?? config.initialPopulation),
                        stability: config.initialStability,
                        development: 1,
                        specialization: null,
                        growthProgress: 0,
                        foundedRound: 1,
                        workedHexIds: [],
                        districts: [],
                        buildings: []
                    }));
                return {
                    ...player,
                    resources: player.resources ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyResourcePool"])(),
                    civilization: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["refreshAdministration"])({
                        id: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CivilizationIdSchema"].parse(`civilization-${index + 1}`),
                        ownerId: player.id,
                        cities,
                        capitalCityId: cities[0]?.id ?? null,
                        government: 'PROTO_GOVERNANCE',
                        administrativeCapacity: 0,
                        administrativeLoad: 0,
                        administrationStatus: 'WITHIN_CAPACITY'
                    }, config)
                };
            }),
            map: data.map ?? [],
            round: 1,
            era: 'FOUNDATION',
            phase: 'MAINTENANCE',
            config,
            pendingOrders: Object.fromEntries(data.players.map((player)=>[
                    player.id,
                    []
                ])),
            eventLog: [
                {
                    type: 'GAME_CREATED',
                    version: 0,
                    round: 1
                }
            ]
        };
        for (const player of state.players)for (const city of player.civilization.cities){
            const center = state.map.find((tile)=>tile.id === city.hexId);
            if (center) {
                if (center.ownerId !== null && center.ownerId !== player.id || center.controllerCityId !== null && center.controllerCityId !== city.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                    code: 'INVALID_INPUT',
                    message: 'Initial city conflicts with existing territory'
                });
                center.ownerId = player.id;
                center.controllerCityId = city.id;
            }
        }
        state.players = state.players.map((player)=>({
                ...player,
                civilization: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["refreshAdministration"])(player.civilization, config, state.map)
            }));
        const validated = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GameStateSchema"].safeParse(state);
        return validated.success ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(validated.data) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'INVALID_INPUT',
            message: validated.error.message
        });
    } catch (error) {
        if (error instanceof RangeError) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'NUMERIC_OVERFLOW',
            message: error.message
        });
        throw error;
    }
}
function applyCommand(state, input, pay = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["payLegacyResources"]) {
    const validated = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GameStateSchema"].safeParse(state);
    if (!validated.success) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'INVALID_STATE',
        message: validated.error.message
    });
    const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GameCommandSchema"].safeParse(input);
    if (!parsed.success) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'INVALID_INPUT',
        message: parsed.error.message
    });
    const command = parsed.data;
    const current = validated.data; // Zod gives an independent snapshot; caller-owned values are never mutated.
    if (current.status !== 'ACTIVE') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'NOT_ACTIVE',
        message: 'Game is not active'
    });
    if (command.expectedVersion !== current.version) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'VERSION_CONFLICT',
        message: 'Reload the current state before retrying'
    });
    if (current.version === Number.MAX_SAFE_INTEGER) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'INVALID_STATE',
        message: 'Version overflow'
    });
    const version = current.version + 1;
    const events = [];
    try {
        let event;
        if (command.type === 'SUBMIT_ORDER') {
            if (current.phase !== 'PLANNING') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'WRONG_PHASE',
                message: 'Orders are accepted only in PLANNING'
            });
            const order = command.order;
            if (!current.players.some((player)=>player.id === order.playerId)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'UNKNOWN_PLAYER',
                message: 'Player is not in this game'
            });
            if (order.targetHexId !== undefined && !current.map.some((hex)=>hex.id === order.targetHexId)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'UNKNOWN_HEX',
                message: 'Target is not in the map'
            });
            if (Object.values(current.pendingOrders).some((orders)=>orders.some((existing)=>existing.id === order.id))) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'DUPLICATE_ORDER',
                message: 'Order ID is already used in this round'
            });
            current.pendingOrders[order.playerId] = [
                ...current.pendingOrders[order.playerId] ?? [],
                order
            ];
            event = {
                type: 'ORDER_SUBMITTED',
                version,
                round: current.round,
                order
            };
        } else if (command.type === 'ADVANCE_PHASE') {
            if (nextPhase(current.phase) !== command.nextPhase) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'INVALID_PHASE_TRANSITION',
                message: `Expected ${nextPhase(current.phase)}`
            });
            const from = current.phase;
            if (from === 'MAINTENANCE') {
                current.players = current.players.map((player)=>{
                    const maintenance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$maintenance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["maintainPlayer"])(player, current.config, current.round, version, current.map);
                    events.push(...maintenance.events);
                    return maintenance.player;
                });
            }
            if (from === 'END_ROUND') {
                if (current.round === Number.MAX_SAFE_INTEGER) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                    code: 'INVALID_STATE',
                    message: 'Round overflow'
                });
                current.round += 1;
                current.pendingOrders = Object.fromEntries(current.players.map((player)=>[
                        player.id,
                        []
                    ]));
            }
            current.phase = command.nextPhase;
            event = {
                type: 'PHASE_ADVANCED',
                version,
                round: current.round,
                from,
                to: command.nextPhase
            };
        } else if (command.type === 'CLAIM_HEX' || command.type === 'ASSIGN_WORKED_HEXES' || command.type === 'IMPROVE_HEX' || command.type === 'FOUND_CITY' || command.type === 'BUILD_DISTRICT' || command.type === 'BUILD_BUILDING') {
            const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$territory$2d$commands$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyTerritoryCommand"])(current, command, version, pay);
            if (!result.ok) return result;
            current.map = result.value.map;
            current.players = current.players.map((player)=>player.id === result.value.player.id ? result.value.player : player);
            event = result.value.event;
        } else {
            const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$management$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["manageCivilization"])(current, command, version, pay);
            if (!result.ok) return result;
            current.players = current.players.map((player)=>player.id === result.value.player.id ? result.value.player : player);
            event = result.value.event;
        }
        current.players = current.players.map((player)=>({
                ...player,
                civilization: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["refreshAdministration"])(player.civilization, current.config, current.map)
            }));
        const output = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GameStateSchema"].safeParse({
            ...current,
            version,
            eventLog: [
                ...current.eventLog,
                ...events,
                event
            ]
        });
        return output.success ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(output.data) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'INVALID_STATE',
            message: output.error.message
        });
    } catch (error) {
        if (error instanceof RangeError) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'NUMERIC_OVERFLOW',
            message: error.message
        });
        throw error;
    }
}
const submitOrder = (state, order, expectedVersion)=>applyCommand(state, {
        type: 'SUBMIT_ORDER',
        expectedVersion,
        order
    });
const advancePhase = (state, phase, expectedVersion)=>applyCommand(state, {
        type: 'ADVANCE_PHASE',
        expectedVersion,
        nextPhase: phase
    });
}),
"[project]/packages/game-engine/dist/founding.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "foundCityAt",
    ()=>foundCityAt
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared/dist/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/resources.js [app-route] (ecmascript)");
;
;
;
;
function foundCityAt(state, player, map, command, version, pay = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["payLegacyResources"]) {
    const tile = map.find((t)=>t.id === command.hexId), rules = state.config.territory;
    if (!tile) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'UNKNOWN_HEX',
        message: 'Unknown hex'
    });
    const cities = state.players.flatMap((p)=>p.civilization.cities);
    if (cities.some((c)=>c.id === command.cityId)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'DUPLICATE_CITY',
        message: 'City ID already exists'
    });
    if (!rules.foundingTerrains.includes(tile.terrain) || cities.some((c)=>c.hexId === tile.id || c.workedHexIds.includes(tile.id))) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'INVALID_CITY_SITE',
        message: 'Site must be valid land, unoccupied and not currently worked'
    });
    if (cities.some((c)=>{
        const center = map.find((t)=>t.id === c.hexId);
        return center !== undefined && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(center, tile) < rules.minimumCityDistance;
    })) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'CITY_TOO_CLOSE',
        message: 'City is closer than minimumCityDistance'
    });
    if (!pay(player, rules.foundingCost)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'INSUFFICIENT_RESOURCES',
        message: 'Cannot afford configured cost'
    });
    player.civilization.cities.push({
        id: command.cityId,
        ownerId: player.id,
        hexId: tile.id,
        name: command.name,
        population: rules.foundingPopulation,
        workers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unassignedPopulation"])(rules.foundingPopulation),
        stability: rules.foundingStability,
        development: 1,
        specialization: null,
        growthProgress: 0,
        foundedRound: state.round,
        workedHexIds: [],
        districts: [],
        buildings: []
    });
    tile.ownerId = player.id;
    tile.controllerCityId = command.cityId;
    if (player.civilization.capitalCityId === null) player.civilization.capitalCityId = command.cityId;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])({
        type: 'CITY_FOUNDED',
        playerId: player.id,
        cityId: command.cityId,
        hexId: tile.id,
        name: command.name,
        cost: rules.foundingCost,
        round: state.round,
        version
    });
}
}),
"[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "hexDistance",
    ()=>hexDistance,
    "hexId",
    ()=>hexId,
    "hexNeighbors",
    ()=>hexNeighbors
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2d$invariants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/territory-invariants.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-route] (ecmascript)");
;
function hexId({ q, r }) {
    if (!Number.isSafeInteger(q) || !Number.isSafeInteger(r)) throw new RangeError('Hex coordinates must be safe integers');
    return __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HexIdSchema"].parse(`${q},${r}`);
}
function hexNeighbors({ q, r }) {
    return [
        {
            q: q + 1,
            r
        },
        {
            q: q + 1,
            r: r - 1
        },
        {
            q,
            r: r - 1
        },
        {
            q: q - 1,
            r
        },
        {
            q: q - 1,
            r: r + 1
        },
        {
            q,
            r: r + 1
        }
    ];
}
function hexDistance(a, b) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2d$invariants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["axialDistance"])(a, b);
}
}),
"[project]/packages/game-engine/dist/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$engine$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/engine.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$random$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/random.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/civilization.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$economy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/economy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/urban.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$migration$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/migration.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$maintenance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/maintenance.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$migration$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-migration.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-turn.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$actions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-actions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$military$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-military.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-world.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$institutions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-institutions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$diplomacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-diplomacy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-cards.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$legacy$2d$works$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-legacy-works.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$hegemony$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-hegemony.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$cities$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-cities.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$culture$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-culture.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$independents$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-independents.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-urban.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$city$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-city.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$phases$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-phases.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$leaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-leaders.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$combat$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-combat.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$stack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-stack.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$unit$2d$options$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-unit-options.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$messages$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-messages.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$trade$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-trade.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$growth$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-growth.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$naval$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-naval.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$shock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-shock.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$kits$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-kits.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$era$2d$turn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-era-turn.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$government$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-government.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$resonance$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-resonance.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$threats$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-threats.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$discoveries$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-discoveries.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$telemetry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-telemetry.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$scenario$2d$contact$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-scenario-contact.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$world$2d$audit$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-world-audit.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$presets$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-presets.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$alpha$2d$water$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/alpha-water.js [app-route] (ecmascript)");
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
;
}),
"[project]/packages/game-engine/dist/maintenance.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "maintainPlayer",
    ()=>maintainPlayer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/civilization.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$stability$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/stability.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/arithmetic.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$economy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/economy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/urban.js [app-route] (ecmascript)");
;
;
;
;
function maintainPlayer(player, rules, round, version, map = []) {
    const base = {
        playerId: player.id,
        round,
        version
    };
    const events = [];
    const breakdowns = player.civilization.cities.map((city)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$economy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["deriveCityProductionBreakdown"])(city, player.civilization, rules, map));
    const gross = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$economy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sumProduction"])(breakdowns);
    const production = {
        ...gross
    };
    const resources = {
        ...player.resources
    };
    for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RESOURCE_KEYS"])resources[key] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
        resources[key],
        production[key]
    ]);
    const required = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["multiply"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])(player.civilization.cities.map((city)=>city.population)), rules.foodPerPopulation);
    const paid = Math.min(required, resources.food);
    resources.food -= paid;
    const shortage = paid < required;
    if (shortage) events.push({
        ...base,
        type: 'FOOD_SHORTAGE',
        required,
        paid,
        deficit: required - paid
    });
    // Only NEW net food production earns growth; stockpiles cannot be counted repeatedly.
    const surplus = shortage ? 0 : Math.max(0, production.food - required);
    const eligible = player.civilization.cities.filter((city)=>city.population < (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["populationCap"])(city, rules)).map((city)=>city.id).sort();
    const shares = new Map(eligible.map((id, index)=>[
            id,
            Math.floor(surplus / eligible.length) + (index < surplus % eligible.length ? 1 : 0)
        ]));
    let cities = player.civilization.cities.map((city)=>{
        if (shortage || city.population >= (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["populationCap"])(city, rules)) return {
            ...city,
            workers: {
                ...city.workers
            }
        };
        const progress = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
            city.growthProgress,
            shares.get(city.id) ?? 0
        ]);
        const threshold = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$urban$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["infrastructureStats"])(city, rules).growthThreshold;
        const growth = Math.min(Math.floor(progress / threshold), rules.maxGrowthPerMaintenance, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["populationCap"])(city, rules) - city.population);
        const population = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
            city.population,
            growth
        ]);
        // Bank at most one threshold so capped cities do not accumulate unbounded bursts.
        const growthProgress = Math.min(threshold, progress - (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["multiply"])(growth, threshold));
        if (growth > 0) events.push({
            ...base,
            cityId: city.id,
            type: 'POPULATION_GROWN',
            amount: growth,
            population
        });
        if (growthProgress !== city.growthProgress) events.push({
            ...base,
            cityId: city.id,
            type: 'GROWTH_PROGRESS_CHANGED',
            from: city.growthProgress,
            to: growthProgress
        });
        return {
            ...city,
            population,
            growthProgress,
            workers: {
                ...city.workers,
                unassigned: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
                    city.workers.unassigned,
                    growth
                ])
            }
        };
    });
    const afterGrowth = {
        ...player.civilization,
        cities
    };
    const administration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["deriveAdministration"])(afterGrowth, rules, map);
    const overextended = administration.administrationStatus === 'OVEREXTENDED';
    if (overextended) {
        events.push({
            ...base,
            type: 'ADMINISTRATIVE_OVEREXTENSION',
            load: administration.administrativeLoad,
            capacity: administration.administrativeCapacity
        });
        // Penalize only this cycle's non-food output, never the existing stockpile.
        for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RESOURCE_KEYS"].filter((key)=>key !== 'food')){
            const retained = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["percent"])(production[key], rules.administrativeRules.overextensionEconomicPercent);
            resources[key] -= production[key] - retained;
            production[key] = retained;
        }
    }
    cities = cities.map((city)=>{
        // Government predicates read pre-cycle stability; city array order cannot change outcomes.
        const delta = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["governmentStabilityDelta"])(city, player.civilization, rules),
            shortage ? -rules.shortageStabilityPenalty : 0,
            overextended ? -rules.administrativeRules.overextensionStabilityPenalty : 0
        ]);
        const stability = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$stability$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clampStability"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
            city.stability,
            delta
        ]));
        if (stability !== city.stability) events.push({
            ...base,
            cityId: city.id,
            type: 'STABILITY_CHANGED',
            from: city.stability,
            to: stability
        });
        return {
            ...city,
            stability
        };
    });
    // Recompute final derived values after stability crosses a government threshold.
    const civilization = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["refreshAdministration"])({
        ...player.civilization,
        cities
    }, rules, map);
    const administrativeAdjustment = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyResourcePool"])();
    const netChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyResourcePool"])();
    for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RESOURCE_KEYS"]){
        administrativeAdjustment[key] = production[key] - gross[key];
        netChange[key] = resources[key] - player.resources[key];
    }
    const economy = {
        cities: breakdowns,
        gross,
        administrativeAdjustment,
        credited: production,
        foodRequired: required,
        foodPaid: paid,
        opening: {
            ...player.resources
        },
        closing: resources,
        netChange
    };
    return {
        player: {
            ...player,
            resources,
            civilization
        },
        economy,
        events: cities.length === 0 ? [] : [
            {
                ...base,
                type: 'RESOURCES_PRODUCED',
                resources: production,
                breakdown: economy
            },
            {
                ...base,
                type: 'FOOD_CONSUMED',
                amount: paid
            },
            ...events
        ]
    };
}
}),
"[project]/packages/game-engine/dist/management.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "manageCivilization",
    ()=>manageCivilization
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared/dist/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/civilization.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$stability$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/stability.js [app-route] (ecmascript)");
;
;
;
;
function manageCivilization(state, command, version, pay = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["payLegacyResources"]) {
    if (state.phase !== 'PLANNING') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'WRONG_PHASE',
        message: 'Civilization management requires PLANNING'
    });
    const player = state.players.find((entry)=>entry.id === command.playerId);
    if (!player) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'UNKNOWN_PLAYER',
        message: 'Player is not in this game'
    });
    const base = {
        playerId: player.id,
        round: state.round,
        version
    };
    const rules = state.config;
    if (command.type === 'ADOPT_GOVERNMENT') {
        if (player.civilization.government !== 'PROTO_GOVERNANCE') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'GOVERNMENT_ALREADY_ADOPTED',
            message: 'Government changes require a future reform system'
        });
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])({
            player: {
                ...player,
                civilization: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["refreshAdministration"])({
                    ...player.civilization,
                    government: command.government
                }, rules)
            },
            event: {
                ...base,
                type: 'GOVERNMENT_ADOPTED',
                government: command.government
            }
        });
    }
    const owned = player.civilization.cities.find((city)=>city.id === command.cityId);
    if (!owned) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'CITY_NOT_OWNED',
        message: 'City is not owned by this player'
    });
    let city = {
        ...owned
    };
    const resources = {
        ...player.resources
    };
    let event;
    switch(command.type){
        case 'ASSIGN_POPULATION':
            {
                const allocated = Object.values(command.workers).reduce((total, value)=>total + BigInt(value), 0n);
                if (allocated !== BigInt(city.population)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                    code: 'INVALID_ALLOCATION',
                    message: 'Workers must sum to city population'
                });
                if (command.workers.producers < city.workedHexIds.length) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                    code: 'INVALID_WORKED_HEXES',
                    message: 'Unassign worked hexes before reducing producers'
                });
                city = {
                    ...city,
                    workers: {
                        ...command.workers
                    }
                };
                event = {
                    ...base,
                    cityId: city.id,
                    type: 'POPULATION_ASSIGNED',
                    workers: city.workers
                };
                break;
            }
        case 'DEVELOP_CITY':
            {
                if (city.development >= rules.maxDevelopment) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                    code: 'MAX_DEVELOPMENT',
                    message: 'City is at maximum development'
                });
                if (rules.blockDevelopmentAtCritical && (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$stability$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stabilityCategory"])(city.stability, rules) === 'CRITICAL') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                    code: 'CRITICAL_STABILITY',
                    message: 'Critical stability blocks development'
                });
                const cost = rules.developmentCosts[city.development - 1];
                const paymentPlayer = {
                    ...player,
                    resources
                };
                if (!cost || !pay(paymentPlayer, cost)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                    code: 'INSUFFICIENT_RESOURCES',
                    message: 'Cannot afford city development'
                });
                Object.assign(resources, paymentPlayer.resources);
                city = {
                    ...city,
                    development: city.development + 1
                };
                event = {
                    ...base,
                    cityId: city.id,
                    type: 'CITY_DEVELOPED',
                    development: city.development,
                    cost
                };
                break;
            }
        case 'SPECIALIZE_CITY':
            {
                if (city.specialization !== null) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                    code: 'ALREADY_SPECIALIZED',
                    message: 'Respecialization is not available'
                });
                if (city.development < rules.specializationMinimumDevelopment) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                    code: 'DEVELOPMENT_REQUIRED',
                    message: 'City needs more development to specialize'
                });
                city = {
                    ...city,
                    specialization: command.specialization
                };
                event = {
                    ...base,
                    cityId: city.id,
                    type: 'CITY_SPECIALIZED',
                    specialization: command.specialization
                };
                break;
            }
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])({
        player: {
            ...player,
            resources,
            civilization: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["refreshAdministration"])({
                ...player.civilization,
                cities: player.civilization.cities.map((existing)=>existing.id === city.id ? city : existing)
            }, rules)
        },
        event
    });
}
}),
"[project]/packages/game-engine/dist/migration.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "migrateSnapshotV2ToV3",
    ()=>migrateSnapshotV2ToV3
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/model.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$model$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__GameStateSchema__as__SnapshotV2Schema$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/snapshots/v2/model.js [app-route] (ecmascript) <export GameStateSchema as SnapshotV2Schema>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/territory.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared/dist/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/civilization.js [app-route] (ecmascript) <locals>");
;
;
;
function migrateSnapshotV2ToV3(input) {
    const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$snapshots$2f$v2$2f$model$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__GameStateSchema__as__SnapshotV2Schema$3e$__["SnapshotV2Schema"].safeParse(input);
    if (!parsed.success) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'INVALID_STATE',
        message: `Invalid v2 snapshot: ${parsed.error.message}`
    });
    const old = parsed.data;
    const cities = old.players.flatMap((player)=>player.civilization.cities);
    const config = {
        ...old.config,
        territory: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createDefaultTerritoryRules"])(),
        governmentModifiers: {
            ...old.config.governmentModifiers,
            MERITOCRACY: old.config.governmentModifiers.PROTO_GOVERNANCE,
            AUTOCRACY: old.config.governmentModifiers.PROTO_GOVERNANCE
        }
    };
    const map = old.map.map((hex)=>{
        const city = cities.find((city)=>city.hexId === hex.id);
        return {
            ...hex,
            terrain: 'UNKNOWN',
            features: [],
            ownerId: city?.ownerId ?? null,
            controllerCityId: city?.id ?? null,
            improvement: null
        };
    });
    try {
        const next = {
            ...old,
            schemaVersion: 3,
            config,
            map,
            players: old.players.map((player)=>({
                    ...player,
                    civilization: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["refreshAdministration"])({
                        ...player.civilization,
                        cities: player.civilization.cities.map((city)=>({
                                ...city,
                                workedHexIds: [],
                                districts: [],
                                buildings: []
                            }))
                    }, config, map)
                }))
        };
        const validated = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$model$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GameStateSchema"].safeParse(next);
        return validated.success ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])(validated.data) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'INVALID_STATE',
            message: validated.error.message
        });
    } catch (error) {
        if (error instanceof RangeError) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'NUMERIC_OVERFLOW',
            message: error.message
        });
        throw error;
    }
}
}),
"[project]/packages/game-engine/dist/random.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createSeededRandom",
    ()=>createSeededRandom,
    "randomStep",
    ()=>randomStep
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-route] (ecmascript)");
;
function randomStep(state) {
    const next = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SeedSchema"].parse(state) + 0x6d2b79f5 >>> 0;
    let value = next;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return {
        value: ((value ^ value >>> 14) >>> 0) / 4294967296,
        state: next
    };
}
function createSeededRandom(seed) {
    let state = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SeedSchema"].parse(seed);
    return {
        next () {
            const step = randomStep(state);
            state = step.state;
            return step.value;
        },
        snapshot () {
            return state;
        }
    };
}
}),
"[project]/packages/game-engine/dist/resources.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addResource",
    ()=>addResource,
    "canAfford",
    ()=>canAfford,
    "payLegacyResources",
    ()=>payLegacyResources,
    "spendResource",
    ()=>spendResource
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/core.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared/dist/index.js [app-route] (ecmascript)");
;
;
const resourceKeys = {
    FOOD: 'food',
    MATERIALS: 'materials',
    WEALTH: 'wealth',
    KNOWLEDGE: 'knowledge',
    INFLUENCE: 'influence'
};
function canAfford(pool, cost) {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ResourcePoolSchema"].safeParse(pool).success || !__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ResourcePoolSchema"].safeParse(cost).success) return false;
    return Object.values(resourceKeys).every((key)=>pool[key] >= cost[key]);
}
const payLegacyResources = (player, cost)=>{
    if (!canAfford(player.resources, cost)) return false;
    for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RESOURCE_KEYS"])player.resources[key] -= cost[key];
    return true;
};
function changeResource(pool, resource, amount, spend) {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ResourcePoolSchema"].safeParse(pool).success || !__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ResourceTypeSchema"].safeParse(resource).success || !__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$core$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NonNegativeIntegerSchema"].safeParse(amount).success) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'INVALID_RESOURCE',
        message: 'Resources require non-negative safe integers and a known type'
    });
    const key = resourceKeys[resource];
    const value = pool[key] + (spend ? -amount : amount);
    if (value < 0) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'INSUFFICIENT_RESOURCES',
        message: `Insufficient ${resource}`
    });
    if (!Number.isSafeInteger(value)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'INVALID_RESOURCE',
        message: 'Resource overflow'
    });
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])({
        ...pool,
        [key]: value
    });
}
const addResource = (pool, resource, amount)=>changeResource(pool, resource, amount, false);
const spendResource = (pool, resource, amount)=>changeResource(pool, resource, amount, true);
}),
"[project]/packages/game-engine/dist/stability.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clampStability",
    ()=>clampStability,
    "stabilityCategory",
    ()=>stabilityCategory
]);
function clampStability(value) {
    if (!Number.isFinite(value)) throw new RangeError('Stability must be finite');
    return Math.max(0, Math.min(100, Math.trunc(value)));
}
function stabilityCategory(value, rules) {
    const stability = clampStability(value);
    const bands = rules.stabilityThresholds;
    if (stability <= bands.criticalMax) return 'CRITICAL';
    if (stability <= bands.unstableMax) return 'UNSTABLE';
    if (stability <= bands.tenseMax) return 'TENSE';
    if (stability <= bands.stableMax) return 'STABLE';
    return 'PROSPEROUS';
}
}),
"[project]/packages/game-engine/dist/territory-commands.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "applyTerritoryCommand",
    ()=>applyTerritoryCommand
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2d$invariants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-domain/dist/territory-invariants.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared/dist/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/hex.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/resources.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/civilization.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$founding$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/founding.js [app-route] (ecmascript)");
;
;
;
;
;
;
function applyTerritoryCommand(state, command, version, payResources = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$resources$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["payLegacyResources"]) {
    if (state.phase !== 'PLANNING') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'WRONG_PHASE',
        message: 'Territory management requires PLANNING'
    });
    const original = state.players.find((player)=>player.id === command.playerId);
    if (!original) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
        code: 'UNKNOWN_PLAYER',
        message: 'Unknown player'
    });
    let player = structuredClone(original);
    let map = structuredClone(state.map);
    const rules = state.config.territory;
    const base = {
        playerId: player.id,
        round: state.round,
        version
    };
    const pay = (cost)=>{
        return payResources(player, cost);
    };
    const funds = {
        code: 'INSUFFICIENT_RESOURCES',
        message: 'Cannot afford configured cost'
    };
    let event;
    if (command.type === 'FOUND_CITY' || command.type === 'IMPROVE_HEX') {
        const tile = map.find((tile)=>tile.id === command.hexId);
        if (!tile) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'UNKNOWN_HEX',
            message: 'Unknown hex'
        });
        if (tile.ownerId !== player.id) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'HEX_NOT_OWNED',
            message: 'Hex is not owned by player'
        });
        if (command.type === 'IMPROVE_HEX') {
            if (tile.improvement !== null) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'ALREADY_IMPROVED',
                message: 'Replacing improvements is not available'
            });
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2d$invariants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["improvementCompatible"])(tile, command.improvement, rules)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                code: 'INVALID_IMPROVEMENT',
                message: 'Improvement is incompatible with terrain/features'
            });
            const cost = rules.improvementCatalog[command.improvement].cost;
            if (!pay(cost)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])(funds);
            tile.improvement = command.improvement;
            event = {
                ...base,
                type: 'HEX_IMPROVED',
                hexId: tile.id,
                improvement: command.improvement,
                cost
            };
        } else {
            const founded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$founding$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["foundCityAt"])(state, player, map, command, version, payResources);
            if (!founded.ok) return founded;
            event = founded.value;
        }
    } else {
        const city = player.civilization.cities.find((city)=>city.id === command.cityId);
        if (!city) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'CITY_NOT_OWNED',
            message: 'City is not owned by player'
        });
        const center = map.find((tile)=>tile.id === city.hexId);
        if (!center) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
            code: 'INVALID_STATE',
            message: 'Missing city center'
        });
        switch(command.type){
            case 'CLAIM_HEX':
                {
                    const tile = map.find((tile)=>tile.id === command.hexId);
                    if (!tile) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                        code: 'UNKNOWN_HEX',
                        message: 'Unknown hex'
                    });
                    if (tile.ownerId !== null) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                        code: 'HEX_NOT_FREE',
                        message: 'Only unowned hexes can be claimed; contested claims need a future resolver'
                    });
                    if (tile.terrain === 'SEA' || tile.terrain === 'UNKNOWN') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                        code: 'INVALID_TERRITORY',
                        message: 'SEA and UNKNOWN cannot be claimed'
                    });
                    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(center, tile) > (rules.cityRadii[city.development - 1] ?? 0)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                        code: 'OUT_OF_RANGE',
                        message: 'Target exceeds city administrative radius'
                    });
                    const candidate = {
                        ...tile,
                        ownerId: player.id,
                        controllerCityId: city.id
                    };
                    const nextMap = map.map((entry)=>entry.id === candidate.id ? candidate : entry);
                    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2d$invariants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["connectedTo"])(nextMap, candidate, center)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                        code: 'DISCONNECTED_TERRITORY',
                        message: 'A continuous owned path to the controlling city is required'
                    });
                    if (!pay(rules.claimCost)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])(funds);
                    map = nextMap;
                    event = {
                        ...base,
                        cityId: city.id,
                        type: 'HEX_CLAIMED',
                        hexId: tile.id,
                        cost: rules.claimCost
                    };
                    break;
                }
            case 'ASSIGN_WORKED_HEXES':
                {
                    if (new Set(command.hexIds).size !== command.hexIds.length || command.hexIds.length > city.workers.producers) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                        code: 'INVALID_WORKED_HEXES',
                        message: 'One unique hex per producer at most'
                    });
                    for (const id of command.hexIds){
                        const tile = map.find((entry)=>entry.id === id);
                        if (!tile || tile.ownerId !== player.id || tile.controllerCityId !== city.id || (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$hex$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hexDistance"])(center, tile) > (rules.cityRadii[city.development - 1] ?? 0) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$domain$2f$dist$2f$territory$2d$invariants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["productiveTile"])(tile, rules) || state.players.some((entry)=>entry.civilization.cities.some((other)=>other.id !== city.id && other.workedHexIds.includes(id)))) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                            code: 'INVALID_WORKED_HEXES',
                            message: 'Hex must be productive, owned, in range and assigned to this city alone'
                        });
                    }
                    city.workedHexIds = [
                        ...command.hexIds
                    ].sort();
                    event = {
                        ...base,
                        cityId: city.id,
                        type: 'WORKED_HEXES_ASSIGNED',
                        hexIds: city.workedHexIds
                    };
                    break;
                }
            case 'BUILD_DISTRICT':
                {
                    if (city.districts.some((entry)=>entry.type === command.district)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                        code: 'DUPLICATE_DISTRICT',
                        message: 'One district of each type per city'
                    });
                    if (city.districts.length >= (rules.districtSlots[city.development - 1] ?? 0)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                        code: 'DISTRICT_LIMIT',
                        message: 'No district slots available'
                    });
                    const entry = rules.districts[command.district];
                    if (city.development < entry.minimumDevelopment) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                        code: 'DEVELOPMENT_REQUIRED',
                        message: 'District development requirement not met'
                    });
                    if (!pay(entry.cost)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])(funds);
                    city.districts.push({
                        type: command.district,
                        builtRound: state.round
                    });
                    event = {
                        ...base,
                        cityId: city.id,
                        type: 'DISTRICT_BUILT',
                        district: command.district,
                        cost: entry.cost
                    };
                    break;
                }
            case 'BUILD_BUILDING':
                {
                    const entry = rules.buildings[command.building];
                    if (!city.districts.some((district)=>district.type === entry.district)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                        code: 'MISSING_DISTRICT',
                        message: 'Building requires its matching district'
                    });
                    if (city.buildings.some((building)=>building.type === command.building)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                        code: 'DUPLICATE_BUILDING',
                        message: 'Building already exists'
                    });
                    if (city.development < entry.minimumDevelopment) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])({
                        code: 'DEVELOPMENT_REQUIRED',
                        message: 'Building development requirement not met'
                    });
                    if (!pay(entry.cost)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["err"])(funds);
                    city.buildings.push({
                        type: command.building,
                        builtRound: state.round
                    });
                    event = {
                        ...base,
                        cityId: city.id,
                        type: 'BUILDING_BUILT',
                        building: command.building,
                        cost: entry.cost
                    };
                    break;
                }
        }
    }
    player = {
        ...player,
        civilization: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$civilization$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["refreshAdministration"])(player.civilization, state.config, map)
    };
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ok"])({
        player,
        map,
        event
    });
}
}),
"[project]/packages/game-engine/dist/urban.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "infrastructureStats",
    ()=>infrastructureStats,
    "workerActive",
    ()=>workerActive
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/game-engine/dist/arithmetic.js [app-route] (ecmascript)");
;
const fields = {
    PRODUCER: 'producers',
    ARTISAN: 'artisans',
    MERCHANT: 'merchants',
    SCHOLAR: 'scholars',
    SOLDIER: 'soldiers',
    UNASSIGNED: 'unassigned'
};
const workerActive = (city, role)=>role === null || city.workers[fields[role]] > 0;
function infrastructureStats(city, rules) {
    const districts = city.districts.map((district)=>({
            type: district.type,
            entry: rules.territory.districts[district.type]
        }));
    const buildings = city.buildings.map((building)=>rules.territory.buildings[building.type]);
    return {
        administrativeCapacity: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
            ...districts.map(({ type, entry })=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
                    entry.administrativeCapacity,
                    city.specialization === type ? entry.specializationCapacityBonus : 0
                ])),
            ...buildings.map((entry)=>entry.administrativeCapacity)
        ]),
        garrisonCapacity: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
            ...districts.map(({ type, entry })=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
                    entry.garrisonCapacity,
                    city.specialization === type ? entry.specializationGarrisonBonus : 0
                ])),
            ...buildings.map((entry)=>entry.garrisonCapacity)
        ]),
        growthThreshold: Math.max(1, (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$game$2d$engine$2f$dist$2f$arithmetic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sum"])([
            rules.growthThreshold,
            ...buildings.map((entry)=>-entry.growthThresholdReduction)
        ]))
    };
}
}),
];

//# sourceMappingURL=packages_game-engine_dist_09hngqb._.js.map
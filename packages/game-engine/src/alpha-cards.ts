import { ALPHA_CARDS, GREAT_PROJECTS, AlphaEraSchema, civilizationKit, type AlphaState, type PlayerId, type AlphaCommand, type AlphaEffect } from '@aoh/game-domain';
import { alphaGainLegacy, alphaPay } from './alpha-resources.js';
import { governmentEffects } from './alpha-government.js';
import { alphaRandomInteger } from './alpha-random.js';
function shuffled(state:AlphaState,ids:string[]):string[]{
  const deck=[...ids];for(let i=deck.length-1;i>0;i--){const j=alphaRandomInteger(state,i+1);[deck[i],deck[j]]=[deck[j]!,deck[i]!];}return deck;
}
export function initializeAlphaCards(state:AlphaState):void {
  const deck=(family:string)=>shuffled(state,ALPHA_CARDS.filter(c=>c.family===family).map(c=>c.id));
  state.cards.worldDeck=deck('WORLD_EVENT');state.cards.strategyDeck=deck('STRATEGY');state.cards.ambitionDeck=deck('AMBITION');state.cards.advisorDeck=deck('ADVISOR');
  state.cards.advisorMarket=state.cards.advisorDeck.splice(0,3);
  for(const player of state.players){player.hand=state.cards.strategyDeck.splice(0,3);player.ambitions=state.cards.ambitionDeck.splice(0,3);player.ambitionsChosen=false;}
}
export function cardEffects(state:AlphaState,actor:PlayerId):AlphaEffect[]{
  const player=state.players.find(p=>p.playerId===actor)!;
  return [...player.advisors.map(id=>ALPHA_CARDS.find(c=>c.id===id)!.effect!).filter(Boolean),...state.projects.filter(p=>p.ownerId===actor).map(p=>GREAT_PROJECTS.find(g=>g.id===p.projectId)!.effect),...player.temporaryEffects.filter(e=>e.round===state.core.round).map(e=>e.effect)];
}
/**
 * Hands refill by one card each round for the whole match, so an empty strategy deck takes back the played strategy cards
 * (seeded shuffle). Only cards already discarded return; cards in hands stay there.
 */
function reshuffleStrategy(state:AlphaState):void {
  const strategy=new Set(ALPHA_CARDS.filter(c=>c.family==='STRATEGY').map(c=>c.id));
  const returning=state.cards.discarded.filter(id=>strategy.has(id));
  if(!returning.length)return;
  state.cards.discarded=state.cards.discarded.filter(id=>!strategy.has(id));
  state.cards.strategyDeck=shuffled(state,returning);
}
export function maintainCards(state:AlphaState):void {
  for(const player of state.players){player.cardsPlayed=0;player.temporaryEffects=player.temporaryEffects.filter(e=>e.round>=state.core.round);}
  if(state.cards.worldDeck.length&&(state.cards.worldEvent===null||state.core.round%state.rules.eventEvery===0&&state.cards.worldEventRound!==state.core.round)) {
    if(state.cards.worldEvent)state.cards.discarded.push(state.cards.worldEvent);
    state.cards.worldEvent=state.cards.worldDeck.shift()!;state.cards.worldResponded=[];state.cards.worldEventRound=state.core.round;
  }
}
export function manageCard(state:AlphaState,actor:PlayerId,command:Extract<AlphaCommand,{type:'CHOOSE_AMBITIONS'|'PLAY_CARD'|'HIRE_ADVISOR'|'WORLD_CHOICE'|'BUILD_PROJECT'}>):void {
  const player=state.players.find(p=>p.playerId===actor)!,core=state.core.players.find(p=>p.id===actor)!;
  if(command.type==='CHOOSE_AMBITIONS') {
    if(player.ambitionsChosen||new Set(command.cardIds).size!==2||command.cardIds.some(id=>!player.ambitions.includes(id)))throw new Error('Escolha exatamente duas das três ambições recebidas.');
    state.cards.discarded.push(...player.ambitions.filter(id=>!command.cardIds.includes(id)));player.ambitions=[...command.cardIds];player.ambitionsChosen=true;return;
  }
  if(command.type==='WORLD_CHOICE') {
    if(!state.cards.worldEvent||state.cards.worldResponded.includes(actor))throw new Error('Não há decisão de evento pendente.');
    const card=ALPHA_CARDS.find(c=>c.id===state.cards.worldEvent)!;
    if(command.choice==='PRESTIGE')player.prestige++;else if(card.effect?.kind==='PRODUCTION')alphaGainLegacy(state,actor,{[card.effect.resource]:card.effect.amount});
    state.cards.worldResponded.push(actor);return;
  }
  if(command.type==='BUILD_PROJECT') {
    const project=GREAT_PROJECTS.find(p=>p.id===command.projectId);const city=core.civilization.cities.find(c=>c.id===command.cityId);
    if(!project||!city||state.occupations.some(o=>o.cityId===city.id))throw new Error('Escolha um projeto e uma cidade própria não ocupada.');
    if(state.projects.some(p=>p.projectId===project.id))throw new Error('Este Grande Projeto já foi concluído por outra obra.');
    if(AlphaEraSchema.options.indexOf(player.era)<AlphaEraSchema.options.indexOf(project.era)||!city.districts.some(d=>d.type===project.district))throw new Error('A cidade precisa da era e do distrito indicados.');
    alphaPay(state,actor,project.cost);state.projects.push({projectId:project.id,ownerId:actor,cityId:city.id,completedRound:state.core.round});player.prestige+=project.prestige;return;
  }
  const card=ALPHA_CARDS.find(c=>c.id===command.cardId);
  if(!card)throw new Error('Carta desconhecida.');
  if(command.type==='HIRE_ADVISOR') {
    if(!state.cards.advisorMarket.includes(card.id)||player.advisors.length>=state.rules.advisorLimit)throw new Error('Conselheiro indisponível ou espaços ocupados.');
    alphaPay(state,actor,state.rules.advisorCost);player.advisors.push(card.id);state.cards.advisorMarket=state.cards.advisorMarket.filter(id=>id!==card.id);
    const next=state.cards.advisorDeck.shift();if(next)state.cards.advisorMarket.push(next);return;
  }
  if(!player.hand.includes(card.id)||card.timing!==state.core.phase||player.cardsPlayed>=state.rules.cardsPerRound)throw new Error('Carta fora da mão, do momento permitido ou do limite por rodada.');
  // I-16: one Reaction per side; two Reactions in a round would stack on the same battle.
  if(card.timing==='REACTION'&&player.temporaryEffects.some(e=>e.round===state.core.round&&ALPHA_CARDS.find(c=>c.id===e.source)?.timing==='REACTION'))throw new Error('Cada lado joga no máximo uma Reação por rodada.');
  player.hand=player.hand.filter(id=>id!==card.id);state.cards.discarded.push(card.id);player.cardsPlayed++;
  if(card.effect?.kind==='PRODUCTION')alphaGainLegacy(state,actor,{[card.effect.resource]:card.effect.amount});
  else if(card.effect)player.temporaryEffects.push({source:card.id,effect:card.effect,round:state.core.round});
}
/**
 * Civilization cards live on the civilization board: the first is available from Era I, the second from Era III, the third from
 * Era V, and each unlocked card is playable once per Era. They share the per-round card limit with the hand.
 */
export function civilizationCardStatus(state:AlphaState,actor:PlayerId,cardId:string):'AVAILABLE'|'LOCKED'|'USED'|'UNKNOWN' {
  const player=state.players.find(p=>p.playerId===actor);const card=civilizationKit(player?.civilization)?.cards.find(c=>c.id===cardId);
  if(!player||!card)return 'UNKNOWN';
  if(AlphaEraSchema.options.indexOf(player.era)<AlphaEraSchema.options.indexOf(card.unlockEra))return 'LOCKED';
  return player.civilizationCardsPlayed.some(entry=>entry.cardId===card.id&&entry.era===player.era)?'USED':'AVAILABLE';
}
export function playCivilizationCard(state:AlphaState,actor:PlayerId,cardId:string):void {
  const player=state.players.find(p=>p.playerId===actor)!;const card=civilizationKit(player.civilization)?.cards.find(c=>c.id===cardId);
  const status=civilizationCardStatus(state,actor,cardId);
  if(!card||status==='UNKNOWN')throw new Error('Esta carta não pertence ao tabuleiro da sua civilização.');
  if(status==='LOCKED')throw new Error('Esta carta da civilização só libera numa era posterior.');
  if(status==='USED')throw new Error('Esta carta da civilização já foi usada nesta era.');
  if(player.cardsPlayed>=state.rules.cardsPerRound)throw new Error('Você já jogou o limite de cartas desta rodada.');
  player.cardsPlayed++;player.civilizationCardsPlayed.push({cardId:card.id,era:player.era});
  if(card.effect.kind==='PRODUCTION')alphaGainLegacy(state,actor,{[card.effect.resource]:card.effect.amount});
  else player.temporaryEffects.push({source:card.id,effect:card.effect,round:state.core.round});
}
/**
 * Era turn step 7 (canon §17, §22): Manobras +1 per Era up to the hand limit, and the Reactions played so far return to the deck.
 * Hands no longer refill every round: they start at 3 and grow by one at each Era turn.
 */
export function renewManeuvers(state:AlphaState):void {
  const reactions=new Set(ALPHA_CARDS.filter(c=>c.family==='STRATEGY'&&c.timing==='REACTION').map(c=>c.id));
  const back=state.cards.discarded.filter(id=>reactions.has(id));
  if(back.length){state.cards.discarded=state.cards.discarded.filter(id=>!reactions.has(id));state.cards.strategyDeck=shuffled(state,[...state.cards.strategyDeck,...back]);}
  for(const player of state.players){
    // República (canon §16): one more Manobra kept in hand and drawn at each Era turn.
    const bonus=governmentEffects(state,player.playerId).handBonus;
    for(let draw=0;draw<1+bonus&&player.hand.length<state.rules.handLimit+bonus;draw++){
      if(!state.cards.strategyDeck.length)reshuffleStrategy(state);
      const next=state.cards.strategyDeck.shift();if(next)player.hand.push(next);
    }
  }
}
/** Era turn step 7: one unfinished Ambição may be swapped for the next one in the deck, once per Era turn. */
export function swapAmbition(state:AlphaState,actor:PlayerId,cardId:string):void {
  const player=state.players.find(p=>p.playerId===actor)!;
  if(!state.eraTurn)throw new Error('A troca de Ambição só acontece na Virada de Era.');
  if(player.ambitionSwapEra===state.eraTurn.era)throw new Error('Você já trocou uma Ambição nesta Virada de Era.');
  if(!player.ambitions.includes(cardId)||player.completedAmbitions.includes(cardId))throw new Error('Escolha uma das suas Ambições ainda não concluídas.');
  const next=state.cards.ambitionDeck.shift();
  if(!next)throw new Error('Não há outra Ambição no baralho.');
  state.cards.discarded.push(cardId);
  player.ambitions=player.ambitions.map(id=>id===cardId?next:id);
  player.ambitionSwapEra=state.eraTurn.era;
}
/**
 * Scores completed Ambições (canon §17): at most 1 per civilization per Era (2 under a República), taken best Prestígio first.
 * Called at Era turn step 2 and once more when the match ends. Returns how many were scored.
 */
export function scoreAmbitions(state:AlphaState):number {
  let scored=0;
  for(const player of state.players) {
    if(!player.ambitionsChosen)continue;const core=state.core.players.find(p=>p.id===player.playerId)!;
    const metrics={cities:core.civilization.cities.length,territory:state.core.map.filter(t=>t.ownerId===player.playerId).length,research:player.research.length,districts:core.civilization.cities.reduce((n,c)=>n+c.districts.length,0),routes:state.routes.filter(r=>r.ownerId===player.playerId&&!r.suspended).length,treaties:state.treaties.filter(t=>t.status==='ACTIVE'&&[t.proposerId,t.recipientId].includes(player.playerId)).length,victories:player.victories,culture:core.civilization.cities.filter(c=>c.districts.some(d=>d.type==='CULTURAL')).length};
    const limit=governmentEffects(state,player.playerId).ambitionsPerEra;
    const met=player.ambitions.filter(id=>{const objective=ALPHA_CARDS.find(c=>c.id===id)!.objective!;return !player.completedAmbitions.includes(id)&&metrics[objective.metric]>=objective.threshold;})
      .sort((a,b)=>ALPHA_CARDS.find(c=>c.id===b)!.objective!.prestige-ALPHA_CARDS.find(c=>c.id===a)!.objective!.prestige||a.localeCompare(b));
    for(const id of met.slice(0,limit)){player.completedAmbitions.push(id);player.prestige+=ALPHA_CARDS.find(c=>c.id===id)!.objective!.prestige;scored++;}
  }
  return scored;
}

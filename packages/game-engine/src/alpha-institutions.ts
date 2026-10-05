import { ADVANCEMENTS, HERITAGE_ADVANCES, heritageAdvance, eraForRound, eraNumeral, ALPHA_CARDS, ALPHA_ERA_MILESTONE_CRITERIA, CIVILIZATIONS, GREAT_PROJECTS, ALPHA_RESOURCE_KEYS, alphaGainOf, emptyAlphaResourcePool, type AlphaResourcePool, type EffectTiming, type AlphaMilestoneCriterion, AlphaEraSchema, type AlphaEffect, type AlphaState, type PlayerId } from '@aoh/game-domain';
import { alphaCanAfford, alphaGainLegacy, alphaPay } from './alpha-resources.js';
import { sum } from './arithmetic.js';
import { alphaEvent } from './alpha-events.js';
import { cardEffects } from './alpha-cards.js';
import { kitAdvancementCost } from './alpha-kits.js';
import { governmentEffects, knowledgeAdvancesThisEra } from './alpha-government.js';
import { registerAdvance } from './alpha-resonance.js';
export function institutionEffects(state:AlphaState,actor:PlayerId):AlphaEffect[] {
  const player=state.players.find(p=>p.playerId===actor)!;
  return [...(CIVILIZATIONS.find(c=>c.id===player.civilization)?.passives??[]),...researchedEffects(player.research),...cardEffects(state,actor)];
}
/** PRODUCTION/STRENGTH effects of researched Web nodes (most nodes unlock things instead and carry no effect). */
const researchedEffects=(research:readonly string[]):AlphaEffect[]=>research.map(id=>ADVANCEMENTS.find(a=>a.id===id)?.effect??null).filter((effect):effect is AlphaEffect=>effect!==null);
export function institutionBonus(state:AlphaState,actor:PlayerId,kind:AlphaEffect['kind']):number {
  return sum(institutionEffects(state,actor).filter(e=>e.kind===kind).map(e=>e.amount));
}
export const effectTiming=(effect:AlphaEffect):EffectTiming=>effect.kind==='PRODUCTION'?effect.timing??'MAINTENANCE':'ONCE';
interface RecurringSource {effect:AlphaEffect;cityId:string|null}
/** Sources of recurring resource effects: civilization passives, researched advancements, advisors and great projects (bound to their city). */
function recurringSources(state:AlphaState,actor:PlayerId):RecurringSource[] {
  const player=state.players.find(p=>p.playerId===actor)!;
  return [
    ...(CIVILIZATIONS.find(c=>c.id===player.civilization)?.passives??[]).map(effect=>({effect,cityId:null})),
    ...researchedEffects(player.research).map(effect=>({effect,cityId:null})),
    ...player.advisors.map(id=>ALPHA_CARDS.find(c=>c.id===id)!.effect).filter((effect):effect is AlphaEffect=>effect!==null).map(effect=>({effect,cityId:null})),
    ...state.projects.filter(p=>p.ownerId===actor).map(p=>({effect:GREAT_PROJECTS.find(g=>g.id===p.projectId)!.effect,cityId:p.cityId as string|null})),
  ];
}
/**
 * Credits the recurring PRODUCTION effects of one timing. ON_PRODUCE effects bound to a city (great projects) apply only with that
 * city's PRODUCE; unbound ON_PRODUCE effects apply with any PRODUCE. The other timings ignore `cityId`.
 */
/** The strength bonus of a civilization split by origin, for the combat breakdown. Adds up to institutionBonus(..., 'STRENGTH'). */
export function strengthSources(state:AlphaState,actor:PlayerId):{technology:number;leader:number;other:number} {
  const player=state.players.find(p=>p.playerId===actor)!;
  const technology=sum(researchedEffects(player.research).filter(e=>e.kind==='STRENGTH').map(e=>e.amount));
  const leader=sum(player.temporaryEffects.filter(e=>e.round===state.core.round&&e.effect.kind==='STRENGTH'&&e.source.startsWith('leader-')).map(e=>e.effect.amount));
  const total=sum(cardEffects(state,actor).filter(e=>e.kind==='STRENGTH').map(e=>e.amount));
  return {technology,leader,other:total-leader};
}
/** What one timing would credit (for ON_PRODUCE: effects bound to `cityId` or to no city), in the seven resources, without crediting anything. */
export function recurringAmounts(state:AlphaState,actor:PlayerId,timing:EffectTiming,cityId?:string):AlphaResourcePool {
  const total=emptyAlphaResourcePool();
  for(const source of recurringSources(state,actor)){
    const effect=source.effect;
    if(effect.kind!=='PRODUCTION'||effectTiming(effect)!==timing)continue;
    if(timing==='ON_PRODUCE'&&source.cityId!==null&&source.cityId!==cityId)continue;
    const gain=alphaGainOf(effect.resource,effect.amount);
    for(const key of ALPHA_RESOURCE_KEYS)total[key]+=gain[key];
  }
  return total;
}
export function applyRecurringEffects(state:AlphaState,actor:PlayerId,timing:EffectTiming,options:{cityId?:string;enforceStorage?:boolean}={}):void {
  for(const source of recurringSources(state,actor)){
    const effect=source.effect;
    if(effect.kind!=='PRODUCTION'||effectTiming(effect)!==timing)continue;
    if(timing==='ON_PRODUCE'&&source.cityId!==null&&source.cityId!==options.cityId)continue;
    alphaGainLegacy(state,actor,{[effect.resource]:effect.amount},{category:'institutions',...(options.enforceStorage===undefined?{}:{enforceStorage:options.enforceStorage})});
  }
}
/** Why an advancement cannot be researched now, or null. Pure: used by the action and by the client preview. */
/** Cost of a Web node or a Heritage advance for this player (the kit may adjust Web costs). */
export function advanceCost(state:AlphaState,actor:PlayerId,id:string){
  const node=ADVANCEMENTS.find(a=>a.id===id);
  if(node){
    const cost={...kitAdvancementCost(state,actor,node)};
    // Teocracia (canon §16): the first Saber advance of each Era costs 1 more Conhecimento.
    const extra=governmentEffects(state,actor).firstKnowledgeAdvanceExtraCost;
    if(extra>0&&node.domain==='KNOWLEDGE'&&!node.convergence&&knowledgeAdvancesThisEra(state,actor)===0)cost.knowledge+=extra;
    return cost;
  }
  return heritageAdvance(id)?.cost??{food:0,materials:0,wealth:0,knowledge:0,influence:0};
}
export function researchBlock(state:AlphaState,actor:PlayerId,id:string):string|null {
  const player=state.players.find(p=>p.playerId===actor)!;const node=ADVANCEMENTS.find(a=>a.id===id);const heritage=heritageAdvance(id);
  if(!node&&!heritage)return 'Avanço desconhecido.';
  if(player.research.includes(id))return 'Este avanço já foi pesquisado.';
  const era=(node??heritage)!.era;
  if(AlphaEraSchema.options.indexOf(player.era)<AlphaEraSchema.options.indexOf(era))return 'Este avanço requer uma Era posterior.';
  if(heritage){
    if(heritage.civilizationId!==player.civilization)return 'Esta Herança pertence a outra civilização.';
    if(!player.research.includes(heritage.prerequisite))return 'Pesquise primeiro o avanço universal que abre esta Herança.';
  }
  if(node){
    if(node.prerequisites.some(prerequisite=>!player.research.includes(prerequisite)))return 'Complete os pré-requisitos indicados na Teia Civilizacional.';
    if(node.prerequisitesAny.length>0&&!node.prerequisitesAny.some(prerequisite=>player.research.includes(prerequisite)))return 'Complete um dos pré-requisitos indicados na Teia Civilizacional.';
    if(node.excludes.some(excluded=>player.research.includes(excluded)))return 'Esta escolha OU exclui um caminho já tomado.';
  }
  if(!alphaCanAfford(state,actor,advanceCost(state,actor,id)))return 'Recursos insuficientes para esta ação.';
  return null;
}
/** Research (canon §12, §13): pays Conhecimento (+ the Heritage's thematic resource); Prestígio only on ★ milestones (+3). */
export function researchAdvancement(state:AlphaState,actor:PlayerId,id:string):void {
  const blocked=researchBlock(state,actor,id);if(blocked)throw new Error(blocked);
  const player=state.players.find(p=>p.playerId===actor)!;const node=ADVANCEMENTS.find(a=>a.id===id);
  alphaPay(state,actor,advanceCost(state,actor,id));player.research.push(id);if(node?.milestone)player.prestige+=3;registerAdvance(state,actor,id);
}
/** Whether the player has researched any node that unlocks `tag` (e.g. `district:AGRARIAN`, `elevate:HAMLET`). */
export function hasUnlock(state:AlphaState,actor:PlayerId,tag:string):boolean {
  const player=state.players.find(p=>p.playerId===actor);
  return !!player&&player.research.some(id=>ADVANCEMENTS.find(a=>a.id===id)?.unlocks.includes(tag));
}
/** Heritage advances of the player's civilization. */
export const heritageFor=(state:AlphaState,actor:PlayerId)=>HERITAGE_ADVANCES.filter(a=>a.civilizationId===state.players.find(p=>p.playerId===actor)?.civilization);
export interface EraMilestoneCriterion {key:AlphaMilestoneCriterion;current:number;minimum:number;met:boolean}
/** Era progress (canon §1, §22): Eras pass by the calendar, `rules.roundsPerEra` rounds each. The old criteria stay as a read-only report. */
export function eraMilestones(state:AlphaState,actor:PlayerId) {
  const player=state.players.find(p=>p.playerId===actor)!;const core=state.core.players.find(p=>p.id===actor)!;
  const stage=AlphaEraSchema.options.indexOf(player.era);const required=state.rules.milestones[stage]??null;
  const cities=core.civilization.cities;
  const current:Record<AlphaMilestoneCriterion,number>={cities:cities.length,population:cities.reduce((n,c)=>n+c.population,0),territory:state.core.map.filter(t=>t.ownerId===actor).length,
    districts:cities.reduce((n,c)=>n+c.districts.length,0),research:player.research.length,development:Math.max(0,...cities.map(c=>c.development)),government:Number(core.civilization.government!=='PROTO_GOVERNANCE'),contacts:player.contacts.length};
  const criteria:EraMilestoneCriterion[]=required?ALPHA_ERA_MILESTONE_CRITERIA.filter(key=>key!=='government'||required.government).map(key=>{
    const minimum=key==='government'?1:required[key];return {key,current:current[key],minimum,met:current[key]>=minimum};
  }):[];
  const satisfied=criteria.filter(c=>c.met).length;const needed=required?Math.min(required.requiredCriteria,criteria.length):0;
  const next=AlphaEraSchema.options[stage+1]??null;
  const roundsPerEra=state.rules.roundsPerEra;
  const roundsUntilNext=next===null?null:Math.max(0,(stage+1)*roundsPerEra-state.core.round+1);
  return {current,required,criteria,satisfied,needed,total:criteria.length,missing:criteria.filter(c=>!c.met).map(c=>c.key),canAdvance:false,next,roundsPerEra,roundsUntilNext};
}
/** Passagem de Era: at the first round of a new Era every civilization moves together; the Leader's power returns. */
export function passEraByCalendar(state:AlphaState):void {
  const era=eraForRound(state.core.round,state.rules.roundsPerEra);
  for(const player of state.players){
    if(player.era===era||AlphaEraSchema.options.indexOf(player.era)>AlphaEraSchema.options.indexOf(era))continue;
    player.era=era;if(player.leader)player.leader.eraAbilityUsed=false;
    alphaEvent(state,'ERA_ADVANCED',`Era ${eraNumeral(era)} começou.`,[player.playerId]);
  }
}
export function civilizationAbility(state:AlphaState,actor:PlayerId):void {
  const player=state.players.find(p=>p.playerId===actor)!;const civ=CIVILIZATIONS.find(c=>c.id===player.civilization);
  if(!civ)throw new Error('Escolha uma civilização no lobby.');
  if(player.abilityRound===state.core.round)throw new Error('Habilidade já utilizada nesta rodada.');
  for(const effect of civ.ability.effects)alphaGainLegacy(state,actor,{[effect.resource]:effect.amount});player.abilityRound=state.core.round;
}

import { ADVANCEMENTS, eraForRound, eraNumeral, ALPHA_CARDS, ALPHA_ERA_MILESTONE_CRITERIA, CIVILIZATIONS, GREAT_PROJECTS, ALPHA_RESOURCE_KEYS, alphaGainOf, emptyAlphaResourcePool, type AlphaResourcePool, type EffectTiming, type AlphaMilestoneCriterion, AlphaEraSchema, type AlphaEffect, type AlphaState, type PlayerId } from '@aoh/game-domain';
import { alphaCanAfford, alphaGainLegacy, alphaPay } from './alpha-resources.js';
import { sum } from './arithmetic.js';
import { alphaEvent } from './alpha-events.js';
import { cardEffects } from './alpha-cards.js';
import { kitAdvancementCost } from './alpha-kits.js';
export function institutionEffects(state:AlphaState,actor:PlayerId):AlphaEffect[] {
  const player=state.players.find(p=>p.playerId===actor)!;
  return [...(CIVILIZATIONS.find(c=>c.id===player.civilization)?.passives??[]),...player.research.map(id=>ADVANCEMENTS.find(a=>a.id===id)!.effect),...cardEffects(state,actor)];
}
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
    ...player.research.map(id=>({effect:ADVANCEMENTS.find(a=>a.id===id)!.effect,cityId:null})),
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
  const technology=sum(player.research.map(id=>ADVANCEMENTS.find(a=>a.id===id)!.effect).filter(e=>e.kind==='STRENGTH').map(e=>e.amount));
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
export function researchBlock(state:AlphaState,actor:PlayerId,id:string):string|null {
  const player=state.players.find(p=>p.playerId===actor)!;const node=ADVANCEMENTS.find(a=>a.id===id);
  if(!node)return 'Avanço desconhecido.';
  if(player.research.includes(id))return 'Este avanço já foi pesquisado.';
  if(AlphaEraSchema.options.indexOf(player.era)<AlphaEraSchema.options.indexOf(node.era))return 'Este avanço requer uma era posterior.';
  if(node.prerequisites.some(prerequisite=>!player.research.includes(prerequisite)))return 'Complete os pré-requisitos indicados na Teia Civilizacional.';
  if(node.excludes.some(excluded=>player.research.includes(excluded)))return 'Este caminho institucional exclui uma escolha anterior.';
  if(!alphaCanAfford(state,actor,kitAdvancementCost(state,actor,node)))return 'Recursos insuficientes para esta ação.';
  return null;
}
export function researchAdvancement(state:AlphaState,actor:PlayerId,id:string):void {
  const blocked=researchBlock(state,actor,id);if(blocked)throw new Error(blocked);
  const player=state.players.find(p=>p.playerId===actor)!;const node=ADVANCEMENTS.find(a=>a.id===id)!;
  alphaPay(state,actor,kitAdvancementCost(state,actor,node));player.research.push(id);player.prestige++;
}
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

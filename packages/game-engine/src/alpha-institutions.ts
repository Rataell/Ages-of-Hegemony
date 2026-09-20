import { ADVANCEMENTS, ALPHA_ERA_MILESTONE_CRITERIA, CIVILIZATIONS, type AlphaMilestoneCriterion, AlphaEraSchema, type AlphaEffect, type AlphaState, type PlayerId } from '@aoh/game-domain';
import { alphaPay } from './alpha-resources.js';
import { sum } from './arithmetic.js';
import { cardEffects } from './alpha-cards.js';
export function institutionEffects(state:AlphaState,actor:PlayerId):AlphaEffect[] {
  const player=state.players.find(p=>p.playerId===actor)!;
  return [...(CIVILIZATIONS.find(c=>c.id===player.civilization)?.passives??[]),...player.research.map(id=>ADVANCEMENTS.find(a=>a.id===id)!.effect),...cardEffects(state,actor)];
}
export function institutionBonus(state:AlphaState,actor:PlayerId,kind:AlphaEffect['kind']):number {
  return sum(institutionEffects(state,actor).filter(e=>e.kind===kind).map(e=>e.amount));
}
export function produceInstitutions(state:AlphaState):void {
  for(const player of state.core.players)for(const effect of institutionEffects(state,player.id))if(effect.kind==='PRODUCTION')player.resources[effect.resource]=sum([player.resources[effect.resource],effect.amount]);
}
export function researchAdvancement(state:AlphaState,actor:PlayerId,id:string):void {
  const player=state.players.find(p=>p.playerId===actor)!;const node=ADVANCEMENTS.find(a=>a.id===id);
  if(!node)throw new Error('Avanço desconhecido.');
  if(player.research.includes(id))throw new Error('Este avanço já foi pesquisado.');
  if(AlphaEraSchema.options.indexOf(player.era)<AlphaEraSchema.options.indexOf(node.era))throw new Error('Este avanço requer uma era posterior.');
  if(node.prerequisites.some(id=>!player.research.includes(id)))throw new Error('Complete os pré-requisitos indicados na Teia Civilizacional.');
  if(node.excludes.some(id=>player.research.includes(id)))throw new Error('Este caminho institucional exclui uma escolha anterior.');
  alphaPay(state,actor,node.cost);player.research.push(id);player.prestige++;
}
export interface EraMilestoneCriterion {key:AlphaMilestoneCriterion;current:number;minimum:number;met:boolean}
/** Progress toward the next era: which criteria are met, which are missing and how many are needed. */
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
  return {current,required,criteria,satisfied,needed,total:criteria.length,missing:criteria.filter(c=>!c.met).map(c=>c.key),canAdvance:required!==null&&satisfied>=needed,next:AlphaEraSchema.options[stage+1]??null};
}
export function advanceEra(state:AlphaState,actor:PlayerId):void {
  const milestones=eraMilestones(state,actor);if(!milestones.next)throw new Error('Sua civilização já está na Era da Hegemonia.');
  if(!milestones.canAdvance)throw new Error(`Cumpra ao menos ${milestones.needed} dos ${milestones.total} critérios para avançar de era (${milestones.satisfied} cumpridos).`);
  const player=state.players.find(p=>p.playerId===actor)!;player.era=milestones.next;player.prestige+=2;
}
export function civilizationAbility(state:AlphaState,actor:PlayerId):void {
  const player=state.players.find(p=>p.playerId===actor)!;const civ=CIVILIZATIONS.find(c=>c.id===player.civilization);
  if(!civ)throw new Error('Escolha uma civilização no lobby.');
  if(player.abilityRound===state.core.round)throw new Error('Habilidade já utilizada nesta rodada.');
  const core=state.core.players.find(p=>p.id===actor)!;
  for(const effect of civ.ability.effects)core.resources[effect.resource]=sum([core.resources[effect.resource],effect.amount]);player.abilityRound=state.core.round;
}

import { describe, expect, it } from 'vitest';
import { ADVANCEMENTS, ALPHA_CARDS, CIVILIZATIONS, GREAT_PROJECTS, AlphaStateSchema } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame, eraMilestones, serializeAlphaState } from '@aoh/game-engine';
function setup(){return beginAlphaPlanning(createAlphaGame({gameId:'content-alpha',seed:25,preset:'QUICK',players:[{id:'p1',name:'Um'},{id:'p2',name:'Dois'}]}));}
describe('declarative alpha content',()=>{
  it('provides the required original library counts and distinct identifiers',()=>{
    expect(CIVILIZATIONS).toHaveLength(12);expect(ADVANCEMENTS).toHaveLength(50);expect(ADVANCEMENTS.filter(a=>a.convergence)).toHaveLength(10);
    expect(ALPHA_CARDS).toHaveLength(108);expect(GREAT_PROJECTS).toHaveLength(12);
    expect(['WORLD_EVENT','STRATEGY','AMBITION','ADVISOR','GREAT_PROJECT'].map(f=>ALPHA_CARDS.filter(c=>c.family===f).length)).toEqual([24,30,24,18,12]);
    for(const entries of [CIVILIZATIONS,ADVANCEMENTS,ALPHA_CARDS])expect(new Set(entries.map(e=>e.id)).size).toBe(entries.length);
    expect(new Set(CIVILIZATIONS.map(c=>JSON.stringify(c.ability.effects))).size).toBe(12);
  });
  it('keeps every research prerequisite resolvable and the graph acyclic',()=>{
    const seen=new Set<string>(),stack=new Set<string>();
    function visit(id:string){if(seen.has(id))return;expect(stack.has(id)).toBe(false);stack.add(id);const node=ADVANCEMENTS.find(a=>a.id===id);expect(node).toBeDefined();for(const p of node!.prerequisites)visit(p);stack.delete(id);seen.add(id);}
    ADVANCEMENTS.forEach(a=>visit(a.id));expect(seen.size).toBe(50);
    expect(ADVANCEMENTS.filter(a=>a.convergence).every(a=>a.prerequisites.length>=2)).toBe(true);
  });
  it('research costs resources, grants its declared effect and rejects unmet prerequisites atomically',()=>{
    const state=setup(),actor=state.players[0]!.playerId;const initial=serializeAlphaState(state);
    expect(applyAlphaCommand(state,actor,{type:'RESEARCH',expectedVersion:0,advancementId:'adv-2-1-1'}).ok).toBe(false);
    expect(serializeAlphaState(state)).toBe(initial);
    const result=applyAlphaCommand(state,actor,{type:'RESEARCH',expectedVersion:0,advancementId:'adv-1-1-1'});expect(result.ok).toBe(true);if(!result.ok)return;
    expect(result.value.players[0]!.research).toEqual(['adv-1-1-1']);expect(result.value.core.players[0]!.resources.knowledge).toBe(state.core.players[0]!.resources.knowledge-2);
    expect(eraMilestones(result.value,actor).missing).toContain('districts');
  });
  it('deals secret exclusive cards and requires choosing two ambitions before ready',()=>{
    const state=setup(),actor=state.players[0]!.playerId;
    expect(state.players[0]!.ambitions).toHaveLength(3);expect(state.players[0]!.hand.some(id=>state.players[1]!.hand.includes(id))).toBe(false);
    expect(applyAlphaCommand(state,actor,{type:'READY',expectedVersion:0}).ok).toBe(false);
    const result=applyAlphaCommand(state,actor,{type:'CHOOSE_AMBITIONS',expectedVersion:0,cardIds:state.players[0]!.ambitions.slice(0,2)});
    expect(result.ok).toBe(true);if(!result.ok)return;expect(result.value.players[0]!.ambitions).toHaveLength(2);expect(result.value.cards.discarded).toHaveLength(1);
    expect(AlphaStateSchema.safeParse({...result.value,players:result.value.players.map((p,i)=>i===1?{...p,hand:[result.value.players[0]!.hand[0]!,...p.hand]}:p)}).success).toBe(false);
  });
  it('allows the configured civilization ability once per round',()=>{
    const state=setup(),actor=state.players[0]!.playerId;const result=applyAlphaCommand(state,actor,{type:'CIVILIZATION_ABILITY',expectedVersion:0});
    expect(result.ok).toBe(true);if(!result.ok)return;
    expect(result.value.core.players[0]!.resources.food).toBe(state.core.players[0]!.resources.food+2);
    expect(applyAlphaCommand(result.value,actor,{type:'CIVILIZATION_ABILITY',expectedVersion:1}).ok).toBe(false);
  });
  it('world decisions are explicit, once per event, and cannot spend another player hand',()=>{
    const state=setup(),actor=state.players[0]!.playerId;
    const result=applyAlphaCommand(state,actor,{type:'WORLD_CHOICE',expectedVersion:0,choice:'PRESTIGE'});expect(result.ok).toBe(true);if(!result.ok)return;
    expect(result.value.players[0]!.prestige).toBe(1);
    expect(applyAlphaCommand(result.value,actor,{type:'WORLD_CHOICE',expectedVersion:1,choice:'PRESTIGE'}).ok).toBe(false);
    expect(applyAlphaCommand(result.value,actor,{type:'PLAY_CARD',expectedVersion:1,cardId:state.players[1]!.hand[0]}).ok).toBe(false);
  });
});

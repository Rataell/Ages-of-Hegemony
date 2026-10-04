import { describe, expect, it } from 'vitest';
import { completeRound } from './alpha-rounds.js';
import { AlphaStateSchema, type AlphaState } from '@aoh/game-domain';
import { applyAlphaCommand, beginAlphaPlanning, createAlphaGame, hegemonyProgress, hegemonyWinner, refreshHegemony } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';

function setup():AlphaState {
  const state=beginAlphaPlanning(createAlphaGame({gameId:'hegemony-test',seed:81,preset:'QUICK',players:[{id:'p1',name:'Um'},{id:'p2',name:'Dois'}]}));
  for(const player of state.players){
    player.era='ASCENSION';
    state.cards.discarded.push(player.ambitions.pop()!);player.ambitionsChosen=true;
  }
  // A narrow configurable scenario isolates consolidation from unrelated development costs.
  state.rules.hegemonyRequirements.CULTURAL=[{metric:'influence',minimum:1},{metric:'withinCapacity',minimum:1},{metric:'territory',minimum:1}];
  return state;
}
function declare(state:AlphaState,index=0):AlphaState {
  const result=applyAlphaCommand(state,state.players[index]!.playerId,{type:'DECLARE_HEGEMONY',path:'CULTURAL',expectedVersion:state.version});
  if(!result.ok)throw new Error(result.error.message);return result.value;
}
function readyRound(input:AlphaState):AlphaState {
  return completeRound(input,{order:input.initiative});
}
describe('hegemony declaration and uninterrupted consolidation',()=>{
  it('requires the sixth era, Hegemony, and permits one public path only',()=>{
    const state=setup(),actor=state.players[0]!.playerId;state.players[0]!.era='FOUNDATION';
    expect(applyAlphaCommand(state,actor,{type:'DECLARE_HEGEMONY',path:'CULTURAL',expectedVersion:0}).ok).toBe(false);
    state.players[0]!.era='ASCENSION';const declared=declare(state);
    expect(declared.players[0]!.hegemony).toEqual({path:'CULTURAL',declaredRound:1,qualifiedSince:1});
    expect(applyAlphaCommand(declared,actor,{type:'DECLARE_HEGEMONY',path:'MILITARY',expectedVersion:declared.version}).ok).toBe(false);
    expect(state.players[0]!.hegemony).toBeNull();
  });
  it('excludes the declaration round, then finishes after two complete rounds',()=>{
    let state=declare(setup());
    state=readyRound(state);expect(state.winner).toBeNull();expect(state.core.round).toBe(2);
    state=readyRound(state);expect(state.winner).toBeNull();expect(state.core.round).toBe(3);
    state=readyRound(state);expect(state.winner).toEqual({playerId:state.players[0]!.playerId,reason:'HEGEMONY',round:3});
    expect(state.core.status).toBe('FINISHED');expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });
  it('breaks consolidation immediately when a requirement is lost and restarts after recovery',()=>{
    const state=declare(setup());state.core.round=2;state.players[0]!.resources.influence=0;
    refreshHegemony(state);expect(state.players[0]!.hegemony!.qualifiedSince).toBeNull();
    state.players[0]!.resources.influence=5;refreshHegemony(state);
    expect(state.players[0]!.hegemony!.qualifiedSince).toBe(2);
    state.core.round=3;expect(hegemonyWinner(state)).toBeNull();
    state.core.round=4;expect(hegemonyWinner(state)).toBe(state.players[0]!.playerId);
  });
  it('uses initiative for simultaneous consolidation and Hegemony before the round-limit fallback',()=>{
    let state=declare(declare(setup()),1);state.rules.roundLimit=3;
    state=readyRound(readyRound(state));const first=state.initiative[0];state=readyRound(state);
    expect(state.winner).toMatchObject({playerId:first,reason:'HEGEMONY'});
  });
  it('projects public declarations without revealing opponent requirement metrics',()=>{
    const state=declare(setup()),viewer=state.players[1]!.playerId;state.core.players[0]!.resources.wealth=12345;
    const view=alphaPlayerView(state,viewer)!;
    expect(view.declarations).toEqual([{playerId:state.players[0]!.playerId,path:'CULTURAL',declaredRound:1,qualifiedSince:1}]);
    expect(view.hegemony).toEqual(hegemonyProgress(state,viewer));
    expect(JSON.stringify(view)).not.toContain('12345');
  });
  it('rejects historical qualification before declaration or declarations before Hegemony',()=>{
    const state=declare(setup());state.players[0]!.hegemony!.declaredRound=2;
    expect(AlphaStateSchema.safeParse(state).success).toBe(false);
    state.players[0]!.hegemony!.declaredRound=1;state.players[0]!.era='EMPIRES';
    expect(AlphaStateSchema.safeParse(state).success).toBe(false);
  });
});

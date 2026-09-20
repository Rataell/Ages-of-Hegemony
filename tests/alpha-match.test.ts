import { describe, expect, it } from 'vitest';
import { AlphaStateSchema } from '@aoh/game-domain';
import { runScriptedMatch } from './alpha-match-scenario.js';
describe('deterministic complete alpha scenario',()=>{
  it('composes real decisions across economy, world, diplomacy, battle, eras, projects and a legitimate finish',()=>{
    const first=runScriptedMatch(),second=runScriptedMatch();expect(second).toEqual(first);
    const {state,trace}=first;
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);expect(state.core.status).toBe('FINISHED');
    expect(state.winner).toMatchObject({playerId:'p1',reason:'HEGEMONY'});
    expect(state.players[0]!.era).toBe('HEGEMONY');expect(state.players[0]!.exploredRegions).toBe(1);
    expect(state.battles).toHaveLength(1);expect(state.battles[0]!.losses.length).toBeGreaterThan(0);
    expect(state.battles[0]!.retreat).not.toBeNull();
    expect(state.projects).toHaveLength(1);expect(state.roundReports.some(r=>r.trade.wealth>0)).toBe(true);
    expect(state.players[0]!.research).toHaveLength(11);
    for(const command of ['PLAY_CARD','SETTLE','URBAN_ACTION','PROPOSE_TREATY','RESPOND_TREATY','DECLARE_WAR','ADVANCE_ERA','DECLARE_HEGEMONY','BUILD_PROJECT'])expect(trace.some(t=>t.command===command)).toBe(true);
    for(const action of ['PRODUCE','BUILD','RECRUIT','RESEARCH','SUPPORT_TRADE'])expect(state.telemetry.actionsByType[action],action).toBeGreaterThan(0);
  },15000);
});

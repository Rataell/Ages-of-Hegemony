import { describe, expect, it } from 'vitest';
import { AlphaStateSchema, RESOURCE_KEYS } from '@aoh/game-domain';
import { beginAlphaPlanning, createAlphaGame } from '@aoh/game-engine';
import { alphaPlayerView } from '../apps/server/src/alpha-projection.js';

describe('authoritative alpha maintenance reports',()=>{
  it('reconciles institutions, legacy economy and piece upkeep against actual balances',()=>{
    const initial=createAlphaGame({gameId:'report-alpha',seed:51,preset:'QUICK',players:[{id:'p1',name:'Um'},{id:'p2',name:'Dois'}]});
    const state=beginAlphaPlanning(initial);
    for(const player of state.core.players){
      const report=state.roundReports.find(r=>r.playerId===player.id)!;
      expect(report.opening).toEqual(initial.core.players.find(p=>p.id===player.id)!.resources);
      expect(report.closing).toEqual(player.resources);expect(report.economy).not.toBeNull();
      for(const key of RESOURCE_KEYS)expect(report.opening[key]+report.institutions[key]+report.trade[key]+report.economy!.netChange[key]-report.upkeepPaid[key]).toBe(report.closing[key]);
      expect(report.upkeepPaid.food).toBe(state.rules.units.PIONEER.upkeep.food);
      expect(report.cities[0]!.populationAfter).toBe(player.civilization.cities[0]!.population);
    }
    expect(initial.roundReports).toHaveLength(0);
  });
  it('records paid rather than demanded upkeep on shortage and reports final stability',()=>{
    const initial=createAlphaGame({gameId:'report-shortage',seed:51,preset:'QUICK',players:[{id:'p1',name:'Um'},{id:'p2',name:'Dois'}]});
    initial.rules.units.PIONEER.upkeep.food=999;
    const state=beginAlphaPlanning(initial),report=state.roundReports[0]!;
    expect(report.upkeepRequired.food).toBe(999);expect(report.upkeepPaid.food).toBeLessThan(999);
    expect(report.closing.food).toBe(0);
    expect(report.cities[0]!.stabilityAfter).toBe(state.core.players[0]!.civilization.cities[0]!.stability);
    expect(AlphaStateSchema.safeParse(state).success).toBe(true);
  });
  it('rejects fabricated arithmetic and keeps opposing reports outside projections',()=>{
    const state=beginAlphaPlanning(createAlphaGame({gameId:'report-private',seed:51,preset:'QUICK',players:[{id:'p1',name:'Um'},{id:'p2',name:'Dois'}]}));
    const actor=state.players[0]!.playerId;
    expect(alphaPlayerView(state,actor)!.roundReports.map(r=>r.playerId)).toEqual([actor]);
    state.roundReports[0]!.closing.wealth++;
    expect(AlphaStateSchema.safeParse(state).success).toBe(false);
  });
});

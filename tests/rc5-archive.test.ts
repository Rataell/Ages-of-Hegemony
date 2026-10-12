import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AlphaStateSchema } from '@aoh/game-domain';
import { alphaStorageCapacity, urbanBlock } from '@aoh/game-engine';
import { coreCity, freshGame, meta, seat, P1 } from './v12-audit-urban-helpers.js';
import { grant } from './alpha-grant.js';

/**
 * RC5: the Arquivo belongs to the Acadêmico family in NEW games. Nothing is migrated: a snapshot keeps the requirement it carries in `core.config.territory`, and an Arquivo
 * that already stands keeps its +5 Conhecimento whatever district the city has.
 */
const withDistrict = (state: ReturnType<typeof freshGame>, district: 'ACADEMIC' | 'ADMINISTRATIVE') => { meta(state).districts.push(district); coreCity(state).districts.push({ type: district, builtRound: 1 } as never); return state; };
const archiveBlock = (state: ReturnType<typeof freshGame>) => { Object.assign(seat(state).resources, { food: 15, wood: 15, stone: 15, metal: 5, wealth: 15 }); return urbanBlock(state, P1, meta(state).cityId, 'BUILD', { build: { kind: 'BUILDING', building: 'ARCHIVE' } }); };

describe('new games: Arquivo in the Acadêmico family', () => {
  it('the default territory rules put it under Acadêmico', () => {
    expect(freshGame().core.config.territory.buildings.ARCHIVE.district).toBe('ACADEMIC');
  });
  it('is buildable with an Acadêmico district and refused with only an Administrativo one', () => {
    const academic = withDistrict(freshGame(), 'ACADEMIC'); grant(academic, P1, 'web-writing');
    expect(archiveBlock(academic)).toBeNull();
    const administrative = withDistrict(freshGame(), 'ADMINISTRATIVE'); grant(administrative, P1, 'web-writing');
    expect(archiveBlock(administrative)).toBe('O edifício exige o distrito correspondente.');
  });
});

describe('RC4 saves are not migrated', () => {
  const rc4 = () => AlphaStateSchema.parse(JSON.parse(readFileSync(new URL('./fixtures/rc4-midgame-state.json', import.meta.url), 'utf8')));
  it('the snapshot keeps asking for the Administrativo district it was created with', () => {
    const state = rc4();
    expect(state.core.config.territory.buildings.ARCHIVE.district).toBe('ADMINISTRATIVE');
    const actor = state.players[0]!.playerId, city = state.cities.find(entry => entry.currentOwnerId === actor)!;
    const coreOne = state.core.players.find(owner => owner.id === actor)!.civilization.cities.find(entry => entry.id === city.cityId)!;
    for (const [district, expected] of [['ACADEMIC', 'O edifício exige o distrito correspondente.'], ['ADMINISTRATIVE', null]] as const) {
      const copy = structuredClone(state), copyCity = copy.cities.find(entry => entry.cityId === city.cityId)!, copyCore = copy.core.players.find(owner => owner.id === actor)!.civilization.cities.find(entry => entry.id === coreOne.id)!;
      copyCity.districts = [district]; copyCore.districts = [{ type: district, builtRound: 1 } as never];
      grant(copy, actor, 'web-writing');
      Object.assign(copy.players.find(player => player.playerId === actor)!.resources, { food: 15, wood: 15, stone: 15, wealth: 15 });
      expect(urbanBlock(copy, actor, city.cityId, 'BUILD', { build: { kind: 'BUILDING', building: 'ARCHIVE' } }), district).toBe(expected);
    }
  });
});

describe('an Arquivo that already stands keeps working', () => {
  it('its +5 Conhecimento limit does not depend on the city district, and survives a save', () => {
    const state = freshGame(); meta(state).buildings.push('ARCHIVE');            // no Acadêmico district at all (built under the old rule)
    const before = alphaStorageCapacity(freshGame(), P1).knowledge;
    expect(alphaStorageCapacity(state, P1).knowledge - before).toBe(5);
    const reloaded = AlphaStateSchema.parse(JSON.parse(JSON.stringify(state)));
    expect(alphaStorageCapacity(reloaded, P1).knowledge - before).toBe(5);
    expect(reloaded.cities.find(city => city.cityId === meta(state).cityId)!.buildings).toContain('ARCHIVE');
  });
});

import { describe, expect, it } from 'vitest';
import { ALPHA_CARDS, CIVILIZATIONS, CIVILIZATION_CARDS, CIVILIZATION_KITS, LEADERS, civilizationKit } from '@aoh/game-domain';

describe('canonical civilization roster (DEC-011)', () => {
  it('holds eighteen civilizations: the twelve Alpha ones playable, the six Bible-only ones in authoring', () => {
    expect(CIVILIZATION_KITS).toHaveLength(18);
    expect(new Set(CIVILIZATION_KITS.map(kit => kit.id)).size).toBe(18);
    const playable = CIVILIZATION_KITS.filter(kit => kit.availability === 'PLAYABLE');
    expect(playable.map(kit => kit.id)).toEqual(CIVILIZATIONS.map(civ => civ.id));
    expect(CIVILIZATION_KITS.filter(kit => kit.availability === 'AUTHORING').map(kit => kit.name)).toEqual(['Kaedor', 'Lumaris', 'Targan', 'Iskara', 'Veloria', 'Norvak']);
  });
  it('keeps the Alpha identity for the twelve and never invents a leader for the six', () => {
    for (const civ of CIVILIZATIONS) {
      const kit = civilizationKit(civ.id)!;
      expect(kit.identity).toBe(civ.identity);
      expect(kit.capital).toBe(civ.capital);
      expect(LEADERS.find(leader => leader.id === kit.leaderId)?.civilizationId).toBe(civ.id);
      expect(kit.authoringGaps).toEqual([]);
    }
    for (const kit of CIVILIZATION_KITS.filter(k => k.availability === 'AUTHORING')) {
      expect(kit.leaderId).toBeNull();
      expect(kit.capital).toBeNull();
      expect(kit.cards).toEqual([]);
      expect(kit.authoringGaps.length).toBeGreaterThan(0);
    }
  });
  it('gives every civilization a distinct visual identity independent of seat color (UXDEC-019)', () => {
    expect(new Set(CIVILIZATION_KITS.map(kit => kit.mark.emblem)).size).toBe(18);
    expect(new Set(CIVILIZATION_KITS.map(kit => `${kit.mark.seal}:${kit.mark.banner}`)).size).toBe(18);
  });
  it('unlocks the three own cards by Era on the civilization board, with ids that never collide with the decks', () => {
    for (const kit of CIVILIZATION_KITS.filter(k => k.availability === 'PLAYABLE')) expect(kit.cards.map(card => card.unlockEra)).toEqual(['FOUNDATION', 'CIVILIZATION', 'ASCENSION']);
    expect(new Set(CIVILIZATION_CARDS.map(card => card.id)).size).toBe(CIVILIZATION_CARDS.length);
    expect(CIVILIZATION_CARDS.some(card => ALPHA_CARDS.some(deck => deck.id === card.id))).toBe(false);
  });
});

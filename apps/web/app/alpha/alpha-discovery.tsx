'use client';
import { useCallback, useEffect, useState } from 'react';
import { DISCOVERY_INFO, REGION_TEMPLATES, type DiscoveryKind } from '@aoh/game-domain';
import type { AlphaPlayerView } from '@aoh/server/alpha';
import type { AlphaSend } from './alpha-board';
import { AlphaCard, discoveryArtOf } from './alpha-card';
import { ChoiceParchment } from './alpha-civ-board';

/**
 * REGIÃO REVELADA (RC 1.2): when a Region THIS viewer explored is turned, a short panel says what was found (card grammar: arte → nome →
 * identidade → efeito → escolha → Continuar). Only the explorer's projection carries the Descoberta, so other seats only read the chronicle line.
 * Terra comum is a quiet one-line toast. Seen Regions are remembered per game in sessionStorage, so a reload never replays a panel.
 */
type Region = AlphaPlayerView['regions'][number];
export interface Reveal { regionId: string; name: string; kind: DiscoveryKind }
export interface RevealState { current: Reveal | null; dismiss: () => void }

const KEY = (gameId: string) => `aoh-discovery-seen-${gameId}`;
const known = (regions: readonly Region[]) => regions.filter(region => region.discovery).map(region => region.id as string);
function load(gameId: string): Set<string> | null {
  try { const raw = sessionStorage.getItem(KEY(gameId)); return raw === null ? null : new Set(JSON.parse(raw) as string[]); } catch { return null; }
}
function save(gameId: string, seen: ReadonlySet<string>) {
  try { sessionStorage.setItem(KEY(gameId), JSON.stringify([...seen])); } catch { /* storage blocked: a reload may show the panel again */ }
}

/** New Regions with a Descoberta known to the viewer, one at a time. The first visit of a game takes what is already open as seen (Pátria included). */
export function useRevealedRegions(game: AlphaPlayerView, gameId: string): RevealState {
  const [seen, setSeen] = useState<Set<string> | null>(null);
  const ids = known(game.regions).join();
  useEffect(() => {
    setSeen(old => {
      if (old) return old;
      const stored = load(gameId);
      if (stored) return stored;
      const base = new Set(known(game.regions)); save(gameId, base); return base;
    });
  }, [gameId, ids]);
  const fresh = seen ? game.regions.find(region => region.discovery && !seen.has(region.id)) : undefined;
  const current: Reveal | null = fresh?.discovery ? { regionId: fresh.id, kind: fresh.discovery.kind, name: REGION_TEMPLATES.find(t => t.id === fresh.templateId)?.name ?? 'Região' } : null;
  const dismiss = useCallback(() => {
    if (!current) return;
    setSeen(old => { const next = new Set(old ?? []); next.add(current.regionId); save(gameId, next); return next; });
  }, [current?.regionId, gameId]);
  return { current, dismiss };
}

/** The panel itself (or, for Terra comum, a toast that leaves by itself). A pending Encontro from a Vestígio is answered with the existing parchment. */
export function RegionRevealed({ reveal, game, locked, send }: { reveal: RevealState; game: AlphaPlayerView; locked: boolean; send: AlphaSend }) {
  const { current, dismiss } = reveal;
  const quiet = current?.kind === 'NONE';
  useEffect(() => { if (!quiet) return; const timer = setTimeout(dismiss, 4200); return () => clearTimeout(timer); }, [quiet, dismiss]);
  useEffect(() => {
    if (!current || quiet) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) dismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, quiet, dismiss]);
  if (!current) return null;
  const info = DISCOVERY_INFO[current.kind];
  if (quiet) return <p className="alpha-discovery-toast aoh-glass" role="status"><b>Região revelada · {current.name}</b> {info.name}: {info.identity}</p>;
  const choice = current.kind === 'RUIN' ? game.self.pendingChoices.find(c => c.source === 'ENCOUNTER') : undefined;
  return <section className="alpha-discovery aoh-glass" role="dialog" aria-modal="false" aria-label="Região revelada">
    <p className="aoh-eyebrow">Região revelada</p>
    <AlphaCard kind="discovery" art={discoveryArtOf(current.kind, 56)} name={info.name} subtitle={current.name} identity={info.identity}
      effects={[{ key: 'effect', label: 'Efeito', text: info.effect }]} />
    {choice && <ChoiceParchment choice={choice} locked={locked} send={send} />}
    <div className="alpha-discovery-actions">{choice && <small>Sem escolher agora, o pergaminho fica à espera no mapa.</small>}<button type="button" className={choice ? 'aoh-btn is-sm' : 'aoh-btn is-sm primary'} onClick={dismiss}>Continuar</button></div>
  </section>;
}

'use client';
import { useCallback, useEffect, useMemo, useState, type ReactNode, type RefObject } from 'react';
import { atWarWith } from './war-relation';
import { civilizationDisplayName, orderUnitIds, stackCategory, stackViewVerdict } from '@aoh/game-domain';
import type { AlphaPlayerView } from '@aoh/server/alpha';
import { alphaLabel as text } from './alpha-copy';
import { cityActionGate } from './alpha-panels';
import { compositionText } from './alpha-army';
import { POSTURES, postureText } from './alpha-combat';
import { TableContextCloud, TargetChip, type CloudLevel, type CloudNode, type Safe } from './table-cloud';
import type { AlphaSend } from './alpha-board';
import { LEG_COLORS, legPayload, previewBlock, useMovePreview, type DraftLeg } from './move-draft';
import { MoveFicha, type FichaChip, type FichaLeg } from './move-ficha';
import { ActionFicha } from './action-ficha';
import { useActionPreview, type PreviewCommand } from './action-preview';
import { governChoice, governLevelsParam, governPayment, recruitMinis, reconcile, remember, RES_PT } from './action-ficha-model';
import { loadMemory, saveMemory } from './action-ficha-memory';
import { moodSealSvg } from './mood-seal';
import { pieceArt } from './table-art';

/**
 * Interaction Model V2 · TABLE FIRST. Everything physical on the Mesa (city, Pioneiro, stack, empty territory) is operated from a cloud born on
 * the piece; when an action is spatial the cloud folds into a pill and the MAP is the interface. Strategic catalogs stay in their own surfaces.
 */
type Game = AlphaPlayerView;
type Order = Game['self']['orders'][number];
type UrbanOption = Game['urban']['research'][number];
type Unit = Game['units'][number];
type Tab = 'city' | 'territory' | 'military';
type Ctx = { hexId: string; kind: 'city' | 'units' | 'hex' | 'people' | 'threat' | 'foreign'; cityId?: string; group?: string | null };
type Step = { id: string; param?: string | undefined };
type UrbanCmd = { type: 'URBAN_ACTION'; cityId: string; action: string; build?: unknown; unit?: unknown; advancementId?: unknown; count?: number; levels?: number };
/**
 * The spatial decision in progress. It stores only WHAT is being decided (kind, pieces, origin): the lit hexes, the instruction and the Regions the group can enter are DERIVED from the projection
 * on every render (`modeView`), so a card played from the hand while the mode is open (a +2 movement) is felt at once instead of freezing the reach seen when the mode began.
 * `legs` exists only for a coordinated Move: the draft Order (D1), one leg per set of pieces from one origin.
 */
type Mode = { kind: 'move' | 'attack' | 'mission' | 'disembark'; ids: string[]; origin: string; name: string; legs?: DraftLeg[] };
/** What the map shows for the mode: legal hexes, the instruction, the closed Regions the group can enter (Move + Discovery), and for a Move the terrain cost of each lit hex. */
type ModeView = { hexes: string[]; label: string; frontier?: GroupFrontier[]; labels?: Record<string, string>; tones?: Record<string, 'base' | 'bonus'> };
type Group = { key: string; kind: 'pioneer' | 'envoy' | 'army' | 'fleet'; label: string; ids: string[] };
/** A closed Region the whole group can enter: each entry hex with the group's path (the slowest piece's) and the orientations that give every piece a way in. */
type GroupFrontier = { regionId: string; hexIds: string[]; entries: { hexId: string; path: string[]; rotations: number[] }[] };
/** A Region that admits several orientations: the group picks one of N abstract notches (no terrain is shown) and the Move goes with it. */
type Orient = { ids: string[]; path: string[]; regionId: string | null; rotations: number[]; index: number };

/** N notches on a ring and an arrow that turns to the chosen one. Abstract on purpose: it never hints at the terrain under the Region. */
function OrientationRing({ count, index, onPick }: { count: number; index: number; onPick: (i: number) => void }) {
  const angle = (i: number) => (360 / count) * i - 90;
  return <svg className="ctx-orient-ring" width="58" height="58" viewBox="-30 -30 60 60" role="radiogroup" aria-label={`Orientação ${index + 1} de ${count}`}>
    <circle r="22" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.5" />
    {Array.from({ length: count }, (_, i) => { const a = angle(i) * Math.PI / 180, x = Math.cos(a) * 22, y = Math.sin(a) * 22;
      return <circle key={i} role="radio" aria-checked={i === index} aria-label={`Orientação ${i + 1}`} tabIndex={-1} cx={x} cy={y} r={i === index ? 5.5 : 4} className={i === index ? 'is-on' : ''} onClick={() => onPick(i)} />; })}
    <g style={{ transform: `rotate(${angle(index) + 90}deg)`, transition: 'transform .25s ease' }}><path d="M0,-15L5,-5L1.6,-5L1.6,9L-1.6,9L-1.6,-5L-5,-5Z" fill="currentColor" /></g>
  </svg>;
}

const RESOURCE_SHORT: Record<string, string> = { food: 'Alimento', wood: 'Madeira', stone: 'Pedra', metal: 'Metal', wealth: 'Riqueza', knowledge: 'Conhecimento', influence: 'Influência', culture: 'Cultura', materials: 'Madeira/Pedra' };
const costChips = (cost: Record<string, number> | null | undefined): ReactNode => { const parts = Object.entries(cost ?? {}).filter(([, n]) => n > 0); return <div className="ctx-cost">{parts.length ? parts.map(([k, n]) => <span key={k}>{n} {RESOURCE_SHORT[k] ?? k}</span>) : <span>Sem custo</span>}</div>; };
const optionKey = (o: UrbanOption) => JSON.stringify([o.action, o.build ?? null, o.unit ?? null, o.advancementId ?? null]);
const optionLabel = (o: UrbanOption) => o.build?.kind === 'DISTRICT' ? text(o.build.district) : o.build?.kind === 'BUILDING' ? text(o.build.building) : o.build?.kind === 'FORTIFICATION' ? 'Fortificação' : o.unit ? text(o.unit) : text(o.action);
const coords = (id: string) => { const [q, r] = id.split(',').map(Number); return { q: q ?? 0, r: r ?? 0 }; };
const distance = (a: string, b: string) => { const p = coords(a), q = coords(b); return (Math.abs(p.q - q.q) + Math.abs(p.q + p.r - q.q - q.r) + Math.abs(p.r - q.r)) / 2; };
const MOOD: Record<string, string> = { REVOLT: 'Revolta', SHAKEN: 'Abalada', STABLE: 'Estável', PROSPEROUS: 'Próspera' };
const NO_LEGS: readonly DraftLeg[] = [];
/** The engine's `details.recruit` of the Ficha (previewAction). */
interface RecruitDetails { unitCost: Record<string, number>; advance: { name: string } | null; soldiers: { soldiers: number; available: number; mobilizes: number } }
const costWords = (cost: Record<string, number>) => Object.entries(cost).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${RES_PT[k] ?? k}`).join(' + ') || 'sem custo';
const FICHA_ACTIONS = new Set(['PRODUCE', 'ELEVATE', 'PROMOTE_MOOD', 'EMERGENCY_GOVERN']);
const LEVELS = ['OUTPOST', 'HAMLET', 'VILLAGE', 'CITY', 'GREAT_CITY', 'METROPOLIS', 'IMPERIAL_METROPOLIS'];

export interface TableApi {
  /** Cloud and target-mode chip, to be rendered inside the map host. */
  element: ReactNode;
  /** Legal hexes of the pending spatial decision, for the map to light up (with the terrain cost of each hex and whether only a card bonus reaches it). */
  targets: { kind: string; hexIds: string[]; labels?: Record<string, string>; tones?: Record<string, 'base' | 'bonus'> } | null;
  /** The legs of the coordinated Move being drafted, for the map to draw as coloured trajectories. */
  draftLegs: { index: number; color: string; origin: string; path: string[]; kinds: string[]; tag: string }[] | null;
  /** The orientation being chosen for a closed Region (preview on the Region back; never its terrain). */
  orientation: { regionId: string; rotation: number } | null;
  /** A hex (or the player's own pieces on it) was touched. Returns true when a target-mode decision consumed the click. */
  select: (hexId: string, fromPieces?: boolean) => boolean;
  background: () => void;
  close: () => void;
  active: boolean;
}

export function useTable(a: {
  game: Game; selfId: string; locked: boolean; send: AlphaSend; queue: (order: Record<string, unknown>) => Promise<boolean>; manage: (command: Record<string, unknown>) => Promise<boolean>;
  roomId: string; /** The seat colour, for the piece miniatures of the Ficha. */ color?: string; host: RefObject<HTMLElement | null>; describeOrder: (order: Order) => string; safe?: Safe; startWork: (cityId: string) => void; work: { cityName: string; origin: string; count: number; limit: number; onConfirm: () => void; onCancel: () => void } | null; openDetails: (tab: Tab, catalog?: boolean) => void; openBook: (tab: string) => void; hold: boolean;
}): TableApi {
  const { game, selfId, locked, send, queue, manage, host } = a;
  const [ctx, setCtx] = useState<Ctx | null>(null), [steps, setSteps] = useState<Step[]>([]);
  const [posture, setPosture] = useState('ASSAULT'), [name, setName] = useState('Novo Horizonte'), [count, setCount] = useState(1), [govLevels, setGovLevels] = useState<number | null>(null), [orient, setOrient] = useState<Orient | null>(null), [flash, setFlash] = useState<string | null>(null);
  const civ = game.view.player.civilization, rules = game.rules.units;
  const ownUnits = game.units.filter(u => u.ownerId === selfId && !u.carrierId);
  const orderedIds = new Map<string, Order>();
  for (const order of game.self.orders) for (const id of orderUnitIds(order)) orderedIds.set(id, order);
  /** Movement the cards played this round add (already inside `unitOptions`): the lit hexes only they reach get their own tone. */
  const moveBonus = game.self.temporaryEffects.filter(entry => entry.round === game.view.round && entry.effect.kind === 'MOVEMENT').reduce((total, entry) => total + ('amount' in entry.effect ? entry.effect.amount : 0), 0);
  let terrainIndex: Map<string, string> | null = null;
  const terrainAt = (id: string) => { terrainIndex ??= new Map([...game.view.visibleTerritory, ...game.knownTerritory].map(t => [t.id as string, t.terrain as string])); return terrainIndex.get(id) ?? 'PLAINS'; };
  const [mode, setMode] = useState<Mode | null>(null);

  const close = useCallback(() => { setCtx(null); setSteps([]); setMode(null); setFlash(null); setCount(1); setGovLevels(null); setOrient(null); }, []);
  const push = (id: string, param?: string) => { setFlash(null); if (id.startsWith('confirm')) setGovLevels(null); setSteps(old => [...old, { id, param }]); };
  const back = useCallback(() => { setFlash(null); setSteps(old => old.length > 1 ? old.slice(0, -1) : old); }, []);
  const showDetails = (tab: Tab, catalog?: boolean) => { close(); a.openDetails(tab, catalog); };
  const finish = (ok: boolean) => { if (ok) close(); return ok; };

  // ---------- Ficha de Ação: the read-only preview (the engine's previewAction) of the action being confirmed ----------
  const urbanOf = (cityId: string, key: string | undefined) => [...(game.urban.cities[cityId] ?? []), ...game.urban.research].find(x => optionKey(x) === key);
  const recruitMax = (cityId: string) => Math.max(1, Math.min(6, game.recruitLimits[cityId] ?? 1));
  /** The URBAN_ACTION an option plans, with the player's choices (quantity of Recrutar, levels of Governar). */
  const urbanCommand = (cityId: string, o: UrbanOption): UrbanCmd => {
    const qty = Math.min(count, recruitMax(cityId));
    const extra = o.action === 'RECRUIT' ? (qty > 1 ? { count: qty } : {}) : o.action === 'PROMOTE_MOOD' ? governLevelsParam(governChoice(o.govern, govLevels)) : {};
    return { type:'URBAN_ACTION', cityId, action: o.action, ...(o.build ? { build: o.build } : {}), ...(o.unit ? { unit: o.unit } : {}), ...(o.advancementId ? { advancementId: o.advancementId } : {}), ...extra };
  };
  const leaf = steps.at(-1);
  const fichaCommand: PreviewCommand | null = (() => {
    if (!ctx || mode || !leaf) return null;
    if (ctx.kind === 'city' && ctx.cityId && leaf.id === 'confirm') { const o = urbanOf(ctx.cityId, leaf.param); return o ? urbanCommand(ctx.cityId, o) : null; }
    if (ctx.kind === 'hex') {
      if (leaf.id === 'confirm-improve') return { type:'MANAGE', command: { type:'IMPROVE_HEX', playerId: selfId, hexId: ctx.hexId, improvement: leaf.param, expectedVersion: game.view.version } };
      if (leaf.id === 'confirm-road') return { type:'BUILD_ROAD', hexId: ctx.hexId };
      if (leaf.id === 'confirm-claim') return { type:'MANAGE', command: { type:'CLAIM_HEX', playerId: selfId, cityId: leaf.param, hexId: ctx.hexId, expectedVersion: game.view.version } };
    }
    return null;
  })();
  const fichaPreview = useActionPreview(a.roomId, fichaCommand, game.version);
  /** What the player confirmed, kept for this session so the Resultado can say "igual ao previsto" or "Δ"; a swapped or cancelled plan is dropped. */
  useEffect(() => {
    if (game.phase !== 'PLANNING') return;
    const all = loadMemory(a.roomId), now = all.filter(entry => entry.round === game.view.round);
    if (!now.length) return;
    const kept = reconcile(now, game.self.plannedActions.flatMap(plan => (plan.type === 'URBAN_ACTION' ? [plan] : [])));
    if (kept.length !== now.length) saveMemory(a.roomId, [...all.filter(entry => entry.round !== game.view.round), ...kept]);
  }, [game.version]);
  const confirmUrban = (cityId: string, o: UrbanOption) => {
    const command = urbanCommand(cityId, o), data = fichaPreview.status === 'ready' ? fichaPreview.data : null;
    void send(command).then(ok => { if (ok && data) saveMemory(a.roomId, [...loadMemory(a.roomId), remember(a.roomId, game.view.round, command, data)]); return finish(ok); });
  };

  const groupsAt = (hexId: string): Group[] => {
    const here = ownUnits.filter(u => u.hexId === hexId);
    const civil = here.filter(u => (rules[u.kind]?.strength ?? 0) <= 0 && rules[u.kind]?.domain === 'LAND');
    const army = here.filter(u => (rules[u.kind]?.strength ?? 0) > 0 && rules[u.kind]?.domain === 'LAND');
    const sea = here.filter(u => rules[u.kind]?.domain === 'SEA');
    // Two civil pieces of one kind on a hex are told apart by number ("Pioneiro 1", "Pioneiro 2"), never by an id.
    const same = (kind: string) => civil.filter(u => u.kind === kind);
    const out: Group[] = civil.map(u => ({ key: `unit:${u.id}`, kind: u.kind === 'ENVOY' ? 'envoy' as const : 'pioneer' as const, label: same(u.kind).length > 1 ? `${text(u.kind)} ${same(u.kind).indexOf(u) + 1}` : text(u.kind), ids: [u.id] }));
    if (army.length) out.push({ key: 'army', kind: 'army', label: `Militares · ${army.length}`, ids: army.map(u => u.id) });
    if (sea.length) out.push({ key: 'fleet', kind: 'fleet', label: `Frota · ${sea.length}`, ids: sea.map(u => u.id) });
    return out;
  };
  const gate = locked ? (game.self.ready ? 'Você já confirmou o planejamento.' : 'Aguarde.') : game.phase !== 'PLANNING' ? 'Disponível no Planejamento.' : null;

  // ---------- entering a context ----------
  const select = (hexId: string, fromPieces = false): boolean => {
    if (mode) {
      if (!modeInfo!.hexes.includes(hexId)) {
        // Coordinated Move: touching another stack of mine (free this round) takes ITS pieces for the next leg; the draft stays.
        if (mode.legs) { const grabbed = grabAt(hexId); if (grabbed) { pickPieces(grabbed.ids, hexId, grabbed.name); return true; } }
        setFlash(mode.legs && !mode.ids.length ? 'Escolha uma peça (ou toque noutra pilha sua) para o próximo trajeto.' : mode.legs && !modeInfo!.hexes.length ? 'Estas peças não têm destino em comum: separe-as em trajetos diferentes.' : 'Fora do alcance: escolha um hex destacado.'); return true;
      }
      if (mode.legs) addLeg(hexId); else commit(hexId);
      return true;
    }
    const myCity = civ.cities.find(c => c.hexId === hexId), groups = groupsAt(hexId);
    const people = game.independents.find(p => p.hexId === hexId && p.integratedBy === null), threat = game.threats.find(r => r.hexId === hexId);
    const foreign = game.view.visibleCities.some(c => c.hexId === hexId && c.ownerId !== selfId) || game.units.some(u => u.hexId === hexId && u.ownerId !== selfId && !u.carrierId);
    const next: Ctx = fromPieces && groups.length ? { hexId, kind: 'units', group: groups[0]!.key } : myCity ? { hexId, kind: 'city', cityId: myCity.id } : groups.length ? { hexId, kind: 'units', group: groups[0]!.key } : threat ? { hexId, kind: 'threat' } : foreign ? { hexId, kind: 'foreign' } : people ? { hexId, kind: 'people' } : { hexId, kind: 'hex' };
    if (ctx && ctx.hexId === hexId && ctx.kind === next.kind && !fromPieces) { close(); return false; }
    setCtx(next); setSteps([{ id: 'root' }]); setFlash(null);
    return false;
  };

  // ---------- spatial decisions: the map is the interface ----------
  /**
   * Discovery is a Move (canon 2026-10-07): the closed Regions the whole group can enter as the last step. The server answers per piece; the group keeps what every piece
   * can do, walks the slowest piece's path, and needs at least one discoverer (Pioneiro; a ship with a Pioneiro aboard or Navegação Oceânica).
   */
  const frontierOfGroup = (ids: readonly string[]): { regions: GroupFrontier[]; block: string | null; note: string | null } => {
    const opts = ids.map(id => game.unitOptions[id]).filter((o): o is NonNullable<typeof o> => o !== undefined);
    if (!opts.length || opts.length !== ids.length) return { regions: [], block: null, note: null };
    if (!opts.some(o => o.discoverer)) return { regions: [], block: null, note: opts.find(o => o.frontierNote)?.frontierNote ?? null };
    const slow = opts.reduce((a, b) => (b.movement < a.movement ? b : a));
    const regions: GroupFrontier[] = []; let block: string | null = null;
    for (const region of slow.frontier) {
      const lists = opts.map(o => o.frontier.find(x => x.regionId === region.regionId));
      if (lists.some(l => !l)) continue;
      const entries = region.entries.map(entry => ({ ...entry, rotations: entry.rotations.filter(k => lists.every(l => l!.entries.some(e => e.hexId === entry.hexId && e.rotations.includes(k)))) })).filter(entry => entry.rotations.length > 0);
      if (entries.length) regions.push({ regionId: region.regionId, hexIds: region.hexIds, entries });
      else block ??= region.block;
    }
    return { regions, block, note: null };
  };
  /** Where the mode may land, derived from the CURRENT projection every render (never frozen when the mode began). */
  const modeView = (m: Mode): ModeView => {
    if (m.kind === 'disembark') {
      const lists = m.ids.map(id => game.unitOptions[id]?.disembark ?? []);
      return { hexes: lists.length ? lists[0]!.filter(h => lists.every(list => list.includes(h))) : [], label: 'Desembarcar: escolha a terra no mapa' };
    }
    const opts = m.ids.map(id => game.unitOptions[id]).filter((o): o is NonNullable<typeof o> => o !== undefined);
    if (m.kind === 'move') {
      if (!m.ids.length || opts.length !== m.ids.length) return { hexes: [], label: m.legs ? 'Mover: escolha as peças e o destino no mapa' : `Mover ${m.name}: sem destino` };
      const frontier = frontierOfGroup(m.ids).regions;
      const walk = Object.keys(opts[0]!.moves).filter(h => opts.every(o => o.moves[h]));
      // Terrain cost of each lit hex (the slowest piece's path, as the Move will walk it) and which hexes only the card bonus of this round reaches.
      const slowest = opts.reduce((a, b) => (b.movement < a.movement ? b : a)), base = slowest.movement - moveBonus, labels: Record<string, string> = {}, tones: Record<string, 'base' | 'bonus'> = {};
      const land = m.ids.every(id => { const unit = game.units.find(u => u.id === id); return unit !== undefined && rules[unit.kind]?.domain === 'LAND'; }), roads = game.roads as readonly string[];
      for (const h of walk) {
        const cost = (slowest.moves[h] ?? []).reduce((n, step) => n + (land && roads.includes(step) ? 1 : (game.rules.movementCosts[terrainAt(step) as keyof typeof game.rules.movementCosts] ?? 1)), 0);
        const only = moveBonus > 0 && cost > base;
        labels[h] = only ? `${cost} · +${moveBonus}` : String(cost); tones[h] = only ? 'bonus' : 'base';
      }
      return { hexes: [...walk, ...frontier.flatMap(r => r.hexIds)], frontier, labels, tones,
        label: m.legs ? `Mover ${m.name}: escolha o destino de ${m.ids.length > 1 ? 'estas peças' : 'esta peça'}${frontier.length ? ' · uma Região fechada destacada é descoberta' : ''}` : `Mover ${m.name}: escolha o destino no mapa${frontier.length ? ' · uma Região fechada destacada é descoberta' : ''}` };
    }
    const foreign = new Set<string>([...game.view.visibleCities.filter(c => c.ownerId !== selfId).map(c => c.hexId), ...(m.kind === 'attack' ? game.units.filter(u => u.ownerId !== selfId && !u.carrierId).map(u => u.hexId) : [])]);
    if (m.kind === 'mission') return { hexes: game.view.visibleCities.filter(c => c.ownerId !== selfId && distance(m.origin, c.hexId) <= 1).map(c => c.hexId), label: 'Missão de influência: escolha a cidade' };
    return { hexes: [...foreign].filter(h => distance(m.origin, h) === 1), label: `Atacar (${postureText(posture)}): escolha o alvo no mapa` };
  };
  const startMode = (group: Group, kind: Mode['kind']) => {
    if (kind === 'disembark') {
      const cargo = game.units.filter(u => u.ownerId === selfId && u.carrierId && group.ids.includes(u.carrierId));
      setFlash(null); setMode({ kind, ids: cargo.map(u => u.id), origin: ownUnits.find(u => u.id === group.ids[0])!.hexId, name: group.label });
      return;
    }
    const opts = group.ids.map(id => game.unitOptions[id]).filter((o): o is NonNullable<typeof o> => o !== undefined);
    if (opts.length !== group.ids.length || !opts.length) return;
    // With the coordinated rule on, Mover opens the draft of one Order (legs); without it, one click on the destination is the Order.
    setFlash(null); setMode({ kind, ids: group.ids, origin: ownUnits.find(u => u.id === group.ids[0])!.hexId, name: group.label, ...(kind === 'move' && game.coordinatedMove.enabled ? { legs: [] } : {}) });
  };
  // ---------- coordinated Move (D1): the draft Order ----------
  /** My free pieces on a hex that can take part in a Move (not in an Order, not carried, the server listed options for them). */
  const freeAt = (hexId: string) => ownUnits.filter(u => u.hexId === hexId && !orderedIds.has(u.id) && game.unitOptions[u.id] !== undefined);
  const grabAt = (hexId: string): { ids: string[]; name: string } | null => {
    const free = new Set(freeAt(hexId).map(u => u.id)), group = groupsAt(hexId).find(g => g.ids.some(id => free.has(id)));
    return group ? { ids: group.ids.filter(id => free.has(id)), name: group.label } : null;
  };
  const pickPieces = (ids: string[], origin: string, name: string) => { setFlash(null); setMode(m => (m ? { ...m, ids, origin, name } : m)); };
  const togglePiece = (id: string) => {
    const unit = game.units.find(u => u.id === id);
    if (!mode || !unit) return;
    setFlash(null);
    if (unit.hexId !== mode.origin) { pickPieces([id], unit.hexId, text(unit.kind)); return; }
    pickPieces(mode.ids.includes(id) ? mode.ids.filter(x => x !== id) : [...mode.ids, id], mode.origin, mode.name);
  };
  const addLeg = (dest: string) => {
    if (!mode?.legs) return;
    const ids = mode.ids, opts = ids.map(id => game.unitOptions[id]).filter((o): o is NonNullable<typeof o> => o !== undefined);
    if (!ids.length || opts.length !== ids.length) return;
    // The last step may enter a closed Region (Move + Discovery): the leg carries the orientations that give every piece a way in.
    const region = (modeInfo!.frontier ?? []).find(r => r.hexIds.includes(dest));
    let leg: DraftLeg;
    if (region) {
      const entry = region.entries.find(e => e.hexId === dest) ?? [...region.entries].sort((x, y) => x.path.length - y.path.length || x.hexId.localeCompare(y.hexId))[0]!;
      leg = { ids: [...ids], origin: mode.origin, dest: entry.hexId, path: entry.path, rotations: [...entry.rotations], ri: 0, regionId: game.board.find(r => (r.hexIds as readonly string[]).includes(entry.hexId))?.id ?? null };
    } else {
      const block = stackViewVerdict(game.stacks, ids.map(id => stackCategory(rules[game.units.find(u => u.id === id)!.kind]!)), dest);
      if (block) { setFlash(block); return; }
      const slowest = opts.reduce((a, b) => (b.movement < a.movement ? b : a));
      leg = { ids: [...ids], origin: mode.origin, dest, path: slowest.moves[dest]!, rotations: [], ri: 0, regionId: null };
    }
    // A piece belongs to ONE leg: taking it for a new destination removes it from the one it was in.
    const kept = mode.legs.map(l => ({ ...l, ids: l.ids.filter(id => !ids.includes(id)) })).filter(l => l.ids.length);
    if (kept.length + 1 > game.coordinatedMove.maxPieces) { setFlash(`Limite de playtest: ${game.coordinatedMove.maxPieces} trajetos por Ordem. Remova um trajeto antes.`); return; }
    setFlash(null); setMode(m => (m ? { ...m, ids: [], legs: [...kept, leg] } : m));
  };
  const dropLeg = (index: number) => { setFlash(null); setMode(m => (m?.legs ? { ...m, legs: m.legs.filter((_, i) => i !== index) } : m)); };
  const turnLeg = (index: number, step: 1 | -1) => setMode(m => (m?.legs ? { ...m, legs: m.legs.map((l, i) => (i === index && l.rotations.length ? { ...l, ri: (l.ri + step + l.rotations.length) % l.rotations.length } : l)) } : m));
  const confirmDraft = () => {
    const legs = mode?.legs;
    if (!legs?.length) return;
    // One leg is the plain Move every client already speaks; two or three legs are ONE coordinated Order.
    void (legs.length === 1 ? queue({ type:'MOVE', ...legPayload(legs[0]!) }) : queue({ type:'MOVE', legs: legs.map(legPayload) })).then(finish);
  };
  const hostileTo = (hexId: string) => {
    const city = game.view.visibleCities.find(c => c.hexId === hexId), other = city?.ownerId ?? game.units.find(u => u.hexId === hexId && u.ownerId !== selfId)?.ownerId;
    if (!other) return { other: null as string | null, hostile: false, name: '' };
    const hostile = atWarWith(game.wars, selfId, other) || game.self.plannedActions.some(p => p.type === 'DECLARE_WAR' && p.targetId === other);
    return { other, hostile, name: game.players.find(p => p.id === other)?.name ?? 'esta civilização' };
  };
  const commit = (hexId: string) => {
    if (!mode) return;
    const opts = mode.ids.map(id => game.unitOptions[id]!);
    if (mode.kind === 'disembark') { void send({ type:'DISEMBARK', unitIds: mode.ids, hexId }).then(finish); return; }
    if (mode.kind === 'move') {
      // The last step may enter a closed Region: the same Move, ending on an entry hex, carrying the orientation (Move + Discovery).
      const region = (modeInfo!.frontier ?? []).find(r => r.hexIds.includes(hexId));
      if (region) {
        const entry = region.entries.find(e => e.hexId === hexId) ?? [...region.entries].sort((x, y) => x.path.length - y.path.length || x.hexId.localeCompare(y.hexId))[0]!;
        if (entry.rotations.length === 1) { void queue({ type:'MOVE', unitIds: mode.ids, path: entry.path, rotation: entry.rotations[0] }).then(finish); return; }
        setMode(null); setFlash(null);
        setOrient({ ids: mode.ids, path: entry.path, regionId: game.board.find(r => (r.hexIds as readonly string[]).includes(entry.hexId))?.id ?? null, rotations: [...entry.rotations], index: 0 });
        setSteps(old => [...old, { id: 'orient' }]);
        return;
      }
      const block = stackViewVerdict(game.stacks, mode.ids.map(id => stackCategory(rules[game.units.find(u => u.id === id)!.kind]!)), hexId);
      if (block) { setFlash(block); return; }
      const slowest = opts.reduce((a, b) => (b.movement < a.movement ? b : a));
      void queue({ type:'MOVE', unitIds: mode.ids, path: slowest.moves[hexId] }).then(finish);
    } else if (mode.kind === 'mission') {
      void queue({ type:'INFLUENCE', unitId: mode.ids[0], target: hexId }).then(finish);
    } else {
      const who = hostileTo(hexId);
      if (!who.hostile) { setMode(null); setFlash(`Você está em paz com ${who.name}. Planeje a guerra em Diplomacia (é resolvida antes dos conflitos).`); setSteps(old => [...old, { id: 'peace', param: who.name }]); return; }
      void queue({ type:'ATTACK', unitIds: mode.ids, target: hexId, posture }).then(finish);
    }
  };

  // ---------- levels ----------
  const cancelNode = (order: Order | undefined, planId?: string): CloudNode | null => order || planId ? { id: 'cancel', label: 'Trocar ordem', icon: 'cancel', tone: 'dominant', hint: order ? a.describeOrder(order) : 'Cancelar a ação planejada para escolher outra', disabled: gate, onSelect: () => void send({ type:'CANCEL_ORDER', orderId: order?.id ?? planId }).then(ok => ok && setSteps([{ id: 'root' }])) } : null;
  const more = (): CloudNode => ({ id: 'more', label: '', icon: 'more', tone: 'quiet', hint: 'Mais opções', onSelect: () => push('more') });

  const cityLevel = (c: Ctx, step: Step): CloudLevel => {
    const city = civ.cities.find(x => x.id === c.cityId)!, meta = game.cityStates.find(s => s.cityId === city.id);
    const options = game.urban.cities[city.id] ?? [], details = game.cityDetails.find(d => d.id === city.id);
    const level = meta ? LEVELS.indexOf(meta.level) + 1 : 1;
    const title = `${city.id === civ.capitalCityId ? '★ ' : ''}${city.name}`, subtitle = meta ? `N${level} · ${MOOD[meta.moodBand] ?? meta.mood} · Cap. ${meta.capacity}` : `${city.population} habitantes`;
    const reasonOf = (o: UrbanOption) => cityActionGate(game, city.id, o.action) ?? o.blocked;
    const planned = game.self.plannedActions.find((p): p is Extract<typeof p, { type:'URBAN_ACTION' }> => p.type === 'URBAN_ACTION' && p.cityId === city.id);
    const run = (o: UrbanOption, extra: Record<string, unknown> = {}) => void send({ type:'URBAN_ACTION', cityId: city.id, action: o.action, ...(o.build ? { build: o.build } : {}), ...(o.unit ? { unit: o.unit } : {}), ...extra }).then(finish);
    const direct = (action: string, label: string, icon: CloudNode['icon'], tone: CloudNode['tone'] = 'alt'): CloudNode | null => {
      const o = options.find(x => x.action === action); if (!o) return null;
      const reason = reasonOf(o);
      // Produzir, Governar, Elevar and the emergency recovery go through the Ficha de Ação (Estado → Elegibilidade → Custo → Prévia → Confirmar), even when blocked: the Ficha names the concrete cause.
      if (FICHA_ACTIONS.has(action)) return { id: action, label, icon, tone, hint: action === 'PROMOTE_MOOD' ? 'Escolher quantos níveis de Ânimo recuperar' : o.effect, disabled: reason, onSelect: () => push('confirm', optionKey(o)) };
      return { id: action, label, icon, tone, hint: o.effect, disabled: reason, onSelect: () => (reason ? setFlash(reason) : run(o)) };
    };
    const byAction = (action: string) => options.filter(o => o.action === action);
    const open = (list: UrbanOption[]) => list.filter(o => reasonOf(o) === null).length;
    const back0 = step.id;
    const listLevel = (id: string, heading: string, list: UrbanOption[], catalogNote?: string): CloudLevel => {
      const RANK = ['INFANTRY', 'GUARD', 'RANGED', 'CAVALRY', 'SIEGE', 'PIONEER', 'ENVOY'], rank = (o: UrbanOption) => (o.unit ? (RANK.indexOf(o.unit) < 0 ? 9 : RANK.indexOf(o.unit)) : 0);
      const sorted = [...list].sort((x, y) => Number(reasonOf(x) !== null) - Number(reasonOf(y) !== null) || rank(x) - rank(y));
      const shown = sorted.slice(0, 5);
      const nodes: CloudNode[] = shown.map(o => { const reason = reasonOf(o); return { id: optionKey(o), label: optionLabel(o), icon: o.action === 'RECRUIT' ? 'recruit' : o.build?.kind === 'FORTIFICATION' ? 'posture' : 'build', tone: reason ? 'quiet' : 'alt', disabled: reason, hint: reason ?? o.effect, onSelect: () => push('confirm', optionKey(o)) }; });
      if (sorted.length > shown.length) nodes.push({ id: 'all', label: 'Ver todas', icon: 'details', tone: 'quiet', badge: String(sorted.length), onSelect: () => showDetails('city', true) });
      return { id, title: heading, subtitle: title, nodes, note: flash ?? catalogNote ?? null };
    };
    if (step.id === 'confirm') {
      const o = urbanOf(city.id, step.param);
      if (!o) return { id: 'confirm:none', title, nodes: [] };
      const max = recruitMax(city.id), qty = Math.min(count, max);
      const choice = governChoice(o.govern, govLevels), details = (fichaPreview.status === 'ready' ? fichaPreview.data : fichaPreview.status === 'loading' ? fichaPreview.previous : undefined)?.details as { recruit?: RecruitDetails } | undefined;
      const stepper = (value: number, lo: number, hi: number, set: (n: number) => void, what: string) => <span className="afi-stepper">
        <button type="button" aria-label={`Menos ${what}`} disabled={value <= lo} onClick={() => set(value - 1)}>−</button><output aria-live="polite" data-value={value}>{value}</output><button type="button" aria-label={`Mais ${what}`} disabled={value >= hi} onClick={() => set(value + 1)}>+</button></span>;
      let controls: ReactNode = null, costExtra: ReactNode = null, predictedExtra: ReactNode = null, noEffect: string | null = null, confirmLabel = `Confirmar ${optionLabel(o)}`, h = 470;
      if (o.action === 'RECRUIT') {
        const rec = details?.recruit, color = a.color ?? '#60a3e9';
        h = 540; confirmLabel = `Confirmar Recrutar${qty > 1 ? ` ×${qty}` : ''}`;
        controls = <div className="afi-controls" role="group" aria-label="Escolha de Recrutar">
          <span className="afi-unit"><svg viewBox="-16 -16 32 32" width="30" height="30" aria-hidden="true" dangerouslySetInnerHTML={{ __html: pieceArt(o.unit ?? 'INFANTRY', color, 30) }} /><b>{o.unit ? text(o.unit) : 'Peça'}</b></span>
          <span className="afi-cap">Quantidade</span>{stepper(qty, 1, max, setCount, 'uma peça')}<span className="afi-mute">de {max} possíveis</span></div>;
        costExtra = rec ? <>
          <span className="afi-line afi-mute">{`Por peça: ${costWords(rec.unitCost)}${qty > 1 ? ` · ×${qty}` : ''}`}</span>
          {rec.advance && <span className="afi-line is-ok">✓ Avanço {rec.advance.name}</span>}
          {rec.soldiers.mobilizes > 0 && <span className="afi-line afi-mute">Soldados: {rec.soldiers.soldiers} + {rec.soldiers.available} Disponíveis · mobiliza {rec.soldiers.mobilizes}</span>}</> : null;
        predictedExtra = <div><div className="afi-minis" role="img" aria-label={`${qty} peça(s) aparecerão em ${city.name}`}>{recruitMinis(o.unit ?? null, qty).map((kind, index) => <svg key={index} viewBox="-16 -16 32 32" width="30" height="30" aria-hidden="true" dangerouslySetInnerHTML={{ __html: pieceArt(kind, color, 30) }} />)}</div>
          <span className="afi-mute">{qty} {qty > 1 ? 'peças aparecerão' : 'peça aparecerá'} em {city.name}.</span></div>;
      } else if (o.action === 'PROMOTE_MOOD' && o.govern) {
        const g = o.govern, row = choice.table.find(l => l.levels === choice.levels);
        h = 520; confirmLabel = choice.levels > 0 ? `Confirmar Governar · ${choice.levels} ${choice.levels > 1 ? 'níveis' : 'nível'}` : 'Sem efeito';
        if (choice.max > 0 && !choice.repairOnly && choice.levels === 0) noEffect = 'Sem efeito: escolha ao menos 1 nível de Ânimo.';
        controls = <div className="afi-controls" role="group" aria-label="Escolha de Governar">
          {choice.max > 0 && !choice.repairOnly ? <>
            <span className="afi-cap">Níveis a recuperar</span>{stepper(choice.levels, 0, choice.max, setGovLevels, 'um nível')}
            <span className="afi-mute">de {choice.max} possíveis{g.limitedBy === 'RESOURCES' ? ' (seus recursos)' : g.limitedBy === 'CAPACITY' ? ' (Capacidade)' : ' (até Próspera)'}</span>
            <span className="afi-mood-pick" aria-label={`Ânimo ${choice.mood} para ${row?.moodAfter ?? choice.mood}`}><span className="afi-seal" dangerouslySetInnerHTML={{ __html: moodSealSvg(choice.mood ?? 0, 34) }} /><i aria-hidden="true">→</i><span className="afi-seal" dangerouslySetInnerHTML={{ __html: moodSealSvg(row?.moodAfter ?? choice.mood ?? 0, 34) }} /></span></> : <span className="afi-mute">{choice.repairOnly ? 'A cidade já é Próspera: Governar só repara a fortificação.' : 'Nenhum nível pode ser pago agora.'}</span>}
          {g.emergency.available && <button type="button" className="afi-link" onClick={() => { const emergency = options.find(x => x.action === 'EMERGENCY_GOVERN'); if (emergency) push('confirm', optionKey(emergency)); }}>Recuperação emergencial: grátis, Ânimo → {g.emergency.moodAfter}</button>}</div>;
        costExtra = choice.levels > 0 ? <span className="afi-line afi-mute">Pagamento: {governPayment(choice)} (Cultura primeiro; Riqueza cobre o que faltar)</span> : null;
      } else if (o.action === 'EMERGENCY_GOVERN') {
        controls = <div className="afi-controls"><span className="afi-mute">Grátis, leva o Ânimo ao nível Estável, uma vez por episódio de Revolta. Não produz nem alimenta: produza na rodada seguinte.</span></div>;
        confirmLabel = 'Confirmar recuperação';
      }
      return { id: `confirm:${step.param}`, title: o.action === 'EMERGENCY_GOVERN' ? 'Recuperação emergencial' : optionLabel(o), subtitle: title, nodes: [], note: null, ficha: { h },
        card: <ActionFicha title={`${optionLabel(o)} · ${city.name}`} preview={fichaPreview} cityName={city.name} gate={gate} noEffect={noEffect} controls={controls} costExtra={costExtra} predictedExtra={predictedExtra} confirmLabel={confirmLabel} onConfirm={() => confirmUrban(city.id, o)} /> };
    }
    if (step.id === 'build') {
      const all = byAction('BUILD');
      const cat = (kind: string) => all.filter(o => o.build?.kind === kind);
      const eligible = all.filter(o => reasonOf(o) === null);
      if (eligible.length <= 4 || all.length <= 5) return listLevel('build', 'Construir', all);
      const nodes: CloudNode[] = [['DISTRICT', 'Distrito', 'build'], ['FORTIFICATION', 'Fortificação', 'posture'], ['BUILDING', 'Infraestrutura', 'civic']].map(([kind, label, icon]) => ({ id: kind!, label: label!, icon: icon as CloudNode['icon'], badge: String(open(cat(kind!))), disabled: cat(kind!).length ? null : 'Nada deste tipo agora.', onSelect: () => push('build-cat', kind) }));
      return { id: 'build', title: 'Construir', subtitle: title, nodes };
    }
    if (step.id === 'build-cat') { const kind = step.param!; return listLevel(`build:${kind}`, kind === 'DISTRICT' ? 'Distritos' : kind === 'FORTIFICATION' ? 'Fortificação' : 'Infraestrutura', byAction('BUILD').filter(o => o.build?.kind === kind)); }
    if (step.id === 'recruit') return listLevel('recruit', 'Recrutar', byAction('RECRUIT'));
    if (step.id === 'more') {
      const rootIds = new Set(rootNodes().map(n => n.id));
      const extra: (CloudNode | null)[] = [rootIds.has('ELEVATE') ? null : direct('ELEVATE', 'Elevar', 'elevate'), rootIds.has('PROMOTE_MOOD') ? null : direct('PROMOTE_MOOD', 'Governar', 'govern'), byAction('EMERGENCY_GOVERN').some(o => reasonOf(o) === null) ? direct('EMERGENCY_GOVERN', 'Recuperação emergencial', 'govern') : null, direct('SUPPORT_TRADE', 'Comércio', 'trade'), direct('CIVIC_ACTION', 'Ação cívica', 'civic'), direct('MOVE_CAPITAL', 'Mover capital', 'found'),
        { id: 'work', label: 'Trabalhar', icon: 'produce', hint: 'Escolher os hexes que esta cidade trabalha', disabled: gate, onSelect: () => { close(); a.startWork(city.id); } },
        { id: 'research', label: 'Pesquisar', icon: 'research', hint: 'A Teia Civilizacional (Ordem Avanço)', onSelect: () => { close(); a.openBook('research'); } },
        groupsAt(city.hexId).length ? { id: 'pieces', label: 'Peças aqui', icon: 'recruit', onSelect: () => { setCtx({ hexId: city.hexId, kind: 'units', group: groupsAt(city.hexId)[0]!.key }); setSteps([{ id: 'root' }]); } } : null,
        { id: 'details', label: 'Ver detalhes', icon: 'details', onSelect: () => { showDetails('city'); } }];
      return { id: 'more', title: 'Mais ações', subtitle: title, nodes: extra.filter((n): n is CloudNode => n !== null), note: flash };
    }
    function rootNodes(): CloudNode[] {
      const revolt = meta?.moodBand === 'REVOLT' || (meta?.mood ?? 9) <= 1, hungry = details?.growth.civilization.shortage === true;
      const elevateOpen = byAction('ELEVATE').some(o => reasonOf(o) === null);
      const cancel = cancelNode(undefined, planned?.id);
      const produce = direct('PRODUCE', 'Produzir', 'produce', hungry && !revolt ? 'dominant' : 'alt');
      const build: CloudNode = { id: 'BUILD', label: 'Construir', icon: 'build', badge: String(open(byAction('BUILD'))), disabled: byAction('BUILD').length ? gate ?? cityActionGate(game, city.id, 'BUILD') : 'Nada a construir agora.', onSelect: () => push('build') };
      const recruit: CloudNode = { id: 'RECRUIT', label: 'Recrutar', icon: 'recruit', badge: String(open(byAction('RECRUIT'))), disabled: byAction('RECRUIT').length ? gate ?? cityActionGate(game, city.id, 'RECRUIT') : 'Nenhuma peça disponível.', onSelect: () => push('recruit') };
      const govern = direct('PROMOTE_MOOD', 'Governar', 'govern', revolt ? 'dominant' : 'alt');
      const elevate = elevateOpen ? direct('ELEVATE', 'Elevar', 'elevate', 'alt') : null;
      // E-1: in Revolta with nothing to pay Governar with, the free emergency recovery takes Governar's place in the cloud (it is also always under "Mais ações").
      const emergencyOpen = revolt && byAction('EMERGENCY_GOVERN').some(o => reasonOf(o) === null);
      const governShown = emergencyOpen && byAction('PROMOTE_MOOD').every(o => reasonOf(o) !== null) ? direct('EMERGENCY_GOVERN', 'Recuperação emergencial', 'govern', 'dominant') : govern;
      const list = [produce, build, recruit, governShown, elevate].filter((n): n is CloudNode => n !== null);
      if (!list.some(n => n.tone === 'dominant')) { const first = list.find(n => !n.disabled) ?? list[0]; if (first) first.tone = 'dominant'; }
      // Four at most. Governar is on the root whenever the city is below Estável (Ânimo <= 3: Abalada or Revolta); only a calm city lets the opportunity (Elevar) displace it.
      const calm = (meta?.mood ?? 9) > 3;
      const limited = list.length > 4 ? list.filter(n => n.id !== (calm ? 'PROMOTE_MOOD' : 'ELEVATE')) : list;
      return [...(cancel ? [cancel] : []), ...limited.slice(0, cancel ? 3 : 4), more()];
    }
    void back0;
    return { id: 'root', title, subtitle, nodes: rootNodes(), note: flash ?? (planned ? `Planejado: ${text(planned.action)}.${meta ? ` Ativações ${meta.activations.count}/${meta.activations.allowed}${meta.activations.left > 0 ? ': ainda há uma ação disponível' : ': esta cidade não tem mais ações nesta rodada'}.` : ''}` : null) };
  };

  const unitLevel = (c: Ctx, step: Step): CloudLevel => {
    const groups = groupsAt(c.hexId), group = groups.find(g => g.key === c.group) ?? groups[0];
    if (!group) return { id: 'empty', title: 'Sem peças', nodes: [] };
    const units = group.ids.map(id => game.units.find(u => u.id === id)!).filter(Boolean) as Unit[];
    const subtitle = group.kind === 'army' || group.kind === 'fleet' ? compositionText(units) : group.kind === 'pioneer' ? 'Descobre ao mover, ou funda · civil' : 'Missões de influência · civil';
    const tabs = groups.length > 1 ? groups.map(g => ({ id: g.key, label: g.label, active: g.key === group.key, onSelect: () => { setCtx({ ...c, group: g.key }); setSteps([{ id: 'root' }]); setMode(null); } })) : undefined;
    const opts = group.ids.map(id => game.unitOptions[id]).filter((o): o is NonNullable<typeof o> => o !== undefined);
    const ordered = group.ids.map(id => orderedIds.get(id)).find(Boolean);
    const busy = ordered ? 'Esta peça já tem ordem nesta rodada: troque a ordem para escolher outra.' : gate;
    const common = (key: 'moves') => opts.length === group.ids.length && opts.length ? Object.keys(opts[0]![key]).filter(h => opts.every(o => o[key][h])) : [];
    const moveHexes = common('moves'), frontier = frontierOfGroup(group.ids), canMove = moveHexes.length > 0 || frontier.regions.length > 0;
    /** Pioneiro + military pieces on the same hex that are free this round: they can walk (and open a Region) together. */
    const escortIds = group.kind === 'pioneer' ? ownUnits.filter(u => u.hexId === c.hexId && rules[u.kind]?.domain === 'LAND' && (rules[u.kind]?.strength ?? 0) > 0 && !orderedIds.has(u.id)).map(u => u.id) : [];
    /** Shown in the cloud when the Regions in reach have no way in for this group ("Requer acesso naval.") or it lacks a discoverer. */
    const frontierNote = !busy && !frontier.regions.length ? frontier.block ?? frontier.note : null;
    const settleBlock = group.kind === 'pioneer' && opts[0] ? opts[0].settleBlock : 'x';
    const origin = c.hexId;
    const attackable = [...new Set([...game.view.visibleCities.filter(x => x.ownerId !== selfId).map(x => x.hexId), ...game.units.filter(u => u.ownerId !== selfId && !u.carrierId).map(u => u.hexId)])].filter(h => distance(origin, h) === 1);
    const fighters = units.every(u => (rules[u.kind]?.strength ?? 0) > 0);
    const hostileNow = attackable.some(h => hostileTo(h).hostile);
    const missionTargets = game.view.visibleCities.filter(x => x.ownerId !== selfId && distance(origin, x.hexId) <= 1);
    const cancel = cancelNode(ordered);
    const move: CloudNode = { id: 'move', label: 'Mover', icon: 'move', badge: frontier.regions.length ? '?' : null, hint: frontier.regions.length ? 'Inclui entrar numa Região fechada para descobri-la' : frontier.block ?? frontier.note ?? undefined, disabled: busy ?? (canMove ? null : 'Sem destino alcançável nesta rodada.'), onSelect: () => (busy ? setFlash(busy) : canMove ? startMode(group, 'move') : setFlash('Sem destino alcançável nesta rodada.')) };
    const escort: CloudNode | null = escortIds.length && canMove ? { id: 'escort', label: 'Com escolta', icon: 'move', badge: String(escortIds.length), hint: 'Pioneiro e militares da mesma casa: movem e descobrem juntos', disabled: busy, onSelect: () => (busy ? setFlash(busy) : startMode({ ...group, ids: [...group.ids, ...escortIds], label: `${group.label} + escolta` }, 'move')) } : null;
    const detailsNode: CloudNode = { id: 'details', label: 'Ver detalhes', icon: 'details', onSelect: () => showDetails('military') };
    if (step.id === 'settle') {
      const reason = busy ?? (typeof settleBlock === 'string' ? settleBlock : null);
      return { id: 'settle', title: 'Fundar cidade', subtitle: `em ${c.hexId}`, nodes: [], note: reason, card: <div className="ctx-card">{costChips(game.costs.founding)}<label>Nome<input value={name} maxLength={80} onChange={e => setName(e.target.value)} /></label>
        <button type="button" className="ctx-go" disabled={reason !== null || !name.trim()} onClick={() => void send({ type:'SETTLE', unitId: group.ids[0], name }).then(finish)}>Fundar</button></div> };
    }
    if (step.id === 'orient' && orient) {
      const n = orient.rotations.length, i = Math.min(orient.index, n - 1), turn = (d: number) => setOrient(o => o ? { ...o, index: (o.index + d + n) % n } : o);
      return { id: 'orient', title: 'Orientação da Região', subtitle: `${group.label} · mover para o desconhecido`, nodes: [], note: flash, card: <div className="ctx-card ctx-orient" onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); turn(e.key === 'ArrowRight' ? 1 : -1); } }}>
        <div className="ctx-orient-head"><OrientationRing count={n} index={i} onPick={k => setOrient(o => o ? { ...o, index: k } : o)} />
          <div className="ctx-orient-pick"><button type="button" aria-label="Orientação anterior" onClick={() => turn(-1)}>‹</button><b role="status">Orientação {i + 1} de {n}</b><button type="button" aria-label="Próxima orientação" onClick={() => turn(1)}>›</button></div></div>
        <p>A Região gira antes de virar. O terreno só aparece quando a rodada for resolvida; o movimento termina na entrada.</p>
        <button type="button" className="ctx-go" disabled={busy !== null} onClick={() => void queue({ type:'MOVE', unitIds: orient.ids, path: orient.path, rotation: orient.rotations[i] }).then(finish)}>Confirmar movimento</button></div> };
    }
    if (step.id === 'posture') return { id: 'posture', title: 'Postura do ataque', subtitle: group.label, nodes: POSTURES.map(([key, label]) => ({ id: key, label, icon: 'posture' as const, active: posture === key, tone: posture === key ? 'dominant' as const : 'alt' as const, onSelect: () => { setPosture(key); setSteps([{ id: 'root' }]); } })), note: 'Vale para o próximo ataque deste grupo.' };
    if (step.id === 'peace') return { id: 'peace', title: 'Em paz', subtitle: step.param, nodes: [{ id: 'diplomacy', label: 'Abrir Diplomacia', icon: 'people', tone: 'dominant', onSelect: () => { close(); a.openBook('diplomacy'); } }], note: `Declare guerra em Diplomacia; a declaração é resolvida antes dos conflitos, então o ataque pode ser na mesma rodada.` };
    if (step.id === 'more') {
      const fleets = opts.length ? opts.reduce<string[] | null>((common2, o) => common2 === null ? [...o.embark] : common2.filter(id => o.embark.includes(id)), null) ?? [] : [];
      const home = units.length === 1 && game.cityMarks.some(m => m.ownerId === selfId && m.hexId === units[0]!.hexId) && rules[units[0]!.kind]?.domain === 'LAND' && (rules[units[0]!.kind]?.strength ?? 0) > 0;
      const cargo = game.units.filter(u => u.ownerId === selfId && u.carrierId && group.ids.includes(u.carrierId));
      const nodes: (CloudNode | null)[] = [cancel, cargo.length ? { id: 'disembark', label: 'Desembarcar', icon: 'fleet', badge: String(cargo.length), disabled: busy, onSelect: () => (busy ? setFlash(busy) : startMode(group, 'disembark')) } : null, home ? { id: 'demobilize', label: 'Desmobilizar', icon: 'cancel', disabled: busy, hint: 'A peça volta à cidade como habitante Disponível', onSelect: () => void send({ type:'DEMOBILIZE', unitId: units[0]!.id }).then(finish) } : null,
        ...fleets.map(id => ({ id: `embark:${id}`, label: `Embarcar`, icon: 'fleet' as const, badge: text(game.units.find(u => u.id === id)?.kind ?? 'FLEET'), disabled: busy, onSelect: () => void send({ type:'EMBARK', unitIds: group.ids, fleetId: id }).then(finish) })), detailsNode];
      return { id: 'more', title: 'Mais ações', subtitle: group.label, nodes: nodes.filter((n): n is CloudNode => n !== null), note: flash, tabs };
    }
    // root
    let nodes: CloudNode[];
    if (group.kind === 'pioneer') {
      const settleOk = settleBlock === null;
      nodes = [
        { ...move, tone: canMove && !busy ? 'dominant' : 'alt' },
        ...(escort ? [escort] : []),
        { id: 'found', label: 'Fundar', icon: 'found', tone: settleOk && !canMove && !busy ? 'dominant' : 'alt', disabled: busy, onSelect: () => (busy ? setFlash(busy) : push('settle')) },
      ];
    } else if (group.kind === 'envoy') {
      nodes = [{ id: 'mission', label: 'Missão', icon: 'people', tone: missionTargets.length && !busy ? 'dominant' : 'alt', disabled: busy ?? (missionTargets.length ? null : 'Leve o Enviado a uma cidade estrangeira vizinha.'), onSelect: () => (busy ? setFlash(busy) : missionTargets.length ? startMode(group, 'mission') : setFlash('Leve o Enviado a uma cidade estrangeira vizinha.')) }, { ...move, tone: !missionTargets.length && !busy ? 'dominant' : 'alt' }];
    } else {
      const attackReason = busy ?? (!fighters ? 'Peças civis não atacam.' : attackable.length ? null : 'Nenhum alvo a 1 hex.');
      nodes = [{ ...move, tone: hostileNow && !busy ? 'alt' : 'dominant' },
        { id: 'attack', label: 'Atacar', icon: 'attack', tone: hostileNow && !busy ? 'dominant' : 'alt', disabled: attackReason, badge: attackable.length ? String(attackable.length) : null, onSelect: () => (attackReason ? setFlash(attackReason) : startMode(group, 'attack')) },
        { id: 'posture', label: 'Postura', icon: 'posture', badge: postureText(posture), onSelect: () => push('posture') }];
    }
    return { id: 'root', title: group.kind === 'army' || group.kind === 'fleet' ? group.label.toUpperCase() : group.label.toUpperCase(), subtitle, nodes: [...(cancel ? [cancel, ...nodes.map(n => ({ ...n, tone: n.tone === 'dominant' ? 'alt' as const : n.tone }))] : nodes), more()].slice(0, 5 + (cancel ? 1 : 0)), note: flash ?? (ordered ? `Ordem: ${a.describeOrder(ordered)}` : frontierNote), tabs };
  };

  const hexLevel = (c: Ctx, step: Step): CloudLevel => {
    const tile = game.view.visibleTerritory.find(t => t.id === c.hexId), known = !!tile && tile.terrain !== 'UNKNOWN';
    const mine = tile?.ownerId === selfId, claimCity = civ.cities.find(city => (game.claimOptions[city.id] ?? []).includes(c.hexId));
    const title = known ? text(tile!.terrain) : 'Região fechada', subtitle = known ? `${c.hexId}${tile!.ownerId ? ` · ${game.players.find(p => p.id === tile!.ownerId)?.name ?? ''}` : ' · livre'}` : 'Explore com um Pioneiro';
    const detailsNode: CloudNode = { id: 'details', label: 'Ver detalhes', icon: 'details', onSelect: () => showDetails('territory') };
    const improvements = Object.keys(game.view.config.territory.improvementCatalog);
    if (step.id === 'improve') return { id: 'improve', title: 'Melhorar', subtitle: c.hexId, nodes: improvements.map(kind => ({ id: kind, label: text(kind), icon: 'improve' as const, disabled: gate, onSelect: () => push('confirm-improve', kind) })), note: flash };
    /** Territory works go through the same Ficha: the engine's preview names the cost, the Ordem and what is missing before anything is sent. */
    const territoryFicha = (id: string, heading: string, confirmLabel: string, onConfirm: () => void): CloudLevel => ({ id, title: heading, subtitle: c.hexId, nodes: [], ficha: { h: 400 },
      card: <ActionFicha title={`${heading} · ${c.hexId}`} preview={fichaPreview} gate={gate} confirmLabel={confirmLabel} onConfirm={onConfirm} /> });
    if (step.id === 'confirm-improve') { const kind = step.param!; return territoryFicha(`confirm-improve:${kind}`, text(kind), `Confirmar ${text(kind)}`, () => void manage({ type:'IMPROVE_HEX', hexId: c.hexId, improvement: kind }).then(finish)); }
    if (step.id === 'confirm-road') return territoryFicha('confirm-road', 'Estrada', 'Construir estrada', () => void send({ type:'BUILD_ROAD', hexId: c.hexId }).then(finish));
    if (step.id === 'confirm-claim') { const target = civ.cities.find(city => city.id === step.param); return territoryFicha('confirm-claim', 'Reivindicar', 'Confirmar Reivindicar', () => target && void manage({ type:'CLAIM_HEX', cityId: target.id, hexId: c.hexId }).then(finish)); }
    const claim: CloudNode | null = claimCity ? { id: 'claim', label: 'Reivindicar', icon: 'claim', tone: 'dominant', badge: claimCity.name.split(' ')[0], hint: `Para ${claimCity.name}`, disabled: gate, onSelect: () => push('confirm-claim', claimCity.id) } : null;
    const workCity = civ.cities.find(city => tile?.controllerCityId === city.id);
    const work: CloudNode | null = workCity && tile!.id !== workCity.hexId ? { id: 'work', label: 'Trabalhar', icon: 'produce', hint: `Escolher os hexes trabalhados por ${workCity.name}`, disabled: gate, onSelect: () => { close(); a.startWork(workCity.id); } } : null;
    const nodes: CloudNode[] = [claim, mine ? { id: 'improve', label: 'Melhorar', icon: 'improve', tone: claim ? 'alt' : 'dominant', disabled: gate, onSelect: () => push('improve') } : null, work, mine ? { id: 'road', label: 'Estrada', icon: 'road', disabled: gate, onSelect: () => push('confirm-road') } : null, detailsNode].filter((n): n is CloudNode => n !== null);
    return { id: 'root', title, subtitle, nodes: nodes.length > 1 ? [...nodes.slice(0, -1), { ...nodes.at(-1)!, id: 'more', label: '', icon: 'more', tone: 'quiet', hint: 'Ver detalhes' }] : nodes, note: flash };
  };

  // ---------- the rest of what stands on the Mesa: independent peoples, threats, foreign cities and pieces ----------
  /** Own fighting stacks one hex from a target, free of orders: where an attack on it can start. */
  const adjacentStacks = (target: string) => [...new Set(ownUnits.map(u => u.hexId))].filter(h => distance(h, target) === 1).flatMap(hexId => {
    const fighters = ownUnits.filter(u => u.hexId === hexId && (rules[u.kind]?.strength ?? 0) > 0 && !orderedIds.has(u.id));
    return fighters.length ? [{ hexId, ids: fighters.map(u => u.id), label: `Militares · ${fighters.length}` }] : [];
  });
  const attackOn = (target: string, needsWar: boolean): CloudNode => {
    const stacks = adjacentStacks(target), who = hostileTo(target);
    const reason = gate ?? (stacks.length ? null : 'Nenhuma peça militar sua a 1 hex do alvo.');
    return { id: 'attack', label: 'Atacar', icon: 'attack', tone: reason ? 'alt' : 'dominant', badge: postureText(posture), disabled: reason,
      onSelect: () => { if (reason) { setFlash(reason); return; } if (needsWar && !who.hostile) { setSteps(old => [...old, { id: 'peace', param: who.name }]); return; }
        if (stacks.length === 1) void queue({ type:'ATTACK', unitIds: stacks[0]!.ids, target, posture }).then(finish); else push('attack-from', target); } };
  };
  const sharedStep = (step: Step, title: string): CloudLevel | null => {
    if (step.id === 'peace') return { id: 'peace', title: 'Em paz', subtitle: step.param, nodes: [{ id: 'diplomacy', label: 'Abrir Diplomacia', icon: 'people', tone: 'dominant', onSelect: () => { close(); a.openBook('diplomacy'); } }], note: 'Declare guerra em Diplomacia; a declaração é resolvida antes dos conflitos, então o ataque pode ser na mesma rodada.' };
    if (step.id === 'attack-from') return { id: 'attack-from', title: 'Atacar com…', subtitle: title, nodes: adjacentStacks(step.param!).map(stack => ({ id: `from:${stack.hexId}`, label: stack.label, icon: 'attack' as const, badge: stack.hexId, onSelect: () => void queue({ type:'ATTACK', unitIds: stack.ids, target: step.param, posture }).then(finish) })), note: `Postura: ${postureText(posture)}` };
    return null;
  };
  const PEOPLE_NAME: Record<string, string> = { TRADE: 'Comerciar', NEGOTIATE: 'Negociar', INFLUENCE: 'Influenciar', PROTECT: 'Proteger', INTEGRATE: 'Integrar', CONQUER: 'Conquistar' };
  const PEOPLE_ICON: Record<string, CloudNode['icon']> = { TRADE: 'trade', NEGOTIATE: 'people', INFLUENCE: 'people', PROTECT: 'posture', INTEGRATE: 'civic', CONQUER: 'attack' };
  const peopleLevel = (c: Ctx, step: Step): CloudLevel => {
    const people = game.independents.find(p => p.hexId === c.hexId && p.integratedBy === null);
    if (!people) return { id: 'gone', title: 'Povo', nodes: [] };
    const title = text(people.type), subtitle = `${text(people.attitude)} · sua influência ${people.yourInfluence}`;
    const reason = (o: (typeof people.actions)[number]) => gate ?? o.blocked;
    if (step.id === 'confirm') {
      const o = people.actions.find(x => x.action === step.param);
      if (!o) return { id: 'confirm:none', title, nodes: [] };
      const why = reason(o);
      return { id: `confirm:${o.action}`, title: PEOPLE_NAME[o.action] ?? o.action, subtitle: title, nodes: [], note: why, card: <div className="ctx-card">{costChips(o.cost)}<p>{o.effect}</p><p>Usa 1 ação principal e vale na hora.</p>
        <button type="button" className="ctx-go" disabled={why !== null} onClick={() => void send({ type:'INDEPENDENT_ACTION', peopleId: people.id, action: o.action }).then(finish)}>Confirmar</button></div> };
    }
    const order = ['TRADE', 'NEGOTIATE', 'INFLUENCE', 'PROTECT', 'INTEGRATE', 'CONQUER'];
    const all = order.map(action => people.actions.find(o => o.action === action)).filter((o): o is NonNullable<typeof o> => o !== undefined);
    const nodes: CloudNode[] = all.map(o => ({ id: o.action, label: PEOPLE_NAME[o.action] ?? o.action, icon: PEOPLE_ICON[o.action] ?? 'people', disabled: reason(o), hint: o.effect, onSelect: () => push('confirm', o.action) }));
    // Friendly peoples trade, wary ones are negotiated with, the rest are worked on by influence: the dominant node follows the attitude.
    const lead = people.attitude === 'FRIENDLY' ? 'TRADE' : people.attitude === 'HOSTILE' ? 'NEGOTIATE' : 'INFLUENCE';
    const first = nodes.find(n => n.id === lead && !n.disabled) ?? nodes.find(n => !n.disabled);
    if (first) first.tone = 'dominant';
    const shown = [first, ...nodes.filter(n => n !== first && !n.disabled)].filter((n): n is CloudNode => !!n).slice(0, 3);
    const rest = nodes.filter(n => !shown.includes(n));
    if (step.id === 'more') return { id: 'more', title: 'Mais ações', subtitle: title, nodes: [...rest, { id: 'details', label: 'Ver detalhes', icon: 'details', onSelect: () => showDetails('territory') }], note: flash };
    return { id: 'root', title, subtitle, nodes: [...shown, more()], note: flash ?? (people.protectorId ? `Protegido por ${game.players.find(p => p.id === people.protectorId)?.name ?? 'outra civilização'}.` : null) };
  };
  const threatLevel = (c: Ctx, step: Step): CloudLevel => {
    const t = game.threats.find(r => r.hexId === c.hexId);
    if (!t) return { id: 'gone', title: 'Ameaça', nodes: [] };
    const camped = t.status === 'CAMPED', title = t.kind === 'PIRATE' ? (camped ? 'Ancoradouro pirata' : 'Piratas') : camped ? 'Acampamento de Saqueadores' : 'Saqueadores em marcha';
    const subtitle = `Ameaça ${['I', 'II', 'III'][t.level - 1]} · ${t.composition.map(e => `${game.rules.units[e.kind]?.name ?? e.kind}${e.count > 1 ? ` ×${e.count}` : ''}`).join(', ')}`;
    const note = camped ? (t.fresh ? 'Recém-surgido: ainda não pode partir. Destruído no acampamento, paga recompensa uma única vez.' : 'Destruído no acampamento, paga recompensa uma única vez; se partir, derrotá-lo em campo não rende nada.')
      : t.intent.state === 'WITHDRAWING' ? 'Recuando ao acampamento: não ataca enquanto volta e pode ser atacado em campo (sem recompensa).' : t.intent.targetKnown ? `Alvo: ${t.intent.targetKind === 'CITY' ? 'cidade' : t.intent.targetKind === 'PORT' ? 'porto' : 'rota'} ${t.intent.targetId} · ${t.intent.distance} hex(es).` : t.intent.state === 'IDLE' ? 'Sem alvo alcançável.' : 'Alvo além da névoa.';
    const shared = sharedStep(step, title);
    if (shared) return shared;
    return { id: 'root', title, subtitle, nodes: [attackOn(c.hexId, false), { id: 'more', label: '', icon: 'more', tone: 'quiet', hint: 'Ver detalhes', onSelect: () => showDetails('territory') }], note: flash ?? note };
  };
  const foreignLevel = (c: Ctx, step: Step): CloudLevel => {
    const city = game.view.visibleCities.find(x => x.hexId === c.hexId && x.ownerId !== selfId);
    const ownerId = city?.ownerId ?? game.units.find(u => u.hexId === c.hexId && u.ownerId !== selfId)?.ownerId;
    const who = hostileTo(c.hexId), title = city ? city.name : `Peças de ${who.name}`, subtitle = `${game.players.find(p => p.id === ownerId)?.name ?? 'Outra civilização'} · ${who.hostile ? 'em guerra' : 'em paz'}`;
    const shared = sharedStep(step, title);
    if (shared) return shared;
    const culture = city ? game.culture.find(entry => entry.cityId === city.id) : undefined, myCulture = game.self.civilization;
    const mineHere = !!culture && culture.currentOwnerId !== selfId && culture.foreignPresence.some(p => p.civilizationId === myCulture);
    if (step.id === 'contest' && culture) return { id: 'contest', title: 'Disputar presença', subtitle: title, nodes: culture.foreignPresence.filter(p => p.civilizationId !== myCulture).map(p => ({ id: p.civilizationId, label: civilizationDisplayName(p.civilizationId), icon: 'people' as const, disabled: gate, onSelect: () => void send({ type:'CONTEST_PRESENCE', cityId: culture.cityId, defenderCivilizationId: p.civilizationId }).then(finish) })), note: 'Disputa: dois dados de cada lado mais o nível de presença. Usa 1 ação principal.' };
    const envoys = ownUnits.filter(u => u.kind === 'ENVOY' && distance(u.hexId, c.hexId) <= 1 && !orderedIds.has(u.id));
    const mission: CloudNode | null = city ? { id: 'mission', label: 'Missão', icon: 'people', disabled: gate ?? (envoys.length ? null : 'Leve um Enviado a 1 hex da cidade.'), hint: 'Presença cultural na resolução; exige paz.', onSelect: () => void queue({ type:'INFLUENCE', unitId: envoys[0]!.id, target: c.hexId }).then(finish) } : null;
    const attack = attackOn(c.hexId, true);
    const nodes: CloudNode[] = [attack, mission, mineHere ? { id: 'contest', label: 'Disputar', icon: 'people', disabled: gate, onSelect: () => push('contest') } : null, { id: 'diplomacy', label: 'Diplomacia', icon: 'people', onSelect: () => { close(); a.openBook('diplomacy'); } }].filter((n): n is CloudNode => n !== null);
    if (who.hostile && !attack.disabled) attack.tone = 'dominant'; else { attack.tone = 'alt'; const next = nodes.find(n => n.id !== 'attack' && !n.disabled); if (next) next.tone = 'dominant'; }
    return { id: 'root', title, subtitle, nodes: [...nodes, { id: 'more', label: '', icon: 'more', tone: 'quiet', hint: 'Ver detalhes', onSelect: () => showDetails(city ? 'city' : 'territory') }], note: flash };
  };

  const level = (): CloudLevel | null => {
    if (!ctx) return null;
    const step = steps.at(-1) ?? { id: 'root' };
    if (ctx.kind === 'city' && civ.cities.some(x => x.id === ctx.cityId)) return cityLevel(ctx, step);
    if (ctx.kind === 'units') return unitLevel(ctx, step);
    if (ctx.kind === 'hex') return hexLevel(ctx, step);
    if (ctx.kind === 'people') return peopleLevel(ctx, step);
    if (ctx.kind === 'threat') return threatLevel(ctx, step);
    if (ctx.kind === 'foreign') return foreignLevel(ctx, step);
    return null;
  };

  const current = mode ? null : level();
  const modeInfo: ModeView | null = mode ? modeView(mode) : null;
  const draft = mode?.kind === 'move' && mode.legs ? mode.legs : null;
  const preview = useMovePreview(a.roomId, draft ?? NO_LEGS, game.version);
  const numbersOf = (index: number) => { const leg = preview.status === 'ready' ? preview.data.legs[index] : undefined; return leg ? `custo ${leg.cost}/${leg.budget} · resta ${leg.remaining}` : null; };
  const draftLegs = useMemo(() => draft?.length ? draft.map((leg, index) => {
    const answer = preview.status === 'ready' ? preview.data.legs[index] : undefined;
    return { index, color: LEG_COLORS[index % LEG_COLORS.length]!, origin: leg.origin, path: leg.path, kinds: leg.ids.map(id => game.units.find(u => u.id === id)?.kind ?? 'INFANTRY'), tag: `${index + 1}${answer ? ` · ${answer.cost}/${answer.budget}` : ''}` };
  }) : null, [draft, preview, game.units]);
  const ficha = (): ReactNode => {
    if (!mode || !draft) return null;
    const used = draft.reduce((n, leg) => n + leg.ids.length, 0), max = game.coordinatedMove.maxPieces;
    const chipIds = [...new Set([...freeAt(mode.origin).map(u => u.id), ...draft.flatMap(leg => leg.ids)])];
    const chips: FichaChip[] = chipIds.map(id => {
      const unit = game.units.find(u => u.id === id)!, same = chipIds.filter(other => game.units.find(u => u.id === other)?.kind === unit.kind), leg = draft.findIndex(l => l.ids.includes(id));
      return { id, kind: unit.kind, label: same.length > 1 ? `${text(unit.kind)} ${same.indexOf(id) + 1}` : text(unit.kind), sub: leg >= 0 ? `no trajeto ${leg + 1}` : `mov ${game.unitOptions[id]?.movement ?? 0}`, leg: leg >= 0 ? leg : null, picked: mode.ids.includes(id) };
    });
    const rows: FichaLeg[] = draft.map((leg, index) => {
      const answer = preview.status === 'ready' ? preview.data.legs[index] : undefined;
      return { index, pieces: compositionText(leg.ids.map(id => game.units.find(u => u.id === id)!).filter(Boolean)), dest: leg.dest, numbers: numbersOf(index), blockers: [...new Set((answer?.blockers ?? []).map(b => b.message))],
        risk: answer?.frontierRisk?.danger === 'POSSIBLE' ? 'Perigo possível ao explorar uma Região fechada.' : null, turn: leg.rotations.length > 1 ? { count: leg.rotations.length, index: leg.ri } : null };
    });
    const block = gate ?? (draft.length ? previewBlock(preview) : 'Escolha as peças e toque num destino iluminado.');
    const note = flash ?? (!mode.ids.length && draft.length ? 'Escolha outra peça ou confirme a Ordem.' : modeInfo!.frontier?.length ? 'Uma Região fechada iluminada é descoberta ao entrar.' : null);
    return <MoveFicha host={host} hexId={mode.origin} {...(a.safe ? { safe: a.safe } : {})} color={a.color ?? '#60a3e9'} chips={chips} legs={rows}
      counter={{ used, max: draft.length > 1 || used <= max ? max : null, over: draft.length > 1 && used > max }} note={note} block={block}
      onToggle={togglePiece} onRemove={dropLeg} onTurn={turnLeg} onConfirm={confirmDraft} onCancel={() => { setMode(null); setFlash(null); }} />;
  };
  const element = a.hold ? null : a.work
    ? <TargetChip host={host} hexId={a.work.origin} {...(a.safe ? { safe: a.safe } : {})} text={`Trabalho de ${a.work.cityName}: clique nos hexes destacados · ${a.work.count} / ${a.work.limit}`} tone="claim" onCancel={a.work.onCancel}>
      <button type="button" className="ctx-go" onClick={a.work.onConfirm}>Confirmar</button></TargetChip>
    : mode && draft
    ? ficha()
    : mode
    ? <TargetChip host={host} hexId={mode.origin} {...(a.safe ? { safe: a.safe } : {})} text={flash ?? modeInfo!.label} tone={mode.kind === 'attack' ? 'attack' : 'move'} onCancel={() => { setMode(null); setFlash(null); }}>
</TargetChip>
    : ctx && current ? <TableContextCloud host={host} hexId={ctx.hexId} level={current} {...(a.safe ? { safe: a.safe } : {})} canBack={steps.length > 1} onBack={back} onClose={close} /> : null;
  // Orientation preview on the Region back: the leg being edited (coordinated) or the one being oriented (single Move).
  const turning = draft?.filter(leg => leg.rotations.length > 1 && leg.regionId).at(-1);
  const orientation = !mode && orient && orient.regionId && steps.at(-1)?.id === 'orient' ? { regionId: orient.regionId, rotation: orient.rotations[Math.min(orient.index, orient.rotations.length - 1)]! }
    : turning ? { regionId: turning.regionId!, rotation: turning.rotations[Math.min(turning.ri, turning.rotations.length - 1)]! } : null;
  return { element, orientation, draftLegs, targets: mode && modeInfo ? { kind: mode.kind === 'move' ? 'move' : mode.kind, hexIds: modeInfo.hexes, ...(modeInfo.labels ? { labels: modeInfo.labels } : {}), ...(modeInfo.tones ? { tones: modeInfo.tones } : {}) } : null, select, background: () => { if (mode) { setFlash('Escolha um hex destacado (Esc cancela).'); return; } close(); }, close, active: !!ctx || !!mode };
}

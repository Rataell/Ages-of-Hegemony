'use client';
import { useCallback, useState, type ReactNode, type RefObject } from 'react';
import { stackCategory, stackViewVerdict } from '@aoh/game-domain';
import type { AlphaPlayerView } from '@aoh/server/alpha';
import { alphaLabel as text } from './alpha-copy';
import { cityActionGate } from './alpha-panels';
import { compositionText } from './alpha-army';
import { POSTURES, postureText } from './alpha-combat';
import { TableContextCloud, TargetChip, type CloudLevel, type CloudNode, type Safe } from './table-cloud';
import type { AlphaSend } from './alpha-board';

/**
 * Interaction Model V2 · TABLE FIRST. Everything physical on the Mesa (city, Pioneiro, stack, empty territory) is operated from a cloud born on
 * the piece; when an action is spatial the cloud folds into a pill and the MAP is the interface. Strategic catalogs stay in their own surfaces.
 */
type Game = AlphaPlayerView;
type Order = Game['self']['orders'][number];
type UrbanOption = Game['urban']['research'][number];
type Unit = Game['units'][number];
type Tab = 'city' | 'territory' | 'military';
type Ctx = { hexId: string; kind: 'city' | 'units' | 'hex'; cityId?: string; group?: string | null };
type Step = { id: string; param?: string | undefined };
type Mode = { kind: 'move' | 'explore' | 'attack' | 'mission' | 'disembark'; ids: string[]; origin: string; hexes: string[]; label: string };
type Group = { key: string; kind: 'pioneer' | 'envoy' | 'army' | 'fleet'; label: string; ids: string[] };

const RESOURCE_SHORT: Record<string, string> = { food: 'Alimento', wood: 'Madeira', stone: 'Pedra', metal: 'Metal', wealth: 'Riqueza', knowledge: 'Conhecimento', influence: 'Influência', culture: 'Cultura', materials: 'Madeira/Pedra' };
const costChips = (cost: Record<string, number> | null | undefined): ReactNode => { const parts = Object.entries(cost ?? {}).filter(([, n]) => n > 0); return <div className="ctx-cost">{parts.length ? parts.map(([k, n]) => <span key={k}>{n} {RESOURCE_SHORT[k] ?? k}</span>) : <span>Sem custo</span>}</div>; };
const optionKey = (o: UrbanOption) => JSON.stringify([o.action, o.build ?? null, o.unit ?? null, o.advancementId ?? null]);
const optionLabel = (o: UrbanOption) => o.build?.kind === 'DISTRICT' ? text(o.build.district) : o.build?.kind === 'BUILDING' ? text(o.build.building) : o.build?.kind === 'FORTIFICATION' ? 'Fortificação' : o.unit ? text(o.unit) : text(o.action);
const coords = (id: string) => { const [q, r] = id.split(',').map(Number); return { q: q ?? 0, r: r ?? 0 }; };
const distance = (a: string, b: string) => { const p = coords(a), q = coords(b); return (Math.abs(p.q - q.q) + Math.abs(p.q + p.r - q.q - q.r) + Math.abs(p.r - q.r)) / 2; };
const MOOD: Record<string, string> = { REVOLT: 'Revolta', SHAKEN: 'Abalada', STABLE: 'Estável', PROSPEROUS: 'Próspera' };
const LEVELS = ['OUTPOST', 'HAMLET', 'VILLAGE', 'CITY', 'GREAT_CITY', 'METROPOLIS', 'IMPERIAL_METROPOLIS'];

export interface TableApi {
  /** Cloud and target-mode chip, to be rendered inside the map host. */
  element: ReactNode;
  /** Legal hexes of the pending spatial decision, for the map to light up. */
  targets: { kind: string; hexIds: string[] } | null;
  /** A hex (or the player's own pieces on it) was touched. Returns true when a target-mode decision consumed the click. */
  select: (hexId: string, fromPieces?: boolean) => boolean;
  background: () => void;
  close: () => void;
  active: boolean;
}

export function useTable(a: {
  game: Game; selfId: string; locked: boolean; send: AlphaSend; queue: (order: Record<string, unknown>) => Promise<boolean>; manage: (command: Record<string, unknown>) => Promise<boolean>;
  host: RefObject<HTMLElement | null>; describeOrder: (order: Order) => string; safe?: Safe; openDetails: (tab: Tab, catalog?: boolean) => void; openBook: (tab: string) => void; hold: boolean;
}): TableApi {
  const { game, selfId, locked, send, queue, manage, host } = a;
  const [ctx, setCtx] = useState<Ctx | null>(null), [steps, setSteps] = useState<Step[]>([]), [mode, setMode] = useState<Mode | null>(null);
  const [posture, setPosture] = useState('ASSAULT'), [name, setName] = useState('Novo Horizonte'), [count, setCount] = useState(1), [rotation, setRotation] = useState(0), [flash, setFlash] = useState<string | null>(null);
  const civ = game.view.player.civilization, rules = game.rules.units;
  const ownUnits = game.units.filter(u => u.ownerId === selfId && !u.carrierId);
  const orderedIds = new Map<string, Order>();
  for (const order of game.self.orders) for (const id of 'unitIds' in order ? order.unitIds : 'unitId' in order ? [order.unitId] : []) orderedIds.set(id, order);

  const close = useCallback(() => { setCtx(null); setSteps([]); setMode(null); setFlash(null); setCount(1); }, []);
  const push = (id: string, param?: string) => { setFlash(null); setSteps(old => [...old, { id, param }]); };
  const back = useCallback(() => { setFlash(null); setSteps(old => old.length > 1 ? old.slice(0, -1) : old); }, []);
  const showDetails = (tab: Tab, catalog?: boolean) => { close(); a.openDetails(tab, catalog); };
  const finish = (ok: boolean) => { if (ok) close(); return ok; };

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
      if (!mode.hexes.includes(hexId)) { setFlash('Fora do alcance: escolha um hex destacado.'); return true; }
      commit(hexId);
      return true;
    }
    const myCity = civ.cities.find(c => c.hexId === hexId), groups = groupsAt(hexId);
    const next: Ctx = fromPieces && groups.length ? { hexId, kind: 'units', group: groups[0]!.key } : myCity ? { hexId, kind: 'city', cityId: myCity.id } : groups.length ? { hexId, kind: 'units', group: groups[0]!.key } : { hexId, kind: 'hex' };
    if (ctx && ctx.hexId === hexId && ctx.kind === next.kind && !fromPieces) { close(); return false; }
    setCtx(next); setSteps([{ id: 'root' }]); setFlash(null);
    return false;
  };

  // ---------- spatial decisions: the map is the interface ----------
  const startMode = (group: Group, kind: Mode['kind']) => {
    if (kind === 'disembark') {
      const cargo = game.units.filter(u => u.ownerId === selfId && u.carrierId && group.ids.includes(u.carrierId));
      const lists = cargo.map(u => game.unitOptions[u.id]?.disembark ?? []);
      const hexes = lists.length ? lists[0]!.filter(h => lists.every(list => list.includes(h))) : [];
      setFlash(null); setMode({ kind, ids: cargo.map(u => u.id), origin: ownUnits.find(u => u.id === group.ids[0])!.hexId, hexes, label: 'Desembarcar: escolha a terra no mapa' });
      return;
    }
    const opts = group.ids.map(id => game.unitOptions[id]).filter((o): o is NonNullable<typeof o> => o !== undefined);
    if (opts.length !== group.ids.length || !opts.length) return;
    let hexes: string[] = [], label = '';
    if (kind === 'move') { hexes = Object.keys(opts[0]!.moves).filter(h => opts.every(o => o.moves[h])); label = `Mover ${group.label}: escolha o destino no mapa`; }
    if (kind === 'explore') { hexes = [...new Set(opts[0]!.explore.flatMap(r => r.hexIds))]; label = 'Explorar: escolha a Região destacada'; }
    if (kind === 'attack' || kind === 'mission') {
      const origin = ownUnits.find(u => u.id === group.ids[0])!.hexId;
      const foreign = new Set<string>([...game.view.visibleCities.filter(c => c.ownerId !== selfId).map(c => c.hexId), ...(kind === 'attack' ? game.units.filter(u => u.ownerId !== selfId && !u.carrierId).map(u => u.hexId) : [])]);
      hexes = [...foreign].filter(h => distance(origin, h) === 1);
      if (kind === 'mission') hexes = game.view.visibleCities.filter(c => c.ownerId !== selfId && distance(origin, c.hexId) <= 1).map(c => c.hexId);
      label = kind === 'attack' ? `Atacar (${postureText(posture)}): escolha o alvo no mapa` : 'Missão de influência: escolha a cidade';
    }
    setFlash(null); setMode({ kind, ids: group.ids, origin: ownUnits.find(u => u.id === group.ids[0])!.hexId, hexes, label });
  };
  const hostileTo = (hexId: string) => {
    const city = game.view.visibleCities.find(c => c.hexId === hexId), other = city?.ownerId ?? game.units.find(u => u.hexId === hexId && u.ownerId !== selfId)?.ownerId;
    if (!other) return { other: null as string | null, hostile: false, name: '' };
    const hostile = game.wars.some(pair => pair.includes(other)) || game.self.plannedActions.some(p => p.type === 'DECLARE_WAR' && p.targetId === other);
    return { other, hostile, name: game.players.find(p => p.id === other)?.name ?? 'esta civilização' };
  };
  const commit = (hexId: string) => {
    if (!mode) return;
    const opts = mode.ids.map(id => game.unitOptions[id]!);
    if (mode.kind === 'disembark') { void send({ type:'DISEMBARK', unitIds: mode.ids, hexId }).then(finish); return; }
    if (mode.kind === 'move') {
      const block = stackViewVerdict(game.stacks, mode.ids.map(id => stackCategory(rules[game.units.find(u => u.id === id)!.kind]!)), hexId);
      if (block) { setFlash(block); return; }
      void queue({ type:'MOVE', unitIds: mode.ids, path: opts[0]!.moves[hexId] }).then(finish);
    } else if (mode.kind === 'explore') {
      const region = opts[0]!.explore.find(r => r.hexIds.includes(hexId));
      if (region) void queue({ type:'EXPLORE', unitId: mode.ids[0], target: region.target, rotation }).then(finish);
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
      const reason = reasonOf(o); return { id: action, label, icon, tone, hint: o.effect, disabled: reason, onSelect: () => (reason ? setFlash(reason) : run(o)) };
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
      const o = [...options, ...game.urban.research].find(x => optionKey(x) === step.param);
      if (!o) return { id: 'confirm:none', title, nodes: [] };
      const reason = reasonOf(o), max = Math.max(1, Math.min(6, game.recruitLimits[city.id] ?? 1)), qty = Math.min(count, max);
      return { id: `confirm:${step.param}`, title: optionLabel(o), subtitle: title, nodes: [], note: reason, card: <div className="ctx-card">{costChips(o.cost)}<p>{o.effect}</p>
        {o.action === 'RECRUIT' && max > 1 && <label>Quantidade<select value={qty} onChange={e => setCount(Number(e.target.value))}>{Array.from({ length: max }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></label>}
        <button type="button" className="ctx-go" disabled={reason !== null} onClick={() => run(o, o.action === 'RECRUIT' && qty > 1 ? { count: qty } : {})}>Confirmar</button></div> };
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
      const extra: (CloudNode | null)[] = [rootIds.has('ELEVATE') ? null : direct('ELEVATE', 'Elevar', 'elevate'), rootIds.has('PROMOTE_MOOD') ? null : direct('PROMOTE_MOOD', 'Governar', 'govern'), direct('SUPPORT_TRADE', 'Comércio', 'trade'), direct('CIVIC_ACTION', 'Ação cívica', 'civic'), direct('MOVE_CAPITAL', 'Mover capital', 'found'),
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
      const list = [produce, build, recruit, govern, elevate].filter((n): n is CloudNode => n !== null);
      if (!list.some(n => n.tone === 'dominant')) { const first = list.find(n => !n.disabled) ?? list[0]; if (first) first.tone = 'dominant'; }
      // Four at most: the opportunity (Elevar) displaces Governar while the city is calm.
      const limited = list.length > 4 ? list.filter(n => n.id !== (revolt ? 'ELEVATE' : 'PROMOTE_MOOD')) : list;
      return [...(cancel ? [cancel] : []), ...limited.slice(0, cancel ? 3 : 4), more()];
    }
    void back0;
    return { id: 'root', title, subtitle, nodes: rootNodes(), note: flash ?? (planned ? `Planejado: ${text(planned.action)}. A cidade já usou sua ativação.` : null) };
  };

  const unitLevel = (c: Ctx, step: Step): CloudLevel => {
    const groups = groupsAt(c.hexId), group = groups.find(g => g.key === c.group) ?? groups[0];
    if (!group) return { id: 'empty', title: 'Sem peças', nodes: [] };
    const units = group.ids.map(id => game.units.find(u => u.id === id)!).filter(Boolean) as Unit[];
    const subtitle = group.kind === 'army' || group.kind === 'fleet' ? compositionText(units) : group.kind === 'pioneer' ? 'Explora ou funda · civil' : 'Missões de influência · civil';
    const tabs = groups.length > 1 ? groups.map(g => ({ id: g.key, label: g.label, active: g.key === group.key, onSelect: () => { setCtx({ ...c, group: g.key }); setSteps([{ id: 'root' }]); setMode(null); } })) : undefined;
    const opts = group.ids.map(id => game.unitOptions[id]).filter((o): o is NonNullable<typeof o> => o !== undefined);
    const ordered = group.ids.map(id => orderedIds.get(id)).find(Boolean);
    const busy = ordered ? 'Esta peça já tem ordem nesta rodada: troque a ordem para escolher outra.' : gate;
    const common = (key: 'moves') => opts.length === group.ids.length && opts.length ? Object.keys(opts[0]![key]).filter(h => opts.every(o => o[key][h])) : [];
    const moveHexes = common('moves'), exploreRegions = group.ids.length === 1 && opts[0] ? opts[0].explore : [];
    const settleBlock = group.kind === 'pioneer' && opts[0] ? opts[0].settleBlock : 'x';
    const origin = c.hexId;
    const attackable = [...new Set([...game.view.visibleCities.filter(x => x.ownerId !== selfId).map(x => x.hexId), ...game.units.filter(u => u.ownerId !== selfId && !u.carrierId).map(u => u.hexId)])].filter(h => distance(origin, h) === 1);
    const fighters = units.every(u => (rules[u.kind]?.strength ?? 0) > 0);
    const hostileNow = attackable.some(h => hostileTo(h).hostile);
    const missionTargets = game.view.visibleCities.filter(x => x.ownerId !== selfId && distance(origin, x.hexId) <= 1);
    const cancel = cancelNode(ordered);
    const move: CloudNode = { id: 'move', label: 'Mover', icon: 'move', disabled: busy ?? (moveHexes.length ? null : 'Sem destino alcançável nesta rodada.'), onSelect: () => (busy ? setFlash(busy) : moveHexes.length ? startMode(group, 'move') : setFlash('Sem destino alcançável nesta rodada.')) };
    const detailsNode: CloudNode = { id: 'details', label: 'Ver detalhes', icon: 'details', onSelect: () => showDetails('military') };
    if (step.id === 'settle') {
      const reason = busy ?? (typeof settleBlock === 'string' ? settleBlock : null);
      return { id: 'settle', title: 'Fundar cidade', subtitle: `em ${c.hexId}`, nodes: [], note: reason, card: <div className="ctx-card">{costChips(game.costs.founding)}<label>Nome<input value={name} maxLength={80} onChange={e => setName(e.target.value)} /></label>
        <button type="button" className="ctx-go" disabled={reason !== null || !name.trim()} onClick={() => void send({ type:'SETTLE', unitId: group.ids[0], name }).then(finish)}>Fundar</button></div> };
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
      const settleOk = settleBlock === null, exploreOk = exploreRegions.length > 0;
      nodes = [
        { id: 'explore', label: 'Explorar', icon: 'explore', tone: exploreOk && !busy ? 'dominant' : 'alt', disabled: busy ?? (exploreOk ? null : 'Nenhuma Região fechada ao alcance: mova o Pioneiro até a borda.'), onSelect: () => (busy ? setFlash(busy) : exploreOk ? startMode(group, 'explore') : setFlash('Nenhuma Região fechada ao alcance: mova o Pioneiro até a borda.')) },
        { ...move, tone: !exploreOk && !settleOk && !busy ? 'dominant' : 'alt' },
        { id: 'found', label: 'Fundar', icon: 'found', tone: settleOk && !exploreOk && !busy ? 'dominant' : 'alt', disabled: busy, onSelect: () => (busy ? setFlash(busy) : push('settle')) },
      ];
    } else if (group.kind === 'envoy') {
      nodes = [{ id: 'mission', label: 'Missão', icon: 'people', tone: missionTargets.length && !busy ? 'dominant' : 'alt', disabled: busy ?? (missionTargets.length ? null : 'Leve o Enviado a uma cidade estrangeira vizinha.'), onSelect: () => (busy ? setFlash(busy) : missionTargets.length ? startMode(group, 'mission') : setFlash('Leve o Enviado a uma cidade estrangeira vizinha.')) }, { ...move, tone: !missionTargets.length && !busy ? 'dominant' : 'alt' }];
    } else {
      const attackReason = busy ?? (!fighters ? 'Peças civis não atacam.' : attackable.length ? null : 'Nenhum alvo a 1 hex.');
      nodes = [{ ...move, tone: hostileNow && !busy ? 'alt' : busy ? 'alt' : 'dominant' },
        { id: 'attack', label: 'Atacar', icon: 'attack', tone: hostileNow && !busy ? 'dominant' : 'alt', disabled: attackReason, badge: attackable.length ? String(attackable.length) : null, onSelect: () => (attackReason ? setFlash(attackReason) : startMode(group, 'attack')) },
        { id: 'posture', label: 'Postura', icon: 'posture', badge: postureText(posture), onSelect: () => push('posture') }];
    }
    return { id: 'root', title: group.kind === 'army' || group.kind === 'fleet' ? group.label.toUpperCase() : group.label.toUpperCase(), subtitle, nodes: [...(cancel ? [cancel, ...nodes.map(n => ({ ...n, tone: n.tone === 'dominant' ? 'alt' as const : n.tone }))] : nodes), more()].slice(0, 5 + (cancel ? 1 : 0)), note: flash ?? (ordered ? `Ordem: ${a.describeOrder(ordered)}` : null), tabs };
  };

  const hexLevel = (c: Ctx, step: Step): CloudLevel => {
    const tile = game.view.visibleTerritory.find(t => t.id === c.hexId), known = !!tile && tile.terrain !== 'UNKNOWN';
    const mine = tile?.ownerId === selfId, claimCity = civ.cities.find(city => (game.claimOptions[city.id] ?? []).includes(c.hexId));
    const title = known ? text(tile!.terrain) : 'Região fechada', subtitle = known ? `${c.hexId}${tile!.ownerId ? ` · ${game.players.find(p => p.id === tile!.ownerId)?.name ?? ''}` : ' · livre'}` : 'Explore com um Pioneiro';
    const detailsNode: CloudNode = { id: 'details', label: 'Ver detalhes', icon: 'details', onSelect: () => showDetails('territory') };
    const improvements = Object.keys(game.view.config.territory.improvementCatalog);
    if (step.id === 'improve') return { id: 'improve', title: 'Melhorar', subtitle: c.hexId, nodes: improvements.map(kind => ({ id: kind, label: text(kind), icon: 'improve' as const, disabled: gate, onSelect: () => push('confirm-improve', kind) })), note: flash };
    if (step.id === 'confirm-improve') { const kind = step.param!; return { id: `confirm-improve:${kind}`, title: text(kind), subtitle: c.hexId, nodes: [], card: <div className="ctx-card">{costChips(game.costs.improvements[kind])}<button type="button" className="ctx-go" disabled={gate !== null} onClick={() => void manage({ type:'IMPROVE_HEX', hexId: c.hexId, improvement: kind }).then(finish)}>Confirmar</button></div> }; }
    if (step.id === 'confirm-road') return { id: 'confirm-road', title: 'Estrada', subtitle: c.hexId, nodes: [], card: <div className="ctx-card">{costChips(game.costs.road)}<button type="button" className="ctx-go" disabled={gate !== null} onClick={() => void send({ type:'BUILD_ROAD', hexId: c.hexId }).then(finish)}>Construir</button></div> };
    const claim: CloudNode | null = claimCity ? { id: 'claim', label: 'Reivindicar', icon: 'claim', tone: 'dominant', badge: claimCity.name.split(' ')[0], hint: `Para ${claimCity.name}`, disabled: gate, onSelect: () => void manage({ type:'CLAIM_HEX', cityId: claimCity.id, hexId: c.hexId }).then(finish) } : null;
    const nodes: CloudNode[] = [claim, mine ? { id: 'improve', label: 'Melhorar', icon: 'improve', tone: claim ? 'alt' : 'dominant', disabled: gate, onSelect: () => push('improve') } : null, mine ? { id: 'road', label: 'Estrada', icon: 'road', disabled: gate, onSelect: () => push('confirm-road') } : null, detailsNode].filter((n): n is CloudNode => n !== null);
    return { id: 'root', title, subtitle, nodes: nodes.length > 1 ? [...nodes.slice(0, -1), { ...nodes.at(-1)!, id: 'more', label: '', icon: 'more', tone: 'quiet', hint: 'Ver detalhes' }] : nodes, note: flash };
  };

  const level = (): CloudLevel | null => {
    if (!ctx) return null;
    const step = steps.at(-1) ?? { id: 'root' };
    if (ctx.kind === 'city' && civ.cities.some(x => x.id === ctx.cityId)) return cityLevel(ctx, step);
    if (ctx.kind === 'units') return unitLevel(ctx, step);
    if (ctx.kind === 'hex') return hexLevel(ctx, step);
    return null;
  };

  const current = mode ? null : level();
  const element = a.hold ? null : mode
    ? <TargetChip host={host} hexId={mode.origin} {...(a.safe ? { safe: a.safe } : {})} text={flash ?? mode.label} tone={mode.kind === 'attack' ? 'attack' : 'move'} onCancel={() => { setMode(null); setFlash(null); }}>
      {mode.kind === 'explore' && <button type="button" onClick={() => setRotation(r => (r + 1) % 6)} title="Orientação da Região, se ninguém a explorou ainda">↻ {rotation * 60}°</button>}</TargetChip>
    : ctx && current ? <TableContextCloud host={host} hexId={ctx.hexId} level={current} {...(a.safe ? { safe: a.safe } : {})} canBack={steps.length > 1} onBack={back} onClose={close} /> : null;
  return { element, targets: mode ? { kind: mode.kind === 'move' ? 'move' : mode.kind, hexIds: mode.hexes } : null, select, background: () => { if (mode) { setFlash('Escolha um hex destacado (Esc cancela).'); return; } close(); }, close, active: !!ctx || !!mode };
}

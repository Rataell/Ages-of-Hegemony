'use client';
import { useEffect, useRef, useState } from 'react';
import { ADVANCEMENTS, AlphaEraSchema, ALPHA_ERA_NUMERALS, LEADERS, WEB_DOMAIN_NAMES, WebDomainSchema, civilizationDisplayName, civilizationKit, classifyResonance, heritageOf, repercussionCard, type WebDomain } from '@aoh/game-domain';
import type { AlphaPlayerView } from '@aoh/server/alpha';
import { sealArt } from './table-art';
import { alphaLabel as text } from './alpha-copy';
import { cityActionGate } from './alpha-panels';
import type { AlphaSend } from './alpha-board';
import { GovernmentPanel } from './alpha-era-turn';
import { StrategicSurface } from './strategic-surface';
import { PanZoom } from './pan-zoom';
import { CivilizationCard, FigureCard, StatusBadge, discoveryArtOf } from './alpha-card';
import { ActionFicha } from './action-ficha';
import { useActionPreview, type ActionPreviewData } from './action-preview';
import { loadMemory, saveMemory } from './action-ficha-memory';
import { remember } from './action-ficha-model';
import { DomainGlyph, PlacedCube, ReservePile, ResonanceEcho, advanceName, tokenLabel } from './resonance-parts';

const COMPOSITION_NAME = { DOMINANT: 'Dominante', HYBRID: 'Híbrida', PAIR: 'Par', CONFLUENCE: 'Confluência' } as const;
const DOMAIN_CLASS = (domains: readonly WebDomain[]) => `d-${domains[0]}${domains[1] ? ` d2-${domains[1]}` : ''}`;
const ERAS = AlphaEraSchema.options;

/** Why the node cannot be researched from the Teia's structure alone (resources and the city's Order are judged by the button). */
function structuralBlock(research: readonly string[], era: string, node: (typeof ADVANCEMENTS)[number]): string | null {
  if (research.includes(node.id)) return 'Pesquisado.';
  if (ERAS.indexOf(era as (typeof ERAS)[number]) < ERAS.indexOf(node.era)) return `Abre na Era ${ALPHA_ERA_NUMERALS[ERAS.indexOf(node.era)]}.`;
  const missing = node.prerequisites.filter(id => !research.includes(id));
  if (missing.length) return `Falta: ${missing.map(id => ADVANCEMENTS.find(n => n.id === id)?.name ?? id).join(', ')}.`;
  if (node.prerequisitesAny.length && !node.prerequisitesAny.some(id => research.includes(id))) return `Falta um de: ${node.prerequisitesAny.map(id => ADVANCEMENTS.find(n => n.id === id)?.name ?? id).join(', ')}.`;
  if (node.excludes.some(id => research.includes(id))) return 'Fechado pela escolha OU.';
  return null;
}

/** The Repercussão (or Encontro, or Pulso choice) as a parchment card: two options, the price and what mitigates it. */
export function ChoiceParchment({ choice, locked, send }: { choice: AlphaPlayerView['self']['pendingChoices'][number]; locked: boolean; send: AlphaSend }) {
  const card = repercussionCard(choice.cardId);
  const mitigators = (card?.mitigatedBy ?? []).map(id => ADVANCEMENTS.find(n => n.id === id)?.name ?? id);
  const encounter = choice.source === 'ENCOUNTER';
  return <article className={`alpha-parchment${encounter ? ' is-encounter' : ''}`} aria-label={choice.title}>
    {encounter && <span className="alpha-parchment-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: discoveryArtOf(choice.cardId?.startsWith('enc-ruin-') ? 'RUIN' : 'NONE', 30) }} />}
    <small>{choice.source === 'REPERCUSSION' ? 'REPERCUSSÃO' : choice.source === 'ENCOUNTER' ? 'ENCONTRO' : 'PULSO'}{card ? ` · ${COMPOSITION_NAME[card.kind]}${card.domains.length ? ` · ${card.domains.map(d => WEB_DOMAIN_NAMES[d]).join(' + ')}` : ''}` : ''}</small>
    <h3>{choice.title}</h3><p>{choice.text}</p>
    {card && card.price.length > 0 && <p className="alpha-parchment-price">{choice.mitigated ? 'Preço evitado: mitigado por sua Teia.' : 'Há um preço, aplicado já.'}{mitigators.length > 0 && <> Mitigado por <b>{mitigators.join(', ')}</b>.</>}</p>}
    <div className="alpha-parchment-options">{choice.options.map(option => <button key={option.id} type="button" disabled={locked} onClick={() => void send({ type: 'RESOLVE_CHOICE', choiceId: choice.id, optionId: option.id })}>{option.label}</button>)}</div>
  </article>;
}

type Node = (typeof ADVANCEMENTS)[number];
/** The selected advancement as ONE small card: [Resumo] [Desbloqueia] swap in place, so the card never grows over the Teia. */
function NodeDetail({ node, done, why, opt, gate, cost, unlocks, locked, cityId, cityName, roomId, version, onResearch }: { node: Node; done: boolean; why: string | null; opt: { blocked: string | null } | undefined; gate: string | null; cost: Record<string, number>; unlocks: Node[]; locked: boolean; cityId: string | null; cityName: string | null; roomId: string; version: number; onResearch: (id: string, preview: ActionPreviewData | null) => void }) {
  const [page, setPage] = useState<'summary' | 'unlocks'>('summary'), [asking, setAsking] = useState(false);
  // Pesquisar goes through the Ficha de Ação too: the engine names what is missing (resources, Era, prerequisite) before the Ordem Avanço is spent.
  const preview = useActionPreview(roomId, asking && cityId ? { type: 'URBAN_ACTION', cityId, action: 'RESEARCH', advancementId: node.id } : null, version);
  const reason = done ? null : why ?? gate ?? opt?.blocked ?? null;
  const name = (id: string) => ADVANCEMENTS.find(n => n.id === id)?.name;
  return <article className="alpha-node-detail" aria-label={node.name}>
    <header><h4>{node.name}</h4><small>{WEB_DOMAIN_NAMES[node.domain]} · Era {ALPHA_ERA_NUMERALS[ERAS.indexOf(node.era)]}{node.convergence ? ' · Convergência' : ''}{node.pair ? ' · escolha OU' : ''}{node.milestone ? ' · ★ +3 Prestígio' : ''}</small></header>
    <div className="alpha-seg is-sub" role="tablist" aria-label="Avanço">{([['summary', 'Resumo'], ['unlocks', 'Desbloqueia']] as const).map(([key, title]) => <button key={key} type="button" role="tab" aria-selected={page === key} onClick={() => setPage(key)}>{title}</button>)}</div>
    <div className="alpha-node-page" key={page}>{page === 'summary'
      ? <p>{node.description}</p>
      : <>{node.prerequisites.length > 0 && <p>Requer: {node.prerequisites.map(name).join(' · ')}</p>}{node.prerequisitesAny.length > 0 && <p>Requer um de: {node.prerequisitesAny.map(name).join(' · ')}</p>}{node.excludes.length > 0 && <p>Fecha: {node.excludes.map(name).join(' · ')}</p>}<p>Abre: {unlocks.length ? unlocks.map(n => n.name).join(' · ') : 'nada além de si mesmo'}</p></>}</div>
    <div className="alpha-node-act">{!done && <span>Custo: {Object.entries(cost).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${text(k)}`).join(' · ') || 'nenhum'}</span>}{reason && !done && <small role="note">{reason}</small>}
      {asking && !done && cityId
        ? <div className="alpha-node-ficha"><ActionFicha title={`Pesquisar ${node.name}`} preview={preview} cityName={cityName} gate={locked ? 'Você já confirmou esta fase.' : null} confirmLabel="Confirmar Pesquisar" onConfirm={() => { onResearch(node.id, preview.status === 'ready' ? preview.data : null); setAsking(false); }} /><button type="button" className="afi-link" onClick={() => setAsking(false)}>Voltar</button></div>
        : <button type="button" className={reason === null && !done ? 'primary' : ''} disabled={locked || done || !cityId} onClick={() => setAsking(true)}>{done ? 'Marco permanente' : 'Pesquisar · Ordem Avanço'}</button>}</div>
  </article>;
}

export type CivView = 'web' | 'heritage' | 'identity';
export function AlphaCivBoard({ game, roomId, selfName, seatColor, cityId, locked, send, manage, onClose, initialView = 'web' }: { game: AlphaPlayerView; roomId: string; selfName: string; /** The player's own seat colour: every cube on this board is theirs. */ seatColor: string; cityId: string | null; locked: boolean; send: AlphaSend; manage: AlphaSend; onClose: () => void; initialView?: CivView }) {
  const self = game.self;
  const kit = civilizationKit(self.civilization);
  const leader = LEADERS.find(l => l.id === self.leader?.leaderId);
  const gov = game.government.current;
  const eraIndex = ERAS.indexOf(self.era);
  const slots = self.resonance.slots, composition = slots.length ? classifyResonance(slots) : null;
  const [selected, setSelected] = useState<string | null>(null), [view, setView] = useState<CivView>(initialView), [idPage, setIdPage] = useState<'identity' | 'leader' | 'government'>('identity');
  // Research flow: a mark that appeared since the last render drops its cube on the node, then an echo of that cube travels to the next cavity.
  const known = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => {
    const now = new Set(self.resonance.marks.map(mark => mark.advancementId));
    if (known.current) {
      const added = [...now].filter(id => !known.current!.has(id));
      if (added.length) { setFresh(new Set(added)); const timer = setTimeout(() => setFresh(new Set()), 2400); known.current = now; return () => clearTimeout(timer); }
    }
    known.current = now;
    return undefined;
  }, [self.resonance.marks]);
  const lastCycle = self.resonance.history.at(-1);
  // The engine empties the five sockets the moment the fifth is placed and parks a Repercussão choice. On the table the five tokens stay in their cavities
  // (as "ciclo completo") until that choice is resolved, then the tray clears; the permanent marks on the Teia never move.
  const pendingRepercussion = self.pendingChoices.find(choice => choice.source === 'REPERCUSSION');
  const completed = slots.length === 0 && pendingRepercussion && lastCycle && lastCycle.cardId === pendingRepercussion.cardId ? lastCycle.slots : null;
  const tray: readonly { advancementId: string; source: 'WEB' | 'CONVERGENCE' | 'HERITAGE'; domains: readonly WebDomain[] }[] = completed ?? slots;
  const shown = useRef<typeof tray>([]), ghostTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ghost, setGhost] = useState<typeof tray | null>(null);
  // The view is re-read on every poll, so `tray` is a new array each time: the clearing timer must outlive those re-renders.
  useEffect(() => {
    if (shown.current.length === 5 && tray.length === 0) { setGhost(shown.current); if (ghostTimer.current) clearTimeout(ghostTimer.current); ghostTimer.current = setTimeout(() => setGhost(null), 900); }
    shown.current = tray;
  }, [tray]);
  useEffect(() => () => { if (ghostTimer.current) clearTimeout(ghostTimer.current); }, []);
  const [spotlight, setSpotlight] = useState(true);
  useEffect(() => { const timer = setTimeout(() => setSpotlight(false), 1600); return () => clearTimeout(timer); }, []);
  // A new advance: its cube lands on its node (CSS), then an ECHO of it travels from the node to its cavity (the permanent cube stays).
  useEffect(() => {
    if (fresh.size === 0 || typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const couriers: Animation[] = [], parts: HTMLElement[] = [];
    [...fresh].forEach((id, order) => {
      const from = document.querySelector<HTMLElement>(`[data-advance="${id}"] .aoh-cube`), to = document.querySelector<HTMLElement>(`[data-cavity-of="${id}"] .aoh-cube`);
      if (!from || !to) return;
      const a = from.getBoundingClientRect(), b = to.getBoundingClientRect(), ghostToken = from.cloneNode(true) as HTMLElement;
      ghostToken.classList.add('aoh-courier', 'is-echo'); Object.assign(ghostToken.style, { position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`, margin: '0', zIndex: '60', pointerEvents: 'none', opacity: '0' });
      document.body.appendChild(ghostToken); parts.push(ghostToken);
      const dx = b.left - a.left, dy = b.top - a.top, scale = b.width / Math.max(1, a.width);
      const run = ghostToken.animate([{ opacity: 1, transform: 'translate(0,0) scale(1)', offset: 0 }, { opacity: 1, transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 26}px) scale(${1 + (scale - 1) * 0.5 + 0.35})`, offset: 0.55 }, { opacity: 1, transform: `translate(${dx}px, ${dy}px) scale(${scale})`, offset: 1 }], { duration: 520, delay: 380 + order * 260, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'both' });
      run.onfinish = () => ghostToken.remove();
      couriers.push(run);
    });
    return () => { couriers.forEach(run => run.cancel()); parts.forEach(part => part.remove()); };
  }, [fresh]);
  const node = selected ? ADVANCEMENTS.find(n => n.id === selected) ?? null : null;
  const heritage = heritageOf(self.civilization);
  const gate = cityActionGate(game, cityId, 'RESEARCH');
  const research = (id: string, preview: ActionPreviewData | null = null) => void send({ type: 'URBAN_ACTION', cityId, action: 'RESEARCH', advancementId: id }).then(ok => {
    if (ok && preview && cityId) saveMemory(roomId, [...loadMemory(roomId), remember(roomId, game.view.round, { cityId, action: 'RESEARCH', advancementId: id }, preview)]);
  });
  const cityName = game.view.player.civilization.cities.find(c => c.id === cityId)?.name ?? null;
  // Focus: the chosen advancement, what it needs and what it opens stay lit; the rest of the Teia recedes.
  const focus = (() => {
    if (!node) return null;
    const before = new Set([...node.prerequisites, ...node.prerequisitesAny]), after = new Set(ADVANCEMENTS.filter(n => n.prerequisites.includes(node.id) || n.prerequisitesAny.includes(node.id)).map(n => n.id));
    return { before, after };
  })();
  const focusClass = (id: string) => !focus ? '' : id === selected ? '' : focus.before.has(id) ? ' is-focus-before' : focus.after.has(id) ? ' is-focus-after' : ' is-dim';
  const linkedSlot = node ? slots.findIndex(slot => slot.advancementId === node.id) : -1;
  const nodeButton = (n: (typeof ADVANCEMENTS)[number]) => {
    const done = self.research.includes(n.id), why = structuralBlock(self.research, self.era, n), reachable = !done && why === null;
    const mark = self.resonance.marks.find(m => m.advancementId === n.id);
    return <button key={n.id} type="button" className={`alpha-node ${DOMAIN_CLASS(mark?.domains ?? [n.domain])}${done ? ' is-done' : ''}${reachable ? ' is-reachable' : ''}${n.pair ? ' is-or' : ''}${fresh.has(n.id) ? ' is-fresh' : ''}${selected === n.id ? ' is-selected' : ''}${focusClass(n.id)}`}
      data-advance={n.id} aria-pressed={selected === n.id} onClick={() => setSelected(n.id)} title={`${n.name}${done ? ' · pesquisado' : reachable ? ' · ao alcance' : ` · ${why}`}`}>
      <span className="aoh-seat" aria-hidden="true">{done && <PlacedCube domains={mark?.domains ?? [n.domain]} color={seatColor} size={22} />}</span>{n.milestone && <b className="alpha-node-star" aria-hidden="true">★</b>}<span>{n.name}</span></button>;
  };
  return <StrategicSurface className="alpha-civ" label="Tabuleiro da Civilização" onClose={onClose}>
    <header className="alpha-civ-head">
      {kit && <svg width="44" height="44" viewBox="-22 -22 44 44" aria-hidden="true" dangerouslySetInnerHTML={{ __html: sealArt(kit.mark, 'currentColor', 17) }} />}
      <div><p className="aoh-eyebrow">TABULEIRO DA CIVILIZAÇÃO</p><h2>{self.civilization ? civilizationDisplayName(self.civilization) : selfName}</h2></div>
      <dl className="alpha-civ-facts"><div><dt>Era</dt><dd>{ALPHA_ERA_NUMERALS[eraIndex]} · {text(self.era)}</dd></div><div><dt>Figura</dt><dd>{leader?.name ?? '—'}</dd></div><div><dt>Governo</dt><dd>{gov.name}</dd></div></dl>
      <button type="button" className="aoh-btn is-sm alpha-civ-close" onClick={onClose}>Voltar ao mapa</button>
    </header>
      {self.pendingChoices.length > 0 && <div className="alpha-civ-choices is-compact">{self.pendingChoices.map(choice => choice.source === 'PULSE'
      ? <p key={choice.id} className="alpha-civ-pulse" role="status"><b>Decisão do Pulso:</b> {choice.title}. <button type="button" onClick={onClose}>Responder no mapa</button></p>
      : <ChoiceParchment key={choice.id} choice={choice} locked={locked} send={send} />)}</div>}
    <div className="alpha-civ-layout">
      <section className="alpha-civ-resonance" aria-label="Ressonância">
        <h3>A · Ressonância</h3>
        <div className={`alpha-big-sockets aoh-tray${completed ? ' is-complete' : ''}${ghost ? ' is-clearing' : ''}${spotlight ? ' is-spotlight' : ''}`} role="group" aria-label={`${completed ? 5 : slots.length} de 5 encaixes${completed ? ': ciclo completo' : ''}`}>{Array.from({ length: 5 }, (_, i) => {
          const slot = (ghost ?? tray)[i], isNew = !!slot && fresh.has(slot.advancementId);
          return <button type="button" key={i} disabled={!slot || !!ghost} data-cavity-of={slot?.advancementId} style={{ ['--i' as string]: i, ['--drop-delay' as string]: view === 'web' ? '1.4s' : '0s' }}
            aria-label={slot ? `Encaixe ${i + 1}: ${advanceName(slot.advancementId)} (${tokenLabel(slot.domains, slot.source)})` : `Encaixe ${i + 1} livre`}
            onClick={() => { if (slot) { setSelected(slot.advancementId); setView(ADVANCEMENTS.some(n => n.id === slot.advancementId) ? 'web' : 'heritage'); } }}
            className={`alpha-socket is-big aoh-cavity${slot ? ' is-full' : ''}${!slot && i === slots.length && slots.length === 4 ? ' is-fifth' : ''}${isNew ? ' is-fresh' : ''}${linkedSlot === i ? ' is-linked' : ''}`}
            title={slot ? `${advanceName(slot.advancementId)} · ${tokenLabel(slot.domains, slot.source)}` : i === 4 ? 'O quinto encaixe resolve uma Repercussão.' : 'Encaixe livre'}>
            {slot ? <ResonanceEcho domains={slot.domains} color={seatColor} size={31} /> : <span className="aoh-cavity-n" aria-hidden="true">{i + 1}</span>}
          </button>;
        })}</div>
        <p className="aoh-tray-count" aria-hidden="true"><b>{completed ? 5 : slots.length}</b> / 5{completed ? ' · ciclo completo' : ''}</p>
        <p className="alpha-composition" role="status">{completed ? <>Ciclo completo: <b>{COMPOSITION_NAME[lastCycle!.kind]}</b>{lastCycle!.kind === 'CONFLUENCE' ? '' : ` · ${lastCycle!.domains.map(d => WEB_DOMAIN_NAMES[d]).join(' + ')}`}</> : composition ? <>Leitura: <b>{COMPOSITION_NAME[composition.kind]}</b> · {composition.domains.map(d => WEB_DOMAIN_NAMES[d]).join(' + ')}</> : 'Nenhum avanço neste ciclo.'} · ciclos resolvidos: {self.resonance.cycles}</p>
        {lastCycle && !completed && <p className="alpha-hint">Último ciclo (rodada {lastCycle.round}): {COMPOSITION_NAME[lastCycle.kind]} · {repercussionCard(lastCycle.cardId)?.name ?? lastCycle.cardId}.</p>}
        <div className="alpha-reserve" aria-label="Reserva"><ReservePile color={seatColor} /><small>Reserva · seus cubos. Visual: nunca um limite.</small></div>
      </section>
      <div className="alpha-civ-main">
      <div className="alpha-civ-tabs" role="tablist" aria-label="Áreas do Tabuleiro">{([['web', 'Teia Civilizacional'], ['heritage', 'Herança'], ['identity', 'Identidade e Governo']] as const).map(([key, title]) => <button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => setView(key)}>{title}</button>)}</div>
        {view === 'web' && <section className="alpha-civ-web alpha-civ-view" aria-label="Teia Civilizacional">
        <h3>B · Teia Civilizacional <small>{self.research.filter(id => ADVANCEMENTS.some(n => n.id === id)).length} de 50 · cubo seu = avanço pesquisado (glifo gravado = domínio) · losango = Convergência · borda tracejada = escolha OU</small></h3>
        <PanZoom label="Teia Civilizacional: arraste para mover, role para aproximar" onBackground={() => setSelected(null)}><div className="alpha-web-grid" style={{ ['--tracks' as string]: WebDomainSchema.options.length }}>
          <div className="alpha-web-corner" aria-hidden="true" />
          {WebDomainSchema.options.map(domain => <b key={domain} className={`alpha-web-head d-${domain}`}>{WEB_DOMAIN_NAMES[domain]}</b>)}
          {ERAS.map((era, index) => {
            const dim = index > eraIndex, converge = ADVANCEMENTS.filter(n => n.convergence && n.era === era);
            return [
              <b key={`${era}-label`} className={`alpha-web-era${index === eraIndex ? ' is-now' : ''}`}>{ALPHA_ERA_NUMERALS[index]}</b>,
              ...WebDomainSchema.options.map(domain => <div key={`${era}-${domain}`} className={`alpha-web-cell${dim ? ' is-later' : ''}`}>{ADVANCEMENTS.filter(n => !n.convergence && n.domain === domain && n.era === era).map(nodeButton)}</div>),
              converge.length > 0 && <div key={`${era}-conv`} className={`alpha-web-convergences${dim ? ' is-later' : ''}`}><small>Convergências · {ALPHA_ERA_NUMERALS[index]}</small>{converge.map(n => {
                const done = self.research.includes(n.id), why = structuralBlock(self.research, self.era, n), mark = self.resonance.marks.find(m => m.advancementId === n.id);
                return <button key={n.id} type="button" className={`alpha-diamond ${DOMAIN_CLASS(mark?.domains ?? [n.domain])}${done ? ' is-done' : ''}${!done && why === null ? ' is-reachable' : ''}${n.pair ? ' is-or' : ''}${fresh.has(n.id) ? ' is-fresh' : ''}${selected === n.id ? ' is-selected' : ''}${focusClass(n.id)}`} data-advance={n.id} aria-pressed={selected === n.id} onClick={() => setSelected(n.id)} title={n.name}><i aria-hidden="true" />{done && <span className="aoh-seat" aria-hidden="true"><PlacedCube domains={mark?.domains ?? [n.domain]} color={seatColor} size={22} /></span>}<span>{n.name}</span></button>;
              })}</div>,
            ];
          })}
        </div>
      </PanZoom>
        {node && <NodeDetail key={node.id} node={node} done={self.research.includes(node.id)} why={structuralBlock(self.research, self.era, node)} opt={game.urban.research.find(o => o.advancementId === node.id)} gate={gate} cost={game.costs.advancements[node.id] ?? {}} unlocks={ADVANCEMENTS.filter(n => n.prerequisites.includes(node.id) || n.prerequisitesAny.includes(node.id))} locked={locked} cityId={cityId} cityName={cityName} roomId={roomId} version={game.version} onResearch={research} />}
        </section>}
        {view === 'heritage' && <section className="alpha-civ-heritage alpha-civ-view" aria-label="Herança da Civilização">
        <h3>C · Herança da Civilização <small>só sua · não é a Teia universal</small></h3>
        <div className="alpha-heritage-row">{heritage.map((h, index) => {
          const done = self.research.includes(h.id), gateNode = ADVANCEMENTS.find(n => n.id === h.prerequisite)!, gateOpen = self.research.includes(h.prerequisite), eraOk = eraIndex >= ERAS.indexOf(h.era);
          const state = done ? 'acquired' : gateOpen && eraOk ? 'available' : 'locked', opt = game.urban.research.find(o => o.advancementId === h.id);
          const reason = done ? null : !gateOpen ? `Falta o avanço universal ${gateNode.name}.` : !eraOk ? `Abre na Era ${ALPHA_ERA_NUMERALS[ERAS.indexOf(h.era)]}.` : gate ?? opt?.blocked ?? null;
          return <article key={h.id} className={`alpha-heritage is-${state}`}><small>{['I', 'II', 'III'][index]} · Era {ALPHA_ERA_NUMERALS[ERAS.indexOf(h.era)]}<StatusBadge status={h.status} feminine showActive /></small><h4>{h.name}</h4><p>{h.effect}</p>{h.status === 'PLANNED' && <p className="alpha-heritage-planned">Efeito ainda não aplicado nesta versão: pesquisar marca a Herança, sem mudar o jogo.</p>}
            <p className="alpha-heritage-link"><DomainGlyph domain={gateNode.domain} size={14} /> abre por <button type="button" className="alpha-link" onClick={() => setSelected(gateNode.id)}>{gateNode.name}</button></p>
            {state !== 'acquired' && <p className="alpha-heritage-cost">Custo: {Object.entries(game.costs.advancements[h.id] ?? {}).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${text(k)}`).join(' · ')}</p>}
            {reason && <small role="note">{reason}</small>}
            <button type="button" disabled={locked || done || reason !== null || !cityId} onClick={() => research(h.id)}>{done ? 'Adquirida' : 'Pesquisar Herança'}</button></article>;
        })}</div>
      </section>}
        {view === 'identity' && <section className="alpha-civ-identity alpha-civ-view" aria-label="Identidade">
        <div className="alpha-seg is-sub" role="tablist" aria-label="Identidade e Governo">{([['identity', 'Identidade'], ['leader', 'Figura'], ['government', 'Governo']] as const).map(([key, title]) => <button key={key} type="button" role="tab" aria-selected={idPage === key} onClick={() => setIdPage(key)}>{title}</button>)}</div>
        <div className="alpha-page" key={idPage} role="tabpanel">
          {idPage === 'identity' && (kit && self.civilization ? <CivilizationCard chassis={self.civilization} /> : <p>Escolha uma civilização.</p>)}
          {idPage === 'leader' && (self.leader ? <FigureCard figureId={self.leader.leaderId} used={self.leader.eraAbilityUsed} /> : <p>Sem Figura.</p>)}
          {idPage === 'government' && <article className="alpha-civ-government"><GovernmentPanel game={game} locked={locked} manage={manage} /></article>}
        </div>
      </section>}
      </div>
    </div>
  </StrategicSurface>;
}

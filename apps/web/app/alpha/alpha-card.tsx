'use client';
import { figurePortraitSvg } from './figure-portraits';
import type { KeyboardEvent, ReactNode } from 'react';
import { FIGURE_CLASS_LABELS, LEADERS, LEGACY_WORKS, alphaGainOf, civilizationKit, core10OfChassis, figureById, heritageOf, type FigureClass } from '@aoh/game-domain';
import * as tableArt from './table-art';
import { sealArt } from './table-art';

/**
 * Common card grammar (RC 1.2): every Civilização, Figura, Obra de Legado and Descoberta reads in the same fixed order
 * ARTE → NOME → IDENTIDADE → EFEITO → ÍCONES. Colours come from the design tokens, so the card follows the dark and light themes.
 */
export type AlphaCardKind = 'civilization' | 'figure' | 'work' | 'discovery';
export type CardStatus = 'ACTIVE' | 'PLANNED';
/** One EFEITO line: an optional label ("Traço", "Passiva"), the text and, for kit/heritage rules, whether the engine applies it. */
export interface AlphaCardEffect { label?: ReactNode | undefined; text: ReactNode; status?: CardStatus | undefined; key?: string | undefined }
export interface AlphaCardProps {
  kind: AlphaCardKind;
  /** ReactNode, a full `<svg …>` string, or inner SVG markup drawn in `artViewBox`. */
  art?: ReactNode | string | undefined;
  artViewBox?: string | undefined;
  name: ReactNode;
  subtitle?: ReactNode | undefined;
  identity?: ReactNode | undefined;
  effects?: ReactNode | readonly (AlphaCardEffect | ReactNode)[] | undefined;
  icons?: ReactNode | undefined;
  /** Small corner label ("Ativa", "em breve", "Concluída"). */
  badge?: ReactNode | undefined;
  status?: CardStatus | undefined;
  /** ★ recommended for a first match. */
  recommended?: boolean | undefined;
  selected?: boolean | undefined;
  disabled?: boolean | undefined;
  compact?: boolean | undefined;
  onClick?: (() => void) | undefined;
  className?: string | undefined;
  ariaLabel?: string | undefined;
  /** Actions (buttons) under the ÍCONES row. */
  children?: ReactNode | undefined;
}

const KIND_LABEL: Record<AlphaCardKind, string> = { civilization: 'Civilização', figure: 'Figura', work: 'Obra de Legado', discovery: 'Descoberta' };

/** "planejado/planejada" chip for a rule the engine does not apply yet; nothing for an active one unless `showActive`. */
export function StatusBadge({ status, feminine = false, showActive = false }: { status: CardStatus | undefined; feminine?: boolean; showActive?: boolean }) {
  if (status === 'PLANNED') return <em className="alpha-gcard-status is-planned" title="Regra prevista: ainda não muda o jogo nesta versão.">{feminine ? 'planejada' : 'planejado'}</em>;
  if (status === 'ACTIVE' && showActive) return <em className="alpha-gcard-status is-active" title="A regra já vale nesta partida.">{feminine ? 'ativa' : 'ativo'}</em>;
  return null;
}

/** Initials seal used as the provisional portrait of a Figura (no portraits yet). */
export function InitialsSeal({ name, size = 56 }: { name: string; size?: number }) {
  const plain = name.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const words = plain.split(/[\s,]+/).filter(w => /^[A-Z]/.test(w));
  const initials = (words.length > 1 ? words.slice(0, 2).map(w => w[0]).join('') : (words[0] ?? plain).slice(0, 2)).toUpperCase();
  return <svg className="alpha-gcard-seal" width={size} height={size} viewBox="-30 -30 60 60" aria-hidden="true">
    <circle r="27" fill="var(--surface-highest)" stroke="var(--accent)" strokeWidth="2.5" />
    <circle r="22" fill="none" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="2 3" />
    <text y="7" textAnchor="middle" fontSize="19" fontWeight="700" fill="var(--text-primary)" fontFamily="var(--font-display, Georgia, serif)">{initials}</text>
  </svg>;
}

function Art({ art, viewBox }: { art: ReactNode | string; viewBox: string }) {
  if (typeof art !== 'string') return <>{art}</>;
  const markup = art.trim();
  if (markup.startsWith('<svg')) return <span className="alpha-gcard-art-svg" dangerouslySetInnerHTML={{ __html: markup }} />;
  return <svg className="alpha-gcard-art-svg" viewBox={viewBox} aria-hidden="true" dangerouslySetInnerHTML={{ __html: markup }} />;
}

const isEffect = (value: unknown): value is AlphaCardEffect => typeof value === 'object' && value !== null && 'text' in value && !('$$typeof' in value);

export function AlphaCard({ kind, art, artViewBox = '-50 -50 100 100', name, subtitle, identity, effects, icons, badge, status, recommended, selected, disabled, compact, onClick, className, ariaLabel, children }: AlphaCardProps) {
  const interactive = !!onClick && !disabled;
  const onKey = (e: KeyboardEvent) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick!(); } };
  const list = Array.isArray(effects) ? effects : null;
  return <article
    className={`alpha-gcard is-${kind}${compact ? ' is-compact' : ''}${selected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}${interactive ? ' is-interactive' : ''}${className ? ` ${className}` : ''}`}
    aria-label={ariaLabel ?? (typeof name === 'string' ? `${KIND_LABEL[kind]}: ${name}` : KIND_LABEL[kind])}
    {...(interactive ? { role: 'button', tabIndex: 0, onClick, onKeyDown: onKey, 'aria-pressed': !!selected } : {})}
    {...(disabled ? { 'aria-disabled': true } : {})}>
    {art !== undefined && art !== null && <div className="alpha-gcard-art"><Art art={art} viewBox={artViewBox} /></div>}
    <header className="alpha-gcard-name">
      <h4>{name}{recommended && <b className="alpha-gcard-star" title="Recomendada para a primeira partida" aria-label="recomendada">★</b>}</h4>
      {(badge || status) && <span className="alpha-gcard-badges">{badge && <span className="alpha-gcard-badge">{badge}</span>}<StatusBadge status={status} /></span>}
      {subtitle && <small className="alpha-gcard-sub">{subtitle}</small>}
    </header>
    {identity && <p className="alpha-gcard-identity">{identity}</p>}
    {effects !== undefined && effects !== null && (list
      ? <ul className="alpha-gcard-effects">{list.map((entry, i) => isEffect(entry)
        ? <li key={entry.key ?? i}>{entry.label && <b>{entry.label}</b>} {entry.text}<StatusBadge status={entry.status} /></li>
        : <li key={i}>{entry}</li>)}</ul>
      : <div className="alpha-gcard-effects">{effects as ReactNode}</div>)}
    {icons && <footer className="alpha-gcard-icons">{icons}</footer>}
    {children && <div className="alpha-gcard-actions">{children}</div>}
  </article>;
}

/** Civilização card: seal → name (Core 10, never the technical id) → scope/period → Traço, Assinatura, Limitação, Herança inicial (each with its status) → emblem and palette. */
export function CivilizationCard({ chassis, color = 'var(--accent-bright)', compact, selected, disabled, onClick, heritage = false, recommended, children }: { chassis: string; color?: string; compact?: boolean | undefined; selected?: boolean | undefined; disabled?: boolean | undefined; onClick?: (() => void) | undefined; heritage?: boolean; recommended?: boolean | undefined; children?: ReactNode }) {
  const core = core10OfChassis(chassis), kit = civilizationKit(chassis);
  const name = core?.name ?? 'Civilização';
  const effects: AlphaCardEffect[] = kit ? [
    { key: 'trait', label: 'Traço', text: kit.trait.text, status: kit.trait.status },
    { key: 'signature', label: kit.signature.kind === 'UNIT' ? `Peça · ${kit.signature.name}` : `Estrutura · ${kit.signature.name}`, text: kit.signature.item.text, status: kit.signature.item.status },
    { key: 'limitation', label: 'Limitação', text: kit.limitation.text, status: kit.limitation.status },
    ...(compact ? [] : [{ key: 'start', label: 'Início', text: kit.heritage.text, status: kit.heritage.status }]),
    ...(heritage ? heritageOf(chassis).map((h, i) => ({ key: h.id, label: `Herança ${['I', 'II', 'III'][i]} · ${h.name}`, text: h.effect, status: h.status })) : []),
  ] : [];
  return <AlphaCard kind="civilization" name={name} subtitle={core?.period} identity={core?.scope}
    art={kit ? `<svg viewBox="-34 -34 68 68" aria-hidden="true">${sealArt(kit.mark, color, 28)}</svg>` : undefined}
    effects={effects} recommended={recommended} selected={selected} disabled={disabled} compact={compact} onClick={onClick}
    icons={core ? <><span title="Emblema">{core.emblem.name}</span><span aria-hidden="true">·</span><span title="Estandarte">{core.banner.name}</span><span className="alpha-gcard-palette" aria-hidden="true">{core.palette.map(c => <i key={c} style={{ background: c }} />)}</span></> : undefined}>{children}</AlphaCard>;
}

/**
 * Figura card (the code calls it a leader): initials seal → name ★ → class · archetype → Passiva, Poder 1× por Era → power state.
 * `used` null hides the state (lobby); true/false shows "usado nesta Era" / "disponível".
 */
export function FigureCard({ figureId, used = null, compact, selected, disabled, onClick, children }: { figureId: string; used?: boolean | null; compact?: boolean | undefined; selected?: boolean | undefined; disabled?: boolean | undefined; onClick?: (() => void) | undefined; children?: ReactNode }) {
  const figure = figureById(figureId), leader = LEADERS.find(l => l.id === figureId);
  const name = figure?.name ?? leader?.name ?? 'Figura';
  const cls = figure ? FIGURE_CLASS_LABELS[figure.cls as FigureClass] : null;
  const passive = figure ? { name: figure.passive.name, text: leader?.passiveAbility.description ?? figure.passive.text } : leader ? { name: leader.passiveAbility.name, text: leader.passiveAbility.description } : null;
  const power = figure ? { name: figure.power.name, text: leader?.eraAbility.description ?? figure.power.text } : leader ? { name: leader.eraAbility.name, text: leader.eraAbility.description } : null;
  return <AlphaCard kind="figure" name={name} subtitle={[cls, figure?.archetype ?? leader?.title].filter(Boolean).join(' · ')} identity={figure?.style}
    art={figurePortraitSvg(name) ?? <InitialsSeal name={name} size={compact ? 46 : 60} />} recommended={figure?.recommended} selected={selected} disabled={disabled} compact={compact} onClick={onClick}
    effects={[...(passive ? [{ key: 'passive', label: `Passiva · ${passive.name}`, text: passive.text }] : []), ...(power ? [{ key: 'power', label: `Poder 1× por Era · ${power.name}`, text: power.text }] : [])]}
    icons={used === null ? (figure && !compact ? <span title="Fonte">{figure.source}</span> : undefined) : <span role="status"><b>{used ? 'Poder usado nesta Era' : 'Poder disponível'}</b></span>}>{children}</AlphaCard>;
}

/**
 * Art of an Obra / a Descoberta from table-art when the art lane has shipped it (`workArt`, `discoveryArt`), else a plain placeholder.
 * Read defensively so the cards never depend on the order the lanes land in.
 */
type ArtFn = (...args: unknown[]) => unknown;
const artFn = (name: string): ArtFn | null => { const fn = (tableArt as unknown as Record<string, unknown>)[name]; return typeof fn === 'function' ? fn as ArtFn : null; };
const asSvg = (markup: unknown, size: number): string | null => typeof markup !== 'string' || !markup.trim() ? null : markup.trim().startsWith('<svg') ? markup : `<svg viewBox="${-size} ${-size} ${size * 2} ${size * 2}" aria-hidden="true">${markup}</svg>`;
export function workArtOf(workId: string, size = 48, progress = 0): string {
  const fn = artFn('workArt'), drawn = fn ? asSvg(fn(workId, size, progress), size) : null;
  if (drawn) return drawn;
  const steps = [0, 1, 2].map(i => `<rect x="${-30 + i * 22}" y="-8" width="14" height="30" rx="1" fill="${i < progress ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"/>`).join('');
  return `<svg viewBox="-48 -40 96 80" aria-hidden="true"><path d="M-38,-12L0,-32L38,-12Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>${steps}<rect x="-42" y="24" width="84" height="7" rx="1" fill="currentColor" opacity=".55"/></svg>`;
}
const DISCOVERY_GLYPH: Record<string, string> = { RUIN: 'M-14,14V-6M-4,14V-14M6,14V-2M16,14V-10M-20,16H22', DEPOSIT: 'M-18,14L-6,-10L2,2L10,-14L20,14Z', PASSAGE: 'M-18,16C-6,4 4,-2 18,-16M-8,18C2,6 10,0 22,-8', ANCHORAGE: 'M0,-16V14M-14,4C-12,14 12,14 14,4M-8,-10H8', DANGER: 'M0,-16L18,14H-18Z M0,-4V5 M0,9V10', CAMP: 'M-18,14L-4,-12L10,14M-4,-12L-4,14M8,14L16,0L24,14', NONE: 'M-16,8C-8,0 8,0 16,8' };
export function discoveryArtOf(kind: string, size = 48): string {
  const fn = artFn('discoveryArt'), drawn = fn ? asSvg(fn(kind, size), size) : null;
  if (drawn) return drawn;
  return `<svg viewBox="-34 -30 68 60" aria-hidden="true"><path d="M-26,0L-13,-22.5L13,-22.5L26,0L13,22.5L-13,22.5Z" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".6"/><path d="${DISCOVERY_GLYPH[kind] ?? DISCOVERY_GLYPH.NONE}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
/** Three-step progress of an Obra de Legado. */
export function WorkSteps({ done, total = 3 }: { done: number; total?: number }) {
  return <span className="alpha-gcard-steps" role="img" aria-label={`Passo ${done} de ${total}`}>{Array.from({ length: total }, (_, i) => <i key={i} className={i < done ? 'is-done' : ''} />)}</span>;
}

const GAIN_NAMES: Record<string, string> = { food: 'Alimento', wood: 'Madeira', stone: 'Pedra', metal: 'Metal', wealth: 'Riqueza', knowledge: 'Conhecimento', influence: 'Influência', culture: 'Cultura' };
/** "+1 Conhecimento por rodada": the permanent effect of a completed Obra, in the seven resources. */
export function legacyWorkEffectText(workId: string): string | null {
  const effect = LEGACY_WORKS.find(work => work.id === workId)?.effect;
  if (!effect || effect.kind !== 'PRODUCTION') return null;
  const gains = Object.entries(alphaGainOf(effect.resource, effect.amount)).filter(([, n]) => n > 0).map(([key, n]) => `+${n} ${GAIN_NAMES[key] ?? key}`).join(' e ');
  return `${gains} ${effect.timing === 'ON_PRODUCE' ? 'quando a cidade Produz' : 'por rodada'}`;
}

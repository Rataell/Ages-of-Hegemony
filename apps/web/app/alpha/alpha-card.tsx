'use client';
import type { KeyboardEvent, ReactNode } from 'react';

/**
 * Common card grammar (RC 1.2): every Civilização, Figura, Obra de Legado and Descoberta reads in the same fixed order
 * ARTE → NOME → IDENTIDADE → EFEITO → ÍCONES. Colours come from the design tokens, so the card follows the dark and light themes.
 */
export type AlphaCardKind = 'civilization' | 'figure' | 'work' | 'discovery';
export type CardStatus = 'ACTIVE' | 'PLANNED';
/** One EFEITO line: an optional label ("Traço", "Passiva"), the text and, for kit/heritage rules, whether the engine applies it. */
export interface AlphaCardEffect { label?: ReactNode; text: ReactNode; status?: CardStatus; key?: string }
export interface AlphaCardProps {
  kind: AlphaCardKind;
  /** ReactNode, a full `<svg …>` string, or inner SVG markup drawn in `artViewBox`. */
  art?: ReactNode | string;
  artViewBox?: string;
  name: ReactNode;
  subtitle?: ReactNode;
  identity?: ReactNode;
  effects?: ReactNode | readonly (AlphaCardEffect | ReactNode)[];
  icons?: ReactNode;
  /** Small corner label ("Ativa", "em breve", "Concluída"). */
  badge?: ReactNode;
  status?: CardStatus;
  /** ★ recommended for a first match. */
  recommended?: boolean;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  /** Actions (buttons) under the ÍCONES row. */
  children?: ReactNode;
}

const KIND_LABEL: Record<AlphaCardKind, string> = { civilization: 'Civilização', figure: 'Figura', work: 'Obra de Legado', discovery: 'Descoberta' };

/** "planejado/planejada" chip for a rule the engine does not apply yet; nothing for an active one unless `showActive`. */
export function StatusBadge({ status, feminine = false, showActive = false }: { status: CardStatus | undefined; feminine?: boolean; showActive?: boolean }) {
  if (status === 'PLANNED') return <em className="aoh-card-status is-planned" title="Regra prevista: ainda não muda o jogo nesta versão.">{feminine ? 'planejada' : 'planejado'}</em>;
  if (status === 'ACTIVE' && showActive) return <em className="aoh-card-status is-active" title="A regra já vale nesta partida.">{feminine ? 'ativa' : 'ativo'}</em>;
  return null;
}

/** Initials seal used as the provisional portrait of a Figura (no portraits yet). */
export function InitialsSeal({ name, size = 56 }: { name: string; size?: number }) {
  const plain = name.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const words = plain.split(/[\s,]+/).filter(w => /^[A-Z]/.test(w));
  const initials = (words.length > 1 ? words.slice(0, 2).map(w => w[0]).join('') : (words[0] ?? plain).slice(0, 2)).toUpperCase();
  return <svg className="aoh-card-seal" width={size} height={size} viewBox="-30 -30 60 60" aria-hidden="true">
    <circle r="27" fill="var(--surface-highest)" stroke="var(--accent)" strokeWidth="2.5" />
    <circle r="22" fill="none" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="2 3" />
    <text y="7" textAnchor="middle" fontSize="19" fontWeight="700" fill="var(--text-primary)" fontFamily="var(--font-display, Georgia, serif)">{initials}</text>
  </svg>;
}

function Art({ art, viewBox }: { art: ReactNode | string; viewBox: string }) {
  if (typeof art !== 'string') return <>{art}</>;
  const markup = art.trim();
  if (markup.startsWith('<svg')) return <span className="aoh-card-art-svg" dangerouslySetInnerHTML={{ __html: markup }} />;
  return <svg className="aoh-card-art-svg" viewBox={viewBox} aria-hidden="true" dangerouslySetInnerHTML={{ __html: markup }} />;
}

const isEffect = (value: unknown): value is AlphaCardEffect => typeof value === 'object' && value !== null && 'text' in value && !('$$typeof' in value);

export function AlphaCard({ kind, art, artViewBox = '-50 -50 100 100', name, subtitle, identity, effects, icons, badge, status, recommended, selected, disabled, compact, onClick, className, ariaLabel, children }: AlphaCardProps) {
  const interactive = !!onClick && !disabled;
  const onKey = (e: KeyboardEvent) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick!(); } };
  const list = Array.isArray(effects) ? effects : null;
  return <article
    className={`aoh-card is-${kind}${compact ? ' is-compact' : ''}${selected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}${interactive ? ' is-interactive' : ''}${className ? ` ${className}` : ''}`}
    aria-label={ariaLabel ?? (typeof name === 'string' ? `${KIND_LABEL[kind]}: ${name}` : KIND_LABEL[kind])}
    {...(interactive ? { role: 'button', tabIndex: 0, onClick, onKeyDown: onKey, 'aria-pressed': !!selected } : {})}
    {...(disabled ? { 'aria-disabled': true } : {})}>
    {art !== undefined && art !== null && <div className="aoh-card-art"><Art art={art} viewBox={artViewBox} /></div>}
    <header className="aoh-card-name">
      <h4>{name}{recommended && <b className="aoh-card-star" title="Recomendada para a primeira partida" aria-label="recomendada">★</b>}</h4>
      {(badge || status) && <span className="aoh-card-badges">{badge && <span className="aoh-card-badge">{badge}</span>}<StatusBadge status={status} /></span>}
      {subtitle && <small className="aoh-card-sub">{subtitle}</small>}
    </header>
    {identity && <p className="aoh-card-identity">{identity}</p>}
    {effects !== undefined && effects !== null && (list
      ? <ul className="aoh-card-effects">{list.map((entry, i) => isEffect(entry)
        ? <li key={entry.key ?? i}>{entry.label && <b>{entry.label}</b>} {entry.text}<StatusBadge status={entry.status} /></li>
        : <li key={i}>{entry}</li>)}</ul>
      : <div className="aoh-card-effects">{effects as ReactNode}</div>)}
    {icons && <footer className="aoh-card-icons">{icons}</footer>}
    {children && <div className="aoh-card-actions">{children}</div>}
  </article>;
}

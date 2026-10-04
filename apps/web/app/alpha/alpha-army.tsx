'use client';
import { stackCategory, stackLabel, type StackCategory, type StackView } from '@aoh/game-domain';
import { alphaLabel as text } from './alpha-copy';

type Unit = { id: string; kind: string; hexId: string; supply?: { supplied: boolean } | null };
/** Pieces that never fight. The legacy SETTLER id is migrated to PIONEER on load (alpha-migration). */
const CIVILIAN = new Set(['EXPLORER', 'PIONEER', 'ENVOY']);

/** "Infantaria ×8 · Guarda ×2": one entry per class, in first-seen order. */
export function composition(units: Unit[]) {
  const counts = new Map<string, number>();
  for (const unit of units) counts.set(unit.kind, (counts.get(unit.kind) ?? 0) + 1);
  return [...counts].map(([kind, count]) => ({ kind, count, label: `${text(kind)} ×${count}` }));
}
export const compositionText = (units: Unit[]) => composition(units).map(entry => entry.label).join(' · ');

type Rules = Record<string, { domain: 'LAND' | 'SEA'; strength: number }>;
/** Compact stack counters for one hex: "Exército 5/6 · Civis 1/2". A full stack is flagged. */
function StackTags({ hexId, members, stacks, rules }: { hexId: string; members: Unit[]; stacks: StackView; rules: Rules }) {
  const hex = stacks.hexes[hexId], present = new Set<StackCategory>(members.map(unit => stackCategory(rules[unit.kind]!)));
  if (!hex) return null;
  return <span className="alpha-stack-tags">{(['military', 'civilians', 'fleets'] as const).filter(category => present.has(category)).map(category => {
    const usage = hex[category];
    return <span key={category} className="alpha-stack-tag" data-full={usage.used >= usage.limit} title="Limite de pilha por civilização e hex">{stackLabel(category, hex.city)} {usage.used}/{usage.limit}</span>;
  })}</span>;
}

/** Own pieces grouped by hex and class: one card per stack instead of one row per piece. */
export function ArmyList({ units, selected, onSelect, stacks, rules }: { units: Unit[]; selected: string[]; onSelect: (ids: string[], on: boolean, hexId: string) => void; stacks: StackView; rules: Rules }) {
  const groups = new Map<string, Unit[]>();
  for (const unit of units) groups.set(unit.hexId, [...(groups.get(unit.hexId) ?? []), unit]);
  if (!groups.size) return <p className="muted">Nenhuma peça em campo.</p>;
  return <div className="alpha-armies">{[...groups].sort(([a], [b]) => a.localeCompare(b)).map(([hexId, members]) => {
    const ids = members.map(unit => unit.id), chosen = ids.filter(id => selected.includes(id)).length, unsupplied = members.filter(unit => unit.supply && !unit.supply.supplied).length;
    const military = members.some(unit => !CIVILIAN.has(unit.kind));
    const naval = members.some(unit => unit.kind === 'FLEET' || unit.kind === 'COASTAL_VESSEL');
    const title = members.length === 1 ? text(members[0]!.kind) : `${naval ? 'Frota' : military ? 'Exército' : 'Civis'} · ${members.length} peças`;
    return <article className="alpha-army" data-selected={chosen > 0} key={hexId}>
      <div className="alpha-army-head"><b>{title}</b><small>{hexId}{unsupplied ? ` · ${unsupplied} sem suprimento` : ' · abastecido'}</small><StackTags hexId={hexId} members={members} stacks={stacks} rules={rules} /></div>
      <div className="alpha-army-classes">{composition(members).map(entry => {
        const kindIds = members.filter(unit => unit.kind === entry.kind).map(unit => unit.id), all = kindIds.every(id => selected.includes(id));
        return <button type="button" key={entry.kind} aria-pressed={all} title={`Selecionar ${text(entry.kind)} deste hex`} onClick={() => onSelect(kindIds, !all, hexId)}>{entry.label}</button>;
      })}</div>
      <div className="alpha-army-actions">
        <button type="button" onClick={() => onSelect(ids, chosen !== ids.length, hexId)}>{chosen === ids.length ? 'Limpar seleção' : ids.length > 1 ? 'Selecionar todas' : 'Selecionar'}</button>
        <small>{chosen} / {ids.length} selecionadas</small>
      </div>
      <details><summary>ver composição</summary>{members.map(unit => <label className="alpha-piece-row" key={unit.id}>
        <input type="checkbox" checked={selected.includes(unit.id)} onChange={event => onSelect([unit.id], event.target.checked, hexId)} />
        <span>{text(unit.kind)}<small>{unit.hexId} · {unit.supply?.supplied ? 'Abastecida' : 'Sem suprimento'}</small></span>
      </label>)}</details>
    </article>;
  })}</div>;
}

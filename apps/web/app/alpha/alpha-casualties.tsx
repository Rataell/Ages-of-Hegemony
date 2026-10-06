'use client';
import { useState } from 'react';
import { alphaLabel as text } from './alpha-copy';
import type { AlphaSend } from './alpha-board';
import { effectiveCasualtyList } from './casualty-list';

/** V51B-01: PRIORIDADE DE BAIXAS. Free action while planning; the engine reads the list at resolution, no prompt during the fight. */
export function CasualtyPriority({ defaults, saved, units, locked, send }: { defaults: string[]; saved: { order: string[]; byHex: Record<string, string[]> }; units: { kind: string; hexId: string }[]; locked: boolean; send: AlphaSend }) {
  const [scope, setScope] = useState<string | null>(null);
  const combat = units.filter(unit => defaults.includes(unit.kind));
  const hexes = [...new Set(combat.map(unit => unit.hexId))].sort();
  if (!combat.length) return <section className="alpha-casualties"><h3>Prioridade de baixas</h3><small>Sem peças de combate em campo.</small></section>;
  const fielded = new Set((scope ? combat.filter(unit => unit.hexId === scope) : combat).map(unit => unit.kind));
  const list = effectiveCasualtyList(defaults, saved, scope, fielded);
  const custom = scope ? saved.byHex[scope] !== undefined : saved.order.length > 0;
  const apply = (order: string[]) => void send({ type: 'SET_CASUALTY_PRIORITY', order, hexId: scope });
  const move = (index: number, by: number) => { const next = [...list]; const other = index + by; if (other < 0 || other >= next.length) return; [next[index], next[other]] = [next[other]!, next[index]!]; apply(next); };
  return <section className="alpha-casualties" aria-label="Prioridade de baixas"><h3>Prioridade de baixas</h3>
    <label>Vale para<select value={scope ?? ''} onChange={e => setScope(e.target.value || null)}><option value="">Todas as pilhas</option>{hexes.map(hex => <option key={hex} value={hex}>Pilha em {hex}</option>)}</select></label>
    <ol>{list.map((kind, index) => <li key={kind}><span>{index + 1}</span><b>{text(kind)}</b>
      <button type="button" disabled={locked || index === 0} aria-label={`Subir ${text(kind)}`} onClick={() => move(index, -1)}>▲</button>
      <button type="button" disabled={locked || index === list.length - 1} aria-label={`Descer ${text(kind)}`} onClick={() => move(index, 1)}>▼</button></li>)}</ol>
    <small>A 1ª da lista é a primeira a cair. Vale só no Planejamento; a resolução usa a lista sem perguntar.</small>
    {custom && <button type="button" disabled={locked} onClick={() => apply([])}>Voltar ao padrão do motor</button>}
  </section>;
}

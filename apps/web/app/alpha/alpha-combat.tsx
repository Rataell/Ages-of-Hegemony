'use client';
import type { AlphaPlayerView } from '@aoh/server/alpha';
import { alphaLabel as text } from './alpha-copy';

export const POSTURES = [['ASSAULT', 'Assalto'], ['HOLD', 'Manter'], ['MANEUVER', 'Manobra']] as const;
const FACE: Record<string, string> = { EMPTY: 'Vazio', IMPACT: 'Impacto', GUARD: 'Guarda', MANEUVER: 'Manobra', COMMAND: 'Comando' };
const OUTCOME: Record<string, string> = { TIE: 'empate tático', VICTORY: 'vitória', DECISIVE: 'vitória decisiva' };
const signed = (amount: number) => (amount > 0 ? `+${amount}` : `${amount}`);
export const postureText = (posture: string) => POSTURES.find(([key]) => key === posture)?.[1] ?? posture;

type Preview = AlphaPlayerView['orderPreviews'][string];
type Battle = AlphaPlayerView['battles'][number];
type Modifier = { source: string; amount: number };

function Breakdown({ label, strength, items, total }: { label: string; strength: number; items: Modifier[]; total: number }) {
  return <div className="alpha-breakdown"><h5>{label}</h5>
    <ul><li>Unidades e guarnição <b>{strength}</b></li>{items.map((item, i) => <li key={`${item.source}-${i}`}>{item.source} <b>{signed(item.amount)}</b></li>)}</ul>
    <p>Total <b>{total}</b></p></div>;
}

/** Attack order preview. One summary line up front; the full breakdown by origin is one click away. No dice, no defender posture, nothing on hexes the player cannot see. */
export function AttackPreview({ preview }: { preview: Preview }) {
  if (!preview.ok) return <p className="alpha-warning" role="alert">Ataque bloqueado: {preview.blocked}</p>;
  const defender = preview.defender;
  const defenseTotal = defender?.visible ? defender.strength + defender.breakdown.reduce((n, m) => n + m.amount, 0) : null;
  return <section className="alpha-attack-preview" aria-label="Prévia do ataque">
    <p className="alpha-preview-summary"><b>{postureText(preview.attacker.posture)}</b> · Ataque <b>{preview.attacker.total}</b> × Defesa <b>{defenseTotal ?? '?'}</b>{defenseTotal === null && ' (fora da visão)'}</p>
    <p className="alpha-preview-grades">{preview.attacker.units.map(u => `${text(u.kind)} ${u.grau}`).join(' · ')} · Δ ≤ ±{preview.thresholds.tie}: empate tático · Δ ≥ {preview.thresholds.decisive}: vitória decisiva</p>
    {preview.advance.note&&<p className="alpha-warning" role="status">{preview.advance.note}</p>}
    <details><summary>Prévia · {preview.target} · {text(preview.terrain)}</summary>
      <p>Postura escolhida: <b>{postureText(preview.attacker.posture)}</b></p>
      <div className="alpha-form-row">
        <Breakdown label="Seu ataque" strength={preview.attacker.strength} items={preview.attacker.breakdown} total={preview.attacker.total} />
        {defender?.visible && defenseTotal !== null
          ? <Breakdown label="Defesa visível" strength={defender.strength} items={defender.breakdown} total={defenseTotal} />
          : <p>Defesa fora da sua visão: força desconhecida.</p>}
      </div>
      {defender?.visible && defender.fortification && defender.fortification.level !== 'NONE' && <p>Fortificação: {text(defender.fortification.level)} · {defender.fortification.state === 'INTACT' ? 'intacta' : defender.fortification.state === 'DAMAGED' ? 'danificada' : 'rompida'}.</p>}
      <p>Postura defensiva do adversário: desconhecida.</p>
      <p>{preview.note} Faces do dado: {preview.dieFaces.map(face => FACE[face]).join(', ')}.</p>
    </details>
  </section>;
}

/** Result of a resolved battle: postures, one die per unit, and every modifier by origin. */
export function BattleReport({ battle, players }: { battle: Battle; players: AlphaPlayerView['players'] }) {
  const name = (id: string) => players.find(p => p.id === id)?.name ?? id;
  const sides = [
    { key: 'ataque', title: 'Ataque', id: battle.attackerId, posture: battle.attackerPosture, strength: battle.attackStrength, items: battle.attackBreakdown, total: battle.attackTotal, rolls: battle.attackerTactical },
    { key: 'defesa', title: 'Defesa', id: battle.defenderId, posture: battle.defenderPosture, strength: battle.defenseStrength, items: battle.defenseBreakdown, total: battle.defenseTotal, rolls: battle.defenderTactical },
  ];
  return <article className="alpha-battle alpha-card">
    <h3>Conflito em {battle.hexId} · Rodada {battle.round}</h3>
    <div className="alpha-form-row">{sides.map(side => <section key={side.key}>
      <h4>{side.title} · {name(side.id)} · {postureText(side.posture)}</h4>
      <div className="alpha-dice" aria-label={`Faces ${side.key==='ataque'?'do ataque':'da defesa'} ${side.rolls.map(r => FACE[r.face]).join(' e ') || 'nenhuma'}`}>{side.rolls.map(roll => <span key={roll.unitId} title={`${roll.unitId} · Grau ${['I', 'II', 'III'][(roll.grade ?? 1) - 1]}: ${roll.effect}`}>{FACE[roll.face]}</span>)}</div>
      <ul className="alpha-roll-notes">{side.rolls.filter(r => r.effect).map(roll => <li key={roll.unitId}>{roll.unitId}: {roll.effect}</li>)}</ul>
      <Breakdown label="Modificadores por origem" strength={side.strength} items={side.items} total={side.total} />
      <p>Força {side.strength} + modificadores {side.items.reduce((n, m) => n + m.amount, 0)} = <b>{side.total}</b></p>
    </section>)}</div>
    {battle.fortification && battle.fortification.before.state !== battle.fortification.after.state && <p>Fortificação: {battle.fortification.before.state === 'INTACT' ? 'intacta' : 'danificada'} → {battle.fortification.after.state === 'BREACHED' ? 'rompida' : 'danificada'}.</p>}
    {battle.outcome && <p className="alpha-battle-delta" role="status">Δ {(battle.delta ?? 0) > 0 ? '+' : ''}{battle.delta} · {OUTCOME[battle.outcome]}</p>}
    <p>{battle.outcome === 'TIE' ? 'Ninguém venceu' : `Vencedor: ${name(battle.winnerId)}`}. Peças perdidas: {battle.losses.length}. {battle.retreat ? `Retirada para ${battle.retreat}.` : 'Sem retirada.'}</p>
  </article>;
}

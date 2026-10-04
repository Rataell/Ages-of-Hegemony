'use client';
import { useState } from 'react';
import { CIVILIZATION_KITS, LEADERS, civilizationKit, type CivilizationKit, type KitItem } from '@aoh/game-domain';
import { bannerArt, sealArt } from './table-art';

const AFFINITY: Record<string, string> = { POLITICAL: 'Política', TERRITORIAL: 'Territorial', ECONOMIC: 'Econômica', MARITIME: 'Marítima', SCIENTIFIC: 'Científica', CULTURAL: 'Cultural', MILITARY: 'Militar', AGRARIAN: 'Agrária' };
const ERA: Record<string, string> = { FOUNDATION: 'Era I', CIVILIZATION: 'Era III', ASCENSION: 'Era V' };
const NEUTRAL = '#9fb0ad';
const svg = (html: string, size: number, box = '-20 -20 40 40') => <svg width={size} height={size} viewBox={box} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
/** A kit line says where it comes from and, when the engine does not apply it yet, that it is planned. */
function Line({ title, entry }: { title: string; entry: KitItem }) {
  return <li><b>{title}</b> {entry.text}{entry.status === 'PLANNED' && <em className="alpha-kit-planned"> · planejado</em>}</li>;
}
function Detail({ kit }: { kit: CivilizationKit }) {
  const leader = LEADERS.find(l => l.id === kit.leaderId);
  return <section className="alpha-roster-detail" aria-live="polite">
    <header>{svg(sealArt(kit.mark, NEUTRAL, 15), 52)}{svg(bannerArt(kit.mark, NEUTRAL, 40), 44, '-22 -40 44 44')}<div><p className="eyebrow">{AFFINITY[kit.affinity]}{kit.availability === 'AUTHORING' ? ' · EM AUTORIA' : ''}</p><h3>{kit.name}</h3><p>{kit.identity}</p></div></header>
    <ul className="alpha-civ-facts">
      {kit.capital && <li><b>Capital</b> {kit.capital}</li>}
      {leader && <li><b>Líder</b> {leader.name}: {leader.passiveAbility.description} Uma vez por Era, {leader.eraAbility.name}: {leader.eraAbility.description.replace(/^Uma vez por Era, /, '')}</li>}
      <Line title="Traço" entry={kit.trait} /><Line title="Herança" entry={kit.heritage} />
      <Line title={kit.signature.kind === 'UNIT' ? `Peça: ${kit.signature.name}` : `Estrutura: ${kit.signature.name}`} entry={kit.signature.item} />
      <Line title="Limitação" entry={kit.limitation} />
    </ul>
    {kit.cards.length > 0 && <><h4>Cartas próprias</h4><ul className="alpha-civ-cards">{kit.cards.map(card => <li key={card.id}><b>{card.name}</b> {card.text} <small>{ERA[card.unlockEra]}</small></li>)}</ul></>}
    {kit.authoringGaps.length > 0 && <p className="alpha-hint">Ainda não jogável: falta autorar {kit.authoringGaps.join(', ')}.</p>}
  </section>;
}

/**
 * The eighteen canonical civilizations as a compact roster plus one detail panel, instead of eighteen big cards. Playable
 * civilizations come first (choosing keeps the old one-click behaviour); the six in authoring are listed but not selectable.
 */
export function CivilizationRoster({ chosenBy, selfChoice, locked, onChoose }: { chosenBy: (id: string) => string | null; selfChoice: string | null; locked: boolean; onChoose: (id: string) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const shown = civilizationKit(preview ?? selfChoice) ?? CIVILIZATION_KITS[0]!;
  const ordered = [...CIVILIZATION_KITS].sort((a, b) => Number(a.availability === 'AUTHORING') - Number(b.availability === 'AUTHORING'));
  return <div className="alpha-roster">
    <div className="alpha-civilizations alpha-roster-list" role="group" aria-label="Civilizações">
      {ordered.map(kit => {
        const owner = chosenBy(kit.id), mine = selfChoice === kit.id, authoring = kit.availability === 'AUTHORING';
        return <button key={kit.id} type="button" className={`alpha-roster-row${mine ? ' is-selected' : ''}`} aria-pressed={mine}
          disabled={locked || authoring || Boolean(owner && !mine)}
          onMouseEnter={() => setPreview(kit.id)} onFocus={() => setPreview(kit.id)} onClick={() => onChoose(kit.id)}>
          {svg(sealArt(kit.mark, mine ? '#f4ecd8' : NEUTRAL, 13), 30)}
          <h3>{kit.name}</h3><small>{authoring ? 'Em autoria' : owner && !mine ? `Escolhida por ${owner}` : mine ? 'Sua escolha' : AFFINITY[kit.affinity]}</small>
        </button>;
      })}
    </div>
    <Detail kit={shown} />
  </div>;
}

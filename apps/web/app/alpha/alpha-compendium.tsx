'use client';
import { useState, type ReactNode } from 'react';
import { CORE10, DISCOVERY_INFO, FIGURE_CLASS_LABELS, LEGACY_WORKS, LEGACY_WORK_IDENTITY, MAP_FOOTPRINT, MAP_SIZE_NAMES, heritageOf, type DiscoveryKind, type FigureClass, type MapSize } from '@aoh/game-domain';
import { alphaLabel as text } from './alpha-copy';
import { AlphaCard, CivilizationCard, FigureCard, InitialsSeal, StatusBadge, discoveryArtOf, legacyWorkEffectText, workArtOf } from './alpha-card';
import { StrategicSurface } from './strategic-surface';

/**
 * Compêndio (RC 1.2): the reference of the Core 10 world, short and scannable, every line read from the same data the engine uses.
 * A glass layer over the Mesa like the Livro; only its own body scrolls, never the page.
 */
type Tab = 'civs' | 'figures' | 'heritage' | 'port' | 'works' | 'explore' | 'discoveries' | 'sizes' | 'presets';
const TABS: [Tab, string][] = [['civs', 'Civilizações'], ['figures', 'Figuras'], ['heritage', 'Heranças'], ['port', 'Porto'], ['works', 'Obras de Legado'], ['explore', 'Exploração'], ['discoveries', 'Descobertas'], ['sizes', 'Tamanhos'], ['presets', 'Presets']];
const DISCOVERY_ORDER: DiscoveryKind[] = ['RUIN', 'DEPOSIT', 'PASSAGE', 'ANCHORAGE', 'DANGER', 'CAMP', 'NONE'];
const SIZES: MapSize[] = ['COMPACT', 'STANDARD', 'WIDE'];
const PRESETS: [string, string][] = [
  ['Misto', 'As Regiões como foram desenhadas: baías, lagos e estreitos, uma só massa de terra. Pouco mar aberto.'],
  ['Continental', 'Uma grande massa de terra dentro de um oceano na borda do tabuleiro. Costa e Porto só junto a esse oceano.'],
  ['Arquipélago', 'Cada Pátria numa ilha; estreitos de um hex separam as ilhas. Sem ponte de terra: há Regiões que só se exploram pelo mar.'],
  ['Mar Interior', 'O centro do tabuleiro é um mar contínuo; as civilizações o cercam.'],
];

function CivPicker({ value, onChange }: { value: string; onChange: (chassis: string) => void }) {
  return <div className="alpha-compendium-civs" role="tablist" aria-label="Civilização">{CORE10.map(civ => <button key={civ.chassis} type="button" role="tab" aria-selected={value === civ.chassis} onClick={() => onChange(civ.chassis)}>{civ.name}</button>)}</div>;
}
function Rules({ children }: { children: ReactNode }) { return <ul className="alpha-compendium-rules">{children}</ul>; }

export function AlphaCompendium({ onClose, initial = 'civs' }: { onClose: () => void; initial?: Tab }) {
  const [tab, setTab] = useState<Tab>(initial), [civ, setCiv] = useState(CORE10[0]!.chassis);
  const core = CORE10.find(c => c.chassis === civ)!;
  return <StrategicSurface className="alpha-compendium" label="Compêndio" onClose={onClose}>
    <header className="alpha-compendium-head"><div><p className="aoh-eyebrow">Compêndio</p><h2>O mundo do Core 10</h2></div><button type="button" className="aoh-btn is-sm" onClick={onClose}>Voltar ao mapa</button></header>
    <nav className="alpha-compendium-tabs" role="tablist" aria-label="Seções do Compêndio">{TABS.map(([key, title]) => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>{title}</button>)}</nav>
    <div className="alpha-compendium-body" role="tabpanel" key={tab}>
      {tab === 'civs' && <><CivPicker value={civ} onChange={setCiv} /><div className="alpha-compendium-split"><CivilizationCard chassis={civ} heritage />
        <dl className="alpha-compendium-facts"><div><dt>Cidades</dt><dd>{core.cityLook}</dd></div><div><dt>Porto</dt><dd>{core.port}</dd></div><div><dt>Muralha</dt><dd>{core.fortification}</dd></div><div><dt>Materiais</dt><dd>{core.materials}</dd></div><div><dt>Padrão</dt><dd>{core.pattern}</dd></div><div><dt>Patronos</dt><dd>{core.patrons} <small>(nunca são Figuras)</small></dd></div></dl></div>
        <p className="alpha-compendium-note"><StatusBadge status="PLANNED" /> marca uma regra prevista que ainda não muda o jogo nesta versão.</p></>}
      {tab === 'figures' && <><p className="alpha-compendium-lead"><b>Nem toda Figura governou.</b> Figura é quem marcou a civilização: governante, general, herói, explorador, profeta, sábio, estrategista ou fundador. Cada uma tem uma <b>Passiva</b> e um <b>Poder 1× por Era</b>; ★ = recomendada para a primeira partida.</p>
        <CivPicker value={civ} onChange={setCiv} />
        <div className="alpha-gcard-row">{core.figures.map(f => <FigureCard key={f.id} figureId={f.id} compact />)}
          {(core.reserveFigures ?? []).map(f => <AlphaCard key={f.id} kind="figure" compact disabled art={<InitialsSeal name={f.name} size={46} />} name={f.name} badge="em breve" subtitle={`${FIGURE_CLASS_LABELS[f.cls as FigureClass]} · ${f.archetype}`} identity={f.style} effects={[{ key: 'r', text: 'Reserva: aparece só no Compêndio; ainda não pode ser escolhida.' }]} icons={<span>{f.source}</span>} />)}</div>
        <p className="alpha-compendium-note">Classes: {Object.values(FIGURE_CLASS_LABELS).join(' · ')}. Tradição nunca é apresentada como fato comprovado.</p></>}
      {tab === 'heritage' && <><p className="alpha-compendium-lead">Três Heranças por civilização, fora da Teia universal. Cada uma abre por um avanço universal, tem Era mínima e custa Conhecimento mais um recurso.</p><CivPicker value={civ} onChange={setCiv} />
        <ol className="alpha-compendium-list">{heritageOf(civ).map((h, i) => <li key={h.id}><b>{['I', 'II', 'III'][i]} · {h.name}</b> <small>{text(h.era)}</small><StatusBadge status={h.status} feminine showActive /><p>{h.effect}</p></li>)}</ol></>}
      {tab === 'port' && <Rules>
        <li><b>O Distrito Marítimo inclui o Porto básico.</b> Com ele a cidade constrói e recebe navios, e a pesca rende +1 Alimento.</li>
        <li><b>Só em cidade costeira:</b> exige uma borda d’água navegável (Costa ou Mar) junto à cidade.</li>
        <li><b>Estaleiro e Farol</b> são opcionais e ainda <b>sem efeito</b> nesta versão.</li>
        <li>Abre com Navegação Costeira. Peças terrestres embarcam num navio vizinho e desembarcam numa costa ao lado.</li>
      </Rules>}
      {tab === 'works' && <><p className="alpha-compendium-lead">Doze Obras, cada uma única no mundo e por cidade. Três passos (uma Ordem de Legado cada); ao concluir, +4 Prestígio e um efeito permanente.</p>
        <div className="alpha-gcard-row">{LEGACY_WORKS.map(w => <AlphaCard key={w.id} kind="work" compact art={workArtOf(w.id, 40, 3)} name={w.name} subtitle={text(w.path)} identity={LEGACY_WORK_IDENTITY[w.id]?.identity} effects={[{ key: 'e', label: 'Efeito', text: `+4 Prestígio · ${legacyWorkEffectText(w.id) ?? ''}` }, { key: 'c', label: 'Custo', text: Object.entries(w.cost).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${text(k)}`).join(' · ') }, { key: 'r', label: 'Exige', text: `Distrito ${text(w.requires.district)}${w.requires.fortification ? ' e Fortaleza' : ''}${w.requires.connectedCities ? `, ${w.requires.connectedCities} cidades ligadas por rota` : ''}` }]} />)}</div></>}
      {tab === 'explore' && <Rules>
        <li><b>Pioneiro explora terra. Frota explora mar. Tropa militar não explora.</b> (A Embarcação Costeira também explora pelo mar.)</li>
        <li>Escolha a Região fechada destacada junto à peça. A ordem é secreta: nada se revela antes da resolução da rodada.</li>
        <li><b>Orientação:</b> se a Região ainda está intacta e mais de uma orientação dá entrada à peça, você escolhe uma (“Orientação 1 de N”). Com uma só, ela é aplicada sozinha. Depois da primeira exploração, a orientação fica fixa.</li>
        <li><b>“Requer acesso naval.”</b> A Região não tem entrada por terra para o Pioneiro: só uma Frota ou Embarcação Costeira a explora. O inverso vale para navios (“Requer acesso por terra.”).</li>
        <li>Revelar uma Região rende +1 Prestígio e pode trazer uma Descoberta, só para quem a revelou.</li>
      </Rules>}
      {tab === 'discoveries' && <div className="alpha-gcard-row">{DISCOVERY_ORDER.map(kind => { const info = DISCOVERY_INFO[kind]; return <AlphaCard key={kind} kind="discovery" compact art={discoveryArtOf(kind, 40)} name={info.name} identity={info.identity} effects={[{ key: 'e', label: 'Efeito', text: info.effect }]} icons={<span>{info.marker ? 'Fica marcada no mapa' : 'Sem marco no mapa'}</span>} />; })}</div>}
      {tab === 'sizes' && <><p className="alpha-compendium-lead">Toda Região tem 7 hexes. O tamanho é escolhido no lobby.</p>
        <table className="alpha-compendium-table"><thead><tr><th>Tamanho</th><th>Regiões</th><th>Hexes</th><th>Jogadores</th></tr></thead><tbody>{SIZES.map(size => { const f = MAP_FOOTPRINT[size]; return <tr key={size}><th>{MAP_SIZE_NAMES[size]}</th><td>{f.regions}</td><td>{f.hexes}</td><td>{f.minPlayers}–{f.maxPlayers}</td></tr>; })}</tbody></table>
        <p className="alpha-compendium-note">Sugestão: 2 jogadores, Compacto · 3–4, Padrão · 5–6, Amplo. Compacto não é oferecido para 5–6 (as Pátrias ficariam vizinhas).</p></>}
      {tab === 'presets' && <dl className="alpha-compendium-facts is-wide">{PRESETS.map(([name, line]) => <div key={name}><dt>{name}</dt><dd>{line}</dd></div>)}</dl>}
    </div>
  </StrategicSurface>;
}

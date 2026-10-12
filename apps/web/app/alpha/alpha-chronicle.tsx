'use client';
import { useEffect, useState } from 'react';
import { ADVANCEMENTS, BUILDING_NAMES_PT, matchReportToCsv, type MatchReportV1 } from '@aoh/game-domain';
import { Segments } from './alpha-details';
import { alphaLabel as text } from './alpha-copy';

/**
 * Crônica da Partida: the post-match report (MatchReportV1) in plain language, in six pages. It opens from the final screen only, reads the stored report from
 * `/api/alpha?gameId=…&report=1` (seat + FINISHED are checked by the server) and never computes a rule: every number is the report's.
 */
type Page = 'summary' | 'civs' | 'economy' | 'development' | 'conflicts' | 'timeline';
const PAGES: readonly (readonly [Page, string])[] = [['summary', 'Resumo'], ['civs', 'Civilizações'], ['economy', 'Economia'], ['development', 'Desenvolvimento'], ['conflicts', 'Conflitos'], ['timeline', 'Linha do tempo']];
const RESOURCE_NAMES: Record<string, string> = { food: 'Alimento', wood: 'Madeira', stone: 'Pedra', metal: 'Metal', wealth: 'Riqueza', knowledge: 'Conhecimento', influence: 'Influência', culture: 'Cultura' };
const DECIDED: Record<string, string> = { prestige: 'Prestígio', research: 'pesquisas', population: 'população', wealth: 'riqueza', initiative: 'ordem de iniciativa' };
const CATEGORIES: Record<string, string> = { CITY: 'Cidade', EXPEDITION: 'Expedição', ADVANCE: 'Avanço', INFLUENCE: 'Influência', LEGACY: 'Legado' };
const DOMAINS: Record<string, string> = { LAND_AND_SEA: 'Terra e Mar', STONE_AND_METAL: 'Pedra e Metal', KNOWLEDGE: 'Saber', GOVERNMENT: 'Governo', TRADE: 'Comércio', OTHER: 'Outros' };

type Names = Record<string, string>;
const Spark = ({ values, label }: { values: readonly number[]; label: string }) => {
  if (values.length < 2) return <span className="alpha-spark is-empty">–</span>;
  const lo = Math.min(...values), hi = Math.max(...values), span = hi - lo || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${100 - ((value - lo) / span) * 100}`).join(' ');
  return <svg className="alpha-spark" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`${label}: de ${values[0]} a ${values.at(-1)}`}><polyline points={points} fill="none" vectorEffect="non-scaling-stroke" /></svg>;
};
const sum = (record: Record<string, number>) => Object.values(record).reduce((a, b) => a + b, 0);
const download = (name: string, type: string, body: string) => {
  try { const url = URL.createObjectURL(new Blob([body], { type })); const link = document.createElement('a'); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch { /* the export is a convenience */ }
};

export function AlphaChronicle({ roomId, names, selfSeat, onClose }: { roomId: string; names: Names; selfSeat: string; onClose: () => void }) {
  const [report, setReport] = useState<MatchReportV1 | null>(null), [error, setError] = useState<string | null>(null), [page, setPage] = useState<Page>('summary');
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const reply = await (await fetch(`/api/alpha?gameId=${encodeURIComponent(roomId)}&report=1`, { cache: 'no-store' })).json() as { ok: boolean; value?: MatchReportV1; error?: { message: string } };
        if (!alive) return;
        if (reply.ok && reply.value) setReport(reply.value); else setError(reply.error?.message ?? 'A Crônica não está disponível.');
      } catch { if (alive) setError('Não foi possível carregar a Crônica agora.'); }
    })();
    return () => { alive = false; };
  }, [roomId]);
  const who = (seat: string | null) => seat === null ? 'O mundo' : `${names[seat] ?? seat}${seat === selfSeat ? ' (você)' : ''}`;
  return <div className="alpha-modal-backdrop"><section className="alpha-modal alpha-chronicle" role="dialog" aria-modal="true" aria-labelledby="alpha-chronicle-title">
    <header className="alpha-chronicle-head"><div><p className="eyebrow">CRÔNICA DA PARTIDA</p><h2 id="alpha-chronicle-title">{report ? `${who(report.result.winner)} venceu` : 'Crônica'}</h2></div>
      <div className="alpha-chronicle-actions">
        {report && <button type="button" onClick={() => download(`cronica-${report.match.gameId}.json`, 'application/json', JSON.stringify(report, null, 2))}>Exportar JSON</button>}
        {report && <button type="button" onClick={() => download(`cronica-${report.match.gameId}.csv`, 'text/csv', matchReportToCsv(report))}>Exportar CSV</button>}
        <button type="button" onClick={onClose}>Fechar</button>
      </div></header>
    {error && <p role="alert">{error}</p>}
    {!report && !error && <p role="status">Carregando a Crônica…</p>}
    {report && <>
      <Segments label="Seções da Crônica" value={page} onChange={setPage} items={PAGES} />
      <div className="alpha-chronicle-body" key={page}>
        {page === 'summary' && <Summary report={report} who={who} />}
        {page === 'civs' && <Civs report={report} who={who} />}
        {page === 'economy' && <Economy report={report} who={who} />}
        {page === 'development' && <Development report={report} who={who} />}
        {page === 'conflicts' && <Conflicts report={report} who={who} />}
        {page === 'timeline' && <Timeline report={report} who={who} />}
      </div>
      <Limits report={report} />
    </>}
  </section></div>;
}

type Section = { report: MatchReportV1; who: (seat: string | null) => string };

function Summary({ report, who }: Section) {
  const m = report.match;
  return <>
    <p>{m.endReason === 'HEGEMONY' ? `Hegemonia consolidada na rodada ${m.roundsPlayed}.` : `Maior Prestígio ao fim das ${m.roundLimit} rodadas.`} {m.players} civilizações, mapa {m.mapSize ?? 'padrão'}, semente {m.seed}.{m.pace === 'ACCELERATED' && <> <b>Ritmo acelerado (experimental)</b>: capital já Povoado e cidades que crescem mais cedo; não comparável com o ritmo padrão.</>}</p>
    <div className="table-scroll"><table className="alpha-standings"><thead><tr><th>#</th><th>Civilização</th><th>Prestígio</th><th>Pesquisas</th><th>População</th><th>Riqueza</th><th>Desempate</th></tr></thead><tbody>
      {report.result.ranking.map(r => <tr key={r.seat}><td>{r.rank}</td><th scope="row">{who(r.seat)}<small>{text(report.seats.find(s => s.seat === r.seat)?.civilization ?? '')}{report.seats.find(s => s.seat === r.seat)?.kind === 'BOT' ? ' · bot' : ''}</small></th><td>{r.prestige}</td><td>{r.researched}</td><td>{r.population}</td><td>{r.wealth}</td><td>{r.decidedBy ? DECIDED[r.decidedBy] : '–'}</td></tr>)}
    </tbody></table></div>
    <h3>De onde veio o Prestígio</h3>
    <div className="table-scroll"><table className="alpha-standings"><thead><tr><th>Civilização</th><th>Marcos ★</th><th>Ambições</th><th>Obras</th><th>Regiões</th><th>Outras fontes</th><th>Total</th></tr></thead><tbody>
      {report.result.prestige.map(p => <tr key={p.seat}><th scope="row">{who(p.seat)}</th><td>{p.milestones}</td><td>{p.ambitions}</td><td>{p.works}</td><td>{p.explored}</td><td>{p.other}</td><td><b>{p.total}</b></td></tr>)}
    </tbody></table></div>
    <p className="alpha-hint">“Outras fontes” reúne cartas, Ressonância e Ameaças, menos penalidades de tratados.</p>
    <h3>Hegemonias</h3>
    <ul>{report.result.hegemony.map(h => <li key={h.seat}>{who(h.seat)}: {h.declaredPath ? `declarou ${text(h.declaredPath)} na rodada ${h.declaredRound}${h.qualifiedSince !== null ? `, cumprindo tudo desde a ${h.qualifiedSince}` : ''}` : 'não declarou'}. Melhor caminho: {[...h.paths].sort((a, b) => b.met - a.met)[0] ? `${text([...h.paths].sort((a, b) => b.met - a.met)[0]!.path)} (${[...h.paths].sort((a, b) => b.met - a.met)[0]!.met} de ${[...h.paths].sort((a, b) => b.met - a.met)[0]!.of})` : '–'}.</li>)}</ul>
  </>;
}

function Civs({ report, who }: Section) {
  return <div className="alpha-chronicle-cards">{report.civilizations.map(c => {
    const seat = report.seats.find(s => s.seat === c.seat)!;
    return <article key={c.seat} className="alpha-chronicle-card"><h3>{who(c.seat)}</h3><p className="alpha-hint">{text(seat.civilization ?? '')}{seat.kind === 'BOT' ? ` · bot${seat.botPersona ? ` (${seat.botPersona})` : ''}` : seat.kind === 'HUMAN' ? ' · jogador' : ''}</p>
      <dl>
        <dt>Governo</dt><dd>{c.government ? text(c.government) : '–'}</dd>
        <dt>Cidades</dt><dd>{c.cities.final} ao fim · {c.cities.founded} fundada(s) · {c.cities.captured} tomada(s) · {c.cities.lost} perdida(s)</dd>
        <dt>Nível</dt><dd>máximo N{c.cities.maxLevel} · médio {c.cities.meanLevel}</dd>
        <dt>População</dt><dd>{c.population.firstRound ?? '–'} → {c.population.final}</dd>
        <dt>Território</dt><dd>{c.territory} hexes · {c.regionsDiscovered} Região(ões) descoberta(s)</dd>
        <dt>Pesquisas</dt><dd>{c.research.total}{c.research.heritages ? ` (${c.research.heritages} Herança(s))` : ''}</dd>
        <dt>Obras de Legado</dt><dd>{c.legacyWorks.filter(w => w.completedRound !== null).length} concluída(s){c.legacyWorks.some(w => w.completedRound === null) ? ` · ${c.legacyWorks.filter(w => w.completedRound === null).length} em andamento` : ''}</dd>
        <dt>Ressonância</dt><dd>{c.resonance.cycles} ciclo(s){c.resonance.repercussions !== null ? ` · ${c.resonance.repercussions} Repercussão(ões)` : ''}</dd>
      </dl></article>;
  })}</div>;
}

function Economy({ report, who }: Section) {
  return <>{report.economy.perSeat.map(e => <article key={e.seat} className="alpha-chronicle-card"><h3>{who(e.seat)}</h3>
    <div className="alpha-chronicle-sparks"><span>População <Spark values={e.populationSeries} label="População" /></span><span>Prestígio <Spark values={e.prestigeSeries} label="Prestígio" /></span><span>Nível máximo <Spark values={e.maxLevelSeries} label="Nível máximo" /></span><span>Ânimo médio <Spark values={e.mood.mean} label="Ânimo médio" /></span></div>
    <p>Fome em {e.shortage.foodRounds} rodada(s) · manutenção não paga em {e.shortage.upkeepRounds} · Revolta em {e.mood.revoltRounds} · sobre-extensão em {e.shortage.overextensionRounds}.</p>
    <div className="table-scroll"><table className="alpha-standings"><thead><tr><th>Recurso</th><th>Ao fim</th><th>Rodadas vazio</th><th>Rodadas no limite</th></tr></thead><tbody>
      {Object.keys(RESOURCE_NAMES).map(r => <tr key={r}><th scope="row">{RESOURCE_NAMES[r]}</th><td>{e.stock[r]?.at(-1) ?? '–'}</td><td>{e.emptyRounds[r] ?? 0}</td><td>{e.atCapRounds[r] ?? 0}</td></tr>)}
    </tbody></table></div></article>)}
    {report.coverage.truncated && <p className="alpha-hint">O registro guarda só as últimas {report.coverage.roundsRecorded} de {report.coverage.roundsExpected} rodadas.</p>}
  </>;
}

function Development({ report, who }: Section) {
  return <div className="alpha-chronicle-cards">{report.civilizations.map(c => <article key={c.seat} className="alpha-chronicle-card"><h3>{who(c.seat)}</h3>
    <p>Distritos: {sum(c.districts)} · Edifícios: {sum(c.buildings)}</p>
    <p>{Object.entries(c.districts).map(([k, n]) => `${text(k)} ${n}`).join(' · ') || 'Nenhum distrito'}</p>
    <p>{Object.entries(c.buildings).map(([k, n]) => `${(BUILDING_NAMES_PT as Record<string, string>)[k] ?? text(k)} ${n}`).join(' · ') || 'Nenhum edifício'}</p>
    <p>Pesquisas por domínio: {Object.entries(c.research.byDomain).map(([k, n]) => `${DOMAINS[k] ?? k} ${n}`).join(' · ') || '–'}</p>
    <p>Avanços, na ordem em que foram pesquisados: {c.research.order.length ? c.research.order.map(id => ADVANCEMENTS.find(node => node.id === id)?.name ?? (id.startsWith('her-') ? 'Herança' : id)).join(' → ') : '–'}</p>
    <p>Primeira cidade de cada nível: {c.cities.firstRoundAtLevel.map((r, i) => r === null ? null : `N${i + 1} na rodada ${r}`).filter(Boolean).join(' · ') || '–'}</p>
  </article>)}</div>;
}

function Conflicts({ report, who }: Section) {
  const c = report.conflicts, a = report.actions;
  return <>
    <p>{c.battles.pvp} batalha(s) entre civilizações · {c.battles.againstThreats} ataque(s) a Saqueadores/Piratas · {c.battles.byThreats} assalto(s) das Ameaças · {c.warsDeclared} guerra(s) declarada(s).</p>
    <div className="table-scroll"><table className="alpha-standings"><thead><tr><th>Civilização</th><th>Ataques</th><th>Vitórias</th><th>Defesas</th><th>Peças perdidas</th><th>Assaltos sofridos</th><th>Ordens usadas</th><th>Ordens ociosas</th></tr></thead><tbody>
      {c.perSeat.map(s => { const act = a.find(x => x.seat === s.seat); return <tr key={s.seat}><th scope="row">{who(s.seat)}</th><td>{s.attacks}</td><td>{s.attackWins}</td><td>{s.defences}</td><td>{s.unitsLost}</td><td>{s.assaultsSuffered}</td><td>{act ? Object.entries(act.ordersByCategory).map(([k, n]) => `${CATEGORIES[k] ?? k} ${n}`).join(' · ') : '–'}</td><td>{act?.ordersUnused ?? '–'}</td></tr>; })}
    </tbody></table></div>
    <p>Tratados: {Object.entries(c.diplomacy.treaties).map(([k, n]) => `${k} ${n}`).join(' · ') || 'nenhum'} · rotas ao fim: {c.diplomacy.routesAtEnd} · ofertas de comércio: {c.diplomacy.tradeOffers} ({c.diplomacy.tradeAccepted} aceitas).</p>
  </>;
}

function Timeline({ report, who }: Section) {
  return <ol className="alpha-chronicle-timeline">{report.timeline.map((t, index) => <li key={index}><b>Rodada {t.round}</b> <span>{t.seat ? who(t.seat) : 'Mundo'}</span> {t.text}</li>)}</ol>;
}

function Limits({ report }: { report: MatchReportV1 }) {
  const gaps = report.quality.filter(q => q.status !== 'OBSERVED');
  return <details className="alpha-chronicle-limits"><summary>O que esta Crônica não sabe ({gaps.length})</summary><ul>{gaps.map(q => <li key={q.field}><b>{q.status === 'UNAVAILABLE' ? 'Indisponível' : q.status === 'PARTIAL' ? 'Parcial' : 'Calculado'}</b> · {q.field}: {q.note}</li>)}</ul></details>;
}

import { useEffect, useRef, useState } from 'react';
import type { LocalAction, LocalView } from '@aoh/server/local-play';
import { ActionButton } from './inspectors';
import { label } from './presentation';
import { ResourceDisplay } from './resource-display';
const titles: Record<string, string> = { BUILD_DISTRICT: 'Construir distrito', BUILD_BUILDING: 'Construir edifício', SPECIALIZE_CITY: 'Especialização', ADOPT_GOVERNMENT: 'Adotar governo', IMPROVE_HEX: 'Melhorar território', FOUND_CITY: 'Fundar cidade' };
export function actionName(a: LocalAction) {
  const c = a.command;
  return label('district' in c ? c.district : 'building' in c ? c.building : 'specialization' in c ? c.specialization : 'government' in c ? c.government : 'improvement' in c ? c.improvement : c.type);
}
export function GovernmentEffects({ data, government }: { data: LocalView; government: keyof LocalView['view']['config']['governmentModifiers'] }) {
  const g = data.view.config.governmentModifiers[government];
  return <ul className="effects">
    {g.capacityFlat !== 0 && <li>Capacidade administrativa +{g.capacityFlat}</li>}{g.capacityPerCity !== 0 && <li>Capacidade por cidade +{g.capacityPerCity}</li>}
    {g.capitalStability !== 0 && <li>Estabilidade da capital +{g.capitalStability} por manutenção</li>}{g.globalStability !== 0 && <li>Estabilidade de todas as cidades +{g.globalStability}</li>}
    {g.developedCityStability !== 0 && <li>Estabilidade +{g.developedCityStability} a partir do desenvolvimento {g.developedMinLevel}</li>}
    {g.multiCityStability !== 0 && <li>Estabilidade +{g.multiCityStability} com pelo menos {g.multiCityMinimum} cidades</li>}
    {g.wealthBonusPercent !== 0 && <li>Riqueza +{g.wealthBonusPercent}% · especialização comercial soma +{g.commercialWealthBonusPercent}%</li>}
    {g.unstableCityCapacityPenalty !== 0 && <li>Capacidade −{g.unstableCityCapacityPenalty} por cidade com estabilidade abaixo de {g.unstableBelow}</li>}
    {g.capitalCrisisPenalty !== 0 && <li>Estabilidade das cidades −{g.capitalCrisisPenalty} quando a capital está abaixo de {g.capitalCrisisBelow}</li>}
    {g.commandPointsDelta !== 0 && <li>Pontos de comando {g.commandPointsDelta}</li>}
  </ul>;
}
export function ActionBrowser({ kind, data, run, close, busy }: { kind: string; data: LocalView; run: (a: LocalAction) => void; close: () => void; busy: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null); const [name, setName] = useState('Fronteira');
  useEffect(() => { const d = dialog.current; const previous = document.activeElement; d?.showModal(); return () => { d?.close(); if (previous instanceof HTMLElement) previous.focus(); }; }, []);
  return <dialog ref={dialog} onCancel={close} aria-labelledby="action-title"><header><div><span className="eyebrow">DECISÃO CIVILIZACIONAL</span><h2 id="action-title">{titles[kind]}</h2></div><button aria-label="Fechar" onClick={close}>×</button></header>
    {kind === 'FOUND_CITY' && <label>Nome da cidade<input value={name} maxLength={80} onChange={e => setName(e.target.value)} /></label>}
    <div className="catalog">{data.actions.filter(a => a.command.type === kind).map((a, i) => {
      const c = a.command; const rules = data.view.config.territory;
      const entry = c.type === 'BUILD_DISTRICT' ? rules.districts[c.district] : c.type === 'BUILD_BUILDING' ? rules.buildings[c.building] : null;
      return <article key={i}><h3>{kind === 'FOUND_CITY' ? 'Nova cidade' : actionName(a)}</h3>
        {entry && <><p>Desenvolvimento mínimo {entry.minimumDevelopment}{'district' in entry ? ` · Requer distrito ${label(entry.district)}` : ''}</p><ResourceDisplay values={entry.production} compact /><p>{entry.workerRequirement ? `Produção requer ${label(entry.workerRequirement)} presente.` : 'Sem requisito de trabalhador.'}</p>{entry.administrativeCapacity > 0 && <p>Capacidade administrativa +{entry.administrativeCapacity}</p>}{entry.garrisonCapacity > 0 && <p>Guarnição +{entry.garrisonCapacity} · sem combate</p>}{'growthThresholdReduction' in entry && entry.growthThresholdReduction > 0 && <p>Limiar de crescimento −{entry.growthThresholdReduction}</p>}{'specializationBonus' in entry && <><small>Bônus com especialização correspondente:</small><ResourceDisplay values={entry.specializationBonus} compact />{entry.specializationCapacityBonus > 0 && <p>Capacidade +{entry.specializationCapacityBonus}</p>}</>}</>}
        {c.type === 'ADOPT_GOVERNMENT' && <GovernmentEffects data={data} government={c.government} />}
        {c.type === 'SPECIALIZE_CITY' && <><p>Escolha permanente nesta versão.</p>{Object.entries(data.view.config.specializationModifiers[c.specialization]).filter(([k,v]) => !k.startsWith('future') && v !== 0).map(([k,v]) => <p key={k}>{({ producerBonus: 'Produção por produtor', artisanBonus: 'Produção por artesão', merchantBonus: 'Produção por mercador', scholarBonus: 'Produção por estudioso', administrativeCapacity: 'Capacidade administrativa' } as Record<string,string>)[k]} +{v}</p>)}{['MILITARY','CULTURAL'].includes(c.specialization) && <p>Bônus próprio futuro; sinergias de distrito já disponíveis.</p>}</>}
        {c.type === 'IMPROVE_HEX' && <><small>Terrenos: {rules.improvementCatalog[c.improvement].terrains.map(label).join(', ')}</small><p>Produção atual</p><ResourceDisplay values={data.view.visibleTerritory.find(t => t.id === c.hexId)?.yield ?? {}} compact />{a.yieldAfter && <><p>Após melhoria</p><ResourceDisplay values={a.yieldAfter} compact /></>}</>}
        <ActionButton action={a} title={kind === 'FOUND_CITY' ? 'Confirmar fundação' : `Confirmar ${actionName(a)}`} busy={busy || (kind === 'FOUND_CITY' && !name.trim())} run={action => run(c.type === 'FOUND_CITY' ? { ...action, command: { ...c, name } } : action)} />
      </article>;
    })}</div></dialog>;
}

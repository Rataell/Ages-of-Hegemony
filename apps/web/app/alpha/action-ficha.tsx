'use client';
import { useEffect, useState, type ReactNode } from 'react';
import type { AppliedResult } from '@aoh/game-domain';
import { ResourceDisplay } from '../play/resource-display';
import { moodSealSvg } from './mood-seal';
import { compareApplied, costView, effectLine, fichaModel, type FichaComparison, type FichaCost, type FichaEffect, type FichaModel, type FichaOptions, type RememberedPreview } from './action-ficha-model';
import type { ActionPreviewState } from './action-preview';

/**
 * Ficha de Ação (Cena E of the Mesa Viva): EVERY action follows Estado atual → Elegibilidade → Custo → Previsto → Confirmar → Aplicado. It never shows a button that does
 * not work without saying why. All numbers come from the engine (`previewAction`, `ResolutionEvent.applied`); this file only lays them out.
 */
const STEPS = ['Estado', 'Elegibilidade', 'Custo', 'Prévia', 'Confirmar', 'Resultado'];

/** Phones: the Ficha is a compact sheet (no step row, Estado on one line). */
export function useCompactFicha(): boolean {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const query = window.matchMedia('(max-width: 760px)'), read = () => setCompact(query.matches);
    read(); query.addEventListener('change', read);
    return () => query.removeEventListener('change', read);
  }, []);
  return compact;
}

const Seal = ({ mood, px }: { mood: number; px: number }) => <span className="afi-seal" dangerouslySetInnerHTML={{ __html: moodSealSvg(mood, px) }} />;

function CostChips({ cost, resolution }: { cost: FichaCost; resolution?: boolean }) {
  return <div className="afi-costs">
    {cost.chips.map(chip => <span key={chip.key} className={`afi-chip${chip.short ? ' is-short' : ''}`} title={chip.today !== undefined ? `Hoje: ${chip.today}. Planos anteriores desta rodada reservam parte; na resolução o saldo é ${chip.have}.` : undefined} data-cost={chip.key}>
      <ResourceDisplay values={{ [chip.key]: chip.paid }} compact />
      <small>{resolution ? 'na resolução ' : ''}{chip.have} → <b>{chip.after}</b></small></span>)}
    {cost.free && <span className="afi-chip is-free">Sem custo de recurso</span>}
    {cost.order && <span className="afi-chip" data-cost="order">{cost.order}</span>}
    {cost.activation && <span className="afi-chip" data-cost="activation">{cost.activation}</span>}
    {cost.moodCost && <span className="afi-chip is-warn" data-cost="mood">{cost.moodCost}</span>}
  </div>;
}

function EffectRows({ effects, applied }: { effects: FichaEffect[]; applied?: boolean }) {
  if (!effects.length) return <p className="afi-mute">{applied ? 'Nenhuma mudança registrada.' : 'Nenhuma mudança prevista.'}</p>;
  return <ul className="afi-effects">{effects.map(effect => <li key={effect.id} className={effect.loss ? 'is-loss' : ''} data-effect={effect.kind}>
    {effect.mood
      ? <span className="afi-mood-change"><Seal mood={effect.mood.before} px={30} /><i aria-hidden="true">→</i><Seal mood={effect.mood.after} px={30} /><b>{effect.label} {effect.before} → {effect.after}</b></span>
      : <span><b>{effect.label}</b> {effect.certainty === 'HIDDEN' ? <span className="afi-mute">resultado oculto até resolver</span> : <>{effect.before} → <b>{effect.after}</b>{effect.delta ? <em className="afi-delta"> ({effect.delta})</em> : null}</>}</span>}
    {effect.certaintyLabel && effect.certainty !== 'HIDDEN' && <small className="afi-tag">{effect.certaintyLabel}</small>}
    {effect.note && <small className="afi-note">{effect.note}</small>}
  </li>)}</ul>;
}

export interface ActionFichaProps extends FichaOptions {
  title: string; preview: ActionPreviewState; confirmLabel: string; onConfirm: () => void;
  /** A control row between Estado atual and Elegibilidade (levels of Governar, quantity of Recrutar). */
  controls?: ReactNode;
  /** Extra lines inside Custo (Governar's payment and reservation). */
  costExtra?: ReactNode;
  /** Extra content inside Previsto (the pieces that will appear in the city). */
  predictedExtra?: ReactNode;
}

export function ActionFicha({ title, preview, confirmLabel, onConfirm, controls, costExtra, predictedExtra, ...options }: ActionFichaProps) {
  const compact = useCompactFicha();
  const model: FichaModel | null = fichaModel(preview, options);
  const failed = preview.status === 'error' ? preview.message : null;
  const blocked = model ? !model.eligible : failed !== null;
  const step = !model ? 1 : model.confirm.loading ? 1 : blocked ? 2 : 5;
  const reason = options.gate ?? failed ?? model?.confirm.reason ?? 'Conferindo a ação…';
  return <div className={`afi${compact ? ' is-compact' : ''}`} data-ficha={title} data-eligible={model?.eligible ?? ''} aria-busy={preview.status === 'loading'}>
    {!compact && <div className="afi-flow"><ol className="afi-steps" aria-label="Etapas da ação">{STEPS.map((name, index) => <li key={name} title={name} className={index + 1 <= step ? (blocked && index === 1 ? 'is-bad' : 'is-on') : ''}>{index + 1}</li>)}</ol><span className={`afi-step-now${blocked ? ' is-bad' : ''}`}>{step} · {STEPS[step - 1]}</span></div>}
    <section className="afi-band afi-state" aria-label="Estado atual">
      <span className="afi-cap">Estado atual</span>
      {model ? <span className="afi-stateline">{model.state.mood !== null && <Seal mood={model.state.mood} px={compact ? 22 : 28} />}
        <span>{[model.state.name, model.state.level, model.state.band ? `${model.state.band} ${model.state.mood}/6` : null, model.state.orders, model.state.activations].filter(Boolean).join(' · ')}</span></span>
        : <span className="afi-mute">Conferindo a ação…</span>}
    </section>
    {controls}
    {failed && <section className="afi-band is-bad" aria-label="Elegibilidade"><span className="afi-cap">Elegibilidade</span><span className="afi-line is-bad" role="alert">✗ {failed}</span></section>}
    {model && <section className={`afi-band ${model.eligible ? 'is-ok' : 'is-bad'}${model.confirm.loading ? ' is-stale' : ''}`} aria-label="Elegibilidade" data-band="eligibility">
      <span className="afi-cap">Elegibilidade</span>
      <div className={model.eligible ? 'afi-inline' : 'afi-stack'}>{model.eligibility.map((line, index) => <span key={index} className={`afi-line is-${line.tone}`} role={line.tone === 'bad' ? 'alert' : undefined}>{line.tone === 'ok' ? '✓' : line.tone === 'bad' ? '✗' : '·'} {line.text}{line.hint && <small className="afi-hint"> {line.hint}</small>}</span>)}</div>
    </section>}
    {model && <section className={`afi-band afi-cost${blocked ? ' is-dim' : ''}${model.confirm.loading ? ' is-stale' : ''}`} aria-label="Custo" data-band="cost">
      <span className="afi-cap">Custo</span>
      <CostChips cost={model.cost} />
      {model.cost.substitution.map(text => <span key={text} className="afi-line is-warn">↔ {text}</span>)}
      {model.cost.upkeep && <span className="afi-line is-warn">{model.cost.upkeep}</span>}
      {costExtra}
    </section>}
    {model && <section className={`afi-band afi-pred${blocked ? ' is-dim' : ''}${model.confirm.loading ? ' is-stale' : ''}`} aria-label="Previsto" data-band="predicted">
      <span className="afi-cap">{blocked ? 'Previsto' : 'Previsto, nada foi aplicado'}</span>
      {blocked ? <span className="afi-mute">Indisponível até resolver o bloqueio acima.</span> : <><EffectRows effects={model.effects} />{predictedExtra}{model.warnings.map(text => <p key={text} className="afi-warn" role="status">⚠ {text}</p>)}</>}
    </section>}
    <div className="afi-foot">
      <button type="button" className="ctx-go" disabled={!model?.confirm.enabled} onClick={onConfirm}>{confirmLabel}</button>
      {!model?.confirm.enabled && <small className="ctx-why" role="status" data-why>{reason}</small>}
    </div>
    {!compact && <section className="afi-band afi-applied is-pending" aria-label="Aplicado"><span className="afi-cap">Aplicado</span><span className="afi-mute">Aparece aqui, comparado com o previsto, quando a rodada for resolvida.</span></section>}
  </div>;
}

/** Resultado: what a planned urban action REALLY did (`ResolutionEvent.applied`), and, when this browser kept the preview, whether it matched. */
export function AppliedResultBlock({ applied, memory, compact = false }: { applied: AppliedResult; memory?: Pick<RememberedPreview, 'effects' | 'paid' | 'warnings'> | null; compact?: boolean }) {
  const effects = applied.effects.map(effectLine), cost = costView(applied.cost);
  const comparison: FichaComparison | null = memory ? compareApplied(memory, applied) : null;
  return <div className={`afi-applied-block${compact ? ' is-compact' : ''}`} data-applied>
    <div className="afi-applied-head"><b>Aplicado (autoritativo)</b>
      {comparison && (comparison.same ? <span className="afi-same" data-compare="same">✓ igual ao previsto</span> : <span className="afi-diff" data-compare="diff">Δ diferente do previsto</span>)}</div>
    <EffectRows effects={effects} applied />
    <CostChips cost={cost} resolution />
    {comparison && !comparison.same && <div className="afi-compare" role="note">
      {comparison.deltas.map(delta => <span key={delta.label}><b>{delta.label}</b>: previsto {delta.predicted}, aplicado {delta.applied}</span>)}
      {comparison.reason && <small>{comparison.reason}</small>}</div>}
  </div>;
}

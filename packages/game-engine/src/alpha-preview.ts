import {
  ADVANCEMENTS, AlphaEraSchema, FORTIFICATION_UPGRADES, OFFERED_BUILDINGS, buildingSpec, elevateRequirement, heritageAdvance, moveLegs, nextLevel, orderTypeForCommand,
  ALPHA_RESOURCE_KEYS, emptyAlphaResourcePool,
  type ActionCost, type ActionEffect, type AlphaCommand, type AlphaOrderType, type AlphaResourcePool, type AlphaState, type MoveLeg, type PlayerId,
} from '@aoh/game-domain';
import { affordability, alphaCostWithMetal, alphaPay, alphaResourcePayment, type Affordability } from './alpha-resources.js';
import { alphaActionUsage } from './alpha-actions.js';
import { LEGAL_COMMANDS } from './alpha-phases.js';
import { activationCapacity, cityPair, districtSlots, governQuote, moodBand, recruitLimit } from './alpha-city.js';
import { cityGate, cityActivations, performUrbanAction, plannedTrial, produceBreakdown, syncCityMetadata, urbanBlock, urbanCost, type PlanTrial, type UrbanParams } from './alpha-urban.js';
import { RESOURCE_PT, ERA_PT, LEVEL_PT, activationOf, advanceName, appliedUrban, eraNumber, orderCharge, resourceDelta, type UrbanPlan } from './alpha-applied.js';
import { foodEatenOf } from './alpha-growth.js';
import { hasUnlock } from './alpha-institutions.js';
import { previewMoveOrder, type MoveBlocker, type MoveOrderPreview } from './alpha-move.js';
import { combatPreview } from './alpha-combat.js';
import { unitAdvance } from './alpha-military.js';
import { settleWithPioneer } from './alpha-cities.js';
import { tradePath, validateInfluence } from './alpha-diplomacy.js';
import { applyCommand } from './engine.js';
import { kitUnitCost, kitWorksCost } from './alpha-kits.js';
import { stackHex } from './alpha-stack.js';
import { isCoastalCity } from './alpha-water.js';
import { DISTRICT_NAMES } from './alpha-messages.js';

/**
 * previewAction · the read-only twin of every command, for the Ficha de Ação (UX board directive, slice 4). It answers, for one command of one seat, in this order:
 * is the command eligible and, if not, which concrete causes stop it; what does it cost (Ordem, ativação, recursos with the Riqueza substitution); what will it change; what
 * should the player be warned about; and when does it happen. It never writes: every effect comes from running the REAL engine function on a `structuredClone` of the match
 * (the pattern `independentBlock`, `settleBlock` and `plannedTrial` already use), after replaying the seat's earlier plans of the round, so the preview reads the stock and
 * the Ânimo the action will really find at resolution. The resolver builds the `applied` of a plan with the same function (`appliedUrban`), so preview == applied by construction.
 *
 * Coverage is explicit: `FULL` (Produzir, Governar, Recrutar, Construir, Elevar, Pesquisar, Mover, Fundar, Estrada, Reivindicar/Melhorar/Trabalhar), `PARTIAL` (eligibility and
 * cost, effect not detailed: Atacar, Influência, Comércio, the other urban actions) and `UNSUPPORTED` (everything else): an unsupported command is never faked as eligible.
 */
export type BlockerKind = 'RESOURCE' | 'ADVANCE' | 'ERA' | 'HEX' | 'ORDER' | 'ACTIVATION' | 'SOLDIERS' | 'POPULATION';
export interface ActionBlocker {
  code: string; message: string;
  missing?: { kind: BlockerKind; id?: string; have?: number | string; need?: number | string };
  /** How to unlock it, in words ("Pesquise Alvenaria", "Riqueza cobriria: 2"). */
  unlock?: string;
}
export interface ActionWarning { code: string; message: string }
export interface PreviewCost extends ActionCost { /** True when the stock after is negative somewhere: the command cannot be paid. */ shortfall?: boolean }
export interface ActionPreview {
  command: string;
  /** FULL: every field is real. PARTIAL: eligibility and cost, no effect list. UNSUPPORTED: the command has no preview yet (never eligible). */
  coverage: 'FULL' | 'PARTIAL' | 'UNSUPPORTED';
  eligible: boolean;
  blockers: ActionBlocker[];
  cost: PreviewCost;
  effects: ActionEffect[];
  warnings: ActionWarning[];
  resolvesAt: 'NOW' | 'RESOLUTION';
  /** Estado atual: the seat's stock and Orders, and the city when the command names one. */
  current: { resources: AlphaResourcePool; orders: { used: number; limit: number }; city?: { cityId: string; level: string; mood: number; band: string; population: number; capacity: number; activations: { used: number; max: number } | null } };
  /** Action-specific readings the Ficha shows (produce, govern, recruit, move, combat, food). */
  details?: Record<string, unknown>;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const eraText = (era: string): string => `Era ${ROMAN[eraNumber(era) - 1] ?? '?'} (${ERA_PT[era] ?? era})`;
const nonZero = (pool: Partial<AlphaResourcePool>): Partial<AlphaResourcePool> => Object.fromEntries(Object.entries(pool).filter(([, amount]) => (amount ?? 0) !== 0)) as Partial<AlphaResourcePool>;
const blockerOf = (code: string, message: string, extra: Partial<ActionBlocker> = {}): ActionBlocker => ({ code, message, ...extra });

/** Why a cost cannot be paid, one blocker per missing resource, naming how much is missing and whether Riqueza would cover it. */
export function resourceBlockers(report: Affordability): ActionBlocker[] {
  if (report.ok) return [];
  const list: ActionBlocker[] = [];
  for (const lack of report.lacking) {
    list.push(blockerOf('NO_RESOURCE', `Falta ${lack.need - lack.have} ${RESOURCE_PT[lack.resource]} (tem ${lack.have}, precisa de ${lack.need}). Riqueza não cobre ${RESOURCE_PT[lack.resource]}.`, { missing: { kind: 'RESOURCE', id: lack.resource, have: lack.have, need: lack.need } }));
  }
  const wealthShort = report.wealthHave < report.wealthNeeded;
  const overCap = report.covered > report.coverCap;
  for (const [key, units] of Object.entries(report.shortages) as ['wood' | 'stone' | 'metal', number][]) {
    const have = report.cost[key] - units;
    const hint = overCap ? (report.coverCap === 0 ? 'Riqueza não pode cobrir um custo de material tão pequeno (o limite é uma fração do custo).' : `Riqueza só pode cobrir até ${report.coverCap} unidade(s) de material neste custo.`) : wealthShort ? `Riqueza cobriria ${report.covered} unidade(s) de material (${report.wealthNeeded} Riqueza no total), mas você tem ${report.wealthHave}.` : undefined;
    list.push(blockerOf('NO_RESOURCE', `Faltam ${units} ${RESOURCE_PT[key]} (tem ${have}, precisa de ${report.cost[key]}).${hint ? ` ${hint}` : ''}`, { missing: { kind: 'RESOURCE', id: key, have, need: report.cost[key] }, ...(hint ? { unlock: hint } : {}) }));
  }
  if (wealthShort && !overCap && !Object.keys(report.shortages).length) {
    list.push(blockerOf('NO_RESOURCE', `Falta ${report.wealthNeeded - report.wealthHave} Riqueza (tem ${report.wealthHave}, precisa de ${report.wealthNeeded}).`, { missing: { kind: 'RESOURCE', id: 'wealth', have: report.wealthHave, need: report.wealthNeeded } }));
  }
  return list;
}
/** Where a missing advance is found: the Teia node that carries the tag. */
const advanceFor = (tag: string): { id: string; name: string } | null => { const node = ADVANCEMENTS.find(candidate => candidate.unlocks.includes(tag)); return node ? { id: node.id, name: node.name } : null; };
const advanceBlocker = (id: string, name: string, what: string): ActionBlocker => blockerOf('NO_ADVANCE', `${what} exige o avanço da Teia ${name}.`, { missing: { kind: 'ADVANCE', id, need: name }, unlock: `Pesquise ${name}` });
const eraBlocker = (have: string, need: string, what: string): ActionBlocker => blockerOf('ERA', `${what} exige a ${eraText(need)}; você está na ${eraText(have)}.`, { missing: { kind: 'ERA', id: need, have: eraNumber(have), need: eraNumber(need) } });

/** The same gate cityGate enforces, one concrete cause at a time (Ordens, ativações, Revolta, ocupação). */
function gateBlockers(state: AlphaState, actor: PlayerId, plan: UrbanPlan, engineMessage: string): ActionBlocker[] {
  const meta = state.cities.find(candidate => candidate.cityId === plan.cityId), usage = alphaActionUsage(state, actor), charge = orderCharge(state, actor, plan);
  if (state.phase !== 'PLANNING') return [blockerOf('PHASE', engineMessage)];
  if (state.players.find(player => player.playerId === actor)?.ready) return [blockerOf('READY', engineMessage)];
  const list: ActionBlocker[] = [];
  if (usage.used + charge > usage.limit) list.push(blockerOf('NO_ORDERS', `Sem Ordens: ${usage.used} de ${usage.limit} em uso nesta rodada.`, { missing: { kind: 'ORDER', id: plan.action === 'RESEARCH' ? 'ADVANCE' : 'CITY', have: usage.used, need: usage.used + charge } }));
  if (!meta || meta.currentOwnerId !== actor) return [blockerOf('NOT_OWN_CITY', 'Escolha uma cidade própria.')];
  if (plan.action !== 'RESEARCH') {
    const act = cityActivations(state, actor, plan.cityId)!;
    if (act.councilBlocked) list.push(blockerOf('COUNCIL', 'Conselho: no máximo uma segunda ativação por rodada em toda a civilização.', { missing: { kind: 'ACTIVATION', id: plan.cityId, have: act.count, need: act.count + 1 } }));
    else if (act.left === 0) list.push(blockerOf('NO_ACTIVATION', `Cidade sem ativação: ${act.count} de ${act.allowed} usadas${act.allowed === 1 ? ' (Abalada ou Sobre-extensão limitam a 1)' : ''}.`, { missing: { kind: 'ACTIVATION', id: plan.cityId, have: act.count, need: act.count + 1 } }));
  }
  if (list.length === 0) list.push(blockerOf('RULE', engineMessage));
  return list;
}

/** Independent, concrete causes for BUILD, ELEVATE, RESEARCH and RECRUIT; each reads the same data the engine's block reads and names what is missing. */
function actionBlockers(state: AlphaState, actor: PlayerId, plan: UrbanPlan, nominal: AlphaResourcePool): ActionBlocker[] {
  const progress = state.players.find(player => player.playerId === actor)!, pair = cityPair(state, plan.cityId);
  if (!pair) return [];
  const list: ActionBlocker[] = [];
  const pay = (scope?: 'BUILD') => resourceBlockers(affordability(state, actor, nominal, scope));
  if (plan.action === 'ELEVATE') {
    const next = nextLevel(pair.meta.level);
    if (!next) return [blockerOf('RULE', 'A cidade já é uma Metrópole Imperial.')];
    const req = elevateRequirement(next, state.rules.pace)!;
    if (pair.city.population < req.minPopulation) list.push(blockerOf('POPULATION', `Elevar a ${LEVEL_PT[next]} exige ${req.minPopulation} habitantes; a cidade tem ${pair.city.population}.`, { missing: { kind: 'POPULATION', id: plan.cityId, have: pair.city.population, need: req.minPopulation }, unlock: 'Cresça a cidade (Crescer usa Alimento na manutenção)' }));
    if (AlphaEraSchema.options.indexOf(progress.era) < AlphaEraSchema.options.indexOf(req.era)) list.push(eraBlocker(progress.era, req.era, `Elevar a ${LEVEL_PT[next]}`));
    for (const id of req.advances.filter(item => !progress.research.includes(item))) list.push(advanceBlocker(id, advanceName(id), `Elevar a ${LEVEL_PT[next]}`));
    list.push(...pay());
  } else if (plan.action === 'RESEARCH' && plan.advancementId) {
    const node = ADVANCEMENTS.find(candidate => candidate.id === plan.advancementId), heritage = heritageAdvance(plan.advancementId);
    const target = node ?? heritage;
    if (!target) return [blockerOf('RULE', 'Avanço desconhecido.')];
    const name = target.name;
    if (progress.research.includes(target.id)) return [blockerOf('RULE', `${name} já foi pesquisado.`)];
    if (AlphaEraSchema.options.indexOf(progress.era) < AlphaEraSchema.options.indexOf(target.era)) list.push(eraBlocker(progress.era, target.era, `Pesquisar ${name}`));
    if (heritage && !progress.research.includes(heritage.prerequisite)) list.push(advanceBlocker(heritage.prerequisite, advanceName(heritage.prerequisite), `A Herança ${name}`));
    if (node) {
      for (const id of node.prerequisites.filter(item => !progress.research.includes(item))) list.push(advanceBlocker(id, advanceName(id), `Pesquisar ${name}`));
      if (node.prerequisitesAny.length > 0 && !node.prerequisitesAny.some(item => progress.research.includes(item))) {
        const names = node.prerequisitesAny.map(advanceName);
        list.push(blockerOf('NO_ADVANCE', `Pesquisar ${name} exige um destes avanços: ${names.join(' ou ')}.`, { missing: { kind: 'ADVANCE', id: node.prerequisitesAny.join('|'), need: names.join(' ou ') }, unlock: `Pesquise ${names[0]}` }));
      }
      for (const id of node.excludes.filter(item => progress.research.includes(item))) list.push(blockerOf('EXCLUDED', `${name} é excluído por ${advanceName(id)}, que você já pesquisou (escolha OU).`));
    }
    list.push(...pay());
  } else if (plan.action === 'RECRUIT' && plan.unit) {
    const entry = state.rules.units[plan.unit], count = plan.count ?? 1;
    if (AlphaEraSchema.options.indexOf(progress.era) < AlphaEraSchema.options.indexOf(entry.era)) list.push(eraBlocker(progress.era, entry.era, `Recrutar ${entry.name}`));
    const opening = unitAdvance(plan.unit);
    if (opening && !hasUnlock(state, actor, `unit:${plan.unit}`)) list.push(advanceBlocker(opening.id, opening.name, `Recrutar ${entry.name}`));
    if (count > recruitLimit(state, actor, plan.cityId)) list.push(blockerOf('RECRUIT_LIMIT', `Esta ativação recruta no máximo ${recruitLimit(state, actor, plan.cityId)} peça(s) (Capacidade da cidade); você pediu ${count}.`));
    // Each piece is paid on its own (the Riqueza cap applies per piece), so the first piece the stock cannot pay is the one named.
    const paying = structuredClone(state), price = kitUnitCost(state, actor, plan.unit, plan.cityId);
    for (let index = 0; index < count; index++) {
      const one = alphaCostWithMetal(paying, actor, price.cost, price.metal), report = affordability(paying, actor, one);
      if (!report.ok) { list.push(...resourceBlockers(report).map(blocker => count > 1 ? { ...blocker, message: `Peça ${index + 1} de ${count}: ${blocker.message}` } : blocker)); break; }
      alphaPay(paying, actor, one);
    }
    const needs = entry.domain === 'LAND' && entry.strength > 0;
    const available = pair.city.workers.soldiers + pair.city.workers.unassigned;
    if (needs && available < count) list.push(blockerOf('NO_SOLDIERS', `Faltam Soldados: ${count} peça(s) pedem ${count} Soldado(s) ou habitantes Disponíveis; a cidade tem ${pair.city.workers.soldiers} Soldado(s) e ${pair.city.workers.unassigned} Disponível(is).`, { missing: { kind: 'SOLDIERS', id: plan.cityId, have: available, need: count }, unlock: 'Atribua habitantes como Soldados ou deixe-os Disponíveis' }));
    else if (needs && pair.city.population - count < 1) list.push(blockerOf('LAST_INHABITANT', 'A cidade precisa manter ao menos 1 habitante: não pode mobilizar o último.', { missing: { kind: 'POPULATION', id: plan.cityId, have: pair.city.population, need: count + 1 } }));
  } else if (plan.action === 'BUILD' && plan.build) {
    const build = plan.build;
    if (build.kind === 'DISTRICT' || build.kind === 'MARITIME') {
      const district = build.kind === 'MARITIME' ? 'MARITIME' : build.district, label = `Distrito ${DISTRICT_NAMES[district] ?? district}`;
      if (pair.meta.districts.includes(district as never)) list.push(blockerOf('DUPLICATE', `${label} já existe nesta cidade (um de cada tipo).`));
      if (!pair.meta.districts.includes(district as never) && pair.meta.districts.length >= districtSlots(state, plan.cityId)) list.push(blockerOf('NO_SLOT', `Sem vagas de distrito: ${pair.meta.districts.length} de ${districtSlots(state, plan.cityId)} ocupadas.`, { unlock: 'Eleve a cidade para ganhar vagas' }));
      if (district === 'MARITIME' && !isCoastalCity(state, plan.cityId)) list.push(blockerOf('NOT_COASTAL', 'O Distrito Marítimo exige uma borda d’água navegável.'));
      if (!hasUnlock(state, actor, `district:${district}`)) { const found = advanceFor(`district:${district}`); list.push(found ? advanceBlocker(found.id, found.name, label) : blockerOf('NO_ADVANCE', `${label} exige um avanço da Teia.`)); }
      list.push(...pay('BUILD'));
    } else if (build.kind === 'BUILDING') {
      const spec = buildingSpec(build.building);
      if (!OFFERED_BUILDINGS.includes(build.building)) return [];
      if (!pair.meta.districts.includes(spec.district as never)) list.push(blockerOf('MISSING_DISTRICT', `${spec.name} exige o Distrito ${DISTRICT_NAMES[spec.district as string] ?? spec.district}.`, { unlock: `Construa o Distrito ${DISTRICT_NAMES[spec.district as string] ?? spec.district}` }));
      if (pair.meta.buildings.includes(build.building)) list.push(blockerOf('DUPLICATE', `${spec.name} já existe nesta cidade.`));
      if (spec.path === 'CATALOG' && !hasUnlock(state, actor, `building:${build.building}`)) { const found = advanceFor(`building:${build.building}`); list.push(found ? advanceBlocker(found.id, found.name, spec.name) : blockerOf('NO_ADVANCE', `${spec.name} exige um avanço da Teia.`)); }
      list.push(...pay('BUILD'));
    } else {
      const next = FORTIFICATION_UPGRADES[FORTIFICATION_UPGRADES.indexOf(pair.meta.fortification.level as never) + 1];
      if (!next) return [blockerOf('RULE', 'A cidade já possui a fortificação máxima.')];
      const spec = state.rules.balance.fortification[next];
      if (AlphaEraSchema.options.indexOf(progress.era) < AlphaEraSchema.options.indexOf(spec.era)) list.push(eraBlocker(progress.era, spec.era, `Fortificação ${next}`));
      if (spec.militaryDistrict && !pair.city.districts.some(item => item.type === 'MILITARY')) list.push(blockerOf('MISSING_DISTRICT', `Fortificação ${next} exige o Distrito Militar.`, { unlock: 'Construa o Distrito Militar' }));
      list.push(...pay('BUILD'));
    }
  }
  return list;
}
/** Messages the structured causes above already explain; any other engine message is kept as its own blocker. */
const EXPLAINED = /Recursos insuficientes|exige o avanço|exige um avanço|Teia|era exigida|Era posterior|habitantes|Sem Soldado|recruta no máximo|pré-requisitos|vaga|Um distrito de cada tipo|já existe|exige o distrito|Marítimo/i;

function govBlockers(state: AlphaState, actor: PlayerId, plan: UrbanPlan, engineMessage: string, trial: PlanTrial | null): ActionBlocker[] {
  const list: ActionBlocker[] = [];
  const quote = governQuote(state, actor, plan.cityId), later = trial ? governQuote(trial.state, actor, plan.cityId) : quote;
  for (const blocker of quote.blockers.length ? quote.blockers : later.blockers) {
    const have = state.players.find(player => player.playerId === actor)!.resources;
    const stage = quote.blockers.length ? '' : 'Na resolução: ';
    const pool = quote.blockers.length ? have : trial!.state.players.find(player => player.playerId === actor)!.resources;
    list.push(blockerOf(blocker.code === 'NO_RESOURCE' || blocker.code === 'REPAIR_NO_STONE' ? 'NO_RESOURCE' : blocker.code, `${stage}${blocker.message}`, blocker.missing ? { missing: { kind: 'RESOURCE', id: blocker.missing.resource, have: pool[blocker.missing.resource], need: pool[blocker.missing.resource] + blocker.missing.amount }, ...(blocker.missing.resource === 'wealth' ? { unlock: `Ou 1 Cultura por nível` } : {}) } : {}));
  }
  if (list.length === 0) list.push(blockerOf(/nível/.test(engineMessage) ? 'LEVELS' : 'RULE', engineMessage));
  return list;
}

function baseState(state: AlphaState, actor: PlayerId, trial: PlanTrial | null): AlphaState {
  if (trial) return trial.state;
  const base = structuredClone(state);
  base.phase = 'URBAN_ACTIONS';
  base.players.find(player => player.playerId === actor)!.ready = false;
  return base;
}

function currentOf(state: AlphaState, actor: PlayerId, cityId?: string): ActionPreview['current'] {
  const progress = state.players.find(player => player.playerId === actor), usage = alphaActionUsage(state, actor);
  const current: ActionPreview['current'] = { resources: { ...(progress?.resources ?? emptyAlphaResourcePool()) }, orders: { used: usage.used, limit: usage.limit } };
  const pair = cityId ? cityPair(state, cityId) : null;
  if (pair && pair.ownerId === actor) {
    const act = cityActivations(state, actor, pair.meta.cityId);
    current.city = { cityId: pair.meta.cityId, level: pair.meta.level, mood: pair.meta.mood, band: moodBand(pair.meta.mood), population: pair.city.population, capacity: activationCapacity({ ...state, cities: state.cities.map(meta => meta.cityId === pair.meta.cityId ? { ...meta, urbanActionsUsed: 0 } : meta) }, pair.meta.cityId), activations: act ? { used: act.count, max: act.allowed } : null };
  }
  return current;
}

const orderBlock = (state: AlphaState, actor: PlayerId, type: AlphaOrderType | null): { order: ActionCost['order']; blocker: ActionBlocker | null } => {
  if (!type) return { order: null, blocker: null };
  const usage = alphaActionUsage(state, actor);
  const order = { type, usedBefore: usage.used, usedAfter: usage.used + 1, limit: usage.limit };
  return { order, blocker: order.usedAfter > order.limit ? blockerOf('NO_ORDERS', `Sem Ordens: ${usage.used} de ${usage.limit} em uso nesta rodada.`, { missing: { kind: 'ORDER', id: type, have: usage.used, need: usage.used + 1 } }) : null };
};

const skeleton = (state: AlphaState, actor: PlayerId, command: AlphaCommand, coverage: ActionPreview['coverage'], resolvesAt: ActionPreview['resolvesAt'], cityId?: string): ActionPreview => {
  const { order } = orderBlock(state, actor, orderTypeForCommand(command, state.phase));
  const current = currentOf(state, actor, cityId);
  return { command: command.type, coverage, eligible: false, blockers: [], cost: { resources: {}, stockAfter: { ...current.resources }, order, activation: null }, effects: [], warnings: [], resolvesAt, current };
};

function planOf(command: Extract<AlphaCommand, { type: 'URBAN_ACTION' }>): { plan: UrbanPlan; params: UrbanParams } {
  const params: UrbanParams = { ...(command.build ? { build: command.build } : {}), ...(command.unit ? { unit: command.unit } : {}), ...(command.advancementId ? { advancementId: command.advancementId } : {}), ...(command.count ? { count: command.count } : {}), ...(command.levels ? { levels: command.levels } : {}) };
  return { plan: { cityId: command.cityId, action: command.action, ...params }, params };
}

function previewUrban(state: AlphaState, actor: PlayerId, command: Extract<AlphaCommand, { type: 'URBAN_ACTION' }>): ActionPreview {
  const { plan, params } = planOf(command);
  const out = skeleton(state, actor, command, plan.action === 'PRODUCE' || plan.action === 'PROMOTE_MOOD' || plan.action === 'RECRUIT' || plan.action === 'BUILD' || plan.action === 'ELEVATE' || plan.action === 'RESEARCH' ? 'FULL' : 'PARTIAL', 'RESOLUTION', plan.cityId);
  const pair = cityPair(state, plan.cityId);
  if (!pair || pair.ownerId !== actor) { out.blockers = [blockerOf('NOT_OWN_CITY', 'Escolha uma cidade própria.')]; return out; }
  const trial = state.phase === 'PLANNING' ? plannedTrial(state, actor) : null;
  const engine = urbanBlock(state, actor, plan.cityId, plan.action, params, trial);
  const base = state.phase === 'PLANNING' ? baseState(state, actor, trial) : state;
  const nominal = urbanCost(base, actor, plan.cityId, plan.action, params);
  const usage = alphaActionUsage(state, actor), charge = orderCharge(state, actor, plan);
  const order = out.cost.order ? { ...out.cost.order, usedAfter: usage.used + charge } : null;
  const activation = state.phase === 'PLANNING' ? activationOf(base, actor, plan) : null;
  const stock = base.players.find(player => player.playerId === actor)!.resources;
  out.cost = { resources: nonZero(nominal), stockAfter: Object.fromEntries(ALPHA_RESOURCE_KEYS.map(key => [key, stock[key] - nominal[key]])) as Partial<AlphaResourcePool>, order, activation };
  if (trial) {
    const earlier = state.players.find(player => player.playerId === actor)!.plannedActions.filter(planned => planned.type === 'URBAN_ACTION').length;
    out.warnings.push({ code: 'EARLIER_PLANS', message: `Considera ${earlier} plano(s) urbano(s) anterior(es) desta rodada${trial.used.length ? `: ${trial.used.map(item => `${item.label}${item.spent ? ` (gasta ${item.spent})` : ''}${item.mood ? ` (Ânimo ${item.mood > 0 ? '+' : ''}${item.mood})` : ''}`).join('; ')}` : ''}. Planos de outras civilizações e Ordens futuras não entram.` });
  }
  if (state.phase !== 'PLANNING') { out.blockers = [blockerOf('PHASE', 'Disponível apenas no Planejamento.')]; return out; }

  if (engine) {
    const gate = cityGate(state, actor, plan.cityId, plan.action);
    if (gate) out.blockers = gateBlockers(state, actor, plan, gate);
    else if (plan.action === 'PROMOTE_MOOD') out.blockers = govBlockers(state, actor, plan, engine, trial);
    else {
      const structured = actionBlockers(state, actor, plan, nominal);
      out.blockers = structured.length ? structured : [blockerOf('RULE', engine)];
      if (structured.length && !EXPLAINED.test(engine)) out.blockers.push(blockerOf('RULE', engine));
    }
    if (plan.action === 'PROMOTE_MOOD') out.details = { govern: governQuote(trial?.state ?? state, actor, plan.cityId) };
    out.cost.shortfall = ALPHA_RESOURCE_KEYS.some(key => (out.cost.stockAfter[key] ?? 0) < 0);
    return out;
  }

  // The real engine function on a clone of the state the earlier plans leave: whatever it does is what the Ficha shows.
  const after = structuredClone(base);
  try { performUrbanAction(after, actor, { type: 'URBAN_ACTION', expectedVersion: after.version, planId: 'preview', cityId: plan.cityId, action: plan.action, ...params }); }
  catch (error) {
    const why = error instanceof Error ? error.message : 'A ação falharia.';
    out.blockers = [blockerOf('PLANNED', `Na resolução esta ação falharia e a Ordem seria perdida: ${why}`)];
    return out;
  }
  const applied = appliedUrban(base, after, actor, plan, nominal, { used: usage.used + charge, limit: usage.limit });
  out.eligible = true;
  out.effects = applied.effects;
  out.cost = { ...applied.cost };
  const moodCost = applied.cost.activation?.moodCost ?? 0;
  if (moodCost > 0) out.warnings.push({ code: 'SECOND_ACTIVATION', message: `2ª ativação desta cidade na rodada: custa ${moodCost} Ânimo (um Tribunal isentaria uma vez por rodada).` });
  else if (applied.cost.activation?.usedAfter === 2) out.warnings.push({ code: 'COURT_WAIVER', message: 'Tribunal: a 2ª ativação desta cidade não custa Ânimo.' });
  const details: Record<string, unknown> = {};
  if (plan.action === 'PRODUCE') {
    const breakdown = produceBreakdown(base, actor, plan.cityId);
    const stockFood = after.players.find(player => player.playerId === actor)!.resources.food, eaten = foodEatenOf(after, actor);
    details.produce = breakdown;
    details.food = { stockAfterAction: stockFood, eatenInMaintenance: eaten, balance: stockFood - eaten, shortage: stockFood < eaten, basis: 'Considera esta ação e os planos já enfileirados; outras produções, comércio e saques mudam o saldo.' };
    if (stockFood < eaten) out.warnings.push({ code: 'FOOD_SHORT', message: `Alimento previsto ao fim da rodada: ${stockFood} contra ${eaten} consumidos na manutenção (faltam ${eaten - stockFood}); sem Produzir em outras cidades, uma cidade passa fome.` });
    if (breakdown.forgone.hexes.length) out.warnings.push({ code: 'CAPACITY_LOSS', message: `Capacidade ${breakdown.capacity}: ${breakdown.forgone.hexes.length} hex(es) trabalhado(s) ficam sem trabalhador nesta ativação.` });
    const gross = breakdown.gross, gained = out.effects.filter(effect => effect.kind === 'RESOURCE');
    const discarded = ALPHA_RESOURCE_KEYS.filter(key => gross[key] > (gained.find(effect => effect.target === key) ? (gained.find(effect => effect.target === key)!.after as number) - (gained.find(effect => effect.target === key)!.before as number) : 0));
    if (discarded.length) out.warnings.push({ code: 'STORAGE_FULL', message: `Armazenamento cheio: ${discarded.map(key => `${RESOURCE_PT[key]}`).join(', ')} passa(m) do limite e o excedente é descartado.` });
    if (breakdown.threatened.length) out.warnings.push({ code: 'THREATENED_HEX', message: `${breakdown.threatened.length} hex(es) trabalhado(s) estão ocupados por uma ameaça e não rendem.` });
  } else if (plan.action === 'PROMOTE_MOOD') {
    const quote = governQuote(base, actor, plan.cityId);
    details.govern = { quote, chosenLevels: quote.repairOnly ? 0 : params.levels ?? quote.maxLevels, moodBefore: quote.mood, moodAfter: after.cities.find(meta => meta.cityId === plan.cityId)!.mood };
  } else if (plan.action === 'RECRUIT' && plan.unit) {
    const entry = state.rules.units[plan.unit], count = plan.count ?? 1, price = kitUnitCost(base, actor, plan.unit, plan.cityId), one = alphaCostWithMetal(base, actor, price.cost, price.metal);
    const spawned = after.units.filter(unit => unit.ownerId === actor && !base.units.some(old => old.id === unit.id));
    const spawn = spawned[0]?.hexId;
    const advance = unitAdvance(plan.unit);
    details.recruit = {
      unit: plan.unit, name: entry.name, count, unitCost: nonZero(one), total: out.cost.resources, substitution: out.cost.substitution ?? [],
      advance: advance ? { ...advance, researched: true } : null, soldiers: { soldiers: pair.city.workers.soldiers, available: pair.city.workers.unassigned, mobilizes: entry.domain === 'LAND' && entry.strength > 0 ? count : 0 },
      limit: recruitLimit(base, actor, plan.cityId), stack: spawn ? stackHex(after, actor, spawn) : null, spawnHex: spawn ?? null,
    };
    const upkeep = applied.cost.upkeepDelta;
    if (upkeep && (upkeep.food || upkeep.wealth)) out.warnings.push({ code: 'UPKEEP', message: `Manutenção futura: ${upkeep.food > 0 ? `+${upkeep.food} Alimento` : ''}${upkeep.food > 0 && upkeep.wealth > 0 ? ' e ' : ''}${upkeep.wealth > 0 ? `+${upkeep.wealth} Riqueza` : ''} por rodada.`.replace('  ', ' ') });
  }
  if (Object.keys(details).length) out.details = details;
  return out;
}

// --- Mover / Atacar / outras Ordens -----------------------------------------------------------------------------------------------------------------------------

const MOVE_HEX_CODES = new Set(['UNKNOWN_HEX', 'NOT_ADJACENT', 'BORDER', 'ENEMY_CITY', 'FOREIGN_PRESENCE', 'THREAT', 'STACK', 'DOMAIN']);
function moveBlocker(blocker: MoveBlocker, prefix = '', order?: MoveOrderPreview): ActionBlocker {
  const message = `${prefix}${blocker.message}`;
  if (blocker.code === 'NO_ORDERS' && order) return blockerOf('NO_ORDERS', message, { missing: { kind: 'ORDER', id: 'EXPEDITION', have: order.ordersBefore, need: order.ordersAfter } });
  if (MOVE_HEX_CODES.has(blocker.code) && blocker.hexId) return blockerOf(blocker.code, message, { missing: { kind: 'HEX', id: blocker.hexId } });
  return blockerOf(blocker.code, message);
}
function previewMove(state: AlphaState, actor: PlayerId, command: Extract<AlphaCommand, { type: 'QUEUE_ORDER' }>, order: Extract<Extract<AlphaCommand, { type: 'QUEUE_ORDER' }>['order'], { type: 'MOVE' }>): ActionPreview {
  const legs: MoveLeg[] = moveLegs(order);
  const out = skeleton(state, actor, command, 'FULL', 'RESOLUTION');
  const progress = state.players.find(player => player.playerId === actor)!;
  const preview = previewMoveOrder(state, actor, legs, { orderId: order.id });
  out.cost.order = { type: 'EXPEDITION', usedBefore: preview.ordersBefore, usedAfter: preview.ordersAfter, limit: preview.ordersLimit };
  out.details = { move: preview };
  const total = preview.legs.length;
  if (progress.ready) out.blockers.push(blockerOf('READY', 'Suas decisões já estão confirmadas para esta fase.'));
  for (const blocker of preview.blockers) out.blockers.push(moveBlocker(blocker, '', preview));
  for (const leg of preview.legs) for (const blocker of leg.blockers) out.blockers.push(moveBlocker(blocker, preview.coordinated ? `Trajeto ${leg.index + 1} de ${total}: ` : '', preview));
  out.eligible = out.blockers.length === 0;
  if (out.eligible) {
    for (const leg of preview.legs) {
      for (const piece of leg.pieces) {
        out.effects.push({ kind: 'POSITION', target: `unit:${piece.unitId}`, label: state.rules.units[piece.kind].name, before: piece.from, after: leg.destination, certainty: leg.frontier ? 'RANGE' : 'EXACT', note: `Custo ${leg.cost} de ${piece.budget} de movimento (resta ${piece.remaining}).${leg.frontier ? ' Entra numa Região fechada: ela é revelada.' : ''}` });
      }
      if (leg.frontier && leg.frontierRisk && leg.frontierRisk.danger === 'POSSIBLE') out.warnings.push({ code: 'FRONTIER_RISK', message: `${preview.coordinated ? `Trajeto ${leg.index + 1}: ` : ''}Perigo na descoberta: chance de ${Math.round(leg.frontierRisk.lossChance * 100)}% de perder a peça que entra na Região.` });
    }
  }
  return out;
}

function previewOtherOrder(state: AlphaState, actor: PlayerId, command: Extract<AlphaCommand, { type: 'QUEUE_ORDER' }>): ActionPreview {
  const order = command.order, out = skeleton(state, actor, command, 'PARTIAL', 'RESOLUTION');
  const progress = state.players.find(player => player.playerId === actor)!, gate = orderBlock(state, actor, orderTypeForCommand(command, state.phase));
  if (progress.ready) out.blockers.push(blockerOf('READY', 'Suas decisões já estão confirmadas para esta fase.'));
  if (gate.blocker) out.blockers.push(gate.blocker);
  const test = (run: () => void) => { try { run(); } catch (error) { out.blockers.push(blockerOf('RULE', error instanceof Error ? error.message : 'Ordem recusada.')); } };
  if (order.type === 'ATTACK') {
    const combat = combatPreview(state, actor, order);
    if (combat.blocked) out.blockers.push(blockerOf('RULE', combat.blocked));
    out.details = { combat };
    out.coverage = 'PARTIAL';
    if (!out.blockers.length) out.effects.push({ kind: 'STATE', target: `combat:${order.target}`, label: 'Resultado do combate', before: null, after: null, certainty: 'HIDDEN', note: combat.note });
  } else if (order.type === 'EXPLORE') out.blockers.push(blockerOf('RULE', 'Explorar agora é Mover: escolha o destino numa Região fechada com um Pioneiro.'));
  else if (order.type === 'TRADE') test(() => { tradePath(state, actor, order.fromCityId, order.toCityId); });
  else if (order.type === 'INFLUENCE') test(() => { validateInfluence(state, actor, order); });
  out.eligible = out.blockers.length === 0;
  if (out.eligible && order.type !== 'ATTACK') out.warnings.push({ code: 'EFFECT_NOT_DETAILED', message: 'Esta Ordem tem prévia de elegibilidade e custo; o efeito só aparece no resultado.' });
  return out;
}

// --- Fundar, Estrada, Reivindicar / Melhorar / Trabalhar ---------------------------------------------------------------------------------------------------------

function previewSettle(state: AlphaState, actor: PlayerId, command: Extract<AlphaCommand, { type: 'SETTLE' }>): ActionPreview {
  const out = skeleton(state, actor, command, 'FULL', 'NOW');
  const gate = orderBlock(state, actor, 'EXPEDITION');
  if (gate.blocker) out.blockers.push(gate.blocker);
  const trial = structuredClone(state);
  try { settleWithPioneer(trial, actor, command.unitId, command.name); }
  catch (error) { out.blockers.push(blockerOf('RULE', error instanceof Error ? error.message : 'Fundação indisponível.')); return out; }
  if (out.blockers.length) return out;
  const delta = resourceDelta(state, trial, actor);
  out.eligible = true;
  out.cost = { ...out.cost, resources: delta.spent, stockAfter: delta.stockAfter };
  const founded = trial.cities.find(meta => !state.cities.some(old => old.cityId === meta.cityId));
  out.effects.push({ kind: 'STATE', target: `city:${founded?.cityId ?? 'new'}`, label: 'Nova cidade', before: null, after: command.name, certainty: 'EXACT' });
  out.effects.push({ kind: 'UNITS', target: 'unit:PIONEER', label: state.rules.units.PIONEER.name, before: state.units.filter(unit => unit.ownerId === actor && unit.kind === 'PIONEER').length, after: trial.units.filter(unit => unit.ownerId === actor && unit.kind === 'PIONEER').length, certainty: 'EXACT', note: 'O Pioneiro é consumido na fundação.' });
  return out;
}

function previewRoad(state: AlphaState, actor: PlayerId, command: Extract<AlphaCommand, { type: 'BUILD_ROAD' }>): ActionPreview {
  const out = skeleton(state, actor, command, 'FULL', 'NOW');
  const gate = orderBlock(state, actor, 'CITY');
  if (gate.blocker) out.blockers.push(gate.blocker);
  const tile = state.core.map.find(candidate => candidate.id === command.hexId && candidate.ownerId === actor);
  if (!tile || state.roads.includes(tile.id)) { out.blockers.push(blockerOf('HEX', !tile ? 'Estrada só em território próprio: o hex não pertence a você.' : 'Este hex já tem estrada.', { missing: { kind: 'HEX', id: command.hexId } })); return out; }
  const cost = kitWorksCost(state, actor, state.rules.roadCost, tile), report = affordability(state, actor, cost);
  const nominal = report.cost;
  out.cost.resources = nonZero(nominal);
  out.cost.stockAfter = Object.fromEntries(ALPHA_RESOURCE_KEYS.map(key => [key, (state.players.find(player => player.playerId === actor)!.resources[key]) - nominal[key]])) as Partial<AlphaResourcePool>;
  out.blockers.push(...resourceBlockers(report));
  if (out.blockers.length) return out;
  const trial = structuredClone(state);
  alphaPay(trial, actor, cost);
  const delta = resourceDelta(state, trial, actor);
  out.eligible = true;
  out.cost = { ...out.cost, resources: delta.spent, stockAfter: delta.stockAfter, ...(report.covered ? { substitution: Object.entries(report.shortages).map(([resource, units]) => ({ resource: resource as 'wood', units: units!, wealth: units! * state.rules.balance.wealthConversionRate })) } : {}) };
  out.effects.push({ kind: 'STATE', target: `hex:${command.hexId}:road`, label: 'Estrada', before: null, after: 'estrada', certainty: 'EXACT' });
  return out;
}

/** The core's English refusals, in concrete Portuguese. Only the preview normalizes them; the core keeps its own codes and texts. */
function territoryMessage(code: string, hexId: string | undefined, fallback: string): string {
  const at = hexId ? ` (${hexId})` : '';
  switch (code) {
    case 'WRONG_PHASE': return 'Gestão de território só é possível no Planejamento.';
    case 'UNKNOWN_HEX': return `Hex desconhecido${at}.`;
    case 'HEX_NOT_OWNED': return `O hex${at} não pertence a você.`;
    case 'ALREADY_IMPROVED': return `O hex${at} já tem uma melhoria; trocar melhorias não está disponível.`;
    case 'INVALID_IMPROVEMENT': return `Esta melhoria não combina com o terreno ou os recursos do hex${at}.`;
    case 'INSUFFICIENT_RESOURCES': return 'Recursos insuficientes para o custo configurado.';
    case 'CITY_NOT_OWNED': return 'Escolha uma cidade própria.';
    case 'HEX_NOT_FREE': return `O hex${at} já tem dono: só hexes livres podem ser reivindicados.`;
    case 'INVALID_TERRITORY': return `Mar e terreno desconhecido não podem ser reivindicados${at}.`;
    case 'OUT_OF_RANGE': return `O hex${at} está além do raio administrativo da cidade.`;
    case 'DISCONNECTED_TERRITORY': return `O hex${at} precisa se ligar à cidade por um caminho contínuo de território próprio.`;
    case 'INVALID_WORKED_HEXES': return 'Um hex por Produtor, no máximo; cada hex deve ser produtivo, seu, dentro do raio e de uma única cidade.';
    default: return fallback;
  }
}
function previewTerritory(state: AlphaState, actor: PlayerId, command: Extract<AlphaCommand, { type: 'MANAGE' }>): ActionPreview {
  const inner = command.command;
  if (inner.type !== 'CLAIM_HEX' && inner.type !== 'IMPROVE_HEX' && inner.type !== 'ASSIGN_WORKED_HEXES') return unsupported(state, actor, command);
  const cityId = 'cityId' in inner ? inner.cityId : undefined;
  const out = skeleton(state, actor, command, 'FULL', 'NOW', cityId);
  const free = inner.type === 'ASSIGN_WORKED_HEXES';
  if (inner.playerId !== actor) { out.blockers.push(blockerOf('FORBIDDEN', 'Você só pode comandar sua própria civilização.')); return out; }
  if (!free) { const gate = orderBlock(state, actor, 'CITY'); if (gate.blocker) out.blockers.push(gate.blocker); }
  else out.cost.order = null;
  const occupied = state.occupations.some(o => ('cityId' in inner && inner.cityId === o.cityId) || ('hexId' in inner && state.core.map.find(t => t.id === inner.hexId)?.controllerCityId === o.cityId));
  if (occupied) out.blockers.push(blockerOf('OCCUPIED', 'Integre a cidade ocupada antes de administrar seus territórios e construções.'));
  const trial = structuredClone(state);
  let raw: ResourcePoolLike | null = null;
  const pay = alphaResourcePayment(trial);
  const payment = (player: Parameters<typeof pay>[0], cost: Parameters<typeof pay>[1]) => { const priced = inner.type === 'IMPROVE_HEX' ? kitWorksCost(trial, actor, cost) : cost; raw = priced; return pay(player, priced); };
  const result = applyCommand(trial.core, { ...inner, expectedVersion: trial.core.version }, payment);
  if (!result.ok) {
    const hexId = 'hexId' in inner ? inner.hexId : undefined;
    out.blockers.push(blockerOf(result.error.code, territoryMessage(result.error.code, hexId, result.error.message)));
    if (result.error.code === 'INSUFFICIENT_RESOURCES' && raw) { const report = affordability(state, actor, raw); out.blockers.pop(); out.blockers.push(...resourceBlockers(report)); out.cost.resources = nonZero(report.cost); }
    return out;
  }
  if (out.blockers.length) return out;
  trial.core = result.value; syncCityMetadata(trial);
  const delta = resourceDelta(state, trial, actor);
  out.eligible = true;
  out.cost = { ...out.cost, resources: delta.spent, stockAfter: delta.stockAfter };
  if (inner.type === 'CLAIM_HEX') out.effects.push({ kind: 'STATE', target: `hex:${inner.hexId}:owner`, label: 'Hex reivindicado', before: 'livre', after: 'seu', certainty: 'EXACT' });
  else if (inner.type === 'IMPROVE_HEX') out.effects.push({ kind: 'BUILDING', target: `hex:${inner.hexId}:improvement`, label: 'Melhoria do hex', before: null, after: inner.improvement, certainty: 'EXACT' });
  else {
    const old = state.core.players.flatMap(owner => owner.civilization.cities).find(city => city.id === inner.cityId)!;
    out.effects.push({ kind: 'STATE', target: `${inner.cityId}:worked-hexes`, label: 'Hexes trabalhados', before: old.workedHexIds.length, after: inner.hexIds.length, certainty: 'EXACT' });
  }
  return out;
}
type ResourcePoolLike = Parameters<typeof affordability>[2];

function unsupported(state: AlphaState, actor: PlayerId, command: AlphaCommand): ActionPreview {
  const out = skeleton(state, actor, command, 'UNSUPPORTED', 'RESOLUTION');
  out.blockers = [blockerOf('UNSUPPORTED', 'A prévia desta ação ainda não existe; a elegibilidade só é conhecida ao confirmar.')];
  return out;
}

/** Read-only. `command.expectedVersion` is ignored: a preview describes the match as it is now. */
export function previewAction(state: AlphaState, actor: PlayerId, command: AlphaCommand): ActionPreview {
  const progress = state.players.find(player => player.playerId === actor);
  if (!progress) { const out = unsupported(state, actor, command); out.blockers = [blockerOf('FORBIDDEN', 'Você não ocupa um lugar nesta partida.')]; return out; }
  if (state.core.status !== 'ACTIVE') { const out = unsupported(state, actor, command); out.blockers = [blockerOf('NOT_ACTIVE', 'Esta partida já terminou.')]; return out; }
  const legal = LEGAL_COMMANDS[state.phase].has(command.type);
  const run = (): ActionPreview => {
    switch (command.type) {
      case 'URBAN_ACTION': return previewUrban(state, actor, command);
      case 'QUEUE_ORDER': return command.order.type === 'MOVE' ? previewMove(state, actor, command, command.order) : previewOtherOrder(state, actor, command);
      case 'SETTLE': return previewSettle(state, actor, command);
      case 'BUILD_ROAD': return previewRoad(state, actor, command);
      case 'MANAGE': return previewTerritory(state, actor, command);
      default: return unsupported(state, actor, command);
    }
  };
  if (!legal) {
    const out = skeleton(state, actor, command, 'PARTIAL', 'RESOLUTION');
    out.blockers = [blockerOf('PHASE', state.phase === 'PLANNING' ? 'Esta decisão não é permitida agora.' : 'Disponível apenas no Planejamento.')];
    return out;
  }
  if (progress.ready) {
    const out = run();
    out.eligible = false; out.effects = [];
    if (!out.blockers.some(blocker => blocker.code === 'READY')) out.blockers.unshift(blockerOf('READY', 'Suas decisões já estão confirmadas para esta fase: desfaça o Pronto para agir.'));
    return out;
  }
  return run();
}

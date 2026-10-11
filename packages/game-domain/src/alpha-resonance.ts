import { z } from 'zod';
import { IdentifierSchema, NonNegativeIntegerSchema as N } from './core.js';
import { ALPHA_RESOURCE_KEYS } from './alpha-concept.js';
import { WEB_ADVANCES as ADVANCEMENTS, WebDomainSchema, WEB_DOMAIN_NAMES, heritageAdvance, type WebDomain } from './alpha-web.js';

/**
 * Ressonância (canon §18, §18b): five sockets per civilization. Every advance (Web, Convergence or Heritage) registers one
 * socket with its domain colour; the fifth resolves a Repercussão and clears all five. The permanent mark on the Teia
 * (Reserva de Marcos) is a different thing and never limits research.
 */
export const RESONANCE_SOCKETS = 5;
export const ResonanceSourceSchema = z.enum(['WEB', 'CONVERGENCE', 'HERITAGE']);
export const ResonanceSlotSchema = z.strictObject({
  advancementId: IdentifierSchema, source: ResonanceSourceSchema,
  domains: z.union([z.tuple([WebDomainSchema]), z.tuple([WebDomainSchema, WebDomainSchema])]),
});
export type ResonanceSlot = z.infer<typeof ResonanceSlotSchema>;
export const ResonanceMarkSchema = z.strictObject({
  advancementId: IdentifierSchema, domains: z.union([z.tuple([WebDomainSchema]), z.tuple([WebDomainSchema, WebDomainSchema])]), round: N,
});
export const CompositionKindSchema = z.enum(['DOMINANT', 'HYBRID', 'PAIR', 'CONFLUENCE']);
export type CompositionKind = z.infer<typeof CompositionKindSchema>;
export const ResonanceCycleSchema = z.strictObject({
  round: N, kind: CompositionKindSchema, domains: z.array(WebDomainSchema).min(1).max(5), cardId: IdentifierSchema, slots: z.array(ResonanceSlotSchema).length(RESONANCE_SOCKETS),
});
export const ResonanceStateSchema = z.strictObject({
  slots: z.array(ResonanceSlotSchema).max(RESONANCE_SOCKETS - 1).default([]),
  cycles: N.default(0),
  marks: z.array(ResonanceMarkSchema).default([]),
  history: z.array(ResonanceCycleSchema).max(10).default([]),
});
export type ResonanceState = z.infer<typeof ResonanceStateSchema>;
export const emptyResonance = (): ResonanceState => ({ slots: [], cycles: 0, marks: [], history: [] });

const DOMAIN_ORDER = WebDomainSchema.options;
const orderOf = (domain: WebDomain) => DOMAIN_ORDER.indexOf(domain);

/** Domains an advance shows in its socket: one for Web and Heritage (the Heritage takes its gate's domain), up to two for a Convergence. */
export function advancementDomains(id: string): ResonanceSlot['domains'] | null {
  const node = ADVANCEMENTS.find(item => item.id === id);
  if (node) {
    if (!node.convergence) return [node.domain];
    const domains = [...new Set([...node.prerequisites, ...node.prerequisitesAny].map(pre => ADVANCEMENTS.find(item => item.id === pre)?.domain).filter((d): d is WebDomain => d !== undefined))].sort((a, b) => orderOf(a) - orderOf(b));
    return domains.length >= 2 ? [domains[0]!, domains[1]!] : [domains[0] ?? node.domain];
  }
  const heritage = heritageAdvance(id);
  const gate = heritage ? ADVANCEMENTS.find(item => item.id === heritage.prerequisite) : undefined;
  return gate ? [gate.domain] : null;
}
export const advancementSource = (id: string): ResonanceSlot['source'] | null => {
  const node = ADVANCEMENTS.find(item => item.id === id);
  return node ? (node.convergence ? 'CONVERGENCE' : 'WEB') : heritageAdvance(id) ? 'HERITAGE' : null;
};

export interface Composition { kind: CompositionKind; domains: WebDomain[]; counts: Record<WebDomain, number> }
/** I-1: count[d] = slots whose domains include d. Dominant (≥3) > Confluência (all five domains) > Híbrida (two with 2) > Par. */
export function classifyResonance(slots: readonly Pick<ResonanceSlot, 'domains'>[]): Composition {
  const counts = Object.fromEntries(DOMAIN_ORDER.map(domain => [domain, 0])) as Record<WebDomain, number>;
  for (const slot of slots) for (const domain of new Set(slot.domains)) counts[domain]++;
  const ranked = [...DOMAIN_ORDER].sort((a, b) => counts[b] - counts[a] || orderOf(a) - orderOf(b));
  if (counts[ranked[0]!] >= 3) return { kind: 'DOMINANT', domains: [ranked[0]!], counts };
  if (DOMAIN_ORDER.every(domain => counts[domain] > 0)) return { kind: 'CONFLUENCE', domains: [...DOMAIN_ORDER], counts };
  if (counts[ranked[1]!] >= 2) return { kind: 'HYBRID', domains: [ranked[0]!, ranked[1]!].sort((a, b) => orderOf(a) - orderOf(b)), counts };
  return { kind: 'PAIR', domains: [ranked[0]!], counts };
}

/** Repercussão card ops. Resource keys are the eight resources. */
const ResourceKeySchema = z.enum(ALPHA_RESOURCE_KEYS);
export const RepercussionOpSchema = z.discriminatedUnion('op', [
  z.strictObject({ op: z.literal('GAIN'), resource: ResourceKeySchema, n: z.number().int().min(1).max(9) }),
  z.strictObject({ op: z.literal('LOSE'), resource: ResourceKeySchema, n: z.number().int().min(1).max(9) }),
  z.strictObject({ op: z.literal('MOOD'), scope: z.enum(['CAPITAL', 'LOWEST', 'ALL']), delta: z.number().int().min(-2).max(2) }),
  z.strictObject({ op: z.literal('PRESTIGE'), n: z.number().int().min(1).max(5) }),
  z.strictObject({ op: z.literal('POPULATION'), n: z.number().int().min(1).max(3) }),
  z.strictObject({ op: z.literal('THREAT'), command: z.enum(['SPAWN', 'REINFORCE', 'ACTIVATE']), kind: z.enum(['LAND', 'PIRATE']).optional() }),
]);
export type RepercussionOp = z.infer<typeof RepercussionOpSchema>;
export const ChoiceOptionSchema = z.strictObject({ id: IdentifierSchema, label: z.string().min(1).max(120), ops: z.array(RepercussionOpSchema).max(6) });
export type ChoiceOption = z.infer<typeof ChoiceOptionSchema>;
export const RepercussionCardSchema = z.strictObject({
  id: IdentifierSchema, name: z.string().min(1).max(80), kind: CompositionKindSchema, domains: z.array(WebDomainSchema).min(1).max(5),
  /** 'SELF' touches only the owner; 'WORLD' also moves a threat. */
  applies: z.enum(['SELF', 'WORLD']), text: z.string().min(1).max(240),
  price: z.array(RepercussionOpSchema).max(4), options: z.tuple([ChoiceOptionSchema, ChoiceOptionSchema]),
  mitigatedBy: z.array(IdentifierSchema), leveragedBy: z.array(IdentifierSchema),
});
export type RepercussionCard = z.infer<typeof RepercussionCardSchema>;

export const PendingChoiceSchema = z.strictObject({
  id: IdentifierSchema, source: z.enum(['REPERCUSSION', 'ENCOUNTER', 'PULSE']), cardId: IdentifierSchema,
  title: z.string().min(1).max(120), text: z.string().max(240), createdRound: N, mitigated: z.boolean().default(false),
  options: z.array(ChoiceOptionSchema).min(2).max(3),
});
export type PendingChoice = z.infer<typeof PendingChoiceSchema>;

interface Flavor { boonA: RepercussionOp[]; boonB: RepercussionOp[]; price: RepercussionOp[]; mitigatedBy: string[]; leveragedBy: string[]; a: string; b: string; priceText: string }
const gain = (resource: z.infer<typeof ResourceKeySchema>, n: number): RepercussionOp => ({ op: 'GAIN', resource, n });
const FLAVORS: Record<WebDomain, Flavor> = {
  KNOWLEDGE: { boonA: [gain('knowledge', 2)], boonB: [gain('influence', 1), gain('culture', 1)], price: [{ op: 'MOOD', scope: 'CAPITAL', delta: -1 }], mitigatedBy: ['web-expression-schools'], leveragedBy: ['web-natural-philosophy'], a: 'Revelação', b: 'Debate público', priceText: 'a capital perde 1 de Ânimo' },
  LAND_AND_SEA: { boonA: [gain('food', 3)], boonB: [gain('wood', 2), gain('wealth', 1)], price: [{ op: 'LOSE', resource: 'wood', n: 1 }], mitigatedBy: ['web-irrigation'], leveragedBy: ['web-crop-rotation'], a: 'Colheita', b: 'Descoberta de caminhos', priceText: 'perde 1 Madeira' },
  STONE_AND_METAL: { boonA: [gain('stone', 2), gain('metal', 1)], boonB: [gain('metal', 2)], price: [{ op: 'THREAT', command: 'SPAWN', kind: 'LAND' }], mitigatedBy: ['web-fortification'], leveragedBy: ['web-metallurgy'], a: 'Filão', b: 'Forja acesa', priceText: 'o barulho atrai um Acampamento de Saqueadores' },
  GOVERNMENT: { boonA: [gain('influence', 2)], boonB: [gain('culture', 2)], price: [{ op: 'MOOD', scope: 'LOWEST', delta: -1 }], mitigatedBy: ['web-continuity-pact'], leveragedBy: ['web-codes'], a: 'Concórdia', b: 'Voz do povo', priceText: 'a cidade mais abalada perde 1 de Ânimo' },
  TRADE: { boonA: [gain('wealth', 3)], boonB: [gain('influence', 1), gain('wealth', 1)], price: [{ op: 'THREAT', command: 'SPAWN', kind: 'PIRATE' }], mitigatedBy: ['web-logistics'], leveragedBy: ['web-currency'], a: 'Boom mercantil', b: 'Rede de contatos', priceText: 'cobiça de piratas nas rotas' },
};
const lighter = (ops: RepercussionOp[]): RepercussionOp[] => ops.map(op => (op.op === 'GAIN' ? { ...op, n: Math.max(1, op.n - 1) } : op));
const worldOf = (price: RepercussionOp[]) => (price.some(op => op.op === 'THREAT') ? 'WORLD' : 'SELF') as 'SELF' | 'WORLD';
const card = (id: string, name: string, kind: CompositionKind, domains: WebDomain[], text: string, price: RepercussionOp[], a: ChoiceOption, b: ChoiceOption, mitigatedBy: string[], leveragedBy: string[]): RepercussionCard =>
  RepercussionCardSchema.parse({ id, name, kind, domains, applies: worldOf(price), text, price, options: [a, b], mitigatedBy, leveragedBy });

function buildCards(): RepercussionCard[] {
  const cards: RepercussionCard[] = [];
  for (const domain of DOMAIN_ORDER) {
    const f = FLAVORS[domain], tag = domain.toLowerCase().replace(/_/g, '-'), name = WEB_DOMAIN_NAMES[domain];
    cards.push(card(`rep-dom-${tag}-1`, `${f.a}: maré de ${name}`, 'DOMINANT', [domain], `O foco em ${name} volta para você. Preço: ${f.priceText}.`, f.price,
      { id: 'a', label: f.a, ops: f.boonA }, { id: 'b', label: f.b, ops: f.boonB }, f.mitigatedBy, f.leveragedBy));
    cards.push(card(`rep-dom-${tag}-2`, `Consagração de ${name}`, 'DOMINANT', [domain], `A especialização em ${name} rende reconhecimento. Preço: ${f.priceText}.`, f.price,
      { id: 'a', label: 'Prestígio', ops: [{ op: 'PRESTIGE', n: 1 }, ...lighter(f.boonA)] }, { id: 'b', label: 'Gente nova', ops: [{ op: 'POPULATION', n: 1 }, ...lighter(f.boonB)] }, f.mitigatedBy, f.leveragedBy));
    cards.push(card(`rep-pair-${tag}`, `Eco de ${name}`, 'PAIR', [domain], 'Um eco leve, sem preço.', [],
      { id: 'a', label: f.a, ops: lighter(f.boonA) }, { id: 'b', label: f.b, ops: lighter(f.boonB) }, [], f.leveragedBy));
  }
  for (let i = 0; i < DOMAIN_ORDER.length; i++) for (let j = i + 1; j < DOMAIN_ORDER.length; j++) {
    const x = DOMAIN_ORDER[i]!, y = DOMAIN_ORDER[j]!, fx = FLAVORS[x], fy = FLAVORS[y];
    cards.push(card(`rep-hybrid-${x.toLowerCase().replace(/_/g, '-')}-${y.toLowerCase().replace(/_/g, '-')}`, `${fx.a} e ${fy.a}`, 'HYBRID', [x, y],
      `${WEB_DOMAIN_NAMES[x]} e ${WEB_DOMAIN_NAMES[y]} se cruzam. Preço: ${fx.priceText}.`, fx.price,
      { id: 'a', label: `${fx.a} + ${fy.a}`, ops: [...fx.boonA, ...lighter(fy.boonA)] }, { id: 'b', label: `${fy.b} + ${fx.b}`, ops: [...fy.boonB, ...lighter(fx.boonB)] },
      [...new Set([...fx.mitigatedBy, ...fy.mitigatedBy])], [...new Set([...fx.leveragedBy, ...fy.leveragedBy])]));
  }
  cards.push(card('rep-confluence-1', 'Confluência: a mesa do mundo', 'CONFLUENCE', [...DOMAIN_ORDER], 'Cinco cores em um ciclo. Grande oportunidade, grande preço.',
    [{ op: 'MOOD', scope: 'ALL', delta: -1 }, { op: 'THREAT', command: 'ACTIVATE' }],
    { id: 'a', label: 'Era de ouro', ops: [gain('food', 2), gain('wealth', 2), gain('knowledge', 2), { op: 'PRESTIGE', n: 2 }] },
    { id: 'b', label: 'Geração nova', ops: [{ op: 'POPULATION', n: 2 }, gain('culture', 2), gain('influence', 2)] }, [], []));
  cards.push(card('rep-confluence-2', 'Confluência: o grande encontro', 'CONFLUENCE', [...DOMAIN_ORDER], 'Todas as trilhas se encontram. O mundo repara.',
    [{ op: 'LOSE', resource: 'wealth', n: 2 }, { op: 'THREAT', command: 'REINFORCE', kind: 'LAND' }],
    { id: 'a', label: 'Obra monumental', ops: [{ op: 'PRESTIGE', n: 3 }, gain('stone', 2)] },
    { id: 'b', label: 'Escola de gerações', ops: [gain('knowledge', 3), gain('culture', 2), { op: 'POPULATION', n: 1 }] }, [], []));
  return cards;
}
export const REPERCUSSION_CARDS: readonly RepercussionCard[] = buildCards();
export const repercussionCard = (id: string): RepercussionCard | undefined => REPERCUSSION_CARDS.find(item => item.id === id);

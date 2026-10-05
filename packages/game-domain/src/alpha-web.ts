import { z } from 'zod';
import { ResourcePoolSchema, emptyResourcePool, type ResourcePool } from './core.js';
import { AlphaEraSchema, type AlphaEra } from './alpha-concept.js';
import { AlphaEffectSchema } from './alpha-effects.js';

/**
 * The Teia Civilizacional of V5.1a (canon §12): five domains in real chains, 40 domain advances + 10 Convergences = 50 rows.
 * Three rows are exclusive OU choices and exist as two nodes each (53 nodes). Every advance unlocks something concrete; the
 * `unlocks` tags are what the engine gates on (district:X, building:X, elevate:LEVEL, unit:X, fortification:X, government:X,
 * improvement:X, rule:X). Prestígio only on the ★ marks.
 */
export const WebDomainSchema = z.enum(['KNOWLEDGE', 'LAND_AND_SEA', 'STONE_AND_METAL', 'GOVERNMENT', 'TRADE']);
export type WebDomain = z.infer<typeof WebDomainSchema>;
export const WEB_DOMAIN_NAMES: Record<WebDomain, string> = { KNOWLEDGE: 'Saber', LAND_AND_SEA: 'Terra e Mar', STONE_AND_METAL: 'Pedra e Metal', GOVERNMENT: 'Governo', TRADE: 'Troca' };

export const AdvancementSchema = z.strictObject({
  id: z.string().regex(/^web-[a-z-]+$/), name: z.string().min(1), domain: WebDomainSchema, era: AlphaEraSchema, cost: ResourcePoolSchema,
  /** All of these must be researched. */
  prerequisites: z.array(z.string()),
  /** At least one of these must be researched (empty = no such requirement). */
  prerequisitesAny: z.array(z.string()).default([]),
  /** Researching this closes these for the match (the other side of an OU choice). */
  excludes: z.array(z.string()),
  /** The OU row this node belongs to, when it is one side of an exclusive choice. */
  pair: z.string().nullable().default(null),
  convergence: z.boolean(),
  /** ★: the domain's milestone; +3 Prestígio and a Hegemony path becomes eligible. */
  milestone: z.boolean().default(false),
  effect: AlphaEffectSchema.nullable().default(null),
  unlocks: z.array(z.string()),
  description: z.string().min(1),
});
export type Advancement = z.infer<typeof AdvancementSchema>;

const knowledge = (amount: number): ResourcePool => ({ ...emptyResourcePool(), knowledge: amount });
const eraCost = (era: AlphaEra): number => AlphaEraSchema.options.indexOf(era) + 2;
type Row = { id: string; name: string; domain: WebDomain; era: AlphaEra; pre?: string[]; any?: string[]; excludes?: string[]; pair?: string; convergence?: boolean; milestone?: boolean; effect?: z.infer<typeof AlphaEffectSchema>; unlocks: string[]; description: string };
const node = (row: Row): Advancement => AdvancementSchema.parse({
  id: row.id, name: row.name, domain: row.domain, era: row.era, cost: knowledge(eraCost(row.era) + (row.convergence ? 2 : 0)),
  prerequisites: row.pre ?? [], prerequisitesAny: row.any ?? [], excludes: row.excludes ?? [], pair: row.pair ?? null,
  convergence: row.convergence ?? false, milestone: row.milestone ?? false, effect: row.effect ?? null, unlocks: row.unlocks, description: row.description,
});

export const WEB_ADVANCES: readonly Advancement[] = [
  // Saber (Conhecimento) — 8
  node({ id: 'web-writing', name: 'Escrita', domain: 'KNOWLEDGE', era: 'FOUNDATION', unlocks: ['district:ACADEMIC', 'building:LIBRARY', 'building:ARCHIVE', 'building:SCRIBES_HOUSE'], description: 'Abre o distrito Acadêmico, a Biblioteca e o Arquivo.' }),
  node({ id: 'web-mathematics', name: 'Matemática', domain: 'KNOWLEDGE', era: 'EXPANSION', pre: ['web-writing'], unlocks: ['rule:elevate-village-stone-discount', 'rule:explorer-reach-2'], description: 'Elevar a Vila custa −1 Pedra; Pioneiro alcança 2.' }),
  node({ id: 'web-natural-philosophy', name: 'Filosofia Natural', domain: 'KNOWLEDGE', era: 'CONSOLIDATION', pre: ['web-mathematics'], unlocks: ['building:ACADEMY', 'rule:first-advance-discount'], description: 'Academia; o primeiro avanço de cada domínio por Era custa −1 Conhecimento.' }),
  node({ id: 'web-experimental-method', name: 'Método Experimental', domain: 'KNOWLEDGE', era: 'CIVILIZATION', pre: ['web-natural-philosophy'], unlocks: ['building:OBSERVATORY', 'rule:exploration-preview-danger'], description: 'Observatório; prévia de perigo e costa antes de explorar.' }),
  node({ id: 'web-laboratory', name: 'Laboratório', domain: 'KNOWLEDGE', era: 'EMPIRES', pre: ['web-experimental-method'], unlocks: ['building:LABORATORY', 'rule:siege-breach-plus-1'], description: 'Laboratório; Cerco +1 Brecha; abre Balística e Agronomia.' }),
  node({ id: 'web-synthesis', name: 'Síntese', domain: 'KNOWLEDGE', era: 'POWERS', pre: ['web-laboratory'], unlocks: ['rule:knowledge-limit-plus-3', 'work:archive-of-horizons'], description: 'Limite de Conhecimento +3; Obra Arquivo dos Horizontes.' }),
  node({ id: 'web-public-education', name: 'Educação Pública', domain: 'KNOWLEDGE', era: 'POWERS', pre: ['web-synthesis', 'web-codes'], unlocks: ['rule:scholar-no-library'], description: 'Eruditos rendem sem exigir Biblioteca.' }),
  node({ id: 'web-community-of-discovery', name: 'Comunidade de Descoberta', domain: 'KNOWLEDGE', era: 'ASCENSION', pre: ['web-public-education'], milestone: true, unlocks: ['hegemony:SCIENTIFIC'], description: '+3 Prestígio; Hegemonia Científica elegível.' }),
  // Terra e Mar (Alimento, exploração) — 8
  node({ id: 'web-agriculture', name: 'Agricultura', domain: 'LAND_AND_SEA', era: 'FOUNDATION', unlocks: ['improvement:FARM', 'district:AGRARIAN', 'building:GRANARY', 'elevate:HAMLET'], description: 'Fazenda, distrito Agrário, Celeiro; Elevar a Aldeia.' }),
  node({ id: 'web-coastal-navigation', name: 'Navegação Costeira', domain: 'LAND_AND_SEA', era: 'FOUNDATION', unlocks: ['district:MARITIME', 'building:PORT', 'unit:COASTAL_VESSEL', 'improvement:FISHERY'], description: 'Distrito Marítimo, Embarcação Costeira, Pesqueiro.' }),
  node({ id: 'web-irrigation', name: 'Irrigação', domain: 'LAND_AND_SEA', era: 'EXPANSION', pre: ['web-agriculture'], unlocks: ['building:IRRIGATION', 'rule:farm-plus-1', 'mitigates:drought'], description: 'Irrigação: +1 Alimento por Fazenda; mitiga a Seca.' }),
  node({ id: 'web-cartography', name: 'Cartografia', domain: 'LAND_AND_SEA', era: 'EXPANSION', pre: ['web-coastal-navigation'], unlocks: ['unit:MERCHANT_SHIP', 'unit:GALLEY', 'rule:explorer-ship-reveals-coast-2'], description: 'Mercante e Galera; Pioneiro em navio revela costa a 2.' }),
  node({ id: 'web-naval-architecture', name: 'Arquitetura Naval', domain: 'LAND_AND_SEA', era: 'CONSOLIDATION', pre: ['web-cartography'], unlocks: ['unit:FLEET', 'unit:TRANSPORT', 'building:SHIPYARD'], description: 'Galera de Guerra, Nau de Transporte, Estaleiro.' }),
  node({ id: 'web-crop-rotation', name: 'Rotação de Culturas', domain: 'LAND_AND_SEA', era: 'CIVILIZATION', pre: ['web-irrigation'], unlocks: ['rule:farm-plus-1', 'building:MILL'], description: '+1 Alimento por Fazenda; Moinho dobra.' }),
  node({ id: 'web-ocean-navigation', name: 'Navegação Oceânica', domain: 'LAND_AND_SEA', era: 'CIVILIZATION', pre: ['web-naval-architecture', 'web-mathematics'], unlocks: ['unit:CARRACK', 'rule:ocean-crossing', 'building:LIGHTHOUSE'], description: 'Carraca; travessia de oceano; Farol.' }),
  node({ id: 'web-agronomy', name: 'Agronomia', domain: 'LAND_AND_SEA', era: 'POWERS', pre: ['web-crop-rotation', 'web-laboratory'], unlocks: ['rule:farm-plus-1', 'rule:grow-cost-2-with-granary'], description: '+1 Alimento por Fazenda; Crescer custa 2 em cidades com Celeiro.' }),
  // Pedra e Metal (construção, guerra) — 9
  node({ id: 'web-masonry', name: 'Alvenaria', domain: 'STONE_AND_METAL', era: 'FOUNDATION', unlocks: ['district:INDUSTRIAL', 'fortification:STONE_WALL', 'building:WAREHOUSE', 'elevate:VILLAGE'], description: 'Distrito Industrial, Muralha de Pedra, Armazém; Elevar a Vila.' }),
  node({ id: 'web-guard-formations', name: 'Formações de Guarda', domain: 'STONE_AND_METAL', era: 'FOUNDATION', unlocks: ['district:MILITARY', 'building:BARRACKS', 'unit:GUARD'], description: 'Distrito Militar, Quartel, Guarda.' }),
  node({ id: 'web-metallurgy', name: 'Metalurgia', domain: 'STONE_AND_METAL', era: 'EXPANSION', pre: ['web-masonry'], unlocks: ['improvement:MINE', 'building:WORKSHOP', 'unit:RANGED'], description: 'Mina, Oficina, Atiradores.' }),
  node({ id: 'web-maneuver-training', name: 'Treino de Manobras', domain: 'STONE_AND_METAL', era: 'EXPANSION', pre: ['web-guard-formations'], unlocks: ['unit:CAVALRY', 'rule:army-7'], description: 'Cavalaria; Exército 7.' }),
  node({ id: 'web-engineering', name: 'Engenharia', domain: 'STONE_AND_METAL', era: 'CONSOLIDATION', pre: ['web-metallurgy'], unlocks: ['unit:SIEGE', 'rule:double-road', 'elevate:CITY'], description: 'Cerco, Estrada dupla; Elevar a Cidade.' }),
  node({ id: 'web-fortification', name: 'Fortificação', domain: 'STONE_AND_METAL', era: 'CONSOLIDATION', pre: ['web-engineering', 'web-guard-formations'], unlocks: ['fortification:FORTRESS', 'rule:free-repair'], description: 'Fortaleza; reparo via Governar custa 0.' }),
  node({ id: 'web-iron', name: 'Ferro', domain: 'STONE_AND_METAL', era: 'CIVILIZATION', pre: ['web-metallurgy'], effect: { kind: 'STRENGTH', amount: 1 }, unlocks: ['building:FOUNDRY', 'rule:infantry-plus-1'], description: 'Fundição; Infantaria +1 Força (modernização).' }),
  node({ id: 'web-gunpowder', name: 'Pólvora', domain: 'STONE_AND_METAL', era: 'EMPIRES', pre: ['web-iron', 'web-laboratory'], unlocks: ['unit:ARQUEBUSIERS', 'fortification:BASTION'], description: 'Arcabuzeiros; Baluarte.' }),
  node({ id: 'web-artillery', name: 'Artilharia', domain: 'STONE_AND_METAL', era: 'POWERS', pre: ['web-gunpowder'], unlocks: ['unit:ARTILLERY', 'rule:siege-ignores-palisade'], description: 'Artilharia; cerco ignora Paliçada.' }),
  // Governo (Influência, Cultura) — 8 rows
  node({ id: 'web-common-narratives', name: 'Narrativas Comuns', domain: 'GOVERNMENT', era: 'FOUNDATION', unlocks: ['district:CULTURAL', 'building:TEMPLE', 'rule:culture-plus-1-per-temple'], description: 'Distrito Cultural, Templo; Cultura +1 por Templo.' }),
  node({ id: 'web-codes', name: 'Códigos', domain: 'GOVERNMENT', era: 'EXPANSION', pre: ['web-common-narratives', 'web-writing'], unlocks: ['district:ADMINISTRATIVE', 'building:CHANCELLERY', 'rule:envoy-integrates-plus-10', 'rule:admin-capacity-plus-1'], description: 'Distrito Administrativo, Chancelaria; Enviado integra +10; Capacidade Administrativa +1.' }),
  node({ id: 'web-urbanism', name: 'Urbanismo', domain: 'GOVERNMENT', era: 'CONSOLIDATION', pre: ['web-codes', 'web-masonry'], unlocks: ['elevate:GREAT_CITY', 'building:COURT', 'rule:admin-capacity-plus-1'], description: 'Elevar a Grande Cidade; Tribunal; Capacidade Administrativa +1.' }),
  node({ id: 'web-centralization', name: 'Centralização', domain: 'GOVERNMENT', era: 'CONSOLIDATION', pre: ['web-codes'], excludes: ['web-federalization'], pair: 'government-iii', unlocks: ['government:MONARCHY', 'government:AUTOCRACY', 'rule:capital-capacity-plus-1'], description: 'OU Federalização. Monarquia e Autocracia; capital +1 Capacidade.' }),
  node({ id: 'web-federalization', name: 'Federalização', domain: 'GOVERNMENT', era: 'CONSOLIDATION', pre: ['web-codes'], excludes: ['web-centralization'], pair: 'government-iii', unlocks: ['government:CONFEDERATION', 'government:REPUBLIC', 'rule:slots-plus-1-village-up'], description: 'OU Centralização. Confederação e República; vagas +1 em cidades Vila ou maiores.' }),
  node({ id: 'web-expression-schools', name: 'Escolas de Expressão', domain: 'GOVERNMENT', era: 'CIVILIZATION', pre: ['web-common-narratives', 'web-codes'], unlocks: ['building:THEATER', 'government:THEOCRACY', 'rule:govern-culture-recovers-2'], description: 'Teatro; Teocracia; Governar com Cultura recupera 2 níveis.' }),
  node({ id: 'web-sanitation', name: 'Saneamento', domain: 'GOVERNMENT', era: 'EMPIRES', pre: ['web-urbanism', 'web-natural-philosophy'], unlocks: ['elevate:METROPOLIS', 'mitigates:epidemic', 'rule:famine-grace-round'], description: 'Elevar a Metrópole; a fome não tira habitante na primeira rodada.' }),
  node({ id: 'web-continuity-pact', name: 'Pacto de Continuidade', domain: 'GOVERNMENT', era: 'POWERS', pre: ['web-sanitation'], unlocks: ['rule:mood-floor-shaken-in-war'], description: 'Ânimo nunca cai abaixo de Abalada por guerra.' }),
  node({ id: 'web-council-of-civilizations', name: 'Conselho de Civilizações', domain: 'GOVERNMENT', era: 'ASCENSION', pre: ['web-continuity-pact'], milestone: true, unlocks: ['hegemony:POLITICAL'], description: '+3 Prestígio; Hegemonia Política elegível.' }),
  // Troca (Riqueza) — 7 rows
  node({ id: 'web-exchange', name: 'Troca', domain: 'TRADE', era: 'FOUNDATION', unlocks: ['district:COMMERCIAL', 'building:MARKET', 'rule:surplus-conversion'], description: 'Distrito Comercial, Mercado; conversão de excedente.' }),
  node({ id: 'web-currency', name: 'Moeda', domain: 'TRADE', era: 'EXPANSION', pre: ['web-exchange'], unlocks: ['building:TREASURY', 'government:OLIGARCHY', 'rule:route-plus-1'], description: 'Tesouro; Oligarquia; rotas +1 Riqueza.' }),
  node({ id: 'web-regional-market', name: 'Mercado Regional', domain: 'TRADE', era: 'CONSOLIDATION', pre: ['web-currency'], unlocks: ['rule:contracts', 'rule:wealth-covers-60-build'], description: 'Contratos Promessa/Empréstimo; Riqueza cobre 60% em Construir.' }),
  node({ id: 'web-logistics', name: 'Logística', domain: 'TRADE', era: 'CIVILIZATION', pre: ['web-regional-market', 'web-engineering'], unlocks: ['improvement:DEPOT', 'rule:supply-plus-1', 'rule:transport-cargo-3'], description: 'Depósito; suprimento +1; Nau de Transporte carrega 3.' }),
  node({ id: 'web-bank', name: 'Banco', domain: 'TRADE', era: 'EMPIRES', pre: ['web-regional-market'], unlocks: ['building:BANK', 'rule:credit-once-per-era'], description: 'Banco; crédito 1× por Era (adianta 5 Riqueza, devolve 6).' }),
  node({ id: 'web-self-sufficiency', name: 'Autossuficiência', domain: 'TRADE', era: 'POWERS', pre: ['web-bank'], excludes: ['web-commercial-economy'], pair: 'trade-vi', unlocks: ['rule:productive-district-plus-1', 'rule:route-minus-1'], description: 'OU Economia Comercial. Produzir +1 em cada distrito produtivo; rotas −1.' }),
  node({ id: 'web-commercial-economy', name: 'Economia Comercial', domain: 'TRADE', era: 'POWERS', pre: ['web-bank'], excludes: ['web-self-sufficiency'], pair: 'trade-vi', unlocks: ['rule:route-plus-2', 'rule:merchant-yields-per-1'], description: 'OU Autossuficiência. Rotas +2 Riqueza; Mercador rende por 1.' }),
  node({ id: 'web-interdependent-economy', name: 'Economia Interdependente', domain: 'TRADE', era: 'ASCENSION', any: ['web-self-sufficiency', 'web-commercial-economy'], milestone: true, unlocks: ['hegemony:ECONOMIC'], description: '+3 Prestígio; Hegemonia Econômica elegível.' }),
  // Convergências — 10 rows
  node({ id: 'web-civic-academies', name: 'Academias Cívicas', domain: 'KNOWLEDGE', era: 'CONSOLIDATION', pre: ['web-natural-philosophy', 'web-codes'], convergence: true, unlocks: ['government:MERITOCRACY', 'rule:academy-minus-1-stone', 'rule:scholar-influence-once-per-era'], description: 'Convergência. Meritocracia; Academia custa −1 Pedra; Eruditos rendem Influência 1× por Era.' }),
  node({ id: 'web-coastal-routes', name: 'Rotas Costeiras', domain: 'LAND_AND_SEA', era: 'CONSOLIDATION', pre: ['web-cartography', 'web-currency'], convergence: true, unlocks: ['rule:sea-route-plus-2'], description: 'Convergência. Rota marítima (porto a porto) rende +2.' }),
  node({ id: 'web-technical-manufactures', name: 'Manufaturas Técnicas', domain: 'STONE_AND_METAL', era: 'CIVILIZATION', pre: ['web-iron', 'web-regional-market'], convergence: true, unlocks: ['building:MANUFACTURE', 'rule:artisan-yields-per-1-with-workshop'], description: 'Convergência. Manufatura; Artesão rende por 1 com Oficina.' }),
  node({ id: 'web-deep-defense', name: 'Defesa Profunda', domain: 'STONE_AND_METAL', era: 'CIVILIZATION', pre: ['web-fortification', 'web-logistics'], excludes: ['web-war-of-movement'], pair: 'war-iv', convergence: true, unlocks: ['fortification:CITADEL', 'rule:garrison-plus-2'], description: 'Convergência, OU Guerra de Movimento. Cidadela; guarnição +2.' }),
  node({ id: 'web-war-of-movement', name: 'Guerra de Movimento', domain: 'STONE_AND_METAL', era: 'CIVILIZATION', pre: ['web-fortification', 'web-logistics'], excludes: ['web-deep-defense'], pair: 'war-iv', convergence: true, unlocks: ['rule:army-8', 'rule:cavalry-moves-3'], description: 'Convergência, OU Defesa Profunda. Exército 8; Cavalaria move 3.' }),
  node({ id: 'web-world-metropolises', name: 'Metrópoles do Mundo', domain: 'GOVERNMENT', era: 'EMPIRES', pre: ['web-urbanism', 'web-logistics', 'web-bank'], convergence: true, unlocks: ['elevate:IMPERIAL_METROPOLIS'], description: 'Convergência. Elevar a Metrópole Imperial (Era VII).' }),
  node({ id: 'web-ballistics', name: 'Balística', domain: 'STONE_AND_METAL', era: 'EMPIRES', pre: ['web-gunpowder', 'web-experimental-method'], convergence: true, unlocks: ['unit:FRIGATE', 'rule:artillery-breach-plus-1'], description: 'Convergência. Fragata; Artilharia +1 Brecha.' }),
  node({ id: 'web-shared-heritage', name: 'Patrimônio Compartilhado', domain: 'GOVERNMENT', era: 'EMPIRES', pre: ['web-expression-schools', 'web-currency'], convergence: true, unlocks: ['building:MONUMENT', 'rule:rooted-presence-yields-culture'], description: 'Convergência. Presença Enraizada rende 1 Cultura por Era; Monumento.' }),
  node({ id: 'web-renaissance', name: 'Renascimento', domain: 'KNOWLEDGE', era: 'POWERS', pre: ['web-synthesis', 'web-expression-schools', 'web-bank'], convergence: true, unlocks: ['work:monument-of-voices', 'rule:theater-culture-limit-plus-5'], description: 'Convergência. Obra Monumento das Vozes; Teatro +5 de limite de Cultura.' }),
  node({ id: 'web-naval-doctrine', name: 'Doutrina Naval', domain: 'LAND_AND_SEA', era: 'POWERS', pre: ['web-ocean-navigation', 'web-artillery'], convergence: true, unlocks: ['rule:frigate-plus-1', 'rule:blockade-with-1-ship'], description: 'Convergência. Fragata +1 Força; bloqueio com 1 navio.' }),
  node({ id: 'web-containment-strategy', name: 'Estratégia de Contenção', domain: 'STONE_AND_METAL', era: 'ASCENSION', pre: ['web-artillery'], any: ['web-deep-defense', 'web-war-of-movement'], convergence: true, milestone: true, unlocks: ['hegemony:MILITARY'], description: 'Convergência ★. +3 Prestígio; Hegemonia Militar elegível.' }),
];
/** Rows of the canon table: nodes minus one per OU pair (two nodes share a row). */
export const WEB_ROW_COUNT = WEB_ADVANCES.length - new Set(WEB_ADVANCES.filter(advance => advance.pair).map(advance => advance.pair)).size;
export const webAdvance = (id: string): Advancement | undefined => WEB_ADVANCES.find(advance => advance.id === id);
/** Nodes that unlock a given tag (e.g. `district:AGRARIAN`). */
export const advancesUnlocking = (tag: string): Advancement[] => WEB_ADVANCES.filter(advance => advance.unlocks.includes(tag));

/**
 * Heritage (canon §13): three per civilization, outside the 50, each hanging from a universal advance with an Era minimum and a
 * Knowledge cost plus one thematic resource. Effects are text until their rule lands (status PLANNED); the engine gates research only.
 */
export const HeritageAdvanceSchema = z.strictObject({
  id: z.string().regex(/^her-[a-z]+-[1-3]$/), civilizationId: z.string().min(1), name: z.string().min(1), prerequisite: z.string().regex(/^web-/), era: AlphaEraSchema,
  cost: ResourcePoolSchema, effect: z.string().min(1), status: z.enum(['ACTIVE', 'PLANNED']).default('PLANNED'),
});
export type HeritageAdvance = z.infer<typeof HeritageAdvanceSchema>;
const heritageCost = (era: AlphaEra, extra: Partial<ResourcePool>): ResourcePool => {
  const index = AlphaEraSchema.options.indexOf(era);
  return { ...emptyResourcePool(), knowledge: index <= 1 ? 3 : index <= 3 ? 5 : 7, ...extra };
};
type HeritageRow = [name: string, prerequisite: string, era: AlphaEra, extra: Partial<ResourcePool>, effect: string];
const heritage = (civilizationId: string, rows: [HeritageRow, HeritageRow, HeritageRow]): HeritageAdvance[] =>
  rows.map(([name, prerequisite, era, extra, effect], index) => HeritageAdvanceSchema.parse({ id: `her-${civilizationId}-${index + 1}`, civilizationId, name, prerequisite, era, cost: heritageCost(era, extra), effect }));

export const HERITAGE_ADVANCES: readonly HeritageAdvance[] = [
  ...heritage('aurelia', [['Celeiros Comuns', 'web-agriculture', 'FOUNDATION', { materials: 1 }, 'Celeiro também amortece uma queda de Ânimo por Era.'], ['Terraços Dourados', 'web-crop-rotation', 'CIVILIZATION', { food: 1 }, 'Fazendas em Colina rendem como em Planície e +1 Alimento.'], ['Reserva da Abundância', 'web-agronomy', 'POWERS', { food: 2 }, 'Limite de Alimento +5; a Seca nunca atinge cidades com Celeiro.']]),
  ...heritage('valgard', [['Passos Guardados', 'web-guard-formations', 'EXPANSION', { materials: 1 }, 'Guardas em cidade fortificada +1 na defesa.'], ['Refúgios de Montanha', 'web-fortification', 'CONSOLIDATION', { materials: 1 }, 'Fortaleza em Colina/Montanha custa −2 Pedra; Paliçada grátis ao fundar em Colina.'], ['Muralha Viva', 'web-deep-defense', 'POWERS', { materials: 2 }, 'Cidades sitiadas não perdem Ânimo; reparo custa 0.']]),
  ...heritage('meridia', [['Feira das Margens', 'web-exchange', 'FOUNDATION', { wealth: 1 }, 'A primeira oferta comercial de cada rodada rende +1 Riqueza.'], ['Entrepostos Fluviais', 'web-regional-market', 'CONSOLIDATION', { wealth: 1 }, 'Rotas terrestres passam sem custo de manutenção.'], ['Casa das Margens', 'web-bank', 'EMPIRES', { wealth: 2 }, 'Crédito 2× por Era; Riqueza cobre 75% em Construir.']]),
  ...heritage('thalos', [['Cartas das Marés', 'web-coastal-navigation', 'FOUNDATION', { wealth: 1 }, 'Pioneiro em Embarcação Costeira revela Região costeira a distância 2.'], ['Infantaria Naval', 'web-naval-architecture', 'CONSOLIDATION', { materials: 1 }, 'Infantaria desembarca sem penalidade anfíbia.'], ['Rede de Faróis', 'web-ocean-navigation', 'CIVILIZATION', { materials: 1 }, 'Farol custa −2; portos dão visão 2 no mar; bloqueio contra Thalos exige 2 navios.']]),
  ...heritage('saren', [['Convocação dos Vales', 'web-common-narratives', 'FOUNDATION', { influence: 1 }, 'Tratados de Saren duram +1 rodada.'], ['Enviados Senatoriais', 'web-codes', 'EXPANSION', { influence: 1 }, 'Enviado soma +1 de Integração por ação na cidade onde está.'], ['Concílio Permanente', 'web-continuity-pact', 'POWERS', { influence: 2 }, 'Aliança ativa conta em dobro para a Hegemonia Política.']]),
  ...heritage('kor', [['Mutirão de Oficinas', 'web-metallurgy', 'EXPANSION', { materials: 1 }, 'Oficina custa −1 Madeira; Artesãos rendem Pedra sem escolha.'], ['Forja Profunda', 'web-iron', 'CIVILIZATION', { materials: 1 }, 'Fundição +5 Metal de limite extra; Mina rende +1 Metal.'], ['Têmpera de Kor', 'web-artillery', 'POWERS', { materials: 2 }, 'Artilharia e Arcabuzeiros custam −1 Metal.']]),
  ...heritage('orinth', [['Círculo de Estudos', 'web-writing', 'FOUNDATION', { knowledge: 1 }, 'O primeiro avanço de cada domínio custa −1 Conhecimento.'], ['Mirante das Medidas', 'web-experimental-method', 'CIVILIZATION', { materials: 1 }, 'Observatório custa −2; prévia de recurso antes de explorar.'], ['Síntese de Orinth', 'web-synthesis', 'POWERS', { knowledge: 2 }, 'Convergências custam −1 Conhecimento.']]),
  ...heritage('nymara', [['Partilha de Sementes', 'web-agriculture', 'FOUNDATION', { food: 1 }, 'Fundar uma cidade adjacente a Floresta dá uma Fazenda grátis.'], ['Bosque da Memória', 'web-expression-schools', 'CIVILIZATION', { influence: 1 }, 'Templo em Floresta rende +1 Cultura.'], ['Raízes Compartilhadas', 'web-shared-heritage', 'EMPIRES', { influence: 2 }, 'Presença Enraizada rende Cultura toda rodada, não por Era.']]),
  ...heritage('veyra', [['Câmara de Trocas', 'web-exchange', 'FOUNDATION', { wealth: 1 }, 'Enviados custam −1 Riqueza.'], ['Padrões de Confiança', 'web-regional-market', 'CONSOLIDATION', { influence: 1 }, 'Contratos com Veyra nunca entram em mora na primeira rodada.'], ['Encruzilhada do Mundo', 'web-commercial-economy', 'POWERS', { wealth: 2 }, 'Rotas internacionais contam em dobro para a Hegemonia Econômica.']]),
  ...heritage('solenne', [['Assembleia de Vozes', 'web-common-narratives', 'FOUNDATION', { influence: 1 }, 'Governar na capital recupera +1 Ânimo.'], ['Instituições Abertas', 'web-civic-academies', 'CONSOLIDATION', { influence: 1 }, 'Trocar de Governo não abala a capital.'], ['Ágora das Nações', 'web-council-of-civilizations', 'ASCENSION', { influence: 2 }, 'Um povo integrado conta como dois para a Hegemonia Política.']]),
  ...heritage('dravik', [['Jornada de Construção', 'web-masonry', 'FOUNDATION', { materials: 1 }, 'Estrada custa −1 Pedra.'], ['Aquedutos', 'web-urbanism', 'CONSOLIDATION', { materials: 1 }, 'Elevar a Grande Cidade e a Metrópole custa −2 Pedra.'], ['Redes de Abastecimento', 'web-logistics', 'CIVILIZATION', { materials: 2 }, 'Depósitos alcançam 2 hexes.']]),
  ...heritage('elyra', [['Escola Itinerante', 'web-writing', 'FOUNDATION', { knowledge: 1 }, 'Revelar uma Região rende +1 Conhecimento.'], ['Curadoria de Saberes', 'web-natural-philosophy', 'CONSOLIDATION', { knowledge: 1 }, 'Biblioteca +3 Conhecimento de limite extra.'], ['Vínculos Comunitários', 'web-public-education', 'POWERS', { influence: 2 }, 'Eruditos rendem +1 Cultura a cada 2.']]),
  ...heritage('kaedor', [['Caravanas do Deserto', 'web-exchange', 'FOUNDATION', { wealth: 1 }, 'Rota terrestre atravessa Deserto sem Estrada.'], ['Entrepostos de Oásis', 'web-regional-market', 'CONSOLIDATION', { wealth: 1 }, 'Comercial em Deserto rende +1 Riqueza e +1 Alimento.'], ['Casa das Balanças', 'web-bank', 'EMPIRES', { wealth: 2 }, 'Crédito 2× por Era.']]),
  ...heritage('lumaris', [['Luz dos Arquivos', 'web-writing', 'FOUNDATION', { knowledge: 1 }, 'Arquivo custa −1 Madeira.'], ['Observadores da Costa', 'web-cartography', 'EXPANSION', { knowledge: 1 }, 'Farol dá prévia de perigo no mar.'], ['Academia do Horizonte', 'web-renaissance', 'POWERS', { knowledge: 2 }, 'Obra Arquivo dos Horizontes custa −3.']]),
  ...heritage('targan', [['Marcha das Estepes', 'web-maneuver-training', 'EXPANSION', { food: 1 }, 'Cavalaria custa −1 Alimento de manutenção.'], ['Arqueiros Montados', 'web-iron', 'CIVILIZATION', { materials: 1 }, 'Atiradores movem 2.'], ['Horda Disciplinada', 'web-war-of-movement', 'CIVILIZATION', { materials: 2 }, 'Exército 9.']]),
  ...heritage('iskara', [['Fogo Sagrado', 'web-common-narratives', 'FOUNDATION', { influence: 1 }, 'Templo recupera 1 Ânimo por Era sem Ordem.'], ['Guardiões do Templo', 'web-fortification', 'CONSOLIDATION', { materials: 1 }, 'Cidade com Templo e Fortaleza nunca entra em Revolta por cerco.'], ['Chama Perene', 'web-continuity-pact', 'POWERS', { influence: 2 }, 'Teocracia não paga o custo extra de Saber.']]),
  ...heritage('veloria', [['Rota das Moedas', 'web-currency', 'EXPANSION', { wealth: 1 }, 'Tesouro +5 Riqueza de limite extra.'], ['Prismas de Veloria', 'web-coastal-routes', 'CONSOLIDATION', { wealth: 1 }, 'Rota marítima rende +1 Cultura.'], ['Bolsa das Marés', 'web-interdependent-economy', 'ASCENSION', { wealth: 2 }, 'Riqueza no limite conta como atendida com 80% do limite.']]),
  ...heritage('norvak', [['Presas do Norte', 'web-guard-formations', 'FOUNDATION', { food: 1 }, 'Guardas em Floresta +1 Força.'], ['Inverno Longo', 'web-irrigation', 'EXPANSION', { food: 1 }, 'Fome não reduz Ânimo em cidades com Celeiro.'], ['Flocos de Norvak', 'web-naval-doctrine', 'POWERS', { materials: 2 }, 'Fragata move +1 em mar frio.']]),
];
export const heritageOf = (civilizationId: string | null): HeritageAdvance[] => HERITAGE_ADVANCES.filter(advance => advance.civilizationId === civilizationId);
export const heritageAdvance = (id: string): HeritageAdvance | undefined => HERITAGE_ADVANCES.find(advance => advance.id === id);

/**
 * Pre-V5.1a research ids (`adv-{era}-{domain}-{branch}`) read as the closest node of the new Web by Era and domain, so a saved
 * match keeps its research. Domain order was KNOWLEDGE, SOCIETY, ECONOMY, WARFARE, CULTURE.
 */
export function migrateAdvancementId(id: string): string {
  const match = /^adv-(\d)-(\d)-(\d)$/.exec(id);
  if (!match) return id;
  const era = AlphaEraSchema.options[Math.min(6, Number(match[1]) - 1)]!;
  const domain = (['KNOWLEDGE', 'GOVERNMENT', 'TRADE', 'STONE_AND_METAL', 'LAND_AND_SEA'] as const)[Number(match[2]) - 1] ?? 'KNOWLEDGE';
  const branch = Number(match[3]) - 1;
  const inEra = WEB_ADVANCES.filter(advance => advance.domain === domain && advance.era === era && !advance.convergence);
  const candidates = inEra.length ? inEra : WEB_ADVANCES.filter(advance => advance.domain === domain);
  return candidates[Math.min(branch, candidates.length - 1)]!.id;
}
/** A research list with every migrated prerequisite present, deduplicated, in a stable order. */
export function migrateResearch(ids: readonly string[]): string[] {
  const owned = new Set<string>();
  const visit = (id: string): void => {
    if (owned.has(id)) return;
    const advance = webAdvance(id);
    if (!advance) { if (heritageAdvance(id)) owned.add(id); return; }
    for (const prerequisite of advance.prerequisites) visit(prerequisite);
    if (advance.prerequisitesAny.length && !advance.prerequisitesAny.some(candidate => owned.has(candidate))) visit(advance.prerequisitesAny[0]!);
    owned.add(id);
  };
  for (const id of ids) visit(migrateAdvancementId(id));
  return WEB_ADVANCES.filter(advance => owned.has(advance.id)).map(advance => advance.id).concat([...owned].filter(id => id.startsWith('her-')));
}

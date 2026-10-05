import { z } from 'zod';
import { AlphaEffectSchema } from './alpha-institutions.js';
import { CIVILIZATIONS } from './alpha-institutions.js';
import { LEADERS } from './alpha-leaders.js';
import { AlphaUnitClassSchema } from './alpha-catalog.js';

/**
 * Canonical roster (DEC-011): eighteen civilizations. The twelve Alpha civilizations keep their Alpha identity; Bible mechanics
 * are reassigned by identity, not by name. The six Bible-only civilizations are in the canon but stay AUTHORING until their
 * leader and capital are authored: nothing is invented to fill their fields, the gaps are listed instead.
 *
 * Every kit item carries its source and whether the engine already applies it, so the UI never promises an inert rule.
 */
export const CivilizationAffinitySchema = z.enum(['POLITICAL', 'TERRITORIAL', 'ECONOMIC', 'MARITIME', 'SCIENTIFIC', 'CULTURAL', 'MILITARY', 'AGRARIAN']);
export const KitSourceSchema = z.enum(['ALPHA', 'BIBLE', 'PROPOSAL']);
/** ACTIVE: the engine applies it. PLANNED: canon, not yet applied (the UI says so). */
export const KitStatusSchema = z.enum(['ACTIVE', 'PLANNED']);
export const KitItemSchema = z.strictObject({ text: z.string().min(1).max(240), source: KitSourceSchema, status: KitStatusSchema });
export type KitItem = z.infer<typeof KitItemSchema>;
export const SealShapeSchema = z.enum(['CIRCLE', 'HEXAGON', 'DIAMOND']);
export const BannerShapeSchema = z.enum(['STRAIGHT', 'SWALLOWTAIL', 'PENNANT', 'GONFALON', 'SHIELD', 'ROUNDED']);
export const BorderPatternSchema = z.enum(['SOLID', 'DASHED', 'DOTTED', 'DOUBLE', 'DASH_DOT', 'BAND']);
export const EmblemSchema = z.enum(['espiga', 'passo', 'ondas', 'farol', 'tresvozes', 'bigorna', 'olho', 'folha', 'encruzilhada', 'sol', 'arcos', 'chama', 'moeda', 'prisma', 'presa', 'espiral', 'elos', 'floco']);
export type Emblem = z.infer<typeof EmblemSchema>;
export const CivilizationMarkSchema = z.strictObject({ emblem: EmblemSchema, seal: SealShapeSchema, banner: BannerShapeSchema, border: BorderPatternSchema });
export type CivilizationMark = z.infer<typeof CivilizationMarkSchema>;
/** Eras in which a civilization card becomes available on the civilization board; each unlocked card is playable once per Era. */
export const CIVILIZATION_CARD_UNLOCK_ERAS = ['FOUNDATION', 'CIVILIZATION', 'ASCENSION'] as const;
export const CivilizationCardSchema = z.strictObject({
  id: z.string().regex(/^civ-[a-z]+-[1-3]$/), name: z.string().min(1).max(60), unlockEra: z.enum(CIVILIZATION_CARD_UNLOCK_ERAS),
  effect: AlphaEffectSchema, text: z.string().min(1).max(160), source: KitSourceSchema,
});
export type CivilizationCard = z.infer<typeof CivilizationCardSchema>;
export const CivilizationKitSchema = z.strictObject({
  id: z.string(), name: z.string(), availability: z.enum(['PLAYABLE', 'AUTHORING']), affinity: CivilizationAffinitySchema,
  identity: z.string().min(1), capital: z.string().nullable(), leaderId: z.string().nullable(),
  trait: KitItemSchema, heritage: KitItemSchema,
  /** UNIT signatures name the family they replace for this civilization (every piece of that family is the signature). */
  signature: z.strictObject({ kind: z.enum(['UNIT', 'STRUCTURE']), name: z.string(), family: AlphaUnitClassSchema.nullable().default(null), item: KitItemSchema }),
  limitation: KitItemSchema,
  cards: z.array(CivilizationCardSchema).max(3),
  mark: CivilizationMarkSchema,
  /** What still has to be authored before the civilization can be played. Empty for every playable civilization. */
  authoringGaps: z.array(z.string()),
}).superRefine((kit, ctx) => {
  if (kit.availability === 'PLAYABLE' && (kit.authoringGaps.length || kit.capital === null || kit.leaderId === null || kit.cards.length !== 3)) ctx.addIssue({ code: 'custom', message: `${kit.id}: a playable kit cannot have authoring gaps` });
  if (kit.cards.some((card, i) => card.unlockEra !== CIVILIZATION_CARD_UNLOCK_ERAS[i])) ctx.addIssue({ code: 'custom', message: `${kit.id}: cards unlock in order` });
});
export type CivilizationKit = z.infer<typeof CivilizationKitSchema>;

const item = (text: string, source: z.infer<typeof KitSourceSchema>, status: z.infer<typeof KitStatusSchema> = 'PLANNED'): KitItem => ({ text, source, status });
type CardRow = [name: string, effect: z.infer<typeof AlphaEffectSchema>, text: string];
const produce = (resource: 'food' | 'materials' | 'wealth' | 'knowledge' | 'influence', amount: number) => ({ kind: 'PRODUCTION' as const, resource, amount, timing: 'ONCE' as const });
const round = (kind: 'STRENGTH' | 'MOVEMENT' | 'COMMAND', amount = 1) => ({ kind, amount });
const cards = (id: string, rows: CardRow[]): CivilizationCard[] => rows.map(([name, effect, text], i) => ({ id: `civ-${id}-${i + 1}`, name, unlockEra: CIVILIZATION_CARD_UNLOCK_ERAS[i]!, effect, text, source: 'PROPOSAL' }));
const mark = (emblem: Emblem, seal: CivilizationMark['seal'], banner: CivilizationMark['banner'], border: CivilizationMark['border']): CivilizationMark => ({ emblem, seal, banner, border });
const alpha = (id: string) => {
  const civ = CIVILIZATIONS.find(c => c.id === id)!;
  return { id, name: civ.name, availability: 'PLAYABLE' as const, identity: civ.identity, capital: civ.capital, leaderId: LEADERS.find(l => l.civilizationId === id)?.id ?? null, authoringGaps: [] };
};
const bibleOnly = (id: string, name: string, identity: string) => ({
  id, name, availability: 'AUTHORING' as const, identity, capital: null, leaderId: null, cards: [] as CivilizationCard[],
  authoringGaps: ['líder e habilidade do líder', 'nome da capital', '3 cartas próprias'],
});

const KITS: CivilizationKit[] = [
  { ...alpha('aurelia'), affinity: 'AGRARIAN',
    trait: item('Fazendas trabalhadas rendem +1 Alimento quando a cidade Produz.', 'PROPOSAL', 'ACTIVE'),
    heritage: item('Capital começa com Fazenda e especialização Agrária.', 'PROPOSAL'),
    signature: { kind: 'STRUCTURE', name: 'Celeiro Comum', family: null, item: item('Celeiro que também amortece uma queda de Ânimo por Era.', 'PROPOSAL') },
    limitation: item('Manutenção militar +1 Alimento a cada 4 peças.', 'BIBLE', 'ACTIVE'),
    cards: cards('aurelia', [['Colheita Partilhada', produce('food', 3), '+3 Alimento.'], ['Mutirão da Safra', produce('materials', 3), '+3 Madeira/Pedra.'], ['Celeiro Aberto', round('COMMAND'), '+1 ação principal nesta rodada.']]),
    mark: mark('espiga', 'CIRCLE', 'GONFALON', 'SOLID') },
  { ...alpha('valgard'), affinity: 'TERRITORIAL',
    trait: item('+1 alcance de suprimento para peças em território próprio.', 'BIBLE', 'ACTIVE'),
    heritage: item('Começa com 1 Guarda e uma Pedreira numa Colina ou Montanha do território inicial, quando houver.', 'BIBLE', 'ACTIVE'),
    signature: { kind: 'UNIT', name: 'Guarda de Escudos', family: 'GUARD', item: item('Suas Guardas dão +1 na defesa de uma cidade fortificada.', 'BIBLE', 'ACTIVE') },
    limitation: item('Enviados custam +1 Influência.', 'BIBLE', 'ACTIVE'),
    cards: cards('valgard', [['Passagem Guardada', round('STRENGTH'), '+1 Força nos conflitos desta rodada.'], ['Marco da Passagem', produce('materials', 3), '+3 Madeira/Pedra.'], ['Refúgio da Montanha', round('STRENGTH', 2), '+2 Força nos conflitos desta rodada.']]),
    mark: mark('passo', 'HEXAGON', 'SHIELD', 'DASHED') },
  { ...alpha('meridia'), affinity: 'ECONOMIC',
    trait: item('A primeira oferta comercial concluída em cada rodada rende +1 Riqueza.', 'PROPOSAL', 'ACTIVE'),
    heritage: item('Começa com +3 Riqueza.', 'BIBLE', 'ACTIVE'),
    signature: { kind: 'STRUCTURE', name: 'Caravana', family: null, item: item('Entreposto: rotas terrestres passam sem custo de manutenção.', 'BIBLE') },
    limitation: item('Fortificação não passa de Muralha de Pedra até a Era IV.', 'BIBLE', 'ACTIVE'),
    cards: cards('meridia', [['Feira das Margens', produce('wealth', 3), '+3 Riqueza.'], ['Correspondência Distante', produce('knowledge', 2), '+2 Conhecimento.'], ['Rede das Margens', round('COMMAND'), '+1 ação principal nesta rodada.']]),
    mark: mark('ondas', 'CIRCLE', 'SWALLOWTAIL', 'DOTTED') },
  { ...alpha('thalos'), affinity: 'MARITIME',
    trait: item('Revelar uma região costeira rende +1 Conhecimento.', 'PROPOSAL', 'ACTIVE'),
    heritage: item('Começa com 1 Pioneiro extra.', 'PROPOSAL', 'ACTIVE'),
    signature: { kind: 'UNIT', name: 'Infantaria Naval', family: 'INFANTRY', item: item('Sua Infantaria ataca a partir de navios sem a penalidade anfíbia.', 'BIBLE', 'ACTIVE') },
    limitation: item('Exércitos terrestres têm −1 de suprimento longe de rotas.', 'BIBLE'),
    cards: cards('thalos', [['Carta das Costas', round('MOVEMENT'), '+1 movimento nesta rodada.'], ['Mediação Costeira', produce('influence', 2), '+2 Influência.'], ['Farol Aceso', produce('knowledge', 3), '+3 Conhecimento.']]),
    mark: mark('farol', 'DIAMOND', 'PENNANT', 'DOTTED') },
  { ...alpha('saren'), affinity: 'POLITICAL',
    trait: item('Tratados de Saren duram +1 rodada.', 'BIBLE', 'ACTIVE'),
    heritage: item('Começa com 1 Enviado e +2 Influência.', 'BIBLE', 'ACTIVE'),
    signature: { kind: 'UNIT', name: 'Enviado Senatorial', family: 'ENVOY', item: item('Enviado que soma +1 de integração por Ação cívica na cidade onde está.', 'BIBLE') },
    limitation: item('Cavalaria custa +1 Alimento de manutenção.', 'BIBLE', 'ACTIVE'),
    cards: cards('saren', [['Convocação dos Vales', produce('influence', 3), '+3 Influência.'], ['Mesa do Concílio', round('COMMAND'), '+1 ação principal nesta rodada.'], ['Celeiros do Vale', produce('food', 3), '+3 Alimento.']]),
    mark: mark('tresvozes', 'HEXAGON', 'STRAIGHT', 'DOUBLE') },
  { ...alpha('kor'), affinity: 'TERRITORIAL',
    trait: item('Pedreiras trabalhadas em Colinas rendem +1 Pedra quando a cidade Produz.', 'BIBLE', 'ACTIVE'),
    heritage: item('Começa com Paliçada na capital.', 'BIBLE', 'ACTIVE'),
    signature: { kind: 'UNIT', name: 'Engenheiros de Cerco', family: 'SIEGE', item: item('Seus Cercos abrem +1 Brecha contra fortificações de pedra ou melhores.', 'BIBLE', 'ACTIVE') },
    limitation: item('Frotas têm −1 movimento.', 'BIBLE', 'ACTIVE'),
    cards: cards('kor', [['Mutirão da Forja', produce('materials', 3), '+3 Madeira/Pedra.'], ['Forja Acesa', round('STRENGTH'), '+1 Força nos conflitos desta rodada.'], ['Muralha Rápida', produce('materials', 4), '+4 Madeira/Pedra.']]),
    mark: mark('bigorna', 'DIAMOND', 'SHIELD', 'SOLID') },
  { ...alpha('orinth'), affinity: 'SCIENTIFIC',
    trait: item('O primeiro avanço de cada domínio custa 1 Conhecimento a menos.', 'BIBLE', 'ACTIVE'),
    heritage: item('Começa com +2 Conhecimento.', 'BIBLE', 'ACTIVE'),
    signature: { kind: 'UNIT', name: 'Astrônomo-Pioneiro', family: 'PIONEER', item: item('Pioneiro que revela também as regiões vizinhas à revelada.', 'BIBLE') },
    limitation: item('Cavalaria custa +1 Alimento de manutenção.', 'BIBLE', 'ACTIVE'),
    cards: cards('orinth', [['Medida Comum', produce('knowledge', 2), '+2 Conhecimento.'], ['Observação do Mirante', round('MOVEMENT'), '+1 movimento nesta rodada.'], ['Tábua de Medidas', produce('knowledge', 4), '+4 Conhecimento.']]),
    mark: mark('olho', 'DIAMOND', 'ROUNDED', 'DASH_DOT') },
  { ...alpha('nymara'), affinity: 'CULTURAL',
    trait: item('A Ação cívica rende +1 Influência.', 'PROPOSAL', 'ACTIVE'),
    heritage: item('Capital começa com +1 Ânimo.', 'PROPOSAL', 'ACTIVE'),
    signature: { kind: 'UNIT', name: 'Bardo-Enviado', family: 'ENVOY', item: item('Enviado que soma +1 em disputas culturais.', 'BIBLE') },
    limitation: item('Modernizações custam +1 Metal.', 'BIBLE'),
    cards: cards('nymara', [['Partilha da Memória', produce('food', 3), '+3 Alimento.'], ['Memória Viva', produce('influence', 3), '+3 Influência.'], ['Bosque Antigo', produce('materials', 3), '+3 Madeira/Pedra.']]),
    mark: mark('folha', 'CIRCLE', 'ROUNDED', 'BAND') },
  { ...alpha('veyra'), affinity: 'POLITICAL',
    trait: item('Enviados custam 1 Riqueza a menos.', 'BIBLE', 'ACTIVE'),
    heritage: item('Começa com 2 Enviados.', 'BIBLE', 'ACTIVE'),
    signature: { kind: 'UNIT', name: 'Embaixador Errante', family: 'ENVOY', item: item('Enviado com alcance ilimitado para propor tratados.', 'BIBLE') },
    limitation: item('Infantaria só avança para Profissional na Era III.', 'BIBLE'),
    cards: cards('veyra', [['Encruzilhada', produce('wealth', 3), '+3 Riqueza.'], ['Caravana Veloz', round('MOVEMENT'), '+1 movimento nesta rodada.'], ['Palavra Empenhada', produce('influence', 3), '+3 Influência.']]),
    mark: mark('encruzilhada', 'HEXAGON', 'SWALLOWTAIL', 'DASH_DOT') },
  { ...alpha('solenne'), affinity: 'CULTURAL',
    trait: item('Disputas culturais de Solenne ganham +1 na defesa.', 'PROPOSAL', 'ACTIVE'),
    heritage: item('Especialização Cultural na capital.', 'BIBLE'),
    signature: { kind: 'STRUCTURE', name: 'Santuário Solar', family: null, item: item('Santuário exclusivo: +1 Legado por Era.', 'BIBLE') },
    limitation: item('Avanços de Conhecimento da Era I custam +1.', 'BIBLE', 'ACTIVE'),
    cards: cards('solenne', [['Mesa Aberta', produce('influence', 2), '+2 Influência.'], ['Porta Aberta', produce('knowledge', 3), '+3 Conhecimento.'], ['Encontro Solar', round('COMMAND'), '+1 ação principal nesta rodada.']]),
    mark: mark('sol', 'CIRCLE', 'STRAIGHT', 'BAND') },
  { ...alpha('dravik'), affinity: 'TERRITORIAL',
    trait: item('Estradas e melhorias custam 1 Madeira/Pedra a menos.', 'PROPOSAL', 'ACTIVE'),
    heritage: item('Começa com +2 Pedra.', 'PROPOSAL', 'ACTIVE'),
    signature: { kind: 'STRUCTURE', name: 'Aqueduto', family: null, item: item('A cidade precisa de 1 Alimento a menos para crescer.', 'PROPOSAL') },
    limitation: item('Rotas comerciais rendem −1 Riqueza.', 'BIBLE', 'ACTIVE'),
    cards: cards('dravik', [['Canteiro de Obras', produce('materials', 3), '+3 Madeira/Pedra.'], ['Rede de Abastecimento', round('MOVEMENT'), '+1 movimento nesta rodada.'], ['Aqueduto Provisório', produce('food', 3), '+3 Alimento.']]),
    mark: mark('arcos', 'HEXAGON', 'GONFALON', 'DOUBLE') },
  { ...alpha('elyra'), affinity: 'SCIENTIFIC',
    trait: item('Revelar uma região rende +1 Conhecimento.', 'BIBLE', 'ACTIVE'),
    heritage: item('Começa com 1 Pioneiro extra.', 'BIBLE', 'ACTIVE'),
    signature: { kind: 'UNIT', name: 'Cartógrafa', family: 'PIONEER', item: item('Seus Pioneiros revelam regiões a até 2 hexes (versão terrestre; a Cartógrafa naval da Bíblia espera as classes navais).', 'PROPOSAL', 'ACTIVE') },
    limitation: item('Cerco custa +1 Metal.', 'BIBLE', 'ACTIVE'),
    cards: cards('elyra', [['Aula ao Ar Livre', produce('knowledge', 2), '+2 Conhecimento.'], ['Mapa Noturno', round('MOVEMENT'), '+1 movimento nesta rodada.'], ['Vínculo de Saber', produce('knowledge', 4), '+4 Conhecimento.']]),
    mark: mark('chama', 'CIRCLE', 'PENNANT', 'DASHED') },
  { ...bibleOnly('kaedor', 'Kaedor', 'Cada moeda, um alicerce.'), affinity: 'ECONOMIC',
    trait: item('Tesouros dão +2 de capacidade.', 'BIBLE'), heritage: item('Começa com +2 Metal.', 'BIBLE'),
    signature: { kind: 'STRUCTURE', name: 'Casa de Câmbio', family: null, item: item('Mercado exclusivo que melhora a conversão do Banco.', 'BIBLE') },
    limitation: item('Armazéns dão apenas +2.', 'BIBLE'), mark: mark('moeda', 'DIAMOND', 'STRAIGHT', 'DASHED') },
  { ...bibleOnly('lumaris', 'Lumaris', 'Do brilho, o método.'), affinity: 'SCIENTIFIC',
    trait: item('Bibliotecas rendem +1 Conhecimento.', 'BIBLE'), heritage: item('Começa com Biblioteca.', 'BIBLE'),
    signature: { kind: 'STRUCTURE', name: 'Laboratório Real', family: null, item: item('Laboratório exclusivo: barateia a primeira convergência.', 'BIBLE') },
    limitation: item('Guarnição máxima de cidade −1.', 'BIBLE'), mark: mark('prisma', 'HEXAGON', 'PENNANT', 'BAND') },
  { ...bibleOnly('targan', 'Targan', 'Ferro vale mais que ouro.'), affinity: 'MILITARY',
    trait: item('Oficinas ao lado de Minas rendem +1 Metal.', 'BIBLE'), heritage: item('Começa com Oficina e Arsenal.', 'BIBLE'),
    signature: { kind: 'UNIT', name: 'Elefantes de Guerra', family: 'CAVALRY', item: item('Assusta Cavalaria; manutenção alta.', 'BIBLE') },
    limitation: item('Celeiros dão apenas +2 e Elefantes exigem Alimento extra.', 'BIBLE'), mark: mark('presa', 'DIAMOND', 'SWALLOWTAIL', 'SOLID') },
  { ...bibleOnly('iskara', 'Iskara', 'Nossos mortos ainda comandam.'), affinity: 'CULTURAL',
    trait: item('Cada Obra de Legado concluída rende +2 Prestígio.', 'BIBLE'), heritage: item('Começa com Casa Ancestral.', 'BIBLE'),
    signature: { kind: 'UNIT', name: 'Guardião dos Ancestrais', family: 'GUARD', item: item('Guarda que dá +1 Resistência cultural à cidade em que está.', 'BIBLE') },
    limitation: item('Perde 1 Legado ao abandonar uma cidade cultural.', 'BIBLE'), mark: mark('espiral', 'DIAMOND', 'GONFALON', 'DOTTED') },
  { ...bibleOnly('veloria', 'Veloria', 'Tudo o que se divide, sustenta.'), affinity: 'POLITICAL',
    trait: item('Pactos de Não Agressão custam metade da Influência.', 'BIBLE'), heritage: item('Começa com um Pacto de Não Agressão.', 'BIBLE'),
    signature: { kind: 'UNIT', name: 'Voz Federada', family: 'ENVOY', item: item('Enviado que reforça Pactos Defensivos com +1 peça de apoio.', 'BIBLE') },
    limitation: item('Exércitos combinados têm no máximo 4 peças por hex.', 'BIBLE'), mark: mark('elos', 'HEXAGON', 'ROUNDED', 'SOLID') },
  { ...bibleOnly('norvak', 'Norvak', 'O inverno é nosso aliado.'), affinity: 'MARITIME',
    trait: item('Unidades ignoram penalidades de terreno frio.', 'BIBLE'), heritage: item('Começa com Farol.', 'BIBLE'),
    signature: { kind: 'UNIT', name: 'Rompe-Gelo', family: 'FLEET', item: item('Galera de Guerra com +1 Casco em costas frias.', 'BIBLE') },
    limitation: item('Fazendas em planície rendem −1 Alimento.', 'BIBLE'), mark: mark('floco', 'CIRCLE', 'SHIELD', 'DOUBLE') },
];

export const CIVILIZATION_KITS: readonly CivilizationKit[] = KITS.map(kit => CivilizationKitSchema.parse(kit));
export const civilizationKit = (id: string | null | undefined): CivilizationKit | null => CIVILIZATION_KITS.find(kit => kit.id === id) ?? null;
/** Every civilization card of every kit, for validation and lookup. */
export const CIVILIZATION_CARDS: readonly CivilizationCard[] = CIVILIZATION_KITS.flatMap(kit => kit.cards);

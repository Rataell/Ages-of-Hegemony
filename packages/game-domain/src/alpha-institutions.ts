import { z } from 'zod';
import { CivilizationDomainSchema, ResourcePoolSchema, emptyResourcePool } from './core.js';
import { AlphaEraSchema } from './alpha-concept.js';
export const AlphaEffectSchema=z.discriminatedUnion('kind',[
  z.strictObject({kind:z.literal('PRODUCTION'),resource:z.enum(['food','materials','wealth','knowledge','influence']),amount:z.number().int().min(1).max(5)}),
  z.strictObject({kind:z.enum(['STRENGTH','MOVEMENT','COMMAND']),amount:z.number().int().min(1).max(2)}),
]);
export type AlphaEffect=z.infer<typeof AlphaEffectSchema>;
export const AdvancementSchema=z.strictObject({id:z.string(),name:z.string(),domain:CivilizationDomainSchema,era:AlphaEraSchema,cost:ResourcePoolSchema,
  prerequisites:z.array(z.string()),excludes:z.array(z.string()),convergence:z.boolean(),effect:AlphaEffectSchema});
export type Advancement=z.infer<typeof AdvancementSchema>;
const domains=CivilizationDomainSchema.options;const eras=AlphaEraSchema.options.filter(era=>era!=='HEGEMONY');
const names=[
  ['Registros de Sinais','Observação das Estações','Assembleias de Bairro','Pactos de Reciprocidade','Celeiros de Reserva','Pesos de Troca','Formações de Guarda','Sinais de Patrulha','Narrativas Comuns','Ritos de Acolhida'],
  ['Mapas de Referência','Cálculo de Colheitas','Centralização do Conselho','Federação dos Distritos','Ofícios Cooperados','Contabilidade de Rotas','Treino de Manobras','Logística de Campanha','Casas de Memória','Festivais de Encontro'],
  ['Método de Comparação','Círculos de Investigação','Códigos de Acesso','Serviço por Mérito','Contratos de Produção','Câmaras de Compensação','Engenharia de Posição','Cartografia Operacional','Escolas de Expressão','Patrimônio Compartilhado'],
  ['Redes de Observatórios','Instrumentos de Precisão','Auditoria de Instituições','Representação Regional','Sistemas de Distribuição','Crédito de Infraestrutura','Comando Coordenado','Doutrina de Proteção','Intercâmbio de Mestres','Arquivos de Tradição'],
  ['Síntese de Evidências','Comunidade de Descoberta','Pacto de Continuidade','Conselho de Civilizações','Economia Interdependente','Padrões de Prosperidade','Estratégia de Contenção','Defesa de Redes','Cultura de Convivência','Memória do Mundo'],
];
const production=['knowledge','influence','wealth','materials','influence'] as const;
export const ADVANCEMENTS:readonly Advancement[]=eras.flatMap((era,e)=>domains.flatMap((domain,d)=>[0,1].map(branch=>{
  const id=`adv-${e+1}-${d+1}-${branch+1}`;const convergence=branch===1&&d===(e%5)||branch===1&&d===((e+2)%5);
  const prerequisites=e===0?(convergence?[`adv-1-${d+1}-1`,`adv-1-${(d+1)%5+1}-1`]:[]):[`adv-${e}-${d+1}-1`,...(convergence?[`adv-${e}-${(d+1)%5+1}-1`]:[])];
  // Neither side of the explicit institutional divergence is required by later nodes.
  if(e===2&&d===1)prerequisites.splice(0,1,'adv-1-2-1');
  return AdvancementSchema.parse({id,name:names[e]![d*2+branch]!,domain,era,cost:{...emptyResourcePool(),knowledge:e+2},prerequisites,
    excludes:e===1&&d===1?[`adv-2-2-${branch===0?2:1}`]:[],convergence,
    effect:d===3&&branch===1?{kind:'STRENGTH',amount:1}:d===1&&branch===1?{kind:'COMMAND',amount:1}:{kind:'PRODUCTION',resource:production[d],amount:1},
  });
})));
export interface AlphaCivilization {id:string;name:string;identity:string;color:string;symbol:string;bias:string;passives:readonly AlphaEffect[];ability:{name:string;effects:readonly Extract<AlphaEffect,{kind:'PRODUCTION'}>[]}}
const civilizations=[
  ['aurelia','Aurélia','Comunidades de cultivo e reservas comuns','food','materials','Celeiros compartilhados'],
  ['valgard','Valgard','Guardas das passagens e construtores de refúgios','materials','food','Oficinas de fronteira'],
  ['meridia','Merídia','Redes de intercâmbio entre margens distantes','wealth','knowledge','Feira das margens'],
  ['thalos','Thalos','Cartógrafos e mediadores das costas','knowledge','wealth','Expedição de cartas'],
  ['saren','Saren','Conselhos que preservam acordos entre comunidades','influence','food','Convocação dos vales'],
  ['kor','Kor','Mestres de transformação e manutenção material','materials','wealth','Mutirão de oficinas'],
  ['orinth','Orinth','Observadores que compartilham métodos e medidas','knowledge','materials','Círculo de estudos'],
  ['nymara','Nymara','Cultivadores de paisagens e memória coletiva','food','influence','Partilha de sementes'],
  ['veyra','Veyra','Articuladores de rotas e padrões de confiança','wealth','influence','Câmara de trocas'],
  ['solenne','Solenne','Anfitriões de encontros e instituições abertas','influence','knowledge','Assembleia de vozes'],
  ['dravik','Dravik','Planejadores de obras e redes de abastecimento','materials','knowledge','Jornada de construção'],
  ['elyra','Elyra','Curadores de saberes e vínculos comunitários','knowledge','food','Escola itinerante'],
] as const;
const colors=['#c8a45c','#7ca6b8','#b6798c','#69a69a','#aab875','#bd8f66','#9b92bf','#80af82','#c294b1','#d1b77d','#91a7ba','#c59a78'];
const resourceNames={food:'Alimento',materials:'Materiais',wealth:'Riqueza',knowledge:'Conhecimento',influence:'Influência'};
export const CIVILIZATIONS:readonly AlphaCivilization[]=civilizations.map(([id,name,identity,first,second,ability],i)=>({id,name,identity,color:colors[i]!,symbol:`civilization-${i+1}`,bias:`Ênfase em ${resourceNames[first]} e ${resourceNames[second]}; não restringe escolhas.`,passives:[{kind:'PRODUCTION',resource:first,amount:1},{kind:'PRODUCTION',resource:second,amount:1}],ability:{name:ability,effects:[{kind:'PRODUCTION',resource:first,amount:2},{kind:'PRODUCTION',resource:second,amount:1}]}}));

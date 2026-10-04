import type { AlphaEffect } from './alpha-effects.js';
export { AlphaEffectSchema, EffectTimingSchema, type AlphaEffect, type EffectTiming } from './alpha-effects.js';
// The Teia Civilizacional lives in alpha-web.ts (V5.1a: 40 + 10 Convergences); ADVANCEMENTS is kept as the name every consumer uses.
export { AdvancementSchema, WEB_ADVANCES as ADVANCEMENTS, type Advancement } from './alpha-web.js';
export interface AlphaCivilization {id:string;name:string;/** Name of the founding capital; players' own names identify seats, not cities. */capital:string;identity:string;color:string;symbol:string;bias:string;passives:readonly AlphaEffect[];ability:{name:string;effects:readonly Extract<AlphaEffect,{kind:'PRODUCTION'}>[]}}
const civilizations=[
  ['aurelia','Aurélia','Celeiro Áureo','Comunidades de cultivo e reservas comuns','food','materials','Celeiros compartilhados'],
  ['valgard','Valgard','Passo de Valgard','Guardas das passagens e construtores de refúgios','materials','food','Oficinas de fronteira'],
  ['meridia','Merídia','Porto das Margens','Redes de intercâmbio entre margens distantes','wealth','knowledge','Feira das margens'],
  ['thalos','Thalos','Farol de Thalos','Cartógrafos e mediadores das costas','knowledge','wealth','Expedição de cartas'],
  ['saren','Saren','Vale do Concílio','Conselhos que preservam acordos entre comunidades','influence','food','Convocação dos vales'],
  ['kor','Kor','Forja de Kor','Mestres de transformação e manutenção material','materials','wealth','Mutirão de oficinas'],
  ['orinth','Orinth','Mirante de Orinth','Observadores que compartilham métodos e medidas','knowledge','materials','Círculo de estudos'],
  ['nymara','Nymara','Bosque da Memória','Cultivadores de paisagens e memória coletiva','food','influence','Partilha de sementes'],
  ['veyra','Veyra','Encruzilhada de Veyra','Articuladores de rotas e padrões de confiança','wealth','influence','Câmara de trocas'],
  ['solenne','Solenne','Ágora de Solenne','Anfitriões de encontros e instituições abertas','influence','knowledge','Assembleia de vozes'],
  ['dravik','Dravik','Aqueduto de Dravik','Planejadores de obras e redes de abastecimento','materials','knowledge','Jornada de construção'],
  ['elyra','Elyra','Escola de Elyra','Curadores de saberes e vínculos comunitários','knowledge','food','Escola itinerante'],
] as const;
const colors=['#c8a45c','#7ca6b8','#b6798c','#69a69a','#aab875','#bd8f66','#9b92bf','#80af82','#c294b1','#d1b77d','#91a7ba','#c59a78'];
// Legacy "materials" effects credit Madeira and Pedra (alphaGainOf); there is no Materiais resource.
const resourceNames={food:'Alimento',materials:'Madeira e Pedra',wealth:'Riqueza',knowledge:'Conhecimento',influence:'Influência'};
export const CIVILIZATIONS:readonly AlphaCivilization[]=civilizations.map(([id,name,capital,identity,first,second,ability],i)=>({id,name,capital,identity,color:colors[i]!,symbol:`civilization-${i+1}`,bias:`Ênfase em ${resourceNames[first]} e ${resourceNames[second]}; não restringe escolhas.`,passives:[{kind:'PRODUCTION',resource:first,amount:1},{kind:'PRODUCTION',resource:second,amount:1}],ability:{name:ability,effects:[{kind:'PRODUCTION',resource:first,amount:2,timing:'ONCE'},{kind:'PRODUCTION',resource:second,amount:1,timing:'ONCE'}]}}));

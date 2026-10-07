import type { AlphaEffect } from './alpha-effects.js';
export { AlphaEffectSchema, EffectTimingSchema, type AlphaEffect, type EffectTiming } from './alpha-effects.js';
// The Teia Civilizacional lives in alpha-web.ts (V5.1a: 40 + 10 Convergences); ADVANCEMENTS is kept as the name every consumer uses.
export { AdvancementSchema, WEB_ADVANCES as ADVANCEMENTS, type Advancement } from './alpha-web.js';
export interface AlphaCivilization {id:string;name:string;/** Name of the founding capital; players' own names identify seats, not cities. */capital:string;identity:string;color:string;symbol:string;bias:string;passives:readonly AlphaEffect[];ability:{name:string;effects:readonly Extract<AlphaEffect,{kind:'PRODUCTION'}>[]}}
const civilizations=[
  ['aurelia','Incas (Tawantinsuyu)','Cusco','Terraços, qollqas e estradas através dos Andes','food','materials','Colheita do Inca'],
  ['valgard','Helênicos','Atenas','Pólis armadas, estratégia e defesa do território','materials','food','Convocação da Pólis'],
  ['meridia','Mesopotâmicos','Babilônia','Cidades de tijolo, canais de irrigação e rotas de comércio','wealth','knowledge','Feira do Karum'],
  ['thalos','Nórdicos','Hedeby','Navegadores, incursores e exploradores das costas do Norte','knowledge','wealth','Travessia do Mar do Norte'],
  ['saren','Índia Antiga','Pataliputra','Editos, diplomacia e cidades planejadas do vale do Ganges','influence','food','Pilares de Edito'],
  ['kor','Romanos','Roma','Legiões, estradas e engenharia de cerco e muralha','materials','wealth','Mutirão das Legiões'],
  ['orinth','Chineses','Chang’an','Burocracia, astronomia e muralhas de um império de estudiosos','knowledge','materials','Exames Imperiais'],
  ['nymara','Egípcios','Tebas','Cheias do Nilo, obras monumentais e a estabilidade das colheitas','food','wealth','Cheia do Nilo'],
  ['veyra','Veyra','Encruzilhada de Veyra','Articuladores de rotas e padrões de confiança','wealth','influence','Câmara de trocas'],
  ['solenne','Israel e Judá','Jerusalém','Tribos reunidas em torno da Lei, do Templo e da memória','influence','knowledge','Assembleia do Portão'],
  ['dravik','Persas','Persépolis','Estradas reais, satrapias e administração de muitos povos','materials','knowledge','Tributo das Satrapias'],
  ['elyra','Elyra','Escola de Elyra','Curadores de saberes e vínculos comunitários','knowledge','food','Escola itinerante'],
] as const;
const colors=['#c8a45c','#7ca6b8','#b6798c','#69a69a','#aab875','#bd8f66','#9b92bf','#80af82','#c294b1','#d1b77d','#91a7ba','#c59a78'];
// Legacy "materials" effects credit Madeira and Pedra (alphaGainOf); there is no Materiais resource.
const resourceNames={food:'Alimento',materials:'Madeira e Pedra',wealth:'Riqueza',knowledge:'Conhecimento',influence:'Influência'};
export const CIVILIZATIONS:readonly AlphaCivilization[]=civilizations.map(([id,name,capital,identity,first,second,ability],i)=>({id,name,capital,identity,color:colors[i]!,symbol:`civilization-${i+1}`,bias:`Ênfase em ${resourceNames[first]} e ${resourceNames[second]}; não restringe escolhas.`,passives:[{kind:'PRODUCTION',resource:first,amount:1},{kind:'PRODUCTION',resource:second,amount:1}],ability:{name:ability,effects:[{kind:'PRODUCTION',resource:first,amount:2,timing:'ONCE'},{kind:'PRODUCTION',resource:second,amount:1,timing:'ONCE'}]}}));

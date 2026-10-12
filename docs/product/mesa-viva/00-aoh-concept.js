/* ===== Cultura material AoH: trechos copiados do artifact 'Material Culture & Civilizations' (cidade, skins, terreno, Regiões, marcadores). Não editar à mão. ===== */
const SQ3=Math.sqrt(3);
const rnd=seed=>{let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}};
const n2=v=>Math.round(v*100)/100;
const P=pts=>pts.map(p=>n2(p[0])+','+n2(p[1])).join(' ');
const hexPts=R=>[0,1,2,3,4,5].map(i=>{const a=(60*i-90)*Math.PI/180;return[R*Math.cos(a),R*Math.sin(a)]});
const dirXY=(k,d)=>{const a=k*Math.PI/3;return[d*Math.cos(a),d*Math.sin(a)]};
let ACC='#5b9bc4',BANNER='PENNANT';
const T={PLAINS:'#5d7350',FOREST:'#394f3e',HILLS:'#766f50',MOUNTAINS:'#60656b',COAST:'#a59c7a',SEA:'#264f68'};
const DC={AGRARIAN:'#8a9a54',COMMERCIAL:'#b8964a',ACADEMIC:'#6f8cb0',ADMINISTRATIVE:'#8a7aa8',MILITARY:'#a85a50',INDUSTRIAL:'#80838a',CULTURAL:'#a8648e',MARITIME:'#4f9aa4'};
const DN={AGRARIAN:'Agrário',COMMERCIAL:'Comercial',ACADEMIC:'Acadêmico',ADMINISTRATIVE:'Administrativo',MILITARY:'Militar',INDUSTRIAL:'Industrial',CULTURAL:'Cultural',MARITIME:'Marítimo'};
const K={wA:'#cdc3ac',wB:'#bdb299',wC:'#ddd5c2',stone:'#b3ab99',stoneD:'#867f70',slate:'#5d646e',tile:'#8e7b66',tileD:'#6d5e4d',thatch:'#a99468',timber:'#6f573b',gold:'#b8914d',white:'#e4ddcc',blue:'#6f8f9a',glow:'#c9a15a',dark:'#241f1a',green:'#6f8658',teal:'#4f8f98'};
const K0={...K};
const OL='stroke="#0b0b0bcc" stroke-width=".7" vector-effect="non-scaling-stroke" stroke-linejoin="round"';
let UID=0;

/* ---------- local-unit parts (origin = ground centre, y up is negative) ---------- */
const box=(x,w,h,c,y0=0)=>`<rect x="${x-w/2}" y="${-h-y0}" width="${w}" height="${h}" fill="${c}" ${OL}/>`;
const gable=(x,w,hb,rh,c)=>`<polygon points="${P([[x-w/2-.8,-hb],[x,-hb-rh],[x+w/2+.8,-hb]])}" fill="${c}" ${OL}/>`;
const pent=(x,w,hb,rh,c)=>`<polygon points="${P([[x-w/2-.6,-hb],[x-w/2+1,-hb-rh],[x+w/2-1,-hb-rh],[x+w/2+.6,-hb]])}" fill="${c}" ${OL}/>`;
const dome=(x,r,hb,c)=>`<path d="M${x-r},${-hb} A${r},${r*1.05} 0 0 1 ${x+r},${-hb} Z" fill="${c}" ${OL}/>`;
const cone=(x,w,hb,rh,c)=>gable(x,w-1.6,hb,rh,c);
const cols=(x,w,h,n,c=K.white)=>Array.from({length:n},(_,i)=>`<rect x="${x-w/2+(w-1.1)*i/Math.max(1,n-1)}" y="${-h}" width="1.1" height="${h}" fill="${c}" ${OL}/>`).join('');
const wins=(x,w,y,n,h=1.8,c=K.glow)=>Array.from({length:n},(_,i)=>`<rect x="${x-w/2+(w-1)*(i+.5)/n-.5}" y="${-y-h}" width="1" height="${h}" fill="${c}"/>`).join('');
const arches=(x,w,h,n)=>Array.from({length:n},(_,i)=>{const cx=x-w/2+w*(i+.5)/n;return `<path d="M${cx-1.1},0 V${-h+1} A1.1,1.1 0 0 1 ${cx+1.1},${-h+1} V0 Z" fill="${K.dark}"/>`}).join('');
const awn=(x,w,h,n,a,b)=>Array.from({length:n},(_,i)=>{const x0=x-w/2+w*i/n,x1=x0+w/n;return `<polygon points="${P([[x0,-h],[x1,-h],[x1+.5,-h+2.6],[x0-.5,-h+2.6]])}" fill="${i%2?b:a}" ${OL}/>`}).join('');
const chim=(x,hb,h,c=K.stoneD)=>`<rect x="${x-.9}" y="${-hb-h}" width="1.8" height="${h}" fill="${c}" ${OL}/>`;
const smoke=(x,y,k=1)=>`<g fill="#cfcac0" opacity=".38"><circle cx="${x}" cy="${-y-1.2*k}" r="${.9*k}"/><circle cx="${x+.7*k}" cy="${-y-3*k}" r="${1.2*k}"/></g>`;
const flag=(x,hb,h,c)=>{if(c!==ACC)return '';const y=-hb-h;const pole=`<line x1="${x}" y1="${-hb}" x2="${x}" y2="${y}" stroke="#2a2118" stroke-width=".8"/>`;
  const shp={PENNANT:[[x,y],[x+3.2,y+1],[x,y+2.2]],STRAIGHT:[[x,y],[x+3.6,y],[x+3.6,y+2.6],[x,y+2.6]],SWALLOWTAIL:[[x,y],[x+3.8,y],[x+2.6,y+1.4],[x+3.8,y+2.8],[x,y+2.8]],GONFALON:[[x,y],[x+2.6,y],[x+2.6,y+4.2],[x+1.3,y+3.2],[x,y+4.2]],SHIELD:[[x,y],[x+3,y],[x+3,y+2],[x+1.5,y+3.4],[x,y+2]],ROUNDED:[[x,y],[x+3.2,y],[x+3.4,y+1.4],[x+3.2,y+2.8],[x,y+2.8]]}[BANNER]||[[x,y],[x+3,y+1],[x,y+2]];
  return pole+`<polygon points="${P(shp)}" fill="${ACC}" stroke="#0009" stroke-width=".4"/>`};
const wheel=(x,r)=>`<circle cx="${x}" cy="${-r}" r="${r}" fill="none" stroke="${K.timber}" stroke-width="1.2"/><path d="M${x-r},${-r} H${x+r} M${x},${-2*r} V0" stroke="${K.timber}" stroke-width=".8"/>`;
const yard=(x,w,c)=>`<polygon points="${P([[x-w/2,-.2],[x-w*.3,-w*.2],[x+w*.35,-w*.22],[x+w/2,.1],[x+w*.3,w*.16],[x-w*.4,w*.15]])}" fill="${c}" opacity=".0"/>`;
const stairs=(x,w,n,c=K.stone)=>Array.from({length:n},(_,i)=>`<rect x="${x-w/2-i*.6}" y="${-(i+1)*1}" width="${w+i*1.2}" height="1" fill="${c}" ${OL}/>`).join('').split('').join('');

/* ---------- 29 buildings (catalog DISTRICT_CATALOG) ---------- */
const BLD={
 GRANARY:   ()=>box(0,13,5,K.wB)+gable(0,13,5,5.2,K.thatch)+`<rect x="-2" y="-3.4" width="4" height="3.4" fill="${K.dark}"/><circle cx="4.6" cy="-1" r="1.1" fill="${K.thatch}"/><circle cx="6.2" cy="-1" r="1.1" fill="${K.wC}"/>`,
 MILL:      ()=>box(-1,7,6,K.wA)+gable(-1,7,6,4,K.tile)+wheel(5.2,3.4)+`<rect x="2.4" y="-1" width="6" height="1" fill="#6f8f9c"/>`,
 IRRIGATION:()=>arches(0,15,4.5,4)+box(0,15,4.5,K.stone)+arches(0,15,4.5,4)+`<rect x="-7.5" y="-5.6" width="15" height="1.1" fill="#6f8f9c"/>`,
 WAREHOUSE: ()=>box(0,15,5,K.stoneD)+pent(0,15,5,2,K.slate)+`<rect x="-5.5" y="-3.4" width="3" height="3.4" fill="${K.dark}"/><rect x="-1.5" y="-3.4" width="3" height="3.4" fill="${K.dark}"/><rect x="2.5" y="-3.4" width="3" height="3.4" fill="${K.dark}"/>`,
 MARKET:    ()=>`<rect x="-7.5" y="-1" width="15" height="1" fill="${K.stone}" ${OL}/>`+cols(-5,0.1,6,1,K.timber)+cols(5,0.1,6,1,K.timber)+awn(0,14,7,5,'#b59a63','#d9cfb6')+`<rect x="-3" y="-2.2" width="2.4" height="1.2" fill="${K.timber}"/><circle cx="3" cy="-1.6" r="1.2" fill="#8f5a4e"/>`,
 TREASURY:  ()=>box(0,10,5.5,K.stone)+gable(0,10,5.5,2.4,K.white)+cols(0,7,5.5,3,K.white)+`<rect x="-1.4" y="-8.6" width="2.8" height="1.2" fill="${K.gold}" ${OL}/>`,
 BANK:      ()=>box(0,12,6,K.wC)+dome(0,3,6,K.gold)+cols(0,10,6,4)+`<rect x="-6" y="-1" width="12" height="1" fill="${K.stone}"/>`,
 SCRIBES_HOUSE:()=>box(-1.5,8,5,K.wA)+gable(-1.5,8,5,5.2,K.tileD)+box(4.2,3,9,K.wB)+cone(4.2,3,9,3,K.slate)+wins(4.2,3,5,1,2),
 LIBRARY:   ()=>box(0,14,5.5,K.wC)+gable(0,14,5.5,2.2,K.slate)+arches(0,12,3.6,5)+wins(0,12,4.2,5,1.4),
 ACADEMY:   ()=>box(0,13,5,K.wC)+cols(0,11,5,5)+gable(0,13,5,2.2,K.white)+dome(0,4.2,7.2,K.blue)+`<rect x="-.5" y="-14.6" width="1" height="2.4" fill="${K.gold}"/>`,
 OBSERVATORY:()=>box(0,8,8,K.wC)+dome(0,4,8,K.blue)+`<path d="M-.6,-12 L1,-12.3 L1.1,-8 L-.5,-8 Z" fill="${K.dark}"/><line x1="0" y1="-12" x2="5" y2="-15.2" stroke="${K.stone}" stroke-width="1.2"/>`,
 LABORATORY:()=>box(0,10,5,K.wA)+pent(0,10,5,2,K.tile)+chim(3.4,5,5.5)+smoke(3.4,10.4,.9)+`<path d="M-3,-5 q0,-3 2,-3 q2,0 2,3 Z" fill="#86a89a" ${OL}/>`,
 ARCHIVE:   ()=>box(0,8,10,K.wB)+pent(0,8,10,1.6,K.stoneD)+wins(0,6.4,2,4,1.2,K.gold)+wins(0,6.4,5,4,1.2,K.gold)+wins(0,6.4,8,4,1.2,K.gold),
 COURT:     ()=>stairs(0,12,2)+box(0,12,5,K.stone,2)+gable(0,12,5,3,K.white).replace(/y="-/g,'y="-')+cols(0,10,5,4),
 CHANCELLERY:()=>box(0,12,5,K.wA)+pent(0,12,5,1.6,K.slate)+box(-5.4,3,8,K.wB)+box(5.4,3,8,K.wB)+flag(0,6.6,5,'#76708a'),
 CIVIC_SQUARE:()=>`<polygon points="${P([[-8,-.5],[-3,-3.6],[5,-3.6],[8.5,-.4],[2,1.6],[-5,1.6]])}" fill="${K.wC}" ${OL}/><rect x="-.7" y="-8" width="1.4" height="7.4" fill="${K.stone}" ${OL}/>`+flag(0,8,4,'#76708a'),
 BARRACKS:  ()=>box(0,14,4,K.wB)+`<rect x="-3.5" y="-3.2" width="7" height="3.2" fill="#3a2f27"/>`+box(-6.6,3.4,8,K.stoneD)+box(6.6,3.4,8,K.stoneD)+cone(-6.6,3.4,8,2.4,K.tileD)+cone(6.6,3.4,8,2.4,K.tileD)+flag(-6.6,10.4,3.2,'#8f5a4e')+flag(6.6,10.4,3.2,'#8f5a4e'),
 ARSENAL:   ()=>box(0,15,4,K.stoneD)+pent(0,15,4,2.4,K.dark)+Array.from({length:6},(_,i)=>`<line x1="${-5.5+i*2.2}" y1="0" x2="${-5.5+i*2.2}" y2="-8.2" stroke="${K.stone}" stroke-width=".7"/>`).join(''),
 TRAINING_GROUND:()=>`<polygon points="${P([[-8,0],[-5,-3.2],[5,-3.2],[8,0]])}" fill="#b49a6a" ${OL}/>`+`<line x1="-3" y1="-1" x2="-3" y2="-6" stroke="${K.timber}" stroke-width="1.2"/><circle cx="-3" cy="-6.6" r="1.2" fill="${K.wB}"/><line x1="3" y1="-1" x2="3" y2="-6" stroke="${K.timber}" stroke-width="1.2"/><circle cx="3" cy="-6.6" r="1.2" fill="${K.wB}"/>`,
 WORKSHOP:  ()=>box(0,11,5,K.wB)+gable(0,11,5,3.2,K.tileD)+box(6.6,4,3.4,K.timber)+chim(-3,5,6)+smoke(-3,11,1),
 FOUNDRY:   ()=>box(0,11,5.5,K.stoneD)+pent(0,11,5.5,1.6,K.slate)+`<rect x="-2" y="-3.6" width="4" height="3.6" fill="${K.glow}"/>`+chim(-4,5.5,9,K.stone)+chim(4,5.5,6,K.stone)+smoke(-4,14.5,1.3),
 THEATER:   ()=>`<path d="M-8,0 A8,6 0 0 1 8,0 Z" fill="${K.stone}" ${OL}/><path d="M-5.6,0 A5.6,4.2 0 0 1 5.6,0 Z" fill="${K.wC}" opacity=".9"/><path d="M-3,0 A3,2.2 0 0 1 3,0 Z" fill="#8e6a80"/>`+box(0,5,4,K.wB,0).replace('<rect','<rect opacity=".0"'),
 CULTURAL_CENTER:()=>box(0,12,4.5,K.wC)+dome(0,3.6,4.5,'#8e6a80')+flag(5.6,4.5,5,'#8e6a80')+flag(-5.6,4.5,5,'#b8914d'),
 SANCTUARY: ()=>box(0,8,6,K.wC)+gable(0,8,6,6,K.white)+`<rect x="-.5" y="-16" width="1" height="4.4" fill="${K.gold}"/><rect x="-1.4" y="-14.4" width="2.8" height=".9" fill="${K.gold}"/>`+`<rect x="-1.2" y="-3.6" width="2.4" height="3.6" fill="${K.glow}"/>`,
 TEMPLE:    ()=>stairs(0,13,2)+box(0,12,5,K.white,2)+cols(0,10,5,5).replace(/y="-/g,'y="-')+gable(0,12,7,3.2,K.gold),
 TRADITION_HOUSE:()=>box(0,14,4.5,K.wB)+`<polygon points="${P([[-8,-4.5],[-6,-9],[0,-7.6],[6,-9],[8,-4.5]])}" fill="${K.tileD}" ${OL}/>`+`<rect x="9" y="-10" width="1.3" height="10" fill="${K.timber}" ${OL}/><circle cx="9.6" cy="-9" r="1.2" fill="#8e6a80"/><circle cx="9.6" cy="-6" r="1.1" fill="${K.gold}"/>`,
 PORT:      ()=>`<rect x="-9" y="-1.2" width="18" height="2.2" fill="#9b7a4b" ${OL}/>`+box(-5,5,4,K.wB)+gable(-5,5,4,3,K.tile)+`<line x1="1" y1="-1" x2="1" y2="-9" stroke="${K.timber}" stroke-width="1.2"/><line x1="1" y1="-9" x2="6.4" y2="-6.6" stroke="${K.timber}" stroke-width="1"/>`,
 SHIPYARD:  ()=>box(-5,6,4,K.wB)+gable(-5,6,4,3,K.tileD)+`<path d="M0,-1 Q4,2 10,-1 L9,-3.6 L1,-3.6 Z" fill="${K.timber}" ${OL}/>`+Array.from({length:4},(_,i)=>`<line x1="${2+i*2}" y1="-3.6" x2="${2+i*2}" y2="-8" stroke="${K.timber}" stroke-width=".8"/>`).join(''),
 LIGHTHOUSE:()=>`<polygon points="${P([[-3,0],[3,0],[2,-13],[-2,-13]])}" fill="${K.white}" ${OL}/><polygon points="${P([[-2.6,-4],[2.6,-4],[2.3,-7],[-2.3,-7]])}" fill="#8f5a4e"/><rect x="-2.4" y="-15.6" width="4.8" height="2.6" fill="${K.glow}" ${OL}/>`+cone(0,6,15.6,2.6,K.slate),
};
const BLD_D={AGRARIAN:['GRANARY','MILL','IRRIGATION'],COMMERCIAL:['MARKET','TREASURY','BANK'],ACADEMIC:['LIBRARY','ACADEMY','OBSERVATORY','ARCHIVE','LABORATORY','SCRIBES_HOUSE'],ADMINISTRATIVE:['CHANCELLERY','COURT','CIVIC_SQUARE'],MILITARY:['BARRACKS','ARSENAL','TRAINING_GROUND'],INDUSTRIAL:['WORKSHOP','FOUNDRY','WAREHOUSE'],CULTURAL:['TEMPLE','THEATER','CULTURAL_CENTER','SANCTUARY','TRADITION_HOUSE'],MARITIME:['PORT','SHIPYARD','LIGHTHOUSE']};
const BN={GRANARY:'Celeiro',MILL:'Moinho',IRRIGATION:'Irrigação',WAREHOUSE:'Armazém',MARKET:'Mercado',TREASURY:'Tesouraria',BANK:'Banco',SCRIBES_HOUSE:'Casa dos Escribas',LIBRARY:'Biblioteca',ACADEMY:'Academia',OBSERVATORY:'Observatório',LABORATORY:'Laboratório',ARCHIVE:'Arquivo',COURT:'Tribunal',CHANCELLERY:'Chancelaria',BARRACKS:'Quartel',ARSENAL:'Arsenal',TRAINING_GROUND:'Campo de Treino',WORKSHOP:'Oficina',FOUNDRY:'Fundição',CIVIC_SQUARE:'Praça Cívica',THEATER:'Teatro',CULTURAL_CENTER:'Centro Cultural',SANCTUARY:'Santuário',TEMPLE:'Templo',TRADITION_HOUSE:'Casa da Tradição',PORT:'Porto',SHIPYARD:'Estaleiro',LIGHTHOUSE:'Farol'};

/* ---------- 12 Obras de Legado (tall single pieces) ---------- */
const OBRA={
 'archive-of-horizons':{n:'Arquivo dos Horizontes',h:30,f:()=>box(0,15,5,K.stoneD)+box(0,11,7,K.wC,5)+box(0,8,7,K.wA,12)+box(0,5.6,6,K.wC,19)+wins(0,9,6,4,1.4,K.gold)+wins(0,6.4,13,3,1.4,K.gold)+cone(0,6,25,5,K.blue)},
 'house-of-accord':{n:'Casa dos Acordos',h:15,f:()=>`<path d="M-11,0 A11,8.5 0 0 1 11,0 Z" fill="${K.wC}" ${OL}/><path d="M-7.6,0 A7.6,5.8 0 0 1 7.6,0 Z" fill="${K.wA}"/><path d="M-4,0 A4,3 0 0 1 4,0 Z" fill="#76708a"/>`+cols(0,18,3,6)+`<line x1="0" y1="-8.5" x2="0" y2="-15" stroke="${K.timber}" stroke-width="1"/><polygon points="${P([[0,-15],[5,-13.6],[0,-12]])}" fill="#76708a"/>`},
 'tidal-exchange':{n:'Entreposto das Marés',h:20,f:()=>box(0,17,3,K.timber,5)+cols(-6,0.1,5,1,K.timber)+cols(6,0.1,5,1,K.timber)+box(0,13,6,K.wB,8)+gable(0,13,14,4.4,K.tile)+arches(0,10,5,3)+`<rect x="9.4" y="-18" width="1.2" height="14" fill="${K.stone}"/><rect x="8.2" y="-15" width="3.6" height=".8" fill="#6f8f9c"/><rect x="8.2" y="-11" width="3.6" height=".8" fill="#6f8f9c"/>`},
 'monument-of-voices':{n:'Monumento das Vozes',h:22,f:()=>[[-7,12],[-3.4,18],[0,22],[3.6,16],[7,10]].map(([x,h])=>`<polygon points="${P([[x-1.8,0],[x+1.8,0],[x+1.2,-h],[x-1.2,-h]])}" fill="${K.stone}" ${OL}/><line x1="${x}" y1="-3" x2="${x}" y2="${-h+3}" stroke="#8e6a80" stroke-width=".8"/>`).join('')},
 'watch-citadel':{n:'Cidadela da Vigília',h:26,f:()=>box(0,13,10,K.stoneD)+[-7,7].map(x=>box(x,4.2,15,K.stone)+cone(x,4.2,15,3,K.slate)).join('')+box(0,7,5,K.stone,10)+`<rect x="-2" y="-18" width="4" height="2" fill="${K.dark}"/><path d="M-1.6,-18 q1.6,-4 3.2,0 Z" fill="${K.glow}"/>`+flag(0,15,5,'#8f5a4e')+arches(0,9,5,2)},
 'road-of-communities':{n:'Estrada das Comunidades',h:17,f:()=>`<path d="M-11,0 V-9 A11,9 0 0 1 11,-9 V0 H7 V-9 A7,7 0 0 0 -7,-9 V0 Z" fill="${K.stone}" ${OL}/>`+box(0,4,5,K.stoneD,12)+`<rect x="-.4" y="-17" width=".8" height="3.4" fill="${K.timber}"/><polygon points="${P([[.4,-17],[4.6,-16],[.4,-14.8]])}" fill="${K.gold}"/>`},
 'sky-instrument':{n:'Instrumento do Firmamento',h:27,f:()=>box(0,9,4,K.stoneD)+box(0,3,14,K.wC,4)+`<ellipse cx="0" cy="-22" rx="10" ry="3.4" fill="none" stroke="${K.gold}" stroke-width="1.3"/><ellipse cx="0" cy="-22" rx="3.4" ry="10" fill="none" stroke="${K.gold}" stroke-width="1.3"/><circle cx="0" cy="-22" r="2" fill="${K.blue}" ${OL}/>`},
 'inquiry-campus':{n:'Pátio da Investigação',h:15,f:()=>`<polygon points="${P([[-11,0],[11,0],[8,-5],[-8,-5]])}" fill="${K.wC}" ${OL}/>`+cols(-9,0.1,8,1)+cols(9,0.1,8,1)+box(-8,5,9,K.wA)+box(8,5,9,K.wA)+gable(-8,5,9,2.4,K.slate)+gable(8,5,9,2.4,K.slate)+box(0,6,5,K.wC)+dome(0,3.2,5,K.blue)+wins(-8,4,4,2,1.4)},
 'world-council':{n:'Conselho dos Horizontes',h:24,f:()=>`<ellipse cx="0" cy="-1" rx="12" ry="3.4" fill="${K.stone}" ${OL}/>`+[-9,-4.5,4.5,9].map(x=>box(x,2,6,K.white,1)+`<polygon points="${P([[x-1.4,-7],[x+1.4,-7],[x,-9]])}" fill="#76708a"/>`).join('')+`<rect x="-.8" y="-22" width="1.6" height="21" fill="${K.stone}" ${OL}/><polygon points="${P([[.8,-22],[7,-20],[.8,-17.6]])}" fill="#76708a"/><circle cx="0" cy="-23" r="1.5" fill="${K.gold}"/>`},
 'common-mint':{n:'Casa da Medida Comum',h:22,f:()=>box(0,13,7,K.wC)+gable(0,13,7,3,K.slate)+`<circle cx="0" cy="-16" r="5.6" fill="${K.gold}" ${OL}/><circle cx="0" cy="-16" r="3.6" fill="none" stroke="#a8842a" stroke-width=".8"/><line x1="-7" y1="-10" x2="7" y2="-10" stroke="${K.stone}" stroke-width="1"/>`+cols(0,9,7,4)},
 'terraced-reserves':{n:'Reservas dos Terraços',h:22,f:()=>box(0,22,4,'#7b8a56')+box(0,17,4,'#8a9a5c',4)+box(0,12,4,'#94a063',8)+box(0,7,4,K.wB,12)+cone(0,8,16,4,K.thatch)+`<path d="M-9,-4 V0 M-5,-8 V-4 M5,-8 V-4 M9,-4 V0" stroke="#5b6b45" stroke-width=".8"/>`},
 'shared-foundry':{n:'Fundição Compartilhada',h:26,f:()=>box(-7,7,9,K.stoneD)+box(7,7,9,K.stoneD)+chim(-7,9,13,K.stone)+chim(7,9,9,K.stone)+box(0,7,3,K.stone,6)+`<rect x="-8.4" y="-6" width="3.2" height="3.6" fill="${K.glow}"/><rect x="5.2" y="-6" width="3.2" height="3.6" fill="${K.glow}"/>`+smoke(-7,22,1.4)+smoke(7,18,1.1)},
};



/* ---------- skins: the cultural layer. Same geometry, other materials. ---------- */
const croof=(x,w,hb,c)=>{const ov=2.6;return `<polygon points="${P([[x-w/2-ov,-hb-2.4],[x-w/2,-hb+.6],[x+w/2,-hb+.6],[x+w/2+ov,-hb-2.4],[x+w/2-1,-hb-4.4],[x+w/2-3,-hb-5.8],[x-w/2+3,-hb-5.8],[x-w/2+1,-hb-4.4]])}" fill="${c}" ${OL}/>`};
const trap=(x,wb,wt,h,c,y0=0)=>`<polygon points="${P([[x-wb/2,-y0],[x+wb/2,-y0],[x+wt/2,-y0-h],[x-wt/2,-y0-h]])}" fill="${c}" ${OL}/>`;
const SKINS={
 valgard:{name:'Leontia',tones:[['#efe9d6','#d3cab0','#b4aa90'],['#e6dfca','#c9bfa3','#a99f85'],['#f5f0e0','#dcd3ba','#bcb299']],roof:'lowgable',plinthTop:'#c2b99f',plinthSide:'#8a826c',street:'#d8d0b8',orn:['#4f7f8a','1.5 2.5'],wall:['#cfc6ac','#a89f86'],cap:'cone',banner:'SHIELD',port:{deck:'#cdc5ae',post:'#a89f86',style:'mole'},
  K:{wA:'#e6dfca',wB:'#d6cdb4',wC:'#f1ebd9',stone:'#dcd5c0',stoneD:'#b0a88f',slate:'#8a9396',tile:'#b9825e',tileD:'#965f42',thatch:'#c9b48a',timber:'#7a5e3c',blue:'#7a98a2'}},
 kor:{name:'Yuhan',tones:[['#c0aa90','#8d7560','#6b5846'],['#b29d84','#816b57','#63503f'],['#cbb69c','#977f69','#75604d']],roof:'curved',plinthTop:'#8f8470',plinthSide:'#4e4639',street:'#a99c84',orn:['#8e4a3c','4 2'],wall:['#6f6c65','#55524c'],cap:'curved',banner:'SHIELD',port:{deck:'#6a4a35',post:'#8e4a3c',style:'pier'},
  K:{wA:'#a99682',wB:'#8c7a68',wC:'#b9a892',stone:'#8f8b82',stoneD:'#6a665e',slate:'#4a4f54',tile:'#5a5f63',tileD:'#3d4145',thatch:'#7a6a52',timber:'#5a3a2a',blue:'#4f7a73'}},
 dravik:{name:'Tawanta',tones:[['#bdb8a6','#8f8a78','#6f6b5a'],['#b0ab99','#827d6c','#64604f'],['#c6c1af','#9a9583','#78745f']],roof:'thatch',terrace:true,plinthTop:'#9a9582',plinthSide:'#625e4e',street:'#bdb6a0',orn:null,wall:['#8f8a78','#6f6b5a'],cap:'none',banner:'GONFALON',port:{deck:'#8f8a78',post:'#6f6b5a',style:'jetty'},
  K:{wA:'#b7b2a2',wB:'#9d9886',wC:'#cbc6b5',stone:'#a9a493',stoneD:'#7d7967',slate:'#5b5f60',tile:'#a58a5a',tileD:'#7f6a45',thatch:'#b79c62',timber:'#6c5238',blue:'#5f8f8a'}},
 base:{name:'Neutro',tones:[['#d8cfba','#aaa08c','#8c8472'],['#c9c1ae','#9d9482','#7f7867'],['#e1dac8','#b3a995','#948c7a']],roof:'flat',plinthTop:'#a69d89',plinthSide:'#5d574b',street:'#c4baa5',orn:null,wall:['#a79f8d','#8a8373'],cap:'cone',banner:'PENNANT',port:{deck:'#9a7d52',post:'#3a2a18',style:'pier'},K:{}}
};
function useSkin(id){const sk=SKINS[id]||SKINS.base;Object.assign(K,K0,sk.K);BANNER=sk.banner;return sk}

/* ---------- city ---------- */
const SLOTS=[1,1,2,3,4,5,6],RR=[.46,.52,.60,.67,.72,.76,.79],BLOCKS=[4,7,11,16,22,28,36];
const AN=[[-.32,.14],[.30,.22],[-.10,-.36],[.42,-.20],[-.50,-.18],[.04,.50]];
const LAND=['LIGHTHOUSE','FOUNDRY','ACADEMY','OBSERVATORY','TEMPLE','BARRACKS','BANK','MARKET','CHANCELLERY','GRANARY'];
function blobPts(rr,seed,k=1,n=24){const r=rnd(seed),a1=r()*6,a2=r()*6;return Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2;const rad=rr*k*(1+.07*Math.sin(3*a+a1)+.05*Math.sin(5*a+a2));return[Math.cos(a)*rad,Math.sin(a)*rad*.94]})}

function roofOver(sk,w,h,d){
  if(sk.roof==='lowgable')return `<polygon points="${P([[-w/2-.6,-h],[0,-h-w*.2],[w/2+.6,-h]])}" fill="${K.tile}" stroke="#0009" stroke-width=".5" vector-effect="non-scaling-stroke"/>`;
  if(sk.roof==='thatch')return `<polygon points="${P([[-w/2-.8,-h],[0,-h-w*.34],[w/2+.8,-h]])}" fill="${K.thatch}" stroke="#0009" stroke-width=".5" vector-effect="non-scaling-stroke"/>`;
  if(sk.roof==='curved'){const ov=w*.2;return `<polygon points="${P([[-w/2-ov,-h-ov*.9],[-w/2,-h+ov*.25],[w/2,-h+ov*.25],[w/2+ov,-h-ov*.9],[w/2-ov*.3,-h-ov*1.6],[-w/2+ov*.3,-h-ov*1.6]])}" fill="${K.tile}" stroke="#0009" stroke-width=".5" vector-effect="non-scaling-stroke"/>`}
  return '';
}
function massSk(sk,x,y,w,h,tone,d){const k=d*.6,T0=sk.tones[tone%3];
  return `<g transform="translate(${n2(x)},${n2(y)})"><rect x="${n2(-w/2)}" y="${n2(-h)}" width="${n2(w)}" height="${n2(h)}" fill="${T0[1]}"/><polygon points="${P([[w/2,-h],[w/2+k,-h-d],[w/2+k,-d],[w/2,0]])}" fill="${T0[2]}"/><polygon points="${P([[-w/2,-h],[w/2,-h],[w/2+k,-h-d],[-w/2+k,-h-d]])}" fill="${T0[0]}"/>${roofOver(sk,w,h,d)}</g>`}

function yardSvg(d,x,y,R,lod,w){
  const base={AGRARIAN:'#8d9873',COMMERCIAL:'#cdc3ab',ACADEMIC:'#cac4b4',ADMINISTRATIVE:'#cfc8b6',MILITARY:'#8a8271',INDUSTRIAL:'#767060',CULTURAL:'#d2cbba',MARITIME:'#8a6f4b'}[d];
  const pl=[[-w*.5,-w*.16],[-w*.2,-w*.32],[w*.3,-w*.3],[w*.5,-w*.02],[w*.3,w*.24],[-w*.38,w*.26]].map(p=>[x+p[0],y+p[1]]);
  let g=`<polygon points="${P(pl)}" fill="${base}" opacity=".9" stroke="#00000030" stroke-width=".6" vector-effect="non-scaling-stroke"/>`;
  g+=`<circle cx="${n2(x+w*.42)}" cy="${n2(y-w*.2)}" r="${n2(Math.max(1.3,R*.021))}" fill="${DC[d]}" stroke="#000a" stroke-width=".6" vector-effect="non-scaling-stroke"/>`;
  return g}

function civicFor(id,L){
  const A=ACC;
  if(id==='valgard'){ // pale stone, peristyle, acropolis
    if(L<=2)return box(0,6,3.4,K.wB)+gable(0,6,3.4,2,K.tile)+flag(5,0,10,A);
    if(L===3)return box(0,10,4,K.wC)+cols(0,10,4,5)+gable(0,10,4,2.2,K.tile)+flag(7,0,11,A);
    if(L===4)return stairs(0,13,2)+box(0,11,5,K.wC,2)+cols(0,10,5,5)+gable(0,11,7,2.8,K.tile)+flag(8,0,13,A);
    if(L===5)return stairs(0,15,2)+box(0,12,5,K.wC,2)+cols(0,11,5,6)+gable(0,12,7,3,K.tile)+box(9,5,4,K.wC)+dome(9,2.8,4,K.stoneD)+flag(0,10,6,A);
    if(L===6)return box(0,20,3,K.stone)+stairs(0,14,2)+box(0,13,5,K.wC,5)+cols(0,12,5,6)+gable(0,13,10,3.2,K.tile)+flag(0,13.2,6,A);
    return box(0,26,3,K.stone)+box(0,22,3,K.stoneD,3)+box(0,14,6,K.wC,6)+cols(0,13,6,7)+gable(0,14,12,3.6,K.gold)+box(-10,4,9,K.wB,3)+box(10,4,9,K.wB,3)+gable(-10,4,12,2,K.tile)+gable(10,4,12,2,K.tile)+flag(0,15.6,6,A)}
  if(id==='kor'){ // dark timber, curved roofs, platforms
    if(L<=2)return box(0,7,3.4,K.wB)+croof(0,7,3.4,K.tile)+flag(6,0,11,A);
    if(L===3)return box(0,9,4,K.wB)+croof(0,9,4,K.tile)+box(6,3,6,K.timber)+flag(8,0,12,A);
    if(L===4)return box(0,10,4,K.wB)+croof(0,10,4,K.tile)+box(0,6,4,K.wB,8.4)+croof(0,6,12.4,K.tileD)+flag(7,0,14,A);
    if(L===5)return box(0,10,3,K.wB)+croof(0,10,3,K.tile)+box(0,7,3,K.wB,6.4)+croof(0,7,9.4,K.tile)+box(0,4,3,K.wB,13)+croof(0,4,16,K.tileD)+flag(7,0,16,A);
    if(L===6)return stairs(0,18,2)+box(0,14,5,K.wB,2)+croof(0,14,7,K.tile)+box(0,8,4,K.wB,9)+croof(0,8,13,K.tileD)+flag(0,13,7,A);
    return box(0,28,3,K.stoneD)+box(0,24,3,K.stone,3)+box(0,16,6,K.wB,6)+croof(0,16,12,K.tile)+box(0,9,5,K.wB,14)+croof(0,9,19,K.tileD)+box(-11,5,6,K.wB,3)+croof(-11,5,9,K.tile)+box(11,5,6,K.wB,3)+croof(11,5,9,K.tile)+flag(0,25,6,A)}
  // dravik: fitted stone, terraces, trapezoid doors
  if(L<=2)return box(0,6,3.2,K.wB)+gable(0,6,3.2,2.4,K.thatch)+flag(5,0,10,A);
  if(L===3)return trap(0,12,9,2.4,K.wB)+trap(0,8,6,2.4,K.wA,2.4)+flag(5,4.8,8,A);
  if(L===4)return trap(0,14,11,2.4,K.wB)+trap(0,10,8,2.4,K.wA,2.4)+box(0,6,4,K.wC,4.8)+gable(0,6,8.8,3,K.thatch)+flag(6,4.8,8,A);
  if(L===5)return trap(0,18,15,2.4,K.wB)+trap(0,14,11,2.4,K.wA,2.4)+trap(0,10,8,2.4,K.wB,4.8)+box(0,6,4,K.wC,7.2)+gable(0,6,11.2,3,K.thatch)+flag(0,14,7,A);
  if(L===6)return trap(0,24,21,2.4,K.wB)+trap(0,19,16,2.4,K.wA,2.4)+trap(0,14,11,2.4,K.wB,4.8)+box(0,8,5,K.wC,7.2)+gable(0,8,12.2,3.4,K.thatch)+flag(0,15.6,7,A);
  return trap(0,30,27,2.8,K.wB)+trap(0,25,22,2.8,K.wA,2.8)+trap(0,20,17,2.8,K.wB,5.6)+trap(0,15,12,2.8,K.wA,8.4)+box(0,9,5,K.wC,11.2)+gable(0,9,16.2,3.6,K.thatch)+box(-12,5,7,K.wB,3)+gable(-12,5,10,2.4,K.thatch)+box(12,5,7,K.wB,3)+gable(12,5,10,2.4,K.thatch)+flag(0,19.8,7,A)}

function fortification(sk,level,pts,R,items,skipDir){
  const hw=Math.max(R*[0,.035,.055,.075,.09,.1][level],level===1?R*.04:2.4),col=level>=4?sk.wall[1]:sk.wall[0];
  const n=pts.length;
  const skip=i=>{if(skipDir==null)return false;const a=pts[i],ang=Math.atan2(a[1]/.94,a[0]);const t=skipDir*Math.PI/3,dlt=Math.abs(Math.atan2(Math.sin(ang-t),Math.cos(ang-t)));return dlt<.5};
  for(let i=0;i<n;i++){const a=pts[i],b=pts[(i+1)%n],my=(a[1]+b[1])/2;
    if(level>=3&&i===6&&!skip(i))continue;if(skip(i))continue;
    if(level===1){const len=Math.hypot(b[0]-a[0],b[1]-a[1]),m=Math.max(2,Math.round(len/(R*.04)));let s='';for(let j=0;j<m;j++){const t=j/m,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;s+=`<line x1="${n2(x)}" y1="${n2(y)}" x2="${n2(x)}" y2="${n2(y-hw)}" stroke="#5e4630" stroke-width="${n2(Math.max(1,R*.016))}" stroke-linecap="round"/>`}items.push({y:my,s})}
    else items.push({y:my,s:`<polygon points="${P([a,b,[b[0],b[1]-hw],[a[0],a[1]-hw]])}" fill="${col}" stroke="#0b0b0bb0" stroke-width=".6" vector-effect="non-scaling-stroke"/><line x1="${n2(a[0])}" y1="${n2(a[1]-hw)}" x2="${n2(b[0])}" y2="${n2(b[1]-hw)}" stroke="#ddd5c0" stroke-width="${n2(Math.max(.9,R*.014))}" ${sk.terrace?`stroke-dasharray="${n2(R*.05)} ${n2(R*.05)}"`:''} vector-effect="non-scaling-stroke"/>`});
  }
  const tw=(x,y)=>{const u=R/60,hh=Math.max(11,R*.17/u);let cap=`<polygon points="${P([[-4.4,-hh],[4.4,-hh],[0,-hh-3.4]])}" fill="${sk.cap==='curved'?K.tile:K.slate}" ${OL}/>`;if(sk.cap==='curved')cap=croof(0,7,hh,K.tile);if(sk.cap==='none')cap='';
    return {y:y+1,s:`<g transform="translate(${n2(x)},${n2(y)}) scale(${n2(u*1.1)})"><rect x="-3.4" y="${-hh}" width="6.8" height="${hh}" fill="${sk.wall[1]}" ${OL}/><rect x="-3.4" y="${-hh}" width="2.4" height="${hh}" fill="${sk.wall[0]}"/>${cap}</g>`}};
  if(level>=3){const pos=level===3?[0,5,12,18]:level===4?[0,4,8,12,16,20]:[0,5,9,12,16,21];pos.forEach(i=>{if(skip(i%n))return;const p=pts[i%n];items.push(tw(p[0],p[1]))})}
  if(level>=3&&!skip(6)){const a=pts[6],b=pts[7],gx=(a[0]+b[0])/2,gy=(a[1]+b[1])/2;items.push({y:gy+.5,s:`<g transform="translate(${n2(gx)},${n2(gy)}) scale(${n2(R/60)})"><rect x="-4" y="-7" width="8" height="7" fill="${sk.wall[1]}" ${OL}/><path d="M-2,0 V-3 A2,2 0 0 1 2,-3 V0 Z" fill="${K.dark}"/></g>`})}
  if(level===5)items.push({y:-2,s:`<g transform="translate(0,${n2(-R*.02)}) scale(${n2(R/60*1.1)})"><rect x="-5.5" y="-10" width="11" height="10" fill="${sk.wall[1]}" ${OL}/></g>`});
}

function shipFor(style,u){
  if(style==='mole')return `<g transform="scale(${n2(u)})"><path d="M-12,-1 Q0,4 12,-1 L10,-3.4 L-10,-3.4 Z" fill="${K.timber}" ${OL}/><rect x="10" y="-3" width="3.4" height="1.4" fill="${K.gold}"/><rect x="-1" y="-11" width="1" height="8" fill="#2c2218"/><polygon points="${P([[-.4,-11],[5,-8],[-.4,-5]])}" fill="#d8cfb8" ${OL}/><path d="M-9,-2 l-2,3 M-5,-2 l-2,3 M-1,-2 l-2,3 M3,-2 l-2,3 M7,-2 l-2,3" stroke="#3a2a18" stroke-width=".7"/></g>`;
  if(style==='pier')return `<g transform="scale(${n2(u)})"><path d="M-9,-1.4 Q0,3.6 9,-1.4 L8,-3.4 L-8,-3.4 Z" fill="#4a3322" ${OL}/><rect x="-.5" y="-14" width="1" height="11" fill="#2c2218"/><polygon points="${P([[.5,-14],[8,-12],[8,-4.6],[.5,-4.6]])}" fill="#b89a66" ${OL}/>${[-12,-9.6,-7.2,-4.8].map(y=>`<line x1=".5" y1="${y}" x2="8" y2="${y+.4}" stroke="#6f5a38" stroke-width=".5"/>`).join('')}</g>`;
  return `<g transform="scale(${n2(u)})"><path d="M-8,-1 Q-9,-4 -6,-5.4 Q0,-1.6 6,-5.4 Q9,-4 8,-1 Q0,2 -8,-1 Z" fill="#c9b878" ${OL}/><path d="M-12,-2 Q-13,-5 -10,-6.4 Q-6,-3 -2,-6.4 Q0,-5 -1,-2 Q-6,0 -12,-2 Z" fill="#bba96c" ${OL} transform="translate(2,4)"/></g>`;
}
function port(sk,R,k,rr,items,lod){
  const [dx,dy]=dirXY(k,1),nx=-dy,ny=dx,hp=hexPts(R),va=hp[(k+1)%6],vb=hp[(k+2)%6],pt=sk.port;
  const inw=R*.06,ux=-dx*inw,uy=-dy*inw;
  let g=`<polygon points="${P([va,vb,[vb[0]+ux,vb[1]+uy],[va[0]+ux,va[1]+uy]])}" fill="${pt.post}" stroke="#0b0b0bb0" stroke-width=".6" vector-effect="non-scaling-stroke"/><line x1="${n2(va[0])}" y1="${n2(va[1])}" x2="${n2(vb[0])}" y2="${n2(vb[1])}" stroke="#d3cab4" stroke-width="${n2(Math.max(.9,R*.014))}"/>`;
  const r0=rr*.74,r1=R*(pt.style==='mole'?1.55:1.62),w=Math.max(R*(pt.style==='mole'?.1:pt.style==='jetty'?.085:.07),1.5);
  const A=[dx*r0+nx*w,dy*r0+ny*w],B=[dx*r1+nx*w,dy*r1+ny*w],C=[dx*r1-nx*w,dy*r1-ny*w],D=[dx*r0-nx*w,dy*r0-ny*w];
  g+=`<polygon points="${P([A,B,C,D])}" fill="${pt.deck}" stroke="#0b0b0bcc" stroke-width=".7" vector-effect="non-scaling-stroke"/>`;
  if(lod>=1){const planks=Math.round((r1-r0)/(R*(pt.style==='pier'?.07:.1)));for(let i=1;i<planks;i++){const t=r0+(r1-r0)*i/planks;g+=`<line x1="${n2(dx*t+nx*w)}" y1="${n2(dy*t+ny*w)}" x2="${n2(dx*t-nx*w)}" y2="${n2(dy*t-ny*w)}" stroke="#0004" stroke-width=".6" vector-effect="non-scaling-stroke"/>`}}
  const ex=dx*R*.866,ey=dy*R*.866;[1,-1].forEach(sg=>{g+=`<circle cx="${n2(ex+sg*nx*w*1.25)}" cy="${n2(ey+sg*ny*w*1.25)}" r="${n2(Math.max(1.3,R*.02))}" fill="${K.gold}" stroke="#000a" stroke-width=".6" vector-effect="non-scaling-stroke"/>`});
  items.push({y:dy*r0-1,s:g});
  const u=R/60;
  if(lod>=1){const sx=dx*R*1.28+nx*R*.19,sy=dy*R*1.28+ny*R*.19;items.push({y:sy+1,s:`<g transform="translate(${n2(sx)},${n2(sy)})">${shipFor(pt.style,u)}</g>`});
    if(pt.style==='jetty')items.push({y:sy+3,s:`<g transform="translate(${n2(dx*R*1.0-nx*R*.2)},${n2(dy*R*1.0-ny*R*.2)})">${shipFor('jetty',u*.8)}</g>`})}
}

function obra(id,step){const o=OBRA[id],k=step===1?.5:1;let s=`<g transform="scale(1,${k})">${o.f()}</g>`;
  if(step===1){const h=o.h*k+3;s+=`<g stroke="${K.timber}" stroke-width=".9" fill="none"><path d="M-8,0 V${-h} M8,0 V${-h} M-8,${-h*.33} H8 M-8,${-h*.66} H8 M-8,0 L8,${-h*.33} M8,0 L-8,${-h*.33} M-8,${-h*.33} L8,${-h*.66}"/></g>`}
  if(step===3)s+=`<g transform="translate(0,${-o.h})"><polygon points="${P([[-2.4,0],[0,-3.4],[2.4,0]])}" fill="${K.gold}" ${OL}/><circle cx="0" cy="-4.6" r="1.1" fill="#e6cf95"/></g>`;
  return s}

function city(R,o){
  const sk=useSkin(o.skin),L=o.L,rr=R*RR[L-1],seed=o.seed||7,r=rnd(seed*13+L),s=R/60,lod=R<40?0:R<80?1:2;
  if(o.acc)ACC=o.acc;
  const items=[],pts=blobPts(rr,seed);let g='';const ds=o.districts||[];
  let anchors=AN.slice(0,SLOTS[L-1]).map(a=>[a[0]*rr,a[1]*rr*.92]);let portIdx=-1;
  if(o.port!=null){const [pdx,pdy]=dirXY(o.port,1),wp=[pdx*rr*.55,pdy*rr*.55];let best=1e9;anchors.forEach((a,i)=>{const d=Math.hypot(a[0]-wp[0],a[1]-wp[1]);if(d<best){best=d;portIdx=i}});anchors[portIdx]=wp}
  const free=anchors.map((_,i)=>i).filter(i=>i!==portIdx);
  const asg=ds.map(d=>d.d==='MARITIME'&&portIdx>=0?portIdx:free.shift());const usedIdx=new Set(asg);
  const th=R*.045;
  g+=`<polygon points="${P(pts.map(p=>[p[0]*1.03,p[1]*1.03+th]))}" fill="${sk.plinthSide}"/>`;
  g+=`<polygon points="${P(pts)}" fill="${sk.plinthTop}" stroke="${ACC}" stroke-width="${n2(Math.max(1.1,R*.022))}" stroke-linejoin="round"/>`;
  if(sk.terrace)g+=`<polygon points="${P(pts.map(p=>[p[0]*.9,p[1]*.9-th*.5]))}" fill="none" stroke="#00000040" stroke-width="${n2(Math.max(.8,R*.012))}"/><polygon points="${P(pts.map(p=>[p[0]*.9,p[1]*.9-th*.5]))}" fill="none" stroke="#ffffff30" stroke-width=".6" transform="translate(0,${n2(-R*.012)})"/>`;
  if(sk.orn)g+=`<polygon points="${P(pts.map(p=>[p[0]*.94,p[1]*.94]))}" fill="none" stroke="${sk.orn[0]}" stroke-width="${n2(Math.max(.9,R*.013))}" stroke-dasharray="${sk.orn[1].split(' ').map(v=>n2(v*Math.max(.5,R*.03))).join(' ')}" opacity=".85"/>`;
  const sw=Math.max(.8,R*.022);
  g+=`<g fill="none" stroke="${sk.street}" stroke-width="${n2(sw)}" stroke-linecap="round" opacity=".85"><path d="M${n2(-rr*.88)},${n2(-rr*.1)} Q0,${n2(rr*.22)} ${n2(rr*.88)},${n2(rr*.05)}"/><path d="M${n2(-rr*.1)},${n2(-rr*.86)} Q${n2(rr*.2)},0 0,${n2(rr*.84)}"/>${L>=6?`<path d="M${n2(-rr*.7)},${n2(-rr*.55)} L${n2(rr*.7)},${n2(rr*.55)}" stroke-width="${n2(sw*1.6)}"/>`:''}</g>`;
  const usedPts=[];
  ds.forEach((d,i)=>{const [ax,ay]=anchors[asg[i]];usedPts.push([ax,ay]);const bl=(d.b||[]).filter(b=>b!=='PORT');const yw=R*(.3+.03*Math.min(3,bl.length));g+=yardSvg(d.d,ax,ay,R,lod,yw);
    if(lod>=1){let j=0;bl.forEach(id=>{if(id==='LIGHTHOUSE'&&o.port!=null)return;const ox=(j===0?0:(j%2?1:-1)*Math.ceil(j/2)*yw*.3),oy=yw*(.1+(j>2?-.16:0));j++;items.push({y:ay+oy,s:`<g transform="translate(${n2(ax+ox)},${n2(ay+oy)}) scale(${n2(s*1.4*(bl.length>3?.8:1))})">${BLD[id]()}</g>`})})}});
  const hasLH=ds.some(d=>(d.b||[]).includes('LIGHTHOUSE'));
  if(hasLH&&o.port!=null){const hp=hexPts(R),v=hp[(o.port+1)%6];const lx=v[0]*.74,ly=v[1]*.74+R*.05;items.push({y:ly,s:`<g transform="translate(${n2(lx)},${n2(ly)}) scale(${n2(s*(lod===0?2.0:1.5))})">${BLD.LIGHTHOUSE()}</g>`})}
  if(lod===0){const all=ds.flatMap((d,i)=>(d.b||[]).map(b=>({b,i})));const pick=LAND.find(p=>all.some(a=>a.b===p&&!(p==='LIGHTHOUSE'&&o.port!=null)));if(pick){const a=all.find(x=>x.b===pick),[ax,ay]=anchors[asg[a.i]];items.push({y:ay,s:`<g transform="translate(${n2(ax)},${n2(ay)}) scale(${n2(s*1.7)})">${BLD[pick]()}</g>`})}}
  anchors.forEach((a,i)=>{if(usedIdx.has(i))return;const[ax,ay]=a;g+=`<polygon points="${P([[-.11*R,0],[-.04*R,-.07*R],[.08*R,-.06*R],[.12*R,.02*R],[.02*R,.07*R],[-.08*R,.06*R]].map(p=>[ax+p[0],ay+p[1]]))}" fill="#948b76" opacity=".8"/>`;if(lod>=1)items.push({y:ay,s:`<g transform="translate(${n2(ax)},${n2(ay)}) scale(${n2(s)})"><circle cx="-4" cy="-2" r="2" fill="#6a7d57"/><circle cx="1" cy="-3" r="2.3" fill="#5c7049"/></g>`})});
  const cnt=BLOCKS[L-1],h0=R*[.034,.04,.05,.062,.078,.095,.11][L-1];let placed=[],tries=0;
  while(placed.length<cnt&&tries<900){tries++;const ang=r()*6.283,rad=Math.sqrt(r())*rr*.84,x=Math.cos(ang)*rad,y=Math.sin(ang)*rad*.9;
    if(usedPts.some(u=>Math.hypot(u[0]-x,u[1]-y)<R*.2))continue;if(L>=3&&Math.hypot(x,y)<R*.1)continue;if(placed.some(p=>Math.hypot(p[0]-x,p[1]-y)<R*.11))continue;placed.push([x,y,Math.hypot(x,y)/rr])}
  placed.forEach(([x,y,t],i)=>{const w=R*(.095+.035*r()),h=h0*(1+1.1*(1-t))*(.8+.5*r());items.push({y,s:massSk(sk,x,y,w,h,i,w*.42)})});
  if(L>=3)g+=`<ellipse cx="0" cy="${n2(rr*.02)}" rx="${n2(R*.12)}" ry="${n2(R*.07)}" fill="${sk.street}" stroke="#00000030" stroke-width=".6" vector-effect="non-scaling-stroke"/>`;
  const civ=civicFor(o.skin==='base'||!o.skin?'valgard':o.skin,L);
  items.push({y:L===7?-rr*.28:rr*.02,s:L===7?`<g transform="translate(0,${n2(-rr*.28)}) scale(${n2(s*1.2)})">${civ}</g>`:`<g transform="translate(0,${n2(rr*.02)}) scale(${n2(s*1.1)})">${civ}</g>`});
  if(o.fort)fortification(sk,o.fort,blobPts(rr,seed,1.08),R,items,o.port);
  if(o.port!=null)port(sk,R,o.port,rr,items,lod);
  if(o.obra){const ox=R*.5,oy=-R*.84;items.push({y:oy+2,s:`<g transform="translate(${n2(ox)},${n2(oy)}) scale(${n2(s*1.1)})">${obra(o.obra,o.obraStep||3)}</g>`})}
  items.sort((a,b)=>a.y-b.y);
  return g+items.map(i=>i.s).join('');
}

function terrainHex(R,t,seed){
  const id='h'+(++UID),r=rnd(seed),sc=Math.min(1,R/60),cnt=b=>Math.max(2,Math.round(b*Math.max(.3,sc)));
  let s=`<clipPath id="${id}"><polygon points="${P(hexPts(R))}"/></clipPath><g clip-path="url(#${id})"><rect x="${-R}" y="${-R}" width="${2*R}" height="${2*R}" fill="${T[t]}"/>`;
  const rp=()=>[(r()*2-1)*R*.78,(r()*2-1)*R*.8],lw=Math.max(.6,R*.011);
  if(t==='PLAINS')for(let i=0;i<cnt(8);i++){const[x,y]=rp();s+=`<path d="M${n2(x)},${n2(y)} l${n2(-R*.025)},${n2(-R*.045)} M${n2(x)},${n2(y)} l${n2(R*.02)},${n2(-R*.05)}" stroke="#7a9266" stroke-width="${lw}" fill="none" stroke-linecap="round"/>`}
  if(t==='FOREST')for(let i=0;i<cnt(10);i++){const[x,y]=rp(),a=R*.09;s+=`<polygon points="${P([[x,y-a*1.9],[x-a*.8,y],[x+a*.8,y]])}" fill="#2b4033"/><polygon points="${P([[x,y-a*1.9],[x-a*.8,y],[x,y]])}" fill="#35503e"/>`}
  if(t==='HILLS')for(let i=0;i<cnt(4);i++){const[x,y]=rp(),a=R*.2;s+=`<path d="M${n2(x-a)},${n2(y)} Q${n2(x)},${n2(y-a*.85)} ${n2(x+a)},${n2(y)} Z" fill="#877f5c" stroke="#5a5439" stroke-width="${lw}"/>`}
  if(t==='SEA')for(let i=0;i<cnt(6);i++){const[x,y]=rp(),a=R*.07;s+=`<path d="M${n2(x-a*2)},${n2(y)} q${n2(a)},${n2(-a)} ${n2(a*2)},0 q${n2(a)},${n2(a)} ${n2(a*2)},0" stroke="#5f8ea6" stroke-width="${lw}" fill="none"/>`}
  if(t==='COAST')s+=`<path d="M${n2(-R*.7)},${n2(R*.5)} q${n2(R*.2)},${n2(-R*.1)} ${n2(R*.4)},0 t${n2(R*.4)},0" stroke="#dfe9ea" stroke-width="${lw}" fill="none" opacity=".7"/>`;
  return s+`</g><polygon points="${P(hexPts(R))}" fill="none" stroke="#0a1115" stroke-width="${Math.max(.7,R*.012)}"/>`}

function scene(R,S,o={}){
  const w=SQ3*R*3+R*.6,h=R*5+R*.5,cw=o.cw||w,ch=o.ch||h,cx=cw/2,cy=ch/2+(o.cw?0:R*.1);let g='';
  if(o.context){const rs=R*1.5,cs=SQ3*R;for(let q=-9;q<=9;q++)for(let rr=-7;rr<=7;rr++){const x=cx+cs*(q+rr/2),y=cy+rs*rr;if(x<-R||x>cw+R||y<-R||y>ch+R)continue;g+=`<polygon points="${P(hexPts(R).map(p=>[p[0]+x,p[1]+y]))}" fill="none" stroke="#1c2b33" stroke-width="1"/>`}}
  const order=[4,5,3,'c',0,2,1],seed=S.seed||3,pos=k=>k==='c'?[0,0]:dirXY(k,SQ3*R);
  order.forEach(k=>{const t=k==='c'?S.c:S.n[k];if(!t)return;const[x,y]=pos(k);g+=`<g transform="translate(${n2(cx+x)},${n2(cy+y)})">${terrainHex(R,t,seed*31+(k==='c'?9:k))}</g>`});
  g+=`<g transform="translate(${n2(cx)},${n2(cy)})">${city(R,S.city)}</g>`;
  const vb=o.crop?`${n2(cx-SQ3*R*.85)} ${n2(cy-R*1.45)} ${n2(SQ3*R*1.95)} ${n2(R*2.5)}`:`0 0 ${n2(cw)} ${n2(ch)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n2(cw)}" height="${n2(ch)}" viewBox="${vb}">${g}</svg>`}
function single(R,c,o={}){const w=Math.ceil(SQ3*R)+8,h=Math.ceil(2*R)+Math.ceil(R*(o.tall?.9:.45))+6;const cx=w/2,cy=h-R-4;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g transform="translate(${cx},${cy})">${terrainHex(R,o.t||'PLAINS',o.seed||5)}${city(R,c)}</g></svg>`}
Object.assign(SKINS,{
 egipcios:{name:'Egípcios',tones:[['#f0e6c8','#d4c59d','#b4a47c'],['#e6dbbb','#c8b88e','#a89a74'],['#f6eed4','#dccfa8','#bcad86']],roof:'flat',plinthTop:'#cdbf97',plinthSide:'#8f8260',street:'#ddd0a8',orn:['#3f8f9a','1.5 2.5'],wall:['#d6c89e','#b0a078'],cap:'none',banner:'STRAIGHT',port:{deck:'#d8caa0',post:'#a89a74',style:'papyrus'},
  K:{wA:'#e6dbbb',wB:'#d6c8a2',wC:'#f2ead0',stone:'#d9ccaa',stoneD:'#b0a07a',slate:'#7c8a8c',tile:'#c4ad7a',tileD:'#9a8458',thatch:'#c9b27a',timber:'#7a5e3c',blue:'#3f8f9a'}},
 mesopotamicos:{name:'Mesopotâmicos',tones:[['#cfae88','#a98a64','#85684a'],['#c4a27c','#9a7c58','#7a5f42'],['#d8bc98','#b5966e','#8c704f']],roof:'flat',plinthTop:'#a88a64',plinthSide:'#6a5440',street:'#c2a47c',orn:['#2f6f8f','3 2'],wall:['#b49470','#8c6f4e'],cap:'none',banner:'STRAIGHT',port:{deck:'#8c7452',post:'#6a5440',style:'reed'},
  K:{wA:'#c2a07a',wB:'#a98760',wC:'#d6bc96',stone:'#b89a74',stoneD:'#8c6f4e',slate:'#5a6b78',tile:'#a9825a',tileD:'#7e5e3e',thatch:'#b79c62',timber:'#6c5238',blue:'#2f6f8f'}},
 persas:{name:'Persas',tones:[['#c9c3b2','#9d9784','#7b7664'],['#bdb7a5','#918b79','#706b5a'],['#d3cdbc','#a8a28f','#86806e']],roof:'flat',plinthTop:'#b7ad98',plinthSide:'#7a7360',street:'#cfc7b0',orn:['#c9a54e','1.5 2'],wall:['#a8a290','#827c6a'],cap:'none',banner:'SWALLOWTAIL',port:{deck:'#c4bca4',post:'#827c6a',style:'mole'},
  K:{wA:'#cfc9b6',wB:'#bdb7a3',wC:'#ddd8c6',stone:'#b9b3a1',stoneD:'#8a8472',slate:'#5a6a86',tile:'#a7a08a',tileD:'#7b7562',thatch:'#b0a47c',timber:'#6f573b',blue:'#2f5f8f'}},
 israel:{name:'Israel e Judá',tones:[['#e2d6b2','#c3b48e','#a0916c'],['#d6c9a4','#b4a47e','#948660'],['#ebe0bd','#cfc19a','#aa9c76']],roof:'flat',plinthTop:'#b8aa86',plinthSide:'#7a6f54',street:'#d0c49c',orn:['#a8603f','2 2'],wall:['#cfc29c','#9c8e68'],cap:'none',banner:'STRAIGHT',port:{deck:'#b8aa86',post:'#7a6f54',style:'jetty'},
  K:{wA:'#d8cba8',wB:'#c3b48e',wC:'#e8dec2',stone:'#cfc29c',stoneD:'#9c8e68',slate:'#6a6f70',tile:'#a79470',tileD:'#85755a',thatch:'#b9a572',timber:'#6c5238',blue:'#5f7f8a'}},
 romanos:{name:'Romanos',tones:[['#dcd0b8','#b8aa8e','#948870'],['#d0c4aa','#aa9c80','#877b62'],['#e6dac2','#c3b598','#9d9078']],roof:'lowgable',plinthTop:'#bdb29a',plinthSide:'#7e745e',street:'#d2c6ac',orn:['#a8473a','4 2'],wall:['#b59a78','#8c7358'],cap:'cone',banner:'STRAIGHT',port:{deck:'#c8bea6',post:'#8c8470',style:'mole'},
  K:{wA:'#e0d6bf',wB:'#cfc2a6',wC:'#eee6d2',stone:'#d4cab2',stoneD:'#a89c82',slate:'#7a6a60',tile:'#b0573c',tileD:'#8a4430',thatch:'#b7a46c',timber:'#6f573b',blue:'#6f8f9a'}},
 nordicos:{name:'Nórdicos',tones:[['#8d7a62','#5e4f3d','#43372a'],['#7e6c55','#54463a','#3c3126'],['#9a876e','#685846','#4b3f31']],roof:'thatch',plinthTop:'#6e6350',plinthSide:'#3f362a',street:'#8a7c62',orn:['#8a3f3a','4 2'],wall:['#7a6a52','#54483a'],cap:'none',banner:'SWALLOWTAIL',port:{deck:'#6a4f36',post:'#3a2a1a',style:'longship'},
  K:{wA:'#9a8666',wB:'#7e6c55',wC:'#b0a07e',stone:'#8f8b82',stoneD:'#615e56',slate:'#4a4f54',tile:'#6f7a4a',tileD:'#555e38',thatch:'#6f7a4a',timber:'#4a3626',blue:'#5f7f8a'}},
 india:{name:'Índia Antiga',tones:[['#e0bd98','#c29974','#9c7556'],['#d6b08a','#b88c68','#94704f'],['#eac8a4','#cda580','#a8805f']],roof:'flat',plinthTop:'#c49a72',plinthSide:'#7e5a40',street:'#dcb88e',orn:['#3d5f7a','2 2'],wall:['#c8a07a','#9a7050'],cap:'cone',banner:'PENNANT',port:{deck:'#c8a07a',post:'#9a7050',style:'ghat'},
  K:{wA:'#d9b08a',wB:'#c49a72',wC:'#e6c6a2',stone:'#c8a07a',stoneD:'#9a7050',slate:'#6a5a52',tile:'#a36e4c',tileD:'#7e5238',thatch:'#b79c62',timber:'#6c5238',blue:'#3d5f7a'}}
});
Object.assign(SKINS,{helenicos:SKINS.valgard,chineses:SKINS.kor,incas:SKINS.dravik});
const TL={P:'PLAINS',F:'FOREST',H:'HILLS',M:'MOUNTAINS',C:'COAST',S:'SEA'};
const IC={
 food:'<path d="M12 21V7"/><path d="M12 9c-2.5 0-4-1.6-4-4 2.5 0 4 1.6 4 4zM12 9c2.5 0 4-1.6 4-4-2.5 0-4 1.6-4 4zM12 14c-2.5 0-4-1.6-4-4M12 14c2.5 0 4-1.6 4-4M12 18.5c-2.5 0-4-1.6-4-4M12 18.5c2.5 0 4-1.6 4-4"/>',
 wood:'<rect x="3" y="8" width="18" height="9" rx="3"/><ellipse cx="18" cy="12.5" rx="2" ry="4.5"/><path d="M6 11v3M10 11v3"/>',
 stone:'<path d="M4 17l3-8 5-3 6 4 2 7z"/><path d="M7 9l5 2 6-1M12 11v6"/>',
 metal:'<path d="M3 17l3-8h12l3 8z"/><path d="M8 13h8"/>',
 wealth:'<circle cx="12" cy="12" r="8"/><path d="M9 12h6M12 8v8"/>',
 knowledge:'<path d="M6 4h11a2 2 0 0 1 2 2v12H8a2 2 0 0 1-2-2z"/><path d="M6 18a2 2 0 0 0 2 2h11"/><path d="M10 8h6M10 12h6"/>',
 influence:'<path d="M12 3l7 4v6c0 4-3 6.5-7 8-4-1.5-7-4-7-8V7z"/><path d="M9 12l2 2 4-4"/>',
 culture:'<path d="M3 9l9-5 9 5z"/><path d="M5 9v9M9 9v9M15 9v9M19 9v9M3 20h18"/>',
 prestige:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 move:'<path d="M4 12h14M14 7l5 5-5 5"/>',
 command:'<path d="M6 17l6-6 6 6M6 11l6-6 6 6"/>',
 mood:'<circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
 cohesion:'<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
 strength:'<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M12 8v8M8 12h8"/>',
 treaty:'<path d="M5 4h9l5 5v11H5z"/><path d="M14 4v5h5"/><circle cx="12" cy="15" r="2.4"/>',
 supply:'<path d="M12 3l7 4v8l-7 4-7-4V7z"/><path d="M12 8v8M9 13l3 3 3-3"/>',
 anchor:'<circle cx="12" cy="5" r="2"/><path d="M12 7v13M6 14c0 4 3 6 6 6s6-2 6-6M4 13l2 2 2-2M16 13l2 2 2-2M8 10h8"/>',
 ship:'<path d="M3 15h18l-3 5H6z"/><path d="M12 15V4l6 8h-6"/>',
 compass:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5L13 13l-4.5 2.5L11 11z"/>',
 danger:'<path d="M12 3l9 17H3z"/><path d="M12 10v5M12 17.5v.5"/>',
 camp:'<path d="M3 20l9-15 9 15zM12 5v15M9 20l3-6 3 6"/>',
 road:'<path d="M8 3l-3 18M16 3l3 18M12 4v3M12 11v3M12 18v2"/>',
 hex:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/>'
};
const ico=(n,s=16,c='#b8914d')=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${IC[n]||''}</svg>`;
const MK={
 ruin:()=>`<ellipse cx="0" cy="2" rx="17" ry="6" fill="#8a8470"/><polygon points="${P([[-14,2],[-8,-3],[10,-3],[16,2],[8,6],[-8,6]])}" fill="#a29b86" ${OL}/>`+
   box(-9,4.4,9,K.stoneD)+`<polygon points="${P([[-11.2,-9],[-6.8,-9],[-7.6,-12],[-9,-10.4],[-10.2,-13]])}" fill="#b9b3a3" ${OL}/>`+
   box(-1,4.4,15,K.stone)+box(-1,6.4,2,K.stoneD,15)+
   box(7,4.4,6,K.stoneD)+`<ellipse cx="14" cy="3" rx="4.4" ry="2" fill="#c3bcab" ${OL}/><circle cx="3" cy="6" r="3" fill="#b9b3a3" ${OL}/><path d="M-12,2 q2,-3 4,0 M5,3 q2,-3 4,0" stroke="#6f8658" stroke-width="2" fill="none"/>`,
 deposit:()=>`<polygon points="${P([[-16,3],[-12,-8],[-5,-14],[2,-9],[10,-12],[15,-4],[17,3]])}" fill="#7e7a72" ${OL}/><polygon points="${P([[-12,-8],[-5,-14],[2,-9],[-2,-2],[-9,0]])}" fill="#a7a298" ${OL}/><polygon points="${P([[2,-9],[10,-12],[15,-4],[8,-2],[0,-3]])}" fill="#8e8a82" ${OL}/>`+
   `<path d="M-8,-4 l5,-6 M0,-2 l7,-7 M6,0 l5,-5" stroke="#b8914d" stroke-width="2" stroke-linecap="round"/><polygon points="${P([[-6,1],[-3,-4],[0,1]])}" fill="#86b3a1" ${OL}/><polygon points="${P([[5,1],[8,-5],[11,1]])}" fill="#86b3a1" ${OL}/><ellipse cx="13" cy="4" rx="5" ry="1.8" fill="#6a665f" opacity=".6"/>`,
 passage:()=>`<polygon points="${P([[-18,4],[-15,-12],[-8,-16],[-6,-4],[-9,4]])}" fill="#7e7a72" ${OL}/><polygon points="${P([[18,4],[15,-12],[8,-16],[6,-4],[9,4]])}" fill="#8e8a82" ${OL}/><polygon points="${P([[-15,-12],[-8,-16],[-10,-10]])}" fill="#b4afa5"/><polygon points="${P([[15,-12],[8,-16],[10,-10]])}" fill="#c4bfb5"/>`+
   `<polygon points="${P([[-9,4],[-6,-4],[6,-4],[9,4]])}" fill="#d2c39a" ${OL}/><path d="M-5,0 h10 M-4,-2 h8" stroke="#a89a72" stroke-width="1"/><path d="M-6,-4 C-3,-9 3,-9 6,-4" stroke="#9a9488" stroke-width="2" fill="none"/>`,
 anchorage:()=>`<path d="M-18,2 C-14,-12 14,-12 18,2 C10,-2 -10,-2 -18,2 Z" fill="#2d5f7c" ${OL}/><path d="M-14,-2 q3,-2 6,0 M0,-6 q3,-2 6,0 M6,-1 q3,-2 6,0" stroke="#7db4cd" stroke-width="1" fill="none"/>`+
   `<rect x="-6" y="-2" width="14" height="2.6" fill="#9a7d52" ${OL}/><rect x="-6" y="-5" width="1.6" height="4" fill="#3a2a18"/><rect x="6" y="-5" width="1.6" height="4" fill="#3a2a18"/><path d="M-16,4 C-8,2 8,2 16,5" stroke="#bfae78" stroke-width="4" fill="none"/><path d="M10,-3 q4,3 8,0 l-2,3 h-4 z" fill="#6f573b" ${OL}/>`,
 camp:()=>`<ellipse cx="0" cy="3" rx="19" ry="6" fill="#7a6a4a" opacity=".7"/>`+[[-10,2,9,'#6a3a30'],[10,2,8,'#5a4632']].map(([x,y,w,c])=>`<polygon points="${P([[x-w,y],[x,y-w*1.4],[x+w,y]])}" fill="${c}" ${OL}/><polygon points="${P([[x-2,y],[x,y-w*.7],[x+2,y]])}" fill="#241f1a"/>`).join('')+
   `<polygon points="${P([[-3,4],[0,-4],[3,4]])}" fill="#5a3a2a" ${OL}/><circle cx="0" cy="3" r="2.6" fill="#c9783a"/><circle cx="0" cy="2" r="1.4" fill="#ffd36a"/>`+Array.from({length:9},(_,i)=>`<path d="M${-16+i*4},6 l1.2,-6" stroke="#4a3626" stroke-width="1.6" stroke-linecap="round"/>`).join('')+`<line x1="15" y1="3" x2="15" y2="-14" stroke="#2a2118" stroke-width="1.2"/><polygon points="${P([[15,-14],[21,-12],[15,-8]])}" fill="#7a2f2a"/>`,
 danger:()=>`<ellipse cx="0" cy="2" rx="17" ry="6" fill="none" stroke="#a8473a" stroke-width="1.4" stroke-dasharray="3 3"/><path d="M-8,4 C-6,-6 6,-4 4,-12 C12,-6 8,2 2,4 C-2,6 -6,8 -8,4Z" fill="#241f1a" opacity=".5"/><path d="M-4,-2 l3,-6 M3,0 l4,-5" stroke="#a8473a" stroke-width="1.4" opacity=".7"/>`
};
function markerHex(kind,t,R,seed){const u=R/28;return `<svg viewBox="${-R*1.05} ${-R*1.25} ${R*2.1} ${R*2.4}" width="${n2(R*2.1)}" height="${n2(R*2.4)}" xmlns="http://www.w3.org/2000/svg">${terrainHex(R,t,seed)}<g transform="translate(0,${n2(R*.12)}) scale(${n2(u)})">${MK[kind]()}</g></svg>`}

/* ---- region pieces: closed / lifted / edge-on / revealed ---- */
const FP=R=>[[0,0],[SQ3*R,0],[SQ3*R/2,-1.5*R],[-SQ3*R/2,-1.5*R],[-SQ3*R,0],[-SQ3*R/2,1.5*R],[SQ3*R/2,1.5*R]];
const hexAt=(R,x,y,fill,stroke,sw,extra='')=>`<polygon points="${P(hexPts(R).map(p=>[p[0]+x,p[1]+y]))}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
function regionBack(R,glow){const pos=FP(R),th=R*.16;let g='';
  pos.forEach(([x,y])=>g+=hexAt(R,x,y+th,'#0d1316','#070a0c',1));
  pos.forEach(([x,y])=>g+=hexAt(R*.97,x,y,'#2a363d',glow?'#d1a95a':'#5a6a72',Math.max(1.2,R*(glow?.06:.03))));
  g+=`<g opacity=".65" stroke="#8a9aa2" fill="none" stroke-width="${n2(R*.035)}"><circle r="${n2(R*.52)}"/><path d="M0,${-R*.86} L${R*.15},${-R*.15} L${R*.86},0 L${R*.15},${R*.15} L0,${R*.86} L${-R*.15},${R*.15} L${-R*.86},0 L${-R*.15},${-R*.15} Z"/></g>`;
  pos.slice(1).forEach(([x,y])=>g+=`<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(R*.13)}" fill="none" stroke="#6a7a82" stroke-width="${n2(R*.03)}"/>`);
  return g}
function regionFront(R,letters,seed){const pos=FP(R),th=R*.12;let g='';
  pos.forEach(([x,y])=>g+=hexAt(R,x,y+th,'#1a1410','#0a0806',1));
  pos.forEach(([x,y],i)=>g+=`<g transform="translate(${n2(x)},${n2(y)})">${terrainHex(R*.985,TL[letters[i]],seed+i)}</g>`);return g}
function pioneerPiece(R,col){const u=R/40;return `<g transform="scale(${n2(u)})"><ellipse cx="0" cy="12" rx="11" ry="4" fill="#0007"/><ellipse cx="0" cy="9" rx="10" ry="3.6" fill="#8a8470" ${OL}/><path d="M-6,9 L-4,-6 Q0,-9 4,-6 L6,9 Z" fill="${col}" ${OL}/><circle cx="0" cy="-11" r="5" fill="#d0a37c" ${OL}/><path d="M-6,-12 Q0,-20 6,-12 Z" fill="#6f573b" ${OL}/><path d="M7,-2 L12,-20" stroke="#6f573b" stroke-width="1.6"/></g>`}
const svgW=(w,h,inner,vb)=>`<svg viewBox="${vb||`0 0 ${w} ${h}`}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

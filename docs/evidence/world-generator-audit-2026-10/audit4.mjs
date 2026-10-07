const root=process.cwd()+'/';
const E=await import(root+'packages/game-engine/dist/index.js');
const D=await import(root+'packages/game-domain/dist/index.js');
const res={};
for(const pre of ['MIXED','CONTINENTAL','ARCHIPELAGO','INLAND_SEA'])for(const np of [2,4,6]){
  let seeds=0,homeNoMetal=0,homes=0,noMetal2=0,totalMetal=0,homeSeaShare=[],landHomeHex=[];
  for(let seed=1;seed<=40;seed++){
    const players=Array.from({length:np},(_,i)=>({id:'p'+(i+1),name:'P'+(i+1)}));
    const st=E.createAlphaGame({gameId:'g'+seed,seed,players,preset:'STANDARD',worldPreset:pre});
    const board=D.layoutBoard(np,seed);const map=new Map(st.core.map.map(t=>[t.id,t]));
    totalMetal+=st.core.map.filter(t=>t.features.includes('METAL')).length;seeds++;
    for(let k=0;k<np;k++){
      const hid=board.homeSlots[k];homes++;
      const dist=D.regionDistances(board.cells,hid);
      const reg=st.regions.find(r=>r.id===hid);
      const own=reg.hexIds.filter(h=>map.get(h).features.includes('METAL')).length;
      if(own===0)homeNoMetal++;
      const within=st.regions.filter(r=>dist.get(r.id)<=2).flatMap(r=>r.hexIds).filter(h=>map.get(h).features.includes('METAL')).length;
      if(within===0)noMetal2++;
      landHomeHex.push(reg.hexIds.filter(h=>map.get(h).terrain!=='SEA').length);
    }
  }
  res[`${pre}/${np}p`]={metalPerMap:Math.round(totalMetal/seeds*10)/10,homesNoMetalOwnPct:Math.round(homeNoMetal/homes*1000)/10,homesNoMetalWithin2Pct:Math.round(noMetal2/homes*1000)/10,landHexInHome:Math.round(landHomeHex.reduce((a,b)=>a+b,0)/landHomeHex.length*10)/10};
}
console.log(JSON.stringify(res,null,1));

const root=process.cwd()+'/';
const E=await import(root+'packages/game-engine/dist/index.js');
const LAND=new Set(['PLAINS','FOREST','HILLS','MOUNTAINS','COAST']);
const nb=(q,r)=>[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]].map(([a,b])=>`${q+a},${r+b}`);
for(const pre of ['MIXED','ARCHIPELAGO','INLAND_SEA']){
 const h=[0,0,0,0,0,0,0];let adjH={};
 for(let seed=1;seed<=40;seed++){
  const st=E.createAlphaGame({gameId:'g'+seed,seed,players:[1,2,3,4].map(i=>({id:'p'+i,name:'P'+i})),preset:'STANDARD',worldPreset:pre});
  const map=new Map(st.core.map.map(t=>[t.id,t]));const rof=new Map();st.regions.forEach(r=>r.hexIds.forEach(x=>rof.set(x,r.id)));
  for(const region of st.regions){ if(/^homeland/.test(region.templateId))continue;
    const approach=new Set();for(const x of region.hexIds){const [q,r]=x.split(',').map(Number);for(const y of nb(q,r)){const u=map.get(y);if(u&&rof.get(y)!==region.id&&u.terrain!=='SEA')approach.add(y)}}
    for(const P of approach){const [pq,pr]=P.split(',').map(Number);const adj=new Set(nb(pq,pr));
      let v=0;for(let k=0;k<6;k++){const tiles=E.rotatedRegionTiles(st,region,k);if(region.hexIds.some((x,i)=>adj.has(x)&&LAND.has(tiles[i].terrain)))v++}
      h[v]++;const a=region.hexIds.filter(x=>adj.has(x)).length;adjH[a]=(adjH[a]||0)+1}}
 }
 const tot=h.reduce((a,b)=>a+b,0);console.log(pre,h.map(x=>Math.round(x/tot*1000)/10),'adjacent-hex-count',JSON.stringify(adjH));
}

const root=process.cwd()+'/';
const E=await import(root+'packages/game-engine/dist/index.js');
const D=await import(root+'packages/game-domain/dist/index.js');
const LAND=new Set(['PLAINS','FOREST','HILLS','MOUNTAINS','COAST']);
const nb=(q,r)=>[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]].map(([a,b])=>`${q+a},${r+b}`);
const presets=['MIXED','CONTINENTAL','ARCHIPELAGO','INLAND_SEA'];
const seeds=Array.from({length:40},(_,i)=>i+1);
const out={};
for(const pre of presets)for(const np of [2,4,6]){
  const agg={seaHex:[],seaComp:[],maxSea:[],fakeCoast:[],landComp:[],zero:0,one:0,two:0,threeUp:0,pairs:0,regUnreach:0,regs:0,metalMiss:0,overridden:[]};
  for(const seed of seeds){
    const players=Array.from({length:np},(_,i)=>({id:'p'+(i+1),name:'P'+(i+1)}));
    const st=E.createAlphaGame({gameId:'g'+seed,seed,players,preset:'STANDARD',worldPreset:pre});
    const map=new Map(st.core.map.map(t=>[t.id,t]));
    const ids=[...map.keys()];
    // sea components
    const seen=new Set();let comps=0,maxc=0;
    for(const id of ids){const t=map.get(id);if(t.terrain!=='SEA'||seen.has(id))continue;comps++;let n=0;const q=[id];seen.add(id);while(q.length){const c=q.pop();n++;const [cq,cr]=c.split(',').map(Number);for(const x of nb(cq,cr)){const u=map.get(x);if(u&&u.terrain==='SEA'&&!seen.has(x)){seen.add(x);q.push(x)}}}maxc=Math.max(maxc,n)}
    agg.seaHex.push(ids.filter(i=>map.get(i).terrain==='SEA').length);agg.seaComp.push(comps);agg.maxSea.push(maxc);
    agg.fakeCoast.push(ids.filter(i=>{const t=map.get(i);if(t.terrain!=='COAST')return false;const [q,r]=i.split(',').map(Number);return !nb(q,r).some(x=>map.get(x)?.terrain==='SEA')}).length);
    // land components
    const ls=new Set();let lc=0;for(const id of ids){if(map.get(id).terrain==='SEA'||ls.has(id))continue;lc++;const q=[id];ls.add(id);while(q.length){const c=q.pop();const [cq,cr]=c.split(',').map(Number);for(const x of nb(cq,cr)){const u=map.get(x);if(u&&u.terrain!=='SEA'&&!ls.has(x)){ls.add(x);q.push(x)}}}}
    agg.landComp.push(lc);
    // entry validity per approach
    const regionOf=new Map();st.regions.forEach(r=>r.hexIds.forEach(h=>regionOf.set(h,r.id)));
    for(const region of st.regions){
      if(/^homeland/.test(region.templateId))continue;
      agg.regs++;let anyOk=false;
      const approach=new Set();
      for(const h of region.hexIds){const [q,r]=h.split(',').map(Number);for(const x of nb(q,r)){const u=map.get(x);if(u&&regionOf.get(x)!==region.id&&u.terrain!=='SEA')approach.add(x)}}
      for(const P of approach){
        let valid=0;
        for(let k=0;k<6;k++){const tiles=E.rotatedRegionTiles(st,region,k);
          const [pq,pr]=P.split(',').map(Number);const adj=new Set(nb(pq,pr));
          const ok=region.hexIds.some((h,i)=>adj.has(h)&&LAND.has(tiles[i].terrain));if(ok)valid++}
        agg.pairs++;if(valid===0)agg.zero++;else if(valid===1)agg.one++;else if(valid===2)agg.two++;else agg.threeUp++;if(valid>0)anyOk=true}
      if(!anyOk)agg.regUnreach++;
    }
  }
  const avg=a=>Math.round(a.reduce((x,y)=>x+y,0)/a.length*10)/10;
  out[`${pre}/${np}p`]={seaHex:avg(agg.seaHex),seaComps:avg(agg.seaComp),maxSea:avg(agg.maxSea),fakeCoast:avg(agg.fakeCoast),landComps:avg(agg.landComp),pairs:agg.pairs/seeds.length,zeroPct:Math.round(agg.zero/agg.pairs*1000)/10,onePct:Math.round(agg.one/agg.pairs*1000)/10,twoPct:Math.round(agg.two/agg.pairs*1000)/10,threePlusPct:Math.round(agg.threeUp/agg.pairs*1000)/10,unreachableRegionsPerMap:Math.round(agg.regUnreach/seeds.length*100)/100};
}
console.log(JSON.stringify(out,null,1));

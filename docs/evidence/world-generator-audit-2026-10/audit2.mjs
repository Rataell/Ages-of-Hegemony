const root=process.cwd()+'/';
let D;
const CELL_STEP=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
const FLOWER=[[0,0],[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
const centerOf=(i,j)=>({q:2*i-j,r:i+3*j});
const pixel=({q,r})=>({x:Math.sqrt(3)*(q+r/2),y:1.5*r});
const hd=(a,b)=>{const dq=a.q-b.q,dr=a.r-b.r;return Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr))};
function layout(N){
  const R=8,cand=[];for(let i=-R;i<=R;i++)for(let j=-R;j<=R;j++){const p=pixel(centerOf(i,j));cand.push({i,j,d:Math.hypot(p.x,p.y)})}
  const chosen=cand.sort((a,b)=>a.d-b.d||a.i-b.i||a.j-b.j).slice(0,N).sort((a,b)=>a.i-b.i||a.j-b.j);
  const key=(i,j)=>`${i}_${j}`;const ids=new Map(chosen.map((c,k)=>[key(c.i,c.j),`region-${k+1}`]));
  return chosen.map(({i,j})=>{const center=centerOf(i,j);return {id:ids.get(key(i,j)),i,j,center,hexes:FLOWER.map(([a,b])=>({q:center.q+a,r:center.r+b})),neighbors:CELL_STEP.map(([a,b])=>ids.get(key(i+a,j+b))).filter(Boolean)}});
}
const rows=[];
for(const N of [14,16,19,22,24,27,30,33,37,42,48,54]){
  D=await import(root+'packages/game-domain/dist/alpha-topology.js?n='+N);
  const cells=layout(N);
  const elig=cells.filter(c=>c.neighbors.length>=5).length;
  for(const p of [2,3,4,5,6]){
    try{
      const homes=D.chooseHomelands(cells,p,1).slice(0,p);
      const byId=new Map(cells.map(c=>[c.id,c]));
      const dist=D.regionDistances(cells,homes[0]);
      let dmin=1e9,dsum=0,n=0,hmin=1e9;
      const nearest=homes.map(a=>{const da=D.regionDistances(cells,a);let m=1e9;for(const b of homes){if(a===b)continue;m=Math.min(m,da.get(b))}return m});
      for(let a=0;a<homes.length;a++)for(let b=a+1;b<homes.length;b++){const da=D.regionDistances(cells,homes[a]).get(homes[b]);dmin=Math.min(dmin,da);dsum+=da;n++;hmin=Math.min(hmin,hd(byId.get(homes[a]).center,byId.get(homes[b]).center))}
      // share by nearest homeland
      const share=new Map(homes.map(h=>[h,0]));for(const c of cells){const ds=homes.map(h=>D.regionDistances(cells,h).get(c.id));const m=Math.min(...ds);const t=homes.filter((h,k)=>ds[k]===m);t.forEach(h=>share.set(h,share.get(h)+1/t.length))}
      const sh=[...share.values()];
      const frontierPerSeat=(N-6)/p;
      rows.push({N,hexes:7*N,elig,p,dmin,dmean:Math.round(dsum/n*10)/10,hexMin:hmin,shareGap:Math.round((Math.max(...sh)-Math.min(...sh))*10)/10,regionsPerSeat:Math.round(N/p*10)/10,frontierPerSeat:Math.round(frontierPerSeat*10)/10});
    }catch(e){rows.push({N,p,err:String(e.message).slice(0,60)})}
  }
}
console.log(JSON.stringify(rows));

// DEV-ONLY real-browser playtest lab. It only drives the public local UI and refuses non-local origins.
// Usage: npm run alpha:lab -- --players=4 --rounds=3 --actions=7
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args=new Map(process.argv.slice(2).map(value=>{const [key,entry]=value.replace(/^--/,'').split('=');return [key,entry??true];}));
const players=Number(args.get('players')??4),rounds=Number(args.get('rounds')??3),actions=Number(args.get('actions')??7);
const directedContact=args.has('contact');
const headless=!args.has('headed'),port=Number(process.env.ALPHA_LOCAL_PORT??3001),base=`http://127.0.0.1:${port}`;
const output=resolve(String(args.get('output')??'test-results/alpha-lab'));
const stop=(message)=>{throw new Error(message);};
if(!Number.isInteger(players)||players<2||players>6)stop('--players precisa estar entre 2 e 6.');
if(!Number.isInteger(rounds)||rounds<1||rounds>20)stop('--rounds precisa estar entre 1 e 20.');
if(!Number.isInteger(actions)||actions<5||actions>10)stop('--actions precisa estar entre 5 e 10.');
if(new URL(base).hostname!=='127.0.0.1')stop('Alpha Lab só aceita servidor local.');
await mkdir(output,{recursive:true});
const health=await fetch(`${base}/api/alpha/health`,{signal:AbortSignal.timeout(4000)}).catch(()=>null);
if(!health?.ok)stop(`Servidor local indisponível em ${base}. Rode npm run dev:alpha.`);

const browser=await chromium.launch({headless});
const seats=[];const errors=[];const warnings=[];const startedAt=new Date().toISOString();
const snapshot=async(label)=>Promise.all(seats.map(({page},index)=>page.screenshot({path:resolve(output,`${label}-p${index+1}.png`),caret:'initial'})));
const phaseText=page=>page.locator('.alpha-round-bar').innerText();
const waitPhase=async(pattern)=>Promise.all(seats.map(({page})=>page.locator('.alpha-round-bar').filter({hasText:pattern}).waitFor({timeout:20000})));
const waitRound=async round=>Promise.all(seats.map(({page})=>page.locator('.round-label').filter({hasText:`Rodada ${round} /`}).waitFor({timeout:20000})));
const distance=(a,b)=>(Math.abs(a.q-b.q)+Math.abs(a.q+a.r-b.q-b.r)+Math.abs(a.r-b.r))/2;
const regionCells=tile=>{const center={q:Math.round(tile.q/3)*3,r:Math.round(tile.r/3)*3};return [center,{q:center.q+1,r:center.r},{q:center.q+1,r:center.r-1},{q:center.q,r:center.r-1},{q:center.q-1,r:center.r},{q:center.q-1,r:center.r+1},{q:center.q,r:center.r+1}];};
const readRoom=page=>page.evaluate(async()=>await (await fetch(`/api/alpha?gameId=${encodeURIComponent(new URL(globalThis.location.href).searchParams.get('game'))}`,{cache:'no-store'})).json());
const sendCommand=(page,command)=>page.evaluate(async command=>{
  const gameId=new URL(globalThis.location.href).searchParams.get('game');
  const current=await (await fetch(`/api/alpha?gameId=${encodeURIComponent(gameId)}`,{cache:'no-store'})).json();
  if(!current.ok)return current;
  return await (await fetch('/api/alpha',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'command',gameId,payload:{...command,expectedVersion:current.value.game.version}})})).json();
},command);
const contactTrace=[];
async function planTowardContact(round){
  const replies=await Promise.all(seats.map(({page})=>readRoom(page)));
  const games=replies.map(reply=>reply.ok?reply.value.game:null);
  const capitals=games.map((game,seatIndex)=>{const city=game?.view.player.civilization.cities[0];const tile=game?.view.visibleTerritory.find(candidate=>candidate.id===city?.hexId);return city&&tile?{playerId:game.self.playerId,seatIndex,...tile}:null;}).filter(Boolean);
  const occupied=games.flatMap(game=>game?.units.filter(unit=>unit.ownerId===game.self.playerId).map(unit=>({playerId:game.self.playerId,hexId:unit.hexId}))??[]);
  const corridorEdges=[];
  for(let i=1;i<capitals.length;i++){const first=capitals[i],second=capitals.slice(0,i).sort((a,b)=>distance(first,a)-distance(first,b)||a.q-b.q||a.r-b.r)[0];corridorEdges.push({first,second});}
  let matching=[];
  for(let mask=0;mask<2**corridorEdges.length;mask++){
    const selected=corridorEdges.filter((_,edge)=>mask&(1<<edge)),used=new Set(selected.flatMap(pair=>[pair.first.seatIndex,pair.second.seatIndex]));
    if(used.size===selected.length*2&&selected.length>matching.length)matching=selected;
  }
  const directedTargets=new Map(matching.flatMap(pair=>[[pair.first.seatIndex,pair.second],[pair.second.seatIndex,pair.first]]));
  for(const [index,{page,label}] of seats.entries()){
    const game=games[index];if(!game)continue;
    if(game.self.contacts.length>0)continue;
    const unit=game.units.find(candidate=>candidate.ownerId===game.self.playerId&&(candidate.kind==='PIONEER'||candidate.kind==='EXPLORER'));if(!unit)continue;
    const visible=game.view.visibleTerritory,tiles=[...visible,...game.knownTerritory,...game.frontier];
    const byId=new Map(tiles.map(tile=>[tile.id,tile])),origin=byId.get(unit.hexId);if(!origin)continue;
    const target=directedTargets.get(index);if(!target||game.self.contacts.includes(target.playerId))continue;
    const frontier=game.frontier.filter(tile=>regionCells(tile).some(point=>distance(origin,point)<=1)).sort((a,b)=>distance(a,target)-distance(b,target));
    let command=frontier[0]?{type:'QUEUE_ORDER',order:{id:`lab-explore-${round}-${index}`,type:'EXPLORE',unitId:unit.id,target:frontier[0].id,rotation:0}}:null;
    if(!command){
      const blocked=new Set([...capitals.filter(capital=>capital.playerId!==game.self.playerId).map(capital=>capital.id),...occupied.filter(candidate=>candidate.playerId!==game.self.playerId).map(candidate=>candidate.hexId)]);
      const known=[...new Map([...visible,...game.knownTerritory].map(tile=>[tile.id,tile])).values()].filter(tile=>!blocked.has(tile.id)&&!['SEA','UNKNOWN'].includes(tile.terrain)&&(!tile.ownerId||tile.ownerId===game.self.playerId));
      const max=game.rules.units[unit.kind].movement,best=new Map([[origin.id,{tile:origin,path:[],cost:0}]]),queue=[best.get(origin.id)];
      while(queue.length){const node=queue.shift();for(const tile of known){if(distance(node.tile,tile)!==1)continue;const cost=node.cost+game.rules.movementCosts[tile.terrain];if(cost>max||cost>=(best.get(tile.id)?.cost??Infinity))continue;const next={tile,path:[...node.path,tile.id],cost};best.set(tile.id,next);queue.push(next);}}
      const destination=[...best.values()].filter(node=>node.path.length&&distance(node.tile,target)<distance(origin,target)).sort((a,b)=>distance(a.tile,target)-distance(b.tile,target)||b.cost-a.cost)[0];
      if(destination)command={type:'QUEUE_ORDER',order:{id:`lab-move-${round}-${index}`,type:'MOVE',unitIds:[unit.id],path:destination.path}};
    }
    if(command){const reply=await sendCommand(page,command);if(!reply.ok)errors.push({player:label,type:'contact-action',message:reply.error?.message??'Ação dirigida recusada.'});}
  }
}
async function recordContacts(round){
  const replies=await Promise.all(seats.map(({page})=>readRoom(page)));
  const pairs=new Set();
  for(const reply of replies)if(reply.ok)for(const contact of reply.value.game.self.contacts)pairs.add([reply.value.game.self.playerId,contact].sort().join(':'));
  contactTrace.push({round,pairs:[...pairs]});return pairs.size;
}
let roomCode='';
try{
  for(let index=0;index<players;index++){
    const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
    page.setDefaultTimeout(20000);const label=`Jogador ${index+1}`;
    page.on('pageerror',error=>errors.push({player:label,type:'pageerror',message:error.message}));
    page.on('console',message=>{if(message.type()==='error'&&!message.text().startsWith('Failed to load resource:'))errors.push({player:label,type:'console',message:message.text()});});
    page.on('response',response=>{if(response.status()===409)warnings.push({player:label,type:'http',message:`409 ${response.url()}`});else if(response.status()>=400)errors.push({player:label,type:'http',message:`${response.status()} ${response.url()}`});});
    page.on('requestfailed',request=>errors.push({player:label,type:'requestfailed',message:`${request.method()} ${request.url()} ${request.failure()?.errorText??''}`}));
    seats.push({context,page,label});
  }
  await Promise.all(seats.map(async({page,label})=>{await page.goto(`${base}/alpha`);await page.getByLabel('Seu nome',{exact:true}).fill(label);}));
  const host=seats[0].page;
  await host.getByLabel('Lugares',{exact:false}).selectOption(String(players));
  await host.locator('.alpha-entry-forms form').first().locator('select').nth(2).selectOption(String(actions));
  await host.getByRole('button',{name:'Criar partida',exact:true}).click();
  await host.getByRole('heading',{name:'Seu tabuleiro de civilização'}).waitFor();
  roomCode=(await host.locator('.alpha-lobby-heading code').innerText()).trim();
  for(const seat of seats.slice(1)){
    await seat.page.goto(`${base}/alpha?join=${roomCode}`);await seat.page.getByLabel('Seu nome',{exact:true}).fill(seat.label);
    await seat.page.getByRole('button',{name:'Entrar na partida',exact:true}).click();
    await seat.page.getByRole('heading',{name:'Seu tabuleiro de civilização'}).waitFor();
  }
  await snapshot('01-lobby');
  for(const [index,{page}] of seats.entries()){
    await page.locator('.alpha-civilizations button').nth(index).click();
    await page.getByRole('button',{name:'Estou pronto',exact:true}).click();
  }
  await host.getByRole('button',{name:'Iniciar partida',exact:true}).click();
  await waitPhase('Planejamento');
  for(const {page} of seats){
    await page.getByRole('button',{name:'Cartas & Projetos',exact:true}).click();
    const card=page.locator('.alpha-card').filter({has:page.getByRole('heading',{name:'Escolha duas ambições secretas'})});
    const choices=card.getByRole('checkbox');await choices.nth(0).check();await choices.nth(1).check();
    await card.getByRole('button',{name:'Confirmar duas ambições',exact:true}).click();
    await page.getByRole('button',{name:'Mundo',exact:true}).click();
  }
  await snapshot('02-inicio');
  for(let round=1;round<=rounds;round++){
    for(const {page} of seats){
      const produce=page.getByRole('button',{name:'Escolher produzir',exact:true});await produce.click();
      await page.locator('.alpha-urban-detail').getByRole('button',{name:'Planejar ação urbana',exact:true}).click();
      await page.locator('.alpha-round-bar').filter({hasText:'Ações planejadas 1 /'}).waitFor();
    }
    if(directedContact)await planTowardContact(round);
    await snapshot(`round-${round}-planned`);
    for(const [index,{page}] of seats.entries()){
      await page.getByRole('button',{name:'Confirmar planejamento',exact:true}).click();
      if(index<seats.length-1)await page.getByRole('button',{name:'Aguardando outras pessoas',exact:true}).waitFor();
    }
    const advanced=await Promise.race([
      waitRound(round+1).then(()=>true),
      Promise.all(seats.map(({page})=>page.locator('.alpha-finale').waitFor({timeout:20000}))).then(()=>false),
    ]);
    await snapshot(`round-${round}-end`);
    if(directedContact)await recordContacts(round);
    if(!advanced)break;
  }
  if(directedContact){const minimum=players===2?1:players===4?2:Math.ceil(players/2);const found=contactTrace.at(-1)?.pairs.length??0;if(found<minimum)errors.push({player:'lab',type:'contact',message:`Contato insuficiente: ${found} par(es), mínimo ${minimum}.`});}
  const states=await Promise.all(seats.map(async({page,label})=>({player:label,url:page.url(),roundBar:await phaseText(page),errors:errors.filter(error=>error.player===label)})));
  await writeFile(resolve(output,'report.json'),JSON.stringify({startedAt,finishedAt:new Date().toISOString(),base,roomCode,players,rounds,actions,directedContact,contactTrace,states,errors,warnings},null,2));
  console.log(`Alpha Lab concluído: ${players} jogadores, ${rounds} rodada(s), ${errors.length} erro(s), ${warnings.length} aviso(s). Relatório: ${resolve(output,'report.json')}`);
  if(errors.length)process.exitCode=1;
}catch(error){
  errors.push({player:'lab',type:'fatal',message:error instanceof Error?error.message:String(error)});
  await writeFile(resolve(output,'report.json'),JSON.stringify({startedAt,finishedAt:new Date().toISOString(),base,roomCode,players,rounds,actions,errors,warnings},null,2));
  throw error;
}finally{
  await Promise.allSettled(seats.map(seat=>seat.context.close()));await browser.close();
}

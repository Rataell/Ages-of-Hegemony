import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { hexDistance, visibleHexIds } from '@aoh/game-engine';
import { connectAlphaContext } from './alpha-fixture.js';

// Browser integration uses the real HTTP/service/engine code with the explicit test repository.
// PostgreSQL durability and deployed-network E2E remain separate mandatory release gates.
test('alpha: two browser identities, lobby, management, privacy, round and reconnect',async({browser})=>{
  const origin='http://127.0.0.1:3107',repository=new InMemoryAlphaRepository(),service=new AlphaGameService(repository);
  const http=new AlphaHttp(service,new GuestSessions('browser-test-secret-'.repeat(4)),origin,false);
  const a=await browser.newContext({viewport:{width:1440,height:900}}),b=await browser.newContext({viewport:{width:1440,height:900}});
  await connectAlphaContext(a,http);await connectAlphaContext(b,http);const pa=await a.newPage(),pb=await b.newPage();
  pa.setDefaultTimeout(15000);pb.setDefaultTimeout(15000);
  for(const context of [a,b])await context.addInitScript(()=>{
    const w=window as unknown as {__alphaErrors:string[]};w.__alphaErrors=[];
    new MutationObserver(()=>{document.querySelectorAll('.alpha-error').forEach(node=>{const text=node.textContent??'';if(text&&!w.__alphaErrors.includes(text))w.__alphaErrors.push(text);});}).observe(document,{childList:true,subtree:true,characterData:true});
  });
  const errors:string[]=[];pa.on('pageerror',e=>errors.push(e.message));pb.on('pageerror',e=>errors.push(e.message));
  const evidence='docs/evidence/playable-alpha-v1',actionEvidence='docs/evidence/alpha-round-action-economy';await Promise.all([mkdir(evidence,{recursive:true}),mkdir(actionEvidence,{recursive:true})]);
  try{
    await pa.goto('/alpha');await pa.getByLabel('Seu nome',{exact:true}).fill('Ana');await pa.getByRole('combobox',{name:'Tema',exact:true}).selectOption('DARK');await pa.screenshot({path:`${evidence}/1440-home.png`,caret:'initial'});
    await expect(pa.getByLabel('Ações por rodada')).toHaveValue('7');
    for(const [width,height] of [[1366,768],[1440,900],[1920,1080]] as const){await pa.setViewportSize({width,height});await pa.screenshot({path:`${actionEvidence}/${width}x${height}-create.png`,caret:'initial'});expect(await pa.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
    await pa.setViewportSize({width:1440,height:900});
    await pa.getByLabel('Seu nome',{exact:true}).fill('Ana');await pa.getByRole('button',{name:'Criar partida',exact:true}).click();
    await expect(pa.getByRole('heading',{name:'Seu tabuleiro de civilização'})).toBeVisible();
    const code=await pa.locator('.alpha-lobby-heading code').innerText();
    await pb.goto(`/alpha?join=${code}`);await pb.getByLabel('Seu nome',{exact:true}).fill('Beto');await pb.getByRole('button',{name:'Entrar na partida',exact:true}).click();
    await expect(pb.getByRole('heading',{name:'Seu tabuleiro de civilização'})).toBeVisible();
    await expect(pa.locator('.alpha-seats').getByRole('heading',{name:'Beto',exact:true})).toBeVisible();
    await pa.getByRole('button').filter({has:pa.getByRole('heading',{name:'Aurélia',exact:true})}).click();
    await pa.getByRole('button',{name:'Estou pronto',exact:true}).click();
    await expect(pb.locator('.alpha-seats article').filter({has:pb.getByRole('heading',{name:'Ana',exact:true})})).toContainText('Pronto');
    await pb.getByRole('button').filter({has:pb.getByRole('heading',{name:'Valgard',exact:true})}).click();
    await pb.getByRole('button',{name:'Estou pronto',exact:true}).click();
    await expect(pa.getByRole('button',{name:'Iniciar partida',exact:true})).toBeEnabled();
    await pa.screenshot({path:`${evidence}/1440-lobby.png`});await pa.getByRole('button',{name:'Iniciar partida',exact:true}).click();
    await expect(pa.locator('.alpha-player-board h1')).toHaveText('Aurélia');await expect(pb.locator('.alpha-player-board h1')).toHaveText('Valgard');
    for(const page of [pa,pb]){
      const currentId=new URL(page.url()).searchParams.get('game')!;
      const current=(await repository.find(currentId))!;
      await expect(page.locator('.alpha-about')).toContainText(`Versão ${current.game!.version}`);
      await page.getByRole('button',{name:'Cartas & Projetos',exact:true}).click();
      const choices=page.locator('.alpha-card').filter({has:page.getByRole('heading',{name:'Escolha duas ambições secretas'})}).getByRole('checkbox');
      await choices.nth(0).check();await choices.nth(1).check();await page.getByRole('button',{name:'Confirmar duas ambições',exact:true}).click();
      await expect(page.getByRole('button',{name:'Confirmar duas ambições',exact:true})).toHaveCount(0);
    }
    await pa.screenshot({path:`${evidence}/1440-card-hand.png`});
    await pa.getByRole('button',{name:'Mundo',exact:true}).click();
    const actionCounter=pa.locator('.admin').filter({hasText:'Ações principais'});await expect(actionCounter).toContainText('Ações principais');await expect(actionCounter).toContainText('0 / 7');
    for(const [width,height] of [[1366,768],[1440,900],[1920,1080]] as const){await pa.setViewportSize({width,height});await pa.screenshot({path:`${actionEvidence}/${width}x${height}-counter.png`});expect(await pa.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
    await pa.setViewportSize({width:1440,height:900});
    await expect(pa.locator('.alpha-about')).toContainText(`Versão ${(await repository.find(new URL(pa.url()).searchParams.get('game')!))!.game!.version}`);
    await pa.getByLabel('Produtores',{exact:true}).fill('1');await pa.getByLabel('Artesãos',{exact:true}).fill('1');await pa.getByLabel('Estudiosos',{exact:true}).fill('0');
    await pa.getByRole('button',{name:'Aplicar distribuição'}).click();
    await pa.locator('svg.world-map [role=button]').filter({has:pa.locator('title')}).first().focus();
    const gameId=new URL(pa.url()).searchParams.get('game')!;
    const beforeMap=(await repository.find(gameId))!.game!;
    const capital=beforeMap.core.map.find(tile=>tile.id===beforeMap.core.players[0]!.civilization.cities[0]!.hexId)!;
    const claim=beforeMap.core.map.find(tile=>tile.ownerId===null&&tile.terrain==='PLAINS'&&hexDistance(capital,tile)===1)!;
    await pa.locator(`svg.world-map [role=button][aria-label$="${claim.id}"]`).click();
    await pa.getByRole('button',{name:'Reivindicar para Ana',exact:true}).click();
    await expect(pa.locator('.alpha-inspector')).toContainText('Território de Ana');
    await pa.getByText('Melhorias e estradas',{exact:true}).click();await pa.getByRole('button',{name:'Fazenda',exact:true}).click();
    await expect(pa.locator('.alpha-inspector')).toContainText('Fazenda');
    await pa.screenshot({path:`${evidence}/1440-city.png`});
    const raw=(await repository.find(gameId))!;expect(raw.game!.core.players[0]!.civilization.cities[0]!.workers.artisans).toBe(1);
    const privateB=raw.game!.players[1]!.ambitions;
    const response=await pa.request.get(`/api/alpha?gameId=${gameId}`);
    // APIRequestContext bypasses browser interception and reaches the dev server's own runtime, which knows neither this match nor this caller.
    expect(response.status()).not.toBe(200);expect((await response.json()).ok).toBe(false);
    const projected=await service.read({guestId:raw.seats[0]!.guestId},gameId,Date.now());
    expect(projected.ok).toBe(true);expect(JSON.stringify(projected)).not.toContain(raw.game!.privateRng.seed);
    if(projected.ok)expect(projected.value.game!.self.ambitions.some(id=>privateB.includes(id))).toBe(false);
    await pa.reload();await expect(pa.locator('.alpha-player-board h1')).toHaveText('Aurélia');
    await expect(pa.locator('html')).toHaveAttribute('data-alpha-theme','DARK');
    const phase=async(page:typeof pa,text:string)=>expect(page.locator('.alpha-round-bar')).toContainText(text);
    const game=async()=>(await repository.find(gameId))!.game!;
    const confirm=async(page:typeof pa,label:string)=>page.getByRole('button',{name:label,exact:true}).click();
    async function bothConfirm(label:string,next:string){
      // No reload: a page that is behind recovers by itself (VERSION_CONFLICT -> refresh -> one retry).
      await confirm(pa,label);await expect(pb.locator('.alpha-round-bar')).toContainText('1 / 2 prontos');
      await confirm(pb,label);await phase(pa,next);await phase(pb,next);
    }
    // Round 1 - every strategic decision is private until both players close planning.
    await pa.reload();await expect(pa.locator('.alpha-player-board h1')).toHaveText('Aurélia');
    await pb.getByRole('button',{name:'Mundo',exact:true}).click();
    await phase(pa,'Planejamento');
    const urbanA=pa.locator('.alpha-urban'),urbanB=pb.locator('.alpha-urban');
    await expect(urbanA).toContainText('Ações planejáveis da cidade: 1 / 1');
    // PRODUCE is an explicit planned choice, with cost, effect and remaining actions shown before confirmation.
    await expect(urbanA.locator('.alpha-produce')).toContainText('Sem esta escolha a cidade não produz');
    await urbanA.getByRole('button',{name:'Escolher produzir'}).click();
    const detailA=pa.locator('.alpha-urban-detail');
    await expect(detailA).toContainText('Custo: Sem custo');await expect(detailA).toContainText('Ações planejáveis da cidade: 1');await expect(detailA).toContainText('Requisitos: atendidos');
    await detailA.getByRole('button',{name:'Planejar ação urbana'}).click();
    await expect(urbanA).toContainText('Ações planejáveis da cidade: 0 / 1');
    await expect(pa.locator('.alpha-action-queue')).toContainText('Ações planejadas 1 / 7');
    // A second action in the same city explains the private reservation and stays disabled.
    await urbanA.getByRole('button',{name:'Escolher produzir'}).click();
    await expect(pa.locator('.alpha-urban-detail')).toContainText('já possui sua ação planejada');
    await expect(pa.locator('.alpha-urban-detail').getByRole('button',{name:'Planejar ação urbana'})).toBeDisabled();
    await pa.locator('.alpha-urban-detail').screenshot({path:`${actionEvidence}/1440x900-city-refusal.png`});
    // The other player deliberately does not produce this round.
    await expect(urbanB).toContainText('Ações planejáveis da cidade: 1 / 1');
    await pa.reload();await expect(pa.locator('.alpha-urban')).toContainText('Ações planejáveis da cidade: 0 / 1');
    await bothConfirm('Confirmar planejamento','2 / 9');
    for(const page of [pa,pb])await page.locator('.alpha-resolution-phase').getByRole('button',{name:'Continuar'}).click();
    {
      const after=await game();
      const produced=(id:string)=>Object.values(after.roundReports.find(r=>r.playerId===id&&r.round===1)!.production).reduce((n,v)=>n+v,0);
      const [first,second]=after.players.map(pl=>pl.playerId);
      expect(produced(first!)).toBeGreaterThan(0);expect(produced(second!)).toBe(0);
      expect(after.phase).toBe('PLANNING');
    }
    // Round 2 - recruit and build are both queued, then resolved by initiative.
    await pa.locator('.alpha-urban summary').filter({hasText:'Recrutar'}).click();
    await pa.getByRole('button',{name:/^Recrutar Explor/i}).click();
    await expect(pa.locator('.alpha-urban-detail')).toContainText('Custo:');await expect(pa.locator('.alpha-urban-detail')).toContainText('Efeito:');
    await pa.locator('.alpha-urban-detail').getByRole('button',{name:'Planejar ação urbana'}).click();
    await expect(urbanA).toContainText('Ações planejáveis da cidade: 0 / 1');
    // Valgard's page is still on the old version here: the build recovers on its own and must not show a conflict.
    await pb.locator('.alpha-urban summary').filter({hasText:'Construir'}).click();
    await pb.getByRole('button',{name:/^Distrito Agr/i}).click();
    await expect(pb.locator('.alpha-urban-detail')).toContainText('Custo:');
    await pb.locator('.alpha-urban-detail').getByRole('button',{name:'Planejar ação urbana'}).click();
    await expect(urbanB).toContainText('Ações planejáveis da cidade: 0 / 1');
    {
      const planned=await game();
      expect(planned.units.filter(u=>u.ownerId===planned.players[0]!.playerId&&u.kind==='EXPLORER')).toHaveLength(0);
      expect(planned.core.players[1]!.civilization.cities[0]!.districts.map(d=>d.type)).not.toContain('AGRARIAN');
    }
    await bothConfirm('Confirmar planejamento','3 / 9');
    {
      const after=await game();
      expect(after.units.filter(u=>u.ownerId===after.players[0]!.playerId&&u.kind==='EXPLORER')).toHaveLength(1);
      expect(after.core.players[1]!.civilization.cities[0]!.districts.map(d=>d.type)).toContain('AGRARIAN');
    }
    for(const page of [pa,pb])await page.locator('.alpha-resolution-phase').getByRole('button',{name:'Continuar'}).click();
    // Round 3 - research survives reconnect; Ana's move is visible only to Ana because Beto cannot see its destination.
    await pa.getByRole('button',{name:'Teia Civilizacional',exact:true}).click();
    const node=pa.locator('.alpha-research-grid article').filter({hasText:'Sem pré-requisitos de pesquisa.'}).first();
    await expect(node).toContainText('Custo:');
    await node.getByRole('button',{name:'Pesquisar (ação urbana)'}).click();
    expect((await game()).players[0]!.research).toHaveLength(0);
    {
      const beforeMove=await game(),ana=beforeMove.players[0]!.playerId,beto=beforeMove.players[1]!.playerId;
      const explorer=beforeMove.units.find(unit=>unit.ownerId===ana&&unit.kind==='EXPLORER')!,from=beforeMove.core.map.find(tile=>tile.id===explorer.hexId)!;
      const betoVision=visibleHexIds(beforeMove,beto);
      const target=beforeMove.core.map.find(tile=>beforeMove.players[0]!.knownHexIds.includes(tile.id)&&!['SEA','UNKNOWN'].includes(tile.terrain)&&!beforeMove.units.some(unit=>unit.hexId===tile.id)&&hexDistance(from,tile)===1&&!betoVision.has(tile.id))!;
      expect(target).toBeDefined();
      const queued=await service.command({guestId:raw.seats[0]!.guestId},gameId,{type:'QUEUE_ORDER',expectedVersion:beforeMove.version,order:{id:'e2e-hidden-move',type:'MOVE',unitIds:[explorer.id],path:[target.id]}},Date.now());
      expect(queued.ok).toBe(true);
    }
    await Promise.all([pa.reload(),pb.reload()]);await expect(pa.locator('.alpha-action-queue')).toContainText('Ações planejadas 2 / 7');
    await confirm(pa,'Confirmar planejamento');await pa.reload();await expect(pa.getByRole('button',{name:'Aguardando outras pessoas',exact:true})).toBeVisible();
    await pb.getByRole('button',{name:/Escolher produzir/}).click();
    await pb.locator('.alpha-urban-detail').getByRole('button',{name:'Planejar ação urbana'}).click();
    await confirm(pb,'Confirmar planejamento');await phase(pa,'4 / 9');await phase(pb,'4 / 9');
    expect((await game()).players[0]!.research).toHaveLength(1);
    const replayA=pa.locator('.alpha-resolution-phase'),replayB=pb.locator('.alpha-resolution-phase');
    await expect(replayA).toContainText('Movimento');await expect(replayA).toContainText('Movimento concluído.');
    await expect(replayB).not.toContainText('Movimento concluído.');
    await pa.screenshot({path:`${actionEvidence}/1440x900-resolution-ana.png`});await pb.screenshot({path:`${actionEvidence}/1440x900-resolution-beto.png`});
    await replayA.getByRole('button',{name:'Continuar'}).click();await replayB.getByRole('button',{name:'Continuar'}).click();
    for(const [tab,file] of [['Teia Civilizacional','research'],['Diplomacia','diplomacy'],['Eras & Hegemonia','hegemony'],['Crônicas','round-report']] as const){await pa.getByRole('button',{name:tab,exact:true}).click();await pa.screenshot({path:`${evidence}/1440-${file}.png`});}
    await pa.getByRole('button',{name:'Mundo',exact:true}).click();
    for(const [width,height] of [[1440,900],[1280,800],[1024,768],[768,1024],[390,844]] as const){await pa.setViewportSize({width,height});await pa.screenshot({path:`${evidence}/${width}x${height}-world-dark.png`});expect(await pa.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
    await pa.getByRole('combobox',{name:'Tema',exact:true}).selectOption('LIGHT');await pa.screenshot({path:`${evidence}/390-world-light.png`});
    expect(errors).toEqual([]);
    // Nothing the players did ever surfaced an error banner: stale commands recovered silently.
    for(const page of [pa,pb])expect(await page.evaluate(()=>(window as unknown as {__alphaErrors:string[]}).__alphaErrors)).toEqual([]);
  }finally{await Promise.allSettled([a.close(),b.close()]);}
});

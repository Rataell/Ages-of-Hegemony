import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { hexDistance } from '@aoh/game-engine';
import { connectAlphaContext, openArea, toMap, muteTour, cloudNode, touchPiece, openCatalog } from './alpha-fixture.js';

// Browser integration uses the real HTTP/service/engine code with the explicit test repository.
// PostgreSQL durability and deployed-network E2E remain separate mandatory release gates.
test('alpha: two browser identities, lobby, management, privacy, round and reconnect',async({browser})=>{
  const origin='http://127.0.0.1:3107',repository=new InMemoryAlphaRepository(),service=new AlphaGameService(repository);
  const http=new AlphaHttp(service,new GuestSessions('browser-test-secret-'.repeat(4)),origin,false);
  const a=await browser.newContext({viewport:{width:1440,height:900}}),b=await browser.newContext({viewport:{width:1440,height:900}});
  await connectAlphaContext(a,http);await muteTour(a);await connectAlphaContext(b,http);await muteTour(b);const pa=await a.newPage(),pb=await b.newPage();
  pa.setDefaultTimeout(15000);pb.setDefaultTimeout(15000);
  for(const context of [a,b])await context.addInitScript(()=>{
    const w=window as unknown as {__alphaErrors:string[]};w.__alphaErrors=[];
    new MutationObserver(()=>{document.querySelectorAll('.alpha-error').forEach(node=>{const text=node.textContent??'';if(text&&!w.__alphaErrors.includes(text))w.__alphaErrors.push(text);});}).observe(document,{childList:true,subtree:true,characterData:true});
  });
  const errors:string[]=[];pa.on('pageerror',e=>errors.push(e.message));pb.on('pageerror',e=>errors.push(e.message));
  const evidence='docs/evidence/playable-alpha-v1',actionEvidence='docs/evidence/alpha-round-action-economy';await Promise.all([mkdir(evidence,{recursive:true}),mkdir(actionEvidence,{recursive:true})]);
  try{
    await pa.goto('/alpha');await pa.getByLabel('Seu nome',{exact:true}).fill('Ana');await pa.getByRole('combobox',{name:'Tema',exact:true}).selectOption('DARK');await pa.screenshot({path:`${evidence}/1440-home.png`,caret:'initial'});
    await expect(pa.getByLabel('Ordens por rodada')).toHaveValue('5');
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
      // Secret ambitions are the first decision: the board opens on them until both are chosen.
      const dialog=page.getByRole('dialog',{name:'Escolha duas ambições secretas'});await expect(dialog).toBeVisible();
      const choices=dialog.getByRole('checkbox');
      await choices.nth(0).check();await choices.nth(1).check();await expect(choices.nth(2)).toBeDisabled();await dialog.getByRole('button',{name:'Confirmar duas ambições',exact:true}).click();
      await expect(dialog).toHaveCount(0);
      // The match details live in the Livro's Conselho; the version is the one the board opened with.
      await openArea(page,'Conselho');await page.locator('.alpha-pages').getByRole('tab',{name:'Sobre o teste'}).click();await expect(page.locator('.alpha-about')).toContainText(`Versão ${(await repository.find(currentId))!.game!.version}`);
      await openArea(page,'Cartas & Projetos');
    }
    await pa.screenshot({path:`${evidence}/1440-card-hand.png`});
    await toMap(pa);
    const actionCounter=pa.locator('.alpha-tray .bud');await expect(actionCounter).toContainText('Ordens');await expect(actionCounter).toContainText('0 / 5');
    for(const [width,height] of [[1366,768],[1440,900],[1920,1080]] as const){await pa.setViewportSize({width,height});await pa.screenshot({path:`${actionEvidence}/${width}x${height}-counter.png`});expect(await pa.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
    await pa.setViewportSize({width:1440,height:900});
    await openArea(pa,'Conselho');await pa.locator('.alpha-pages').getByRole('tab',{name:'Sobre o teste'}).click();await expect(pa.locator('.alpha-about')).toContainText(`Versão ${(await repository.find(new URL(pa.url()).searchParams.get('game')!))!.game!.version}`);await toMap(pa);
    // Habitantes e papéis are details of the city: Detalhes opens them, the map stays the table.
    await pa.getByRole('button',{name:'Detalhes',exact:true}).click();
    await pa.locator('.alpha-frame').getByRole('tab',{name:'População',exact:true}).click();
    await pa.getByLabel('Produtores',{exact:true}).fill('1');await pa.getByLabel('Artesãos',{exact:true}).fill('1');await pa.getByLabel('Eruditos',{exact:true}).fill('0');
    await pa.getByRole('button',{name:'Aplicar distribuição'}).click();
    await pa.getByRole('button',{name:'Fechar cartão',exact:true}).click();
    await pa.locator('svg.world-map [role=button]').filter({has:pa.locator('title')}).first().focus();
    const gameId=new URL(pa.url()).searchParams.get('game')!;
    const beforeMap=(await repository.find(gameId))!.game!;
    const capital=beforeMap.core.map.find(tile=>tile.id===beforeMap.core.players[0]!.civilization.cities[0]!.hexId)!;
    const claim=beforeMap.core.map.find(tile=>tile.ownerId===null&&tile.terrain==='PLAINS'&&hexDistance(capital,tile)===1)!;
    await pa.locator(`svg.world-map [role=button][aria-label$=" ${claim.id}"]`).click();
    // The hex answers where it stands: Reivindicar is a node of its cloud, no side panel.
    await expect(pa.locator('.alpha-inspector')).toHaveCount(0);
    await cloudNode(pa,'claim').click();
    await expect.poll(async()=>(await repository.find(gameId))!.game!.core.map.find(tile=>tile.id===claim.id)!.ownerId).toBe((await repository.find(gameId))!.game!.core.players[0]!.id);
    await pa.locator(`svg.world-map [role=button][aria-label$=" ${claim.id}"]`).click();
    await cloudNode(pa,'improve').click();await cloudNode(pa,'FARM').click();await pa.locator('.ctx-go').click();
    await expect.poll(async()=>(await repository.find(gameId))!.game!.core.map.find(tile=>tile.id===claim.id)!.improvement).toBe('FARM');
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
    const phase=async(page:typeof pa,text:string)=>expect(page.locator('.alpha-strip-when')).toContainText(text);
    const game=async()=>(await repository.find(gameId))!.game!;
    // Confirming may first list what is left undone (idle pieces, a city without action); the player confirms anyway.
    const confirm=async(page:typeof pa,label:string)=>{await page.getByRole('button',{name:label,exact:true}).click();const anyway=page.getByRole('button',{name:'Confirmar mesmo assim',exact:true});if(await anyway.isVisible().catch(()=>false))await anyway.click();};
    async function bothConfirm(label:string,next:string){
      // No reload: a page that is behind recovers by itself (VERSION_CONFLICT -> refresh -> one retry).
      await confirm(pa,label);await expect(pb.locator('.alpha-round-bar')).toContainText('1 / 2 prontos');
      await confirm(pb,label);await phase(pa,next);await phase(pb,next);
    }
    // Round 1 - every strategic decision is private until both players close planning.
    await pa.reload();await expect(pa.locator('.alpha-player-board h1')).toHaveText('Aurélia');
    await toMap(pb);
    await phase(pa,'Planejamento');
    await openCatalog(pa);await openCatalog(pb);
    const urbanA=pa.locator('.alpha-urban'),urbanB=pb.locator('.alpha-urban');
    await expect(urbanA).toContainText('Ações planejáveis da cidade: 2 / 2');
    // PRODUCE is an explicit planned choice, with cost, effect and remaining actions shown before confirmation.
    await expect(urbanA.locator('.alpha-produce')).toContainText('Sem esta escolha a cidade não produz');
    await urbanA.getByRole('button',{name:'Escolher produzir'}).click();
    const detailA=pa.locator('.alpha-urban-detail');
    await expect(detailA).toContainText('Custo: Sem custo');await expect(detailA).toContainText('Ações planejáveis da cidade: 2');await expect(detailA).toContainText('Requisitos: atendidos');
    await detailA.getByRole('button',{name:'Planejar ação urbana'}).click();
    await expect(urbanA).toContainText('Ações planejáveis da cidade: 1 / 2');
    await expect(pa.locator('.alpha-action-queue')).toContainText('Ordens planejadas 1 / 5');
    // With one activation planned, the city shows that plan and offers to swap it; a second activation stays available (canon §10).
    const plannedCard=urbanA.getByRole('article',{name:'Ação planejada'});
    await expect(plannedCard).toContainText('Nesta rodada: Produzir');
    await expect(urbanA.getByRole('button',{name:'Escolher produzir'})).toHaveCount(1);
    await plannedCard.screenshot({path:`${actionEvidence}/1440x900-city-refusal.png`});
    await plannedCard.getByRole('button',{name:'Trocar ação',exact:true}).click();
    await expect(urbanA).toContainText('Ações planejáveis da cidade: 2 / 2');
    await urbanA.getByRole('button',{name:'Escolher produzir'}).click();
    await pa.locator('.alpha-urban-detail').getByRole('button',{name:'Planejar ação urbana'}).click();
    await expect(urbanA).toContainText('Ações planejáveis da cidade: 1 / 2');
    // The other player deliberately does not produce this round.
    await expect(urbanB).toContainText('Ações planejáveis da cidade: 2 / 2');
    // A starting Pioneiro leaves the capital: touch the piece, choose Mover, the MAP lights up the legal hexes and the click on one is the order.
    await toMap(pa);
    await touchPiece(pa,'g.hex:has(.art-city)');
    await cloudNode(pa,'move').click();
    await expect(pa.locator('svg.world-map g.hex.target-move').first()).toBeVisible();
    await pa.locator('svg.world-map g.hex.target-move:not([aria-label^="Desconhecido"])').first().click();
    await expect(pa.locator('.alpha-order-chip.is-used').filter({hasText:'Expedição'})).toHaveCount(1);
    await pa.reload();await openCatalog(pa);await expect(pa.locator('.alpha-urban')).toContainText('Ações planejáveis da cidade: 1 / 2');
    await bothConfirm('Confirmar planejamento','2 / 21');
    for(const page of [pa,pb])await page.locator('.alpha-resolution-phase').getByRole('button',{name:'Continuar'}).click();
    {
      const after=await game();
      const produced=(id:string)=>Object.values(after.roundReports.find(r=>r.playerId===id&&r.round===1)!.production).reduce((n,v)=>n+v,0);
      const [first,second]=after.players.map(pl=>pl.playerId);
      expect(produced(first!)).toBeGreaterThan(0);expect(produced(second!)).toBe(0);
      expect(after.phase).toBe('PLANNING');
    }
    // Round 2 - recruit and build are both queued, then resolved by initiative.
    await pa.locator('.alpha-urban').getByRole('tab',{name:/Recrutar/}).click();
    await pa.getByRole('button',{name:/^Recrutar Pioneiro/i}).click();
    await expect(pa.locator('.alpha-urban-detail')).toContainText('Custo:');await expect(pa.locator('.alpha-urban-detail')).toContainText('Efeito:');
    await pa.locator('.alpha-urban-detail').getByRole('button',{name:'Planejar ação urbana'}).click();
    await expect(urbanA).toContainText('Ações planejáveis da cidade: 1 / 2');
    // Valgard's page is still on the old version here: the research recovers on its own and must not show a conflict. Districts need their Web advance (canon §5), so Beto opens the Teia first.
    // The Teia is a glass layer over the Mesa (Tabuleiro da Civilização): pick the node, research it as the Ordem Avanço, back to the map.
    await openArea(pb,'Teia Civilizacional');
    const boardB=pb.getByRole('dialog',{name:'Tabuleiro da Civilização'});
    await boardB.locator('button.alpha-node').filter({hasText:'Agricultura'}).first().click();
    await expect(boardB.locator('.alpha-node-detail')).toContainText('Custo:');
    await boardB.getByRole('button',{name:/Pesquisar · Ordem Avanço/}).click();
    await expect(pb.locator('.alpha-order-chip.is-used').filter({hasText:'Avanço'})).toHaveCount(1);
    await pb.keyboard.press('Escape');
    await expect(urbanB).toContainText('Ações planejáveis da cidade: 1 / 2');
    {
      const planned=await game();
      // Only the two starting Pioneiros exist until the planned recruitment resolves.
      expect(planned.units.filter(u=>u.ownerId===planned.players[0]!.playerId&&u.kind==='PIONEER')).toHaveLength(2);
      expect(planned.players[1]!.research).not.toContain('web-agriculture');
    }
    await bothConfirm('Confirmar planejamento','3 / 21');
    {
      const after=await game();
      expect(after.units.filter(u=>u.ownerId===after.players[0]!.playerId&&u.kind==='PIONEER')).toHaveLength(3);
      expect(after.players[1]!.research).toContain('web-agriculture');
    }
    for(const page of [pa,pb])await page.locator('.alpha-resolution-phase').getByRole('button',{name:'Continuar'}).click();
    // Round 3 - research survives reconnect; Ana's resolved move is public: Beto sees it too (the table is shared; only the Order was private).
    await openArea(pa,'Teia Civilizacional');
    const boardA=pa.getByRole('dialog',{name:'Tabuleiro da Civilização'});
    await boardA.locator('button.alpha-node.is-reachable').first().click();
    await expect(boardA.locator('.alpha-node-detail')).toContainText('Custo:');
    await boardA.getByRole('button',{name:/Pesquisar · Ordem Avanço/}).click();
    // The command is in flight: the Avanço Order must show before the layer closes (and before any reload).
    await expect(pa.locator('.alpha-order-chip.is-used').filter({hasText:'Avanço'})).toHaveCount(1);
    await pa.keyboard.press('Escape');
    expect((await game()).players[0]!.research).toHaveLength(0);
    {
      const beforeMove=await game(),ana=beforeMove.players[0]!.playerId,beto=beforeMove.players[1]!.playerId;
      const explorer=beforeMove.units.find(unit=>unit.ownerId===ana&&unit.kind==='PIONEER')!,from=beforeMove.core.map.find(tile=>tile.id===explorer.hexId)!;
      void beto;
      const target=beforeMove.core.map.find(tile=>beforeMove.players[0]!.knownHexIds.includes(tile.id)&&!['SEA','UNKNOWN'].includes(tile.terrain)&&!beforeMove.units.some(unit=>unit.hexId===tile.id)&&hexDistance(from,tile)===1)!;
      expect(target).toBeDefined();
      const queued=await service.command({guestId:raw.seats[0]!.guestId},gameId,{type:'QUEUE_ORDER',expectedVersion:beforeMove.version,order:{id:'e2e-hidden-move',type:'MOVE',unitIds:[explorer.id],path:[target.id]}},Date.now());
      expect(queued.ok).toBe(true);
    }
    await Promise.all([pa.reload(),pb.reload()]);await expect(pa.locator('.alpha-action-queue')).toContainText('Ordens planejadas 2 / 5');
    await openCatalog(pb);
    await confirm(pa,'Confirmar planejamento');await pa.reload();await expect(pa.getByRole('button',{name:'Aguardando outras pessoas',exact:true})).toBeVisible();
    await pb.getByRole('button',{name:/Escolher produzir/}).click();
    await pb.locator('.alpha-urban-detail').getByRole('button',{name:'Planejar ação urbana'}).click();
    await confirm(pb,'Confirmar planejamento');
    // Round 3 closes the first Era: the Era turn waits for both before round 4 opens.
    await phase(pa,'Virada de Era');await phase(pb,'Virada de Era');
    await pa.locator('.alpha-round-bar').getByRole('button',{name:'Confirmar Virada',exact:true}).click();await pb.locator('.alpha-round-bar').getByRole('button',{name:'Confirmar Virada',exact:true}).click();
    await phase(pa,'4 / 21');await phase(pb,'4 / 21');
    expect((await game()).players[0]!.research).toHaveLength(1);
    const replayA=pa.locator('.alpha-resolution-phase'),replayB=pb.locator('.alpha-resolution-phase');
    await expect(replayA).toContainText('Mobilidade');await expect(replayA).toContainText(/Ana: Pioneiro.* moveu-se para -?\d+,-?\d+\./);
    await expect(replayB).toContainText('moveu-se');
    await pa.screenshot({path:`${actionEvidence}/1440x900-resolution-ana.png`});await pb.screenshot({path:`${actionEvidence}/1440x900-resolution-beto.png`});
    await replayA.getByRole('button',{name:'Continuar'}).click();await replayB.getByRole('button',{name:'Continuar'}).click();
    for(const [tab,file] of [['Teia Civilizacional','research'],['Diplomacia','diplomacy'],['Eras & Hegemonia','hegemony'],['Crônicas','round-report']] as const){await openArea(pa,tab);await pa.screenshot({path:`${evidence}/1440-${file}.png`});}
    await toMap(pa);
    for(const [width,height] of [[1440,900],[1280,800],[1024,768],[768,1024],[390,844]] as const){await pa.setViewportSize({width,height});await pa.screenshot({path:`${evidence}/${width}x${height}-world-dark.png`});expect(await pa.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
    await pa.getByRole('combobox',{name:'Tema',exact:true}).selectOption('LIGHT');await pa.screenshot({path:`${evidence}/390-world-light.png`});
    expect(errors).toEqual([]);
    // Nothing the players did ever surfaced an error banner: stale commands recovered silently.
    for(const page of [pa,pb])expect(await page.evaluate(()=>(window as unknown as {__alphaErrors:string[]}).__alphaErrors)).toEqual([]);
  }finally{await Promise.allSettled([a.close(),b.close()]);}
});

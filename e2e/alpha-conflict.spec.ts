import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import type { AlphaState } from '@aoh/game-domain';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { AlphaRoomSchema, InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { runScriptedMatch } from '../tests/alpha-match-scenario.js';
import { connectAlphaContext, openArea, toMap, muteTour, cloudNode } from './alpha-fixture.js';

test('authoritative battle dice, retreat and Hegemony finish appear in both browser perspectives',async({browser})=>{
  test.setTimeout(90000);
  let beforeAttack:AlphaState|undefined,beforeFinish:AlphaState|undefined;
  runScriptedMatch((name,state)=>{
    if(name==='beforeAttack')beforeAttack=state;
    if(name==='beforeEndRound')beforeFinish=state;
  });
  expect(beforeAttack).toBeDefined();expect(beforeFinish).toBeDefined();
  const origin='http://127.0.0.1:3107',repository=new InMemoryAlphaRepository();
  const sessions=new GuestSessions('battle-browser-secret-'.repeat(4)),identities=[sessions.issue(Date.now()),sessions.issue(Date.now())];
  const service=new AlphaGameService(repository),http=new AlphaHttp(service,sessions,origin,false);
  const room=AlphaRoomSchema.parse({id:beforeAttack!.gameId,version:0,contentVersion:'v1.2',name:'Prova de conflito',joinCode:'abcdefghijklmnopqrstuv',hostGuestId:identities[0]!.principal.guestId,
    preset:'EPIC',seed:61,seatLimit:2,planningSeconds:0,deadline:null,
    seats:beforeAttack!.players.map((p,i)=>({guestId:identities[i]!.principal.guestId,playerId:p.playerId,name:i===0?'Incas (Tawantinsuyu)':'Helênicos',civilization:p.civilization,figureId:p.leader?.leaderId??null,ready:true})),game:beforeAttack});
  await repository.create(room);
  const contexts=await Promise.all(identities.map(()=>browser.newContext({viewport:{width:1440,height:900}})));
  const pages:Page[]=[];
  const evidence='docs/evidence/playable-alpha-v1';await mkdir(evidence,{recursive:true});
  try{
    for(const [i,context] of contexts.entries()){
      await connectAlphaContext(context,http);await muteTour(context);
      await context.addCookies([{name:'aoh_alpha_session',value:identities[i]!.token,url:origin,httpOnly:true,sameSite:'Strict'}]);
      const page=await context.newPage();page.setDefaultTimeout(15000);pages.push(page);
      await page.goto(`/alpha?game=${room.id}`);
      await expect(page.getByRole('heading',{name:i===0?'Incas (Tawantinsuyu)':'Helênicos',exact:true})).toBeVisible();
    }
    const a=pages[0]!,b=pages[1]!;
    // The previous round's results open first; the atlas is usable once they are dismissed.
    await a.getByRole('status',{name:'Resolvendo a rodada'}).getByRole('button',{name:'Continuar'}).click();
    // Ten pieces on one hex collapse into a single stack card (Detalhes); individual pieces stay reachable under 'ver composição'.
    await a.locator('svg.world-map g.hex[aria-label$=" 8,0"], svg.world-map g.hex[aria-label$=" 8,0, trabalhado"]').first().click();
    await a.getByRole('button',{name:'Detalhes',exact:true}).click();
    const stack=a.locator('.alpha-inspector .alpha-frame').filter({hasText:'8,0'});
    await expect(stack).toHaveCount(1);await expect(stack).toContainText('Exército · 10 peças');await expect(stack).toContainText('×');
    // Individual pieces are one segment away (Composição), never stacked under the summary.
    await stack.getByRole('tab',{name:'Composição'}).click();
    await expect(stack.locator('.alpha-piece-row')).toHaveCount(10);
    await stack.getByRole('tab',{name:'Resumo'}).click();
    // The scripted army starts above the limit; the counter says so and only new arrivals are refused.
    await expect(stack.locator('.alpha-stack-tag')).toContainText('Exército 10/6');
    // "Selecionar todas" hands the stack to the Table: its cloud opens on the piece.
    await stack.getByRole('button',{name:'Selecionar todas',exact:true}).click();
    await expect(a.locator('.table-cloud .ctx-plate')).toContainText('MILITARES · 10');
    // Stack limits are explained before any command: ten pieces cannot end a voluntary move on one hex. The MAP is where the destination is chosen.
    await cloudNode(a,'move').click();
    await a.locator('svg.world-map g.hex.target-move').first().click();
    await expect(a.locator('.ctx-chip')).toContainText('Limite de pilha atingido em');
    await a.keyboard.press('Escape');
    await cloudNode(a,'posture').click();await a.locator('.ctx-node',{hasText:'Manobra'}).click();
    await openArea(b,'Conselho');await b.locator('.alpha-pages').getByRole('tab',{name:'Postura defensiva'}).click();await b.getByLabel('Se for atacado, sua civilização adota',{exact:false}).selectOption('HOLD');await toMap(b);
    await cloudNode(a,'attack').click();
    await a.getByRole('button',{name:'Planície 9,0',exact:true}).click();
    // The reserved order and its preview are one segment (Ordens) of the stack's Detalhes frame.
    await a.locator('.alpha-inspector .alpha-frame').getByRole('tab',{name:/^Ordens/}).click();
    await expect(a.locator('.alpha-order')).toContainText('Ataque');
    // The preview explains the static modifiers by origin and reveals neither dice nor the defender's posture.
    const preview=a.locator('.alpha-attack-preview');
    await expect(preview).toContainText('Limite de pilha atingido em 9,0: se vencer, 6 de 10 peças avançam e 4 permanecem em 8,0.');
    await expect(preview.locator('.alpha-preview-summary')).toContainText(/Manobra · Ataque [0-9]+ × Defesa/);
    await preview.locator('summary').click();
    await expect(preview.getByRole('heading',{name:'Seu ataque'})).toBeVisible();
    await expect(preview).toContainText('Seu ataque');await expect(preview).toContainText('Postura escolhida: Manobra');
    await expect(preview).toContainText('Postura defensiva do adversário: desconhecida');
    await expect(preview).toContainText('Faces do dado: Vazio, Impacto, Impacto, Guarda, Manobra, Comando');
    await expect(preview).not.toContainText('Faces do ataque');

    const shots='docs/evidence/alpha-convergence';await mkdir(shots,{recursive:true});
    for(const [width,height] of [[1440,900],[1280,800],[390,844]] as const){
      await a.setViewportSize({width,height});await a.screenshot({path:`${shots}/alpha-${width}-army-attack.png`});
      expect(await a.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
    await a.setViewportSize({width:1440,height:900});

    async function confirmRound(){
      const round=(await repository.find(room.id))!.game!.core.round;
      for(let guard=0;guard<14;guard++){
        const current=(await repository.find(room.id))!;
        if(current.game!.core.status==='FINISHED'||current.game!.core.round!==round)return;
        const index=current.game!.players.findIndex(p=>!p.ready);
        expect(index).toBeGreaterThanOrEqual(0);
        const page=pages[index]!;await page.reload();
        const ready=page.getByRole('button',{name:/^(Confirmar planejamento|Concluir fase|Confirmar Virada|Passar \/ pronto)$/});
        await expect(ready).toBeEnabled();await ready.click();
        const anyway=page.getByRole('button',{name:'Confirmar mesmo assim',exact:true});if(await anyway.isVisible().catch(()=>false))await anyway.click();
        await expect.poll(async()=>(await repository.find(room.id))!.version).toBeGreaterThan(current.version);
      }
      throw new Error('The browser round failed to reach its next boundary');
    }
    await confirmRound();
    const after=(await repository.find(room.id))!.game!,battle=after.battles[0]!;
    expect(battle.losses.length).toBeGreaterThan(0);expect(battle.retreat).not.toBeNull();
    expect(after.units.some(u=>battle.losses.includes(u.id))).toBe(false);
    expect(after.units.filter(u=>u.id.startsWith('defender-')).every(u=>u.hexId===battle.retreat)).toBe(true);
    // Only as many victors as the stack limit allows moved in; the rest stayed where they attacked from.
    if(battle.winnerId==='p1'){expect(after.units.filter(u=>u.ownerId==='p1'&&u.hexId===battle.hexId)).toHaveLength(6);expect(after.events.some(e=>e.type==='STACK_LIMIT')).toBe(true);}
    for(const [i,page] of pages.entries()){
      await page.reload();await openArea(page,'Crônicas');await page.locator('.alpha-pages').getByRole('tab',{name:/^Conflitos/}).click();
      const displayed=page.locator('.alpha-battle');await expect(displayed).toHaveCount(1);
      const face:Record<string,string>={EMPTY:'Vazio',IMPACT:'Impacto',GUARD:'Guarda',MANEUVER:'Manobra',COMMAND:'Comando'};
      await expect(displayed.getByLabel(`Faces do ataque ${battle.attackerTactical.map(r=>face[r.face]).join(' e ')}`,{exact:true})).toBeVisible();
      await expect(displayed.getByLabel(`Faces da defesa ${battle.defenderTactical.map(r=>face[r.face]).join(' e ')}`,{exact:true})).toBeVisible();
      expect(battle.attackerPosture).toBe('MANEUVER');expect(battle.defenderPosture).toBe('HOLD');
      await expect(displayed).toContainText('Manobra');await expect(displayed).toContainText('Manter');
      for(const item of [...battle.attackBreakdown,...battle.defenseBreakdown])await expect(displayed).toContainText(item.source);
      await expect(displayed).toContainText(`= ${battle.attackTotal}`);
      await expect(displayed).toContainText(`= ${battle.defenseTotal}`);
      await expect(displayed).toContainText(`Retirada para ${battle.retreat}`);
      const view=await service.read(identities[i]!.principal,room.id,Date.now());
      expect(view.ok&&view.value.game!.battles[0]).toEqual(battle);
      if(i===0){await displayed.scrollIntoViewIfNeeded();await page.screenshot({path:`${evidence}/1440-battle.png`});}
    }
    // Conselho → Peças lists one card per stack (individual pieces live in Detalhes → Composição).
    const stacksOf=(owner:string)=>new Set(after.units.filter(u=>u.ownerId===owner).map(u=>u.hexId)).size;
    await openArea(a,'Conselho');await a.locator('.alpha-pages').getByRole('tab',{name:/^Peças/}).click();
    await expect(a.locator('.alpha-army')).toHaveCount(stacksOf('p1'));
    await openArea(b,'Conselho');await b.locator('.alpha-pages').getByRole('tab',{name:/^Peças/}).click();
    await expect(b.locator('.alpha-army')).toHaveCount(stacksOf('p2'));

    // Restore another checkpoint produced by the same legal command scenario.
    // This is a test-repository fixture; the product exposes no snapshot-injection endpoint.
    const current=(await repository.find(room.id))!;
    expect(await repository.save({...current,version:current.version+1,game:beforeFinish!},current.version)).toBe(true);
    await a.reload();await openArea(a,'Cartas & Projetos');await a.locator('.alpha-pages').getByRole('tab',{name:'Obras de Legado'}).click();
    const project=a.locator('article').filter({has:a.getByRole('heading',{name:'Pátio da Investigação',exact:true})});
    await expect(project).toContainText('Concluída por');await project.scrollIntoViewIfNeeded();
    await a.screenshot({path:`${evidence}/1440-great-project.png`});
    await openArea(a,'Eras & Hegemonia');
    await a.screenshot({path:`${evidence}/1440-era-progression.png`});
    await confirmRound();
    const finished=(await repository.find(room.id))!.game!;
    expect(finished.winner).toMatchObject({playerId:'p1',reason:'HEGEMONY'});
    for(const [index,page] of pages.entries()){
      await page.reload();
      // The end of the match opens on the result: headline, reason, ranking for everyone, and what to do next.
      const finale=page.getByRole('dialog',{name:index===0?'Sua civilização venceu':'Aurélia venceu'});
      await expect(finale).toBeVisible();
      await expect(finale).toContainText(/Hegemonia .+ consolidada\./);
      await expect(finale.locator('.alpha-standings tbody tr')).toHaveCount(2);
      await expect(finale.locator('.alpha-standings tbody tr').first()).toContainText('Aurélia');
      await expect(finale.getByRole('button',{name:'Nova partida',exact:true})).toBeVisible();
      // Crônica da Partida: six sections, the facts of this match, exports, and nothing private.
      await finale.getByRole('button',{name:'Crônica da Partida',exact:true}).click();
      const chronicle=page.locator('section.alpha-chronicle');
      await expect(chronicle).toBeVisible();
      await expect(chronicle.getByRole('tab')).toHaveText(['Resumo','Civilizações','Economia','Desenvolvimento','Conflitos','Linha do tempo']);
      await expect(chronicle).toContainText(/Hegemonia consolidada na rodada/);
      if(index===0)await chronicle.screenshot({path:`${evidence}/1440-chronicle.png`});
      await expect(chronicle.locator('.alpha-standings tbody tr').first()).toContainText('Aurélia');
      for(const [section,expected] of [['Civilizações',/Cidades/],['Economia',/Alimento/],['Desenvolvimento',/Distritos/],['Conflitos',/batalha/],['Linha do tempo',/Rodada/]] as const){
        await chronicle.getByRole('tab',{name:section,exact:true}).click();
        await expect(chronicle).toContainText(expected);
      }
      await expect(chronicle.getByText(/O que esta Crônica não sabe/)).toBeVisible();
      const [download]=await Promise.all([page.waitForEvent('download'),chronicle.getByRole('button',{name:'Exportar JSON',exact:true}).click()]);
      expect(download.suggestedFilename()).toMatch(/^cronica-.*\.json$/);
      await chronicle.getByRole('button',{name:'Fechar',exact:true}).click();
      await expect(chronicle).toBeHidden();
      await finale.getByRole('button',{name:'Ver o mapa final',exact:true}).click();
      await expect(page.locator('.alpha-round-bar .advance-phase-btn')).toBeDisabled();   // RC5: the tray also carries the Cofre button
    }
    await a.screenshot({path:`${evidence}/1440-finished.png`});
  }finally{await Promise.allSettled(contexts.map(context=>context.close()));}
});

import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AlphaHttp } from '../apps/server/src/alpha-http.js';
import { AlphaGameService } from '../apps/server/src/alpha-service.js';
import { InMemoryAlphaRepository } from '../apps/server/src/alpha-room.js';
import { GuestSessions } from '../apps/server/src/guest-session.js';
import { connectAlphaContext } from './alpha-fixture.js';

// Browser integration uses the real HTTP/service/engine code with the explicit test repository.
// PostgreSQL durability and deployed-network E2E remain separate mandatory release gates.
test('alpha: two browser identities, lobby, management, privacy, round and reconnect',async({browser})=>{
  const origin='http://127.0.0.1:3107',repository=new InMemoryAlphaRepository();
  const http=new AlphaHttp(new AlphaGameService(repository),new GuestSessions('browser-test-secret-'.repeat(4)),origin,false);
  const a=await browser.newContext({viewport:{width:1440,height:900}}),b=await browser.newContext({viewport:{width:1440,height:900}});
  await connectAlphaContext(a,http);await connectAlphaContext(b,http);const pa=await a.newPage(),pb=await b.newPage();
  pa.setDefaultTimeout(15000);pb.setDefaultTimeout(15000);
  const errors:string[]=[];pa.on('pageerror',e=>errors.push(e.message));pb.on('pageerror',e=>errors.push(e.message));
  const evidence='docs/evidence/playable-alpha-v1';await mkdir(evidence,{recursive:true});
  try{
    await pa.goto('/alpha');await pa.getByLabel('Seu nome',{exact:true}).fill('Ana');await pa.getByRole('combobox',{name:'Tema',exact:true}).selectOption('DARK');await pa.screenshot({path:`${evidence}/1440-home.png`,caret:'initial'});
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
    await expect(pa.locator('.alpha-about')).toContainText(`Versão ${(await repository.find(new URL(pa.url()).searchParams.get('game')!))!.game!.version}`);
    await pa.getByLabel('Produtores',{exact:true}).fill('1');await pa.getByLabel('Artesãos',{exact:true}).fill('1');await pa.getByLabel('Estudiosos',{exact:true}).fill('0');
    await pa.getByRole('button',{name:'Aplicar distribuição'}).click();
    await pa.locator('svg.world-map [role=button]').filter({has:pa.locator('title')}).first().focus();
    await pa.getByRole('button',{name:'Planície 1,0',exact:true}).click();
    await pa.getByRole('button',{name:'Reivindicar para Ana',exact:true}).click();
    await expect(pa.locator('.alpha-inspector')).toContainText('Território de Ana');
    await pa.getByText('Melhorias e estradas',{exact:true}).click();await pa.getByRole('button',{name:'Fazenda',exact:true}).click();
    await expect(pa.locator('.alpha-inspector')).toContainText('Fazenda');
    await pa.screenshot({path:`${evidence}/1440-city.png`});
    const gameId=new URL(pa.url()).searchParams.get('game')!;
    const raw=(await repository.find(gameId))!;expect(raw.game!.core.players[0]!.civilization.cities[0]!.workers.artisans).toBe(1);
    const privateB=raw.game!.players[1]!.ambitions;
    const response=await pa.request.get(`/api/alpha?gameId=${gameId}`);
    // APIRequestContext bypasses browser interception; runtime correctly has no memory fallback.
    expect(response.status()).toBe(503);
    const projected=await new AlphaGameService(repository).read({guestId:raw.seats[0]!.guestId},gameId,Date.now());
    expect(projected.ok).toBe(true);expect(JSON.stringify(projected)).not.toContain(raw.game!.privateRng.seed);
    if(projected.ok)expect(projected.value.game!.self.ambitions.some(id=>privateB.includes(id))).toBe(false);
    await pa.reload();await expect(pa.locator('.alpha-player-board h1')).toHaveText('Aurélia');
    await expect(pa.locator('html')).toHaveAttribute('data-alpha-theme','DARK');
    const phase=async(page:typeof pa,text:string)=>expect(page.locator('.alpha-round-bar')).toContainText(text);
    const game=async()=>(await repository.find(gameId))!.game!;
    const confirm=async(page:typeof pa,label:string)=>page.getByRole('button',{name:label,exact:true}).click();
    async function bothConfirm(label:string,next:string){
      // Each confirmation carries the aggregate version, so a page that is behind reloads first (this also exercises reconnecting).
      await pa.reload();await confirm(pa,label);await expect(pb.locator('.alpha-round-bar')).toContainText('1 / 2 prontos');
      await pb.reload();await confirm(pb,label);await phase(pa,next);await phase(pb,next);
    }
    // Round 1 - PLANNING closes only when both confirm, then the urban phase opens for each city.
    await pa.reload();await expect(pa.locator('.alpha-player-board h1')).toHaveText('Aurélia');
    await pb.getByRole('button',{name:'Mundo',exact:true}).click();
    await phase(pa,'Planejamento');
    await bothConfirm('Confirmar planejamento','Ações urbanas');
    const urbanA=pa.locator('.alpha-urban'),urbanB=pb.locator('.alpha-urban');
    await expect(urbanA).toContainText('Ações restantes da cidade: 1 / 1');
    // PRODUCE is an explicit choice, with its cost, effect and remaining actions shown before confirming.
    await expect(urbanA.locator('.alpha-produce')).toContainText('Sem esta escolha a cidade não produz');
    await urbanA.getByRole('button',{name:'Escolher produzir'}).click();
    const detailA=pa.locator('.alpha-urban-detail');
    await expect(detailA).toContainText('Custo: Sem custo');await expect(detailA).toContainText('Ações restantes da cidade: 1');await expect(detailA).toContainText('Requisitos: atendidos');
    await detailA.getByRole('button',{name:'Confirmar ação urbana'}).click();
    await expect(urbanA).toContainText('Ações restantes da cidade: 0 / 1');
    // A second action in the same city is not offered: the reason is shown and confirmation stays disabled.
    await urbanA.getByRole('button',{name:'Escolher produzir'}).click();
    await expect(pa.locator('.alpha-urban-detail')).toContainText('já usou sua ação urbana');
    await expect(pa.locator('.alpha-urban-detail').getByRole('button',{name:'Confirmar ação urbana'})).toBeDisabled();
    // The other player deliberately does not produce this round.
    await expect(urbanB).toContainText('Ações restantes da cidade: 1 / 1');
    await pa.reload();await expect(pa.locator('.alpha-urban')).toContainText('Ações restantes da cidade: 0 / 1');
    await bothConfirm('Concluir fase','Diplomacia e comércio');
    await bothConfirm('Concluir fase','2 / 9');
    {
      const after=await game();
      const produced=(id:string)=>Object.values(after.roundReports.find(r=>r.playerId===id&&r.round===1)!.production).reduce((n,v)=>n+v,0);
      const [first,second]=after.players.map(pl=>pl.playerId);
      expect(produced(first!)).toBeGreaterThan(0);expect(produced(second!)).toBe(0);
      expect(after.phase).toBe('PLANNING');
    }
    // Round 2 - build (Aurélia) and recruit (Valgard) through the same urban panel.
    await bothConfirm('Confirmar planejamento','Ações urbanas');
    await pa.locator('.alpha-urban summary').filter({hasText:'Construir'}).click();
    await pa.getByRole('button',{name:/^Distrito Agr/i}).click();
    await expect(pa.locator('.alpha-urban-detail')).toContainText('Custo:');await expect(pa.locator('.alpha-urban-detail')).toContainText('Efeito:');
    await pa.locator('.alpha-urban-detail').getByRole('button',{name:'Confirmar ação urbana'}).click();
    await expect(urbanA).toContainText('Ações restantes da cidade: 0 / 1');
    // Commands carry the aggregate version, so a player who acts right after the other reloads to the current version first.
    await pb.reload();await expect(pb.locator('.alpha-urban')).toContainText('Ações restantes da cidade: 1 / 1');
    await pb.locator('.alpha-urban summary').filter({hasText:'Recrutar'}).click();
    await pb.getByRole('button',{name:/^Recrutar Explor/i}).click();
    await expect(pb.locator('.alpha-urban-detail')).toContainText('Custo:');
    await pb.locator('.alpha-urban-detail').getByRole('button',{name:'Confirmar ação urbana'}).click();
    await expect(urbanB).toContainText('Ações restantes da cidade: 0 / 1');
    {
      const after=await game();
      expect(after.core.players[0]!.civilization.cities[0]!.districts.map(d=>d.type)).toContain('AGRARIAN');
      expect(after.units.filter(u=>u.ownerId===after.players[1]!.playerId&&u.kind==='EXPLORER')).toHaveLength(1);
    }
    await bothConfirm('Concluir fase','Diplomacia e comércio');
    await bothConfirm('Concluir fase','3 / 9');
    // Round 3 - research is an urban action too, chosen from the research tab for the selected city.
    await bothConfirm('Confirmar planejamento','Ações urbanas');
    await pa.getByRole('button',{name:'Teia Civilizacional',exact:true}).click();
    const node=pa.locator('.alpha-research-grid article').filter({hasText:'Sem pré-requisitos de pesquisa.'}).first();
    await expect(node).toContainText('Custo:');
    await node.getByRole('button',{name:'Pesquisar (ação urbana)'}).click();
    await expect.poll(async()=>(await game()).players[0]!.research.length).toBe(1);
    await expect(node.getByRole('button',{name:'Pesquisado'})).toBeVisible();
    await pa.getByRole('button',{name:'Mundo',exact:true}).click();
    await expect(pa.locator('.alpha-urban')).toContainText('Ações restantes da cidade: 0 / 1');
    // Reconnecting in the middle of a phase keeps the city's spent action and the confirmation state.
    await pa.reload();await expect(pa.locator('.alpha-urban')).toContainText('Ações restantes da cidade: 0 / 1');
    await confirm(pa,'Concluir fase');await pa.reload();await expect(pa.getByRole('button',{name:'Aguardando outras pessoas',exact:true})).toBeVisible();
    await pb.reload();await expect(pb.locator('.alpha-urban')).toContainText('Ações restantes da cidade: 1 / 1');
    await pb.getByRole('button',{name:/Escolher produzir/}).click();
    await pb.locator('.alpha-urban-detail').getByRole('button',{name:'Confirmar ação urbana'}).click();
    await confirm(pb,'Concluir fase');await phase(pa,'Diplomacia e comércio');
    await bothConfirm('Concluir fase','4 / 9');
    for(const [tab,file] of [['Teia Civilizacional','research'],['Diplomacia','diplomacy'],['Eras & Hegemonia','hegemony'],['Crônicas','round-report']] as const){await pa.getByRole('button',{name:tab,exact:true}).click();await pa.screenshot({path:`${evidence}/1440-${file}.png`});}
    await pa.getByRole('button',{name:'Mundo',exact:true}).click();
    for(const [width,height] of [[1440,900],[1280,800],[390,844]] as const){await pa.setViewportSize({width,height});await pa.screenshot({path:`${evidence}/${width}-world-dark.png`});expect(await pa.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
    await pa.getByRole('combobox',{name:'Tema',exact:true}).selectOption('LIGHT');await pa.screenshot({path:`${evidence}/390-world-light.png`});
    expect(errors).toEqual([]);
  }finally{await Promise.allSettled([a.close(),b.close()]);}
});

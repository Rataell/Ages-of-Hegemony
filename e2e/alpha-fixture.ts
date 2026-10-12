import { expect, type BrowserContext } from '@playwright/test';
import type { AlphaHttp } from '../apps/server/src/alpha-http.js';

/** Real HTTP boundary, explicitly in-process transport for browser integration tests. */
export async function connectAlphaContext(context:BrowserContext,http:AlphaHttp){
  const handle=async(route:import('@playwright/test').Route)=>{
    const request=route.request();
    // The in-process transport cannot stream: the browser falls back to its safety poll.
    if(request.url().includes('stream=1')){await route.abort();return;}
    const response=await http.handle(new Request(request.url(),{
      method:request.method(),headers:await request.allHeaders(),
      ...(request.method()==='GET'?{}:{body:request.postData()??null}),
    }));
    const headers:Record<string,string>={};
    response.headers.forEach((value,key)=>{headers[key]=value;});
    await route.fulfill({status:response.status,headers,body:await response.text()});
  };
  await context.route('**/api/alpha?*',handle);
  await context.route('**/api/alpha',handle);
}

/** Mesa shell: the areas live in the Livro over the map. Opens it if needed and picks an area. */
export async function openArea(page:import('@playwright/test').Page,name:string){
  const livro=page.getByRole('dialog',{name:'Livro'});
  if(!(await livro.isVisible()))await page.getByRole('button',{name:'Livro',exact:true}).click();
  await livro.getByRole('button',{name,exact:true}).click();
}
/** Closes the Livro and returns to the map, if it is open. */
export async function toMap(page:import('@playwright/test').Page){
  const livro=page.getByRole('dialog',{name:'Livro'});
  if(await livro.isVisible())await livro.getByRole('button',{name:'Voltar ao mapa',exact:true}).click();
}

/** Test harnesses: silence the first-run tour and tips in this browser context. */
export async function muteTour(context:BrowserContext){await context.addInitScript(()=>{try{localStorage.setItem('aoh-tour-off','1');}catch{/* no storage */}});}

/** Interaction Model V2: a node of the Table cloud (born on the touched piece). */
export const cloudNode=(page:import('@playwright/test').Page,id:string)=>page.locator(`.ctx-node[data-node="${id}"]`);
/** Touches the player's own piece badge on a hex (a painted pixel of the badge: its bounding box also covers empty corners that hit the hex below). */
export async function touchPiece(page:import('@playwright/test').Page,hexSelector='g.hex'){
  const point=await page.evaluate(selector=>{
    for(const hex of Array.from(document.querySelectorAll(selector))){
      const stack=hex.querySelector('.art-stack.own');if(!stack)continue;
      const box=stack.getBoundingClientRect();
      for(let i=1;i<12;i++)for(let j=1;j<12;j++){const x=box.left+box.width*i/12,y=box.top+box.height*j/12,el=document.elementFromPoint(x,y);if(el?.closest('.art-stack.own')===stack)return {x,y};}
    }
    return null;
  },hexSelector);
  if(!point)throw new Error('no own piece badge found');
  await page.mouse.click(point.x,point.y);
}
/** Mover coordenado (D1): the Move is the draft of ONE Order on the Mesa; after the destination is touched, the Ficha's single button confirms it. */
export async function confirmMove(page:import('@playwright/test').Page){
  const go=page.locator('.ctx-ficha .ctx-go');
  await go.waitFor();
  await expect(go).toBeEnabled();
  await go.click();
}
/** Details ("Ver detalhes") are the only place for the full city catalog: opens the Inspector on the city tab with every action listed. */
export async function openCatalog(page:import('@playwright/test').Page){
  const inspector=page.locator('.alpha-inspector');
  const open=page.getByRole('button',{name:'Detalhes',exact:true});
  await inspector.or(open).first().waitFor();
  if(!(await inspector.isVisible()))await open.click();
  await inspector.getByRole('button',{name:'Cidade',exact:true}).click();
  const all=inspector.getByRole('tab',{name:'Ações',exact:true});
  if(await all.isVisible().catch(()=>false))await all.click();
}

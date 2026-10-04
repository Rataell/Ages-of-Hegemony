import type { BrowserContext } from '@playwright/test';
import type { AlphaHttp } from '../apps/server/src/alpha-http.js';

/** Real HTTP boundary, explicitly in-process transport for browser integration tests. */
export async function connectAlphaContext(context:BrowserContext,http:AlphaHttp){
  const handle=async(route:import('@playwright/test').Route)=>{
    const request=route.request();
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

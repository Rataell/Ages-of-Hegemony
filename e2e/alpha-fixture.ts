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

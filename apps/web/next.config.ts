import type { NextConfig } from 'next';
// The local vertical slice at "/" needs the development-only /api/local route. Closed alpha (production) sends everyone to /alpha.
const config:NextConfig={distDir:process.env.AOH_E2E==='1'?'.next-e2e':'.next',async redirects(){return process.env.NODE_ENV==='production'?[{source:'/',destination:'/alpha',permanent:false}]:[];}};
export default config;

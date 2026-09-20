import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export interface GuestPrincipal {readonly guestId:string}
const lifetimeSeconds=90*24*60*60;
/** Server-only signed identity; signing key must survive deploys. No player ID comes from JSON. */
export class GuestSessions {
  constructor(private readonly secret:string){if(Buffer.byteLength(secret)<32)throw new Error('ALPHA_SESSION_SECRET must contain at least 32 bytes.');}
  private signature(payload:string){return createHmac('sha256',this.secret).update(payload).digest('base64url');}
  issue(now:number):{token:string;principal:GuestPrincipal;maxAge:number}{
    const guestId=randomUUID(),payload=`${guestId}.${Math.floor(now/1000)+lifetimeSeconds}`;
    return {token:`${payload}.${this.signature(payload)}`,principal:{guestId},maxAge:lifetimeSeconds};
  }
  resolve(token:string|undefined,now:number):GuestPrincipal|null {
    if(!token||token.length>180)return null;
    const match=/^([a-f0-9-]{36})\.(\d{1,12})\.([A-Za-z0-9_-]{43})$/.exec(token);
    if(!match)return null;
    const [,guestId,expires,signature]=match;
    if(!guestId||!expires||!signature||Number(expires)<=Math.floor(now/1000))return null;
    const expected=Buffer.from(this.signature(`${guestId}.${expires}`)),actual=Buffer.from(signature);
    if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;
    return {guestId};
  }
}

import { sha256 } from '@noble/hashes/sha2.js';
import { hmac } from '@noble/hashes/hmac.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import type { AlphaState } from '@aoh/game-domain';

/** Deterministic server-side RNG. Public matches provide 256 bits of private entropy. */
export function alphaRandomInteger(state:Pick<AlphaState,'privateRng'>,exclusiveMaximum:number):number {
  if(!Number.isSafeInteger(exclusiveMaximum)||exclusiveMaximum<1||exclusiveMaximum>0x100000000)throw new RangeError('Invalid random range');
  const limit=0x100000000-(0x100000000%exclusiveMaximum);
  for(;;){
    if(state.privateRng.counter===Number.MAX_SAFE_INTEGER)throw new RangeError('Alpha RNG exhausted');
    const digest=hmac(sha256,hexToBytes(state.privateRng.seed),utf8ToBytes(`aoh-alpha-v1:${state.privateRng.counter++}`));
    const value=new DataView(digest.buffer,digest.byteOffset,digest.byteLength).getUint32(0);
    if(value<limit)return value%exclusiveMaximum;
  }
}
export function deterministicAlphaSeed(seed:number,gameId:string):string {
  return bytesToHex(sha256(utf8ToBytes(`local-aoh-alpha:${seed}:${gameId}`)));
}
export function combineAlphaSeed(publicSeed:number,privateSeed:string):string {
  return bytesToHex(hmac(sha256,hexToBytes(privateSeed),utf8ToBytes(`aoh-alpha-world:${publicSeed}`)));
}

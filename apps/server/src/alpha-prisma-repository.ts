import { Prisma, type PrismaClient } from './generated/prisma/client.js';
import { AlphaRoomSchema, type AlphaRepository, type AlphaRoom } from './alpha-room.js';
import { migrateSnapshotV4ToV5 } from '@aoh/game-engine';
const status=(room:AlphaRoom)=>room.game?.core.status??'LOBBY';
function decode(row:{id:string;joinCode:string;version:bigint;status:string;snapshot:unknown}|null):AlphaRoom|null {
  if(!row)return null;
  let parsed=AlphaRoomSchema.safeParse(row.snapshot);
  if(!parsed.success&&row.snapshot&&typeof row.snapshot==='object'){
    const raw=structuredClone(row.snapshot) as Record<string,unknown>;
    const game=migrateSnapshotV4ToV5(raw.game);
    if(game.ok){
      const oldTimer=Number(raw.planningSeconds??0);
      raw.planningSeconds=[0,180,300,480,3600,14400,28800].includes(oldTimer)?oldTimer:oldTimer<=900?480:28800;
      raw.worldPreset='MIXED';raw.game=game.value;parsed=AlphaRoomSchema.safeParse(raw);
    }
  }
  if(!parsed.success)throw new Error('Invalid alpha match snapshot');
  const room=parsed.data;
  if(room.id!==row.id||room.joinCode!==row.joinCode||BigInt(room.version)!==row.version||status(room)!==row.status)throw new Error('Corrupt alpha match metadata');
  return room;
}
export class PrismaAlphaRepository implements AlphaRepository {
  constructor(private readonly client:PrismaClient){}
  async find(id:string){return decode(await this.client.alphaMatch.findUnique({where:{id}}));}
  async findByCode(joinCode:string){return decode(await this.client.alphaMatch.findUnique({where:{joinCode}}));}
  async create(room:AlphaRoom){
    const snapshot=AlphaRoomSchema.parse(room);
    try{await this.client.alphaMatch.create({data:{id:room.id,joinCode:room.joinCode,version:BigInt(room.version),status:status(room),snapshot}});return true;}
    catch(error:unknown){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2002')return false;throw error;}
  }
  async save(room:AlphaRoom,expectedVersion:number){
    const snapshot=AlphaRoomSchema.parse(room);if(room.version!==expectedVersion+1)return false;
    const updated=await this.client.alphaMatch.updateMany({where:{id:room.id,version:BigInt(expectedVersion)},data:{version:BigInt(room.version),status:status(room),snapshot}});
    return updated.count===1;
  }
}

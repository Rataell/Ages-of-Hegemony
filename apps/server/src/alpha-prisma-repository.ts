import { Prisma, type PrismaClient } from './generated/prisma/client.js';
import { AlphaRoomSchema, roomStatus, type AlphaRepository, type AlphaRoom } from './alpha-room.js';
import { migrateSnapshotV4ToV5 } from '@aoh/game-engine';
const status=roomStatus;
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
/**
 * Stored format. A room WITHOUT bots is written exactly as the V1 baseline wrote it (no `bot`/`botPersona` keys on human seats), so rolling back to V1
 * keeps opening every room that has no bots. A room WITH bots carries `bot:true` seats: that is the V1.1+ format, and a V1 reader refuses it with its
 * normal controlled "invalid snapshot" failure (HTTP 503 for that request, nothing written, nothing deleted, process unaffected).
 */
export function encodeRoom(room:AlphaRoom):AlphaRoom {
  const parsed=AlphaRoomSchema.parse(room);
  return {...parsed,seats:parsed.seats.map(seat=>seat.bot?seat:{guestId:seat.guestId,playerId:seat.playerId,name:seat.name,civilization:seat.civilization,ready:seat.ready} as typeof seat)};
}
class StaleWrite extends Error {}
/** A stored payload that no longer parses as the current room is a legacy snapshot that this save is about to migrate. */
const needsMigration=(snapshot:unknown)=>!AlphaRoomSchema.safeParse(snapshot).success;
export const ARCHIVE_REASON_MIGRATED_TO_V5='MIGRATED_TO_V5';
export class PrismaAlphaRepository implements AlphaRepository {
  constructor(private readonly client:PrismaClient){}
  async find(id:string){return decode(await this.client.alphaMatch.findUnique({where:{id}}));}
  async findByCode(joinCode:string){return decode(await this.client.alphaMatch.findUnique({where:{joinCode}}));}
  async create(room:AlphaRoom){
    const snapshot=encodeRoom(room);
    try{await this.client.alphaMatch.create({data:{id:room.id,joinCode:room.joinCode,version:BigInt(room.version),status:status(room),snapshot}});return true;}
    catch(error:unknown){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2002')return false;throw error;}
  }
  /**
   * Compare-and-swap save. When the stored row is a legacy snapshot, its original JSON is copied to AlphaMatchArchive in the
   * same transaction, so the v5 rewrite can never destroy the only copy. Reads never write.
   */
  async save(room:AlphaRoom,expectedVersion:number){
    const snapshot=encodeRoom(room);if(room.version!==expectedVersion+1)return false;
    try{
      return await this.client.$transaction(async tx=>{
        const current=await tx.alphaMatch.findUnique({where:{id:room.id}});
        if(!current||current.version!==BigInt(expectedVersion))return false;
        if(needsMigration(current.snapshot))await tx.alphaMatchArchive.create({data:{matchId:room.id,version:current.version,reason:ARCHIVE_REASON_MIGRATED_TO_V5,snapshot:current.snapshot as Prisma.InputJsonValue}});
        const updated=await tx.alphaMatch.updateMany({where:{id:room.id,version:BigInt(expectedVersion)},data:{version:BigInt(room.version),status:status(room),snapshot}});
        if(updated.count!==1)throw new StaleWrite();
        return true;
      });
    }catch(error:unknown){
      if(error instanceof StaleWrite)return false;
      // A competing writer archived the same legacy version first: this write lost the race.
      if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2002')return false;
      throw error;
    }
  }
  /** Original snapshots kept for a match, oldest first. */
  async archived(matchId:string){
    const rows=await this.client.alphaMatchArchive.findMany({where:{matchId},orderBy:{version:'asc'}});
    return rows.map(row=>({version:Number(row.version),reason:row.reason,snapshot:row.snapshot as unknown}));
  }
}

import { z } from 'zod';
import { AlphaPresetSchema, AlphaStateSchema, CIVILIZATIONS, GameIdSchema, MapPresetSchema, NonNegativeIntegerSchema, PlayerIdSchema, SeedSchema } from '@aoh/game-domain';

export const AlphaRoomSchema=z.strictObject({
  id:GameIdSchema,version:NonNegativeIntegerSchema,name:z.string().trim().min(1).max(80),joinCode:z.string().regex(/^[A-Za-z0-9_-]{22}$/),
  hostGuestId:z.string().uuid(),preset:AlphaPresetSchema,worldPreset:MapPresetSchema.default('MIXED'),seed:SeedSchema,seatLimit:z.number().int().min(2).max(6),
  planningSeconds:z.union([z.literal(0),z.literal(180),z.literal(300),z.literal(480),z.literal(3600),z.literal(14400),z.literal(28800)]),
  deadline:z.number().int().nonnegative().nullable(),
  seats:z.array(z.strictObject({guestId:z.string().uuid(),playerId:PlayerIdSchema,name:z.string().trim().min(1).max(80),civilization:z.string().nullable(),ready:z.boolean()})).min(1).max(6),
  game:AlphaStateSchema.nullable(),
}).superRefine((room,ctx)=>{
  const fail=(message:string)=>ctx.addIssue({code:'custom',message});
  if(room.seats.length>room.seatLimit||!room.seats.some(s=>s.guestId===room.hostGuestId))fail('Invalid lobby host or seat count');
  for(const key of ['guestId','playerId'] as const)if(new Set(room.seats.map(s=>s[key])).size!==room.seats.length)fail('Duplicate seat identity');
  const civilizations=room.seats.map(s=>s.civilization).filter(c=>c!==null);
  if(new Set(civilizations).size!==civilizations.length||civilizations.some(c=>!CIVILIZATIONS.some(def=>def.id===c)))fail('Invalid civilization choice');
  if(room.seats.some(s=>s.ready&&s.civilization===null))fail('Ready seat requires civilization');
  if(room.game&&(room.game.gameId!==room.id||room.game.players.length!==room.seats.length||room.seats.some(s=>!room.game!.players.some(p=>p.playerId===s.playerId&&p.civilization===s.civilization))))fail('Lobby and match identity mismatch');
  if((!room.game||room.game.core.status==='FINISHED'||room.planningSeconds===0)&&room.deadline!==null)fail('Unexpected phase deadline');
});
export type AlphaRoom=z.infer<typeof AlphaRoomSchema>;
export const CreateAlphaRoomSchema=z.strictObject({name:z.string().trim().min(1).max(80),displayName:z.string().trim().min(1).max(80),preset:AlphaPresetSchema,worldPreset:MapPresetSchema.default('MIXED'),seatLimit:z.number().int().min(2).max(6),seed:SeedSchema,planningSeconds:AlphaRoomSchema.shape.planningSeconds});
export const LobbyActionSchema=z.discriminatedUnion('type',[
  z.strictObject({type:z.literal('CHOOSE_CIVILIZATION'),expectedVersion:NonNegativeIntegerSchema,civilization:z.string()}),
  z.strictObject({type:z.literal('LOBBY_READY'),expectedVersion:NonNegativeIntegerSchema,ready:z.boolean()}),
  z.strictObject({type:z.literal('START'),expectedVersion:NonNegativeIntegerSchema}),
]);

export interface AlphaRepository {
  find(id:string):Promise<AlphaRoom|null>;
  findByCode(code:string):Promise<AlphaRoom|null>;
  create(room:AlphaRoom):Promise<boolean>;
  save(room:AlphaRoom,expectedVersion:number):Promise<boolean>;
}
/** Test and local-development adapter. The runtime refuses it in production (see alpha-storage.ts). The map can be shared so a dev hot reload keeps the matches. */
export class InMemoryAlphaRepository implements AlphaRepository {
  constructor(private readonly rooms:Map<string,AlphaRoom>=new Map<string,AlphaRoom>()){}
  async find(id:string){const room=this.rooms.get(id);return room?AlphaRoomSchema.parse(room):null;}
  async findByCode(code:string){const room=[...this.rooms.values()].find(r=>r.joinCode===code);return room?AlphaRoomSchema.parse(room):null;}
  async create(room:AlphaRoom){const parsed=AlphaRoomSchema.parse(room);if(this.rooms.has(room.id)||[...this.rooms.values()].some(r=>r.joinCode===room.joinCode))return false;this.rooms.set(room.id,parsed);return true;}
  async save(room:AlphaRoom,expectedVersion:number){const parsed=AlphaRoomSchema.parse(room);if(room.version!==expectedVersion+1||this.rooms.get(room.id)?.version!==expectedVersion)return false;this.rooms.set(room.id,parsed);return true;}
}

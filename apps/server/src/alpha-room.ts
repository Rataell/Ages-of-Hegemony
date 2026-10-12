import { z } from 'zod';
import { COORDINATED_MOVE_MAX_PIECES, HexIdSchema, AlphaPresetSchema, AlphaStateSchema, CityPaceSchema, MatchReportV1Schema, CIVILIZATIONS, figuresOfCivilization, isCore10Chassis, GameIdSchema, MapPresetSchema, MapSizeSchema, NonNegativeIntegerSchema, PlayerIdSchema, MAP_FOOTPRINT, SeedSchema } from '@aoh/game-domain';

export const AlphaRoomSchema=z.strictObject({
  id:GameIdSchema,version:NonNegativeIntegerSchema,name:z.string().trim().min(1).max(80),joinCode:z.string().regex(/^[A-Za-z0-9_-]{22}$/),
  hostGuestId:z.string().uuid(),preset:AlphaPresetSchema,worldPreset:MapPresetSchema.default('MIXED'),mapSize:MapSizeSchema.default('STANDARD'),seed:SeedSchema,seatLimit:z.number().int().min(2).max(6),
  /** Content generation of the table. A room saved before RC 1.2 has none: it stays readable but read-only (see `isLegacyRoom`). */
  contentVersion:z.enum(['v1.1','v1.2']).default('v1.1'),
  actionsPerRound:z.number().int().min(3).max(6).default(5),
  /** City-ladder pace chosen at creation (RC5). ACCELERATED (experimental) only exists for short matches (QUICK, 21 rounds); it is persisted with the table and identified in the MatchReportV1. */
  pace:CityPaceSchema.default('STANDARD'),
  revealMap:z.boolean().default(false),
  planningSeconds:z.union([z.literal(0),z.literal(180),z.literal(300),z.literal(480),z.literal(3600),z.literal(14400),z.literal(28800)]),
  deadline:z.number().int().nonnegative().nullable(),
  seats:z.array(z.strictObject({guestId:z.string().uuid(),playerId:PlayerIdSchema,name:z.string().trim().min(1).max(80),civilization:z.string().nullable(),ready:z.boolean(),figureId:z.string().max(64).nullable().default(null),bot:z.boolean().default(false),botPersona:z.string().max(20).nullable().default(null)})).min(1).max(6),
  game:AlphaStateSchema.nullable(),
  /** External-alpha lifecycle (all optional on old snapshots). LOBBY / ACTIVE / SUSPENDED / FINISHED / CLOSED are derived by `lifecycleOf`. */
  suspended:z.boolean().default(false),
  closedReason:z.enum(['HOST','VOTE']).nullable().default(null),
  /** Civilizations EM GUARDA: kept on the table (cities, territory, pieces), confirm every phase without Orders until their person resumes. */
  onGuard:z.array(PlayerIdSchema).max(6).default([]),
  vote:z.strictObject({id:z.string().max(40),kind:z.enum(['REMOVE','END']),target:PlayerIdSchema.nullable(),proposer:PlayerIdSchema,yes:z.array(PlayerIdSchema).max(6),no:z.array(PlayerIdSchema).max(6),createdAt:z.number().int().nonnegative()}).nullable().default(null),
  /** Short public log of room-level events (host transfer, joins, votes…), newest last. */
  notices:z.array(z.strictObject({id:z.number().int().nonnegative(),at:z.number().int().nonnegative(),type:z.string().max(40),text:z.string().max(160)})).max(30).default([]),
  /** MatchReportV1, generated once when the match reaches FINISHED and stored with the room. Null until then (and for rooms finished before the report existed). Never rewritten. */
  report:MatchReportV1Schema.nullable().default(null),
}).superRefine((room,ctx)=>{
  const fail=(message:string)=>ctx.addIssue({code:'custom',message});
  if(room.seats.length>room.seatLimit||!room.seats.some(s=>s.guestId===room.hostGuestId))fail('Invalid lobby host or seat count');
  for(const key of ['guestId','playerId'] as const)if(new Set(room.seats.map(s=>s[key])).size!==room.seats.length)fail('Duplicate seat identity');
  const civilizations=room.seats.map(s=>s.civilization).filter(c=>c!==null);
  if(new Set(civilizations).size!==civilizations.length||civilizations.some(c=>!CIVILIZATIONS.some(def=>def.id===c)||(room.contentVersion==='v1.2'&&!isCore10Chassis(c))))fail('Invalid civilization choice');
  if(room.seats.some(s=>s.figureId!==null&&(s.civilization===null||!figuresOfCivilization(s.civilization).some(figure=>figure.id===s.figureId))))fail('Invalid Figura choice');
  if(room.contentVersion==='v1.2'&&room.seats.some(s=>s.civilization!==null&&s.figureId===null))fail('A civilization needs its Figura');
  if(room.seats.some(s=>s.ready&&s.civilization===null))fail('Ready seat requires civilization');
  if(room.game===null&&room.seatLimit>MAP_FOOTPRINT[room.mapSize].maxPlayers)fail('Map size does not fit the table');
  if(room.pace!=='STANDARD'&&room.preset!=='QUICK')fail('The accelerated pace is only for short (QUICK) matches');
  if(room.game&&room.game.rules.pace!==room.pace)fail('The match pace must match the table pace');
  if(room.game&&(room.game.gameId!==room.id||room.game.players.length!==room.seats.length||room.seats.some(s=>!room.game!.players.some(p=>p.playerId===s.playerId&&p.civilization===s.civilization))))fail('Lobby and match identity mismatch');
  if((!room.game||room.game.core.status==='FINISHED'||room.planningSeconds===0)&&room.deadline!==null)fail('Unexpected phase deadline');
});
export type AlphaRoom=z.infer<typeof AlphaRoomSchema>;
/** Rooms from before RC 1.2 (V1.1): the content they were played with changed, so they are shown read-only and never advanced. */
export const isLegacyRoom=(room:AlphaRoom):boolean=>room.contentVersion!=='v1.2';
export const LEGACY_ROOM_MESSAGE='Esta partida foi criada em uma versão anterior do Alpha (1.1) e agora é somente leitura. Crie uma nova sala para jogar com a versão atual.';
export type AlphaLifecycle='LOBBY'|'ACTIVE'|'SUSPENDED'|'FINISHED'|'CLOSED';
export const lifecycleOf=(room:AlphaRoom):AlphaLifecycle=>room.closedReason!==null?'CLOSED':!room.game?'LOBBY':room.game.core.status==='FINISHED'?'FINISHED':room.suspended?'SUSPENDED':'ACTIVE';
/** Stored status column: the engine status as before, plus the two room-level states. */
export const roomStatus=(room:AlphaRoom):string=>room.closedReason!==null?'CLOSED':room.suspended&&room.game?.core.status!=='FINISHED'?'SUSPENDED':room.game?.core.status??'LOBBY';
export const CreateAlphaRoomSchema=z.strictObject({name:z.string().trim().min(1).max(80),displayName:z.string().trim().min(1).max(80),preset:AlphaPresetSchema,worldPreset:MapPresetSchema.default('MIXED'),mapSize:MapSizeSchema.optional(),seatLimit:z.number().int().min(2).max(6),seed:SeedSchema,planningSeconds:AlphaRoomSchema.shape.planningSeconds,actionsPerRound:z.number().int().min(3).max(6).default(5),pace:CityPaceSchema.default('STANDARD'),revealMap:z.boolean().default(false)}).refine(input=>input.pace==='STANDARD'||input.preset==='QUICK',{message:'O ritmo acelerado só existe para partidas curtas.'});
/** Mover coordenado: body of the read-only preview. One path is the legacy Order (any stack up to 24 pieces); two or three are a coordinated Order. */
export const MovePreviewRequestSchema=z.strictObject({orderId:z.string().max(100).optional(),legs:z.array(z.strictObject({unitIds:z.array(z.string().min(1).max(100)).min(1).max(24),path:z.array(HexIdSchema).min(1).max(12),rotation:z.number().int().min(0).max(5).optional()})).min(1).max(COORDINATED_MOVE_MAX_PIECES)});
export const LobbyActionSchema=z.discriminatedUnion('type',[
  z.strictObject({type:z.literal('CHOOSE_CIVILIZATION'),expectedVersion:NonNegativeIntegerSchema,civilization:z.string()}),
  z.strictObject({type:z.literal('CHOOSE_FIGURE'),expectedVersion:NonNegativeIntegerSchema,figureId:z.string().max(64)}),
  z.strictObject({type:z.literal('LOBBY_READY'),expectedVersion:NonNegativeIntegerSchema,ready:z.boolean()}),
  z.strictObject({type:z.literal('START'),expectedVersion:NonNegativeIntegerSchema}),
  // Host-only, LOBBY only.
  z.strictObject({type:z.literal('KICK'),expectedVersion:NonNegativeIntegerSchema,playerId:PlayerIdSchema}),
  z.strictObject({type:z.literal('SET_SEATS'),expectedVersion:NonNegativeIntegerSchema,seatLimit:z.number().int().min(2).max(6)}),
  z.strictObject({type:z.literal('SET_WORLD'),expectedVersion:NonNegativeIntegerSchema,worldPreset:MapPresetSchema.optional(),mapSize:MapSizeSchema.optional()}),
  z.strictObject({type:z.literal('CLOSE_ROOM'),expectedVersion:NonNegativeIntegerSchema}),
  z.strictObject({type:z.literal('ADD_BOT'),expectedVersion:NonNegativeIntegerSchema}),
  z.strictObject({type:z.literal('REMOVE_BOT'),expectedVersion:NonNegativeIntegerSchema,playerId:PlayerIdSchema}),
]);
export const REACTIONS=['APPLAUSE','SURPRISE','THINKING','ATTENTION','CHEER','WATCHING'] as const;
export const PINGS=['MARK','ATTENTION'] as const;
/** Room-level actions of a running (or suspended) table. None of them is an Order; none can touch a civilization except the vote-approved EM GUARDA. */
export const RoomActionSchema=z.discriminatedUnion('type',[
  z.strictObject({type:z.literal('LEAVE')}),
  z.strictObject({type:z.literal('SUSPEND')}),
  z.strictObject({type:z.literal('RESUME')}),
  z.strictObject({type:z.literal('PROPOSE_REMOVE'),target:PlayerIdSchema}),
  z.strictObject({type:z.literal('PROPOSE_END')}),
  z.strictObject({type:z.literal('VOTE'),yes:z.boolean()}),
  z.strictObject({type:z.literal('CANCEL_VOTE')}),
  z.strictObject({type:z.literal('RESUME_SEAT')}),
  z.strictObject({type:z.literal('REACT'),reaction:z.enum(REACTIONS)}),
  z.strictObject({type:z.literal('PING'),hexId:z.string().regex(/^-?\d{1,3},-?\d{1,3}$/),reaction:z.enum(PINGS).default('MARK')}),
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

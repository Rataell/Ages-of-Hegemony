# Audio V1 (external Alpha)

All audio is original and procedurally synthesized in-repo with WebAudio. No audio files, no network, no third-party assets.
Code: `apps/web/app/alpha/audio/`. Defaults: music off, effects on at 0.6, nothing plays before the first user gesture.

## Register

| Sound | Origin | License |
|---|---|---|
| Music: "Mesa Aberta" generative ambient loop (slow triangle pad, D minor pentatonic, sparse soft sine notes through a feedback delay, seeded 1913, cycle 224 s) | original, procedurally synthesized in-repo (`music-score.ts`, `webaudio-backend.ts`) | project-owned (no external asset) |
| UI_SELECT, ORDER_PLANNED, ORDER_RESOLVED, PLAN_CONFIRMED, UNIT_MOVED, REACTION_RECEIVED, PLAYER_JOINED, PLAYER_RECONNECTED | original, procedurally synthesized in-repo | project-owned (no external asset) |
| REGION_REVEALED, CITY_FOUNDED, BUILD_DONE, RESEARCH_DONE, RESONANCE_FILLED, REPERCUSSION, ENCOUNTER, WORLD_EVENT, WORLD_PULSE, ERA_CHANGED | original, procedurally synthesized in-repo | project-owned (no external asset) |
| BATTLE_START, DICE_ROLL, DICE_RESULT_IMPACT/GUARD/MANEUVER/COMMAND/EMPTY, HIT, GUARD_BLOCK, UNIT_LOST, RETREAT, CITY_CAPTURED | original, procedurally synthesized in-repo | project-owned (no external asset) |
| CAMP_SPAWNED, RAID_ACTIVE, PIRATE_ACTIVE | original, procedurally synthesized in-repo | project-owned (no external asset) |

## Rules
- One engine: `audio-manager.ts` (`audioManager`). No `new Audio()` elsewhere.
- Overlap: per-event cooldown, polyphony cap 6, priority ERA > COMBAT > REPERCUSSION > WORLD_EVENT > BUILD > MOVE > UI; a lower priority is dropped within 250 ms of a higher one.
- Settings persist in `localStorage` key `aoh-alpha-audio-v1` (music on/off + volume, effects on/off + volume, mute all).
- Dice: the visual roll (<= 700 ms) is cosmetic and deterministic; it always ends on the server faces.

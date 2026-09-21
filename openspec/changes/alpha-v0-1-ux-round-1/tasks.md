## 1. Lobby and leaving
- [x] 1.1 Separate copy code / copy link with feedback; keep manual entry.
- [x] 1.2 "Sair da partida" in lobby and match; client-only; return to `/alpha`.

## 2. Create form
- [x] 2.1 World preset options in PT-BR, sent as `worldPreset`.
- [x] 2.2 Planning deadlines limited to schema values.

## 3. Atlas
- [x] 3.1 Frame from projected tiles plus padding; "Centralizar" fits the known area; pan/zoom limits.
- [x] 3.2 Collapsible council and inspector on desktop.
- [x] 3.3 No tile is drawn that the server did not project (test).

## 4. World size
- [x] 4.1 Audit; not supported; documented in design.md. No selector.

## 5. Gates
- [x] 5.1 Tests: copy code vs link, leave, worldPreset sent, planning options, 2-player lobby regression, fog of war.
- [x] 5.2 lint, typecheck, tests, build, `openspec validate --strict`; before/after screenshots.

## 6. Phase 1 · game shell foundation
- [x] 6.1 Desktop shell fills 100dvh with no page scroll; chrome 64 + 36 + 56 px; council and inspector keep a fixed header and scroll their own body with contained overscroll; other areas scroll only their region; gate: `e2e/alpha-shell-fullscreen.spec.ts` at 1366x768, 1440x900 and 1920x1080 with before/after screenshots.

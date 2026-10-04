## A. Design system as code
- [x] A1 `apps/web/app/design/tokens.json` from the artifacts and the current product values (dark first, light); gate: unit test that every product `var(--x)` used in `style.css`/`alpha.css` exists in the tokens.
- [x] A2 `scripts/design-system.mjs`: tokens.json → `tokens.css` (product) and the artifact folder; gate: test that `tokens.css` is up to date with `tokens.json`.
- [x] A3 `aoh.css` component classes (button, glass, strip, tray, card, seal, chip, eyebrow, sheet); gate: lint + visual check.
- [x] A4 Publish the AoH Design System artifact (README brand book, tokens, components with live previews from the table art, cover); gate: artifact renders.

## B. Type and base
- [x] B1 Load Cinzel, Source Sans 3 and Cormorant Garamond once in `layout.tsx`; `style.css` imports `design/tokens.css` instead of its own `:root`; gate: typecheck, e2e fullscreen.
- [~] B2 Remove literal colors from the Alpha CSS in favour of tokens; gate: test from A1 extended to literals in `alpha.css`.

## C. Mesa shell
- [x] C1 Strip replaces `.top-bar` + `.main-nav`; gate: e2e updated, fullscreen at 1366/1440/1920.
- [x] C2 Tray replaces the bottom bar; one gold; gate: e2e asserts one enabled `.primary` per state.
- [x] C3 Map full-bleed (no Council column); gate: map width ≥ 75% of the viewport at 1366×768.

## D. Cofre and Livro
- [x] D1 Cofre popover from the strip (resources, caps, forecast); gate: e2e opens and closes it.
- [x] D2 Livro overlay hosting the five areas; Esc and "Voltar ao mapa" close it; gate: e2e visits every area.

## E. Contextual card
- [x] E1 Card hosting city, territory and military bodies beside the selection; Council contents moved; gate: e2e plays a round through the card.

## F. Lobby and entry
- [x] F1 Entry and lobby restyled with the system; gate: e2e lobby + screenshots.

## G. Mobile
- [ ] G1 Sheets for card and Livro, drawer for the hand, no page scroll at 390×844; gate: e2e mobile.

## H. Gates
- [ ] H1 lint, typecheck, test, build, test:e2e, `openspec validate --strict`; evidence screenshots at 1366×768, 1440×900, 1920×1080, 390×844.

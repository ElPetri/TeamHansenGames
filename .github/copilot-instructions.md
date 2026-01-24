# Team Hansen Games - Copilot Instructions

## Big picture
- This repo is a static site with a hub page linking to two standalone games: [index.html](index.html) links to /balloon/ and /logic/.
- Each game is pure HTML/CSS/vanilla JS (no build step, no bundler). Open the HTML files directly or serve statically.
- Cloudflare Pages-style static hosting is implied by [wrangler.json](wrangler.json) (assets directory is the repo root).

## Game: Pop The Balloons (canvas shooter)
- Entry: [balloon/index.html](balloon/index.html) loads [balloon/script.js](balloon/script.js) and [balloon/style.css](balloon/style.css).
- Architecture: global state + classes (`Tank`, `Balloon`, `Dart`, `Particle`) and a `requestAnimationFrame` game loop (`gameLoop`). The loop only runs in `PLAYING` state.
- UI state is driven by DOM elements (start screen, upgrade menu, game-over screen). Toggling is done via `hidden` class and `gameState`.
- Upgrades and weapons are stored in the `upgrades` object; stats recalculation happens via `tank.recalcStats()`.
- Audio uses `AudioContext` and custom tone generators; mute state is `isAudioMuted`.
- Leaderboard is stored in `localStorage` under `popTheBalloons_leaderboard`.

## Game: Logic Gates Fun (drag-and-drop circuit builder)
- Entry: [logic/index.html](logic/index.html) loads [logic/levels.js](logic/levels.js) and [logic/script.js](logic/script.js).
- `levels.js` defines `LEVELS` (tutorial metadata and success conditions) and `GATE_INFO` (truth tables + evaluation). Keep these in sync when adding gates or levels.
- `script.js` manages all state (`gates`, `wires`, `history`) and renders DOM nodes into `#gate-layer` and SVG paths into `#wire-layer`.
- Signal propagation is centralized in `propagateSignals()`; any changes to gate behavior should go through `GATE_INFO` evaluate functions.
- Share/export encodes circuits to base64 in the URL query (`?circuit=...`). See `showShareModal()` and `loadFromURL()`.

## Conventions and patterns
- No modules: scripts rely on global variables and function scope. Avoid introducing `import`/`export` without adding a build step.
- DOM structure is tightly coupled to JS selectors (IDs/classes). Update HTML + JS together.
- CSS is game-specific and lives alongside each game; avoid sharing styles across games unless added to both games explicitly.

## Workflows
- No tests or build commands. Run by opening the HTML files or serving the repo statically.
- For quick manual testing, open [index.html](index.html) and follow links to the games.
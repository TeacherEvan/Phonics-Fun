# Phonics Fun — Agent / Contributor Instructions

**CRITICAL:** Reference these instructions first; fall back to search/bash only when something here is out of date.

Phonics Fun is a **Vite-built, vanilla-JS (ES modules) educational web game** for teaching children phonics (full A–Z). It ships as a **PWA** (service worker + manifest) with native Android packaging via **Capacitor**. Gameplay is space-themed: planets, asteroids, collision-driven feedback.

## Reality Check (current architecture)

- **Build system:** Vite (`vite.config.mjs`). `npm run build` → `dist/`. This is NOT a no-build static project anymore.
- **Package manager:** npm. `package.json` has `devDependencies` only (Vite, Vitest, ESLint, Prettier, Capacitor, TypeScript). There are **no runtime npm dependencies** — the game imports zero npm packages (pure DOM + Web Audio).
- **Tests:** Vitest with jsdom (`vitest.config.mjs`, `environment: 'jsdom'`). Specs live in `harness/tests/**/*.test.mjs`. Run `npm test`.
- **Lint:** ESLint flat config (`eslint.config.cjs`), scope `js/`. CI fails on ANY warning — keep it clean.
- **Android:** Capacitor (`capacitor.config.ts`), NOT the old Gradle `app/` Java project. Do not build `app/`; it is legacy.
- **Deploy:** Vercel from `main` (`vercel.json` sets CSP/security headers + JS MIME types). Not Docker-only.

## Local Dev Commands

```bash
npm ci            # install (Node 22+)
npm run dev       # Vite dev server
npm run build     # production build -> dist/
npm run preview   # serve dist/ locally
npm test          # Vitest suite (jsdom)
npm run coverage  # Vitest + coverage
npm run lint      # ESLint js/ (zero-warning gate)
npm run lint:fix  # auto-fix
npm run format    # Prettier js/
npm run gen:audio # regenerate phoneme/voice audio (scripts/generate-audio.cjs)
npm run gen:music # regenerate background music
```

## Project Layout (what matters)

- `index.html` — game entry; loads `js/main.js` as a module.
- `js/` — **the shipped runtime bundle** (only this code goes to players). 11 modules: main, audio-manager, event-bus, event-manager, collision-manager, particles, performance-utils, ui-utils, display-manager, android-benq-init, utils.
- `public/` — static assets served as-is: `sw.js` (service worker), `manifest.json`, `images/`, `sounds/`.
- `harness/` — **dev/test only, never shipped**: `tests/` (Vitest specs + manual HTML harnesses), `mcp-*.js` (Android diagnostic), `android-*.{js,html}` (BenQ/board harnesses), `legacy/` (retired asteroid.js/planet.js).
- `scripts/` — Node build helpers (`generate-audio.cjs`, `generate-music.cjs`). Use `.cjs` for CommonJS under `"type": "module"`.
- `docs/` — canonical documentation hub (`docs/ROADMAP.md` first). `docs/archive/` holds retired material.

## How to Add a Letter

1. Add the word list to `PHONICS_FUN_LETTER_DATA` in `js/main.js`.
2. Generate audio: `npm run gen:audio` (drops into `public/sounds/voices/...`).
3. Add art to `public/images/`.
4. Verify: `npm test && npm run lint && npm run build`.

## Testing Before Claiming Done

- Run `npm test` — all specs must pass (currently 105 passing / 4 skipped).
- Run `npm run lint` — zero warnings.
- Run `npm run build` — must produce `dist/index.html`.
- Manual smoke (optional): `npm run preview`, open the URL, play a level.

## Do NOT

- Do not add npm packages to `dependencies` — the runtime uses none. If you need a build/test tool, add it to `devDependencies` and run `npm install`.
- Do not edit files under `harness/legacy/` expecting them to affect gameplay (they are not imported).
- Do not attempt the Gradle `app/` Android build — it is legacy/superseded by Capacitor.
- Do not reintroduce the duplicated `Docs/` (uppercase) directory — canonical docs are `docs/`.

## File References

- Audio logic: `js/audio-manager.js`
- Collision: `js/collision-manager.js`
- State/screens/vocabulary: `js/main.js`
- Docs hub: `docs/ROADMAP.md`

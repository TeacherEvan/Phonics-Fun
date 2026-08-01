# Phonics Fun

A space-themed educational web game that teaches children the **full A–Z** letter sounds through adaptive, interactive gameplay. Ships as an installable **PWA** with native Android packaging via **Capacitor**, offline support, teacher data export, and adaptive difficulty.

Live demo: deployed to Vercel from `main` (see `vercel.json` for headers/MIME config).

## Features

- **A–Z letter curriculum** — `js/main.js` holds the full `PHONICS_FUN_LETTER_DATA` vocabulary map.
- **Adaptive difficulty** — gameplay adjusts to the learner.
- **Space-themed gameplay** — planets, asteroids, collision-driven feedback.
- **Enhanced audio** — Web Audio API + speech-synthesis voice fallback (`js/audio-manager.js`).
- **Event-driven architecture** — `event-bus.js` / `event-manager.js` / `collision-manager.js`.
- **PWA + offline** — service worker (`public/sw.js`) + `public/manifest.json`.
- **Native Android** — Capacitor wrapper (`capacitor.config.ts`); build via `@capacitor/cli`.
- **Teacher export** — classroom data export (see harness/diagnostic tooling).
- **Accessibility** — responsive, touch + mouse, reduced-motion aware.

## Quick Start

```bash
npm ci            # install dev dependencies (Node 22+)
npm run dev       # local dev server (Vite)
npm test          # run the Vitest suite (105 tests)
npm run lint      # ESLint on js/
npm run build     # production build -> dist/
npm run preview   # serve the production build locally
```

Open the Vite dev URL (or the `preview` URL) in a browser to play.

## Project Structure

```plaintext
phonics-fun/
├── index.html              # Game entry (loads js/main.js as a module)
├── css/styles.css          # All styles and animations
├── js/                     # Runtime game bundle (the only code shipped to players)
│   ├── main.js             # Core controller: state, screens, A–Z vocabulary
│   ├── audio-manager.js    # Web Audio + speech-synthesis voice fallback
│   ├── event-bus.js        # Pub/sub event backbone
│   ├── event-manager.js    # Event coordination
│   ├── collision-manager.js# Asteroid/planet collision detection
│   ├── particles.js        # Explosion / trail particle system
│   ├── performance-utils.js# Preload + web-vitals instrumentation
│   ├── ui-utils.js         # Image loading, skeletons, toasts
│   ├── display-manager.js  # Display-category detection
│   ├── android-benq-init.js# Android / BenQ board shims (runtime)
│   └── utils.js            # Shared helpers (debounce, etc.)
├── public/                 # Static assets served as-is
│   ├── sw.js               # Service worker (PWA offline)
│   ├── manifest.json       # PWA manifest
│   ├── images/             # Letter/word art
│   └── sounds/             # Generated audio (phonemes, voices, effects)
├── harness/                # Dev/test tooling — NOT shipped to players
│   ├── tests/              # Vitest specs (*.test.mjs) + manual HTML harnesses
│   ├── mcp-*.js            # Android compatibility diagnostic harness
│   ├── android-*.js/html   # BenQ / Android board test harnesses
│   └── legacy/             # Retired architecture samples (asteroid.js, planet.js)
├── scripts/                # Node build helpers (generate-audio.cjs, generate-music.cjs)
├── docs/                   # Canonical documentation (see docs/ROADMAP.md)
├── capacitor.config.ts     # Native Android (Capacitor) config
├── vercel.json             # Vercel deploy: headers + JS MIME types
├── vite.config.mjs         # Vite build config
├── vitest.config.mjs       # Test config (harness/tests/**)
├── eslint.config.cjs       # Lint rules (zero-warning gate in CI)
└── package.json            # Scripts + devDependencies (no runtime npm deps)
```

> **Note on `app/` and legacy artifacts:** a native Android *Java* project under `app/` (Gradle) and several `*.ps1` voice generators + an `Assets/` folder are legacy from an earlier architecture. The current product is the web PWA (Capacitor-based). See `docs/archive/android-migration-java.md` for the historical record. Do not build `app/` — use Capacitor instead.

## How to Play

1. **Welcome screen** — tap/click *Start Game*.
2. **Letter select** — pick any letter A–Z (adaptive difficulty applies).
3. **Gameplay** — tap planets showing the target letter; correct hits launch a fiery asteroid + explosion + phoneme sound + "X is for [Word]!" voice.
4. Complete the required hits to finish the level.

## Development

### Adding a letter
1. Add the word list to `PHONICS_FUN_LETTER_DATA` in `js/main.js`.
2. Drop phoneme/voice audio into `public/sounds/` (generate via `npm run gen:audio`).
3. Add art to `public/images/`.
4. Run `npm test && npm run lint && npm run build`.

### Audio assets
Regenerate voices/effects with the Node helper:
```bash
npm run gen:audio     # phonemes + voice words + effects
npm run gen:music     # background loop
```

## Testing & CI

- `npm test` — Vitest (jsdom). 105 passing / 4 skipped.
- `npm run lint` — ESLint, **hard zero-warning gate** in CI.
- GitHub Actions (`.github/workflows/ci.yml`): lint → test (with coverage) → build → `npm audit` → quality gate.

## Deployment

- **Web:** Vercel auto-deploys `main`. `vercel.json` sets CSP/security headers and correct JS MIME types.
- **Android:** Capacitor. `npx cap add android` then `npx cap sync && npx cap open android` (requires Android Studio for the final build/sign).

## Documentation

All docs live under `docs/` (canonical hub). Start with `docs/ROADMAP.md`. Historical/retired material is in `docs/archive/`.

## License

Educational use. Free to use and modify for learning and teaching.

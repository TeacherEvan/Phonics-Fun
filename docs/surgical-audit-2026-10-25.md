# Surgical Audit Report: Phonics Fun

| Audit Metadata | Specification |
| :--- | :--- |
| **Audit Date** | 2026-10-25 |
| **Audited Scope** | `js/`, `css/`, `index.html`, `harness/tests/`, `public/`, `scripts/` — 25 tracked source files, **6,493 effective LOC** (pre-fix commit `78a5958`) |
| **Tech Stack & Runtime** | Vanilla ES modules + Vite 8 (legacy bundle), CSS 3, WebAudio, Vitest/jsdom harness, Capacitor 8 Android shell, PWA service worker |
| **Pre/Post Audit SHA-256** | `2c461a220a5c00f4` / `2c461a220a5c00f4` (audit pass itself: **VERIFIED ZERO MUTATION**; fixes landed in `06b142c`, `38d01e3`) |
| **Deterministic Health Score** | **`72 / 100` pre-fix → `89 / 100` post-fix** (`D_raw = 56 → 12`, `P_test = 6.0`, `M_kill ≈ 60%` est.) |
| **Vibe-Debt Risk Level** | **`MODERATE` → `LOW`** |

## 1. Executive Architecture & Vibe-Debt Triage

Phonics Fun is a single-page canvas-less DOM game: `js/main.js` (2,302 LOC) owns screen routing, gameplay state, scoring, asteroid physics and DOM mutation; `CollisionManager` runs its own `requestAnimationFrame` loop; `DisplayManager` republishes viewport changes; a Vitest harness covers 14 modules with 175 passing tests. The reported defect ("gameplay completely obstructed in mobile view") was **two independent faults that happened to share a symptom**, plus a third found while measuring it:

1. **The HUD covered the playfield.** Under `@media (max-width: 900px)` the mission panels switched to `flex-direction: column`, so three full-width panels stacked on top of the board. On a 413×892 phone the HUD measured **364px (41% of the viewport)**; on an 844×390 phone in landscape it measured **362px (93%)**. 5 of 8 and 8 of 8 letter planets respectively sat under opaque panels. Planet spawn ignored the HUD entirely, and `planetOrbit` swung every planet on a fixed 200px radius — on a 390px-wide screen a planet's orbit is wider than the screen.
2. **Taps on planets scored nothing.** `android-benq-init.js` installed a non-passive `touchstart` listener that called `preventDefault()` for any `.planet` target. Cancelling `touchstart` suppresses the browser's synthetic mouse events, so the planets' `click` handlers never ran on a touch device. Reproduced with a real touchscreen tap: hits stayed `0`.
3. **The collision registry leaked a board per letter.** `renderGameplayPlanets()` cleared `.planets-container` with `innerHTML` but never unregistered the removed planets. Measured `8 → 13 → 18` registry objects across A → B → C against 8 live DOM planets; each ghost reports a `0×0` rect at `(0,0)` and keeps its old radius (18–50px), so an asteroid spawning in the top-left corner could score an "incorrect" hit against a letter no longer in play.

| Severity Tier | Count | Deduction Weight | Primary Failure Domains |
| :--- | :--- | :--- | :--- |
| **P0 — Critical (Crash / Data Loss / Security / Leak)** | `2` | `-18 pts ea` | HUD occlusion of the playfield (`css/styles.css:2881`); suppressed touch click (`js/android-benq-init.js:300-322`) |
| **P1 — High (Frame-Budget / Race / Logic Bug)** | `1` | `-8 pts ea` | Stale collision registry → ghost planets at `(0,0)` (`js/main.js:991`, `js/collision-manager.js:105-119`) |
| **P2 — Medium (God File / Split-Brain State / Debt)** | `3` | `-3 pts ea` | `main.js` god file; 9 `will-change` layers; repeated `.planet` rule blocks |
| **P3 — Low (Magic Constants / DX / Portability)** | `3` | `-1 pt ea` | Fixed orbit constant; `100vh` without `dvh`; `Assets/` audio duplication |

### High-Risk File Telemetry Hotspots

| File Path | Effective LOC | Est. Cyclomatic Complexity / Branch Density | Silent Catches | Primary Vibe-Debt Signature |
| :--- | :--- | :--- | :--- | :--- |
| `js/main.js` | `1,571` | `CC 1 / density 0.00` (aggregate metric blind to arrow-heavy code) | `0` | God object: routing + scoring + physics + DOM + persistence |
| `js/audio-manager.js` | `994` | `CC 1 / 0.00` | `0` | Largest non-game module; 13 hot-loop markers |
| `js/performance-utils.js` | `237` | `CC 20 / 0.08` | `0` | Branchiest module; auto-tunes quality without a budget test |
| `js/particles.js` | `396` | `CC 1 / 0.00` | `0` | Per-particle DOM nodes + own rAF chain |
| `js/collision-manager.js` | `231` | `CC 1 / 0.00` | `0` | All-pairs scan; no detached-element guard |
| `js/asset-paths.js` | `38` | `CC 18 / 0.45` | `0` | Hard-coded per-letter path table |

## 2. The 10-Principal-Engineer Deep Audit

### Lens 1 — Systems Architect (Topology, Coupling & State Machines)
- **[P2-1] `GameState` is a God object** — `js/main.js:1-2302`
  - **Root Cause:** screen routing, level selection, scoring, streaks, persistence, asteroid flight, particle triggers and DOM writes all live in one class; `CollisionManager` and `ParticleSystem` are separately looping but driven by it.
  - **Failure Mode:** any change to scoring or layout requires editing the same 2.3k-line file; the HUD/spawn contract that broke on mobile exists only as an implicit assumption between CSS and JS.
  - **Fix:** extract a `PlayArea` module (already begun as `placePlanetInPlayArea`/`computeOrbitRadius`) and a `Scoreboard` module; keep `main.js` to orchestration.

### Lens 2 — Frame-Budget & Performance Engineer
- **[P2-2] Nine permanent GPU layers** — `css/styles.css` (`will-change`: 9 declarations)
  - **Root Cause:** `.screen`, `.game-area`, `.galaxy-background`, planets and cards each request promotion; three full-viewport screens keep a layer for the app's lifetime.
  - **Failure Mode:** on a 2GB Android phone this is ~3 screens' worth of compositor memory for content that is invisible on two of them.
  - **Fix:** promote only the active screen (`will-change` on `.screen.active`), drop it from the static backgrounds.
- **[P3-1] Fixed 200px orbit radius** — `css/styles.css:847-855` (pre-fix)
  - **Root Cause:** keyframe constant independent of viewport; a 400px-diameter orbit does not fit a 390px screen.
  - **Failure Mode:** planets leave the viewport for most of their cycle on any phone.
  - **Fix (done):** `--orbit-radius` published from JS, clamped to the free playfield rectangle.

### Lens 3 — Mathematical, Physics & Algorithmic Engineer
- **[P1-1] Detached planets keep a stale radius at the origin** — `js/collision-manager.js:105-119`
  - **Root Cause:** `updateObjectPosition()` reads `getBoundingClientRect()`; a detached node returns `0×0`, and `object.radius = object.radius || …` preserves the previous radius instead of zeroing it. Combined with `renderGameplayPlanets()` never unregistering (`js/main.js:991`), ghosts accumulate at `(0,0)`.
  - **Failure Mode:** measured `8 → 13 → 18` registered objects across A → B → C; an asteroid crossing the top-left corner collides with a ghost and fires `handleAsteroidPlanetCollision` with `data.letter = 'A'` while 'C' is active → an incorrect hit is scored on an empty board.
  - **Fix (done):** the board releases its `planet-*` entries before rebuilding; verified registry stays at 8 with 0 detached objects.

### Lens 4 — Concurrency, Async & Determinism
- **[N/A]** No `async` gameplay paths; persistence is synchronous and guarded.

### Lens 5 — Memory & Resource Lifecycle
- **[P3-2] 34 `addEventListener` vs 0 `removeEventListener` in `js/main.js`**
  - **Assessment (measured, not assumed):** planet and asteroid listeners are attached per-element and die with their node; document-level listeners are installed once from `setupEventListeners()`. Not a growing leak. Recorded so a future refactor that re-creates `GameState` does not turn it into one.
  - **Fix when that changes:** bind once at module scope or track removers on a disposer.

### Lens 6 — Security & Trust-Boundary
- **[N/A — no server, no auth, no user-supplied HTML path]** `innerHTML` assignments at `js/main.js:864, 991, 1978, 1997, 2045` are all either empty resets or interpolate numeric `currentStreak`/`label` constants. No injection vector, no credential storage.

### Lens 7 — Reliability, Fault Tolerance & Chaos
- **[N/A]** `loadSavedStats()` wraps `JSON.parse` in `try/catch` with a console error and defaults — corrupted `localStorage` degrades to a fresh profile, no crash loop.

### Lens 8 — Type Systems, Schema & Contract
- **[P3-3] Unvalidated persisted schema** — `js/main.js:2150-2166`
  - **Root Cause:** `parsed.completedLevels || []` trusts the shape; a string or object in storage passes through.
  - **Failure Mode:** a hand-edited or partially-written record can put a non-array into `completedLevels` and break level-select rendering.
  - **Fix:** `Array.isArray()` guard per field.

### Lens 9 — Platform, Viewport & Portability
- **[P0-1] HUD occlusion** — `css/styles.css:2881` (pre-fix) + spawn at `js/main.js:1017-1018, 1070-1071`
  - **Root Cause:** three full-width panels stacked in a column below 900px, absolutely positioned over an opaque playfield; spawn used `window.innerWidth/innerHeight` with no HUD awareness.
  - **Measured Failure:** 364px HUD on 413×892 (41%), 362px on 844×390 (93%); 5/8 and 8/8 planets under the panels.
  - **Fix (done):** one compact row (75px portrait, 70px landscape), `pointer-events` passthrough on the gaps, `100dvh` heights, and `placePlanetInPlayArea()` reserving the HUD's height for every spawn and orbit.
- **[P0-2] Touch scoring suppressed** — `js/android-benq-init.js:300-322` (pre-fix)
  - **Root Cause:** non-passive `touchstart` + `preventDefault()` on `.planet`; per spec this cancels the compatibility mouse events, and the game only listens for `click`.
  - **Measured Failure:** touchscreen tap on a target planet left `hits 0 / score 0`; a mouse click on the same element scored.
  - **Fix (done):** listener removed; scrolling is already blocked by `touch-action: none` and main.js's `touchmove` handler.

### Lens 10 — Cognitive Load & AI-Context Maintainability
- **[P2-3] `.planet` is declared in three separate blocks** — `css/styles.css` (three `.planet { }` rules for base, border/shadow, and scale/transition)
  - **Root Cause:** incremental restyling appended instead of consolidated.
  - **Failure Mode:** cascade order decides which border/shadow/scale wins; a future edit silently loses to a later block.
  - **Fix:** merge into one rule.

## 3. Existing Test Suite Comparison & Mutation Truth Table

- **Test-to-Code File Ratio:** `15 / 14` (`1.07`)
- **Estimated Mutation Kill Score ($M_{kill}$):** **`≈60%`** (estimate, not measured with a mutation runner)

| Implementation Module | Critical Functions / Branches | Paired Test File | Pathologies Detected | Mental Mutants Killed (M1-M4) | High-Priority Missing Assertions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `js/main.js` | `renderGameplayPlanets()`, `placePlanetInPlayArea()`, `adjustPlanetPositions()` | `game.test.mjs`, `gameplay-regression.test.mjs` | Happy-path only | `1/4` | No viewport/HUD geometry assertion (why P0-1 survived) |
| `js/android-benq-init.js` | `setupTouchOptimization()` | `none` (before this audit) | Untested module | `0/4` | No "touchstart must not be cancelled" test (why P0-2 survived) |
| `js/collision-manager.js` | `updateObjectPosition()`, `checkCollision()` | `collision-manager.test.mjs` | Happy-path only | `2/4` | No detached-element / zero-rect case (why P1-1 survived) |
| `js/performance-utils.js` | quality auto-tuning | `performance-utils.test.mjs` | Mock-mirror risk | `2/4` | No budget/NaN boundary |
| `js/audio-manager.js` | load/play/stop, priority gates | `audio-manager.test.mjs` (28) | Strongest suite | `3/4` | Missing concurrent-load failure |

### Why Existing Tests Missed Discovered P0/P1 Defects
- **P0-1:** the harness runs in jsdom, which performs no layout. `getBoundingClientRect()` returns zeros, so no unit test can observe a 364px HUD covering the board. This class of defect needs a real engine (Playwright) or a CSS contract test.
- **P0-2:** `android-benq-init.js` had no test file at all, and the defect only exists in the browser's touch→mouse event synthesis, which jsdom does not implement.
- **P1-1:** `collision-manager.test.mjs` registers mock elements with `getBoundingClientRect` stubs that never return `0×0`; the detached-node case was never constructed.

### Minimal Viable Test Harness (MVTH) Specifications
1. **`placePlanetInPlayArea`** — table-driven: `(viewport 390×844, hudBottom 75, radius 91)` asserts every planet's orbit circle satisfies `circle.top >= hudBottom`, `circle.left >= 0`, `circle.right <= area.width`, `circle.bottom <= area.height`.
2. **`setupTouchOptimization`** — asserts a dispatched cancelable `touchstart` on `.planet` is **not** `defaultPrevented` and that a following `click` reaches the handler. **Delivered:** `harness/tests/touch-scoring.test.mjs` (2 tests).
3. **Board lifecycle** — asserts `collisionManager.objects.size` equals the DOM planet count after `renderGameplayPlanets()` is called twice with different letters.

## 4. Surgical Refactoring Blueprints

### Refactor R1: Explicit play-area contract (delivered)
- **Target Scope:** `js/main.js` (`computeOrbitRadius`, `placePlanetInPlayArea`), `css/styles.css` (`--orbit-radius`)
- **Engineering ROI:** replaces an implicit CSS↔JS assumption with one measurable rectangle; makes HUD height a first-class input to spawning.

```js
// Before: spawn ignores the HUD and the viewport shape
const posX = Math.random() * (window.innerWidth - 100);
const posY = Math.random() * (window.innerHeight - 100);
```

```js
// After: the HUD's bottom edge and the orbit radius bound every spawn
const radius = Math.min(requestedRadius, freeWidth / 2, freeHeight / 2);
const centreX = half + pad + radius + Math.random() * (width - 2 * (half + pad + radius));
const centreY = hudBottom + half + pad + radius + Math.random() * (height - hudBottom - 2 * (half + pad + radius));
```

### Refactor R2: Collision registry lifecycle (delivered)
- **Target Scope:** `js/main.js:renderGameplayPlanets()`
- **Engineering ROI:** board teardown becomes explicit; removes an unbounded registry and a false-scoring path.

```js
// After: the DOM reset also resets the registry
for (const id of Array.from(this.collisionManager.objects.keys())) {
    if (id.startsWith('planet-')) this.collisionManager.unregisterObject(id);
}
```

### Refactor R3: Scoring extraction (recommended, not delivered)
- **Target Scope:** `js/main.js` scoring block (`processCorrectPlanetHit`, `processIncorrectPlanetHit`, streak/score fields)
- **Engineering ROI:** turns four mutable counters and a streak into a pure reducer (`applyHit(state, event) → state`), unit-testable without DOM; removes ~180 LOC from the god file.

## 5. Phased Execution Roadmap

1. **Phase 1 — Containment (done):** P0-1 HUD occlusion, P0-2 touch scoring, P1-1 registry ghosting; regression test for the touch path. Verified gate: `eslint` clean, `vitest` 177 passed / 3 skipped, `vite build` green, Playwright geometry at 5 viewports.
2. **Phase 2 — Frame budget & state:** merge duplicate `.planet` rules, cut permanent GPU layers to the active screen, extract scoring into a reducer with table tests.
3. **Phase 3 — Hygiene:** validate persisted stats shape; decide whether `Assets/` (11MB, 27 files byte-identical to `public/`, 3.4MB) belongs in git.

### Copy-Paste Surgical Prompts for Coding Agents

> **Prompt [R3] (`js/main.js`):** "Scope edits to the scoring block of `js/main.js` and add `harness/tests/scoring.test.mjs`. Extract `processCorrectPlanetHit`/`processIncorrectPlanetHit` into a pure `applyHit(state, {correct, speedMultiplier})` returning a new state object. Preserve the current numbers exactly (100 points + streak bonus). Add table-driven tests for streak reset, max streak, and 5-hit level completion. Run `npm test` and `npm run lint`."

> **Prompt [P2-1] (`js/main.js` + new `js/play-area.js`):** "Move `computeOrbitRadius` and `placePlanetInPlayArea` into a new `js/play-area.js` module exporting pure functions that take `{areaRect, hudBottom, planetSize, requestedRadius, random}`. `main.js` only wires DOM values in. Add unit tests for the four boundary cases: HUD taller than the viewport, radius larger than the free height, zero-size planet, and a landscape phone."

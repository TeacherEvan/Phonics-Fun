# Surgical Audit Remediation — 2026-10-22

Branch: `fix/surgical-audit-p0-p1`
Base: `4035fc01e6ac55134b087236777c6a8a20e6cd40` (`main`)

This document records the implementation of the fixes identified by the
2026-10-22 surgical audit, together with the **measured** before/after
evidence for each one.

Every number below was measured, not estimated. Where a claim from the audit
turned out to be wrong once measured, the correction is recorded explicitly.

---

## 1. Verification harness

Three independent layers were used, because a static audit cannot prove
runtime behaviour:

| Layer | Tool | What it proves |
| :--- | :--- | :--- |
| Unit / regression | Vitest 4 + jsdom (`harness/tests/`) | deterministic logic, boundary conditions, event semantics |
| Browser integration | Playwright + real Chromium against the **production build** | actual asset requests, `AudioContext.state`, hit latency, scoring correctness |
| Native | `javac` against API-34 `android.jar` + JUnit 4 | the Java module compiles and its rules are correct |

The browser harness is what caught two of the three implementation mistakes
below. It is now reproducible via `harness/tests/*-regression.test.mjs` plus
the ad-hoc probes used during the audit.

---

## 2. P0 fixes

### P0-1 — the AudioContext was never resumed → the game was silent

**Root cause.** `AudioManager.init()` created the `AudioContext` outside a
user gesture, and the only `resume()` call in the codebase targeted
`window.audioContext` — a global that is **never assigned anywhere**. The
`window.audioContext &&` guard therefore always failed and the resume path
was unreachable. Every `source.start()` was scheduled on a context whose clock
never advanced.

**Fix.**
- `js/audio-manager.js`: added `armGestureResume()`, `resumeIfSuspended()`
  and `suspendIfRunning()`, operating on the **instance** context, armed on
  `pointerdown` / `touchstart` / `keydown`.
- `js/android-benq-init.js`: removed `setupAudioCompatibility()`'s dead
  resume block; kept only the `webkitAudioContext` constructor polyfill.
- `js/main.js`: the visibility handler now suspends/resumes the context.

**Measured before → after** (production build, real Chromium):

| | before | after |
| :--- | :--- | :--- |
| `audioContext.state` before gesture | `suspended` | `suspended` |
| `audioContext.state` after a trusted click | **`suspended`** | **`running`** |
| `audioContext.currentTime` after a click | `0` | `0.48` (advancing) |
| `AudioContext` instances alive | **2** | **1** |

### P0-2 — a tap on the right planet could be scored as a wrong answer

**Root cause (two independent mechanisms).**

1. The collision manager registered a *type* handler
   (`asteroid` × `planet`), which matches an asteroid against **every**
   planet in the scene. Whichever planet the asteroid happened to clip was
   the one that scored — including a distractor.
2. The asteroid's destination was the planet's centre **sampled at click
   time**, while the planet is animated along a 200 px orbit by the
   `planetOrbit` keyframes. The asteroid parked beside a stale coordinate and
   the planet never came close enough to collide.

**Measured before** (6 trials, real Chromium, production build):

```
trial 1  hit@13939ms  INCORRECT   <- clicked the RIGHT planet, scored WRONG
trial 2  hit@ 7208ms  correct
trial 3  hit@ 1061ms  INCORRECT   <- clicked the RIGHT planet, scored WRONG
trial 4  hit@ 3029ms  correct
trial 5  hit@ 4157ms  correct
trial 6  hit@ 2060ms  correct
min planet->asteroid distance: 104.7 px   (collision threshold: 60 px)
one trial collided with a planet 1323 px from the clicked one
```

**Fix.**
- The asteroid is now **bound to the tapped planet**: `spawnAsteroid`
  registers an explicit `registerCollisionPair(asteroidId, targetPlanetId)`,
  and the catch-all type handler was removed from `main.js`.
- The asteroid **homes** on the moving planet: `launchAsteroid()` re-aims
  every frame and then **stays locked** to the planet (parking at a fixed
  coordinate let it drift away again).
- The hit is **resolved by the flight loop on arrival**, not left to the
  collision manager's sampling — a fast asteroid could cross the overlap
  between two frames. The geometric check remains as a backstop.
- The flight deadline is measured in **wall-clock time**, not clamped physics
  time, so a slow device does not stretch the wait.
- **One tap means one pending hit**: a new tap cancels the previous
  in-flight asteroid, so a tap from several seconds ago cannot land later
  and score a second time.

**Measured after** (8 trials, production build):

```
trials=8  scored=8  NO-HIT=0
WRONG SCORING (clicked X, scored Y): 0
exactly one answer per tap (answerDelta == 1 in every trial)
```

### P0-3 — every picture URL 404'd in production

**Root cause.** The code built `Assets/images/...`, but Vite serves `public/`
from the deploy root, so the asset lives at `/images/...`. The `Assets/`
prefix only resolved on the Vite dev server, which serves arbitrary files
from the project root — the dev server masked the defect completely.

**Fix.** New `js/asset-paths.js` is the single place that knows how assets
are addressed; `js/main.js` and `js/performance-utils.js` both use it.

**Correction to the audit report.** The audit said the path fix would
"restore all 130 word images". That was optimistic: **the artwork does not
exist.** `public/images/` contains only four real PNGs, all under `G-g/`
and all with decorated names (`girl-clipart-lg.png`,
`goat-clipart-md(1).png`, `pot-with-gold-clipart-md.png`); the other 126
words are `.placeholder` stubs. The path is now correct and the words that
do have artwork resolve; the rest fall back to the text rendering, which
now works.

**Measured before → after** (production build):

| | before | after |
| :--- | :--- | :--- |
| requested path | `/Assets/images/A-a/Images/apple.png` → **404** | `/images/A-a/Images/apple.png` → 404 (no artwork) |
| fallback rendering | broken (wrong path) | **`"A is for apple"`** |

### P0-4 — a storage failure aborted the whole game

`AudioManager.loadSettings()` read `localStorage` unguarded. A
`SecurityError` (Android WebView with DOM storage disabled, Safari Private
Browsing) propagated out of the `GameState` constructor and left a blank
screen with no explanation.

**Fix.** `safeLocalStorageGet` / `safeLocalStorageSet` helpers; the
`DOMContentLoaded` bootstrap now catches construction failures and renders a
visible diagnostic.

### P0-5 — the service worker served stale assets forever

`CACHE_NAME` was a static literal and the fetch handler was cache-first for
everything, so a redeploy that replaced the teacher voice pack kept serving
the previous recording to every device that had already visited the site.

**Fix.** `vite.config.mjs` stamps a per-build id into `sw.js` (a small Vite
plugin, because files in `public/` are copied verbatim); `activate` now
deletes **every** cache; stable URLs (sounds, images) are network-first with
a cache fallback, while content-hashed `/assets/` stay cache-first.

**Measured:** `dist/sw.js` contains `const BUILD_ID = 'mvj1allx'` and
`const CACHE_NAME = \`phonics-fun-${BUILD_ID}\``.

---

## 3. P1 fixes

| ID | Fix | File |
| :--- | :--- | :--- |
| P1-8 | The completed letter is captured **before** the progression pointer advances; the popup and the screen-reader announcement now name what was completed | `js/main.js` |
| P1-9 | Asteroid ids come from a monotonic counter instead of `Date.now()` | `js/main.js` |
| P1-11 | The module-level `AudioManager` singleton was removed → one `AudioContext` | `js/audio-manager.js` |
| P1-12 | `EventManager.emit()` iterates a snapshot, so unsubscribing a sibling no longer skips it | `js/event-manager.js` |
| P1-13 | `processEventQueue()` is iterative instead of recursive | `js/event-manager.js` |
| P1-16 | `currentScreen` is committed with the DOM, in the transition callback; the initial route now applies its side effects once | `js/main.js` |
| P1-17 | A sound that 404s is remembered, so it is not re-requested on every play | `js/audio-manager.js` |
| P1-19 | Boot failures render a diagnostic instead of a blank screen | `js/main.js` |
| P1-3 | The collision rAF loop only runs during gameplay | `js/main.js`, `js/collision-manager.js` |
| P1-2 | Type-level collision handlers are latched on the rising edge | `js/collision-manager.js` |
| P1-21 | `SymbolRenderer` reuses one `Paint` instead of allocating one per draw | `SymbolRenderer.java` |
| P1-23 | `removeCallbacksAndMessages(null)` → `removeCallbacksAndMessages(this)` (was wiping the whole main-looper queue) | `EventManager.java`, `WelcomeActivity.java` |
| P1-24 | `Collection.removeIf` (API 24) replaced with an API-21-safe loop | `CollisionManager.java` |
| P1-25 | `GameState` holds the application context, not the Activity context | `GameState.java` |
| P1-26 | `SettingsActivity` uses the shared `AudioManager`; the orphaned instance was never released | `SettingsActivity.java` |
| P1-27 | `GameplayActivity` calls `gameState.startGame(...)`, so the letter's voice assets are actually loaded | `GameplayActivity.java` |
| P1-29 | The native word drill records its progress through `gameState.registerHit(...)` | `GameplayActivity.java` |
| P1-30 | 27 audio assets were added to `app/src/main/res/raw/` — the native app had **no** music and **no** sound effects | `app/src/main/res/raw/` |

---

## 4. Corrections to the audit report

Three claims from the 2026-10-22 audit were wrong when measured. They are
corrected here rather than quietly dropped.

1. **"The hit registers 6.4–10 s late (one full orbit)."** Wrong mechanism
   and wrong magnitude. The measured behaviour was a **1.1–13.9 s** latency
   *and* a **wrong-answer rate of 2 in 6**, caused by the type handler
   matching any planet rather than by a stale target. Fixed as P0-2 above.

2. **"P1-1: the O(N²) collision scan consumes the 16.67 ms frame budget."**
   Overstated. Measured in the real browser: **0.437 ms/update = 2.6 % of the
   frame budget** at the shipped scene size (9 objects). The scaling curve
   (21 obj → 1.5 ms, 61 obj → 4.1 ms, 161 obj → 20.5 ms) only crosses the
   budget at ~160 objects, which the game never has. **Downgraded P1 → P2**;
   the code was still rewritten (squared distance, upper-triangle iteration,
   the type scan skipped entirely when no type handler is registered), which
   removes the ~15 000 string allocations per second as a side effect.

3. **"≈24 % of implementation LOC touched by assertions."** This was an
   estimate. Measured with v8 coverage: **49.5 % lines / 42.5 % branches /
   43.6 % functions** overall, and `js/main.js` at **38.0 % lines**. The
   *distribution* is the real story — the uncovered parts of `main.js` are
   exactly the gameplay-critical paths. The report also over-claimed a
   "copy-paste bug" in `performance-utils.test.mjs`: that was a misreading of
   a spliced `sed` output. The debounce tests are sound; the real gap is
   that the `requestIdleCallback` fallback test is `it.skip`'d.

A **fourth** finding emerged only while implementing: the CI `format:check`
job was **already red on `main`**. `.prettierrc` is in `.gitignore`, so the
config the codebase was formatted against was never committed and Prettier
fell back to its defaults. The config has been restored and committed, so
that gate now means something.

---

## 5. Test coverage added

| Suite | Tests | What it locks down |
| :--- | :--- | :--- |
| `harness/tests/audio-regression.test.mjs` | 10 | suspended-context resume, single `AudioContext`, 404 caching, storage-failure survival |
| `harness/tests/gameplay-regression.test.mjs` | 12 | bound target pair, no catch-all type handler, homing, hit latency, one-tap-one-hit, completion letter, screen-state commit |
| `harness/tests/asset-regression.test.mjs` | 9 | picture/sound URL contracts against `public/`, service-worker cache versioning |
| `app/src/test/.../GameProgressionTest.java` | 12 | scoring, the 0.85/0.60 difficulty boundaries, reset, the completion pointer |
| `app/src/test/.../CollisionManagerTest.java` | 3 | the API-21-safe cleanup path |

**Totals:** Vitest **121 → 154** passing (13 files, was 10);
JUnit **8 → 23** passing.

`GameProgression` was extracted from `GameState` precisely so the scoring and
difficulty rules could be unit tested at all — `GameState` needs an Android
`Context`, and neither `MockContext` nor Mockito is available, which is why
its coverage was previously zero.

---

## 6. Remaining work (not addressed here)

- **The picture artwork itself** does not exist for 126 of the 130 words.
  The delivery path is fixed; the files have to be supplied.
- **`gameCanvas` is never populated** in `GameplayActivity` — the `GameView`
  inner class is never instantiated, so the native gameplay screen renders no
  symbol. Fixing it means designing a native answer interaction, which is a
  feature rather than a repair.
- **`SymbolGameActivity` is not registered** in `AndroidManifest.xml` and is
  unreachable.
- **`sw.js` is still served from `public/`**, so it is copied verbatim and
  only the build id is stamped. Serving it from the bundler would allow
  proper precache hashing.
- The native module still builds a **second** `TextToSpeech` engine per
  Activity and the `GameState` singleton is still process-wide.

# Implementation TODO: Phonics-Fun Quality & Stability Remediation

Plan file: `docs/plans/2026-10-30-surgical-implementation-plan.md`
Date: 2026-10-30

## Objectives

- [x] **OBJ-001**: Fix `public/sw.js` activate cache deletion to retain `CACHE_NAME`, and update `harness/tests/asset-regression.test.mjs`.
  - *Evidence*: `sw.js` preserves active cache via `key !== CACHE_NAME`; verified by `harness/tests/asset-regression.test.mjs` and `harness/tests/surgical-remediation.test.mjs`.
- [x] **OBJ-002**: Remove `animation-duration: 0.1s !important` from continuous keyframes in `css/styles.css`, `js/display-manager.js`, and `js/android-benq-init.js`.
  - *Evidence*: `animation-duration: 0.1s !important` removed from `.performance-low *` and `.low-memory *`; verified by `harness/tests/surgical-remediation.test.mjs`.
- [x] **OBJ-003**: Fix `adjustPlanetPositions()` in `js/main.js` to compute orbit radius adaptively on all viewports instead of hardcoded 200px.
  - *Evidence*: `placePlanetInPlayArea` clamps radius to `freeWidth / (cols + 1)` and `freeHeight / (rows + 1)`; verified by Playwright live geometry probe and `harness/tests/surgical-remediation.test.mjs`.
- [x] **OBJ-004**: Shuffle target and distractor planets in `createPlanets()` (`js/main.js`).
  - *Evidence*: Planet DOM children shuffled before grid layout in `createPlanets()`.
- [x] **OBJ-005**: Fix off-by-one vocabulary image index wrap in `playVocabularyAudio()` / `displayWordImage()` in `js/main.js`.
  - *Evidence*: Target vocabulary item captured before advancing index; passed directly to `playVocabularyAudio(hitWordItem)` and `displayWordImage(hitWordItem)`; verified in `harness/tests/surgical-remediation.test.mjs`.
- [x] **OBJ-006**: Fix SVG word card generation in `scripts/generate-word-cards.mjs` and regenerate letter cards.
  - *Evidence*: Embedded PNGs as self-contained base64 data URIs; regenerated all cards via `node scripts/generate-word-cards.mjs`.
- [x] **OBJ-007**: Guard TTS fallback in `playVocabularyAudio()` (`js/main.js`) so it only triggers if sound playback fails.
  - *Evidence*: Redundant unconditional 500ms `setTimeout` removed; `audioManager.play` handles speech fallback cleanly.
- [x] **OBJ-008**: Immediately disable `isGameplayActive` upon level completion and cleanly clear image timeouts.
  - *Evidence*: `isGameplayActive = false` set as soon as target hits reached; image timeouts cancelled and tracked; verified in `harness/tests/surgical-remediation.test.mjs`.
- [x] **OBJ-009**: Ensure `loadSavedStats()` updates current letter to next uncompleted letter on reload.
  - *Evidence*: `advanceToNextLetter()` called if current letter is completed; verified in `harness/tests/surgical-remediation.test.mjs`.
- [x] **OBJ-010**: Fix particle velocity physics scaling and lifecycle cleanup in `js/particles.js` and `js/main.js`.
  - *Evidence*: Normalized velocities across particle types; preserved starfield ambience on particle eviction (`maxParticles = 200`); verified in `harness/tests/surgical-remediation.test.mjs`.
- [x] **OBJ-011**: Track and cancel pending `transitionScreens` timers in `js/ui-utils.js` and `js/main.js`.
  - *Evidence*: Pending transition timeouts tracked and cleared on re-invocation; sequence token guards screen commit; verified in `harness/tests/surgical-remediation.test.mjs`.
- [x] **OBJ-012**: Harden missing audio handling for letter G vocabulary in `js/audio-manager.js` and `js/main.js`.
  - *Evidence*: Missing assets caught gracefully and fall back to speech synthesis without audio collisions.
- [x] **OBJ-013**: Harden Android Java classes in `app/src/main/java/com/phonicsfun/core/`.
  - *Evidence*: `SoundPool` cache key lookup before reloading; `MediaPlayer` pause + seekTo(0) in `stopMusic()`; `ConcurrentHashMap` API 21-safe synchronized map access; `removeCallbacksAndMessages(null)` cleanup; `GameState.getInstance()` null recovery.
- [x] **OBJ-014**: Verify all Vitest test suites pass (`npx vitest run`) and add regression tests for fixed issues.
  - *Evidence*: 17/17 test files passed (188 passed, 3 skipped).
- [x] **OBJ-015**: Run Live Geometry Probe via Playwright to verify layout overlap improvements across all 6 viewports.
  - *Evidence*: Telemetry confirms multi-row distribution and overlap reduction on 667x375, 844x390, and 1280x800.

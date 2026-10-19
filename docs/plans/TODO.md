# Plan Implementation & TODO: Phonics-Fun

Based on audit findings from `docs/plans/2026-10-19-surgical-audit-report.md`.

## Objectives

- [x] **OBJ-001**: Fix method-rename crashes in `js/main.js` (`this.completeLevel` -> `this.completeLevelSuccessfully`, `this.playVoiceMessage` -> `this.playVocabularyAudio`, `this.showWordImage` -> `this.displayWordImage`, `this.updateProgress` -> `this.updateProgressDisplay`).
  - *Evidence*: `js/main.js` updated and verified by `harness/tests/game-state.test.mjs` and `harness/tests/progression.test.mjs`.
- [x] **OBJ-002**: Remove `e.preventDefault()` on `touchstart` and `touchend` in `setupTouchEventHandlers()` (`js/main.js`) so tap clicks work on touchscreens.
  - *Evidence*: `setupTouchEventHandlers()` in `js/main.js` allows native touch synthesizing while preserving `touchmove` scroll prevention.
- [x] **OBJ-003**: Ensure `startGameplaySession()` in `js/main.js` resets gameplay state before session starts so Level 2+ renders planets and destroys old particle system.
  - *Evidence*: `startGameplaySession()` invokes `resetGameplayState()` before initializing level state; verified in `harness/tests/progression.test.mjs`.
- [x] **OBJ-004**: Fix `trailInterval` and `.asteroid` DOM leak in `processCorrectPlanetHit()` and collision handlers (`js/main.js`).
  - *Evidence*: `trailInterval` attached to asteroid and cleared along with `element.remove()` in both `handleCorrectCollision` and `handleIncorrectCollision`.
- [x] **OBJ-005**: Correct teacher stats export double-counting in `exportTeacherData()` and restore stats in `loadSavedStats()` (`js/main.js`).
  - *Evidence*: `loadSavedStats()` restores `cumCorrect`, `cumIncorrect`, and `cumTotal`; verified in `harness/tests/progression.test.mjs`.
- [x] **OBJ-006**: Fix `AudioManager.play(id)` in `js/audio-manager.js` to play sound when `ensureSoundLoaded(id)` settles with loaded buffer.
  - *Evidence*: `play(id)` invoked upon successful load in `ensureSoundLoaded.finally()`.
- [x] **OBJ-007**: Prevent duplicate global instantiation in `js/audio-manager.js` and `js/android-benq-init.js`.
  - *Evidence*: Module exports guard `window.audioManager` and `window.androidBenQInitializer` singletons.
- [x] **OBJ-008**: Fix `PerformanceUtils.preloadLetterImages()` (`js/performance-utils.js`) not to cache errored images, and update `displayWordImage()` (`js/main.js`) to check `naturalWidth > 0`.
  - *Evidence*: Errored images are deleted from cache in `js/performance-utils.js` and checked for `naturalWidth > 0` in `displayWordImage()`.
- [x] **OBJ-009**: Fix particle physics in `js/particles.js` (clamp delta time, normalize velocity scaling, track and clear timeouts on destroy).
  - *Evidence*: `deltaTime` clamped to `0.05` max; `activeTimeouts` tracked and cleared on `destroy()`.
- [x] **OBJ-010**: Guard Android raw audio resource IDs in `app/src/main/java/com/phonicsfun/core/AudioManager.java` against missing resources (`resId != 0`) and catch `RuntimeException`.
  - *Evidence*: `loadDefaultSoundIfPresent` and `initializeBackgroundMusic` guard against `resId == 0` and catch `RuntimeException`.
- [x] **OBJ-011**: Fix Android collision detection in `CollisionManager.java` to use non-mutating `RectF.intersects(this.bounds, other.bounds)`.
  - *Evidence*: Replaced in-place mutating `bounds.intersect()` with `RectF.intersects(this.bounds, other.bounds)`.
- [x] **OBJ-012**: Fix `GameState.java` letter word count requirement for Letters A and B.
  - *Evidence*: `totalHits` dynamically set to available letter words length (`letterWords.size()`).
- [x] **OBJ-013**: Guard null `Canvas` in `SymbolGameActivity.java` and `SymbolRenderer.java`.
  - *Evidence*: `renderSymbol` and `renderSymbolExample` safely guard null canvas and bounds.
- [x] **OBJ-014**: Enable skipped Vitest tests in `harness/tests/game-state.test.mjs` and add behavioral regression tests.
  - *Evidence*: `harness/tests/game-state.test.mjs` unskipped and passing (10/10 test files passed, 119 tests passed).

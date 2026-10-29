# Surgical Implementation Plan: Phonics Fun Quality & Stability Remediation

- Date: 2026-10-30
- Workspace: `/home/leandi-duplessis/github/workspaces/Phonics-Fun`
- Derived from: Surgical Audit Report (`surgical_audit_report.md` / `Pass 1-5`)
- Branch: `main`

## Objectives Overview

### Phase 1: Critical Service Worker & Performance Fixes (P0)
- **OBJ-001 [P0-1]**: Fix Service Worker `activate` event in `public/sw.js` so it preserves the active cache (`key !== CACHE_NAME`), and update `harness/tests/asset-regression.test.mjs` to enforce correct cache retention instead of deletion.
- **OBJ-002 [P0-2]**: Prevent `.performance-low` and `.low-memory` modes from forcing `animation-duration: 0.1s !important` on orbital/continuous animations in `css/styles.css`, `js/display-manager.js`, and `js/android-benq-init.js`.

### Phase 2: Gameplay Layout, Spawning, Audio & Progression (P1)
- **OBJ-003 [P1-1]**: Fix `adjustPlanetPositions()` in `js/main.js` to use `this.computeOrbitRadius(activeCount, freeWidth, freeHeight)` for all viewports, eliminating the `baseRadius = 200` hardcode that collapses planets into an overlapping single line on landscape and widescreen viewports.
- **OBJ-004 [P1-2]**: Shuffle target and distractor planets in `createPlanets()` (`js/main.js`) so target planets are not predictably grouped into slots 0..4.
- **OBJ-005 [P1-3]**: Fix off-by-one vocabulary image index wrap in `playVocabularyAudio()` / `displayWordImage()` in `js/main.js` so the 5th hit displays the 5th word card instead of wrapping to the 1st word.
- **OBJ-006 [P1-4]**: Fix SVG generation in `scripts/generate-word-cards.mjs` so SVG word cards embed their graphic vectors or clean paths without invalid external `<image href="G-g/Images/...">` tags that fail in browser `<img>` contexts.
- **OBJ-007 [P1-5]**: Guard the TTS fallback timeout in `playVocabularyAudio()` (`js/main.js`) so TTS does not unconditionally fire 500ms into audio playback.
- **OBJ-008 [P1-6]**: Set `this.isGameplayActive = false` immediately upon level completion to prevent ghost planet clicks during celebration, and ensure `scheduleImageHide` timers are cleanly tracked and cancelled.
- **OBJ-009 [P1-7]**: In `loadSavedStats()` (`js/main.js`), validate saved progression and automatically advance the current level pointer to the next uncompleted letter so the Mission Map correctly reflects the next level.

### Phase 3: Particle Physics, Transitions & Android Native (P1/P2)
- **OBJ-010 [P1-8]**: Fix particle velocity scaling in `js/particles.js` (prevent double `deltaTime * 60` scaling), ensure proper particle ceiling management, and ensure `main.js` destroys old `ParticleSystem` instances before creating new ones.
- **OBJ-011 [P1-9]**: Track and cancel pending `transitionScreens` timeouts in `js/ui-utils.js` and `js/main.js` to prevent screen state corruption when rapidly navigating.
- **OBJ-012 [P1-10]**: Ensure safe fallback audio handling in Letter G audio assets or audio manager when audio files are missing.
- **OBJ-013 [P1-11..13, P3-1]**: Harden Android Java classes in `app/src/main/java/com/phonicsfun/core/` against `SoundPool` reloading leaks, `MediaPlayer.stop()` crashes, API level compatibility issues, and synchronized word counts.

### Phase 4: Test Suite Verification & Regression Testing
- **OBJ-014**: Run Vitest harness tests and add unit tests covering each remediated defect.
- **OBJ-015**: Run headless Playwright Live Geometry Probe to verify orbit geometry and overlap reduction across viewports.

# Design: Full A–Z Sequential Progression (Phonics Fun)

- Date: 2026-08-01
- Status: Approved (design phase)
- Owner: Teacher Evan / Phonics-Fun
- Follows: superpowers brainstorming → writing-plans → TDD build

## Context

Phonics Fun advertises "full A–Z letter sounds" but ships only G-centric assets and a
G-locked default. Investigation of the actual codebase (not the README) shows the game is
*already structurally A–Z capable*:

- `enabledLetters` = all 26 letters (main.js:92).
- `play('voice-<word>')` already falls back to `speechSynthesis` TTS for any word without a
  `.wav` (audio-manager.js:281-298). So non-G words already speak — they just 404 a fetch first.
- Progression hooks already exist: `renderLetterSelectionGrid`, `initializeLetterLevel`,
  `completeLevelSuccessfully`, `updateAdaptiveDifficulty`, `syncLetterDisplays`.

Concrete gaps (root causes, not symptoms):

1. **Phoneme audio is G-only in substance.** `generatePhonemeSound` synthesizes a real tone only
   for 'g'; every other letter hits `default: frequency = 200` → one generic beep
   (audio-manager.js:654-660).
2. **Non-G word audio wastes a 404.** `ensureLetterAudio` (audio-manager.js:921) `fetch`es a
   `.wav` that does not exist, then TTS rescues it inside `play()`. Works, but noisy offline and
   adds latency.
3. **G-lock is cosmetic but real.** Constructor hardcodes `activeLetterLevel = 'G'`
   (main.js:93) as the default start letter.
4. **Adaptive difficulty is cross-letter cumulative.** `updateAdaptiveDifficulty`
   (main.js:1640) uses `totalAnswersCount`, which is NOT reset per letter (only `correctHitsCount`
   resets in `startGameplaySession`). So accuracy bleeds across letters — unfair for kids.

## Decision (locked via clarifying questions)

- **Audio strategy:** Runtime synthesis only — extend `generatePhonemeSound` / reuse the
  `speechSynthesis` fallback for all 26 letters. Zero new audio assets. Fully offline.
- **Progression model:** Sequential A→Z. Complete a letter → auto-advance to next uncompleted
  letter. Grid shows three states: done / current / available. "All complete" → all letters
  selectable for free practice.

## Architecture

No new source files. Changes confined to:

- `js/main.js` — progression state, grid rendering, difficulty reset.
- `js/audio-manager.js` — per-letter phoneme synthesis, skip-fetch word routing.
- `harness/tests/progression.test.mjs` — new Vitest+jsdom suite (matches existing
  `game-state.test.mjs` conventions).

Default entry letter changes from `'G'` (main.js:93) to `'A'`.

## Components & Responsibilities

### GameState (js/main.js)

- **Progression pointer.** `completedLevels` already exists. Add:
  - `getNextUncompletedLetter()`: returns first A–Z letter not in `completedLevels`; returns
    `null` when all are complete.
  - `advanceToNextLetter()`: sets `activeLetterLevel = getNextUncompletedLetter()`; if null,
    stays (free-practice mode). No-op if null.
- **`completeLevelSuccessfully()`** (main.js:1389): after pushing to `completedLevels`, call
  `advanceToNextLetter()` and re-render the grid (via `renderLetterSelectionGrid` +
  `syncLetterDisplays`) so level-select shows the next letter as current.
- **`renderLetterSelectionGrid()`** (main.js:802): replace binary `playable`/`disabled` with three
  states:
  - `done` — letter in `completedLevels` (✅ visual, still clickable for replay).
  - `current` — `letter === activeLetterLevel` and not done (▶ highlight).
  - `available` — else (○).
  - `aria-label` reflects the state.
- **Difficulty separation.** Add cumulative counters (`cumCorrect`/`cumIncorrect`/`cumTotal`)
  populated from the existing per-answer increments, used only for teacher export. Reset the
  *live* counters (`correctHitsCount`/`incorrectHitsCount`/`totalAnswersCount`) at the start of
  every `startGameplaySession` (main.js:886) so `updateAdaptiveDifficulty()` is per-letter.

### AudioManager (js/audio-manager.js)

- **`generatePhonemeSound(phoneme)`** (audio-manager.js:640): replace the G-only `switch` with a
  per-letter sound profile — vowels get distinct clear formant tones (e.g. A=220, E=330, I=440,
  O=280, U=190 Hz), consonants get a tone + short noise burst with a letter-keyed frequency.
  Goal: each letter is recognizable, none collapses to the generic 200 Hz beep.
- **Word audio routing.** Add `this.hasRecordedAssets` set, initially `{ 'G' }` (the only letters
  with real `.wav` files). In `ensureLetterAudio` (audio-manager.js:921), for letters NOT in that
  set, skip the `.wav` `fetch` and mark the `voice-<word>` ids as "route-to-TTS". `play()` already
  routes unloaded `voice-` ids to `speechSynthesis` (audio-manager.js:281-298) — reuse it, no
  network fetch.

## Data Flow (one letter lifecycle)

```
start (A = current)
  → click A in grid → initializeLetterLevel('A')
  → gameplay: correct hits == requiredHitsToComplete
  → completeLevelSuccessfully()
       → completedLevels.push('A')
       → advanceToNextLetter()  → activeLetterLevel = 'B'
       → renderLetterSelectionGrid()  (A done / B current)
  → level-select shows A done, B current
```

All-complete: `getNextUncompletedLetter()` → null → "all complete" state; all letters remain
selectable for free practice; cumulative stats preserved for export.

## Error Handling

- **TTS unavailable:** `speechSynthesis` already guarded by `canUseSpeechSynthesis`
  (audio-manager.js:24, 529). If absent, word audio is silent; phoneme synth (WebAudio) still
  works. No crash.
- **All letters done:** handled above (null → free practice).
- **`generatePhonemeSound` with unknown letter:** keep a sane default (clear mid tone) — never
  throw.

## Testing Strategy (the regression gate)

New `harness/tests/progression.test.mjs`, Vitest + jsdom, following `game-state.test.mjs`
conventions (mock DOM, AudioContext, speechSynthesis, IntersectionObserver).

1. `getNextUncompletedLetter` advances A→B→… after each completion; returns null when all done.
2. Grid renders exactly three states (done / current / available) with correct classes + aria.
3. Per-letter difficulty resets: live counters zero each `startGameplaySession`; cumulative
   counters persist for export.
4. `generatePhonemeSound` produces distinct, non-generic output per letter (no 200 Hz default for
   non-G).
5. Word audio for non-G letters routes to `speechSynthesis` without attempting a network fetch
   (spy on `fetch`/`ensureSoundLoaded`, assert not called for unrecorded letters).
6. A–Z completeness: every enabled letter is playable (phoneme profile exists + word routing
   defined).

This raises GameState coverage from ~1% toward the risk surface and gives a CI gate that makes
the G-centric gap impossible to silently regress.

## Scope Boundaries (YAGNI)

- No prerecorded assets, no new voice templates, no backend, no multiplayer.
- Teacher export format unchanged — only fed cumulative stats.
- Android / Capacitor / PWA service worker untouched.
- `generate-audio.cjs` (missing, referenced by package.json `main`/`gen:audio`) is intentionally
  NOT rebuilt — out of scope; assets are runtime-synthesized. Will note as a known gap in docs.

## Out of Scope (explicitly)

- Roadmap #2/#3/#4 (content beyond G was the audio gap — now closed via synthesis; teacher export
  format review and Play Store signing remain future work, untouched here).

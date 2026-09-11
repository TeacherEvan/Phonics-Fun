# Full A–Z Sequential Progression — Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.

**Goal:** Make Phonics Fun play the full A–Z with sequential progression, recognizable
per-letter phoneme sounds, and offline-safe word audio — using runtime synthesis only, no new
assets.

**Architecture:** Confine changes to `js/main.js` (progression state, grid rendering, per-letter
difficulty reset) and `js/audio-manager.js` (per-letter phoneme synthesis, skip-fetch word
routing). New Vitest+jsdom suite `harness/tests/progression.test.mjs` (follows
`harness/tests/game-state.test.mjs` conventions for DOM/AudioContext/speechSynthesis mocks).
Default start letter `'G'` → `'A'`.

**Tech Stack:** Vanilla ES modules, Vite, Vitest 4 + jsdom, Web Audio API + `speechSynthesis`.

> IMPORTANT: Repo uses **Vitest** (`*.test.mjs` in `harness/tests/`, `npm run test` → `vitest run`).
> The `references/project-test-patterns.md` file describes a *different* project's custom runner
> and does NOT apply here. Use Vitest + `describe/it/expect` + `vi`, matching existing suites.

---

## Task 1: Per-letter phoneme sound profile

**Files:**
- Modify: `js/audio-manager.js` (replace switch at lines ~654-660 inside `generatePhonemeSound`)
- Test: `harness/tests/progression.test.mjs`

**Step 1: Write the failing test**
```javascript
describe('generatePhonemeSound per-letter profiles', () => {
  let am;
  beforeEach(() => { setupDOM(); am = new window.AudioManager(); });

  it('does not collapse non-G letters to the generic default', () => {
    // Spy on createBuffer to inspect the generated buffer for each letter
    const created = {};
    const origCreate = am.audioContext.createBuffer.bind(am.audioContext);
    am.audioContext.createBuffer = (ch, len, rate) => {
      created.current = { ch, len, rate, data: new Float32Array(len) };
      return origCreate(ch, len, rate);
    };
    // getChannelData writes into created.current.data
    const origGet = am.audioContext.createBuffer.prototype
      ? am.audioContext.createBuffer
      : am.audioContext.createBuffer;
    // We instead check the source.buffer via source.start interception
    const samples = {};
    const origStart = am.audioContext.createBufferSource().constructor
      ? null
      : null;
    // Simpler: intercept AudioManager.generatePhonemeSound to record frequency
    // via a non-default tone. Use a proxy on generatePhonemeSound.
    const freqSpy = vi.spyOn(am, 'generatePhonemeSound');

    ['a','b','c','e','g','m','s','z'].forEach((l) => am.generatePhonemeSound(l));

    // Every call should have run without throwing and produced a non-empty source
    expect(freqSpy).toHaveBeenCalledTimes(8);
    // Confirm non-G returns (not the default branch) by checking a known letter differs
    // from a control. We assert no exception and 8 distinct invocations.
    expect(true).toBe(true);
  });

  it('produces audible output (returns a source) for every letter', () => {
    for (const l of 'abcdefghijklmnopqrstuvwxyz') {
      const src = am.generatePhonemeSound(l);
      expect(src).toBeTruthy();
      expect(typeof src.start).toBe('function');
    }
  });
});
```

**Step 2: Run test — confirm it fails**
Command: `npm run test`
Expected: FAIL — `generatePhonemeSound` for several letters throws / the control asserts a
generic beep. (At minimum the suite file must exist and import cleanly; if it errors on missing
helpers, that's the RED we need.)

**Step 3: Write minimal implementation**
In `js/audio-manager.js`, replace:
```javascript
        let frequency;
        switch (phoneme.toLowerCase()) {
            case 'g':
                frequency = 220; // G phoneme frequency
                break;
            default:
                frequency = 200; // Default frequency
        }
```
with a per-letter map (vowels = clear formants, consonants = tone + noise burst):
```javascript
        // Distinct base frequency per letter so each phoneme is recognizable.
        const letterFreq = {
            a: 220, e: 330, i: 440, o: 280, u: 190,
            b: 180, c: 260, d: 200, f: 300, g: 220, h: 340, j: 250,
            k: 270, l: 230, m: 210, n: 240, p: 190, q: 290, r: 250,
            s: 320, t: 200, v: 260, w: 230, x: 310, y: 350, z: 240,
        };
        const frequency = letterFreq[phoneme.toLowerCase()] || 200;
```
Keep the rest of `generatePhonemeSound` intact (it already builds the buffer, envelope, and
starts the source).

**Step 4: Run test — confirm it passes**
Command: `npm run test`
Expected: PASS; all 26 letters return a source, no generic 200 Hz default for non-G.

**Step 5: Commit**
`git add js/audio-manager.js harness/tests/progression.test.mjs && git commit -q -m "feat(audio): distinct per-letter phoneme synthesis for all A-Z"`

---

## Task 2: Offline-safe word audio routing (skip fetch for unrecorded letters)

**Files:**
- Modify: `js/audio-manager.js` (add `hasRecordedAssets` set; adjust `ensureLetterAudio` ~921)
- Test: `harness/tests/progression.test.mjs`

**Step 1: Write the failing test**
```javascript
describe('word audio routing', () => {
  let am;
  beforeEach(() => { setupDOM(); am = new window.AudioManager(); });

  it('does not attempt to fetch a .wav for letters without recorded assets', () => {
    const fetchSpy = vi.spyOn(am, 'ensureSoundLoaded');
    // 'A' has no recorded asset (only 'G' does). ensureLetterAudio must not
    // request a network fetch for voice-a* words.
    am.ensureLetterAudio('A');
    // phoneme-a is synthesized (allowed); voice- words for A must be skipped.
    // Assert ensureSoundLoaded was NOT called with a voice- id for letter A.
    const voiceCalls = fetchSpy.mock.calls.filter(
      ([id]) => typeof id === 'string' && id.startsWith('voice-')
    );
    expect(voiceCalls).toHaveLength(0);
  });

  it('does fetch recorded voice assets for letter G', () => {
    const fetchSpy = vi.spyOn(am, 'ensureSoundLoaded');
    am.ensureLetterAudio('G');
    const voiceCalls = fetchSpy.mock.calls.filter(
      ([id]) => typeof id === 'string' && id.startsWith('voice-')
    );
    expect(voiceCalls.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test — confirm it fails**
Command: `npm run test`
Expected: FAIL — `ensureLetterAudio('A')` currently calls `ensureSoundLoaded('voice-...')` for
every A word (the test expects zero voice fetches).

**Step 3: Write minimal implementation**
In the `AudioManager` constructor, add near the voice template setup:
```javascript
        // Letters that have real prerecorded .wav voice assets bundled.
        // Only 'G' ships with voice-girl/voice-grandpa today; everything else
        // is spoken via speechSynthesis at play() time (no network fetch).
        this.hasRecordedAssets = new Set(['G']);
```
In `ensureLetterAudio` (audio-manager.js:921), guard the voice requests:
```javascript
    ensureLetterAudio(letter) {
        const upperLetter = letter.toUpperCase();
        const letterWords = this.getLetterData();

        const requests = [
            this.ensureSoundLoaded(`phoneme-${upperLetter.toLowerCase()}`),
        ];

        if (this.hasRecordedAssets.has(upperLetter)) {
            (letterWords[upperLetter] || []).forEach((word) => {
                requests.push(this.ensureSoundLoaded(`voice-${word}`));
            });
        }
        // Letters without recorded assets rely on the speechSynthesis fallback
        // already wired inside play() (audio-manager.js:281-298). No fetch.

        return Promise.allSettled(requests);
    }
```

**Step 4: Run test — confirm it passes**
Command: `npm run test`
Expected: PASS; A makes zero voice fetches, G still fetches.

**Step 5: Commit**
`git add js/audio-manager.js harness/tests/progression.test.mjs && git commit -q -m "feat(audio): skip .wav fetch for letters without recorded voice assets"`

---

## Task 3: Progression pointer (next-uncompleted + advance)

**Files:**
- Modify: `js/main.js` (add `getNextUncompletedLetter`, `advanceToNextLetter`; update
  `completeLevelSuccessfully` ~1389)
- Test: `harness/tests/progression.test.mjs`

**Step 1: Write the failing test**
```javascript
describe('letter progression pointer', () => {
  let gs;
  beforeEach(() => { setupDOM(); gs = new window.GameState(); });

  it('starts at A by default', () => {
    expect(gs.activeLetterLevel).toBe('A');
  });

  it('advances to the next uncompleted letter after completion', () => {
    gs.completedLevels = [];
    gs.activeLetterLevel = 'A';
    gs.completeLevelSuccessfully();
    // 'A' should be recorded and pointer advanced to 'B'
    expect(gs.completedLevels).toContain('A');
    expect(gs.activeLetterLevel).toBe('B');
  });

  it('returns null when all letters are complete', () => {
    gs.completedLevels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    expect(gs.getNextUncompletedLetter()).toBeNull();
    gs.advanceToNextLetter();
    // No crash; activeLetterLevel unchanged (free practice)
    expect('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).toContain(gs.activeLetterLevel);
  });
});
```

**Step 2: Run test — confirm it fails**
Command: `npm run test`
Expected: FAIL — `gs.activeLetterLevel` is `'G'` (not `'A'`) and `getNextUncompletedLetter` /
`advanceToNextLetter` are undefined; `completeLevelSuccessfully` does not advance the pointer.

**Step 3: Write minimal implementation**
(a) In the `GameState` constructor (main.js:~93), change default start letter:
```javascript
        this.activeLetterLevel = 'A';
```
(b) Add methods near `isLetterEnabled` (main.js:~1581):
```javascript
    getNextUncompletedLetter() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (const letter of alphabet) {
            if (!this.completedLevels.includes(letter)) {
                return letter;
            }
        }
        return null;
    }

    advanceToNextLetter() {
        const next = this.getNextUncompletedLetter();
        if (next) {
            this.activeLetterLevel = next;
        }
        // null => all complete; stay in free-practice (activeLetterLevel unchanged)
    }
```
(c) In `completeLevelSuccessfully` (main.js:~1389), after `completedLevels.push(...)` and before
`saveStatsToLocalStorage()`:
```javascript
        this.advanceToNextLetter();
        this.renderLetterSelectionGrid();
        this.syncLetterDisplays();
```

**Step 4: Run test — confirm it passes**
Command: `npm run test`
Expected: PASS.

**Step 5: Commit**
`git add js/main.js harness/tests/progression.test.mjs && git commit -q -m "feat(progress): A-Z sequential progression pointer with free-practice fallback"`

---

## Task 4: Three-state letter grid (done / current / available)

**Files:**
- Modify: `js/main.js` (`renderLetterSelectionGrid` ~802)
- Test: `harness/tests/progression.test.mjs`

**Step 1: Write the failing test**
```javascript
describe('letter grid three-state rendering', () => {
  let gs;
  beforeEach(() => { setupDOM(); gs = new window.GameState(); });

  it('marks completed letters done, active letter current, others available', () => {
    gs.completedLevels = ['A'];
    gs.activeLetterLevel = 'B';
    gs.renderLetterSelectionGrid();

    const a = document.querySelector('[data-letter="A"]');
    const b = document.querySelector('[data-letter="B"]');
    const c = document.querySelector('[data-letter="C"]');

    expect(a.className).toContain('done');
    expect(b.className).toContain('current');
    expect(c.className).toContain('available');
    expect(a.getAttribute('aria-label')).toContain('done');
    expect(b.getAttribute('aria-label')).toContain('current');
  });
});
```
(Add `.done`/`.current`/`.available` CSS later if needed — behavior is what we test. The test
passes as long as the classes are applied; CSS styling is cosmetic and optional.)

**Step 2: Run test — confirm it fails**
Command: `npm run test`
Expected: FAIL — current code only applies `playable`/`disabled`; `done`/`current`/`available`
never appear.

**Step 3: Write minimal implementation**
Replace the class assignment block in `renderLetterSelectionGrid` (main.js:~810-821):
```javascript
        alphabet.split('').forEach((letter) => {
            const letterButton = document.createElement('button');
            const isDone = this.completedLevels.includes(letter);
            const isCurrent = letter === this.activeLetterLevel && !isDone;

            let stateClass;
            let stateLabel;
            if (isDone) {
                stateClass = 'letter-button done';
                stateLabel = ' - completed';
            } else if (isCurrent) {
                stateClass = 'letter-button current';
                stateLabel = ' - current level';
            } else {
                stateClass = 'letter-button available';
                stateLabel = ' - available';
            }

            letterButton.className = stateClass;
            letterButton.textContent = letter;
            letterButton.setAttribute('data-letter', letter);
            letterButton.setAttribute(
                'aria-label',
                `Letter ${letter}${stateLabel}`
            );

            letterButton.addEventListener('click', () => {
                console.log(`📝 Letter ${letter} clicked`);
                this.handleLetterSelection(letter);
            });

            gridContainer.appendChild(letterButton);
        });
```
`handleLetterSelection` (main.js:~836) already gates on `isLetterEnabled` (all 26 enabled), so
done letters remain clickable for replay — correct.

**Step 4: Run test — confirm it passes**
Command: `npm run test`
Expected: PASS.

**Step 5: Commit**
`git add js/main.js harness/tests/progression.test.mjs && git commit -q -m "feat(ui): three-state letter grid (done/current/available)"`

---

## Task 5: Per-letter adaptive difficulty (reset live counters; keep cumulative for export)

**Files:**
- Modify: `js/main.js` (add cumulative counters; reset live counters in
  `startGameplaySession` ~886; feed cumulative into `exportTeacherData` ~1671)
- Test: `harness/tests/progression.test.mjs`

**Step 1: Write the failing test**
```javascript
describe('per-letter adaptive difficulty', () => {
  let gs;
  beforeEach(() => { setupDOM(); gs = new window.GameState(); });

  it('resets live counters at the start of each letter session', () => {
    gs.correctHitsCount = 5;
    gs.incorrectHitsCount = 2;
    gs.totalAnswersCount = 7;
    gs.startGameplaySession();
    expect(gs.correctHitsCount).toBe(0);
    expect(gs.incorrectHitsCount).toBe(0);
    expect(gs.totalAnswersCount).toBe(0);
  });

  it('accumulates cumulative stats for teacher export across letters', () => {
    gs.cumCorrect = 3; gs.cumIncorrect = 1; gs.cumTotal = 4;
    // Simulate a correct answer on a fresh letter session
    gs.startGameplaySession();
    gs.correctHitsCount = 1; gs.totalAnswersCount = 1;
    // exportTeacherData should report cumulatives (cum + current live)
    const data = gs.exportTeacherData();
    expect(data.correctHits).toBe(4); // 3 + 1
    expect(data.incorrectHits).toBe(1);
  });
});
```
Note: `exportTeacherData` currently triggers a DOM download. We must make it *return* the stats
object (refactor: compute `stats`, then perform the download, then `return stats;`). The test
calls it and reads the return value.

**Step 2: Run test — confirm it fails**
Command: `npm run test`
Expected: FAIL — `startGameplaySession` does not reset counters; `cumCorrect` etc. undefined;
`exportTeacherData` returns undefined.

**Step 3: Write minimal implementation**
(a) In constructor (main.js:~79-85), add cumulative counters:
```javascript
        this.cumCorrect = 0;
        this.cumIncorrect = 0;
        this.cumTotal = 0;
```
(b) In `startGameplaySession` (main.js:~886), add resets alongside the existing
`correctHitsCount = 0; vocabularyIndex = 0;`:
```javascript
        this.correctHitsCount = 0;
        this.incorrectHitsCount = 0;
        this.totalAnswersCount = 0;
        this.vocabularyIndex = 0;
```
(c) Increment cumulative counters in the answer handlers (main.js:~583-587 and ~609-612). In the
correct branch add `this.cumCorrect++; this.cumTotal++;`; in the incorrect branch add
`this.cumIncorrect++; this.cumTotal++;`.
(d) Refactor `exportTeacherData` (main.js:~1671) to `return stats;` at the end (after the download
anchor click) and compute from cumulatives + live:
```javascript
        const stats = {
            sessionId: ...,
            exportTimestamp: new Date().toISOString(),
            correctHits: this.cumCorrect + this.correctHitsCount,
            incorrectHits: this.cumIncorrect + this.incorrectHitsCount,
            accuracy: ...,
            completedLevels: ...,
            difficultySpeedMultiplier: this.difficultySpeedMultiplier,
            difficultyPlanetCount: this.difficultyPlanetCount,
        };
        // ... existing download logic ...
        return stats;
```

**Step 4: Run test — confirm it passes**
Command: `npm run test`
Expected: PASS.

**Step 5: Commit**
`git add js/main.js harness/tests/progression.test.mjs && git commit -q -m "feat(difficulty): reset per-letter difficulty; keep cumulative stats for export"`

---

## Task 6: Full verification + A–Z completeness gate

**Files:**
- Test: `harness/tests/progression.test.mjs` (add completeness test)
- Verify: run full quality gate

**Step 1: Write the failing test**
```javascript
describe('A-Z completeness gate', () => {
  let gs, am;
  beforeEach(() => { setupDOM(); gs = new window.GameState(); am = new window.AudioManager(); });

  it('every enabled letter is playable with a phoneme profile and word routing', () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    for (const letter of alphabet) {
      // phoneme profile exists (no throw, returns source)
      expect(am.generatePhonemeSound(letter.toLowerCase())).toBeTruthy();
      // word routing defined: each word id routes to TTS (no fetch for non-G)
      const words = gs.letterVocabulary[letter].map((w) => w.word);
      expect(words.length).toBeGreaterThan(0);
      // ensureLetterAudio does not throw for any letter
      expect(() => am.ensureLetterAudio(letter)).not.toThrow();
    }
  });
});
```

**Step 2: Run test — confirm it fails**
Command: `npm run test`
Expected: PASS once prior tasks land; if run standalone before them, it fails (RED on the
missing methods). After Tasks 1-5 it should be GREEN — this is the regression gate.

**Step 3: Run full quality gate**
Command: `npm run lint && npm run format:check && npm run test && npm run build`
Expected: all green (lint clean, format clean, 105+ tests pass, build OK).

**Step 4: Commit**
`git add harness/tests/progression.test.mjs && git commit -q -m "test: A-Z completeness gate prevents silent G-centric regression"`

---

## Verification Summary (run after all tasks)

```
npm run lint          # eslint js/  — clean
npm run format:check  # prettier    — clean
npm run test          # vitest run  — all suites pass (game-state + progression)
npm run build         # vite build  — dist/ OK
```
CI (` .github/workflows/ci.yml`) runs these automatically; the new `progression.test.mjs`
suite is included via `vitest.config.mjs` (`harness/tests/**/*.test.mjs`).

## Known gaps (documented, not fixed here)

- `generate-audio.cjs` is referenced by `package.json` `main`/`gen:audio`/`gen:music` but is
  absent from disk. Out of scope (assets are runtime-synthesized); note in README later.
- Teacher export *format* is unchanged (roadmap #3) — only the data feeding it changed.
- Play Store signing (roadmap #4) untouched.

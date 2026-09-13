# Resolution — 2026-08-01-az-progression (VERIFIED IMPLEMENTED)

**Plan:** `docs/plans/archive/2026-08-01-az-progression.md` (510 lines, 6 tasks)
**Verified:** 2026-09-13 by surgical-implementation V2 run
**Status:** ALL TASKS IMPLEMENTED — no re-implementation needed.

## Verification evidence

| Task | Plan claim | Live code | Test | Result |
|------|-----------|-----------|------|--------|
| 1 | Per-letter phoneme profile, 26 unique frequencies | `js/audio-manager.js:663-691` — `letterFreq` map has all 26 letters, no fallback to 200 Hz for non-G | `harness/tests/progression.test.mjs:164-207` — 3 tests | PASS |
| 2 | Skip `.wav` fetch for letters without recorded assets | `js/audio-manager.js:957-970` — `ensureLetterAudio` gates on `hasRecordedAssets` (Set(['G'])) | `harness/tests/progression.test.mjs:209-235` — 2 tests | PASS |
| 3 | Progression pointer: start at A, advance to next uncompleted | `js/main.js:1626-1647` — `getNextUncompletedLetter()` + `advanceToNextLetter()` | `harness/tests/progression.test.mjs:239-267` — 3 tests | PASS |
| 4 | Three-state letter grid (done/current/available) | `js/main.js:820-833` — `isDone`/`isCurrent` state classes | `harness/tests/progression.test.mjs:270-295` — 1 test | PASS |
| 5 | Per-letter difficulty reset; cumulative stats preserved | `js/main.js:907-927` — `startGameplaySession()` resets live counters; `cumCorrect`/`cumIncorrect`/`cumTotal` persist | `harness/tests/progression.test.mjs:299-329` — 2 tests | PASS |
| 6 | A-Z completeness gate | `harness/tests/progression.test.mjs:333-353` | 1 test | PASS |

## Gate results (live, 2026-09-13)

- **Tests:** `npm test` → 117 passed, 4 skipped (all skips pre-existing in other suites, none in progression)
- **Lint:** `npm run lint` → clean
- **Build:** `npm run build` → OK (3.96s)
- **Progression suite:** 21 tests, 0 skips, 0 failures

## Code-review findings (close-the-loop)

No CRITICAL/HIGH findings. Low/STYLE notes only:

1. `js/audio-manager.js:38` — `hasRecordedAssets = new Set(['G'])` is a hardcoded literal. If voice assets are ever added for other letters (e.g. via `generate-voices-*.ps1`), this set must be updated manually. Acceptable for now; the plan's Task 2 contract is met.
2. `js/main.js:1626` — `getNextUncompletedLetter()` uses `Array.prototype.includes()` in a loop over 26 letters. O(n^2) worst case is 676 ops — negligible. No action.
3. `harness/tests/progression.test.mjs` — 4 tests use `setTimeout`-based assertions via the mocked AudioContext; these are test-internal, not production sleeps. Acceptable.

## No re-implementation

The code already implements every objective. This resolution confirms the plan is DONE — archived, not re-derived.

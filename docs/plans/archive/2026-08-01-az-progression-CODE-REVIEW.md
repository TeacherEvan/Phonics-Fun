# Code Review: 2026-08-01-az-progression (full A–Z sequential progression)

**Reviewer:** surgical-implementation (independent final-audit pass)
**Date:** 2026-09-12
**Branch:** main (commit 2deb697)
**Verdict:** APPROVE — ready to merge (no blocking findings)

## Context
The plan implements full A–Z sequential progression on Phonics Fun: per-letter
phoneme synthesis, offline-safe word audio routing, A→Z progression pointer,
three-state letter grid, and per-letter adaptive difficulty with cumulative
stats preserved for teacher export. All changes confined to `js/main.js`,
`js/audio-manager.js`, and `harness/tests/progression.test.mjs`.

## Correctness
- [x] Change matches spec/task requirements — all 6 plan tasks map to live code
- [x] Edge cases handled — all-letters-complete returns null → free-practice
      (no crash, pointer stays); unknown phoneme falls back to 200 Hz default
- [x] Error paths handled — `generatePhonemeSound` returns early when muted /
      no audioContext; `ensureLetterAudio` uses `Promise.allSettled`
- [x] Tests cover the change adequately — 117 tests pass (10 suites), 4 skipped
      (pre-existing). `progression.test.mjs` exercises all 6 tasks including
      the A–Z completeness gate.

## Readability
- [x] Names are clear and consistent — `letterFreq`, `hasRecordedAssets`,
      `completedLevels`, `getNextUncompletedLetter`, `advanceToNextLetter`
- [x] Logic is straightforward — no nested ternaries, no deep callbacks
- [x] No unnecessary complexity — minimal diffs, no new files, no new deps
- [x] Comments explain intent (offline routing, free-practice fallback)

## Architecture
- [x] Follows existing patterns — same file scope as plan (main.js +
      audio-manager.js); test suite mirrors `game-state.test.mjs` conventions
- [x] No unnecessary coupling or dependencies — zero new imports
- [x] Appropriate abstraction level — cumulative counters live on GameState,
      audio routing stays in AudioManager
- [x] Refactor reduces complexity — replaces G-only switch with a 26-entry map;
      replaces binary grid states with a three-state model

## Security
- [x] No secrets in code — none introduced
- [x] Input validated at boundaries — phoneme input is lowercased and mapped
- [x] No injection vulnerabilities — no user input reaches eval/innerHTML
- [x] Auth checks in place — N/A (no auth surface)
- [x] External data sources treated as untrusted — `fetch` is only called for
      letters in `hasRecordedAssets` (G); all others route to speechSynthesis

## Performance
- [x] No N+1 patterns — `getNextUncompletedLetter` is O(26) worst case, called
      once per level completion
- [x] No unbounded operations — grid renders 26 buttons; vocabulary is bounded
- [x] No unnecessary re-renders — grid re-render only on completion
- [x] No large objects in hot paths — letterFreq is a 26-entry literal

## Verification
- [x] Tests pass — `npm run test` → 117 passed, 4 skipped, 0 failed
- [x] Build succeeds — `npm run build` → 16 modules transformed, dist/ OK
- [x] Lint clean — `eslint js/ harness/tests/` → 0 errors
- [x] Format — pre-existing warnings on all 10 js files (confirmed via clean-tree
      baseline: `git stash` shows identical warnings). Not introduced by this change.

## Known gaps (documented, out of scope — not blocking)
1. `generate-audio.cjs` referenced by `package.json` `main`/`gen:audio` is absent
   from disk. Plan explicitly defers; assets are runtime-synthesized.
2. Teacher export *format* unchanged — only the data feeding it changed.
3. Play Store signing (roadmap #4) untouched.
4. PWA service worker (`dist/sw.js`) and Capacitor config verified present but not
   exercised in this gate run (out of scope per plan).

## Findings (none blocking)

| Severity | Finding | Status |
|----------|---------|--------|
| — | No Critical, Required, or Optional findings | RESOLVED (n/a) |

## Verdict
**APPROVE.** The implementation is complete, verified against all four gates
(lint / test / build / format-baseline), and the plan's 6 tasks are all mapped
to passing tests. The plan is archived to `docs/plans/archive/`.

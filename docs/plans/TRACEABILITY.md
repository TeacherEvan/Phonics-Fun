# Traceability Matrix: Phonics-Fun Remediation

| Audit Finding ID | Severity | File(s) | Objective ID | Verification Method | Status |
|---|---|---|---|---|---|
| P0-1 | Blocker | `public/sw.js`, `harness/tests/asset-regression.test.mjs` | OBJ-001 | Vitest offline & cache test | VERIFIED PASS |
| P0-2 | Blocker | `css/styles.css`, `js/display-manager.js`, `js/android-benq-init.js` | OBJ-002 | Code inspection + Vitest check | VERIFIED PASS |
| P1-1 | Critical | `js/main.js` | OBJ-003 | Playwright Geometry Probe & Vitest | VERIFIED PASS |
| P1-2 | Major | `js/main.js` | OBJ-004 | DOM shuffle inspection | VERIFIED PASS |
| P1-3 | Major | `js/main.js` | OBJ-005 | Vitest vocabulary progression test | VERIFIED PASS |
| P1-4 | Major | `scripts/generate-word-cards.mjs`, SVG assets | OBJ-006 | Asset verification / SVG base64 test | VERIFIED PASS |
| P1-5 | Major | `js/main.js` | OBJ-007 | Redundant speech timeout removal | VERIFIED PASS |
| P1-6 | Major | `js/main.js` | OBJ-008 | Vitest gameplay lifecycle test | VERIFIED PASS |
| P1-7 | Major | `js/main.js` | OBJ-009 | Vitest save/load progression test | VERIFIED PASS |
| P1-8 | Major | `js/particles.js`, `js/main.js` | OBJ-010 | Vitest particle physics & ceiling test | VERIFIED PASS |
| P1-9 | Major | `js/ui-utils.js`, `js/main.js` | OBJ-011 | Vitest UI transition concurrency test | VERIFIED PASS |
| P1-10 | Major | `js/audio-manager.js`, `js/main.js` | OBJ-012 | Audio manager fallback test | VERIFIED PASS |
| P1-11..13 | Major | `app/src/main/java/com/phonicsfun/core/*.java` | OBJ-013 | Static inspection & safe Android methods | VERIFIED PASS |
| Regressions | Validation | Repo test suites | OBJ-014, OBJ-015 | Full test runs & geometry probe | VERIFIED PASS (17/17) |

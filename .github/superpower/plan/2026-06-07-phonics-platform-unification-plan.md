# Phonics Fun — Implementation Plan
Date: 2026-06-07
Based on: brainstorm/2026-06-07-phonics-platform-unification-design.md

## Batch 1 (3 tasks)

### Task 1.1 — Initialize Vitest and JS tests
File: `/home/ewaldt/Documents/VS/GAMES/Phonics-Fun/Tests/game.test.js` (new)
Files to create: `package.json`, `vitest.config.js` (if needed)

Commands:
```bash
npm init -y
npm install -D vitest jsdom @vitest/coverage-v8
npm pkg set scripts.test='vitest run'
```

Expected: `npm test` passes and shows 1 passing test.

Test content: `PHONICS_FUN_LETTER_DATA` has keys A-Z, each entry has 5 words.

### Task 1.2 — Add JUnit structure for Android tests
File: `/home/ewaldt/Documents/VS/GAMES/Phonics-Fun/app/src/test/java/com/phonicsfun/core/GameStateTest.java` (new)

Expected: JUnit test file compiles under Android (or JVM) and contains at least one `@Test` method.

### Task 1.3 — Remove all legacy aliases from main.js
File: `/home/ewaldt/Documents/VS/GAMES/Phonics-Fun/js/main.js`

Change: delete every `// Legacy alias` block and its method body. Update internal callers (in same file) to use the canonical method name.

Verification: `node js/main.js` does not SyntaxError; grep for `// Legacy alias` returns 0 hits.

---

## Batch 2 (3 tasks)

### Task 2.1 — Extract shared game data to TypeScript
New files:
- `/home/ewaldt/Documents/VS/GAMES/Phonics-Fun/packages/shared/src/data/letters.ts`
- `/home/ewaldt/Documents/VS/GAMES/Phonics-Fun/packages/shared/src/data/word-message.ts`
- `/home/ewaldt/Documents/VS/GAMES/Phonics-Fun/packages/shared/src/index.ts`

Move `PHONICS_FUN_LETTER_DATA`, `buildLetterVocabulary()`, and `WordMessage` equivalent into the shared package. Re-export from `index.ts`.

### Task 2.2 — Generate Java data from TypeScript via script
New files:
- `/home/ewaldt/Documents/VS/GAMES/Phonics-Fun/packages/shared/scripts/gen-java-data.ts`
- `/home/ewaldt/Documents/VS/GAMES/Phonics-Fun/app/src/main/java/com/phonicsfun/model/LetterData.java` (new — generated)

Run:
```bash
npx tsx packages/shared/scripts/gen-java-data.ts
```

Expected: Java `LetterData.java` is written with A-Z word arrays. Android `GameState.java` imports from it.

### Task 2.3 — Wire shared package into web
In `js/main.js`, change `PHONICS_FUN_LETTER_DATA` source to import from `packages/shared/src/data/letters.ts` via a generated bundle or direct import (depending on tooling chosen).

Verification: vitest still passes; manual smoke test opens `index.html` and renders letter grid.

---

## Batch 3 (3 tasks)

### Task 3.1 — Add ESLint
New files: `.eslintrc.cjs` or `.eslint.config.js`
Run: `npx eslint js/**/*.js`

### Task 3.2 — Add GitHub Actions CI
New file: `.github/workflows/lint-and-test.yml`

Triggers on `push`/`pull_request`. Steps:
- checkout
- setup-node
- `npm ci`
- `npm test`
- `npx eslint js/**/*.js`

### Task 3.3 — Update existing Java GameState to use generated data
File: `/home/ewaldt/Documents/VS/GAMES/Phonics-Fun/app/src/main/java/com/phonicsfun/core/GameState.java`

Replace hardcoded `wordMessages.add(...)` with a single import of generated `LetterData` and populate via `getWordsForLetter()` already present.

Verification: `./gradlew compileDebugJavaWithJavac` succeeds (or JUnit compiles).

---

## Approval Gate

This plan must be approved before executing Batch 1. No code changes until then.

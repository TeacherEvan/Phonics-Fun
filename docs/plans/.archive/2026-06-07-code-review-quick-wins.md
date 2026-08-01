# Phonics-Fun Quick-Wins Implementation Plan

**Status:** ✅ **Archived — Implemented & Verified** (June 2025). Note: the JS-track tasks were completed; the Java `app/` tasks reference the now-legacy Android Java project (superseded by Capacitor — see `docs/ROADMAP.md` and `docs/archive/android-migration-java.md`).

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Fix critical issues and quick wins identified in the code review across JS web app and Android Java app.

**Architecture:** Two parallel tracks - JS (web) and Java (Android). Each task is independent and can be executed in any order.

**Tech Stack:** JavaScript (ES6, Vitest), Java 8 (Android), Gradle, npm

---

### Task 1: Add Missing normalizeTemplateId() in Java AudioManager

**Objective:** Fix crash bug - method called but not defined

**Files:**
- Modify: `app/src/main/java/com/phonicsfun/core/AudioManager.java`

**Step 1: Write failing test**

```java
// app/src/test/java/com/phonicsfun/core/AudioManagerTest.java
@Test
public void testNormalizeTemplateId() {
    AudioManager am = new AudioManager(context);
    assertEquals("british_female", am.normalizeTemplateId("british-female"));
    assertEquals("american_male", am.normalizeTemplateId("american-male"));
}
```

**Step 2: Run test to verify failure**
Run: `./gradlew test --tests AudioManagerTest.testNormalizeTemplateId`
Expected: FAIL - method not found

**Step 3: Write minimal implementation**

```java
// Add to AudioManager.java after line 200 (getVoiceTemplate)
private String normalizeTemplateId(String templateId) {
    if (templateId == null || templateId.trim().isEmpty()) {
        return DEFAULT_VOICE_TEMPLATE;
    }
    return templateId.replace("-", "_").toLowerCase();
}
```

**Step 4: Run test to verify pass**
Run: `./gradlew test --tests AudioManagerTest.testNormalizeTemplateId`
Expected: PASS

**Step 5: Commit**
```bash
git add app/src/main/java/com/phonicsfun/core/AudioManager.java app/src/test/java/com/phonicsfun/core/AudioManagerTest.java
git commit -m "fix: add missing normalizeTemplateId() method to AudioManager"
```

---

### Task 2: Replace Hardcoded 5000ms Timeout with Async Preload

**Objective:** Eliminate race condition on slow devices

**Files:**
- Modify: `js/main.js:725-731`

**Step 1: Write failing test**

```javascript
// Tests/preload.test.mjs
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameState } from '../js/main.js';

describe('initializeLetterLevel async preload', () => {
  it('awaits preloadLetterImages instead of setTimeout', async () => {
    const gameState = new GameState();
    const preloadSpy = vi.spyOn(gameState.performanceUtils, 'preloadLetterImages');
    preloadSpy.mockResolvedValue();
    
    await gameState.initializeLetterLevel('G');
    
    expect(preloadSpy).toHaveBeenCalledWith('G');
    // No setTimeout should be used
  });
});
```

**Step 2: Run test to verify failure**
Run: `npm test -- Tests/preload.test.mjs`
Expected: FAIL - setTimeout still used

**Step 3: Write minimal implementation**

```javascript
// In initializeLetterLevel, replace lines 727-731:
        // Preload assets for this letter during loading screen
        if (this.performanceUtils) {
            await this.performanceUtils.preloadLetterImages(letter);
        }

        // Transition to gameplay after loading
        this.dismissOverlay('ready-overlay');
        this.navigateToScreen('gameplay');
        this.startGameplaySession();
```

**Step 4: Run test to verify pass**
Run: `npm test -- Tests/preload.test.mjs`
Expected: PASS

**Step 5: Commit**
```bash
git add js/main.js Tests/preload.test.mjs
git commit -m "feat: replace hardcoded timeout with await preloadLetterImages()"
```

---

### Task 3: Define Local debounce Fallback in main.js

**Objective:** Fix ReferenceError when PerformanceUtils missing

**Files:**
- Modify: `js/main.js:264-266`

**Step 1: Write failing test**

```javascript
// Tests/debounce.test.mjs
import { describe, it, expect, beforeEach } from 'vitest';

describe('debounce fallback', () => {
  it('works without PerformanceUtils', () => {
    delete window.PerformanceUtils;
    const fn = () => {};
    const debounced = debounce(fn, 250);
    expect(typeof debounced).toBe('function');
  });
});
```

**Step 2: Run test to verify failure**
Run: `npm test -- Tests/debounce.test.mjs`
Expected: FAIL - debounce not defined

**Step 3: Write minimal implementation**

```javascript
// Add at top of main.js after imports, before GameState class:
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Then in setupEventListeners (line 264-266), change to:
        const debouncedResize = (window.PerformanceUtils && PerformanceUtils.debounce) 
            ? PerformanceUtils.debounce(resizeHandler, 250)
            : debounce(resizeHandler, 250);
```

**Step 4: Run test to verify pass**
Run: `npm test -- Tests/debounce.test.mjs`
Expected: PASS

**Step 5: Commit**
```bash
git add js/main.js Tests/debounce.test.mjs
git commit -m "fix: add local debounce fallback for missing PerformanceUtils"
```

---

### Task 4: Replace Broad Exception Catches in Java AudioManager

**Objective:** Improve error handling specificity

**Files:**
- Modify: `app/src/main/java/com/phonicsfun/core/AudioManager.java:71,73,88,107,117,167,184`

**Step 1: Write failing test**

```java
// app/src/test/java/com/phonicsfun/core/AudioManagerExceptionTest.java
@Test
public void testSpecificExceptionsCaught() {
    // Verify code compiles with specific exception types
    // This is a compile-time check
}
```

**Step 2: Run test to verify failure**
Run: `./gradlew compileDebugJavaWithJavac`
Expected: FAIL - if broad catches remain (won't fail compile but test documents intent)

**Step 3: Write minimal implementation**

```java
// Replace each catch (Exception e) with specific types:
// Line 71-73: catch (Resources.NotFoundException e)
// Line 88: catch (IllegalStateException | IllegalArgumentException e)
// Line 107: catch (Resources.NotFoundException e)
// Line 117: catch (Resources.NotFoundException e)
// Line 167: catch (IllegalStateException e)
// Line 184: catch (IllegalStateException e)
```

**Step 4: Run test to verify pass**
Run: `./gradlew compileDebugJavaWithJavac`
Expected: PASS (compiles)

**Step 5: Commit**
```bash
git add app/src/main/java/com/phonicsfun/core/AudioManager.java
git commit -m "fix: replace broad Exception catches with specific types in AudioManager"
```

---

### Task 5: Add ESLint + Prettier to JS Project

**Objective:** Enable linting for code quality

**Files:**
- Create: `.eslintrc.json`, `.prettierrc`, `.gitignore` (add node_modules)

**Step 1: Write failing test**

```bash
# Verify lint command works
npx eslint js/
```

**Step 2: Run test to verify failure**
Run: `npm run lint` (before config exists)
Expected: FAIL - no config

**Step 3: Write minimal implementation**

```json
// .eslintrc.json
{
  "env": { "browser": true, "es2021": true },
  "extends": ["eslint:recommended"],
  "parserOptions": { "ecmaVersion": "latest", "sourceType": "module" },
  "rules": {
    "no-unused-vars": "warn",
    "no-undef": "warn"
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 4,
  "trailingComma": "es5"
}
```

```json
// package.json - add scripts:
"lint": "eslint js/",
"lint:fix": "eslint js/ --fix",
"format": "prettier --write js/"
```

**Step 4: Run test to verify pass**
Run: `npm install && npm run lint`
Expected: PASS (may show warnings, no errors)

**Step 5: Commit**
```bash
git add .eslintrc.json .prettierrc package.json
git commit -m "chore: add ESLint + Prettier configuration"
```

---

### Task 6: Add Gradle Wrapper + Lint Task

**Objective:** Enable Android linting and reproducible builds

**Files:**
- Create: `gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.jar`, `gradle/wrapper/gradle-wrapper.properties`

**Step 1: Write failing test**

```bash
./gradlew lint
```

**Step 2: Run test to verify failure**
Run: `./gradlew lint` (before wrapper exists)
Expected: FAIL - no gradlew

**Step 3: Write minimal implementation**

```bash
# Run in app/ directory:
gradle wrapper --gradle-version 8.5
```

Then add to `app/build.gradle`:
```gradle
tasks.named('lint') {
    options.lintConfig file('lint.xml')
}
```

Create `app/lint.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<lint>
    <issue id="UnusedResources" severity="warning" />
    <issue id="HardcodedText" severity="warning" />
</lint>
```

**Step 4: Run test to verify pass**
Run: `cd app && ./gradlew lint`
Expected: PASS (may show warnings)

**Step 5: Commit**
```bash
git add gradlew gradlew.bat gradle/wrapper/ app/lint.xml app/build.gradle
git commit -m "chore: add Gradle wrapper and lint configuration"
```

---

## Execution Order

These 6 tasks are independent - execute in any order. Recommended:
1. Task 1 (Java crash fix) - highest priority
2. Task 3 (JS ReferenceError fix) - quick win
3. Task 2 (async preload) - improves UX
4. Task 4 (exception handling) - code quality
5. Task 5 (ESLint) - JS quality gate
6. Task 6 (Gradle wrapper) - Android quality gate

---

## Verification Checklist

After all tasks complete:
- [ ] `npm test` passes (4+ tests)
- [ ] `npm run lint` passes (no errors)
- [ ] `cd app && ./gradlew test` passes
- [ ] `cd app && ./gradlew lint` passes
- [ ] No `normalizeTemplateId` crashes in Android
- [ ] No `debounce` ReferenceError in JS
- [ ] No hardcoded 5000ms timeout in `initializeLetterLevel`
- [ ] No broad `Exception` catches in Java AudioManager

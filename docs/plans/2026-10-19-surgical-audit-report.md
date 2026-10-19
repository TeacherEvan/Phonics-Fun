# Surgical Audit Report: Phonics-Fun

| Audit Metadata | Specification |
| :--- | :--- |
| **Audit Date** | 2026-10-19 |
| **Audited Scope** | `js/`, `public/`, `harness/`, `app/src/main/java/` (`29` impl files [19 JS/TS/Py + 10 Java], `13` test files [10 Vitest + 3 JUnit], `6,094` effective JS/Py LOC + `1,850` effective Java LOC) |
| **Tech Stack & Runtime** | Vanilla ES6 JavaScript, HTML5 DOM/CSS3 Animations, Web Audio API + SpeechSynthesis, Service Worker PWA, Capacitor 8, Android Native Java (SDK 34, SoundPool, MediaPlayer, Canvas) |
| **Pre/Post Audit SHA-256** | `8775554c6a8c6d35 / 8775554c6a8c6d35 (VERIFIED ZERO MUTATION)` |
| **Deterministic Health Score** | **`32 / 100`** (`D_raw = 146`, `P_test = 8.85`, `M_kill = 41%`) |
| **Vibe-Debt Risk Level** | **`CRITICAL`** |

---

## 1. Executive Architecture & Vibe-Debt Triage

Phonics-Fun suffers from severe multi-pass AI "vibe-coding" split-brain across both its primary Web/Capacitor stack (`js/`) and its parallel Android Native Java stack (`app/src/main/java/`). In the core Web gameplay controller (`js/main.js`), an incomplete method-renaming pass renamed four lifecycle methods (`updateProgressDisplay`, `playVocabularyAudio`, `displayWordImage`, `completeLevelSuccessfully`) at their declarations while leaving `handleCorrectCollision()` and `setupEventSubscriptions()` invoking the old names (`updateProgress`, `playVoiceMessage`, `showWordImage`, `completeLevel`), causing an immediate `TypeError` crash on the very first correct planet hit. Simultaneously, global `touchstart`/`touchend` listeners call `e.preventDefault()` on `.game-area` and `.planet` (`js/main.js:L375-L412`), suppressing browser-synthesized `click` events on all touch devices while planets only bind `click` listeners. Level transitions from `level-select` fail to reset `this.arePlanetsRendered`, preventing any planets from spawning on Level 2+, while `AudioManager` and `AndroidBenQInitializer` instantiate duplicate global singletons and leak `50ms` particle interval timers and DOM nodes on every click. Finally, the test suite (`M_kill = 41%`) masks these failures by skipping `GameState` instantiation (`it.skip` in `game-state.test.mjs:L176`), testing copy-pasted private methods inside the test file (`AudioManagerNormalizeTest.java:L47`), and asserting `expect(true).toBe(true)` (`audio-manager.test.mjs:L264, L271`).

| Severity Tier | Count | Deduction Weight | Primary Failure Domains |
| :--- | :--- | :--- | :--- |
| **P0 — Critical (Crash / Data Loss / Security / Leak)** | `4` | `-18 pts ea` | `js/main.js` (undefined method calls crashing collision & level completion; `e.preventDefault()` blocking all touch clicks; `arePlanetsRendered` locking out Level 2+), `AudioManager.java` & `SymbolGameActivity.java` (startup `Resources$NotFoundException` & `NullPointerException`) |
| **P1 — High (Frame-Budget / Race / Logic Bug)** | `7` | `-8 pts ea` | `js/main.js` (unterminated 20Hz `trailInterval` + wrong-planet asteroid interception; teacher export double-counting), `js/audio-manager.js` (dropped async `play()` on load completion + duplicate `AudioContext`), `js/android-benq-init.js` (1Hz audio error storm + null `event.error` crash), `js/performance-utils.js` (broken `img.complete` cache poisoning), `js/particles.js` (60x velocity mismatch + layout thrash), `CollisionManager.java` (in-place `RectF.intersect` mutation) |
| **P2 — Medium (God File / Split-Brain State / Debt)** | `5` | `-3 pts ea` | `js/main.js` & `js/audio-manager.js` (God files + 3-way vocabulary split-brain; conflicting `visibilitychange` handlers; male TTS voice fallback bug), `js/display-manager.js` (init-order bug & body class accumulation), `js/ui-utils.js` (`innerHTML` sink & transition race), `public/sw.js` & `harness/mcp-audio.js` (offline `respondWith(undefined)` & infinite polling loops) |
| **P3 — Low (Magic Constants / DX / Portability)** | `3` | `-1 pt ea` | `js/event-bus.js` & `harness/legacy/` (orphaned `EventBus`), `SymbolRenderer.java` (`Set.toString().toCharArray()` bug & unattached `GameView`), `coverage/` (committed build artifacts) |

### High-Risk File Telemetry Hotspots

| File Path | Effective LOC | Est. Cyclomatic Complexity / Branch Density | Silent Catches | Primary Vibe-Debt Signature |
| :--- | :--- | :--- | :--- | :--- |
| `js/main.js` | `1,302` (`1,824` raw) | `CC=1` (top-level) / `5` nesting depth / `10` hot-loop markers | `0` | God controller (`>1,300` LOC), half-renamed method calls (`updateProgress` vs `updateProgressDisplay`), leaked `setInterval` trails, broken touch & level reset |
| `js/audio-manager.js` | `785` (`1,007` raw) | `CC=1` (top-level) / `6` nesting depth / `13` hot-loop markers | `0` | God audio manager, duplicate `new AudioManager()` global singleton (`L1007`), dropped async `play()` after `ensureSoundLoaded()`, broken male voice selection |
| `harness/android-diagnostic.js` | `407` (`504` raw) | `CC=1` / `5` nesting depth / `20` hot-loop markers | `0` | God diagnostic class, auto-executes on `DOMContentLoaded`, contradicts WCAG viewport rules in `android-benq-init.js` |
| `js/ui-utils.js` | `386` (`551` raw) | `CC=1` / `5` nesting depth / `5` hot-loop markers | `0` | Unsanitized `innerHTML` toast/indicator sinks, uncancelled nested `setTimeout` screen transition race, leaked document `click` listener |
| `js/particles.js` | `370` (`454` raw) | `CC=1` / `6` nesting depth / `2` hot-loop markers | `0` | Unclamped `Date.now()` `deltaTime`, `60x` velocity unit mismatch (`px/s` vs `px/frame`), per-frame `style.left`/`top` layout thrashing, 100 untracked `setTimeout`s |
| `js/android-benq-init.js` | `361` (`490` raw) | `CC=1` / `6` nesting depth / `5` hot-loop markers | `0` | Instantiated twice on boot, misidentifies all 1080p/4K screens as BenQ boards, triggers 1Hz `<audio>` reload loop, crashes on null `event.error` |
| `js/display-manager.js` | `354` (`543` raw) | `CC=1` / `4` nesting depth / `2` hot-loop markers | `0` | Checks `window.game.particleSystem` in constructor before `window.game` exists, leaks global listeners, accumulates stale `display-*` classes on `document.body` |
| `js/performance-utils.js` | `240` (`365` raw) | `CC=20` / `0.0792` density / `7` hot-loop markers | `0` | Caches broken `HTMLImageElement` instances (`Assets/images/...` 404s) before `onload`, poisoning `getCachedImage()` |
| `js/collision-manager.js` | `223` (`377` raw) | `CC=1` / `8` nesting depth / `11` hot-loop markers | `0` | Per-frame `this.animate.bind(this)` allocation, $O(N^2)$ `getBoundingClientRect()` layout thrashing, indiscriminate `asteroid_planet` pair matching |
| `app/src/main/java/com/phonicsfun/core/AudioManager.java` | `312` (`408` raw) | `7` nesting depth | `0` | Uncaught `Resources$NotFoundException` on `resId == 0` crashes Android app on launch; invalid `MediaPlayer.start()` after `stop()` |

---

## 2. The 10-Principal-Engineer Deep Audit

### Lens 1: Systems Architect (Topology, Coupling & State Machines)

- **[P0-1] Incomplete Method-Rename Split-Brain Crashes Core Collision & Level Completion** — `js/main.js:L503-L505`, `js/main.js:L582-L595`, `js/main.js:L1242-L1415`
  - **Root Cause Mechanism:** During a refactoring pass on `GameState`, four methods were renamed at their declaration sites (`playVoiceMessage` $\rightarrow$ `playVocabularyAudio` at `L1242`, `showWordImage` $\rightarrow$ `displayWordImage` at `L1280`, `updateProgress` $\rightarrow$ `updateProgressDisplay` at `L1381`, and `completeLevel` $\rightarrow$ `completeLevelSuccessfully` at `L1411`), but their call sites inside `setupEventSubscriptions()` (`L504`) and `handleCorrectCollision()` (`L583, L584, L594`) were never updated.
  - **Deterministic Trigger & Failure Mode:** Clicking any target planet spawns a fiery asteroid; upon collision (~1000ms later), `handleCorrectCollision()` executes `this.updateProgress()` at `L594`, synchronously throwing `Uncaught TypeError: this.updateProgress is not a function`. Execution aborts before `L602` (`if (this.correctHits >= this.totalHits)`), so the HUD progress bar never updates and no level can ever complete. Exactly 500ms later, the scheduled timer at `L582` fires and throws a second `Uncaught TypeError: this.playVoiceMessage is not a function` at `L583`, preventing word pronunciation and word image display. Even if `level:complete` is emitted manually, `L504` throws `Uncaught TypeError: this.completeLevel is not a function`.
  - **Surgical Fix Specification:** Update `js/main.js:L504` to call `this.completeLevelSuccessfully()`, `L583` to call `this.playVocabularyAudio()`, `L584` to call `this.displayWordImage()`, and `L594` to call `this.updateProgressDisplay()` (or alias the legacy method names to the new implementations).

- **[P0-3] Stale `arePlanetsRendered` Boolean Flag Blocks Planet Spawning on All Subsequent Levels** — `js/main.js:L311-L316`, `js/main.js:L916-L926`, `js/main.js:L1411-L1451`, `js/main.js:L1501-L1507`
  - **Root Cause Mechanism:** `GameState` relies on an implicit boolean flag `this.arePlanetsRendered` (`L93`) instead of a deterministic state machine transition hook. `resetGameplayState()` (which resets `this.arePlanetsRendered = false` and clears `.planets-container`) is only invoked inside `onScreenTransitionComplete(screenId)` when `screenId === 'welcome'` (`L1502-L1504`). When a level finishes (`completeLevelSuccessfully()` at `L1411`) and the user clicks `#next-level-btn` (`L311-L316`), the game navigates to `'level-select'`, bypassing `resetGameplayState()`.
  - **Deterministic Trigger & Failure Mode:** Complete Level `'A'` (or navigate `gameplay` $\rightarrow$ `level-select` $\rightarrow$ `gameplay` for Letter `'B'`). `startGameplaySession()` (`L907-L926`) checks `if (!this.arePlanetsRendered)` at `L922`, sees `true` from Level `'A'`, and skips `renderGameplayPlanets()`. Level `'B'` starts with zero target `'B'` planets on screen and leftover distractor planets from Level `'A'`, rendering the game unwinnable.
  - **Surgical Fix Specification:** Call `this.resetGameplayState()` at the start of `startGameplaySession()` (or on exit from `'gameplay'` screen) and unconditionally render the active level's planets.

- **[P2-1] Monolithic God Classes (`js/main.js`, `js/audio-manager.js`) & Triple Vocabulary Split-Brain** — `js/main.js:L21-L48`, `app/src/main/java/com/phonicsfun/core/GameState.java:L77-L95`, `app/src/main/java/com/phonicsfun/core/SymbolRenderer.java:L69-L96`
  - **Root Cause Mechanism:** `js/main.js` (`1,302` effective LOC) couples static data tables, DOM event binding, screen routing, asteroid/planet DOM physics, audio orchestration, `localStorage` persistence, and teacher file export inside a single class. Furthermore, vocabulary definitions are duplicated across three unlinked files with conflicting contents: `js/main.js:L23` defines `B` as `['ball', 'bat', 'bear', 'boat', 'butterfly']`, `SymbolRenderer.java:L93` defines `B` as `{"ball", "bat", "bird", "boat", "bear"}`, and `GameState.java:L93-L94` defines `B` as only `{"ball", "bat"}`.
  - **Deterministic Trigger & Failure Mode:** Selecting Letter `'B'` in the Android Java app (`GameState.java:L104`) loads only 2 words (`ball`, `bat`) while `totalHits` is hardcoded to `5` (`GameState.java:L55`), making Letter `'B'` (and `'A'`) mathematically impossible to complete (`2 < 5`).
  - **Surgical Fix Specification:** Extract vocabulary data into a single canonical JSON schema shared by Web and Android assets, and set `totalHits = letterWords.size()` dynamically inside `GameState.java:startGame()`.

- **[P3-1] Orphaned `EventBus` & Dead Legacy Entities** — `js/main.js:L10`, `js/main.js:L522-L530`, `js/event-bus.js:L1-L4`, `harness/legacy/asteroid.js:L1-L42`, `harness/legacy/planet.js:L1-L11`
  - **Root Cause Mechanism:** `js/main.js` imports `EventBus` from `./event-bus.js` (`L10`), while also instantiating `this.eventManager = new EventManager()` (`L112`). At `L522`, it checks `if (window.EventBus)`, which is always `undefined` because `js/event-bus.js` never assigns `window.EventBus`.
  - **Deterministic Trigger & Failure Mode:** `L522-L530` is unreachable dead code in production; the `'planet-hit'` event it listens for is only dispatched in unused legacy classes under `harness/legacy/`.
  - **Surgical Fix Specification:** Remove `js/event-bus.js`, the `EventBus` import and dead listener in `js/main.js:L10, L522-L530`, and archive `harness/legacy/`.

---

### Lens 2: Frame-Budget & Performance Engineer (Hot Loops & Latency)

- **[P1-6] Per-Frame DOM Layout Thrashing (`style.left`/`top` + `getBoundingClientRect()`) & Per-Frame Closure Allocations** — `js/particles.js:L165-L185`, `js/particles.js:L210`, `js/collision-manager.js:L53`, `js/collision-manager.js:L96-L111`, `js/collision-manager.js:L214-L217`
  - **Root Cause Mechanism:** During active gameplay with an asteroid in flight, `CollisionManager.update()` calls `getBoundingClientRect()` on every registered planet and asteroid at 60Hz (`js/collision-manager.js:L101, L216`), while `ParticleSystem.updateParticle()` simultaneously mutates `particle.element.style.left` and `particle.element.style.top` on up to `100` DOM nodes per frame (`js/particles.js:L166-L167`). Interleaving geometric style mutations (`left`/`top`) with `getBoundingClientRect()` reads forces synchronous browser layout recalculations (forced reflow) on every frame. Additionally, `CollisionManager.animate()` (`L53`) executes `requestAnimationFrame(this.animate.bind(this))` every frame, allocating 60 bound function objects/sec.
  - **Deterministic Trigger & Failure Mode:** Spawning an asteroid with trail particles while explosion particles are active triggers `>100` DOM style invalidations plus synchronous `getBoundingClientRect()` reflows per `16.67ms` frame, exceeding the 60Hz frame budget on mobile/BenQ Android WebView GPUs.
  - **Surgical Fix Specification:** Pre-bind `this.animate = this.animate.bind(this)` once in `CollisionManager.constructor()` and `ParticleSystem.constructor()`, and replace `style.left`/`style.top` updates in `ParticleSystem.updateParticle()` with compositor-only `transform: translate3d(x, y, 0)`.

- **[P3-2] Per-Frame `new Paint()` Allocation Inside Android `onDraw()` & Broken `getSupportedSymbols()`** — `app/src/main/java/com/phonicsfun/core/SymbolRenderer.java:L145`, `app/src/main/java/com/phonicsfun/core/SymbolRenderer.java:L195-L217`
  - **Root Cause Mechanism:** `SymbolRenderer.renderSymbol()` (invoked from `View.onDraw(Canvas)` at `GameplayActivity.java:L226`) calls `addGlowEffect()` (`L145`), which instantiates `new Paint(Paint.ANTI_ALIAS_FLAG)` (`L196`) on the UI draw thread. Additionally, `getSupportedSymbols()` (`L216`) calls `symbolConfigs.keySet().toString().toCharArray()`, converting the formatted string `"[#, $, A, B, G]"` into a `char[]` containing brackets, commas, and spaces.
  - **Deterministic Trigger & Failure Mode:** Every `onDraw()` pass allocates a new `Paint` object on the Android render thread (triggering GC pauses), and calling `getSupportedSymbols()` returns `15` characters (`'[', '#', ',', ' ', ...`) instead of the `5` configured symbol keys.
  - **Surgical Fix Specification:** Pre-allocate `glowPaint` in `initializePaints()` (`SymbolRenderer.java:L56`) and implement `getSupportedSymbols()` by iterating `symbolConfigs.keySet()` into `new char[symbolConfigs.size()]`.

---

### Lens 3: Mathematical, Physics & Algorithmic Engineer (Precision & Edge Cases)

- **[P1-1] Cross-Screen Random-Edge Asteroid Trajectory Collides with Unrelated Non-Target Planets** — `js/main.js:L508-L519`, `js/main.js:L1046-L1193`, `js/collision-manager.js:L285-L334`
  - **Root Cause Mechanism:** When a child clicks a specific `planetElement` at `(planetCenterX, planetCenterY)`, `spawnAsteroid()` (`js/main.js:L1128-L1149`) spawns an asteroid at a random viewport edge (`top`, `right`, `bottom`, or `left`) and animates it across the screen via CSS `transition: all 1000ms linear`. However, `CollisionManager` registers a global type handler `registerTypeCollision('asteroid', 'planet', ...)` (`js/main.js:L508-L519`) that tests the asteroid against **all** planets in the scene (`js/collision-manager.js:L288-L333`) rather than pairing it with the clicked target planet. Furthermore, because all planets move continuously via CSS `planetOrbit` (`js/main.js:L963, L1015`), the clicked planet moves away from `(targetX, targetY)` during the `1000ms–1500ms` flight time.
  - **Deterministic Trigger & Failure Mode:**
    1. *Wrong-Planet Interception:* User clicks target planet `'A'`. `spawnAsteroid` spawns a fiery asteroid at the right screen edge. A distractor planet `'Z'` lies between the right edge and `'A'`. At `T ≈ 400ms`, the asteroid overlaps `'Z'`; `CollisionManager` fires `collision:asteroid_planet` for `'Z'`; `handleAsteroidPlanetCollision()` (`L544`) sees `'Z' !== 'A'`, calls `handleIncorrectCollision()`, unregisters the asteroid, and records an **incorrect hit** even though the child clicked the correct planet.
    2. *Orbiting Planet Miss:* If no planet intercepts the asteroid and the clicked planet orbits `>50px` away during the `1000ms` flight, the asteroid stops at `(targetX, targetY)` without ever colliding, remaining registered in `CollisionManager` forever.
  - **Surgical Fix Specification:** Pass the clicked `planetId` into `spawnAsteroid()`, register a specific collision pair via `this.collisionManager.registerCollisionPair(asteroidId, planetId, ...)` instead of indiscriminate all-pairs type matching, and add a fallback cleanup timer on `transitionend` (`animationDuration + 50ms`) that resolves the hit on the targeted planet and removes `asteroidElement`.

- **[P1-5] Teacher Export Accuracy & Hit Counter Double-Counting Math Defect** — `js/main.js:L588-L593`, `js/main.js:L616-L621`, `js/main.js:L1672-L1703`, `js/main.js:L1736-L1753`
  - **Root Cause Mechanism:** On every collision (`L588-L591` and `L616-L619`), `GameState` increments both the current-level counters (`this.correctHits++`, `this.incorrectHitsCount++`, `this.totalAnswersCount++`) and the cumulative counters (`this.cumCorrect++`, `this.cumIncorrect++`, `this.cumTotal++`). However, `exportTeacherData()` (`L1741-L1748`) adds them together: `correctHits: this.cumCorrect + this.correctHitsCount` and `incorrectHits: this.cumIncorrect + this.incorrectHitsCount`. Additionally, `loadSavedStats()` (`L1672-L1686`) restores `correctHitsCount`/`incorrectHitsCount`/`totalAnswersCount` from `localStorage` but omits `cumCorrect`/`cumIncorrect`/`cumTotal`.
  - **Deterministic Trigger & Failure Mode:** A student hits 4 correct planets and 1 distractor in Level `'A'`. Both `correctHitsCount` and `cumCorrect` equal `4`. When the teacher clicks `#export-data-btn` during or immediately after Level `'A'`, `exportTeacherData()` outputs `correctHits: 8` (`4 + 4`) and `incorrectHits: 2` (`1 + 1`), inflating reported totals by 2x. If the page is refreshed, `cumCorrect` resets to `0`.
  - **Surgical Fix Specification:** Treat `cumCorrect`, `cumIncorrect`, and `cumTotal` as the single monotonic cumulative counters (reporting `this.cumCorrect` directly in `exportTeacherData()` without adding `this.correctHitsCount`), and restore `cumCorrect`, `cumIncorrect`, and `cumTotal` inside `loadSavedStats()`.

- **[P1-6b] Unclamped `deltaTime` & 60x Velocity Unit Mismatch in `ParticleSystem`** — `js/particles.js:L148-L163`, `js/particles.js:L198-L250`, `js/particles.js:L397-L422`
  - **Root Cause Mechanism:** `ParticleSystem.updateParticle()` (`L158-L162`) scales velocity by `deltaTime * 60` (`particle.x += particle.velocity.x * deltaTime * 60`), which expects `velocity` in `px/frame` (`~2–5`). While `createEnhancedExplosion()` (`L259`) uses `speed = 2..5`, `createExplosion()` (`L220`, `L243`), `createDebris()` (`L342`), and `levelComplete()` (`L415`) pass `speed = 50..200` (`px/sec`), which gets multiplied by `60` again (`3,000–12,000 px/sec`). Furthermore, `animate()` (`L202`) computes `deltaTime = (currentTime - (this.lastTime || currentTime)) / 1000` without clamping `Math.min(deltaTime, 0.05)`.
  - **Deterministic Trigger & Failure Mode:** Every call to `planetDestroyed()` (`L392`) or `levelComplete()` (`L397`) launches particles at `75–225 px/frame`, teleporting them outside viewport bounds (`L188-L195`) in 3–5 frames (`~50ms`). Switching browser tabs for `>1s` causes `deltaTime > 1.0`, instantly killing or teleporting all active starfield and explosion particles on tab return.
  - **Surgical Fix Specification:** Clamp `const deltaTime = Math.min((currentTime - (this.lastTime || currentTime)) / 1000, 0.05);` in `animate()`, and normalize `createExplosion()`, `createDebris()`, and `levelComplete()` speeds to `px/frame` (`2–8`) matching `createEnhancedExplosion()`.

- **[P1-7a] Destructive In-Place `RectF.intersect()` Mutation in Android `CollisionManager`** — `app/src/main/java/com/phonicsfun/core/CollisionManager.java:L69-L71`
  - **Root Cause Mechanism:** `CollisionObject.intersects(CollisionObject other)` calls `return bounds.intersect(other.bounds);` (`L70`). In `android.graphics.RectF`, the instance method `a.intersect(b)` mutates `a` in-place to the intersection rectangle whenever `a` and `b` overlap, whereas the static method `RectF.intersects(a, b)` is non-mutating.
  - **Deterministic Trigger & Failure Mode:** Any call to `obj1.intersects(obj2)` when two objects partially overlap permanently shrinks `obj1.bounds` to the overlap sliver, corrupting `obj1.getCenterX()`, `getCenterY()`, and subsequent collision checks.
  - **Surgical Fix Specification:** Replace `return bounds.intersect(other.bounds);` at `CollisionManager.java:L70` with `return RectF.intersects(this.bounds, other.bounds);`.

---

### Lens 4: Concurrency, Async & Determinism Engineer (Race Conditions)

- **[P1-2] `AudioManager.play(id)` Drops Playback After Async `ensureSoundLoaded(id)` Resolves + Unconditional Speech Synthesis Overlap** — `js/audio-manager.js:L296-L315`, `js/main.js:L280-L287`, `js/main.js:L875`, `js/main.js:L1257-L1270`
  - **Root Cause Mechanism:** When `AudioManager.play(id)` is called for a sound not yet in `this.sounds` (`!this.hasLoadedSound(id)` at `L296`), it invokes `this.ensureSoundLoaded(id).finally(() => { ... })` and returns early (`L314`). Inside `.finally()` (`L297-L313`), the branches only check `if (!this.hasLoadedSound(id) && id.startsWith('voice-'))` and `else if (!this.hasLoadedSound(id) && id.startsWith('phoneme-'))`. When `ensureSoundLoaded(id)` **succeeds**, `this.hasLoadedSound(id)` is `true`, so both `if` conditions evaluate to `false` and the loaded audio buffer is **never played**. Compounding this, `playVocabularyAudio()` (`js/main.js:L1257-L1270`) calls `this.audioManager.play(audioKey)` and then unconditionally runs `setTimeout(() => { if (...) this.audioManager.speak(...); }, 500)`, speaking over prerecorded `.wav` files rather than only falling back on failure.
  - **Deterministic Trigger & Failure Mode:**
    1. User opens Settings on the Welcome screen and checks `#low-priority-audio` (`js/main.js:L280-L287`). `setAudioPriority('low', true)` starts fetching `/sounds/background-music.wav`. Line 285 immediately calls `this.audioManager.play('background-music')` while the fetch is in flight. When the fetch completes, `.finally()` does nothing—background music never starts.
    2. User starts Letter `'G'` (`initializeLetterLevel('G')` at `L875` does not `await` `ensureLetterAudio('G')`) or clicks `#preview-voice`. If the `.wav` finishes loading inside `play()`, playback is silently dropped.
  - **Surgical Fix Specification:** In `js/audio-manager.js:L297-L313`, if `this.hasLoadedSound(id)` is `true` after `ensureSoundLoaded(id)` settles, recursively invoke `this.play(id)` (with a single-retry guard); and remove the redundant 500ms `setTimeout` speech synthesis call in `js/main.js:L1260-L1270` since `AudioManager.play()` already handles the `speechSynthesis` fallback at `js/audio-manager.js:L299-L306`.

- **[P2-4a] Uncancelled Screen Transition Timers Corrupt `.screen.active` State** — `js/ui-utils.js:L443-L469`, `js/main.js:L893-L895`, `js/main.js:L1453-L1495`
  - **Root Cause Mechanism:** `UIUtils.transitionScreens(fromScreen, toScreen, callback)` schedules two nested `300ms` `setTimeout` calls (`L448`, `L464`) without storing or cancelling pending transition timer IDs. Meanwhile, `navigateToScreen()` (`js/main.js:L1463`) queries `document.querySelector('.screen.active')` before the previous 300ms exit timer has removed `.active` from the old screen.
  - **Deterministic Trigger & Failure Mode:** Triggering two screen transitions within `<600ms` (e.g., clicking `#start-game-btn` to transition `welcome` $\rightarrow$ `level-select` and immediately clicking Letter `'A'` within `300ms`) causes `document.querySelector('.screen.active')` to select `#welcome-screen` instead of `#level-select-screen`, leaving `#level-select-screen` with `.active` permanently alongside `#gameplay-screen`.
  - **Surgical Fix Specification:** Track `this.activeTransitionTimers` in `UIUtils` and cancel any in-flight transition timers (immediately finalizing class state) before starting a new `transitionScreens()` call.

---

### Lens 5: Memory & Resource Lifecycle Engineer (Leaks & Cleanup)

- **[P1-1b] Unterminated `50ms` `trailInterval` & Detached Asteroid DOM Leak** — `js/main.js:L557-L630`, `js/main.js:L1074-L1100`, `js/particles.js:L397-L434`
  - **Root Cause Mechanism:** `processCorrectPlanetHit()` (`js/main.js:L1082-L1098`) starts a `setInterval(..., 50)` that only calls `clearInterval(trailInterval)` when `!(asteroidElement && asteroidElement.parentNode)`. However, neither `handleCorrectCollision()` (`L557-L607`) nor `handleIncorrectCollision()` (`L609-L630`) ever calls `asteroidElement.remove()`. Thus `asteroidElement.parentNode` remains `.asteroids-container` for the entire level, and every clicked target planet leaks a permanent 20Hz `setInterval` spawning 5 DOM particles every 50ms (`100 particles/sec` per clicked planet). Similarly, `ParticleSystem.levelComplete()` (`js/particles.js:L402-L421`) spawns 100 untracked `setTimeout`s up to `5000ms` that are not cleared in `ParticleSystem.destroy()` (`L425-L434`).
  - **Deterministic Trigger & Failure Mode:** Clicking 5 target planets in a level spawns 5 concurrent `50ms` `setInterval` loops generating `500` particles/sec at the resting coordinates of the 5 unremoved `.asteroid` DOM elements until `resetGameplayState()` is called (which never happens when advancing via `#next-level-btn`, accumulating intervals across levels).
  - **Surgical Fix Specification:** Store `asteroidElement.trailInterval = trailInterval`, clear it and call `asteroidElement.remove()` inside both `handleCorrectCollision()` and `handleIncorrectCollision()`, and track all timer IDs in `ParticleSystem` so `destroy()` clears them.

- **[P1-3] Duplicate Global Instantiation of `AudioManager` and `AndroidBenQInitializer` & Leaked Event Listeners** — `js/audio-manager.js:L1007`, `js/android-benq-init.js:L391`, `js/android-benq-init.js:L477-L482`, `js/main.js:L111, L124`, `js/display-manager.js:L528-L534`
  - **Root Cause Mechanism:**
    1. `js/audio-manager.js:L1007` executes `window.audioManager = new AudioManager();` at module import time, and `GameState.constructor()` (`js/main.js:L111`) executes `this.audioManager = new AudioManager();`. Both instances create separate hardware `AudioContext` instances (`js/audio-manager.js:L74`) and fetch/decode default audio files twice.
    2. `js/android-benq-init.js:L477-L482` creates `window.androidBenQInitializer = new AndroidBenQInitializer()` on `DOMContentLoaded`, while `GameState.constructor()` (`js/main.js:L124`) creates a second `this.androidBenQInitializer = new AndroidBenQInitializer()`. Both start untracked `setInterval(checkMemory, 30000)` timers (`L391`) and register duplicate global `error`, `unhandledrejection`, `resize`, and `orientationchange` listeners.
    3. `DisplayManager.destroy()` (`js/display-manager.js:L532`) contains the literal comment `// Remove event listeners would go here if we stored references`, leaking its `resize`, `orientationchange`, and `visibilitychange` listeners.
  - **Deterministic Trigger & Failure Mode:** Every page load allocates 2 `AudioContext`s (consuming 2 of the browser's hardware audio context slots before gameplay begins), runs duplicate network fetches for `explosion.wav` and `celebration.wav`, and registers 3 `window.onerror` handlers, 3 `unhandledrejection` handlers, 3 `visibilitychange` handlers, and 3 `resize` handlers.
  - **Surgical Fix Specification:** Remove the eager module-bottom `new AudioManager()` (`js/audio-manager.js:L1007`) and `DOMContentLoaded` `new AndroidBenQInitializer()` (`js/android-benq-init.js:L477-L482`), or reuse the singleton instance in `GameState.constructor()`. Store bound listener and interval references on `DisplayManager`, `UIUtils`, and `AndroidBenQInitializer` so `.destroy()` removes them cleanly.

---

### Lens 6: Security & Trust-Boundary Engineer (AppSec & Sandboxing)

- **[P2-4b] Unsanitized `innerHTML` DOM XSS Sinks in `UIUtils` & `MCPDiagnosticController`** — `js/ui-utils.js:L402-L405`, `js/ui-utils.js:L426-L433`, `harness/mcp-controller.js:L375-L378`, `harness/mcp-controller.js:L398-L401`
  - **Root Cause Mechanism:** `UIUtils.showToast(message, type)` (`js/ui-utils.js:L402-L405`) and `UIUtils.createLoadingIndicator(text)` (`L426-L433`) interpolate `message` and `text` directly into `element.innerHTML` template literals instead of using `textContent`. Similarly, `MCPDiagnosticController.createVisualReport()` (`harness/mcp-controller.js:L398-L401`) injects `report.deviceInfo` properties into `row.innerHTML`.
  - **Deterministic Trigger & Failure Mode:** If any dynamic string containing `<img src=x onerror=...>` or HTML markup is passed to `showToast(message)` or `createLoadingIndicator(text)`, arbitrary HTML/script injection occurs in the DOM context (mitigated only when deployed behind Vercel's CSP header, but active in local/Capacitor Android WebView contexts where `vercel.json` headers are not served).
  - **Surgical Fix Specification:** Replace `toast.innerHTML` in `js/ui-utils.js:L402-L405` and `indicator.innerHTML` in `L426-L433` with `document.createElement('span')` and `.textContent = message`.

---

### Lens 7: Reliability, Fault Tolerance & Chaos Engineer (Crash Vectors)

- **[P0-4] Android Native Launch Crash (`Resources$NotFoundException`) & `SymbolGameActivity` `NullPointerException`** — `app/src/main/java/com/phonicsfun/core/AudioManager.java:L65-L94`, `app/src/main/java/com/phonicsfun/activities/SymbolGameActivity.java:L24, L54-L60, L126-L129`
  - **Root Cause Mechanism:**
    1. `AudioManager.java` calls `getResId("celebration", "raw")` (`L70`), `getResId("explosion", "raw")` (`L71`), `getResId("phoneme_g", "raw")` (`L72`), and `getResId("background_music", "raw")` (`L85`). None of these 4 files exist in `app/src/main/res/raw/`, so `getIdentifier()` returns `0`. Passing resource ID `0` to `soundPool.load(context, 0, 1)` or `MediaPlayer.create(context, 0)` throws `android.content.res.Resources$NotFoundException: Resource ID #0x0`. However, `loadDefaultSounds()` (`L75`) only catches `IllegalStateException | IllegalArgumentException` and `initializeBackgroundMusic()` (`L91`) only catches `IllegalStateException | IllegalArgumentException | SecurityException`. Because `Resources.NotFoundException` extends `RuntimeException` directly, it escapes uncaught!
    2. `SymbolGameActivity.onCreate()` (`L24`) calls `demonstrateSymbolRendering()` $\rightarrow$ `renderSymbolExample('G', 1)` (`L54`), which obtains `Canvas canvas = getCanvasFromView();` (`L56`, hardcoded to `return null;` at `L128`) and passes `null` into `symbolRenderer.renderSymbol(canvas, ...)` (`L60`), dereferencing `canvas.drawCircle(...)` at `SymbolRenderer.java:L131`.
  - **Deterministic Trigger & Failure Mode:** Launching `WelcomeActivity`, `GameplayActivity`, or `SettingsActivity` on Android immediately crashes the app process in `new AudioManager(context)` with `Resources$NotFoundException`. Launching `SymbolGameActivity` immediately crashes in `onCreate()` with `NullPointerException`.
  - **Surgical Fix Specification:** In `AudioManager.java:L69-L90`, guard every `soundPool.load` and `MediaPlayer.create` call with `if (resId != 0)` (mirroring `loadVoiceVariant` at `L118`) and include ` android.content.res.Resources.NotFoundException` in the `catch` clauses. In `SymbolGameActivity.java:L59` and `SymbolRenderer.java:L120`, guard `if (canvas == null || bounds == null) return;`.

- **[P1-3b] Unhandled `TypeError` Inside Global `window.onerror` Handler & Infinite 1Hz Audio Retry Storm on 1080p/4K Screens** — `js/android-benq-init.js:L34-L43`, `js/android-benq-init.js:L276-L295`, `js/android-benq-init.js:L415-L438`, `index.html:L258-L288`
  - **Root Cause Mechanism:**
    1. `AndroidBenQInitializer.setupErrorHandling()` (`js/android-benq-init.js:L419`) executes `if (event.error.message.includes('Audio'))` without checking if `event.error` or `event.error.message` is defined, and `L431` executes `event.reason.toString()` without checking if `event.reason` is null/undefined.
    2. `detectBenQBoard()` (`L34-L43`) returns `true` for **any** `1920x1080` or `3840x2160` monitor. When `true`, `fixBenQAudio()` (`L280-L294`) sets `audio.preload = 'auto'` on all 6 `<audio>` tags in `index.html:L258-L288` (which point to broken `Assets/sounds/...` paths instead of `/sounds/...`) and attaches an `error` listener that schedules `setTimeout(() => audio.load(), 1000)` (`L290-L292`).
  - **Deterministic Trigger & Failure Mode:** On any `1920x1080` or `3840x2160` screen, the 6 `<audio>` elements fail to load `Assets/sounds/...`, firing `error` events that trigger `audio.load()` every 1000ms in an infinite network retry storm. Any resource `error` event where `event.error` is `null` crashes `setupErrorHandling()` at `L419` with `Uncaught TypeError: Cannot read properties of null (reading 'message')`.
  - **Surgical Fix Specification:** Use optional chaining `event.error?.message?.includes('Audio')` and `String(event.reason ?? '').includes(...)` in `js/android-benq-init.js:L419, L431`; require `/BenQ/i.test(navigator.userAgent)` in `detectBenQBoard()`; cap audio reload retries in `fixBenQAudio()` to 1 attempt; and fix `index.html:L258-L288` `<source>` URLs from `Assets/sounds/...` to `/sounds/...`.

- **[P1-4] Broken Image Cache Poisoning (`cachedImage.complete` True on 404 Error) Suppresses Word Text Fallback** — `js/performance-utils.js:L278-L335`, `js/main.js:L1308-L1354`
  - **Root Cause Mechanism:** `PerformanceUtils.preloadLetterImages()` (`js/performance-utils.js:L281, L323-L324`) constructs `img.src = 'Assets/images/${letter}-${letterLower}/Images/${word}.png'` (which 404s because public assets live under `/images/` and most are `.placeholder` files) and immediately stores `img` in `this.resourceCache` at `L324` before `onload` fires. Per the HTML specification, once an `HTMLImageElement` fails with `onerror`, its `img.complete` property becomes `true` while `img.naturalWidth` remains `0`. When `displayWordImage()` (`js/main.js:L1317`) checks `if (cachedImage && cachedImage.complete)` without verifying `cachedImage.naturalWidth > 0`, it assumes the broken image succeeded, sets `wordBackground.style.backgroundImage = url('Assets/images/...')`, and returns early at `L1322`.
  - **Deterministic Trigger & Failure Mode:** On every letter level after `preloadLetterImages()` completes, `displayWordImage()` hits the poisoned cache entry at `js/main.js:L1317`, displaying an empty/broken background image and completely bypassing the `img.onerror` educational text fallback (`"${letter} is for ${word}"` at `L1336-L1351`).
  - **Surgical Fix Specification:** Only insert `img` into `this.resourceCache` inside `img.onload` (`js/performance-utils.js:L313-L316`), and update `js/main.js:L1317` to check `if (cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0)`.

- **[P2-5] Service Worker `event.respondWith(undefined)` Offline Fault & Harness Infinite Polling Loops** — `public/sw.js:L67-L89`, `harness/mcp-audio.js:L155-L180`, `harness/mcp-audio.js:L247-L267`
  - **Root Cause Mechanism:** In `public/sw.js:L85-L87`, the `.catch(() => {})` handler on `fetch(event.request)` returns `undefined` when offline and a non-navigation request misses the cache, causing `event.respondWith()` to reject with a Service Worker `TypeError`. In `harness/mcp-audio.js`, `testBufferHandling()` (`L156`) and `testPlaybackLatency()` (`L248`) run `setInterval` loops waiting for `this.audioContext.currentTime` to advance or analyser amplitude `sum > 5` without a timeout or `audioContext.state === 'running'` check.
  - **Deterministic Trigger & Failure Mode:** Any uncached asset fetch while offline throws a Service Worker `Response` conversion error; running `MCPAudioDiagnostic.runDiagnostic()` before user gesture leaves `AudioContext` in `'suspended'` state (`currentTime === 0`, `sum === 0`), hanging the diagnostic Promise forever at 1,000Hz polling.
  - **Surgical Fix Specification:** Return `new Response('', { status: 503, statusText: 'Offline' })` in `public/sw.js:L86`, and add a `2000ms` timeout and `this.audioContext.state !== 'running'` guard to `harness/mcp-audio.js:L155, L247`.

---

### Lens 8: Type Systems, Schema & Contract Engineer (Boundary Integrity)

- **[P1-7b] Android Singleton Lifecycle Contract Violation (`WelcomeActivity.onDestroy()` Destroys Shared `GameState` Subsystems)** — `app/src/main/java/com/phonicsfun/core/GameState.java:L48-L75`, `app/src/main/java/com/phonicsfun/activities/WelcomeActivity.java:L297-L304`, `app/src/main/java/com/phonicsfun/activities/LevelSelectActivity.java:L33, L112`, `app/src/main/java/com/phonicsfun/activities/GameplayActivity.java:L55, L198`
  - **Root Cause Mechanism:** `WelcomeActivity.onCreate()` creates `new GameState(this)` (`L54`), which sets the static singleton `GameState.instance = this` (`GameState.java:L70`) while storing the `WelcomeActivity` reference in `this.context` (`L51`). `LevelSelectActivity` (`L33`) and `GameplayActivity` (`L55`) retrieve `GameState.getInstance()` without null-safety. However, `WelcomeActivity.onDestroy()` (`L300-L303`) calls `gameState.getEventManager().cleanup()` and `gameState.getAudioManager().cleanup()`, nulling out `soundPool` and `backgroundMusicPlayer` on the global singleton.
  - **Deterministic Trigger & Failure Mode:**
    1. If Android reclaims `WelcomeActivity` in the background while the user is in `LevelSelectActivity` or `GameplayActivity` (or under "Don't keep activities"), `WelcomeActivity.onDestroy()` tears down the singleton `GameState`'s `AudioManager` and `EventManager`.
    2. If Android kills and recreates the app process directly on `GameplayActivity` or `LevelSelectActivity`, `GameState.getInstance()` returns `null`, crashing `LevelSelectActivity.updateProgressDisplay()` (`L112`) and `GameplayActivity.nextWord()` (`L198`) with `NullPointerException`.
  - **Surgical Fix Specification:** Make `GameState.getInstance(Context context)` lazily initialize the singleton using `context.getApplicationContext()`, and remove `gameState.getAudioManager().cleanup()` from `WelcomeActivity.onDestroy()`.

---

### Lens 9: Platform, Viewport & Portability Engineer (Cross-Device Parity)

- **[P0-2] Touch Input Blackout: `e.preventDefault()` on `touchstart`/`touchend` Cancels Planet `click` Events Across All Touch Viewports** — `js/main.js:L373-L412`, `js/main.js:L966-L972`, `js/main.js:L1018-L1024`, `js/android-benq-init.js:L109-L158`, `js/android-benq-init.js:L357-L366`
  - **Root Cause Mechanism:** `GameState.setupTouchEventHandlers()` (`js/main.js:L375-L412`) attaches ` { passive: false }` document-level listeners for `touchstart`, `touchmove`, and `touchend` that call `e.preventDefault()` whenever `e.target.closest('.game-area') || e.target.closest('.planet')` is truthy. Per the W3C Touch Events specification, calling `e.preventDefault()` on `touchstart` or `touchend` cancels the browser's synthesized `click` event. Meanwhile, target and distractor planets created in `renderGameplayPlanets()` (`js/main.js:L966, L1018`) **only** attach `'click'` event listeners. The workaround in `AndroidBenQInitializer.fixTouchDelay()` (`js/android-benq-init.js:L111`) only runs once at page load on Android (when zero `.planet` elements exist in the DOM) and never runs for dynamically spawned planets or on iOS/iPadOS devices.
  - **Deterministic Trigger & Failure Mode:** On any touch screen (Android phone/tablet, iPad, iPhone, or BenQ interactive display), tapping a planet during gameplay triggers `touchstart` $\rightarrow$ `e.preventDefault()` and `touchend` $\rightarrow$ `e.preventDefault()`, suppressing the `click` event. Because planets have no `pointerup`/`touchend` handler, tapping planets produces zero response.
  - **Surgical Fix Specification:** Remove the `touchstart` and `touchend` `e.preventDefault()` listeners in `js/main.js:L375-L386, L401-L412` and `js/android-benq-init.js:L357-L366` (CSS `touch-action: none; user-select: none;` already prevents scrolling/zooming without suppressing `click` events), or bind `pointerdown`/`click` cleanly without cancelling default tap synthesis.

- **[P2-2] Conflicting `visibilitychange` Listeners, Missing `AudioContext.suspend()`, & Broken Male TTS Voice Selection** — `js/main.js:L344-L350`, `js/main.js:L1811-L1823`, `js/audio-manager.js:L581-L612`, `js/audio-manager.js:L774-L813`
  - **Root Cause Mechanism:**
    1. `js/main.js` registers two competing `document.addEventListener('visibilitychange')` callbacks: `L344-L350` calls `this.audioManager.pauseAll()` / `resumeAll()`, whereas `L1811-L1823` calls `window.game.audioManager.stopAll()` / `play('background-music')`. Meanwhile, `AudioManager.pauseAll()` (`js/audio-manager.js:L774-L795`) only pauses HTML5 `<audio>` elements and never calls `this.audioContext.suspend()` or `window.speechSynthesis.cancel()`.
    2. `AudioManager.selectSpeechVoice(voices)` (`js/audio-manager.js:L581-L612`) only checks `if (this.currentVoiceTemplate === 'british-female')` (`L587`); all three other templates (`'american-male'`, `'american-female'`, `'british-male'`) fall through to `L602-L611`, which hardcodes `lower(v.lang).startsWith('en-us')` and `/female|woman|girl|zira|jenny|aria|sarah|sara/i.test(v.name)`.
  - **Deterministic Trigger & Failure Mode:** Selecting "British Male" or "American Male" in Settings always speaks with an American Female TTS voice; backgrounding the app during WebAudio playback or TTS speech fails to suspend the WebAudio graph.
  - **Surgical Fix Specification:** Consolidate `visibilitychange` handling into a single listener that calls `this.audioContext?.suspend()` / `resume()` and `window.speechSynthesis?.cancel()`, and add explicit `'british-male'` and `'american-male'` branches in `selectSpeechVoice()`.

- **[P2-3] `DisplayManager` Constructor Init-Order Bug & Stale `display-*` Body Class Accumulation** — `js/display-manager.js:L31, L49, L167-L171, L359-L380, L415-L449`
  - **Root Cause Mechanism:** `DisplayManager.constructor()` calls `this.init()` $\rightarrow$ `this.optimizeForPerformance()` (`L49`), which checks `if (window.game && window.game.particleSystem && window.game.particleSystem.maxParticles)` (`L368-L372`). Because `new DisplayManager()` is called *inside* `new GameState()` (`js/main.js:L121`) before `window.game` is assigned (`L1807`) and before `particleSystem` is created (`L917`), this check always evaluates to `false`. Additionally, `handleViewportChange()` (`L435`) calls `applyDisplayOptimizations()` (`L168-L171`), adding new `display-${this.displayCategory}` and `orientation-${this.orientation}` classes without removing previous `display-*` classes.
  - **Deterministic Trigger & Failure Mode:** Low-end devices (`performanceProfile === 'low'`) never receive the `maxParticles = 20` cap; resizing a browser window across breakpoints accumulates `display-extra-small`, `display-medium`, and `display-ultra-large` simultaneously on `document.body`.
  - **Surgical Fix Specification:** Read `this.displayManager.performanceProfile === 'low'` when instantiating `ParticleSystem` in `js/main.js:L917`, and strip existing `display-*` and `orientation-*` classes in `applyDisplayOptimizations()` before adding updated ones.

---

### Lens 10: Cognitive Load & AI-Context Maintainability Engineer (DX)

- **[P3-3] Committed Istanbul Coverage Artifacts (`coverage/`) Polluting Static Analysis & Context Windows** — `coverage/prettify.js:L1-L2`, `coverage/sorter.js:L1-L171`, `coverage/block-navigation.js:L1-L66`
  - **Root Cause Mechanism:** Generated Vitest/Istanbul HTML and minified JS coverage reports (`coverage/`) are tracked in git (`git ls-files coverage/` returns 19 files), adding minified `CC=300` files (`coverage/prettify.js`) to the repository tree.
  - **Deterministic Trigger & Failure Mode:** Code search, grep, and static telemetry scanners ingest generated coverage HTML/JS alongside source modules, wasting LLM context tokens and skewing repository complexity metrics.
  - **Surgical Fix Specification:** Add `coverage/` to `.gitignore` and remove tracked coverage artifacts via `git rm -r --cached coverage/`.

---

## 3. Existing Test Suite Comparison & Mutation Truth Table

- **Test-to-Code File Ratio:** `13 / 29` (`0.45`)
- **Estimated Mutation Kill Score ($M_{\text{kill}}$):** **`41%`** (`13 / 32` mental mutants killed across core module groups)

| Implementation Module | Critical Functions / Branches | Paired Test File | Pathologies Detected | Mental Mutants Killed (`M1-M4`) | High-Priority Missing Assertions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `js/main.js` | `handleCorrectCollision()`, `startGameplaySession()`, `completeLevelSuccessfully()`, `exportTeacherData()`, `setupTouchEventHandlers()` | `game-state.test.mjs`, `progression.test.mjs`, `game.test.mjs` | **Skipped Test (`it.skip` at `L176`)**, **Happy-Path Tunnel Vision** | `1 / 4 (25%)` (`M1` killed on `advanceToNextLetter`; `M2, M3, M4` survived) | Zero tests call `handleCorrectCollision()`, `handlePlanetInteraction()`, `initializeLetterLevel()`, or multi-level `startGameplaySession()` |
| `js/audio-manager.js` | `play()`, `loadSound()`, `ensureLetterAudio()`, `setVolume()`, `selectSpeechVoice()` | `audio-manager.test.mjs`, `progression.test.mjs` | **No-Throw Theater (`expect(true).toBe(true)` at `L264, L271`)**, **Weak Assertions (`L226`)** | `2 / 4 (50%)` (`M1, M2` killed; `M3, M4` survived) | Async `play()` after `ensureSoundLoaded()` resolves; `fetch`/`decodeAudioData` failure fallback; male voice selection in `selectSpeechVoice()` |
| `js/collision-manager.js` | `checkCollision()`, `update()`, `registerCollisionPair()`, `registerTypeCollision()` | `collision-manager.test.mjs` | **Happy-Path Tunnel Vision** (no exact `distance === minDistance` boundary check) | `3 / 4 (75%)` (`M2, M3, M4` killed; `M1` survived) | Exact tangent boundary `distance === r1 + r2`; multi-planet trajectory interception |
| `js/event-manager.js` | `subscribe()`, `emit()`, `queueEvent()`, `unsubscribe()` | `event-manager.test.mjs` | None (cleanest test file in repo) | `4 / 4 (100%)` (`M1, M2, M3, M4` killed) | Re-entrant `subscribe`/`unsubscribe` during `emit()` iteration |
| `js/performance-utils.js` + `js/utils.js` | `preloadLetterImages()`, `observeImage()`, `loadImage()`, `debounce()`, `throttle()` | `performance-utils.test.mjs`, `preload.test.mjs`, `debounce.test.mjs` | **Mock-Mirror / Tautology (`expect(new Image().src).toBe('')` at `L113`)**, **Skipped Tests (`it.skip` at `L85, L222, L287`)** | `2 / 4 (50%)` (`M1, M2` killed; `M3, M4` survived) | Failed image (`onerror`) cache poisoning (`img.complete === true && img.naturalWidth === 0`); `destroy()` observer disconnect |
| `js/particles.js`, `js/ui-utils.js`, `js/display-manager.js`, `js/android-benq-init.js`, `public/sw.js` | `updateParticle()`, `transitionScreens()`, `detectBenQBoard()`, `setupErrorHandling()` | `NONE` | **100% Untested Modules** | `0 / 4 (0%)` | Particle `deltaTime` clamping, velocity units, timer cleanup on `destroy()`, null `event.error` handling, SW offline response |
| `app/.../core/AudioManager.java` | `loadDefaultSounds()`, `playVoice()`, `normalizeTemplateId()` | `AudioManagerTest.java`, `AudioManagerNormalizeTest.java` | **Mock-Mirror Tautology** (`AudioManagerNormalizeTest.java:L47` tests a private copy of `normalize()` inside the test class!) | `1 / 4 (25%)` (`M2` killed on `normalizeTemplateId`; `M1, M3, M4` survived) | Missing raw resource ID `0` (`Resources$NotFoundException`), `MediaPlayer` state transitions |
| `app/.../core/GameState.java`, `CollisionManager.java`, `SymbolRenderer.java`, + 5 Activities | `startGame()`, `registerHit()`, `intersects()`, `getSupportedSymbols()`, `renderSymbol()` | `GameStateTest.java` | **No-Throw Theater (`assertTrue(true)` at `GameStateTest.java:L17`)** | `0 / 4 (0%)` | `RectF.intersect` non-mutation, `A`/`B` level completion (`totalHits` vs word count), `getSupportedSymbols()` char array, null `Canvas` guard |

### Why Existing Tests Missed Discovered P0/P1 Defects

- **`[P0-1]` (`js/main.js` undefined method calls `updateProgress`, `playVoiceMessage`, `showWordImage`, `completeLevel`):** `harness/tests/game-state.test.mjs:L176` marked its only test with `it.skip('should instantiate without throwing')`, and `harness/tests/progression.test.mjs` only called `gs.completeLevelSuccessfully()` directly (`L254`) and set `gs.correctHitsCount = 1` manually (`L322`), never invoking `handleCorrectCollision()`, `handleAsteroidPlanetCollision()`, or emitting `'level:complete'`.
- **`[P0-2]` (`js/main.js` touch `e.preventDefault()` blocking planet `click` events):** No test dispatches `touchstart` / `touchend` events on `.planet` elements or verifies that a touch sequence triggers `handlePlanetInteraction()`.
- **`[P0-3]` (`js/main.js` stale `arePlanetsRendered` blocking Level 2+ planets):** `progression.test.mjs:L307-L327` calls `gs.startGameplaySession()` only to assert counter resets (`expect(gs.correctHitsCount).toBe(0)`) without asserting that `.planets-container` contains target planets matching `gs.activeLetterLevel` on a second level session.
- **`[P0-4]` (`AudioManager.java` startup `Resources$NotFoundException` & `SymbolGameActivity.java` `NullPointerException`):** `AudioManagerTest.java:L42` invokes the static method `normalizeTemplateId(null)` via reflection (`method.invoke(null, templateId)`) specifically to avoid calling `new AudioManager(context)`, and `GameStateTest.java:L17` is a stub containing only `assertTrue(true)`.
- **`[P1-1]` (`js/main.js` leaked `50ms` `trailInterval` & cross-screen asteroid interception):** No test invokes `processCorrectPlanetHit()` or `spawnAsteroid()`.
- **`[P1-2]` (`js/audio-manager.js` `play()` dropping playback after async `ensureSoundLoaded()`):** `audio-manager.test.mjs:L267-L272` calls `audioManager.play('test-sound')` and asserts `expect(true).toBe(true)` without awaiting `ensureSoundLoaded` or asserting `createBufferSource().start` was called.
- **`[P1-4]` (`js/performance-utils.js` broken `Image` caching poisoning `displayWordImage`):** `performance-utils.test.mjs:L252-L266` advances fake timers by `5000ms` to trigger the fallback timeout without firing `img.onerror` or checking whether `getCachedImage()` returns a broken `HTMLImageElement` with `complete === true` and `naturalWidth === 0`.
- **`[P1-5]` (`js/main.js` teacher progress export double-counting):** `progression.test.mjs:L317-L327` manually assigns `gs.cumCorrect = 3; gs.correctHitsCount = 1;` instead of calling `gs.handleCorrectCollision()`, masking the fact that `handleCorrectCollision()` increments **both** counters on every hit.

### Minimal Viable Test Harness (MVTH) Specifications

1. **Tier 1 — Core Gameplay & Collision Integration (`harness/tests/gameplay-loop.test.mjs`):**
   - Table-driven test exercising `handleCorrectCollision()` and `handleIncorrectCollision()` across hits `1..5` for letters `['A', 'B', 'G', 'Z']`, asserting:
     - Zero `TypeError` exceptions on collision and after `500ms` and `2000ms` fake-timer advances.
     - `#progress-fill` width advances `20% -> 40% -> 60% -> 80% -> 100%` and `#hits-counter` text equals `correctHitsCount`.
     - `exportTeacherData().correctHits` equals exact hit count `N` (not `2N`), and `loadSavedStats()` restores `cumCorrect`, `cumIncorrect`, and `cumTotal`.
     - `asteroidElement.parentNode` is `null` and `vi.getTimerCount()` returns `0` after collision cleanup.
2. **Tier 2 — Multi-Level State Machine & Touch Lifecycle (`harness/tests/level-lifecycle.test.mjs`):**
   - Multi-step transition test: `initializeLetterLevel('A') -> completeLevelSuccessfully() -> navigateToScreen('level-select') -> initializeLetterLevel('B')`, asserting `.planets-container` contains 5 `[data-letter="B"]` target planets and 0 `[data-letter="A"]` target planets, and `particleSystem` has a single `.particle-container` in `.game-area`.
3. **Tier 3 — Async Audio & Android Core Invariants (`harness/tests/audio-manager.test.mjs` & `app/src/test/.../CoreInvariantsTest.java`):**
   - Vitest test calling `audioManager.play('explosion')` on an unloaded sound, awaiting microtasks, and asserting `createBufferSource().start` is called once `fetch` + `decodeAudioData` resolve.
   - JUnit test verifying `CollisionObject.intersects()` does not mutate `obj1.bounds`, `SymbolRenderer.getSupportedSymbols()` returns exact configured symbol keys (`['G', 'A', 'B', '#', '$']`), and `GameState.startGame("A")` sets `totalHits == getWordMessagesForLetter("A").size()`.

---

## 4. Surgical Refactoring Blueprints (Zero-Mutation Drafts)

### Refactor R1: Fix Method-Rename Crashes, Asteroid Interception, Leaked `trailInterval`, and Double-Counting (`[P0-1]`, `[P1-1]`, `[P1-5]`)

- **Target Scope:** `js/main.js:L503-L630`, `js/main.js:L1074-L1193`, `js/main.js:L1672-L1753`
- **Engineering ROI:** Eliminates 4 guaranteed `TypeError` gameplay crashes (`[P0-1]`), eliminates permanent 20Hz (`100 particles/sec`) `setInterval` & DOM node leaks per planet click (`[P1-1]`), prevents wrong-planet asteroid interception, and fixes 2x teacher score inflation (`[P1-5]`).

**Current Pattern (Audited Code in `js/main.js`):**
```javascript
// js/main.js:L503-L505
this.eventManager.subscribe('level:complete', () => {
    this.completeLevel(); // P0-1: undefined method (renamed to completeLevelSuccessfully)
});

// js/main.js:L581-L606 (inside handleCorrectCollision)
setTimeout(() => {
    this.playVoiceMessage(); // P0-1: undefined method (renamed to playVocabularyAudio)
    this.showWordImage();    // P0-1: undefined method (renamed to displayWordImage)
}, 500);

this.correctHits++;
this.totalAnswersCount++;
this.cumCorrect++;
this.cumTotal++;
this.updateAdaptiveDifficulty();
this.saveStatsToLocalStorage();
this.updateProgress(); // P0-1: undefined method (renamed to updateProgressDisplay)
```

**Target Pattern (Surgical Blueprint for `js/main.js`):**
```javascript
// 1. In setupEventSubscriptions (js/main.js:L503-L505):
this.eventManager.subscribe('level:complete', () => {
    this.completeLevelSuccessfully();
});

// 2. In handleCorrectCollision (js/main.js:L569-L607):
const asteroidObj = this.collisionManager.getObject(asteroidId);
if (asteroidObj?.element) {
    if (asteroidObj.element.trailInterval) {
        clearInterval(asteroidObj.element.trailInterval);
    }
    asteroidObj.element.remove();
}
this.collisionManager.unregisterObject(asteroidId);
this.collisionManager.unregisterObject(planetId);
planet.remove();

if (this.particleSystem) {
    this.particleSystem.planetDestroyed(x, y);
}

setTimeout(() => {
    if (!this.isGameplayActive && this.currentScreen !== 'gameplay') return;
    this.playVocabularyAudio();
    this.displayWordImage();
}, 500);

this.correctHits++;
this.totalAnswersCount++;
this.cumCorrect++;
this.cumTotal++;
this.updateAdaptiveDifficulty();
this.saveStatsToLocalStorage();
this.updateProgressDisplay();

this.announceToScreenReader(
    `Correct! You matched the letter ${this.activeLetterLevel}.`
);

if (this.correctHits >= this.totalHits) {
    setTimeout(() => {
        if (this.currentScreen === 'gameplay') {
            this.eventManager.emit('level:complete');
        }
    }, 2000);
}

// 3. In handleIncorrectCollision (js/main.js:L609-L615):
const dullAsteroidObj = this.collisionManager.getObject(asteroidId);
if (dullAsteroidObj?.element) {
    if (dullAsteroidObj.element.trailInterval) {
        clearInterval(dullAsteroidObj.element.trailInterval);
    }
    dullAsteroidObj.element.remove();
}
this.collisionManager.unregisterObject(asteroidId);

// 4. In loadSavedStats & exportTeacherData (js/main.js:L1676-L1682, L1741-L1749):
// Inside loadSavedStats():
this.completedLevels = parsed.completedLevels || [];
this.correctHitsCount = parsed.correctHitsCount || 0;
this.incorrectHitsCount = parsed.incorrectHitsCount || 0;
this.totalAnswersCount = parsed.totalAnswersCount || 0;
this.cumCorrect = parsed.cumCorrect ?? this.correctHitsCount;
this.cumIncorrect = parsed.cumIncorrect ?? this.incorrectHitsCount;
this.cumTotal = parsed.cumTotal ?? this.totalAnswersCount;

// Inside exportTeacherData():
const totalExportCorrect = this.cumCorrect;
const totalExportIncorrect = this.cumIncorrect;
const totalExportAnswers = this.cumTotal;
const stats = {
    sessionId: this.sessionId || Math.random().toString(36).substring(2, 9),
    exportTimestamp: new Date().toISOString(),
    correctHits: totalExportCorrect,
    incorrectHits: totalExportIncorrect,
    accuracy:
        totalExportAnswers > 0
            ? (totalExportCorrect / totalExportAnswers).toFixed(2)
            : '1.00',
    completedLevels: Array.from(new Set(this.completedLevels || [])),
    difficultySpeedMultiplier: this.difficultySpeedMultiplier,
    difficultyPlanetCount: this.difficultyPlanetCount,
};
```

---

### Refactor R2: Restore Multi-Level Planet Rendering & Touch Click Compatibility (`[P0-2]`, `[P0-3]`)

- **Target Scope:** `js/main.js:L373-L421`, `js/main.js:L907-L926`
- **Engineering ROI:** Unblocks touch interaction on 100% of mobile/tablet/BenQ viewports (`[P0-2]`) and fixes Level 2+ blank planet rendering (`[P0-3]`) while preventing `ParticleSystem` RAF/DOM leaks across level transitions.

**Current Pattern (Audited Code in `js/main.js`):**
```javascript
// js/main.js:L373-L412
setupTouchEventHandlers() {
    document.addEventListener(
        'touchstart',
        (e) => {
            if (e.target.closest('.game-area') || e.target.closest('.planet')) {
                e.preventDefault(); // Cancels synthetic click on .planet!
            }
        },
        { passive: false }
    );
    // ... same for touchmove and touchend ...
}

// js/main.js:L907-L926
startGameplaySession() {
    this.isGameplayActive = true;
    this.correctHitsCount = 0;
    this.incorrectHitsCount = 0;
    this.totalAnswersCount = 0;
    this.vocabularyIndex = 0;
    this.updateProgressDisplay();
    if (window.ParticleSystem) {
        this.particleSystem = new ParticleSystem();
        this.particleSystem.createStarfield();
    }
    if (!this.arePlanetsRendered) {
        this.renderGameplayPlanets();
        this.arePlanetsRendered = true;
    }
}
```

**Target Pattern (Surgical Blueprint for `js/main.js`):**
```javascript
setupTouchEventHandlers() {
    // Only preventDefault on touchmove to stop rubber-band scrolling
    // without suppressing synthetic click events on .planet elements.
    document.addEventListener(
        'touchmove',
        (e) => {
            if (e.target.closest('.game-area') || e.target.closest('.planet')) {
                e.preventDefault();
            }
        },
        { passive: false }
    );

    document.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.game-area') || e.target.closest('.planet')) {
            e.preventDefault();
        }
    });
}

startGameplaySession() {
    console.log('🎯 Initializing gameplay session...');
    // Clean up any leftover state, particles, or planets from prior levels
    this.resetGameplayState();

    this.isGameplayActive = true;
    this.correctHitsCount = 0;
    this.incorrectHitsCount = 0;
    this.totalAnswersCount = 0;
    this.vocabularyIndex = 0;
    this.updateProgressDisplay();

    if (window.ParticleSystem) {
        this.particleSystem = new ParticleSystem();
        if (this.displayManager?.performanceProfile === 'low') {
            this.particleSystem.maxParticles = 20;
        }
        this.particleSystem.createStarfield();
    }

    this.renderGameplayPlanets();
    this.arePlanetsRendered = true;
}
```

---

### Refactor R3: Fix Async `AudioManager.play()` Drop & Duplicate Singleton (`[P1-2]`, `[P1-3]`)

- **Target Scope:** `js/audio-manager.js:L296-L315`, `js/audio-manager.js:L1001-L1007`, `js/main.js:L1257-L1270`
- **Engineering ROI:** Guarantees audio playback executes once on-demand `.wav` loading resolves (`[P1-2]`), eliminates duplicate `AudioContext` hardware instantiation (`[P1-3]`), and stops `speechSynthesis` from talking over prerecorded voice `.wav` assets.

**Current Pattern (Audited Code in `js/audio-manager.js`):**
```javascript
// js/audio-manager.js:L296-L315
if (!this.hasLoadedSound(id)) {
    this.ensureSoundLoaded(id).finally(() => {
        if (
            !this.hasLoadedSound(id) &&
            id.startsWith('voice-') &&
            this.canUseSpeechSynthesis
        ) {
            this.speak(this.getVoiceFallbackText(id), {
                pitch: 1.15,
                rate: 0.88,
            });
        } else if (
            !this.hasLoadedSound(id) &&
            id.startsWith('phoneme-')
        ) {
            this.generatePhonemeSound(id.replace('phoneme-', ''));
        }
    });
    return;
}
```

**Target Pattern (Surgical Blueprint for `js/audio-manager.js`):**
```javascript
if (!this.hasLoadedSound(id)) {
    this.ensureSoundLoaded(id).finally(() => {
        if (this.hasLoadedSound(id)) {
            this.play(id);
        } else if (
            id.startsWith('voice-') &&
            this.canUseSpeechSynthesis
        ) {
            this.speak(this.getVoiceFallbackText(id), {
                pitch: 1.15,
                rate: 0.88,
            });
        } else if (id.startsWith('phoneme-')) {
            this.generatePhonemeSound(id.replace('phoneme-', ''));
        }
    });
    return;
}
```

---

### Refactor R4: Guard Missing Android Raw Resources & Non-Mutating `RectF.intersects` (`[P0-4]`, `[P1-7]`)

- **Target Scope:** `app/src/main/java/com/phonicsfun/core/AudioManager.java:L65-L94`, `app/src/main/java/com/phonicsfun/core/CollisionManager.java:L69-L71`
- **Engineering ROI:** Prevents immediate `Resources$NotFoundException` crash on Android app launch when raw audio assets are absent (`[P0-4]`) and prevents `CollisionObject.intersects()` from corrupting object bounding boxes (`[P1-7]`).

**Current Pattern (Audited Code in `AudioManager.java` & `CollisionManager.java`):**
```java
// AudioManager.java:L69-L93
try {
    soundMap.put("celebration", soundPool.load(context, getResId("celebration", "raw"), 1));
    soundMap.put("explosion", soundPool.load(context, getResId("explosion", "raw"), 1));
    soundMap.put("phoneme_g", soundPool.load(context, getResId("phoneme_g", "raw"), 1));
} catch (IllegalStateException | IllegalArgumentException e) {
    Log.e(TAG, "Error loading default sounds: " + e.getMessage());
}
// ...
try {
    backgroundMusicPlayer = MediaPlayer.create(context, getResId("background_music", "raw"));
    // ...
} catch (IllegalStateException | IllegalArgumentException | SecurityException e) {
    Log.e(TAG, "Error initializing background music: " + e.getMessage());
}

// CollisionManager.java:L69-L71
public boolean intersects(CollisionObject other) {
    return bounds.intersect(other.bounds); // Mutates this.bounds!
}
```

**Target Pattern (Surgical Blueprint for `AudioManager.java` & `CollisionManager.java`):**
```java
// AudioManager.java:L65-L94
private void loadDefaultSoundIfPresent(String key, String rawName) {
    int resId = getResId(rawName, "raw");
    if (resId != 0 && soundPool != null) {
        soundMap.put(key, soundPool.load(context, resId, 1));
    } else {
        Log.w(TAG, "Optional raw sound resource not bundled: " + rawName);
    }
}

private void loadDefaultSounds() {
    try {
        loadDefaultSoundIfPresent("celebration", "celebration");
        loadDefaultSoundIfPresent("explosion", "explosion");
        loadDefaultSoundIfPresent("phoneme_g", "phoneme_g");
    } catch (RuntimeException e) {
        Log.e(TAG, "Error loading default sounds: " + e.getMessage());
    }
    initializeBackgroundMusic();
}

private void initializeBackgroundMusic() {
    try {
        int resId = getResId("background_music", "raw");
        if (resId != 0) {
            backgroundMusicPlayer = MediaPlayer.create(context, resId);
            if (backgroundMusicPlayer != null) {
                backgroundMusicPlayer.setLooping(true);
                backgroundMusicPlayer.setVolume(musicVolume, musicVolume);
            }
        }
    } catch (RuntimeException e) {
        Log.e(TAG, "Error initializing background music: " + e.getMessage());
    }
}

// CollisionManager.java:L69-L71
public boolean intersects(CollisionObject other) {
    return other != null && RectF.intersects(this.bounds, other.bounds);
}
```

---

## 5. Phased Execution Roadmap, Top 5 Recommendations & Scoped Agent Prompts

### Top 5 Prioritized Recommendations

1. **[Recommendation 1 — P0 Gameplay & Touch Unblocking (`js/main.js`)]: Reconcile Split-Brain Method Names, Fix Touch Click Suppression, and Reset Level State on Entry**
   - **Why:** Currently, the Web/Capacitor game cannot complete a single level (`this.updateProgress`, `this.playVoiceMessage`, `this.showWordImage`, and `this.completeLevel` throw `TypeError`), cannot register planet taps on touchscreens (`e.preventDefault()` on `touchstart`/`touchend` cancels `click`), and cannot render planets on Level 2+ (`this.arePlanetsRendered` stays `true`).
   - **Action:** Apply **Refactor R1** and **Refactor R2** in `js/main.js` and add the **MVTH Tier 1 & Tier 2** integration tests in `harness/tests/`.

2. **[Recommendation 2 — P1 Physics, DOM Lifecycle & Memory Leak Containment (`js/main.js`, `js/particles.js`, `js/collision-manager.js`)]: Pair Asteroids to Target Planets, Clear `trailInterval` Timers, and Normalize Particle Physics**
   - **Why:** Every planet click leaks a `50ms` `setInterval` (`100` DOM particles/sec forever) and leaves `.asteroid` nodes in the DOM, while cross-screen random-edge asteroids collide with intervening distractor planets and penalize the player. Meanwhile, `ParticleSystem` velocities in `createExplosion` and `levelComplete` are `60x` too large (`px/s` multiplied by `deltaTime * 60`) and mutate `style.left`/`top` on 100 DOM nodes per frame.
   - **Action:** Pair spawned asteroids directly to the clicked `planetId` (or resolve collision deterministically on `transitionend`), clear `trailInterval` and remove `asteroidElement` on hit, clamp `deltaTime <= 0.05` in `ParticleSystem.animate()`, and use GPU-composited `transform: translate3d(...)`.

3. **[Recommendation 3 — P1 Audio & Asset Pipeline Hardening (`js/audio-manager.js`, `js/performance-utils.js`, `js/android-benq-init.js`, `index.html`)]: Fix Async `play()` Drop, Eliminate Duplicate Singletons, and Prevent Broken-Image Cache Poisoning**
   - **Why:** `AudioManager.play(id)` silently drops playback whenever `ensureSoundLoaded(id)` succeeds asynchronously; `AudioManager` and `AndroidBenQInitializer` each instantiate twice on startup; `detectBenQBoard()` misclassifies all 1080p/4K monitors and triggers a 1Hz `<audio>` error retry loop against broken `Assets/sounds/...` paths; and `preloadLetterImages()` caches 404 `HTMLImageElement` objects (`img.complete === true`, `naturalWidth === 0`), suppressing the word text fallback in `displayWordImage()`.
   - **Action:** Invoke `this.play(id)` inside `ensureSoundLoaded(id).finally()` when `this.hasLoadedSound(id)` is `true`, cache images in `PerformanceUtils.resourceCache` only inside `img.onload`, check `cachedImage.naturalWidth > 0` in `displayWordImage()`, and remove duplicate module-level instantiations.

4. **[Recommendation 4 — P0/P1 Android Native Java Stabilization (`app/src/main/java/com/phonicsfun/`)]: Guard Missing Raw Resources, Fix `RectF.intersect()` Mutation, and Synchronize A–Z Vocabulary**
   - **Why:** The Android Java app crashes immediately on launch with `Resources$NotFoundException` (`resId == 0` in `AudioManager.java`), crashes in `SymbolGameActivity.onCreate()` with `NullPointerException`, mutates collision bounds in-place via `bounds.intersect()`, and makes Letters A and B unwinnable (`2` words configured vs `totalHits = 5`).
   - **Action:** Apply **Refactor R4**, guard `resId != 0` before calling `soundPool.load()` / `MediaPlayer.create()`, replace `bounds.intersect()` with `RectF.intersects()`, and dynamically set `totalHits = letterWords.size()` in `GameState.java`.

5. **[Recommendation 5 — P2 Test Suite De-Vibing & Repository Hygiene (`harness/tests/`, `app/src/test/`, `coverage/`)]: Replace Tautological/Skipped Tests with Behavioral Assertions and Untrack `coverage/`**
   - **Why:** A `41%` mutation kill rate (`M_kill`) allowed four `TypeError` crashes in `js/main.js` and a startup crash in `AudioManager.java` to ship with "green" tests because `game-state.test.mjs` used `it.skip`, `AudioManagerNormalizeTest.java` tested a local copy-pasted helper instead of `AudioManager`, and `GameStateTest.java` asserted `assertTrue(true)`.
   - **Action:** Unskip and wire `game-state.test.mjs`, replace tautological assertions in `audio-manager.test.mjs`, `performance-utils.test.mjs`, `AudioManagerNormalizeTest.java`, and `GameStateTest.java` with the **MVTH** suite, and remove committed `coverage/` artifacts from git tracking.

---

### Phased Execution Roadmap

1. **Phase 1 — Containment & Safety Lock (`P0` Fixes + MVTH Baseline Tests):**
   - Fix `js/main.js` method-rename crashes (`[P0-1]`), touch `e.preventDefault()` click suppression (`[P0-2]`), and `arePlanetsRendered` multi-level lock (`[P0-3]`).
   - Fix `AudioManager.java` `resId != 0` guard and `SymbolGameActivity.java` null `Canvas` crash (`[P0-4]`).
   - Add MVTH Tier 1 & Tier 2 regression tests in `harness/tests/`.
2. **Phase 2 — Frame-Budget, Concurrency & State Hardening (`P1` Fixes):**
   - Fix `trailInterval` & asteroid DOM leak + wrong-planet asteroid interception (`[P1-1]`).
   - Fix `AudioManager.play()` async load completion playback (`[P1-2]`) and remove duplicate `AudioManager`/`AndroidBenQInitializer` singletons + 1Hz audio retry storm (`[P1-3]`).
   - Fix `PerformanceUtils` broken image cache poisoning (`[P1-4]`), teacher export double-counting (`[P1-5]`), `ParticleSystem` velocity/layout thrashing (`[P1-6]`), and Java `RectF.intersects` / `GameState.java` word counts (`[P1-7]`).
3. **Phase 3 — Structural De-Vibing & Modular Extraction (`P2/P3` Refactors):**
   - Fix `UIUtils` `innerHTML` sinks & transition timer races (`[P2-4]`), `DisplayManager` body class cleanup (`[P2-3]`), `public/sw.js` offline fallback (`[P2-5]`), `SymbolRenderer.getSupportedSymbols()` (`[P3-2]`), and untrack `coverage/` (`[P3-3]`).

---

### Copy-Paste Surgical Prompts for Coding Agents

> **Prompt [P0-1 / P0-2 / P0-3 / P1-1 / P1-5] (`js/main.js`):**
> "Strictly scope edits to `js/main.js` and `harness/tests/progression.test.mjs`. Do not modify any other files.
> 1. In `setupEventSubscriptions()` (line 504), change `this.completeLevel()` to `this.completeLevelSuccessfully()`.
> 2. In `handleCorrectCollision()` (lines 582–595), change `this.playVoiceMessage()` to `this.playVocabularyAudio()`, `this.showWordImage()` to `this.displayWordImage()`, and `this.updateProgress()` to `this.updateProgressDisplay()`.
> 3. In `processCorrectPlanetHit()` (line 1082), attach `asteroidElement.trailInterval = trailInterval;`, and in both `handleCorrectCollision()` and `handleIncorrectCollision()`, clear `asteroidElement.trailInterval` and call `asteroidElement.remove()` before unregistering `asteroidId`.
> 4. In `setupTouchEventHandlers()` (lines 373–413), remove the `touchstart` and `touchend` `e.preventDefault()` listeners so browser synthetic `click` events fire on `.planet` elements on touch devices (keep `touchmove` `e.preventDefault()`).
> 5. In `startGameplaySession()` (line 907), call `this.resetGameplayState()` at the start of the method before setting `this.isGameplayActive = true` so subsequent levels always clean up the previous `ParticleSystem` and render new planets.
> 6. In `loadSavedStats()` (line 1672), restore `cumCorrect`, `cumIncorrect`, and `cumTotal` from `parsed`, and in `exportTeacherData()` (line 1736), report `this.cumCorrect` and `this.cumIncorrect` directly when `handleCorrectCollision` increments both live and cumulative counters (or only fold live counters into `cum*` at session reset).
> Add regression tests in `harness/tests/progression.test.mjs` covering `handleCorrectCollision()`, multi-level `startGameplaySession()`, and `exportTeacherData()` after real collision calls, then run `npx vitest run` to confirm green."

> **Prompt [P1-2 / P1-3 / P2-2] (`js/audio-manager.js` & `js/android-benq-init.js`):**
> "Strictly scope edits to `js/audio-manager.js`, `js/android-benq-init.js`, and `harness/tests/audio-manager.test.mjs`. Do not modify any other files.
> 1. In `js/audio-manager.js` `play(id)` (lines 296–315), when `this.ensureSoundLoaded(id)` settles in `.finally()`, check `if (this.hasLoadedSound(id)) { this.play(id); }` before the fallback `else if` branches so asynchronously loaded sounds actually play.
> 2. In `js/audio-manager.js` `selectSpeechVoice(voices)` (lines 581–612), add explicit branches for `'british-male'` (`en-gb` + male voice predicates) and `'american-male'` (`en-us` + male voice predicates).
> 3. In `js/audio-manager.js` (line 1007) and `js/android-benq-init.js` (lines 477–482), guard global auto-instantiation so duplicate instances are not created alongside `GameState.constructor()`.
> 4. In `js/android-benq-init.js` `setupErrorHandling()` (lines 415–438), use optional chaining `event.error?.message?.includes('Audio')` and `String(event.reason ?? '')` to prevent null-dereference crashes on resource load errors, and require `/BenQ/i.test(navigator.userAgent)` in `detectBenQBoard()`.
> Add unit tests in `harness/tests/audio-manager.test.mjs` verifying async `play()` execution after `loadSound()` resolves and male voice selection, then run `npx vitest run`."

> **Prompt [P1-4] (`js/performance-utils.js` & `js/main.js`):**
> "Strictly scope edits to `js/performance-utils.js` (lines 278–345), `js/main.js` (lines 1308–1354), and `harness/tests/performance-utils.test.mjs`. Do not modify any other files.
> 1. In `PerformanceUtils.preloadLetterImages()`, only call `self.resourceCache.set(`${letter}-${word}`, img)` inside `img.onload` (do not cache failed images on `onerror`).
> 2. In `GameState.displayWordImage()` (`js/main.js:L1317`), change `if (cachedImage && cachedImage.complete)` to `if (cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0)` so failed images fall through to the `${letter} is for ${word}` text fallback.
> Add a test in `harness/tests/performance-utils.test.mjs` simulating `img.onerror` and asserting `getCachedImage()` returns `null`, then run `npx vitest run`."

> **Prompt [P0-4 / P1-7 / P3-2] (`app/src/main/java/com/phonicsfun/`):**
> "Strictly scope edits to `app/src/main/java/com/phonicsfun/core/AudioManager.java`, `CollisionManager.java`, `GameState.java`, `SymbolRenderer.java`, `SymbolGameActivity.java`, and `app/src/test/java/com/phonicsfun/core/GameStateTest.java`. Do not modify any other files.
> 1. In `AudioManager.java` (lines 65–94), check `if (resId != 0)` before calling `soundPool.load()` or `MediaPlayer.create()` and catch `RuntimeException` so missing raw resources do not throw uncaught `Resources$NotFoundException`.
> 2. In `CollisionManager.java` (line 70), replace `return bounds.intersect(other.bounds);` with `return other != null && RectF.intersects(this.bounds, other.bounds);`.
> 3. In `GameState.java` `createPlanetsForLetter(String letter)` (lines 119–131), set `this.totalHits = Math.max(1, letterWords.size());` so Letters A and B can be completed.
> 4. In `SymbolRenderer.java`, pre-allocate `glowPaint` in `initializePaints()` and fix `getSupportedSymbols()` (line 216) to copy `symbolConfigs.keySet()` into a `char[]` instead of calling `.toString().toCharArray()`.
> 5. In `SymbolGameActivity.java` (line 59) and `SymbolRenderer.renderSymbol()` (line 120), guard `if (canvas == null || bounds == null) return;`.
> Add JUnit 4 tests in `GameStateTest.java` verifying `CollisionObject.intersects` non-mutation and `SymbolRenderer.getSupportedSymbols()` output."

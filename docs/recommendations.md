# Phonics Fun — Project Recommendations & Implementation Log

## 1. Excitement & Game Polish Sweep (Implemented)

### Excitement & Arcade Mechanics
- **Streak & Combo Multiplier System:** Implemented dynamic consecutive hit counter (`currentStreak`, `highestStreak`). Multiplies points ($100 \times \text{streak}$) and triggers hype text badges:
  - 2x: "🔥 2x COMBO!"
  - 3x: "⚡ 3x SUPER!"
  - 4x: "🌟 4x MEGA!"
  - 5x+: "🚀 5x GALACTIC!"
- **Floating Points & Juice Popups:** `showFloatingText()` dynamically spawns rising score and feedback elements (`+200 🔥 x2`, `TRY AGAIN! 💫`) right at asteroid-planet impact coordinates with cubic-bezier pop animations.
- **Hyperspace Warp Starfield:** Reaching 3+ streaks or completing a mission triggers a high-speed hyperspace warp streak on the galaxy background.
- **Star Rating (1-3 Stars):** Accuracy-graded celebratory 3-star rating cluster in the level completion popup.

### Audio Design Polish
- **Rising Chime Synthesizer:** `AudioManager.playStreakChime()` synthesizes crystal-clear ascending major-pentatonic chimes using Web Audio API buffer sources without external audio assets.
- **Gentle Miss SFX:** `AudioManager.playIncorrectSound()` produces a soft, encouraging downward bounce tone on distractors.
- **Victory Multi-Chord Fanfare:** `AudioManager.playVictoryFanfare()` delivers triumphant multi-chord brass/synth chords upon completing a letter level.

### Visual & Aesthetic Diversity
- **Dynamic Planetary Themes:** Letters A-Z map across 6 distinct planetary visual themes (solar flare plasma, azure ocean, bioluminescent emerald, amethyst gas giant, amber rings, and glowing coral nebula), each with orbital atmospheric rings (`.target-planet::after`).

---

## 2. Prioritized Roadmap Recommendations (Escalation Sweep)

### [High Priority] 1. Security Patch Dependency Manifest & Node Engine
- **Why:** Protects local development environments and native Android exports against CVE-2026-112945/6/7 (Vite) and CVE-2026-103922 (Capacitor Critical CVSS 9.3), while resolving sub-minor Node engine mismatches.
- **What:** Bump `vite` to `^8.2.4`, `@capacitor/core` & `@capacitor/cli` to `^8.5.1`, `vitest` to `^4.1.11`, and `engines.node` to `">=22.13.0"`.
- **Endpoint / CLI:** `npm update vite @capacitor/cli @capacitor/core vitest @vitest/coverage-v8`
- **Interactive Control / UI:** `package.json` dependencies & CI automated build check
- **Estimated Effort:** 15 minutes
- **Source:** *[Tier 1: GHSA-rvm3-566m-v7fv, GHSA-9jrq-w75r-8gcw]*

### [High Priority] 2. Grace-Shielded Streak Multiplier & Soft Decay Engine
- **Why:** Prevents young learners (ages 4-7) from becoming emotionally discouraged by instant zero resets when tapping a distractor planet.
- **What:** Implement a 1-hit "Streak Shield" that absorbs the first incorrect tap, followed by soft multiplier decay (-1x instead of instant reset to 0), paired with positive re-try audio cues ("ALMOST! 💫").
- **Endpoint / CLI:** `GameState.handleIncorrectCollision()`
- **Interactive Control / UI:** `#streak-banner` (Shield icon: `🛡️ SHIELD SAVED STREAK!`)
- **Estimated Effort:** 2 hours
- **Source:** *[Tier 2: Pediatric UX Research (Ryan & Deci SDT)]*

### [Medium Priority] 3. In-Game Classroom Diagnostic & Telemetry API
- **Why:** Unlocks real-time teacher observability across classroom tablets or BenQ interactive flat panels without requiring manual JSON file downloads.
- **What:** Add a REST export/webhook endpoint supporting batch session sync, per-phoneme confusion matrix logging, and an interactive teacher dashboard widget.
- **Endpoint / CLI:** `POST /api/v1/telemetry/session` (Payload: `{ sessionId, letter, accuracy, confusionMatrix }`)
- **Interactive Control / UI:** `teacher-export --format json --range session`
- **Estimated Effort:** 1 day
- **Source:** *[references/feature-recommendation-format.md]*

### [Medium Priority] 4. Hardware-Accelerated Canvas2D Particle Engine Upgrade
- **Why:** DOM element pooling caps particle throughput at ~100 elements before triggering style recalculation drops on 4K BenQ boards.
- **What:** Upgrade `ParticleSystem` in `js/particles.js` to render bursts, starfield, and debris directly onto a single transparent `<canvas>` element using typed Float32Arrays.
- **Endpoint / CLI:** `js/particles.js` (CanvasParticleEngine)
- **Interactive Control / UI:** Performance SLA: Locked 60 FPS at 3840x2160 with 1,500 particles
- **Estimated Effort:** 1-2 days
- **Source:** *[Tier 1: Chromium Life of a Pixel]*

### [Low Priority] 5. W3C Pointer Events & Coalesced Digitizer Integration
- **Why:** Maximizes multi-student touch tracking precision on 40-point interactive whiteboards without compositor scroll lag.
- **What:** Transition `android-benq-init.js` from legacy touch events to W3C Pointer Events (`pointerdown`, `pointermove`) with `event.getCoalescedEvents()` and `{ passive: true }`.
- **Endpoint / CLI:** `js/android-benq-init.js`
- **Interactive Control / UI:** W3C Pointer Events Level 3 (`pointerId`, `setPointerCapture`)
- **Estimated Effort:** 4 hours
- **Source:** *[Tier 1: W3C Pointer Events Spec]*

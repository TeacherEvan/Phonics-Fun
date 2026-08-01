# Phonics Fun — Context Map
Date: 2026-06-07

## Primary Files

- `index.html` — shell, audio elements, screen divs
- `js/main.js` — GameState, orchestrator
- `js/audio-manager.js` — audio loading + playback
- `js/event-manager.js` — pub/sub
- `js/collision-manager.js` — collision detection loop
- `js/particles.js` — particle visual effects
- `js/display-manager.js` — responsive/device detection
- `js/ui-utils.js` — animations, toasts, transitions
- `js/performance-utils.js` — lazy loading, preload
- `js/android-benq-init.js` — Android/BenQ hardening
- `css/styles.css` — all CSS (2492 lines)

## Dependencies Between JS Modules

```
main.js
  ├─ audio-manager.js   (audio)
  ├─ event-manager.js   (game events)
  ├─ collision-manager.js (collisions)
  ├─ particles.js       (visual fx)
  ├─ display-manager.js (responsive)
  ├─ ui-utils.js        (UI helpers)
  ├─ performance-utils.js (lazy/preload)
  └─ event-bus.js       (cross-module pub/sub)
        └─ audio-manager.js (also uses EventBus for planet-hit)
```

## Shared Data Sources

- `PHONICS_FUN_LETTER_DATA` is defined in `js/main.js` and hardcoded in Java `GameState.java`, `AudioManager.java`
- Currently coupled: changing a word requires edits in both JS and Java

## Ripple Effects (shared data extraction)

- Removing `PHONICS_FUN_LETTER_DATA` from `js/main.js` breaks:
  - `buildLetterVocabulary()`
  - `audio-manager.js` `getLetterData()`
  - `performance-utils.js` `preloadLetterImages()`
- Java sides that duplicate data:
  - `GameState.java` initializeData()
  - `AudioManager.java` getWordsForLetter(), getAnimateWordsForLetter()

## Proposed Shared Module Touchpoints

After extraction, `js/main.js` and Java `GameState`/`AudioManager` both consume:
- `packages/shared/src/data/letters.ts` → `PHONICS_FUN_LETTER_DATA`
- `packages/shared/src/data/word-message.ts` → `WordMessage` struct

## Test Targets

- `Tests/` — existing manual HTML tests
- New unit tests: `Tests/game.test.js` (vitest)
- New unit tests: `app/src/test/java/.../GameStateTest.java` (JUnit)

## CI/Lint Targets

- JS: `js/**/*.js`
- Java: `app/src/main/java/**/*.java` (ktlint/JUnit via Gradle if available)

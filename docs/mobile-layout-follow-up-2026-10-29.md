# Mobile layout follow-up — 2026-10-29

## Symptom

On phones the gameplay screen was still fragile after the compact-HUD pass:
rotating or resizing during a mission could deactivate the level (`isGameplayActive`
became `false`), zero the score, and leave planets positioned for the previous
viewport. A 844×390 landscape check showed planets at `y = 556` in a 390px-tall
area.

## Root cause

`GameState.setupEventListeners()` registered a debounced `resize` handler that
called `resetGameplayState()` and `renderGameplayPlanets()`. That reset cleared
the active session and the score. It also re-rendered planets before the CSS
media query had settled, so `placePlanetInPlayArea()` measured the old
`.game-area`/`.game-ui` geometry.

The compact HUD hid its labels with `display: none`, which removed the mission
context from the accessibility tree, and the visual progress bar exposed no
ARIA value to assistive technology.

## Fix

- Replace the resize reset with `schedulePlanetLayout()`, an idempotent
  zero-delay layout pass that repositions the existing planets and never
  touches score/active state.
- Reposition from `handleDisplayChange()` and `handleDeviceOrientationChange()`;
  `orientationchange` is covered even when the browser does not emit `resize`.
- Replace `display: none` on the compact HUD labels with a visually-hidden
  clip pattern, and give `.progress-bar` a `progressbar` role with live
  `aria-valuenow` / `aria-valuemax` / `aria-valuetext` values.
- Respect `env(safe-area-inset-*)` for the compact HUD on notched devices.
- Add `harness/tests/mobile-layout.test.mjs` for the resize contract and
  320×568 orbit bounds.

## Verification

- `npm test`: 179 passed, 3 skipped.
- `npm run lint` and `npm run format:check`: clean.
- `npm run build`: green (including the legacy bundle).
- Playwright touch test at 390×844: real `touchscreen.tap()` on a target planet
  moved hits `0 → 1` and score `0 → 100`.
- Viewport matrix after resize (`844×390`, `320×568`, `360×640`, `390×844`):
  0 planets off-screen, 0 under the HUD, session and score preserved.

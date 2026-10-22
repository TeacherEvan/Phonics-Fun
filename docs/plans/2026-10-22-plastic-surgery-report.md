# Plastic Surgery Report: Phonics Fun

| Metadata | Value |
| :--- | :--- |
| **Date** | 2026-10-22 |
| **Branch** | `feat/plastic-surgery-visual-overhaul` |
| **Base** | `b62ae99` (`fix/surgical-audit-p0-p1`) |
| **Alignment** | **Hybrid** (PWA + Capacitor WebView + classroom BenQ boards) · **Commercial** (publicly deployed, teacher-facing export) · **All audiences** (children's phonics game) |
| **Stack** | Vanilla DOM + CSS3 animations · no canvas, no shader pipeline |
| **Visual Health Score** | **30 → 80 / 100** (preflight visual linter) |
| **Functional Regression** | **ZERO** — 154 Vitest tests pass, 0 ids added/removed, 0 aria attributes added/removed |

---

## 1. Executive summary

The preflight linter scored the project **30/100** with 15 defects. Manual
inspection found the linter's number to be generous: the real problem was not
the defects it listed but **three class-name contracts that did not exist**.

The controller and the stylesheet disagree about what to call things, and in
every case the **stylesheet was the one that was wrong** — it carried rules
for class names the controller never emits, while the names it *does* emit
had no rules at all. The result was that whole screens and whole game objects
rendered with no styling whatsoever, on the two most important surfaces in
the product.

| # | Contract break | Consequence before | Consequence after |
| :--- | :--- | :--- | :--- |
| 1 | Controller emits `letter-button done / current / available`; CSS styles `.playable / .disabled` | **All 26 letter tiles rendered as identical unstyled boxes.** No way to see which letter was the current mission or which were completed. | Gold `current` tile, teal `available` tiles, dimmed `done` tiles with a completion tick |
| 2 | Controller emits `planet a-planet` … `planet z-planet`; CSS styles only `.planet.g-planet` | **For 25 of 26 letters the target planets rendered as dark circles** indistinguishable from the starfield. A child could not tell which planets to tap. | Every target planet renders in the solar-gold gradient; distractors stay cool blue |
| 3 | `UIUtils.showSkeleton()` creates `.skeleton`; CSS defines only `.skeleton-loading` | The loading placeholder rendered as an unstyled empty div. | `.skeleton` now has a proper shimmer |

Defect 2 is the most serious of the three: it is not a cosmetic miss, it is
a **gameplay-legibility** failure that applied to 25 of the 26 letters in the
curriculum.

---

## 2. The `transform` vs `scale` cascade trap

The single most valuable finding of this pass is a CSS cascade subtlety that
silently disabled two features at once.

`.planet` is driven by the `planetOrbit` keyframes, which animate the
`transform` property. **A CSS animation outranks every normal author
declaration**, so:

- `.planet:hover { transform: scale(1.1) }` was **permanently dead**. The
  primary interactive object in the game had *no hover feedback whatsoever*.
- `display-manager.js` injected `.planet { transform: scale(var(--planet-scale, 1)) }`
  to scale planets responsively. That was also **dead** — the responsive
  planet sizing never applied on any device.
- The `:active` rule used `transform: … !important`, and `!important` *does*
  beat an animation, so the planet **snapped out of its orbit** on press.

The fix is the independent `scale` property, which composes with `transform`
instead of replacing it:

```css
/* before — annihilated by the orbit animation */
.planet:hover { transform: scale(1.1); }
.planet { transform: scale(var(--planet-scale, 1)); }

/* after — composes with the orbit */
.planet            { scale: 1; transition: scale 140ms var(--ps-ease-out); }
.planet:hover      { scale: 1.08; }
```

Verified in Chromium: the planet now reports
`transform: matrix(1,0,0,1,-105,169)` (the orbit) **and** `scale: 1`
(the interaction state) simultaneously.

The same technique fixes the letter tiles, whose `--tile-tilt` rotation is
also a `transform` — the mission pulse now animates `scale`, so the press
feedback survives the pulse.

---

## 3. Rendering & smoothness execution plan

| Concern | Change | Effect |
| :--- | :--- | :--- |
| **Layout thrash** | The progress fill animated its `width`; it now scales a full-width fill via `transform: scaleX(var(--progress))`. The controller writes a `--progress` custom property — the element, its id and its semantics are unchanged. | No layout pass per animation frame. Verified: `width: 873px`, `transform: matrix(0,0,0,1,0,0)`, `transition: transform 0.3s` |
| **Numeric jitter** | `font-variant-numeric: tabular-nums` on the hits counter, the volume readouts and the mission letter. Applied inline on the counter so it holds from the first paint. | The live "0 / 5" readout no longer shifts horizontally as digits change |
| **Sticky hover** | 27 `:hover` rules previously applied unconditionally, so on a tablet the hover state stuck after a tap. All hover transforms are neutralised under `@media (hover: none), (pointer: coarse)`. The pre-existing `@media (hover: none)` block covered only 4 selectors and reset `box-shadow: inherit`, which is not a valid restoration. | Hover feedback on pointer devices only; no stuck state on touch |
| **Touch targets** | `.close-button` was 30×30 px, below the 24 px floor's comfortable margin and far below the 44 px target. Raised to 44×44 under `@media (pointer: coarse)`, together with the preview/toggle/primary buttons. | Every interactive control meets the 44 px touch minimum |
| **Reduced motion** | The only guard was injected by JavaScript, so it did not exist during the first paint and never covered the CSS keyframes. A native `@media (prefers-reduced-motion: reduce)` block now collapses the decorative loops and transitions while keeping the spinner and skeleton indicators alive. | 2 reduced-motion media blocks confirmed at runtime (CSS + JS-injected) |
| **GPU layers** | `will-change: transform` sat permanently on every primary button; `will-change: opacity, visibility` sat permanently on all three full-viewport screens. | One layer for the visible screen only; buttons promote on demand |
| **Transitions** | `transition: all` (animates width/height/padding) replaced with explicit property lists throughout the new layer. | No accidental layout animations |
| **Button states** | Six-state tactile spec: default / hover / active (25 ms) / focus-visible / loading (width-locked, label hidden) / disabled. Press feedback collapses the key-light shadow. | Consistent, physical button behaviour |
| **Legibility** | `.popup-content` inherited near-white text on a white surface — invisible. `.word-background` renders the text fallback at 20 % opacity — unreadable. The fallback now carries `.word-text` at full opacity. | Both traps closed |

---

## 4. Isolated layer architecture

All new rules live in a single delimited section at the end of
`css/styles.css` (`PLASTIC SURGERY LAYER`), backed by a perceptual token
block (`--ps-dur-hover`, `--ps-ease-out`, `--ps-shadow-key`,
`--ps-specular`, `--ps-focus`).

It was appended to the existing stylesheet rather than shipped as a third
file: the page already inlines its critical CSS and preloads
`styles.css`, so an extra blocking stylesheet would add a round trip to the
critical path of a game that ships to low-end classroom hardware.

**Known follow-up:** the inlined critical CSS in `index.html` duplicates
about twenty rules from `styles.css`. It was brought back in sync for the
button rules (which removes an existing red→gold flash on first paint), but
the duplication is a maintenance hazard — it should be generated from the
source at build time, not hand-maintained.

---

## 5. Verification

| Check | Result |
| :--- | :--- |
| `preflight_visual_lint.py` | **80/100** (was 30) |
| ESLint | 0 problems |
| Prettier | clean |
| Vitest | **154 passed, 3 skipped** — unchanged, zero functional regression |
| `vite build` | OK |
| Element ids | **0 added, 0 removed** |
| `aria-*` attributes | **0 added, 0 removed** |
| Browser (Chromium, production build) | tile states visually distinct; progress bar compositor-driven; counter tabular; planet `scale` composes with the orbit; reduced-motion blocks present; no new console errors |

### The two remaining linter findings, and why they were not "fixed"

1. **HIGH — `docs/Audit Lighthouse/phonics-fun-theta.vercel.app-20260814T190012.html`.**
   This is a **captured Lighthouse audit report**, i.e. an artifact recording
   the state of the site on 2026-08-14. Editing it to satisfy a linter would
   falsify an audit record. It is not application code and is deliberately
   left untouched.

2. **LOW ×5 — `harness/android-compatibility-test.html`.**
   The detector matches the identifier `fps` anywhere in a line and then
   looks for `tabular-nums` within five lines. It therefore flags JS
   statements like `fps = 1000 / deltaTime;` — a false positive on a
   dev-only diagnostic harness. The two *genuine* readings in that file (the
   FPS readout element) were fixed. Silencing the rest would have meant
   renaming identifiers purely to satisfy a regex, which is worse than the
   finding.

---

## 6. What was deliberately not changed

- **Core logic, state and event bindings** are untouched. The only JS edits
  are three presentation-only lines: a custom property instead of an inline
  width, the `scale` property instead of `transform`, and one additive
  class name.
- **The "coming soon" letter logic** is a functional gap, not a visual one:
  `isLetterEnabled()` returns true for all 26 letters, so the coming-soon
  popup is unreachable and the level-select copy ("the rest are still being
  built in the star workshop") contradicts the behaviour. That copy was
  left as-is because changing it would change product behaviour.
- **The missing artwork** (126 of 130 word images are `.placeholder` stubs)
  is an asset pipeline problem, not a styling one. The delivery path was
  fixed in the audit branch; the files still have to be supplied.

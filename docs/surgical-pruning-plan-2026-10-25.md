# Surgical Pruning Plan — Phonics Fun (2026-10-25)

**Tool:** Surgical-Pruning multi-agent toolkit (dry run, `--execute` **not** passed)
**Target:** `~/github/workspaces/Phonics-Fun` at `38d01e3`
**Prompt:** "audit dead code and unused assets in a vanilla JS PWA game; conservative, human-in-the-loop"

## Result

| Metric | Value |
| :--- | :--- |
| Files inventoried | 455 |
| Auto-prune candidates (confidence ≥ 0.95) | **0** |
| Review-required candidates (0.70–0.95) | **0** |
| Deletions performed | **0** (`safety.dry_run: true`) |
| Architectural smells reported | 38 |
| "Orphans" reported | 423 |

**Zero candidates is the toolkit's conservative default, not proof the repo is clean.** Every file was scored with `confidence: 0`. The count below is the manual verification pass, not a rubber stamp of the headline numbers.

## Verified orphan candidates (all false positives)

The scanner's dependency graph found six tracked source files with no import edges. Each one is live through a path the regex walker cannot see:

| File | Why it is live |
| :--- | :--- |
| `css/styles.css` | `<link>` in `index.html` |
| `public/sw-register.js` | `<script src="/sw-register.js">` in `index.html` |
| `public/sw.js` | Registered by `sw-register.js` |
| `scripts/critical-css.mjs` | `npm run` script |
| `scripts/generate-java-catalog.mjs` | `prebuild` script |
| `scripts/generate-word-cards.mjs` | `prebuild` script |

**Do not delete any of these.** The 423 "orphan" count is dominated by non-source assets and false graph edges; filtering to `js/`, `css/`, `scripts/`, `public/` leaves the six above, all live.

## Real bloat found by measurement (not by the pruner)

| Finding | Measured basis | Recommendation |
| :--- | :--- | :--- |
| `Assets/` duplicates `public/` | 68 files / 11MB vs 159 files / 4.2MB; **27 files byte-identical (3.4MB)** | `Assets/` is the download target of `download-phonics.sh` and `scripts/generate-voices-linux.sh`, not shipped by Vite. Decide whether generated audio belongs in git at all; if it is a build input, keep it but stop committing the duplicates. |
| Background music committed three times | `public/sounds/background-music.wav`, `app/src/main/res/raw/background_music.wav`, `Assets/sounds/background-music.wav` — 2.6MB each | Keep the `public/` copy; the Android raw copy can be produced by the build. |
| 46 `*.placeholder` files | `git ls-files "*.placeholder"` = 46; zero code references | Intentional "art still missing" markers. **Keep** unless the art pipeline has another source of truth. |

## Cross-check discipline

Grep-verified every candidate before recording it here. No deletion was proposed on the strength of a confidence score alone; the pruning run was plan-only, as the toolkit's safety model requires.

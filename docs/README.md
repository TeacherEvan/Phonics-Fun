# Phonics Fun — Documentation

Canonical documentation hub. All project docs live here; the root `README.md` is the product/quick-start overview.

## Active Docs

| Document | Purpose |
|----------|---------|
| [ROADMAP.md](ROADMAP.md) | Current scope (A–Z), out-of-scope, and next candidate work |
| [audio-system.md](audio-system.md) | AudioManager architecture, priority tiers, asset status |
| [sound-generation.md](sound-generation.md) | Tools/commands for generating voice + phoneme audio |
| [visual-enhancements.md](visual-enhancements.md) | Particle system, welcome screen, timing |
| [audit-report.md](audit-report.md) | Code-quality / asset / mobile audit (historical snapshot) |

## Archive (`archive/`)

Retired or superseded material kept for historical record:

- `android-migration-java.md` — original native-Android (Java/Gradle) migration; **superseded by Capacitor**.
- `collision-audit.md` — collision system + MCP tools review.
- `letters-a-b-implementation.md` — early A/B letter implementation notes.
- `test-analysis-report.md` — historical test-coverage report (dated, pre-CI).
- `2026-06-07-phonics-platform-unification-*.md` — June 2026 platform-unification design/plan/context.
- `plans/.archive/2026-06-07-code-review-quick-wins.md` — completed quick-wins plan (✅ archived).

## Doc Hygiene Rules

- One hub: this `docs/` directory. The old uppercase `Docs/` duplicate was removed.
- Keep `js/` references accurate — it is the only runtime bundle shipped to players; `harness/` is dev/test only.
- Android = Capacitor (`capacitor.config.ts`), not the legacy Gradle `app/`.
- Deploy = Vercel (`vercel.json`), not Docker-only.

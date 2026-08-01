# Phonics Fun — Roadmap

## Current scope (as built)
Space-themed educational game teaching the **full A–Z** letter sounds through adaptive, interactive gameplay. Ships as a PWA (installable, offline service worker) with native Android packaging via Capacitor, teacher data export, and adaptive difficulty. Includes Android/BenQ board compatibility shims and MCP diagnostic harnesses (under `harness/`).

## Out of scope (explicitly)
- Single-letter ("G only") demo described in the original `package.json` — superseded by A–Z vocabulary.
- Server/backend, accounts, or multiplayer.

## Next candidate work (not yet scheduled)
1. Lock the A–Z content + adaptive-difficulty spec via a design pass.
2. Add content for letters beyond G (assets/audio currently G-centric in `dist/`).
3. Teacher export format review.
4. Android release signing / Play Store pipeline.

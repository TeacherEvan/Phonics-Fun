# Phonics Fun — Platform Unification & Workflow Hardening
Date: 2026-06-07
Status: Recommended (Approved by Evan via skill invocation)

## 1. Problem Statement

The Phonics Fun codebase currently has:

- **Duplicated game logic** across web (JS) and Android (Java), making changes error-prone.
- **No automated verification** — no test suite, no linting, no CI.
- **Legacy API baggage** in `js/main.js` (30+ aliases bloating the class).
- **Android legacy UI** — imperative Activity-based UI, harder to maintain than Compose.

These issues slow iteration and risk regressions as the game grows.

## 2. Approaches Considered

| Approach | Pros | Cons |
|----------|------|------|
| **A) Keep web-only, abandon Android** | Zero porting cost | Loses classroom deployment on BenQ boards |
| **B) Port Android to cross-platform (React Native/Flutter/KMP)** | Single codebase | Massive rewrite, native UI parity risk |
| **C) Shared library for *data + rules* only; keep platform UIs separate** | Safe, incremental; eliminates most duplication | Logic still split, but game rules are shared |
| **D) Migrate Android UI to Compose only** | Better Android UI, but JS duplication remains | Doesn't solve JS/Java logic duplication |

### Recommendation

**Start with C + D:**

1. Extract a TypeScript shared package for game *data and rules* — this removes the highest-risk duplication.
2. Run a script to generate Java data classes from the TS source (or a JSON manifest).
3. In parallel:
   - Add vitest + JUnit (unblocks safe refactoring).
   - Remove legacy aliases (low-risk cleanup).
   - Add ESLint/k tlint + GitHub Actions (prevents regression).
4. Migrate Android UI to Compose in a later phase (separate plan).

This gives immediate value with minimal risk, and sets up the foundation for bigger improvements later.

## 3. Scope for This Plan

- **In scope today:**
  - Vitest + test setup for JS
  - JUnit + placeholder structure for Android
  - Shared TypeScript game-data package
  - Code-gen to produce Java data from TS
  - Remove legacy aliases in `js/main.js`
  - Add ESLint + GitHub Actions

- **Out of scope:**
  - Composing Android UI rewrite (needs its own plan)
  - Build systems (Gradle/vite) — minimal enough to skip for now

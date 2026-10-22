# External Research: Gamification, Web Audio Synthesis, & Accessibility for Early Childhood Phonics (Ages 4–7)

**Strategy:** `pattern-driven` + `targeted-docs`  
**Sources:** W3C Web Audio API Spec, W3C WCAG 2.1/2.2 Recommendations, MDN Web Docs, Nielsen Norman Group, Journal of the Audio Engineering Society (Chowning 1973)  
**Credibility Tier:** Tier 1 (W3C Normative Specs, MDN) & Tier 2 (Academic Papers & Industry Guidelines)  
**Date:** 2026-10-22

## 1. Gamification Mechanics for Ages 4–7
- **Grace-Period Streaks vs. Punitive Resets:** In early childhood psychology (Piagetian pre-operational to concrete operational transition), resetting streak counters to zero upon a single miss induces emotional frustration and disengagement. Recommended: 1-hit "Streak Shield" and soft decay (decrementing multiplier rather than full reset to 0), paired with growth mindset feedback ("ALMOST! 💫", "LISTEN CLOSELY! 👂"). [Tier 2: Ryan & Deci, 2000; Vygotsky, 1978].
- **Micro-Rewards (<150ms):** Feedback latency must be instantaneous to maintain causal connection between physical touch and learning reward. Pair squash-and-stretch animation with ascending musical chimes and floating praise text. [Tier 2: Jonasson & Purho, 2012].
- **Zero-Cognitive-Load Phonics Power-Ups:** "Sound Echo" (re-voicing target phoneme) and "Asteroid Zap" (destroying 1-2 distractor asteroids for errorless learning scaffolding). [Tier 2: GAG Guidelines].

## 2. Web Audio API Synthesis Architecture
- **Native FM Synthesis Bell Chimes:** Avoid generating audio via JavaScript TypedArray allocations (`createBuffer`) on main thread during continuous gameplay. Native Web Audio graph nodes (`OscillatorNode`, `GainNode`) run on the browser's dedicated real-time audio thread without GC pauses. [Tier 1: W3C Web Audio API Spec, Section 1.3].
- **FM Inharmonic Chime Formula:** Carrier frequency $f_c$ with modulator frequency $f_m \approx 1.414 \times f_c$ produces metallic bell spectra. [Tier 2: Chowning, 1973].
- **Major Pentatonic Scale for Streaks:** Pentatonic semitones [C5 (523Hz), D5 (587Hz), E5 (659Hz), G5 (784Hz), A5 (880Hz), C6 (1046Hz)] guarantee consonance across rapid touch taps, eliminating harsh dissonance. [Tier 2: Acoustic Music Theory].
- **Click-Free Automation:** Always use `gain.setTargetAtTime(0, time, timeConstant)` or exponential ramp to `0.0001` before stopping nodes; avoid linear ramp to 0 or hard stop to eliminate audio pops. [Tier 1: MDN Web Audio Param Scheduling].

## 3. Accessibility & Safety
- **Touch Target Sizing:** Ages 4–7 have developing fine-motor control; touch targets must measure at least $48 \times 48$ CSS pixels with $\ge 12\text{px}$ separation. [Tier 2: Nielsen Norman Group Pediatric UX].
- **Contrast & Motion:** $\ge 4.5:1$ text contrast against space backgrounds; respect `prefers-reduced-motion` to disable screenshake, hyperspace warp, and rapid particle bursts. [Tier 1: WCAG 2.1 AA SC 1.4.3, SC 2.2.2].
- **Dual Screen Reader Announcers:** Polite announcer for score updates (`aria-live="polite"`), assertive announcer for instructional phonics prompts (`aria-live="assertive"`). [Tier 1: W3C WAI-ARIA 1.2].

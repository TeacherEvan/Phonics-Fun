# External Research: Mobile/Tablet & Interactive Whiteboard Performance Patterns

**Strategy:** `codebase-first` + `pattern-driven`  
**Sources:** Chromium Project GPU Architecture, Android Developer Documentation, W3C Pointer Events Level 2/3, Google Web.dev, BenQ Board Technical Specs  
**Credibility Tier:** Tier 1 (Normative Standards & Engine Docs) & Tier 2 (Platform Guides)  
**Date:** 2026-10-22

## 1. Capacitor Android WebView Optimization
- **Hardware Acceleration:** Ensure `android:hardwareAccelerated="true"` in AndroidManifest.xml and verify `View.setLayerType` remains default/hardware. Software rendering drops Canvas2D/CSS transforms by up to 90%. [Tier 1: Android Developer Documentation].
- **GPU VRAM & `will-change` Hygiene:** Each composited layer allocates $\text{Width} \times \text{Height} \times 4\text{ bytes}$ of uncompressed VRAM. At 4K resolution (BenQ interactive flat panel displays), a single full-screen layer consumes ~33 MB VRAM. Permanent `will-change` across idle buttons and non-visible screens triggers layer explosion, texture thrashing, and low-memory kills on Android SoCs. [Tier 1: Chromium GPU Accelerated Compositing].
- **Compositor Isolation:** Transitions must be restricted to compositor-friendly CSS properties (`transform`, `opacity`) to eliminate layout recalculation on Blink main thread. [Tier 2: Google Web.dev Life of a Pixel].

## 2. Interactive Whiteboard (BenQ IFP) Input Architecture
- **Hardware Digitizer Sampling:** BenQ Board Pro/Master panels feature 40-point multi-touch sampling at 100 Hz to 250 Hz. [Tier 2: BenQ Technical Whitepapers].
- **W3C Pointer Events Migration:** Deprecate fragmented `touchstart`/`touchmove`/`click` polyfills in favor of unified W3C Pointer Events (`pointerdown`, `pointermove`, `pointerup`) with `pointerId` tracking and `setPointerCapture`. [Tier 1: W3C Pointer Events Level 3].
- **Compositor Pass-Through:** Assign CSS `touch-action: none` to the game canvas/board container and register event listeners as `{ passive: true }`. This enables zero-latency touch response without waiting for main-thread `preventDefault()`. [Tier 1: W3C Pointer Events Spec, Section 9; Google Web.dev].
- **High-Frequency Coalesced Events:** Do not use arbitrary wall-clock debounce/throttle on pointer movement. Use `event.getCoalescedEvents()` to access intermediate sub-frame digitizer points, flushing state exclusively within `requestAnimationFrame`. [Tier 1: W3C Pointer Events Level 2, Section 5.2.8].

## 3. Service Worker Audio Caching
- **CacheFirst Strategy:** Game audio assets (phoneme sounds, voice packs, sound effects) require CacheFirst caching to guarantee offline classroom reliability and prevent mobile cellular/radio saturation. [Tier 1: W3C Service Worker & Cache API Specs].
- **HTTP 206 Partial Content Range Parsing:** Mobile browsers (Chromium WebView, Safari) issue HTTP `Range` requests for `<audio>` playback. `Cache.put()` rejects 206 responses. The Service Worker fetch handler must slice cached full-buffer responses to return synthetic 206 responses matching requested byte ranges. [Tier 2: Google Web.dev Workbox Range Requests Guide].

# 📋 Phonics Fun - Job Card 2: Android Compatibility

## 🎯 Objective: Resolve Android Platform Issues

**Date**: July 16, 2025  
**Assigned to**: GitHub Copilot  
**Status**: IN PROGRESS 🚀

---

## 🔄 **Workflow – Android Compatibility Fix**

1. Collect device metadata (Android version, browser build, hardware info).  
2. Run `android-test.html` on the Benq board and export the on-screen log (`Save → Share`).  
3. Parse the log and map each failure to a scenario in *Phase 2*.  
4. Apply the corresponding code patch:  
   4.1 `event-manager.js` → prioritise `touchstart`/`touchend` + `preventDefault()` on first touch.  
   4.2 `main.js` → add `unlockAudio()` on initial user tap (creates/resumes `AudioContext`).  
   4.3 Fallback: if `window.AudioContext` is undefined, route playback through `<audio>` tags.  
5. Re-deploy build to the Benq board and re-run diagnostics.  
6. Iterate until all tests in `android-test.html` pass.  
7. Final regression test on desktop + Chrome/Edge mobile emulators.  
8. Mark this job card **COMPLETE** and bump the version tag.

---

## 📝 **Problem Description**

The user has reported that the "Phonics Fun" game is not running correctly on an Android-based Benq board. The primary goal of this job card is to diagnose and resolve the compatibility issues to ensure the game is fully functional on the Android platform.

### **Key Symptoms**:
- Game fails to run or experiences critical errors on the Benq Android board.
- Potential issues with touch input and audio playback.

---

## 🛠️ **Diagnostic & Resolution Plan**

### **Phase 1: Diagnostics**

1.  **✅ Create a Dedicated Test File (`android-test.html`)**: 
    - An isolated HTML file has been created to test fundamental browser capabilities on the target device.
    - This test will check for:
        - **Touch Events**: `touchstart`, `touchend`
        - **Mouse Events**: `mousedown`, `mouseup`, `click`
        - **Audio Playback**: Standard HTML5 `<audio>` element playback.
        - **Web Audio API**: Availability of `AudioContext`.

2.  **Analyze Test Results**:
    - **PENDING**: Awaiting user feedback from running `android-test.html` on the Benq board.
    - The results from the on-screen logger will guide the next steps.

### **Phase 2: Implementation (Based on Diagnostics)**

- **Scenario A: Touch Events Fail**
  - **Action**:  
    1. Add `touchstart`/`touchend` listeners before `mousedown`/`mouseup`.  
    2. Call `e.preventDefault()` to avoid ghost clicks.  
    3. Expose a new `EventManager.initForTouch()` invoked once on boot.
- **Scenario B: Audio Playback Fails**
  - **Action**:  
    1. Create `unlockAudio()` in `audio-manager.js`.  
    2. Bind it to the first `pointerup` event on the “Start Game” button.  
    3. Log success/failure to the in-game console.
- **Scenario C: Web Audio API Not Supported**
  - **Action**: Detect support; if absent, switch `AudioManager` to `<audio>` element mode and disable advanced SFX.
- **Scenario D: Other Issues**
  - **Action**: Document in `android-diagnostic-runner.html`, then open a follow-up job card if required.

---

## 📊 **Progress Tracker**

| Task | Status | Notes |
|------|--------|-------|
| **Diagnostics** | | |
| Create `android-test.html` | ✅ COMPLETE | Test file generated and provided to user. |
| Await User Feedback | ⏳ PENDING | Waiting for results from the Android device. |
| **Implementation** | | |
| Update Event Manager | 🚧 IN PROGRESS | Touch priority branch added |
| Implement Audio Unlocking | 🚧 IN PROGRESS | `unlockAudio()` stubbed |
| **Testing** | | |
| Verify on Android Device | ⏹️ NOT STARTED | |
| Update Game Logic (G→G,A,B) | ✅ COMPLETE | `allowedLetters` array added |
| Enable Letter A | ✅ COMPLETE | Button un-disabled & assets loaded |
| Enable Letter B | ✅ COMPLETE | Button added & assets loaded |
| Multi-Letter Logic QA | 🚧 IN PROGRESS | Full test pass pending |
| Collision Manager Audit | ✅ COMPLETE | Full audit with detailed analysis |
| Review MCP Tools | ✅ COMPLETE | All tools reviewed & documented |
| Create MCP Script Files | ✅ COMPLETE | Created mcp-audio.js, mcp-touch.js, mcp-perf.js, mcp-controller.js |
| Integrate MCP Tools | ✅ COMPLETE | Integrated into android-diagnostic-runner.html and android-compatibility-test.html |
| Run Full Diagnosis | 🚧 IN PROGRESS | Ready for diagnostic runs on target devices |

---  

## 🛠️ **MCP Tools Review & Full Diagnosis Workflow**

1. **Inventory** – ✅ COMPLETE
   - Listed and reviewed all available MCP utilities
   - Created four script files: `mcp-audio.js`, `mcp-perf.js`, `mcp-touch.js`, and `mcp-controller.js`

2. **Select** – ✅ COMPLETE
   - Selected optimal set for Android diagnostics:
   - `mcp-touch.js` for pointer latency and touch event diagnostics
   - `mcp-audio.js` for audio unlock state and playback diagnostics
   - `mcp-perf.js` for frame rate and memory usage monitoring
   - `mcp-controller.js` for unified diagnostic control

3. **Integrate** – ✅ COMPLETE
   - Injected all scripts into `android-diagnostic-runner.html` with UI controls
   - Added MCP diagnostic section to `android-compatibility-test.html`
   - Implemented comprehensive diagnostic functions and results display

4. **Execute** – 🚧 IN PROGRESS
   - Ready for deployment to Android device for testing
   - Diagnostic functions will gather data on audio, touch, and performance issues
   - Results will automatically identify compatibility issues and suggest fixes
4. **Execute** – run on the Benq board, tap “Start MCP Scan”.  
5. **Collect Logs** – export JSON results via on-screen “Download Report”.  
6. **Analyse** – map failing metrics to tasks in the progress tracker.  
7. **Iterate Fix / Re-run** until all MCP scores ≥ 90 %.  
8. **Sign-off** – update “Run Full Diagnosis” row to ✅ COMPLETE.

> Use `npm run mcp:bench` for desktop quick checks before deploying to the board.

---  
## 📂 **Letter A Implementation Plan**

1. **Audio Asset Generation**  
   - Use `sound-generation-guide.md` + **eSpeak**.  
   - Files: `phoneme-a.wav`, `voice-apple.wav`, … → `assets/sounds/`.

2. **Update AudioManager**  
   - `js/audio-manager.js → loadAllSounds()` add new entries.  
   - Extend `availableVoiceTemplates` if extra voice styles are needed.

3. **Update GameState**  
   - `js/main.js → wordMessages[]` append words starting with “A”.

4. **Enable Letter in UI**  
   - `index.html → letter-grid` remove `disabled` from the “A” button.

5. **Update Game Logic**  
   - In collision / scoring checks replace hard-coded `"G"` filters with an array `['G','A']` (future-proof).

6. **Testing**  
   - Update `android-test.html` to log phoneme “A” playback.  
   - Full play-through on desktop + Android.  

> Once all the above steps pass QA, open **Job Card 3 – Letter A Release** for documentation and final polish.

---  
## 📂 **Letter B Implementation Plan**

1. **Audio Asset Generation**  
   - Use `sound-generation-guide.md` + **eSpeak**.  
   - Files: `phoneme-b.wav`, `voice-ball.wav`, … → `assets/sounds/`.

2. **Update AudioManager**  
   - `js/audio-manager.js → loadAllSounds()` add new entries.  
   - Extend `availableVoiceTemplates` if extra voice styles are needed.

3. **Update GameState**  
   - `js/main.js → wordMessages[]` append words starting with "B".

4. **Enable Letter in UI**  
   - `index.html → letter-grid` remove `disabled` from the "B" button.

5. **Update Game Logic**  
   - In collision / scoring checks replace hard-coded `"G"` filters with an array `['G','A','B']` (future-proof).

6. **Testing**  
   - Update `android-test.html` to log phoneme "B" playback.  
   - Full play-through on desktop + Android.  

> Once all the above steps pass QA, open **Job Card 4 – Letter B Release** for documentation and final polish.
   - In collision / scoring checks replace hard-coded `"G"` filters with an array `['G','A','B']` (future-proof).

6. **Testing**  
   - Update `android-test.html` to log phoneme “B” playback.  
   - Full play-through on desktop + Android.  

> Once all the above steps pass QA, open **Job Card 4 – Letter B Release** for documentation and final polish.

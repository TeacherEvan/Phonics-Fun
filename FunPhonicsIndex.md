# Phonics Fun - Project Index

This document provides a summarized index of all important notes and guides for the Phonics Fun project.

## 1. Core Objective & Gameplay

- **Primary Goal**: Create an educational game to teach children phonics, currently supporting the letters **G, A and B**.
- **Core Gameplay**: The player interacts with planets and asteroids. Correct interactions (hitting "G" planets) are rewarded with positive feedback, while incorrect interactions have neutral or negative feedback.

## 2. How to Implement New Phonic Letters

Based on the existing structure and job cards, here is the most productive way to implement new letters:

1.  **Generate Audio Assets**:
    *   Use the `sound-generation-guide.md` to create new `.wav` files for the new letter's phoneme and corresponding words. The recommended tool is **eSpeak** for consistency.
    *   Place the new audio files in the `assets/sounds/` directory, following the existing naming convention (e.g., `phoneme-h.wav`, `voice-hat.wav`).

2.  **Update the `AudioManager`**:
    *   In `js/audio-manager.js`, add the new sounds to the `loadAllSounds` method.
    *   If new voice templates are needed, update the `availableVoiceTemplates` array.

3.  **Update the `GameState`**:
    *   In `js/main.js`, update the `wordMessages` array in the `GameState` class to include the new words for the new letter.

4.  **Enable the Letter in the UI**:
    *   In `index.html`, find the corresponding letter in the `letter-grid` and remove the `disabled` class.
    *   In `css/styles.css`, you may need to update the styling for the newly enabled letter button.

5.  **Update Game Logic for the New Letter**:
    *   In `js/main.js`, push the new letter into `GameState.allowedLetters` (e.g., `allowedLetters.push('C')`) instead of replacing the array.

## 3. Audio System - IMPORTANT NOTES

- **Priority System**: The audio system is now based on a priority system to optimize performance, especially on Android.
    - **High Priority**: Voice files and phonemes (essential for learning).
    - **Medium Priority**: Sound effects like explosions and celebrations.
    - **Low Priority**: Background music (disabled by default to save resources).
- **User Control**: Users can enable/disable audio based on priority in the settings panel.
- **File Formats**: The game currently uses `.wav` files. For future optimization, consider converting these to compressed formats like `.mp3` or `.ogg`.

## 4. Android Compatibility

- **Primary Concern**: Performance on BenQ Android boards.
- **Key Issues**: Potential problems with touch input and audio playback.
- **Solution Approach**:
    1.  Use the `android-test.html` and `android-diagnostic-runner.html` files to diagnose issues on the target device.
    2.  Based on the diagnostics, implement solutions such as audio unlocking on user interaction and prioritizing touch events.
- **Reference**: See `jobcard2.md` for the detailed diagnostic and resolution plan.

## 5. Visuals and Enhancements

- **Particle System**: A dedicated particle engine (`js/particles.js`) handles effects like asteroid trails and explosions.
- **Welcome Screen**: Features advanced animations, an interactive background, and enhanced explosion effects.
- **Reference**: See `welcome-screen-enhancements.md` and `enhancement-summary.md` for details.

## 6. Project Structure and Status

- **File Structure**: A complete overview of the project's file structure is available in `project-status.md`.
- **Completed Features**: A detailed list of all implemented features is also in `project-status.md`.
- **Voice Templates**: The voice template system is complete, with four different voice options. See `jobcard.md` for details.
- **Completed Letters**: `G`, `A`, `B` (see jobcard2.md for QA status).

By following these summarized points, any developer should be able to quickly understand the project's status, architecture, and the process for future expansion.

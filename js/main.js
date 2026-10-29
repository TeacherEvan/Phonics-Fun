/**
 * Phonics Fun - Educational Phonics Game
 * Interactive space-themed game for learning letter sounds
 * Author: AI Assistant
 *
 * @fileoverview Main game controller managing state, screens, and gameplay
 * @version 2.0.0
 */

import EventBus from './event-bus.js';
import AudioManager from './audio-manager.js';
import EventManager from './event-manager.js';
import CollisionManager from './collision-manager.js';
import ParticleSystem from './particles.js';
import PerformanceUtils from './performance-utils.js';
import UIUtils from './ui-utils.js';
import DisplayManager from './display-manager.js';
import AndroidBenQInitializer from './android-benq-init.js';
import {
    PHONICS_FUN_LETTER_DATA,
    getVocabulary,
    getEnabledLetters,
} from './letter-data.js';
import { imagePathCandidates } from './asset-paths.js';
import { loadFirstAvailableImage } from './image-loader.js';

// Re-exported so existing importers keep working.
export { PHONICS_FUN_LETTER_DATA };

// Also attach to window for backward compatibility with tests
if (typeof window !== 'undefined') {
    window.PHONICS_FUN_LETTER_DATA = PHONICS_FUN_LETTER_DATA;
}

/** Layout size of an asteroid element (must match the `.asteroid` CSS rule). */
const ASTEROID_SIZE = 20;
/** Asteroid flight speed in CSS pixels per second. */
const ASTEROID_SPEED_PX_PER_SEC = 1000;
/** Hard cap on a single asteroid flight, in seconds. */
const MAX_ASTEROID_FLIGHT_SECONDS = 2.5;

/**
 * GameState - Main game state management class
 * Handles screen navigation, gameplay logic, and subsystem coordination
 */
class GameState {
    constructor() {
        // Screen management
        this.currentScreen = 'welcome';
        // True once the "entered screen" side effects have run for the
        // current screen.
        this.hasAppliedScreen = false;

        // Gameplay state
        this.correctHitsCount = 0;
        this.incorrectHitsCount = 0;
        this.totalAnswersCount = 0;
        // Cumulative counters preserved across letters for teacher export.
        // Live counters (above) reset each letter; cumulatives do not.
        this.cumCorrect = 0;
        this.cumIncorrect = 0;
        this.cumTotal = 0;
        this.difficultySpeedMultiplier = 1.0;
        this.difficultyPlanetCount = 3;
        this.completedLevels = [];
        this.sessionId = Math.random().toString(36).substring(2, 9);
        this.isGameplayActive = false;
        this.arePlanetsRendered = false;
        // Gamification & Excitement stats
        this.gameScore = 0;
        this.currentStreak = 0;
        this.highestStreak = 0;
        // Monotonic counter for asteroid identifiers (Date.now() collided).
        this.asteroidSequence = 0;
        // The asteroid that is currently in flight, if any.
        this.pendingAsteroidId = null;

        // Letter configuration
        this.letterVocabulary = Object.fromEntries(
            getEnabledLetters().map((letter) => [
                letter,
                getVocabulary(letter),
            ]),
        );
        this.enabledLetters = getEnabledLetters();
        this.activeLetterLevel = 'A';

        // Active vocabulary for current level
        this.activeVocabulary = this.letterVocabulary['A'];
        this.requiredHitsToComplete = this.activeVocabulary.length;
        this.vocabularyIndex = 0;

        // Audio settings
        this.isAudioMuted = false;
        this.backgroundMusicVolume = 0.5;
        this.soundEffectsVolume = 0.7;

        // Initialize subsystems
        this.audioManager = new AudioManager();
        this.eventManager = new EventManager();
        this.collisionManager = new CollisionManager();
        this.particleSystem = null;

        // Performance and UI utilities
        this.performanceUtils = new PerformanceUtils();
        this.uiUtils = new UIUtils();

        // Display management for responsive design
        this.displayManager = new DisplayManager();

        // Initialize Android/BenQ compatibility
        this.androidBenQInitializer = new AndroidBenQInitializer();

        // Load saved stats and set initial adaptive difficulty
        this.loadSavedStats();

        this.initializeGame();
    }

    // Legacy getters for backward compatibility
    get correctHits() {
        return this.correctHitsCount;
    }
    set correctHits(value) {
        this.correctHitsCount = value;
    }
    get totalHits() {
        return this.requiredHitsToComplete;
    }
    set totalHits(value) {
        this.requiredHitsToComplete = value;
    }
    get gameActive() {
        return this.isGameplayActive;
    }
    set gameActive(value) {
        this.isGameplayActive = value;
    }
    get planetsCreated() {
        return this.arePlanetsRendered;
    }
    set planetsCreated(value) {
        this.arePlanetsRendered = value;
    }
    get allowedLetters() {
        return this.enabledLetters;
    }
    get currentLetter() {
        return this.activeLetterLevel;
    }
    set currentLetter(value) {
        this.activeLetterLevel = value;
    }
    get wordMessages() {
        return this.activeVocabulary;
    }
    set wordMessages(value) {
        this.activeVocabulary = value;
    }
    get currentWordIndex() {
        return this.vocabularyIndex;
    }
    set currentWordIndex(value) {
        this.vocabularyIndex = value;
    }
    get isMuted() {
        return this.isAudioMuted;
    }
    set isMuted(value) {
        this.isAudioMuted = value;
    }
    get musicVolume() {
        return this.backgroundMusicVolume;
    }
    set musicVolume(value) {
        this.backgroundMusicVolume = value;
    }
    get effectsVolume() {
        return this.soundEffectsVolume;
    }
    set effectsVolume(value) {
        this.soundEffectsVolume = value;
    }

    /**
     * Initialize the game and all subsystems
     */
    initializeGame() {
        console.log('🎮 Initializing Phonics Fun game...');
        this.setupEventListeners();
        this.setupAudioConfiguration();
        this.setupEventSubscriptions();
        this.renderLetterSelectionGrid();
        this.syncLetterDisplays();
        this.createWelcomeScreenAnimations();
        this.navigateToScreen('welcome');

        // Make interactive elements enhanced
        if (this.uiUtils) {
            this.uiUtils.makeInteractive('.primary-button');
            this.uiUtils.makeInteractive('.secondary-button');
        }
    }

    /**
     * Setup all DOM event listeners for user interactions
     */
    setupEventListeners() {
        // Welcome screen - Start game button
        document
            .getElementById('start-game-btn')
            .addEventListener('click', () => {
                console.log('▶️ Start game clicked');
                this.navigateToScreen('level-select');
            });

        // Settings panel toggle
        document
            .getElementById('settings-btn')
            .addEventListener('click', () => {
                this.toggleSettingsPanel();
            });

        document
            .getElementById('close-settings')
            .addEventListener('click', () => {
                this.toggleSettingsPanel();
            });

        // Volume controls with real-time feedback
        document
            .getElementById('music-volume')
            .addEventListener('input', (e) => {
                this.backgroundMusicVolume = e.target.value / 100;
                this.audioManager.setVolume(
                    'music',
                    this.backgroundMusicVolume,
                );
                document.getElementById('music-volume-display').textContent =
                    e.target.value + '%';
            });

        document
            .getElementById('effects-volume')
            .addEventListener('input', (e) => {
                this.soundEffectsVolume = e.target.value / 100;
                this.audioManager.setVolume('effects', this.soundEffectsVolume);
                document.getElementById('effects-volume-display').textContent =
                    e.target.value + '%';
            });

        // Mute toggle
        document.getElementById('mute-toggle').addEventListener('click', () => {
            this.toggleAudioMute();
        });

        // Audio priority controls for bandwidth optimization
        document
            .getElementById('high-priority-audio')
            .addEventListener('change', (e) => {
                this.audioManager.setAudioPriority('high', e.target.checked);
            });

        document
            .getElementById('medium-priority-audio')
            .addEventListener('change', (e) => {
                this.audioManager.setAudioPriority('medium', e.target.checked);
            });

        document
            .getElementById('low-priority-audio')
            .addEventListener('change', (e) => {
                this.audioManager.setAudioPriority('low', e.target.checked);
                // Enable background music if checkbox is checked and on welcome screen
                if (e.target.checked && this.currentScreen === 'welcome') {
                    this.audioManager.play('background-music');
                }
            });

        // Voice template selection
        document
            .getElementById('voice-template-select')
            .addEventListener('change', (e) => {
                this.handleVoiceTemplateChange(e.target.value);
            });

        document
            .getElementById('preview-voice')
            .addEventListener('click', () => {
                this.previewVoiceTemplate();
            });

        // Export progress data for teachers
        const exportDataBtn = document.getElementById('export-data-btn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportTeacherData();
            });
        }

        // Level complete popup actions
        document
            .getElementById('next-level-btn')
            .addEventListener('click', () => {
                console.log('⏭️ Next level clicked');
                this.dismissPopup('level-complete-popup');
                this.navigateToScreen('level-select');
            });

        document.getElementById('exit-btn').addEventListener('click', () => {
            console.log('🚪 Exit clicked');
            this.dismissPopup('level-complete-popup');
            this.navigateToScreen('welcome');
        });

        // Coming soon popup close
        document.getElementById('close-popup').addEventListener('click', () => {
            console.log('Close popup clicked');
            this.dismissPopup('coming-soon-popup');
        });

        // Touch event optimization for mobile and tablet devices
        this.setupTouchEventHandlers();

        // Handle device orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleDeviceOrientationChange(), 100);
        });

        // Handle display changes from DisplayManager
        window.addEventListener('displaychange', (e) => {
            this.handleDisplayChange(e.detail);
        });

        // Handle page visibility changes (critical for mobile browsers).
        // This is the ONLY visibilitychange listener in the app: it owns the
        // audio suspend/resume policy and the animation pausing. Previously
        // three listeners competed, so the background music was stopped and
        // restarted from zero on every tab switch.
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Reposition the playfield when the viewport changes, but never reset
        // the session: a rotation used to call resetGameplayState(), which
        // deactivated the game and zeroed the score mid-level.
        window.addEventListener('resize', () => this.schedulePlanetLayout());
    }

    /**
     * Single owner of the app's visibility policy.
     *
     * Pausing the Web Audio context matters: the background music is a
     * looping AudioBufferSource, which the HTML `<audio>` based `pauseAll()`
     * cannot pause, so the music kept playing for a hidden tab.
     */
    handleVisibilityChange() {
        const hidden = document.hidden;

        if (hidden) {
            this.audioManager.pauseAll();
            this.audioManager.suspendIfRunning();
        } else {
            this.audioManager.resumeIfSuspended();
            this.audioManager.resumeAll();
        }

        if (this.displayManager) {
            if (hidden) {
                this.displayManager.pauseExpensiveOperations();
            } else {
                this.displayManager.resumeExpensiveOperations();
            }
        }
    }

    /**
     * Setup touch event handlers for mobile optimization
     */
    setupTouchEventHandlers() {
        // Prevent scrolling while interacting with game area
        document.addEventListener(
            'touchmove',
            (e) => {
                if (
                    e.target.closest('.game-area') ||
                    e.target.closest('.planet')
                ) {
                    e.preventDefault();
                }
            },
            { passive: false },
        );

        // Disable context menu only in game area for better touch experience
        // This preserves accessibility for users who rely on context menus elsewhere
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.game-area') || e.target.closest('.planet')) {
                e.preventDefault();
            }
        });
    }

    /**
     * Coalesce viewport changes into one playfield layout pass.
     *
     * The HUD is a CSS overlay; its height is only final after the browser has
     * applied the new media query. Measuring immediately after a resize can
     * therefore use the previous viewport and leave planets off-screen (the
     * landscape regression). A zero-delay task lets style/layout settle, while
     * the handle cancels duplicate resize/orientation events.
     */
    schedulePlanetLayout() {
        if (this.planetLayoutTimer) {
            clearTimeout(this.planetLayoutTimer);
        }
        this.planetLayoutTimer = setTimeout(() => {
            this.planetLayoutTimer = null;
            if (this.currentScreen === 'gameplay' && this.arePlanetsRendered) {
                this.adjustPlanetPositions();
            }
        }, 0);
    }

    /**
     * Handle display changes from DisplayManager
     * @param {Object} displayInfo - Display information from DisplayManager
     */
    handleDisplayChange(displayInfo) {
        console.log('📱 Display configuration changed:', displayInfo);

        // Reposition planets for the new viewport; never reset the session.
        if (this.currentScreen === 'gameplay' && this.arePlanetsRendered) {
            this.schedulePlanetLayout();
        }

        // Update UI scaling
        this.updateUIScaling(displayInfo);
    }

    /**
     * Radius of a planet's orbit, in pixels. Held to a fraction of the short
     * viewport edge so a phone does not swing its targets off-screen.
     * @returns {number}
     */
    computeOrbitRadius() {
        const vmin = Math.min(window.innerWidth, window.innerHeight);
        return Math.round(Math.min(200, Math.max(44, vmin * 0.22)));
    }

    /**
     * Position a planet so that its whole orbit stays inside the part of the
     * playfield the HUD does not cover, and return the radius actually used.
     *
     * The HUD is an opaque overlay anchored to the top of the screen. Planets
     * used to be scattered over the full window, so on a phone most targets
     * spawned underneath it — visible to the DOM, invisible and untappable to
     * the child.
     *
     * @param {HTMLElement} planet - Element already mounted, so it has a width
     * @param {number} requestedRadius - Desired orbit radius in pixels
     * @param {{ index: number, total: number }} [slot] - Position in the
     *     playfield grid. The default places a single planet in the centre.
     * @returns {number} The orbit radius that fits
     */
    placePlanetInPlayArea(
        planet,
        requestedRadius,
        slot = { index: 0, total: 1 },
    ) {
        const area = document.querySelector('.game-area');
        if (!area) return requestedRadius;

        const areaRect = area.getBoundingClientRect();
        const hud = document.querySelector('.game-ui');
        const hudBottom = hud
            ? Math.max(0, hud.getBoundingClientRect().bottom - areaRect.top)
            : 0;

        const size = planet.offsetWidth || 100;
        const half = size / 2;
        const pad = 6;

        const freeWidth = Math.max(0, areaRect.width - 2 * (half + pad));
        const freeHeight = Math.max(
            0,
            areaRect.height - hudBottom - 2 * (half + pad),
        );

        const total = Math.max(1, Number(slot?.total) || 1);
        const index = Math.min(
            Math.max(0, Number(slot?.index) || 0),
            total - 1,
        );
        const boardAspect = Math.max(0.25, freeWidth / Math.max(1, freeHeight));
        const cols = Math.max(
            1,
            Math.min(
                total,
                Math.round(Math.sqrt(total * boardAspect)),
            ),
        );
        const rows = Math.max(1, Math.ceil(total / cols));

        // Cap orbit radius so sufficient free space remains for row/col separation
        const radius = Math.max(
            0,
            Math.min(
                requestedRadius,
                freeWidth / (cols + 1),
                freeHeight / (rows + 1),
            ),
        );

        const minX = half + pad + radius;
        const maxX = Math.max(minX, areaRect.width - half - pad - radius);
        const minY = hudBottom + half + pad + radius;
        const maxY = Math.max(minY, areaRect.height - half - pad - radius);
        const rangeX = Math.max(0, maxX - minX);
        const rangeY = Math.max(0, maxY - minY);

        const col = index % cols;
        const row = Math.floor(index / cols);
        const xStep = cols > 1 ? rangeX / (cols - 1) : 0;
        const yStep = rows > 1 ? rangeY / (rows - 1) : 0;
        const itemsInRow = Math.min(cols, total - row * cols);
        const rowOffset = cols > 1 ? ((cols - itemsInRow) * xStep) / 2 : 0;
        const centreX =
            cols > 1 ? minX + col * xStep + rowOffset : minX + rangeX / 2;
        const centreY = rows > 1 ? minY + row * yStep : minY + rangeY / 2;

        planet.style.left = `${Math.round(centreX - half)}px`;
        planet.style.top = `${Math.round(centreY - half)}px`;

        return Math.round(radius);
    }

    /**
     * Adjust planet positions for current viewport
     * @param {Object} displayInfo - Display information
     */
    adjustPlanetPositions(_displayInfo) {
        const orbitRadius = this.computeOrbitRadius();
        const planets = Array.from(document.querySelectorAll('.planet'));

        if (planets.length === 0) {
            document.documentElement.style.setProperty(
                '--orbit-radius',
                `${orbitRadius}px`,
            );
            return;
        }

        let usedRadius = orbitRadius;
        planets.forEach((planet, index) => {
            usedRadius = this.placePlanetInPlayArea(planet, orbitRadius, {
                index,
                total: planets.length,
            });
            planet.style.setProperty('--orbit-radius', `${usedRadius}px`);
        });

        document.documentElement.style.setProperty(
            '--orbit-radius',
            `${usedRadius}px`,
        );
    }

    /**
     * Update UI scaling based on display info
     * @param {Object} displayInfo - Display information
     */
    updateUIScaling(displayInfo) {
        // UI scaling is handled by DisplayManager CSS variables
        console.log(
            `🎨 UI scaled for ${displayInfo.deviceType} in ${displayInfo.orientation} orientation`,
        );
    }

    /**
     * Handle device orientation changes for responsive layout
     */
    handleDeviceOrientationChange() {
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            // Force layout recalculation
            gameArea.style.display = 'none';
            gameArea.offsetHeight; // Trigger reflow
            gameArea.style.display = '';
        }
        // Orientationchange does not always emit a resize event; schedule the
        // same single layout pass used by the resize path.
        this.schedulePlanetLayout();
    }

    /**
     * Configure audio manager with current settings
     */
    setupAudioConfiguration() {
        this.audioManager.loadSettings({
            musicVolume: this.backgroundMusicVolume,
            effectsVolume: this.soundEffectsVolume,
            isMuted: this.isAudioMuted,
        });
    }

    setupEventSubscriptions() {
        // Subscribe to collision events. The collision manager raises this only
        // for the asteroid/planet pair that was explicitly registered, so a
        // tap can no longer be scored against an unrelated planet.
        this.eventManager.subscribe('collision:asteroid_planet', (data) => {
            this.handleAsteroidPlanetCollision(data.asteroid, data.planet);
        });

        this.eventManager.subscribe('level:complete', () => {
            this.completeLevelSuccessfully();
        });

        // Centralized reaction to collisions - runs once at start-up
        if (window.EventBus) {
            EventBus.addEventListener('planet-hit', async ({ detail }) => {
                // Waiting for both animations/SFX to finish keeps everything in sync
                await Promise.all([
                    detail.planet.triggerExplosion(),
                    detail.asteroid.triggerExplosion(),
                ]);
            });
        }
    }

    handleAsteroidPlanetCollision(asteroid, planet) {
        console.log('Asteroid collided with planet:', asteroid.id, planet.id);

        // Get the actual DOM elements
        const planetElement = planet.element;

        // Collision point, expressed in the explosion container's coordinates.
        const explosionsContainer = document.querySelector(
            '.explosions-container',
        );
        const containerRect = explosionsContainer
            ? explosionsContainer.getBoundingClientRect()
            : { left: 0, top: 0 };
        // The planet's live rect is used rather than the collision manager's
        // cached position, which can be a frame stale.
        const impactRect = planetElement
            ? planetElement.getBoundingClientRect()
            : null;
        const x = impactRect
            ? impactRect.left + impactRect.width / 2 - containerRect.left
            : asteroid.x - containerRect.left;
        const y = impactRect
            ? impactRect.top + impactRect.height / 2 - containerRect.top
            : asteroid.y - containerRect.top;

        // Check if it's a G planet
        if (this.isCorrectLetter(planet.data.letter)) {
            this.handleCorrectCollision(
                planetElement,
                x,
                y,
                asteroid.id,
                planet.id,
            );
        } else {
            this.handleIncorrectCollision(planetElement, x, y, asteroid.id);
        }
    }

    handleCorrectCollision(planet, x, y, asteroidId, planetId) {
        if (!this.isGameplayActive) return;
        console.log('Correct collision!');

        // Create explosion at collision point
        this.createExplosionEffect(x, y);

        // Play sound effects
        this.audioManager.play('explosion');
        this.audioManager.play(
            `phoneme-${this.activeLetterLevel.toLowerCase()}`,
        );

        // Remove planet and asteroid from collision manager and DOM
        const asteroidObj = this.collisionManager.getObject(asteroidId);
        if (asteroidObj && asteroidObj.element) {
            this.disposeAsteroid(asteroidObj.element);
            asteroidObj.element.remove();
        }
        this.collisionManager.unregisterObject(asteroidId);
        this.collisionManager.unregisterObject(planetId);
        if (this.pendingAsteroidId === asteroidId) {
            this.pendingAsteroidId = null;
        }

        // Remove planet from DOM
        planet.remove();

        // Particle system effects
        if (this.particleSystem) {
            this.particleSystem.planetDestroyed(x, y);
        }

        // Streak, Score & Multiplier calculation
        this.currentStreak++;
        if (this.currentStreak > this.highestStreak) {
            this.highestStreak = this.currentStreak;
        }
        const streakMultiplier = Math.max(1, this.currentStreak);
        const points = 100 * streakMultiplier;
        this.gameScore += points;
        this.updateScoreDisplay();
        this.updateStreakUI();

        // Audio chime with ascending pitch
        if (this.audioManager && this.audioManager.playStreakChime) {
            this.audioManager.playStreakChime(this.currentStreak);
        }

        // Floating points popup at impact point
        const comboTag =
            this.currentStreak > 1 ? ` 🔥 x${this.currentStreak}` : '';
        this.showFloatingText(x, y, `+${points}${comboTag}`, 'score');

        // Warp speed visual effect for stellar streaks
        if (this.currentStreak >= 3) {
            this.triggerHyperspaceWarp();
        }

        // Capture current vocabulary word before incrementing index
        const hitWordItem =
            this.activeVocabulary[this.vocabularyIndex] ||
            this.activeVocabulary[0];
        this.vocabularyIndex =
            (this.vocabularyIndex + 1) % this.activeVocabulary.length;

        // Voice message and word image
        setTimeout(() => {
            this.playVocabularyAudio(hitWordItem);
            this.displayWordImage(hitWordItem);
        }, 500);

        // Update progress
        this.correctHits++;
        this.totalAnswersCount++;
        this.cumCorrect++;
        this.cumTotal++;
        this.updateAdaptiveDifficulty();
        this.saveStatsToLocalStorage();
        this.updateProgressDisplay();

        // Announce correct hit to screen readers
        this.announceToScreenReader(
            `Correct! You matched the letter ${this.activeLetterLevel}.`,
        );

        // Check if level complete
        if (this.correctHits >= this.totalHits) {
            this.isGameplayActive = false;
            setTimeout(() => {
                this.eventManager.emit('level:complete');
            }, 2000);
        }
    }

    handleIncorrectCollision(planet, x, y, asteroidId) {
        console.log('Incorrect collision');

        // Remove asteroid from collision manager and DOM
        const asteroidObj = this.collisionManager.getObject(asteroidId);
        if (asteroidObj && asteroidObj.element) {
            this.disposeAsteroid(asteroidObj.element);
            asteroidObj.element.remove();
        }
        this.collisionManager.unregisterObject(asteroidId);
        if (this.pendingAsteroidId === asteroidId) {
            this.pendingAsteroidId = null;
        }

        // Track stats for adaptive difficulty
        this.incorrectHitsCount++;
        this.totalAnswersCount++;
        this.cumIncorrect++;
        this.cumTotal++;
        this.updateAdaptiveDifficulty();
        this.saveStatsToLocalStorage();

        // Streak reset with gentle feedback
        if (this.currentStreak > 1) {
            this.showFloatingText(x, y, 'COMBO RESET! 💫', 'miss');
        } else {
            this.showFloatingText(x, y, 'TRY AGAIN! 💫', 'miss');
        }
        this.currentStreak = 0;
        this.updateStreakUI();

        if (this.audioManager && this.audioManager.playIncorrectSound) {
            this.audioManager.playIncorrectSound();
        }

        // Create smaller explosion or visual feedback
        if (this.particleSystem) {
            this.particleSystem.asteroidHit(x, y, false);
        }

        // Announce incorrect hit to screen readers
        this.announceToScreenReader('Oops! That was a distractor planet.');
    }

    /**
     * Toggle audio mute state
     */
    toggleAudioMute() {
        this.isAudioMuted = !this.isAudioMuted;
        const muteButton = document.getElementById('mute-toggle');
        muteButton.textContent = this.isAudioMuted ? '🔇' : '🔊';
        this.audioManager.toggleMute();

        // Show toast notification for feedback
        if (this.uiUtils) {
            this.uiUtils.showToast(
                this.isAudioMuted ? 'Audio muted' : 'Audio enabled',
                'info',
                2000,
            );
        }
    }

    /**
     * Toggle settings panel visibility
     */
    toggleSettingsPanel() {
        const panel = document.getElementById('settings-panel');
        const isOpening = !panel.classList.contains('active');

        if (isOpening) {
            panel.classList.remove('hidden');
            requestAnimationFrame(() => {
                panel.classList.add('active');
            });
            this.updateVoiceTemplateSelector();
            return;
        }

        panel.classList.remove('active');
        setTimeout(() => {
            if (!panel.classList.contains('active')) {
                panel.classList.add('hidden');
            }
        }, 300);
    }

    handleVoiceTemplateChange(templateId) {
        console.log('Voice template changed to:', templateId);

        // Update audio manager with new template
        if (this.audioManager.setVoiceTemplate(templateId)) {
            console.log('Voice template loaded successfully');
            this.updateVoiceTemplateSelector();
        } else {
            console.error('Failed to load voice template:', templateId);
        }
    }

    previewVoiceTemplate() {
        // Play a sample voice message to preview the current template
        const sampleWords = ['grape', 'goat', 'gold'];
        const randomWord =
            sampleWords[Math.floor(Math.random() * sampleWords.length)];

        console.log('Previewing voice template with word:', randomWord);
        this.audioManager.ensureLetterAudio('G').finally(() => {
            this.audioManager.play('voice-' + randomWord);
        });
    }

    updateVoiceTemplateSelector() {
        const selector = document.getElementById('voice-template-select');
        const currentTemplate = this.audioManager.getCurrentVoiceTemplate();
        selector.value = currentTemplate;
    }

    /**
     * Create animated elements for the welcome screen
     */
    createWelcomeScreenAnimations() {
        const planetsContainer = document.querySelector('.welcome-planets');
        const asteroidsContainer = document.querySelector('.welcome-asteroids');

        // Create floating planets with interactive hover effects
        for (let i = 1; i <= 4; i++) {
            const planet = document.createElement('div');
            planet.className = `welcome-planet welcome-planet-${i}`;

            // Enhanced hover effects
            planet.addEventListener('mouseenter', () => {
                planet.style.filter =
                    'drop-shadow(0 0 30px rgba(255, 255, 255, 0.8)) brightness(1.2)';
                planet.style.transform = 'scale(1.1)';
            });

            planet.addEventListener('mouseleave', () => {
                planet.style.filter =
                    'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))';
                planet.style.transform = 'scale(1)';
            });

            // Interactive click sparkle effect
            planet.addEventListener('click', () => {
                this.createSparkleEffect(planet);
            });

            planetsContainer.appendChild(planet);
        }

        // Create floating asteroids with hover effects
        for (let i = 1; i <= 6; i++) {
            const asteroid = document.createElement('div');
            asteroid.className = `welcome-asteroid welcome-asteroid-${i}`;

            asteroid.addEventListener('mouseenter', () => {
                asteroid.style.filter =
                    'drop-shadow(0 0 15px rgba(255, 255, 255, 0.6)) brightness(1.3)';
                asteroid.style.transform = 'scale(1.2)';
            });

            asteroid.addEventListener('mouseleave', () => {
                asteroid.style.filter =
                    'drop-shadow(0 0 10px rgba(255, 255, 255, 0.2))';
                asteroid.style.transform = 'scale(1)';
            });

            asteroid.addEventListener('click', () => {
                this.createSparkleEffect(asteroid);
            });

            asteroidsContainer.appendChild(asteroid);
        }
    }

    /**
     * Create sparkle particle effect at element position
     * @param {HTMLElement} element - Element to create sparkles around
     */
    createSparkleEffect(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Create 8 sparkle particles in a radial pattern
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'welcome-sparkle';
            sparkle.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: radial-gradient(circle, #fff, #ffd700);
                border-radius: 50%;
                left: ${centerX}px;
                top: ${centerY}px;
                pointer-events: none;
                z-index: 100;
                animation: sparkleOut 0.6s ease-out forwards;
            `;

            const angle = (i / 8) * Math.PI * 2;
            const distance = 50;
            sparkle.style.setProperty(
                '--dx',
                `${Math.cos(angle) * distance}px`,
            );
            sparkle.style.setProperty(
                '--dy',
                `${Math.sin(angle) * distance}px`,
            );

            document.body.appendChild(sparkle);

            // Cleanup after animation
            setTimeout(() => sparkle.remove(), 600);
        }
    }

    /**
     * Render the A-Z letter selection grid
     * Creates buttons for all letters with enabled/disabled states
     */
    renderLetterSelectionGrid() {
        const gridContainer = document.querySelector('.letter-grid');
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        // Clear existing buttons
        gridContainer.innerHTML = '';

        alphabet.split('').forEach((letter) => {
            const letterButton = document.createElement('button');
            const isDone = this.completedLevels.includes(letter);
            const isCurrent = letter === this.activeLetterLevel && !isDone;

            let stateClass;
            let stateLabel;
            if (isDone) {
                stateClass = 'letter-button done';
                stateLabel = ' - completed';
            } else if (isCurrent) {
                stateClass = 'letter-button current';
                stateLabel = ' - current level';
            } else {
                stateClass = 'letter-button available';
                stateLabel = ' - available';
            }

            letterButton.className = stateClass;
            letterButton.textContent = letter;
            letterButton.setAttribute('data-letter', letter);
            letterButton.setAttribute(
                'aria-label',
                `Letter ${letter}${stateLabel}`,
            );

            letterButton.addEventListener('click', () => {
                console.log(`📝 Letter ${letter} clicked`);
                this.handleLetterSelection(letter);
            });

            gridContainer.appendChild(letterButton);
        });
    }

    /**
     * Handle letter button click in level selection
     * @param {string} letter - The selected letter
     */
    handleLetterSelection(letter) {
        if (this.isLetterEnabled(letter)) {
            this.initializeLetterLevel(letter);
        } else {
            this.displayPopup('coming-soon-popup');
        }
    }

    /**
     * Initialize and start a letter level
     * @param {string} letter - The letter to start level for
     */
    async initializeLetterLevel(letter) {
        console.log(`🚀 Starting ${letter} level...`);
        this.activeLetterLevel = letter;
        this.activeVocabulary = this.letterVocabulary[letter];
        this.requiredHitsToComplete = this.activeVocabulary.length;
        this.syncLetterDisplays();
        this.audioManager.ensureLetterAudio(letter);
        this.displayOverlay('ready-overlay');

        // Show loading state with skeleton
        if (this.uiUtils) {
            this.uiUtils.showToast(
                `Loading letter ${letter} level...`,
                'info',
                2000,
            );
        }

        // Preload assets for this letter during loading screen
        if (this.performanceUtils) {
            await this.performanceUtils.preloadLetterImages(letter);
        }

        // Transition to gameplay after loading
        this.dismissOverlay('ready-overlay');
        this.navigateToScreen('gameplay');
        this.startGameplaySession();
    }

    // Legacy method for G level compatibility
    startGLevel() {
        this.initializeLetterLevel('G');
    }

    /**
     * Start a new gameplay session
     * Initializes particles, planets, and game state
     */
    startGameplaySession() {
        console.log('🎯 Initializing gameplay session...');
        this.resetGameplayState();
        this.isGameplayActive = true;
        this.correctHitsCount = 0;
        this.incorrectHitsCount = 0;
        this.totalAnswersCount = 0;
        this.vocabularyIndex = 0;
        this.updateProgressDisplay();
        // Collision detection is only needed while playing.
        if (this.collisionManager) {
            this.collisionManager.start();
        }
        // Initialize particle system for visual effects
        this.particleSystem = new ParticleSystem();
        this.particleSystem.createStarfield();
        if (this.displayManager) {
            this.displayManager.applyPerformanceProfile(this.particleSystem);
        }

        // Create planets if not already rendered
        if (!this.arePlanetsRendered) {
            this.renderGameplayPlanets();
            this.arePlanetsRendered = true;
        }
    }

    /**
     * Render target and distractor planets in the gameplay area
     * Creates interactive letter planets for the current level
     */
    renderGameplayPlanets() {
        console.log(
            `🪐 Creating planets (Speed Multiplier: ${this.difficultySpeedMultiplier}, Distractors: ${this.difficultyPlanetCount})...`,
        );
        const planetsContainer = document.querySelector('.planets-container');
        planetsContainer.innerHTML = '';

        // Drop the previous board from the collision registry before building
        // the new one. The innerHTML reset detaches those elements, and a
        // detached planet measures 0x0 at (0,0) while keeping its old radius,
        // so an asteroid spawning in the top-left corner could still "hit" a
        // ghost of a letter that is no longer being played.
        for (const id of Array.from(this.collisionManager.objects.keys())) {
            if (id.startsWith('planet-')) {
                this.collisionManager.unregisterObject(id);
            }
        }

        const letterLower = this.activeLetterLevel.toLowerCase();

        // One orbit radius per board, published to CSS so the planetOrbit
        // keyframes and the spawn bounds cannot disagree.
        const orbitRadius = this.computeOrbitRadius();
        document.documentElement.style.setProperty(
            '--orbit-radius',
            `${orbitRadius}px`,
        );

        // Dynamic speed based on adaptive difficulty
        const targetSpeed = 8 / this.difficultySpeedMultiplier;

        // Create target letter planets
        const letterCode = this.activeLetterLevel.charCodeAt(0) - 65;
        const themeNum = ((letterCode >= 0 ? letterCode : 0) % 6) + 1;

        for (let i = 0; i < this.activeVocabulary.length; i++) {
            const targetPlanet = document.createElement('div');
            targetPlanet.className = `planet target-planet planet-theme-${themeNum} ${letterLower}-planet`;
            targetPlanet.textContent = this.activeLetterLevel;
            targetPlanet.setAttribute('data-letter', this.activeLetterLevel);
            targetPlanet.setAttribute('data-index', i);
            // Expose the collision id so an asteroid can be bound to exactly
            // this planet instead of colliding with whichever planet it clips.
            targetPlanet.dataset.collisionId = `planet-${letterLower}-${i}`;
            targetPlanet.setAttribute(
                'aria-label',
                `Target planet with letter ${this.activeLetterLevel}`,
            );

            // Mount first; the board is laid out as a grid once every planet
            // exists (see the adjustPlanetPositions() call at the end).
            planetsContainer.appendChild(targetPlanet);

            // Staggered animation and dynamic speed
            targetPlanet.style.animation = `planetOrbit ${targetSpeed}s linear infinite, planetGlow 2s ease-in-out infinite alternate`;
            targetPlanet.style.animationDelay = `${Math.random() * 8}s`;

            targetPlanet.addEventListener('click', () => {
                console.log(`🎯 ${this.activeLetterLevel} planet ${i} clicked`);
                this.handlePlanetInteraction(
                    targetPlanet,
                    this.activeLetterLevel,
                );
            });

            // Register with collision detection system
            this.collisionManager.registerObject(
                `planet-${letterLower}-${i}`,
                targetPlanet,
                'planet',
                {
                    isStatic: false,
                    data: { letter: this.activeLetterLevel, index: i },
                },
            );
        }

        // Create distractor planets based on adaptive difficulty count
        const distractorLetters = this.shuffleLetters(
            this.enabledLetters.filter(
                (letter) => letter !== this.activeLetterLevel,
            ),
        ).slice(0, this.difficultyPlanetCount);

        const distractorSpeed = 12 / this.difficultySpeedMultiplier;

        distractorLetters.forEach((distractorLetter, i) => {
            const distractorPlanet = document.createElement('div');
            distractorPlanet.className = 'planet other-planet';

            distractorPlanet.textContent = distractorLetter;
            distractorPlanet.setAttribute('data-letter', distractorLetter);
            distractorPlanet.dataset.collisionId = `planet-other-${i}`;
            distractorPlanet.setAttribute(
                'aria-label',
                `Distractor planet with letter ${distractorLetter}`,
            );

            // Mount first; the board grid is applied after the loop.
            planetsContainer.appendChild(distractorPlanet);

            // Slower animation and dynamic speed
            distractorPlanet.style.animation = `planetOrbit ${distractorSpeed}s linear infinite, planetGlow 3s ease-in-out infinite alternate`;
            distractorPlanet.style.animationDelay = `${Math.random() * 12}s`;

            distractorPlanet.addEventListener('click', () => {
                console.log(`❌ Non-target planet ${distractorLetter} clicked`);
                this.handlePlanetInteraction(
                    distractorPlanet,
                    distractorLetter,
                );
            });

            // Register with collision detection
            this.collisionManager.registerObject(
                `planet-other-${i}`,
                distractorPlanet,
                'planet',
                {
                    isStatic: false,
                    data: { letter: distractorLetter, index: i },
                },
            );
        });

        // Shuffle planets in DOM container so target and distractor planets
        // are distributed unpredictably across grid slots rather than targets
        // always occupying the first 5 slots.
        const planetEls = Array.from(planetsContainer.children);
        for (let j = planetEls.length - 1; j > 0; j--) {
            const randIdx = Math.floor(Math.random() * (j + 1));
            planetsContainer.appendChild(planetEls[randIdx]);
            planetEls.splice(randIdx, 1);
        }

        // Lay the complete board out once. Per-planet random placement made
        // targets stack on short landscape screens; the grid keeps at least a
        // planet-sized gap between adjacent centres.
        this.adjustPlanetPositions();
    }

    /**
     * Release every timer and animation frame owned by an asteroid.
     *
     * The trail interval used to be cleared on one removal path only, so an
     * asteroid orphaned by a level reset or by another asteroid consuming its
     * planet kept emitting particles forever.
     *
     * @param {HTMLElement} asteroidElement
     */
    disposeAsteroid(asteroidElement) {
        if (!asteroidElement) return;

        if (asteroidElement.flightFrame) {
            cancelAnimationFrame(asteroidElement.flightFrame);
            asteroidElement.flightFrame = null;
        }

        if (asteroidElement.trailInterval) {
            clearInterval(asteroidElement.trailInterval);
            asteroidElement.trailInterval = null;
        }
    }

    /**
     * Handle planet click interaction
     * @param {HTMLElement} planetElement - The clicked planet element
     * @param {string} letter - The letter on the planet
     */
    handlePlanetInteraction(planetElement, letter) {
        if (!this.isGameplayActive) return;

        if (this.isCorrectLetter(letter)) {
            this.processCorrectPlanetHit(planetElement);
        } else {
            this.processIncorrectPlanetHit(planetElement);
        }
    }

    /**
     * Process a correct planet hit (target letter)
     * @param {HTMLElement} planetElement - The hit planet
     */
    processCorrectPlanetHit(planetElement) {
        console.log('✅ Correct hit!');

        const asteroidId = this.nextAsteroidId('fiery');
        const asteroidElement = this.spawnAsteroid(
            planetElement,
            'fiery',
            asteroidId,
        );
        if (!asteroidElement) return;

        // Create particle trail following asteroid
        if (this.particleSystem) {
            const trailInterval = setInterval(() => {
                if (asteroidElement && asteroidElement.parentNode) {
                    const asteroidRect =
                        asteroidElement.getBoundingClientRect();
                    const asteroidX =
                        asteroidRect.left + asteroidRect.width / 2;
                    const asteroidY =
                        asteroidRect.top + asteroidRect.height / 2;
                    this.particleSystem.asteroidTrail(
                        asteroidX,
                        asteroidY,
                        asteroidElement.velocity || { x: 2, y: 2 },
                    );
                } else {
                    clearInterval(trailInterval);
                    asteroidElement.trailInterval = null;
                }
            }, 50);
            asteroidElement.trailInterval = trailInterval;
        }
    }

    /**
     * Process an incorrect planet hit (distractor letter)
     * @param {HTMLElement} planetElement - The hit planet
     */
    processIncorrectPlanetHit(planetElement) {
        console.log('❌ Incorrect hit');

        const asteroidId = this.nextAsteroidId('dull');
        this.spawnAsteroid(planetElement, 'dull', asteroidId);
    }

    /**
     * Produce a collision-free asteroid identifier.
     *
     * `Date.now()` was used, so two taps inside the same millisecond produced
     * the same id: the second `registerObject` overwrote the first, leaving a
     * duplicate DOM id and unregistering the wrong object on impact.
     * @param {string} type
     * @returns {string}
     */
    nextAsteroidId(type) {
        this.asteroidSequence += 1;
        return `asteroid-${type}-${this.asteroidSequence}`;
    }

    /**
     * Spawn an asteroid that flies at a specific target planet.
     *
     * The asteroid is bound to the planet that was tapped: the collision
     * manager registers an explicit pair for it, so the score can no longer be
     * awarded for whichever unrelated planet the asteroid happened to clip.
     *
     * @param {HTMLElement} targetPlanetEl - the planet that was tapped
     * @param {string} asteroidType - 'fiery' or 'dull'
     * @param {string} asteroidId - unique identifier
     * @returns {HTMLElement|null} the created asteroid element
     */
    spawnAsteroid(targetPlanetEl, asteroidType, asteroidId) {
        const container = document.querySelector('.asteroids-container');
        if (!container) {
            console.error(
                'Cannot spawn asteroid: .asteroids-container missing',
            );
            return null;
        }

        // One tap means one pending hit. A previously launched asteroid is
        // cancelled, so a tap that happened several seconds earlier cannot
        // land after the child has moved on and score a second time.
        this.cancelPendingAsteroid();

        const containerRect = container.getBoundingClientRect();

        const asteroidElement = document.createElement('div');
        asteroidElement.className = `asteroid ${asteroidType}`;
        asteroidElement.id = asteroidId;

        // Calculate random starting position from a screen edge, expressed in
        // the container's coordinate space.
        const screenEdge = Math.floor(Math.random() * 4);
        let startX;
        let startY;

        switch (screenEdge) {
            case 0: // Top edge
                startX = Math.random() * containerRect.width;
                startY = -ASTEROID_SIZE;
                break;
            case 1: // Right edge
                startX = containerRect.width + ASTEROID_SIZE;
                startY = Math.random() * containerRect.height;
                break;
            case 2: // Bottom edge
                startX = Math.random() * containerRect.width;
                startY = containerRect.height + ASTEROID_SIZE;
                break;
            default: // Left edge
                startX = -ASTEROID_SIZE;
                startY = Math.random() * containerRect.height;
                break;
        }

        asteroidElement.style.left = `${startX}px`;
        asteroidElement.style.top = `${startY}px`;

        container.appendChild(asteroidElement);

        // Calculate the initial trajectory for the particle trail. Guard the
        // division: a zero-length vector would poison the trail with NaN.
        const targetCenter = this.getPlanetCenterInContainer(
            targetPlanetEl,
            containerRect,
        );
        const deltaX = targetCenter.x - (startX + ASTEROID_SIZE / 2);
        const deltaY = targetCenter.y - (startY + ASTEROID_SIZE / 2);
        const distanceSquared = deltaX * deltaX + deltaY * deltaY;
        const inverseDistance =
            distanceSquared > 1e-8 ? 1 / Math.sqrt(distanceSquared) : 0;

        const velocity = {
            x: deltaX * inverseDistance * 10,
            y: deltaY * inverseDistance * 10,
        };
        asteroidElement.velocity = velocity;

        // Register with the collision detection system
        this.collisionManager.registerObject(
            asteroidId,
            asteroidElement,
            'asteroid',
            {
                velocity: velocity,
                isStatic: false,
                data: {
                    type: asteroidType,
                    targetId: targetPlanetEl.dataset.collisionId || null,
                },
            },
        );

        // Bind the asteroid to the planet that was tapped.
        const targetId = targetPlanetEl.dataset.collisionId;
        if (targetId) {
            this.collisionManager.registerCollisionPair(
                asteroidId,
                targetId,
                (asteroid, planet, phase) => {
                    if (phase !== 'start') return;
                    this.eventManager.emit('collision:asteroid_planet', {
                        asteroid: asteroid,
                        planet: planet,
                    });
                },
            );
        }

        // Launch the homing flight.
        this.launchAsteroid(asteroidElement, targetPlanetEl, containerRect);
        this.pendingAsteroidId = asteroidId;

        return asteroidElement;
    }

    /**
     * Cancel an asteroid that is still in flight.
     *
     * Without this, a tap from several seconds ago could still land and
     * register a second answer for a single interaction.
     */
    cancelPendingAsteroid() {
        if (!this.pendingAsteroidId) return;

        const asteroid = this.collisionManager.getObject(
            this.pendingAsteroidId,
        );
        if (asteroid && asteroid.element) {
            this.disposeAsteroid(asteroid.element);
            asteroid.element.remove();
        }
        this.collisionManager.unregisterObject(this.pendingAsteroidId);
        this.pendingAsteroidId = null;
    }

    /**
     * The centre of a planet element, expressed in the container's coordinates.
     * @param {HTMLElement} planetElement
     * @param {DOMRect} containerRect
     * @returns {{x: number, y: number}}
     */
    getPlanetCenterInContainer(planetElement, containerRect) {
        const planetRect = planetElement.getBoundingClientRect();
        return {
            x: planetRect.left + planetRect.width / 2 - containerRect.left,
            y: planetRect.top + planetRect.height / 2 - containerRect.top,
        };
    }

    /**
     * Resolve the hit between an asteroid and the planet it was aimed at.
     *
     * The collision manager's geometric check remains as a backstop, but the
     * hit is registered here because the flight loop knows precisely when
     * the asteroid reaches the planet — the geometric check only samples it,
     * and a fast asteroid can cross the overlap between two samples.
     *
     * @param {HTMLElement} asteroidElement
     * @param {HTMLElement} targetPlanetEl
     */
    resolveAsteroidHit(asteroidElement, targetPlanetEl) {
        const asteroid = this.collisionManager.getObject(asteroidElement.id);
        const planetId = targetPlanetEl.dataset.collisionId;
        const planet = planetId
            ? this.collisionManager.getObject(planetId)
            : null;

        if (!asteroid || !planet) return;

        this.eventManager.emit('collision:asteroid_planet', {
            asteroid: asteroid,
            planet: planet,
        });
    }

    /**
     * Fly an asteroid toward a moving target planet.
     *
     * Planets are animated along a 200px orbit by the `planetOrbit` keyframes,
     * so a destination sampled at click time is stale by the time a fixed
     * duration flight arrives: the asteroid parked beside the planet, the
     * planet never came close enough to collide, and the score depended on a
     * coincidental encounter with some other planet. The asteroid now re-aims
     * at the planet's live position on every frame.
     *
     * @param {HTMLElement} asteroidElement
     * @param {HTMLElement} targetPlanetEl
     * @param {DOMRect} containerRect
     */
    launchAsteroid(asteroidElement, targetPlanetEl, containerRect) {
        let posX = parseFloat(asteroidElement.style.left) || 0;
        let posY = parseFloat(asteroidElement.style.top) || 0;
        const startTime = performance.now();
        let lastTime = startTime;
        let locked = false;

        const step = () => {
            if (!asteroidElement.parentNode) {
                asteroidElement.flightFrame = null;
                return;
            }

            // The target planet may have been destroyed by another asteroid.
            if (!targetPlanetEl.isConnected) {
                asteroidElement.flightFrame = null;
                return;
            }

            const now = performance.now();
            // Clamp dt: a backgrounded tab produces multi-second gaps.
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;
            // The flight deadline is measured in real time, not in clamped
            // physics time, so a slow device does not stretch the wait.
            const elapsed = (now - startTime) / 1000;

            const target = this.getPlanetCenterInContainer(
                targetPlanetEl,
                containerRect,
            );

            const centerX = posX + ASTEROID_SIZE / 2;
            const centerY = posY + ASTEROID_SIZE / 2;
            const dx = target.x - centerX;
            const dy = target.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (locked) {
                // Stay with the planet. Parking at a fixed coordinate was not
                // enough: the planet keeps orbiting, so the asteroid drifted
                // away from it again and the hit was never registered.
                posX = target.x - ASTEROID_SIZE / 2;
                posY = target.y - ASTEROID_SIZE / 2;
            } else {
                const stepDistance = ASTEROID_SPEED_PX_PER_SEC * dt;

                if (
                    distance <= Math.max(stepDistance, 1) ||
                    elapsed >= MAX_ASTEROID_FLIGHT_SECONDS
                ) {
                    locked = true;
                    posX = target.x - ASTEROID_SIZE / 2;
                    posY = target.y - ASTEROID_SIZE / 2;

                    // The asteroid has reached its target: resolve the hit
                    // here. Leaving it to the collision manager meant the hit
                    // depended on its sampling rate catching a fast moving
                    // object between two frames.
                    if (!asteroidElement.hitResolved) {
                        asteroidElement.hitResolved = true;
                        this.resolveAsteroidHit(
                            asteroidElement,
                            targetPlanetEl,
                        );
                    }
                } else {
                    posX += (dx / distance) * stepDistance;
                    posY += (dy / distance) * stepDistance;
                }
            }

            asteroidElement.style.left = `${posX}px`;
            asteroidElement.style.top = `${posY}px`;

            asteroidElement.flightFrame = requestAnimationFrame(step);
        };

        asteroidElement.flightFrame = requestAnimationFrame(step);
    }

    /**
     * Create visual explosion effect at coordinates
     * @param {number} x - X coordinate for explosion center
     * @param {number} y - Y coordinate for explosion center
     */
    createExplosionEffect(x, y) {
        const explosionElement = document.createElement('div');
        explosionElement.className = 'explosion';
        explosionElement.style.left = `${x - 75}px`;
        explosionElement.style.top = `${y - 75}px`;

        document
            .querySelector('.explosions-container')
            .appendChild(explosionElement);

        // Create enhanced particle explosion
        if (this.particleSystem) {
            this.particleSystem.createEnhancedExplosion(x, y, 1.5);
        }

        // Trigger screen shake for impact feedback
        this.triggerScreenShake();

        // Cleanup explosion element after animation
        setTimeout(() => {
            if (explosionElement.parentNode) {
                explosionElement.remove();
            }
        }, 800);
    }

    /**
     * Trigger screen shake effect for impact feedback
     */
    triggerScreenShake() {
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            gameArea.style.animation = 'screenShake 0.3s ease-in-out';
            setTimeout(() => {
                gameArea.style.animation = '';
            }, 300);
        }
    }

    /**
     * Play voice message for current vocabulary word
     * @param {Object|string} [item] - Vocabulary item for the hit
     */
    playVocabularyAudio(item = null) {
        const vocabularyItem =
            item || this.activeVocabulary[this.vocabularyIndex];

        // Handle both legacy string format and new object format
        let word, letter, audioKey;
        if (typeof vocabularyItem === 'string') {
            word = vocabularyItem;
            letter = 'G';
            audioKey = `voice-${word}`;
        } else if (vocabularyItem) {
            word = vocabularyItem.word;
            letter = vocabularyItem.letter;
            audioKey = vocabularyItem.audioKey;
        }

        if (audioKey) {
            this.audioManager.play(audioKey);
        }

        // Advance index only if caller did not supply a pre-captured item
        if (!item) {
            this.vocabularyIndex =
                (this.vocabularyIndex + 1) % this.activeVocabulary.length;
        }
    }

    /**
     * Display word image in the background
     * @param {Object|string} [item] - Vocabulary item for the hit
     */
    displayWordImage(item = null) {
        const vocabularyItem =
            item ||
            this.activeVocabulary[this.vocabularyIndex] ||
            this.activeVocabulary[0];
        const wordBackground = document.querySelector('.word-background');

        // Handle both legacy string format and new object format
        let word, letter;
        if (typeof vocabularyItem === 'string') {
            word = vocabularyItem;
            letter = 'G';
        } else {
            word = vocabularyItem.word;
            letter = vocabularyItem.letter;
        }

        // Show loading state
        wordBackground.classList.add('loading');
        wordBackground.classList.remove('word-text');
        wordBackground.textContent = '';
        wordBackground.style.display = '';
        wordBackground.style.alignItems = '';
        wordBackground.style.justifyContent = '';
        wordBackground.style.textAlign = '';
        wordBackground.style.color = '';
        wordBackground.style.fontSize = '';
        wordBackground.style.fontWeight = '';
        wordBackground.style.padding = '';

        // Candidate URLs, most preferred first. The previous code built
        // `Assets/images/...`, which only resolves on the Vite dev server and
        // 404s in every production build.
        const candidates = imagePathCandidates(letter, word);

        // Check if image is cached. The cache stores the URL that actually
        // loaded, which is not necessarily the first candidate.
        if (this.performanceUtils && this.performanceUtils.getCachedImage) {
            const cached = this.performanceUtils.getCachedImage(letter, word);
            if (
                cached &&
                cached.image &&
                cached.image.complete &&
                cached.image.naturalWidth > 0
            ) {
                wordBackground.style.backgroundImage = `url('${cached.url}')`;
                wordBackground.classList.remove('loading');
                wordBackground.classList.add('visible');
                this.scheduleImageHide(wordBackground);
                return;
            }
        }

        // Load the first candidate that resolves.
        loadFirstAvailableImage(candidates).then((result) => {
            if (!result) {
                this.showWordTextFallback(wordBackground, letter, word);
                return;
            }

            wordBackground.textContent = '';
            wordBackground.style.backgroundImage = `url('${result.url}')`;
            wordBackground.classList.remove('loading');
            wordBackground.classList.add('visible');
            this.scheduleImageHide(wordBackground);
        });
    }

    /**
     * Render the word as text when no picture asset is available.
     * @param {HTMLElement} wordBackground
     * @param {string} letter
     * @param {string} word
     */
    showWordTextFallback(wordBackground, letter, word) {
        wordBackground.style.backgroundImage = 'none';
        wordBackground.textContent = `${letter} is for ${word}`;
        wordBackground.style.display = 'flex';
        wordBackground.style.alignItems = 'center';
        wordBackground.style.justifyContent = 'center';
        wordBackground.style.textAlign = 'center';
        wordBackground.style.color = '#ffffff';
        wordBackground.style.fontSize = 'clamp(1.8rem, 4vw, 3.25rem)';
        wordBackground.style.fontWeight = '700';
        wordBackground.style.padding = '1.5rem';
        wordBackground.classList.remove('loading');
        // Text must be fully legible: the picture panel is deliberately
        // translucent so the planets stay readable behind it.
        wordBackground.classList.add('word-text');
        wordBackground.classList.add('visible');
        this.scheduleImageHide(wordBackground);
    }

    /**
     * Schedule hiding of word image after delay
     * @param {HTMLElement} wordBackground - Word background element
     */
    scheduleImageHide(wordBackground) {
        if (this.imageHideTimeout) {
            clearTimeout(this.imageHideTimeout);
            this.imageHideTimeout = null;
        }
        this.imageHideTimeout = setTimeout(() => {
            this.imageHideTimeout = null;
            wordBackground.classList.remove('visible');
            wordBackground.classList.remove('loading');
            wordBackground.textContent = '';
            wordBackground.style.backgroundImage = '';
            wordBackground.style.display = '';
            wordBackground.style.alignItems = '';
            wordBackground.style.justifyContent = '';
            wordBackground.style.textAlign = '';
            wordBackground.style.color = '';
            wordBackground.style.fontSize = '';
            wordBackground.style.fontWeight = '';
            wordBackground.style.padding = '';
        }, 3000);
    }

    /**
     * Update progress bar and counter display
     */
    updateProgressDisplay() {
        const progressFillElement = document.getElementById('progress-fill');
        const hitsCounterElement = document.getElementById('hits-counter');
        const progressBarElement = document.querySelector('.progress-bar');

        const progressPercentage =
            (this.correctHitsCount / this.requiredHitsToComplete) * 100;
        // The fill is scaled by the compositor (scaleX) rather than by
        // animating `width`, which forced a layout pass every frame.
        progressFillElement.style.setProperty(
            '--progress',
            String(Math.max(0, Math.min(1, progressPercentage / 100))),
        );
        hitsCounterElement.textContent = this.correctHitsCount;
        if (progressBarElement) {
            progressBarElement.setAttribute(
                'aria-valuemax',
                String(this.requiredHitsToComplete),
            );
            progressBarElement.setAttribute(
                'aria-valuenow',
                String(this.correctHitsCount),
            );
            progressBarElement.setAttribute(
                'aria-valuetext',
                `${this.correctHitsCount} of ${this.requiredHitsToComplete} hits`,
            );
        }
        this.syncLetterDisplays();
    }

    /**
     * Sync the active letter across the gameplay HUD.
     *
     * The level-complete popup is NOT touched here: it names the letter that
     * was completed, which is a different value from the active letter once
     * the progression pointer has moved on.
     *
     * @param {string} [completedLetter] - when given, also written to the
     *   level-complete popup.
     */
    syncLetterDisplays(completedLetter = null) {
        const hudIds = ['active-letter-display', 'ready-letter-display'];
        hudIds.forEach((elementId) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = this.activeLetterLevel;
            }
        });

        if (completedLetter) {
            const completionElement = document.getElementById(
                'level-complete-letter',
            );
            if (completionElement) {
                completionElement.textContent = completedLetter;
            }
        }
    }

    /**
     * Handle level completion
     */
    completeLevelSuccessfully() {
        console.log('🎉 Level complete!');

        // Capture the letter that was actually completed BEFORE advancing the
        // progression pointer. Advancing first made the popup header and the
        // screen-reader announcement name the NEXT letter.
        const completedLetter = this.activeLetterLevel;

        this.isGameplayActive = false;
        this.audioManager.play('celebration');

        // Track completed level
        if (!this.completedLevels.includes(completedLetter)) {
            this.completedLevels.push(completedLetter);
        }

        // Update the progress display using the completed letter.
        this.renderLetterSelectionGrid();
        this.syncLetterDisplays(completedLetter);
        this.updateProgressDisplay();

        // Save state and update difficulty
        this.updateAdaptiveDifficulty();
        this.saveStatsToLocalStorage();

        // Create celebration particle effects
        if (this.particleSystem) {
            this.particleSystem.levelComplete();
        }

        // Calculate star rating (1 to 3 stars based on accuracy)
        const total = this.correctHitsCount + this.incorrectHitsCount;
        const accuracy = total > 0 ? this.correctHitsCount / total : 1;
        const starCount = accuracy >= 0.8 ? 3 : accuracy >= 0.5 ? 2 : 1;

        const starsContainer = document.getElementById('level-stars');
        if (starsContainer) {
            starsContainer.className = `level-stars stars-earned-${starCount}`;
        }
        const finalScoreEl = document.getElementById('final-score');
        if (finalScoreEl) {
            finalScoreEl.textContent = this.gameScore;
        }

        if (this.audioManager && this.audioManager.playVictoryFanfare) {
            this.audioManager.playVictoryFanfare();
        }
        this.triggerHyperspaceWarp(2200);

        // Show success toast
        if (this.uiUtils) {
            this.uiUtils.showToast(
                'Level Complete! Great job!',
                'success',
                3000,
            );
        }

        // Announce to screen readers
        this.announceToScreenReader(
            `Fantastic! You completed the mission for letter ${completedLetter}!`,
        );

        this.displayPopup('level-complete-popup');

        // Advance the progression pointer to the next uncompleted letter
        // (no-op / stays put when all letters are complete → free practice).
        this.advanceToNextLetter();
        this.syncLetterDisplays();
    }

    navigateToScreen(screenId) {
        console.log(`🔄 Navigating to screen: ${screenId}`);

        // Get current and target screens
        const currentScreenElement = document.querySelector('.screen.active');
        const targetScreenElement = document.getElementById(
            `${screenId}-screen`,
        );

        // Already on this screen and its side effects have run: do nothing.
        // (The check on `hasAppliedScreen` matters for the initial route,
        // where the model starts on 'welcome' but the "entered" side effects —
        // background music and the gameplay reset — still have to run once.)
        if (
            this.currentScreen === screenId &&
            this.hasAppliedScreen &&
            currentScreenElement === targetScreenElement
        ) {
            console.log(`Already on screen: ${screenId}, skipping navigation`);
            return;
        }

        // Focus the new screen for accessibility (WCAG focus routing)
        if (targetScreenElement) {
            targetScreenElement.setAttribute('tabindex', '-1');
            targetScreenElement.focus();
        }

        // Commit the screen state together with the DOM. Setting
        // `currentScreen` immediately made the model disagree with the DOM for
        // the whole 600ms transition.
        const transitionSeq = (this._transitionSeq =
            (this._transitionSeq || 0) + 1);
        const commit = () => {
            if (this._transitionSeq !== transitionSeq) return;
            this.currentScreen = screenId;
            this.hasAppliedScreen = true;
            this.onScreenTransitionComplete(screenId);
        };

        const canTransition =
            this.uiUtils &&
            currentScreenElement &&
            targetScreenElement &&
            currentScreenElement !== targetScreenElement;

        // Use smooth transition if UI utilities available
        if (canTransition) {
            this.uiUtils.transitionScreens(
                currentScreenElement,
                targetScreenElement,
                commit,
            );
        } else {
            // Fallback to immediate transition
            document.querySelectorAll('.screen').forEach((screen) => {
                screen.classList.remove('active');
            });
            if (targetScreenElement) {
                targetScreenElement.classList.add('active');
            }
            commit();
        }
    }

    /**
     * Handle post-transition actions for each screen
     * @param {string} screenId - The screen that was transitioned to
     */
    onScreenTransitionComplete(screenId) {
        if (screenId === 'welcome') {
            this.audioManager.play('background-music');
            this.resetGameplayState();
        } else {
            this.audioManager.stop('background-music');
        }

        // The collision loop only needs to run during gameplay. It used to
        // run for the whole session, including on the welcome screen.
        if (this.collisionManager) {
            if (screenId === 'gameplay') {
                this.collisionManager.start();
            } else {
                this.collisionManager.stop();
            }
        }

        // Announce screen change for screen readers
        this.announceToScreenReader(
            `Space mission screen loaded: ${screenId}.`,
        );
    }

    /**
     * Display an overlay
     * @param {string} overlayId - The overlay element ID
     */
    displayOverlay(overlayId) {
        console.log(`📋 Showing overlay: ${overlayId}`);
        const overlay = document.getElementById(overlayId);
        overlay.classList.remove('hidden');

        // Animate entrance
        if (this.uiUtils) {
            this.uiUtils.animateEntrance(
                overlay.querySelector('.overlay-content'),
                'scaleIn',
            );
        }
    }

    /**
     * Dismiss an overlay
     * @param {string} overlayId - The overlay element ID
     */
    dismissOverlay(overlayId) {
        console.log(`📋 Hiding overlay: ${overlayId}`);
        document.getElementById(overlayId).classList.add('hidden');
    }

    /**
     * Display a popup modal
     * @param {string} popupId - The popup element ID
     */
    displayPopup(popupId) {
        console.log(`💬 Showing popup: ${popupId}`);
        const popup = document.getElementById(popupId);
        if (!popup) return;
        popup.classList.remove('hidden');

        // Animate popup content entrance
        if (this.uiUtils) {
            this.uiUtils.animateEntrance(
                popup.querySelector('.popup-content'),
                'scaleIn',
            );
        }
    }

    /**
     * Dismiss a popup modal
     * @param {string} popupId - The popup element ID
     */
    dismissPopup(popupId) {
        console.log(`💬 Hiding popup: ${popupId}`);
        document.getElementById(popupId).classList.add('hidden');
    }

    /**
     * Reset gameplay state for new game
     */
    resetGameplayState() {
        console.log('🔄 Resetting game state...');
        this.correctHitsCount = 0;
        this.vocabularyIndex = 0;
        this.isGameplayActive = false;
        this.arePlanetsRendered = false;

        if (this.imageHideTimeout) {
            clearTimeout(this.imageHideTimeout);
            this.imageHideTimeout = null;
        }

        const wordBackground = document.querySelector('.word-background');
        if (wordBackground) {
            wordBackground.classList.remove('visible');
            wordBackground.classList.remove('loading');
            wordBackground.textContent = '';
            wordBackground.style.backgroundImage = '';
        }

        // Clear collision detection registry
        this.collisionManager.clear();

        // Cleanup particle system
        if (this.particleSystem) {
            this.particleSystem.destroy();
            this.particleSystem = null;
        }

        // Clear game containers
        const containers = [
            '.planets-container',
            '.asteroids-container',
            '.explosions-container',
        ];
        containers.forEach((selector) => {
            const container = document.querySelector(selector);
            if (container) {
                // Release timers/animation frames owned by any live asteroid
                // before the DOM is wiped.
                if (container.classList.contains('asteroids-container')) {
                    container
                        .querySelectorAll('.asteroid')
                        .forEach((asteroid) => this.disposeAsteroid(asteroid));
                }
                container.innerHTML = '';
            }
        });

        // Reset UI elements
        this.currentStreak = 0;
        this.updateStreakUI();
        this.updateProgressDisplay();
        // The mission score is a per-level figure: it is shown next to the
        // per-level hit counter and reported as the level's result in the
        // completion popup. It was initialised once and only ever
        // incremented, so a new letter started with the previous letter's
        // score still on screen.
        this.gameScore = 0;
        this.updateScoreDisplay();
        const floatingContainer = document.getElementById(
            'floating-text-container',
        );
        if (floatingContainer) {
            floatingContainer.innerHTML = '';
        }
        const wordBg = document.querySelector('.word-background');
        if (wordBg) {
            wordBg.classList.remove('visible');
        }
    }

    /**
     * Show floating animated feedback text at coordinate (x, y)
     * @param {number} x
     * @param {number} y
     * @param {string} text
     * @param {'score'|'miss'|'combo'} type
     */
    showFloatingText(x, y, text, type = 'score') {
        const container =
            document.getElementById('floating-text-container') ||
            document.querySelector('.game-area');
        if (!container) return;

        const el = document.createElement('div');
        el.className = `floating-text ${type}`;
        el.textContent = text;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        container.appendChild(el);

        setTimeout(() => {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        }, 1100);
    }

    /**
     * Update streak badge with dynamic animations and hype labels
     */
    updateStreakUI() {
        const streakBanner = document.getElementById('streak-banner');
        if (!streakBanner) return;

        if (this.currentStreak >= 2) {
            let label = 'COMBO!';
            if (this.currentStreak >= 5) label = 'GALACTIC!';
            else if (this.currentStreak >= 4) label = 'MEGA!';
            else if (this.currentStreak >= 3) label = 'SUPER!';

            streakBanner.innerHTML = `🔥 <span id="streak-count">${this.currentStreak}x</span> ${label}`;
            streakBanner.classList.remove('hidden');
            streakBanner.classList.add('pulse');
        } else {
            streakBanner.classList.add('hidden');
            streakBanner.classList.remove('pulse');
        }
    }

    /**
     * Update live mission score display with punchy bump effect
     */
    updateScoreDisplay() {
        const scoreEl = document.getElementById('game-score');
        if (scoreEl) {
            scoreEl.textContent = this.gameScore;
            scoreEl.classList.add('bump');
            setTimeout(() => scoreEl.classList.remove('bump'), 250);
        }
    }

    /**
     * Trigger hyperspace warp speed star trail effect
     * @param {number} duration ms
     */
    triggerHyperspaceWarp(duration = 1200) {
        const bg = document.querySelector('.galaxy-background');
        if (!bg) return;
        bg.classList.add('warp-speed');
        setTimeout(() => {
            bg.classList.remove('warp-speed');
        }, duration);
    }

    /**
     * Check if a letter is enabled for play
     * @param {string} letter - The letter to check
     * @returns {boolean} Whether the letter is enabled
     */
    isLetterEnabled(letter) {
        return this.enabledLetters.includes(letter);
    }

    /**
     * Check if a letter matches the current active level letter
     * @param {string} letter - The letter to check
     * @returns {boolean} True if the letter matches the active level
     */
    isCorrectLetter(letter) {
        return letter === this.activeLetterLevel;
    }

    /**
     * Return the first A-Z letter not yet completed, or null when all done.
     * @returns {string|null}
     */
    getNextUncompletedLetter() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (const letter of alphabet) {
            if (!this.completedLevels.includes(letter)) {
                return letter;
            }
        }
        return null;
    }

    /**
     * Advance the active letter to the next uncompleted one.
     * When all letters are complete, the pointer stays (free-practice mode).
     */
    advanceToNextLetter() {
        const next = this.getNextUncompletedLetter();
        if (next) {
            this.activeLetterLevel = next;
        }
    }

    shuffleLetters(letters) {
        const shuffled = letters.slice();

        for (let i = shuffled.length - 1; i > 0; i--) {
            const swapIndex = Math.floor(Math.random() * (i + 1));
            const current = shuffled[i];
            shuffled[i] = shuffled[swapIndex];
            shuffled[swapIndex] = current;
        }

        return shuffled;
    }

    // Expose letterWords for backward compatibility
    get letterWords() {
        return this.letterVocabulary;
    }

    announceToScreenReader(message) {
        const announcer = document.getElementById('game-announcer');
        if (announcer) {
            announcer.textContent = message;
        }
    }

    loadSavedStats() {
        try {
            const savedData = localStorage.getItem('phonics_fun_stats');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                this.completedLevels = Array.isArray(parsed?.completedLevels)
                    ? parsed.completedLevels
                    : [];
                this.correctHitsCount = parsed.correctHitsCount || 0;
                this.incorrectHitsCount = parsed.incorrectHitsCount || 0;
                this.totalAnswersCount = parsed.totalAnswersCount || 0;
                this.cumCorrect = parsed.cumCorrect || 0;
                this.cumIncorrect = parsed.cumIncorrect || 0;
                this.cumTotal = parsed.cumTotal || 0;
                this.updateAdaptiveDifficulty();

                // If active letter is already completed, advance to next uncompleted letter
                if (this.completedLevels.includes(this.activeLetterLevel)) {
                    this.advanceToNextLetter();
                }
            }
        } catch (e) {
            console.error('Failed to load stats from localStorage:', e);
        }
    }

    saveStatsToLocalStorage() {
        try {
            const stats = {
                completedLevels: this.completedLevels,
                correctHitsCount: this.correctHitsCount,
                incorrectHitsCount: this.incorrectHitsCount,
                totalAnswersCount: this.totalAnswersCount,
                cumCorrect: this.cumCorrect,
                cumIncorrect: this.cumIncorrect,
                cumTotal: this.cumTotal,
            };
            localStorage.setItem('phonics_fun_stats', JSON.stringify(stats));
        } catch (e) {
            console.error('Failed to save stats to localStorage:', e);
        }
    }

    updateAdaptiveDifficulty() {
        if (this.totalAnswersCount === 0) {
            this.difficultySpeedMultiplier = 1.0;
            this.difficultyPlanetCount = 3;
            return;
        }

        const accuracy = this.correctHitsCount / this.totalAnswersCount;
        console.log(
            `📊 Accuracy is: ${(accuracy * 100).toFixed(1)}% (${this.correctHitsCount}/${this.totalAnswersCount})`,
        );

        if (accuracy >= 0.85) {
            this.difficultySpeedMultiplier = 1.25;
            this.difficultyPlanetCount = 4;
            console.log(
                '⚡ Adaptive Difficulty: Hard (faster planets, more distractors)',
            );
        } else if (accuracy <= 0.6) {
            this.difficultySpeedMultiplier = 0.8;
            this.difficultyPlanetCount = 2;
            console.log(
                '🐢 Adaptive Difficulty: Easy (slower planets, fewer distractors)',
            );
        } else {
            this.difficultySpeedMultiplier = 1.0;
            this.difficultyPlanetCount = 3;
            console.log('⚖️ Adaptive Difficulty: Normal');
        }
    }

    exportTeacherData() {
        const stats = {
            sessionId:
                this.sessionId || Math.random().toString(36).substring(2, 9),
            exportTimestamp: new Date().toISOString(),
            correctHits: this.cumCorrect + this.correctHitsCount,
            incorrectHits: this.cumIncorrect + this.incorrectHitsCount,
            accuracy:
                this.cumTotal + this.totalAnswersCount > 0
                    ? (
                          (this.cumCorrect + this.correctHitsCount) /
                          (this.cumTotal + this.totalAnswersCount)
                      ).toFixed(2)
                    : '1.00',
            completedLevels: Array.from(new Set(this.completedLevels || [])),
            difficultySpeedMultiplier: this.difficultySpeedMultiplier,
            difficultyPlanetCount: this.difficultyPlanetCount,
        };

        try {
            const dataStr =
                'data:text/json;charset=utf-8,' +
                encodeURIComponent(JSON.stringify(stats, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', dataStr);
            downloadAnchor.setAttribute(
                'download',
                `phonics-fun-progress-${stats.sessionId}.json`,
            );
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();

            this.announceToScreenReader(
                'Progress report downloaded successfully.',
            );
            if (this.uiUtils) {
                this.uiUtils.showToast(
                    'Progress report downloaded!',
                    'success',
                    3000,
                );
            }
        } catch (e) {
            console.error('Failed to export progress data:', e);
            if (this.uiUtils) {
                this.uiUtils.showToast(
                    'Failed to export progress data',
                    'error',
                    3000,
                );
            }
        }

        return stats;
    }
}

// Global error handling with enhanced logging
window.addEventListener('error', (e) => {
    console.error('🚨 Game error:', e.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
});

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, initializing Phonics Fun...');
    try {
        window.game = new GameState();
    } catch (error) {
        // A failure here used to leave a blank screen with no explanation.
        console.error('🚨 Game failed to start:', error);
        const announcer = document.getElementById('game-announcer');
        if (announcer) {
            announcer.textContent =
                'The game could not start. Please reload the page.';
        }
        document.body.dataset.bootError = 'true';
    }
});
window.GameState = GameState;

// Exported for tests and for any future module that needs the controller.
// Previously the class was only reachable through the `window` global.
export { GameState };

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
import { debounce } from './utils.js';

const PHONICS_FUN_LETTER_DATA = Object.freeze({
    A: ['apple', 'ant', 'airplane', 'alligator', 'arrow'],
    B: ['ball', 'bat', 'bear', 'boat', 'butterfly'],
    C: ['cat', 'car', 'cake', 'cloud', 'crab'],
    D: ['dog', 'duck', 'drum', 'dinosaur', 'door'],
    E: ['elephant', 'egg', 'engine', 'elbow', 'earth'],
    F: ['fish', 'frog', 'flower', 'feather', 'firetruck'],
    G: ['grape', 'goat', 'gold', 'girl', 'grandpa'],
    H: ['hat', 'hen', 'house', 'helicopter', 'hippo'],
    I: ['igloo', 'insect', 'icecream', 'island', 'ink'],
    J: ['jellyfish', 'jam', 'jet', 'jacket', 'jungle'],
    K: ['kite', 'kangaroo', 'key', 'kitten', 'kettle'],
    L: ['lion', 'lamp', 'leaf', 'ladder', 'lemon'],
    M: ['moon', 'monkey', 'milk', 'mountain', 'mouse'],
    N: ['nest', 'nose', 'net', 'night', 'noodles'],
    O: ['octopus', 'orange', 'owl', 'ocean', 'oven'],
    P: ['pig', 'pen', 'pizza', 'planet', 'pumpkin'],
    Q: ['queen', 'quilt', 'quail', 'quarter', 'question'],
    R: ['rabbit', 'rainbow', 'robot', 'rocket', 'rose'],
    S: ['sun', 'snake', 'star', 'sock', 'sandwich'],
    T: ['tiger', 'train', 'tree', 'turtle', 'toothbrush'],
    U: ['umbrella', 'unicorn', 'up', 'urn', 'ukulele'],
    V: ['van', 'vase', 'vegetable', 'violin', 'volcano'],
    W: ['whale', 'window', 'watermelon', 'wagon', 'worm'],
    X: ['xylophone', 'xray', 'xerus', 'xmas', 'xenops'],
    Y: ['yacht', 'yak', 'yo-yo', 'yellow', 'yogurt'],
    Z: ['zebra', 'zipper', 'zoo', 'zero', 'zigzag'],
});

export { PHONICS_FUN_LETTER_DATA };

// Also attach to window for backward compatibility with tests
if (typeof window !== 'undefined') {
    window.PHONICS_FUN_LETTER_DATA = PHONICS_FUN_LETTER_DATA;
}

function buildLetterVocabulary(letterData) {
    return Object.fromEntries(
        Object.entries(letterData).map(([letter, words]) => [
            letter,
            words.map((word) => ({
                letter,
                word,
                audioKey: `voice-${word}`,
            })),
        ])
    );
}

/**
 * GameState - Main game state management class
 * Handles screen navigation, gameplay logic, and subsystem coordination
 */
class GameState {
    constructor() {
        // Screen management
        this.currentScreen = 'welcome';

        // Gameplay state
        this.correctHitsCount = 0;
        this.incorrectHitsCount = 0;
        this.totalAnswersCount = 0;
        this.difficultySpeedMultiplier = 1.0;
        this.difficultyPlanetCount = 3;
        this.completedLevels = [];
        this.sessionId = Math.random().toString(36).substring(2, 9);
        this.isGameplayActive = false;
        this.arePlanetsRendered = false;

        // Letter configuration
        this.letterVocabulary = buildLetterVocabulary(PHONICS_FUN_LETTER_DATA);
        this.enabledLetters = Object.keys(this.letterVocabulary);
        this.activeLetterLevel = 'G';

        // Active vocabulary for current level
        this.activeVocabulary = this.letterVocabulary['G'];
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
                    this.backgroundMusicVolume
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
        document
            .getElementById('export-data-btn')
            .addEventListener('click', () => {
                this.exportTeacherData();
            });

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

        // Handle page visibility changes (critical for mobile browsers)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.audioManager.pauseAll();
            } else {
                this.audioManager.resumeAll();
            }
        });

        // Debounced resize handler for performance
        const resizeHandler = () => {
            console.log('📐 Window resized');
            if (this.currentScreen === 'gameplay' && this.arePlanetsRendered) {
                this.resetGameplayState();
                this.renderGameplayPlanets();
            }
        };

        // Use PerformanceUtils debounce if available, otherwise use local debounce
        const debouncedResize =
            window.PerformanceUtils && PerformanceUtils.debounce
                ? PerformanceUtils.debounce(resizeHandler, 250)
                : debounce(resizeHandler, 250);

        window.addEventListener('resize', debouncedResize);
    }

    /**
     * Setup touch event handlers for mobile optimization
     */
    setupTouchEventHandlers() {
        // Prevent default touch behaviors in game area
        document.addEventListener(
            'touchstart',
            (e) => {
                if (
                    e.target.closest('.game-area') ||
                    e.target.closest('.planet')
                ) {
                    e.preventDefault();
                }
            },
            { passive: false }
        );

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
            { passive: false }
        );

        document.addEventListener(
            'touchend',
            (e) => {
                if (
                    e.target.closest('.game-area') ||
                    e.target.closest('.planet')
                ) {
                    e.preventDefault();
                }
            },
            { passive: false }
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
     * Handle display changes from DisplayManager
     * @param {Object} displayInfo - Display information from DisplayManager
     */
    handleDisplayChange(displayInfo) {
        console.log('📱 Display configuration changed:', displayInfo);

        // Adjust game elements based on new display configuration
        if (this.currentScreen === 'gameplay' && this.arePlanetsRendered) {
            // Reposition planets for new viewport
            this.adjustPlanetPositions(displayInfo);
        }

        // Update UI scaling
        this.updateUIScaling(displayInfo);
    }

    /**
     * Adjust planet positions for current viewport
     * @param {Object} displayInfo - Display information
     */
    adjustPlanetPositions(displayInfo) {
        const planets = document.querySelectorAll('.planet');
        const { width, height } = displayInfo.viewport;

        planets.forEach((planet, _index) => {
            // Recalculate position to keep planets visible
            const currentLeft = parseInt(planet.style.left, 10) || 0;
            const currentTop = parseInt(planet.style.top, 10) || 0;

            // Ensure planet stays within new viewport bounds
            const newLeft = Math.min(currentLeft, width - 120);
            const newTop = Math.min(currentTop, height - 120);

            planet.style.left = `${Math.max(10, newLeft)}px`;
            planet.style.top = `${Math.max(10, newTop)}px`;
        });
    }

    /**
     * Update UI scaling based on display info
     * @param {Object} displayInfo - Display information
     */
    updateUIScaling(displayInfo) {
        // UI scaling is handled by DisplayManager CSS variables
        console.log(
            `🎨 UI scaled for ${displayInfo.deviceType} in ${displayInfo.orientation} orientation`
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
        // Subscribe to collision events
        this.eventManager.subscribe('collision:asteroid_planet', (data) => {
            this.handleAsteroidPlanetCollision(data.asteroid, data.planet);
        });

        this.eventManager.subscribe('level:complete', () => {
            this.completeLevel();
        });

        // Set up collision handlers
        this.collisionManager.registerTypeCollision(
            'asteroid',
            'planet',
            (asteroid, planet, type) => {
                if (type === 'start') {
                    this.eventManager.emit('collision:asteroid_planet', {
                        asteroid: asteroid,
                        planet: planet,
                    });
                }
            }
        );

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

        // Get the position for explosion
        const x = asteroid.x;
        const y = asteroid.y;

        // Check if it's a G planet
        if (this.isCorrectLetter(planet.data.letter)) {
            this.handleCorrectCollision(
                planetElement,
                x,
                y,
                asteroid.id,
                planet.id
            );
        } else {
            this.handleIncorrectCollision(planetElement, x, y, asteroid.id);
        }
    }

    handleCorrectCollision(planet, x, y, asteroidId, planetId) {
        console.log('Correct collision!');

        // Create explosion at collision point
        this.createExplosionEffect(x, y);

        // Play sound effects
        this.audioManager.play('explosion');
        this.audioManager.play(
            `phoneme-${this.activeLetterLevel.toLowerCase()}`
        );

        // Remove planet and asteroid from collision manager
        this.collisionManager.unregisterObject(asteroidId);
        this.collisionManager.unregisterObject(planetId);

        // Remove planet from DOM
        planet.remove();

        // Particle system effects
        if (this.particleSystem) {
            this.particleSystem.planetDestroyed(x, y);
        }

        // Voice message and word image
        setTimeout(() => {
            this.playVoiceMessage();
            this.showWordImage();
        }, 500);

        // Update progress
        this.correctHits++;
        this.totalAnswersCount++;
        this.updateAdaptiveDifficulty();
        this.saveStatsToLocalStorage();
        this.updateProgress();

        // Announce correct hit to screen readers
        this.announceToScreenReader(
            `Correct! You matched the letter ${this.activeLetterLevel}.`
        );

        // Check if level complete
        if (this.correctHits >= this.totalHits) {
            setTimeout(() => {
                this.eventManager.emit('level:complete');
            }, 2000);
        }
    }

    handleIncorrectCollision(planet, x, y, asteroidId) {
        console.log('Incorrect collision');

        // Remove asteroid from collision manager
        this.collisionManager.unregisterObject(asteroidId);

        // Track stats for adaptive difficulty
        this.incorrectHitsCount++;
        this.totalAnswersCount++;
        this.updateAdaptiveDifficulty();
        this.saveStatsToLocalStorage();

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
                2000
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
                `${Math.cos(angle) * distance}px`
            );
            sparkle.style.setProperty(
                '--dy',
                `${Math.sin(angle) * distance}px`
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
            const isLetterEnabled = this.enabledLetters.includes(letter);

            letterButton.className = isLetterEnabled
                ? 'letter-button playable'
                : 'letter-button disabled';
            letterButton.textContent = letter;
            letterButton.setAttribute('data-letter', letter);
            letterButton.setAttribute(
                'aria-label',
                `Letter ${letter}${isLetterEnabled ? ' - available' : ' - coming soon'}`
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
                2000
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
        this.isGameplayActive = true;
        this.correctHitsCount = 0;
        this.vocabularyIndex = 0;
        this.updateProgressDisplay();

        // Initialize particle system for visual effects
        if (window.ParticleSystem) {
            this.particleSystem = new ParticleSystem();
            this.particleSystem.createStarfield();
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
            `🪐 Creating planets (Speed Multiplier: ${this.difficultySpeedMultiplier}, Distractors: ${this.difficultyPlanetCount})...`
        );
        const planetsContainer = document.querySelector('.planets-container');
        planetsContainer.innerHTML = '';

        const letterLower = this.activeLetterLevel.toLowerCase();

        // Dynamic speed based on adaptive difficulty
        const targetSpeed = 8 / this.difficultySpeedMultiplier;

        // Create target letter planets
        for (let i = 0; i < this.activeVocabulary.length; i++) {
            const targetPlanet = document.createElement('div');
            targetPlanet.className = `planet ${letterLower}-planet`;
            targetPlanet.textContent = this.activeLetterLevel;
            targetPlanet.setAttribute('data-letter', this.activeLetterLevel);
            targetPlanet.setAttribute('data-index', i);
            targetPlanet.setAttribute(
                'aria-label',
                `Target planet with letter ${this.activeLetterLevel}`
            );

            // Random position within game area
            const posX = Math.random() * (window.innerWidth - 100);
            const posY = Math.random() * (window.innerHeight - 100);
            targetPlanet.style.left = `${posX}px`;
            targetPlanet.style.top = `${posY}px`;

            // Staggered animation and dynamic speed
            targetPlanet.style.animation = `planetOrbit ${targetSpeed}s linear infinite, planetGlow 2s ease-in-out infinite alternate`;
            targetPlanet.style.animationDelay = `${Math.random() * 8}s`;

            targetPlanet.addEventListener('click', () => {
                console.log(`🎯 ${this.activeLetterLevel} planet ${i} clicked`);
                this.handlePlanetInteraction(
                    targetPlanet,
                    this.activeLetterLevel
                );
            });

            planetsContainer.appendChild(targetPlanet);

            // Register with collision detection system
            this.collisionManager.registerObject(
                `planet-${letterLower}-${i}`,
                targetPlanet,
                'planet',
                {
                    isStatic: false,
                    data: { letter: this.activeLetterLevel, index: i },
                }
            );
        }

        // Create distractor planets based on adaptive difficulty count
        const distractorLetters = this.shuffleLetters(
            this.enabledLetters.filter(
                (letter) => letter !== this.activeLetterLevel
            )
        ).slice(0, this.difficultyPlanetCount);

        const distractorSpeed = 12 / this.difficultySpeedMultiplier;

        distractorLetters.forEach((distractorLetter, i) => {
            const distractorPlanet = document.createElement('div');
            distractorPlanet.className = 'planet other-planet';

            distractorPlanet.textContent = distractorLetter;
            distractorPlanet.setAttribute('data-letter', distractorLetter);
            distractorPlanet.setAttribute(
                'aria-label',
                `Distractor planet with letter ${distractorLetter}`
            );

            // Random position
            const posX = Math.random() * (window.innerWidth - 100);
            const posY = Math.random() * (window.innerHeight - 100);
            distractorPlanet.style.left = `${posX}px`;
            distractorPlanet.style.top = `${posY}px`;

            // Slower animation and dynamic speed
            distractorPlanet.style.animation = `planetOrbit ${distractorSpeed}s linear infinite, planetGlow 3s ease-in-out infinite alternate`;
            distractorPlanet.style.animationDelay = `${Math.random() * 12}s`;

            distractorPlanet.addEventListener('click', () => {
                console.log(`❌ Non-target planet ${distractorLetter} clicked`);
                this.handlePlanetInteraction(
                    distractorPlanet,
                    distractorLetter
                );
            });

            planetsContainer.appendChild(distractorPlanet);

            // Register with collision detection
            this.collisionManager.registerObject(
                `planet-other-${i}`,
                distractorPlanet,
                'planet',
                {
                    isStatic: false,
                    data: { letter: distractorLetter, index: i },
                }
            );
        });
    }

    /**
     * Handle planet click interaction
     * @param {HTMLElement} planetElement - The clicked planet element
     * @param {string} letter - The letter on the planet
     */
    handlePlanetInteraction(planetElement, letter) {
        if (!this.isGameplayActive) return;

        const rect = planetElement.getBoundingClientRect();
        const planetCenterX = rect.left + rect.width / 2;
        const planetCenterY = rect.top + rect.height / 2;

        if (this.isCorrectLetter(letter)) {
            this.processCorrectPlanetHit(
                planetElement,
                planetCenterX,
                planetCenterY
            );
        } else {
            this.processIncorrectPlanetHit(
                planetElement,
                planetCenterX,
                planetCenterY
            );
        }
    }

    /**
     * Process a correct planet hit (target letter)
     * @param {HTMLElement} planetElement - The hit planet
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    processCorrectPlanetHit(planetElement, x, y) {
        console.log('✅ Correct hit!');

        const asteroidId = `asteroid-fiery-${Date.now()}`;
        const asteroidElement = this.spawnAsteroid(x, y, 'fiery', asteroidId);

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
                        asteroidElement.velocity || { x: 2, y: 2 }
                    );
                } else {
                    clearInterval(trailInterval);
                }
            }, 50);
        }
    }

    /**
     * Process an incorrect planet hit (distractor letter)
     * @param {HTMLElement} planetElement - The hit planet
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    processIncorrectPlanetHit(planetElement, x, y) {
        console.log('❌ Incorrect hit');

        const asteroidId = `asteroid-dull-${Date.now()}`;
        this.spawnAsteroid(x, y, 'dull', asteroidId);
    }

    /**
     * Spawn an asteroid that flies toward a target position
     * @param {number} targetX - Target X coordinate
     * @param {number} targetY - Target Y coordinate
     * @param {string} asteroidType - Type of asteroid ('fiery' or 'dull')
     * @param {string} asteroidId - Unique identifier for the asteroid
     * @returns {HTMLElement} The created asteroid element
     */
    spawnAsteroid(targetX, targetY, asteroidType, asteroidId) {
        const asteroidElement = document.createElement('div');
        asteroidElement.className = `asteroid ${asteroidType}`;
        asteroidElement.id = asteroidId;

        // Calculate random starting position from screen edge
        const screenEdge = Math.floor(Math.random() * 4);
        let startX, startY;

        switch (screenEdge) {
            case 0: // Top edge
                startX = Math.random() * window.innerWidth;
                startY = -20;
                break;
            case 1: // Right edge
                startX = window.innerWidth + 20;
                startY = Math.random() * window.innerHeight;
                break;
            case 2: // Bottom edge
                startX = Math.random() * window.innerWidth;
                startY = window.innerHeight + 20;
                break;
            case 3: // Left edge
                startX = -20;
                startY = Math.random() * window.innerHeight;
                break;
        }

        asteroidElement.style.left = `${startX}px`;
        asteroidElement.style.top = `${startY}px`;

        // Calculate trajectory vector
        const deltaX = targetX - startX;
        const deltaY = targetY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Store velocity for particle trail calculations
        const velocity = {
            x: (deltaX / distance) * 10,
            y: (deltaY / distance) * 10,
        };
        asteroidElement.velocity = velocity;

        // Set animation duration based on type
        const animationDuration = asteroidType === 'fiery' ? 1000 : 1500;
        asteroidElement.style.transition = `all ${animationDuration}ms linear`;

        document
            .querySelector('.asteroids-container')
            .appendChild(asteroidElement);

        // Register with collision detection system
        this.collisionManager.registerObject(
            asteroidId,
            asteroidElement,
            'asteroid',
            {
                velocity: velocity,
                isStatic: false,
                data: { type: asteroidType },
            }
        );

        // Animate movement to target
        setTimeout(() => {
            asteroidElement.style.left = `${targetX}px`;
            asteroidElement.style.top = `${targetY}px`;
        }, 50);

        return asteroidElement;
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
     */
    playVocabularyAudio() {
        const vocabularyItem = this.activeVocabulary[this.vocabularyIndex];

        // Handle both legacy string format and new object format
        let word, letter, audioKey;
        if (typeof vocabularyItem === 'string') {
            word = vocabularyItem;
            letter = 'G';
            audioKey = `voice-${word}`;
        } else {
            word = vocabularyItem.word;
            letter = vocabularyItem.letter;
            audioKey = vocabularyItem.audioKey;
        }

        this.audioManager.play(audioKey);

        // Fallback to speech synthesis if audio file fails
        setTimeout(() => {
            if (
                document.visibilityState === 'visible' &&
                this.audioManager.canUseSpeechSynthesis
            ) {
                this.audioManager.speak(`${letter} is for ${word}!`, {
                    pitch: 1.2,
                    rate: 0.9,
                });
            }
        }, 500);

        // Advance to next vocabulary item
        this.vocabularyIndex =
            (this.vocabularyIndex + 1) % this.activeVocabulary.length;
    }

    /**
     * Display word image in the background
     */
    displayWordImage() {
        const vocabularyItem =
            this.activeVocabulary[this.vocabularyIndex - 1] ||
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
        wordBackground.textContent = '';
        wordBackground.style.display = '';
        wordBackground.style.alignItems = '';
        wordBackground.style.justifyContent = '';
        wordBackground.style.textAlign = '';
        wordBackground.style.color = '';
        wordBackground.style.fontSize = '';
        wordBackground.style.fontWeight = '';
        wordBackground.style.padding = '';

        // Set background image with lazy loading path
        const imagePath = `Assets/images/${letter}-${letter.toLowerCase()}/Images/${word}.png`;

        // Check if image is cached
        if (this.performanceUtils && this.performanceUtils.getCachedImage) {
            const cachedImage = this.performanceUtils.getCachedImage(
                letter,
                word
            );
            if (cachedImage && cachedImage.complete) {
                wordBackground.style.backgroundImage = `url('${imagePath}')`;
                wordBackground.classList.remove('loading');
                wordBackground.classList.add('visible');
                this.scheduleImageHide(wordBackground);
                return;
            }
        }

        // Load image progressively with loading indicator
        const img = new Image();
        img.onload = () => {
            wordBackground.textContent = '';
            wordBackground.style.backgroundImage = `url('${imagePath}')`;
            wordBackground.classList.remove('loading');
            wordBackground.classList.add('visible');
            this.scheduleImageHide(wordBackground);
        };

        img.onerror = () => {
            console.warn(`Failed to load image: ${imagePath}`);
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
            wordBackground.classList.add('visible');
            this.scheduleImageHide(wordBackground);
        };

        img.src = imagePath;
    }

    /**
     * Schedule hiding of word image after delay
     * @param {HTMLElement} wordBackground - Word background element
     */
    scheduleImageHide(wordBackground) {
        // Hide after display duration
        setTimeout(() => {
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

        const progressPercentage =
            (this.correctHitsCount / this.requiredHitsToComplete) * 100;
        progressFillElement.style.width = `${progressPercentage}%`;
        hitsCounterElement.textContent = this.correctHitsCount;
        this.syncLetterDisplays();
    }

    /**
     * Sync active letter labels across gameplay HUD and popups
     */
    syncLetterDisplays() {
        [
            'active-letter-display',
            'ready-letter-display',
            'level-complete-letter',
        ].forEach((elementId) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = this.activeLetterLevel;
            }
        });
    }

    /**
     * Handle level completion
     */
    completeLevelSuccessfully() {
        console.log('🎉 Level complete!');
        this.isGameplayActive = false;
        this.audioManager.play('celebration');

        // Track completed level
        if (!this.completedLevels.includes(this.activeLetterLevel)) {
            this.completedLevels.push(this.activeLetterLevel);
        }

        // Save state and update difficulty
        this.updateAdaptiveDifficulty();
        this.saveStatsToLocalStorage();

        // Create celebration particle effects
        if (this.particleSystem) {
            this.particleSystem.levelComplete();
        }

        // Show success toast
        if (this.uiUtils) {
            this.uiUtils.showToast(
                'Level Complete! Great job!',
                'success',
                3000
            );
        }

        // Announce to screen readers
        this.announceToScreenReader(
            `Fantastic! You completed the mission for letter ${this.activeLetterLevel}!`
        );

        this.displayPopup('level-complete-popup');
    }

    navigateToScreen(screenId) {
        console.log(`🔄 Navigating to screen: ${screenId}`);

        // Prevent navigating to the same screen
        if (this.currentScreen === screenId) {
            console.log(`Already on screen: ${screenId}, skipping navigation`);
            return;
        }

        // Get current and target screens
        const currentScreenElement = document.querySelector('.screen.active');
        const targetScreenElement = document.getElementById(
            `${screenId}-screen`
        );

        // Focus the new screen for accessibility (WCAG focus routing)
        if (targetScreenElement) {
            targetScreenElement.setAttribute('tabindex', '-1');
            targetScreenElement.focus();
        }

        // Use smooth transition if UI utilities available
        if (this.uiUtils && currentScreenElement && targetScreenElement) {
            this.uiUtils.transitionScreens(
                currentScreenElement,
                targetScreenElement,
                () => {
                    this.onScreenTransitionComplete(screenId);
                }
            );
        } else {
            // Fallback to immediate transition
            document.querySelectorAll('.screen').forEach((screen) => {
                screen.classList.remove('active');
            });
            if (targetScreenElement) {
                targetScreenElement.classList.add('active');
            }
            this.onScreenTransitionComplete(screenId);
        }

        this.currentScreen = screenId;
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

        // Announce screen change for screen readers
        this.announceToScreenReader(
            `Space mission screen loaded: ${screenId}.`
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
                'scaleIn'
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
        popup.classList.remove('hidden');

        // Animate popup content entrance
        if (this.uiUtils) {
            this.uiUtils.animateEntrance(
                popup.querySelector('.popup-content'),
                'scaleIn'
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
            if (container) container.innerHTML = '';
        });

        // Reset UI elements
        this.updateProgressDisplay();
        document.querySelector('.word-background').classList.remove('visible');
    }

    /**
     * Check if a letter is enabled for play
     * @param {string} letter - The letter to check
     * @returns {boolean} Whether the letter is enabled
     */
    isLetterEnabled(letter) {
        return this.enabledLetters.includes(letter);
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
                this.completedLevels = parsed.completedLevels || [];
                this.correctHitsCount = parsed.correctHitsCount || 0;
                this.incorrectHitsCount = parsed.incorrectHitsCount || 0;
                this.totalAnswersCount = parsed.totalAnswersCount || 0;
                this.updateAdaptiveDifficulty();
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
            `📊 Accuracy is: ${(accuracy * 100).toFixed(1)}% (${this.correctHitsCount}/${this.totalAnswersCount})`
        );

        if (accuracy >= 0.85) {
            this.difficultySpeedMultiplier = 1.25;
            this.difficultyPlanetCount = 4;
            console.log(
                '⚡ Adaptive Difficulty: Hard (faster planets, more distractors)'
            );
        } else if (accuracy <= 0.6) {
            this.difficultySpeedMultiplier = 0.8;
            this.difficultyPlanetCount = 2;
            console.log(
                '🐢 Adaptive Difficulty: Easy (slower planets, fewer distractors)'
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
            correctHits: this.correctHitsCount,
            incorrectHits: this.incorrectHitsCount,
            accuracy:
                this.totalAnswersCount > 0
                    ? (this.correctHitsCount / this.totalAnswersCount).toFixed(
                          2
                      )
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
                `phonics-fun-progress-${stats.sessionId}.json`
            );
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();

            this.announceToScreenReader(
                'Progress report downloaded successfully.'
            );
            if (this.uiUtils) {
                this.uiUtils.showToast(
                    'Progress report downloaded!',
                    'success',
                    3000
                );
            }
        } catch (e) {
            console.error('Failed to export progress data:', e);
            if (this.uiUtils) {
                this.uiUtils.showToast(
                    'Failed to export progress data',
                    'error',
                    3000
                );
            }
        }
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
    window.game = new GameState();
});

// Handle visibility changes (for mobile/tablet devices)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('⏸️ Game paused (tab hidden)');
        if (window.game && window.game.audioManager) {
            window.game.audioManager.stopAll();
        }
    } else {
        console.log('▶️ Game resumed (tab visible)');
        if (window.game && window.game.currentScreen === 'welcome') {
            window.game.audioManager.play('background-music');
        }
    }
});
window.GameState = GameState;

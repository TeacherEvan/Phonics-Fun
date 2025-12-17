/**
 * Phonics Fun - Educational Phonics Game
 * Interactive space-themed game for learning letter sounds
 * Author: AI Assistant
 * 
 * @fileoverview Main game controller managing state, screens, and gameplay
 * @version 2.0.0
 */

// Note: ES6 imports commented out for compatibility - using global classes instead
// import EventBus from "./event-bus.js";
// import AudioManager from "./audio-manager.js";
// import EventManager from "./event-manager.js";
// import CollisionManager from "./collision-manager.js";
// import ParticleSystem from "./particles.js";

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
        this.requiredHitsToComplete = 5;
        this.isGameplayActive = false;
        this.arePlanetsRendered = false;
        
        // Letter configuration
        this.enabledLetters = ["G", "A", "B"];
        this.activeLetterLevel = 'G';

        // Organized vocabulary by letter
        // TODO: [OPTIMIZATION] Consider moving vocabulary data to external JSON for easier content updates
        this.letterVocabulary = {
            'G': [
                { letter: "G", word: "grape", audioKey: "voiceGrape" },
                { letter: "G", word: "goat", audioKey: "voiceGoat" },
                { letter: "G", word: "gold", audioKey: "voiceGold" },
                { letter: "G", word: "girl", audioKey: "voiceGirl" },
                { letter: "G", word: "grandpa", audioKey: "voiceGrandpa" }
            ],
            'A': [
                { letter: "A", word: "apple", audioKey: "voiceApple" },
                { letter: "A", word: "ant", audioKey: "voiceAnt" },
                { letter: "A", word: "airplane", audioKey: "voiceAirplane" },
                { letter: "A", word: "alligator", audioKey: "voiceAlligator" },
                { letter: "A", word: "arrow", audioKey: "voiceArrow" }
            ],
            'B': [
                { letter: "B", word: "ball", audioKey: "voiceBall" },
                { letter: "B", word: "bat", audioKey: "voiceBat" },
                { letter: "B", word: "bear", audioKey: "voiceBear" },
                { letter: "B", word: "boat", audioKey: "voiceBoat" },
                { letter: "B", word: "butterfly", audioKey: "voiceButterfly" }
            ]
        };

        // Active vocabulary for current level
        this.activeVocabulary = this.letterVocabulary['G'];
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
        this.performanceUtils = window.PerformanceUtils ? new PerformanceUtils() : null;
        this.uiUtils = window.UIUtils ? new UIUtils() : null;
        
        // Display management for responsive design
        this.displayManager = window.DisplayManager ? new DisplayManager() : null;

        this.initializeGame();
    }

    // Legacy getters for backward compatibility
    get correctHits() { return this.correctHitsCount; }
    set correctHits(value) { this.correctHitsCount = value; }
    get totalHits() { return this.requiredHitsToComplete; }
    get gameActive() { return this.isGameplayActive; }
    set gameActive(value) { this.isGameplayActive = value; }
    get planetsCreated() { return this.arePlanetsRendered; }
    set planetsCreated(value) { this.arePlanetsRendered = value; }
    get allowedLetters() { return this.enabledLetters; }
    get currentLetter() { return this.activeLetterLevel; }
    set currentLetter(value) { this.activeLetterLevel = value; }
    get wordMessages() { return this.activeVocabulary; }
    set wordMessages(value) { this.activeVocabulary = value; }
    get currentWordIndex() { return this.vocabularyIndex; }
    set currentWordIndex(value) { this.vocabularyIndex = value; }
    get isMuted() { return this.isAudioMuted; }
    set isMuted(value) { this.isAudioMuted = value; }
    get musicVolume() { return this.backgroundMusicVolume; }
    set musicVolume(value) { this.backgroundMusicVolume = value; }
    get effectsVolume() { return this.soundEffectsVolume; }
    set effectsVolume(value) { this.soundEffectsVolume = value; }

    /**
     * Initialize the game and all subsystems
     */
    initializeGame() {
        console.log('🎮 Initializing Phonics Fun game...');
        this.setupEventListeners();
        this.setupAudioConfiguration();
        this.setupEventSubscriptions();
        this.renderLetterSelectionGrid();
        this.createWelcomeScreenAnimations();
        this.navigateToScreen('welcome');
        
        // Preload images for enabled letters
        if (this.performanceUtils) {
            this.enabledLetters.forEach(letter => {
                this.performanceUtils.preloadLetterImages(letter);
            });
        }
        
        // Make interactive elements enhanced
        if (this.uiUtils) {
            this.uiUtils.makeInteractive('.primary-button');
            this.uiUtils.makeInteractive('.secondary-button');
        }
    }
    
    // Legacy method alias for backward compatibility
    init() { this.initializeGame(); }

    /**
     * Setup all DOM event listeners for user interactions
     */
    setupEventListeners() {
        // Welcome screen - Start game button
        document.getElementById('start-game-btn').addEventListener('click', () => {
            console.log('▶️ Start game clicked');
            this.navigateToScreen('level-select');
        });

        // Settings panel toggle
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.toggleSettingsPanel();
        });

        document.getElementById('close-settings').addEventListener('click', () => {
            this.toggleSettingsPanel();
        });

        // Volume controls with real-time feedback
        document.getElementById('music-volume').addEventListener('input', (e) => {
            this.backgroundMusicVolume = e.target.value / 100;
            this.audioManager.setVolume('music', this.backgroundMusicVolume);
            document.getElementById('music-volume-display').textContent = e.target.value + '%';
        });

        document.getElementById('effects-volume').addEventListener('input', (e) => {
            this.soundEffectsVolume = e.target.value / 100;
            this.audioManager.setVolume('effects', this.soundEffectsVolume);
            document.getElementById('effects-volume-display').textContent = e.target.value + '%';
        });

        // Mute toggle
        document.getElementById('mute-toggle').addEventListener('click', () => {
            this.toggleAudioMute();
        });

        // Audio priority controls for bandwidth optimization
        document.getElementById('high-priority-audio').addEventListener('change', (e) => {
            this.audioManager.setAudioPriority('high', e.target.checked);
        });

        document.getElementById('medium-priority-audio').addEventListener('change', (e) => {
            this.audioManager.setAudioPriority('medium', e.target.checked);
        });

        document.getElementById('low-priority-audio').addEventListener('change', (e) => {
            this.audioManager.setAudioPriority('low', e.target.checked);
            // Enable background music if checkbox is checked and on welcome screen
            if (e.target.checked && this.currentScreen === 'welcome') {
                this.audioManager.play('background-music');
            }
        });

        // Voice template selection
        document.getElementById('voice-template-select').addEventListener('change', (e) => {
            this.handleVoiceTemplateChange(e.target.value);
        });

        document.getElementById('preview-voice').addEventListener('click', () => {
            this.previewVoiceTemplate();
        });

        // Level complete popup actions
        document.getElementById('next-level-btn').addEventListener('click', () => {
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
        const debouncedResize = (window.PerformanceUtils && PerformanceUtils.debounce) 
            ? PerformanceUtils.debounce(resizeHandler, 250)
            : debounce(resizeHandler, 250);
        
        window.addEventListener('resize', debouncedResize);
    }
    
    /**
     * Setup touch event handlers for mobile optimization
     */
    setupTouchEventHandlers() {
        // Prevent default touch behaviors in game area
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.game-area') || e.target.closest('.planet')) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.game-area') || e.target.closest('.planet')) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (e.target.closest('.game-area') || e.target.closest('.planet')) {
                e.preventDefault();
            }
        }, { passive: false });

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
        
        planets.forEach((planet, index) => {
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
        console.log(`🎨 UI scaled for ${displayInfo.deviceType} in ${displayInfo.orientation} orientation`);
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
    
    // Legacy alias
    handleOrientationChange() { this.handleDeviceOrientationChange(); }

    /**
     * Configure audio manager with current settings
     */
    setupAudioConfiguration() {
        this.audioManager.loadSettings({
            musicVolume: this.backgroundMusicVolume,
            effectsVolume: this.soundEffectsVolume,
            isMuted: this.isAudioMuted
        });
    }
    
    // Legacy alias
    setupAudio() { this.setupAudioConfiguration(); }

    setupEventSubscriptions() {
        // Subscribe to collision events
        this.eventManager.subscribe('collision:asteroid_planet', (data) => {
            this.handleAsteroidPlanetCollision(data.asteroid, data.planet);
        });

        this.eventManager.subscribe('level:complete', () => {
            this.completeLevel();
        });

        // Set up collision handlers
        this.collisionManager.registerTypeCollision('asteroid', 'planet', (asteroid, planet, type) => {
            if (type === 'start') {
                this.eventManager.emit('collision:asteroid_planet', {
                    asteroid: asteroid,
                    planet: planet
                });
            }
        });

        // Centralized reaction to collisions - runs once at start-up
        if (window.EventBus) {
            EventBus.addEventListener("planet-hit", async ({ detail }) => {
                // Waiting for both animations/SFX to finish keeps everything in sync
                await Promise.all([
                    detail.planet.triggerExplosion(),
                    detail.asteroid.triggerExplosion()
                ]);
            });
        }
    }

    handleAsteroidPlanetCollision(asteroid, planet) {
        console.log('Asteroid collided with planet:', asteroid.id, planet.id);

        // Get the actual DOM elements
        const asteroidElement = asteroid.element;
        const planetElement = planet.element;

        // Get the position for explosion
        const x = asteroid.x;
        const y = asteroid.y;

        // Check if it's a G planet
        if (this.isCorrectLetter(planet.data.letter)) {
            this.handleCorrectCollision(planetElement, x, y, asteroid.id, planet.id);
        } else {
            this.handleIncorrectCollision(planetElement, x, y, asteroid.id);
        }
    }

    handleCorrectCollision(planet, x, y, asteroidId, planetId) {
        console.log('Correct collision!');

        // Create explosion at collision point
        this.createExplosion(x, y);

        // Play sound effects
        this.audioManager.play('explosion');
        this.audioManager.play('phoneme-g');

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
        this.updateProgress();

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

        // Create smaller explosion or visual feedback
        if (this.particleSystem) {
            this.particleSystem.asteroidHit(x, y, false);
        }
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
    
    // Legacy alias
    toggleMute() { this.toggleAudioMute(); }

    /**
     * Toggle settings panel visibility
     */
    toggleSettingsPanel() {
        const panel = document.getElementById('settings-panel');
        panel.classList.toggle('active');

        if (panel.classList.contains('active')) {
            this.updateVoiceTemplateSelector();
        }
    }
    
    // Legacy alias
    toggleSettings() { this.toggleSettingsPanel(); }

    handleVoiceTemplateChange(templateId) {
        console.log('Voice template changed to:', templateId);

        // Update audio manager with new template
        if (this.audioManager.setVoiceTemplate(templateId)) {
            console.log('Voice template loaded successfully');
        } else {
            console.error('Failed to load voice template:', templateId);
        }
    }

    previewVoiceTemplate() {
        // Play a sample voice message to preview the current template
        const sampleWords = ['grape', 'goat', 'gold'];
        const randomWord = sampleWords[Math.floor(Math.random() * sampleWords.length)];

        console.log('Previewing voice template with word:', randomWord);
        this.audioManager.play('voice-' + randomWord);
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
                planet.style.filter = 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.8)) brightness(1.2)';
                planet.style.transform = 'scale(1.1)';
            });

            planet.addEventListener('mouseleave', () => {
                planet.style.filter = 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))';
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
                asteroid.style.filter = 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.6)) brightness(1.3)';
                asteroid.style.transform = 'scale(1.2)';
            });

            asteroid.addEventListener('mouseleave', () => {
                asteroid.style.filter = 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.2))';
                asteroid.style.transform = 'scale(1)';
            });

            asteroid.addEventListener('click', () => {
                this.createSparkleEffect(asteroid);
            });

            asteroidsContainer.appendChild(asteroid);
        }
    }
    
    // Legacy alias
    createWelcomeAnimations() { this.createWelcomeScreenAnimations(); }

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
            sparkle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
            sparkle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);

            document.body.appendChild(sparkle);

            // Cleanup after animation
            setTimeout(() => sparkle.remove(), 600);
        }
    }
    
    // Legacy alias
    createWelcomeSparkles(element) { this.createSparkleEffect(element); }

    /**
     * Render the A-Z letter selection grid
     * Creates buttons for all letters with enabled/disabled states
     */
    renderLetterSelectionGrid() {
        const gridContainer = document.querySelector('.letter-grid');
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        // Clear existing buttons
        gridContainer.innerHTML = '';

        alphabet.split('').forEach(letter => {
            const letterButton = document.createElement('button');
            const isLetterEnabled = this.enabledLetters.includes(letter);
            
            letterButton.className = isLetterEnabled 
                ? 'letter-button playable' 
                : 'letter-button disabled';
            letterButton.textContent = letter;
            letterButton.setAttribute('data-letter', letter);
            letterButton.setAttribute('aria-label', `Letter ${letter}${isLetterEnabled ? ' - available' : ' - coming soon'}`);

            letterButton.addEventListener('click', () => {
                console.log(`📝 Letter ${letter} clicked`);
                this.handleLetterSelection(letter);
            });

            gridContainer.appendChild(letterButton);
        });
    }
    
    // Legacy alias
    createLetterGrid() { this.renderLetterSelectionGrid(); }

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
    
    // Legacy alias
    handleLetterClick(letter) { this.handleLetterSelection(letter); }

    /**
     * Initialize and start a letter level
     * @param {string} letter - The letter to start level for
     */
    initializeLetterLevel(letter) {
        console.log(`🚀 Starting ${letter} level...`);
        this.activeLetterLevel = letter;
        this.activeVocabulary = this.letterVocabulary[letter];
        this.displayOverlay('ready-overlay');

        // Show loading state with skeleton
        if (this.uiUtils) {
            this.uiUtils.showToast(`Loading letter ${letter} level...`, 'info', 2000);
        }

        // Preload assets for this letter during loading screen
        if (this.performanceUtils) {
            this.performanceUtils.preloadLetterImages(letter);
        }

        // Transition to gameplay after loading
        // TODO: [OPTIMIZATION] Replace setTimeout with actual asset preloading Promise
        setTimeout(() => {
            this.dismissOverlay('ready-overlay');
            this.navigateToScreen('gameplay');
            this.startGameplaySession();
        }, 5000);
    }
    
    // Legacy alias
    startLetterLevel(letter) { this.initializeLetterLevel(letter); }

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
    
    // Legacy alias
    initializeGameplay() { this.startGameplaySession(); }

    /**
     * Render target and distractor planets in the gameplay area
     * Creates interactive letter planets for the current level
     */
    renderGameplayPlanets() {
        console.log('🪐 Creating planets...');
        const planetsContainer = document.querySelector('.planets-container');
        planetsContainer.innerHTML = '';

        const letterLower = this.activeLetterLevel.toLowerCase();

        // Create target letter planets (5 planets to hit)
        for (let i = 0; i < 5; i++) {
            const targetPlanet = document.createElement('div');
            targetPlanet.className = `planet ${letterLower}-planet`;
            targetPlanet.textContent = this.activeLetterLevel;
            targetPlanet.setAttribute('data-letter', this.activeLetterLevel);
            targetPlanet.setAttribute('data-index', i);
            targetPlanet.setAttribute('aria-label', `Target planet with letter ${this.activeLetterLevel}`);

            // Random position within game area
            const posX = Math.random() * (window.innerWidth - 100);
            const posY = Math.random() * (window.innerHeight - 100);
            targetPlanet.style.left = `${posX}px`;
            targetPlanet.style.top = `${posY}px`;

            // Staggered animation for visual interest
            targetPlanet.style.animationDelay = `${Math.random() * 8}s`;

            targetPlanet.addEventListener('click', () => {
                console.log(`🎯 ${this.activeLetterLevel} planet ${i} clicked`);
                this.handlePlanetInteraction(targetPlanet, this.activeLetterLevel);
            });

            planetsContainer.appendChild(targetPlanet);

            // Register with collision detection system
            this.collisionManager.registerObject(
                `planet-${letterLower}-${i}`,
                targetPlanet,
                'planet',
                { isStatic: false, data: { letter: this.activeLetterLevel, index: i } }
            );
        }

        // Create distractor planets (3 random non-target letters)
        for (let i = 0; i < 3; i++) {
            const distractorPlanet = document.createElement('div');
            distractorPlanet.className = 'planet other-planet';

            // Select random letter that is not enabled
            let distractorLetter;
            do {
                distractorLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            } while (this.enabledLetters.includes(distractorLetter));

            distractorPlanet.textContent = distractorLetter;
            distractorPlanet.setAttribute('data-letter', distractorLetter);
            distractorPlanet.setAttribute('aria-label', `Distractor planet with letter ${distractorLetter}`);

            // Random position
            const posX = Math.random() * (window.innerWidth - 100);
            const posY = Math.random() * (window.innerHeight - 100);
            distractorPlanet.style.left = `${posX}px`;
            distractorPlanet.style.top = `${posY}px`;

            // Slower animation for distractors
            distractorPlanet.style.animationDelay = `${Math.random() * 12}s`;

            distractorPlanet.addEventListener('click', () => {
                console.log(`❌ Non-target planet ${distractorLetter} clicked`);
                this.handlePlanetInteraction(distractorPlanet, distractorLetter);
            });

            planetsContainer.appendChild(distractorPlanet);

            // Register with collision detection
            this.collisionManager.registerObject(
                `planet-other-${i}`,
                distractorPlanet,
                'planet',
                { isStatic: false, data: { letter: distractorLetter, index: i } }
            );
        }
    }
    
    // Legacy alias
    createPlanets() { this.renderGameplayPlanets(); }

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

        if (this.isLetterEnabled(letter)) {
            this.processCorrectPlanetHit(planetElement, planetCenterX, planetCenterY);
        } else {
            this.processIncorrectPlanetHit(planetElement, planetCenterX, planetCenterY);
        }
    }
    
    // Legacy alias
    handlePlanetClick(planet, letter) { this.handlePlanetInteraction(planet, letter); }

    /**
     * Process a correct planet hit (target letter)
     * @param {HTMLElement} planetElement - The hit planet
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    processCorrectPlanetHit(planetElement, x, y) {
        console.log('✅ Correct hit!');

        const planetIndex = planetElement.getAttribute('data-index');
        const asteroidId = `asteroid-fiery-${Date.now()}`;
        const asteroidElement = this.spawnAsteroid(x, y, 'fiery', asteroidId);

        // Create particle trail following asteroid
        if (this.particleSystem) {
            const trailInterval = setInterval(() => {
                if (asteroidElement && asteroidElement.parentNode) {
                    const asteroidRect = asteroidElement.getBoundingClientRect();
                    const asteroidX = asteroidRect.left + asteroidRect.width / 2;
                    const asteroidY = asteroidRect.top + asteroidRect.height / 2;
                    this.particleSystem.asteroidTrail(asteroidX, asteroidY, asteroidElement.velocity || { x: 2, y: 2 });
                } else {
                    clearInterval(trailInterval);
                }
            }, 50);
        }
    }
    
    // Legacy alias
    handleCorrectHit(planet, x, y) { this.processCorrectPlanetHit(planet, x, y); }

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
    
    // Legacy alias
    handleIncorrectHit(planet, x, y) { this.processIncorrectPlanetHit(planet, x, y); }

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
            y: (deltaY / distance) * 10
        };
        asteroidElement.velocity = velocity;

        // Set animation duration based on type
        const animationDuration = asteroidType === 'fiery' ? 1000 : 1500;
        asteroidElement.style.transition = `all ${animationDuration}ms linear`;

        document.querySelector('.asteroids-container').appendChild(asteroidElement);

        // Register with collision detection system
        this.collisionManager.registerObject(asteroidId, asteroidElement, 'asteroid', {
            velocity: velocity,
            isStatic: false,
            data: { type: asteroidType }
        });

        // Animate movement to target
        setTimeout(() => {
            asteroidElement.style.left = `${targetX}px`;
            asteroidElement.style.top = `${targetY}px`;
        }, 50);

        return asteroidElement;
    }
    
    // Legacy alias
    createAsteroid(targetX, targetY, type, id) { return this.spawnAsteroid(targetX, targetY, type, id); }

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

        document.querySelector('.explosions-container').appendChild(explosionElement);

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
    
    // Legacy alias
    createExplosion(x, y) { this.createExplosionEffect(x, y); }

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
    
    // Legacy alias
    createScreenShake() { this.triggerScreenShake(); }

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
            if (document.visibilityState === 'visible' && this.audioManager.canUseSpeechSynthesis) {
                this.audioManager.speak(`${letter} is for ${word}!`, { pitch: 1.2, rate: 0.9 });
            }
        }, 500);

        // Advance to next vocabulary item
        this.vocabularyIndex = (this.vocabularyIndex + 1) % this.activeVocabulary.length;
    }
    
    // Legacy alias
    playVoiceMessage() { this.playVocabularyAudio(); }

    /**
     * Display word image in the background
     */
    displayWordImage() {
        const vocabularyItem = this.activeVocabulary[this.vocabularyIndex - 1] || this.activeVocabulary[0];
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
        
        // Set background image with lazy loading path
        const imagePath = `Assets/images/${letter}-${letter.toLowerCase()}/Images/${word}.png`;
        
        // Check if image is cached
        if (this.performanceUtils && this.performanceUtils.getCachedImage) {
            const cachedImage = this.performanceUtils.getCachedImage(letter, word);
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
            wordBackground.style.backgroundImage = `url('${imagePath}')`;
            wordBackground.classList.remove('loading');
            wordBackground.classList.add('visible');
            this.scheduleImageHide(wordBackground);
        };
        
        img.onerror = () => {
            console.warn(`Failed to load image: ${imagePath}`);
            wordBackground.classList.remove('loading');
            // Still show the word area even if image failed
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
            // Remove loading class if still present
            wordBackground.classList.remove('loading');
        }, 3000);
    }
    
    // Legacy alias
    showWordImage() { this.displayWordImage(); }

    /**
     * Update progress bar and counter display
     */
    updateProgressDisplay() {
        const progressFillElement = document.getElementById('progress-fill');
        const hitsCounterElement = document.getElementById('hits-counter');

        const progressPercentage = (this.correctHitsCount / this.requiredHitsToComplete) * 100;
        progressFillElement.style.width = `${progressPercentage}%`;
        hitsCounterElement.textContent = this.correctHitsCount;
    }
    
    // Legacy alias
    updateProgress() { this.updateProgressDisplay(); }

    /**
     * Handle level completion
     */
    completeLevelSuccessfully() {
        console.log('🎉 Level complete!');
        this.isGameplayActive = false;
        this.audioManager.play('celebration');

        // Create celebration particle effects
        if (this.particleSystem) {
            this.particleSystem.levelComplete();
        }

        // Show success toast
        if (this.uiUtils) {
            this.uiUtils.showToast('Level Complete! Great job!', 'success', 3000);
        }

        this.displayPopup('level-complete-popup');
    }
    
    // Legacy alias
    completeLevel() { this.completeLevelSuccessfully(); }

    /**
     * Navigate to a specific game screen
     * @param {string} screenId - The screen identifier (welcome, level-select, gameplay)
     */
    navigateToScreen(screenId) {
        console.log(`🔄 Navigating to screen: ${screenId}`);

        // Get current and target screens
        const currentScreenElement = document.querySelector('.screen.active');
        const targetScreenElement = document.getElementById(`${screenId}-screen`);

        // Use smooth transition if UI utilities available
        if (this.uiUtils && currentScreenElement && targetScreenElement) {
            this.uiUtils.transitionScreens(currentScreenElement, targetScreenElement, () => {
                this.onScreenTransitionComplete(screenId);
            });
        } else {
            // Fallback to immediate transition
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });
            targetScreenElement.classList.add('active');
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
    }
    
    // Legacy alias
    showScreen(screenId) { this.navigateToScreen(screenId); }

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
            this.uiUtils.animateEntrance(overlay.querySelector('.overlay-content'), 'scaleIn');
        }
    }
    
    // Legacy alias
    showOverlay(overlayId) { this.displayOverlay(overlayId); }

    /**
     * Dismiss an overlay
     * @param {string} overlayId - The overlay element ID
     */
    dismissOverlay(overlayId) {
        console.log(`📋 Hiding overlay: ${overlayId}`);
        document.getElementById(overlayId).classList.add('hidden');
    }
    
    // Legacy alias
    hideOverlay(overlayId) { this.dismissOverlay(overlayId); }

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
            this.uiUtils.animateEntrance(popup.querySelector('.popup-content'), 'scaleIn');
        }
    }
    
    // Legacy alias
    showPopup(popupId) { this.displayPopup(popupId); }

    /**
     * Dismiss a popup modal
     * @param {string} popupId - The popup element ID
     */
    dismissPopup(popupId) {
        console.log(`💬 Hiding popup: ${popupId}`);
        document.getElementById(popupId).classList.add('hidden');
    }
    
    // Legacy alias
    hidePopup(popupId) { this.dismissPopup(popupId); }

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
        const containers = ['.planets-container', '.asteroids-container', '.explosions-container'];
        containers.forEach(selector => {
            const container = document.querySelector(selector);
            if (container) container.innerHTML = '';
        });

        // Reset UI elements
        this.updateProgressDisplay();
        document.querySelector('.word-background').classList.remove('visible');
    }
    
    // Legacy alias
    resetGame() { this.resetGameplayState(); }

    /**
     * Check if a letter is enabled for play
     * @param {string} letter - The letter to check
     * @returns {boolean} Whether the letter is enabled
     */
    isLetterEnabled(letter) {
        return this.enabledLetters.includes(letter);
    }
    
    // Legacy alias
    isCorrectLetter(letter) { return this.isLetterEnabled(letter); }
    
    // Expose letterWords for backward compatibility
    get letterWords() { return this.letterVocabulary; }
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

// Optimized debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export for testing and external access
window.GameState = GameState;

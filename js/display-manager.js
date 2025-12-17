/**
 * Display Manager for Phonics Fun
 * Handles responsive display, viewport detection, and dynamic scaling
 * Implements automatic quality adjustment based on device capabilities
 * @version 1.0.0
 */

class DisplayManager {
    constructor() {
        // Define breakpoints first
        this.breakpoints = {
            mobile: 480,
            tablet: 768,
            desktop: 1024,
            largeDesktop: 1440,
            ultraWide: 1920
        };

        this.viewport = {
            width: window.innerWidth,
            height: window.innerHeight,
            aspectRatio: window.innerWidth / window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1
        };

        this.deviceType = this.detectDeviceType();
        this.displayCategory = this.categorizeDisplay();
        this.orientation = this.detectOrientation();
        this.performanceProfile = this.detectPerformanceProfile();

        this.init();
    }

    /**
     * Initialize display manager
     */
    init() {
        console.log('📱 Initializing Display Manager...');
        console.log(`📐 Viewport: ${this.viewport.width}x${this.viewport.height}`);
        console.log(`🖥️ Device Type: ${this.deviceType}`);
        console.log(`📊 Display Category: ${this.displayCategory}`);
        console.log(`🔄 Orientation: ${this.orientation}`);
        
        this.applyDisplayOptimizations();
        this.setupEventListeners();
        this.applyDeviceSpecificStyles();
        this.optimizeForPerformance();
    }

    /**
     * Detect device type based on multiple factors
     * @returns {string} Device type (mobile, tablet, desktop, large-display)
     */
    detectDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        const width = window.innerWidth;
        const height = window.innerHeight;
        const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Check for specific device types
        if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
            if (width <= this.breakpoints.mobile || (touchSupport && Math.min(width, height) <= this.breakpoints.mobile)) {
                return 'mobile';
            } else if (width <= this.breakpoints.tablet) {
                return 'tablet';
            }
        }

        // Desktop categorization
        if (width >= this.breakpoints.ultraWide) {
            return 'large-display';
        } else if (width >= this.breakpoints.desktop) {
            return 'desktop';
        } else if (touchSupport) {
            return 'tablet';
        }

        return 'desktop';
    }

    /**
     * Categorize display for optimal rendering strategy
     * @returns {string} Display category
     */
    categorizeDisplay() {
        const { width, devicePixelRatio } = this.viewport;

        if (width >= 1920) return 'ultra-large';
        if (width >= 1440) return 'large';
        if (width >= 1024) return 'medium';
        if (width >= 768) return 'small';
        return 'extra-small';
    }

    /**
     * Detect current orientation
     * @returns {string} Orientation (portrait, landscape, square)
     */
    detectOrientation() {
        const { width, height, aspectRatio } = this.viewport;
        
        if (Math.abs(aspectRatio - 1) < 0.1) return 'square';
        return width > height ? 'landscape' : 'portrait';
    }

    /**
     * Detect device performance profile
     * @returns {string} Performance profile (high, medium, low)
     */
    detectPerformanceProfile() {
        const cores = navigator.hardwareConcurrency || 2;
        const memory = navigator.deviceMemory || 4;
        const { devicePixelRatio } = this.viewport;

        // High-end: 6+ cores, 8GB+ RAM, or high DPI
        if (cores >= 6 || memory >= 8 || devicePixelRatio >= 2) {
            return 'high';
        }
        
        // Low-end: 2 cores, 2GB RAM
        if (cores <= 2 && memory <= 2) {
            return 'low';
        }

        return 'medium';
    }

    /**
     * Apply display optimizations based on device capabilities
     */
    applyDisplayOptimizations() {
        const root = document.documentElement;
        
        // Set CSS custom properties for responsive scaling
        root.style.setProperty('--viewport-width', `${this.viewport.width}px`);
        root.style.setProperty('--viewport-height', `${this.viewport.height}px`);
        root.style.setProperty('--device-pixel-ratio', this.viewport.devicePixelRatio);
        
        // Calculate and apply dynamic font scaling
        const baseFontSize = this.calculateBaseFontSize();
        root.style.setProperty('--base-font-size', `${baseFontSize}px`);
        
        // Apply scaling factors for game elements
        const planetScale = this.calculateElementScale('planet');
        const buttonScale = this.calculateElementScale('button');
        
        root.style.setProperty('--planet-scale', planetScale);
        root.style.setProperty('--button-scale', buttonScale);
        
        // Apply device-specific classes
        document.body.classList.add(`device-${this.deviceType}`);
        document.body.classList.add(`display-${this.displayCategory}`);
        document.body.classList.add(`orientation-${this.orientation}`);
        document.body.classList.add(`performance-${this.performanceProfile}`);
    }

    /**
     * Calculate base font size based on viewport
     * @returns {number} Font size in pixels
     */
    calculateBaseFontSize() {
        const minSize = 12;
        const maxSize = 20;
        const { width } = this.viewport;
        
        // Linear interpolation between breakpoints
        if (width <= this.breakpoints.mobile) {
            return minSize;
        } else if (width >= this.breakpoints.ultraWide) {
            return maxSize;
        }
        
        const range = this.breakpoints.ultraWide - this.breakpoints.mobile;
        const progress = (width - this.breakpoints.mobile) / range;
        return minSize + (maxSize - minSize) * progress;
    }

    /**
     * Calculate scale factor for specific element types
     * @param {string} elementType - Type of element
     * @returns {number} Scale factor
     */
    calculateElementScale(elementType) {
        const { width, height } = this.viewport;
        const minDimension = Math.min(width, height);
        
        const scales = {
            planet: {
                min: 0.6,
                max: 1.4,
                referenceSize: 800
            },
            button: {
                min: 0.8,
                max: 1.2,
                referenceSize: 1200
            }
        };
        
        const config = scales[elementType] || scales.button;
        const scale = Math.min(
            config.max,
            Math.max(config.min, minDimension / config.referenceSize)
        );
        
        return scale.toFixed(3);
    }

    /**
     * Apply device-specific styles dynamically
     */
    applyDeviceSpecificStyles() {
        const styles = document.createElement('style');
        styles.id = 'display-manager-styles';
        
        styles.textContent = `
            /* Dynamic viewport-based scaling */
            .planet {
                transform: scale(var(--planet-scale, 1)) !important;
                transform-origin: center center;
            }
            
            .primary-button,
            .secondary-button {
                transform: scale(var(--button-scale, 1));
                transform-origin: center center;
            }

            /* Touch target optimization for mobile */
            .device-mobile .planet {
                min-width: 44px;
                min-height: 44px;
            }

            .device-mobile .primary-button,
            .device-mobile .secondary-button,
            .device-mobile .letter-button {
                min-width: 44px;
                min-height: 44px;
                padding: 12px 20px;
            }

            /* Tablet optimizations */
            .device-tablet .game-area {
                padding: 20px;
            }

            .device-tablet .planet {
                min-width: 60px;
                min-height: 60px;
            }

            /* Large display optimizations */
            .device-large-display .welcome-container h1 {
                font-size: clamp(3rem, 8vw, 6rem);
            }

            .device-large-display .planet {
                font-size: clamp(2rem, 3vw, 4rem);
            }

            .device-large-display .letter-button {
                width: 120px;
                height: 120px;
                font-size: 3rem;
            }

            /* Orientation-specific adjustments */
            .orientation-portrait .letter-grid {
                grid-template-columns: repeat(5, 1fr);
                gap: 12px;
            }

            .orientation-landscape .letter-grid {
                grid-template-columns: repeat(8, 1fr);
                gap: 16px;
            }

            /* Performance-based adjustments */
            .performance-low .welcome-background,
            .performance-low .galaxy-background {
                animation: none !important;
            }

            .performance-low .planet::before,
            .performance-low .planet::after {
                display: none !important;
            }

            .performance-low * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }

            .performance-high .planet {
                filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.5));
            }

            .performance-high .explosion {
                filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.8));
            }

            /* Display category adjustments */
            .display-extra-small .game-ui {
                padding: 8px;
                font-size: 0.85rem;
            }

            .display-ultra-large .game-ui {
                padding: 24px;
                font-size: 1.5rem;
            }

            /* Responsive font sizing */
            body {
                font-size: var(--base-font-size, 16px);
            }

            /* Improved touch feedback for mobile */
            .device-mobile .planet:active,
            .device-tablet .planet:active {
                transform: scale(calc(var(--planet-scale, 1) * 0.9)) !important;
                transition: transform 0.1s ease;
            }

            /* Smooth scrolling optimization */
            @media (prefers-reduced-motion: reduce) {
                * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Optimize performance based on device profile
     */
    optimizeForPerformance() {
        if (this.performanceProfile === 'low') {
            console.log('⚡ Applying low-end device optimizations...');
            
            // Disable expensive animations
            document.body.classList.add('low-memory');
            
            // Reduce particle effects
            if (window.game && window.game.particleSystem) {
                window.game.particleSystem.maxParticles = 20;
            }
        } else if (this.performanceProfile === 'high') {
            console.log('🚀 Enabling high-performance features...');
            
            // Enable enhanced visual effects
            document.body.classList.add('high-performance');
        }
    }

    /**
     * Setup event listeners for viewport changes
     */
    setupEventListeners() {
        // Debounced resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleViewportChange();
            }, 250);
        });

        // Orientation change handler
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Visibility change handler (mobile browser optimization)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseExpensiveOperations();
            } else {
                this.resumeExpensiveOperations();
            }
        });
    }

    /**
     * Handle viewport size changes
     */
    handleViewportChange() {
        console.log('📐 Viewport changed');
        
        // Update viewport metrics
        this.viewport.width = window.innerWidth;
        this.viewport.height = window.innerHeight;
        this.viewport.aspectRatio = this.viewport.width / this.viewport.height;
        
        // Re-detect device type and display category
        const previousDeviceType = this.deviceType;
        this.deviceType = this.detectDeviceType();
        this.displayCategory = this.categorizeDisplay();
        
        // Update if device type changed (e.g., tablet rotated to desktop size)
        if (previousDeviceType !== this.deviceType) {
            document.body.classList.remove(`device-${previousDeviceType}`);
            document.body.classList.add(`device-${this.deviceType}`);
        }
        
        // Reapply optimizations
        this.applyDisplayOptimizations();
        
        // Notify game of viewport change
        if (window.game) {
            window.dispatchEvent(new CustomEvent('displaychange', {
                detail: {
                    viewport: this.viewport,
                    deviceType: this.deviceType,
                    displayCategory: this.displayCategory
                }
            }));
        }
    }

    /**
     * Handle orientation changes
     */
    handleOrientationChange() {
        console.log('🔄 Orientation changed');
        
        const previousOrientation = this.orientation;
        this.orientation = this.detectOrientation();
        
        document.body.classList.remove(`orientation-${previousOrientation}`);
        document.body.classList.add(`orientation-${this.orientation}`);
        
        // Force layout recalculation
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            gameArea.style.display = 'none';
            void gameArea.offsetHeight; // Trigger reflow
            gameArea.style.display = '';
        }
    }

    /**
     * Pause expensive operations when page is hidden
     */
    pauseExpensiveOperations() {
        console.log('⏸️ Pausing expensive operations');
        
        // Pause animations
        document.querySelectorAll('.welcome-planet, .welcome-asteroid').forEach(el => {
            el.style.animationPlayState = 'paused';
        });
    }

    /**
     * Resume operations when page is visible
     */
    resumeExpensiveOperations() {
        console.log('▶️ Resuming operations');
        
        // Resume animations
        document.querySelectorAll('.welcome-planet, .welcome-asteroid').forEach(el => {
            el.style.animationPlayState = 'running';
        });
    }

    /**
     * Get current display information
     * @returns {Object} Display information
     */
    getDisplayInfo() {
        return {
            viewport: this.viewport,
            deviceType: this.deviceType,
            displayCategory: this.displayCategory,
            orientation: this.orientation,
            performanceProfile: this.performanceProfile,
            breakpoints: this.breakpoints
        };
    }

    /**
     * Check if current viewport matches a breakpoint
     * @param {string} breakpoint - Breakpoint name
     * @returns {boolean} Whether viewport matches
     */
    matchesBreakpoint(breakpoint) {
        const minWidth = this.breakpoints[breakpoint];
        return this.viewport.width >= minWidth;
    }

    /**
     * Clean up display manager
     */
    destroy() {
        const styles = document.getElementById('display-manager-styles');
        if (styles) styles.remove();
        
        // Remove event listeners would go here if we stored references
        console.log('🧹 Display Manager cleaned up');
    }
}

// Export for global use
window.DisplayManager = DisplayManager;

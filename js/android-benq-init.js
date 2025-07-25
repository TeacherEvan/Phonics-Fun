/**
 * Android BenQ Board Initialization Script
 * Handles specific compatibility issues for BenQ Android displays
 * Author: GitHub Copilot
 */

class AndroidBenQInitializer {
    constructor() {
        this.isAndroid = /Android/i.test(navigator.userAgent);
        this.isBenQ = /BenQ/i.test(navigator.userAgent) || this.detectBenQBoard();
        this.init();
    }

    init() {
        if (this.isAndroid) {
            console.log('🤖 Android device detected, initializing compatibility fixes...');
            this.applyAndroidFixes();
        }
        
        if (this.isBenQ) {
            console.log('📺 BenQ board detected, applying specific fixes...');
            this.applyBenQFixes();
        }
        
        this.setupAudioCompatibility();
        this.setupTouchOptimization();
        this.setupPerformanceOptimization();
        this.setupErrorHandling();
    }

    detectBenQBoard() {
        // Check for BenQ-specific characteristics
        const screenRatio = screen.width / screen.height;
        const hasLargeScreen = screen.width >= 1920 || screen.height >= 1080;
        const hasSpecificResolution = (screen.width === 1920 && screen.height === 1080) || 
                                     (screen.width === 3840 && screen.height === 2160);
        
        // BenQ boards often have specific screen characteristics
        return hasLargeScreen && hasSpecificResolution;
    }

    applyAndroidFixes() {
        // Fix viewport issues
        this.fixViewport();
        
        // Fix touch events
        this.fixTouchEvents();
        
        // Fix audio autoplay
        this.fixAudioAutoplay();
        
        // Fix orientation issues
        this.fixOrientation();
        
        // Fix performance issues
        this.fixPerformance();
    }

    applyBenQFixes() {
        // BenQ-specific fixes
        this.fixBenQTouch();
        this.fixBenQAudio();
        this.fixBenQDisplay();
    }

    fixViewport() {
        // Ensure viewport is properly set for Android
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, minimal-ui';
        
        // Add Android-specific meta tags
        const androidMeta = document.createElement('meta');
        androidMeta.name = 'mobile-web-app-capable';
        androidMeta.content = 'yes';
        document.head.appendChild(androidMeta);
    }

    fixTouchEvents() {
        // Add touch event polyfill for older Android versions
        if (!window.TouchEvent) {
            console.log('Adding TouchEvent polyfill for older Android');
            // Basic TouchEvent polyfill
            window.TouchEvent = function(type, eventInit) {
                const event = document.createEvent('Event');
                event.initEvent(type, true, true);
                event.touches = eventInit.touches || [];
                event.changedTouches = eventInit.changedTouches || [];
                event.targetTouches = eventInit.targetTouches || [];
                return event;
            };
        }

        // Fix touch delay issues
        this.fixTouchDelay();
    }

    fixTouchDelay() {
        // Implement FastClick-like functionality for Android
        const gameElements = document.querySelectorAll('.planet, .primary-button, .secondary-button');
        
        gameElements.forEach(element => {
            let touchStartTime = 0;
            let touchMoved = false;
            
            element.addEventListener('touchstart', (e) => {
                touchStartTime = Date.now();
                touchMoved = false;
            }, { passive: false });
            
            element.addEventListener('touchmove', (e) => {
                touchMoved = true;
            }, { passive: false });
            
            element.addEventListener('touchend', (e) => {
                const touchDuration = Date.now() - touchStartTime;
                
                if (!touchMoved && touchDuration < 300) {
                    // Simulate a click event
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    
                    element.dispatchEvent(clickEvent);
                }
            }, { passive: false });
        });
    }

    fixAudioAutoplay() {
        // Handle Android audio autoplay restrictions
        const audioElements = document.querySelectorAll('audio');
        
        audioElements.forEach(audio => {
            audio.addEventListener('play', () => {
                console.log(`Audio element ${audio.id} attempting to play`);
            });
            
            audio.addEventListener('error', (e) => {
                console.error(`Audio element ${audio.id} error:`, e);
            });
        });

        // Create user interaction handler for audio
        const enableAudioOnInteraction = () => {
            console.log('User interaction detected, enabling audio...');
            
            // Try to play and immediately pause each audio element
            audioElements.forEach(audio => {
                audio.play().then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                }).catch(error => {
                    console.log(`Audio ${audio.id} initialization failed:`, error);
                });
            });
            
            // Remove the event listeners after first interaction
            document.removeEventListener('touchstart', enableAudioOnInteraction);
            document.removeEventListener('click', enableAudioOnInteraction);
        };
        
        // Add event listeners for first user interaction
        document.addEventListener('touchstart', enableAudioOnInteraction, { once: true });
        document.addEventListener('click', enableAudioOnInteraction, { once: true });
    }

    fixOrientation() {
        // Handle orientation changes properly
        const handleOrientationChange = () => {
            setTimeout(() => {
                // Force a repaint
                document.body.style.display = 'none';
                document.body.offsetHeight; // Trigger reflow
                document.body.style.display = '';
                
                // Dispatch custom event
                window.dispatchEvent(new CustomEvent('orientationFixed'));
            }, 100);
        };
        
        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);
    }

    fixPerformance() {
        // Optimize performance for Android
        if (this.isAndroid) {
            // Reduce animation complexity
            document.documentElement.style.setProperty('--animation-duration', '0.2s');
            
            // Disable some visual effects on lower-end devices
            const isLowEnd = navigator.hardwareConcurrency <= 2;
            if (isLowEnd) {
                document.documentElement.classList.add('low-end-device');
            }
        }
    }

    fixBenQTouch() {
        console.log('Applying BenQ-specific touch fixes...');
        
        // BenQ boards sometimes have touch calibration issues
        const touchArea = document.querySelector('.game-area');
        if (touchArea) {
            touchArea.style.touchAction = 'none';
            touchArea.style.userSelect = 'none';
            touchArea.style.webkitUserSelect = 'none';
            touchArea.style.mozUserSelect = 'none';
            touchArea.style.msUserSelect = 'none';
        }
        
        // Increase touch target sizes for BenQ boards
        const style = document.createElement('style');
        style.textContent = `
            @media (min-width: 1920px) {
                .planet {
                    width: 120px !important;
                    height: 120px !important;
                }
                .primary-button, .secondary-button {
                    padding: 20px 40px !important;
                    font-size: 1.2em !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    fixBenQAudio() {
        console.log('Applying BenQ-specific audio fixes...');
        
        // BenQ boards may have different audio requirements
        const audioElements = document.querySelectorAll('audio');
        
        audioElements.forEach(audio => {
            audio.preload = 'auto';
            audio.volume = 0.8; // Slightly lower volume for board speakers
            
            // Add error handling specific to BenQ boards
            audio.addEventListener('error', (e) => {
                console.error('BenQ audio error:', e);
                // Try to reload the audio
                setTimeout(() => {
                    audio.load();
                }, 1000);
            });
        });
    }

    fixBenQDisplay() {
        console.log('Applying BenQ-specific display fixes...');
        
        // Optimize for large displays
        const isLargeDisplay = screen.width >= 1920;
        if (isLargeDisplay) {
            document.documentElement.classList.add('large-display');
            
            // Add CSS for large displays
            const style = document.createElement('style');
            style.textContent = `
                .large-display {
                    font-size: 1.2em;
                }
                .large-display .welcome-container h1 {
                    font-size: 3em;
                }
                .large-display .game-area {
                    transform: scale(1.1);
                }
            `;
            document.head.appendChild(style);
        }
    }

    setupAudioCompatibility() {
        // Web Audio API compatibility
        if (typeof AudioContext === 'undefined' && typeof webkitAudioContext !== 'undefined') {
            window.AudioContext = webkitAudioContext;
        }
        
        // Handle audio context suspension (common on mobile)
        if (typeof AudioContext !== 'undefined') {
            const resumeAudioContext = () => {
                if (window.audioContext && window.audioContext.state === 'suspended') {
                    window.audioContext.resume();
                }
            };
            
            document.addEventListener('touchstart', resumeAudioContext, { once: true });
            document.addEventListener('click', resumeAudioContext, { once: true });
        }
    }

    setupTouchOptimization() {
        // Optimize touch events for better performance
        const optimizeTouchEvents = () => {
            const gameArea = document.querySelector('.game-area');
            if (gameArea) {
                // Use passive event listeners where possible
                gameArea.addEventListener('touchstart', (e) => {
                    // Only prevent default if necessary
                    if (e.target.classList.contains('planet')) {
                        e.preventDefault();
                    }
                }, { passive: false });
            }
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', optimizeTouchEvents);
        } else {
            optimizeTouchEvents();
        }
    }

    setupPerformanceOptimization() {
        // Monitor performance and adjust accordingly
        if (window.performance && window.performance.memory) {
            const checkMemory = () => {
                const memory = window.performance.memory;
                const memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
                
                if (memoryUsage > 0.8) {
                    console.warn('High memory usage detected, optimizing...');
                    this.optimizeForLowMemory();
                }
            };
            
            setInterval(checkMemory, 30000); // Check every 30 seconds
        }
    }

    optimizeForLowMemory() {
        // Reduce visual effects and animations
        document.documentElement.classList.add('low-memory');
        
        // Add CSS for low memory mode
        const style = document.createElement('style');
        style.textContent = `
            .low-memory * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }
            .low-memory .welcome-background {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    setupErrorHandling() {
        // Global error handler for Android-specific issues
        window.addEventListener('error', (event) => {
            console.error('Android compatibility error:', event.error);
            
            // Handle specific Android errors
            if (event.error.message.includes('Audio')) {
                console.log('Audio error detected, attempting to recover...');
                this.recoverAudio();
            }
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            // Don't let audio playback failures crash the game
            if (event.reason.toString().includes('play') || event.reason.toString().includes('audio')) {
                event.preventDefault();
                console.log('Audio playback error handled gracefully');
            }
        });
    }

    recoverAudio() {
        // Attempt to recover from audio errors
        const audioElements = document.querySelectorAll('audio');
        
        audioElements.forEach(audio => {
            audio.load();
        });
        
        // Reinitialize audio manager if available
        if (window.audioManager) {
            setTimeout(() => {
                window.audioManager.init();
            }, 1000);
        }
    }

    // Method to test current compatibility
    runCompatibilityTest() {
        const results = {
            isAndroid: this.isAndroid,
            isBenQ: this.isBenQ,
            touchSupport: 'ontouchstart' in window,
            audioSupport: !!window.Audio,
            webAudioSupport: !!(window.AudioContext || window.webkitAudioContext),
            screenSize: `${screen.width}x${screen.height}`,
            devicePixelRatio: window.devicePixelRatio || 1,
            userAgent: navigator.userAgent
        };
        
        console.log('🧪 Android BenQ Compatibility Test Results:', results);
        return results;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.androidBenQInitializer = new AndroidBenQInitializer();
    
    // Run compatibility test
    window.androidBenQInitializer.runCompatibilityTest();
});

// Export for global use
window.AndroidBenQInitializer = AndroidBenQInitializer;

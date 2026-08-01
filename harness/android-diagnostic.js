/**
 * Android Compatibility Diagnostic Script
 * This script analyzes the Phonics Fun game for potential Android compatibility issues
 * Author: GitHub Copilot
 */

class AndroidCompatibilityDiagnostic {
    constructor() {
        this.issues = [];
        this.recommendations = [];
        this.testResults = {};
        this.init();
    }

    init() {
        console.log('🔍 Starting Android Compatibility Diagnostic...');
        this.runAllTests();
        this.generateReport();
    }

    runAllTests() {
        this.testTouchEventHandling();
        this.testAudioCompatibility();
        this.testViewportAndScaling();
        this.testPerformanceRequirements();
        this.testAssetLoading();
        this.testBrowserFeatures();
        this.testGameSpecificFeatures();
        this.testBenQSpecificIssues();
    }

    testTouchEventHandling() {
        console.log('Testing touch event handling...');
        
        // Check if touch events are properly prevented from causing scroll
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            const hasPreventDefault = gameArea.style.touchAction === 'none' || 
                                     gameArea.style.touchAction === 'manipulation';
            
            if (!hasPreventDefault) {
                this.issues.push({
                    type: 'touch',
                    severity: 'high',
                    message: 'Game area should have touch-action CSS property to prevent scrolling',
                    solution: 'Add "touch-action: none;" to .game-area CSS'
                });
            }
        }

        // Check for proper touch event listeners
        const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!touchSupported) {
            this.issues.push({
                type: 'touch',
                severity: 'medium',
                message: 'Touch events not supported on this device',
                solution: 'Ensure mouse events are properly implemented as fallback'
            });
        }

        this.testResults.touch = touchSupported;
    }

    testAudioCompatibility() {
        console.log('Testing audio compatibility...');
        
        // Test Web Audio API
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            this.testResults.webAudio = true;
            audioContext.close();
        } catch (e) {
            this.issues.push({
                type: 'audio',
                severity: 'high',
                message: 'Web Audio API not supported',
                solution: 'Implement HTML5 Audio fallback'
            });
            this.testResults.webAudio = false;
        }

        // Test HTML5 Audio
        const audio = document.createElement('audio');
        const canPlayWav = audio.canPlayType('audio/wav');
        const canPlayMp3 = audio.canPlayType('audio/mpeg');
        
        if (!canPlayWav && !canPlayMp3) {
            this.issues.push({
                type: 'audio',
                severity: 'critical',
                message: 'No supported audio formats found',
                solution: 'Add additional audio format support (OGG, M4A)'
            });
        }

        this.testResults.audioFormats = { wav: canPlayWav, mp3: canPlayMp3 };

        // Test autoplay policy
        const testAudio = document.createElement('audio');
        testAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBC2S0e3EdCYILHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBC2S0e3EdCYILHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBC2S0e3EdCYI';
        testAudio.play().catch(() => {
            this.issues.push({
                type: 'audio',
                severity: 'medium',
                message: 'Audio autoplay blocked - user interaction required',
                solution: 'Implement user interaction before playing audio'
            });
        });
    }

    testViewportAndScaling() {
        console.log('Testing viewport and scaling...');
        
        // Check viewport meta tag
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
            this.issues.push({
                type: 'viewport',
                severity: 'high',
                message: 'Missing viewport meta tag',
                solution: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">'
            });
        } else {
            const content = viewportMeta.getAttribute('content');
            if (!content.includes('user-scalable=no')) {
                this.issues.push({
                    type: 'viewport',
                    severity: 'medium',
                    message: 'Viewport allows user scaling',
                    solution: 'Add user-scalable=no to viewport meta tag'
                });
            }
        }

        // Check for responsive design
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        if (screenWidth < 768) {
            this.recommendations.push({
                type: 'responsive',
                message: 'Small screen detected - ensure game elements are appropriately sized',
                solution: 'Implement responsive design with CSS media queries'
            });
        }

        this.testResults.viewport = {
            width: screenWidth,
            height: screenHeight,
            devicePixelRatio: window.devicePixelRatio || 1
        };
    }

    testPerformanceRequirements() {
        console.log('Testing performance requirements...');
        
        // Test requestAnimationFrame support
        if (!window.requestAnimationFrame) {
            this.issues.push({
                type: 'performance',
                severity: 'high',
                message: 'requestAnimationFrame not supported',
                solution: 'Add requestAnimationFrame polyfill'
            });
        }

        // Test memory usage (if available)
        if (performance.memory) {
            const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
            if (memoryUsage > 100) {
                this.issues.push({
                    type: 'performance',
                    severity: 'medium',
                    message: `High memory usage detected: ${memoryUsage.toFixed(2)}MB`,
                    solution: 'Optimize memory usage, implement object pooling'
                });
            }
            this.testResults.memory = memoryUsage;
        }

        // Test for hardware acceleration
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        this.testResults.webgl = !!gl;
        
        if (!gl) {
            this.recommendations.push({
                type: 'performance',
                message: 'WebGL not supported - falling back to 2D canvas',
                solution: 'Consider optimizing 2D canvas performance'
            });
        }
    }

    testAssetLoading() {
        console.log('Testing asset loading...');
        
        // Test for proper asset preloading
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach((audio, index) => {
            if (audio.preload !== 'auto' && audio.preload !== 'metadata') {
                this.recommendations.push({
                    type: 'assets',
                    message: `Audio element ${index} should have preload="auto" for better performance`,
                    solution: 'Add preload="auto" to audio elements'
                });
            }
        });

        // Test for image optimization
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
            if (!img.loading) {
                this.recommendations.push({
                    type: 'assets',
                    message: `Image ${index} should have loading="lazy" for better performance`,
                    solution: 'Add loading="lazy" to non-critical images'
                });
            }
        });
    }

    testBrowserFeatures() {
        console.log('Testing browser features...');
        
        const features = {
            localStorage: typeof(Storage) !== 'undefined',
            sessionStorage: typeof(sessionStorage) !== 'undefined',
            canvas: !!document.createElement('canvas').getContext,
            webAudio: !!(window.AudioContext || window.webkitAudioContext),
            touch: 'ontouchstart' in window,
            orientation: 'orientation' in window,
            deviceMotion: 'DeviceMotionEvent' in window,
            fullscreen: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled)
        };

        Object.entries(features).forEach(([feature, supported]) => {
            if (!supported) {
                this.issues.push({
                    type: 'browser',
                    severity: 'medium',
                    message: `${feature} not supported`,
                    solution: `Implement fallback for ${feature}`
                });
            }
        });

        this.testResults.browserFeatures = features;
    }

    testGameSpecificFeatures() {
        console.log('Testing game-specific features...');
        
        // Test for game classes
        const gameClasses = ['GameState', 'AudioManager', 'EventManager', 'CollisionManager'];
        gameClasses.forEach(className => {
            if (typeof window[className] === 'undefined') {
                this.issues.push({
                    type: 'game',
                    severity: 'medium',
                    message: `${className} not found in global scope`,
                    solution: `Ensure ${className} is properly loaded`
                });
            }
        });

        // Test for required DOM elements
        const requiredElements = ['#welcome-screen', '#gameplay-screen', '#level-select-screen'];
        requiredElements.forEach(selector => {
            if (!document.querySelector(selector)) {
                this.issues.push({
                    type: 'game',
                    severity: 'high',
                    message: `Required element ${selector} not found`,
                    solution: `Add ${selector} element to HTML`
                });
            }
        });
    }

    testBenQSpecificIssues() {
        console.log('Testing BenQ Android board specific issues...');
        
        // Test for common BenQ Android issues
        const userAgent = navigator.userAgent;
        
        // Check for Android version
        const androidMatch = userAgent.match(/Android (\d+)/);
        if (androidMatch) {
            const androidVersion = parseInt(androidMatch[1]);
            if (androidVersion < 7) {
                this.issues.push({
                    type: 'benq',
                    severity: 'high',
                    message: `Old Android version detected: ${androidVersion}`,
                    solution: 'Test thoroughly on older Android versions, consider polyfills'
                });
            }
        }

        // Test for Chrome version (BenQ boards often use Chrome)
        const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
        if (chromeMatch) {
            const chromeVersion = parseInt(chromeMatch[1]);
            if (chromeVersion < 70) {
                this.issues.push({
                    type: 'benq',
                    severity: 'medium',
                    message: `Old Chrome version detected: ${chromeVersion}`,
                    solution: 'Consider using polyfills for newer JavaScript features'
                });
            }
        }

        // Test screen resolution (BenQ boards often have specific resolutions)
        const screenWidth = screen.width;
        const screenHeight = screen.height;
        
        if (screenWidth >= 1920 && screenHeight >= 1080) {
            this.recommendations.push({
                type: 'benq',
                message: 'High resolution display detected - ensure UI elements are appropriately sized',
                solution: 'Use em/rem units and scalable graphics'
            });
        }

        // Test for touch precision issues
        if ('ontouchstart' in window) {
            this.recommendations.push({
                type: 'benq',
                message: 'Touch display detected - ensure touch targets are at least 44px',
                solution: 'Increase button sizes and add touch feedback'
            });
        }
    }

    generateReport() {
        console.log('\n🎯 ANDROID COMPATIBILITY DIAGNOSTIC REPORT\n');
        console.log('=' .repeat(50));
        
        // Summary
        console.log(`\n📊 SUMMARY:`);
        console.log(`   Critical Issues: ${this.issues.filter(i => i.severity === 'critical').length}`);
        console.log(`   High Priority: ${this.issues.filter(i => i.severity === 'high').length}`);
        console.log(`   Medium Priority: ${this.issues.filter(i => i.severity === 'medium').length}`);
        console.log(`   Recommendations: ${this.recommendations.length}`);
        
        // Critical Issues
        const criticalIssues = this.issues.filter(i => i.severity === 'critical');
        if (criticalIssues.length > 0) {
            console.log(`\n🚨 CRITICAL ISSUES:`);
            criticalIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue.message}`);
                console.log(`      💡 Solution: ${issue.solution}`);
            });
        }

        // High Priority Issues
        const highIssues = this.issues.filter(i => i.severity === 'high');
        if (highIssues.length > 0) {
            console.log(`\n⚠️  HIGH PRIORITY ISSUES:`);
            highIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue.message}`);
                console.log(`      💡 Solution: ${issue.solution}`);
            });
        }

        // Medium Priority Issues
        const mediumIssues = this.issues.filter(i => i.severity === 'medium');
        if (mediumIssues.length > 0) {
            console.log(`\n⚡ MEDIUM PRIORITY ISSUES:`);
            mediumIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue.message}`);
                console.log(`      💡 Solution: ${issue.solution}`);
            });
        }

        // Recommendations
        if (this.recommendations.length > 0) {
            console.log(`\n💡 RECOMMENDATIONS:`);
            this.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec.message}`);
                console.log(`      💡 Solution: ${rec.solution}`);
            });
        }

        // Test Results
        console.log(`\n📋 TEST RESULTS:`);
        console.log(`   Touch Support: ${this.testResults.touch ? '✅' : '❌'}`);
        console.log(`   Web Audio API: ${this.testResults.webAudio ? '✅' : '❌'}`);
        console.log(`   WebGL Support: ${this.testResults.webgl ? '✅' : '❌'}`);
        
        if (this.testResults.audioFormats) {
            console.log(`   WAV Support: ${this.testResults.audioFormats.wav ? '✅' : '❌'}`);
            console.log(`   MP3 Support: ${this.testResults.audioFormats.mp3 ? '✅' : '❌'}`);
        }
        
        if (this.testResults.memory) {
            console.log(`   Memory Usage: ${this.testResults.memory.toFixed(2)}MB`);
        }
        
        if (this.testResults.viewport) {
            console.log(`   Viewport: ${this.testResults.viewport.width}x${this.testResults.viewport.height}`);
            console.log(`   Device Pixel Ratio: ${this.testResults.viewport.devicePixelRatio}`);
        }

        console.log('\n🔧 SPECIFIC FIXES FOR PHONICS FUN:');
        this.generateSpecificFixes();
        
        console.log('\n✅ Diagnostic complete! Check the issues above and implement the suggested solutions.');
    }

    generateSpecificFixes() {
        const fixes = [
            {
                file: 'css/styles.css',
                fix: 'Add touch-action: none; to .game-area and .planet classes to prevent scrolling',
                priority: 'high'
            },
            {
                file: 'js/audio-manager.js',
                fix: 'Add user interaction check before playing audio to comply with autoplay policies',
                priority: 'high'
            },
            {
                file: 'js/main.js',
                fix: 'Add passive: false to touch event listeners to ensure preventDefault works',
                priority: 'medium'
            },
            {
                file: 'index.html',
                fix: 'Add preload="auto" to all audio elements for better performance',
                priority: 'medium'
            },
            {
                file: 'js/event-manager.js',
                fix: 'Add touch event debouncing to prevent multiple rapid touches',
                priority: 'medium'
            }
        ];

        fixes.forEach((fix, index) => {
            const priority = fix.priority === 'high' ? '🔴' : fix.priority === 'medium' ? '🟡' : '🟢';
            console.log(`   ${priority} ${fix.file}:`);
            console.log(`      ${fix.fix}`);
        });
    }

    // Method to export detailed report
    exportDetailedReport() {
        const report = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screen: {
                width: screen.width,
                height: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            issues: this.issues,
            recommendations: this.recommendations,
            testResults: this.testResults
        };

        const jsonReport = JSON.stringify(report, null, 2);
        
        // Create downloadable file
        const blob = new Blob([jsonReport], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `android-compatibility-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('📄 Detailed report exported as JSON file');
    }
}

// Auto-run diagnostic when script is loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const diagnostic = new AndroidCompatibilityDiagnostic();
        
        // Add export button to page if it exists
        const exportBtn = document.getElementById('export-diagnostic');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                diagnostic.exportDetailedReport();
            });
        }
    }, 1000);
});

// Make diagnostic available globally
window.AndroidCompatibilityDiagnostic = AndroidCompatibilityDiagnostic;

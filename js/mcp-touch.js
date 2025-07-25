/**
 * MCP Touch Diagnostic Tool
 * This utility diagnoses touch input issues on Android devices
 * Author: GitHub Copilot
 * Date: July 16, 2025
 */

class MCPTouchDiagnostic {
    constructor() {
        this.testResults = {
            touchSupport: false,
            multiTouchSupport: false,
            touchLatency: 0,
            preventDefaultWorking: false,
            ghostClickPrevention: false,
            touchPoints: 0,
            touchListeners: {
                touchstart: false,
                touchmove: false,
                touchend: false,
                touchcancel: false
            },
            mouseListeners: {
                mousedown: false,
                mousemove: false,
                mouseup: false,
                click: false
            }
        };
        
        this.touchTimestamps = [];
        this.touchResponses = [];
        this.testElement = null;
        this.diagnosticRunning = false;
    }

    /**
     * Run a comprehensive touch diagnostic
     * @returns {Promise} Promise that resolves with test results
     */
    async runDiagnostic() {
        console.log('[MCP Touch] Starting touch diagnostic...');
        this.diagnosticRunning = true;
        
        try {
            this.checkTouchSupport();
            await this.createTestElement();
            await this.testPreventDefault();
            await this.testGhostClicks();
            
            console.log('[MCP Touch] Touch diagnostic complete, results:', this.testResults);
            this.diagnosticRunning = false;
            return this.testResults;
        } catch (error) {
            console.error('[MCP Touch] Diagnostic failed:', error);
            this.diagnosticRunning = false;
            throw error;
        }
    }

    /**
     * Check basic touch support
     */
    checkTouchSupport() {
        console.log('[MCP Touch] Checking touch support...');
        
        // Check for touch support
        this.testResults.touchSupport = 'ontouchstart' in window || 
                                        navigator.maxTouchPoints > 0 || 
                                        navigator.msMaxTouchPoints > 0;
        
        // Check for multi-touch support
        this.testResults.multiTouchSupport = navigator.maxTouchPoints > 1 || 
                                             navigator.msMaxTouchPoints > 1;
        
        // Get maximum touch points
        this.testResults.touchPoints = navigator.maxTouchPoints || 
                                      navigator.msMaxTouchPoints || 
                                      0;
        
        console.log(`[MCP Touch] Touch support: ${this.testResults.touchSupport}`);
        console.log(`[MCP Touch] Multi-touch support: ${this.testResults.multiTouchSupport}`);
        console.log(`[MCP Touch] Max touch points: ${this.testResults.touchPoints}`);
    }

    /**
     * Create a test element for touch interactions
     */
    async createTestElement() {
        console.log('[MCP Touch] Creating test element...');
        
        return new Promise((resolve) => {
            // Create test element
            this.testElement = document.createElement('div');
            this.testElement.style.position = 'fixed';
            this.testElement.style.top = '50%';
            this.testElement.style.left = '50%';
            this.testElement.style.transform = 'translate(-50%, -50%)';
            this.testElement.style.width = '200px';
            this.testElement.style.height = '200px';
            this.testElement.style.backgroundColor = 'rgba(0, 128, 255, 0.5)';
            this.testElement.style.border = '2px solid blue';
            this.testElement.style.borderRadius = '10px';
            this.testElement.style.zIndex = '9999';
            this.testElement.style.display = 'flex';
            this.testElement.style.alignItems = 'center';
            this.testElement.style.justifyContent = 'center';
            this.testElement.style.color = 'white';
            this.testElement.style.fontFamily = 'Arial, sans-serif';
            this.testElement.style.fontSize = '16px';
            this.testElement.style.textAlign = 'center';
            this.testElement.style.boxSizing = 'border-box';
            this.testElement.style.padding = '20px';
            
            this.testElement.innerHTML = 'Touch Test Area<br>Please tap this area';
            
            // Attach to document temporarily
            document.body.appendChild(this.testElement);
            
            // Set up event listeners
            let touchInteractionDetected = false;
            
            const touchstartHandler = (e) => {
                this.testResults.touchListeners.touchstart = true;
                this.touchTimestamps.push(performance.now());
                this.testElement.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
                this.testElement.innerHTML = 'Touch detected!<br>Release to continue';
                touchInteractionDetected = true;
            };
            
            const touchmoveHandler = (e) => {
                this.testResults.touchListeners.touchmove = true;
            };
            
            const touchendHandler = (e) => {
                this.testResults.touchListeners.touchend = true;
                const now = performance.now();
                this.touchResponses.push(now);
                
                // Calculate latency if we have matching timestamps
                if (this.touchTimestamps.length > 0) {
                    const latency = now - this.touchTimestamps[this.touchTimestamps.length - 1];
                    this.testResults.touchLatency = Math.round(latency);
                    console.log(`[MCP Touch] Touch latency: ${latency.toFixed(2)}ms`);
                }
                
                this.testElement.style.backgroundColor = 'rgba(0, 128, 255, 0.5)';
                this.testElement.innerHTML = 'Touch Test Complete';
                
                // If we've detected a touch interaction, resolve after a short delay
                if (touchInteractionDetected) {
                    setTimeout(() => {
                        resolve();
                    }, 500);
                }
            };
            
            const touchcancelHandler = (e) => {
                this.testResults.touchListeners.touchcancel = true;
            };
            
            const mousedownHandler = (e) => {
                this.testResults.mouseListeners.mousedown = true;
            };
            
            const mousemoveHandler = (e) => {
                this.testResults.mouseListeners.mousemove = true;
            };
            
            const mouseupHandler = (e) => {
                this.testResults.mouseListeners.mouseup = true;
            };
            
            const clickHandler = (e) => {
                this.testResults.mouseListeners.click = true;
                
                // If no touch detected yet, use mouse events as fallback
                if (!touchInteractionDetected) {
                    this.testElement.style.backgroundColor = 'rgba(255, 165, 0, 0.5)';
                    this.testElement.innerHTML = 'Mouse click detected<br>(no touch events)';
                    setTimeout(() => {
                        resolve();
                    }, 500);
                }
            };
            
            // Add event listeners
            this.testElement.addEventListener('touchstart', touchstartHandler);
            this.testElement.addEventListener('touchmove', touchmoveHandler);
            this.testElement.addEventListener('touchend', touchendHandler);
            this.testElement.addEventListener('touchcancel', touchcancelHandler);
            this.testElement.addEventListener('mousedown', mousedownHandler);
            this.testElement.addEventListener('mousemove', mousemoveHandler);
            this.testElement.addEventListener('mouseup', mouseupHandler);
            this.testElement.addEventListener('click', clickHandler);
            
            // Timeout to resolve even if no interaction
            setTimeout(() => {
                if (!touchInteractionDetected && !this.testResults.mouseListeners.click) {
                    this.testElement.innerHTML = 'No interaction detected';
                    resolve();
                }
            }, 10000);
        });
    }

    /**
     * Test preventDefault functionality
     */
    async testPreventDefault() {
        console.log('[MCP Touch] Testing preventDefault...');
        
        return new Promise((resolve) => {
            if (!this.testElement) {
                console.warn('[MCP Touch] Test element not created');
                resolve();
                return;
            }
            
            // Update test element
            this.testElement.innerHTML = 'Testing preventDefault<br>Please tap and drag up/down';
            this.testElement.style.backgroundColor = 'rgba(255, 128, 0, 0.5)';
            
            // Store initial scroll position
            const initialScrollY = window.scrollY;
            let scrollChanged = false;
            let testStarted = false;
            
            // Add a touchstart listener with preventDefault
            const touchstartHandler = (e) => {
                e.preventDefault();
                testStarted = true;
                this.testElement.innerHTML = 'Drag up/down<br>Try to scroll the page';
            };
            
            const touchmoveHandler = (e) => {
                e.preventDefault();
            };
            
            // Check if scroll position changes
            const scrollHandler = () => {
                if (testStarted && Math.abs(window.scrollY - initialScrollY) > 10) {
                    scrollChanged = true;
                }
            };
            
            // Add listeners
            this.testElement.addEventListener('touchstart', touchstartHandler, { passive: false });
            this.testElement.addEventListener('touchmove', touchmoveHandler, { passive: false });
            window.addEventListener('scroll', scrollHandler);
            
            // Complete the test after a timeout
            setTimeout(() => {
                // Remove listeners
                this.testElement.removeEventListener('touchstart', touchstartHandler);
                this.testElement.removeEventListener('touchmove', touchmoveHandler);
                window.removeEventListener('scroll', scrollHandler);
                
                this.testResults.preventDefaultWorking = !scrollChanged && testStarted;
                
                console.log(`[MCP Touch] preventDefault ${this.testResults.preventDefaultWorking ? 'working' : 'not working'}`);
                
                this.testElement.style.backgroundColor = 'rgba(0, 128, 255, 0.5)';
                this.testElement.innerHTML = 'preventDefault test complete';
                
                resolve();
            }, 5000);
        });
    }

    /**
     * Test ghost click prevention
     */
    async testGhostClicks() {
        console.log('[MCP Touch] Testing ghost click prevention...');
        
        return new Promise((resolve) => {
            if (!this.testElement) {
                console.warn('[MCP Touch] Test element not created');
                resolve();
                return;
            }
            
            // Update test element
            this.testElement.innerHTML = 'Testing ghost clicks<br>Please tap this area';
            this.testElement.style.backgroundColor = 'rgba(128, 0, 255, 0.5)';
            
            let touchEndTime = 0;
            let clickTime = 0;
            let touchDetected = false;
            let clickDetected = false;
            
            // Add event listeners
            const touchendHandler = (e) => {
                touchEndTime = performance.now();
                touchDetected = true;
                this.testElement.innerHTML = 'Touch detected<br>Waiting for potential click...';
            };
            
            const clickHandler = (e) => {
                clickTime = performance.now();
                clickDetected = true;
                
                // If click happened long after touchend, it might be a ghost click
                if (touchDetected && (clickTime - touchEndTime > 100)) {
                    this.testElement.innerHTML = 'Ghost click detected';
                } else {
                    this.testElement.innerHTML = 'Normal click detected';
                }
            };
            
            this.testElement.addEventListener('touchend', touchendHandler);
            this.testElement.addEventListener('click', clickHandler);
            
            // Complete the test after a timeout
            setTimeout(() => {
                // Remove listeners
                this.testElement.removeEventListener('touchend', touchendHandler);
                this.testElement.removeEventListener('click', clickHandler);
                
                // Check if we detected a potential ghost click
                if (touchDetected && clickDetected) {
                    const timeDiff = clickTime - touchEndTime;
                    
                    // If click is significantly delayed after touchend, it might be a ghost click
                    this.testResults.ghostClickPrevention = timeDiff < 100;
                    
                    console.log(`[MCP Touch] Time between touchend and click: ${timeDiff.toFixed(2)}ms`);
                    console.log(`[MCP Touch] Ghost click prevention: ${this.testResults.ghostClickPrevention ? 'working' : 'needs improvement'}`);
                } else if (touchDetected && !clickDetected) {
                    // If we detected touch but no click, prevention is working well
                    this.testResults.ghostClickPrevention = true;
                    console.log('[MCP Touch] Touch detected without click, ghost click prevention working');
                } else {
                    // Inconclusive
                    console.log('[MCP Touch] Ghost click test inconclusive');
                }
                
                // Remove test element
                if (this.testElement.parentNode) {
                    this.testElement.parentNode.removeChild(this.testElement);
                }
                this.testElement = null;
                
                resolve();
            }, 3000);
        });
    }

    /**
     * Get diagnostic score for touch system
     * @returns {number} Score from 0-100
     */
    getTouchScore() {
        let score = 0;
        const results = this.testResults;
        
        // Touch support (30 points)
        if (results.touchSupport) score += 30;
        
        // Event listeners (20 points)
        if (results.touchListeners.touchstart) score += 5;
        if (results.touchListeners.touchmove) score += 5;
        if (results.touchListeners.touchend) score += 5;
        if (results.touchListeners.touchcancel) score += 5;
        
        // Multi-touch (10 points)
        if (results.multiTouchSupport) score += 10;
        
        // Latency (20 points)
        if (results.touchLatency < 50) score += 20;
        else if (results.touchLatency < 100) score += 15;
        else if (results.touchLatency < 200) score += 10;
        else score += 5;
        
        // preventDefault (10 points)
        if (results.preventDefaultWorking) score += 10;
        
        // Ghost click prevention (10 points)
        if (results.ghostClickPrevention) score += 10;
        
        return score;
    }

    /**
     * Get recommendations based on test results
     * @returns {Array} Array of recommendation objects
     */
    getRecommendations() {
        const recommendations = [];
        const results = this.testResults;
        
        if (!results.touchSupport) {
            recommendations.push({
                severity: 'critical',
                message: 'Touch events not supported',
                solution: 'Ensure mouse events are properly implemented as fallback'
            });
        }
        
        if (results.touchLatency > 200) {
            recommendations.push({
                severity: 'high',
                message: `High touch latency (${results.touchLatency}ms)`,
                solution: 'Optimize event handlers and reduce main thread blocking'
            });
        }
        
        if (!results.preventDefaultWorking) {
            recommendations.push({
                severity: 'high',
                message: 'preventDefault not working correctly',
                solution: 'Add { passive: false } to event listeners and ensure preventDefault() is called'
            });
        }
        
        if (!results.ghostClickPrevention) {
            recommendations.push({
                severity: 'medium',
                message: 'Ghost click prevention not working',
                solution: 'Implement touch event handling that prevents secondary clicks'
            });
        }
        
        if (!results.multiTouchSupport && results.touchSupport) {
            recommendations.push({
                severity: 'low',
                message: 'Multi-touch not supported',
                solution: 'Ensure game controls work with single touch only'
            });
        }
        
        return recommendations;
    }

    /**
     * Fix common touch issues by applying recommended patches
     * @param {HTMLElement} element - Element to apply fixes to (default: document.body)
     */
    applyTouchFixes(element = document.body) {
        console.log('[MCP Touch] Applying touch fixes...');
        
        // Fix 1: Prevent default on touchmove for game elements
        element.addEventListener('touchmove', (e) => {
            if (e.target.closest('.game-area, .game-element, .planet, .asteroid')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Fix 2: Ghost click prevention
        const touchedElements = new WeakMap();
        
        element.addEventListener('touchstart', (e) => {
            // Mark elements that received touch
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                const touchTarget = document.elementFromPoint(touch.clientX, touch.clientY);
                if (touchTarget) {
                    touchedElements.set(touchTarget, performance.now());
                }
            }
        }, { passive: true });
        
        element.addEventListener('click', (e) => {
            // Check if this element was recently touched
            if (touchedElements.has(e.target)) {
                const touchTime = touchedElements.get(e.target);
                const timeSinceTouch = performance.now() - touchTime;
                
                // If more than 300ms since touch, likely a ghost click
                if (timeSinceTouch > 300) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[MCP Touch] Prevented ghost click');
                    return false;
                }
            }
        }, true);
        
        console.log('[MCP Touch] Touch fixes applied');
    }
}

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MCPTouchDiagnostic;
} else {
    window.MCPTouchDiagnostic = MCPTouchDiagnostic;
}

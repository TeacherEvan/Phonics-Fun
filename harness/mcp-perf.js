/**
 * MCP Performance Diagnostic Tool
 * This utility measures and diagnoses performance issues on Android devices
 * Author: GitHub Copilot
 * Date: July 16, 2025
 */

class MCPPerformanceDiagnostic {
    constructor() {
        this.testResults = {
            fps: 0,
            avgFrameTime: 0,
            gcPauses: 0,
            longFrames: 0,
            memoryUsage: null,
            cpuUtilization: 0,
            renderTime: 0,
            devicePixelRatio: window.devicePixelRatio || 1
        };
        
        this.frameTimestamps = [];
        this.frameTimes = [];
        this.gcTimestamps = [];
        this.testDuration = 5000; // 5 seconds by default
        this.testRunning = false;
        this.animationFrameId = null;
    }

    /**
     * Run a comprehensive performance diagnostic
     * @param {number} duration - Test duration in milliseconds
     * @returns {Promise} Promise that resolves with test results
     */
    runDiagnostic(duration = 5000) {
        console.log('[MCP Performance] Starting performance diagnostic...');
        this.testDuration = duration;
        this.testRunning = true;
        
        // Clear previous test data
        this.frameTimestamps = [];
        this.frameTimes = [];
        this.gcTimestamps = [];
        
        return new Promise((resolve) => {
            // Start measuring FPS
            this.measureFPS();
            
            // Start measuring memory if available
            this.measureMemory();
            
            // Set timeout to end test
            setTimeout(() => {
                this.stopTest();
                this.calculateResults();
                console.log('[MCP Performance] Diagnostic complete, results:', this.testResults);
                resolve(this.testResults);
            }, this.testDuration);
        });
    }

    /**
     * Measure frames per second using requestAnimationFrame
     */
    measureFPS() {
        let lastTimestamp = performance.now();
        
        const frameFunc = (timestamp) => {
            if (!this.testRunning) return;
            
            // Record frame timestamp
            this.frameTimestamps.push(timestamp);
            
            // Calculate frame time
            const frameTime = timestamp - lastTimestamp;
            this.frameTimes.push(frameTime);
            
            // Check for long frames (potential GC pauses or janky frames)
            if (frameTime > 50) { // > 50ms (less than 20fps for that frame)
                this.testResults.longFrames++;
                
                // If significantly long, might be GC
                if (frameTime > 100) {
                    this.gcTimestamps.push(timestamp);
                    this.testResults.gcPauses++;
                }
            }
            
            lastTimestamp = timestamp;
            this.animationFrameId = requestAnimationFrame(frameFunc);
        };
        
        this.animationFrameId = requestAnimationFrame(frameFunc);
    }

    /**
     * Measure memory usage if the API is available
     */
    async measureMemory() {
        // Check if memory measurement is available
        if (performance.memory) {
            this.testResults.memoryUsage = {
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
            console.log('[MCP Performance] Memory measurement:', this.testResults.memoryUsage);
        } else if (window.gc && performance.measureUserAgentSpecificMemory) {
            try {
                const result = await performance.measureUserAgentSpecificMemory();
                this.testResults.memoryUsage = result;
                console.log('[MCP Performance] UA-specific memory measurement:', result);
            } catch (error) {
                console.warn('[MCP Performance] Memory measurement not available:', error);
            }
        } else {
            console.warn('[MCP Performance] Memory measurement not available');
        }
    }

    /**
     * Stop the ongoing test
     */
    stopTest() {
        this.testRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Calculate final test results
     */
    calculateResults() {
        // Calculate FPS
        const frameCount = this.frameTimestamps.length;
        if (frameCount > 1) {
            const totalDuration = this.frameTimestamps[frameCount - 1] - this.frameTimestamps[0];
            this.testResults.fps = Math.round((frameCount - 1) / (totalDuration / 1000));
        }
        
        // Calculate average frame time
        if (this.frameTimes.length > 0) {
            const totalFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0);
            this.testResults.avgFrameTime = Math.round(totalFrameTime / this.frameTimes.length);
        }
        
        // Estimate CPU utilization based on frame times
        // This is a rough approximation
        const targetFrameTime = 16.67; // 60fps
        const avgUtilization = Math.min(100, Math.round((targetFrameTime / this.testResults.avgFrameTime) * 100));
        this.testResults.cpuUtilization = avgUtilization;
        
        // Calculate render time (avg frame time minus estimated JavaScript execution)
        // This is a very rough approximation
        this.testResults.renderTime = Math.max(0, this.testResults.avgFrameTime - 5);
        
        console.log(`[MCP Performance] FPS: ${this.testResults.fps}, Avg Frame Time: ${this.testResults.avgFrameTime}ms`);
        console.log(`[MCP Performance] GC Pauses: ${this.testResults.gcPauses}, Long Frames: ${this.testResults.longFrames}`);
    }

    /**
     * Get diagnostic score for performance
     * @returns {number} Score from 0-100
     */
    getPerformanceScore() {
        let score = 0;
        const results = this.testResults;
        
        // FPS score (50 points)
        if (results.fps >= 60) score += 50;
        else if (results.fps >= 45) score += 40;
        else if (results.fps >= 30) score += 30;
        else if (results.fps >= 24) score += 20;
        else score += 10;
        
        // Frame time consistency (20 points)
        const longFramesRatio = results.longFrames / this.frameTimestamps.length;
        if (longFramesRatio < 0.01) score += 20;
        else if (longFramesRatio < 0.05) score += 15;
        else if (longFramesRatio < 0.1) score += 10;
        else score += 5;
        
        // GC pauses (15 points)
        if (results.gcPauses === 0) score += 15;
        else if (results.gcPauses <= 2) score += 10;
        else if (results.gcPauses <= 5) score += 5;
        
        // Device capabilities (15 points)
        if (results.devicePixelRatio >= 3) score += 15;
        else if (results.devicePixelRatio >= 2) score += 10;
        else score += 5;
        
        return score;
    }

    /**
     * Get recommendations based on test results
     * @returns {Array} Array of recommendation objects
     */
    getRecommendations() {
        const recommendations = [];
        const results = this.testResults;
        
        if (results.fps < 30) {
            recommendations.push({
                severity: 'high',
                message: `Low frame rate (${results.fps} FPS)`,
                solution: 'Reduce visual complexity, optimize animations, or disable effects on low-end devices'
            });
        }
        
        if (results.longFrames > 5) {
            recommendations.push({
                severity: 'medium',
                message: `${results.longFrames} long frames detected (>50ms)`,
                solution: 'Optimize JavaScript execution, split heavy operations across multiple frames'
            });
        }
        
        if (results.gcPauses > 2) {
            recommendations.push({
                severity: 'medium',
                message: `${results.gcPauses} potential garbage collection pauses`,
                solution: 'Reduce object creation/destruction, reuse objects, or implement object pooling'
            });
        }
        
        if (results.memoryUsage && results.memoryUsage.usedJSHeapSize > 50 * 1024 * 1024) {
            recommendations.push({
                severity: 'medium',
                message: 'High memory usage detected',
                solution: 'Release unused resources, reduce asset sizes, or implement progressive loading'
            });
        }
        
        if (results.devicePixelRatio > 2 && results.fps < 45) {
            recommendations.push({
                severity: 'medium',
                message: 'High-DPI device with suboptimal performance',
                solution: 'Implement resolution scaling based on performance or disable high-resolution assets'
            });
        }
        
        return recommendations;
    }

    /**
     * Create a visual performance monitor on the page
     * @param {HTMLElement} container - Container element for the monitor
     */
    createPerformanceMonitor(container) {
        const monitorDiv = document.createElement('div');
        monitorDiv.style.position = 'fixed';
        monitorDiv.style.bottom = '10px';
        monitorDiv.style.right = '10px';
        monitorDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        monitorDiv.style.color = '#00ff00';
        monitorDiv.style.padding = '10px';
        monitorDiv.style.borderRadius = '5px';
        monitorDiv.style.fontFamily = 'monospace';
        monitorDiv.style.fontSize = '12px';
        monitorDiv.style.zIndex = '9999';
        
        // Create elements for metrics
        const fpsDisplay = document.createElement('div');
        const frameTimeDisplay = document.createElement('div');
        const memoryDisplay = document.createElement('div');
        
        monitorDiv.appendChild(fpsDisplay);
        monitorDiv.appendChild(frameTimeDisplay);
        monitorDiv.appendChild(memoryDisplay);
        
        // Add to container or body
        (container || document.body).appendChild(monitorDiv);
        
        // Start monitoring loop
        let lastTime = performance.now();
        let frames = 0;
        let frameTimes = [];
        
        const updateStats = () => {
            const now = performance.now();
            frames++;
            frameTimes.push(now - lastTime);
            
            // Keep only last 60 frame times
            if (frameTimes.length > 60) {
                frameTimes.shift();
            }
            
            // Update every 500ms
            if (now - lastTime >= 500) {
                const fps = Math.round((frames * 1000) / (now - lastTime));
                const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
                
                fpsDisplay.textContent = `FPS: ${fps}`;
                frameTimeDisplay.textContent = `Frame Time: ${avgFrameTime.toFixed(2)}ms`;
                
                if (performance.memory) {
                    const usedMB = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
                    const totalMB = Math.round(performance.memory.totalJSHeapSize / (1024 * 1024));
                    memoryDisplay.textContent = `Memory: ${usedMB}MB / ${totalMB}MB`;
                }
                
                frames = 0;
                lastTime = now;
                
                // Update colors based on performance
                if (fps >= 55) {
                    fpsDisplay.style.color = '#00ff00'; // Green
                } else if (fps >= 30) {
                    fpsDisplay.style.color = '#ffff00'; // Yellow
                } else {
                    fpsDisplay.style.color = '#ff0000'; // Red
                }
            }
            
            requestAnimationFrame(updateStats);
        };
        
        requestAnimationFrame(updateStats);
        
        return monitorDiv;
    }
}

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MCPPerformanceDiagnostic;
} else {
    window.MCPPerformanceDiagnostic = MCPPerformanceDiagnostic;
}

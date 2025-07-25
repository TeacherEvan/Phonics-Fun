/**
 * MCP Audio Diagnostic Tool
 * This utility detects and diagnoses audio playback issues on Android devices
 * Author: GitHub Copilot
 * Date: July 16, 2025
 */

class MCPAudioDiagnostic {
    constructor() {
        this.testResults = {
            audioContextCreation: false,
            audioUnlocking: false,
            bufferUnderruns: 0,
            formatSupport: {
                wav: false,
                mp3: false,
                ogg: false
            },
            playbackLatency: 0,
            autoplaySupport: false
        };
        this.audioContext = null;
        this.audioSources = [];
        this.testSequenceActive = false;
    }

    /**
     * Run a comprehensive audio diagnostic
     * @returns {Promise} Promise that resolves with test results
     */
    async runDiagnostic() {
        console.log('[MCP Audio] Starting comprehensive audio diagnostic...');
        this.testSequenceActive = true;
        
        try {
            await this.testAudioContextCreation();
            await this.testAudioUnlocking();
            await this.testBufferHandling();
            await this.testFormatSupport();
            await this.testPlaybackLatency();
            await this.testAutoplaySupport();
            
            console.log('[MCP Audio] Diagnostic complete, results:', this.testResults);
            this.testSequenceActive = false;
            return this.testResults;
        } catch (error) {
            console.error('[MCP Audio] Diagnostic failed:', error);
            this.testSequenceActive = false;
            throw error;
        }
    }

    /**
     * Test if AudioContext can be created
     */
    async testAudioContextCreation() {
        console.log('[MCP Audio] Testing AudioContext creation...');
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            
            if (!AudioContext) {
                console.warn('[MCP Audio] AudioContext not supported');
                this.testResults.audioContextCreation = false;
                return;
            }
            
            this.audioContext = new AudioContext();
            this.testResults.audioContextCreation = true;
            console.log('[MCP Audio] AudioContext created successfully, state:', this.audioContext.state);
        } catch (error) {
            console.error('[MCP Audio] AudioContext creation failed:', error);
            this.testResults.audioContextCreation = false;
        }
    }

    /**
     * Test audio unlocking (important for Android)
     */
    async testAudioUnlocking() {
        console.log('[MCP Audio] Testing audio unlocking...');
        
        if (!this.audioContext) {
            console.warn('[MCP Audio] Cannot test audio unlocking without AudioContext');
            this.testResults.audioUnlocking = false;
            return;
        }
        
        try {
            // Create a silent buffer
            const buffer = this.audioContext.createBuffer(1, 1, 22050);
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContext.destination);
            
            // Play the silent buffer
            source.start(0);
            
            // Check if context is running
            if (this.audioContext.state === 'running') {
                this.testResults.audioUnlocking = true;
                console.log('[MCP Audio] Audio unlocked successfully');
            } else {
                this.testResults.audioUnlocking = false;
                console.warn('[MCP Audio] Audio not unlocked, context state:', this.audioContext.state);
            }
        } catch (error) {
            console.error('[MCP Audio] Audio unlocking test failed:', error);
            this.testResults.audioUnlocking = false;
        }
    }

    /**
     * Test buffer handling and underruns
     */
    async testBufferHandling() {
        console.log('[MCP Audio] Testing buffer handling...');
        
        if (!this.audioContext) {
            console.warn('[MCP Audio] Cannot test buffer handling without AudioContext');
            return;
        }
        
        try {
            // Create a test buffer with 3 seconds of audio
            const duration = 3;
            const sampleRate = this.audioContext.sampleRate;
            const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
            const channel = buffer.getChannelData(0);
            
            // Fill with a test tone
            for (let i = 0; i < buffer.length; i++) {
                channel[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.2;
            }
            
            // Play the buffer and monitor for underruns
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            
            // Create an analyzer to detect silence (indicating potential underruns)
            const analyzer = this.audioContext.createAnalyser();
            analyzer.fftSize = 2048;
            const dataArray = new Uint8Array(analyzer.frequencyBinCount);
            
            source.connect(analyzer);
            analyzer.connect(this.audioContext.destination);
            
            // Start playback
            source.start(0);
            
            // Monitor for underruns during playback
            let underruns = 0;
            const startTime = this.audioContext.currentTime;
            
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    // Get analyzer data
                    analyzer.getByteTimeDomainData(dataArray);
                    
                    // Check if audio is silent (potential underrun)
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += Math.abs(dataArray[i] - 128);
                    }
                    const average = sum / dataArray.length;
                    
                    // If near silence during expected playback, count as underrun
                    if (average < 1 && this.audioContext.currentTime - startTime < duration) {
                        underruns++;
                    }
                    
                    // Stop checking after buffer should have finished
                    if (this.audioContext.currentTime - startTime >= duration) {
                        clearInterval(checkInterval);
                        this.testResults.bufferUnderruns = underruns;
                        console.log(`[MCP Audio] Buffer test complete, detected ${underruns} underruns`);
                        resolve();
                    }
                }, 100);
            });
        } catch (error) {
            console.error('[MCP Audio] Buffer handling test failed:', error);
        }
    }

    /**
     * Test audio format support
     */
    async testFormatSupport() {
        console.log('[MCP Audio] Testing audio format support...');
        
        const audio = document.createElement('audio');
        
        // Test WAV support
        const wavSupport = audio.canPlayType('audio/wav');
        this.testResults.formatSupport.wav = wavSupport !== '' && wavSupport !== 'no';
        
        // Test MP3 support
        const mp3Support = audio.canPlayType('audio/mpeg');
        this.testResults.formatSupport.mp3 = mp3Support !== '' && mp3Support !== 'no';
        
        // Test OGG support
        const oggSupport = audio.canPlayType('audio/ogg');
        this.testResults.formatSupport.ogg = oggSupport !== '' && oggSupport !== 'no';
        
        console.log('[MCP Audio] Format support:', this.testResults.formatSupport);
    }

    /**
     * Test audio playback latency
     */
    async testPlaybackLatency() {
        console.log('[MCP Audio] Testing audio playback latency...');
        
        if (!this.audioContext) {
            console.warn('[MCP Audio] Cannot test playback latency without AudioContext');
            return;
        }
        
        try {
            // Create a short beep
            const buffer = this.audioContext.createBuffer(1, 1 * this.audioContext.sampleRate, this.audioContext.sampleRate);
            const channel = buffer.getChannelData(0);
            
            // Fill with a beep
            for (let i = 0; i < buffer.length; i++) {
                channel[i] = Math.sin(2 * Math.PI * 880 * i / this.audioContext.sampleRate) * 0.5;
            }
            
            // Measure latency by checking the difference between scheduled and actual start time
            const startMeasureTime = performance.now();
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            
            // Add an event for when playback actually starts
            const analyser = this.audioContext.createAnalyser();
            analyser.fftSize = 32;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            
            source.connect(analyser);
            analyser.connect(this.audioContext.destination);
            
            // Start immediately
            source.start(0);
            
            // Monitor for actual start
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    analyser.getByteTimeDomainData(dataArray);
                    
                    // Check if audio is playing (non-silent)
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += Math.abs(dataArray[i] - 128);
                    }
                    
                    if (sum > 5) { // Detect actual playback
                        clearInterval(checkInterval);
                        const endMeasureTime = performance.now();
                        const latency = endMeasureTime - startMeasureTime;
                        
                        this.testResults.playbackLatency = Math.round(latency);
                        console.log(`[MCP Audio] Playback latency: ${latency.toFixed(2)}ms`);
                        resolve();
                    }
                }, 1);
            });
        } catch (error) {
            console.error('[MCP Audio] Playback latency test failed:', error);
        }
    }

    /**
     * Test autoplay support
     */
    async testAutoplaySupport() {
        console.log('[MCP Audio] Testing autoplay support...');
        
        try {
            const audio = document.createElement('audio');
            audio.src = 'data:audio/mpeg;base64,/+MYxAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
            audio.volume = 0.01; // Very low volume
            
            // Try to play without user interaction
            const playPromise = audio.play();
            
            if (playPromise) {
                playPromise.then(() => {
                    this.testResults.autoplaySupport = true;
                    console.log('[MCP Audio] Autoplay supported');
                    audio.pause();
                }).catch(error => {
                    this.testResults.autoplaySupport = false;
                    console.log('[MCP Audio] Autoplay not supported:', error.message);
                });
            } else {
                // For older browsers that don't return a promise
                if (!audio.paused) {
                    this.testResults.autoplaySupport = true;
                    console.log('[MCP Audio] Autoplay supported (legacy)');
                    audio.pause();
                } else {
                    this.testResults.autoplaySupport = false;
                    console.log('[MCP Audio] Autoplay not supported (legacy)');
                }
            }
        } catch (error) {
            console.error('[MCP Audio] Autoplay test failed:', error);
            this.testResults.autoplaySupport = false;
        }
    }

    /**
     * Get diagnostic score for audio system
     * @returns {number} Score from 0-100
     */
    getAudioScore() {
        let score = 0;
        const results = this.testResults;
        
        // Audio context creation and unlocking (50 points total)
        if (results.audioContextCreation) score += 25;
        if (results.audioUnlocking) score += 25;
        
        // Buffer underruns (20 points)
        if (results.bufferUnderruns === 0) score += 20;
        else if (results.bufferUnderruns <= 2) score += 10;
        
        // Format support (15 points)
        if (results.formatSupport.wav) score += 5;
        if (results.formatSupport.mp3) score += 5;
        if (results.formatSupport.ogg) score += 5;
        
        // Latency (15 points)
        if (results.playbackLatency < 50) score += 15;
        else if (results.playbackLatency < 100) score += 10;
        else if (results.playbackLatency < 200) score += 5;
        
        return score;
    }

    /**
     * Get recommendations based on test results
     * @returns {Array} Array of recommendation objects
     */
    getRecommendations() {
        const recommendations = [];
        const results = this.testResults;
        
        if (!results.audioContextCreation) {
            recommendations.push({
                severity: 'critical',
                message: 'Web Audio API not supported',
                solution: 'Implement HTML5 Audio fallback mechanism'
            });
        }
        
        if (!results.audioUnlocking) {
            recommendations.push({
                severity: 'high',
                message: 'Audio context not unlocked correctly',
                solution: 'Add explicit unlock on first user interaction'
            });
        }
        
        if (results.bufferUnderruns > 0) {
            recommendations.push({
                severity: 'medium',
                message: `Detected ${results.bufferUnderruns} audio buffer underruns`,
                solution: 'Use smaller audio buffers or lower quality settings'
            });
        }
        
        if (!results.formatSupport.wav && !results.formatSupport.mp3) {
            recommendations.push({
                severity: 'critical',
                message: 'No common audio formats supported',
                solution: 'Include multiple format options (WAV, MP3, OGG)'
            });
        }
        
        if (results.playbackLatency > 200) {
            recommendations.push({
                severity: 'medium',
                message: `High audio latency (${results.playbackLatency}ms)`,
                solution: 'Optimize audio processing or use simpler audio setup'
            });
        }
        
        if (!results.autoplaySupport) {
            recommendations.push({
                severity: 'high',
                message: 'Autoplay not supported',
                solution: 'Only play audio after explicit user interaction'
            });
        }
        
        return recommendations;
    }

    /**
     * Unlock audio on user interaction
     * Call this in response to a user action
     */
    unlockAudio() {
        if (!this.audioContext) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
            } catch (e) {
                console.error('[MCP Audio] Failed to create AudioContext:', e);
                return false;
            }
        }
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Create and play a silent buffer
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);
        
        console.log('[MCP Audio] Attempted to unlock audio, context state:', this.audioContext.state);
        return this.audioContext.state === 'running';
    }
}

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MCPAudioDiagnostic;
} else {
    window.MCPAudioDiagnostic = MCPAudioDiagnostic;
}

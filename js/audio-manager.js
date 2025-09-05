/**
 * Audio Manager for Phonics Fun
 * Centralized audio system for consistent sound management
 * Author: GitHub Copilot
 */

class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.voices = new Map();
        this.backgroundMusic = null;
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.effectsGain = null;
        this.voiceGain = null;
        
        // Settings
        this.isMuted = false;
        this.musicVolume = 0.5;
        this.effectsVolume = 0.7;
        this.voiceVolume = 0.9;
        
        // Audio priority settings
        this.audioPriority = {
            highPriority: true,  // Voice files and phoneme sounds (always enabled)
            mediumPriority: true, // Celebration and explosion sounds
            lowPriority: false   // Background music (disabled by default)
        };
        
        // Voice template settings
        this.currentVoiceTemplate = 'american-female'; // Default - use only one template
        this.availableVoiceTemplates = [
            { id: 'american-female', name: 'American Female', description: 'Clear American female voice' }
            // Other templates disabled to reduce memory usage
            // { id: 'american-male', name: 'American Male', description: 'Clear American male voice' },
            // { id: 'british-female', name: 'British Female', description: 'British female voice' },
            // { id: 'british-male', name: 'British Male', description: 'British male voice' }
        ];
        
        // Initialize audio system
        this.init();
    }

    init() {
        console.log('Initializing Audio Manager...');
        
        // Initialize Web Audio API
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes for volume control
            this.masterGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            this.effectsGain = this.audioContext.createGain();
            this.voiceGain = this.audioContext.createGain();
            
            // Connect gain nodes
            this.musicGain.connect(this.masterGain);
            this.effectsGain.connect(this.masterGain);
            this.voiceGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);
            
            // Set initial volumes
            this.updateVolumes();
            
            console.log('Web Audio API initialized successfully');
        } catch (error) {
            console.error('Web Audio API initialization failed:', error);
            console.log('Falling back to HTML5 Audio');
        }
        
        // Load all sounds
        this.loadAllSounds();
    }

    loadAllSounds() {
        const sounds = {
            // Background music (using generated WAV file)
            backgroundMusic: "assets/sounds/background-music.wav",
            
            // Sound effects (using generated WAV files)
            explosion: "assets/sounds/explosion.wav",
            celebration: "assets/sounds/celebration.wav",
            
            // Phoneme sounds
            phonemeG: "assets/sounds/phoneme-g.wav",
            phonemeA: "assets/sounds/phoneme-a.wav",
            phonemeB: "assets/sounds/phoneme-b.wav",
            
            // Voice sounds for letters A, B, and G
            voiceGrape: "assets/sounds/voices/american-female/voice-grape.wav",
            voiceGoat: "assets/sounds/voices/american-female/voice-goat.wav",
            voiceGold: "assets/sounds/voices/american-female/voice-gold.wav",
            voiceGirl: "assets/sounds/voices/american-female/voice-girl.wav",
            voiceGrandpa: "assets/sounds/voices/american-female/voice-grandpa.wav",
            voiceApple: "assets/sounds/voice-apple.wav",
            voiceAnt: "assets/sounds/voice-ant.wav",
            voiceBall: "assets/sounds/voice-ball.wav",
            voiceBat: "assets/sounds/voice-bat.wav"
        };
        
        // Background music (using generated WAV file)
        if (this.audioPriority.lowPriority) {
            this.loadSound('background-music', sounds.backgroundMusic, 'music');
        }
        
        // Sound effects (using generated WAV files)
        if (this.audioPriority.mediumPriority) {
            this.loadSound('explosion', sounds.explosion, 'effect');
            this.loadSound('celebration', sounds.celebration, 'effect');
        }
        
        // Load voice messages using current template
        if (this.audioPriority.highPriority) {
            this.loadVoiceTemplate(this.currentVoiceTemplate);
        }
        
        // Load additional phoneme and voice sounds
        for (const [id, url] of Object.entries(sounds)) {
            if (!this.sounds.has(id)) {
                this.loadSound(id, url, 'effect');
            }
        }
    }

    loadVoiceTemplate(templateId) {
        console.log(`Loading voice template: ${templateId}`);
        
        // Clear existing voice files
        this.voices.clear();
        
        // Load new voice files from template directory
        const words = ['grape', 'goat', 'gold', 'girl', 'grandpa'];
        words.forEach(word => {
            const soundId = `voice-${word}`;
            const soundPath = `assets/sounds/voices/${templateId}/voice-${word}.wav`;
            this.loadSound(soundId, soundPath, 'voice');
        });
        
        // Update current template
        this.currentVoiceTemplate = templateId;
        
        // Save to localStorage
        localStorage.setItem('voiceTemplate', templateId);
        
        console.log(`Voice template loaded: ${templateId}`);
    }

    setVoiceTemplate(templateId) {
        if (this.availableVoiceTemplates.find(t => t.id === templateId)) {
            this.loadVoiceTemplate(templateId);
            return true;
        }
        return false;
    }

    getAvailableVoiceTemplates() {
        return this.availableVoiceTemplates;
    }

    getCurrentVoiceTemplate() {
        return this.currentVoiceTemplate;
    }

    loadSound(id, url, type = 'effect') {
        // For Web Audio API
        if (this.audioContext) {
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load sound: ${url}`);
                    }
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    if (type === 'music') {
                        this.sounds.set(id, {
                            buffer: audioBuffer,
                            type: type,
                            source: null,
                            loop: true
                        });
                    } else {
                        this.sounds.set(id, {
                            buffer: audioBuffer,
                            type: type,
                            source: null,
                            loop: false
                        });
                    }
                    console.log(`Sound loaded successfully: ${id}`);
                })
                .catch(error => {
                    console.error(`Error loading sound ${id}:`, error);
                    
                    // Fallback to HTML Audio
                    this.loadFallbackSound(id, url, type);
                });
        } else {
            // Fallback to HTML Audio
            this.loadFallbackSound(id, url, type);
        }
    }

    loadFallbackSound(id, url, type) {
        const audio = new Audio();
        audio.preload = 'auto';
        
        if (type === 'music') {
            audio.loop = true;
        }
        
        // Handle successful loading
        audio.addEventListener('canplaythrough', () => {
            console.log(`Fallback sound loaded successfully: ${id}`);
        });
        
        // Handle error
        audio.addEventListener('error', (e) => {
            console.error(`Error loading fallback sound ${id}:`, e);
        });
        
        audio.src = url;
        
        if (type === 'music') {
            this.backgroundMusic = audio;
        } else if (type === 'voice') {
            this.voices.set(id, audio);
        } else {
            this.sounds.set(id, {
                audio: audio,
                type: type
            });
        }
    }

    play(id) {
        // Skip if muted or if trying to play a disabled sound
        if (this.isMuted) return;
        
        // Check priority before playing
        if (id === 'background-music' && !this.audioPriority.lowPriority) {
            console.log('Skipping background music (low priority sound disabled)');
            return;
        }
        
        const soundType = id.startsWith('voice-') ? 'high' : 
                         (id === 'phoneme-g' ? 'high' : 
                         (id === 'background-music' ? 'low' : 'medium'));
                         
        if ((soundType === 'medium' && !this.audioPriority.mediumPriority) || 
            (soundType === 'high' && !this.audioPriority.highPriority)) {
            console.log(`Skipping ${id} (${soundType} priority sound disabled)`);
            return;
        }
        
        // Play using Web Audio API if available
        if (this.audioContext && this.sounds.has(id)) {
            const sound = this.sounds.get(id);
            if (sound.buffer) {
                // Stop any existing playback
                if (sound.source) {
                    try {
                        sound.source.stop();
                    } catch (e) {
                        // Ignore errors from already stopped sources
                    }
                }
                
                // Create new source
                const source = this.audioContext.createBufferSource();
                source.buffer = sound.buffer;
                source.loop = sound.loop || false;
                
                // Connect to appropriate gain node
                if (sound.type === 'music') {
                    source.connect(this.musicGain);
                } else if (sound.type === 'voice') {
                    source.connect(this.voiceGain);
                } else {
                    source.connect(this.effectsGain);
                }
                
                // Store source for later control
                sound.source = source;
                
                // Start playback
                source.start();
                console.log(`Playing sound: ${id}`);
                return source;
            }
        }
        
        // Fallback to HTML Audio
        if (id === 'background-music' && this.backgroundMusic) {
            this.backgroundMusic.currentTime = 0;
            this.backgroundMusic.volume = this.isMuted ? 0 : this.musicVolume;
            this.backgroundMusic.play().catch(e => {
                console.error(`Could not play background music:`, e);
            });
        } else if (id.startsWith('voice-') && this.voices.has(id)) {
            const voice = this.voices.get(id);
            voice.currentTime = 0;
            voice.volume = this.isMuted ? 0 : this.voiceVolume;
            voice.play().catch(e => {
                console.error(`Could not play voice: ${id}`, e);
            });
        } else if (this.sounds.has(id) && this.sounds.get(id).audio) {
            const sound = this.sounds.get(id);
            sound.audio.currentTime = 0;
            sound.audio.volume = this.isMuted ? 0 : this.effectsVolume;
            sound.audio.play().catch(e => {
                console.error(`Could not play sound: ${id}`, e);
            });
        } else {
            // Try to play from DOM as last resort
            const audioElement = document.getElementById(id);
            if (audioElement) {
                audioElement.currentTime = 0;
                audioElement.volume = this.isMuted ? 0 : this.effectsVolume;
                audioElement.play().catch(e => {
                    console.error(`Could not play DOM audio: ${id}`, e);
                });
            } else {
                console.error(`Sound not found: ${id}`);
            }
        }
    }

    stop(id) {
        // Stop using Web Audio API if available
        if (this.audioContext && this.sounds.has(id)) {
            const sound = this.sounds.get(id);
            if (sound.source) {
                try {
                    sound.source.stop();
                    sound.source = null;
                } catch (e) {
                    // Ignore errors from already stopped sources
                }
            }
        }
        
        // Fallback to HTML Audio
        if (id === 'background-music' && this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        } else if (id.startsWith('voice-') && this.voices.has(id)) {
            const voice = this.voices.get(id);
            voice.pause();
            voice.currentTime = 0;
        } else if (this.sounds.has(id) && this.sounds.get(id).audio) {
            const sound = this.sounds.get(id);
            sound.audio.pause();
            sound.audio.currentTime = 0;
        } else {
            // Try to stop from DOM as last resort
            const audioElement = document.getElementById(id);
            if (audioElement) {
                audioElement.pause();
                audioElement.currentTime = 0;
            }
        }
    }

    stopAll() {
        // Stop all Web Audio API sounds
        if (this.audioContext) {
            this.sounds.forEach((sound, id) => {
                if (sound.source) {
                    try {
                        sound.source.stop();
                        sound.source = null;
                    } catch (e) {
                        // Ignore errors from already stopped sources
                    }
                }
            });
        }
        
        // Stop all HTML Audio sounds
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
        
        this.voices.forEach((voice) => {
            voice.pause();
            voice.currentTime = 0;
        });
        
        this.sounds.forEach((sound) => {
            if (sound.audio) {
                sound.audio.pause();
                sound.audio.currentTime = 0;
            }
        });
        
        // Stop all DOM audio elements
        document.querySelectorAll('audio').forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    setVolume(type, value) {
        value = Math.max(0, Math.min(1, value)); // Clamp between 0 and 1
        
        if (type === 'master') {
            this.masterVolume = value;
            if (this.masterGain) {
                this.masterGain.gain.value = value;
            }
        } else if (type === 'music') {
            this.musicVolume = value;
            if (this.musicGain) {
                this.musicGain.gain.value = value;
            }
            if (this.backgroundMusic) {
                this.backgroundMusic.volume = this.isMuted ? 0 : value;
            }
        } else if (type === 'effects') {
            this.effectsVolume = value;
            if (this.effectsGain) {
                this.effectsGain.gain.value = value;
            }
        } else if (type === 'voice') {
            this.voiceVolume = value;
            if (this.voiceGain) {
                this.voiceGain.gain.value = value;
            }
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.updateVolumes();
        return this.isMuted;
    }

    updateVolumes() {
        const masterVolume = this.isMuted ? 0 : 1;
        
        // Update Web Audio API gains
        if (this.masterGain) {
            this.masterGain.gain.value = masterVolume;
        }
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
        if (this.effectsGain) {
            this.effectsGain.gain.value = this.effectsVolume;
        }
        if (this.voiceGain) {
            this.voiceGain.gain.value = this.voiceVolume;
        }
        
        // Update HTML Audio volumes
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.isMuted ? 0 : this.musicVolume;
        }
        
        this.voices.forEach((voice) => {
            voice.volume = this.isMuted ? 0 : this.voiceVolume;
        });
        
        this.sounds.forEach((sound) => {
            if (sound.audio) {
                sound.audio.volume = this.isMuted ? 0 : 
                    (sound.type === 'music' ? this.musicVolume : 
                     sound.type === 'voice' ? this.voiceVolume : 
                     this.effectsVolume);
            }
        });
    }

    // Speech synthesis for dynamic voice generation
    speak(text, options = {}) {
        if (this.isMuted) return;
        
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Set voice options
            utterance.rate = options.rate || 0.9;
            utterance.pitch = options.pitch || 1.1;
            utterance.volume = this.isMuted ? 0 : this.voiceVolume;
            
            // Try to find a female voice for child-friendly sound
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(voice => 
                voice.name.toLowerCase().includes('female') || 
                voice.name.toLowerCase().includes('girl') ||
                voice.name.toLowerCase().includes('woman')
            );
            
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }
            
            // Speak the text
            window.speechSynthesis.speak(utterance);
            
            return utterance;
        } else {
            console.error('Speech synthesis not supported in this browser');
            return null;
        }
    }

    // Generate dynamic sound effects using Web Audio API
    generateExplosionSound() {
        if (this.isMuted || !this.audioContext) return;
        
        const duration = 1.0;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 5);
            const noise = (Math.random() - 0.5) * 2;
            data[i] = noise * envelope * 0.3;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.effectsGain);
        source.start();
        
        return source;
    }

    generatePhonemeSound(phoneme) {
        if (this.isMuted || !this.audioContext) return;
        
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Different frequencies for different phonemes
        let frequency;
        switch(phoneme.toLowerCase()) {
            case 'g':
                frequency = 220; // G phoneme frequency
                break;
            default:
                frequency = 200; // Default frequency
        }
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 3) * (1 - Math.exp(-t * 50));
            // Create a throaty sound for 'g'
            const oscillation = Math.sin(t * 2 * Math.PI * frequency) + 
                               0.5 * Math.sin(t * 2 * Math.PI * (frequency * 1.5)) +
                               0.25 * Math.sin(t * 2 * Math.PI * (frequency * 0.5));
            data[i] = oscillation * envelope * 0.3;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.effectsGain);
        source.start();
        
        return source;
    }

    // Load state from settings
    loadSettings(settings) {
        if (settings.musicVolume !== undefined) {
            this.musicVolume = settings.musicVolume;
        }
        
        if (settings.effectsVolume !== undefined) {
            this.effectsVolume = settings.effectsVolume;
        }
        
        if (settings.isMuted !== undefined) {
            this.isMuted = settings.isMuted;
        }
        
        // Load voice template from localStorage or use default
        const savedTemplate = localStorage.getItem('voiceTemplate');
        if (savedTemplate && this.availableVoiceTemplates.find(t => t.id === savedTemplate)) {
            this.currentVoiceTemplate = savedTemplate;
        }
        
        this.updateVolumes();
    }

    // Helper function to preload all audio files
    preloadAllAudio() {
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            audio.load();
        });
    }

    // Clean up resources
    destroy() {
        this.stopAll();
        
        if (this.audioContext) {
            this.audioContext.close().then(() => {
                console.log('Audio context closed successfully');
            }).catch(error => {
                console.error('Error closing audio context:', error);
            });
        }
    }

    /**
     * Pause all currently playing audio (for Android compatibility)
     */
    pauseAll() {
        // Pause background music
        if (this.backgroundMusic && !this.backgroundMusic.paused) {
            this.backgroundMusic.pause();
        }
        
        // Pause all sound effects
        this.sounds.forEach(sound => {
            if (sound.audio && !sound.audio.paused) {
                sound.audio.pause();
            }
        });
        
        // Pause all voice sounds
        this.voices.forEach(voice => {
            if (voice.audio && !voice.audio.paused) {
                voice.audio.pause();
            }
        });
        
        console.log('All audio paused for Android compatibility');
    }

    /**
     * Resume all paused audio (for Android compatibility)
     */
    resumeAll() {
        // Resume background music if it was playing
        if (this.backgroundMusic && this.backgroundMusic.paused && this.backgroundMusic.currentTime > 0) {
            this.backgroundMusic.play().catch(error => {
                console.log('Background music resume failed:', error);
            });
        }
        
        console.log('Audio resumed for Android compatibility');
    }

    cleanup() {
        // Clean up resources
        this.destroy();
    }

    /**
     * Set audio priority level - allows enabling/disabling audio by priority
     * @param {string} level - 'high', 'medium', or 'low'
     * @param {boolean} enabled - Whether this priority level should be enabled
     */
    setAudioPriority(level, enabled) {
        if (level === 'high') {
            this.audioPriority.highPriority = enabled;
        } else if (level === 'medium') {
            this.audioPriority.mediumPriority = enabled;
        } else if (level === 'low') {
            this.audioPriority.lowPriority = enabled;
            
            // If enabling low priority sounds that weren't loaded yet
            if (enabled && !this.sounds.has('background-music')) {
                this.loadSound('background-music', 'assets/sounds/background-music.wav', 'music');
            }
        }
        
        console.log(`Audio priority level "${level}" set to: ${enabled}`);
    }
    
    /**
     * Get current audio priority settings
     * @returns {Object} The current audio priority settings
     */
    getAudioPriority() {
        return this.audioPriority;
    }
}

// Export for use in main game (ES6 modules temporarily disabled)
// export default AudioManager;
window.AudioManager = AudioManager;

// Global instance for easy access

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
        this.loadingSounds = new Map();
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
        if (this.audioPriority.lowPriority) {
            this.ensureSoundLoaded('background-music');
        }

        if (this.audioPriority.mediumPriority) {
            this.ensureSoundLoaded('explosion');
            this.ensureSoundLoaded('celebration');
        }
    }

    loadVoiceTemplate(templateId) {
        console.log(`Loading voice template: ${templateId}`);

        this.clearVoiceCache();
        this.currentVoiceTemplate = templateId;
        localStorage.setItem('voiceTemplate', templateId);
        this.ensureLetterAudio('G');
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
        if (this.hasLoadedSound(id)) {
            return Promise.resolve();
        }

        if (this.loadingSounds.has(id)) {
            return this.loadingSounds.get(id);
        }

        const finalizeLoad = () => {
            this.loadingSounds.delete(id);
        };

        if (this.audioContext) {
            const loadPromise = fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load sound: ${url}`);
                    }
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    this.sounds.set(id, {
                        buffer: audioBuffer,
                        type: type,
                        source: null,
                        loop: type === 'music'
                    });
                    console.log(`Sound loaded successfully: ${id}`);
                })
                .catch(error => {
                    console.error(`Error loading sound ${id}:`, error);

                    if (error.message && error.message.startsWith('Failed to load sound:')) {
                        return Promise.resolve();
                    }

                    return this.loadFallbackSound(id, url, type);
                })
                .finally(finalizeLoad);

            this.loadingSounds.set(id, loadPromise);
            return loadPromise;
        }

        const loadPromise = this.loadFallbackSound(id, url, type)
            .finally(finalizeLoad);
        this.loadingSounds.set(id, loadPromise);
        return loadPromise;
    }

    loadFallbackSound(id, url, type) {
        if (this.hasLoadedSound(id)) {
            return Promise.resolve();
        }

        const audio = new Audio();
        audio.preload = 'metadata';

        if (type === 'music') {
            audio.loop = true;
        }

        const loadPromise = new Promise((resolve, reject) => {
            audio.addEventListener('canplaythrough', () => {
                console.log(`Fallback sound loaded successfully: ${id}`);
                resolve();
            }, { once: true });

            audio.addEventListener('error', (e) => {
                console.error(`Error loading fallback sound ${id}:`, e);
                reject(e);
            }, { once: true });

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
        });

        return loadPromise;
    }

    play(id) {
        id = this.normalizeSoundId(id);

        // Skip if muted or if trying to play a disabled sound
        if (this.isMuted) return;

        // Check priority before playing
        if (id === 'background-music' && !this.audioPriority.lowPriority) {
            console.log('Skipping background music (low priority sound disabled)');
            return;
        }

        const soundType = id.startsWith('voice-') ? 'high' :
            (id.startsWith('phoneme-') ? 'high' :
                (id === 'background-music' ? 'low' : 'medium'));

        if ((soundType === 'medium' && !this.audioPriority.mediumPriority) ||
            (soundType === 'high' && !this.audioPriority.highPriority)) {
            console.log(`Skipping ${id} (${soundType} priority sound disabled)`);
            return;
        }

        if (!this.hasLoadedSound(id)) {
            this.ensureSoundLoaded(id);
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
        switch (phoneme.toLowerCase()) {
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
                this.ensureSoundLoaded('background-music');
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

    hasLoadedSound(id) {
        return this.sounds.has(id) || this.voices.has(id) || (id === 'background-music' && this.backgroundMusic !== null);
    }

    normalizeSoundId(id) {
        const aliasMap = {
            backgroundMusic: 'background-music',
            phonemeG: 'phoneme-g',
            phonemeA: 'phoneme-a',
            phonemeB: 'phoneme-b',
            voiceGrape: 'voice-grape',
            voiceGoat: 'voice-goat',
            voiceGold: 'voice-gold',
            voiceGirl: 'voice-girl',
            voiceGrandpa: 'voice-grandpa',
            voiceApple: 'voice-apple',
            voiceAnt: 'voice-ant',
            voiceAirplane: 'voice-airplane',
            voiceAlligator: 'voice-alligator',
            voiceArrow: 'voice-arrow',
            voiceBall: 'voice-ball',
            voiceBat: 'voice-bat',
            voiceBear: 'voice-bear',
            voiceBoat: 'voice-boat',
            voiceButterfly: 'voice-butterfly'
        };

        return aliasMap[id] || id;
    }

    getSoundPath(id) {
        if (id === 'background-music') {
            return 'Assets/sounds/background-music.wav';
        }

        if (id === 'explosion') {
            return 'Assets/sounds/explosion.wav';
        }

        if (id === 'celebration') {
            return 'Assets/sounds/celebration.wav';
        }

        if (id.startsWith('phoneme-')) {
            return `Assets/sounds/${id}.wav`;
        }

        if (id.startsWith('voice-')) {
            return `Assets/sounds/voices/${this.currentVoiceTemplate}/${id}.wav`;
        }

        return null;
    }

    getSoundType(id) {
        if (id === 'background-music') {
            return 'music';
        }

        if (id.startsWith('voice-')) {
            return 'voice';
        }

        return 'effect';
    }

    ensureSoundLoaded(id) {
        const normalizedId = this.normalizeSoundId(id);

        if (this.hasLoadedSound(normalizedId)) {
            return Promise.resolve();
        }

        const soundPath = this.getSoundPath(normalizedId);
        if (!soundPath) {
            return Promise.resolve();
        }

        return this.loadSound(normalizedId, soundPath, this.getSoundType(normalizedId));
    }

    ensureLetterAudio(letter) {
        const upperLetter = letter.toUpperCase();
        const letterWords = {
            G: ['grape', 'goat', 'gold', 'girl', 'grandpa'],
            A: ['apple', 'ant', 'airplane', 'alligator', 'arrow'],
            B: ['ball', 'bat', 'bear', 'boat', 'butterfly']
        };

        const requests = [
            this.ensureSoundLoaded(`phoneme-${upperLetter.toLowerCase()}`)
        ];

        (letterWords[upperLetter] || []).forEach(word => {
            requests.push(this.ensureSoundLoaded(`voice-${word}`));
        });

        return Promise.allSettled(requests);
    }

    clearVoiceCache() {
        Array.from(this.sounds.keys())
            .filter(id => id.startsWith('voice-'))
            .forEach(id => {
                this.sounds.delete(id);
            });

        this.voices.clear();
    }
}

// Export for use in main game (ES6 modules temporarily disabled)
// export default AudioManager;
window.AudioManager = AudioManager;

// Global instance for easy access

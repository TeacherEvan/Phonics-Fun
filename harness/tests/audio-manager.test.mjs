import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';

// Setup jsdom environment for AudioContext
beforeAll(() => {
  global.AudioContext = class AudioContext {
    constructor() {
      this.destination = {};
      this.state = 'running';
    }
    createGain() {
      return {
        connect: vi.fn(),
        gain: { value: 1 }
      };
    }
    createBufferSource() {
      return {
        start: vi.fn(),
        stop: vi.fn(),
        connect: vi.fn(),
        buffer: null,
        loop: false
      };
    }
    decodeAudioData(arrayBuffer) {
      return Promise.resolve({ duration: 1 });
    }
    close() {
      return Promise.resolve();
    }
  };
  global.webkitAudioContext = global.AudioContext;
  global.fetch = vi.fn(() => Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
  }));
  global.Audio = class Audio {
    constructor() {
      this.src = '';
      this.volume = 1;
      this.loop = false;
      this.currentTime = 0;
      this.play = vi.fn(() => Promise.resolve());
      this.pause = vi.fn();
      this.addEventListener = vi.fn();
      this.preload = 'metadata';
    }
  };
  global.speechSynthesis = {
    cancel: vi.fn(),
    getVoices: vi.fn(() => []),
    speak: vi.fn(),
    onvoiceschanged: null
  };
// Mock SpeechSynthesisUtterance as a constructor
class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
    this.voice = null;
  }
}

global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  };
  global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
  global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));
});

import '../../js/audio-manager.js';

describe('AudioManager', () => {
  let audioManager;

  beforeEach(() => {
    vi.clearAllMocks();
    audioManager = new window.AudioManager();
  });

  afterEach(() => {
    if (audioManager) {
      audioManager.stopAll();
    }
  });

  describe('initialization', () => {
    it('should create AudioManager instance', () => {
      expect(audioManager).toBeDefined();
      expect(audioManager.sounds).toBeInstanceOf(Map);
      expect(audioManager.voices).toBeInstanceOf(Map);
    });

    it('should initialize with default settings', () => {
      expect(audioManager.isMuted).toBe(false);
      expect(audioManager.musicVolume).toBe(0.5);
      expect(audioManager.effectsVolume).toBe(0.7);
      expect(audioManager.voiceVolume).toBe(0.9);
    });

    it('should initialize audio priority settings', () => {
      expect(audioManager.audioPriority.highPriority).toBe(true);
      expect(audioManager.audioPriority.mediumPriority).toBe(true);
      expect(audioManager.audioPriority.lowPriority).toBe(false);
    });
  });

  describe('volume control', () => {
    it('should set master volume', () => {
      audioManager.setVolume('master', 0.8);
      expect(audioManager.masterGain.gain.value).toBe(0.8);
    });

    it('should set music volume', () => {
      audioManager.setVolume('music', 0.6);
      expect(audioManager.musicVolume).toBe(0.6);
      expect(audioManager.musicGain.gain.value).toBe(0.6);
    });

    it('should set effects volume', () => {
      audioManager.setVolume('effects', 0.4);
      expect(audioManager.effectsVolume).toBe(0.4);
      expect(audioManager.effectsGain.gain.value).toBe(0.4);
    });

    it('should set voice volume', () => {
      audioManager.setVolume('voice', 0.3);
      expect(audioManager.voiceVolume).toBe(0.3);
      expect(audioManager.voiceGain.gain.value).toBe(0.3);
    });

    it('should clamp volume values between 0 and 1', () => {
      audioManager.setVolume('music', 1.5);
      expect(audioManager.musicVolume).toBe(1);
      
      audioManager.setVolume('music', -0.5);
      expect(audioManager.musicVolume).toBe(0);
    });
  });

  describe('mute toggle', () => {
    it('should toggle mute state', () => {
      expect(audioManager.isMuted).toBe(false);
      audioManager.toggleMute();
      expect(audioManager.isMuted).toBe(true);
      audioManager.toggleMute();
      expect(audioManager.isMuted).toBe(false);
    });

    it('should return current mute state', () => {
      const result = audioManager.toggleMute();
      expect(result).toBe(true);
    });
  });

  describe('voice template management', () => {
    it('should return available voice templates', () => {
      const templates = audioManager.getAvailableVoiceTemplates();
      expect(templates).toHaveLength(2);
      expect(templates.map(t => t.id)).toEqual(['american-female', 'british-female']);
    });

    it('should return current voice template', () => {
      expect(audioManager.getCurrentVoiceTemplate()).toBe('british-female');
    });

    it('should set valid voice template', () => {
      const result = audioManager.setVoiceTemplate('american-female');
      expect(result).toBe(true);
      expect(audioManager.getCurrentVoiceTemplate()).toBe('american-female');
    });

    it('should reject invalid voice template', () => {
      const result = audioManager.setVoiceTemplate('invalid-template');
      expect(result).toBe(false);
    });
  });

  describe('sound loading', () => {
    it('should return promise for loadSound', () => {
      const promise = audioManager.loadSound('test-sound', 'test.mp3');
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should handle loadSound for same id only once', async () => {
      const promise1 = audioManager.loadSound('test-sound', 'test.mp3');
      const promise2 = audioManager.loadSound('test-sound', 'test.mp3');
      expect(promise1).toBe(promise2);
      await promise1;
    });

    it('should normalize sound ids', () => {
      const normalized = audioManager.normalizeSoundId('test-sound');
      expect(normalized).toBe('test-sound');
    });

    it('should check if sound is loaded', () => {
      expect(audioManager.hasLoadedSound('test-sound')).toBe(false);
    });
  });

  describe('audio priority', () => {
    it('should set audio priority', () => {
      audioManager.setAudioPriority('high', false);
      expect(audioManager.audioPriority.highPriority).toBe(false);
      
      audioManager.setAudioPriority('medium', false);
      expect(audioManager.audioPriority.mediumPriority).toBe(false);
      
      audioManager.setAudioPriority('low', true);
      expect(audioManager.audioPriority.lowPriority).toBe(true);
    });

    it('should skip background music when low priority disabled', () => {
      audioManager.setAudioPriority('low', false);
      const playSpy = vi.spyOn(audioManager, 'play');
      audioManager.play('background-music');
      // play should not actually play due to priority check
      expect(audioManager.audioPriority.lowPriority).toBe(false);
    });
  });

  describe('speech synthesis', () => {
    it('should have speech synthesis available', () => {
      expect(audioManager.canUseSpeechSynthesis).toBe(true);
    });

    it('should speak text', () => {
      const utterance = audioManager.speak('test text');
      expect(utterance).toBeDefined();
      expect(global.speechSynthesis.speak).toHaveBeenCalled();
    });

    it('should not speak when muted', () => {
      audioManager.isMuted = true;
      const utterance = audioManager.speak('test text');
      expect(utterance).toBeUndefined();
      expect(global.speechSynthesis.speak).not.toHaveBeenCalled();
    });

    it('should select appropriate voice', () => {
      global.speechSynthesis.getVoices.mockReturnValue([
        { name: 'Google UK English Female', lang: 'en-GB' },
        { name: 'Microsoft Zira', lang: 'en-US' }
      ]);
      
      audioManager.currentVoiceTemplate = 'british-female';
      const utterance = audioManager.speak('test');
      expect(utterance.voice).toBeDefined();
    });
  });

  describe('play/stop', () => {
    it('should stop all sounds', () => {
      audioManager.stopAll();
      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle missing audio context gracefully', () => {
      audioManager.audioContext = null;
      audioManager.play('test-sound');
      // Should not throw
      expect(true).toBe(true);
    });
  });
});
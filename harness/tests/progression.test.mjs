import { describe, it, expect, vi, beforeEach } from 'vitest';

// Comprehensive DOM + Web Audio mock (modeled on game-state.test.mjs, with a
// capturing createBuffer so we can assert per-letter phoneme output differs).
function setupDOM() {
  document.body.innerHTML = `
    <main id="welcome-screen" class="screen active"></main>
    <main id="level-select-screen" class="screen"></main>
    <main id="gameplay-screen" class="screen"></main>
    <div id="ready-overlay" class="overlay hidden"></div>
    <div id="settings-panel" class="settings-panel hidden"></div>
    <div id="coming-soon-popup" class="popup hidden"></div>
    <div id="level-complete-popup" class="popup hidden"></div>
    <button id="start-game-btn"></button>
    <button id="settings-btn"></button>
    <button id="close-settings"></button>
    <input id="music-volume" type="range" min="0" max="100" value="50">
    <span id="music-volume-display"></span>
    <input id="effects-volume" type="range" min="0" max="100" value="70">
    <span id="effects-volume-display"></span>
    <input id="high-priority-audio" type="checkbox" checked>
    <input id="medium-priority-audio" type="checkbox" checked>
    <input id="low-priority-audio" type="checkbox">
    <select id="voice-template-select">
      <option value="american-female">American Female</option>
      <option value="british-female">British Female</option>
    </select>
    <button id="preview-voice"></button>
    <button id="mute-toggle"></button>
    <button id="next-level-btn"></button>
    <button id="exit-btn"></button>
    <button id="close-popup"></button>
    <div class="letter-grid"></div>
    <div class="planets-container"></div>
    <div class="welcome-background"></div>
    <div class="welcome-stars"></div>
    <div class="welcome-planets"></div>
    <div class="welcome-asteroids"></div>
    <div class="welcome-container"></div>
    <div class="welcome-actions"></div>
    <span class="welcome-kicker"></span>
    <h1 id="welcome-title" class="pulsating-text"></h1>
    <p class="welcome-subtitle"></p>
    <span id="teacher-evan" class="teacher-name"></span>
    <span class="welcome-to"></span>
    <span class="fun-with"></span>
    <span id="active-letter-display"></span>
    <div id="progress-fill"></div>
    <span id="hits-counter"></span>
    <span id="ready-letter-display"></span>
    <span id="level-complete-letter"></span>
  `;

  class MockAudioContext {
    constructor() {
      this.destination = {};
      this.state = 'running';
      this.sampleRate = 44100;
      this._lastData = null;
    }
    createGain() {
      return { connect: vi.fn(), gain: { value: 1 } };
    }
    createBuffer(ch, len, rate) {
      const data = new Float32Array(len);
      this._lastData = data;
      return { getChannelData: () => data, length: len };
    }
    createBufferSource() {
      return {
        start: vi.fn(),
        stop: vi.fn(),
        connect: vi.fn(),
        buffer: null,
        loop: false,
      };
    }
    decodeAudioData() {
      return Promise.resolve({ duration: 1 });
    }
    close() {
      return Promise.resolve();
    }
  }
  global.AudioContext = MockAudioContext;
  global.webkitAudioContext = MockAudioContext;
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    })
  );
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
    getVoices: vi.fn(() => [{ name: 'Test Voice', lang: 'en-US' }]),
    speak: vi.fn(),
    onvoiceschanged: null,
  };
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
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
  global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
  global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));
  class MockIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
      this.observe = vi.fn();
      this.unobserve = vi.fn();
      this.disconnect = vi.fn();
      this.takeRecords = vi.fn(() => []);
    }
  }
  global.IntersectionObserver = MockIntersectionObserver;
}

import '../../js/event-bus.js';
import '../../js/event-manager.js';
import '../../js/audio-manager.js';
import '../../js/collision-manager.js';
import '../../js/performance-utils.js';
import '../../js/main.js';

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Task 1: per-letter phoneme sound profile
// ---------------------------------------------------------------------------
describe('generatePhonemeSound per-letter profiles', () => {
  let am;
  beforeEach(() => {
    vi.clearAllMocks();
    setupDOM();
    am = new window.AudioManager();
  });

  it('produces distinct output for different non-G letters (no generic default)', () => {
    am.generatePhonemeSound('b');
    const bData = Float32Array.from(am.audioContext._lastData);
    am.generatePhonemeSound('c');
    const cData = Float32Array.from(am.audioContext._lastData);
    expect(arraysEqual(bData, cData)).toBe(false);
  });

  it('returns an audible source for every letter A-Z', () => {
    for (const l of 'abcdefghijklmnopqrstuvwxyz') {
      const src = am.generatePhonemeSound(l);
      expect(src).toBeTruthy();
      expect(typeof src.start).toBe('function');
    }
  });
});

// ---------------------------------------------------------------------------
// Task 2: offline-safe word audio routing (skip fetch for unrecorded letters)
// ---------------------------------------------------------------------------
describe('word audio routing', () => {
  let am;
  beforeEach(() => {
    vi.clearAllMocks();
    setupDOM();
    am = new window.AudioManager();
  });

  it('does not attempt to fetch a .wav for letters without recorded assets', () => {
    const fetchSpy = vi.spyOn(am, 'ensureSoundLoaded');
    am.ensureLetterAudio('A');
    const voiceCalls = fetchSpy.mock.calls.filter(
      ([id]) => typeof id === 'string' && id.startsWith('voice-')
    );
    expect(voiceCalls).toHaveLength(0);
  });

  it('does fetch recorded voice assets for letter G', () => {
    const fetchSpy = vi.spyOn(am, 'ensureSoundLoaded');
    am.ensureLetterAudio('G');
    const voiceCalls = fetchSpy.mock.calls.filter(
      ([id]) => typeof id === 'string' && id.startsWith('voice-')
    );
    expect(voiceCalls.length).toBeGreaterThan(0);
  });
});

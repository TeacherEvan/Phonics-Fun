/**
 * Shared test helpers for the regression suite.
 *
 * The pre-existing test files each carry their own copy of a DOM setup. This
 * module exists so the new regression tests can share one implementation
 * without touching the existing suites.
 */

import { vi } from 'vitest';

/**
 * Build a DOM with every element the game controller expects.
 * @returns {void}
 */
export function setupGameDOM() {
    document.body.innerHTML = `
    <main id="welcome-screen" class="screen active"></main>
    <main id="level-select-screen" class="screen"></main>
    <main id="gameplay-screen" class="screen"></main>
    <div id="ready-overlay" class="overlay hidden"></div>
    <div id="settings-panel" class="settings-panel hidden"></div>
    <div id="coming-soon-popup" class="popup hidden"></div>
    <div id="level-complete-popup" class="popup hidden"><div class="popup-content"></div></div>
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
    <button id="export-data-btn"></button>
    <button id="mute-toggle"></button>
    <button id="next-level-btn"></button>
    <button id="exit-btn"></button>
    <button id="close-popup"></button>
    <span id="game-announcer" aria-live="polite"></span>
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
    <div class="word-background"></div>
    <div class="asteroids-container"></div>
    <div class="explosions-container"></div>
  `;
}

/**
 * Install an AudioContext mock whose state is controllable.
 *
 * The historical mock hard-coded `state = 'running'`, which made the
 * suspended-context defect structurally invisible to the test suite.
 *
 * @param {{initialState?: string}} [options]
 * @returns {() => {state: string, contexts: number}}
 */
export function installAudioContextMock({ initialState = 'suspended' } = {}) {
    const state = { state: initialState, contexts: 0 };

    class MockAudioContext {
        constructor() {
            state.contexts += 1;
            this.destination = {};
            this.state = initialState;
            this.sampleRate = 44100;
            this.currentTime = 0;
            this.resume = vi.fn(() => {
                this.state = 'running';
                return Promise.resolve();
            });
            this.suspend = vi.fn(() => {
                this.state = 'suspended';
                return Promise.resolve();
            });
            this.close = vi.fn(() => Promise.resolve());
        }
        createGain() {
            return { connect: vi.fn(), gain: { value: 1 } };
        }
        createBuffer(ch, len, rate) {
            return { getChannelData: () => new Float32Array(len), length: len };
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
    }

    global.AudioContext = MockAudioContext;
    global.webkitAudioContext = MockAudioContext;

    return state;
}

/**
 * Install the remaining browser globals the game relies on.
 * @param {{fetchImpl?: Function}} [options]
 * @returns {void}
 */
export function installBrowserGlobals({ fetchImpl } = {}) {
    global.fetch =
        fetchImpl ||
        vi.fn(() =>
            Promise.resolve({
                ok: true,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
            }),
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

    global.IntersectionObserver = class MockIntersectionObserver {
        constructor(callback) {
            this.callback = callback;
            this.observe = vi.fn();
            this.unobserve = vi.fn();
            this.disconnect = vi.fn();
            this.takeRecords = vi.fn(() => []);
        }
    };
}

/**
 * Replace requestAnimationFrame with a manually pumped implementation.
 * @returns {{pump: (frames?: number) => void, pending: () => number}}
 */
export function installManualAnimationFrame() {
    let queue = [];
    let nextId = 1;

    global.requestAnimationFrame = vi.fn((cb) => {
        const id = nextId++;
        queue.push({ id, cb });
        return id;
    });
    global.cancelAnimationFrame = vi.fn((id) => {
        queue = queue.filter((entry) => entry.id !== id);
    });

    return {
        pump(frames = 1) {
            for (let i = 0; i < frames; i++) {
                const current = queue;
                queue = [];
                for (const entry of current) entry.cb(performance.now());
            }
        },
        pending() {
            return queue.length;
        },
    };
}

/**
 * Give an element a deterministic bounding box.
 * @param {HTMLElement} element
 * @param {{left: number, top: number, width: number, height: number}} rect
 */
export function stubRect(element, rect) {
    element.getBoundingClientRect = () => ({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
    });
}

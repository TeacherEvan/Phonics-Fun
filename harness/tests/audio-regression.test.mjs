/**
 * Regression suite for the audio defects found by the 2026-10-22 surgical
 * audit. Each test here fails against the pre-fix code.
 *
 * Covered:
 *  P0-1  the AudioContext is never resumed -> the game is silent on every
 *        autoplay-gated browser (Chrome mobile, Android WebView, BenQ board)
 *  P1-11 a second AudioContext is allocated by a module-level singleton
 *  P1-17 a missing sound asset is re-requested on every play() (404 storm)
 *  P0-4  an unguarded localStorage read aborts the GameState constructor
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    setupGameDOM,
    installAudioContextMock,
    installBrowserGlobals,
} from './helpers/env.mjs';

describe('P0-1: the AudioContext is resumed on the first user gesture', () => {
    let audioState;

    beforeEach(() => {
        vi.clearAllMocks();
        setupGameDOM();
        audioState = installAudioContextMock({ initialState: 'suspended' });
        installBrowserGlobals();
    });

    afterEach(async () => {
        const { AudioManager } = await import('../../js/audio-manager.js');
        if (AudioManager) {
            // nothing to tear down: instances are created per test
        }
    });

    it('starts in the suspended state and reports it', async () => {
        const { default: AudioManager } =
            await import('../../js/audio-manager.js');
        const audioManager = new AudioManager();

        expect(audioManager.getAudioContextState()).toBe('suspended');
        expect(audioManager.audioContext.currentTime).toBe(0);
    });

    it('resumes the instance context when the user first interacts', async () => {
        const { default: AudioManager } =
            await import('../../js/audio-manager.js');
        const audioManager = new AudioManager();

        expect(audioManager.audioContext.resume).not.toHaveBeenCalled();

        window.dispatchEvent(new Event('pointerdown'));
        await Promise.resolve();

        expect(audioManager.audioContext.resume).toHaveBeenCalledTimes(1);
        expect(audioManager.getAudioContextState()).toBe('running');
    });

    it('does not resume a context that is already running', async () => {
        const { default: AudioManager } =
            await import('../../js/audio-manager.js');
        const audioManager = new AudioManager();
        audioManager.audioContext.state = 'running';

        window.dispatchEvent(new Event('pointerdown'));
        await Promise.resolve();

        expect(audioManager.audioContext.resume).not.toHaveBeenCalled();
    });

    it('resumes on touchstart and keydown too', async () => {
        const { default: AudioManager } =
            await import('../../js/audio-manager.js');
        const audioManager = new AudioManager();

        window.dispatchEvent(new Event('touchstart'));
        await Promise.resolve();
        expect(audioManager.audioContext.resume).toHaveBeenCalledTimes(1);

        const second = new AudioManager();
        window.dispatchEvent(new Event('keydown'));
        await Promise.resolve();
        expect(second.audioContext.resume).toHaveBeenCalledTimes(1);
    });

    it('suspends and resumes with the page visibility', async () => {
        const { default: AudioManager } =
            await import('../../js/audio-manager.js');
        const audioManager = new AudioManager();
        audioManager.audioContext.state = 'running';

        await audioManager.suspendIfRunning();
        expect(audioManager.audioContext.suspend).toHaveBeenCalledTimes(1);
        expect(audioManager.getAudioContextState()).toBe('suspended');

        await audioManager.resumeIfSuspended();
        expect(audioManager.audioContext.resume).toHaveBeenCalledTimes(1);
        expect(audioManager.getAudioContextState()).toBe('running');
    });
});

describe('P1-11: exactly one AudioContext is allocated', () => {
    let audioState;

    beforeEach(() => {
        vi.clearAllMocks();
        setupGameDOM();
        audioState = installAudioContextMock({ initialState: 'running' });
        installBrowserGlobals();
    });

    it('does not create a module-level singleton AudioManager', async () => {
        await import('../../js/audio-manager.js');
        await import('../../js/main.js');

        // The module itself must not allocate a context.
        expect(audioState.contexts).toBe(0);
    });

    it('allocates one context per AudioManager instance', async () => {
        const { default: AudioManager } =
            await import('../../js/audio-manager.js');
        const before = audioState.contexts;
        const audioManager = new AudioManager();
        expect(audioState.contexts).toBe(before + 1);

        // The game controller creates exactly one instance.
        const { GameState } = await import('../../js/main.js');
        const game = new GameState();
        expect(game.audioManager).toBeInstanceOf(AudioManager);
        expect(game.audioManager.audioContext).toBeTruthy();
    });
});

describe('P1-17: a missing sound asset is not requested twice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupGameDOM();
        installAudioContextMock({ initialState: 'running' });
    });

    it('caches the failure and does not re-request it', async () => {
        const fetchImpl = vi.fn(() =>
            Promise.resolve({
                ok: false,
                status: 404,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
            }),
        );
        installBrowserGlobals({ fetchImpl });

        const { default: AudioManager } =
            await import('../../js/audio-manager.js');
        const audioManager = new AudioManager();

        await audioManager.ensureSoundLoaded('phoneme-b');
        const callsAfterFirst = fetchImpl.mock.calls.length;
        expect(callsAfterFirst).toBeGreaterThan(0);

        await audioManager.ensureSoundLoaded('phoneme-b');
        await audioManager.ensureSoundLoaded('phoneme-b');

        expect(fetchImpl.mock.calls.length).toBe(callsAfterFirst);
    });
});

describe('P0-4: a storage failure does not abort the game', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupGameDOM();
        installAudioContextMock({ initialState: 'running' });
        installBrowserGlobals();
    });

    it('survives a localStorage that throws SecurityError', async () => {
        global.localStorage = {
            getItem: vi.fn(() => {
                throw new DOMException('blocked', 'SecurityError');
            }),
            setItem: vi.fn(() => {
                throw new DOMException('blocked', 'SecurityError');
            }),
            removeItem: vi.fn(),
        };

        const { default: AudioManager } =
            await import('../../js/audio-manager.js');
        const audioManager = new AudioManager();

        expect(() => audioManager.loadSettings({})).not.toThrow();
        expect(audioManager.getCurrentVoiceTemplate()).toBe('british-female');
    });

    it('still boots the whole game when storage is blocked', async () => {
        global.localStorage = {
            getItem: vi.fn(() => {
                throw new DOMException('blocked', 'SecurityError');
            }),
            setItem: vi.fn(() => {
                throw new DOMException('blocked', 'SecurityError');
            }),
            removeItem: vi.fn(),
        };

        const { GameState } = await import('../../js/main.js');
        expect(() => new GameState()).not.toThrow();
    });
});

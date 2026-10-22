/**
 * Regression suite for the excitement / arcade polish sweep.
 *
 * The feature sweep added a streak multiplier, a live mission score, a
 * floating feedback layer, a star rating and three synthesised sounds. None
 * of it came with tests, so the behaviour below was unverified.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    setupGameDOM,
    installAudioContextMock,
    installBrowserGlobals,
} from './helpers/env.mjs';

/** The DOM the excitement features need on top of the standard game DOM. */
function setupExcitementDOM() {
    setupGameDOM();
    const gameplay = document.getElementById('gameplay-screen');
    gameplay.insertAdjacentHTML(
        'beforeend',
        `
        <div class="floating-text-container" id="floating-text-container"></div>
        <div class="score-display">
            <span class="score-label">Score</span>
            <span class="score-value score-number" id="game-score">0</span>
        </div>
        <div id="streak-banner" class="streak-badge hidden">🔥 <span id="streak-count">1</span>x COMBO!</div>
        <div class="level-stars" id="level-stars">
            <span class="star-icon star-1">⭐</span>
            <span class="star-icon star-2">⭐</span>
            <span class="star-icon star-3">⭐</span>
        </div>
        <p class="level-score-summary">Score: <span id="final-score">0</span></p>
        <div class="galaxy-background"></div>
    `,
    );
}

describe('streak multiplier and mission score', () => {
    let game;

    beforeEach(async () => {
        vi.clearAllMocks();
        setupExcitementDOM();
        installAudioContextMock({ initialState: 'running' });
        installBrowserGlobals();
        const { GameState } = await import('../../js/main.js');
        game = new GameState();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    /** Drive a correct collision through the real handler. */
    function scoreCorrectHit() {
        game.isGameplayActive = true;
        game.renderGameplayPlanets();
        const planet = document.querySelector('.planet.a-planet');
        const asteroidId = `asteroid-fiery-${game.asteroidSequence + 1}`;
        const asteroidElement = document.createElement('div');
        document
            .querySelector('.asteroids-container')
            .appendChild(asteroidElement);
        game.collisionManager.registerObject(
            asteroidId,
            asteroidElement,
            'asteroid',
            { data: { type: 'fiery' } },
        );
        const targetId = planet.dataset.collisionId;
        game.collisionManager.registerObject(targetId, planet, 'planet', {
            data: { letter: game.activeLetterLevel },
        });
        game.handleAsteroidPlanetCollision(
            game.collisionManager.getObject(asteroidId),
            game.collisionManager.getObject(targetId),
        );
    }

    it('starts with no score and no streak', () => {
        expect(game.gameScore).toBe(0);
        expect(game.currentStreak).toBe(0);
        expect(game.highestStreak).toBe(0);
    });

    it('awards 100 points for the first hit', () => {
        scoreCorrectHit();
        expect(game.gameScore).toBe(100);
        expect(game.currentStreak).toBe(1);
    });

    it('multiplies the points by the streak', () => {
        scoreCorrectHit();
        scoreCorrectHit();
        expect(game.currentStreak).toBe(2);
        // 100 * 1 + 100 * 2
        expect(game.gameScore).toBe(300);
    });

    it('records the highest streak', () => {
        scoreCorrectHit();
        scoreCorrectHit();
        scoreCorrectHit();
        expect(game.highestStreak).toBe(3);
    });

    it('resets the streak on a miss but keeps the score', () => {
        scoreCorrectHit();
        scoreCorrectHit();
        const scoreBefore = game.gameScore;

        game.handleIncorrectCollision(
            document.createElement('div'),
            100,
            100,
            'asteroid-dull-1',
        );

        expect(game.currentStreak).toBe(0);
        expect(game.gameScore).toBe(scoreBefore);
    });

    it('resets the score with the other per-level counters', () => {
        scoreCorrectHit();
        expect(game.gameScore).toBe(100);

        game.resetGameplayState();

        // The score is a per-level figure: it is shown next to the per-level
        // hit counter, so it must not carry over to the next letter.
        expect(game.gameScore).toBe(0);
        expect(game.currentStreak).toBe(0);
    });

    it('writes the score into the HUD', () => {
        scoreCorrectHit();
        expect(document.getElementById('game-score').textContent).toBe('100');
    });

    it('shows the streak banner only from the second hit', () => {
        const banner = document.getElementById('streak-banner');

        scoreCorrectHit();
        expect(banner.classList.contains('hidden')).toBe(true);

        scoreCorrectHit();
        expect(banner.classList.contains('hidden')).toBe(false);
        expect(banner.textContent).toContain('2x');
    });
});

describe('floating feedback text', () => {
    let game;

    beforeEach(async () => {
        vi.clearAllMocks();
        setupExcitementDOM();
        installAudioContextMock({ initialState: 'running' });
        installBrowserGlobals();
        const { GameState } = await import('../../js/main.js');
        game = new GameState();
    });

    it('spawns a floating element at the given coordinates', () => {
        game.showFloatingText(120, 240, '+100', 'score');

        const el = document.querySelector(
            '#floating-text-container .floating-text',
        );
        expect(el).toBeTruthy();
        expect(el.textContent).toBe('+100');
        expect(el.classList.contains('score')).toBe(true);
        expect(el.style.left).toBe('120px');
        expect(el.style.top).toBe('240px');
    });

    it('removes the element again', () => {
        vi.useFakeTimers();
        game.showFloatingText(10, 10, 'TRY AGAIN!', 'miss');
        expect(document.querySelectorAll('.floating-text').length).toBe(1);

        vi.advanceTimersByTime(1200);

        expect(document.querySelectorAll('.floating-text').length).toBe(0);
        vi.useRealTimers();
    });

    it('clears any leftover floating text on a level reset', () => {
        game.showFloatingText(10, 10, '+100', 'score');
        expect(document.querySelectorAll('.floating-text').length).toBe(1);

        game.resetGameplayState();

        expect(document.querySelectorAll('.floating-text').length).toBe(0);
    });
});

describe('level star rating', () => {
    let game;

    beforeEach(async () => {
        vi.clearAllMocks();
        setupExcitementDOM();
        installAudioContextMock({ initialState: 'running' });
        installBrowserGlobals();
        const { GameState } = await import('../../js/main.js');
        game = new GameState();
    });

    it('awards three stars at 80% accuracy or better', () => {
        game.correctHitsCount = 8;
        game.incorrectHitsCount = 2;
        game.completeLevelSuccessfully();
        expect(document.getElementById('level-stars').className).toContain(
            'stars-earned-3',
        );
    });

    it('awards two stars at 50% accuracy or better', () => {
        game.correctHitsCount = 5;
        game.incorrectHitsCount = 5;
        game.completeLevelSuccessfully();
        expect(document.getElementById('level-stars').className).toContain(
            'stars-earned-2',
        );
    });

    it('awards one star below 50% accuracy', () => {
        game.correctHitsCount = 3;
        game.incorrectHitsCount = 7;
        game.completeLevelSuccessfully();
        expect(document.getElementById('level-stars').className).toContain(
            'stars-earned-1',
        );
    });

    it('reports the mission score in the completion popup', () => {
        game.gameScore = 600;
        game.completeLevelSuccessfully();
        expect(document.getElementById('final-score').textContent).toBe('600');
    });
});

describe('synthesised excitement sounds', () => {
    let audioManager;

    beforeEach(async () => {
        vi.clearAllMocks();
        setupExcitementDOM();
        installAudioContextMock({ initialState: 'running' });
        installBrowserGlobals();
        const { default: AudioManager } =
            await import('../../js/audio-manager.js');
        audioManager = new AudioManager();
    });

    it('plays a streak chime that rises with the streak', () => {
        const first = audioManager.playStreakChime(1);
        const third = audioManager.playStreakChime(3);

        expect(first).toBeTruthy();
        expect(third).toBeTruthy();
        expect(first.start).toHaveBeenCalled();
        expect(third.start).toHaveBeenCalled();
    });

    it('caps the streak so a huge streak cannot index past the note table', () => {
        expect(() => audioManager.playStreakChime(999)).not.toThrow();
    });

    it('plays a miss tone and a victory fanfare', () => {
        expect(audioManager.playIncorrectSound()).toBeTruthy();
        expect(audioManager.playVictoryFanfare()).toBeTruthy();
    });

    it('stays silent when muted', () => {
        audioManager.isMuted = true;
        expect(audioManager.playStreakChime(1)).toBeNull();
        expect(audioManager.playIncorrectSound()).toBeNull();
        expect(audioManager.playVictoryFanfare()).toBeNull();
    });
});

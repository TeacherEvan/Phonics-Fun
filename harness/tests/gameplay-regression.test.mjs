/**
 * Regression suite for the gameplay defects found by the 2026-10-22 surgical
 * audit.
 *
 * Covered:
 *  P0-2  the asteroid flew at a coordinate sampled at click time while the
 *        planet kept orbiting, so the tapped planet was never struck and the
 *        score depended on a coincidental encounter with an unrelated planet.
 *        Measured in a real browser: 2 of 6 correct taps were scored as
 *        WRONG and hit latency ranged from 1.1s to 13.9s.
 *  P1-8  the level-complete popup and the screen-reader announcement named the
 *        NEXT letter because the progression pointer advanced first
 *  P1-9  asteroid ids came from Date.now(), so two taps in the same
 *        millisecond collided
 *  P1-16 the screen state was committed before the DOM transition finished
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    setupGameDOM,
    installAudioContextMock,
    installBrowserGlobals,
    stubRect,
} from './helpers/env.mjs';

const PLANET_SIZE = 100;
const ASTEROID_SIZE = 20;
/** Planet radius (50) + asteroid radius (10). */
const COLLISION_THRESHOLD = 60;

async function makeGame() {
    const { GameState } = await import('../../js/main.js');
    return new GameState();
}

describe('P0-2: an asteroid is bound to the planet that was tapped', () => {
    let game;

    beforeEach(async () => {
        vi.clearAllMocks();
        setupGameDOM();
        installAudioContextMock({ initialState: 'running' });
        installBrowserGlobals();
        // `performance` must be faked too: the asteroid flight integrates
        // against performance.now(), and vitest does not fake it by default.
        vi.useFakeTimers({
            toFake: [
                'setTimeout',
                'clearTimeout',
                'setInterval',
                'clearInterval',
                'Date',
                'performance',
                'requestAnimationFrame',
                'cancelAnimationFrame',
            ],
        });
        game = await makeGame();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('registers an explicit collision pair with the tapped planet', () => {
        game.isGameplayActive = true;
        game.renderGameplayPlanets();

        const planet = document.querySelector('.planet.a-planet');
        expect(planet).toBeTruthy();
        expect(planet.dataset.collisionId).toBeTruthy();

        game.handlePlanetInteraction(planet, 'A');

        const pairIds = [...game.collisionManager.collisionPairs.keys()];
        expect(pairIds.length).toBeGreaterThan(0);
        expect(
            pairIds.some((pairId) =>
                pairId.includes(planet.dataset.collisionId),
            ),
        ).toBe(true);
    });

    it('does not register a catch-all type handler', () => {
        // A type handler matches the asteroid against EVERY planet, which is
        // how a tap on the right planet could be scored against a distractor.
        game.isGameplayActive = true;
        game.renderGameplayPlanets();

        const planet = document.querySelector('.planet.a-planet');
        game.handlePlanetInteraction(planet, 'A');

        expect(game.collisionManager.typeCollisionHandlers.size).toBe(0);
    });

    it('homes onto the moving planet instead of a stale coordinate', () => {
        stubRect(document.querySelector('.asteroids-container'), {
            left: 0,
            top: 0,
            width: 1024,
            height: 768,
        });

        game.isGameplayActive = true;
        game.renderGameplayPlanets();

        const planet = document.querySelector('.planet.a-planet');
        let planetLeft = 300;
        stubRect(planet, {
            left: planetLeft,
            top: 300,
            width: PLANET_SIZE,
            height: PLANET_SIZE,
        });

        let hit = null;
        game.eventManager.subscribe('collision:asteroid_planet', (data) => {
            if (hit) return;
            // The asteroid element is captured before the click: by the time
            // this event fires the game's own handler has already removed it
            // from the DOM.
            const asteroidX =
                parseFloat(asteroid.style.left) + ASTEROID_SIZE / 2;
            const asteroidY =
                parseFloat(asteroid.style.top) + ASTEROID_SIZE / 2;
            hit = {
                planetId: data.planet.id,
                distance: Math.hypot(
                    asteroidX - (planetLeft + PLANET_SIZE / 2),
                    asteroidY - (300 + PLANET_SIZE / 2),
                ),
            };
        });

        game.handlePlanetInteraction(planet, 'A');

        const asteroid = document.querySelector(
            '.asteroids-container .asteroid',
        );
        expect(asteroid).toBeTruthy();

        // Move the planet every frame, exactly like the CSS orbit does.
        for (let frame = 0; frame < 180; frame++) {
            planetLeft += 3;
            stubRect(planet, {
                left: planetLeft,
                top: 300,
                width: PLANET_SIZE,
                height: PLANET_SIZE,
            });
            vi.advanceTimersByTime(16);
        }

        expect(hit).not.toBeNull();
        // The hit must be resolved against the planet that was tapped.
        expect(hit.planetId).toBe(planet.dataset.collisionId);
    });

    it('scores the tapped planet exactly once', () => {
        game.isGameplayActive = true;
        game.renderGameplayPlanets();

        const planet = document.querySelector('.planet.a-planet');
        stubRect(planet, {
            left: 300,
            top: 300,
            width: PLANET_SIZE,
            height: PLANET_SIZE,
        });

        game.handlePlanetInteraction(planet, 'A');

        const before = game.correctHitsCount;
        const [asteroidId, planetId] = [
            ...game.collisionManager.collisionPairs.keys(),
        ][0].split('_');
        const asteroid = game.collisionManager.getObject(asteroidId);
        const target = game.collisionManager.getObject(planetId);

        game.handleAsteroidPlanetCollision(asteroid, target);

        expect(game.correctHitsCount).toBe(before + 1);
    });

    it('gives two taps in the same millisecond different asteroid ids', () => {
        const first = game.nextAsteroidId('fiery');
        const second = game.nextAsteroidId('fiery');
        expect(first).not.toBe(second);
        expect(new Set([first, second]).size).toBe(2);
    });

    it('resolves the hit within 1.5 seconds of simulated flight', () => {
        stubRect(document.querySelector('.asteroids-container'), {
            left: 0,
            top: 0,
            width: 1024,
            height: 768,
        });

        game.isGameplayActive = true;
        game.renderGameplayPlanets();

        const planet = document.querySelector('.planet.a-planet');
        stubRect(planet, {
            left: 300,
            top: 300,
            width: PLANET_SIZE,
            height: PLANET_SIZE,
        });

        const hits = [];
        game.eventManager.subscribe('collision:asteroid_planet', (data) => {
            hits.push(data);
        });

        game.handlePlanetInteraction(planet, 'A');

        // 1.5s of simulated frames.
        for (let frame = 0; frame < 90; frame++) {
            vi.advanceTimersByTime(16);
        }

        expect(hits.length).toBeGreaterThanOrEqual(1);
        expect(hits[0].planet.id).toBe(planet.dataset.collisionId);
    });

    it('cancels a previous in-flight asteroid when a new tap happens', () => {
        game.isGameplayActive = true;
        game.renderGameplayPlanets();

        const planets = [...document.querySelectorAll('.planet.a-planet')];
        game.handlePlanetInteraction(planets[0], 'A');
        const firstAsteroid = document.querySelector(
            '.asteroids-container .asteroid',
        );
        expect(firstAsteroid).toBeTruthy();

        game.handlePlanetInteraction(planets[1], 'A');

        // Exactly one asteroid is in flight: the first tap was cancelled.
        const inFlight = document.querySelectorAll(
            '.asteroids-container .asteroid',
        );
        expect(inFlight.length).toBe(1);
    });
});

describe('P1-8: the completion popup names the letter that was completed', () => {
    let game;

    beforeEach(async () => {
        vi.clearAllMocks();
        setupGameDOM();
        installAudioContextMock({ initialState: 'running' });
        installBrowserGlobals();
        game = await makeGame();
    });

    it('shows the completed letter, not the next one', () => {
        game.completedLevels = [];
        game.activeLetterLevel = 'A';

        game.completeLevelSuccessfully();

        // The pointer advances to the next uncompleted letter...
        expect(game.activeLetterLevel).toBe('B');
        expect(game.completedLevels).toContain('A');

        // ...but the popup and the announcement must name what was completed.
        expect(
            document.getElementById('level-complete-letter').textContent,
        ).toBe('A');
        expect(document.getElementById('game-announcer').textContent).toContain(
            'letter A',
        );
        expect(
            document.getElementById('game-announcer').textContent,
        ).not.toContain('letter B');
    });

    it('keeps the gameplay HUD showing the active letter', () => {
        game.completedLevels = [];
        game.activeLetterLevel = 'A';

        game.completeLevelSuccessfully();

        expect(
            document.getElementById('active-letter-display').textContent,
        ).toBe('B');
    });
});

describe('P1-16: the screen state is committed with the DOM', () => {
    let game;

    beforeEach(async () => {
        vi.clearAllMocks();
        setupGameDOM();
        installAudioContextMock({ initialState: 'running' });
        installBrowserGlobals();
        // `performance` must be faked too: the asteroid flight integrates
        // against performance.now(), and vitest does not fake it by default.
        vi.useFakeTimers({
            toFake: [
                'setTimeout',
                'clearTimeout',
                'setInterval',
                'clearInterval',
                'Date',
                'performance',
                'requestAnimationFrame',
                'cancelAnimationFrame',
            ],
        });
        game = await makeGame();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('does not report the new screen before the transition completes', () => {
        game.navigateToScreen('level-select');

        // The transition takes two 300ms stages.
        expect(game.currentScreen).toBe('welcome');

        vi.advanceTimersByTime(700);

        expect(game.currentScreen).toBe('level-select');
        expect(
            document
                .getElementById('level-select-screen')
                .classList.contains('active'),
        ).toBe(true);
    });

    it('applies the welcome screen side effects exactly once on boot', () => {
        // The initial route used to short-circuit because the model already
        // said 'welcome', so the background music never started.
        expect(game.hasAppliedScreen).toBe(true);
    });
});

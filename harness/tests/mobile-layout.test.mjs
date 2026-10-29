import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    setupGameDOM,
    installAudioContextMock,
    installBrowserGlobals,
    stubRect,
} from './helpers/env.mjs';

async function makeGame() {
    const { GameState } = await import('../../js/main.js');
    return new GameState();
}

/**
 * Regression guard for the 2026-10-29 mobile obstruction follow-up.
 *
 * The first compact-HUD fix made the strip small, but its resize handler still
 * called `resetGameplayState()`. Rotating a phone therefore deactivated the
 * level, zeroed the score, and rebuilt planets against the pre-rotation
 * viewport. This suite locks both halves: a resize must preserve the session,
 * and a 320×568 playfield must keep a full orbit below the HUD and on-screen.
 */
describe('mobile playfield layout', () => {
    let game;

    beforeEach(async () => {
        vi.clearAllMocks();
        setupGameDOM();
        installAudioContextMock({ initialState: 'running' });
        installBrowserGlobals();
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

    it('does not deactivate gameplay or reset progress on resize', () => {
        game.currentScreen = 'gameplay';
        game.arePlanetsRendered = true;
        game.isGameplayActive = true;
        game.correctHitsCount = 3;
        game.gameScore = 300;

        window.dispatchEvent(new Event('resize'));
        vi.advanceTimersByTime(500);

        expect(game.isGameplayActive).toBe(true);
        expect(game.correctHitsCount).toBe(3);
        expect(game.gameScore).toBe(300);
    });

    it('keeps a planet’s whole orbit inside a 320×568 playfield', () => {
        const area = document.createElement('div');
        area.className = 'game-area';
        document.body.appendChild(area);

        const hud = document.createElement('div');
        hud.className = 'game-ui';
        document.body.appendChild(hud);

        const planet = document.createElement('div');
        planet.className = 'planet';
        document.body.appendChild(planet);
        Object.defineProperty(planet, 'offsetWidth', {
            value: 36,
            configurable: true,
        });

        stubRect(area, { left: 0, top: 0, width: 320, height: 568 });
        stubRect(hud, { left: 8, top: 8, width: 304, height: 75 });

        const radius = game.placePlanetInPlayArea(planet, 70);
        const left = parseFloat(planet.style.left);
        const top = parseFloat(planet.style.top);
        const size = 36;
        const hudBottom = 83;

        expect(radius).toBe(70);
        // `left`/`top` are the unrotated box; the orbit extends `radius` in
        // every direction, so those extents are what must stay visible.
        expect(left - radius).toBeGreaterThanOrEqual(0);
        expect(left + size + radius).toBeLessThanOrEqual(320);
        expect(top - radius).toBeGreaterThanOrEqual(hudBottom);
        expect(top + size + radius).toBeLessThanOrEqual(568);
    });
});

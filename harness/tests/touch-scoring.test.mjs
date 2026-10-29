import { describe, it, expect, beforeEach } from 'vitest';
import AndroidBenQInitializer from '../../js/android-benq-init.js';

/**
 * Regression guard for the mobile dead-tap bug.
 *
 * `setupTouchOptimization()` used to install a non-passive `touchstart`
 * listener on `.game-area` that called `e.preventDefault()` whenever the
 * target was a `.planet`. Cancelling touchstart suppresses the browser's
 * synthetic mouse events, so planets' `click` handlers never fired on a real
 * touch device: the child could see the letters but could not score a hit.
 */
describe('touch scoring on planets', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="game-area">
                <div class="planet target-planet">A</div>
            </div>
        `;
    });

    const makeInitializer = () =>
        Object.create(AndroidBenQInitializer.prototype);

    it('does not cancel touchstart on a planet', () => {
        makeInitializer().setupTouchOptimization();

        const planet = document.querySelector('.planet');
        const touchStart = new Event('touchstart', {
            bubbles: true,
            cancelable: true,
        });
        planet.dispatchEvent(touchStart);

        expect(touchStart.defaultPrevented).toBe(false);
    });

    it('keeps the synthetic click path to a planet handler alive', () => {
        makeInitializer().setupTouchOptimization();

        const planet = document.querySelector('.planet');
        let scored = 0;
        planet.addEventListener('click', () => {
            scored += 1;
        });

        const touchStart = new Event('touchstart', {
            bubbles: true,
            cancelable: true,
        });
        planet.dispatchEvent(touchStart);
        planet.dispatchEvent(new Event('click', { bubbles: true }));

        expect(touchStart.defaultPrevented).toBe(false);
        expect(scored).toBe(1);
    });
});

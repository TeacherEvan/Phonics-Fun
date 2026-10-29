import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
    setupGameDOM,
    installAudioContextMock,
    installBrowserGlobals,
} from './helpers/env.mjs';

describe('Surgical Remediation Verification Suite', () => {
    let store = {};

    beforeEach(() => {
        vi.clearAllMocks();
        setupGameDOM();
        installAudioContextMock();
        installBrowserGlobals();
        store = {};
        global.localStorage.getItem = vi.fn((k) => store[k] ?? null);
        global.localStorage.setItem = vi.fn((k, v) => {
            store[k] = String(v);
        });
        global.localStorage.clear = vi.fn(() => {
            store = {};
        });
    });

    describe('OBJ-001 (P0-1): Service Worker Cache Retention', () => {
        const swPath = path.resolve(process.cwd(), 'public/sw.js');
        const swContent = fs.readFileSync(swPath, 'utf8');

        it('retains the current cache in the activate handler', () => {
            expect(swContent).toContain('if (key !== CACHE_NAME)');
            expect(swContent).toContain('caches.delete(key)');
        });
    });

    describe('OBJ-002 (P0-2): Performance Mode Animation Safety', () => {
        const cssPath = path.resolve(process.cwd(), 'css/styles.css');
        const dmPath = path.resolve(process.cwd(), 'js/display-manager.js');
        const benqPath = path.resolve(process.cwd(), 'js/android-benq-init.js');

        const css = fs.readFileSync(cssPath, 'utf8');
        const dm = fs.readFileSync(dmPath, 'utf8');
        const benq = fs.readFileSync(benqPath, 'utf8');

        it('does not set animation-duration: 0.1s on low-memory or performance-low modes', () => {
            expect(css).not.toMatch(/\.low-memory\s*\*\s*\{[^}]*animation-duration:\s*0\.1s/);
            expect(dm).not.toMatch(/\.performance-low\s*\*\s*\{[^}]*animation-duration:\s*0\.1s/);
            expect(benq).not.toMatch(/\.low-memory\s*\*\s*\{[^}]*animation-duration:\s*0\.1s/);
        });
    });

    describe('OBJ-003 (P1-1): Landscape Playfield Orbit Geometry', () => {
        it('calculates non-zero vertical range on 667x375 landscape viewport', async () => {
            const { GameState } = await import('../../js/main.js');
            const screen = document.getElementById('gameplay-screen');
            screen.innerHTML = `
                <div class="game-area">
                    <div class="game-ui"></div>
                    <div class="planets-container"></div>
                </div>
            `;
            const area = screen.querySelector('.game-area');
            const hud = screen.querySelector('.game-ui');

            // Mock getBoundingClientRect
            area.getBoundingClientRect = () => ({
                top: 0, left: 0, width: 667, height: 375, bottom: 375, right: 667
            });
            hud.getBoundingClientRect = () => ({
                top: 0, left: 0, width: 667, height: 100, bottom: 100, right: 667
            });

            const game = new GameState();
            const dummyPlanet = document.createElement('div');
            dummyPlanet.style.width = '80px';
            dummyPlanet.style.height = '80px';
            Object.defineProperty(dummyPlanet, 'offsetWidth', { value: 80 });
            Object.defineProperty(dummyPlanet, 'offsetHeight', { value: 80 });

            const usedRadius = game.placePlanetInPlayArea(dummyPlanet, 70, { index: 0, total: 8 });
            expect(usedRadius).toBeGreaterThan(0);
            expect(parseInt(dummyPlanet.style.top, 10)).toBeGreaterThan(0);
        });
    });

    describe('OBJ-005 (P1-3) & OBJ-008 (P1-6): Progression & Completion Input Lock', () => {
        it('locks isGameplayActive immediately when correctHits reach totalHits', async () => {
            const { GameState } = await import('../../js/main.js');
            const game = new GameState();
            game.isGameplayActive = true;
            game.totalHits = 5;
            game.correctHits = 4;
            game.activeVocabulary = ['grape', 'goat', 'gold', 'gate', 'girl'];
            game.vocabularyIndex = 4;

            const dummyPlanet = document.createElement('div');
            const dummyAsteroid = document.createElement('div');
            dummyAsteroid.id = 'ast-1';
            document.body.appendChild(dummyPlanet);
            document.body.appendChild(dummyAsteroid);

            game.handleCorrectCollision(dummyPlanet, 100, 100, 'ast-1', 'pl-1');
            expect(game.correctHits).toBe(5);
            expect(game.isGameplayActive).toBe(false);
        });
    });

    describe('OBJ-009 (P1-7): Saved Stats Progression Advancement', () => {
        it('advances activeLetterLevel to next uncompleted letter on load', async () => {
            const { GameState } = await import('../../js/main.js');
            global.localStorage.setItem(
                'phonics_fun_stats',
                JSON.stringify({
                    completedLevels: ['A'],
                    cumCorrect: 5,
                    cumTotal: 5,
                }),
            );

            const game = new GameState();
            game.activeLetterLevel = 'A';
            game.loadSavedStats();

            expect(game.completedLevels).toEqual(['A']);
            expect(game.activeLetterLevel).toBe('B');
        });
    });

    describe('OBJ-010 (P1-8): Particle Ceiling & Starfield Protection', () => {
        it('preserves starfield particles when transient explosion particles exceed limit', async () => {
            const { default: ParticleSystem } = await import('../../js/particles.js');
            const ps = new ParticleSystem();

            // Create 50 stars
            ps.createStarfield();
            const starCountBefore = ps.particles.filter((p) => p.type === 'star').length;
            expect(starCountBefore).toBe(50);

            // Add 180 transient explosion particles
            for (let i = 0; i < 180; i++) {
                ps.createParticle(100, 100, 'explosion');
            }

            const starCountAfter = ps.particles.filter((p) => p.type === 'star').length;
            expect(starCountAfter).toBe(50);
            expect(ps.particles.length).toBeLessThanOrEqual(ps.maxParticles);
            ps.destroy();
        });
    });

    describe('OBJ-011 (P1-9): Screen Transition Concurrency Safety', () => {
        it('cancels pending timeouts when transitionScreens is re-invoked', async () => {
            const { default: UIUtils } = await import('../../js/ui-utils.js');
            const ui = new UIUtils();
            const s1 = document.createElement('div');
            const s2 = document.createElement('div');
            const s3 = document.createElement('div');
            s1.className = 'screen active';
            s2.className = 'screen';
            s3.className = 'screen';
            document.body.appendChild(s1);
            document.body.appendChild(s2);
            document.body.appendChild(s3);

            ui.transitionScreens(s1, s2);
            expect(ui.activeTransitionTimeouts.length).toBeGreaterThan(0);

            // Trigger second transition immediately
            ui.transitionScreens(s2, s3);
            expect(ui.activeTransitionTimeouts.length).toBe(1);
        });
    });
});

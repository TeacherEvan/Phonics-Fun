/**
 * Regression suite for the asset-delivery defects found by the 2026-10-22
 * surgical audit.
 *
 * Covered:
 *  P0-3  every picture URL was built as `Assets/images/...`, which only
 *        resolves on the Vite dev server and 404s in every production build
 *  P0-5  the service worker used a static cache name and was cache-first for
 *        everything, so a redeploy kept serving the previous teacher voice
 *        pack to every device that had already visited the site
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    PHONICS_FUN_LETTER_DATA,
} from '../../js/letter-data.js';
import {
    imagePathFor,
    imagePathCandidates,
    imageDirFor,
    soundPathFor,
} from '../../js/asset-paths.js';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

describe('P0-3: picture URLs address the served public/ tree', () => {
    it('never uses the non-existent "Assets/" prefix', () => {
        for (const letter of Object.keys(PHONICS_FUN_LETTER_DATA)) {
            for (const word of PHONICS_FUN_LETTER_DATA[letter]) {
                const url = imagePathFor(letter, word);
                expect(url.startsWith('Assets/')).toBe(false);
                expect(url.startsWith('/images/')).toBe(true);
            }
        }
    });

    it('uses the letter directory layout that actually exists', () => {
        for (const letter of Object.keys(PHONICS_FUN_LETTER_DATA)) {
            const dir = imageDirFor(letter);
            expect(dir).toBe(`/images/${letter}-${letter.toLowerCase()}/Images/`);

            // The directory may not exist for every letter yet, but when it
            // does it must be the one the code addresses.
            const onDisk = path.join(PUBLIC_DIR, dir.replace(/^\//, ''));
            if (fs.existsSync(onDisk)) {
                expect(fs.statSync(onDisk).isDirectory()).toBe(true);
            }
        }
    });

    it('resolves the artwork that is actually shipped', () => {
        // Only letter G has real artwork, and it is committed under
        // decorated filenames.
        const shipped = [
            ['G', 'girl'],
            ['G', 'goat'],
            ['G', 'gold'],
        ];

        for (const [letter, word] of shipped) {
            const candidates = imagePathCandidates(letter, word);
            const found = candidates.some((url) =>
                fs.existsSync(path.join(PUBLIC_DIR, url.replace(/^\//, '')))
            );
            expect(found).toBe(true);
        }
    });

    it('offers a decorated alias for words whose artwork is not named <word>.png', () => {
        const candidates = imagePathCandidates('G', 'girl');
        expect(candidates.length).toBeGreaterThan(1);
        expect(candidates[0]).toBe('/images/G-g/Images/girl.png');
        expect(candidates.some((url) => url.includes('girl-clipart-lg.png'))).toBe(
            true
        );
    });

    it('keeps the canonical candidate first', () => {
        const candidates = imagePathCandidates('A', 'apple');
        expect(candidates[0]).toBe('/images/A-a/Images/apple.png');
    });
});

describe('P0-3: sound URLs address the served public/ tree', () => {
    it('resolves the bundled sound effects', () => {
        const effects = ['background-music', 'explosion', 'celebration'];
        for (const id of effects) {
            const url = soundPathFor(id);
            expect(url).toMatch(/^\/sounds\//);
            expect(
                fs.existsSync(path.join(PUBLIC_DIR, url.replace(/^\//, '')))
            ).toBe(true);
        }
    });

    it('routes voice assets through the template directory', () => {
        const url = soundPathFor('voice-grape', 'british-female');
        expect(url).toBe('/sounds/voices/british-female/voice-grape.wav');
    });

    it('returns null for an unknown sound id', () => {
        expect(soundPathFor('not-a-sound')).toBeNull();
        expect(soundPathFor('')).toBeNull();
    });
});

describe('P0-5: the service worker versions its cache per build', () => {
    const swSource = fs.readFileSync(
        path.resolve(process.cwd(), 'public/sw.js'),
        'utf8'
    );

    it('stamps a build identifier into the cache name', () => {
        expect(swSource).toContain('__BUILD_ID__');
        expect(swSource).toMatch(/const CACHE_NAME = `phonics-fun-/);
    });

    it('removes every cache on activation, not only differently named ones', () => {
        // The previous implementation kept the previous build's cache alive.
        expect(swSource).not.toMatch(/key !== CACHE_NAME/);
        expect(swSource).toMatch(/caches\.delete\(key\)/);
    });

    it('uses network-first for stable URLs and cache-first for hashed assets', () => {
        expect(swSource).toContain('isImmutableAsset');
        expect(swSource).toContain("/assets/");
    });
});

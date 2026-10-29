#!/usr/bin/env node
/**
 * Generate a phonics word card for every word in the curriculum.
 *
 * The repository shipped artwork for only 4 of the 130 words; the other 126
 * were `.placeholder` stubs, so the picture feature was empty in production
 * for 96 % of the curriculum.
 *
 * This script writes one themed SVG card per word:
 *
 *   - if real raster artwork exists for the word (including under a
 *     decorated filename), the card embeds that artwork;
 *   - otherwise the card is a designed phonics card: the letter in a gold
 *     "planet" disc over the word, in the game's own space palette.
 *
 * The card is an SVG rather than a PNG so it stays crisp on the 4K
 * classroom boards, weighs a few hundred bytes, and needs no font
 * rasterisation toolchain.
 *
 * Usage:  node scripts/generate-word-cards.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PHONICS_FUN_LETTER_DATA } from '../js/letter-data.js';
import { IMAGE_FILENAME_ALIASES } from '../js/asset-paths.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_IMAGES = path.join(ROOT, 'public', 'images');

const CARD_SIZE = 512;

/** Deterministic pseudo-random so regenerating produces identical output. */
function seededRandom(seed) {
    let value = seed;
    return () => {
        value = (value * 1664525 + 1013904223) % 4294967296;
        return value / 4294967296;
    };
}

function hashString(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

/** The gold/teal palettes the game already uses. */
const PALETTES = {
    gold: ['#fff4ba', '#ffd15c', '#ff8a3d', '#ff5f45'],
    teal: ['#b6f7ea', '#3bd0b0', '#1f9c86'],
    sky: ['#b6f7ea', '#3bd0b0', '#1f9c86'],
};

/**
 * Find real raster artwork for a word, if any.
 * @param {string} letter
 * @param {string} word
 * @returns {string|null} absolute path
 */
function findRealArtwork(letter, word) {
    const dir = path.join(
        PUBLIC_IMAGES,
        `${letter}-${letter.toLowerCase()}`,
        'Images',
    );

    const candidates = [`${word}.png`];
    const alias = IMAGE_FILENAME_ALIASES[word.toLowerCase()];
    if (alias) candidates.push(alias);

    for (const name of candidates) {
        const full = path.join(dir, name);
        if (fs.existsSync(full) && fs.statSync(full).size > 0) {
            return full;
        }
    }
    return null;
}

/**
 * A designed phonics card: a flat mission panel with the letter and the word.
 *
 * An earlier revision drew the letter on a gold sphere, which at gameplay
 * opacity read as a GIANT PLANET — a child could have mistaken the word
 * card for a tap target. A flat, bordered panel is unmistakably UI.
 */
function renderCard(letter, word) {
    const random = seededRandom(hashString(`${letter}${word}`));
    const stars = [];
    for (let i = 0; i < 18; i++) {
        const cx = Math.round(random() * CARD_SIZE);
        const cy = Math.round(random() * CARD_SIZE);
        const r = (1 + random() * 1.4).toFixed(1);
        const opacity = (0.25 + random() * 0.4).toFixed(2);
        stars.push(
            `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" opacity="${opacity}"/>`,
        );
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_SIZE} ${CARD_SIZE}" width="${CARD_SIZE}" height="${CARD_SIZE}" role="img" aria-label="${letter} is for ${word}">
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#12254b" stop-opacity="0.78"/>
      <stop offset="1" stop-color="#0c1630" stop-opacity="0.62"/>
    </linearGradient>
  </defs>

  <rect width="${CARD_SIZE}" height="${CARD_SIZE}" fill="none"/>
  ${stars.join('')}

  <rect x="26" y="26" width="460" height="460" rx="56" fill="url(#panel)"/>
  <rect x="26" y="26" width="460" height="460" rx="56" fill="none"
        stroke="#ffd15c" stroke-opacity="0.5" stroke-width="4"/>

  <text x="256" y="228" text-anchor="middle"
        font-family="'Arial Rounded MT Bold','Trebuchet MS',Verdana,sans-serif"
        font-size="188" font-weight="900" fill="#ffd15c">${letter}</text>

  <rect x="176" y="308" width="160" height="4" rx="2" fill="#ffd15c" opacity="0.6"/>

  <text x="256" y="398" text-anchor="middle"
        font-family="'Arial Rounded MT Bold','Trebuchet MS',Verdana,sans-serif"
        font-size="66" font-weight="900" fill="#f9f4e8">${word}</text>
</svg>
`;
}

/** A card that presents real artwork, framed in the game's palette. */
function renderArtworkCard(letter, word, artworkPath) {
    const pngBase64 = fs.readFileSync(artworkPath).toString('base64');
    const dataUri = `data:image/png;base64,${pngBase64}`;

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${CARD_SIZE} ${CARD_SIZE}" width="${CARD_SIZE}" height="${CARD_SIZE}" role="img" aria-label="${letter} is for ${word}">
  <defs>
    <radialGradient id="frame" cx="0.5" cy="0.5" r="0.7">
      <stop offset="0" stop-color="#0c1630" stop-opacity="0.82"/>
      <stop offset="1" stop-color="#0c1630" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${CARD_SIZE}" height="${CARD_SIZE}" fill="url(#frame)"/>
  <image x="26" y="26" width="460" height="460"
         preserveAspectRatio="xMidYMid meet"
         xlink:href="${dataUri}" href="${dataUri}"/>
  <rect x="8" y="8" width="496" height="496" rx="40" fill="none"
        stroke="#ffd15c" stroke-opacity="0.35" stroke-width="4"/>
</svg>
`;
}

let generated = 0;
let wrapped = 0;
let missing = 0;

for (const [letter, words] of Object.entries(PHONICS_FUN_LETTER_DATA)) {
    const dir = path.join(
        PUBLIC_IMAGES,
        `${letter}-${letter.toLowerCase()}`,
        'Images',
    );
    fs.mkdirSync(dir, { recursive: true });

    for (const word of words) {
        const artwork = findRealArtwork(letter, word);
        const svg = artwork
            ? renderArtworkCard(letter, word, artwork)
            : renderCard(letter, word);

        fs.writeFileSync(path.join(dir, `${word}.svg`), svg, 'utf8');
        generated++;
        if (artwork) wrapped++;
        else missing++;
    }
}

console.log(
    `Generated ${generated} word cards (${wrapped} wrapping real artwork, ` +
        `${missing} designed cards).`,
);

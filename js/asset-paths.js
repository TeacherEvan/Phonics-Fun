/**
 * Asset URL builders — the single place that knows how static assets are addressed.
 *
 * Vite serves everything in `public/` from the deploy root, so a file at
 * `public/images/A-a/Images/apple.png` is reachable at `/images/A-a/Images/apple.png`.
 * The previous code built `Assets/images/...`, which only ever worked on the
 * Vite dev server (it serves arbitrary files from the project root) and 404'd
 * in every production build.
 *
 * @module asset-paths
 */

/** Root under which `public/` is served. */
export const PUBLIC_ROOT = '/';

/**
 * Filename aliases for words whose artwork ships under a decorated name.
 * The picture vocabulary names the file `<word>.png`, but only some words have
 * real artwork and some of it was committed as `<name>-clipart-<size>.png`.
 * @type {Readonly<Record<string, string>>}
 */
export const IMAGE_FILENAME_ALIASES = Object.freeze({
    goat: 'goat-clipart-md(1).png',
    gold: 'pot-with-gold-clipart-md.png',
    girl: 'girl-clipart-lg.png',
    yoga: 'yoga-girl-clipart-md.png',
});

/**
 * The directory that holds a letter's picture words.
 * @param {string} letter
 * @returns {string} e.g. `/images/A-a/Images/`
 */
export function imageDirFor(letter) {
    const upper = String(letter ?? '').toUpperCase();
    return `${PUBLIC_ROOT}images/${upper}-${upper.toLowerCase()}/Images/`;
}

/**
 * The canonical picture URL for a letter/word pair.
 * @param {string} letter
 * @param {string} word
 * @returns {string}
 */
export function imagePathFor(letter, word) {
    return `${imageDirFor(letter)}${word}.png`;
}

/**
 * Every URL that could serve the picture for a letter/word pair, most
 * canonical first.
 *
 * A generated word card (`.svg`) is listed first because one exists for
 * every word in the curriculum; when the card wraps real artwork it is
 * rendered instead of the card design. The raster original and the
 * decorated-name alias follow as fallbacks.
 *
 * @param {string} letter
 * @param {string} word
 * @returns {string[]}
 */
export function imagePathCandidates(letter, word) {
    const dir = imageDirFor(letter);
    const candidates = [`${dir}${word}.svg`, `${dir}${word}.png`];
    const alias = IMAGE_FILENAME_ALIASES[String(word ?? '').toLowerCase()];
    if (alias) {
        candidates.push(`${dir}${alias}`);
    }
    return candidates;
}

/**
 * The URL for a named sound effect or voice asset.
 *
 * Only a small set of sound effects is shipped; anything else returns `null`
 * so callers can fall back (speechSynthesis for voices, synthesis for phonemes).
 *
 * @param {string} id e.g. `background-music`, `explosion`, `phoneme-g`, `voice-apple`
 * @param {string} [voiceTemplate='british-female']
 * @returns {string|null}
 */
export function soundPathFor(id, voiceTemplate = 'british-female') {
    if (!id) return null;
    if (id === 'background-music')
        return `${PUBLIC_ROOT}sounds/background-music.wav`;
    if (id === 'explosion') return `${PUBLIC_ROOT}sounds/explosion.wav`;
    if (id === 'celebration') return `${PUBLIC_ROOT}sounds/celebration.wav`;
    if (id.startsWith('phoneme-')) return `${PUBLIC_ROOT}sounds/${id}.wav`;
    if (id.startsWith('voice-')) {
        return `${PUBLIC_ROOT}sounds/voices/${voiceTemplate}/${id}.wav`;
    }
    return null;
}

/**
 * The voice pack directory for a template id.
 * @param {string} voiceTemplate
 * @returns {string}
 */
export function voiceDirFor(voiceTemplate = 'british-female') {
    return `${PUBLIC_ROOT}sounds/voices/${voiceTemplate}/`;
}

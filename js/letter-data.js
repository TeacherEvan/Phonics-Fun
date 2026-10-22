/**
 * Canonical phonics vocabulary — the single source of truth for letters and words.
 *
 * Previously this table lived in `js/main.js` and was published on `window`.
 * That forced `AudioManager` and `PerformanceUtils` to reach around the module
 * graph via `window.PHONICS_FUN_LETTER_DATA`, which produced three different
 * vocabulary shapes across the codebase. Import it instead.
 *
 * @module letter-data
 */

/**
 * A-Z letter -> five picture words.
 * @type {Readonly<Record<string, readonly string[]>>}
 */
export const PHONICS_FUN_LETTER_DATA = Object.freeze({
    A: ['apple', 'ant', 'airplane', 'alligator', 'arrow'],
    B: ['ball', 'bat', 'bear', 'boat', 'butterfly'],
    C: ['cat', 'car', 'cake', 'cloud', 'crab'],
    D: ['dog', 'duck', 'drum', 'dinosaur', 'door'],
    E: ['elephant', 'egg', 'engine', 'elbow', 'earth'],
    F: ['fish', 'frog', 'flower', 'feather', 'firetruck'],
    G: ['grape', 'goat', 'gold', 'girl', 'grandpa'],
    H: ['hat', 'hen', 'house', 'helicopter', 'hippo'],
    I: ['igloo', 'insect', 'icecream', 'island', 'ink'],
    J: ['jellyfish', 'jam', 'jet', 'jacket', 'jungle'],
    K: ['kite', 'kangaroo', 'key', 'kitten', 'kettle'],
    L: ['lion', 'lamp', 'leaf', 'ladder', 'lemon'],
    M: ['moon', 'monkey', 'milk', 'mountain', 'mouse'],
    N: ['nest', 'nose', 'net', 'night', 'noodles'],
    O: ['octopus', 'orange', 'owl', 'ocean', 'oven'],
    P: ['pig', 'pen', 'pizza', 'planet', 'pumpkin'],
    Q: ['queen', 'quilt', 'quail', 'quarter', 'question'],
    R: ['rabbit', 'rainbow', 'robot', 'rocket', 'rose'],
    S: ['sun', 'snake', 'star', 'sock', 'sandwich'],
    T: ['tiger', 'train', 'tree', 'turtle', 'toothbrush'],
    U: ['umbrella', 'unicorn', 'up', 'urn', 'ukulele'],
    V: ['van', 'vase', 'vegetable', 'violin', 'volcano'],
    W: ['whale', 'window', 'watermelon', 'wagon', 'worm'],
    X: ['xylophone', 'xray', 'xerus', 'xmas', 'xenops'],
    Y: ['yacht', 'yak', 'yo-yo', 'yellow', 'yogurt'],
    Z: ['zebra', 'zipper', 'zoo', 'zero', 'zigzag'],
});

/**
 * Voice packs. `id` is the stable public identifier; `dir` is the folder name
 * under `public/sounds/voices/`. The Java module uses the same ids with `-`
 * replaced by `_` (see `AudioManager.normalizeTemplateId`).
 * @type {ReadonlyArray<{id: string, dir: string, name: string}>}
 */
export const VOICE_TEMPLATES = Object.freeze([
    { id: 'american-male', dir: 'american-male', name: 'American Male' },
    { id: 'american-female', dir: 'american-female', name: 'American Female' },
    { id: 'british-female', dir: 'british-female', name: 'British Female' },
    { id: 'british-male', dir: 'british-male', name: 'British Male' },
]);

/** Letters that ship real prerecorded voice assets. Others use speechSynthesis. */
export const RECORDED_ASSET_LETTERS = Object.freeze(['G']);

/**
 * The five picture words for a letter.
 * @param {string} letter
 * @returns {readonly string[]} empty array for unknown letters
 */
export function getWords(letter) {
    if (!letter) return [];
    return PHONICS_FUN_LETTER_DATA[String(letter).toUpperCase()] ?? [];
}

/**
 * Rich vocabulary entries consumed by the gameplay layer.
 * @param {string} letter
 * @returns {{letter: string, word: string, audioKey: string}[]}
 */
export function getVocabulary(letter) {
    const upper = String(letter ?? '').toUpperCase();
    return getWords(upper).map((word) => ({
        letter: upper,
        word,
        audioKey: `voice-${word}`,
    }));
}

/**
 * All letters that have a vocabulary.
 * @returns {string[]}
 */
export function getEnabledLetters() {
    return Object.keys(PHONICS_FUN_LETTER_DATA);
}
